import { LitElement, html } from 'lit';

export const NEW_RELEASE_INTENT = 'new_release';
export const NEW_RELEASE_CLICKED_KEY = 'mas-chat-new-release-clicked';

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
                text: 'New Release',
                icon: 'NewItem',
                prompt: 'Kickstart cards for a new product release',
                intentHint: NEW_RELEASE_INTENT,
            },
            {
                text: 'Create Card',
                icon: 'AddCircle',
                prompt: 'I want to create a new card — help me pick the right type',
                intentHint: 'guided_create',
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
        if (suggestion.intentHint === NEW_RELEASE_INTENT) {
            try {
                localStorage.setItem(NEW_RELEASE_CLICKED_KEY, '1');
            } catch {
                // localStorage is unavailable (private mode, quota); fail silently
                // — the placeholder will keep rotating, which is harmless.
            }
        }
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
            case 'AddCircle':
                return html`<sp-icon-add-circle slot="icon" size="s"></sp-icon-add-circle>`;
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
