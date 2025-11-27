import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { MasRepository } from './mas-repository.js';
import './aem/aem-tag-picker-field.js';
import Store from './store.js';
import StoreController from './reactivity/store-controller.js';
import styles from './mas-promotions-editor-css.js';
import { SURFACES, PAGE_NAMES, PROMOTION_MODEL_ID } from './constants.js';
import { normalizeKey, showToast } from './utils.js';
import { Promotion } from './aem/promotion.js';

const typeMap = {
    title: { type: 'text' },
    promoCode: { type: 'text' },
    startDate: { type: 'date-time' },
    endDate: { type: 'date-time' },
    tags: { type: 'tag', multiple: true },
    surfaces: { type: 'long-text' },
};

const requiredFields = ['title', 'startDate', 'endDate'];

class MasPromotionsEditor extends LitElement {
    static styles = styles;

    static properties = {
        loadingPromotion: { type: Boolean, state: true },
        isNewPromotion: { type: Boolean, state: true },
        isCreated: { type: Boolean, state: true },
        isDialogOpen: { type: Boolean, state: true },
        confirmDialogConfig: { type: Object, state: true },
    };

    inEdit = Store.promotions.inEdit;
    promotionId = Store.promotions.promotionId;

    storeController = null;

    constructor() {
        super();
        this.loadingPromotion = false;
        this.isNewPromotion = false;
        this.isCreated = false;
        this.isDialogOpen = false;
        this.confirmDialogConfig = null;
    }

    async connectedCallback() {
        super.connectedCallback();

        const promotionId = this.promotionId.get();
        if (promotionId) {
            if (!this.fragmentStore) {
                this.loadingPromotion = true;
                await this.#loadPromotionById(promotionId);
                this.loadingPromotion = false;
            }
        } else {
            this.isNewPromotion = true;
            const newPromotion = this.#initializeNewPromotion();
            const { FragmentStore } = await import('./reactivity/fragment-store.js');
            this.fragmentStore = new FragmentStore(newPromotion);
        }

        this.storeController = new StoreController(this, this.fragmentStore);
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    get fragment() {
        return this.fragmentStore?.get();
    }

    get fragmentStore() {
        return this.inEdit.get();
    }

    set fragmentStore(fragmentStore) {
        this.inEdit.set(fragmentStore);
    }

    async #loadPromotionById(id) {
        try {
            const fragment = await this.repository.aem.sites.cf.fragments.getById(id);
            if (fragment) {
                const promotion = new Promotion(fragment);

                // Create a new FragmentStore and set it in the store
                const { FragmentStore } = await import('./reactivity/fragment-store.js');
                const fragmentStore = new FragmentStore(promotion);
                Store.promotions.inEdit.set(fragmentStore);
            }
        } catch (error) {
            console.error('Failed to load promotion:', error);
            showToast('Failed to load promotion.', 'negative');
        }
    }

