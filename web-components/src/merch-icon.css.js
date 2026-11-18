export const styles = `
    :host {
        --img-width: 32px;
        --img-height: 32px;
        display: block;
        width: var(--mod-img-width, var(--img-width));
        height: var(--mod-img-height, var(--img-height));
    }

    :host([size='xxs']) {
        --img-width: 13px;
        --img-height: 13px;
    }

    :host([size='xs']) {
        --img-width: 20px;
        --img-height: 20px;
    }

    :host([size='s']) {
        --img-width: 24px;
        --img-height: 24px;
    }

    :host([size='m']) {
        --img-width: 30px;
        --img-height: 30px;
    }

    :host([size='l']) {
        --img-width: 40px;
        --img-height: 40px;
    }

    img {
        width: var(--mod-img-width, var(--img-width));
        height: var(--mod-img-height, var(--img-height));
    }
`;
