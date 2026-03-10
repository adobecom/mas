import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { openPreview, closePreview } from './mas-card-preview.js';
import { PATH_TOKENS } from './constants.js';
import { showToast } from './utils.js';

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
            const fragmentData = card.fragmentData || card;
            const normalizedData = this.normalizeFragmentData(fragmentData);
            AemFragmentElement.cache.add(normalizedData);
        });
    }

    normalizeFragmentData(fragmentData) {
        const { fields, ...rest } = fragmentData;

        if (Array.isArray(fields)) {
            return fragmentData;
        }

        const normalizedFields = Object.entries(fields || {}).map(([name, value]) => ({
            name,
            multiple: Array.isArray(value),
            values: Array.isArray(value) ? value : [value],
        }));

        return { ...rest, fields: normalizedFields };
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

                <sp-table size="m" class="chat-search-table">
                    <sp-table-head>
                        <sp-table-head-cell>Title</sp-table-head-cell>
                        <sp-table-head-cell>Variant</sp-table-head-cell>
                        <sp-table-head-cell>Status</sp-table-head-cell>
                        <sp-table-head-cell></sp-table-head-cell>
                    </sp-table-head>
                    <sp-table-body>
                        ${repeat(
                            displayResults,
                            (fragment) => fragment.id,
                            (fragment) => html`
                                <sp-table-row value="${fragment.id}" @click=${() => this.handleOpenCard(fragment)}>
                                    <sp-table-cell class="title-cell">${fragment.title}</sp-table-cell>
                                    <sp-table-cell>
                                        <sp-badge size="s">${this.extractVariant(fragment)}</sp-badge>
                                    </sp-table-cell>
                                    <sp-table-cell class="status-cell">${fragment.status}</sp-table-cell>
                                    <sp-table-cell class="action-cell">
                                        <sp-action-button
                                            quiet
                                            size="s"
                                            class="preview-action"
                                            @mouseenter=${() => this.handlePreview(fragment.id)}
                                            @mouseleave=${closePreview}
                                        >
                                            <sp-icon-magnify slot="icon"></sp-icon-magnify>
                                        </sp-action-button>
                                        <sp-icon-open-in size="s" class="open-action"></sp-icon-open-in>
                                    </sp-table-cell>
                                </sp-table-row>
                            `,
                        )}
                    </sp-table-body>
                </sp-table>

                ${hasMore
                    ? html`
                          <div class="search-results-actions">
                              <sp-button size="m" variant="secondary" @click=${() => this.handleShowMore(results.length)}>
                                  Show ${Math.min(5, remainingCount)} More (${remainingCount} remaining)
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
        const cards = this.result.cards || (this.result.fragment ? [this.result.fragment] : []);

        if (cards.length === 0) {
            return html`<p>No fragment data available.</p>`;
        }

        return html`${repeat(
            cards,
            (card) => card.id,
            (card) => this.renderCardDetail(card),
        )}`;
    }

    renderCardDetail(fragment) {
        const pathMatch = fragment.path?.match(PATH_TOKENS);
        const surface = pathMatch?.groups?.surface;
        const locale = pathMatch?.groups?.parsedLocale;
        const fields = this.getFieldValues(fragment);
        const truncatedPath = this.truncatePath(fragment.path);
        const variant = this.extractVariant(fragment);
        const status = fragment.status || 'draft';
        const statusVariant = status === 'Published' ? 'positive' : 'neutral';
        const variationCount = fragment.variationCount ?? 0;

        return html`
            <div class="operation-result get-result">
                <div class="card-header">
                    <h4>${fragment.title}</h4>
                    <div class="card-header-status">
                        <sp-badge size="s">${variant}</sp-badge>
                        <sp-badge size="s" variant="${statusVariant}">${status}</sp-badge>
                    </div>
                </div>

                <div class="card-tags">
                    ${surface ? html`<sp-badge size="s" variant="informative">${surface}</sp-badge>` : nothing}
                    ${locale ? html`<sp-badge size="s" variant="informative">${locale}</sp-badge>` : nothing}
                </div>

                <div class="card-metadata">
                    <div class="meta-item full-width">
                        <span class="meta-label">Path</span>
                        <span class="meta-value mono" title="${fragment.path}">${truncatedPath}</span>
                    </div>
                    <div class="meta-item full-width">
                        <span class="meta-label">Fragment ID</span>
                        <code
                            class="meta-value copyable"
                            tabindex="0"
                            role="button"
                            @click=${() => this.copyToClipboard(fragment.id)}
                            @keydown=${(e) => this.handleCopyKeydown(e, fragment.id)}
                            >${fragment.id}</code
                        >
                    </div>
                    ${fields.osi
                        ? html`<div class="meta-item full-width">
                              <span class="meta-label">OSI</span>
                              <code class="meta-value">${fields.osi}</code>
                          </div>`
                        : nothing}
                    <div class="meta-item">
                        <span class="meta-label">Modified</span>
                        <span class="meta-value">${this.formatRelativeTime(fragment.modified)}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Published</span>
                        <span class="meta-value"
                            >${fragment.published ? this.formatRelativeTime(fragment.published) : 'Never'}</span
                        >
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Variations</span>
                        <span class="meta-value"
                            >${variationCount > 0
                                ? `${variationCount} variation${variationCount !== 1 ? 's' : ''}`
                                : 'None'}</span
                        >
                    </div>
                </div>

                ${this.renderCardFields(fields)}

                <div class="card-detail-actions">
                    <sp-button size="s" variant="secondary" @click=${() => this.handleOpenCard(fragment)}>
                        Open in Editor
                    </sp-button>
                    <sp-button size="s" variant="secondary" @click=${() => this.copyToClipboard(fragment.id)}>
                        <sp-icon-copy slot="icon"></sp-icon-copy>
                        Copy ID
                    </sp-button>
                </div>
            </div>
        `;
    }

    getFieldValues(fragment) {
        const fields = fragment.fields;
        if (!fields) return {};
        if (Array.isArray(fields)) {
            const result = {};
            fields.forEach((f) => {
                result[f.name] = f.multiple ? f.values : f.values?.[0];
            });
            return result;
        }
        return fields;
    }

    renderCardFields(fields) {
        const displayFields = [];
        const fieldConfig = [
            { key: 'cardTitle', label: 'Card Title' },
            { key: 'title', label: 'Title' },
            { key: 'badge', label: 'Badge' },
            { key: 'mnemonicIcon', label: 'Mnemonics' },
            { key: 'description', label: 'Description', strip: true },
            { key: 'prices', label: 'Prices', strip: true },
            { key: 'ctas', label: 'CTAs', strip: true },
        ];

        for (const { key, label, strip } of fieldConfig) {
            const val = fields[key];
            if (!val || (typeof val === 'string' && !val.trim())) continue;
            if (key === 'title' && fields.cardTitle) continue;
            if (key === 'mnemonicIcon' && Array.isArray(val)) {
                const icons = val.filter(Boolean);
                if (icons.length > 0) {
                    displayFields.push({ label, value: `${icons.length} icon${icons.length !== 1 ? 's' : ''}` });
                }
                continue;
            }
            let display = typeof val === 'string' ? val : String(val);
            if (strip) display = display.replace(/<[^>]*>/g, '');
            if (display.length > 80) display = `${display.slice(0, 80)}…`;
            displayFields.push({ label, value: display });
        }

        if (displayFields.length === 0) return nothing;

        return html`
            <details class="card-fields-section">
                <summary>Card Fields</summary>
                <div class="card-fields-list">
                    ${displayFields.map(
                        ({ label, value }) => html`
                            <div class="offer-field">
                                <span class="field-label">${label}</span>
                                <span class="field-value">${value}</span>
                            </div>
                        `,
                    )}
                </div>
                ${fields.backgroundImage
                    ? html`<div class="field-thumbnail">
                          <span class="field-label">Background</span>
                          <img src="${fields.backgroundImage}" alt="Background" loading="lazy" />
                      </div>`
                    : nothing}
            </details>
        `;
    }

    truncatePath(path) {
        if (!path) return '';
        const segments = path.split('/');
        if (segments.length <= 4) return path;
        return `…/${segments.slice(-3).join('/')}`;
    }

    formatRelativeTime(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Unknown';
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHr / 24);

        if (diffSec < 60) return 'just now';
        if (diffMin < 60) return `${diffMin} min ago`;
        if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
        if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(
            () => showToast('Copied to clipboard', 'positive'),
            () => showToast('Failed to copy', 'negative'),
        );
    }

    handleCopyKeydown(e, text) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.copyToClipboard(text);
        }
    }

    extractVariant(fragment) {
        const variantTag = fragment.tags?.find((t) => t.id.includes('variant/'));
        if (variantTag) {
            return variantTag.id.split('/').pop();
        }
        const fields = fragment.fields;
        if (Array.isArray(fields)) {
            const variantField = fields.find((f) => f.name === 'variant');
            return variantField?.values?.[0] || 'unknown';
        }
        if (fields && typeof fields === 'object') {
            return fields.variant || 'unknown';
        }
        return 'unknown';
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

    handlePreview(fragmentId) {
        openPreview(fragmentId, { left: 'min(700px, 60%)' });
    }

    renderBulkUpdateResult() {
        const {
            successCount = 0,
            failureCount = 0,
            total = 0,
            failed = [],
            successful = [],
            skipped = [],
            message,
            updatedCards = [],
            previewLimit = 0,
        } = this.result;
        const skippedCount = skipped.length;
        const hasFailures = failureCount > 0;
        const hasSkipped = skippedCount > 0;

        // Clear cache for updated cards and re-cache with fresh data
        if (updatedCards.length > 0) {
            const AemFragmentElement = customElements.get('aem-fragment');
            if (AemFragmentElement?.cache) {
                updatedCards.forEach((card) => {
                    AemFragmentElement.cache.remove(card.id);
                });
            }
            this.cacheFragments(updatedCards);
        }

        if (hasFailures) {
            console.error('[Bulk Update] Operation completed with errors:', {
                total,
                successCount,
                failureCount,
                skippedCount,
                failed,
                timestamp: new Date().toISOString(),
            });
        }

        return html`
            <div class="operation-result bulk-update-result ${hasFailures ? 'has-errors' : 'success'}">
                <div class="result-header">
                    <div class="result-icon">
                        ${hasFailures
                            ? html`<sp-icon-alert size="l"></sp-icon-alert>`
                            : html`<sp-icon-check-circle size="l"></sp-icon-check-circle>`}
                    </div>
                    <div class="result-summary">
                        <h4>${message}</h4>
                        <p>
                            ${successCount > 0 ? html`<span class="success-count">✓ ${successCount} updated</span>` : ''}
                            ${hasSkipped ? html`<span class="skipped-count">⊘ ${skippedCount} skipped</span>` : ''}
                            ${hasFailures ? html`<span class="failure-count">✗ ${failureCount} failed</span>` : ''}
                        </p>
                    </div>
                </div>

                ${successCount > 0
                    ? html`
                          <details class="success-details" open>
                              <summary>${successCount} Updated Card${successCount !== 1 ? 's' : ''}</summary>
                              <div class="updated-cards-list">
                                  ${successful.map(
                                      ({ id, title, fieldsChanged = [] }) => html`
                                          <div class="updated-card-item">
                                              <sp-icon-check-circle size="s"></sp-icon-check-circle>
                                              <div class="updated-card-info">
                                                  <strong>${title || id}</strong>
                                                  ${fieldsChanged.length > 0
                                                      ? html`<span class="fields-changed"
                                                            >Fields updated: ${fieldsChanged.join(', ')}</span
                                                        >`
                                                      : ''}
                                              </div>
                                          </div>
                                      `,
                                  )}
                              </div>
                          </details>
                      `
                    : ''}
                ${hasSkipped
                    ? html`
                          <details class="skip-details">
                              <summary>${skippedCount} Skipped Card${skippedCount !== 1 ? 's' : ''}</summary>
                              <div class="skipped-cards-list">
                                  ${skipped.map(
                                      ({ id, title, reason }) => html`
                                          <div class="skipped-card-item">
                                              <sp-icon-info size="s"></sp-icon-info>
                                              <div class="skipped-card-info">
                                                  <strong>${title || id}</strong>
                                                  <span class="skip-reason">${reason || 'No changes needed'}</span>
                                              </div>
                                          </div>
                                      `,
                                  )}
                              </div>
                          </details>
                      `
                    : ''}
                ${hasFailures
                    ? html`
                          <details class="error-details">
                              <summary>${failureCount} Failed Card${failureCount !== 1 ? 's' : ''}</summary>
                              <div class="failed-cards-list">
                                  ${failed.map(
                                      ({ id, title, error }) => html`
                                          <div class="failed-card-item">
                                              <sp-icon-close-circle size="s"></sp-icon-close-circle>
                                              <div class="failed-card-info">
                                                  <strong>${title || id}</strong>
                                                  <span class="error-message">${error}</span>
                                              </div>
                                          </div>
                                      `,
                                  )}
                              </div>
                              <sp-button size="s" variant="secondary" @click=${() => this.copyErrorsToClipboard(failed)}>
                                  Copy Error Log
                              </sp-button>
                          </details>
                      `
                    : ''}
                ${successCount > 0 && updatedCards.length > 0
                    ? html`
                          <div class="updated-cards-preview">
                              <h5>
                                  Updated Cards Preview
                                  ${previewLimit && successCount > previewLimit
                                      ? html`(showing ${updatedCards.length} of ${successCount})`
                                      : html`(${updatedCards.length} card${updatedCards.length !== 1 ? 's' : ''})`}
                              </h5>
                              <div class="search-results-cards-grid">
                                  ${updatedCards.map((fragment) => {
                                      const isCollection = fragment.tags?.some((t) => t.id.includes('card-type/collection'));
                                      return html`
                                          <div class="card-wrapper ${isCollection ? 'collection-item' : ''}">
                                              ${isCollection
                                                  ? html`<merch-card-collection>
                                                        <aem-fragment fragment="${fragment.id}"></aem-fragment>
                                                    </merch-card-collection>`
                                                  : html`<merch-card>
                                                        <aem-fragment fragment="${fragment.id}"></aem-fragment>
                                                    </merch-card>`}
                                          </div>
                                      `;
                                  })}
                              </div>
                              ${previewLimit && successCount > previewLimit
                                  ? html`<p class="preview-note">+ ${successCount - previewLimit} more cards updated</p>`
                                  : ''}
                          </div>
                      `
                    : ''}
            </div>
        `;
    }

    renderBulkPublishResult() {
        const { successCount = 0, failureCount = 0, total = 0, failed = [], message } = this.result;
        const hasFailures = failureCount > 0;

        if (hasFailures) {
            console.error('[Bulk Publish] Operation completed with errors:', {
                total,
                successCount,
                failureCount,
                failed,
                timestamp: new Date().toISOString(),
            });
        }

        return html`
            <div class="operation-result bulk-publish-result ${hasFailures ? 'has-errors' : 'success'}">
                <div class="result-header">
                    <div class="result-icon">
                        ${hasFailures
                            ? html`<sp-icon-alert size="l"></sp-icon-alert>`
                            : html`<sp-icon-check-circle size="l"></sp-icon-check-circle>`}
                    </div>
                    <div class="result-summary">
                        <h4>${message}</h4>
                        <p>
                            ${successCount > 0 ? html`<span class="success-count">✓ ${successCount} published</span>` : ''}
                            ${hasFailures ? html`<span class="failure-count">✗ ${failureCount} failed</span>` : ''}
                        </p>
                    </div>
                </div>

                ${hasFailures
                    ? html`
                          <details class="error-details">
                              <summary>${failureCount} Failed Card${failureCount !== 1 ? 's' : ''}</summary>
                              <div class="failed-cards-list">
                                  ${failed.map(
                                      ({ id, error }) => html`
                                          <div class="failed-card-item">
                                              <sp-icon-close-circle size="s"></sp-icon-close-circle>
                                              <div class="failed-card-info">
                                                  <strong>${id}</strong>
                                                  <span class="error-message">${error}</span>
                                              </div>
                                          </div>
                                      `,
                                  )}
                              </div>
                              <sp-button size="s" variant="secondary" @click=${() => this.copyErrorsToClipboard(failed)}>
                                  Copy Error Log
                              </sp-button>
                          </details>
                      `
                    : ''}
            </div>
        `;
    }

    renderBulkDeleteResult() {
        const { successCount = 0, failureCount = 0, total = 0, failed = [], message } = this.result;
        const hasFailures = failureCount > 0;

        if (hasFailures) {
            console.error('[Bulk Delete] Operation completed with errors:', {
                total,
                successCount,
                failureCount,
                failed,
                timestamp: new Date().toISOString(),
            });
        }

        return html`
            <div class="operation-result bulk-delete-result ${hasFailures ? 'has-errors' : 'success'}">
                <div class="result-header">
                    <div class="result-icon">
                        ${hasFailures
                            ? html`<sp-icon-alert size="l"></sp-icon-alert>`
                            : html`<sp-icon-check-circle size="l"></sp-icon-check-circle>`}
                    </div>
                    <div class="result-summary">
                        <h4>${message}</h4>
                        <p>
                            ${successCount > 0 ? html`<span class="success-count">✓ ${successCount} deleted</span>` : ''}
                            ${hasFailures ? html`<span class="failure-count">✗ ${failureCount} failed</span>` : ''}
                        </p>
                    </div>
                </div>

                ${hasFailures
                    ? html`
                          <details class="error-details">
                              <summary>${failureCount} Failed Card${failureCount !== 1 ? 's' : ''}</summary>
                              <div class="failed-cards-list">
                                  ${failed.map(
                                      ({ id, error }) => html`
                                          <div class="failed-card-item">
                                              <sp-icon-close-circle size="s"></sp-icon-close-circle>
                                              <div class="failed-card-info">
                                                  <strong>${id}</strong>
                                                  <span class="error-message">${error}</span>
                                              </div>
                                          </div>
                                      `,
                                  )}
                              </div>
                              <sp-button size="s" variant="secondary" @click=${() => this.copyErrorsToClipboard(failed)}>
                                  Copy Error Log
                              </sp-button>
                          </details>
                      `
                    : ''}
            </div>
        `;
    }

    copyErrorsToClipboard(failed) {
        const errorLog = failed.map(({ id, error }) => `${id}: ${error}`).join('\n');

        navigator.clipboard.writeText(errorLog).then(
            () => {
                console.log('[Error Log] Copied to clipboard:', errorLog);
            },
            (err) => {
                console.error('[Error Log] Failed to copy:', err);
            },
        );
    }

    extractLocale(variation) {
        const pathMatch = variation.path?.match(/\/content\/dam\/mas\/[^/]+\/([^/]+)\//);
        return pathMatch?.[1] || 'unknown';
    }

    renderOfferSelectorResult() {
        const { offerSelectorId, offers = [], checkoutUrl } = this.result;

        if (!offers.length) {
            return html`
                <div class="operation-result offer-selector-result empty">
                    <sp-icon-info size="l"></sp-icon-info>
                    <p>No offers found for this offer selector.</p>
                </div>
            `;
        }

        const primaryOffer = offers[0];
        const { offerId, productArrangementCode, commitment, term, planType, priceDetails = {} } = primaryOffer;
        const customerSegment = primaryOffer.customer_segment || primaryOffer.customerSegment;
        const marketSegment = primaryOffer.market_segment || primaryOffer.marketSegment;

        const price = priceDetails.price;
        const annualizedPrice = priceDetails.annualized?.annualizedPrice;
        const currency = priceDetails.currency || 'USD';
        const hasMultipleOffers = offers.length > 1;

        return html`
            <div class="operation-result offer-selector-result">
                <div class="result-header">
                    <sp-icon-shopping-cart size="m"></sp-icon-shopping-cart>
                    <span>Offer Details</span>
                    ${hasMultipleOffers
                        ? html`<sp-badge size="s" variant="informative">1 of ${offers.length} offers</sp-badge>`
                        : nothing}
                </div>

                <div class="offer-details">
                    <div class="offer-info-grid">
                        <div class="offer-field">
                            <span class="field-label">Product</span>
                            <span class="field-value">${productArrangementCode || 'N/A'}</span>
                        </div>
                        ${price !== undefined
                            ? html`
                                  <div class="offer-field">
                                      <span class="field-label">Price</span>
                                      <span class="field-value price"
                                          >${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
                                              price,
                                          )}/${term === 'MONTHLY' ? 'mo' : 'yr'}</span
                                      >
                                  </div>
                              `
                            : nothing}
                        ${annualizedPrice !== undefined
                            ? html`
                                  <div class="offer-field">
                                      <span class="field-label">Annual Total</span>
                                      <span class="field-value"
                                          >${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
                                              annualizedPrice,
                                          )}/yr</span
                                      >
                                  </div>
                              `
                            : nothing}
                        <div class="offer-field">
                            <span class="field-label">Commitment</span>
                            <span class="field-value">${commitment || 'N/A'}</span>
                        </div>
                        <div class="offer-field">
                            <span class="field-label">Term</span>
                            <span class="field-value">${term || 'N/A'}</span>
                        </div>
                        <div class="offer-field">
                            <span class="field-label">Plan Type</span>
                            <sp-badge size="s">${planType || 'N/A'}</sp-badge>
                        </div>
                        ${customerSegment
                            ? html`<div class="offer-field">
                                  <span class="field-label">Customer</span>
                                  <sp-badge size="s" variant="informative">${customerSegment}</sp-badge>
                              </div>`
                            : nothing}
                        ${marketSegment
                            ? html`<div class="offer-field">
                                  <span class="field-label">Market</span>
                                  <sp-badge size="s" variant="informative">${marketSegment}</sp-badge>
                              </div>`
                            : nothing}
                    </div>

                    <details class="offer-ids">
                        <summary>Technical Details</summary>
                        <div class="offer-field">
                            <span class="field-label">Offer Selector ID</span>
                            <code
                                class="field-value copyable"
                                tabindex="0"
                                role="button"
                                @click=${() => this.copyToClipboard(offerSelectorId)}
                                @keydown=${(e) => this.handleCopyKeydown(e, offerSelectorId)}
                                >${offerSelectorId}</code
                            >
                        </div>
                        <div class="offer-field">
                            <span class="field-label">Offer ID</span>
                            <code
                                class="field-value copyable"
                                tabindex="0"
                                role="button"
                                @click=${() => this.copyToClipboard(offerId)}
                                @keydown=${(e) => this.handleCopyKeydown(e, offerId)}
                                >${offerId}</code
                            >
                        </div>
                    </details>

                    ${hasMultipleOffers ? this.renderAdditionalOffers(offers, currency) : nothing}

                    <div class="offer-actions">
                        ${checkoutUrl
                            ? html`
                                  <sp-button size="s" variant="secondary" @click=${() => window.open(checkoutUrl, '_blank')}>
                                      <sp-icon-link-out slot="icon"></sp-icon-link-out>
                                      Open Checkout
                                  </sp-button>
                              `
                            : nothing}
                        <sp-button size="s" variant="secondary" @click=${() => this.copyToClipboard(offerSelectorId)}>
                            <sp-icon-copy slot="icon"></sp-icon-copy>
                            Copy OSI
                        </sp-button>
                    </div>
                </div>
            </div>
        `;
    }

    renderAdditionalOffers(offers, currency) {
        const additional = offers.slice(1);
        return html`
            <details class="additional-offers">
                <summary>${additional.length} Additional Offer${additional.length !== 1 ? 's' : ''}</summary>
                <sp-table size="s" class="chat-search-table">
                    <sp-table-head>
                        <sp-table-head-cell>Offer ID</sp-table-head-cell>
                        <sp-table-head-cell>Price</sp-table-head-cell>
                        <sp-table-head-cell>Commitment</sp-table-head-cell>
                    </sp-table-head>
                    <sp-table-body>
                        ${additional.map((offer) => {
                            const offerPrice = offer.priceDetails?.price;
                            const offerCurrency = offer.priceDetails?.currency || currency;
                            return html`
                                <sp-table-row>
                                    <sp-table-cell>
                                        <code
                                            class="copyable"
                                            tabindex="0"
                                            role="button"
                                            @click=${() => this.copyToClipboard(offer.offerId)}
                                            @keydown=${(e) => this.handleCopyKeydown(e, offer.offerId)}
                                            >${offer.offerId?.slice(0, 12)}…</code
                                        >
                                    </sp-table-cell>
                                    <sp-table-cell>
                                        ${offerPrice !== undefined
                                            ? new Intl.NumberFormat('en-US', {
                                                  style: 'currency',
                                                  currency: offerCurrency,
                                              }).format(offerPrice)
                                            : 'N/A'}
                                    </sp-table-cell>
                                    <sp-table-cell>${offer.commitment || 'N/A'}</sp-table-cell>
                                </sp-table-row>
                            `;
                        })}
                    </sp-table-body>
                </sp-table>
            </details>
        `;
    }

    renderVariationsResult() {
        const { parent, variations = [], count = 0, isVariation, message, fragment } = this.result;

        if (isVariation) {
            return html`
                <div class="operation-result variations-result">
                    <div class="result-header">
                        <sp-icon-translate size="m"></sp-icon-translate>
                        <span>${message || 'This is a variation'}</span>
                    </div>
                    ${fragment ? html` <p>Current card: <strong>${fragment.title}</strong></p> ` : ''}
                </div>
            `;
        }

        if (count === 0) {
            return html`
                <div class="operation-result variations-result empty">
                    <sp-icon-translate size="l"></sp-icon-translate>
                    <p>${message || 'No variations found for this card.'}</p>
                </div>
            `;
        }

        return html`
            <div class="operation-result variations-result">
                <div class="result-header">
                    <sp-icon-translate size="m"></sp-icon-translate>
                    <span>${count} variation${count !== 1 ? 's' : ''} found</span>
                </div>

                ${parent ? html` <p class="parent-info">Parent: <strong>${parent.title}</strong></p> ` : ''}

                <sp-table size="m" class="chat-search-table">
                    <sp-table-head>
                        <sp-table-head-cell>Title</sp-table-head-cell>
                        <sp-table-head-cell>Locale</sp-table-head-cell>
                        <sp-table-head-cell>Status</sp-table-head-cell>
                        <sp-table-head-cell></sp-table-head-cell>
                    </sp-table-head>
                    <sp-table-body>
                        ${repeat(
                            variations,
                            (v) => v.id,
                            (v) => html`
                                <sp-table-row value="${v.id}" @click=${() => this.handleOpenCard(v)}>
                                    <sp-table-cell class="title-cell">${v.title}</sp-table-cell>
                                    <sp-table-cell>
                                        <sp-badge size="s">${this.extractLocale(v)}</sp-badge>
                                    </sp-table-cell>
                                    <sp-table-cell class="status-cell">${v.status}</sp-table-cell>
                                    <sp-table-cell class="action-cell">
                                        <sp-action-button
                                            quiet
                                            size="s"
                                            class="preview-action"
                                            @mouseenter=${() => this.handlePreview(v.id)}
                                            @mouseleave=${closePreview}
                                        >
                                            <sp-icon-magnify slot="icon"></sp-icon-magnify>
                                        </sp-action-button>
                                        <sp-icon-open-in size="s" class="open-action"></sp-icon-open-in>
                                    </sp-table-cell>
                                </sp-table-row>
                            `,
                        )}
                    </sp-table-body>
                </sp-table>
            </div>
        `;
    }

    render() {
        if (!this.result) {
            return html`<p>No result data.</p>`;
        }

        switch (this.operationType) {
            case 'search':
            case 'search_cards':
                return this.renderSearchResults();
            case 'publish':
            case 'publish_card':
                return this.renderPublishResult();
            case 'unpublish':
            case 'unpublish_card':
                return this.renderUnpublishResult();
            case 'copy':
            case 'copy_card':
                return this.renderCopyResult();
            case 'delete':
            case 'delete_card':
                return this.renderDeleteResult();
            case 'update':
            case 'update_card':
                return this.renderUpdateResult();
            case 'get':
            case 'get_card':
                return this.renderGetResult();
            case 'bulk_update':
            case 'bulk_update_cards':
                return this.renderBulkUpdateResult();
            case 'bulk_publish':
            case 'bulk_publish_cards':
                return this.renderBulkPublishResult();
            case 'bulk_delete':
            case 'bulk_delete_cards':
                return this.renderBulkDeleteResult();
            case 'get_fragment_variations':
                return this.renderVariationsResult();
            case 'resolve_offer_selector':
                return this.renderOfferSelectorResult();
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
