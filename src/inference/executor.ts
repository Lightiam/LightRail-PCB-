/**
 * Inference Executor
 * Centralized inference execution with caching and monitoring
 */

import type { LLMClient, Message, CompletionResponse, StreamChunk, ChatOptions } from '../core/interfaces/llm.interface';
import { createClient, getDefaultClient } from '../core/factory';
import type { ModelProvider } from '../../config/model.config';
import { logger } from '../../config/logging.config';

export interface ExecutionOptions extends ChatOptions {
  provider?: ModelProvider;
  cache?: boolean;
  cacheTTL?: number;
  retryOnError?: boolean;
  timeout?: number;
}

export interface ExecutionResult {
  response: CompletionResponse;
  cached: boolean;
  provider: string;
  model: string;
}

export interface StreamExecutionResult {
  stream: AsyncGenerator<StreamChunk, void, unknown>;
  provider: string;
  model: string;
}

interface CacheEntry {
  response: CompletionResponse;
  timestamp: number;
}

/**
 * Inference executor with caching and provider management
 */
export class InferenceExecutor {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultCacheTTL = 5 * 60 * 1000; // 5 minutes
  private activeRequests = 0;
  private requestHistory: Array<{ timestamp: number; latencyMs: number; provider: string }> = [];

  /**
   * Execute a completion request
   */
  async execute(
    prompt: string,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const client = this.getClient(options.provider);

    // Check cache
    if (options.cache !== false) {
      const cached = this.checkCache(prompt, options);
      if (cached) {
        logger.debug('Cache hit for prompt', { promptLength: prompt.length });
        return {
          response: cached,
          cached: true,
          provider: client.provider,
          model: client.modelId,
        };
      }
    }

    // Execute request
    const startTime = Date.now();
    this.activeRequests++;

    try {
      const response = await client.complete(prompt, options);

      // Store in cache
      if (options.cache !== false) {
        this.setCache(prompt, options, response, options.cacheTTL);
      }

      // Record metrics
      this.recordRequest(client.provider, response.latencyMs);

      return {
        response,
        cached: false,
        provider: client.provider,
        model: client.modelId,
      };
    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Execute a chat request
   */
  async executeChat(
    messages: Message[],
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const client = this.getClient(options.provider);

    // Generate cache key from messages
    const cacheKey = JSON.stringify(messages);

    // Check cache
    if (options.cache !== false) {
      const cached = this.checkCache(cacheKey, options);
      if (cached) {
        return {
          response: cached,
          cached: true,
          provider: client.provider,
          model: client.modelId,
        };
      }
    }

    // Execute request
    this.activeRequests++;

    try {
      const response = await client.chat(messages, options);

      // Store in cache
      if (options.cache !== false) {
        this.setCache(cacheKey, options, response, options.cacheTTL);
      }

      // Record metrics
      this.recordRequest(client.provider, response.latencyMs);

      return {
        response,
        cached: false,
        provider: client.provider,
        model: client.modelId,
      };
    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Execute a streaming completion
   */
  async *executeStream(
    prompt: string,
    options: ExecutionOptions = {}
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const client = this.getClient(options.provider);
    this.activeRequests++;

    try {
      yield* client.streamComplete(prompt, options);
    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Execute a streaming chat
   */
  async *executeChatStream(
    messages: Message[],
    options: ExecutionOptions = {}
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const client = this.getClient(options.provider);
    this.activeRequests++;

    try {
      yield* client.streamChat(messages, options);
    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Get execution metrics
   */
  getMetrics(): {
    activeRequests: number;
    cacheSize: number;
    recentRequests: number;
    averageLatency: number;
    requestsByProvider: Record<string, number>;
  } {
    const recentRequests = this.requestHistory.filter(
      r => Date.now() - r.timestamp < 60000
    );

    const requestsByProvider: Record<string, number> = {};
    let totalLatency = 0;

    for (const req of recentRequests) {
      requestsByProvider[req.provider] = (requestsByProvider[req.provider] || 0) + 1;
      totalLatency += req.latencyMs;
    }

    return {
      activeRequests: this.activeRequests,
      cacheSize: this.cache.size,
      recentRequests: recentRequests.length,
      averageLatency: recentRequests.length > 0 ? totalLatency / recentRequests.length : 0,
      requestsByProvider,
    };
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Cleared inference cache');
  }

  private getClient(provider?: ModelProvider): LLMClient {
    return provider ? createClient(provider) : getDefaultClient();
  }

  private getCacheKey(input: string, options: ExecutionOptions): string {
    const optionsKey = JSON.stringify({
      systemPrompt: options.systemPrompt,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
    });
    return `${input}::${optionsKey}`;
  }

  private checkCache(input: string, options: ExecutionOptions): CompletionResponse | null {
    const key = this.getCacheKey(input, options);
    const entry = this.cache.get(key);

    if (!entry) return null;

    const ttl = options.cacheTTL || this.defaultCacheTTL;
    if (Date.now() - entry.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  private setCache(
    input: string,
    options: ExecutionOptions,
    response: CompletionResponse,
    ttl?: number
  ): void {
    const key = this.getCacheKey(input, options);
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });

    // Prune old entries if cache is too large
    if (this.cache.size > 100) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]?.[0];
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  private recordRequest(provider: string, latencyMs: number): void {
    this.requestHistory.push({
      timestamp: Date.now(),
      latencyMs,
      provider,
    });

    // Keep only last 100 requests
    if (this.requestHistory.length > 100) {
      this.requestHistory = this.requestHistory.slice(-100);
    }
  }
}

// Singleton instance
let executorInstance: InferenceExecutor | null = null;

/**
 * Get the shared executor instance
 */
export function getExecutor(): InferenceExecutor {
  if (!executorInstance) {
    executorInstance = new InferenceExecutor();
  }
  return executorInstance;
}

/**
 * Execute a prompt using the default executor
 */
export async function execute(
  prompt: string,
  options?: ExecutionOptions
): Promise<ExecutionResult> {
  return getExecutor().execute(prompt, options);
}

/**
 * Execute a chat using the default executor
 */
export async function executeChat(
  messages: Message[],
  options?: ExecutionOptions
): Promise<ExecutionResult> {
  return getExecutor().executeChat(messages, options);
}
