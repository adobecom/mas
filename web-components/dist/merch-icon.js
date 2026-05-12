var $=Object.defineProperty;var z=(n,e,t)=>e in n?$(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var O=(n,e)=>()=>(n&&(e=n(n=0)),e);var E=(n,e)=>{for(var t in e)$(n,t,{get:e[t],enumerable:!0})};var g=(n,e,t)=>z(n,typeof e!="symbol"?e+"":e,t);var P={};E(P,{default:()=>x});import{LitElement as L,html as v,css as q}from"./lit-all.min.js";import{unsafeHTML as S}from"./lit-all.min.js";function H(){return customElements.get("sp-tooltip")!==void 0&&customElements.get("overlay-trigger")!==void 0&&document.querySelector("sp-theme")!==null}var r,x,C=O(()=>{r=class r extends L{constructor(){super(),this.content="",this.placement="top",this.variant="info",this.size="xs",this.smartPlacement=!1,this.tooltipVisible=!1,this.lastPointerType=null,this.handleClickOutside=this.handleClickOutside.bind(this),this._tooltipTop=0,this._tooltipLeft=0,this._arrowOffset=0,this._computedPlacement="top"}connectedCallback(){super.connectedCallback(),window.addEventListener("mousedown",this.handleClickOutside),!this.smartPlacement&&this.closest('merch-card[variant="fries"]')&&(this.smartPlacement=!0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("mousedown",this.handleClickOutside)}handleClickOutside(e){let t=e.composedPath();r.activeTooltip===this&&!t.includes(this)&&this.hideTooltip()}_computeTooltipPosition(){let e=this.shadowRoot?.querySelector(".css-tooltip");if(!e)return;let t=e.getBoundingClientRect(),m=window.innerWidth,h=window.innerHeight,i=14,s=200,o=60,u=this.shadowRoot?.querySelector(".css-tooltip-body"),p=u?u.offsetWidth:s,c=u?u.offsetHeight:o,l=this.effectivePlacement;l==="top"&&t.top-c-i<0?l="bottom":l==="bottom"&&t.bottom+c+i>h?l="top":l==="left"&&t.left-p-i<0?l="right":l==="right"&&t.right+p+i>m&&(l="left");let w=t.left+t.width/2,T=t.top+t.height/2,a=6,d,f,y;l==="top"?(d=t.top-c-i,f=Math.max(0,Math.min(m-p,w-p/2)),y=Math.max(a,Math.min(p-a*2,w-f-a))):l==="bottom"?(d=t.bottom+i,f=Math.max(0,Math.min(m-p,w-p/2)),y=Math.max(a,Math.min(p-a*2,w-f-a))):l==="left"?(f=t.left-p-i,d=Math.max(0,Math.min(h-c,T-c/2)),y=Math.max(a,Math.min(c-a*2,T-d-a))):(f=t.right+i,d=Math.max(0,Math.min(h-c,T-c/2)),y=Math.max(a,Math.min(c-a*2,T-d-a))),this._tooltipTop=d,this._tooltipLeft=f,this._arrowOffset=y,this._computedPlacement=l,this._anchorRect=t}showTooltip(){r.activeTooltip&&r.activeTooltip!==this&&(r.activeTooltip.closeOverlay(),r.activeTooltip.tooltipVisible=!1,r.activeTooltip.requestUpdate()),r.activeTooltip=this,this.smartPlacement&&this._computeTooltipPosition(),this.tooltipVisible=!0,this.smartPlacement&&this.updateComplete.then(()=>this._computeTooltipPosition())}hideTooltip(){r.activeTooltip===this&&(r.activeTooltip=null),this.tooltipVisible=!1}handleTap(e){e.preventDefault(),this.tooltipVisible?this.hideTooltip():this.showTooltip()}closeOverlay(){let e=this.shadowRoot?.querySelector("overlay-trigger");e?.open!==void 0&&(e.open=!1)}get effectiveContent(){return this.tooltipText||this.mnemonicText||this.content||""}get effectivePlacement(){return this.tooltipPlacement||this.mnemonicPlacement||this.placement||"top"}renderIcon(){return this.src?v`<merch-icon
            src="${this.src}"
            size="${this.size}"
        ></merch-icon>`:v`<slot></slot>`}render(){let e=this.effectiveContent,t=this.effectivePlacement;if(!e)return this.renderIcon();if(H())return v`
                <overlay-trigger
                    placement="${t}"
                    @sp-opened=${()=>this.showTooltip()}
                >
                    <span slot="trigger">${this.renderIcon()}</span>
                    <sp-tooltip
                        placement="${t}"
                        variant="${this.variant}"
                    >
                        ${S(e)}
                    </sp-tooltip>
                </overlay-trigger>
            `;{let h=e.replace(/<[^>]*>/g,""),i=this.tooltipVisible?"tooltip-visible":"",s={pointerdown:o=>{this.lastPointerType=o.pointerType},pointerenter:o=>o.pointerType!=="touch"&&this.showTooltip(),pointerleave:o=>o.pointerType!=="touch"&&this.hideTooltip(),click:o=>{this.lastPointerType==="touch"&&this.handleTap(o),this.lastPointerType=null}};if(this.smartPlacement){let o=this._computedPlacement,u=o==="top"||o==="bottom",p=`top:${this._tooltipTop}px;left:${this._tooltipLeft}px;`,c=u?`left:${this._arrowOffset}px`:`top:${this._arrowOffset}px`;return v`
                    <span
                        class="css-tooltip smart ${i}"
                        tabindex="0"
                        role="img"
                        aria-label="${h}"
                        @pointerdown=${s.pointerdown}
                        @pointerenter=${s.pointerenter}
                        @pointerleave=${s.pointerleave}
                        @click=${s.click}
                    >
                        ${this.renderIcon()}
                        <span class="css-tooltip-body" style="${p}">
                            ${S(e)}
                            <span
                                aria-hidden="true"
                                role="presentation"
                                class="css-tooltip-tip ${o}"
                                style="${c}"
                            ></span>
                        </span>
                    </span>
                `}return v`
                <span
                    class="css-tooltip ${t} ${i}"
                    tabindex="0"
                    role="img"
                    aria-label="${h}"
                    @pointerdown=${s.pointerdown}
                    @pointerenter=${s.pointerenter}
                    @pointerleave=${s.pointerleave}
                    @click=${s.click}
                >
                    ${this.renderIcon()}
                    <span class="css-tooltip-body">${S(e)}</span>
                </span>
            `}}};g(r,"activeTooltip",null),g(r,"properties",{content:{type:String},placement:{type:String},variant:{type:String},src:{type:String},size:{type:String},tooltipText:{type:String,attribute:"tooltip-text"},tooltipPlacement:{type:String,attribute:"tooltip-placement"},mnemonicText:{type:String,attribute:"mnemonic-text"},mnemonicPlacement:{type:String,attribute:"mnemonic-placement"},smartPlacement:{type:Boolean,attribute:"smart-placement"},tooltipVisible:{type:Boolean,state:!0},_tooltipTop:{type:Number,state:!0},_tooltipLeft:{type:Number,state:!0},_arrowOffset:{type:Number,state:!0},_computedPlacement:{type:String,state:!0}}),g(r,"styles",q`
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
    `);x=r;customElements.define("mas-mnemonic",x)});import{LitElement as M,html as k,css as _}from"./lit-all.min.js";function R(){return customElements.get("sp-tooltip")!==void 0||document.querySelector("sp-theme")!==null}var b=class extends M{constructor(){super(),this.size="m",this.alt="",this.loading="lazy"}connectedCallback(){super.connectedCallback(),setTimeout(()=>this.handleTooltips(),0)}handleTooltips(){if(R())return;this.querySelectorAll("sp-tooltip, overlay-trigger").forEach(t=>{let m="",h="top";if(t.tagName==="SP-TOOLTIP")m=t.textContent,h=t.getAttribute("placement")||"top";else if(t.tagName==="OVERLAY-TRIGGER"){let i=t.querySelector("sp-tooltip");i&&(m=i.textContent,h=i.getAttribute("placement")||t.getAttribute("placement")||"top")}if(m){let i=document.createElement("mas-mnemonic");i.setAttribute("content",m),i.setAttribute("placement",h);let s=this.querySelector("img"),o=this.querySelector("a");o&&o.contains(s)?i.appendChild(o):s&&i.appendChild(s),this.innerHTML="",this.appendChild(i),Promise.resolve().then(()=>C())}t.remove()})}render(){let{href:e}=this;return e?k`<a href="${e}">
                  <img
                      src="${this.src}"
                      alt="${this.alt}"
                      loading="${this.loading}"
                  />
              </a>`:k` <img
                  src="${this.src}"
                  alt="${this.alt}"
                  loading="${this.loading}"
              />`}};g(b,"properties",{size:{type:String,attribute:!0},src:{type:String,attribute:!0},alt:{type:String,attribute:!0},href:{type:String,attribute:!0},loading:{type:String,attribute:!0}}),g(b,"styles",_`
        :host {
            --img-width: 32px;
            --img-height: 32px;
            display: block;
            width: var(--mod-img-width, var(--img-width));
            height: var(--mod-img-height, var(--img-height));
        }

        :host([size='xxs']) {
            --img-width: 13px;
            --img-height: 13px;
        }

        :host([size='xs']) {
            --img-width: 20px;
            --img-height: 20px;
        }

        :host([size='s']) {
            --img-width: 24px;
            --img-height: 24px;
        }

        :host([size='m']) {
            --img-width: 30px;
            --img-height: 30px;
        }

        :host([size='l']) {
            --img-width: 40px;
            --img-height: 40px;
        }

        img {
            width: var(--mod-img-width, var(--img-width));
            height: var(--mod-img-height, var(--img-height));
        }
    `);customElements.define("merch-icon",b);export{b as default};
