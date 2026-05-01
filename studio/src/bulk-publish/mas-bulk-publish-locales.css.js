import { css } from 'lit';
export const styles = css`
    :host {
        display: block;
        background: var(--spectrum-gray-50, #fff);
        border: 1px solid var(--spectrum-gray-300, #dadada);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
    }
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }
    .header-actions {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    h3 {
        font-size: 18px;
        margin: 0;
        font-weight: 700;
    }
    .count {
        font-weight: 400;
        color: var(--spectrum-gray-600, #505050);
    }
    .locales-summary {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .region-row {
        display: flex;
        align-items: baseline;
        gap: 12px;
        font-size: 16px;
        color: var(--spectrum-gray-800, #292929);
        min-height: 32px;
    }
    .region-label {
        white-space: nowrap;
        flex-shrink: 0;
    }
    .region-locales {
        color: var(--spectrum-gray-800, #292929);
    }
    .empty {
        font-size: 16px;
        color: var(--spectrum-gray-800, #292929);
        margin: 0;
    }
`;
