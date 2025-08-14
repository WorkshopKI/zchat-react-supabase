import { LMStudioModel, Message } from '../types';

const LMSTUDIO_BASE_URL = import.meta.env.VITE_LMSTUDIO_URL || 'http://localhost:1234';

export class LMStudioAPI {
  private baseUrl: string;

  constructor(baseUrl: string = LMSTUDIO_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.warn('LMStudio not available:', error);
      return false;
    }
  }

  async getModels(): Promise<LMStudioModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data?.map((model: any) => ({
        id: model.id,
        name: model.id,
        status: 'available',
      })) || [];
    } catch (error) {
      console.error('Error fetching LMStudio models:', error);
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
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        throw new Error(`LMStudio API error: ${response.statusText}`);
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
      console.error('LMStudio API error:', error);
      yield 'Sorry, I encountered an error while processing your request.';
    }
  }

  async getSimpleResponse(messages: Message[], model: string): Promise<string> {
    const generator = this.sendMessage(messages, model, { stream: false });
    const result = await generator.next();
    return result.value || 'No response received';
  }
}

export const lmstudioAPI = new LMStudioAPI();