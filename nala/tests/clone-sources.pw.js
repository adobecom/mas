import { test, expect } from '@playwright/test';
import { readdirSync, unlinkSync, rmdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CloneSourceCache } from '../libs/clone-source-cache.js';
import { createRunId, clearRunId } from '../utils/fragment-tracker.js';
import { initializeFragmentLedger, readFragmentLedger } from '../utils/fragment-ledger.js';

test.describe.configure({ mode: 'parallel' });

const AUTHOR = 'http://author-clone-test.adobeaemcloud.com';
const source = {
    id: 'original',
    title: 'Shared source',
    path: '/content/dam/mas/nala/en_US/ccd/shared-source',
    description: 'Source description',
    model: { id: 'merch-card-model' },
    fields: [
        { name: 'variant', values: ['ccd-suggested'] },
        { name: 'subtitle', values: ['Original subtitle'] },
        { name: 'variations', values: ['shared-variation'] },
    ],
    tags: [{ id: 'mas:market_segments/com' }],
};
let directory;

test.beforeEach(() => {
    const runId = createRunId();
    directory = resolve('nala/.runs', runId);
    initializeFragmentLedger();
});

test.afterEach(() => {
    for (const name of readdirSync(directory)) unlinkSync(join(directory, name));
    rmdirSync(directory);
    clearRunId();
});

async function sourcePage(browser, state, fragment = source) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.route(`${AUTHOR}/**`, async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const headers = {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'GET, POST, PUT, OPTIONS',
            'access-control-allow-headers': 'content-type, if-match',
            'access-control-expose-headers': 'etag',
            etag: '"live-tags"',
        };
        let status = 200;
        let body = fragment;
        if (request.method() === 'POST') {
            const data = request.postDataJSON();
            state.creations.push(data);
            body = { ...data, id: `seed-${state.creations.length}`, path: `${data.parentPath}/${data.name}` };
            status = state.creationStatus ?? 201;
        } else if (request.method() === 'PUT') {
            state.tags.push({ body: request.postDataJSON(), etag: request.headers()['if-match'] });
            status = state.tagStatus ?? 200;
            body = {};
        } else if (url.pathname.endsWith('/tags')) {
            body = { tags: [] };
        }
        await route.fulfill({ status, headers, body: JSON.stringify(body) });
    });
    await page.setContent('<mas-repository></mas-repository>');
    await page.evaluate(
        ({ author, fragment }) => {
            const repo = document.querySelector('mas-repository');
            const cfFragmentsUrl = `${author}/adobe/sites/cf/fragments`;
            repo.fragmentInEdit = fragment;
            repo.aem = {
                baseUrl: author,
                cfFragmentsUrl,
                headers: {},
                sites: {
                    cf: {
                        fragments: {
                            getById: async (id) => (await fetch(`${cfFragmentsUrl}/${id}`)).json(),
                            create: async (data) => {
                                const response = await fetch(cfFragmentsUrl, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(data),
                                });
                                if (!response.ok) throw new Error(`Create failed: HTTP ${response.status}`);
                                return response.json();
                            },
                        },
                    },
                },
            };
        },
        { author: AUTHOR, fragment },
    );
    return { page, context };
}

test('one worker reuses an immutable source ID across fresh contexts and records ownership', async ({ browser }) => {
    const cache = new CloneSourceCache(1);
    const state = { creations: [], tags: [] };
    const first = await sourcePage(browser, state);
    const id = await cache.get(first.page, source.id);
    await first.context.close();
    const second = await sourcePage(browser, state);
    try {
        expect(await cache.get(second.page, source.id)).toBe(id);
        expect(state.creations).toHaveLength(1);
        expect(state.creations[0]).toMatchObject({
            description: source.description,
            modelId: source.model.id,
            parentPath: '/content/dam/mas/nala/en_US/ccd',
            fields: source.fields.filter((field) => field.name !== 'variations'),
        });
        expect(state.tags).toEqual([{ body: { tags: ['mas:market_segments/com'] }, etag: '"live-tags"' }]);
        expect(cache.metrics).toEqual({ created: 1, reused: 1 });
        expect(readFragmentLedger()).toMatchObject({ fragments: [{ id }], recover: false });
        expect(source.title).toBe('Shared source');
    } finally {
        await second.context.close();
    }
});

test('parallel workers provision different explicit paths for the same original', async ({ browser }) => {
    const state = { creations: [], tags: [] };
    const pages = await Promise.all([sourcePage(browser, state), sourcePage(browser, state)]);
    try {
        await Promise.all(pages.map(({ page }, index) => new CloneSourceCache(index).get(page, source.id)));
        expect(state.creations).toHaveLength(2);
        expect(new Set(state.creations.map((fragment) => fragment.name)).size).toBe(2);
        expect(state.creations[0].name).toMatch(/-w[01]-[a-f0-9-]+$/);
        expect(state.creations[1].name).toMatch(/-w[01]-[a-f0-9-]+$/);
        expect(readFragmentLedger()).toMatchObject({ recover: false });
        expect(readFragmentLedger().fragments).toHaveLength(2);
    } finally {
        await Promise.all(pages.map(({ context }) => context.close()));
    }
});

test('cloning a run-owned clone keeps the requested source and performs no provisioning', async ({ browser }) => {
    const state = { creations: [], tags: [] };
    const { page, context } = await sourcePage(browser, state, {
        ...source,
        title: `MAS.Nala.Automation.${process.env.NALA_RUN_ID}.test-clone`,
    });
    try {
        expect(await new CloneSourceCache(1).get(page, source.id)).toBe(source.id);
        expect(state.creations).toEqual([]);
        expect(state.tags).toEqual([]);
    } finally {
        await context.close();
    }
});

test('tag failures remain errors, retain the created source for cleanup and do not cache it', async ({ browser }) => {
    const state = { creations: [], tags: [], tagStatus: 500 };
    const { page, context } = await sourcePage(browser, state);
    const cache = new CloneSourceCache(1);
    try {
        await expect(cache.get(page, source.id)).rejects.toThrow('Cannot copy clone-source tags: HTTP 500');
        expect(cache.sources.size).toBe(0);
        expect(readFragmentLedger().fragments).toHaveLength(1);
        expect(state.creations).toHaveLength(1);
        expect(state.tags).toHaveLength(1);
    } finally {
        await context.close();
    }
});

test('creation failure is single-attempt and leaves an interrupted-creation recovery marker', async ({ browser }) => {
    const state = { creations: [], tags: [], creationStatus: 500 };
    const { page, context } = await sourcePage(browser, state);
    const cache = new CloneSourceCache(1);
    try {
        await expect(cache.get(page, source.id)).rejects.toThrow('Create failed: HTTP 500');
        expect(state.creations).toHaveLength(1);
        expect(state.tags).toEqual([]);
        expect(cache.sources.size).toBe(0);
        expect(readFragmentLedger()).toMatchObject({ fragments: [], recover: true });
    } finally {
        await context.close();
    }
});

test('provisioning refuses sources outside the Nala fixture folders', async ({ browser }) => {
    const state = { creations: [], tags: [] };
    const { page, context } = await sourcePage(browser, state, { ...source, path: '/content/dam/mas/acom/shared-source' });
    try {
        await expect(new CloneSourceCache(1).get(page, source.id)).rejects.toThrow('outside Nala');
        expect(state.creations).toEqual([]);
    } finally {
        await context.close();
    }
});
