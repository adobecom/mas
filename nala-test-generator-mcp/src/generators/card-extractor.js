/**
 * @fileoverview Card property extractor for Merch at Scale cards
 * Automatically extracts card properties from live cards using their IDs
 */

import {
    getCardVariantsFromSource,
    getCardTypeMetadata,
} from '../utils/variant-reader.js';

/**
 * @typedef {Object} ExtractedCardData
 * @property {string} cardType - Detected card type
 * @property {string} cardId - Card ID
 * @property {Object} elements - Extracted element data
 * @property {Object} cssProperties - Extracted CSS properties
 * @property {Array<string>} testTypes - Suggested test types
 * @property {Object} interactions - Detected interactions
 * @property {Object} metadata - Card metadata
 */

/**
 * @typedef {Object} ElementData
 * @property {string} selector - Element selector
 * @property {string} expectedText - Element text content
 * @property {Object} cssProperties - Element CSS properties
 * @property {Array<Object>} interactions - Element interactions
 */

export class CardExtractor {
    constructor() {
        // Build card type selectors dynamically from source
        this.cardTypeSelectors = this.buildCardTypeSelectors();

        this.commonSelectors = {
            title: [
                'h3[slot="heading-xxs"]',
                'h3[slot="heading-xs"]',
                'h3[slot="heading-s"]',
                'h3[slot="heading-m"]',
                'h3[slot="heading-l"]',
                'h2[slot="heading-xs"]',
                'h2[slot="heading-m"]',
                'h4[slot="heading-m"]',
                'p[slot="heading-xs"]',
            ],
            eyebrow: [
                'h4[slot="detail-s"]',
                'h5[slot="detail-s"]',
                'p[slot="detail-s"]',
            ],
            description: [
                'div[slot="body-xs"] p',
                'div[slot="body-s"] p',
                'div[slot="body-m"] p',
                'p[slot="body-xs"]',
                'p[slot="body-s"]',
            ],
            price: [
                'p[slot="price"]',
                'span[slot="price"]',
                'div[slot="price"]',
                'p[slot="heading-m"] span[data-template="price"]',
            ],
            strikethroughPrice: [
                '.price-strikethrough',
                'span[data-template="strikethrough"]',
                'p[slot="heading-m"] span.price-strikethrough',
            ],
            cta: [
                'div[slot="cta"] > button',
                'div[slot="cta"] > a',
                'div[slot="footer"] > button',
                'div[slot="cta"] > a[is="checkout-link"]',
                'button[is="checkout-button"]',
            ],
            icon: ['merch-icon[slot="icons"]', 'merch-icon'],
            image: ['div[slot="image"] img', 'img[slot="image"]'],
            badge: [
                'div[slot="badge"] merch-badge',
                'merch-badge',
                '.plans-badge',
                '.ccd-slice-badge',
            ],
            trialBadge: ['div[slot="trial-badge"] merch-badge'],
            legalLink: [
                'div[slot="body-xs"] p > a',
                'div[slot="body-s"] p > a',
                'a.modal-Link',
                'a[data-analytics-id="see-terms"]',
                'a[data-analytics-id="learn-more"]',
            ],
            smallIcons: [
                'div[slot="body-s"] merch-icon[size="xs"]',
                'div[slot="body-s"] overlay-trigger merch-icon',
            ],
        };

        this.cssPropertiesToExtract = [
            'color',
            'font-size',
            'font-weight',
            'line-height',
            'background-color',
            'border-color',
            'border-bottom-color',
            'border-left-color',
            'border-right-color',
            'border-top-color',
            'min-width',
            'max-width',
            'min-height',
            'max-height',
            'width',
            'height',
            'padding',
            'margin',
            'text-decoration-line',
            'text-decoration-color',
        ];
    }

