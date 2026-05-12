var $=Object.defineProperty;var S=(h,e,t)=>e in h?$(h,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):h[e]=t;var b=(h,e,t)=>S(h,typeof e!="symbol"?e+"":e,t);import{LitElement as P,html as g,css as C}from"./lit-all.min.js";import{unsafeHTML as w}from"./lit-all.min.js";function O(){return customElements.get("sp-tooltip")!==void 0&&customElements.get("overlay-trigger")!==void 0&&document.querySelector("sp-theme")!==null}var i=class i extends P{constructor(){super(),this.content="",this.placement="top",this.variant="info",this.size="xs",this.tooltipVisible=!1,this.lastPointerType=null,this.handleClickOutside=this.handleClickOutside.bind(this),this._tooltipTop=0,this._tooltipLeft=0,this._arrowOffset=0,this._computedPlacement="top"}connectedCallback(){super.connectedCallback(),window.addEventListener("mousedown",this.handleClickOutside)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("mousedown",this.handleClickOutside)}handleClickOutside(e){let t=e.composedPath();i.activeTooltip===this&&!t.includes(this)&&this.hideTooltip()}_computeTooltipPosition(){let e=this.shadowRoot?.querySelector(".css-tooltip");if(!e)return;let t=e.getBoundingClientRect(),f=window.innerWidth,d=window.innerHeight,s=14,T=200,x=60,c=this.shadowRoot?.querySelector(".css-tooltip-body"),o=c?c.offsetWidth:T,p=c?c.offsetHeight:x,n=this.effectivePlacement;n==="top"&&t.top-p-s<0?n="bottom":n==="bottom"&&t.bottom+p+s>d?n="top":n==="left"&&t.left-o-s<0?n="right":n==="right"&&t.right+o+s>f&&(n="left");let u=t.left+t.width/2,y=t.top+t.height/2,l=6,r,a,m;n==="top"?(r=t.top-p-s,a=Math.max(0,Math.min(f-o,u-o/2)),m=Math.max(l,Math.min(o-l*2,u-a-l))):n==="bottom"?(r=t.bottom+s,a=Math.max(0,Math.min(f-o,u-o/2)),m=Math.max(l,Math.min(o-l*2,u-a-l))):n==="left"?(a=t.left-o-s,r=Math.max(0,Math.min(d-p,y-p/2)),m=Math.max(l,Math.min(p-l*2,y-r-l))):(a=t.right+s,r=Math.max(0,Math.min(d-p,y-p/2)),m=Math.max(l,Math.min(p-l*2,y-r-l))),this._tooltipTop=r,this._tooltipLeft=a,this._arrowOffset=m,this._computedPlacement=n,this._anchorRect=t}showTooltip(){i.activeTooltip&&i.activeTooltip!==this&&(i.activeTooltip.closeOverlay(),i.activeTooltip.tooltipVisible=!1,i.activeTooltip.requestUpdate()),i.activeTooltip=this,this._computeTooltipPosition(),this.tooltipVisible=!0,this.updateComplete.then(()=>this._computeTooltipPosition())}hideTooltip(){i.activeTooltip===this&&(i.activeTooltip=null),this.tooltipVisible=!1}handleTap(e){e.preventDefault(),this.tooltipVisible?this.hideTooltip():this.showTooltip()}closeOverlay(){let e=this.shadowRoot?.querySelector("overlay-trigger");e?.open!==void 0&&(e.open=!1)}get effectiveContent(){return this.tooltipText||this.mnemonicText||this.content||""}get effectivePlacement(){return this.tooltipPlacement||this.mnemonicPlacement||this.placement||"top"}renderIcon(){return this.src?g`<merch-icon
            src="${this.src}"
            size="${this.size}"
        ></merch-icon>`:g`<slot></slot>`}render(){let e=this.effectiveContent,t=this.effectivePlacement;if(!e)return this.renderIcon();if(O())return g`
                <overlay-trigger
                    placement="${t}"
                    @sp-opened=${()=>this.showTooltip()}
                >
                    <span slot="trigger">${this.renderIcon()}</span>
                    <sp-tooltip
                        placement="${t}"
                        variant="${this.variant}"
                    >
                        ${w(e)}
                    </sp-tooltip>
                </overlay-trigger>
            `;{let d=e.replace(/<[^>]*>/g,""),s=this._computedPlacement,T=s==="top"||s==="bottom",x=`top:${this._tooltipTop}px;left:${this._tooltipLeft}px;`,c=T?`left:${this._arrowOffset}px`:`top:${this._arrowOffset}px`;return g`
                <span
                    class="css-tooltip ${this.tooltipVisible?"tooltip-visible":""}"
                    tabindex="0"
                    role="img"
                    aria-label="${d}"
                    @pointerdown=${o=>{this.lastPointerType=o.pointerType}}
                    @pointerenter=${o=>o.pointerType!=="touch"&&this.showTooltip()}
                    @pointerleave=${o=>o.pointerType!=="touch"&&this.hideTooltip()}
                    @click=${o=>{this.lastPointerType==="touch"&&this.handleTap(o),this.lastPointerType=null}}
                >
                    ${this.renderIcon()}
                    <span class="css-tooltip-body" style="${x}">
                        ${w(e)}
                        <span
                            aria-hidden="true"
                            role="presentation"
                            class="css-tooltip-tip ${s}"
                            style="${c}"
                        ></span>
                    </span>
                </span>
            `}}};b(i,"activeTooltip",null),b(i,"properties",{content:{type:String},placement:{type:String},variant:{type:String},src:{type:String},size:{type:String},tooltipText:{type:String,attribute:"tooltip-text"},tooltipPlacement:{type:String,attribute:"tooltip-placement"},mnemonicText:{type:String,attribute:"mnemonic-text"},mnemonicPlacement:{type:String,attribute:"mnemonic-placement"},tooltipVisible:{type:Boolean,state:!0},_tooltipTop:{type:Number,state:!0},_tooltipLeft:{type:Number,state:!0},_arrowOffset:{type:Number,state:!0},_computedPlacement:{type:String,state:!0}}),b(i,"styles",C`
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

        .css-tooltip .css-tooltip-body {
            position: fixed;
            z-index: 100000;
            background: var(--spectrum-gray-800, #323232);
            color: #fff;
            padding: var(--mas-mnemonic-tooltip-padding, 8px 12px);
            border-radius: 4px;
            white-space: normal;
            width: max-content;
            max-width: 200px;
            overflow: visible;
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

        .css-tooltip-tip {
            position: absolute;
            width: 0;
            height: 0;
            border: 6px solid transparent;
            pointer-events: none;
        }

        .css-tooltip.tooltip-visible .css-tooltip-body,
        .css-tooltip:focus-visible .css-tooltip-body {
            opacity: 1;
            visibility: visible;
        }

        /* Arrow: child of body, positioned on the side facing the icon */
        .css-tooltip-tip.top {
            top: 100%;
            border-top-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip-tip.bottom {
            top: -6px;
            border-bottom-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip-tip.left {
            left: 100%;
            border-left-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip-tip.right {
            left: -6px;
            border-right-color: var(--spectrum-gray-800, #323232);
        }
    `);var v=i;customElements.define("mas-mnemonic",v);export{v as default};
