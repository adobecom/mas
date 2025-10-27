import { LitElement, html, css } from 'lit';

class MasLoader extends LitElement {
    static styles = css`
        sp-popover {
            position: fixed;
            bottom: 40px;
            right: 40px;
            padding: 8px;
        }

        sp-progress-circle {
            --spectrum-progress-circle-size: 40px;
        }
    `;

    render() {
        return html`<sp-popover open><sp-progress-circle indeterminate size="l"></sp-progress-circle></sp-popover>`;
    }
}

customElements.define('mas-loader', MasLoader);
