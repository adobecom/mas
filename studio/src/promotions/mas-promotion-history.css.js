import { css } from 'lit';

export const promotionHistoryStyles = css`
    :host {
        display: block;
        box-sizing: border-box;
        padding: 32px;
        color: var(--spectrum-gray-900, #222);
        font-family: var(--spectrum-sans-font-family-stack, 'Adobe Clean', sans-serif);
        font-size: 14px;
        line-height: 1.5;
    }

    * {
        box-sizing: border-box;
    }

    .history-layout {
        display: grid;
        grid-template-columns: 352px minmax(0, 1fr);
        align-items: start;
        gap: 20px;
    }

    aside,
    main {
        min-width: 0;
        padding: 20px;
        border: 1px solid var(--spectrum-gray-300, #d5d5d5);
        border-radius: 12px;
        background: var(--spectrum-background-layer-2-color, #fff);
    }

    main {
        min-height: 520px;
    }

    h1,
    h2,
    p {
        margin: 0;
    }

    h1 {
        font-size: 20px;
        line-height: 26px;
        font-weight: 700;
    }

    h2 {
        font-size: 18px;
        line-height: 24px;
    }

    .search-form {
        margin: 32px 0 24px;
    }

    sp-search {
        width: 100%;
        --spectrum-corner-radius-100: 16px;
        --mod-textfield-corner-radius: 16px;
        --mod-search-border-radius: 16px;
        --mod-textfield-border-color: var(--spectrum-gray-300, #d5d5d5);
    }

    .history-card {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
        min-height: 148px;
        margin: 0 0 20px;
        padding: 16px;
        gap: 4px;
        border: 2px solid var(--spectrum-gray-200, #e3e3e3);
        border-radius: 10px;
        background: transparent;
        color: inherit;
        text-align: left;
        font: inherit;
        cursor: pointer;
        overflow-wrap: anywhere;
    }

    .history-card.current {
        border-color: var(--spectrum-green-600, #009c59);
    }

    .history-card.selected {
        border-color: var(--spectrum-indigo-600, #5258ff);
    }

    .history-card:focus-visible,
    .group-toggle:focus-visible {
        outline: 2px solid var(--spectrum-blue-800, #0265dc);
        outline-offset: 3px;
    }

    .history-card:disabled {
        cursor: default;
    }

    .current-label {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0 0 10px;
        font-size: 14px;
    }

    .current-dot {
        width: 8px;
        height: 8px;
        flex-shrink: 0;
        border-radius: 50%;
        background: var(--spectrum-green-600, #009c59);
    }

    .version-label,
    .version-meta {
        font-size: 14px;
        line-height: 21px;
    }

    .version-author {
        font-size: 18px;
        line-height: 22px;
    }

    .card-summary {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: auto;
        padding-top: 24px;
        font-size: 14px;
    }

    .category-tag,
    .value-tag {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 6px;
        background: var(--spectrum-gray-200, #e9e9e9);
        color: var(--spectrum-gray-900, #222);
        font-size: 12px;
        line-height: 18px;
        overflow-wrap: anywhere;
        text-decoration: none;
    }

    .category-tag {
        padding-inline: 8px;
    }

    .details-heading {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 12px;
    }

    .details-heading h2 {
        margin-top: 2px;
    }

    .selection-toolbar {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
    }

    #restore-selected {
        --spectrum-button-background-color-default: var(--spectrum-gray-900, #292929);
        --spectrum-button-content-color-default: var(--spectrum-gray-50, #fff);
    }

    .change-group {
        margin-top: 12px;
        padding: 20px;
        border: 1px solid var(--spectrum-gray-300, #d5d5d5);
        border-radius: 12px;
    }

    .group-header {
        display: flex;
        align-items: center;
        gap: 6px;
        min-height: 24px;
    }

    .group-title {
        font-size: 16px;
        font-weight: 700;
    }

    .change-counts,
    .value-tags {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
    }

    .change-count,
    .change-badge {
        display: inline-block;
        flex-shrink: 0;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        line-height: 16px;
        white-space: nowrap;
    }

    .changed {
        color: var(--spectrum-indigo-700, #454dff);
        background: var(--spectrum-blue-100, #e5f0ff);
    }

    .added {
        color: var(--spectrum-green-800, #008c4e);
        background: var(--spectrum-green-100, #d5f6e0);
    }

    .removed {
        color: var(--spectrum-red-800, #d31510);
        background: var(--spectrum-red-100, #ffeceb);
    }

    .saved {
        color: var(--spectrum-gray-700, #6e6e6e);
        background: var(--spectrum-gray-100, #f5f5f5);
    }

    .group-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: auto;
        padding: 4px;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: inherit;
        cursor: pointer;
    }

    .group-body {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--spectrum-gray-200, #e5e5e5);
    }

    .change-row + .change-row,
    .change-line + .change-line {
        margin-top: 10px;
    }

    .change-line {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        min-height: 24px;
        overflow-wrap: anywhere;
    }

    .change-line sp-checkbox {
        flex-shrink: 0;
        margin-right: 0;
    }

    .field-label,
    .before {
        color: var(--spectrum-gray-600, #929292);
    }

    .before:not(.value-tags) {
        text-decoration: line-through;
    }

    .after {
        color: var(--spectrum-gray-1000, #000);
    }

    .change-arrow {
        font-size: 20px;
        line-height: 24px;
        color: var(--spectrum-gray-800, #505050);
    }

    .fragment-changes + .fragment-changes {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid var(--spectrum-gray-200, #e5e5e5);
    }

    .fragment-heading {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 12px;
    }

    .product-icon {
        width: 32px;
        height: 32px;
        flex-shrink: 0;
        object-fit: contain;
    }

    .fragment-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--spectrum-indigo-600, #5258ff);
        white-space: nowrap;
        font-size: 12px;
    }

    .muted,
    .row-warning {
        font-size: 12px;
        color: var(--spectrum-gray-700, #6e6e6e);
    }

    .row-warning {
        display: block;
        margin: 4px 0 0 24px;
    }

    .group-empty {
        margin: 0;
    }

    .details-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 20px;
    }

    .history-filters {
        margin-top: 12px;
        font-size: 12px;
    }

    .history-filters summary {
        display: flex;
        align-items: center;
        gap: 6px;
        width: fit-content;
        cursor: pointer;
        list-style: none;
    }

    .history-filters summary::-webkit-details-marker {
        display: none;
    }

    .history-filters form {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 12px;
    }

    .filter-active {
        color: var(--spectrum-blue-800, #0265dc);
    }

    .filter sp-textfield {
        width: 100%;
    }

    .sidebar-tools {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 8px;
        margin-top: 16px;
    }

    .empty,
    .loading {
        padding: 32px 16px;
        text-align: center;
        color: var(--spectrum-gray-700, #6e6e6e);
    }

    .error {
        display: flex;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
        padding: 12px;
        border: 1px solid var(--spectrum-red-700, #d7373f);
        border-radius: 8px;
        font-size: 13px;
    }

    @media (max-width: 1100px) {
        :host {
            padding: 24px;
        }
        .history-layout {
            grid-template-columns: 280px minmax(0, 1fr);
        }
    }

    @media (max-width: 760px) {
        :host {
            padding: 16px;
        }
        .history-layout {
            grid-template-columns: 1fr;
        }
    }
`;
