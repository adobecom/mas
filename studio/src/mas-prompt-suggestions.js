import { LitElement, html } from 'lit';

/**
 * Prompt Suggestions Component
 * Displays clickable chip-style suggestions for quick start
 * Supports context-aware suggestions based on current surface
 */
export class MasPromptSuggestions extends LitElement {
    static properties = {
        context: { type: Object },
    };

    constructor() {
        super();
        this.context = {};
    }

    createRenderRoot() {
        return this;
    }

    get baseSuggestions() {
        return [
            { text: 'Create Card', icon: 'AddCircle', prompt: 'Create a new merch card' },
            { text: 'Search', icon: 'Search', prompt: 'Search for cards' },
            { text: 'Help', icon: 'Help', prompt: 'Get help with M@S Studio' },
        ];
    }

    get surfaceSuggestions() {
        return {
            acom: [{ text: 'Plans Cards', icon: 'Table', prompt: 'Show me plans cards' }],
            ccd: [{ text: 'CCD Slices', icon: 'Layers', prompt: 'Show CCD slice cards' }],
            commerce: [{ text: 'Fries Cards', icon: 'ShoppingCart', prompt: 'Show fries cards' }],
            'adobe-home': [{ text: 'Try Buy Widget', icon: 'Collection', prompt: 'Show try-buy widget cards' }],
            express: [{ text: 'Express Cards', icon: 'Star', prompt: 'Show express cards' }],
        };
    }

    get contextAwareSuggestions() {
        const surface = this.context?.surface;
        const surfaceSpecific = this.surfaceSuggestions[surface] || [];
        return [...this.baseSuggestions, ...surfaceSpecific];
    }

    handleSuggestionClick(suggestion) {
        this.dispatchEvent(
            new CustomEvent('prompt-selected', {
                detail: { prompt: suggestion.prompt },
                bubbles: true,
                composed: true,
            }),
        );
    }

    renderIcon(iconName) {
        switch (iconName) {
            case 'AddCircle':
                return html`<sp-icon-add-circle size="s"></sp-icon-add-circle>`;
            case 'Search':
                return html`<sp-icon-search size="s"></sp-icon-search>`;
            case 'Help':
                return html`<sp-icon-help size="s"></sp-icon-help>`;
            case 'Table':
                return html`<sp-icon-table size="s"></sp-icon-table>`;
            case 'Layers':
                return html`<sp-icon-layers size="s"></sp-icon-layers>`;
            case 'ShoppingCart':
                return html`<sp-icon-shopping-cart size="s"></sp-icon-shopping-cart>`;
            case 'Collection':
                return html`<sp-icon-collection size="s"></sp-icon-collection>`;
            case 'Star':
                return html`<sp-icon-star size="s"></sp-icon-star>`;
            default:
                return html`<sp-icon-asterisk size="s"></sp-icon-asterisk>`;
        }
    }

    render() {
        return html`
            <div class="welcome-chips">
                ${this.contextAwareSuggestions.map(
                    (suggestion) => html`
                        <button class="welcome-chip" @click=${() => this.handleSuggestionClick(suggestion)}>
                            ${this.renderIcon(suggestion.icon)}
                            <span>${suggestion.text}</span>
                        </button>
                    `,
                )}
            </div>
        `;
    }
}

customElements.define('mas-prompt-suggestions', MasPromptSuggestions);
