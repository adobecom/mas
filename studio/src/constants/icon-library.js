import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

export const ICON_LIBRARY = [
    { id: 'sp-icon-star', name: 'Star' },
    { id: 'sp-icon-ribbon', name: 'Ribbon' },
    { id: 'sp-icon-page-rule', name: 'Page rule' },
    { id: 'sp-icon-upload-to-cloud', name: 'Upload to cloud' },
    { id: 'sp-icon-upload-to-cloud-outline', name: 'Upload to cloud outline' },
    { id: 'sp-icon-learn', name: 'Learn' },
    { id: 'sp-icon-data-correlated', name: 'Data correlated' },
];

export const renderSpIcon = (iconName) => {
    return html`<sp-theme color="light" scale="medium" system="spectrum"
        >${unsafeHTML(`<${iconName}></${iconName}>`)}</sp-theme
    >`;
};
