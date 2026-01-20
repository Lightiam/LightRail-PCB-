/**
 * Template Unit Tests
 * Tests for prompt template rendering and validation
 */

import { describe, it, expect } from 'vitest';
import {
  renderTemplate,
  validateTemplate,
  createTemplate,
} from '../../src/prompts/templates/base.template';

describe('renderTemplate', () => {
  it('should replace variables in template', () => {
    const template = createTemplate(
      'test',
      'Test Template',
      'Hello, {{ name }}!',
      [{ name: 'name', description: 'User name', required: true }]
    );

    const result = renderTemplate(template, { name: 'World' });
    expect(result).toBe('Hello, World!');
  });

  it('should use default values for optional variables', () => {
    const template = createTemplate(
      'test',
      'Test Template',
      'Value: {{ value }}',
      [{ name: 'value', description: 'A value', required: false, defaultValue: 'default' }]
    );

    const result = renderTemplate(template, {});
    expect(result).toBe('Value: default');
  });

  it('should throw error for missing required variables', () => {
    const template = createTemplate(
      'test',
      'Test Template',
      'Hello, {{ name }}!',
      [{ name: 'name', description: 'User name', required: true }]
    );

    expect(() => renderTemplate(template, {})).toThrow('Missing required variables');
  });

  it('should handle multiple variables', () => {
    const template = createTemplate(
      'test',
      'Test Template',
      '{{ greeting }}, {{ name }}! You are {{ age }} years old.',
      [
        { name: 'greeting', description: 'Greeting', required: true },
        { name: 'name', description: 'Name', required: true },
        { name: 'age', description: 'Age', required: true },
      ]
    );

    const result = renderTemplate(template, {
      greeting: 'Hello',
      name: 'Alice',
      age: '30',
    });
    expect(result).toBe('Hello, Alice! You are 30 years old.');
  });
});

describe('validateTemplate', () => {
  it('should pass for valid template', () => {
    const template = createTemplate(
      'test',
      'Test Template',
      'Hello, {{ name }}!',
      [{ name: 'name', description: 'User name', required: true }]
    );

    const errors = validateTemplate(template);
    expect(errors).toHaveLength(0);
  });

  it('should detect undefined variables in template', () => {
    const template = createTemplate(
      'test',
      'Test Template',
      'Hello, {{ name }} and {{ friend }}!',
      [{ name: 'name', description: 'User name', required: true }]
    );

    const errors = validateTemplate(template);
    expect(errors.some(e => e.includes('friend'))).toBe(true);
  });

  it('should detect missing required fields', () => {
    const template = {
      id: '',
      name: '',
      template: '',
      description: '',
      version: '1.0.0',
      variables: [],
    };

    const errors = validateTemplate(template);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('createTemplate', () => {
  it('should create a template with default version', () => {
    const template = createTemplate(
      'test-id',
      'Test Name',
      'Template content'
    );

    expect(template.id).toBe('test-id');
    expect(template.name).toBe('Test Name');
    expect(template.version).toBe('1.0.0');
    expect(template.variables).toHaveLength(0);
  });
});
