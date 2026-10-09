import { css } from 'lit';
import { ghostButtonStyles, selectItemsFormSectionStyles } from '../common/styles/table-styles.css.js';
import { loadingContainerCenteredStyles } from './translation-common-styles.css.js';

export const styles = [
    ghostButtonStyles,
    loadingContainerCenteredStyles,
    selectItemsFormSectionStyles,
    css`
        .translation-editor-form {
            padding: 32px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;

            h1 {
                margin: 0;
            }
        }

        .form-field {
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid var(--spectrum-gray-300, #dadada);
            border-radius: 16px;
            box-shadow:
                0 0 2px 0 var(--Alias-drop-shadow-elevated-key, rgba(0, 0, 0, 0.12)),
                0 2px 6px 0 var(--Alias-drop-shadow-transition, rgba(0, 0, 0, 0.04)),
                0 4px 12px 0 var(--Alias-drop-shadow-ambient, rgba(0, 0, 0, 0.08));

            h2 {
                margin: 0 0 20px 0;
            }
        }

        .metadata-info {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 16px;
            background: var(--spectrum-orange-100);

            sp-icon-alert {
                color: var(--spectrum-notice-color-800);
            }

            h2 {
                margin: 0;
            }

            span {
                width: 100%;
                color: var(--spectrum-neutral-content-color-default);
            }
        }

        .general-info {
            h2 {
                margin: 0 0 8px 0;
            }

            .general-info-columns {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
            }

            .general-info-col {
                display: flex;
                flex-direction: column;
                gap: 8px;

                sp-textfield {
                    width: 90%;
                }

                span {
                    color: var(--spectrum-neutral-content-color-default);
                }
            }
        }

        h1,
        h2 {
            color: var(--spectrum-neutral-content-color-default);
        }

        h2 sp-icon-asterisk100 {
            width: 10px;
            height: 10px;
        }

        .confirm-dialog-overlay {
            sp-dialog-wrapper {
                z-index: 11;
            }
        }
    `,
];
