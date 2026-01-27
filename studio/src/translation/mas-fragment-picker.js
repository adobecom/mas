import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-fragment-picker.css.js';
import './mas-selected-items.js';
import './mas-search-and-filters.js';

class MasFragmentPicker extends LitElement {
    static styles = styles;

    static properties = {
        itemToRemove: { type: String, state: true },
    };

    constructor() {
        super();
        this.itemToRemove = null;
    }

    #filteringParams = {
        mainStore: 'translationProjects',
        storeSourceKey: 'allFragments',
        storeTargetKey: 'displayFragments',
    };

    setItemToRemove({ detail: { path } }) {
        this.itemToRemove = path;
    }

    render() {
        return html`
            <mas-search-and-filters .params=${this.#filteringParams}></mas-search-and-filters>
            <div class="container">
                <mas-select-fragments-table
                    .type=${'fragments'}
                    .itemToRemove=${this.itemToRemove}
                ></mas-select-fragments-table>
                <mas-selected-items @remove=${this.setItemToRemove}></mas-selected-items>
            </div>
        `;
    }
}

customElements.define('mas-fragment-picker', MasFragmentPicker);