    /**
     * Build card type selectors dynamically from variant picker
     * @returns {Object} Card type selectors mapping
     */
    buildCardTypeSelectors() {
        const variants = getCardVariantsFromSource();
        const selectors = {};

        // Default selector patterns based on common card structures
        const selectorPatterns = {
            catalog: 'h3[slot="heading-m"]',
            plans: 'p[slot="heading-xs"]',
            'plans-students': 'p[slot="heading-xs"]',
            'plans-education': 'p[slot="heading-xs"]',
            'ccd-slice': 'h3[slot="heading-s"]',
            'special-offers': 'h2[slot="heading-xs"]',
            'ccd-suggested': 'h3[slot="heading-xs"]',
            suggested: 'h3[slot="heading-xs"]',
            'ah-try-buy-widget': 'h3[slot="heading-m"]',
            'ah-promoted-plans': 'h3[slot="heading-m"]',
            fries: 'h3[slot="heading-xxs"]',
            twp: 'h3[slot="heading-m"]',
            'inline-heading': 'h2[slot="heading-m"]',
            product: 'h3[slot="heading-l"]',
            'mini-compare-chart': 'h4[slot="heading-m"]',
            segment: 'h3[slot="heading-s"]',
        };

        // Build selectors for each variant
        variants.forEach((variant) => {
            const simplifiedName = variant.replace(/^(ccd-|ah-)/, '');
            const selector =
                selectorPatterns[variant] ||
                selectorPatterns[simplifiedName] ||
                'h3[slot="heading-s"]';

            selectors[simplifiedName] = {
                identifier: selector,
                variant: variant,
            };
        });

        console.error(
            `Built selectors for ${Object.keys(selectors).length} card types:`,
            Object.keys(selectors),
        );
        return selectors;
    }

    /**
     * Build URL from branch name or full URL
     * @param {string} branchOrUrl - Branch name (e.g., 'main', 'feature-branch') or full URL
     * @param {string} [milolibs] - Milolibs branch (e.g., 'MWPW-170520')
     * @returns {string} Complete base URL
     */
    buildBaseUrl(branchOrUrl, milolibs) {
        if (
            branchOrUrl.startsWith('http://') ||
            branchOrUrl.startsWith('https://')
        ) {
            return branchOrUrl;
        }

        // Handle localhost specifically
        if (branchOrUrl.includes('localhost') || milolibs === 'local') {
            return 'http://localhost:3000';
        }

        let url = `https://${branchOrUrl}--mas--adobecom.hlx.page`;

        if (milolibs) {
            url += `?milolibs=${milolibs}`;
        }

        return url;
    }

