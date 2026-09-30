import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { extractAssetPaths, hashContent, replaceVersionsBlock } from '../../build-versions.mjs';

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
