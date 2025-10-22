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
        const INLINE_DISPLAY_THRESHOLD = 5;

        if (results.length === 0) {
            return html`
                <div class="operation-result search-result empty">
                    <sp-icon-magnify size="l"></sp-icon-magnify>
                    <p>No cards found matching your criteria.</p>
                </div>
            `;
        }

        const shouldShowModal = results.length > INLINE_DISPLAY_THRESHOLD;
        const displayResults = shouldShowModal ? results.slice(0, 3) : results;

        return html`
            <div class="operation-result search-result">
                <div class="result-header">
                    <sp-icon-magnify size="m"></sp-icon-magnify>
                    <span>${results.length} card${results.length !== 1 ? 's' : ''} found</span>
                </div>

                ${shouldShowModal
                    ? html`
                          <div class="search-results-preview">
                              ${displayResults.map(
                                  (fragment) => html`
                                      <div class="search-result-card compact" data-fragment-id="${fragment.id}">
                                          <div class="card-info">
                                              <h4>${fragment.title}</h4>
                                              <div class="card-meta">
                                                  ${fragment.tags?.find((t) => t.id.includes('variant/'))
                                                      ? html`<sp-badge size="s">${this.extractVariant(fragment)}</sp-badge>`
                                                      : ''}
                                                  <span class="card-status">${fragment.status}</span>
                                              </div>
                                          </div>
                                          <sp-action-button
                                              size="s"
                                              quiet
                                              @click=${() => this.handleOpenCard(fragment)}
                                              title="Open in editor"
                                          >
                                              <sp-icon-edit slot="icon"></sp-icon-edit>
                                          </sp-action-button>
                                      </div>
                                  `,
                              )}
                          </div>
                          <div class="search-results-actions">
                              <sp-button size="m" variant="accent" @click=${() => this.handleViewAllCards()}>
                                  <sp-icon-view-list slot="icon"></sp-icon-view-list>
                                  View All ${results.length} Cards
                              </sp-button>
                          </div>
                      `
                    : html`
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
                      `}
            </div>
        `;
    }

    handleViewAllCards() {
        this.dispatchEvent(
            new CustomEvent('view-all-cards', {
                detail: { results: this.result.results },
                bubbles: true,
                composed: true,
            }),
        );
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

    renderUnpublishResult() {
        const { fragmentTitle, fragmentPath } = this.result;

        return html`
            <div class="operation-result unpublish-result success">
                <div class="result-icon">
                    <sp-icon-close-circle size="l"></sp-icon-close-circle>
                </div>
                <div class="result-content">
                    <h4>Unpublished Successfully</h4>
                    <p>"${fragmentTitle}" has been unpublished.</p>
                    ${fragmentPath ? html`<p class="result-path">${fragmentPath}</p>` : ''}
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
            case 'studio_search_cards':
                return this.renderSearchResults();
            case 'publish':
            case 'studio_publish_card':
                return this.renderPublishResult();
            case 'unpublish':
            case 'studio_unpublish_card':
                return this.renderUnpublishResult();
            case 'copy':
            case 'studio_copy_card':
                return this.renderCopyResult();
            case 'delete':
            case 'studio_delete_card':
                return this.renderDeleteResult();
            case 'update':
            case 'studio_update_card':
                return this.renderUpdateResult();
            case 'get':
            case 'studio_get_card':
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
