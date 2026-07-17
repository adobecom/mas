import { css } from 'lit';

export const styles = css`
    :host {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        height: 100%;
    }

    .select-geos-content {
        min-width: 500px;
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
        padding: 4px 0 0 4px;
    }

    .select-all-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .geo-count {
        font-size: 12px;
        color: var(--spectrum-gray-700, #505050);
    }

    .geo-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
        overflow-y: auto;
        flex: 1;
        min-height: 0;
        border: 1px solid var(--spectrum-gray-300, #dadada);
        border-radius: 12px;
        padding: 20px;
    }

    .no-results {
        color: var(--spectrum-gray-700, #505050);
        font-size: 14px;
        margin: 0;
    }

    :host([compact]) .select-geos-content {
        min-width: 220px;
        gap: 8px;
    }

    :host([compact]) .geo-grid {
        max-height: 260px;
        padding: 8px;
        border: none;
    }
`;
