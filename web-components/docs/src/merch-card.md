<script type="module" src="../../spectrum-web-components/dist/button.js"></script>

# merch-card custom element

## Introduction

This custom element implements all the merch-card variants provided in acom and ccd figma designs.

A `merch-card` can be rendered using either static html markup or `aem-fragment` custom element to retrieve a card from Odin/AEM.

The CTAs styles depend on Spectrum CSS that must be provided by the consumer.

Designs:

**ACOM**: https://www.figma.com/design/tiEUQLJ1hVlosqwzAATVXZ/Cards-(Merch)?node-id=1086-17994&t=LeMR0vbaBoEKaKln-1

**CCD**: https://www.figma.com/proto/7tUtNgFelfMjgPoJ5QcE1k/Merch%40Scale-Frameworks?node-id=2077-63597&t=cWfdzWlga79eyjyI-1

**Adobe Home**: https://www.figma.com/design/7tUtNgFelfMjgPoJ5QcE1k/Merch%40Scale-Frameworks?node-id=2081-22654&m=dev

**CCD Gallery**: [/libs/features/mas/docs/ccd.html](/libs/features/mas/docs/ccd.html)
CCD Gallery provides a comprehensive list of all supported card variants in CCD.

**Adobe Home Gallery**: [/libs/features/mas/docs/adobe-home.html](/libs/features/mas/docs/adobe-home.html)
Adobe Home Gallery provides a comprehensive list of all supported card variants in Adobe Home.

## Examples

```html {.demo .light}
<merch-card id="card1">
    <aem-fragment
        id="fragment1"
        title="CCD Slice Creative Cloud Photography"
        fragment="830f76be-0e83-4faf-9051-3dbb1a1dff04"
    ></aem-fragment>
</merch-card>

<script type="module">
    const target = document.getElementById('log1');

    const fragment1 = document.getElementById('fragment1');
    fragment1.addEventListener('aem:load', (e) => {
        log(
            target,
            'aem-fragment is loaded: ',
            JSON.stringify(e.target.data, null, '\t'),
        );
    });

    const card1 = document.getElementById('card1');
    card1.addEventListener('mas:ready', (e) => {
        log(target, 'merch-card is ready: ', e.target.variant);
    });

    card1.addEventListener(
        'click',
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.target.isCheckoutButton) {
                log(target, 'merch-card checkout-button click: ', e.target);
            } else if (e.target.isInlinePrice) {
                log(target, 'merch-card price click: ', e.target.innerText);
            } else {
                log(target, 'merch-card click: ', e.target);
            }
        },
        { capture: true },
    );
</script>
```

#### Logs

```html {#log1}

```

### With static content (dynamic pricing)

```html {.demo .light}
<merch-card id="static" variant="plans" badge-color="#EDCC2D" badge-background-color="#000000"" badge-text=" Best value">
  <merch-icon slot="icons" size="l" src="https://www.adobe.com/content/dam/shared/images/product-icons/svg/creative-cloud.svg" alt="Creative Cloud All Apps"></merch-icon>
  <h4 slot="heading-xs">Creative Cloud All Apps</h4>
  <h3 slot="heading-m">
      <span is="inline-price" data-display-per-unit="false" data-display-recurrence="true"
          data-display-tax="false" data-wcs-osi="r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8"></span>
  </h3>
  <p slot="body-xxs">Desktop</p>
  <div slot="body-xs">
      <p>Get 20+ Creative Cloud apps including Photoshop, Illustrator, Adobe Express, Premiere Pro, and
          Acrobat Pro. (Substance 3D apps are not included.)</p>
      <p><a href="https://adobe.com">See plans & pricing details</a></p>
  </div>
  <div slot="footer">
      <a is="checkout-link" href="#" class="con-button blue active" data-wcs-osi="r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8">Save now</a>
  </div>
</merch-card>
```

### Attributes

