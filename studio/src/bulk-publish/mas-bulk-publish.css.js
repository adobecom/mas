import { css } from 'lit';
import { skeletonStyles } from '../common/skeleton-styles.css.js';
import { tableHeaderBaseStyles, tableBodyBaseStyles } from '../common/styles/table-styles.css.js';

export const styles = [
    skeletonStyles,
    tableHeaderBaseStyles,
    tableBodyBaseStyles,
    css`
        :host {
            display: block;
            position: relative;
            padding: 32px;
            height: 100%;
            box-sizing: border-box;
            overflow-y: auto;
            border-top-left-radius: 16px;
            border-top-right-radius: 16px;
        }

        header {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 20px;
        }

        .header-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }

        h1 {
            font-size: 25px;
            font-weight: 700;
            line-height: 30px;
            margin: 0;
            color: var(--spectrum-gray-900, #000);
        }

        sp-divider {
            width: 100%;
        }

        .empty {
            font-size: 14px;
            color: var(--spectrum-gray-700, #505050);
            margin: 24px 0 0;
        }

        sp-table {
            width: 100%;
        }

        sp-table-head-cell.center,
        sp-table-cell.center {
            text-align: center;
            justify-content: center;
        }

        sp-table-row {
            cursor: pointer;
        }

        sp-table-row.disabled {
            opacity: 0.38;
            pointer-events: none;
        }

        sp-table-cell.project-name {
            font-weight: 700;
        }

        .status-light {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            font-weight: 500;
            line-height: 18px;
            color: var(--spectrum-gray-800, #292929);
            white-space: nowrap;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--status-color, var(--spectrum-gray-500, #8c8c8c));
            flex-shrink: 0;
        }

        .status-light.draft {
            --status-color: var(--spectrum-gray-500, #8c8c8c);
        }

        .status-light.publishing {
            --status-color: var(--spectrum-blue-700, #1473e6);
        }

        .status-light.review {
            --status-color: var(--spectrum-orange-700, #e68619);
        }

        .status-light.scheduled {
            --status-color: var(--spectrum-blue-700, #1473e6);
        }

        .status-light.published {
            --status-color: var(--spectrum-green-700, #2d9d78);
        }

        .status-light.locked {
            --status-color: var(--spectrum-gray-700, #4b4b4b);
        }

        .status-light.reverting {
            --status-color: var(--spectrum-orange-700, #e68619);
        }

        .status-light.reverted {
            --status-color: var(--spectrum-purple-700, #7030a0);
        }

        .status-light.partial {
            --status-color: var(--spectrum-orange-700, #e68619);
        }

        .status-light.failed {
            --status-color: var(--spectrum-red-700, #d7373f);
        }

        .actions-cell {
            text-align: center;
        }

        .actions-cell sp-action-button {
            --mod-actionbutton-min-width: 32px;
            --mod-actionbutton-padding-y: 6px;
        }

        .duplicating-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.7);
            z-index: 10;
        }

        sp-table-row sp-table-cell .skeleton-table-cell {
            height: 20px;
        }
    `,
];
