import { LitElement, html } from 'lit';
import { styles } from './mas-localization.css.js';
import Store from './store.js';
import { PAGE_NAMES } from './constants.js';

class MasLocalization extends LitElement {
    static styles = styles;

    static properties = {};

    constructor() {
        super();
    }

    async connectedCallback() {
        super.connectedCallback();

        const currentPage = Store.page.get();
        if (currentPage !== PAGE_NAMES.LOCALIZATION) {
            Store.page.set(PAGE_NAMES.LOCALIZATION);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    render() {
        return html`
            <div class="localization-container">
                <div class="localization-header">
                    <h2>Localization</h2>
                    <sp-button variant="accent" class="create-button">
                        <sp-icon-add slot="icon"></sp-icon-add>
                        Create project
                    </sp-button>
                </div>
                <div class="localization-toolbar">
                    <sp-search size="m" placeholder="Search"></sp-search>
                    <div>1507 results</div>
                </div>
                <div class="localization-content">
                    <sp-table emphasized scroller class="localization-table">
                        <sp-table-head>
                            <sp-table-head-cell>Project</sp-table-head-cell>
                            <sp-table-head-cell>Last updated by</sp-table-head-cell>
                            <sp-table-head-cell>Sent on</sp-table-head-cell>
                            <sp-table-head-cell>Actions</sp-table-head-cell>
                        </sp-table-head>
                        <sp-table-body>
                            <sp-table-row>
                                <sp-table-cell>21570-dotcom-153579-cc-busines-plans-substance-premium</sp-table-cell>
                                <sp-table-cell>Fred Welterlin</sp-table-cell>
                                <sp-table-cell>Oct 4, 2025</sp-table-cell>
                                <sp-table-cell class="action-cell">
                                    <sp-action-menu size="m">
                                        ${html`
                                            <sp-menu-item>
                                                <sp-icon-delete></sp-icon-delete>
                                                <span>Delete</span>
                                            </sp-menu-item>
                                        `}
                                    </sp-action-menu>
                                </sp-table-cell>
                            </sp-table-row>
                        </sp-table-body>
                    </sp-table>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-localization', MasLocalization);
