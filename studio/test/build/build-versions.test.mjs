import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
    collectModuleGraph,
    computeVersions,
    extractAssetPaths,
    GRAPH_ENTRIES,
    hashContent,
    replaceVersionsBlock,
    REPO_ROOT,
} from '../../build-versions.mjs';

const BOOT_HTML = [
    '<head>',
    '<script id="studio-boot">',
    "    const lit = '/web-components/dist/lit-all.min.js';",
    "    const entry = versioned('/studio/src/studio.js');",
    '    const style = versioned("/studio/style.css");',
    "    const again = '/studio/src/studio.js';",
    "    const font = 'https://use.typekit.net/hah7vzn.css';",
    "    const page = '/studio.html';",
    '</script>',
    '<script src="/studio/outside-boot.js"></script>',
    '</head>',
].join('\n');

const VERSIONS_HTML = [
    '<head>',
    '        <script type="application/json" id="studio-versions">',
    '            {}',
    '        </script>',
    '        <script id="studio-boot"></script>',
    '</head>',
].join('\n');

const blockJson = (html) => JSON.parse(html.match(/id="studio-versions">([\s\S]*?)<\/script>/)[1]);

describe('hashContent', () => {
    test('returns the first 8 hex chars of the SHA-256', () => {
        assert.equal(hashContent(Buffer.from('abc')), 'ba7816bf');
    });

    test('is stable for equal input and differs for different input', () => {
        assert.equal(hashContent('same'), hashContent(Buffer.from('same')));
        assert.notEqual(hashContent('one'), hashContent('two'));
    });
});

describe('extractAssetPaths', () => {
    test('returns sorted unique studio and web-components asset paths from the boot script only', () => {
        assert.deepEqual(extractAssetPaths(BOOT_HTML), [
            '/studio/src/studio.js',
            '/studio/style.css',
            '/web-components/dist/lit-all.min.js',
        ]);
    });

    test('throws when the boot script is missing', () => {
        assert.throws(() => extractAssetPaths('<html></html>'), /studio-boot/);
    });
});

describe('replaceVersionsBlock', () => {
    const versions = { '/studio/src/b.js': '22222222', '/studio/src/a.js': '11111111' };

    test('writes valid JSON with the given versions', () => {
        assert.deepEqual(blockJson(replaceVersionsBlock(VERSIONS_HTML, versions)), versions);
    });

    test('writes one entry per line in sorted order', () => {
        assert.match(
            replaceVersionsBlock(VERSIONS_HTML, versions),
            /\n {16}"\/studio\/src\/a\.js": "11111111",\n {16}"\/studio\/src\/b\.js": "22222222"\n/,
        );
    });

    test('leaves everything outside the block unchanged', () => {
        const out = replaceVersionsBlock(VERSIONS_HTML, versions);
        const [before, after] = VERSIONS_HTML.split('{}');
        assert.ok(out.startsWith(before));
        assert.ok(out.endsWith(after));
    });

    test('is idempotent', () => {
        const once = replaceVersionsBlock(VERSIONS_HTML, versions);
        assert.equal(replaceVersionsBlock(once, versions), once);
    });

    test('writes an empty object when there are no versions', () => {
        assert.equal(replaceVersionsBlock(VERSIONS_HTML, {}), VERSIONS_HTML);
    });

    test('does not expand $ replacement patterns', () => {
        const tricky = { '/studio/$&.js': 'deadbeef' };
        assert.deepEqual(blockJson(replaceVersionsBlock(VERSIONS_HTML, tricky)), tricky);
    });

    test('throws when the versions block is missing', () => {
        assert.throws(() => replaceVersionsBlock('<html></html>', versions), /studio-versions/);
    });
});

const GRAPH_HTML = [
    '<script id="studio-boot">',
    "versioned('/studio/src/studio.js');",
    "versioned('/web-components/dist/lit-all.min.js');",
    '</script>',
].join('\n');

describe('collectModuleGraph', () => {
    test('includes studio, io/www, and web-components source modules and the lazy editor', async () => {
        const graph = await collectModuleGraph(REPO_ROOT, GRAPH_ENTRIES);
        assert.ok(graph.includes('/studio/src/studio.js'));
        assert.ok(graph.includes('/studio/src/editors/merch-card-editor.js'));
        assert.ok(graph.includes('/studio/src/placeholders/mas-placeholders.js'));
        assert.ok(graph.some((assetPath) => assetPath.startsWith('/io/www/src/')));
        assert.ok(graph.some((assetPath) => assetPath.startsWith('/web-components/src/')));
    });

    test('includes io/www modules reached from fragment-client', async () => {
        const graph = await collectModuleGraph(REPO_ROOT, ['/studio/libs/fragment-client.js']);
        assert.ok(graph.includes('/studio/libs/fragment-client.js'));
        assert.ok(graph.some((assetPath) => assetPath.startsWith('/io/www/src/')));
    });

    test('leaves bare specifiers to the import map', async () => {
        const graph = await collectModuleGraph(REPO_ROOT, GRAPH_ENTRIES);
        assert.ok(graph.every((assetPath) => assetPath.startsWith('/') && !assetPath.includes('node_modules')));
    });
});

describe('collectModuleGraph dynamic imports', () => {
    let tmpDir;

    before(async () => {
        tmpDir = await mkdtemp(path.join(os.tmpdir(), 'studio-versions-'));
    });

    after(async () => {
        await rm(tmpDir, { recursive: true, force: true });
    });

    test('rejects a non-literal dynamic import()', async () => {
        await writeFile(path.join(tmpDir, 'entry.js'), 'export const load = (name) => import(name);\n');
        await assert.rejects(collectModuleGraph(tmpDir, ['/entry.js']), /non-literal dynamic import/);
    });

    test('follows a literal dynamic import()', async () => {
        await writeFile(path.join(tmpDir, 'entry.js'), "export const load = () => import('./lazy.js');\n");
        await writeFile(path.join(tmpDir, 'lazy.js'), 'export const value = 1;\n');
        const graph = await collectModuleGraph(tmpDir, ['/entry.js']);
        assert.ok(graph.includes('/lazy.js'));
    });
});

describe('computeVersions', () => {
    test('versions boot assets plus the module graph with content hashes', async () => {
        const versions = await computeVersions(REPO_ROOT, GRAPH_HTML);
        const studioJs = await readFile(path.join(REPO_ROOT, 'studio/src/studio.js'));
        assert.equal(versions['/studio/src/studio.js'], hashContent(studioJs));
        assert.match(versions['/web-components/dist/lit-all.min.js'], /^[0-9a-f]{8}$/);
        assert.match(versions['/studio/src/editors/merch-card-editor.js'], /^[0-9a-f]{8}$/);
    });

    test('fails when the boot script references a missing file', async () => {
        await assert.rejects(
            computeVersions(REPO_ROOT, GRAPH_HTML.replace('lit-all.min.js', '__missing__.js')),
            /\/web-components\/dist\/__missing__\.js, which does not exist/,
        );
    });
});
