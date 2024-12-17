export default class MasSearch {
    static fromHash() {
        const params = Object.fromEntries(
            new URLSearchParams(window.location.hash.slice(1)),
        );
        return new MasSearch(params.path, params.query);
    }

    path;
    query;

    /**
     * @param {string} path
     * @param {string} query
     */
    constructor(path, query) {
        this.path = path;
        this.query = query;
    }

    /**
     * @param {MasSearch} other
     * @returns {boolean}
     */
    equals(other) {
        if (!other || typeof other !== 'object') return;
        if (this.path !== other.path) return false;
        if (this.query !== other.query) return false;
        return true;
    }
}
