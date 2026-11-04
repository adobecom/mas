var ga=Object.defineProperty;var ua=a=>{throw TypeError(a)};var zn=(a,r,e)=>r in a?ga(a,r,{enumerable:!0,configurable:!0,writable:!0,value:e}):a[r]=e;var Pn=(a,r,e)=>()=>{if(e)throw e[0];try{return a&&(r=a(a=0)),r}catch(t){throw e=[t],t}};var _n=(a,r)=>{for(var e in r)ga(a,e,{get:r[e],enumerable:!0})};var d=(a,r,e)=>zn(a,typeof r!="symbol"?r+"":r,e),ur=(a,r,e)=>r.has(a)||ua("Cannot "+e);var h=(a,r,e)=>(ur(a,r,"read from private field"),e?e.call(a):r.get(a)),f=(a,r,e)=>r.has(a)?ua("Cannot add the same private member more than once"):r instanceof WeakSet?r.add(a):r.set(a,e),g=(a,r,e,t)=>(ur(a,r,"write to private field"),t?t.call(a,e):r.set(a,e),e),E=(a,r,e)=>(ur(a,r,"access private method"),e);var Cr={};_n(Cr,{default:()=>pt});import{LitElement as Dn,html as Me,css as In,nothing as Fn}from"./lit-all.min.js";import{unsafeHTML as Ia}from"./lit-all.min.js";import{ifDefined as Bn}from"./lit-all.min.js";function Hn(){return customElements.get("sp-tooltip")!==void 0&&customElements.get("overlay-trigger")!==void 0&&document.querySelector("sp-theme")!==null}var B,pt,Sr=Pn(()=>{B=class B extends Dn{constructor(){super(),this.content="",this.placement="top",this.variant="",this.size="xs",this.smartPlacement=!1,this.tooltipVisible=!1,this.lastPointerType=null,this.handleClickOutside=this.handleClickOutside.bind(this),this._tooltipTop=0,this._tooltipLeft=0,this._arrowOffset=0,this._computedPlacement="top"}connectedCallback(){super.connectedCallback(),window.addEventListener("mousedown",this.handleClickOutside),!this.smartPlacement&&this.closest('merch-card[variant="fries"]')&&(this.smartPlacement=!0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("mousedown",this.handleClickOutside)}handleClickOutside(r){let e=r.composedPath();B.activeTooltip===this&&!e.includes(this)&&this.hideTooltip()}_computeTooltipPosition(){let r=this.shadowRoot?.querySelector(".css-tooltip");if(!r)return;let e=r.getBoundingClientRect(),t=window.innerWidth,o=window.innerHeight,n=14,i=200,c=60,s=this.shadowRoot?.querySelector(".css-tooltip-body"),l=s?s.offsetWidth:i,m=s?s.offsetHeight:c,v=this.effectivePlacement;v==="top"&&e.top-m-n<0?v="bottom":v==="bottom"&&e.bottom+m+n>o?v="top":v==="left"&&e.left-l-n<0?v="right":v==="right"&&e.right+l+n>t&&(v="left");let u=e.left+e.width/2,w=e.top+e.height/2,T=6,L=(Le,dt,Ft)=>Math.max(Le,Math.min(dt,Ft)),R,F,z;v==="top"||v==="bottom"?(R=v==="top"?e.top-m-n:e.bottom+n,F=L(0,t-l,u-l/2),z=L(T,l-T*2,u-F-T)):(F=v==="left"?e.left-l-n:e.right+n,R=L(0,o-m,w-m/2),z=L(T,m-T*2,w-R-T)),this._tooltipTop=R,this._tooltipLeft=F,this._arrowOffset=z,this._computedPlacement=v}showTooltip(){B.activeTooltip&&B.activeTooltip!==this&&(B.activeTooltip.closeOverlay(),B.activeTooltip.tooltipVisible=!1,B.activeTooltip.requestUpdate()),B.activeTooltip=this,this.smartPlacement&&this._computeTooltipPosition(),this.tooltipVisible=!0,this.smartPlacement&&this.updateComplete.then(()=>this._computeTooltipPosition())}hideTooltip(){B.activeTooltip===this&&(B.activeTooltip=null),this.tooltipVisible=!1}handleTap(r){r.preventDefault(),this.tooltipVisible?this.hideTooltip():this.showTooltip()}closeOverlay(){let r=this.shadowRoot?.querySelector("overlay-trigger");r?.open!==void 0&&(r.open=!1)}get effectiveContent(){return this.tooltipText||this.mnemonicText||this.content||this.textContent?.trim()||""}get effectivePlacement(){return this.tooltipPlacement||this.mnemonicPlacement||this.placement||"top"}renderIcon(){return this.src?Me`<merch-icon
            src="${this.src}"
            size="${this.size}"
        ></merch-icon>`:Me`<slot></slot>`}render(){let r=this.effectiveContent,e=this.effectivePlacement;if(!r)return Me`<span class="icon-only">${this.renderIcon()}</span>`;if(Hn())return Me`
                <overlay-trigger
                    placement="${e}"
                    @sp-opened=${()=>this.showTooltip()}
                >
                    <span slot="trigger">${this.renderIcon()}</span>
                    <sp-tooltip
                        slot="hover-content"
                        placement="${e}"
                        variant="${this.variant}"
                    >
                        ${Ia(r)}
                    </sp-tooltip>
                </overlay-trigger>
            `;let o=r.replace(/<[^>]*>/g,""),n=this.tooltipVisible?"tooltip-visible":"",i={pointerdown:p=>{this.lastPointerType=p.pointerType},pointerenter:p=>p.pointerType!=="touch"&&this.showTooltip(),pointerleave:p=>p.pointerType!=="touch"&&this.hideTooltip(),click:p=>{this.lastPointerType==="touch"&&this.handleTap(p),this.lastPointerType=null}},c=this._computedPlacement,s=c==="top"||c==="bottom",l=this.smartPlacement?`top:${this._tooltipTop}px;left:${this._tooltipLeft}px;`:void 0,m=s?`left:${this._arrowOffset}px`:`top:${this._arrowOffset}px`;return Me`
            <span
                class="css-tooltip ${this.smartPlacement?"smart":e} ${n}"
                tabindex="0"
                role="img"
                aria-label="${o}"
                @pointerdown=${i.pointerdown}
                @pointerenter=${i.pointerenter}
                @pointerleave=${i.pointerleave}
                @click=${i.click}
            >
                ${this.renderIcon()}
                <span class="css-tooltip-body" style=${Bn(l)}>
                    ${Ia(r)}
                    ${this.smartPlacement?Me`<span
                              aria-hidden="true"
                              role="presentation"
                              class="css-tooltip-tip ${c}"
                              style="${m}"
                          ></span>`:Fn}
                </span>
            </span>
        `}};d(B,"activeTooltip",null),d(B,"properties",{content:{type:String},placement:{type:String},variant:{type:String},src:{type:String},size:{type:String},tooltipText:{type:String,attribute:"tooltip-text"},tooltipPlacement:{type:String,attribute:"tooltip-placement"},mnemonicText:{type:String,attribute:"mnemonic-text"},mnemonicPlacement:{type:String,attribute:"mnemonic-placement"},alt:{type:String},smartPlacement:{type:Boolean,attribute:"smart-placement"},tooltipVisible:{type:Boolean,state:!0},_tooltipTop:{type:Number,state:!0},_tooltipLeft:{type:Number,state:!0},_arrowOffset:{type:Number,state:!0},_computedPlacement:{type:String,state:!0}}),d(B,"styles",In`
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
    `);pt=B;customElements.define("mas-mnemonic",pt)});import{LitElement as Cs}from"./lit-all.min.js";import{css as ba,unsafeCSS as fa}from"./lit-all.min.js";var S="(max-width: 767px)",O="(max-width: 1199px)",x="(min-width: 768px)",C="(min-width: 1200px)",$="(min-width: 1600px)",re="(min-width: 1280px)",ze="(min-width: 1440px)",Mn={matchMobile:window.matchMedia(S),matchDesktop:window.matchMedia(`${C} and (not ${$})`),matchDesktopOrUp:window.matchMedia(C),matchLargeDesktop:window.matchMedia($),get isMobile(){return this.matchMobile.matches},get isDesktop(){return this.matchDesktop.matches},get isDesktopOrUp(){return this.matchDesktopOrUp.matches}},k=Mn;var va=ba`
    :host {
        --consonant-merch-card-background-color: #fff;
        --consonant-merch-card-border: 1px solid
            var(--consonant-merch-card-border-color);
        -webkit-font-smoothing: antialiased;
        background-color: var(--consonant-merch-card-background-color);
        border-radius: var(--consonant-merch-spacing-xs);
        border: var(--consonant-merch-card-border);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        font-family: var(--merch-body-font-family, 'Adobe Clean');
        grid-template-columns: repeat(auto-fit, minmax(300px, max-content));
        position: relative;
        text-align: start;
    }

    :host(.placeholder) {
        visibility: hidden;
    }

    :host([aria-selected]) {
        outline: none;
        box-shadow: inset 0 0 0 2px var(--color-accent);
    }

    .invisible {
        visibility: hidden;
    }

    :host(:hover) .invisible,
    :host(:active) .invisible,
    :host(:focus) .invisible {
        visibility: visible;
        background-image: var(--ellipsis-icon);
        cursor: pointer;
    }

    .action-menu.always-visible {
        visibility: visible;
        background-image: var(--ellipsis-icon);
        cursor: pointer;
    }

    .top-section {
        display: flex;
        justify-content: flex-start;
        align-items: flex-start;
        gap: 16px;
    }

    .top-section.badge {
        min-height: 32px;
    }

    .body {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        height: 100%;
        gap: var(--consonant-merch-spacing-xxs);
        padding: var(--consonant-merch-spacing-xs);
    }

    footer {
        display: flex;
        justify-content: flex-end;
        box-sizing: border-box;
        align-items: flex-end;
        width: 100%;
        flex-flow: wrap;
        gap: var(--consonant-merch-spacing-xs);

        padding: var(--consonant-merch-spacing-xs);
    }

    footer.wide-footer {
        align-items: center;
    }

    footer.wide-footer .secure-transaction-label {
        flex: 0 1 auto;
    }

    footer.footer-column {
        flex-direction: column;
    }

    footer.footer-column .secure-transaction-label {
        align-self: flex-start;
    }

    hr {
        background-color: var(--merch-color-grey-200);
        border: none;
        height: 1px;
        width: auto;
        margin-top: 0;
        margin-bottom: 0;
        margin-left: var(--consonant-merch-spacing-xs);
        margin-right: var(--consonant-merch-spacing-xs);
    }

    div[class$='-badge'] {
        position: absolute;
        top: 16px;
        right: 0;
        font-size: var(--type-heading-xxs-size);
        font-weight: 500;
        max-width: 180px;
        line-height: 16px;
        text-align: center;
        padding: 8px 11px;
        border-radius: 5px 0 0 5px;
    }

    div[class$='-badge']:dir(rtl) {
        left: 0;
        right: initial;
        padding: 8px 11px;
        border-radius: 0 5px 5px 0;
    }

    :host([variant='mini-compare-chart']) div[class$='-badge'] {
        font-size: 14px;
    }

    .detail-bg-container {
        right: 0;
        padding: var(--consonant-merch-spacing-xs);
        border-radius: 5px;
        font-size: var(--consonant-merch-card-body-font-size);
        margin: var(--consonant-merch-spacing-xs);
    }

    .action-menu {
        display: flex;
        width: 32px;
        height: 32px;
        position: absolute;
        top: 16px;
        inset-inline-end: 16px;
        background-color: #f6f6f6;
        background-repeat: no-repeat;
        background-position: center;
        background-size: 16px 16px;
        font-size: 0;
    }

    .action-menu:dir(rtl) {
        right: initial;
        left: 16px;
    }

    .hidden {
        visibility: hidden;
    }

    #stock-checkbox,
    .secure-transaction-label {
        font-size: var(--consonant-merch-card-body-xxs-font-size);
        line-height: 1.3;
        color: var(--merch-color-grey-600);
    }

    #stock-checkbox {
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        gap: 10px; /*same as spectrum */
    }

    #stock-checkbox > input {
        display: none;
    }

    #stock-checkbox > span {
        display: inline-block;
        box-sizing: border-box;
        border: 2px solid rgb(117, 117, 117);
        border-radius: 2px;
        width: 14px;
        height: 14px;
    }

    #stock-checkbox > input:checked + span {
        background: var(--checkmark-icon) no-repeat var(--color-accent);
        border-color: var(--color-accent);
    }

    .secure-transaction-label {
        white-space: nowrap;
        display: inline-flex;
        gap: var(--consonant-merch-spacing-xxs);
        align-items: center;
        flex: 1;
        line-height: normal;
        align-self: center;
    }

    .secure-transaction-label::before {
        display: inline-block;
        content: '';
        width: 12px;
        height: 15px;
        background: var(--secure-icon) no-repeat;
        background-position: center;
        background-size: contain;
    }

    .checkbox-container {
        display: flex;
        align-items: center;
        gap: var(--consonant-merch-spacing-xxs);
    }

    .checkbox-container input[type='checkbox']:checked + .checkmark {
        background-color: var(--color-accent);
        background-image: var(--checkmark-icon);
        border-color: var(--color-accent);
    }

    .checkbox-container input[type='checkbox'] {
        display: none;
    }

    .checkbox-container .checkmark {
        position: relative;
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 2px solid #757575;
        background: #fff;
        border-radius: 2px;
        cursor: pointer;
        margin-top: 2px;
    }

    slot[name='icons'] {
        display: flex;
        gap: 8px;
    }

    ::slotted(.modal-trigger) {
        cursor: pointer;
    }

    ::slotted(.modal-trigger:hover) {
        text-decoration: underline;
    }

    ::slotted([slot='price']) {
        color: var(--consonant-merch-card-price-color);
    }
`,xa=()=>[ba`
            /* Tablet */
            @media screen and ${fa(x)} {
                :host([size='wide']),
                :host([size='super-wide']) {
                    width: 100%;
                    grid-column: 1 / -1;
                }
            }

            /* Laptop */
            @media screen and ${fa(C)} {
                :host([size='wide']) {
                    grid-column: span 2;
                }
            }
        `];import{LitElement as qn,html as Fa,css as Un}from"./lit-all.min.js";var ae=2e4;var y='span[is="inline-price"][data-wcs-osi]',Z='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Rn='a[is="upt-link"]',ya=`${y},${Z},${Rn}`,fr=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]),wa=["headless","marquee","banner-blade"];var Ea="merch-offer-select:ready",ka="merch-card:action-menu-toggle";var D="merch-quantity-selector:change",ht="merch-card-quantity:change",br="merch-modal:addon-and-quantity-update";var Pe="merch-card-collection:literals-changed";var Bt="aem:load",Ht="aem:error",ge="mas:ready",Ca="mas:error";var Sa="placeholder-failed",Aa="placeholder-pending",Ta="placeholder-resolved";var La="mas:failed",I="mas:resolved",za="mas/commerce";var oe="failed",ue="pending",ne="resolved";var vr="X-Request-Id",Ns=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Os=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var Pa=":start",_a=":duration";var P="legal",Ma="plan-type-text",Ra="mas-ff-defaults";var Nn="mas-commerce-service",xr=/^(accent|primary|secondary)(-(outline|link))?$/;function Na(a,r){let e;return function(){let t=this,o=arguments;clearTimeout(e),e=setTimeout(()=>a.apply(t,o),r)}}function _(a,r={},e=null,t=null){let o=t?document.createElement(a,{is:t}):document.createElement(a);e instanceof HTMLElement?o.appendChild(e):o.innerHTML=e;for(let[n,i]of Object.entries(r))o.setAttribute(n,i);return o}function wr(a){let r=[...a.classList].find(t=>xr.test(t));if(r)return r;let e=a.closest("strong, em");return e?.tagName==="STRONG"?"primary":e?.tagName==="EM"?"secondary":"secondary-link"}function Oa(a){let r=wr(a),e=a.cloneNode(!0);if([...a.classList].some(o=>xr.test(o))){let o=a.parentElement;for(;o?.matches("strong, em");){let n=e.firstElementChild;(n?.tagName!==o.tagName||e.innerHTML.trim()!==n.outerHTML)&&e.replaceChildren(_(o.tagName.toLowerCase(),{},e.innerHTML)),o=o.parentElement}}let t=e;if(a.dataset.wcsOsi){t=customElements.get("checkout-link")?.createCheckoutLink(a.dataset,e.innerHTML),t||(t=document.createElement("a",{is:"checkout-link"}),t.setAttribute("is","checkout-link"),t.innerHTML=`<span style="pointer-events: none;">${e.innerHTML}</span>`);for(let{name:n,value:i}of a.attributes)["is","href"].includes(n)||t.setAttribute(n,i)}for(let o of[...t.classList])xr.test(o)&&t.classList.remove(o);return r.endsWith("-link")||(t.classList.add("button","con-button"),t.classList.add(r==="accent"||r==="primary"?"blue":"outline")),t}function Er(a){return`startTime:${a.startTime.toFixed(2)}|duration:${a.duration.toFixed(2)}`}function kr(){return window.matchMedia("(max-width: 1024px)").matches}var yr=new Map,On=0;function qt(a,r){let e=++On,t=r,o=performance.now(),n,i=()=>{_e(e),a()},c=()=>{o=performance.now(),n=setTimeout(i,t)},s=()=>{document.visibilityState==="hidden"?(clearTimeout(n),t-=performance.now()-o):c()};return yr.set(e,()=>{clearTimeout(n),document.removeEventListener("visibilitychange",s)}),document.addEventListener("visibilitychange",s),document.visibilityState!=="hidden"&&c(),e}function _e(a){let r=yr.get(a);r&&(r(),yr.delete(a))}function fe(){return document.getElementsByTagName(Nn)?.[0]}function mt(a){let r=window.getComputedStyle(a);return a.offsetHeight+parseFloat(r.marginTop)+parseFloat(r.marginBottom)}function $a(a){let r=a.nextElementSibling?.nodeName==="BR"?a.nextElementSibling.nextElementSibling:a.nextElementSibling;return a.dataset.template==="strikethrough"&&(a.nextSibling?.nodeName!=="#text"||a.nextSibling.textContent.trim().length<2)&&r?.isInlinePrice&&r?.dataset?.template==="price"}var $n=["www.adobe.com","www.stage.adobe.com"];function Da(a,r=window.location.hostname){if(!a||!$n.includes(r))return a;try{let e=new URL(a,`https://${r}`);return/\.aem\.(live|page)$/.test(e.hostname)?`${e.pathname}${e.search}${e.hash}`:a}catch{return a}}function jn(){return customElements.get("sp-tooltip")!==void 0||document.querySelector("sp-theme")!==null}var Re=class extends qn{constructor(){super(),this.size="m",this.alt="",this.loading="lazy"}connectedCallback(){super.connectedCallback(),setTimeout(()=>this.handleTooltips(),0)}handleTooltips(){if(jn())return;this.querySelectorAll("sp-tooltip, overlay-trigger").forEach(e=>{let t="",o="top";if(e.tagName==="SP-TOOLTIP")t=e.textContent,o=e.getAttribute("placement")||"top";else if(e.tagName==="OVERLAY-TRIGGER"){let n=e.querySelector("sp-tooltip");n&&(t=n.textContent,o=n.getAttribute("placement")||e.getAttribute("placement")||"top")}if(t){let n=document.createElement("mas-mnemonic");n.setAttribute("content",t),n.setAttribute("placement",o);let i=this.querySelector("img"),c=this.querySelector("a");c&&c.contains(i)?n.appendChild(c):i&&n.appendChild(i),this.innerHTML="",this.appendChild(n),Promise.resolve().then(()=>Sr())}e.remove()})}render(){let{href:r}=this,e=Da(this.src);return r?Fa`<a href="${r}">
                  <img
                      src="${e}"
                      alt="${this.alt}"
                      loading="${this.loading}"
                  />
              </a>`:Fa` <img
                  src="${e}"
                  alt="${this.alt}"
                  loading="${this.loading}"
              />`}};d(Re,"properties",{size:{type:String,attribute:!0},src:{type:String,attribute:!0},alt:{type:String,attribute:!0},href:{type:String,attribute:!0},loading:{type:String,attribute:!0}}),d(Re,"styles",Un`
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
    `);customElements.define("merch-icon",Re);var gt,be,ut,ft,Ne,Ut=class extends HTMLElement{constructor(){super();f(this,gt,"");f(this,be);f(this,ut,[]);f(this,ft,[]);f(this,Ne);g(this,Ne,Na(()=>{this.isConnected&&(this.parentElement.style.background=this.value,h(this,be)?this.parentElement.style.borderRadius=h(this,be):h(this,be)===""&&(this.parentElement.style.borderRadius=""))},1))}static get observedAttributes(){return["colors","positions","angle","border-radius"]}get value(){let e=h(this,ut).map((t,o)=>{let n=h(this,ft)[o]||"";return`${t} ${n}`}).join(", ");return`linear-gradient(${h(this,gt)}, ${e})`}connectedCallback(){h(this,Ne).call(this)}attributeChangedCallback(e,t,o){e==="border-radius"&&g(this,be,o?.trim()),e==="colors"&&o?g(this,ut,o?.split(",").map(n=>n.trim())??[]):e==="positions"&&o?g(this,ft,o?.split(",").map(n=>n.trim())??[]):e==="angle"&&g(this,gt,o?.trim()??""),h(this,Ne).call(this)}};gt=new WeakMap,be=new WeakMap,ut=new WeakMap,ft=new WeakMap,Ne=new WeakMap;customElements.define("merch-gradient",Ut);import{LitElement as Gn,html as Ba,css as Vn,nothing as Ha}from"./lit-all.min.js";var Oe=class extends Gn{constructor(){super(),this.planType=void 0,this.checked=!1,this.updatePlanType=this.updatePlanType.bind(this),this.handleChange=this.handleChange.bind(this),this.handleCustomClick=this.handleCustomClick.bind(this)}getOsi(r,e){let n=({TRIAL:["TRIAL"],BASE:["BASE","PROMOTION","TRIAL"],PROMOTION:["PROMOTION","BASE","TRIAL"]}[e]||[e]).map(c=>`p[data-plan-type="${r}"] ${y}[data-offer-type="${c}"]`).join(", ");return this.querySelector(n)?.dataset?.wcsOsi}connectedCallback(){super.connectedCallback(),this.addEventListener(I,this.updatePlanType),this.background&&this.style.setProperty("--merch-addon-background",this.background);let r=this.closest("merch-card");r&&customElements.whenDefined("merch-card").then(()=>r.updateComplete).then(()=>{this.requestUpdate()})}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(I,this.updatePlanType)}updatePlanType(r){if(r.target.tagName!=="SPAN")return;let e=r.target,t=e?.value?.[0];if(!t)return;e.setAttribute("data-offer-type",t.offerType);let o=e.closest("p");if(o.getAttribute("data-plan-type"))return;let n=this.querySelector(`p[data-plan-type="${t.planType}"]`);n&&n!==o||o.setAttribute("data-plan-type",t.planType)}handleChange(r){this.checked=r.target.checked,this.dispatchEvent(new CustomEvent("change",{detail:{checked:this.checked},bubbles:!0,composed:!0}))}handleCustomClick(){this.shadowRoot.querySelector("input").click()}handleKeyDown(r){r.key===" "&&(r.preventDefault(),this.handleCustomClick())}render(){let r=this.closest("merch-card")?.title,e=r?"custom-checkbox-label addon-product":"custom-checkbox-label";return Ba` <input
                type="checkbox"
                id="addon-checkbox"
                aria-labelledby=${r?e:Ha}
                .checked=${this.checked}
                @change=${this.handleChange}
            />
            <span
                role="checkbox"
                aria-checked=${this.checked}
                tabindex="0"
                aria-labelledby=${e}
                id="custom-checkbox"
                @click=${this.handleCustomClick}
                @keydown=${this.handleKeyDown}
            >
            </span>
            <label id="custom-checkbox-label" for="addon-checkbox">
                <slot></slot>
            </label>
            ${r?Ba`<span id="addon-product" hidden>${r}</span>`:Ha}`}};d(Oe,"properties",{planType:{type:String,attribute:"plan-type",reflect:!0},checked:{type:Boolean,reflect:!0},customCheckbox:{type:Boolean,attribute:"custom-checkbox",reflect:!0},background:{type:String,attribute:"background"}}),d(Oe,"styles",Vn`
        :host {
            --merch-addon-gap: 9px;
            --merch-addon-align: start;
            --merch-addon-checkbox-size: unset;
            --merch-addon-checkbox-border: unset;
            --merch-addon-checkbox-radius: unset;
            --merch-addon-checkbox-checked-bg: unset;
            --merch-addon-checkbox-checked-color: unset;
            --merch-addon-label-size: unset;
            --merch-addon-label-color: unset;
            --merch-addon-label-line-height: unset;
            display: flex;
            gap: var(--merch-addon-gap);
            align-items: var(--merch-addon-align);
            cursor: pointer;
        }

        :host([custom-checkbox]) #addon-checkbox {
            display: none;
        }

        :host([custom-checkbox]) #custom-checkbox {
            display: block;
        }

        :host #custom-checkbox {
            display: none;
            width: var(--merch-addon-checkbox-size);
            height: var(--merch-addon-checkbox-size);
            border: var(--merch-addon-checkbox-border);
            border-radius: var(--merch-addon-checkbox-radius);
            box-sizing: border-box;
            background: var(--merch-addon-checkbox-bg, transparent);
        }

        :host #addon-checkbox:checked + #custom-checkbox {
            background: var(--merch-addon-checkbox-checked-bg) no-repeat
                var(
                    --merch-addon-checkbox-checked-bg-color,
                    var(--merch-addon-checkbox-checked-color)
                );
            border-color: var(--merch-addon-checkbox-checked-color);
        }

        ::slotted(p:not([data-plan-type])) {
            color: var(--merch-addon-label-color);
            font-size: var(--merch-addon-label-size);
            line-height: var(--merch-addon-label-line-height);
            font-style: normal;
            font-weight: var(--merch-addon-label-weight, 400);
            cursor: pointer;
        }

        ::slotted(p[data-plan-type]) {
            display: none;
        }

        :host([plan-type='PUF']) ::slotted(p[data-plan-type='PUF']) {
            display: block;
        }

        :host([plan-type='ABM']) ::slotted(p[data-plan-type='ABM']) {
            display: block;
        }

        :host([plan-type='M2M']) ::slotted(p[data-plan-type='M2M']) {
            display: block;
        }
    `);customElements.define("merch-addon",Oe);import{html as jt,nothing as Wn}from"./lit-all.min.js";var $e,bt=class bt{constructor(r){d(this,"card");f(this,$e);this.card=r,this.insertVariantStyle()}getContainer(){return g(this,$e,h(this,$e)??this.card.closest('merch-card-collection, [class*="-merch-cards"]')??this.card.parentElement),h(this,$e)}insertVariantStyle(){let r=this.constructor.name;if(!bt.styleMap[r]){bt.styleMap[r]=!0;let e=document.createElement("style");e.innerHTML=this.getGlobalCSS(),document.head.appendChild(e)}}updateCardElementMinHeight(r,e){if(!r||this.card.heightSync===!1)return;let t=`--consonant-merch-card-${this.card.variant}-${e}-height`,o=Math.max(0,parseInt(window.getComputedStyle(r).height)||0),n=this.getContainer(),i=parseInt(n.style.getPropertyValue(t))||0;o>i&&n.style.setProperty(t,`${o}px`)}syncRowHeights(r){if(this.card.heightSync===!1)return;let e=this.getContainer();if(!e)return;let t=this.card.variant,o=Array.from(e.querySelectorAll(`merch-card[variant="${t}"]`)).filter(i=>i.variantLayout?.card?.heightSync!==!1);if(o.length===0)return;for(let{name:i}of r){let c=`--consonant-merch-card-${t}-${i}-height`;e.style.getPropertyValue(c)&&e.style.removeProperty(c)}let n=new Map;for(let i of o){let c=i.getBoundingClientRect();if(c.width<=2)continue;let s=Math.round(c.top),l=n.get(s);l||(l=[],n.set(s,l)),l.push(i)}for(let i of n.values())for(let{name:c,getElement:s}of r){let l=`--consonant-merch-card-${t}-${c}-height`,m=i.map(u=>u.style.getPropertyValue(l)),p=0,v=i.map(u=>{u.style.removeProperty(l);let w=s(u);if(!w)return w;let T=Math.max(0,parseInt(window.getComputedStyle(w).height)||0);return T>p&&(p=T),w});i.forEach((u,w)=>{v[w]?.tagName!=="HR"&&(p>0?u.style.setProperty(l,`${p}px`):m[w]&&u.style.setProperty(l,m[w]))})}}get legalDisplayDot(){return!0}get badge(){let r;if(!(!this.card.badgeBackgroundColor||!this.card.badgeColor||!this.card.badgeText))return this.evergreen&&(r=`border: 1px solid ${this.card.badgeBackgroundColor}; border-right: none;`),jt`
            <div
                id="badge"
                class="${this.card.variant}-badge"
                style="background-color: ${this.card.badgeBackgroundColor};
                color: ${this.card.badgeColor};
                ${r}"
            >
                ${this.card.badgeText}
            </div>
        `}get cardImage(){return jt` <div class="image">
            <slot name="bg-image"></slot>
            ${this.badge}
        </div>`}getGlobalCSS(){return""}get theme(){return document.querySelector("sp-theme")}get evergreen(){return this.card.classList.contains("intro-pricing")}get promoBottom(){return this.card.classList.contains("promo-bottom")}get headingSelector(){return'[slot="heading-xs"]'}get secureLabel(){return this.card.secureLabel?jt`<span class="secure-transaction-label"
                  >${this.card.secureLabel}</span
              >`:Wn}get secureLabelFooter(){return jt`<footer>
            ${this.secureLabel}<slot name="footer"></slot>
        </footer>`}async postCardUpdateHook(){if(this.card.isConnected&&(await this.card.updateComplete,this.card.prices?.length>0)){let r=Promise.allSettled(this.card.prices.map(o=>o.onceSettled?.()||Promise.resolve())),e,t=new Promise(o=>{e=setTimeout(o,ae)});await Promise.race([r,t]),clearTimeout(e)}}connectedCallbackHook(){}disconnectedCallbackHook(){}syncHeights(){}renderLayout(){}get aemFragmentMapping(){return this.card.constructor.getFragmentMapping(this.card.variant)}};$e=new WeakMap,d(bt,"styleMap",{});var b=bt;import{html as Ar,css as Kn}from"./lit-all.min.js";var qa=`
:root {
    --consonant-merch-card-catalog-width: 302px;
    --consonant-merch-card-catalog-icon-size: 40px;
}

.collection-container.catalog {
    --merch-card-collection-card-min-height: 330px;
    --merch-card-collection-card-width: var(--consonant-merch-card-catalog-width);
}

merch-sidenav.catalog {
    --merch-sidenav-title-font-size: 15px;
    --merch-sidenav-title-font-weight: 500;
    --merch-sidenav-title-line-height: 19px;
    --merch-sidenav-title-color: rgba(70, 70, 70, 0.87);
    --merch-sidenav-title-padding: 8px 15px 21px;
    --merch-sidenav-item-height: 40px;
    --merch-sidenav-item-inline-padding: 15px;
    --merch-sidenav-item-font-weight: 700;
    --merch-sidenav-item-font-size: 17px;
    --merch-sidenav-item-line-height: normal;
    --merch-sidenav-item-label-top-margin: 8px;
    --merch-sidenav-item-label-bottom-margin: 11px;
    --merch-sidenav-item-icon-top-margin: 11px;
    --merch-sidenav-item-icon-gap: 13px;
    --merch-sidenav-item-selected-background: var(--spectrum-gray-300, #D5D5D5);
    --merch-sidenav-list-item-gap: 5px;
    --merch-sidenav-checkbox-group-padding: 0 15px;
    --merch-sidenav-modal-border-radius: 0;
}

merch-sidenav.catalog merch-sidenav-checkbox-group {
    border: none;
}

merch-sidenav.catalog merch-sidenav-list:not(:first-of-type) {
    --merch-sidenav-list-gap: 32px;
}

.one-merch-card.catalog,
.two-merch-cards.catalog,
.three-merch-cards.catalog,
.four-merch-cards.catalog {
    --merch-card-collection-card-width: var(--consonant-merch-card-catalog-width);
}

merch-card[variant="catalog"][size="wide"],
merch-card[variant="catalog"][size="super-wide"] {
    width: auto;
}

.collection-container.catalog merch-sidenav {
    --merch-sidenav-gap: 10px;
}

merch-card-collection-header.catalog {
    --merch-card-collection-header-row-gap: var(--consonant-merch-spacing-xs);
    --merch-card-collection-header-search-max-width: 244px;
}

@media screen and ${S} {
    merch-card-collection-header.catalog {
        --merch-card-collection-header-columns: min-content auto;
    }
}

@media screen and ${x} {
    merch-card-collection-header.catalog {
        --merch-card-collection-header-column-gap: 16px;
    }
}

@media screen and ${C} {
    :root {
        --consonant-merch-card-catalog-width: 300px;
    }

    merch-card-collection-header.catalog {
        --merch-card-collection-header-result-font-size: 17px;
    }
}

merch-card[variant="catalog"] [slot="action-menu-content"] {
  background-color: #000;
  color: var(--color-white, #fff);
  font-size: var(--consonant-merch-card-body-xs-font-size);
  width: fit-content;
  padding: var(--consonant-merch-spacing-xs);
  border-radius: var(--consonant-merch-spacing-xxxs);
  position: absolute;
  top: 55px;
  right: 15px;
  line-height: var(--consonant-merch-card-body-line-height);
}

[dir="rtl"] merch-card[variant="catalog"] [slot="action-menu-content"] {
  right: initial;
  left: 15px;
}

merch-card[variant="catalog"] [slot="action-menu-content"] ul {
  padding-left: 0;
  padding-bottom: var(--consonant-merch-spacing-xss);
  margin-top: 0;
  margin-bottom: 0;
  list-style-position: inside;
  list-style-type: '\u2022 ';
}

[dir="rtl"] merch-card[variant="catalog"] [slot="action-menu-content"] ul {
  padding-right: 0;
  padding-left: unset;
}

merch-card[variant="catalog"] [slot="action-menu-content"] ul li {
  padding-left: 0;
  line-height: var(--consonant-merch-card-body-line-height);
}

merch-card[variant="catalog"] [slot="action-menu-content"] ul li p {
  display: inline;
}

merch-card[variant="catalog"] [slot="action-menu-content"] ::marker {
  margin-right: 0;
}

merch-card[variant="catalog"] [slot="action-menu-content"] p {
  color: var(--color-white, #fff);
  margin: 0;
}

merch-card[variant="catalog"] [slot="action-menu-content"] a {
  color: var(--consonant-merch-card-background-color);
  text-decoration: underline;
}

merch-card[variant="catalog"] .payment-details {
  font-size: var(--consonant-merch-card-body-font-size);
  font-style: italic;
  font-weight: 400;
  line-height: var(--consonant-merch-card-body-line-height);
}

merch-card[variant="catalog"] [slot="footer"] .spectrum-Link--primary {
  font-size: 15px;
  font-weight: 700;
}`;var Ua={cardName:{attribute:"name"},badge:!0,ctas:{slot:"footer",size:"m"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},prices:{tag:"h3",slot:"heading-xs"},shortDescription:{tag:"div",slot:"action-menu-content",attributes:{tabindex:"0"}},size:["wide","super-wide"],title:{tag:"h3",slot:"heading-xs"}},De=class extends b{constructor(e){super(e);d(this,"dispatchActionMenuToggle",()=>{this.card.dispatchEvent(new CustomEvent(ka,{bubbles:!0,composed:!0,detail:{card:this.card.name,type:"action-menu"}}))});d(this,"toggleActionMenu",e=>{!this.actionMenuContentSlot||!e||e.type!=="click"&&e.code!=="Space"&&e.code!=="Enter"||(e.preventDefault(),e.stopPropagation(),this.setMenuVisibility(!this.isMenuOpen()))});d(this,"toggleActionMenuFromCard",e=>{let t=e?.type==="mouseleave"?!0:void 0;this.card.blur(),this.setIconVisibility(!1),this.actionMenuContentSlot&&e?.type==="mouseleave"&&this.setMenuVisibility(!1)});d(this,"showActionMenuOnHover",()=>{this.actionMenu&&this.setIconVisibility(!0)});d(this,"hideActionMenu",()=>{this.setMenuVisibility(!1),this.setIconVisibility(!1)});d(this,"hideActionMenuOnBlur",e=>{e.relatedTarget===this.actionMenu||this.actionMenu?.contains(e.relatedTarget)||this.slottedContent?.contains(e.relatedTarget)||(this.isMenuOpen()&&this.setMenuVisibility(!1),this.card.contains(e.relatedTarget)||this.setIconVisibility(!1))});d(this,"handleCardFocusOut",e=>{e.relatedTarget===this.actionMenu||this.actionMenu?.contains(e.relatedTarget)||e.relatedTarget===this.card||(this.slottedContent&&(e.target===this.slottedContent||this.slottedContent.contains(e.target))&&(this.slottedContent.contains(e.relatedTarget)||this.setMenuVisibility(!1)),!this.card.contains(e.relatedTarget)&&!this.isMenuOpen()&&this.setIconVisibility(!1))});d(this,"handleKeyDown",e=>{(e.key==="Escape"||e.key==="Esc")&&(e.preventDefault(),this.hideActionMenu(),this.actionMenu?.focus())})}get actionMenu(){return this.card.shadowRoot.querySelector(".action-menu")}get actionMenuContentSlot(){return this.card.shadowRoot.querySelector('slot[name="action-menu-content"]')}get slottedContent(){return this.card.querySelector('[slot="action-menu-content"]')}setIconVisibility(e){if(this.slottedContent){if(kr()&&this.card.actionMenu)return;this.actionMenu?.classList.toggle("invisible",!e),this.actionMenu?.classList.toggle("always-visible",e)}}setMenuVisibility(e){this.actionMenuContentSlot?.classList.toggle("hidden",!e),this.setAriaExpanded(this.actionMenu,e.toString()),e&&(this.dispatchActionMenuToggle(),setTimeout(()=>{let t=this.slottedContent?.querySelector("a");t&&t.focus()},0))}isMenuOpen(){return!this.actionMenuContentSlot?.classList.contains("hidden")}renderLayout(){return Ar` <div class="body">
                <div class="top-section">
                    <slot name="icons"></slot> ${this.badge}
                    <div
                        class="action-menu
                ${this.slottedContent?kr()&&this.card.actionMenu?"always-visible":"invisible":"hidden"}"
                        @click="${this.toggleActionMenu}"
                        @keypress="${this.toggleActionMenu}"
                        @focus="${this.showActionMenuOnHover}"
                        @blur="${this.hideActionMenuOnBlur}"
                        tabindex="0"
                        aria-expanded="false"
                        aria-hidden="false"
                        role="button"
                    >
                        ${this.card.actionMenuLabel} - ${this.card.title}
                    </div>
                </div>
                <slot
                    name="action-menu-content"
                    class="action-menu-content
            ${this.card.actionMenuContent?"":"hidden"}"
                    >${this.card.actionMenuContent}
                </slot>
                <slot name="heading-xs"></slot>
                <slot name="heading-m"></slot>
                <slot name="body-xxs"></slot>
                ${this.promoBottom?"":Ar`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`}
                <slot name="body-xs"></slot>
                ${this.promoBottom?Ar`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`:""}
            </div>
            ${this.secureLabelFooter}
            <slot></slot>`}getGlobalCSS(){return qa}setAriaExpanded(e,t){e.setAttribute("aria-expanded",t)}connectedCallbackHook(){this.card.addEventListener("mouseenter",this.showActionMenuOnHover),this.card.addEventListener("mouseleave",this.toggleActionMenuFromCard),this.card.addEventListener("focusin",this.showActionMenuOnHover),this.card.addEventListener("focusout",this.handleCardFocusOut),this.card.addEventListener("keydown",this.handleKeyDown)}disconnectedCallbackHook(){this.card.removeEventListener("mouseenter",this.showActionMenuOnHover),this.card.removeEventListener("mouseleave",this.toggleActionMenuFromCard),this.card.removeEventListener("focusin",this.showActionMenuOnHover),this.card.removeEventListener("focusout",this.handleCardFocusOut),this.card.removeEventListener("keydown",this.handleKeyDown)}};d(De,"variantStyle",Kn`
        :host([variant='catalog']) {
            min-height: 330px;
            width: var(--consonant-merch-card-catalog-width);
        }

        .body .catalog-badge {
            display: flex;
            height: fit-content;
            flex-direction: column;
            width: fit-content;
            max-width: 140px;
            border-radius: 5px;
            position: relative;
            top: 0;
            margin-left: var(--consonant-merch-spacing-xxs);
            box-sizing: border-box;
        }

        :host([variant='catalog']) .action-menu:dir(rtl) {
            right: initial;
            left: 16px;
        }
    `);import{html as vt,css as Yn}from"./lit-all.min.js";var ja=`
:root {
  --consonant-merch-card-image-width: 300px;
  --merch-card-collection-card-width: var(--consonant-merch-card-image-width);
}

.one-merch-card.image,
.two-merch-cards.image,
.three-merch-cards.image,
.four-merch-cards.image,
.one-merch-card:has(merch-card[variant="image"]),
.two-merch-cards:has(merch-card[variant="image"]),
.three-merch-cards:has(merch-card[variant="image"]),
.four-merch-cards:has(merch-card[variant="image"]) {
  --merch-card-collection-card-width: var(--consonant-merch-card-image-width);
  grid-template-columns: minmax(300px, var(--consonant-merch-card-image-width));
}

.section.one-merch-card:has(merch-card[variant="image"]) > .content,
.section[class*="-merch-cards"]:has(merch-card[variant="image"]) > .content {
  --merch-card-collection-card-width: var(--consonant-merch-card-image-width);
}

/* Sections inside tabs/fragments that don't receive the .image class.
   Make .content wrapper transparent so the section grid applies directly to cards. */
.one-merch-card:has(merch-card[variant="image"]) .content,
.two-merch-cards:has(merch-card[variant="image"]) .content,
.three-merch-cards:has(merch-card[variant="image"]) .content,
.four-merch-cards:has(merch-card[variant="image"]) .content {
  display: contents;
}

.one-merch-card.section merch-card[variant="image"],
.one-merch-card:has(merch-card[variant="image"]) merch-card[variant="image"] {
  width: auto;
  max-width: var(--consonant-merch-card-image-width);
  margin: 0 auto;
}

@media screen and ${x} {
  .two-merch-cards.image,
  .three-merch-cards.image,
  .four-merch-cards.image,
  .two-merch-cards:has(merch-card[variant="image"]),
  .three-merch-cards:has(merch-card[variant="image"]),
  .four-merch-cards:has(merch-card[variant="image"]) {
      grid-template-columns: repeat(2, minmax(300px, var(--consonant-merch-card-image-width)));
  }
}

@media screen and ${C} {
  :root {
    --consonant-merch-card-image-width: 378px;
  }

  .three-merch-cards.image,
  .three-merch-cards:has(merch-card[variant="image"]) {
      grid-template-columns: repeat(3, var(--consonant-merch-card-image-width));
  }

  .four-merch-cards.image,
  .four-merch-cards:has(merch-card[variant="image"]) {
      grid-template-columns: repeat(auto-fit, var(--consonant-merch-card-image-width));
  }
}
`;var Ga={cardName:{attribute:"name"},badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},badgeIcon:!0,borderColor:{attribute:"border-color"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],ctas:{slot:"footer",size:"m"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},prices:{tag:"h3",slot:"heading-xs"},promoText:{tag:"p",slot:"promo-text"},size:["wide","super-wide"],title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"body-xxs"},backgroundImage:{tag:"div",slot:"bg-image"}},ve=class extends b{constructor(r){super(r)}getGlobalCSS(){return ja}renderLayout(){return vt`<div class="image">
                <slot name="bg-image"></slot>
                <slot name="badge"></slot>
            </div>
            <div class="body">
                <slot name="icons"></slot>
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${this.promoBottom?vt`<slot name="body-xs"></slot
                          ><slot name="promo-text"></slot>`:vt`<slot name="promo-text"></slot
                          ><slot name="body-xs"></slot>`}
            </div>
            ${this.evergreen?vt`
                      <div
                          class="detail-bg-container"
                          style="background: ${this.card.detailBg}"
                      >
                          <slot name="detail-bg"></slot>
                      </div>
                  `:vt`
                      <hr />
                      ${this.secureLabelFooter}
                  `}`}};d(ve,"variantStyle",Yn`
        :host([variant='image']) {
            min-height: 330px;
            width: var(--consonant-merch-card-image-width);
            background:
                linear-gradient(white, white) padding-box,
                var(--consonant-merch-card-border-color, #dadada) border-box;
            border: 1px solid transparent;
        }

        :host([variant='image']) ::slotted([slot='badge']) {
            position: absolute;
            top: 16px;
            right: 0px;
        }

        :host-context([dir='rtl'])
            :host([variant='image'])
            ::slotted([slot='badge']) {
            left: 0px;
            right: initial;
        }
    `);import{html as Wa}from"./lit-all.min.js";var Va=`
:root {
  --consonant-merch-card-inline-heading-width: 300px;
}

.one-merch-card.inline-heading,
.two-merch-cards.inline-heading,
.three-merch-cards.inline-heading,
.four-merch-cards.inline-heading,
.one-merch-card:has(merch-card[variant="inline-heading"]),
.two-merch-cards:has(merch-card[variant="inline-heading"]),
.three-merch-cards:has(merch-card[variant="inline-heading"]),
.four-merch-cards:has(merch-card[variant="inline-heading"]) {
    grid-template-columns: var(--consonant-merch-card-inline-heading-width);
}

/* Sections inside tabs/fragments that don't receive the .inline-heading class.
   Make .content wrapper transparent so the section grid applies directly to cards. */
.one-merch-card:has(merch-card[variant="inline-heading"]) .content,
.two-merch-cards:has(merch-card[variant="inline-heading"]) .content,
.three-merch-cards:has(merch-card[variant="inline-heading"]) .content,
.four-merch-cards:has(merch-card[variant="inline-heading"]) .content {
  display: contents;
}

@media screen and ${x} {
  .two-merch-cards.inline-heading,
  .three-merch-cards.inline-heading,
  .four-merch-cards.inline-heading,
  .two-merch-cards:has(merch-card[variant="inline-heading"]),
  .three-merch-cards:has(merch-card[variant="inline-heading"]),
  .four-merch-cards:has(merch-card[variant="inline-heading"]) {
      grid-template-columns: repeat(2, var(--consonant-merch-card-inline-heading-width));
  }
}

@media screen and ${C} {
  :root {
    --consonant-merch-card-inline-heading-width: 378px;
  }

  .three-merch-cards.inline-heading,
  .four-merch-cards.inline-heading,
  .three-merch-cards:has(merch-card[variant="inline-heading"]),
  .four-merch-cards:has(merch-card[variant="inline-heading"]) {
      grid-template-columns: repeat(3, var(--consonant-merch-card-inline-heading-width));
  }
}

@media screen and ${$} {
  .four-merch-cards.inline-heading,
  .four-merch-cards:has(merch-card[variant="inline-heading"]) {
      grid-template-columns: repeat(4, var(--consonant-merch-card-inline-heading-width));
  }
}
`;var Gt=class extends b{constructor(r){super(r)}getGlobalCSS(){return Va}renderLayout(){return Wa` ${this.badge}
            <div class="body">
                <div class="top-section">
                    <slot name="icons"></slot>
                    <slot name="heading-xs"></slot>
                </div>
                <slot name="body-xs"></slot>
            </div>
            ${this.card.customHr?"":Wa`<hr />`} ${this.secureLabelFooter}`}};import{html as ie,css as Qn,unsafeCSS as Ya}from"./lit-all.min.js";var Ka=`
  :root {
    --consonant-merch-card-mini-compare-chart-icon-size: 32px;
    --consonant-merch-card-mini-compare-border-color: #E9E9E9;
    --consonant-merch-card-mini-compare-mobile-cta-font-size: 16px;
    --consonant-merch-card-mini-compare-mobile-cta-width: 75px;
    --consonant-merch-card-mini-compare-badge-mobile-max-width: 50px;
    --consonant-merch-card-mini-compare-mobile-price-font-size: 32px;
    --consonant-merch-card-card-mini-compare-mobile-background-color: #F8F8F8;
    --consonant-merch-card-card-mini-compare-mobile-spacing-xs: 12px;
    --consonant-merch-card-mini-compare-chart-heading-m-price-height: 30px;
  }

  merch-card[variant="mini-compare-chart"] {
    background: linear-gradient(#FFFFFF, #FFFFFF) padding-box, var(--consonant-merch-card-border-color, #E9E9E9) border-box;
    border: 1px solid transparent;
  }

  merch-card[variant="mini-compare-chart"] merch-badge {
    position: absolute;
    top: 16px;
    inset-inline-start: auto;
    inset-inline-end: 0;
  }
   merch-card[variant="mini-compare-chart"] div[class$='-badge'] {
     font-size: 14px;
   }

  merch-card[variant="mini-compare-chart"] div[class$='-badge']:dir(rtl) {
    left: 0;
    right: initial;
    padding: 8px 11px;
    border-radius: 0 5px 5px 0;
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m"] {
    padding: 0 var(--consonant-merch-spacing-s) 0;
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-xs"] {
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s);
    font-size: var(--consonant-merch-card-heading-m-font-size);
    line-height: var(--consonant-merch-card-heading-m-line-height);
  }

  merch-card[variant="mini-compare-chart"] merch-addon {
    box-sizing: border-box;
  }

  merch-card[variant="mini-compare-chart"] merch-addon {
    padding-inline-start: 4px;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-inline-end: 8px;
    border-radius: 10px;
    font-family: var(--merch-body-font-family, 'Adobe Clean');
    margin: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) .5rem;
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
    background: linear-gradient(211deg, rgb(245, 246, 253) 33.52%, rgb(248, 241, 248) 67.33%, rgb(249, 233, 237) 110.37%);
  }

  merch-card[variant="mini-compare-chart"] merch-addon [is="inline-price"] {
    min-height: unset;
    font-weight: bold;
    pointer-events: none;
  }

  merch-card[variant="mini-compare-chart"] merch-addon::part(checkbox) {
      height: 18px;
      width: 18px;
      margin: 14px 12px 0 8px;
  }

  merch-card[variant="mini-compare-chart"] merch-addon::part(label) {
    display: flex;
    flex-direction: column;
    padding: 8px 4px 8px 0;
    width: 100%;
  }

  merch-card[variant="mini-compare-chart"] [is="inline-price"] {
    display: inline-block;
    min-height: 30px;
    line-height: 30px;
    min-width: 1px;
  }

  merch-card[variant="mini-compare-chart"] merch-badge span,
  merch-card[variant="mini-compare-chart"] merch-badge [is="inline-price"] {
    line-height: 1;
    min-height: auto;
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m-price"]  {
    min-height: 30px;
    line-height: 30px;
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m-price"] [is="inline-price"][data-template="legal"] {
    display: inline;
    min-height: unset;
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m-price"] .price-plan-type {
    display: block;
    font-size: var(--consonant-merch-card-body-xs-font-size);
		font-style: italic;
		font-weight: normal;
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m-price"] .price-plan-type p {
    display: inline;
  }

  merch-card[variant="mini-compare-chart"] [slot="callout-content"] {
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) 0px;
  }

  merch-card[variant="mini-compare-chart"] [slot="callout-content"] .callout-row {
    flex-direction: row;
    align-items: flex-start;
    padding: 2px 10px 3px;
  }

  merch-card[variant="mini-compare-chart"] [slot="callout-content"] .callout-row .icon-button {
    position: relative;
    top: 2px;
    left: auto;
    flex-shrink: 0;
    align-self: flex-start;
    margin-inline-start: var(--consonant-merch-spacing-xxs);
  }

  merch-card[variant="mini-compare-chart"] [slot="quantity-select"] {
    padding: 0 var(--consonant-merch-spacing-s);
  }

  merch-card[variant="mini-compare-chart"] [slot="subtitle"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    padding: 0 var(--consonant-merch-spacing-s);
    font-weight: 500;
  }

  merch-card[variant="mini-compare-chart"] [slot="body-m"] {
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s);
  }

  merch-card[variant="mini-compare-chart"] [slot="callout-content"] [is="inline-price"] {
    min-height: unset;
  }

  merch-card[variant="mini-compare-chart"] [slot="price-commitment"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    padding: 0 var(--consonant-merch-spacing-s);
    font-style: italic;
  }

  merch-card[variant="mini-compare-chart"] [slot="price-commitment"] a {
    display: inline-block;
    height: 27px;
  }

  merch-card[variant="mini-compare-chart"] [slot="offers"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
  }

  merch-card[variant="mini-compare-chart"] [slot="body-xxs"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
  }

  merch-card[variant="mini-compare-chart"] .price-plan-type [slot="body-xxs"] {
    font-style: italic;
    font-weight: normal;
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] {
    font-size: var(--consonant-merch-card-body-m-font-size);
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) 0;
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] p {
    margin: 0;
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] [is="inline-price"] {
    line-height: var(--consonant-merch-card-body-xs-line-height);
    min-height: unset;
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] a {
    color: var(--color-accent);
    text-decoration: underline;
  }

  merch-card[variant="mini-compare-chart"] a.upt-link {
    color: var(--link-color);
  }


  merch-card[variant="mini-compare-chart"] [slot="body-m"] p {
    margin: 0;
  }

  merch-card[variant="mini-compare-chart"] .action-area {
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    flex-wrap: wrap;
    width: 100%;
    gap: var(--consonant-merch-spacing-xxs);
  }

  /* Override merch-whats-included host layout for footer-row display */
  merch-card[variant="mini-compare-chart"] merch-whats-included {
    display: flex;
    flex-direction: column;
    width: 100%;
    row-gap: 0;
  }

  /* Hide heading in footer context */
  merch-card[variant="mini-compare-chart"] merch-whats-included [slot="heading"] {
    display: none;
  }

  /* Icon sizing */
  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="icon"] {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: var(--consonant-merch-card-mini-compare-chart-icon-size);
    width: var(--consonant-merch-card-mini-compare-chart-icon-size);
    height: var(--consonant-merch-card-mini-compare-chart-icon-size);
  }

  merch-card[variant="mini-compare-chart"]
      merch-whats-included:not(
          :has(
              merch-mnemonic-list [slot="icon"] .sp-icon,
              merch-mnemonic-list [slot="icon"] img[src]:not([src=""]),
              merch-mnemonic-list [slot="icon"] merch-icon[src]:not([src=""])
          )
      )
      merch-mnemonic-list:not([data-placeholder])
      [slot="icon"] {
      display: none;
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="icon"] img {
    max-width: initial;
    width: var(--consonant-merch-card-mini-compare-chart-icon-size);
    height: var(--consonant-merch-card-mini-compare-chart-icon-size);
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="icon"] merch-icon {
    --mod-img-width: var(--consonant-merch-card-mini-compare-chart-icon-size);
    --mod-img-height: var(--consonant-merch-card-mini-compare-chart-icon-size);
  }

  merch-card[variant="mini-compare-chart"] .footer-rows-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-color: var(--merch-color-grey-60);
    font-weight: 700;
    line-height: var(--consonant-merch-card-body-xs-line-height);
    font-size: var(--consonant-merch-card-body-s-font-size);
  }

  /* Footer-row-cell layout (legacy footer-rows structure used by DC pages) */
  merch-card[variant="mini-compare-chart"] [slot="footer-rows"] ul {
    margin-block: 0px;
    padding-inline-start: 0px;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell {
    border-top: 1px solid var(--consonant-merch-card-border-color);
    display: flex;
    gap: var(--consonant-merch-spacing-xs);
    justify-content: start;
    place-items: center;
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s);
    margin-block: 0px;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-icon {
    display: flex;
    place-items: center;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-icon img {
    max-width: initial;
    width: var(--consonant-merch-card-mini-compare-chart-icon-size);
    height: var(--consonant-merch-card-mini-compare-chart-icon-size);
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description p {
    color: var(--merch-color-grey-80);
    vertical-align: bottom;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description a {
    color: var(--color-accent);
  }

  /* Style each mnemonic-list as a footer row */
  merch-card[variant="mini-compare-chart"] merch-mnemonic-list {
    width: 100%;
    margin-inline: 0;
    border-top: 1px solid var(
        --consonant-merch-card-whats-included-divider-color,
        var(--consonant-merch-card-mini-compare-border-color)
    );
    display: flex;
    gap: var(--consonant-merch-spacing-xs);
    justify-content: start;
    align-items: center;
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s);
    box-sizing: border-box;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-icon-checkmark img {
    max-width: initial;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-icon-checkmark {
    display: flex;
    align-items: center;
    height: 20px;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-checkmark {
    display: flex;
    gap: var(--consonant-merch-spacing-xs);
    justify-content: start;
    align-items: flex-start;
    margin-block: var(--consonant-merch-spacing-xxxs);
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description-checkmark {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    font-weight: 400;
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="description"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="description"] p {
    color: var(--merch-color-grey-80);
    vertical-align: bottom;
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="description"] a {
    color: var(--color-accent);
  }

  merch-card[variant="mini-compare-chart"] .toggle-icon {
    display: flex;
    background-color: transparent;
    border: none;
    padding: 0;
    margin: 0;
    text-align: inherit;
    font: inherit;
    border-radius: 0;
  }

  merch-card[variant="mini-compare-chart"] .checkmark-copy-container {
    display: none;
  }

  merch-card[variant="mini-compare-chart"] .checkmark-copy-container.open {
    display: block;
    padding-block-start: var(--consonant-merch-card-card-mini-compare-mobile-spacing-xs);
    padding-block-end: 4px;
  }

.one-merch-card.mini-compare-chart {
  grid-template-columns: var(--consonant-merch-card-mini-compare-chart-wide-width);
  gap: var(--consonant-merch-spacing-xs);
}

.two-merch-cards.mini-compare-chart,
.three-merch-cards.mini-compare-chart,
.four-merch-cards.mini-compare-chart {
  grid-template-columns: repeat(2, var(--consonant-merch-card-mini-compare-chart-width));
  gap: var(--consonant-merch-spacing-xs);
}

/* Sections inside tabs/fragments that don't receive the .mini-compare-chart class.
   Make .content wrapper transparent so the section grid applies directly to cards. */
.one-merch-card:has(merch-card[variant="mini-compare-chart"]) .content,
.two-merch-cards:has(merch-card[variant="mini-compare-chart"]) .content,
.three-merch-cards:has(merch-card[variant="mini-compare-chart"]) .content,
.four-merch-cards:has(merch-card[variant="mini-compare-chart"]) .content {
  display: contents;
}

.one-merch-card:has(merch-card[variant="mini-compare-chart"]) {
  grid-template-columns: var(--consonant-merch-card-mini-compare-chart-wide-width);
  gap: var(--consonant-merch-spacing-xs);
}

/* Cap + center the lone card in its wide column at every width */
.one-merch-card.mini-compare-chart merch-card[variant="mini-compare-chart"],
.one-merch-card:has(merch-card[variant="mini-compare-chart"]) merch-card[variant="mini-compare-chart"] {
  max-width: var(--consonant-merch-card-mini-compare-chart-wide-width);
  margin-inline: auto;
}

.two-merch-cards:has(merch-card[variant="mini-compare-chart"]),
.three-merch-cards:has(merch-card[variant="mini-compare-chart"]),
.four-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
  grid-template-columns: repeat(2, var(--consonant-merch-card-mini-compare-chart-width));
  gap: var(--consonant-merch-spacing-xs);
}

/* Place compare-plans text-block below all cards in multi-card layouts */
.two-merch-cards:has(merch-card[variant="mini-compare-chart"]) .text-block,
.three-merch-cards:has(merch-card[variant="mini-compare-chart"]) .text-block,
.four-merch-cards:has(merch-card[variant="mini-compare-chart"]) .text-block {
  grid-column: 1 / -1;
}

/* bullet list */
merch-card[variant="mini-compare-chart"].bullet-list {
  border-radius: var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart"].bullet-list:not(.badge-card):not(.mini-compare-chart-badge) {
  border-color: var(--consonant-merch-card-mini-compare-border-color);
}

merch-card[variant="mini-compare-chart"].badge-card {
  border: var(--consonant-merch-card-border);
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m"] {
  padding: var(--consonant-merch-spacing-xxs) var(--consonant-merch-spacing-xs);
  font-size: var(--consonant-merch-card-heading-xxs-font-size);
  line-height: var(--consonant-merch-card-heading-xxs-line-height);
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"],
merch-card[variant="mini-compare-chart"].bullet-list [slot="price-commitment"] {
  padding: 0 var(--consonant-merch-spacing-xs);
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] .starting-at {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] .price {
  font-size: var(--consonant-merch-card-heading-l-font-size);
  line-height: 35px;
  font-weight: 800;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] .price-alternative:has(+ .price-annual-prefix) {
  margin-bottom: 4px;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] [data-template="strikethrough"] {
  min-height: 24px;
  margin-bottom: 2px;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] [data-template="strikethrough"],
merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] .price-strikethrough {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 700;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="body-xxs"] {
  padding: var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xs) 0;
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
  letter-spacing: normal;
  font-style: italic;
}

merch-card[variant="mini-compare-chart"]:not(.bullet-list) p.card-heading[slot="body-xxs"] {
  padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) 0;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="promo-text"] {
  padding: var(--consonant-merch-card-card-mini-compare-mobile-spacing-xs) var(--consonant-merch-spacing-xs) 0;
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 700;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="promo-text"] a {
  font-weight: 400;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="body-m"] {
  padding: var(--consonant-merch-card-card-mini-compare-mobile-spacing-xs) var(--consonant-merch-spacing-xs) 0;
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="body-m"] p:has(+ p) {
  margin-bottom: 8px;
}

merch-card[variant="mini-compare-chart"] [slot="footer-rows"] a.spectrum-Link.spectrum-Link--secondary,
merch-card[variant="mini-compare-chart"] [slot="body-m"] a.spectrum-Link.spectrum-Link--secondary {
  color: inherit;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="callout-content"] {
  padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-xs) 0px;
  margin: 0;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="callout-content"] > div > div {
  background-color: #D9D9D9;
}

merch-card[variant="mini-compare-chart"].bullet-list merch-addon {
  margin: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart"].bullet-list merch-addon [is="inline-price"] {
  font-weight: 400;
}

merch-card[variant="mini-compare-chart"].bullet-list footer {
  gap: var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart"].bullet-list .action-area {
  justify-content: flex-start;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="footer-rows"] {
  background-color: var(--consonant-merch-card-card-mini-compare-mobile-background-color);
  border-radius: 0 0 var(--consonant-merch-spacing-xxs) var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="price-commitment"] {
  padding: var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xs) 0 var(--consonant-merch-spacing-xs);
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
}

/* mini compare mobile */
@media screen and ${S} {
  :root {
    --consonant-merch-card-mini-compare-chart-width: 302px;
    --consonant-merch-card-mini-compare-chart-wide-width: 302px;
  }

  .two-merch-cards.mini-compare-chart,
  .three-merch-cards.mini-compare-chart,
  .four-merch-cards.mini-compare-chart,
  .two-merch-cards:has(merch-card[variant="mini-compare-chart"]),
  .three-merch-cards:has(merch-card[variant="mini-compare-chart"]),
  .four-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
    grid-template-columns: var(--consonant-merch-card-mini-compare-chart-width);
    gap: var(--consonant-merch-spacing-xs);
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="subtitle"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m-price"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="body-m"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="description"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart"] merch-addon {
    box-sizing: border-box;
  }
}

@media screen and ${O} {
  merch-card[variant="mini-compare-chart"] [slot="heading-m"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="subtitle"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m-price"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="body-m"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="description"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart"].bullet-list merch-mnemonic-list [slot="description"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="footer"] a.con-button {
    min-width: 66px;
    padding: 4px 18px 5px 21px;
    font-size: var(--consonant-merch-card-mini-compare-mobile-cta-font-size);
  }

  merch-card[variant="mini-compare-chart"].bullet-list [slot="footer"] a.con-button {
    padding: 6px 18px 4px;
  }
}
@media screen and ${x} {
  :root {
    --consonant-merch-card-mini-compare-chart-width: 302px;
    --consonant-merch-card-mini-compare-chart-wide-width: 302px;
  }

  .two-merch-cards.mini-compare-chart,
  .two-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
    grid-template-columns: repeat(2, minmax(var(--consonant-merch-card-mini-compare-chart-width), var(--consonant-merch-card-mini-compare-chart-wide-width)));
    gap: var(--consonant-merch-spacing-m);
  }

  .three-merch-cards.mini-compare-chart,
  .four-merch-cards.mini-compare-chart,
  .three-merch-cards:has(merch-card[variant="mini-compare-chart"]),
  .four-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
      grid-template-columns: repeat(2, minmax(var(--consonant-merch-card-mini-compare-chart-width), var(--consonant-merch-card-mini-compare-chart-wide-width)));
  }

   merch-card[variant="mini-compare-chart"].bullet-list [slot="price-commitment"] {
    padding: var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xs) 0 var(--consonant-merch-spacing-xs);
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart"].bullet-list [slot="footer-rows"] {
    padding: var(--consonant-merch-spacing-xs);
  }

  merch-card[variant="mini-compare-chart"].bullet-list .footer-rows-title {
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"].bullet-list .checkmark-copy-container.open {
    padding-block-start: var(--consonant-merch-spacing-xs);
    padding-block-end: 0;
    padding-inline: 0;
  }

  merch-card[variant="mini-compare-chart"].bullet-list .footer-row-cell-checkmark {
    gap: var(--consonant-merch-spacing-xxs);
  }

}

/* desktop */
@media screen and ${C} {
  :root {
    --consonant-merch-card-mini-compare-chart-width: 378px;
    --consonant-merch-card-mini-compare-chart-wide-width: 484px;
  }
  .one-merch-card.mini-compare-chart,
  .one-merch-card:has(merch-card[variant="mini-compare-chart"]) {
    grid-template-columns: var(--consonant-merch-card-mini-compare-chart-wide-width);
  }

  .two-merch-cards.mini-compare-chart,
  .two-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
    grid-template-columns: repeat(2, var(--consonant-merch-card-mini-compare-chart-wide-width));
    gap: var(--consonant-merch-spacing-m);
  }

  .three-merch-cards.mini-compare-chart,
  .four-merch-cards.mini-compare-chart,
  .three-merch-cards:has(merch-card[variant="mini-compare-chart"]),
  .four-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
    grid-template-columns: repeat(3, var(--consonant-merch-card-mini-compare-chart-width));
    gap: var(--consonant-merch-spacing-m);
  }

  /* Cap + center each card in its wide column */
  .two-merch-cards.mini-compare-chart merch-card[variant="mini-compare-chart"],
  .two-merch-cards:has(merch-card[variant="mini-compare-chart"]) merch-card[variant="mini-compare-chart"] {
    max-width: var(--consonant-merch-card-mini-compare-chart-wide-width);
    margin-inline: auto;
  }
}

@media screen and ${$} {
  .four-merch-cards.mini-compare-chart,
  .four-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
      grid-template-columns: repeat(4, var(--consonant-merch-card-mini-compare-chart-width));
  }
}

merch-card[variant="mini-compare-chart"].bullet-list div[slot="footer-rows"]  {
  height: 100%;
}

/* Height sync for legacy footer-row-cell structure (DC pages without mini-compare-chart-mweb variant) */
merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(1) {
  min-height: var(--consonant-merch-card-footer-row-1-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(2) {
  min-height: var(--consonant-merch-card-footer-row-2-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(3) {
  min-height: var(--consonant-merch-card-footer-row-3-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(4) {
  min-height: var(--consonant-merch-card-footer-row-4-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(5) {
  min-height: var(--consonant-merch-card-footer-row-5-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(6) {
  min-height: var(--consonant-merch-card-footer-row-6-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(7) {
  min-height: var(--consonant-merch-card-footer-row-7-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(8) {
  min-height: var(--consonant-merch-card-footer-row-8-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(1) {
  min-height: var(--consonant-merch-card-footer-row-1-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(2) {
  min-height: var(--consonant-merch-card-footer-row-2-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(3) {
  min-height: var(--consonant-merch-card-footer-row-3-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(4) {
  min-height: var(--consonant-merch-card-footer-row-4-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(5) {
  min-height: var(--consonant-merch-card-footer-row-5-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(6) {
  min-height: var(--consonant-merch-card-footer-row-6-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(7) {
  min-height: var(--consonant-merch-card-footer-row-7-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(8) {
  min-height: var(--consonant-merch-card-footer-row-8-min-height);
}
`;var Zn=32,Tr={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m-price"},promoText:{tag:"div",slot:"promo-text"},shortDescription:{tag:"div",slot:"body-xxs"},description:{tag:"div",slot:"body-m"},mnemonics:{size:"l"},quantitySelect:{tag:"div",slot:"quantity-select"},callout:{tag:"div",slot:"callout-content"},addon:!0,secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],whatsIncludedDividerColor:{attribute:"whats-included-divider-color"},allowedWhatsIncludedDividerColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],whatsIncluded:{tag:"div",slot:"footer-rows"},ctas:{slot:"footer",size:"l"},style:"consonant"};function xt(a,r,e,t){a.settings?.displayAnnual&&r?.options[t]?e.dataset[t]="false":r?.options[t]&&(r.dataset[t]="false")}var Ie=class extends b{constructor(e){super(e);d(this,"getRowMinHeightPropertyName",e=>`--consonant-merch-card-footer-row-${e}-min-height`);d(this,"getMiniCompareFooter",()=>{let e=this.card.secureLabel?ie`<slot name="secure-transaction-label">
                  <span class="secure-transaction-label"
                      >${this.card.secureLabel}</span
                  ></slot
              >`:ie`<slot name="secure-transaction-label"></slot>`;return this.isNewVariant?ie`<footer>
                ${e}
                <p class="action-area"><slot name="footer"></slot></p>
            </footer>`:ie`<footer>${e}<slot name="footer"></slot></footer>`});this.updatePriceQuantity=this.updatePriceQuantity.bind(this)}connectedCallbackHook(){if(this.card.addEventListener(D,this.updatePriceQuantity),this.legalAdjusted&&!this.legalObserver){let e=this.card.querySelector('[is="inline-price"][data-template="legal"]');e?(this.legalResolvedHandler=()=>this.adjustShortDescription(),e.addEventListener(I,this.legalResolvedHandler),this.legalElement=e,this.legalObserver=new MutationObserver(()=>this.adjustShortDescription()),this.legalObserver.observe(e,{childList:!0,subtree:!0}),this.adjustShortDescription()):this.legalAdjusted=!1}this.visibilityObserver=new IntersectionObserver(([e])=>{e.boundingClientRect.height!==0&&e.isIntersecting&&(k.isMobile||requestAnimationFrame(()=>{let t=this.getContainer();if(!t)return;t.querySelectorAll('merch-card[variant="mini-compare-chart"]').forEach(n=>n.variantLayout?.syncHeights?.())}),this.visibilityObserver.disconnect())}),this.visibilityObserver.observe(this.card)}disconnectedCallbackHook(){if(this.card.removeEventListener(D,this.updatePriceQuantity),this.visibilityObserver?.disconnect(),this.legalObserver?.disconnect(),this.legalObserver=null,this.legalElement&&this.legalResolvedHandler&&(this.legalElement.removeEventListener(I,this.legalResolvedHandler),this.legalResolvedHandler=null,this.legalElement=null),this.calloutListenersAdded){document.removeEventListener("touchstart",this.handleCalloutTouch),document.removeEventListener("mouseover",this.handleCalloutMouse);let e=this.card.querySelector('[slot="callout-content"] .icon-button');e?.removeEventListener("focusin",this.handleCalloutFocusin),e?.removeEventListener("focusout",this.handleCalloutFocusout),e?.removeEventListener("keydown",this.handleCalloutKeydown),this.calloutListenersAdded=!1}}updatePriceQuantity({detail:e}){!this.mainPrice||!e?.option||(this.mainPrice.dataset.quantity=e.option)}priceOptionsProvider(e,t){let o=Tr.prices.slot;if(e.closest(`[slot="${o}"]`)&&this.isNewVariant){if(e.dataset.template===P){t.displayPlanType=this.card?.settings?.displayPlanType??!1;return}(e.dataset.template==="strikethrough"||e.dataset.template==="price"&&!e.closest?.("merch-card")?.settings?.displayAnnual)&&(t.displayPerUnit=!1)}}getGlobalCSS(){return Ka}adjustMiniCompareBodySlots(){if(this.card.getBoundingClientRect().width<=2)return;this.updateCardElementMinHeight(this.card.shadowRoot.querySelector(".top-section"),"top-section");let e=["heading-m","heading-xs","subtitle","body-m","heading-m-price","body-xxs","price-commitment","quantity-select","offers","promo-text","callout-content","addon"];this.card.classList.contains("bullet-list")&&e.push("footer-rows"),e.forEach(o=>this.updateCardElementMinHeight(this.card.shadowRoot.querySelector(`slot[name="${o}"]`),o)),this.updateCardElementMinHeight(this.card.shadowRoot.querySelector("footer"),"footer"),this.card.shadowRoot.querySelector(".mini-compare-chart-badge")?.textContent!==""&&this.getContainer().style.setProperty("--consonant-merch-card-mini-compare-chart-top-section-mobile-height","32px")}adjustMiniCompareFooterRows(){if(this.card.getBoundingClientRect().width===0)return;let e;if(this.isNewVariant){let t=this.card.querySelector("merch-whats-included");if(!t)return;e=[...t.querySelectorAll('[slot="content"] merch-mnemonic-list')]}else{let t=this.card.querySelector('[slot="footer-rows"] ul');if(!t||!t.children)return;e=[...t.children]}e.length&&e.forEach((t,o)=>{let n=Math.max(Zn,parseFloat(window.getComputedStyle(t).height)||0),i=parseFloat(this.getContainer().style.getPropertyValue(this.getRowMinHeightPropertyName(o+1)))||0;n>i&&this.getContainer().style.setProperty(this.getRowMinHeightPropertyName(o+1),`${n}px`)})}removeEmptyRows(){this.isNewVariant?this.card.querySelectorAll('merch-whats-included [slot="content"] merch-mnemonic-list').forEach(t=>{if(t.hasAttribute("data-placeholder"))return;let o=t.querySelector('[slot="icon"]'),n=!!o?.querySelector(".sp-icon")||!!o?.querySelector('merch-icon[src]:not([src=""]), img[src]:not([src=""])'),c=t.querySelector('[slot="description"]')?.textContent?.replace(/\u00a0/g," ")?.trim()??"";!n&&!c&&t.remove()}):this.card.querySelectorAll(".footer-row-cell").forEach(t=>{if(t.hasAttribute("data-placeholder"))return;let o=t.querySelector(".footer-row-cell-description");o&&!o.textContent.trim()&&t.remove()})}padFooterRows(){let e=this.getContainer();if(!e)return;let t=e.querySelectorAll('merch-card[variant="mini-compare-chart"]');if(this.isNewVariant){let o=0;if(t.forEach(l=>{let m=l.querySelector("merch-whats-included");if(!m)return;let p=m.querySelectorAll('[slot="content"] merch-mnemonic-list:not([data-placeholder])');o=Math.max(o,p.length)}),o===0)return;let n=this.card.querySelector("merch-whats-included");if(!n)return;let i=n.querySelector('[slot="content"]');if(!i)return;i.querySelectorAll("merch-mnemonic-list[data-placeholder]").forEach(l=>l.remove());let c=i.querySelectorAll("merch-mnemonic-list").length,s=o-c;for(let l=0;l<s;l++){let m=document.createElement("merch-mnemonic-list");m.setAttribute("data-placeholder","");let p=document.createElement("div");p.setAttribute("slot","icon");let v=document.createElement("div");v.setAttribute("slot","description"),m.append(p,v),i.appendChild(m)}}else{let o=0;if(t.forEach(s=>{let l=s.querySelector('[slot="footer-rows"] ul');if(!l)return;let m=l.querySelectorAll("li.footer-row-cell:not([data-placeholder])");o=Math.max(o,m.length)}),o===0)return;let n=this.card.querySelector('[slot="footer-rows"] ul');if(!n)return;n.querySelectorAll("li.footer-row-cell[data-placeholder]").forEach(s=>s.remove());let i=n.querySelectorAll("li.footer-row-cell").length,c=o-i;for(let s=0;s<c;s++){let l=document.createElement("li");l.className="footer-row-cell",l.setAttribute("data-placeholder",""),n.appendChild(l)}}}get mainPrice(){return this.card.querySelector(`[slot="heading-m-price"] ${y}[data-template="price"]`)}get headingMPriceSlot(){return this.card.shadowRoot?.querySelector('slot[name="heading-m-price"]')?.assignedElements()[0]}get isNewVariant(){return!!this.card.querySelector("merch-whats-included")}toggleAddon(e){let t=this.mainPrice,o=this.headingMPriceSlot;if(!t&&o){let n=e?.getAttribute("plan-type"),i=null;if(e&&n&&(i=e.querySelector(`p[data-plan-type="${n}"]`)?.querySelector('span[is="inline-price"]')),this.card.querySelectorAll('p[slot="heading-m-price"]').forEach(c=>c.remove()),e.checked){if(i){let c=_("p",{class:"addon-heading-m-price-addon",slot:"heading-m-price"},i.innerHTML);this.card.appendChild(c)}}else{let c=_("p",{class:"card-heading",id:"free",slot:"heading-m-price"},"Free");this.card.appendChild(c)}}}showTooltip(e){e.classList.remove("hide-tooltip"),e.setAttribute("aria-expanded","true")}hideTooltip(e){e.classList.add("hide-tooltip"),e.setAttribute("aria-expanded","false")}adjustCallout(){let e=this.card.querySelector('[slot="callout-content"] .icon-button');if(!e||this.calloutListenersAdded)return;let t=e.title||e.dataset.tooltip;if(!t)return;e.title&&(e.dataset.tooltip=e.title,e.removeAttribute("title"));let o=e.parentElement;if(o&&o.tagName==="P"){let n=document.createElement("div"),i=document.createElement("div");i.className="callout-row";let c=document.createElement("div");for(c.className="callout-text";o.firstChild&&o.firstChild!==e;)c.appendChild(o.firstChild);i.appendChild(c),i.appendChild(e),n.appendChild(i),o.replaceWith(n)}e.setAttribute("role","button"),e.setAttribute("tabindex","0"),e.setAttribute("aria-label",t),e.setAttribute("aria-expanded","false"),this.hideTooltip(e),this.handleCalloutTouch=n=>{n.target!==e?this.hideTooltip(e):e.classList.contains("hide-tooltip")?this.showTooltip(e):this.hideTooltip(e)},this.handleCalloutMouse=n=>{n.target!==e?this.hideTooltip(e):this.showTooltip(e)},this.handleCalloutFocusin=()=>{this.showTooltip(e)},this.handleCalloutFocusout=()=>{this.hideTooltip(e)},this.handleCalloutKeydown=n=>{n.key==="Escape"&&(this.hideTooltip(e),e.blur())},document.addEventListener("touchstart",this.handleCalloutTouch),document.addEventListener("mouseover",this.handleCalloutMouse),e.addEventListener("focusin",this.handleCalloutFocusin),e.addEventListener("focusout",this.handleCalloutFocusout),e.addEventListener("keydown",this.handleCalloutKeydown),this.calloutListenersAdded=!0}async adjustAddon(){await this.card.updateComplete;let e=this.card.addon;if(!e)return;let t=this.mainPrice,o=this.card.planType;if(t&&(await t.onceSettled?.(),o=t.value?.[0]?.planType),!o)return;e.planType=o,this.card.querySelector("merch-addon[plan-type]")?.updateComplete.then(()=>{this.updateCardElementMinHeight(this.card.shadowRoot.querySelector('slot[name="addon"]'),"addon")})}async adjustLegal(){if(this.legalAdjusted||this.legalAdjusting)return;this.legalAdjusting=!0;let e;try{await this.card.updateComplete,await customElements.whenDefined("inline-price");let t=this.mainPrice;if(!t||(await t.onceSettled(),!t?.options))return;e=t.cloneNode(!0),t.options.displayPlanType&&(t.dataset.displayPlanType="false"),xt(this.card,t,e,"displayTax"),xt(this.card,t,e,"displayPerUnit"),e.setAttribute("data-template","legal"),this.legalResolvedHandler||(this.legalResolvedHandler=()=>this.adjustShortDescription(),e.addEventListener(I,this.legalResolvedHandler),this.legalElement=e),t.parentNode.insertBefore(e,t.nextSibling),this.legalAdjusted=!0,await e.onceSettled(),this.legalObserver=new MutationObserver(()=>this.adjustShortDescription()),this.legalObserver.observe(e,{childList:!0,subtree:!0})}catch{e?.parentNode&&(e.parentNode.removeChild(e),this.legalAdjusted=!1,this.legalResolvedHandler=null,this.legalElement=null)}finally{this.legalAdjusting=!1}}getOrCreateFallbackPlanType(){let e=this.headingMPriceSlot;if(!e)return null;let t=e.querySelector(".price-legal[data-fallback]");if(!t){t=document.createElement("span"),t.className="price price-legal",t.dataset.fallback="true";let o=document.createElement("span");o.className="price-plan-type disabled",t.appendChild(o),e.appendChild(t)}return t.querySelector(".price-plan-type")}adjustShortDescription(){let t=this.card.querySelector('[is="inline-price"][data-template="legal"]')?.querySelector(".price-plan-type"),o=this.headingMPriceSlot?.querySelector(".price-legal[data-fallback]"),n=o?.querySelector(".price-plan-type");if(t&&n){let l=n.querySelector("em");l&&!t.querySelector("em")&&t.appendChild(l),o.remove()}let i=this.card.querySelector('[slot="body-xxs"]');if(i){let l=i.textContent?.trim(),m=!!i.querySelector(".icon-button");(l||m)&&(this.shortDescriptionHTML=i.innerHTML,i.remove())}if(!this.shortDescriptionHTML)return;let c=t??this.getOrCreateFallbackPlanType();if(!c||c.querySelector("em"))return;let s=document.createElement("em");s.innerHTML=` ${this.shortDescriptionHTML}`,c.appendChild(s)}renderLayout(){return this.isNewVariant?ie` <div class="top-section${this.badge?" badge":""}">
                <slot name="icons"></slot> ${this.badge}
                <slot name="badge"></slot>
            </div>
            <slot name="heading-m"></slot>
            <slot name="heading-xs"></slot>
            <slot name="body-m"></slot>
            <slot name="subtitle"></slot>
            <slot name="heading-m-price"></slot>
            <slot name="body-xxs"></slot>
            <slot name="price-commitment"></slot>
            <slot name="offers"></slot>
            <slot name="quantity-select"></slot>
            <slot name="promo-text"></slot>
            <slot name="callout-content"></slot>
            <slot name="addon"></slot>
            ${this.getMiniCompareFooter()}
            <slot name="footer-rows"><slot name="body-s"></slot></slot>`:ie` <div class="top-section${this.badge?" badge":""}">
                    <slot name="icons"></slot> ${this.badge}
                </div>
                <slot name="heading-m"></slot>
                ${this.card.classList.contains("bullet-list")?ie`<slot name="heading-m-price"></slot>
                          <slot name="price-commitment"></slot>
                          <slot name="body-xxs"></slot>
                          <slot name="promo-text"></slot>
                          <slot name="body-m"></slot>
                          <slot name="offers"></slot>`:ie`<slot name="body-m"></slot>
                          <slot name="heading-m-price"></slot>
                          <slot name="body-xxs"></slot>
                          <slot name="price-commitment"></slot>
                          <slot name="offers"></slot>
                          <slot name="promo-text"></slot> `}
                <slot name="callout-content"></slot>
                <slot name="addon"></slot>
                ${this.getMiniCompareFooter()}
                <slot name="footer-rows"><slot name="body-s"></slot></slot>`}syncHeights(){this.card.getBoundingClientRect().width<=2||(this.adjustMiniCompareBodySlots(),this.adjustMiniCompareFooterRows())}async postCardUpdateHook(){if(await super.postCardUpdateHook(),this.isNewVariant&&(this.legalAdjusted||await this.adjustLegal(),this.adjustShortDescription(),this.adjustCallout()),await this.adjustAddon(),this.isNewVariant&&this.removeEmptyRows(),k.isMobile)this.isNewVariant||this.removeEmptyRows();else{this.padFooterRows();let e=this.getContainer();if(!e)return;let t=e.style.getPropertyValue("--consonant-merch-card-footer-row-1-min-height");requestAnimationFrame(t?()=>{this.syncHeights()}:()=>{e.querySelectorAll('merch-card[variant="mini-compare-chart"]').forEach(n=>n.variantLayout?.syncHeights?.())})}}};d(Ie,"variantStyle",Qn`
        :host([variant='mini-compare-chart']) {
            max-width: var(
                --consonant-merch-card-mini-compare-chart-wide-width,
                484px
            );
        }

        :host([variant='mini-compare-chart']) > slot:not([name='icons']) {
            display: block;
        }

        :host([variant='mini-compare-chart'].bullet-list)
            > slot[name='heading-m-price'] {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
        }

        :host([variant='mini-compare-chart']) .mini-compare-chart-badge {
            font-size: 14px;
        }

        :host([variant='mini-compare-chart'].bullet-list)
            .mini-compare-chart-badge {
            padding: 2px 10px 3px 10px;
            font-size: var(--consonant-merch-card-body-xs-font-size);
            line-height: var(--consonant-merch-card-body-xs-line-height);
            border-radius: 7.11px 0 0 7.11px;
            font-weight: 700;
        }

        :host([variant='mini-compare-chart']) footer {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-footer-height
            );
            padding: var(--consonant-merch-spacing-s);
        }

        :host([variant='mini-compare-chart']) footer:has(.action-area) {
            align-items: start;
            flex-flow: column nowrap;
        }

        :host([variant='mini-compare-chart'])
            footer:has(.action-area)
            .secure-transaction-label {
            align-self: flex-end;
        }

        :host([variant='mini-compare-chart'].bullet-list) footer {
            flex-flow: column nowrap;
            min-height: var(
                --consonant-merch-card-mini-compare-chart-footer-height
            );
            padding: var(--consonant-merch-spacing-xs);
        }

        :host([variant='mini-compare-chart']) .action-area {
            display: flex;
            justify-content: end;
            align-items: flex-end;
            flex-wrap: wrap;
            width: 100%;
            gap: var(--consonant-merch-spacing-xxs);
            margin: unset;
        }

        /* mini-compare card  */
        :host([variant='mini-compare-chart']) .top-section {
            padding-top: var(--consonant-merch-spacing-s);
            padding-inline-start: var(--consonant-merch-spacing-s);
            height: var(
                --consonant-merch-card-mini-compare-chart-top-section-height
            );
        }

        :host([variant='mini-compare-chart'].bullet-list) .top-section {
            padding-top: var(--consonant-merch-spacing-xs);
            padding-inline-start: var(--consonant-merch-spacing-xs);
        }

        :host([variant='mini-compare-chart'].bullet-list)
            .secure-transaction-label {
            align-self: flex-start;
            flex: none;
            font-size: var(--consonant-merch-card-body-xxs-font-size);
            font-weight: 400;
            color: #505050;
        }

        @media screen and ${Ya(O)} {
            [class*'-merch-cards']
                :host([variant='mini-compare-chart'])
                footer {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
        }

        @media screen and ${Ya(C)} {
            :host([variant='mini-compare-chart']) footer {
                padding: var(--consonant-merch-spacing-xs)
                    var(--consonant-merch-spacing-s)
                    var(--consonant-merch-spacing-s)
                    var(--consonant-merch-spacing-s);
            }
        }

        :host([variant='mini-compare-chart']) slot[name='footer-rows'] {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: end;
        }
        /* mini-compare card heights for the slots: heading-m, body-m, heading-m-price, price-commitment, offers, promo-text, footer */
        :host([variant='mini-compare-chart']) slot[name='heading-m'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-heading-m-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='heading-xs'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-heading-xs-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='subtitle'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-subtitle-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='body-m'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-body-m-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='heading-m-price'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-heading-m-price-height
            );
            line-height: 30px;
        }
        :host([variant='mini-compare-chart']) slot[name='body-xxs'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-body-xxs-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='price-commitment'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-price-commitment-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='offers'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-offers-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='promo-text'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-promo-text-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='callout-content'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-callout-content-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='quantity-select'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-quantity-select-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='addon'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-addon-height
            );
        }
        :host([variant='mini-compare-chart']:not(.bullet-list))
            slot[name='footer-rows'] {
            justify-content: flex-start;
        }

        /* Border color styles */
        :host(
            [variant='mini-compare-chart'][border-color='spectrum-yellow-300-plans']
        ) {
            --consonant-merch-card-border-color: #ffd947;
        }

        :host(
            [variant='mini-compare-chart'][border-color='spectrum-gray-300-plans']
        ) {
            --consonant-merch-card-border-color: #dadada;
        }

        :host(
            [variant='mini-compare-chart'][border-color='spectrum-green-900-plans']
        ) {
            --consonant-merch-card-border-color: #05834e;
        }

        :host(
            [variant='mini-compare-chart'][border-color='spectrum-red-700-plans']
        ) {
            --consonant-merch-card-border-color: #eb1000;
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
        }

        :host(
            [variant='mini-compare-chart'][border-color='gradient-purple-blue']
        ) {
            --consonant-merch-card-border-color: linear-gradient(
                135deg,
                #9256dc,
                #1473e6
            );
        }

        :host(
            [variant='mini-compare-chart'][whats-included-divider-color='spectrum-yellow-300-plans']
        ) {
            --consonant-merch-card-whats-included-divider-color: #ffd947;
        }

        :host(
            [variant='mini-compare-chart'][whats-included-divider-color='spectrum-gray-300-plans']
        ) {
            --consonant-merch-card-whats-included-divider-color: #dadada;
        }

        :host(
            [variant='mini-compare-chart'][whats-included-divider-color='spectrum-green-900-plans']
        ) {
            --consonant-merch-card-whats-included-divider-color: #05834e;
        }

        :host(
            [variant='mini-compare-chart'][whats-included-divider-color='spectrum-red-700-plans']
        ) {
            --consonant-merch-card-whats-included-divider-color: #eb1000;
        }

        :host(
            [variant='mini-compare-chart'][whats-included-divider-color='gradient-purple-blue']
        ) {
            --consonant-merch-card-whats-included-divider-color: linear-gradient(
                135deg,
                #9256dc,
                #1473e6
            );
        }

        /* Badge color styles */
        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-red-700-plans) {
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-yellow-300-plans),
        :host([variant='mini-compare-chart']) #badge.spectrum-yellow-300-plans {
            background-color: #ffd947;
            color: #2c2c2c;
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-gray-300-plans),
        :host([variant='mini-compare-chart']) #badge.spectrum-gray-300-plans {
            background-color: #dadada;
            color: #2c2c2c;
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-gray-700-plans),
        :host([variant='mini-compare-chart']) #badge.spectrum-gray-700-plans {
            background-color: #4b4b4b;
            color: #ffffff;
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-green-900-plans),
        :host([variant='mini-compare-chart']) #badge.spectrum-green-900-plans {
            background-color: #05834e;
            color: #ffffff;
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-red-700-plans),
        :host([variant='mini-compare-chart']) #badge.spectrum-red-700-plans {
            background-color: #eb1000;
            color: #ffffff;
        }
    `);import{html as Vt,css as Xn,unsafeCSS as Lr,nothing as Jn}from"./lit-all.min.js";var Qa=`
  :root {
    --list-checked-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' width='20' height='20'%3E%3Cpath fill='%23222222' d='M15.656,3.8625l-.7275-.5665a.5.5,0,0,0-.7.0875L7.411,12.1415,4.0875,8.8355a.5.5,0,0,0-.707,0L2.718,9.5a.5.5,0,0,0,0,.707l4.463,4.45a.5.5,0,0,0,.75-.0465L15.7435,4.564A.5.5,0,0,0,15.656,3.8625Z'%3E%3C/path%3E%3C/svg%3E");
    --merch-card-collection-card-width: var(--consonant-merch-card-mini-compare-chart-mweb-width);
  }

  merch-card[variant="mini-compare-chart-mweb"] {
    background: linear-gradient(#FFFFFF, #FFFFFF) padding-box, var(--consonant-merch-card-border-color, #E9E9E9) border-box;
    border: 1px solid transparent;
    max-width: var(--consonant-merch-card-mini-compare-chart-mweb-width);
    width: 100%;
    box-sizing: border-box;
    position: relative;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m"] {
    padding: 0 var(--consonant-merch-spacing-s) 0;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="badge"] {
    position: absolute;
    top: 16px;
    inset-inline-end: 0;
    line-height: 16px;
  }

  merch-card[variant="mini-compare-chart-mweb"] div[class$='-badge']:dir(rtl) {
    left: 0;
    right: initial;
    padding: 8px 11px;
    border-radius: 0 5px 5px 0;
  }

  merch-card[variant="mini-compare-chart-mweb"] merch-badge {
    max-width: calc(var(--consonant-merch-card-plans-width) * var(--merch-badge-card-size) - var(--merch-badge-with-offset) * 40px - var(--merch-badge-offset) * 48px);
  }

  merch-card[variant="mini-compare-chart-mweb"] merch-addon {
    box-sizing: border-box;
  }

  merch-card[variant="mini-compare-chart-mweb"] merch-addon {
    padding-top: 8px;
    padding-bottom: 8px;
    padding-inline-end: 8px;
    border-radius: .5rem;
    font-family: var(--merch-body-font-family, 'Adobe Clean');
    margin: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) .5rem;
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] merch-addon [is="inline-price"] {
    min-height: unset;
    font-weight: bold;
    pointer-events: none;
  }

  merch-card[variant="mini-compare-chart-mweb"] merch-addon::part(checkbox) {
      height: 18px;
      width: 18px;
      margin: 14px 12px 0 8px;
  }

  merch-card[variant="mini-compare-chart-mweb"] merch-addon::part(label) {
    display: flex;
    flex-direction: column;
    padding: 8px 4px 8px 0;
    width: 100%;
  }

  merch-card[variant="mini-compare-chart-mweb"] [is="inline-price"] {
    display: inline;
  }

  merch-card[variant="mini-compare-chart-mweb"] merch-badge span,
  merch-card[variant="mini-compare-chart-mweb"] merch-badge [is="inline-price"] {
    line-height: 1;
    min-height: auto;
  }

  merch-card[variant="mini-compare-chart-mweb"] .price-unit-type.disabled,
  merch-card[variant="mini-compare-chart-mweb"] .price-tax-inclusivity.disabled {
    display: none;
  }

	merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] {
		padding: unset;
	}

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] .price-unit-type.disabled,
  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] .price-tax-inclusivity.disabled {
    display: none;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] span.price.price-strikethrough,
  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] s {
    font-size: 20px;
    color: #6B6B6B;
    text-decoration: line-through;
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"]:has(span[is='inline-price'] + span[is='inline-price']) span[is='inline-price'] {
    display: inline;
    text-decoration: none;
  }

  merch-card[variant="mini-compare-chart-mweb"] [is="inline-price"][data-template="legal"] {
    display: block;
    min-height: unset;
    padding: 0;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] .price-recurrence {
    line-height: 1.4;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] .price-plan-type,
  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] span[data-template="planType"] {
    text-transform: unset;
    display: block;
    color: var(--spectrum-gray-700, #505050);
    font-size: 16px;
    font-weight: 400;
    line-height: 1.4;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="callout-content"] {
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) 0px;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="body-m"] {
    padding: 12px 0;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="body-xs"] {
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="callout-content"] [is="inline-price"] {
    min-height: unset;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="price-commitment"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    padding: 0 var(--consonant-merch-spacing-s);
    font-style: italic;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="price-commitment"] a {
    display: inline-block;
    height: 27px;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="offers"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="body-xxs"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) 0;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="subtitle"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    margin-block-end: calc(-1 * var(--consonant-merch-spacing-xxs));
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="promo-text"] {
    font-size: var(--consonant-merch-card-body-m-font-size);
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) 0;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="promo-text"] a {
    color: var(--color-accent);
    text-decoration: underline;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="body-m"] a {
    color: var(--color-accent);
    text-decoration: underline;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="body-m"] a.spectrum-Link.spectrum-Link--secondary {
    color: inherit;
  }

  merch-card[variant="mini-compare-chart-mweb"] ul {
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--consonant-merch-spacing-xxs);
  }

  merch-card[variant="mini-compare-chart-mweb"] ul li {
    font-family: 'Adobe Clean', sans-serif;
    color: #292929;
    line-height: 140%;
    display: inline-flex;
    list-style: none;
    padding: 0;
    margin-bottom: 8px;
    width: 100%;
  }

  merch-card[variant="mini-compare-chart-mweb"] ul li::before {
    display: inline-block;
    content: var(--list-checked-icon);
    margin-right: var(--consonant-merch-spacing-xxs);
    vertical-align: middle;
    flex-shrink: 0;
    height: 24px;
  }

  merch-card[variant="mini-compare-chart-mweb"] .action-area {
    display: flex;
    justify-content: flex-start;
    align-items: flex-end;
    flex-wrap: wrap;
    width: 100%;
    gap: var(--consonant-merch-spacing-xxs);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="footer-rows"] ul {
    margin-block-start: 0px;
    margin-block-end: 0px;
    padding-inline-start: 0px;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-icon {
    display: flex;
    place-items: center;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-icon img {
    max-width: initial;
    width: 32px;
    height: 32px;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-rows-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 700;
    line-height: var(--consonant-merch-card-body-xs-line-height);
    font-size: var(--consonant-merch-card-body-s-font-size);
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-cell {
    border-top: 1px solid var(--consonant-merch-card-border-color);
    display: flex;
    gap: var(--consonant-merch-spacing-xs);
    justify-content: start;
    place-items: center;
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s);
    margin-block: 0px;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-icon-checkmark img {
    max-width: initial;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-icon-checkmark {
    display: flex;
    align-items: center;
    height: 20px;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-cell-checkmark {
    display: flex;
    gap: var(--consonant-merch-spacing-xs);
    justify-content: start;
    align-items: flex-start;
    margin-block: var(--consonant-merch-spacing-xxxs);
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-cell-description-checkmark {
    font-size: var(--consonant-merch-card-body-s-font-size);
    font-weight: 400;
    line-height: var(--consonant-merch-card-body-s-line-height);
    color: #2C2C2C;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-cell-description {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    font-weight: 400;
    color: #2C2C2C;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-cell-description p {
    color: var(--merch-color-grey-80);
    vertical-align: bottom;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-cell-description a {
    color: var(--color-accent);
  }

  merch-card[variant="mini-compare-chart-mweb"] .toggle-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    background-color: transparent;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    background-image: url('data:image/svg+xml,<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="12" fill="%23F8F8F8"/><path d="M14 26C7.38258 26 2 20.6174 2 14C2 7.38258 7.38258 2 14 2C20.6174 2 26 7.38258 26 14C26 20.6174 20.6174 26 14 26ZM14 4.05714C8.51696 4.05714 4.05714 8.51696 4.05714 14C4.05714 19.483 8.51696 23.9429 14 23.9429C19.483 23.9429 23.9429 19.483 23.9429 14C23.9429 8.51696 19.483 4.05714 14 4.05714Z" fill="%23292929"/><path d="M18.5484 12.9484H15.0484V9.44844C15.0484 8.86875 14.5781 8.39844 13.9984 8.39844C13.4188 8.39844 12.9484 8.86875 12.9484 9.44844V12.9484H9.44844C8.86875 12.9484 8.39844 13.4188 8.39844 13.9984C8.39844 14.5781 8.86875 15.0484 9.44844 15.0484H12.9484V18.5484C12.9484 19.1281 13.4188 19.5984 13.9984 19.5984C14.5781 19.5984 15.0484 19.1281 15.0484 18.5484V15.0484H18.5484C19.1281 15.0484 19.5984 14.5781 19.5984 13.9984C19.5984 13.4188 19.1281 12.9484 18.5484 12.9484Z" fill="%23292929"/></svg>');
    background-size: 28px 28px;
    background-position: center;
    background-repeat: no-repeat;
    transition: background-image 0.3s ease;
  }

  merch-card[variant="mini-compare-chart-mweb"] .toggle-icon.expanded {
    background-image: url('data:image/svg+xml,<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="12" fill="%23292929"/><path d="M14 26C7.38258 26 2 20.6174 2 14C2 7.38258 7.38258 2 14 2C20.6174 2 26 7.38258 26 14C26 20.6174 20.6174 26 14 26ZM14 4.05714C8.51696 4.05714 4.05714 8.51696 4.05714 14C4.05714 19.483 8.51696 23.9429 14 23.9429C19.483 23.9429 23.9429 19.483 23.9429 14C23.9429 8.51696 19.483 4.05714 14 4.05714Z" fill="%23292929"/><path d="M9 14L19 14" stroke="%23F8F8F8" stroke-width="2" stroke-linecap="round"/></svg>');
  }

  merch-card[variant="mini-compare-chart-mweb"] .checkmark-copy-container {
    display: none;
  }

  merch-card[variant="mini-compare-chart-mweb"] .checkmark-copy-container.open {
    display: block;
    margin-top: 16px;
  }

.collection-container.mini-compare-chart-mweb {
  --merch-card-collection-card-width: var(--consonant-merch-card-mini-compare-chart-mweb-width);
}

.one-merch-card.mini-compare-chart-mweb {
  --merch-card-collection-card-width: var(--consonant-merch-card-mini-compare-chart-mweb-width);
  grid-template-columns: var(--consonant-merch-card-mini-compare-chart-mweb-wide-width);
  gap: var(--consonant-merch-spacing-xs);
}

.two-merch-cards.mini-compare-chart-mweb,
.three-merch-cards.mini-compare-chart-mweb,
.four-merch-cards.mini-compare-chart-mweb {
  --merch-card-collection-card-width: var(--consonant-merch-card-mini-compare-chart-mweb-width);
  grid-template-columns: repeat(2, var(--consonant-merch-card-mini-compare-chart-mweb-width));
  gap: var(--consonant-merch-spacing-xs);
}

/* Sections inside tabs/fragments that don't receive the .mini-compare-chart-mweb class.
   Make .content wrapper transparent so the section grid applies directly to cards. */
.one-merch-card:has(merch-card[variant="mini-compare-chart-mweb"]) .content,
.two-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) .content,
.three-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) .content,
.four-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) .content {
  display: contents;
}

.one-merch-card:has(merch-card[variant="mini-compare-chart-mweb"]) {
  grid-template-columns: var(--consonant-merch-card-mini-compare-chart-mweb-wide-width);
  gap: var(--consonant-merch-spacing-xs);
}

/* Cap + center the lone card in its wide column at every width */
.one-merch-card.mini-compare-chart-mweb merch-card[variant="mini-compare-chart-mweb"],
.one-merch-card:has(merch-card[variant="mini-compare-chart-mweb"]) merch-card[variant="mini-compare-chart-mweb"] {
  max-width: var(--consonant-merch-card-mini-compare-chart-mweb-wide-width);
  margin-inline: auto;
}

.two-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]),
.three-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]),
.four-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) {
  grid-template-columns: repeat(2, var(--consonant-merch-card-mini-compare-chart-mweb-width));
  gap: var(--consonant-merch-spacing-xs);
}

/* Place compare-plans text-block below all cards in multi-card layouts */
.two-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) .text-block,
.three-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) .text-block,
.four-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) .text-block {
  grid-column: 1 / -1;
}

/* bullet list */
merch-card[variant="mini-compare-chart-mweb"] {
  border-radius: var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m"] {
  padding: var(--consonant-merch-spacing-xxs) var(--consonant-merch-spacing-xs);
  font-size: var(--consonant-merch-card-body-m-font-size);
  line-height: 1.4;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] .starting-at {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] .price {
  font-size: var(--consonant-merch-card-heading-l-font-size);
  line-height: 35px;
  font-weight: 800;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] .price-alternative:has(+ .price-annual-prefix) {
  margin-bottom: 4px;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] [data-template="strikethrough"] {
  min-height: 24px;
  margin-bottom: 2px;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] [data-template="strikethrough"],
merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] .price-strikethrough {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 700;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="body-xxs"] {
  padding: var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xs) 0;
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
  letter-spacing: normal;
  font-style: italic;
}

merch-card[variant="mini-compare-chart-mweb"].bullet-list p.card-heading[slot="body-xxs"] {
  padding: var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xs) 0;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="quantity-select"] {
  padding: 0;
  max-width: 100%;
  box-sizing: border-box;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="promo-text"] {
  padding: 0;
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 700;
  margin: 4px 0;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="promo-text"] a {
  font-weight: 400;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="heading-xs"] {
	font-size: var(--consonant-merch-card-heading-xxs-font-size);
	line-height: var(--consonant-merch-card-heading-xxs-line-height);
}

merch-card[variant="mini-compare-chart-mweb"] [slot="body-m"] {
  padding: 0;
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="body-xs"] {
  padding: 12px var(--consonant-merch-spacing-xs);
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
}

merch-card[variant="mini-compare-chart-mweb"] [slot="body-m"] p:has(+ p) {
  margin-bottom: 8px;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="callout-content"] {
  padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-xs) 0px;
  margin: 0;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="callout-content"] > div > div {
  background-color: #D9D9D9;
}

merch-card[variant="mini-compare-chart-mweb"] merch-addon {
  margin: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart-mweb"] merch-addon [is="inline-price"] {
  font-weight: 400;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="secure-transaction-label"] {
	display: flex;
}

merch-card[variant="mini-compare-chart-mweb"] .footer-rows-container {
  background-color: #F8F8F8;
  border-radius: 0 0 var(--consonant-merch-spacing-xxs) var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart-mweb"] .price-plan-type{

    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    font-weight: 400;
		font-style: italic;
}

/* mini compare mobile */
@media screen and ${S} {
  :root {
    --consonant-merch-card-mini-compare-chart-mweb-width: 302px;
    --consonant-merch-card-mini-compare-chart-mweb-wide-width: 302px;
  }

  .two-merch-cards.mini-compare-chart-mweb,
  .three-merch-cards.mini-compare-chart-mweb,
  .four-merch-cards.mini-compare-chart-mweb,
  .two-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]),
  .three-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]),
  .four-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) {
    grid-template-columns: var(--consonant-merch-card-mini-compare-chart-mweb-width);
    gap: var(--consonant-merch-spacing-xs);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] {
    font-size: var(--consonant-merch-card-heading-l-font-size);
    line-height: var(--consonant-merch-card-heading-l-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="body-m"] {
    font-size: var(--consonant-merch-card-body-m-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-xs"] {
    font-size: var(--consonant-merch-card-body-xxs-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="body-xs"] {
		font-size: var(--consonant-merch-card-body-s-font-size);
		line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="promo-text"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-cell-description {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] merch-addon {
    box-sizing: border-box;
  }
}

@media screen and ${O} {
  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-xs"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="body-xs"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="body-m"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="promo-text"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-cell-description {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }
}
@media screen and ${x} {
  :root {
    --consonant-merch-card-mini-compare-chart-mweb-width: 302px;
    --consonant-merch-card-mini-compare-chart-mweb-wide-width: 302px;
  }

  .two-merch-cards.mini-compare-chart-mweb,
  .two-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) {
    grid-template-columns: repeat(2, minmax(var(--consonant-merch-card-mini-compare-chart-mweb-width), var(--consonant-merch-card-mini-compare-chart-mweb-wide-width)));
    gap: var(--consonant-merch-spacing-m);
  }

  .three-merch-cards.mini-compare-chart-mweb,
  .four-merch-cards.mini-compare-chart-mweb,
  .three-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]),
  .four-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) {
    grid-template-columns: repeat(2, minmax(var(--consonant-merch-card-mini-compare-chart-mweb-width), var(--consonant-merch-card-mini-compare-chart-mweb-wide-width)));
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="footer-rows"] {
    padding: var(--consonant-merch-spacing-xs);
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-rows-title {
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] .checkmark-copy-container {
    display: block;
    margin-top: 16px;
  }

  merch-card[variant="mini-compare-chart-mweb"] .toggle-icon {
    display: none;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-cell-checkmark {
    gap: var(--consonant-merch-spacing-xxs);
  }

}

/* desktop */
@media screen and ${C} {
  :root {
    --consonant-merch-card-mini-compare-chart-mweb-width: 378px;
    --consonant-merch-card-mini-compare-chart-mweb-wide-width: 484px;
  }
  .one-merch-card.mini-compare-chart-mweb,
  .one-merch-card:has(merch-card[variant="mini-compare-chart-mweb"]) {
    grid-template-columns: var(--consonant-merch-card-mini-compare-chart-mweb-wide-width);
  }

  .two-merch-cards.mini-compare-chart-mweb,
  .two-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) {
    grid-template-columns: repeat(2, var(--consonant-merch-card-mini-compare-chart-mweb-wide-width));
    gap: var(--consonant-merch-spacing-m);
  }

  .three-merch-cards.mini-compare-chart-mweb,
  .four-merch-cards.mini-compare-chart-mweb,
  .three-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]),
  .four-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) {
    grid-template-columns: repeat(3, var(--consonant-merch-card-mini-compare-chart-mweb-width));
    gap: var(--consonant-merch-spacing-m);
  }

  /* Cap + center each card in its wide column */
  .two-merch-cards.mini-compare-chart-mweb merch-card[variant="mini-compare-chart-mweb"],
  .two-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) merch-card[variant="mini-compare-chart-mweb"] {
    max-width: var(--consonant-merch-card-mini-compare-chart-mweb-wide-width);
    margin-inline: auto;
  }
}

@media screen and ${$} {
  .four-merch-cards.mini-compare-chart-mweb,
  .four-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) {
    grid-template-columns: repeat(4, var(--consonant-merch-card-mini-compare-chart-mweb-width));
  }
}

merch-card[variant="mini-compare-chart-mweb"] div[slot="footer-rows"]  {
  height: 100%;
  min-height: var(--consonant-merch-card-mini-compare-chart-mweb-footer-rows-height);
}

merch-card .footer-row-cell:nth-child(1) {
  min-height: var(--consonant-merch-card-footer-row-1-min-height);
}

merch-card .footer-row-cell:nth-child(2) {
  min-height: var(--consonant-merch-card-footer-row-2-min-height);
}

merch-card .footer-row-cell:nth-child(3) {
  min-height: var(--consonant-merch-card-footer-row-3-min-height);
}

merch-card .footer-row-cell:nth-child(4) {
  min-height: var(--consonant-merch-card-footer-row-4-min-height);
}

merch-card .footer-row-cell:nth-child(5) {
  min-height: var(--consonant-merch-card-footer-row-5-min-height);
}

merch-card .footer-row-cell:nth-child(6) {
  min-height: var(--consonant-merch-card-footer-row-6-min-height);
}

merch-card .footer-row-cell:nth-child(7) {
  min-height: var(--consonant-merch-card-footer-row-7-min-height);
}

merch-card .footer-row-cell:nth-child(8) {
  min-height: var(--consonant-merch-card-footer-row-8-min-height);
}
`;var ei=32,ti=0,ri=()=>`mweb-list-${ti+=1}`,ai=["heading-xs","subtitle","heading-m-price","quantity-select","promo-text","body-m","body-xs"],oi=8,_r={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m-price"},promoText:{tag:"div",slot:"promo-text"},quantitySelect:{tag:"div",slot:"quantity-select"},shortDescription:{tag:"div",slot:"body-m"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],ctas:{slot:"footer",size:"l"},style:"consonant"},G,xe,Be,He,qe,ce,zr,Pr,Fe=class extends b{constructor(e){super(e);f(this,ce);f(this,G);f(this,xe);f(this,Be);f(this,He,0);f(this,qe);d(this,"getRowMinHeightPropertyName",e=>`--consonant-merch-card-footer-row-${e}-min-height`);d(this,"getMiniCompareFooter",()=>Vt` <footer>
            <slot name="secure-transaction-label">
                <span class="secure-transaction-label-text"
                    >${this.secureLabel}</span
                >
            </slot>
            <p class="action-area">
                <slot name="footer"></slot>
            </p>
        </footer>`);d(this,"getMiniCompareFooterRows",()=>Vt` <div class="footer-rows-container">
            <slot name="body-xs"></slot>
            <slot name="footer-rows"></slot>
        </div>`);this.updatePriceQuantity=this.updatePriceQuantity.bind(this)}connectedCallbackHook(){this.card.addEventListener(D,this.updatePriceQuantity),g(this,He,this.card.getBoundingClientRect().width),g(this,xe,new ResizeObserver(()=>{let e=this.card.getBoundingClientRect().width;e!==h(this,He)&&(g(this,He,e),clearTimeout(h(this,Be)),g(this,Be,setTimeout(()=>this.reconcileBreakpoint(),150)))})),h(this,xe).observe(this.card)}disconnectedCallbackHook(){this.card.removeEventListener(D,this.updatePriceQuantity),clearTimeout(h(this,Be)),h(this,xe)?.disconnect(),g(this,xe,null),h(this,G)?.disconnect(),g(this,G,null)}reconcileBreakpoint(){k.isMobile?(this.resetSyncedHeights(),this.removeEmptyRows()):E(this,ce,Pr).call(this)}updatePriceQuantity({detail:e}){!this.mainPrice||!e?.option||(this.mainPrice.dataset.quantity=e.option)}syncHeights(){if(k.isMobile)return;if(this.card.getBoundingClientRect().width<=2){h(this,G)||(g(this,G,new ResizeObserver(()=>{this.card.getBoundingClientRect().width>2&&(h(this,G)?.disconnect(),g(this,G,null),this.syncHeights())})),h(this,G).observe(this.card));return}let e=["heading-xs","subtitle","heading-m-price","quantity-select","promo-text","body-m","body-xs"];this.syncRowHeights(e.map(t=>({name:t,getElement:o=>o.querySelector(`[slot="${t}"]`)}))),this.adjustMiniCompareFooterRows()}priceOptionsProvider(e,t){let o=_r.prices.slot;if(e.closest(`[slot="${o}"]`)){if(e.dataset.template===P){t.displayPlanType=this.card?.settings?.displayPlanType??!1;return}(e.dataset.template==="strikethrough"||e.dataset.template==="price"&&!e.closest?.("merch-card")?.settings?.displayAnnual)&&(t.displayPerUnit=!1)}}getGlobalCSS(){return Qa}adjustMiniCompareFooterRows(){if(this.card.getBoundingClientRect().width===0)return;let e=this.card.querySelector('[slot="footer-rows"] ul');!e||!e.children||[...e.children].forEach((t,o)=>{let n=Math.max(ei,parseFloat(window.getComputedStyle(t).height)||0),i=parseFloat(this.getContainer().style.getPropertyValue(this.getRowMinHeightPropertyName(o+1)))||0;n>i&&this.getContainer().style.setProperty(this.getRowMinHeightPropertyName(o+1),`${n}px`)})}removeEmptyRows(){this.card.querySelectorAll(".footer-row-cell").forEach(t=>{let o=t.querySelector(".footer-row-cell-description");o&&!o.textContent.trim()&&t.remove()})}setupToggle(){let e=this.card.querySelector('[slot="body-xs"]'),t=e?.querySelector("p"),o=e?.querySelector("ul");if(!t||!o||e.querySelector(".footer-rows-title"))return;let n=t.textContent.trim(),i=this.card.querySelector("h3")?.id,c=i?`${i}-list`:ri();o.id=c,o.classList.add("checkmark-copy-container");let s=_("h4",{class:"footer-rows-title"},n),l=_("button",{class:"toggle-icon","aria-label":n,"aria-expanded":"false","aria-controls":c});g(this,qe,{toggleBtn:l,listEl:o}),s.append(l),s.addEventListener("click",()=>{k.isMobile&&this.setListOpen(!this.isListOpen)}),t.replaceWith(s)}get isListOpen(){return h(this,qe)?.listEl.classList.contains("open")??!1}setListOpen(e){let{toggleBtn:t,listEl:o}=h(this,qe);o.classList.toggle("open",e),t.classList.toggle("expanded",e),t.setAttribute("aria-expanded",String(e))}get legalDisplayDot(){return!1}get mainPrice(){return this.card.querySelector(`[slot="heading-m-price"] ${y}[data-template="price"]`)}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let e=this.mainPrice;if(!e)return;let t=e.cloneNode(!0);if(await e.onceSettled(),!e?.options)return;e.options.displayPlanType&&(e.dataset.displayPlanType="false"),xt(this.card,e,t,"displayTax"),xt(this.card,e,t,"displayPerUnit"),t.setAttribute("data-template","legal"),e.parentNode.insertBefore(t,e.nextSibling),await t.onceSettled()}catch{}}get icons(){return!this.card.querySelector('[slot="icons"]')&&!this.card.getAttribute("id")?Jn:Vt`<slot name="icons"></slot>`}renderLayout(){return Vt`
            ${this.badge}
            <div class="body">
                <div class="body-main">
                    ${this.icons}
                    <slot name="badge"></slot>
                    <slot name="heading-xs"></slot>
                    <div class="price-wrapping">
                        <slot name="subtitle"></slot>
                        <slot name="heading-m-price"></slot>
                    </div>
                    <slot name="promo-text"></slot>
                    <slot name="body-m"></slot>
                    <slot name="quantity-select"></slot>
                </div>
                ${this.getMiniCompareFooter()}
            </div>
            ${this.getMiniCompareFooterRows()}
        `}async postCardUpdateHook(){this.legalAdjusted||await this.adjustLegal(),this.setupToggle(),k.isMobile&&this.removeEmptyRows(),await super.postCardUpdateHook(),k.isMobile||await E(this,ce,Pr).call(this)}resetSyncedHeights(){let e=this.getContainer();if(!e)return;let t=this.card.variant,o=E(this,ce,zr).call(this,e);for(let n of ai){let i=`--consonant-merch-card-${t}-${n}-height`;e.style.removeProperty(i),o.forEach(c=>c.style.removeProperty(i))}for(let n=1;n<=oi;n+=1)e.style.removeProperty(this.getRowMinHeightPropertyName(n))}};G=new WeakMap,xe=new WeakMap,Be=new WeakMap,He=new WeakMap,qe=new WeakMap,ce=new WeakSet,zr=function(e){return e.querySelectorAll(`merch-card[variant="${this.card.variant}"]`)},Pr=async function(){let e=this.getContainer();if(!e)return;let t=Array.from(E(this,ce,zr).call(this,e));this.card===t[0]&&(await Promise.all(t.map(o=>o.updateComplete)),await new Promise(o=>setTimeout(o,100)),requestAnimationFrame(()=>{this.resetSyncedHeights(),this.syncHeights()}))},d(Fe,"variantStyle",Xn`
        :host([variant='mini-compare-chart-mweb'])
            .body-main
            > .price-wrapping {
            display: flex;
            flex-direction: column;
        }

        :host([variant='mini-compare-chart-mweb']) .body {
            padding: 0;
        }

        :host([variant='mini-compare-chart-mweb']) .body-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            height: 100%;
            gap: var(--consonant-merch-spacing-xxs);
            padding: var(--consonant-merch-spacing-xs);
            padding-bottom: 0;
        }

        :host([variant='mini-compare-chart-mweb']) footer {
            margin: var(--consonant-merch-spacing-xs);
            margin-top: 0;
            width: auto;
        }

        :host([variant='mini-compare-chart-mweb'])
            .price-wrapping
            > slot[name='subtitle'] {
            display: block;
        }

        :host([variant='mini-compare-chart-mweb'])
            .price-wrapping
            > slot[name='heading-m-price'] {
            display: flex;
            flex: 1;
            flex-direction: column;
            justify-content: flex-end;
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-heading-m-price-height
            );
        }

        :host([variant='mini-compare-chart-mweb'])
            .mini-compare-chart-mweb-badge {
            padding: 2px 10px 3px 10px;
            font-size: var(--consonant-merch-card-body-xs-font-size);
            line-height: var(--consonant-merch-card-body-xs-line-height);
            border-radius: 7.11px 0 0 7.11px;
            font-weight: 700;
        }

        :host([variant='mini-compare-chart-mweb']) footer {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-footer-height
            );
            padding: 0;
            align-items: start;
            flex-flow: column nowrap;
        }

        /* mini-compare card  */
        :host([variant='mini-compare-chart-mweb']) .top-section {
            padding-top: var(--consonant-merch-spacing-s);
            padding-inline-start: var(--consonant-merch-spacing-s);
            height: var(
                --consonant-merch-card-mini-compare-chart-mweb-top-section-height
            );
        }

        :host([variant='mini-compare-chart-mweb'].bullet-list) .top-section {
            padding-top: var(--consonant-merch-spacing-xs);
            padding-inline-start: var(--consonant-merch-spacing-xs);
        }

        @media screen and ${Lr(O)} {
            [class*'-merch-cards']
                :host([variant='mini-compare-chart-mweb'])
                footer {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
        }

        @media screen and ${Lr(C)} {
            :host([variant='mini-compare-chart-mweb']) footer {
                padding: 0;
            }
        }

        @media screen and ${Lr(x)} {
            :host([variant='mini-compare-chart-mweb'])
                .price-wrapping
                > slot[name='subtitle'] {
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-subtitle-height,
                    0px
                );
            }
        }

        :host([variant='mini-compare-chart-mweb']) slot[name='footer-rows'] {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: end;
        }
        /* mini-compare card heights for the slots: heading-m, body-m, heading-m-price, price-commitment, offers, promo-text, footer */
        /* Use ::slotted() to target light DOM elements — shadow slots have display:contents so min-height is ignored on them */
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='heading-m']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-heading-m-height
            );
        }
        :host([variant='mini-compare-chart-mweb']) ::slotted([slot='body-m']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-body-m-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='heading-m-price']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-heading-m-price-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='body-xxs']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-body-xxs-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='price-commitment']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-price-commitment-height
            );
        }
        :host([variant='mini-compare-chart-mweb']) ::slotted([slot='offers']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-offers-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='promo-text']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-promo-text-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='quantity-select']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-quantity-select-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='callout-content']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-callout-content-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='heading-xs']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-heading-xs-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='subtitle']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-subtitle-height
            );
        }
        :host([variant='mini-compare-chart-mweb']) ::slotted([slot='body-xs']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-body-xs-height
            );
        }
        :host([variant='mini-compare-chart-mweb']) ::slotted([slot='addon']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-addon-height
            );
        }
        /* Shadow DOM slot min-heights — ensures empty slots reserve space for cross-card alignment */
        :host([variant='mini-compare-chart-mweb'])
            .body-main
            > slot[name='heading-xs'] {
            display: block;
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-heading-xs-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            .body-main
            > slot[name='promo-text'] {
            display: block;
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-promo-text-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            .body-main
            > slot[name='body-m'] {
            display: block;
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-body-m-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            .footer-rows-container
            > slot[name='body-xs'] {
            display: block;
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-body-xs-height
            );
        }

        :host([variant='mini-compare-chart-mweb']) slot[name='footer-rows'] {
            justify-content: flex-start;
        }

        /* Border color styles */
        :host(
            [variant='mini-compare-chart-mweb'][border-color='spectrum-yellow-300-plans']
        ) {
            --consonant-merch-card-border-color: #ffd947;
        }

        :host(
            [variant='mini-compare-chart-mweb'][border-color='spectrum-gray-300-plans']
        ) {
            --consonant-merch-card-border-color: #dadada;
        }

        :host(
            [variant='mini-compare-chart-mweb'][border-color='spectrum-green-900-plans']
        ) {
            --consonant-merch-card-border-color: #05834e;
        }

        :host(
            [variant='mini-compare-chart-mweb'][border-color='spectrum-red-700-plans']
        ) {
            --consonant-merch-card-border-color: #eb1000;
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
        }

        :host(
            [variant='mini-compare-chart-mweb'][border-color='gradient-purple-blue']
        ) {
            --consonant-merch-card-border-color: linear-gradient(
                135deg,
                #9256dc,
                #1473e6
            );
        }

        /* Badge color styles */
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='badge'].spectrum-red-700-plans) {
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
        }

        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='badge'].spectrum-yellow-300-plans),
        :host([variant='mini-compare-chart-mweb'])
            #badge.spectrum-yellow-300-plans {
            background-color: #ffd947;
            color: #2c2c2c;
        }

        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='badge'].spectrum-gray-300-plans),
        :host([variant='mini-compare-chart-mweb'])
            #badge.spectrum-gray-300-plans {
            background-color: #dadada;
            color: #2c2c2c;
        }

        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='badge'].spectrum-gray-700-plans),
        :host([variant='mini-compare-chart-mweb'])
            #badge.spectrum-gray-700-plans {
            background-color: #4b4b4b;
            color: #ffffff;
        }

        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='badge'].spectrum-green-900-plans),
        :host([variant='mini-compare-chart-mweb'])
            #badge.spectrum-green-900-plans {
            background-color: #05834e;
            color: #ffffff;
        }

        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='badge'].spectrum-red-700-plans),
        :host([variant='mini-compare-chart-mweb'])
            #badge.spectrum-red-700-plans {
            background-color: #eb1000;
            color: #ffffff;
        }

        :host([variant='mini-compare-chart-mweb'])
            ::slotted(h3[slot='heading-xs']) {
            max-width: var(--consonant-merch-card-heading-xs-max-width, 100%);
        }

        :host([variant='mini-compare-chart-mweb']) .footer-rows-container {
            background-color: #f8f8f8;
            border-radius: 0 0 var(--consonant-merch-spacing-xxs)
                var(--consonant-merch-spacing-xxs);
        }

        :host([variant='mini-compare-chart-mweb']) .action-area {
            display: flex;
            justify-content: start;
            align-items: flex-end;
            flex-wrap: wrap;
            width: 100%;
            gap: var(--consonant-merch-spacing-xxs);
            margin: unset;
        }
    `);import{html as yt,css as ni,nothing as Wt}from"./lit-all.min.js";var Za=`
:root {
    --consonant-merch-card-plans-width: 302px;
    --consonant-merch-card-plans-students-width: 302px;
    --consonant-merch-card-plans-icon-size: 40px;
}

merch-card[variant^="plans"] {
    --merch-card-plans-heading-xs-min-height: 23px;
    --consonant-merch-card-callout-icon-size: 18px;
    width: var(--consonant-merch-card-plans-width);
}

merch-card[variant^="plans"] merch-badge {
    max-width: calc(var(--consonant-merch-card-plans-width) * var(--merch-badge-card-size) - var(--merch-badge-with-offset) * 40px - var(--merch-badge-offset) * 48px);
}

merch-card[variant="plans-students"] {
    width: var(--consonant-merch-card-plans-students-width);
}

merch-card[variant^="plans"][size="wide"], merch-card[variant^="plans"][size="super-wide"] {
    width: auto;
}

merch-card[variant^="plans"] [slot="icons"] {
    --img-width: 41.5px;
}

merch-card[variant="plans-education"] [slot="body-xs"] span.price:not(.price-legal) {
    display: inline-block;
    font-size: var(--consonant-merch-card-heading-xs-font-size);
    font-weight: 700;
}

merch-card[variant="plans"] [slot="subtitle"] {
    font-size: 14px;
    font-weight: 700;
    line-height: 18px;
}

merch-card[variant^="plans"] span.price-unit-type {
    display: block;
}

merch-card[variant^="plans"] .price-unit-type:not(.disabled)::before {
    content: "";
}
merch-card[variant^="plans"] [slot="callout-content"] span.price-unit-type,
merch-card[variant^="plans"] [slot="addon"] span.price-unit-type,
merch-card[variant^="plans"] .price.price-strikethrough span.price-unit-type,
merch-card[variant^="plans"] .price.price-promo-strikethrough span.price-unit-type,
merch-card[variant^="plans"] span.price-unit-type.disabled {
  display: inline;
}

merch-card[variant^="plans"] [slot="heading-xs"] span.price.price-strikethrough,
merch-card[variant^="plans"] [slot="heading-xs"] span.price.price-promo-strikethrough,
merch-card[variant^="plans"] [slot="heading-m"] span.price.price-strikethrough,
merch-card[variant^="plans"] [slot="heading-m"] span.price.price-promo-strikethrough,
merch-card[variant="plans-education"] [slot="body-xs"] span.price.price-strikethrough,
merch-card[variant="plans-education"] [slot="body-xs"] span.price.price-promo-strikethrough {
    font-size: var(--consonant-merch-card-heading-xxxs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
    font-weight: 700;
}

merch-card[variant^="plans"] [slot="heading-m"] p {
    font-size: var(--consonant-merch-card-heading-xxxs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
}

merch-card[variant^="plans"] [slot="heading-m"] span.price:not(.price-strikethrough):not(.price-promo-strikethrough):not(.price-legal) {
    font-size: var(--consonant-merch-card-heading-m-font-size);
    line-height: var(--consonant-merch-card-heading-m-line-height);
}

merch-card[variant^="plans"] [slot="heading-m"] span[is="inline-price"][data-template="price"] {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: baseline;
}

merch-card[variant^="plans"] [slot="heading-m"] span[is="inline-price"][data-template="price"]:has(.price-strikethrough, .price-promo-strikethrough):not(:has(.price-annual)) {
    display: flex;
}

merch-card[variant^="plans"] [slot="heading-m"] span[is="inline-price"][data-template="price"]:has(.price-annual) {
    display: inline;
}

merch-card[variant^="plans"] [slot='heading-xs'],
merch-card[variant="plans-education"] span.heading-xs,
merch-card[variant="plans-education"] [slot="body-xs"] span.price:not(.price-strikethrough):not(.price-promo-strikethrough) {
    min-height: var(--consonant-merch-card-plans-heading-xs-height, var(--merch-card-plans-heading-xs-min-height));
}

merch-card[variant="plans-education"] [slot="body-xs"] p:has(.heading-xs) {
    margin-bottom: 16x;
}

merch-card[variant="plans-education"] [slot="body-xs"] p:has(span[is="inline-price"]) {
    margin-bottom: 16px;
}

merch-card[variant^="plans"] span.text-l {
    display: block;
    font-size: 18px;
    line-height: 23px;
}

merch-card[variant="plans-education"] span.promo-text {
    margin-bottom: 8px;
}

merch-card[variant="plans-education"] p:has(a[href^='tel:']):has(+ p, + div) {
    margin-bottom: 16px;
}

merch-card[variant^="plans"] [slot="promo-text"],
merch-card[variant="plans-education"] span.promo-text {
    line-height: var(--consonant-merch-card-body-xs-line-height);
}

merch-card[variant="plans-education"] [slot="body-xs"] {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

merch-card[variant="plans-education"] .spacer {
    height: calc(var(--merch-card-plans-edu-list-max-offset) - var(--merch-card-plans-edu-list-offset));
}

merch-card[variant="plans-education"] ul + p {
    margin-top: 16px;
}

merch-card-collection.plans merch-card {
    width: auto;
    height: 100%;
}

merch-card-collection.plans merch-card[variant="plans"] aem-fragment + [slot^="heading-"] {
    margin-top: calc(40px + var(--consonant-merch-spacing-xxs));
}

merch-card[variant^='plans'] span[data-template="legal"] {
    display: block;
    color: var(----merch-color-grey-80);
    font-size: 14px;
    font-style: italic;
    font-weight: 400;
    line-height: 21px;
}

html:has(mas-commerce-service[locale="ja_JP"]) {
    merch-card[variant^='plans'] span[data-template="legal"] {
        display: inline;
    }
    merch-card[variant^='plans'] [slot="heading-m"] span[is="inline-price"][data-template="price"] {
        display: inline-flex;
    }
    merch-card[variant^='plans'] [slot="heading-m"] p:has(.price-alternative) {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        font-size: 0;
    }
    merch-card[variant^='plans'] [slot="heading-m"] p:has(.price-alternative) span[is="inline-price"][data-template="price"] {
        display: contents;
    }
    merch-card[variant^='plans'] [slot="heading-m"] p:has(.price-alternative) .price-strikethrough {
        flex-basis: 100%;
    }
}

merch-card[variant^='plans'] span.price-legal::first-letter {
    text-transform: uppercase;
}

merch-card[variant^='plans'] span.price-legal .price-tax-inclusivity::before {
  content: initial;
}

merch-card[variant^="plans"] [slot="description"] {
    min-height: 84px;
}

merch-card[variant^="plans"] [slot="body-xs"] a {
    color: var(--link-color);
    display: inline-block;
    padding: 2px 0;
}

merch-card[variant^="plans"] [slot="promo-text"] a {
    color: inherit;
}

merch-card[variant^="plans"] [slot="callout-content"] {
    margin: 8px 0 0;
}

merch-card[variant^="plans"][size="super-wide"] [slot="callout-content"] {
    margin: 0;
}

merch-card[variant^="plans"] [slot='callout-content'] > div > div,
merch-card[variant^="plans"] [slot="callout-content"] > p {
    position: relative;
    padding: 2px 10px 3px;
    background: #D9D9D9;
}

merch-card[variant^="plans"] [slot="callout-content"] > p:has(> .icon-button) {
    padding-inline-end: 36px;
}

merch-card[variant^="plans"] [slot='callout-content'] > p,
merch-card[variant^="plans"] [slot='callout-content'] > div > div > div {
    color: #000;
}

merch-card[variant^="plans"] [slot="callout-content"] img {
    margin: 1.5px 0 1.5px 8px;
}

merch-card[variant^="plans"] [slot="whats-included"] [slot="description"] {
  min-height: auto;
}

merch-card[variant^="plans"] [slot="quantity-select"] {
    margin-top: auto;
    padding-top: 8px;
}

merch-card[variant^="plans"]:has([slot="quantity-select"]) merch-addon {
    margin: 0;
}

merch-card[variant^="plans"] merch-addon {
    --merch-addon-gap: 10px;
    --merch-addon-align: center;
    --merch-addon-checkbox-size: 12px;
    --merch-addon-checkbox-border: 2px solid rgb(109, 109, 109);
    --merch-addon-checkbox-radius: 2px;
    --merch-addon-checkbox-checked-bg: var(--checkmark-icon);
    --merch-addon-checkbox-checked-color: var(--color-accent);
    --merch-addon-label-size: 12px;
    --merch-addon-label-color: rgb(34, 34, 34);
    --merch-addon-label-line-height: normal;
}

merch-card[variant^="plans"] [slot="footer"] a {
    line-height: 19px;
    padding: 3px 16px 4px;
}

merch-card[variant^="plans"] [slot="footer"] .con-button > span {
    min-width: unset;
}

merch-card[variant^="plans"] merch-addon span[data-template="price"] {
    display: none;
}

merch-card[variant^="plans"]:not([size]) {
    merch-whats-included merch-mnemonic-list,
    merch-whats-included [slot="heading"] {
        width: 100%;
    }

    merch-whats-included merch-mnemonic-list:not(:has([slot="description"] span:not(:empty))) {
        width: auto;
        margin-right: unset;
    }
}

.tab-content-container.red-strikethrough-price merch-card[variant^="plans"] [slot="heading-m"] .price-strikethrough {
  color: #ff4136;
}

.collection-container.plans {
    --merch-card-collection-card-min-height: 273px;
    --merch-card-collection-card-width: var(--consonant-merch-card-plans-width);
}

merch-sidenav.plans {
    --merch-sidenav-padding: 16px 20px 16px 16px;
}

merch-card-collection-header.plans {
    --merch-card-collection-header-columns: 1fr fit-content(100%);
    --merch-card-collection-header-areas: "result filter";
}

.one-merch-card.plans,
.two-merch-cards.plans,
.three-merch-cards.plans,
.four-merch-cards.plans {
    --merch-card-collection-card-width: var(--consonant-merch-card-plans-width);
}

merch-card-collection:has([slot="subtitle"]) merch-card {
    --merch-card-plans-subtitle-display: block;
}

.columns .text .foreground {
    margin: 0;
}

.columns.checkmark-list ul {
    margin: 0;
    padding-inline-start: 20px;
    list-style-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -3 18 18" height="18px"><path fill="currentcolor" d="M15.656,3.8625l-.7275-.5665a.5.5,0,0,0-.7.0875L7.411,12.1415,4.0875,8.8355a.5.5,0,0,0-.707,0L2.718,9.5a.5.5,0,0,0,0,.707l4.463,4.45a.5.5,0,0,0,.75-.0465L15.7435,4.564A.5.5,0,0,0,15.656,3.8625Z"></path></svg>');
}

.columns.checkmark-list ul li {
    padding-inline-start: 8px;
}

/* Tabs containers */

#tabs-plan {
    --tabs-active-text-color: #131313;
    --tabs-border-color: #444444;
}
#tabs-plan .tab-list-container button[role="tab"][aria-selected="false"] {
    border-top-color: #EAEAEA;
    border-right-color: #EAEAEA;
}

#tabs-plan .tab-list-container button[role="tab"][aria-selected="false"]:first-of-type {
    border-left-color: #EAEAEA;
}

.plans-team {
    display: grid;
    grid-template-columns: min-content;
    justify-content: center;
}

.plans-team .columns .row-1 {
    grid-template-columns: repeat(2, calc(var(--consonant-merch-card-plans-width) * 2 + 32px));
    justify-content: center;
}

.plans-team .col-2 {
    align-content: center;
}

.plans-team .col-2 h3 {
    font-size: 20px;
    margin: 0 0 16px;
}

.plans-highlight .columns :is(.col-1, .col-2) :is(h1, h2, h3, h4, h5):first-child {
	background: rgb(238, 238, 238);
	padding: var(--spacing-m);
	font-size: var(--type-heading-s-size);
    line-height: var(--type-heading-s-lh);
}

.plans-team .col-2 p {
    margin: 0 0 16px;
}

.plans-team .text .foreground,
.plans-edu .text .foreground {
    max-width: unset;
    margin: 0;
}

.plans-edu .columns .row {
    grid-template-columns: repeat(auto-fit, var(--consonant-merch-card-plans-students-width));
    justify-content: center;
    align-items: center;
}

.plans-edu .columns .row-1 {
    grid-template-columns: var(--consonant-merch-card-plans-students-width);
    margin-block: var(--spacing-xs);
}

.plans-edu .columns .row-2 {
    margin-bottom: 40px;
}

.plans-edu .columns .row-3 {
    margin-bottom: 48px;
}

.plans-edu .col-2 h3 {
    margin: 0 0 16px;
    font-size: 20px;
}

.plans-individual .content,
.plans-team .content,
.plans-edu-inst .content {
    padding-bottom: 48px;
}

/* Mobile */
@media screen and ${S} {
    merch-whats-included merch-mnemonic-list,
    merch-whats-included [slot="heading"] {
        width: 100%;
    }

    merch-whats-included merch-mnemonic-list:not(:has([slot="description"] span:not(:empty))) {
        width: auto;
        margin-right: unset;
    }

    merch-card[variant="plans-education"] .spacer {
        height: 0px;
    }

    merch-card[variant^="plans"] merch-badge {
        max-width: calc(var(--consonant-merch-card-plans-width) - var(--merch-badge-with-offset) * 40px - var(--merch-badge-offset) * 48px);
    }
}

/* Tablet */
@media screen and ${x} {
    :root {
        --consonant-merch-card-plans-students-width: 486px;
    }

    .four-merch-cards.plans .foreground {
        max-width: unset;
    }
}

@media screen and ${O} {
    .plans-team .columns .row-1 {
        grid-template-columns: min-content;
    }

    .plans-edu-inst {
        display: grid;
        grid-template-columns: min-content;
        justify-content: center;
    }

    .plans-edu-inst .text .foreground {
        max-width: unset;
        margin: 0;
    }
}

/* desktop */
@media screen and ${C} {
    :root {
        --consonant-merch-card-plans-width: 276px;
        --consonant-merch-card-plans-students-width: 484px;
    }

    merch-sidenav.plans {
        --merch-sidenav-collection-gap: 30px;
    }

    .columns .four-merch-cards.plans {
        grid-template-columns: repeat(2, var(--consonant-merch-card-plans-width));
    }

    merch-card-collection-header.plans {
        --merch-card-collection-header-columns: fit-content(100%);
        --merch-card-collection-header-areas: "custom";
    }

    .collection-container.plans:has(merch-sidenav) {
        --translate-direction: -1;
        width: fit-content;
        position: relative;
        inset-inline-start: 50%;
        translate: calc(var(--translate-direction) * 50vw) 0;
        justify-content: start;
        padding-inline: 30px;
    }

    [dir="rtl"] .collection-container.plans:has(merch-sidenav) {
        --translate-direction: 1;
    }

    .plans-individual .content {
        padding-top: 24px;
    }

    .plans-edu .columns .row-1 {
        grid-template-columns: calc(var(--consonant-merch-card-plans-students-width) * 2 + var(--spacing-m));
    }

    .plans-edu-inst .text .foreground {
        max-width: 1200px;
        margin: auto;
    }
}

/* Large desktop */
@media screen and ${$} {
    .columns .four-merch-cards.plans {
        grid-template-columns: repeat(2, var(--consonant-merch-card-plans-width));
    }

    merch-sidenav.plans {
        --merch-sidenav-collection-gap: 54px;
    }
}
`;var Kt={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},addon:!0,secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],whatsIncluded:{tag:"div",slot:"whats-included"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},Xa={...(function(){let{whatsIncluded:a,size:r,...e}=Kt;return e})(),title:{tag:"h3",slot:"heading-s"},secureLabel:!1},Ja={...(function(){let{subtitle:a,whatsIncluded:r,size:e,quantitySelect:t,...o}=Kt;return o})()},V,W,H=class extends b{constructor(e){super(e);f(this,V);f(this,W);this.adaptForMedia=this.adaptForMedia.bind(this)}priceOptionsProvider(e,t){e.dataset.template===P&&(t.displayPlanType=this.card?.settings?.displayPlanType??!1)}getGlobalCSS(){return Za}adjustSlotPlacement(e,t,o){let n=this.card.shadowRoot,i=n.querySelector("footer"),c=this.card.getAttribute("size");if(!c)return;let s=n.querySelector(`footer slot[name="${e}"]`),l=n.querySelector(`.body slot[name="${e}"]`),m=n.querySelector(".body");if(c.includes("wide")||(i?.classList.remove("wide-footer"),s&&s.remove()),!!t.includes(c)){if(i?.classList.toggle("wide-footer",k.isDesktopOrUp),!o&&s){if(l)s.remove();else{let p=m.querySelector(`[data-placeholder-for="${e}"]`);p?p.replaceWith(s):m.appendChild(s)}return}if(o&&l){let p=document.createElement("div");if(p.setAttribute("data-placeholder-for",e),p.classList.add("slot-placeholder"),!s){let v=l.cloneNode(!0);i.prepend(v)}l.replaceWith(p)}}}adaptForMedia(){if(!this.card.closest("merch-card-collection,overlay-trigger,.two-merch-cards,.three-merch-cards,.four-merch-cards, .columns")){this.card.removeAttribute("size");return}this.adjustSlotPlacement("addon",["super-wide"],k.isDesktopOrUp),this.adjustSlotPlacement("callout-content",["super-wide"],k.isDesktopOrUp)}adjustCallout(){let e=this.card.querySelector('[slot="callout-content"] .icon-button');e&&e.title&&(e.dataset.tooltip=e.title,e.removeAttribute("title"),e.classList.add("hide-tooltip"),document.addEventListener("touchstart",t=>{t.preventDefault(),t.target!==e?e.classList.add("hide-tooltip"):t.target.classList.toggle("hide-tooltip")}),document.addEventListener("mouseover",t=>{t.preventDefault(),t.target!==e?e.classList.add("hide-tooltip"):t.target.classList.remove("hide-tooltip")}))}syncHeights(){if(this.card.getBoundingClientRect().width<=2){h(this,V)||(g(this,V,new ResizeObserver(()=>{this.card.getBoundingClientRect().width>2&&(h(this,V)?.disconnect(),g(this,V,null),this.syncHeights())})),h(this,V).observe(this.card));return}let e=["heading-xs","subtitle","heading-m","promo-text","body-xs"];this.syncRowHeights(e.map(t=>({name:t,getElement:o=>o.querySelector(`[slot="${t}"]`)})))}async adjustEduLists(){if(this.card.variant!=="plans-education"||this.card.querySelector(".spacer"))return;let t=this.card.querySelector('[slot="body-xs"]');if(!t)return;let o=t.querySelector("ul");if(!o)return;let n=o.previousElementSibling,i=document.createElement("div");i.classList.add("spacer"),t.insertBefore(i,n);let c=new IntersectionObserver(([s])=>{if(s.boundingClientRect.height===0)return;let l=0,m=this.card.querySelector('[slot="heading-s"]');m&&(l+=mt(m));let p=this.card.querySelector('[slot="subtitle"]');p&&(l+=mt(p));let v=this.card.querySelector('[slot="heading-m"]');v&&(l+=8+mt(v));for(let w of t.childNodes){if(w.classList.contains("spacer"))break;l+=mt(w)}let u=this.card.parentElement.style.getPropertyValue("--merch-card-plans-edu-list-max-offset");l>(parseFloat(u)||0)&&this.card.parentElement.style.setProperty("--merch-card-plans-edu-list-max-offset",`${l}px`),this.card.style.setProperty("--merch-card-plans-edu-list-offset",`${l}px`),c.disconnect()});c.observe(this.card)}async postCardUpdateHook(){this.adaptForMedia(),this.adjustAddon(),this.adjustCallout(),this.legalAdjusted||(await this.adjustLegal(),await this.adjustEduLists()),await super.postCardUpdateHook(),window.matchMedia("(min-width: 768px)").matches&&this.card===this.card.parentElement.firstElementChild&&requestAnimationFrame(()=>{this.syncHeights()})}get headingM(){return this.card.querySelector('[slot="heading-m"]')}get mainPrice(){return this.headingM?.querySelector(`${y}[data-template="price"]`)}get divider(){return this.card.variant==="plans-education"?yt`<div class="divider"></div>`:Wt}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let e=[],t=this.card.querySelector(`[slot="heading-m"] ${y}[data-template="price"]`);t&&e.push(t);let o=e.map(async n=>{let i=n.cloneNode(!0);await n.onceSettled(),n?.options&&(n.options.displayPerUnit&&(n.dataset.displayPerUnit="false"),n.options.displayTax&&(n.dataset.displayTax="false"),n.options.displayPlanType&&(n.dataset.displayPlanType="false"),i.setAttribute("data-template","legal"),n.parentNode.insertBefore(i,n.nextSibling),await i.onceSettled())});await Promise.all(o)}catch{}}async adjustAddon(){await this.card.updateComplete;let e=this.card.addon;if(!e)return;e.setAttribute("custom-checkbox","");let t=this.mainPrice;if(!t)return;await t.onceSettled?.();let o=t.value?.[0]?.planType;o&&(e.planType=o)}get stockCheckbox(){return this.card.checkboxLabel?yt`<label id="stock-checkbox">
                <input type="checkbox" @change=${this.card.toggleStockOffer}></input>
                <span></span>
                ${this.card.checkboxLabel}
            </label>`:Wt}get icons(){return!this.card.querySelector('[slot="icons"]')&&!this.card.getAttribute("id")?Wt:yt`<slot name="icons"></slot>`}resizeHandler(){h(this,W)&&cancelAnimationFrame(h(this,W)),g(this,W,requestAnimationFrame(()=>{g(this,W,null),window.matchMedia("(min-width: 768px)").matches&&this.syncHeights()}))}connectedCallbackHook(){k.matchMobile.addEventListener("change",this.adaptForMedia),k.matchDesktopOrUp.addEventListener("change",this.adaptForMedia)}disconnectedCallbackHook(){k.matchMobile.removeEventListener("change",this.adaptForMedia),k.matchDesktopOrUp.removeEventListener("change",this.adaptForMedia),h(this,V)?.disconnect(),g(this,V,null),h(this,W)&&(cancelAnimationFrame(h(this,W)),g(this,W,null))}renderLayout(){return yt` ${this.badge}
            <div class="body">
                ${this.icons}
                <slot name="heading-xs"></slot>
                <slot name="heading-s"></slot>
                <slot name="subtitle"></slot>
                ${this.divider}
                <slot name="heading-m"></slot>
                <slot name="annualPrice"></slot>
                <slot name="priceLabel"></slot>
                <slot name="body-xxs"></slot>
                <slot name="promo-text"></slot>
                <slot name="body-xs"></slot>
                <slot name="whats-included"></slot>
                <slot name="callout-content"></slot>
                <slot name="quantity-select"></slot>
                ${this.stockCheckbox}
                <slot name="addon"></slot>
                <slot name="badge"></slot>
            </div>
            ${this.secureLabelFooter}
            <slot></slot>`}};V=new WeakMap,W=new WeakMap,d(H,"variantStyle",ni`
        :host([variant^='plans']) {
            min-height: 273px;
            --merch-card-plans-min-width: 244px;
            --merch-card-plans-padding: 15px;
            --merch-card-plans-subtitle-display: contents;
            --merch-card-plans-heading-min-height: 23px;
            --merch-color-green-promo: #05834e;
            --secure-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23505050' viewBox='0 0 12 15'%3E%3Cpath d='M11.5 6H11V5A5 5 0 1 0 1 5v1H.5a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5ZM3 5a3 3 0 1 1 6 0v1H3Zm4 6.111V12.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1.389a1.5 1.5 0 1 1 2 0Z'/%3E%3C/svg%3E");
            font-weight: 400;
            background:
                linear-gradient(white, white) padding-box,
                var(--consonant-merch-card-border-color, #dadada) border-box;
            border: 1px solid transparent;
        }

        :host([variant^='plans']) .slot-placeholder {
            display: none;
        }

        :host([variant='plans-education']) {
            min-height: unset;
        }

        :host([variant='plans-education']) ::slotted(h3[slot='heading-s']) {
            max-width: var(--consonant-merch-card-heading-xs-max-width, 100%);
        }

        :host([variant='plans-education']) ::slotted([slot='subtitle']) {
            font-size: var(--consonant-merch-card-heading-xxxs-font-size);
            line-height: var(--consonant-merch-card-heading-xxxs-line-height);
            font-style: italic;
            font-weight: 400;
        }

        :host([variant='plans-education']) .divider {
            border: 0;
            border-top: 1px solid #e8e8e8;
            margin-top: 8px;
            margin-bottom: 8px;
        }

        :host([variant='plans']) slot[name='subtitle'] {
            display: var(--merch-card-plans-subtitle-display);
            min-height: 18px;
            margin-top: 8px;
            margin-bottom: -8px;
        }

        :host([variant='plans']) ::slotted([slot='heading-xs']) {
            min-height: var(--merch-card-plans-heading-min-height);
        }

        :host([variant^='plans']) .body {
            min-width: var(--merch-card-plans-min-width);
            padding: var(--merch-card-plans-padding);
        }

        :host([variant='plans'][size]) .body {
            max-width: none;
        }

        :host([variant^='plans']) ::slotted([slot='addon']) {
            margin-top: auto;
            padding-top: 8px;
        }

        :host([variant^='plans']) footer ::slotted([slot='addon']) {
            margin: 0;
            padding: 0;
        }

        :host([variant='plans']) .wide-footer #stock-checkbox {
            margin-top: 0;
        }

        :host([variant='plans']) #stock-checkbox {
            margin-top: 8px;
            gap: 9px;
            color: rgb(34, 34, 34);
            line-height: var(--consonant-merch-card-detail-xs-line-height);
            padding-top: 4px;
            padding-bottom: 5px;
        }

        :host([variant='plans']) #stock-checkbox > span {
            border: 2px solid rgb(109, 109, 109);
            width: 12px;
            height: 12px;
        }

        :host([variant^='plans']) footer {
            padding: var(--merch-card-plans-padding);
            padding-top: 1px;
        }

        :host([variant='plans']) .secure-transaction-label {
            color: rgb(80, 80, 80);
            line-height: var(--consonant-merch-card-detail-xs-line-height);
        }

        :host([variant='plans']) ::slotted([slot='heading-xs']) {
            max-width: var(--consonant-merch-card-heading-xs-max-width, 100%);
        }

        :host([variant='plans']) #badge {
            border-radius: 4px 0 0 4px;
            font-weight: 400;
            line-height: 21px;
            padding: 2px 10px 3px;
        }
    `),d(H,"collectionOptions",{customHeaderArea:e=>e.sidenav?yt`<slot name="resultsText"></slot>`:Wt,headerVisibility:{search:!1,sort:!1,result:["mobile","tablet"],custom:["desktop"]},onSidenavAttached:e=>{let t=()=>{let o=e.querySelectorAll("merch-card");for(let i of o)i.hasAttribute("data-size")&&(i.setAttribute("size",i.getAttribute("data-size")),i.removeAttribute("data-size"));if(!k.isDesktop)return;let n=0;for(let i of o){if(i.style.display==="none")continue;let c=i.getAttribute("size"),s=c==="wide"?2:c==="super-wide"?3:1;s===2&&n%3===2&&(i.setAttribute("data-size",c),i.removeAttribute("size"),s=1),n+=s}};k.matchDesktop.addEventListener("change",t),e.addEventListener(Pe,t),e.onUnmount.push(()=>{k.matchDesktop.removeEventListener("change",t),e.removeEventListener(Pe,t)})}});import{html as X,css as ii,unsafeCSS as to,nothing as Yt}from"./lit-all.min.js";var eo=`
:root {
    --consonant-merch-card-plans-v2-font-family-regular: 'Adobe Clean', 'adobe-clean', sans-serif;
    --consonant-merch-card-plans-v2-font-family: 'Adobe Clean Display', 'adobe-clean-display', 'Adobe Clean', 'adobe-clean', sans-serif;
    --consonant-merch-card-plans-v2-width: 276px;
    --consonant-merch-card-plans-v2-height: auto;
    --consonant-merch-card-plans-v2-icon-size: 41.5px;
    --consonant-merch-card-plans-v2-border-color: #E9E9E9;
    --consonant-merch-card-plans-v2-border-radius: 16px;
    --picker-up-icon-black: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="10" width="10" viewBox="0 0 10 10"><path d="M5 3L8 6L2 6Z" fill="%222222"/></svg>');
    --picker-down-icon-black: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="10" width="10" viewBox="0 0 10 10"><path d="M5 7L2 4L8 4Z" fill="%222222"/></svg>');
    --consonant-merch-spacing-m: 20px;
    --consonant-merch-card-plans-v2-toggle-background-color: #F8F8F8;
    --consonant-merch-card-plans-v2-toggle-label-color: #292929;
    --consonant-merch-card-plans-v2-divider-color: #E8E8E8;
    --consonant-merch-card-plans-v2-toggle-expanded-background-color: #FFFFFF;
}

merch-card[variant="plans-v2"] {
    width: var(--consonant-merch-card-plans-v2-width);
    height: var(--consonant-merch-card-plans-v2-height);
    border-radius: var(--consonant-merch-card-plans-v2-border-radius);
    background-color: var(--spectrum-gray-50, #FFFFFF);
    overflow: visible;
    position: relative;
    z-index: 1;
    background: linear-gradient(var(--spectrum-gray-50, #FFFFFF), var(--spectrum-gray-50, #FFFFFF)) padding-box, var(--consonant-merch-card-border-color, var(--consonant-merch-card-plans-v2-border-color)) border-box;
    border: 1px solid transparent;
}

merch-card[variant="plans-v2"]:has(merch-quantity-select:not([closed])) {
    z-index: 100;
}

merch-card[variant="plans-v2"] .spacer {
    height: calc(var(--merch-card-plans-v2-max-offset) - var(--merch-card-plans-v2-offset));
}

.dark merch-card[variant="plans-v2"] {
    --consonant-merch-card-background-color: rgb(20, 24, 38);
    --consonant-merch-card-border-color: #3D3D3D;
    --spectrum-gray-800: rgb(242, 242, 242);
    --spectrum-gray-700: rgb(219, 219, 219);
    background-color: var(--consonant-merch-card-background-color);
}

/* Keep "What you get" section white in dark mode */
.dark merch-card[variant="plans-v2"] merch-whats-included {
    background-color: #FFFFFF;
}

.dark merch-card[variant="plans-v2"] [slot="body-xs"] .spectrum-Link.spectrum-Link--primary {
    color: #FFFFFF;
}

.dark merch-card[variant="plans-v2"] merch-whats-included h4,
.dark merch-card[variant="plans-v2"] merch-whats-included ul li {
    color: #292929;
}
.dark merch-card[variant="plans-v2"] [slot="body-xs"] {
    color: #C6C6C6;
}
.dark merch-card[variant="plans-v2"] [slot="quantity-select"] merch-quantity-select {
  --label-color: #C6C6C6 ;
}

/* Dark mode heading colors for wide cards */
.dark merch-card[variant="plans-v2"][size="wide"] [slot^="heading-"],
.dark merch-card[variant="plans-v2"][size="wide"] span[class^="heading-"],
.dark merch-card[variant="plans-v2"] span.price-unit-type,
.dark merch-card[variant="plans-v2"] [slot="heading-m"] .price-recurrence  {
    color: #B6B6B6;
}

.dark merch-card[variant="plans-v2"] [slot="heading-m"] span.price.price-strikethrough,
.dark merch-card[variant="plans-v2"] [slot="heading-m"] s {
  color: #B6B6B6;
}

/* Dark mode strikethrough price size for wide cards */
.dark merch-card[variant="plans-v2"][size="wide"] [slot="heading-m"] span.price.price-strikethrough,
.dark merch-card[variant="plans-v2"][size="wide"] [slot="heading-m"] s {
    font-size: 20px;
}

.dark merch-card[variant="plans-v2"] {
  --consonant-merch-card-plans-v2-toggle-background-color: var(--consonant-merch-card-background-color);
  --consonant-merch-card-plans-v2-toggle-expanded-background-color: var(--consonant-merch-card-background-color);
  --consonant-merch-card-plans-v2-toggle-label-color: #FFFFFF;
  --consonant-merch-card-plans-v2-divider-color: var(--consonant-merch-card-background-color);
}
merch-card[variant="plans-v2"][size="wide"],
merch-card[variant="plans-v2"][size="super-wide"] {
    width: 100%;
    max-width: 768px;
}

merch-card[variant="plans-v2"] [slot="icons"] {
    --img-width: var(--consonant-merch-card-plans-v2-icon-size);
    --img-height: var(--consonant-merch-card-plans-v2-icon-size);
}
merch-card[variant="plans-v2"] [slot="heading-m"] .price-recurrence,
merch-card[variant="plans-v2"] span.price-unit-type {
    color: #6B6B6B;
}

merch-card[variant="plans-v2"] span.price-unit-type {
    display: inline;
    font-size: 20px;
    font-weight: 900;
    line-height: 110%;
}

merch-card[variant="plans-v2"] .price-unit-type:not(.disabled)::before {
    content: '';
}

merch-card[variant="plans-v2"] .price-unit-type.disabled,
merch-card[variant="plans-v2"] .price-tax-inclusivity.disabled {
    display: none;
}

merch-card[variant="plans-v2"] [slot="heading-m"] .price-unit-type.disabled,
merch-card[variant="plans-v2"] [slot="heading-m"] .price-tax-inclusivity.disabled {
    display: none;
}

merch-card[variant="plans-v2"] s .price-unit-type.disabled,
merch-card[variant="plans-v2"] s .price-tax-inclusivity.disabled,
merch-card[variant="plans-v2"] .price-strikethrough .price-unit-type.disabled,
merch-card[variant="plans-v2"] .price-strikethrough .price-tax-inclusivity.disabled {
    display: none;
}

merch-card[variant="plans-v2"] [slot="description"] {
    min-height: auto;
}

merch-card[variant="plans-v2"] [slot="description"] {
    min-height: auto;
}

merch-card[variant="plans-v2"] [slot="quantity-select"] {}

merch-card[variant="plans-v2"] merch-addon {
    --merch-addon-gap: 10px;
    --merch-addon-align: flex-start;
}

merch-card[variant="plans-v2"] merch-addon span[data-template="price"] {
    display: inline;
}

merch-card[variant^="plans-v2"] span[data-template="legal"] {
    display: inline;
    color: var(--spectrum-gray-600, #6E6E6E);
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 1.375;
}

merch-card[variant="plans-v2"] span.text-l {
    display: inline;
    font-size: inherit;
    line-height: inherit;
}

merch-card[variant="plans-v2"] [slot="callout-content"] {
    margin: 0;
}

merch-card[variant="plans-v2"] [slot='callout-content'] > div > div,
merch-card[variant="plans-v2"] [slot="callout-content"] > p {
    background: transparent;
    padding: 0;
}

merch-card[variant="plans-v2"] [slot="footer"] a {
    line-height: 1.2;
    padding: 9px 18px 10px 18px;
}

merch-card[variant="plans-v2"] [slot="icons"] img {
    width: var(--consonant-merch-card-plans-v2-icon-size);
    height: var(--consonant-merch-card-plans-v2-icon-size);
}

merch-card[variant="plans-v2"] [slot="heading-xs"] {
    font-size: 28px;
    font-weight: 900;
    font-family: var(--consonant-merch-card-plans-v2-font-family);
    line-height: 1.1;
    color: var(--spectrum-gray-800, #2C2C2C);
}

/* Mobile-specific heading-xs styles */
@media ${S} {
    merch-card[variant="plans-v2"] [slot="heading-xs"] {
        font-size: 28px;
        font-weight: 800;
        line-height: 125%;
        letter-spacing: -0.02em;
        vertical-align: middle;
    }
    merch-card[variant="plans-v2"][size="wide"] [slot="heading-xs"] {
        font-size: 16px;
    }
}

/* Subtitle styling for regular cards */
merch-card[variant="plans-v2"] [slot="subtitle"] {
    font-size: 18px;
    font-weight: 700;
    font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
    color: var(--spectrum-gray-800, #2C2C2C);
    line-height: 23px;
}

/* Wide card override */
merch-card[variant="plans-v2"][size="wide"] [slot="subtitle"] {
    font-family: var(--consonant-merch-card-plans-v2-font-family);
    font-size: 52px;
    font-weight: 900;
    line-height: 1.1;
}

merch-card[variant="plans-v2"] [slot="heading-m"] span.price, merch-card[variant="plans-v2"] [slot="heading-m"] p {
    font-size: 20px;
    font-weight: 900;
    font-family: var(--consonant-merch-card-plans-v2-font-family);
    color: var(--spectrum-gray-800, #2C2C2C);
    line-height: 1.1;
}

/* Mobile-specific wide card subtitle styles */
@media ${S} {
    merch-card[variant="plans-v2"][size="wide"] [slot="subtitle"] {
        font-size: 28px;
        font-weight: 900;
        line-height: 1.1;
        letter-spacing: 0px;
    }

    merch-card[variant="plans-v2"] span.price-unit-type,
    merch-card[variant="plans-v2"] [slot="heading-m"] span.price, merch-card[variant="plans-v2"] [slot="heading-m"] p {
        font-size: 28px;
    }
}

merch-card[variant="plans-v2"] [slot="heading-m"] {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
    color: inherit;
}

merch-card[variant="plans-v2"] [slot="heading-m"] span.price.price-strikethrough,
merch-card[variant="plans-v2"] [slot="heading-m"] s {
    font-size: 20px;
    color: #6B6B6B;
    text-decoration: line-through;
    font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
    font-weight: 400;
}

merch-card[variant="plans-v2"] [slot="heading-m"]:has(span[is='inline-price'] + span[is='inline-price']) span[is='inline-price'] {
    display: inline;
    text-decoration: none;
}

merch-card[variant="plans-v2"] [slot="heading-m"] .price-legal {
    font-size: 16px;
    font-weight: 400;
    color: var(--spectrum-gray-600, #6E6E6E);
    line-height: 1.375;
}

merch-card[variant="plans-v2"] [slot="heading-m"] .price-recurrence {
    line-height: 1.4;
}

merch-card[variant="plans-v2"] [slot="heading-m"] .price:not(.price-annual) .price-recurrence:not(.disabled)::after {
    content: ' ';
    white-space: pre;
}

merch-card[variant="plans-v2"] [slot="heading-m"] .price-plan-type,
merch-card[variant="plans-v2"] [slot="heading-m"] span[data-template="planType"] {
    text-transform: unset;
    display: block;
    color: var(--spectrum-gray-700, #505050);
    font-size: 16px;
    font-weight: 400;
    font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
    line-height: 1.4;
}

merch-card[variant="plans-v2"] [slot="promo-text"] {
    font-size: 16px;
    font-weight: 700;
    font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
    color: var(--merch-color-green-promo, #05834E);
    line-height: 1.5;
    margin-bottom: 16px;
}

merch-card[variant="plans-v2"] [slot="promo-text"] a {
    color: inherit;
    text-decoration: underline;
}

merch-card[variant="plans-v2"] [slot="body-xs"] {
    --consonant-merch-card-body-xs-font-size: 18px;
    font-size: 18px;
    font-weight: 400;
    font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
    color: var(--spectrum-gray-700, #505050);
    line-height: 1.4;
}

merch-card[variant="plans-v2"] [slot="quantity-select"] {
    margin-bottom: 16px;
}

merch-card[variant="plans-v2"] [slot="quantity-select"] label {
    display: block;
    font-size: 12px;
    font-weight: 400;
    color: #464646;
    margin-bottom: var(--consonant-merch-spacing-xxs);
}

merch-card[variant="plans-v2"] [slot="quantity-select"] merch-quantity-select {
    --qs-input-height: 32px;
    --qs-button-width: 18px;
    --qs-font-size: 14px;
    --border-color: #909090;
    --border-width: 1px;
    --background-color: #FDFDFD;
    --qs-label-font-size: 12px;
    --qs-label-color: #464646;
    --radius: 4px;
    --button-width: 29px;
    --qs-input-width: 59px;
    --picker-button-border-inline-start: none;
    --label-color: var(--spectrum-gray-700, #4B4B4B);
}

merch-card[variant="plans-v2"] [slot="quantity-select"] merch-quantity-select .item.highlighted {
    background-color: #F6F6F6;
}

merch-card[variant="plans-v2"] [slot="footer"] {}

merch-card[variant="plans-v2"] [slot="footer"] a {
    width: auto;
    min-width: fit-content;
    text-align: center;
    padding: 5px 18px 6px 18px;
    border-radius: 20px;
    font-size: 16px;
    font-weight: 700;
    line-height: 20px;
    text-decoration: none;
    transition: all 0.2s ease-in-out;
}
    background-color: #3B63FB;
    color: #FFFFFF;
    border: 2px solid #3B63FB;
    border-radius: 20px;
    display: inline-flex;
    max-width: fit-content;
merch-card[variant="plans-v2"] [slot="footer"] a.con-button.blue {
    background-color: #1473E6;
    color: #FFFFFF;
    border: 2px solid #1473E6;
    border-radius: 20px;
}

merch-card[variant="plans-v2"] [slot="footer"] a.con-button.blue:hover {
    background-color: #0D66D0;
    border-color: #0D66D0;
}

merch-card[variant="plans-v2"] [slot="footer"] a.con-button.outline {
    background-color: transparent;
    color: #1473E6;
    border: 2px solid #1473E6;
}

merch-card[variant="plans-v2"] [slot="footer"] a.con-button.outline:hover {
    background-color: #F5F5F5;
}


merch-card[variant="plans-v2"] h4 {
    font-size: 18px;
    font-weight: 700;
    font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
    color: var(--spectrum-gray-800, #292929);
    line-height: 22px;
    margin: 0 0 16px 0;
    align-self: flex-start;  /* Explicit alignment for consistent positioning */
}

/* Ensure merch-whats-included container is properly aligned */
merch-card[variant="plans-v2"] merch-whats-included {
    background-color: #FFFFFF;
    align-self: stretch;  /* Full width alignment */
}

merch-card[variant="plans-v2"] ul {
    padding: 0;
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: var(--consonant-merch-spacing-xxs);
}

merch-card[variant="plans-v2"] ul li {
    font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
    color: #292929;
    line-height: 140%;
    display: inline-flex;
    list-style: none;
    padding: var(--consonant-merch-spacing-xxs) 0;
}

merch-card[variant="plans-v2"] ul li::before {
    display: inline-block;
    content: var(--list-checked-icon);
    margin-right: var(--consonant-merch-spacing-xxs);
    vertical-align: middle;
    flex-shrink: 0;
}

merch-card[variant="plans-v2"] .help-text {
    font-size: 12px;
    font-weight: 400;
    color: var(--spectrum-gray-600, #6E6E6E);
    line-height: 1.5;
    margin-top: var(--consonant-merch-spacing-xxs);
}

@media screen and ${S}, ${O} {
    :root {
        --consonant-merch-card-plans-v2-width: 100%;
    }
    merch-card[variant="plans-v2"] {
        width: 100%;
        max-width: var(--consonant-merch-card-plans-v2-width);
        box-sizing: border-box;
    }
}

@media screen and ${x}, ${C}, ${$} {
    :root {
        --consonant-merch-card-plans-v2-width: 276px;
    }
}
collection-container.plans:has(merch-card[variant="plans-v2"]) {
    --merch-card-collection-card-min-height: 273px;
    --merch-card-collection-card-width: var(--consonant-merch-card-plans-v2-width);
    grid-template-columns: auto;
}

merch-card-collection-header.plans {
    --merch-card-collection-header-columns: 1fr fit-content(100%);
    --merch-card-collection-header-areas: "result filter";
}

merch-card-collection.plans:is(.one-merch-cards, .two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="plans-v2"]) {
    --merch-card-collection-card-width: 100%;
    display: grid;
    grid-auto-rows: 1fr;
    align-items: stretch;
}

merch-card-collection.plans merch-card[variant="plans-v2"] {
    width: auto;
    height: 100%;
    display: grid;
    grid-template-rows: 1fr auto;
}

merch-card-collection.plans merch-card[variant="plans-v2"][has-short-description] {
    grid-template-rows: min-content min-content auto;
}

merch-card-collection.plans merch-card[variant="plans-v2"] {
    height: 100%;
    align-self: stretch;
}

merch-card-collection.plans merch-card[variant="plans-v2"] .heading-wrapper {
    align-items: center;
    gap: 12px;
    overflow: visible;
}

merch-card-collection.plans merch-card[variant="plans-v2"] [slot="icons"] {
    align-items: center;
}

merch-card-collection.plans merch-card[variant="plans-v2"] [slot="heading-xs"] {}

merch-card-collection.plans merch-card[variant="plans-v2"] aem-fragment + [slot^="heading-"] {
    margin-top: calc(40px + var(--consonant-merch-spacing-xxs));
}

merch-card-collection.plans merch-card[variant="plans-v2"] [slot="short-description"] strong {
    font-weight: 800;
    font-size: 18px;
}

merch-card[variant="plans-v2"][size="wide"] {
    width: 100%;
    max-width: 635px;
}

merch-card[variant="plans-v2"] .price-divider {
    display: none;
}

merch-card[variant="plans-v2"][size="wide"] .price-divider {
    display: block;
    height: 1px;
    background-color: #E8E8E8;
    margin: 16px 0;
}

merch-card[variant="plans-v2"][size="wide"] .heading-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 0;
}

merch-card[variant="plans-v2"][size="wide"] .heading-wrapper [slot="icons"] {
    margin-bottom: 0;
}

merch-card[variant="plans-v2"][size="wide"] .heading-wrapper [slot="heading-xs"] {
    margin: 0;
}

merch-card[variant="plans-v2"][size="wide"] [slot="body-xs"] {
    margin-bottom: 0;
}

merch-card[variant="plans-v2"][size="wide"] [slot="heading-m"] {
    margin-top: 0;
}

merch-card[variant="plans-v2"][size="wide"] [slot="heading-m"] span[data-template="planType"] {
    font-style: italic;
}

merch-card[variant="plans-v2"][size="wide"] footer {
    align-items: flex-start;
}

merch-card[variant="plans-v2"][size="wide"] footer [slot="heading-m"] {
    order: -1;
    margin-bottom: 16px;
    align-self: flex-start;
}

/* Mobile */
@media screen and ${S} {
    merch-whats-included merch-mnemonic-list,
    merch-whats-included [slot="heading"] {
        width: 100%;
    }

    merch-card[variant="plans-v2"] .spacer {
        display: none;
    }

    merch-card-collection.plans:is(.one-merch-cards, .two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="plans-v2"]) {
        grid-auto-rows: auto;
    }

    merch-card-collection.plans:is(.one-merch-cards, .two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="plans-v2"]) {
        --merch-card-collection-card-width: unset;
    }
}

/* Tablet */
@media screen and ${x} {
    :root {
        --consonant-merch-card-plans-v2-width: 360px;
    }
    merch-card-collection.plans.four-merch-cards:has(merch-card[variant="plans-v2"]) .foreground {
        max-width: unset;
    }
    merch-card-collection.plans:is(.two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="plans-v2"]) {
        grid-template-columns: repeat(2, var(--consonant-merch-card-plans-v2-width));
    }
    merch-card[variant="plans-v2"][size="wide"], merch-card[variant="plans-v2"][size="super-wide"]{
      padding: 55px 47px;
    }
}

/* Desktop */
@media screen and ${C} {
    :root {
        --consonant-merch-card-plans-v2-width: 276px;
    }

    merch-card-collection.plans:is(.three-merch-cards):has(merch-card[variant="plans-v2"]) {
        grid-template-columns: repeat(3, var(--consonant-merch-card-plans-v2-width));
    }

    merch-card-collection.plans:is(.four-merch-cards):has(merch-card[variant="plans-v2"]) {
        grid-template-columns: repeat(4 , var(--consonant-merch-card-plans-v2-width));
    }

    merch-card-collection-header.plans {
        --merch-card-collection-header-columns: fit-content(100%);
        --merch-card-collection-header-areas: "custom";
    }
}

/* Large Desktop */
@media screen and ${$} {
.columns .four-merch-cards.plans:has(merch-card[variant="plans-v2"]) {
    grid-template-columns: repeat(2, var(--consonant-merch-card-plans-v2-width));
  }

}
`;var Mr={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m"},shortDescription:{tag:"p",slot:"short-description"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},addon:!0,secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-red-700-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],whatsIncluded:{tag:"div",slot:"whats-included"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},se=class extends b{constructor(r){super(r),this.adaptForMedia=this.adaptForMedia.bind(this),this.toggleShortDescription=this.toggleShortDescription.bind(this),this.shortDescriptionExpanded=!1,this.syncScheduled=!1}priceOptionsProvider(r,e){let t=Mr.prices.slot;if(r.closest(`[slot="${t}"]`)){if(r.dataset.template===P){e.displayPlanType=this.card?.settings?.displayPlanType??!1;return}(r.dataset.template==="strikethrough"||r.dataset.template==="price")&&(e.displayPerUnit=!1)}}getGlobalCSS(){return eo}adjustSlotPlacement(r,e,t){let{shadowRoot:o}=this.card,n=o.querySelector("footer"),i=o.querySelector(".body"),c=this.card.getAttribute("size");if(!c)return;let s=o.querySelector(`footer slot[name="${r}"]`),l=o.querySelector(`.body slot[name="${r}"]`);if(c.includes("wide")||(n?.classList.remove("wide-footer"),s?.remove()),!!e.includes(c)){if(n?.classList.toggle("wide-footer",k.isDesktopOrUp),!t&&s){if(l)s.remove();else{let m=i.querySelector(`[data-placeholder-for="${r}"]`);m?m.replaceWith(s):i.appendChild(s)}return}if(t&&l){let m=document.createElement("div");m.setAttribute("data-placeholder-for",r),m.classList.add("slot-placeholder"),s||n.prepend(l.cloneNode(!0)),l.replaceWith(m)}}}adaptForMedia(){if(!this.card.closest("merch-card-collection,overlay-trigger,.two-merch-cards,.three-merch-cards,.four-merch-cards,.columns"))return this.card.hasAttribute("size"),void 0;this.adjustSlotPlacement("heading-m",["wide"],!0),this.adjustSlotPlacement("addon",["super-wide"],k.isDesktopOrUp),this.adjustSlotPlacement("callout-content",["super-wide"],k.isDesktopOrUp)}adjustCallout(){let r=this.card.querySelector('[slot="callout-content"] .icon-button');if(!r?.title)return;r.dataset.tooltip=r.title,r.removeAttribute("title"),r.classList.add("hide-tooltip");let e=t=>{t===r?r.classList.toggle("hide-tooltip"):r.classList.add("hide-tooltip")};document.addEventListener("touchstart",t=>{t.preventDefault(),e(t.target)}),document.addEventListener("mouseover",t=>{t.preventDefault(),t.target!==r?r.classList.add("hide-tooltip"):r.classList.remove("hide-tooltip")})}async postCardUpdateHook(){this.card.isConnected&&(this.adaptForMedia(),this.adjustAddon(),this.adjustCallout(),this.updateShortDescriptionVisibility(),this.hasShortDescription?this.card.setAttribute("has-short-description",""):this.card.removeAttribute("has-short-description"),this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook(),window.matchMedia("(min-width: 768px)").matches&&requestAnimationFrame(()=>{this.syncHeights()}))}get mainPrice(){return this.card.querySelector(`[slot="heading-m"] ${y}[data-template="price"]`)}syncHeights(){this.card.getBoundingClientRect().width<=2||this.syncRowHeights([{name:"body",getElement:r=>r.shadowRoot?.querySelector(".body")},{name:"footer",getElement:r=>r.shadowRoot?.querySelector("footer")},{name:"short-description",getElement:r=>r.querySelector('[slot="short-description"]')}])}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let r=this.mainPrice;if(!r)return;let e=r.cloneNode(!0);if(await r.onceSettled(),!r?.options)return;r.options.displayPerUnit&&(r.dataset.displayPerUnit="false"),r.options.displayPlanType&&(r.dataset.displayPlanType="false"),this.card.settings?.displayAnnual&&r.options.displayTax?e.dataset.displayTax="false":r.options.displayTax&&(r.dataset.displayTax="false"),e.setAttribute("data-template","legal"),r.parentNode.insertBefore(e,r.nextSibling),await e.onceSettled()}catch{}}async adjustAddon(){await this.card.updateComplete;let r=this.card.addon;if(!r)return;r.setAttribute("custom-checkbox","");let e=this.mainPrice;if(!e)return;await e.onceSettled?.();let t=e.value?.[0]?.planType;t&&(r.planType=t)}get stockCheckbox(){return this.card.checkboxLabel?X`<label id="stock-checkbox">
                <input type="checkbox" @change=${this.card.toggleStockOffer}></input>
                <span></span>
                ${this.card.checkboxLabel}
            </label>`:Yt}get hasShortDescription(){return!!this.card.querySelector('[slot="short-description"]')}get shortDescriptionLabel(){let r=this.card.querySelector('[slot="short-description"]'),e=r.querySelector("strong, b");if(e?.textContent?.trim())return e.textContent.trim();let t=r.querySelector("h1, h2, h3, h4, h5, h6, p");return t?.textContent?.trim()?t.textContent.trim():r.textContent?.trim().split(`
`)[0].trim()}updateShortDescriptionVisibility(){let r=this.card.querySelector('[slot="short-description"]');if(!r)return;let e=r.querySelector("strong, b, p");e&&(k.isMobile?e.style.display="none":e.style.display="")}toggleShortDescription(){this.shortDescriptionExpanded=!this.shortDescriptionExpanded,this.card.requestUpdate()}get shortDescriptionToggle(){return this.hasShortDescription?k.isMobile?X`
            <div class="short-description-divider"></div>
            <div
                class="short-description-toggle ${this.shortDescriptionExpanded?"expanded":""}"
                @click=${this.toggleShortDescription}
            >
                <span class="toggle-label">${this.shortDescriptionLabel}</span>
                <span
                    class="toggle-icon ${this.shortDescriptionExpanded?"expanded":""}"
                ></span>
            </div>
            <div
                class="short-description-content ${this.shortDescriptionExpanded?"expanded":""}"
            >
                <slot name="short-description"></slot>
            </div>
        `:X`
                <div class="short-description-content desktop">
                    <slot name="short-description"></slot>
                </div>
            `:Yt}get icons(){return this.card.querySelector('[slot="icons"]')||this.card.getAttribute("id")?X`<slot name="icons"></slot>`:Yt}get secureLabelFooter(){return X`<footer>
            ${this.secureLabel}<slot name="quantity-select"></slot
            ><slot name="footer"></slot>
        </footer>`}connectedCallbackHook(){this.handleMediaChange=()=>{this.adaptForMedia(),this.updateShortDescriptionVisibility(),this.card.requestUpdate(),window.matchMedia("(min-width: 768px)").matches&&requestAnimationFrame(()=>{this.syncHeights()})},k.matchMobile.addEventListener("change",this.handleMediaChange),k.matchDesktopOrUp.addEventListener("change",this.handleMediaChange),this.handleResize=()=>{this._resizeFrame&&cancelAnimationFrame(this._resizeFrame),this._resizeFrame=requestAnimationFrame(()=>{this._resizeFrame=null,window.matchMedia("(min-width: 768px)").matches&&this.syncHeights()})},window.addEventListener("resize",this.handleResize),this.visibilityObserver=new IntersectionObserver(([r])=>{r.boundingClientRect.height!==0&&r.isIntersecting&&(window.matchMedia("(min-width: 768px)").matches&&requestAnimationFrame(()=>{this.syncHeights()}),this.visibilityObserver.disconnect())}),this.visibilityObserver.observe(this.card)}disconnectedCallbackHook(){k.matchMobile.removeEventListener("change",this.handleMediaChange),k.matchDesktopOrUp.removeEventListener("change",this.handleMediaChange),this.handleResize&&(window.removeEventListener("resize",this.handleResize),this.handleResize=null),this._resizeFrame&&(cancelAnimationFrame(this._resizeFrame),this._resizeFrame=null),this.visibilityObserver?.disconnect()}renderLayout(){let e=this.card.getAttribute("size")==="wide";return X` ${this.badge}
            <div class="body">
                ${e?X`
                          <div class="heading-wrapper wide">
                              ${this.icons}
                              <slot name="heading-xs"></slot>
                          </div>
                          <slot name="subtitle"></slot>
                          <slot name="body-xs"></slot>
                          ${this.stockCheckbox}
                          <slot name="addon"></slot>
                          <slot name="badge"></slot>
                          <div class="price-divider"></div>
                          <slot name="heading-m"></slot>
                      `:X`
                          <div class="heading-wrapper">
                              ${this.icons}
                              <div class="heading-xs-wrapper">
                                  <slot name="heading-xs"></slot>
                                  <slot name="subtitle"></slot>
                              </div>
                          </div>
                          <slot name="heading-m"></slot>
                          <slot name="body-xs"></slot>
                          ${this.stockCheckbox}
                          <slot name="addon"></slot>
                          <slot name="badge"></slot>
                      `}
            </div>
            ${this.secureLabelFooter} ${this.shortDescriptionToggle}
            <slot></slot>`}};d(se,"variantStyle",ii`
        :host([variant='plans-v2']) {
            display: flex;
            flex-direction: column;
            min-height: 273px;
            position: relative;
            background-color: var(--spectrum-gray-50, #ffffff);
            border-radius: var(
                --consonant-merch-card-plans-v2-border-radius,
                8px
            );
            overflow: hidden;
            font-weight: 400;
            box-sizing: border-box;
            --consonant-merch-card-plans-v2-font-family: 'adobe-clean-display',
                'Adobe Clean', sans-serif;
            --merch-card-plans-v2-min-width: 220px;
            --merch-card-plans-v2-padding: 24px 24px;
            --merch-color-green-promo: #05834e;
            --secure-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23505050' viewBox='0 0 12 15'%3E%3Cpath d='M11.5 6H11V5A5 5 0 1 0 1 5v1H.5a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5ZM3 5a3 3 0 1 1 6 0v1H3Zm4 6.111V12.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1.389a1.5 1.5 0 1 1 2 0Z'/%3E%3C/svg%3E");
            --list-checked-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' width='20' height='20'%3E%3Cpath fill='%23222222' d='M15.656,3.8625l-.7275-.5665a.5.5,0,0,0-.7.0875L7.411,12.1415,4.0875,8.8355a.5.5,0,0,0-.707,0L2.718,9.5a.5.5,0,0,0,0,.707l4.463,4.45a.5.5,0,0,0,.75-.0465L15.7435,4.564A.5.5,0,0,0,15.656,3.8625Z'%3E%3C/path%3E%3C/svg%3E");
        }

        :host([variant='plans-v2']) .slot-placeholder {
            display: none;
        }

        :host([variant='plans-v2']) .body {
            --merch-card-plans-v2-body-min-height: calc(
                var(--consonant-merch-card-plans-v2-body-height, 0px) - (24px)
            );
            display: flex;
            flex-direction: column;
            min-width: var(--merch-card-plans-v2-min-width);
            padding: var(--merch-card-plans-v2-padding);
            padding-bottom: 0;
            flex: 0 0 auto;
            gap: 12px;
            min-height: var(--merch-card-plans-v2-body-min-height, auto);
            width: 220px;
        }

        :host([variant='plans-v2'][size]) .body {
            width: auto;
        }

        :host([variant='plans-v2']) footer {
            padding: var(--merch-card-plans-v2-padding);
            min-height: var(
                --consonant-merch-card-plans-v2-footer-height,
                auto
            );
            flex-direction: column;
            align-items: flex-start;
        }

        :host([variant='plans-v2']) slot[name='subtitle'] {
            display: var(--merch-card-plans-v2-subtitle-display);
            min-height: 18px;
            margin-top: 4px;
            margin-bottom: -8px;
        }

        :host([variant='plans-v2']) ::slotted([slot='subtitle']) {
            font-size: 14px;
            font-weight: 400;
            color: var(--spectrum-gray-700, #505050);
            line-height: 1.4;
        }

        :host([variant='plans-v2']) ::slotted([slot='heading-xs']) {
            font-size: 32px;
            font-weight: 900;
            font-family: var(
                --consonant-merch-card-plans-v2-font-family,
                'Adobe Clean Display',
                sans-serif
            );
            line-height: 1.2;
            color: var(--spectrum-gray-800, #2c2c2c);
            margin: 0 0 16px 0;
            min-height: var(--merch-card-plans-v2-heading-min-height);
            max-width: var(--consonant-merch-card-heading-xs-max-width, 100%);
        }

        :host([variant='plans-v2']) slot[name='icons'] {
            gap: 3.5px;
            mask-image: linear-gradient(
                to right,
                rgba(0, 0, 0, 1) 0%,
                rgba(0, 0, 0, 1) 12.5%,
                rgba(0, 0, 0, 0.8) 25%,
                rgba(0, 0, 0, 0.6) 37.5%,
                rgba(0, 0, 0, 0.4) 50%,
                rgba(0, 0, 0, 0.2) 62.5%,
                rgba(0, 0, 0, 0.05) 75%,
                rgba(0, 0, 0, 0.03) 87.5%,
                rgba(0, 0, 0, 0) 100%
            );
            -webkit-mask-image: linear-gradient(
                to right,
                rgba(0, 0, 0, 1) 0%,
                rgba(0, 0, 0, 1) 12.5%,
                rgba(0, 0, 0, 0.8) 25%,
                rgba(0, 0, 0, 0.6) 37.5%,
                rgba(0, 0, 0, 0.4) 50%,
                rgba(0, 0, 0, 0.2) 62.5%,
                rgba(0, 0, 0, 0.05) 75%,
                rgba(0, 0, 0, 0.03) 87.5%,
                rgba(0, 0, 0, 0) 100%
            );
        }

        :host([variant='plans-v2']) ::slotted([slot='icons']) {
            display: flex;
        }

        :host([variant='plans-v2']) ::slotted([slot='heading-m']) {
            margin: 0 0 8px 0;
            font-size: 28px;
            font-weight: 800;
            font-family: var(
                --consonant-merch-card-plans-v2-font-family,
                'Adobe Clean Display',
                sans-serif
            );
            line-height: 1.15;
            color: var(--spectrum-gray-800, #2c2c2c);
        }

        :host([variant='plans-v2'])
            ::slotted([slot='heading-m'])
            span[data-template='legal'] {
            font-size: 20px;
            color: var(--spectrum-gray-700, #6b6b6b);
        }

        :host([variant='plans-v2']) ::slotted([slot='promo-text']) {
            font-size: 16px;
            font-weight: 700;
            color: var(--merch-color-green-promo, #05834e);
            line-height: 1.5;
            margin: 0 0 16px 0;
        }

        :host([variant='plans-v2']) ::slotted([slot='body-xs']) {
            font-size: 18px;
            font-weight: 400;
            font-family: 'Adobe Clean', sans-serif;
            color: var(--spectrum-gray-700, #505050);
            line-height: 1.4;
            margin: 0 0 16px 0;
        }

        :host([variant='plans-v2']) ::slotted([slot='quantity-select']) {
            margin: 0 0 16px 0;
        }

        :host([variant='plans-v2']) .spacer {
            flex: 1 1 auto;
        }

        :host([variant='plans-v2']) ::slotted([slot='whats-included']) {
            padding-top: 24px;
            padding-bottom: 24px;
            border-top: 1px solid #e8e8e8;
        }

        :host([variant='plans-v2']) ::slotted([slot='addon']) {
            margin-top: auto;
            padding-top: 8px;
        }

        :host([variant='plans-v2']) footer ::slotted([slot='addon']) {
            margin: 0;
            padding: 0;
        }

        :host([variant='plans-v2']) .wide-footer #stock-checkbox {
            margin-top: 0;
        }

        :host([variant='plans-v2']) #stock-checkbox {
            margin-top: 8px;
            gap: 9px;
            color: rgb(34, 34, 34);
            line-height: var(--consonant-merch-card-detail-xs-line-height);
            padding-top: 4px;
            padding-bottom: 5px;
        }

        :host([variant='plans-v2']) #stock-checkbox > span {
            border: 2px solid rgb(109, 109, 109);
            width: 12px;
            height: 12px;
        }

        :host([variant='plans-v2']) .secure-transaction-label {
            color: rgb(80, 80, 80);
            line-height: var(--consonant-merch-card-detail-xs-line-height);
        }

        :host([variant='plans-v2']) footer ::slotted(a) {
            display: block;
            width: 100%;
            text-align: center;
            margin-bottom: 12px;
        }

        :host([variant='plans-v2']) footer ::slotted(a:last-child) {
            margin-bottom: 0;
        }

        :host([variant='plans-v2']) .short-description-divider {
            height: 1px;
            background-color: var(
                --consonant-merch-card-plans-v2-divider-color,
                #e8e8e8
            );
            margin: 0;
        }

        :host([variant='plans-v2']) .short-description-toggle {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            padding: 16px 32px;
            cursor: pointer;
            background-color: var(
                --consonant-merch-card-plans-v2-toggle-background-color,
                #f8f8f8
            );
            transition: background-color 0.2s ease;
            border-bottom-left-radius: var(
                --consonant-merch-card-plans-v2-border-radius
            );
            border-bottom-right-radius: var(
                --consonant-merch-card-plans-v2-border-radius
            );
        }

        :host([variant='plans-v2']) .short-description-toggle .toggle-label {
            font-size: 18px;
            font-weight: 700;
            font-family: 'Adobe Clean', sans-serif;
            color: var(
                --consonant-merch-card-plans-v2-toggle-label-color,
                #292929
            );
            text-align: left;
            flex: 1;
            line-height: 22px;
        }

        :host([variant='plans-v2']) .short-description-toggle .toggle-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            flex-shrink: 0;
            background-image: url('data:image/svg+xml,<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="12" fill="%23F8F8F8"/><path d="M14 26C7.38258 26 2 20.6174 2 14C2 7.38258 7.38258 2 14 2C20.6174 2 26 7.38258 26 14C26 20.6174 20.6174 26 14 26ZM14 4.05714C8.51696 4.05714 4.05714 8.51696 4.05714 14C4.05714 19.483 8.51696 23.9429 14 23.9429C19.483 23.9429 23.9429 19.483 23.9429 14C23.9429 8.51696 19.483 4.05714 14 4.05714Z" fill="%23292929"/><path d="M18.5484 12.9484H15.0484V9.44844C15.0484 8.86875 14.5781 8.39844 13.9984 8.39844C13.4188 8.39844 12.9484 8.86875 12.9484 9.44844V12.9484H9.44844C8.86875 12.9484 8.39844 13.4188 8.39844 13.9984C8.39844 14.5781 8.86875 15.0484 9.44844 15.0484H12.9484V18.5484C12.9484 19.1281 13.4188 19.5984 13.9984 19.5984C14.5781 19.5984 15.0484 19.1281 15.0484 18.5484V15.0484H18.5484C19.1281 15.0484 19.5984 14.5781 19.5984 13.9984C19.5984 13.4188 19.1281 12.9484 18.5484 12.9484Z" fill="%23292929"/></svg>');
            background-size: 28px 28px;
            background-position: center;
            background-repeat: no-repeat;
            transition: background-image 0.3s ease;
        }

        :host([variant='plans-v2'])
            .short-description-toggle
            .toggle-icon.expanded {
            background-image: url('data:image/svg+xml,<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="12" fill="%23292929"/><path d="M14 26C7.38258 26 2 20.6174 2 14C2 7.38258 7.38258 2 14 2C20.6174 2 26 7.38258 26 14C26 20.6174 20.6174 26 14 26ZM14 4.05714C8.51696 4.05714 4.05714 8.51696 4.05714 14C4.05714 19.483 8.51696 23.9429 14 23.9429C19.483 23.9429 23.9429 19.483 23.9429 14C23.9429 8.51696 19.483 4.05714 14 4.05714Z" fill="%23292929"/><path d="M9 14L19 14" stroke="%23F8F8F8" stroke-width="2" stroke-linecap="round"/></svg>');
        }

        :host([variant='plans-v2']) .short-description-content {
            max-height: 0;
            overflow: hidden;
            transition:
                max-height 0.3s ease,
                padding 0.3s ease;
            padding: 0 32px;
            background-color: #ffffff;
        }

        :host([variant='plans-v2']) .short-description-content.expanded {
            max-height: 500px;
            padding: 24px 32px;
            border-bottom-right-radius: 16px;
            border-bottom-left-radius: 16px;
        }

        :host([variant='plans-v2']) .short-description-content.desktop {
            max-height: none;
            overflow: visible;
            padding: 26px 24px;
            transition: none;
            border-top: 1px solid #e9e9e9;
            min-height: var(
                --consonant-merch-card-plans-v2-short-description-height,
                auto
            );
            background-color: #ffffff;
            border-bottom-left-radius: var(
                --consonant-merch-card-plans-v2-border-radius
            );
            border-bottom-right-radius: var(
                --consonant-merch-card-plans-v2-border-radius
            );
            width: 226px;
        }

        :host([variant='plans-v2'])
            .short-description-content
            ::slotted([slot='short-description']) {
            font-size: 16px;
            font-weight: 400;
            font-family: 'Adobe Clean', sans-serif;
            color: #292929;
            line-height: 1.4;
            margin: 0;
        }

        :host([variant='plans-v2'][border-color='spectrum-yellow-300-plans']) {
            border-color: #ffd947;
        }

        :host([variant='plans-v2'][border-color='spectrum-gray-300-plans']) {
            border-color: #dadada;
        }

        :host([variant='plans-v2'][border-color='spectrum-green-900-plans']) {
            border-color: #05834e;
        }

        :host([variant='plans-v2'][border-color='spectrum-red-700-plans']) {
            border-color: #eb1000;
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
        }

        :host([variant='plans-v2'])
            ::slotted([slot='badge'].spectrum-red-700-plans) {
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
        }

        :host([variant='plans-v2'])
            ::slotted([slot='badge'].spectrum-yellow-300-plans),
        :host([variant='plans-v2']) #badge.spectrum-yellow-300-plans {
            background-color: #ffd947;
            color: #2c2c2c;
        }

        :host([variant='plans-v2'])
            ::slotted([slot='badge'].spectrum-gray-300-plans),
        :host([variant='plans-v2']) #badge.spectrum-gray-300-plans {
            background-color: #dadada;
            color: #2c2c2c;
        }

        :host([variant='plans-v2'])
            ::slotted([slot='badge'].spectrum-gray-700-plans),
        :host([variant='plans-v2']) #badge.spectrum-gray-700-plans {
            background-color: #4b4b4b;
            color: #ffffff;
        }

        :host([variant='plans-v2'])
            ::slotted([slot='badge'].spectrum-green-900-plans),
        :host([variant='plans-v2']) #badge.spectrum-green-900-plans {
            background-color: #05834e;
            color: #ffffff;
        }

        :host([variant='plans-v2'])
            ::slotted([slot='badge'].spectrum-red-700-plans),
        :host([variant='plans-v2']) #badge.spectrum-red-700-plans {
            background-color: #eb1000;
            color: #ffffff;
        }

        :host([variant='plans-v2']) .price-divider {
            display: none;
        }

        :host([variant='plans-v2']) .heading-wrapper {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        :host([variant='plans-v2'][size='wide']) {
            width: 100%;
            max-width: 768px;
        }

        :host([variant='plans-v2'][size='wide']) .heading-wrapper.wide {
            flex-direction: row;
            align-items: center;
            gap: 8px;
            margin-bottom: 0;
        }

        :host([variant='plans-v2'][size='wide'])
            .heading-wrapper.wide
            slot[name='icons'] {
            margin-bottom: 0;
            mask-image: none;
            -webkit-mask-image: none;
            flex-shrink: 0;
        }

        :host([variant='plans-v2'][size='wide'])
            .heading-wrapper.wide
            ::slotted([slot='icons']) {
            margin-bottom: 0;
        }

        :host([variant='plans-v2'][size='wide'])
            .heading-wrapper.wide
            ::slotted([slot='heading-xs']) {
            margin: 0;
            font-size: 27px;
            font-weight: 800;
            line-height: 1.25;
            white-space: nowrap;
        }

        :host([variant='plans-v2'][size='wide']) slot[name='subtitle'] {
            display: block;
            margin-top: 0;
            margin-bottom: 12px;
        }

        :host([variant='plans-v2'][size='wide']) ::slotted([slot='subtitle']) {
            font-family: var(
                --consonant-merch-card-plans-v2-font-family,
                'Adobe Clean Display',
                'Adobe Clean',
                sans-serif
            );
            font-size: 52px;
            font-weight: 900;
            line-height: 1.1;
            color: var(--spectrum-gray-800, #2c2c2c);
        }

        :host([variant='plans-v2'][size='wide']) .price-divider {
            display: block;
            height: 4px;
            background-color: #e8e8e8;
            margin: 24px 0;
            width: 100%;
        }

        :host([variant='plans-v2'][size='wide']) ::slotted([slot='body-xs']) {
            margin-bottom: 0;
        }

        :host([variant='plans-v2'][size='wide']) ::slotted([slot='heading-m']) {
            margin-top: 0;
        }

        :host([variant='plans-v2'][size='wide']) footer {
            justify-content: flex-start;
            flex-direction: column;
            align-items: flex-start;
        }

        :host([variant='plans-v2'][size='wide'])
            footer
            ::slotted([slot='heading-m']) {
            order: -1;
            margin-bottom: 16px;
            align-self: flex-start;
        }

        :host([variant='plans-v2'][size='wide']) footer ::slotted(a) {
            width: auto;
            min-width: 150px;
            margin-right: 12px;
            margin-bottom: 0;
        }

        :host([variant='plans-v2'][size='wide'])
            footer
            ::slotted(a:last-child) {
            margin-right: 0;
        }

        @media ${to(S)}, ${to(O)} {
            :host([variant='plans-v2']) {
                --merch-card-plans-v2-padding: 26px 16px;
            }

            :host([variant='plans-v2']) .short-description-toggle {
                padding: 16px;
            }

            :host([variant='plans-v2']) .short-description-toggle.expanded {
                background-color: var(
                    --consonant-merch-card-plans-v2-toggle-expanded-background-color,
                    #ffffff
                );
            }

            :host([variant='plans-v2']) .short-description-content {
                padding: 0 16px;
                width: auto !important;
            }

            :host([variant='plans-v2']) .short-description-content.expanded {
                padding: 24px 16px;
            }

            :host([variant='plans-v2'][size='wide']) .body {
                padding: 16px;
                width: auto;
            }

            :host([variant='plans-v2']) .body {
                width: auto;
            }
        }

        /* Keep short-description section white in dark mode */
        :host-context(.dark)
            :host([variant='plans-v2'])
            .short-description-content {
            background-color: #ffffff;
            border-bottom-left-radius: var(
                --consonant-merch-card-plans-v2-border-radius
            );
            border-bottom-right-radius: var(
                --consonant-merch-card-plans-v2-border-radius
            );
        }

        :host-context(.dark)
            :host([variant='plans-v2'])
            .short-description-content
            ::slotted([slot='short-description']) {
            color: #292929;
        }

        :host-context(.dark)
            :host([variant='plans-v2'])
            .short-description-toggle {
            background-color: #ffffff;
        }

        :host-context(.dark)
            :host([variant='plans-v2'])
            .short-description-toggle
            .toggle-label {
            color: #292929;
        }
    `),d(se,"collectionOptions",{customHeaderArea:r=>r.sidenav?X`<slot name="resultsText"></slot>`:Yt,headerVisibility:{search:!1,sort:!1,result:["mobile","tablet"],custom:["desktop"]},onSidenavAttached:r=>{let e=()=>{let t=r.querySelectorAll("merch-card");if(t.forEach(n=>{n.hasAttribute("data-size")&&(n.setAttribute("size",n.getAttribute("data-size")),n.removeAttribute("data-size"))}),!k.isDesktop)return;let o=0;t.forEach(n=>{if(n.style.display==="none")return;let i=n.getAttribute("size"),c=i==="wide"?2:i==="super-wide"?3:1;c===2&&o%3===2&&(n.setAttribute("data-size",i),n.removeAttribute("size"),c=1),o+=c})};k.matchDesktop.addEventListener("change",e),r.addEventListener(Pe,e),r.onUnmount.push(()=>{k.matchDesktop.removeEventListener("change",e),r.removeEventListener(Pe,e)})}});import{html as K,css as li,nothing as ye,unsafeCSS as Et}from"./lit-all.min.js";var ci=':not(merch-card-collection):has(merch-card[variant="pro"]):not(:has(merch-card:not([variant="pro"]), merch-card[size="edu"], merch-card-collection))',j=(a,r="")=>a.map(e=>`.${e}${ci}${r}`).join(`,
`),wt=["one-merch-card","two-merch-cards","three-merch-cards","four-merch-cards"],si=wt.slice(1),Rr=wt.slice(2),ro=`
:root {
    --consonant-merch-card-pro-font-family-regular: 'Adobe Clean', adobe-clean, sans-serif;
    --consonant-merch-card-pro-font-family-display: 'Adobe Clean Display', 'adobe-clean-display', sans-serif;
    --consonant-merch-card-pro-max-width: 394px;
    --consonant-merch-card-pro-2up-max-width: 596px;
    /* Surface colors pinned to the Figma s2a tokens (background-default /
       background-subtle). Deliberately NOT var(--spectrum-gray-*): inside
       Studio an <sp-theme system="spectrum-two"> defines those, and S2's
       gray-100 (#e9e9e9) / gray-50 (#f8f8f8) are each one step grayer than
       the design, tinting every card surface. */
    --consonant-merch-card-pro-bg-default: #fff;
    --consonant-merch-card-pro-bg-subtle: #f8f8f8;
    --consonant-merch-card-pro-text-color: #000;
    --consonant-merch-card-pro-text-muted-color: #000000a3;
    --consonant-merch-card-pro-text-inverse-color: #fff;
    --consonant-merch-card-pro-cta-accent-color: #3b63fb;
    --consonant-merch-card-pro-cta-accent-hover-color: #274dea;
    --consonant-merch-card-pro-cta-outline-hover-color: #00000014;
    --consonant-merch-card-pro-divider-color: #0000001f;
}

/* The Milo .collection-container is itself a min-content grid; a pro
   collection's minmax(0, 1fr) tracks have zero min-content, so it would collapse
   to ~0 width inside it. Let the collection take the full container width \u2014 it
   caps and centres itself via the grid rules below. */
.collection-container.plans:has(merch-card[variant="pro"]) {
    display: block;
}

/* Standalone cards retain their cap; 3+ card collections fill their tracks
   at MD and XL below. */
merch-card[variant="pro"] {
    width: 100%;
    max-width: var(--consonant-merch-card-pro-max-width);
    overflow: visible;
    position: relative;
}

/* EDU (Wide): standalone two-column card, wider than the default grid track.
   Internal row split + mobile stack live in the shadow variantStyle. */
merch-card[variant="pro"][size='edu'] {
    max-width: 1068px;
}

/* Milo paints links Spectrum blue, which fights the card. Take the surrounding
   text color instead and let the underline do the work. */
merch-card[variant="pro"]
    :is(
        [slot="body-xs"],
        [slot="whats-included"],
        [slot="legal-text"],
        [slot="promo-text"]
    )
    a {
    color: inherit;
}

/* Callout banner link \u2014 inherits dark text color + weight, just underlined.
   Force display:inline so the link flows with the surrounding text and
   doesn't get broken onto its own line by any inherited inline-block. */
merch-card[variant="pro"] [slot="callout-content"] a {
    display: inline;
    color: inherit;
    font-weight: inherit;
    text-decoration: underline;
    white-space: normal;
}

/* The callout sits flat on the license-zone (Figma 1098:30779) \u2014 drop the
   global gray "pill" (background/radius/fit-content) that other variants use,
   so it's full-width caption text on the zone background instead of a box. */
merch-card[variant="pro"] [slot="callout-content"] > p,
merch-card[variant="pro"] [slot="callout-content"] > div > div {
    background: transparent;
    border-radius: 0;
    padding: 0;
    width: auto;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0;
}

merch-card[variant="pro"] [slot="callout-content"] > div {
    margin: 0;
}

/* AI Assistant add-on row \u2014 Figma 1098:33812 / 1098:33951.
   Themes the real <merch-addon> injected at slot="addon". The purple frame
   and trailing sparkle live on the variant's .add-on wrapper (see variantStyle);
   here we size/colour the merch-addon checkbox + label via its custom props. */
merch-card[variant="pro"] merch-addon[slot="addon"] {
    flex: 1 0 0;
    min-width: 0;
    /* merch-addon's flex layout lets the checkbox shrink, so a long label
       squashes it. Two fixed grid tracks hold it at 20px. */
    display: grid;
    grid-template-columns: var(--merch-addon-checkbox-size) minmax(0, 1fr);
    --merch-addon-gap: 8px;
    --merch-addon-align: center;
    /* Checkbox per Figma 1098:33812 \u2014 the rounded border, and (when checked)
       checkmark use the exact Spectrum 2 S2_Icon_CheckBox_20_N paths. Filled
       solid black (MWPW-198038: the AI gradient failed 3:1 non-text contrast).
       The CSS border is dropped; the ring lives in the SVG. */
    --merch-addon-checkbox-size: 20px;
    --merch-addon-checkbox-border: none;
    --merch-addon-checkbox-radius: 0;
    --merch-addon-checkbox-bg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M15.25 18H4.75C3.2334 18 2 16.7666 2 15.25V4.75C2 3.2334 3.2334 2 4.75 2H15.25C16.7666 2 18 3.2334 18 4.75V15.25C18 16.7666 16.7666 18 15.25 18ZM4.75 3.5C4.06055 3.5 3.5 4.06055 3.5 4.75V15.25C3.5 15.9395 4.06055 16.5 4.75 16.5H15.25C15.9395 16.5 16.5 15.9395 16.5 15.25V4.75C16.5 4.06055 15.9395 3.5 15.25 3.5H4.75Z' fill='%23000000'/%3E%3C/svg%3E") center / contain no-repeat;
    --merch-addon-checkbox-checked-bg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M14.4502 5.64453C14.1143 5.39844 13.6465 5.47363 13.4014 5.80664L8.86231 12.0042L7.19922 9.86328C6.94531 9.53711 6.47656 9.47754 6.14649 9.73047C5.81934 9.98535 5.75977 10.4561 6.01368 10.7832L8.28712 13.71C8.3047 13.7327 8.33131 13.7414 8.35108 13.7615C8.38062 13.7922 8.40088 13.8293 8.43653 13.8555C8.4629 13.8746 8.49268 13.8829 8.52051 13.8982C8.54444 13.9116 8.5669 13.9242 8.59229 13.9347C8.68531 13.9736 8.78125 14 8.87891 14C8.87915 14 8.87964 13.9998 8.87989 13.9998C8.88038 13.9998 8.88038 14 8.88087 14C8.98146 14 9.08058 13.9719 9.17579 13.9306C9.20265 13.919 9.22559 13.905 9.25099 13.8904C9.28029 13.8734 9.31227 13.864 9.33986 13.8428C9.37526 13.8152 9.39504 13.7771 9.42409 13.7449C9.44264 13.7246 9.46877 13.7159 9.48537 13.6933L14.6123 6.69335C14.8565 6.35937 14.7842 5.88965 14.4502 5.64453Z' fill='%23000000'/%3E%3Cpath d='M15.25 18H4.75C3.2334 18 2 16.7666 2 15.25V4.75C2 3.2334 3.2334 2 4.75 2H15.25C16.7666 2 18 3.2334 18 4.75V15.25C18 16.7666 16.7666 18 15.25 18ZM4.75 3.5C4.06055 3.5 3.5 4.06055 3.5 4.75V15.25C3.5 15.9395 4.06055 16.5 4.75 16.5H15.25C15.9395 16.5 16.5 15.9395 16.5 15.25V4.75C16.5 4.06055 15.9395 3.5 15.25 3.5H4.75Z' fill='%23000000'/%3E%3C/svg%3E") center / contain;
    --merch-addon-checkbox-checked-bg-color: transparent;
    --merch-addon-checkbox-checked-color: transparent;
    /* merch-addon declares no tracking on its shadow label, so it inherits from
       this host \u2014 pin it to the s2a label token (0) rather than the page's. */
    letter-spacing: 0;
    --merch-addon-label-size: 14px;
    --merch-addon-label-line-height: 18px;
    --merch-addon-label-weight: 700;
    --merch-addon-label-color: var(--consonant-merch-card-pro-text-color);
}

/* Grey add-on style (MWPW-208925) \u2014 the frame drops to a flat #e4e4e4 border
   in the shadow variantStyle; here the checkbox itself swaps the AI-gradient
   icon (which bakes its own border into the SVG, hence border:none above)
   for the flat black-bordered checkbox used elsewhere in the card set (see
   plans.css.js), sized down to 16px per spec since it no longer needs the
   larger AI-gradient ring. */
merch-card[variant="pro"] merch-addon[slot="addon"][background="grey"] {
    --merch-addon-checkbox-size: 16px;
    --merch-addon-checkbox-border: 2px solid #000;
    --merch-addon-checkbox-radius: 4px;
    --merch-addon-checkbox-bg: transparent;
    --merch-addon-checkbox-checked-bg: var(--checkmark-icon);
    --merch-addon-checkbox-checked-bg-color: #000;
    --merch-addon-checkbox-checked-color: #000;
}

/* merch-addon stops styling its label once the paragraph picks up a
   data-plan-type, so do it here. No display \u2014 that is what switches plan types. */
merch-card[variant="pro"] merch-addon[slot="addon"] p {
    margin: 0;
    color: var(--consonant-merch-card-pro-text-color);
    font-family: var(--consonant-merch-card-pro-font-family-regular);
    font-size: 14px;
    font-weight: 700;
    line-height: 18px;
    letter-spacing: 0;
    cursor: pointer;
}

/* Light-DOM color overrides \u2014 beat global promo/legal styling */
merch-card[variant="pro"] [slot="promo-text"] {
    color: var(--consonant-merch-card-pro-text-muted-color);
    font-family: var(--consonant-merch-card-pro-font-family-regular);
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0;
    margin: 0;
}

/* Light-DOM typography for heading-xs / body-xs \u2014 must live here (not in
   shadow ::slotted) so it beats the global merch-card [slot="heading-xs"]
   rule. Per CSS Scoping, light-DOM rules outrank shadow ::slotted regardless
   of specificity, so the variant's slotted rules cannot win on their own. */
merch-card[variant="pro"] [slot="heading-xs"] {
    margin: 0;
    font-family: var(--consonant-merch-card-pro-font-family-display);
    font-weight: 900;
    font-size: 24px;
    line-height: 24px;
    letter-spacing: -0.48px;
    color: var(--consonant-merch-card-pro-text-color);
}

merch-card[variant="pro"] [slot="body-xs"] {
    margin: 0;
    font-family: var(--consonant-merch-card-pro-font-family-regular);
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0;
    color: var(--consonant-merch-card-pro-text-color);
}

merch-card[variant="pro"] .price-plan-type .icon-button {
    width: 18px;
    height: 18px;
}

/* Title / description fields are RTE \u2014 authors may save <h3>Title</h3> or
   <div><p>desc</p></div>, which the AEM mapping then wraps again. Make any
   inner block descendant inherit the outer slot styles so the visible text
   uses the variant typography instead of UA defaults. */
merch-card[variant="pro"] [slot="heading-xs"] :is(h1, h2, h3, h4, h5, h6, p, div, span),
merch-card[variant="pro"] [slot="body-xs"] :is(h1, h2, h3, h4, h5, h6, p, div, span) {
    margin: 0;
    font: inherit;
    color: inherit;
    letter-spacing: inherit;
}

/* Rich whats-included styling: section title + bullet items + dividers */
merch-card[variant="pro"] [slot="whats-included"] {
    font-family: var(--consonant-merch-card-pro-font-family-regular);
}

/* The authored label only feeds the shadow-DOM toggle button text; never
   show it inside the features zone itself. */
merch-card[variant="pro"] [slot="whats-included"] .whats-included-label {
    display: none;
}

/* EDU whats-included TITLE \u2014 two states: small (\u22641279) 20/20, desktop
   (\u22651280) 36/32. Figma 4375:120499 (small) / 4375:120476 (desktop). */
merch-card[variant="pro"][size='edu'] [slot="whats-included"] .whats-included-title {
    display: block;
    color: inherit;
    font-family: var(--consonant-merch-card-pro-font-family-display);
    font-size: 20px;
    font-style: normal;
    font-weight: 900;
    line-height: 20px;
    letter-spacing: -0.48px;
}

/* EDU card title (heading-xs): 18/20 up to tablet, 24/24 on desktop
   (Figma 4375:120499 / 4375:120476). Edu-scoped so grid pro cards keep 24. */
merch-card[variant="pro"][size='edu'] [slot="heading-xs"] {
    font-size: 18px;
    line-height: 20px;
}

@media screen and ${re} {
    merch-card[variant="pro"][size='edu'] [slot="whats-included"] .whats-included-title {
        font-size: 36px;
        line-height: 32px;
        letter-spacing: -1px;
    }
    merch-card[variant="pro"][size='edu'] [slot="heading-xs"] {
        font-size: 24px;
        line-height: 24px;
    }
}

/* EDU sub-label "What's included:" (Figma 4375:120476, 16/20/700). The base
   rule hides .whats-included-label; edu shows it 24px below the title. */
merch-card[variant="pro"][size='edu'] [slot="whats-included"] .whats-included-label {
    display: block;
    color: inherit;
    font-family: var(--consonant-merch-card-pro-font-family-regular);
    font-size: 16px;
    font-weight: 700;
    line-height: 20px;
    letter-spacing: 0;
}

/* EDU eligibility disclaimer, resolved server-side ({{edu-disclaimer}}) and
   appended after the feature list by pro.js, hidden via the hideEduDisclaimer
   setting (MWPW-202318). Figma 4375:120476: 12/16 legal text. Muted token so
   it flips with the dark theme; the black-border frame overrides to white. */
merch-card[variant="pro"][size='edu'] [slot="whats-included"] .whats-included-disclaimer {
    color: var(--consonant-merch-card-pro-text-muted-color, #000000a3);
    font-family: var(--consonant-merch-card-pro-font-family-regular);
    font-size: 12px;
    font-weight: 400;
    line-height: 16px;
    letter-spacing: 0;
    margin-top: 24px;
}

/* {{edu-disclaimer}} resolves to rich text (a <p>), so the placeholder sits in
   a <div> wrapper; the inner paragraph inherits the legal-text styling. */
merch-card[variant="pro"][size='edu'] [slot="whats-included"] .whats-included-disclaimer p {
    margin: 0;
    font: inherit;
    color: inherit;
}

merch-card[variant="pro"][size='edu'] [slot="whats-included"] .whats-included-disclaimer a:not([class*="spectrum-Link"]) {
    color: var(--consonant-merch-card-pro-text-color, #000);
}

merch-card[variant="pro"][border-color="black"][size='edu'] [slot="whats-included"] .whats-included-disclaimer {
    color: #FFFFFFA3;
}

merch-card[variant="pro"][border-color="black"][size='edu'] [slot="whats-included"] .whats-included-disclaimer a:not([class*="spectrum-Link"]) {
    color: #FFF;
}

/* Milo auto-blocks authored links to fragment/modal paths (e.g. the
   "See what's included" and disclaimer "Check eligibility" modal triggers)
   as class="fragment link-block", then hides them via a global
   .fragment.link-block { display: none } until its own block decoration
   reveals them. That decoration never runs on merch-card's own authored/
   injected content, so they'd stay hidden forever \u2014 force them visible
   wherever they appear in the card (body-xs, whats-included, disclaimer, etc). */
merch-card[variant="pro"] a.fragment.link-block {
    display: inline !important;
}

/* Secondary spectrum links inherit the surrounding text color, per the
   convention used on other cards (e.g. mini-compare-chart footer-rows/body-m). */
merch-card[variant="pro"] [slot="whats-included"] a.spectrum-Link.spectrum-Link--secondary,
merch-card[variant="pro"] [slot="body-xs"] a.spectrum-Link.spectrum-Link--secondary {
    color: inherit;
}

/* Feature rows are 14/18/400 in both states \u2014 the authored <h4> and the <p>
   they become (pro.js adjustEduWhatsIncluded) \u2014 so type doesn't shift on
   convert. (Base h4 is 700/0.14px, the narrow-card look.) */
merch-card[variant="pro"][size='edu'] [slot="whats-included"] h4,
merch-card[variant="pro"][size='edu'] [slot="whats-included"] .section p {
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0;
}

merch-card[variant="pro"][size='edu'] [slot="whats-included"] .section p {
    margin: 0;
    padding: 0;
    color: var(--consonant-merch-card-pro-text-muted-color);
}

merch-card[variant="pro"][border-color="black"][size='edu'] [slot="whats-included"] .section p {
    color: var(--consonant-merch-card-pro-text-inverse-color);
}

merch-card[variant="pro"] [slot="whats-included"] .section,
merch-card[variant="pro"] [slot="whats-included"] h4,
merch-card[variant="pro"] [slot="whats-included"] h5 {
    margin: 0;
}

/* Studio's preview pane defines a global \`.section\` style (padding:32px,
   border-radius:16px, box-shadow, background) for its own editor panels.
   That selector inadvertently matches authored \`<div class="section">\`
   blocks inside the whats-included slot, blowing out paddings and forcing
   list items to wrap. Reset visual chrome so the section behaves as a
   transparent grouping container, per Figma. */
merch-card[variant="pro"] [slot="whats-included"] .section {
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
}

merch-card[variant="pro"] [slot="whats-included"] h4 {
    /* Pin the body font explicitly: on consumer pages (Milo) a global \`h4\`
       rule sets Adobe Clean Display Black directly on the element, which beats
       the font-family inherited from the slot container above. Studio has no
       such rule, so the title only looked wrong off-Studio. */
    font-family: var(--consonant-merch-card-pro-font-family-regular);
    /* s2a/typography/body-sm is Regular 400 \u2014 the UA \`h4\` bold (and Milo's
       \`body.mweb-enabled\` 800) must be overridden explicitly. */
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0;
    color: inherit;
}

/* Only rows with an icon need flex to center it against the text; a row with
   no icon (e.g. a leading link followed by plain text, MWPW-200407 review #1)
   must stay in normal flow, or flex splits the link and trailing text into
   separate wrapping columns instead of one flowing sentence. */
merch-card[variant="pro"] [slot="whats-included"] h4:has(> svg, > .sp-icon, > merch-icon) {
    display: flex;
    align-items: center;
    gap: 4px;
}

merch-card[variant="pro"] [slot="whats-included"] ul {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

merch-card[variant="pro"] [slot="whats-included"] ul li {
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0;
    color: var(--consonant-merch-card-pro-text-muted-color);
    padding: 0 20px;
}

merch-card[variant="pro"][border-color="black"] [slot="whats-included"] ul li {
    color: var(--consonant-merch-card-pro-text-inverse-color);
}

/* Dark wins over a leftover Black border: list items stay muted, not inverse */
merch-card[variant="pro"][background-color="dark"] [slot="whats-included"] ul li {
    color: var(--consonant-merch-card-pro-text-muted-color);
}

merch-card[variant="pro"] [slot="whats-included"] .section + .section {
    border-top: 1px solid var(--consonant-merch-card-pro-divider-color);
    padding-top: 16px;
}

/* Per Figma: the last section in a multi-section list uses 8px gap between title and items
   (the leading + middle sections stay at 12px). Single-section cards keep 12px.
   Excludes edu: there the sibling .whats-included-label makes .section a non-only
   :last-child, which would otherwise steal the edu 16px title\u2192list gap. */
merch-card[variant="pro"]:not([size='edu']) [slot="whats-included"] .section:not(:only-child):last-child ul {
    margin-top: 8px;
}

/* Section title icons: 20px on the first (lead) section, 16px on subsequent sections per Figma.
   Covers raw <svg> (curated registry), Spectrum <sp-icon-*> and <merch-icon> (standard picker).
   merch-icon sizes its shadow-DOM <img> from --mod-img-width/height (falling back to the
   size="xs" default of 20px), so a host width/height alone leaves the inner image at 20px and
   overflowing the box. Set the --mod-img-* custom properties too \u2014 they inherit across the shadow
   boundary and size the image to match. (svg/.sp-icon are light DOM and just use width/height.) */
merch-card[variant="pro"] [slot="whats-included"] .section h4 > svg,
merch-card[variant="pro"] [slot="whats-included"] .section h4 > .sp-icon,
merch-card[variant="pro"] [slot="whats-included"] .section h4 > merch-icon {
    width: 16px;
    height: 16px;
    --mod-img-width: 16px;
    --mod-img-height: 16px;
    flex: 0 0 auto;
    color: inherit;
}
merch-card[variant="pro"] [slot="whats-included"] .section:first-child h4 > svg,
merch-card[variant="pro"] [slot="whats-included"] .section:first-child h4 > .sp-icon,
merch-card[variant="pro"] [slot="whats-included"] .section:first-child h4 > merch-icon {
    width: 20px;
    height: 20px;
    --mod-img-width: 20px;
    --mod-img-height: 20px;
}

/* CTA styling \u2014 pill-shaped buttons, accent solid + outlined */
merch-card[variant="pro"] [slot="footer"] a,
merch-card[variant="pro"] [slot="footer"] button {
    flex: 1 1 calc(50% - 4px);
    /* One-line label width, capped at the footer: past half the row the CTAs
       stack, past the whole row the label wraps. */
    min-width: fit-content;
    min-height: 40px;
    padding: 8px 24px;
    /* S2A spacing-xs between an icon and the label; inert without one */
    gap: 8px;
    border-radius: 999px;
    font-family: var(--consonant-merch-card-pro-font-family-regular);
    font-weight: 700;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0;
    text-align: center;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    overflow-wrap: anywhere;
}

merch-card[variant="pro"] [slot="footer"] .con-button.blue,
merch-card[variant="pro"] [slot="footer"] a.accent,
merch-card[variant="pro"] [slot="footer"] [data-button-type="accent"] {
    background: var(--consonant-merch-card-pro-cta-accent-color);
    color: var(--consonant-merch-card-pro-text-inverse-color);
    border: none;
}

/* Hover: the accent button darkens, the outline button picks up a wash. */
merch-card[variant="pro"] [slot="footer"] .con-button.blue:hover,
merch-card[variant="pro"] [slot="footer"] a.accent:hover,
merch-card[variant="pro"] [slot="footer"] [data-button-type="accent"]:hover {
    background-color: var(--consonant-merch-card-pro-cta-accent-hover-color);
}

merch-card[variant="pro"] [slot="footer"] .con-button.outline,
merch-card[variant="pro"] [slot="footer"] .con-button.primary,
merch-card[variant="pro"] [slot="footer"] a.outline,
merch-card[variant="pro"] [slot="footer"] [data-button-type="primary"] {
    background: transparent;
    color: var(--consonant-merch-card-pro-text-color);
    /* border tracks the label: #000 on light, #fff on dark */
    border: 2px solid
        var(
            --consonant-merch-card-pro-cta-outline-border-color,
            var(--consonant-merch-card-pro-text-color)
        );
}

merch-card[variant="pro"][stacked] [slot="footer"] a,
merch-card[variant="pro"][stacked] [slot="footer"] button {
    flex-basis: 100%;
}

/* S2A outlined button (2161:54613): black@8% wash on light, white@64% on dark,
   where the label flips to black to stay readable. The border never moves. */
merch-card[variant="pro"] [slot="footer"] .con-button.outline:hover,
merch-card[variant="pro"] [slot="footer"] .con-button.primary:hover,
merch-card[variant="pro"] [slot="footer"] a.outline:hover,
merch-card[variant="pro"] [slot="footer"] [data-button-type="primary"]:hover {
    background-color: var(--consonant-merch-card-pro-cta-outline-hover-color);
    color: var(
        --consonant-merch-card-pro-cta-outline-hover-text-color,
        var(--consonant-merch-card-pro-text-color)
    );
}

/* heading-m holds the price. inline-price cards are covered by the .price-span
   rules below; "free" cards author literal text ("Free") that has no .price spans,
   so style the slot itself to match the Figma price (18px/900, node 1114:39070)
   instead of falling through to the global heading-m default (24px/700/#2c2c2c). */
merch-card[variant="pro"] [slot="heading-m"],
merch-card[variant="pro"] [slot="heading-m"] > p {
    margin: 0;
    font-family: var(--consonant-merch-card-pro-font-family-display);
    font-weight: 900;
    font-size: 18px;
    line-height: 21px;
    letter-spacing: -0.48px;
    color: var(--consonant-merch-card-pro-text-color);
}

/* Price spans \u2014 individually styled per Figma */
merch-card[variant="pro"] [slot="heading-m"] .price,
merch-card[variant="pro"] [slot="heading-m"] .price-currency-symbol,
merch-card[variant="pro"] [slot="heading-m"] .price-integer,
merch-card[variant="pro"] [slot="heading-m"] .price-decimals-delimiter,
merch-card[variant="pro"] [slot="heading-m"] .price-decimals,
merch-card[variant="pro"] [slot="heading-m"] .price-recurrence {
    font-family: var(--consonant-merch-card-pro-font-family-display);
    font-weight: 900;
    font-size: 18px;
    line-height: 21px;
    letter-spacing: -0.48px;
    color: var(--consonant-merch-card-pro-text-color);
}

/* Strikethrough (regular) price \u2014 Figma 988:14784: 14px regular muted, struck,
   on its own line ABOVE the current price (988:14785). Out-specifies the
   18px/900 .price rules above. Covers both markup shapes:
   - promo: .price-strikethrough next to .price-alternative inside one
     price-template inline-price (the promo price keeps the 18px/900 look)
   - authored: a separate strikethrough-template inline-price before the main
     price. The line-through itself comes from the global stylesheet. */
merch-card[variant="pro"]
    [slot="heading-m"]
    .price:is(.price-strikethrough, .price-promo-strikethrough),
merch-card[variant="pro"]
    [slot="heading-m"]
    .price:is(.price-strikethrough, .price-promo-strikethrough)
    span {
    font-family: var(--consonant-merch-card-pro-font-family-regular);
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0;
    color: var(--consonant-merch-card-pro-text-muted-color);
}

/* The global sheet strikes the wrapper as well as the span inside it, so the
   authored price gets two lines. Leave it to the inner span. */
merch-card[variant="pro"]
    [slot="heading-m"]
    span[is="inline-price"]:is(
        [data-template="strikethrough"],
        [data-template="priceStrikethrough"]
    ):has(.price-strikethrough) {
    text-decoration: none;
}

/* Stack the struck price onto its own line. The authored shape needs the
   inline-price wrapper itself to break (its inner .price going block would
   stay inside the inline-block wrapper); the promo shape needs the inner
   .price-strikethrough to break within the shared wrapper. */
merch-card[variant="pro"]
    [slot="heading-m"]
    span[is="inline-price"]:is(
        [data-template="strikethrough"],
        [data-template="priceStrikethrough"]
    ),
merch-card[variant="pro"]
    [slot="heading-m"]
    span[is="inline-price"][data-template="price"]
    .price:is(.price-strikethrough, .price-promo-strikethrough) {
    display: block;
}

/* The promo shape separates the two prices with an &nbsp; text node directly
   inside the wrapper; once the strikethrough goes block, that nbsp would
   indent the promo price's line. Zeroing the wrapper font collapses it \u2014 the
   .price spans carry their own explicit sizes (same trick as plans.css.js'
   ja_JP price-alternative block). line-height must go too: it is a length, so
   it survives font-size:0 and left a 6px strut that pushed the promo card's
   price off the row. */
merch-card[variant="pro"]
    [slot="heading-m"]
    span[is="inline-price"][data-template="price"]:has(
        .price-strikethrough,
        .price-promo-strikethrough
    ) {
    font-size: 0;
    line-height: 0;
}

/* Reserve the struck price's line so the real price sits at the same height
   across the row. syncHeights publishes each card's shortfall. */
merch-card[variant="pro"] [slot="heading-m"] {
    padding-top: var(--consonant-merch-card-pro-strike-reserve, 0);
}

/* Plan type line ("Annual, billed monthly") \u2014 the legal-template price span,
   rendered when the Show Plan type setting is on. Its container carries the
   shared .price class, so this later rule overrides the 18px/900 price
   styling above with the muted body style (same look as promo-text, Figma
   1114:39070). Both the custom-element wrapper AND the inner .price container
   need display:block \u2014 the wrapper is inline-block by default, which would
   shrink-wrap the block container and keep it on the price's line. */
merch-card[variant="pro"] [slot="heading-m"] span[is="inline-price"][data-template="legal"],
merch-card[variant="pro"] [slot="heading-m"] .price.price-legal {
    display: block;
    font-family: var(--consonant-merch-card-pro-font-family-regular);
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0;
    color: var(--consonant-merch-card-pro-text-muted-color);
}

/* The legal line opens with an empty unit-type, so the tax label's leading
   ::before nbsp turns into a spurious indent and the line no longer aligns with
   the price above it; drop it when nothing precedes the tax label (MWPW-198626). */
merch-card[variant="pro"]
    .price-legal
    .price-unit-type.disabled
    + .price-tax-inclusivity:not(.disabled)::before {
    content: none;
}

/* Collection grid \u2014 C2 column breakpoints (768, 1280).
   - Mobile: single column, full width.
   - Tablet (\u2265768): 2-column grid for 2/3/4 cards.
   - Desktop (\u22651280): full column count.
   Cards stretch to equal height within a row (matches Figma row-equal layout)
   and widths flow fluidly via 1fr tracks. */
merch-card-collection.plans:is(.one-merch-card, .two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="pro"]) {
    display: grid;
    gap: 8px;
    grid-template-columns: minmax(0, var(--consonant-merch-card-pro-max-width));
    justify-content: center;
    /* Cards stretch to equal height; the white .top-card is pinned to its
       (uniform) content height and the gray .features-zone grows to fill the
       rest, so the white tops AND the card bottoms both line up across the row
       (matches Figma). See .top-card / .features-zone flex in the shadow styles. */
    align-items: stretch;
    margin-inline: auto;
}

/* The one-merch-card grid zeroes the section .content padding to center the lone
   card, which also wipes the C2 section-spacing metadata (e.g. spacing-2xs-top).
   Restore the authored top spacing so single pro cards keep section rhythm.
   MWPW-204106. */
.one-merch-card.spacing-2xs-top {
    padding-top: var(--s2a-viewport-vertical-padding-2xs);
}

.container.one-merch-card {
    padding-inline: var(--grid-padding);
}
@media screen and ${x} {
    merch-card-collection.plans:is(.two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="pro"]) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        max-width: 720px;
    }
}

@media screen and ${re} {
    merch-card-collection.plans:is(.three-merch-cards):has(merch-card[variant="pro"]) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        max-width: 1192px;
    }
    merch-card-collection.plans:is(.four-merch-cards):has(merch-card[variant="pro"]) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        max-width: 1600px;
    }
    /* Detect exactly two cards structurally and render them as a centred 2-up.
       Matching the cards directly (instead of a column class) works regardless
       of whether the collection is tagged .two-merch-cards (since MWPW-196627)
       or falls into .four-merch-cards (e.g. when a card has a 'wide' size).
       Per Figma the 2-up cards are wider than the dense 4-up: they flex-fill the
       row up to 596px (\u2248522px at the 1280 breakpoint), so widen the track and the
       card's own cap for this case only. */
    merch-card-collection.plans:has(merch-card[variant="pro"]):has(> merch-card:nth-of-type(2):last-of-type) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        max-width: calc(2 * var(--consonant-merch-card-pro-2up-max-width) + 12px);
    }
    merch-card-collection.plans:has(merch-card[variant="pro"]):has(> merch-card:nth-of-type(2):last-of-type) merch-card[variant="pro"] {
        max-width: var(--consonant-merch-card-pro-2up-max-width);
    }
}

@media screen and ${x} and (max-width: 1280px) {
    merch-card-collection.plans:has(> merch-card[variant="pro"]):has(> merch-card:nth-of-type(3)) {
        max-width: 1280px;
    }
}

@media screen and ${ze} {
    merch-card-collection.plans:has(> merch-card[variant="pro"]):has(> merch-card:nth-of-type(3)) {
        max-width: 1920px;
    }
}

@media screen and ${x} and (max-width: 1280px), screen and ${ze} {
    merch-card-collection.plans:has(> merch-card[variant="pro"]):has(> merch-card:nth-of-type(3)) > merch-card[variant="pro"]:not([size="edu"]) {
        max-width: none;
    }
}

@media screen and ${S} {
    /* Mobile (320\u2013767px): the default track caps cards at 394px, leaving side
       margins wider than the 24px gutter. Collapse to a single 1fr track and
       drop the card cap so cards fill the available width. */
    merch-card-collection.plans:is(.one-merch-card, .two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="pro"]) {
        grid-template-columns: minmax(0, 1fr);
    }

    merch-card[variant="pro"] {
        width: 100%;
        max-width: none;
    }

    /* A collection inside a Milo .section.container inherits its 24px page
       gutter; one dropped straight into a plain section gets none, so the
       now-full-width cards bleed to the viewport edge. Restore the gutter on
       the collection itself for that case only. The > .content > chain pins
       this to the collection's own section, so it never doubles up where a
       .container already supplies the gutter. */
    .section:not(.container) > .content > .collection-container.plans:has(merch-card[variant="pro"]) {
        padding-inline: 24px;
    }
}

/* Section grid \u2014 the same C2 columns and caps as the collection grid above, for
   pro cards placed straight in a Milo .one/.two/.three/.four-merch-cards
   section instead of a merch-card-collection (MWPW-203250). The section's
   .content wrapper turns transparent so the grid applies to the cards. */
${j(wt," > .content")} {
    display: contents;
}

${j(wt)} {
    gap: 8px;
    grid-template-columns: minmax(0, var(--consonant-merch-card-pro-max-width));
    align-items: stretch;
    margin-inline: auto;
}

@media screen and ${x} {
    ${j(si)} {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        max-width: 720px;
    }

    ${j(Rr,' merch-card[variant="pro"]:not([size="edu"])')} {
        max-width: none;
    }
}

@media screen and ${re} {
    ${j(["two-merch-cards"])} {
        gap: 12px;
        max-width: calc(2 * var(--consonant-merch-card-pro-2up-max-width) + 12px);
    }
    ${j(["two-merch-cards"],' merch-card[variant="pro"]')} {
        max-width: var(--consonant-merch-card-pro-2up-max-width);
    }
    ${j(["three-merch-cards"])} {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        max-width: 1192px;
    }
    ${j(["four-merch-cards"])} {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        max-width: 1600px;
    }
}

@media screen and ${x} and (max-width: 1280px) {
    ${j(Rr)} {
        max-width: 1280px;
    }
}

@media screen and ${ze} {
    ${j(Rr)} {
        max-width: 1920px;
    }
}

@media screen and ${S} {
    ${j(wt)} {
        grid-template-columns: minmax(0, 1fr);
    }
}
`;var[ud,fd,ao,oo,no,io]=["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Enter","Tab"];var Zt="pro",Nr=`--consonant-merch-card-${Zt}-top-card-height`,Qt=[{prop:`--consonant-merch-card-${Zt}-mnemonic-height`,selector:".mnemonic"},{prop:`--consonant-merch-card-${Zt}-name-description-height`,selector:".name-description"}],co=`--consonant-merch-card-${Zt}-strike-reserve`,Or='[slot="heading-m"] :is(.price-strikethrough, .price-promo-strikethrough, [data-template="strikethrough"])',di="(min-width: 768px)",hi=["see-whats-included","{{see-whats-included}}"],mi=a=>new Set([...a.querySelectorAll('[slot="footer"] a, [slot="footer"] button')].filter(r=>r.getClientRects().length).map(r=>Math.round(r.getBoundingClientRect().top))).size>1,so={cardName:{attribute:"name"},subtitle:{tag:"p",slot:"subtitle"},title:{tag:"h3",slot:"heading-xs"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"s"},size:["wide","edu"],prices:{tag:"p",slot:"heading-m"},promoText:{tag:"p",slot:"promo-text"},perUnitLabel:{tag:"span",slot:"per-unit-label"},callout:{tag:"div",slot:"callout-content",editorLabel:"License callout"},quantitySelect:{tag:"div",slot:"quantity-select"},shortDescription:{tag:"div",slot:"legal-text"},secureLabel:!0,planType:!0,addon:!0,ctas:{slot:"footer",size:"m"},whatsIncluded:{tag:"div",slot:"whats-included"},eduDisclaimer:{tag:"div",slot:"edu-disclaimer"},backgroundColor:{attribute:"background-color",editorLabel:"Theme",specialValues:{Light:"light",Dark:"dark"}},borderColor:{attribute:"border-color",specialValues:{Black:"black"},hideTransparent:!0,disableWhenBackgroundColor:"dark"},allowedBorderColors:[],style:"consonant"},J,we,At,Tt,N,lo,kt,ho,Ct,$r,Xt,Jt=class Jt extends b{constructor(e){super(e);f(this,N);d(this,"expanded",!1);d(this,"licenseOpen",!1);d(this,"licenseQty",null);d(this,"licenseHighlightedIndex",0);f(this,J,null);f(this,we,null);f(this,At,()=>this.resyncOnReflow());d(this,"lastSyncKey",null);f(this,Tt,({detail:e})=>{let t=e?.quantity==null?null:String(e.quantity);t==null||t===this.licenseQty||this.licenseOptions?.includes(t)&&(this.licenseQty=t,this.card.requestUpdate())});d(this,"toggleExpanded",e=>{e.preventDefault();let t=!this.expanded;for(let o of E(this,N,lo).call(this)){let n=o.variantLayout;n instanceof Jt&&(n.expanded=t,o._proExpanded=t,o.requestUpdate())}});d(this,"toggleLicensePopover",e=>{e.preventDefault(),e.stopPropagation(),this.licenseOpen?E(this,N,$r).call(this):E(this,N,Ct).call(this),this.card.requestUpdate()});f(this,Xt,e=>{let t=this.licenseOptions;if(!t?.length)return;let o=t.length-1;switch(e.key){case oo:e.preventDefault(),this.licenseOpen?this.licenseHighlightedIndex=(this.licenseHighlightedIndex+1)%t.length:E(this,N,Ct).call(this);break;case ao:e.preventDefault(),this.licenseOpen?this.licenseHighlightedIndex=(this.licenseHighlightedIndex-1+t.length)%t.length:E(this,N,Ct).call(this);break;case"Home":if(!this.licenseOpen)return;e.preventDefault(),this.licenseHighlightedIndex=0;break;case"End":if(!this.licenseOpen)return;e.preventDefault(),this.licenseHighlightedIndex=o;break;case no:case" ":if(e.preventDefault(),this.licenseOpen){this.selectLicenseQty(t[this.licenseHighlightedIndex]);return}E(this,N,Ct).call(this);break;case"Escape":if(!this.licenseOpen)return;e.preventDefault(),E(this,N,$r).call(this);break;case io:this.licenseOpen&&this.selectLicenseQty(t[this.licenseHighlightedIndex]);return;default:return}this.card.requestUpdate()});d(this,"selectLicenseQty",e=>{this.licenseQty=e,this.licenseOpen=!1,E(this,N,kt).call(this);let t=this.quantitySelectEl;t&&(t.selectedValue=Number(e),t.dispatchEvent(new CustomEvent(D,{detail:{option:Number(e)},bubbles:!0}))),this.card.requestUpdate()});this.updatePriceQuantity=this.updatePriceQuantity.bind(this),this.expanded=e._proExpanded??!1}getGlobalCSS(){return ro}priceOptionsProvider(e,t){if(e.dataset.template!==P)return;let o=this.shortDescription;if(o&&e.closest('[slot="heading-m"]')){t.displayPlanType=!0,t.customPlanTypeLabel=o;return}t.displayPlanType=this.card?.settings?.displayPlanType??!1}get shortDescription(){let e=this.card?.querySelector('[slot="legal-text"]');return e?.textContent?.trim()?e.innerHTML.trim():""}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let e=this.mainPrice;if(!e)return;let t=e.cloneNode(!0);if(await e.onceSettled(),!e?.options)return;e.options.displayTax&&(e.dataset.displayTax="false"),e.options.displayPlanType&&(e.dataset.displayPlanType="false"),t.setAttribute("data-template","legal"),t.dataset.displayPerUnit="false",this.shortDescription&&delete t.dataset.displayPlanType,e.parentNode.insertBefore(t,e.nextSibling),await t.onceSettled()}catch{}}get hasWhatsIncluded(){return!!this.card.querySelector('[slot="whats-included"]')}get hasEduDisclaimer(){return!this.card?.settings?.hideEduDisclaimer}get whatsIncludedToggleLabel(){let e=this.card.querySelector('[slot="whats-included"] .whats-included-label')?.textContent.trim(),t=this.card.placeholders?.whatsIncludedToggleLabel;return e||!hi.includes(t)&&t||""}get hasCallout(){return!!this.card.querySelector('[slot="callout-content"]')}get hasQuantitySelect(){let e=this.quantitySelectEl;return e?!!e.getAttribute("title")||parseInt(e.getAttribute("min"),10)>0||parseInt(e.getAttribute("step"),10)>0:!1}get hasAddOn(){return!!this.card.querySelector('[slot="addon"]')}get addonBackground(){return this.card.querySelector('[slot="addon"]')?.getAttribute("background")??null}get mainPrice(){return this.card.querySelector(`[slot="heading-m"] ${y}[data-template="price"]`)}updatePriceQuantity({detail:e}){!this.mainPrice||!e?.option||(this.mainPrice.dataset.quantity=e.option)}async adjustAddon(){await this.card.updateComplete;let e=this.card.addon;if(!e)return;e.setAttribute("custom-checkbox","");let t=this.mainPrice;if(!t)return;await t.onceSettled?.();let o=t.value?.[0]?.planType;o&&(e.planType=o)}async postCardUpdateHook(){this.adjustEduWhatsIncluded(),await this.adjustAddon(),this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook(),window.matchMedia("(min-width: 768px)").matches&&this.syncHeights()}adjustEduWhatsIncluded(){if(this.card.size!=="edu")return;let e=this.card.querySelector('[slot="whats-included"]');if(!e||e.querySelector(".whats-included-title"))return;let t=e.querySelector(".whats-included-label");if(!t)return;let o=document.createElement("p");o.className="whats-included-title",o.innerHTML=t.innerHTML,t.replaceWith(o);let{whatsIncludedLabel:n,eduDisclaimer:i}=this.card.placeholders??{},c=document.createElement(n?.trim()?"h4":"p");if(c.className="whats-included-label",c.textContent=n??"",o.after(c),e.querySelectorAll(":scope .section h4").forEach(s=>{let l=document.createElement("p");l.innerHTML=s.innerHTML,s.replaceWith(l)}),i){let s=document.createElement("div");s.className="whats-included-disclaimer",s.innerHTML=i,e.append(s)}}async waitForContentFonts(){let e=[this.card.querySelector('[slot="heading-xs"]'),this.card.querySelector('[slot="body-xs"]')].filter(Boolean);document.fonts?.load&&await Promise.all(e.map(t=>{let o=window.getComputedStyle(t),n=`${o.fontWeight} ${o.fontSize} ${o.fontFamily}`;return document.fonts.load(n,t.textContent).catch(()=>null)})),await document.fonts?.ready}async syncHeights(){if(this.card.heightSync===!1){this.clearSyncedHeights(this.card);return}await this.waitForContentFonts(),await new Promise(s=>requestAnimationFrame(s)),await new Promise(s=>requestAnimationFrame(s));let e=this.getContainer();if(!e||this.card.getBoundingClientRect().width<=2)return;let t=this.card.variant,o=Nr,n=[...e.querySelectorAll(`merch-card[variant="${t}"]`)].filter(s=>s.getBoundingClientRect().width>2&&s.variantLayout?.card?.heightSync!==!1);if(!window.matchMedia(di).matches){n.forEach(s=>this.clearSyncedHeights(s));return}let i=new Map;for(let s of n){let l=i.get(s.offsetTop)??[];l.push(s),i.set(s.offsetTop,l)}let c=(s,l)=>s.reduce((m,p)=>{let v=l(p);return v?Math.max(m,parseInt(getComputedStyle(v).height)||0):m},0);for(let s of i.values()){if(s.forEach(u=>this.clearSyncedHeights(u)),s.length<2)continue;let l=s.some(mi);s.forEach(u=>u.toggleAttribute("stacked",l));let m=s.map(u=>u.querySelector(Or)&&parseInt(getComputedStyle(u.querySelector(Or)).height)||0),p=Math.max(0,...m);p>0&&s.forEach((u,w)=>{let T=p-m[w];T>0&&u.style.setProperty(co,`${T}px`)});for(let u of Qt){let w=c(s,T=>T.shadowRoot?.querySelector(u.selector));w>0&&s.forEach(T=>T.style.setProperty(u.prop,`${w}px`))}let v=c(s,u=>u.shadowRoot?.querySelector(".top-card"));v>0&&s.forEach(u=>u.style.setProperty(o,`${v}px`))}}clearSyncedHeights(e){e.removeAttribute("stacked"),e.style.removeProperty(Nr),e.style.removeProperty(co),Qt.forEach(t=>e.style.removeProperty(t.prop))}resyncOnReflow(){let e=this.card.getBoundingClientRect().width;if(e<=2)return;let t=(n,i=this.card)=>Math.round(i?.querySelector(n)?.getBoundingClientRect().height||0),o=[Math.round(e),t('[slot="body-xs"]'),t(Or),t('[slot="heading-m"] span[is="inline-price"]'),t('[slot="heading-m"] :is(.price-legal, [data-template="legal"])'),t(".license-zone",this.card.shadowRoot),t(".add-on",this.card.shadowRoot)].join(":");o!==this.lastSyncKey&&(this.lastSyncKey=o,this.syncHeights())}connectedCallbackHook(){if(!this.card||(this.card.addEventListener(ht,h(this,Tt)),this.card.addEventListener(D,this.updatePriceQuantity),this.card.addEventListener(I,h(this,At)),typeof ResizeObserver>"u"))return;g(this,we,new ResizeObserver(()=>this.resyncOnReflow())),h(this,we).observe(this.card);let e=this.card.querySelector('[slot="body-xs"]');e&&h(this,we).observe(e)}disconnectedCallbackHook(){this.card?.removeEventListener(D,this.updatePriceQuantity),this.card?.removeEventListener(I,h(this,At)),E(this,N,kt).call(this),h(this,we)?.disconnect(),this.card?.removeEventListener(ht,h(this,Tt))}get quantitySelectEl(){return this.card.querySelector("merch-quantity-select")}get licenseOptions(){let e=this.quantitySelectEl;if(!e)return null;let t=parseInt(e.getAttribute("min"),10),o=parseInt(e.getAttribute("max"),10),n=parseInt(e.getAttribute("step"),10)||1;if(Number.isNaN(t)||Number.isNaN(o)||o<t||n<1)return null;let i=[];for(let c=t;c<=o;c+=n)i.push(String(c));return i}licenseLabel(e){let t=this.quantitySelectEl?.getAttribute("title")||this.card.placeholders?.licenseLabel||"",[o,n]=t.split("|").map(i=>i.trim());return Number(e)===1?o:n||o}get hasLicenseSelector(){return(this.licenseOptions?.length??0)>0}get currentLicenseValue(){let e=this.licenseOptions;if(!e?.length)return null;if(this.licenseQty!=null)return this.licenseQty;let t=this.quantitySelectEl?.getAttribute("default-value");return t!=null&&e.includes(t)?t:e[0]}renderLicenseSelector(){if(!this.hasLicenseSelector)return K`<slot name="quantity-select"></slot>`;let e=this.licenseOptions,t=this.currentLicenseValue,o=!!this.licenseOpen,n=this.licenseLabel(Number(t)),i=this.card.title,c=i?"license-select-product license-select-label":"license-select-label";return K`
            <div class="license-select" ?data-open=${o}>
                ${i?K`<span id="license-select-product" hidden
                          >${i}</span
                      >`:ye}
                <div
                    class="license-select-trigger"
                    role="combobox"
                    tabindex="0"
                    aria-expanded=${o?"true":"false"}
                    aria-controls="license-popover"
                    aria-labelledby=${c}
                    aria-activedescendant=${o?`license-option-${this.licenseHighlightedIndex}`:ye}
                    @click=${this.toggleLicensePopover}
                    @keydown=${h(this,Xt)}
                >
                    <span class="license-select-trigger-text">
                        <span class="license-select-value">${t}</span>
                        <span
                            class="license-select-label"
                            id="license-select-label"
                            >${n}</span
                        >
                    </span>
                    <span
                        class="license-select-chevron"
                        aria-hidden="true"
                    ></span>
                </div>
                <ul
                    id="license-popover"
                    class="license-select-popover"
                    role="listbox"
                    aria-labelledby=${c}
                    aria-multiselectable="false"
                    tabindex="-1"
                    ?hidden=${!o}
                >
                    <li
                        class="license-select-popover-header"
                        aria-hidden="true"
                        @click=${this.toggleLicensePopover}
                    >
                        <span class="license-select-trigger-text">
                            <span class="license-select-value">${t}</span>
                            <span class="license-select-label">${n}</span>
                        </span>
                        <span
                            class="license-select-chevron"
                            aria-hidden="true"
                            style="transform: rotate(180deg);"
                        ></span>
                    </li>
                    ${e.map((s,l)=>K`
                            <li
                                class="license-select-option ${l===this.licenseHighlightedIndex?"highlighted":""}${s===t?" selected":""}"
                                id="license-option-${l}"
                                role="option"
                                aria-selected=${s===t?"true":"false"}
                                @click=${()=>this.selectLicenseQty(s)}
                                @mouseenter=${()=>{this.licenseHighlightedIndex=l,this.card.requestUpdate()}}
                            >
                                ${s}
                            </li>
                        `)}
                </ul>
            </div>
        `}renderLayout(){let e=!!this.expanded;return K`
            <div class="top-card">
                <div class="mnemonic">
                    <slot name="icons"></slot>
                    <slot name="subtitle"></slot>
                </div>
                <div class="name-description">
                    <slot name="heading-xs"></slot>
                    <slot name="body-xs"></slot>
                </div>
                <div class="pricing">
                    <div class="pricing-line">
                        <slot name="heading-m"></slot>
                        <slot name="per-unit-label"></slot>
                    </div>
                    <slot name="promo-text"></slot>
                </div>
                ${this.hasLicenseSelector||this.hasCallout||this.hasQuantitySelect?K`<div class="license-zone">
                          ${this.renderLicenseSelector()}
                          ${this.hasCallout?K`<div class="callout">
                                    <slot name="callout-content"></slot>
                                </div>`:ye}
                      </div>`:ye}
                ${this.hasAddOn?K`<div
                          class="add-on"
                          ?data-addon-grey=${this.addonBackground==="grey"}
                      >
                          <slot name="addon"></slot>
                      </div>`:ye}
                <footer>
                    <slot name="footer"></slot>
                </footer>
                ${this.secureLabel}
            </div>
            ${this.hasWhatsIncluded?K`
                      <button
                          class="whats-included-toggle"
                          type="button"
                          aria-expanded=${e?"true":"false"}
                          aria-controls="features-zone"
                          @click=${this.toggleExpanded}
                      >
                          <span class="whats-included-toggle-label">
                              ${this.whatsIncludedToggleLabel}
                          </span>
                          <span
                              class="whats-included-toggle-chevron"
                              aria-hidden="true"
                          ></span>
                      </button>
                      <div
                          id="features-zone"
                          class="features-zone"
                          ?hidden=${!e}
                      >
                          <slot name="whats-included"></slot>
                      </div>
                  `:ye}
            ${this.hasEduDisclaimer?K`<div class="edu-disclaimer">
                      <slot name="edu-disclaimer"></slot>
                  </div>`:ye}
            <slot></slot>
        `}};J=new WeakMap,we=new WeakMap,At=new WeakMap,Tt=new WeakMap,N=new WeakSet,lo=function(){let e=this.card.offsetTop,t=Array.from(this.getContainer()?.querySelectorAll(`merch-card[variant="${this.card.variant}"]`)??[]).filter(o=>o.getBoundingClientRect().width>2&&o.offsetTop===e);return t.length?t:[this.card]},kt=function(){h(this,J)&&(document.removeEventListener("mousedown",h(this,J)),g(this,J,null))},ho=function(){let e=this.licenseOptions?.indexOf(this.currentLicenseValue);return e>0?e:0},Ct=function(){this.licenseOpen=!0,this.licenseHighlightedIndex=E(this,N,ho).call(this),h(this,J)||(g(this,J,e=>{e.composedPath().includes(this.card)||(this.licenseOpen=!1,this.card.requestUpdate(),E(this,N,kt).call(this))}),document.addEventListener("mousedown",h(this,J)))},$r=function(){this.licenseOpen=!1,E(this,N,kt).call(this)},Xt=new WeakMap,d(Jt,"variantStyle",li`
        :host([variant='pro']) {
            display: flex;
            flex-direction: column;
            background: var(
                --consonant-merch-card-pro-frame-bg,
                var(--consonant-merch-card-pro-bg-subtle, #f8f8f8)
            );
            border-radius: 16px;
            padding: 4px;
            box-sizing: border-box;
            overflow: hidden;
            position: relative;
            color: var(--consonant-merch-card-pro-frame-text, #000);
            /* control (dropdown) surface defaults to light; dark overrides these */
            --consonant-merch-card-pro-control-bg: var(
                --consonant-merch-card-pro-bg-default,
                #fff
            );
            --consonant-merch-card-pro-control-hover-bg: var(
                --consonant-merch-card-pro-bg-subtle,
                #f8f8f8
            );
            /* selected license option: S2A blue-900 with white text, 4.8:1
               against both the option and the text (3.9:1 on the dark popover) */
            --consonant-merch-card-pro-control-selected-bg: #3b63fb;
            --consonant-merch-card-pro-control-selected-text: #fff;
            --secure-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='currentColor'%3E%3Cpath d='M9 9.2C9 8.64844 8.55156 8.2 8 8.2C7.44844 8.2 7 8.64844 7 9.2C7 9.52207 7.16289 9.7959 7.4 9.9789V10.6C7.4 10.9312 7.66875 11.2 8 11.2C8.33125 11.2 8.6 10.9312 8.6 10.6V9.9789C8.83711 9.7959 9 9.52207 9 9.2Z'/%3E%3Cpath d='M12 5.62031V5.2C12 2.99453 10.2055 1.2 8 1.2C5.79453 1.2 4 2.99453 4 5.2V5.62031C3.10274 5.72129 2.4 6.47637 2.4 7.4V12.6C2.4 13.5922 3.20782 14.4 4.2 14.4H11.8C12.7922 14.4 13.6 13.5922 13.6 12.6V7.4C13.6 6.47637 12.8973 5.72129 12 5.62031ZM8 2.4C9.54375 2.4 10.8 3.65625 10.8 5.2V5.6H5.2V5.2C5.2 3.65625 6.45625 2.4 8 2.4ZM12.4 12.6C12.4 12.9305 12.1305 13.2 11.8 13.2H4.2C3.86953 13.2 3.6 12.9305 3.6 12.6V7.4C3.6 7.06953 3.86953 6.8 4.2 6.8H11.8C12.1305 6.8 12.4 7.06953 12.4 7.4V12.6Z'/%3E%3C/svg%3E");
        }

        :host([variant='pro'][border-color='black']) {
            --consonant-merch-card-pro-frame-bg: #000;
            --consonant-merch-card-pro-frame-text: #fff;
            --consonant-merch-card-pro-divider-color: #ffffff29;
            --consonant-merch-card-pro-subtitle-color: #000;
        }

        /* dark theme — background-color="dark" comes from the #1093 Theme picker */
        :host([variant='pro'][background-color='dark']) {
            --consonant-merch-card-pro-bg-default: #000;
            --consonant-merch-card-pro-bg-subtle: #131313;
            --consonant-merch-card-pro-frame-bg: #131313;
            --consonant-merch-card-pro-frame-text: #fff;
            --consonant-merch-card-pro-text-color: #fff;
            --consonant-merch-card-pro-text-muted-color: #ffffffa3;
            --consonant-merch-card-pro-text-inverse-color: #fff;
            --consonant-merch-card-pro-subtitle-color: #ffffffa3;
            /* lock recoloured to #a3a3a3 (white@64% on the #000 hero) */
            --secure-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23a3a3a3'%3E%3Cpath d='M9 9.2C9 8.64844 8.55156 8.2 8 8.2C7.44844 8.2 7 8.64844 7 9.2C7 9.52207 7.16289 9.7959 7.4 9.9789V10.6C7.4 10.9312 7.66875 11.2 8 11.2C8.33125 11.2 8.6 10.9312 8.6 10.6V9.9789C8.83711 9.7959 9 9.52207 9 9.2Z'/%3E%3Cpath d='M12 5.62031V5.2C12 2.99453 10.2055 1.2 8 1.2C5.79453 1.2 4 2.99453 4 5.2V5.62031C3.10274 5.72129 2.4 6.47637 2.4 7.4V12.6C2.4 13.5922 3.20782 14.4 4.2 14.4H11.8C12.7922 14.4 13.6 13.5922 13.6 12.6V7.4C13.6 6.47637 12.8973 5.72129 12 5.62031ZM8 2.4C9.54375 2.4 10.8 3.65625 10.8 5.2V5.6H5.2V5.2C5.2 3.65625 6.45625 2.4 8 2.4ZM12.4 12.6C12.4 12.9305 12.1305 13.2 11.8 13.2H4.2C3.86953 13.2 3.6 12.9305 3.6 12.6V7.4C3.6 7.06953 3.86953 6.8 4.2 6.8H11.8C12.1305 6.8 12.4 7.06953 12.4 7.4V12.6Z'/%3E%3C/svg%3E");
            /* dividers stay transparent-black-12, same as light */
            --consonant-merch-card-pro-divider-color: #0000001f;
            --consonant-merch-card-pro-cta-outline-border-color: #fff;
            /* white@64% over the #000 top-card resolves to #a3a3a3, so the
               label has to knock back to black to stay legible on it */
            --consonant-merch-card-pro-cta-outline-hover-color: #ffffffa3;
            --consonant-merch-card-pro-cta-outline-hover-text-color: #000;
            /* dropdown trigger = #131313; border keeps the light value */
            --consonant-merch-card-pro-control-bg: #131313;
            --consonant-merch-card-pro-control-hover-bg: #ffffff14;
        }

        :host([variant='pro']) .top-card {
            background: var(--consonant-merch-card-pro-bg-default, #fff);
            border-radius: 12px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 24px;
            color: var(--consonant-merch-card-pro-text-color, #000);
            /* Natural height (features-zone absorbs the slack). syncHeights
               publishes the row's max .top-card height here as min-height so
               shorter cards match; content-box, so the height maps straight. */
            flex: 0 0 auto;
            min-height: var(${Et(Nr)}, auto);
        }

        :host([variant='pro']) .mnemonic {
            display: flex;
            align-items: center;
            gap: 12px;
            min-height: var(${Et(Qt[0].prop)}, auto);
        }

        :host([variant='pro']) ::slotted([slot='icons']) {
            width: 24px;
            height: 24px;
        }

        :host([variant='pro']) ::slotted([slot='subtitle']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 700;
            font-size: 16px;
            line-height: 20px;
            letter-spacing: 0;
            color: var(--consonant-merch-card-pro-subtitle-color, #000000);
            flex: 1;
        }

        :host([variant='pro']) .name-description {
            display: flex;
            flex-direction: column;
            gap: 8px;
            /* Hold the row's tallest description so the price starts at the same
               height everywhere. The slack goes to the footer margin, not here. */
            flex: 0 0 auto;
            min-height: var(${Et(Qt[1].prop)}, auto);
        }

        :host([variant='pro']) ::slotted([slot='heading-xs']) {
            margin: 0;
            font-family: 'Adobe Clean Display', 'adobe-clean-display',
                sans-serif;
            font-weight: 900;
            font-size: 24px;
            line-height: 24px;
            letter-spacing: -0.48px;
            color: var(--consonant-merch-card-pro-text-color, #000);
        }

        :host([variant='pro']) ::slotted([slot='body-xs']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0;
            color: var(--consonant-merch-card-pro-text-color, #000);
        }

        :host([variant='pro']) .pricing {
            display: flex;
            flex-direction: column;
            gap: 0;
        }

        :host([variant='pro']) ::slotted([slot='heading-m']) {
            margin: 0;
            font-family: 'Adobe Clean Display', 'adobe-clean-display',
                sans-serif;
            font-weight: 900;
            font-size: 18px;
            line-height: 21px;
            letter-spacing: -0.48px;
            color: var(--consonant-merch-card-pro-text-color, #000);
        }

        :host([variant='pro']) ::slotted([slot='promo-text']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0;
            color: var(--consonant-merch-card-pro-text-muted-color, #000000a3);
        }

        :host([variant='pro']) footer {
            display: flex;
            gap: 8px;
            padding: 0;
            /* Collect the white card's slack here so the CTAs and the secure line
               stay bottom-aligned while the price stays put. Same idiom as fries. */
            margin: auto 0 0;
            background: transparent;
            min-height: auto;
        }

        :host([variant='pro']) footer ::slotted([slot='footer']) {
            display: flex;
            flex-wrap: wrap;
            align-content: flex-start;
            gap: 8px;
            flex: 1;
        }

        :host([variant='pro']) .secure-transaction-label {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0;
            color: var(--consonant-merch-card-pro-text-muted-color, #000000a3);
            padding: 0;
            margin: 0;
            align-self: flex-start;
            flex: 0 0 auto;
            white-space: normal;
        }

        :host([variant='pro']) .secure-transaction-label::before {
            content: '';
            display: inline-block;
            width: 16px;
            height: 16px;
            /* background-image, not a mask — a mask's currentColor rendered the lock too dark */
            background-image: var(--secure-icon);
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
        }

        :host([variant='pro']) .features-zone {
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 24px;
            /* Grow to fill remaining height so card bottoms align across a row. */
            flex: 1 1 auto;
            color: var(--consonant-merch-card-pro-frame-text, #000);
        }

        :host([variant='pro']) .features-zone[hidden] {
            display: none;
        }

        :host([variant='pro']) ::slotted([slot='whats-included']) {
            color: inherit;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        :host([variant='pro']) .whats-included-toggle {
            all: unset;
            display: flex;
            align-items: center;
            padding: 24px;
            cursor: pointer;
            color: var(--consonant-merch-card-pro-frame-text, #000);
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 700;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0;
        }

        /* Expanded state: no bottom padding — features-zone provides spacing */
        :host([variant='pro']) .whats-included-toggle[aria-expanded='true'] {
            padding-bottom: 0;
        }

        :host([variant='pro']) .whats-included-toggle-label {
            flex: 1 0 0;
        }

        :host([variant='pro']) .whats-included-toggle:focus-visible {
            outline: 2px solid #1473e6;
            outline-offset: -2px;
            border-radius: 8px;
        }

        :host([variant='pro']) .whats-included-toggle-chevron {
            width: 20px;
            height: 20px;
            background-color: currentColor;
            mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M10 13.5a.75.75 0 0 1-.53-.22l-5-5a.75.75 0 0 1 1.06-1.06L10 11.69l4.47-4.47a.75.75 0 0 1 1.06 1.06l-5 5a.75.75 0 0 1-.53.22Z'/%3E%3C/svg%3E")
                center / contain no-repeat;
            -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M10 13.5a.75.75 0 0 1-.53-.22l-5-5a.75.75 0 0 1 1.06-1.06L10 11.69l4.47-4.47a.75.75 0 0 1 1.06 1.06l-5 5a.75.75 0 0 1-.53.22Z'/%3E%3C/svg%3E")
                center / contain no-repeat;
            transition: transform 200ms ease;
            flex: 0 0 auto;
        }

        :host([variant='pro'])
            .whats-included-toggle[aria-expanded='true']
            .whats-included-toggle-chevron {
            transform: rotate(180deg);
        }

        :host([variant='pro']) .pricing-line {
            display: flex;
            align-items: baseline;
            flex-wrap: wrap;
            gap: 0;
        }

        :host([variant='pro']) ::slotted([slot='per-unit-label']) {
            font-family: 'Adobe Clean Display', 'adobe-clean-display',
                sans-serif;
            font-weight: 900;
            font-size: 18px;
            line-height: 21px;
            letter-spacing: -0.48px;
            color: var(--consonant-merch-card-pro-text-color, #000);
            margin-inline-start: 4px;
        }

        :host([variant='pro']) .license-zone {
            display: flex;
            flex-direction: column;
            background: var(--consonant-merch-card-pro-bg-subtle, #f8f8f8);
            border-radius: 8px;
            overflow: visible;
        }

        :host([variant='pro']) .license-select {
            position: relative;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
        }

        :host([variant='pro']) .license-select-trigger {
            all: unset;
            box-sizing: border-box;
            width: 100%;
            height: 40px;
            padding: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--consonant-merch-card-pro-control-bg);
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 8px;
            cursor: pointer;
            color: var(--consonant-merch-card-pro-text-color, #000);
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0;
        }

        :host([variant='pro']) .license-select-trigger:focus-visible {
            outline: 2px solid #1473e6;
            outline-offset: 1px;
        }

        /* Open, the trigger's ring escapes around the popover and doubles up
           with the active option's. Let the option carry it. */
        :host([variant='pro'])
            .license-select-trigger[aria-expanded='true']:focus-visible {
            outline: none;
        }

        :host([variant='pro']) .license-select-trigger-text {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        :host([variant='pro']) .license-select-value {
            font-weight: 700;
            color: var(--consonant-merch-card-pro-text-color, #000);
        }

        :host([variant='pro']) .license-select-label {
            font-weight: 700;
            color: var(
                --consonant-merch-card-pro-text-muted-color,
                rgba(0, 0, 0, 0.64)
            );
        }

        :host([variant='pro']) .license-select-chevron {
            width: 16px;
            height: 16px;
            background-color: currentColor;
            mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M10 13.5a.75.75 0 0 1-.53-.22l-5-5a.75.75 0 0 1 1.06-1.06L10 11.69l4.47-4.47a.75.75 0 0 1 1.06 1.06l-5 5a.75.75 0 0 1-.53.22Z'/%3E%3C/svg%3E")
                center / contain no-repeat;
            -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M10 13.5a.75.75 0 0 1-.53-.22l-5-5a.75.75 0 0 1 1.06-1.06L10 11.69l4.47-4.47a.75.75 0 0 1 1.06 1.06l-5 5a.75.75 0 0 1-.53.22Z'/%3E%3C/svg%3E")
                center / contain no-repeat;
            transition: transform 200ms ease;
            flex: 0 0 auto;
        }

        :host([variant='pro'])
            .license-select-trigger[aria-expanded='true']
            .license-select-chevron {
            transform: rotate(180deg);
        }

        :host([variant='pro']) .license-select-popover {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            margin: 0;
            padding: 0;
            list-style: none;
            background: var(--consonant-merch-card-pro-control-bg);
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 8px;
            box-shadow:
                0 7px 15px rgba(0, 0, 0, 0.1),
                0 27px 27px rgba(0, 0, 0, 0.09),
                0 61px 36px rgba(0, 0, 0, 0.05),
                0 108px 43px rgba(0, 0, 0, 0.01);
            overflow: hidden;
            z-index: 10;
        }

        :host([variant='pro']) .license-select-popover[hidden] {
            display: none;
        }

        /* Mirror the collapsed trigger so open/close is seamless: 39px (trigger
           40px − the popover's 1px top border) with the trigger's 12px padding. */
        :host([variant='pro']) .license-select-popover-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 39px;
            box-sizing: border-box;
            padding: 12px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 14px;
            line-height: 18px;
            font-weight: 700;
            letter-spacing: 0;
            cursor: pointer;
            background: var(--consonant-merch-card-pro-control-bg);
        }

        :host([variant='pro']) .license-select-option {
            padding: 16px 12px;
            cursor: pointer;
            color: var(--consonant-merch-card-pro-text-color, #000);
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 14px;
            line-height: 18px;
            font-weight: 700;
            letter-spacing: 0;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        /* An outline follows its own element's radius, so square corners got
           clipped by the popover. Match its inner radius (8px less the border). */
        :host([variant='pro']) .license-select-option:last-child {
            border-bottom: none;
            border-bottom-left-radius: 7px;
            border-bottom-right-radius: 7px;
        }

        :host([variant='pro']) .license-select-option:hover,
        :host([variant='pro']) .license-select-option.highlighted {
            background: var(--consonant-merch-card-pro-control-hover-bg);
        }

        /* The selected option has to stand out from the rest at 3:1, not just
           from the white popover by a shade (WCAG 1.4.11). After :hover so a
           hovered selected row stays blue. */
        :host([variant='pro']) .license-select-option.selected {
            background: var(--consonant-merch-card-pro-control-selected-bg);
            color: var(--consonant-merch-card-pro-control-selected-text);
        }

        /* Focus stays on the trigger, so the highlighted option needs its own
           visible ring (WCAG 2.4.7). */
        :host([variant='pro']) .license-select-option.highlighted {
            outline: 2px solid #1473e6;
            outline-offset: -2px;
        }

        /* The blue ring disappears on the blue selected row, so draw it white
           and inset it to keep blue on both sides. */
        :host([variant='pro']) .license-select-option.selected.highlighted {
            outline-color: var(
                --consonant-merch-card-pro-control-selected-text
            );
            outline-offset: -4px;
        }

        :host([variant='pro']) .callout {
            padding: 8px 12px 12px 12px;
            color: var(--consonant-merch-card-pro-text-color, #000);
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 12px;
            line-height: 16px;
            letter-spacing: 0;
            font-weight: 700;
            text-align: start;
        }

        :host([variant='pro']) ::slotted([slot='callout-content']) {
            margin: 0;
        }

        :host([variant='pro']) .add-on {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 16px 12px;
            /* Gradient border: white fill on padding-box, gradient on border-box
               so only the 1px border shows it. */
            background:
                linear-gradient(
                        var(--consonant-merch-card-pro-bg-default, #fff),
                        var(--consonant-merch-card-pro-bg-default, #fff)
                    )
                    padding-box,
                linear-gradient(45deg, #8d88f2 0%, #8d88f2 48.8%, #eb1000 100%)
                    border-box;
            border: 1px solid transparent;
            border-radius: 8px;
            box-sizing: border-box;
        }

        /* Grey add-on style (MWPW-208925): flat light-grey frame, no AI
           gradient — the sparkle goes with it since it is a gradient asset. */
        :host([variant='pro']) .add-on[data-addon-grey] {
            background: var(--consonant-merch-card-pro-bg-default, #fff);
            border: 1px solid #e4e4e4;
        }

        :host([variant='pro']) .add-on[data-addon-grey]::after {
            display: none;
        }

        :host([variant='pro']) .add-on::after {
            content: '';
            width: 16px;
            height: 16px;
            flex: 0 0 auto;
            /* Vertical red→purple sparkle (red on top, per the flipped asset). */
            background: linear-gradient(180deg, #eb1000 0%, #8d88f2 100%);
            mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M7.498 15.61C6.369 11.154 4.842 9.627 .39 8.502c-.52-.133-.52-.871 0-1.004C4.846 6.37 6.373 4.842 7.498 .39c.133-.52.871-.52 1.004 0C9.63 4.846 11.158 6.373 15.61 7.498c.52.133.52.871 0 1.004C11.154 9.63 9.627 11.158 8.502 15.61c-.133.52-.871.52-1.004 0Z'/%3E%3C/svg%3E")
                center / contain no-repeat;
            -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M7.498 15.61C6.369 11.154 4.842 9.627 .39 8.502c-.52-.133-.52-.871 0-1.004C4.846 6.37 6.373 4.842 7.498 .39c.133-.52.871-.52 1.004 0C9.63 4.846 11.158 6.373 15.61 7.498c.52.133.52.871 0 1.004C11.154 9.63 9.627 11.158 8.502 15.61c-.133.52-.871.52-1.004 0Z'/%3E%3C/svg%3E")
                center / contain no-repeat;
        }

        /* C2 desktop breakpoint: toggle disappears, features-zone is always visible inline */
        @media screen and ${Et(re)} {
            :host([variant='pro']) .whats-included-toggle {
                display: none;
            }
            :host([variant='pro']) .features-zone[hidden] {
                display: flex;
            }
        }

        /* EDU (Wide): standalone two-column card — pricing left, features
           right, always shown. Stacks vertically below tablet. */
        :host([variant='pro'][size='edu']) .whats-included-toggle {
            display: none;
        }

        :host([variant='pro'][size='edu']) .features-zone[hidden] {
            display: flex;
        }

        :host([variant='pro'][size='edu']) footer {
            margin: unset;
        }

        @media screen and ${Et(x)} {
            :host([variant='pro'][size='edu']) {
                flex-direction: row;
                gap: 8px;
            }

            :host([variant='pro'][size='edu']) .top-card,
            :host([variant='pro'][size='edu']) .features-zone {
                flex: 1 1 50%;
                min-width: 0;
                /* border-box so the 40px vs 24px padding delta doesn't skew
                   the split — Figma has equal 526+526 total column widths. */
                box-sizing: border-box;
            }

            /* EDU right panel padding is 40px at tablet+; mobile keeps the base
               24px (Figma 4375:120476 desktop / 4375:120499 mobile). */
            :host([variant='pro'][size='edu']) .features-zone {
                padding: 40px;
            }

            /* edu is a standalone card, not a grid row, so the price shouldn't
               stick to the bottom. Stop .name-description from absorbing the
               slack (from the 50/50 stretch) — pack content to the top per
               Figma (Top of Card primaryAxisAlign=MIN), slack falls to the
               bottom. */
            :host([variant='pro'][size='edu']) .name-description {
                flex: 0 0 auto;
            }
        }
    `);var St=Jt;import{html as Dr,css as pi}from"./lit-all.min.js";var mo=`
:root {
  --consonant-merch-card-product-width: 300px;
}

merch-card[variant="product"] {
    --consonant-merch-card-callout-icon-size: 18px;
    width: var(--consonant-merch-card-product-width);
}

merch-card[variant="product"][id] [slot='callout-content'] > div > div,
merch-card[variant="product"][id] [slot="callout-content"] > p {
    position: relative;
    padding: 2px 10px 3px;
    background: #D9D9D9;
    color: var(--text-color);
}

merch-card[variant="product"] [slot="callout-content"] > p:has(> .icon-button) {
  padding-inline-end: 36px;
}

merch-card[variant="product"] a.spectrum-Link--secondary {
  color: inherit;
}

merch-card[variant="product"] a.secondary-link {
  color: #000;
  text-decoration: underline;
}

merch-card[variant="product"][id] span[data-template="legal"] {
    display: flex;
    flex-direction: column;
    margin-top: 8px;
    color: var(----merch-color-grey-80);
    font-size: 14px;
    font-style: italic;
    font-weight: 400;
    line-height: 21px;
}

merch-card[variant="product"][id] .price.price-legal .price-unit-type:not(.disabled)::before,
merch-card[variant="product"][id] .price.price-legal .disabled + span:not(.disabled)::before {
    content: initial;
}

merch-card[variant="product"] [slot="footer"] a.con-button.primary {
    border: 2px solid var(--text-color);
    color: var(--text-color);
}

merch-card[variant="product"] [slot="footer"] a.con-button.primary:hover {
    background-color: var(--color-black);
    border-color: var(--color-black);
    color: var(--color-white);
}

merch-card-collection.product merch-card {
    width: auto;
    height: 100%;
}

  merch-card[variant="product"] merch-addon {
    padding-left: 4px;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-right: 8px;
    border-radius: .5rem;
    background: var(--merch-addon-background);
    font-family: var(--merch-body-font-family, 'Adobe Clean');
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="product"] [slot="body-xs"] [is="inline-price"] {
    font-weight: inherit;
  }

  merch-card[variant="product"] merch-addon [is="inline-price"] {
    font-weight: bold;
    pointer-events: none;
  }

  merch-card[variant="product"] merch-addon::part(checkbox) {
      height: 18px;
      width: 18px;
      margin: 14px 12px 0 8px;
  }

  merch-card[variant="product"] merch-addon::part(label) {
    display: flex;
    flex-direction: column;
    padding: 8px 4px 8px 0;
    width: 100%;
  }

/* Sections inside tabs/fragments that don't receive the .product class.
   Make .content wrapper transparent so the section grid applies directly to cards.
   Only when every card in the section is a product card - otherwise a mixed
   section (e.g. segment cards with one product card) would have its layout
   hijacked by this fallback despite already having an explicit variant class. */
.one-merch-card:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))) .content,
.two-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))) .content,
.three-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))) .content,
.four-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))) .content {
  display: contents;
}

.one-merch-card.section merch-card[variant="product"],
.one-merch-card:has(merch-card[variant="product"]) merch-card[variant="product"] {
    width: auto;
    max-width: var(--consonant-merch-card-product-width);
    margin: 0 auto;
}

/* grid style for product */
.one-merch-card.product,
.two-merch-cards.product,
.three-merch-cards.product,
.four-merch-cards.product,
.one-merch-card:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))),
.two-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))),
.three-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))),
.four-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))) {
    grid-template-columns: var(--consonant-merch-card-product-width);
}

/* Tablet */
@media screen and ${x} {
    .two-merch-cards.product,
    .three-merch-cards.product,
    .four-merch-cards.product,
    .two-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))),
    .three-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))),
    .four-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))) {
        grid-template-columns: repeat(2, var(--consonant-merch-card-product-width));
    }
}

/* desktop */
@media screen and ${C} {
  :root {
    --consonant-merch-card-product-width: 378px;
  }

  .three-merch-cards.product,
  .three-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))) {
      grid-template-columns: repeat(3, var(--consonant-merch-card-product-width));
  }

  .four-merch-cards.product,
  .four-merch-cards:has(merch-card[variant="product"]):not(:has(merch-card:not([variant="product"]))) {
      grid-template-columns: repeat(auto-fit, var(--consonant-merch-card-product-width));
  }
}

merch-card[variant="product"] {
    merch-whats-included merch-mnemonic-list,
    merch-whats-included [slot="heading"] {
        width: 100%;
    }
}

merch-card[variant="product"] .merch-short-description {
    display: inline-block;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-style: italic;
    font-weight: 400;
    line-height: 21px;
}

merch-card[variant="product"] .merch-short-description .icon-button {
    position: relative;
    display: inline-flex;
    text-decoration: none;
    border-bottom: none;
    width: 18px;
    height: 18px;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14"><path d="M7 .778A6.222 6.222 0 1 0 13.222 7 6.222 6.222 0 0 0 7 .778zM6.883 2.45a1.057 1.057 0 0 1 1.113.998q.003.05.001.1a1.036 1.036 0 0 1-1.114 1.114A1.052 1.052 0 0 1 5.77 3.547 1.057 1.057 0 0 1 6.784 2.45q.05-.002.1.001zm1.673 8.05a.389.389 0 0 1-.39.389H5.834a.389.389 0 0 1-.389-.389v-.778a.389.389 0 0 1 .39-.389h.388V7h-.389a.389.389 0 0 1-.389-.389v-.778a.389.389 0 0 1 .39-.389h1.555a.389.389 0 0 1 .389.39v3.5h.389a.389.389 0 0 1 .389.388z"/></svg>');
    background-size: 18px;
    background-repeat: no-repeat;
    background-position: center;
}

merch-card[variant="product"] .merch-short-description .icon-button::before {
    content: attr(data-tooltip);
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 100%;
    margin-left: 8px;
    max-width: 140px;
    width: max-content;
    padding: 10px;
    border-radius: 5px;
    background: #0469E3;
    color: #fff;
    text-align: left;
    display: none;
    z-index: 10;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 16px;
}

merch-card[variant="product"] .merch-short-description .icon-button::after {
    content: "";
    position: absolute;
    left: 102%;
    margin-left: -8px;
    top: 50%;
    transform: translateY(-50%);
    border: 8px solid transparent;
    border-right-color: #0469E3;
    display: none;
    z-index: 10;
}

merch-card[variant="product"] .merch-short-description .icon-button.tooltip-visible::before,
merch-card[variant="product"] .merch-short-description .icon-button.tooltip-visible::after {
    display: block;
}

@media screen and ${O} {
    merch-card[variant="product"] .merch-short-description {
        display: inline-block;
    }

    merch-card[variant="product"] .merch-short-description .icon-button {
        vertical-align: middle;
    }

    merch-card[variant="product"] .merch-short-description .icon-button::before {
        top: unset;
        left: calc(50% - 120px);
        transform: none;
        margin-left: 0;
        bottom: 100%;
        margin-bottom: 8px;
    }

    merch-card[variant="product"] .merch-short-description .icon-button::after {
        top: unset;
        left: 50%;
        margin-left: -8px;
        transform: none;
        bottom: calc(100% - 8px);
        border-color: #0469E3 transparent transparent transparent;
        border-right-color: transparent;
    }
}

`;var po={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},prices:{tag:"p",slot:"heading-xs"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},shortDescription:{tag:"div",slot:"short-description"},mnemonics:{size:"l"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},secureLabel:!0,planType:!0,addon:!0,addonBackground:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"color-yellow-300-variation"},allowedBadgeColors:["color-yellow-300-variation","color-gray-300-variation","color-gray-700-variation","color-green-900-variation","gradient-purple-blue"],allowedBorderColors:["color-yellow-300-variation","color-gray-300-variation","color-green-900-variation","gradient-purple-blue"],borderColor:{attribute:"border-color"},whatsIncluded:{tag:"div",slot:"whats-included"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},Y,Ue=class extends b{constructor(e){super(e);f(this,Y);this.postCardUpdateHook=this.postCardUpdateHook.bind(this),this.updatePriceQuantity=this.updatePriceQuantity.bind(this)}getGlobalCSS(){return mo}priceOptionsProvider(e,t){e.dataset.template===P&&(t.displayPlanType=this.card?.settings?.displayPlanType??!1,(e.dataset.template==="strikethrough"||e.dataset.template==="price")&&(t.displayPerUnit=!1))}adjustProductBodySlots(){if(this.card.getBoundingClientRect().width===0)return;["heading-xs","body-xxs","body-xs","promo-text","callout-content","addon","body-lower"].forEach(t=>this.updateCardElementMinHeight(this.card.shadowRoot.querySelector(`slot[name="${t}"]`),t))}renderLayout(){return Dr` ${this.badge}
            <div class="body" aria-live="polite">
                <slot name="icons"></slot>
                <slot name="heading-xs"></slot>
                ${this.promoBottom?"":Dr`<slot name="promo-text"></slot>`}
                <slot name="body-xs"></slot>
                <slot name="short-description"></slot>
                <slot name="addon"></slot>
                ${this.promoBottom?Dr`<slot name="promo-text"></slot>`:""}
                <slot name="whats-included"></slot>
                <slot name="callout-content"></slot>
                <slot name="quantity-select"></slot>
                <slot name="body-lower"></slot>
                <slot name="badge"></slot>
            </div>
            <hr />
            ${this.secureLabelFooter}`}connectedCallbackHook(){this.handleResize=()=>{h(this,Y)&&cancelAnimationFrame(h(this,Y)),g(this,Y,requestAnimationFrame(()=>{g(this,Y,null),this.postCardUpdateHook()}))},this.adjustShortDescriptionBound=this.adjustShortDescription.bind(this),window.addEventListener("resize",this.handleResize),this.card.addEventListener(D,this.updatePriceQuantity),this.card.addEventListener(ge,this.adjustShortDescriptionBound)}disconnectedCallbackHook(){this.handleResize&&(window.removeEventListener("resize",this.handleResize),this.handleResize=null),h(this,Y)&&(cancelAnimationFrame(h(this,Y)),g(this,Y,null)),this.card.removeEventListener(D,this.updatePriceQuantity),this.card.removeEventListener(ge,this.adjustShortDescriptionBound)}adjustShortDescription(){let e=this.card.querySelector('[slot="short-description"]');if(!e?.textContent?.trim())return;let t=this.card.querySelector('span[data-template="legal"]');if(!t)return;this.card.querySelector(".merch-short-description")?.remove();let o=document.createElement("span");o.className="merch-short-description",o.innerHTML=e.innerHTML,o.querySelectorAll("p").forEach(n=>n.replaceWith(...n.childNodes)),o.querySelectorAll(".icon-button").forEach(n=>{n.dataset.eventsWired||(n.dataset.eventsWired="1",["mouseenter","focus"].forEach(i=>n.addEventListener(i,()=>n.classList.add("tooltip-visible"))),["mouseleave","blur"].forEach(i=>n.addEventListener(i,()=>n.classList.remove("tooltip-visible"))),n.addEventListener("keydown",i=>{i.key==="Escape"&&n.classList.remove("tooltip-visible")}))}),t.after(o),e.hidden=!0}async postCardUpdateHook(){this.card.isConnected&&(this.adjustAddon(),k.isMobile||this.adjustProductBodySlots(),this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook())}async adjustLegal(){if(!(this.legalAdjusted||!this.card.id))try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let e=this.mainPrice;if(!e)return;let t=e.cloneNode(!0);if(await e.onceSettled(),!e?.options)return;e.options.displayTax&&(e.dataset.displayTax="false"),e.options.displayPlanType&&(e.dataset.displayPlanType="false"),t.setAttribute("data-template","legal"),t.dataset.displayPerUnit="false",e.dataset.template==="optical"&&(t.dataset.displayPlanType="false"),e.closest('[slot="heading-xs"]').appendChild(t),await t.onceSettled()}catch{}}get headingXSSlot(){return this.card.shadowRoot.querySelector('slot[name="heading-xs"]').assignedElements()[0]}get mainPrice(){let e=`[slot="heading-xs"] ${y}`;return this.card.querySelector(`${e}[data-template="price"], ${e}[data-template="optical"]`)}updatePriceQuantity({detail:e}){!this.mainPrice||!e?.option||(this.mainPrice.dataset.quantity=e.option)}toggleAddon(e){let t=this.mainPrice,o=this.headingXSSlot;if(!t&&o){let n=e?.getAttribute("plan-type"),i=null;if(e&&n&&(i=e.querySelector(`p[data-plan-type="${n}"]`)?.querySelector('span[is="inline-price"]')),this.card.querySelectorAll('p[slot="heading-xs"]').forEach(c=>c.remove()),e.checked){if(i){let c=_("p",{class:"addon-heading-xs-price-addon",slot:"heading-xs"},i.innerHTML);this.card.appendChild(c)}}else{let c=_("p",{class:"card-heading",id:"free",slot:"heading-xs"},"Free");this.card.appendChild(c)}}}async adjustAddon(){await this.card.updateComplete;let e=this.card.addon;if(!e)return;let t=this.mainPrice,o=this.card.planType;t&&(await t.onceSettled?.(),o=t.value?.[0]?.planType),o&&(e.planType=o)}};Y=new WeakMap,d(Ue,"variantStyle",pi`
        :host([variant='product']) {
            background:
                linear-gradient(white, white) padding-box,
                var(--consonant-merch-card-border-color, #dadada) border-box;
            border: 1px solid transparent;
        }

        :host([variant='product']) > slot:not([name='icons']) {
            display: block;
        }
        :host([variant='product']) slot[name='body-xs'] {
            min-height: var(--consonant-merch-card-product-body-xs-height);
            display: block;
        }
        :host([variant='product']) slot[name='heading-xs'] {
            min-height: var(--consonant-merch-card-product-heading-xs-height);
            display: block;
        }
        :host([variant='product']) slot[name='body-xxs'] {
            min-height: var(--consonant-merch-card-product-body-xxs-height);
            display: block;
        }
        :host([variant='product']) slot[name='promo-text'] {
            min-height: var(--consonant-merch-card-product-promo-text-height);
            display: block;
        }
        :host([variant='product']) slot[name='callout-content'] {
            min-height: var(
                --consonant-merch-card-product-callout-content-height
            );
            display: block;
        }
        :host([variant='product']) slot[name='short-description'] {
            display: block;
        }
        :host([variant='product']) slot[name='addon'] {
            min-height: var(--consonant-merch-card-product-addon-height);
        }

        :host([variant='product']:not([id])) hr {
            display: none;
        }

        :host([variant='product']) ::slotted(h3[slot='heading-xs']) {
            max-width: var(--consonant-merch-card-heading-xs-max-width, 100%);
        }

        :host([variant='product']) .secure-transaction-label {
            color: rgb(80, 80, 80);
            line-height: var(--consonant-merch-card-detail-xs-line-height);
        }
    `);import{html as gi,css as ui}from"./lit-all.min.js";var go=`
merch-card[variant="brand-concierge-product"] {
    width: 100%;
    min-width: 248px;
    max-width: 378px;
}

merch-card[variant="brand-concierge-product"] [slot="badge"] {
    position: absolute;
    top: 16px;
    inset-inline-end: 16px;
}

merch-card[variant="brand-concierge-product"] merch-badge {
    --merch-badge-border-radius: 7px;
    padding: 7px 10px;
    border: none;
    font-family: 'Adobe Clean Spectrum VF', 'Adobe Clean', sans-serif;
    font-weight: 500;
    line-height: 18px;
    inset-inline-start: 0;
}

merch-card[variant="brand-concierge-product"] [slot="heading-s"] {
    font-weight: 700;
    color: var(--merch-color-grey-80);
}

merch-card[variant="brand-concierge-product"] [slot="heading-xs"] {
    display: block;
}

merch-card[variant="brand-concierge-product"] [slot="heading-xs"] span.price-strikethrough {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
    font-weight: 400;
    color: var(--ah-gray-500);
}

merch-card[variant="brand-concierge-product"] [slot="heading-xs"] span.price:not(.price-strikethrough):not(.price-legal),
merch-card[variant="brand-concierge-product"] [slot="heading-xs"] .price-legal .price-unit-type:not(.disabled) {
    font-size: var(--consonant-merch-card-heading-xs-font-size);
    line-height: var(--consonant-merch-card-heading-xs-line-height);
    font-weight: 700;
    color: var(--consonant-merch-card-heading-xxxs-color);
}

merch-card[variant="brand-concierge-product"] [slot="heading-xs"] span[is="inline-price"][data-template="legal"] {
    display: inline;
    width: auto;
    font-size: var(--consonant-merch-card-body-xxs-font-size);
    line-height: var(--consonant-merch-card-body-xxs-line-height);
    font-weight: 400;
}

merch-card[variant="brand-concierge-product"] [slot="heading-xs"] .price-legal {
    color: var(--merch-color-grey-80);
}

merch-card[variant="brand-concierge-product"] [slot="body-xs"],
merch-card[variant="brand-concierge-product"] [slot="promo-text"] {
    color: var(--merch-color-grey-80);
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
    font-weight: 400;
    min-height: 0;
}

merch-card[variant="brand-concierge-product"] [slot="body-xs"] a,
merch-card[variant="brand-concierge-product"] [slot="promo-text"] a {
    color: #3b63fb;
}

merch-card[variant="brand-concierge-product"] [slot="body-xs"] a.spectrum-Link--secondary,
merch-card[variant="brand-concierge-product"] [slot="promo-text"] a.spectrum-Link--secondary {
    color: inherit;
}

merch-card[variant="brand-concierge-product"] [slot="heading-xs"] .price-plan-type:not(.disabled) {
    display: block;
    margin-inline-start: 0;
}
`;var uo={cardName:{attribute:"name"},mnemonics:{size:"l"},badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","gradient-purple-blue"],title:{tag:"h3",slot:"heading-s"},prices:{tag:"p",slot:"heading-xs"},planType:!0,promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},ctas:{slot:"footer",size:"m"},style:"consonant"},je=class extends b{getGlobalCSS(){return go}priceOptionsProvider(r,e){r.dataset.template===P&&(e.displayPlanType=this.card?.settings?.displayPlanType??!1)}async adjustLegal(){if(!(this.legalAdjusted||!this.card.id))try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let r=this.card.querySelector(`[slot="heading-xs"] ${y}[data-template="price"]`);if(!r)return;let e=r.cloneNode(!0);if(await r.onceSettled(),!r.options)return;r.options.displayPerUnit&&(r.dataset.displayPerUnit="false"),r.options.displayTax&&(r.dataset.displayTax="false"),r.options.displayPlanType&&(r.dataset.displayPlanType="false"),e.setAttribute("data-template","legal"),r.parentNode.insertBefore(e,r.nextSibling),await e.onceSettled()}catch{}}async postCardUpdateHook(){this.card.isConnected&&(this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook())}renderLayout(){return gi` ${this.badge}
            <div class="body">
                <slot name="icons"></slot>
                <slot name="badge"></slot>
                <slot name="heading-s"></slot>
                <slot name="heading-xs"></slot>
                <slot name="promo-text"></slot>
                <slot name="body-xs"></slot>
            </div>
            <footer><slot name="footer"></slot></footer>
            <slot></slot>`}};d(je,"variantStyle",ui`
        :host([variant='brand-concierge-product']) {
            font-weight: 400;
            background:
                linear-gradient(white, white) padding-box,
                var(--consonant-merch-card-border-color, #dadada) border-box;
            border: 1px solid transparent;
        }

        :host([variant='brand-concierge-product']) .body {
            padding: 16px;
            gap: 8px;
        }

        :host([variant='brand-concierge-product']) footer {
            padding: 0px 16px 16px;
            gap: 8px;
        }
    `);import{html as Ir,css as fi}from"./lit-all.min.js";var fo=`
:root {
  --consonant-merch-card-segment-width: 378px;
}

merch-card[variant="segment"] {
  max-width: var(--consonant-merch-card-segment-width);
}

/* grid style for segment */
.one-merch-card.segment,
.two-merch-cards.segment,
.three-merch-cards.segment,
.four-merch-cards.segment,
.one-merch-card:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))),
.two-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))),
.three-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))),
.four-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))) {
  grid-template-columns: minmax(276px, var(--consonant-merch-card-segment-width));
}

/* Sections inside tabs/fragments that don't receive the .segment class.
   Make .content wrapper transparent so the section grid applies directly to cards.
   Only when every card in the section is a segment card - otherwise a mixed
   section (e.g. segment cards with one product card) would have its layout
   hijacked by this fallback despite already having an explicit variant class. */
.one-merch-card:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))) .content,
.two-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))) .content,
.three-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))) .content,
.four-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))) .content {
  display: contents;
}

.one-merch-card.section merch-card[variant="segment"],
.one-merch-card:has(merch-card[variant="segment"]) merch-card[variant="segment"] {
    margin: 0 auto;
}

.three-merch-cards.section merch-card[variant="segment"],
.four-merch-cards.section merch-card[variant="segment"],
.three-merch-cards:has(merch-card[variant="segment"]) merch-card[variant="segment"],
.four-merch-cards:has(merch-card[variant="segment"]) merch-card[variant="segment"] {
    max-width: 302px;
}

/* A non-segment card (e.g. variant="product") mixed into an explicitly
   segment-classed section should still size like its segment siblings
   instead of using its own variant's fixed width. */
.one-merch-card.segment merch-card:not([variant="segment"]),
.two-merch-cards.segment merch-card:not([variant="segment"]),
.three-merch-cards.segment merch-card:not([variant="segment"]),
.four-merch-cards.segment merch-card:not([variant="segment"]) {
    width: auto;
    max-width: var(--consonant-merch-card-segment-width);
}

/* Mobile */
@media screen and ${S} {
  :root {
    --consonant-merch-card-segment-width: 276px;
  }
}

@media screen and ${x} {
  :root {
    --consonant-merch-card-segment-width: 276px;
  }

  .two-merch-cards.segment,
  .three-merch-cards.segment,
  .four-merch-cards.segment,
  .two-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))),
  .three-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))),
  .four-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))) {
      grid-template-columns: repeat(2, minmax(302px, var(--consonant-merch-card-segment-width)));
  }
}

/* desktop */
@media screen and ${C} {
  :root {
    --consonant-merch-card-segment-width: 276px;
  }

  .three-merch-cards.segment,
  .three-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))) {
      grid-template-columns: repeat(3, minmax(276px, var(--consonant-merch-card-segment-width)));
  }

  .four-merch-cards.segment,
  .four-merch-cards:has(merch-card[variant="segment"]):not(:has(merch-card:not([variant="segment"]))) {
      grid-template-columns: repeat(4, minmax(276px, var(--consonant-merch-card-segment-width)));
  }
}

merch-card[variant="segment"] [slot='callout-content'] > div > div,
merch-card[variant="segment"] [slot="callout-content"] > p {
    position: relative;
    padding: 2px 10px 3px;
    background: #D9D9D9;
    color: var(--text-color);
}

merch-card[variant="segment"] [slot="callout-content"] > p:has(> .icon-button) {
  padding-inline-end: 36px;
}

merch-card[variant="segment"] a.spectrum-Link--secondary {
  color: inherit;
}

merch-card[variant="segment"][id] span[data-template="legal"] {
    display: block;
    color: var(----merch-color-grey-80);
    font-size: 14px;
    font-style: italic;
    font-weight: 400;
    line-height: 21px;
}

merch-card[variant="segment"][id] .price.price-legal .price-unit-type:not(.disabled)::before,
merch-card[variant="segment"][id] .price.price-legal .disabled + span:not(.disabled)::before {
    content: initial;
}

merch-card[variant="segment"] [slot="footer"] a.con-button.primary {
    border: 2px solid var(--text-color);
    color: var(--text-color);
}

merch-card[variant="segment"] [slot="footer"] a.con-button.primary:hover {
    background-color: var(--color-black);
    border-color: var(--color-black);
    color: var(--color-white);
}

merch-card-collection.segment merch-card {
    width: auto;
    height: 100%;
}
`;var bo={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},prices:{tag:"p",slot:"heading-xs"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},callout:{tag:"div",slot:"callout-content"},planType:!0,secureLabel:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"color-red-700-variation"},allowedBadgeColors:["color-yellow-300-variation","color-gray-300-variation","color-gray-700-variation","color-green-900-variation","color-red-700-variation","gradient-purple-blue"],allowedBorderColors:["color-yellow-300-variation","color-gray-300-variation","color-green-900-variation","color-red-700-variation","gradient-purple-blue"],borderColor:{attribute:"border-color"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},Ge=class extends b{constructor(r){super(r)}priceOptionsProvider(r,e){r.dataset.template===P&&(e.displayPlanType=this.card?.settings?.displayPlanType??!1,(r.dataset.template==="strikethrough"||r.dataset.template==="price")&&(e.displayPerUnit=!1))}getGlobalCSS(){return fo}get badgeElement(){return this.card.querySelector('[slot="badge"]')}get mainPrice(){return this.card.querySelector(`[slot="heading-xs"] ${y}[data-template="price"]`)}async postCardUpdateHook(){this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook()}async adjustLegal(){if(!(this.legalAdjusted||!this.card.id))try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let r=this.mainPrice;if(!r)return;let e=r.cloneNode(!0);if(await r.onceSettled(),!r?.options)return;r.options.displayTax&&(r.dataset.displayTax="false"),r.options.displayPlanType&&(r.dataset.displayPlanType="false"),e.setAttribute("data-template","legal"),e.dataset.displayPerUnit="false",r.parentNode.insertBefore(e,r.nextSibling),await e.onceSettled()}catch{}}renderLayout(){return Ir`
            ${this.badge}
            <div class="body">
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${this.promoBottom?"":Ir`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`}
                <slot name="body-xs"></slot>
                ${this.promoBottom?Ir`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`:""}
                <slot name="badge"></slot>
            </div>
            <hr />
            ${this.secureLabelFooter}
        `}};d(Ge,"variantStyle",fi`
        :host([variant='segment']) {
            min-height: 214px;
            background:
                linear-gradient(white, white) padding-box,
                var(--consonant-merch-card-border-color, #dadada) border-box;
            border: 1px solid transparent;
        }
        :host([variant='segment']) ::slotted(h3[slot='heading-xs']) {
            max-width: var(--consonant-merch-card-heading-xs-max-width, 100%);
        }
    `);import{html as bi,css as vi}from"./lit-all.min.js";var vo=`

    merch-card[variant='media'] {
        border: 0;
        padding: 24px 0;
    }

    merch-card[variant='media'] div[slot='bg-image'] img {
        border-radius: 0;
        max-height: unset;
    }

    merch-card[variant='media'] div[slot='footer'] .con-button {
        width: fit-content;
    }

    merch-card[variant='media'] p[slot='body-xxs'] {
        margin-bottom: 8px;
        font-weight: 700;
        text-transform: uppercase;
        line-height: 15px;
    }

    merch-card[variant='media'] h3[slot='heading-xs'] {
        margin-bottom: 16px;
        font-size: 28px;
        line-height: 35px;
    }

    merch-card[variant='media'] div[slot='body-xs'] {
        margin-bottom: 24px;
        font-size: 16px;
        line-height: 24px;
    }

    merch-card[variant='media'] div[slot='body-xs'] .spectrum-Link--secondary {
        color: inherit;
    }

    @media screen and (min-width: 600px) {
        merch-card[variant='media'] {
            max-width: 1000px;
        }

        merch-card[variant='media'] div[slot='bg-image'] {
            display: flex;
            align-items: center;
            height: 100%;
        }        
    }

    @media screen and (max-width: 430px) {
        div.dialog-modal .content merch-card[variant='media'] {
            width: 250px;
        }
    }

    @media screen and (max-width: 600px) {
        div.dialog-modal merch-card[variant='media'] {
            width: 320px;
            margin-right: auto;
            margin-left: auto;
            padding: 70px 0;
        }

        .dialog-modal merch-card[variant='media'] div[slot='body-xs'] {
            font-size: 14px;
        }
    }

    @media screen and (min-width: 1200px) {
        merch-card[variant='media'] h3[slot='heading-xs'] {
            font-size: 36px;
            line-height: 45px;
        }
    }

    @media (min-width: 1366px) {
        div.dialog-modal merch-card[variant='media'] {
            margin: 0 100px;
        }
    }

    @media (min-width: 769px) and (max-width: 1000px) {
        div.dialog-modal merch-card[variant='media'] {
            width: 500px;
        }
    }

    @media screen and (min-width: 600px) and (max-width: 680px) {
        div.dialog-modal merch-card[variant='media'] {
            width: 320px;
        }
    }

    @media screen and (min-width: 681px) and (max-width: 768px) {
        div.dialog-modal merch-card[variant='media'] {
            width: 440px;
        }
    }

    @media screen and (min-width: 600px) and (max-width: 768px) {
        div.dialog-modal merch-card[variant='media'] div[slot='bg-image'] img {
            min-height: unset;
        }
    }

    .dialog-modal merch-card[variant='media'] {
        padding: 80px 0;
        margin: 0 50px;
        width: 700px;
    }

`;var xo={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"body-xxs"},description:{tag:"div",slot:"body-xs"},ctas:{slot:"footer",size:"m"},backgroundImage:{tag:"div",slot:"bg-image"},style:"consonant"},Ve=class extends b{constructor(r){super(r)}getGlobalCSS(){return vo}removeFocusFromModalClose(){let r=this.card.closest(".dialog-modal");r&&r.querySelector(".dialog-close")?.blur()}async postCardUpdateHook(){this.removeFocusFromModalClose(),await super.postCardUpdateHook()}renderLayout(){return bi`
            <div class="media-row">
                <div class="text">
                    <slot name="body-xxs"></slot>
                    <slot name="heading-xs"></slot>
                    <slot name="body-xs"></slot>
                    <slot name="footer"></slot>
                </div>
                <div class="image">
                    <slot name="bg-image"></slot>
                </div>
            </div>
        `}};d(Ve,"variantStyle",vi`
        :host([variant='media']) .media-row {
            display: flex;
            gap: 24px;
        }

        :host([variant='media']) .text {
            display: flex;
            justify-content: center;
            flex-direction: column;
        }

        @media screen and (max-width: 600px) {
            :host([variant='media']) .media-row {
                flex-direction: column-reverse;
            }
        }

        @media screen and (min-width: 600px) {
            :host([variant='media']) .media-row {
                gap: 32px;
            }
        }

        @media screen and (min-width: 1200px) {
            :host([variant='media']) .media-row {
                gap: 40px;
            }
        }
    `);import{html as Fr,css as xi}from"./lit-all.min.js";var yo=`
:root {
  --consonant-merch-card-special-offers-width: 302px;
	--merch-card-collection-card-width: var(--consonant-merch-card-special-offers-width);
}

merch-card[variant="special-offers"] span[is="inline-price"][data-template="promo-strikethrough"],
merch-card[variant="special-offers"] span[is="inline-price"][data-template="strikethrough"] {
  font-size: var(--consonant-merch-card-body-xs-font-size);
	font-weight: 400;
}

merch-card[variant="special-offers"] span[is="inline-price"][data-template="price"] {
  font-weight: 700;
}

merch-card[variant="special-offers"] [slot="legal"],
merch-card[variant="special-offers"] span[is="inline-price"][data-template="legal"] {
  display: block;
  font-size: var(--consonant-merch-card-body-xs-font-size);
  font-weight: 400;
  margin-bottom: calc(-1 * var(--consonant-merch-spacing-xxs));
}

merch-card[variant="special-offers"] span[is="inline-price"][data-template="legal"] .price-tax-inclusivity {
  display: none;
}

merch-card[variant="special-offers"] .price-plan-type {
  font-style: italic;
}


/* grid style for special-offers */
.one-merch-card.special-offers,
.two-merch-cards.special-offers,
.three-merch-cards.special-offers,
.four-merch-cards.special-offers,
.one-merch-card:has(merch-card[variant="special-offers"]),
.two-merch-cards:has(merch-card[variant="special-offers"]),
.three-merch-cards:has(merch-card[variant="special-offers"]),
.four-merch-cards:has(merch-card[variant="special-offers"]) {
  grid-template-columns: minmax(302px, var(--consonant-merch-card-special-offers-width));
}

/* Sections inside tabs/fragments that don't receive the .special-offers class.
   Make .content wrapper transparent so the section grid applies directly to cards. */
.one-merch-card:has(merch-card[variant="special-offers"]) .content,
.two-merch-cards:has(merch-card[variant="special-offers"]) .content,
.three-merch-cards:has(merch-card[variant="special-offers"]) .content,
.four-merch-cards:has(merch-card[variant="special-offers"]) .content {
  display: contents;
}

@media screen and ${S} {
  :root {
    --consonant-merch-card-special-offers-width: 302px;
  }
}

@media screen and ${x} {
  :root {
    --consonant-merch-card-special-offers-width: 302px;
  }

  .two-merch-cards.special-offers,
  .three-merch-cards.special-offers,
  .four-merch-cards.special-offers,
  .two-merch-cards:has(merch-card[variant="special-offers"]),
  .three-merch-cards:has(merch-card[variant="special-offers"]),
  .four-merch-cards:has(merch-card[variant="special-offers"]) {
      grid-template-columns: repeat(2, minmax(302px, var(--consonant-merch-card-special-offers-width)));
  }
}

/* desktop */
@media screen and ${C} {
  .three-merch-cards.special-offers,
  .four-merch-cards.special-offers,
  .three-merch-cards:has(merch-card[variant="special-offers"]),
  .four-merch-cards:has(merch-card[variant="special-offers"]) {
    grid-template-columns: repeat(3, minmax(302px, var(--consonant-merch-card-special-offers-width)));
  }
}

@media screen and ${$} {
  .four-merch-cards.special-offers,
  .four-merch-cards:has(merch-card[variant="special-offers"]) {
    grid-template-columns: repeat(4, minmax(302px, var(--consonant-merch-card-special-offers-width)));
  }
}
`;var wo={cardName:{attribute:"name"},backgroundImage:{tag:"div",slot:"bg-image"},subtitle:{tag:"p",slot:"detail-m"},title:{tag:"h3",slot:"heading-xs"},prices:{tag:"p",slot:"heading-xs-price"},description:{tag:"div",slot:"body-xs"},ctas:{slot:"footer",size:"l"},planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-special-offers"},allowedBadgeColors:["spectrum-yellow-300-special-offers","spectrum-gray-300-special-offers","spectrum-green-900-special-offers"],allowedBorderColors:["spectrum-yellow-300-special-offers","spectrum-gray-300-special-offers","spectrum-green-900-special-offers"],borderColor:{attribute:"border-color"}},We=class extends b{constructor(e){super(e);d(this,"legal")}get headingSelector(){return'[slot="detail-m"]'}getGlobalCSS(){return yo}priceOptionsProvider(e,t){t.displayPlanType=this.card?.settings?.displayPlanType??!1}async postCardUpdateHook(){await super.postCardUpdateHook(),this.adjustLegal()}adjustLegal(){if(this.legal!==void 0)return;let e=this.card.querySelector(`${y}[data-template="price"]`);if(!e)return;let t=e.cloneNode(!0);this.legal=t,e.dataset.displayPlanType="false",t.dataset.template="legal",t.dataset.displayPerUnit="false",t.setAttribute("slot","legal"),this.card.appendChild(t)}renderLayout(){return Fr`${this.cardImage}
            <div class="body">
                <slot name="detail-m"></slot>
                <slot name="heading-xs"></slot>
                <slot name="heading-xs-price"></slot>
                <slot name="legal"></slot>
                <slot name="body-xs"></slot>
                <slot name="badge"></slot>
            </div>
            ${this.evergreen?Fr`
                      <div
                          class="detail-bg-container"
                          style="background: ${this.card.detailBg}"
                      >
                          <slot name="detail-bg"></slot>
                      </div>
                  `:Fr`
                      <hr />
                      ${this.secureLabelFooter}
                  `}
            <slot></slot>`}};d(We,"variantStyle",xi`
        :host([variant='special-offers']) {
            min-height: 439px;
            background:
                linear-gradient(white, white) padding-box,
                var(--consonant-merch-card-border-color, #eaeaea) border-box;
            border: 1px solid transparent;
        }

        :host([variant='special-offers']) {
            width: var(--consonant-merch-card-special-offers-width);
        }

        :host([variant='special-offers'].center) {
            text-align: center;
        }

        :host(
            [variant='special-offers'][border-color='spectrum-yellow-300-special-offers']
        ) {
            border-color: var(--spectrum-yellow-300-special-offers);
        }

        :host(
            [variant='special-offers'][border-color='spectrum-gray-300-special-offers']
        ) {
            border-color: var(--spectrum-gray-300-special-offers);
        }

        :host(
            [variant='special-offers'][border-color='spectrum-green-900-special-offers']
        ) {
            border-color: var(--spectrum-green-900-special-offers);
        }
    `);var Eo={title:{tag:"h3",slot:"heading-xs",maxCount:250,withSuffix:!0},badge:{tag:"div",slot:"badge",default:"spectrum-blue-400"},allowedBadgeColors:["spectrum-blue-400","spectrum-gray-300","spectrum-yellow-300","gradient-purple-blue","gradient-firefly-spectrum"],description:{tag:"div",slot:"body-s",maxCount:2e3,withSuffix:!1},shortDescription:{tag:"div",slot:"short-description",maxCount:3e3,withSuffix:!1},callout:{tag:"div",slot:"callout-content",editorLabel:"Price description"},prices:{tag:"div",slot:"price"},trialBadge:{tag:"div",slot:"trial-badge"},ctas:{slot:"cta",size:"XL"},mnemonics:{size:"xs"},borderColor:{attribute:"border-color",specialValues:{gray:"var(--spectrum-gray-300)",blue:"var(--spectrum-blue-400)","gradient-purple-blue":"linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)","gradient-firefly-spectrum":"linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%)"}},showAllSpectrumColors:!0,multiWhatsIncluded:"true",disabledAttributes:[]},ko={title:{tag:"h3",slot:"heading-xs",maxCount:250,withSuffix:!0},badge:{tag:"div",slot:"badge",default:"spectrum-blue-400"},allowedBadgeColors:["spectrum-blue-400","spectrum-gray-300","spectrum-yellow-300","gradient-purple-blue","gradient-firefly-spectrum"],description:{tag:"div",slot:"body-xs",maxCount:2e3,withSuffix:!1},prices:{tag:"div",slot:"price"},callout:{tag:"div",slot:"callout-content",editorLabel:"Price description"},ctas:{slot:"cta",size:"XL"},borderColor:{attribute:"border-color",specialValues:{gray:"var(--spectrum-gray-300)",blue:"var(--spectrum-blue-400)","gradient-purple-blue":"linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)","gradient-firefly-spectrum":"linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%)"}},disabledAttributes:["badgeColor","badgeBorderColor","trialBadgeColor","trialBadgeBorderColor"],supportsDefaultChild:!0};import{html as Lt,nothing as So}from"./lit-all.min.js";import{css as yi,unsafeCSS as wi}from"./lit-all.min.js";var Co=["headless","marquee","faq","banner-blade"],Ke=(a,r="")=>Co.map(e=>`merch-card[variant='${e}'] [slot='${a}']${r}`).join(`,
`),Br=a=>Co.map(r=>`merch-card[variant='${r}'] ${a}`).join(`,
`),le=`
/* Headless variant: minimal container for label/value rows */
.headless {
    display: flex;
    flex-direction: column;
    padding: var(--consonant-merch-spacing-xs, 8px);
}

/* Neutralize non-headless slot treatments (heading weight/color, promo-text green,
   callout background box) from global.css.js so every row renders as plain text,
   matching the untouched body-xs/short-description rows. Applies to every variant
   in HEADLESS_FAMILY_VARIANTS above. */
${Ke("heading-xs")},
${Ke("promo-text")} {
    color: var(--consonant-merch-card-body-xs-color);
    font-weight: 400;
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
}
${Ke("callout-content")} {
    display: block;
    margin: 0;
    gap: 0;
}
${Ke("callout-content"," > p")},
${Ke("callout-content"," > div")},
${Ke("callout-content"," > div > div")} {
    background: transparent;
    padding: 0;
    border-radius: 0;
    width: auto;
}
/* Subtle gray annotation next to each headless CTA showing its authored variant
   (Primary/Secondary/Link), set alongside the button in hydrate.js's transformLinkToButton(). */
${Br(".headless-cta-item")} {
    display: inline-flex;
    align-items: center;
}
${Br(".headless-cta-variant-label")} {
    font-size: 0.75em;
    color: var(--spectrum-gray-600);
    background: var(--spectrum-gray-100);
    border-radius: 4px;
    padding: 2px 6px;
    line-height: 1.4;
    margin-left: var(--consonant-merch-spacing-xxs, 4px);
}
${Br(".headless-cta-item:not(:last-child)::after")} {
    content: ', ';
}
`;function de(a){let r=wi(a);return yi`
        :host([variant='${r}']) {
            border: none;
            background: transparent;
            box-shadow: none;
        }
        :host([variant='${r}']) .headless {
            display: flex;
            flex-direction: column;
            padding: var(--consonant-merch-spacing-xs, 8px);
        }
        :host([variant='${r}']) .headless-row {
            display: flex;
            gap: var(--consonant-merch-spacing-xs, 8px);
            padding: var(--consonant-merch-spacing-xxs, 4px) 0;
        }
        :host([variant='${r}']) .headless-label {
            flex-shrink: 0;
            font-weight: 600;
            min-width: 8em;
        }
        :host([variant='${r}']) .headless-value {
            flex: 1;
        }
        :host([variant='${r}']) .headless-value::slotted(*) {
            display: inline;
        }
        :host([variant='${r}'])
            .headless-value[data-slot='footer']::slotted(div) {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: var(--consonant-merch-spacing-xs, 8px);
        }
        :host([variant='${r}']) .headless-section {
            font-size: 0.75em;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--spectrum-gray-600);
            padding-top: 4px;
        }
        :host([variant='${r}']) .headless-backgrounds-toggle {
            margin-left: var(--consonant-merch-spacing-xs, 8px);
            font-size: 0.75em;
            color: var(--spectrum-blue-700);
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            text-decoration: underline;
        }
        :host([variant='${r}']) .headless-backgrounds-detail {
            flex-direction: column;
            padding-left: var(--consonant-merch-spacing-l, 24px);
        }
        :host([variant='${r}']) .headless-backgrounds-detail.hidden {
            display: none;
        }
        :host([variant='${r}']) .headless-backgrounds-detail-row {
            display: flex;
            gap: var(--consonant-merch-spacing-xs, 8px);
            padding: var(--consonant-merch-spacing-xxs, 4px) 0;
        }
        :host([variant='${r}'])
            .headless-backgrounds-detail-row
            .headless-value
            img {
            width: 100%;
            max-height: var(--consonant-merch-card-bg-img-height);
            object-fit: contain;
        }
    `}var Ao={cardName:{attribute:"name"},title:{tag:"p",slot:"heading-xs"},cardTitle:{tag:"p",slot:"heading-xs"},subtitle:{tag:"p",slot:"body-xxs"},description:{tag:"div",slot:"body-xs"},promoText:{tag:"p",slot:"promo-text"},shortDescription:{tag:"p",slot:"short-description"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},whatsIncluded:{tag:"div",slot:"whats-included"},addonConfirmation:{tag:"div",slot:"addon-confirmation"},badge:{tag:"div",slot:"badge"},trialBadge:{tag:"div",slot:"trial-badge"},prices:{tag:"p",slot:"prices"},backgroundImage:{tag:"div",slot:"bg-image"},ctas:{slot:"footer",size:"m"},addon:!0,secureLabel:!0,borderColor:{attribute:"border-color"},backgroundColor:{attribute:"background-color"},size:[],mnemonics:{size:"m"},customFields:{tag:"div",slot:"custom-fields"}},Ei=[{slot:"bg-image",label:"Background Image"},{slot:"badge",label:"Badge"},{slot:"icons",label:"Mnemonic icon"},{slot:"heading-xs",label:"Title"},{slot:"body-xxs",label:"Subtitle"},{slot:"body-xs",label:"Product description"},{slot:"promo-text",label:"Promo Text"},{slot:"callout-content",label:"Callout text"},{slot:"short-description",label:"Short Description"},{slot:"trial-badge",label:"Trial Badge"},{slot:"prices",label:"Product price"},{slot:"quantity-select",label:"Quantity select"},{slot:"addon",label:"Addon"},{slot:"whats-included",label:"What's included"},{slot:"addon-confirmation",label:"Addon confirmation"},{slot:"footer",label:"CTAs"}],Ye=class extends b{constructor(r){super(r)}getGlobalCSS(){return le}renderLayout(){let r=[...this.card.querySelectorAll('[slot^="custom-field-"]')];return Lt`
            <div class="headless">
                ${Ei.map(({slot:e,label:t})=>Lt`
                        <div class="headless-row">
                            <span class="headless-label">${t}</span>
                            <span class="headless-value" data-slot="${e}">
                                <slot name="${e}"></slot>
                            </span>
                        </div>
                    `)}
                ${r.length?Lt`
                          <div class="headless-row">
                              <span class="headless-label headless-section">
                                  Custom fields
                              </span>
                          </div>
                          ${r.map((e,t)=>Lt`
                                  <div class="headless-row">
                                      <span class="headless-label">
                                          ${e.dataset.label||`Custom field ${t+1}`}
                                      </span>
                                      <span class="headless-value">
                                          <slot
                                              name="${e.getAttribute("slot")}"
                                          ></slot>
                                      </span>
                                  </div>
                              `)}
                      `:So}
                ${this.card.secureLabel?Lt`
                          <div class="headless-row">
                              <span class="headless-label">Secure label</span>
                              <span class="headless-value">
                                  ${this.secureLabel}
                              </span>
                          </div>
                      `:So}
            </div>
        `}};d(Ye,"variantStyle",de("headless"));import{css as ki,html as Ci}from"./lit-all.min.js";var To=`
merch-card[variant="mini"] {
  color: var(--spectrum-body-color);
  width: 400px;
  height: 250px;
}

merch-card[variant="mini"] .price-tax-inclusivity::before {
  content: initial;
}

merch-card[variant="mini"] [slot="title"] {
    font-size: 16px;
    font-weight: 700;
    line-height: 24px;
}

merch-card[variant="mini"] [slot="legal"] {
    min-height: 17px;
}

merch-card[variant="mini"] [slot="ctas"] {
  display: flex;
  flex: 1;
  gap: 16px;
  align-items: end;
  justify-content: end;
}

merch-card[variant="mini"] span.promo-duration-text,
merch-card[variant="mini"] span.renewal-text {
    display: block;
}
`;var Lo={title:{tag:"p",slot:"title"},prices:{tag:"p",slot:"prices"},description:{tag:"p",slot:"description"},planType:!0,ctas:{slot:"ctas",size:"S"}},Qe=class extends b{constructor(){super(...arguments);d(this,"legal")}async postCardUpdateHook(){await super.postCardUpdateHook(),this.adjustLegal()}getGlobalCSS(){return To}get headingSelector(){return'[slot="title"]'}priceOptionsProvider(e,t){t.literals={...t.literals,strikethroughAriaLabel:"",alternativePriceAriaLabel:""},t.space=!0,t.displayAnnual=this.card.settings?.displayAnnual??!1}adjustLegal(){if(this.legal!==void 0)return;let e=this.card.querySelector(`${y}[data-template="price"]`);if(!e)return;let t=e.cloneNode(!0);this.legal=t,e.dataset.displayTax="false",e.dataset.displayPerUnit="false",t.dataset.template="legal",t.dataset.displayPlanType=this.card?.settings?.displayPlanType??!0,t.setAttribute("slot","legal"),this.card.appendChild(t)}renderLayout(){return Ci`
            ${this.badge}
            <div class="body">
                <slot name="title"></slot>
                <slot name="prices"></slot>
                <slot name="legal"></slot>
                <slot name="description"></slot>
                <slot name="ctas"></slot>
            </div>
        `}};d(Qe,"variantStyle",ki`
        :host([variant='mini']) {
            min-width: 209px;
            min-height: 103px;
            background-color: var(--spectrum-background-base-color);
            border: 1px solid var(--consonant-merch-card-border-color, #dadada);
        }
    `);import{html as Si,css as Ai}from"./lit-all.min.js";var zo=`
    merch-card[variant='compare-chart-column'] {
        --compare-chart-cell-border-color: var(--spectrum-gray-300, #d3d3d3) !important;
        --compare-chart-cell-bg: #fff !important;
        --compare-chart-cell-bg-alt: var(--color-gray-100, #f8f8f8) !important;
        --consonant-merch-card-border-width: 1px !important;
        --consonant-merch-card-border-radius: 8px !important;
        background-color: var(--compare-chart-cell-bg) !important;
        display: block !important;
    }

    merch-card[variant='compare-chart-column'] p,
    merch-card[variant='compare-chart-column'] a,
    mas-compare-chart [data-compare-chart-slot] p,
    mas-compare-chart [data-compare-chart-slot] a {
        margin: 0 !important;
    }

    merch-card[variant='compare-chart-column'] [slot='badge'],
    mas-compare-chart [data-compare-chart-slot][slot$='-badge'] {
        display: flex !important;
        justify-content: center !important;
    }

    merch-card[variant='compare-chart-column'] [slot='badge'] merch-badge,
    mas-compare-chart [data-compare-chart-slot][slot$='-badge'] merch-badge {
        --merch-badge-border-radius: 4px !important;
        inset-inline-start: 0 !important;
        max-width: 100% !important;
        text-align: center !important;
    }

    mas-compare-chart [data-compare-chart-slot][slot$='-detail'],
    mas-compare-chart [data-compare-chart-slot][slot$='-detail'] p {
        color: var(--C1-Text-text, #2C2C2C) !important;
        font-family: var(--Font-adobe-clean, "Adobe Clean"), sans-serif !important;
        font-size: 12px !important;
        font-style: italic !important;
        font-weight: 400 !important;
        line-height: 150% !important;
    }

    mas-compare-chart [data-compare-chart-slot][slot$='-detail'] {
        flex-grow: 0 !important;
        min-height: auto !important;
        padding-block: 0 !important;
    }
`;var Hr={mnemonics:{size:"l"},title:{tag:"h3",slot:"header",maxCount:100},badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],prices:{tag:"p",slot:"price"},description:{tag:"div",slot:"detail",maxCount:1e3},callout:{tag:"div",slot:"callout-content"},ctas:{slot:"cta",size:"M"},features:{tag:"div",slot:"features",unwrap:!0}},Ti=[{key:"header",selector:".seg-header"},{key:"price",selector:".seg-price"},{key:"detail",selector:".seg-detail"},{key:"cta",selector:".seg-cta"}],er,Po,Ze=class extends b{constructor(e){super(e);f(this,er);this.postCardUpdateHook=this.postCardUpdateHook.bind(this)}getGlobalCSS(){return zo}get aemFragmentMapping(){return Hr}getContainer(){return this.card.closest("mas-compare-chart")??this.card.parentElement}connectedCallbackHook(){window.addEventListener("resize",this.postCardUpdateHook)}disconnectedCallbackHook(){window.removeEventListener("resize",this.postCardUpdateHook)}async postCardUpdateHook(){this.card.isConnected&&(await this.card.updateComplete,E(this,er,Po).call(this))}renderLayout(){return Si`
            <div class="card">
                <div class="seg seg-header">
                    <slot name="icons"></slot>
                    <slot name="header"></slot>
                    <slot name="badge"></slot>
                </div>
                <div class="seg seg-price">
                    <slot name="price"></slot>
                </div>
                <div class="seg seg-detail">
                    <slot name="detail"></slot>
                </div>
                <slot name="callout-content"></slot>
            </div>
            <div class="seg seg-cta">
                <slot name="cta"></slot>
            </div>
            <slot></slot>
        `}};er=new WeakSet,Po=function(){if(this.card.getBoundingClientRect().width===0)return;let e=this.card.shadowRoot;Ti.forEach(({key:t,selector:o})=>this.updateCardElementMinHeight(e.querySelector(o),t))},d(Ze,"variantStyle",Ai`
        :host([variant='compare-chart-column']) {
            --compare-chart-card-padding: 12px;
            --compare-chart-seg-radius: 4px;
            --compare-chart-seg-border-color: var(--spectrum-gray-300, #d3d3d3);
            --compare-chart-card-min-width: 100px;
            --compare-chart-card-max-width: 280px;
            /* The merch-card host carries no border/background; segments do. */
            border: none;
            border-radius: 0;
            background: transparent;
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-width: var(--compare-chart-card-min-width);
            max-width: var(--compare-chart-card-max-width);
            width: 100%;
            justify-self: center;
            box-sizing: border-box;
        }

        :host([variant='compare-chart-column']) .card {
            display: flex;
            flex-direction: column;
            gap: 8px;
            background: transparent;
            box-sizing: border-box;
        }

        /* Bordered chips: header + price */
        :host([variant='compare-chart-column']) .seg-header,
        :host([variant='compare-chart-column']) .seg-price {
            border: 1px solid var(--compare-chart-seg-border-color);
            border-radius: var(--compare-chart-seg-radius);
            padding: var(--compare-chart-card-padding);
            background: var(--compare-chart-cell-bg, #fff);
            box-sizing: border-box;
        }
        /* Zebra (Figma: Cell color = default | grey). Driven by --col stamped
           on the host at hydration: even columns get the grey background. */
        :host([variant='compare-chart-column']) {
            --compare-chart-cell-bg: #fff;
        }
        :host([variant='compare-chart-column'][data-cell-color='grey']) {
            --compare-chart-cell-bg: var(--color-gray-100, #f8f8f8);
        }

        /* Header CTA cell (Figma: M button, up to 2 actions) — apply
           medium-button defaults so plain anchors look right by default. */
        :host([variant='compare-chart-column']) ::slotted([slot='cta']) a,
        :host([variant='compare-chart-column']) ::slotted([slot='cta']) button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 32px;
            padding: 6px 14px;
            border-radius: 16px;
            font:
                700 14px/20px 'Adobe Clean',
                sans-serif;
            text-decoration: none;
        }

        :host([variant='compare-chart-column']) .seg-detail {
            text-align: center;
            font: var(--type-body-xs, 14px/20px 'Adobe Clean', sans-serif);
            padding: 0 var(--compare-chart-card-padding);
        }
        :host([variant='compare-chart-column']) ::slotted([slot='detail']) a {
            color: var(--hover-border-color, #357beb);
            text-decoration: underline;
        }
        :host([variant='compare-chart-column']) ::slotted(p),
        :host([variant='compare-chart-column']) ::slotted(a) {
            margin: 0 !important;
        }

        :host([variant='compare-chart-column']) .seg-cta {
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 8px;
            box-sizing: border-box;
        }
        :host([variant='compare-chart-column']) slot[name='cta'],
        :host([variant='compare-chart-column']) ::slotted([slot='cta']) {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }

        /* Inner stacking inside header */
        :host([variant='compare-chart-column']) .seg-header {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        /* display:block so slotted blocks participate in normal flow. */
        :host([variant='compare-chart-column']) slot[name='header'],
        :host([variant='compare-chart-column']) slot[name='price'],
        :host([variant='compare-chart-column']) slot[name='detail'],
        :host([variant='compare-chart-column']) slot[name='icons'],
        :host([variant='compare-chart-column']) slot[name='badge'] {
            display: block;
        }
        /* Equal chip / row heights — vars stamped on <mas-compare-chart>
           from measured .seg-* wrappers (see #adjustSlotHeights). */
        :host([variant='compare-chart-column']) .seg-header {
            min-height: var(--consonant-merch-card-compare-chart-header-height);
        }
        :host([variant='compare-chart-column']) .seg-price {
            min-height: var(--consonant-merch-card-compare-chart-price-height);
        }
        :host([variant='compare-chart-column']) .seg-detail {
            min-height: var(--consonant-merch-card-compare-chart-detail-height);
        }
        :host([variant='compare-chart-column']) .seg-cta {
            min-height: var(--consonant-merch-card-compare-chart-cta-height);
        }
    `);import{html as Li,css as zi}from"./lit-all.min.js";var _o=`
    merch-card[variant='fries'] {
        background-color: var(
            --merch-card-custom-background-color,
            var(--consonant-merch-card-background-color)
        );
    }

    merch-card[variant='fries'] merch-icon[size='s'] img {
        width: 26px;
        height: 25px;
    }

    merch-card[variant='fries'] [slot="heading-xxs"] {
        color: var(--consonant-merch-card-heading-xxs-color);
    }

    merch-card[variant='fries'] [slot="badge"] {
        position: absolute;
        top: 0;
        right: 24px;
        font-weight: 700;
    }

    merch-card[variant='fries'] [slot="badge"] merch-badge {
        border-radius: 0 0 5px 5px;
    }

    merch-card[variant='fries'] [slot="trial-badge"] {
        min-width: fit-content;
    }

    merch-card[variant='fries'] [slot="trial-badge"] merch-badge {
        display: inline-flex;
        padding: 4px 9px;
        background-color: transparent;
        border-radius: 4px;
        color: var(--merch-badge-background-color, var(--spectrum-global-color-green-700));
        font-size: var(--consonant-merch-card-body-xxs-font-size);
        line-height: var(--consonant-merch-card-body-xxs-line-height);
        max-width: fit-content;
    }

    merch-card[variant='fries'] [slot="body-s"] {
        letter-spacing: normal;
        color: var(--consonant-merch-card-body-s-color);
        font-size: var(--consonant-merch-card-body-s-font-size);
        line-height: var(--consonant-merch-card-body-s-line-height);
    }

    merch-card[variant='fries'] [slot="body-s"] p:has(mas-mnemonic) {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px;
        margin: 0;
    }

    merch-card[variant='fries'] [slot="body-s"] merch-icon {
        display: inline-flex;
        width: 20px;
        height: 20px;
        padding-inline-end: 6px;
        margin-top: 15px;
    }

    merch-card[variant='fries'] [slot="body-s"] .spectrum-Link--primary {
        text-decoration: none;
    }

    merch-card[variant='fries'] [slot="body-s"] .mnemonic-text {
        color: var(--spectrum-gray-900);
        font-size: var(--consonant-merch-card-body-xxs-font-size);
        line-height: var(--consonant-merch-card-body-xxs-line-height);
        font-weight: 400;
        letter-spacing: normal;
        display: inline-flex;
        vertical-align: super;
    }

    merch-card[variant='fries'] [slot="price"] {
        display: flex;
        flex-direction: column;
        align-items: end;
        color: var(--spectrum-gray-900);
    }

    merch-card[variant='fries'] [slot="price"] span.placeholder-resolved[data-template="strikethrough"] {
        text-decoration: none;
    }

    merch-card[variant='fries'] [slot="price"] .price-strikethrough {
        font-size: var(--consonant-merch-card-body-xs-font-size);
        line-height: var(--consonant-merch-card-body-xs-line-height);
        vertical-align: middle;
        text-decoration: line-through;
        text-decoration-color: var(--merch-color-red-promo);
    }

    merch-card[variant='fries'] [slot="price"] .price-strikethrough .price-currency-symbol,
    merch-card[variant='fries'] [slot="price"] .price-strikethrough .price-integer,
    merch-card[variant='fries'] [slot="price"] .price-strikethrough .price-decimals-delimiter,
    merch-card[variant='fries'] [slot="price"] .price-strikethrough .price-decimals,
    merch-card[variant='fries'] [slot="price"] .price-strikethrough .price-recurrence {
        font-size: var(--consonant-merch-card-body-xs-font-size);
        line-height: var(--consonant-merch-card-body-xs-line-height);
        font-weight: 700;
        vertical-align: middle;
    }

    merch-card[variant='fries'] [slot="price"] .price-currency-symbol {
        font-size: var(--consonant-merch-card-body-xs-font-size);
        line-height: var(--consonant-merch-card-body-xs-line-height);
        font-weight: 400;
        vertical-align: super;
    }

    merch-card[variant='fries'] [slot="price"] .price-integer,
    merch-card[variant='fries'] [slot="price"] .price-decimals-delimiter,
    merch-card[variant='fries'] [slot="price"] .price-decimals {
        font-size: var(--consonant-merch-card-heading-m-font-size);
        line-height: var(--consonant-merch-card-heading-m-line-height);
        font-weight: 700;
    }

    merch-card[variant='fries'] [slot="price"] .price-recurrence {
        font-size: var(--consonant-merch-card-body-xs-font-size);
        line-height: var(--consonant-merch-card-body-xs-line-height);
        font-weight: 400;
    }

    merch-card[variant='fries'] [slot="addon-confirmation"] {
        color: var(--spectrum-green-800);
        font-size: 15px;
        font-weight: bold;
        margin-left: 8px;
    }

    merch-card[variant='fries'] [slot="whats-included"] {
        display: block;
        margin-top: 8px;
    }

    merch-card[variant='fries'] merch-whats-included {
        row-gap: 6px;
        flex-wrap: nowrap;
    }

    merch-card[variant='fries'] merch-whats-included > [slot="heading"]:empty {
        display: none;
    }

    merch-card[variant='fries'] merch-whats-included merch-mnemonic-list {
        width: auto;
        flex: 0 0 auto;
        margin-right: 0;
    }

    merch-card[variant='fries'] merch-whats-included merch-icon {
        --img-width: 20px;
        --img-height: 20px;
    }

    .spectrum--dark merch-card[variant="fries"],
    .spectrum--darkest merch-card[variant="fries"] {
      --spectrum-yellow-300:rgb(248, 217, 4);
      --consonant-merch-card-background-color:rgb(19, 19, 19);
      --consonant-merch-card-heading-xxs-color:rgb(253, 253, 253);
      --consonant-merch-card-body-s-color:rgb(128, 128, 128);
      --merch-card-fries-badge-color:rgb(0, 122, 77);
      --consonant-merch-card-body-xxs-color:rgb(219, 219, 219);
      --merch-card-ah-promoted-plans-strikethrough-color:rgb(138, 138, 138);
    }

    .spectrum--dark merch-card[variant="fries"] [slot="body-s"],
    .spectrum--darkest merch-card[variant="fries"] [slot="body-s"] {
        color: rgb(142, 142, 147);
    }
`;var qr={mnemonics:{size:"s"},title:{tag:"h3",slot:"heading-xxs",maxCount:250,withSuffix:!0},description:{tag:"div",slot:"body-s",maxCount:2e3,withSuffix:!1},whatsIncluded:{tag:"div",slot:"whats-included"},badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300"},trialBadge:{tag:"div",slot:"trial-badge",default:"spectrum-green-800"},prices:{tag:"p",slot:"price"},ctas:{slot:"cta",size:"M"},addonConfirmation:{tag:"div",slot:"addon-confirmation"},borderColor:{attribute:"border-color",specialValues:{gray:"--spectrum-gray-300","gradient-purple-blue":"var(--gradient-purple-blue)","gradient-firefly-spectrum":"var(--gradient-firefly-spectrum)"}}},Xe=class extends b{getGlobalCSS(){return _o}get aemFragmentMapping(){return qr}renderLayout(){return Li`
            <div class="content">
                <div class="header">
                    <slot name="icons"></slot>
                    <slot name="heading-xxs"></slot>
                    <slot name="trial-badge"></slot>
                </div>
                <slot name="badge"></slot>
                <slot name="body-s"></slot>
                <slot name="whats-included"></slot>
                <div class="footer">
                    <div class="cta">
                        <slot name="cta"></slot>
                        <slot name="addon-confirmation"></slot>
                    </div>
                    <slot name="price"></slot>
                </div>
            </div>
            <slot></slot>
        `}};d(Xe,"variantStyle",zi`
        :host([variant='fries']) {
            --merch-card-fries-max-width: 620px;
            --merch-card-fries-padding: 24px;
            --merch-card-fries-min-height: 204px;
            --merch-card-fries-header-min-height: 36px;
            --merch-card-fries-gray-background: rgba(248, 248, 248);
            --merch-card-fries-text-color: rgba(19, 19, 19);
            --merch-card-fries-price-line-height: 17px;
            --merch-card-fries-outline: transparent;
            --consonant-merch-card-border-width: 1px;
            max-width: var(--merch-card-fries-max-width);
            min-height: var(--merch-card-fries-min-height);
            background-color: var(
                --merch-card-custom-background-color,
                var(--spectrum-gray-300)
            );
            color: var(--consonant-merch-card-heading-xxxs-color);
            border-radius: 4px;
            border: 1px solid
                var(--consonant-merch-card-border-color, transparent);
            display: flex;
            flex-direction: row;
            overflow: hidden;
            padding: var(--merch-card-fries-padding) !important;
            gap: 16px;
            justify-content: space-between;
            box-sizing: border-box !important;
        }

        :host([variant='fries']) .content {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            flex-grow: 1;
        }

        :host([variant='fries']) .header {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: var(--consonant-merch-spacing-xxs);
            padding-bottom: 15px;
            padding-top: 5px;
        }

        :host([variant='fries']) .footer {
            display: flex;
            width: fit-content;
            flex-wrap: nowrap;
            gap: 8px;
            flex-direction: row;
            margin-top: auto;
            align-items: end;
            width: 100%;
            justify-content: space-between;
        }

        :host([variant='fries']) .cta {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 8px;
            margin-top: 15px;
        }

        :host([variant='fries'][gradient-border='true']) {
            border: 1px solid transparent;
            background-image: linear-gradient(
                    to bottom,
                    var(
                        --merch-card-custom-background-color,
                        var(--consonant-merch-card-background-color)
                    ),
                    var(
                        --merch-card-custom-background-color,
                        var(--consonant-merch-card-background-color)
                    )
                ),
                var(--merch-card-fries-border-gradient);
            background-origin: padding-box, border-box;
            background-clip: padding-box, border-box;
        }

        :host([variant='fries'][border-color='gradient-purple-blue']) {
            --merch-card-fries-border-gradient: var(--gradient-purple-blue);
        }

        :host([variant='fries'][border-color='gradient-firefly-spectrum']) {
            --merch-card-fries-border-gradient: var(
                --gradient-firefly-spectrum
            );
        }
    `);import{html as Vr,nothing as nr}from"./lit-all.min.js";import{html as Gr}from"./lit-all.min.js";function Pi(a,r){if(typeof a!="string"||!a)return null;let e;try{e=new URL(a,r)}catch{return null}return e.hostname.endsWith(".aem.page")?`${r}${e.pathname}${e.search}`:null}function _i(a){return a?.hostname==="www.adobe.com"||a?.hostname==="adobe.com"}function Ur(a,r=globalThis.location){if(typeof a!="string"||!a||!_i(r))return a;let e=document.createElement("template");return e.innerHTML=`<picture>${a}</picture>`,e.content.querySelectorAll("source[srcset], img[src]").forEach(t=>{let o=t.tagName==="IMG"?"src":"srcset",n=Pi(t.getAttribute(o),r.origin);n&&t.setAttribute(o,n)}),e.content.querySelector("picture").innerHTML}var Mi=new Set(["SOURCE","IMG"]),Ri=new Set(["src","srcset","media","type","alt","role","loading","data-mobile-set","width","height"]);function jr(a){if(typeof a!="string"||!a)return"";let r=document.createElement("template"),e=/^\s*<picture[\s>]/i.test(a);r.innerHTML=e?a:`<picture>${a}</picture>`;let t=r.content.querySelector("picture");return t?(t.querySelectorAll("*").forEach(o=>{if(!Mi.has(o.tagName)){o.remove();return}[...o.attributes].forEach(n=>{Ri.has(n.name.toLowerCase())||o.removeAttribute(n.name)})}),t.innerHTML):""}var Ni="(min-width: 1200px)",Oi="(min-width: 600px)";function Mo(a,r){if(!a)return"";let e=new DOMParser().parseFromString(`<picture>${a}</picture>`,"text/html");if(r==="desktop")return e.querySelector(`source[media="${Ni}"]`)?.getAttribute("srcset")??"";if(r==="tablet")return e.querySelector(`source[media="${Oi}"]`)?.getAttribute("srcset")??"";if(r==="mobile"){let t=e.querySelector("img");return t?.hasAttribute("data-mobile-set")?t.getAttribute("src")??"":""}return""}var Ro=["tablet","mobile"];function No(a,r){let t=a.querySelector('[slot="backgrounds"]')?.innerHTML??"";Ro.forEach(o=>{let n=r.querySelector(`[data-backgrounds-breakpoint="${o}"]`);if(!n)return;n.replaceChildren();let i=Mo(t,o);if(!i){n.textContent="\u2014";return}let c=document.createElement("img");c.loading="lazy",c.alt="",c.src=i,n.append(c)})}function tr(a){return function(e){let t=a(),o=t.shadowRoot?.querySelector(".headless-backgrounds-detail");if(!o)return;let n=o.classList.contains("hidden");n&&No(t,o),o.classList.toggle("hidden",!n),e.target.textContent=n?"Show default only":"See all backgrounds"}}function rr(a){return function(){let e=a(),t=e.shadowRoot?.querySelector(".headless-backgrounds-detail");!t||t.classList.contains("hidden")||No(e,t)}}function ar(a){return Gr`
        <button
            type="button"
            class="headless-backgrounds-toggle"
            @click="${a}"
        >
            See all backgrounds
        </button>
    `}function $i(a){return`Background ${a[0].toUpperCase()}${a.slice(1)}`}function or(){return Gr`
        <div class="headless-row headless-backgrounds-detail hidden">
            ${Ro.map(a=>Gr`
                    <div class="headless-backgrounds-detail-row">
                        <span class="headless-label"
                            >${$i(a)}</span
                        >
                        <span
                            class="headless-value"
                            data-backgrounds-breakpoint="${a}"
                        ></span>
                    </div>
                `)}
        </div>
    `}var Oo={cardName:{attribute:"name"},image:{tag:"picture",slot:"image"},backgrounds:{tag:"picture",slot:"backgrounds"},title:{tag:"p",slot:"heading-xs"},description:{tag:"div",slot:"body-xs"},shortDescription:{tag:"p",slot:"short-description"},prices:{tag:"p",slot:"prices"},ctas:{slot:"footer",size:"m"}},Di=[{slot:"image",label:"Image"},{slot:"backgrounds",label:"Background"},{slot:"heading-xs",label:"Title"},{slot:"body-xs",label:"Product description"},{slot:"short-description",label:"Short Description"},{slot:"prices",label:"Product price"},{slot:"footer",label:"CTAs"}],Je=class extends b{constructor(e){super(e);d(this,"toggleBackgroundsDetail",tr(()=>this.card));d(this,"refreshBackgroundsDetail",rr(()=>this.card))}getGlobalCSS(){return le}renderLayout(){return Vr`
            <div class="headless">
                ${Di.map(({slot:e,label:t})=>Vr`
                        <div class="headless-row">
                            <span class="headless-label">${t}</span>
                            <span class="headless-value" data-slot="${e}">
                                <slot
                                    name="${e}"
                                    @slotchange=${e==="backgrounds"?this.refreshBackgroundsDetail:nr}
                                ></slot>
                                ${e==="backgrounds"?ar(this.toggleBackgroundsDetail):nr}
                            </span>
                        </div>
                        ${e==="backgrounds"?or():nr}
                    `)}
                ${this.card.secureLabel?Vr`
                          <div class="headless-row">
                              <span class="headless-label">Secure label</span>
                              <span class="headless-value">
                                  ${this.secureLabel}
                              </span>
                          </div>
                      `:nr}
            </div>
        `}};d(Je,"variantStyle",de("marquee"));import{html as $o}from"./lit-all.min.js";var Do={cardName:{attribute:"name"},prices:{tag:"p",slot:"prices"},description:{tag:"div",slot:"body-xs",editorLabel:"FAQ answer 1"},shortDescription:{tag:"p",slot:"short-description",editorLabel:"FAQ answer 2"},callout:{tag:"div",slot:"callout-content",editorLabel:"FAQ answer 3"}},Ii=[{slot:"prices",label:"Product price"},{slot:"body-xs",label:"FAQ answer 1"},{slot:"short-description",label:"FAQ answer 2"},{slot:"callout-content",label:"FAQ answer 3"}],et=class extends b{constructor(r){super(r)}getGlobalCSS(){return le}renderLayout(){return $o`
            <div class="headless">
                ${Ii.map(({slot:r,label:e})=>$o`
                        <div class="headless-row">
                            <span class="headless-label">${e}</span>
                            <span class="headless-value">
                                <slot name="${r}"></slot>
                            </span>
                        </div>
                    `)}
            </div>
        `}};d(et,"variantStyle",de("faq"));import{html as Io,nothing as Wr}from"./lit-all.min.js";var Fo={cardName:{attribute:"name"},image:{tag:"picture",slot:"image"},backgrounds:{tag:"picture",slot:"backgrounds"},title:{tag:"p",slot:"heading-xs"},description:{tag:"div",slot:"body-xs"},ctas:{slot:"footer",size:"m"}},Fi=[{slot:"image",label:"Image"},{slot:"backgrounds",label:"Background"},{slot:"heading-xs",label:"Title"},{slot:"body-xs",label:"Description"},{slot:"footer",label:"CTAs"}],tt=class extends b{constructor(e){super(e);d(this,"toggleBackgroundsDetail",tr(()=>this.card));d(this,"refreshBackgroundsDetail",rr(()=>this.card))}getGlobalCSS(){return le}renderLayout(){return Io`
            <div class="headless">
                ${Fi.map(({slot:e,label:t})=>Io`
                        <div class="headless-row">
                            <span class="headless-label">${t}</span>
                            <span class="headless-value" data-slot="${e}">
                                <slot
                                    name="${e}"
                                    @slotchange=${e==="backgrounds"?this.refreshBackgroundsDetail:Wr}
                                ></slot>
                                ${e==="backgrounds"?ar(this.toggleBackgroundsDetail):Wr}
                            </span>
                        </div>
                        ${e==="backgrounds"?or():Wr}
                    `)}
            </div>
        `}};d(tt,"variantStyle",de("banner-blade"));import{html as Bi,css as Hi}from"./lit-all.min.js";var Bo=`
.collection-container:has(merch-card[variant='product-pricing']) {
    display: block;
}

merch-card-collection.product-pricing {
    display: grid;
    grid-template-columns: minmax(261px, 474px);
    justify-content: center;
    max-width: 1920px;
    margin-inline: auto;
    gap: 8px;
    --merch-card-collection-card-min-height: 286px;
}

/* Studio uses <merch-card-collection>; milo/preview wraps cards in
   .N-merch-cards grid containers, so both selector families are covered. */
@media screen and ${x} {
    merch-card-collection.product-pricing,
    .two-merch-cards:has(merch-card[variant='product-pricing']),
    .three-merch-cards:has(merch-card[variant='product-pricing']),
    .four-merch-cards:has(merch-card[variant='product-pricing']) {
        grid-template-columns: repeat(2, minmax(261px, 474px));
    }
}

@media screen and ${re} {
    merch-card-collection.product-pricing,
    .three-merch-cards:has(merch-card[variant='product-pricing']),
    .four-merch-cards:has(merch-card[variant='product-pricing']) {
        grid-template-columns: repeat(3, minmax(261px, 474px));
    }
}

@media screen and ${ze} {
    merch-card-collection.product-pricing,
    .four-merch-cards:has(merch-card[variant='product-pricing']) {
        grid-template-columns: repeat(4, minmax(261px, 474px));
    }
}

merch-card[variant="product-pricing"] {
    width: 100%;
    max-width: 474px;
    min-width: 261px;
    --product-frame-bg: #fff;
    --product-frame-border: #ebebeb;
}

merch-card[variant="product-pricing"]:has([slot="badge"]) {
    --product-frame-bg: #000;
    --product-frame-border: #000;
}

/* Strip the merch-badge pill: plain white text on the header strip. The
   --merch-badge-* props are set inline by merch-badge, so !important is needed. */
merch-card[variant="product-pricing"] merch-badge {
    --merch-badge-background-color: transparent !important;
    --merch-badge-border: none !important;
    --merch-badge-color: #fff !important;
    --merch-badge-padding: 0 !important;
    inset-inline-start: 0;
    font-size: 14px;
    font-weight: 700;
    line-height: 18px;
}

merch-card[variant="product-pricing"] [slot="heading-s"] {
    margin: 0;
    font-size: 18px;
    font-weight: 900;
    line-height: 18px;
    letter-spacing: -0.2px;
    color: #000;
}

merch-card[variant="product-pricing"] [slot="body-xs"] {
    margin: 0;
    font-size: 14px;
    font-weight: 400;
    line-height: 18px;
    color: #5c5c5c;
}

/* Inline links (e.g. "See terms") match the gray body copy, underlined. */
merch-card[variant="product-pricing"] [slot="body-xs"] a {
    color: inherit;
    text-decoration: underline;
}

merch-card[variant="product-pricing"] [slot="heading-xs"] {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    line-height: 20px;
    color: #000;
    text-align: left;
}

merch-card[variant="product-pricing"] [slot="heading-xs"] p {
    margin: 0;
}

/* Figma stacks the prices: current price drops below the strikethrough.
   Blocking the alternative (not the strikethrough) keeps the joining nbsp as a
   harmless trailing space instead of indenting the second line. */
merch-card[variant="product-pricing"] [slot="heading-xs"] .price-alternative {
    display: block;
}

merch-card[variant="product-pricing"] [slot="heading-xs"] .price-strikethrough {
    font-size: 14px;
    font-weight: 700;
    line-height: 18px;
    text-decoration: line-through;
    color: #5c5c5c;
}

merch-card[variant="product-pricing"] [slot="legal"] {
    margin: 0;
}

merch-card[variant="product-pricing"] span[data-template="legal"] {
    display: block;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #5c5c5c;
}

/* The global leading nbsp would indent the legal line, so drop it. */
merch-card[variant="product-pricing"] span[data-template="legal"] .price-tax-inclusivity:not(.disabled)::before {
    content: none;
}

merch-card[variant="product-pricing"] [slot="short-description"] {
    margin: 0;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #000;
}

merch-card[variant="product-pricing"] [slot="short-description"] p {
    margin: 0;
}

merch-card[variant="product-pricing"] [slot="short-description"] a.spectrum-Link--secondary {
    color: inherit;
}

/* CTAs share a row while both labels fit on one line, else they stack. */
merch-card[variant="product-pricing"] [slot="footer"] {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 4px;
    width: 100%;
}

merch-card[variant="product-pricing"] [slot="footer"] a {
    flex: 1 1 calc(50% - 2px);
    /* One-line label width, capped at the footer: past half the row the CTAs
       stack, past the whole row the label wraps. */
    min-width: fit-content;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    border-radius: 999px;
    min-height: 40px;
    padding: 8px 24px;
    font-size: 14px;
    font-weight: 700;
    text-align: center;
    text-decoration: none;
    overflow-wrap: anywhere;
    background: #3B63FB;
    color: #fff;
    border: none;
}

merch-card[variant="product-pricing"] [slot="footer"] a.con-button.outline,
merch-card[variant="product-pricing"] [slot="footer"] a.con-button.primary,
merch-card[variant="product-pricing"] [slot="footer"] a.outline {
    background: transparent;
    color: #000;
    border: 2px solid #000;
}

merch-card[variant="product-pricing"][stacked] [slot="footer"] a {
    flex-basis: 100%;
}
`;var Ho=x,Kr=[{name:"heading-s",getElement:a=>a.querySelector('[slot="heading-s"]')},{name:"body-xs",getElement:a=>a.querySelector('[slot="body-xs"]')},{name:"price",getElement:a=>a.querySelector('[slot="heading-xs"]')},{name:"fine",getElement:a=>a.shadowRoot?.querySelector(".fine")},{name:"footer",getElement:a=>a.shadowRoot?.querySelector("footer")}],qi=a=>{a.removeAttribute("stacked"),Kr.forEach(({name:r})=>a.style.removeProperty(`--consonant-merch-card-product-pricing-${r}-height`))},Ui=a=>{let[r,e]=[...a.querySelectorAll('[slot="footer"] a')].filter(t=>t.getClientRects().length);return!!(e&&e.getBoundingClientRect().top>=r.getBoundingClientRect().bottom)},ji=a=>Math.round(a.getBoundingClientRect().top),qo={cardName:{attribute:"name"},mnemonics:{size:"s"},badge:{tag:"div",slot:"badge"},title:{tag:"h3",slot:"heading-s"},prices:{tag:"p",slot:"heading-xs"},description:{tag:"div",slot:"body-xs"},shortDescription:{tag:"div",slot:"short-description"},ctas:{slot:"footer",size:"m"},planType:!0,style:"consonant"},ee,zt,rt=class extends b{constructor(){super(...arguments);f(this,ee,null);f(this,zt,()=>this.resyncOnReflow());d(this,"lastSyncKey",null)}getGlobalCSS(){return Bo}get headingSelector(){return'[slot="heading-s"]'}priceOptionsProvider(e,t){e.dataset.template===P&&(t.displayPlanType=this.card?.settings?.displayPlanType??!0)}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let e=this.card.querySelector(`[slot="heading-xs"] ${y}:not([data-template="legal"])`);if(!e)return;let t=e.cloneNode(!0);if(await e.onceSettled(),!e.options)return;t.dataset.displayPerUnit="false",e.options.displayTax&&(e.dataset.displayTax="false"),e.options.displayPlanType&&(e.dataset.displayPlanType="false"),t.setAttribute("data-template","legal"),this.legalHost().appendChild(t),await t.onceSettled()}catch{}}legalHost(){let e=this.card.querySelector('p[slot="legal"]');return e||(e=document.createElement("p"),e.setAttribute("slot","legal"),this.card.appendChild(e)),e}async postCardUpdateHook(){this.card.isConnected&&(this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook(),this.flagPriceRow(),window.matchMedia(Ho).matches&&requestAnimationFrame(()=>this.syncHeights()))}syncHeights(){if(this.card.heightSync===!1||this.card.getBoundingClientRect().width<=2)return;let e=[...this.getContainer()?.querySelectorAll('merch-card[variant="product-pricing"]')??[]];if(e.forEach(qi),!window.matchMedia(Ho).matches)return;this.syncRowHeights(Kr);let t=e.map(ji),o=new Set(t.filter((n,i)=>Ui(e[i])));e.forEach((n,i)=>n.toggleAttribute("stacked",o.has(t[i])))}flagPriceRow(){this.card.toggleAttribute("no-price",!this.card.querySelector('[slot="heading-xs"]'))}resyncOnReflow(){let e=this.card.getBoundingClientRect().width;if(e<=2)return;let t=[Math.round(e),...Kr.map(({getElement:o})=>Math.round(o(this.card)?.getBoundingClientRect().height||0))].join(":");t!==this.lastSyncKey&&(this.lastSyncKey=t,this.syncHeights())}connectedCallbackHook(){if(this.card.addEventListener(I,h(this,zt)),typeof ResizeObserver>"u")return;g(this,ee,new ResizeObserver(()=>this.resyncOnReflow())),h(this,ee).observe(this.card);let e=this.card.querySelector('[slot="body-xs"]');e&&h(this,ee).observe(e);let t=this.card.querySelector('[slot="short-description"]');t&&h(this,ee).observe(t)}disconnectedCallbackHook(){this.card.removeEventListener(I,h(this,zt)),h(this,ee)?.disconnect(),g(this,ee,null)}renderLayout(){return Bi` <div class="header">
                <slot name="icons"></slot>
                <slot name="badge"></slot>
            </div>
            <div class="panel">
                <div class="copy">
                    <slot name="heading-s"></slot>
                    <slot name="body-xs"></slot>
                </div>
                <div class="spacer"></div>
                <div class="price-buttons">
                    <div>
                        <slot name="heading-xs"></slot>
                        <div class="fine">
                            <slot name="legal"></slot>
                            <slot name="short-description"></slot>
                        </div>
                    </div>
                    <footer><slot name="footer"></slot></footer>
                </div>
            </div>
            <slot></slot>`}};ee=new WeakMap,zt=new WeakMap,d(rt,"variantStyle",Hi`
        :host([variant='product-pricing']) {
            font-weight: 400;
            display: flex;
            flex-direction: column;
            background: var(--product-frame-bg, #fff);
            border: 1px solid var(--product-frame-border, #dadada);
            border-radius: 16px;
            overflow: hidden;
            /* 4px frame = 1px border + 3px padding; host bg shows through. */
            padding: 3px;
            /* Fill the grid row so .spacer has slack to absorb. */
            height: 100%;
            box-sizing: border-box;
        }

        /* Mnemonic + badge share one centered row on the header strip. Strip
           background is white by default, black when framed (badge authored, see
           product-pricing.css.js). */
        :host([variant='product-pricing']) .header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 24px 24px 32px;
        }

        :host([variant='product-pricing']) .header slot[name='icons'] {
            display: inline-flex;
            align-items: center;
        }

        /* White content panel; the host's 4px padding exposes the frame around
           it (and the header strip) in the framed state. */
        :host([variant='product-pricing']) .panel {
            flex: 1 0 auto;
            display: flex;
            flex-direction: column;
            background: #fff;
            border-radius: 12px;
            padding: 24px;
            box-sizing: border-box;
        }

        :host([variant='product-pricing']) .copy {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        :host([variant='product-pricing']) slot[name='heading-s'] {
            display: block;
            min-height: var(
                --consonant-merch-card-product-pricing-heading-s-height
            );
        }
        :host([variant='product-pricing']) slot[name='body-xs'] {
            display: block;
            min-height: var(
                --consonant-merch-card-product-pricing-body-xs-height
            );
        }
        :host([variant='product-pricing']) slot[name='heading-xs'] {
            display: flex;
            flex-direction: column;
            /* Bottom-align so a plain price shares a baseline with a stacked
               strikethrough price. */
            justify-content: flex-end;
            min-height: var(
                --consonant-merch-card-product-pricing-price-height
            );
        }

        /* No price authored: hide the price slot and drop the reserved row
           height, else it leaves a blank band above the CTAs. Chrome rejects
           :has() inside :host(), so the flag is an attribute (see flagPriceRow). */
        :host([variant='product-pricing'][no-price]) slot[name='heading-xs'] {
            display: none;
        }

        :host([variant='product-pricing'][no-price]) .fine {
            min-height: 0;
        }

        :host([variant='product-pricing'][no-price]) .price-buttons {
            gap: 0;
        }

        /* Grows so a shorter card's slack lands here, in one block, instead of
           spread through the copy, keeping CTAs on the row's shared baseline. */
        :host([variant='product-pricing']) .spacer {
            flex: 1 0 24px;
        }

        :host([variant='product-pricing']) .price-buttons {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        /* Legal + short-description share this row; a card shows one. */
        :host([variant='product-pricing']) .fine {
            display: flex;
            flex-direction: column;
            min-height: var(--consonant-merch-card-product-pricing-fine-height);
        }

        :host([variant='product-pricing']) slot[name='short-description'] {
            display: block;
        }

        :host([variant='product-pricing']) footer {
            display: flex;
            padding: 0;
            gap: 4px;
            justify-content: stretch;
            align-items: stretch;
            flex-wrap: nowrap;
            /* Row-max height keeps a wrapped CTA from shifting siblings' rows. */
            min-height: var(
                --consonant-merch-card-product-pricing-footer-height
            );
        }
    `);import{html as Gi,css as Vi}from"./lit-all.min.js";var Uo=`
:root {
  --consonant-merch-card-productc2-width: 370px;
  --s2a-font-letter-spacing-4xl: -.48px;
  --gray: var(--color-gray-100, #f8f8f8);
  --legal-gray: #ffffffa3;;
  --transparent: transparent;
}

merch-card[variant="product-c2"] {
  max-width: var(--consonant-merch-card-productc2-width);
}

merch-card[variant="product-c2"] [slot="subtitle"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xxs-line-height);
}

merch-card[variant="product-c2"] {
    width: 100%;
}

merch-card[variant="product-c2"] [slot="heading-m"] span[is="inline-price"] {
    font-weight: 900;
}

merch-card[variant="product-c2"] [slot="heading-m"],
merch-card[variant="product-c2"] [slot="heading-m"] .price-strikethrough {
    margin: 0;
    font-weight: 900;
    font-size: var(--consonant-merch-card-body-xxl-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
}

merch-card[variant="product-c2"] [slot="heading-m"] .price-legal {
    font-size: inherit;
    line-height: inherit;
    font-weight: 400;
    color: #000000a3;
}

merch-card[variant="product-c2"] [slot="heading-m"] [data-template="price"] {
    letter-spacing: var(--s2a-font-letter-spacing-4xl);
    font-family: "Adobe Clean Display Black", adobe-clean-display, "Arial Bold Adjusted", sans-serif;
}

merch-card[variant="product-c2"] [slot="heading-m"] [data-template="legal"] {
    display: block;
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xxs-line-height);
}

merch-card[variant="product-c2"] [slot="body-xs"],
merch-card[variant="product-c2"] [slot="short-description"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-heading-xxs-line-height);
}

merch-card[variant="product-c2"] [slot="footer"] {
    display: flex;
    gap: 8px;
    width: 100%;
}

merch-card[variant="product-c2"] [slot="footer"] a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    border-radius: 20px;
    min-height: 40px;
    padding: 0 24px;
    width: stretch;
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xxs-line-height);
}

merch-card[variant="product-c2"] [slot="short-description"] .icon-button {
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18"><path d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"/></svg>');
}

merch-card[variant='product-c2'] [slot='badge'] merch-badge {
    --merch-badge-border-radius: 4px !important;
}

@media screen and ${S} {
    merch-card[variant="product-c2"] {
        background-color: var(--color-white);
        padding: 0;
    }

    merch-card[variant="product-c2"][background-color="black"] merch-badge {
        background-color: var(--color-black);
        --merch-badge-color: var(--color-white);
    }
}

merch-card[variant="product-c2"] [slot="footer"] a.primary-outline {
    border-color: var(--color-black);
    color: var(--color-black);
}

merch-card[variant="product-c2"] [slot="footer"] a.primary-outline:hover {
    background-color: #00000014;
}

merch-card[variant="product-c2"] [slot="heading-m"],
merch-card[variant="product-c2"] [slot="body-xs"] {
    color: var(--color-black);
}

@media screen and ${x} {
    merch-card[variant="product-c2"][background-color="black"] {
        background-color: var(--color-black);
        color: var(--color-white);
    }

    merch-card[variant="product-c2"][background-color="black"] [slot="body-xs"],
    merch-card[variant="product-c2"][background-color="black"] [slot="heading-m"] {
        color: var(--color-white);
    }

    merch-card[variant="product-c2"][background-color="black"] [slot="heading-m"] .price-strikethrough {
        color: #c6c6c6;
    }

    merch-card[variant="product-c2"][background-color="black"] [slot="heading-m"] .price-legal {
        color: var(--legal-gray);
    }

    merch-card[variant="product-c2"][background-color="black"] [slot="footer"] a.primary-outline {
        border-color: var(--color-white);
        color: var(--color-white);
    }

    merch-card[variant="product-c2"][background-color="black"] [slot="footer"] a.primary-outline:hover {
        background-color: var(--legal-gray);
        color: var(--color-black);
    }    

    merch-card[variant="product-c2"][background-color="black"] [slot="short-description"] .icon-button {
      background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18"><path fill="%23aaaaaa" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"/></svg>');
    }

    merch-card[variant="product-c2"][background-color="gray"] {
        background-color: var(--gray);
    }

    merch-card[variant="product-c2"] [slot="short-description"] .icon-button::before {
        top: unset;
        left: 50%;
        transform: translateX(-50%);
        margin-left: 0;
        bottom: 100%;
        margin-bottom: 8px;
    }

    merch-card[variant="product-c2"] [slot="short-description"] .icon-button::after {
        top: unset;
        left: 50%;
        margin-left: -8px;
        transform: none;
        bottom: calc(100% - 8px);
        border-color: #0469E3 transparent transparent transparent;
    }
}

@media screen and (max-width: 900px) {
    merch-card[variant="product-c2"] {
        max-width: unset;
    }
}

`;var jo={cardName:{attribute:"name"},subtitle:{tag:"p",slot:"subtitle"},description:{tag:"div",slot:"body-xs"},prices:{tag:"p",slot:"heading-m"},shortDescription:{tag:"div",slot:"short-description"},ctas:{slot:"footer",size:"m"},planType:!0,backgroundColor:{attribute:"background-color"},allowedColors:{gray:"--spectrum-gray-100",black:"--spectrum-black"},badge:{tag:"div",slot:"badge",default:"color-yellow-300-variation"},allowedBadgeColors:["color-white","color-yellow-300-variation","color-gray-300-variation","color-gray-700-variation","color-green-900-variation","color-red-700-variation"],style:"consonant"},at=class extends b{getGlobalCSS(){return Uo}get mainPrice(){return this.card.querySelector(`[slot="heading-m"] ${y}[data-template="price"]`)}async postCardUpdateHook(){this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook()}async adjustLegal(){if(!(this.legalAdjusted||!this.card.id))try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let r=this.mainPrice;if(!r)return;let e=r.cloneNode(!0);if(await r.onceSettled(),!r?.options)return;r.options.displayPlanType&&(r.dataset.displayPlanType="false"),e.setAttribute("data-template","legal"),e.dataset.displayPerUnit="false",r.parentNode.insertBefore(e,r.nextSibling),await e.onceSettled()}catch{}}priceOptionsProvider(r,e){r.dataset.template===P&&(e.displayPlanType=this.card?.settings?.displayPlanType??!0)}renderLayout(){return Gi`
            ${this.badge}
            <div class="body">
                <div class="heading">
                    <slot name="subtitle"></slot>
                    <slot name="badge"></slot>
                </div>
                <slot name="heading-m"></slot>
                <slot name="body-xs"></slot>
                <slot name="short-description"></slot>
            </div>
            <footer><slot name="footer"></slot></footer>
            <slot></slot>
        `}};d(at,"variantStyle",Vi`
        :host([variant='product-c2']) {
            display: flex;
            flex-direction: column;
            gap: 24px;
            padding: 24px;
            box-sizing: border-box;
            border-radius: 12px;
            color: #000;
            border: none;
        }

        :host([variant='product-c2']) .body {
            padding: 0;
        }

        :host([variant='product-c2']) .heading {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
        }

        :host([variant='product-c2']) footer {
            gap: 8px;
            padding: 0;
            justify-content: flex-start;
        }

        .body .catalog-badge {
            display: flex;
            height: fit-content;
            flex-direction: column;
            width: fit-content;
            max-width: 140px;
            border-radius: 5px;
            position: relative;
            top: 0;
            margin-left: var(--consonant-merch-spacing-xxs);
            box-sizing: border-box;
        }
    `);var ot=new Map,Go=new WeakMap,Vo=new Map,A=(a,r,e=null,t=null,o)=>{ot.set(a,{class:r,fragmentMapping:e,style:t,collectionOptions:o})},Wo=(a,r,e)=>{ot.set(a,{fragmentMapping:e,load:r})},Ko=a=>{let r=ot.get(a);if(!(!r?.load||r.class))return r.loading??(r.loading=r.load().then(e=>{r.class=e,r.style=e.variantStyle},e=>{throw r.loading=void 0,e})),r.loading};A("catalog",De,Ua,De.variantStyle);A("image",ve);A("inline-heading",Gt);A("mini-compare-chart",Ie,Tr,Ie.variantStyle);A("mini-compare-chart-mweb",Fe,_r,Fe.variantStyle);A("plans",H,Kt,H.variantStyle,H.collectionOptions);A("plans-students",H,Ja,H.variantStyle,H.collectionOptions);A("plans-education",H,Xa,H.variantStyle,H.collectionOptions);A("plans-v2",se,Mr,se.variantStyle,se.collectionOptions);A("pro",St,so,St.variantStyle);A("product",Ue,po,Ue.variantStyle);A("brand-concierge-product",je,uo,je.variantStyle);A("segment",Ge,bo,Ge.variantStyle);A("media",Ve,xo,Ve.variantStyle);A("headless",Ye,Ao,Ye.variantStyle);A("special-offers",We,wo,We.variantStyle);Wo("simplified-pricing-express",()=>import("./merch-card-express.js").then(({SimplifiedPricingExpress:a})=>a),ko);Wo("full-pricing-express",()=>import("./merch-card-express.js").then(({FullPricingExpress:a})=>a),Eo);A("mini",Qe,Lo,Qe.variantStyle);A("image",ve,Ga,ve.variantStyle);A("compare-chart-column",Ze,Hr,Ze.variantStyle);A("fries",Xe,qr,Xe.variantStyle);A("marquee",Je,Oo,Je.variantStyle);A("faq",et,Do,et.variantStyle);A("banner-blade",tt,Fo,tt.variantStyle);A("product-pricing",rt,qo,rt.variantStyle);A("product-c2",at,jo,at.variantStyle);var Wi=(a,r,e)=>{try{let t=Vo.get(a.variant);if(t||(t=new CSSStyleSheet,t.replaceSync(r.cssText),Vo.set(a.variant,t)),e?.styleSheet&&e.styleSheet!==t){let o=a.shadowRoot.adoptedStyleSheets.indexOf(e.styleSheet);o!==-1&&a.shadowRoot.adoptedStyleSheets.splice(o,1)}return a.shadowRoot.adoptedStyleSheets.includes(t)||a.shadowRoot.adoptedStyleSheets.push(t),{styleSheet:t}}catch{let o=document.createElement("style");o.textContent=r.cssText,o.setAttribute("data-variant-style",a.variant);let n=e?.styleElement||a.shadowRoot.querySelector("[data-variant-style]");return n&&n.remove(),a.shadowRoot.appendChild(o),{styleElement:o}}},Yr=a=>{let r=ot.get(a.variant);if(!r?.class)return;let{class:e,style:t}=r,o=Go.get(a);if(o?.appliedVariant===a.variant)return new e(a);let n=t?Wi(a,t,o):{};return Go.set(a,{appliedVariant:a.variant,...n}),new e(a)};function ir(a){return ot.get(a)?.fragmentMapping}function Yo(a){return ot.get(a)?.collectionOptions}var Qo=document.createElement("style");Qo.innerHTML=`
:root {
    --consonant-merch-card-detail-font-size: 12px;
    --consonant-merch-card-detail-font-weight: 500;
    --consonant-merch-card-detail-letter-spacing: 0.8px;

    --consonant-merch-card-heading-font-size: 18px;
    --consonant-merch-card-heading-line-height: 22.5px;
    --consonant-merch-card-heading-secondary-font-size: 14px;
    --consonant-merch-card-body-font-size: 14px;
    --consonant-merch-card-body-line-height: 21px;
    --consonant-merch-card-promo-text-height: var(--consonant-merch-card-body-font-size);

    /* Fonts */
    --merch-body-font-family: 'Adobe Clean', adobe-clean, 'Trebuchet MS', sans-serif;

    /* spacing */
    --consonant-merch-spacing-xxxs: 4px;
    --consonant-merch-spacing-xxs: 8px;
    --consonant-merch-spacing-xs: 16px;
    --consonant-merch-spacing-s: 24px;
    --consonant-merch-spacing-m: 32px;

    /* cta */
    --consonant-merch-card-cta-font-size: 15px;

    /* badge */
    --type-heading-xxs-size: 11px;

    /* headings */
    --consonant-merch-card-heading-xxxs-font-size: 14px;
    --consonant-merch-card-heading-xxxs-line-height: 18px;
    --consonant-merch-card-heading-xxs-font-size: 16px;
    --consonant-merch-card-heading-xxs-line-height: 20px;
    --consonant-merch-card-heading-xs-font-size: 18px;
    --consonant-merch-card-heading-xs-line-height: 22.5px;
    --consonant-merch-card-heading-s-font-size: 20px;
    --consonant-merch-card-heading-s-line-height: 25px;
    --consonant-merch-card-heading-m-font-size: 24px;
    --consonant-merch-card-heading-m-line-height: 30px;
    --consonant-merch-card-heading-l-font-size: 28px;
    --consonant-merch-card-heading-l-line-height: 36.4px;
    --consonant-merch-card-heading-xl-font-size: 32px;
    --consonant-merch-card-heading-xl-line-height: 40px;


    /* detail */
    --consonant-merch-card-detail-xs-line-height: 12px;
    --consonant-merch-card-detail-s-font-size: 11px;
    --consonant-merch-card-detail-s-line-height: 14px;
    --consonant-merch-card-detail-m-font-size: 12px;
    --consonant-merch-card-detail-m-line-height: 15px;
    --consonant-merch-card-detail-m-font-weight: 700;
    --consonant-merch-card-detail-m-letter-spacing: 1px;
    --consonant-merch-card-detail-l-line-height: 18px;
    --consonant-merch-card-detail-l-line-height: 23px;

    /* body */
    --consonant-merch-card-body-xxs-font-size: 12px;
    --consonant-merch-card-body-xxs-line-height: 18px;
    --consonant-merch-card-body-xxs-letter-spacing: 1px;
    --consonant-merch-card-body-xs-font-size: 14px;
    --consonant-merch-card-body-xs-line-height: 21px;
    --consonant-merch-card-body-s-font-size: 16px;
    --consonant-merch-card-body-s-line-height: 24px;
    --consonant-merch-card-body-m-font-size: 18px;
    --consonant-merch-card-body-m-line-height: 27px;
    --consonant-merch-card-body-l-font-size: 20px;
    --consonant-merch-card-body-l-line-height: 30px;
    --consonant-merch-card-body-xl-font-size: 22px;
    --consonant-merch-card-body-xxl-font-size: 24px;
    --consonant-merch-card-body-xl-line-height: 33px;


    --consonant-merch-card-heading-padding: 0;

    /* colors */
    --consonant-merch-card-background-color: inherit;
    --consonant-merch-card-border-color: #eaeaea;
    --color-accent: rgb(59, 99, 251);
    --merch-color-focus-ring: #1473E6;
    --merch-color-grey-10: #f6f6f6;
    --merch-color-grey-50: var(--spectrum-gray-50);
    --merch-color-grey-60: var(--spectrum-gray-600);
    --merch-color-grey-80: #2c2c2c;
    --merch-color-grey-200: #E8E8E8;
    --merch-color-grey-600: #686868;
    --merch-color-grey-700: #464646;
    --merch-color-grey-800: #222222;
    --merch-color-green-promo: #05834E;
    --merch-color-red-promo: #D31510;
    --merch-color-error: #D73220;
    --merch-color-red-strikethrough: #ff0000;
    --merch-color-error-background: #ffebe8;
    --merch-color-grey-80: #2c2c2c;
    --consonant-merch-card-body-xs-color: var(--spectrum-gray-800, var(--merch-color-grey-80));
    --merch-color-inline-price-strikethrough: initial;
    --consonant-merch-card-detail-s-color: var(--spectrum-gray-600, var(--merch-color-grey-600));
    --consonant-merch-card-heading-color: var(--spectrum-gray-800, var(--merch-color-grey-80));
    --consonant-merch-card-heading-xs-color: var(--consonant-merch-card-heading-color);
    --consonant-merch-card-price-color: #222222;
    --consonant-merch-card-heading-xxxs-color: #131313;
    --consonant-merch-card-body-xxs-color: #292929;

    /* ccd colors */
    --ccd-gray-200-light: #E6E6E6;
    --ccd-gray-800-dark: #222;
    --ccd-gray-700-dark: #464646;
    --ccd-gray-600-light: #6D6D6D;

    /* ah colors */
    --ah-gray-500: #717171;
    --fuchsia: #FDE9FF;

    /* plans colors */
    --spectrum-yellow-300-plans: #F5C700;
    --spectrum-green-900-plans: #05834E;
    --spectrum-gray-300-plans: #DADADA;
    --spectrum-gray-700-plans: #505050;
    --spectrum-red-700-plans: #EB1000;

    /* base spectrum colors (used by merch-badge) */
    --spectrum-yellow-300: #F5C700;
    --spectrum-green-900: #05834E;
    --spectrum-red-700: #EB1000;

    /* special-offers colors */
    --spectrum-yellow-300-special-offers: #EDCC00;
    --spectrum-green-900-special-offers: #2D9D78;
    --spectrum-gray-300-special-offers: #D1D1D1;
    --gradient-purple-blue: linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%);
    --gradient-firefly-spectrum: linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%);

    --color-yellow-300-variation: var(--spectrum-yellow-300-plans);
    --color-green-900-variation: var(--spectrum-green-900-plans);
    --color-gray-300-variation: var(--spectrum-gray-300-plans);
    --color-gray-700-variation: var(--spectrum-gray-700-plans);
    --color-red-700-variation: var(--spectrum-red-700-plans);

    /* simplified-pricing-express colors */
    --spectrum-gray-50: #FFFFFF;
    --spectrum-gray-100: #F8F8F8;
    --spectrum-gray-200: #E6E6E6;
    --spectrum-gray-300: #D5D5D5;
    --spectrum-gray-400: #B8B8B8;
    --spectrum-gray-500: #909090;
    --spectrum-gray-600: #6D6D6D;
    --spectrum-gray-700: #494949;
    --spectrum-gray-800: #2C2C2C;
    --spectrum-gray-900: #1C1C1C;
    --spectrum-indigo-300: #D3D5FF;
    --spectrum-indigo-900: #5258E4;

    /* merch card generic */
    --consonant-merch-card-max-width: 300px;
    --transition: cmax-height 0.3s linear, opacity 0.3s linear;

    /* background image */
    --consonant-merch-card-bg-img-height: 180px;

    /* backgrounds field image */
    --consonant-merch-card-backgrounds-img-object-fit: contain;
    --consonant-merch-card-backgrounds-img-radius: 16px;

    /* inline SVGs */
    --checkmark-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath fill='%23fff' d='M3.788 9A.999.999 0 0 1 3 8.615l-2.288-3a1 1 0 1 1 1.576-1.23l1.5 1.991 3.924-4.991a1 1 0 1 1 1.576 1.23l-4.712 6A.999.999 0 0 1 3.788 9z' class='spectrum-UIIcon--medium'/%3E%3C/svg%3E%0A");

    --secure-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23757575' viewBox='0 0 12 15'%3E%3Cpath d='M11.5 6H11V5A5 5 0 1 0 1 5v1H.5a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5ZM3 5a3 3 0 1 1 6 0v1H3Zm4 6.111V12.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1.389a1.5 1.5 0 1 1 2 0Z'/%3E%3C/svg%3E");

    --info-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'><circle cx='18' cy='12' r='2.15'%3E%3C/circle%3E%3Cpath d='M20.333 24H20v-7.6a.4.4 0 0 0-.4-.4h-3.933s-1.167.032-1.167 1 1.167 1 1.167 1H16v6h-.333s-1.167.032-1.167 1 1.167 1 1.167 1h4.667s1.167-.033 1.167-1-1.168-1-1.168-1z'%3E%3C/path%3E%3Cpath d='M18 2.1A15.9 15.9 0 1 0 33.9 18 15.9 15.9 0 0 0 18 2.1zm0 29.812A13.912 13.912 0 1 1 31.913 18 13.912 13.912 0 0 1 18 31.913z'%3E%3C/path%3E%3C/svg%3E");

    --ellipsis-icon: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="2" cy="2" r="2" fill="%232c2c2c" transform="translate(6 6)"/><circle cx="2" cy="2" r="2" fill="%232c2c2c" data-name="Ellipse 71" transform="translate(12 6)"/><circle cx="2" cy="2" r="2" fill="%232c2c2c" transform="translate(0 6)"/></svg>');

    /* callout */
    --consonant-merch-card-callout-line-height: 21px;
    --consonant-merch-card-callout-font-size: 14px;
    --consonant-merch-card-callout-font-color: #2C2C2C;
    --consonant-merch-card-callout-icon-size: 16px;
    --consonant-merch-card-callout-icon-top: 6px;
    --consonant-merch-card-callout-icon-right: 8px;
    --consonant-merch-card-callout-letter-spacing: 0px;
    --consonant-merch-card-callout-icon-padding: 34px;
    --consonant-merch-card-callout-spacing-xxs: 8px;

    --merch-card-ul-padding: 8px;
}

.collection-container {
    display: grid;
    justify-content: center;
    grid-template-columns: min-content min-content;
    grid-template-rows: min-content 1fr;
    align-items: start;
    grid-template-areas: "sidenav header" "sidenav content";
    --merch-card-collection-card-min-height: auto;
    --merch-sidenav-collection-gap: 0;
    --merch-card-collection-card-width: unset;
}

.collection-container merch-sidenav {
    grid-area: sidenav;
}

.collection-container merch-card-collection-header {
    --merch-card-collection-header-margin-bottom: var(--spacing-m);
    grid-area: header;
}

.collection-container merch-card-collection {
    grid-area: content;
}

.collection-container merch-card {
    min-height: var(--merch-card-collection-card-min-height);
}

.collection-container .one-merch-card,
.collection-container .two-merch-cards,
.collection-container .three-merch-cards,
.collection-container .four-merch-cards {
    padding: 0;
}

merch-card-collection {
    display: contents;
}

merch-card-collection > p[slot],
merch-card-collection > div[slot] p,
merch-card-collection-header > p[slot],
merch-card-collection-header > div[slot] p {
    margin: 0;
}

.one-merch-card,
.two-merch-cards,
.three-merch-cards,
.four-merch-cards,
.section.one-merch-card > .content,
.section[class$="merch-cards"] > .content
{
    --merch-card-collection-card-width: unset;
    display: grid;
    justify-content: center;
    justify-items: stretch;
    align-items: normal;
    gap: var(--consonant-merch-spacing-m);
    padding: var(--spacing-m);
    grid-template-columns: var(--merch-card-collection-card-width);
}

.section.one-merch-card > .content,
.section[class$="merch-cards"] > .content {
	padding: 0;
}

.tab-content [role='tabpanel'] .section.one-merch-card > .content,
.tab-content [role='tabpanel'] .section[class$="merch-cards"] > .content {
	width: auto;
}

.tabpanel > .four-merch-cards {
    z-index: 3;
}

/* hide download/upgrade links except the first one */
merch-card a[is="checkout-link"].download:not(:first-of-type),
merch-card a[is="checkout-link"].upgrade:not(:first-of-type) {
  display: none;
}

merch-card[variant="ccd-suggested"] *,
merch-card[variant="ccd-slice"] * {
  box-sizing: border-box;
}

merch-card * {
  padding: revert-layer;
}

merch-card.background-opacity-70 {
    background-color: rgba(255 255 255 / 70%);
}

merch-card.has-divider hr {
    margin: var(--consonant-merch-spacing-xs) 0;
    height: 1px;
    border: none;
}

merch-card hr {
    border: none;
    margin: 0;
    background-color: var(--spectrum-gray-300);
    height: 1px;
}

merch-card.has-divider div[slot='body-lower'] hr {
    margin: 0;
}

merch-card p, merch-card h3, merch-card h4 {
    margin: 0;
}

merch-card span[is='inline-price'] {
    display: inline-block;
}

merch-card [slot^='heading-'],
merch-card span[class^='heading-'] {
    color: var(--consonant-merch-card-heading-color);
    font-weight: 700;
}

merch-card span[class^='heading-'],
merch-card span.promo-text {
    display: block;
}

merch-card [slot='heading-xxxs'],
merch-card span.heading-xxxs {
    font-size: var(--consonant-merch-card-heading-xxxs-font-size);
    line-height: var(--consonant-merch-card-heading-xxxs-line-height);
    color: var(--consonant-merch-card-heading-xxxs-color);
    letter-spacing: normal;
}

merch-card [slot='heading-xxs'],
merch-card span.heading-xxs {
    font-size: var(--consonant-merch-card-heading-xxs-font-size);
    line-height: var(--consonant-merch-card-heading-xxs-line-height);
    letter-spacing: normal;
}

merch-card [slot='heading-xs'],
merch-card span.heading-xs {
    font-size: var(--consonant-merch-card-heading-xs-font-size);
    line-height: var(--consonant-merch-card-heading-xs-line-height);
    color: var(--consonant-merch-card-heading-xs-color);
    margin: 0;
}

merch-card.dc-pricing [slot='heading-xs'] {
    margin-bottom: var(--consonant-merch-spacing-xxs);
}

merch-card:not([variant='inline-heading']) [slot='heading-xs'] a {
    color: var(--merch-color-grey-80);
}

merch-card div.starting-at {
  font-size: var(--consonant-merch-card-body-xs-font-size);
  line-height: var(--consonant-merch-card-body-xs-line-height);
  font-weight: 500;
}

merch-card [slot='heading-xs'] a:not(:hover) {
    text-decoration: inherit;
}

merch-card [slot='heading-s'],
merch-card span.heading-s {
    font-size: var(--consonant-merch-card-heading-s-font-size);
    line-height: var(--consonant-merch-card-heading-s-line-height);
    margin: 0;
}

merch-card [slot='heading-m'],
merch-card span.heading-m {
    font-size: var(--consonant-merch-card-heading-m-font-size);
    line-height: var(--consonant-merch-card-heading-m-line-height);
    margin: 0;
}

merch-card [slot='heading-m-price'] {
    font-size: var(--consonant-merch-card-heading-m-font-size);
    line-height: var(--consonant-merch-card-heading-m-line-height);
    padding: 0 var(--consonant-merch-spacing-s);
    margin: 0;
    color: var(--spectrum-gray-800, #2c2c2c);
}

merch-card [slot='heading-l'],
merch-card span.heading-l {
    font-size: var(--consonant-merch-card-heading-l-font-size);
    line-height: var(--consonant-merch-card-heading-l-line-height);
    font-weight: 900;
    margin: 0;
}

/* RTL text alignment for all heading slots */
[dir="rtl"] merch-card [slot^='heading-'],
[dir="rtl"] merch-card [class^='heading-'] {
    text-align: right;
}

merch-card [slot='offers'] {
    padding: var(--consonant-merch-spacing-xxs) var(--consonant-merch-spacing-s);
}

merch-card [slot='whats-included'] {
    margin: var(--consonant-merch-spacing-xxxs) 0px;
}

merch-card [slot='callout-content'] {
    display: flex;
    flex-direction: column;
    margin: var(--consonant-merch-spacing-xxxs) 0px;
    gap: var(--consonant-merch-card-callout-spacing-xxs);
}

merch-card[variant='product'] [slot='badge'],
merch-card[variant='segment'] [slot='badge'],
merch-card[variant^='plans'] [slot='badge'],
merch-card[variant='special-offers'] [slot='badge'] {
    position: absolute;
    top: 16px;
    inset-inline-end: 0;
    line-height: 16px;
}

merch-card [slot='callout-content'] > p {
    background: rgba(203 203 203 / 50%);
    border-radius: var(--consonant-merch-spacing-xxxs);
    padding: var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xxs);
    width: fit-content;
    font-size: var(--consonant-merch-card-callout-font-size);
    line-height: var(--consonant-merch-card-callout-line-height);
}

merch-card [slot='callout-content'] > div {
    display: flex;
    flex-direction: column;
    margin: var(--consonant-merch-spacing-xxxs) 0px;
    gap: var(--consonant-merch-card-callout-spacing-xxs);
    align-items: flex-start;
}

merch-card [slot='callout-content'] > div > div {
    display: flex;
    background: rgba(203 203 203 / 50%);
    border-radius: var(--consonant-merch-spacing-xxxs);
    padding: var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xxs);
}

merch-card [slot='callout-content'] > div > div > div {
    display: inline-block;
    text-align: start;
    font: normal normal normal var(--consonant-merch-card-callout-font-size)/var(--consonant-merch-card-callout-line-height) var(--body-font-family, 'Adobe Clean');
    letter-spacing: var(--consonant-merch-card-callout-letter-spacing);
    color: var(--consonant-merch-card-callout-font-color);
}

merch-card [slot='callout-content'] img {
    width: var(--consonant-merch-card-callout-icon-size);
    height: var(--consonant-merch-card-callout-icon-size);
    margin-inline-end: 2.5px;
    margin-inline-start: 9px;
    margin-block-start: 2.5px;
}

merch-card [slot='detail-s'] {
    font-size: var(--consonant-merch-card-detail-s-font-size);
    line-height: var(--consonant-merch-card-detail-s-line-height);
    letter-spacing: 0.66px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--consonant-merch-card-detail-s-color);
}

merch-card [slot='detail-m'] {
    font-size: var(--consonant-merch-card-detail-m-font-size);
    letter-spacing: var(--consonant-merch-card-detail-m-letter-spacing);
    font-weight: var(--consonant-merch-card-detail-m-font-weight);
    text-transform: uppercase;
    margin: 0;
    color: var(--merch-color-grey-80);
}

merch-card [slot="body-xxs"] {
    font-size: var(--consonant-merch-card-body-xxs-font-size);
    line-height: var(--consonant-merch-card-body-xxs-line-height);
    font-weight: normal;
    letter-spacing: var(--consonant-merch-card-body-xxs-letter-spacing);
    margin: 0;
    color: var(--merch-color-grey-80);
}

merch-card [slot="body-s"] {
    color: var(--consonant-merch-card-body-s-color);
}

merch-card button.spectrum-Button > a {
  color: inherit;
  text-decoration: none;
}

merch-card button.spectrum-Button > a:hover {
  color: inherit;
}

merch-card button.spectrum-Button > a:active {
  color: inherit;
}

merch-card button.spectrum-Button > a:focus {
  color: inherit;
}

merch-card [slot="body-xs"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
    color: var(--consonant-merch-card-body-xs-color);
}

merch-card [slot="body-m"] {
    font-size: var(--consonant-merch-card-body-m-font-size);
    line-height: var(--consonant-merch-card-body-m-line-height);
    color: var(--merch-color-grey-80);
}

merch-card [slot="body-l"] {
    font-size: var(--consonant-merch-card-body-l-font-size);
    line-height: var(--consonant-merch-card-body-l-line-height);
    color: var(--merch-color-grey-80);
}

merch-card [slot="body-xl"] {
    font-size: var(--consonant-merch-card-body-xl-font-size);
    line-height: var(--consonant-merch-card-body-xl-line-height);
    color: var(--merch-color-grey-80);
}

merch-card [slot="cci-footer"] p,
merch-card [slot="cct-footer"] p,
merch-card [slot="cce-footer"] p {
    margin: 0;
}

merch-card [slot="promo-text"],
merch-card span.promo-text {
    color: var(--merch-color-green-promo);
    font-size: var(--consonant-merch-card-promo-text-height);
    font-weight: 700;
    line-height: var(--consonant-merch-card-heading-font-size);
    margin: 0;
    min-height: var(--consonant-merch-card-promo-text-height);
    padding: 0;
}

merch-card span[data-styling][class^='heading-'],
merch-card span[data-styling].promo-text {
    display: block;
}

merch-card [slot="footer-rows"] {
    min-height: var(--consonant-merch-card-footer-rows-height);
}

merch-card div[slot="footer"] {
    display: contents;
}

merch-card.product div[slot="footer"] {
    display: block;
}

merch-card.product div[slot="footer"] a + a {
    margin: 5px 0 0 5px;
}

merch-card [slot="footer"] a {
    word-wrap: break-word;
    text-align: center;
}

merch-card [slot="footer"] a:not([class]) {
    font-weight: 700;
    font-size: var(--consonant-merch-card-cta-font-size);
}

merch-card div[slot='bg-image'] img {
    position: relative;
    width: 100%;
    min-height: var(--consonant-merch-card-bg-img-height);
    max-height: var(--consonant-merch-card-bg-img-height);
    object-fit: cover;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
}

merch-card picture[slot='backgrounds'] img {
    position: relative;
    width: 100%;
    min-height: var(--consonant-merch-card-bg-img-height);
    max-height: var(--consonant-merch-card-bg-img-height);
    object-fit: var(--consonant-merch-card-backgrounds-img-object-fit);
    border-top-left-radius: var(--consonant-merch-card-backgrounds-img-radius);
    border-top-right-radius: var(--consonant-merch-card-backgrounds-img-radius);
}

.price-unit-type:not(.disabled)::before,
.price-tax-inclusivity:not(.disabled)::before {
  content: "\\00a0";
}

merch-card span.placeholder-resolved[data-template='priceStrikethrough'],
merch-card span.placeholder-resolved[data-template='strikethrough'],
merch-card span.price.price-strikethrough {
  font-size: var(--consonant-merch-card-body-xs-font-size);
  font-weight: normal;
  text-decoration: line-through;
  color: var(--merch-color-inline-price-strikethrough);
}

merch-card [slot^="body-"] ul {
    margin: 0;
    padding-inline-start: var(--merch-card-ul-padding);
    list-style-type: "\u2022";
}

merch-card [slot^="body-"] ul li {
    padding-inline-start: var(--merch-card-ul-padding);
}

/* merch-offer-select */
merch-offer-select[variant="subscription-options"] merch-offer span[is="inline-price"][data-display-tax='true'] .price-tax-inclusivity {
    font-size: 12px;
    font-style: italic;
    font-weight: normal;
    position: absolute;
    left: 0;
    top: 20px;
}

merch-addon span[is='inline-price'][data-wcs-osi][data-offer-type="TRIAL"] {
    display: none;
}

merch-gradient {
    display: none;
}

body.merch-modal {
    overflow: hidden;
    scrollbar-gutter: stable;
    height: 100vh;
}

merch-sidenav-list img[slot="icon"] {
    height: fit-content;
    pointer-events: none;
}

merch-sidenav-list sp-sidenav > sp-sidenav-item:last-of-type {
    --mod-sidenav-gap: 0;
    line-height: var(--mod-sidenav-top-level-line-height)
}

/* RTL support for sp-sidenav-item */
[dir="rtl"] sp-sidenav-item {
    text-align: right;
}

/* Only apply flex layout when icon with .right class is present */
[dir="rtl"] sp-sidenav-item:has([slot="icon"].right) {
    display: flex;
    flex-direction: row;
}

[dir="rtl"] sp-sidenav-item [slot="icon"].right {
    position: relative;
    right: auto;
    left: auto;
    order: 2;
    margin-inline-start: var(--mod-sidenav-icon-spacing, var(--spectrum-sidenav-icon-spacing));
}

merch-sidenav-checkbox-group h3 {
    font-size: var(--merch-sidenav-checkbox-group-title-font-size);
    font-weight: var(--merch-sidenav-checkbox-group-title-font-weight);
    line-height: var(--merch-sidenav-checkbox-group-title-line-height);
    color: var(--merch-sidenav-checkbox-group-title-color);
    padding: var(--merch-sidenav-checkbox-group-title-padding);
    margin: 0;
}

[dir="rtl"] merch-sidenav-checkbox-group h3 {
    text-align: right;
}

sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

merch-card [slot='callout-content'] .icon-button {
  position: relative;
  top: 4px;
  text-decoration: none;
  border-bottom: none;
  min-width: 18px;
  display: inline-flex;
  min-height: 18px;
  align-items: center;
  justify-content: center;
  background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14"><path d="M7 .778A6.222 6.222 0 1 0 13.222 7 6.222 6.222 0 0 0 7 .778zM6.883 2.45a1.057 1.057 0 0 1 1.113.998q.003.05.001.1a1.036 1.036 0 0 1-1.114 1.114A1.052 1.052 0 0 1 5.77 3.547 1.057 1.057 0 0 1 6.784 2.45q.05-.002.1.001zm1.673 8.05a.389.389 0 0 1-.39.389H5.834a.389.389 0 0 1-.389-.389v-.778a.389.389 0 0 1 .39-.389h.388V7h-.389a.389.389 0 0 1-.389-.389v-.778a.389.389 0 0 1 .39-.389h1.555a.389.389 0 0 1 .389.39v3.5h.389a.389.389 0 0 1 .389.388z"/></svg>');
  background-size: 18px;
}

merch-card [slot='callout-content'] .icon-button::before {
  content: attr(data-tooltip);
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 100%;
  margin-left: 8px;
  max-width: 140px;
  padding: 10px;
  border-radius: 5px;
  background: #0469E3;
  color: #fff;
  text-align: left;
  display: none;
  z-index: 10;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 16px;
  width: max-content;
}

merch-card [slot='callout-content'] .icon-button.tooltip-visible::before {
    display: block;
}

merch-card [slot='callout-content'] .icon-button::after {
  content: "";
  position: absolute;
  left: 102%;
  margin-left: -8px;
  top: 50%;
  transform: translateY(-50%);
  border: 8px solid #0469E3;
  border-color: transparent #0469E3 transparent transparent;
  display: none;
  z-index: 10;
}

merch-card [slot='callout-content'] .icon-button.tooltip-visible::after {
    display: block;
}

merch-card [slot='callout-content'] .icon-button.hide-tooltip::before,
merch-card [slot='callout-content'] .icon-button.hide-tooltip::after {
  display: none;
}

merch-card merch-whats-included [slot="contentBullets"] [slot="icon"] {
    margin-right: 10px;
}

merch-card merch-mnemonic-list [slot="description"] .icon-button {
  position: relative;
  text-decoration: none;
  border-bottom: none;
  min-width: 18px;
  display: inline-flex;
  min-height: 18px;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14"><path d="M7 .778A6.222 6.222 0 1 0 13.222 7 6.222 6.222 0 0 0 7 .778zM6.883 2.45a1.057 1.057 0 0 1 1.113.998q.003.05.001.1a1.036 1.036 0 0 1-1.114 1.114A1.052 1.052 0 0 1 5.77 3.547 1.057 1.057 0 0 1 6.784 2.45q.05-.002.1.001zm1.673 8.05a.389.389 0 0 1-.39.389H5.834a.389.389 0 0 1-.389-.389v-.778a.389.389 0 0 1 .39-.389h.388V7h-.389a.389.389 0 0 1-.389-.389v-.778a.389.389 0 0 1 .39-.389h1.555a.389.389 0 0 1 .389.39v3.5h.389a.389.389 0 0 1 .389.388z"/></svg>');
  background-size: 18px;
  background-repeat: no-repeat;
  background-position: center;
}

merch-card merch-mnemonic-list [slot="description"] .icon-button::before {
  content: attr(data-tooltip);
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 100%;
  margin-left: 8px;
  max-width: 140px;
  padding: 10px;
  border-radius: 5px;
  background: #0469E3;
  color: #fff;
  text-align: left;
  display: none;
  z-index: 10;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 16px;
  width: max-content;
}

merch-card merch-mnemonic-list [slot="description"] .icon-button::after {
  content: "";
  position: absolute;
  left: 102%;
  margin-left: -8px;
  top: 50%;
  transform: translateY(-50%);
  border: 8px solid #0469E3;
  border-color: transparent #0469E3 transparent transparent;
  display: none;
  z-index: 10;
}

merch-card merch-mnemonic-list [slot="description"] .icon-button:hover::before,
merch-card merch-mnemonic-list [slot="description"] .icon-button:focus::before,
merch-card merch-mnemonic-list [slot="description"] .icon-button.tooltip-visible::before {
  display: block;
}

merch-card merch-mnemonic-list [slot="description"] .icon-button:hover::after,
merch-card merch-mnemonic-list [slot="description"] .icon-button:focus::after,
merch-card merch-mnemonic-list [slot="description"] .icon-button.tooltip-visible::after {
  display: block;
}

merch-card [slot="short-description"] .icon-button,
merch-card [slot="body-xxs"] .icon-button,
merch-card [slot="body-m"] .icon-button,
merch-card [slot="legal-text"] .icon-button,
merch-card [slot="action-menu-content"] .icon-button,
merch-card .price-plan-type .icon-button {
  position: relative;
  text-decoration: none;
  border-bottom: none;
  min-width: 18px;
  display: inline-flex;
  min-height: 18px;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14"><path d="M7 .778A6.222 6.222 0 1 0 13.222 7 6.222 6.222 0 0 0 7 .778zM6.883 2.45a1.057 1.057 0 0 1 1.113.998q.003.05.001.1a1.036 1.036 0 0 1-1.114 1.114A1.052 1.052 0 0 1 5.77 3.547 1.057 1.057 0 0 1 6.784 2.45q.05-.002.1.001zm1.673 8.05a.389.389 0 0 1-.39.389H5.834a.389.389 0 0 1-.389-.389v-.778a.389.389 0 0 1 .39-.389h.388V7h-.389a.389.389 0 0 1-.389-.389v-.778a.389.389 0 0 1 .39-.389h1.555a.389.389 0 0 1 .389.39v3.5h.389a.389.389 0 0 1 .389.388z"/></svg>');
  background-size: 18px;
  background-repeat: no-repeat;
  background-position: center;
}

merch-card [slot="short-description"] .icon-button::before,
merch-card [slot="body-xxs"] .icon-button::before,
merch-card [slot="body-m"] .icon-button::before,
merch-card [slot="legal-text"] .icon-button::before,
merch-card [slot="action-menu-content"] .icon-button::before,
merch-card .price-plan-type .icon-button::before {
  content: attr(data-tooltip);
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 100%;
  margin-left: 8px;
  max-width: 140px;
  padding: 10px;
  border-radius: 5px;
  background: #0469E3;
  color: #fff;
  text-align: left;
  display: none;
  z-index: 10;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 16px;
  width: max-content;
}

merch-card [slot="short-description"] .icon-button::after,
merch-card [slot="body-xxs"] .icon-button::after,
merch-card [slot="body-m"] .icon-button::after,
merch-card [slot="legal-text"] .icon-button::after,
merch-card [slot="action-menu-content"] .icon-button::after,
merch-card .price-plan-type .icon-button::after {
  content: "";
  position: absolute;
  left: 102%;
  margin-left: -8px;
  top: 50%;
  transform: translateY(-50%);
  border: 8px solid #0469E3;
  border-color: transparent #0469E3 transparent transparent;
  display: none;
  z-index: 10;
}

merch-card [slot="short-description"] .icon-button:hover::before,
merch-card [slot="short-description"] .icon-button:focus::before,
merch-card [slot="short-description"] .icon-button.tooltip-visible::before,
merch-card [slot="body-xxs"] .icon-button:hover::before,
merch-card [slot="body-xxs"] .icon-button:focus::before,
merch-card [slot="body-xxs"] .icon-button.tooltip-visible::before,
merch-card [slot="body-m"] .icon-button:hover::before,
merch-card [slot="body-m"] .icon-button:focus::before,
merch-card [slot="body-m"] .icon-button.tooltip-visible::before,
merch-card [slot="legal-text"] .icon-button:hover::before,
merch-card [slot="legal-text"] .icon-button:focus::before,
merch-card [slot="legal-text"] .icon-button.tooltip-visible::before,
merch-card [slot="action-menu-content"] .icon-button:hover::before,
merch-card [slot="action-menu-content"] .icon-button:focus::before,
merch-card [slot="action-menu-content"] .icon-button.tooltip-visible::before,
merch-card .price-plan-type .icon-button:hover::before,
merch-card .price-plan-type .icon-button:focus::before,
merch-card .price-plan-type .icon-button.tooltip-visible::before {
  display: block;
}

merch-card [slot="short-description"] .icon-button:hover::after,
merch-card [slot="short-description"] .icon-button:focus::after,
merch-card [slot="short-description"] .icon-button.tooltip-visible::after,
merch-card [slot="body-xxs"] .icon-button:hover::after,
merch-card [slot="body-xxs"] .icon-button:focus::after,
merch-card [slot="body-xxs"] .icon-button.tooltip-visible::after,
merch-card [slot="body-m"] .icon-button:hover::after,
merch-card [slot="body-m"] .icon-button:focus::after,
merch-card [slot="body-m"] .icon-button.tooltip-visible::after,
merch-card [slot="legal-text"] .icon-button:hover::after,
merch-card [slot="legal-text"] .icon-button:focus::after,
merch-card [slot="legal-text"] .icon-button.tooltip-visible::after,
merch-card [slot="action-menu-content"] .icon-button:hover::after,
merch-card [slot="action-menu-content"] .icon-button:focus::after,
merch-card [slot="action-menu-content"] .icon-button.tooltip-visible::after,
merch-card .price-plan-type .icon-button:hover::after,
merch-card .price-plan-type .icon-button:focus::after,
merch-card .price-plan-type .icon-button.tooltip-visible::after {
  display: block;
}

/* Collapse the icon column only when no row in this block uses an icon */
merch-card
    merch-whats-included:not(
        :has(
            merch-mnemonic-list [slot="icon"] .sp-icon,
            merch-mnemonic-list [slot="icon"] img[src]:not([src=""]),
            merch-mnemonic-list [slot="icon"] merch-icon[src]:not([src=""])
        )
    )
    merch-mnemonic-list:not([data-placeholder])
    [slot="icon"] {
    display: none;
}

merch-card merch-whats-included[has-bullets] [slot="content"] {
    display: flex;
    flex-wrap: wrap;
    row-gap: 10px;
}

merch-badge[background-color="spectrum-red-700-plans"],
merch-badge[background-color="spectrum-green-900-special-offers"] {
  color: #FFFFFF;
}

/* Badge border-radius with RTL support */
merch-badge {
  --merch-badge-border-radius: 4px 0 0 4px; /* LTR default */
}

[dir="rtl"] merch-badge {
  --merch-badge-border-radius: 0 4px 4px 0; /* RTL override */
}

/* Red border color for merch-cards */
merch-card[border-color="spectrum-red-700-plans"] {
  border-color: var(--spectrum-red-700-plans);
}

@media screen and ${S} {
    merch-card [slot='short-description'] .icon-button.tooltip-left::before,
    merch-card [slot='callout-content'] .icon-button.tooltip-left::before {
        left: -30px;
    }

    merch-card [slot='short-description'] .icon-button.tooltip-right::before,
    merch-card [slot='callout-content'] .icon-button.tooltip-right::before {
        left: unset;
        right: -20px;
    }    
}

@media screen and ${O} {
    merch-card [slot='callout-content'] .icon-button::before {
        top: unset;
        left: unset;
        margin-bottom: 34px;
    }

    merch-card [slot='callout-content'] .icon-button::after {
        top: 0px;
        left: unset;
        margin-left: unset;
        border-color: #0469E3 transparent transparent transparent;
    }

    merch-card merch-mnemonic-list [slot="description"] .icon-button::before,
    merch-card [slot="short-description"] .icon-button::before,
    merch-card [slot="body-xxs"] .icon-button::before,
    merch-card [slot="body-m"] .icon-button::before,
    merch-card [slot="legal-text"] .icon-button::before,
    merch-card [slot="action-menu-content"] .icon-button::before,
    merch-card .price-plan-type .icon-button::before {
        top: unset;
        left: calc(50% - 120px);
        transform: none;
        margin-left: 0;
        bottom: 100%;
        margin-bottom: 8px;
    }

    merch-card merch-mnemonic-list [slot="description"] .icon-button::after,
    merch-card [slot="short-description"] .icon-button::after,
    merch-card [slot="body-xxs"] .icon-button::after,
    merch-card [slot="body-m"] .icon-button::after,
    merch-card [slot="legal-text"] .icon-button::after,
    merch-card [slot="action-menu-content"] .icon-button::after,
    merch-card .price-plan-type .icon-button::after {
        top: unset;
        left: 50%;
        margin-left: -8px;
        transform: none;
        bottom: calc(100% - 8px);
        border-color: #0469E3 transparent transparent transparent;
    }
}

/* RTL support for collection header - Mobile */
[dir="rtl"] merch-card-collection-header {
    --merch-card-collection-header-areas: 'search search' 'sort filter'
        'result result';
}

[dir="rtl"] merch-card-collection-header #result {
    text-align: right;
}

@media screen and ${x} {
    .two-merch-cards,
    .three-merch-cards,
    .four-merch-cards,
	.section[class*="-merch-cards"] > .content
	{
        grid-template-columns: repeat(2, var(--merch-card-collection-card-width));
    }

    /* RTL support for collection header - Tablet */
    [dir="rtl"] merch-card-collection-header {
        --merch-card-collection-header-areas: 'sort filter search'
            'result result result';
    }
}

@media screen and ${C} {

    .four-merch-cards,
	.section.four-merch-cards > .content {
        grid-template-columns: repeat(4, var(--merch-card-collection-card-width));
    }

    .three-merch-cards,
    merch-sidenav ~ .four-merch-cards,
	.section.three-merch-cards > .content {
        grid-template-columns: repeat(3, var(--merch-card-collection-card-width));
    }

    /* RTL support for collection header - Desktop */
    [dir="rtl"] merch-card-collection-header {
        --merch-card-collection-header-areas: 'sort result';
    }
}

@media screen and ${$} {
    .four-merch-cards,
    merch-sidenav ~ .four-merch-cards,
	.section.four-merch-cards > .content {
        grid-template-columns: repeat(4, var(--merch-card-collection-card-width));
    }
}

merch-card[annualized] [slot='heading-m'] [is="inline-price"] .price-annual-prefix + .price-annual,
merch-card[annualized] [slot='heading-m'] [is="inline-price"] .price-annual-prefix,
merch-card[annualized] [slot='heading-m'] [is="inline-price"] .price-annual-suffix {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-font-size);
  font-weight: 400;
}

merch-card[annualized][variant="mini-compare-chart"] [slot="heading-m-price"] {
  display: flex;
  flex-direction: column;
}

merch-card[annualized][variant="mini-compare-chart"] .card-heading [is="inline-price"] .price-annual-prefix + .price-annual,
merch-card[annualized][variant="mini-compare-chart"] .card-heading [is="inline-price"] .price-annual-suffix {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-font-size);
  font-weight: 400;
}

merch-card[annualized] span[is='inline-price'],
merch-card[annualized] [slot='heading-m'] [is="inline-price"] .price-annual-prefix,
merch-card[annualized][variant="mini-compare-chart"] .card-heading [is="inline-price"][data-template="price"] {
  display: inline;
}

merch-card[annualized] [slot='heading-m'] [is="inline-price"] .price.price-strikethrough,
merch-card[annualized] [slot='heading-m'] [is="inline-price"] .price.price-strikethrough span {
  color: var(--merch-color-red-strikethrough);
}

merch-card[variant="pro"][annualized] [slot="heading-m"] [is="inline-price"] .price-annual-prefix:before,
merch-card[annualized]:is([variant="simplified-pricing-express"], [variant="full-pricing-express"]) [slot='price'] [is="inline-price"] .price-annual-prefix:before,
merch-card[variant="special-offers"][annualized] [slot="heading-xs-price"] [is="inline-price"] .price-annual-prefix:before,
merch-card[variant^="mini-compare-chart"][annualized] [slot="heading-m-price"] [is="inline-price"] .price-annual-prefix:before,
merch-card[annualized]:is([variant="product"], [variant="segment"]) [slot="heading-xs"] [is="inline-price"] .price-annual-prefix:before,
merch-card[variant^="plans"][annualized] [slot="heading-m"] [is="inline-price"] .price-annual-prefix:before {
    white-space: pre;
    content: "\\A";
}

merch-card[variant^="plans"][annualized] [slot="heading-m"] p {
  font-size: var(--consonant-merch-card-body-xxl-font-size);
  line-height: var(--consonant-merch-card-body-l-line-height);
}

merch-card[variant^="plans"][annualized] [slot="heading-m"] p:has([data-template="strikethrough"]) {
  font-size: var(--consonant-merch-card-body-xs-font-size);
}

merch-card[variant="pro"][annualized] [slot="heading-m"] [is="inline-price"] .price-annual-prefix,
merch-card[variant="pro"][annualized] [slot="heading-m"] [is="inline-price"] .price.price-annual span,
merch-card[variant="pro"][annualized] [slot="heading-m"] [is="inline-price"] .price-annual-suffix {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    font-weight: 400;
    font-family: var(--consonant-merch-card-pro-font-family-regular);
    letter-spacing: 0;
}

merch-card[variant="simplified-pricing-express"][annualized] [slot='price'] [is="inline-price"] .price-annual-prefix,
merch-card[variant="simplified-pricing-express"][annualized] [slot='price'] [is="inline-price"] .price.price-annual span,
merch-card[variant="simplified-pricing-express"][annualized] [slot='price'] [is="inline-price"] .price-annual-suffix,
merch-card[variant="special-offers"][annualized] [slot="heading-xs-price"] [is="inline-price"] .price-annual-prefix,
merch-card[variant="special-offers"][annualized] [slot="heading-xs-price"] [is="inline-price"] .price-annual,
merch-card[variant="special-offers"][annualized] [slot="heading-xs-price"] [is="inline-price"] .price-annual-suffix,
merch-card[annualized]:is([variant="product"], [variant="segment"]) [slot="heading-xs"] [is="inline-price"] .price-annual-prefix,
merch-card[annualized]:is([variant="product"], [variant="segment"]) [slot="heading-xs"] [is="inline-price"] .price-annual,
merch-card[annualized]:is([variant="product"], [variant="segment"]) [slot="heading-xs"] [is="inline-price"] .price-annual-suffix {
  font-size: var(--consonant-merch-card-body-xs-font-size);
  font-weight: 400;
}

merch-card[variant="full-pricing-express"][annualized] [slot='price'] [is="inline-price"] .price-annual-prefix,
merch-card[variant="full-pricing-express"][annualized] [slot='price'] [is="inline-price"] .price-annual span,
merch-card[variant="full-pricing-express"][annualized] [slot='price'] [is="inline-price"] .price-annual-suffix,
merch-card[variant^="mini-compare-chart"][annualized] [slot="heading-m-price"] [is="inline-price"] .price-annual-prefix,
merch-card[variant^="mini-compare-chart"][annualized] [slot="heading-m-price"] [is="inline-price"] .price-annual,
merch-card[variant^="mini-compare-chart"][annualized] [slot="heading-m-price"] [is="inline-price"] .price-annual-suffix,
merch-card[variant="plans-v2"][annualized] [slot='heading-m'] [is="inline-price"] .price-annual-prefix,
merch-card[variant="plans-v2"][annualized] [slot='heading-m'] [is="inline-price"] .price-annual span,
merch-card[variant="plans-v2"][annualized] [slot='heading-m'] [is="inline-price"] .price-annual-suffix {
  font-size: var(--consonant-merch-card-body-m-font-size);
  font-weight: 400;
}

merch-card[variant^="plans"][annualized] [slot="heading-m"] span.price.price-annual:not(.price-strikethrough):not(.price-promo-strikethrough):not(.price-legal),
merch-card[annualized] [slot='heading-m'] [is="inline-price"] .price-annual-prefix,
merch-card[annualized] [slot='heading-m'] [is="inline-price"] .price-annual,
merch-card[annualized] [slot='heading-m'] [is="inline-price"] .price-annual-suffix {
  font-size: var(--consonant-merch-card-body-xs-font-size);
  line-height: var(--consonant-merch-card-body-xs-line-height);
  position: relative;
  top: calc(-1 * var(--consonant-merch-spacing-xxxs));
}

merch-card[variant="simplified-pricing-express"][annualized] div[slot="price"] > p:first-child,
merch-card[variant="full-pricing-express"][annualized] div[slot="price"] > p:first-child {
  display: inline;
}
`;document.head.appendChild(Qo);import{LitElement as Ki,html as Qr,css as Yi,nothing as Qi}from"./lit-all.min.js";import{unsafeHTML as Zi}from"./lit-all.min.js";var Xi=a=>a?a.startsWith("sp-icon-")?Qr`${Zi(`<${a} class="badge-icon"></${a}>`)}`:Qr`<img src="${a}" class="badge-icon" />`:Qi,nt=class extends Ki{constructor(){super(),this.color="",this.variant="",this.backgroundColor="",this.borderColor="",this.icon=""}connectedCallback(){this.borderColor&&this.borderColor!=="transparent"?this.style.setProperty("--merch-badge-border",`1px solid var(--${this.borderColor})`):this.backgroundColor.startsWith("gradient-")||this.style.setProperty("--merch-badge-border",`1px solid var(--${this.backgroundColor})`),this.style.setProperty("--merch-badge-background-color",`var(--${this.backgroundColor})`),(!this.borderColor||this.borderColor==="transparent")&&this.backgroundColor.startsWith("gradient-")?this.style.setProperty("--merch-badge-padding","3px 11px 4px 11px"):this.style.setProperty("--merch-badge-padding","2px 10px 3px 10px"),this.style.setProperty("--merch-badge-color",this.color),this.style.setProperty("--merch-badge-font-size","var(--consonant-merch-card-body-xs-font-size)");let r=this.closest("merch-card"),e=r?.getAttribute("size"),t=r?.querySelectorAll(":scope > merch-icon").length||0;this.style.setProperty("--merch-badge-offset",t),this.style.setProperty("--merch-badge-with-offset",t?1:0),this.style.setProperty("--merch-badge-card-size",e?2:1),super.connectedCallback()}render(){return Qr`<div class="badge">
            ${Xi(this.icon)}<slot></slot>
        </div>`}};d(nt,"properties",{color:{type:String},variant:{type:String},backgroundColor:{type:String,attribute:"background-color"},borderColor:{type:String,attribute:"border-color"},icon:{type:String}}),d(nt,"styles",Yi`
        :host {
            display: block;
            background: var(--merch-badge-background-color);
            color: var(--merch-badge-color, #000);
            padding: var(--merch-badge-padding);
            border-radius: var(--merch-badge-border-radius);
            font-size: var(--merch-badge-font-size);
            line-height: 21px;
            border: var(--merch-badge-border);
            position: relative;
            inset-inline-start: 1px;
        }

        :host .badge-icon {
            margin-right: 5px;
            position: relative;
            top: 3px;
            height: 18px;
            width: 18px;
        }
    `);customElements.define("merch-badge",nt);import{html as Ji,css as ec,LitElement as tc}from"./lit-all.min.js";var Pt=class extends tc{constructor(){super()}render(){return Ji`
            <slot name="icon"></slot>
            <slot name="description">${this.description}</slot>
        `}};d(Pt,"styles",ec`
        :host {
            display: flex;
            flex-wrap: nowrap;
            gap: 8px;
            margin-right: 16px;
            align-items: center;
        }

        ::slotted([slot='icon']) {
            display: flex;
            justify-content: center;
            align-items: center;
            height: max-content;
        }

        ::slotted([slot='description']) {
            font-size: 14px;
            line-height: 21px;
            margin: 0;
        }

        :host .hidden {
            display: none;
        }
    `),d(Pt,"properties",{description:{type:String,attribute:!0}});customElements.define("merch-mnemonic-list",Pt);import{html as Zr,css as rc,LitElement as ac,nothing as Zo}from"./lit-all.min.js";var _t=class extends ac{updated(){this.hideSeeMoreEls()}hideSeeMoreEls(){this.isMobile&&this.rows.forEach((r,e)=>{e>=5&&(r.style.display=this.showAll?"flex":"none")})}constructor(){super(),this.showAll=!1,this.mobileRows=this.mobileRows===void 0?5:this.mobileRows}toggle(){this.showAll=!this.showAll,this.dispatchEvent(new CustomEvent("hide-see-more-elements",{bubbles:!0,composed:!0})),this.requestUpdate()}render(){return Zr`<slot name="heading"></slot>
            <slot name="contentBullets"></slot>
            ${!this.isMobile||!this.bulletsAdded?Zr`<slot name="content"></slot>`:Zo}
            ${this.isMobile&&this.rows.length>this.mobileRows&&!this.bulletsAdded?Zr`<div @click=${this.toggle} class="see-more">
                      ${this.showAll?"- See less":"+ See more"}
                  </div>`:Zo}`}get isMobile(){return window.matchMedia("(max-width: 767px)").matches}get rows(){return this.querySelectorAll('[slot="content"] merch-mnemonic-list')}get bulletsAdded(){return!!this.querySelector('[slot="contentBullets"] merch-mnemonic-list')}};d(_t,"styles",rc`
        :host {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            overflow: hidden;
            box-sizing: border-box;
            row-gap: 10px;
        }

        :host([has-bullets]) {
            flex-direction: column;
            align-items: start;
        }

        ::slotted([slot='heading']) {
            font-size: 14px;
            font-weight: 700;
            margin-right: 16px;
        }

        ::slotted([slot='heading']:empty) {
            display: none;
        }

        ::slotted([slot='content']) {
            display: contents;
        }

        ::slotted([slot='contentBullets']) {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin: 5px 0;
        }

        .hidden {
            display: none;
        }

        .see-more {
            font-size: 14px;
            text-decoration: underline;
            color: var(--link-color-dark);
        }
    `),d(_t,"properties",{heading:{type:String,attribute:!0},mobileRows:{type:Number,attribute:!0}});customElements.define("merch-whats-included",_t);function Xo(a,r={},{metadata:e=!0,search:t=!0,storage:o=!0}={}){let n;if(t&&n==null){let i=new URLSearchParams(window.location.search),c=Xr(t)?t:a;n=i.get(c)}if(o&&n==null){let i=Xr(o)?o:a;n=window.sessionStorage.getItem(i)??window.localStorage.getItem(i)}if(e&&n==null){let i=nc(Xr(e)?e:a);n=document.documentElement.querySelector(`meta[name="${i}"]`)?.content}return n??r[a]}var oc=a=>typeof a=="boolean",cr=a=>typeof a=="function";var Xr=a=>typeof a=="string";function Jo(a,r){if(oc(a))return a;let e=String(a);return e==="1"||e==="true"?!0:e==="0"||e==="false"?!1:r}function nc(a=""){return String(a).replace(/(\p{Lowercase_Letter})(\p{Uppercase_Letter})/gu,(r,e,t)=>`${e}-${t}`).replace(/\W+/gu,"-").toLowerCase()}var te={clientId:"merch-at-scale",delimiter:"\xB6",ignoredProperties:["analytics","literals","element"],serializableTypes:["Array","Object"],sampleRate:1,severity:"e",tags:"acom",isProdDomain:!1,country:""},en=1e3,tn="mas-commerce-service:country";function ic(a){return a instanceof Error||typeof a?.originatingRequest=="string"}function rn(a){if(a==null)return;let r=typeof a;if(r==="function")return a.name?`function ${a.name}`:"function";if(r==="object"){if(a instanceof Error)return a.message;if(typeof a.originatingRequest=="string"){let{message:t,originatingRequest:o,status:n}=a;return[t,n,o].filter(Boolean).join(" ")}let e=a[Symbol.toStringTag]??Object.getPrototypeOf(a).constructor.name;if(!te.serializableTypes.includes(e))return e}return a}function cc(a,r){if(!te.ignoredProperties.includes(a))return rn(r)}function sc(a){let[r,...e]=a;return r?.constructor===Object?[{...r,[tn]:te.country},...e]:[{[tn]:te.country},...a]}var Jr={append(a){if(a.level!=="error")return;let{message:r,params:e}=a,t=[],o=[],n=r;e.forEach(l=>{l!=null&&(ic(l)?t:o).push(l)}),t.length&&(n+=` ${t.map(rn).join(" ")}`);let{pathname:i,search:c}=window.location,s=`${te.delimiter}page=${i}${c}`;s.length>en&&(s=`${s.slice(0,en)}<trunc>`),n+=s,n+=`${te.delimiter}facts=`,n+=JSON.stringify(sc(o),cc),window.lana?.log(n,te)}};function an(a){Object.assign(te,Object.fromEntries(Object.entries(a).filter(([r,e])=>r in te&&e!==""&&e!==null&&e!==void 0&&!Number.isNaN(e))))}var on={LOCAL:"local",PROD:"prod",STAGE:"stage"},ea={DEBUG:"debug",ERROR:"error",INFO:"info",WARN:"warn"},ta=new Set,ra=new Set,nn=new Map,cn={append({level:a,message:r,params:e,timestamp:t,source:o}){console[a](`${t}ms [${o}] %c${r}`,"font-weight: bold;",...e)}},sn={filter:({level:a})=>a!==ea.DEBUG},lc={filter:()=>!1};function dc(a,r,e,t,o){return{level:a,message:r,namespace:e,get params(){return t.length===1&&cr(t[0])&&(t=t[0](),Array.isArray(t)||(t=[t])),t},source:o,timestamp:performance.now().toFixed(3)}}function hc(a){[...ra].every(r=>r(a))&&ta.forEach(r=>r(a))}function ln(a){let r=(nn.get(a)??0)+1;nn.set(a,r);let e=`${a} #${r}`,t={id:e,namespace:a,module:o=>ln(`${t.namespace}/${o}`),updateConfig:an};return Object.values(ea).forEach(o=>{t[o]=(n,...i)=>hc(dc(o,n,a,i,e))}),Object.seal(t)}function sr(...a){a.forEach(r=>{let{append:e,filter:t}=r;cr(t)&&ra.add(t),cr(e)&&ta.add(e)})}function mc(a={}){let{name:r}=a,e=Jo(Xo("commerce.debug",{search:!0,storage:!0}),r===on.LOCAL);return sr(e?cn:sn),r===on.PROD&&sr(Jr),Mt}function pc(){ta.clear(),ra.clear()}var Mt={...ln(za),Level:ea,Plugins:{consoleAppender:cn,debugFilter:sn,quietFilter:lc,lanaAppender:Jr},init:mc,reset:pc,use:sr};var gc="mas-commerce-service",mp=Mt.module("utilities");var lr=a=>window.setTimeout(a);function dn(a){return a==null?[]:Array.isArray(a)?a:String(a).split(",").map(r=>r.trim())}function aa(){return typeof document>"u"?null:document.getElementsByTagName(gc)?.[0]}var dr=class a extends Error{constructor(r,e,t){if(super(r,{cause:t}),this.name="MasError",e.response){let o=e.response.headers?.get(vr);o&&(e.requestId=o),e.response.status&&(e.status=e.response.status,e.statusText=e.response.statusText),e.response.url&&(e.url=e.response.url)}delete e.response,this.context=e,Error.captureStackTrace&&Error.captureStackTrace(this,a)}toString(){let r=Object.entries(this.context||{}).map(([t,o])=>`${t}: ${JSON.stringify(o)}`).join(", "),e=`${this.name}: ${this.message}`;return r&&(e+=` (${r})`),this.cause&&(e+=`
Caused by: ${this.cause}`),e}};var uc={[oe]:Sa,[ue]:Aa,[ne]:Ta},fc={[oe]:La,[ne]:I},Rt,hr=class{constructor(r){f(this,Rt);d(this,"changes",new Map);d(this,"connected",!1);d(this,"error");d(this,"log");d(this,"options");d(this,"promises",[]);d(this,"state",ue);d(this,"timer",null);d(this,"value");d(this,"version",0);d(this,"wrapperElement");this.wrapperElement=r,this.log=Mt.module("mas-element")}update(){[oe,ue,ne].forEach(r=>{this.wrapperElement.classList.toggle(uc[r],r===this.state)})}notify(){(this.state===ne||this.state===oe)&&(this.state===ne?this.promises.forEach(({resolve:e})=>e(this.wrapperElement)):this.state===oe&&this.promises.forEach(({reject:e})=>e(this.error)),this.promises=[]);let r=this.error;this.error instanceof dr&&(r={message:this.error.message,...this.error.context}),this.wrapperElement.dispatchEvent(new CustomEvent(fc[this.state],{bubbles:!0,composed:!0,detail:r}))}attributeChangedCallback(r,e,t){this.changes.set(r,t),this.requestUpdate()}connectedCallback(){g(this,Rt,aa()),this.requestUpdate(!0)}disconnectedCallback(){this.connected&&(this.connected=!1,this.log?.debug("Disconnected:",{element:this.wrapperElement}))}onceSettled(){let{error:r,promises:e,state:t}=this;return ne===t?Promise.resolve(this.wrapperElement):oe===t?Promise.reject(r):new Promise((o,n)=>{e.push({resolve:o,reject:n})})}toggleResolved(r,e,t){return r!==this.version?!1:(t!==void 0&&(this.options=t),this.state=ne,this.value=e,this.update(),this.log?.debug("Resolved:",{element:this.wrapperElement,value:e}),lr(()=>this.notify()),!0)}toggleFailed(r,e,t){if(r!==this.version)return!1;t!==void 0&&(this.options=t),this.error=e,this.state=oe,this.update();let o=this.wrapperElement.getAttribute("is");return this.log?.error(`${o}: Failed to render: ${e.message}`,{element:this.wrapperElement,...e.context,...h(this,Rt)?.duration}),lr(()=>this.notify()),!0}togglePending(r){return this.version++,r&&(this.options=r),this.state=ue,this.update(),this.log?.debug("Pending:",{osi:this.wrapperElement?.options?.wcsOsi}),this.version}requestUpdate(r=!1){if(!this.wrapperElement.isConnected||!aa()||this.timer)return;let{error:e,options:t,state:o,value:n,version:i}=this;this.state=ue,this.timer=lr(async()=>{this.timer=null;let c=null;if(this.changes.size&&(c=Object.fromEntries(this.changes.entries()),this.changes.clear()),this.connected?this.log?.debug("Updated:",{element:this.wrapperElement,changes:c}):(this.connected=!0,this.log?.debug("Connected:",{element:this.wrapperElement,changes:c})),c||r)try{await this.wrapperElement.render?.()===!1&&this.state===ue&&this.version===i&&(this.state=o,this.error=e,this.value=n,this.update(),this.notify())}catch(s){this.toggleFailed(this.version,s,t)}})}};Rt=new WeakMap;function bc({env:a,language:r,country:e,offerId:t,promotionCode:o}){let n=a==="PRODUCTION"?"www.adobe.com":"www.stage.adobe.com",i=`locale=${r}_${e}&country=${e}&offer_id=${t}`;return o&&(i+=`&promotion_code=${encodeURIComponent(o)}`),`https://${n}/offers/promo-terms.html?${i}`}var ke,Ee=class Ee extends(globalThis.HTMLAnchorElement??class{}){constructor(){super();d(this,"masElement",new hr(this));f(this,ke);this.setAttribute("is",Ee.is)}get isUptLink(){return!0}initializeWcsData(e,t){this.setAttribute("data-wcs-osi",e),t&&this.setAttribute("data-promotion-code",t)}attributeChangedCallback(e,t,o){this.masElement.attributeChangedCallback(e,t,o)}connectedCallback(){this.masElement.connectedCallback(),g(this,ke,fe()),h(this,ke)&&(this.log=h(this,ke).log.module("upt-link"))}disconnectedCallback(){this.masElement.disconnectedCallback(),g(this,ke,void 0)}requestUpdate(e=!1){this.masElement.requestUpdate(e)}onceSettled(){return this.masElement.onceSettled()}async render(){let e=fe();if(!e)return!1;this.dataset.imsCountry||e.imsCountryPromise.then(i=>{i&&(this.dataset.imsCountry=i)});let t=e.collectCheckoutOptions({},this);if(!t.wcsOsi)return this.log.error("Missing 'data-wcs-osi' attribute on upt-link."),!1;let o=this.masElement.togglePending(t),n=e.resolveOfferSelectors(t);try{let[[i]]=await Promise.all(n),{country:c,language:s,env:l}=t;this.href=bc({env:l,language:s,country:c,offerId:i.offerId,promotionCode:this.getAttribute("data-promotion-code")}),this.masElement.toggleResolved(o,i,t)}catch(i){let c=new Error(`Could not resolve offer selectors for id: ${t.wcsOsi}.`,i.message);return this.masElement.toggleFailed(o,c,t),!1}}static createFrom(e){let t=new Ee;for(let o of e.attributes)o.name!=="is"&&(o.name==="class"&&o.value.includes("upt-link")?t.setAttribute("class",o.value.replace("upt-link","").trim()):t.setAttribute(o.name,o.value));return t.innerHTML=e.innerHTML,t.setAttribute("tabindex",0),t}};ke=new WeakMap,d(Ee,"is","upt-link"),d(Ee,"tag","a"),d(Ee,"observedAttributes",["data-wcs-osi","data-promotion-code","data-ims-country"]);var he=Ee;globalThis.customElements&&!globalThis.customElements.get(he.is)&&globalThis.customElements.define(he.is,he,{extends:he.tag});import{LitElement as xc,css as yc,html as wc}from"./lit-all.min.js";var vc="countdown-timer",hn=a=>a.replace(/\s+/g," ").trim().toLowerCase()===vc,mn=/<(day|hour|minute)>(.*?)<\/\1>/g,oa=a=>/^(\{\{)?countdown-[\w-]+(\}\})?$/.test(a);var gn=6e4,un=["spectrum-green-900","spectrum-red-700"],pn={en:{sentence:"Ends in <day></day>, <hour></hour>, <minute></minute>!",day:["{n} day","{n} days"],hour:["{n} hour","{n} hours"],minute:["{n} minute","{n} minutes"]},ko:{sentence:"<day></day> <hour></hour> <minute></minute> \uD6C4 \uD560\uC778 \uC885\uB8CC!",day:["{n} \uC77C"],hour:["{n} \uC2DC\uAC04"],minute:["{n} \uBD84"]}};function Ec(a,r,e){let t=Date.parse(a),o=Date.parse(r);if(!(t<=e&&e<o))return null;let n=Math.floor((o-e)/gn);return{day:Math.floor(n/1440),hour:Math.floor(n%1440/60),minute:n%60}}function kc(a,r,e){let t=r.split(/[-_]/)[0],o=pn[t]?t:"en",n=pn[o],i=e?.replace(/<\/?p>/gi,""),c=!i||oa(i)?n.sentence:i,s=(l,m)=>new Intl.PluralRules(l).select(m)==="one"?0:1;return c.replace(mn,(l,m,p)=>{let v=a[m],u=p.split("|"),w=u[s(t,v)]??u[0],T=n[m];return(w&&!oa(w)?w:T[s(o,v)]??T[0]).replace("{n}",v)})}function Cc(a,r,e,t="en_US",o){let n=Ec(a,r,e);return n?kc(n,t,o):""}var it,me,na,ia,Nt=class extends xc{constructor(){super();f(this,me);f(this,it);this.locale="en_US",this.text=""}connectedCallback(){super.connectedCallback(),this.hidden=!0,this.setAttribute("role","timer"),this.setAttribute("aria-live","off"),E(this,me,na).call(this)}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(h(this,it))}willUpdate(e){["start","end","locale","template","instant"].some(t=>e.has(t))&&E(this,me,na).call(this)}render(){return wc`${this.text}`}};it=new WeakMap,me=new WeakSet,na=function(){clearTimeout(h(this,it)),this.isConnected&&(this.lang=this.locale.replace("_","-"),E(this,me,ia).call(this))},ia=function(){let e=this.instant?Date.parse(this.instant):Date.now();this.text=Cc(this.start,this.end,e,this.locale,this.template),this.hidden=!this.text;let t=Date.parse(this.start),o=Date.parse(this.end);if(this.instant||!(t<o)||e>=o)return;let n=(o-e)%gn+1;g(this,it,setTimeout(()=>E(this,me,ia).call(this),e<t?Math.min(n,t-e):n))},d(Nt,"properties",{start:{type:String},end:{type:String},locale:{type:String},template:{type:String},instant:{type:String},text:{state:!0}}),d(Nt,"styles",yc`
        /* Default inherits the description color; authors pick one of these in the RTE. */
        :host(.spectrum-green-900) {
            color: var(--spectrum-green-900, #05834e);
        }
        :host(.spectrum-red-700) {
            color: var(--spectrum-red-700, #eb1000);
        }
        :host([hidden]) {
            display: none;
        }
    `);customElements.get("merch-countdown")||customElements.define("merch-countdown",Nt);var Sc="#000000",ca="#F8D904",Ac="#EAEAEA",Tc="#31A547",Lc=/(accent|primary|secondary)(-(outline|link))?/,zc="mas:product_code/",Pc="daa-ll",mr="daa-lh",_c=["XL","L","M","S"],sa="...";function q(a,r,e,t){let o=t[a];if(r[a]&&o){let n={slot:o?.slot,...o?.attributes},i=r[a];if(o.maxCount&&typeof i=="string"){let[s,l]=ns(i,o.maxCount,o.withSuffix);s!==i&&(n.title=l,i=s)}let c=_(o.tag,n,i);return e.append(c),c}}function Mc(a){a&&a.querySelectorAll("li").forEach(r=>{let e=[...r.children];if(!e.length||e.some(n=>n.tagName!=="P")||[...r.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim()))return;let o=e.map(n=>{let i=document.createElement("li");return[...r.attributes].forEach(({name:c,value:s})=>i.setAttribute(c,s)),i.append(...n.childNodes),i});r.replaceWith(...o)})}function Rc(a,r,e){let o=(a.mnemonicIcon||[]).filter(i=>i).map((i,c)=>({icon:i,alt:a.mnemonicAlt?.[c]??"",link:a.mnemonicLink?.[c]??""}));o?.forEach(({icon:i,alt:c,link:s})=>{if(s&&!/^https?:/.test(s))try{s=new URL(`https://${s}`).href.toString()}catch{s="#"}let l={slot:"icons",src:i,loading:r.loading,size:e?.size??"l"};c&&(l.alt=c),s&&(l.href=s);let m=_("merch-icon",l);r.append(m)});let n=r.shadowRoot.querySelector('slot[name="icons"]');n&&(n.style.display=o?.length?null:"none")}function Nc(a){let r=new DOMParser().parseFromString(a,"text/html").querySelector("merch-badge");return r?r.querySelector('span[is="inline-price"]')?!1:!r.textContent?.trim():!0}function Oc(a,r,e){if(e.badge?.slot){if(a.badge?.length&&!a.badge?.startsWith("<merch-badge")){let o=ca,n=!1;e.allowedBadgeColors?.includes(e.badge?.default)&&(o=e.badge?.default,a.borderColor||(n=!0));let i=a.badgeBackgroundColor||o,c=a.borderColor||"";n&&(c=e.badge?.default,a.borderColor=e.badge?.default),a.badge=`<merch-badge variant="${a.variant}" background-color="${i}" border-color="${c}">${a.badge}</merch-badge>`}a.badge?.startsWith("<merch-badge")&&Nc(a.badge)&&(a.badge=""),q("badge",a,r,e)}else a.badge?(r.setAttribute("badge-text",a.badge),e.disabledAttributes?.includes("badgeColor")||r.setAttribute("badge-color",a.badgeColor||Sc),e.disabledAttributes?.includes("badgeBackgroundColor")||r.setAttribute("badge-background-color",a.badgeBackgroundColor||ca),r.setAttribute("border-color",a.badgeBackgroundColor||ca)):r.setAttribute("border-color",a.borderColor||Ac)}function $c(a,r,e){if(e.trialBadge&&a.trialBadge){if(!a.trialBadge.startsWith("<merch-badge")){let t=!e.disabledAttributes?.includes("trialBadgeBorderColor")&&a.trialBadgeBorderColor||Tc;a.trialBadge=`<merch-badge variant="${a.variant}" border-color="${t}">${a.trialBadge}</merch-badge>`}q("trialBadge",a,r,e)}}function Dc(a,r,e){e?.includes(a.size)&&r.setAttribute("size",a.size)}function Ic(a,r){a.cardName&&r.setAttribute("name",a.cardName)}function Fc(a,r,e){a.cardTitle&&(a.cardTitle=ct(a.cardTitle)),q("cardTitle",a,r,{cardTitle:e})}function Bc(a,r,e){q("subtitle",a,r,e)}function Hc(a,r,e,t){if(!a.backgroundColor||a.backgroundColor.toLowerCase()==="default"){r.style.removeProperty("--merch-card-custom-background-color"),r.removeAttribute("background-color");return}e?.[a.backgroundColor]?(r.style.setProperty("--merch-card-custom-background-color",`var(${e[a.backgroundColor]})`),r.setAttribute("background-color",a.backgroundColor)):t?.attribute&&a.backgroundColor&&(r.setAttribute(t.attribute,a.backgroundColor),r.style.removeProperty("--merch-card-custom-background-color"))}function qc(a,r,e){let t=e?.borderColor,o="--consonant-merch-card-border-color";if(a.borderColor?.toLowerCase()==="transparent")r.style.setProperty(o,"transparent");else if(a.borderColor&&t){let i=t?.specialValues?.[a.borderColor]?.includes("gradient")||/-gradient/.test(a.borderColor),c=/^spectrum-.*-(plans|special-offers)$/.test(a.borderColor);if(i){r.setAttribute("gradient-border","true");let s=a.borderColor;if(t?.specialValues){for(let[l,m]of Object.entries(t.specialValues))if(m===a.borderColor){s=l;break}}r.setAttribute("border-color",s),r.style.removeProperty(o)}else c?(r.setAttribute("border-color",a.borderColor),r.style.setProperty(o,`var(--${a.borderColor})`)):r.style.setProperty(o,`var(--${a.borderColor})`)}else r.style.removeProperty(o)}var Uc=new Set(["","default"]);function jc(a,r,e){let t=e?.whatsIncludedDividerColor,o="--consonant-merch-card-whats-included-divider-color";if(!t)return;let i=(r.querySelector('[slot="footer-rows"] merch-whats-included')??r.querySelector("merch-whats-included"))?.getAttribute("whats-included-divider-color")?.trim(),c=a.whatsIncludedDividerColor!=null?String(a.whatsIncludedDividerColor).trim():"",s=i||c;if(s==null||Uc.has(String(s).trim().toLowerCase())){r.removeAttribute("whats-included-divider-color"),r.style.removeProperty(o);return}let l=String(s).trim();if(l.toLowerCase()==="transparent"){r.removeAttribute("whats-included-divider-color"),r.style.setProperty(o,"transparent");return}let p=t.specialValues?.[l]?.includes("gradient")||/-gradient/.test(l)||/^gradient-/.test(l),v=/^spectrum-.*-(plans|special-offers)$/.test(l);if(p){let u=l;if(t.specialValues){for(let[w,T]of Object.entries(t.specialValues))if(T===l){u=w;break}}r.setAttribute("whats-included-divider-color",u),r.style.removeProperty(o)}else v?(r.setAttribute("whats-included-divider-color",l),r.style.setProperty(o,`var(--${l})`)):(r.removeAttribute("whats-included-divider-color"),r.style.setProperty(o,`var(--${l})`))}function Gc(a,r,e){if(a.backgroundImage){let t={loading:r.loading??"lazy",src:a.backgroundImage};if(a.backgroundImageAltText?t.alt=a.backgroundImageAltText:t.role="none",!e)return;if(e?.attribute){r.setAttribute(e.attribute,a.backgroundImage);return}r.append(_(e.tag,{slot:e.slot},_("img",t)))}}function Vc(a,r,e){e.image?.slot&&(a.image&&(a.image=Ur(jr(a.image))),q("image",a,r,e))}function Wc(a,r,e){e.backgrounds?.slot&&(a.backgrounds&&(a.backgrounds=Ur(jr(a.backgrounds))),q("backgrounds",a,r,e))}function ct(a){return!a||typeof a!="string"||a.includes("<mas-mnemonic")&&Promise.resolve().then(()=>(Sr(),Cr)).catch(console.error),a}function Kc(a,r,e){a.prices&&(a.prices=ct(a.prices)),q("prices",a,r,e)}function da(a){if(a==null||a==="")return[];if(typeof a=="string")return a.trim()?[a]:[];if(Array.isArray(a))return a.flatMap(da);if(typeof a=="object"){if(typeof a.value=="string")return a.value.trim()?[a.value]:[];if(Array.isArray(a.value))return a.value.flatMap(da);if(typeof a.content=="string")return a.content.trim()?[a.content]:[];if(typeof a.html=="string")return a.html.trim()?[a.html]:[]}return[]}function Yc(a,r,e){let t=da(a.features).filter(n=>n.trim());if(!t.length)return;let o=_("div",{slot:e?.features?.slot??"features",hidden:"","data-compare-chart-features":""});t.forEach(n=>{let i;try{i=new DOMParser().parseFromString(n,"text/html")}catch{return}let c=i.body.querySelector("p[name]");if(c){o.append(c);return}o.insertAdjacentHTML("beforeend",n)}),o.children.length&&r.append(o),Zc(r,e)}function vn(a,r,e,t=!1){let o=a.hasAttribute("data-wcs-osi")&&!!a.getAttribute("data-wcs-osi"),n=a.className||"";if(t&&wa.includes(r.variant)){let w=wr(a),T=Oa(a),L=_("span",{class:"headless-cta-variant-label"});L.textContent=w.endsWith("-link")?"Link":w.startsWith("accent")||w.startsWith("primary")?"Primary":"Secondary";let R=_("span",{class:"headless-cta-item"});return R.append(T,L),R.source=T,R}let c=n?Lc.exec(n)?.[0]??"accent":"accent",s=c.includes("accent"),l=c.includes("primary"),m=c.includes("secondary"),p=c.includes("-outline"),v=c.includes("-link");a.classList.remove("accent","primary","secondary");let u;if(r.consonant)u=ls(a,s,o,v,l,m,e?.ctas?.size);else if(v)u=a;else{let w;s?w="accent":l?w="primary":m&&(w="secondary"),u=r.spectrum==="swc"?ss(a,e,p,w,o):cs(a,e,p,w,o)}return u}function Qc(a,r){let{slot:e}=r?.description;xn(a,r,e)}function Zc(a,r){let e=r?.features?.slot;e&&xn(a,r,e)}function xn(a,r,e){let t=a.querySelectorAll(`[slot="${e}"] a[data-wcs-osi]`);t.length&&t.forEach(o=>{let n=vn(o,a,r);o.replaceWith(n)})}function Xc(a,r,e,t){a.description&&(a.description=ct(a.description)),a.promoText&&(a.promoText=ct(a.promoText)),a.shortDescription&&(a.shortDescription=ct(a.shortDescription)),q("promoText",a,r,e),q("description",a,r,e),q("shortDescription",a,r,e),a.shortDescription&&(r.setAttribute("action-menu","true"),a.actionMenuLabel||r.setAttribute("action-menu-label","More options")),Qc(r,e),q("callout",a,r,e),es(a,r,e,t),Mc(q("whatsIncluded",a,r,e))}function Jc(a,r,e){let t=a.querySelector(`[slot="${r.description?.slot}"]`),o=fe()?.settings;for(let n of t?.querySelectorAll("a")??[]){if(!hn(n.textContent))continue;let i=document.createElement("merch-countdown");i.className=[...n.classList].filter(c=>un.includes(c)).join(" "),i.start=e.cdtStart,i.end=e.cdtEnd,i.locale=e.previewLocale??o?.locale??"en_US",i.instant=o?.instant,i.template=e.placeholders?.countdownTimerText,n.replaceWith(i)}}function es(a,r,e,t={}){e.quantitySelect&&(a.quantitySelect||(a.quantitySelect=t.quantitySelect),q("quantitySelect",a,r,e))}function ts(a,r,e,t={}){if(!e.addon)return;let n=(a.addon??t.addon)?.replace(/[{}]/g,"");if(!n||/disabled/.test(n))return;let i,c=n,s=document.createElement("div");s.innerHTML=n;let l=s.firstElementChild;l?.tagName?.toLowerCase()==="merch-addon"&&(i=l.getAttribute("background")||void 0,c=l.innerHTML);let m={slot:"addon"};i&&(m.background=i);let p=_("merch-addon",m,c);[...p.querySelectorAll(y)].forEach(v=>{let u=v.parentElement;u?.nodeName==="P"&&(u.hasAttribute("data-plan-type")||u.setAttribute("data-plan-type",""))}),r.append(p)}function rs(a,r,e){a.addonConfirmation&&q("addonConfirmation",a,r,e)}function as(a,r,e){let t=e?.customFields;if(!t)return;let o=Array.isArray(a.customFields)?a.customFields:a.customFields?[a.customFields]:[],n=Array.isArray(a.customFieldLabels)?a.customFieldLabels:a.customFieldLabels?[a.customFieldLabels]:[];o.filter(Boolean).forEach((i,c)=>{let s=n[c],l=_(t.tag,{slot:`custom-field-${c}`,"data-label":s||""},i);r.append(l)})}function os(a,r,e,t){t?.secureLabel&&e?.secureLabel&&r.setAttribute("secure-label",t.secureLabel)}function ns(a,r,e=!0){try{let t=typeof a!="string"?"":a,o=fn(t);if(o.length<=r)return[t,o];let n=0,i=!1,c=e?r-sa.length<1?1:r-sa.length:r,s=[];for(let p of t){if(n++,p==="<")if(i=!0,t[n]==="/")s.pop();else{let v="";for(let u of t.substring(n)){if(u===" "||u===">")break;v+=u}s.push(v)}if(p==="/"&&t[n]===">"&&s.pop(),p===">"){i=!1;continue}if(!i&&(c--,c===0))break}let l=t.substring(0,n).trim();if(s.length>0){s[0]==="p"&&s.shift();for(let p of s.reverse())l+=`</${p}>`}return[`${l}${e?sa:""}`,o]}catch{let o=typeof a=="string"?a:"",n=fn(o);return[o,n]}}function fn(a){if(!a)return"";let r="",e=!1;for(let t of a){if(t==="<"&&(e=!0),t===">"){e=!1;continue}e||(r+=t)}return r}function is(a,r){r.querySelectorAll("a.upt-link").forEach(t=>{let o=he.createFrom(t);t.replaceWith(o),o.initializeWcsData(a.osi,a.promoCode)})}function cs(a,r,e,t,o){let n=a;o?n=customElements.get("checkout-button").createCheckoutButton({},a.innerHTML):n.innerHTML=`<span>${n.textContent}</span>`,n.setAttribute("tabindex",0);for(let m of a.attributes)["class","is"].includes(m.name)||n.setAttribute(m.name,m.value);n.firstElementChild?.classList.add("spectrum-Button-label");let i=r?.ctas?.size??"M",c=`spectrum-Button--${t}`,s=_c.includes(i)?`spectrum-Button--size${i}`:"spectrum-Button--sizeM",l=["spectrum-Button",c,s];return e&&l.push("spectrum-Button--outline"),n.classList.add(...l),n}function ss(a,r,e,t,o){let n=a;o&&(n=customElements.get("checkout-button").createCheckoutButton(a.dataset),n.connectedCallback(),n.render());let i="fill";e&&(i="outline");let c=_("sp-button",{treatment:i,variant:t,tabIndex:0,size:r?.ctas?.size??"m",...a.dataset.analyticsId&&{"data-analytics-id":a.dataset.analyticsId}},a.innerHTML);return c.source=n,(o?n.onceSettled():Promise.resolve(n)).then(s=>{c.setAttribute("data-navigation-url",s.href)}),c.addEventListener("click",s=>{s.defaultPrevented||n.click()}),c}function ls(a,r,e,t,o,n,i){let c=a;if(e){try{let s=customElements.get("checkout-link");s&&(c=s.createCheckoutLink(a.dataset,a.innerHTML)??a)}catch{}a.hasAttribute("aria-label")&&c.setAttribute("aria-label",a.getAttribute("aria-label")),a.hasAttribute("data-replaced-osi")&&c.setAttribute("data-replaced-osi",a.getAttribute("data-replaced-osi"))}return t||(c.classList.add("button","con-button"),i&&i!=="m"&&c.classList.add(`button-${i}`),r&&c.classList.add("blue"),o&&c.classList.add("primary"),n&&c.classList.add("secondary")),c}var bn=a=>a.classList.contains("blue"),ds=a=>[...a].sort((r,e)=>bn(e)-bn(r)),la=a=>a.source??a;async function hs(a,r,e,t,o){if(a.ctas&&e.ctas){a.ctas=ct(a.ctas);let{slot:n}=e.ctas,i=_("div",{slot:n},a.ctas),c=[...i.querySelectorAll("a")],s=o?.hideTrialCTAs?c.filter(p=>!fr.has(p.dataset.analyticsId)||p.hasAttribute("data-replaced-osi")):c,l=s.some(p=>p.dataset.analyticsId==="buy-now"),m=s.map(p=>vn(p,r,e,!0));if(i.textContent="",i.append(...["pro","product-pricing"].includes(r.variant)?ds(m):m),r.append(i),o?.hideTrialCTAs&&s.length>0){let p=[];m.forEach(L=>{let R,F=new Promise(Le=>{R=Le});p.push(F);let z=L.source??L;if(!z.onceSettled){R(!1);return}L.hidden=!0,z.onceSettled().then(()=>{let Le=z.value?.[0]?.offerType;if(Le==="TRIAL")m.some(Ft=>Ft!==L&&!Ft.hidden)?L.remove():L.hidden=!1,R(!1);else if(Le==="BASE"&&fr.has(z.dataset.analyticsId)&&z.hasAttribute("data-replaced-osi"))if(l)z.classList.remove("blue"),z.removeAttribute("data-analytics-id"),L.remove(),R(!0);else if(r.priceLiterals?.buyNow&&r.priceLiterals.buyNow!=="buy-now"){z.setAttribute("data-analytics-id","buy-now"),z.hasAttribute("aria-label")&&z.removeAttribute("aria-label"),z.hasAttribute("data-modal")&&z.setAttribute("data-modal","crm");let dt=z.getAttribute("daa-ll");dt&&z.setAttribute("daa-ll",dt.replaceAll("free-trial","buy-now")),z.textContent=r.priceLiterals.buyNow,L.hidden=!1,R(!0)}else L.remove(),R(!1);else L.hidden=!1,R(!1)}).catch(()=>{L.hidden=!1,R(!1)})});let v=Promise.all(p),u,w=new Promise(L=>{u=qt(()=>L([]),ae)}),T=await Promise.race([v,w]);if(_e(u),T.some(L=>L===!0)){let L=m.some(F=>{let z=la(F);return i.contains(F)&&z.classList.contains("blue")}),R=m.find(F=>la(F).getAttribute("data-analytics-id")==="buy-now");if(!L&&R){let F=la(R);F.classList.remove("primary"),F.classList.add("blue")}}}}}function ms(a,r){let{tags:e}=a,t=e?.find(n=>typeof n=="string"&&n.startsWith(zc))?.split("/").pop();if(!t)return;r.setAttribute(mr,t),[...r.shadowRoot.querySelectorAll("a[data-analytics-id],button[data-analytics-id]"),...r.querySelectorAll("a[data-analytics-id],button[data-analytics-id]")].forEach((n,i)=>{n.setAttribute(Pc,`${n.dataset.analyticsId}-${i+1}`)})}function ps(a){a.spectrum==="css"&&[["primary-link","primary"],["secondary-link","secondary"]].forEach(([r,e])=>{a.querySelectorAll(`a.${r}`).forEach(t=>{t.classList.remove(r),t.classList.add("spectrum-Link",`spectrum-Link--${e}`)})})}function gs(a){a.querySelectorAll("[slot]").forEach(t=>{t.remove()}),a.variant=void 0,["checkbox-label","stock-offer-osis","secure-label","background-image","background-color","border-color","whats-included-divider-color","badge-background-color","badge-color","badge-text","gradient-border","size",mr].forEach(t=>a.removeAttribute(t));let e=["wide-strip","thin-strip"];a.classList.remove(...e)}async function yn(a,r){if(!a){let l=r?.id||"unknown";throw console.error(`hydrate: Fragment is undefined. Cannot hydrate card (merchCard id: ${l}).`),new Error(`hydrate: Fragment is undefined for card (merchCard id: ${l}).`)}if(!a.fields){let l=a.id||"unknown",m=r?.id||"unknown";throw console.error(`hydrate: Fragment for card ID '${l}' (merchCard id: ${m}) is missing 'fields'. Cannot hydrate.`),new Error(`hydrate: Fragment for card ID '${l}' (merchCard id: ${m}) is missing 'fields'.`)}let{id:e,fields:t,settings:o={},priceLiterals:n,placeholders:i}=a;t.variant==="bizpro"&&(t.variant="pro");let{variant:c}=t;if(!c)throw new Error(`hydrate: no template found in payload ${e}`);gs(r),r.compatVersion=t.compatVersion,r.contextPromotionCode=t.promoCode,r.cardOsi=t.osi,r.settings=o,n&&(r.priceLiterals=n),i&&(r.placeholders=i),r.id??(r.id=a.id),a.variationId&&r.setAttribute("variation-id",a.variationId),a.maskId&&r.setAttribute("mask-id",a.maskId),a.promoProject&&r.setAttribute("data-promotion-project",a.promoProject),a.promoVariationProject&&r.setAttribute("data-promotion-variation-project",a.promoVariationProject),r.variant=c,await r.updateComplete;let s=r.variantLayout?.aemFragmentMapping??ir(c);if(!s)throw new Error(`hydrate: variant mapping not found for ${e}`);s.style==="consonant"&&!r.hasAttribute("consonant")&&!r.hasAttribute("spectrum")&&r.setAttribute("consonant",!0),Rc(t,r,s.mnemonics),$c(t,r,s),Dc(t,r,s.size),Ic(t,r),Fc(t,r,s.title),Oc(t,r,s),Bc(t,r,s),Kc(t,r,s),Gc(t,r,s.backgroundImage),Vc(t,r,s),Wc(t,r,s),Hc(t,r,s.allowedColors,s.backgroundColor),qc(t,r,s),Xc(t,r,s,o),Jc(r,s,a),Yc(t,r,s),jc(t,r,s),ts(t,r,s,o),rs(t,r,s),as(t,r,s),os(t,r,s,o);try{is(t,r)}catch{}await hs(t,r,s,c,o),ms(t,r),ps(r)}var us=[".","!","?"],fs=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let a=document.createElement("style");a.setAttribute("data-plan-type-text",""),a.textContent=fs,document.head.append(a)}var bs="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function vs(a){let r=a.closest(bs)??a.parentNode,e=document.createRange();return e.setStart(r,0),e.setEndBefore(a),e.toString().replace(/\s+$/,"").slice(-1)}function wn(a){let r=[...a.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(t=>!t.closest("merch-addon"));return(r.find(t=>t.dataset.promotionCode&&t.dataset.promotionCode!=="cancel-context")??r[0])?.dataset.wcsOsi??a.aemFragment?.data?.fields?.osi}function xs(a){return!a||us.includes(a)?"upper":"lower"}function ys(a){return xs(vs(a))}function ha(a,r){if(a.dataset.placeholder!==Ma)return;let e=a.closest("merch-card, mas-field")?.osi;e&&(r.wcsOsi=e,r.planTypeCase=ys(a))}function Es(a){return a.compatVersion>=1||a.hasAttribute("data-promotion-project")}function ks(a){return Es(a)?a.contextPromotionCode:null}function ma(a,r){if(r.promotionCode)return;let e=ks(a);e&&(r.promotionCode=e)}function En(a,r){a&&(r.literals??(r.literals={}),Object.assign(r.literals,a))}function kn(a,r){$a(a)&&(r.displayPerUnit=!1,r.displayTax=!1)}function Cn(a,r){r.displayAnnual===void 0&&typeof a?.settings?.displayAnnual=="boolean"&&(r.displayAnnual=a.settings.displayAnnual,a.settings.displayAnnual&&a.setAttribute("annualized",""))}function Sn(a,r,e){!a?.providers||a.providers.has(r)||(a.providers.price(r),a.providers.checkout(e),a.providers.has(ha)||a.providers.price(ha))}var gr="merch-card",An="merch-card:",Tn=["full-pricing-express","simplified-pricing-express"],Ln=["segment","product","plans-education","mini-compare-chart-mweb"];function Ss(a,r){let e=a.closest(gr);if(!e)return r;En(e.priceLiterals,r),kn(a,r),ma(e,r),e.aemFragment&&(r[Ra]=!0),e.variantLayout?.priceOptionsProvider?.(a,r),a.dataset.template===P&&(r.displayDot??(r.displayDot=e.variantLayout?.legalDisplayDot??!0)),Cn(e,r)}function As(a,r){let e=a.closest(gr);if(!e)return r;ma(e,r)}function Ts(a){Sn(a,Ss,As)}var Ot=new IntersectionObserver(a=>{a.forEach(r=>{let e=r.target;if(Tn.includes(e.variant)){if(e.clientHeight===0)return;Ot.unobserve(e),e.requestUpdate();return}if(Ln.includes(e.variant)){if(r.boundingClientRect.width===0)return;if((e.variant==="product"||e.variant==="mini-compare-chart-mweb"||e.variant==="plans-education")&&e.querySelector('merch-icon[slot="icons"]')){Ot.unobserve(e);return}let t=e.getBoundingClientRect().width,o=e.querySelector('[slot="badge"] > merch-badge'),n=o?.getBoundingClientRect().width||0;if(t===0||!o){Ot.unobserve(e);return}e.style.setProperty("--consonant-merch-card-heading-xs-max-width",`${Math.round(t-n-16)}px`),Ot.unobserve(e)}})}),Ls=0,Dt,It,st,lt,Se,Q,Ae,U,Te,M,Ce,$t,pa,pr,pe=class extends Cs{constructor(){super();f(this,M);f(this,Dt);f(this,It);f(this,st);f(this,lt);f(this,Se);f(this,Q);f(this,Ae);f(this,U);f(this,Te,new Promise(e=>{g(this,U,e)}));d(this,"compatVersion");d(this,"customerSegment");d(this,"marketSegment");d(this,"variantLayout");this.id=null,this.failed=!1,this.filters={},this.types="",this.selected=!1,this.spectrum="css",this.loading="lazy",this.handleAemFragmentEvents=this.handleAemFragmentEvents.bind(this),this.handleMasReady=this.handleMasReady.bind(this),this.handleMerchOfferSelectReady=this.handleMerchOfferSelectReady.bind(this)}get contextPromotionCode(){return h(this,Dt)}set contextPromotionCode(e){g(this,Dt,e),e?this.setAttribute("data-promotion-code",e):this.removeAttribute("data-promotion-code")}get cardOsi(){return h(this,It)}set cardOsi(e){g(this,It,e);let t=Array.isArray(e)?e.join(","):e;t?this.setAttribute("data-card-osi",t):this.removeAttribute("data-card-osi")}scheduleUpdate(){let e=Ko(this.variant);return e?e.then(()=>this.scheduleUpdate(),t=>(h(this,Se).error(`merch-card: variant ${this.variant} cannot be loaded: ${t.message}`),super.scheduleUpdate())):super.scheduleUpdate()}firstUpdated(){this.variantLayout=Yr(this),this.variantLayout?.connectedCallbackHook()}willUpdate(e){(e.has("variant")||!this.variantLayout)&&(this.variantLayout?.disconnectedCallbackHook(),this.variantLayout=Yr(this),this.variantLayout?.connectedCallbackHook())}updated(e){!this.style.getPropertyValue("--consonant-merch-card-border-color")&&this.computedBorderColor&&(e.has("badgeBackgroundColor")||e.has("borderColor"))&&this.style.setProperty("--consonant-merch-card-border-color",this.computedBorderColor),e.has("backgroundColor")&&this.style.setProperty("--merch-card-custom-background-color",this.backgroundColor?`var(--${this.backgroundColor})`:"");try{this.variantLayoutPromise=this.variantLayout?.postCardUpdateHook(e)}catch(t){E(this,M,Ce).call(this,`Error in postCardUpdateHook: ${t.message}`,{},!1)}}get theme(){return this.closest("sp-theme")}get dir(){return this.closest("[dir]")?.getAttribute("dir")??"ltr"}render(){if(!(!this.isConnected||!this.variantLayout||this.style.display==="none"))return this.variantLayout.renderLayout()}get computedBorderColor(){return["ccd-slice","ccd-suggested","ah-promoted-plans","simplified-pricing-express","full-pricing-express"].includes(this.variant)?"":this.borderColor?this.borderColor:this.badgeBackgroundColor}get badgeElement(){return this.shadowRoot.getElementById("badge")}get headingmMSlot(){return this.shadowRoot.querySelector('slot[name="heading-m"]').assignedElements()[0]}get footerSlot(){return this.shadowRoot.querySelector('slot[name="footer"]')?.assignedElements()[0]}get descriptionSlot(){return this.shadowRoot.querySelector('slot[name="body-xs"')?.assignedElements()[0]}get descriptionSlotCompare(){return this.shadowRoot.querySelector('slot[name="body-m"')?.assignedElements()[0]}get iconButton(){return this.querySelector('[slot="callout-content"] .icon-button, [slot="short-description"] .icon-button')}get price(){return this.headingmMSlot?.querySelector(y)}get checkoutLinks(){return[...this.footerSlot?.querySelectorAll(Z)??[]]}get checkoutLinksDescription(){return[...this.descriptionSlot?.querySelectorAll(Z)??[]]}get checkoutLinkDescriptionCompare(){return[...this.descriptionSlotCompare?.querySelectorAll(Z)??[]]}get activeDescriptionLinks(){return this.variant==="mini-compare-chart"||this.variant==="mini-compare-chart-mweb"?this.checkoutLinkDescriptionCompare:this.checkoutLinksDescription}async toggleStockOffer({target:e}){if(!this.stockOfferOsis)return;let t=this.checkoutLinks;if(t.length!==0)for(let o of t){await o.onceSettled();let n=o.value?.[0]?.planType;if(!n)return;let i=this.stockOfferOsis[n];if(!i)return;let c=o.dataset.wcsOsi.split(",").filter(s=>s!==i);e.checked&&c.push(i),o.dataset.wcsOsi=c.join(",")}}changeHandler(e){e.target.tagName==="MERCH-ADDON"&&this.toggleAddon(e.target)}toggleAddon(e){this.variantLayout?.toggleAddon?.(e);let t=[...this.checkoutLinks,...this.activeDescriptionLinks??[]];if(t.length===0)return;let o=n=>{let{offerType:i,planType:c}=n.value?.[0]??{};if(!i||!c)return;let s=e.getOsi(c,i),l=(n.dataset.wcsOsi||"").split(",").filter(m=>m&&m!==s);e.checked&&l.push(s),n.dataset.wcsOsi=l.join(",")};t.forEach(o)}handleQuantitySelection(e){let t=[...this.checkoutLinks,...this.activeDescriptionLinks??[]];if(t.length!==0)for(let o of t)o.dataset.quantity=e.detail.option}get titleElement(){return this.querySelector(this.variantLayout?.headingSelector||".card-heading")}get title(){return this.titleElement?.textContent?.trim()}get description(){return this.querySelector('[slot="body-xs"]')?.textContent?.trim()}updateFilters(e){let t={...this.filters};Object.keys(t).forEach(o=>{if(e){t[o].order=Math.min(t[o].order||2,2);return}let n=t[o].order;n===1||isNaN(n)||(t[o].order=Number(n)+1)}),this.filters=t}showInfoTooltip(e,t){let o="tooltip-left",n="tooltip-right";window.screen.width<600&&e.getAttribute("data-tooltip")?.length>12&&(this.iconButton.classList.remove(o),this.iconButton.classList.remove(n),e.getBoundingClientRect().x<100&&this.iconButton.classList.add(o),e.getBoundingClientRect().x>window.screen.width-100&&this.iconButton.classList.add(n)),this.iconButton.classList.add(t)}handleInfoIconEvents(){let e="tooltip-visible";this.iconButton&&(["mouseenter","focus"].forEach(t=>this.iconButton.addEventListener(t,o=>this.showInfoTooltip(o.target,e),!1)),["mouseleave","blur"].forEach(t=>this.iconButton.addEventListener(t,()=>this.iconButton.classList.remove(e),!1)),this.iconButton.addEventListener("keydown",t=>{t.key==="Escape"&&this.iconButton.classList.remove(e)}))}additionalModalTriggers(){if(!this.settings?.additionalModalTriggers)return;let e=this.variantLayout.aemFragmentMapping.title;this.makeElementModalTrigger(e?.tag,e?.slot),this.makeElementModalTrigger("merch-icon","icons")}handleMasReady(){this.handleInfoIconEvents(),this.additionalModalTriggers()}includes(e){return this.textContent.match(new RegExp(e,"i"))!==null}connectedCallback(){var t;super.connectedCallback(),h(this,lt)||g(this,lt,Ls++),this.aemFragment||((t=h(this,U))==null||t.call(this),g(this,U,void 0)),this.id??(this.id=this.getAttribute("id")??this.aemFragment?.getAttribute("fragment"));let e=this.id??h(this,lt);g(this,Ae,`${An}${e}${Pa}`),g(this,st,`${An}${e}${_a}`),performance.mark(h(this,Ae)),g(this,Q,fe()),Ts(h(this,Q)),g(this,Se,h(this,Q).Log.module(gr)),this.addEventListener(D,this.handleQuantitySelection),this.addEventListener(br,this.handleAddonAndQuantityUpdate),this.addEventListener(Ea,this.handleMerchOfferSelectReady),this.addEventListener(Ht,this.handleAemFragmentEvents),this.addEventListener(Bt,this.handleAemFragmentEvents),this.addEventListener(ge,this.handleMasReady),this.addEventListener("change",this.changeHandler),this.variantLayout&&this.variantLayout.connectedCallbackHook(),this.aemFragment||setTimeout(()=>this.checkReady(),0)}makeElementModalTrigger(e,t){let o=e==="merch-icon",n=this.querySelector(`${e}[slot="${t}"]:not(.modal-trigger)`);if(!n)return;let i=this.querySelector("a.button.placeholder-resolved[data-modal]");if(!i)return;n.setAttribute("tabindex","0"),n.addEventListener("click",l=>{i.checkoutActionHandler?.(l)}),n.addEventListener("keypress",l=>{l.code==="Enter"&&i.checkoutActionHandler?.(l)}),n.classList.add("modal-trigger");let s=`${this.title.replace(/\s+/g,"-").toLowerCase()}${o?"-icon":""}--${this.analyticsId}--card`;n.setAttribute("daa-ll",s),n.setAttribute("role","link"),o&&n.setAttribute("alt",this.title)}disconnectedCallback(){super.disconnectedCallback(),this.variantLayout?.disconnectedCallbackHook(),this.removeEventListener(D,this.handleQuantitySelection),this.removeEventListener(Ht,this.handleAemFragmentEvents),this.removeEventListener(Bt,this.handleAemFragmentEvents),this.removeEventListener(ge,this.handleMasReady),this.removeEventListener("change",this.changeHandler),this.removeEventListener(br,this.handleAddonAndQuantityUpdate)}async handleAemFragmentEvents(e){var t;if(this.isConnected&&(e.type===Ht&&E(this,M,Ce).call(this,"AEM fragment cannot be loaded"),e.type===Bt&&(this.failed=!1,e.target.nodeName==="AEM-FRAGMENT"))){let o=e.detail;try{h(this,U)||g(this,Te,new Promise(n=>{g(this,U,n)})),await yn(o,this)}catch(n){E(this,M,Ce).call(this,`hydration has failed: ${n.message}`)}finally{(t=h(this,U))==null||t.call(this),g(this,U,void 0)}this.checkReady()}}async checkReady(){if(!this.isConnected||this.failed)return;h(this,Te)&&(await h(this,Te),(Tn.includes(this.variant)||Ln.includes(this.variant))&&Ot.observe(this),g(this,Te,void 0)),this.variantLayoutPromise&&(await this.variantLayoutPromise,this.variantLayoutPromise=void 0);let e,t=new Promise(l=>{e=qt(()=>l("timeout"),ae)});if(this.aemFragment){let l=await Promise.race([this.aemFragment.updateComplete,t]);if(l===!1||l==="timeout"){let m=l==="timeout"?`AEM fragment was not resolved within ${ae} timeout`:"AEM fragment cannot be loaded";_e(e),E(this,M,Ce).call(this,m,{},!1);return}}let o=[...this.querySelectorAll(ya)],n=Promise.all(o.map(l=>{let m=l.onceSettled?.();return m?m.catch(()=>l):Promise.resolve(l)})).then(l=>{let m=l.filter(p=>p.isConnected);return m.length===0||m.every(p=>p.classList.contains("placeholder-resolved"))}),i=await Promise.race([n,t]);if(_e(e),!this.isConnected)return;let c=o.filter(l=>l.isConnected);if(c.length===0||c.every(l=>l.classList.contains("placeholder-resolved"))){this.measure=performance.measure(h(this,st),h(this,Ae));let l={...this.aemFragment?.fetchInfo,...h(this,Q).duration,measure:Er(this.measure)};return this.dispatchEvent(new CustomEvent(ge,{bubbles:!0,composed:!0,detail:l})),this}else{this.measure=performance.measure(h(this,st),h(this,Ae));let l={measure:Er(this.measure),...h(this,Q).duration};if(i==="timeout")E(this,M,Ce).call(this,`Contains offers that were not resolved within ${ae} timeout`,l);else{let m=c.some(p=>p.matches(Z)&&p.classList.contains("placeholder-failed"));E(this,M,Ce).call(this,m?"CTA has an invalid offer":"Contains unresolved offers",l)}}}get aemFragment(){return this.querySelector("aem-fragment")}get addon(){return this.querySelector("merch-addon")}get quantitySelect(){return this.querySelector("merch-quantity-select")}get addonCheckbox(){return this.querySelector("merch-addon")}displayFooterElementsInColumn(){if(!this.classList.contains("product"))return;let e=this.shadowRoot.querySelector(".secure-transaction-label");(this.footerSlot?.querySelectorAll(Z)).length===2&&e&&e.parentElement.classList.add("footer-column")}handleMerchOfferSelectReady(){this.offerSelect&&!this.offerSelect.planType||this.displayFooterElementsInColumn()}get dynamicPrice(){return this.querySelector('[slot="price"]')}handleAddonAndQuantityUpdate({detail:{id:e,items:t,productArrangementCode:o}}){if(!e||!t?.length||this.closest('[role="tabpanel"][hidden="true"]'))return;let i=this.checkoutLinks.find(m=>m.getAttribute("data-modal-id")===e);if(!i)return;let c=o??i.value?.[0]?.productArrangementCode;if(!c)return;let s=t.find(m=>m.productArrangementCode===c)?.quantity,l=!!t.find(m=>m.productArrangementCode!==c);if(s&&this.quantitySelect?.dispatchEvent(new CustomEvent(ht,{detail:{quantity:s},bubbles:!0,composed:!0})),this.addonCheckbox&&this.addonCheckbox.checked!==l){this.toggleStockOffer({target:this.addonCheckbox});let m=new Event("change",{bubbles:!0,cancelable:!0});Object.defineProperty(m,"target",{writable:!1,value:{checked:l}}),this.addonCheckbox.handleChange(m)}}get prices(){return Array.from(this.querySelectorAll(y))}get osi(){return wn(this)}get promoPrice(){if(!this.querySelector("span.price-strikethrough"))return;let e=this.querySelector(".price.price-alternative");if(e||(e=this.querySelector(`${y}[data-template="price"] > span`)),!!e)return e=e.innerText,e}get regularPrice(){return h(this,M,$t)?.innerText}get promotionCode(){let e=[...this.querySelectorAll(`${y}[data-promotion-code],${Z}[data-promotion-code]`)].map(o=>dn(o.dataset.promotionCode)[0]).filter(o=>![void 0,"","cancel-context"].includes(o));if(e.length===0)return this.contextPromotionCode;let t=[...new Set(e)];return t.length>1&&h(this,Se)?.warn(`Multiple different promotion codes found: ${t.join(", ")}`),e[0]}get annualPrice(){return this.querySelector(`${y}[data-template="price"] > .price.price-annual`)?.innerText}get promoText(){}get taxText(){return(h(this,M,pa)??h(this,M,$t))?.querySelector("span.price-tax-inclusivity")?.textContent?.trim()||void 0}get recurrenceText(){return h(this,M,$t)?.querySelector("span.price-recurrence")?.textContent?.trim()}get unitText(){let e=".price-unit-type";return h(this,M,pa)?.querySelector(e)?.textContent?.trim()??h(this,M,$t)?.querySelector(e)?.textContent?.trim()??this.querySelector(e)?.textContent?.trim()??void 0}get planTypeText(){return this.querySelector('[is="inline-price"][data-template="legal"] span.price-plan-type')?.textContent?.trim()}get seeTermsInfo(){let e=this.querySelector('a[is="upt-link"]');if(e)return E(this,M,pr).call(this,e)}get renewalText(){return this.querySelector("span.renewal-text")?.textContent?.trim()}get promoDurationText(){return this.querySelector("span.promo-duration-text")?.textContent?.trim()}get ctas(){let e=this.querySelector('[slot="ctas"], [slot="footer"]')?.querySelectorAll(`${Z}, a`);return Array.from(e??[])}get primaryCta(){return E(this,M,pr).call(this,this.ctas.find(e=>e.variant==="accent"||e.matches(".spectrum-Button--accent,.con-button.blue")))}get secondaryCta(){return E(this,M,pr).call(this,this.ctas.find(e=>e.variant!=="accent"&&!e.matches(".spectrum-Button--accent,.con-button.blue")))}};Dt=new WeakMap,It=new WeakMap,st=new WeakMap,lt=new WeakMap,Se=new WeakMap,Q=new WeakMap,Ae=new WeakMap,U=new WeakMap,Te=new WeakMap,M=new WeakSet,Ce=function(e,t={},o=!0){var s;if(!this.isConnected)return;let n=this.aemFragment,i=n?.getAttribute("fragment");i=`[${i}]`;let c={...n?.fetchInfo,...h(this,Q).duration,...t,message:e};h(this,Se).error(`merch-card${i}: ${e}`,c),this.failed=!0,(s=h(this,U))==null||s.call(this),g(this,U,void 0),h(this,Q).isPreview()||(this.style.display="none"),o&&this.dispatchEvent(new CustomEvent(Ca,{bubbles:!0,composed:!0,detail:c}))},$t=function(){return this.querySelector("span.price-strikethrough")??this.querySelector(`${y}[data-template="price"] > span`)},pa=function(){return this.querySelector(`${y}[data-template="legal"]`)},pr=function(e){if(e)return{text:e.innerText.trim(),analyticsId:e.dataset.analyticsId,href:e.getAttribute("href")??e.dataset.href}},d(pe,"properties",{id:{type:String,attribute:"id",reflect:!0},name:{type:String,attribute:"name",reflect:!0},variant:{type:String,reflect:!0},size:{type:String,attribute:"size",reflect:!0},badgeColor:{type:String,attribute:"badge-color",reflect:!0},borderColor:{type:String,attribute:"border-color",reflect:!0},backgroundColor:{type:String,attribute:"background-color",reflect:!0},badgeBackgroundColor:{type:String,attribute:"badge-background-color",reflect:!0},backgroundImage:{type:String,attribute:"background-image",reflect:!0},badgeText:{type:String,attribute:"badge-text"},actionMenu:{type:Boolean,attribute:"action-menu"},actionMenuLabel:{type:String,attribute:"action-menu-label"},customHr:{type:Boolean,attribute:"custom-hr"},consonant:{type:Boolean,attribute:"consonant"},failed:{type:Boolean,attribute:"failed",reflect:!0},spectrum:{type:String,attribute:"spectrum"},detailBg:{type:String,attribute:"detail-bg"},secureLabel:{type:String,attribute:"secure-label"},checkboxLabel:{type:String,attribute:"checkbox-label"},addonTitle:{type:String,attribute:"addon-title"},addonOffers:{type:Object,attribute:"addon-offers"},selected:{type:Boolean,attribute:"aria-selected",reflect:!0},storageOption:{type:String,attribute:"storage",reflect:!0},planType:{type:String,attribute:"plan-type",reflect:!0},heightSync:{type:Boolean,attribute:"height-sync"},settings:{type:Object,attribute:!1},stockOfferOsis:{type:Object,attribute:"stock-offer-osis",converter:{fromAttribute:e=>{if(!e)return;let[t,o,n]=e.split(",");return{PUF:t,ABM:o,M2M:n}}}},filters:{type:String,reflect:!0,converter:{fromAttribute:e=>Object.fromEntries(e.split(",").map(t=>{let[o,n,i]=t.split(":"),c=Number(n);return[o,{order:isNaN(c)?void 0:c,size:i}]})),toAttribute:e=>Object.entries(e).map(([t,{order:o,size:n}])=>[t,o,n].filter(i=>i!=null).join(":")).join(",")}},types:{type:String,attribute:"types",reflect:!0},merchOffer:{type:Object},analyticsId:{type:String,attribute:mr,reflect:!0},loading:{type:String},priceLiterals:{type:Object}}),d(pe,"styles",[va,...xa()]),d(pe,"registerVariant",A),d(pe,"getCollectionOptions",Yo),d(pe,"getFragmentMapping",ir);customElements.define(gr,pe);export{pe as MerchCard};
