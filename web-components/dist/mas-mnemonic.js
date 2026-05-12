var $=Object.defineProperty;var P=(f,e,t)=>e in f?$(f,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):f[e]=t;var x=(f,e,t)=>P(f,typeof e!="symbol"?e+"":e,t);import{LitElement as S,html as b,css as C}from"./lit-all.min.js";import{unsafeHTML as T}from"./lit-all.min.js";function k(){return customElements.get("sp-tooltip")!==void 0&&customElements.get("overlay-trigger")!==void 0&&document.querySelector("sp-theme")!==null}var o=class o extends S{constructor(){super(),this.content="",this.placement="top",this.variant="info",this.size="xs",this.smartPlacement=!1,this.tooltipVisible=!1,this.lastPointerType=null,this.handleClickOutside=this.handleClickOutside.bind(this),this._tooltipTop=0,this._tooltipLeft=0,this._arrowOffset=0,this._computedPlacement="top"}connectedCallback(){super.connectedCallback(),window.addEventListener("mousedown",this.handleClickOutside),!this.smartPlacement&&this.closest('merch-card[variant="fries"]')&&(this.smartPlacement=!0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("mousedown",this.handleClickOutside)}handleClickOutside(e){let t=e.composedPath();o.activeTooltip===this&&!t.includes(this)&&this.hideTooltip()}_computeTooltipPosition(){let e=this.shadowRoot?.querySelector(".css-tooltip");if(!e)return;let t=e.getBoundingClientRect(),g=window.innerWidth,m=window.innerHeight,r=14,p=200,i=60,d=this.shadowRoot?.querySelector(".css-tooltip-body"),l=d?d.offsetWidth:p,a=d?d.offsetHeight:i,s=this.effectivePlacement;s==="top"&&t.top-a-r<0?s="bottom":s==="bottom"&&t.bottom+a+r>m?s="top":s==="left"&&t.left-l-r<0?s="right":s==="right"&&t.right+l+r>g&&(s="left");let y=t.left+t.width/2,v=t.top+t.height/2,n=6,c,h,u;s==="top"?(c=t.top-a-r,h=Math.max(0,Math.min(g-l,y-l/2)),u=Math.max(n,Math.min(l-n*2,y-h-n))):s==="bottom"?(c=t.bottom+r,h=Math.max(0,Math.min(g-l,y-l/2)),u=Math.max(n,Math.min(l-n*2,y-h-n))):s==="left"?(h=t.left-l-r,c=Math.max(0,Math.min(m-a,v-a/2)),u=Math.max(n,Math.min(a-n*2,v-c-n))):(h=t.right+r,c=Math.max(0,Math.min(m-a,v-a/2)),u=Math.max(n,Math.min(a-n*2,v-c-n))),this._tooltipTop=c,this._tooltipLeft=h,this._arrowOffset=u,this._computedPlacement=s,this._anchorRect=t}showTooltip(){o.activeTooltip&&o.activeTooltip!==this&&(o.activeTooltip.closeOverlay(),o.activeTooltip.tooltipVisible=!1,o.activeTooltip.requestUpdate()),o.activeTooltip=this,this.smartPlacement&&this._computeTooltipPosition(),this.tooltipVisible=!0,this.smartPlacement&&this.updateComplete.then(()=>this._computeTooltipPosition())}hideTooltip(){o.activeTooltip===this&&(o.activeTooltip=null),this.tooltipVisible=!1}handleTap(e){e.preventDefault(),this.tooltipVisible?this.hideTooltip():this.showTooltip()}closeOverlay(){let e=this.shadowRoot?.querySelector("overlay-trigger");e?.open!==void 0&&(e.open=!1)}get effectiveContent(){return this.tooltipText||this.mnemonicText||this.content||""}get effectivePlacement(){return this.tooltipPlacement||this.mnemonicPlacement||this.placement||"top"}renderIcon(){return this.src?b`<merch-icon
            src="${this.src}"
            size="${this.size}"
        ></merch-icon>`:b`<slot></slot>`}render(){let e=this.effectiveContent,t=this.effectivePlacement;if(!e)return this.renderIcon();if(k())return b`
                <overlay-trigger
                    placement="${t}"
                    @sp-opened=${()=>this.showTooltip()}
                >
                    <span slot="trigger">${this.renderIcon()}</span>
                    <sp-tooltip
                        placement="${t}"
                        variant="${this.variant}"
                    >
                        ${T(e)}
                    </sp-tooltip>
                </overlay-trigger>
            `;{let m=e.replace(/<[^>]*>/g,""),r=this.tooltipVisible?"tooltip-visible":"",p={pointerdown:i=>{this.lastPointerType=i.pointerType},pointerenter:i=>i.pointerType!=="touch"&&this.showTooltip(),pointerleave:i=>i.pointerType!=="touch"&&this.hideTooltip(),click:i=>{this.lastPointerType==="touch"&&this.handleTap(i),this.lastPointerType=null}};if(this.smartPlacement){let i=this._computedPlacement,d=i==="top"||i==="bottom",l=`top:${this._tooltipTop}px;left:${this._tooltipLeft}px;`,a=d?`left:${this._arrowOffset}px`:`top:${this._arrowOffset}px`;return b`
                    <span
                        class="css-tooltip smart ${r}"
                        tabindex="0"
                        role="img"
                        aria-label="${m}"
                        @pointerdown=${p.pointerdown}
                        @pointerenter=${p.pointerenter}
                        @pointerleave=${p.pointerleave}
                        @click=${p.click}
                    >
                        ${this.renderIcon()}
                        <span class="css-tooltip-body" style="${l}">
                            ${T(e)}
                            <span
                                aria-hidden="true"
                                role="presentation"
                                class="css-tooltip-tip ${i}"
                                style="${a}"
                            ></span>
                        </span>
                    </span>
                `}return b`
                <span
                    class="css-tooltip ${t} ${r}"
                    tabindex="0"
                    role="img"
                    aria-label="${m}"
                    @pointerdown=${p.pointerdown}
                    @pointerenter=${p.pointerenter}
                    @pointerleave=${p.pointerleave}
                    @click=${p.click}
                >
                    ${this.renderIcon()}
                    <span class="css-tooltip-body">${T(e)}</span>
                </span>
            `}}};x(o,"activeTooltip",null),x(o,"properties",{content:{type:String},placement:{type:String},variant:{type:String},src:{type:String},size:{type:String},tooltipText:{type:String,attribute:"tooltip-text"},tooltipPlacement:{type:String,attribute:"tooltip-placement"},mnemonicText:{type:String,attribute:"mnemonic-text"},mnemonicPlacement:{type:String,attribute:"mnemonic-placement"},smartPlacement:{type:Boolean,attribute:"smart-placement"},tooltipVisible:{type:Boolean,state:!0},_tooltipTop:{type:Number,state:!0},_tooltipLeft:{type:Number,state:!0},_arrowOffset:{type:Number,state:!0},_computedPlacement:{type:String,state:!0}}),x(o,"styles",C`
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

        .css-tooltip.tooltip-visible .css-tooltip-body,
        .css-tooltip.tooltip-visible::after,
        .css-tooltip:focus-visible .css-tooltip-body,
        .css-tooltip:focus-visible::after {
            opacity: 1;
            visibility: visible;
        }

        /* Placement variants (CSS-only mode) */
        .css-tooltip.top .css-tooltip-body {
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

        .css-tooltip.bottom .css-tooltip-body {
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

        .css-tooltip.left .css-tooltip-body {
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

        .css-tooltip.right .css-tooltip-body {
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

        /* Smart-placement mode: JS-computed fixed positioning + inner arrow span */
        .css-tooltip.smart .css-tooltip-body {
            position: fixed;
            z-index: 100000;
            max-width: 200px;
            overflow: visible;
            /* Cancel CSS-only placement transforms/margins from above */
            transform: none;
            margin: 0;
            bottom: auto;
            right: auto;
        }

        /* Hide the ::after arrow in smart mode; inner span is used instead */
        .css-tooltip.smart::after {
            content: none;
        }

        .css-tooltip-tip {
            position: absolute;
            width: 0;
            height: 0;
            border: 6px solid transparent;
            pointer-events: none;
        }

        /* Inner arrow span: positioned on the side facing the icon */
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
    `);var w=o;customElements.define("mas-mnemonic",w);export{w as default};