| Name        | Description                                                                                                                                                                                           | Default Value | Required | Provider |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------- | -------- |
| `variant`   | Variant in terms design. Not required when used with an `aem-fragment`                                                                                                                                |               | `false`  | mas.js   |
| `consonant` | Uses Consonant for the footer CTA styles during hydration from an aem fragment                                                                                                                        | `false`       | `false`  | mas.js   |
| `spectrum`  | Uses Spectrum for the footer CTA styles during hydration from an aem fragment. (options: `css`, `swc`)                                                                                                | `css`         | `false`  | mas.js   |
| `size`      | card width; a card can span over 2 columns or entire row on a css grid `wide\|super-wide`                                                                                                             |               | `false`  | mas.js   |
| `daa-lh`    | Analytics identifier of a card. Value is coming from the 'PRODUCT_CODE' tag set on the card (for now manual authoring required, later will be tagged automatically). Sample values: 'ccsn' or 'phlt'. |               | `false`  | mas.js   |

#### Active variants:

- `catalog`
- `image`
- `inline-heading`
- `mini-compare-chart`
- `plans`
- `product`
- `segment`
- `special-offers`
- `ccd-slice`
- `ccd-suggested`
- `ah-try-buy-widget`

### Properties

| Name             | Description                                                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `updateComplete` | a promise that resolves when the `merch-card` finishes to execute render method. Doesn't mean that card is ready, for that use 'mas:ready' or 'mas:error' event. |

### Events

We recommend to listen to events on the container, so that listener is attached before the merch card is appended to DOM.
The reason is that some merch cards are resolved very quickly and event could dispatch before event listener is attached by consumer code.

| Name        | Description                                                                  |
| ----------- | ---------------------------------------------------------------------------- |
| `mas:ready` | fires when all the prices & checkout links are resolved & renderered         |
| `mas:error` | fires when at least a price or checkout link cannot be resolved after render |

### `mas:ready` & `mas:error`

```html {.demo .light}
<style>
    .event-demo {
        outline: 2px solid;
    }
    merch-card.ready {
        outline-color: lime;
    }

    merch-card.error {
        outline-color: red;
        display: block;
        width: 300px;
        height: 200px;
        margin-top: 16px;
    }
</style>

<button id="btnRefreshFragments">Refresh Fragments</button>
<script type="module">
    {
        const logReady = document.getElementById('log-mas-ready');
        const message = (e, type) => {
            const id =
                e.target.getAttribute('id') ||
                e.target.getAttribute('fragment') ||
                e.target.getAttribute('data-wcs-osi');
            const detail = e.detail
                ? `: ${JSON.stringify(e.detail, null, 2)}`
                : '';
            return `'${type}' on ${e.target.nodeName} #${id}${detail}`;
        };
        // WCS request failed
        document.addEventListener('mas:failed', (event) => {
            log(
                document.getElementById('log-mas-failed'),
                message(event, 'mas:failed'),
            );
        });
        // Freyja request failed
        document.addEventListener('aem:error', (event) =>
            log(
                document.getElementById('log-aem-error'),
                message(event, 'aem:error'),
            ),
        );
        // Error in merch-card (WCS or Frejya request, or any other issue)
        document.addEventListener('mas:error', (event) => {
            event.target.classList.remove('ready');
            event.target.classList.add('error');
            log(
                document.getElementById('log-mas-error'),
                message(event, 'mas:error'),
            );
        });
        document.addEventListener('mas:ready', (event) => {
            event.target.classList.add('ready');
            event.target.classList.remove('error');
            log(logReady, message(event, 'mas:ready'));
        });

        // refresh btn
        document
            .getElementById('btnRefreshFragments')
            .addEventListener('click', () => {
                document
                    .querySelector('mas-commerce-service')
                    .refreshFragments();
            });
    }
</script>

<p>Valid card</p>
<merch-card class="event-demo" id="valid-card">
    <aem-fragment
        fragment="d8008cac-010f-4607-bacc-a7a327da1312"
    ></aem-fragment>
</merch-card>

<p>Checkout link OSI is wrong</p>
<merch-card class="event-demo" id="wrongosi">
    <aem-fragment
        fragment="3c29614a-a024-458f-8bd6-ee910898f684"
    ></aem-fragment>
