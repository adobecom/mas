import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('Figma to Merch Card MCP', () => {
  test('should extract file key from Figma URL', async () => {
    const { FigmaToMerchCardMCP } = await import('../figma-to-merch-card-mcp.js');
    
    const url = 'https://www.figma.com/file/ABC123DEF456/My-Design-File';
    const fileKey = FigmaToMerchCardMCP.extractFileKey(url);
    
    assert.strictEqual(fileKey, 'ABC123DEF456');
  });

  test('should handle direct file key input', async () => {
    const { FigmaToMerchCardMCP } = await import('../figma-to-merch-card-mcp.js');
    
    const fileKey = 'ABC123DEF456';
    const result = FigmaToMerchCardMCP.extractFileKey(fileKey);
    
    assert.strictEqual(result, 'ABC123DEF456');
  });

  test('should convert RGB to hex correctly', async () => {
    const { FigmaToMerchCardMCP } = await import('../figma-to-merch-card-mcp.js');
    
    const hex = FigmaToMerchCardMCP.rgbToHex(1, 0, 0);
    assert.strictEqual(hex, '#FF0000');
    
    const hex2 = FigmaToMerchCardMCP.rgbToHex(0, 0, 1);
    assert.strictEqual(hex2, '#0000FF');
    
    const hex3 = FigmaToMerchCardMCP.rgbToHex(0.5, 0.5, 0.5);
    assert.strictEqual(hex3, '#808080');
  });

  test('should map colors to spectrum tokens', async () => {
    const { FigmaToMerchCardMCP } = await import('../figma-to-merch-card-mcp.js');
    const mcp = new FigmaToMerchCardMCP();
    
    const spectrumColor = mcp.mapToSpectrumColor('#FF0000');
    assert.strictEqual(spectrumColor, 'spectrum-red-500');
    
    const rgbColor = mcp.mapToSpectrumColor({ r: 1, g: 0, b: 0 });
    assert.strictEqual(rgbColor, 'spectrum-red-500');
    
    const unknownColor = mcp.mapToSpectrumColor('#123456');
    assert.strictEqual(unknownColor, '#123456');
  });

  test('should determine slot types correctly', async () => {
    const { FigmaToMerchCardMCP } = await import('../figma-to-merch-card-mcp.js');
    
    const titleNode = { name: 'Product Title', textStyle: { fontSize: 28 } };
    assert.strictEqual(FigmaToMerchCardMCP.determineSlotType(titleNode), 'heading-m');
    
    const priceNode = { name: 'Price', text: '$99.99' };
    assert.strictEqual(FigmaToMerchCardMCP.determineSlotType(priceNode), 'heading-xs');
    
    const descriptionNode = { name: 'Product Description' };
    assert.strictEqual(FigmaToMerchCardMCP.determineSlotType(descriptionNode), 'body-xs');
    
    const buttonNode = { name: 'Buy Now Button' };
    assert.strictEqual(FigmaToMerchCardMCP.determineSlotType(buttonNode), 'footer');
    
    const badgeNode = { name: 'New Badge' };
    assert.strictEqual(FigmaToMerchCardMCP.determineSlotType(badgeNode), 'badge');
  });

  test('should generate AEM fragment mapping', async () => {
    const { FigmaToMerchCardMCP } = await import('../figma-to-merch-card-mcp.js');
    const mcp = new FigmaToMerchCardMCP();
    
    const mockAnalysis = {
      type: 'FRAME',
      children: [
        {
          type: 'TEXT',
          name: 'Product Title',
          text: 'Adobe Creative Suite',
          textStyle: { fontSize: 28 }
        },
        {
          type: 'TEXT',
          name: 'Product Description',
          text: 'Complete creative toolkit'
        }
      ]
    };
    
    const mapping = mcp.generateAEMFragmentMapping(mockAnalysis);
    
    assert(mapping.producttitle);
    assert.strictEqual(mapping.producttitle.slot, 'heading-m');
    assert.strictEqual(mapping.producttitle.tag, 'h3');
    
    assert(mapping.productdescription);
    assert.strictEqual(mapping.productdescription.slot, 'body-xs');
    assert.strictEqual(mapping.productdescription.tag, 'div');
    
    assert(mapping.ctas);
    assert.strictEqual(mapping.ctas.slot, 'footer');
  });

  test('should generate variant class name correctly', async () => {
    const { FigmaToMerchCardMCP } = await import('../figma-to-merch-card-mcp.js');
    const mcp = new FigmaToMerchCardMCP();
    
    const mockAnalysis = {
      type: 'FRAME',
      children: []
    };
    
    const code = mcp.generateVariantClass(mockAnalysis, 'custom-product-card');
    
    assert(code.includes('class CustomProductCard'));
    assert(code.includes('CUSTOM_PRODUCT_CARD_AEM_FRAGMENT_MAPPING'));
    assert(code.includes("variant='custom-product-card'"));
  });
});

describe('Example Usage Scenarios', () => {
  test('should handle typical product card structure', async () => {
    const { FigmaToMerchCardMCP } = await import('../figma-to-merch-card-mcp.js');
    const mcp = new FigmaToMerchCardMCP();
    
    const productCardAnalysis = {
      id: '1:1',
      name: 'Product Card',
      type: 'FRAME',
      styles: {
        backgroundColor: 'spectrum-gray-50',
        borderColor: 'spectrum-gray-200',
        borderRadius: 8
      },
      children: [
        {
          type: 'TEXT',
          name: 'Product Title',
          text: 'Adobe Photoshop',
          textStyle: { fontSize: 24, fontWeight: 600 }
        },
        {
          type: 'TEXT',
          name: 'Price',
          text: '$20.99/mo',
          textStyle: { fontSize: 20, fontWeight: 700 }
        },
        {
          type: 'TEXT',
          name: 'Description',
          text: 'Image editing and design',
          textStyle: { fontSize: 14, fontWeight: 400 }
        }
      ]
    };
    
    const css = mcp.generateVariantCSS(productCardAnalysis, 'adobe-product');
    const variantClass = mcp.generateVariantClass(productCardAnalysis, 'adobe-product');
    
    assert(css.includes('--consonant-merch-card-adobe-product-width'));
    assert(css.includes('spectrum-gray-50'));
    assert(css.includes('border-radius: 8px'));
    
    assert(variantClass.includes('class AdobeProduct'));
    assert(variantClass.includes('ADOBE_PRODUCT_AEM_FRAGMENT_MAPPING'));
  });
});

console.log('Example usage scenarios:');
console.log('');
console.log('1. Convert a Figma design to merch card:');
console.log('   Use convert_figma_to_merch_card with your Figma URL and access token');
console.log('');
console.log('2. Analyze a design first:');
console.log('   Use analyze_figma_design to see the structure before generating code');
console.log('');
console.log('3. Generate code from analysis:');
console.log('   Use generate_variant_code with the analysis result');
console.log('');
console.log('Remember to:');
console.log('- Name your Figma layers descriptively (title, price, description, etc.)');
console.log('- Use Spectrum colors when possible');
console.log('- Structure your design with clear hierarchy');
console.log('- Test the generated code in your MAS environment'); 
