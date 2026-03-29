import { TEMPLATE_PREVIEWS, ODIN_PREVIEW_ORIGIN } from '../constants.js';
import { getVariantTreeData } from '../editors/variant-picker.js';

export async function precacheTemplatePreviews(surface) {
    const AemFragmentElement = customElements.get('aem-fragment');
    if (!AemFragmentElement?.cache) return;

    const variants = getVariantTreeData(surface);
    const ids = variants.map((v) => TEMPLATE_PREVIEWS[v.name]).filter(Boolean);
    const uncached = ids.filter((id) => !AemFragmentElement.cache.has(id));
    if (uncached.length === 0) return;

    const baseUrl = document.querySelector('mas-repository')?.getAttribute('base-url') || ODIN_PREVIEW_ORIGIN;
    const token = sessionStorage.getItem('masAccessToken') || window.adobeIMS?.getAccessToken()?.token;
    if (!token) return;

    await Promise.allSettled(
        uncached.map(async (id) => {
            try {
                const resp = await fetch(`${baseUrl}/adobe/sites/cf/fragments/${id}?references=all-hydrated`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!resp.ok) return;
                const fragment = await resp.json();
                AemFragmentElement.cache.add(fragment);
            } catch (e) {
                console.warn(`Failed to cache template ${id}:`, e.message);
            }
        }),
    );
}
