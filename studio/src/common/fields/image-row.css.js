import { css } from 'lit';

export const imageRowStyles = css`
    .image-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: var(--spectrum-white, #fff);
        border: 2px solid var(--spectrum-gray-300, #dadada);
        border-radius: 10px;
        cursor: pointer;
    }

    .image-row:hover,
    .image-row:focus-visible {
        background: var(--spectrum-gray-200, #e9e9e9);
    }

    .image-row-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        flex-shrink: 0;
    }

    .image-row-icon img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .image-row-icon sp-theme {
        display: flex;
        width: 100%;
        height: 100%;
        background: transparent;
    }

    .image-row-icon sp-theme > * {
        width: 40px;
        height: 40px;
    }

    .image-row-text {
        display: flex;
        flex-direction: column;
        min-width: 0;
        font-size: 14px;
        line-height: 18px;
    }

    .image-row-name {
        font-weight: 500;
        color: var(--spectrum-gray-800, #292929);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .image-row-description {
        font-weight: 400;
        color: var(--spectrum-gray-700, #505050);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .image-row .action-menu {
        margin-left: auto;
    }

    .image-row .action-menu sp-menu {
        --mod-menu-item-selectable-edge-to-text-not-selected: var(--spectrum-menu-item-label-inline-edge-to-content, 12px);
    }
`;
