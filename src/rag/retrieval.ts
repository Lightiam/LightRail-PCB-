/**
 * Retrieval Module
 * Document retrieval and context building for RAG
 */

import type { VectorStore, SearchResult, VectorDocument } from './vector-store';
import type { EmbeddingProvider, EmbeddingResult } from './embeddings';
import { logger } from '../../config/logging.config';

export interface RetrievalConfig {
  topK: number;
  minScore: number;
  maxContextLength: number;
  includeMetadata: boolean;
}

export interface RetrievalResult {
  query: string;
  documents: SearchResult[];
  context: string;
  tokenEstimate: number;
}

export interface DocumentIndexer {
  index(content: string, metadata?: Record<string, unknown>): Promise<string>;
  indexBatch(documents: Array<{ content: string; metadata?: Record<string, unknown> }>): Promise<string[]>;
  remove(id: string): boolean;
  clear(): void;
}

const defaultConfig: RetrievalConfig = {
  topK: 5,
  minScore: 0.5,
  maxContextLength: 4000,
  includeMetadata: true,
};

/**
 * Document retriever for RAG
 */
export class Retriever {
  private config: RetrievalConfig;

  constructor(
    private vectorStore: VectorStore,
    private embeddingProvider: EmbeddingProvider,
    config: Partial<RetrievalConfig> = {}
  ) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Retrieve relevant documents for a query
   */
  async retrieve(query: string, options?: Partial<RetrievalConfig>): Promise<RetrievalResult> {
    const config = { ...this.config, ...options };
    const startTime = Date.now();

    // Generate query embedding
    const queryEmbedding = await this.embeddingProvider.embed(query);

    // Search vector store
    const results = await this.vectorStore.search(
      queryEmbedding.embedding,
      config.topK,
      (doc) => true // Could add filters here
    );

    // Filter by minimum score
    const filtered = results.filter(r => r.score >= config.minScore);

    // Build context string
    const context = this.buildContext(filtered, config);

    logger.debug('Retrieved documents', {
      query: query.slice(0, 50),
      totalResults: results.length,
      filteredResults: filtered.length,
      latencyMs: Date.now() - startTime,
    });

    return {
      query,
      documents: filtered,
      context,
      tokenEstimate: Math.ceil(context.length / 4),
    };
  }

  /**
   * Build context string from retrieved documents
   */
  private buildContext(results: SearchResult[], config: RetrievalConfig): string {
    const parts: string[] = [];
    let currentLength = 0;

    for (const result of results) {
      const docContent = this.formatDocument(result, config);

      if (currentLength + docContent.length > config.maxContextLength) {
        break;
      }

      parts.push(docContent);
      currentLength += docContent.length;
    }

    return parts.join('\n\n---\n\n');
  }

  /**
   * Format a single document for context
   */
  private formatDocument(result: SearchResult, config: RetrievalConfig): string {
    const { document, score } = result;
    const parts: string[] = [];

    if (config.includeMetadata && document.metadata) {
      const metaStr = Object.entries(document.metadata)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      if (metaStr) {
        parts.push(`[${metaStr}]`);
      }
    }

    parts.push(document.content);

    return parts.join('\n');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RetrievalConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Document indexer for adding documents to the vector store
 */
export class Indexer implements DocumentIndexer {
  private idCounter = 0;

  constructor(
    private vectorStore: VectorStore,
    private embeddingProvider: EmbeddingProvider
  ) {}

  /**
   * Index a single document
   */
  async index(content: string, metadata?: Record<string, unknown>): Promise<string> {
    const id = `doc-${Date.now()}-${this.idCounter++}`;
    const embedding = await this.embeddingProvider.embed(content);

    await this.vectorStore.add({
      id,
      content,
      embedding: embedding.embedding,
      metadata,
    });

    logger.debug('Indexed document', { id, contentLength: content.length });

    return id;
  }

  /**
   * Index multiple documents
   */
  async indexBatch(
    documents: Array<{ content: string; metadata?: Record<string, unknown> }>
  ): Promise<string[]> {
    const embeddings = await this.embeddingProvider.embedBatch(
      documents.map(d => d.content)
    );

    const ids: string[] = [];

    for (let i = 0; i < documents.length; i++) {
      const id = `doc-${Date.now()}-${this.idCounter++}`;
      await this.vectorStore.add({
        id,
        content: documents[i].content,
        embedding: embeddings[i].embedding,
        metadata: documents[i].metadata,
      });
      ids.push(id);
    }

    logger.info('Indexed document batch', { count: documents.length });

    return ids;
  }

  /**
   * Remove a document
   */
  remove(id: string): boolean {
    return this.vectorStore.delete(id);
  }

  /**
   * Clear all documents
   */
  clear(): void {
    this.vectorStore.clear();
  }
}

/**
 * Create a retriever and indexer pair
 */
export function createRAGSystem(
  vectorStore: VectorStore,
  embeddingProvider: EmbeddingProvider,
  config?: Partial<RetrievalConfig>
): { retriever: Retriever; indexer: Indexer } {
  return {
    retriever: new Retriever(vectorStore, embeddingProvider, config),
    indexer: new Indexer(vectorStore, embeddingProvider),
  };
}
