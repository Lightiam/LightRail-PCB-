/**
 * Parser Unit Tests
 * Tests for schematic parsing and validation
 */

import { describe, it, expect } from 'vitest';
import {
  parseSchematic,
  validateSchematic,
  normalizeSchematic,
  extractTextContent,
} from '../../src/inference/parser';

describe('parseSchematic', () => {
  it('should parse valid JSON from markdown code block', () => {
    const response = `Here's your schematic:

\`\`\`json
{
  "title": "LED Circuit",
  "description": "Simple LED with resistor",
  "components": [
    {"id": "R1", "type": "resistor", "label": "330Ω", "x": 100, "y": 100, "pins": [{"id": "1", "label": "PIN1"}, {"id": "2", "label": "PIN2"}]}
  ],
  "connections": []
}
\`\`\`

This circuit uses a current limiting resistor.`;

    const result = parseSchematic(response);

    expect(result.success).toBe(true);
    expect(result.data?.title).toBe('LED Circuit');
    expect(result.data?.components).toHaveLength(1);
  });

  it('should return error for missing JSON', () => {
    const response = 'This is just text without any JSON.';
    const result = parseSchematic(response);

    expect(result.success).toBe(false);
    expect(result.error).toContain('No JSON found');
  });

  it('should return error for invalid JSON structure', () => {
    const response = `\`\`\`json
{
  "invalid": "structure"
}
\`\`\``;

    const result = parseSchematic(response);
    expect(result.success).toBe(false);
  });
});

describe('validateSchematic', () => {
  it('should validate correct schematic structure', () => {
    const schematic = {
      title: 'Test',
      description: 'Test schematic',
      components: [
        { id: 'R1', type: 'resistor', label: 'R1', x: 0, y: 0, pins: [] }
      ],
      connections: [],
    };

    const result = validateSchematic(schematic);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing title', () => {
    const schematic = {
      components: [],
      connections: [],
    };

    const result = validateSchematic(schematic);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing or invalid "title" field');
  });

  it('should detect duplicate component IDs', () => {
    const schematic = {
      title: 'Test',
      components: [
        { id: 'R1', type: 'resistor', label: 'R1', x: 0, y: 0, pins: [] },
        { id: 'R1', type: 'resistor', label: 'R2', x: 100, y: 0, pins: [] },
      ],
      connections: [],
    };

    const result = validateSchematic(schematic);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('duplicate id'))).toBe(true);
  });

  it('should detect invalid connection format', () => {
    const schematic = {
      title: 'Test',
      components: [],
      connections: [
        { from: 'invalid', to: 'R1:1' }
      ],
    };

    const result = validateSchematic(schematic);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('invalid "from" format'))).toBe(true);
  });
});

describe('normalizeSchematic', () => {
  it('should normalize coordinates within bounds', () => {
    const raw = {
      title: 'Test',
      components: [
        { id: 'R1', type: 'resistor', x: -50, y: 1500, pins: [] }
      ],
      connections: [],
    };

    const result = normalizeSchematic(raw);
    expect(result.components[0].x).toBe(0);
    expect(result.components[0].y).toBe(800);
  });

  it('should provide default values for missing fields', () => {
    const raw = {
      components: [
        { id: 'R1', type: 'resistor', pins: [] }
      ],
      connections: [],
    };

    const result = normalizeSchematic(raw);
    expect(result.title).toBe('Untitled Schematic');
    expect(result.components[0].label).toBe('resistor');
  });
});

describe('extractTextContent', () => {
  it('should remove JSON code blocks', () => {
    const response = `Here's the design:

\`\`\`json
{"title": "test"}
\`\`\`

This is the explanation.`;

    const result = extractTextContent(response);
    expect(result).not.toContain('json');
    expect(result).toContain('Here\'s the design:');
    expect(result).toContain('This is the explanation.');
  });
});
