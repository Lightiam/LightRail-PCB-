/**
 * Anthropic Client
 * Implementation for Anthropic's Claude models
 */

import { BaseLLMClient } from './base.client';
import type { ModelConfig } from '../../../config/model.config';
import type {
  Message,
  CompletionResponse,
  StreamChunk,
  ChatOptions,
} from '../interfaces/llm.interface';
import { logger } from '../../../config/logging.config';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  id: string;
  content: Array<{ type: string; text: string }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicClient extends BaseLLMClient {
  readonly provider = 'anthropic';
  readonly modelId: string;
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ModelConfig) {
    super(config);
    this.modelId = config.modelId;
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com';

    if (!config.apiKey) {
      throw new Error('Anthropic API key is required');
    }
    this.apiKey = config.apiKey;
  }

  private async request<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async complete(prompt: string, options?: ChatOptions): Promise<CompletionResponse> {
    const messages: Message[] = [{ role: 'user', content: prompt }];
    return this.chat(messages, options);
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<CompletionResponse> {
    const startTime = Date.now();
    const mergedOptions = this.mergeOptions(options);

    return this.withRetry(async () => {
      const anthropicMessages: AnthropicMessage[] = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        }));

      const response = await this.request<AnthropicResponse>('/v1/messages', {
        model: this.modelId,
        messages: anthropicMessages,
        max_tokens: mergedOptions.maxTokens,
        temperature: mergedOptions.temperature,
        top_p: mergedOptions.topP,
        top_k: mergedOptions.topK,
        system: mergedOptions.systemPrompt,
        stop_sequences: mergedOptions.stopSequences,
      });

      const content = response.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('');

      logger.debug('Anthropic chat successful', {
        model: this.modelId,
        messageCount: messages.length,
        responseLength: content.length,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
      });

      return {
        content,
        model: this.modelId,
        latencyMs: Date.now() - startTime,
        usage: response.usage ? {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        } : undefined,
        finishReason: response.stop_reason as 'stop' | 'length' | undefined,
      };
    }, 'Anthropic chat');
  }

  async *streamComplete(
    prompt: string,
    options?: ChatOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const messages: Message[] = [{ role: 'user', content: prompt }];
    yield* this.streamChat(messages, options);
  }

  async *streamChat(
    messages: Message[],
    options?: ChatOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const mergedOptions = this.mergeOptions(options);

    const anthropicMessages: AnthropicMessage[] = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.modelId,
        messages: anthropicMessages,
        max_tokens: mergedOptions.maxTokens,
        temperature: mergedOptions.temperature,
        system: mergedOptions.systemPrompt,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta') {
              const text = parsed.delta?.text || '';
              if (text) {
                yield { content: text, done: false };
              }
            } else if (parsed.type === 'message_stop') {
              yield { content: '', done: true };
              return;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    yield { content: '', done: true };
  }
}
