/**
 * Base LLM Client
 * Abstract base class with shared functionality for all LLM clients
 */

import type { ModelConfig } from '../../../config/model.config';
import { logger } from '../../../config/logging.config';
import type {
  LLMClient,
  Message,
  CompletionResponse,
  StreamChunk,
  ChatOptions,
} from '../interfaces/llm.interface';

export abstract class BaseLLMClient implements LLMClient {
  abstract readonly provider: string;
  abstract readonly modelId: string;

  constructor(public readonly config: ModelConfig) {}

  abstract complete(prompt: string, options?: ChatOptions): Promise<CompletionResponse>;
  abstract chat(messages: Message[], options?: ChatOptions): Promise<CompletionResponse>;
  abstract streamComplete(prompt: string, options?: ChatOptions): AsyncGenerator<StreamChunk, void, unknown>;
  abstract streamChat(messages: Message[], options?: ChatOptions): AsyncGenerator<StreamChunk, void, unknown>;

  isReady(): boolean {
    return !!this.config.apiKey || !!this.config.baseUrl;
  }

  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English
    return Math.ceil(text.length / 4);
  }

  protected async withRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        logger.warn(`${context} failed (attempt ${attempt}/${this.config.retryAttempts})`, {
          provider: this.provider,
          error: lastError.message,
        });

        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    logger.error(`${context} failed after all retries`, lastError!);
    throw lastError;
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected mergeOptions(options?: ChatOptions): ChatOptions {
    return {
      maxTokens: options?.maxTokens ?? this.config.maxTokens,
      temperature: options?.temperature ?? this.config.temperature,
      topP: options?.topP ?? this.config.topP,
      topK: options?.topK ?? this.config.topK,
      ...options,
    };
  }
}
