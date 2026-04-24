import { LitElement, html } from 'lit';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import router from '../router.js';
import { styles } from './mas-bulk-publish.css.js';
import { BULK_PUBLISH_STATUS, PAGE_NAMES } from '../constants.js';

class MasBulkPublish extends LitElement {
    static styles = styles;

    list = new StoreController(this, Store.bulkPublishProjects.list.data);

    onCreate() {
        this.dispatchEvent(new CustomEvent('create-project', { bubbles: true, composed: true }));
        Store.bulkPublishProjects.projectId.set(null);
        Store.bulkPublishProjects.inEdit.set({
            id: null,
            getFieldValue: (k) => ({ status: BULK_PUBLISH_STATUS.DRAFT, urls: '', items: '[]', locales: [], title: '' })[k],
            setFieldValue: () => {},
        });
        router.navigateToPage(PAGE_NAMES.BULK_PUBLISH_EDITOR)();
    }

    statusClass(s) {
        if (s === BULK_PUBLISH_STATUS.PUBLISHING) return 'status publishing';
        if (s === BULK_PUBLISH_STATUS.PUBLISHED) return 'status published';
        return 'status draft';
    }

    render() {
        const projects = this.list.value || [];
        return html`
            <header>
                <h1>Bulk publish</h1>
                <sp-button variant="accent" data-testid="create-btn" @click=${this.onCreate}>+ Create project</sp-button>
            </header>
            ${projects.length === 0
                ? html`<p data-testid="empty">No bulk publish projects yet.</p>`
                : html`
                      <table>
                          <thead>
                              <tr>
                                  <th>Project</th>
                                  <th>Created by</th>
                                  <th>Status</th>
                                  <th></th>
                              </tr>
                          </thead>
                          <tbody>
                              ${projects.map((p) => {
                                  const data = p.get();
                                  return html`<tr data-testid="project-row">
                                      <td>${data.title}</td>
                                      <td>${data.author ?? ''}</td>
                                      <td>
                                          <span class=${this.statusClass(data.status)}> ${data.status ?? 'Draft'} </span>
                                      </td>
                                      <td></td>
                                  </tr>`;
                              })}
                          </tbody>
                      </table>
                  `}
        `;
    }
}

customElements.define('mas-bulk-publish', MasBulkPublish);
