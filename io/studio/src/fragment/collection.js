const { fetch } = require('./common.js');
const { odinReferences } = require('./paths.js');
const { extractSurfaceFromPath } = require('../dictionary/dictionary.js');

const CARD_MODEL_PATH = '/conf/mas/settings/dam/cfm/models/card';
const COLLECTION_MODEL_PATH = '/conf/mas/settings/dam/cfm/models/collection';

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
        if (fields?.model?.path === CARD_MODEL_PATH) {
            //reference is a card
            cards[id] = reference.value;
        } else if (fields?.model?.path === COLLECTION_MODEL_PATH) {
            //reference is a collection
            const {
                icon,
                label,
                cards,
                collections: collectionReferences,
            } = fields;
            if (cards?.length) {
                //we consider collections with cards to be final
                //(no subcollections)
                collections.push({ label, icon, cards });
            } else {
                const subReferences = parseReferences(
                    collectionReferences,
                    references,
                );
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
