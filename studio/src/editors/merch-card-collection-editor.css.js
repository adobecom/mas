import { css } from 'lit';

export const styles = css`
    :host {
        display: flex;
        min-height: 500px;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
        border-radius: 4px;
        transition: all 0.2s ease;
    }

    :host(.dragover) {
        background-color: var(--spectrum-global-color-blue-50);
        border: 2px dashed var(--spectrum-global-color-blue-500);
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .hide-cards-control {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .hidden {
        display: none;
    }

    .items-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px 0;
    }

    .item-wrapper {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 12px;
        border: 1px solid var(--spectrum-global-color-gray-200);
        border-radius: 4px;
        background-color: var(--spectrum-global-color-gray-50);
        cursor: grab;
    }

    .item-wrapper:hover {
        background-color: var(--spectrum-global-color-gray-100);
    }

    sp-action-button {
        visibility: hidden;
    }

    .item-wrapper:hover sp-action-button {
        visibility: visible;
    }

    .item-wrapper.dragging {
        opacity: 0.5;
    }

    .item-wrapper.dragover {
        border: 2px dashed var(--spectrum-global-color-blue-500);
    }

    .item-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .item-icons {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .item-icon {
        width: 24px;
        height: 24px;
        object-fit: contain;
    }

    .item-title {
        font-size: 14px;
        font-weight: 500;
    }

    .item-actions {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    sp-icon-close {
        cursor: pointer;
        color: var(--spectrum-global-color-gray-700);
    }

    sp-icon-close:hover {
        color: var(--spectrum-global-color-red-600);
    }

    sp-icon-drag-handle {
        cursor: grab;
        color: var(--spectrum-global-color-gray-700);
    }

    sp-icon-drag-handle:hover {
        color: var(--spectrum-global-color-blue-600);
    }

    .editor-container {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        padding: 16px;
        border-radius: 4px;
    }

    .editor-container.dragover {
        background-color: var(--spectrum-global-color-blue-50);
    }

    .tip {
        display: flex;
        gap: 8px;
        padding-top: 64px;
    }

    .drop-zone {
        position: relative;
        transition: all 0.2s ease;
        border-radius: 4px;
        padding: 8px;
    }

    /* Preview Popover Styles */
    .preview-popover {
        position: fixed;
        min-width: 320px;
        background-color: var(--spectrum-global-color-gray-50);
        border: 1px solid var(--spectrum-global-color-gray-200);
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        overflow: hidden;
        animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background-color: var(--spectrum-global-color-gray-100);
        border-bottom: 1px solid var(--spectrum-global-color-gray-200);
    }

    .preview-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
    }

    .preview-content {
        padding: 16px;
        max-height: 400px;
        overflow-y: auto;
    }

    sp-icon-preview {
        display: none;
        pointer-events: all;
    }

    .item-wrapper:hover sp-icon-preview {
        display: block;
    }
`;
