var n=Object.defineProperty;var p=(i,t,o)=>t in i?n(i,t,{enumerable:!0,configurable:!0,writable:!0,value:o}):i[t]=o;var s=(i,t,o)=>p(i,typeof t!="symbol"?t+"":t,o);import{LitElement as c,html as l,css as h}from"./lit-all.min.js";function d(){return customElements.get("sp-tooltip")!==void 0&&customElements.get("overlay-trigger")!==void 0&&document.querySelector("sp-theme")!==null}var e=class e extends c{constructor(){super(),this.content="",this.placement="top",this.variant="info",this.size="xs",this.tooltipVisible=!1,this.supportsHover=window.matchMedia("(hover: hover)").matches,this.handleClickOutside=this.handleClickOutside.bind(this)}connectedCallback(){super.connectedCallback(),window.addEventListener("mousedown",this.handleClickOutside)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("mousedown",this.handleClickOutside)}handleClickOutside(t){let o=t.composedPath();e.activeTooltip===this&&!o.includes(this)&&this.hideTooltip()}showTooltip(){e.activeTooltip&&e.activeTooltip!==this&&(e.activeTooltip.closeOverlay(),e.activeTooltip.tooltipVisible=!1,e.activeTooltip.requestUpdate()),e.activeTooltip=this,this.tooltipVisible=!0}hideTooltip(){e.activeTooltip===this&&(e.activeTooltip=null),this.tooltipVisible=!1}handleTap(t){t.preventDefault(),this.tooltipVisible?this.hideTooltip():this.showTooltip()}closeOverlay(){let t=this.shadowRoot?.querySelector("overlay-trigger");t?.open!==void 0&&(t.open=!1)}get effectiveContent(){return this.tooltipText||this.mnemonicText||this.content||""}get effectivePlacement(){return this.tooltipPlacement||this.mnemonicPlacement||this.placement||"top"}renderIcon(){return this.src?l`<merch-icon
            src="${this.src}"
            size="${this.size}"
        ></merch-icon>`:l`<slot></slot>`}render(){let t=this.effectiveContent,o=this.effectivePlacement;return t?d()?l`
                <overlay-trigger
                    placement="${o}"
                    @sp-opened=${()=>this.showTooltip()}
                >
                    <span slot="trigger">${this.renderIcon()}</span>
                    <sp-tooltip
                        placement="${o}"
                        variant="${this.variant}"
                    >
                        ${t}
                    </sp-tooltip>
                </overlay-trigger>
            `:l`
                <span
                    class="css-tooltip ${o} ${this.tooltipVisible?"tooltip-visible":""}"
                    data-tooltip="${t}"
                    tabindex="0"
                    role="img"
                    aria-label="${t}"
                    @pointerenter=${this.supportsHover?()=>this.showTooltip():null}
                    @pointerleave=${this.supportsHover?()=>this.hideTooltip():null}
                    @click=${this.supportsHover?null:a=>this.handleTap(a)}
                    @focus=${()=>this.showTooltip()}
                    @blur=${()=>this.hideTooltip()}
                >
                    ${this.renderIcon()}
                </span>
            `:this.renderIcon()}};s(e,"activeTooltip",null),s(e,"properties",{content:{type:String},placement:{type:String},variant:{type:String},src:{type:String},size:{type:String},tooltipText:{type:String,attribute:"tooltip-text"},tooltipPlacement:{type:String,attribute:"tooltip-placement"},mnemonicText:{type:String,attribute:"mnemonic-text"},mnemonicPlacement:{type:String,attribute:"mnemonic-placement"},tooltipVisible:{type:Boolean,state:!0},supportsHover:{type:Boolean,state:!0}}),s(e,"styles",h`
        :host {
            display: contents;
            overflow: visible;
        }

        /* CSS tooltip styles - these are local fallbacks, main styles in global.css.js */
        .css-tooltip {
            position: relative;
            display: inline-block;
            cursor: pointer;
        }

        .css-tooltip[data-tooltip]::before {
            content: attr(data-tooltip);
            position: absolute;
            z-index: 999;
            background: var(--spectrum-gray-800, #323232);
            color: #fff;
            padding: 8px 12px;
            border-radius: 4px;
            white-space: normal;
            width: max-content;
            max-width: 60px;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition:
                opacity 1s ease,
                visibility 1s ease;
            font-size: 12px;
            line-height: 1.4;
            text-align: center;
        }

        .css-tooltip[data-tooltip]::after {
            content: '';
            position: absolute;
            z-index: 999;
            width: 0;
            height: 0;
            border: 6px solid transparent;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition:
                opacity 0.2s ease,
                visibility 0.2s ease;
        }

        .css-tooltip.tooltip-visible[data-tooltip]::before,
        .css-tooltip.tooltip-visible[data-tooltip]::after,
        .css-tooltip:focus[data-tooltip]::before,
        .css-tooltip:focus[data-tooltip]::after {
            opacity: 1;
            visibility: visible;
        }

        /* Position variants */
        .css-tooltip.top[data-tooltip]::before {
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 16px;
        }

        .css-tooltip.top[data-tooltip]::after {
            top: -80%;
            left: 50%;
            transform: translateX(-50%);
            border-color: var(--spectrum-gray-800, #323232) transparent
                transparent transparent;
        }

        .css-tooltip.bottom[data-tooltip]::before {
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 10px;
        }

        .css-tooltip.bottom[data-tooltip]::after {
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 5px;
            border-bottom-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip.left[data-tooltip]::before {
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-right: 10px;
            left: var(--tooltip-left-offset, auto);
        }

        .css-tooltip.left[data-tooltip]::after {
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-right: 5px;
            border-left-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip.right[data-tooltip]::before {
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-left: 10px;
        }

        .css-tooltip.right[data-tooltip]::after {
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-left: 5px;
            border-right-color: var(--spectrum-gray-800, #323232);
        }
    `);var r=e;customElements.define("mas-mnemonic",r);export{r as default};
