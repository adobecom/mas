import { LitElement, html, nothing, css } from 'lit';
import { isPromotionTitleTaken } from './promotion-editor-utils.js';
import { normalizeKey } from '../utils.js';

class MasPromotionDuplicateDialog extends LitElement {
    static styles = css`
        sp-dialog-wrapper {
            z-index: 1000;
            --mod-dialog-min-inline-size: 420px;
            --mod-dialog-confirm-padding-grid: 24px;
        }

        p {
            margin: 0 0 8px;
        }

        p:not(:first-child) {
            margin-top: 24px;
        }

        sp-textfield {
            width: 100%;
            --spectrum-textfield-input-line-height: 20px;
        }

        .validation-message {
            display: block;
            margin-top: var(--spectrum-spacing-100, 8px);
            color: var(--spectrum-negative-color, red);
            font-size: var(--spectrum-font-size-75, 12px);
            visibility: hidden;
        }

        .validation-message.is-visible {
            visibility: visible;
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

    #isTitleInvalidFor(titleTaken) {
        return !normalizeKey(this.newTitle?.trim()) || titleTaken;
    }

    get isTitleInvalid() {
        return this.#isTitleInvalidFor(this.isTitleTaken);
    }

    confirm() {
        if (this.isTitleInvalid) return;
        this.dispatchEvent(
            new CustomEvent('duplicate-confirmed', {
                bubbles: true,
                composed: true,
                detail: {
                    title: this.newTitle,
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
        const titleTaken = this.isTitleTaken;
        const titleInvalid = this.#isTitleInvalidFor(titleTaken);
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
                    ?invalid=${titleInvalid}
                ></sp-textfield>
                <span class="validation-message ${titleInvalid ? 'is-visible' : ''}"
                    >${titleTaken ? 'The title already exists.' : 'Please enter a valid title.'}</span
                >
                <p>Do you want to include promo variations?</p>
                <sp-checkbox .checked=${this.duplicateVariations} @change=${this.handleDuplicateVariationsChange}>
                    Duplicate promo variations
                </sp-checkbox>
            </sp-dialog-wrapper>
        `;
    }
}

customElements.define('mas-promotion-duplicate-dialog', MasPromotionDuplicateDialog);
