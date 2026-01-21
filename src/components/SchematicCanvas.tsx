/**
 * Schematic Canvas Component
 * Renders PCB schematics with components and connections
 */

import React from 'react';
import { Cpu, Zap } from 'lucide-react';
import type { Schematic } from '../inference/parser';
import { appConfig, PCB_CONSTANTS, QUICK_START_PROMPTS } from '../../config/app.config';

interface SchematicCanvasProps {
  schematic: Schematic | null;
  onQuickStart: (prompt: string) => void;
}

const NEON_GREEN = appConfig.ui.primaryColor;

export const SchematicCanvas: React.FC<SchematicCanvasProps> = ({
  schematic,
  onQuickStart
}) => {
  if (!schematic) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-8 p-12 text-center">
        <div className="relative">
          <div
            className="absolute inset-0 blur-3xl rounded-full scale-150 animate-pulse"
            style={{ backgroundColor: `${NEON_GREEN}10` }}
          />
          <Cpu
            size={120}
            className="animate-[pulse_3s_ease-in-out_infinite]"
            style={{ color: `${NEON_GREEN}20` }}
          />
        </div>

        <div className="max-w-md space-y-4">
          <h3
            className="font-mono text-lg tracking-[0.2em] uppercase text-white"
            style={{ textShadow: `0 0 10px ${NEON_GREEN}` }}
          >
            AI Core Ready
          </h3>
          <p className="text-xs text-zinc-600 font-mono leading-relaxed uppercase tracking-tighter">
            Initialize your PCB architecture via the secure chat terminal below.
            Select a module to begin uplink.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {QUICK_START_PROMPTS.map(qs => (
            <button
              key={qs}
              onClick={() => onQuickStart(qs)}
              className="flex items-center gap-2 px-6 py-3 bg-[#0a0a0a] border border-zinc-800 rounded-lg text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white transition-all group"
              style={{
                ['--hover-border-color' as string]: NEON_GREEN,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = NEON_GREEN;
                e.currentTarget.style.color = NEON_GREEN;
                e.currentTarget.style.backgroundColor = `${NEON_GREEN}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.color = '';
                e.currentTarget.style.backgroundColor = '';
              }}
            >
              <Zap size={14} className="group-hover:animate-bounce" />
              {qs}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#050505] rounded-xl border border-zinc-800/50 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(${NEON_GREEN}20 1px, transparent 1px),
            linear-gradient(90deg, ${NEON_GREEN}20 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      <svg
        className="absolute inset-0 w-full h-full p-12"
        viewBox={`0 0 ${PCB_CONSTANTS.CANVAS_WIDTH} ${PCB_CONSTANTS.CANVAS_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Connections */}
        {schematic.connections.map((conn, idx) => {
          const [fromCompId, fromPinId] = conn.from.split(':');
          const [toCompId, toPinId] = conn.to.split(':');
          const fromComp = schematic.components.find(c => c.id === fromCompId);
          const toComp = schematic.components.find(c => c.id === toCompId);

          if (!fromComp || !toComp) return null;

          const fromPinIdx = fromComp.pins.findIndex(p => p.id === fromPinId);
          const toPinIdx = toComp.pins.findIndex(p => p.id === toPinId);

          const x1 = fromComp.x + PCB_CONSTANTS.DEFAULT_COMPONENT_WIDTH;
          const y1 = fromComp.y + PCB_CONSTANTS.PIN_OFFSET + (fromPinIdx * PCB_CONSTANTS.PIN_SPACING);
          const x2 = toComp.x;
          const y2 = toComp.y + PCB_CONSTANTS.PIN_OFFSET + (toPinIdx * PCB_CONSTANTS.PIN_SPACING);

          return (
            <path
              key={`conn-${idx}`}
              d={`M ${x1} ${y1} C ${(x1+x2)/2} ${y1}, ${(x1+x2)/2} ${y2}, ${x2} ${y2}`}
              stroke={NEON_GREEN}
              strokeWidth="1.5"
              fill="none"
              className="opacity-40 hover:opacity-100 transition-opacity"
              style={{ filter: `drop-shadow(0 0 4px ${NEON_GREEN}40)` }}
            />
          );
        })}

        {/* Components */}
        {schematic.components.map((comp) => {
          const height = Math.max(
            PCB_CONSTANTS.MIN_COMPONENT_HEIGHT,
            comp.pins.length * PCB_CONSTANTS.PIN_SPACING + 40
          );

          return (
            <g key={comp.id} transform={`translate(${comp.x}, ${comp.y})`} className="group">
              {/* Component body */}
              <rect
                width={PCB_CONSTANTS.DEFAULT_COMPONENT_WIDTH}
                height={height}
                rx="2"
                fill="#0a0a0a"
                stroke={NEON_GREEN}
                strokeWidth="1"
                className="group-hover:stroke-2 transition-all"
              />

              {/* Component header */}
              <rect
                width={PCB_CONSTANTS.DEFAULT_COMPONENT_WIDTH}
                height="4"
                fill={NEON_GREEN}
                className="opacity-50"
              />

              {/* Component ID */}
              <text
                x="5"
                y="15"
                fill={NEON_GREEN}
                className="text-[10px] font-mono font-bold tracking-tighter uppercase"
              >
                {comp.id}
              </text>

              {/* Component label */}
              <text
                x={PCB_CONSTANTS.DEFAULT_COMPONENT_WIDTH / 2}
                y="-12"
                textAnchor="middle"
                fill="white"
                className="text-[10px] font-mono font-bold tracking-tight uppercase"
              >
                {comp.label}
              </text>

              {/* Pins */}
              {comp.pins.map((pin, pIdx) => (
                <g key={pin.id} transform={`translate(0, ${PCB_CONSTANTS.PIN_OFFSET + pIdx * PCB_CONSTANTS.PIN_SPACING})`}>
                  <circle cx="0" cy="0" r="2" fill={NEON_GREEN} />
                  <circle cx={PCB_CONSTANTS.DEFAULT_COMPONENT_WIDTH} cy="0" r="2" fill={NEON_GREEN} />
                  <text
                    x="8"
                    y="4"
                    fill="white"
                    className="text-[8px] font-mono opacity-40 group-hover:opacity-100"
                  >
                    {pin.label}
                  </text>
                </g>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
