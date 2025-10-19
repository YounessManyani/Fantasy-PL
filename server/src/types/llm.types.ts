export interface LLMConfig {
    enabled: boolean;
    provider: string;
    apiKey?: string;
    model: string;
    timeout: number;
    maxTokens: number;
  }
  
  export interface LLMResponse {
    success: boolean;
    content?: string;
    error?: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }
  
  export interface FunctionCall {
    name: string;
    arguments: Record<string, any>;
  }
  
  export interface LLMMessage {
    role: 'system' | 'user' | 'assistant' | 'function';
    content: string;
    name?: string;
    functionCall?: FunctionCall;
  }