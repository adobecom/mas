import { html, LitElement, nothing, css } from 'lit';

export const styles = css`
    :host {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    /* Collection title styles */
    .collection-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        font-weight: bold;
        flex-grow: 1;
        margin-right: 8px;
    }

    .collection-title img {
        width: 24px;
        height: 24px;
    }

    /* Collection header styles */
    .collection-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        position: relative;
        width: 100%;
        box-sizing: border-box;
        justify-content: flex-start;
    }

    .collection-header .collection-title {
        margin-bottom: 0;
    }

    /* Collection icon styles */
    .collection-icon {
        width: 24px;
        height: 24px;
        object-fit: contain;
    }

    /* Card icon styles */
    .card-icon {
        width: 24px;
        height: 24px;
    }

    /* Collection wrapper styles */
    .collection-wrapper {
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        margin-bottom: 8px;
        overflow: hidden;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        transition: box-shadow 0.2s ease;
    }

    .collection-wrapper.expanded {
        background-color: #f9f9f9;
        box-shadow: 0 0 0 2px var(--spectrum-global-color-blue-400);
    }

    .collection-wrapper.dragging {
        opacity: 0.5;
    }

    .collection-wrapper.dragover {
        outline: 2px dashed var(--spectrum-global-color-blue-400);
    }

    /* Collection content styles */
    .collection-content {
        padding: 12px;
        width: 100%;
        box-sizing: border-box;
    }

    /* Expand icon styles */
    .expand-icon {
        transition: transform 0.2s ease;
    }

    .expand-icon.expanded {
        transform: rotate(90deg);
    }

    /* Merch card list styles */
    .merch-card-list {
        list-style: none;
        padding: 0;
        margin: 0;
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
    }

    /* Merch card item styles */
    .merch-card-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        margin-bottom: 8px;
        padding-inline-end: 100px;
        position: relative;
    }

    .merch-card-item.dragging {
        opacity: 0.5;
    }

    .merch-card-item.dragover {
        outline: 2px dashed var(--spectrum-global-color-blue-400);
    }

    /* Drag handle styles */
    sp-icon-drag-handle {
        visibility: hidden;
        position: absolute;
        right: 8px;
        cursor: grab;
        color: #666;
    }

    /* Position drag handle for cards */
    .merch-card-item sp-icon-drag-handle {
        top: 50%;
        transform: translateY(-50%);
    }

    /* Position drag handle for collections */
    .collection-wrapper sp-icon-drag-handle {
        top: 8px;
    }

    /* Show drag handle on hover */
    .merch-card-item:hover sp-icon-drag-handle,
    .collection-wrapper:hover sp-icon-drag-handle {
        visibility: visible;
    }

    /* Disable drag handle when collection is expanded */
    .collection-wrapper.expanded sp-icon-drag-handle {
        opacity: 0.3;
        pointer-events: none;
        visibility: hidden;
    }
`;
