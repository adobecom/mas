import { css } from 'lit';

export const styles = css`
    .localization-container {
        padding: 32px;
    }

    .localization-loading-container {
        position: absolute;
        right: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
    }

    .localization-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid var(--spectrum-gray-100);
        margin-bottom: 12px;
    }

    .localization-toolbar {
        display: flex;
        align-items: center;
        padding-bottom: 20px;
    }

    .localization-toolbar sp-search {
        margin-right: 6px;
    }

    .localization-table {
        border-radius: 8px;
        border: 1px solid var(--spectrum-gray-200);
    }

    .localization-table sp-table-head {
        background-color: var(--spectrum-global-color-gray-100);
    }

    .localization-table sp-table-head-cell:last-child,
    .localization-table sp-table-cell:last-child {
        max-width: 100px;
    }

    .action-cell {
        display: flex;
        justify-content: center;
        align-items: center;
    }
`;
