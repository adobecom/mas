const { getTargetPath } = require('../common.js');
const { extractLocale } = require('./publish-core.js');

function selectRolloutItems({ details, sourcePaths, locales }) {
    if (!Array.isArray(locales) || locales.length === 0) return [];
    const selected = new Set(locales);

    const targetToSource = new Map();
    for (const source of sourcePaths) {
        for (const locale of locales) {
            const target = getTargetPath(source, locale);
            if (target) targetToSource.set(target, { source, locale });
        }
    }

    const bySource = new Map();
    for (const detail of details) {
        if (detail.status !== 'failed' || detail.reason !== 'not-found') continue;
        const locale = extractLocale(detail.path);
        if (!selected.has(locale)) continue;
        const origin = targetToSource.get(detail.path);
        if (!origin) continue;
        const list = bySource.get(origin.source) || [];
        list.push(origin.locale);
        bySource.set(origin.source, list);
    }

    return Array.from(bySource.entries()).map(([contentPath, targetLocales]) => ({ contentPath, targetLocales }));
}

module.exports = { selectRolloutItems };