</merch-card>

<p>Fragment id is wrong</p>
<merch-card class="event-demo" id="invalid-fragment-id">
    <aem-fragment
        fragment="wrong-fragment-id"
        id="invalid-fragment-id"
    ></aem-fragment>
</merch-card>
```

### mas:failed log

```html {#log-mas-failed}

```

### aem:error log

```html {#log-aem-error}

```

### mas:error log

```html {#log-mas-error}

```

### mas:ready log

```html {#log-mas-ready}

```

## Error Handling

The `merch-card` component can raise several types of errors during its lifecycle. These errors are dispatched as events that can be caught and handled by the consumer.

### Potential Errors

| Error Type                                                                         | Description                                                            | Event       | Cause                                               |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------- | --------------------------------------------------- |
| "Missing fragment id"                                                              | Occurs when an `aem-fragment` is used without specifying a fragment ID | `aem:error` | The `fragment` attribute is missing or empty        |
| "Failed to fetch fragment"                                                         | Occurs when there's a network error fetching the fragment              | `aem:error` | Network issues, CORS problems                       |
| "Unexpected fragment response"                                                     | Occurs when the server returns a non-OK response                       | `aem:error` | Server errors, invalid fragment ID                  |
| "AEM fragment cannot be loaded"                                                    | Occurs when the merch-card detects that the fragment failed to load    | `mas:error` | Propagated from `aem:error` events                  |
| `Contains offers that were not resolved within ${MERCH_CARD_LOAD_TIMEOUT} timeout` | Occurs when offers are not resolved within the timeout period          | `mas:error` | Offers take too long to resolve                     |
| "Contains unresolved offers"                                                       | Occurs when offers cannot be resolved                                  | `mas:error` | Pricing or checkout information cannot be retrieved |

### Error Event Flow

1. When an error occurs in an `aem-fragment`, it dispatches an `aem:error` event with detailed information in the `detail` property that includes:
    - `message`: The error message string
    - `context`: Additional context about the error (may include response details, timing information)
2. The `merch-card` listens for this event and calls its internal `#fail` method, which:
    - Logs the error with additional context
    - Sets the `failed` property to `true`
    - Propagates it as a `mas:error` event with the error message in the `detail` property
3. For WCS (Web Commerce Service) errors, a `mas:failed` event is dispatched
4. The `merch-card` component will mark itself as failed and stop trying to resolve offers

### Handling Errors

To properly handle errors, add event listeners directly on the merch-card element:

```javascript
// Get reference to the merch-card element
const merchCard = document.getElementById('my-merch-card');

// Listen for merch-card errors
merchCard.addEventListener('mas:error', (event) => {
    // event.detail contains the error message string
    console.error('Merch card error:', event.detail);
    // Add error styling
    merchCard.classList.add('error');
});

// Listen for merch-card ready event
merchCard.addEventListener('mas:ready', (event) => {
    console.log('Merch card is ready:', event.target.variant);
    // Remove error styling if it was previously applied
    merchCard.classList.remove('error');
});

// Get reference to the aem-fragment inside the merch-card
const aemFragment = merchCard.querySelector('aem-fragment');

// Listen for AEM fragment errors
aemFragment.addEventListener('aem:error', (event) => {
    // event.detail contains { message, context }
    console.error('AEM fragment error message:', event.detail.message);
    console.error('AEM fragment error context:', event.detail.context);
});
```

### spectrum = 'swc'

The `spectrum` attribute is used to specify the Spectrum technology to use for rendering the CTAs.
With `swc` the checkout buttons are rendered as Spectrum SWC sp-button and the click event is directed to actual checkout-button web component that is kept off the DOM.
However, it can be accessed via `e.target.source` property.

```html {.demo .light}
<merch-card id="cardSwc" spectrum="swc">
    <aem-fragment
        title="CCD Slice Creative Cloud Photography"
        fragment="830f76be-0e83-4faf-9051-3dbb1a1dff04"
    ></aem-fragment>
</merch-card>

<script type="module">
    const target = document.getElementById('log3');

    const cardSwc = document.getElementById('cardSwc');
    cardSwc.addEventListener(
        'click',
        (e) => {
            e.preventDefault();
            if (e.target.source?.isCheckoutButton) {
                log(
                    target,
                    'merch-card checkout-button click: ',
                    '\n\t',
                    e.target.dataset.navigationUrl,
                    '\n\t',
                    e.target.outerHTML,
                    '\n\t',
                    e.target.source.outerHTML,
                    '\n',
                );
            } else if (e.target.isInlinePrice) {
                log(target, 'merch-card price click: ', e.target.innerText);
            } else {
                log(target, 'merch-card click: ', e.target);
            }
        },
        { capture: true },
    );
</script>
```

```html {#log3}

```

## aem-fragment custom element

`aem-fragment` custom element is used to load a fragment from Odin/Frejya.
It supports retrying to load the fragment in case of errors two times with 500ms of delay between attempts.
It also falls back to last successfully loaded fragment for the same fragment id.

### Attributes

| Name       | Description                                                                              | Default Value | Required | Provider      |
| ---------- | ---------------------------------------------------------------------------------------- | ------------- | -------- | ------------- |
| `fragment` | Fragment id. The copy/use feature in M@S Studio will copy the id/markup to the clipboard |               | `true`   | consumer code |
| `title`    | Informative title                                                                        |               | `false`  | consumer code |
| `ims`      | attempts to use an IMS access token via `window.adobeid.authorize()` to fetch a fragment |               | `false`  | mas.js        |

### Properties

| Name             | Description                                                                        |
| ---------------- | ---------------------------------------------------------------------------------- |
| `data`           | Current fragment RAW data that is used to render the merch-card                    |
| `updateComplete` | Promise that resolves when the fragment is retrieved and `aem:load` event is fired |

### Methods

| Name        | Description                          |
| ----------- | ------------------------------------ |
| `refresh()` | Refreshes fragment content from Odin |

### Events

| Name        | Description                                                                             |
| ----------- | --------------------------------------------------------------------------------------- |
| `aem:load`  | fires when the fragment is successfully loaded                                          |
| `aem:error` | fires when the fragment cannot be loaded, e.g. network error, wrong fragment id, etc... |

```html {.demo .light}
<merch-card id="psCard2">
    <aem-fragment
        fragment="d8008cac-010f-4607-bacc-a7a327da1312"
    ></aem-fragment>
</merch-card>
<button id="btnRefresh">Refresh</button>
<script type="module">
    {
        const target = document.getElementById('log4');

        const psCard = document.getElementById('psCard2');
        psCard.addEventListener('mas:ready', (e) => {
            log(target, 'merch-card is ready: ', e.target.variant);
        });
        const aemFragment = psCard.querySelector('aem-fragment');
        aemFragment.addEventListener('aem:load', (e) => {
            log(target, JSON.stringify(e.detail, null, 2));
            log(target, 'aem-fragment has loaded');
        });
        document.getElementById('btnRefresh').addEventListener('click', () => {
            aemFragment.refresh();
        });
    }
</script>
```

```html {#log4}

```

## Extending merch-card

The `merch-card` custom element renders content in its default slot, allowing consumers to seamlessly extend it with additional UI capabilities.

### Example

In the demo below, the `aem-fragment` custom element is headless and does not render any content.
The `sp-action-button` custom element renders into the default slot as no explicit slot is provided.

```html {.demo .light}
<style>
    merch-card button {
        position: absolute;
        display: none;
        top: 4px;
        right: 4px;
    }

    merch-card:hover button {
        display: block;
    }
</style>
<merch-card id="headless">
    <aem-fragment
        fragment="d8008cac-010f-4607-bacc-a7a327da1312"
    ></aem-fragment>
    <button id="ctxBtn">...</button>
</merch-card>
<script type="module">
    document
        .getElementById('ctxBtn')
        .addEventListener(
            'click',
            (e) =>
                (e.target.parentElement.style.backgroundColor =
                    'var(--spectrum-blue-300)'),
        );
</script>
```
