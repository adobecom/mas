import { html } from 'lit';

// MASA mascot avatar (animated "typing" loop) for the chat fab and message
// bubbles. Shipped as a committed WebP next to this module and referenced via
// import.meta.url so the path resolves under any studio deploy base (local
// aem up, branch aem.live, prod). It is ~140KB — too large to inline as a data
// URI like the static icons in this folder, and loads on demand when the chat
// UI renders rather than bloating the module.
const masaAvatarSrc = new URL('./masa-typing.webp', import.meta.url).href;

export const masaAvatar = html`<img class="masa-avatar-img" src="${masaAvatarSrc}" alt="MASA" />`;
