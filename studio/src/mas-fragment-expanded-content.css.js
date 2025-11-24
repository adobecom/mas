export const styles = `
/* Expanded content styles */
.expanded-content {
    padding: 24px;
    background-color: var(--spectrum-gray-50);
}

/* Highlight expanded parent row */
sp-table-row.expanded {
    background-color: var(--spectrum-blue-100) !important;
}

sp-table-row.expanded:hover {
    background-color: var(--spectrum-blue-200) !important;
}

.expanded-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--spectrum-gray-900);
    margin: 0 0 16px 0;
}

.expanded-content sp-tabs {
    width: 100%;
}

.expanded-content sp-tab-panel {
    width: 100%;
    margin-top: 16px;
}

.expanded-content sp-table {
    width: 100%;
    border: none !important;
}

.expanded-content sp-table-body {
    border: none !important;
    border-inline: none !important;
    border-radius: none !important;
}

.expanded-content .nested-fragment {
    width: 100%;
}

.expanded-content .nested-fragment sp-table-row,
.expanded-content sp-table-body .nested-fragment sp-table-row {
    background-color: var(--spectrum-blue-100) !important;
}

.expanded-content .nested-fragment sp-table-row:hover,
.expanded-content sp-table-body .nested-fragment sp-table-row:hover {
    background-color: var(--spectrum-blue-200) !important;
}

.tab-content-placeholder {
    padding: 20px;
    text-align: center;
    color: var(--spectrum-gray-600);
}

/* Loading state styles */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    gap: 16px;
}

.loading-container sp-progress-circle {
    margin-bottom: 8px;
}

.loading-container p {
    color: var(--spectrum-gray-700);
    font-size: 14px;
    margin: 0;
}`;
