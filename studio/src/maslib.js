const PARAM_MILO_LIBS = 'milolibs';
const PARAM_AEM_ENV = 'aem.env';
const searchParams = new URLSearchParams(window.location.search);
const getMiloLibs = () => {
    const milolibs = searchParams?.get(PARAM_MILO_LIBS);
    if (!milolibs) return 'https://www.adobe.com';
    if ('local' === milolibs) return 'http://localhost:6456';
    return `https://${milolibs}.hlx.page`;
};
const miloLibs = getMiloLibs();

const injectMasLib = () => {
    const script = document.createElement('script');
    script.setAttribute('src', `${miloLibs}/libs/features/mas/dist/mas.js`);
    script.setAttribute('type', 'module');
    document.head.prepend(script);
};

async function replaceBodyWithUrlContent(url) {
    try {
        const response = await fetch(url);
        if (!response.ok)
            throw new Error(`HTTP error! Status: ${response.status}`);
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const newBody = doc.body;
        document.body.replaceWith(newBody);
    } catch (error) {
        console.error('Error fetching and replacing body content:', error);
    }
}

function processGallery() {
    if (searchParams?.get('theme')?.toLowerCase() === 'dark') {
        document
            .querySelectorAll('sp-theme')
            .forEach((theme) => theme.setAttribute('color', 'dark'));
    }
    document.querySelectorAll('aem-fragment').forEach((fragment) => {
        fragment.addEventListener('aem:load', (e) => {
            const headline = e.target.closest('div').querySelector('h3');
            if (headline) {
                const fragmentId = e.target.data?.id;
                const studioUrl = new URL(window.location);
                studioUrl.pathname = '/studio.html';
                const linkHref = `${studioUrl.toString()}#query=${fragmentId}`;
                headline.innerHTML = `<a href="${linkHref}" target="_blank">${headline.textContent}</a>`;
            }
        });
    });
}

if (window.location.href.includes('/gallery/')) {
    await replaceBodyWithUrlContent(
        `${miloLibs}/libs/features/mas/docs/ccd.html`,
    );
    processGallery();
}

injectMasLib();
