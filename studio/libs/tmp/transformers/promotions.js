async function getActivePromotion(context) {
    //for now we have no active promotion system, so we return empty variations
    return {
        status: 200,
        variations: [],
    };
}

async function init(context) {
    return await getActivePromotion(context);
}

async function promotions(context) {
    return {
        ...context,
        status: 200,
    };
}

export const transformer = {
    name: 'promotions',
    process: promotions,
    init,
};
