/**
 * Chat Input Component
 * Input field for sending messages to the AI
 */

import React, { useState, useCallback } from 'react';
import { Terminal, Send } from 'lucide-react';
import { appConfig } from '../../config/app.config';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const NEON_GREEN = appConfig.ui.primaryColor;

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'ENTER COMMAND OR DESIGN SPEC...'
}) => {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(() => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue('');
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="p-6 bg-black border-t border-zinc-800/50">
      <div className="relative group flex items-center gap-4">
        {/* Terminal icon */}
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500">
          <Terminal size={18} />
        </div>

        {/* Input field */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="w-full bg-[#0d0d0d] border border-zinc-800 rounded-xl py-4 px-6 text-sm text-white placeholder-zinc-800 focus:outline-none transition-all disabled:opacity-30 font-mono tracking-tight"
            style={{
              ['--focus-ring-color' as string]: `${NEON_GREEN}30`,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = `${NEON_GREEN}30`;
              e.currentTarget.style.boxShadow = `0 0 0 1px ${NEON_GREEN}30`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.boxShadow = '';
            }}
          />

          {/* Action buttons */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
            <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest hidden md:inline">
              ENTER TO SEND
            </span>
            <button
              onClick={handleSubmit}
              disabled={disabled || !value.trim()}
              className="p-2.5 text-black rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
              style={{
                backgroundColor: NEON_GREEN,
                boxShadow: `0 0 20px ${NEON_GREEN}30`,
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
