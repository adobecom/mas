class MasGallery extends HTMLElement {
    constructor() {
        super();
    }
    
    render() {
        return html`<div>I am gallery</div> `;
    }
}

customElements.define('mas-gallery', MasGallery);
