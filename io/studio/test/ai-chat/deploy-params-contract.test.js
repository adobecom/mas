const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

/**
 * An action reads its configuration from `params`, and `params` is filled from
 * the `inputs:` block in app.config.yaml. A var the code reads but the manifest
 * never declares is ALWAYS undefined in deployment — there is no error, no log
 * line, and locally it often works because the developer has it in .env.
 *
 * RAG_VARIANT_DETAILS sat like that: index.js:799 gates the variant-knowledge
 * retrieval on `params.RAG_VARIANT_DETAILS === 'true'`, the manifest never
 * passed it, so variant-knowledge-builder.js could not run in deployment no
 * matter how the flag was set. The assistant answered variant questions from
 * whatever generic chunk the retriever happened to score highest.
 *
 * The mirror of this test lives in io/mcp-server (deploy-inputs-contract),
 * which checks the other direction: manifest vars the deploy workflow forgets.
 */

const ROOT = path.join(__dirname, '../..');
const MANIFEST = path.join(ROOT, 'app.config.yaml');
const SRC = path.join(ROOT, 'src');

/**
 * Params supplied by the I/O Runtime platform rather than by the manifest.
 * LOG_LEVEL is injected by the aio action wrapper.
 */
const PLATFORM_PROVIDED = new Set(['LOG_LEVEL']);

function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full);
        return entry.name.endsWith('.js') ? [full] : [];
    });
}

/** Config vars the source actually reads off params. */
function paramsRead() {
    const names = new Set();
    for (const file of walk(SRC)) {
        const src = fs.readFileSync(file, 'utf8');
        for (const [, name] of src.matchAll(/params\??\.([A-Z][A-Z0-9_]+)/g)) names.add(name);
    }
    return names;
}

/** Vars the manifest declares as action inputs. */
function manifestDeclares() {
    const src = fs.readFileSync(MANIFEST, 'utf8');
    return new Set([...src.matchAll(/\$([A-Z][A-Z0-9_]+)/g)].map((m) => m[1]));
}

describe('ai-chat/deploy params contract', () => {
    it('finds the manifest and the source tree', () => {
        expect(fs.existsSync(MANIFEST), MANIFEST).to.equal(true);
        expect(paramsRead().size).to.be.above(0);
    });

    it('declares every config param the code reads', () => {
        const declared = manifestDeclares();
        const undeclared = [...paramsRead()]
            .filter((name) => !declared.has(name))
            .filter((name) => !PLATFORM_PROVIDED.has(name));

        expect(
            undeclared,
            `read from params but never declared in app.config.yaml, so always undefined in deployment: ${undeclared.join(', ')}`,
        ).to.deep.equal([]);
    });

    it('keeps the platform allowlist honest', () => {
        // If the manifest starts declaring one of these, it is no longer
        // platform-provided and the allowlist entry is misleading.
        const declared = manifestDeclares();
        const nowDeclared = [...PLATFORM_PROVIDED].filter((name) => declared.has(name));

        expect(nowDeclared, `declared in the manifest, so remove from PLATFORM_PROVIDED: ${nowDeclared.join(', ')}`).to.deep.equal(
            [],
        );
    });
});
