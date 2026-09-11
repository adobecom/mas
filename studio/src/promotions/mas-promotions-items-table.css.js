import { css } from 'lit';

export const promotionsItemsTableStyles = css`
    :host {
        width: 100%;
        display: flex;
        min-height: 0;
    }

    .promotions-view-only .offer-cell {
        display: flex;
        align-items: center;
        gap: var(--spectrum-spacing-100);
        min-width: 0;
    }

    .promotions-view-only .mnemonic-icon {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
    }

    .promotions-view-only sp-table-cell,
    .promotions-view-only sp-table-head-cell {
        word-break: normal;
        overflow-wrap: anywhere;
    }

    .promotions-view-only .actions-cell {
        justify-content: flex-start;
        align-items: center;
    }

    .promotions-view-only .actions-cell sp-action-menu {
        flex: 0 0 auto;
    }

    .promotions-view-only .expand-cell {
        flex: 0 0 2.5rem;
        width: 2.5rem;
        min-width: 2.5rem;
        max-width: 2.5rem;
        justify-content: center;
    }

    .promotions-offers-layout .promo-code-head-cell,
    .promotions-offers-layout .promo-code-cell {
        justify-content: center;
        text-align: center;
    }

    .promotions-view-only .expand-cell sp-icon-chevron-down {
        transition: transform 0.2s;
    }

    .promotions-view-only .expand-cell sp-icon-chevron-down.expanded {
        transform: rotate(180deg);
    }

    .promotions-view-only .detail-row {
        width: 100%;
    }

    .promotions-offers-layout {
        --offer-expand-column-width: 2.5rem;
        --offer-actions-column-width: 4.5rem;
        --offer-promo-actions-gap: var(--spectrum-spacing-500);
        --offer-detail-end-inset: calc(
            var(--offer-actions-column-width) + var(--offer-promo-actions-gap) + var(--spectrum-spacing-200)
        );
    }

    .promotions-offers-layout sp-table-body > sp-table-row.offer-row {
        border-bottom: 1px solid var(--spectrum-gray-200);
    }

    .promotions-offers-layout sp-table-body > sp-table-row.offer-row > sp-table-cell {
        border-bottom: 0;
    }

    .promotions-offers-layout .detail-row sp-table-cell.detail-cell-full {
        flex: 1 1 100%;
        width: 100%;
        max-width: 100%;
        min-width: 0;
        box-sizing: border-box;
        background: var(--spectrum-gray-75);
        padding-block: var(--spectrum-spacing-200);
        padding-inline-start: calc(var(--offer-expand-column-width) + var(--spectrum-spacing-200));
        padding-inline-end: var(--offer-detail-end-inset);
        display: block;
    }

    .promotions-view-only .offer-detail-content {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: var(--spectrum-spacing-200);
        width: 100%;
        min-width: 0;
    }

    .promotions-view-only .detail-offer-id {
        font-size: var(--spectrum-font-size-75);
        color: var(--spectrum-gray-800);
        line-height: 1.4;
    }

    .promotions-view-only .detail-offer-id strong {
        font-weight: 600;
        margin-inline-end: var(--spectrum-spacing-75);
    }

    .promotions-view-only .detail-offer-id span {
        overflow-wrap: anywhere;
    }

    .promotions-view-only .offer-promo-codes-table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--spectrum-font-size-75);
        color: var(--spectrum-gray-800);
        table-layout: fixed;
    }

    .promotions-view-only .offer-promo-codes-table th,
    .promotions-view-only .offer-promo-codes-table td {
        border: 1px solid var(--spectrum-gray-200);
        padding: 10px 20px;
        text-align: left;
        vertical-align: top;
    }

    .promotions-view-only .offer-promo-codes-table th {
        background: var(--spectrum-gray-100);
        font-weight: 600;
    }

    .promotions-view-only .offer-promo-codes-table th:first-child,
    .promotions-view-only .offer-promo-codes-table td:first-child {
        width: 32%;
    }

    .promotions-view-only .offer-promo-codes-table th:last-child,
    .promotions-view-only .offer-promo-codes-table td:last-child {
        width: 68%;
    }

    .promotions-view-only .offer-promo-codes-table tbody td {
        background: var(--spectrum-white);
    }

    .promotions-view-only .offer-promo-codes-table td:first-child {
        font-family: var(--spectrum-code-font-family, monospace);
        white-space: nowrap;
    }

    .promotions-offers-layout sp-table-row.offer-row {
        cursor: pointer;
    }

    .promotions-view-only sp-action-menu {
        --mod-actionbutton-edge-to-text: 6px;
    }

    .promotions-view-only {
        width: 100%;
        min-width: 100%;
        box-sizing: border-box;
        flex: 0 1 auto;
        overflow: visible;
    }

    .promotions-view-only sp-table-head,
    .promotions-view-only sp-table-body {
        width: 100%;
        box-sizing: border-box;
    }

    .promotions-view-only sp-table-head {
        display: flex;
        min-width: 0;
    }

    .promotions-view-only sp-table-row {
        min-width: 0;
    }

    .promotions-view-only sp-table-head-cell {
        display: flex;
        align-items: center;
    }

    .promotions-offers-layout sp-table-head-cell,
    .promotions-offers-layout sp-table-cell {
        justify-content: flex-start;
        text-align: start;
    }

    .promotions-offers-layout sp-table-head-cell:nth-child(1),
    .promotions-offers-layout sp-table-cell:nth-child(1) {
        flex: 0 0 var(--offer-expand-column-width);
        width: var(--offer-expand-column-width);
        min-width: var(--offer-expand-column-width);
        max-width: var(--offer-expand-column-width);
    }

    .promotions-offers-layout sp-table-head-cell:nth-child(2),
    .promotions-offers-layout sp-table-cell:nth-child(2) {
        flex: 1.1 1 0;
        min-width: 0;
    }

    .promotions-offers-layout sp-table-head-cell:nth-child(3),
    .promotions-offers-layout sp-table-cell:nth-child(3),
    .promotions-offers-layout sp-table-head-cell:nth-child(4),
    .promotions-offers-layout sp-table-cell:nth-child(4),
    .promotions-offers-layout sp-table-head-cell:nth-child(5),
    .promotions-offers-layout sp-table-cell:nth-child(5),
    .promotions-offers-layout sp-table-head-cell:nth-child(6),
    .promotions-offers-layout sp-table-cell:nth-child(6),
    .promotions-offers-layout sp-table-head-cell:nth-child(7),
    .promotions-offers-layout sp-table-cell:nth-child(7) {
        flex: 0.75 1 0;
        min-width: 5rem;
    }

    .promotions-offers-layout sp-table-head-cell:nth-child(8),
    .promotions-offers-layout sp-table-cell:nth-child(8) {
        flex: 0 0 calc(5.5rem + var(--offer-promo-actions-gap));
        width: calc(5.5rem + var(--offer-promo-actions-gap));
        min-width: calc(5.5rem + var(--offer-promo-actions-gap));
        max-width: calc(5.5rem + var(--offer-promo-actions-gap));
        white-space: nowrap;
        padding-inline-end: var(--offer-promo-actions-gap);
        box-sizing: border-box;
    }

    .promotions-offers-layout sp-table-head-cell:nth-child(9),
    .promotions-offers-layout sp-table-cell:nth-child(9) {
        flex: 0 0 calc(var(--offer-actions-column-width) + var(--spectrum-spacing-300));
        width: calc(var(--offer-actions-column-width) + var(--spectrum-spacing-300));
        min-width: calc(var(--offer-actions-column-width) + var(--spectrum-spacing-300));
        max-width: calc(var(--offer-actions-column-width) + var(--spectrum-spacing-300));
        white-space: nowrap;
        padding-inline-end: var(--spectrum-spacing-300);
        box-sizing: border-box;
    }

    .offers-empty-state {
        display: flex;
        flex-direction: row;
        gap: 12px;
        padding: 12px;
        border: 2px dashed var(--spectrum-gray-400);
        border-radius: 8px;
        width: 100%;
        box-sizing: border-box;
    }

    .offers-empty-state .label {
        align-content: center;
    }

    .offers-empty-state sp-button {
        background: white;
    }

    sp-dialog-wrapper {
        z-index: 11;
    }
`;
