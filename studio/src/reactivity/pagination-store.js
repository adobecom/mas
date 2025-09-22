import { Pagination } from '../aem/pagination.js';
import { ReactiveStore } from './reactive-store.js';

export class PaginationStore extends ReactiveStore {
    constructor() {
        super(new Pagination());
    }

    get page() {
        return this.value.page;
    }

    get size() {
        return this.value.size;
    }

    selectPage(value) {
        this.value.selectPage(value);
        this.notify();
    }

    nextPage(total) {
        const changed = this.value.nextPage(total);
        if (changed) this.notify();
    }

    previousPage() {
        this.value.previousPage();
        this.notify();
    }

    setSize(value) {
        this.value.setSize(value);
        this.notify();
    }
}
