export const styles = `
    :host {
        display: block;
        background: var(--merch-badge-background-color);
        color: var(--merch-badge-color, #000);
        padding: var(--merch-badge-padding);
        border-radius: var(--merch-badge-border-radius);
        font-size: var(--merch-badge-font-size);
        line-height: 21px;
        border: var(--merch-badge-border);
        position: relative;
        inset-inline-start: 1px;
    }

    :host .badge-icon {
        margin-right: 5px;
        position: relative;
        top: 3px;
        height: 18px;
        width: 18px;
    }
`;
