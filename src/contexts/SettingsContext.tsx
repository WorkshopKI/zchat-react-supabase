import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserSettings, updateUserSettings, resetUserSettings as resetSettings, UserSettings, defaultSettings } from '../lib/settings';
import { useAuth } from './AuthContext';

// Settings interface now extends UserSettings and includes theme (kept in localStorage)
interface Settings extends UserSettings {
  theme: 'light' | 'dark';
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoading: boolean;
}

const defaultSettingsWithTheme: Settings = {
  ...defaultSettings,
  theme: 'light',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettingsWithTheme);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  // Load theme from localStorage
  const getThemeFromStorage = (): 'light' | 'dark' => {
    try {
      const stored = localStorage.getItem('zchat-theme');
      return (stored as 'light' | 'dark') || 'light';
    } catch {
      return 'light';
    }
  };

  // Save theme to localStorage
  const saveThemeToStorage = (theme: 'light' | 'dark') => {
    try {
      localStorage.setItem('zchat-theme', theme);
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  };

  // Migrate settings from localStorage to server (one-time)
  const migrateLocalStorageSettings = async () => {
    try {
      const oldSettingsKey = 'chatgpt-clone-settings';
      const oldSettings = localStorage.getItem(oldSettingsKey);
      
      if (oldSettings) {
        const parsed = JSON.parse(oldSettings);
        console.log('Migrating settings from localStorage to server...');
        
        // Extract settings that should be stored server-side
        const serverSettings = {
          defaultProvider: parsed.defaultProvider,
          defaultModel: parsed.defaultModel,
          lmstudioUrl: parsed.lmstudioUrl,
          openrouterApiKey: parsed.openrouterApiKey,
          openrouterUrl: parsed.openrouterUrl,
          maxContextLength: parsed.maxContextLength,
        };
        
        // Save to server
        await updateUserSettings(serverSettings);
        
        // Keep theme in localStorage with new key
        if (parsed.theme) {
          saveThemeToStorage(parsed.theme);
        }
        
        // Remove old localStorage settings
        localStorage.removeItem(oldSettingsKey);
        console.log('Settings migration completed successfully');
      }
    } catch (error) {
      console.error('Error migrating localStorage settings:', error);
    }
  };

  // Load settings when auth is ready
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        
        // Always load theme from localStorage (no auth required)
        const theme = getThemeFromStorage();
        
        if (user) {
          // User is authenticated - try to migrate and load user settings
          try {
            // Only migrate if user is fully authenticated and we can verify connection
            await migrateLocalStorageSettings();
            const userSettings = await getUserSettings();
            
            setSettings({
              ...userSettings,
              theme,
            });
          } catch (migrationError) {
            console.error('Error during settings migration/loading:', migrationError);
            // If migration/loading fails, fall back to defaults but keep trying without blocking
            setSettings({
              ...defaultSettingsWithTheme,
              theme,
            });
            
            // Try to clear potentially corrupted localStorage settings that might be causing issues
            try {
              const oldSettingsKey = 'chatgpt-clone-settings';
              const oldSettings = localStorage.getItem(oldSettingsKey);
              if (oldSettings) {
                console.warn('Removing potentially corrupted old settings to prevent future issues');
                localStorage.removeItem(oldSettingsKey);
              }
            } catch (cleanupError) {
              console.error('Error cleaning up old settings:', cleanupError);
            }
          }
        } else {
          // No user - use defaults with stored theme
          setSettings({
            ...defaultSettingsWithTheme,
            theme,
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        // Fallback to defaults with stored theme
        setSettings({
          ...defaultSettingsWithTheme,
          theme: getThemeFromStorage(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Only load settings when auth loading is complete
    if (!authLoading) {
      console.log(`[Settings] Auth ready, loading settings (user: ${user ? 'authenticated' : 'none'})`);
      loadSettings();
    } else {
      console.log('[Settings] Waiting for auth to complete...');
    }
  }, [user, authLoading]);

  const updateSettings = async (updates: Partial<Settings>) => {
    try {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);

      // Handle theme separately (localStorage)
      if (updates.theme) {
        saveThemeToStorage(updates.theme);
      }

      // Extract server-side settings (exclude theme)
      const { theme, ...serverSettings } = updates;
      if (Object.keys(serverSettings).length > 0) {
        const success = await updateUserSettings(serverSettings);
        if (!success) {
          // Revert on failure
          setSettings(settings);
          throw new Error('Failed to update settings on server');
        }
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      // Revert to previous settings on error
      setSettings(settings);
      throw error;
    }
  };

  const handleResetSettings = async () => {
    try {
      setIsLoading(true);
      const success = await resetSettings();
      if (success) {
        // Reset theme to default and save to localStorage
        saveThemeToStorage('light');
        setSettings(defaultSettingsWithTheme);
      } else {
        throw new Error('Failed to reset settings');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    settings,
    updateSettings,
    resetSettings: handleResetSettings,
    isLoading,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};