import { css } from 'lit';

export const styles = css`
    .select-lang-content {
        min-width: 600px;
    }

    .select-lang-content sp-divider {
        margin-bottom: 10px;
    }

    .select-all-lang {
        display: flex;
        justify-content: space-between;
    }

    .nmb-languages {
        margin-top: 6px;
    }

    .select-lang sp-table-cell {
        border-block-start: unset;
        padding: 5px 0 5px 0;
    }

    .select-lang sp-table-cell:last-child {
        max-width: 75px;
    }
`;
