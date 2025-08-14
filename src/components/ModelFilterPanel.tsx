import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { ModelProvider } from '../types/models';

interface ModelFilterPanelProps {
  providers: ModelProvider[];
  searchQuery: string;
  onProviderToggle: (providerId: string) => void;
  onSearchChange: (query: string) => void;
  onReset: () => void;
  totalModels: number;
  filteredModels: number;
}

/**
 * Model filtering panel component
 * Provides UI for filtering models by provider and search query
 */
const ModelFilterPanel: React.FC<ModelFilterPanelProps> = ({
  providers,
  searchQuery,
  onProviderToggle,
  onSearchChange,
  onReset,
  totalModels,
  filteredModels,
}) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-3">
      {/* Compact header with search and reset */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search models..."
            className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={onReset}
          className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          title="Reset filters"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>

      {/* Compact Provider Checkboxes - Single row */}
      <div className="flex items-center space-x-3">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
          Providers:
        </span>
        <div className="flex items-center space-x-3 flex-wrap">
          {providers.map((provider) => (
            <label
              key={provider.id}
              className="flex items-center space-x-1 text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 rounded px-1 py-0.5 transition-colors"
            >
              <input
                type="checkbox"
                checked={provider.enabled}
                onChange={() => onProviderToggle(provider.id)}
                className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-1"
              />
              <span className="text-gray-700 dark:text-gray-300">
                {provider.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Compact results summary */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {filteredModels} of {totalModels} models
      </div>
    </div>
  );
};

export default ModelFilterPanel;