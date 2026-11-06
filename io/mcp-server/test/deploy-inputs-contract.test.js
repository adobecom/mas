import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = path.join(HERE, '../app.config.yaml');
const WORKFLOW = path.join(HERE, '../../../.github/workflows/deploy-mcp-runtime.yml');
const ACTIONS_DIR = path.join(HERE, '../src/actions');

/**
 * `aio app deploy --all` substitutes every $VAR in the manifest from the
 * environment. A var the deploy workflow does not export becomes an EMPTY
 * STRING on the deployed action — not a warning, not a failure, just an action
 * that 500s the first time a user calls it.
 *
 * That is how AOS_API_KEY got here: the workflow exports AEM_BASE_URL and
 * STUDIO_BASE_URL only, so create-release-cards and get-product-detail ship
 * configured to return "AOS_URL and AOS_API_KEY must be configured".
 *
 * A var is fine to omit ONLY if the code has a real fallback. This test makes
 * that distinction explicit so the next input added to the manifest cannot be
 * forgotten in the workflow.
 */

/**
 * Manifest vars deliberately not exported by the workflow, because the code
 * falls back to a sensible shared default. The reason is the value of the
 * fallback, so a wrong one is visible here rather than at runtime.
 */
const DEFAULTED_IN_CODE = {
    AOS_URL: 'https://aos.adobe.io',
    PRODUCTS_ENDPOINT: 'https://14257-masstudio.adobeioruntime.net/api/v1/web/MerchAtScaleStudio/ost-products-read',
    PRODUCTS_CACHE_TTL_MS: 'DEFAULT_CACHE_TTL_MS (10 minutes)',
};

/**
 * Vars with NO usable default that the workflow still does not export. Every
 * entry is an action deployed broken, so this list stays empty; it is not
 * somewhere to park a new gap.
 *
 * Exporting a var is only half the job: the matching GitHub secret has to
 * exist, or it still substitutes as an empty string. This test can see the
 * workflow, not the repository's secrets.
 */
const KNOWN_MISSING = {};

const read = (file) => fs.readFileSync(file, 'utf8');

/** Every $VAR the manifest asks the deploy to substitute. */
function manifestVars() {
    return new Set([...read(MANIFEST).matchAll(/\$([A-Z][A-Z0-9_]*)/g)].map((m) => m[1]));
}

/** Vars the deploy step exports into the environment aio app deploy reads. */
function workflowVars() {
    const src = read(WORKFLOW);
    const deployStep = src.slice(src.indexOf('Deploy to Adobe I/O Runtime'));
    const envBlock = deployStep.match(/env:\n([\s\S]*?)\n\s*run:/);
    if (!envBlock) return new Set();
    return new Set([...envBlock[1].matchAll(/^\s+([A-Z][A-Z0-9_]*):/gm)].map((m) => m[1]));
}

describe('mcp-server deploy inputs contract', () => {
    it('finds the manifest and the deploy workflow', () => {
        expect(fs.existsSync(MANIFEST), MANIFEST).to.equal(true);
        expect(fs.existsSync(WORKFLOW), WORKFLOW).to.equal(true);
        expect(manifestVars().size).to.be.above(0);
    });

    it('exports every manifest input that has no fallback in code', () => {
        const unprovided = [...manifestVars()]
            .filter((name) => !workflowVars().has(name))
            .filter((name) => !(name in DEFAULTED_IN_CODE))
            .filter((name) => !(name in KNOWN_MISSING));

        expect(
            unprovided,
            `deployed as empty strings, so the action 500s on first use: ${unprovided.join(', ')}`,
        ).to.deep.equal([]);
    });

    it('does not claim a fallback the code does not actually have', async () => {
        // Asserted by behaviour, not by grepping for a pattern: construct the
        // thing with nothing supplied and see what it actually resolves to.
        const { ProductCatalog } = await import('../src/services/product-catalog.js');
        const withNothing = new ProductCatalog(null, undefined, undefined);

        expect(withNothing.productsEndpoint).to.equal(DEFAULTED_IN_CODE.PRODUCTS_ENDPOINT);
        expect(withNothing.cacheTtlMs).to.equal(10 * 60 * 1000);

        // An empty string is what a missing deploy var actually looks like, so
        // it has to fall back the same way undefined does.
        const withEmpty = new ProductCatalog(null, '', '');
        expect(withEmpty.productsEndpoint).to.equal(DEFAULTED_IN_CODE.PRODUCTS_ENDPOINT);
        expect(withEmpty.cacheTtlMs).to.equal(10 * 60 * 1000);
    });

    it('falls back to the public AOS host when AOS_URL is not deployed', () => {
        const sources = fs
            .readdirSync(ACTIONS_DIR)
            .filter((file) => file.endsWith('.js'))
            .map((file) => read(path.join(ACTIONS_DIR, file)))
            .join('\n');

        expect(sources).to.include(`params.AOS_URL || '${DEFAULTED_IN_CODE.AOS_URL}'`);
    });

    describe('the known gap', () => {
        it('still names only vars the manifest actually uses', () => {
            const vars = manifestVars();
            const stale = Object.keys(KNOWN_MISSING).filter((name) => !vars.has(name));

            expect(stale, `KNOWN_MISSING lists vars the manifest no longer has: ${stale.join(', ')}`).to.deep.equal([]);
        });

        it('shrinks: a var the workflow now exports must leave the list', () => {
            const provided = workflowVars();
            const fixed = Object.keys(KNOWN_MISSING).filter((name) => provided.has(name));

            expect(fixed, `now exported, remove from KNOWN_MISSING: ${fixed.join(', ')}`).to.deep.equal([]);
        });
    });
});
