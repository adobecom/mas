import { html, nothing } from 'lit';

/** Item state of a multifield item inherited from a baseline (other states are the variation ones, e.g. `overridden`). */
export const BASELINE_FIELD_STATE = 'baseline';

function dispatchRestore(event) {
    event.preventDefault();
    event.currentTarget.blur();
    event.currentTarget.dispatchEvent(new CustomEvent('restore-field', { bubbles: true, composed: true }));
}

/** Status line under a multifield item: "From baseline", or an override link firing a composed `restore-field` event. */
export function itemStatusIndicator(fieldState) {
    if (fieldState === BASELINE_FIELD_STATE) {
        return html`<div class="field-status-indicator field-status-indicator--baseline">
            <span class="field-status-label">From baseline</span>
        </div>`;
    }
    if (fieldState !== 'overridden') return nothing;
    return html`<div class="field-status-indicator">
        <sp-icon-unlink class="field-status-icon"></sp-icon-unlink>
        <span class="field-status-label">Overridden.</span>
        <a href="#" class="field-status-restore-link" @click=${dispatchRestore}
            ><span class="field-status-restore-link-prefix" aria-hidden="true">Overridden. </span>
            <span class="field-status-restore-link-text">Click to restore.</span></a
        >
    </div>`;
}
