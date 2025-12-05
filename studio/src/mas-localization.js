import { LitElement, html } from 'lit';
import { styles } from './mas-localization.css.js';
import Store from './store.js';
import ReactiveController from './reactivity/reactive-controller.js';
import { MasRepository } from './mas-repository.js';
import { PAGE_NAMES } from './constants.js';

class MasLocalization extends LitElement {
    static styles = styles;

    static properties = {
        translationsData: { type: Array, state: true },
        translationsLoading: { type: Boolean, state: true },
    };

    constructor() {
        super();
        this.translationsData = Store.translations?.list?.data?.get() || [];
        this.translationsLoading = Store.translations?.list?.loading?.get() || false;
        this.reactiveController = new ReactiveController(this, [
            Store.translations?.list?.data,
            Store.translations?.list?.loading,
        ]);
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    /**
     * Ensures the repository is available
     * @param {string} [errorMessage='Repository component not found'] - Custom error message
     * @throws {Error} If repository is not available
     * @returns {MasRepository} The repository instance
     */
    ensureRepository(errorMessage = 'Repository component not found') {
        const repository = this.repository;
        if (!repository) {
            this.error = errorMessage;
            throw new Error(errorMessage);
        }
        return repository;
    }

    async connectedCallback() {
        super.connectedCallback();

        const currentPage = Store.page.get();
        if (currentPage !== PAGE_NAMES.LOCALIZATION) {
            Store.page.set(PAGE_NAMES.LOCALIZATION);
        }

        const masRepository = this.repository;
        if (!masRepository) {
            this.error = 'Repository component not found';
            return;
        }
        this.promotionsData = Store.promotions?.list?.data?.get() || [];

        Store.translations.list.loading.set(true);
        await this.loadTranslations(true);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    get loading() {
        return this.translationsLoading;
    }

    get loadingIndicator() {
        if (!this.loading) return nothing;
        return html`<sp-progress-circle indeterminate size="l"></sp-progress-circle>`;
    }

    set loading(value = true) {
        this.translationsLoading = value;
        Store.translations.list.loading.set(value);
    }

    async loadTranslations() {
        await this.repository.loadTranslations();
        this.translationsData = Store.translations.list.data.get() || [];
        this.translationsLoading = Store.translations.list.loading.get() || false;
        this.requestUpdate();
    }

    renderTranslationsContent() {
        if (this.translationsLoading) {
            return html`<div class="localization-loading-container">${this.loadingIndicator}</div>`;
        }
        return html`
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
        `;
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
                    <div>${this.translationsData.length} results</div>
                </div>
                <div class="localization-content">${this.renderTranslationsContent()}</div>
            </div>
        `;
    }
}

customElements.define('mas-localization', MasLocalization);
