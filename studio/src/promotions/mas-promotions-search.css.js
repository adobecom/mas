import { css } from 'lit';

export const styles = css`
    .promotions-search-row {
        display: flex;
        width: 1148px;
        height: 32px;
        align-items: center;
        gap: 6px;
        margin-bottom: 24px;
    }

    .promotions-search-field {
        display: flex;
        width: 246px;
        min-width: 112px;
        flex-direction: column;
        align-items: flex-start;
        flex-shrink: 0;
    }

    .promotions-results-count {
        display: flex;
        align-items: center;
        gap: 4px;
        font-family: var(--Font-family-Sans-serif, 'Adobe Clean Spectrum VF');
        font-size: var(--Font-size-75, 12px);
        font-style: normal;
        font-weight: 400;
        line-height: 150%;
        letter-spacing: var(--Letter-spacing, 0);
    }

    .promotions-results-count .results-count-number {
        color: var(--Alias-content-neutral-default, #292929);
    }

    .promotions-results-count .results-count-label {
        color: var(--Alias-content-neutral-subdued-default, #505050);
    }
`;

export default styles;
