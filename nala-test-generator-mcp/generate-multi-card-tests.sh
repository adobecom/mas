#!/bin/bash

# Multi-Card Test Generation Script
# Usage: ./generate-multi-card-tests.sh [cardType] [branch]
# Example: ./generate-multi-card-tests.sh fries main

# Card inventory - Update these with your actual card IDs
CSS_CARD="26f091c2-995d-4a96-a193-d62f6c73af2f"      # Visual styling optimized
EDIT_CARD="12345678-1234-1234-1234-123456789abc"     # Editable fields configured
SAVE_CARD="87654321-4321-4321-4321-cba987654321"     # Save operations ready
DISCARD_CARD="abcdef12-3456-7890-abcd-ef1234567890"  # Discard workflows set up

# Parameters
CARD_TYPE=${1:-fries}
BRANCH=${2:-main}

echo "🚀 Generating multi-card tests for $CARD_TYPE on $BRANCH"
echo ""
echo "📋 Card Inventory:"
echo "  CSS Card:     $CSS_CARD"
echo "  Edit Card:    $EDIT_CARD"
echo "  Save Card:    $SAVE_CARD"
echo "  Discard Card: $DISCARD_CARD"
echo ""

# Check if we're in the right directory
if [ ! -f "cursor-integration.js" ]; then
    echo "❌ Error: cursor-integration.js not found. Please run this script from the nala-test-generator-mcp directory."
    exit 1
fi

# Generate tests with appropriate cards
echo "📝 Generating CSS tests with optimized card..."
if node cursor-integration.js single css "$CSS_CARD" "$CARD_TYPE" "$BRANCH"; then
    echo "  ✅ CSS tests generated successfully"
else
    echo "  ❌ CSS test generation failed"
    exit 1
fi

echo ""
echo "📝 Generating edit tests with edit-ready card..."
if node cursor-integration.js single edit "$EDIT_CARD" "$CARD_TYPE" "$BRANCH"; then
    echo "  ✅ Edit tests generated successfully"
else
    echo "  ❌ Edit test generation failed"
    exit 1
fi

echo ""
echo "📝 Generating save tests with save-configured card..."
if node cursor-integration.js single save "$SAVE_CARD" "$CARD_TYPE" "$BRANCH"; then
    echo "  ✅ Save tests generated successfully"
else
    echo "  ❌ Save test generation failed"
    exit 1
fi

echo ""
echo "📝 Generating discard tests with discard-ready card..."
if node cursor-integration.js single discard "$DISCARD_CARD" "$CARD_TYPE" "$BRANCH"; then
    echo "  ✅ Discard tests generated successfully"
else
    echo "  ❌ Discard test generation failed"
    exit 1
fi

echo ""
echo "✅ Validating all generated tests..."

# Validate all tests
VALIDATION_FAILED=false

for TEST_TYPE in css edit save discard; do
    echo "  🔍 Validating $TEST_TYPE tests..."
    if node cursor-integration.js validate "$CARD_TYPE" "$TEST_TYPE" > /dev/null 2>&1; then
        echo "    ✅ $TEST_TYPE validation passed"
    else
        echo "    ❌ $TEST_TYPE validation failed"
        VALIDATION_FAILED=true
    fi
done

echo ""

if [ "$VALIDATION_FAILED" = true ]; then
    echo "❌ Some validations failed. Please check the generated files."
    exit 1
else
    echo "🎉 Multi-card test suite generated and validated successfully!"
    echo ""
    echo "📁 Generated files location:"
    echo "  nala/studio/*/$(echo $CARD_TYPE | tr '[:upper:]' '[:lower:]')/"
    echo ""
    echo "🧪 To run the tests:"
    echo "  node cursor-integration.js run-tests $CARD_TYPE css"
    echo "  node cursor-integration.js run-tests $CARD_TYPE edit"
    echo "  node cursor-integration.js run-tests $CARD_TYPE save"
    echo "  node cursor-integration.js run-tests $CARD_TYPE discard"
fi 