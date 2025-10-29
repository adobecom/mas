import { LitElement, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

/**
 * Operation Result Display Component
 * Shows results from AEM operations executed by AI
 */
export class MasOperationResult extends LitElement {
    static properties = {
        result: { type: Object },
        operationType: { type: String },
        displayCount: { type: Number },
    };

    constructor() {
        super();
        this.displayCount = 5;
    }

    createRenderRoot() {
        return this;
    }

    cacheFragments(fragments) {
        const AemFragmentElement = customElements.get('aem-fragment');
        if (!AemFragmentElement || !fragments) return;

        fragments.forEach((card) => {
            if (card.fragmentData) {
                AemFragmentElement.cache.add(card.fragmentData);
            }
        });
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

        this.cacheFragments(results);

        const displayResults = results.slice(0, this.displayCount);
        const hasMore = results.length > displayResults.length;
        const remainingCount = results.length - displayResults.length;

        return html`
            <div class="operation-result search-result">
                <div class="result-header">
                    <sp-icon-magnify size="m"></sp-icon-magnify>
                    <span>${results.length} card${results.length !== 1 ? 's' : ''} found</span>
                </div>

                <div class="search-results-cards-grid">
                    ${repeat(
                        displayResults,
                        (fragment) => fragment.id,
                        (fragment) => {
                            const isCollection = fragment.tags?.some((t) => t.id.includes('card-type/collection'));

                            return isCollection
                                ? html`
                                      <merch-card-collection>
                                          <aem-fragment fragment="${fragment.id}"></aem-fragment>
                                      </merch-card-collection>
                                  `
                                : html`
                                      <merch-card>
                                          <aem-fragment fragment="${fragment.id}"></aem-fragment>
                                      </merch-card>
                                  `;
                        },
                    )}
                </div>

                ${hasMore
                    ? html`
                          <div class="search-results-actions">
                              <sp-button size="m" variant="secondary" @click=${() => this.handleShowMore(results.length)}>
                                  Show ${remainingCount} More Card${remainingCount !== 1 ? 's' : ''}
                              </sp-button>
                          </div>
                      `
                    : ''}
            </div>
        `;
    }

    handleShowMore(totalCount) {
        const increment = 5;
        this.displayCount = Math.min((this.displayCount || 5) + increment, totalCount);
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
