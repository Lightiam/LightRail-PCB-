/**
 * OpenAI Client
 * Implementation for OpenAI's GPT models
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

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIClient extends BaseLLMClient {
  readonly provider = 'openai';
  readonly modelId: string;
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ModelConfig) {
    super(config);
    this.modelId = config.modelId;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';

    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.apiKey = config.apiKey;
  }

  private async request<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async complete(prompt: string, options?: ChatOptions): Promise<CompletionResponse> {
    const messages: OpenAIMessage[] = [{ role: 'user', content: prompt }];
    if (options?.systemPrompt) {
      messages.unshift({ role: 'system', content: options.systemPrompt });
    }
    return this.chat(messages.map(m => ({ ...m, timestamp: new Date() })), options);
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<CompletionResponse> {
    const startTime = Date.now();
    const mergedOptions = this.mergeOptions(options);

    return this.withRetry(async () => {
      const openaiMessages: OpenAIMessage[] = [];

      if (mergedOptions.systemPrompt) {
        openaiMessages.push({ role: 'system', content: mergedOptions.systemPrompt });
      }

      openaiMessages.push(...messages.map(m => ({
        role: m.role,
        content: m.content,
      })));

      const response = await this.request<OpenAIResponse>('/chat/completions', {
        model: this.modelId,
        messages: openaiMessages,
        max_tokens: mergedOptions.maxTokens,
        temperature: mergedOptions.temperature,
        top_p: mergedOptions.topP,
        stop: mergedOptions.stopSequences,
      });

      const content = response.choices[0]?.message?.content || '';

      logger.debug('OpenAI chat successful', {
        model: this.modelId,
        messageCount: messages.length,
        responseLength: content.length,
        tokens: response.usage?.total_tokens,
      });

      return {
        content,
        model: this.modelId,
        latencyMs: Date.now() - startTime,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
        finishReason: response.choices[0]?.finish_reason as 'stop' | 'length' | undefined,
      };
    }, 'OpenAI chat');
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

    const openaiMessages: OpenAIMessage[] = [];
    if (mergedOptions.systemPrompt) {
      openaiMessages.push({ role: 'system', content: mergedOptions.systemPrompt });
    }
    openaiMessages.push(...messages.map(m => ({
      role: m.role,
      content: m.content,
    })));

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelId,
        messages: openaiMessages,
        max_tokens: mergedOptions.maxTokens,
        temperature: mergedOptions.temperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
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
          if (data === '[DONE]') {
            yield { content: '', done: true };
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              yield { content, done: false };
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
