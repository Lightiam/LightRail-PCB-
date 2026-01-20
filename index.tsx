
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";
import { 
  Cpu, 
  Terminal, 
  Send, 
  Download, 
  Trash2, 
  Layers, 
  Maximize2, 
  Settings,
  Share2,
  ChevronRight,
  Loader2,
  Search,
  Zap,
  Box,
  PlusCircle,
  MessageSquare,
  Activity,
  User,
  ShieldAlert,
  Command,
  Monitor,
  Database,
  Code
} from 'lucide-react';

// --- Types & Constants ---

interface Pin {
  id: string;
  label: string;
}

interface Component {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  pins: Pin[];
}

interface Connection {
  from: string; // "compID:pinID"
  to: string;   // "compID:pinID"
}

interface Schematic {
  title: string;
  description: string;
  components: Component[];
  connections: Connection[];
}

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  schematic?: Schematic; 
  timestamp: Date;
}

const NEON_GREEN = "#39FF14";

const SYSTEM_INSTRUCTION = `You are LightRail AI, a world-class Electrical Engineer and PCB Designer. 
Your goal is to help users design and iterate on PCB schematics through conversation.

Rules:
1. Always provide a conversational response explaining your design choices.
2. When the user asks for a circuit or a change to an existing one, provide a valid JSON object describing the schematic within your response.
3. Components must have: id (unique), type, label, x/y coordinates (0-1000), and pins (id, label).
4. Connections use "compID:pinID".
5. For iterative changes (e.g., "add an LED"), always provide the ENTIRE updated schematic JSON.
6. Return JSON within triple backticks like so: \`\`\`json { ... } \`\`\`.

Schematic JSON Structure:
{
  "title": string,
  "description": string,
  "components": [
    { "id": string, "type": string, "label": string, "x": number, "y": number, "pins": [{ "id": string, "label": string }] }
  ],
  "connections": [
    { "from": string, "to": string }
  ]
}
`;

const QUICK_STARTS = [
  "Build a 5V regulator circuit",
  "Design an ESP32 dev board",
  "Create a dual LED flasher",
];

// --- Sub-components ---

