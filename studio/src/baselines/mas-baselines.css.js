import { css } from 'lit';
import { pageContainerStyles } from '../common/styles/page-container-styles.css.js';
import { skeletonStyles } from '../common/skeleton-styles.css.js';
import { tableBodyBaseStyles, tableCellBaseStyles, tableHeaderBaseStyles } from '../common/styles/table-styles.css.js';

export default [
    pageContainerStyles,
    skeletonStyles,
    tableHeaderBaseStyles,
    tableBodyBaseStyles,
    tableCellBaseStyles,
    css`
        .baselines-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }

        .baselines-toolbar {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 20px 0;
        }

        .item-table {
            sp-table-head-cell.productArrangementCode,
            sp-table-cell.productArrangementCode {
                flex-grow: 1.6;
            }

            sp-table-head-cell.actions,
            sp-table-cell.actions,
            sp-table-head-cell.preview,
            sp-table-cell.preview {
                flex-grow: 0.5;
            }
        }
    `,
];
