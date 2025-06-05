# Figma to Merch Card MCP Server

A Model Context Protocol (MCP) server that converts Figma designs into merch card variants for the Adobe MAS (Merch at Scale) library. This tool analyzes Figma files and automatically generates the corresponding JavaScript code, CSS styles, and AEM fragment mappings.

## Features

- **Figma API Integration**: Fetches design data directly from Figma files
- **Spectrum Color Mapping**: Automatically maps colors to Adobe Spectrum design tokens
- **Code Generation**: Creates complete merch card variant implementations
- **AEM Fragment Mapping**: Generates content fragment mappings for AEM integration
- **Slot Detection**: Intelligently determines appropriate slot types based on layer names and content
- **CSS Generation**: Creates responsive CSS with Spectrum color variables
- **Pure JavaScript**: No external dependencies beyond the MCP SDK and node-fetch

## Installation

```bash
npm install
```

## Prerequisites

1. **Figma API Access Token**: Get your personal access token from [Figma Settings](https://www.figma.com/settings)
2. **Node.js**: Version 18 or higher
3. **MCP Client**: Compatible with Claude Desktop or other MCP clients

## Usage

### Running the Server

```bash
npm start
```

Or for development with debugging:

```bash
npm run dev
```

### MCP Client Configuration

Add this server to your MCP client configuration:

```json
{
  "mcpServers": {
    "figma-to-merch-card": {
      "command": "node",
      "args": ["path/to/figma-to-merch-card-mcp.js"]
    }
  }
}
```

## Available Tools

### 1. `convert_figma_to_merch_card`

Converts a complete Figma design to a merch card variant with all necessary files.

**Parameters:**
- `figmaUrl` (required): Figma file URL or file key
- `accessToken` (required): Your Figma API access token
- `variantName` (required): Name for the new variant (kebab-case)
- `frameId` (optional): Specific frame ID to convert

**Example:**
```javascript
{
  "figmaUrl": "https://www.figma.com/file/ABC123/My-Design",
  "accessToken": "figd_...",
  "variantName": "custom-product-card",
  "frameId": "123:456"
}
```

**Output:**
- Complete variant JavaScript class
- CSS styles file
- Registration code
- AEM fragment mapping

### 2. `analyze_figma_design`

Analyzes a Figma design and extracts the component structure without generating code.

**Parameters:**
- `figmaUrl` (required): Figma file URL or file key
- `accessToken` (required): Your Figma API access token
- `frameId` (optional): Specific frame ID to analyze

**Output:**
- Detailed structure analysis
- Color mappings
- Text styles
- Layout hierarchy

### 3. `generate_variant_code`

Generates merch card variant code from a previously analyzed design.

**Parameters:**
- `designAnalysis` (required): Analysis object from `analyze_figma_design`
- `variantName` (required): Name for the variant

**Output:**
- Variant JavaScript class
- CSS styles file

## Figma Design Guidelines

For best results, structure your Figma designs following these conventions:

### Layer Naming

The tool uses layer names to determine slot types:

- **Titles/Headlines**: Include "title" or "heading" in layer name
- **Prices**: Include "price" or use "$" symbol in text
- **Descriptions**: Include "description" or "body" in layer name
- **Buttons/CTAs**: Include "button" or "cta" in layer name
- **Badges**: Include "badge" or "label" in layer name
- **Icons**: Include "icon" in layer name
- **Promotional Text**: Include "promo" or "offer" in layer name

### Color Usage

Use colors that map to Adobe Spectrum tokens, or the tool will attempt to find the closest match:

- **Grays**: #000000, #424242, #616161, #757575, #9E9E9E, #BDBDBD, #E0E0E0, #F5F5F5, #FFFFFF
- **Blues**: #1976D2, #00BFFF
- **Greens**: #388E3C, #32CD32
- **Reds**: #D32F2F, #FF0000
- **Oranges**: #F57C00, #FF4500
- **Purples**: #7B1FA2, #8A2BE2

### Text Styles

- **Large headings** (>24px): Mapped to `heading-m` slot
- **Small headings** (≤24px): Mapped to `heading-xs` slot
- **Body text**: Mapped to `body-xs` slot

## Generated Code Structure

The tool generates three main files for each variant:

### 1. Variant Class (`variant-name.js`)

```javascript
import { VariantLayout } from './variant-layout.js';
import { html, css } from 'lit';
import { CSS } from './variant-name.css.js';

export const VARIANT_NAME_AEM_FRAGMENT_MAPPING = {
    // AEM fragment mappings
};

export class VariantName extends VariantLayout {
    // Variant implementation
}
```

### 2. CSS Styles (`variant-name.css.js`)

```javascript
export const CSS = `
    :root {
        --consonant-merch-card-variant-name-width: 300px;
    }
    
    merch-card[variant="variant-name"] {
        // Variant-specific styles
    }
`;
```

### 3. Registration Code

```javascript
import { registerVariant } from './variants.js';
import { VariantName, VARIANT_NAME_AEM_FRAGMENT_MAPPING } from './variant-name.js';

registerVariant(
    'variant-name',
    VariantName,
    VARIANT_NAME_AEM_FRAGMENT_MAPPING,
    VariantName.variantStyle
);
```

## Slot Mapping

The tool automatically maps Figma layers to merch card slots:

| Figma Layer Type | Slot Name | Usage |
|------------------|-----------|-------|
| Large headings | `heading-m` | Main titles |
| Small headings | `heading-xs` | Subtitles, prices |
| Body text | `body-xs` | Descriptions |
| Promotional text | `promo-text` | Special offers |
| Buttons/CTAs | `footer` | Action buttons |
| Badges | `badge` | Labels, tags |
| Icons | `icons` | Icon displays |
| Callouts | `callout-content` | Highlighted info |

## Error Handling

The server includes comprehensive error handling for:

- Invalid Figma URLs or file keys
- API authentication failures
- Missing or inaccessible frames
- Network connectivity issues
- Malformed design structures

## Development

### Project Structure

```
├── figma-to-merch-card-mcp.js  # Main MCP server
├── package.json                # Dependencies and scripts
├── README.md                   # Documentation
└── test/                       # Test files (optional)
```

### Adding New Features

1. **Color Mapping**: Extend `SPECTRUM_COLOR_MAP` with new color mappings
2. **Slot Detection**: Modify `determineSlotType()` method for new slot types
3. **Style Generation**: Enhance `generateVariantCSS()` for additional CSS features
4. **Layout Templates**: Update `generateSlotHTML()` for new layout patterns

### Testing

```bash
npm test
```

## Limitations

- Requires Figma API access token
- Limited to public Figma files or files accessible with the provided token
- Color mapping is based on exact hex matches or closest approximation
- Complex nested layouts may require manual adjustment
- Image assets are not automatically exported (use Figma's image export API separately)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the [Issues](https://github.com/your-username/figma-to-merch-card-mcp/issues) page
- Review the Figma API documentation
- Consult the Adobe MAS library documentation

  



