<div align="center">
<img width="1200" height="475" alt="LightRail AI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# LightRail AI

**Advanced PCB Schematic Assistant with Intelligent Component Routing**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Features](#features) • [Quick Start](#quick-start) • [Architecture](#architecture) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## Features

- 🤖 **Multi-Model LLM Support** - Switch between GPT-4, Claude, Gemini, or local models
- 🔌 **Intelligent PCB Design** - AI-powered schematic generation and component suggestions
- 📊 **RAG-Enhanced Context** - Retrieval-augmented generation for accurate designs
- 🎨 **Modern UI** - Sleek, neon-themed interface with real-time schematic visualization
- 🧪 **Fully Tested** - Comprehensive unit and integration test suite
- 🐳 **Docker Ready** - Production-ready containerization
- 📦 **Modular Architecture** - Clean separation of concerns for scalability

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- API key for at least one LLM provider (Gemini, OpenAI, or Anthropic)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/lightrail-ai.git
cd lightrail-ai

# Run setup script
npm run setup

# Or manually:
npm install
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Docker

```bash
# Development
docker-compose --profile dev up

# Production
docker-compose --profile prod up -d
```

## Architecture

LightRail AI follows a clean, scalable GenAI project structure:

```
lightrail-ai/
├── config/                 # Configuration layer
│   ├── app.config.ts       # Application settings
│   ├── model.config.ts     # LLM provider configs
│   ├── logging.config.ts   # Observability settings
│   └── environment.ts      # Environment management
│
├── data/                   # Data storage (gitignored)
│   ├── cache/              # Processed data cache
│   ├── embeddings/         # Vector embeddings
│   └── vector_db/          # Vector database files
│
├── src/
│   ├── core/               # LLM Abstraction Layer
│   │   ├── interfaces/     # Common LLM interface
│   │   ├── clients/        # Provider implementations
│   │   └── factory.ts      # Model switching factory
│   │
│   ├── prompts/            # Prompt Management
│   │   ├── templates/      # Reusable prompt templates
│   │   └── chains/         # Multi-step prompt chains
│   │
│   ├── rag/                # Retrieval-Augmented Generation
│   │   ├── embeddings.ts   # Embedding generation
│   │   ├── vector-store.ts # Vector database
│   │   ├── retrieval.ts    # Document retrieval
│   │   └── pcb-knowledge.ts# Domain knowledge base
│   │
│   ├── processing/         # Data Preprocessing
│   │   ├── chunking.ts     # Text chunking
│   │   ├── tokenization.ts # Token utilities
│   │   └── cleaning.ts     # Data sanitization
│   │
│   ├── inference/          # Inference Engine
│   │   ├── executor.ts     # Request execution
│   │   └── parser.ts       # Response parsing
│   │
│   ├── components/         # React Components
│   ├── hooks/              # Custom React Hooks
│   └── utils/              # Utility functions
│
├── tests/
│   ├── unit/               # Unit tests
│   └── integration/        # Integration tests
│
├── scripts/                # Automation scripts
│   ├── setup.sh            # Environment setup
│   ├── build.sh            # Production build
│   ├── test.sh             # Test runner
│   └── clean.sh            # Cleanup
│
├── Dockerfile              # Production container
├── docker-compose.yml      # Container orchestration
└── package.json            # Dependencies & scripts
```

### Design Principles

1. **Separation of Concerns** - Each module has a single responsibility
2. **Provider Agnostic** - Switch LLM providers without code changes
3. **Prompts as Assets** - Templates are versioned and testable
4. **Modular RAG** - Retrieval components are independent and swappable
5. **Type Safety** - Full TypeScript with strict mode

## Documentation

### Configuration

All configuration is centralized in the `config/` directory:

```typescript
// Switch between providers
import { createClient, setDefaultProvider } from './src/core';

setDefaultProvider('anthropic'); // Use Claude
const client = createClient('openai'); // Or create specific client
```

### Prompt Templates

Prompts are first-class citizens:

```typescript
import { renderTemplate, pcbTemplates } from './src/prompts';

const prompt = renderTemplate(pcbTemplates.designRequest, {
  design_request: 'LED blinker circuit',
  voltage: '5V',
});
```

### RAG System

Built-in retrieval-augmented generation:

```typescript
import { createVectorStore, createEmbeddingProvider, createRAGSystem } from './src/rag';

const store = createVectorStore('persistent', { dimensions: 1536 }, 'pcb-docs');
const embeddings = createEmbeddingProvider({ provider: 'openai' });
const { retriever, indexer } = createRAGSystem(store, embeddings);

// Index documents
await indexer.index('Resistors limit current flow...');

// Retrieve relevant context
const result = await retriever.retrieve('How do I limit LED current?');
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run all tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run typecheck` | TypeScript type checking |
| `npm run setup` | Initialize development environment |
| `npm run clean` | Remove build artifacts |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key | Yes* |
| `VITE_OPENAI_API_KEY` | OpenAI API key | Yes* |
| `VITE_ANTHROPIC_API_KEY` | Anthropic API key | Yes* |
| `VITE_LOCAL_LLM_URL` | Local LLM endpoint | No |
| `VITE_LOG_LEVEL` | Logging level | No |

*At least one API key is required.

## Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">
Built with ⚡ by the LightRail Team
</div>
