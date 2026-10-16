import { css } from 'lit';
import { editorContainerStyles } from '../common/styles/editor-styles.css.js';

export default [
    editorContainerStyles,
    css`
        .editor-container {
            height: 100%;
            min-height: 200px;
            padding: 24px;
        }

        .baselines-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }

        .create-button {
            --mod-button-border-radius: 16px;
        }

        .baselines-divider {
            display: flex;
            height: 1px;
            min-height: 1px;
            max-height: 1px;
            align-items: flex-start;
            align-self: stretch;
            background: var(--spectrum-gray-200);
            margin-bottom: 24px;
        }
    `,
];
