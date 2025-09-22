import { LitElement, html, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import ReactiveController from './reactivity/reactive-controller.js';
import { PaginationStore } from './reactivity/pagination-store.js';

class MasPagination extends LitElement {
    static properties = {
        store: { type: Object, attribute: false },
        total: { type: Number },
    };

    static styles = css`
        :host {
            --mas-pagination-button-width: 40px;
            padding-inline: 4px;
        }

        .size-picker {
            width: 50px;
        }

        sp-action-button {
            width: var(--mas-pagination-button-width);
        }

        .spacer {
            display: inline-block;
            width: var(--mas-pagination-button-width);
            text-align: center;
        }

        .per-page-label {
            padding-inline: 8px;
        }
    `;

    constructor() {
        super();
        /** @type {PaginationStore} */
        this.store = null;
        this.total = 0;

        this.selectPage = this.selectPage.bind(this);
        this.navigateForward = this.navigateForward.bind(this);
        this.navigateBackward = this.navigateBackward.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        this.reactiveController = new ReactiveController(this, [this.store]);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    // #region Properties

    get page() {
        return this.store.get().page;
    }

    get size() {
        return this.store.get().size;
    }

    get pages() {
        if (this.total === 0) return 1;
        return Math.floor(this.total / this.size) + (this.total % this.size === 0 ? 0 : 1);
    }

    // #endregion

    selectPage(value) {
        this.store.selectPage(value);
    }

    navigateForward() {
        this.store.nextPage(this.pages);
    }

    navigateBackward() {
        this.store.previousPage();
    }

    changeSize(ev) {
        const value = Number(ev.target.value);
        this.store.setSize(value);
    }

    get shownPages() {
        const pages = this.pages;
        if (pages <= 7) return Array.from({ length: this.pages }, (_, i) => i + 1);
        if (this.page <= 3) {
            return [1, 2, 3, 4, 5, null, pages];
        } else {
            if (this.page >= pages - 2) return [1, null, pages - 4, pages - 3, pages - 2, pages - 1, pages];
            else return [1, null, this.page - 1, this.page, this.page + 1, null, pages];
        }
    }

    render() {
        return html`<div>
            <sp-combobox class="size-picker" value=${this.size} label="Size" @change=${this.changeSize}>
                <sp-menu-item value="20">20</sp-menu-item>
                <sp-menu-item value="50">50</sp-menu-item>
                <sp-menu-item value="100">100</sp-menu-item>
            </sp-combobox>
            <span class="per-page-label">per page</span>
            <sp-action-button label="Previous" quiet ?disabled=${this.page <= 1} @click=${this.navigateBackward}>
                <sp-icon-chevron-left slot="icon"></sp-icon-chevron-left>
            </sp-action-button>
            ${repeat(
                this.shownPages,
                (pageNumber) => pageNumber,
                (pageNumber) =>
                    pageNumber
                        ? html`
                              <sp-action-button
                                  label=${`Page ${pageNumber}`}
                                  quiet
                                  ?selected=${this.page === pageNumber}
                                  @click=${() => this.selectPage(pageNumber)}
                              >
                                  ${pageNumber}
                              </sp-action-button>
                          `
                        : html`<div class="spacer">...</div>`,
            )}
            <sp-action-button label="Next" quiet ?disabled=${this.page === this.pages} @click=${this.navigateForward}>
                <sp-icon-chevron-right slot="icon"></sp-icon-chevron-right>
            </sp-action-button>
        </div>`;
    }
}

customElements.define('mas-pagination', MasPagination);
