import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-promo-variation-geos.css.js';

class MasPromoVariationGeos extends LitElement {
    static styles = styles;

    static properties = {
        geos: { type: Array },
        disabledGeos: { type: Array },
        hasEmptyGeosVariation: { type: Boolean },
        value: { type: Array },
        compact: { type: Boolean, reflect: true },
        searchQuery: { type: String, state: true },
    };

    constructor() {
        super();
        this.geos = [];
        this.disabledGeos = [];
        this.hasEmptyGeosVariation = false;
        this.value = [];
        this.compact = false;
        this.searchQuery = '';
    }

    get selectableGeos() {
        return this.geos.filter((geo) => !this.disabledGeos.includes(geo));
    }

    get filteredGeos() {
        if (!this.searchQuery) return this.geos;
        const query = this.searchQuery.toLowerCase();
        return this.geos.filter((geo) => geo.toLowerCase().includes(query));
    }

    get selectAllChecked() {
        return this.selectableGeos.length > 0 && this.value.length === this.selectableGeos.length;
    }

    get selectAllIndeterminate() {
        return this.value.length > 0 && this.value.length < this.selectableGeos.length;
    }

    get numberOfGeos() {
        const count = this.value.length;
        if (count) return `${count} ${count === 1 ? 'geo' : 'geos'} selected`;
        return `${this.geos.length} ${this.geos.length === 1 ? 'geo' : 'geos'}`;
    }

    get showInheritHint() {
        return this.value.length === 0;
    }

    emitChange(value) {
        this.value = value;
        this.dispatchEvent(new CustomEvent('change', { detail: { value } }));
    }

    displayLabel(geo) {
        return geo.split('/').pop() || geo;
    }

    handleSearch(e) {
        this.searchQuery = e.target.value;
    }

    selectAll(e) {
        e.stopPropagation();
        this.emitChange(e.target.checked ? [...this.selectableGeos] : []);
    }

    toggleGeo(e) {
        e.stopPropagation();
        const geo = e.target.getAttribute('value');
        if (e.target.checked) {
            this.emitChange([...this.value, geo]);
        } else {
            this.emitChange(this.value.filter((selected) => selected !== geo));
        }
    }

    render() {
        const { filteredGeos } = this;
        return html`
            <div class="select-geos-content">
                <div class="sticky-header">
                    <sp-search
                        placeholder="Search geo"
                        .value=${this.searchQuery}
                        @input=${this.handleSearch}
                        @change=${this.handleSearch}
                    ></sp-search>
                    ${this.compact
                        ? nothing
                        : html`
                              <div class="select-all-row">
                                  <sp-checkbox
                                      ?checked=${this.selectAllChecked}
                                      ?indeterminate=${this.selectAllIndeterminate}
                                      ?disabled=${this.selectableGeos.length === 0}
                                      @change=${this.selectAll}
                                  >
                                      Select all
                                  </sp-checkbox>
                                  <span class="geo-count">${this.numberOfGeos}</span>
                              </div>
                              ${this.showInheritHint
                                  ? html`<p class="inherit-hint ${this.hasEmptyGeosVariation ? 'blocked' : ''}">
                                        ${this.hasEmptyGeosVariation
                                            ? 'A variation with no geos already exists for this project. Select one or more geos to continue.'
                                            : 'No geos selected — this variation will apply to all geos, including any added later.'}
                                    </p>`
                                  : nothing}
                              <sp-divider size="s"></sp-divider>
                          `}
                </div>
                <div class="geo-grid">
                    ${filteredGeos.map(
                        (geo) => html`
                            <sp-checkbox
                                value=${geo}
                                ?checked=${this.value.includes(geo)}
                                ?disabled=${this.disabledGeos.includes(geo)}
                                @change=${this.toggleGeo}
                            >
                                ${this.displayLabel(geo)}
                            </sp-checkbox>
                        `,
                    )}
                    ${filteredGeos.length === 0 ? html`<p class="no-results">No geos match your search.</p>` : nothing}
                </div>
            </div>
        `;
    }
}

customElements.define('mas-promo-variation-geos', MasPromoVariationGeos);
