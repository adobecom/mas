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
                background-color: transparent;
            }

            sp-icon-add {
                width: 48px;
                height: 48px;
            }

            .label {
                align-content: center;
            }
        }

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
    }
`;
