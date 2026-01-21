/**
 * useChat Hook
 * Manages chat state and LLM interactions
 */

import { useState, useCallback, useRef } from 'react';
import type { ChatMessageData } from '../components/ChatMessage';
import type { Schematic } from '../inference/parser';
import { parseSchematic } from '../inference/parser';
import { createClient } from '../core/factory';
import type { ModelProvider } from '../../config/model.config';
import { pcbTemplates, renderTemplate } from '../prompts';
import { logger } from '../../config/logging.config';

interface UseChatOptions {
  provider?: ModelProvider;
  onSchematicGenerated?: (schematic: Schematic) => void;
}

interface UseChatReturn {
  messages: ChatMessageData[];
  isLoading: boolean;
  currentSchematic: Schematic | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setCurrentSchematic: (schematic: Schematic | null) => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSchematic, setCurrentSchematic] = useState<Schematic | null>(null);

  const chatSessionRef = useRef<{
    history: Array<{ role: 'user' | 'model'; content: string }>;
  }>({ history: [] });

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const provider = options.provider || 'google';

    // Add user message
    const userMessage: ChatMessageData = {
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Add to history
    chatSessionRef.current.history.push({ role: 'user', content });

    try {
      const client = createClient(provider);
      const systemPrompt = renderTemplate(pcbTemplates.system, {});

      // Build messages for chat
      const chatMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...chatSessionRef.current.history.map(h => ({
          role: h.role === 'user' ? 'user' as const : 'assistant' as const,
          content: h.content,
        })),
      ];

      // Stream the response
      let fullResponse = '';
      const modelMessage: ChatMessageData = {
        role: 'model',
        content: '',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, modelMessage]);

      const stream = client.streamChat(chatMessages, {
        maxTokens: 4096,
        temperature: 0.7,
      });

      for await (const chunk of stream) {
        fullResponse += chunk.content;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: fullResponse,
          };
          return updated;
        });
      }

      // Add to history
      chatSessionRef.current.history.push({ role: 'model', content: fullResponse });

      // Try to parse schematic
      const parseResult = parseSchematic(fullResponse);
      if (parseResult.success && parseResult.data) {
        const schematic = parseResult.data;
        setCurrentSchematic(schematic);

        // Update message with schematic
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            schematic,
          };
          return updated;
        });

        options.onSchematicGenerated?.(schematic);

        logger.info('Schematic generated', {
          title: schematic.title,
          components: schematic.components.length,
          connections: schematic.connections.length,
        });
      }
    } catch (error) {
      logger.error('Chat error', error as Error);

      const errorMessage: ChatMessageData = {
        role: 'model',
        content: 'CRITICAL: UPLINK COLLAPSED. DIAGNOSTIC REQUIRED.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, options]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentSchematic(null);
    chatSessionRef.current.history = [];
  }, []);

  return {
    messages,
    isLoading,
    currentSchematic,
    sendMessage,
    clearMessages,
    setCurrentSchematic,
  };
}
