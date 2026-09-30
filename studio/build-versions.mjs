import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

export const REPO_ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
export const GRAPH_ENTRIES = ['/studio/src/studio.js', '/studio/libs/fragment-client.js'];

const BOOT_SCRIPT = /<script id="studio-boot">([\s\S]*?)<\/script>/;
const VERSIONS_BLOCK = /(<script type="application\/json" id="studio-versions">)[\s\S]*?(<\/script>)/;
const ASSET_PATH = /['"](\/(?:studio|web-components)\/[^'"?#\s]+\.(?:js|css))['"]/g;
const BLOCK_INDENT = '            ';

const externalizeBareSpecifiers = {
    name: 'externalize-bare-specifiers',
    setup(pluginBuild) {
        pluginBuild.onResolve({ filter: /^[^./]/ }, ({ path: specifier, kind }) =>
            kind === 'entry-point' ? undefined : { path: specifier, external: true },
        );
    },
};

/**
 * First 8 hex characters of the SHA-256 of `content`.
 * @param {Buffer|string} content
 * @returns {string}
 */
export function hashContent(content) {
    return createHash('sha256').update(content).digest('hex').slice(0, 8);
}

/**
 * Root-relative /studio/ and /web-components/ .js/.css paths quoted inside the studio-boot script.
 * @param {string} html
 * @returns {string[]} sorted and unique
 */
export function extractAssetPaths(html) {
    const boot = html.match(BOOT_SCRIPT);
    if (!boot) throw new Error('studio.html: <script id="studio-boot"> not found');
    const paths = [...boot[1].matchAll(ASSET_PATH)].map(([, assetPath]) => assetPath);
    return [...new Set(paths)].sort();
}

/**
 * Replaces the contents of the studio-versions block, one sorted entry per line.
 * @param {string} html
 * @param {Record<string, string>} versions
 * @returns {string}
 */
export function replaceVersionsBlock(html, versions) {
    if (!VERSIONS_BLOCK.test(html)) {
        throw new Error('studio.html: <script type="application/json" id="studio-versions"> not found');
    }
    const entries = Object.keys(versions)
        .sort()
        .map((assetPath) => `${BLOCK_INDENT}    ${JSON.stringify(assetPath)}: ${JSON.stringify(versions[assetPath])}`);
    const json = entries.length ? `{\n${entries.join(',\n')}\n${BLOCK_INDENT}}` : '{}';
    return html.replace(VERSIONS_BLOCK, (match, open, close) => `${open}\n${BLOCK_INDENT}${json}\n        ${close}`);
}

/**
 * Every module reachable from `entries` (static and literal dynamic imports), as sorted root-relative paths.
 * Throws on a non-literal import(), whose target would load unversioned.
 * Bare specifiers (lit, prosemirror-*, fragment-client) stay external: the import map versions their targets.
 * @param {string} rootDir absolute repo root
 * @param {string[]} entries root-relative entry paths
 * @returns {Promise<string[]>}
 */
export async function collectModuleGraph(rootDir, entries) {
    const result = await build({
        absWorkingDir: rootDir,
        entryPoints: entries.map((entry) => `.${entry}`),
        outdir: 'out',
        bundle: true,
        write: false,
        metafile: true,
        format: 'esm',
        platform: 'browser',
        minifyWhitespace: true,
        logLevel: 'silent',
        plugins: [externalizeBareSpecifiers],
    });
    if (result.outputFiles.some((file) => /\bimport\(/.test(file.text))) {
        throw new Error(
            `${entries.join(', ')}: non-literal dynamic import() found; use import('./literal.js') so the module can be versioned`,
        );
    }
    return Object.keys(result.metafile.inputs)
        .map((input) => `/${input}`)
        .sort();
}

/**
 * Content hash for every boot-script asset and every module in Studio's graph.
 * @param {string} rootDir absolute repo root
 * @param {string} html contents of studio.html
 * @returns {Promise<Record<string, string>>}
 */
export async function computeVersions(rootDir, html) {
    const graph = await collectModuleGraph(rootDir, GRAPH_ENTRIES);
    const assetPaths = [...new Set([...extractAssetPaths(html), ...graph])].sort();
    const contents = await Promise.all(
        assetPaths.map((assetPath) =>
            readFile(path.join(rootDir, assetPath)).catch((error) => {
                if (error.code !== 'ENOENT') throw error;
                throw new Error(`studio.html references ${assetPath}, which does not exist`);
            }),
        ),
    );
    return Object.fromEntries(assetPaths.map((assetPath, index) => [assetPath, hashContent(contents[index])]));
}

/**
 * Rewrites the studio-versions block of studio.html in place.
 * @param {string} [rootDir]
 */
export async function main(rootDir = REPO_ROOT) {
    const htmlPath = path.join(rootDir, 'studio.html');
    const html = await readFile(htmlPath, 'utf8');
    const versions = await computeVersions(rootDir, html);
    const next = replaceVersionsBlock(html, versions);
    if (next !== html) await writeFile(htmlPath, next);
    const status = next === html ? 'already current' : 'updated';
    console.log(`studio.html: ${Object.keys(versions).length} asset versions ${status}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await main();
}
