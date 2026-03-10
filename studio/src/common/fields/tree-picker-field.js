import { css, html, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { EVENT_CHANGE } from '../../constants.js';

const buildTreeIndex = (tree = []) => {
    const nodeMap = new Map();
    const childrenMap = new Map();
    const parentMap = new Map();
    const leafDescendantsMap = new Map();
    const rootIds = [];
    const leafIds = [];

    const walk = (node, parentId = null) => {
        const nodeId = `${node.name}`;
        if (!nodeId || nodeMap.has(nodeId)) return;

        const children = node.children ?? [];
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

    return {
        nodeMap,
        childrenMap,
        parentMap,
        leafDescendantsMap,
        rootIds,
        leafIds,
    };
};

const selectedLeafIdsFromValue = (value = [], leafDescendantsMap) => {
    const selected = new Set();
    for (const rawId of value) {
        const descendants = leafDescendantsMap.get(`${rawId}`);
        if (!descendants) continue;
        for (const leafId of descendants) {
            selected.add(leafId);
        }
    }
    return [...selected];
};

const createSelectionSummaryForIndex = ({ nodeMap, parentMap, leafDescendantsMap, leafIds }) => {
    const selectedLeafIds = (value = []) => selectedLeafIdsFromValue(value, leafDescendantsMap);

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

    /**
     * Template summary rules:
     * 1. No valid selections -> `All templates selected`
     * 2. All leaves selected -> `All templates selected`
     * 3. Single branch selected -> `<Branch label> (<count> selected)`
     * 4. Cross-branch selection -> `<count> templates selected`
     */
    const templateSummaryForSelectedLeafIds = (selectedIds = []) => {
        const selectedCount = selectedIds.length;
        if (selectedCount === 0 || (leafIds.length > 0 && selectedCount === leafIds.length)) {
            return 'All templates selected';
        }

        const selectedBranches = new Set();
        for (const selectedId of selectedIds) {
            const branchId = parentMap.get(selectedId);
            const branchLabel = nodeMap.get(branchId)?.label || nodeMap.get(selectedId)?.label || `${selectedId}`;
            selectedBranches.add(branchLabel);
        }

        if (selectedBranches.size === 1) {
            return `${[...selectedBranches][0]} (${selectedCount} selected)`;
        }

        return `${selectedCount} templates selected`;
    };

    const templateSummaryText = (value = []) => {
        const selectedIds = selectedLeafIds(value);
        return templateSummaryForSelectedLeafIds(selectedIds);
    };

    return {
        leafIds,
        selectedLeafIds,
        summaryText,
        summaryForSelectedLeafIds,
        templateSummaryForSelectedLeafIds,
        templateSummaryText,
    };
};

/**
 * Builds selection helpers for tree data and provides consistent summary text formatting.
 *
 * @param {Array<{name: string, label: string, children?: Array}>} tree
 * @returns {{
 *   leafIds: string[],
 *   selectedLeafIds: (value?: Array<string>) => string[],
 *   summaryText: (value?: Array<string>, placeholder?: string) => string,
 *   summaryForSelectedLeafIds: (selectedIds?: Array<string>, placeholder?: string) => string,
 *   templateSummaryForSelectedLeafIds: (selectedIds?: Array<string>) => string,
 *   templateSummaryText: (value?: Array<string>) => string
 * }}
 */
export const createTreeSelectionSummary = (tree = []) => createSelectionSummaryForIndex(buildTreeIndex(tree));

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
        emptyValueIsSelection: { type: Boolean, attribute: 'empty-value-is-selection' },
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
            color: var(--spectrum-gray-600);
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
        this.placeholder = 'All templates';
        this.tree = [];
        this.value = [];
        this.open = false;
        this.searchQuery = '';
        this.draftValue = [];
        this.expandedPaths = new Set();
        this.emptyValueIsSelection = false;
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
            this.#draftValueSet = new Set(this.draftValue);
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
        const treeIndex = buildTreeIndex(this.tree);
        this.#nodeMap = treeIndex.nodeMap;
        this.#childrenMap = treeIndex.childrenMap;
        this.#parentMap = treeIndex.parentMap;
        this.#leafDescendantsMap = treeIndex.leafDescendantsMap;
        this.#rootIds = treeIndex.rootIds;
        this.#leafIds = treeIndex.leafIds;
        this.#summaryHelper = createSelectionSummaryForIndex(treeIndex);
    }

    #sameSelection(a = [], b = []) {
        if (a.length !== b.length) return false;
        const bSet = new Set(b);
        return a.every((value) => bSet.has(value));
    }

    #sameSet(a, b) {
        if (a.size !== b.size) return false;
        for (const value of a) {
            if (!b.has(value)) return false;
        }
        return true;
    }

    #selectedLeafIds(value = this.value) {
        return selectedLeafIdsFromValue(value, this.#leafDescendantsMap);
    }

    #syncDraftFromValue() {
        const nextDraft = this.#selectedLeafIds(this.value);
        if (!this.#sameSelection(this.draftValue, nextDraft)) {
            this.draftValue = nextDraft;
        }
        this.#syncExpandedPathsFromSelection(nextDraft);
    }

    #syncExpandedPathsFromSelection(selectedLeafIds = this.draftValue) {
        const currentExpanded = this.expandedPaths;
        const nextExpanded = new Set(currentExpanded);

        for (const leafId of selectedLeafIds) {
            let parentId = this.#parentMap.get(leafId);
            while (parentId) {
                nextExpanded.add(parentId);
                parentId = this.#parentMap.get(parentId);
            }
        }

        if (this.#sameSet(nextExpanded, currentExpanded)) return;

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
        const target = event.currentTarget;
        const nodeId = target.dataset.treeToggle;
        if (!nodeId) return;

        const nextExpanded = new Set(this.expandedPaths);
        if (nextExpanded.has(nodeId)) nextExpanded.delete(nodeId);
        else nextExpanded.add(nodeId);
        this.expandedPaths = nextExpanded;
    }

    #toggleCheckbox(event) {
        event.stopPropagation();
        const target = event.currentTarget;
        const nodeId = target.value || target.getAttribute('value');
        if (!nodeId) return;

        const leafDescendants = this.#leafDescendantsMap.get(nodeId) || [];
        if (leafDescendants.length === 0) return;

        const nextDraft = new Set(this.draftValue);
        if (target.checked) {
            for (const leafId of leafDescendants) nextDraft.add(leafId);
        } else {
            for (const leafId of leafDescendants) nextDraft.delete(leafId);
        }

        this.draftValue = [...nextDraft];
        this.#syncExpandedPathsFromSelection(nextDraft);
    }

    #handleSearchInput(event) {
        this.searchQuery = event.currentTarget.value;
    }

    #collectExpandedRows() {
        const rows = [];
        const expandedPaths = this.expandedPaths;

        const visit = (nodeId, depth = 0) => {
            const node = this.#nodeMap.get(nodeId);
            const children = this.#childrenMap.get(nodeId) || [];
            rows.push({ nodeId, depth, node, hasChildren: children.length > 0 });
            if (children.length === 0 || !expandedPaths.has(nodeId)) return;
            for (const childId of children) {
                visit(childId, depth + 1);
            }
        };

        for (const rootId of this.#rootIds) {
            visit(rootId, 0);
        }
        return rows;
    }

    #collectSearchRows(query) {
        const rows = [];

        const visit = (nodeId, depth = 0) => {
            const startIndex = rows.length;
            const node = this.#nodeMap.get(nodeId);
            const children = this.#childrenMap.get(nodeId) || [];
            let matched = node.label.toLowerCase().includes(query);
            rows.push({ nodeId, depth, node, hasChildren: children.length > 0 });

            for (const childId of children) {
                if (visit(childId, depth + 1)) matched = true;
            }

            if (matched) return true;
            rows.length = startIndex;
            return false;
        };

        for (const rootId of this.#rootIds) {
            visit(rootId, 0);
        }
        return rows;
    }

    #getRows() {
        if (this.#rootIds.length === 0) return [];
        const query = this.searchQuery.trim().toLowerCase();
        if (!query) return this.#collectExpandedRows();
        return this.#collectSearchRows(query);
    }

    #commitSelection() {
        const currentSelection = this.#selectedLeafIds(this.value);
        const nextSelection = [...new Set(this.draftValue)];
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
        const text = selectedIds.length
            ? this.#summaryHelper.templateSummaryForSelectedLeafIds(selectedIds)
            : this.placeholder || 'All templates';

        return {
            text,
            placeholder: selectedIds.length === 0 && !this.emptyValueIsSelection,
        };
    }

    get #triggerDisabled() {
        return this.disabled || this.readonly || this.#leafIds.length === 0;
    }

    #renderTreeRow({ nodeId, depth, node, hasChildren }) {
        const expanded = this.expandedPaths.has(nodeId);
        const state = this.#getNodeSelectionState(nodeId);
        const descendantLeaves = this.#leafDescendantsMap.get(nodeId) || [];
        const count = hasChildren ? descendantLeaves.length : 0;

        return html`
            <div class="tree-row" style=${styleMap({ '--tree-depth': depth })} data-tree-path="${nodeId}">
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
        const rows = this.#getRows();

        return html`
            <div class="popover-content">
                <sp-search
                    name="tree-picker-search"
                    @input=${this.#handleSearchInput}
                    placeholder="Search"
                    value="${this.searchQuery}"
                ></sp-search>
                <div class="tree-list">
                    ${rows.length === 0
                        ? html`<span class="empty-state">No matches</span>`
                        : repeat(
                              rows,
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
