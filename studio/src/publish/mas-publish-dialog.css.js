import { css } from 'lit';

export const styles = css`
    .section-title {
        font-weight: 700;
        margin: 12px 0 4px;
        font-size: 14px;
    }
    .ref-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 8px;
    }
    .ref-path {
        font-size: 12px;
        color: var(--spectrum-global-color-gray-700);
        margin-left: 24px;
    }
    .select-all-row {
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--spectrum-global-color-gray-300);
    }
    .intro {
        margin-bottom: 12px;
        color: var(--spectrum-global-color-gray-800);
    }
`;
