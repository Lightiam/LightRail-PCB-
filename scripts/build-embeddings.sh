#!/bin/bash
#
# Build Embeddings Script
# Pre-processes documents and builds vector embeddings for RAG
#

set -e

echo "🔮 LightRail AI Embedding Builder"
echo "================================="

# Configuration
DATA_DIR="data"
EMBEDDINGS_DIR="$DATA_DIR/embeddings"
VECTOR_DB_DIR="$DATA_DIR/vector_db"
DOCS_DIR="docs"

# Create directories
mkdir -p "$EMBEDDINGS_DIR" "$VECTOR_DB_DIR"

echo ""
echo "📂 Source directories:"
echo "  Documents: $DOCS_DIR"
echo "  Output: $EMBEDDINGS_DIR"

# Check for documents
if [ -d "$DOCS_DIR" ]; then
    DOC_COUNT=$(find "$DOCS_DIR" -type f \( -name "*.md" -o -name "*.txt" -o -name "*.pdf" \) | wc -l)
    echo ""
    echo "📄 Found $DOC_COUNT documents to process"
else
    echo ""
    echo "⚠️  No docs directory found. Creating sample..."
    mkdir -p "$DOCS_DIR"

    # Create sample documentation
    cat > "$DOCS_DIR/pcb-basics.md" << 'EOF'
# PCB Design Basics

## Components

### Resistors
Resistors limit current flow in circuits. Common values include 100Ω, 1kΩ, 10kΩ.
For LED current limiting: R = (Vs - Vf) / If

### Capacitors
Capacitors store energy and filter signals. Use 100nF for decoupling.

### Voltage Regulators
Linear regulators (7805, AMS1117) provide stable output voltage.
Always include input and output capacitors.

## Common Circuits

### LED Circuit
- Current limiting resistor required
- R = (Vcc - Vled) / Iled
- Typical LED current: 10-20mA

### Power Supply
- Input protection diode
- Bulk capacitor (100µF+)
- Decoupling capacitors near ICs
EOF

    echo "📝 Created sample documentation"
fi

# Note: Actual embedding generation would require running Node.js
echo ""
echo "📊 Embedding generation requires API keys."
echo ""
echo "To generate embeddings:"
echo "  1. Ensure API keys are set in .env.local"
echo "  2. Run: npm run build:embeddings"
echo ""

# Create placeholder index
cat > "$VECTOR_DB_DIR/index.json" << 'EOF'
{
  "version": "1.0.0",
  "created": "2024-01-01T00:00:00Z",
  "documents": 0,
  "dimensions": 1536,
  "status": "pending"
}
EOF

echo "✅ Embedding infrastructure ready"
echo ""
