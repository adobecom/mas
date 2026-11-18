import { init } from './common.js';
import { getSurfaceLocales } from '../../io/www/src/fragment/locales.js';
import { PATH_TOKENS } from '../../io/www/src/fragment/utils/paths.js';

export function getPreviewSettings(fragment) {
    const { surface } = fragment.path.match(PATH_TOKENS).groups;
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

function populatePicker(picker, values, selected) {
    picker.replaceChildren();
    for (const value of [...new Set(values)].sort()) {
        const item = document.createElement('sp-menu-item');
        item.value = value;
        item.textContent = value || 'Default';
        picker.append(item);
    }
    picker.value = selected;
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
                const modelId = {
                    'merch-card':
                        'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ',
                    'merch-card-collection':
                        'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24',
                }[preview.localName];
                if (fragment.rawData.model.id === modelId) {
                    preview.setAttribute(
                        'spectrum',
                        getPreviewSettings(fragment.rawData).spectrum,
                    );
                    return;
                }
                event.stopImmediatePropagation();
                hasError = true;
                status.textContent =
                    'Selected content type does not match this fragment.';
                preview.remove();
                resolve(false);
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
            country.value,
        );
    };
    updateLocales(['ccd', 'adobe-home', 'commerce'].flatMap(getSurfaceLocales));

    document.getElementById('show-preview').addEventListener('click', () => {
        const url = new URL(location.href);
        url.searchParams.delete('surface');
        for (const control of controls) {
            if (control.value)
                url.searchParams.set(control.id, control.value.trim());
            else url.searchParams.delete(control.id);
        }
        location.assign(url.href);
    });
    document.getElementById('copy-url').addEventListener('click', async () => {
        await navigator.clipboard.writeText(location.href);
        status.textContent = 'URL copied.';
    });

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
