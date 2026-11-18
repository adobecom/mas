export const styles = `
    :host {
        display: flex;
        flex-wrap: nowrap;
        gap: 8px;
        margin-right: 16px;
        align-items: center;
    }

    ::slotted([slot='icon']) {
        display: flex;
        justify-content: center;
        align-items: center;
        height: max-content;
    }

    ::slotted([slot='description']) {
        font-size: 14px;
        line-height: 21px;
        margin: 0;
    }

    :host .hidden {
        display: none;
    }
`;
