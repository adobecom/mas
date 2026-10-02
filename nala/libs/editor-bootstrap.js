import { expect } from '@playwright/test';
import GlobalRequestCounter from './global-request-counter.js';

/**
 * Wait for the requested editor and its actual card preview, not network silence.
 */
export async function waitForEditorReady(page, fragmentId) {
    await page.waitForFunction((id) => {
        const editor = document.querySelector('mas-fragment-editor');
        return (
            editor?.initState === 'ready' &&
            editor.fragmentStore?.get().id === id &&
            editor.previewResolved &&
            !document.querySelector('mas-repository').operation.get()
        );
    }, fragmentId);
    const card = page.locator(`merch-card:has(aem-fragment[fragment="${fragmentId}"])`);
    await expect(card).toBeVisible();
    const ready = await card.evaluate(async (element) => {
        await element.checkReady();
        return !element.failed;
    });
    expect(ready, `Preview for ${fragmentId} must resolve`).toBe(true);
}

/**
 * Only read operations against the authoring API belong in a seed bootstrap.
 */
export function isBootstrapRead(request) {
    const url = new URL(request.url());
    return (
        url.hostname.endsWith('.adobeaemcloud.com') &&
        (url.pathname.startsWith('/adobe/sites/') || url.pathname.startsWith('/api/assets/')) &&
        (request.method() === 'GET' || (request.method() === 'POST' && url.pathname.endsWith('/cf/fragments/search')))
    );
}

function requestKey(request) {
    return JSON.stringify([request.method(), request.url(), request.postData()]);
}

/**
 * Replay live seed-bootstrap reads into fresh contexts; never replay test actions.
 * Snapshots are worker-local, keyed by the full editor URL, and committed only
 * after a successful cold load. No authentication headers are retained.
 */
export class EditorBootstrapCache {
    snapshots = new Map();
    pages = new WeakMap();
    metrics = { coldLoads: 0, reusedLoads: 0, replayedReads: 0 };

    async install(page) {
        const state = { active: null };
        this.pages.set(page, state);
        await page.route('**/*', async (route) => {
            const request = route.request();
            const cached = state.active?.snapshot?.get(requestKey(request));
            if (cached && isBootstrapRead(request)) {
                this.metrics.replayedReads++;
                GlobalRequestCounter.recordCacheHit(request.url());
                await route.fulfill(cached);
                return;
            }
            await route.fallback();
        });
        page.on('response', (response) => {
            const active = state.active;
            if (!active || active.snapshot || !isBootstrapRead(response.request()) || response.status() !== 200) return;
            active.pending.push(
                (async () => {
                    const headers = await response.allHeaders();
                    if (headers['set-cookie']) return;
                    const body = await response.body();
                    delete headers['content-encoding'];
                    delete headers['content-length'];
                    delete headers['transfer-encoding'];
                    active.recorded.set(requestKey(response.request()), { status: 200, headers, body });
                })().catch((error) => {
                    active.errors.push(error);
                }),
            );
        });
    }

    async open(page, url) {
        const target = new URL(url);
        const fragmentId = new URLSearchParams(target.hash.slice(1)).get('fragmentId');
        if (!fragmentId) {
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            return;
        }
        if (process.env.NALA_EDITOR_BOOTSTRAP_DISABLED === '1') {
            this.metrics.coldLoads++;
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await waitForEditorReady(page, fragmentId);
            return;
        }
        const state = this.pages.get(page);
        const key = target.href;
        const active = { snapshot: this.snapshots.get(key), recorded: new Map(), pending: [], errors: [] };
        state.active = active;
        this.metrics[active.snapshot ? 'reusedLoads' : 'coldLoads']++;
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await waitForEditorReady(page, fragmentId);
            state.active = null;
            await Promise.all(active.pending);
            if (active.errors.length) throw new AggregateError(active.errors, 'Failed to capture editor bootstrap');
            if (!active.snapshot) this.snapshots.set(key, new Map(active.recorded));
        } finally {
            state.active = null;
        }
    }
}
