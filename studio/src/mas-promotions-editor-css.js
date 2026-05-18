import { css } from 'lit';
import { tableHeaderBaseStyles, tableCellBaseStyles } from './common/styles/table-styles.css.js';

const promotionsEditorCoreStyles = css`
    .promotions-form-container {
        background-color: var(--spectrum-white);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        box-sizing: border-box;
        position: relative;
        padding: 6px 24px 24px 24px;
        border-radius: 8px;
    }

    .promotions-form-panel {
        border-radius: 0;
        box-shadow: none;
        border: none;
        padding: 6px 0 24px 0;
        position: relative;
    }

    .promotion-loading {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.9);
        border-radius: 8px;
        z-index: 10;
    }

    .promotions-general-heading {
        margin: 0 0 16px 0;
        font-family: var(--spectrum-sans-font-family-stack);
        font-size: var(--spectrum-font-size-300);
        font-weight: var(--spectrum-font-weight-bold);
        line-height: var(--spectrum-heading-line-height);
        color: var(--spectrum-gray-900);
    }

    .promotions-general-column--left .promotions-form-fields > sp-field-label:first-of-type {
        padding-top: 0;
    }

    .promotions-general-unified-card {
        border: 1px solid var(--spectrum-gray-300);
        border-radius: 10px;
        padding: 16px 18px;
        background: var(--spectrum-white);
        box-sizing: border-box;
    }

    .promotions-form-panel-content {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        column-gap: 20px;
        align-items: stretch;
    }

    .promotions-general-column {
        min-width: 0;
    }

    .promotions-general-left,
    .promotions-general-right {
        min-width: 0;
    }

    .promotions-general-divider {
        align-self: stretch;
        height: auto;
    }

    .promotions-day-time-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        column-gap: 16px;
        align-items: end;
    }

    .promotions-date-col,
    .promotions-time-col {
        min-width: 0;
    }

    .promotions-day-time-row:first-of-type sp-field-label {
        padding-top: 0;
    }

    .promotions-day-time-row + .promotions-day-time-row sp-field-label {
        padding-top: 12px;
    }

    .promotions-general-right > sp-field-label {
        display: block;
        padding-top: 16px;
    }

    .promotions-date-input,
    .promotions-time-input {
        width: 100%;
        box-sizing: border-box;
        min-height: 32px;
        padding: 4px 10px;
        border: 1px solid var(--spectrum-gray-400);
        border-radius: 4px;
        font: inherit;
        background: var(--spectrum-white);
        color: var(--spectrum-gray-800);
    }

    .promotions-general-left sp-textfield,
    .promotions-general-left aem-tag-picker-field {
        display: block;
        width: 100%;
        box-sizing: border-box;
    }

    .promotions-general-right .promotions-form-surfaces-panel sp-button,
    .promotions-countries-stack .promotions-form-surfaces-panel sp-button {
        background: var(--spectrum-white);
    }

    .promotions-general-right .promotions-form-surfaces-panel div.label,
    .promotions-countries-stack .promotions-form-surfaces-panel div.label {
        align-content: center;
    }

    .promotions-countries-stack--empty sp-field-label {
        display: block;
        padding-top: 0;
        padding-bottom: 4px;
    }

    .promotions-countries-stack {
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        gap: 0;
        box-sizing: border-box;
    }

    .promotions-countries-selected-card {
        border: 1px solid var(--spectrum-gray-300);
        border-radius: 10px;
        background: var(--spectrum-white);
        box-sizing: border-box;
        overflow: hidden;
    }

    .promotions-countries-selected-head {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 16px;
        box-sizing: border-box;
        min-height: 44px;
    }

    .promotions-countries-selected-card:has(.promotions-countries-selected-body) .promotions-countries-selected-head {
        border-bottom: 1px solid var(--spectrum-gray-200);
    }

    .promotions-countries-selected-heading {
        margin: 0;
        font-size: var(--spectrum-font-size-200);
        font-weight: var(--spectrum-font-weight-bold);
        line-height: var(--spectrum-line-height-200);
        color: var(--spectrum-gray-900);
    }

    .promotions-countries-selected-actions {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
    }

    .promotions-countries-collapse-trigger {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        margin: 0;
        padding: 6px;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: var(--spectrum-gray-800);
        cursor: pointer;
        font: inherit;
        line-height: 0;
    }

    .promotions-countries-collapse-trigger:hover {
        background: var(--spectrum-gray-200);
    }

    .promotions-countries-collapse-trigger:focus-visible {
        outline: 2px solid var(--spectrum-blue-800);
        outline-offset: 2px;
    }

    .promotions-countries-selected-body {
        padding: 12px 16px 14px;
        box-sizing: border-box;
        font-size: var(--spectrum-font-size-100);
        font-weight: var(--spectrum-font-weight-regular);
        line-height: var(--spectrum-line-height-200);
        color: var(--spectrum-gray-800);
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .promotions-countries-selected-line {
        line-height: var(--spectrum-line-height-200);
    }

    .promotions-countries-insights {
        margin-top: 16px;
        box-sizing: border-box;
    }

    .promotions-countries-edit {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        margin: 0;
        padding: 6px 8px;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: var(--spectrum-gray-900);
        cursor: pointer;
        font: inherit;
        font-size: var(--spectrum-font-size-100);
        font-weight: var(--spectrum-font-weight-bold);
        line-height: var(--spectrum-line-height-200);
    }

    .promotions-countries-edit:hover {
        background: var(--spectrum-gray-200);
    }

    .promotions-countries-edit:focus-visible {
        outline: 2px solid var(--spectrum-blue-800);
        outline-offset: 2px;
    }

    .promotions-countries-edit-label {
        display: inline-flex;
        flex-direction: row;
        align-items: center;
        gap: 6px;
    }

    .promotions-countries-grid {
        display: grid;
        grid-template-columns: minmax(148px, 200px) 1fr;
        gap: 16px;
        align-items: stretch;
    }

    .promotions-stat-cards {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-height: 100%;
    }

    .promotions-stat-card {
        flex: 1 1 0;
        min-height: 88px;
        border: 1px solid var(--spectrum-gray-300);
        border-radius: 10px;
        padding: 14px 16px;
        background: var(--spectrum-white);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
    }

    .promotions-stat-card-head {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 6px;
        font-size: var(--spectrum-font-size-75);
        font-weight: var(--spectrum-font-weight-regular);
        color: var(--spectrum-gray-900);
    }

    .promotions-stat-card-value {
        font-size: var(--spectrum-font-size-600);
        font-weight: var(--spectrum-font-weight-bold);
        line-height: 1.1;
        color: var(--spectrum-gray-900);
        text-align: left;
    }

    .promotions-promo-codes-card {
        border: 1px solid var(--spectrum-gray-300);
        border-radius: 10px;
        background: var(--spectrum-white);
        display: flex;
        flex-direction: column;
        min-height: 100%;
        overflow: hidden;
        box-sizing: border-box;
    }

    .promotions-promo-codes-head {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 6px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--spectrum-gray-200);
        font-size: var(--spectrum-font-size-75);
        font-weight: var(--spectrum-font-weight-regular);
        color: var(--spectrum-gray-900);
        background: var(--spectrum-white);
    }

    .promotions-promo-codes-body {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        padding: 12px 16px 16px;
        box-sizing: border-box;
        min-height: 0;
    }

    .promotions-promo-codes-table-shell {
        flex: 1 1 auto;
        border: 1px solid var(--spectrum-gray-300);
        border-radius: 8px;
        overflow: hidden;
        box-sizing: border-box;
        min-height: 0;
    }

    .promotions-promo-codes-table {
        width: 100%;
        flex: 1;
        border: none;
        border-radius: 0;
    }

    .promotions-promo-codes-table sp-table-head {
        background-color: var(--spectrum-gray-75);
        border-bottom: 1px solid var(--spectrum-gray-200);
    }

    .promotions-promo-codes-table sp-table-head-cell {
        font-weight: var(--spectrum-font-weight-bold);
        font-size: var(--spectrum-font-size-75);
        color: var(--spectrum-gray-900);
    }

    .promotions-promo-codes-table sp-table-cell {
        font-size: var(--spectrum-font-size-100);
        font-weight: var(--spectrum-font-weight-regular);
        color: var(--spectrum-gray-800);
    }

    .promotions-promo-codes-table sp-table-body sp-table-row + sp-table-row sp-table-cell {
        border-block-start: 1px solid var(--spectrum-gray-200);
    }

    .promotions-promo-codes-empty {
        padding: 12px 0 0;
        color: var(--spectrum-gray-700);
        font-size: var(--spectrum-font-size-100);
    }

    .promotions-form-fields sp-field-label {
        padding-top: 12px;
    }

    .promotions-form-fields sp-textfield {
        width: 100%;
    }

    .promotions-form-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding-top: 24px;
    }

    .surfaces-empty-state {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border: 2px dashed var(--spectrum-gray-400);
        border-radius: 8px;
        background: var(--spectrum-white);
        box-sizing: border-box;
    }

    .surfaces-empty-state .icon sp-button {
        background: var(--spectrum-white);
    }

    .surfaces-empty-state .label {
        align-content: center;
        color: var(--spectrum-gray-800);
        font-size: var(--spectrum-font-size-100);
    }

    .surfaces-empty-state .label strong {
        font-size: var(--spectrum-font-size-200);
        color: var(--spectrum-gray-900);
    }

    .surfaces-list {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
    }

    #add-surfaces-overlay sp-search {
        width: 100%;
    }

    #add-surfaces-overlay sp-table {
        border-radius: 8px;
        border: 1px solid var(--spectrum-gray-200);
    }

    .surfaces-results {
        padding: 12px 0px;
        font-size: 12px;
        color: var(--spectrum-gray-600);
        text-align: right;
    }

    .surfaces-results span {
        font-weight: 600;
    }

    .geos-dialog-body {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: min(70vh, 560px);
        overflow: auto;
        box-sizing: border-box;
        background: var(--spectrum-white);
    }

    .geos-dialog-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
    }

    .geos-locale-count {
        font-size: var(--spectrum-font-size-75);
        color: var(--spectrum-gray-700);
    }

    .geos-region {
        border: 1px solid var(--spectrum-gray-300);
        border-radius: 8px;
        padding: 12px 16px;
        background: var(--spectrum-white);
        box-sizing: border-box;
    }

    .geos-region-head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
        font-weight: 600;
        color: var(--spectrum-gray-900);
    }

    .geos-locale-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px 12px;
    }

    .geos-locale-grid sp-checkbox {
        min-width: 0;
    }

    .add-geos-dialog .geos-dialog-body {
        width: 100%;
    }

    .promotions-fragments-section {
        margin-top: 20px;
        border: 1px solid var(--spectrum-gray-300);
        border-radius: 10px;
        background: var(--spectrum-white);
        box-sizing: border-box;
        overflow: hidden;
    }

    .promotions-fragments-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid var(--spectrum-gray-200);
    }

    .promotions-fragments-heading {
        margin: 0;
        font-size: var(--spectrum-font-size-200);
        font-weight: var(--spectrum-font-weight-bold);
        color: var(--spectrum-gray-900);
        line-height: var(--spectrum-line-height-200);
    }

    .promotions-fragments-content {
        display: flex;
        flex-direction: column;
    }

    .promotions-fragments-group {
        border-top: 1px solid var(--spectrum-gray-200);
    }

    .promotions-fragments-group:first-child {
        border-top: none;
    }

    .promotions-fragments-group-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 16px;
        background: var(--spectrum-gray-50);
        border-bottom: 1px solid var(--spectrum-gray-200);
        cursor: pointer;
        box-sizing: border-box;
    }

    .promotions-fragments-group-head:focus-visible {
        outline: 2px solid var(--spectrum-blue-800);
        outline-offset: 2px;
    }

    .promotions-fragments-group-title {
        margin: 0;
        flex: 1;
        min-width: 0;
        font-size: var(--spectrum-font-size-75);
        font-weight: var(--spectrum-font-weight-bold);
        color: var(--spectrum-gray-700);
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .promotions-fragments-table.item-table .offer-id {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
    }

    .promotions-fragments-table.item-table .offer-id .offer-id-text {
        min-width: 0;
        overflow-wrap: anywhere;
        word-break: break-all;
    }

    .promotions-fragments-table {
        width: 100%;
        border: none;
        border-radius: 0;
        max-height: min(320px, 45vh);
    }

    .promotions-fragments-table.item-table {
        --mod-table-header-font-weight: var(--spectrum-font-weight-bold);
        --table-content-name-flex-grow: 1.1;
        --table-content-title-flex-grow: 1.2;
        --table-content-offer-id-flex-grow: 1.15;
        --table-content-offer-type-flex-grow: 0.28;
        --table-content-last-modified-by-flex-grow: 0.18;
        --table-content-status-flex-grow: 0.28;
        --table-content-actions-flex-grow: 0.18;
        --table-content-preview-flex-grow: 0.2;
        width: 100%;
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid var(--spectrum-gray-100);
        --spectrum-table-cell-background-color: transparent;
    }

    .promotions-fragments-table.item-table sp-table-body {
        overflow: hidden;
    }

    .promotions-fragments-table.item-table sp-table-row {
        border-bottom: 1px solid var(--spectrum-gray-100);
    }

    .promotions-fragments-table.item-table sp-table-head {
        border: none;
        border-bottom: 1px solid var(--spectrum-gray-200);
        border-radius: 0;
    }

    .promotions-fragments-table.item-table sp-table-head-cell:first-of-type,
    .promotions-fragments-table.item-table sp-table-head-cell:last-of-type {
        border-radius: 0;
    }

    .promotions-fragments-table.item-table sp-table-head-cell,
    .promotions-fragments-table.item-table sp-table-cell {
        padding: 16px 20px;
        font-family: var(--spectrum-sans-font-family-stack);
        line-height: 18px;
    }

    .promotions-fragments-table.item-table sp-table-head-cell {
        background-color: var(--spectrum-gray-50);
        font-size: var(--spectrum-font-size-75);
        color: var(--spectrum-gray-900);
    }

    .promotions-fragments-table.item-table sp-table-cell {
        font-size: var(--spectrum-font-size-100);
        font-weight: var(--spectrum-font-weight-regular);
        color: var(--spectrum-gray-800);
    }

    .promotions-fragments-table.item-table sp-table-head-cell.name,
    .promotions-fragments-table.item-table sp-table-cell.name {
        gap: 8px;
        flex-grow: var(--table-content-name-flex-grow);
    }

    .promotions-fragments-table.item-table sp-table-head-cell.title,
    .promotions-fragments-table.item-table sp-table-cell.title {
        flex-grow: var(--table-content-title-flex-grow);
        word-break: break-word;
    }

    .promotions-fragments-table.item-table sp-table-head-cell.offer-id,
    .promotions-fragments-table.item-table sp-table-cell.offer-id {
        flex-grow: var(--table-content-offer-id-flex-grow);
        flex-shrink: 0;
        min-inline-size: 12rem;
        word-break: break-all;
    }

    .promotions-fragments-table.item-table sp-table-head-cell.status,
    .promotions-fragments-table.item-table sp-table-cell.status-cell {
        flex-grow: var(--table-content-status-flex-grow);
        min-width: 100px;
    }

    .promotions-fragments-table.item-table sp-table-head-cell.offer-type,
    .promotions-fragments-table.item-table sp-table-cell.offer-type {
        flex-grow: var(--table-content-offer-type-flex-grow);
        word-break: break-word;
    }

    .promotions-fragments-table.item-table sp-table-head-cell.last-modified-by,
    .promotions-fragments-table.item-table sp-table-cell.last-modified-by {
        flex-grow: var(--table-content-last-modified-by-flex-grow);
        flex-shrink: 0;
        min-inline-size: 4.5rem;
        max-inline-size: 5.5rem;
        justify-content: center;
        text-align: center;
        word-break: break-word;
    }

    .promotions-fragments-table.item-table sp-table-head-cell.actions,
    .promotions-fragments-table.item-table sp-table-cell.actions {
        flex-grow: var(--table-content-actions-flex-grow);
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
    }

    .promotions-fragments-table.item-table sp-table-head-cell.preview,
    .promotions-fragments-table.item-table sp-table-cell.preview {
        flex-grow: var(--table-content-preview-flex-grow);
        justify-content: center;
        text-align: center;
    }

    .promotions-fragments-table.item-table sp-table-cell.preview.promotions-preview-cell--interactive {
        cursor: pointer;
    }

    .promotions-preview-icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
    }

    .promotions-fragments-table.item-table sp-table-cell.preview.promotions-preview-cell--interactive sp-icon-preview {
        color: var(--spectrum-gray-600);
    }

    .promotions-fragments-table.item-table
        sp-table-row:hover
        sp-table-cell.preview.promotions-preview-cell--interactive
        sp-icon-preview {
        color: var(--spectrum-gray-800);
    }

    .promotions-fragments-table.item-table sp-table-cell.preview.promotions-preview-cell--static sp-icon-preview {
        color: var(--spectrum-gray-400);
        pointer-events: none;
    }

    .promotions-table-cell-dash {
        color: var(--spectrum-gray-500);
    }

    .promotions-fragment-actions-inner {
        display: flex;
        flex: 1 1 auto;
        align-items: center;
        justify-content: center;
        min-width: 0;
        box-sizing: border-box;
    }

    .promotions-fragments-table.item-table sp-table-cell.actions sp-action-menu {
        --mod-actionbutton-background-color-default: transparent;
        flex: 0 0 auto;
    }

    .promotions-fragment-row-name {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
    }

    .promotions-fragment-row-icon {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        object-fit: contain;
    }

    .promotions-fragments-empty {
        padding: 16px;
        margin: 0;
        color: var(--spectrum-gray-700);
        font-size: var(--spectrum-font-size-100);
    }
`;

const styles = [tableHeaderBaseStyles, tableCellBaseStyles, promotionsEditorCoreStyles];

export default styles;
