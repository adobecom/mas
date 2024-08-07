export class NetworkService {

    constructor(accessToken, apiKey) {
        this.accessToken = accessToken;
        this.apiKey = apiKey;
    }
    
    loadScript(src) {
        return new Promise((resolve, reject) => {
            let script = document.querySelector(`head > script[src="${src}"]`);
            if (!script) {
                const { head } = document;
                script = document.createElement('script');
                script.setAttribute('src', src);
                script.setAttribute('type', 'text/javascript');
                head.append(script);
            }
    
            const onScriptLoad = () => {
                script.removeEventListener('load', onScriptLoad);
                script.removeEventListener('error', onScriptError);
                resolve(script);
            };
    
            const onScriptError = () => {
                script.removeEventListener('load', onScriptLoad);
                script.removeEventListener('error', onScriptError);
                reject(new Error(`error loading script: ${src}`));
            };
    
            script.addEventListener('load', onScriptLoad);
            script.addEventListener('error', onScriptError);
        });
    }

    async fetchProducts() {
        const PRODUCTS_ENDPOINT = 'https://www.stage.adobe.com/special/tacocat/products.js';
    
        if (window?.tacocat?.products) {
            return Object.entries(window.tacocat.products);
        }
    
        const script = await this.loadScript(PRODUCTS_ENDPOINT);
        if (script) {
            return Object.entries(window.tacocat.products);
        } else {
            throw new Error(`error loading script: ${PRODUCTS_ENDPOINT}`);
        }
    }

    async fetchCountries() {
        const COUNTRIES_ENDPOINT = 'https://countries-stage.adobe.io/v2/countries?api_key=dexter-commerce-offers';
    
        try {
            const response = await fetch(COUNTRIES_ENDPOINT);
            const data = await response.json();
            let result = data.map((obj) => {
                const id = obj['iso2-code'];
                return { id, name: id };
            });
            return result;
        } catch (error) {
            console.error('Error fetching countries', error);
        }
    }
}