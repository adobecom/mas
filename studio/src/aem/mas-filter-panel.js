import { html, css, LitElement } from 'lit';

class MasFilterPanel extends LitElement {
    static styles = css`
        :host {
            display: flex;
        }

        #filters-panel {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;

            & aem-tag-picker-field,
            sp-picker {
                width: 150px;
            }
        }

        #filters-label {
            color: var(--spectrum-gray-600);
        }
    `;

    render() {
        return html`
            <div id="filters-panel">
                <span id="filters-label">Filters</span>
                <sp-picker label="Product" selected="None">
                    <sp-menu-item>Adobe Color</sp-menu-item>
                    <sp-menu-item>Adobe Express</sp-menu-item>
                    <sp-menu-item>Adobe Firefly</sp-menu-item>
                    <sp-menu-item>Adobe Fonts</sp-menu-item>
                    <sp-menu-item>Adobe Fresco</sp-menu-item>
                    <sp-menu-item>Adobe Stock</sp-menu-item>
                </sp-picker>

                <sp-picker label="Customer Segment">
                    <sp-menu-item>Enterprise</sp-menu-item>
                    <sp-menu-item>Individual</sp-menu-item>
                    <sp-menu-item>Team</sp-menu-item>
                </sp-picker>

                <sp-picker label="Offer Type" selected="None">
                    <sp-menu-item>Base</sp-menu-item>
                    <sp-menu-item>Promotion</sp-menu-item>
                    <sp-menu-item>Trial</sp-menu-item>
                </sp-picker>

                <sp-picker label="Plan Type">
                    <sp-menu-item>All</sp-menu-item>
                    <sp-menu-item>ABM</sp-menu-item>
                    <sp-menu-item>PUF</sp-menu-item>
                    <sp-menu-item>M2M</sp-menu-item>
                    <sp-menu-item>P3Y</sp-menu-item>
                    <sp-menu-item>Perpetual</sp-menu-item>
                </sp-picker>

                <sp-picker label="Market Segment">
                    <sp-menu-item>Com</sp-menu-item>
                    <sp-menu-item>Edu</sp-menu-item>
                    <sp-menu-item>Gov</sp-menu-item>
                </sp-picker>

                <sp-picker label="Country">
                    <sp-menu-item>United States</sp-menu-item>
                    <sp-menu-item>United Kingdom</sp-menu-item>
                    <sp-menu-item>Canada</sp-menu-item>
                    <sp-menu-item>Australia</sp-menu-item>
                </sp-picker>
            </div>
        `;
    }
}

customElements.define('mas-filter-panel', MasFilterPanel);
