# NALA Test Generator MCP - Quick Reference

## Essential Commands

### Generate Tests
```bash
# Generate specific test type
node cursor-integration.js single css "card-id" fries main

# Complete workflow (recommended)
node cursor-integration.js generate-and-test css "card-id" fries main true
```

### Extract Properties
```bash
# Auto-extract from live card
node cursor-integration.js auto-extract "card-id" main true
```

### Information
```bash
# List available card types
node cursor-integration.js list-types

# Preview file locations
node cursor-integration.js show-paths fries css

# Validate generated files
node cursor-integration.js validate fries css
```

## Card Types & Surfaces

| Surface | Card Types |
|---------|------------|
| **commerce** | fries |
| **acom** | catalog, plans, plans-education, plans-students, special-offers |
| **ccd** | suggested, slice |
| **adobe-home** | promoted-plans, try-buy-widget |

## Test Types

- **css** - Visual styling validation
- **edit** - Field editing functionality
- **save** - Save operations
- **discard** - Discard operations

## Quick Workflows

### Single Test
```bash
node cursor-integration.js single css "card-id" fries main
node cursor-integration.js validate fries css
```

### Complete Workflow
```bash
node cursor-integration.js generate-and-test css "card-id" fries main true
```

### Multiple Test Types
```bash
for TEST_TYPE in css edit save discard; do
  node cursor-integration.js single $TEST_TYPE "card-id" fries main
done
```

## Branch Support

```bash
# Use any branch
node cursor-integration.js single css "card-id" fries "feature-branch"

# Extract from specific branch
node cursor-integration.js auto-extract "card-id" "dev-branch" true
```

## File Structure

```
nala/studio/[surface]/[cardType]/
├── [cardType].page.js
├── specs/[cardType]_[testType].spec.js
└── tests/[cardType]_[testType].test.js
```

## Troubleshooting

```bash
# Check directory
pwd  # Should end with: /mas/nala-test-generator-mcp

# List available types
node cursor-integration.js list-types

# Debug extraction
node cursor-integration.js auto-extract "card-id" main false
```

## 🎯 Card Types & Surfaces

| Card Type | Surface | Example |
|-----------|---------|---------|
| fries | commerce | `node cursor-integration.js single css "id" fries main` |
| catalog | acom | `node cursor-integration.js single css "id" catalog main` |
| plans | acom | `node cursor-integration.js single css "id" plans main` |
| plans-education | acom | `node cursor-integration.js single css "id" plans-education main` |
| plans-students | acom | `node cursor-integration.js single css "id" plans-students main` |
| special-offers | acom | `node cursor-integration.js single css "id" special-offers main` |
| suggested | ccd | `node cursor-integration.js single css "id" suggested main` |
| slice | ccd | `node cursor-integration.js single css "id" slice main` |
| promoted-plans | adobe-home | `node cursor-integration.js single css "id" promoted-plans main` |
| try-buy-widget | adobe-home | `node cursor-integration.js single css "id" try-buy-widget main` |

## 🔧 Test Types

- **css** - Visual styling validation
- **edit** - Field editing functionality  
- **save** - Save operations and data persistence
- **discard** - Discard operations and data rollback
- **functional** - Card behavior and interactions (via complete suite)
- **interaction** - Complex user workflows (via complete suite)

## 💡 Quick Workflows

### Single Card Workflow
```bash
# 1. Check available types
node cursor-integration.js list-types

# 2. Generate tests
node cursor-integration.js single css "your-card-id" fries main

# 3. Validate
node cursor-integration.js validate fries css

# 4. Run tests (validation only)
node cursor-integration.js run-tests fries css true chromium 30000 true
```

### Complete Workflow (Recommended)
```bash
# Generate, validate, and test in one command
node cursor-integration.js generate-and-test css "card-id" fries main true

# Generate, validate, and execute tests
node cursor-integration.js generate-and-test css "card-id" fries main false
```