    #initializeNewPromotion() {
        return new Promotion({
            id: null,
            title: '',
            fields: [
                { name: 'title', type: 'text', values: [''] },
                { name: 'promoCode', values: [''] },
                { name: 'startDate', values: [''] },
                { name: 'endDate', values: [''] },
                { name: 'tags', values: [] },
                { name: 'surfaces', values: [] },
            ],
        });
    }

    #handeTagsChange = (event) => {
        console.log('handeTagsChange:', event);
        const tags = event.target.getAttribute('value');
        const newTags = tags ? tags.split(',') : [];
        console.log('tags:', tags);
        this.fragmentStore.updateField('tags', newTags);
    };

    #handleCloseAddSurfacesDialog = (event) => {
        console.log('handleCloseAddSurfacesDialog:', event);

        // Get the table element and its selected rows
        const table = event.target.querySelector('#surfaces-table');
        const selectedSurfaces = table?.selected || [];

        console.log('selectedSurfaces:', selectedSurfaces);

        // Update the fragment with the selected surfaces
        if (selectedSurfaces.length > 0) {
            this.fragmentStore.updateField('surfaces', selectedSurfaces);
        }

        const closeEvent = new Event('close', { bubbles: true, composed: true });
        event.target.dispatchEvent(closeEvent);
    };

    #handleSurfaceDelete = (event) => {
        const deletedSurface = event.target.attributes.getNamedItem('value').value;
        console.log(`deletedSurface`, deletedSurface);
        const surfaces = this.fragment.fields.find((field) => field.name === 'surfaces')?.values || [];
        this.fragmentStore.updateField(
            'surfaces',
            surfaces.filter((surface) => surface !== deletedSurface),
        );
    };

    #handleFragmentUpdate({ target, detail, values }) {
        console.log('handleFragmentUpdate');
        const fieldName = target.dataset.field;
        let value = values;
        if (!value) {
            value = target.value || detail?.value || target.checked;
            value = target.multiline ? value?.split(',') : [value ?? ''];
        }
        this.fragmentStore.updateField(fieldName, value);
    }

    #handleDateUpdate({ target }) {
        const fieldName = target.dataset.field;

        const utcDate = new Date(target.value + 'Z').toISOString();
        this.fragmentStore.updateField(fieldName, [utcDate]);
    }

    async #handleCreatePromotion() {
        console.log('handleCreatePromotion');

        if (!this.#validateRequiredFields(this.fragment)) {
            showToast('Please fill in all required fields', 'negative');
            return;
        }

        const fragmentPayload = {
            name: normalizeKey(this.fragment.getFieldValue('title')),
            parentPath: this.repository.getPromotionsPath(),
            modelId: PROMOTION_MODEL_ID,
            title: this.fragment.getFieldValue('title'),
            fields: this.fragment.fields.map((field) => ({
                name: field.name,
                type: typeMap[field.name].type,
                multiple: typeMap[field.name].multiple,
                values: field.values,
            })),
        };

        const newPromotion = await this.repository.createFragment(fragmentPayload);

        if (newPromotion) {
            this.isCreated = true;
        }
    }

    async #handleUpdatePromotion() {
        console.log('handleUpdatePromotion:', this.fragment);

        if (!this.#validateRequiredFields(this.fragment)) {
            showToast('Please fill in all required fields', 'negative');
            return;
        }
        this.fragment.updateFieldInternal('title', this.fragment.getFieldValue('title'));
        await this.repository.saveFragment(this.fragmentStore);
    }

    async #handleCancel() {
        console.log('handleCancel');
        if (this.fragment?.hasChanges) {
            const confirmed = await this.#showDialog(
                'Unsaved Changes',
                'You have unsaved changes. Are you sure you want to cancel?',
                {
                    confirmText: 'Yes',
                    cancelText: 'Cancel',
                    variant: 'negative',
                },
            );
            if (!confirmed) return;
        }
        this.fragmentStore.discardChanges();
        Store.promotions.inEdit.set();
        Store.page.set(PAGE_NAMES.PROMOTIONS);
    }

    #validateRequiredFields(fragment = {}) {
        return requiredFields.every((field) => fragment.getFieldValue(field));
    }

    /**
     * Display a dialog for confirmation
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @param {Object} options - Additional options
     * @returns {Promise<boolean>} - True if confirmed, false if canceled
     */
    async #showDialog(title, message, options = {}) {
        if (this.isDialogOpen) {
            return false;
        }

        this.isDialogOpen = true;
        const { confirmText = 'OK', cancelText = 'Cancel', variant = 'primary' } = options;

        return new Promise((resolve) => {
            this.confirmDialogConfig = {
                title,
                message,
                confirmText,
                cancelText,
                variant,
                onConfirm: () => {
                    resolve(true);
                },
                onCancel: () => {
                    resolve(false);
                },
            };
        });
    }

    render() {
        let form = nothing;
        if (this.fragment) {
            form = Object.fromEntries([...this.fragment.fields.map((f) => [f.name, f])]);
            console.log('form.surfaces.values:', form.surfaces?.values);
            console.log('form.tags.values:', form.tags?.values);
        }
        return html`
            <div class="promotions-form-breadcrumb">
                <sp-breadcrumbs>
                    <sp-breadcrumb-item slot="root" href="/studio.html#page=promotions">Promotions</sp-breadcrumb-item>
                    <sp-breadcrumb-item value="trend">Campaign Creation</sp-breadcrumb-item>
                </sp-breadcrumbs>
            </div>
            ${this.renderConfirmDialog()}
            <div class="promotions-form-container">
                <div class="promotions-form-header">
                    <h1>${this.isNewPromotion ? 'Create new Campaign' : 'Edit Campaign'}</h1>
                </div>
                <div class="promotions-form-panel">
                    ${this.loadingPromotion
                        ? html`
                              <div class="promotion-loading">
                                  <sp-progress-circle label="Loading promotion" indeterminate></sp-progress-circle>
                              </div>
                          `
                        : nothing}
                    <div><h2>General Info</h2></div>
                    <div class="promotions-form-panel-content">
                        <div class="promotions-form-fields">
                            <sp-field-label for="campaignTitle" required>Campaign Title</sp-field-label>
                            <sp-textfield
                                id="campaignTitle"
                                data-field="title"
                                value="${form.title?.values[0]}"
                                @input=${this.#handleFragmentUpdate}
                            ></sp-textfield>
                            <sp-field-label for="promoCode">Promo Code</sp-field-label>
                            <sp-textfield
                                id="promoCode"
                                data-field="promoCode"
                                value="${form.promoCode?.values[0]}"
                                @input=${this.#handleFragmentUpdate}
                            ></sp-textfield>
                            <sp-field-label for="startDate" required>Start Date (UTC)</sp-field-label>
                            <input
                                type="datetime-local"
                                id="startDate"
                                value="${form.startDate?.values[0].slice(0, 16)}"
                                data-field="startDate"
                                @change=${this.#handleDateUpdate}
                            />
                            <sp-field-label for="endDate" required>End Date (UTC)</sp-field-label>
                            <input
                                type="datetime-local"
                                id="endDate"
                                value="${form.endDate?.values[0].slice(0, 16)}"
                                data-field="endDate"
                                @change=${this.#handleDateUpdate}
                            />
                            <sp-field-label>Tags</sp-field-label>
                            <aem-tag-picker-field
                                label="Tags"
                                namespace="/content/cq:tags/mas"
                                multiple
                                value="${form.tags?.values.join(',') || ''}"
                                @change=${this.#handeTagsChange}
                            ></aem-tag-picker-field>
                        </div>
                        <sp-divider size="m" style="align-self: stretch; height: auto;" vertical></sp-divider>
                        <div class="promotions-form-surfaces">
                            <sp-field-label>Surfaces</sp-field-label>
                            <div class="promotions-form-surfaces-panel">
                                ${!form.surfaces?.values || form.surfaces.values.length === 0
                                    ? html`
                                          <div class="surfaces-empty-state">
                                              <div class="icon">
                                                  <overlay-trigger type="modal" id="add-surfaces-overlay">
                                                      ${this.renderAddSurfacesDialog()}
                                                      <sp-button slot="trigger" variant="secondary">
                                                          <sp-icon-add size="xxl"></sp-icon-add>
                                                      </sp-button>
                                                  </overlay-trigger>
                                              </div>
                                              <div class="label">
                                                  <strong>Add Surfaces</strong><br />
                                                  Select at least one surface to publish your campaign.
                                              </div>
                                          </div>
                                      `
                                    : html`
                                          <div class="surfaces-list">
                                              <sp-tags data-foo="${form.surfaces.values}">
                                                  ${repeat(
                                                      form.surfaces.values,
                                                      (surface) => surface,
                                                      (surface) => html`
                                                          <sp-tag
                                                              value="${surface}"
                                                              deletable
                                                              @delete=${this.#handleSurfaceDelete}
                                                          >
                                                              ${SURFACES.find((s) => s.name === surface)?.label || surface}
                                                          </sp-tag>
                                                      `,
                                                  )}
                                                  <overlay-trigger type="modal" id="add-surfaces-overlay">
                                                      ${this.renderAddSurfacesDialog()}
                                                      <sp-button slot="trigger" variant="secondary" icon-only>
                                                          <sp-icon-add slot="icon" size="m"></sp-icon-add>
                                                      </sp-button>
                                                  </overlay-trigger>
                                              </sp-tags>
                                          </div>
                                      `}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="promotions-form-buttons">
                    <sp-button @click=${this.#handleCancel}>Cancel</sp-button>
                    ${this.isNewPromotion
                        ? html`<sp-button @click=${this.#handleCreatePromotion} ?disabled=${this.isCreated}>Create</sp-button>`
                        : html`<sp-button @click=${this.#handleUpdatePromotion} ?disabled=${!this.fragment?.hasChanges}
                              >Update</sp-button
                          >`}
                </div>
            </div>
        `;
    }

    renderAddSurfacesDialog() {
        const surfaces = this.fragment?.fields.find((field) => field.name === 'surfaces')?.values || [];
        console.log('surfaces:', surfaces);
        return html`
            <sp-dialog-wrapper
                slot="click-content"
                headline="Add surfaces"
                confirm-label="Done"
                cancel-label="Cancel"
                size="l"
                underlay
                @confirm=${this.#handleCloseAddSurfacesDialog}
            >
                <sp-search placeholder="Search surface"></sp-search>
                <div class="surfaces-results"><span>0</span> results</div>
                <sp-table selects="multiple" scroller="true" emphasized id="surfaces-table" .selected=${surfaces}>
                    <sp-table-head>
                        <sp-table-head-cell>All surfaces</sp-table-head-cell>
                    </sp-table-head>
                    <sp-table-body>
                        ${repeat(
                            SURFACES,
                            (surface) => surface.name,
                            (surface) => html`
                                <sp-table-row value="${surface.name}">
                                    <sp-table-cell>${surface.label}</sp-table-cell>
                                </sp-table-row>
                            `,
                        )}
                    </sp-table-body>
                </sp-table>
            </sp-dialog-wrapper>
        `;
    }

    renderConfirmDialog() {
        if (!this.confirmDialogConfig || !this.fragment?.hasChanges) return nothing;

        const { title, message, onConfirm, onCancel, confirmText, cancelText, variant } = this.confirmDialogConfig;

        return html`
            <div class="confirm-dialog-overlay">
                <sp-dialog-wrapper
                    open
                    underlay
                    id="promotion-unsaved-changes-dialog"
                    .heading=${title}
                    .variant=${variant || 'negative'}
                    .confirmLabel=${confirmText}
                    .cancelLabel=${cancelText}
                    @confirm=${() => {
                        this.confirmDialogConfig = null;
                        this.isDialogOpen = false;
                        onConfirm && onConfirm();
                    }}
                    @cancel=${() => {
                        this.confirmDialogConfig = null;
                        this.isDialogOpen = false;
                        onCancel && onCancel();
                    }}
                >
                    <div>${message}</div>
                </sp-dialog-wrapper>
            </div>
        `;
    }
}
customElements.define('mas-promotions-editor', MasPromotionsEditor);
