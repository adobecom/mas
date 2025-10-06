import { LitElement, html, css } from 'lit';

class MasCollectionPreview extends LitElement {
    static properties = {
        fragmentIds: { type: Array },
        fragments: { type: Array, state: true },
        loading: { type: Boolean, state: true },
        error: { type: String, state: true },
    };

    static styles = css`
        .preview-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--spectrum-global-dimension-size-200);
            padding: var(--spectrum-global-dimension-size-400);
        }

        .collection-preview-container {
            display: flex;
            flex-direction: column;
            gap: var(--spectrum-global-dimension-size-300);
        }

        .preview-header h4 {
            margin: 0;
            font-size: var(--spectrum-global-dimension-size-200);
            font-weight: 600;
        }

        .preview-cards {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: var(--spectrum-global-dimension-size-300);
            max-height: 500px;
            overflow-y: auto;
            padding: var(--spectrum-global-dimension-size-200);
            border: 1px solid var(--spectrum-global-color-gray-300);
            border-radius: 4px;
        }

        .preview-card-wrapper {
            display: flex;
            flex-direction: column;
            gap: var(--spectrum-global-dimension-size-100);
        }

        .card-info {
            display: flex;
            justify-content: center;
        }

        .preview-actions {
            display: flex;
            justify-content: center;
            padding-top: var(--spectrum-global-dimension-size-200);
        }
    `;

    constructor() {
        super();
        this.fragmentIds = [];
        this.fragments = [];
        this.loading = false;
        this.error = null;
    }

    createRenderRoot() {
        return this;
    }

    async updated(changedProperties) {
        if (changedProperties.has('fragmentIds') && this.fragmentIds.length) {
            await this.fetchFragments();
        }
    }

    async fetchFragments() {
        this.loading = true;
        this.error = null;

        try {
            const repository = document.querySelector('mas-repository');
            if (!repository) throw new Error('Repository not found');

            const fragments = [];
            for (const id of this.fragmentIds) {
                try {
                    const fragment = id.startsWith('/content/dam')
                        ? await repository.aem.sites.cf.fragments.getByPath(id)
                        : await repository.aem.sites.cf.fragments.getById(id);

                    fragments.push(fragment);
                } catch (err) {
                    console.warn(`Failed to fetch fragment ${id}:`, err);
                }
            }

            this.fragments = fragments;

            if (fragments.length === 0) {
                this.error = 'Could not find any valid fragments';
            }
        } catch (error) {
            console.error('Failed to fetch fragments:', error);
            this.error = error.message;
        } finally {
            this.loading = false;
        }
    }

    handleCreateCollection() {
        this.dispatchEvent(
            new CustomEvent('create-collection', {
                detail: {
                    fragmentIds: this.fragments.map((f) => f.id),
                    fragments: this.fragments,
                },
                bubbles: true,
                composed: true,
            }),
        );
    }

    render() {
        if (this.loading) {
            return html`
                <div class="preview-loading">
                    <sp-progress-circle indeterminate></sp-progress-circle>
                    <p>Loading card previews...</p>
                </div>
            `;
        }

        if (this.error) {
            return html`
                <sp-banner type="warning" open>
                    <div slot="content">${this.error}</div>
                </sp-banner>
            `;
        }

        if (this.fragments.length === 0) {
            return html`<p>No cards to preview</p>`;
        }

        return html`
            <div class="collection-preview-container">
                <div class="preview-header">
                    <h4>Collection Preview (${this.fragments.length} cards)</h4>
                </div>

                <div class="preview-cards">
                    ${this.fragments.map(
                        (fragment) => html`
                            <div class="preview-card-wrapper">
                                <merch-card>
                                    <aem-fragment author fragment="${fragment.id}"></aem-fragment>
                                </merch-card>
                                <div class="card-info">
                                    <sp-badge size="s">${fragment.title || 'Untitled'}</sp-badge>
                                </div>
                            </div>
                        `,
                    )}
                </div>

                <div class="preview-actions">
                    <sp-button size="m" variant="accent" @click=${this.handleCreateCollection}>
                        Create Collection with These Cards
                    </sp-button>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-collection-preview', MasCollectionPreview);
