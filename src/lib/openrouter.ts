import { OpenRouterModel, Message } from '../types';
import { getOpenRouterApiKey } from './settings';

const OPENROUTER_BASE_URL = import.meta.env.VITE_OPENROUTER_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export class OpenRouterAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = OPENROUTER_BASE_URL, apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey || OPENROUTER_API_KEY || '';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getModels(): Promise<OpenRouterModel[]> {
    // Try to get API key from server if not already configured
    if (!this.apiKey) {
      try {
        this.apiKey = await getOpenRouterApiKey();
      } catch (error) {
        console.error('Failed to load OpenRouter API key:', error);
      }
    }

    if (!this.isConfigured()) {
      console.warn('OpenRouter API key not configured');
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data?.map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        pricing: model.pricing,
        context_length: model.context_length,
      })) || [];
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      return [];
    }
  }

  async *sendMessage(
    messages: Message[],
    model: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {}
  ): AsyncGenerator<string, void, unknown> {
    // Try to get API key from server if not already configured
    if (!this.apiKey) {
      try {
        this.apiKey = await getOpenRouterApiKey();
      } catch (error) {
        console.error('Failed to load OpenRouter API key:', error);
      }
    }

    if (!this.isConfigured()) {
      yield 'OpenRouter API key not configured. Please set your API key in the settings.';
      return;
    }

    const {
      temperature = 0.7,
      maxTokens = 2048,
      stream = true,
    } = options;

    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ZChat',
        },
        body: JSON.stringify({
          model,
          messages: conversationHistory,
          temperature,
          max_tokens: maxTokens,
          stream,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.statusText} - ${errorText}`);
      }

      if (stream && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') return;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    yield content;
                  }
                } catch (parseError) {
                  // Skip invalid JSON lines
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        // Non-streaming response
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        yield content;
      }
    } catch (error) {
      console.error('OpenRouter API error:', error);
      yield 'Sorry, I encountered an error while processing your request. Please check your OpenRouter API key and try again.';
    }
  }

  async getSimpleResponse(messages: Message[], model: string): Promise<string> {
    console.log('getSimpleResponse called with model:', model);
    console.log('Current API key configured:', !!this.apiKey);
    
    const generator = this.sendMessage(messages, model, { stream: false });
    const result = await generator.next();
    
    console.log('getSimpleResponse result:', result);
    return result.value || 'No response received';
  }

  async getUsage(): Promise<any> {
    // Try to get API key from server if not already configured
    if (!this.apiKey) {
      try {
        this.apiKey = await getOpenRouterApiKey();
      } catch (error) {
        console.error('Failed to load OpenRouter API key:', error);
      }
    }

    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/key`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching OpenRouter usage:', error);
      return null;
    }
  }
}

export const openRouterAPI = new OpenRouterAPI();