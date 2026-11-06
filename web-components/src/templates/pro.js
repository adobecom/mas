import { css } from '../css.js';

const CSS = css`
    :root {
        --consonant-merch-card-pro-font-family-regular: 'Adobe Clean',
            adobe-clean, sans-serif;
        --consonant-merch-card-pro-font-family-display: 'Adobe Clean Display',
            'adobe-clean-display', sans-serif;
        --consonant-merch-card-pro-max-width: 394px;
        --consonant-merch-card-pro-2up-max-width: 596px;
        /* Surface colors pinned to the Figma s2a tokens (background-default /
       background-subtle). Deliberately NOT var(--spectrum-gray-*): inside
       Studio an <sp-theme system="spectrum-two"> defines those, and S2's
       gray-100 (#e9e9e9) / gray-50 (#f8f8f8) are each one step grayer than
       the design, tinting every card surface. */
        --consonant-merch-card-pro-bg-default: #fff;
        --consonant-merch-card-pro-bg-subtle: #f8f8f8;
        --consonant-merch-card-pro-text-color: #000;
        --consonant-merch-card-pro-text-muted-color: #000000a3;
        --consonant-merch-card-pro-text-inverse-color: #fff;
        --consonant-merch-card-pro-cta-accent-color: #3b63fb;
        --consonant-merch-card-pro-cta-accent-hover-color: #274dea;
        --consonant-merch-card-pro-cta-outline-hover-color: #00000014;
        --consonant-merch-card-pro-divider-color: #0000001f;
    }

    /* The Milo .collection-container is itself a min-content grid; a pro
   collection's minmax(0, 1fr) tracks have zero min-content, so it would collapse
   to ~0 width inside it. Let the collection take the full container width — it
   caps and centres itself via the grid rules below. */
    .collection-container.plans:has(merch-card[variant='pro']) {
        display: block;
    }

    /* Standalone cards retain their cap; 3+ card collections fill their tracks
   at MD and XL below. */
    merch-card[variant='pro'] {
        width: 100%;
        max-width: var(--consonant-merch-card-pro-max-width);
        overflow: visible;
        position: relative;
    }

    /* EDU (Wide): standalone two-column card, wider than the default grid track.
   Internal row split + mobile stack live in the shadow variantStyle. */
    merch-card[variant='pro'][size='edu'] {
        max-width: 1068px;
    }

    /* Milo paints links Spectrum blue, which fights the card. Take the surrounding
   text color instead and let the underline do the work. */
    merch-card[variant='pro']
        :is(
            [slot='body-xs'],
            [slot='whats-included'],
            [slot='legal-text'],
            [slot='promo-text']
        )
        a {
        color: inherit;
    }

    /* Callout banner link — inherits dark text color + weight, just underlined.
   Force display:inline so the link flows with the surrounding text and
   doesn't get broken onto its own line by any inherited inline-block. */
    merch-card[variant='pro'] [slot='callout-content'] a {
        display: inline;
        color: inherit;
        font-weight: inherit;
        text-decoration: underline;
        white-space: normal;
    }

    /* The callout sits flat on the license-zone (Figma 1098:30779) — drop the
   global gray "pill" (background/radius/fit-content) that other variants use,
   so it's full-width caption text on the zone background instead of a box. */
    merch-card[variant='pro'] [slot='callout-content'] > p,
    merch-card[variant='pro'] [slot='callout-content'] > div > div {
        background: transparent;
        border-radius: 0;
        padding: 0;
        width: auto;
        font-size: 12px;
        line-height: 16px;
        letter-spacing: 0;
    }

    merch-card[variant='pro'] [slot='callout-content'] > div {
        margin: 0;
    }

    /* AI Assistant add-on row — Figma 1098:33812 / 1098:33951.
   Themes the real <merch-addon> injected at slot="addon". The purple frame
   and trailing sparkle live on the variant's .add-on wrapper (see variantStyle);
   here we size/colour the merch-addon checkbox + label via its custom props. */
    merch-card[variant='pro'] merch-addon[slot='addon'] {
        flex: 1 0 0;
        min-width: 0;
        /* merch-addon's flex layout lets the checkbox shrink, so a long label
       squashes it. Two fixed grid tracks hold it at 20px. */
        display: grid;
        grid-template-columns: var(--merch-addon-checkbox-size) minmax(0, 1fr);
        --merch-addon-gap: 8px;
        --merch-addon-align: center;
        /* Checkbox per Figma 1098:33812 — the rounded border, and (when checked)
       checkmark use the exact Spectrum 2 S2_Icon_CheckBox_20_N paths. Filled
       solid black (MWPW-198038: the AI gradient failed 3:1 non-text contrast).
       The CSS border is dropped; the ring lives in the SVG. */
        --merch-addon-checkbox-size: 20px;
        --merch-addon-checkbox-border: none;
        --merch-addon-checkbox-radius: 0;
        --merch-addon-checkbox-bg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M15.25 18H4.75C3.2334 18 2 16.7666 2 15.25V4.75C2 3.2334 3.2334 2 4.75 2H15.25C16.7666 2 18 3.2334 18 4.75V15.25C18 16.7666 16.7666 18 15.25 18ZM4.75 3.5C4.06055 3.5 3.5 4.06055 3.5 4.75V15.25C3.5 15.9395 4.06055 16.5 4.75 16.5H15.25C15.9395 16.5 16.5 15.9395 16.5 15.25V4.75C16.5 4.06055 15.9395 3.5 15.25 3.5H4.75Z' fill='%23000000'/%3E%3C/svg%3E")
            center / contain no-repeat;
        --merch-addon-checkbox-checked-bg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M14.4502 5.64453C14.1143 5.39844 13.6465 5.47363 13.4014 5.80664L8.86231 12.0042L7.19922 9.86328C6.94531 9.53711 6.47656 9.47754 6.14649 9.73047C5.81934 9.98535 5.75977 10.4561 6.01368 10.7832L8.28712 13.71C8.3047 13.7327 8.33131 13.7414 8.35108 13.7615C8.38062 13.7922 8.40088 13.8293 8.43653 13.8555C8.4629 13.8746 8.49268 13.8829 8.52051 13.8982C8.54444 13.9116 8.5669 13.9242 8.59229 13.9347C8.68531 13.9736 8.78125 14 8.87891 14C8.87915 14 8.87964 13.9998 8.87989 13.9998C8.88038 13.9998 8.88038 14 8.88087 14C8.98146 14 9.08058 13.9719 9.17579 13.9306C9.20265 13.919 9.22559 13.905 9.25099 13.8904C9.28029 13.8734 9.31227 13.864 9.33986 13.8428C9.37526 13.8152 9.39504 13.7771 9.42409 13.7449C9.44264 13.7246 9.46877 13.7159 9.48537 13.6933L14.6123 6.69335C14.8565 6.35937 14.7842 5.88965 14.4502 5.64453Z' fill='%23000000'/%3E%3Cpath d='M15.25 18H4.75C3.2334 18 2 16.7666 2 15.25V4.75C2 3.2334 3.2334 2 4.75 2H15.25C16.7666 2 18 3.2334 18 4.75V15.25C18 16.7666 16.7666 18 15.25 18ZM4.75 3.5C4.06055 3.5 3.5 4.06055 3.5 4.75V15.25C3.5 15.9395 4.06055 16.5 4.75 16.5H15.25C15.9395 16.5 16.5 15.9395 16.5 15.25V4.75C16.5 4.06055 15.9395 3.5 15.25 3.5H4.75Z' fill='%23000000'/%3E%3C/svg%3E")
            center / contain;
        --merch-addon-checkbox-checked-bg-color: transparent;
        --merch-addon-checkbox-checked-color: transparent;
        /* merch-addon declares no tracking on its shadow label, so it inherits from
       this host — pin it to the s2a label token (0) rather than the page's. */
        letter-spacing: 0;
        --merch-addon-label-size: 14px;
        --merch-addon-label-line-height: 18px;
        --merch-addon-label-weight: 700;
        --merch-addon-label-color: var(--consonant-merch-card-pro-text-color);
    }

    /* Grey add-on style (MWPW-208925) — the frame drops to a flat #e4e4e4 border
   in the shadow variantStyle; here the checkbox itself swaps the AI-gradient
   icon (which bakes its own border into the SVG, hence border:none above)
   for the flat black-bordered checkbox used elsewhere in the card set (see
   plans.css.js), sized down to 16px per spec since it no longer needs the
   larger AI-gradient ring. */
    merch-card[variant='pro'] merch-addon[slot='addon'][background='grey'] {
        --merch-addon-checkbox-size: 16px;
        --merch-addon-checkbox-border: 2px solid #000;
        --merch-addon-checkbox-radius: 4px;
        --merch-addon-checkbox-bg: transparent;
        --merch-addon-checkbox-checked-bg: var(--checkmark-icon);
        --merch-addon-checkbox-checked-bg-color: #000;
        --merch-addon-checkbox-checked-color: #000;
    }

    /* merch-addon stops styling its label once the paragraph picks up a
   data-plan-type, so do it here. No display — that is what switches plan types. */
    merch-card[variant='pro'] merch-addon[slot='addon'] p {
        margin: 0;
        color: var(--consonant-merch-card-pro-text-color);
        font-family: var(--consonant-merch-card-pro-font-family-regular);
        font-size: 14px;
        font-weight: 700;
        line-height: 18px;
        letter-spacing: 0;
        cursor: pointer;
    }

    /* Light-DOM color overrides — beat global promo/legal styling */
    merch-card[variant='pro'] [slot='promo-text'] {
        color: var(--consonant-merch-card-pro-text-muted-color);
        font-family: var(--consonant-merch-card-pro-font-family-regular);
        font-weight: 400;
        font-size: 14px;
        line-height: 18px;
        letter-spacing: 0;
        margin: 0;
    }

    /* Light-DOM typography for heading-xs / body-xs — must live here (not in
   shadow ::slotted) so it beats the global merch-card [slot="heading-xs"]
   rule. Per CSS Scoping, light-DOM rules outrank shadow ::slotted regardless
   of specificity, so the variant's slotted rules cannot win on their own. */
    merch-card[variant='pro'] [slot='heading-xs'] {
        margin: 0;
        font-family: var(--consonant-merch-card-pro-font-family-display);
        font-weight: 900;
        font-size: 24px;
        line-height: 24px;
        letter-spacing: -0.48px;
        color: var(--consonant-merch-card-pro-text-color);
    }

    merch-card[variant='pro'] [slot='body-xs'] {
        margin: 0;
        font-family: var(--consonant-merch-card-pro-font-family-regular);
        font-weight: 400;
        font-size: 14px;
        line-height: 18px;
        letter-spacing: 0;
        color: var(--consonant-merch-card-pro-text-color);
    }

    merch-card[variant='pro'] .price-plan-type .icon-button {
        width: 18px;
        height: 18px;
    }

    /* Title / description fields are RTE — authors may save <h3>Title</h3> or
   <div><p>desc</p></div>, which the AEM mapping then wraps again. Make any
   inner block descendant inherit the outer slot styles so the visible text
   uses the variant typography instead of UA defaults. */
    merch-card[variant='pro']
        [slot='heading-xs']
        :is(h1, h2, h3, h4, h5, h6, p, div, span),
    merch-card[variant='pro']
        [slot='body-xs']
        :is(h1, h2, h3, h4, h5, h6, p, div, span) {
        margin: 0;
        font: inherit;
        color: inherit;
        letter-spacing: inherit;
    }

    /* Rich whats-included styling: section title + bullet items + dividers */
    merch-card[variant='pro'] [slot='whats-included'] {
        font-family: var(--consonant-merch-card-pro-font-family-regular);
    }

    /* The authored label only feeds the shadow-DOM toggle button text; never
   show it inside the features zone itself. */
    merch-card[variant='pro'] [slot='whats-included'] .whats-included-label {
        display: none;
    }

    /* EDU whats-included TITLE — two states: small (≤1279) 20/20, desktop
   (≥1280) 36/32. Figma 4375:120499 (small) / 4375:120476 (desktop). */
    merch-card[variant='pro'][size='edu']
        [slot='whats-included']
        .whats-included-title {
        display: block;
        color: inherit;
        font-family: var(--consonant-merch-card-pro-font-family-display);
        font-size: 20px;
        font-style: normal;
        font-weight: 900;
        line-height: 20px;
        letter-spacing: -0.48px;
    }

    /* EDU card title (heading-xs): 18/20 up to tablet, 24/24 on desktop
   (Figma 4375:120499 / 4375:120476). Edu-scoped so grid pro cards keep 24. */
    merch-card[variant='pro'][size='edu'] [slot='heading-xs'] {
        font-size: 18px;
        line-height: 20px;
    }

    @media screen and (--c2-desktop-up) {
        merch-card[variant='pro'][size='edu']
            [slot='whats-included']
            .whats-included-title {
            font-size: 36px;
            line-height: 32px;
            letter-spacing: -1px;
        }
        merch-card[variant='pro'][size='edu'] [slot='heading-xs'] {
            font-size: 24px;
            line-height: 24px;
        }
    }

    /* EDU sub-label "What's included:" (Figma 4375:120476, 16/20/700). The base
   rule hides .whats-included-label; edu shows it 24px below the title. */
    merch-card[variant='pro'][size='edu']
        [slot='whats-included']
        .whats-included-label {
        display: block;
        color: inherit;
        font-family: var(--consonant-merch-card-pro-font-family-regular);
        font-size: 16px;
        font-weight: 700;
        line-height: 20px;
        letter-spacing: 0;
    }

    /* EDU eligibility disclaimer, resolved server-side ({{edu-disclaimer}}) and
   appended after the feature list by pro.js, hidden via the hideEduDisclaimer
   setting (MWPW-202318). Figma 4375:120476: 12/16 legal text. Muted token so
   it flips with the dark theme; the black-border frame overrides to white. */
    merch-card[variant='pro'][size='edu']
        [slot='whats-included']
        .whats-included-disclaimer {
        color: var(--consonant-merch-card-pro-text-muted-color, #000000a3);
        font-family: var(--consonant-merch-card-pro-font-family-regular);
        font-size: 12px;
        font-weight: 400;
        line-height: 16px;
        letter-spacing: 0;
        margin-top: 24px;
    }

    /* {{edu-disclaimer}} resolves to rich text (a <p>), so the placeholder sits in
   a <div> wrapper; the inner paragraph inherits the legal-text styling. */
    merch-card[variant='pro'][size='edu']
        [slot='whats-included']
        .whats-included-disclaimer
        p {
        margin: 0;
        font: inherit;
        color: inherit;
    }

    merch-card[variant='pro'][size='edu']
        [slot='whats-included']
        .whats-included-disclaimer
        a:not([class*='spectrum-Link']) {
        color: var(--consonant-merch-card-pro-text-color, #000);
    }

    merch-card[variant='pro'][border-color='black'][size='edu']
        [slot='whats-included']
        .whats-included-disclaimer {
        color: #ffffffa3;
    }

    merch-card[variant='pro'][border-color='black'][size='edu']
        [slot='whats-included']
        .whats-included-disclaimer
        a:not([class*='spectrum-Link']) {
        color: #fff;
    }

    /* Milo auto-blocks authored links to fragment/modal paths (e.g. the
   "See what's included" and disclaimer "Check eligibility" modal triggers)
   as class="fragment link-block", then hides them via a global
   .fragment.link-block { display: none } until its own block decoration
   reveals them. That decoration never runs on merch-card's own authored/
   injected content, so they'd stay hidden forever — force them visible
   wherever they appear in the card (body-xs, whats-included, disclaimer, etc). */
    merch-card[variant='pro'] a.fragment.link-block {
        display: inline !important;
    }

    /* Secondary spectrum links inherit the surrounding text color, per the
   convention used on other cards (e.g. mini-compare-chart footer-rows/body-m). */
    merch-card[variant='pro']
        [slot='whats-included']
        a.spectrum-Link.spectrum-Link--secondary,
    merch-card[variant='pro']
        [slot='body-xs']
        a.spectrum-Link.spectrum-Link--secondary {
        color: inherit;
    }

    /* Feature rows are 14/18/400 in both states — the authored <h4> and the <p>
   they become (pro.js adjustEduWhatsIncluded) — so type doesn't shift on
   convert. (Base h4 is 700/0.14px, the narrow-card look.) */
    merch-card[variant='pro'][size='edu'] [slot='whats-included'] h4,
    merch-card[variant='pro'][size='edu'] [slot='whats-included'] .section p {
        font-weight: 400;
        font-size: 14px;
        line-height: 18px;
        letter-spacing: 0;
    }

    merch-card[variant='pro'][size='edu'] [slot='whats-included'] .section p {
        margin: 0;
        padding: 0;
        color: var(--consonant-merch-card-pro-text-muted-color);
    }

    merch-card[variant='pro'][border-color='black'][size='edu']
        [slot='whats-included']
        .section
        p {
        color: var(--consonant-merch-card-pro-text-inverse-color);
    }

    merch-card[variant='pro'] [slot='whats-included'] .section,
    merch-card[variant='pro'] [slot='whats-included'] h4,
    merch-card[variant='pro'] [slot='whats-included'] h5 {
        margin: 0;
    }

    /* Studio's preview pane defines a global \`.section\` style (padding:32px,
   border-radius:16px, box-shadow, background) for its own editor panels.
   That selector inadvertently matches authored \`<div class="section">\`
   blocks inside the whats-included slot, blowing out paddings and forcing
   list items to wrap. Reset visual chrome so the section behaves as a
   transparent grouping container, per Figma. */
    merch-card[variant='pro'] [slot='whats-included'] .section {
        padding: 0;
        background: transparent;
        border: 0;
        border-radius: 0;
        box-shadow: none;
    }

    merch-card[variant='pro'] [slot='whats-included'] h4 {
        /* Pin the body font explicitly: on consumer pages (Milo) a global \`h4\`
       rule sets Adobe Clean Display Black directly on the element, which beats
       the font-family inherited from the slot container above. Studio has no
       such rule, so the title only looked wrong off-Studio. */
        font-family: var(--consonant-merch-card-pro-font-family-regular);
        /* s2a/typography/body-sm is Regular 400 — the UA \`h4\` bold (and Milo's
       \`body.mweb-enabled\` 800) must be overridden explicitly. */
        font-weight: 400;
        font-size: 14px;
        line-height: 18px;
        letter-spacing: 0;
        color: inherit;
    }

    /* Only rows with an icon need flex to center it against the text; a row with
   no icon (e.g. a leading link followed by plain text, MWPW-200407 review #1)
   must stay in normal flow, or flex splits the link and trailing text into
   separate wrapping columns instead of one flowing sentence. */
    merch-card[variant='pro']
        [slot='whats-included']
        h4:has(> svg, > .sp-icon, > merch-icon) {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    merch-card[variant='pro'] [slot='whats-included'] ul {
        list-style: none;
        margin: 12px 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    merch-card[variant='pro'] [slot='whats-included'] ul li {
        font-size: 14px;
        line-height: 18px;
        letter-spacing: 0;
        color: var(--consonant-merch-card-pro-text-muted-color);
        padding: 0 20px;
    }

    merch-card[variant='pro'][border-color='black']
        [slot='whats-included']
        ul
        li {
        color: var(--consonant-merch-card-pro-text-inverse-color);
    }

    /* Dark wins over a leftover Black border: list items stay muted, not inverse */
    merch-card[variant='pro'][background-color='dark']
        [slot='whats-included']
        ul
        li {
        color: var(--consonant-merch-card-pro-text-muted-color);
    }

    merch-card[variant='pro'] [slot='whats-included'] .section + .section {
        border-top: 1px solid var(--consonant-merch-card-pro-divider-color);
        padding-top: 16px;
    }

    /* Per Figma: the last section in a multi-section list uses 8px gap between title and items
   (the leading + middle sections stay at 12px). Single-section cards keep 12px.
   Excludes edu: there the sibling .whats-included-label makes .section a non-only
   :last-child, which would otherwise steal the edu 16px title→list gap. */
    merch-card[variant='pro']:not([size='edu'])
        [slot='whats-included']
        .section:not(:only-child):last-child
        ul {
        margin-top: 8px;
    }

    /* Section title icons: 20px on the first (lead) section, 16px on subsequent sections per Figma.
   Covers raw <svg> (curated registry), Spectrum <sp-icon-*> and <merch-icon> (standard picker).
   merch-icon sizes its shadow-DOM <img> from --mod-img-width/height (falling back to the
   size="xs" default of 20px), so a host width/height alone leaves the inner image at 20px and
   overflowing the box. Set the --mod-img-* custom properties too — they inherit across the shadow
   boundary and size the image to match. (svg/.sp-icon are light DOM and just use width/height.) */
    merch-card[variant='pro'] [slot='whats-included'] .section h4 > svg,
    merch-card[variant='pro'] [slot='whats-included'] .section h4 > .sp-icon,
    merch-card[variant='pro'] [slot='whats-included'] .section h4 > merch-icon {
        width: 16px;
        height: 16px;
        --mod-img-width: 16px;
        --mod-img-height: 16px;
        flex: 0 0 auto;
        color: inherit;
    }
    merch-card[variant='pro']
        [slot='whats-included']
        .section:first-child
        h4
        > svg,
    merch-card[variant='pro']
        [slot='whats-included']
        .section:first-child
        h4
        > .sp-icon,
    merch-card[variant='pro']
        [slot='whats-included']
        .section:first-child
        h4
        > merch-icon {
        width: 20px;
        height: 20px;
        --mod-img-width: 20px;
        --mod-img-height: 20px;
    }

    /* CTA styling — pill-shaped buttons, accent solid + outlined */
    merch-card[variant='pro'] [slot='footer'] a,
    merch-card[variant='pro'] [slot='footer'] button {
        flex: 1 1 calc(50% - 4px);
        /* One-line label width, capped at the footer: past half the row the CTAs
       stack, past the whole row the label wraps. */
        min-width: fit-content;
        min-height: 40px;
        padding: 8px 24px;
        /* S2A spacing-xs between an icon and the label; inert without one */
        gap: 8px;
        border-radius: 999px;
        font-family: var(--consonant-merch-card-pro-font-family-regular);
        font-weight: 700;
        font-size: 14px;
        line-height: 18px;
        letter-spacing: 0;
        text-align: center;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        overflow-wrap: anywhere;
    }

    merch-card[variant='pro'] [slot='footer'] .con-button.blue,
    merch-card[variant='pro'] [slot='footer'] a.accent,
    merch-card[variant='pro'] [slot='footer'] [data-button-type='accent'] {
        background: var(--consonant-merch-card-pro-cta-accent-color);
        color: var(--consonant-merch-card-pro-text-inverse-color);
        border: none;
    }

    /* Hover: the accent button darkens, the outline button picks up a wash. */
    merch-card[variant='pro'] [slot='footer'] .con-button.blue:hover,
    merch-card[variant='pro'] [slot='footer'] a.accent:hover,
    merch-card[variant='pro']
        [slot='footer']
        [data-button-type='accent']:hover {
        background-color: var(
            --consonant-merch-card-pro-cta-accent-hover-color
        );
    }

    merch-card[variant='pro'] [slot='footer'] .con-button.outline,
    merch-card[variant='pro'] [slot='footer'] .con-button.primary,
    merch-card[variant='pro'] [slot='footer'] a.outline,
    merch-card[variant='pro'] [slot='footer'] [data-button-type='primary'] {
        background: transparent;
        color: var(--consonant-merch-card-pro-text-color);
        /* border tracks the label: #000 on light, #fff on dark */
        border: 2px solid
            var(
                --consonant-merch-card-pro-cta-outline-border-color,
                var(--consonant-merch-card-pro-text-color)
            );
    }

    merch-card[variant='pro'][stacked] [slot='footer'] a,
    merch-card[variant='pro'][stacked] [slot='footer'] button {
        flex-basis: 100%;
    }

    /* S2A outlined button (2161:54613): black@8% wash on light, white@64% on dark,
   where the label flips to black to stay readable. The border never moves. */
    merch-card[variant='pro'] [slot='footer'] .con-button.outline:hover,
    merch-card[variant='pro'] [slot='footer'] .con-button.primary:hover,
    merch-card[variant='pro'] [slot='footer'] a.outline:hover,
    merch-card[variant='pro']
        [slot='footer']
        [data-button-type='primary']:hover {
        background-color: var(
            --consonant-merch-card-pro-cta-outline-hover-color
        );
        color: var(
            --consonant-merch-card-pro-cta-outline-hover-text-color,
            var(--consonant-merch-card-pro-text-color)
        );
    }

    /* heading-m holds the price. inline-price cards are covered by the .price-span
   rules below; "free" cards author literal text ("Free") that has no .price spans,
   so style the slot itself to match the Figma price (18px/900, node 1114:39070)
   instead of falling through to the global heading-m default (24px/700/#2c2c2c). */
    merch-card[variant='pro'] [slot='heading-m'],
    merch-card[variant='pro'] [slot='heading-m'] > p {
        margin: 0;
        font-family: var(--consonant-merch-card-pro-font-family-display);
        font-weight: 900;
        font-size: 18px;
        line-height: 21px;
        letter-spacing: -0.48px;
        color: var(--consonant-merch-card-pro-text-color);
    }

    /* Price spans — individually styled per Figma */
    merch-card[variant='pro'] [slot='heading-m'] .price,
    merch-card[variant='pro'] [slot='heading-m'] .price-currency-symbol,
    merch-card[variant='pro'] [slot='heading-m'] .price-integer,
    merch-card[variant='pro'] [slot='heading-m'] .price-decimals-delimiter,
    merch-card[variant='pro'] [slot='heading-m'] .price-decimals,
    merch-card[variant='pro'] [slot='heading-m'] .price-recurrence {
        font-family: var(--consonant-merch-card-pro-font-family-display);
        font-weight: 900;
        font-size: 18px;
        line-height: 21px;
        letter-spacing: -0.48px;
        color: var(--consonant-merch-card-pro-text-color);
    }

    /* Strikethrough (regular) price — Figma 988:14784: 14px regular muted, struck,
   on its own line ABOVE the current price (988:14785). Out-specifies the
   18px/900 .price rules above. Covers both markup shapes:
   - promo: .price-strikethrough next to .price-alternative inside one
     price-template inline-price (the promo price keeps the 18px/900 look)
   - authored: a separate strikethrough-template inline-price before the main
     price. The line-through itself comes from the global stylesheet. */
    merch-card[variant='pro']
        [slot='heading-m']
        .price:is(.price-strikethrough, .price-promo-strikethrough),
    merch-card[variant='pro']
        [slot='heading-m']
        .price:is(.price-strikethrough, .price-promo-strikethrough)
        span {
        font-family: var(--consonant-merch-card-pro-font-family-regular);
        font-weight: 400;
        font-size: 14px;
        line-height: 18px;
        letter-spacing: 0;
        color: var(--consonant-merch-card-pro-text-muted-color);
    }

    /* The global sheet strikes the wrapper as well as the span inside it, so the
   authored price gets two lines. Leave it to the inner span. */
    merch-card[variant='pro']
        [slot='heading-m']
        span[is='inline-price']:is(
            [data-template='strikethrough'],
            [data-template='priceStrikethrough']
        ):has(.price-strikethrough) {
        text-decoration: none;
    }

    /* Stack the struck price onto its own line. The authored shape needs the
   inline-price wrapper itself to break (its inner .price going block would
   stay inside the inline-block wrapper); the promo shape needs the inner
   .price-strikethrough to break within the shared wrapper. */
    merch-card[variant='pro']
        [slot='heading-m']
        span[is='inline-price']:is(
            [data-template='strikethrough'],
            [data-template='priceStrikethrough']
        ),
    merch-card[variant='pro']
        [slot='heading-m']
        span[is='inline-price'][data-template='price']
        .price:is(.price-strikethrough, .price-promo-strikethrough) {
        display: block;
    }

    /* The promo shape separates the two prices with an &nbsp; text node directly
   inside the wrapper; once the strikethrough goes block, that nbsp would
   indent the promo price's line. Zeroing the wrapper font collapses it — the
   .price spans carry their own explicit sizes (same trick as plans.css.js'
   ja_JP price-alternative block). line-height must go too: it is a length, so
   it survives font-size:0 and left a 6px strut that pushed the promo card's
   price off the row. */
    merch-card[variant='pro']
        [slot='heading-m']
        span[is='inline-price'][data-template='price']:has(
            .price-strikethrough,
            .price-promo-strikethrough
        ) {
        font-size: 0;
        line-height: 0;
    }

    /* Reserve the struck price's line so the real price sits at the same height
   across the row. syncHeights publishes each card's shortfall. */
    merch-card[variant='pro'] [slot='heading-m'] {
        padding-top: var(--consonant-merch-card-pro-strike-reserve, 0);
    }

    /* Plan type line ("Annual, billed monthly") — the legal-template price span,
   rendered when the Show Plan type setting is on. Its container carries the
   shared .price class, so this later rule overrides the 18px/900 price
   styling above with the muted body style (same look as promo-text, Figma
   1114:39070). Both the custom-element wrapper AND the inner .price container
   need display:block — the wrapper is inline-block by default, which would
   shrink-wrap the block container and keep it on the price's line. */
    merch-card[variant='pro']
        [slot='heading-m']
        span[is='inline-price'][data-template='legal'],
    merch-card[variant='pro'] [slot='heading-m'] .price.price-legal {
        display: block;
        font-family: var(--consonant-merch-card-pro-font-family-regular);
        font-weight: 400;
        font-size: 14px;
        line-height: 18px;
        letter-spacing: 0;
        color: var(--consonant-merch-card-pro-text-muted-color);
    }

    /* The legal line opens with an empty unit-type, so the tax label's leading
   ::before nbsp turns into a spurious indent and the line no longer aligns with
   the price above it; drop it when nothing precedes the tax label (MWPW-198626). */
    merch-card[variant='pro']
        .price-legal
        .price-unit-type.disabled
        + .price-tax-inclusivity:not(.disabled)::before {
        content: none;
    }

    /* Collection grid — C2 column breakpoints (768, 1280).
   - Mobile: single column, full width.
   - Tablet (≥768): 2-column grid for 2/3/4 cards.
   - Desktop (≥1280): full column count.
   Cards stretch to equal height within a row (matches Figma row-equal layout)
   and widths flow fluidly via 1fr tracks. */
    merch-card-collection.plans:is(
            .one-merch-card,
            .two-merch-cards,
            .three-merch-cards,
            .four-merch-cards
        ):has(merch-card[variant='pro']) {
        display: grid;
        gap: 8px;
        grid-template-columns: minmax(
            0,
            var(--consonant-merch-card-pro-max-width)
        );
        justify-content: center;
        /* Cards stretch to equal height; the white .top-card is pinned to its
       (uniform) content height and the gray .features-zone grows to fill the
       rest, so the white tops AND the card bottoms both line up across the row
       (matches Figma). See .top-card / .features-zone flex in the shadow styles. */
        align-items: stretch;
        margin-inline: auto;
    }

    /* The one-merch-card grid zeroes the section .content padding to center the lone
   card, which also wipes the C2 section-spacing metadata (e.g. spacing-2xs-top).
   Restore the authored top spacing so single pro cards keep section rhythm.
   MWPW-204106. */
    .one-merch-card.spacing-2xs-top {
        padding-top: var(--s2a-viewport-vertical-padding-2xs);
    }

    .container.one-merch-card {
        padding-inline: var(--grid-padding);
    }
    @media screen and (--tablet-up) {
        merch-card-collection.plans:is(
                .two-merch-cards,
                .three-merch-cards,
                .four-merch-cards
            ):has(merch-card[variant='pro']) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            max-width: 720px;
        }
    }

    @media screen and (--c2-desktop-up) {
        merch-card-collection.plans:is(.three-merch-cards):has(
                merch-card[variant='pro']
            ) {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            max-width: 1192px;
        }
        merch-card-collection.plans:is(.four-merch-cards):has(
                merch-card[variant='pro']
            ) {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            max-width: 1600px;
        }
        /* Detect exactly two cards structurally and render them as a centred 2-up.
       Matching the cards directly (instead of a column class) works regardless
       of whether the collection is tagged .two-merch-cards (since MWPW-196627)
       or falls into .four-merch-cards (e.g. when a card has a 'wide' size).
       Per Figma the 2-up cards are wider than the dense 4-up: they flex-fill the
       row up to 596px (≈522px at the 1280 breakpoint), so widen the track and the
       card's own cap for this case only. */
        merch-card-collection.plans:has(merch-card[variant='pro']):has(
                > merch-card:nth-of-type(2):last-of-type
            ) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            max-width: calc(
                2 * var(--consonant-merch-card-pro-2up-max-width) + 12px
            );
        }
        merch-card-collection.plans:has(merch-card[variant='pro']):has(
                > merch-card:nth-of-type(2):last-of-type
            )
            merch-card[variant='pro'] {
            max-width: var(--consonant-merch-card-pro-2up-max-width);
        }
    }

    @media screen and (--tablet-up) and (max-width: 1280px) {
        merch-card-collection.plans:has(> merch-card[variant='pro']):has(
                > merch-card:nth-of-type(3)
            ) {
            max-width: 1280px;
        }
    }

    @media screen and (--xl-desktop-up) {
        merch-card-collection.plans:has(> merch-card[variant='pro']):has(
                > merch-card:nth-of-type(3)
            ) {
            max-width: 1920px;
        }
    }

    @media screen and (--tablet-up) and (max-width: 1280px),
        screen and (--xl-desktop-up) {
        merch-card-collection.plans:has(> merch-card[variant='pro']):has(
                > merch-card:nth-of-type(3)
            )
            > merch-card[variant='pro']:not([size='edu']) {
            max-width: none;
        }
    }

    @media screen and (--mobile-landscape) {
        /* Mobile (320–767px): the default track caps cards at 394px, leaving side
       margins wider than the 24px gutter. Collapse to a single 1fr track and
       drop the card cap so cards fill the available width. */
        merch-card-collection.plans:is(
                .one-merch-card,
                .two-merch-cards,
                .three-merch-cards,
                .four-merch-cards
            ):has(merch-card[variant='pro']) {
            grid-template-columns: minmax(0, 1fr);
        }

        merch-card[variant='pro'] {
            width: 100%;
            max-width: none;
        }

        /* A collection inside a Milo .section.container inherits its 24px page
       gutter; one dropped straight into a plain section gets none, so the
       now-full-width cards bleed to the viewport edge. Restore the gutter on
       the collection itself for that case only. The > .content > chain pins
       this to the collection's own section, so it never doubles up where a
       .container already supplies the gutter. */
        .section:not(.container)
            > .content
            > .collection-container.plans:has(merch-card[variant='pro']) {
            padding-inline: 24px;
        }
    }

    /* Section grid — the same C2 columns and caps as the collection grid above, for
   pro cards placed straight in a Milo .one/.two/.three/.four-merch-cards
   section instead of a merch-card-collection (MWPW-203250). The section's
   .content wrapper turns transparent so the grid applies to the cards. */
    .one-merch-card:not(merch-card-collection):has(
            merch-card[variant='pro']
        ):not(
            :has(
                merch-card:not([variant='pro']),
                merch-card[size='edu'],
                merch-card-collection
            )
        )
        > .content,
    .two-merch-cards:not(merch-card-collection):has(
            merch-card[variant='pro']
        ):not(
            :has(
                merch-card:not([variant='pro']),
                merch-card[size='edu'],
                merch-card-collection
            )
        )
        > .content,
    .three-merch-cards:not(merch-card-collection):has(
            merch-card[variant='pro']
        ):not(
            :has(
                merch-card:not([variant='pro']),
                merch-card[size='edu'],
                merch-card-collection
            )
        )
        > .content,
    .four-merch-cards:not(merch-card-collection):has(
            merch-card[variant='pro']
        ):not(
            :has(
                merch-card:not([variant='pro']),
                merch-card[size='edu'],
                merch-card-collection
            )
        )
        > .content {
        display: contents;
    }

    .one-merch-card:not(merch-card-collection):has(
            merch-card[variant='pro']
        ):not(
            :has(
                merch-card:not([variant='pro']),
                merch-card[size='edu'],
                merch-card-collection
            )
        ),
    .two-merch-cards:not(merch-card-collection):has(
            merch-card[variant='pro']
        ):not(
            :has(
                merch-card:not([variant='pro']),
                merch-card[size='edu'],
                merch-card-collection
            )
        ),
    .three-merch-cards:not(merch-card-collection):has(
            merch-card[variant='pro']
        ):not(
            :has(
                merch-card:not([variant='pro']),
                merch-card[size='edu'],
                merch-card-collection
            )
        ),
    .four-merch-cards:not(merch-card-collection):has(
            merch-card[variant='pro']
        ):not(
            :has(
                merch-card:not([variant='pro']),
                merch-card[size='edu'],
                merch-card-collection
            )
        ) {
        gap: 8px;
        grid-template-columns: minmax(
            0,
            var(--consonant-merch-card-pro-max-width)
        );
        align-items: stretch;
        margin-inline: auto;
    }

    @media screen and (--tablet-up) {
        .two-merch-cards:not(merch-card-collection):has(
                merch-card[variant='pro']
            ):not(
                :has(
                    merch-card:not([variant='pro']),
                    merch-card[size='edu'],
                    merch-card-collection
                )
            ),
        .three-merch-cards:not(merch-card-collection):has(
                merch-card[variant='pro']
            ):not(
                :has(
                    merch-card:not([variant='pro']),
                    merch-card[size='edu'],
                    merch-card-collection
                )
            ),
        .four-merch-cards:not(merch-card-collection):has(
                merch-card[variant='pro']
            ):not(
                :has(
                    merch-card:not([variant='pro']),
                    merch-card[size='edu'],
                    merch-card-collection
                )
            ) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            max-width: 720px;
        }

        .three-merch-cards:not(merch-card-collection):has(
                merch-card[variant='pro']
            ):not(
                :has(
                    merch-card:not([variant='pro']),
                    merch-card[size='edu'],
                    merch-card-collection
                )
            )
            merch-card[variant='pro']:not([size='edu']),
        .four-merch-cards:not(merch-card-collection):has(
                merch-card[variant='pro']
            ):not(
                :has(
                    merch-card:not([variant='pro']),
                    merch-card[size='edu'],
                    merch-card-collection
                )
            )
            merch-card[variant='pro']:not([size='edu']) {
            max-width: none;
        }
    }

    @media screen and (--c2-desktop-up) {
        .two-merch-cards:not(merch-card-collection):has(
                merch-card[variant='pro']
            ):not(
                :has(
                    merch-card:not([variant='pro']),
                    merch-card[size='edu'],
                    merch-card-collection
                )
            ) {
            gap: 12px;
            max-width: calc(
                2 * var(--consonant-merch-card-pro-2up-max-width) + 12px
            );
        }
        .two-merch-cards:not(merch-card-collection):has(
                merch-card[variant='pro']
            ):not(
                :has(
                    merch-card:not([variant='pro']),
                    merch-card[size='edu'],
                    merch-card-collection
                )
            )
            merch-card[variant='pro'] {
            max-width: var(--consonant-merch-card-pro-2up-max-width);
        }
        .three-merch-cards:not(merch-card-collection):has(
                merch-card[variant='pro']
            ):not(
                :has(
                    merch-card:not([variant='pro']),
                    merch-card[size='edu'],
                    merch-card-collection
                )
            ) {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            max-width: 1192px;
        }
        .four-merch-cards:not(merch-card-collection):has(
                merch-card[variant='pro']
            ):not(
                :has(
                    merch-card:not([variant='pro']),
                    merch-card[size='edu'],
                    merch-card-collection
                )
            ) {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            max-width: 1600px;
        }
    }

    @media screen and (--tablet-up) and (max-width: 1280px) {
        .three-merch-cards:not(merch-card-collection):has(
                merch-card[variant='pro']
            ):not(
                :has(
                    merch-card:not([variant='pro']),
                    merch-card[size='edu'],
                    merch-card-collection
                )
            ),
        .four-merch-cards:not(merch-card-collection):has(
                merch-card[variant='pro']
            ):not(
                :has(
                    merch-card:not([variant='pro']),
                    merch-card[size='edu'],
                    merch-card-collection
                )
            ) {
            max-width: 1280px;
        }
    }

    @media screen and (--xl-desktop-up) {
        .three-merch-cards:not(merch-card-collection):has(
                merch-card[variant='pro']
            ):not(
                :has(
                    merch-card:not([variant='pro']),
                    merch-card[size='edu'],
                    merch-card-collection
                )
            ),
        .four-merch-cards:not(merch-card-collection):has(
                merch-card[variant='pro']
            ):not(
                :has(
                    merch-card:not([variant='pro']),
                    merch-card[size='edu'],
                    merch-card-collection
                )
            ) {
            max-width: 1920px;
        }
    }

    @media screen and (--mobile-landscape) {
        .one-merch-card:not(merch-card-collection):has(
                merch-card[variant='pro']
            ):not(
                :has(
                    merch-card:not([variant='pro']),
                    merch-card[size='edu'],
                    merch-card-collection
                )
            ),
        .two-merch-cards:not(merch-card-collection):has(
                merch-card[variant='pro']
            ):not(
                :has(
                    merch-card:not([variant='pro']),
                    merch-card[size='edu'],
                    merch-card-collection
                )
            ),
        .three-merch-cards:not(merch-card-collection):has(
                merch-card[variant='pro']
            ):not(
                :has(
                    merch-card:not([variant='pro']),
                    merch-card[size='edu'],
                    merch-card-collection
                )
            ),
        .four-merch-cards:not(merch-card-collection):has(
                merch-card[variant='pro']
            ):not(
                :has(
                    merch-card:not([variant='pro']),
                    merch-card[size='edu'],
                    merch-card-collection
                )
            ) {
            grid-template-columns: minmax(0, 1fr);
        }
    }
`;

