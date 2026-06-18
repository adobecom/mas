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
                font-size: 25px;
                line-height: 30px;
                font-weight: 700;
            }
        }

        .title-field {
            width: 100%;
            margin-block-start: 0 !important;
            margin-top: 0 !important;
            --mod-textfield-min-block-size: 32px;
            --mod-textfield-corner-radius: 8px;
            --mod-textfield-border-color: #dadada;
            --mod-textfield-border-color-hover: #dadada;
            --mod-textfield-border-color-key-focus: #292929;
            --mod-textfield-border-color-down: #292929;
            --mod-textfield-border-width: 2px;
            --mod-textfield-focus-indicator-thickness: 0;
            --mod-textfield-focus-indicator-gap: 0;
            --mod-textfield-focus-indicator-color: transparent;
            --spectrum-focus-indicator-thickness: 0;
            --spectrum-focus-indicator-gap: 0;
            --spectrum-focus-indicator-color: transparent;
            --mod-textfield-background-color: #ffffff;
            --mod-textfield-spacing-inline: 12px;
            --mod-textfield-text-color-default: var(--spectrum-gray-600, #717171);
            --mod-textfield-placeholder-font-size: 14px;
            --mod-textfield-font-weight: 400;
            font-size: 14px;
            line-height: 18px;
        }

        sp-field-label[for='title'],
        sp-field-label[for='projectType'] {
            font-size: 14px;
            line-height: 18px;
            font-weight: 400;
            color: #505050;
            margin-block-end: 0;
            padding-block-start: 7px;
            padding-block-end: 7px;
            --mod-field-label-top-to-text: 7px;
            --mod-field-label-bottom-to-text: 7px;
            --mod-fieldlabel-color: #505050;
            --mod-fieldlabel-asterisk-color: #505050;
        }

        .form-field {
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid var(--spectrum-gray-300, #dadada);
            border-radius: 16px;

            h2 {
                margin: 0 0 20px 0;
                font-size: 18px;
                line-height: 22px;
                font-weight: 700;
            }
        }

        .metadata-info {
            position: relative;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px 6px;
            row-gap: 8px;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 12px;
            background: #fff6e7;
            overflow: hidden;
            isolation: isolate;
            z-index: 0;
        }

        .metadata-info::before,
        .metadata-info::after {
            content: '';
            position: absolute;
            top: -40px;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            pointer-events: none;
            z-index: 0;
        }

        .metadata-info::before {
            left: -40px;
            background: #d4916c;
            filter: blur(150px);
        }

        .metadata-info::after {
            right: -32px;
            background: #e86a00;
            filter: blur(120px);
        }

        .metadata-info > * {
            position: relative;
            z-index: 1;
        }

        .metadata-info sp-icon-alert {
            color: #d45b00;
            width: 20px;
            height: 20px;
        }

        .metadata-info h2 {
            margin: 0;
            font-size: 16px;
            line-height: 20px;
            font-weight: 700;
            color: #292929;
        }

        .metadata-info span {
            width: 100%;
            font-size: 14px;
            line-height: 18px;
            font-weight: 400;
            color: #292929;
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
                gap: 0;

                sp-textfield {
                    width: 90%;
                }

                span {
                    color: var(--spectrum-neutral-content-color-default);
                }
            }
        }

        .select-langs {
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

        .empty-state-plus {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            color: #292929;
            cursor: pointer;
            background: transparent;
            border: none;
            outline: none;
        }

        .empty-state-plus svg {
            width: 48px;
            height: 48px;
            display: block;
        }

        .languages-empty-state,
        .items-empty-state {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 10px;
            min-height: 72px;
            padding: 12px 32px 12px 24px;
            cursor: pointer;
            background-color: #ffffff;
            transition:
                background-color 0.35s ease-in-out,
                box-shadow 0.35s ease-in-out;

            &:hover {
                background-color: var(--spectrum-background-layer-2-color, #fafafa);
                box-shadow:
                    0px 0px 1px rgba(0, 0, 0, 0.1),
                    0px 2px 8px rgba(0, 0, 0, 0.06),
                    0px 4px 16px rgba(0, 0, 0, 0.1);
            }

            background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' fill='none'><rect width='100%25' height='100%25' rx='10' ry='10' stroke='%23292929' stroke-width='2' stroke-dasharray='7 7'/></svg>");
            background-repeat: no-repeat;
            background-position: center;
            border: none;
            border-radius: 10px;
            box-shadow:
                0px 0px 1px rgba(0, 0, 0, 0.08),
                0px 1px 4px rgba(0, 0, 0, 0.04),
                0px 2px 8px rgba(0, 0, 0, 0.08);

            .label {
                display: flex;
                flex-direction: column;
                gap: 2px;
                color: #292929;
                font-size: 14px;
                line-height: 18px;
            }

            .label strong {
                font-weight: 700;
            }

            .label span {
                font-weight: 400;
            }

            .label br {
                display: none;
            }
        }

        .add-items-dialog,
        .add-langs-dialog {
            --mod-buttongroup-spacing: 12px;
            --mod-dialog-confirm-buttongroup-padding-top: 32px;
            --mod-dialog-confirm-footer-padding-top: 32px;
            --mod-modal-confirm-border-radius: 16px;
            --mod-dialog-confirm-title-text-size: 22px;
            --mod-dialog-confirm-title-text-line-height: 26px;
            --mod-dialog-confirm-gap-size: 0;
            --mod-dialog-confirm-divider-block-spacing-start: 32px !important;
            --mod-dialog-confirm-divider-block-spacing-end: 0 !important;
            --mod-dialog-confirm-divider-height: 0 !important;
            --spectrum-dialog-confirm-divider-block-spacing-start: 32px !important;
            --spectrum-dialog-confirm-divider-block-spacing-end: 0 !important;
            --spectrum-dialog-confirm-divider-height: 0 !important;
            --mod-dialog-confirm-description-padding: 0;
            --mod-dialog-confirm-description-margin: 0;
        }

        .selected-langs {
            display: flex;
            flex-direction: column;
            gap: 20px;

            .selected-langs-header {
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
                    --mod-actionbutton-background-color-down: var(--spectrum-gray-300);
                    --mod-actionbutton-content-color-default: var(--spectrum-gray-800);
                    --mod-actionbutton-content-color-hover: var(--spectrum-gray-900);
                }

                .toggle-btn sp-icon-chevron-down {
                    transition: transform 0.2s ease-in-out;
                }

                .toggle-btn.is-open sp-icon-chevron-down {
                    transform: rotate(180deg);
                }
            }

            h2 sp-icon-asterisk100 {
                width: 10px;
                height: 10px;
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

        .add-items-dialog-footer {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 32px;
            width: 100%;
            margin: 0;
            padding: 0;
        }

        .add-items-dialog-footer .selected-items-toggle {
            margin: 0 0 32px 0;
            align-self: flex-end;
            font-weight: 500;
            width: auto;
            flex: 0 0 auto;
            --mod-button-background-color-default: transparent;
            --mod-button-background-color-hover: transparent;
            --mod-button-background-color-down: transparent;
            --mod-button-background-color-focus: transparent;
            --mod-button-border-color-default: transparent;
            --mod-button-border-color-hover: transparent;
            --mod-button-border-color-down: transparent;
            --mod-button-border-color-focus: transparent;
            --mod-button-content-color-default: #292929;
            --mod-button-content-color-hover: #292929;
        }

        .add-items-dialog-footer .add-items-dialog-actions {
            display: flex;
            justify-content: flex-end;
            align-self: flex-end;
            margin: 0;
            padding: 0;
            width: auto;
            --mod-buttongroup-spacing: 12px;
        }

        .add-items-dialog-footer .selected-items-toggle sp-icon {
            transform: scaleX(1);
            transition: transform 0.3s ease-in-out;
        }

        .add-items-dialog-footer .selected-items-toggle sp-icon.flipped {
            transform: scaleX(-1);
        }
    `,
];
