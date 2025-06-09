# FiMeCa - Figma to Merch Card MCP - Standalone

A standalone Model Context Protocol (MCP) server that converts Figma designs into Adobe MAS merch card variants. This tool is now fully decoupled and can work with any target project.

## Quick Start

### 1. Setup

**Install dependencies**:
```bash
npm install
```

**Configure via MCP Client (Recommended)**:

Add to your Cursor MCP configuration file (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "figma-to-merch-card": {
      "command": "node",
      "args": ["/absolute/path/to/figma-to-merch-card-mcp/figma-to-merch-card-mcp.js"],
      "cwd": "/absolute/path/to/figma-to-merch-card-mcp",
      "env": {
        "PROJECT_ROOT": "/absolute/path/to/your/target/project",
        "FIGMA_ACCESS_TOKEN": "figd_your_token_here",
        "OUTPUT_PATH": "web-components/src",
        "STUDIO_PATH": "studio/src",
        "WEB_COMPONENTS_PATH": "web-components"
      }
    }
  }
}
```

**Alternative: Environment Variables**:

If not using an MCP client, you can set environment variables:
```bash
export PROJECT_ROOT="/path/to/your/target/project"
export FIGMA_ACCESS_TOKEN="your_figma_token_here"
```

> **📌 Getting your Figma Token:**
> 1. Go to [Figma Account Settings](https://www.figma.com/settings)
> 2. Scroll to "Personal access tokens"
> 3. Click "Create new token"
> 4. Copy the token (starts with `figd_`)
> 5. Use it in your mcp.json configuration or environment variable

### 2. Configuration

The MCP uses a `config.json` file for configuration. Key settings include:

- `PROJECT_ROOT`: Path to your target project (required)
- `OUTPUT_PATH`: Relative path to web components source (default: `web-components/src`)
- `STUDIO_PATH`: Relative path to studio source (default: `studio/src`)
- `WEB_COMPONENTS_PATH`: Relative path to web components directory (default: `web-components`)

**Example mcp.json configuration**:
```json
{
  "mcpServers": {
    "figma-to-merch-card": {
      "command": "node",
      "args": ["/Users/username/Projects/figma-to-merch-card-mcp/figma-to-merch-card-mcp.js"],
      "cwd": "/Users/username/Projects/figma-to-merch-card-mcp",
      "env": {
        "PROJECT_ROOT": "/Users/username/Projects/mas",
        "FIGMA_ACCESS_TOKEN": "figd_your_token_here",
        "OUTPUT_PATH": "web-components/src",
        "STUDIO_PATH": "studio/src",
        "WEB_COMPONENTS_PATH": "web-components"
      }
    }
  }
}
```

### 3. Run the MCP

**Validate configuration**:
```bash
# Validate your setup
npm run validate
```

**Start the MCP server** (if not using MCP client):
```bash
# Option 1: With convenience script (recommended)
npm run quick-start

# Option 2: Manual environment setup
PROJECT_ROOT="/path/to/your/project" npm start
```

## What it does

- ✅ **Standalone**: No hardcoded paths to specific projects
- ✅ **Configurable**: All paths can be set via environment variables
- ✅ **Self-contained**: Includes all required dependencies locally
- Connects to Figma API to fetch design data
- Analyzes design structure and extracts components
- Generates production-ready merch card variant code
- Saves files to configurable output directory
- Automatically registers variants in your project's `mas.js`
- Automatically adds variants to your studio's variant picker
- Maps colors to Adobe Spectrum design tokens
- Uses the width from the Figma design's main container as the min-width

## Project Structure Requirements

Your target project should have this structure:
```
PROJECT_ROOT/
├── web-components/
│   └── src/
│       ├── variants/          # Generated variants go here
│       └── mas.js            # MCP updates this file
├── studio/
│   └── src/
│       └── editors/
│           └── variant-picker.js  # MCP updates this file
└── package.json
```

## Files

- `figma-to-merch-card-mcp.js` - Main MCP server
- `config.json` - Configuration template
- `config-handler.js` - Configuration management
- `spectrum-colors.js` - Local spectrum color definitions
- `package.json` - Standalone package definition
- `mcp-config.json` - MCP server configuration

## MCP Configuration for Cursor

**Recommended**: Configure all settings in your mcp.json file:

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

This approach centralizes all configuration in one file and eliminates the need for separate environment variable management.

## Available Tools

- `convert_figma_to_merch_card` - Full conversion with file saving and registration
- `convert_figma_with_surface_selection` - Conversion with surface targeting
- `analyze_figma_design` - Design analysis only
- `generate_variant_code` - Code generation from analysis
- `update_variant_picker` - Add variant to studio variant picker

## Environment Variables

These variables can be set in your mcp.json configuration (recommended) or as environment variables:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PROJECT_ROOT` | Target project root path | ✅ Yes | None |
| `FIGMA_ACCESS_TOKEN` | Your Figma API token | ✅ Yes | None |
| `OUTPUT_PATH` | Web components source path | No | `web-components/src` |
| `STUDIO_PATH` | Studio source path | No | `studio/src` |
| `WEB_COMPONENTS_PATH` | Web components directory | No | `web-components` |

