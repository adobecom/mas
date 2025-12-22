import { css } from 'lit';

export const styles = css`
    .quick-actions-toolbar {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 4px 8px;
        background-color: var(--spectrum-gray-50, #ffffff);
        border: 1px solid var(--spectrum-gray-300, #dadada);
        border-radius: 8px;
        box-shadow:
            0 4px 8px rgba(0, 0, 0, 0.12),
            0 8px 24px rgba(0, 0, 0, 0.08);

        /* Styles when dragging is active */
        &.dragging {
            user-select: none;
            cursor: grabbing;
            box-shadow:
                0 8px 16px rgba(0, 0, 0, 0.16),
                0 16px 32px rgba(0, 0, 0, 0.12);
        }

        .drag-handle {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
            margin-right: 4px;
            padding-right: 8px;
            border-right: 1px solid var(--spectrum-gray-200);
            color: var(--spectrum-gray-600);
            cursor: grab;
            touch-action: none;

            &:active {
                cursor: grabbing;
            }

            &:hover {
                color: var(--spectrum-gray-800);
            }
        }

        .actions {
            display: flex;
            align-items: center;
            gap: 2px;

            sp-action-button {
                --spectrum-actionbutton-background-color-default: transparent;
                --spectrum-actionbutton-border-color-default: transparent;
                --spectrum-actionbutton-background-color-disabled: transparent;

                &:hover {
                    --spectrum-actionbutton-background-color-hover: var(--spectrum-gray-200);
                }
            }

            .delete-action:not([disabled]) {
                sp-icon-delete {
                    color: var(--spectrum-negative-color-900, #d31510);
                }

                &:hover sp-icon-delete {
                    color: var(--spectrum-negative-color-1000, #b40000);
                }
            }
        }
    }
`;
