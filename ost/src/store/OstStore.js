import { makeAutoObservable, observable } from 'mobx';

export class OstStore {

    offers = observable.array();
    selectedOffer = observable.object();
    defaults = observable.object();
    variant = { type: String, attribute: 'variant', reflect: true };
    planType = { type: String, attribute: 'plan-type', reflect: true };
    stock = { type: Boolean, reflect: true };
    customerSegment = observable.String();

    constructor(networkService) {
        // use makeAutoObservable(this) instead of makeObservable();
        makeAutoObservable(this);
        this.defaults = {};
        this.networkService = networkService;
    }

}