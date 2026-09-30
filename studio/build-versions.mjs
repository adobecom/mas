import { createHash } from 'node:crypto';

const BOOT_SCRIPT = /<script id="studio-boot">([\s\S]*?)<\/script>/;
const VERSIONS_BLOCK = /(<script type="application\/json" id="studio-versions">)[\s\S]*?(<\/script>)/;
const ASSET_PATH = /['"](\/(?:studio|web-components)\/[^'"?#\s]+\.(?:js|css))['"]/g;
const BLOCK_INDENT = '            ';

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
