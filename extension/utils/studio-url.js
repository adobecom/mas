const STUDIO_BASE_URL = 'https://mas.adobe.com';

const VARIANT_SURFACES = {
    catalog: 'acom',
    plans: 'acom',
    'plans-v2': 'acom',
    'plans-students': 'acom',
    'plans-education': 'acom',
    'ccd-slice': 'ccd',
    'ccd-suggested': 'ccd',
    fries: 'commerce',
    'ah-try-buy-widget': 'ahome',
    'ah-promoted-plans': 'ahome',
    'full-pricing-express': 'acom',
    'simplified-pricing-express': 'acom',
};

function getValidators() {
    if (typeof self !== 'undefined' && self.MASValidators) return self.MASValidators;
    if (typeof module !== 'undefined' && module.exports) {
        try {
            return require('./validators.js');
        } catch (err) {
            return null;
        }
    }
    return null;
}

function buildStudioUrl(message) {
    const { view, fragmentId, variant, locale, surface } = message;
    const validators = getValidators();
    if (!validators) return null;

    if (view === 'content') {
        if (!validators.isValidUUID(fragmentId)) return null;
        if (locale && !validators.isValidLocale(locale)) return null;
        const sur = (variant && VARIANT_SURFACES[variant]) || 'acom';
        const params = new URLSearchParams({
            page: 'content',
            query: fragmentId,
            locale: locale || 'en_US',
            path: sur,
        });
        return `${STUDIO_BASE_URL}/studio.html#${params.toString()}`;
    }

    if (view === 'fragment-editor') {
        if (locale && !validators.isValidLocale(locale)) return null;
        if (surface && !/^[a-z0-9/_-]+$/i.test(surface)) return null;
        if (fragmentId && !validators.isValidUUID(fragmentId)) return null;
        const params = new URLSearchParams({ page: 'fragment-editor' });
        if (locale) params.set('locale', locale);
        if (surface) params.set('path', surface);
        if (fragmentId) params.set('fragmentId', fragmentId);
        return `${STUDIO_BASE_URL}/studio.html#${params.toString()}`;
    }

    return null;
}

if (typeof self !== 'undefined') {
    self.MASStudioUrl = { buildStudioUrl, VARIANT_SURFACES };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildStudioUrl, VARIANT_SURFACES, STUDIO_BASE_URL };
}
