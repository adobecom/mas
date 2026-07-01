export const styles = `
.expanded-content {
    /* Figma Alias/background/app-frame/layer-1. */
    background-color: var(--spectrum-background-layer-1-color, #f8f8f8);
    /* Per sketch: 20px top, 30px left, 20px right, 20px bottom. */
    padding: 20px 20px 20px 30px;
    border-bottom: 1px solid var(--spectrum-gray-100);
    position: relative;
}

.expanded-content sp-tab {
    font-size: 14px;
    line-height: 18px;
}

/* Tabs strip inherits the inset from .expanded-content padding above. */
.expanded-content sp-tabs {
    padding-left: 0;
    padding-right: 0;
}

/* Body S empty-state copy for the three variation tabs. */
.expanded-content .variations-empty {
    font-size: 14px;
    line-height: 1.5;
    font-weight: 400;
    color: var(--spectrum-gray-700, #505050);
    margin: 32px 0 0 0;
    padding: 0;
}

#content .expanded-content sp-table {
    /* 32px between the tabs/divider and the variations subtable. */
    margin-top: 32px;
    background-color: transparent;
    border: none;
}


#content .expanded-content sp-table sp-table-body {
    border: none;
}

.expanded-content .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    gap: 16px;
}

.expanded-content .loading-container p {
    font-size: 14px;
    color: var(--spectrum-gray-600);
}

/* Nested table rows styling */
#content .expanded-content .nested-fragment sp-table-row {
    background-color: var(--spectrum-blue-200);
    border-bottom: 1px solid var(--spectrum-gray-200);
}

/* Bento border-radius — applied to the first and last CELLS of the first
   and last variation rows. Single-row case: both :first-of-type and
   :last-of-type select the same row, so all four corners are rounded. */
#content .expanded-content sp-table-body mas-fragment-table:first-of-type sp-table-row > sp-table-cell:first-child {
    border-top-left-radius: 12px !important;
}
#content .expanded-content sp-table-body mas-fragment-table:first-of-type sp-table-row > sp-table-cell:last-child {
    border-top-right-radius: 12px !important;
}
#content .expanded-content sp-table-body mas-fragment-table:last-of-type sp-table-row > sp-table-cell:first-child {
    border-bottom-left-radius: 12px !important;
}
#content .expanded-content sp-table-body mas-fragment-table:last-of-type sp-table-row > sp-table-cell:last-child {
    border-bottom-right-radius: 12px !important;
}
#content .expanded-content sp-table-body mas-fragment-table:last-of-type sp-table-row {
    border-bottom: 0;
}

.nested-fragment.variation-search-highlight sp-table-row {
    outline: 2px solid var(--spectrum-blue-800);
    outline-offset: -2px;
}

/* Grouped variation expanded section */
.grouped-variation-expanded {
    display: flex;
    gap: 40px;
    align-items: flex-start;
    background-color: var(--spectrum-background-layer-1-color);
    border-left: 1px solid var(--spectrum-gray-400);
    border-bottom: 1px solid var(--spectrum-gray-400);
    padding: 12px 20px 20px 81px;
}

.promo-code-field {
    display: flex;
    flex-direction: column;
    min-width: 224px;
    max-width: 224px;
    min-height: 32px;
}

.tags-group {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
}

.field-label {
    font-size: 14px;
    font-weight: 400;
    line-height: 18px;
    color: var(--spectrum-gray-700);
    padding-top: 7px;
    padding-bottom: 7px;
}

.field-value {
    font-size: 14px;
    font-weight: 400;
    line-height: 18px;
    color: var(--spectrum-gray-800);
    min-height: 32px;
    display: flex;
    align-items: center;
}

.tags-group sp-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.no-tags {
    font-size: 14px;
    color: var(--spectrum-gray-500);
    font-style: italic;
}

.duplicate-action {
    display: flex;
    align-items: flex-end;
    margin-left: auto;
}

mas-fragment-variations sp-underlay + sp-dialog {
    position: fixed;
    border-radius: 16px;
    z-index: 1000;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 480px;
    background: var(--spectrum-white);
}

#duplicate-fields {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

#duplicate-fields aem-tag-picker-field {
    width: 100%;
}
`;
