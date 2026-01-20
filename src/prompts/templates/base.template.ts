/**
 * Base Prompt Template
 * Foundation for all prompt templates with variable interpolation
 */

export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  template: string;
  variables: TemplateVariable[];
  examples?: Array<{
    input: Record<string, string>;
    expectedOutput?: string;
  }>;
  metadata?: Record<string, unknown>;
}

/**
 * Render a template with the given variables
 */
export function renderTemplate(
  template: PromptTemplate,
  variables: Record<string, string>
): string {
  let rendered = template.template;

  // Validate required variables
  const missingVars = template.variables
    .filter(v => v.required && !variables[v.name] && !v.defaultValue)
    .map(v => v.name);

  if (missingVars.length > 0) {
    throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
  }

  // Replace variables
  for (const variable of template.variables) {
    const value = variables[variable.name] ?? variable.defaultValue ?? '';
    const pattern = new RegExp(`\\{\\{\\s*${variable.name}\\s*\\}\\}`, 'g');
    rendered = rendered.replace(pattern, value);
  }

  // Check for unreplaced variables
  const unreplaced = rendered.match(/\{\{\s*\w+\s*\}\}/g);
  if (unreplaced) {
    console.warn(`Unreplaced template variables: ${unreplaced.join(', ')}`);
  }

  return rendered.trim();
}

/**
 * Validate a template
 */
export function validateTemplate(template: PromptTemplate): string[] {
  const errors: string[] = [];

  if (!template.id) errors.push('Template ID is required');
  if (!template.name) errors.push('Template name is required');
  if (!template.template) errors.push('Template content is required');

  // Check that all variables in template are defined
  const templateVars = template.template.match(/\{\{\s*(\w+)\s*\}\}/g) || [];
  const definedVars = new Set(template.variables.map(v => v.name));

  for (const match of templateVars) {
    const varName = match.replace(/\{\{\s*|\s*\}\}/g, '');
    if (!definedVars.has(varName)) {
      errors.push(`Variable '${varName}' used in template but not defined`);
    }
  }

  return errors;
}

/**
 * Create a simple template
 */
export function createTemplate(
  id: string,
  name: string,
  template: string,
  variables: TemplateVariable[] = []
): PromptTemplate {
  return {
    id,
    name,
    description: '',
    version: '1.0.0',
    template,
    variables,
  };
}
