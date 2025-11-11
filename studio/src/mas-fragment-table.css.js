import { css } from 'lit';

export const styles = css`
    :host {
        display: contents;
    }

    /* Expanded content container in shadow DOM */
    .expanded-content {
        display: block;
        width: 100%;
        padding: 24px;
        background-color: var(--spectrum-gray-50);
        border-bottom: 1px solid var(--spectrum-gray-200);
    }

    /* Slot for light DOM content */
    ::slotted(*) {
        width: 100%;
    }
`;
