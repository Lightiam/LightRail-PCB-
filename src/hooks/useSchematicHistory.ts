/**
 * useSchematicHistory Hook
 * Manages schematic history with persistence
 */

import { useState, useCallback, useEffect } from 'react';
import type { Schematic } from '../inference/parser';

const STORAGE_KEY = 'lightrail_schematic_history';
const MAX_HISTORY = 50;

interface UseSchematicHistoryReturn {
  history: Schematic[];
  addToHistory: (schematic: Schematic) => void;
  removeFromHistory: (title: string) => void;
  clearHistory: () => void;
}

export function useSchematicHistory(): UseSchematicHistoryReturn {
  const [history, setHistory] = useState<Schematic[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (error) {
      console.warn('Failed to load schematic history:', error);
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save schematic history:', error);
    }
  }, [history]);

  const addToHistory = useCallback((schematic: Schematic) => {
    setHistory(prev => {
      // Remove existing schematic with same title
      const filtered = prev.filter(s => s.title !== schematic.title);
      // Add new schematic at the beginning
      const updated = [schematic, ...filtered];
      // Limit history size
      return updated.slice(0, MAX_HISTORY);
    });
  }, []);

  const removeFromHistory = useCallback((title: string) => {
    setHistory(prev => prev.filter(s => s.title !== title));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
