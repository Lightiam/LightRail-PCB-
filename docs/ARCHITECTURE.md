# LightRail AI Architecture

This document describes the architectural decisions and patterns used in LightRail AI.

## Overview

LightRail AI follows a clean, scalable GenAI project structure designed to:

1. **Prevent vendor lock-in** through provider abstraction
2. **Enable rapid iteration** through modular design
3. **Ensure reliability** through comprehensive testing
4. **Support production deployment** through containerization

## Core Principles

### 1. Separation of Concerns

Each module has a single, well-defined responsibility:

| Module | Responsibility |
|--------|----------------|
| `config/` | Application and environment configuration |
| `src/core/` | LLM provider abstraction |
| `src/prompts/` | Prompt template management |
| `src/rag/` | Retrieval-augmented generation |
| `src/processing/` | Data preprocessing |
| `src/inference/` | Request execution and parsing |
| `src/components/` | UI components |

### 2. Provider Abstraction

The `LLMClient` interface defines a common API for all providers:

```typescript
interface LLMClient {
  complete(prompt: string, options?: ChatOptions): Promise<CompletionResponse>;
  chat(messages: Message[], options?: ChatOptions): Promise<CompletionResponse>;
  streamComplete(prompt: string, options?: ChatOptions): AsyncGenerator<StreamChunk>;
  streamChat(messages: Message[], options?: ChatOptions): AsyncGenerator<StreamChunk>;
}
```

This allows switching providers without changing business logic:

```typescript
// Factory creates the right client
const client = createClient('anthropic');
const response = await client.complete('Design a circuit...');
```

### 3. Prompts as Assets

Prompts are treated as first-class assets with:

- **Versioning**: Each template has a version number
- **Validation**: Templates are validated at runtime
- **Composability**: Templates can reference other templates
- **Testing**: Templates can be unit tested

```typescript
const template: PromptTemplate = {
  id: 'pcb-design',
  version: '1.0.0',
  template: 'Design a {{ circuit_type }} circuit...',
  variables: [{ name: 'circuit_type', required: true }],
};
```

### 4. Modular RAG

The RAG system is composed of independent, swappable components:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Embedding     │────▶│   Vector Store  │────▶│   Retriever     │
│   Provider      │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
   OpenAI / Local         Memory / Persistent      Similarity Search
```

## Data Flow

### Chat Flow

```
User Input
    │
    ▼
┌─────────────────┐
│  Input Cleaning │
└─────────────────┘
    │
    ▼
┌─────────────────┐     ┌─────────────────┐
│  RAG Retrieval  │◀────│  Vector Store   │
└─────────────────┘     └─────────────────┘
    │
    ▼
┌─────────────────┐
│ Prompt Template │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  LLM Client     │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Response Parser │
└─────────────────┘
    │
    ▼
Schematic Output
```

### Embedding Flow

```
Documents
    │
    ▼
┌─────────────────┐
│    Chunking     │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   Embedding     │
│   Provider      │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  Vector Store   │
└─────────────────┘
```

## Configuration Architecture

Configuration is layered:

1. **Default values** in code
2. **Environment variables** for runtime config
3. **Feature flags** for optional features

```typescript
// config/model.config.ts
export const defaultModelConfigs = {
  google: {
    modelId: 'gemini-pro',
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
    maxTokens: 4096,
    temperature: 0.7,
  },
  // ...
};
```

## Testing Strategy

### Unit Tests

- Test individual functions and classes
- Mock external dependencies
- Fast execution

### Integration Tests

- Test component interactions
- Use real implementations where possible
- Verify end-to-end flows

### Test Organization

```
tests/
├── unit/
│   ├── parser.test.ts
│   ├── templates.test.ts
│   ├── processing.test.ts
│   └── vector-store.test.ts
└── integration/
    └── chat-flow.test.ts
```

## Deployment Architecture

### Development

```
┌─────────────────────────────────────────┐
│              Dev Container              │
│  ┌─────────────────────────────────┐    │
│  │         Vite Dev Server         │    │
│  │         (Hot Reload)            │    │
│  └─────────────────────────────────┘    │
│              Port 5173                  │
└─────────────────────────────────────────┘
```

### Production

```
┌─────────────────────────────────────────┐
│           Production Container          │
│  ┌─────────────────────────────────┐    │
│  │            Nginx                │    │
│  │     (Static File Server)        │    │
│  │     ┌───────────────────┐       │    │
│  │     │   Built Assets    │       │    │
│  │     └───────────────────┘       │    │
│  └─────────────────────────────────┘    │
│              Port 80                    │
└─────────────────────────────────────────┘
```

## Security Considerations

1. **API Keys**: Never committed to repository
2. **Input Sanitization**: All user input is cleaned
3. **Content Security**: Proper CSP headers in production
4. **Sensitive Data**: Automatic redaction in logs

## Future Considerations

- WebSocket support for real-time collaboration
- Plugin system for custom components
- Export to industry-standard formats (KiCad, Eagle)
- Cloud deployment with authentication
