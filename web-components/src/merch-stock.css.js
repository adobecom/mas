export const styles = `
    ::slotted(div) {
        display: none;
    }

    :host(:not([plan-type])) {
        display: none;
    }

    :host([plan-type='ABM']) ::slotted([data-plan-type='ABM']),
    :host([plan-type='M2M']) ::slotted([data-plan-type='M2M']),
    :host([plan-type='PUF']) ::slotted([data-plan-type='PUF']) {
        display: block;
    }

    sp-checkbox {
        margin: 0;
        font-size: 12px;
        line-height: 15px;
    }
`;
