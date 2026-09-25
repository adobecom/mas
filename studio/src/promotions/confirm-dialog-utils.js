import { html, nothing } from 'lit';

/**
 * Shared confirm-dialog behavior for promotions views. Operates on the host component's
 * `isDialogOpen` / `dialogCheckboxChecked` / `confirmDialogConfig` reactive properties.
 * @param {import('lit').LitElement} component
 * @param {string} title
 * @param {string} message
 * @param {{ confirmText?: string, cancelText?: string, variant?: string, question?: string, checkboxLabel?: string, checkboxDefault?: boolean }} options
 * @returns {Promise<boolean|{ confirmed: boolean, checked: boolean }>} plain boolean when no checkboxLabel is provided, otherwise `{ confirmed, checked }`
 */
export function showConfirmDialog(component, title, message, options = {}) {
    const {
        confirmText = 'OK',
        cancelText = 'Cancel',
        variant = 'primary',
        question = null,
        checkboxLabel = null,
        checkboxDefault = false,
    } = options;

    if (component.isDialogOpen) {
        return Promise.resolve(checkboxLabel ? { confirmed: false, checked: false } : false);
    }

    component.isDialogOpen = true;
    component.dialogCheckboxChecked = checkboxDefault;

    return new Promise((resolve) => {
        component.confirmDialogConfig = {
            title,
            message,
            confirmText,
            cancelText,
            variant,
            question,
            checkboxLabel,
            onConfirm: () => resolve(checkboxLabel ? { confirmed: true, checked: component.dialogCheckboxChecked } : true),
            onCancel: () => resolve(checkboxLabel ? { confirmed: false, checked: false } : false),
        };
    });
}

/**
 * @param {import('lit').LitElement} component
 * @param {string} dialogId
 * @returns {import('lit').TemplateResult|typeof nothing}
 */
export function renderConfirmDialog(component, dialogId) {
    if (!component.confirmDialogConfig) return nothing;

    const { title, message, onConfirm, onCancel, confirmText, cancelText, variant, question, checkboxLabel } =
        component.confirmDialogConfig;

    const close = () => {
        component.confirmDialogConfig = null;
        component.isDialogOpen = false;
        component.dialogCheckboxChecked = false;
    };

    return html`
        <div class="confirm-dialog-overlay">
            <sp-dialog-wrapper
                open
                underlay
                id=${dialogId}
                .headline=${title}
                .variant=${variant || 'negative'}
                .confirmLabel=${confirmText}
                .cancelLabel=${cancelText}
                @confirm=${() => {
                    onConfirm && onConfirm();
                    close();
                }}
                @cancel=${() => {
                    onCancel && onCancel();
                    close();
                }}
            >
                <div>${message}</div>
                ${question ? html`<div>${question}</div>` : nothing}
                ${checkboxLabel
                    ? html`<sp-checkbox
                          .checked=${component.dialogCheckboxChecked}
                          @change=${(e) => {
                              component.dialogCheckboxChecked = e.target.checked;
                          }}
                          >${checkboxLabel}</sp-checkbox
                      >`
                    : nothing}
            </sp-dialog-wrapper>
        </div>
    `;
}
