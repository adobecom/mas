import { css } from 'lit';

export const fieldStatusStyles = css`
    .field-status-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
        font-size: 14px;
        line-height: 18px;
        color: var(--spectrum-accent-content-color-default, #3b63fb);
    }

    .field-status-icon {
        color: inherit;
        flex: none;
    }

    .field-status-label {
        color: inherit;
    }

    .field-status-restore-link {
        position: relative;
        color: inherit;
        font: inherit;
        line-height: inherit;
        text-decoration: underline;
        cursor: pointer;
    }

    .field-status-restore-link-prefix {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    .field-status-restore-link:hover {
        color: var(--spectrum-accent-content-color-hover, #2f55e0);
    }

    .field-status-restore-link:focus-visible {
        outline: 2px solid var(--spectrum-accent-content-color-key-focus, #2f55e0);
        outline-offset: 2px;
    }

    .setting-override-indicator {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--spectrum-blue-700);
        line-height: 0;
    }
`;
