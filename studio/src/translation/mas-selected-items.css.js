import { css } from 'lit';
import { ghostButtonStyles } from './translation-common-styles.css.js';

export const styles = [
    ghostButtonStyles,
    css`
        :host {
            display: flex;
        }

        .selected-items {
            display: flex;
            flex-direction: column;
            padding: 12px;
            margin: 0;
            gap: 12px;
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 12px;
            background: var(--spectrum-gray-50);

            .item {
                display: grid;
                grid-template-columns: 160px auto;
                grid-template-rows: max-content max-content;
                padding: 12px;
                gap: 8px;
                border: 1px solid var(--spectrum-gray-300);
                border-radius: 12px;
                background: var(--spectrum-white);

                .title {
                    grid-column: 1;
                    grid-row: 1;
                    margin: 0;
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
