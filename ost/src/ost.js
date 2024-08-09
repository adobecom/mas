import NetworkService from './service/NetworkService.js';
import Store from './store/Store.js';

export class Ost {

    products = [];
    countries = [];

    constructor(userContext, appContext, analyticsInfo) {
        this.networkService = new NetworkService(
            userContext.accessToken,
            userContext.apiKey,
        );
        this.store = new Store(this.networkService);
        this.userContext = userContext;
        this.appContext = appContext;
        this.analyticsInfo = analyticsInfo;
    }

    async init() {
        await this.initProducts();
        await this.initCountries();
    }

    async initProducts() {
        try {
            this.products = await this.networkService.fetchProducts();
        } catch (error) {
            console.error('Error fetching products', error);
        }
    }

    async initCountries() {
        let countries = [];
        try {
            countries = await this.networkService.fetchCountries();
        } catch (error) {
            console.error('Error fetching countries', error);
        }
        if (this.userContext.country) {
            const countryInList = countries.find(
                (country) => country.id === this.userContext.country,
            );
            if (!countryInList) {
                countries.push({
                    id: this.userContext.country,
                    name: this.userContext.country,
                });
            }
        }
        this.userContext.countries = countries;
    }
}