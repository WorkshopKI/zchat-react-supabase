/**
 * Types for model filtering and management
 */

export interface ModelProvider {
  id: string;
  name: string;
  enabled: boolean;
}

export interface ModelFilter {
  providers: ModelProvider[];
  searchQuery: string;
}

export interface FilteredModel {
  id: string;
  name: string;
  provider: string;
  pricing?: {
    prompt: string;
    completion?: string;
  };
  context_length?: number;
  visible: boolean;
}

export const DEFAULT_PROVIDERS: ModelProvider[] = [
  { id: 'openai', name: 'OpenAI', enabled: true },
  { id: 'mistral', name: 'Mistral', enabled: true },
  { id: 'google', name: 'Google', enabled: true },
  { id: 'anthropic', name: 'Anthropic', enabled: true },
];