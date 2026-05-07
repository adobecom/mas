var c=Object.defineProperty;var h=(s,t,i)=>t in s?c(s,t,{enumerable:!0,configurable:!0,writable:!0,value:i}):s[t]=i;var n=(s,t,i)=>h(s,typeof t!="symbol"?t+"":t,i);import{LitElement as m,html as l,css as d}from"./lit-all.min.js";import{unsafeHTML as a}from"./lit-all.min.js";function f(){return customElements.get("sp-tooltip")!==void 0&&customElements.get("overlay-trigger")!==void 0&&document.querySelector("sp-theme")!==null}var e=class e extends m{constructor(){super(),this.content="",this.placement="top",this.variant="info",this.size="xs",this.tooltipVisible=!1,this.lastPointerType=null,this.handleClickOutside=this.handleClickOutside.bind(this)}connectedCallback(){super.connectedCallback(),window.addEventListener("mousedown",this.handleClickOutside)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("mousedown",this.handleClickOutside)}handleClickOutside(t){let i=t.composedPath();e.activeTooltip===this&&!i.includes(this)&&this.hideTooltip()}showTooltip(){e.activeTooltip&&e.activeTooltip!==this&&(e.activeTooltip.closeOverlay(),e.activeTooltip.tooltipVisible=!1,e.activeTooltip.requestUpdate()),e.activeTooltip=this,this.tooltipVisible=!0}hideTooltip(){e.activeTooltip===this&&(e.activeTooltip=null),this.tooltipVisible=!1}handleTap(t){t.preventDefault(),this.tooltipVisible?this.hideTooltip():this.showTooltip()}closeOverlay(){let t=this.shadowRoot?.querySelector("overlay-trigger");t?.open!==void 0&&(t.open=!1)}get effectiveContent(){return this.tooltipText||this.mnemonicText||this.content||""}get effectivePlacement(){return this.tooltipPlacement||this.mnemonicPlacement||this.placement||"top"}renderIcon(){return this.src?l`<merch-icon
            src="${this.src}"
            size="${this.size}"
        ></merch-icon>`:l`<slot></slot>`}render(){let t=this.effectiveContent,i=this.effectivePlacement;if(!t)return this.renderIcon();if(f())return l`
                <overlay-trigger
                    placement="${i}"
                    @sp-opened=${()=>this.showTooltip()}
                >
                    <span slot="trigger">${this.renderIcon()}</span>
                    <sp-tooltip
                        placement="${i}"
                        variant="${this.variant}"
                    >
                        ${a(t)}
                    </sp-tooltip>
                </overlay-trigger>
            `;{let p=t.replace(/<[^>]*>/g,"");return l`
                <span
                    class="css-tooltip ${i} ${this.tooltipVisible?"tooltip-visible":""}"
                    tabindex="0"
                    role="img"
                    aria-label="${p}"
                    @pointerdown=${o=>{this.lastPointerType=o.pointerType}}
                    @pointerenter=${o=>o.pointerType!=="touch"&&this.showTooltip()}
                    @pointerleave=${o=>o.pointerType!=="touch"&&this.hideTooltip()}
                    @click=${o=>{this.lastPointerType==="touch"&&this.handleTap(o),this.lastPointerType=null}}
                >
                    ${this.renderIcon()}
                    <span class="tooltip-content">${a(t)}</span>
                </span>
            `}}};n(e,"activeTooltip",null),n(e,"properties",{content:{type:String},placement:{type:String},variant:{type:String},src:{type:String},size:{type:String},tooltipText:{type:String,attribute:"tooltip-text"},tooltipPlacement:{type:String,attribute:"tooltip-placement"},mnemonicText:{type:String,attribute:"mnemonic-text"},mnemonicPlacement:{type:String,attribute:"mnemonic-placement"},tooltipVisible:{type:Boolean,state:!0}}),n(e,"styles",d`
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

        .css-tooltip .tooltip-content {
            position: absolute;
            z-index: 999;
            background: var(--spectrum-gray-800, #323232);
            color: #fff;
            padding: var(--mas-mnemonic-tooltip-padding, 8px 12px);
            border-radius: 4px;
            white-space: normal;
            width: max-content;
            max-width: 60px;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition:
                opacity 0.2s ease,
                visibility 0.2s ease;
            font-size: 12px;
            line-height: 1.4;
            text-align: center;
        }

        .css-tooltip::after {
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
                opacity 0.1s ease,
                visibility 0.1s ease;
        }

        .css-tooltip.tooltip-visible .tooltip-content,
        .css-tooltip.tooltip-visible::after,
        .css-tooltip:focus-visible .tooltip-content,
        .css-tooltip:focus-visible::after {
            opacity: 1;
            visibility: visible;
        }

        /* Position variants */
        .css-tooltip.top .tooltip-content {
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 16px;
        }

        .css-tooltip.top::after {
            top: -80%;
            left: 50%;
            transform: translateX(-50%);
            border-color: var(--spectrum-gray-800, #323232) transparent
                transparent transparent;
        }

        .css-tooltip.bottom .tooltip-content {
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 10px;
        }

        .css-tooltip.bottom::after {
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 5px;
            border-bottom-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip.left .tooltip-content {
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-right: 10px;
            left: var(--tooltip-left-offset, auto);
        }

        .css-tooltip.left::after {
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-right: 5px;
            border-left-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip.right .tooltip-content {
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-left: 10px;
        }

        .css-tooltip.right::after {
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-left: 5px;
            border-right-color: var(--spectrum-gray-800, #323232);
        }
    `);var r=e;customElements.define("mas-mnemonic",r);export{r as default};
