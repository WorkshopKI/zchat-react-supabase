import { supabase } from './supabase';

// ==============================================
// TYPES AND INTERFACES
// ==============================================

export interface UserSettings {
  defaultProvider: 'lmstudio' | 'openrouter';
  defaultModel: string;
  lmstudioUrl: string;
  openrouterApiKey: string;
  openrouterUrl: string;
  maxContextLength: number;
}

export interface DatabaseSettings {
  default_provider: 'lmstudio' | 'openrouter';
  default_model: string;
  lmstudio_url: string;
  openrouter_api_key: string;
  openrouter_url: string;
  max_context_length: number;
}

// ==============================================
// CONSTANTS
// ==============================================

export const defaultSettings: UserSettings = {
  defaultProvider: 'lmstudio',
  defaultModel: '',
  lmstudioUrl: 'http://localhost:1234',
  openrouterApiKey: '',
  openrouterUrl: 'https://openrouter.ai/api/v1',
  maxContextLength: 30000,
};

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Simple base64 encoding/decoding for API key obfuscation
 * Note: This provides basic obfuscation, not cryptographic security
 */
const encryptApiKey = (key: string): string => {
  return key ? btoa(key) : '';
};

const decryptApiKey = (encryptedKey: string): string => {
  if (!encryptedKey) return '';
  try {
    return atob(encryptedKey);
  } catch {
    return '';
  }
};

/**
 * Convert database format (snake_case) to frontend format (camelCase)
 */
const toCamelCase = (dbSettings: DatabaseSettings): UserSettings => ({
  defaultProvider: dbSettings.default_provider,
  defaultModel: dbSettings.default_model,
  lmstudioUrl: dbSettings.lmstudio_url,
  openrouterApiKey: decryptApiKey(dbSettings.openrouter_api_key),
  openrouterUrl: dbSettings.openrouter_url,
  maxContextLength: dbSettings.max_context_length,
});

// ==============================================
// CORE API FUNCTIONS
// ==============================================

/**
 * Get user settings from database
 */
export const getUserSettings = async (): Promise<UserSettings> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .rpc('get_user_settings', { user_uuid: user.id });

    if (error) {
      console.error('Error fetching user settings:', error);
      return defaultSettings;
    }

    if (!data || data.length === 0) {
      return defaultSettings;
    }

    return toCamelCase(data[0]);
  } catch (error) {
    console.error('Error in getUserSettings:', error);
    return defaultSettings;
  }
};

/**
 * Update user settings in database
 */
export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Prepare parameters for database function
    const params: Record<string, any> = { user_uuid: user.id };

    // Map frontend settings to database parameters
    if (settings.defaultProvider !== undefined) params.p_default_provider = settings.defaultProvider;
    if (settings.defaultModel !== undefined) params.p_default_model = settings.defaultModel;
    if (settings.lmstudioUrl !== undefined) params.p_lmstudio_url = settings.lmstudioUrl;
    if (settings.openrouterApiKey !== undefined) {
      params.p_openrouter_api_key = encryptApiKey(settings.openrouterApiKey);
    }
    if (settings.openrouterUrl !== undefined) params.p_openrouter_url = settings.openrouterUrl;
    if (settings.maxContextLength !== undefined) params.p_max_context_length = settings.maxContextLength;

    const { error } = await supabase.rpc('upsert_user_settings', params);

    if (error) {
      console.error('Error updating user settings:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserSettings:', error);
    return false;
  }
};

/**
 * Reset user settings to defaults
 */
export const resetUserSettings = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error resetting user settings:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in resetUserSettings:', error);
    return false;
  }
};

/**
 * Get OpenRouter API key for API usage
 */
export const getOpenRouterApiKey = async (): Promise<string> => {
  const settings = await getUserSettings();
  return settings.openrouterApiKey;
};