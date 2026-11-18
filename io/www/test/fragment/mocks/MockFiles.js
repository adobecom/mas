export class MockFiles {
    constructor() {
        this.store = {};
    }

    async read(path) {
        if (!(path in this.store)) {
            const error = new Error(`file ${path} does not exist`);
            error.code = 'ERROR_FILE_NOT_EXISTS';
            throw error;
        }
        return Buffer.from(this.store[path]);
    }

    async write(path, content) {
        this.store[path] = content;
    }
}
