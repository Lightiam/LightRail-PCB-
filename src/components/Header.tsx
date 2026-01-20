/**
 * Header Component
 * Top navigation bar with status and actions
 */

import React from 'react';
import { Activity, Download, Trash2 } from 'lucide-react';
import type { Schematic } from '../inference/parser';
import { appConfig } from '../../config/app.config';

interface HeaderProps {
  currentSchematic: Schematic | null;
  onExport?: () => void;
  onClear: () => void;
}

const NEON_GREEN = appConfig.ui.primaryColor;

export const Header: React.FC<HeaderProps> = ({
  currentSchematic,
  onExport,
  onClear,
}) => {
  return (
    <header className="h-16 border-b border-zinc-800/50 flex items-center justify-between px-10 bg-[#080808]/90 backdrop-blur-xl z-20">
      <div className="flex items-center gap-6">
        <Activity
          className="animate-pulse"
          size={20}
          style={{ color: NEON_GREEN }}
        />
        <div>
          <h2
            className="text-[11px] font-mono text-white tracking-[0.2em] uppercase"
            style={{ textShadow: `0 0 10px ${NEON_GREEN}40` }}
          >
            {currentSchematic?.title || 'SYSTEM STANDBY'}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Status indicator */}
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full border"
          style={{
            backgroundColor: `${NEON_GREEN}08`,
            borderColor: `${NEON_GREEN}30`,
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: NEON_GREEN }}
          />
          <span
            className="text-[9px] font-mono tracking-widest uppercase"
            style={{ color: NEON_GREEN }}
          >
            Uplink Stable
          </span>
        </div>

        {/* Export button */}
        {onExport && (
          <button
            className="text-zinc-500 hover:text-white transition-colors"
            title="Export Netlist"
            onClick={onExport}
          >
            <Download size={18} />
          </button>
        )}

        {/* Clear button */}
        <button
          onClick={onClear}
          className="text-zinc-600 hover:text-red-500 transition-colors"
          title="Purge System Memory"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </header>
  );
};
