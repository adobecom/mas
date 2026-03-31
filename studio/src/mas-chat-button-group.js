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

    render() {
        if (!this.buttons?.length) return nothing;

        return html`
            <div class="chat-button-group">
                ${this.buttons.map(
                    (button) => html`
                        <sp-action-button
                            size="s"
                            ?selected=${this.selectedValue === button.value}
                            ?disabled=${this.disabled || (this.selectedValue && this.selectedValue !== button.value)}
                            @click=${() => this.handleButtonClick(button)}
                        >
                            ${button.label}
                        </sp-action-button>
                    `,
                )}
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
