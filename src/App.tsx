/**
 * Main Application Component
 * LightRail AI PCB Design Assistant
 */

import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SchematicCanvas } from './components/SchematicCanvas';
import { ChatPanel } from './components/ChatPanel';
import { useChat } from './hooks/useChat';
import { useSchematicHistory } from './hooks/useSchematicHistory';
import type { Schematic } from './inference/parser';
import { appConfig } from '../config/app.config';

const NEON_GREEN = appConfig.ui.primaryColor;

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const { history, addToHistory, clearHistory } = useSchematicHistory();

  const handleSchematicGenerated = useCallback((schematic: Schematic) => {
    addToHistory(schematic);
  }, [addToHistory]);

  const {
    messages,
    isLoading,
    currentSchematic,
    sendMessage,
    clearMessages,
    setCurrentSchematic,
  } = useChat({
    provider: 'google',
    onSchematicGenerated: handleSchematicGenerated,
  });

  const handleClear = useCallback(() => {
    clearMessages();
    clearHistory();
  }, [clearMessages, clearHistory]);

  const handleExport = useCallback(() => {
    if (!currentSchematic) return;

    const json = JSON.stringify(currentSchematic, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSchematic.title.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentSchematic]);

  return (
    <div className="flex h-screen w-full bg-[#050505] text-zinc-300 font-sans overflow-hidden"
      style={{
        ['--selection-bg' as string]: NEON_GREEN,
        ['--selection-text' as string]: 'black',
      }}
    >
      {/* Sidebar */}
      <Sidebar
        history={history}
        currentSchematic={currentSchematic}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSchematicSelect={setCurrentSchematic}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <Header
          currentSchematic={currentSchematic}
          onExport={currentSchematic ? handleExport : undefined}
          onClear={handleClear}
        />

        {/* Workspace */}
        <section className="flex-1 p-8 relative flex flex-col gap-8 min-h-0">
          {/* Canvas */}
          <div className="flex-1 relative">
            <SchematicCanvas
              schematic={currentSchematic}
              onQuickStart={sendMessage}
            />
          </div>

          {/* Chat Panel */}
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            onSendMessage={sendMessage}
            onSchematicSelect={setCurrentSchematic}
          />
        </section>
      </main>

      {/* Aesthetic HUD Layer */}
      <div
        className="fixed top-0 left-0 w-full h-[1px] z-50 pointer-events-none opacity-60"
        style={{
          backgroundColor: NEON_GREEN,
          boxShadow: `0 0 20px ${NEON_GREEN}`,
        }}
      />
      <div className="fixed bottom-6 left-80 ml-6 pointer-events-none opacity-20 hidden lg:block">
        <div className="flex gap-4">
          <div className="w-12 h-1" style={{ backgroundColor: NEON_GREEN }} />
          <div className="w-12 h-1 bg-zinc-800" />
          <div className="w-12 h-1 bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}
