import { css } from 'lit';

export const styles = css`
    .placeholders-container {
        height: 100%;
        border-radius: 8px;
        padding: 24px;
        background-color: var(--spectrum-white);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        box-sizing: border-box;
        position: relative;
    }

    .placeholders-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }

    .header-left {
        display: flex;
        align-items: center;
    }

    .search-filters-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        gap: 14px;
    }

    .placeholders-title {
        display: flex;
        justify-content: flex-start;
        align-items: center;
    }

    .placeholders-title h2 {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
    }

    .filters-container {
        display: flex;
        gap: 14px;
        align-items: center;
    }

    .placeholders-content {
        flex: 1;
        position: relative;
    }

    .no-folder-message,
    .loading-message {
        padding: 24px;
        text-align: center;
        color: var(--spectrum-global-color-gray-700);
        font-size: 16px;
        background-color: var(--spectrum-global-color-gray-100);
        border-radius: 4px;
        margin-top: 16px;
    }

    .error-message {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background-color: var(--spectrum-semantic-negative-color-background);
        color: var(--spectrum-semantic-negative-color-text);
        border-radius: 4px;
        margin-bottom: 16px;
    }

    .error-message sp-icon-alert {
        color: var(--spectrum-semantic-negative-color-icon);
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
        border: 1px solid var(--spectrum-gray-200);
    }

    .placeholders-table sp-table-head {
        background-color: var(--spectrum-global-color-gray-100);
        border-bottom: 1px solid var(--spectrum-gray-200);
    }

    .placeholders-table sp-table-head-cell:nth-child(2),
    .placeholders-table sp-table-cell:nth-child(2) {
        width: 200px;
    }

    .placeholders-table sp-table-head-cell:nth-child(3),
    .placeholders-table sp-table-cell:nth-child(3) {
        width: 400px;
    }

    .placeholders-table sp-table-head-cell:nth-child(4),
    .placeholders-table sp-table-cell:nth-child(4) {
        width: 120px;
    }

    .placeholders-table sp-table-head-cell:nth-child(5),
    .placeholders-table sp-table-cell:nth-child(5) {
        width: 150px;
    }

    .placeholders-table sp-table-head-cell:nth-child(6),
    .placeholders-table sp-table-cell:nth-child(6) {
        width: 200px;
    }

    .placeholders-table sp-table-head-cell:nth-child(7),
    .placeholders-table sp-table-cell:nth-child(7) {
        width: 200px;
    }

    .placeholders-table sp-table-head-cell {
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        color: var(--spectrum-gray-700);
        font-size: 12px;
        font-weight: 700;
    }

    .placeholders-table sp-table-head-cell:last-child,
    .placeholders-table sp-table-cell:last-child {
        max-width: 100px;
        justify-content: flex-end;
    }

    .placeholders-table sp-table-cell {
        display: flex;
        align-items: center;
        justify-content: flex-start;
    }

    .placeholders-table sp-table-body {
        overflow: visible;
    }

    /* Action column styles */
    .action-cell {
        position: relative;
        box-sizing: border-box;
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

    .action-button:hover {
        background-color: var(--spectrum-global-color-gray-200);
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
        width: 160px;
        padding: 8px 0;
        display: flex;
        flex-direction: column;
    }

    .dropdown-item {
        flex: 1;
        align-items: center;
        padding: 8px 16px;
        cursor: pointer;
        gap: 8px;
        justify-self: flex-start;
        display: flex;
    }

    .dropdown-item:hover {
        background-color: var(--spectrum-global-color-gray-100);
    }

    .dropdown-item span {
        flex: 1;
        display: inline-flex;
    }

    /* Create Modal Styles */
    .create-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .create-modal {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        width: 600px;
        max-width: 90vw;
        max-height: 90vh;
        overflow: auto;
    }

    .create-modal-content {
        padding: 24px;
    }

    .create-modal-title {
        font-size: 20px;
        font-weight: 600;
        margin: 0 0 24px 0;
    }

    .create-modal-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
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

    .create-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 24px;
    }

    /* Column widths for the table */
    .columnWidths {
        --key-width: 20%;
        --value-width: 35%;
        --locale-width: 10%;
        --status-width: 10%;
        --updatedBy-width: 10%;
        --updatedAt-width: 10%;
        --action-width: 5%;
    }

    /* Editing styles */
    .editing-cell {
        padding: 0 !important;
    }

    .edit-field-container {
        padding: 4px;
    }

    .edit-field-container sp-textfield {
        width: 100%;
    }

    /* Breadcrumbs styles */
    .breadcrumbs {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
    }

    .breadcrumb-link {
        color: var(--spectrum-global-color-blue-600);
        text-decoration: none;
    }

    .breadcrumb-current {
        color: var(--spectrum-global-color-gray-700);
    }

    .approve-button sp-icon-checkmark {
        color: var(--spectrum-semantic-positive-color-default, green);
    }

    .reject-button sp-icon-close {
        color: var(--spectrum-semantic-negative-color-default, red);
    }
`;

export default styles;
