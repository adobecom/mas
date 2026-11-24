import { html } from 'lit';

// MASA brand mark for the AI Assistant side-nav entry. Mirrors the custom
// SVG-icon modules in this folder (content-icon.js, ost-icon.js): a plain Lit
// template exported as a const. Strokes use currentColor so the side-nav item's
// ::slotted color rules tint it (grey, white when selected), and slot="icon"
// drops it straight into the item's icon slot like the sp-icon it replaced.
export const masaIcon = html`
    <svg
        slot="icon"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="MASA"
    >
        <path d="M3 7.25C3 4.1 6.1 1.75 10 1.75s7 2.35 7 5.5" />
        <rect x="1.75" y="7.25" width="2.5" height="4" rx="1.1" />
        <rect x="15.75" y="7.25" width="2.5" height="4" rx="1.1" />
        <path d="M6.5 7.75q.75-1.25 1.5 0m3 0q.75-1.25 1.5 0M8 9.75q1.5 1.5 3 0m5.5 1.5q-.25 1.25-2.5 1.25" />
        <path d="M2.85 12.75h7.85a1 1 0 0 1 .98.8l.82 4.2H3.65a1 1 0 0 1-.98-.8l-.8-3a1 1 0 0 1 .98-1.2Z" />
        <path d="M16.5 14v1.5a2.25 2.25 0 0 1-2.25 2.25H12.5" />
    </svg>
`;
