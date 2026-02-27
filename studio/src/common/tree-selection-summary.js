/**
 * Builds selection helpers for tree data and provides consistent summary text formatting.
 *
 * @param {Array<{name?: string, id?: string, label?: string, children?: Array}>} tree
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
        const nodeId = `${node.name ?? node.id ?? ''}`;
        if (!nodeId || nodeMap.has(nodeId)) return;

        const children = node.children || [];
        const childIds = [];
        nodeMap.set(nodeId, {
            id: nodeId,
            label: `${node.label ?? nodeId}`,
            hasChildren: children.length > 0,
        });
        childrenMap.set(nodeId, childIds);
        parentMap.set(nodeId, parentId);

        for (const child of children) {
            const childId = `${child.name ?? child.id ?? ''}`;
            if (!childId) continue;
            childIds.push(childId);
            walk(child, nodeId);
        }
    };

    for (const rootNode of tree) {
        const rootId = `${rootNode.name ?? rootNode.id ?? ''}`;
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