const VARIANT = 'pro';

// syncHeights publishes these properties; templateStyle below and
// pro.css.js read them by name (covered by a unit test).
export const TOP_CARD_HEIGHT_PROP = `--consonant-merch-card-${VARIANT}-top-card-height`;

// Match these blocks across a row so the price lands at the same height on
// every card, the way Figma lays it out.
export const SYNCED_BANDS = [
    {
        prop: `--consonant-merch-card-${VARIANT}-mnemonic-height`,
        selector: '.mnemonic',
    },
    {
        prop: `--consonant-merch-card-${VARIANT}-name-description-height`,
        selector: '.name-description',
    },
];

// Reserve the struck price's row so cards without one keep the same price
// offset. Published per row, so a wrapped second row doesn't inherit it.
export const STRIKE_RESERVE_PROP = `--consonant-merch-card-${VARIANT}-strike-reserve`;

const STRIKE_SELECTOR =
    '[slot="heading-m"] :is(.price-strikethrough, .price-promo-strikethrough, [data-template="strikethrough"])';

const SYNC_MIN_WIDTH = '(min-width: 768px)';

// Both forms `replace` can leave behind: the bare key (key missing) or the raw token (no dictionary).
const UNRESOLVED_TOGGLE_LABELS = [
    'see-whats-included',
    '{{see-whats-included}}',
];

