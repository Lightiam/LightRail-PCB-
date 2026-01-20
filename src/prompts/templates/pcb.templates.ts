/**
 * PCB Design Prompt Templates
 * Domain-specific templates for PCB schematic generation
 */

import type { PromptTemplate } from './base.template';

export const PCB_SYSTEM_PROMPT: PromptTemplate = {
  id: 'pcb-system-prompt',
  name: 'PCB Design System Prompt',
  description: 'Main system prompt for the LightRail AI PCB assistant',
  version: '1.0.0',
  template: `You are LightRail AI, a world-class Electrical Engineer and PCB Designer.
Your goal is to help users design and iterate on PCB schematics through conversation.

Rules:
1. Always provide a conversational response explaining your design choices.
2. When the user asks for a circuit or a change to an existing one, provide a valid JSON object describing the schematic within your response.
3. Components must have: id (unique), type, label, x/y coordinates (0-1000), and pins (id, label).
4. Connections use "compID:pinID" format.
5. For iterative changes (e.g., "add an LED"), always provide the ENTIRE updated schematic JSON.
6. Return JSON within triple backticks like so: \`\`\`json { ... } \`\`\`.

{{additional_context}}

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
}`,
  variables: [
    {
      name: 'additional_context',
      description: 'Additional context or constraints for the design',
      required: false,
      defaultValue: '',
    },
  ],
};

export const PCB_DESIGN_REQUEST: PromptTemplate = {
  id: 'pcb-design-request',
  name: 'PCB Design Request',
  description: 'Template for requesting a new PCB design',
  version: '1.0.0',
  template: `Design a PCB schematic for: {{design_request}}

Requirements:
{{requirements}}

Constraints:
- Maximum components: {{max_components}}
- Target voltage: {{voltage}}
{{additional_constraints}}

Please provide a complete schematic with proper component selection and connections.`,
  variables: [
    {
      name: 'design_request',
      description: 'The main design request',
      required: true,
    },
    {
      name: 'requirements',
      description: 'List of requirements',
      required: false,
      defaultValue: 'Standard requirements apply',
    },
    {
      name: 'max_components',
      description: 'Maximum number of components',
      required: false,
      defaultValue: '50',
    },
    {
      name: 'voltage',
      description: 'Target operating voltage',
      required: false,
      defaultValue: '5V',
    },
    {
      name: 'additional_constraints',
      description: 'Any additional constraints',
      required: false,
      defaultValue: '',
    },
  ],
};

export const PCB_MODIFY_REQUEST: PromptTemplate = {
  id: 'pcb-modify-request',
  name: 'PCB Modification Request',
  description: 'Template for modifying an existing schematic',
  version: '1.0.0',
  template: `Modify the current schematic as follows: {{modification_request}}

Current schematic context:
{{current_schematic}}

Please provide the complete updated schematic JSON with all existing components plus the requested changes.`,
  variables: [
    {
      name: 'modification_request',
      description: 'The modification to make',
      required: true,
    },
    {
      name: 'current_schematic',
      description: 'Summary of current schematic state',
      required: true,
    },
  ],
};

export const PCB_ANALYSIS_REQUEST: PromptTemplate = {
  id: 'pcb-analysis-request',
  name: 'PCB Analysis Request',
  description: 'Template for analyzing a schematic',
  version: '1.0.0',
  template: `Analyze the following PCB schematic and provide insights:

{{schematic_json}}

Please evaluate:
1. Component selection appropriateness
2. Connection validity and potential issues
3. Power distribution and ground paths
4. Signal integrity considerations
5. Suggestions for improvement

{{specific_questions}}`,
  variables: [
    {
      name: 'schematic_json',
      description: 'The schematic JSON to analyze',
      required: true,
    },
    {
      name: 'specific_questions',
      description: 'Specific questions about the design',
      required: false,
      defaultValue: '',
    },
  ],
};

export const PCB_COMPONENT_SUGGESTION: PromptTemplate = {
  id: 'pcb-component-suggestion',
  name: 'Component Suggestion',
  description: 'Template for suggesting components',
  version: '1.0.0',
  template: `Suggest appropriate components for: {{use_case}}

Context:
- Operating voltage: {{voltage}}
- Current requirements: {{current}}
- Environment: {{environment}}

Please provide specific part numbers when possible, along with alternatives.`,
  variables: [
    {
      name: 'use_case',
      description: 'The use case for components',
      required: true,
    },
    {
      name: 'voltage',
      description: 'Operating voltage',
      required: false,
      defaultValue: '5V',
    },
    {
      name: 'current',
      description: 'Current requirements',
      required: false,
      defaultValue: 'Low current (<100mA)',
    },
    {
      name: 'environment',
      description: 'Operating environment',
      required: false,
      defaultValue: 'Indoor, room temperature',
    },
  ],
};

export const pcbTemplates = {
  system: PCB_SYSTEM_PROMPT,
  designRequest: PCB_DESIGN_REQUEST,
  modifyRequest: PCB_MODIFY_REQUEST,
  analysisRequest: PCB_ANALYSIS_REQUEST,
  componentSuggestion: PCB_COMPONENT_SUGGESTION,
};
