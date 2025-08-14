import React from 'react';
import { RefreshCw } from 'lucide-react';
import { FilteredModel } from '../types/models';

interface ModelListProps {
  models: FilteredModel[];
  isLoading: boolean;
  onReload: () => void;
  title: string;
  emptyMessage: string;
  selectedModel?: string;
  onModelSelect?: (modelId: string) => void;
}

/**
 * Model list component with reload functionality
 * Displays filtered models with provider badges and pricing info
 */
const ModelList: React.FC<ModelListProps> = ({
  models,
  isLoading,
  onReload,
  title,
  emptyMessage,
  selectedModel,
  onModelSelect,
}) => {
  // Get provider color for compact badges
  const getProviderColor = (provider: string): string => {
    const colors: Record<string, string> = {
      openai: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      mistral: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      google: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      anthropic: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      local: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
    };
    return colors[provider] || colors.openai;
  };

  return (
    <div>
      {/* Header with reload button */}
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {title} ({models.length})
        </label>
        <button
          onClick={onReload}
          disabled={isLoading}
          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
          title="Reload models"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Loading...' : 'Reload'}</span>
        </button>
      </div>

      {/* Compact Model list */}
      <div className="max-h-80 overflow-y-auto">
        {models.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {models.map((model) => (
              <div
                key={model.id}
                onClick={() => onModelSelect?.(model.id)}
                className={`p-2 rounded border transition-colors ${
                  onModelSelect ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20' : ''
                } ${
                  selectedModel === model.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {model.name}
                      </h5>
                      <span className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded ${getProviderColor(model.provider)}`}>
                        {model.provider}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 mt-0.5">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate flex-1">
                        {model.id}
                      </p>
                      {model.context_length && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {model.context_length.toLocaleString()}k
                        </span>
                      )}
                      {model.pricing && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          ${model.pricing.prompt}/1K
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedModel === model.id && onModelSelect && (
                    <div className="ml-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelList;