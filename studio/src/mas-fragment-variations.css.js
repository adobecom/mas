export const styles = `
.expanded-content {
    background-color: var(--spectrum-white);
    padding: 16px 0px 24px 30px;
    border-bottom: 1px solid var(--spectrum-gray-100);
    position: relative;
}

.expanded-title {
    font-size: 14px;
    font-weight: 700;
    line-height: 18px;
    color: var(--spectrum-gray-800);
    margin: 0 0 16px 0;
    padding-left: 16px;
}

.expanded-content sp-tab {
    font-size: 14px;
    line-height: 18px;
}

#content .expanded-content sp-table {
    margin-top: 16px;
    background-color: var(--spectrum-blue-100);
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

.expanded-content .tab-content-placeholder p {
    font-size: 14px;
    color: var(--spectrum-gray-600);
    margin: 0;
}

/* Nested table rows styling */
#content .expanded-content .nested-fragment sp-table-row {
    background-color: var(--spectrum-blue-200);
    border-bottom: 1px solid var(--spectrum-gray-200);
}

#content .expanded-content .nested-fragment sp-table-row:hover {
    background-color: var(--spectrum-blue-400);
}

/* Grouped variation expanded section */
.grouped-variation-expanded {
    display: flex;
    gap: 40px;
    align-items: flex-start;
    background-color: var(--spectrum-gray-100);
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
`;
