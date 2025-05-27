# Quick Setup Guide

## 1. Install Dependencies

```bash
cd nala-test-generator-mcp
npm install
```

## 2. Test the MCP Server

```bash
npm start
```

You should see: "NALA Test Generator MCP Server running on stdio"

## 3. Configure Cursor (Option 1: Native MCP Support)

If Cursor has built-in MCP support, add this to your Cursor settings:

1. Open Cursor Settings (Cmd/Ctrl + ,)
2. Search for "MCP" or "Model Context Protocol"
3. Add a new MCP server with these settings:
   - **Name**: `nala-test-generator`
   - **Command**: `node`
   - **Args**: `["./src/index.js"]`
   - **Working Directory**: `./nala-test-generator-mcp` (relative to your workspace)

## 4. Alternative: Use Bridge Script (Option 2)

If Cursor doesn't have native MCP support, use the integration script:

```bash
# Get example configuration
node cursor-integration.js example

# Generate complete test suite from config file
node cursor-integration.js complete-suite example-config.json

# Generate specific components
node cursor-integration.js page-object example-config.json
node cursor-integration.js test-impl example-config.json css
```

## 5. Test the Integration

### Using Cursor (if MCP supported):
Try these natural language commands:

1. **Get an example configuration**:
   ```
   Create an example configuration for the suggested card
   ```

2. **Generate a complete test suite**:
   ```
   Generate a complete test suite for this card configuration: [paste JSON from example]
   ```

3. **Generate specific components**:
   ```
   Generate just the page object for the suggested card example
   ```

### Using Bridge Script:
```bash
# Test all functionality
node test-mcp.js

# Create example and save to file
node cursor-integration.js example > my-card-config.json

# Generate complete suite
node cursor-integration.js complete-suite my-card-config.json
```

## 6. Browser Demo

Open `browser-integration.html` in your browser to see a demo of how this could work in a web interface.

## Available Tools

- `create-suggested-card-example` - Get example configuration
- `generate-page-object` - Generate page object file
- `generate-test-spec` - Generate test specification
- `generate-test-implementation` - Generate test implementation for specific type
- `generate-complete-test-suite` - Generate complete test suite

## Project Structure

```
nala-test-generator-mcp/
├── src/
│   ├── index.js                 # Main MCP server
│   ├── types.js                 # Type definitions
│   └── generators/              # Code generators
├── cursor-integration.js        # Bridge script for Cursor
├── test-mcp.js                 # Test suite
├── example-config.json         # Sample configuration
└── README.md                   # Full documentation
```

## Troubleshooting

### Server Won't Start
- Check Node.js version: `node --version` (requires Node.js 16+)
- Install dependencies: `npm install`
- Check for syntax errors: `node src/index.js`

### Cursor Integration Issues
- Verify MCP server starts without errors
- Check Cursor's MCP configuration uses relative paths
- Try the bridge script as fallback: `node cursor-integration.js help`

### Tools Not Working
- Test with bridge script first: `node test-mcp.js`
- Check configuration file format matches schema
- Verify all required fields are present in config

## Team Collaboration

This setup uses relative paths so teammates can:

1. **Clone the repository** to any location
2. **Run `npm install`** to set up dependencies
3. **Configure Cursor** using relative paths (no absolute paths needed)
4. **Use bridge scripts** as fallback if MCP isn't supported
5. **Share configurations** using the example-config.json format

## Next Steps

1. **Read the full documentation**: See `README.md` and `CURSOR_SETUP.md`
2. **Create custom configurations**: Modify `example-config.json` for your cards
3. **Integrate with NALA**: Use generated tests in your test suite
4. **Set up automation**: Create workflows for automatic test generation 