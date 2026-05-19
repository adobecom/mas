import { offerFilter } from '../utils/offer-filter.js';

export class OfferFilterController {
    host;
    landscape = 'PUBLISHED';
    filteredOffers = [];

    constructor(host) {
        this.host = host;
        host.addController(this);
    }

    hostConnected() {}

    hostDisconnected() {}

    setLandscape(landscape) {
        this.landscape = landscape;
        this.host.requestUpdate();
    }

    filterOffers(offers, aosParams, criteria = null) {
        this.filteredOffers = offers.filter((offer) =>
            offerFilter(criteria, this.landscape, aosParams, offer),
        );
        this.host.requestUpdate();
        return this.filteredOffers;
    }
}
