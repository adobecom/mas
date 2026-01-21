import { css } from 'lit';

export const styles = css`
    .translation-editor-form {
        padding: 32px;

        .loading-container {
            position: absolute;
            top: 50%;
            right: 50%;
            transform: translate(-50%, -50%);
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
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            box-shadow:
                0 0 2px 0 var(--Alias-drop-shadow-elevated-key, rgba(0, 0, 0, 0.12)),
                0 2px 6px 0 var(--Alias-drop-shadow-transition, rgba(0, 0, 0, 0.04)),
                0 4px 12px 0 var(--Alias-drop-shadow-ambient, rgba(0, 0, 0, 0.08));

            h2 {
                margin: 0 0 20px 0;
            }
        }

        .general-info {
            h2 {
                margin: 0 0 8px 0;
            }

            sp-textfield {
                width: 50%;
            }
        }

        .select-files {
            sp-button {
                --mod-button-background-color-default: transparent;
                --mod-button-background-color-hover: var(--spectrum-gray-200);
            }

            sp-icon-add {
                width: 48px;
                height: 48px;
            }

            .label {
                align-content: center;
            }
        }

        .languages-empty-state,
        .files-empty-state {
            display: flex;
            flex-direction: row;
            gap: 12px;
            padding: 12px 24px;
            border: 1px dashed var(--spectrum-gray-800);
            border-radius: 10px;
        }

        .add-files-dialog {
            --mod-dialog-confirm-buttongroup-padding-top: 82px;
        }

        .selected-files {
            display: flex;
            flex-direction: column;
            gap: 20px;

            .selected-files-header {
                display: flex;
                justify-content: space-between;
                align-items: center;

                h2 {
                    margin: 0;

                    span {
                        font-weight: 500;
                    }
                }

                .toggle-btn {
                    --mod-button-background-color-default: transparent;
                    --mod-button-background-color-hover: var(--spectrum-gray-200);
                    --mod-button-background-color-down: var(--spectrum-gray-300);
                    --mod-button-content-color-default: var(--spectrum-gray-800);
                    --mod-button-content-color-hover: var(--spectrum-gray-900);
                }

                .trigger-btn {
                    --mod-button-background-color-default: transparent;
                    --mod-button-background-color-hover: var(--spectrum-blue-200);
                    --mod-button-background-color-down: var(--spectrum-blue-300);
                    --mod-button-content-color-default: var(--spectrum-blue-900);
                    --mod-button-content-color-hover: var(--spectrum-blue-1000);
                }
            }
        }
    }
`;
