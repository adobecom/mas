import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-publish-dialog.css.js';

class MasPublishDialog extends LitElement {
    static styles = styles;

    static properties = {
        open: { type: Boolean },
        refs: { type: Object },
        _checkedIds: { state: true },
    };

    constructor() {
        super();
        this.open = false;
        this.refs = { variations: [], cards: [] };
        this._checkedIds = new Set();
    }

    get _allRefs() {
        return [...(this.refs?.variations ?? []), ...(this.refs?.cards ?? [])];
    }

    get _allSelected() {
        return this._allRefs.length > 0 && this._allRefs.every((r) => this._checkedIds.has(r.id));
    }

    _toggleSelectAll(checked) {
        this._checkedIds = checked ? new Set(this._allRefs.map((r) => r.id)) : new Set();
    }

    _toggleRef(id, checked) {
        const next = new Set(this._checkedIds);
        if (checked) next.add(id);
        else next.delete(id);
        this._checkedIds = next;
    }

    confirm() {
        this.dispatchEvent(
            new CustomEvent('publish-confirmed', {
                bubbles: true,
                composed: true,
                detail: {
                    selectedIds: [...this._checkedIds],
                    allSelected: this._allSelected,
                },
            }),
        );
    }

    cancel() {
        this.dispatchEvent(new CustomEvent('publish-cancelled', { bubbles: true, composed: true }));
    }

    _renderRef(ref) {
        return html`
            <div class="ref-item">
                <sp-checkbox
                    data-ref-id=${ref.id}
                    .checked=${this._checkedIds.has(ref.id)}
                    @change=${(e) => this._toggleRef(ref.id, e.target.checked)}
                    >${ref.path.split('/').pop()}</sp-checkbox
                >
                <div class="ref-path">${ref.path}</div>
            </div>
        `;
    }

    render() {
        if (!this.open) return nothing;
        const { variations = [], cards = [] } = this.refs ?? {};
        const hasRefs = variations.length > 0 || cards.length > 0;
        return html`
            <sp-underlay open @click=${this.cancel}></sp-underlay>
            <sp-dialog size="m" no-divider>
                <h2 slot="heading">Publish fragment</h2>
                <p class="intro">The following references can be published together. Check items to include them in publish.</p>
                ${hasRefs
                    ? html`
                          <div class="select-all-row">
                              <sp-checkbox
                                  data-select-all
                                  emphasized
                                  .checked=${this._allSelected}
                                  @change=${(e) => this._toggleSelectAll(e.target.checked)}
                                  >Select all</sp-checkbox
                              >
                          </div>
                      `
                    : nothing}
                ${variations.length
                    ? html`
                          <div class="section-title">Variations</div>
                          <div class="ref-list">${variations.map((r) => this._renderRef(r))}</div>
                      `
                    : nothing}
                ${cards.length
                    ? html`
                          <div class="section-title">Cards in collection</div>
                          <div class="ref-list">${cards.map((r) => this._renderRef(r))}</div>
                      `
                    : nothing}
                <sp-button slot="button" variant="secondary" treatment="outline" @click=${this.cancel}>Cancel</sp-button>
                <sp-button slot="button" variant="accent" @click=${this.confirm}>Publish</sp-button>
            </sp-dialog>
        `;
    }

    static show(refs) {
        return new Promise((resolve) => {
            const dialog = document.createElement('mas-publish-dialog');
            const container = document.querySelector('sp-theme') ?? document.body;
            container.appendChild(dialog);

            const cleanup = (result) => {
                dialog.remove();
                resolve(result);
            };

            dialog.addEventListener(
                'publish-confirmed',
                (e) => cleanup({ confirmed: true, selectedIds: e.detail.selectedIds, allSelected: e.detail.allSelected }),
                { once: true },
            );
            dialog.addEventListener(
                'publish-cancelled',
                () => cleanup({ confirmed: false, selectedIds: [], allSelected: false }),
                { once: true },
            );

            dialog.refs = refs;
            dialog.open = true;
        });
    }
}

customElements.define('mas-publish-dialog', MasPublishDialog);
export { MasPublishDialog };
