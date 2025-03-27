const { fetch } = require('./common.js');
const { odinReferences } = require('./paths.js');

function isCollection(body) {
    const { path, fields } = body;
    return path.indexOf('/collections/') > 0 && fields?.collections;
}

function parseReferences(ids, references) {
    const cards = {};
    const collections = [];

    ids.forEach((id) => {
        const reference = references[id];
        const { fields } = reference?.value;
        if (fields?.variant) {
            //reference is a card
            cards[id] = reference.value;
        } else if (fields?.cards || fields?.collections) {
            //reference is a collection
            const { label, cards, collections: collectionReferences } = fields;
            /* istanbul ignore next */
            if (cards?.length) {
                //we consider collections with cards to be final
                //(no subcollections)
                collections.push({ label, cards });
            } else {
                /* istanbul ignore next */
                const subReferences = parseReferences(
                    collectionReferences,
                    references,
                );
                /* istanbul ignore next */
                collections.push({
                    label,
                    collections: subReferences.collections,
                });
            }
        }
    });

    return { cards, collections };
}

/**
 * attach collections to current collection fragment
 */
async function collection(context) {
    const { body } = context;
    const { id } = body;
    /* istanbul ignore next */
    if (isCollection(body)) {
        const referencesPath = odinReferences(id, true);
        const response = await fetch(referencesPath, context);
        if (response.status === 200) {
            const root = await response.json();
            const { references } = root;
            const { cards, collections } = parseReferences(
                Object.keys(references),
                references,
            );
            body.fields = { ...body.fields, cards, collections };
            return {
                ...context,
                status: 200,
                body,
            };
        }
        return {
            status: 500,
            message: 'unable to fetch references',
        };
    }
    return context;
}

exports.collection = collection;
exports.parseReferences = parseReferences;
