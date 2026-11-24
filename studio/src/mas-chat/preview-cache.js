/** Owns disposable preview identities without replacing authoritative fragments. */
export class FeaturePreviewCache {
    constructor(cache) {
        this.cache = cache;
        this.ids = new Map();
        this.generation = 0;
    }

    add(fragment) {
        this.cache ??= customElements.get('aem-fragment').cache;
        const previewId = this.ids.get(fragment.id) || `mas-preview-${crypto.randomUUID()}`;
        this.ids.set(fragment.id, previewId);
        const preview = structuredClone(fragment);
        preview.id = previewId;
        if (!Array.isArray(preview.fields)) preview.fields = { ...preview.fields, originalId: previewId };
        this.cache.set(previewId, preview);
        return previewId;
    }

    getId(fragmentId) {
        return this.ids.get(fragmentId) || fragmentId;
    }

    has(fragmentId) {
        return this.ids.has(fragmentId);
    }

    owns(previewId) {
        for (const ownedId of this.ids.values()) {
            if (ownedId === previewId) return true;
        }
        return false;
    }

    clear() {
        this.generation += 1;
        for (const previewId of this.ids.values()) this.cache.remove(previewId);
        this.ids.clear();
    }
}
