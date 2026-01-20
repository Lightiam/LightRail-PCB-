/**
 * Sidebar Component
 * Navigation and schematic history
 */

import React from 'react';
import { Cpu, Search, Layers, Settings } from 'lucide-react';
import type { Schematic } from '../inference/parser';
import { appConfig } from '../../config/app.config';

interface SidebarProps {
  history: Schematic[];
  currentSchematic: Schematic | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSchematicSelect: (schematic: Schematic) => void;
}

const NEON_GREEN = appConfig.ui.primaryColor;

export const Sidebar: React.FC<SidebarProps> = ({
  history,
  currentSchematic,
  searchTerm,
  onSearchChange,
  onSchematicSelect,
}) => {
  const filteredHistory = history.filter(s => {
    const search = searchTerm.toLowerCase();
    return (
      s.title.toLowerCase().includes(search) ||
      s.description.toLowerCase().includes(search)
    );
  });

  return (
    <aside className="w-80 border-r border-zinc-800/50 flex flex-col bg-[#080808]">
      {/* Logo */}
      <div className="p-8 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="p-2.5 rounded-lg border"
            style={{
              backgroundColor: `${NEON_GREEN}10`,
              borderColor: `${NEON_GREEN}30`,
              boxShadow: `0 0 15px ${NEON_GREEN}20`,
            }}
          >
            <Cpu size={26} style={{ color: NEON_GREEN }} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
            LIGHT<span style={{ color: NEON_GREEN }}>RAIL</span>
          </h1>
        </div>
        <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.4em]">
          Integrated PCB Intelligence
        </p>
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b border-zinc-800/50">
        <div className="relative group">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-current transition-colors"
            style={{ ['--focus-color' as string]: NEON_GREEN }}
          />
          <input
            type="text"
            placeholder="SCAN HISTORY..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#0d0d0d] border border-zinc-800 rounded-md py-2.5 pl-9 pr-3 text-[10px] font-mono text-white placeholder-zinc-700 focus:outline-none transition-all uppercase tracking-widest"
            onFocus={(e) => {
              e.currentTarget.style.borderColor = `${NEON_GREEN}50`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '';
            }}
          />
        </div>
      </div>

      {/* History */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        <div className="text-[10px] font-mono text-zinc-600 mb-4 px-2 uppercase tracking-[0.2em] flex justify-between items-center">
          <span>Cache Modules</span>
          <span className="bg-zinc-800/50 px-1.5 py-0.5 rounded text-[8px]">
            {filteredHistory.length}
          </span>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-[10px] text-zinc-700 italic px-2 py-4 font-mono uppercase tracking-widest">
            Zero active modules.
          </div>
        ) : (
          filteredHistory.map((s, i) => {
            const isSelected = currentSchematic === s;
            return (
              <button
                key={i}
                onClick={() => onSchematicSelect(s)}
                className="w-full text-left p-4 rounded-lg border transition-all duration-300 flex items-center gap-4 group relative overflow-hidden"
                style={{
                  borderColor: isSelected ? `${NEON_GREEN}50` : 'transparent',
                  backgroundColor: isSelected ? `${NEON_GREEN}08` : 'rgba(24, 24, 27, 0.2)',
                  color: isSelected ? 'white' : '#71717a',
                  boxShadow: isSelected ? `0 0 20px ${NEON_GREEN}05` : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(24, 24, 27, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(24, 24, 27, 0.2)';
                  }
                }}
              >
                <Layers
                  size={16}
                  style={{ color: isSelected ? NEON_GREEN : '#3f3f46' }}
                />
                <div className="truncate flex-1">
                  <div
                    className="text-xs font-bold truncate uppercase tracking-tight"
                    style={{ color: isSelected ? NEON_GREEN : '#a1a1aa' }}
                  >
                    {s.title}
                  </div>
                  <div className="text-[9px] font-mono opacity-30 uppercase tracking-tighter">
                    {s.components.length} Nodes / {s.connections.length} Traces
                  </div>
                </div>
                {isSelected && (
                  <div
                    className="absolute top-0 right-0 h-full w-0.5"
                    style={{
                      backgroundColor: NEON_GREEN,
                      boxShadow: `0 0 10px ${NEON_GREEN}`,
                    }}
                  />
                )}
              </button>
            );
          })
        )}
      </nav>

      {/* Settings */}
      <div className="p-6 border-t border-zinc-800/50 bg-[#060606]">
        <button
          className="flex items-center gap-3 w-full p-2 text-zinc-600 transition-colors group"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = NEON_GREEN;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '';
          }}
        >
          <Settings size={14} className="group-hover:rotate-90 transition-transform duration-500" />
          <span className="text-[10px] uppercase font-mono tracking-widest">Global Config</span>
        </button>
      </div>
    </aside>
  );
};
