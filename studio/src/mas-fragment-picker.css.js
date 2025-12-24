import { css } from 'lit';

export const styles = css`
    :host {
        .search {
            display: flex;
            align-items: center;
            gap: 6px;
            margin: 32px 0 20px 0;
        }

        .filters {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
        }

        .fragments-table {
            margin-bottom: 32px;
        }

        .selected-files {
            margin-bottom: 32px;
            text-align: end;
        }
    }
`;