// A hidden CTA has no box, so only visible ones count as wrapped.
const hasWrappedCtas = (card) =>
    new Set(
        [...card.querySelectorAll('[slot="footer"] a, [slot="footer"] button')]
            .filter((cta) => cta.getClientRects().length)
            .map((cta) => Math.round(cta.getBoundingClientRect().top)),
    ).size > 1;

export const PRO_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    subtitle: { tag: 'p', slot: 'subtitle' },
    title: { tag: 'h3', slot: 'heading-xs' },
    description: { tag: 'div', slot: 'body-xs' },
    mnemonics: { size: 's' },
    size: ['wide', 'edu'],
    prices: { tag: 'p', slot: 'heading-m' },
    promoText: { tag: 'p', slot: 'promo-text' },
    perUnitLabel: { tag: 'span', slot: 'per-unit-label' },
    callout: {
        tag: 'div',
        slot: 'callout-content',
        editorLabel: 'License callout',
    },
    quantitySelect: { tag: 'div', slot: 'quantity-select' },
    shortDescription: { tag: 'div', slot: 'legal-text' },
    secureLabel: true,
    planType: true,
    addon: true,
    ctas: { slot: 'footer', size: 'm' },
    whatsIncluded: { tag: 'div', slot: 'whats-included' },
    eduDisclaimer: { tag: 'div', slot: 'edu-disclaimer' },
    backgroundColor: {
        attribute: 'background-color',
        editorLabel: 'Theme',
        specialValues: { Light: 'light', Dark: 'dark' },
    },
    borderColor: {
        attribute: 'border-color',
        specialValues: { Black: 'black' },
        // editor: only Default + Black, and disabled when Theme = Dark
        hideTransparent: true,
        disableWhenBackgroundColor: 'dark',
    },
    allowedBorderColors: [],
    style: 'consonant',
};

