export const styles = `
    :host {
        --merch-addon-gap: 9px;
        --merch-addon-align: start;
        --merch-addon-checkbox-size: unset;
        --merch-addon-checkbox-border: unset;
        --merch-addon-checkbox-radius: unset;
        --merch-addon-checkbox-checked-bg: unset;
        --merch-addon-checkbox-checked-color: unset;
        --merch-addon-label-size: unset;
        --merch-addon-label-color: unset;
        --merch-addon-label-line-height: unset;
        display: flex;
        gap: var(--merch-addon-gap);
        align-items: var(--merch-addon-align);
        cursor: pointer;
    }

    :host([custom-checkbox]) #addon-checkbox {
        display: none;
    }

    :host([custom-checkbox]) #custom-checkbox {
        display: block;
    }

    :host #custom-checkbox {
        display: none;
        width: var(--merch-addon-checkbox-size);
        height: var(--merch-addon-checkbox-size);
        border: var(--merch-addon-checkbox-border);
        border-radius: var(--merch-addon-checkbox-radius);
        box-sizing: border-box;
        background: var(--merch-addon-checkbox-bg, transparent);
    }

    :host #addon-checkbox:checked + #custom-checkbox {
        background: var(--merch-addon-checkbox-checked-bg) no-repeat
            var(
                --merch-addon-checkbox-checked-bg-color,
                var(--merch-addon-checkbox-checked-color)
            );
        border-color: var(--merch-addon-checkbox-checked-color);
    }

    ::slotted(p:not([data-plan-type])) {
        color: var(--merch-addon-label-color);
        font-size: var(--merch-addon-label-size);
        line-height: var(--merch-addon-label-line-height);
        font-style: normal;
        font-weight: var(--merch-addon-label-weight, 400);
        cursor: pointer;
    }

    ::slotted(p[data-plan-type]) {
        display: none;
    }

    :host([plan-type='PUF']) ::slotted(p[data-plan-type='PUF']) {
        display: block;
    }

    :host([plan-type='ABM']) ::slotted(p[data-plan-type='ABM']) {
        display: block;
    }

    :host([plan-type='M2M']) ::slotted(p[data-plan-type='M2M']) {
        display: block;
    }
`;
