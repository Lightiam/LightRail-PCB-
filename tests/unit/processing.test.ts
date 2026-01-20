/**
 * Processing Unit Tests
 * Tests for text processing utilities
 */

import { describe, it, expect } from 'vitest';
import { chunkText, chunkBySentences, mergeSmallChunks } from '../../src/processing/chunking';
import { createTokenCounter, estimateTokens } from '../../src/processing/tokenization';
import { cleanText, sanitizeText, extractJson } from '../../src/processing/cleaning';

describe('chunkText', () => {
  it('should return single chunk for short text', () => {
    const text = 'This is a short text.';
    const chunks = chunkText(text, { maxChunkSize: 100 });

    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe(text);
  });

  it('should split long text into multiple chunks', () => {
    const text = 'A'.repeat(500) + '\n\n' + 'B'.repeat(500);
    const chunks = chunkText(text, { maxChunkSize: 200, chunkOverlap: 0 });

    expect(chunks.length).toBeGreaterThan(1);
  });

  it('should respect chunk overlap', () => {
    const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
    const chunks = chunkText(text, { maxChunkSize: 30, chunkOverlap: 10 });

    expect(chunks.length).toBeGreaterThan(1);
  });
});

describe('chunkBySentences', () => {
  it('should group sentences into chunks', () => {
    const text = 'Sentence one. Sentence two. Sentence three. Sentence four. Sentence five. Sentence six.';
    const chunks = chunkBySentences(text, 2);

    expect(chunks).toHaveLength(3);
  });
});

describe('mergeSmallChunks', () => {
  it('should merge chunks smaller than minimum size', () => {
    const chunks = [
      { content: 'Short', index: 0, startOffset: 0, endOffset: 5 },
      { content: 'Also short', index: 1, startOffset: 5, endOffset: 15 },
      { content: 'This is a longer chunk that exceeds the minimum', index: 2, startOffset: 15, endOffset: 60 },
    ];

    const merged = mergeSmallChunks(chunks, 30);
    expect(merged.length).toBeLessThan(chunks.length);
  });
});

describe('TokenCounter', () => {
  it('should estimate token count', () => {
    const counter = createTokenCounter('gpt');
    const text = 'This is a test sentence with several words.';
    const count = counter.count(text);

    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(text.length);
  });

  it('should truncate text to token limit', () => {
    const counter = createTokenCounter('gpt');
    const text = 'This is a long text that needs to be truncated. '.repeat(20);
    const truncated = counter.truncate(text, 50);

    expect(counter.count(truncated)).toBeLessThanOrEqual(50);
  });

  it('should split text by token limit', () => {
    const counter = createTokenCounter('gpt');
    const text = 'This is a sentence. '.repeat(50);
    const parts = counter.split(text, 100);

    expect(parts.length).toBeGreaterThan(1);
    parts.forEach(part => {
      expect(counter.count(part)).toBeLessThanOrEqual(100);
    });
  });
});

describe('estimateTokens', () => {
  it('should provide estimates for different models', () => {
    const text = 'This is a test string for token estimation.';

    const gptTokens = estimateTokens(text, 'gpt-4');
    const claudeTokens = estimateTokens(text, 'claude-3');
    const geminiTokens = estimateTokens(text, 'gemini-pro');

    expect(gptTokens).toBeGreaterThan(0);
    expect(claudeTokens).toBeGreaterThan(0);
    expect(geminiTokens).toBeGreaterThan(0);
  });
});

describe('cleanText', () => {
  it('should remove extra whitespace', () => {
    const text = 'Hello    world\n\n\n\ntest';
    const cleaned = cleanText(text);

    expect(cleaned).not.toContain('    ');
    expect(cleaned).not.toContain('\n\n\n');
  });

  it('should preserve code blocks', () => {
    const text = 'Text before\n```\ncode block\n```\nText after';
    const cleaned = cleanText(text);

    expect(cleaned).toContain('```');
    expect(cleaned).toContain('code block');
  });

  it('should normalize unicode characters', () => {
    const text = '"smart quotes" and "regular quotes"';
    const cleaned = cleanText(text);

    expect(cleaned).toContain('"');
    expect(cleaned).not.toContain('"');
    expect(cleaned).not.toContain('"');
  });
});

describe('sanitizeText', () => {
  it('should redact email addresses', () => {
    const text = 'Contact me at test@example.com for more info.';
    const sanitized = sanitizeText(text);

    expect(sanitized).toContain('[REDACTED_EMAIL]');
    expect(sanitized).not.toContain('test@example.com');
  });

  it('should redact API keys', () => {
    const text = 'api_key: sk_test_abcdefghijklmnopqrstuvwxyz123456';
    const sanitized = sanitizeText(text);

    expect(sanitized).toContain('[REDACTED_API_KEY]');
  });
});

describe('extractJson', () => {
  it('should extract JSON from code blocks', () => {
    const text = 'Here is the data:\n```json\n{"key": "value"}\n```';
    const json = extractJson(text);

    expect(json).toBe('{"key": "value"}');
  });

  it('should extract raw JSON', () => {
    const text = 'The result is {"key": "value"} and more text.';
    const json = extractJson(text);

    expect(json).toBe('{"key": "value"}');
  });

  it('should return null for invalid JSON', () => {
    const text = 'No JSON here.';
    const json = extractJson(text);

    expect(json).toBeNull();
  });
});
