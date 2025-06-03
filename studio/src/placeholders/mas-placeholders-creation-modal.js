import { LitElement, html } from 'lit';
import { MasRepository } from '../mas-repository.js';
import { normalizeKey, showToast } from '../utils.js';

const initialPlaceholder = {
    key: '',
    isRichText: false,
    value: '',
};

class MasPlaceholdersCreationModal extends LitElement {
    static properties = {
        placeholder: { type: Object, state: true },
        onClose: { type: Function, reflect: false },
        saving: { type: Boolean, state: true },
    };

    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        this.onClose = null;
        this.placeholder = initialPlaceholder;
        this.saving = false;
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    handleKeyChange(event) {
        this.placeholder = {
            ...this.placeholder,
            key: normalizeKey(event.target.value),
        };
    }

    handleLocaleChange(event) {
        this.placeholder = {
            ...this.placeholder,
            locale: event.target.value,
        };
    }

    handleIsRickText(event) {
        this.placeholder = {
            ...this.placeholder,
            isRichText: event.target.checked,
        };
    }

    handleValueChange(event) {
        this.placeholder = {
            ...this.placeholder,
            value: event.target.value,
        };
    }

    async createPlaceholder() {
        if (this.saving) return;
        if (!this.placeholder.key || !this.placeholder.value) {
            showToast('Key and Value are required.', 'negative');
            return;
        }

        this.saving = true;
        const success = await this.repository.createPlaceholder(
            this.placeholder,
        );
        this.saving = false;
        if (!success) return;
        this.dispatchEvent(new CustomEvent('save'));
        showToast('Successfully created fragment', 'positive');
        this.onClose();
    }

    render() {
        return html`
            <sp-dialog-wrapper
                type="modal"
                headline="Create New Placeholder"
                underlay
                confirm-label="Create"
                cancel-label="Cancel"
                open
                @close=${this.onClose}
                @confirm=${this.createPlaceholder}
                @cancel=${this.onClose}
            >
                <div class="dialog-content">
                    <form
                        @submit=${(e) => {
                            e.preventDefault();
                            this.createPlaceholder();
                        }}
                    >
                        <div class="form-field">
                            <sp-field-label for="placeholder-key" required>
                                Key
                            </sp-field-label>
                            <sp-textfield
                                id="placeholder-key"
                                placeholder="Enter key"
                                .value=${this.placeholder.key || ''}
                                @input=${this.handleKeyChange}
                                .disabled=${this.saving}
                            ></sp-textfield>
                        </div>

                        <div class="form-field">
                            <sp-field-label for="placeholder-locale" required>
                                Locale
                            </sp-field-label>
                            <mas-locale-picker
                                id="placeholder-locale"
                                ?disabled=${this.saving}
                                @locale-changed=${this.handleLocaleChange}
                            ></mas-locale-picker>
                        </div>

                        <div class="form-field">
                            <sp-field-label for="rich-text-toggle">
                                Rich Text
                            </sp-field-label>
                            <sp-switch
                                id="rich-text-toggle"
                                @change=${this.handleIsRickText}
                                .checked=${this.placeholder.isRichText}
                                .disabled=${this.saving}
                            >
                                Enable Rich Text
                            </sp-switch>
                        </div>

                        <div class="form-field">
                            <sp-field-label for="placeholder-value" required>
                                Value
                            </sp-field-label>
                            ${this.placeholder.isRichText
                                ? html`
                                      <div class="rte-container">
                                          <rte-field
                                              id="placeholder-rich-value"
                                              link
                                              .maxLength=${500}
                                              @change=${this.handleValueChange}
                                              .disabled=${this.saving}
                                          ></rte-field>
                                      </div>
                                  `
                                : html`
                                      <sp-textfield
                                          id="placeholder-value"
                                          placeholder="Enter value"
                                          .value=${this.placeholder.value}
                                          @input=${this.handleValueChange}
                                          .disabled=${this.saving}
                                      ></sp-textfield>
                                  `}
                        </div>
                    </form>
                </div>
            </sp-dialog-wrapper>
        `;
    }
}

customElements.define(
    'mas-placeholders-creation-modal',
    MasPlaceholdersCreationModal,
);
