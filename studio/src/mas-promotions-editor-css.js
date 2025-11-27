import { css } from 'lit';

export const styles = css`
    .promotions-form-container {
        background-color: var(--spectrum-white);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        box-sizing: border-box;
        position: relative;
        padding: 6px 24px 24px 24px;
        border-radius: 8px;
    }

    .promotions-form-panel {
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border: 1px solid var(--spectrum-gray-200);
        padding: 6px 24px 24px 24px;
        position: relative;
    }

    .promotion-loading {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.9);
        border-radius: 8px;
        z-index: 10;
    }

    .promotions-form-panel-content {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        gap: 24px;
    }

    .promotions-form-panel-content > div {
        flex: 1;
    }

    .promotions-form-fields sp-field-label {
        padding-top: 12px;
    }

    .promotions-form-fields sp-textfield {
        width: 100%;
    }

    .promotions-form-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding-top: 24px;
    }

    .promotions-form-surfaces-panel sp-button {
        background: white;
    }

    .promotions-form-surfaces-panel div.label {
        align-content: center;
    }

    .surfaces-empty-state {
        display: flex;
        flex-direction: row;
        gap: 12px;
        padding: 12px;
        border: 2px dashed var(--spectrum-gray-400);
        border-radius: 8px;
    }

    #add-surfaces-overlay sp-search {
        width: 100%;
    }

    #add-surfaces-overlay sp-table {
        border-radius: 8px;
        border: 1px solid var(--spectrum-gray-200);
    }

    .surfaces-results {
        padding: 12px 0px;
        font-size: 12px;
        color: var(--spectrum-gray-600);
        text-align: right;
    }

    .surfaces-results span {
        font-weight: 600;
    }
`;

export default styles;
