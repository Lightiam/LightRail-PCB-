#!/bin/bash
#
# Test Script
# Runs all tests with coverage
#

set -e

echo "🧪 LightRail AI Test Suite"
echo "=========================="

# Parse arguments
WATCH=false
COVERAGE=false
UNIT_ONLY=false
INTEGRATION_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --watch|-w)
            WATCH=true
            shift
            ;;
        --coverage|-c)
            COVERAGE=true
            shift
            ;;
        --unit|-u)
            UNIT_ONLY=true
            shift
            ;;
        --integration|-i)
            INTEGRATION_ONLY=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./scripts/test.sh [--watch|-w] [--coverage|-c] [--unit|-u] [--integration|-i]"
            exit 1
            ;;
    esac
done

# Build test command
CMD="npx vitest"

if [ "$WATCH" = true ]; then
    CMD="$CMD --watch"
else
    CMD="$CMD run"
fi

if [ "$COVERAGE" = true ]; then
    CMD="$CMD --coverage"
fi

if [ "$UNIT_ONLY" = true ]; then
    CMD="$CMD tests/unit"
elif [ "$INTEGRATION_ONLY" = true ]; then
    CMD="$CMD tests/integration"
fi

echo ""
echo "Running: $CMD"
echo ""

# Run tests
eval $CMD

echo ""
echo "✅ Tests completed!"
