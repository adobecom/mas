import { css } from 'lit';

export { ghostButtonStyles, tableHeaderBaseStyles, tableCellBaseStyles } from '../common/styles/table-styles.css.js';

export const loadingContainerCenteredStyles = css`
    .loading-container--absolute {
        position: absolute;
        top: 50%;
        right: 50%;
        transform: translate(-50%, -50%);
    }
`;