### Multi-Test Type Workflow
```bash
# Generate multiple test types for same card
CARD_ID="your-card-id"
CARD_TYPE="fries"
BRANCH="main"

for TEST_TYPE in css edit save discard; do
  node cursor-integration.js single $TEST_TYPE "$CARD_ID" "$CARD_TYPE" "$BRANCH"
  node cursor-integration.js validate "$CARD_TYPE" $TEST_TYPE
done
```

### Property Extraction Workflow
```bash
# 1. Auto-extract properties (fastest)
node cursor-integration.js auto-extract "card-id" main true

# 2. Copy the JSON output to a config file
# 3. Use with complete suite generation
# (Note: CLI bridge handles this automatically for single commands)
```

## 🌿 Branch Support

```bash
# Use feature branch
node cursor-integration.js single css "card-id" fries "feature-branch"

# Use main branch (default)
node cursor-integration.js single css "card-id" fries main

# Use development branch
node cursor-integration.js single css "card-id" fries "dev-branch"

# Extract from specific branch
node cursor-integration.js auto-extract "card-id" "feature-branch" true
```

## 🎭 Browser Options

```bash
# Headless mode (default, faster)
node cursor-integration.js run-tests fries css true chromium 30000 false

# Visible browser (for debugging)
node cursor-integration.js run-tests fries css false chromium 30000 false

# Different browsers
node cursor-integration.js run-tests fries css true firefox 30000 false
node cursor-integration.js run-tests fries css true webkit 30000 false

# Custom timeout (45 seconds)
node cursor-integration.js run-tests fries css true chromium 45000 false
```

## 🐛 Quick Troubleshooting

```bash
# Check if you're in the right directory
pwd  # Should end with: /mas/nala-test-generator-mcp

# List available card types if "not found" error
node cursor-integration.js list-types

# Check file permissions
ls -la nala/studio/

# Install Playwright browsers if extraction fails
npx playwright install

# Test MCP server directly
node src/index.js

# Check generated file paths
node cursor-integration.js show-paths [cardType] [testType]

# Validate specific files
node cursor-integration.js validate [cardType] [testType]
```

## 🚀 Advanced Usage

### Batch Processing
```bash
# Create a batch script for multiple cards
cat > generate-tests.sh << 'EOF'
#!/bin/bash
CARDS=("card-1" "card-2" "card-3")
CARD_TYPE="fries"
TEST_TYPE="css"

for CARD_ID in "${CARDS[@]}"; do
  echo "Processing $CARD_ID..."
  node cursor-integration.js generate-and-test $TEST_TYPE "$CARD_ID" "$CARD_TYPE" main true
done
EOF

chmod +x generate-tests.sh
./generate-tests.sh
```

### CI/CD Integration
```bash
# Use in automated pipelines
if node cursor-integration.js generate-and-test css "$CARD_ID" "$CARD_TYPE" "$BRANCH" true; then
  echo "✅ Tests generated and validated"
  # Optionally run full tests
  node cursor-integration.js run-tests "$CARD_TYPE" css true chromium 30000 false
else
  echo "❌ Test generation failed"
  exit 1
fi
```

### Debug Mode
```bash
# Run with visible browser for debugging extraction
node cursor-integration.js auto-extract "card-id" main false

# Run tests with visible browser for debugging
node cursor-integration.js generate-and-test css "card-id" fries main false chromium 30000 false
```

## 📖 Full Documentation

For complete details, see:
- **[Getting Started Tutorial](GETTING_STARTED_TUTORIAL.md)** - Step-by-step learning
- **[Command Cheat Sheet](COMMAND_CHEATSHEET.md)** - Complete command reference  
- **[Comprehensive User Guide](COMPREHENSIVE_USER_GUIDE.md)** - All features and capabilities
- **[Test Execution Guide](TEST_EXECUTION_GUIDE.md)** - Advanced testing features 