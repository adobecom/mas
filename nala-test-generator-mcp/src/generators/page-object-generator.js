/**
 * @typedef {import('../types.js').CardConfig} CardConfig
 * @typedef {import('../types.js').PageObjectConfig} PageObjectConfig
 * @typedef {import('../types.js').CSSProperties} CSSProperties
 */

export class PageObjectGenerator {
  /**
   * @param {CardConfig} config
   * @returns {string}
   */
  generatePageObject(config) {
    const className = this.generateClassName(config.cardType);
    const selectors = this.generateSelectors(config);
    const cssProperties = this.generateCSSProperties(config);

    return `export default class ${className} {
    constructor(page) {
        this.page = page;

${this.generateSelectorProperties(selectors)}

        // ${config.cardType} card properties:
        this.cssProp = ${this.formatCSSProperties(cssProperties)};
    }
}
`;
  }

  /**
   * @param {string} cardType
   * @returns {string}
   */
  generateClassName(cardType) {
    const words = cardType.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    );
    return `CCD${words.join('')}Page`;
  }

  /**
   * @param {CardConfig} config
   * @returns {Record<string, string>}
   */
  generateSelectors(config) {
    const selectors = {};

    Object.entries(config.elements).forEach(([elementName, elementConfig]) => {
      if (elementConfig) {
        const selectorName = this.camelCase(elementName);
        selectors[selectorName] = elementConfig.selector;
      }
    });

    return selectors;
  }

  /**
   * @param {Record<string, string>} selectors
   * @returns {string}
   */
  generateSelectorProperties(selectors) {
    return Object.entries(selectors)
      .map(([name, selector]) => `        this.${name} = page.locator('${selector}');`)
      .join('\n');
  }

  /**
   * @param {CardConfig} config
   * @returns {Record<string, CSSProperties>}
   */
  generateCSSProperties(config) {
    const cssProps = {};

    if (config.cssProperties) {
      cssProps.card = config.cssProperties.card || {};
    }

    Object.entries(config.elements).forEach(([elementName, elementConfig]) => {
      if (elementConfig?.cssProperties) {
        cssProps[elementName] = elementConfig.cssProperties;
      }
    });

    return cssProps;
  }

  /**
   * @param {Record<string, CSSProperties>} cssProps
   * @returns {string}
   */
  formatCSSProperties(cssProps) {
    const formatted = JSON.stringify(cssProps, null, 12);
    return formatted.replace(/"/g, "'");
  }

  /**
   * @param {string} str
   * @returns {string}
   */
  camelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }
} 