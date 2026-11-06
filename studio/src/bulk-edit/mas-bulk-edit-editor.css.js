import { css } from 'lit';
import { tableCellBaseStyles, tableHeaderBaseStyles, tableBodyBaseStyles } from '../common/styles/table-styles.css.js';

export const styles = css`
    ${tableCellBaseStyles}
    ${tableHeaderBaseStyles}
    ${tableBodyBaseStyles}
    :host {
        display: flex;
        flex-direction: column;
        flex: 1 0 auto;
        box-sizing: border-box;
        width: 100%;
        min-height: calc(100dvh - var(--mas-nav-height, 0px) - 16px);
        padding: 24px 32px 120px;
    }

    .back-link,
    header,
    .card {
        flex-shrink: 0;
    }

    header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
    }

    h1 {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
    }

    .card {
        display: flex;
        flex-direction: column;
        padding: 20px;
        border: 1px solid var(--spectrum-gray-200, #eaeaea);
        border-radius: 12px;
    }

    .label-row {
        display: flex;
        align-items: center;
        gap: 4px;
        padding-block: var(--spectrum-field-label-top-to-text-medium, 7px)
            var(--spectrum-field-label-bottom-to-text-medium, 4px);
    }

    .label-row sp-field-label {
        padding: 0;
    }

    sp-field-label[for='project-title'],
    sp-help-text[data-testid='title-error'] {
        display: flex;
        align-items: center;
    }

    sp-textfield {
        width: 100%;
    }

    .save-dialog-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 40px;
    }

    sp-search {
        width: 100%;
        --mod-search-border-radius: 100px;
        --mod-search-border-color-default: var(--spectrum-gray-300);
        --mod-search-background-color: var(--spectrum-gray-75);
    }

    .back-link {
        align-self: flex-start;
        display: inline-block;
        margin-bottom: 20px;
        color: var(--spectrum-blue-700, #1473e6);
    }

    .search-row {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 12px;
    }

    .field {
        flex: 0 1 200px;
        min-width: 140px;
    }

    .search-in-dropdown,
    #search-in {
        width: 100%;
    }

    #search-in {
        justify-content: space-between;
    }

    .search-in-popover {
        padding: 8px 12px;
        min-width: 200px;
        max-height: 360px;
        overflow-y: auto;
    }

    .search-in-popover sp-divider {
        margin-block: 8px;
    }

    .search-in-popover sp-field-group {
        gap: 4px;
    }

    .replace-arrow {
        padding-top: 30px;
    }

    .file-actions {
        display: flex;
        flex-direction: column;
        margin-left: auto;
    }

    .file-actions sp-field-label {
        visibility: hidden;
    }

    .file-actions sp-button-group {
        gap: 8px;
    }

    .preview-notice {
        margin-top: 12px;
    }

    .fragments-table {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 300px;
        border: 1px solid var(--spectrum-gray-200, #eaeaea);
        border-radius: 12px;
        margin-top: 40px;
        overflow: hidden;
    }

    .results-scroll {
        overflow-x: auto;
        flex-shrink: 0;
    }

    .has-results .results-scroll {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        flex: 1;
        min-height: 0;
        overflow: auto;
    }

    sp-table {
        width: max-content;
        min-width: 100%;
    }

    sp-table.search-results {
        flex: 0 0 auto;
        min-height: 0;
    }

    .item-table[data-resized-columns] {
        overflow: visible;
    }

    sp-table.search-results sp-table-body {
        min-height: 0;
        overflow: visible;
    }

    sp-table-head {
        position: sticky;
        top: 0;
        z-index: 3;
        background: var(--spectrum-gray-50, #f8f8f8);
    }

    sp-table-row {
        height: 72px;
    }

    .result-cell {
        isolation: isolate;
        box-sizing: border-box;
        flex: 0 0 150px;
        padding: 12px;
        overflow: hidden;
    }

    sp-table-head-cell.result-cell {
        height: 48px;
        white-space: nowrap;
    }

    sp-table-cell.result-cell {
        height: 72px;
        gap: 8px;
    }

    .result-cell.selection {
        flex-basis: 48px;
        justify-content: center;
        position: sticky;
        left: 40px;
        z-index: 2;
        background: var(--spectrum-gray-50, #f8f8f8);
    }

    .result-cell.offer {
        flex-basis: 180px;
        position: sticky;
        left: 88px;
        z-index: 2;
        background: var(--spectrum-gray-50, #f8f8f8);
        box-shadow: 1px 0 var(--spectrum-gray-300, #dadada);
    }

    .result-cell.expansion {
        flex-basis: 40px;
        justify-content: center;
        padding-inline: 0;
        position: sticky;
        left: 0;
        z-index: 2;
        background: var(--spectrum-gray-50, #f8f8f8);
    }

    .variation-controls {
        position: relative;
        isolation: isolate;
        flex: 1;
        padding: 0;
        min-width: 0;
        height: 112px;
        background: var(--spectrum-gray-75, #f8f8f8);
    }

    .variation-controls::after {
        content: '';
        position: absolute;
        inset-inline: 32px;
        top: 78px;
        height: 2px;
        background: var(--spectrum-gray-200, #e1e1e1);
    }

    sp-table-row:has(> .variation-controls) {
        height: 112px;
        border-bottom: 0;
    }

    sp-table-row:has(> .has-empty-variations) {
        height: auto;
    }

    .variation-controls.has-empty-variations {
        flex-direction: column;
        align-items: stretch;
        height: auto;
    }

    .has-empty-variations .variation-toolbar {
        height: 94px;
        padding-bottom: 14px;
    }

    .variation-empty {
        position: sticky;
        left: 32px;
        width: max-content;
        max-width: calc(100% - 64px);
        margin: 0 32px 38px;
        font-size: 14px;
        font-weight: 400;
        line-height: normal;
    }

    sp-table-row:has(> .variation-cell) {
        align-items: flex-start;
        background: var(--spectrum-gray-75, #f8f8f8);
        border-bottom: 0;
    }

    sp-table-row:has(> .variation-last) {
        height: 96px;
    }

    .variation-toolbar {
        display: flex;
        align-items: flex-end;
        gap: 12px;
        position: sticky;
        left: 0;
        z-index: 1;
        width: max-content;
        max-width: 100%;
        padding: 24px 32px 32px;
        height: 112px;
        box-sizing: border-box;
        background: var(--spectrum-gray-75, #f8f8f8);
    }

    .variation-toolbar::before {
        content: '';
        position: absolute;
        inset-inline: 32px;
        top: 78px;
        height: 2px;
        z-index: -1;
        background: var(--spectrum-gray-200, #e1e1e1);
    }

    .result-cell.variation-cell {
        background: var(--spectrum-gray-50, #fff);
        border-bottom: 1px solid var(--spectrum-gray-300, #dadada);
    }

    .result-cell.variation-cell.expansion {
        flex-basis: 32px;
        background: var(--spectrum-gray-75, #f8f8f8);
        border: 0;
    }

    .result-cell.variation-cell.selection {
        flex-basis: 56px;
        left: 32px;
        padding-inline: 20px 12px;
    }

    .result-cell.variation-cell.offer {
        font-weight: 700;
    }

    .result-cell.variation-cell.status {
        flex-basis: 118px;
        margin-right: 32px;
    }

    .result-cell.variation-first.selection {
        border-top-left-radius: 12px;
    }

    .result-cell.variation-first.status {
        border-top-right-radius: 12px;
    }

    .result-cell.variation-last {
        border-bottom: 0;
    }

    .result-cell.variation-last.selection {
        border-bottom-left-radius: 12px;
    }

    .result-cell.variation-last.status {
        border-bottom-right-radius: 12px;
    }

    .selection-summary {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 20px 12px;
        flex-shrink: 0;
    }

    .result-cell.fragmentTitle,
    .result-cell.offerId {
        flex-basis: 200px;
    }

    .result-cell.callout {
        flex-basis: 220px;
    }

    .result-cell .title-clamp {
        min-width: 0;
        line-height: 20px;
        max-height: 40px;
    }

    .replacement-preview ins {
        background: var(--spectrum-green-100, #e9f6ec);
        text-decoration: none;
    }

    .mnemonic-icon {
        width: 24px;
        height: 24px;
        flex: 0 0 24px;
        object-fit: contain;
    }

    .offer-id .copyable-value {
        width: 100%;
    }

    .search-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        flex: 1;
    }

    .has-results .search-message {
        flex: 0 0 auto;
        flex-direction: row;
        gap: 8px;
        min-height: 0;
        padding: 12px 20px;
    }

    .search-result-count {
        flex-shrink: 0;
        margin: 12px 20px;
    }

    .search-pagination {
        flex-shrink: 0;
        padding: 12px 20px;
    }

    sp-illustrated-message {
        flex: 1;
        --mod-illustrated-message-heading-max-inline-size: 100%;
        --mod-illustrated-message-description-max-inline-size: 100%;
        min-height: 300px;
        padding: 32px;
        box-sizing: border-box;
    }

    sp-illustrated-message h2 {
        margin: 0;
        font-size: 16px;
    }

    sp-illustrated-message p {
        margin: 0;
        font-size: 12px;
    }

    sp-icon-cloud {
        width: 48px;
        height: 48px;
    }

    @media (max-width: 700px) {
        :host {
            padding-inline: 16px;
        }

        header {
            align-items: flex-start;
        }

        .replace-arrow {
            display: none;
        }

        .file-actions sp-field-label {
            display: none;
        }
    }
`;
