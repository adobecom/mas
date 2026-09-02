import { TABLET_UP, DESKTOP_UP, MOBILE_LANDSCAPE } from '../media.js';
export const CSS = `
:root {
  --consonant-merch-card-segment-width: 378px;
}

merch-card[variant="segment"] {
  max-width: var(--consonant-merch-card-segment-width);
}

/* grid style for segment */
.one-merch-card.segment,
.two-merch-cards.segment,
.three-merch-cards.segment,
.four-merch-cards.segment,
.one-merch-card:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))),
.two-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))),
.three-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))),
.four-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))) {
  grid-template-columns: minmax(276px, var(--consonant-merch-card-segment-width));
}

/* Sections inside tabs/fragments that don't receive the .segment class.
   Make .content wrapper transparent so the section grid applies directly to cards.
   Only when every card in the section is a segment card - otherwise a mixed
   section (e.g. segment cards with one product card) would have its layout
   hijacked by this fallback despite already having an explicit variant class. */
.one-merch-card:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))) .content,
.two-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))) .content,
.three-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))) .content,
.four-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))) .content {
  display: contents;
}

.one-merch-card.section merch-card[variant="segment"],
.one-merch-card:has(merch-card[variant="segment"]) merch-card[variant="segment"] {
    margin: 0 auto;
}

.three-merch-cards.section merch-card[variant="segment"],
.four-merch-cards.section merch-card[variant="segment"],
.three-merch-cards:has(merch-card[variant="segment"]) merch-card[variant="segment"],
.four-merch-cards:has(merch-card[variant="segment"]) merch-card[variant="segment"] {
    max-width: 302px;
}

/* A non-segment card (e.g. variant="product") mixed into an explicitly
   segment-classed section should still size like its segment siblings
   instead of using its own variant's fixed width. */
.one-merch-card.segment merch-card:not([variant="segment"]),
.two-merch-cards.segment merch-card:not([variant="segment"]),
.three-merch-cards.segment merch-card:not([variant="segment"]),
.four-merch-cards.segment merch-card:not([variant="segment"]) {
    width: auto;
    max-width: var(--consonant-merch-card-segment-width);
}

/* Mobile */
@media screen and ${MOBILE_LANDSCAPE} {
  :root {
    --consonant-merch-card-segment-width: 276px;
  }
}

@media screen and ${TABLET_UP} {
  :root {
    --consonant-merch-card-segment-width: 276px;
  }

  .two-merch-cards.segment,
  .three-merch-cards.segment,
  .four-merch-cards.segment,
  .two-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))),
  .three-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))),
  .four-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))) {
      grid-template-columns: repeat(2, minmax(302px, var(--consonant-merch-card-segment-width)));
  }
}

/* desktop */
@media screen and ${DESKTOP_UP} {
  :root {
    --consonant-merch-card-segment-width: 276px;
  }

  .three-merch-cards.segment,
  .three-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))) {
      grid-template-columns: repeat(3, minmax(276px, var(--consonant-merch-card-segment-width)));
  }

  .four-merch-cards.segment,
  .four-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))) {
      grid-template-columns: repeat(4, minmax(276px, var(--consonant-merch-card-segment-width)));
  }
}

merch-card[variant="segment"] [slot='callout-content'] > div > div,
merch-card[variant="segment"] [slot="callout-content"] > p {
    position: relative;
    padding: 2px 10px 3px;
    background: #D9D9D9;
    color: var(--text-color);
}

merch-card[variant="segment"] [slot="callout-content"] > p:has(> .icon-button) {
  padding-inline-end: 36px;
}

merch-card[variant="segment"] a.spectrum-Link--secondary {
  color: inherit;
}

merch-card[variant="segment"][id] span[data-template="legal"] {
    display: block;
    color: var(----merch-color-grey-80);
    font-size: 14px;
    font-style: italic;
    font-weight: 400;
    line-height: 21px;
}

merch-card[variant="segment"][id] .price-unit-type:not(.disabled)::before {
    content: "";
}

merch-card[variant="segment"][id] .price-legal .price-unit-type:not(.disabled)::after {
  content: "\\00a0";
}

merch-card[variant="segment"] [slot="footer"] a.con-button.primary {
    border: 2px solid var(--text-color);
    color: var(--text-color);
}

merch-card[variant="segment"] [slot="footer"] a.con-button.primary:hover {
    background-color: var(--color-black);
    border-color: var(--color-black);
    color: var(--color-white);
}

merch-card-collection.segment merch-card {
    width: auto;
    height: 100%;
}
`;
