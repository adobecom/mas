const { getTargetPath } = require('../common.js');

function resolvePaths(paths, locales) {
    if (!Array.isArray(paths) || paths.length === 0) {
        return [];
    }
    const hasLocales = Array.isArray(locales) && locales.length > 0;
    const resolved = new Set();
    for (const path of paths) {
        if (typeof path !== 'string' || !path) continue;
        resolved.add(path);
        if (!hasLocales) continue;
        for (const locale of locales) {
            const localePath = getTargetPath(path, locale);
            if (localePath) resolved.add(localePath);
        }
    }
    return Array.from(resolved);
}

module.exports = { resolvePaths };
