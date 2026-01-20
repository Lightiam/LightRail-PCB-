/**
 * Chat Message Component
 * Renders individual chat messages with schematic indicators
 */

import React from 'react';
import { Code } from 'lucide-react';
import type { Schematic } from '../inference/parser';
import { appConfig } from '../../config/app.config';

export interface ChatMessageData {
  role: 'user' | 'model';
  content: string;
  schematic?: Schematic;
  timestamp: Date;
}

interface ChatMessageProps {
  message: ChatMessageData;
  onSchematicSelect?: (schematic: Schematic) => void;
}

const NEON_GREEN = appConfig.ui.primaryColor;

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSchematicSelect
}) => {
  const isUser = message.role === 'user';

  // Remove JSON code blocks from display content
  const displayContent = message.content.replace(/```json[\s\S]*?```/g, '').trim();

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      {/* Meta Tag */}
      <div className="flex items-center gap-2 mb-2 px-2">
        <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">
          {message.timestamp.toLocaleTimeString()}
        </span>
        <span
          className="text-[9px] font-mono font-bold uppercase tracking-widest"
          style={{ color: isUser ? '#9ca3af' : NEON_GREEN }}
        >
          {isUser ? 'OPERATOR' : 'LIGHTRAIL_CORE'}
        </span>
      </div>

      {/* Message Bubble */}
      <div
        className={`relative group max-w-[85%] rounded-xl p-5 font-mono text-[11px] leading-relaxed border transition-all ${
          isUser
            ? 'bg-zinc-900/40 border-zinc-800 text-zinc-300 rounded-tr-none'
            : 'rounded-tl-none'
        }`}
        style={isUser ? {} : {
          backgroundColor: `${NEON_GREEN}08`,
          borderColor: `${NEON_GREEN}30`,
          color: '#f4f4f5',
          boxShadow: `0 0 30px ${NEON_GREEN}05`,
        }}
      >
        {/* Tech Corners for AI messages */}
        {!isUser && (
          <div
            className="absolute top-0 right-0 w-4 h-4 border-t border-r"
            style={{ borderColor: `${NEON_GREEN}30` }}
          />
        )}

        {/* Message content */}
        <p className="whitespace-pre-wrap">{displayContent}</p>

        {/* Schematic indicator */}
        {message.schematic && onSchematicSelect && (
          <div
            className="mt-4 pt-4 border-t flex items-center justify-between"
            style={{ borderColor: `${NEON_GREEN}20` }}
          >
            <div
              className="flex items-center gap-2 animate-pulse"
              style={{ color: NEON_GREEN }}
            >
              <Code size={12} />
              <span className="text-[9px] font-bold uppercase tracking-widest">
                PCB_SCHEMA_SYNTHESIZED
              </span>
            </div>
            <button
              onClick={() => onSchematicSelect(message.schematic!)}
              className="px-3 py-1 text-black text-[9px] font-bold rounded uppercase hover:bg-white transition-colors"
              style={{ backgroundColor: NEON_GREEN }}
            >
              Render Node
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
