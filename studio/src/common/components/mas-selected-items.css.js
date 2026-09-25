import { css } from 'lit';
import { ghostButtonStyles } from '../styles/table-styles.css.js';

export const styles = [
    ghostButtonStyles,
    css`
        :host {
            display: flex;
            min-height: 0;
            min-width: 0;
            max-height: 100%;
        }

        .empty-state {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: var(--spectrum-gray-75, #f8f8f8);
            border-radius: 8px;
            gap: 12px;
            color: var(--spectrum-gray-700, #464646);

            p {
                margin: 0;
                font-size: 14px;
            }

            sp-icon {
                width: 48px;
                height: 48px;
            }
        }

        .selected-items {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            padding: 12px;
            margin: 0;
            gap: 12px;
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 12px;
            background: var(--spectrum-gray-50);
            overflow-y: auto;
            min-height: 0;
            min-width: 0;
            width: 100%;

            .item {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                grid-template-rows: max-content max-content;
                padding: 12px;
                gap: 8px;
                border: 1px solid var(--spectrum-gray-300);
                border-radius: 12px;
                background: var(--spectrum-white);
                min-width: 0;

                .title {
                    grid-column: 1;
                    grid-row: 1;
                    margin: 0;
                    min-width: 0;
                    overflow-wrap: break-word;
                }

                .type {
                    color: var(--spectrum-orange-800);
                }

                .remove-button {
                    grid-column: 2;
                    grid-row: 1 / 3;
                    align-self: center;
                }
            }
        }
    `,
];
