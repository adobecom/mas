import { diffCustomFields } from './custom-field-sync.js';

/**
 * Audits default/promo fragment pairs for custom-field drift, keeping each entry list
 * so a correction plan can be built without re-reading the fragments.
 * @param {Array<{ defaultPath: string, promoPath: string, defaultEntries?: Array<{ name?: string }>, promoEntries?: Array<{ name?: string }> }>} [pairs]
 * @returns {{ findings: Array<{ defaultPath: string, promoPath: string, missing: string[], renames: Array<{ from: string, to: string, index: number }>, defaultEntries: Array<{ name?: string }>, promoEntries: Array<{ name?: string }> }>, correctionCount: number }}
 */
export function auditCustomFieldPairs(pairs = []) {
    const findings = [];
    for (const { defaultPath, promoPath, defaultEntries = [], promoEntries = [] } of pairs) {
        const { missing, renames } = diffCustomFields({ defaultEntries, promoEntries });
        if (!missing.length && !renames.length) continue;
        findings.push({ defaultPath, promoPath, missing, renames, defaultEntries, promoEntries });
    }
    return { findings, correctionCount: findings.length };
}

/**
 * Turns audit findings into the exact custom-field entry list to write per promo path:
 * renamed promo entries are rewritten to the default's name with their value preserved,
 * and missing fields are appended using the default entry's value. Applied unconditionally
 * by the caller — there is no confirm/dry-run step.
 * @param {ReturnType<typeof auditCustomFieldPairs>['findings']} findings
 * @returns {Array<{ promoPath: string, entries: Array<{ name: string }> }>}
 */
export function planCustomFieldCorrections(findings = []) {
    return findings.map(({ promoPath, missing, renames, defaultEntries, promoEntries }) => {
        const renameMap = new Map(renames.map(({ from, to }) => [from, to]));
        const entries = promoEntries.map((entry) => {
            const newName = renameMap.get(entry.name);
            return newName ? { ...entry, name: newName } : entry;
        });
        for (const name of missing) {
            const sourceEntry = defaultEntries.find((entry) => entry.name === name);
            entries.push({ ...sourceEntry });
        }
        return { promoPath, entries };
    });
}
