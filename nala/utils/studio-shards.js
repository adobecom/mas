import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const STUDIO_SHARDS = ['mixed-1', 'mixed-2', 'mixed-3'];
// Whole-suite defaults and workload overrides preserve the measured 4/4/3 allocation.
const SUITE_SHARDS = {
    'acom/plans/individuals': { default: 'mixed-1', css: 'mixed-2' },
    'acom/pro': { default: 'mixed-3' },
    'ahome/promoted-plans': { default: 'mixed-1', save: 'mixed-3' },
    'ahome/try-buy-widget': { default: 'mixed-2' },
    'ccd/suggested': { default: 'mixed-3', css: 'mixed-2' },
    'ccd/slice': { default: 'mixed-3', save: 'mixed-2' },
    'commerce/fries': { default: 'mixed-1', save: 'mixed-3', gradient: 'mixed-2' },
    express: { default: 'mixed-3', css: 'mixed-1' },
    sandbox: { default: 'mixed-3', css: 'mixed-2' },
    ost: { default: 'mixed-2', authoring: 'mixed-1' },
    'bulk-actions': { default: 'mixed-2' },
    'bulk-publish': { default: 'mixed-3' },
    'copy-field': { default: 'mixed-1' },
    placeholders: { default: 'mixed-1' },
    'fragment-editor': { default: 'mixed-2' },
    'merch-card-editor': { default: 'mixed-2' },
    'regional-variations': { default: 'mixed-2' },
    translations: { default: 'mixed-2' },
    versions: { default: 'mixed-2' },
    discount: { default: 'mixed-3' },
    settings: { default: 'mixed-3' },
};
const DOMAIN_SHARDS = {
    acom: { default: 'mixed-2', save: 'mixed-3', edit: 'mixed-1', css: 'mixed-2' },
    ahome: { default: 'mixed-2', save: 'mixed-2', edit: 'mixed-1', css: 'mixed-3' },
    ccd: { default: 'mixed-2', save: 'mixed-1', edit: 'mixed-3', css: 'mixed-2' },
    commerce: { default: 'mixed-2', save: 'mixed-3', edit: 'mixed-1', css: 'mixed-2' },
};
const NEW_SUITE_SHARDS = { default: 'mixed-2', save: 'mixed-2', edit: 'mixed-3', css: 'mixed-1' };

export function studioShardForFile(file) {
    const relative = file.replaceAll('\\', '/').replace(/^nala\/studio\//, '');
    const contains = (word) => new RegExp(`(?:^|[/_.-])(?:${word})(?:[/_.-]|$)`).test(relative);
    const workload = contains('save') ? 'save' : contains('css') ? 'css' : contains('edit') ? 'edit' : 'default';
    const feature = contains('gradient') ? 'gradient' : contains('authoring|bundle') ? 'authoring' : workload;
    const suite = Object.entries(SUITE_SHARDS).find(([prefix]) => relative.startsWith(`${prefix}/`))?.[1];
    if (suite) return suite[feature] ?? suite[workload] ?? suite.default;
    if (!relative.includes('/')) return 'mixed-3';
    const domain = DOMAIN_SHARDS[relative.split('/')[0]] ?? NEW_SUITE_SHARDS;
    return domain[workload] ?? domain.default;
}

export function selectStudioShard(shard, files) {
    if (!STUDIO_SHARDS.includes(shard)) throw new Error(`Unknown Studio shard: ${shard}`);
    const selected = files.filter((file) => file.endsWith('.test.js') && studioShardForFile(file) === shard).sort();
    if (!selected.length) throw new Error(`Studio shard has no test files: ${shard}`);
    return selected;
}

export function studioTestFiles(directory = resolve('nala/studio')) {
    return readdirSync(directory, { recursive: true })
        .filter((file) => file.endsWith('.test.js'))
        .map((file) => `nala/studio/${file.replaceAll('\\', '/')}`)
        .sort();
}

export function studioShardTestMatch(shard) {
    return selectStudioShard(shard, studioTestFiles()).map(
        (file) =>
            new RegExp(
                `^${resolve(file)
                    .replaceAll('\\', '/')
                    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
            ),
    );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    console.log(selectStudioShard(process.argv[2], studioTestFiles()).join('\n'));
}
