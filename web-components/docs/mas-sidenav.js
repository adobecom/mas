class MasSidenav extends HTMLElement {
    constructor() {
        super();
        this.classList.add('sidenav');

        this.innerHTML = `
      <a href="/web-components/docs/mas.html">Home</a>
      <a href="/web-components/docs/mas.js.html">mas.js</a>
      <a href="/web-components/docs/step-by-step.html">Step By Step - Enable M@S</a>
      <a href="/web-components/docs/checkout-link.html">Checkout Link</a>
      <a href="/web-components/docs/checkout-button.html">Checkout Button</a>
      <a href="/web-components/docs/inline-price.html">Inline Price</a>
      <a href="/web-components/docs/merch-card.html">Merch Card</a>
      <a href="/web-components/docs/ccd.html">CCD Gallery</a>
      <a href="/web-components/docs/adobe-home.html">Adobe Home Gallery</a>
      <a href="/web-components/docs/plans.html">Plans Gallery</a>
      <a href="/web-components/docs/benchmarks.html">Benchmarks</a>
    `;
    }
}

customElements.define('mas-sidenav', MasSidenav, { extends: 'aside' });
