import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-bulk-publish-locales.css.js';
import { REGION_GROUPS, getLocaleByCode, getLanguageName, getCountryName } from '../locales.js';

function localeLabel(code) {
    const locale = getLocaleByCode(code);
    if (!locale) return code;
    return `${getLanguageName(locale.lang)} (${getCountryName(locale.country)})`;
}

function groupLocalesByRegion(locales) {
    const groups = [];
    for (const region of REGION_GROUPS) {
        const inRegion = locales.filter((locale) => region.countries.includes(locale.split('_').at(-1)));
        if (inRegion.length) groups.push({ name: region.name, locales: inRegion });
    }
    const grouped = new Set(groups.flatMap((group) => group.locales));
    const other = locales.filter((locale) => !grouped.has(locale));
    if (other.length) groups.push({ name: 'Other', locales: other });
    return groups;
}

class MasBulkPublishLocales extends LitElement {
    static styles = styles;
    static properties = {
        locales: { type: Array },
        disabled: { type: Boolean },
        collapsed: { state: true },
    };

    constructor() {
        super();
        this.locales = [];
        this.disabled = false;
        this.collapsed = false;
    }

    emitEdit() {
        this.dispatchEvent(new CustomEvent('edit-locales', { bubbles: true, composed: true }));
    }

    toggleCollapse() {
        this.collapsed = !this.collapsed;
    }

    render() {
        const n = this.locales.length;
        return html`
            <div class="header">
                <h3>Locales${n > 0 ? html`<span class="count"> (${n})</span>` : nothing}</h3>
                <div class="header-actions">
                    ${n > 0
                        ? html`<sp-action-button
                              size="s"
                              quiet
                              data-testid="edit-locales-btn"
                              ?disabled=${this.disabled}
                              @click=${this.emitEdit}
                          >
                              <sp-icon-edit slot="icon"></sp-icon-edit>
                              Edit
                          </sp-action-button>`
                        : nothing}
                    <sp-action-button
                        size="s"
                        quiet
                        class="collapse"
                        label=${this.collapsed ? 'Expand' : 'Collapse'}
                        @click=${this.toggleCollapse}
                    >
                        ${this.collapsed
                            ? html`<sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>`
                            : html`<sp-icon-chevron-up slot="icon"></sp-icon-chevron-up>`}
                    </sp-action-button>
                </div>
            </div>
            <p class="description">A selection here is only needed if the URLs above don't include locales already.</p>
            ${this.collapsed
                ? nothing
                : html`
                      ${n > 0
                          ? html`<div class="locales-summary" data-testid="summary">
                                ${groupLocalesByRegion(this.locales).map(
                                    (group) => html`
                                        <div class="region-row" data-testid="locale-row">
                                            <span class="region-label">${group.name}:</span>
                                            <span class="region-locales">${group.locales.map(localeLabel).join(', ')}</span>
                                        </div>
                                    `,
                                )}
                            </div>`
                          : html`<button
                                class="add-locales-zone"
                                data-testid="add-locales-zone"
                                ?disabled=${this.disabled}
                                @click=${this.emitEdit}
                            >
                                <span class="add-locales-icon">+</span>
                                <span class="add-locales-text">
                                    <strong>Add locales</strong>
                                    <span>Choose one or more locales for your bulk publish project.</span>
                                </span>
                            </button>`}
                  `}
        `;
    }
}

customElements.define('mas-bulk-publish-locales', MasBulkPublishLocales);
