const promotion = require('./promotion.js');

function resolveScope(scopeType) {
    if (scopeType !== 'promotion') {
        throw Object.assign(new Error('Unsupported history scope'), { statusCode: 400 });
    }
    return promotion;
}

module.exports = { resolveScope };
