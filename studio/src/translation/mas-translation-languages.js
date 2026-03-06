import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-translation-languages.css.js';
import Store from '../store.js';
import { getDefaultLocales, getLocaleCode } from '../../../io/www/src/fragment/locales.js';
import ReactiveController from '../reactivity/reactive-controller.js';

class MasTranslationLanguages extends LitElement {
    static styles = styles;

    static properties = {
        localesArray: { type: Array, state: true },
    };

    connectedCallback() {
        super.connectedCallback();
        const surface = Store.search.value.path;
        this.localesArray = getDefaultLocales(surface)
            .reduce((acc, item) => {
                const locale = getLocaleCode(item);
                if (locale === 'en_US') return acc;
                acc.push({ ...item, locale });
                return acc;
            }, [])
            .sort((a, b) => {
                return a.locale > b.locale ? 1 : -1;
            });
        this.localesMatrix = this.getLocales();
        this.targetLocalesController = new ReactiveController(this, [Store.translationProjects.targetLocales]);
    }

    get selectAllChecked() {
        return Store.translationProjects.targetLocales.value.length === this.localesArray.length;
    }

    get numberOfLocales() {
        const languagesText = Store.translationProjects.targetLocales.value.length === 1 ? 'language' : 'languages';
        return Store.translationProjects.targetLocales.value.length
            ? `${Store.translationProjects.targetLocales.value.length} ${languagesText} selected`
            : `${this.localesArray.length} ${languagesText}`;
    }

    /** The array of locales needs to be transform into the matrix with NMB_CLMN columns
     *  where the array in the last row needs to be filled with remaining empty objects
     *  to display the content properly in the table.
     */
    getLocales() {
        const numberOfColumns = 4;
        const matrix = this.localesArray.reduce((rows, key, index) => {
            return (index % numberOfColumns == 0 ? rows.push([key]) : rows[rows.length - 1].push(key)) && rows;
        }, []);

        const lastRowLength = matrix[matrix.length - 1].length;
        for (let i = 0; i < numberOfColumns - lastRowLength; i++) {
            matrix[matrix.length - 1].push({});
        }
        return matrix;
    }

    selectAll(event) {
        if (event.target.checked) {
            Store.translationProjects.targetLocales.set(this.localesArray.map((item) => item.locale));
        } else {
            Store.translationProjects.targetLocales.set([]);
        }
        this.requestUpdate();
    }

    changeCheckboxState(event) {
        event.stopPropagation();
        if (event.target.checked) {
            Store.translationProjects.targetLocales.set([
                ...Store.translationProjects.targetLocales.value,
                event.target.textContent.trim(),
            ]);
        } else {
            Store.translationProjects.targetLocales.set(
                Store.translationProjects.targetLocales.value.filter((locale) => locale !== event.target.textContent.trim()),
            );
        }
    }

    renderTableCell(item) {
        return html`
            <sp-table-cell role="gridcell">
                ${item.locale
                    ? html`
                          <sp-checkbox
                              @change=${this.changeCheckboxState}
                              ?checked=${Store.translationProjects.targetLocales.value.includes(item.locale)}
                          >
                              ${item.locale}
                          </sp-checkbox>
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
                    <sp-checkbox id="cb-select-all" ?checked=${this.selectAllChecked} @change=${this.selectAll} size="m">
                        Select all
                    </sp-checkbox>
                    <div class="nmb-languages">${this.numberOfLocales}</div>
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

customElements.define('mas-translation-languages', MasTranslationLanguages);
