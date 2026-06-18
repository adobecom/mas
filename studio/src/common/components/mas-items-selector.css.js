import { css } from 'lit';
import { ghostButtonStyles } from '../styles/table-styles.css.js';

export const styles = [
    ghostButtonStyles,
    css`
        .search-filters-group {
            display: flex;
            flex-direction: column;
            gap: 0;
        }

        .dialog-header {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .dialog-header .result-count {
            font-size: 12px;
            line-height: 16px;
            font-weight: 400;
            white-space: nowrap;
        }

        .dialog-header .result-count-number {
            color: #292929;
        }

        .dialog-header .result-count-label {
            color: #6e6e6e;
        }

        .dialog-header sp-search {
            width: 452px;
            flex: 0 0 auto;
            --mod-search-block-size: 32px;
            --mod-search-border-radius: 16px;
            --mod-search-border-width: 2px;
            --mod-search-border-color-default: #dadada;
            --mod-search-border-color-hover: #dadada;
            --mod-search-focus-indicator-thickness: 0;
            --mod-search-focus-indicator-gap: 0;
            --mod-search-focus-indicator-color: transparent;
        }

        sp-tabs {
            --mod-tabs-font-weight: 400;
            --mod-tabs-font-size: 14px;
            --mod-tabs-line-height: 18px;
            --mod-tabs-item-height: 48px;
            --mod-tabs-color: #505050;
            --mod-tabs-color-hover: #292929;
            --mod-tabs-color-selected: #292929;
            --mod-tabs-color-key-focus: #292929;
            --mod-tabs-divider-size: 2px;
            --mod-tabs-divider-background-color: #e1e1e1;
            --spectrum-tabs-divider-background-color: #e1e1e1;
            --mod-tabs-selection-indicator-color: #292929;
            --mod-tabs-start-to-item-quiet: 0;
            --mod-tabs-focus-ring-color: transparent;
            --mod-tabs-focus-indicator-color: transparent;
            --mod-tabs-focus-indicator-thickness: 0;
            --spectrum-focus-indicator-color: transparent;
            --spectrum-focus-indicator-thickness: 0;
        }

        sp-tab {
            --mod-tabs-focus-ring-color: transparent;
            --mod-tabs-focus-indicator-color: transparent;
            --mod-tabs-focus-indicator-thickness: 0;
            --spectrum-focus-indicator-color: transparent;
            --spectrum-focus-indicator-thickness: 0;
        }

        sp-tab:focus:not(:focus-visible),
        sp-tab:focus-within:not(:focus-visible) {
            outline: none;
        }

        sp-tab + sp-tab {
            margin-inline-start: 32px;
        }

        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            min-width: 80vw;
            min-height: 0;
        }

        sp-tabs {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            position: relative;
        }

        sp-tabs::after {
            content: '';
            position: absolute;
            top: 46px;
            left: 0;
            right: 0;
            height: 2px;
            background: #e1e1e1;
            border-radius: 2px;
            pointer-events: none;
            z-index: 0;
        }

        sp-tab-panel[selected] {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            gap: 12px;
            padding-top: 32px;
        }

        .container {
            display: flex;
            flex-direction: row;
            flex: 1;
            min-height: 0;
            width: 100%;
            padding-bottom: 0;
            gap: 12px;
        }

        mas-select-items-table {
            flex: 1 1 auto;
            min-width: 0;
            min-height: 0;
            display: flex;
            overflow-x: auto;
        }

        mas-selected-items {
            min-width: 0;
            width: 308px;
        }

        .container:not(.show-selected) mas-selected-items {
            display: none;
        }

        mas-selected-items.selected-items-panel {
            flex: 0 0 279px;
            width: 279px;
            min-height: 0;
            display: flex;
        }

        .container.view-only {
            display: flex;
            width: 100%;
            padding-bottom: 0;
        }

        sp-tab-panel.view-only {
            padding: 20px 0 0 0;
        }

        sp-toast {
            position: fixed;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
        }

        .selected-items-count-inline {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            padding-top: 32px;
            gap: 6px;
            flex: 0 0 auto;

            sp-button {
                min-width: 156px;
                font-weight: 500;
            }

            sp-button[disabled] sp-icon {
                opacity: 0.2;
            }
        }

        .selected-items-count {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 6px;

            sp-button {
                min-width: 156px;
                font-weight: 500;
            }

            sp-button[disabled] {
                sp-icon {
                    opacity: 0.2;
                }
            }

            sp-icon {
                transform: scaleX(1);
                transition: transform 0.3s ease-in-out;
            }

            sp-icon.flipped {
                transform: scaleX(-1);
            }
        }
    `,
];
