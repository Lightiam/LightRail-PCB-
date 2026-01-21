/**
 * Data Cleaning
 * Text preprocessing and normalization for LLM input
 */

export interface CleaningOptions {
  removeExtraWhitespace: boolean;
  normalizeUnicode: boolean;
  removeControlChars: boolean;
  truncateLength?: number;
  preserveCodeBlocks: boolean;
  preserveUrls: boolean;
}

const defaultOptions: CleaningOptions = {
  removeExtraWhitespace: true,
  normalizeUnicode: true,
  removeControlChars: true,
  preserveCodeBlocks: true,
  preserveUrls: true,
};

/**
 * Clean and normalize text for LLM processing
 */
export function cleanText(text: string, options: Partial<CleaningOptions> = {}): string {
  const opts = { ...defaultOptions, ...options };
  let result = text;

  // Extract and preserve code blocks
  const codeBlocks: string[] = [];
  if (opts.preserveCodeBlocks) {
    result = result.replace(/```[\s\S]*?```/g, (match) => {
      codeBlocks.push(match);
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });
  }

  // Extract and preserve URLs
  const urls: string[] = [];
  if (opts.preserveUrls) {
    result = result.replace(/https?:\/\/[^\s]+/g, (match) => {
      urls.push(match);
      return `__URL_${urls.length - 1}__`;
    });
  }

  // Remove control characters (except newlines and tabs)
  if (opts.removeControlChars) {
    result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  // Normalize unicode
  if (opts.normalizeUnicode) {
    result = result.normalize('NFKC');
    // Replace common unicode characters with ASCII equivalents
    result = result
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .replace(/[–—]/g, '-')
      .replace(/…/g, '...')
      .replace(/•/g, '*');
  }

  // Remove extra whitespace
  if (opts.removeExtraWhitespace) {
    // Collapse multiple spaces to single space
    result = result.replace(/[ \t]+/g, ' ');
    // Collapse multiple newlines to double newline
    result = result.replace(/\n{3,}/g, '\n\n');
    // Remove leading/trailing whitespace from lines
    result = result.split('\n').map(line => line.trim()).join('\n');
  }

  // Restore URLs
  if (opts.preserveUrls) {
    for (let i = 0; i < urls.length; i++) {
      result = result.replace(`__URL_${i}__`, urls[i]);
    }
  }

  // Restore code blocks
  if (opts.preserveCodeBlocks) {
    for (let i = 0; i < codeBlocks.length; i++) {
      result = result.replace(`__CODE_BLOCK_${i}__`, codeBlocks[i]);
    }
  }

  // Truncate if specified
  if (opts.truncateLength && result.length > opts.truncateLength) {
    result = result.slice(0, opts.truncateLength) + '...';
  }

  return result.trim();
}

/**
 * Remove sensitive information from text
 */
export function sanitizeText(text: string): string {
  let result = text;

  // Remove potential API keys (common patterns)
  result = result.replace(/(?:api[_-]?key|apikey|secret|token)[:\s=]+['"]?[\w-]{20,}['"]?/gi, '[REDACTED_API_KEY]');

  // Remove email addresses
  result = result.replace(/\b[\w.-]+@[\w.-]+\.\w{2,}\b/g, '[REDACTED_EMAIL]');

  // Remove phone numbers
  result = result.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]');

  // Remove credit card numbers
  result = result.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[REDACTED_CARD]');

  // Remove SSN patterns
  result = result.replace(/\b\d{3}[-]?\d{2}[-]?\d{4}\b/g, '[REDACTED_SSN]');

  return result;
}

/**
 * Extract text from HTML
 */
export function stripHtml(html: string): string {
  // Remove script and style elements
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Replace common block elements with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Remove all remaining tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return cleanText(text);
}

/**
 * Extract JSON from text that may contain markdown code blocks
 */
export function extractJson(text: string): string | null {
  // Try to find JSON in code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find raw JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      JSON.parse(jsonMatch[0]);
      return jsonMatch[0];
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Normalize schematic-specific content
 */
export function normalizeSchematicText(text: string): string {
  let result = cleanText(text);

  // Normalize component references
  result = result.replace(/\bR(\d+)\b/gi, 'R$1'); // Resistors
  result = result.replace(/\bC(\d+)\b/gi, 'C$1'); // Capacitors
  result = result.replace(/\bU(\d+)\b/gi, 'U$1'); // ICs
  result = result.replace(/\bD(\d+)\b/gi, 'D$1'); // Diodes
  result = result.replace(/\bQ(\d+)\b/gi, 'Q$1'); // Transistors
  result = result.replace(/\bL(\d+)\b/gi, 'L$1'); // Inductors

  // Normalize voltage references
  result = result.replace(/(\d+)\s*v\b/gi, '$1V');
  result = result.replace(/(\d+)\s*volts?\b/gi, '$1V');

  // Normalize units
  result = result.replace(/(\d+)\s*kohm/gi, '$1kΩ');
  result = result.replace(/(\d+)\s*ohm/gi, '$1Ω');
  result = result.replace(/(\d+)\s*uf/gi, '$1µF');
  result = result.replace(/(\d+)\s*nf/gi, '$1nF');
  result = result.replace(/(\d+)\s*pf/gi, '$1pF');

  return result;
}
