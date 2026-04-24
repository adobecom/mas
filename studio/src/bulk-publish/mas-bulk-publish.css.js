import { css } from 'lit';
export const styles = css`
    :host {
        display: block;
        padding: 24px;
    }
    table {
        width: 100%;
        border-collapse: collapse;
    }
    th,
    td {
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid #eee;
    }
    .status {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
    }
    .status.draft {
        background: #eee;
    }
    .status.publishing {
        background: #ffe0b2;
    }
    .status.published {
        background: #c8e6c9;
    }
`;
