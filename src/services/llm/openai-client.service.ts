import OpenAI from 'openai';
import { LLMConfig, LLMResponse, LLMMessage } from '../../types';
import { createLogger } from '../../utils/logger.utils';

const logger = createLogger('OpenAIClient');

export interface IOpenAIClientService {
  chat(messages: LLMMessage[], options?: ChatOptions): Promise<LLMResponse>;
  isAvailable(): boolean;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  functions?: any[];
  functionCall?: 'auto' | 'none' | { name: string };
}

export class OpenAIClientService implements IOpenAIClientService {
  private client: OpenAI | null = null;

  constructor(private config: LLMConfig) {
    if (config.enabled && config.apiKey) {
      this.client = new OpenAI({ apiKey: config.apiKey });
      logger.info('OpenAI client initialized');
    } else {
      logger.warn('OpenAI client not initialized - missing API key');
    }
  }

  async chat(messages: LLMMessage[], options: ChatOptions = {}): Promise<LLMResponse> {
    if (!this.client) {
      return {
        success: false,
        error: 'OpenAI client not initialized'
      };
    }

    try {
      const response = await this.client.chat.completions.create({
        model: options.model || this.config.model,
        messages: messages as any,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens || this.config.maxTokens,
        ...(options.functions && { functions: options.functions }),
        ...(options.functionCall && { function_call: options.functionCall })
      });

      return {
        success: true,
        content: response.choices[0].message.content || undefined,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        }
      };
    } catch (error: any) {
      logger.error('OpenAI API error', error);
      return {
        success: false,
        error: error.message || 'Unknown OpenAI error'
      };
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }
}