/**
 * Chat Panel Component
 * Complete chat interface with messages and input
 */

import React, { useRef, useEffect } from 'react';
import { Terminal, Monitor, Database, Command, Loader2 } from 'lucide-react';
import { ChatMessage, ChatMessageData } from './ChatMessage';
import { ChatInput } from './ChatInput';
import type { Schematic } from '../inference/parser';
import { appConfig } from '../../config/app.config';

interface ChatPanelProps {
  messages: ChatMessageData[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onSchematicSelect: (schematic: Schematic) => void;
}

const NEON_GREEN = appConfig.ui.primaryColor;

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onSchematicSelect,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="h-[45%] flex flex-col bg-[#080808] border border-zinc-800/50 rounded-2xl overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-b-0 rounded-b-none">
      {/* Chat Header */}
      <div className="px-6 py-3 border-b border-zinc-800/50 bg-black/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Terminal size={12} style={{ color: NEON_GREEN }} />
            <span
              className="text-[10px] font-mono font-bold uppercase tracking-widest"
              style={{ color: NEON_GREEN }}
            >
              Command Center
            </span>
          </div>
          <div className="h-3 w-[1px] bg-zinc-800" />
          <div className="flex items-center gap-4 text-[9px] font-mono text-zinc-500 uppercase tracking-tighter">
            <div className="flex items-center gap-1">
              <Monitor size={10} /> Latency: 42ms
            </div>
            <div className="flex items-center gap-1">
              <Database size={10} /> Buffer: 100%
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-1 h-3 bg-zinc-800 rounded-full" />
          ))}
        </div>
      </div>

      {/* Message Feed */}
      <div
        className="flex-1 overflow-y-auto px-8 py-6 space-y-8 scroll-smooth"
        ref={scrollRef}
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-10">
            <Command size={64} className="mb-4" style={{ color: NEON_GREEN }} />
            <span className="text-[12px] font-mono uppercase tracking-[0.5em]">
              Awaiting Instruction Set
            </span>
          </div>
        )}

        {messages.map((m, idx) => (
          <ChatMessage
            key={idx}
            message={m}
            onSchematicSelect={onSchematicSelect}
          />
        ))}

        {isLoading && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-2 px-2">
              <span
                className="text-[9px] font-mono font-bold uppercase tracking-widest animate-pulse"
                style={{ color: NEON_GREEN }}
              >
                PROCESSING...
              </span>
            </div>
            <div
              className="rounded-xl rounded-tl-none p-5 flex items-center gap-4 border"
              style={{
                backgroundColor: `${NEON_GREEN}08`,
                borderColor: `${NEON_GREEN}30`,
              }}
            >
              <Loader2
                size={16}
                className="animate-spin"
                style={{ color: NEON_GREEN }}
              />
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{
                      backgroundColor: NEON_GREEN,
                      animationDelay: `${-0.3 + i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={onSendMessage}
        disabled={isLoading}
      />
    </div>
  );
};
