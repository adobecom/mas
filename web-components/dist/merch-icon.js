var P=Object.defineProperty;var H=(n,e,t)=>e in n?P(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var V=(n,e)=>()=>(n&&(e=n(n=0)),e);var _=(n,e)=>{for(var t in e)P(n,t,{get:e[t],enumerable:!0})};var d=(n,e,t)=>H(n,typeof e!="symbol"?e+"":e,t);var k={};_(k,{default:()=>y});import{LitElement as A,html as u,css as R,nothing as Y}from"./lit-all.min.js";import{unsafeHTML as C}from"./lit-all.min.js";import{ifDefined as I}from"./lit-all.min.js";function N(){return customElements.get("sp-tooltip")!==void 0&&customElements.get("overlay-trigger")!==void 0&&document.querySelector("sp-theme")!==null}var o,y,z=V(()=>{o=class o extends A{constructor(){super(),this.content="",this.placement="top",this.variant="",this.size="xs",this.smartPlacement=!1,this.tooltipVisible=!1,this.lastPointerType=null,this.handleClickOutside=this.handleClickOutside.bind(this),this._tooltipTop=0,this._tooltipLeft=0,this._arrowOffset=0,this._computedPlacement="top"}connectedCallback(){super.connectedCallback(),window.addEventListener("mousedown",this.handleClickOutside),!this.smartPlacement&&this.closest('merch-card[variant="fries"]')&&(this.smartPlacement=!0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("mousedown",this.handleClickOutside)}handleClickOutside(e){let t=e.composedPath();o.activeTooltip===this&&!t.includes(this)&&this.hideTooltip()}_computeTooltipPosition(){let e=this.shadowRoot?.querySelector(".css-tooltip");if(!e)return;let t=e.getBoundingClientRect(),a=window.innerWidth,p=window.innerHeight,i=14,r=200,l=60,f=this.shadowRoot?.querySelector(".css-tooltip-body"),c=f?f.offsetWidth:r,h=f?f.offsetHeight:l,s=this.effectivePlacement;s==="top"&&t.top-h-i<0?s="bottom":s==="bottom"&&t.bottom+h+i>p?s="top":s==="left"&&t.left-c-i<0?s="right":s==="right"&&t.right+c+i>a&&(s="left");let S=t.left+t.width/2,$=t.top+t.height/2,g=6,v=(E,L,q)=>Math.max(E,Math.min(L,q)),x,w,T;s==="top"||s==="bottom"?(x=s==="top"?t.top-h-i:t.bottom+i,w=v(0,a-c,S-c/2),T=v(g,c-g*2,S-w-g)):(w=s==="left"?t.left-c-i:t.right+i,x=v(0,p-h,$-h/2),T=v(g,h-g*2,$-x-g)),this._tooltipTop=x,this._tooltipLeft=w,this._arrowOffset=T,this._computedPlacement=s}showTooltip(){o.activeTooltip&&o.activeTooltip!==this&&(o.activeTooltip.closeOverlay(),o.activeTooltip.tooltipVisible=!1,o.activeTooltip.requestUpdate()),o.activeTooltip=this,this.smartPlacement&&this._computeTooltipPosition(),this.tooltipVisible=!0,this.smartPlacement&&this.updateComplete.then(()=>this._computeTooltipPosition())}hideTooltip(){o.activeTooltip===this&&(o.activeTooltip=null),this.tooltipVisible=!1}handleTap(e){e.preventDefault(),this.tooltipVisible?this.hideTooltip():this.showTooltip()}closeOverlay(){let e=this.shadowRoot?.querySelector("overlay-trigger");e?.open!==void 0&&(e.open=!1)}get effectiveContent(){return this.tooltipText||this.mnemonicText||this.content||this.textContent?.trim()||""}get effectivePlacement(){return this.tooltipPlacement||this.mnemonicPlacement||this.placement||"top"}renderIcon(){return this.src?u`<merch-icon
            src="${this.src}"
            size="${this.size}"
        ></merch-icon>`:u`<slot></slot>`}render(){let e=this.effectiveContent,t=this.effectivePlacement;if(!e)return u`<span class="icon-only">${this.renderIcon()}</span>`;if(N())return u`
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
                        ${C(e)}
                    </sp-tooltip>
                </overlay-trigger>
            `;let p=e.replace(/<[^>]*>/g,""),i=this.tooltipVisible?"tooltip-visible":"",r={pointerdown:m=>{this.lastPointerType=m.pointerType},pointerenter:m=>m.pointerType!=="touch"&&this.showTooltip(),pointerleave:m=>m.pointerType!=="touch"&&this.hideTooltip(),click:m=>{this.lastPointerType==="touch"&&this.handleTap(m),this.lastPointerType=null}},l=this._computedPlacement,f=l==="top"||l==="bottom",c=this.smartPlacement?`top:${this._tooltipTop}px;left:${this._tooltipLeft}px;`:void 0,h=f?`left:${this._arrowOffset}px`:`top:${this._arrowOffset}px`;return u`
            <span
                class="css-tooltip ${this.smartPlacement?"smart":t} ${i}"
                tabindex="0"
                role="img"
                aria-label="${p}"
                @pointerdown=${r.pointerdown}
                @pointerenter=${r.pointerenter}
                @pointerleave=${r.pointerleave}
                @click=${r.click}
            >
                ${this.renderIcon()}
                <span class="css-tooltip-body" style=${I(c)}>
                    ${C(e)}
                    ${this.smartPlacement?u`<span
                              aria-hidden="true"
                              role="presentation"
                              class="css-tooltip-tip ${l}"
                              style="${h}"
                          ></span>`:Y}
                </span>
            </span>
        `}};d(o,"activeTooltip",null),d(o,"properties",{content:{type:String},placement:{type:String},variant:{type:String},src:{type:String},size:{type:String},tooltipText:{type:String,attribute:"tooltip-text"},tooltipPlacement:{type:String,attribute:"tooltip-placement"},mnemonicText:{type:String,attribute:"mnemonic-text"},mnemonicPlacement:{type:String,attribute:"mnemonic-placement"},alt:{type:String},smartPlacement:{type:Boolean,attribute:"smart-placement"},tooltipVisible:{type:Boolean,state:!0},_tooltipTop:{type:Number,state:!0},_tooltipLeft:{type:Number,state:!0},_arrowOffset:{type:Number,state:!0},_computedPlacement:{type:String,state:!0}}),d(o,"styles",R`
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
    `);y=o;customElements.define("mas-mnemonic",y)});import{LitElement as X,html as O,css as W}from"./lit-all.min.js";function B(){return customElements.get("sp-tooltip")!==void 0||document.querySelector("sp-theme")!==null}var b=class extends X{constructor(){super(),this.size="m",this.alt="",this.loading="lazy"}connectedCallback(){super.connectedCallback(),setTimeout(()=>this.handleTooltips(),0)}handleTooltips(){if(B())return;this.querySelectorAll("sp-tooltip, overlay-trigger").forEach(t=>{let a="",p="top";if(t.tagName==="SP-TOOLTIP")a=t.textContent,p=t.getAttribute("placement")||"top";else if(t.tagName==="OVERLAY-TRIGGER"){let i=t.querySelector("sp-tooltip");i&&(a=i.textContent,p=i.getAttribute("placement")||t.getAttribute("placement")||"top")}if(a){let i=document.createElement("mas-mnemonic");i.setAttribute("content",a),i.setAttribute("placement",p);let r=this.querySelector("img"),l=this.querySelector("a");l&&l.contains(r)?i.appendChild(l):r&&i.appendChild(r),this.innerHTML="",this.appendChild(i),Promise.resolve().then(()=>z())}t.remove()})}render(){let{href:e}=this;return e?O`<a href="${e}">
                  <img
                      src="${this.src}"
                      alt="${this.alt}"
                      loading="${this.loading}"
                  />
              </a>`:O` <img
                  src="${this.src}"
                  alt="${this.alt}"
                  loading="${this.loading}"
              />`}};d(b,"properties",{size:{type:String,attribute:!0},src:{type:String,attribute:!0},alt:{type:String,attribute:!0},href:{type:String,attribute:!0},loading:{type:String,attribute:!0}}),d(b,"styles",W`
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
