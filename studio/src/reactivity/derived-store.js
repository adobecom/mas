import { ReactiveStore } from './reactive-store.js';

export class DerivedStore extends ReactiveStore {
    transformer;
    /** @type {ReactiveStore} */
    fromStore;

    /**
     *
     * @param {ReactiveStore} fromStore
     * @param {(value: any) => any} transformer
     */
    constructor(fromStore, transformer) {
        const initialValue = transformer(fromStore.value);
        super(initialValue);
        this.transformer = transformer;
        this.fromStore = fromStore;
        this.fromChange = this.fromChange.bind(this);
        fromStore.subscribe(this.fromChange);
    }

    fromChange(value) {
        const newValue = this.transformer(value);
        this.set(newValue);
    }
}
