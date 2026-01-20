/**
 * Vector Store Unit Tests
 * Tests for vector storage and retrieval
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryVectorStore, createVectorStore } from '../../src/rag/vector-store';
import { cosineSimilarity, euclideanDistance } from '../../src/rag/embeddings';

describe('InMemoryVectorStore', () => {
  let store: InMemoryVectorStore;

  beforeEach(() => {
    store = new InMemoryVectorStore({ dimensions: 3 });
  });

  it('should add documents', async () => {
    await store.add({
      id: 'doc1',
      content: 'Test content',
      embedding: [0.1, 0.2, 0.3],
    });

    expect(store.size()).toBe(1);
  });

  it('should retrieve documents by ID', async () => {
    await store.add({
      id: 'doc1',
      content: 'Test content',
      embedding: [0.1, 0.2, 0.3],
    });

    const doc = store.get('doc1');
    expect(doc).toBeDefined();
    expect(doc?.content).toBe('Test content');
  });

  it('should search by similarity', async () => {
    await store.addBatch([
      { id: 'doc1', content: 'Similar', embedding: [0.9, 0.1, 0.0] },
      { id: 'doc2', content: 'Different', embedding: [0.0, 0.1, 0.9] },
    ]);

    const results = await store.search([1.0, 0.0, 0.0], 2);

    expect(results).toHaveLength(2);
    expect(results[0].document.id).toBe('doc1');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it('should delete documents', async () => {
    await store.add({
      id: 'doc1',
      content: 'Test',
      embedding: [0.1, 0.2, 0.3],
    });

    const deleted = store.delete('doc1');
    expect(deleted).toBe(true);
    expect(store.size()).toBe(0);
  });

  it('should clear all documents', async () => {
    await store.addBatch([
      { id: 'doc1', content: 'Test 1', embedding: [0.1, 0.2, 0.3] },
      { id: 'doc2', content: 'Test 2', embedding: [0.4, 0.5, 0.6] },
    ]);

    store.clear();
    expect(store.size()).toBe(0);
  });

  it('should export and import documents', async () => {
    await store.addBatch([
      { id: 'doc1', content: 'Test 1', embedding: [0.1, 0.2, 0.3] },
      { id: 'doc2', content: 'Test 2', embedding: [0.4, 0.5, 0.6] },
    ]);

    const exported = store.export();
    expect(exported).toHaveLength(2);

    const newStore = new InMemoryVectorStore({ dimensions: 3 });
    newStore.import(exported);
    expect(newStore.size()).toBe(2);
  });

  it('should enforce dimension constraints', async () => {
    await expect(
      store.add({
        id: 'doc1',
        content: 'Test',
        embedding: [0.1, 0.2], // Wrong dimensions
      })
    ).rejects.toThrow('dimensions mismatch');
  });

  it('should enforce max documents limit', async () => {
    const limitedStore = new InMemoryVectorStore({
      dimensions: 3,
      maxDocuments: 2,
    });

    await limitedStore.add({ id: 'doc1', content: 'Test 1', embedding: [0.1, 0.2, 0.3] });
    await limitedStore.add({ id: 'doc2', content: 'Test 2', embedding: [0.4, 0.5, 0.6] });
    await limitedStore.add({ id: 'doc3', content: 'Test 3', embedding: [0.7, 0.8, 0.9] });

    expect(limitedStore.size()).toBe(2);
  });

  it('should filter results', async () => {
    await store.addBatch([
      { id: 'doc1', content: 'Keep', embedding: [0.9, 0.1, 0.0], metadata: { keep: true } },
      { id: 'doc2', content: 'Skip', embedding: [0.8, 0.2, 0.0], metadata: { keep: false } },
    ]);

    const results = await store.search(
      [1.0, 0.0, 0.0],
      10,
      (doc) => doc.metadata?.keep === true
    );

    expect(results).toHaveLength(1);
    expect(results[0].document.id).toBe('doc1');
  });
});

describe('Similarity Functions', () => {
  it('should compute cosine similarity', () => {
    const a = [1, 0, 0];
    const b = [1, 0, 0];
    expect(cosineSimilarity(a, b)).toBeCloseTo(1.0);

    const c = [1, 0, 0];
    const d = [0, 1, 0];
    expect(cosineSimilarity(c, d)).toBeCloseTo(0.0);
  });

  it('should compute euclidean distance', () => {
    const a = [0, 0, 0];
    const b = [1, 0, 0];
    expect(euclideanDistance(a, b)).toBeCloseTo(1.0);

    const c = [0, 0, 0];
    const d = [3, 4, 0];
    expect(euclideanDistance(c, d)).toBeCloseTo(5.0);
  });
});

describe('createVectorStore', () => {
  it('should create memory store by default', () => {
    const store = createVectorStore();
    expect(store).toBeInstanceOf(InMemoryVectorStore);
  });
});
