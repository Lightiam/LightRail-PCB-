/**
 * LLM Factory
 * Factory pattern to switch models without changing business logic
 */

import type { ModelProvider, ModelConfig } from '../../config/model.config';
import { getModelConfig, createModelConfig } from '../../config/model.config';
import type { LLMClient } from './interfaces/llm.interface';
import { GoogleClient } from './clients/google.client';
import { OpenAIClient } from './clients/openai.client';
import { AnthropicClient } from './clients/anthropic.client';
import { logger } from '../../config/logging.config';

type ClientConstructor = new (config: ModelConfig) => LLMClient;

const clientRegistry: Record<ModelProvider, ClientConstructor> = {
  google: GoogleClient,
  openai: OpenAIClient,
  anthropic: AnthropicClient,
  local: GoogleClient, // Placeholder - could be Ollama client
};

let defaultProvider: ModelProvider = 'google';
let clientCache: Map<string, LLMClient> = new Map();

/**
 * Create an LLM client for the specified provider
 */
export function createClient(
  provider: ModelProvider,
  configOverrides?: Partial<ModelConfig>
): LLMClient {
  const cacheKey = `${provider}-${JSON.stringify(configOverrides || {})}`;

  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }

  const config = createModelConfig(provider, configOverrides);
  const ClientClass = clientRegistry[provider];

  if (!ClientClass) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  try {
    const client = new ClientClass(config);
    clientCache.set(cacheKey, client);

    logger.info('Created LLM client', {
      provider,
      model: config.modelId,
    });

    return client;
  } catch (error) {
    logger.error('Failed to create LLM client', error as Error, { provider });
    throw error;
  }
}

/**
 * Get the default LLM client
 */
export function getDefaultClient(): LLMClient {
  return createClient(defaultProvider);
}

/**
 * Set the default provider
 */
export function setDefaultProvider(provider: ModelProvider): void {
  defaultProvider = provider;
  logger.info('Set default provider', { provider });
}

/**
 * Get the current default provider
 */
export function getDefaultProvider(): ModelProvider {
  return defaultProvider;
}

/**
 * Clear the client cache
 */
export function clearClientCache(): void {
  clientCache.clear();
  logger.debug('Cleared LLM client cache');
}

/**
 * Check which providers are available (have API keys configured)
 */
export function getAvailableProviders(): ModelProvider[] {
  const providers: ModelProvider[] = ['google', 'openai', 'anthropic', 'local'];

  return providers.filter(provider => {
    const config = getModelConfig(provider);
    return config.apiKey || config.baseUrl;
  });
}

/**
 * Register a custom client for a provider
 */
export function registerClient(
  provider: ModelProvider,
  ClientClass: ClientConstructor
): void {
  clientRegistry[provider] = ClientClass;
  logger.info('Registered custom client', { provider });
}
