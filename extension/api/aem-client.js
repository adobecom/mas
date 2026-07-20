class AEMClient {
    constructor() {
        this.masIOUrl = 'https://www.adobe.com/mas/io';
        this.wcsApiKey = 'wcms-commerce-ims-ro-user-milo-extension';
        this.defaultLocale = 'en_US';
    }

    async fetchFragmentData(fragmentId, locale = this.defaultLocale, country = null) {
        if (!/^[a-z]{2}_[A-Z]{2}$/.test(locale)) {
            throw new Error('Invalid locale');
        }
        if (country !== null && !/^[A-Z]{2}$/.test(country)) {
            throw new Error('Invalid country');
        }
        let url =
            `${this.masIOUrl}/fragment` +
            `?id=${encodeURIComponent(fragmentId)}` +
            `&api_key=${encodeURIComponent(this.wcsApiKey)}` +
            `&locale=${encodeURIComponent(locale)}`;
        if (country && !locale.endsWith(`_${country}`)) {
            url += `&country=${encodeURIComponent(country)}`;
        }

        console.log('Fetching fragment:', { fragmentId, locale, country, url });

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            });

            console.log('Fragment API response:', {
                status: response.status,
                statusText: response.statusText,
                contentType: response.headers.get('content-type'),
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Fragment API rejected the request. It may not be published.');
                }
                if (response.status === 404) {
                    throw new Error('Fragment not found.');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const text = await response.text();
            if (!text || text.trim() === '') {
                console.error('Empty response from server');
                throw new Error('Empty response from server');
            }

            let data;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.error('JSON Parse Error - Response text:', text.substring(0, 500));
                throw new Error('Invalid JSON response from server');
            }

            return data;
        } catch (error) {
            console.error('Error fetching fragment data:', error);
            throw error;
        }
    }
}

if (typeof self !== 'undefined') {
    self.AEMClient = AEMClient;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AEMClient };
}
