# NALA Test Generator MCP - User Guide

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Commands Reference](#commands-reference)
5. [Card Types & Test Types](#card-types--test-types)
6. [Workflows](#workflows)
7. [Property Extraction](#property-extraction)
8. [File Structure](#file-structure)
9. [Troubleshooting](#troubleshooting)

## Overview

The NALA Test Generator MCP automatically generates Playwright tests for Merch at Scale card components. It provides both MCP tools and CLI commands for test generation, validation, and execution.

### Key Features
- Automated test generation for all card types
- Property extraction from live cards
- Support for multiple branches and environments
- Complete test validation and execution
- Integration with Cursor IDE

## Installation

```bash
cd nala-test-generator-mcp
npm install
npx playwright install
```

### Environment Variables
For running actual tests (not just validation), set up authentication:

```bash
export IMS_EMAIL=<your-adobe-test-email>
export IMS_PASS=<your-adobe-test-password>
```

**Important**: 
- Ask colleagues/slack for IMS_EMAIL and IMS_PASS values
- Your user might not work as expected because it needs to be an '@adobetest.com' account
- These are only required for actual test execution, not for test generation or validation
- When using MCP tools, ensure the MCP server process has access to these environment variables
- For CLI usage, set these variables in your shell before running commands

**MCP Environment Limitation**:
MCP server processes often run in isolated environments and may not have access to your shell's environment variables. This is expected behavior. In this case:
1. **For MCP usage**: Use validation-only mode (`dryRun: true`) to test file generation and syntax
2. **For actual test execution**: Use CLI commands which have full access to your environment variables
3. **For test generation**: MCP tools work perfectly for generating, validating, and extracting card properties

### Cursor Setup (Optional)
```bash
./setup-cursor.sh
```

## Quick Start

### Generate Tests
```bash
# Generate CSS tests
node cursor-integration.js single css "card-id" fries main

# Complete workflow: generate, validate, test
node cursor-integration.js generate-and-test css "card-id" fries main true
```

### Extract Properties
```bash
# Auto-extract from live card
node cursor-integration.js auto-extract "card-id" main true
```

### Get Information
```bash
# List available card types
node cursor-integration.js list-types

# Preview file locations
node cursor-integration.js show-paths fries css
```

## Commands Reference

### Core Commands

| Command | Description | Example |
|---------|-------------|---------|
| `single` | Generate specific test type | `node cursor-integration.js single css "card-id" fries main` |
| `generate-and-test` | Complete workflow | `node cursor-integration.js generate-and-test css "card-id" fries main true` |
| `auto-extract` | Extract card properties | `node cursor-integration.js auto-extract "card-id" main true` |
| `validate` | Validate generated files | `node cursor-integration.js validate fries css` |
| `run-tests` | Execute tests | `node cursor-integration.js run-tests fries css true` |

### Information Commands

| Command | Description | Example |
|---------|-------------|---------|
| `list-types` | Show available card types | `node cursor-integration.js list-types` |
| `show-paths` | Preview file locations | `node cursor-integration.js show-paths fries css` |

### Property Extraction Commands

| Command | Description | Example |
|---------|-------------|---------|
| `extract` | Generate console script | `node cursor-integration.js extract "card-id" main` |
| `playwright-extract` | Generate Playwright script | `node cursor-integration.js playwright-extract "card-id" main` |

## Card Types & Test Types

### Supported Card Types

| Surface | Card Types |
|---------|------------|
| **commerce** | fries |
| **acom** | catalog, plans, plans-education, plans-students, special-offers |
| **ccd** | suggested, slice |
| **adobe-home** | promoted-plans, try-buy-widget |

### Test Types

| Type | Purpose | CLI Support |
|------|---------|-------------|
| `css` | Visual styling validation | ✅ |
| `edit` | Field editing functionality | ✅ |
| `save` | Save operations | ✅ |
| `discard` | Discard operations | ✅ |
| `functional` | Card behavior | Via complete suite |
| `interaction` | Complex workflows | Via complete suite |

## Workflows

### Single Test Generation
```bash
# 1. Check available types
node cursor-integration.js list-types

# 2. Generate test
node cursor-integration.js single css "card-id" fries main

# 3. Validate
node cursor-integration.js validate fries css

# 4. Run test (validation only)
node cursor-integration.js run-tests fries css true chromium 30000 true
```

### Complete Workflow (Recommended)
```bash
# Generate, validate, and test in one command
node cursor-integration.js generate-and-test css "card-id" fries main true

# Generate, validate, and execute tests
node cursor-integration.js generate-and-test css "card-id" fries main false
```

### Multi-Test Type Generation
```bash
CARD_ID="your-card-id"
CARD_TYPE="fries"
BRANCH="main"

for TEST_TYPE in css edit save discard; do
  node cursor-integration.js single $TEST_TYPE "$CARD_ID" "$CARD_TYPE" "$BRANCH"
done
```

### Branch-Specific Workflows
```bash
# Use feature branch
node cursor-integration.js single css "card-id" fries "feature-branch"

# Extract from development branch
node cursor-integration.js auto-extract "card-id" "dev-branch" true
```

## Property Extraction

### Automatic Extraction (Recommended)
```bash
# Headless mode (fastest)
node cursor-integration.js auto-extract "card-id" main true

# Visible browser (for debugging)
node cursor-integration.js auto-extract "card-id" main false
```

### Manual Extraction
```bash
# Generate console script
node cursor-integration.js extract "card-id" main

# Generate Playwright script
node cursor-integration.js playwright-extract "card-id" main
```

### What Gets Extracted
- CSS selectors for all card elements
- CSS properties and values
- Text content and attributes
- Card type detection
- Suggested test types

## File Structure

Generated files are organized by surface and card type:

```
nala/studio/[surface]/[cardType]/
├── [cardType].page.js              # Page object with selectors
├── specs/[cardType]_[testType].spec.js  # Test specifications
└── tests/[cardType]_[testType].test.js  # Test implementations
```

### Examples
```
nala/studio/commerce/fries/
├── fries.page.js
├── specs/fries_css.spec.js
└── tests/fries_css.test.js

nala/studio/acom/plans/
├── plans.page.js
├── specs/plans_edit.spec.js
└── tests/plans_edit.test.js
```

## Troubleshooting

### Common Issues

#### Command Not Found
```bash
# Ensure you're in the right directory
pwd  # Should end with: /mas/nala-test-generator-mcp

# Check if files exist
ls cursor-integration.js
```

#### Card Type Not Found
```bash
# List available card types
node cursor-integration.js list-types

# Check spelling and case sensitivity
```

#### Property Extraction Fails
```bash
# Use visible browser for debugging
node cursor-integration.js auto-extract "card-id" main false

# Check if card exists on branch
# Verify branch name spelling
```

#### Test Generation Errors
```bash
# Validate card type is supported
node cursor-integration.js list-types

# Check file permissions
ls -la nala/studio/

# Verify configuration
node cursor-integration.js show-paths [cardType] [testType]
```

#### Test Execution Fails
```bash
# Install Playwright browsers
npx playwright install

# Run validation only first
node cursor-integration.js run-tests [cardType] [testType] true chromium 30000 true

# Check generated file syntax
node cursor-integration.js validate [cardType] [testType]
```

### Browser Options

```bash
# Different browsers
node cursor-integration.js run-tests fries css true firefox 30000 false
node cursor-integration.js run-tests fries css true webkit 30000 false

# Custom timeout (45 seconds)
node cursor-integration.js run-tests fries css true chromium 45000 false

# Visible browser for debugging
node cursor-integration.js run-tests fries css false chromium 30000 false
```

### Getting Help

1. **Check available commands**: `node cursor-integration.js` (no arguments)
2. **List card types**: `node cursor-integration.js list-types`
3. **Preview file paths**: `node cursor-integration.js show-paths [cardType] [testType]`
4. **Validate files**: `node cursor-integration.js validate [cardType] [testType]`

## MCP Tools

If using an MCP-compatible client, these tools are available:

- `auto-extract-card-properties` - Extract card properties using Playwright
- `generate-single-test-type` - Generate specific test types
- `generate-and-test` - Complete workflow: generate, validate, execute
- `validate-generated-tests` - Validate generated files
- `run-generated-tests` - Execute tests with reporting
- `generate-complete-test-suite` - Generate all test files at once

## Best Practices

1. **Use `generate-and-test`** for complete workflows
2. **Extract properties first** when working with new cards
3. **Validate before running** tests to catch syntax errors
4. **Use feature branches** for testing new card implementations
5. **Run validation-only tests** in CI/CD pipelines
6. **Keep card IDs documented** for team reference 