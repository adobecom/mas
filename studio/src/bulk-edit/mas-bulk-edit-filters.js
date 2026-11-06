import { LitElement, css, html, nothing } from 'lit';
import { FRAGMENT_STATUS_OPTIONS } from '../constants.js';
import { getSurfaceLocales, getLocaleCode, getCountryName, getLanguageName, groupByRegion } from '../locales.js';
import { getNamespaceCache } from '../aem/tag-cache.js';
import { toAttribute } from '../aem/tag-path-utils.js';
import '../aem/aem-tag-picker-field.js';

const TAG_NAMESPACE = '/content/cq:tags/mas';
const TAG_FILTERS = [
    { type: 'market_segments', label: 'Market Segment' },
    { type: 'customer_segment', label: 'Customer Segment' },
    { type: 'product_code', label: 'Product' },
];

class MasBulkEditFilters extends LitElement {
    static properties = {
        surface: { type: String },
        value: { attribute: false },
        localeSearch: { state: true },
        collapsedRegions: { state: true },
    };

    static styles = css`
        :host {
            display: flex;
            flex-wrap: wrap;
            align-items: flex-start;
            gap: 8px;
            margin-top: 12px;
        }

        aem-tag-picker-field,
        sp-action-button[slot='trigger'] {
            --mod-actionbutton-background-color-default: var(--spectrum-gray-25, #fff);
            --mod-actionbutton-border-color-default: var(--spectrum-gray-300, #dadada);
            --mod-actionbutton-border-width: 1px;
            --mod-actionbutton-border-radius: 8px;
        }

        sp-action-button[slot='trigger'] {
            flex-direction: row-reverse;
        }

        sp-popover {
            min-width: 248px;
            padding: 8px;
            border-radius: 10px;
        }

        sp-search {
            width: 100%;
            margin-bottom: 8px;
        }

        .checkbox-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
            max-height: min(360px, 50vh);
            overflow-y: auto;
        }

        .checkbox-list sp-checkbox {
            min-height: 32px;
        }

        .locale-group-heading {
            display: flex;
            align-items: center;
        }

        .locale-group-heading sp-action-button {
            flex-shrink: 0;
        }

        .locale-options {
            display: flex;
            flex-direction: column;
            padding-left: 32px;
        }

        sp-divider {
            margin-block: 4px;
        }
    `;

    constructor() {
        super();
        this.surface = 'acom';
        this.value = { tagPaths: {}, tags: [], statuses: [], locales: null };
        this.localeSearch = '';
        this.collapsedRegions = new Set();
        this.localeOptions = [];
        this.localeGroups = [];
        this.selectedLocaleSet = new Set();
        this.visibleLocaleCodes = [];
        this.allVisibleSelected = false;
        this.someVisibleSelected = false;
    }

    willUpdate(changed) {
        if (changed.has('surface')) {
            this.localeOptions = getSurfaceLocales(this.surface).map((locale) => ({
                code: getLocaleCode(locale),
                country: locale.country,
                label: `${locale.country} (${locale.lang.toUpperCase()})`,
                search: `${getLocaleCode(locale)} ${getCountryName(locale.country)} ${getLanguageName(locale.lang)}`.toLowerCase(),
            }));
        }
        this.selectedLocaleSet = new Set(this.value.locales ?? this.localeOptions.map(({ code }) => code));
        const query = this.localeSearch.trim().toLowerCase();
        const visible = this.localeOptions.filter((option) => option.search.includes(query));
        this.visibleLocaleCodes = visible.map(({ code }) => code);
        const count = this.visibleLocaleCodes.filter((code) => this.selectedLocaleSet.has(code)).length;
        this.allVisibleSelected = count > 0 && count === visible.length;
        this.someVisibleSelected = count > 0 && count < visible.length;
        this.localeGroups = groupByRegion(visible, ({ country }) => country).map((group) => {
            const selectedCount = group.items.filter(({ code }) => this.selectedLocaleSet.has(code)).length;
            return {
                ...group,
                checked: selectedCount === group.items.length,
                indeterminate: selectedCount > 0 && selectedCount < group.items.length,
                expanded: !!query || !this.collapsedRegions.has(group.name),
            };
        });
    }

    updateFilters(value) {
        this.value = value;
        this.dispatchEvent(new CustomEvent('filters-change', { detail: value, bubbles: true, composed: true }));
    }

    handleTagsChange(event) {
        const picker = event.currentTarget;
        const tagPaths = { ...this.value.tagPaths, [picker.top]: [...picker.value] };
        const paths = new Set(Object.values(tagPaths).flat());
        for (const product of tagPaths.product_code ?? []) {
            for (const { path } of getNamespaceCache(TAG_NAMESPACE).values()) {
                if (path.startsWith(`${product}/`)) paths.add(path);
            }
        }
        this.updateFilters({ ...this.value, tagPaths, tags: [...paths].map((path) => toAttribute(path)) });
    }