## Migration from Embedded Version

If you're migrating from an embedded version:

1. **Configure mcp.json** with your target project paths and Figma token
2. **Update MCP configuration** to point to the standalone version
3. **Test the conversion** to ensure paths resolve correctly
4. **Remove the old embedded version** from your project

## 🔧 Configuration Management

This MCP uses **mcp.json configuration** for streamlined setup and better security.

### ✅ How Configuration Works

All settings are configured through your MCP client's configuration file:

```json
{
  "mcpServers": {
    "figma-to-merch-card": {
      "env": {
        "PROJECT_ROOT": "/path/to/your/project",
        "FIGMA_ACCESS_TOKEN": "your_figma_token",
        "OUTPUT_PATH": "web-components/src",
        "STUDIO_PATH": "studio/src",
        "WEB_COMPONENTS_PATH": "web-components"
      }
    }
  }
}
```

### 🎯 Configuration Benefits

1. **Centralized Management**: All MCP settings in one place (`~/.cursor/mcp.json`)
2. **Enhanced Security**: Tokens stay in your personal config, never in version control
3. **Clean Distribution**: MCP package has no configuration files to manage
4. **Automatic Injection**: MCP runtime handles environment variable management
5. **Zero File Management**: No need to create or maintain separate config files
6. **Multi-Project Support**: Easy to configure for different projects

### 🚀 Getting Started

1. **Add MCP configuration** to your `~/.cursor/mcp.json` file
2. **Set your project paths and Figma token** in the `env` section
3. **Restart your MCP client** to load the configuration
4. **Validate setup** with `npm run validate`

The MCP automatically receives all environment variables from your client configuration!

## Troubleshooting

**Configuration validation failed**: Ensure `PROJECT_ROOT` is configured in mcp.json or environment variables and points to a valid directory.

**Variants directory not found**: The tool expects a `variants` directory in your output path. Make sure your target project has the correct structure.

**Build failed**: Ensure your target project has a `build:bundle` script in its `package.json`.

**Figma API errors**: Verify your `FIGMA_ACCESS_TOKEN` is valid and has access to the design files.

## Development

The MCP is now fully standalone and can be:
- Packaged as an npm module
- Distributed independently
- Used with any compatible project structure
- Extended with additional configuration options

## Common Issues & Solutions

### 🔧 Environment Variable Setup

**Issue**: Getting "Required environment variable PROJECT_ROOT is not set" error

**Solutions**:

1. **Use convenience scripts** (recommended):
   ```bash
   npm run quick-start    # Start MCP server
   npm run validate       # Validate configuration
   ```

2. **Set variables per command**:
   ```bash
   PROJECT_ROOT="/path/to/your/project" node validate-config.js
   ```

3. **Set variables in your shell profile** (permanent):
   ```bash
   # Add to ~/.bashrc, ~/.zshrc, or ~/.profile
   export PROJECT_ROOT="/path/to/your/project"
   export FIGMA_ACCESS_TOKEN="your_token"
   ```

4. **Create a .env file** (if your shell supports it):
   ```bash
   # Create .env file in the MCP directory
   PROJECT_ROOT=/path/to/your/project
   FIGMA_ACCESS_TOKEN=your_token
   ```

### 🔑 Figma Token Issues

**Issue**: Getting "403 Forbidden - Invalid token" error

**Solutions**:

1. **Get a fresh token**:
   - Visit [Figma Settings](https://www.figma.com/settings)
   - Go to "Personal access tokens"
   - Delete old tokens and create a new one
   - Copy the new token (starts with `figd_`)

2. **Verify token access**:
   - Ensure the token has access to the specific Figma file
   - Make sure the file is not private if using a personal token
   - For team files, you may need team-level access

3. **Test token manually**:
   ```bash
   # Test your token with a simple API call
   curl -H "X-Figma-Token: your_token" \
        "https://api.figma.com/v1/me"
   ```

**Issue**: Getting "Required environment variable FIGMA_ACCESS_TOKEN is not set"

**Solution**: Use the convenience scripts with your token:
```bash
FIGMA_ACCESS_TOKEN="your_new_token" npm run validate
FIGMA_ACCESS_TOKEN="your_new_token" npm run quick-start
```
