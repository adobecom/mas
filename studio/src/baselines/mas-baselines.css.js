import { css } from 'lit';
import { editorContainerStyles, listPageContainerStyles } from '../common/styles/editor-styles.css.js';

export default [
    editorContainerStyles,
    listPageContainerStyles,
    css`
        .baselines-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }
    `,
];
