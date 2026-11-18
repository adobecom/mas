import { init } from './common.js';
import { getSurfaceLocales } from '../../io/www/src/fragment/locales.js';
import { PATH_TOKENS } from '../../io/www/src/fragment/utils/paths.js';
import {
    CARD_MODEL_ID,
    COLLECTION_MODEL_ID,
} from '../src/constants.js';

export function getPreviewSettings(fragment) {
    const surface = fragment.path?.match(PATH_TOKENS)?.groups?.surface;
    if (!surface) {
        throw new RangeError('Fragment path is missing or invalid.');
    }
    return {
        spectrum:
            surface === 'ccd' || fragment.fields.variant?.startsWith('ccd-')
                ? 'css'
                : 'swc',
        locales: getSurfaceLocales(surface),
    };
}

export function createPreview(params) {
    const id = params.get('fragment-id') ?? '';
    const type = params.get('content-type') ?? 'merch-card';
    if (!/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) {
        throw new RangeError('Enter a valid fragment ID.');
    }
    if (!['merch-card', 'merch-card-collection'].includes(type)) {
        throw new RangeError('Unsupported content type.');
    }
    const preview = document.createElement(type);
    const fragment = document.createElement('aem-fragment');
    fragment.setAttribute('fragment', id);
    for (const name of ['mask', 'pzn']) {
        if (params.get(name)) fragment.setAttribute(name, params.get(name));
    }
    preview.append(fragment);
    return preview;
}

export function populatePicker(picker, values, selected) {
    picker.replaceChildren();
    for (const value of [...new Set(values)].sort()) {
        const item = document.createElement('sp-menu-item');
        item.value = value || 'default';
        item.textContent = value || 'Default';
        picker.append(item);
    }
    picker.value = selected;
}

export function getPreviewUrl(controls) {
    const url = new URL(location.href);
    url.searchParams.delete('surface');
    for (const control of controls) {
        if (
            control.value &&
            !(control.id === 'country' && control.value === 'default')
        )
            url.searchParams.set(control.id, control.value.trim());
        else url.searchParams.delete(control.id);
    }
    return url;
}

export async function renderPreview(preview, container, status) {
    status.textContent = 'Loading preview...';
    let hasError = false;
    const showError = () => {
        hasError = true;
        status.textContent =
            'Cannot load fragment. Check the ID, content type and locale. Unpublished preview requires the corporate network.';
    };
    const fragment = preview.querySelector('aem-fragment');
    const invalidType = new Promise((resolve) => {
        fragment.addEventListener(
            'aem:load',
            (event) => {
                try {
                    const modelId = {
                        'merch-card': CARD_MODEL_ID,
                        'merch-card-collection': COLLECTION_MODEL_ID,
                    }[preview.localName];
                    if (fragment.rawData.model.id !== modelId) {
                        throw new RangeError(
                            'Selected content type does not match this fragment.',
                        );
                    }
                    preview.setAttribute(
                        'spectrum',
                        getPreviewSettings(fragment.rawData).spectrum,
                    );
                } catch (error) {
                    if (!(error instanceof RangeError)) throw error;
                    event.stopImmediatePropagation();
                    hasError = true;
                    status.textContent = error.message;
                    preview.remove();
                    resolve(false);
                }
            },
            { capture: true, once: true },
        );
    });
    container.addEventListener('aem:error', showError);
    container.addEventListener('mas:error', showError);
    container.addEventListener('mas:failed', showError);
    container.append(preview);
    const ready = await Promise.race([preview.checkReady(), invalidType]);
    if (hasError) return;
    if (!ready || preview.failed) showError();
    else if (status.textContent === 'Loading preview...')
        status.textContent = '';
}

export function setupCopyUrl(button, status) {
    let timeout;
    button.addEventListener('click', async () => {
        await navigator.clipboard.writeText(location.href);
        clearTimeout(timeout);
        status.textContent = 'URL copied.';
        timeout = setTimeout(() => {
            if (status.textContent === 'URL copied.')
                status.textContent = '';
        }, 3000);
    });
}

export async function initPreview() {
    await Promise.all(
        ['sp-picker', 'sp-textfield', 'sp-button', 'sp-theme'].map((tag) =>
            customElements.whenDefined(tag),
        ),
    );
    const params = new URLSearchParams(location.search);
    const controls = [...document.querySelectorAll('[data-param]')];
    const locale = document.getElementById('locale');
    const country = document.getElementById('country');
    const status = document.getElementById('status');
    const container = document.getElementById('preview');

    for (const control of controls) {
        const value = params.get(control.id);
        if (value !== null) control.value = value;
    }

    const updateLocales = (locales) => {
        populatePicker(
            locale,
            locales.map(({ lang, country }) => `${lang}_${country}`),
            locale.value,
        );
        populatePicker(
            country,
            ['', ...locales.map(({ country }) => country)],
            country.value || 'default',
        );
    };
    updateLocales(['ccd', 'adobe-home', 'commerce'].flatMap(getSurfaceLocales));

    document.getElementById('show-preview').addEventListener('click', () => {
        location.assign(getPreviewUrl(controls).href);
    });
    setupCopyUrl(document.getElementById('copy-url'), status);

    const theme = params.get('theme') ?? 'light';
    if (!['light', 'dark', 'darkest'].includes(theme)) {
        status.textContent = 'Unsupported theme.';
        return;
    }
    await init();
    document
        .querySelector('sp-theme')
        .setAttribute('color', theme === 'darkest' ? 'dark' : theme);
    if (!params.get('fragment-id')) return;

    let preview;
    try {
        preview = createPreview(params);
    } catch (error) {
        if (!(error instanceof RangeError)) throw error;
        status.textContent = error.message;
        return;
    }
    if (preview.localName === 'merch-card-collection') {
        await import('../dist/merch-card-collection.js');
    }
    const fragment = preview.querySelector('aem-fragment');
    fragment.addEventListener(
        'aem:load',
        () => updateLocales(getPreviewSettings(fragment.rawData).locales),
        { once: true },
    );
    await renderPreview(preview, container, status);
}
