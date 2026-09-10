import { LitElement, html, nothing, css } from 'lit';
import { isPromotionTitleTaken } from './promotion-editor-utils.js';

class MasPromotionDuplicateDialog extends LitElement {
    static styles = css`
        sp-dialog-wrapper {
            z-index: 1000;
        }
    `;

    static properties = {
        proposedTitle: { type: String },
        open: { type: Boolean },
        existingTitles: { type: Array },
        newTitle: { state: true },
        duplicateVariations: { state: true },
    };

    constructor() {
        super();
        this.proposedTitle = '';
        this.open = false;
        this.existingTitles = [];
        this.newTitle = '';
        this.duplicateVariations = false;
    }

    willUpdate(changed) {
        if (changed.has('open') && this.open) {
            this.newTitle = this.proposedTitle;
            this.duplicateVariations = false;
        }
    }

    get isTitleTaken() {
        return isPromotionTitleTaken(this.newTitle, this.existingTitles);
    }

    confirm() {
        if (this.isTitleTaken) return;
        this.dispatchEvent(
            new CustomEvent('duplicate-confirmed', {
                bubbles: true,
                composed: true,
                detail: {
                    title: this.newTitle || this.proposedTitle,
                    duplicateVariations: this.duplicateVariations,
                },
            }),
        );
    }

    cancel() {
        this.dispatchEvent(new CustomEvent('duplicate-cancelled', { bubbles: true, composed: true }));
    }

    handleInput(e) {
        this.newTitle = e.target.value;
    }

    handleDuplicateVariationsChange(e) {
        this.duplicateVariations = e.target.checked;
    }

    render() {
        if (!this.open) return nothing;
        return html`
            <sp-dialog-wrapper
                open
                mode="modal"
                headline="Duplicate promo project"
                cancel-label="Cancel"
                confirm-label="Duplicate project"
                underlay
                no-divider
                @confirm=${this.confirm}
                @cancel=${this.cancel}
                @close=${this.cancel}
            >
                <p>Project title</p>
                <sp-textfield
                    .value=${this.newTitle}
                    @input=${this.handleInput}
                    placeholder="Project name"
                    autofocus
                    ?invalid=${this.isTitleTaken}
                >
                    ${this.isTitleTaken ? html`<span slot="negative-help-text">The title already exists.</span>` : nothing}
                </sp-textfield>
                <p>Do you want to include promo variations?</p>
                <sp-checkbox .checked=${this.duplicateVariations} @change=${this.handleDuplicateVariationsChange}>
                    Duplicate promo variations
                </sp-checkbox>
            </sp-dialog-wrapper>
        `;
    }
}

customElements.define('mas-promotion-duplicate-dialog', MasPromotionDuplicateDialog);
