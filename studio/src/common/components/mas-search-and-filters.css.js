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
        --mod-actionbutton-min-width: 64px;
        --mod-actionbutton-height: 32px;
        --mod-actionbutton-border-radius: 8px;
        --mod-actionbutton-border-color-default: #dadada;
        --mod-actionbutton-border-color-hover: #dadada;
        --spectrum-actionbutton-border-color: #dadada;
        --spectrum-actionbutton-border-color-default: #dadada;
        --mod-actionbutton-border-width: 2px;
        --mod-actionbutton-background-color-default: #ffffff;
        --mod-actionbutton-content-color-default: #292929;
        --mod-actionbutton-content-color-hover: #292929;
        --mod-actionbutton-font-size: 14px;
        --mod-actionbutton-edge-to-text: 12px;
        --mod-actionbutton-edge-to-visual-only: 11px;
        --mod-actionbutton-text-to-visual: 6px;
        --mod-actionbutton-icon-size: 10px;
        font-weight: 400;
        line-height: 18px;
        justify-content: start;
        align-items: center;
    }

    sp-action-button .picker-chevron {
        order: 2;
        --mod-icon-size: 10px;
        inline-size: 10px;
        block-size: 10px;
        color: #292929;
        transform: rotate(90deg);
        margin-inline-start: 0;
        margin-inline-end: 0;
    }

    sp-action-button.template-filter {
        height: 32px;
    }

    .filter-popover {
        padding: 8px;
        border-radius: 10px;
        background: #ffffff;
        width: max-content;
        max-width: none;
        display: flex;
        flex-direction: column;
        gap: 12px;
        --mod-popover-corner-radius: 10px;
        --mod-popover-background-color: #ffffff;
        --mod-popover-border-color: transparent;
        --mod-popover-border-width: 0;
        --mod-popover-filter: drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.12)) drop-shadow(0px 2px 6px rgba(0, 0, 0, 0.04))
            drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.08));
    }

    .checkbox-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        overflow-x: hidden;
        width: max-content;
        min-width: 200px;
    }

    .filter-popover--template .checkbox-list,
    .filter-popover--product .checkbox-list {
        max-height: 300px;
        overflow-y: auto;
        padding-right: 8px;
    }

    .checkbox-list sp-checkbox {
        display: flex;
        align-items: center;
        white-space: nowrap;
        min-height: 32px;
        padding: 0 12px;
        border-radius: 8px;
        cursor: pointer;
        --mod-checkbox-label-font-size: 14px;
        --mod-checkbox-label-line-height: 18px;
        --mod-checkbox-label-font-weight: 400;
        --mod-checkbox-spacing-label-to-controls: 10px;
        --mod-checkbox-top-to-text: 0;
        --mod-checkbox-control-color-default: #292929;
        --mod-checkbox-control-border-width: 2px;
        --mod-checkbox-control-border-radius: 4px;
        --mod-checkbox-focus-indicator-thickness: 0;
        --mod-checkbox-focus-indicator-color: transparent;
    }

    .checkbox-list sp-checkbox:hover {
        background-color: #f0f0f0;
    }

    .filter-popover-search {
        width: 100%;
        min-width: 200px;
        --mod-search-block-size: 32px;
        --mod-search-border-radius: 16px;
        --mod-search-border-width: 2px;
        --mod-search-border-color-default: #dadada;
        --mod-search-border-color-hover: #dadada;
        --mod-search-focus-indicator-thickness: 0;
        --mod-search-focus-indicator-gap: 0;
        --mod-search-focus-indicator-color: transparent;
    }

    .filter-popover-empty {
        padding: 8px 12px;
        font-size: 14px;
        line-height: 18px;
        color: #6e6e6e;
    }

    .filter-popover--marketSegment .checkbox-list sp-checkbox {
        text-transform: uppercase;
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
`;
