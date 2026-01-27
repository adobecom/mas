import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

export const ICON_LIBRARY = [
    { id: 'sp-icon-star', name: 'Star' },
    { id: 'sp-icon-ribbon', name: 'Ribbon' },
    { id: 'sp-icon-web-page', name: 'Web page' },
    { id: 'sp-icon-upload-to-cloud', name: 'Upload to cloud' },
    { id: 'sp-icon-lightbulb', name: 'Lightbulb' },
    { id: 'sp-icon-contrast', name: 'Contrast' },
];

export const renderSpIcon = (iconName) => {
    return html`${unsafeHTML(`<${iconName}></${iconName}>`)}`;
};
