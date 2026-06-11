import { css } from 'lit';
import { tableHeaderBaseStyles, tableBodyBaseStyles, tableCellBaseStyles } from './translation-common-styles.css.js';
import { skeletonStyles } from '../common/skeleton-styles.css.js';

export const styles = [
    skeletonStyles,
    tableHeaderBaseStyles,
    tableBodyBaseStyles,
    tableCellBaseStyles,
    css`
        .translation-container {
            padding: 32px;

            .translation-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;

                h2 {
                    font-size: 25px;
                    line-height: 30px;
                    font-weight: 700;
                    margin: 0;
                }
            }

            .translation-header-divider {
                width: 100%;
                margin-bottom: 12px;
            }

            .translation-toolbar {
                display: flex;
                align-items: center;
                gap: 12px;
                padding-bottom: 20px;

                .result-count {
                    font-size: 12px;
                    line-height: 16px;
                    font-weight: 400;
                }

                .result-count-number {
                    color: #292929;
                }

                .result-count-label {
                    color: #6e6e6e;
                }

                sp-search {
                    width: 452px;
                    min-width: 112px;
                    --mod-search-block-size: 32px;
                    --mod-search-border-radius: 16px;
                    --mod-search-border-width: 2px;
                    --mod-search-border-color-default: #dadada;
                    --mod-search-border-color-hover: #dadada;
                    --mod-search-background-color: #ffffff;
                    --mod-search-color-default: #292929;
                    --mod-search-font-weight: 400;
                    --mod-search-line-height: 18px;
                    --mod-search-edge-to-visual: 14px;
                    --mod-search-text-to-icon: 6px;
                    --mod-search-top-to-text: 7px;
                    --mod-search-bottom-to-text: 7px;
                    --mod-textfield-font-weight: 400;
                    --mod-textfield-placeholder-font-size: 14px;
                    --mod-textfield-top-to-text: 7px;
                    --mod-textfield-bottom-to-text: 7px;
                    font-size: 14px;
                }
            }

            .item-table {
                border: 1px solid #dadada;
                border-top-left-radius: 12px;
                border-top-right-radius: 12px;
                --mod-table-border-color: #dadada;
                --mod-table-divider-color: #dadada;
                --mod-table-border-radius: 0;
                --mod-table-border-width: 1px;
                --mod-table-header-background-color: #f3f3f3;
                --mod-table-header-text-color: #222222;
                --mod-table-header-font-size: 14px;
                --mod-table-header-font-weight: 700;
                --mod-table-header-line-height: 18px;
                --mod-table-header-text-transform: none;
                --mod-table-min-header-height: 44px;
                --mod-table-min-row-height: 68px;
                --mod-table-row-font-size: 14px;
                --mod-table-row-line-height: 18px;
                --mod-table-row-font-weight: 500;
                --mod-table-row-text-color: #292929;
                --mod-table-row-top-to-text: 16px;
                --mod-table-row-bottom-to-text: 16px;
                --mod-table-edge-to-content: 20px;

                sp-table-head-cell:nth-child(1),
                sp-table-cell:nth-child(1) {
                    width: 40%;
                }

                sp-table-head-cell:nth-child(2),
                sp-table-cell:nth-child(2),
                sp-table-head-cell:nth-child(3),
                sp-table-cell:nth-child(3),
                sp-table-head-cell:nth-child(4),
                sp-table-cell:nth-child(4) {
                    width: 20%;
                }

                sp-table-head-cell:last-child,
                sp-table-cell:last-child {
                    max-width: 100px;
                }

                sp-table-head-cell.align-right {
                    text-align: right;
                }

                sp-table-head-cell {
                    min-height: 44px;
                    padding-block: 13px;
                    border-bottom: 1px solid #dadada;
                    font-size: 14px;
                    line-height: 18px;
                    font-weight: 700;
                    color: #222222;
                }

                sp-table-head-cell.sortable {
                    cursor: pointer;
                }

                .sort-icon {
                    display: inline-flex;
                    align-items: center;
                    margin-right: 4px;
                    color: #292929;
                    vertical-align: middle;
                }

                .sort-icon sp-icon-sort-order-down,
                .sort-icon sp-icon-sort-order-up {
                    --mod-icon-size: 16px;
                    inline-size: 16px;
                    block-size: 16px;
                    color: #292929;
                    fill: currentColor;
                }

                sp-table-cell {
                    border-top: none;
                    border-bottom: 1px solid #dadada;
                }

                sp-table-row:last-of-type sp-table-cell {
                    border-bottom: none;
                }

                sp-table-cell:nth-child(1) {
                    font-weight: 700;
                    color: #222222;
                }

                .empty-cell {
                    font-size: 14px;
                    line-height: 18px;
                    font-weight: 500;
                    color: #222222;
                }

                sp-status-light {
                    --mod-statuslight-font-weight: 500;
                    --mod-statuslight-font-size: 14px;
                    --mod-statuslight-line-height: 18px;
                    --mod-statuslight-dot-size: 8px;
                    --mod-statuslight-spacing-top-to-label: 0;
                    --mod-statuslight-spacing-bottom-to-label: 0;
                    --mod-statuslight-spacing-top-to-dot: 0;
                    --mod-statuslight-spacing-dot-to-label: 6px;
                    --mod-statuslight-content-color-default: #292929;
                    --mod-statuslight-subdued-content-color-default: #292929;
                    --mod-statuslight-semantic-neutral-color: #808080;
                    --mod-statuslight-semantic-notice-color: #d29500;
                    --mod-statuslight-semantic-info-color: #4b75ff;
                    --mod-statuslight-semantic-negative-color: #f03823;
                    --mod-statuslight-semantic-positive-color: #079355;
                    align-items: center !important;
                    font-style: normal;
                }
            }

            .action-cell {
                display: flex;
                justify-content: center;
                --system-action-button-background-color-default: transparent;
            }

            sp-action-menu {
                --mod-popover-corner-radius: 10px;
                --mod-popover-background-color: #ffffff;
                --mod-popover-border-color: transparent;
                --mod-popover-border-width: 0;
                --mod-popover-filter: drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.12)) drop-shadow(0px 2px 6px rgba(0, 0, 0, 0.04))
                    drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.08));
            }

            sp-menu-item {
                --mod-menu-item-min-height: 32px;
                --mod-menu-item-label-inline-edge-to-content: 12px;
                --mod-menu-item-label-font-size: 14px;
                --mod-menu-item-label-line-height: 18px;
                --mod-menu-item-label-content-color-default: #292929;
                --mod-menu-item-label-content-color-hover: #292929;
                --mod-menu-item-label-content-color-focus: #292929;
                --mod-menu-item-icon-color-default: #292929;
                font-weight: 500;
            }
        }
    `,
];
