/**
 * Base Prompt Chain
 * Multi-step prompt execution with context passing
 */

import type { LLMClient, Message, CompletionResponse, ChatOptions } from '../../core/interfaces/llm.interface';
import type { PromptTemplate } from '../templates/base.template';
import { renderTemplate } from '../templates/base.template';
import { logger } from '../../../config/logging.config';

export interface ChainStep {
  id: string;
  name: string;
  template: PromptTemplate;
  inputMapping?: Record<string, string>; // Maps chain context keys to template variables
  outputKey: string; // Key to store the result in chain context
  transform?: (response: string, context: ChainContext) => string;
  condition?: (context: ChainContext) => boolean; // Skip step if returns false
}

export interface ChainContext {
  [key: string]: string | number | boolean | object;
}

export interface ChainResult {
  success: boolean;
  finalOutput: string;
  context: ChainContext;
  steps: Array<{
    stepId: string;
    input: string;
    output: string;
    skipped: boolean;
    latencyMs: number;
  }>;
  totalLatencyMs: number;
}

export interface PromptChain {
  id: string;
  name: string;
  description: string;
  steps: ChainStep[];
}

/**
 * Execute a prompt chain
 */
export async function executeChain(
  chain: PromptChain,
  client: LLMClient,
  initialContext: ChainContext,
  options?: ChatOptions
): Promise<ChainResult> {
  const startTime = Date.now();
  const context: ChainContext = { ...initialContext };
  const stepResults: ChainResult['steps'] = [];

  logger.info('Starting prompt chain execution', {
    chainId: chain.id,
    stepCount: chain.steps.length,
  });

  for (const step of chain.steps) {
    const stepStartTime = Date.now();

    // Check condition
    if (step.condition && !step.condition(context)) {
      logger.debug('Skipping chain step due to condition', { stepId: step.id });
      stepResults.push({
        stepId: step.id,
        input: '',
        output: '',
        skipped: true,
        latencyMs: 0,
      });
      continue;
    }

    // Map context to template variables
    const variables: Record<string, string> = {};
    if (step.inputMapping) {
      for (const [templateVar, contextKey] of Object.entries(step.inputMapping)) {
        const value = context[contextKey];
        variables[templateVar] = typeof value === 'string' ? value : JSON.stringify(value);
      }
    } else {
      // Auto-map matching keys
      for (const variable of step.template.variables) {
        const value = context[variable.name];
        if (value !== undefined) {
          variables[variable.name] = typeof value === 'string' ? value : JSON.stringify(value);
        }
      }
    }

    // Render the prompt
    const prompt = renderTemplate(step.template, variables);

    logger.debug('Executing chain step', {
      stepId: step.id,
      promptLength: prompt.length,
    });

    try {
      // Execute the prompt
      const response = await client.complete(prompt, options);
      let output = response.content;

      // Apply transform if provided
      if (step.transform) {
        output = step.transform(output, context);
      }

      // Store in context
      context[step.outputKey] = output;

      stepResults.push({
        stepId: step.id,
        input: prompt,
        output,
        skipped: false,
        latencyMs: Date.now() - stepStartTime,
      });

      logger.debug('Chain step completed', {
        stepId: step.id,
        outputLength: output.length,
        latencyMs: Date.now() - stepStartTime,
      });
    } catch (error) {
      logger.error('Chain step failed', error as Error, { stepId: step.id });

      return {
        success: false,
        finalOutput: '',
        context,
        steps: stepResults,
        totalLatencyMs: Date.now() - startTime,
      };
    }
  }

  // Get final output from last step
  const lastStep = chain.steps[chain.steps.length - 1];
  const finalOutput = String(context[lastStep.outputKey] || '');

  logger.info('Prompt chain completed', {
    chainId: chain.id,
    totalLatencyMs: Date.now() - startTime,
  });

  return {
    success: true,
    finalOutput,
    context,
    steps: stepResults,
    totalLatencyMs: Date.now() - startTime,
  };
}

/**
 * Create a simple two-step chain
 */
export function createSimpleChain(
  id: string,
  name: string,
  steps: ChainStep[]
): PromptChain {
  return {
    id,
    name,
    description: '',
    steps,
  };
}
