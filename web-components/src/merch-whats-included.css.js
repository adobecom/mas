export const styles = `
    :host {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        overflow: hidden;
        box-sizing: border-box;
        row-gap: 10px;
    }

    :host([has-bullets]) {
        flex-direction: column;
        align-items: start;
    }

    ::slotted([slot='heading']) {
        font-size: 14px;
        font-weight: 700;
        margin-right: 16px;
    }

    ::slotted([slot='heading']:empty) {
        display: none;
    }

    ::slotted([slot='content']) {
        display: contents;
    }

    ::slotted([slot='contentBullets']) {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 5px 0;
    }

    .hidden {
        display: none;
    }

    .see-more {
        font-size: 14px;
        text-decoration: underline;
        color: var(--link-color-dark);
    }
`;
