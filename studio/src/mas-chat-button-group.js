import { LitElement, html, nothing } from 'lit';

export class MasChatButtonGroup extends LitElement {
    static properties = {
        buttons: { type: Array },
        selectedValue: { type: String, attribute: 'selected-value' },
        disabled: { type: Boolean },
        inputHint: { type: String, attribute: 'input-hint' },
    };

    constructor() {
        super();
        this.buttons = [];
        this.selectedValue = null;
        this.disabled = false;
        this.inputHint = null;
    }

    createRenderRoot() {
        return this;
    }

    handleButtonClick(button) {
        if (this.selectedValue || this.disabled) return;
        this.selectedValue = button.value;
        this.dispatchEvent(
            new CustomEvent('button-selected', {
                detail: { value: button.value, label: button.label },
                bubbles: true,
                composed: true,
            }),
        );
    }

    handleKeydown(event, button) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        this.handleButtonClick(button);
    }

    render() {
        if (!this.buttons?.length) return nothing;

        return html`
            <div class="chat-button-group">
                ${this.buttons.map((button) => {
                    const isSelected = this.selectedValue === button.value;
                    const isDisabled = this.disabled || (this.selectedValue && !isSelected);

                    return html`
                        <div
                            class="chat-option-pill ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
                            role="button"
                            tabindex=${isDisabled ? '-1' : '0'}
                            aria-pressed=${isSelected ? 'true' : 'false'}
                            aria-disabled=${isDisabled ? 'true' : 'false'}
                            @click=${() => this.handleButtonClick(button)}
                            @keydown=${(event) => this.handleKeydown(event, button)}
                        >
                            <span class="chat-option-pill-label">${button.label}</span>
                            ${isSelected
                                ? html`<sp-icon-checkmark-circle class="chat-option-pill-check"></sp-icon-checkmark-circle>`
                                : nothing}
                        </div>
                    `;
                })}
                ${this.inputHint && !this.selectedValue
                    ? html`<div class="button-group-hint">
                          <sp-icon-search size="s"></sp-icon-search>
                          ${this.inputHint}
                      </div>`
                    : nothing}
            </div>
        `;
    }
}

customElements.define('mas-chat-button-group', MasChatButtonGroup);
