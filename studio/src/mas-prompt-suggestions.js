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
                text: 'Create a new merch card',
                prompt: 'Create a new merch card',
            },
            {
                text: 'Create a merch card collection',
                prompt: 'Create a merch card collection',
            },
            {
                text: 'Get help with M@S Studio',
                prompt: 'Get help with M@S Studio',
            },
            {
                text: 'Something else',
                prompt: 'Something else',
            },
        ];
    }

    createRenderRoot() {
        return this;
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
