import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, AlertCircle, CheckCircle, Wifi, WifiOff, Settings, User, Zap, Shield } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { lmstudioAPI } from '../../lib/lmstudio';
import { openRouterAPI } from '../../lib/openrouter';
import { LMStudioModel, OpenRouterModel } from '../../types';
import { useModelFilter } from '../../hooks/useModelFilter';
import ModelList from '../ModelList';
import ModelFilterPanel from '../ModelFilterPanel';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'general' | 'providers' | 'admin' | 'advanced';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, resetSettings, isLoading: settingsLoading } = useSettings();
  const { isAdmin } = useAuth();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [localSettings, setLocalSettings] = useState(settings);
  const [lmstudioModels, setLmstudioModels] = useState<LMStudioModel[]>([]);
  const [openrouterModels, setOpenrouterModels] = useState<OpenRouterModel[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<{
    lmstudio: 'idle' | 'testing' | 'success' | 'error';
    openrouter: 'idle' | 'testing' | 'success' | 'error';
  }>({
    lmstudio: 'idle',
    openrouter: 'idle',
  });
  const [testResults, setTestResults] = useState<{
    lmstudio: string;
    openrouter: string;
  }>({
    lmstudio: '',
    openrouter: '',
  });

  // Model filtering for OpenRouter
  const {
    filter,
    filteredModels,
    updateSearchQuery,
    resetFilters,
    toggleProvider,
  } = useModelFilter({ models: openrouterModels });

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (isOpen) {
      checkInitialConnections();
    }
  }, [isOpen]);

  const checkInitialConnections = async () => {
    const lmstudioAvailable = await lmstudioAPI.isAvailable();
    setConnectionStatus(prev => ({
      ...prev,
      lmstudio: lmstudioAvailable ? 'success' : 'error'
    }));

    const openrouterConfigured = openRouterAPI.isConfigured();
    setConnectionStatus(prev => ({
      ...prev,
      openrouter: openrouterConfigured ? 'success' : 'error'
    }));
  };

  const handleLocalChange = (key: keyof typeof localSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    try {
      await updateSettings(localSettings);
      if (localSettings.openrouterApiKey) {
        (openRouterAPI as any).apiKey = localSettings.openrouterApiKey;
      }
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const testLMStudioConnection = async () => {
    setConnectionStatus(prev => ({ ...prev, lmstudio: 'testing' }));
    setTestResults(prev => ({ ...prev, lmstudio: 'Testing connection...' }));

    try {
      const isAvailable = await lmstudioAPI.isAvailable();
      if (!isAvailable) {
        throw new Error('LMStudio server is not running or not accessible');
      }

      const models = await lmstudioAPI.getModels();
      setLmstudioModels(models);

      if (models.length === 0) {
        setConnectionStatus(prev => ({ ...prev, lmstudio: 'error' }));
        setTestResults(prev => ({ ...prev, lmstudio: 'Connected but no models loaded' }));
        return;
      }

      const testMessage = [{
        id: 'test',
        chat_id: 'test',
        role: 'user' as const,
        content: 'Hello, this is a test message. Please respond with "Connection successful".',
        created_at: new Date().toISOString(),
      }];

      await lmstudioAPI.getSimpleResponse(testMessage, models[0].id);
      
      setConnectionStatus(prev => ({ ...prev, lmstudio: 'success' }));
      setTestResults(prev => ({ 
        ...prev, 
        lmstudio: `✅ Connected • ${models.length} models available` 
      }));

    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, lmstudio: 'error' }));
      setTestResults(prev => ({ 
        ...prev, 
        lmstudio: `❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }));
    }
  };

  const testOpenRouterConnection = async () => {
    setConnectionStatus(prev => ({ ...prev, openrouter: 'testing' }));
    setTestResults(prev => ({ ...prev, openrouter: 'Testing connection...' }));

    try {
      if (!localSettings.openrouterApiKey) {
        throw new Error('OpenRouter API key is required');
      }

      const tempAPI = new (openRouterAPI.constructor as any)(localSettings.openrouterUrl, localSettings.openrouterApiKey);
      const models = await tempAPI.getModels();
      setOpenrouterModels(models);

      if (models.length === 0) {
        setConnectionStatus(prev => ({ ...prev, openrouter: 'error' }));
        setTestResults(prev => ({ ...prev, openrouter: 'API key valid but no models available' }));
        return;
      }

      const testModel = models.find((m: OpenRouterModel) => m.id.includes('gpt-3.5') || m.id.includes('llama')) || models[0];
      const testMessage = [{
        id: 'test',
        chat_id: 'test',
        role: 'user' as const,
        content: 'Hello, this is a test message. Please respond with "Connection successful".',
        created_at: new Date().toISOString(),
      }];

      await tempAPI.getSimpleResponse(testMessage, testModel.id);
      
      setConnectionStatus(prev => ({ ...prev, openrouter: 'success' }));
      setTestResults(prev => ({ 
        ...prev, 
        openrouter: `✅ Connected • ${models.length} models available` 
      }));

    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, openrouter: 'error' }));
      setTestResults(prev => ({ 
        ...prev, 
        openrouter: `❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }));
    }
  };

  const reloadModels = async (provider: 'lmstudio' | 'openrouter') => {
    if (provider === 'lmstudio') {
      await testLMStudioConnection();
    } else {
      await testOpenRouterConnection();
    }
  };

  const getStatusIcon = (status: 'idle' | 'testing' | 'success' | 'error') => {
    switch (status) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-400" />;
    }
  };

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'providers' as const, label: 'AI Providers', icon: Zap },
    ...(isAdmin ? [{ id: 'admin' as const, label: 'Admin', icon: Shield }] : []),
    { id: 'advanced' as const, label: 'Advanced', icon: User },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Settings</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          <nav className="p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 min-h-[500px]">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">General Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Default AI Provider
                      </label>
                      <select
                        value={localSettings.defaultProvider}
                        onChange={(e) => handleLocalChange('defaultProvider', e.target.value as 'lmstudio' | 'openrouter')}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="lmstudio">LMStudio (Local)</option>
                        <option value="openrouter">OpenRouter (Cloud)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Default Model
                      </label>
                      <input
                        type="text"
                        value={localSettings.defaultModel || 'Select from AI Providers tab'}
                        readOnly
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Configure models in the AI Providers tab.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'providers' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Providers</h3>
                  
                  {/* LMStudio */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">LMStudio (Local)</h4>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(connectionStatus.lmstudio)}
                        <button
                          onClick={testLMStudioConnection}
                          disabled={connectionStatus.lmstudio === 'testing'}
                          className="btn-secondary text-xs"
                        >
                          Test
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Server URL
                        </label>
                        <input
                          type="url"
                          value={localSettings.lmstudioUrl}
                          onChange={(e) => handleLocalChange('lmstudioUrl', e.target.value)}
                          placeholder="http://localhost:1234"
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
                        />
                      </div>

                      {testResults.lmstudio && (
                        <div className="p-2 bg-white dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300">
                          {testResults.lmstudio}
                        </div>
                      )}

                      {lmstudioModels.length > 0 && (
                        <ModelList
                          models={lmstudioModels.map(model => ({
                            id: model.id,
                            name: model.name,
                            provider: 'local',
                            visible: true
                          }))}
                          isLoading={connectionStatus.lmstudio === 'testing'}
                          onReload={() => reloadModels('lmstudio')}
                          title="Available Models"
                          emptyMessage="No models loaded."
                          selectedModel={localSettings.defaultProvider === 'lmstudio' ? localSettings.defaultModel : undefined}
                          onModelSelect={(modelId) => {
                            handleLocalChange('defaultProvider', 'lmstudio');
                            handleLocalChange('defaultModel', modelId);
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* OpenRouter */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">OpenRouter (Cloud)</h4>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(connectionStatus.openrouter)}
                        <button
                          onClick={testOpenRouterConnection}
                          disabled={connectionStatus.openrouter === 'testing' || !localSettings.openrouterApiKey}
                          className="btn-secondary text-sm"
                        >
                          Test
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            API URL
                          </label>
                          <input
                            type="url"
                            value={localSettings.openrouterUrl}
                            onChange={(e) => handleLocalChange('openrouterUrl', e.target.value)}
                            placeholder="https://openrouter.ai/api/v1"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            API Key
                          </label>
                          <input
                            type="password"
                            value={localSettings.openrouterApiKey}
                            onChange={(e) => handleLocalChange('openrouterApiKey', e.target.value)}
                            placeholder="sk-or-v1-..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                      </div>

                      {testResults.openrouter && (
                        <div className="p-2 bg-white dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300">
                          {testResults.openrouter}
                        </div>
                      )}

                      {openrouterModels.length > 0 && (
                        <div className="space-y-3">
                          <ModelFilterPanel
                            providers={filter.providers}
                            searchQuery={filter.searchQuery}
                            onProviderToggle={toggleProvider}
                            onSearchChange={updateSearchQuery}
                            onReset={resetFilters}
                            totalModels={openrouterModels.length}
                            filteredModels={filteredModels.length}
                          />

                          <ModelList
                            models={filteredModels}
                            isLoading={connectionStatus.openrouter === 'testing'}
                            onReload={() => reloadModels('openrouter')}
                            title="Available Models"
                            emptyMessage="No models match filters."
                            selectedModel={localSettings.defaultProvider === 'openrouter' ? localSettings.defaultModel : undefined}
                            onModelSelect={(modelId) => {
                              handleLocalChange('defaultProvider', 'openrouter');
                              handleLocalChange('defaultModel', modelId);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'admin' && isAdmin && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Admin Settings</h3>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <span className="font-medium text-orange-800 dark:text-orange-200">Administrator Access</span>
                    </div>
                    
                    <div className="text-sm text-orange-700 dark:text-orange-300 space-y-2">
                      <p>You have full administrative access to the system.</p>
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Upcoming Admin Features:</h4>
                        <ul className="space-y-1 text-xs">
                          <li>• User management and role assignment</li>
                          <li>• Global prompt template management</li>
                          <li>• System usage analytics and monitoring</li>
                          <li>• Organization-wide knowledge base settings</li>
                          <li>• API rate limiting and usage controls</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Advanced Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Context Length
                        {!isAdmin && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(User Level)</span>
                        )}
                      </label>
                      <input
                        type="number"
                        value={localSettings.maxContextLength}
                        onChange={(e) => handleLocalChange('maxContextLength', parseInt(e.target.value) || 30000)}
                        min="1000"
                        max={isAdmin ? "500000" : "200000"}
                        step="1000"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Maximum tokens for context. 
                        {isAdmin 
                          ? " Admins can set up to 500K tokens."
                          : " Users can set up to 200K tokens."
                        }
                      </p>
                    </div>

                    {/* Connection Status Summary */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Connection Status
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          {connectionStatus.lmstudio === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <WifiOff className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">LMStudio</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {connectionStatus.lmstudio === 'success' ? 'Connected' : 'Disconnected'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          {connectionStatus.openrouter === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <WifiOff className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">OpenRouter</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {connectionStatus.openrouter === 'success' ? 'Connected' : 'Disconnected'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-between">
              <button
                onClick={async () => {
                  try {
                    await resetSettings();
                    setLocalSettings(settings);
                  } catch (error) {
                    console.error('Failed to reset settings:', error);
                  }
                }}
                disabled={settingsLoading}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 text-sm"
              >
                Reset to Defaults
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  disabled={settingsLoading}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>Save Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;