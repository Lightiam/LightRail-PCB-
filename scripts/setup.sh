#!/bin/bash
#
# Setup Script
# Initializes the development environment
#

set -e

echo "🚀 LightRail AI Setup"
echo "===================="

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo ""
    echo "📝 Creating .env.local file..."
    cat > .env.local << 'EOF'
# LightRail AI Configuration
# Copy this file and fill in your API keys

# Google Gemini API Key (Primary)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Alternative: OpenAI API Key
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Alternative: Anthropic API Key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: Local LLM URL (e.g., Ollama)
VITE_LOCAL_LLM_URL=http://localhost:11434

# Logging
VITE_LOG_LEVEL=info
VITE_ENABLE_DEBUG=false

# Telemetry (optional)
VITE_ENABLE_TELEMETRY=false
EOF
    echo "⚠️  Please edit .env.local and add your API keys"
fi

# Create data directories
echo ""
echo "📁 Creating data directories..."
mkdir -p data/cache data/embeddings data/vector_db

# Verify setup
echo ""
echo "🔍 Verifying setup..."

# Check if TypeScript compiles
echo "  Checking TypeScript..."
npx tsc --noEmit 2>/dev/null && echo "  ✅ TypeScript OK" || echo "  ⚠️  TypeScript has issues (run 'npm run build' for details)"

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env.local and add your API keys"
echo "  2. Run 'npm run dev' to start the development server"
echo "  3. Open http://localhost:5173 in your browser"
echo ""
