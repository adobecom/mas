/**
 * Tag for static CSS kept inline in a component file. The build and the test
 * runner (css-loader.mjs) replace each css`...` with its minified text, so the
 * result is a plain string. Interpolations aren't supported; use the
 * @custom-media breakpoints from media.css, e.g. @media (--tablet-up).
 */
/* c8 ignore next */
export const css = ([text]) => text;
