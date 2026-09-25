# Masks

A **mask** is a card content fragment that is overlaid on top of another card fragment at pipeline time. Only the fields present in the mask override the base fragment; all other fields are left untouched.

Typical use cases: seasonal promotions, regional copy overrides, A/B copy variants — all without duplicating the base fragment.

## How it works

1. Add a `mask` attribute to `<aem-fragment>` with the mask's node name.
2. The pipeline fetches the mask card fragment from `<surface>/<locale>/masks/<name>`, trying the regional locale first and falling back to the surface default locale.
3. The mask's fields are deep-merged onto the base card fragment before WCS pricing and token replacement run.
4. The `mask` value is part of the response cache key (`m_<mask>`), so masked and unmasked responses are cached independently.

## Usage

```html
<aem-fragment
    fragment="d8008cac-010f-4607-bacc-a7a327da1312"
    mask="holiday-promo"
></aem-fragment>
```

Combine with `pzn` when both a mask overlay and a personalization variant are needed:

```html
<aem-fragment
    fragment="d8008cac-010f-4607-bacc-a7a327da1312"
    mask="holiday-promo"
    pzn="returning-customer"
></aem-fragment>
```

## Attributes

| Name   | Description                                                                                                       | Required |
| ------ | ----------------------------------------------------------------------------------------------------------------- | -------- |
| `mask` | Node name of the mask fragment to apply. Resolved under `<surface>/<locale>/masks/<name>` on the active surface. | `false`  |
| `pzn`  | Personalization identifier forwarded to the pipeline as the `pzn` query parameter.                               | `false`  |

Both attributes are covered in full on the [`aem-fragment`](./aem-fragment.md) reference page.

## Variables

A mask fragment may declare a `variables` field — an array of `key:value` strings. The pipeline injects these as replacement tokens, making them available to the `replace` transformer. This lets a single mask drive both field overrides and token substitutions without changing the base fragment.

Example `variables` field values:

```
promo_label:Save 40%
badge_color:spectrum-yellow-300-plans
```

## Authoring masks

Masks are authored in M@S Studio under **Advanced Tools → Masks**. The editor provides the same plans-card field sections as the main card editor, plus a live blurred preview that unblurs each part as content is added.

- **Name** — the node name used in the `mask` attribute (immutable after creation).
- **Title** — display name shown in the masks list.
- **Placeholders** — the `variables` field; each entry is a `key:value` string injected into the replacement dictionary.

See the [studio masks README](../../studio/src/masks/README.md) for the full authoring and AEM folder reference.

## Example
<div class="mask-parent">
    <style>
        .mask-parent {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
        }
    </style>
    <div class="mask-item">
        <merch-card><aem-fragment fragment="5a5ca143-a417-4087-b466-5b72ac68a830"></aem-fragment></merch-card>
        <a class="plans-link" target="_blank" href="https://main--mas--adobecom.aem.live/studio.html?#path=nala&query=5a5ca143-a417-4087-b466-5b72ac68a830"> Open in Studio</a>
    </div>
    <div class="mask-item">
        <merch-card><aem-fragment fragment="9406f1ae-7bee-48c3-9892-49af6816033e"></aem-fragment></merch-card>
        <a class="plans-link" target="_blank" href="https://main--mas--adobecom.aem.live/studio.html?#path=nala&query=1736f2c9-0931-401b-b3c0-fe87ff72ad38"> Open in Studio</a>
    </div>
    <div class="mask-item">
        <merch-card><aem-fragment fragment="6d128c6b-4f42-4052-98ca-4dddf8d88785"></aem-fragment></merch-card>
        <a class="plans-link" target="_blank" href="https://main--mas--adobecom.aem.live/studio.html?#path=nala&query=6d128c6b-4f42-4052-98ca-4dddf8d88785"> Open in Studio</a>
    </div>
    <div>
        <p> you can click on following buttons to apply a <a href="https://mas.adobe.com/studio.html#maskName=nala-mask&page=masks-editor&path=nala">mask</a> and remove it
        </p>
        <p>
            <button id="btnMask">Mask</button>
            <button id="btnUnMask">Remove Mask</button>
        </p>
    </div>
</div>
<script type="module">
    document.getElementById('btnMask').addEventListener('click', () => {
        document.querySelectorAll('aem-fragment').forEach(el => {
            el.setAttribute('mask', 'nala-mask');
            document.querySelector('mas-commerce-service').refreshFragments();
        });
    });
    document.getElementById('btnUnMask').addEventListener('click', () => {
        document.querySelectorAll('aem-fragment').forEach(el => {
            el.removeAttribute('mask');
            document.querySelector('mas-commerce-service').refreshFragments();
        });
    });
</script>
