# upt-link {#upt-link}

## Introduction {#introduction}

This custom element renders a universal promo terms link.
It extends `HTMLAnchorElement` and will automatically generate the correct `href` based on the provided attributes.

The link will point to the promo terms page with offer information resolved from WCS.

If a custom `href` is provided (not `#` or empty), the component will preserve it instead of auto-generating the URL. This allows you to override the default promo terms URL when needed. Custom href can be authored in MAS Studio.

See [MAS](mas.html#terminology) to learn more.

### Example (auto-generated href)

```html {.demo}
<a
    href="#"
    is="upt-link"
    data-wcs-osi="A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M"
    data-promotion-code="PROMO123"
    >See terms</a
>
```

### Example (custom href override)

```html {.demo}
<a
    href="https://www.adobe.com/custom-promo-terms.html"
    is="upt-link"
    data-wcs-osi="A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M"
    >See terms</a
>
```

## Attributes {#attributes}

| Attribute             | Description                                                                                                                                                     | Default Value | Required | Provider                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------- | ----------------------- |
| `href`                | The link URL. Leave empty or set to `#` to auto-generate the promo terms URL, or provide a custom URL to override the auto-generated link.                     | `#`           | `true`   | mas.js or consumer code |
| `data-wcs-osi`        | Offer Selector ID. Can be only one.                                                                                                                             |               | `true`   | mas.js or consumer code |
| `data-promotion-code` | Flex promotion code, if applicable. Only used when href is auto-generated.                                                                                      |               | `false`  | mas.js or consumer code |
| `data-ims-country`    | The IMS country code of the user if signed in, overrides the locale country in the generated URL. Only used when href is auto-generated.                       |               | `false`  | mas.js or consumer code |

## Properties {#properties}

| Property    | Description                                  |
| ----------- | -------------------------------------------- |
| `isUptLink` | On UPT link elements, it will return `true`. |

### Example

```html {.demo}
<a
    id="upt1"
    href="#"
    is="upt-link"
    data-wcs-osi="A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M"
    >See terms</a
>
```

## Events {#events}

This element dispatches `mas:pending`, `mas:resolved`, and `mas:failed` events.
It will log an error to the console if `data-wcs-osi` is missing or if the offer cannot be resolved.
