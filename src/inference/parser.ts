/**
 * Response Parser
 * Parse and validate LLM responses for PCB schematics
 */

import { logger } from '../../config/logging.config';
import { extractJson } from '../processing/cleaning';

export interface Pin {
  id: string;
  label: string;
}

export interface Component {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  pins: Pin[];
}

export interface Connection {
  from: string;
  to: string;
}

export interface Schematic {
  title: string;
  description: string;
  components: Component[];
  connections: Connection[];
}

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  rawContent?: string;
}

/**
 * Parse a schematic from LLM response
 */
export function parseSchematic(response: string): ParseResult<Schematic> {
  try {
    // Extract JSON from response
    const jsonStr = extractJson(response);

    if (!jsonStr) {
      return {
        success: false,
        error: 'No JSON found in response',
        rawContent: response,
      };
    }

    const parsed = JSON.parse(jsonStr);

    // Validate structure
    const validation = validateSchematic(parsed);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join('; '),
        rawContent: response,
      };
    }

    // Normalize the schematic
    const normalized = normalizeSchematic(parsed);

    logger.debug('Parsed schematic successfully', {
      title: normalized.title,
      componentCount: normalized.components.length,
      connectionCount: normalized.connections.length,
    });

    return {
      success: true,
      data: normalized,
      rawContent: response,
    };
  } catch (error) {
    logger.warn('Failed to parse schematic', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown parse error',
      rawContent: response,
    };
  }
}

/**
 * Validate schematic structure
 */
export function validateSchematic(obj: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['Response is not an object'] };
  }

  const schematic = obj as Record<string, unknown>;

  // Check required fields
  if (typeof schematic.title !== 'string') {
    errors.push('Missing or invalid "title" field');
  }

  if (!Array.isArray(schematic.components)) {
    errors.push('Missing or invalid "components" array');
  } else {
    // Validate each component
    const componentIds = new Set<string>();

    for (let i = 0; i < schematic.components.length; i++) {
      const comp = schematic.components[i] as Record<string, unknown>;

      if (typeof comp.id !== 'string' || !comp.id) {
        errors.push(`Component ${i}: missing or invalid "id"`);
      } else {
        if (componentIds.has(comp.id)) {
          errors.push(`Component ${i}: duplicate id "${comp.id}"`);
        }
        componentIds.add(comp.id);
      }

      if (typeof comp.type !== 'string') {
        errors.push(`Component ${i}: missing or invalid "type"`);
      }

      if (typeof comp.x !== 'number' || typeof comp.y !== 'number') {
        errors.push(`Component ${i}: missing or invalid coordinates`);
      }

      if (!Array.isArray(comp.pins)) {
        errors.push(`Component ${i}: missing or invalid "pins" array`);
      }
    }
  }

  if (!Array.isArray(schematic.connections)) {
    errors.push('Missing or invalid "connections" array');
  } else {
    // Validate connections reference valid components
    for (let i = 0; i < schematic.connections.length; i++) {
      const conn = schematic.connections[i] as Record<string, unknown>;

      if (typeof conn.from !== 'string' || !conn.from.includes(':')) {
        errors.push(`Connection ${i}: invalid "from" format (expected "compId:pinId")`);
      }

      if (typeof conn.to !== 'string' || !conn.to.includes(':')) {
        errors.push(`Connection ${i}: invalid "to" format (expected "compId:pinId")`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Normalize schematic data
 */
export function normalizeSchematic(raw: Record<string, unknown>): Schematic {
  return {
    title: String(raw.title || 'Untitled Schematic'),
    description: String(raw.description || ''),
    components: (raw.components as Component[]).map((comp, idx) => ({
      id: comp.id || `comp_${idx}`,
      type: comp.type || 'unknown',
      label: comp.label || comp.type || `Component ${idx}`,
      x: Math.max(0, Math.min(1000, Number(comp.x) || idx * 100)),
      y: Math.max(0, Math.min(800, Number(comp.y) || 100)),
      pins: Array.isArray(comp.pins)
        ? comp.pins.map((pin, pinIdx) => ({
            id: pin.id || `pin_${pinIdx}`,
            label: pin.label || `Pin ${pinIdx + 1}`,
          }))
        : [],
    })),
    connections: (raw.connections as Connection[]).map(conn => ({
      from: String(conn.from),
      to: String(conn.to),
    })),
  };
}

/**
 * Extract text content from response (excluding JSON)
 */
export function extractTextContent(response: string): string {
  // Remove JSON code blocks
  let text = response.replace(/```json[\s\S]*?```/g, '');
  // Remove other code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  // Clean up extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

/**
 * Parse component list from text
 */
export function parseComponentList(text: string): string[] {
  const components: string[] = [];

  // Match common component patterns
  const patterns = [
    /(?:^|\n)[-•*]\s*(.+?)(?:\n|$)/g,  // Bullet points
    /(?:^|\n)\d+[.)]\s*(.+?)(?:\n|$)/g, // Numbered lists
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const component = match[1].trim();
      if (component && !components.includes(component)) {
        components.push(component);
      }
    }
  }

  return components;
}

/**
 * Validate connection references
 */
export function validateConnections(schematic: Schematic): string[] {
  const errors: string[] = [];
  const componentMap = new Map(schematic.components.map(c => [c.id, c]));

  for (const conn of schematic.connections) {
    const [fromComp, fromPin] = conn.from.split(':');
    const [toComp, toPin] = conn.to.split(':');

    const fromComponent = componentMap.get(fromComp);
    const toComponent = componentMap.get(toComp);

    if (!fromComponent) {
      errors.push(`Connection references unknown component: ${fromComp}`);
    } else if (!fromComponent.pins.some(p => p.id === fromPin)) {
      errors.push(`Connection references unknown pin: ${fromComp}:${fromPin}`);
    }

    if (!toComponent) {
      errors.push(`Connection references unknown component: ${toComp}`);
    } else if (!toComponent.pins.some(p => p.id === toPin)) {
      errors.push(`Connection references unknown pin: ${toComp}:${toPin}`);
    }
  }

  return errors;
}
