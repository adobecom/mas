/**
 * Split a paths file (produced by bulk-publish-discover.mjs) into one file
 * per non-empty "# surface/locale" section, so bulk-publish.mjs can be
 * invoked per locale — avoids the action's MAX_PATHS=500 cap and keeps
 * per-locale audit trails.
 *
 * Usage:
 *   node scripts/content/bulk-publish-segment.mjs \
 *       --in /tmp/bulk-publish-paths.stage.txt \
 *       --out-dir /tmp/bulk-publish-segments.stage
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from './common.js';

const { getFlag } = parseArgs(process.argv);

const inFile = getFlag('--in');
const outDir = getFlag('--out-dir');

if (!inFile || !outDir) {
    console.error('Usage: node bulk-publish-segment.mjs --in <paths-file> --out-dir <dir>');
    process.exit(1);
}

await mkdir(outDir, { recursive: true });

const lines = (await readFile(inFile, 'utf8')).split('\n');

let currentHeader = null;
let currentPaths = [];
const sections = [];

for (const line of lines) {
    if (line.startsWith('# ')) {
        if (currentHeader && currentPaths.length > 0) {
            sections.push({ header: currentHeader, paths: currentPaths });
        }
        currentHeader = line.slice(2).trim();
        currentPaths = [];
        continue;
    }
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!trimmed.startsWith('/content/dam/mas/')) continue;
    currentPaths.push(trimmed);
}
if (currentHeader && currentPaths.length > 0) {
    sections.push({ header: currentHeader, paths: currentPaths });
}

const acomEnUs = sections.filter((s) => s.header.startsWith('acom/en_US'));
if (acomEnUs.length > 0) {
    console.error(`FATAL: ${acomEnUs.length} acom/en_US section(s) in ${inFile} — refusing to segment.`);
    process.exit(1);
}

const MAX_PATHS_PER_FILE = 500;
let totalPaths = 0;
let totalFiles = 0;

for (const { header, paths } of sections) {
    const slug = header.split(/\s+/)[0].replace(/\//g, '_');
    for (let i = 0; i < paths.length; i += MAX_PATHS_PER_FILE) {
        const chunk = paths.slice(i, i + MAX_PATHS_PER_FILE);
        const suffix = paths.length > MAX_PATHS_PER_FILE ? `.part${Math.floor(i / MAX_PATHS_PER_FILE) + 1}` : '';
        const filename = join(outDir, `${slug}${suffix}.txt`);
        const body = [`# ${header}`, ...chunk].join('\n');

        await writeFile(filename, `${body}\n`, 'utf8');
        totalPaths += chunk.length;
        totalFiles += 1;
        console.log(`  ${filename}  (${chunk.length} paths)`);
    }
}

console.log('');
console.log(`Wrote ${totalFiles} segment file(s) totalling ${totalPaths} paths into ${outDir}`);
console.log('');
console.log('To publish, iterate (replace <token> and <ns>):');
console.log(`  for f in ${outDir}/*.txt; do`);
console.log('    echo ">> $f"');
console.log('    MAS_IMS_TOKEN=<token> node scripts/content/bulk-publish.mjs \\');
console.log('        --paths-file "$f" --namespace <ns> --odin-endpoint https://<aem-author-host>');
console.log('  done');
