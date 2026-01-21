/**
 * Test Setup
 * Global test configuration and mocks
 */

import { vi } from 'vitest';

// Mock localStorage for browser-like environment
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    MODE: 'test',
    VITE_OPENAI_API_KEY: 'test-key',
    VITE_ANTHROPIC_API_KEY: 'test-key',
    VITE_GEMINI_API_KEY: 'test-key',
    API_KEY: 'test-key',
  },
});

// Mock fetch for API tests
global.fetch = vi.fn();

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
});
