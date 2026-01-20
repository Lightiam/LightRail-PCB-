/**
 * Tokenization Utilities
 * Token counting and management for LLM context
 */

export interface TokenCounter {
  count(text: string): number;
  truncate(text: string, maxTokens: number): string;
  split(text: string, maxTokens: number): string[];
}

/**
 * Simple character-based token estimation
 * Average ~4 characters per token for English text
 */
class SimpleTokenCounter implements TokenCounter {
  private charsPerToken: number;

  constructor(charsPerToken: number = 4) {
    this.charsPerToken = charsPerToken;
  }

  count(text: string): number {
    return Math.ceil(text.length / this.charsPerToken);
  }

  truncate(text: string, maxTokens: number): string {
    const maxChars = maxTokens * this.charsPerToken;
    if (text.length <= maxChars) {
      return text;
    }

    // Try to truncate at a sentence boundary
    const truncated = text.slice(0, maxChars);
    const lastSentence = truncated.lastIndexOf('. ');

    if (lastSentence > maxChars * 0.7) {
      return truncated.slice(0, lastSentence + 1);
    }

    // Try word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxChars * 0.9) {
      return truncated.slice(0, lastSpace) + '...';
    }

    return truncated + '...';
  }

  split(text: string, maxTokens: number): string[] {
    const maxChars = maxTokens * this.charsPerToken;
    const parts: string[] = [];

    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= maxChars) {
        parts.push(remaining);
        break;
      }

      // Find good split point
      let splitPoint = maxChars;
      const lastSentence = remaining.slice(0, maxChars).lastIndexOf('. ');
      if (lastSentence > maxChars * 0.5) {
        splitPoint = lastSentence + 1;
      } else {
        const lastSpace = remaining.slice(0, maxChars).lastIndexOf(' ');
        if (lastSpace > maxChars * 0.7) {
          splitPoint = lastSpace;
        }
      }

      parts.push(remaining.slice(0, splitPoint).trim());
      remaining = remaining.slice(splitPoint).trim();
    }

    return parts;
  }
}

/**
 * GPT-style tokenizer approximation
 * Uses word and subword estimation
 */
class GPTTokenCounter implements TokenCounter {
  count(text: string): number {
    // More accurate estimation based on GPT tokenization patterns
    let tokens = 0;

    // Count words (roughly 1 token per word)
    const words = text.split(/\s+/);
    tokens += words.length;

    // Add tokens for punctuation and special characters
    const punctuation = text.match(/[.,!?;:'"()\[\]{}]/g);
    tokens += punctuation ? punctuation.length * 0.5 : 0;

    // Adjust for long words (likely split into subwords)
    for (const word of words) {
      if (word.length > 10) {
        tokens += Math.floor(word.length / 5);
      }
    }

    return Math.ceil(tokens);
  }

  truncate(text: string, maxTokens: number): string {
    const currentTokens = this.count(text);
    if (currentTokens <= maxTokens) {
      return text;
    }

    // Binary search for optimal truncation point
    let low = 0;
    let high = text.length;

    while (high - low > 10) {
      const mid = Math.floor((low + high) / 2);
      const truncated = text.slice(0, mid);

      if (this.count(truncated) <= maxTokens) {
        low = mid;
      } else {
        high = mid;
      }
    }

    // Find good truncation point
    let truncated = text.slice(0, low);
    const lastSentence = truncated.lastIndexOf('. ');
    if (lastSentence > low * 0.7) {
      truncated = truncated.slice(0, lastSentence + 1);
    }

    return truncated.trim();
  }

  split(text: string, maxTokens: number): string[] {
    const parts: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (this.count(remaining) <= maxTokens) {
        parts.push(remaining);
        break;
      }

      const truncated = this.truncate(remaining, maxTokens);
      parts.push(truncated);
      remaining = remaining.slice(truncated.length).trim();
    }

    return parts;
  }
}

/**
 * Create a token counter
 */
export function createTokenCounter(type: 'simple' | 'gpt' = 'gpt'): TokenCounter {
  switch (type) {
    case 'gpt':
      return new GPTTokenCounter();
    case 'simple':
    default:
      return new SimpleTokenCounter();
  }
}

/**
 * Estimate tokens for different model families
 */
export function estimateTokens(text: string, model: string = 'gpt-4'): number {
  const counter = createTokenCounter('gpt');
  const baseCount = counter.count(text);

  // Adjust for different model tokenizers
  if (model.includes('claude')) {
    return Math.ceil(baseCount * 1.1); // Claude tends to use slightly more tokens
  }
  if (model.includes('gemini')) {
    return Math.ceil(baseCount * 0.95); // Gemini is slightly more efficient
  }

  return baseCount;
}

/**
 * Calculate context window usage
 */
export function calculateContextUsage(
  systemPrompt: string,
  messages: string[],
  maxContext: number
): {
  used: number;
  remaining: number;
  percentUsed: number;
} {
  const counter = createTokenCounter('gpt');
  const systemTokens = counter.count(systemPrompt);
  const messageTokens = messages.reduce((sum, m) => sum + counter.count(m), 0);
  const used = systemTokens + messageTokens;

  return {
    used,
    remaining: Math.max(0, maxContext - used),
    percentUsed: (used / maxContext) * 100,
  };
}
