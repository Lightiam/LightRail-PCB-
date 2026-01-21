/**
 * Vector Store
 * In-memory vector database with persistence support
 */

import { cosineSimilarity, euclideanDistance } from './embeddings';
import { logger } from '../../config/logging.config';

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface SearchResult {
  document: VectorDocument;
  score: number;
  distance?: number;
}

export interface VectorStoreConfig {
  dimensions: number;
  similarityMetric: 'cosine' | 'euclidean';
  maxDocuments?: number;
}

export interface VectorStore {
  add(doc: Omit<VectorDocument, 'createdAt'>): Promise<void>;
  addBatch(docs: Array<Omit<VectorDocument, 'createdAt'>>): Promise<void>;
  search(query: number[], topK?: number, filter?: (doc: VectorDocument) => boolean): Promise<SearchResult[]>;
  get(id: string): VectorDocument | undefined;
  delete(id: string): boolean;
  clear(): void;
  size(): number;
  export(): VectorDocument[];
  import(docs: VectorDocument[]): void;
}

/**
 * In-memory vector store implementation
 */
export class InMemoryVectorStore implements VectorStore {
  private documents: Map<string, VectorDocument> = new Map();
  private config: VectorStoreConfig;

  constructor(config: Partial<VectorStoreConfig> = {}) {
    this.config = {
      dimensions: config.dimensions || 1536,
      similarityMetric: config.similarityMetric || 'cosine',
      maxDocuments: config.maxDocuments,
    };
  }

  async add(doc: Omit<VectorDocument, 'createdAt'>): Promise<void> {
    if (doc.embedding.length !== this.config.dimensions) {
      throw new Error(
        `Embedding dimensions mismatch: expected ${this.config.dimensions}, got ${doc.embedding.length}`
      );
    }

    if (this.config.maxDocuments && this.documents.size >= this.config.maxDocuments) {
      // Remove oldest document
      const oldest = Array.from(this.documents.values())
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
      if (oldest) {
        this.documents.delete(oldest.id);
      }
    }

    this.documents.set(doc.id, {
      ...doc,
      createdAt: new Date(),
    });

    logger.debug('Added document to vector store', { id: doc.id });
  }

  async addBatch(docs: Array<Omit<VectorDocument, 'createdAt'>>): Promise<void> {
    for (const doc of docs) {
      await this.add(doc);
    }
  }

  async search(
    query: number[],
    topK: number = 5,
    filter?: (doc: VectorDocument) => boolean
  ): Promise<SearchResult[]> {
    if (query.length !== this.config.dimensions) {
      throw new Error(
        `Query dimensions mismatch: expected ${this.config.dimensions}, got ${query.length}`
      );
    }

    const results: SearchResult[] = [];

    for (const doc of this.documents.values()) {
      if (filter && !filter(doc)) {
        continue;
      }

      let score: number;
      let distance: number | undefined;

      if (this.config.similarityMetric === 'cosine') {
        score = cosineSimilarity(query, doc.embedding);
      } else {
        distance = euclideanDistance(query, doc.embedding);
        score = 1 / (1 + distance); // Convert distance to similarity
      }

      results.push({ document: doc, score, distance });
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, topK);
  }

  get(id: string): VectorDocument | undefined {
    return this.documents.get(id);
  }

  delete(id: string): boolean {
    return this.documents.delete(id);
  }

  clear(): void {
    this.documents.clear();
    logger.info('Cleared vector store');
  }

  size(): number {
    return this.documents.size;
  }

  export(): VectorDocument[] {
    return Array.from(this.documents.values());
  }

  import(docs: VectorDocument[]): void {
    for (const doc of docs) {
      this.documents.set(doc.id, doc);
    }
    logger.info('Imported documents to vector store', { count: docs.length });
  }
}

/**
 * Persistent vector store with localStorage
 */
export class PersistentVectorStore extends InMemoryVectorStore {
  private storageKey: string;

  constructor(storageKey: string, config?: Partial<VectorStoreConfig>) {
    super(config);
    this.storageKey = storageKey;
    this.load();
  }

  async add(doc: Omit<VectorDocument, 'createdAt'>): Promise<void> {
    await super.add(doc);
    this.save();
  }

  delete(id: string): boolean {
    const result = super.delete(id);
    if (result) this.save();
    return result;
  }

  clear(): void {
    super.clear();
    this.save();
  }

  private save(): void {
    try {
      const data = JSON.stringify(this.export());
      localStorage.setItem(this.storageKey, data);
    } catch (error) {
      logger.warn('Failed to persist vector store', { error });
    }
  }

  private load(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const docs = JSON.parse(data);
        this.import(docs.map((d: VectorDocument) => ({
          ...d,
          createdAt: new Date(d.createdAt),
        })));
      }
    } catch (error) {
      logger.warn('Failed to load vector store', { error });
    }
  }
}

/**
 * Create a vector store
 */
export function createVectorStore(
  type: 'memory' | 'persistent' = 'memory',
  config?: Partial<VectorStoreConfig>,
  storageKey?: string
): VectorStore {
  if (type === 'persistent' && storageKey) {
    return new PersistentVectorStore(storageKey, config);
  }
  return new InMemoryVectorStore(config);
}
