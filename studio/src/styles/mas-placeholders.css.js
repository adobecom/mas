import { css } from 'lit';

export const styles = css`
    #placeholders-container {
        height: 100%;
        border-radius: 8px;
        padding: 24px;
        background-color: var(--spectrum-white);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        box-sizing: border-box;
        position: relative;
    }

    .breadcrumbs-container {
        margin-bottom: 16px;
    }

    .breadcrumbs {
        display: flex;
        align-items: center;
        font-size: 14px;
        color: var(--spectrum-global-color-gray-700);
    }

    .breadcrumb-link {
        color: var(--spectrum-global-color-gray-700);
        text-decoration: none;
    }

    .breadcrumb-link:hover {
        text-decoration: underline;
    }

    .breadcrumb-chevron {
        margin: 0 8px;
        width: 16px;
        height: 16px;
        color: var(--spectrum-global-color-gray-500);
    }

    .breadcrumb-current {
        font-weight: 400;
        color: var(--spectrum-global-color-gray-900);
    }

    .placeholders-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .placeholders-title h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
    }

    .search-filters-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .filters-container {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .placeholders-content {
        flex: 1;
        position: relative;
        overflow: auto;
    }

    sp-progress-circle {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .placeholders-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        border-radius: 8px;
        overflow: hidden;
    }

    .placeholders-table sp-table-head {
        background-color: var(--spectrum-global-color-gray-100);
    }

    .placeholders-table sp-table-head-cell {
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
    }

    .placeholders-table sp-table-head-cell sp-icon-chevron-down,
    .placeholders-table sp-table-head-cell sp-icon-chevron-up {
        margin-left: 4px;
    }

    /* Remove default sort arrows */
    .placeholders-table sp-table-head-cell[sortable]::after {
        display: none !important;
    }

    sp-search {
        width: 300px;
    }

    .create-button {
        margin-left: auto;
    }

    /* Action column styles */
    .action-cell {
        position: relative;
        box-sizing: border-box;
        width: var(--action-column-width, auto);
    }

    .action-buttons {
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: flex-end;
        width: 100%;
    }

    .action-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        flex: 0 0 auto;
    }

    /* Ensure consistent button sizes */
    .action-button sp-icon-edit,
    .action-button sp-icon-more,
    .action-button sp-icon-checkmark,
    .action-button sp-icon-close {
        width: 18px;
        height: 18px;
    }

    .action-button:hover {
        background-color: var(--spectrum-global-color-gray-200);
    }

    .save-button {
        color: var(--spectrum-semantic-positive-color-default);
    }

    .cancel-button {
        color: var(--spectrum-semantic-negative-color-default);
    }

    /* Dropdown menu styles */
    .dropdown-menu {
        position: absolute;
        right: 0;
        top: 100%;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        z-index: 100;
        padding: 8px 0;
    }

    .dropdown-item {
        display: flex;
        justify-self: flex-start;
        padding: 8px 16px;
        cursor: pointer;
        gap: 8px;
    }

    .dropdown-item:hover {
        background-color: var(--spectrum-global-color-gray-100);
    }

    .dropdown-item span {
        flex: 1;
    }

    /* Edit mode styles */
    .editing-cell {
        padding: 0 !important;
        box-sizing: border-box;
        vertical-align: middle;
    }

    .edit-field-container {
        padding: 8px;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
    }

    .edit-field-container sp-textfield {
        width: 100%;
        --spectrum-textfield-height: 32px;
        --spectrum-textfield-padding-top: 0;
        --spectrum-textfield-padding-bottom: 0;
        margin: 0;
    }

    /* Make sure table cells have consistent padding */
    .placeholders-table sp-table-cell {
        padding: 8px;
        box-sizing: border-box;
        vertical-align: middle;
        height: 48px; /* Fixed height for all cells */
    }

    /* Ensure table rows have consistent height */
    .placeholders-table sp-table-row {
        height: 48px;
        min-height: 48px;
        box-sizing: border-box;
    }

    /* Ensure the validation error doesn't break alignment */
    .validation-error {
        position: absolute;
        bottom: -16px;
        left: 8px;
        color: var(--spectrum-semantic-negative-color-default);
        font-size: 12px;
        background-color: white;
        z-index: 1;
    }

    /* Table column alignment */
    .placeholders-table sp-table-head-cell[style*='text-align: right'] {
        justify-content: flex-end;
    }

    .placeholders-table sp-table-cell[style*='text-align: right'] {
        text-align: right;
    }

    /* Status badge alignment in right-aligned cells */
    sp-table-cell[style*='text-align: right'] sp-badge {
        float: right;
    }

    /* Action buttons alignment */
    sp-table-cell.action-cell[style*='text-align: right'] .action-buttons {
        justify-content: flex-end;
    }

    /* Modal styles */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .create-placeholder-modal {
        background-color: white;
        border-radius: 8px;
        width: 600px;
        max-width: 90vw;
        max-height: 90vh;
        overflow-y: auto;
        padding: 24px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    .create-placeholder-modal h2 {
        margin-top: 0;
        margin-bottom: 24px;
        font-size: 20px;
        font-weight: 600;
    }

    .modal-form {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .form-group label {
        font-size: 14px;
        font-weight: 500;
    }

    .required {
        color: var(--spectrum-semantic-negative-color-default);
    }

    .locale-config-options {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .locale-config-option {
        display: flex;
        gap: 12px;
        padding: 12px;
        border-radius: 4px;
        border: 1px solid var(--spectrum-global-color-gray-300);
        cursor: pointer;
    }

    .locale-config-option.selected {
        border-color: var(--spectrum-semantic-informative-color-default);
        background-color: var(--spectrum-semantic-informative-color-100);
    }

    .radio-container {
        display: flex;
        align-items: center;
        justify-content: center;
        padding-top: 4px;
    }

    .radio-button {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid var(--spectrum-global-color-gray-500);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .radio-button.selected {
        border-color: var(--spectrum-semantic-informative-color-default);
    }

    .radio-inner {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: transparent;
    }

    .radio-button.selected .radio-inner {
        background-color: var(--spectrum-semantic-informative-color-default);
    }

    .option-content h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
    }

    .option-content p {
        margin: 4px 0 0 0;
        font-size: 14px;
        color: var(--spectrum-global-color-gray-700);
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 24px;
    }
`;
