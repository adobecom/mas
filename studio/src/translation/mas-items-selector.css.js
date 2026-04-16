import { css } from 'lit';
import { ghostButtonStyles } from './translation-common-styles.css.js';

export const styles = [
    ghostButtonStyles,
    css`
        .dialog-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 16px;
        }

        .dialog-header h2 {
            margin: 0;
            white-space: nowrap;
            font-size: 18px;
        }

        .dialog-header sp-search {
            flex: 1;
            max-width: 400px;
        }

        :host {
            display: flex;
            flex-direction: column;
            min-width: 80vw;
            max-height: 70vh;
            min-height: 0;
        }

        sp-tabs {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
        }

        sp-tab-panel[selected] {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            gap: 12px;
            padding-top: 16px;
        }

        .container {
            display: flex;
            flex: 1;
            min-height: 0;
            width: 100%;
        }

        mas-select-items-table {
            flex: 1;
            min-width: 0;
            min-height: 0;
            display: flex;
        }

        .container.view-only {
            width: 100%;
        }

        sp-tab-panel.view-only {
            padding: 20px 0 0 0;
        }

        sp-toast {
            position: fixed;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
        }
    `,
];
