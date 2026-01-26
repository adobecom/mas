import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-translation-languages.css.js';
import Store from '../store.js';
import { getDefaultLocales } from '../../io/www/src/fragment/locales.js';

const NMB_CLMN = 4;

class MasTranslationLanguages extends LitElement {
    static styles = styles;

    static properties = {
        selectedLanguages: { type: Array, state: true },
        onChange: { type: Function, reflect: false },
    };

    constructor() {
        super();
        this.onChange = null;
        this.selectedLanguages = [];
    }

    connectedCallback() {
        super.connectedCallback();

        const surface = Store.search.value.path;
        this.localesArray = getDefaultLocales(surface)
            .map((item) => {
                item.locale = `${item.lang}_${item.country}`;
                return item;
            })
            .sort((a, b) => {
                return a.locale > b.locale ? 1 : -1;
            });
        this.localesMatrix = this.getLocales();
        this.numberOfLocales = this.localesArray.length;
    }

    get selectAllCheckbox() {
        return this.shadowRoot.querySelector('#cb-select-all');
    }

    get selectAllChecked() {
        return this.selectedLanguages.length === this.numberOfLocales;
    }

    /** The array of locales needs to be transform into the matrix with NMB_CLMN columns
     *  where the array in the last row needs to be filled with remaining empty objects
     *  to display the content properly in the table.
     */
    getLocales() {
        const matrix = this.localesArray.reduce((rows, key, index) => {
            return (index % NMB_CLMN == 0 ? rows.push([key]) : rows[rows.length - 1].push(key)) && rows;
        }, []);

        const lastRowLength = matrix[matrix.length - 1].length;
        for (let i = 0; i < NMB_CLMN - lastRowLength; i++) {
            matrix[matrix.length - 1].push({});
        }
        return matrix;
    }

    selectAll(event) {
        if (event.target.checked) {
            this.selectedLanguages = this.localesArray.map((item) => item.locale);
        } else {
            this.selectedLanguages = [];
        }
        this.onChange(this.selectedLanguages);
        this.requestUpdate();
    }

    changeCheckboxState(event) {
        event.stopPropagation();

        if (event.target.checked) {
            this.selectedLanguages.push(event.target.textContent);
        } else {
            const index = this.selectedLanguages.indexOf(event.target.textContent);
            if (index > -1) {
                // only splice array when item is found
                this.selectedLanguages.splice(index, 1); // 2nd parameter means remove one item only
            }
        }
        this.selectAllCheckbox.checked = this.selectAllChecked;
        this.onChange(this.selectedLanguages);
        this.requestUpdate();
    }

    renderTableCell(item) {
        return html`
            <sp-table-cell role="gridcell">
                ${item.locale
                    ? html`
                          <sp-checkbox
                              @change=${this.changeCheckboxState}
                              ?checked=${this.selectedLanguages.includes(item.locale)}
                              >${item.locale}</sp-checkbox
                          >
                      `
                    : nothing}
            </sp-table-cell>
        `;
    }

    renderTableRow(localeArray) {
        return html` <sp-table-row role="row"> ${localeArray.map((locale) => this.renderTableCell(locale))} </sp-table-row> `;
    }

    render() {
        return html`
            <div class="select-lang-content">
                <div class="select-all-lang">
                    <sp-checkbox id="cb-select-all" ?checked=${this.selectAllChecked} @change=${this.selectAll} size="m"
                        >Select all</sp-checkbox
                    >
                    <div class="nmb-languages">${this.numberOfLocales} languages</div>
                </div>
                <sp-divider size="s"></sp-divider>
                <div class="select-lang">
                    <sp-table quiet role="grid">
                        ${this.localesMatrix.map((localeArray) => this.renderTableRow(localeArray))}
                    </sp-table>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-translation-langs', MasTranslationLanguages);
