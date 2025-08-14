import React, { useState, useEffect } from 'react';
import { ChevronDown, Wifi, WifiOff } from 'lucide-react';
import { lmstudioAPI } from '../lib/lmstudio';
import { openRouterAPI } from '../lib/openrouter';
import { LMStudioModel, OpenRouterModel } from '../types';
import { useSettings } from '../contexts/SettingsContext';

interface ModelSelectorProps {
  selectedProvider: 'lmstudio' | 'openrouter';
  selectedModel: string;
  onProviderChange: (provider: 'lmstudio' | 'openrouter') => void;
  onModelChange: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
}) => {
  const { settings } = useSettings();
  const [lmstudioModels, setLmstudioModels] = useState<LMStudioModel[]>([]);
  const [openrouterModels, setOpenrouterModels] = useState<OpenRouterModel[]>([]);
  const [lmstudioAvailable, setLmstudioAvailable] = useState(false);
  const [openrouterConfigured, setOpenrouterConfigured] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkProviders();
  }, []);

  useEffect(() => {
    if (selectedProvider === 'lmstudio' && lmstudioAvailable) {
      loadLMStudioModels();
    } else if (selectedProvider === 'openrouter' && openrouterConfigured) {
      loadOpenRouterModels();
    }
  }, [selectedProvider, lmstudioAvailable, openrouterConfigured]);

  const checkProviders = async () => {
    const lmstudioStatus = await lmstudioAPI.isAvailable();
    setLmstudioAvailable(lmstudioStatus);
    
    const openrouterStatus = settings.openrouterApiKey ? true : openRouterAPI.isConfigured();
    setOpenrouterConfigured(openrouterStatus);
  };

  const loadLMStudioModels = async () => {
    setLoading(true);
    try {
      const models = await lmstudioAPI.getModels();
      setLmstudioModels(models);
    } catch (error) {
      console.error('Error loading LMStudio models:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOpenRouterModels = async () => {
    setLoading(true);
    try {
      const models = await openRouterAPI.getModels();
      setOpenrouterModels(models.slice(0, 20)); // Limit to first 20 models
    } catch (error) {
      console.error('Error loading OpenRouter models:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentModels = selectedProvider === 'lmstudio' ? lmstudioModels : openrouterModels;

  return (
    <div className="space-y-4">
      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          AI Provider
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onProviderChange('lmstudio')}
            className={`p-3 rounded-lg border-2 transition-colors ${
              selectedProvider === 'lmstudio'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
            disabled={!lmstudioAvailable}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${
                lmstudioAvailable ? 'text-gray-900 dark:text-white' : 'text-gray-400'
              }`}>
                LMStudio
              </span>
              {lmstudioAvailable ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className={`text-xs mt-1 ${
              lmstudioAvailable ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'
            }`}>
              {lmstudioAvailable ? 'Local models' : 'Not available'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onProviderChange('openrouter')}
            className={`p-3 rounded-lg border-2 transition-colors ${
              selectedProvider === 'openrouter'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
            disabled={!openrouterConfigured}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${
                openrouterConfigured ? 'text-gray-900 dark:text-white' : 'text-gray-400'
              }`}>
                OpenRouter
              </span>
              {openrouterConfigured ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className={`text-xs mt-1 ${
              openrouterConfigured ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'
            }`}>
              {openrouterConfigured ? 'Cloud models' : 'Not configured'}
            </p>
          </button>
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Model
        </label>
        {loading ? (
          <div className="flex items-center justify-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-500">Loading models...</span>
          </div>
        ) : currentModels.length > 0 ? (
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
            >
              <option value="">Select a model</option>
              {currentModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                  {selectedProvider === 'openrouter' && (model as OpenRouterModel).pricing && (
                    ` - $${(model as OpenRouterModel).pricing?.prompt}/1K tokens`
                  )}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        ) : (
          <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedProvider === 'lmstudio' && !lmstudioAvailable
                ? 'LMStudio is not running or not available'
                : selectedProvider === 'openrouter' && !openrouterConfigured
                ? 'OpenRouter API key not configured'
                : 'No models available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelSelector;