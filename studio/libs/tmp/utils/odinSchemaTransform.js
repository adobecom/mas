//utitilies to transform payload from old schema to new schema

const CF_REFERENCE_FIELDS = ['cards', 'collections', 'entries'];
const REFERENCE_FIELDS = [...CF_REFERENCE_FIELDS, 'tags'];

function transformFields(body) {
    const { fields, references } = body;
    const pathToIdMap = {};
    if (references) {
        references.forEach((reference) => {
            const { type, path, id } = reference;
            if (type === 'content-fragment') {
                pathToIdMap[path] = id;
            }
        });
    }
    const transformedFields = fields.reduce((fields, { name, multiple, values, mimeType }) => {
        if (CF_REFERENCE_FIELDS.includes(name)) {
            fields[name] = values.map((value) => {
                if (typeof value === 'string') {
                    return pathToIdMap[value] || value;
                }
                return value;
            });
        } else if (mimeType === 'text/html') {
            fields[name] = {
                mimeType,
                value: values[0],
            };
        } else {
            fields[name] = multiple ? values : values[0];
        }
        return fields;
    }, {});
    return transformedFields;
}

function buildReferenceTree(fields, references) {
    const referencesTree = [];
    for (const [fieldName, fieldValue] of Object.entries(fields)) {
        // Handle array of references (like cards or collections)
        if (REFERENCE_FIELDS.includes(fieldName) && Array.isArray(fieldValue)) {
            fieldValue.forEach((id) => {
                if (references[id]) {
                    const ref = {
                        fieldName,
                        identifier: id,
                        referencesTree: [],
                    };
                    const nestedRef = references[id];
                    if (nestedRef.type === 'content-fragment') {
                        ref.referencesTree = buildReferenceTree(nestedRef.value.fields, references);
                    }
                    referencesTree.push(ref);
                }
            });
        }
    }
    return referencesTree;
}

function transformReferences(body) {
    if (!body.references) return body;

    // Process references recursively
    const processReference = (references, ref) => {
        const fields = transformFields(ref);

        // If this reference has its own references, process them recursively
        if (ref.references && ref.references.length > 0) {
            ref.references.forEach((nestedRef) => {
                // Add nested reference to main references array if not already present
                if (!Object.keys(references).find((id) => id === nestedRef.id)) {
                    // Process the nested reference recursively
                    processReference(references, nestedRef);
                }
            });
        }

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
        body.references = body.references.reduce((refs, ref) => {
            processReference(refs, ref);
            return refs;
        }, {});
        body.referencesTree = buildReferenceTree(body.fields, body.references);
    }
    return body;
}

function transformBody(body) {
    body.fields = transformFields(body);
    body = transformReferences(body);
    return body;
}

export { transformBody };
