import { css } from 'lit';
export const styles = css`
    :host {
        display: block;
        background: var(--spectrum-gray-50, #fff);
        border: 1px solid var(--spectrum-gray-200, #eaeaea);
        border-radius: 8px;
        padding: 16px 20px;
    }
    h3 {
        font-size: 15px;
        margin: 0 0 4px;
        font-weight: 700;
    }
    .help {
        font-size: 12px;
        color: var(--spectrum-gray-700, #6d6d6d);
        margin: 0 0 12px;
    }
    .dropzone {
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px dashed var(--spectrum-gray-400, #b9b9b9);
        border-radius: 8px;
        padding: 14px 18px;
        cursor: pointer;
        background: transparent;
    }
    .dropzone:hover {
        background: var(--spectrum-gray-75, #fafafa);
    }
    .dropzone .plus {
        font-size: 20px;
        font-weight: 400;
        color: var(--spectrum-gray-800, #4b4b4b);
    }
    .label {
        font-weight: 700;
        margin: 0;
    }
    .sublabel {
        font-size: 12px;
        color: var(--spectrum-gray-700, #6d6d6d);
        margin: 2px 0 0;
    }
    .summary {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
    }
`;
