import { Pagination } from '../aem/pagination.js';
import { ReactiveStore } from './reactive-store.js';

export class PaginationStore extends ReactiveStore {
    constructor() {
        super(new Pagination());
    }

    selectPage(value) {
        this.value.selectPage(value);
        this.notify();
    }

    navigateForward() {
        this.value.navigateForward();
        this.notify();
    }

    navigateBackward() {
        this.value.navigateBackward();
        this.notify();
    }

    setSize(value) {
        this.value.setSize(value);
        this.notify();
    }
}
