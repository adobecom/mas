import { chromium } from 'playwright';
import { existsSync } from 'fs';
import path from 'path';

export class LiveCardExtractor {
    /**
     * Auto-detect card type from the live card
     */
    detectCardType(card) {
        // Check for card type indicators
        const cardClasses = card.className || '';
        const cardVariant = card.getAttribute('variant') || '';
        
        // Common card type patterns
        if (cardClasses.includes('catalog') || cardVariant.includes('catalog')) return 'catalog';
        if (cardClasses.includes('plans') || cardVariant.includes('plans')) return 'plans';
        if (cardClasses.includes('special-offers') || cardVariant.includes('special-offers')) return 'special-offers';
        if (cardClasses.includes('suggested') || cardVariant.includes('suggested')) return 'suggested';
        if (cardClasses.includes('slice') || cardVariant.includes('slice')) return 'slice';
        
        // Check for specific elements that indicate card type
        const hasPrice = card.querySelector('[slot="price"]');
        const hasIcon = card.querySelector('merch-icon');
        const hasBackground = card.querySelector('[slot="media"]');
        
        // Default detection logic based on elements present
        if (hasPrice && hasIcon) return 'fries';
        if (hasBackground) return 'catalog';
        if (hasPrice) return 'plans';
        
        // Default fallback
        return 'fries';
    }

    /**
     * Extract all meaningful CSS properties from an element
     */
    extractAllCSSProperties(element) {
        if (!element) return {};
        
        const styles = window.getComputedStyle(element);
        const result = {};
        
        // Common CSS properties that are meaningful for testing
        const meaningfulProperties = [
            'color', 'background-color', 'border-color', 'border-top-color', 
            'border-right-color', 'border-bottom-color', 'border-left-color',
            'font-size', 'font-weight', 'line-height', 'text-align',
            'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
            'padding', 'margin', 'border-radius', 'display', 'position',
            'text-decoration', 'text-decoration-line', 'text-decoration-color'
        ];
        
        meaningfulProperties.forEach(prop => {
            const value = styles.getPropertyValue(prop);
            // Only include properties with meaningful values
            if (value && 
                value !== 'rgba(0, 0, 0, 0)' && 
                value !== 'transparent' && 
                value !== 'auto' && 
                value !== 'none' &&
                value !== 'normal' &&
                value !== '0px' &&
                value !== 'initial' &&
                value !== 'inherit') {
                result[prop] = value;
            }
        });
        
        return result;
    }