    /**
     * Generate extraction script for browser execution
     * @param {string} cardId - Card ID to extract
     * @param {string} branchOrUrl - Branch name or base URL for the page
     * @param {string} [path='/studio.html'] - Page path
     * @param {string} [milolibs] - Milolibs branch (e.g., 'MWPW-170520')
     * @returns {string} JavaScript code to execute in browser
     */
    generateExtractionScript(
        cardId,
        branchOrUrl,
        path = '/studio.html',
        milolibs,
    ) {
        const baseUrl = this.buildBaseUrl(branchOrUrl, milolibs);
        return `
            async function extractCardProperties() {
                const cardId = '${cardId}';
                
                // Try multiple ways to find the card
                let card = null;
                
                // Method 1: Direct ID selector
                card = document.querySelector(\`merch-card[id="\${cardId}"]\`);
                
                // Method 2: Find card containing aem-fragment with this ID
                if (!card) {
                    const fragment = document.querySelector(\`aem-fragment[fragment="\${cardId}"]\`);
                    if (fragment) {
                        card = fragment.closest('merch-card');
                    }
                }
                
                // Method 3: Find any merch-card and check if it has the ID
                if (!card) {
                    const allCards = document.querySelectorAll('merch-card');
                    for (const c of allCards) {
                        if (c.id === cardId || c.querySelector(\`aem-fragment[fragment="\${cardId}"]\`)) {
                            card = c;
                            break;
                        }
                    }
                }
                
                if (!card) {
                    throw new Error(\`Card with ID \${cardId} not found\`);
                }
                
                // Wait for card to be fully loaded
                await new Promise(resolve => {
                    if (card.hasAttribute('loaded')) {
                        resolve();
                    } else {
                        const observer = new MutationObserver(() => {
                            if (card.hasAttribute('loaded')) {
                                observer.disconnect();
                                resolve();
                            }
                        });
                        observer.observe(card, { attributes: true });
                        // Fallback timeout
                        setTimeout(resolve, 3000);
                    }
                });
                
                const result = {
                    cardType: 'unknown',
                    cardId: cardId,
                    elements: {},
                    cssProperties: { card: {} },
                    testTypes: ['css', 'functional'],
                    interactions: {},
                    metadata: {
                        tags: ['@mas-studio'],
                        browserParams: '#query=',
                        path: '${path}'
                    }
                };
                
                // Detect card type
                const cardTypeSelectors = ${JSON.stringify(this.cardTypeSelectors)};
                for (const [type, config] of Object.entries(cardTypeSelectors)) {
                    if (card.querySelector(config.identifier)) {
                        result.cardType = type;
                        result.metadata.tags.push(\`@ccd-\${type}\`);
                        break;
                    }
                }
                
                // Extract card CSS properties
                const cardStyles = window.getComputedStyle(card);
                const cssProps = ${JSON.stringify(this.cssPropertiesToExtract)};
                cssProps.forEach(prop => {
                    const value = cardStyles.getPropertyValue(prop);
                    if (value && value !== 'auto' && value !== 'none') {
                        result.cssProperties.card[prop] = value;
                    }
                });
                
                // Extract elements
                const commonSelectors = ${JSON.stringify(this.commonSelectors)};
                for (const [elementName, selectors] of Object.entries(commonSelectors)) {
                    for (const selector of selectors) {
                        const element = card.querySelector(selector);
                        if (element) {
                            const elementData = {
                                selector: selector,
                                expectedText: element.textContent?.trim() || '',
                                cssProperties: {},
                                interactions: []
                            };
                            
                            // Extract CSS properties for element
                            const elementStyles = window.getComputedStyle(element);
                            cssProps.forEach(prop => {
                                const value = elementStyles.getPropertyValue(prop);
                                if (value && value !== 'auto' && value !== 'none') {
                                    elementData.cssProperties[prop] = value;
                                }
                            });
                            
                            // Extract additional attributes based on element type
                            if (elementName === 'icon' || elementName === 'smallIcons') {
                                elementData.expectedAttribute = element.getAttribute('src') || '';
                                elementData.size = element.getAttribute('size') || '';
                                elementData.alt = element.getAttribute('alt') || '';
                            }
                            
                            if (elementName === 'badge' || elementName === 'trialBadge') {
                                elementData.backgroundColor = element.getAttribute('background-color') || '';
                                elementData.borderColor = element.getAttribute('border-color') || '';
                                elementData.variant = element.getAttribute('variant') || '';
                            }
                            
                            if (elementName === 'price') {
                                // Extract price details
                                const priceElement = element.querySelector('.price') || element;
                                if (priceElement) {
                                    elementData.priceDetails = {
                                        currency: priceElement.querySelector('.price-currency-symbol')?.textContent || '',
                                        integer: priceElement.querySelector('.price-integer')?.textContent || '',
                                        decimals: priceElement.querySelector('.price-decimals')?.textContent || '',
                                        recurrence: priceElement.querySelector('.price-recurrence')?.textContent || '',
                                    };
                                }
                            }
                            
                            // Detect interactions
                            if (elementName === 'cta' || elementName === 'legalLink') {
                                elementData.interactions.push({
                                    type: 'click'
                                });
                                result.interactions[elementName] = {
                                    selector: selector,
                                    action: 'click',
                                    expectedResult: elementName === 'cta' ? 'navigates to checkout' : 'opens legal page'
                                };
                            } else if (['title', 'eyebrow', 'description'].includes(elementName)) {
                                elementData.interactions.push({
                                    type: 'edit',
                                    value: \`New \${elementName.charAt(0).toUpperCase() + elementName.slice(1)}\`
                                });
                            }
                            
                            result.elements[elementName] = elementData;
                            break;
                        }
                    }
                }
                
                // Extract all slots present in the card
                const allSlots = card.querySelectorAll('[slot]');
                const slotsFound = new Set();
                allSlots.forEach(el => {
                    const slotName = el.getAttribute('slot');
                    if (slotName) {
                        slotsFound.add(slotName);
                    }
                });
                result.metadata.slotsFound = Array.from(slotsFound);
                
                // Extract variant attribute
                result.metadata.variant = card.getAttribute('variant') || '';
                
                // Extract custom CSS variables
                const customStyles = card.getAttribute('style') || '';
                if (customStyles) {
                    const cssVars = customStyles.match(/--[\w-]+:[^;]+/g) || [];
                    result.metadata.customCSSVariables = cssVars;
                }
                
                // Add test types based on detected elements
                if (Object.keys(result.interactions).length > 0) {
                    result.testTypes.push('interaction');
                }
                if (result.elements.title || result.elements.eyebrow || result.elements.description) {
                    result.testTypes.push('edit', 'save', 'discard');
                }
                
                return result;
            }
            
            return extractCardProperties();
        `;
    }

