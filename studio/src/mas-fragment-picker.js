import { LitElement, html, repeat } from 'lit';
import { styles } from './mas-fragment-picker.css.js';
import Store from './store.js';
import { ROOT_PATH, EDITABLE_FRAGMENT_MODEL_IDS } from './constants.js';
import { showToast } from './utils.js';

function getDamPath(path) {
    if (!path) return ROOT_PATH;
    if (path.startsWith(ROOT_PATH)) return path;
    return `${ROOT_PATH}/${path}`;
}

class MasFragmentPicker extends LitElement {
    static styles = styles;

    static properties = {
        translationProject: { type: Object },
        selectedFragments: { type: Array },
        fragments: { type: Array, state: true },
        loading: { type: Boolean, state: true },
        error: { type: String, state: true },
    };

    constructor() {
        super();
        this.translationProject = null;
        this.selectedFragments = [];
        this.fragments = [];
        this.loading = false;
        this.error = null;
        this.abortController = null;
        this.unsubscribe = null;
    }

    /** @type {import('./mas-repository.js').MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    connectedCallback() {
        super.connectedCallback();
        this.unsubscribe = Store.search.subscribe(() => {
            this.fetchFragments();
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.abortController) {
            this.abortController.abort();
        }
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    get loadingIndicator() {
        if (!this.loading) return nothing;
        return html`<sp-progress-circle indeterminate size="l"></sp-progress-circle>`;
    }

    async fetchFragments() {
        const path = Store.search.value?.path;
        const surface = path?.split('/').filter(Boolean)[0]?.toLowerCase();
        if (!surface) return;

        const aem = this.repository?.aem;
        if (!aem) {
            this.error = 'Repository not available';
            return;
        }

        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();

        this.loading = true;
        this.error = null;
        this.fragments = [];

        try {
            const locale = Store.filters.value?.locale || 'en_US';
            const damPath = getDamPath(surface);
            const searchPath = `${damPath}/${locale}`;

            const searchParams = {
                path: searchPath,
                modelIds: EDITABLE_FRAGMENT_MODEL_IDS,
                sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
                limit: 10,
            };

            const cursor = await aem.sites.cf.fragments.search(searchParams, null, this.abortController);

            const fetchedFragments = [];
            for await (const result of cursor) {
                for (const item of result) {
                    fetchedFragments.push(item);
                }
            }

            this.fragments = fetchedFragments;
            console.log('fragments fetched', this.fragments);
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Failed to fetch fragments:', err);
                this.error = err.message;
                showToast('Failed to fetch fragments.', 'negative');
            }
        } finally {
            this.loading = false;
        }
    }

    handleSelectionChange(e) {
        this.selectedFragments = e.target.selected || [];
        console.log('selected fragments', this.selectedFragments);
    }

    renderTable() {
        return html` <div class="container">
                ${this.loading
                    ? html`<div class="loading-container">${this.loadingIndicator}</div>`
                    : html`<sp-table emphasized scroller selects="multiple" @change=${this.handleSelectionChange}>
                          <sp-table-head>
                              <sp-table-head-cell sortable>Offer</sp-table-head-cell>
                              <sp-table-head-cell>Fragment title</sp-table-head-cell>
                              <sp-table-head-cell>Offer ID</sp-table-head-cell>
                              <sp-table-head-cell>Path</sp-table-head-cell>
                              <sp-table-head-cell>Status</sp-table-head-cell>
                          </sp-table-head>
                          <sp-table-body>
                              ${repeat(
                                  this.fragments,
                                  (fragment) => fragment.id,
                                  (fragment) =>
                                      html`<sp-table-row value=${fragment.id}>
                                          <sp-table-cell>${fragment.title}</sp-table-cell>
                                          <sp-table-cell>${fragment.title}</sp-table-cell>
                                          <sp-table-cell>
                                              ${fragment.fields?.find(({ name }) => name === 'osi')?.values?.[0]}
                                          </sp-table-cell>
                                          <sp-table-cell>${fragment.path}</sp-table-cell>
                                          <sp-table-cell>${fragment.status}</sp-table-cell>
                                      </sp-table-row>`,
                              )}
                              <sp-table-row value="offer-id-1">
                                  <sp-table-cell>Photoshop</sp-table-cell>
                                  <sp-table-cell>OPT: CC Plans Banner: Photoshop: Individuals: default:...</sp-table-cell>
                                  <sp-table-cell>632B3ADD940A7FBB7864AA5AD19B8D28</sp-table-cell>
                                  <sp-table-cell>banner: ACOM / Catalog / Individual / COM</sp-table-cell>
                                  <sp-table-cell>Published</sp-table-cell>
                              </sp-table-row>
                          </sp-table-body>
                      </sp-table>`}
                ${this.selectedFragments.length
                    ? html`<ul class="selected-files">
                          ${repeat(
                              this.selectedFragments,
                              (fragment) => fragment,
                              (fragment) =>
                                  html`<li class="file">
                                      <h3 class="title">Title</h3>
                                      <div class="details">Default fragment: US (EN)</div>
                                      <sp-button variant="secondary" size="l" icon-only>
                                          <sp-icon-close slot="icon"></sp-icon-close>
                                      </sp-button>
                                  </li>`,
                          )}
                      </ul>`
                    : ''}
            </div>

            <div class="selected-files-count">Selected files (${this.selectedFragments.length})</div>`;
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
            ${this.renderTable()}
        `;
    }
}

customElements.define('mas-fragment-picker', MasFragmentPicker);
