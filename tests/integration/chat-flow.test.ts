/**
 * Chat Flow Integration Tests
 * Tests for end-to-end chat functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseSchematic } from '../../src/inference/parser';
import { renderTemplate } from '../../src/prompts/templates/base.template';
import { pcbTemplates } from '../../src/prompts/templates/pcb.templates';
import { executeChain } from '../../src/prompts/chains/base.chain';
import { quickDesignChain } from '../../src/prompts/chains/pcb.chains';

describe('Chat Flow Integration', () => {
  describe('System Prompt Generation', () => {
    it('should generate valid system prompt', () => {
      const systemPrompt = renderTemplate(pcbTemplates.system, {});

      expect(systemPrompt).toContain('LightRail AI');
      expect(systemPrompt).toContain('PCB');
      expect(systemPrompt).toContain('JSON');
    });

    it('should include additional context when provided', () => {
      const systemPrompt = renderTemplate(pcbTemplates.system, {
        additional_context: 'Focus on low power designs.',
      });

      expect(systemPrompt).toContain('Focus on low power designs.');
    });
  });

  describe('Design Request Templates', () => {
    it('should generate valid design request', () => {
      const request = renderTemplate(pcbTemplates.designRequest, {
        design_request: 'LED blinker circuit',
        requirements: '- 5V power supply\n- 1Hz blink rate',
        voltage: '5V',
      });

      expect(request).toContain('LED blinker circuit');
      expect(request).toContain('5V power supply');
    });
  });

  describe('Response Parsing', () => {
    it('should parse valid schematic response', () => {
      const response = `I'll design that circuit for you.

\`\`\`json
{
  "title": "LED Blinker",
  "description": "Simple 555 timer LED blinker",
  "components": [
    {"id": "U1", "type": "555_timer", "label": "NE555", "x": 200, "y": 200, "pins": [
      {"id": "GND", "label": "GND"},
      {"id": "TRIG", "label": "TRIG"},
      {"id": "OUT", "label": "OUT"},
      {"id": "RESET", "label": "RESET"},
      {"id": "CTRL", "label": "CTRL"},
      {"id": "THRES", "label": "THRES"},
      {"id": "DISCH", "label": "DISCH"},
      {"id": "VCC", "label": "VCC"}
    ]},
    {"id": "LED1", "type": "led", "label": "LED", "x": 400, "y": 200, "pins": [
      {"id": "A", "label": "Anode"},
      {"id": "K", "label": "Cathode"}
    ]}
  ],
  "connections": [
    {"from": "U1:OUT", "to": "LED1:A"}
  ]
}
\`\`\`

This design uses the classic 555 timer in astable mode.`;

      const result = parseSchematic(response);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('LED Blinker');
      expect(result.data?.components).toHaveLength(2);
      expect(result.data?.connections).toHaveLength(1);
    });

    it('should handle malformed JSON gracefully', () => {
      const response = `Here's the circuit:

\`\`\`json
{
  "title": "Broken",
  invalid json here
}
\`\`\``;

      const result = parseSchematic(response);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Prompt Chain Execution', () => {
    it('should have valid quick design chain structure', () => {
      expect(quickDesignChain.id).toBe('quick-design-chain');
      expect(quickDesignChain.steps).toHaveLength(1);
      expect(quickDesignChain.steps[0].outputKey).toBe('schematic');
    });
  });
});

describe('Schematic Validation', () => {
  it('should validate component connections', () => {
    const schematic = {
      title: 'Test Circuit',
      description: 'Test',
      components: [
        {
          id: 'R1',
          type: 'resistor',
          label: '1kΩ',
          x: 100,
          y: 100,
          pins: [
            { id: '1', label: 'PIN1' },
            { id: '2', label: 'PIN2' },
          ],
        },
        {
          id: 'LED1',
          type: 'led',
          label: 'Red LED',
          x: 200,
          y: 100,
          pins: [
            { id: 'A', label: 'Anode' },
            { id: 'K', label: 'Cathode' },
          ],
        },
      ],
      connections: [
        { from: 'R1:2', to: 'LED1:A' },
      ],
    };

    // Validate that connections reference valid components and pins
    const componentMap = new Map(schematic.components.map(c => [c.id, c]));

    for (const conn of schematic.connections) {
      const [fromCompId, fromPinId] = conn.from.split(':');
      const [toCompId, toPinId] = conn.to.split(':');

      const fromComp = componentMap.get(fromCompId);
      const toComp = componentMap.get(toCompId);

      expect(fromComp).toBeDefined();
      expect(toComp).toBeDefined();
      expect(fromComp?.pins.some(p => p.id === fromPinId)).toBe(true);
      expect(toComp?.pins.some(p => p.id === toPinId)).toBe(true);
    }
  });
});
