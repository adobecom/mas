export const styles = `
    /* Default inherits the description color; authors pick one of these in the RTE. */
    :host(.spectrum-green-900) {
        color: var(--spectrum-green-900, #05834e);
    }
    :host(.spectrum-red-700) {
        color: var(--spectrum-red-700, #eb1000);
    }
    :host([hidden]) {
        display: none;
    }
`;
