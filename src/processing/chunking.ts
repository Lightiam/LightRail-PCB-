/**
 * Text Chunking
 * Split documents into optimal chunks for embedding and retrieval
 */

export interface ChunkConfig {
  maxChunkSize: number;
  chunkOverlap: number;
  separators: string[];
  preserveStructure: boolean;
}

export interface TextChunk {
  content: string;
  index: number;
  startOffset: number;
  endOffset: number;
  metadata?: Record<string, unknown>;
}

const defaultConfig: ChunkConfig = {
  maxChunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', '. ', ', ', ' '],
  preserveStructure: true,
};

/**
 * Split text into chunks using recursive character splitting
 */
export function chunkText(text: string, config: Partial<ChunkConfig> = {}): TextChunk[] {
  const cfg = { ...defaultConfig, ...config };
  const chunks: TextChunk[] = [];
  let currentOffset = 0;

  const splitRecursively = (text: string, separators: string[]): string[] => {
    if (text.length <= cfg.maxChunkSize) {
      return [text];
    }

    if (separators.length === 0) {
      // Hard split if no separators left
      const result: string[] = [];
      for (let i = 0; i < text.length; i += cfg.maxChunkSize - cfg.chunkOverlap) {
        result.push(text.slice(i, i + cfg.maxChunkSize));
      }
      return result;
    }

    const separator = separators[0];
    const parts = text.split(separator);
    const result: string[] = [];
    let current = '';

    for (const part of parts) {
      const potentialChunk = current ? current + separator + part : part;

      if (potentialChunk.length <= cfg.maxChunkSize) {
        current = potentialChunk;
      } else {
        if (current) {
          result.push(current);
        }

        if (part.length > cfg.maxChunkSize) {
          // Recursively split with next separator
          const subChunks = splitRecursively(part, separators.slice(1));
          result.push(...subChunks);
          current = '';
        } else {
          current = part;
        }
      }
    }

    if (current) {
      result.push(current);
    }

    return result;
  };

  const rawChunks = splitRecursively(text, cfg.separators);

  // Add overlap between chunks
  for (let i = 0; i < rawChunks.length; i++) {
    let content = rawChunks[i];

    // Add overlap from previous chunk
    if (i > 0 && cfg.chunkOverlap > 0) {
      const prevChunk = rawChunks[i - 1];
      const overlapText = prevChunk.slice(-cfg.chunkOverlap);
      content = overlapText + content;
    }

    const startOffset = currentOffset;
    currentOffset += rawChunks[i].length;

    chunks.push({
      content: content.trim(),
      index: i,
      startOffset,
      endOffset: currentOffset,
    });
  }

  return chunks.filter(c => c.content.length > 0);
}

/**
 * Split text by sentences
 */
export function chunkBySentences(text: string, sentencesPerChunk: number = 5): TextChunk[] {
  const sentenceRegex = /[^.!?]*[.!?]+/g;
  const sentences = text.match(sentenceRegex) || [text];
  const chunks: TextChunk[] = [];
  let currentOffset = 0;

  for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
    const chunkSentences = sentences.slice(i, i + sentencesPerChunk);
    const content = chunkSentences.join(' ').trim();

    chunks.push({
      content,
      index: chunks.length,
      startOffset: currentOffset,
      endOffset: currentOffset + content.length,
    });

    currentOffset += content.length + 1;
  }

  return chunks;
}

/**
 * Split code by logical blocks
 */
export function chunkCode(code: string, config: Partial<ChunkConfig> = {}): TextChunk[] {
  const cfg = { ...defaultConfig, ...config };

  // Split by function/class definitions
  const codeBlockRegex = /(?:^|\n)((?:export\s+)?(?:function|class|const|let|var|interface|type)\s+\w+[\s\S]*?)(?=\n(?:export\s+)?(?:function|class|const|let|var|interface|type)\s+\w+|$)/g;

  const chunks: TextChunk[] = [];
  let match;
  let index = 0;

  while ((match = codeBlockRegex.exec(code)) !== null) {
    const content = match[1].trim();

    if (content.length > cfg.maxChunkSize) {
      // Further split large blocks
      const subChunks = chunkText(content, cfg);
      chunks.push(...subChunks.map((c, i) => ({
        ...c,
        index: index + i,
        metadata: { type: 'code' },
      })));
      index += subChunks.length;
    } else {
      chunks.push({
        content,
        index: index++,
        startOffset: match.index,
        endOffset: match.index + content.length,
        metadata: { type: 'code' },
      });
    }
  }

  // If no blocks found, use regular chunking
  if (chunks.length === 0) {
    return chunkText(code, cfg);
  }

  return chunks;
}

/**
 * Merge small chunks together
 */
export function mergeSmallChunks(chunks: TextChunk[], minSize: number = 100): TextChunk[] {
  const merged: TextChunk[] = [];
  let current: TextChunk | null = null;

  for (const chunk of chunks) {
    if (!current) {
      current = { ...chunk };
      continue;
    }

    if (current.content.length < minSize) {
      current.content += '\n\n' + chunk.content;
      current.endOffset = chunk.endOffset;
    } else {
      merged.push(current);
      current = { ...chunk, index: merged.length };
    }
  }

  if (current) {
    current.index = merged.length;
    merged.push(current);
  }

  return merged;
}
