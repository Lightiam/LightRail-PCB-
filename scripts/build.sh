#!/bin/bash
#
# Build Script
# Builds the application for production
#

set -e

echo "🔨 LightRail AI Build"
echo "===================="

# Clean previous build
echo ""
echo "🧹 Cleaning previous build..."
rm -rf dist

# Type check
echo ""
echo "📝 Running type check..."
npx tsc --noEmit

# Run linting (if eslint is configured)
if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
    echo ""
    echo "🔍 Running linter..."
    npx eslint src --ext .ts,.tsx --max-warnings 0 || true
fi

# Run tests
echo ""
echo "🧪 Running tests..."
npx vitest run --silent || {
    echo "⚠️  Some tests failed. Continue with build? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        echo "Build cancelled."
        exit 1
    fi
}

# Build
echo ""
echo "📦 Building application..."
npx vite build

# Report
echo ""
echo "✨ Build complete!"
echo ""
echo "Output: dist/"
ls -lh dist/ 2>/dev/null || echo "  (empty or build failed)"

echo ""
echo "To preview the build locally:"
echo "  npm run preview"
echo ""