export function define({
    ARROW_DOWN,
    ARROW_UP,
    ENTER,
    EVENT_MERCH_CARD_QUANTITY_CHANGE,
    EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
    EVENT_TYPE_RESOLVED,
    Log,
    SELECTOR_MAS_INLINE_PRICE,
    TAB,
    TEMPLATE_PRICE_LEGAL,
    TemplateLayout,
    createMasElement,
    escapeHTML,
}) {
    const log = Log.module('merch-card/pro');

    class Pro extends TemplateLayout {
        expanded = false;
        licenseOpen = false;
        licenseQty = null;
        // Active-descendant highlight; focus stays on the trigger (combobox model).
        licenseHighlightedIndex = 0;
        #licenseDocListenerBound = null;
        #onPriceResolved = () => {
            this.adjustLegal();
            this.requestReflowCheck();
        };
        lastSyncKey = null;

        constructor(card) {
            super(card);
            this.updatePriceQuantity = this.updatePriceQuantity.bind(this);
            // Restore expanded state persisted on the card element (survives layout
            // recreation caused by fragment hydration resetting card.variant).
            this.expanded = card._proExpanded ?? false;
        }

        getGlobalCSS() {
            return CSS;
        }

        // Forwards the Show Plan type setting to the legal-template price (which
        // renders the plan type line). Same pattern as plans/plans-v2. An authored
        // Short Description is rendered by the template itself as the plan type,
        // whatever the setting, so every (re-)render of the legal price paints it in
        // the same pass, never the derived WCS wording (MWPW-214359).
        priceOptionsProvider(element, options) {
            if (element.dataset.template !== TEMPLATE_PRICE_LEGAL) return;
            const label = this.customPlanTypeLabel;
            if (label && element.closest('[slot="heading-m"]')) {
                options.displayPlanType = true;
                options.customPlanTypeLabel = label;
                return;
            }
            options.displayPlanType =
                this.card?.settings?.displayPlanType ?? false;
        }

        // The authored Short Description. Read [slot="legal-text"] in place (never
        // detached): the shadow has no matching slot so it won't render, and
        // merch-card swaps in a fresh layout per render.
        get customPlanTypeLabel() {
            const source = this.card?.querySelector('[slot="legal-text"]');
            if (!source?.textContent?.trim()) return '';
            return source.innerHTML.trim();
        }

        // Creates a legal-template sibling so tax/plan-type render off the main price.
        async adjustLegal() {
            if (this.legalAdjusted) return;
            try {
                await this.card.updateComplete;
                await customElements.whenDefined('inline-price');
                const headingPrice = this.mainPrice;
                if (!headingPrice) return;
                await headingPrice.onceSettled();
                // merch-card may have swapped in a fresh layout meanwhile; that one
                // owns the legal price.
                if (
                    !headingPrice.options ||
                    this.legalAdjusted ||
                    this.card.templateLayout !== this ||
                    this.mainPrice !== headingPrice
                )
                    return;
                // Use the registered constructor: importing inline-price here can register it before Safari's polyfill.
                const legal = createMasElement(
                    customElements.get('inline-price'),
                );
                for (const { name, value } of headingPrice.attributes) {
                    legal.setAttribute(name, value);
                }
                legal.innerHTML = headingPrice.innerHTML;
                // Per-unit stays on the pricing line (unlike plans); only tax and
                // plan type move to the legal clone, which drops per-unit.
                if (headingPrice.options.displayTax)
                    headingPrice.dataset.displayTax = 'false';
                if (headingPrice.options.displayPlanType)
                    headingPrice.dataset.displayPlanType = 'false';
                legal.setAttribute('data-template', 'legal');
                legal.dataset.displayPerUnit = 'false';
                // The dataset outranks priceOptionsProvider; a plan type flag cloned
                // from the main price must not hide the authored Short Description.
                if (this.customPlanTypeLabel)
                    delete legal.dataset.displayPlanType;
                headingPrice.parentNode.insertBefore(
                    legal,
                    headingPrice.nextSibling,
                );
                this.legalAdjusted = true;
                await legal.onceSettled();
            } catch (error) {
                log.error(
                    `Failed to initialize legal price: ${error.message}`,
                    {
                        cardId: this.card.id,
                    },
                );
            }
        }

        get hasWhatsIncluded() {
            return !!this.card.querySelector('[slot="whats-included"]');
        }

        get hasEduDisclaimer() {
            return !this.card?.settings?.hideEduDisclaimer;
        }

        get whatsIncludedToggleLabel() {
            const authored = this.card
                .querySelector('[slot="whats-included"] .whats-included-label')
                ?.textContent.trim();
            const localized = this.card.placeholders?.whatsIncludedToggleLabel;
            return (
                authored ||
                (!UNRESOLVED_TOGGLE_LABELS.includes(localized) && localized) ||
                ''
            );
        }

        get hasCallout() {
            return !!this.card.querySelector('[slot="callout-content"]');
        }

        get hasQuantitySelect() {
            // Count only a configured selector (title/min/step) — the toggle authors
            // an empty <merch-quantity-select/> when off.
            const qs = this.quantitySelectEl;
            if (!qs) return false;
            return (
                !!qs.getAttribute('title') ||
                parseInt(qs.getAttribute('min'), 10) > 0 ||
                parseInt(qs.getAttribute('step'), 10) > 0
            );
        }

        get hasAddOn() {
            return !!this.card.querySelector('[slot="addon"]');
        }

        // The Grey add-on style rides the same authored `background` attribute
        // the "Addon Background" editor control already persists on the slotted
        // <merch-addon> (see merch-card-editor.js #renderAddonStylePicker) — the
        // frame lives in this shadow root, so it can't be reached by the
        // light-DOM attribute selector pro.css.js uses for the checkbox alone.
        get addonBackground() {
            return (
                this.card
                    .querySelector('[slot="addon"]')
                    ?.getAttribute('background') ?? null
            );
        }

        get mainPrice() {
            return this.card.querySelector(
                `[slot="heading-m"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`,
            );
        }

        // Push the selected license quantity onto the main price so WCS re-prices
        // (volume promo). Mirrors mini-compare-chart — the card previously only
        // dispatched the event for checkout-link wiring, leaving the price at qty 1.
        updatePriceQuantity({ detail }) {
            if (!this.mainPrice || !detail?.option) return;
            this.mainPrice.dataset.quantity = detail.option;
        }

        async adjustAddon() {
            await this.card.updateComplete;
            const addon = this.card.addon;
            if (!addon) return;
            addon.setAttribute('custom-checkbox', '');
            const price = this.mainPrice;
            if (!price) return;
            await price.onceSettled?.();
            const planType = price.value?.[0]?.planType;
            if (planType) addon.planType = planType;
        }

        async postCardUpdateHook() {
            this.adjustEduWhatsIncluded();
            await this.adjustAddon();
            if (!this.legalAdjusted) {
                await this.adjustLegal();
            }
            await super.postCardUpdateHook();
            // Line the white .top-card sections up across a row (desktop only).
            if (window.matchMedia('(min-width: 768px)').matches)
                this.syncHeights();
        }

        // pro/edu only: the authored whats-included leading paragraph is the panel
        // title, styled big but promotional copy rather than a heading. Restyle it
        // and inject the server-resolved (already localized) "What's included"
        // heading + disclaimer strings published on the card's `placeholders` map
        // (settings.js -> replace transformer -> here). Idempotent via the
        // `.whats-included-title` guard so re-renders don't double-apply.
        adjustEduWhatsIncluded() {
            if (this.card.size !== 'edu') return;
            const slot = this.card.querySelector('[slot="whats-included"]');
            if (!slot || slot.querySelector('.whats-included-title')) return;
            const authoredTitle = slot.querySelector('.whats-included-label');
            if (!authoredTitle) return;
            const title = document.createElement('p');
            title.className = 'whats-included-title';
            title.innerHTML = authoredTitle.innerHTML;
            authoredTitle.replaceWith(title);
            const { whatsIncludedLabel, eduDisclaimer } =
                this.card.placeholders ?? {};
            // A blank label stays a paragraph so the panel never gets an empty
            // heading.
            const label = document.createElement(
                whatsIncludedLabel?.trim() ? 'h4' : 'p',
            );
            label.className = 'whats-included-label';
            label.textContent = whatsIncludedLabel ?? '';
            title.after(label);
            // :scope keeps page wrappers (Milo's div.section) from matching the
            // label above.
            slot.querySelectorAll(':scope .section h4').forEach((h4) => {
                const row = document.createElement('p');
                row.innerHTML = h4.innerHTML;
                h4.replaceWith(row);
            });
            if (eduDisclaimer) {
                const disclaimer = document.createElement('div');
                disclaimer.className = 'whats-included-disclaimer';
                disclaimer.innerHTML = eduDisclaimer;
                slot.append(disclaimer);
            }
        }

        // Heading/description reflow when the Adobe Clean fonts load, so wait for
        // them before measuring. Same shape as full-pricing-express.waitForTitleFont.
        async waitForContentFonts() {
            const els = [
                this.card.querySelector('[slot="heading-xs"]'),
                this.card.querySelector('[slot="body-xs"]'),
            ].filter(Boolean);
            if (document.fonts?.load) {
                await Promise.all(
                    els.map((el) => {
                        const s = window.getComputedStyle(el);
                        const font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
                        return document.fonts
                            .load(font, el.textContent)
                            .catch(() => null);
                    }),
                );
            }
            await document.fonts?.ready;
        }

        // Publish each row's tallest white-card height as min-height so prices/CTAs
        // line up. Group by offsetTop, not rect.top: the tab entrance animation
        // transforms the painted tops mid-flight, which would split a row.
        async syncHeights() {
            // Opting out after a sync has already run must undo it, not just stop.
            if (this.card.heightSync === false) {
                this.clearSyncedHeights(this.card);
                return;
            }
            await this.waitForContentFonts();
            await new Promise((resolve) => requestAnimationFrame(resolve));
            await new Promise((resolve) => requestAnimationFrame(resolve));
            const container = this.getContainer();
            if (!container || this.card.getBoundingClientRect().width <= 2)
                return;
            const variant = this.card.variant;
            const prop = TOP_CARD_HEIGHT_PROP;
            const cards = [
                ...container.querySelectorAll(
                    `merch-card[variant="${variant}"]`,
                ),
            ].filter(
                (card) =>
                    card.getBoundingClientRect().width > 2 &&
                    card.templateLayout?.card?.heightSync !== false,
            );
            // Stacked cards are each their own row, so there's nothing to line up,
            // and a leftover desktop reserve would leave a gap above the price.
            if (!window.matchMedia(SYNC_MIN_WIDTH).matches) {
                cards.forEach((card) => this.clearSyncedHeights(card));
                return;
            }
            const rows = new Map();
            for (const card of cards) {
                const row = rows.get(card.offsetTop) ?? [];
                row.push(card);
                rows.set(card.offsetTop, row);
            }
            const maxHeight = (row, getElement) =>
                row.reduce((max, card) => {
                    const el = getElement(card);
                    return el
                        ? Math.max(
                              max,
                              parseInt(getComputedStyle(el).height) || 0,
                          )
                        : max;
                }, 0);
            for (const row of rows.values()) {
                row.forEach((card) => this.clearSyncedHeights(card));
                // A lone card has nothing to match, so it keeps its natural height.
                if (row.length < 2) continue;
                // A wrapped CTA stacks every card in the row so the buttons line up.
                const stack = row.some(hasWrappedCtas);
                row.forEach((card) => card.toggleAttribute('stacked', stack));
                // Reserve first — it grows the price block everything below measures.
                // A per-card shortfall covers short, wrapped and missing strikes alike.
                const strikes = row.map((card) =>
                    card.querySelector(STRIKE_SELECTOR)
                        ? parseInt(
                              getComputedStyle(
                                  card.querySelector(STRIKE_SELECTOR),
                              ).height,
                          ) || 0
                        : 0,
                );
                const tallestStrike = Math.max(0, ...strikes);
                if (tallestStrike > 0)
                    row.forEach((card, i) => {
                        const shortfall = tallestStrike - strikes[i];
                        if (shortfall > 0)
                            card.style.setProperty(
                                STRIKE_RESERVE_PROP,
                                `${shortfall}px`,
                            );
                    });
                for (const band of SYNCED_BANDS) {
                    const max = maxHeight(row, (card) =>
                        card.shadowRoot?.querySelector(band.selector),
                    );
                    if (max > 0)
                        row.forEach((card) =>
                            card.style.setProperty(band.prop, `${max}px`),
                        );
                }
                const max = maxHeight(row, (card) =>
                    card.shadowRoot?.querySelector('.top-card'),
                );
                if (max > 0)
                    row.forEach((card) =>
                        card.style.setProperty(prop, `${max}px`),
                    );
            }
        }

        clearSyncedHeights(card) {
            card.removeAttribute('stacked');
            card.style.removeProperty(TOP_CARD_HEIGHT_PROP);
            card.style.removeProperty(STRIKE_RESERVE_PROP);
            SYNCED_BANDS.forEach((band) =>
                card.style.removeProperty(band.prop),
            );
        }

        // Re-sync on a real reflow, keyed so our own writes can't loop the observer.
        // A late price resolution adds the struck and legal rows after the first pass.
        resyncOnReflow() {
            const width = this.boxOf(this.card).width;
            if (width <= 2) return;
            const height = (selector, root = this.card) =>
                this.heightOf(root?.querySelector(selector));
            // Measure inside the price block, never [slot="heading-m"] itself: the
            // reserve lands on its padding, so keying on that would feed back.
            const key = [
                Math.round(width),
                height('[slot="body-xs"]'),
                height(STRIKE_SELECTOR),
                height('[slot="heading-m"] span[is="inline-price"]'),
                height(
                    '[slot="heading-m"] :is(.price-legal, [data-template="legal"])',
                ),
                height('.license-zone', this.card.shadowRoot),
                height('.add-on', this.card.shadowRoot),
            ].join(':');
            if (key === this.lastSyncKey) return;
            this.lastSyncKey = key;
            this.syncHeights();
        }

        connectedCallbackHook() {
            if (!this.card) return;
            this.card.addEventListener(
                EVENT_MERCH_CARD_QUANTITY_CHANGE,
                this.#onModalQuantityChange,
            );
            this.card.addEventListener(
                EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
                this.updatePriceQuantity,
            );
            // A promo can swap the price without resizing either observed box, so a
            // price resolution (it bubbles here) asks the observer for a fresh report.
            this.card.addEventListener(
                EVENT_TYPE_RESOLVED,
                this.#onPriceResolved,
            );
            this.observeReflow(
                this.card,
                this.card.querySelector('[slot="body-xs"]'),
            );
        }

        disconnectedCallbackHook() {
            this.card?.removeEventListener(
                EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
                this.updatePriceQuantity,
            );
            this.card?.removeEventListener(
                EVENT_TYPE_RESOLVED,
                this.#onPriceResolved,
            );
            this.#removeLicenseDocListener();
            this.disconnectReflow();
            this.card?.removeEventListener(
                EVENT_MERCH_CARD_QUANTITY_CHANGE,
                this.#onModalQuantityChange,
            );
        }

        #onModalQuantityChange = ({ detail }) => {
            const next =
                detail?.quantity == null ? null : String(detail.quantity);
            if (next == null || next === this.licenseQty) return;
            if (!this.licenseOptions?.includes(next)) return;
            this.licenseQty = next;
            this.card.requestUpdate();
        };

        get quantitySelectEl() {
            return this.card.querySelector('merch-quantity-select');
        }

        get licenseOptions() {
            // Options come from the authored quantity selector (min→max by step).
            const qs = this.quantitySelectEl;
            if (!qs) return null;
            const min = parseInt(qs.getAttribute('min'), 10);
            const max = parseInt(qs.getAttribute('max'), 10);
            const step = parseInt(qs.getAttribute('step'), 10) || 1;
            // A negative step counts away from max forever and hangs the page.
            // merch-quantity-select shows nothing below step 1, so do the same.
            if (Number.isNaN(min) || Number.isNaN(max) || max < min || step < 1)
                return null;
            const opts = [];
            // min <= max and step >= 1, so this always yields at least one option.
            for (let v = min; v <= max; v += step) opts.push(String(v));
            return opts;
        }

        // Plural label from the authored "singular|plural" title (two dictionary
        // placeholders, resolved per locale). No "|" → unchanged for every quantity;
        // pluralization is never derived in code (appending "s" breaks most locales).
        licenseLabel(count) {
            const title =
                this.quantitySelectEl?.getAttribute('title') ||
                this.card.placeholders?.licenseLabel ||
                '';
            const [singular, plural] = title.split('|').map((s) => s.trim());
            return Number(count) === 1 ? singular : plural || singular;
        }

        get hasLicenseSelector() {
            return (this.licenseOptions?.length ?? 0) > 0;
        }

        get currentLicenseValue() {
            const opts = this.licenseOptions;
            if (!opts?.length) return null;
            if (this.licenseQty != null) return this.licenseQty;
            const def = this.quantitySelectEl?.getAttribute('default-value');
            return def != null && opts.includes(def) ? def : opts[0];
        }

        // Cards sharing this card's row (same offsetTop, as syncHeights groups them);
        // stacked single-column cards land on different rows and stay independent.
        #rowCards() {
            const top = this.card.offsetTop;
            const cards = Array.from(
                this.getContainer()?.querySelectorAll(
                    `merch-card[variant="${this.card.variant}"]`,
                ) ?? [],
            ).filter(
                (card) =>
                    card.getBoundingClientRect().width > 2 &&
                    card.offsetTop === top,
            );
            return cards.length ? cards : [this.card];
        }

        toggleExpanded = (e) => {
            e.preventDefault();
            // Cards on a row expand/collapse together (Figma). Set every row card to
            // the clicked card's new state so diverged rows converge.
            const expanded = !this.expanded;
            for (const card of this.#rowCards()) {
                const layout = card.templateLayout;
                if (!(layout instanceof Pro)) continue;
                layout.expanded = expanded;
                card._proExpanded = expanded;
                layout.#syncExpandedDom();
            }
        };

        #removeLicenseDocListener() {
            if (!this.#licenseDocListenerBound) return;
            document.removeEventListener(
                'mousedown',
                this.#licenseDocListenerBound,
            );
            this.#licenseDocListenerBound = null;
        }

        #currentLicenseIndex() {
            const idx = this.licenseOptions?.indexOf(this.currentLicenseValue);
            return idx > 0 ? idx : 0;
        }

        #openLicensePopover() {
            this.licenseOpen = true;
            // Open with the highlight on the selected option.
            this.licenseHighlightedIndex = this.#currentLicenseIndex();
            if (!this.#licenseDocListenerBound) {
                this.#licenseDocListenerBound = (evt) => {
                    if (!evt.composedPath().includes(this.card)) {
                        this.licenseOpen = false;
                        this.#syncLicenseDom();
                        this.#removeLicenseDocListener();
                    }
                };
                document.addEventListener(
                    'mousedown',
                    this.#licenseDocListenerBound,
                );
            }
        }

        #closeLicensePopover() {
            this.licenseOpen = false;
            this.#removeLicenseDocListener();
        }

        toggleLicensePopover = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.licenseOpen) {
                this.#closeLicensePopover();
            } else {
                this.#openLicensePopover();
            }
            this.#syncLicenseDom();
        };

        // Select-only combobox keys (ARIA APG): arrows/Home/End move the
        // active-descendant highlight, Enter/Space commit, Escape closes, Tab commits
        // and lets focus advance. Focus stays on the trigger throughout.
        #handleLicenseKeydown = (e) => {
            const opts = this.licenseOptions;
            if (!opts?.length) return;
            const last = opts.length - 1;
            switch (e.key) {
                case ARROW_DOWN:
                    e.preventDefault();
                    if (this.licenseOpen) {
                        this.licenseHighlightedIndex =
                            (this.licenseHighlightedIndex + 1) % opts.length;
                    } else {
                        this.#openLicensePopover();
                    }
                    break;
                case ARROW_UP:
                    e.preventDefault();
                    if (this.licenseOpen) {
                        this.licenseHighlightedIndex =
                            (this.licenseHighlightedIndex - 1 + opts.length) %
                            opts.length;
                    } else {
                        this.#openLicensePopover();
                    }
                    break;
                case 'Home':
                    if (!this.licenseOpen) return;
                    e.preventDefault();
                    this.licenseHighlightedIndex = 0;
                    break;
                case 'End':
                    if (!this.licenseOpen) return;
                    e.preventDefault();
                    this.licenseHighlightedIndex = last;
                    break;
                case ENTER:
                case ' ':
                    e.preventDefault();
                    if (this.licenseOpen) {
                        this.selectLicenseQty(
                            opts[this.licenseHighlightedIndex],
                        );
                        return; // selectLicenseQty already syncs the DOM
                    }
                    this.#openLicensePopover();
                    break;
                case 'Escape':
                    if (!this.licenseOpen) return;
                    e.preventDefault();
                    this.#closeLicensePopover();
                    break;
                case TAB:
                    // Commit the highlight; no preventDefault so focus advances.
                    if (this.licenseOpen) {
                        this.selectLicenseQty(
                            opts[this.licenseHighlightedIndex],
                        );
                    }
                    return;
                default:
                    return;
            }
            this.#syncLicenseDom();
        };

        selectLicenseQty = (value) => {
            this.licenseQty = value;
            this.licenseOpen = false;
            this.#removeLicenseDocListener();
            // Route the selection through the authored quantity selector so the
            // existing merch-card → checkout-link quantity wiring stays intact.
            const qs = this.quantitySelectEl;
            if (qs) {
                qs.selectedValue = Number(value);
                qs.dispatchEvent(
                    new CustomEvent(EVENT_MERCH_QUANTITY_SELECTOR_CHANGE, {
                        detail: { option: Number(value) },
                        bubbles: true,
                    }),
                );
            }
            this.#syncLicenseDom();
        };

        #licenseOptionClass(index, opt, current) {
            return `license-select-option ${index === this.licenseHighlightedIndex ? 'highlighted' : ''}${opt === current ? ' selected' : ''}`;
        }

        // Reflect license popover state onto the existing nodes so the trigger keeps
        // focus; a full re-render would replace them.
        #syncLicenseDom() {
            const root = this.card.shadowRoot;
            const select = root?.querySelector('.license-select');
            if (!select) return;
            const open = !!this.licenseOpen;
            const current = this.currentLicenseValue;
            const label = this.licenseLabel(Number(current));
            select.toggleAttribute('data-open', open);
            const trigger = select.querySelector('.license-select-trigger');
            trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open) {
                trigger.setAttribute(
                    'aria-activedescendant',
                    `license-option-${this.licenseHighlightedIndex}`,
                );
            } else {
                trigger.removeAttribute('aria-activedescendant');
            }
            select.querySelector('.license-select-popover').hidden = !open;
            for (const el of select.querySelectorAll('.license-select-value')) {
                el.textContent = current;
            }
            for (const el of select.querySelectorAll('.license-select-label')) {
                el.textContent = label;
            }
            const opts = this.licenseOptions ?? [];
            select
                .querySelectorAll('.license-select-option')
                .forEach((li, index) => {
                    const opt = opts[index];
                    li.className = this.#licenseOptionClass(
                        index,
                        opt,
                        current,
                    );
                    li.setAttribute(
                        'aria-selected',
                        opt === current ? 'true' : 'false',
                    );
                });
            this.card.syncRenderedMarkup();
        }

        #syncExpandedDom() {
            const root = this.card.shadowRoot;
            const expanded = !!this.expanded;
            root?.querySelector('.whats-included-toggle')?.setAttribute(
                'aria-expanded',
                expanded ? 'true' : 'false',
            );
            const zone = root?.querySelector('.features-zone');
            if (zone) zone.hidden = !expanded;
            this.card.syncRenderedMarkup();
        }

        bindEvents(root) {
            const trigger = root.querySelector('.license-select-trigger');
            trigger?.addEventListener('click', this.toggleLicensePopover);
            trigger?.addEventListener('keydown', this.#handleLicenseKeydown);
            root.querySelector(
                '.license-select-popover-header',
            )?.addEventListener('click', this.toggleLicensePopover);
            const opts = this.licenseOptions ?? [];
            root.querySelectorAll('.license-select-option').forEach(
                (li, index) => {
                    li.addEventListener('click', () =>
                        this.selectLicenseQty(opts[index]),
                    );
                    li.addEventListener('mouseenter', () => {
                        this.licenseHighlightedIndex = index;
                        this.#syncLicenseDom();
                    });
                },
            );
            root.querySelector('.whats-included-toggle')?.addEventListener(
                'click',
                this.toggleExpanded,
            );
        }

        renderLicenseSelector() {
            if (!this.hasLicenseSelector) {
                return '<slot name="quantity-select"></slot>';
            }
            const opts = this.licenseOptions;
            const current = this.currentLicenseValue;
            const open = !!this.licenseOpen;
            const label = escapeHTML(this.licenseLabel(Number(current)));
            const value = escapeHTML(current);
            // The card title tells each card's dropdown apart. The title lives in
            // light DOM, so a hidden copy in this shadow root is what gets referenced.
            const product = this.card.title;
            const labelledBy = product
                ? 'license-select-product license-select-label'
                : 'license-select-label';
            return `
            <div class="license-select"${open ? ' data-open' : ''}>
                ${product ? `<span id="license-select-product" hidden>${escapeHTML(product)}</span>` : ''}
                <div
                    class="license-select-trigger"
                    role="combobox"
                    tabindex="0"
                    aria-expanded="${open ? 'true' : 'false'}"
                    aria-controls="license-popover"
                    aria-labelledby="${labelledBy}"${open ? ` aria-activedescendant="license-option-${this.licenseHighlightedIndex}"` : ''}
                >
                    <span class="license-select-trigger-text">
                        <span class="license-select-value">${value}</span>
                        <span
                            class="license-select-label"
                            id="license-select-label"
                            >${label}</span
                        >
                    </span>
                    <span
                        class="license-select-chevron"
                        aria-hidden="true"
                    ></span>
                </div>
                <ul
                    id="license-popover"
                    class="license-select-popover"
                    role="listbox"
                    aria-labelledby="${labelledBy}"
                    aria-multiselectable="false"
                    tabindex="-1"${open ? '' : ' hidden'}
                >
                    <li
                        class="license-select-popover-header"
                        aria-hidden="true"
                    >
                        <span class="license-select-trigger-text">
                            <span class="license-select-value">${value}</span>
                            <span class="license-select-label">${label}</span>
                        </span>
                        <span
                            class="license-select-chevron"
                            aria-hidden="true"
                            style="transform: rotate(180deg);"
                        ></span>
                    </li>
                    ${opts
                        .map(
                            (opt, index) => `
                            <li
                                class="${escapeHTML(this.#licenseOptionClass(index, opt, current))}"
                                id="license-option-${index}"
                                role="option"
                                aria-selected="${opt === current ? 'true' : 'false'}"
                            >
                                ${escapeHTML(opt)}
                            </li>
                        `,
                        )
                        .join('')}
                </ul>
            </div>
        `;
        }

        renderLayout() {
            const expanded = !!this.expanded;
            return `
            <div class="top-card">
                <div class="mnemonic">
                    <slot name="icons"></slot>
                    <slot name="subtitle"></slot>
                </div>
                <div class="name-description">
                    <slot name="heading-xs"></slot>
                    <slot name="body-xs"></slot>
                </div>
                <div class="pricing">
                    <div class="pricing-line">
                        <slot name="heading-m"></slot>
                        <slot name="per-unit-label"></slot>
                    </div>
                    <slot name="promo-text"></slot>
                </div>
                ${
                    this.hasLicenseSelector ||
                    this.hasCallout ||
                    this.hasQuantitySelect
                        ? `<div class="license-zone">
                          ${this.renderLicenseSelector()}
                          ${
                              this.hasCallout
                                  ? `<div class="callout">
                                    <slot name="callout-content"></slot>
                                </div>`
                                  : ''
                          }
                      </div>`
                        : ''
                }
                ${
                    this.hasAddOn
                        ? `<div
                          class="add-on"${this.addonBackground === 'grey' ? ' data-addon-grey' : ''}
                      >
                          <slot name="addon"></slot>
                      </div>`
                        : ''
                }
                <footer>
                    <slot name="footer"></slot>
                </footer>
                ${this.secureLabel}
            </div>
            ${
                this.hasWhatsIncluded
                    ? `
                      <button
                          class="whats-included-toggle"
                          type="button"
                          aria-expanded="${expanded ? 'true' : 'false'}"
                          aria-controls="features-zone"
                      >
                          <span class="whats-included-toggle-label">
                              ${escapeHTML(this.whatsIncludedToggleLabel)}
                          </span>
                          <span
                              class="whats-included-toggle-chevron"
                              aria-hidden="true"
                          ></span>
                      </button>
                      <div
                          id="features-zone"
                          class="features-zone"${expanded ? '' : ' hidden'}
                      >
                          <slot name="whats-included"></slot>
                      </div>
                  `
                    : ''
            }
            ${
                this.hasEduDisclaimer
                    ? `<div class="edu-disclaimer">
                      <slot name="edu-disclaimer"></slot>
                  </div>`
                    : ''
            }
            <slot></slot>
        `;
        }

        static templateStyle = css`
            :host([variant='pro']) {
                display: flex;
                flex-direction: column;
                background: var(
                    --consonant-merch-card-pro-frame-bg,
                    var(--consonant-merch-card-pro-bg-subtle, #f8f8f8)
                );
                border-radius: 16px;
                padding: 4px;
                box-sizing: border-box;
                overflow: hidden;
                position: relative;
                color: var(--consonant-merch-card-pro-frame-text, #000);
                /* control (dropdown) surface defaults to light; dark overrides these */
                --consonant-merch-card-pro-control-bg: var(
                    --consonant-merch-card-pro-bg-default,
                    #fff
                );
                --consonant-merch-card-pro-control-hover-bg: var(
                    --consonant-merch-card-pro-bg-subtle,
                    #f8f8f8
                );
                /* selected license option: S2A blue-900 with white text, 4.8:1
               against both the option and the text (3.9:1 on the dark popover) */
                --consonant-merch-card-pro-control-selected-bg: #3b63fb;
                --consonant-merch-card-pro-control-selected-text: #fff;
                --secure-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='currentColor'%3E%3Cpath d='M9 9.2C9 8.64844 8.55156 8.2 8 8.2C7.44844 8.2 7 8.64844 7 9.2C7 9.52207 7.16289 9.7959 7.4 9.9789V10.6C7.4 10.9312 7.66875 11.2 8 11.2C8.33125 11.2 8.6 10.9312 8.6 10.6V9.9789C8.83711 9.7959 9 9.52207 9 9.2Z'/%3E%3Cpath d='M12 5.62031V5.2C12 2.99453 10.2055 1.2 8 1.2C5.79453 1.2 4 2.99453 4 5.2V5.62031C3.10274 5.72129 2.4 6.47637 2.4 7.4V12.6C2.4 13.5922 3.20782 14.4 4.2 14.4H11.8C12.7922 14.4 13.6 13.5922 13.6 12.6V7.4C13.6 6.47637 12.8973 5.72129 12 5.62031ZM8 2.4C9.54375 2.4 10.8 3.65625 10.8 5.2V5.6H5.2V5.2C5.2 3.65625 6.45625 2.4 8 2.4ZM12.4 12.6C12.4 12.9305 12.1305 13.2 11.8 13.2H4.2C3.86953 13.2 3.6 12.9305 3.6 12.6V7.4C3.6 7.06953 3.86953 6.8 4.2 6.8H11.8C12.1305 6.8 12.4 7.06953 12.4 7.4V12.6Z'/%3E%3C/svg%3E");
            }

            :host([variant='pro'][border-color='black']) {
                --consonant-merch-card-pro-frame-bg: #000;
                --consonant-merch-card-pro-frame-text: #fff;
                --consonant-merch-card-pro-divider-color: #ffffff29;
                --consonant-merch-card-pro-subtitle-color: #000;
            }

            /* dark theme — background-color="dark" comes from the #1093 Theme picker */
            :host([variant='pro'][background-color='dark']) {
                --consonant-merch-card-pro-bg-default: #000;
                --consonant-merch-card-pro-bg-subtle: #131313;
                --consonant-merch-card-pro-frame-bg: #131313;
                --consonant-merch-card-pro-frame-text: #fff;
                --consonant-merch-card-pro-text-color: #fff;
                --consonant-merch-card-pro-text-muted-color: #ffffffa3;
                --consonant-merch-card-pro-text-inverse-color: #fff;
                --consonant-merch-card-pro-subtitle-color: #ffffffa3;
                /* lock recoloured to #a3a3a3 (white@64% on the #000 hero) */
                --secure-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23a3a3a3'%3E%3Cpath d='M9 9.2C9 8.64844 8.55156 8.2 8 8.2C7.44844 8.2 7 8.64844 7 9.2C7 9.52207 7.16289 9.7959 7.4 9.9789V10.6C7.4 10.9312 7.66875 11.2 8 11.2C8.33125 11.2 8.6 10.9312 8.6 10.6V9.9789C8.83711 9.7959 9 9.52207 9 9.2Z'/%3E%3Cpath d='M12 5.62031V5.2C12 2.99453 10.2055 1.2 8 1.2C5.79453 1.2 4 2.99453 4 5.2V5.62031C3.10274 5.72129 2.4 6.47637 2.4 7.4V12.6C2.4 13.5922 3.20782 14.4 4.2 14.4H11.8C12.7922 14.4 13.6 13.5922 13.6 12.6V7.4C13.6 6.47637 12.8973 5.72129 12 5.62031ZM8 2.4C9.54375 2.4 10.8 3.65625 10.8 5.2V5.6H5.2V5.2C5.2 3.65625 6.45625 2.4 8 2.4ZM12.4 12.6C12.4 12.9305 12.1305 13.2 11.8 13.2H4.2C3.86953 13.2 3.6 12.9305 3.6 12.6V7.4C3.6 7.06953 3.86953 6.8 4.2 6.8H11.8C12.1305 6.8 12.4 7.06953 12.4 7.4V12.6Z'/%3E%3C/svg%3E");
                /* dividers stay transparent-black-12, same as light */
                --consonant-merch-card-pro-divider-color: #0000001f;
                --consonant-merch-card-pro-cta-outline-border-color: #fff;
                /* white@64% over the #000 top-card resolves to #a3a3a3, so the
               label has to knock back to black to stay legible on it */
                --consonant-merch-card-pro-cta-outline-hover-color: #ffffffa3;
                --consonant-merch-card-pro-cta-outline-hover-text-color: #000;
                /* dropdown trigger = #131313; border keeps the light value */
                --consonant-merch-card-pro-control-bg: #131313;
                --consonant-merch-card-pro-control-hover-bg: #ffffff14;
            }

            :host([variant='pro']) .top-card {
                background: var(--consonant-merch-card-pro-bg-default, #fff);
                border-radius: 12px;
                padding: 24px;
                display: flex;
                flex-direction: column;
                gap: 24px;
                color: var(--consonant-merch-card-pro-text-color, #000);
                /* Natural height (features-zone absorbs the slack). syncHeights
               publishes the row's max .top-card height here as min-height so
               shorter cards match; content-box, so the height maps straight. */
                flex: 0 0 auto;
                min-height: var(
                    --consonant-merch-card-pro-top-card-height,
                    auto
                );
            }

            :host([variant='pro']) .mnemonic {
                display: flex;
                align-items: center;
                gap: 12px;
                min-height: var(
                    --consonant-merch-card-pro-mnemonic-height,
                    auto
                );
            }

            :host([variant='pro']) ::slotted([slot='icons']) {
                width: 24px;
                height: 24px;
            }

            :host([variant='pro']) ::slotted([slot='subtitle']) {
                margin: 0;
                font-family: 'Adobe Clean', adobe-clean, sans-serif;
                font-weight: 700;
                font-size: 16px;
                line-height: 20px;
                letter-spacing: 0;
                color: var(--consonant-merch-card-pro-subtitle-color, #000000);
                flex: 1;
            }

            :host([variant='pro']) .name-description {
                display: flex;
                flex-direction: column;
                gap: 8px;
                /* Hold the row's tallest description so the price starts at the same
               height everywhere. The slack goes to the footer margin, not here. */
                flex: 0 0 auto;
                min-height: var(
                    --consonant-merch-card-pro-name-description-height,
                    auto
                );
            }

            :host([variant='pro']) ::slotted([slot='heading-xs']) {
                margin: 0;
                font-family: 'Adobe Clean Display', 'adobe-clean-display',
                    sans-serif;
                font-weight: 900;
                font-size: 24px;
                line-height: 24px;
                letter-spacing: -0.48px;
                color: var(--consonant-merch-card-pro-text-color, #000);
            }

            :host([variant='pro']) ::slotted([slot='body-xs']) {
                margin: 0;
                font-family: 'Adobe Clean', adobe-clean, sans-serif;
                font-weight: 400;
                font-size: 14px;
                line-height: 18px;
                letter-spacing: 0;
                color: var(--consonant-merch-card-pro-text-color, #000);
            }

            :host([variant='pro']) .pricing {
                display: flex;
                flex-direction: column;
                gap: 0;
            }

            :host([variant='pro']) ::slotted([slot='heading-m']) {
                margin: 0;
                font-family: 'Adobe Clean Display', 'adobe-clean-display',
                    sans-serif;
                font-weight: 900;
                font-size: 18px;
                line-height: 21px;
                letter-spacing: -0.48px;
                color: var(--consonant-merch-card-pro-text-color, #000);
            }

            :host([variant='pro']) ::slotted([slot='promo-text']) {
                margin: 0;
                font-family: 'Adobe Clean', adobe-clean, sans-serif;
                font-weight: 400;
                font-size: 14px;
                line-height: 18px;
                letter-spacing: 0;
                color: var(
                    --consonant-merch-card-pro-text-muted-color,
                    #000000a3
                );
            }

            :host([variant='pro']) footer {
                display: flex;
                gap: 8px;
                padding: 0;
                /* Collect the white card's slack here so the CTAs and the secure line
               stay bottom-aligned while the price stays put. Same idiom as fries. */
                margin: auto 0 0;
                background: transparent;
                min-height: auto;
            }

            :host([variant='pro']) footer ::slotted([slot='footer']) {
                display: flex;
                flex-wrap: wrap;
                align-content: flex-start;
                gap: 8px;
                flex: 1;
            }

            :host([variant='pro']) .secure-transaction-label {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-family: 'Adobe Clean', adobe-clean, sans-serif;
                font-weight: 400;
                font-size: 14px;
                line-height: 18px;
                letter-spacing: 0;
                color: var(
                    --consonant-merch-card-pro-text-muted-color,
                    #000000a3
                );
                padding: 0;
                margin: 0;
                align-self: flex-start;
                flex: 0 0 auto;
                white-space: normal;
            }

            :host([variant='pro']) .secure-transaction-label::before {
                content: '';
                display: inline-block;
                width: 16px;
                height: 16px;
                /* background-image, not a mask — a mask's currentColor rendered the lock too dark */
                background-image: var(--secure-icon);
                background-repeat: no-repeat;
                background-position: center;
                background-size: contain;
            }

            :host([variant='pro']) .features-zone {
                padding: 24px;
                display: flex;
                flex-direction: column;
                gap: 24px;
                /* Grow to fill remaining height so card bottoms align across a row. */
                flex: 1 1 auto;
                color: var(--consonant-merch-card-pro-frame-text, #000);
            }

            :host([variant='pro']) .features-zone[hidden] {
                display: none;
            }

            :host([variant='pro']) ::slotted([slot='whats-included']) {
                color: inherit;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            :host([variant='pro']) .whats-included-toggle {
                all: unset;
                display: flex;
                align-items: center;
                padding: 24px;
                cursor: pointer;
                color: var(--consonant-merch-card-pro-frame-text, #000);
                font-family: 'Adobe Clean', adobe-clean, sans-serif;
                font-weight: 700;
                font-size: 14px;
                line-height: 18px;
                letter-spacing: 0;
            }

            /* Expanded state: no bottom padding — features-zone provides spacing */
            :host([variant='pro'])
                .whats-included-toggle[aria-expanded='true'] {
                padding-bottom: 0;
            }

            :host([variant='pro']) .whats-included-toggle-label {
                flex: 1 0 0;
            }

            :host([variant='pro']) .whats-included-toggle:focus-visible {
                outline: 2px solid #1473e6;
                outline-offset: -2px;
                border-radius: 8px;
            }

            :host([variant='pro']) .whats-included-toggle-chevron {
                width: 20px;
                height: 20px;
                background-color: currentColor;
                mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M10 13.5a.75.75 0 0 1-.53-.22l-5-5a.75.75 0 0 1 1.06-1.06L10 11.69l4.47-4.47a.75.75 0 0 1 1.06 1.06l-5 5a.75.75 0 0 1-.53.22Z'/%3E%3C/svg%3E")
                    center / contain no-repeat;
                -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M10 13.5a.75.75 0 0 1-.53-.22l-5-5a.75.75 0 0 1 1.06-1.06L10 11.69l4.47-4.47a.75.75 0 0 1 1.06 1.06l-5 5a.75.75 0 0 1-.53.22Z'/%3E%3C/svg%3E")
                    center / contain no-repeat;
                transition: transform 200ms ease;
                flex: 0 0 auto;
            }

            :host([variant='pro'])
                .whats-included-toggle[aria-expanded='true']
                .whats-included-toggle-chevron {
                transform: rotate(180deg);
            }

            :host([variant='pro']) .pricing-line {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: 0;
            }

            :host([variant='pro']) ::slotted([slot='per-unit-label']) {
                font-family: 'Adobe Clean Display', 'adobe-clean-display',
                    sans-serif;
                font-weight: 900;
                font-size: 18px;
                line-height: 21px;
                letter-spacing: -0.48px;
                color: var(--consonant-merch-card-pro-text-color, #000);
                margin-inline-start: 4px;
            }

            :host([variant='pro']) .license-zone {
                display: flex;
                flex-direction: column;
                background: var(--consonant-merch-card-pro-bg-subtle, #f8f8f8);
                border-radius: 8px;
                overflow: visible;
            }

            :host([variant='pro']) .license-select {
                position: relative;
                font-family: 'Adobe Clean', adobe-clean, sans-serif;
            }

            :host([variant='pro']) .license-select-trigger {
                all: unset;
                box-sizing: border-box;
                width: 100%;
                height: 40px;
                padding: 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: var(--consonant-merch-card-pro-control-bg);
                border: 1px solid rgba(0, 0, 0, 0.08);
                border-radius: 8px;
                cursor: pointer;
                color: var(--consonant-merch-card-pro-text-color, #000);
                font-family: 'Adobe Clean', adobe-clean, sans-serif;
                font-size: 14px;
                line-height: 18px;
                letter-spacing: 0;
            }

            :host([variant='pro']) .license-select-trigger:focus-visible {
                outline: 2px solid #1473e6;
                outline-offset: 1px;
            }

            /* Open, the trigger's ring escapes around the popover and doubles up
           with the active option's. Let the option carry it. */
            :host([variant='pro'])
                .license-select-trigger[aria-expanded='true']:focus-visible {
                outline: none;
            }

            :host([variant='pro']) .license-select-trigger-text {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            :host([variant='pro']) .license-select-value {
                font-weight: 700;
                color: var(--consonant-merch-card-pro-text-color, #000);
            }

            :host([variant='pro']) .license-select-label {
                font-weight: 700;
                color: var(
                    --consonant-merch-card-pro-text-muted-color,
                    rgba(0, 0, 0, 0.64)
                );
            }

            :host([variant='pro']) .license-select-chevron {
                width: 16px;
                height: 16px;
                background-color: currentColor;
                mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M10 13.5a.75.75 0 0 1-.53-.22l-5-5a.75.75 0 0 1 1.06-1.06L10 11.69l4.47-4.47a.75.75 0 0 1 1.06 1.06l-5 5a.75.75 0 0 1-.53.22Z'/%3E%3C/svg%3E")
                    center / contain no-repeat;
                -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M10 13.5a.75.75 0 0 1-.53-.22l-5-5a.75.75 0 0 1 1.06-1.06L10 11.69l4.47-4.47a.75.75 0 0 1 1.06 1.06l-5 5a.75.75 0 0 1-.53.22Z'/%3E%3C/svg%3E")
                    center / contain no-repeat;
                transition: transform 200ms ease;
                flex: 0 0 auto;
            }

            :host([variant='pro'])
                .license-select-trigger[aria-expanded='true']
                .license-select-chevron {
                transform: rotate(180deg);
            }

            :host([variant='pro']) .license-select-popover {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                margin: 0;
                padding: 0;
                list-style: none;
                background: var(--consonant-merch-card-pro-control-bg);
                border: 1px solid rgba(0, 0, 0, 0.08);
                border-radius: 8px;
                box-shadow:
                    0 7px 15px rgba(0, 0, 0, 0.1),
                    0 27px 27px rgba(0, 0, 0, 0.09),
                    0 61px 36px rgba(0, 0, 0, 0.05),
                    0 108px 43px rgba(0, 0, 0, 0.01);
                overflow: hidden;
                z-index: 10;
            }

            :host([variant='pro']) .license-select-popover[hidden] {
                display: none;
            }

            /* Mirror the collapsed trigger so open/close is seamless: 39px (trigger
           40px − the popover's 1px top border) with the trigger's 12px padding. */
            :host([variant='pro']) .license-select-popover-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                height: 39px;
                box-sizing: border-box;
                padding: 12px;
                border-bottom: 1px solid rgba(0, 0, 0, 0.08);
                font-family: 'Adobe Clean', adobe-clean, sans-serif;
                font-size: 14px;
                line-height: 18px;
                font-weight: 700;
                letter-spacing: 0;
                cursor: pointer;
                background: var(--consonant-merch-card-pro-control-bg);
            }

            :host([variant='pro']) .license-select-option {
                padding: 16px 12px;
                cursor: pointer;
                color: var(--consonant-merch-card-pro-text-color, #000);
                font-family: 'Adobe Clean', adobe-clean, sans-serif;
                font-size: 14px;
                line-height: 18px;
                font-weight: 700;
                letter-spacing: 0;
                border-bottom: 1px solid rgba(0, 0, 0, 0.08);
            }

            /* An outline follows its own element's radius, so square corners got
           clipped by the popover. Match its inner radius (8px less the border). */
            :host([variant='pro']) .license-select-option:last-child {
                border-bottom: none;
                border-bottom-left-radius: 7px;
                border-bottom-right-radius: 7px;
            }

            :host([variant='pro']) .license-select-option:hover,
            :host([variant='pro']) .license-select-option.highlighted {
                background: var(--consonant-merch-card-pro-control-hover-bg);
            }

            /* The selected option has to stand out from the rest at 3:1, not just
           from the white popover by a shade (WCAG 1.4.11). After :hover so a
           hovered selected row stays blue. */
            :host([variant='pro']) .license-select-option.selected {
                background: var(--consonant-merch-card-pro-control-selected-bg);
                color: var(--consonant-merch-card-pro-control-selected-text);
            }

            /* Focus stays on the trigger, so the highlighted option needs its own
           visible ring (WCAG 2.4.7). */
            :host([variant='pro']) .license-select-option.highlighted {
                outline: 2px solid #1473e6;
                outline-offset: -2px;
            }

            /* The blue ring disappears on the blue selected row, so draw it white
           and inset it to keep blue on both sides. */
            :host([variant='pro']) .license-select-option.selected.highlighted {
                outline-color: var(
                    --consonant-merch-card-pro-control-selected-text
                );
                outline-offset: -4px;
            }

            :host([variant='pro']) .callout {
                padding: 8px 12px 12px 12px;
                color: var(--consonant-merch-card-pro-text-color, #000);
                font-family: 'Adobe Clean', adobe-clean, sans-serif;
                font-size: 12px;
                line-height: 16px;
                letter-spacing: 0;
                font-weight: 700;
                text-align: start;
            }

            :host([variant='pro']) ::slotted([slot='callout-content']) {
                margin: 0;
            }

            :host([variant='pro']) .add-on {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 16px 12px;
                /* Gradient border: white fill on padding-box, gradient on border-box
               so only the 1px border shows it. */
                background:
                    linear-gradient(
                            var(--consonant-merch-card-pro-bg-default, #fff),
                            var(--consonant-merch-card-pro-bg-default, #fff)
                        )
                        padding-box,
                    linear-gradient(
                            45deg,
                            #8d88f2 0%,
                            #8d88f2 48.8%,
                            #eb1000 100%
                        )
                        border-box;
                border: 1px solid transparent;
                border-radius: 8px;
                box-sizing: border-box;
            }

            /* Grey add-on style (MWPW-208925): flat light-grey frame, no AI
           gradient — the sparkle goes with it since it is a gradient asset. */
            :host([variant='pro']) .add-on[data-addon-grey] {
                background: var(--consonant-merch-card-pro-bg-default, #fff);
                border: 1px solid #e4e4e4;
            }

            :host([variant='pro']) .add-on[data-addon-grey]::after {
                display: none;
            }

            :host([variant='pro']) .add-on::after {
                content: '';
                width: 16px;
                height: 16px;
                flex: 0 0 auto;
                /* Vertical red→purple sparkle (red on top, per the flipped asset). */
                background: linear-gradient(180deg, #eb1000 0%, #8d88f2 100%);
                mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M7.498 15.61C6.369 11.154 4.842 9.627 .39 8.502c-.52-.133-.52-.871 0-1.004C4.846 6.37 6.373 4.842 7.498 .39c.133-.52.871-.52 1.004 0C9.63 4.846 11.158 6.373 15.61 7.498c.52.133.52.871 0 1.004C11.154 9.63 9.627 11.158 8.502 15.61c-.133.52-.871.52-1.004 0Z'/%3E%3C/svg%3E")
                    center / contain no-repeat;
                -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M7.498 15.61C6.369 11.154 4.842 9.627 .39 8.502c-.52-.133-.52-.871 0-1.004C4.846 6.37 6.373 4.842 7.498 .39c.133-.52.871-.52 1.004 0C9.63 4.846 11.158 6.373 15.61 7.498c.52.133.52.871 0 1.004C11.154 9.63 9.627 11.158 8.502 15.61c-.133.52-.871.52-1.004 0Z'/%3E%3C/svg%3E")
                    center / contain no-repeat;
            }

            /* C2 desktop breakpoint: toggle disappears, features-zone is always visible inline */
            @media screen and (--c2-desktop-up) {
                :host([variant='pro']) .whats-included-toggle {
                    display: none;
                }
                :host([variant='pro']) .features-zone[hidden] {
                    display: flex;
                }
            }

            /* EDU (Wide): standalone two-column card — pricing left, features
           right, always shown. Stacks vertically below tablet. */
            :host([variant='pro'][size='edu']) .whats-included-toggle {
                display: none;
            }

            :host([variant='pro'][size='edu']) .features-zone[hidden] {
                display: flex;
            }

            :host([variant='pro'][size='edu']) footer {
                margin: unset;
            }

            @media screen and (--tablet-up) {
                :host([variant='pro'][size='edu']) {
                    flex-direction: row;
                    gap: 8px;
                }

                :host([variant='pro'][size='edu']) .top-card,
                :host([variant='pro'][size='edu']) .features-zone {
                    flex: 1 1 50%;
                    min-width: 0;
                    /* border-box so the 40px vs 24px padding delta doesn't skew
                   the split — Figma has equal 526+526 total column widths. */
                    box-sizing: border-box;
                }

                /* EDU right panel padding is 40px at tablet+; mobile keeps the base
               24px (Figma 4375:120476 desktop / 4375:120499 mobile). */
                :host([variant='pro'][size='edu']) .features-zone {
                    padding: 40px;
                }

                /* edu is a standalone card, not a grid row, so the price shouldn't
               stick to the bottom. Stop .name-description from absorbing the
               slack (from the 50/50 stretch) — pack content to the top per
               Figma (Top of Card primaryAxisAlign=MIN), slack falls to the
               bottom. */
                :host([variant='pro'][size='edu']) .name-description {
                    flex: 0 0 auto;
                }
            }
        `;
    }
    return {
        pro: {
            class: Pro,
            fragmentMapping: PRO_AEM_FRAGMENT_MAPPING,
            style: Pro.templateStyle,
        },
    };
}
