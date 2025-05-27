# NALA Test Generator MCP

A Model Context Protocol (MCP) server for generating NALA test files for Merch at Scale card components.

## Features

- Generate complete NALA test suites for card components
- Support for multiple card types (catalog, fries, plans, etc.)
- Generate different test types (CSS, functional, edit, save, discard)
- Extract card properties from live pages
- Validate generated test files
- Run tests with detailed reporting
- **Automatic error detection and fixing**
- **Complete test generation and execution workflow**
- **Localhost testing support**

## Installation

```bash
cd nala-test-generator-mcp
npm install
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "nala-test-generator": {
      "command": "node",
      "args": ["/path/to/mas/nala-test-generator-mcp/src/index.js"],
      "cwd": "/path/to/mas"
    }
  }
}
```

### Available Tools

#### 1. `generate-page-object`
Generate a NALA page object file for a card component.

#### 2. `generate-test-spec`
Generate a NALA test specification file for a card component.

#### 3. `generate-test-implementation`
Generate a NALA test implementation file for a specific test type.

#### 4. `generate-complete-test-suite`
Generate a complete NALA test suite including page object, specs, and all test implementations.

#### 5. `extract-card-properties`
Generate extraction script to automatically extract properties from a live Merch at Scale card.

#### 6. `auto-extract-card-properties`
Automatically extract card properties using Playwright (fully automated).

#### 7. `run-generated-tests`
Execute generated NALA tests and report results.

#### 8. `validate-generated-tests`
Validate generated NALA test files for syntax and structure.

#### 9. `generate-and-test`
Complete workflow: generate tests, validate, and execute them.

#### 10. `run-and-fix-card-tests`
Run tests for a specific card and automatically fix any errors found.

**Parameters:**
- `cardId` (required): The ID of the merch card to test
- `cardType` (required): Type of card (e.g., 'fries', 'catalog', 'plans')
- `testType` (required): Type of test to run ('css', 'edit', 'save', 'discard')
- `branch` (optional): Studio branch name (defaults to 'main')
- `milolibs` (optional): Milolibs branch (e.g., 'MWPW-170520') or 'local' for localhost
- `autoFix` (optional): Automatically fix detected errors (default: true)
- `maxFixAttempts` (optional): Maximum number of fix attempts (default: 3)

**Localhost Testing:**
To test cards on localhost, use `milolibs="local"`:
```bash
run-and-fix-card-tests --cardId "your-card-id" --cardType "fries" --testType "css" --milolibs "local"
```

This configures tests to use `http://localhost:3000` with the correct URL structure.

## Example Workflow

1. **Extract card properties:**
   ```
   Use auto-extract-card-properties with cardId: "your-card-id"
   ```

2. **Generate complete test suite:**
   ```
   Use generate-complete-test-suite with the extracted configuration
   ```

3. **Run and fix tests:**
   ```
   Use run-and-fix-card-tests to automatically run tests and fix any errors
   ```

## Generated File Structure

```
nala/
└── studio/
    └── commerce/
        └── [card-type]/
            ├── page-objects/
            │   └── [card-type].page.js
            ├── specs/
            │   ├── [card-type]_css.spec.js
            │   ├── [card-type]_edit.spec.js
            │   ├── [card-type]_save.spec.js
            │   └── [card-type]_discard.spec.js
            └── tests/
                ├── [card-type]_css.test.js
                ├── [card-type]_edit.test.js
                ├── [card-type]_save.test.js
                └── [card-type]_discard.test.js
```

## Development

### Running Tests
```bash
npm test
```

### Debug Mode
```bash
npm run debug
```

## Documentation

- [Run and Fix Guide](./RUN_AND_FIX_GUIDE.md) - Detailed guide for the run-and-fix-card-tests tool
- [API Documentation](./docs/API.md) - Detailed API documentation
- [Examples](./docs/EXAMPLES.md) - Usage examples

## License

MIT 