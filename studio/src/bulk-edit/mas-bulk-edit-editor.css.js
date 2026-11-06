import { css } from 'lit';

export const styles = css`
    :host {
        display: block;
        box-sizing: border-box;
        width: 100%;
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
    }

    .back-link {
        display: inline-block;
        margin-bottom: 20px;
        color: var(--spectrum-blue-700, #1473e6);
    }

    .search-row {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 12px;
        margin-top: 20px;
    }

    .field {
        flex: 1;
        min-width: 160px;
    }

    sp-picker {
        width: 100%;
    }

    .replace-arrow,
    .file-actions {
        padding-top: 30px;
    }

    .file-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-left: auto;
    }

    .preview-notice {
        margin-top: 12px;
    }

    .fragments-table {
        border: 1px solid var(--spectrum-gray-200, #eaeaea);
        border-radius: 12px;
        overflow: hidden;
        margin-top: 40px;
    }

    sp-table {
        width: 100%;
    }

    sp-illustrated-message {
        --mod-illustrated-message-heading-max-inline-size: 100%;
        --mod-illustrated-message-description-max-inline-size: 100%;
        min-height: 300px;
        padding: 32px;
        box-sizing: border-box;
    }

    sp-illustrated-message h2 {
        margin: 0;
        font-size: 16px;
    }

    sp-illustrated-message p {
        margin: 0;
        font-size: 12px;
    }

    sp-icon-cloud {
        width: 48px;
        height: 48px;
    }

    @media (max-width: 700px) {
        :host {
            padding-inline: 16px;
        }

        header {
            align-items: flex-start;
        }

        .replace-arrow {
            display: none;
        }

        .file-actions {
            padding-top: 0;
        }

        .fragments-table {
            overflow-x: auto;
        }

        sp-table {
            min-width: 600px;
        }
    }
`;
