/**
 * Embeddings Module
 * Handle text embedding creation for semantic search
 */

import { logger } from '../../config/logging.config';
import type { ModelProvider } from '../../config/model.config';

export interface EmbeddingConfig {
  provider: ModelProvider;
  model: string;
  dimensions: number;
  apiKey?: string;
  baseUrl?: string;
}

export interface EmbeddingResult {
  embedding: number[];
  text: string;
  model: string;
  dimensions: number;
}

export interface EmbeddingProvider {
  embed(text: string): Promise<EmbeddingResult>;
  embedBatch(texts: string[]): Promise<EmbeddingResult[]>;
}

const defaultConfig: EmbeddingConfig = {
  provider: 'openai',
  model: 'text-embedding-3-small',
  dimensions: 1536,
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
};

/**
 * OpenAI Embeddings Provider
 */
class OpenAIEmbeddingProvider implements EmbeddingProvider {
  constructor(private config: EmbeddingConfig) {}

  async embed(text: string): Promise<EmbeddingResult> {
    const results = await this.embedBatch([text]);
    return results[0];
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key required for embeddings');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        input: texts,
        dimensions: this.config.dimensions,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI embedding error: ${response.status}`);
    }

    const data = await response.json();

    return data.data.map((item: { embedding: number[] }, index: number) => ({
      embedding: item.embedding,
      text: texts[index],
      model: this.config.model,
      dimensions: item.embedding.length,
    }));
  }
}

/**
 * Local/Simple Embeddings (TF-IDF based for offline use)
 */
class LocalEmbeddingProvider implements EmbeddingProvider {
  private vocabulary: Map<string, number> = new Map();
  private idf: Map<string, number> = new Map();
  private dimensions: number;

  constructor(config: EmbeddingConfig) {
    this.dimensions = config.dimensions || 512;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const tokens = this.tokenize(text);
    const embedding = this.computeTFIDF(tokens);

    return {
      embedding,
      text,
      model: 'local-tfidf',
      dimensions: embedding.length,
    };
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    return Promise.all(texts.map(text => this.embed(text)));
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }

  private computeTFIDF(tokens: string[]): number[] {
    // Simple hash-based embedding for demonstration
    const embedding = new Array(this.dimensions).fill(0);

    for (const token of tokens) {
      const hash = this.hashString(token);
      const index = Math.abs(hash) % this.dimensions;
      embedding[index] += 1;
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}

/**
 * Create an embedding provider
 */
export function createEmbeddingProvider(
  config: Partial<EmbeddingConfig> = {}
): EmbeddingProvider {
  const mergedConfig = { ...defaultConfig, ...config };

  switch (mergedConfig.provider) {
    case 'openai':
      return new OpenAIEmbeddingProvider(mergedConfig);
    case 'local':
    default:
      return new LocalEmbeddingProvider(mergedConfig);
  }
}

/**
 * Compute cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have same dimensions');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Compute Euclidean distance between two embeddings
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have same dimensions');
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}
