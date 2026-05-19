import { css } from 'lit';

export const styles = css`
    :host {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        height: 100%;
    }

    .select-lang-content {
        min-width: 600px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        height: 100%;
        overflow: hidden;
    }

    .sticky-header {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .select-all-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .locale-count {
        font-size: 12px;
        color: var(--spectrum-gray-700, #505050);
    }

    .regions {
        display: flex;
        flex-direction: column;
        gap: 20px;
        overflow-y: auto;
        flex: 1;
        min-height: 0;
    }

    .region-card {
        border: 1px solid var(--spectrum-gray-300, #dadada);
        border-radius: 12px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .region-header {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .region-name {
        font-size: 14px;
        font-weight: 700;
        color: var(--spectrum-gray-900, #292929);
    }

    .locale-grid {
        display: flex;
        gap: 40px;
    }

    .locale-col {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
        min-width: 0;
    }

    .no-results {
        color: var(--spectrum-gray-700, #505050);
        font-size: 14px;
        margin: 0;
    }
`;
