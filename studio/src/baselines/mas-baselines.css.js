import { css } from 'lit';
import { pageContainerStyles } from '../common/styles/page-container-styles.css.js';

export default [
    pageContainerStyles,
    css`
        .baselines-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }
    `,
];
