import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const STUDIO_SHARDS = ['saves', 'acom-ahome-ccd-commerce', 'rest'];
const CONTENT_DIRECTORIES = new Set(['acom', 'ahome', 'ccd', 'commerce']);

export function studioShardForFile(file) {
    const relative = file.replaceAll('\\', '/').replace(/^nala\/studio\//, '');
    const directory = relative.split('/')[0];
    if (relative.endsWith('_save.test.js') || directory === 'ost' || directory === 'sandbox') return 'saves';
    if (CONTENT_DIRECTORIES.has(directory)) return 'acom-ahome-ccd-commerce';
    return 'rest';
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
