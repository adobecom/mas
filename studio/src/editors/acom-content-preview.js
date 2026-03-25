const ADOBE_GLOBAL_STYLES = 'https://www.adobe.com/libs/styles/styles.css';
const ADOBE_MERCH_STYLES = 'https://www.adobe.com/libs/blocks/merch/merch.css';
const ADOBE_TABLE_STYLES = 'https://www.adobe.com/libs/blocks/table/table.css';
const ADOBE_COMPARISON_TABLE_STYLES = 'https://www.adobe.com/libs/blocks/comparison-table/comparison-table.css';
const ADOBE_TOKEN_BRIDGE_ID = 'adobe-token-bridge';
const ADOBE_PREVIEW_STYLES = [ADOBE_GLOBAL_STYLES, ADOBE_MERCH_STYLES, ADOBE_TABLE_STYLES, ADOBE_COMPARISON_TABLE_STYLES];

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

    static async getBridgedCssText(url) {
        return fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${url}`);
                }
                return response.text();
            })
            .then((cssText) => cssText.replaceAll(':root', ':host'))
            .catch((error) => {
                console.warn('[acom-content-preview] failed to bridge stylesheet tokens', {
                    url,
                    error: error instanceof Error ? error.message : String(error),
                });
                return '';
            });
    }

    static async getTokenBridgeCss() {
        if (!this.tokenBridgeCssPromise) {
            this.tokenBridgeCssPromise = Promise.all(
                ADOBE_PREVIEW_STYLES.map((url) => AcomContentPreview.getBridgedCssText(url)),
            ).then((chunks) => chunks.filter(Boolean).join('\n'));
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
                max-width: 1200px;
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

        this.shadowRoot.append(globalStyles, tableStyles, merchStyles, comparisonTableStyles, style);

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
