import { css } from 'lit';

export const styles = css`
    :host {
        display: block;
        box-sizing: border-box;
        width: 100%;
        max-width: 1100px;
        margin: 0 auto;
        padding: 24px 32px 120px;
    }

    header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
    }

    h1 {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
    }

    .card {
        display: flex;
        flex-direction: column;
        padding: 20px;
        border: 1px solid var(--spectrum-gray-200, #eaeaea);
        border-radius: 12px;
    }

    .label-row {
        display: flex;
        align-items: center;
        gap: 4px;
        padding-block: var(--spectrum-field-label-top-to-text-medium, 7px)
            var(--spectrum-field-label-bottom-to-text-medium, 4px);
    }

    .label-row sp-field-label {
        padding: 0;
    }

    sp-field-label[for='project-title'],
    sp-help-text[data-testid='title-error'] {
        display: flex;
        align-items: center;
    }

    sp-textfield {
        width: 100%;
        max-width: 480px;
    }
`;
