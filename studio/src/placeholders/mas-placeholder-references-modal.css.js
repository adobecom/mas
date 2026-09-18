import { css } from 'lit';

export const styles = css`
    :host {
        display: contents;
    }

    .dialog-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 480px;
    }

    .reference-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
        max-height: 240px;
        overflow-y: auto;
    }

    .reference-list li {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .reference-type {
        font-size: 12px;
        color: var(--spectrum-gray-700, #505050);
        text-transform: uppercase;
    }

    .reference-warning {
        color: var(--spectrum-negative-color, #d7373f);
    }

    .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding-top: 8px;
    }
`;
