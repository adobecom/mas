import { css } from 'lit';

export const editorContainerStyles = css`
    .editor-container {
        position: relative;
        background-color: var(--spectrum-white);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        box-sizing: border-box;
        border-radius: 8px;
    }
`;

export const editorFormFieldStyles = css`
    .form-field {
        padding: 20px;
        border: 1px solid var(--spectrum-gray-300, #dadada);
        border-radius: 16px;
        box-shadow:
            0 0 2px 0 var(--Alias-drop-shadow-elevated-key, rgba(0, 0, 0, 0.12)),
            0 2px 6px 0 var(--Alias-drop-shadow-transition, rgba(0, 0, 0, 0.04)),
            0 4px 12px 0 var(--Alias-drop-shadow-ambient, rgba(0, 0, 0, 0.08));

        h2 {
            margin: 0 0 20px 0;
        }
    }
`;

export const editorHeadingStyles = css`
    h1,
    h2 {
        color: var(--spectrum-neutral-content-color-default);
    }

    h2 sp-icon-asterisk100 {
        width: 10px;
        height: 10px;
    }
`;