    async extractActualCSSProperties(cardId, milolibs = 'local', cardType = null) {
        const browser = await chromium.launch({ headless: false });
        
        // Try to use existing auth state if available
        const authFile = path.join(process.cwd(), 'nala/.auth/user.json');
        let context;
        
        if (existsSync(authFile)) {
            console.log('Using existing authentication state...');
            context = await browser.newContext({
                ignoreHTTPSErrors: true,
                permissions: ['clipboard-read', 'clipboard-write'],
                storageState: authFile,
            });
        } else {
            context = await browser.newContext({
                ignoreHTTPSErrors: true,
                permissions: ['clipboard-read', 'clipboard-write'],
            });
        }

        const page = await context.newPage();

        try {
            let baseUrl;
            if (milolibs === 'local') {
                baseUrl = 'http://localhost:3000';
            } else {
                baseUrl = 'https://main--mas--adobecom.aem.page';
            }
            const url = `${baseUrl}/studio.html?milolibs=${milolibs}#page=content&path=nala&query=${cardId}`;

            console.log(`Navigating to: ${url}`);
            await page.goto(url, { waitUntil: 'networkidle' });

            // Handle authentication if needed
            if (page.url().includes('auth.services.adobe.com')) {
                console.log('Authentication required. Please log in manually...');
                // Wait for user to complete authentication
                await page.waitForURL('**/studio.html**', { timeout: 60000 });
                await page.waitForTimeout(3000);
            }

            // Wait for card to load
            await page.waitForSelector('merch-card', { timeout: 20000 });
            await page.waitForTimeout(3000);

            // Extract actual CSS properties dynamically
            const extractedData = await page.evaluate((cardId) => {
                // Find card using multiple strategies
                const cardSelectors = [
                    `aem-fragment[fragment-id="${cardId}"]`,
                    `aem-fragment[fragment="${cardId}"]`,
                    `merch-card[data-card-id="${cardId}"]`,
                    `[data-fragment-id="${cardId}"]`,
                    `[fragment-id="${cardId}"]`,
                    'merch-card'
                ];

                let card = null;
                for (const selector of cardSelectors) {
                    card = document.querySelector(selector);
                    if (card) {
                        console.log(`Found card using selector: ${selector}`);
                        break;
                    }
                }

                // If we found a fragment, get the parent merch-card
                if (card && card.tagName === 'AEM-FRAGMENT') {
                    const parentCard = card.closest('merch-card');
                    if (parentCard) {
                        card = parentCard;
                    }
                }

                if (!card) {
                    return { error: 'Card not found' };
                }

                // Auto-detect card type
                const detectCardType = (cardElement) => {
                    const cardClasses = cardElement.className || '';
                    const cardVariant = cardElement.getAttribute('variant') || '';
                    
                    if (cardClasses.includes('catalog') || cardVariant.includes('catalog')) return 'catalog';
                    if (cardClasses.includes('plans') || cardVariant.includes('plans')) return 'plans';
                    if (cardClasses.includes('special-offers') || cardVariant.includes('special-offers')) return 'special-offers';
                    if (cardClasses.includes('suggested') || cardVariant.includes('suggested')) return 'suggested';
                    if (cardClasses.includes('slice') || cardVariant.includes('slice')) return 'slice';
                    
                    const hasPrice = cardElement.querySelector('[slot="price"]');
                    const hasIcon = cardElement.querySelector('merch-icon');
                    const hasBackground = cardElement.querySelector('[slot="media"]');
                    
                    if (hasPrice && hasIcon) return 'fries';
                    if (hasBackground) return 'catalog';
                    if (hasPrice) return 'plans';
                    
                    return 'fries';
                };

                const cardType = detectCardType(card);

                // Extract all meaningful CSS properties from an element
                const extractAllCSSProperties = (element) => {
                    if (!element) return {};
                    
                    const styles = window.getComputedStyle(element);
                    const result = {};
                    
                    const meaningfulProperties = [
                        'color', 'background-color', 'border-color', 'border-top-color', 
                        'border-right-color', 'border-bottom-color', 'border-left-color',
                        'font-size', 'font-weight', 'line-height', 'text-align',
                        'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
                        'padding', 'margin', 'border-radius', 'display', 'position',
                        'text-decoration', 'text-decoration-line', 'text-decoration-color'
                    ];
                    
                    meaningfulProperties.forEach(prop => {
                        const value = styles.getPropertyValue(prop);
                        if (value && 
                            value !== 'rgba(0, 0, 0, 0)' && 
                            value !== 'transparent' && 
                            value !== 'auto' && 
                            value !== 'none' &&
                            value !== 'normal' &&
                            value !== '0px' &&
                            value !== 'initial' &&
                            value !== 'inherit') {
                            result[prop] = value;
                        }
                    });
                    
                    return result;
                };

                // Extract card-level CSS properties
                const cardProps = extractAllCSSProperties(card);

                const result = {
                    cardType: cardType,
                    card: cardProps,
                    elements: {},
                    slots: []
                };

                // Find all slots in the card
                const allSlottedElements = card.querySelectorAll('[slot]');
                const slotsFound = new Set();
                
                allSlottedElements.forEach(element => {
                    const slotName = element.getAttribute('slot');
                    if (slotName) {
                        slotsFound.add(slotName);
                    }
                });

                result.slots = Array.from(slotsFound);

                // Dynamic selectors - find what actually exists
                const potentialSelectors = {
                    title: [
                        'h3[slot="heading-xxs"]',
                        'h2[slot="heading-xs"]',
                        'h1[slot="heading-s"]',
                        '[slot="heading-xs"]',
                        '[slot="heading-s"]',
                        '[slot="heading-m"]',
                        '[slot="heading-l"]',
                        '[slot="heading-xl"]'
                    ],
                    description: [
                        'div[slot="body-s"]',
                        'p[slot="body-s"]',
                        '[slot="body-xs"]',
                        '[slot="body-s"]',
                        '[slot="body-m"]',
                        '[slot="body-l"]',
                        '[slot="body-xl"]'
                    ],
                    price: [
                        'p[slot="price"] span[is="inline-price"]',
                        '[slot="price"] span[is="inline-price"]',
                        'span[is="inline-price"]',
                        '[slot="price"]'
                    ],
                    cta: [
                        '[slot="cta"] a.spectrum-Button',
                        '[slot="cta"] a',
                        '[slot="cta"]'
                    ],
                    icon: ['merch-icon'],
                    trialBadge: [
                        'div[slot="trial-badge"] merch-badge',
                        '[slot="trial-badge"] merch-badge',
                        '[slot="trial-badge"]'
                    ],
                    badge: [
                        'div[slot="badge"] merch-badge',
                        '[slot="badge"] merch-badge',
                        '[slot="badge"]'
                    ],
                    eyebrow: ['[slot="eyebrow"]'],
                    backgroundImage: ['[slot="media"]'],
                    legalLink: ['[slot="legal-link"]'],
                    strikethroughPrice: ['[slot="strikethrough-price"]']
                };

                // Find elements that actually exist and extract their properties
                for (const [elementType, selectors] of Object.entries(potentialSelectors)) {
                    let element = null;
                    let usedSelector = null;
                    
                    // Try each selector until we find an element
                    for (const selector of selectors) {
                        element = card.querySelector(selector);
                        if (element) {
                            usedSelector = selector;
                            break;
                        }
                    }
                    
                    if (element) {
                        const css = extractAllCSSProperties(element);
                        if (Object.keys(css).length > 0) {
                            result.elements[elementType] = {
                                selector: usedSelector,
                                css: css,
                                exists: true,
                                slot: element.getAttribute('slot') || null,
                                tagName: element.tagName.toLowerCase(),
                                textContent: element.textContent?.trim() || ''
                            };
                        }
                    }
                }

                return result;
            }, cardId);

            return extractedData;

        } finally {
            await browser.close();
        }
    }

    generateCSSPropertyObject(extractedData) {
        if (extractedData.error) {
            throw new Error(extractedData.error);
        }

        const cssProp = {
            card: extractedData.card || {}
        };

        // Add CSS properties for each element
        for (const [elementType, data] of Object.entries(extractedData.elements)) {
            if (data.exists && data.css) {
                cssProp[elementType] = data.css;
            }
        }

        return cssProp;
    }

    async updatePageObjectWithLiveCSS(cardId, cardType = 'fries', milolibs = 'local') {
        const extractedData = await this.extractActualCSSProperties(cardId, milolibs, cardType);
        const cssProp = this.generateCSSPropertyObject(extractedData);

        console.log('Extracted CSS Properties:', JSON.stringify(cssProp, null, 2));

        // Return the update instructions
        return {
            cssProp,
            extractedData,
            updateInstructions: `
To update the page object, replace the cssProp object with:

this.cssProp = ${JSON.stringify(cssProp, null, 12).replace(/^/gm, '        ')};
            `.trim()
        };
    }
}

export default LiveCardExtractor; 