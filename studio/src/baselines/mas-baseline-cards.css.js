import { css } from 'lit';
import { editorFormFieldStyles, editorHeadingStyles, pageContainerStyles } from '../common/styles/page-container-styles.css.js';
import { tableBodyBaseStyles, tableCellBaseStyles, tableHeaderBaseStyles } from '../common/styles/table-styles.css.js';

export default [
    pageContainerStyles,
    editorFormFieldStyles,
    editorHeadingStyles,
    tableHeaderBaseStyles,
    tableBodyBaseStyles,
    tableCellBaseStyles,
    css`
        :host {
            display: block;
            --baseline-cards-section-gap: 20px;
            padding-bottom: 24px;
        }

        .page-container {
            display: flex;
            flex-direction: column;
            gap: var(--baseline-cards-section-gap);
            padding: 6px 24px 24px 24px;
        }

        .baseline-cards-header {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;

            h1 {
                margin: 0;
            }
        }

        .form-field h2:has(+ .hint) {
            margin-bottom: 4px;
        }

        .hint {
            margin: 0 0 20px;
            color: var(--spectrum-gray-700);
            font-size: 13px;
        }

        .form-field sp-field-label {
            padding-top: 12px;
        }

        .form-field > sp-field-label:first-of-type {
            padding-top: 0;
        }

        #links,
        #collection-label {
            width: 100%;
        }

        .links {
            display: flex;
            flex-direction: column;
            margin: 16px 0 0;
            padding: 0;
            border: 1px solid var(--spectrum-gray-200);
            border-radius: 8px;
            list-style: none;
        }

        .link {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            font-size: 13px;
        }

        .link + .link {
            border-top: 1px solid var(--spectrum-gray-200);
        }

        .link-title {
            flex: 1;
            min-width: 0;
        }

        .link-error,
        .item-error {
            color: var(--spectrum-negative-color-900);
        }

        .link-hint {
            color: var(--spectrum-gray-700);
        }

        .positive {
            color: var(--spectrum-positive-color-900);
        }

        .negative {
            color: var(--spectrum-negative-color-900);
        }

        .empty-state {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 12px;
            box-sizing: border-box;
            width: 100%;
            padding: 12px 24px;
            border: 1px dashed var(--spectrum-gray-800);
            border-radius: 10px;

            sp-icon-shopping-cart,
            sp-icon-apps {
                flex-shrink: 0;
                color: var(--spectrum-gray-600);
            }

            .label {
                align-content: center;
                color: var(--spectrum-gray-800);
            }
        }

        .products {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .product {
            box-sizing: border-box;
            padding: 16px;
            border: 1px solid var(--spectrum-gray-200);
            border-radius: 8px;
            background: var(--spectrum-white);

            h3 {
                margin: 0;
                color: var(--spectrum-gray-900);
                font-size: 16px;
            }
        }

        .product-meta {
            margin: 4px 0 16px;
            color: var(--spectrum-gray-700);
            font-size: 13px;
        }

        .product.free {
            border-style: dashed;
            background: var(--spectrum-gray-75);

            h3 {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .product-meta {
                margin-bottom: 8px;
            }
        }

        .free-collections {
            margin: 0;
            font-size: 13px;
        }

        .shared-offer {
            margin-bottom: 10px;
        }

        .plans,
        .disclaimers {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 24px;
        }

        .plan {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .plan + .plan {
            padding-inline-start: 24px;
            border-inline-start: 1px solid var(--spectrum-gray-200);
        }

        .offer {
            display: flex;
            align-items: flex-start;
            gap: 4px;

            mas-offer-field {
                flex: 1;
                min-width: 0;
            }
        }

        .disclaimer sp-field-label {
            padding-top: 0;
        }

        .disclaimer-input {
            display: flex;
            align-items: flex-start;
            gap: 8px;

            sp-combobox {
                flex: 1;
                min-width: 0;
            }

            mas-fragment-status {
                margin-block-start: 5px;
            }
        }

        .collection-label {
            max-width: 480px;
            margin-bottom: 20px;
        }

        .items {
            overflow: hidden;
            border: 1px solid var(--spectrum-gray-200);
            border-radius: 8px;

            sp-table-head-cell {
                border-bottom: 1px solid var(--spectrum-gray-300);
            }

            sp-table-head-cell.type,
            sp-table-cell.type,
            sp-table-head-cell.item-plan,
            sp-table-cell.item-plan {
                flex-grow: 0.4;
            }

            sp-table-head-cell.title,
            sp-table-cell.title {
                flex-grow: 3;
            }

            sp-table-cell.title,
            sp-table-cell.status {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                justify-content: center;
            }
        }

        .item-path {
            color: var(--spectrum-gray-700);
            font-size: 11px;
            word-break: break-all;
        }

        .create-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
        }

        .visually-hidden {
            position: absolute;
            width: 1px;
            height: 1px;
            overflow: hidden;
            clip-path: inset(50%);
            white-space: nowrap;
        }
    `,
];
