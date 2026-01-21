/**
 * LLM Interface
 * Common interface for all LLM providers - prevents vendor lock-in
 */

import type { ModelConfig } from '../../../config/model.config';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

export interface StreamChunk {
  content: string;
  done: boolean;
  usage?: TokenUsage;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CompletionResponse {
  content: string;
  usage?: TokenUsage;
  finishReason?: 'stop' | 'length' | 'content_filter' | 'function_call';
  model: string;
  latencyMs: number;
}

export interface ChatOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  stream?: boolean;
}

export interface LLMClient {
  readonly provider: string;
  readonly modelId: string;
  readonly config: ModelConfig;

  /**
   * Send a single completion request
   */
  complete(prompt: string, options?: ChatOptions): Promise<CompletionResponse>;

  /**
   * Send a chat completion request with message history
   */
  chat(messages: Message[], options?: ChatOptions): Promise<CompletionResponse>;

  /**
   * Stream a completion response
   */
  streamComplete(
    prompt: string,
    options?: ChatOptions
  ): AsyncGenerator<StreamChunk, void, unknown>;

  /**
   * Stream a chat completion response
   */
  streamChat(
    messages: Message[],
    options?: ChatOptions
  ): AsyncGenerator<StreamChunk, void, unknown>;

  /**
   * Check if the client is properly configured and ready
   */
  isReady(): boolean;

  /**
   * Get current token count estimate for a text
   */
  estimateTokens(text: string): number;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  systemPrompt?: string;
  createdAt: Date;
  updatedAt: Date;

  sendMessage(content: string): Promise<CompletionResponse>;
  sendMessageStream(content: string): AsyncGenerator<StreamChunk, void, unknown>;
  getHistory(): Message[];
  clearHistory(): void;
}
