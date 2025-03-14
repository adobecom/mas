const { fetch } = require('./common.js');
const { odinReferences } = require('./paths.js');

function isCollection(body) {
    const { path, fields } = body;
    return path.indexOf('/collections/') > 0 && fields?.categories;
}

function parseReferences(ids, references) {
    const cards = {};
    const categories = [];

    ids.forEach((id) => {
        const reference = references[id];
        const { fields } = reference?.value;
        if (fields?.variant) {
            //reference is a card
            cards[id] = reference.value;
        } else if (fields?.cards || fields?.categories) {
            //reference is a category
            const { label, cards, categories: categoryReferences } = fields;
            if (cards?.length) {
                //we consider categories with cards to be final
                //(no subcategories)
                categories.push({ label, cards });
            } else {
                const subReferences = parseReferences(
                    categoryReferences,
                    references,
                );
                categories.push({
                    label,
                    categories: subReferences.categories,
                });
            }
        }
    });

    return { cards, categories };
}

/**
 * attach categories to current collection fragment
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
            const { cards, categories } = parseReferences(
                Object.keys(references),
                references,
            );
            body.fields = { ...body.fields, cards, categories };
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
