import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { MasRepository } from './mas-repository.js';
import './aem/aem-tag-picker-field.js';
import styles from './mas-promotions-form-css.js';
import { SURFACES } from './constants.js';
import { normalizeKey, showToast } from './utils.js';

class MasPromotionsForm extends LitElement {
    static styles = styles;

    static properties = {
        editingPromotion: { type: Boolean, state: true },
        newPromotion: { type: Boolean, state: true },
        tags: { type: Array, state: true },
        surfaces: { type: Array, state: true },
        selectedSurfaces: { type: Array, state: true },
    };

    constructor() {
        super();
        this.editingPromotion = false;
        this.newPromotion = false;
        this.tags = [];
        this.surfaces = [];
        this.selectedSurfaces = [];
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    #handeTagsChange = (event) => {
        console.log(event);
        const value = event.target.getAttribute('value');
        this.tags = value ? value.split(',') : [];
    };

    #handleCloseAddSurfacesDialog = (event) => {
        this.selectedSurfaces.map((surface) => this.surfaces.push(SURFACES.find((s) => s.name === surface)));
        console.log('this.selectedSurfaces', this.selectedSurfaces);
        console.log('this.surfaces', this.surfaces);
        this.requestUpdate();
        const closeEvent = new Event('close', { bubbles: true, composed: true });
        event.target.dispatchEvent(closeEvent);
    };

    #handleSurfacesChange = (event) => {
        this.selectedSurfaces = event.target.selected;
    };

    #handleSurfaceDelete = (event) => {
        const deletedSurface = event.target.attributes.getNamedItem('value').value;
        console.log(`deletedSurface`, deletedSurface);
        this.surfaces = this.surfaces.filter((surface) => surface.name !== deletedSurface);
        this.selectedSurfaces = this.selectedSurfaces.filter((surface) => surface !== deletedSurface);
        console.log(`this.surfaces`, this.surfaces);
        console.log(`this.selectedSurfaces`, this.selectedSurfaces);
    };

    async #handleCreatePromotion() {
        // TODO: Validate form data
        console.log('this.tags', this.tags);
        console.log('this.surfaces', this.surfaces);
        console.log('this.selectedSurfaces', this.selectedSurfaces);

        const campaignTitle = this.renderRoot.querySelector('#campaignTitle').value;
        const promoCode = this.renderRoot.querySelector('#promoCode').value;
        const startDate = this.renderRoot.querySelector('#startDate').value;
        const endDate = this.renderRoot.querySelector('#endDate').value;

        const promotion = {
            name: normalizeKey(campaignTitle),
            title: campaignTitle,
            promoCode,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            tags: this.tags,
            surfaces: this.selectedSurfaces,
        };
        console.log('promotion:', promotion);

        const result = await this.repository.createPromotion(promotion);
        if (result) {
            showToast('Promotion successfully created.', 'positive');
        } else {
            showToast('Failed to create promotion.', 'negative');
        }
    }

    render() {
        return html`
            <div class="promotions-form-breadcrumb">
                <sp-breadcrumbs>
                    <sp-breadcrumb-item slot="root" href="/studio.html#page=promotions">Promotions</sp-breadcrumb-item>
                    <sp-breadcrumb-item value="trend">Campaign Creation</sp-breadcrumb-item>
                </sp-breadcrumbs>
            </div>
            <div class="promotions-form-container">
                <div class="promotions-form-header">
                    <h1>Create new Campaign</h1>
                </div>
                <div class="promotions-form-panel">
                    <div><h2>General Info</h2></div>
                    <div class="promotions-form-panel-content">
                        <div class="promotions-form-fields">
                            <sp-field-label for="campaignTitle" required>Campaign Title</sp-field-label>
                            <sp-textfield id="campaignTitle"></sp-textfield>
                            <sp-field-label for="promoCode">Promo Code</sp-field-label>
                            <sp-textfield id="promoCode"></sp-textfield>
                            <sp-field-label for="startDate" required>Start Day</sp-field-label>
                            <input type="date" id="startDate" />
                            <sp-field-label for="endDate" required>End Day</sp-field-label>
                            <input type="date" id="endDate" />
                            <sp-field-label>Tags</sp-field-label>
                            <aem-tag-picker-field
                                label="Tags"
                                namespace="/content/cq:tags/mas"
                                multiple
                                @change=${this.#handeTagsChange}
                            ></aem-tag-picker-field>
                        </div>
                        <sp-divider size="m" style="align-self: stretch; height: auto;" vertical></sp-divider>
                        <div class="promotions-form-surfaces">
                            <sp-field-label>Surfaces</sp-field-label>
                            <div class="promotions-form-surfaces-panel">
                                <div
                                    class="surfaces-empty-state"
                                    style="display: ${this.surfaces.length > 0 ? 'none' : 'flex'}"
                                >
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
                                <div class="surfaces-list">
                                    <sp-tags>
                                        ${repeat(
                                            this.surfaces,
                                            (surface) => html`
                                                <sp-tag value=${surface.name} deletable @delete=${this.#handleSurfaceDelete}
                                                    >${surface.label}</sp-tag
                                                >
                                            `,
                                        )}
                                        ${this.surfaces.length > 0
                                            ? html`
                                                  <sp-button variant="secondary" icon-only>
                                                      <sp-icon-add slot="icon" size="m"></sp-icon-add>
                                                  </sp-tag>
                                              `
                                            : nothing}
                                    </sp-tags>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="promotions-form-buttons">
                    <sp-button href="/studio.html#page=promotions">Cancel</sp-button>
                    <sp-button @click=${this.#handleCreatePromotion}>Create</sp-button>
                </div>
            </div>
        `;
    }

    renderAddSurfacesDialog() {
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
                <sp-table
                    selects="multiple"
                    scroller="true"
                    emphasized
                    id="surfaces-table"
                    @change=${this.#handleSurfacesChange}
                >
                    <sp-table-head>
                        <sp-table-head-cell>All surfaces</sp-table-head-cell>
                    </sp-table-head>
                    <sp-table-body>
                        ${repeat(
                            SURFACES,
                            (surface) => html`
                                <sp-table-row value=${surface.name}>
                                    <sp-table-cell>${surface.label}</sp-table-cell>
                                </sp-table-row>
                            `,
                        )}
                    </sp-table-body>
                </sp-table>
            </sp-dialog-wrapper>
        `;
    }
}
customElements.define('mas-promotions-form', MasPromotionsForm);
