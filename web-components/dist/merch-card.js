var gi=Object.defineProperty;var fi=e=>{throw TypeError(e)};var Rn=(e,r,t)=>r in e?gi(e,r,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[r]=t;var Nn=(e,r)=>()=>(e&&(r=e(e=0)),r);var On=(e,r)=>{for(var t in r)gi(e,t,{get:r[t],enumerable:!0})};var p=(e,r,t)=>Rn(e,typeof r!="symbol"?r+"":r,t),Sr=(e,r,t)=>r.has(e)||fi("Cannot "+t);var d=(e,r,t)=>(Sr(e,r,"read from private field"),t?t.call(e):r.get(e)),f=(e,r,t)=>r.has(e)?fi("Cannot add the same private member more than once"):r instanceof WeakSet?r.add(e):r.set(e,t),g=(e,r,t,i)=>(Sr(e,r,"write to private field"),i?i.call(e,t):r.set(e,t),t),_=(e,r,t)=>(Sr(e,r,"access private method"),t);var bi=(e,r,t,i)=>({set _(a){g(e,r,a,t)},get _(){return d(e,r,i)}});var Cr={};On(Cr,{default:()=>gt});import{LitElement as In,html as He,css as Dn,nothing as Bn}from"./lit-all.min.js";import{unsafeHTML as Ci}from"./lit-all.min.js";import{ifDefined as Hn}from"./lit-all.min.js";function Fn(){return customElements.get("sp-tooltip")!==void 0&&customElements.get("overlay-trigger")!==void 0&&document.querySelector("sp-theme")!==null}var F,gt,Ar=Nn(()=>{F=class F extends In{constructor(){super(),this.content="",this.placement="top",this.variant="info",this.size="xs",this.smartPlacement=!1,this.tooltipVisible=!1,this.lastPointerType=null,this.handleClickOutside=this.handleClickOutside.bind(this),this._tooltipTop=0,this._tooltipLeft=0,this._arrowOffset=0,this._computedPlacement="top"}connectedCallback(){super.connectedCallback(),window.addEventListener("mousedown",this.handleClickOutside),!this.smartPlacement&&this.closest('merch-card[variant="fries"]')&&(this.smartPlacement=!0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("mousedown",this.handleClickOutside)}handleClickOutside(r){let t=r.composedPath();F.activeTooltip===this&&!t.includes(this)&&this.hideTooltip()}_computeTooltipPosition(){let r=this.shadowRoot?.querySelector(".css-tooltip");if(!r)return;let t=r.getBoundingClientRect(),i=window.innerWidth,a=window.innerHeight,n=14,o=200,s=60,c=this.shadowRoot?.querySelector(".css-tooltip-body"),l=c?c.offsetWidth:o,h=c?c.offsetHeight:s,m=this.effectivePlacement;m==="top"&&t.top-h-n<0?m="bottom":m==="bottom"&&t.bottom+h+n>a?m="top":m==="left"&&t.left-l-n<0?m="right":m==="right"&&t.right+l+n>i&&(m="left");let b=t.left+t.width/2,L=t.top+t.height/2,M=6,V=(Se,se,Be)=>Math.max(Se,Math.min(se,Be)),J,X,H;m==="top"||m==="bottom"?(J=m==="top"?t.top-h-n:t.bottom+n,X=V(0,i-l,b-l/2),H=V(M,l-M*2,b-X-M)):(X=m==="left"?t.left-l-n:t.right+n,J=V(0,a-h,L-h/2),H=V(M,h-M*2,L-J-M)),this._tooltipTop=J,this._tooltipLeft=X,this._arrowOffset=H,this._computedPlacement=m}showTooltip(){F.activeTooltip&&F.activeTooltip!==this&&(F.activeTooltip.closeOverlay(),F.activeTooltip.tooltipVisible=!1,F.activeTooltip.requestUpdate()),F.activeTooltip=this,this.smartPlacement&&this._computeTooltipPosition(),this.tooltipVisible=!0,this.smartPlacement&&this.updateComplete.then(()=>this._computeTooltipPosition())}hideTooltip(){F.activeTooltip===this&&(F.activeTooltip=null),this.tooltipVisible=!1}handleTap(r){r.preventDefault(),this.tooltipVisible?this.hideTooltip():this.showTooltip()}closeOverlay(){let r=this.shadowRoot?.querySelector("overlay-trigger");r?.open!==void 0&&(r.open=!1)}get effectiveContent(){return this.tooltipText||this.mnemonicText||this.content||""}get effectivePlacement(){return this.tooltipPlacement||this.mnemonicPlacement||this.placement||"top"}renderIcon(){return this.src?He`<merch-icon
            src="${this.src}"
            size="${this.size}"
        ></merch-icon>`:He`<slot></slot>`}render(){let r=this.effectiveContent,t=this.effectivePlacement;if(!r)return He`<span class="icon-only">${this.renderIcon()}</span>`;if(Fn())return He`
                <overlay-trigger
                    placement="${t}"
                    @sp-opened=${()=>this.showTooltip()}
                >
                    <span slot="trigger">${this.renderIcon()}</span>
                    <sp-tooltip
                        placement="${t}"
                        variant="${this.variant}"
                    >
                        ${Ci(r)}
                    </sp-tooltip>
                </overlay-trigger>
            `;let a=r.replace(/<[^>]*>/g,""),n=this.tooltipVisible?"tooltip-visible":"",o={pointerdown:u=>{this.lastPointerType=u.pointerType},pointerenter:u=>u.pointerType!=="touch"&&this.showTooltip(),pointerleave:u=>u.pointerType!=="touch"&&this.hideTooltip(),click:u=>{this.lastPointerType==="touch"&&this.handleTap(u),this.lastPointerType=null}},s=this._computedPlacement,c=s==="top"||s==="bottom",l=this.smartPlacement?`top:${this._tooltipTop}px;left:${this._tooltipLeft}px;`:void 0,h=c?`left:${this._arrowOffset}px`:`top:${this._arrowOffset}px`;return He`
            <span
                class="css-tooltip ${this.smartPlacement?"smart":t} ${n}"
                tabindex="0"
                role="img"
                aria-label="${a}"
                @pointerdown=${o.pointerdown}
                @pointerenter=${o.pointerenter}
                @pointerleave=${o.pointerleave}
                @click=${o.click}
            >
                ${this.renderIcon()}
                <span class="css-tooltip-body" style=${Hn(l)}>
                    ${Ci(r)}
                    ${this.smartPlacement?He`<span
                              aria-hidden="true"
                              role="presentation"
                              class="css-tooltip-tip ${s}"
                              style="${h}"
                          ></span>`:Bn}
                </span>
            </span>
        `}};p(F,"activeTooltip",null),p(F,"properties",{content:{type:String},placement:{type:String},variant:{type:String},src:{type:String},size:{type:String},tooltipText:{type:String,attribute:"tooltip-text"},tooltipPlacement:{type:String,attribute:"tooltip-placement"},mnemonicText:{type:String,attribute:"mnemonic-text"},mnemonicPlacement:{type:String,attribute:"mnemonic-placement"},smartPlacement:{type:Boolean,attribute:"smart-placement"},tooltipVisible:{type:Boolean,state:!0},_tooltipTop:{type:Number,state:!0},_tooltipLeft:{type:Number,state:!0},_arrowOffset:{type:Number,state:!0},_computedPlacement:{type:String,state:!0}}),p(F,"styles",Dn`
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
    `);gt=F;customElements.define("mas-mnemonic",gt)});import{LitElement as uc}from"./lit-all.min.js";import{css as wi,unsafeCSS as yi}from"./lit-all.min.js";var A="(max-width: 767px)",N="(max-width: 1199px)",T="(min-width: 768px)",x="(min-width: 1200px)",O="(min-width: 1600px)",xi="(min-width: 1280px)",vi={matchMobile:window.matchMedia(A),matchDesktop:window.matchMedia(`${x} and (not ${O})`),matchDesktopOrUp:window.matchMedia(x),matchLargeDesktop:window.matchMedia(O),get isMobile(){return this.matchMobile.matches},get isDesktop(){return this.matchDesktop.matches},get isDesktopOrUp(){return this.matchDesktopOrUp.matches}},w=vi;function Ut(){return vi.isDesktop}var Ei=wi`
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

    ::slotted([slot='price']) {
        color: var(--consonant-merch-card-price-color);
    }
`,Si=()=>[wi`
            /* Tablet */
            @media screen and ${yi(T)} {
                :host([size='wide']),
                :host([size='super-wide']) {
                    width: 100%;
                    grid-column: 1 / -1;
                }
            }

            /* Laptop */
            @media screen and ${yi(x)} {
                :host([size='wide']) {
                    grid-column: span 2;
                }
            }
        `];import{LitElement as $n,html as Ai,css as Un}from"./lit-all.min.js";function Gn(){return customElements.get("sp-tooltip")!==void 0||document.querySelector("sp-theme")!==null}var Fe=class extends $n{constructor(){super(),this.size="m",this.alt="",this.loading="lazy"}connectedCallback(){super.connectedCallback(),setTimeout(()=>this.handleTooltips(),0)}handleTooltips(){if(Gn())return;this.querySelectorAll("sp-tooltip, overlay-trigger").forEach(t=>{let i="",a="top";if(t.tagName==="SP-TOOLTIP")i=t.textContent,a=t.getAttribute("placement")||"top";else if(t.tagName==="OVERLAY-TRIGGER"){let n=t.querySelector("sp-tooltip");n&&(i=n.textContent,a=n.getAttribute("placement")||t.getAttribute("placement")||"top")}if(i){let n=document.createElement("mas-mnemonic");n.setAttribute("content",i),n.setAttribute("placement",a);let o=this.querySelector("img"),s=this.querySelector("a");s&&s.contains(o)?n.appendChild(s):o&&n.appendChild(o),this.innerHTML="",this.appendChild(n),Promise.resolve().then(()=>Ar())}t.remove()})}render(){let{href:r}=this;return r?Ai`<a href="${r}">
                  <img
                      src="${this.src}"
                      alt="${this.alt}"
                      loading="${this.loading}"
                  />
              </a>`:Ai` <img
                  src="${this.src}"
                  alt="${this.alt}"
                  loading="${this.loading}"
              />`}};p(Fe,"properties",{size:{type:String,attribute:!0},src:{type:String,attribute:!0},alt:{type:String,attribute:!0},href:{type:String,attribute:!0},loading:{type:String,attribute:!0}}),p(Fe,"styles",Un`
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
    `);customElements.define("merch-icon",Fe);var Tr=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),pe=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var $e=2e4;var C='span[is="inline-price"][data-wcs-osi]',ce='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var qn='a[is="upt-link"]',Ti=`${C},${ce},${qn}`;var ki="merch-offer-select:ready",Li="merch-card:action-menu-toggle";var $="merch-quantity-selector:change",_i="merch-card-quantity:change",kr="merch-modal:addon-and-quantity-update";var Ue="merch-card-collection:literals-changed";var Ge="aem:load",qe="aem:error",Gt="mas:ready",Pi="mas:error",zi="placeholder-failed",Mi="placeholder-pending",Ri="placeholder-resolved";var Ni="mas:failed",ee="mas:resolved",Oi="mas/commerce";var me="failed",Ce="pending",ue="resolved";var qt="X-Request-Id",_c=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Pc=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var Vt=":start",jt=":duration";var D="legal",Ii="mas-ff-defaults";var Vn="mas-commerce-service";function Di(e,r){let t;return function(){let i=this,a=arguments;clearTimeout(t),t=setTimeout(()=>e.apply(i,a),r)}}function I(e,r={},t=null,i=null){let a=i?document.createElement(e,{is:i}):document.createElement(e);t instanceof HTMLElement?a.appendChild(t):a.innerHTML=t;for(let[n,o]of Object.entries(r))a.setAttribute(n,o);return a}function Ve(e){return`startTime:${e.startTime.toFixed(2)}|duration:${e.duration.toFixed(2)}`}function Lr(){return window.matchMedia("(max-width: 1024px)").matches}function Ae(){return document.getElementsByTagName(Vn)?.[0]}function ft(e){let r=window.getComputedStyle(e);return e.offsetHeight+parseFloat(r.marginTop)+parseFloat(r.marginBottom)}function Bi(e){let r=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&r?.isInlinePrice&&r?.dataset?.template==="price"}var bt,Te,xt,vt,je,Wt=class extends HTMLElement{constructor(){super();f(this,bt,"");f(this,Te);f(this,xt,[]);f(this,vt,[]);f(this,je);g(this,je,Di(()=>{this.isConnected&&(this.parentElement.style.background=this.value,d(this,Te)?this.parentElement.style.borderRadius=d(this,Te):d(this,Te)===""&&(this.parentElement.style.borderRadius=""))},1))}static get observedAttributes(){return["colors","positions","angle","border-radius"]}get value(){let t=d(this,xt).map((i,a)=>{let n=d(this,vt)[a]||"";return`${i} ${n}`}).join(", ");return`linear-gradient(${d(this,bt)}, ${t})`}connectedCallback(){d(this,je).call(this)}attributeChangedCallback(t,i,a){t==="border-radius"&&g(this,Te,a?.trim()),t==="colors"&&a?g(this,xt,a?.split(",").map(n=>n.trim())??[]):t==="positions"&&a?g(this,vt,a?.split(",").map(n=>n.trim())??[]):t==="angle"&&g(this,bt,a?.trim()??""),d(this,je).call(this)}};bt=new WeakMap,Te=new WeakMap,xt=new WeakMap,vt=new WeakMap,je=new WeakMap;customElements.define("merch-gradient",Wt);import{LitElement as jn,html as Wn,css as Yn}from"./lit-all.min.js";var We=class extends jn{constructor(){super(),this.planType=void 0,this.checked=!1,this.updatePlanType=this.updatePlanType.bind(this),this.handleChange=this.handleChange.bind(this),this.handleCustomClick=this.handleCustomClick.bind(this)}getOsi(r,t){let n=({TRIAL:["TRIAL"],BASE:["BASE","PROMOTION","TRIAL"],PROMOTION:["PROMOTION","BASE","TRIAL"]}[t]||[t]).map(s=>`p[data-plan-type="${r}"] ${C}[data-offer-type="${s}"]`).join(", ");return this.querySelector(n)?.dataset?.wcsOsi}connectedCallback(){super.connectedCallback(),this.addEventListener(ee,this.updatePlanType)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(ee,this.updatePlanType)}updatePlanType(r){if(r.target.tagName!=="SPAN")return;let t=r.target,i=t?.value?.[0];i&&(t.setAttribute("data-offer-type",i.offerType),t.closest("p").setAttribute("data-plan-type",i.planType))}handleChange(r){this.checked=r.target.checked,this.dispatchEvent(new CustomEvent("change",{detail:{checked:this.checked},bubbles:!0,composed:!0}))}handleCustomClick(){this.shadowRoot.querySelector("input").click()}handleKeyDown(r){r.key===" "&&(r.preventDefault(),this.handleCustomClick())}render(){return Wn` <input
                type="checkbox"
                id="addon-checkbox"
                .checked=${this.checked}
                @change=${this.handleChange}
            />
            <span
                role="checkbox"
                aria-checked=${this.checked}
                tabindex="0"
                aria-labelledby="custom-checkbox-label"
                id="custom-checkbox"
                @click=${this.handleCustomClick}
                @keydown=${this.handleKeyDown}
            >
            </span>
            <label id="custom-checkbox-label" for="addon-checkbox">
                <slot></slot>
            </label>`}};p(We,"properties",{planType:{type:String,attribute:"plan-type",reflect:!0},checked:{type:Boolean,reflect:!0},customCheckbox:{type:Boolean,attribute:"custom-checkbox",reflect:!0}}),p(We,"styles",Yn`
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
    `);customElements.define("merch-addon",We);import{html as Yt,nothing as Xn}from"./lit-all.min.js";var Ye,yt=class yt{constructor(r){p(this,"card");f(this,Ye);this.card=r,this.insertVariantStyle()}getContainer(){return g(this,Ye,d(this,Ye)??this.card.closest('merch-card-collection, [class*="-merch-cards"]')??this.card.parentElement),d(this,Ye)}insertVariantStyle(){let r=this.constructor.name;if(!yt.styleMap[r]){yt.styleMap[r]=!0;let t=document.createElement("style");t.innerHTML=this.getGlobalCSS(),document.head.appendChild(t)}}updateCardElementMinHeight(r,t){if(!r||this.card.heightSync===!1)return;let i=`--consonant-merch-card-${this.card.variant}-${t}-height`,a=Math.max(0,parseInt(window.getComputedStyle(r).height)||0),n=this.getContainer(),o=parseInt(n.style.getPropertyValue(i))||0;a>o&&n.style.setProperty(i,`${a}px`)}syncRowHeights(r){if(this.card.heightSync===!1)return;let t=this.getContainer();if(!t)return;let i=this.card.variant,a=Array.from(t.querySelectorAll(`merch-card[variant="${i}"]`)).filter(o=>o.variantLayout?.card?.heightSync!==!1);if(a.length===0)return;for(let{name:o}of r){let s=`--consonant-merch-card-${i}-${o}-height`;t.style.getPropertyValue(s)&&t.style.removeProperty(s)}let n=new Map;for(let o of a){let s=o.getBoundingClientRect();if(s.width<=2)continue;let c=Math.round(s.top),l=n.get(c);l||(l=[],n.set(c,l)),l.push(o)}for(let o of n.values())for(let{name:s,getElement:c}of r){let l=`--consonant-merch-card-${i}-${s}-height`,h=0,u=[];for(let m of o){m.style.removeProperty(l);let b=c(m);if(!b){u.push({card:m,height:0});continue}let L=Math.max(0,parseInt(window.getComputedStyle(b).height)||0);u.push({card:m,height:L}),L>h&&(h=L)}if(!(h<=0))for(let{card:m}of u)m.style.setProperty(l,`${h}px`)}}get legalDisplayDot(){return!0}get badge(){let r;if(!(!this.card.badgeBackgroundColor||!this.card.badgeColor||!this.card.badgeText))return this.evergreen&&(r=`border: 1px solid ${this.card.badgeBackgroundColor}; border-right: none;`),Yt`
            <div
                id="badge"
                class="${this.card.variant}-badge"
                style="background-color: ${this.card.badgeBackgroundColor};
                color: ${this.card.badgeColor};
                ${r}"
            >
                ${this.card.badgeText}
            </div>
        `}get cardImage(){return Yt` <div class="image">
            <slot name="bg-image"></slot>
            ${this.badge}
        </div>`}getGlobalCSS(){return""}get theme(){return document.querySelector("sp-theme")}get evergreen(){return this.card.classList.contains("intro-pricing")}get promoBottom(){return this.card.classList.contains("promo-bottom")}get headingSelector(){return'[slot="heading-xs"]'}get secureLabel(){return this.card.secureLabel?Yt`<span class="secure-transaction-label"
                  >${this.card.secureLabel}</span
              >`:Xn}get secureLabelFooter(){return Yt`<footer>
            ${this.secureLabel}<slot name="footer"></slot>
        </footer>`}async postCardUpdateHook(){if(this.card.isConnected&&(await this.card.updateComplete,this.card.prices?.length>0)){let r=Promise.allSettled(this.card.prices.map(a=>a.onceSettled?.()||Promise.resolve())),t,i=new Promise(a=>{t=setTimeout(a,$e)});await Promise.race([r,i]),clearTimeout(t)}}connectedCallbackHook(){}disconnectedCallbackHook(){}syncHeights(){}renderLayout(){}get aemFragmentMapping(){return Xt(this.card.variant)}};Ye=new WeakMap,p(yt,"styleMap",{});var y=yt;import{html as _r,css as Zn}from"./lit-all.min.js";var Hi=`
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

@media screen and ${A} {
    merch-card-collection-header.catalog {
        --merch-card-collection-header-columns: min-content auto;
    }
}

@media screen and ${T} {
    merch-card-collection-header.catalog {
        --merch-card-collection-header-column-gap: 16px;
    }
}

@media screen and ${x} {
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
}`;var Fi={cardName:{attribute:"name"},badge:!0,ctas:{slot:"footer",size:"m"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},prices:{tag:"h3",slot:"heading-xs"},shortDescription:{tag:"div",slot:"action-menu-content",attributes:{tabindex:"0"}},size:["wide","super-wide"],title:{tag:"h3",slot:"heading-xs"}},Xe=class extends y{constructor(t){super(t);p(this,"dispatchActionMenuToggle",()=>{this.card.dispatchEvent(new CustomEvent(Li,{bubbles:!0,composed:!0,detail:{card:this.card.name,type:"action-menu"}}))});p(this,"toggleActionMenu",t=>{!this.actionMenuContentSlot||!t||t.type!=="click"&&t.code!=="Space"&&t.code!=="Enter"||(t.preventDefault(),t.stopPropagation(),this.setMenuVisibility(!this.isMenuOpen()))});p(this,"toggleActionMenuFromCard",t=>{let i=t?.type==="mouseleave"?!0:void 0;this.card.blur(),this.setIconVisibility(!1),this.actionMenuContentSlot&&t?.type==="mouseleave"&&this.setMenuVisibility(!1)});p(this,"showActionMenuOnHover",()=>{this.actionMenu&&this.setIconVisibility(!0)});p(this,"hideActionMenu",()=>{this.setMenuVisibility(!1),this.setIconVisibility(!1)});p(this,"hideActionMenuOnBlur",t=>{t.relatedTarget===this.actionMenu||this.actionMenu?.contains(t.relatedTarget)||this.slottedContent?.contains(t.relatedTarget)||(this.isMenuOpen()&&this.setMenuVisibility(!1),this.card.contains(t.relatedTarget)||this.setIconVisibility(!1))});p(this,"handleCardFocusOut",t=>{t.relatedTarget===this.actionMenu||this.actionMenu?.contains(t.relatedTarget)||t.relatedTarget===this.card||(this.slottedContent&&(t.target===this.slottedContent||this.slottedContent.contains(t.target))&&(this.slottedContent.contains(t.relatedTarget)||this.setMenuVisibility(!1)),!this.card.contains(t.relatedTarget)&&!this.isMenuOpen()&&this.setIconVisibility(!1))});p(this,"handleKeyDown",t=>{(t.key==="Escape"||t.key==="Esc")&&(t.preventDefault(),this.hideActionMenu(),this.actionMenu?.focus())})}get actionMenu(){return this.card.shadowRoot.querySelector(".action-menu")}get actionMenuContentSlot(){return this.card.shadowRoot.querySelector('slot[name="action-menu-content"]')}get slottedContent(){return this.card.querySelector('[slot="action-menu-content"]')}setIconVisibility(t){if(this.slottedContent){if(Lr()&&this.card.actionMenu)return;this.actionMenu?.classList.toggle("invisible",!t),this.actionMenu?.classList.toggle("always-visible",t)}}setMenuVisibility(t){this.actionMenuContentSlot?.classList.toggle("hidden",!t),this.setAriaExpanded(this.actionMenu,t.toString()),t&&(this.dispatchActionMenuToggle(),setTimeout(()=>{let i=this.slottedContent?.querySelector("a");i&&i.focus()},0))}isMenuOpen(){return!this.actionMenuContentSlot?.classList.contains("hidden")}renderLayout(){return _r` <div class="body">
                <div class="top-section">
                    <slot name="icons"></slot> ${this.badge}
                    <div
                        class="action-menu
                ${this.slottedContent?Lr()&&this.card.actionMenu?"always-visible":"invisible":"hidden"}"
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
                ${this.promoBottom?"":_r`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`}
                <slot name="body-xs"></slot>
                ${this.promoBottom?_r`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`:""}
            </div>
            ${this.secureLabelFooter}
            <slot></slot>`}getGlobalCSS(){return Hi}setAriaExpanded(t,i){t.setAttribute("aria-expanded",i)}connectedCallbackHook(){this.card.addEventListener("mouseenter",this.showActionMenuOnHover),this.card.addEventListener("mouseleave",this.toggleActionMenuFromCard),this.card.addEventListener("focusin",this.showActionMenuOnHover),this.card.addEventListener("focusout",this.handleCardFocusOut),this.card.addEventListener("keydown",this.handleKeyDown)}disconnectedCallbackHook(){this.card.removeEventListener("mouseenter",this.showActionMenuOnHover),this.card.removeEventListener("mouseleave",this.toggleActionMenuFromCard),this.card.removeEventListener("focusin",this.showActionMenuOnHover),this.card.removeEventListener("focusout",this.handleCardFocusOut),this.card.removeEventListener("keydown",this.handleKeyDown)}};p(Xe,"variantStyle",Zn`
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
    `);import{html as wt,css as Kn}from"./lit-all.min.js";var $i=`
:root {
  --consonant-merch-card-image-width: 300px;
  --merch-card-collection-card-width: var(--consonant-merch-card-image-width);
}

.one-merch-card.image,
.two-merch-cards.image,
.three-merch-cards.image,
.four-merch-cards.image {
  --merch-card-collection-card-width: var(--consonant-merch-card-image-width);
  grid-template-columns: minmax(300px, var(--consonant-merch-card-image-width));
}

.section[class*="-merch-cards"]:has(merch-card[variant="image"]) > .content {
  --merch-card-collection-card-width: var(--consonant-merch-card-image-width);
}

@media screen and ${T} {
  .two-merch-cards.image,
  .three-merch-cards.image,
  .four-merch-cards.image {
      grid-template-columns: repeat(2, minmax(300px, var(--consonant-merch-card-image-width)));
  }
}

@media screen and ${x} {
  :root {
    --consonant-merch-card-image-width: 378px;
  }

  .three-merch-cards.image {
      grid-template-columns: repeat(3, var(--consonant-merch-card-image-width));
  }

  .four-merch-cards.image {
      grid-template-columns: repeat(4, var(--consonant-merch-card-image-width));
  }
}
`;var Ui={cardName:{attribute:"name"},badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},badgeIcon:!0,borderColor:{attribute:"border-color"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],ctas:{slot:"footer",size:"m"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},prices:{tag:"h3",slot:"heading-xs"},promoText:{tag:"p",slot:"promo-text"},size:["wide","super-wide"],title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"body-xxs"},backgroundImage:{tag:"div",slot:"bg-image"}},ke=class extends y{constructor(r){super(r)}getGlobalCSS(){return $i}renderLayout(){return wt`<div class="image">
                <slot name="bg-image"></slot>
                <slot name="badge"></slot>
            </div>
            <div class="body">
                <slot name="icons"></slot>
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${this.promoBottom?wt`<slot name="body-xs"></slot
                          ><slot name="promo-text"></slot>`:wt`<slot name="promo-text"></slot
                          ><slot name="body-xs"></slot>`}
            </div>
            ${this.evergreen?wt`
                      <div
                          class="detail-bg-container"
                          style="background: ${this.card.detailBg}"
                      >
                          <slot name="detail-bg"></slot>
                      </div>
                  `:wt`
                      <hr />
                      ${this.secureLabelFooter}
                  `}`}};p(ke,"variantStyle",Kn`
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
    `);import{html as qi}from"./lit-all.min.js";var Gi=`
:root {
  --consonant-merch-card-inline-heading-width: 300px;
}

.one-merch-card.inline-heading,
.two-merch-cards.inline-heading,
.three-merch-cards.inline-heading,
.four-merch-cards.inline-heading {
    grid-template-columns: var(--consonant-merch-card-inline-heading-width);
}

@media screen and ${T} {
  .two-merch-cards.inline-heading,
  .three-merch-cards.inline-heading,
  .four-merch-cards.inline-heading {
      grid-template-columns: repeat(2, var(--consonant-merch-card-inline-heading-width));
  }
}

@media screen and ${x} {
  :root {
    --consonant-merch-card-inline-heading-width: 378px;
  }

  .three-merch-cards.inline-heading,
  .four-merch-cards.inline-heading {
      grid-template-columns: repeat(3, var(--consonant-merch-card-inline-heading-width));
  }
}

@media screen and ${O} {
  .four-merch-cards.inline-heading {
      grid-template-columns: repeat(4, var(--consonant-merch-card-inline-heading-width));
  }
}
`;var Zt=class extends y{constructor(r){super(r)}getGlobalCSS(){return Gi}renderLayout(){return qi` ${this.badge}
            <div class="body">
                <div class="top-section">
                    <slot name="icons"></slot>
                    <slot name="heading-xs"></slot>
                </div>
                <slot name="body-xs"></slot>
            </div>
            ${this.card.customHr?"":qi`<hr />`} ${this.secureLabelFooter}`}};import{html as ge,css as Qn,unsafeCSS as ji}from"./lit-all.min.js";var Vi=`
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

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"].annual-price-new-line > span[is="inline-price"] > .price-annual,
merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"].annual-price-new-line > span[is="inline-price"] > .price-annual-prefix::after,
merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"].annual-price-new-line > span[is="inline-price"] >.price-annual-suffix {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
  font-style: italic;
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
@media screen and ${A} {
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

@media screen and ${N} {
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
@media screen and ${T} {
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
@media screen and ${x} {
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
}

@media screen and ${O} {
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
`;var Jn=32,Wi={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m-price"},promoText:{tag:"div",slot:"promo-text"},shortDescription:{tag:"div",slot:"body-xxs"},description:{tag:"div",slot:"body-m"},mnemonics:{size:"l"},quantitySelect:{tag:"div",slot:"quantity-select"},callout:{tag:"div",slot:"callout-content"},addon:!0,secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],whatsIncludedDividerColor:{attribute:"whats-included-divider-color"},allowedWhatsIncludedDividerColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],whatsIncluded:{tag:"div",slot:"footer-rows"},ctas:{slot:"footer",size:"l"},style:"consonant"},Ze=class extends y{constructor(t){super(t);p(this,"getRowMinHeightPropertyName",t=>`--consonant-merch-card-footer-row-${t}-min-height`);p(this,"getMiniCompareFooter",()=>{let t=this.card.secureLabel?ge`<slot name="secure-transaction-label">
                  <span class="secure-transaction-label"
                      >${this.card.secureLabel}</span
                  ></slot
              >`:ge`<slot name="secure-transaction-label"></slot>`;return this.isNewVariant?ge`<footer>
                ${t}
                <p class="action-area"><slot name="footer"></slot></p>
            </footer>`:ge`<footer>${t}<slot name="footer"></slot></footer>`});this.updatePriceQuantity=this.updatePriceQuantity.bind(this)}connectedCallbackHook(){this.card.addEventListener($,this.updatePriceQuantity),this.visibilityObserver=new IntersectionObserver(([t])=>{t.boundingClientRect.height!==0&&t.isIntersecting&&(w.isMobile||requestAnimationFrame(()=>{let i=this.getContainer();if(!i)return;i.querySelectorAll('merch-card[variant="mini-compare-chart"]').forEach(n=>n.variantLayout?.syncHeights?.())}),this.visibilityObserver.disconnect())}),this.visibilityObserver.observe(this.card)}disconnectedCallbackHook(){if(this.card.removeEventListener($,this.updatePriceQuantity),this.visibilityObserver?.disconnect(),this.legalElement&&this.legalResolvedHandler&&(this.legalElement.removeEventListener(ee,this.legalResolvedHandler),this.legalResolvedHandler=null,this.legalElement=null),this.calloutListenersAdded){document.removeEventListener("touchstart",this.handleCalloutTouch),document.removeEventListener("mouseover",this.handleCalloutMouse);let t=this.card.querySelector('[slot="callout-content"] .icon-button');t?.removeEventListener("focusin",this.handleCalloutFocusin),t?.removeEventListener("focusout",this.handleCalloutFocusout),t?.removeEventListener("keydown",this.handleCalloutKeydown),this.calloutListenersAdded=!1}}updatePriceQuantity({detail:t}){!this.mainPrice||!t?.option||(this.mainPrice.dataset.quantity=t.option)}priceOptionsProvider(t,i){if(this.isNewVariant){if(t.dataset.template===D){i.displayPlanType=this.card?.settings?.displayPlanType??!1;return}(t.dataset.template==="strikethrough"||t.dataset.template==="price")&&(i.displayPerUnit=!1)}}getGlobalCSS(){return Vi}adjustMiniCompareBodySlots(){if(this.card.getBoundingClientRect().width<=2)return;this.updateCardElementMinHeight(this.card.shadowRoot.querySelector(".top-section"),"top-section");let t=["heading-m","subtitle","body-m","heading-m-price","body-xxs","price-commitment","quantity-select","offers","promo-text","callout-content","addon"];this.card.classList.contains("bullet-list")&&t.push("footer-rows"),t.forEach(a=>this.updateCardElementMinHeight(this.card.shadowRoot.querySelector(`slot[name="${a}"]`),a)),this.updateCardElementMinHeight(this.card.shadowRoot.querySelector("footer"),"footer"),this.card.shadowRoot.querySelector(".mini-compare-chart-badge")?.textContent!==""&&this.getContainer().style.setProperty("--consonant-merch-card-mini-compare-chart-top-section-mobile-height","32px")}adjustMiniCompareFooterRows(){if(this.card.getBoundingClientRect().width===0)return;let t;if(this.isNewVariant){let i=this.card.querySelector("merch-whats-included");if(!i)return;t=[...i.querySelectorAll('[slot="content"] merch-mnemonic-list')]}else{let i=this.card.querySelector('[slot="footer-rows"] ul');if(!i||!i.children)return;t=[...i.children]}t.length&&t.forEach((i,a)=>{let n=Math.max(Jn,parseFloat(window.getComputedStyle(i).height)||0),o=parseFloat(this.getContainer().style.getPropertyValue(this.getRowMinHeightPropertyName(a+1)))||0;n>o&&this.getContainer().style.setProperty(this.getRowMinHeightPropertyName(a+1),`${n}px`)})}removeEmptyRows(){this.isNewVariant?this.card.querySelectorAll('merch-whats-included [slot="content"] merch-mnemonic-list').forEach(i=>{if(i.hasAttribute("data-placeholder"))return;let a=i.querySelector('[slot="icon"]'),n=!!a?.querySelector(".sp-icon")||!!a?.querySelector('merch-icon[src]:not([src=""]), img[src]:not([src=""])'),s=i.querySelector('[slot="description"]')?.textContent?.replace(/\u00a0/g," ")?.trim()??"";!n&&!s&&i.remove()}):this.card.querySelectorAll(".footer-row-cell").forEach(i=>{if(i.hasAttribute("data-placeholder"))return;let a=i.querySelector(".footer-row-cell-description");a&&!a.textContent.trim()&&i.remove()})}padFooterRows(){let t=this.getContainer();if(!t)return;let i=t.querySelectorAll('merch-card[variant="mini-compare-chart"]');if(this.isNewVariant){let a=0;if(i.forEach(l=>{let h=l.querySelector("merch-whats-included");if(!h)return;let u=h.querySelectorAll('[slot="content"] merch-mnemonic-list:not([data-placeholder])');a=Math.max(a,u.length)}),a===0)return;let n=this.card.querySelector("merch-whats-included");if(!n)return;let o=n.querySelector('[slot="content"]');if(!o)return;o.querySelectorAll("merch-mnemonic-list[data-placeholder]").forEach(l=>l.remove());let s=o.querySelectorAll("merch-mnemonic-list").length,c=a-s;for(let l=0;l<c;l++){let h=document.createElement("merch-mnemonic-list");h.setAttribute("data-placeholder","");let u=document.createElement("div");u.setAttribute("slot","icon");let m=document.createElement("div");m.setAttribute("slot","description"),h.append(u,m),o.appendChild(h)}}else{let a=0;if(i.forEach(c=>{let l=c.querySelector('[slot="footer-rows"] ul');if(!l)return;let h=l.querySelectorAll("li.footer-row-cell:not([data-placeholder])");a=Math.max(a,h.length)}),a===0)return;let n=this.card.querySelector('[slot="footer-rows"] ul');if(!n)return;n.querySelectorAll("li.footer-row-cell[data-placeholder]").forEach(c=>c.remove());let o=n.querySelectorAll("li.footer-row-cell").length,s=a-o;for(let c=0;c<s;c++){let l=document.createElement("li");l.className="footer-row-cell",l.setAttribute("data-placeholder",""),n.appendChild(l)}}}get mainPrice(){return this.card.querySelector(`[slot="heading-m-price"] ${C}[data-template="price"]`)}get headingMPriceSlot(){return this.card.shadowRoot.querySelector('slot[name="heading-m-price"]')?.assignedElements()[0]}get isNewVariant(){return!!this.card.querySelector("merch-whats-included")}toggleAddon(t){let i=this.mainPrice,a=this.headingMPriceSlot;if(!i&&a){let n=t?.getAttribute("plan-type"),o=null;if(t&&n&&(o=t.querySelector(`p[data-plan-type="${n}"]`)?.querySelector('span[is="inline-price"]')),this.card.querySelectorAll('p[slot="heading-m-price"]').forEach(s=>s.remove()),t.checked){if(o){let s=I("p",{class:"addon-heading-m-price-addon",slot:"heading-m-price"},o.innerHTML);this.card.appendChild(s)}}else{let s=I("p",{class:"card-heading",id:"free",slot:"heading-m-price"},"Free");this.card.appendChild(s)}}}showTooltip(t){t.classList.remove("hide-tooltip"),t.setAttribute("aria-expanded","true")}hideTooltip(t){t.classList.add("hide-tooltip"),t.setAttribute("aria-expanded","false")}adjustCallout(){let t=this.card.querySelector('[slot="callout-content"] .icon-button');if(!t||this.calloutListenersAdded)return;let i=t.title||t.dataset.tooltip;if(!i)return;t.title&&(t.dataset.tooltip=t.title,t.removeAttribute("title"));let a=t.parentElement;if(a&&a.tagName==="P"){let n=document.createElement("div"),o=document.createElement("div");o.className="callout-row";let s=document.createElement("div");for(s.className="callout-text";a.firstChild&&a.firstChild!==t;)s.appendChild(a.firstChild);o.appendChild(s),o.appendChild(t),n.appendChild(o),a.replaceWith(n)}t.setAttribute("role","button"),t.setAttribute("tabindex","0"),t.setAttribute("aria-label",i),t.setAttribute("aria-expanded","false"),this.hideTooltip(t),this.handleCalloutTouch=n=>{n.target!==t?this.hideTooltip(t):t.classList.contains("hide-tooltip")?this.showTooltip(t):this.hideTooltip(t)},this.handleCalloutMouse=n=>{n.target!==t?this.hideTooltip(t):this.showTooltip(t)},this.handleCalloutFocusin=()=>{this.showTooltip(t)},this.handleCalloutFocusout=()=>{this.hideTooltip(t)},this.handleCalloutKeydown=n=>{n.key==="Escape"&&(this.hideTooltip(t),t.blur())},document.addEventListener("touchstart",this.handleCalloutTouch),document.addEventListener("mouseover",this.handleCalloutMouse),t.addEventListener("focusin",this.handleCalloutFocusin),t.addEventListener("focusout",this.handleCalloutFocusout),t.addEventListener("keydown",this.handleCalloutKeydown),this.calloutListenersAdded=!0}async adjustAddon(){await this.card.updateComplete;let t=this.card.addon;if(!t)return;let i=this.mainPrice,a=this.card.planType;if(i&&(await i.onceSettled(),a=i.value?.[0]?.planType),!a)return;t.planType=a,this.card.querySelector("merch-addon[plan-type]")?.updateComplete.then(()=>{this.updateCardElementMinHeight(this.card.shadowRoot.querySelector('slot[name="addon"]'),"addon")})}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let t=this.mainPrice;if(!t)return;let i=t.cloneNode(!0);if(await t.onceSettled(),!t?.options)return;t.options.displayPerUnit&&(t.dataset.displayPerUnit="false"),t.options.displayTax&&(t.dataset.displayTax="false"),t.options.displayPlanType&&(t.dataset.displayPlanType="false"),i.setAttribute("data-template","legal"),t.parentNode.insertBefore(i,t.nextSibling),await i.onceSettled(),this.legalResolvedHandler||(this.legalResolvedHandler=()=>this.adjustShortDescription(),i.addEventListener(ee,this.legalResolvedHandler),this.legalElement=i)}catch{}}adjustShortDescription(){if(!this.shortDescriptionSource){let o=this.card.querySelector('[slot="body-xxs"]');if(!o)return;this.shortDescriptionSource=o,o.remove()}let t=this.shortDescriptionSource.textContent?.trim();if(!t)return;let a=this.card.querySelector('[slot="heading-m-price"] [data-template="legal"]')?.querySelector(".price-plan-type");if(!a||a.querySelector("em"))return;let n=document.createElement("em");n.textContent=` ${t}`,a.appendChild(n)}renderLayout(){return this.isNewVariant?ge` <div class="top-section${this.badge?" badge":""}">
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
            <slot name="footer-rows"><slot name="body-s"></slot></slot>`:ge` <div class="top-section${this.badge?" badge":""}">
                    <slot name="icons"></slot> ${this.badge}
                </div>
                <slot name="heading-m"></slot>
                ${this.card.classList.contains("bullet-list")?ge`<slot name="heading-m-price"></slot>
                          <slot name="price-commitment"></slot>
                          <slot name="body-xxs"></slot>
                          <slot name="promo-text"></slot>
                          <slot name="body-m"></slot>
                          <slot name="offers"></slot>`:ge`<slot name="body-m"></slot>
                          <slot name="heading-m-price"></slot>
                          <slot name="body-xxs"></slot>
                          <slot name="price-commitment"></slot>
                          <slot name="offers"></slot>
                          <slot name="promo-text"></slot> `}
                <slot name="callout-content"></slot>
                <slot name="addon"></slot>
                ${this.getMiniCompareFooter()}
                <slot name="footer-rows"><slot name="body-s"></slot></slot>`}syncHeights(){this.card.getBoundingClientRect().width<=2||(this.adjustMiniCompareBodySlots(),this.adjustMiniCompareFooterRows())}async postCardUpdateHook(){if(await super.postCardUpdateHook(),this.isNewVariant&&(this.legalAdjusted||await this.adjustLegal(),this.adjustShortDescription(),this.adjustCallout()),await this.adjustAddon(),this.isNewVariant&&this.removeEmptyRows(),w.isMobile)this.isNewVariant||this.removeEmptyRows();else{this.padFooterRows();let t=this.getContainer();if(!t)return;let i=t.style.getPropertyValue("--consonant-merch-card-footer-row-1-min-height");requestAnimationFrame(i?()=>{this.syncHeights()}:()=>{t.querySelectorAll('merch-card[variant="mini-compare-chart"]').forEach(n=>n.variantLayout?.syncHeights?.())})}}};p(Ze,"variantStyle",Qn`
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

        @media screen and ${ji(N)} {
            [class*'-merch-cards']
                :host([variant='mini-compare-chart'])
                footer {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
        }

        @media screen and ${ji(x)} {
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
    `);import{html as Kt,css as eo,unsafeCSS as Xi,nothing as to}from"./lit-all.min.js";var Yi=`
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
    display: inline-block;
    min-height: 30px;
    min-width: 1px;
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

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] .price-recurrence,
  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] span[data-template="recurrence"] {
    text-transform: lowercase;
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
    margin-top: 16px;
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
  }

  merch-card[variant="mini-compare-chart-mweb"] ul li::before {
    display: inline-block;
    content: var(--list-checked-icon);
    margin-right: var(--consonant-merch-spacing-xxs);
    vertical-align: middle;
    flex-shrink: 0;
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
    padding-block-start: 12px;
    padding-block-end: 4px;
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

merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"].annual-price-new-line > span[is="inline-price"] > .price-annual,
merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"].annual-price-new-line > span[is="inline-price"] > .price-annual-prefix::after,
merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"].annual-price-new-line > span[is="inline-price"] >.price-annual-suffix {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
  font-style: italic;
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

merch-card[variant="mini-compare-chart-mweb"] [slot="promo-text"] {
  padding: 12px 0 0;
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 700;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="promo-text"] a {
  font-weight: 400;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="heading-xs"] {
	font-size: var(--consonant-merch-card-heading-xxs-font-size);
	line-height: var(--consonant-merch-card-heading-xxs-line-height);
}

merch-card[variant="mini-compare-chart-mweb"] [slot="body-m"] {
  padding: 0 0 var(--consonant-merch-spacing-xs) 0;
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

merch-card[variant="mini-compare-chart-mweb"] footer {
  gap: var(--consonant-merch-spacing-xxs);
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
@media screen and ${A} {
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
    padding: var(--consonant-merch-card-card-mini-compare-mobile-spacing-xs) var(--consonant-merch-spacing-xs) 0;
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

@media screen and ${N} {
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
@media screen and ${T} {
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

  merch-card[variant="mini-compare-chart-mweb"] .checkmark-copy-container.open {
    padding-block-start: var(--consonant-merch-spacing-xs);
    padding-block-end: 0;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-cell-checkmark {
    gap: var(--consonant-merch-spacing-xxs);
  }
}

/* desktop */
@media screen and ${x} {
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

  /* Card fills the wider column in sparse layouts (one/two cards) */
  .one-merch-card.mini-compare-chart-mweb merch-card[variant="mini-compare-chart-mweb"],
  .one-merch-card:has(merch-card[variant="mini-compare-chart-mweb"]) merch-card[variant="mini-compare-chart-mweb"],
  .two-merch-cards.mini-compare-chart-mweb merch-card[variant="mini-compare-chart-mweb"],
  .two-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) merch-card[variant="mini-compare-chart-mweb"] {
    max-width: var(--consonant-merch-card-mini-compare-chart-mweb-wide-width);
  }
}

@media screen and ${O} {
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
`;var ro=32,Zi={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m-price"},promoText:{tag:"div",slot:"promo-text"},shortDescription:{tag:"div",slot:"body-m"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],ctas:{slot:"footer",size:"l"},style:"consonant"},Ke=class extends y{constructor(t){super(t);p(this,"getRowMinHeightPropertyName",t=>`--consonant-merch-card-footer-row-${t}-min-height`);p(this,"getMiniCompareFooter",()=>Kt` <footer>
            <slot name="secure-transaction-label">
                <span class="secure-transaction-label-text"
                    >${this.secureLabel}</span
                >
            </slot>
            <p class="action-area">
                <slot name="footer"></slot>
            </p>
        </footer>`);p(this,"getMiniCompareFooterRows",()=>Kt` <div class="footer-rows-container">
            <slot name="body-xs"></slot>
            <slot name="footer-rows"></slot>
        </div>`);this.updatePriceQuantity=this.updatePriceQuantity.bind(this)}connectedCallbackHook(){this.card.addEventListener($,this.updatePriceQuantity)}disconnectedCallbackHook(){this.card.removeEventListener($,this.updatePriceQuantity),this._syncObserver?.disconnect(),this._syncObserver=null}updatePriceQuantity({detail:t}){!this.mainPrice||!t?.option||(this.mainPrice.dataset.quantity=t.option)}priceOptionsProvider(t,i){if(t.dataset.template===D){i.displayPlanType=this.card?.settings?.displayPlanType??!1;return}(t.dataset.template==="strikethrough"||t.dataset.template==="price")&&(i.displayPerUnit=!1)}getGlobalCSS(){return Yi}adjustMiniCompareBodySlots(){if(this.card.getBoundingClientRect().width<=2){this._syncObserver||(this._syncObserver=new ResizeObserver(()=>{this.card.getBoundingClientRect().width>2&&(this._syncObserver?.disconnect(),this._syncObserver=null,this.adjustMiniCompareBodySlots(),this.adjustMiniCompareFooterRows())}),this._syncObserver.observe(this.card));return}["heading-xs","subtitle","heading-m-price","promo-text","body-m","body-xs","footer-rows"].forEach(i=>{let n=this.card.querySelector(`[slot="${i}"]`)??this.card.shadowRoot.querySelector(`slot[name="${i}"]`);this.updateCardElementMinHeight(n,i)}),this.updateCardElementMinHeight(this.card.shadowRoot.querySelector('slot[name="promo-text"]'),"promo-text"),this.updateCardElementMinHeight(this.card.shadowRoot.querySelector("footer"),"footer")}adjustMiniCompareFooterRows(){if(this.card.getBoundingClientRect().width===0)return;let t=this.card.querySelector('[slot="footer-rows"] ul');!t||!t.children||[...t.children].forEach((i,a)=>{let n=Math.max(ro,parseFloat(window.getComputedStyle(i).height)||0),o=parseFloat(this.getContainer().style.getPropertyValue(this.getRowMinHeightPropertyName(a+1)))||0;n>o&&this.getContainer().style.setProperty(this.getRowMinHeightPropertyName(a+1),`${n}px`)})}removeEmptyRows(){this.card.querySelectorAll(".footer-row-cell").forEach(i=>{let a=i.querySelector(".footer-row-cell-description");a&&!a.textContent.trim()&&i.remove()})}setupToggle(){if(this.toggleSetupDone)return;let t=this.card.querySelector('[slot="body-xs"]');if(!t)return;let i=t.querySelector("p"),a=t.querySelector("ul");if(!i||!a||t.querySelector(".footer-rows-title"))return;this.toggleSetupDone=!0;let n=i.textContent.trim(),o=this.card.querySelector("h3")?.id,s=o?`${o}-list`:`mweb-list-${Date.now()}`;a.setAttribute("id",s),a.classList.add("checkmark-copy-container");let c=I("div",{class:"footer-rows-title"},n);if(w.isMobile){let l=I("button",{class:"toggle-icon","aria-label":n,"aria-expanded":"false","aria-controls":s});c.appendChild(l),c.addEventListener("click",()=>{let h=a.classList.toggle("open");l.classList.toggle("expanded",h),l.setAttribute("aria-expanded",String(h))})}else a.classList.add("open");i.replaceWith(c)}get legalDisplayDot(){return!1}get mainPrice(){return this.card.querySelector(`[slot="heading-m-price"] ${C}[data-template="price"]`)}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let t=this.mainPrice;if(!t)return;let i=t.cloneNode(!0);if(await t.onceSettled(),!t?.options)return;t.options.displayPerUnit&&(t.dataset.displayPerUnit="false"),t.options.displayTax&&(t.dataset.displayTax="false"),t.options.displayPlanType&&(t.dataset.displayPlanType="false"),i.setAttribute("data-template","legal"),t.parentNode.insertBefore(i,t.nextSibling),await i.onceSettled()}catch{}}get icons(){return!this.card.querySelector('[slot="icons"]')&&!this.card.getAttribute("id")?to:Kt`<slot name="icons"></slot>`}renderLayout(){return Kt`
            ${this.badge}
            <div class="body">
                ${this.icons}
                <slot name="badge"></slot>
                <slot name="heading-xs"></slot>
                <slot name="subtitle"></slot>
                <slot name="heading-m-price"></slot>
                <slot name="body-m"></slot>
                <slot name="promo-text"></slot>
                ${this.getMiniCompareFooter()}
            </div>
            ${this.getMiniCompareFooterRows()}
        `}async postCardUpdateHook(){if(await super.postCardUpdateHook(),this.legalAdjusted||await this.adjustLegal(),this.setupToggle(),w.isMobile)this.removeEmptyRows();else{this.adjustMiniCompareFooterRows();let t=this.getContainer();if(!t)return;requestAnimationFrame(()=>{t.querySelectorAll('merch-card[variant="mini-compare-chart-mweb"]').forEach(a=>{a.variantLayout?.adjustMiniCompareBodySlots?.(),a.variantLayout?.adjustMiniCompareFooterRows?.()})})}}};p(Ke,"variantStyle",eo`
        :host([variant='mini-compare-chart-mweb']) .body > slot {
            display: block;
        }

        :host([variant='mini-compare-chart-mweb'])
            .body
            > slot[name='heading-m-price'] {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
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

        @media screen and ${Xi(N)} {
            [class*'-merch-cards']
                :host([variant='mini-compare-chart-mweb'])
                footer {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
        }

        @media screen and ${Xi(x)} {
            :host([variant='mini-compare-chart-mweb']) footer {
                padding: 0;
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
            .body
            > slot[name='heading-xs'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-heading-xs-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            .body
            > slot[name='subtitle'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-subtitle-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            .body
            > slot[name='heading-m-price'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-heading-m-price-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            .body
            > slot[name='promo-text'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-promo-text-height
            );
        }
        :host([variant='mini-compare-chart-mweb']) .body > slot[name='body-m'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-body-m-height
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
    `);import{html as Et,css as io,nothing as Qt}from"./lit-all.min.js";var Ki=`
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

merch-card[variant^="plans"] [slot="callout-content"] img,
merch-card[variant^="plans"] [slot="callout-content"] .icon-button {
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
@media screen and ${A} {
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
@media screen and ${T} {
    :root {
        --consonant-merch-card-plans-students-width: 486px;
    }

    .four-merch-cards.plans .foreground {
        max-width: unset;
    }
}

@media screen and ${N} {
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
@media screen and ${x} {
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
@media screen and ${O} {
    .columns .four-merch-cards.plans {
        grid-template-columns: repeat(2, var(--consonant-merch-card-plans-width));
    }

    merch-sidenav.plans {
        --merch-sidenav-collection-gap: 54px;
    }
}
`;var Jt={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},addon:!0,secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],whatsIncluded:{tag:"div",slot:"whats-included"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},Qi={...function(){let{whatsIncluded:e,size:r,...t}=Jt;return t}(),title:{tag:"h3",slot:"heading-s"},secureLabel:!1},Ji={...function(){let{subtitle:e,whatsIncluded:r,size:t,quantitySelect:i,...a}=Jt;return a}()},te,re,U=class extends y{constructor(t){super(t);f(this,te);f(this,re);this.adaptForMedia=this.adaptForMedia.bind(this)}priceOptionsProvider(t,i){t.dataset.template===D&&(i.displayPlanType=this.card?.settings?.displayPlanType??!1)}getGlobalCSS(){return Ki}adjustSlotPlacement(t,i,a){let n=this.card.shadowRoot,o=n.querySelector("footer"),s=this.card.getAttribute("size");if(!s)return;let c=n.querySelector(`footer slot[name="${t}"]`),l=n.querySelector(`.body slot[name="${t}"]`),h=n.querySelector(".body");if(s.includes("wide")||(o?.classList.remove("wide-footer"),c&&c.remove()),!!i.includes(s)){if(o?.classList.toggle("wide-footer",w.isDesktopOrUp),!a&&c){if(l)c.remove();else{let u=h.querySelector(`[data-placeholder-for="${t}"]`);u?u.replaceWith(c):h.appendChild(c)}return}if(a&&l){let u=document.createElement("div");if(u.setAttribute("data-placeholder-for",t),u.classList.add("slot-placeholder"),!c){let m=l.cloneNode(!0);o.prepend(m)}l.replaceWith(u)}}}adaptForMedia(){if(!this.card.closest("merch-card-collection,overlay-trigger,.two-merch-cards,.three-merch-cards,.four-merch-cards, .columns")){this.card.removeAttribute("size");return}this.adjustSlotPlacement("addon",["super-wide"],w.isDesktopOrUp),this.adjustSlotPlacement("callout-content",["super-wide"],w.isDesktopOrUp)}adjustCallout(){let t=this.card.querySelector('[slot="callout-content"] .icon-button');t&&t.title&&(t.dataset.tooltip=t.title,t.removeAttribute("title"),t.classList.add("hide-tooltip"),document.addEventListener("touchstart",i=>{i.preventDefault(),i.target!==t?t.classList.add("hide-tooltip"):i.target.classList.toggle("hide-tooltip")}),document.addEventListener("mouseover",i=>{i.preventDefault(),i.target!==t?t.classList.add("hide-tooltip"):i.target.classList.remove("hide-tooltip")}))}syncHeights(){if(this.card.getBoundingClientRect().width<=2){d(this,te)||(g(this,te,new ResizeObserver(()=>{this.card.getBoundingClientRect().width>2&&(d(this,te)?.disconnect(),g(this,te,null),this.syncHeights())})),d(this,te).observe(this.card));return}let t=["heading-xs","subtitle","heading-m","promo-text","body-xs"];this.syncRowHeights(t.map(i=>({name:i,getElement:a=>a.querySelector(`[slot="${i}"]`)})))}async adjustEduLists(){if(this.card.variant!=="plans-education"||this.card.querySelector(".spacer"))return;let i=this.card.querySelector('[slot="body-xs"]');if(!i)return;let a=i.querySelector("ul");if(!a)return;let n=a.previousElementSibling,o=document.createElement("div");o.classList.add("spacer"),i.insertBefore(o,n);let s=new IntersectionObserver(([c])=>{if(c.boundingClientRect.height===0)return;let l=0,h=this.card.querySelector('[slot="heading-s"]');h&&(l+=ft(h));let u=this.card.querySelector('[slot="subtitle"]');u&&(l+=ft(u));let m=this.card.querySelector('[slot="heading-m"]');m&&(l+=8+ft(m));for(let L of i.childNodes){if(L.classList.contains("spacer"))break;l+=ft(L)}let b=this.card.parentElement.style.getPropertyValue("--merch-card-plans-edu-list-max-offset");l>(parseFloat(b)||0)&&this.card.parentElement.style.setProperty("--merch-card-plans-edu-list-max-offset",`${l}px`),this.card.style.setProperty("--merch-card-plans-edu-list-offset",`${l}px`),s.disconnect()});s.observe(this.card)}async postCardUpdateHook(){this.adaptForMedia(),this.adjustAddon(),this.adjustCallout(),this.legalAdjusted||(await this.adjustLegal(),await this.adjustEduLists()),await super.postCardUpdateHook(),window.matchMedia("(min-width: 768px)").matches&&requestAnimationFrame(()=>{this.syncHeights()})}get headingM(){return this.card.querySelector('[slot="heading-m"]')}get mainPrice(){return this.headingM?.querySelector(`${C}[data-template="price"]`)}get divider(){return this.card.variant==="plans-education"?Et`<div class="divider"></div>`:Qt}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let t=[],i=this.card.querySelector(`[slot="heading-m"] ${C}[data-template="price"]`);i&&t.push(i);let a=t.map(async n=>{let o=n.cloneNode(!0);await n.onceSettled(),n?.options&&(n.options.displayPerUnit&&(n.dataset.displayPerUnit="false"),n.options.displayTax&&(n.dataset.displayTax="false"),n.options.displayPlanType&&(n.dataset.displayPlanType="false"),o.setAttribute("data-template","legal"),n.parentNode.insertBefore(o,n.nextSibling),await o.onceSettled())});await Promise.all(a)}catch{}}async adjustAddon(){await this.card.updateComplete;let t=this.card.addon;if(!t)return;t.setAttribute("custom-checkbox","");let i=this.mainPrice;if(!i)return;await i.onceSettled();let a=i.value?.[0]?.planType;a&&(t.planType=a)}get stockCheckbox(){return this.card.checkboxLabel?Et`<label id="stock-checkbox">
                <input type="checkbox" @change=${this.card.toggleStockOffer}></input>
                <span></span>
                ${this.card.checkboxLabel}
            </label>`:Qt}get icons(){return!this.card.querySelector('[slot="icons"]')&&!this.card.getAttribute("id")?Qt:Et`<slot name="icons"></slot>`}connectedCallbackHook(){w.matchMobile.addEventListener("change",this.adaptForMedia),w.matchDesktopOrUp.addEventListener("change",this.adaptForMedia),this.handleResize=()=>{d(this,re)&&cancelAnimationFrame(d(this,re)),g(this,re,requestAnimationFrame(()=>{g(this,re,null),window.matchMedia("(min-width: 768px)").matches&&this.syncHeights()}))},window.addEventListener("resize",this.handleResize)}disconnectedCallbackHook(){w.matchMobile.removeEventListener("change",this.adaptForMedia),w.matchDesktopOrUp.removeEventListener("change",this.adaptForMedia),d(this,te)?.disconnect(),g(this,te,null),this.handleResize&&(window.removeEventListener("resize",this.handleResize),this.handleResize=null),d(this,re)&&(cancelAnimationFrame(d(this,re)),g(this,re,null))}renderLayout(){return Et` ${this.badge}
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
            <slot></slot>`}};te=new WeakMap,re=new WeakMap,p(U,"variantStyle",io`
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
    `),p(U,"collectionOptions",{customHeaderArea:t=>t.sidenav?Et`<slot name="resultsText"></slot>`:Qt,headerVisibility:{search:!1,sort:!1,result:["mobile","tablet"],custom:["desktop"]},onSidenavAttached:t=>{let i=()=>{let a=t.querySelectorAll("merch-card");for(let o of a)o.hasAttribute("data-size")&&(o.setAttribute("size",o.getAttribute("data-size")),o.removeAttribute("data-size"));if(!w.isDesktop)return;let n=0;for(let o of a){if(o.style.display==="none")continue;let s=o.getAttribute("size"),c=s==="wide"?2:s==="super-wide"?3:1;c===2&&n%3===2&&(o.setAttribute("data-size",s),o.removeAttribute("size"),c=1),n+=c}};w.matchDesktop.addEventListener("change",i),t.addEventListener(Ue,i),t.onUnmount.push(()=>{w.matchDesktop.removeEventListener("change",i),t.removeEventListener(Ue,i)})}});import{html as le,css as ao,unsafeCSS as ta,nothing as er}from"./lit-all.min.js";var ea=`
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
@media ${A} {
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
@media ${A} {
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

merch-card[variant="plans-v2"] [slot="heading-m"] .price-recurrence,
merch-card[variant="plans-v2"] [slot="heading-m"] span[data-template="recurrence"] {
    text-transform: lowercase;
    line-height: 1.4;
}

merch-card[variant="plans-v2"] [slot="heading-m"] .price-recurrence:not(.disabled)::after,
merch-card[variant="plans-v2"] [slot="heading-m"] span[data-template="recurrence"]:not(.disabled)::after {
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

@media screen and ${A}, ${N} {
    :root {
        --consonant-merch-card-plans-v2-width: 100%;
    }
    merch-card[variant="plans-v2"] {
        width: 100%;
        max-width: var(--consonant-merch-card-plans-v2-width);
        box-sizing: border-box;
    }
}

@media screen and ${T}, ${x}, ${O} {
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
@media screen and ${A} {
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
@media screen and ${T} {
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
@media screen and ${x} {
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
@media screen and ${O} {
.columns .four-merch-cards.plans:has(merch-card[variant="plans-v2"]) {
    grid-template-columns: repeat(2, var(--consonant-merch-card-plans-v2-width));
  }

}
`;var ra={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m"},shortDescription:{tag:"p",slot:"short-description"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},addon:!0,secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-red-700-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],whatsIncluded:{tag:"div",slot:"whats-included"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},fe=class extends y{constructor(r){super(r),this.adaptForMedia=this.adaptForMedia.bind(this),this.toggleShortDescription=this.toggleShortDescription.bind(this),this.shortDescriptionExpanded=!1,this.syncScheduled=!1}priceOptionsProvider(r,t){if(r.dataset.template===D){t.displayPlanType=this.card?.settings?.displayPlanType??!1;return}(r.dataset.template==="strikethrough"||r.dataset.template==="price")&&(t.displayPerUnit=!1)}getGlobalCSS(){return ea}adjustSlotPlacement(r,t,i){let{shadowRoot:a}=this.card,n=a.querySelector("footer"),o=a.querySelector(".body"),s=this.card.getAttribute("size");if(!s)return;let c=a.querySelector(`footer slot[name="${r}"]`),l=a.querySelector(`.body slot[name="${r}"]`);if(s.includes("wide")||(n?.classList.remove("wide-footer"),c?.remove()),!!t.includes(s)){if(n?.classList.toggle("wide-footer",w.isDesktopOrUp),!i&&c){if(l)c.remove();else{let h=o.querySelector(`[data-placeholder-for="${r}"]`);h?h.replaceWith(c):o.appendChild(c)}return}if(i&&l){let h=document.createElement("div");h.setAttribute("data-placeholder-for",r),h.classList.add("slot-placeholder"),c||n.prepend(l.cloneNode(!0)),l.replaceWith(h)}}}adaptForMedia(){if(!this.card.closest("merch-card-collection,overlay-trigger,.two-merch-cards,.three-merch-cards,.four-merch-cards,.columns"))return this.card.hasAttribute("size"),void 0;this.adjustSlotPlacement("heading-m",["wide"],!0),this.adjustSlotPlacement("addon",["super-wide"],w.isDesktopOrUp),this.adjustSlotPlacement("callout-content",["super-wide"],w.isDesktopOrUp)}adjustCallout(){let r=this.card.querySelector('[slot="callout-content"] .icon-button');if(!r?.title)return;r.dataset.tooltip=r.title,r.removeAttribute("title"),r.classList.add("hide-tooltip");let t=i=>{i===r?r.classList.toggle("hide-tooltip"):r.classList.add("hide-tooltip")};document.addEventListener("touchstart",i=>{i.preventDefault(),t(i.target)}),document.addEventListener("mouseover",i=>{i.preventDefault(),i.target!==r?r.classList.add("hide-tooltip"):r.classList.remove("hide-tooltip")})}async postCardUpdateHook(){this.card.isConnected&&(this.adaptForMedia(),this.adjustAddon(),this.adjustCallout(),this.updateShortDescriptionVisibility(),this.hasShortDescription?this.card.setAttribute("has-short-description",""):this.card.removeAttribute("has-short-description"),this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook(),window.matchMedia("(min-width: 768px)").matches&&requestAnimationFrame(()=>{this.syncHeights()}))}get mainPrice(){return this.card.querySelector(`[slot="heading-m"] ${C}[data-template="price"]`)}syncHeights(){this.card.getBoundingClientRect().width<=2||this.syncRowHeights([{name:"body",getElement:r=>r.shadowRoot?.querySelector(".body")},{name:"footer",getElement:r=>r.shadowRoot?.querySelector("footer")},{name:"short-description",getElement:r=>r.querySelector('[slot="short-description"]')}])}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let r=this.mainPrice;if(!r)return;let t=r.cloneNode(!0);if(await r.onceSettled(),!r?.options)return;r.options.displayPerUnit&&(r.dataset.displayPerUnit="false"),r.options.displayTax&&(r.dataset.displayTax="false"),r.options.displayPlanType&&(r.dataset.displayPlanType="false"),t.setAttribute("data-template","legal"),r.parentNode.insertBefore(t,r.nextSibling),await t.onceSettled()}catch{}}async adjustAddon(){await this.card.updateComplete;let r=this.card.addon;if(!r)return;r.setAttribute("custom-checkbox","");let t=this.mainPrice;if(!t)return;await t.onceSettled();let i=t.value?.[0]?.planType;i&&(r.planType=i)}get stockCheckbox(){return this.card.checkboxLabel?le`<label id="stock-checkbox">
                <input type="checkbox" @change=${this.card.toggleStockOffer}></input>
                <span></span>
                ${this.card.checkboxLabel}
            </label>`:er}get hasShortDescription(){return!!this.card.querySelector('[slot="short-description"]')}get shortDescriptionLabel(){let r=this.card.querySelector('[slot="short-description"]'),t=r.querySelector("strong, b");if(t?.textContent?.trim())return t.textContent.trim();let i=r.querySelector("h1, h2, h3, h4, h5, h6, p");return i?.textContent?.trim()?i.textContent.trim():r.textContent?.trim().split(`
`)[0].trim()}updateShortDescriptionVisibility(){let r=this.card.querySelector('[slot="short-description"]');if(!r)return;let t=r.querySelector("strong, b, p");t&&(w.isMobile?t.style.display="none":t.style.display="")}toggleShortDescription(){this.shortDescriptionExpanded=!this.shortDescriptionExpanded,this.card.requestUpdate()}get shortDescriptionToggle(){return this.hasShortDescription?w.isMobile?le`
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
        `:le`
                <div class="short-description-content desktop">
                    <slot name="short-description"></slot>
                </div>
            `:er}get icons(){return this.card.querySelector('[slot="icons"]')||this.card.getAttribute("id")?le`<slot name="icons"></slot>`:er}get secureLabelFooter(){return le`<footer>
            ${this.secureLabel}<slot name="quantity-select"></slot
            ><slot name="footer"></slot>
        </footer>`}connectedCallbackHook(){this.handleMediaChange=()=>{this.adaptForMedia(),this.updateShortDescriptionVisibility(),this.card.requestUpdate(),window.matchMedia("(min-width: 768px)").matches&&requestAnimationFrame(()=>{this.syncHeights()})},w.matchMobile.addEventListener("change",this.handleMediaChange),w.matchDesktopOrUp.addEventListener("change",this.handleMediaChange),this.handleResize=()=>{this._resizeFrame&&cancelAnimationFrame(this._resizeFrame),this._resizeFrame=requestAnimationFrame(()=>{this._resizeFrame=null,window.matchMedia("(min-width: 768px)").matches&&this.syncHeights()})},window.addEventListener("resize",this.handleResize),this.visibilityObserver=new IntersectionObserver(([r])=>{r.boundingClientRect.height!==0&&r.isIntersecting&&(window.matchMedia("(min-width: 768px)").matches&&requestAnimationFrame(()=>{this.syncHeights()}),this.visibilityObserver.disconnect())}),this.visibilityObserver.observe(this.card)}disconnectedCallbackHook(){w.matchMobile.removeEventListener("change",this.handleMediaChange),w.matchDesktopOrUp.removeEventListener("change",this.handleMediaChange),this.handleResize&&(window.removeEventListener("resize",this.handleResize),this.handleResize=null),this._resizeFrame&&(cancelAnimationFrame(this._resizeFrame),this._resizeFrame=null),this.visibilityObserver?.disconnect()}renderLayout(){let t=this.card.getAttribute("size")==="wide";return le` ${this.badge}
            <div class="body">
                ${t?le`
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
                      `:le`
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
            <slot></slot>`}};p(fe,"variantStyle",ao`
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

        @media ${ta(A)}, ${ta(N)} {
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
    `),p(fe,"collectionOptions",{customHeaderArea:r=>r.sidenav?le`<slot name="resultsText"></slot>`:er,headerVisibility:{search:!1,sort:!1,result:["mobile","tablet"],custom:["desktop"]},onSidenavAttached:r=>{let t=()=>{let i=r.querySelectorAll("merch-card");if(i.forEach(n=>{n.hasAttribute("data-size")&&(n.setAttribute("size",n.getAttribute("data-size")),n.removeAttribute("data-size"))}),!w.isDesktop)return;let a=0;i.forEach(n=>{if(n.style.display==="none")return;let o=n.getAttribute("size"),s=o==="wide"?2:o==="super-wide"?3:1;s===2&&a%3===2&&(n.setAttribute("data-size",o),n.removeAttribute("size"),s=1),a+=s})};w.matchDesktop.addEventListener("change",t),r.addEventListener(Ue,t),r.onUnmount.push(()=>{w.matchDesktop.removeEventListener("change",t),r.removeEventListener(Ue,t)})}});import{html as be,css as jo,nothing as mr}from"./lit-all.min.js";var ia=`
:root {
    --consonant-merch-card-bizpro-font-family-regular: 'Adobe Clean', adobe-clean, sans-serif;
    --consonant-merch-card-bizpro-font-family-display: 'Adobe Clean Display', 'adobe-clean-display', sans-serif;
    --consonant-merch-card-bizpro-max-width: 394px;
    --consonant-merch-card-bizpro-2up-max-width: 596px;
    /* Surface colors pinned to the Figma s2a tokens (background-default /
       background-subtle). Deliberately NOT var(--spectrum-gray-*): inside
       Studio an <sp-theme system="spectrum-two"> defines those, and S2's
       gray-100 (#e9e9e9) / gray-50 (#f8f8f8) are each one step grayer than
       the design, tinting every card surface. */
    --consonant-merch-card-bizpro-bg-default: #fff;
    --consonant-merch-card-bizpro-bg-subtle: #f8f8f8;
    --consonant-merch-card-bizpro-text-color: #000;
    --consonant-merch-card-bizpro-text-muted-color: #000000a3;
    --consonant-merch-card-bizpro-text-inverse-color: #fff;
    --consonant-merch-card-bizpro-cta-accent-color: #3b63fb;
    --consonant-merch-card-bizpro-divider-color: #0000001f;
}

/* The Milo .collection-container is itself a min-content grid; a bizpro
   collection's minmax(0, 1fr) tracks have zero min-content, so it would collapse
   to ~0 width inside it. Let the collection take the full container width \u2014 it
   caps and centres itself via the grid rules below. */
.collection-container.plans:has(merch-card[variant="bizpro"]) {
    display: block;
}

/* Width is driven by the grid track, not a fixed value \u2014 cards fluidly fit
   261px (1280 viewport) \u2192 394px (1920 viewport) per Figma. */
merch-card[variant="bizpro"] {
    width: 100%;
    max-width: var(--consonant-merch-card-bizpro-max-width);
    overflow: visible;
    position: relative;
}

/* Callout banner link \u2014 inherits dark text color + weight, just underlined.
   Force display:inline so the link flows with the surrounding text and
   doesn't get broken onto its own line by any inherited inline-block. */
merch-card[variant="bizpro"] [slot="callout-content"] a {
    display: inline;
    color: inherit;
    font-weight: inherit;
    text-decoration: underline;
    white-space: normal;
}

/* The callout sits flat on the license-zone (Figma 1098:30779) \u2014 drop the
   global gray "pill" (background/radius/fit-content) that other variants use,
   so it's full-width caption text on the zone background instead of a box. */
merch-card[variant="bizpro"] [slot="callout-content"] > p,
merch-card[variant="bizpro"] [slot="callout-content"] > div > div {
    background: transparent;
    border-radius: 0;
    padding: 0;
    width: auto;
    font-size: 12px;
    line-height: 16px;
}

merch-card[variant="bizpro"] [slot="callout-content"] > div {
    margin: 0;
}

/* AI Assistant add-on row \u2014 Figma 1098:33812 / 1098:33951.
   Themes the real <merch-addon> injected at slot="addon". The purple frame
   and trailing sparkle live on the variant's .add-on wrapper (see variantStyle);
   here we size/colour the merch-addon checkbox + label via its custom props. */
merch-card[variant="bizpro"] merch-addon[slot="addon"] {
    flex: 1 0 0;
    min-width: 0;
    --merch-addon-gap: 8px;
    --merch-addon-align: center;
    /* AI-gradient checkbox per Figma 1098:33812 \u2014 the rounded gradient border,
       and (when checked) checkmark use the exact Spectrum 2 S2_Icon_CheckBox_20_N
       paths, filled with the real AI gradient (#8D88F2 @ 48.8% \u2192 #EB1000 @ 100%,
       bottom-left\u2192top-right). The CSS border is dropped; the ring lives in the SVG. */
    --merch-addon-checkbox-size: 20px;
    --merch-addon-checkbox-border: none;
    --merch-addon-checkbox-radius: 0;
    --merch-addon-checkbox-bg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M15.25 18H4.75C3.2334 18 2 16.7666 2 15.25V4.75C2 3.2334 3.2334 2 4.75 2H15.25C16.7666 2 18 3.2334 18 4.75V15.25C18 16.7666 16.7666 18 15.25 18ZM4.75 3.5C4.06055 3.5 3.5 4.06055 3.5 4.75V15.25C3.5 15.9395 4.06055 16.5 4.75 16.5H15.25C15.9395 16.5 16.5 15.9395 16.5 15.25V4.75C16.5 4.06055 15.9395 3.5 15.25 3.5H4.75Z' fill='url(%23b)'/%3E%3Cdefs%3E%3ClinearGradient id='b' x1='2' y1='18' x2='17.1314' y2='1.2169' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0.488' stop-color='%238D88F2'/%3E%3Cstop offset='1' stop-color='%23EB1000'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E") center / contain no-repeat;
    --merch-addon-checkbox-checked-bg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M14.4502 5.64453C14.1143 5.39844 13.6465 5.47363 13.4014 5.80664L8.86231 12.0042L7.19922 9.86328C6.94531 9.53711 6.47656 9.47754 6.14649 9.73047C5.81934 9.98535 5.75977 10.4561 6.01368 10.7832L8.28712 13.71C8.3047 13.7327 8.33131 13.7414 8.35108 13.7615C8.38062 13.7922 8.40088 13.8293 8.43653 13.8555C8.4629 13.8746 8.49268 13.8829 8.52051 13.8982C8.54444 13.9116 8.5669 13.9242 8.59229 13.9347C8.68531 13.9736 8.78125 14 8.87891 14C8.87915 14 8.87964 13.9998 8.87989 13.9998C8.88038 13.9998 8.88038 14 8.88087 14C8.98146 14 9.08058 13.9719 9.17579 13.9306C9.20265 13.919 9.22559 13.905 9.25099 13.8904C9.28029 13.8734 9.31227 13.864 9.33986 13.8428C9.37526 13.8152 9.39504 13.7771 9.42409 13.7449C9.44264 13.7246 9.46877 13.7159 9.48537 13.6933L14.6123 6.69335C14.8565 6.35937 14.7842 5.88965 14.4502 5.64453Z' fill='url(%23c)'/%3E%3Cpath d='M15.25 18H4.75C3.2334 18 2 16.7666 2 15.25V4.75C2 3.2334 3.2334 2 4.75 2H15.25C16.7666 2 18 3.2334 18 4.75V15.25C18 16.7666 16.7666 18 15.25 18ZM4.75 3.5C4.06055 3.5 3.5 4.06055 3.5 4.75V15.25C3.5 15.9395 4.06055 16.5 4.75 16.5H15.25C15.9395 16.5 16.5 15.9395 16.5 15.25V4.75C16.5 4.06055 15.9395 3.5 15.25 3.5H4.75Z' fill='url(%23b)'/%3E%3Cdefs%3E%3ClinearGradient id='c' x1='5.85624' y1='14' x2='13.849' y2='4.71759' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0.488' stop-color='%238D88F2'/%3E%3Cstop offset='1' stop-color='%23EB1000'/%3E%3C/linearGradient%3E%3ClinearGradient id='b' x1='2' y1='18' x2='17.1314' y2='1.2169' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0.488' stop-color='%238D88F2'/%3E%3Cstop offset='1' stop-color='%23EB1000'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E") center / contain;
    --merch-addon-checkbox-checked-bg-color: transparent;
    --merch-addon-checkbox-checked-color: transparent;
    --merch-addon-label-size: 14px;
    --merch-addon-label-line-height: 18px;
    --merch-addon-label-weight: 700;
    --merch-addon-label-color: var(--consonant-merch-card-bizpro-text-color);
}

/* Light-DOM color overrides \u2014 beat global promo/legal styling */
merch-card[variant="bizpro"] [slot="promo-text"] {
    color: var(--consonant-merch-card-bizpro-text-muted-color);
    font-family: var(--consonant-merch-card-bizpro-font-family-regular);
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0.14px;
    margin: 0;
}

/* Light-DOM typography for heading-xs / body-xs \u2014 must live here (not in
   shadow ::slotted) so it beats the global merch-card [slot="heading-xs"]
   rule. Per CSS Scoping, light-DOM rules outrank shadow ::slotted regardless
   of specificity, so the variant's slotted rules cannot win on their own. */
merch-card[variant="bizpro"] [slot="heading-xs"] {
    margin: 0;
    font-family: var(--consonant-merch-card-bizpro-font-family-display);
    font-weight: 900;
    font-size: 24px;
    line-height: 24px;
    letter-spacing: -0.48px;
    color: var(--consonant-merch-card-bizpro-text-color);
}

merch-card[variant="bizpro"] [slot="body-xs"] {
    margin: 0;
    font-family: var(--consonant-merch-card-bizpro-font-family-regular);
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0.14px;
    color: var(--consonant-merch-card-bizpro-text-color);
}

/* Title / description fields are RTE \u2014 authors may save <h3>Title</h3> or
   <div><p>desc</p></div>, which the AEM mapping then wraps again. Make any
   inner block descendant inherit the outer slot styles so the visible text
   uses the variant typography instead of UA defaults. */
merch-card[variant="bizpro"] [slot="heading-xs"] :is(h1, h2, h3, h4, h5, h6, p, div, span),
merch-card[variant="bizpro"] [slot="body-xs"] :is(h1, h2, h3, h4, h5, h6, p, div, span) {
    margin: 0;
    font: inherit;
    color: inherit;
    letter-spacing: inherit;
}

/* Rich whats-included styling: section title + bullet items + dividers */
merch-card[variant="bizpro"] [slot="whats-included"] {
    font-family: var(--consonant-merch-card-bizpro-font-family-regular);
}

/* The authored label only feeds the shadow-DOM toggle button text; never
   show it inside the features zone itself. */
merch-card[variant="bizpro"] [slot="whats-included"] .whats-included-label {
    display: none;
}

merch-card[variant="bizpro"] [slot="whats-included"] .section,
merch-card[variant="bizpro"] [slot="whats-included"] h4,
merch-card[variant="bizpro"] [slot="whats-included"] h5 {
    margin: 0;
}

/* Studio's preview pane defines a global \`.section\` style (padding:32px,
   border-radius:16px, box-shadow, background) for its own editor panels.
   That selector inadvertently matches authored \`<div class="section">\`
   blocks inside the whats-included slot, blowing out paddings and forcing
   list items to wrap. Reset visual chrome so the section behaves as a
   transparent grouping container, per Figma. */
merch-card[variant="bizpro"] [slot="whats-included"] .section {
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
}

merch-card[variant="bizpro"] [slot="whats-included"] h4 {
    /* Pin the body font explicitly: on consumer pages (Milo) a global \`h4\`
       rule sets Adobe Clean Display Black directly on the element, which beats
       the font-family inherited from the slot container above. Studio has no
       such rule, so the title only looked wrong off-Studio. */
    font-family: var(--consonant-merch-card-bizpro-font-family-regular);
    font-weight: 700;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0.14px;
    color: inherit;
    display: flex;
    align-items: center;
    gap: 4px;
}

merch-card[variant="bizpro"] [slot="whats-included"] ul {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

merch-card[variant="bizpro"] [slot="whats-included"] ul li {
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0.14px;
    color: var(--consonant-merch-card-bizpro-text-muted-color);
    padding: 0 20px;
}

merch-card[variant="bizpro"][border-color="black"] [slot="whats-included"] ul li {
    color: var(--consonant-merch-card-bizpro-text-inverse-color);
}

merch-card[variant="bizpro"] [slot="whats-included"] .section + .section {
    border-top: 1px solid var(--consonant-merch-card-bizpro-divider-color);
    padding-top: 16px;
}

/* Per Figma: the last section in a multi-section list uses 8px gap between title and items
   (the leading + middle sections stay at 12px). Single-section cards keep 12px. */
merch-card[variant="bizpro"] [slot="whats-included"] .section:not(:only-child):last-child ul {
    margin-top: 8px;
}

/* Section title icons: 20px on the first (lead) section, 16px on subsequent sections per Figma.
   Covers raw <svg> (curated registry), Spectrum <sp-icon-*> and <merch-icon> (standard picker).
   merch-icon sizes its shadow-DOM <img> from --mod-img-width/height (falling back to the
   size="xs" default of 20px), so a host width/height alone leaves the inner image at 20px and
   overflowing the box. Set the --mod-img-* custom properties too \u2014 they inherit across the shadow
   boundary and size the image to match. (svg/.sp-icon are light DOM and just use width/height.) */
merch-card[variant="bizpro"] [slot="whats-included"] .section h4 > svg,
merch-card[variant="bizpro"] [slot="whats-included"] .section h4 > .sp-icon,
merch-card[variant="bizpro"] [slot="whats-included"] .section h4 > merch-icon {
    width: 16px;
    height: 16px;
    --mod-img-width: 16px;
    --mod-img-height: 16px;
    flex: 0 0 auto;
    color: inherit;
}
merch-card[variant="bizpro"] [slot="whats-included"] .section:first-child h4 > svg,
merch-card[variant="bizpro"] [slot="whats-included"] .section:first-child h4 > .sp-icon,
merch-card[variant="bizpro"] [slot="whats-included"] .section:first-child h4 > merch-icon {
    width: 20px;
    height: 20px;
    --mod-img-width: 20px;
    --mod-img-height: 20px;
}

/* CTA styling \u2014 pill-shaped buttons, accent solid + outlined */
merch-card[variant="bizpro"] [slot="footer"] a,
merch-card[variant="bizpro"] [slot="footer"] button {
    flex: 1 0 0;
    min-width: 0;
    height: 40px;
    padding: 14px 24px;
    border-radius: 999px;
    font-family: var(--consonant-merch-card-bizpro-font-family-regular);
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
    white-space: nowrap;
}

merch-card[variant="bizpro"] [slot="footer"] .con-button.blue,
merch-card[variant="bizpro"] [slot="footer"] a.accent,
merch-card[variant="bizpro"] [slot="footer"] [data-button-type="accent"] {
    background: var(--consonant-merch-card-bizpro-cta-accent-color);
    color: var(--consonant-merch-card-bizpro-text-inverse-color);
    border: none;
}

merch-card[variant="bizpro"] [slot="footer"] .con-button.outline,
merch-card[variant="bizpro"] [slot="footer"] a.outline,
merch-card[variant="bizpro"] [slot="footer"] [data-button-type="primary"] {
    background: transparent;
    color: var(--consonant-merch-card-bizpro-text-color);
    border: 2px solid var(--consonant-merch-card-bizpro-text-color);
}

/* heading-m holds the price. inline-price cards are covered by the .price-span
   rules below; "free" cards author literal text ("Free") that has no .price spans,
   so style the slot itself to match the Figma price (18px/900, node 1114:39070)
   instead of falling through to the global heading-m default (24px/700/#2c2c2c). */
merch-card[variant="bizpro"] [slot="heading-m"],
merch-card[variant="bizpro"] [slot="heading-m"] > p {
    margin: 0;
    font-family: var(--consonant-merch-card-bizpro-font-family-display);
    font-weight: 900;
    font-size: 18px;
    line-height: 21px;
    letter-spacing: -0.48px;
    color: var(--consonant-merch-card-bizpro-text-color);
}

/* Price spans \u2014 individually styled per Figma */
merch-card[variant="bizpro"] [slot="heading-m"] .price,
merch-card[variant="bizpro"] [slot="heading-m"] .price-currency-symbol,
merch-card[variant="bizpro"] [slot="heading-m"] .price-integer,
merch-card[variant="bizpro"] [slot="heading-m"] .price-decimals-delimiter,
merch-card[variant="bizpro"] [slot="heading-m"] .price-decimals,
merch-card[variant="bizpro"] [slot="heading-m"] .price-recurrence {
    font-family: var(--consonant-merch-card-bizpro-font-family-display);
    font-weight: 900;
    font-size: 18px;
    line-height: 21px;
    letter-spacing: -0.48px;
    color: var(--consonant-merch-card-bizpro-text-color);
}

/* WCS recurrence dictionary returns abbreviations uppercased ("/MO");
   Figma's pricing typography presents it lowercase ("/mo"). */
merch-card[variant="bizpro"] [slot="heading-m"] .price-recurrence {
    text-transform: lowercase;
}

/* Plan type line ("Annual, billed monthly") \u2014 the legal-template price span,
   rendered when the Show Plan type setting is on. Its container carries the
   shared .price class, so this later rule overrides the 18px/900 price
   styling above with the muted body style (same look as promo-text, Figma
   1114:39070). Both the custom-element wrapper AND the inner .price container
   need display:block \u2014 the wrapper is inline-block by default, which would
   shrink-wrap the block container and keep it on the price's line. */
merch-card[variant="bizpro"] [slot="heading-m"] span[is="inline-price"][data-template="legal"],
merch-card[variant="bizpro"] [slot="heading-m"] .price.price-legal {
    display: block;
    font-family: var(--consonant-merch-card-bizpro-font-family-regular);
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0.14px;
    color: var(--consonant-merch-card-bizpro-text-muted-color);
}

/* Collection grid \u2014 C2 breakpoints only (768, 1280).
   - Mobile: single column, full width.
   - Tablet (\u2265768): 2-column grid for 2/3/4 cards.
   - Desktop (\u22651280): full column count.
   Cards stretch to equal height within a row (matches Figma row-equal layout)
   and widths flow fluidly via 1fr tracks. Container max-width caps growth so
   cards don't exceed the Figma xl (394px) width. */
merch-card-collection.plans:is(.one-merch-card, .two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="bizpro"]) {
    display: grid;
    gap: 8px;
    grid-template-columns: minmax(0, var(--consonant-merch-card-bizpro-max-width));
    justify-content: center;
    /* Cards stretch to equal height; the white .top-card is pinned to its
       (uniform) content height and the gray .features-zone grows to fill the
       rest, so the white tops AND the card bottoms both line up across the row
       (matches Figma). See .top-card / .features-zone flex in the shadow styles. */
    align-items: stretch;
    margin-inline: auto;
}

@media screen and ${T} {
    merch-card-collection.plans:is(.two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="bizpro"]) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        max-width: 720px;
    }
}

@media screen and ${xi} {
    merch-card-collection.plans:is(.three-merch-cards):has(merch-card[variant="bizpro"]) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        max-width: 1192px;
    }
    merch-card-collection.plans:is(.four-merch-cards):has(merch-card[variant="bizpro"]) {
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
    merch-card-collection.plans:has(merch-card[variant="bizpro"]):has(> merch-card:nth-of-type(2):last-of-type) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        max-width: calc(2 * var(--consonant-merch-card-bizpro-2up-max-width) + 12px);
    }
    merch-card-collection.plans:has(merch-card[variant="bizpro"]):has(> merch-card:nth-of-type(2):last-of-type) merch-card[variant="bizpro"] {
        max-width: var(--consonant-merch-card-bizpro-2up-max-width);
    }
}

@media screen and ${A} {
    merch-card[variant="bizpro"] {
        width: 100%;
        max-width: var(--consonant-merch-card-bizpro-max-width);
    }
}

`;var aa="tacocat.js";function Qe(e,r={},{metadata:t=!0,search:i=!0,storage:a=!0}={}){let n;if(i&&n==null){let o=new URLSearchParams(window.location.search),s=tr(i)?i:e;n=o.get(s)}if(a&&n==null){let o=tr(a)?a:e;n=window.sessionStorage.getItem(o)??window.localStorage.getItem(o)}if(t&&n==null){let o=oo(tr(t)?t:e);n=document.documentElement.querySelector(`meta[name="${o}"]`)?.content}return n??r[e]}var no=e=>typeof e=="boolean",rr=e=>typeof e=="function";var tr=e=>typeof e=="string";function St(e,r){if(no(e))return e;let t=String(e);return t==="1"||t==="true"?!0:t==="0"||t==="false"?!1:r}function oo(e=""){return String(e).replace(/(\p{Lowercase_Letter})(\p{Uppercase_Letter})/gu,(r,t,i)=>`${t}-${i}`).replace(/\W+/gu,"-").toLowerCase()}var so=Date.now(),Pr=()=>`(+${Date.now()-so}ms)`,ir=new Set,co=St(Qe("tacocat.debug",{},{metadata:!1}),!1);function na(e){let r=`[${aa}/${e}]`,t=(o,s,...c)=>o?!0:(a(s,...c),!1),i=co?(o,...s)=>{console.debug(`${r} ${o}`,...s,Pr())}:()=>{},a=(o,...s)=>{let c=`${r} ${o}`;ir.forEach(([l])=>l(c,...s))};return{assert:t,debug:i,error:a,warn:(o,...s)=>{let c=`${r} ${o}`;ir.forEach(([,l])=>l(c,...s))}}}function lo(e,r){let t=[e,r];return ir.add(t),()=>{ir.delete(t)}}lo((e,...r)=>{console.error(e,...r,Pr())},(e,...r)=>{console.warn(e,...r,Pr())});var zr=function(e,r){return zr=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,i){t.__proto__=i}||function(t,i){for(var a in i)Object.prototype.hasOwnProperty.call(i,a)&&(t[a]=i[a])},zr(e,r)};function Ct(e,r){if(typeof r!="function"&&r!==null)throw new TypeError("Class extends value "+String(r)+" is not a constructor or null");zr(e,r);function t(){this.constructor=e}e.prototype=r===null?Object.create(r):(t.prototype=r.prototype,new t)}var E=function(){return E=Object.assign||function(r){for(var t,i=1,a=arguments.length;i<a;i++){t=arguments[i];for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(r[n]=t[n])}return r},E.apply(this,arguments)};function ar(e,r,t){if(t||arguments.length===2)for(var i=0,a=r.length,n;i<a;i++)(n||!(i in r))&&(n||(n=Array.prototype.slice.call(r,0,i)),n[i]=r[i]);return e.concat(n||Array.prototype.slice.call(r))}var v;(function(e){e[e.EXPECT_ARGUMENT_CLOSING_BRACE=1]="EXPECT_ARGUMENT_CLOSING_BRACE",e[e.EMPTY_ARGUMENT=2]="EMPTY_ARGUMENT",e[e.MALFORMED_ARGUMENT=3]="MALFORMED_ARGUMENT",e[e.EXPECT_ARGUMENT_TYPE=4]="EXPECT_ARGUMENT_TYPE",e[e.INVALID_ARGUMENT_TYPE=5]="INVALID_ARGUMENT_TYPE",e[e.EXPECT_ARGUMENT_STYLE=6]="EXPECT_ARGUMENT_STYLE",e[e.INVALID_NUMBER_SKELETON=7]="INVALID_NUMBER_SKELETON",e[e.INVALID_DATE_TIME_SKELETON=8]="INVALID_DATE_TIME_SKELETON",e[e.EXPECT_NUMBER_SKELETON=9]="EXPECT_NUMBER_SKELETON",e[e.EXPECT_DATE_TIME_SKELETON=10]="EXPECT_DATE_TIME_SKELETON",e[e.UNCLOSED_QUOTE_IN_ARGUMENT_STYLE=11]="UNCLOSED_QUOTE_IN_ARGUMENT_STYLE",e[e.EXPECT_SELECT_ARGUMENT_OPTIONS=12]="EXPECT_SELECT_ARGUMENT_OPTIONS",e[e.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE=13]="EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE",e[e.INVALID_PLURAL_ARGUMENT_OFFSET_VALUE=14]="INVALID_PLURAL_ARGUMENT_OFFSET_VALUE",e[e.EXPECT_SELECT_ARGUMENT_SELECTOR=15]="EXPECT_SELECT_ARGUMENT_SELECTOR",e[e.EXPECT_PLURAL_ARGUMENT_SELECTOR=16]="EXPECT_PLURAL_ARGUMENT_SELECTOR",e[e.EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT=17]="EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT",e[e.EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT=18]="EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT",e[e.INVALID_PLURAL_ARGUMENT_SELECTOR=19]="INVALID_PLURAL_ARGUMENT_SELECTOR",e[e.DUPLICATE_PLURAL_ARGUMENT_SELECTOR=20]="DUPLICATE_PLURAL_ARGUMENT_SELECTOR",e[e.DUPLICATE_SELECT_ARGUMENT_SELECTOR=21]="DUPLICATE_SELECT_ARGUMENT_SELECTOR",e[e.MISSING_OTHER_CLAUSE=22]="MISSING_OTHER_CLAUSE",e[e.INVALID_TAG=23]="INVALID_TAG",e[e.INVALID_TAG_NAME=25]="INVALID_TAG_NAME",e[e.UNMATCHED_CLOSING_TAG=26]="UNMATCHED_CLOSING_TAG",e[e.UNCLOSED_TAG=27]="UNCLOSED_TAG"})(v||(v={}));var k;(function(e){e[e.literal=0]="literal",e[e.argument=1]="argument",e[e.number=2]="number",e[e.date=3]="date",e[e.time=4]="time",e[e.select=5]="select",e[e.plural=6]="plural",e[e.pound=7]="pound",e[e.tag=8]="tag"})(k||(k={}));var Le;(function(e){e[e.number=0]="number",e[e.dateTime=1]="dateTime"})(Le||(Le={}));function Mr(e){return e.type===k.literal}function oa(e){return e.type===k.argument}function nr(e){return e.type===k.number}function or(e){return e.type===k.date}function sr(e){return e.type===k.time}function cr(e){return e.type===k.select}function lr(e){return e.type===k.plural}function sa(e){return e.type===k.pound}function dr(e){return e.type===k.tag}function hr(e){return!!(e&&typeof e=="object"&&e.type===Le.number)}function At(e){return!!(e&&typeof e=="object"&&e.type===Le.dateTime)}var Rr=/[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/;var ho=/(?:[Eec]{1,6}|G{1,5}|[Qq]{1,5}|(?:[yYur]+|U{1,5})|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHK]{1,2}|w{1,2}|W{1}|m{1,2}|s{1,2}|[zZOvVxX]{1,4})(?=([^']*'[^']*')*[^']*$)/g;function ca(e){var r={};return e.replace(ho,function(t){var i=t.length;switch(t[0]){case"G":r.era=i===4?"long":i===5?"narrow":"short";break;case"y":r.year=i===2?"2-digit":"numeric";break;case"Y":case"u":case"U":case"r":throw new RangeError("`Y/u/U/r` (year) patterns are not supported, use `y` instead");case"q":case"Q":throw new RangeError("`q/Q` (quarter) patterns are not supported");case"M":case"L":r.month=["numeric","2-digit","short","long","narrow"][i-1];break;case"w":case"W":throw new RangeError("`w/W` (week) patterns are not supported");case"d":r.day=["numeric","2-digit"][i-1];break;case"D":case"F":case"g":throw new RangeError("`D/F/g` (day) patterns are not supported, use `d` instead");case"E":r.weekday=i===4?"short":i===5?"narrow":"short";break;case"e":if(i<4)throw new RangeError("`e..eee` (weekday) patterns are not supported");r.weekday=["short","long","narrow","short"][i-4];break;case"c":if(i<4)throw new RangeError("`c..ccc` (weekday) patterns are not supported");r.weekday=["short","long","narrow","short"][i-4];break;case"a":r.hour12=!0;break;case"b":case"B":throw new RangeError("`b/B` (period) patterns are not supported, use `a` instead");case"h":r.hourCycle="h12",r.hour=["numeric","2-digit"][i-1];break;case"H":r.hourCycle="h23",r.hour=["numeric","2-digit"][i-1];break;case"K":r.hourCycle="h11",r.hour=["numeric","2-digit"][i-1];break;case"k":r.hourCycle="h24",r.hour=["numeric","2-digit"][i-1];break;case"j":case"J":case"C":throw new RangeError("`j/J/C` (hour) patterns are not supported, use `h/H/K/k` instead");case"m":r.minute=["numeric","2-digit"][i-1];break;case"s":r.second=["numeric","2-digit"][i-1];break;case"S":case"A":throw new RangeError("`S/A` (second) patterns are not supported, use `s` instead");case"z":r.timeZoneName=i<4?"short":"long";break;case"Z":case"O":case"v":case"V":case"X":case"x":throw new RangeError("`Z/O/v/V/X/x` (timeZone) patterns are not supported, use `z` instead")}return""}),r}var la=/[\t-\r \x85\u200E\u200F\u2028\u2029]/i;function ma(e){if(e.length===0)throw new Error("Number skeleton cannot be empty");for(var r=e.split(la).filter(function(m){return m.length>0}),t=[],i=0,a=r;i<a.length;i++){var n=a[i],o=n.split("/");if(o.length===0)throw new Error("Invalid number skeleton");for(var s=o[0],c=o.slice(1),l=0,h=c;l<h.length;l++){var u=h[l];if(u.length===0)throw new Error("Invalid number skeleton")}t.push({stem:s,options:c})}return t}function po(e){return e.replace(/^(.*?)-/,"")}var da=/^\.(?:(0+)(\*)?|(#+)|(0+)(#+))$/g,ua=/^(@+)?(\+|#+)?[rs]?$/g,mo=/(\*)(0+)|(#+)(0+)|(0+)/g,ga=/^(0+)$/;function ha(e){var r={};return e[e.length-1]==="r"?r.roundingPriority="morePrecision":e[e.length-1]==="s"&&(r.roundingPriority="lessPrecision"),e.replace(ua,function(t,i,a){return typeof a!="string"?(r.minimumSignificantDigits=i.length,r.maximumSignificantDigits=i.length):a==="+"?r.minimumSignificantDigits=i.length:i[0]==="#"?r.maximumSignificantDigits=i.length:(r.minimumSignificantDigits=i.length,r.maximumSignificantDigits=i.length+(typeof a=="string"?a.length:0)),""}),r}function fa(e){switch(e){case"sign-auto":return{signDisplay:"auto"};case"sign-accounting":case"()":return{currencySign:"accounting"};case"sign-always":case"+!":return{signDisplay:"always"};case"sign-accounting-always":case"()!":return{signDisplay:"always",currencySign:"accounting"};case"sign-except-zero":case"+?":return{signDisplay:"exceptZero"};case"sign-accounting-except-zero":case"()?":return{signDisplay:"exceptZero",currencySign:"accounting"};case"sign-never":case"+_":return{signDisplay:"never"}}}function uo(e){var r;if(e[0]==="E"&&e[1]==="E"?(r={notation:"engineering"},e=e.slice(2)):e[0]==="E"&&(r={notation:"scientific"},e=e.slice(1)),r){var t=e.slice(0,2);if(t==="+!"?(r.signDisplay="always",e=e.slice(2)):t==="+?"&&(r.signDisplay="exceptZero",e=e.slice(2)),!ga.test(e))throw new Error("Malformed concise eng/scientific notation");r.minimumIntegerDigits=e.length}return r}function pa(e){var r={},t=fa(e);return t||r}function ba(e){for(var r={},t=0,i=e;t<i.length;t++){var a=i[t];switch(a.stem){case"percent":case"%":r.style="percent";continue;case"%x100":r.style="percent",r.scale=100;continue;case"currency":r.style="currency",r.currency=a.options[0];continue;case"group-off":case",_":r.useGrouping=!1;continue;case"precision-integer":case".":r.maximumFractionDigits=0;continue;case"measure-unit":case"unit":r.style="unit",r.unit=po(a.options[0]);continue;case"compact-short":case"K":r.notation="compact",r.compactDisplay="short";continue;case"compact-long":case"KK":r.notation="compact",r.compactDisplay="long";continue;case"scientific":r=E(E(E({},r),{notation:"scientific"}),a.options.reduce(function(c,l){return E(E({},c),pa(l))},{}));continue;case"engineering":r=E(E(E({},r),{notation:"engineering"}),a.options.reduce(function(c,l){return E(E({},c),pa(l))},{}));continue;case"notation-simple":r.notation="standard";continue;case"unit-width-narrow":r.currencyDisplay="narrowSymbol",r.unitDisplay="narrow";continue;case"unit-width-short":r.currencyDisplay="code",r.unitDisplay="short";continue;case"unit-width-full-name":r.currencyDisplay="name",r.unitDisplay="long";continue;case"unit-width-iso-code":r.currencyDisplay="symbol";continue;case"scale":r.scale=parseFloat(a.options[0]);continue;case"integer-width":if(a.options.length>1)throw new RangeError("integer-width stems only accept a single optional option");a.options[0].replace(mo,function(c,l,h,u,m,b){if(l)r.minimumIntegerDigits=h.length;else{if(u&&m)throw new Error("We currently do not support maximum integer digits");if(b)throw new Error("We currently do not support exact integer digits")}return""});continue}if(ga.test(a.stem)){r.minimumIntegerDigits=a.stem.length;continue}if(da.test(a.stem)){if(a.options.length>1)throw new RangeError("Fraction-precision stems only accept a single optional option");a.stem.replace(da,function(c,l,h,u,m,b){return h==="*"?r.minimumFractionDigits=l.length:u&&u[0]==="#"?r.maximumFractionDigits=u.length:m&&b?(r.minimumFractionDigits=m.length,r.maximumFractionDigits=m.length+b.length):(r.minimumFractionDigits=l.length,r.maximumFractionDigits=l.length),""});var n=a.options[0];n==="w"?r=E(E({},r),{trailingZeroDisplay:"stripIfInteger"}):n&&(r=E(E({},r),ha(n)));continue}if(ua.test(a.stem)){r=E(E({},r),ha(a.stem));continue}var o=fa(a.stem);o&&(r=E(E({},r),o));var s=uo(a.stem);s&&(r=E(E({},r),s))}return r}var Tt={AX:["H"],BQ:["H"],CP:["H"],CZ:["H"],DK:["H"],FI:["H"],ID:["H"],IS:["H"],ML:["H"],NE:["H"],RU:["H"],SE:["H"],SJ:["H"],SK:["H"],AS:["h","H"],BT:["h","H"],DJ:["h","H"],ER:["h","H"],GH:["h","H"],IN:["h","H"],LS:["h","H"],PG:["h","H"],PW:["h","H"],SO:["h","H"],TO:["h","H"],VU:["h","H"],WS:["h","H"],"001":["H","h"],AL:["h","H","hB"],TD:["h","H","hB"],"ca-ES":["H","h","hB"],CF:["H","h","hB"],CM:["H","h","hB"],"fr-CA":["H","h","hB"],"gl-ES":["H","h","hB"],"it-CH":["H","h","hB"],"it-IT":["H","h","hB"],LU:["H","h","hB"],NP:["H","h","hB"],PF:["H","h","hB"],SC:["H","h","hB"],SM:["H","h","hB"],SN:["H","h","hB"],TF:["H","h","hB"],VA:["H","h","hB"],CY:["h","H","hb","hB"],GR:["h","H","hb","hB"],CO:["h","H","hB","hb"],DO:["h","H","hB","hb"],KP:["h","H","hB","hb"],KR:["h","H","hB","hb"],NA:["h","H","hB","hb"],PA:["h","H","hB","hb"],PR:["h","H","hB","hb"],VE:["h","H","hB","hb"],AC:["H","h","hb","hB"],AI:["H","h","hb","hB"],BW:["H","h","hb","hB"],BZ:["H","h","hb","hB"],CC:["H","h","hb","hB"],CK:["H","h","hb","hB"],CX:["H","h","hb","hB"],DG:["H","h","hb","hB"],FK:["H","h","hb","hB"],GB:["H","h","hb","hB"],GG:["H","h","hb","hB"],GI:["H","h","hb","hB"],IE:["H","h","hb","hB"],IM:["H","h","hb","hB"],IO:["H","h","hb","hB"],JE:["H","h","hb","hB"],LT:["H","h","hb","hB"],MK:["H","h","hb","hB"],MN:["H","h","hb","hB"],MS:["H","h","hb","hB"],NF:["H","h","hb","hB"],NG:["H","h","hb","hB"],NR:["H","h","hb","hB"],NU:["H","h","hb","hB"],PN:["H","h","hb","hB"],SH:["H","h","hb","hB"],SX:["H","h","hb","hB"],TA:["H","h","hb","hB"],ZA:["H","h","hb","hB"],"af-ZA":["H","h","hB","hb"],AR:["H","h","hB","hb"],CL:["H","h","hB","hb"],CR:["H","h","hB","hb"],CU:["H","h","hB","hb"],EA:["H","h","hB","hb"],"es-BO":["H","h","hB","hb"],"es-BR":["H","h","hB","hb"],"es-EC":["H","h","hB","hb"],"es-ES":["H","h","hB","hb"],"es-GQ":["H","h","hB","hb"],"es-PE":["H","h","hB","hb"],GT:["H","h","hB","hb"],HN:["H","h","hB","hb"],IC:["H","h","hB","hb"],KG:["H","h","hB","hb"],KM:["H","h","hB","hb"],LK:["H","h","hB","hb"],MA:["H","h","hB","hb"],MX:["H","h","hB","hb"],NI:["H","h","hB","hb"],PY:["H","h","hB","hb"],SV:["H","h","hB","hb"],UY:["H","h","hB","hb"],JP:["H","h","K"],AD:["H","hB"],AM:["H","hB"],AO:["H","hB"],AT:["H","hB"],AW:["H","hB"],BE:["H","hB"],BF:["H","hB"],BJ:["H","hB"],BL:["H","hB"],BR:["H","hB"],CG:["H","hB"],CI:["H","hB"],CV:["H","hB"],DE:["H","hB"],EE:["H","hB"],FR:["H","hB"],GA:["H","hB"],GF:["H","hB"],GN:["H","hB"],GP:["H","hB"],GW:["H","hB"],HR:["H","hB"],IL:["H","hB"],IT:["H","hB"],KZ:["H","hB"],MC:["H","hB"],MD:["H","hB"],MF:["H","hB"],MQ:["H","hB"],MZ:["H","hB"],NC:["H","hB"],NL:["H","hB"],PM:["H","hB"],PT:["H","hB"],RE:["H","hB"],RO:["H","hB"],SI:["H","hB"],SR:["H","hB"],ST:["H","hB"],TG:["H","hB"],TR:["H","hB"],WF:["H","hB"],YT:["H","hB"],BD:["h","hB","H"],PK:["h","hB","H"],AZ:["H","hB","h"],BA:["H","hB","h"],BG:["H","hB","h"],CH:["H","hB","h"],GE:["H","hB","h"],LI:["H","hB","h"],ME:["H","hB","h"],RS:["H","hB","h"],UA:["H","hB","h"],UZ:["H","hB","h"],XK:["H","hB","h"],AG:["h","hb","H","hB"],AU:["h","hb","H","hB"],BB:["h","hb","H","hB"],BM:["h","hb","H","hB"],BS:["h","hb","H","hB"],CA:["h","hb","H","hB"],DM:["h","hb","H","hB"],"en-001":["h","hb","H","hB"],FJ:["h","hb","H","hB"],FM:["h","hb","H","hB"],GD:["h","hb","H","hB"],GM:["h","hb","H","hB"],GU:["h","hb","H","hB"],GY:["h","hb","H","hB"],JM:["h","hb","H","hB"],KI:["h","hb","H","hB"],KN:["h","hb","H","hB"],KY:["h","hb","H","hB"],LC:["h","hb","H","hB"],LR:["h","hb","H","hB"],MH:["h","hb","H","hB"],MP:["h","hb","H","hB"],MW:["h","hb","H","hB"],NZ:["h","hb","H","hB"],SB:["h","hb","H","hB"],SG:["h","hb","H","hB"],SL:["h","hb","H","hB"],SS:["h","hb","H","hB"],SZ:["h","hb","H","hB"],TC:["h","hb","H","hB"],TT:["h","hb","H","hB"],UM:["h","hb","H","hB"],US:["h","hb","H","hB"],VC:["h","hb","H","hB"],VG:["h","hb","H","hB"],VI:["h","hb","H","hB"],ZM:["h","hb","H","hB"],BO:["H","hB","h","hb"],EC:["H","hB","h","hb"],ES:["H","hB","h","hb"],GQ:["H","hB","h","hb"],PE:["H","hB","h","hb"],AE:["h","hB","hb","H"],"ar-001":["h","hB","hb","H"],BH:["h","hB","hb","H"],DZ:["h","hB","hb","H"],EG:["h","hB","hb","H"],EH:["h","hB","hb","H"],HK:["h","hB","hb","H"],IQ:["h","hB","hb","H"],JO:["h","hB","hb","H"],KW:["h","hB","hb","H"],LB:["h","hB","hb","H"],LY:["h","hB","hb","H"],MO:["h","hB","hb","H"],MR:["h","hB","hb","H"],OM:["h","hB","hb","H"],PH:["h","hB","hb","H"],PS:["h","hB","hb","H"],QA:["h","hB","hb","H"],SA:["h","hB","hb","H"],SD:["h","hB","hb","H"],SY:["h","hB","hb","H"],TN:["h","hB","hb","H"],YE:["h","hB","hb","H"],AF:["H","hb","hB","h"],LA:["H","hb","hB","h"],CN:["H","hB","hb","h"],LV:["H","hB","hb","h"],TL:["H","hB","hb","h"],"zu-ZA":["H","hB","hb","h"],CD:["hB","H"],IR:["hB","H"],"hi-IN":["hB","h","H"],"kn-IN":["hB","h","H"],"ml-IN":["hB","h","H"],"te-IN":["hB","h","H"],KH:["hB","h","H","hb"],"ta-IN":["hB","h","hb","H"],BN:["hb","hB","h","H"],MY:["hb","hB","h","H"],ET:["hB","hb","h","H"],"gu-IN":["hB","hb","h","H"],"mr-IN":["hB","hb","h","H"],"pa-IN":["hB","hb","h","H"],TW:["hB","hb","h","H"],KE:["hB","hb","H","h"],MM:["hB","hb","H","h"],TZ:["hB","hb","H","h"],UG:["hB","hb","H","h"]};function xa(e,r){for(var t="",i=0;i<e.length;i++){var a=e.charAt(i);if(a==="j"){for(var n=0;i+1<e.length&&e.charAt(i+1)===a;)n++,i++;var o=1+(n&1),s=n<2?1:3+(n>>1),c="a",l=go(r);for((l=="H"||l=="k")&&(s=0);s-- >0;)t+=c;for(;o-- >0;)t=l+t}else a==="J"?t+="H":t+=a}return t}function go(e){var r=e.hourCycle;if(r===void 0&&e.hourCycles&&e.hourCycles.length&&(r=e.hourCycles[0]),r)switch(r){case"h24":return"k";case"h23":return"H";case"h12":return"h";case"h11":return"K";default:throw new Error("Invalid hourCycle")}var t=e.language,i;t!=="root"&&(i=e.maximize().region);var a=Tt[i||""]||Tt[t||""]||Tt["".concat(t,"-001")]||Tt["001"];return a[0]}var Nr,fo=new RegExp("^".concat(Rr.source,"*")),bo=new RegExp("".concat(Rr.source,"*$"));function S(e,r){return{start:e,end:r}}var xo=!!String.prototype.startsWith,vo=!!String.fromCodePoint,yo=!!Object.fromEntries,wo=!!String.prototype.codePointAt,Eo=!!String.prototype.trimStart,So=!!String.prototype.trimEnd,Co=!!Number.isSafeInteger,Ao=Co?Number.isSafeInteger:function(e){return typeof e=="number"&&isFinite(e)&&Math.floor(e)===e&&Math.abs(e)<=9007199254740991},Ir=!0;try{va=Sa("([^\\p{White_Space}\\p{Pattern_Syntax}]*)","yu"),Ir=((Nr=va.exec("a"))===null||Nr===void 0?void 0:Nr[0])==="a"}catch{Ir=!1}var va,ya=xo?function(r,t,i){return r.startsWith(t,i)}:function(r,t,i){return r.slice(i,i+t.length)===t},Dr=vo?String.fromCodePoint:function(){for(var r=[],t=0;t<arguments.length;t++)r[t]=arguments[t];for(var i="",a=r.length,n=0,o;a>n;){if(o=r[n++],o>1114111)throw RangeError(o+" is not a valid code point");i+=o<65536?String.fromCharCode(o):String.fromCharCode(((o-=65536)>>10)+55296,o%1024+56320)}return i},wa=yo?Object.fromEntries:function(r){for(var t={},i=0,a=r;i<a.length;i++){var n=a[i],o=n[0],s=n[1];t[o]=s}return t},Ea=wo?function(r,t){return r.codePointAt(t)}:function(r,t){var i=r.length;if(!(t<0||t>=i)){var a=r.charCodeAt(t),n;return a<55296||a>56319||t+1===i||(n=r.charCodeAt(t+1))<56320||n>57343?a:(a-55296<<10)+(n-56320)+65536}},To=Eo?function(r){return r.trimStart()}:function(r){return r.replace(fo,"")},ko=So?function(r){return r.trimEnd()}:function(r){return r.replace(bo,"")};function Sa(e,r){return new RegExp(e,r)}var Br;Ir?(Or=Sa("([^\\p{White_Space}\\p{Pattern_Syntax}]*)","yu"),Br=function(r,t){var i;Or.lastIndex=t;var a=Or.exec(r);return(i=a[1])!==null&&i!==void 0?i:""}):Br=function(r,t){for(var i=[];;){var a=Ea(r,t);if(a===void 0||Aa(a)||Po(a))break;i.push(a),t+=a>=65536?2:1}return Dr.apply(void 0,i)};var Or,Ca=function(){function e(r,t){t===void 0&&(t={}),this.message=r,this.position={offset:0,line:1,column:1},this.ignoreTag=!!t.ignoreTag,this.locale=t.locale,this.requiresOtherClause=!!t.requiresOtherClause,this.shouldParseSkeletons=!!t.shouldParseSkeletons}return e.prototype.parse=function(){if(this.offset()!==0)throw Error("parser can only be used once");return this.parseMessage(0,"",!1)},e.prototype.parseMessage=function(r,t,i){for(var a=[];!this.isEOF();){var n=this.char();if(n===123){var o=this.parseArgument(r,i);if(o.err)return o;a.push(o.val)}else{if(n===125&&r>0)break;if(n===35&&(t==="plural"||t==="selectordinal")){var s=this.clonePosition();this.bump(),a.push({type:k.pound,location:S(s,this.clonePosition())})}else if(n===60&&!this.ignoreTag&&this.peek()===47){if(i)break;return this.error(v.UNMATCHED_CLOSING_TAG,S(this.clonePosition(),this.clonePosition()))}else if(n===60&&!this.ignoreTag&&Hr(this.peek()||0)){var o=this.parseTag(r,t);if(o.err)return o;a.push(o.val)}else{var o=this.parseLiteral(r,t);if(o.err)return o;a.push(o.val)}}}return{val:a,err:null}},e.prototype.parseTag=function(r,t){var i=this.clonePosition();this.bump();var a=this.parseTagName();if(this.bumpSpace(),this.bumpIf("/>"))return{val:{type:k.literal,value:"<".concat(a,"/>"),location:S(i,this.clonePosition())},err:null};if(this.bumpIf(">")){var n=this.parseMessage(r+1,t,!0);if(n.err)return n;var o=n.val,s=this.clonePosition();if(this.bumpIf("</")){if(this.isEOF()||!Hr(this.char()))return this.error(v.INVALID_TAG,S(s,this.clonePosition()));var c=this.clonePosition(),l=this.parseTagName();return a!==l?this.error(v.UNMATCHED_CLOSING_TAG,S(c,this.clonePosition())):(this.bumpSpace(),this.bumpIf(">")?{val:{type:k.tag,value:a,children:o,location:S(i,this.clonePosition())},err:null}:this.error(v.INVALID_TAG,S(s,this.clonePosition())))}else return this.error(v.UNCLOSED_TAG,S(i,this.clonePosition()))}else return this.error(v.INVALID_TAG,S(i,this.clonePosition()))},e.prototype.parseTagName=function(){var r=this.offset();for(this.bump();!this.isEOF()&&_o(this.char());)this.bump();return this.message.slice(r,this.offset())},e.prototype.parseLiteral=function(r,t){for(var i=this.clonePosition(),a="";;){var n=this.tryParseQuote(t);if(n){a+=n;continue}var o=this.tryParseUnquoted(r,t);if(o){a+=o;continue}var s=this.tryParseLeftAngleBracket();if(s){a+=s;continue}break}var c=S(i,this.clonePosition());return{val:{type:k.literal,value:a,location:c},err:null}},e.prototype.tryParseLeftAngleBracket=function(){return!this.isEOF()&&this.char()===60&&(this.ignoreTag||!Lo(this.peek()||0))?(this.bump(),"<"):null},e.prototype.tryParseQuote=function(r){if(this.isEOF()||this.char()!==39)return null;switch(this.peek()){case 39:return this.bump(),this.bump(),"'";case 123:case 60:case 62:case 125:break;case 35:if(r==="plural"||r==="selectordinal")break;return null;default:return null}this.bump();var t=[this.char()];for(this.bump();!this.isEOF();){var i=this.char();if(i===39)if(this.peek()===39)t.push(39),this.bump();else{this.bump();break}else t.push(i);this.bump()}return Dr.apply(void 0,t)},e.prototype.tryParseUnquoted=function(r,t){if(this.isEOF())return null;var i=this.char();return i===60||i===123||i===35&&(t==="plural"||t==="selectordinal")||i===125&&r>0?null:(this.bump(),Dr(i))},e.prototype.parseArgument=function(r,t){var i=this.clonePosition();if(this.bump(),this.bumpSpace(),this.isEOF())return this.error(v.EXPECT_ARGUMENT_CLOSING_BRACE,S(i,this.clonePosition()));if(this.char()===125)return this.bump(),this.error(v.EMPTY_ARGUMENT,S(i,this.clonePosition()));var a=this.parseIdentifierIfPossible().value;if(!a)return this.error(v.MALFORMED_ARGUMENT,S(i,this.clonePosition()));if(this.bumpSpace(),this.isEOF())return this.error(v.EXPECT_ARGUMENT_CLOSING_BRACE,S(i,this.clonePosition()));switch(this.char()){case 125:return this.bump(),{val:{type:k.argument,value:a,location:S(i,this.clonePosition())},err:null};case 44:return this.bump(),this.bumpSpace(),this.isEOF()?this.error(v.EXPECT_ARGUMENT_CLOSING_BRACE,S(i,this.clonePosition())):this.parseArgumentOptions(r,t,a,i);default:return this.error(v.MALFORMED_ARGUMENT,S(i,this.clonePosition()))}},e.prototype.parseIdentifierIfPossible=function(){var r=this.clonePosition(),t=this.offset(),i=Br(this.message,t),a=t+i.length;this.bumpTo(a);var n=this.clonePosition(),o=S(r,n);return{value:i,location:o}},e.prototype.parseArgumentOptions=function(r,t,i,a){var n,o=this.clonePosition(),s=this.parseIdentifierIfPossible().value,c=this.clonePosition();switch(s){case"":return this.error(v.EXPECT_ARGUMENT_TYPE,S(o,c));case"number":case"date":case"time":{this.bumpSpace();var l=null;if(this.bumpIf(",")){this.bumpSpace();var h=this.clonePosition(),u=this.parseSimpleArgStyleIfPossible();if(u.err)return u;var m=ko(u.val);if(m.length===0)return this.error(v.EXPECT_ARGUMENT_STYLE,S(this.clonePosition(),this.clonePosition()));var b=S(h,this.clonePosition());l={style:m,styleLocation:b}}var L=this.tryParseArgumentClose(a);if(L.err)return L;var M=S(a,this.clonePosition());if(l&&ya(l?.style,"::",0)){var V=To(l.style.slice(2));if(s==="number"){var u=this.parseNumberSkeletonFromString(V,l.styleLocation);return u.err?u:{val:{type:k.number,value:i,location:M,style:u.val},err:null}}else{if(V.length===0)return this.error(v.EXPECT_DATE_TIME_SKELETON,M);var J=V;this.locale&&(J=xa(V,this.locale));var m={type:Le.dateTime,pattern:J,location:l.styleLocation,parsedOptions:this.shouldParseSkeletons?ca(J):{}},X=s==="date"?k.date:k.time;return{val:{type:X,value:i,location:M,style:m},err:null}}}return{val:{type:s==="number"?k.number:s==="date"?k.date:k.time,value:i,location:M,style:(n=l?.style)!==null&&n!==void 0?n:null},err:null}}case"plural":case"selectordinal":case"select":{var H=this.clonePosition();if(this.bumpSpace(),!this.bumpIf(","))return this.error(v.EXPECT_SELECT_ARGUMENT_OPTIONS,S(H,E({},H)));this.bumpSpace();var Se=this.parseIdentifierIfPossible(),se=0;if(s!=="select"&&Se.value==="offset"){if(!this.bumpIf(":"))return this.error(v.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE,S(this.clonePosition(),this.clonePosition()));this.bumpSpace();var u=this.tryParseDecimalInteger(v.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE,v.INVALID_PLURAL_ARGUMENT_OFFSET_VALUE);if(u.err)return u;this.bumpSpace(),Se=this.parseIdentifierIfPossible(),se=u.val}var Be=this.tryParsePluralOrSelectOptions(r,s,t,Se);if(Be.err)return Be;var L=this.tryParseArgumentClose(a);if(L.err)return L;var ui=S(a,this.clonePosition());return s==="select"?{val:{type:k.select,value:i,options:wa(Be.val),location:ui},err:null}:{val:{type:k.plural,value:i,options:wa(Be.val),offset:se,pluralType:s==="plural"?"cardinal":"ordinal",location:ui},err:null}}default:return this.error(v.INVALID_ARGUMENT_TYPE,S(o,c))}},e.prototype.tryParseArgumentClose=function(r){return this.isEOF()||this.char()!==125?this.error(v.EXPECT_ARGUMENT_CLOSING_BRACE,S(r,this.clonePosition())):(this.bump(),{val:!0,err:null})},e.prototype.parseSimpleArgStyleIfPossible=function(){for(var r=0,t=this.clonePosition();!this.isEOF();){var i=this.char();switch(i){case 39:{this.bump();var a=this.clonePosition();if(!this.bumpUntil("'"))return this.error(v.UNCLOSED_QUOTE_IN_ARGUMENT_STYLE,S(a,this.clonePosition()));this.bump();break}case 123:{r+=1,this.bump();break}case 125:{if(r>0)r-=1;else return{val:this.message.slice(t.offset,this.offset()),err:null};break}default:this.bump();break}}return{val:this.message.slice(t.offset,this.offset()),err:null}},e.prototype.parseNumberSkeletonFromString=function(r,t){var i=[];try{i=ma(r)}catch{return this.error(v.INVALID_NUMBER_SKELETON,t)}return{val:{type:Le.number,tokens:i,location:t,parsedOptions:this.shouldParseSkeletons?ba(i):{}},err:null}},e.prototype.tryParsePluralOrSelectOptions=function(r,t,i,a){for(var n,o=!1,s=[],c=new Set,l=a.value,h=a.location;;){if(l.length===0){var u=this.clonePosition();if(t!=="select"&&this.bumpIf("=")){var m=this.tryParseDecimalInteger(v.EXPECT_PLURAL_ARGUMENT_SELECTOR,v.INVALID_PLURAL_ARGUMENT_SELECTOR);if(m.err)return m;h=S(u,this.clonePosition()),l=this.message.slice(u.offset,this.offset())}else break}if(c.has(l))return this.error(t==="select"?v.DUPLICATE_SELECT_ARGUMENT_SELECTOR:v.DUPLICATE_PLURAL_ARGUMENT_SELECTOR,h);l==="other"&&(o=!0),this.bumpSpace();var b=this.clonePosition();if(!this.bumpIf("{"))return this.error(t==="select"?v.EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT:v.EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT,S(this.clonePosition(),this.clonePosition()));var L=this.parseMessage(r+1,t,i);if(L.err)return L;var M=this.tryParseArgumentClose(b);if(M.err)return M;s.push([l,{value:L.val,location:S(b,this.clonePosition())}]),c.add(l),this.bumpSpace(),n=this.parseIdentifierIfPossible(),l=n.value,h=n.location}return s.length===0?this.error(t==="select"?v.EXPECT_SELECT_ARGUMENT_SELECTOR:v.EXPECT_PLURAL_ARGUMENT_SELECTOR,S(this.clonePosition(),this.clonePosition())):this.requiresOtherClause&&!o?this.error(v.MISSING_OTHER_CLAUSE,S(this.clonePosition(),this.clonePosition())):{val:s,err:null}},e.prototype.tryParseDecimalInteger=function(r,t){var i=1,a=this.clonePosition();this.bumpIf("+")||this.bumpIf("-")&&(i=-1);for(var n=!1,o=0;!this.isEOF();){var s=this.char();if(s>=48&&s<=57)n=!0,o=o*10+(s-48),this.bump();else break}var c=S(a,this.clonePosition());return n?(o*=i,Ao(o)?{val:o,err:null}:this.error(t,c)):this.error(r,c)},e.prototype.offset=function(){return this.position.offset},e.prototype.isEOF=function(){return this.offset()===this.message.length},e.prototype.clonePosition=function(){return{offset:this.position.offset,line:this.position.line,column:this.position.column}},e.prototype.char=function(){var r=this.position.offset;if(r>=this.message.length)throw Error("out of bound");var t=Ea(this.message,r);if(t===void 0)throw Error("Offset ".concat(r," is at invalid UTF-16 code unit boundary"));return t},e.prototype.error=function(r,t){return{val:null,err:{kind:r,message:this.message,location:t}}},e.prototype.bump=function(){if(!this.isEOF()){var r=this.char();r===10?(this.position.line+=1,this.position.column=1,this.position.offset+=1):(this.position.column+=1,this.position.offset+=r<65536?1:2)}},e.prototype.bumpIf=function(r){if(ya(this.message,r,this.offset())){for(var t=0;t<r.length;t++)this.bump();return!0}return!1},e.prototype.bumpUntil=function(r){var t=this.offset(),i=this.message.indexOf(r,t);return i>=0?(this.bumpTo(i),!0):(this.bumpTo(this.message.length),!1)},e.prototype.bumpTo=function(r){if(this.offset()>r)throw Error("targetOffset ".concat(r," must be greater than or equal to the current offset ").concat(this.offset()));for(r=Math.min(r,this.message.length);;){var t=this.offset();if(t===r)break;if(t>r)throw Error("targetOffset ".concat(r," is at invalid UTF-16 code unit boundary"));if(this.bump(),this.isEOF())break}},e.prototype.bumpSpace=function(){for(;!this.isEOF()&&Aa(this.char());)this.bump()},e.prototype.peek=function(){if(this.isEOF())return null;var r=this.char(),t=this.offset(),i=this.message.charCodeAt(t+(r>=65536?2:1));return i??null},e}();function Hr(e){return e>=97&&e<=122||e>=65&&e<=90}function Lo(e){return Hr(e)||e===47}function _o(e){return e===45||e===46||e>=48&&e<=57||e===95||e>=97&&e<=122||e>=65&&e<=90||e==183||e>=192&&e<=214||e>=216&&e<=246||e>=248&&e<=893||e>=895&&e<=8191||e>=8204&&e<=8205||e>=8255&&e<=8256||e>=8304&&e<=8591||e>=11264&&e<=12271||e>=12289&&e<=55295||e>=63744&&e<=64975||e>=65008&&e<=65533||e>=65536&&e<=983039}function Aa(e){return e>=9&&e<=13||e===32||e===133||e>=8206&&e<=8207||e===8232||e===8233}function Po(e){return e>=33&&e<=35||e===36||e>=37&&e<=39||e===40||e===41||e===42||e===43||e===44||e===45||e>=46&&e<=47||e>=58&&e<=59||e>=60&&e<=62||e>=63&&e<=64||e===91||e===92||e===93||e===94||e===96||e===123||e===124||e===125||e===126||e===161||e>=162&&e<=165||e===166||e===167||e===169||e===171||e===172||e===174||e===176||e===177||e===182||e===187||e===191||e===215||e===247||e>=8208&&e<=8213||e>=8214&&e<=8215||e===8216||e===8217||e===8218||e>=8219&&e<=8220||e===8221||e===8222||e===8223||e>=8224&&e<=8231||e>=8240&&e<=8248||e===8249||e===8250||e>=8251&&e<=8254||e>=8257&&e<=8259||e===8260||e===8261||e===8262||e>=8263&&e<=8273||e===8274||e===8275||e>=8277&&e<=8286||e>=8592&&e<=8596||e>=8597&&e<=8601||e>=8602&&e<=8603||e>=8604&&e<=8607||e===8608||e>=8609&&e<=8610||e===8611||e>=8612&&e<=8613||e===8614||e>=8615&&e<=8621||e===8622||e>=8623&&e<=8653||e>=8654&&e<=8655||e>=8656&&e<=8657||e===8658||e===8659||e===8660||e>=8661&&e<=8691||e>=8692&&e<=8959||e>=8960&&e<=8967||e===8968||e===8969||e===8970||e===8971||e>=8972&&e<=8991||e>=8992&&e<=8993||e>=8994&&e<=9e3||e===9001||e===9002||e>=9003&&e<=9083||e===9084||e>=9085&&e<=9114||e>=9115&&e<=9139||e>=9140&&e<=9179||e>=9180&&e<=9185||e>=9186&&e<=9254||e>=9255&&e<=9279||e>=9280&&e<=9290||e>=9291&&e<=9311||e>=9472&&e<=9654||e===9655||e>=9656&&e<=9664||e===9665||e>=9666&&e<=9719||e>=9720&&e<=9727||e>=9728&&e<=9838||e===9839||e>=9840&&e<=10087||e===10088||e===10089||e===10090||e===10091||e===10092||e===10093||e===10094||e===10095||e===10096||e===10097||e===10098||e===10099||e===10100||e===10101||e>=10132&&e<=10175||e>=10176&&e<=10180||e===10181||e===10182||e>=10183&&e<=10213||e===10214||e===10215||e===10216||e===10217||e===10218||e===10219||e===10220||e===10221||e===10222||e===10223||e>=10224&&e<=10239||e>=10240&&e<=10495||e>=10496&&e<=10626||e===10627||e===10628||e===10629||e===10630||e===10631||e===10632||e===10633||e===10634||e===10635||e===10636||e===10637||e===10638||e===10639||e===10640||e===10641||e===10642||e===10643||e===10644||e===10645||e===10646||e===10647||e===10648||e>=10649&&e<=10711||e===10712||e===10713||e===10714||e===10715||e>=10716&&e<=10747||e===10748||e===10749||e>=10750&&e<=11007||e>=11008&&e<=11055||e>=11056&&e<=11076||e>=11077&&e<=11078||e>=11079&&e<=11084||e>=11085&&e<=11123||e>=11124&&e<=11125||e>=11126&&e<=11157||e===11158||e>=11159&&e<=11263||e>=11776&&e<=11777||e===11778||e===11779||e===11780||e===11781||e>=11782&&e<=11784||e===11785||e===11786||e===11787||e===11788||e===11789||e>=11790&&e<=11798||e===11799||e>=11800&&e<=11801||e===11802||e===11803||e===11804||e===11805||e>=11806&&e<=11807||e===11808||e===11809||e===11810||e===11811||e===11812||e===11813||e===11814||e===11815||e===11816||e===11817||e>=11818&&e<=11822||e===11823||e>=11824&&e<=11833||e>=11834&&e<=11835||e>=11836&&e<=11839||e===11840||e===11841||e===11842||e>=11843&&e<=11855||e>=11856&&e<=11857||e===11858||e>=11859&&e<=11903||e>=12289&&e<=12291||e===12296||e===12297||e===12298||e===12299||e===12300||e===12301||e===12302||e===12303||e===12304||e===12305||e>=12306&&e<=12307||e===12308||e===12309||e===12310||e===12311||e===12312||e===12313||e===12314||e===12315||e===12316||e===12317||e>=12318&&e<=12319||e===12320||e===12336||e===64830||e===64831||e>=65093&&e<=65094}function Fr(e){e.forEach(function(r){if(delete r.location,cr(r)||lr(r))for(var t in r.options)delete r.options[t].location,Fr(r.options[t].value);else nr(r)&&hr(r.style)||(or(r)||sr(r))&&At(r.style)?delete r.style.location:dr(r)&&Fr(r.children)})}function Ta(e,r){r===void 0&&(r={}),r=E({shouldParseSkeletons:!0,requiresOtherClause:!0},r);var t=new Ca(e,r).parse();if(t.err){var i=SyntaxError(v[t.err.kind]);throw i.location=t.err.location,i.originalMessage=t.err.message,i}return r?.captureLocation||Fr(t.val),t.val}function kt(e,r){var t=r&&r.cache?r.cache:Io,i=r&&r.serializer?r.serializer:Oo,a=r&&r.strategy?r.strategy:Mo;return a(e,{cache:t,serializer:i})}function zo(e){return e==null||typeof e=="number"||typeof e=="boolean"}function ka(e,r,t,i){var a=zo(i)?i:t(i),n=r.get(a);return typeof n>"u"&&(n=e.call(this,i),r.set(a,n)),n}function La(e,r,t){var i=Array.prototype.slice.call(arguments,3),a=t(i),n=r.get(a);return typeof n>"u"&&(n=e.apply(this,i),r.set(a,n)),n}function $r(e,r,t,i,a){return t.bind(r,e,i,a)}function Mo(e,r){var t=e.length===1?ka:La;return $r(e,this,t,r.cache.create(),r.serializer)}function Ro(e,r){return $r(e,this,La,r.cache.create(),r.serializer)}function No(e,r){return $r(e,this,ka,r.cache.create(),r.serializer)}var Oo=function(){return JSON.stringify(arguments)};function Ur(){this.cache=Object.create(null)}Ur.prototype.get=function(e){return this.cache[e]};Ur.prototype.set=function(e,r){this.cache[e]=r};var Io={create:function(){return new Ur}},pr={variadic:Ro,monadic:No};var _e;(function(e){e.MISSING_VALUE="MISSING_VALUE",e.INVALID_VALUE="INVALID_VALUE",e.MISSING_INTL_API="MISSING_INTL_API"})(_e||(_e={}));var Lt=function(e){Ct(r,e);function r(t,i,a){var n=e.call(this,t)||this;return n.code=i,n.originalMessage=a,n}return r.prototype.toString=function(){return"[formatjs Error: ".concat(this.code,"] ").concat(this.message)},r}(Error);var Gr=function(e){Ct(r,e);function r(t,i,a,n){return e.call(this,'Invalid values for "'.concat(t,'": "').concat(i,'". Options are "').concat(Object.keys(a).join('", "'),'"'),_e.INVALID_VALUE,n)||this}return r}(Lt);var _a=function(e){Ct(r,e);function r(t,i,a){return e.call(this,'Value for "'.concat(t,'" must be of type ').concat(i),_e.INVALID_VALUE,a)||this}return r}(Lt);var Pa=function(e){Ct(r,e);function r(t,i){return e.call(this,'The intl string context variable "'.concat(t,'" was not provided to the string "').concat(i,'"'),_e.MISSING_VALUE,i)||this}return r}(Lt);var B;(function(e){e[e.literal=0]="literal",e[e.object=1]="object"})(B||(B={}));function Do(e){return e.length<2?e:e.reduce(function(r,t){var i=r[r.length-1];return!i||i.type!==B.literal||t.type!==B.literal?r.push(t):i.value+=t.value,r},[])}function Bo(e){return typeof e=="function"}function _t(e,r,t,i,a,n,o){if(e.length===1&&Mr(e[0]))return[{type:B.literal,value:e[0].value}];for(var s=[],c=0,l=e;c<l.length;c++){var h=l[c];if(Mr(h)){s.push({type:B.literal,value:h.value});continue}if(sa(h)){typeof n=="number"&&s.push({type:B.literal,value:t.getNumberFormat(r).format(n)});continue}var u=h.value;if(!(a&&u in a))throw new Pa(u,o);var m=a[u];if(oa(h)){(!m||typeof m=="string"||typeof m=="number")&&(m=typeof m=="string"||typeof m=="number"?String(m):""),s.push({type:typeof m=="string"?B.literal:B.object,value:m});continue}if(or(h)){var b=typeof h.style=="string"?i.date[h.style]:At(h.style)?h.style.parsedOptions:void 0;s.push({type:B.literal,value:t.getDateTimeFormat(r,b).format(m)});continue}if(sr(h)){var b=typeof h.style=="string"?i.time[h.style]:At(h.style)?h.style.parsedOptions:i.time.medium;s.push({type:B.literal,value:t.getDateTimeFormat(r,b).format(m)});continue}if(nr(h)){var b=typeof h.style=="string"?i.number[h.style]:hr(h.style)?h.style.parsedOptions:void 0;b&&b.scale&&(m=m*(b.scale||1)),s.push({type:B.literal,value:t.getNumberFormat(r,b).format(m)});continue}if(dr(h)){var L=h.children,M=h.value,V=a[M];if(!Bo(V))throw new _a(M,"function",o);var J=_t(L,r,t,i,a,n),X=V(J.map(function(se){return se.value}));Array.isArray(X)||(X=[X]),s.push.apply(s,X.map(function(se){return{type:typeof se=="string"?B.literal:B.object,value:se}}))}if(cr(h)){var H=h.options[m]||h.options.other;if(!H)throw new Gr(h.value,m,Object.keys(h.options),o);s.push.apply(s,_t(H.value,r,t,i,a));continue}if(lr(h)){var H=h.options["=".concat(m)];if(!H){if(!Intl.PluralRules)throw new Lt(`Intl.PluralRules is not available in this environment.
Try polyfilling it using "@formatjs/intl-pluralrules"
`,_e.MISSING_INTL_API,o);var Se=t.getPluralRules(r,{type:h.pluralType}).select(m-(h.offset||0));H=h.options[Se]||h.options.other}if(!H)throw new Gr(h.value,m,Object.keys(h.options),o);s.push.apply(s,_t(H.value,r,t,i,a,m-(h.offset||0)));continue}}return Do(s)}function Ho(e,r){return r?E(E(E({},e||{}),r||{}),Object.keys(e).reduce(function(t,i){return t[i]=E(E({},e[i]),r[i]||{}),t},{})):e}function Fo(e,r){return r?Object.keys(e).reduce(function(t,i){return t[i]=Ho(e[i],r[i]),t},E({},e)):e}function qr(e){return{create:function(){return{get:function(r){return e[r]},set:function(r,t){e[r]=t}}}}}function $o(e){return e===void 0&&(e={number:{},dateTime:{},pluralRules:{}}),{getNumberFormat:kt(function(){for(var r,t=[],i=0;i<arguments.length;i++)t[i]=arguments[i];return new((r=Intl.NumberFormat).bind.apply(r,ar([void 0],t,!1)))},{cache:qr(e.number),strategy:pr.variadic}),getDateTimeFormat:kt(function(){for(var r,t=[],i=0;i<arguments.length;i++)t[i]=arguments[i];return new((r=Intl.DateTimeFormat).bind.apply(r,ar([void 0],t,!1)))},{cache:qr(e.dateTime),strategy:pr.variadic}),getPluralRules:kt(function(){for(var r,t=[],i=0;i<arguments.length;i++)t[i]=arguments[i];return new((r=Intl.PluralRules).bind.apply(r,ar([void 0],t,!1)))},{cache:qr(e.pluralRules),strategy:pr.variadic})}}var za=function(){function e(r,t,i,a){var n=this;if(t===void 0&&(t=e.defaultLocale),this.formatterCache={number:{},dateTime:{},pluralRules:{}},this.format=function(o){var s=n.formatToParts(o);if(s.length===1)return s[0].value;var c=s.reduce(function(l,h){return!l.length||h.type!==B.literal||typeof l[l.length-1]!="string"?l.push(h.value):l[l.length-1]+=h.value,l},[]);return c.length<=1?c[0]||"":c},this.formatToParts=function(o){return _t(n.ast,n.locales,n.formatters,n.formats,o,void 0,n.message)},this.resolvedOptions=function(){return{locale:n.resolvedLocale.toString()}},this.getAst=function(){return n.ast},this.locales=t,this.resolvedLocale=e.resolveLocale(t),typeof r=="string"){if(this.message=r,!e.__parse)throw new TypeError("IntlMessageFormat.__parse must be set to process `message` of type `string`");this.ast=e.__parse(r,{ignoreTag:a?.ignoreTag,locale:this.resolvedLocale})}else this.ast=r;if(!Array.isArray(this.ast))throw new TypeError("A message must be provided as a String or AST.");this.formats=Fo(e.formats,i),this.formatters=a&&a.formatters||$o(this.formatterCache)}return Object.defineProperty(e,"defaultLocale",{get:function(){return e.memoizedDefaultLocale||(e.memoizedDefaultLocale=new Intl.NumberFormat().resolvedOptions().locale),e.memoizedDefaultLocale},enumerable:!1,configurable:!0}),e.memoizedDefaultLocale=null,e.resolveLocale=function(r){var t=Intl.NumberFormat.supportedLocalesOf(r);return t.length>0?new Intl.Locale(t[0]):new Intl.Locale(typeof r=="string"?r:r[0])},e.__parse=Ta,e.formats={number:{integer:{maximumFractionDigits:0},currency:{style:"currency"},percent:{style:"percent"}},date:{short:{month:"numeric",day:"numeric",year:"2-digit"},medium:{month:"short",day:"numeric",year:"numeric"},long:{month:"long",day:"numeric",year:"numeric"},full:{weekday:"long",month:"long",day:"numeric",year:"numeric"}},time:{short:{hour:"numeric",minute:"numeric"},medium:{hour:"numeric",minute:"numeric",second:"numeric"},long:{hour:"numeric",minute:"numeric",second:"numeric",timeZoneName:"short"},full:{hour:"numeric",minute:"numeric",second:"numeric",timeZoneName:"short"}}},e}();var Ma=za;var Vr={MONTH:"MONTH",YEAR:"YEAR"},Jd={[pe.ANNUAL]:12,[pe.MONTHLY]:1,[pe.THREE_YEARS]:36,[pe.TWO_YEARS]:24},jr=(e,r)=>({accept:e,round:r}),eh=[jr(({divisor:e,price:r})=>r%e==0,({divisor:e,price:r})=>r/e),jr(({usePrecision:e})=>e,({divisor:e,price:r})=>Math.round(r/e*100)/100),jr(()=>!0,({divisor:e,price:r})=>Math.ceil(Math.floor(r*100/e)/100))],th={[Tr.YEAR]:{[pe.MONTHLY]:Vr.MONTH,[pe.ANNUAL]:Vr.YEAR},[Tr.MONTH]:{[pe.MONTHLY]:Vr.MONTH}};var Uo=na("ConsonantTemplates/price"),Go=/<\/?[^>]+(>|$)/g;function qo(e){e=e.replaceAll("</a>","&lt;/a&gt;");let r=/<a [^>]+(>|$)/g;return e.match(r)?.forEach(i=>{let a=i.replace("<a ","&lt;a ").replace(">","&gt;");e=e.replaceAll(i,a)}),e}function Vo(e){e=e.replaceAll("&lt;/a&gt;","</a>");let r=/&lt;a (?!&gt;)(.*?)(&gt;|$)/g;return e.match(r)?.forEach(i=>{let a=i.replace("&lt;a ","<a ").replace("&gt;",">");e=e.replaceAll(i,a)}),e}function Ra(e,r,t,i){let a=e[t];if(a==null)return"";let n=a.includes("<"),o=a.includes("<a ");try{a=o?qo(a):a,a=n?a.replace(Go,""):a;let s=new Ma(a,r).format(i);return o?Vo(s):s}catch{return Uo.error("Failed to format literal:",a),""}}var Na={cardName:{attribute:"name"},subtitle:{tag:"p",slot:"subtitle"},title:{tag:"h3",slot:"heading-xs"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"s"},prices:{tag:"p",slot:"heading-m"},promoText:{tag:"p",slot:"promo-text"},perUnitLabel:{tag:"span",slot:"per-unit-label"},callout:{tag:"div",slot:"callout-content",editorLabel:"License callout"},quantitySelect:{tag:"div",slot:"quantity-select"},shortDescription:{tag:"div",slot:"legal-text"},secureLabel:!0,planType:!0,addon:!0,ctas:{slot:"footer",size:"m"},whatsIncluded:{tag:"div",slot:"whats-included"},borderColor:{attribute:"border-color",specialValues:{Black:"black"}},allowedBorderColors:[],style:"consonant"},xe,ie,Pe,de,Oa,Pt,ur=class ur extends y{constructor(){super(...arguments);f(this,de);p(this,"expanded",!1);p(this,"licenseOpen",!1);p(this,"licenseQty",null);f(this,xe,null);f(this,ie,null);f(this,Pe,null);p(this,"handleResize",()=>{d(this,ie)&&cancelAnimationFrame(d(this,ie)),g(this,ie,requestAnimationFrame(()=>{g(this,ie,null),window.matchMedia("(min-width: 768px)").matches&&this.syncHeights()}))});p(this,"toggleExpanded",t=>{t.preventDefault();let i=!this.expanded;for(let a of _(this,de,Oa).call(this)){let n=a.variantLayout;n instanceof ur&&(n.expanded=i,a.requestUpdate())}});p(this,"toggleLicensePopover",t=>{t.preventDefault(),t.stopPropagation(),this.licenseOpen=!this.licenseOpen,this.licenseOpen?(g(this,xe,i=>{i.composedPath().includes(this.card)||(this.licenseOpen=!1,this.card.requestUpdate(),_(this,de,Pt).call(this))}),document.addEventListener("mousedown",d(this,xe))):_(this,de,Pt).call(this),this.card.requestUpdate()});p(this,"selectLicenseQty",t=>{this.licenseQty=t,this.licenseOpen=!1,_(this,de,Pt).call(this);let i=this.quantitySelectEl;i&&(i.selectedValue=Number(t),i.dispatchEvent(new CustomEvent($,{detail:{option:Number(t)},bubbles:!0}))),this.card.requestUpdate()})}getGlobalCSS(){return ia}priceOptionsProvider(t,i){t.dataset.template===D&&(i.displayPlanType=this.card?.settings?.displayPlanType??!1)}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let t=this.mainPrice;if(!t)return;let i=t.cloneNode(!0);if(await t.onceSettled(),!t?.options)return;t.options.displayPerUnit&&(t.dataset.displayPerUnit="false"),t.options.displayTax&&(t.dataset.displayTax="false"),t.options.displayPlanType&&(t.dataset.displayPlanType="false"),i.setAttribute("data-template","legal"),t.parentNode.insertBefore(i,t.nextSibling),await i.onceSettled(),this.legalResolvedHandler||(this.legalResolvedHandler=()=>this.adjustShortDescription(),i.addEventListener(ee,this.legalResolvedHandler)),this.adjustShortDescription()}catch{}}adjustShortDescription(){if(!this.shortDescriptionSource){let n=this.card.querySelector('[slot="legal-text"]');if(!n)return;this.shortDescriptionSource=n,n.remove()}let t=this.shortDescriptionSource.textContent?.trim();if(!t)return;let a=this.card.querySelector('[slot="heading-m"] [data-template="legal"]')?.querySelector(".price-plan-type");a&&(a.textContent=t)}get hasWhatsIncluded(){return!!this.card.querySelector('[slot="whats-included"]')}get whatsIncludedToggleLabel(){return this.card.querySelector('[slot="whats-included"] .whats-included-label')?.textContent.trim()||"See what's included:"}get hasCallout(){return!!this.card.querySelector('[slot="callout-content"]')}get hasQuantitySelect(){let t=this.quantitySelectEl;return t?!!t.getAttribute("title")||parseInt(t.getAttribute("min"),10)>0||parseInt(t.getAttribute("step"),10)>0:!1}get hasAddOn(){return!!this.card.querySelector('[slot="addon"]')}get mainPrice(){return this.card.querySelector(`[slot="heading-m"] ${C}[data-template="price"]`)}async adjustAddon(){await this.card.updateComplete;let t=this.card.addon;if(!t)return;t.setAttribute("custom-checkbox","");let i=this.mainPrice;if(!i)return;await i.onceSettled();let a=i.value?.[0]?.planType;a&&(t.planType=a)}async postCardUpdateHook(){await this.adjustAddon(),this.legalAdjusted||await this.adjustLegal(),this.adjustShortDescription(),await super.postCardUpdateHook(),window.matchMedia("(min-width: 768px)").matches&&requestAnimationFrame(()=>this.syncHeights())}syncHeights(){this.card.getBoundingClientRect().width<=2||this.syncRowHeights([{name:"top-card",getElement:t=>t.shadowRoot?.querySelector(".top-card")}])}connectedCallbackHook(){window.addEventListener("resize",this.handleResize),g(this,Pe,new IntersectionObserver(([t])=>{t.boundingClientRect.height!==0&&t.isIntersecting&&(window.matchMedia("(min-width: 768px)").matches&&requestAnimationFrame(()=>this.syncHeights()),d(this,Pe)?.disconnect())})),d(this,Pe).observe(this.card)}disconnectedCallbackHook(){_(this,de,Pt).call(this),window.removeEventListener("resize",this.handleResize),d(this,ie)&&(cancelAnimationFrame(d(this,ie)),g(this,ie,null)),d(this,Pe)?.disconnect()}get quantitySelectEl(){return this.card.querySelector("merch-quantity-select")}get licenseOptions(){let t=this.quantitySelectEl;if(!t)return null;let i=parseInt(t.getAttribute("min"),10),a=parseInt(t.getAttribute("max"),10),n=parseInt(t.getAttribute("step"),10)||1;if(Number.isNaN(i)||Number.isNaN(a)||a<i)return null;let o=[];for(let s=i;s<=a;s+=n)o.push(String(s));return o.length?o:null}licenseLabel(t){let i=this.quantitySelectEl?.getAttribute("title")||"License";if(!i.includes("{"))return i;let a=document.querySelector("mas-commerce-service")?.settings?.locale?.replace("_","-")??"en-US";return Ra({title:i},a,"title",{count:Number(t)})||i}get hasLicenseSelector(){return(this.licenseOptions?.length??0)>0}get currentLicenseValue(){let t=this.licenseOptions;if(!t?.length)return null;if(this.licenseQty!=null)return this.licenseQty;let i=this.quantitySelectEl?.getAttribute("default-value");return i!=null&&t.includes(i)?i:t[0]}renderLicenseSelector(){if(!this.hasLicenseSelector)return be`<slot name="quantity-select"></slot>`;let t=this.licenseOptions,i=this.currentLicenseValue,a=!!this.licenseOpen,n=this.licenseLabel(Number(i));return be`
            <div class="license-select" ?data-open=${a}>
                <button
                    class="license-select-trigger"
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded=${a?"true":"false"}
                    aria-controls="license-popover"
                    @click=${this.toggleLicensePopover}
                >
                    <span class="license-select-trigger-text">
                        <span class="license-select-value">${i}</span>
                        <span class="license-select-label">${n}</span>
                    </span>
                    <span
                        class="license-select-chevron"
                        aria-hidden="true"
                    ></span>
                </button>
                <ul
                    id="license-popover"
                    class="license-select-popover"
                    role="listbox"
                    ?hidden=${!a}
                >
                    <li
                        class="license-select-popover-header"
                        @click=${this.toggleLicensePopover}
                    >
                        <span class="license-select-trigger-text">
                            <span class="license-select-value">${i}</span>
                            <span class="license-select-label">${n}</span>
                        </span>
                        <span
                            class="license-select-chevron"
                            aria-hidden="true"
                            style="transform: rotate(180deg);"
                        ></span>
                    </li>
                    ${t.map(o=>be`
                            <li
                                class="license-select-option ${o===i?"selected":""}"
                                role="option"
                                aria-selected=${o===i?"true":"false"}
                                @click=${()=>this.selectLicenseQty(o)}
                            >
                                ${o}
                            </li>
                        `)}
                </ul>
            </div>
        `}renderLayout(){let t=!!this.expanded;return be`
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
                ${this.hasLicenseSelector||this.hasCallout||this.hasQuantitySelect?be`<div class="license-zone">
                          ${this.renderLicenseSelector()}
                          ${this.hasCallout?be`<div class="callout">
                                    <slot name="callout-content"></slot>
                                </div>`:mr}
                      </div>`:mr}
                ${this.hasAddOn?be`<div class="add-on">
                          <slot name="addon"></slot>
                      </div>`:mr}
                <footer>
                    <slot name="footer"></slot>
                </footer>
                ${this.secureLabel}
            </div>
            ${this.hasWhatsIncluded?be`
                      <button
                          class="whats-included-toggle"
                          type="button"
                          aria-expanded=${t?"true":"false"}
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
                          ?hidden=${!t}
                      >
                          <slot name="whats-included"></slot>
                      </div>
                  `:mr}
            <slot></slot>
        `}};xe=new WeakMap,ie=new WeakMap,Pe=new WeakMap,de=new WeakSet,Oa=function(){let t=Math.round(this.card.getBoundingClientRect().top),i=Array.from(this.getContainer()?.querySelectorAll('merch-card[variant="bizpro"]')??[]).filter(a=>{let n=a.getBoundingClientRect();return n.width>2&&Math.round(n.top)===t});return i.length?i:[this.card]},Pt=function(){d(this,xe)&&(document.removeEventListener("mousedown",d(this,xe)),g(this,xe,null))},p(ur,"variantStyle",jo`
        :host([variant='bizpro']) {
            display: flex;
            flex-direction: column;
            background: var(
                --consonant-merch-card-bizpro-frame-bg,
                var(--consonant-merch-card-bizpro-bg-subtle, #f8f8f8)
            );
            border-radius: 16px;
            padding: 8px;
            box-sizing: border-box;
            overflow: hidden;
            position: relative;
            color: var(--consonant-merch-card-bizpro-frame-text, #000);
            --secure-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='currentColor'%3E%3Cpath d='M9 9.2C9 8.64844 8.55156 8.2 8 8.2C7.44844 8.2 7 8.64844 7 9.2C7 9.52207 7.16289 9.7959 7.4 9.9789V10.6C7.4 10.9312 7.66875 11.2 8 11.2C8.33125 11.2 8.6 10.9312 8.6 10.6V9.9789C8.83711 9.7959 9 9.52207 9 9.2Z'/%3E%3Cpath d='M12 5.62031V5.2C12 2.99453 10.2055 1.2 8 1.2C5.79453 1.2 4 2.99453 4 5.2V5.62031C3.10274 5.72129 2.4 6.47637 2.4 7.4V12.6C2.4 13.5922 3.20782 14.4 4.2 14.4H11.8C12.7922 14.4 13.6 13.5922 13.6 12.6V7.4C13.6 6.47637 12.8973 5.72129 12 5.62031ZM8 2.4C9.54375 2.4 10.8 3.65625 10.8 5.2V5.6H5.2V5.2C5.2 3.65625 6.45625 2.4 8 2.4ZM12.4 12.6C12.4 12.9305 12.1305 13.2 11.8 13.2H4.2C3.86953 13.2 3.6 12.9305 3.6 12.6V7.4C3.6 7.06953 3.86953 6.8 4.2 6.8H11.8C12.1305 6.8 12.4 7.06953 12.4 7.4V12.6Z'/%3E%3C/svg%3E");
        }

        :host([variant='bizpro'][border-color='black']) {
            --consonant-merch-card-bizpro-frame-bg: #000;
            --consonant-merch-card-bizpro-frame-text: #fff;
            --consonant-merch-card-bizpro-divider-color: #ffffff29;
            --consonant-merch-card-bizpro-subtitle-color: #000;
        }

        :host([variant='bizpro']) .top-card {
            background: var(--consonant-merch-card-bizpro-bg-default, #fff);
            border-radius: 12px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 24px;
            color: #000;
            /* The white card sits at its natural content height and does NOT grow
               to fill (.features-zone below absorbs the slack). When cards in a
               row carry unequal top content (e.g. a longer description), the white
               tops would otherwise end at different heights; syncHeights() measures
               every .top-card in the row and publishes the row max as
               --consonant-merch-card-bizpro-top-card-height, and the
               min-height below pulls shorter cards up to match. Falls back to auto
               when unset (single column / pre-sync). .top-card is content-box, so
               the measured content height maps straight to min-height. */
            flex: 0 0 auto;
            min-height: var(
                --consonant-merch-card-bizpro-top-card-height,
                auto
            );
        }

        :host([variant='bizpro']) .mnemonic {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        :host([variant='bizpro']) ::slotted([slot='icons']) {
            width: 24px;
            height: 24px;
        }

        :host([variant='bizpro']) ::slotted([slot='subtitle']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 700;
            font-size: 16px;
            line-height: 20px;
            letter-spacing: 0;
            color: var(--consonant-merch-card-bizpro-subtitle-color, #000000a3);
            flex: 1;
        }

        :host([variant='bizpro']) .name-description {
            display: flex;
            flex-direction: column;
            gap: 8px;
            /* Grow to absorb height differences so everything from price
               downward sticks to the bottom edge of the white card. */
            flex: 1 1 auto;
        }

        :host([variant='bizpro']) ::slotted([slot='heading-xs']) {
            margin: 0;
            font-family: 'Adobe Clean Display', 'adobe-clean-display',
                sans-serif;
            font-weight: 900;
            font-size: 24px;
            line-height: 24px;
            letter-spacing: -0.48px;
            color: #000;
        }

        :host([variant='bizpro']) ::slotted([slot='body-xs']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
            color: #000;
        }

        :host([variant='bizpro']) .pricing {
            display: flex;
            flex-direction: column;
            gap: 0;
        }

        :host([variant='bizpro']) ::slotted([slot='heading-m']) {
            margin: 0;
            font-family: 'Adobe Clean Display', 'adobe-clean-display',
                sans-serif;
            font-weight: 900;
            font-size: 18px;
            line-height: 21px;
            letter-spacing: -0.48px;
            color: #000;
        }

        :host([variant='bizpro']) ::slotted([slot='promo-text']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
            color: #000000a3;
        }

        :host([variant='bizpro']) footer {
            display: flex;
            gap: 8px;
            padding: 0;
            margin: 0;
            background: transparent;
            min-height: auto;
        }

        :host([variant='bizpro']) footer ::slotted([slot='footer']) {
            display: flex;
            gap: 8px;
            flex: 1;
        }

        :host([variant='bizpro']) .secure-transaction-label {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
            color: #000000a3;
            padding: 0;
            margin: 0;
            align-self: flex-start;
            flex: 0 0 auto;
            white-space: normal;
        }

        :host([variant='bizpro']) .secure-transaction-label::before {
            content: '';
            display: inline-block;
            width: 16px;
            height: 16px;
            background-image: var(--secure-icon);
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
        }

        :host([variant='bizpro']) .features-zone {
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 24px;
            /* Grow to fill the card's remaining height so card bottoms align
               across the row (shorter cards get empty zone space below). */
            flex: 1 1 auto;
            color: var(--consonant-merch-card-bizpro-frame-text, #000);
        }

        :host([variant='bizpro']) .features-zone[hidden] {
            display: none;
        }

        :host([variant='bizpro']) ::slotted([slot='whats-included']) {
            color: inherit;
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        :host([variant='bizpro']) .whats-included-toggle {
            all: unset;
            display: flex;
            align-items: center;
            padding: 24px;
            cursor: pointer;
            color: var(--consonant-merch-card-bizpro-frame-text, #000);
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 700;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
        }

        /* Expanded state: no bottom padding — features-zone provides spacing */
        :host([variant='bizpro']) .whats-included-toggle[aria-expanded='true'] {
            padding-bottom: 0;
        }

        :host([variant='bizpro']) .whats-included-toggle-label {
            flex: 1 0 0;
        }

        :host([variant='bizpro']) .whats-included-toggle:focus-visible {
            outline: 2px solid #1473e6;
            outline-offset: -2px;
            border-radius: 8px;
        }

        :host([variant='bizpro']) .whats-included-toggle-chevron {
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

        :host([variant='bizpro'])
            .whats-included-toggle[aria-expanded='true']
            .whats-included-toggle-chevron {
            transform: rotate(180deg);
        }

        :host([variant='bizpro']) .pricing-line {
            display: flex;
            align-items: baseline;
            flex-wrap: wrap;
            gap: 0;
        }

        :host([variant='bizpro']) ::slotted([slot='per-unit-label']) {
            font-family: 'Adobe Clean Display', 'adobe-clean-display',
                sans-serif;
            font-weight: 900;
            font-size: 18px;
            line-height: 21px;
            letter-spacing: -0.48px;
            color: #000;
            margin-inline-start: 4px;
        }

        :host([variant='bizpro']) .license-zone {
            display: flex;
            flex-direction: column;
            background: var(--consonant-merch-card-bizpro-bg-subtle, #f8f8f8);
            border-radius: 8px;
            overflow: visible;
        }

        :host([variant='bizpro']) .license-select {
            position: relative;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
        }

        :host([variant='bizpro']) .license-select-trigger {
            all: unset;
            box-sizing: border-box;
            width: 100%;
            height: 40px;
            padding: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--consonant-merch-card-bizpro-bg-default, #fff);
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 8px;
            cursor: pointer;
            color: #000;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0;
        }

        :host([variant='bizpro']) .license-select-trigger:focus-visible {
            outline: 2px solid #1473e6;
            outline-offset: 1px;
        }

        :host([variant='bizpro']) .license-select-trigger-text {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        :host([variant='bizpro']) .license-select-value {
            font-weight: 700;
            color: #000;
        }

        :host([variant='bizpro']) .license-select-label {
            font-weight: 700;
            color: rgba(0, 0, 0, 0.64);
        }

        :host([variant='bizpro']) .license-select-chevron {
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

        :host([variant='bizpro'])
            .license-select-trigger[aria-expanded='true']
            .license-select-chevron {
            transform: rotate(180deg);
        }

        :host([variant='bizpro']) .license-select-popover {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            margin: 0;
            padding: 0;
            list-style: none;
            background: var(--consonant-merch-card-bizpro-bg-default, #fff);
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

        :host([variant='bizpro']) .license-select-popover[hidden] {
            display: none;
        }

        :host([variant='bizpro']) .license-select-popover-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 14px;
            line-height: 18px;
            font-weight: 700;
            cursor: pointer;
            background: var(--consonant-merch-card-bizpro-bg-default, #fff);
        }

        :host([variant='bizpro']) .license-select-option {
            padding: 16px 12px;
            cursor: pointer;
            color: #000;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 14px;
            line-height: 18px;
            font-weight: 700;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        :host([variant='bizpro']) .license-select-option:last-child {
            border-bottom: none;
        }

        :host([variant='bizpro']) .license-select-option:hover,
        :host([variant='bizpro']) .license-select-option.selected {
            background: var(--consonant-merch-card-bizpro-bg-subtle, #f8f8f8);
        }

        :host([variant='bizpro']) .callout {
            padding: 8px 12px 12px 12px;
            color: #000;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 12px;
            line-height: 16px;
            letter-spacing: 0.24px;
            font-weight: 700;
            text-align: start;
        }

        :host([variant='bizpro']) ::slotted([slot='callout-content']) {
            margin: 0;
        }

        :host([variant='bizpro']) .add-on {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 16px 12px;
            /* Gradient border (Figma 1098:33812) — same purple→red AI gradient
               as the trailing sparkle. Paint the white fill on padding-box and
               the gradient on border-box so only the 1px border shows it. */
            background:
                linear-gradient(
                        var(--consonant-merch-card-bizpro-bg-default, #fff),
                        var(--consonant-merch-card-bizpro-bg-default, #fff)
                    )
                    padding-box,
                linear-gradient(45deg, #8d88f2 0%, #8d88f2 48.8%, #eb1000 100%)
                    border-box;
            border: 1px solid transparent;
            border-radius: 8px;
            box-sizing: border-box;
        }

        :host([variant='bizpro']) .add-on::after {
            content: '';
            width: 16px;
            height: 16px;
            flex: 0 0 auto;
            /* Sparkle gradient is the raw 2-stop Linear Gradient (not the
               48.8%-stop AI Gradient): vertical, red top → purple bottom — the
               Figma asset is purple→red top-to-bottom inside a -scale-y-100
               flip, so as displayed it reads red on top. */
            background: linear-gradient(180deg, #eb1000 0%, #8d88f2 100%);
            mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M7.498 15.61C6.369 11.154 4.842 9.627 .39 8.502c-.52-.133-.52-.871 0-1.004C4.846 6.37 6.373 4.842 7.498 .39c.133-.52.871-.52 1.004 0C9.63 4.846 11.158 6.373 15.61 7.498c.52.133.52.871 0 1.004C11.154 9.63 9.627 11.158 8.502 15.61c-.133.52-.871.52-1.004 0Z'/%3E%3C/svg%3E")
                center / contain no-repeat;
            -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M7.498 15.61C6.369 11.154 4.842 9.627 .39 8.502c-.52-.133-.52-.871 0-1.004C4.846 6.37 6.373 4.842 7.498 .39c.133-.52.871-.52 1.004 0C9.63 4.846 11.158 6.373 15.61 7.498c.52.133.52.871 0 1.004C11.154 9.63 9.627 11.158 8.502 15.61c-.133.52-.871.52-1.004 0Z'/%3E%3C/svg%3E")
                center / contain no-repeat;
        }

        /* C2 desktop breakpoint: toggle disappears, features-zone is always visible inline */
        @media (min-width: 1280px) {
            :host([variant='bizpro']) .whats-included-toggle {
                display: none;
            }
            :host([variant='bizpro']) .features-zone[hidden] {
                display: flex;
            }
        }
    `);var zt=ur;import{html as Wr,css as Wo}from"./lit-all.min.js";var Ia=`
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

merch-card[variant="product"] [slot="callout-content"] .icon-button {
  margin: 1.5px 0 1.5px 8px;
}

merch-card[variant="product"] a.spectrum-Link--secondary {
  color: inherit;
}

merch-card[variant="product"][id] span[data-template="legal"] {
    display: block;
    color: var(----merch-color-grey-80);
    font-size: 14px;
    font-style: italic;
    font-weight: 400;
    line-height: 21px;
}

merch-card[variant="product"][id] .price-unit-type:not(.disabled)::before {
    content: "";
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
    font-family: var(--merch-body-font-family, 'Adobe Clean');
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
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

.one-merch-card.section merch-card[variant="product"],
.two-merch-cards.section merch-card[variant="product"],
.three-merch-cards.section merch-card[variant="product"],
.four-merch-cards.section merch-card[variant="product"] {
    width: auto;
}

/* grid style for product */
.one-merch-card.product,
.two-merch-cards.product,
.three-merch-cards.product,
.four-merch-cards.product {
    grid-template-columns: var(--consonant-merch-card-product-width);
}

/* Tablet */
@media screen and ${T} {
    .two-merch-cards.product,
    .three-merch-cards.product,
    .four-merch-cards.product {
        grid-template-columns: repeat(2, var(--consonant-merch-card-product-width));
    }
}

/* desktop */
@media screen and ${x} {
  :root {
    --consonant-merch-card-product-width: 378px;
    --consonant-merch-card-product-width-4clm: 276px;
  }
    
  .three-merch-cards.product {
      grid-template-columns: repeat(3, var(--consonant-merch-card-product-width));
  }

  .four-merch-cards.product {
      grid-template-columns: repeat(4, var(--consonant-merch-card-product-width-4clm));
  }
}

merch-card[variant="product"] {
    merch-whats-included merch-mnemonic-list,
    merch-whats-included [slot="heading"] {
        width: 100%;
    }
}

`;var Da={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},prices:{tag:"p",slot:"heading-xs"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"color-yellow-300-variation"},allowedBadgeColors:["color-yellow-300-variation","color-gray-300-variation","color-gray-700-variation","color-green-900-variation","gradient-purple-blue"],allowedBorderColors:["color-yellow-300-variation","color-gray-300-variation","color-green-900-variation","gradient-purple-blue"],borderColor:{attribute:"border-color"},whatsIncluded:{tag:"div",slot:"whats-included"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},ae,Je=class extends y{constructor(t){super(t);f(this,ae);this.postCardUpdateHook=this.postCardUpdateHook.bind(this),this.updatePriceQuantity=this.updatePriceQuantity.bind(this)}getGlobalCSS(){return Ia}priceOptionsProvider(t,i){t.dataset.template===D&&(i.displayPlanType=this.card?.settings?.displayPlanType??!1,(t.dataset.template==="strikethrough"||t.dataset.template==="price")&&(i.displayPerUnit=!1))}adjustProductBodySlots(){if(this.card.getBoundingClientRect().width===0)return;["heading-xs","body-xxs","body-xs","promo-text","callout-content","addon","body-lower"].forEach(i=>this.updateCardElementMinHeight(this.card.shadowRoot.querySelector(`slot[name="${i}"]`),i))}renderLayout(){return Wr` ${this.badge}
            <div class="body" aria-live="polite">
                <slot name="icons"></slot>
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${this.promoBottom?"":Wr`<slot name="promo-text"></slot>`}
                <slot name="body-xs"></slot>
                ${this.promoBottom?Wr`<slot name="promo-text"></slot>`:""}
                <slot name="whats-included"></slot>
                <slot name="callout-content"></slot>
                <slot name="quantity-select"></slot>
                <slot name="addon"></slot>
                <slot name="body-lower"></slot>
                <slot name="badge"></slot>
            </div>
            <hr />
            ${this.secureLabelFooter}`}connectedCallbackHook(){this.handleResize=()=>{d(this,ae)&&cancelAnimationFrame(d(this,ae)),g(this,ae,requestAnimationFrame(()=>{g(this,ae,null),this.postCardUpdateHook()}))},window.addEventListener("resize",this.handleResize),this.card.addEventListener($,this.updatePriceQuantity)}disconnectedCallbackHook(){this.handleResize&&(window.removeEventListener("resize",this.handleResize),this.handleResize=null),d(this,ae)&&(cancelAnimationFrame(d(this,ae)),g(this,ae,null)),this.card.removeEventListener($,this.updatePriceQuantity)}async postCardUpdateHook(){this.card.isConnected&&(this.adjustAddon(),w.isMobile||this.adjustProductBodySlots(),this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook())}async adjustLegal(){if(!(this.legalAdjusted||!this.card.id))try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let t=this.mainPrice;if(!t)return;let i=t.cloneNode(!0);if(await t.onceSettled(),!t?.options)return;t.options.displayPerUnit&&(t.dataset.displayPerUnit="false"),t.options.displayTax&&(t.dataset.displayTax="false"),t.options.displayPlanType&&(t.dataset.displayPlanType="false"),i.setAttribute("data-template","legal"),t.parentNode.insertBefore(i,t.nextSibling),await i.onceSettled()}catch{}}get headingXSSlot(){return this.card.shadowRoot.querySelector('slot[name="heading-xs"]').assignedElements()[0]}get mainPrice(){return this.card.querySelector(`[slot="heading-xs"] ${C}[data-template="price"]`)}updatePriceQuantity({detail:t}){!this.mainPrice||!t?.option||(this.mainPrice.dataset.quantity=t.option)}toggleAddon(t){let i=this.mainPrice,a=this.headingXSSlot;if(!i&&a){let n=t?.getAttribute("plan-type"),o=null;if(t&&n&&(o=t.querySelector(`p[data-plan-type="${n}"]`)?.querySelector('span[is="inline-price"]')),this.card.querySelectorAll('p[slot="heading-xs"]').forEach(s=>s.remove()),t.checked){if(o){let s=I("p",{class:"addon-heading-xs-price-addon",slot:"heading-xs"},o.innerHTML);this.card.appendChild(s)}}else{let s=I("p",{class:"card-heading",id:"free",slot:"heading-xs"},"Free");this.card.appendChild(s)}}}async adjustAddon(){await this.card.updateComplete;let t=this.card.addon;if(!t)return;let i=this.mainPrice,a=this.card.planType;i&&(await i.onceSettled(),a=i.value?.[0]?.planType),a&&(t.planType=a)}};ae=new WeakMap,p(Je,"variantStyle",Wo`
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
    `);import{html as Yr,css as Yo}from"./lit-all.min.js";var Ba=`
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
.four-merch-cards.segment {
  grid-template-columns: minmax(276px, var(--consonant-merch-card-segment-width));
}

.three-merch-cards.section merch-card[variant="segment"],
.four-merch-cards.section merch-card[variant="segment"] {
    max-width: 302px;
}

/* Mobile */
@media screen and ${A} {
  :root {
    --consonant-merch-card-segment-width: 276px;
  }
}

@media screen and ${T} {
  :root {
    --consonant-merch-card-segment-width: 276px;
  }
    
  .two-merch-cards.segment,
  .three-merch-cards.segment,
  .four-merch-cards.segment {
      grid-template-columns: repeat(2, minmax(302px, var(--consonant-merch-card-segment-width)));
  }
}

/* desktop */
@media screen and ${x} {
  :root {
    --consonant-merch-card-segment-width: 276px;
  }
    
  .three-merch-cards.segment {
      grid-template-columns: repeat(3, minmax(276px, var(--consonant-merch-card-segment-width)));
  }

  .four-merch-cards.segment {
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

merch-card[variant="segment"] [slot="callout-content"] .icon-button {
  margin: 1.5px 0 1.5px 8px;
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

merch-card[variant="segment"][id] .price-unit-type:not(.disabled)::before {
    content: "";
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
`;var Ha={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},prices:{tag:"p",slot:"heading-xs"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},callout:{tag:"div",slot:"callout-content"},planType:!0,secureLabel:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"color-red-700-variation"},allowedBadgeColors:["color-yellow-300-variation","color-gray-300-variation","color-gray-700-variation","color-green-900-variation","color-red-700-variation","gradient-purple-blue"],allowedBorderColors:["color-yellow-300-variation","color-gray-300-variation","color-green-900-variation","color-red-700-variation","gradient-purple-blue"],borderColor:{attribute:"border-color"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},et=class extends y{constructor(r){super(r)}priceOptionsProvider(r,t){r.dataset.template===D&&(t.displayPlanType=this.card?.settings?.displayPlanType??!1,(r.dataset.template==="strikethrough"||r.dataset.template==="price")&&(t.displayPerUnit=!1))}getGlobalCSS(){return Ba}get badgeElement(){return this.card.querySelector('[slot="badge"]')}get mainPrice(){return this.card.querySelector(`[slot="heading-xs"] ${C}[data-template="price"]`)}async postCardUpdateHook(){this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook()}async adjustLegal(){if(!(this.legalAdjusted||!this.card.id))try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let r=this.mainPrice;if(!r)return;let t=r.cloneNode(!0);if(await r.onceSettled(),!r?.options)return;r.options.displayPerUnit&&(r.dataset.displayPerUnit="false"),r.options.displayTax&&(r.dataset.displayTax="false"),r.options.displayPlanType&&(r.dataset.displayPlanType="false"),t.setAttribute("data-template","legal"),r.parentNode.insertBefore(t,r.nextSibling),await t.onceSettled()}catch{}}renderLayout(){return Yr`
            ${this.badge}
            <div class="body">
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${this.promoBottom?"":Yr`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`}
                <slot name="body-xs"></slot>
                ${this.promoBottom?Yr`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`:""}
                <slot name="badge"></slot>
            </div>
            <hr />
            ${this.secureLabelFooter}
        `}};p(et,"variantStyle",Yo`
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
    `);import{html as Xo,css as Zo}from"./lit-all.min.js";var Fa=`

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

`;var $a={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"body-xxs"},description:{tag:"div",slot:"body-xs"},ctas:{slot:"footer",size:"m"},backgroundImage:{tag:"div",slot:"bg-image"},style:"consonant"},tt=class extends y{constructor(r){super(r)}getGlobalCSS(){return Fa}removeFocusFromModalClose(){let r=this.card.closest(".dialog-modal");r&&r.querySelector(".dialog-close")?.blur()}async postCardUpdateHook(){this.removeFocusFromModalClose(),await super.postCardUpdateHook()}renderLayout(){return Xo`
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
        `}};p(tt,"variantStyle",Zo`
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
    `);import{html as Xr,css as Ko}from"./lit-all.min.js";var Ua=`
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


/* grid style for special-offers */
.one-merch-card.special-offers,
.two-merch-cards.special-offers,
.three-merch-cards.special-offers,
.four-merch-cards.special-offers {
  grid-template-columns: minmax(302px, var(--consonant-merch-card-special-offers-width));
}

@media screen and ${A} {
  :root {
    --consonant-merch-card-special-offers-width: 302px;
  }
}

@media screen and ${T} {
  :root {
    --consonant-merch-card-special-offers-width: 302px;
  }

  .two-merch-cards.special-offers,
  .three-merch-cards.special-offers,
  .four-merch-cards.special-offers {
      grid-template-columns: repeat(2, minmax(302px, var(--consonant-merch-card-special-offers-width)));
  }
}

/* desktop */
@media screen and ${x} {
  .three-merch-cards.special-offers,
  .four-merch-cards.special-offers {
    grid-template-columns: repeat(3, minmax(302px, var(--consonant-merch-card-special-offers-width)));
  }
}

@media screen and ${O} {
  .four-merch-cards.special-offers {
    grid-template-columns: repeat(4, minmax(302px, var(--consonant-merch-card-special-offers-width)));
  }
}
`;var Ga={cardName:{attribute:"name"},backgroundImage:{tag:"div",slot:"bg-image"},subtitle:{tag:"p",slot:"detail-m"},title:{tag:"h3",slot:"heading-xs"},prices:{tag:"p",slot:"heading-xs-price"},description:{tag:"div",slot:"body-xs"},ctas:{slot:"footer",size:"l"},badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-special-offers"},allowedBadgeColors:["spectrum-yellow-300-special-offers","spectrum-gray-300-special-offers","spectrum-green-900-special-offers"],allowedBorderColors:["spectrum-yellow-300-special-offers","spectrum-gray-300-special-offers","spectrum-green-900-special-offers"],borderColor:{attribute:"border-color"}},rt=class extends y{constructor(r){super(r)}get headingSelector(){return'[slot="detail-m"]'}getGlobalCSS(){return Ua}renderLayout(){return Xr`${this.cardImage}
            <div class="body">
                <slot name="detail-m"></slot>
                <slot name="heading-xs"></slot>
                <slot name="heading-xs-price"></slot>
                <slot name="body-xs"></slot>
                <slot name="badge"></slot>
            </div>
            ${this.evergreen?Xr`
                      <div
                          class="detail-bg-container"
                          style="background: ${this.card.detailBg}"
                      >
                          <slot name="detail-bg"></slot>
                      </div>
                  `:Xr`
                      <hr />
                      ${this.secureLabelFooter}
                  `}
            <slot></slot>`}};p(rt,"variantStyle",Ko`
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
    `);import{html as Qo,css as Jo}from"./lit-all.min.js";var qa=`
:root {
    --merch-card-simplified-pricing-express-width: 311px;
}

merch-card[variant="simplified-pricing-express"] merch-badge {
    white-space: nowrap;
    color: var(--spectrum-white);
    font-size: var(--consonant-merch-card-detail-m-font-size);
    line-height: var(--consonant-merch-card-detail-m-line-height);
}

/* Grid layout for simplified-pricing-express cards */
merch-card-collection.simplified-pricing-express {
    display: grid;
    justify-content: center;
    justify-items: center;
    align-items: stretch;
    gap: 16px;
    /* Default to 1 column on mobile */
    grid-template-columns: 1fr;
}

/* Also support direct merch-card children and wrapped in p tags */
merch-card-collection.simplified-pricing-express p {
    margin: 0;
    font-size: inherit;
}

merch-card[variant="simplified-pricing-express"] [slot="body-xs"] p:has(mas-mnemonic) {
    padding-top: 16px;
}

@supports not selector(:has(*)) {
    merch-card[variant="simplified-pricing-express"] [slot="body-xs"] p:last-child {
        padding-top: 16px;
    }
}

merch-card[variant="simplified-pricing-express"] [slot="body-xs"] p:nth-child(2) {
    padding-top: 16px;
}

/* Desktop - 3 columns */
@media screen and ${x} {
    merch-card-collection.simplified-pricing-express {
        grid-template-columns: repeat(3, 1fr);
        max-width: calc(3 * var(--merch-card-simplified-pricing-express-width) + 32px);
        margin: 0 auto;
    }

    merch-card[variant="simplified-pricing-express"] [slot="body-xs"] {
        display: flex;
        flex-direction: column;
        min-height: var(--consonant-merch-card-simplified-pricing-express-description-height);
    }

    /* Push paragraph with mnemonics to the bottom using :has() */
    merch-card[variant="simplified-pricing-express"] [slot="body-xs"] p:has(mas-mnemonic) {
        margin-top: auto;
        min-height: var(--consonant-merch-card-simplified-pricing-express-icons-height);
    }

    /* Fallback for browsers without :has() support - target last paragraph */
    @supports not selector(:has(*)) {
        merch-card[variant="simplified-pricing-express"] [slot="body-xs"] p:last-child {
            margin-top: auto;
        }
    }

    /* Additional fallback - if second paragraph exists, assume it has mnemonics */
    merch-card[variant="simplified-pricing-express"] [slot="body-xs"] p:nth-child(2) {
        margin-top: auto;
    }
}

merch-card[variant="simplified-pricing-express"] p {
    margin: 0 !important; /* needed to override express-milo default margin to all <p> */
    font-size: inherit;
}

merch-card[variant="simplified-pricing-express"] [slot="heading-xs"] {
    font-size: 18px;
    font-weight: 700;
    line-height: 23.4px;
    color: var(--spectrum-gray-800);
}

merch-card[variant="simplified-pricing-express"] [slot="body-xs"] {
    font-size: var(--merch-card-simplified-pricing-express-body-xs-font-size, 14px);
    line-height: var(--merch-card-simplified-pricing-express-body-xs-line-height, 18.2px);
    color: var(--spectrum-gray-700);
    margin-bottom: 24px;
    justify-content: space-between;
}

merch-card[variant="simplified-pricing-express"] [slot="cta"] {
    display: block;
    width: 100%;
}

merch-card[variant="simplified-pricing-express"] [slot="cta"] sp-button,
merch-card[variant="simplified-pricing-express"] [slot="cta"] button,
merch-card[variant="simplified-pricing-express"] [slot="cta"] a.con-button {
    display: block;
    width: 100%;
    box-sizing: border-box;
    font-weight: var(--merch-card-simplified-pricing-express-cta-font-weight);
    line-height: var(--merch-card-simplified-pricing-express-cta-line-height);
    font-size: var(--merch-card-simplified-pricing-express-cta-font-size);
    margin: 0;
    border-radius: 26px;
    padding: 10px 24px;
    min-height: 48px;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] {
  display: flex;
  flex-direction: column;
}

merch-card[variant="simplified-pricing-express"] [data-template="price"] .price-strikethrough span.price-recurrence,
merch-card[variant="simplified-pricing-express"] [data-template="strikethrough"]:has(+ [data-template="price"]) span.price-recurrence {
    display: none;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"]:first-child {
  margin-inline-end: 8px;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child {
  display: flex;
  align-items: baseline;
  margin: 0;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] span[is="inline-price"] .price-recurrence {
  font-size: 12px;
  font-weight: 700;
  line-height: 15.6px;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] span[is="inline-price"] {
  font-size: var(--merch-card-simplified-pricing-express-price-p-font-size);
  line-height: var(--merch-card-simplified-pricing-express-price-p-line-height);
  font-weight: bold;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] span[is="inline-price"][data-template="optical"] {
  font-size: var(--merch-card-simplified-pricing-express-price-font-size);
  color: var(--spectrum-gray-800);
}

merch-card[variant="simplified-pricing-express"] [slot="price"] p {
  font-size: var(--merch-card-simplified-pricing-express-price-p-font-size);
  font-weight: var(--merch-card-simplified-pricing-express-price-p-font-weight);
  line-height: var(--merch-card-simplified-pricing-express-price-p-line-height);
}

merch-card[variant="simplified-pricing-express"] [slot="price"] p:empty {
  min-height: var(--merch-card-simplified-pricing-express-price-p-line-height);
}

/* Callout content styling */
merch-card[variant="simplified-pricing-express"] [slot="callout-content"] {
    color: var(--spectrum-gray-800);
    width: 100%;
    gap: 0;
    margin-bottom: var(--merch-card-simplified-pricing-express-padding);
    margin-top: 0;
}

merch-card[variant="simplified-pricing-express"] [slot="callout-content"] span[is='inline-price'] {
    font-weight: inherit;
}

merch-card[variant="simplified-pricing-express"] [slot="callout-content"] > p {
    background: transparent;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    padding: 0;
}

merch-card[variant="simplified-pricing-express"] [slot="callout-content"] > p:empty,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:empty {
    display: contents;
}

merch-card[variant="simplified-pricing-express"] [slot="callout-content"] a {
    color: var(--spectrum-indigo-900);
    font-weight: 700;
    text-decoration: inherit;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child .price-currency-symbol {
  font-size: var(--merch-card-simplified-pricing-express-price-font-size);
  font-weight: var(--merch-card-simplified-pricing-express-price-font-weight);
  line-height: var(--merch-card-simplified-pricing-express-price-line-height);
  width: 100%;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] .price-currency-symbol {
  font-size: var(--merch-card-simplified-pricing-express-price-p-font-size);
  font-weight: var(--merch-card-simplified-pricing-express-price-p-font-weight);
  line-height: var(--merch-card-simplified-pricing-express-price-p-line-height);
}

merch-card[variant="simplified-pricing-express"] [slot="price"] span[is="inline-price"] .price-unit-type {
  font-size: var(--merch-card-simplified-pricing-express-price-recurrence-font-size);
  font-weight: var(--merch-card-simplified-pricing-express-price-recurrence-font-weight);
  line-height: var(--merch-card-simplified-pricing-express-price-recurrence-line-height);
}

/* Strikethrough price styling */
merch-card[variant="simplified-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price,
merch-card[variant="simplified-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price-strikethrough,
merch-card[variant="simplified-pricing-express"] span.placeholder-resolved[data-template='strikethrough'],
merch-card[variant="simplified-pricing-express"] span[is="inline-price"][data-template='price'] .price-strikethrough {
  text-decoration: none;
  font-size: var(--merch-card-simplified-pricing-express-price-p-font-size);
  line-height: var(--merch-card-simplified-pricing-express-price-p-line-height);
}

merch-card[variant="simplified-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price,
merch-card[variant="simplified-pricing-express"] span[is="inline-price"][data-template='price'] .price-strikethrough,
merch-card[variant="simplified-pricing-express"] span[is="inline-price"][data-template='legal']  {
  color: var(--spectrum-gray-500);
}

merch-card[variant="simplified-pricing-express"] [slot="price"] p a {
  color: var(--spectrum-indigo-900);
  font-weight: 500;
  text-decoration: underline;
  white-space: nowrap;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"] .price-integer,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"] .price-decimals-delimiter,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"] .price-decimals {
  font-size: 22px;
  font-weight: 700;
  line-height: 28.6px;
  text-decoration-thickness: 2px;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"][data-template='strikethrough'] .price-integer,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"][data-template='strikethrough'] .price-decimals-delimiter,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"][data-template='strikethrough'] .price-decimals,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"][data-template='price'] .price-strikethrough .price-integer,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"][data-template='price'] .price-strikethrough .price-decimals-delimiter,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"][data-template='price'] .price-strikethrough .price-decimals {
  text-decoration: line-through;
}

/* Ensure non-first paragraph prices have normal font weight */
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:not(:first-child) span[is="inline-price"] .price-integer,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:not(:first-child) span[is="inline-price"] .price-decimals-delimiter,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:not(:first-child) span[is="inline-price"] .price-decimals,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:not(:first-child) span[is="inline-price"] .price-recurrence,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:not(:first-child) span[is="inline-price"] .price-unit-type {
  font-size: var(--merch-card-simplified-pricing-express-price-p-font-size);
  font-weight: var(--merch-card-simplified-pricing-express-price-p-font-weight);
  line-height: var(--merch-card-simplified-pricing-express-price-p-line-height);
}

/* Hide screen reader only text */
merch-card[variant="simplified-pricing-express"] sr-only {
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

/* mas-mnemonic inline styles for simplified-pricing-express */
merch-card[variant="simplified-pricing-express"] mas-mnemonic {
    display: inline-block;
    align-items: center;
    vertical-align: baseline;
    margin-inline-end: 8px;
    overflow: visible;
    padding-top: 0;
    --mas-mnemonic-tooltip-padding: 4px 8px;
}

/* Fix leftmost tooltip cutoff on mobile */
@media screen and ${A} {
  merch-card[variant="simplified-pricing-express"] [slot="body-xs"] p:first-child mas-mnemonic:first-child {
    --tooltip-left-offset: 0;
  }
}

/* Tooltip containers - overflow handled by Shadow DOM */

/* Mobile styles */
@media screen and ${A} {
  .collection-container.simplified-pricing-express {
    grid-template-columns: 1fr;
    width: 100%;
  }

  merch-card-collection.simplified-pricing-express {
    gap: 8px;
    width: 100%;
    max-width: 100%;
  }

  merch-card[variant="simplified-pricing-express"] {
    width: 100%;
    max-width: none;
    margin: 0 auto;
  }

  /* Badge alignment on mobile */
  merch-card[variant="simplified-pricing-express"] [slot="badge"] {
    font-size: 16px;
  }

  /* Trial badge alignment on mobile */
  merch-card[variant="simplified-pricing-express"] [slot="trial-badge"] {
    margin-left: 0;
    align-self: flex-start;
  }

  merch-card[variant="simplified-pricing-express"] [slot="trial-badge"] merch-badge {
    font-size: 12px;
    line-height: 20.8px;
  }

  /* Fix spacing between cards on mobile */
  main merch-card-collection.simplified-pricing-express p:has(merch-card[variant="simplified-pricing-express"]),
  main .section p:has(merch-card[variant="simplified-pricing-express"]) {
    margin: 0;
  }
}

/* Collapse/expand styles for mobile only */
@media screen and ${A} {
  /* Base transition for smooth animation */
  merch-card[variant="simplified-pricing-express"] {
    transition: max-height 0.5s ease-out;
  }

  merch-card[variant="simplified-pricing-express"] [slot="body-xs"],
  merch-card[variant="simplified-pricing-express"] [slot="price"],
  merch-card[variant="simplified-pricing-express"] [slot="callout-content"],
  merch-card[variant="simplified-pricing-express"] [slot="cta"] {
    transition: opacity 0.5s ease-out, max-height 0.5s ease-out;
  }

  /* Collapsed state - hide content sections with animation */
  merch-card[variant="simplified-pricing-express"]:not([data-expanded="true"]) [slot="body-xs"],
  merch-card[variant="simplified-pricing-express"]:not([data-expanded="true"]) [slot="price"],
  merch-card[variant="simplified-pricing-express"]:not([data-expanded="true"]) [slot="callout-content"],
  merch-card[variant="simplified-pricing-express"]:not([data-expanded="true"]) [slot="cta"],
  merch-card[variant="simplified-pricing-express"][data-expanded="false"] [slot="body-xs"],
  merch-card[variant="simplified-pricing-express"][data-expanded="false"] [slot="price"],
  merch-card[variant="simplified-pricing-express"][data-expanded="false"] [slot="callout-content"],
  merch-card[variant="simplified-pricing-express"][data-expanded="false"] [slot="cta"] {
    opacity: 0;
    max-height: 0;
    margin: 0;
    padding: 0;
    overflow: hidden;
    pointer-events: none;
  }

  /* Expanded state - show content with animation */
  merch-card[variant="simplified-pricing-express"][data-expanded="true"] [slot="body-xs"],
  merch-card[variant="simplified-pricing-express"][data-expanded="true"] [slot="price"],
  merch-card[variant="simplified-pricing-express"][data-expanded="true"] [slot="callout-content"],
  merch-card[variant="simplified-pricing-express"][data-expanded="true"] [slot="cta"] {
    opacity: 1;
    pointer-events: auto;
  }

  /* Collapsed card should have fixed height and padding */
  merch-card[variant="simplified-pricing-express"][data-expanded="false"],
  merch-card[variant="simplified-pricing-express"]:not([data-expanded="true"]) {
    max-height: 57px;
    padding: 0;
    border-radius: 8px;
  }

  merch-card[variant="simplified-pricing-express"][gradient-border="true"][data-expanded="false"],
  merch-card[variant="simplified-pricing-express"][gradient-border="true"]:not([data-expanded="true"]) {
    max-height: 85px;
  }
}

/* Tablet styles - responsive full width with padding */
@media screen and ${T} and ${N} {
  .collection-container.simplified-pricing-express {
    display: block;
    width: 100%;
    padding: 0 32px;
    box-sizing: border-box;
  }

  merch-card-collection.simplified-pricing-express {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  merch-card[variant="simplified-pricing-express"] {
      width: 100%;
      min-width: unset;
      max-width: 100%;
  }
}

merch-card[variant="simplified-pricing-express"] [slot="cta"] sp-button[variant="accent"],
merch-card[variant="simplified-pricing-express"] [slot="cta"] button.spectrum-Button--accent,
merch-card[variant="simplified-pricing-express"] [slot="cta"] a.spectrum-Button.spectrum-Button--accent {
    background-color: var(--spectrum-indigo-900);
    color: var(--spectrum-white, #ffffff);
    width: 100%;
}

/* Ensure text color is applied to the label span element for accessibility */
merch-card[variant="simplified-pricing-express"] [slot="cta"] sp-button[variant="accent"] .spectrum-Button-label,
merch-card[variant="simplified-pricing-express"] [slot="cta"] button.spectrum-Button--accent .spectrum-Button-label,
merch-card[variant="simplified-pricing-express"] [slot="cta"] a.spectrum-Button.spectrum-Button--accent .spectrum-Button-label {
    color: var(--spectrum-white, #ffffff);
}

/* Small font size button styles for desktop when button text is too long */
@media screen and ${x} {
  merch-card[variant="simplified-pricing-express"] [slot="cta"] sp-button.small-font-size-button,
  merch-card[variant="simplified-pricing-express"] [slot="cta"] button.small-font-size-button,
  merch-card[variant="simplified-pricing-express"] [slot="cta"] a.con-button.small-font-size-button,
  merch-card[variant="simplified-pricing-express"] [slot="cta"] a.spectrum-Button.small-font-size-button,
  merch-card[variant="simplified-pricing-express"] a[slot="cta"].small-font-size-button {
      font-size: var(--merch-card-simplified-pricing-express-body-xs-font-size, 14px);
  }
}
`;var Zr={title:{tag:"h3",slot:"heading-xs",maxCount:250,withSuffix:!0},badge:{tag:"div",slot:"badge",default:"spectrum-blue-400"},allowedBadgeColors:["spectrum-blue-400","spectrum-gray-300","spectrum-yellow-300","gradient-purple-blue","gradient-firefly-spectrum"],description:{tag:"div",slot:"body-xs",maxCount:2e3,withSuffix:!1},prices:{tag:"div",slot:"price"},callout:{tag:"div",slot:"callout-content",editorLabel:"Price description"},ctas:{slot:"cta",size:"XL"},borderColor:{attribute:"border-color",specialValues:{gray:"var(--spectrum-gray-300)",blue:"var(--spectrum-blue-400)","gradient-purple-blue":"linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)","gradient-firefly-spectrum":"linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%)"}},disabledAttributes:["badgeColor","badgeBorderColor","trialBadgeColor","trialBadgeBorderColor"],supportsDefaultChild:!0},it=class extends y{getGlobalCSS(){return qa}get aemFragmentMapping(){return Zr}get headingSelector(){return'[slot="heading-xs"]'}get badge(){return this.card.querySelector('[slot="badge"]')}syncHeights(){if(this.card.getBoundingClientRect().width===0)return;let r=this.card.shadowRoot;if(!r)return;["header","price-container","cta"].forEach(a=>this.updateCardElementMinHeight(r.querySelector(`.${a}`),a));let t=this.card.querySelector('[slot="body-xs"]');t&&this.updateCardElementMinHeight(t,"description");let i=this.card.querySelector('[slot="body-xs"] p:has(mas-mnemonic)');i&&this.updateCardElementMinHeight(i,"icons")}async postCardUpdateHook(){if(!this.card.isConnected)return;await super.postCardUpdateHook();let r=this.getContainer();if(!r)return;let t=r.querySelectorAll(`merch-card[variant="${this.card.variant}"]`),i=34;t.forEach(a=>{a.classList.remove("small-font-size-button"),a.querySelectorAll('[slot="cta"] sp-button, [slot="cta"] button, [slot="cta"] a.con-button, [slot="cta"] a.spectrum-Button, a[slot="cta"]').forEach(o=>{let s=o.textContent.trim().length>i;o.classList.toggle("small-font-size-button",s)})}),w.isDesktopOrUp&&t.forEach(a=>a.variantLayout?.syncHeights?.())}connectedCallbackHook(){!this.card||this.card.failed||(this.setupAccordion(),this.card?.hasAttribute("data-default-card")&&!Ut()&&this.card.setAttribute("data-expanded","true"),this.observeVisibility())}resyncSiblings(){let r=this.getContainer();r&&r.querySelectorAll(`merch-card[variant="${this.card.variant}"]`).forEach(t=>t.variantLayout?.syncHeights?.())}observeVisibility(){typeof ResizeObserver>"u"||(this.lastSyncedWidth=0,this.sizeObserver=new ResizeObserver(()=>{let r=this.card.getBoundingClientRect().width;r<=2||r===this.lastSyncedWidth||(this.lastSyncedWidth=r,this.resyncSiblings())}),this.sizeObserver.observe(this.card))}setupAccordion(){let r=this.card;if(!r)return;let t=()=>{if(Ut())r.removeAttribute("data-expanded");else{let a=r.hasAttribute("data-default-card");r.setAttribute("data-expanded",a?"true":"false")}};t();let i=window.matchMedia(A);this.mediaQueryListener=()=>{t()},i.addEventListener("change",this.mediaQueryListener)}disconnectedCallbackHook(){this.mediaQueryListener&&window.matchMedia(A).removeEventListener("change",this.mediaQueryListener),this.sizeObserver?.disconnect(),this.sizeObserver=null}handleChevronClick(r){r.preventDefault(),r.stopPropagation(),this.toggleExpanded()}handleCardClick(r){r.target.closest('.chevron-button, mas-mnemonic, button, a, [role="button"]')||(r.preventDefault(),this.toggleExpanded())}toggleExpanded(){let r=this.card;if(!r||Ut())return;let a=r.getAttribute("data-expanded")==="true"?"false":"true";r.setAttribute("data-expanded",a)}renderLayout(){return Qo`
            <div
                class="badge-wrapper"
                style="${this.badge?"":"visibility: hidden"}"
            >
                <slot name="badge"></slot>
            </div>
            <div class="card-content" @click=${r=>this.handleCardClick(r)}>
                <div class="header">
                    <slot name="heading-xs"></slot>
                    <slot name="trial-badge"></slot>
                    <button
                        class="chevron-button"
                        @click=${r=>this.handleChevronClick(r)}
                    >
                        <svg
                            class="chevron-icon"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M12 15.5L5 8.5L6.4 7.1L12 12.7L17.6 7.1L19 8.5L12 15.5Z"
                                fill="currentColor"
                            />
                        </svg>
                    </button>
                </div>
                <div class="description">
                    <slot name="body-xs"></slot>
                </div>
                <div class="price-container">
                    <slot name="price"></slot>
                    <slot name="callout-content"></slot>
                </div>
                <div class="cta">
                    <slot name="cta"></slot>
                </div>
            </div>
            <slot></slot>
        `}};p(it,"variantStyle",Jo`
        :host([variant='simplified-pricing-express']) {
            --merch-card-simplified-pricing-express-width: 365px;
            --merch-card-simplified-pricing-express-padding: 24px;
            --merch-card-simplified-pricing-express-padding-mobile: 16px;
            --merch-card-simplified-pricing-express-price-font-size: 22px;
            --merch-card-simplified-pricing-express-price-font-weight: 700;
            --merch-card-simplified-pricing-express-price-line-height: 28.6px;
            --merch-card-simplified-pricing-express-price-currency-font-size: 22px;
            --merch-card-simplified-pricing-express-price-currency-font-weight: 700;
            --merch-card-simplified-pricing-express-price-currency-line-height: 28.6px;
            --merch-card-simplified-pricing-express-price-currency-symbol-font-size: 22px;
            --merch-card-simplified-pricing-express-price-currency-symbol-font-weight: 700;
            --merch-card-simplified-pricing-express-price-currency-symbol-line-height: 28.6px;
            --merch-card-simplified-pricing-express-price-recurrence-font-size: 12px;
            --merch-card-simplified-pricing-express-price-recurrence-font-weight: 700;
            --merch-card-simplified-pricing-express-price-recurrence-line-height: 15.6px;
            --merch-card-simplified-pricing-express-body-xs-font-size: 14px;
            --merch-card-simplified-pricing-express-body-xs-line-height: 18.2px;
            --merch-card-simplified-pricing-express-price-p-font-size: 12px;
            --merch-card-simplified-pricing-express-price-p-font-weight: 400;
            --merch-card-simplified-pricing-express-price-p-line-height: 15.6px;
            --merch-card-simplified-pricing-express-cta-font-size: 18px;
            --merch-card-simplified-pricing-express-cta-font-weight: 700;
            --merch-card-simplified-pricing-express-cta-line-height: 23.4px;

            /* Gradient definitions */
            --gradient-purple-blue: linear-gradient(
                96deg,
                #b539c8 0%,
                #7155fa 66%,
                #3b63fb 100%
            );
            --gradient-firefly-spectrum: linear-gradient(
                96deg,
                #d73220 0%,
                #d92361 33%,
                #7155fa 100%
            );
            width: var(--merch-card-simplified-pricing-express-width);
            max-width: var(--merch-card-simplified-pricing-express-width);
            background: transparent;
            border: none;
            display: flex;
            flex-direction: column;
            overflow: visible;
            box-sizing: border-box;
            position: relative;
        }

        :host([variant='simplified-pricing-express']) .badge-wrapper {
            padding: 4px 24px;
            border-radius: 8px 8px 0 0;
            text-align: center;
            font-size: 12px;
            font-weight: 700;
            line-height: 15.6px;
            color: var(--spectrum-gray-800);
            position: relative;
            min-height: 23px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        :host([variant='simplified-pricing-express']) .card-content {
            border-radius: 8px;
            padding: var(--merch-card-simplified-pricing-express-padding);
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: var(--consonant-merch-spacing-xxs);
            position: relative;
        }

        :host([variant='simplified-pricing-express']) .card-content > * {
            position: relative;
        }

        :host(
                [variant='simplified-pricing-express']:not(
                        [gradient-border='true']
                    )
            )
            .card-content {
            background: var(--spectrum-gray-50);
            border: 1px solid
                var(
                    --consonant-merch-card-border-color,
                    var(--spectrum-gray-100)
                );
        }

        :host(
                [variant='simplified-pricing-express']:has(
                        [slot='badge']:not(:empty)
                    )
            )
            .card-content {
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        }

        :host(
                [variant='simplified-pricing-express']:not(
                        [gradient-border='true']
                    ):has([slot='badge']:not(:empty))
            )
            .card-content {
            border-top: 1px solid
                var(
                    --consonant-merch-card-border-color,
                    var(--spectrum-gray-100)
                );
        }

        :host(
                [variant='simplified-pricing-express']:has(
                        [slot='badge']:not(:empty)
                    )
            )
            .badge-wrapper {
            margin-bottom: -2px;
        }

        :host([variant='simplified-pricing-express'][gradient-border='true'])
            .badge-wrapper {
            border: none;
            margin-bottom: -6px;
            padding-bottom: 10px;
        }

        :host([variant='simplified-pricing-express'][gradient-border='true'])
            .badge-wrapper
            ::slotted(*) {
            color: white !important;
        }

        :host([variant='simplified-pricing-express'][gradient-border='true'])
            .card-content {
            border: none;
            padding: calc(
                var(--merch-card-simplified-pricing-express-padding) + 2px
            );
            border-radius: 8px;
        }

        :host([variant='simplified-pricing-express'][gradient-border='true'])
            .card-content::before {
            content: '';
            position: absolute;
            top: 1px;
            left: 1px;
            right: 1px;
            bottom: 1px;
            background: var(--spectrum-gray-50);
            border-radius: 7px;
            z-index: 0;
            pointer-events: none;
        }

        :host(
                [variant='simplified-pricing-express'][border-color='gradient-purple-blue']
            )
            .badge-wrapper,
        :host(
                [variant='simplified-pricing-express'][border-color='gradient-purple-blue']
            )
            .card-content {
            background: var(--gradient-purple-blue);
        }

        :host(
                [variant='simplified-pricing-express'][border-color='gradient-firefly-spectrum']
            )
            .badge-wrapper,
        :host(
                [variant='simplified-pricing-express'][border-color='gradient-firefly-spectrum']
            )
            .card-content {
            background: var(--gradient-firefly-spectrum);
        }

        :host(
                [variant='simplified-pricing-express'][gradient-border='true']:has(
                        [slot='badge']:not(:empty)
                    )
            )
            .card-content {
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
        }

        :host(
                [variant='simplified-pricing-express'][gradient-border='true']:has(
                        [slot='badge']:not(:empty)
                    )
            )
            .card-content::before {
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
        }

        :host([variant='simplified-pricing-express']) .header {
            display: flex;
            flex-direction: row;
            align-items: flex-start;
            justify-content: space-between;
            gap: 8px;
        }

        :host([variant='simplified-pricing-express']) [slot='heading-xs'] {
            font-size: 18px;
            font-weight: 700;
            line-height: 23.4px;
            color: var(--spectrum-gray-800);
        }

        :host([variant='simplified-pricing-express']) .description {
            gap: 16px;
            display: flex;
            flex-direction: column;
        }

        :host([variant='simplified-pricing-express']) .price-container {
            display: flex;
            flex-direction: column;
            margin-top: auto;
        }

        :host([variant='simplified-pricing-express']) [slot='callout-content'] {
            font-size: 12px;
            font-weight: 400;
            font-style: normal;
            line-height: 18px;
            color: var(--spectrum-gray-800);
            background: transparent;
            margin-top: 2px;
        }

        /* Desktop only - Fixed heights for alignment */
        @media (min-width: 1200px) {
            :host([variant='simplified-pricing-express']) .card-content {
                height: 100%;
            }

            :host([variant='simplified-pricing-express']) .header {
                min-height: var(
                    --consonant-merch-card-simplified-pricing-express-header-height
                );
            }

            :host([variant='simplified-pricing-express']) .description {
                flex: 1;
            }

            :host([variant='simplified-pricing-express']) .price-container {
                min-height: var(
                    --consonant-merch-card-simplified-pricing-express-price-container-height
                );
            }

            :host([variant='simplified-pricing-express']) .cta {
                flex-shrink: 0;
                min-height: var(
                    --consonant-merch-card-simplified-pricing-express-cta-height
                );
            }
        }

        :host([variant='simplified-pricing-express']) .cta,
        :host([variant='simplified-pricing-express']) .cta ::slotted(*) {
            width: 100%;
            display: block;
        }

        /* Mobile accordion styles */
        :host([variant='simplified-pricing-express']) .chevron-button {
            display: none;
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            transition: transform 0.5s ease;
        }

        :host([variant='simplified-pricing-express']) .chevron-icon {
            width: 24px;
            height: 24px;
            color: var(--spectrum-gray-800);
            transition: transform 0.5s ease;
        }

        /* Chevron rotation based on parent card's data-expanded attribute */
        :host-context(merch-card[data-expanded='false']) .chevron-icon {
            transform: rotate(0deg);
        }
        :host-context(merch-card[data-expanded='true']) .chevron-icon {
            transform: rotate(180deg);
        }

        /* Tablet styles - full width, no accordion */
        @media (min-width: 768px) and (max-width: 1199px) {
            :host([variant='simplified-pricing-express']) {
                width: 100%;
                max-width: 100%;
            }

            :host(
                    [variant='simplified-pricing-express'][gradient-border='true']
                )
                .card-content,
            :host(
                    [variant='simplified-pricing-express']:not(
                            [gradient-border='true']
                        )
                )
                .card-content {
                padding: var(
                    --merch-card-simplified-pricing-express-padding-mobile
                );
            }

            /* Hide badge-wrapper on tablet except for gradient borders */
            :host(
                    [variant='simplified-pricing-express']:not(
                            [gradient-border='true']
                        )
                )
                .badge-wrapper {
                display: none;
            }
        }

        /* Mobile only styles - accordion behavior */
        @media (max-width: 767px) {
            :host([variant='simplified-pricing-express']) {
                width: 100%;
                max-width: 100%;
                min-height: auto;
                cursor: pointer;
                transition: all 0.5s ease;
            }

            :host([variant='simplified-pricing-express']) .header {
                position: relative;
                justify-content: space-between;
                gap: 8px;
            }

            :host([variant='simplified-pricing-express']) .chevron-button {
                display: block;
                flex-shrink: 0;
                margin-left: auto;
            }

            :host(
                    [variant='simplified-pricing-express'][gradient-border='true']
                )
                .card-content,
            :host(
                    [variant='simplified-pricing-express']:not(
                            [gradient-border='true']
                        )
                )
                .card-content {
                padding: calc(
                    var(
                            --merch-card-simplified-pricing-express-padding-mobile
                        ) +
                        2px
                );
                transition:
                    max-height 0.5s ease-out,
                    padding 0.5s ease-out;
            }

            /* Hide badge-wrapper on mobile except for gradient borders */
            :host(
                    [variant='simplified-pricing-express']:not(
                            [gradient-border='true']
                        )
                )
                .badge-wrapper {
                display: none;
            }

            /* Non-gradient border collapsed state - limit card-content height */
            :host(
                    [variant='simplified-pricing-express']:not(
                            [gradient-border='true']
                        )[data-expanded='false']
                )
                .card-content {
                max-height: 50px;
                overflow: hidden;
                transition:
                    max-height 0.5s ease-out,
                    padding 0.5s ease-out;
            }

            /* Gradient border collapsed state - limit badge-wrapper height */
            :host(
                    [variant='simplified-pricing-express'][gradient-border='true'][data-expanded='false']
                )
                .card-content {
                max-height: 50px;
                overflow: hidden;
                padding: 16px 16px 35px 16px;
                transition:
                    max-height 0.5s ease-out,
                    padding 0.5s ease-out;
            }

            /* Expanded state - explicit max-height for animation (CSS can't animate to 'auto') */
            :host([variant='simplified-pricing-express'][data-expanded='true'])
                .card-content {
                max-height: 1000px;
            }
        }
    `);import{html as ja,css as es}from"./lit-all.min.js";var Va=`
:root {
    --merch-card-full-pricing-express-width: 378px;
    --merch-card-full-pricing-express-mobile-width: 365px;
}

/* Collection grid layout */
merch-card-collection.full-pricing-express {
    display: grid;
    justify-content: center;
    justify-items: center;
    align-items: stretch;
    gap: 16px;
}

/* Mobile - 1 column */
merch-card-collection.full-pricing-express {
    grid-template-columns: 1fr;
    max-width: 100%;
    margin: 0 auto;
    padding: 0 16px;
    box-sizing: border-box;
}

/* Mobile - override Milo .content max-width for full-width cards */
@media screen and (max-width: 767px) {
    .section:has(.collection-container.full-pricing-express) .content {
        max-width: 100%;
        margin: 0 auto;
    }

    .collection-container.full-pricing-express {
        display: block;
        width: 100%;
        max-width: 100%;
    }
}

/* Tablet - 2 columns (768px-1199px) */
@media screen and (min-width: 768px) and (max-width: 1199px) {
    merch-card-collection.full-pricing-express {
        grid-template-columns: repeat(2, 1fr);
        justify-items: stretch;
        max-width: 100%;
        padding: 0 16px;
    }

    /* Override Milo .content max-width for full-width cards */
    .section:has(.collection-container.full-pricing-express) .content {
        max-width: 100%;
        margin: 0 auto;
    }

    .collection-container.full-pricing-express {
        display: block;
        width: 100%;
        max-width: 100%;
    }
}

/* Desktop small - 2 columns */
@media screen and ${x} and (max-width: 1399px) {
    merch-card-collection.full-pricing-express {
        grid-template-columns: repeat(2, 1fr);
        max-width: calc(2 * var(--merch-card-full-pricing-express-width) + 16px);
    }
}

/* Desktop large - 3 columns */
@media screen and (min-width: 1400px) {
    merch-card-collection.full-pricing-express {
        grid-template-columns: repeat(3, 1fr);
        max-width: calc(3 * var(--merch-card-full-pricing-express-width) + 32px);
    }
}

/* Remove default paragraph margins */
merch-card[variant="full-pricing-express"] p {
    margin: 0 !important;
    font-size: inherit;
}

/* Slot-specific styles */
merch-card[variant="full-pricing-express"] [slot="heading-xs"] {
    font-size: 20px;
    font-weight: 700;
    line-height: 26px;
    color: var(--spectrum-gray-800);
    margin-bottom: 8px;
}

/* Title font size on mobile and tablet */
@media (max-width: 1199px) {
    merch-card[variant="full-pricing-express"] [slot="heading-xs"] {
        font-size: 18px;
        line-height: 23.4px;
    }
}

/* Inline mnemonics inside heading */
merch-card[variant="full-pricing-express"] [slot="heading-xs"] mas-mnemonic {
    display: inline-flex;
    --mod-img-width: 20px;
    --mod-img-height: 20px;
    margin-right: 8px;
    align-items: center;
    vertical-align: middle;
    padding-bottom: 3px;
}

merch-card[variant="full-pricing-express"] [slot="heading-xs"] mas-mnemonic img {
    width: 20px;
    height: 20px;
    object-fit: contain;
}

/* Icons slot styling */
merch-card[variant="full-pricing-express"] [slot="icons"] {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
}

/* Premium/crown icon sizing on mobile and tablet (14x14px) */
@media (max-width: 1199px) {
    merch-card[variant="full-pricing-express"] [slot="heading-xs"] merch-icon,
    merch-card[variant="full-pricing-express"] [slot="heading-xs"] mas-mnemonic merch-icon,
    merch-card[variant="full-pricing-express"] [slot="heading-xs"] mas-mnemonic {
        --mod-img-width: 14px;
        --mod-img-height: 14px;
        vertical-align: baseline;
    }

    merch-card[variant="full-pricing-express"] [slot="heading-xs"] mas-mnemonic img {
        width: 14px;
        height: 14px;
    }
}


merch-card[variant="full-pricing-express"] [slot="trial-badge"] {
    position: absolute;
    top: -8px;
    right: 16px;
    font-size: var(--merch-card-full-pricing-express-trial-badge-font-size);
    font-weight: var(--merch-card-full-pricing-express-trial-badge-font-weight);
    line-height: var(--merch-card-full-pricing-express-trial-badge-line-height);
    z-index: 0;
    max-width: calc(100% - 24px);
}

merch-card[variant="full-pricing-express"] [slot="trial-badge"] merch-badge {
    display: -webkit-box;
    max-width: 240px;
    border-radius: 4px;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    font-size: var(--merch-card-full-pricing-express-trial-badge-font-size);
    font-weight: var(--merch-card-full-pricing-express-trial-badge-font-weight);
    line-height: var(--merch-card-full-pricing-express-trial-badge-line-height);
    color: var(--spectrum-express-accent);
    overflow: hidden;
}

merch-card[variant="full-pricing-express"] [slot="trial-badge"]:empty {
    display: none;
}

merch-card[variant="full-pricing-express"] [slot="body-s"] {
    font-size: 16px;
    line-height: 20.8px;
    color: var(--spectrum-gray-900);
}

merch-card[variant="full-pricing-express"] [slot="body-s"] hr {
    margin-top: 0;
    margin-bottom: 24px;
    background-color: #E9E9E9;
}

merch-card[variant="full-pricing-express"] [slot="shortDescription"] {
    font-size: 16px;
    line-height: 20.8px;
    color: var(--spectrum-gray-700);
    margin-bottom: var(--merch-card-full-pricing-express-section-gap);
}

merch-card[variant="full-pricing-express"] [slot="body-s"] ul {
    margin: 0;
    padding-left: 20px;
    list-style: disc;
}

merch-card[variant="full-pricing-express"] [slot="body-s"] li {
    margin-bottom: 8px;
}

merch-card[variant="full-pricing-express"] [slot="body-s"] li:last-child {
    margin-bottom: 0;
}

merch-card[variant="full-pricing-express"] [slot="body-s"] p {
    padding: 8px;
}

merch-card[variant="full-pricing-express"] [slot="body-s"] p a {
    color: var(--spectrum-indigo-900);
    font-weight: 700;
    text-decoration: underline;
}

/* Feature list hyperlinks should be underlined */
merch-card[variant="full-pricing-express"] [slot="body-s"] ul a,
merch-card[variant="full-pricing-express"] [slot="body-s"] li a,
merch-card[variant="full-pricing-express"] [slot="body-xs"] a {
    color: var(--spectrum-indigo-900);
    text-decoration: underline;
}

merch-card[variant="full-pricing-express"] [slot="body-s"] .button-container {
    margin: 0;
    padding: 0;
}

merch-card[variant="full-pricing-express"] [slot="body-s"] p:last-child a {
    text-decoration: none;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-flow: column;
    color: var(--spectrum-indigo-900);
    background: transparent;
    border: none;
    margin: 0;
    font-size: 16px;
    padding-top: 0;
}

merch-card[variant="full-pricing-express"] [slot="body-s"] p:last-child a:hover {
    background-color: initial;
    border: none;
}

/* Price styling */
merch-card[variant="full-pricing-express"] [slot="price"] {
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: center;
}

merch-card[variant="full-pricing-express"] [data-template="price"] .price-strikethrough span.price-recurrence,
merch-card[variant="full-pricing-express"] [data-template="strikethrough"]:has(+ [data-template="price"]) span.price-recurrence {
    display: none;
}

merch-card[variant="full-pricing-express"] [slot="price"] p strong {
    display: inline-flex;
    justify-content: center;
    width: 100%;
}

merch-card[variant="full-pricing-express"] [slot="price"] > p:first-child {
    display: flex;
    align-items: baseline;
    margin: 0;
}

merch-card[variant="full-pricing-express"] [slot="price"] > p span[is="inline-price"]:first-child {
    margin-right: 8px;
}

merch-card[variant="full-pricing-express"] [slot="price"] span[is="inline-price"][data-template="optical"] {
    font-size: var(--merch-card-full-pricing-express-price-font-size);
    color: var(--spectrum-gray-800);
}

merch-card[variant="full-pricing-express"] [slot="price"] .price-strikethrough .price-integer,
merch-card[variant="full-pricing-express"] [slot="price"] .price-strikethrough .price-decimals-delimiter,
merch-card[variant="full-pricing-express"] [slot="price"] .price-strikethrough .price-decimals {
    font-size: 28px;
    font-weight: 700;
    line-height: 36.4px;
}

merch-card[variant="full-pricing-express"] [slot="price"] .price-currency-symbol,
merch-card[variant="full-pricing-express"] [slot="price"] .price-integer,
merch-card[variant="full-pricing-express"] [slot="price"] .price-decimals-delimiter,
merch-card[variant="full-pricing-express"] [slot="price"] .price-currency-space,
merch-card[variant="full-pricing-express"] [slot="price"] .price-decimals {
    font-size: var(--merch-card-full-pricing-express-price-font-size);
    font-weight: var(--merch-card-full-pricing-express-price-font-weight);
    line-height: var(--merch-card-full-pricing-express-price-line-height);
}

merch-card[variant="full-pricing-express"] [slot="price"] span[is="inline-price"] .price-recurrence,
merch-card[variant="full-pricing-express"] [slot="price"] span[is="inline-price"] .price-unit-type {
    font-size: 12px;
    font-weight: bold;
    line-height: 15.6px;
    color: #222;
}

merch-card[variant="full-pricing-express"] [slot="price"] p {
    font-size: 12px;
    font-weight: 400;
    line-height: 15.6px;
    color: var(--spectrum-gray-700);
}

merch-card[variant="full-pricing-express"] [slot="price"] > p span[is="inline-price"]:only-child {
    color: rgb(34,34,34);
}

/* Target inline prices in paragraphs that are not the first paragraph */
merch-card[variant="full-pricing-express"] [slot="price"] > p:not(:first-child) span[is="inline-price"] {
    font-size: 12px;
    font-weight: 500;
    line-height: 15.6px;
    margin-right: 0;
}

merch-card[variant="full-pricing-express"] [slot="price"] > p:nth-child(3) span[is="inline-price"] .price-currency-symbol,
merch-card[variant="full-pricing-express"] [slot="price"] > p:nth-child(3) span[is="inline-price"] .price-integer,
merch-card[variant="full-pricing-express"] [slot="price"] > p:nth-child(3) span[is="inline-price"] .price-decimals-delimiter,
merch-card[variant="full-pricing-express"] [slot="price"] > p:nth-child(3) span[is="inline-price"] .price-decimals,
merch-card[variant="full-pricing-express"] [slot="price"] > p:nth-child(3) span[is="inline-price"] .price-recurrence,
merch-card[variant="full-pricing-express"] [slot="price"] > p:nth-child(3) span[is="inline-price"] .price-unit-type {
    font-size: 12px;
    font-weight: normal;
    line-height: 15.6px;
}

merch-card[variant="full-pricing-express"] [slot="price"] p a {
    color: var(--spectrum-indigo-900);
    font-weight: 700;
    text-decoration: none;
}

/* Callout content styling - inside price container */
merch-card[variant="full-pricing-express"] [slot="callout-content"] {
    color: var(--spectrum-gray-800);
    width: 100%;
    display: block;
    margin: 0;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
}

merch-card[variant="full-pricing-express"] [slot="callout-content"] span[is='inline-price'] {
    font-size: inherit;
    font-weight: inherit;
    line-height: inherit;
}

merch-card[variant="full-pricing-express"] [slot="callout-content"] > p {
    background: transparent;
    padding: 0;
}

merch-card[variant="full-pricing-express"] [slot="callout-content"] > p:empty,
merch-card[variant="full-pricing-express"] [slot="price"] > p:empty {
    display: contents;
}

merch-card[variant="full-pricing-express"] [slot="callout-content"] a {
    color: var(--spectrum-indigo-900);
    font-weight: 700;
    text-decoration: inherit;
}

/* Strikethrough price styling */
merch-card[variant="full-pricing-express"] span[is="inline-price"] .price-unit-type,
merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price,
merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price-strikethrough,
merch-card[variant="full-pricing-express"] span.placeholder-resolved[data-template='strikethrough'],
merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='price'] .price-strikethrough {
    text-decoration: none;
    font-size: 12px;
    line-height: 15.6px;
}

merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price,
merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='price'] .price-strikethrough {
    color: #8F8F8F;
}

merch-card[variant="full-pricing-express"] [slot="price"] span[is="inline-price"][data-template='strikethrough'] + span[is="inline-price"],
merch-card[variant="full-pricing-express"] [slot="price"] span[is="inline-price"][data-template='strikethrough'] ~ strong {
    color: #222222;
}

merch-card[variant="full-pricing-express"] [slot="price"] p .heading-xs,
merch-card[variant="full-pricing-express"] [slot="price"] p .heading-s,
merch-card[variant="full-pricing-express"] [slot="price"] p .heading-m,
merch-card[variant="full-pricing-express"] [slot="price"] p .heading-l {
    font-size: 22px;
    line-height: 28.6px;
    text-align: center;
    width: 100%;
}

merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price-integer,
merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price-decimals-delimiter,
merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price-decimals,
merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='price'] .price-strikethrough .price-integer,
merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='price'] .price-strikethrough .price-decimals-delimiter,
merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='price'] .price-strikethrough .price-decimals {
    text-decoration: line-through;
    text-decoration-thickness: 2px;
}

/* CTA button styling */
merch-card[variant="full-pricing-express"] [slot="cta"] {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

merch-card[variant="full-pricing-express"] [slot="cta"] sp-button,
merch-card[variant="full-pricing-express"] [slot="cta"] button,
merch-card[variant="full-pricing-express"] [slot="cta"] a.con-button,
merch-card[variant="full-pricing-express"] [slot="cta"] a.spectrum-Button {
    --mod-button-height: 40px;
    --mod-button-top-to-text: 9px;
    --mod-button-bottom-to-text: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    box-sizing: border-box;
    font-weight: 700;
    font-size: 16px;
    line-height: 20.8px;
    margin: 0;
    padding: 0 24px;
    border-radius: 26px;
    min-height: 40px;
}

merch-card[variant="full-pricing-express"] [slot="cta"] sp-button[variant="accent"],
merch-card[variant="full-pricing-express"] [slot="cta"] button.spectrum-Button--accent,
merch-card[variant="full-pricing-express"] [slot="cta"] a.spectrum-Button.spectrum-Button--accent {
    background-color: var(--spectrum-indigo-900);
    color: var(--spectrum-white, #ffffff);
    width: 100%;
}

/* Ensure text color is applied to the label span element for accessibility */
merch-card[variant="full-pricing-express"] [slot="cta"] sp-button[variant="accent"] .spectrum-Button-label,
merch-card[variant="full-pricing-express"] [slot="cta"] button.spectrum-Button--accent .spectrum-Button-label,
merch-card[variant="full-pricing-express"] [slot="cta"] a.spectrum-Button.spectrum-Button--accent .spectrum-Button-label {
    color: var(--spectrum-white, #ffffff);
}

/* Small font size button styles for desktop when button text is too long */
@media screen and ${x} {
    merch-card[variant="full-pricing-express"] [slot="cta"] sp-button.small-font-size-button,
    merch-card[variant="full-pricing-express"] [slot="cta"] button.small-font-size-button,
    merch-card[variant="full-pricing-express"] [slot="cta"] a.con-button.small-font-size-button,
    merch-card[variant="full-pricing-express"] [slot="cta"] a.spectrum-Button.small-font-size-button,
    merch-card[variant="full-pricing-express"] a[slot="cta"].small-font-size-button {
        font-size: 14px;
        padding: 2px 24px;
    }
}

/* Badge styling */
merch-card[variant="full-pricing-express"] merch-badge {
    color: var(--spectrum-white);
    font-size: 16px;
    font-weight: bold;
    line-height: 20.8px;
}

/* Mobile-specific selective display of body-s (under 768px) */
@media (max-width: 767px) {
    /* Show body-s container */
    merch-card[variant="full-pricing-express"] [slot="body-s"] {
        display: block;
    }

    /* Hide all direct children by default */
    merch-card[variant="full-pricing-express"] [slot="body-s"] > * {
        display: none;
    }

    /* Show only the last hr (2nd one) */
    merch-card[variant="full-pricing-express"] [slot="body-s"] > hr:last-of-type {
        display: block;
        margin: 24px 0;
    }

    /* Show only the button container (last p tag) */
    merch-card[variant="full-pricing-express"] [slot="body-s"] > p:last-child {
        display: block;
    }

    merch-card[variant="full-pricing-express"] {
        width: 100%;
        max-width: 100%;
    }

    /* Price font size on mobile */
    merch-card[variant="full-pricing-express"] [slot="price"] .price-currency-symbol,
    merch-card[variant="full-pricing-express"] [slot="price"] .price-integer,
    merch-card[variant="full-pricing-express"] [slot="price"] .price-decimals-delimiter,
    merch-card[variant="full-pricing-express"] [slot="price"] .price-decimals,
    merch-card[variant="full-pricing-express"] [slot="price"] .price-recurrence,
    merch-card[variant="full-pricing-express"] [slot="price"] .price-strikethrough,
    merch-card[variant="full-pricing-express"] [slot="price"] .price-unit-type,
    merch-card[variant="full-pricing-express"] [slot="price"] .price-tax-inclusivity {
        font-size: 22px;
    }

    /* Badge alignment on mobile */
    merch-card[variant="full-pricing-express"] [slot="badge"] {
        font-size: 16px;
        font-weight: 400;
    }

    /* Trial badge alignment on mobile */
    merch-card[variant="full-pricing-express"] [slot="trial-badge"] {
        margin-left: 0;
        align-self: flex-start;
    }

    merch-card[variant="full-pricing-express"] [slot="trial-badge"] merch-badge {
        font-size: var(--merch-card-full-pricing-express-trial-badge-font-size);
        line-height: var(--merch-card-full-pricing-express-trial-badge-line-height);
    }
}

/* Hide screen reader only text */
merch-card[variant="full-pricing-express"] sr-only {
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

/* mas-tooltip inline styles for full-pricing-express */
merch-card[variant="full-pricing-express"] mas-tooltip {
    display: inline-block;
    align-items: center;
    vertical-align: baseline;
    margin-right: 8px;
    overflow: visible;
    padding-top: 16px;
}

/* mas-mnemonic inline styles for full-pricing-express */
merch-card[variant="full-pricing-express"] mas-mnemonic {
    display: inline-block;
    align-items: center;
    vertical-align: baseline;
    margin-right: 8px;
    overflow: visible;
    --mas-mnemonic-tooltip-padding: 4px 8px;
}


/* Responsive rules for tablet and desktop (768px+) */
@media (min-width: 768px) {
    merch-card[variant="full-pricing-express"] [slot="body-s"] {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
    }

    merch-card[variant="full-pricing-express"] [slot="body-s"] p:first-child {
        padding: 16px 8px;
    }

    /* Ensure the second divider wrapper stays at bottom with proper spacing */
    merch-card[variant="full-pricing-express"] [slot="body-s"] > hr:last-of-type {
        margin-top: auto;
        padding-top: 24px;
        margin-bottom: 16px;
        border: none;
        border-bottom: 1px solid #E9E9E9;
        height: 0;
        background: transparent;
    }

    /* Ensure the button container stays at the bottom */
    merch-card[variant="full-pricing-express"] [slot="body-s"] > p.button-container,
    merch-card[variant="full-pricing-express"] [slot="body-s"] > p:last-child {
        margin-top: 0;
        margin-bottom: 0;
    }
}
`;var Kr={title:{tag:"h3",slot:"heading-xs",maxCount:250,withSuffix:!0},badge:{tag:"div",slot:"badge",default:"spectrum-blue-400"},allowedBadgeColors:["spectrum-blue-400","spectrum-gray-300","spectrum-yellow-300","gradient-purple-blue","gradient-firefly-spectrum"],description:{tag:"div",slot:"body-s",maxCount:2e3,withSuffix:!1},shortDescription:{tag:"div",slot:"short-description",maxCount:3e3,withSuffix:!1},callout:{tag:"div",slot:"callout-content",editorLabel:"Price description"},prices:{tag:"div",slot:"price"},trialBadge:{tag:"div",slot:"trial-badge"},ctas:{slot:"cta",size:"XL"},mnemonics:{size:"xs"},borderColor:{attribute:"border-color",specialValues:{gray:"var(--spectrum-gray-300)",blue:"var(--spectrum-blue-400)","gradient-purple-blue":"linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)","gradient-firefly-spectrum":"linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%)"}},showAllSpectrumColors:!0,multiWhatsIncluded:"true",disabledAttributes:[]},at=class extends y{getGlobalCSS(){return Va}get aemFragmentMapping(){return Kr}get headingSelector(){return'[slot="heading-xs"]'}get badgeElement(){return this.card.querySelector('[slot="badge"]')}get badge(){return ja`
            <div
                class="badge-wrapper"
                style="${this.badgeElement?"":"visibility: hidden"}"
            >
                <slot name="badge"></slot>
            </div>
        `}syncHeights(){if(this.card.getBoundingClientRect().width<=2)return;let r=this.card.shadowRoot;r&&["header","short-description","price-container","cta"].forEach(t=>this.updateCardElementMinHeight(r.querySelector(`.${t}`),t))}resyncSiblings(){let r=this.getContainer();r&&r.querySelectorAll(`merch-card[variant="${this.card.variant}"]`).forEach(t=>t.variantLayout?.syncHeights?.())}async postCardUpdateHook(){if(!this.card.isConnected)return;await super.postCardUpdateHook();let r=this.getContainer();if(r){let t=r.querySelectorAll(`merch-card[variant="${this.card.variant}"]`),i=49;t.forEach(a=>{a.classList.remove("small-font-size-button"),a.querySelectorAll('[slot="cta"] sp-button, [slot="cta"] button, [slot="cta"] a.con-button, [slot="cta"] a.spectrum-Button, a[slot="cta"]').forEach(o=>{let s=o.textContent.trim().length>i;o.classList.toggle("small-font-size-button",s)})})}window.matchMedia("(min-width: 768px)").matches&&this.resyncSiblings()}connectedCallbackHook(){!this.card||typeof ResizeObserver>"u"||(this.lastSyncedWidth=0,this.sizeObserver=new ResizeObserver(()=>{let r=this.card.getBoundingClientRect().width;r<=2||r===this.lastSyncedWidth||(this.lastSyncedWidth=r,this.resyncSiblings())}),this.sizeObserver.observe(this.card))}disconnectedCallbackHook(){this.sizeObserver?.disconnect(),this.sizeObserver=null}renderLayout(){return ja`
            ${this.badge}
            <div class="card-content">
                <div class="header">
                    <slot name="heading-xs"></slot>
                    <div class="icons">
                        <slot name="icons"></slot>
                    </div>
                </div>
                <div class="short-description">
                    <slot name="short-description"></slot>
                </div>
                <div class="price-container">
                    <slot name="trial-badge"></slot>
                    <slot name="price"></slot>
                    <slot name="callout-content"></slot>
                </div>
                <div class="cta">
                    <slot name="cta"></slot>
                </div>
                <div class="description">
                    <slot name="body-s"></slot>
                </div>
            </div>
            <slot></slot>
        `}};p(at,"variantStyle",es`
        :host([variant='full-pricing-express']) {
            /* CSS Variables */
            --merch-card-full-pricing-express-width: 437px;
            --merch-card-full-pricing-express-mobile-width: 303px;
            --merch-card-full-pricing-express-padding: 24px;
            --merch-card-full-pricing-express-padding-mobile: 20px;
            --merch-card-full-pricing-express-section-gap: 24px;
            --express-custom-gray-500: #8f8f8f;
            --express-custom-gray-400: #d5d5d5;
            --express-custom-price-border: #e0e2ff;

            /* Price container specific */
            --merch-card-full-pricing-express-price-bg: #f8f8f8;
            --merch-card-full-pricing-express-price-radius: 8px;

            /* Typography - matching simplified-pricing-express */
            --merch-card-full-pricing-express-trial-badge-font-size: 12px;
            --merch-card-full-pricing-express-trial-badge-font-weight: 700;
            --merch-card-full-pricing-express-trial-badge-line-height: 15.6px;
            --merch-card-full-pricing-express-price-font-size: 28px;
            --merch-card-full-pricing-express-price-line-height: 36.4px;
            --merch-card-full-pricing-express-price-font-weight: 700;
            --merch-card-full-pricing-express-cta-font-size: 18px;
            --merch-card-full-pricing-express-cta-font-weight: 700;
            --merch-card-full-pricing-express-cta-line-height: 23.4px;

            /* Accent color */
            --spectrum-express-accent: #5258e4;
            --spectrum-express-indigo-300: #d3d5ff;
            --spectrum-express-white: #ffffff;

            /* Gradient definitions (reused) */
            --gradient-purple-blue: linear-gradient(
                96deg,
                #b539c8 0%,
                #7155fa 66%,
                #3b63fb 100%
            );
            --gradient-firefly-spectrum: linear-gradient(
                96deg,
                #d73220 0%,
                #d92361 33%,
                #7155fa 100%
            );

            width: var(--merch-card-full-pricing-express-width);
            max-width: var(--merch-card-full-pricing-express-width);
            background: transparent;
            border: none;
            display: flex;
            flex-direction: column;
            overflow: visible;
            box-sizing: border-box;
            position: relative;
        }

        /* Badge wrapper styling (same as simplified) */
        :host([variant='full-pricing-express']) .badge-wrapper {
            padding: 4px 12px;
            border-radius: 8px 8px 0 0;
            text-align: center;
            font-size: 16px;
            font-weight: 700;
            line-height: 20.8px;
            color: var(--spectrum-gray-800);
            position: relative;
            min-height: 23px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        :host([variant='full-pricing-express']) .icons {
            display: flex;
            padding-bottom: 4px;
            border-bottom: 1px solid var(--spectrum-black);
        }

        /* Card content styling */
        :host([variant='full-pricing-express']) .card-content {
            border-radius: 8px;
            padding: var(--merch-card-full-pricing-express-padding);
            flex: 1;
            display: flex;
            flex-direction: column;
            position: relative;
        }

        :host([variant='full-pricing-express']) .card-content > * {
            position: relative;
        }

        /* Regular border styling */
        :host([variant='full-pricing-express']:not([gradient-border='true']))
            .card-content {
            background: var(--spectrum-gray-50);
            border: 1px solid #d5d5d5;
        }

        /* When badge exists, adjust card content border radius */
        :host([variant='full-pricing-express']:has([slot='badge']:not(:empty)))
            .card-content {
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        }

        /* When badge exists with regular border, ensure top border */
        :host(
                [variant='full-pricing-express']:not(
                        [gradient-border='true']
                    ):has([slot='badge']:not(:empty))
            )
            .card-content {
            border-top: 1px solid
                var(
                    --consonant-merch-card-border-color,
                    var(--spectrum-gray-100)
                );
        }

        /* When badge has content, ensure seamless connection */
        :host([variant='full-pricing-express']:has([slot='badge']:not(:empty)))
            .badge-wrapper {
            margin-bottom: -2px;
        }

        /* Gradient border styling (reused from simplified) */
        :host([variant='full-pricing-express'][gradient-border='true'])
            .badge-wrapper {
            border: none;
            margin-bottom: -6px;
            padding-bottom: 6px;
        }

        :host([variant='full-pricing-express'][gradient-border='true'])
            .badge-wrapper
            ::slotted(*) {
            color: white;
        }

        :host([variant='full-pricing-express'][gradient-border='true'])
            .card-content {
            border: none;
            padding: calc(var(--merch-card-full-pricing-express-padding) + 2px);
            border-radius: 8px;
        }

        :host([variant='full-pricing-express'][gradient-border='true'])
            .card-content::before {
            content: '';
            position: absolute;
            top: 1px;
            left: 1px;
            right: 1px;
            bottom: 1px;
            background: var(--spectrum-express-white, #ffffff);
            border-radius: 7px;
            z-index: 0;
            pointer-events: none;
        }

        /* Gradient backgrounds */
        :host(
                [variant='full-pricing-express'][border-color='gradient-purple-blue']
            )
            .badge-wrapper,
        :host(
                [variant='full-pricing-express'][border-color='gradient-purple-blue']
            )
            .card-content {
            background: var(--gradient-purple-blue);
        }

        :host(
                [variant='full-pricing-express'][border-color='gradient-firefly-spectrum']
            )
            .badge-wrapper,
        :host(
                [variant='full-pricing-express'][border-color='gradient-firefly-spectrum']
            )
            .card-content {
            background: var(--gradient-firefly-spectrum);
        }

        :host(
                [variant='full-pricing-express'][gradient-border='true']:has(
                        [slot='badge']:not(:empty)
                    )
            )
            .card-content::before {
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
        }

        /* Header styling */
        :host([variant='full-pricing-express']) .header {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }

        :host([variant='full-pricing-express']) [slot='heading-xs'] {
            font-size: 18px;
            font-weight: 700;
            line-height: 23.4px;
            color: var(--spectrum-gray-800);
        }

        /* Icons/Mnemonics styling */
        :host([variant='full-pricing-express']) [slot='icons'] {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-shrink: 0;
        }

        :host([variant='full-pricing-express']) .icons ::slotted(merch-icon) {
            --mod-img-width: auto;
            --mod-img-height: 18px;
            align-self: flex-end;
        }

        :host([variant='full-pricing-express'])
            .icons
            ::slotted(merch-icon:nth-of-type(2)) {
            --mod-img-height: 14px;
            height: 14px;
        }

        /* Description sections */
        :host([variant='full-pricing-express']) .description {
            display: flex;
            flex-direction: column;
        }

        /* Price container with background */
        :host([variant='full-pricing-express']) .price-container {
            background: var(--merch-card-full-pricing-express-price-bg);
            padding: 24px 16px;
            border-radius: var(--merch-card-full-pricing-express-price-radius);
            border: 1px solid var(--express-custom-price-border);
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: visible;
            margin-bottom: var(--merch-card-full-pricing-express-section-gap);
            justify-content: center;
            align-items: center;
            min-height: var(
                --consonant-merch-card-full-pricing-express-price-container-height
            );
        }

        :host([variant='full-pricing-express']) [slot='callout-content'] {
            font-size: 12px;
            font-weight: 400;
            font-style: normal;
            line-height: 18px;
            color: var(--spectrum-gray-800);
            text-align: center;
            background: transparent;
        }

        /* CTA styling */
        :host([variant='full-pricing-express']) .cta,
        :host([variant='full-pricing-express']) .cta ::slotted(*) {
            width: 100%;
            display: block;
        }

        /* Mobile and tablet styles */
        @media (max-width: 1199px) {
            :host([variant='full-pricing-express']) {
                width: 100%;
                max-width: 100%;
            }

            :host([variant='full-pricing-express']) .card-content {
                padding: 24px 16px;
            }

            :host([variant='full-pricing-express'][gradient-border='true'])
                .card-content {
                padding: 26px 18px;
            }

            :host([variant='full-pricing-express']) .short-description {
                padding: 24px 0;
            }
        }

        /* Tablet and desktop - fixed heights for alignment */
        @media (min-width: 768px) {
            :host([variant='full-pricing-express']) .card-content {
                height: 100%;
            }

            :host([variant='full-pricing-express']) .description {
                flex: 1;
            }

            :host([variant='full-pricing-express']) .cta {
                margin-bottom: 24px;
                min-height: var(
                    --consonant-merch-card-full-pricing-express-cta-height
                );
            }

            :host([variant='full-pricing-express']) .short-description {
                margin-bottom: 24px;
                min-height: var(
                    --consonant-merch-card-full-pricing-express-short-description-height
                );
            }

            :host([variant='full-pricing-express']) .header {
                min-height: var(
                    --consonant-merch-card-full-pricing-express-header-height
                );
            }
        }
    `);import{html as Qr,css as ts,nothing as rs}from"./lit-all.min.js";var Wa=`
/* Headless variant: minimal container for label/value rows */
.headless {
    display: flex;
    flex-direction: column;
    padding: var(--consonant-merch-spacing-xs, 8px);
}
`;var Ya={cardName:{attribute:"name"},title:{tag:"p",slot:"heading-xs"},cardTitle:{tag:"p",slot:"heading-xs"},subtitle:{tag:"p",slot:"body-xxs"},description:{tag:"div",slot:"body-xs"},promoText:{tag:"p",slot:"promo-text"},shortDescription:{tag:"p",slot:"short-description"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},whatsIncluded:{tag:"div",slot:"whats-included"},addonConfirmation:{tag:"div",slot:"addon-confirmation"},badge:{tag:"div",slot:"badge"},trialBadge:{tag:"div",slot:"trial-badge"},prices:{tag:"p",slot:"prices"},backgroundImage:{tag:"div",slot:"bg-image"},ctas:{slot:"footer",size:"m"},addon:!0,secureLabel:!0,borderColor:{attribute:"border-color"},backgroundColor:{attribute:"background-color"},size:[],mnemonics:{size:"m"}},is=[{slot:"bg-image",label:"Background Image"},{slot:"badge",label:"Badge"},{slot:"icons",label:"Mnemonic icon"},{slot:"heading-xs",label:"Title"},{slot:"body-xxs",label:"Subtitle"},{slot:"body-xs",label:"Product description"},{slot:"promo-text",label:"Promo Text"},{slot:"callout-content",label:"Callout text"},{slot:"short-description",label:"Short Description"},{slot:"trial-badge",label:"Trial Badge"},{slot:"prices",label:"Product price"},{slot:"quantity-select",label:"Quantity select"},{slot:"addon",label:"Addon"},{slot:"whats-included",label:"What's included"},{slot:"addon-confirmation",label:"Addon confirmation"},{slot:"footer",label:"CTAs"}],nt=class extends y{constructor(r){super(r)}getGlobalCSS(){return Wa}renderLayout(){return Qr`
            <div class="headless">
                ${is.map(({slot:r,label:t})=>Qr`
                        <div class="headless-row">
                            <span class="headless-label">${t}</span>
                            <span class="headless-value">
                                <slot name="${r}"></slot>
                            </span>
                        </div>
                    `)}
                ${this.card.secureLabel?Qr`
                          <div class="headless-row">
                              <span class="headless-label">Secure label</span>
                              <span class="headless-value">
                                  ${this.secureLabel}
                              </span>
                          </div>
                      `:rs}
            </div>
        `}};p(nt,"variantStyle",ts`
        :host([variant='headless']) {
            border: none;
            background: transparent;
            box-shadow: none;
        }
        :host([variant='headless']) .headless {
            display: flex;
            flex-direction: column;
            padding: var(--consonant-merch-spacing-xs, 8px);
        }
        :host([variant='headless']) .headless-row {
            display: flex;
            gap: var(--consonant-merch-spacing-xs, 8px);
            padding: var(--consonant-merch-spacing-xxs, 4px) 0;
        }
        :host([variant='headless']) .headless-label {
            flex-shrink: 0;
            font-weight: 600;
            min-width: 8em;
        }
        :host([variant='headless']) .headless-value {
            flex: 1;
        }
        :host([variant='headless']) .headless-value::slotted(*) {
            display: inline;
        }
    `);import{css as as,html as ns}from"./lit-all.min.js";var Xa=`
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
`;var Za={title:{tag:"p",slot:"title"},prices:{tag:"p",slot:"prices"},description:{tag:"p",slot:"description"},planType:!0,ctas:{slot:"ctas",size:"S"}},ot=class extends y{constructor(){super(...arguments);p(this,"legal")}async postCardUpdateHook(){await super.postCardUpdateHook(),this.adjustLegal()}getGlobalCSS(){return Xa}get headingSelector(){return'[slot="title"]'}priceOptionsProvider(t,i){i.literals={...i.literals,strikethroughAriaLabel:"",alternativePriceAriaLabel:""},i.space=!0,i.displayAnnual=this.card.settings?.displayAnnual??!1}adjustLegal(){if(this.legal!==void 0)return;let t=this.card.querySelector(`${C}[data-template="price"]`);if(!t)return;let i=t.cloneNode(!0);this.legal=i,t.dataset.displayTax="false",t.dataset.displayPerUnit="false",i.dataset.template="legal",i.dataset.displayPlanType=this.card?.settings?.displayPlanType??!0,i.setAttribute("slot","legal"),this.card.appendChild(i)}renderLayout(){return ns`
            ${this.badge}
            <div class="body">
                <slot name="title"></slot>
                <slot name="prices"></slot>
                <slot name="legal"></slot>
                <slot name="description"></slot>
                <slot name="ctas"></slot>
            </div>
        `}};p(ot,"variantStyle",as`
        :host([variant='mini']) {
            min-width: 209px;
            min-height: 103px;
            background-color: var(--spectrum-background-base-color);
            border: 1px solid var(--consonant-merch-card-border-color, #dadada);
        }
    `);import{html as os,css as ss}from"./lit-all.min.js";var Ka=`
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
`;var Jr={mnemonics:{size:"s"},title:{tag:"h3",slot:"heading-xxs",maxCount:250,withSuffix:!0},description:{tag:"div",slot:"body-s",maxCount:2e3,withSuffix:!1},whatsIncluded:{tag:"div",slot:"whats-included"},badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300"},trialBadge:{tag:"div",slot:"trial-badge",default:"spectrum-green-800"},prices:{tag:"p",slot:"price"},ctas:{slot:"cta",size:"M"},addonConfirmation:{tag:"div",slot:"addon-confirmation"},borderColor:{attribute:"border-color",specialValues:{gray:"--spectrum-gray-300","gradient-purple-blue":"var(--gradient-purple-blue)","gradient-firefly-spectrum":"var(--gradient-firefly-spectrum)"}}},st=class extends y{getGlobalCSS(){return Ka}get aemFragmentMapping(){return Jr}renderLayout(){return os`
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
        `}};p(st,"variantStyle",ss`
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
    `);var gr=new Map,Qa=new WeakMap,Ja=new Map,P=(e,r,t=null,i=null,a)=>{gr.set(e,{class:r,fragmentMapping:t,style:i,collectionOptions:a})};P("catalog",Xe,Fi,Xe.variantStyle);P("image",ke);P("inline-heading",Zt);P("mini-compare-chart",Ze,Wi,Ze.variantStyle);P("mini-compare-chart-mweb",Ke,Zi,Ke.variantStyle);P("plans",U,Jt,U.variantStyle,U.collectionOptions);P("plans-students",U,Ji,U.variantStyle,U.collectionOptions);P("plans-education",U,Qi,U.variantStyle,U.collectionOptions);P("plans-v2",fe,ra,fe.variantStyle,fe.collectionOptions);P("bizpro",zt,Na,zt.variantStyle);P("product",Je,Da,Je.variantStyle);P("segment",et,Ha,et.variantStyle);P("media",tt,$a,tt.variantStyle);P("headless",nt,Ya,nt.variantStyle);P("special-offers",rt,Ga,rt.variantStyle);P("simplified-pricing-express",it,Zr,it.variantStyle);P("full-pricing-express",at,Kr,at.variantStyle);P("mini",ot,Za,ot.variantStyle);P("image",ke,Ui,ke.variantStyle);P("fries",st,Jr,st.variantStyle);var cs=(e,r,t)=>{try{let i=Ja.get(e.variant);if(i||(i=new CSSStyleSheet,i.replaceSync(r.cssText),Ja.set(e.variant,i)),t?.styleSheet&&t.styleSheet!==i){let a=e.shadowRoot.adoptedStyleSheets.indexOf(t.styleSheet);a!==-1&&e.shadowRoot.adoptedStyleSheets.splice(a,1)}return e.shadowRoot.adoptedStyleSheets.includes(i)||e.shadowRoot.adoptedStyleSheets.push(i),{styleSheet:i}}catch{let a=document.createElement("style");a.textContent=r.cssText,a.setAttribute("data-variant-style",e.variant);let n=t?.styleElement||e.shadowRoot.querySelector("[data-variant-style]");return n&&n.remove(),e.shadowRoot.appendChild(a),{styleElement:a}}},ei=e=>{let r=gr.get(e.variant);if(!r)return;let{class:t,style:i}=r,a=Qa.get(e);if(a?.appliedVariant===e.variant)return new t(e);let n=i?cs(e,i,a):{};return Qa.set(e,{appliedVariant:e.variant,...n}),new t(e)};function Xt(e){return gr.get(e)?.fragmentMapping}function en(e){return gr.get(e)?.collectionOptions}var tn=document.createElement("style");tn.innerHTML=`
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

.section[class$="merch-cards"] > .content {
	padding: 0;
}

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

.annual-price-new-line > span[is="inline-price"] {
  line-height: var(--consonant-merch-card-body-m-line-height);
}

.annual-price-new-line > span[is="inline-price"] > .price-annual-prefix {
  font-size: 0;
  line-height: 0;
}

.annual-price-new-line > span[is="inline-price"] .price:not(.price-annual) {
  display: block;
}

.annual-price-new-line > span[is="inline-price"] > .price-annual::before {
  content: '(';
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

mas-field span.placeholder-resolved[data-template='priceStrikethrough'],
mas-field span.placeholder-resolved[data-template='strikethrough'],
mas-field span.price.price-strikethrough,
mas-field span.price.price-promo-strikethrough {
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

merch-addon span[data-wcs-osi][data-offer-type="TRIAL"] {
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

aem-fragment {
  display: contents;
}

mas-field {
  display: inline;
}

merch-card [slot='callout-content'] .icon-button {
  position: absolute;
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

@media (max-width: 600px) {
    merch-card [slot='callout-content'] .icon-button.tooltip-left::before {
        left: -30px;
    }

    merch-card [slot='callout-content'] .icon-button.tooltip-right::before {
        left: unset;
        right: -20px;
    }    
}

@media screen and ${N} {
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
}

/* RTL support for collection header - Mobile */
[dir="rtl"] merch-card-collection-header {
    --merch-card-collection-header-areas: 'search search' 'sort filter'
        'result result';
}

[dir="rtl"] merch-card-collection-header #result {
    text-align: right;
}

@media screen and ${T} {
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

@media screen and ${x} {

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

@media screen and ${O} {
    .four-merch-cards,
    merch-sidenav ~ .four-merch-cards,
	.section.four-merch-cards > .content {
        grid-template-columns: repeat(4, var(--merch-card-collection-card-width));
    }
}

`;document.head.appendChild(tn);var ve=class e extends Error{constructor(r,t,i){if(super(r,{cause:i}),this.name="MasError",t.response){let a=t.response.headers?.get(qt);a&&(t.requestId=a),t.response.status&&(t.status=t.response.status,t.statusText=t.response.statusText),t.response.url&&(t.url=t.response.url)}delete t.response,this.context=t,Error.captureStackTrace&&Error.captureStackTrace(this,e)}toString(){let r=Object.entries(this.context||{}).map(([i,a])=>`${i}: ${JSON.stringify(a)}`).join(", "),t=`${this.name}: ${this.message}`;return r&&(t+=` (${r})`),this.cause&&(t+=`
Caused by: ${this.cause}`),t}};var ze={clientId:"merch-at-scale",delimiter:"\xB6",ignoredProperties:["analytics","literals","element"],serializableTypes:["Array","Object"],sampleRate:1,severity:"e",tags:"acom",isProdDomain:!1},rn=1e3;function ls(e){return e instanceof Error||typeof e?.originatingRequest=="string"}function an(e){if(e==null)return;let r=typeof e;if(r==="function")return e.name?`function ${e.name}`:"function";if(r==="object"){if(e instanceof Error)return e.message;if(typeof e.originatingRequest=="string"){let{message:i,originatingRequest:a,status:n}=e;return[i,n,a].filter(Boolean).join(" ")}let t=e[Symbol.toStringTag]??Object.getPrototypeOf(e).constructor.name;if(!ze.serializableTypes.includes(t))return t}return e}function ds(e,r){if(!ze.ignoredProperties.includes(e))return an(r)}var ti={append(e){if(e.level!=="error")return;let{message:r,params:t}=e,i=[],a=[],n=r;t.forEach(l=>{l!=null&&(ls(l)?i:a).push(l)}),i.length&&(n+=` ${i.map(an).join(" ")}`);let{pathname:o,search:s}=window.location,c=`${ze.delimiter}page=${o}${s}`;c.length>rn&&(c=`${c.slice(0,rn)}<trunc>`),n+=c,a.length&&(n+=`${ze.delimiter}facts=`,n+=JSON.stringify(a,ds)),window.lana?.log(n,ze)}};function nn(e){Object.assign(ze,Object.fromEntries(Object.entries(e).filter(([r,t])=>r in ze&&t!==""&&t!==null&&t!==void 0&&!Number.isNaN(t))))}var on={LOCAL:"local",PROD:"prod",STAGE:"stage"},ri={DEBUG:"debug",ERROR:"error",INFO:"info",WARN:"warn"},ii=new Set,ai=new Set,sn=new Map,cn={append({level:e,message:r,params:t,timestamp:i,source:a}){console[e](`${i}ms [${a}] %c${r}`,"font-weight: bold;",...t)}},ln={filter:({level:e})=>e!==ri.DEBUG},hs={filter:()=>!1};function ps(e,r,t,i,a){return{level:e,message:r,namespace:t,get params(){return i.length===1&&rr(i[0])&&(i=i[0](),Array.isArray(i)||(i=[i])),i},source:a,timestamp:performance.now().toFixed(3)}}function ms(e){[...ai].every(r=>r(e))&&ii.forEach(r=>r(e))}function dn(e){let r=(sn.get(e)??0)+1;sn.set(e,r);let t=`${e} #${r}`,i={id:t,namespace:e,module:a=>dn(`${i.namespace}/${a}`),updateConfig:nn};return Object.values(ri).forEach(a=>{i[a]=(n,...o)=>ms(ps(a,n,e,o,t))}),Object.seal(i)}function fr(...e){e.forEach(r=>{let{append:t,filter:i}=r;rr(i)&&ai.add(i),rr(t)&&ii.add(t)})}function us(e={}){let{name:r}=e,t=St(Qe("commerce.debug",{search:!0,storage:!0}),r===on.LOCAL);return fr(t?cn:ln),r===on.PROD&&fr(ti),Mt}function gs(){ii.clear(),ai.clear()}var Mt={...dn(Oi),Level:ri,Plugins:{consoleAppender:cn,debugFilter:ln,quietFilter:hs,lanaAppender:ti},init:us,reset:gs,use:fr};var fs="mas-commerce-service",sm=Mt.module("utilities"),bs={requestId:qt,etag:"Etag",lastModified:"Last-Modified",serverTiming:"server-timing"};var br=e=>window.setTimeout(e);function ni(){return document.getElementsByTagName(fs)?.[0]}function hn(e){let r={};if(!e?.headers)return r;let t=e.headers;for(let[i,a]of Object.entries(bs)){let n=t.get(a);n&&(n=n.replace(/[,;]/g,"|"),n=n.replace(/[| ]+/g,"|"),r[i]=n)}return r}async function pn(e,r={},t=2,i=100){let a;for(let n=0;n<=t;n++)try{let o=await fetch(e,r);return o.retryCount=n,o}catch(o){if(a=o,a.retryCount=n,n>t)break;await new Promise(s=>setTimeout(s,i*(n+1)))}throw a}var mn="fragment",un="author",gn="preview",fn="loading",bn="timeout",oi="aem-fragment",xn="eager",vn="cache",xs=[xn,vn],ne,Me,Z,si=class{constructor(){f(this,ne,new Map);f(this,Me,new Map);f(this,Z,new Map)}clear(){d(this,ne).clear(),d(this,Me).clear(),d(this,Z).clear()}add(r,t=!0){if(!this.has(r.id)&&!this.has(r.fields?.originalId)){if(d(this,ne).set(r.id,r),r.fields?.originalId&&d(this,ne).set(r.fields.originalId,r),d(this,Z).has(r.id)){let[,i]=d(this,Z).get(r.id);i()}if(d(this,Z).has(r.fields?.originalId)){let[,i]=d(this,Z).get(r.fields?.originalId);i()}if(!(!t||typeof r.references!="object"||Array.isArray(r.references)))for(let i in r.references){let{type:a,value:n}=r.references[i];a==="content-fragment"&&(n.settings={...r?.settings,...n.settings},n.placeholders={...r?.placeholders,...n.placeholders},n.dictionary={...r?.dictionary,...n.dictionary},n.priceLiterals={...r?.priceLiterals,...n.priceLiterals},this.add(n,r))}}}has(r){return d(this,ne).has(r)}entries(){return d(this,ne).entries()}get(r){return d(this,ne).get(r)}getAsPromise(r){let[t]=d(this,Z).get(r)??[];if(t)return t;let i;return t=new Promise(a=>{i=a,this.has(r)&&a()}),d(this,Z).set(r,[t,i]),t}getFetchInfo(r){let t=d(this,Me).get(r);return t||(t={url:null,retryCount:0,stale:!1,measure:null,status:null},d(this,Me).set(r,t)),t}remove(r){d(this,ne).delete(r),d(this,Me).delete(r),d(this,Z).delete(r)}};ne=new WeakMap,Me=new WeakMap,Z=new WeakMap;var ye=new si,ct,j,he,q,G,R,Rt,Nt,K,Ot,It,lt,Q,yn,wn,ci,En,xr=class extends HTMLElement{constructor(){super(...arguments);f(this,Q);p(this,"cache",ye);f(this,ct);f(this,j,null);f(this,he,null);f(this,q,null);f(this,G);f(this,R);f(this,Rt,xn);f(this,Nt,5e3);f(this,K);f(this,Ot,!1);f(this,It,0);f(this,lt)}static get observedAttributes(){return[mn,fn,bn,un,gn]}attributeChangedCallback(t,i,a){t===mn&&(g(this,G,a),g(this,R,ye.getFetchInfo(a))),t===fn&&xs.includes(a)&&g(this,Rt,a),t===bn&&g(this,Nt,parseInt(a,10)),t===un&&g(this,Ot,["","true"].includes(a)),t===gn&&g(this,lt,a)}connectedCallback(){if(!d(this,K)){if(d(this,q)??g(this,q,Ae(this)),g(this,lt,d(this,q).settings?.preview),d(this,ct)??g(this,ct,d(this,q).log.module(`${oi}[${d(this,G)}]`)),!d(this,G)||d(this,G)==="#"){d(this,R)??g(this,R,ye.getFetchInfo("missing-fragment-id")),_(this,Q,ci).call(this,"Missing fragment id");return}this.refresh(!1)}}get fetchInfo(){return Object.fromEntries(Object.entries(d(this,R)).filter(([t,i])=>i!=null).map(([t,i])=>[`aem-fragment:${t}`,i]))}async refresh(t=!0){if(d(this,K)&&!await Promise.race([d(this,K),Promise.resolve(!1)]))return;t&&ye.remove(d(this,G)),d(this,Rt)===vn&&await Promise.race([ye.getAsPromise(d(this,G)),new Promise(s=>setTimeout(s,d(this,Nt)))]);try{g(this,K,_(this,Q,En).call(this)),await d(this,K)}catch(s){return _(this,Q,ci).call(this,s.message),!1}let{references:i,referencesTree:a,placeholders:n,wcs:o}=d(this,j)||{};return o&&!Qe("mas.disableWcsCache")&&d(this,q).prefillWcsCache(o),this.dispatchEvent(new CustomEvent(Ge,{detail:{...this.data,references:i,referencesTree:a,placeholders:n,...d(this,R)},bubbles:!0,composed:!0})),d(this,K)}get updateComplete(){return d(this,K)??Promise.reject(new Error("AEM fragment cannot be loaded"))}get data(){return d(this,he)?d(this,he):(d(this,Ot)?this.transformAuthorData():this.transformPublishData(),d(this,he))}get rawData(){return d(this,j)}transformAuthorData(){let{fields:t,id:i,tags:a,variationId:n,settings:o={},priceLiterals:s={},dictionary:c={},placeholders:l={}}=d(this,j);g(this,he,t.reduce((h,{name:u,multiple:m,values:b})=>(h.fields[u]=m?b:b[0],h),{fields:{},id:i,tags:a,settings:o,priceLiterals:s,dictionary:c,placeholders:l,variationId:n}))}transformPublishData(){if(!d(this,j))return;let{fields:t,id:i,tags:a,settings:n={},priceLiterals:o={},dictionary:s={},placeholders:c={},variationId:l}=d(this,j);g(this,he,Object.entries(t).reduce((h,[u,m])=>(h.fields[u]=m?.mimeType?m.value:m??"",h),{fields:{},id:i,tags:a,settings:n,priceLiterals:o,dictionary:s,placeholders:c,variationId:l}))}getFragmentClientUrl(){let i=new URLSearchParams(window.location.search).get("maslibs");if(!i||i.trim()==="")return"https://mas.adobe.com/studio/libs/fragment-client.js";let a=i.trim().toLowerCase();if(a==="local")return"http://localhost:3000/studio/libs/fragment-client.js";let{hostname:n}=window.location,o=n.endsWith(".page")?"page":"live";return a.includes("--")?`https://${a}.aem.${o}/studio/libs/fragment-client.js`:`https://${a}--mas--adobecom.aem.${o}/studio/libs/fragment-client.js`}async generatePreview(){let t=this.getFragmentClientUrl(),{previewFragment:i}=await import(t),a={locale:d(this,q).settings.locale,apiKey:d(this,q).settings.wcsApiKey,fullContext:!0},n=new URLSearchParams(window.location.search).get("instant")??d(this,q).settings.instant;return n&&(a.instant=n),await i(d(this,G),a)}};ct=new WeakMap,j=new WeakMap,he=new WeakMap,q=new WeakMap,G=new WeakMap,R=new WeakMap,Rt=new WeakMap,Nt=new WeakMap,K=new WeakMap,Ot=new WeakMap,It=new WeakMap,lt=new WeakMap,Q=new WeakSet,yn=async function(t){bi(this,It)._++;let i=`${oi}:${d(this,G)}:${d(this,It)}`,a=`${i}${Vt}`,n=`${i}${jt}`;if(d(this,lt)){let s=await this.generatePreview();if(s.status===200)return s.body;throw new ve(`Failed to generate preview: ${s.message}`,{})}performance.mark(a);let o;try{if(d(this,R).stale=!1,d(this,R).url=t,o=await pn(t,{cache:"default",credentials:"omit"}),_(this,Q,wn).call(this,o),d(this,R).status=o?.status,d(this,R).measure=Ve(performance.measure(n,a)),d(this,R).retryCount=o.retryCount,!o?.ok)throw new ve("Unexpected fragment response",{response:o,...d(this,q).duration});return await o.json()}catch(s){if(d(this,R).measure=Ve(performance.measure(n,a)),d(this,R).retryCount=s.retryCount,d(this,j))return d(this,R).stale=!0,d(this,ct).error("Serving stale data",d(this,R)),d(this,j);let c=s.message??"unknown";throw new ve(`Failed to fetch fragment: ${c}`,{})}},wn=function(t){Object.assign(d(this,R),hn(t))},ci=function(t){g(this,K,null),d(this,R).message=t,this.classList.add("error");let i={...d(this,R),...d(this,q).duration};d(this,ct).error(t,i),this.dispatchEvent(new CustomEvent(qe,{detail:i,bubbles:!0,composed:!0}))},En=async function(){var c;this.classList.remove("error"),g(this,he,null);let t=ye.get(d(this,G));if(t)return g(this,j,t),!0;let{masIOUrl:i,wcsApiKey:a,country:n,locale:o}=d(this,q).settings,s=`${i}/fragment?id=${d(this,G)}&api_key=${a}&locale=${o}`;return n&&!o.endsWith(`_${n}`)&&(s+=`&country=${n}`),t=await _(this,Q,yn).call(this,s),(c=t.fields).originalId??(c.originalId=d(this,G)),ye.add(t),g(this,j,t),!0},p(xr,"cache",ye);customElements.define(oi,xr);import{LitElement as vs,html as li,css as ys,nothing as ws}from"./lit-all.min.js";import{unsafeHTML as Es}from"./lit-all.min.js";var Ss=e=>e?e.startsWith("sp-icon-")?li`${Es(`<${e} class="badge-icon"></${e}>`)}`:li`<img src="${e}" class="badge-icon" />`:ws,dt=class extends vs{constructor(){super(),this.color="",this.variant="",this.backgroundColor="",this.borderColor="",this.text=this.textContent,this.icon=""}connectedCallback(){this.borderColor&&this.borderColor!=="transparent"?this.style.setProperty("--merch-badge-border",`1px solid var(--${this.borderColor})`):this.backgroundColor.startsWith("gradient-")||this.style.setProperty("--merch-badge-border",`1px solid var(--${this.backgroundColor})`),this.style.setProperty("--merch-badge-background-color",`var(--${this.backgroundColor})`),(!this.borderColor||this.borderColor==="transparent")&&this.backgroundColor.startsWith("gradient-")?this.style.setProperty("--merch-badge-padding","3px 11px 4px 11px"):this.style.setProperty("--merch-badge-padding","2px 10px 3px 10px"),this.style.setProperty("--merch-badge-color",this.color),this.style.setProperty("--merch-badge-font-size","var(--consonant-merch-card-body-xs-font-size)"),this.querySelector('span[is="inline-price"]')||(this.textContent="");let r=this.closest("merch-card"),t=r?.getAttribute("size"),i=r?.querySelectorAll(":scope > merch-icon").length||0;this.style.setProperty("--merch-badge-offset",i),this.style.setProperty("--merch-badge-with-offset",i?1:0),this.style.setProperty("--merch-badge-card-size",t?2:1),super.connectedCallback()}render(){return li`<div class="badge">
            ${Ss(this.icon)}<slot>${this.text}</slot>
        </div>`}};p(dt,"properties",{color:{type:String},variant:{type:String},backgroundColor:{type:String,attribute:"background-color"},borderColor:{type:String,attribute:"border-color"},icon:{type:String}}),p(dt,"styles",ys`
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
    `);customElements.define("merch-badge",dt);import{html as Cs,css as As,LitElement as Ts}from"./lit-all.min.js";var Dt=class extends Ts{constructor(){super()}render(){return Cs`
            <slot name="icon"></slot>
            <slot name="description">${this.description}</slot>
        `}};p(Dt,"styles",As`
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
    `),p(Dt,"properties",{description:{type:String,attribute:!0}});customElements.define("merch-mnemonic-list",Dt);import{html as di,css as ks,LitElement as Ls,nothing as Sn}from"./lit-all.min.js";var Bt=class extends Ls{updated(){this.hideSeeMoreEls()}hideSeeMoreEls(){this.isMobile&&this.rows.forEach((r,t)=>{t>=5&&(r.style.display=this.showAll?"flex":"none")})}constructor(){super(),this.showAll=!1,this.mobileRows=this.mobileRows===void 0?5:this.mobileRows}toggle(){this.showAll=!this.showAll,this.dispatchEvent(new CustomEvent("hide-see-more-elements",{bubbles:!0,composed:!0})),this.requestUpdate()}render(){return di`<slot name="heading"></slot>
            <slot name="contentBullets"></slot>
            ${!this.isMobile||!this.bulletsAdded?di`<slot name="content"></slot>`:Sn}
            ${this.isMobile&&this.rows.length>this.mobileRows&&!this.bulletsAdded?di`<div @click=${this.toggle} class="see-more">
                      ${this.showAll?"- See less":"+ See more"}
                  </div>`:Sn}`}get isMobile(){return window.matchMedia("(max-width: 767px)").matches}get rows(){return this.querySelectorAll('[slot="content"] merch-mnemonic-list')}get bulletsAdded(){return!!this.querySelector('[slot="contentBullets"] merch-mnemonic-list')}};p(Bt,"styles",ks`
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
    `),p(Bt,"properties",{heading:{type:String,attribute:!0},mobileRows:{type:Number,attribute:!0}});customElements.define("merch-whats-included",Bt);var _s={[me]:zi,[Ce]:Mi,[ue]:Ri},Ps={[me]:Ni,[ue]:ee},Ht,vr=class{constructor(r){f(this,Ht);p(this,"changes",new Map);p(this,"connected",!1);p(this,"error");p(this,"log");p(this,"options");p(this,"promises",[]);p(this,"state",Ce);p(this,"timer",null);p(this,"value");p(this,"version",0);p(this,"wrapperElement");this.wrapperElement=r,this.log=Mt.module("mas-element")}update(){[me,Ce,ue].forEach(r=>{this.wrapperElement.classList.toggle(_s[r],r===this.state)})}notify(){(this.state===ue||this.state===me)&&(this.state===ue?this.promises.forEach(({resolve:t})=>t(this.wrapperElement)):this.state===me&&this.promises.forEach(({reject:t})=>t(this.error)),this.promises=[]);let r=this.error;this.error instanceof ve&&(r={message:this.error.message,...this.error.context}),this.wrapperElement.dispatchEvent(new CustomEvent(Ps[this.state],{bubbles:!0,composed:!0,detail:r}))}attributeChangedCallback(r,t,i){this.changes.set(r,i),this.requestUpdate()}connectedCallback(){g(this,Ht,ni()),this.requestUpdate(!0)}disconnectedCallback(){this.connected&&(this.connected=!1,this.log?.debug("Disconnected:",{element:this.wrapperElement}))}onceSettled(){let{error:r,promises:t,state:i}=this;return ue===i?Promise.resolve(this.wrapperElement):me===i?Promise.reject(r):new Promise((a,n)=>{t.push({resolve:a,reject:n})})}toggleResolved(r,t,i){return r!==this.version?!1:(i!==void 0&&(this.options=i),this.state=ue,this.value=t,this.update(),this.log?.debug("Resolved:",{element:this.wrapperElement,value:t}),br(()=>this.notify()),!0)}toggleFailed(r,t,i){if(r!==this.version)return!1;i!==void 0&&(this.options=i),this.error=t,this.state=me,this.update();let a=this.wrapperElement.getAttribute("is");return this.log?.error(`${a}: Failed to render: ${t.message}`,{element:this.wrapperElement,...t.context,...d(this,Ht)?.duration}),br(()=>this.notify()),!0}togglePending(r){return this.version++,r&&(this.options=r),this.state=Ce,this.update(),this.log?.debug("Pending:",{osi:this.wrapperElement?.options?.wcsOsi}),this.version}requestUpdate(r=!1){if(!this.wrapperElement.isConnected||!ni()||this.timer)return;let{error:t,options:i,state:a,value:n,version:o}=this;this.state=Ce,this.timer=br(async()=>{this.timer=null;let s=null;if(this.changes.size&&(s=Object.fromEntries(this.changes.entries()),this.changes.clear()),this.connected?this.log?.debug("Updated:",{element:this.wrapperElement,changes:s}):(this.connected=!0,this.log?.debug("Connected:",{element:this.wrapperElement,changes:s})),s||r)try{await this.wrapperElement.render?.()===!1&&this.state===Ce&&this.version===o&&(this.state=a,this.error=t,this.value=n,this.update(),this.notify())}catch(c){this.toggleFailed(this.version,c,i)}})}};Ht=new WeakMap;function zs(e){return`https://${e==="PRODUCTION"?"www.adobe.com":"www.stage.adobe.com"}/offers/promo-terms.html`}var Ne,Re=class Re extends HTMLAnchorElement{constructor(){super();p(this,"masElement",new vr(this));f(this,Ne);this.setAttribute("is",Re.is)}get isUptLink(){return!0}initializeWcsData(t,i){this.setAttribute("data-wcs-osi",t),i&&this.setAttribute("data-promotion-code",i)}attributeChangedCallback(t,i,a){this.masElement.attributeChangedCallback(t,i,a)}connectedCallback(){this.masElement.connectedCallback(),g(this,Ne,Ae()),d(this,Ne)&&(this.log=d(this,Ne).log.module("upt-link"))}disconnectedCallback(){this.masElement.disconnectedCallback(),g(this,Ne,void 0)}requestUpdate(t=!1){this.masElement.requestUpdate(t)}onceSettled(){return this.masElement.onceSettled()}async render(){let t=Ae();if(!t)return!1;this.dataset.imsCountry||t.imsCountryPromise.then(o=>{o&&(this.dataset.imsCountry=o)});let i=t.collectCheckoutOptions({},this);if(!i.wcsOsi)return this.log.error("Missing 'data-wcs-osi' attribute on upt-link."),!1;let a=this.masElement.togglePending(i),n=t.resolveOfferSelectors(i);try{let[[o]]=await Promise.all(n),{country:s,language:c,env:l}=i,h=`locale=${c}_${s}&country=${s}&offer_id=${o.offerId}`,u=this.getAttribute("data-promotion-code");u&&(h+=`&promotion_code=${encodeURIComponent(u)}`),this.href=`${zs(l)}?${h}`,this.masElement.toggleResolved(a,o,i)}catch(o){let s=new Error(`Could not resolve offer selectors for id: ${i.wcsOsi}.`,o.message);return this.masElement.toggleFailed(a,s,i),!1}}static createFrom(t){let i=new Re;for(let a of t.attributes)a.name!=="is"&&(a.name==="class"&&a.value.includes("upt-link")?i.setAttribute("class",a.value.replace("upt-link","").trim()):i.setAttribute(a.name,a.value));return i.innerHTML=t.innerHTML,i.setAttribute("tabindex",0),i}};Ne=new WeakMap,p(Re,"is","upt-link"),p(Re,"tag","a"),p(Re,"observedAttributes",["data-wcs-osi","data-promotion-code","data-ims-country"]);var we=Re;window.customElements.get(we.is)||window.customElements.define(we.is,we,{extends:we.tag});var Ms="#000000",hi="#F8D904",Rs="#EAEAEA",Ns="#31A547",Os=/(accent|primary|secondary)(-(outline|link))?/,Is="mas:product_code/",Ds="daa-ll",yr="daa-lh",Bs=["XL","L","M","S"],pi="...",Hs=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);function W(e,r,t,i){let a=i[e];if(r[e]&&a){let n={slot:a?.slot,...a?.attributes},o=r[e];if(a.maxCount&&typeof o=="string"){let[c,l]=nc(o,a.maxCount,a.withSuffix);c!==o&&(n.title=l,o=c)}let s=I(a.tag,n,o);t.append(s)}}function Fs(e,r,t){let a=(e.mnemonicIcon||[]).filter(o=>o).map((o,s)=>({icon:o,alt:e.mnemonicAlt?.[s]??"",link:e.mnemonicLink?.[s]??""}));a?.forEach(({icon:o,alt:s,link:c})=>{if(c&&!/^https?:/.test(c))try{c=new URL(`https://${c}`).href.toString()}catch{c="#"}let l={slot:"icons",src:o,loading:r.loading,size:t?.size??"l"};s&&(l.alt=s),c&&(l.href=c);let h=I("merch-icon",l);r.append(h)});let n=r.shadowRoot.querySelector('slot[name="icons"]');n&&(n.style.display=a?.length?null:"none")}function $s(e,r,t){if(t.badge?.slot){if(e.badge?.length&&!e.badge?.startsWith("<merch-badge")){let i=hi,a=!1;t.allowedBadgeColors?.includes(t.badge?.default)&&(i=t.badge?.default,e.borderColor||(a=!0));let n=e.badgeBackgroundColor||i,o=e.borderColor||"";a&&(o=t.badge?.default,e.borderColor=t.badge?.default),e.badge=`<merch-badge variant="${e.variant}" background-color="${n}" border-color="${o}">${e.badge}</merch-badge>`}W("badge",e,r,t)}else e.badge?(r.setAttribute("badge-text",e.badge),t.disabledAttributes?.includes("badgeColor")||r.setAttribute("badge-color",e.badgeColor||Ms),t.disabledAttributes?.includes("badgeBackgroundColor")||r.setAttribute("badge-background-color",e.badgeBackgroundColor||hi),r.setAttribute("border-color",e.badgeBackgroundColor||hi)):r.setAttribute("border-color",e.borderColor||Rs)}function Us(e,r,t){if(t.trialBadge&&e.trialBadge){if(!e.trialBadge.startsWith("<merch-badge")){let i=!t.disabledAttributes?.includes("trialBadgeBorderColor")&&e.trialBadgeBorderColor||Ns;e.trialBadge=`<merch-badge variant="${e.variant}" border-color="${i}">${e.trialBadge}</merch-badge>`}W("trialBadge",e,r,t)}}function Gs(e,r,t){t?.includes(e.size)&&r.setAttribute("size",e.size)}function qs(e,r){e.cardName&&r.setAttribute("name",e.cardName)}function Vs(e,r,t){e.cardTitle&&(e.cardTitle=ht(e.cardTitle)),W("cardTitle",e,r,{cardTitle:t})}function js(e,r,t){W("subtitle",e,r,t)}function Ws(e,r,t,i){if(!e.backgroundColor||e.backgroundColor.toLowerCase()==="default"){r.style.removeProperty("--merch-card-custom-background-color"),r.removeAttribute("background-color");return}t?.[e.backgroundColor]?(r.style.setProperty("--merch-card-custom-background-color",`var(${t[e.backgroundColor]})`),r.setAttribute("background-color",e.backgroundColor)):i?.attribute&&e.backgroundColor&&(r.setAttribute(i.attribute,e.backgroundColor),r.style.removeProperty("--merch-card-custom-background-color"))}function Ys(e,r,t){let i=t?.borderColor,a="--consonant-merch-card-border-color";if(e.borderColor?.toLowerCase()==="transparent")r.style.setProperty(a,"transparent");else if(e.borderColor&&i){let o=i?.specialValues?.[e.borderColor]?.includes("gradient")||/-gradient/.test(e.borderColor),s=/^spectrum-.*-(plans|special-offers)$/.test(e.borderColor);if(o){r.setAttribute("gradient-border","true");let c=e.borderColor;if(i?.specialValues){for(let[l,h]of Object.entries(i.specialValues))if(h===e.borderColor){c=l;break}}r.setAttribute("border-color",c),r.style.removeProperty(a)}else s?(r.setAttribute("border-color",e.borderColor),r.style.setProperty(a,`var(--${e.borderColor})`)):r.style.setProperty(a,`var(--${e.borderColor})`)}}var Xs=new Set(["","default"]);function Zs(e,r,t){let i=t?.whatsIncludedDividerColor,a="--consonant-merch-card-whats-included-divider-color";if(!i)return;let o=(r.querySelector('[slot="footer-rows"] merch-whats-included')??r.querySelector("merch-whats-included"))?.getAttribute("whats-included-divider-color")?.trim(),s=e.whatsIncludedDividerColor!=null?String(e.whatsIncludedDividerColor).trim():"",c=o||s;if(c==null||Xs.has(String(c).trim().toLowerCase())){r.removeAttribute("whats-included-divider-color"),r.style.removeProperty(a);return}let l=String(c).trim();if(l.toLowerCase()==="transparent"){r.removeAttribute("whats-included-divider-color"),r.style.setProperty(a,"transparent");return}let u=i.specialValues?.[l]?.includes("gradient")||/-gradient/.test(l)||/^gradient-/.test(l),m=/^spectrum-.*-(plans|special-offers)$/.test(l);if(u){let b=l;if(i.specialValues){for(let[L,M]of Object.entries(i.specialValues))if(M===l){b=L;break}}r.setAttribute("whats-included-divider-color",b),r.style.removeProperty(a)}else m?(r.setAttribute("whats-included-divider-color",l),r.style.setProperty(a,`var(--${l})`)):(r.removeAttribute("whats-included-divider-color"),r.style.setProperty(a,`var(--${l})`))}function Ks(e,r,t){if(e.backgroundImage){let i={loading:r.loading??"lazy",src:e.backgroundImage};if(e.backgroundImageAltText?i.alt=e.backgroundImageAltText:i.role="none",!t)return;if(t?.attribute){r.setAttribute(t.attribute,e.backgroundImage);return}r.append(I(t.tag,{slot:t.slot},I("img",i)))}}function ht(e){return!e||typeof e!="string"||e.includes("<mas-mnemonic")&&Promise.resolve().then(()=>(Ar(),Cr)).catch(console.error),e}function Qs(e,r,t){e.prices&&(e.prices=ht(e.prices)),W("prices",e,r,t)}function An(e,r,t){let i=e.hasAttribute("data-wcs-osi")&&!!e.getAttribute("data-wcs-osi"),a=e.className||"",n=Os.exec(a)?.[0]??"accent",o=n.includes("accent"),s=n.includes("primary"),c=n.includes("secondary"),l=n.includes("-outline"),h=n.includes("-link");e.classList.remove("accent","primary","secondary");let u;if(r.consonant)u=lc(e,o,i,h,s,c,t?.ctas?.size);else if(h)u=e;else{let m;o?m="accent":s?m="primary":c&&(m="secondary"),u=r.spectrum==="swc"?cc(e,t,l,m,i):sc(e,t,l,m,i)}return u}function Js(e,r){let{slot:t}=r?.description,i=e.querySelectorAll(`[slot="${t}"] a[data-wcs-osi]`);i.length&&i.forEach(a=>{let n=An(a,e,r);a.replaceWith(n)})}function ec(e,r,t,i){e.description&&(e.description=ht(e.description)),e.promoText&&(e.promoText=ht(e.promoText)),e.shortDescription&&(e.shortDescription=ht(e.shortDescription)),W("promoText",e,r,t),W("description",e,r,t),W("shortDescription",e,r,t),e.shortDescription&&(r.setAttribute("action-menu","true"),e.actionMenuLabel||r.setAttribute("action-menu-label","More options")),Js(r,t),W("callout",e,r,t),tc(e,r,t,i),W("whatsIncluded",e,r,t)}function tc(e,r,t,i={}){t.quantitySelect&&(e.quantitySelect||(e.quantitySelect=i.quantitySelect),W("quantitySelect",e,r,t))}function rc(e,r,t,i={}){if(!t.addon)return;let n=(e.addon??i.addon)?.replace(/[{}]/g,"");if(!n||/disabled/.test(n))return;let o=I("merch-addon",{slot:"addon"},n);[...o.querySelectorAll(C)].forEach(s=>{let c=s.parentElement;c?.nodeName==="P"&&c.setAttribute("data-plan-type","")}),r.append(o)}function ic(e,r,t){e.addonConfirmation&&W("addonConfirmation",e,r,t)}function ac(e,r,t,i){i?.secureLabel&&t?.secureLabel&&r.setAttribute("secure-label",i.secureLabel)}function nc(e,r,t=!0){try{let i=typeof e!="string"?"":e,a=Cn(i);if(a.length<=r)return[i,a];let n=0,o=!1,s=t?r-pi.length<1?1:r-pi.length:r,c=[];for(let u of i){if(n++,u==="<")if(o=!0,i[n]==="/")c.pop();else{let m="";for(let b of i.substring(n)){if(b===" "||b===">")break;m+=b}c.push(m)}if(u==="/"&&i[n]===">"&&c.pop(),u===">"){o=!1;continue}if(!o&&(s--,s===0))break}let l=i.substring(0,n).trim();if(c.length>0){c[0]==="p"&&c.shift();for(let u of c.reverse())l+=`</${u}>`}return[`${l}${t?pi:""}`,a]}catch{let a=typeof e=="string"?e:"",n=Cn(a);return[a,n]}}function Cn(e){if(!e)return"";let r="",t=!1;for(let i of e){if(i==="<"&&(t=!0),i===">"){t=!1;continue}t||(r+=i)}return r}function oc(e,r){r.querySelectorAll("a.upt-link").forEach(i=>{let a=we.createFrom(i);i.replaceWith(a),a.initializeWcsData(e.osi,e.promoCode)})}function sc(e,r,t,i,a){let n=e;a?n=customElements.get("checkout-button").createCheckoutButton({},e.innerHTML):n.innerHTML=`<span>${n.textContent}</span>`,n.setAttribute("tabindex",0);for(let h of e.attributes)["class","is"].includes(h.name)||n.setAttribute(h.name,h.value);n.firstElementChild?.classList.add("spectrum-Button-label");let o=r?.ctas?.size??"M",s=`spectrum-Button--${i}`,c=Bs.includes(o)?`spectrum-Button--size${o}`:"spectrum-Button--sizeM",l=["spectrum-Button",s,c];return t&&l.push("spectrum-Button--outline"),n.classList.add(...l),n}function cc(e,r,t,i,a){let n=e;a&&(n=customElements.get("checkout-button").createCheckoutButton(e.dataset),n.connectedCallback(),n.render());let o="fill";t&&(o="outline");let s=I("sp-button",{treatment:o,variant:i,tabIndex:0,size:r?.ctas?.size??"m",...e.dataset.analyticsId&&{"data-analytics-id":e.dataset.analyticsId}},e.innerHTML);return s.source=n,(a?n.onceSettled():Promise.resolve(n)).then(c=>{s.setAttribute("data-navigation-url",c.href)}),s.addEventListener("click",c=>{c.defaultPrevented||n.click()}),s}function lc(e,r,t,i,a,n,o){let s=e;if(t)try{let c=customElements.get("checkout-link");c&&(s=c.createCheckoutLink(e.dataset,e.innerHTML)??e)}catch{}return i||(s.classList.add("button","con-button"),o&&o!=="m"&&s.classList.add(`button-${o}`),r&&s.classList.add("blue"),a&&s.classList.add("primary"),n&&s.classList.add("secondary")),s}function dc(e,r,t,i,a){if(e.ctas){e.ctas=ht(e.ctas);let{slot:n}=t.ctas,o=I("div",{slot:n},e.ctas),s=[...o.querySelectorAll("a")],c=a?.hideTrialCTAs?s.filter(h=>!Hs.has(h.dataset.analyticsId)):s,l=(c.length>0?c:s).map(h=>An(h,r,t));o.textContent="",o.append(...l),r.append(o),a?.hideTrialCTAs&&c.length>0&&l.forEach(h=>{let u=h.source??h;u.onceSettled&&(h.hidden=!0,u.onceSettled().then(()=>{u.value?.[0]?.offerType==="TRIAL"&&l.some(b=>b!==h&&!b.hidden)?h.remove():h.hidden=!1}).catch(()=>{h.hidden=!1}))})}}function hc(e,r){let{tags:t}=e,i=t?.find(n=>typeof n=="string"&&n.startsWith(Is))?.split("/").pop();if(!i)return;r.setAttribute(yr,i),[...r.shadowRoot.querySelectorAll("a[data-analytics-id],button[data-analytics-id]"),...r.querySelectorAll("a[data-analytics-id],button[data-analytics-id]")].forEach((n,o)=>{n.setAttribute(Ds,`${n.dataset.analyticsId}-${o+1}`)})}function pc(e){e.spectrum==="css"&&[["primary-link","primary"],["secondary-link","secondary"]].forEach(([r,t])=>{e.querySelectorAll(`a.${r}`).forEach(i=>{i.classList.remove(r),i.classList.add("spectrum-Link",`spectrum-Link--${t}`)})})}function mc(e){e.querySelectorAll("[slot]").forEach(i=>{i.remove()}),e.variant=void 0,["checkbox-label","stock-offer-osis","secure-label","background-image","background-color","border-color","whats-included-divider-color","badge-background-color","badge-color","badge-text","gradient-border","size",yr].forEach(i=>e.removeAttribute(i));let t=["wide-strip","thin-strip"];e.classList.remove(...t)}async function Tn(e,r){if(!e){let c=r?.id||"unknown";throw console.error(`hydrate: Fragment is undefined. Cannot hydrate card (merchCard id: ${c}).`),new Error(`hydrate: Fragment is undefined for card (merchCard id: ${c}).`)}if(!e.fields){let c=e.id||"unknown",l=r?.id||"unknown";throw console.error(`hydrate: Fragment for card ID '${c}' (merchCard id: ${l}) is missing 'fields'. Cannot hydrate.`),new Error(`hydrate: Fragment for card ID '${c}' (merchCard id: ${l}) is missing 'fields'.`)}let{id:t,fields:i,settings:a={},priceLiterals:n}=e,{variant:o}=i;if(!o)throw new Error(`hydrate: no variant found in payload ${t}`);mc(r),r.compatVersion=i.compatVersion,r.contextPromotionCode=i.promoCode,r.settings=a,n&&(r.priceLiterals=n),r.id??(r.id=e.id),e.variationId&&r.setAttribute("variation-id",e.variationId??""),r.variant=o,await r.updateComplete;let{aemFragmentMapping:s}=r.variantLayout;if(!s)throw new Error(`hydrate: variant mapping not found for ${t}`);s.style==="consonant"&&r.setAttribute("consonant",!0),Fs(i,r,s.mnemonics),Us(i,r,s),Gs(i,r,s.size),qs(i,r),Vs(i,r,s.title),$s(i,r,s),js(i,r,s),Qs(i,r,s),Ks(i,r,s.backgroundImage),Ws(i,r,s.allowedColors,s.backgroundColor),Ys(i,r,s),ec(i,r,s,a),Zs(i,r,s),rc(i,r,s,a),ic(i,r,s),ac(i,r,s,a);try{oc(i,r)}catch{}dc(i,r,s,o,a),hc(i,r),pc(r)}var Er="merch-card",kn="merch-card:",zn=["full-pricing-express","simplified-pricing-express"],Mn=["segment","product"];function Ln(e,r){let t=e.closest(Er);if(!t)return r;t.priceLiterals&&(r.literals??(r.literals={}),Object.assign(r.literals,t.priceLiterals)),Bi(e)&&(r.displayPerUnit=!1,r.displayTax=!1),!r.promotionCode&&t.compatVersion>=1&&(r.promotionCode=t.contextPromotionCode),t.aemFragment&&(r[Ii]=!0),t.variantLayout?.priceOptionsProvider?.(e,r),e.dataset.template===D&&(r.displayDot??(r.displayDot=t.variantLayout?.legalDisplayDot??!0))}function _n(e,r){let t=e.closest(Er);if(!t)return r;!r.promotionCode&&t.compatVersion>=1&&(r.promotionCode=t.contextPromotionCode)}function gc(e){e.providers.has(Ln)||e.providers.price(Ln),e.providers.has(_n)||e.providers.checkout(_n)}var Ft=new IntersectionObserver(e=>{e.forEach(r=>{let t=r.target;if(zn.includes(t.variant)){if(t.clientHeight===0)return;Ft.unobserve(t),t.requestUpdate();return}if(Mn.includes(t.variant)){if(r.boundingClientRect.width===0)return;if(t.variant==="product"&&t.querySelector('merch-icon[slot="icons"]')){Ft.unobserve(t);return}let i=t.getBoundingClientRect().width,n=t.querySelector('[slot="badge"]')?.getBoundingClientRect().width||0;if(i===0||n===0){Ft.unobserve(t);return}t.style.setProperty("--consonant-merch-card-heading-xs-max-width",`${Math.round(i-n-16)}px`),Ft.unobserve(t)}})}),fc=0,pt,mt,ut,oe,Ie,Y,De,z,Oe,$t,mi,wr,Ee=class extends uc{constructor(){super();f(this,z);p(this,"contextPromotionCode");f(this,pt);f(this,mt);f(this,ut);f(this,oe);f(this,Ie);f(this,Y);f(this,De,new Promise(t=>{g(this,Y,t)}));p(this,"compatVersion");p(this,"customerSegment");p(this,"marketSegment");p(this,"variantLayout");this.id=null,this.failed=!1,this.filters={},this.types="",this.selected=!1,this.spectrum="css",this.loading="lazy",this.handleAemFragmentEvents=this.handleAemFragmentEvents.bind(this),this.handleMerchOfferSelectReady=this.handleMerchOfferSelectReady.bind(this)}firstUpdated(){this.variantLayout=ei(this),this.variantLayout?.connectedCallbackHook()}willUpdate(t){(t.has("variant")||!this.variantLayout)&&(this.variantLayout?.disconnectedCallbackHook(),this.variantLayout=ei(this),this.variantLayout?.connectedCallbackHook())}updated(t){!this.style.getPropertyValue("--consonant-merch-card-border-color")&&this.computedBorderColor&&(t.has("badgeBackgroundColor")||t.has("borderColor"))&&this.style.setProperty("--consonant-merch-card-border-color",this.computedBorderColor),t.has("backgroundColor")&&this.style.setProperty("--merch-card-custom-background-color",this.backgroundColor?`var(--${this.backgroundColor})`:"");try{this.variantLayoutPromise=this.variantLayout?.postCardUpdateHook(t)}catch(i){_(this,z,Oe).call(this,`Error in postCardUpdateHook: ${i.message}`,{},!1)}}get theme(){return this.closest("sp-theme")}get dir(){return this.closest("[dir]")?.getAttribute("dir")??"ltr"}render(){if(!(!this.isConnected||!this.variantLayout||this.style.display==="none"))return this.variantLayout.renderLayout()}get computedBorderColor(){return["ccd-slice","ccd-suggested","ah-promoted-plans","simplified-pricing-express","full-pricing-express"].includes(this.variant)?"":this.borderColor?this.borderColor:this.badgeBackgroundColor}get badgeElement(){return this.shadowRoot.getElementById("badge")}get headingmMSlot(){return this.shadowRoot.querySelector('slot[name="heading-m"]').assignedElements()[0]}get footerSlot(){return this.shadowRoot.querySelector('slot[name="footer"]')?.assignedElements()[0]}get descriptionSlot(){return this.shadowRoot.querySelector('slot[name="body-xs"')?.assignedElements()[0]}get descriptionSlotCompare(){return this.shadowRoot.querySelector('slot[name="body-m"')?.assignedElements()[0]}get iconButton(){return this.querySelector('[slot="callout-content"] .icon-button')}get price(){return this.headingmMSlot?.querySelector(C)}get checkoutLinks(){return[...this.footerSlot?.querySelectorAll(ce)??[]]}get checkoutLinksDescription(){return[...this.descriptionSlot?.querySelectorAll(ce)??[]]}get checkoutLinkDescriptionCompare(){return[...this.descriptionSlotCompare?.querySelectorAll(ce)??[]]}get activeDescriptionLinks(){return this.variant==="mini-compare-chart"||this.variant==="mini-compare-chart-mweb"?this.checkoutLinkDescriptionCompare:this.checkoutLinksDescription}async toggleStockOffer({target:t}){if(!this.stockOfferOsis)return;let i=this.checkoutLinks;if(i.length!==0)for(let a of i){await a.onceSettled();let n=a.value?.[0]?.planType;if(!n)return;let o=this.stockOfferOsis[n];if(!o)return;let s=a.dataset.wcsOsi.split(",").filter(c=>c!==o);t.checked&&s.push(o),a.dataset.wcsOsi=s.join(",")}}changeHandler(t){t.target.tagName==="MERCH-ADDON"&&this.toggleAddon(t.target)}toggleAddon(t){this.variantLayout?.toggleAddon?.(t);let i=[...this.checkoutLinks,...this.activeDescriptionLinks??[]];if(i.length===0)return;let a=n=>{let{offerType:o,planType:s}=n.value?.[0]??{};if(!o||!s)return;let c=t.getOsi(s,o),l=(n.dataset.wcsOsi||"").split(",").filter(h=>h&&h!==c);t.checked&&l.push(c),n.dataset.wcsOsi=l.join(",")};i.forEach(a)}handleQuantitySelection(t){let i=[...this.checkoutLinks,...this.activeDescriptionLinks??[]];if(i.length!==0)for(let a of i)a.dataset.quantity=t.detail.option}get titleElement(){return this.querySelector(this.variantLayout?.headingSelector||".card-heading")}get title(){return this.titleElement?.textContent?.trim()}get description(){return this.querySelector('[slot="body-xs"]')?.textContent?.trim()}updateFilters(t){let i={...this.filters};Object.keys(i).forEach(a=>{if(t){i[a].order=Math.min(i[a].order||2,2);return}let n=i[a].order;n===1||isNaN(n)||(i[a].order=Number(n)+1)}),this.filters=i}showInfoTooltip(t,i){let a="tooltip-left",n="tooltip-right";window.screen.width<600&&t.getAttribute("data-tooltip")?.length>12&&(this.iconButton.classList.remove(a),this.iconButton.classList.remove(n),t.getBoundingClientRect().x<100&&this.iconButton.classList.add(a),t.getBoundingClientRect().x>window.screen.width-100&&this.iconButton.classList.add(n)),this.iconButton.classList.add(i)}handleInfoIconEvents(){let t="tooltip-visible";this.iconButton&&(["mouseenter","focus"].forEach(i=>this.iconButton.addEventListener(i,a=>this.showInfoTooltip(a.target,t),!1)),["mouseleave","blur"].forEach(i=>this.iconButton.addEventListener(i,()=>this.iconButton.classList.remove(t),!1)),this.iconButton.addEventListener("keydown",i=>{i.key==="Escape"&&this.iconButton.classList.remove(t)}))}includes(t){return this.textContent.match(new RegExp(t,"i"))!==null}connectedCallback(){var i;super.connectedCallback(),d(this,mt)||g(this,mt,fc++),this.aemFragment||((i=d(this,Y))==null||i.call(this),g(this,Y,void 0)),this.id??(this.id=this.getAttribute("id")??this.aemFragment?.getAttribute("fragment"));let t=this.id??d(this,mt);g(this,Ie,`${kn}${t}${Vt}`),g(this,pt,`${kn}${t}${jt}`),performance.mark(d(this,Ie)),g(this,oe,Ae()),gc(d(this,oe)),g(this,ut,d(this,oe).Log.module(Er)),this.addEventListener($,this.handleQuantitySelection),this.addEventListener(kr,this.handleAddonAndQuantityUpdate),this.addEventListener(ki,this.handleMerchOfferSelectReady),this.addEventListener(qe,this.handleAemFragmentEvents),this.addEventListener(Ge,this.handleAemFragmentEvents),this.addEventListener(Gt,this.handleInfoIconEvents),this.addEventListener("change",this.changeHandler),this.variantLayout&&this.variantLayout.connectedCallbackHook(),this.aemFragment||setTimeout(()=>this.checkReady(),0)}disconnectedCallback(){super.disconnectedCallback(),this.variantLayout?.disconnectedCallbackHook(),this.removeEventListener($,this.handleQuantitySelection),this.removeEventListener(qe,this.handleAemFragmentEvents),this.removeEventListener(Ge,this.handleAemFragmentEvents),this.removeEventListener(Gt,this.handleInfoIconEvents),this.removeEventListener("change",this.changeHandler),this.removeEventListener(kr,this.handleAddonAndQuantityUpdate)}async handleAemFragmentEvents(t){var i;if(this.isConnected&&(t.type===qe&&_(this,z,Oe).call(this,"AEM fragment cannot be loaded"),t.type===Ge&&(this.failed=!1,t.target.nodeName==="AEM-FRAGMENT"))){let a=t.detail;try{d(this,Y)||g(this,De,new Promise(n=>{g(this,Y,n)})),Tn(a,this)}catch(n){_(this,z,Oe).call(this,`hydration has failed: ${n.message}`)}finally{(i=d(this,Y))==null||i.call(this),g(this,Y,void 0)}this.checkReady()}}async checkReady(){if(!this.isConnected||this.failed)return;d(this,De)&&(await d(this,De),(zn.includes(this.variant)||Mn.includes(this.variant))&&Ft.observe(this),g(this,De,void 0)),this.variantLayoutPromise&&(await this.variantLayoutPromise,this.variantLayoutPromise=void 0);let t=new Promise(o=>setTimeout(()=>o("timeout"),$e));if(this.aemFragment){let o=await Promise.race([this.aemFragment.updateComplete,t]);if(o===!1||o==="timeout"){let s=o==="timeout"?`AEM fragment was not resolved within ${$e} timeout`:"AEM fragment cannot be loaded";_(this,z,Oe).call(this,s,{},!1);return}}let i=[...this.querySelectorAll(Ti)],a=Promise.all(i.map(o=>o.onceSettled().catch(()=>o))).then(o=>o.every(s=>s.classList.contains("placeholder-resolved"))),n=await Promise.race([a,t]);if(n===!0){this.measure=performance.measure(d(this,pt),d(this,Ie));let o={...this.aemFragment?.fetchInfo,...d(this,oe).duration,measure:Ve(this.measure)};return this.dispatchEvent(new CustomEvent(Gt,{bubbles:!0,composed:!0,detail:o})),this}else{this.measure=performance.measure(d(this,pt),d(this,Ie));let o={measure:Ve(this.measure),...d(this,oe).duration};if(n==="timeout")_(this,z,Oe).call(this,`Contains offers that were not resolved within ${$e} timeout`,o);else{let s=i.some(c=>c.matches(ce)&&c.classList.contains("placeholder-failed"));_(this,z,Oe).call(this,s?"CTA has an invalid offer":"Contains unresolved offers",o)}}}get aemFragment(){return this.querySelector("aem-fragment")}get addon(){return this.querySelector("merch-addon")}get quantitySelect(){return this.querySelector("merch-quantity-select")}get addonCheckbox(){return this.querySelector("merch-addon")}displayFooterElementsInColumn(){if(!this.classList.contains("product"))return;let t=this.shadowRoot.querySelector(".secure-transaction-label");(this.footerSlot?.querySelectorAll(ce)).length===2&&t&&t.parentElement.classList.add("footer-column")}handleMerchOfferSelectReady(){this.offerSelect&&!this.offerSelect.planType||this.displayFooterElementsInColumn()}get dynamicPrice(){return this.querySelector('[slot="price"]')}handleAddonAndQuantityUpdate({detail:{id:t,items:i}}){if(!t||!i?.length||this.closest('[role="tabpanel"][hidden="true"]'))return;let n=this.checkoutLinks.find(h=>h.getAttribute("data-modal-id")===t);if(!n)return;let s=new URL(n.getAttribute("href")).searchParams.get("pa"),c=i.find(h=>h.productArrangementCode===s)?.quantity,l=!!i.find(h=>h.productArrangementCode!==s);if(c&&this.quantitySelect?.dispatchEvent(new CustomEvent(_i,{detail:{quantity:c},bubbles:!0,composed:!0})),this.addonCheckbox&&this.addonCheckbox.checked!==l){this.toggleStockOffer({target:this.addonCheckbox});let h=new Event("change",{bubbles:!0,cancelable:!0});Object.defineProperty(h,"target",{writable:!1,value:{checked:l}}),this.addonCheckbox.handleChange(h)}}get prices(){return Array.from(this.querySelectorAll(C))}get promoPrice(){if(!this.querySelector("span.price-strikethrough"))return;let t=this.querySelector(".price.price-alternative");if(t||(t=this.querySelector(`${C}[data-template="price"] > span`)),!!t)return t=t.innerText,t}get regularPrice(){return d(this,z,$t)?.innerText}get promotionCode(){let t=[...this.querySelectorAll(`${C}[data-promotion-code],${ce}[data-promotion-code]`)].map(a=>a.dataset.promotionCode).filter(a=>![void 0,"cancel-context"].includes(a));if(t.length===0)return this.contextPromotionCode;let i=[...new Set(t)];return i.length>1&&d(this,ut)?.warn(`Multiple different promotion codes found: ${i.join(", ")}`),t[0]}get annualPrice(){return this.querySelector(`${C}[data-template="price"] > .price.price-annual`)?.innerText}get promoText(){}get taxText(){return(d(this,z,mi)??d(this,z,$t))?.querySelector("span.price-tax-inclusivity")?.textContent?.trim()||void 0}get recurrenceText(){return d(this,z,$t)?.querySelector("span.price-recurrence")?.textContent?.trim()}get unitText(){let t=".price-unit-type";return d(this,z,mi)?.querySelector(t)?.textContent?.trim()??d(this,z,$t)?.querySelector(t)?.textContent?.trim()??this.querySelector(t)?.textContent?.trim()??void 0}get planTypeText(){return this.querySelector('[is="inline-price"][data-template="legal"] span.price-plan-type')?.textContent?.trim()}get seeTermsInfo(){let t=this.querySelector('a[is="upt-link"]');if(t)return _(this,z,wr).call(this,t)}get renewalText(){return this.querySelector("span.renewal-text")?.textContent?.trim()}get promoDurationText(){return this.querySelector("span.promo-duration-text")?.textContent?.trim()}get ctas(){let t=this.querySelector('[slot="ctas"], [slot="footer"]')?.querySelectorAll(`${ce}, a`);return Array.from(t??[])}get primaryCta(){return _(this,z,wr).call(this,this.ctas.find(t=>t.variant==="accent"||t.matches(".spectrum-Button--accent,.con-button.blue")))}get secondaryCta(){return _(this,z,wr).call(this,this.ctas.find(t=>t.variant!=="accent"&&!t.matches(".spectrum-Button--accent,.con-button.blue")))}};pt=new WeakMap,mt=new WeakMap,ut=new WeakMap,oe=new WeakMap,Ie=new WeakMap,Y=new WeakMap,De=new WeakMap,z=new WeakSet,Oe=function(t,i={},a=!0){var c;if(!this.isConnected)return;let o=this.aemFragment?.getAttribute("fragment");o=`[${o}]`;let s={...this.aemFragment.fetchInfo,...d(this,oe).duration,...i,message:t};d(this,ut).error(`merch-card${o}: ${t}`,s),this.failed=!0,(c=d(this,Y))==null||c.call(this),g(this,Y,void 0),d(this,oe).isPreview()||(this.style.display="none"),a&&this.dispatchEvent(new CustomEvent(Pi,{bubbles:!0,composed:!0,detail:s}))},$t=function(){return this.querySelector("span.price-strikethrough")??this.querySelector(`${C}[data-template="price"] > span`)},mi=function(){return this.querySelector(`${C}[data-template="legal"]`)},wr=function(t){if(t)return{text:t.innerText.trim(),analyticsId:t.dataset.analyticsId,href:t.getAttribute("href")??t.dataset.href}},p(Ee,"properties",{id:{type:String,attribute:"id",reflect:!0},name:{type:String,attribute:"name",reflect:!0},variant:{type:String,reflect:!0},size:{type:String,attribute:"size",reflect:!0},badgeColor:{type:String,attribute:"badge-color",reflect:!0},borderColor:{type:String,attribute:"border-color",reflect:!0},backgroundColor:{type:String,attribute:"background-color",reflect:!0},badgeBackgroundColor:{type:String,attribute:"badge-background-color",reflect:!0},backgroundImage:{type:String,attribute:"background-image",reflect:!0},badgeText:{type:String,attribute:"badge-text"},actionMenu:{type:Boolean,attribute:"action-menu"},actionMenuLabel:{type:String,attribute:"action-menu-label"},customHr:{type:Boolean,attribute:"custom-hr"},consonant:{type:Boolean,attribute:"consonant"},failed:{type:Boolean,attribute:"failed",reflect:!0},spectrum:{type:String,attribute:"spectrum"},detailBg:{type:String,attribute:"detail-bg"},secureLabel:{type:String,attribute:"secure-label"},checkboxLabel:{type:String,attribute:"checkbox-label"},addonTitle:{type:String,attribute:"addon-title"},addonOffers:{type:Object,attribute:"addon-offers"},selected:{type:Boolean,attribute:"aria-selected",reflect:!0},storageOption:{type:String,attribute:"storage",reflect:!0},planType:{type:String,attribute:"plan-type",reflect:!0},heightSync:{type:Boolean,attribute:"height-sync"},settings:{type:Object,attribute:!1},stockOfferOsis:{type:Object,attribute:"stock-offer-osis",converter:{fromAttribute:t=>{if(!t)return;let[i,a,n]=t.split(",");return{PUF:i,ABM:a,M2M:n}}}},filters:{type:String,reflect:!0,converter:{fromAttribute:t=>Object.fromEntries(t.split(",").map(i=>{let[a,n,o]=i.split(":"),s=Number(n);return[a,{order:isNaN(s)?void 0:s,size:o}]})),toAttribute:t=>Object.entries(t).map(([i,{order:a,size:n}])=>[i,a,n].filter(o=>o!=null).join(":")).join(",")}},types:{type:String,attribute:"types",reflect:!0},merchOffer:{type:Object},analyticsId:{type:String,attribute:yr,reflect:!0},loading:{type:String},priceLiterals:{type:Object}}),p(Ee,"styles",[Ei,...Si()]),p(Ee,"registerVariant",P),p(Ee,"getCollectionOptions",en),p(Ee,"getFragmentMapping",Xt);customElements.define(Er,Ee);export{Ee as MerchCard};
