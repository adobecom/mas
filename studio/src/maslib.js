const PARAM_MILO_LIBS = 'milolibs';
const searchParams = new URLSearchParams(window.location.search);
const getMiloLibs = () => {
    const milolibs = searchParams?.get(PARAM_MILO_LIBS);
    if (!milolibs) return 'https://www.adobe.com';
    if ('local' === milolibs) return 'http://localhost:6456';
    return `https://${milolibs}.aem.page`;
};
const miloLibs = getMiloLibs();

const injectMasLib = () => {
    const script = document.createElement('script');
    script.setAttribute('src', `${miloLibs}/libs/features/mas/dist/mas.js`);
    script.setAttribute('type', 'module');
    document.head.prepend(script);
};

injectMasLib();
