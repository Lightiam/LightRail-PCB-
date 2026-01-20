#!/bin/bash
#
# Clean Script
# Removes build artifacts and caches
#

echo "🧹 LightRail AI Cleanup"
echo "======================"

# Parse arguments
DEEP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --deep|-d)
            DEEP=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./scripts/clean.sh [--deep|-d]"
            exit 1
            ;;
    esac
done

echo ""
echo "Removing build artifacts..."

# Remove build output
rm -rf dist
echo "  ✓ dist/"

# Remove cache directories
rm -rf node_modules/.cache
echo "  ✓ node_modules/.cache/"

rm -rf .vitest
echo "  ✓ .vitest/"

rm -rf coverage
echo "  ✓ coverage/"

# Remove TypeScript cache
rm -rf tsconfig.tsbuildinfo
echo "  ✓ tsconfig.tsbuildinfo"

if [ "$DEEP" = true ]; then
    echo ""
    echo "Deep clean enabled..."

    # Remove node_modules
    rm -rf node_modules
    echo "  ✓ node_modules/"

    # Remove data caches
    rm -rf data/cache/*
    echo "  ✓ data/cache/*"

    # Remove embeddings (regenerate required)
    rm -rf data/embeddings/*
    echo "  ✓ data/embeddings/*"

    # Remove vector DB
    rm -rf data/vector_db/*
    echo "  ✓ data/vector_db/*"

    echo ""
    echo "⚠️  Run 'npm install' to restore dependencies"
fi

echo ""
echo "✨ Cleanup complete!"
