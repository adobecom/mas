import { css } from 'lit';

export const styles = css`
    :host {
        display: block;
    }

    :host([hidden]) {
        display: none;
    }

    :host([searchonly]) {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
        flex-wrap: wrap;
    }

    .result-count {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--spectrum-gray-700);
        font-size: 14px;
        white-space: nowrap;
    }

    .filters {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        flex-wrap: wrap;
    }

    .filters > overlay-trigger > sp-action-button,
    .filters > aem-tag-picker-field,
    .filters > mas-user-picker {
        --mod-actionbutton-background-color-default: var(--spectrum-gray-25);
        --mod-actionbutton-background-color-hover: var(--spectrum-gray-100);
        --mod-actionbutton-background-color-down: var(--spectrum-gray-200);
        --mod-actionbutton-background-color-focus: var(--spectrum-gray-100);
        --mod-actionbutton-border-color-default: var(--spectrum-gray-300);
        --mod-actionbutton-border-color-hover: var(--spectrum-gray-400);
        --mod-actionbutton-border-color-down: var(--spectrum-gray-500);
        --mod-actionbutton-border-color-focus: var(--spectrum-gray-400);
        --mod-actionbutton-border-width: 1px;
        --mod-actionbutton-border-radius: 8px;
        --mod-actionbutton-content-color-default: var(--spectrum-gray-800);
    }

    .filters > aem-tag-picker-field {
        min-height: 0;
    }

    sp-action-button {
        display: flex;
        flex-direction: row-reverse;
    }

    sp-action-button.template-filter {
        height: 32px;
    }

    .filter-popover {
        padding: 12px;
    }

    .filter-search {
        margin-bottom: 8px;
        width: 100%;
    }

    .checkbox-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: 300px;
        overflow-y: auto;
        min-width: 150px;
        padding-inline-start: 4px;
    }

    .checkbox-list sp-checkbox {
        display: flex;
        white-space: nowrap;
    }

    .applied-filters {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        flex-wrap: wrap;
    }

    .applied-filters sp-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .offer-filter {
        width: fit-content;
        --mod-picker-inline-size: auto;
    }
`;
