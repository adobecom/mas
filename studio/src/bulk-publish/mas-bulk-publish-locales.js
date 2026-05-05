import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-bulk-publish-locales.css.js';

const REGION_GROUPS = [
    { name: 'LATAM/Americas', countries: ['US', 'CA', 'MX', 'AR', 'BR', 'CL', 'CO', 'CR', 'GT', 'PE', 'PR', 'EC', 'LA'] },
    { name: 'JAPAC', countries: ['AU', 'NZ', 'JP', 'KR', 'CN', 'TW', 'HK', 'SG', 'IN', 'ID', 'MY', 'PH', 'TH', 'VN'] },
    {
        name: 'EMEA',
        countries: [
            'GB',
            'DE',
            'FR',
            'IT',
            'ES',
            'NL',
            'BE',
            'CH',
            'AT',
            'LU',
            'PT',
            'PL',
            'CZ',
            'SK',
            'HU',
            'RO',
            'BG',
            'EE',
            'LV',
            'LT',
            'FI',
            'DK',
            'SE',
            'NO',
            'GR',
            'TR',
            'RU',
            'UA',
            'SI',
            'SA',
            'AE',
            'EG',
            'KW',
            'QA',
            'IL',
            'NG',
            'ZA',
            'IE',
            'HR',
        ],
    },
];

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
                <h3>Locales<span class="count"> (${n})</span></h3>
                <div class="header-actions">
                    <sp-action-button
                        size="s"
                        quiet
                        data-testid="edit-locales-btn"
                        ?disabled=${this.disabled}
                        @click=${this.emitEdit}
                    >
                        <sp-icon-edit slot="icon"></sp-icon-edit>
                        Edit
                    </sp-action-button>
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
            ${this.collapsed
                ? nothing
                : html`
                      ${n > 0
                          ? html`<div class="locales-summary" data-testid="summary">
                                ${groupLocalesByRegion(this.locales).map(
                                    (group) => html`
                                        <div class="region-row" data-testid="locale-row">
                                            <span class="region-label">${group.name}:</span>
                                            <span class="region-locales">${group.locales.join(', ')}</span>
                                        </div>
                                    `,
                                )}
                            </div>`
                          : html`<p class="empty" data-testid="no-locales">No locales selected</p>`}
                  `}
        `;
    }
}

customElements.define('mas-bulk-publish-locales', MasBulkPublishLocales);
