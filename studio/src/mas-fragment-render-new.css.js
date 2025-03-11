import { css } from 'lit';

export const styles = css`
    :host {
        display: contents;
    }

    .render-fragment {
        position: relative;
        transition: all 0.2s ease;
    }

    .render-fragment.dragging {
        opacity: 0.6;
        transform: scale(0.95);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .render-fragment-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
    }

    .render-fragment-content {
        cursor: grab;
        transition: all 0.2s ease;
    }

    .render-fragment-content:hover {
        transform: translateY(-2px);
    }

    .render-fragment-content:active {
        cursor: grabbing;
    }

    .overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        font-size: 24px;
        cursor: pointer;
    }

    .unknown-fragment {
        padding: 16px;
        border: 1px solid var(--spectrum-global-color-gray-200);
        border-radius: 4px;
        background-color: var(--spectrum-global-color-gray-50);
        display: flex;
        align-items: center;
        gap: 8px;
    }
`; 