import { css } from 'lit';

export const styles = css`
    :host {
        display: contents;
    }

    .mas-fragment {
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .mas-fragment.dragging {
        opacity: 0.6;
        transform: scale(0.95);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .mas-fragment:hover {
        transform: translateY(-2px);
    }
`; 