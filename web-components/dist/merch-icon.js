var N=Object.defineProperty;var I=(i,e,t)=>e in i?N(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t;var H=(i,e,t)=>()=>{if(t)throw t[0];try{return i&&(e=i(i=0)),e}catch(r){throw t=[r],r}};var D=(i,e)=>{for(var t in e)N(i,t,{get:e[t],enumerable:!0})};var E=(i,e,t)=>I(i,typeof e!="symbol"?e+"":e,t);var O={};D(O,{default:()=>_});import{LitElement as G,html as T,css as F,nothing as k}from"./lit-all.min.js";import{unsafeHTML as L}from"./lit-all.min.js";import{ifDefined as B}from"./lit-all.min.js";function z(){return customElements.get("sp-tooltip")!==void 0&&customElements.get("overlay-trigger")!==void 0&&document.querySelector("sp-theme")!==null}var n,_,P=H(()=>{n=class n extends G{constructor(){super(),this.content="",this.placement="top",this.variant="",this.size="xs",this.smartPlacement=!1,this.tooltipVisible=!1,this.lastPointerType=null,this.handleClickOutside=this.handleClickOutside.bind(this),this._tooltipTop=0,this._tooltipLeft=0,this._arrowOffset=0,this._computedPlacement="top"}connectedCallback(){super.connectedCallback(),window.addEventListener("mousedown",this.handleClickOutside),!this.smartPlacement&&this.closest('merch-card[variant="fries"]')&&(this.smartPlacement=!0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("mousedown",this.handleClickOutside)}handleClickOutside(e){let t=e.composedPath();n.activeTooltip===this&&!t.includes(this)&&this.hideTooltip()}_computeTooltipPosition(){let e=this.shadowRoot?.querySelector(".css-tooltip");if(!e)return;let t=e.getBoundingClientRect(),r=window.innerWidth,l=window.innerHeight,o=14,a=200,c=60,d=this.shadowRoot?.querySelector(".css-tooltip-body"),p=d?d.offsetWidth:a,m=d?d.offsetHeight:c,s=this.effectivePlacement;s==="top"&&t.top-m-o<0?s="bottom":s==="bottom"&&t.bottom+m+o>l?s="top":s==="left"&&t.left-p-o<0?s="right":s==="right"&&t.right+p+o>r&&(s="left");let x=t.left+t.width/2,C=t.top+t.height/2,u=6,S=(w,v,M)=>Math.max(w,Math.min(v,M)),g,A,R;s==="top"||s==="bottom"?(g=s==="top"?t.top-m-o:t.bottom+o,A=S(0,r-p,x-p/2),R=S(u,p-u*2,x-A-u)):(A=s==="left"?t.left-p-o:t.right+o,g=S(0,l-m,C-m/2),R=S(u,m-u*2,C-g-u)),this._tooltipTop=g,this._tooltipLeft=A,this._arrowOffset=R,this._computedPlacement=s}showTooltip(){n.activeTooltip&&n.activeTooltip!==this&&(n.activeTooltip.closeOverlay(),n.activeTooltip.tooltipVisible=!1,n.activeTooltip.requestUpdate()),n.activeTooltip=this,this.smartPlacement&&this._computeTooltipPosition(),this.tooltipVisible=!0,this.smartPlacement&&this.updateComplete.then(()=>this._computeTooltipPosition())}hideTooltip(){n.activeTooltip===this&&(n.activeTooltip=null),this.tooltipVisible=!1}handleTap(e){e.preventDefault(),this.tooltipVisible?this.hideTooltip():this.showTooltip()}closeOverlay(){let e=this.shadowRoot?.querySelector("overlay-trigger");e?.open!==void 0&&(e.open=!1)}get effectiveContent(){return this.tooltipText||this.mnemonicText||this.content||this.textContent?.trim()||""}get effectivePlacement(){return this.tooltipPlacement||this.mnemonicPlacement||this.placement||"top"}renderIcon(){return this.src?T`<merch-icon
            src="${this.src}"
            size="${this.size}"
        ></merch-icon>`:T`<slot></slot>`}render(){let e=this.effectiveContent,t=this.effectivePlacement;if(!e)return T`<span class="icon-only">${this.renderIcon()}</span>`;if(z())return T`
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
                        ${L(e)}
                    </sp-tooltip>
                </overlay-trigger>
            `;let l=e.replace(/<[^>]*>/g,""),o=this.tooltipVisible?"tooltip-visible":"",a={pointerdown:h=>{this.lastPointerType=h.pointerType},pointerenter:h=>h.pointerType!=="touch"&&this.showTooltip(),pointerleave:h=>h.pointerType!=="touch"&&this.hideTooltip(),click:h=>{this.lastPointerType==="touch"&&this.handleTap(h),this.lastPointerType=null}},c=this._computedPlacement,d=c==="top"||c==="bottom",p=this.smartPlacement?`top:${this._tooltipTop}px;left:${this._tooltipLeft}px;`:void 0,m=d?`left:${this._arrowOffset}px`:`top:${this._arrowOffset}px`;return T`
            <span
                class="css-tooltip ${this.smartPlacement?"smart":t} ${o}"
                tabindex="0"
                role="img"
                aria-label="${l}"
                @pointerdown=${a.pointerdown}
                @pointerenter=${a.pointerenter}
                @pointerleave=${a.pointerleave}
                @click=${a.click}
            >
                ${this.renderIcon()}
                <span class="css-tooltip-body" style=${B(p)}>
                    ${L(e)}
                    ${this.smartPlacement?T`<span
                              aria-hidden="true"
                              role="presentation"
                              class="css-tooltip-tip ${c}"
                              style="${m}"
                          ></span>`:k}
                </span>
            </span>
        `}};E(n,"activeTooltip",null),E(n,"properties",{content:{type:String},placement:{type:String},variant:{type:String},src:{type:String},size:{type:String},tooltipText:{type:String,attribute:"tooltip-text"},tooltipPlacement:{type:String,attribute:"tooltip-placement"},mnemonicText:{type:String,attribute:"mnemonic-text"},mnemonicPlacement:{type:String,attribute:"mnemonic-placement"},alt:{type:String},smartPlacement:{type:Boolean,attribute:"smart-placement"},tooltipVisible:{type:Boolean,state:!0},_tooltipTop:{type:Number,state:!0},_tooltipLeft:{type:Number,state:!0},_arrowOffset:{type:Number,state:!0},_computedPlacement:{type:String,state:!0}}),E(n,"styles",F`
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
    `);_=n;customElements.define("mas-mnemonic",_)});import{LitElement as W,html as y,css as K}from"./lit-all.min.js";var Q=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),Z=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var U='span[is="inline-price"][data-wcs-osi]',Y='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var $='a[is="upt-link"]',j=`${U},${Y},${$}`;var J=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var tt=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var V=["www.adobe.com","www.stage.adobe.com"];function b(i,e=window.location.hostname){if(!i||!V.includes(e))return i;try{let t=new URL(i,`https://${e}`);return/\.aem\.(live|page)$/.test(t.hostname)?`${t.pathname}${t.search}${t.hash}`:i}catch{return i}}function q(){return customElements.get("sp-tooltip")!==void 0||document.querySelector("sp-theme")!==null}var f=class extends W{constructor(){super(),this.size="m",this.alt="",this.loading="lazy"}connectedCallback(){super.connectedCallback(),setTimeout(()=>this.handleTooltips(),0)}handleTooltips(){if(q())return;this.querySelectorAll("sp-tooltip, overlay-trigger").forEach(t=>{let r="",l="top";if(t.tagName==="SP-TOOLTIP")r=t.textContent,l=t.getAttribute("placement")||"top";else if(t.tagName==="OVERLAY-TRIGGER"){let o=t.querySelector("sp-tooltip");o&&(r=o.textContent,l=o.getAttribute("placement")||t.getAttribute("placement")||"top")}if(r){let o=document.createElement("mas-mnemonic");o.setAttribute("content",r),o.setAttribute("placement",l);let a=this.querySelector("img"),c=this.querySelector("a");c&&c.contains(a)?o.appendChild(c):a&&o.appendChild(a),this.innerHTML="",this.appendChild(o),Promise.resolve().then(()=>P())}t.remove()})}render(){let{href:e}=this,t=b(this.src);return e?y`<a href="${e}">
                  <img
                      src="${t}"
                      alt="${this.alt}"
                      loading="${this.loading}"
                  />
              </a>`:y` <img
                  src="${t}"
                  alt="${this.alt}"
                  loading="${this.loading}"
              />`}};E(f,"properties",{size:{type:String,attribute:!0},src:{type:String,attribute:!0},alt:{type:String,attribute:!0},href:{type:String,attribute:!0},loading:{type:String,attribute:!0}}),E(f,"styles",K`
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
    `);customElements.define("merch-icon",f);export{f as default};
