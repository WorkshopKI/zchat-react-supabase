/**
 * Utility functions for recovering from corrupted auth states
 * and localStorage issues that can cause infinite loading loops
 */

/**
 * Clear potentially corrupted Supabase auth data from localStorage
 */
export const clearCorruptedAuthData = () => {
  try {
    const keysToCheck = [];
    
    // Get all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keysToCheck.push(key);
      }
    }
    
    // Look for Supabase auth keys (they typically start with 'sb-')
    const supabaseKeys = keysToCheck.filter(key => 
      key.startsWith('sb-') && key.includes('auth-token')
    );
    
    if (supabaseKeys.length > 0) {
      console.warn('Clearing potentially corrupted Supabase auth tokens:', supabaseKeys);
      supabaseKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error clearing corrupted auth data:', error);
    return false;
  }
};

/**
 * Clear all app-specific localStorage data (emergency cleanup)
 */
export const clearAllAppData = () => {
  try {
    const appKeys = [
      'zchat-theme',
      'project-sort-preference',
      'chatgpt-clone-settings', // Old settings key
      'zchat-sidebar-width'
    ];
    
    console.warn('Emergency cleanup: clearing all app localStorage data');
    
    appKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`Removed localStorage key: ${key}`);
      }
    });
    
    // Also clear any Supabase auth tokens
    clearCorruptedAuthData();
    
    return true;
  } catch (error) {
    console.error('Error during emergency cleanup:', error);
    return false;
  }
};

/**
 * Check if localStorage is in a potentially corrupted state
 */
export const isLocalStorageCorrupted = (): boolean => {
  try {
    // Test basic localStorage functionality
    const testKey = 'zchat-test-' + Date.now();
    localStorage.setItem(testKey, 'test');
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    if (retrieved !== 'test') {
      return true;
    }
    
    // Check for suspicious old data that might cause issues
    const oldSettings = localStorage.getItem('chatgpt-clone-settings');
    if (oldSettings) {
      try {
        JSON.parse(oldSettings);
      } catch {
        // Old settings exist but are not valid JSON
        console.warn('Found corrupted old settings in localStorage');
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('localStorage corruption check failed:', error);
    return true;
  }
};

/**
 * Attempt to recover from auth/localStorage issues
 */
export const attemptAuthRecovery = (): boolean => {
  try {
    console.log('Attempting auth recovery...');
    
    if (isLocalStorageCorrupted()) {
      console.warn('localStorage corruption detected, attempting cleanup');
      clearCorruptedAuthData();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Auth recovery attempt failed:', error);
    return false;
  }
};