var b=Object.defineProperty;var I=(o,e,t)=>e in o?b(o,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):o[e]=t;var D=(o,e,t)=>()=>{if(t)throw t[0];try{return o&&(e=o(o=0)),e}catch(n){throw t=[n],n}};var H=(o,e)=>{for(var t in e)b(o,t,{get:e[t],enumerable:!0})};var E=(o,e,t)=>I(o,typeof e!="symbol"?e+"":e,t);var O={};H(O,{default:()=>_});import{LitElement as G,html as f,css as F,nothing as k}from"./lit-all.min.js";import{unsafeHTML as L}from"./lit-all.min.js";import{ifDefined as B}from"./lit-all.min.js";function z(){return customElements.get("sp-tooltip")!==void 0&&customElements.get("overlay-trigger")!==void 0&&document.querySelector("sp-theme")!==null}var r,_,P=D(()=>{r=class r extends G{constructor(){super(),this.content="",this.placement="top",this.variant="",this.size="xs",this.smartPlacement=!1,this.tooltipVisible=!1,this.lastPointerType=null,this.handleClickOutside=this.handleClickOutside.bind(this),this._tooltipTop=0,this._tooltipLeft=0,this._arrowOffset=0,this._computedPlacement="top"}connectedCallback(){super.connectedCallback(),window.addEventListener("mousedown",this.handleClickOutside),!this.smartPlacement&&this.closest('merch-card[variant="fries"]')&&(this.smartPlacement=!0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("mousedown",this.handleClickOutside)}handleClickOutside(e){let t=e.composedPath();r.activeTooltip===this&&!t.includes(this)&&this.hideTooltip()}_computeTooltipPosition(){let e=this.shadowRoot?.querySelector(".css-tooltip");if(!e)return;let t=e.getBoundingClientRect(),n=window.innerWidth,a=window.innerHeight,i=14,c=200,l=60,d=this.shadowRoot?.querySelector(".css-tooltip-body"),p=d?d.offsetWidth:c,m=d?d.offsetHeight:l,s=this.effectivePlacement;s==="top"&&t.top-m-i<0?s="bottom":s==="bottom"&&t.bottom+m+i>a?s="top":s==="left"&&t.left-p-i<0?s="right":s==="right"&&t.right+p+i>n&&(s="left");let x=t.left+t.width/2,C=t.top+t.height/2,u=6,g=(w,v,M)=>Math.max(w,Math.min(v,M)),S,A,R;s==="top"||s==="bottom"?(S=s==="top"?t.top-m-i:t.bottom+i,A=g(0,n-p,x-p/2),R=g(u,p-u*2,x-A-u)):(A=s==="left"?t.left-p-i:t.right+i,S=g(0,a-m,C-m/2),R=g(u,m-u*2,C-S-u)),this._tooltipTop=S,this._tooltipLeft=A,this._arrowOffset=R,this._computedPlacement=s}showTooltip(){r.activeTooltip&&r.activeTooltip!==this&&(r.activeTooltip.closeOverlay(),r.activeTooltip.tooltipVisible=!1,r.activeTooltip.requestUpdate()),r.activeTooltip=this,this.smartPlacement&&this._computeTooltipPosition(),this.tooltipVisible=!0,this.smartPlacement&&this.updateComplete.then(()=>this._computeTooltipPosition())}hideTooltip(){r.activeTooltip===this&&(r.activeTooltip=null),this.tooltipVisible=!1}handleTap(e){e.preventDefault(),this.tooltipVisible?this.hideTooltip():this.showTooltip()}closeOverlay(){let e=this.shadowRoot?.querySelector("overlay-trigger");e?.open!==void 0&&(e.open=!1)}get effectiveContent(){return this.tooltipText||this.mnemonicText||this.content||this.textContent?.trim()||""}get effectivePlacement(){return this.tooltipPlacement||this.mnemonicPlacement||this.placement||"top"}renderIcon(){return this.src?f`<merch-icon
            src="${this.src}"
            size="${this.size}"
        ></merch-icon>`:f`<slot></slot>`}render(){let e=this.effectiveContent,t=this.effectivePlacement;if(!e)return f`<span class="icon-only">${this.renderIcon()}</span>`;if(z())return f`
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
            `;let a=e.replace(/<[^>]*>/g,""),i=this.tooltipVisible?"tooltip-visible":"",c={pointerdown:h=>{this.lastPointerType=h.pointerType},pointerenter:h=>h.pointerType!=="touch"&&this.showTooltip(),pointerleave:h=>h.pointerType!=="touch"&&this.hideTooltip(),click:h=>{this.lastPointerType==="touch"&&this.handleTap(h),this.lastPointerType=null}},l=this._computedPlacement,d=l==="top"||l==="bottom",p=this.smartPlacement?`top:${this._tooltipTop}px;left:${this._tooltipLeft}px;`:void 0,m=d?`left:${this._arrowOffset}px`:`top:${this._arrowOffset}px`;return f`
            <span
                class="css-tooltip ${this.smartPlacement?"smart":t} ${i}"
                tabindex="0"
                role="img"
                aria-label="${a}"
                @pointerdown=${c.pointerdown}
                @pointerenter=${c.pointerenter}
                @pointerleave=${c.pointerleave}
                @click=${c.click}
            >
                ${this.renderIcon()}
                <span class="css-tooltip-body" style=${B(p)}>
                    ${L(e)}
                    ${this.smartPlacement?f`<span
                              aria-hidden="true"
                              role="presentation"
                              class="css-tooltip-tip ${l}"
                              style="${m}"
                          ></span>`:k}
                </span>
            </span>
        `}};E(r,"activeTooltip",null),E(r,"properties",{content:{type:String},placement:{type:String},variant:{type:String},src:{type:String},size:{type:String},tooltipText:{type:String,attribute:"tooltip-text"},tooltipPlacement:{type:String,attribute:"tooltip-placement"},mnemonicText:{type:String,attribute:"mnemonic-text"},mnemonicPlacement:{type:String,attribute:"mnemonic-placement"},alt:{type:String},smartPlacement:{type:Boolean,attribute:"smart-placement"},tooltipVisible:{type:Boolean,state:!0},_tooltipTop:{type:Number,state:!0},_tooltipLeft:{type:Number,state:!0},_arrowOffset:{type:Number,state:!0},_computedPlacement:{type:String,state:!0}}),E(r,"styles",F`
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
    `);_=r;customElements.define("mas-mnemonic",_)});import{LitElement as K,html as y,css as W}from"./lit-all.min.js";var Z=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),j=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var U='span[is="inline-price"][data-wcs-osi]',Y='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var $='a[is="upt-link"]',J=`${U},${Y},${$}`;var tt=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var et=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var V=["www.adobe.com","www.stage.adobe.com"];function N(o,e=window.location.hostname){if(!o||!V.includes(e))return o;try{let t=new URL(o,`https://${e}`);return/\.aem\.(live|page)$/.test(t.hostname)?`${t.pathname}${t.search}${t.hash}`:o}catch{return o}}function q(o){if(!o)return"";let e=`${o}`.split(/[?#]/)[0],n=e.substring(e.lastIndexOf("/")+1).replace(/\.[a-z0-9]+$/i,"");return n?n.split(/[-_]+/).filter(Boolean).map(a=>a.charAt(0).toUpperCase()+a.slice(1)).join(" "):""}function X(){return customElements.get("sp-tooltip")!==void 0||document.querySelector("sp-theme")!==null}var T=class extends K{constructor(){super(),this.size="m",this.alt="",this.loading="lazy"}connectedCallback(){super.connectedCallback(),setTimeout(()=>this.handleTooltips(),0)}handleTooltips(){if(X())return;this.querySelectorAll("sp-tooltip, overlay-trigger").forEach(t=>{let n="",a="top";if(t.tagName==="SP-TOOLTIP")n=t.textContent,a=t.getAttribute("placement")||"top";else if(t.tagName==="OVERLAY-TRIGGER"){let i=t.querySelector("sp-tooltip");i&&(n=i.textContent,a=i.getAttribute("placement")||t.getAttribute("placement")||"top")}if(n){let i=document.createElement("mas-mnemonic");i.setAttribute("content",n),i.setAttribute("placement",a);let c=this.querySelector("img"),l=this.querySelector("a");l&&l.contains(c)?i.appendChild(l):c&&i.appendChild(c),this.innerHTML="",this.appendChild(i),Promise.resolve().then(()=>P())}t.remove()})}render(){let{href:e}=this,t=N(this.src),n=this.hasAttribute("alt")?this.alt:q(this.src);return e?y`<a href="${e}">
                  <img src="${t}" alt="${n}" loading="${this.loading}" />
              </a>`:y` <img
                  src="${t}"
                  alt="${n}"
                  loading="${this.loading}"
              />`}};E(T,"properties",{size:{type:String,attribute:!0},src:{type:String,attribute:!0},alt:{type:String,attribute:!0},href:{type:String,attribute:!0},loading:{type:String,attribute:!0}}),E(T,"styles",W`
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
    `);customElements.define("merch-icon",T);export{T as default,q as getDefaultIconAlt};
