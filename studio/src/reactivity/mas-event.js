export default class MasEvent {
    #subscribers = [];

    subscribe(fn) {
        if (this.#subscribers.includes(fn)) return;
        this.#subscribers.push(fn);
    }

    unsubscribe(fn) {
        const indexOfFn = this.#subscribers.indexOf(fn);
        if (indexOfFn !== -1) this.#subscribers.splice(indexOfFn, 1);
    }

    emit(options) {
        for (const subscriber of this.#subscribers) {
            subscriber(options);
        }
    }
}
