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
        gap: 12px;
        margin-bottom: 8px;
        flex-wrap: wrap;
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
