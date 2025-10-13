import { LLMConfig } from '../types/llm.types';


export function loadLLMConfig(): LLMConfig {
  const enabled = process.env.USE_LLM === '1';
  const provider = process.env.LLM_PROVIDER || 'openai';
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.LLM_MODEL || 'gpt-4o-mini';

  return {
    enabled,
    provider,
    apiKey,
    model,
    timeout: Number(process.env.LLM_TIMEOUT) || 120000,
    maxTokens: Number(process.env.LLM_MAX_TOKENS) || 400
  };
}


export function validateLLMConfig(config: LLMConfig): void {
  if (!config.enabled) {
    return; 
  }

  const errors: string[] = [];

  if (!config.apiKey) {
    errors.push('OPENAI_API_KEY is required when USE_LLM=1');
  }

  if (config.timeout < 1000) {
    errors.push(`LLM_TIMEOUT too low: ${config.timeout}ms. Minimum is 1000ms.`);
  }

  if (config.maxTokens < 10 || config.maxTokens > 4000) {
    errors.push(`LLM_MAX_TOKENS out of range: ${config.maxTokens}. Must be between 10 and 4000.`);
  }

  if (!['openai', 'anthropic', 'ollama'].includes(config.provider)) {
    console.warn(`[LLM Config] Unknown provider: ${config.provider}`);
  }

  if (errors.length > 0) {
    throw new Error(`LLM configuration validation failed:\n${errors.join('\n')}`);
  }
}

export function getLLMProviderConfig(provider: string) {
  switch (provider) {
    case 'openai':
      return {
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        defaultModel: 'gpt-4o-mini',
        supportedModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
      };

    case 'anthropic':
      return {
        baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1',
        defaultModel: 'claude-3-5-sonnet-20241022',
        supportedModels: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229']
      };

    case 'ollama':
      return {
        baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        defaultModel: 'llama2',
        supportedModels: ['llama2', 'mistral', 'codellama']
      };

    default:
      return {
        baseURL: '',
        defaultModel: '',
        supportedModels: []
      };
  }
}