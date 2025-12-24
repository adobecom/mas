import { LitElement, html } from 'lit';
import { styles } from './mas-fragment-picker.css.js';

class MasFragmentPicker extends LitElement {
    static styles = styles;

    static properties = {
        translationProject: { type: Object },
        selectedFragments: { type: Array },
    };

    constructor() {
        super();
        this.translationProject = null;
        this.selectedFragments = [];
    }

    handleSelectionChange(e) {
        this.selectedFragments = e.target.selected || [];
    }

    render() {
        return html`
            <div class="search">
                <sp-search size="m" placeholder="Search" disabled></sp-search>
                <div>1507 result(s)</div>
            </div>

            <div class="filters">
                <sp-picker>
                    <span slot="label">Template</span>
                    <sp-menu-item>Template 1</sp-menu-item>
                    <sp-menu-item>Template 2</sp-menu-item>
                    <sp-menu-item>Template 3</sp-menu-item>
                </sp-picker>

                <sp-picker>
                    <span slot="label">Segment</span>
                    <sp-menu-item>Segment 1</sp-menu-item>
                    <sp-menu-item>Segment 2</sp-menu-item>
                    <sp-menu-item>Segment 3</sp-menu-item>
                </sp-picker>

                <sp-picker>
                    <span slot="label">Product</span>
                    <sp-menu-item>Product 1</sp-menu-item>
                    <sp-menu-item>Product 2</sp-menu-item>
                    <sp-menu-item>Product 3</sp-menu-item>
                </sp-picker>
            </div>

            <sp-table emphasized scroller selects="multiple" class="fragments-table" @change=${this.handleSelectionChange}>
                <sp-table-head>
                    <sp-table-head-cell> Offer </sp-table-head-cell>
                    <sp-table-head-cell> Fragment title </sp-table-head-cell>
                    <sp-table-head-cell> Offer ID </sp-table-head-cell>
                    <sp-table-head-cell> Path </sp-table-head-cell>
                    <sp-table-head-cell> Status </sp-table-head-cell>
                </sp-table-head>
                <sp-table-body>
                    <sp-table-row value="offer-id-1">
                        <sp-table-cell>Photoshop</sp-table-cell>
                        <sp-table-cell>OPT: CC Plans Banner: Photoshop: Individuals: default:...</sp-table-cell>
                        <sp-table-cell>632B3ADD940A7FBB7864AA5AD19B8D28</sp-table-cell>
                        <sp-table-cell>banner: ACOM / Catalog / Individual / COM</sp-table-cell>
                        <sp-table-cell>Published</sp-table-cell>
                    </sp-table-row>
                    <sp-table-row value="offer-id-2">
                        <sp-table-cell>Photoshop</sp-table-cell>
                        <sp-table-cell>CC Catalog Merch Card: Photoshop: default.</sp-table-cell>
                        <sp-table-cell>632B3ADD940A7FBB7864AA5AD19B8D28</sp-table-cell>
                        <sp-table-cell>merch-card: ACOM / Catalog / Individual / COM</sp-table-cell>
                        <sp-table-cell>Published</sp-table-cell>
                    </sp-table-row>
                </sp-table-body>
            </sp-table>
            <div class="selected-files">Selected files (${this.selectedFragments.length})</div>
        `;
    }
}

customElements.define('mas-fragment-picker', MasFragmentPicker);
