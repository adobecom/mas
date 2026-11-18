// Injected in both hosts (merch-card and mas-field import plan-type-text.js): keep
// the marker inline within its copy, and keep it visible over the consumer's
// `span[is='inline-price'] { visibility: hidden }` guard. Higher specificity
// wins regardless of stylesheet order.
export const CSS = `
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;
