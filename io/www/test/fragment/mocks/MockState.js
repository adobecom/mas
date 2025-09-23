export class MockState {
    constructor() {
        this.store = {};
    }

    async get(key) {
        return new Promise((resolve) => {
            resolve({
                value: this.store[key],
            });
        });
    }

    async put(key, value) {
        return new Promise((resolve) => {
            this.store[key] = value;
            resolve();
        });
    }
}
