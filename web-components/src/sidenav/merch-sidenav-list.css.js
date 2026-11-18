export const styles = `
    :host {
        display: block;
        contain: content;
        margin-top: var(--merch-sidenav-list-gap);
    }

    :host h2 {
        color: var(--merch-sidenav-list-title-color);
        font-size: var(--merch-sidenav-list-title-font-size);
        font-weight: var(--merch-sidenav-list-title-font-weight);
        padding: var(--merch-sidenav-list-title-padding);
        line-height: var(--merch-sidenav-list-title-line-height);
        margin: 0;
        text-transform: uppercase;
    }

    :host(:dir(rtl)) h2 {
        text-align: right;
    }

    .right {
        position: absolute;
        inset-inline-end: 0;
    }

    :host(:dir(rtl)) .right {
        right: initial;
        left: 0;
    }
`;
