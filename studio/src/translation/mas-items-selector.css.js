import { css } from 'lit';
import { ghostButtonStyles } from './translation-common-styles.css.js';

export const styles = [
    ghostButtonStyles,
    css`
        sp-tab-panel[selected] {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .container {
            display: flex;
            width: 80vw;
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

        .selected-items-count {
            position: fixed;
            bottom: 98px;
            right: 22px;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 6px;

            sp-button {
                min-width: 156px;
                font-weight: 500;
            }

            sp-button[disabled] {
                sp-icon {
                    opacity: 0.2;
                }
            }

            sp-icon {
                transform: scaleX(1);
                transition: transform 0.3s ease-in-out;
            }

            sp-icon.flipped {
                transform: scaleX(-1);
            }
        }
    `,
];
