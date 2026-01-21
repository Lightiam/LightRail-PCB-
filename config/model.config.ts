/**
 * Model Configuration
 * Centralized configuration for all LLM providers
 */

export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'local';

export interface ModelConfig {
  provider: ModelProvider;
  modelId: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens: number;
  temperature: number;
  topP?: number;
  topK?: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface ProviderConfig {
  openai: ModelConfig;
  anthropic: ModelConfig;
  google: ModelConfig;
  local: ModelConfig;
}

export const defaultModelConfigs: ProviderConfig = {
  openai: {
    provider: 'openai',
    modelId: 'gpt-4-turbo-preview',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    baseUrl: 'https://api.openai.com/v1',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1,
    timeout: 60000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  anthropic: {
    provider: 'anthropic',
    modelId: 'claude-3-sonnet-20240229',
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    baseUrl: 'https://api.anthropic.com',
    maxTokens: 4096,
    temperature: 0.7,
    timeout: 60000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  google: {
    provider: 'google',
    modelId: 'gemini-pro',
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.API_KEY,
    maxTokens: 4096,
    temperature: 0.7,
    topK: 40,
    timeout: 60000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  local: {
    provider: 'local',
    modelId: 'llama-2-7b',
    baseUrl: import.meta.env.VITE_LOCAL_LLM_URL || 'http://localhost:11434',
    maxTokens: 2048,
    temperature: 0.7,
    timeout: 120000,
    retryAttempts: 2,
    retryDelay: 2000,
  },
};

export function getModelConfig(provider: ModelProvider): ModelConfig {
  return defaultModelConfigs[provider];
}

export function createModelConfig(
  provider: ModelProvider,
  overrides?: Partial<ModelConfig>
): ModelConfig {
  return {
    ...defaultModelConfigs[provider],
    ...overrides,
  };
}
