import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-placeholder-references-modal.css.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, DICTIONARY_MODEL_PATH, PAGE_NAMES } from '../constants.js';
import { extractLocaleFromPath, extractSurfaceFromPath } from '../utils.js';
import { getDefaultLocaleCode } from '../../../io/www/src/fragment/locales.js';

function referenceTypeLabel(reference) {
    switch (reference?.model?.path) {
        case CARD_MODEL_PATH:
            return 'Card';
        case COLLECTION_MODEL_PATH:
            return 'Collection';
        case DICTIONARY_MODEL_PATH:
            return 'Placeholder';
        default:
            return 'Fragment';
    }
}

/** Mirrors the deep-link convention used by mas-promotions-items-table.js's #getSearchUrl. */
function buildReferenceHref(reference, key) {
    if (!reference?.path) return '';
    const surface = extractSurfaceFromPath(reference.path);
    const locale = extractLocaleFromPath(reference.path);
    const catalogLocale = (surface && getDefaultLocaleCode(surface, locale)) || locale;
    const isPlaceholder = reference.model?.path === DICTIONARY_MODEL_PATH;
    const params = new URLSearchParams({ page: isPlaceholder ? PAGE_NAMES.PLACEHOLDERS : PAGE_NAMES.CONTENT });
    if (isPlaceholder) {
        params.set('search', key);
    } else if (reference.id) {
        params.set('query', reference.id);
    }
    if (surface) params.set('path', surface);
    if (catalogLocale) params.set('locale', catalogLocale);
    if (locale && locale !== catalogLocale) params.set('region', locale);
    return `${window.location.pathname}${window.location.search}#${params.toString()}`;
}

class MasPlaceholderReferencesModal extends LitElement {
    static styles = styles;

    static properties = {
        open: { type: Boolean },
        mode: { type: String },
        placeholderKey: { type: String },
        references: { type: Array },
        allowProceed: { type: Boolean },
    };

    constructor() {
        super();
        this.open = false;
        this.mode = 'remove';
        this.placeholderKey = '';
        this.references = [];
        this.allowProceed = false;
    }

    #handleCancel = () => {
        this.dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }));
    };

    #handleProceed = () => {
        this.dispatchEvent(new CustomEvent('proceed', { bubbles: true, composed: true }));
    };

    render() {
        if (!this.open) return nothing;
        const hasReferences = this.references.length > 0;
        const showProceed = !hasReferences || (this.mode === 'publish' && this.allowProceed);
        const headline = hasReferences ? `"${this.placeholderKey}" is referenced` : 'No usage detected';

        return html`
            <sp-dialog-wrapper open mode="modal" underlay .headline=${headline} @close=${this.#handleCancel}>
                <div class="dialog-content">
                    ${hasReferences
                        ? html`
                              <p>
                                  The following items reference the placeholder
                                  <strong>${this.placeholderKey}</strong>:
                              </p>
                              <ul class="reference-list">
                                  ${this.references.map(
                                      (reference) => html`
                                          <li>
                                              <span class="reference-type">${referenceTypeLabel(reference)}</span>
                                              <a
                                                  href=${buildReferenceHref(reference, this.placeholderKey)}
                                                  target="_blank"
                                                  rel="noopener"
                                              >
                                                  ${reference.title || reference.path}
                                              </a>
                                          </li>
                                      `,
                                  )}
                              </ul>
                              ${this.mode === 'publish' && !this.allowProceed
                                  ? html`<p class="reference-warning">
                                        The reference check took too long to confirm it is safe to proceed with publishing, so
                                        this action is blocked.
                                    </p>`
                                  : nothing}
                          `
                        : html`<p>No usage detected for the placeholder <strong>${this.placeholderKey}</strong>.</p>`}
                    <div class="dialog-footer">
                        <sp-button variant="secondary" treatment="outline" @click=${this.#handleCancel}>Cancel</sp-button>
                        ${showProceed
                            ? html`<sp-button variant="accent" @click=${this.#handleProceed}>Proceed</sp-button>`
                            : nothing}
                    </div>
                </div>
            </sp-dialog-wrapper>
        `;
    }
}

customElements.define('mas-placeholder-references-modal', MasPlaceholderReferencesModal);