    /**
     * Extract card properties from a live card
     * @param {string} cardId - Card ID to extract
     * @param {string} branchOrUrl - Branch name or base URL for Merch at Scale
     * @param {Object} [options={}] - Extraction options
     * @param {string} [options.path='/studio.html'] - Page path
     * @param {string} [options.browserParams='#query='] - Browser parameters
     * @param {string} [options.milolibs] - Milolibs branch (e.g., 'MWPW-170520')
     * @returns {Promise<ExtractedCardData>} Extracted card data
     */
    async extractFromLiveCard(cardId, branchOrUrl, options = {}) {
        const {
            path = '/studio.html',
            browserParams = '#query=',
            milolibs,
        } = options;
        const baseUrl = this.buildBaseUrl(branchOrUrl, milolibs);

        const script = this.generateExtractionScript(
            cardId,
            branchOrUrl,
            path,
            milolibs,
        );

        // Construct the full URL properly
        const fullUrl = milolibs
            ? `${baseUrl}${path}${browserParams}${cardId}`
            : `${baseUrl}${path}${browserParams}${cardId}`;

        return {
            extractionScript: script,
            instructions: [
                '1. Open a browser and navigate to the Merch at Scale page',
                `2. Go to: ${fullUrl}`,
                '3. Open browser developer tools (F12)',
                '4. Go to Console tab',
                '5. Paste and execute the extraction script',
                '6. Copy the returned JSON object',
                '7. Use the JSON as configuration for test generation',
            ],
            cardId,
            baseUrl,
            path,
            browserParams,
            fullUrl,
        };
    }

    /**
     * Create a configuration from extracted data
     * @param {ExtractedCardData} extractedData - Data extracted from live card
     * @returns {Object} Configuration object for test generation
     */
    createConfigFromExtractedData(extractedData) {
        return {
            cardType: extractedData.cardType,
            cardId: extractedData.cardId,
            testSuite: `M@S Studio CCD ${extractedData.cardType.charAt(0).toUpperCase() + extractedData.cardType.slice(1)}`,
            elements: extractedData.elements,
            cssProperties: extractedData.cssProperties,
            testTypes: extractedData.testTypes,
            interactions: extractedData.interactions,
            metadata: extractedData.metadata,
        };
    }

    /**
     * Generate a Playwright script for automated extraction
     * @param {string} cardId - Card ID to extract
     * @param {string} branchOrUrl - Branch name or base URL for Merch at Scale
     * @param {Object} [options={}] - Options
     * @param {string} [options.path='/studio.html'] - Page path
     * @param {string} [options.browserParams='#query='] - Browser parameters
     * @param {string} [options.milolibs] - Milolibs branch (e.g., 'MWPW-170520')
     * @returns {string} Playwright script
     */
    generatePlaywrightExtractionScript(cardId, branchOrUrl, options = {}) {
        const {
            path = '/studio.html',
            browserParams = '#query=',
            milolibs,
        } = options;
        const baseUrl = this.buildBaseUrl(branchOrUrl, milolibs);

        return `
import { chromium } from 'playwright';

async function extractCardProperties() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        const url = '${baseUrl}${path}${browserParams}${cardId}';
        console.log('Navigating to:', url);
        
        await page.goto(url);
        await page.waitForLoadState('domcontentloaded');
        
        // Wait for card to be visible
        const cardSelector = 'merch-card[id="${cardId}"]';
        await page.waitForSelector(cardSelector, { timeout: 10000 });
        
        // Execute extraction script
        const result = await page.evaluate(${this.generateExtractionScript(
            cardId,
            branchOrUrl,
            path,
            milolibs,
        )});
        
        console.log('Extracted card data:');
        console.log(JSON.stringify(result, null, 2));
        
        return result;
    } finally {
        await browser.close();
    }
}

extractCardProperties().catch(console.error);
        `;
    }
}
