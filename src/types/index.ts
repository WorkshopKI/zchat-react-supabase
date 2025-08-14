export interface User {
  id: string;
  email: string;
  created_at: string;
  role?: 'user' | 'admin';
}

export interface UserProfile {
  id: string;
  user_id: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  system_prompt?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseItem {
  id: string;
  project_id: string;
  title: string;
  content: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  title: string;
  project_id: string;
  model_provider: 'lmstudio' | 'openrouter';
  model_name: string;
  created_at: string;
  updated_at: string;
}

export interface ChatWithContext extends Chat {
  contextUsage: number;
  contextPercentage: number;
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface LMStudioModel {
  id: string;
  name: string;
  size?: string;
  status?: 'available' | 'loading' | 'error';
}

export interface OpenRouterModel {
  id: string;
  name: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
  context_length?: number;
}

export interface ChatProvider {
  type: 'lmstudio' | 'openrouter';
  sendMessage: (messages: Message[], model: string) => AsyncGenerator<string, void, unknown>;
  getModels: () => Promise<LMStudioModel[] | OpenRouterModel[]>;
}