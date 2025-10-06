import { LitElement, html } from 'lit';

/**
 * Prompt Suggestions Component
 * Displays clickable prompt buttons for quick start
 */
export class MasPromptSuggestions extends LitElement {
    static properties = {
        suggestions: { type: Array },
    };

    constructor() {
        super();
        this.suggestions = [
            {
                text: 'Create a collection',
                prompt: 'Create a collection',
                skipLLM: true,
                action: 'open-collection-selector',
            },
            {
                text: 'Create a plans card',
                prompt: 'Create a plans card for Adobe Creative Cloud',
            },
            {
                text: 'Create a fries card',
                prompt: 'Create a fries card for Adobe Express',
            },
            {
                text: 'Create a special offers card',
                prompt: 'Create a special offers card with discount pricing',
            },
        ];
    }

    createRenderRoot() {
        return this;
    }

    handleSuggestionClick(suggestion) {
        if (suggestion.skipLLM) {
            this.dispatchEvent(
                new CustomEvent('direct-action', {
                    detail: {
                        action: suggestion.action,
                        prompt: suggestion.prompt,
                    },
                    bubbles: true,
                    composed: true,
                }),
            );
        } else {
            this.dispatchEvent(
                new CustomEvent('prompt-selected', {
                    detail: { prompt: suggestion.prompt },
                    bubbles: true,
                    composed: true,
                }),
            );
        }
    }

    render() {
        return html`
            <div class="prompt-suggestions">
                <p class="prompt-suggestions-label">Quick start:</p>
                <div class="prompt-buttons-grid">
                    ${this.suggestions.map(
                        (suggestion) => html`
                            <sp-button size="m" variant="accent" @click=${() => this.handleSuggestionClick(suggestion)}>
                                ${suggestion.text}
                            </sp-button>
                        `,
                    )}
                </div>
            </div>
        `;
    }
}

customElements.define('mas-prompt-suggestions', MasPromptSuggestions);
