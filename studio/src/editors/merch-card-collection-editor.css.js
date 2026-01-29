import { css } from 'lit';

export const styles = css`
    :host {
        display: flex;
        min-height: 500px;
        flex-direction: column;
        gap: 16px;
        border-radius: 4px;
        transition: all 0.2s ease;
    }

    :host(.dragover) {
        background-color: var(--spectrum-blue-50);
        border: 2px dashed var(--spectrum-blue-500);
    }

    /* Default Card Drop Zone Styles */
    .default-card-section {
        margin-bottom: 24px;
        padding: 16px;
        background-color: var(--spectrum-gray-50);
        border-radius: 8px;
    }

    .default-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        font-weight: 600;
        color: var(--spectrum-gray-800);
    }

    .default-card-header sp-icon-star {
        color: var(--spectrum-yellow-600);
    }

    .default-card-drop-zone {
        min-height: 80px;
        border: 2px dashed var(--spectrum-gray-300);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        transition: all 0.2s ease;
        background-color: var(--spectrum-gray-75);
        position: relative;
        z-index: 0;
    }

    .default-card-drop-zone.empty:hover {
        border-color: var(--spectrum-blue-400);
        background-color: var(--spectrum-blue-50);
    }

    .default-card-drop-zone.dragover {
        border-color: var(--spectrum-blue-500);
        background-color: var(--spectrum-blue-100);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .default-card-drop-zone.has-default {
        background-color: var(--spectrum-yellow-50);
        border-color: var(--spectrum-yellow-400);
    }

    .drop-zone-placeholder {
        text-align: center;
        color: var(--spectrum-gray-600);
    }

    .drop-zone-placeholder sp-icon-order {
        display: block;
        margin: 0 auto 8px;
        color: var(--spectrum-gray-400);
    }

    .drop-zone-placeholder p {
        margin: 4px 0;
    }

    .drop-zone-placeholder .help-text {
        font-size: 12px;
        color: var(--spectrum-gray-500);
    }

    .default-card-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        gap: 12px;
    }

    .default-card-info {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        min-width: 0;
    }

    .default-card-icon {
        color: var(--spectrum-yellow-600);
        flex-shrink: 0;
    }

    .default-card-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }

    .default-card-title {
        font-weight: 600;
        color: var(--spectrum-gray-800);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .default-card-name {
        font-size: 12px;
        color: var(--spectrum-gray-600);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* Default Card Indicator in List */
    .item-wrapper.is-default-card {
        background-color: var(--spectrum-yellow-50);
        border-color: var(--spectrum-yellow-400);
    }

    .item-wrapper.is-default-card .item-content {
        gap: 8px;
    }

    .default-indicator {
        color: var(--spectrum-yellow-600);
        flex-shrink: 0;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .hide-cards-control,
    .pagination-control {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .page-size-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .cards-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-height: 60px;
    }

    .hidden {
        display: none;
    }

    .empty-cards-placeholder {
        min-height: 60px;
        border: 2px dashed transparent;
        transition: all 0.2s ease;
    }

    .empty-cards-placeholder:hover {
        border-color: var(--spectrum-gray-300);
        background-color: var(--spectrum-gray-50);
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
        gap: 12px;
        border: 1px solid var(--spectrum-gray-200);
        border-radius: 4px;
        background-color: var(--spectrum-gray-50);
        cursor: grab;
        position: relative;
        z-index: 0;
    }

    .item-wrapper:hover {
        background-color: var(--spectrum-gray-100);
    }

    .item-wrapper sp-action-button {
        visibility: hidden;
    }

    .item-wrapper:hover sp-action-button {
        visibility: visible;
    }

    /* Ensure default card remove button is always visible */
    .default-card-content sp-action-button {
        visibility: visible;
    }

    .item-wrapper.dragging {
        opacity: 0.5;
        z-index: 100;
    }

    .item-wrapper.dragover {
        border: 2px dashed var(--spectrum-blue-500);
    }

    .item-content {
        display: flex;
        align-items: center;
        gap: 12px;
        justify-content: space-between;
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

    .item-text {
        display: flex;
        flex-direction: column;
    }

    .item-label,
    .item-subtext {
        display: flex;
        flex-direction: column;
    }

    .item-title {
        font-size: 14px;
        font-weight: 500;
    }

    .item-label {
        font-weight: 500;
    }

    .item-subtext {
        font-size: 12px;
        color: var(--spectrum-gray-700);
        margin-top: 2px;
    }

    .item-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        width: 124px;
    }

    sp-icon-close {
        cursor: pointer;
        color: var(--spectrum-gray-700);
    }

    sp-icon-close:hover {
        color: var(--spectrum-red-600);
    }

    sp-icon-order {
        cursor: grab;
        color: var(--spectrum-gray-700);
    }

    sp-icon-order:hover {
        color: var(--spectrum-blue-600);
    }

    .editor-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 16px;
        border-radius: 4px;
    }

    .editor-container.dragover {
        background-color: var(--spectrum-blue-50);
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
        background-color: var(--spectrum-gray-50);
        border: 1px solid var(--spectrum-gray-200);
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

    sp-icon-preview {
        display: none;
        pointer-events: all;
    }

    .item-wrapper:hover sp-icon-preview {
        display: block;
    }
`;
