# Audit script

`audit.mjs` prices every offer on adobe.com and MAS surfaces two ways and
reports where the results differ.

| Rendering    | Source                                        |
| ------------ | --------------------------------------------- |
| numeric      | the client formatter, from `priceDetails`     |
| preformatted | WCS `priceInfo`, as `inline-price` renders it |

It compares up to five prices per offer: regular, annual, optical,
strikethrough and annual strikethrough.

## Setting up

Run `npm install` at the repo root. The script imports `web-components/src`,
so it audits the branch you have checked out.

```sh
cd scripts/audit
node audit.mjs --help
```

`--help` lists every option and its default.

## Running common audits

Audit every page in the acom manifest:

```sh
node audit.mjs -b 50 -f /tmp/acom.csv -m ./audit-manifest.txt
```

Audit every published card of surfaces without crawlable pages. `-S` reads the
`en_US` cards from Odin and checks each one in every locale the surface serves:

```sh
node audit.mjs -b 50 -f /tmp/surfaces.csv -S adobe-home -S ccd -S express
```

Audit single pages or a sitemap:

```sh
node audit.mjs https://www.adobe.com/kr/creativecloud/plans.html
node audit.mjs https://www.adobe.com/cc-shared/assets/sitemap.xml
```

Price against stage WCS, like a page with `commerce.env=stage`. Fragments still
come from prod `/mas/io`. Their offers are requested again from stage WCS:

```sh
node audit.mjs -e stage -f /tmp/stage.csv -m ./audit-manifest.txt
```

List links that open commerce modals (CRM, D2P, TwP) instead of pricing offers:

```sh
node audit.mjs -t modal -f /tmp/modals.csv -m ./audit-manifest.txt
```

## What it follows

- OST links (`milo.adobe.com/tools/ost?...`) on each page, its `/fragments/`
  and its personalization manifests.
- MAS card and collection links (`mas.adobe.com/studio.html#...`). Each
  fragment comes from `/mas/io/fragment` for the page locale. Every offer in its
  `wcs.prod` section is compared, with promo codes and offer mappings applied.

## Reading the output

The CSV goes to `/tmp/audit.csv` unless `-f` names another file. It has one row
per offer link:

| Columns                                       | Content                                                               |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `origin`, `fragment`                          | the page, and the fragment the link came from                         |
| link parameters                               | one column per OST parameter in the run (`osi`, `type`, `promo`, ...) |
| `postExcerpt`                                 | the text after the link                                               |
| `wcs offerId` to `wcs priceDetails.*`         | the offer as WCS returned it                                          |
| `wcs price numeric`, `wcs price preformatted` | the regular price, rendered both ways                                 |
| `wcs price match`                             | `false` when any compared price differs                               |
| `wcs price mismatch modes`                    | the prices that differ                                                |
| `wcs price compared modes`                    | the prices compared                                                   |

The console ends with a summary and one line per mismatch:

```text
price comparison: 181 osis compared, 0 mismatched
  by mode: {"regular":181,"annual":155,"optical":20,"strikethrough":26}
```

`-t modal` writes `page URL`, `fragment URL` and `iFrame URL` instead.
`-s FILE` lists the pages containing any line of `FILE` in `FILE.matches`.

## Limiting load on WCS

Requests that reach WCS, directly or through `/mas/io/fragment`, are spaced
150ms apart at any `-b`. WCS requires at least 100ms, so `-w` rejects lower
values. Expect long runs: adobe-home and ccd, about 52,000 offers, took 2h15m with
`-b 50`.
