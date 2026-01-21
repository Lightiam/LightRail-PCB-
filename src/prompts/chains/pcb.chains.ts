/**
 * PCB Design Chains
 * Multi-step prompt chains for complex PCB design tasks
 */

import type { PromptChain, ChainStep, ChainContext } from './base.chain';
import { createTemplate } from '../templates/base.template';

// Step templates
const requirementsAnalysisTemplate = createTemplate(
  'requirements-analysis',
  'Requirements Analysis',
  `Analyze the following PCB design request and extract structured requirements:

Request: {{design_request}}

Please provide:
1. Functional requirements (what the circuit must do)
2. Electrical specifications (voltage, current, frequency)
3. Component categories needed
4. Interface requirements (connectors, headers)
5. Any constraints or limitations

Format your response as a structured list.`,
  [
    { name: 'design_request', description: 'Original design request', required: true },
  ]
);

const componentSelectionTemplate = createTemplate(
  'component-selection',
  'Component Selection',
  `Based on these requirements, select appropriate components:

Requirements:
{{requirements}}

For each component, provide:
- Component type and value
- Specific part number if applicable
- Key specifications
- Pin configuration

Focus on commonly available components.`,
  [
    { name: 'requirements', description: 'Analyzed requirements', required: true },
  ]
);

const schematicGenerationTemplate = createTemplate(
  'schematic-generation',
  'Schematic Generation',
  `Generate a complete PCB schematic JSON based on:

Requirements: {{requirements}}
Components: {{components}}
Original Request: {{design_request}}

Create a properly connected schematic with accurate pin assignments.
Return the schematic as a JSON object in the following format:

\`\`\`json
{
  "title": "string",
  "description": "string",
  "components": [...],
  "connections": [...]
}
\`\`\``,
  [
    { name: 'requirements', description: 'Analyzed requirements', required: true },
    { name: 'components', description: 'Selected components', required: true },
    { name: 'design_request', description: 'Original request', required: true },
  ]
);

const designReviewTemplate = createTemplate(
  'design-review',
  'Design Review',
  `Review this PCB schematic for issues:

{{schematic}}

Check for:
1. Missing connections
2. Incorrect pin assignments
3. Power supply issues
4. Ground path problems
5. Signal integrity concerns

Provide specific recommendations for improvement.`,
  [
    { name: 'schematic', description: 'Generated schematic', required: true },
  ]
);

/**
 * Full design chain - from request to reviewed schematic
 */
export const fullDesignChain: PromptChain = {
  id: 'full-design-chain',
  name: 'Full PCB Design Chain',
  description: 'Complete flow from design request to reviewed schematic',
  steps: [
    {
      id: 'analyze-requirements',
      name: 'Analyze Requirements',
      template: requirementsAnalysisTemplate,
      inputMapping: {
        design_request: 'userRequest',
      },
      outputKey: 'requirements',
    },
    {
      id: 'select-components',
      name: 'Select Components',
      template: componentSelectionTemplate,
      outputKey: 'components',
    },
    {
      id: 'generate-schematic',
      name: 'Generate Schematic',
      template: schematicGenerationTemplate,
      inputMapping: {
        design_request: 'userRequest',
      },
      outputKey: 'schematic',
      transform: (response: string) => {
        // Extract JSON from response
        const match = response.match(/```json\n?([\s\S]*?)\n?```/);
        return match ? match[1] : response;
      },
    },
  ],
};

/**
 * Design with review chain - adds review step
 */
export const designWithReviewChain: PromptChain = {
  id: 'design-with-review-chain',
  name: 'PCB Design with Review',
  description: 'Design flow with automatic review step',
  steps: [
    ...fullDesignChain.steps,
    {
      id: 'review-design',
      name: 'Review Design',
      template: designReviewTemplate,
      outputKey: 'review',
    },
  ],
};

/**
 * Quick design chain - simplified for fast results
 */
export const quickDesignChain: PromptChain = {
  id: 'quick-design-chain',
  name: 'Quick PCB Design',
  description: 'Fast single-step design generation',
  steps: [
    {
      id: 'quick-generate',
      name: 'Generate Schematic',
      template: createTemplate(
        'quick-generate',
        'Quick Generate',
        `Generate a PCB schematic for: {{design_request}}

Return a complete schematic JSON with components and connections.
Use sensible defaults for component values and positions.

\`\`\`json
{
  "title": "string",
  "description": "string",
  "components": [...],
  "connections": [...]
}
\`\`\``,
        [{ name: 'design_request', description: 'Design request', required: true }]
      ),
      inputMapping: {
        design_request: 'userRequest',
      },
      outputKey: 'schematic',
      transform: (response: string) => {
        const match = response.match(/```json\n?([\s\S]*?)\n?```/);
        return match ? match[1] : response;
      },
    },
  ],
};

export const pcbChains = {
  fullDesign: fullDesignChain,
  designWithReview: designWithReviewChain,
  quickDesign: quickDesignChain,
};
