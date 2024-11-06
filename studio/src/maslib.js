const getMiloLibs = () => {
    const milolibs = new URLSearchParams(window.location.search)?.get(
        'milolibs',
    );
    if (!milolibs) return 'https://www.adobe.com';
    if ('local' === milolibs) return 'http://localhost:6456';
    return `https://${milolibs}.hlx.page`;
};

const injectMasLib = () => {
    const script = document.createElement('script');
    script.setAttribute('src', `${getMiloLibs()}/libs/deps/mas/mas.js`);
    script.setAttribute('type', 'module');
    document.head.prepend(script);
};

injectMasLib();
