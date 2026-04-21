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
            {
                text: 'Create cards',
                icon: 'NewItem',
                prompt: 'Help me create cards',
                intentHint: 'release',
            },
            {
                text: 'Search offers',
                icon: 'Offer',
                prompt: 'Search for offers by product, commitment, or term',
            },
            {
                text: 'Search products',
                icon: 'ShoppingCart',
                prompt: 'Search for products in the MCS catalog',
            },
            {
                text: 'Find Cards',
                icon: 'Search',
                prompt: 'Help me find specific cards',
                intentHint: 'guided_search',
            },
            {
                text: 'Help',
                icon: 'Help',
                prompt: 'Show me help topics for M@S Studio',
                intentHint: 'guided_help',
            },
        ];
    }

    get surfaceSuggestions() {
        return {
            acom: [
                { text: 'Plans Cards', icon: 'Table', prompt: 'Show me all plans cards in the current workspace' },
                {
                    text: 'Special Offers',
                    icon: 'Star',
                    prompt: 'Find special-offers cards in the current workspace',
                },
            ],
            ccd: [{ text: 'CCD Slices', icon: 'Layers', prompt: 'Show CCD slice cards in the current workspace' }],
            commerce: [
                {
                    text: 'Fries Cards',
                    icon: 'ShoppingCart',
                    prompt: 'Show fries cards in the current workspace',
                },
            ],
            'adobe-home': [
                {
                    text: 'Try Buy Widgets',
                    icon: 'Collection',
                    prompt: 'Show try-buy widget cards in the current workspace',
                },
                {
                    text: 'Promoted Plans',
                    icon: 'Table',
                    prompt: 'Show promoted plans cards in the current workspace',
                },
            ],
            express: [
                {
                    text: 'Express Pricing',
                    icon: 'Star',
                    prompt: 'Show express pricing cards in the current workspace',
                },
            ],
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
                detail: { prompt: suggestion.prompt, intentHint: suggestion.intentHint },
                bubbles: true,
                composed: true,
            }),
        );
    }

    renderIcon(iconName) {
        switch (iconName) {
            case 'NewItem':
                return html`<sp-icon-new-item slot="icon" size="s"></sp-icon-new-item>`;
            case 'Search':
                return html`<sp-icon-search slot="icon" size="s"></sp-icon-search>`;
            case 'Help':
                return html`<sp-icon-help slot="icon" size="s"></sp-icon-help>`;
            case 'Table':
                return html`<sp-icon-table slot="icon" size="s"></sp-icon-table>`;
            case 'Layers':
                return html`<sp-icon-layers slot="icon" size="s"></sp-icon-layers>`;
            case 'ShoppingCart':
                return html`<sp-icon-shopping-cart slot="icon" size="s"></sp-icon-shopping-cart>`;
            case 'Offer':
                return html`<sp-icon-offer slot="icon" size="s"></sp-icon-offer>`;
            case 'Collection':
                return html`<sp-icon-collection slot="icon" size="s"></sp-icon-collection>`;
            case 'Star':
                return html`<sp-icon-star slot="icon" size="s"></sp-icon-star>`;
            default:
                return html`<sp-icon-asterisk slot="icon" size="s"></sp-icon-asterisk>`;
        }
    }

    render() {
        return html`
            <div class="welcome-chips">
                ${this.contextAwareSuggestions.map(
                    (suggestion) => html`
                        <sp-action-button quiet size="s" @click=${() => this.handleSuggestionClick(suggestion)}>
                            ${this.renderIcon(suggestion.icon)} ${suggestion.text}
                        </sp-action-button>
                    `,
                )}
            </div>
        `;
    }
}

customElements.define('mas-prompt-suggestions', MasPromptSuggestions);
