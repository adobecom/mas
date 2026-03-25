const ADOBE_GLOBAL_STYLES = 'https://www.adobe.com/libs/styles/styles.css';
const ADOBE_MERCH_STYLES = 'https://www.adobe.com/libs/blocks/merch/merch.css';
const ADOBE_TABLE_STYLES = 'https://www.adobe.com/libs/blocks/table/table.css';
const ADOBE_COMPARISON_TABLE_STYLES =
    'https://main--milo--adobecom.aem.live/libs/blocks/comparison-table/comparison-table.css';
const ADOBE_TOKEN_BRIDGE_ID = 'adobe-token-bridge';

const getCustomPropertyDeclarations = (style) => {
    const declarations = [];
    for (const propertyName of style) {
        if (!propertyName.startsWith('--')) continue;
        const value = style.getPropertyValue(propertyName)?.trim();
        if (!value) continue;
        declarations.push(`${propertyName}: ${value};`);
    }
    return declarations.join('\n');
};

const extractRootTokenRulesFromCssText = (cssText = '') => {
    const chunks = [];
    const rootRulePattern = /:root(?:[^{]*)\{([^}]*)\}/g;

    for (const match of cssText.matchAll(rootRulePattern)) {
        const declarations = (match[1] || '')
            .split(';')
            .map((declaration) => declaration.trim())
            .filter((declaration) => declaration.startsWith('--'))
            .map((declaration) => `${declaration};`);

        if (!declarations.length) continue;
        chunks.push(`:host {\n${declarations.join('\n')}\n}`);
    }

    return chunks.join('\n');
};

const isRootTokenSelector = (selectorText = '') =>
    selectorText
        .split(',')
        .map((selector) => selector.trim())
        .every((selector) => selector.startsWith(':root') && !/[ >+~]/.test(selector.replace(/\([^)]*\)/g, '')));

const serializeRootTokenRules = (cssRules) => {
    const chunks = [];
    for (const rule of Array.from(cssRules || [])) {
        if (rule.cssRules) {
            const nested = serializeRootTokenRules(rule.cssRules);
            if (nested) {
                const conditionText = 'conditionText' in rule ? rule.conditionText : '';
                chunks.push(conditionText ? `@media ${conditionText} {\n${nested}\n}` : nested);
            }
            continue;
        }

        if (!rule.selectorText || !isRootTokenSelector(rule.selectorText)) {
            continue;
        }

        const declarations = getCustomPropertyDeclarations(rule.style);
        if (!declarations) continue;

        chunks.push(`${rule.selectorText.replaceAll(':root', ':host')} {\n${declarations}\n}`);
    }
    return chunks.join('\n');
};

class AcomContentPreview extends HTMLElement {
    static tokenBridgeCssPromise;

    static get observedAttributes() {
        return ['author', 'fragment', 'renderer'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.ensureTokenBridge = this.ensureTokenBridge.bind(this);
    }

    connectedCallback() {
        this.#render();
    }

    attributeChangedCallback() {
        this.#render();
    }

    refresh() {
        this.shadowRoot?.querySelector('aem-fragment')?.refresh?.(false);
    }

    static async getTokenBridgeCss() {
        if (!this.tokenBridgeCssPromise) {
            this.tokenBridgeCssPromise = fetch(ADOBE_GLOBAL_STYLES)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Failed to load ${ADOBE_GLOBAL_STYLES}`);
                    }
                    return response.text();
                })
                .then(async (cssText) => {
                    try {
                        const stylesheet = new CSSStyleSheet();
                        await stylesheet.replace(cssText);
                        const css = serializeRootTokenRules(stylesheet.cssRules);
                        if (css) return css;
                    } catch {
                        // Fall back to text-based extraction below.
                    }
                    return extractRootTokenRulesFromCssText(cssText);
                })
                .catch(() => '');
        }
        return this.tokenBridgeCssPromise;
    }

    async ensureTokenBridge() {
        if (!this.shadowRoot) return;
        let tokenBridge = this.shadowRoot.getElementById(ADOBE_TOKEN_BRIDGE_ID);
        if (!tokenBridge) {
            tokenBridge = document.createElement('style');
            tokenBridge.id = ADOBE_TOKEN_BRIDGE_ID;
            this.shadowRoot.prepend(tokenBridge);
        }
        if (tokenBridge.textContent) return;
        tokenBridge.textContent = await AcomContentPreview.getTokenBridgeCss();
    }

    #render() {
        if (!this.shadowRoot) return;

        const fragmentId = this.getAttribute('fragment');
        const author = this.hasAttribute('author');
        const renderer = this.getAttribute('renderer') === 'consonant' ? 'consonant' : 'legacy';
        const previewTag = renderer === 'consonant' ? 'mas-comparison-table' : 'mas-table';

        this.shadowRoot.replaceChildren();

        const globalStyles = document.createElement('link');
        globalStyles.setAttribute('rel', 'stylesheet');
        globalStyles.setAttribute('href', ADOBE_GLOBAL_STYLES);

        const tableStyles = document.createElement('link');
        tableStyles.setAttribute('rel', 'stylesheet');
        tableStyles.setAttribute('href', ADOBE_TABLE_STYLES);

        const merchStyles = document.createElement('link');
        merchStyles.setAttribute('rel', 'stylesheet');
        merchStyles.setAttribute('href', ADOBE_MERCH_STYLES);

        const comparisonTableStyles = document.createElement('link');
        comparisonTableStyles.setAttribute('rel', 'stylesheet');
        comparisonTableStyles.setAttribute('href', ADOBE_COMPARISON_TABLE_STYLES);

        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
                width: 100%;
                max-width: 900px;
                margin: 0 auto;
                --font-size-multiplier: 1;
            }

            mas-table,
            mas-comparison-table {
                display: block;
                width: 100%;
            }

            .row-highlight {
                background-color: var(--color-white, #fff) !important;
            }
        `;

        this.shadowRoot.append(
            globalStyles,
            tableStyles,
            merchStyles,
            comparisonTableStyles,
            style,
        );

        if (!fragmentId) return;

        const previewTemplate = document.createElement('template');
        previewTemplate.innerHTML = `
            <${previewTag}>
                <aem-fragment ${author ? 'author' : ''} loading="cache" fragment="${fragmentId}"></aem-fragment>
            </${previewTag}>
        `;
        this.shadowRoot.append(previewTemplate.content.cloneNode(true));
        this.ensureTokenBridge();
    }
}

if (!customElements.get('acom-content-preview')) {
    customElements.define('acom-content-preview', AcomContentPreview);
}
