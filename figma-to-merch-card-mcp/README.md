# Figma to Merch Card MCP

This folder contains a custom Model Context Protocol (MCP) server that converts Figma designs into Adobe MAS merch card variants.

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Test the conversion**:
   ```bash
   node simple-test.js
   ```

3. **Start the MCP server**:
   ```bash
   npm start
   ```

## What it does

- Connects to Figma API to fetch design data
- Analyzes design structure and extracts components
- Generates production-ready merch card variant code
- Saves files directly to `../web-components/src/variants/`
- Automatically registers variants in `../web-components/src/mas.js`
- Automatically adds variants to `../studio/src/editors/variant-picker.js`
- Maps colors to Adobe Spectrum design tokens

## Files

- `figma-to-merch-card-mcp.js` - Main MCP server
- `simple-test.js` - Test script for quick conversion
- `test-figma-conversion.js` - Detailed test with analysis
- `figma-mcp-README.md` - Detailed documentation
- `mcp-config.json` - MCP configuration for Cursor

## Usage in Cursor

The MCP server is configured in `../.cursor/mcp.json` and can be used directly in Cursor with MCP support.

Available tools:
- `convert_figma_to_merch_card` - Full conversion with file saving and registration
- `analyze_figma_design` - Design analysis only
- `generate_variant_code` - Code generation from analysis
- `update_variant_picker` - Add variant to studio variant picker

## Configuration

Update your Figma API token in the test files or when using the MCP tools. 
