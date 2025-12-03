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
    color: #292929;
    margin: 0 0 16px 0;
    padding-left: 16px;
}

.expanded-content sp-tabs {
    padding-left: 16px;
}

.expanded-content sp-tab {
    font-size: 14px;
    line-height: 18px;
}

#content .expanded-content sp-table {
    margin-top: 16px;
    background-color: #e5f0fe;
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
    background-color: var(--spectrum-blue-50);
    border-bottom: 1px solid var(--spectrum-blue-100);
}

#content .expanded-content .nested-fragment sp-table-row:hover {
    background-color: var(--spectrum-blue-100);
}
`;
