import { css } from 'lit';
export const styles = css`
    :host {
        display: block;
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
    .description {
        font-size: 14px;
        color: var(--spectrum-gray-700, #6d6d6d);
        margin: 0 0 12px;
    }
    .add-locales-zone {
        display: flex;
        align-items: center;
        gap: 16px;
        width: 100%;
        padding: 20px 24px;
        border: 1.5px dashed var(--spectrum-gray-700, #6d6d6d);
        border-radius: 6px;
        background: none;
        cursor: pointer;
        text-align: left;
        box-sizing: border-box;
        font-family: inherit;
    }
    .add-locales-zone:hover {
        background: var(--spectrum-gray-100, #f3f3f3);
    }
    .add-locales-zone[disabled] {
        opacity: 0.4;
        cursor: not-allowed;
        pointer-events: none;
    }
    .add-locales-icon {
        font-size: 48px;
        font-weight: 200;
        color: var(--spectrum-gray-800, #292929);
        line-height: 1;
        flex-shrink: 0;
    }
    .add-locales-text {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 14px;
        color: var(--spectrum-gray-700, #6d6d6d);
    }
    .add-locales-text strong {
        font-size: 14px;
        font-weight: 700;
        color: var(--spectrum-gray-800, #292929);
    }
`;
