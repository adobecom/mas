//utitilies to transform payload from old schema to new schema

const CF_REFERENCE_FIELDS = ['cards', 'collections', 'entries', 'variations'];
const REFERENCE_FIELDS = [...CF_REFERENCE_FIELDS, 'tags'];

function collectPathToIdMap(references, map = {}) {
    if (!references) return map;
    for (const ref of references) {
        if (ref.type === 'content-fragment' && ref.path && ref.id) {
            map[ref.path] = ref.id;
        }
        if (ref.references?.length > 0) {
            collectPathToIdMap(ref.references, map);
        }
    }
    return map;
}

function transformFields(fields, pathToIdMap) {
    return fields.reduce((result, { name, multiple, values, mimeType }) => {
        if (CF_REFERENCE_FIELDS.includes(name)) {
            result[name] = values.map((value) => {
                if (typeof value === 'string') {
                    return pathToIdMap[value] || value;
                }
                return value;
            });
        } else if (mimeType === 'text/html') {
            result[name] = {
                mimeType,
                value: values[0],
            };
        } else {
            result[name] = multiple ? values : values[0];
        }
        return result;
    }, {});
}

function buildReferenceTree(fields, references, visitedIds = new Set()) {
    const referencesTree = [];
    for (const [fieldName, fieldValue] of Object.entries(fields)) {
        // Handle array of references (like cards or collections)
        if (REFERENCE_FIELDS.includes(fieldName) && Array.isArray(fieldValue)) {
            for (const id of fieldValue) {
                if (!references[id]) {
                    continue;
                }
                const ref = {
                    fieldName,
                    identifier: id,
                    referencesTree: [],
                };
                const nestedRef = references[id];
                if (nestedRef.type === 'content-fragment' && !visitedIds.has(id)) {
                    visitedIds.add(id);
                    ref.referencesTree = buildReferenceTree(nestedRef.value.fields, references, visitedIds);
                    visitedIds.delete(id);
                }
                referencesTree.push(ref);
            }
        }
    }
    return referencesTree;
}

function flattenReferences(references, result = []) {
    for (const ref of references) {
        result.push(ref);
        if (ref.references?.length > 0) {
            flattenReferences(ref.references, result);
        }
    }
    return result;
}

function transformReferences(body, pathToIdMap) {
    if (!body.references) return body;

    // Process references recursively (with cycle guard: register ref before recursing)
    const processReference = (references, ref) => {
        // Register this ref first so cycles (e.g. variations pointing back) don't cause infinite recursion
        if (references[ref.id]) {
            return;
        }

        const fields = transformFields(ref.fields, pathToIdMap);
        references[ref.id] = {
            type: ref.type,
            value: {
                name: ref.name,
                title: ref.title,
                description: ref.description,
                path: ref.path,
                id: ref.id,
                model: { id: ref.model?.id },
                fields,
            },
        };

        // If this reference has its own references, process them recursively
        if (ref.references && ref.references.length > 0) {
            ref.references.forEach((nestedRef) => {
                if (!references[nestedRef.id]) {
                    processReference(references, nestedRef);
                }
            });
        }

        // If the current ref (e.g., a card) has associated tag objects, add them.
        if (ref.tags && Array.isArray(ref.tags)) {
            ref.tags.forEach((tag) => {
                if (tag && tag.id && !references[tag.id]) {
                    // Check if tag not already added
                    references[tag.id] = {
                        type: 'tag',
                        value: tag,
                    };
                }
            });
        }
    };
    if (body.references) {
        body.references = flattenReferences(body.references).reduce((refs, ref) => {
            processReference(refs, ref);
            return refs;
        }, {});
        body.referencesTree = buildReferenceTree(body.fields, body.references);
    }
    return body;
}

function transformBody(body) {
    const pathToIdMap = collectPathToIdMap(body.references);
    body.fields = transformFields(body.fields, pathToIdMap);
    body = transformReferences(body, pathToIdMap);
    return body;
}

export { transformBody };
