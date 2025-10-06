import { LitElement, html } from 'lit';
import { createFragmentFromAIConfig } from './utils/ai-card-mapper.js';
import { FragmentStore } from './reactivity/fragment-store.js';

/**
 * Chat Preview Component
 * Displays live preview of generated merch card
 */
export class MasChatPreview extends LitElement {
    static properties = {
        cardConfig: { type: Object },
        fragment: { type: Object },
        isLoading: { type: Boolean },
    };

    constructor() {
        super();
        this.cardConfig = null;
        this.fragment = null;
        this.isLoading = false;
    }

    createRenderRoot() {
        return this;
    }

    updated(changedProperties) {
        if (changedProperties.has('cardConfig') && this.cardConfig) {
            this.createPreviewFragment();
        }
    }

    createPreviewFragment() {
        if (!this.cardConfig) return;

        this.isLoading = true;

        try {
            const fragment = createFragmentFromAIConfig(this.cardConfig, this.cardConfig.variant, {
                title: `Preview: ${this.extractTitle(this.cardConfig)}`,
            });

            this.fragment = new FragmentStore(fragment);
        } catch (error) {
            console.error('Failed to create preview fragment:', error);
        } finally {
            this.isLoading = false;
        }
    }

    extractTitle(cardConfig) {
        if (!cardConfig.title) return 'Untitled Card';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardConfig.title;
        return tempDiv.textContent || 'Untitled Card';
    }

    render() {
        if (this.isLoading) {
            return html`
                <div class="preview-loading">
                    <sp-progress-circle indeterminate></sp-progress-circle>
                    <p>Generating preview...</p>
                </div>
            `;
        }

        if (!this.fragment) {
            return html`
                <div class="preview-empty">
                    <div class="preview-empty-icon">
                        <sp-icon-view-card size="xxl"></sp-icon-view-card>
                    </div>
                    <h4 class="preview-empty-title">Card Preview</h4>
                    <p class="preview-empty-text">Create or select a card to see a live preview here</p>
                </div>
            `;
        }

        const fragmentId = this.fragment.get().id;

        return html`
            <div class="preview-container">
                <div class="preview-header">
                    <h3>Live Preview</h3>
                    <sp-badge size="s">${this.cardConfig.variant}</sp-badge>
                </div>

                <div class="preview-content">
                    <merch-card>
                        <aem-fragment author fragment="${fragmentId}"></aem-fragment>
                    </merch-card>
                </div>

                <div class="preview-info">
                    <sp-help-text> Rendered using actual merch-card component </sp-help-text>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-chat-preview', MasChatPreview);
