import { html, css, LitElement } from 'lit';

class MasFilterPanel extends LitElement {
    static styles = css`
        :host {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 10px;
            align-self: flex-end;
        }
        sp-picker {
            width: 150px;
        }
    `;

    render() {
        return html`
            <sp-picker label="Offer Type" selected="None">
                <sp-menu-item>Base</sp-menu-item>
                <sp-menu-item>Trial</sp-menu-item>
                <sp-menu-item>Promotion</sp-menu-item>
            </sp-picker>

            <sp-picker label="Plan Type">
                <sp-menu-item>All</sp-menu-item>
                <sp-menu-item>ABM</sp-menu-item>
                <sp-menu-item>PUF</sp-menu-item>
                <sp-menu-item>M2M</sp-menu-item>
                <sp-menu-item>P3Y</sp-menu-item>
                <sp-menu-item>Perpetual</sp-menu-item>
            </sp-picker>

            <sp-picker label="Country">
                <sp-menu-item>United States</sp-menu-item>
                <sp-menu-item>United Kingdom</sp-menu-item>
                <sp-menu-item>Canada</sp-menu-item>
                <sp-menu-item>Australia</sp-menu-item>
            </sp-picker>

            <sp-picker label="Market Segment">
                <sp-menu-item>Individual</sp-menu-item>
                <sp-menu-item>Team</sp-menu-item>
            </sp-picker>

            <sp-picker label="Tags">
                <sp-menu-item>black-friday-2024</sp-menu-item>
                <sp-menu-item>cyber-monday-2024</sp-menu-item>
            </sp-picker>
        `;
    }
}

customElements.define('mas-filter-panel', MasFilterPanel);
