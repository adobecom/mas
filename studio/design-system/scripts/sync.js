import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const dir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(dir, '../..');

function readFile(path) {
    return readFileSync(resolve(root, path), 'utf8');
}

function extractSwcComponents(swcJs) {
    const tags = new Set();
    for (const line of swcJs.split('\n')) {
        const m = line.match(/import '@spectrum-web-components\/[^']*\/(sp-[^/.]+)\.js'/);
        if (m) tags.add(m[1]);
    }
    return tags;
}

function extractDocumentedComponents(componentsMd) {
    const tags = new Set();
    for (const line of componentsMd.split('\n')) {
        const m = line.match(/^## (sp-[a-z0-9-]+)$/);
        if (m) tags.add(m[1]);
    }
    return tags;
}

function extractExampleTags(html) {
    const tags = new Set();
    for (const m of html.matchAll(/<(sp-[a-z0-9-]+)/g)) {
        tags.add(m[1]);
    }
    return tags;
}

function run() {
    const swcJs = readFile('studio/src/swc.js');
    const componentsMd = readFile('studio/design-system/components.md');

    const swcTags = extractSwcComponents(swcJs);
    const docTags = extractDocumentedComponents(componentsMd);

    const warnings = [];

    for (const tag of swcTags) {
        if (!docTags.has(tag) && !tag.startsWith('sp-icon-')) {
            warnings.push(`MISSING DOC: ${tag} is in swc.js but not in components.md`);
        }
    }

    for (const tag of docTags) {
        if (!swcTags.has(tag) && !tag.startsWith('sp-icon-') && tag !== 'overlay-trigger') {
            warnings.push(`STALE DOC: ${tag} is in components.md but not in swc.js`);
        }
    }

    const exampleFiles = [
        'studio/design-system/examples/dialog.html',
        'studio/design-system/examples/toolbar.html',
        'studio/design-system/examples/side-nav.html',
        'studio/design-system/examples/fragment-editor.html',
        'studio/design-system/examples/data-table.html',
    ];

    for (const examplePath of exampleFiles) {
        const html = readFile(examplePath);
        for (const tag of extractExampleTags(html)) {
            if (!swcTags.has(tag) && !tag.startsWith('sp-icon-') && tag !== 'overlay-trigger' && tag !== 'sp-theme') {
                warnings.push(`STALE EXAMPLE: ${tag} used in ${examplePath} but removed from swc.js`);
            }
        }
    }

    if (warnings.length > 0) {
        console.error('\n⚠  Design system sync warnings:\n');
        for (const w of warnings) console.error(`  ${w}`);
        console.error('\nFix: update studio/design-system/components.md to match studio/src/swc.js\n');
        process.exit(1);
    }

    console.log('✓ Design system sync: components.md matches swc.js');
    console.log('✓ Design system sync: examples reference only current components');
}

run();