    handleStatusChange(event, status) {
        const selected = new Set(this.value.statuses);
        if (event.target.checked) selected.add(status);
        else selected.delete(status);
        this.updateFilters({ ...this.value, statuses: [...selected] });
    }

    toggleLocales(codes, checked) {
        const selected = new Set(this.value.locales ?? this.localeOptions.map(({ code }) => code));
        for (const code of codes) {
            if (checked) selected.add(code);
            else selected.delete(code);
        }
        const locales = selected.size === this.localeOptions.length ? null : [...selected];
        this.updateFilters({ ...this.value, locales });
    }

    toggleRegion(name) {
        const collapsed = new Set(this.collapsedRegions);
        if (collapsed.has(name)) collapsed.delete(name);
        else collapsed.add(name);
        this.collapsedRegions = collapsed;
    }

    renderTagFilter({ type, label }) {
        const selected = this.value.tagPaths[type] ?? [];
        return html`<aem-tag-picker-field
            namespace=${TAG_NAMESPACE}
            top=${type}
            label=${label}
            multiple
            selection="checkbox"
            .value=${selected}
            .quiet=${false}
            @change=${this.handleTagsChange}
        ></aem-tag-picker-field>`;
    }

    renderLocaleGroup(group) {
        return html`<div class="locale-group">
            <div class="locale-group-heading">
                <sp-action-button
                    quiet
                    label="Toggle ${group.name}"
                    aria-expanded=${group.expanded}
                    @click=${() => this.toggleRegion(group.name)}
                >
                    ${group.expanded
                        ? html`<sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>`
                        : html`<sp-icon-chevron-right slot="icon"></sp-icon-chevron-right>`}
                </sp-action-button>
                <sp-checkbox
                    .checked=${group.checked}
                    .indeterminate=${group.indeterminate}
                    @change=${(event) =>
                        this.toggleLocales(
                            group.items.map(({ code }) => code),
                            event.target.checked,
                        )}
                    >${group.name}</sp-checkbox
                >
            </div>
            ${group.expanded
                ? html`<div class="locale-options">
                      ${group.items.map(
                          ({ code, label }) =>
                              html`<sp-checkbox
                                  value=${code}
                                  .checked=${this.selectedLocaleSet.has(code)}
                                  @change=${(event) => this.toggleLocales([code], event.target.checked)}
                                  >${label}</sp-checkbox
                              >`,
                      )}
                  </div>`
                : nothing}
        </div>`;
    }

    get statusPicker() {
        return html`<overlay-trigger placement="bottom-start">
            <sp-action-button slot="trigger" label="Status">
                Status${this.value.statuses.length ? ` (${this.value.statuses.length})` : ''}
                <sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>
            </sp-action-button>
            <sp-popover slot="click-content">
                <sp-field-group vertical aria-label="Status">
                    ${FRAGMENT_STATUS_OPTIONS.map(
                        ({ id, title }) =>
                            html`<sp-checkbox
                                value=${id}
                                .checked=${this.value.statuses.includes(id)}
                                @change=${(event) => this.handleStatusChange(event, id)}
                                >${title}</sp-checkbox
                            >`,
                    )}
                </sp-field-group>
            </sp-popover>
        </overlay-trigger>`;
    }

    get localePicker() {
        return html`<overlay-trigger placement="bottom-start" @sp-closed=${() => (this.localeSearch = '')}>
            <sp-action-button slot="trigger" label="Locale">
                Locale${this.value.locales === null ? '' : ` (${this.value.locales.length})`}
                <sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>
            </sp-action-button>
            <sp-popover slot="click-content">
                <sp-search
                    label="Search locale"
                    placeholder="Search locale"
                    .value=${this.localeSearch}
                    @input=${(event) => (this.localeSearch = event.target.value)}
                    @change=${(event) => (this.localeSearch = event.target.value)}
                    @submit=${(event) => event.preventDefault()}
                ></sp-search>
                <sp-help-text>Filters expanded variations only.</sp-help-text>
                <div class="checkbox-list">
                    <sp-checkbox
                        value="all"
                        .checked=${this.allVisibleSelected}
                        .indeterminate=${this.someVisibleSelected}
                        ?disabled=${!this.visibleLocaleCodes.length}
                        @change=${(event) => this.toggleLocales(this.visibleLocaleCodes, event.target.checked)}
                        >Select all</sp-checkbox
                    >
                    <sp-divider size="s"></sp-divider>
                    ${this.localeGroups.length
                        ? this.localeGroups.map((group) => this.renderLocaleGroup(group))
                        : html`<p>No locales found.</p>`}
                </div>
            </sp-popover>
        </overlay-trigger>`;
    }

    render() {
        return html`${TAG_FILTERS.map((filter) => this.renderTagFilter(filter))}${this.statusPicker}${this.localePicker}`;
    }
}

customElements.define('mas-bulk-edit-filters', MasBulkEditFilters);
