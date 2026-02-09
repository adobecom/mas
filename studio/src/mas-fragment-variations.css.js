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

/* Grouped variation rows */
.grouped-variation-row {
    display: flex;
    align-items: flex-start;
    gap: 24px;
}

.grouped-variation-info {
    flex: 1;
    min-width: 0;
}

.grouped-variation-tags-cell {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px 0;
}

.grouped-tags-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--spectrum-gray-600);
}

.grouped-variation-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.locale-tag-pill {
    display: inline-block;
    background: var(--spectrum-gray-200);
    border-radius: 4px;
    padding: 4px 10px;
    font-size: 13px;
    color: var(--spectrum-gray-800);
    white-space: nowrap;
}

.no-tags {
    font-size: 13px;
    color: var(--spectrum-gray-500);
    font-style: italic;
}
`;
