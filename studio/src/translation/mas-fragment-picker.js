import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-fragment-picker.css.js';
import './mas-selected-items.js';
import './mas-translation-files-table.js';
import Store from '../store.js';

class MasFragmentPicker extends LitElement {
    static styles = styles;

    static properties = {
        itemToRemove: { type: String, state: true },
    };

    setItemToRemove({ detail: { id } }) {
        this.itemToRemove = id;
    }

    render() {
        return html`
            <div class="search">
                <sp-search size="m" placeholder="Search" disabled></sp-search>
                <div>1507 result(s)</div>
            </div>

            <div class="filters">
                <sp-picker disabled>
                    <span slot="label">Template</span>
                    <sp-menu-item>TODO</sp-menu-item>
                </sp-picker>

                <sp-picker disabled>
                    <span slot="label">Market Segment</span>
                    <sp-menu-item>TODO</sp-menu-item>
                </sp-picker>

                <sp-picker disabled>
                    <span slot="label">Customer Segment</span>
                    <sp-menu-item>TODO</sp-menu-item>
                </sp-picker>

                <sp-picker disabled>
                    <span slot="label">Product</span>
                    <sp-menu-item>TODO</sp-menu-item>
                </sp-picker>
            </div>
            <div class="container">
                <mas-translation-files-table
                    .type=${'fragments'}
                    .itemToRemove=${this.itemToRemove}
                ></mas-translation-files-table>
                <mas-selected-items .type=${'fragments'} @remove=${this.setItemToRemove}></mas-selected-items>
            </div>
        `;
    }
}

customElements.define('mas-fragment-picker', MasFragmentPicker);
