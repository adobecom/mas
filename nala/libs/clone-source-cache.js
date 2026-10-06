import { randomUUID } from 'node:crypto';
import { getCurrentRunId } from '../utils/fragment-tracker.js';
import { beginFragmentCreation, finishFragmentCreation } from '../utils/fragment-ledger.js';

export class CloneSourceCache {
    sources = new Map();
    metrics = { created: 0, reused: 0 };

    constructor(workerIndex) {
        this.workerIndex = workerIndex;
    }

    async get(page, fragmentId) {
        const runId = getCurrentRunId();
        const { origin, owned } = await page.evaluate((runId) => {
            const repo = document.querySelector('mas-repository');
            return { origin: repo.aem.baseUrl, owned: repo.fragmentInEdit.title.includes(runId) };
        }, runId);
        if (owned) return fragmentId;

        const key = JSON.stringify([origin, fragmentId]);
        if (this.sources.has(key)) {
            this.metrics.reused++;
            return this.sources.get(key);
        }

        const creation = beginFragmentCreation('clone-source');
        const name = `${runId}-w${this.workerIndex}-${randomUUID()}`;
        const title = `MAS.Nala.Automation.${runId}.source.w${this.workerIndex}.${fragmentId}`;
        const seed = await page.evaluate(
            async ({ fragmentId, name, title }) => {
                const aem = document.querySelector('mas-repository').aem;
                const source = await aem.sites.cf.fragments.getById(fragmentId);
                if (!source.path.startsWith('/content/dam/mas/nala/')) {
                    throw new Error(`Refusing to provision a clone source outside Nala: ${source.path}`);
                }
                const fragment = await aem.sites.cf.fragments.create({
                    title,
                    name,
                    parentPath: source.path.split('/').slice(0, -1).join('/'),
                    description: source.description,
                    modelId: source.model.id,
                    fields: source.fields.filter((field) => field.name !== 'variations'),
                });
                return {
                    id: fragment.id,
                    path: fragment.path,
                    title: fragment.title,
                    tags: (source.tags ?? []).map((tag) => tag.id ?? tag),
                };
            },
            { fragmentId, name, title },
        );
        finishFragmentCreation(creation, seed);

        if (seed.tags.length) {
            await page.evaluate(async ({ id, tags }) => {
                const aem = document.querySelector('mas-repository').aem;
                const url = `${aem.cfFragmentsUrl}/${id}/tags`;
                const response = await fetch(url, { headers: aem.headers });
                if (!response.ok) throw new Error(`Cannot read clone-source tags: HTTP ${response.status}`);
                const etag = response.headers.get('etag');
                if (!etag) throw new Error('Missing live ETag for clone-source tags');
                const saved = await fetch(url, {
                    method: 'PUT',
                    headers: { ...aem.headers, 'Content-Type': 'application/json', 'If-Match': etag },
                    body: JSON.stringify({ tags }),
                });
                if (!saved.ok) throw new Error(`Cannot copy clone-source tags: HTTP ${saved.status}`);
            }, seed);
        }
        this.sources.set(key, seed.id);
        this.metrics.created++;
        return seed.id;
    }
}
