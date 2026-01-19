import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

export const ICON_LIBRARY = [
    { id: 'sp-icon-star', name: 'Star' },
    { id: 'sp-icon-star-outline', name: 'Star Outline' },
    { id: 'sp-icon-ribbon', name: 'Ribbon' },
];

export const renderSpIcon = (iconName) => {
    return html`${unsafeHTML(`<${iconName}></${iconName}>`)}`;
};
