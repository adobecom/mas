import { css } from 'lit';
import {
    tableColumnIconStyles,
    tableCellBaseStyles,
    tableSelectedRowStyles,
    loadingContainerFlexStyles,
    textWithTooltipStyles,
    ghostButtonStyles,
    scrollableTableStyles,
} from '../common/styles/table-styles.css.js';

export const styles = [
    tableColumnIconStyles,
    tableCellBaseStyles,
    tableSelectedRowStyles,
    loadingContainerFlexStyles,
    textWithTooltipStyles,
    ghostButtonStyles,
    scrollableTableStyles,
    css`
        :host {
            display: block;
            width: 100%;
            box-sizing: border-box;
        }

        .loading-container--flex {
            padding: 10px;
            width: 100%;
        }

        .title,
        .path,
        .offer-id,
        .osi {
            min-width: 0;
            overflow: hidden;
        }

        .path {
            overlay-trigger {
                min-width: 0;
            }

            div:not([slot='trigger']) {
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
        }

        .title {
            overlay-trigger {
                min-width: 0;
            }

            div {
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
        }

        .offer-id,
        .osi {
            color: var(--spectrum-blue-900);

            overlay-trigger {
                min-width: 0;
            }

            div {
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                margin-right: 4px;
            }

            div:hover {
                text-decoration: underline;
                color: var(--spectrum-blue-1000);
            }

            sp-action-button {
                --mod-actionbutton-content-color-default: var(--spectrum-blue-900);

                &:hover {
                    --mod-actionbutton-background-color-hover: var(--spectrum-blue-300);
                    --mod-actionbutton-background-color-hover-selected: var(--spectrum-blue-300);
                }

                &:active {
                    --mod-actionbutton-background-color-down: var(--spectrum-blue-400);
                    --mod-actionbutton-background-color-down-selected: var(--spectrum-blue-400);
                }

                &:focus,
                &:focus-visible {
                    --mod-actionbutton-background-color-focus: var(--spectrum-blue-400);
                    --mod-actionbutton-background-color-focus-selected: var(--spectrum-blue-400);
                }
            }
            sp-tooltip {
                word-break: break-all;
            }
        }

        .osi {
            .copyable-value {
                display: flex;
                align-items: center;
                gap: 4px;
                min-width: 0;
                overflow: hidden;
            }

            overlay-trigger {
                flex: 1;
            }

            sp-action-button {
                flex: 0 0 auto;
            }
        }

        .details-cell {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
        }

        .details-label {
            color: var(--spectrum-gray-700);
        }

        .tags-label {
            margin-left: 6px;
        }

        .promo-variations-table {
            --column-width: 10rem;
            --actions-column-width: 6rem;
            --status-column-width: 7rem;

            border: 1px solid var(--spectrum-gray-300);
            border-radius: 12px;

            .actions-head-cell,
            .actions-cell {
                flex: 1 0 var(--actions-column-width);
            }

            .status-head-cell,
            .status-cell {
                flex: 1 0 var(--status-column-width);
            }

            .offer-head-cell,
            .offer-cell,
            .title-head-cell,
            .title,
            .path-head-cell,
            .path,
            .related-pages-head-cell,
            .related-pages,
            .country-head-cell,
            .country,
            .offer-id-head-cell,
            .offer-id,
            .osi-head-cell,
            .osi,
            .applies-to-head-cell,
            .applies-to-cell {
                flex: 1 0 var(--column-width);
            }

            sp-table-head {
                width: max-content;
                min-width: 100%;
                background: var(--spectrum-gray-75);
                border-top-left-radius: 12px;
                border-top-right-radius: 12px;
            }

            sp-table-head-cell {
                display: flex;
                align-items: center;
                border-bottom: 1px solid var(--spectrum-gray-300);
            }

            sp-table-head-cell:first-of-type,
            .select-all-row {
                border-top-left-radius: 12px;
            }

            sp-table-head-cell:last-of-type,
            .select-all-row {
                border-top-right-radius: 12px;
            }
        }

        .related-pages sp-action-button {
            --mod-actionbutton-content-color-default: var(--spectrum-blue-900);
            --mod-actionbutton-edge-to-text: 0;
        }

        .country {
            min-width: 0;
            overflow-wrap: anywhere;
        }

        sp-tabs {
            padding: 0 20px 16px 0;
            background-color: var(--spectrum-gray-50);
        }

        sp-tab-panel {
            padding-top: 16px;
        }

        sp-tab-panel sp-table-body {
            border: none;
        }

        .nested-content-container {
            background-color: var(--spectrum-gray-50);
        }

        .nested-content {
            margin-left: 30px;
        }

        .nested-content sp-table {
            width: 100%;
        }

        .nested-content .promo-variations-table {
            width: max-content;
            min-width: 100%;
            flex-shrink: 0;
        }

        .nested-content sp-table-body > sp-table-row:first-of-type:not(.variation-details-row) {
            sp-table-cell:first-of-type {
                border-top-left-radius: 12px;
            }

            sp-table-cell:last-of-type {
                border-top-right-radius: 12px;
            }
        }

        .nested-content sp-table-body > sp-table-row:last-of-type:not(.variation-details-row) {
            sp-table-cell:first-of-type {
                border-bottom-left-radius: 12px;
            }

            sp-table-cell:last-of-type {
                border-bottom-right-radius: 12px;
            }
        }

        /* Promo variation rows in the promotions-editor table are wrapped in an anchor
           (for native "open in new tab"), which makes each row an only-child of its own
           anchor; :first-of-type/:last-of-type on sp-table-row above no longer reach them,
           so the same corner rounding is re-applied relative to the anchor siblings. */
        .nested-content sp-table-body a:first-of-type > sp-table-row {
            sp-table-cell:first-of-type {
                border-top-left-radius: 12px;
            }

            sp-table-cell:last-of-type {
                border-top-right-radius: 12px;
            }
        }

        .nested-content sp-table-body a:last-of-type > sp-table-row {
            sp-table-cell:first-of-type {
                border-bottom-left-radius: 12px;
            }

            sp-table-cell:last-of-type {
                border-bottom-right-radius: 12px;
            }
        }

        .nested-content .promo-variations-table sp-table-body sp-table-row:first-of-type:not(.variation-details-row) {
            sp-table-cell:first-of-type {
                border-top-left-radius: 0;
            }

            sp-table-cell:last-of-type {
                border-top-right-radius: 0;
            }
        }

        sp-table-row.select-all-row {
            background: var(--spectrum-gray-50);

            sp-table-cell:first-of-type {
                padding: 10px 28px;
            }

            sp-table-cell {
                background-color: transparent;
            }
        }

        .select-all-label {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .fragment-count {
            font-size: var(--spectrum-font-size-75);
            color: var(--spectrum-gray-700);
            white-space: nowrap;
        }

        .offer-cell {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .mnemonic-icon {
            width: 32px;
            height: 32px;
            object-fit: contain;
            flex-shrink: 0;
        }

        .preview-cell {
            justify-content: flex-start;
            text-align: start;
        }

        .preview-cell sp-icon-preview {
            cursor: default;
        }

        .actions-head-cell,
        .actions-cell {
            max-width: 86px;
        }

        .actions-cell {
            justify-content: flex-start;
            align-items: center;
        }

        .actions-cell sp-action-menu {
            flex: 0 0 auto;
        }

        .variation-details-row {
            sp-table-cell {
                background-color: var(--spectrum-gray-50);
            }

            sp-table-cell:first-of-type {
                padding: 25px;
                flex: 0;
            }

            sp-table-cell:nth-of-type(2) {
                padding: 22px;
                flex: 0;
            }

            sp-tag {
                --mod-tag-background-color: var(--spectrum-gray-100);
                --mod-tag-border-color: transparent;
            }
        }

        .ghost-button {
            width: 40px;
            height: 40px;
        }
    `,
];
