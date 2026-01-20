/**
 * Google Gemini Client
 * Implementation for Google's Gemini models
 */

import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { BaseLLMClient } from './base.client';
import type { ModelConfig } from '../../../config/model.config';
import type {
  Message,
  CompletionResponse,
  StreamChunk,
  ChatOptions,
} from '../interfaces/llm.interface';
import { logger } from '../../../config/logging.config';

export class GoogleClient extends BaseLLMClient {
  readonly provider = 'google';
  readonly modelId: string;
  private client: GoogleGenAI;

  constructor(config: ModelConfig) {
    super(config);
    this.modelId = config.modelId;

    if (!config.apiKey) {
      throw new Error('Google API key is required');
    }

    this.client = new GoogleGenAI({ apiKey: config.apiKey });
  }

  async complete(prompt: string, options?: ChatOptions): Promise<CompletionResponse> {
    const startTime = Date.now();
    const mergedOptions = this.mergeOptions(options);

    return this.withRetry(async () => {
      const response = await this.client.models.generateContent({
        model: this.modelId,
        contents: prompt,
        config: {
          maxOutputTokens: mergedOptions.maxTokens,
          temperature: mergedOptions.temperature,
          topP: mergedOptions.topP,
          topK: mergedOptions.topK,
          stopSequences: mergedOptions.stopSequences,
        },
      });

      const text = response.text || '';

      logger.debug('Google completion successful', {
        model: this.modelId,
        promptLength: prompt.length,
        responseLength: text.length,
      });

      return {
        content: text,
        model: this.modelId,
        latencyMs: Date.now() - startTime,
        usage: response.usageMetadata ? {
          promptTokens: response.usageMetadata.promptTokenCount || 0,
          completionTokens: response.usageMetadata.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata.totalTokenCount || 0,
        } : undefined,
      };
    }, 'Google completion');
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<CompletionResponse> {
    const startTime = Date.now();
    const mergedOptions = this.mergeOptions(options);

    return this.withRetry(async () => {
      const chat = this.client.chats.create({
        model: this.modelId,
        config: {
          systemInstruction: mergedOptions.systemPrompt,
          maxOutputTokens: mergedOptions.maxTokens,
          temperature: mergedOptions.temperature,
          topP: mergedOptions.topP,
          topK: mergedOptions.topK,
        },
        history: messages.slice(0, -1).map(m => ({
          role: m.role === 'assistant' ? 'model' : m.role,
          parts: [{ text: m.content }],
        })),
      });

      const lastMessage = messages[messages.length - 1];
      const response = await chat.sendMessage({ message: lastMessage.content });
      const text = response.text || '';

      logger.debug('Google chat successful', {
        model: this.modelId,
        messageCount: messages.length,
        responseLength: text.length,
      });

      return {
        content: text,
        model: this.modelId,
        latencyMs: Date.now() - startTime,
      };
    }, 'Google chat');
  }

  async *streamComplete(
    prompt: string,
    options?: ChatOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const mergedOptions = this.mergeOptions(options);

    const stream = await this.client.models.generateContentStream({
      model: this.modelId,
      contents: prompt,
      config: {
        maxOutputTokens: mergedOptions.maxTokens,
        temperature: mergedOptions.temperature,
        topP: mergedOptions.topP,
        topK: mergedOptions.topK,
      },
    });

    for await (const chunk of stream) {
      const text = (chunk as GenerateContentResponse).text || '';
      yield {
        content: text,
        done: false,
      };
    }

    yield { content: '', done: true };
  }

  async *streamChat(
    messages: Message[],
    options?: ChatOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const mergedOptions = this.mergeOptions(options);

    const chat = this.client.chats.create({
      model: this.modelId,
      config: {
        systemInstruction: mergedOptions.systemPrompt,
        maxOutputTokens: mergedOptions.maxTokens,
        temperature: mergedOptions.temperature,
      },
      history: messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }],
      })),
    });

    const lastMessage = messages[messages.length - 1];
    const stream = await chat.sendMessageStream({ message: lastMessage.content });

    for await (const chunk of stream) {
      const text = (chunk as GenerateContentResponse).text || '';
      yield {
        content: text,
        done: false,
      };
    }

    yield { content: '', done: true };
  }
}
