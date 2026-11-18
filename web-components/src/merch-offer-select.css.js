export const styles = `
    :host {
        display: inline-block;
    }

    :host .horizontal {
        display: flex;
        flex-direction: row;
    }

    fieldset {
        display: contents;
    }

    :host([variant='subscription-options']) {
        display: flex;
        flex-direction: column;
        gap: var(--consonant-merch-spacing-xs);
    }
`;
