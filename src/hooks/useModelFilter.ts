import { useState, useCallback, useMemo } from 'react';
import { ModelFilter, FilteredModel, DEFAULT_PROVIDERS } from '../types/models';
import { OpenRouterModel } from '../types';

interface UseModelFilterProps {
  models: OpenRouterModel[];
}

interface UseModelFilterReturn {
  filter: ModelFilter;
  filteredModels: FilteredModel[];
  updateProviderFilter: (providerId: string, enabled: boolean) => void;
  updateSearchQuery: (query: string) => void;
  resetFilters: () => void;
  toggleProvider: (providerId: string) => void;
  enabledProviders: string[];
}

/**
 * Custom hook for managing model filtering functionality
 * Handles provider filtering, search, and model visibility logic
 */
export const useModelFilter = ({ models }: UseModelFilterProps): UseModelFilterReturn => {
  // Initialize filter state with default providers
  const [filter, setFilter] = useState<ModelFilter>(() => ({
    providers: DEFAULT_PROVIDERS,
    searchQuery: '',
  }));

  // Get list of enabled provider IDs
  const enabledProviders = useMemo(() => 
    filter.providers.filter(p => p.enabled).map(p => p.id),
    [filter.providers]
  );

  // Determine model provider based on model ID patterns
  const getModelProvider = useCallback((modelId: string): string => {
    const lowerModelId = modelId.toLowerCase();
    
    if (lowerModelId.includes('gpt') || lowerModelId.includes('openai')) return 'openai';
    if (lowerModelId.includes('mistral')) return 'mistral';
    if (lowerModelId.includes('gemini') || lowerModelId.includes('google')) return 'google';
    if (lowerModelId.includes('claude') || lowerModelId.includes('anthropic')) return 'anthropic';
    
    // Group other models under 'openai' for simplicity
    return 'openai';
  }, []);

  // Filter and transform models based on current filter state
  const filteredModels = useMemo(() => {
    return models.map(model => {
      const provider = getModelProvider(model.id);
      const isProviderEnabled = enabledProviders.includes(provider);
      const matchesSearch = filter.searchQuery === '' || 
        model.name.toLowerCase().includes(filter.searchQuery.toLowerCase()) ||
        model.id.toLowerCase().includes(filter.searchQuery.toLowerCase());
      
      return {
        id: model.id,
        name: model.name,
        provider,
        pricing: model.pricing,
        context_length: model.context_length,
        visible: isProviderEnabled && matchesSearch,
      };
    }).filter(model => model.visible);
  }, [models, enabledProviders, filter.searchQuery, getModelProvider]);

  // Update specific provider filter
  const updateProviderFilter = useCallback((providerId: string, enabled: boolean) => {
    setFilter(prev => ({
      ...prev,
      providers: prev.providers.map(provider =>
        provider.id === providerId ? { ...provider, enabled } : provider
      ),
    }));
  }, []);

  // Update search query
  const updateSearchQuery = useCallback((query: string) => {
    setFilter(prev => ({
      ...prev,
      searchQuery: query,
    }));
  }, []);

  // Reset all filters to default
  const resetFilters = useCallback(() => {
    setFilter({
      providers: DEFAULT_PROVIDERS,
      searchQuery: '',
    });
  }, []);

  // Toggle provider enabled state
  const toggleProvider = useCallback((providerId: string) => {
    setFilter(prev => ({
      ...prev,
      providers: prev.providers.map(provider =>
        provider.id === providerId ? { ...provider, enabled: !provider.enabled } : provider
      ),
    }));
  }, []);

  return {
    filter,
    filteredModels,
    updateProviderFilter,
    updateSearchQuery,
    resetFilters,
    toggleProvider,
    enabledProviders,
  };
};