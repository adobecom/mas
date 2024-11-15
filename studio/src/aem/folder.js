export class Folder {
    #open = false;
    /** @type {Folder[]} */
    folders = [];

    /** @type {Fragment[]} */
    fragments = [];
    constructor(path) {
        this.path = path;
    }

    open({ folderId, name, title }, children) {
        if (this.#open) return;
        this.folderId = folderId;
        this.name = name;
        this.title = title;
        this.#open = open;
        children.forEach((child) => {
            const folder = new Folder(child.path);
            this.folders.push(folder);
        });
    }

    get isOpen() {
        return this.#open;
    }

    clear() {
        this.fragments = [];
    }

    add(...fragments) {
        this.fragments = [...this.fragments, ...fragments];
    }

    remove(fragment) {
        const fragmentIndex = this.fragments.indexOf(fragment);
        if (fragmentIndex === -1) return;
        this.fragments.splice(fragmentIndex, 1);
    }
}
