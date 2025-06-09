# Figma to Merch Card MCP - Standalone Setup Guide

This guide helps you set up and use the Figma to Merch Card MCP as a standalone tool for any target project.

## ✅ Quick Setup

### 1. MCP Configuration (Recommended)

Configure the MCP server in your Cursor MCP configuration file (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "figma-to-merch-card": {
      "command": "node",
      "args": ["/path/to/figma-to-merch-card-mcp/figma-to-merch-card-mcp.js"],
      "cwd": "/path/to/figma-to-merch-card-mcp",
      "env": {
        "PROJECT_ROOT": "/path/to/your/target/project",
        "FIGMA_ACCESS_TOKEN": "figd_your_token_here",
        "OUTPUT_PATH": "web-components/src",
        "STUDIO_PATH": "studio/src",
        "WEB_COMPONENTS_PATH": "web-components"
      }
    }
  }
}
```

### 2. Alternative: Environment Variables

If not using MCP client, set environment variables:

```bash
# Required: Path to your target project
export PROJECT_ROOT="/path/to/your/target/project"

# Required: Your Figma API access token
export FIGMA_ACCESS_TOKEN="figd_your_token_here"

# Optional: Override default paths if needed
export OUTPUT_PATH="web-components/src"
export STUDIO_PATH="studio/src" 
export WEB_COMPONENTS_PATH="web-components"
```

### 3. Validate Configuration

Test your setup:

```bash
npm run validate
```

Expected output when working:
```
🎉 Configuration validation completed successfully!
```

### 4. Start MCP Server (if not using MCP client)

```bash
npm start
```

## 📁 Target Project Structure

Your target project must have this structure:

```
PROJECT_ROOT/
├── web-components/
│   └── src/
│       ├── variants/          # Generated variants saved here
│       └── mas.js            # Auto-updated with new variants
├── studio/
│   └── src/
│       └── editors/
│           └── variant-picker.js  # Auto-updated with new variants
├── package.json              # Must have build:bundle script
└── node_modules/
```

## 🔧 Integration Options

### Option A: Cursor IDE Integration (Recommended)

Add to your Cursor MCP configuration (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "figma-to-merch-card": {
      "command": "node",
      "args": ["/absolute/path/to/figma-to-merch-card-mcp/figma-to-merch-card-mcp.js"],
      "cwd": "/absolute/path/to/figma-to-merch-card-mcp",
      "env": {
        "PROJECT_ROOT": "/absolute/path/to/your/target/project",
        "FIGMA_ACCESS_TOKEN": "your_figma_token_here",
        "OUTPUT_PATH": "web-components/src",
        "STUDIO_PATH": "studio/src",
        "WEB_COMPONENTS_PATH": "web-components"
      }
    }
  }
}
```

### Option B: Direct MCP Client

Use with any MCP-compatible client by connecting to the server with environment variables set.

### Option C: NPM Package (Future)

This standalone version can be packaged and distributed as an npm module.

## 🛠️ Available Tools

Once connected, you can use these MCP tools:

- **`convert_figma_to_merch_card`** - Full conversion with automatic file generation
- **`convert_figma_with_surface_selection`** - Conversion with specific surface targeting
- **`analyze_figma_design`** - Design analysis without code generation
- **`generate_variant_code`** - Generate code from existing analysis
- **`update_variant_picker`** - Add variant to studio variant picker

## 🔍 Troubleshooting

### Configuration Issues

**Problem**: `Configuration validation failed`
**Solution**: 
- Ensure `PROJECT_ROOT` is configured in mcp.json or environment variables
- Verify the path points to a valid directory

**Problem**: `variants directory not found`
**Solution**: Ensure your target project has the expected directory structure

### Figma API Issues

**Problem**: `Figma access token is required`
**Solution**: Set `FIGMA_ACCESS_TOKEN` in mcp.json env section or environment variables

**Problem**: `Figma API error: 401 Unauthorized`
**Solution**: Verify your Figma token has access to the design files

### Build Issues

**Problem**: `build:bundle script not found`
**Solution**: Ensure your target project's `package.json` has a `build:bundle` script

## 🚀 Migration from Embedded Version

If migrating from an embedded version:

1. **Remove embedded version** from your project
2. **Set environment variables** as shown above
3. **Update MCP configuration** to point to standalone version
4. **Test conversion** to ensure everything works

## 📝 Configuration Reference

### MCP Configuration (mcp.json)

Configure all variables in the `env` section of your MCP server configuration:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PROJECT_ROOT` | Target project root path | ✅ Yes | None |
| `FIGMA_ACCESS_TOKEN` | Figma API access token | ✅ Yes | None |
| `OUTPUT_PATH` | Web components source relative path | No | `web-components/src` |
| `STUDIO_PATH` | Studio source relative path | No | `studio/src` |
| `WEB_COMPONENTS_PATH` | Web components directory relative path | No | `web-components` |

### Environment Variables

Same variables can be set as environment variables if not using MCP client configuration.

## 📦 Distribution

This standalone MCP can be:
- Shared as a directory
- Packaged as an npm module
- Containerized for deployment
- Used across multiple projects

The configuration system makes it project-agnostic and highly portable.

## 🔗 Next Steps

1. **Configure mcp.json**: Set up the MCP server with your project paths
2. **Test with your project**: Use `validate-config.js` to ensure compatibility
3. **Convert a design**: Try one of the conversion tools
4. **Customize configuration**: Adjust paths if your project structure differs
5. **Integrate into workflow**: Add to your development tools and CI/CD 