import { LitElement, html } from 'lit';

/**
 * Operation Result Display Component
 * Shows results from AEM operations executed by AI
 */
export class MasOperationResult extends LitElement {
    static properties = {
        result: { type: Object },
        operationType: { type: String },
    };

    createRenderRoot() {
        return this;
    }

    renderSearchResults() {
        const { results = [] } = this.result;

        if (results.length === 0) {
            return html`
                <div class="operation-result search-result empty">
                    <sp-icon-magnify size="l"></sp-icon-magnify>
                    <p>No cards found matching your criteria.</p>
                </div>
            `;
        }

        return html`
            <div class="operation-result search-result">
                <div class="result-header">
                    <sp-icon-magnify size="m"></sp-icon-magnify>
                    <span>${results.length} card${results.length !== 1 ? 's' : ''} found</span>
                </div>
                <div class="search-results-grid">
                    ${results.map(
                        (fragment) => html`
                            <div class="search-result-card" data-fragment-id="${fragment.id}">
                                <div class="card-info">
                                    <h4>${fragment.title}</h4>
                                    <p class="card-path">${fragment.path}</p>
                                    <div class="card-meta">
                                        ${fragment.tags?.find((t) => t.id.includes('variant/'))
                                            ? html`<sp-badge>${this.extractVariant(fragment)}</sp-badge>`
                                            : ''}
                                        <span class="card-status">${fragment.status}</span>
                                    </div>
                                </div>
                                <div class="card-actions">
                                    <sp-action-button
                                        size="s"
                                        quiet
                                        @click=${() => this.handleOpenCard(fragment)}
                                        title="Open in editor"
                                    >
                                        <sp-icon-edit slot="icon"></sp-icon-edit>
                                    </sp-action-button>
                                </div>
                            </div>
                        `,
                    )}
                </div>
            </div>
        `;
    }

    renderPublishResult() {
        const { fragmentTitle, fragmentPath } = this.result;

        return html`
            <div class="operation-result publish-result success">
                <div class="result-icon">
                    <sp-icon-check-circle size="l"></sp-icon-check-circle>
                </div>
                <div class="result-content">
                    <h4>Published Successfully</h4>
                    <p>"${fragmentTitle}" is now live.</p>
                    ${fragmentPath
                        ? html`<p class="result-path">
                              <a href="${fragmentPath}" target="_blank">${fragmentPath}</a>
                          </p>`
                        : ''}
                </div>
            </div>
        `;
    }

    renderCopyResult() {
        const { newFragmentTitle, newFragmentPath } = this.result;

        return html`
            <div class="operation-result copy-result success">
                <div class="result-icon">
                    <sp-icon-copy size="l"></sp-icon-copy>
                </div>
                <div class="result-content">
                    <h4>Card Duplicated</h4>
                    <p>Created: "${newFragmentTitle}"</p>
                    ${newFragmentPath ? html`<p class="result-path">${newFragmentPath}</p>` : ''}
                </div>
            </div>
        `;
    }

    renderDeleteResult() {
        const { fragmentTitle } = this.result;

        return html`
            <div class="operation-result delete-result success">
                <div class="result-icon">
                    <sp-icon-delete size="l"></sp-icon-delete>
                </div>
                <div class="result-content">
                    <h4>Card Deleted</h4>
                    <p>"${fragmentTitle}" has been removed.</p>
                </div>
            </div>
        `;
    }

    renderUpdateResult() {
        const { fragmentTitle, updatedFields = [] } = this.result;

        return html`
            <div class="operation-result update-result success">
                <div class="result-icon">
                    <sp-icon-edit size="l"></sp-icon-edit>
                </div>
                <div class="result-content">
                    <h4>Card Updated</h4>
                    <p>"${fragmentTitle}" has been updated.</p>
                    ${updatedFields.length > 0 ? html`<p class="updated-fields">Updated: ${updatedFields.join(', ')}</p>` : ''}
                </div>
            </div>
        `;
    }

    renderGetResult() {
        const { fragment } = this.result;

        if (!fragment) {
            return html`<p>No fragment data available.</p>`;
        }

        return html`
            <div class="operation-result get-result">
                <div class="fragment-preview">
                    <h4>${fragment.title}</h4>
                    <p class="fragment-path">${fragment.path}</p>
                    <div class="fragment-meta">
                        <sp-badge>${this.extractVariant(fragment)}</sp-badge>
                        <span class="fragment-status">${fragment.status}</span>
                    </div>
                    <sp-button size="s" variant="secondary" @click=${() => this.handleOpenCard(fragment)}>
                        Open in Editor
                    </sp-button>
                </div>
            </div>
        `;
    }

    extractVariant(fragment) {
        const variantTag = fragment.tags?.find((t) => t.id.includes('variant/'));
        if (variantTag) {
            return variantTag.id.split('/').pop();
        }
        const variantField = fragment.fields?.find((f) => f.name === 'variant');
        return variantField?.values?.[0] || 'unknown';
    }

    handleOpenCard(fragment) {
        this.dispatchEvent(
            new CustomEvent('open-card', {
                detail: { fragment },
                bubbles: true,
                composed: true,
            }),
        );
    }

    render() {
        if (!this.result) {
            return html`<p>No result data.</p>`;
        }

        switch (this.operationType) {
            case 'search':
                return this.renderSearchResults();
            case 'publish':
                return this.renderPublishResult();
            case 'copy':
                return this.renderCopyResult();
            case 'delete':
                return this.renderDeleteResult();
            case 'update':
                return this.renderUpdateResult();
            case 'get':
                return this.renderGetResult();
            default:
                return html`
                    <div class="operation-result">
                        <p>${this.result.message || 'Operation completed.'}</p>
                    </div>
                `;
        }
    }
}

customElements.define('mas-operation-result', MasOperationResult);
