var O=Object.defineProperty;var z=(h,e,t)=>e in h?O(h,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):h[e]=t;var y=(h,e,t)=>z(h,typeof e!="symbol"?e+"":e,t);import{LitElement as H,html as m,css as L,nothing as _}from"./lit-all.min.js";import{unsafeHTML as S}from"./lit-all.min.js";import{ifDefined as E}from"./lit-all.min.js";function V(){return customElements.get("sp-tooltip")!==void 0&&customElements.get("overlay-trigger")!==void 0&&document.querySelector("sp-theme")!==null}var o=class o extends H{constructor(){super(),this.content="",this.placement="top",this.variant="",this.size="xs",this.smartPlacement=!1,this.tooltipVisible=!1,this.lastPointerType=null,this.handleClickOutside=this.handleClickOutside.bind(this),this._tooltipTop=0,this._tooltipLeft=0,this._arrowOffset=0,this._computedPlacement="top"}connectedCallback(){super.connectedCallback(),window.addEventListener("mousedown",this.handleClickOutside),!this.smartPlacement&&this.closest('merch-card[variant="fries"]')&&(this.smartPlacement=!0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("mousedown",this.handleClickOutside)}handleClickOutside(e){let t=e.composedPath();o.activeTooltip===this&&!t.includes(this)&&this.hideTooltip()}_computeTooltipPosition(){let e=this.shadowRoot?.querySelector(".css-tooltip");if(!e)return;let t=e.getBoundingClientRect(),x=window.innerWidth,f=window.innerHeight,s=14,p=200,d=60,a=this.shadowRoot?.querySelector(".css-tooltip-body"),n=a?a.offsetWidth:p,r=a?a.offsetHeight:d,i=this.effectivePlacement;i==="top"&&t.top-r-s<0?i="bottom":i==="bottom"&&t.bottom+r+s>f?i="top":i==="left"&&t.left-n-s<0?i="right":i==="right"&&t.right+n+s>x&&(i="left");let T=t.left+t.width/2,P=t.top+t.height/2,c=6,u=($,C,k)=>Math.max($,Math.min(C,k)),b,g,w;i==="top"||i==="bottom"?(b=i==="top"?t.top-r-s:t.bottom+s,g=u(0,x-n,T-n/2),w=u(c,n-c*2,T-g-c)):(g=i==="left"?t.left-n-s:t.right+s,b=u(0,f-r,P-r/2),w=u(c,r-c*2,P-b-c)),this._tooltipTop=b,this._tooltipLeft=g,this._arrowOffset=w,this._computedPlacement=i}showTooltip(){o.activeTooltip&&o.activeTooltip!==this&&(o.activeTooltip.closeOverlay(),o.activeTooltip.tooltipVisible=!1,o.activeTooltip.requestUpdate()),o.activeTooltip=this,this.smartPlacement&&this._computeTooltipPosition(),this.tooltipVisible=!0,this.smartPlacement&&this.updateComplete.then(()=>this._computeTooltipPosition())}hideTooltip(){o.activeTooltip===this&&(o.activeTooltip=null),this.tooltipVisible=!1}handleTap(e){e.preventDefault(),this.tooltipVisible?this.hideTooltip():this.showTooltip()}closeOverlay(){let e=this.shadowRoot?.querySelector("overlay-trigger");e?.open!==void 0&&(e.open=!1)}get effectiveContent(){return this.tooltipText||this.mnemonicText||this.content||this.textContent?.trim()||""}get effectivePlacement(){return this.tooltipPlacement||this.mnemonicPlacement||this.placement||"top"}renderIcon(){return this.src?m`<merch-icon
            src="${this.src}"
            size="${this.size}"
        ></merch-icon>`:m`<slot></slot>`}render(){let e=this.effectiveContent,t=this.effectivePlacement;if(!e)return m`<span class="icon-only">${this.renderIcon()}</span>`;if(V())return m`
                <overlay-trigger
                    placement="${t}"
                    @sp-opened=${()=>this.showTooltip()}
                >
                    <span slot="trigger">${this.renderIcon()}</span>
                    <sp-tooltip
                        slot="hover-content"
                        placement="${t}"
                        variant="${this.variant}"
                    >
                        ${S(e)}
                    </sp-tooltip>
                </overlay-trigger>
            `;let f=e.replace(/<[^>]*>/g,""),s=this.tooltipVisible?"tooltip-visible":"",p={pointerdown:l=>{this.lastPointerType=l.pointerType},pointerenter:l=>l.pointerType!=="touch"&&this.showTooltip(),pointerleave:l=>l.pointerType!=="touch"&&this.hideTooltip(),click:l=>{this.lastPointerType==="touch"&&this.handleTap(l),this.lastPointerType=null}},d=this._computedPlacement,a=d==="top"||d==="bottom",n=this.smartPlacement?`top:${this._tooltipTop}px;left:${this._tooltipLeft}px;`:void 0,r=a?`left:${this._arrowOffset}px`:`top:${this._arrowOffset}px`;return m`
            <span
                class="css-tooltip ${this.smartPlacement?"smart":t} ${s}"
                tabindex="0"
                role="img"
                aria-label="${f}"
                @pointerdown=${p.pointerdown}
                @pointerenter=${p.pointerenter}
                @pointerleave=${p.pointerleave}
                @click=${p.click}
            >
                ${this.renderIcon()}
                <span class="css-tooltip-body" style=${E(n)}>
                    ${S(e)}
                    ${this.smartPlacement?m`<span
                              aria-hidden="true"
                              role="presentation"
                              class="css-tooltip-tip ${d}"
                              style="${r}"
                          ></span>`:_}
                </span>
            </span>
        `}};y(o,"activeTooltip",null),y(o,"properties",{content:{type:String},placement:{type:String},variant:{type:String},src:{type:String},size:{type:String},tooltipText:{type:String,attribute:"tooltip-text"},tooltipPlacement:{type:String,attribute:"tooltip-placement"},mnemonicText:{type:String,attribute:"mnemonic-text"},mnemonicPlacement:{type:String,attribute:"mnemonic-placement"},alt:{type:String},smartPlacement:{type:Boolean,attribute:"smart-placement"},tooltipVisible:{type:Boolean,state:!0},_tooltipTop:{type:Number,state:!0},_tooltipLeft:{type:Number,state:!0},_arrowOffset:{type:Number,state:!0},_computedPlacement:{type:String,state:!0}}),y(o,"styles",L`
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

        .css-tooltip-body p {
            margin: 0;
        }

        /* Icon-only (no tooltip): keep inline so icons don't block-stack in <p> */
        .icon-only {
            display: inline-block;
        }
    `);var v=o;customElements.define("mas-mnemonic",v);export{v as default};
