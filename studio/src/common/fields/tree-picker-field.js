import { css, html, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { EVENT_CHANGE } from '../../constants.js';

/**
 * Builds selection helpers for tree data and provides consistent summary text formatting.
 *
 * @param {Array<{name: string, label: string, children?: Array}>} tree
 * @returns {{
 *   leafIds: string[],
 *   selectedLeafIds: (value?: Array<string>) => string[],
 *   summaryText: (value?: Array<string>, placeholder?: string) => string,
 *   summaryForSelectedLeafIds: (selectedIds?: Array<string>, placeholder?: string) => string
 * }}
 */
export const createTreeSelectionSummary = (tree = []) => {
    const nodeMap = new Map();
    const childrenMap = new Map();
    const parentMap = new Map();
    const leafDescendantsMap = new Map();
    const rootIds = [];
    const leafIds = [];

    const walk = (node, parentId = null) => {
        const nodeId = `${node.name}`;
        if (!nodeId || nodeMap.has(nodeId)) return;

        const children = node.children || [];
        const childIds = [];
        nodeMap.set(nodeId, {
            id: nodeId,
            label: `${node.label || nodeId}`,
            hasChildren: children.length > 0,
        });
        childrenMap.set(nodeId, childIds);
        parentMap.set(nodeId, parentId);

        for (const child of children) {
            const childId = `${child.name}`;
            if (!childId) continue;
            childIds.push(childId);
            walk(child, nodeId);
        }
    };

    for (const rootNode of tree) {
        const rootId = `${rootNode.name}`;
        if (!rootId) continue;
        rootIds.push(rootId);
        walk(rootNode);
    }

    const collectLeafDescendants = (nodeId) => {
        const children = childrenMap.get(nodeId) || [];
        if (children.length === 0) {
            leafDescendantsMap.set(nodeId, [nodeId]);
            return [nodeId];
        }

        const descendantLeaves = [];
        for (const childId of children) {
            descendantLeaves.push(...collectLeafDescendants(childId));
        }
        leafDescendantsMap.set(nodeId, descendantLeaves);
        return descendantLeaves;
    };

    for (const rootId of rootIds) {
        collectLeafDescendants(rootId);
    }

    for (const rootId of rootIds) {
        leafIds.push(...(leafDescendantsMap.get(rootId) || []));
    }

    const selectedLeafIds = (value = []) => {
        const selected = new Set();
        for (const rawId of value) {
            const id = `${rawId}`;
            const descendants = leafDescendantsMap.get(id);
            if (!descendants) continue;
            for (const leafId of descendants) {
                selected.add(leafId);
            }
        }
        return [...selected];
    };

    const selectedBranchSummary = (selectedIds) => {
        const selectedSet = new Set(selectedIds);
        let bestMatch = null;
        let bestMatchDepth = -1;

        for (const [nodeId, node] of nodeMap.entries()) {
            if (!node.hasChildren) continue;

            const descendantLeaves = leafDescendantsMap.get(nodeId) || [];
            if (descendantLeaves.length !== selectedIds.length) continue;
            if (!descendantLeaves.every((leafId) => selectedSet.has(leafId))) continue;

            let depth = 0;
            let parentId = parentMap.get(nodeId);
            while (parentId) {
                depth += 1;
                parentId = parentMap.get(parentId);
            }
            if (depth <= bestMatchDepth) continue;
            bestMatch = node;
            bestMatchDepth = depth;
        }

        if (!bestMatch) return null;
        return `${bestMatch.label}(${selectedIds.length} selected)`;
    };

    const summaryForSelectedLeafIds = (selectedIds = [], placeholder = 'Select') => {
        const selectedCount = selectedIds.length;
        if (selectedCount === 0) return placeholder;
        if (selectedCount === leafIds.length && leafIds.length > 0) return 'All selected';
        if (selectedCount === 1) return nodeMap.get(selectedIds[0])?.label || selectedIds[0];

        const branchSummary = selectedBranchSummary(selectedIds);
        if (branchSummary) return branchSummary;
        return `${selectedCount} selected`;
    };

    const summaryText = (value = [], placeholder = 'Select') => {
        const selectedIds = selectedLeafIds(value);
        return summaryForSelectedLeafIds(selectedIds, placeholder);
    };

    return {
        leafIds,
        selectedLeafIds,
        summaryText,
        summaryForSelectedLeafIds,
    };
};

/**
 * Generic tree-picker field.
 *
 * Expected tree model:
 * [{ name: string, label: string, children?: TreeNode[] }]
 */
export class TreePickerField extends LitElement {
    static properties = {
        label: { type: String },
        placeholder: { type: String },
        tree: { type: Array, attribute: false },
        value: { type: Array, attribute: false },
        open: { type: Boolean, state: true },
        searchQuery: { type: String, state: true },
        draftValue: { type: Array, state: true },
        expandedPaths: { type: Object, state: true },
        disabled: { type: Boolean, reflect: true },
        readonly: { type: Boolean, reflect: true },
    };

    static styles = css`
        :host {
            display: block;
        }

        .field-label {
            color: var(--spectrum-gray-800);
            display: block;
            font-size: var(--spectrum-font-size-100);
            line-height: 1.3;
            margin-bottom: 6px;
        }

        .trigger {
            align-items: center;
            background: var(--palette-gray-25, #ffffff);
            border: 2px solid var(--spectrum-gray-300);
            border-radius: 8px;
            box-sizing: border-box;
            color: var(--spectrum-gray-900);
            cursor: pointer;
            display: flex;
            gap: 8px;
            height: 32px;
            justify-content: space-between;
            overflow: hidden;
            padding: 0 10px 0 12px;
            width: 100%;
        }

        .trigger:disabled {
            background: var(--spectrum-gray-100);
            border-color: var(--spectrum-gray-200);
            color: var(--spectrum-gray-500);
            cursor: not-allowed;
        }

        .trigger-text {
            flex: 1;
            font-size: var(--spectrum-font-size-100);
            line-height: 1.3;
            min-width: 0;
            overflow: hidden;
            text-align: left;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .trigger-text.is-placeholder {
            color: var(--spectrum-gray-700);
        }

        .trigger-icon {
            flex-shrink: 0;
        }

        sp-popover.picker-popover {
            border-radius: 10px;
            max-height: min(80vh, 700px);
            max-width: min(420px, 90vw);
            min-width: 248px;
            overflow: hidden;
        }

        .popover-content {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            max-height: min(80vh, 700px);
            overflow: hidden;
            padding: 20px;
        }

        .popover-content sp-search {
            width: 100%;
        }

        .tree-list {
            display: flex;
            flex-direction: column;
            gap: 2px;
            margin-top: 12px;
            min-height: 0;
            overflow-y: auto;
            width: 100%;
        }

        .tree-row {
            align-items: center;
            display: flex;
            min-height: 32px;
            padding-inline-start: calc(var(--tree-depth, 0) * 22px);
        }

        .tree-toggle {
            align-items: center;
            appearance: none;
            background: none;
            border: none;
            color: var(--spectrum-gray-900);
            cursor: pointer;
            display: inline-flex;
            height: 18px;
            justify-content: center;
            margin: 0;
            padding: 0;
            width: 18px;
        }

        .tree-toggle.is-spacer {
            cursor: default;
            visibility: hidden;
        }

        .tree-checkbox {
            flex: 1;
            min-height: 32px;
        }

        .tree-checkbox-count {
            color: var(--spectrum-gray-700);
            margin-inline-start: 4px;
        }

        .empty-state {
            color: var(--spectrum-gray-700);
            display: block;
            font-style: italic;
            padding: 8px;
        }
    `;

    #nodeMap;
    #childrenMap;
    #parentMap;
    #leafDescendantsMap;
    #rootIds;
    #leafIds;
    #summaryHelper;
    #draftValueSet = new Set();

    constructor() {
        super();
        this.label = '';
        this.placeholder = 'Select';
        this.tree = [];
        this.value = [];
        this.open = false;
        this.searchQuery = '';
        this.draftValue = [];
        this.expandedPaths = new Set();
        this.disabled = false;
        this.readonly = false;

        this.#nodeMap = new Map();
        this.#childrenMap = new Map();
        this.#parentMap = new Map();
        this.#leafDescendantsMap = new Map();
        this.#rootIds = [];
        this.#leafIds = [];
        this.#summaryHelper = createTreeSelectionSummary([]);
    }

    connectedCallback() {
        super.connectedCallback();
        this.#rebuildTreeIndex();
        this.#syncDraftFromValue();
    }

    willUpdate(changedProperties) {
        if (changedProperties.has('draftValue')) {
            this.#draftValueSet = new Set(this.draftValue || []);
        }
    }

    updated(changedProperties) {
        if (changedProperties.has('tree')) {
            this.#rebuildTreeIndex();
            this.#syncDraftFromValue();
        }

        if (changedProperties.has('value') && !this.open) {
            this.#syncDraftFromValue();
        }
    }

    #rebuildTreeIndex() {
        this.#nodeMap = new Map();
        this.#childrenMap = new Map();
        this.#parentMap = new Map();
        this.#leafDescendantsMap = new Map();
        this.#rootIds = [];
        this.#leafIds = [];

        const walk = (node, parentId = null) => {
            if (!node || typeof node !== 'object') return;

            const nodeId = String(node.name ?? '');
            if (!nodeId) return;
            if (this.#nodeMap.has(nodeId)) return;

            const label = String(node.label ?? nodeId);
            const children = Array.isArray(node.children) ? node.children : [];
            const childIds = [];

            this.#nodeMap.set(nodeId, {
                id: nodeId,
                label,
                hasChildren: children.length > 0,
            });
            this.#childrenMap.set(nodeId, childIds);
            this.#parentMap.set(nodeId, parentId);

            children.forEach((child) => {
                const childId = String(child.name ?? '');
                if (!childId) return;
                childIds.push(childId);
                walk(child, nodeId);
            });
        };

        (Array.isArray(this.tree) ? this.tree : []).forEach((rootNode) => {
            const rootId = String(rootNode.name ?? '');
            if (!rootId) return;
            this.#rootIds.push(rootId);
            walk(rootNode);
        });

        const collectLeafDescendants = (nodeId) => {
            if (!this.#nodeMap.has(nodeId)) return [];
            const children = this.#childrenMap.get(nodeId) || [];

            if (children.length === 0) {
                this.#leafDescendantsMap.set(nodeId, [nodeId]);
                return [nodeId];
            }

            const descendantLeaves = [];
            children.forEach((childId) => {
                descendantLeaves.push(...collectLeafDescendants(childId));
            });

            this.#leafDescendantsMap.set(nodeId, descendantLeaves);
            return descendantLeaves;
        };

        this.#rootIds.forEach((rootId) => {
            collectLeafDescendants(rootId);
        });

        this.#leafIds = this.#rootIds.flatMap((rootId) => this.#leafDescendantsMap.get(rootId) || []);
        this.#summaryHelper = createTreeSelectionSummary(this.tree);
    }

    #sameSelection(a = [], b = []) {
        if (a.length !== b.length) return false;
        const bSet = new Set(b);
        return a.every((value) => bSet.has(value));
    }

    #selectedLeafIds(value = this.value) {
        const selected = new Set();
        const valueArray = Array.isArray(value) ? value : [];

        valueArray.forEach((nodeId) => {
            const id = String(nodeId);
            const leafDescendants = this.#leafDescendantsMap.get(id);
            if (leafDescendants) {
                leafDescendants.forEach((leafId) => selected.add(leafId));
            }
        });

        return [...selected];
    }

    #syncDraftFromValue() {
        const nextDraft = this.#selectedLeafIds(this.value);
        if (!this.#sameSelection(this.draftValue, nextDraft)) {
            this.draftValue = nextDraft;
        }
        this.#syncExpandedPathsFromSelection(nextDraft);
    }

    #syncExpandedPathsFromSelection(selectedLeafIds = this.draftValue) {
        const currentExpanded = this.expandedPaths || new Set();
        const nextExpanded = new Set(currentExpanded);

        selectedLeafIds.forEach((leafId) => {
            let parentId = this.#parentMap.get(leafId);
            while (parentId) {
                nextExpanded.add(parentId);
                parentId = this.#parentMap.get(parentId);
            }
        });

        if (nextExpanded.size === currentExpanded.size && [...nextExpanded].every((path) => currentExpanded.has(path))) {
            return;
        }

        this.expandedPaths = nextExpanded;
    }

    #getNodeSelectionState(nodeId) {
        const leafDescendants = this.#leafDescendantsMap.get(nodeId) || [];

        if (leafDescendants.length === 0) {
            return 'none';
        }

        const selectedCount = leafDescendants.reduce((count, leafId) => count + (this.#draftValueSet.has(leafId) ? 1 : 0), 0);

        if (selectedCount === 0) return 'none';
        if (selectedCount === leafDescendants.length) return 'checked';
        return 'partial';
    }

    #toggleExpand(event) {
        event.stopPropagation();
        const target = event.composedPath?.()[0] || event.target;
        const nodeId = target?.dataset?.treeToggle;
        if (!nodeId) return;

        const nextExpanded = new Set(this.expandedPaths || []);
        if (nextExpanded.has(nodeId)) nextExpanded.delete(nodeId);
        else nextExpanded.add(nodeId);
        this.expandedPaths = nextExpanded;
    }

    #toggleCheckbox(event) {
        event.stopPropagation();
        const target = event.composedPath?.()[0] || event.target;
        const nodeId = target?.value || target?.getAttribute?.('value');
        if (!nodeId) return;

        const leafDescendants = this.#leafDescendantsMap.get(nodeId) || [];
        if (leafDescendants.length === 0) return;

        const nextDraft = new Set(this.draftValue || []);
        if (target.checked) leafDescendants.forEach((leafId) => nextDraft.add(leafId));
        else leafDescendants.forEach((leafId) => nextDraft.delete(leafId));

        this.draftValue = [...nextDraft];
        this.#syncExpandedPathsFromSelection(this.draftValue);
    }

    #handleSearchInput(event) {
        const target = event.composedPath?.()[0] || event.target;
        this.searchQuery = target?.value || '';
    }

    #getRows() {
        if (!this.#rootIds.length) return [];

        const rows = [];
        const query = this.searchQuery.trim().toLowerCase();

        if (!query) {
            const visit = (nodeId, depth = 0) => {
                const node = this.#nodeMap.get(nodeId);
                if (!node) return;

                const children = this.#childrenMap.get(nodeId) || [];
                rows.push({ nodeId, depth, node, hasChildren: children.length > 0 });

                if (children.length && (this.expandedPaths || new Set()).has(nodeId)) {
                    children.forEach((childId) => visit(childId, depth + 1));
                }
            };

            this.#rootIds.forEach((rootId) => visit(rootId, 0));
            return rows;
        }

        const visitWithSearch = (nodeId, depth = 0, targetRows = rows) => {
            const startIndex = targetRows.length;
            const node = this.#nodeMap.get(nodeId);
            if (!node) return false;

            const children = this.#childrenMap.get(nodeId) || [];
            let matched = node.label.toLowerCase().includes(query);
            targetRows.push({ nodeId, depth, node, hasChildren: children.length > 0 });

            for (const childId of children) {
                if (visitWithSearch(childId, depth + 1, targetRows)) {
                    matched = true;
                }
            }

            // Roll back rows from this subtree when there is no match.
            if (!matched) {
                targetRows.length = startIndex;
                return false;
            }

            return true;
        };

        for (const rootId of this.#rootIds) {
            visitWithSearch(rootId, 0, rows);
        }

        return rows;
    }

    #commitSelection() {
        const currentSelection = this.#selectedLeafIds(this.value);
        const nextSelection = [...new Set(this.draftValue || [])];
        if (this.#sameSelection(currentSelection, nextSelection)) return;

        this.value = nextSelection;
        this.dispatchEvent(
            new CustomEvent(EVENT_CHANGE, {
                bubbles: true,
                composed: true,
                detail: this,
            }),
        );
    }

    #handlePopoverOpened() {
        this.open = true;
        this.searchQuery = '';
        this.#syncDraftFromValue();
    }

    #handlePopoverClosed() {
        this.open = false;
        this.searchQuery = '';
        this.#commitSelection();
    }

    get #summary() {
        const selectedIds = this.open ? this.draftValue : this.#selectedLeafIds(this.value);
        const text = this.#summaryHelper.summaryForSelectedLeafIds(selectedIds, this.placeholder || 'Select');

        return {
            text,
            placeholder: selectedIds.length === 0,
        };
    }

    get #triggerDisabled() {
        return this.disabled || this.readonly || this.#leafIds.length === 0;
    }

    get #rows() {
        return this.#getRows();
    }

    #renderTreeRow({ nodeId, depth, node, hasChildren }) {
        const expanded = (this.expandedPaths || new Set()).has(nodeId);
        const state = this.#getNodeSelectionState(nodeId);
        const descendantLeaves = this.#leafDescendantsMap.get(nodeId) || [];
        const count = hasChildren ? descendantLeaves.length : 0;

        return html`
            <div class="tree-row" style="--tree-depth:${depth}" data-tree-path="${nodeId}">
                <button
                    class="tree-toggle ${hasChildren ? '' : 'is-spacer'}"
                    ?disabled=${!hasChildren}
                    data-tree-toggle="${nodeId}"
                    @click=${this.#toggleExpand}
                >
                    ${!hasChildren
                        ? nothing
                        : expanded
                          ? html`<sp-icon-chevron-down size="s"></sp-icon-chevron-down>`
                          : html`<sp-icon-chevron-right size="s"></sp-icon-chevron-right>`}
                </button>
                <sp-checkbox
                    class="tree-checkbox"
                    data-tree-checkbox="${nodeId}"
                    value="${nodeId}"
                    ?checked=${state === 'checked'}
                    .indeterminate=${state === 'partial'}
                    @change=${this.#toggleCheckbox}
                >
                    ${node.label} ${count > 0 ? html`<span class="tree-checkbox-count">(${count})</span>` : nothing}
                </sp-checkbox>
            </div>
        `;
    }

    get #popoverContent() {
        if (!this.open) return nothing;

        return html`
            <div class="popover-content">
                <sp-search
                    name="tree-picker-search"
                    @input=${this.#handleSearchInput}
                    placeholder="Search"
                    value="${this.searchQuery}"
                ></sp-search>
                <div class="tree-list">
                    ${this.#rows.length === 0
                        ? html`<span class="empty-state">No matches</span>`
                        : repeat(
                              this.#rows,
                              ({ nodeId }) => nodeId,
                              (row) => this.#renderTreeRow(row),
                          )}
                </div>
            </div>
        `;
    }

    get #triggerTemplate() {
        const summary = this.#summary;
        return html`
            <button
                slot="trigger"
                class="trigger"
                type="button"
                aria-label=${this.label || this.placeholder || 'Select'}
                ?disabled=${this.#triggerDisabled}
            >
                <span class="trigger-text ${summary.placeholder ? 'is-placeholder' : ''}">${summary.text}</span>
                <sp-icon-chevron-down size="s" class="trigger-icon"></sp-icon-chevron-down>
            </button>
        `;
    }

    render() {
        const summary = this.#summary;

        return html`
            ${this.label ? html`<span class="field-label">${this.label}</span>` : nothing}
            ${this.readonly
                ? html`
                      <div class="trigger" aria-label=${this.label || this.placeholder || 'Select'}>
                          <span class="trigger-text ${summary.placeholder ? 'is-placeholder' : ''}">${summary.text}</span>
                          <sp-icon-chevron-down size="s" class="trigger-icon"></sp-icon-chevron-down>
                      </div>
                  `
                : html`
                      <overlay-trigger
                          placement="bottom-start"
                          @sp-opened=${this.#handlePopoverOpened}
                          @sp-closed=${this.#handlePopoverClosed}
                      >
                          ${this.#triggerTemplate}
                          <sp-popover slot="click-content" class="picker-popover">${this.#popoverContent}</sp-popover>
                      </overlay-trigger>
                  `}
        `;
    }
}

customElements.define('tree-picker-field', TreePickerField);
