import { css } from 'lit';
export const styles = css`
    :host {
        display: block;
    }
    .dropzone {
        border: 1px dashed var(--spectrum-alias-border-color, #aaa);
        border-radius: 10px;
        padding: 24px;
        text-align: center;
        cursor: pointer;
    }
`;
