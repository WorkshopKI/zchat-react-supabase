import React, { useState } from 'react';
import { ChevronDown, Settings2 } from 'lucide-react';
import { useModelFilter } from '../hooks/useModelFilter';
import ModelFilterPanel from './ModelFilterPanel';
import { OpenRouterModel, LMStudioModel } from '../types';

interface EnhancedModelSelectorProps {
  selectedProvider: 'lmstudio' | 'openrouter';
  selectedModel: string;
  onProviderChange: (provider: 'lmstudio' | 'openrouter') => void;
  onModelChange: (model: string) => void;
  lmstudioModels: LMStudioModel[];
  openrouterModels: OpenRouterModel[];
  onReloadModels: (provider: 'lmstudio' | 'openrouter') => void;
  isLoading?: boolean;
}

/**
 * Enhanced model selector with filtering capabilities
 * Combines provider selection with advanced model filtering
 */
const EnhancedModelSelector: React.FC<EnhancedModelSelectorProps> = ({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  lmstudioModels,
  openrouterModels,
  onReloadModels,
  isLoading = false,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  
  // Use filtering hook for OpenRouter models
  const {
    filter,
    filteredModels,
    updateSearchQuery,
    resetFilters,
    toggleProvider,
  } = useModelFilter({ models: openrouterModels });

  // Get current models based on selected provider
  const currentModels = selectedProvider === 'lmstudio' 
    ? lmstudioModels.map(m => ({ id: m.id, name: m.name, provider: 'local', visible: true }))
    : filteredModels;

  const allModels = selectedProvider === 'lmstudio' ? lmstudioModels : openrouterModels;

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
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                LMStudio
              </span>
            </div>
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
              Local models
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
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                OpenRouter
              </span>
            </div>
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
              Cloud models
            </p>
          </button>
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Model
          </label>
          
          {/* Filter toggle for OpenRouter */}
          {selectedProvider === 'openrouter' && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Settings2 className="h-3 w-3" />
              <span>Filters</span>
            </button>
          )}
        </div>

        {/* Filter Panel (OpenRouter only) */}
        {selectedProvider === 'openrouter' && showFilters && (
          <div className="mb-4">
            <ModelFilterPanel
              providers={filter.providers}
              searchQuery={filter.searchQuery}
              onProviderToggle={toggleProvider}
              onSearchChange={updateSearchQuery}
              onReset={resetFilters}
              totalModels={openrouterModels.length}
              filteredModels={filteredModels.length}
            />
          </div>
        )}

        {/* Model Dropdown */}
        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="">
              {isLoading ? 'Loading models...' : 'Select a model'}
            </option>
            {currentModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
                {selectedProvider === 'openrouter' && model.provider && 
                  ` (${model.provider})`
                }
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Model count and reload info */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {currentModels.length} of {allModels.length} models shown
          </span>
          <button
            onClick={() => onReloadModels(selectedProvider)}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
          >
            {isLoading ? 'Reloading...' : 'Reload models'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedModelSelector;