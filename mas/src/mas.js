const { origin, searchParams } = new URL(import.meta.url);

const locale = searchParams.get('locale') ?? 'US_en';
const lang = searchParams.get('lang') ?? 'en';
const isStage = searchParams.get('env') === 'stage';
const features = searchParams.get('features');

const envName = isStage ? 'stage' : 'prod';
const commerceEnv = isStage ? 'STAGE' : 'PROD';

function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve();
        script.onerror = () =>
            reject(new Error(`Failed to load script: ${url}`));
        document.head.appendChild(script);
    });
}

const config = () => ({
    env: { name: envName },
    commerce: { 'commerce.env': commerceEnv },
    locale: { prefix: locale },
});

(async () => {
    try {
        await loadScript(
            'https://main--milo--adobecom.hlx.page/libs/deps/mas/commerce.js',
        );
        if (typeof init === 'function') {
            init(config);
        } else {
            console.error('init function is not available.');
        }
    } catch (error) {
        console.error(error);
    }
})();

if (features.includes('merch-card')) {
    import(
        `https://main--milo--adobecom.hlx.page/libs/deps/mas/merch-card-all.js`
    );
}
