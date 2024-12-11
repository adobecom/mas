export default class MasSearch {
    static fromHash() {
        const params = Object.fromEntries(
            new URLSearchParams(window.location.hash.slice(1)),
        );
        return new MasSearch(params.path, params.query);
    }

    path;
    query;

    constructor(path, query) {
        this.path = path;
        this.query = query;
    }

    equals(other) {
        if (!other || typeof other !== 'object') return;
        if (this.path !== other.path) return false;
        if (this.query !== other.query) return false;
        return true;
    }
}