const SchematicCanvas = ({ schematic, onQuickStart }: { schematic: Schematic | null, onQuickStart: (p: string) => void }) => {
  if (!schematic) return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-8 p-12 text-center">
      <div className="relative">
        <div className="absolute inset-0 blur-3xl bg-[#39FF14]/10 rounded-full scale-150 animate-pulse" />
        <Cpu size={120} className="text-[#39FF14]/20 animate-[pulse_3s_ease-in-out_infinite]" />
      </div>
      
      <div className="max-w-md space-y-4">
        <h3 className="font-mono text-lg tracking-[0.2em] uppercase text-white neon-text">AI Core Ready</h3>
        <p className="text-xs text-zinc-600 font-mono leading-relaxed uppercase tracking-tighter">
          Initialize your PCB architecture via the secure chat terminal below. Select a module to begin uplink.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {QUICK_STARTS.map(qs => (
          <button
            key={qs}
            onClick={() => onQuickStart(qs)}
            className="flex items-center gap-2 px-6 py-3 bg-[#0a0a0a] border border-zinc-800 rounded-lg text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:border-[#39FF14] hover:text-[#39FF14] hover:bg-[#39FF14]/5 transition-all group"
          >
            <Zap size={14} className="group-hover:animate-bounce" />
            {qs}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#050505] rounded-xl border border-zinc-800/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] grid-bg">
      <svg className="absolute inset-0 w-full h-full p-12" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid meet">
        {schematic.connections.map((conn, idx) => {
          const [fromCompId, fromPinId] = conn.from.split(':');
          const [toCompId, toPinId] = conn.to.split(':');
          const fromComp = schematic.components.find(c => c.id === fromCompId);
          const toComp = schematic.components.find(c => c.id === toCompId);
          if (!fromComp || !toComp) return null;

          const fromPinIdx = fromComp.pins.findIndex(p => p.id === fromPinId);
          const toPinIdx = toComp.pins.findIndex(p => p.id === toPinId);

          const x1 = fromComp.x + 85; 
          const y1 = fromComp.y + 30 + (fromPinIdx * 20);
          const x2 = toComp.x;
          const y2 = toComp.y + 30 + (toPinIdx * 20);

          return (
            <path
              key={`conn-${idx}`}
              d={`M ${x1} ${y1} C ${(x1+x2)/2} ${y1}, ${(x1+x2)/2} ${y2}, ${x2} ${y2}`}
              stroke={NEON_GREEN}
              strokeWidth="1.5"
              fill="none"
              className="opacity-40 hover:opacity-100 transition-opacity"
              style={{ filter: 'drop-shadow(0 0 4px rgba(57, 255, 20, 0.4))' }}
            />
          );
        })}

        {schematic.components.map((comp) => (
          <g key={comp.id} transform={`translate(${comp.x}, ${comp.y})`} className="group">
            <rect
              width="85"
              height={Math.max(60, comp.pins.length * 20 + 40)}
              rx="2"
              fill="#0a0a0a"
              stroke={NEON_GREEN}
              strokeWidth="1"
              className="group-hover:stroke-2 transition-all"
            />
            <rect width="85" height="4" fill={NEON_GREEN} className="opacity-50" />
            <text x="5" y="15" fill={NEON_GREEN} className="text-[10px] font-mono font-bold tracking-tighter uppercase">{comp.id}</text>
            <text x="42.5" y="-12" textAnchor="middle" fill="white" className="text-[10px] font-mono font-bold tracking-tight uppercase">{comp.label}</text>
            {comp.pins.map((pin, pIdx) => (
              <g key={pin.id} transform={`translate(0, ${30 + pIdx * 20})`}>
                <circle cx="0" cy="0" r="2" fill={NEON_GREEN} />
                <circle cx="85" cy="0" r="2" fill={NEON_GREEN} />
                <text x="8" y="4" fill="white" className="text-[8px] font-mono opacity-40 group-hover:opacity-100">{pin.label}</text>
              </g>
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
};

// --- Main App ---

export default function LightRailApp() {
  const [prompt, setPrompt] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSchematic, setCurrentSchematic] = useState<Schematic | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<Schematic[]>([]);
  
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const initChat = () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    chatRef.current = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
  };

  const filteredHistory = useMemo(() => {
    return history.filter(s => {
      const search = searchTerm.toLowerCase();
      return s.title.toLowerCase().includes(search) || s.description.toLowerCase().includes(search);
    });
  }, [history, searchTerm]);

  const sendMessage = async (text?: string) => {
    const input = text || prompt;
    if (!input.trim()) return;

    if (!chatRef.current) initChat();

    setIsLoading(true);
    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setPrompt("");

    try {
      let fullResponse = "";
      const stream = await chatRef.current.sendMessageStream({ message: input });
      
      const modelId = Date.now();
      setMessages(prev => [...prev, { role: 'model', content: "", timestamp: new Date() }]);

      for await (const chunk of stream) {
        const textChunk = (chunk as GenerateContentResponse).text;
        fullResponse += textChunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: fullResponse }];
        });
      }

      // Extract JSON if present
      const jsonMatch = fullResponse.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        try {
          const schematicData: Schematic = JSON.parse(jsonMatch[1]);
          setCurrentSchematic(schematicData);
          setHistory(prev => [schematicData, ...prev.filter(h => h.title !== schematicData.title)]);
          setMessages(prev => {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, schematic: schematicData }];
          });
        } catch (e) {
          console.error("JSON parse error", e);
        }
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "CRITICAL: UPLINK COLLAPSED. DIAGNOSTIC REQUIRED.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-zinc-300 font-sans selection:bg-[#39FF14] selection:text-black overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-r border-zinc-800/50 flex flex-col bg-[#080808]">
        <div className="p-8 border-b border-zinc-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-[#39FF14]/10 rounded-lg border border-[#39FF14]/30 neon-glow">
              <Cpu size={26} className="text-[#39FF14]" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
              LIGHT<span className="text-[#39FF14]">RAIL</span>
            </h1>
          </div>
          <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.4em]">Integrated PCB Intelligence</p>
        </div>

        <div className="px-6 py-4 border-b border-zinc-800/50">
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#39FF14] transition-colors" />
            <input 
              type="text" 
              placeholder="SCAN HISTORY..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-zinc-800 rounded-md py-2.5 pl-9 pr-3 text-[10px] font-mono text-white placeholder-zinc-700 focus:outline-none focus:border-[#39FF14]/50 transition-all uppercase tracking-widest"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          <div className="text-[10px] font-mono text-zinc-600 mb-4 px-2 uppercase tracking-[0.2em] flex justify-between items-center">
            <span>Cache Modules</span>
            <span className="bg-zinc-800/50 px-1.5 py-0.5 rounded text-[8px]">{filteredHistory.length}</span>
          </div>
          
          {filteredHistory.length === 0 ? (
            <div className="text-[10px] text-zinc-700 italic px-2 py-4 font-mono uppercase tracking-widest">Zero active modules.</div>
          ) : (
            filteredHistory.map((s, i) => (
              <button
                key={i}
                onClick={() => setCurrentSchematic(s)}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-300 flex items-center gap-4 group relative overflow-hidden ${
                  currentSchematic === s 
                    ? 'border-[#39FF14]/50 bg-[#39FF14]/5 text-white shadow-[0_0_20px_rgba(57,255,20,0.05)]' 
                    : 'border-transparent bg-zinc-900/20 hover:bg-zinc-900/40 text-zinc-500'
                }`}
              >
                <Layers size={16} className={currentSchematic === s ? 'text-[#39FF14]' : 'text-zinc-700'} />
                <div className="truncate flex-1">
                  <div className={`text-xs font-bold truncate uppercase tracking-tight ${currentSchematic === s ? 'text-[#39FF14]' : 'text-zinc-400'}`}>{s.title}</div>
                  <div className="text-[9px] font-mono opacity-30 uppercase tracking-tighter">{s.components.length} Nodes / {s.connections.length} Traces</div>
                </div>
                {currentSchematic === s && (
                   <div className="absolute top-0 right-0 h-full w-0.5 bg-[#39FF14] shadow-[0_0_10px_#39FF14]" />
                )}
              </button>
            ))
          )}
        </nav>

        <div className="p-6 border-t border-zinc-800/50 bg-[#060606]">
           <button className="flex items-center gap-3 w-full p-2 text-zinc-600 hover:text-[#39FF14] transition-colors group">
              <Settings size={14} className="group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-[10px] uppercase font-mono tracking-widest">Global Config</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-16 border-b border-zinc-800/50 flex items-center justify-between px-10 bg-[#080808]/90 backdrop-blur-xl z-20">
          <div className="flex items-center gap-6">
            <Activity className="text-[#39FF14] animate-pulse" size={20} />
            <div>
              <h2 className="text-[11px] font-mono text-white tracking-[0.2em] uppercase neon-text">
                {currentSchematic?.title || "SYSTEM STANDBY"}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse" />
              <span className="text-[9px] font-mono text-[#39FF14] tracking-widest uppercase">Uplink Stable</span>
            </div>
            <button className="text-zinc-500 hover:text-white transition-colors" title="Export Netlist">
              <Download size={18} />
            </button>
            <button 
              onClick={() => {
                setMessages([]);
                setCurrentSchematic(null);
                setHistory([]);
                chatRef.current = null;
              }}
              className="text-zinc-600 hover:text-red-500 transition-colors"
              title="Purge System Memory"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </header>

        {/* Workspace Canvas */}
        <section className="flex-1 p-8 relative flex flex-col gap-8 min-h-0">
          <div className="flex-1 relative">
            <SchematicCanvas schematic={currentSchematic} onQuickStart={(qs) => sendMessage(qs)} />
          </div>

          {/* CUSTOM CHATBOX INTERFACE */}
          <div className="h-[45%] flex flex-col bg-[#080808] border border-zinc-800/50 rounded-2xl overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-b-0 rounded-b-none">
            {/* Chat Header/Console Stats */}
            <div className="px-6 py-3 border-b border-zinc-800/50 bg-black/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                   <Terminal size={12} className="text-[#39FF14]" />
                   <span className="text-[10px] font-mono font-bold text-[#39FF14] uppercase tracking-widest">Command Center</span>
                 </div>
                 <div className="h-3 w-[1px] bg-zinc-800" />
                 <div className="flex items-center gap-4 text-[9px] font-mono text-zinc-500 uppercase tracking-tighter">
                   <div className="flex items-center gap-1"><Monitor size={10}/> Latency: 42ms</div>
                   <div className="flex items-center gap-1"><Database size={10}/> Buffer: 100%</div>
                 </div>
              </div>
              <div className="flex gap-1">
                {[1,2,3].map(i => <div key={i} className="w-1 h-3 bg-zinc-800 rounded-full" />)}
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 scroll-smooth" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                   <Command size={64} className="mb-4 text-[#39FF14]" />
                   <span className="text-[12px] font-mono uppercase tracking-[0.5em]">Awaiting Instruction Set</span>
                </div>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Meta Tag */}
                  <div className="flex items-center gap-2 mb-2 px-2">
                    <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">{m.timestamp.toLocaleTimeString()}</span>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-widest ${m.role === 'user' ? 'text-zinc-400' : 'text-[#39FF14]'}`}>
                      {m.role === 'user' ? 'OPERATOR' : 'LIGHTRAIL_CORE'}
                    </span>
                  </div>

                  {/* Bubble */}
                  <div className={`relative group max-w-[85%] rounded-xl p-5 font-mono text-[11px] leading-relaxed border transition-all ${
                    m.role === 'user' 
                    ? 'bg-zinc-900/40 border-zinc-800 text-zinc-300 rounded-tr-none' 
                    : 'bg-[#39FF14]/5 border-[#39FF14]/20 text-zinc-100 rounded-tl-none shadow-[0_0_30px_rgba(57,255,20,0.03)]'
                  }`}>
                    {/* Tech Corners */}
                    {m.role === 'model' && (
                      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#39FF14]/30" />
                    )}
                    
                    <p className="whitespace-pre-wrap">
                      {m.content.replace(/```json[\s\S]*?```/g, "")}
                    </p>

                    {/* AI Function Badge */}
                    {m.schematic && (
                      <div className="mt-4 pt-4 border-t border-[#39FF14]/10 flex items-center justify-between">
                         <div className="flex items-center gap-2 text-[#39FF14] animate-pulse">
                            <Code size={12} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">PCB_SCHEMA_SYNTHESIZED</span>
                         </div>
                         <button 
                          onClick={() => setCurrentSchematic(m.schematic!)}
                          className="px-3 py-1 bg-[#39FF14] text-black text-[9px] font-bold rounded uppercase hover:bg-white transition-colors"
                         >
                           Rerender Node
                         </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex flex-col items-start">
                   <div className="flex items-center gap-2 mb-2 px-2">
                    <span className="text-[9px] font-mono font-bold text-[#39FF14] uppercase tracking-widest animate-pulse">PROCESSING...</span>
                  </div>
                  <div className="bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-xl rounded-tl-none p-5 flex items-center gap-4">
                     <Loader2 size={16} className="text-[#39FF14] animate-spin" />
                     <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-[#39FF14] rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-[#39FF14] rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-[#39FF14] rounded-full animate-bounce" />
                     </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Console */}
            <div className="p-6 bg-black border-t border-zinc-800/50">
              <div className="relative group flex items-center gap-4">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500">
                  <Terminal size={18} />
                </div>
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder="ENTER COMMAND OR DESIGN SPEC..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                    disabled={isLoading}
                    className="w-full bg-[#0d0d0d] border border-zinc-800 rounded-xl py-4 px-6 text-sm text-white placeholder-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#39FF14]/30 focus:border-[#39FF14]/30 transition-all disabled:opacity-30 font-mono tracking-tight"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                    <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest hidden md:inline">ENTER TO SEND</span>
                    <button 
                      onClick={() => sendMessage()}
                      disabled={isLoading || !prompt.trim()}
                      className="p-2.5 bg-[#39FF14] text-black rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-20 shadow-[0_0_20px_rgba(57,255,20,0.3)]"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Aesthetic HUD Layer */}
      <div className="fixed top-0 left-0 w-full h-[1px] bg-[#39FF14] shadow-[0_0_20px_#39FF14] z-50 pointer-events-none opacity-60" />
      <div className="fixed bottom-6 left-80 ml-6 pointer-events-none opacity-20 hidden lg:block">
        <div className="flex gap-4">
          <div className="w-12 h-1 bg-[#39FF14]" />
          <div className="w-12 h-1 bg-zinc-800" />
          <div className="w-12 h-1 bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<LightRailApp />);
}
