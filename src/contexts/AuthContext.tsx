import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { attemptAuthRecovery, clearCorruptedAuthData } from '../utils/authRecovery';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authFailureCount, setAuthFailureCount] = useState(0);
  const [authResolved, setAuthResolved] = useState(false); // Prevent flip-flopping

  useEffect(() => {
    // Detect Safari for more aggressive timeout
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const authTimeoutMs = isSafari ? 3000 : 5000; // 3s for Safari, 5s for others
    
    console.log(`[Auth] Initializing auth (${isSafari ? 'Safari' : 'Other browser'}, timeout: ${authTimeoutMs}ms)`);
    
    // Create a timeout to prevent infinite loading
    const authTimeout = setTimeout(() => {
      console.warn(`[Auth] Timeout after ${authTimeoutMs}ms - proceeding without authentication`);
      setSession(null);
      setUser(null);
      setUserProfile(null);
      setLoading(false);
    }, authTimeoutMs);

    // Get initial session with error handling and fast-path checking
    const initializeAuth = async () => {
      const startTime = Date.now();
      console.log('[Auth] Starting auth initialization...');
      
      try {
        // Fast-path: Check if we have auth tokens in localStorage for quicker resolution
        const hasAuthTokens = Object.keys(localStorage).some(key => 
          key.startsWith('sb-') && key.includes('auth-token')
        );
        console.log(`[Auth] Found auth tokens in localStorage: ${hasAuthTokens}`);

        // For authenticated users (has tokens), try normal flow first
        // Only use circuit breaker for users without tokens who keep failing
        if (authFailureCount >= 3 && !hasAuthTokens) {
          console.warn('[Auth] Circuit breaker activated - no tokens and too many failures, proceeding without auth');
          setSession(null);
          setUser(null);
          setUserProfile(null);
          return;
        }

        console.log('[Auth] Calling supabase.auth.getSession()...');
        const sessionStart = Date.now();
        
        // Detect development mode for longer timeouts
        const isDevelopment = import.meta.env.DEV;
        const getSessionTimeoutMs = isDevelopment ? 10000 : 6000; // 10s dev, 6s prod
        
        // Create progressive timeout with warnings
        const sessionPromise = supabase.auth.getSession();
        
        // Warning at 3 seconds
        const warningTimeout = setTimeout(() => {
          console.warn('[Auth] getSession() taking longer than expected (3s), but continuing to wait...');
        }, 3000);
        
        // Final timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('getSession() timeout')), getSessionTimeoutMs);
        });
        
        let session, error;
        try {
          const result = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: any }, error: any };
          clearTimeout(warningTimeout);
          session = result.data.session;
          error = result.error;
          console.log(`[Auth] getSession() completed in ${Date.now() - sessionStart}ms`);
        } catch (timeoutError) {
          clearTimeout(warningTimeout);
          console.error(`[Auth] getSession() timed out after ${getSessionTimeoutMs}ms`);
          
          // Only clear tokens if they appear to be invalid
          // Check if tokens exist and look reasonable
          const authKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('sb-') && key.includes('auth-token')
          );
          
          if (authKeys.length > 0) {
            // Try to validate token structure before clearing
            let shouldClearTokens = false;
            for (const key of authKeys) {
              try {
                const tokenData = localStorage.getItem(key);
                if (tokenData) {
                  const parsed = JSON.parse(tokenData);
                  // If token looks malformed or very old, clear it
                  if (!parsed.access_token || !parsed.refresh_token) {
                    shouldClearTokens = true;
                    break;
                  }
                }
              } catch (parseError) {
                shouldClearTokens = true;
                break;
              }
            }
            
            if (shouldClearTokens) {
              console.warn('[Auth] Found malformed tokens, clearing them');
              clearCorruptedAuthData();
            } else {
              console.warn('[Auth] Tokens appear valid but getSession() timed out - proceeding without clearing');
            }
          }
          
          session = null;
          error = null;
        }
        
        if (error || (!session && error === null)) {
          // Handle both actual errors and timeout scenarios
          if (error) {
            console.error('[Auth] Session error:', error);
          } else {
            console.warn('[Auth] Session timeout - cleared corrupted tokens');
          }
          setAuthFailureCount(prev => prev + 1);
          
          // Retry logic for timeout scenarios
          if (!error && session === null && authFailureCount === 0) {
            console.log('[Auth] First timeout, attempting one retry...');
            try {
              const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();
              if (!retryError && retrySession) {
                console.log('[Auth] Retry successful');
                setSession(retrySession);
                setUser(retrySession.user);
                setAuthFailureCount(0);
                if (retrySession.user) {
                  await loadUserProfile(retrySession.user.id);
                }
                return;
              }
            } catch (retryError) {
              console.error('[Auth] Retry failed:', retryError);
            }
          }

          // For users without tokens, attempt recovery on first failure
          // For users with tokens, be less aggressive with recovery
          const shouldAttemptRecovery = hasAuthTokens ? authFailureCount === 0 : authFailureCount < 2;
          
          if (shouldAttemptRecovery && error) { // Only attempt recovery for actual errors, not timeouts
            console.log('[Auth] Attempting recovery...');
            const recoveryAttempted = attemptAuthRecovery();
            if (recoveryAttempted) {
              // Try once more after cleanup
              try {
                const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();
                if (!retryError && retrySession) {
                  console.log('[Auth] Recovery successful');
                  setSession(retrySession);
                  setUser(retrySession.user);
                  setAuthFailureCount(0); // Reset on success
                  if (retrySession.user) {
                    await loadUserProfile(retrySession.user.id);
                  }
                  return;
                }
              } catch (retryError) {
                console.error('[Auth] Retry after recovery failed:', retryError);
                setAuthFailureCount(prev => prev + 1);
              }
            }
          }
          
          // Clear potentially corrupted auth data and sign out
          clearCorruptedAuthData();
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setUserProfile(null);
        } else {
          // Success - reset failure count
          setAuthFailureCount(0);
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log(`[Auth] User authenticated: ${session.user.email}`);
            try {
              const profileStart = Date.now();
              await loadUserProfile(session.user.id);
              console.log(`[Auth] Profile loaded in ${Date.now() - profileStart}ms`);
            } catch (profileError) {
              console.error('[Auth] Error loading user profile:', profileError);
              // Continue without profile if it fails
            }
          } else {
            console.log('[Auth] No user session found');
            setUserProfile(null);
          }
        }
      } catch (initError) {
        console.error('Auth initialization error:', initError);
        setAuthFailureCount(prev => prev + 1);
        
        // If we've failed multiple times, activate circuit breaker
        if (authFailureCount >= 2) {
          console.warn('Multiple auth failures detected, clearing all auth data');
          clearCorruptedAuthData();
        }
        
        // Clear auth state on error
        setSession(null);
        setUser(null);
        setUserProfile(null);
      } finally {
        clearTimeout(authTimeout);
        const totalTime = Date.now() - startTime;
        console.log(`[Auth] Auth initialization completed in ${totalTime}ms`);
        setAuthResolved(true);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes with error handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Auth] Auth state change: ${event}, session: ${session ? 'present' : 'null'}`);
      try {
        // Don't override stable auth state during initialization unless it's a real change
        if (!authResolved && event === 'INITIAL_SESSION') {
          console.log('[Auth] Ignoring initial session event during initialization');
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            await loadUserProfile(session.user.id);
          } catch (profileError) {
            console.error('Error loading user profile during auth change:', profileError);
            // Continue without profile
          }
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error handling auth state change:', error);
        // Ensure loading is always set to false
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        
        // If profile doesn't exist, try to create it
        if (error.code === 'PGRST116') {
          console.log('User profile not found, attempting to create...');
          await createUserProfile(userId);
          return;
        }
        
        // For other errors, set a default profile in memory
        setUserProfile({
          id: 'default',
          user_id: userId,
          role: 'user', // Default to user role
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Set a default profile for any caught errors
      setUserProfile({
        id: 'default',
        user_id: userId,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  };

  const createUserProfile = async (userId: string) => {
    try {
      // Check if this is the first user (admin)
      const { count } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact' });

      const role = count === 0 ? 'admin' : 'user';

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([
          {
            user_id: userId,
            role: role,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      console.log('User profile created successfully:', data);
      setUserProfile(data);
    } catch (error) {
      console.error('Error creating user profile:', error);
      // Fall back to default profile
      setUserProfile({
        id: 'default',
        user_id: userId,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = userProfile?.role === 'admin';

  const value = {
    user,
    session,
    userProfile,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};