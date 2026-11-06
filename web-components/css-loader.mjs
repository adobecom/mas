import { readFileSync } from 'node:fs';
import { Features, transform } from 'lightningcss';

// css`...` (src/css.js) in a module is replaced with its minified text, with
// @custom-media from src/media.css resolved, so styles reach components as
// plain strings, with or without Lit.

const MEDIA_CSS = new URL('./src/media.css', import.meta.url);
const MEDIA_JS = new URL('./src/media.js', import.meta.url);
const CSS_TAG_IMPORT = /import \{ css \} from '(\.\/|(\.\.\/)+)css\.js';/;
const CSS_TAG = /\bcss`((?:\\[\s\S]|[^\\`])*)`/g;
const TEMPLATE_ESCAPES = { '\\': '\\', '`': '`', $: '$' };

// Oldest browsers this CSS already needs (flexbox gap, logical properties):
// lightningcss keeps the fallbacks, vendor prefixes and media query syntax
// they need.
const version = (major, minor = 0) => (major << 16) | (minor << 8);
const targets = {
    chrome: version(87),
    edge: version(87),
    firefox: version(80),
    safari: version(14, 1),
    ios_saf: version(14, 5),
};

// Resolve @custom-media and minify; leave everything else as authored.
const exclude =
    Features.Selectors |
    Features.Nesting |
    Features.LogicalProperties |
    Features.Colors |
    Features.ClampFunction |
    Features.FontFamilySystemUi |
    Features.DoublePositionGradients |
    Features.TextDecorationThicknessPercent;

let customMedia;

// @custom-media --tablet-up in media.css must match TABLET_UP in media.js.
function getCustomMedia() {
    if (customMedia) return customMedia;
    const css = readFileSync(MEDIA_CSS, 'utf-8');
    const fromCss = Object.fromEntries(
        [...css.matchAll(/@custom-media\s+--([\w-]+)\s+([^;]+);/g)].map(
            ([, name, query]) => [name, query.trim()],
        ),
    );
    const fromJs = Object.fromEntries(
        [
            ...readFileSync(MEDIA_JS, 'utf-8').matchAll(
                /export const (\w+) = '([^']+)';/g,
            ),
        ].map(([, name, query]) => [
            name.toLowerCase().replaceAll('_', '-'),
            query,
        ]),
    );
    const mismatches = [
        ...new Set([...Object.keys(fromCss), ...Object.keys(fromJs)]),
    ].filter((name) => fromCss[name] !== fromJs[name]);
    if (mismatches.length) {
        throw new Error(
            `src/media.css and src/media.js disagree on ${mismatches.map((name) => `--${name}`).join(', ')}`,
        );
    }
    customMedia = css;
    return customMedia;
}

export function minifyCss(code, filename) {
    const { code: minified } = transform({
        filename,
        // Appended, so error positions still match the source file.
        code: Buffer.from(`${code}\n${getCustomMedia()}`),
        minify: true,
        targets,
        exclude,
        drafts: { customMedia: true },
    });
    return minified.toString();
}

// Keeps the line count, so coverage and stack traces still match the source.
// The css.js import goes too, so bundles don't reference it.
export function inlineCss(code, filename) {
    if (!CSS_TAG_IMPORT.test(code)) return code;
    return code
        .replace(CSS_TAG_IMPORT, '')
        .replace(CSS_TAG, (template, text) => {
            const css = text.replace(/\\([\s\S])/g, (escape, char) => {
                if (TEMPLATE_ESCAPES[char]) return TEMPLATE_ESCAPES[char];
                throw new Error(
                    `${filename}: unsupported escape ${escape} in css\`\``,
                );
            });
            if (/(^|[^\\])\$\{/.test(text)) {
                throw new Error(
                    `${filename}: css\`\` can't interpolate; use @custom-media from media.css`,
                );
            }
            const lines = template.split('\n').length - 1;
            return `${JSON.stringify(minifyCss(css, filename))}${'\n'.repeat(lines)}`;
        });
}

/** esbuild plugin */
export function cssLoader() {
    return {
        name: 'css-loader',
        setup(build) {
            build.onLoad({ filter: /\.js$/ }, ({ path }) => {
                const code = readFileSync(path, 'utf-8');
                if (!CSS_TAG_IMPORT.test(code)) return;
                return { contents: inlineCss(code, path), loader: 'js' };
            });
        },
    };
}

/** @web/dev-server (web-test-runner) plugin */
export function cssLoaderDevServer() {
    return {
        name: 'css-loader',
        transform(context) {
            if (!context.path.endsWith('.js')) return;
            return { body: inlineCss(context.body, context.path) };
        },
    };
}
