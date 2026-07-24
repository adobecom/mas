var Oa=Object.defineProperty;var Na=e=>{throw TypeError(e)};var Fs=(e,r,t)=>r in e?Oa(e,r,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[r]=t;var Us=(e,r)=>{for(var t in r)Oa(e,t,{get:r[t],enumerable:!0})};var u=(e,r,t)=>Fs(e,typeof r!="symbol"?r+"":r,t),Jr=(e,r,t)=>r.has(e)||Na("Cannot "+t);var v=(e,r,t)=>(Jr(e,r,"read from private field"),t?t.call(e):r.get(e)),k=(e,r,t)=>r.has(e)?Na("Cannot add the same private member more than once"):r instanceof WeakSet?r.add(e):r.set(e,t),w=(e,r,t,i)=>(Jr(e,r,"write to private field"),i?i.call(e,t):r.set(e,t),t),V=(e,r,t)=>(Jr(e,r,"access private method"),t);import{html as Le,LitElement as Ps,css as Ls,unsafeCSS as _s,nothing as ue}from"./lit-all.min.js";var N="(max-width: 767px)",Y="(max-width: 1199px)",R="(min-width: 768px)",C="(min-width: 1200px)",Q="(min-width: 1600px)",Ia="(min-width: 1280px)",Da={matchMobile:window.matchMedia(N),matchDesktop:window.matchMedia(`${C} and (not ${Q})`),matchDesktopOrUp:window.matchMedia(C),matchLargeDesktop:window.matchMedia(Q),get isMobile(){return this.matchMobile.matches},get isDesktop(){return this.matchDesktop.matches},get isDesktopOrUp(){return this.matchDesktopOrUp.matches}},_=Da;function sr(){return Da.isDesktop}var Ct=class{constructor(r,t){this.key=Symbol("match-media-key"),this.matches=!1,this.host=r,this.host.addController(this),this.media=window.matchMedia(t),this.matches=this.media.matches,this.onChange=this.onChange.bind(this),r.addController(this)}hostConnected(){var r;(r=this.media)==null||r.addEventListener("change",this.onChange)}hostDisconnected(){var r;(r=this.media)==null||r.removeEventListener("change",this.onChange)}onChange(r){this.matches!==r.matches&&(this.matches=r.matches,this.host.requestUpdate(this.key,!this.matches))}};var Ha="hashchange";function $s(e=window.location.hash){let r=[],t=e.replace(/^#/,"").split("&");for(let i of t){let[a,n=""]=i.split("=");a&&r.push([a,decodeURIComponent(n.replace(/\+/g," "))])}return Object.fromEntries(r)}function Tt(e){let r=new URLSearchParams(window.location.hash.slice(1));Object.entries(e).forEach(([a,n])=>{n?r.set(a,n):r.delete(a)}),r.sort();let t=r.toString();if(t===window.location.hash)return;let i=window.scrollY||document.documentElement.scrollTop;window.location.hash=t,window.scrollTo(0,i)}function Ba(e){let r=()=>{if(window.location.hash&&!window.location.hash.includes("="))return;let t=$s(window.location.hash);e(t)};return r(),window.addEventListener(Ha,r),()=>{window.removeEventListener(Ha,r)}}var Ci={};Us(Ci,{CLASS_NAME_FAILED:()=>li,CLASS_NAME_HIDDEN:()=>qs,CLASS_NAME_PENDING:()=>di,CLASS_NAME_RESOLVED:()=>hi,CheckoutWorkflow:()=>nc,CheckoutWorkflowStep:()=>re,Commitment:()=>$e,ERROR_MESSAGE_BAD_REQUEST:()=>pi,ERROR_MESSAGE_MISSING_LITERALS_URL:()=>rc,ERROR_MESSAGE_OFFER_NOT_FOUND:()=>mi,EVENT_AEM_ERROR:()=>si,EVENT_AEM_LOAD:()=>oi,EVENT_COMPARE_CHART_REHYDRATE:()=>ec,EVENT_EXPANDED_GROUPS_CHANGE:()=>tc,EVENT_MAS_ERROR:()=>ci,EVENT_MAS_READY:()=>dr,EVENT_MERCH_ADDON_AND_QUANTITY_UPDATE:()=>Qs,EVENT_MERCH_CARD_ACTION_MENU_TOGGLE:()=>ri,EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED:()=>he,EVENT_MERCH_CARD_COLLECTION_SHOWMORE:()=>ai,EVENT_MERCH_CARD_COLLECTION_SIDENAV_ATTACHED:()=>kt,EVENT_MERCH_CARD_COLLECTION_SORT:()=>ii,EVENT_MERCH_CARD_QUANTITY_CHANGE:()=>lr,EVENT_MERCH_OFFER_READY:()=>Ws,EVENT_MERCH_OFFER_SELECT_READY:()=>Ys,EVENT_MERCH_QUANTITY_SELECTOR_CHANGE:()=>te,EVENT_MERCH_SEARCH_CHANGE:()=>Js,EVENT_MERCH_SIDENAV_SELECT:()=>ni,EVENT_MERCH_STOCK_CHANGE:()=>Ks,EVENT_MERCH_STORAGE_CHANGE:()=>Zs,EVENT_OFFER_SELECTED:()=>Xs,EVENT_TYPE_FAILED:()=>ui,EVENT_TYPE_READY:()=>cr,EVENT_TYPE_RESOLVED:()=>Ee,Env:()=>ge,FF_ANNUAL_PRICE:()=>it,FF_DEFAULTS:()=>Ae,HEADER_X_REQUEST_ID:()=>_t,LOG_NAMESPACE:()=>gi,Landscape:()=>Re,MARK_DURATION_SUFFIX:()=>Si,MARK_START_SUFFIX:()=>Ei,MERCH_CARD_LOAD_TIMEOUT:()=>ei,MODAL_TYPE_3_IN_1:()=>Ge,NAMESPACE:()=>Gs,PARAM_AOS_API_KEY:()=>ic,PARAM_ENV:()=>vi,PARAM_LANDSCAPE:()=>xi,PARAM_MAS_PREVIEW:()=>fi,PARAM_WCS_API_KEY:()=>ac,PROVIDER_ENVIRONMENT:()=>wi,SELECTOR_MAS_CHECKOUT_LINK:()=>Fa,SELECTOR_MAS_ELEMENT:()=>ti,SELECTOR_MAS_INLINE_PRICE:()=>j,SELECTOR_MAS_SP_BUTTON:()=>js,SELECTOR_MAS_UPT_LINK:()=>Ua,SORT_ORDER:()=>me,STATE_FAILED:()=>pe,STATE_PENDING:()=>ze,STATE_RESOLVED:()=>Se,SUPPORTED_COUNTRIES:()=>Ai,TAG_NAME_SERVICE:()=>Vs,TEMPLATE_PRICE:()=>oc,TEMPLATE_PRICE_ANNUAL:()=>cc,TEMPLATE_PRICE_LEGAL:()=>J,TEMPLATE_PRICE_STRIKETHROUGH:()=>sc,Term:()=>le,WCS_PROD_URL:()=>bi,WCS_STAGE_URL:()=>yi});var $e=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),le=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"}),Gs="merch",ei=2e4,qs="hidden",cr="wcms:commerce:ready",Vs="mas-commerce-service",j='span[is="inline-price"][data-wcs-osi]',Fa='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]',js="sp-button[data-wcs-osi]",Ua='a[is="upt-link"]',ti=`${j},${Fa},${Ua}`,Ws="merch-offer:ready",Ys="merch-offer-select:ready",ri="merch-card:action-menu-toggle",Xs="merch-offer:selected",Ks="merch-stock:change",Zs="merch-storage:change",te="merch-quantity-selector:change",lr="merch-card-quantity:change",Qs="merch-modal:addon-and-quantity-update",Js="merch-search:change",ii="merch-card-collection:sort",he="merch-card-collection:literals-changed",kt="merch-card-collection:sidenav-attached",ai="merch-card-collection:showmore",ni="merch-sidenav:select",oi="aem:load",si="aem:error",dr="mas:ready",ci="mas:error",ec="mas-compare-chart:rehydrate",tc="expanded-groups-change",li="placeholder-failed",di="placeholder-pending",hi="placeholder-resolved",pi="Bad WCS request",mi="Commerce offer not found",rc="Literals URL not provided",ui="mas:failed",Ee="mas:resolved",gi="mas/commerce",fi="mas.preview",vi="commerce.env",xi="commerce.landscape",ic="commerce.aosKey",ac="commerce.wcsKey",bi="https://www.adobe.com/web_commerce_artifact",yi="https://www.stage.adobe.com/web_commerce_artifact_stage",pe="failed",ze="pending",Se="resolved",Re={DRAFT:"DRAFT",PUBLISHED:"PUBLISHED"},_t="X-Request-Id",re=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"}),nc="UCv3",ge=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"}),wi={PRODUCTION:"PRODUCTION"},Ge={TWP:"twp",D2P:"d2p",CRM:"crm"},Ei=":start",Si=":duration",oc="price",sc="price-strikethrough",cc="annual",J="legal",Ae="mas-ff-defaults",it="mas-ff-annual-price",me={alphabetical:"alphabetical",authored:"authored"},Ai=["AE","AM","AR","AT","AU","AZ","BB","BD","BE","BG","BH","BO","BR","BS","BY","CA","CH","CL","CN","CO","CR","CY","CZ","DE","DK","DO","DZ","EC","EE","EG","ES","FI","FR","GB","GE","GH","GR","GT","HK","HN","HR","HU","ID","IE","IL","IN","IQ","IS","IT","JM","JO","JP","KE","KG","KR","KW","KZ","LA","LB","LK","LT","LU","LV","MA","MD","MO","MT","MU","MX","MY","NG","NI","NL","NO","NP","NZ","OM","PA","PE","PH","PK","PL","PR","PT","PY","QA","RO","RS","RU","SA","SE","SG","SI","SK","SV","TH","TJ","TM","TN","TR","TT","TW","TZ","UA","US","UY","UZ","VE","VN","YE","ZA"];var lc="mas-commerce-service";function $a(e,r){let t;return function(){let i=this,a=arguments;clearTimeout(t),t=setTimeout(()=>e.apply(i,a),r)}}var Pt=(e,r)=>e?.querySelector(`[slot="${r}"]`)?.textContent?.trim();function fe(e,r={},t=null,i=null){let a=i?document.createElement(e,{is:i}):document.createElement(e);t instanceof HTMLElement?a.appendChild(t):a.innerHTML=t;for(let[n,o]of Object.entries(r))a.setAttribute(n,o);return a}function hr(e){return`startTime:${e.startTime.toFixed(2)}|duration:${e.duration.toFixed(2)}`}function Ti(){return window.matchMedia("(max-width: 1024px)").matches}function Lt(){return document.getElementsByTagName(lc)?.[0]}function Mt(e){let r=window.getComputedStyle(e);return e.offsetHeight+parseFloat(r.marginTop)+parseFloat(r.marginBottom)}import{html as pr,nothing as dc}from"./lit-all.min.js";var at,zt=class zt{constructor(r){u(this,"card");k(this,at);this.card=r,this.insertVariantStyle()}getContainer(){return w(this,at,v(this,at)??this.card.closest('merch-card-collection, [class*="-merch-cards"]')??this.card.parentElement),v(this,at)}insertVariantStyle(){let r=this.constructor.name;if(zt.styleMap[r])return;zt.styleMap[r]=!0;let t=this.getGlobalCSS(),i=document.head.querySelector(`style[data-mas-variant-style="${r}"]`);if(i&&i.textContent===t)return;let a=document.createElement("style");a.setAttribute("data-mas-variant-style",r),a.innerHTML=t,document.head.appendChild(a)}updateCardElementMinHeight(r,t){if(!r||this.card.heightSync===!1)return;let i=`--consonant-merch-card-${this.card.variant}-${t}-height`,a=Math.max(0,parseInt(window.getComputedStyle(r).height)||0),n=this.getContainer(),o=parseInt(n.style.getPropertyValue(i))||0;a>o&&n.style.setProperty(i,`${a}px`)}syncRowHeights(r){if(this.card.heightSync===!1)return;let t=this.getContainer();if(!t)return;let i=this.card.variant,a=Array.from(t.querySelectorAll(`merch-card[variant="${i}"]`)).filter(c=>c.variantLayout?.card?.heightSync!==!1);if(a.length===0)return;for(let{name:c}of r){let l=`--consonant-merch-card-${i}-${c}-height`;t.style.getPropertyValue(l)&&t.style.removeProperty(l)}let n=new Map;for(let c of a){let l=c.getBoundingClientRect();if(l.width<=2)continue;let d=Math.round(l.top),h=n.get(d);h||(h=[],n.set(d,h)),h.push(c)}let o=new Map;for(let c of n.values())for(let l of c){let d={};for(let{name:h}of r){let m=`--consonant-merch-card-${i}-${h}-height`;d[h]=l.style.getPropertyValue(m),l.style.removeProperty(m)}o.set(l,d)}let s=new Map;for(let c of n.values())for(let l of c){let d={};for(let{name:h,getElement:m}of r){let p=m(l);p&&(d[h]=Math.max(0,parseInt(window.getComputedStyle(p).height)||0))}s.set(l,d)}for(let c of n.values())for(let{name:l}of r){let d=`--consonant-merch-card-${i}-${l}-height`,h=0;for(let m of c){let p=s.get(m)[l]??0;p>h&&(h=p)}c.forEach(m=>{h>0?m.style.setProperty(d,`${h}px`):o.get(m)[l]&&m.style.setProperty(d,o.get(m)[l])})}}get legalDisplayDot(){return!0}get badge(){let r;if(!(!this.card.badgeBackgroundColor||!this.card.badgeColor||!this.card.badgeText))return this.evergreen&&(r=`border: 1px solid ${this.card.badgeBackgroundColor}; border-right: none;`),pr`
            <div
                id="badge"
                class="${this.card.variant}-badge"
                style="background-color: ${this.card.badgeBackgroundColor};
                color: ${this.card.badgeColor};
                ${r}"
            >
                ${this.card.badgeText}
            </div>
        `}get cardImage(){return pr` <div class="image">
            <slot name="bg-image"></slot>
            ${this.badge}
        </div>`}getGlobalCSS(){return""}get theme(){return document.querySelector("sp-theme")}get evergreen(){return this.card.classList.contains("intro-pricing")}get promoBottom(){return this.card.classList.contains("promo-bottom")}get headingSelector(){return'[slot="heading-xs"]'}get secureLabel(){return this.card.secureLabel?pr`<span class="secure-transaction-label"
                  >${this.card.secureLabel}</span
              >`:dc}get secureLabelFooter(){return pr`<footer>
            ${this.secureLabel}<slot name="footer"></slot>
        </footer>`}async postCardUpdateHook(){if(this.card.isConnected&&(await this.card.updateComplete,this.card.prices?.length>0)){let r=Promise.allSettled(this.card.prices.map(a=>a.onceSettled?.()||Promise.resolve())),t,i=new Promise(a=>{t=setTimeout(a,ei)});await Promise.race([r,i]),clearTimeout(t)}}connectedCallbackHook(){}disconnectedCallbackHook(){}syncHeights(){}renderLayout(){}get aemFragmentMapping(){return mr(this.card.variant)}};at=new WeakMap,u(zt,"styleMap",{});var E=zt;import{html as ki,css as hc}from"./lit-all.min.js";var Ga=`
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

@media screen and ${N} {
    merch-card-collection-header.catalog {
        --merch-card-collection-header-columns: min-content auto;
    }
}

@media screen and ${R} {
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
}`;var qa={cardName:{attribute:"name"},badge:!0,ctas:{slot:"footer",size:"m"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},prices:{tag:"h3",slot:"heading-xs"},shortDescription:{tag:"div",slot:"action-menu-content",attributes:{tabindex:"0"}},size:["wide","super-wide"],title:{tag:"h3",slot:"heading-xs"}},nt=class extends E{constructor(t){super(t);u(this,"dispatchActionMenuToggle",()=>{this.card.dispatchEvent(new CustomEvent(ri,{bubbles:!0,composed:!0,detail:{card:this.card.name,type:"action-menu"}}))});u(this,"toggleActionMenu",t=>{!this.actionMenuContentSlot||!t||t.type!=="click"&&t.code!=="Space"&&t.code!=="Enter"||(t.preventDefault(),t.stopPropagation(),this.setMenuVisibility(!this.isMenuOpen()))});u(this,"toggleActionMenuFromCard",t=>{let i=t?.type==="mouseleave"?!0:void 0;this.card.blur(),this.setIconVisibility(!1),this.actionMenuContentSlot&&t?.type==="mouseleave"&&this.setMenuVisibility(!1)});u(this,"showActionMenuOnHover",()=>{this.actionMenu&&this.setIconVisibility(!0)});u(this,"hideActionMenu",()=>{this.setMenuVisibility(!1),this.setIconVisibility(!1)});u(this,"hideActionMenuOnBlur",t=>{t.relatedTarget===this.actionMenu||this.actionMenu?.contains(t.relatedTarget)||this.slottedContent?.contains(t.relatedTarget)||(this.isMenuOpen()&&this.setMenuVisibility(!1),this.card.contains(t.relatedTarget)||this.setIconVisibility(!1))});u(this,"handleCardFocusOut",t=>{t.relatedTarget===this.actionMenu||this.actionMenu?.contains(t.relatedTarget)||t.relatedTarget===this.card||(this.slottedContent&&(t.target===this.slottedContent||this.slottedContent.contains(t.target))&&(this.slottedContent.contains(t.relatedTarget)||this.setMenuVisibility(!1)),!this.card.contains(t.relatedTarget)&&!this.isMenuOpen()&&this.setIconVisibility(!1))});u(this,"handleKeyDown",t=>{(t.key==="Escape"||t.key==="Esc")&&(t.preventDefault(),this.hideActionMenu(),this.actionMenu?.focus())})}get actionMenu(){return this.card.shadowRoot.querySelector(".action-menu")}get actionMenuContentSlot(){return this.card.shadowRoot.querySelector('slot[name="action-menu-content"]')}get slottedContent(){return this.card.querySelector('[slot="action-menu-content"]')}setIconVisibility(t){if(this.slottedContent){if(Ti()&&this.card.actionMenu)return;this.actionMenu?.classList.toggle("invisible",!t),this.actionMenu?.classList.toggle("always-visible",t)}}setMenuVisibility(t){this.actionMenuContentSlot?.classList.toggle("hidden",!t),this.setAriaExpanded(this.actionMenu,t.toString()),t&&(this.dispatchActionMenuToggle(),setTimeout(()=>{let i=this.slottedContent?.querySelector("a");i&&i.focus()},0))}isMenuOpen(){return!this.actionMenuContentSlot?.classList.contains("hidden")}renderLayout(){return ki` <div class="body">
                <div class="top-section">
                    <slot name="icons"></slot> ${this.badge}
                    <div
                        class="action-menu
                ${this.slottedContent?Ti()&&this.card.actionMenu?"always-visible":"invisible":"hidden"}"
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
                ${this.promoBottom?"":ki`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`}
                <slot name="body-xs"></slot>
                ${this.promoBottom?ki`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`:""}
            </div>
            ${this.secureLabelFooter}
            <slot></slot>`}getGlobalCSS(){return Ga}setAriaExpanded(t,i){t.setAttribute("aria-expanded",i)}connectedCallbackHook(){this.card.addEventListener("mouseenter",this.showActionMenuOnHover),this.card.addEventListener("mouseleave",this.toggleActionMenuFromCard),this.card.addEventListener("focusin",this.showActionMenuOnHover),this.card.addEventListener("focusout",this.handleCardFocusOut),this.card.addEventListener("keydown",this.handleKeyDown)}disconnectedCallbackHook(){this.card.removeEventListener("mouseenter",this.showActionMenuOnHover),this.card.removeEventListener("mouseleave",this.toggleActionMenuFromCard),this.card.removeEventListener("focusin",this.showActionMenuOnHover),this.card.removeEventListener("focusout",this.handleCardFocusOut),this.card.removeEventListener("keydown",this.handleKeyDown)}};u(nt,"variantStyle",hc`
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
    `);import{html as Rt,css as pc}from"./lit-all.min.js";var Va=`
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

@media screen and ${R} {
  .two-merch-cards.image,
  .three-merch-cards.image,
  .four-merch-cards.image {
      grid-template-columns: repeat(2, minmax(300px, var(--consonant-merch-card-image-width)));
  }
}

@media screen and ${C} {
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
`;var ja={cardName:{attribute:"name"},badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},badgeIcon:!0,borderColor:{attribute:"border-color"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],ctas:{slot:"footer",size:"m"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},prices:{tag:"h3",slot:"heading-xs"},promoText:{tag:"p",slot:"promo-text"},size:["wide","super-wide"],title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"body-xxs"},backgroundImage:{tag:"div",slot:"bg-image"}},qe=class extends E{constructor(r){super(r)}getGlobalCSS(){return Va}renderLayout(){return Rt`<div class="image">
                <slot name="bg-image"></slot>
                <slot name="badge"></slot>
            </div>
            <div class="body">
                <slot name="icons"></slot>
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${this.promoBottom?Rt`<slot name="body-xs"></slot
                          ><slot name="promo-text"></slot>`:Rt`<slot name="promo-text"></slot
                          ><slot name="body-xs"></slot>`}
            </div>
            ${this.evergreen?Rt`
                      <div
                          class="detail-bg-container"
                          style="background: ${this.card.detailBg}"
                      >
                          <slot name="detail-bg"></slot>
                      </div>
                  `:Rt`
                      <hr />
                      ${this.secureLabelFooter}
                  `}`}};u(qe,"variantStyle",pc`
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
    `);import{html as Ya}from"./lit-all.min.js";var Wa=`
:root {
  --consonant-merch-card-inline-heading-width: 300px;
}

.one-merch-card.inline-heading,
.two-merch-cards.inline-heading,
.three-merch-cards.inline-heading,
.four-merch-cards.inline-heading {
    grid-template-columns: var(--consonant-merch-card-inline-heading-width);
}

@media screen and ${R} {
  .two-merch-cards.inline-heading,
  .three-merch-cards.inline-heading,
  .four-merch-cards.inline-heading {
      grid-template-columns: repeat(2, var(--consonant-merch-card-inline-heading-width));
  }
}

@media screen and ${C} {
  :root {
    --consonant-merch-card-inline-heading-width: 378px;
  }

  .three-merch-cards.inline-heading,
  .four-merch-cards.inline-heading {
      grid-template-columns: repeat(3, var(--consonant-merch-card-inline-heading-width));
  }
}

@media screen and ${Q} {
  .four-merch-cards.inline-heading {
      grid-template-columns: repeat(4, var(--consonant-merch-card-inline-heading-width));
  }
}
`;var ur=class extends E{constructor(r){super(r)}getGlobalCSS(){return Wa}renderLayout(){return Ya` ${this.badge}
            <div class="body">
                <div class="top-section">
                    <slot name="icons"></slot>
                    <slot name="heading-xs"></slot>
                </div>
                <slot name="body-xs"></slot>
            </div>
            ${this.card.customHr?"":Ya`<hr />`} ${this.secureLabelFooter}`}};import{html as Oe,css as mc,unsafeCSS as Ka}from"./lit-all.min.js";var Xa=`
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
@media screen and ${N} {
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

@media screen and ${Y} {
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
@media screen and ${R} {
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

@media screen and ${Q} {
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
`;var uc=32,_i=new WeakSet;function Za(e){!e||_i.has(e)||(_i.add(e),requestAnimationFrame(()=>{_i.delete(e),e.querySelector('merch-card[variant="mini-compare-chart"]')?.variantLayout?.syncHeights?.()}))}var Qa={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m-price"},promoText:{tag:"div",slot:"promo-text"},shortDescription:{tag:"div",slot:"body-xxs"},description:{tag:"div",slot:"body-m"},mnemonics:{size:"l"},quantitySelect:{tag:"div",slot:"quantity-select"},callout:{tag:"div",slot:"callout-content"},addon:!0,secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],whatsIncludedDividerColor:{attribute:"whats-included-divider-color"},allowedWhatsIncludedDividerColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],whatsIncluded:{tag:"div",slot:"footer-rows"},ctas:{slot:"footer",size:"l"},style:"consonant"},gr=class gr extends E{constructor(t){super(t);u(this,"getRowMinHeightPropertyName",t=>`--consonant-merch-card-footer-row-${t}-min-height`);u(this,"getMiniCompareFooter",()=>{let t=this.card.secureLabel?Oe`<slot name="secure-transaction-label">
                  <span class="secure-transaction-label"
                      >${this.card.secureLabel}</span
                  ></slot
              >`:Oe`<slot name="secure-transaction-label"></slot>`;return this.isNewVariant?Oe`<footer>
                ${t}
                <p class="action-area"><slot name="footer"></slot></p>
            </footer>`:Oe`<footer>${t}<slot name="footer"></slot></footer>`});this.updatePriceQuantity=this.updatePriceQuantity.bind(this)}connectedCallbackHook(){if(this.card.addEventListener(te,this.updatePriceQuantity),this.legalAdjusted&&!this.legalObserver){let t=this.card.querySelector('[is="inline-price"][data-template="legal"]');t?(this.legalResolvedHandler=()=>this.adjustShortDescription(),t.addEventListener(Ee,this.legalResolvedHandler),this.legalElement=t,this.legalObserver=new MutationObserver(()=>this.adjustShortDescription()),this.legalObserver.observe(t,{childList:!0,subtree:!0}),this.adjustShortDescription()):this.legalAdjusted=!1}this.visibilityObserver=new IntersectionObserver(([t])=>{t.boundingClientRect.height!==0&&t.isIntersecting&&(_.isMobile||Za(this.getContainer()),this.visibilityObserver.disconnect())}),this.visibilityObserver.observe(this.card)}disconnectedCallbackHook(){if(this.card.removeEventListener(te,this.updatePriceQuantity),this.visibilityObserver?.disconnect(),this.legalObserver?.disconnect(),this.legalObserver=null,this.legalElement&&this.legalResolvedHandler&&(this.legalElement.removeEventListener(Ee,this.legalResolvedHandler),this.legalResolvedHandler=null,this.legalElement=null),this.calloutListenersAdded){document.removeEventListener("touchstart",this.handleCalloutTouch),document.removeEventListener("mouseover",this.handleCalloutMouse);let t=this.card.querySelector('[slot="callout-content"] .icon-button');t?.removeEventListener("focusin",this.handleCalloutFocusin),t?.removeEventListener("focusout",this.handleCalloutFocusout),t?.removeEventListener("keydown",this.handleCalloutKeydown),this.calloutListenersAdded=!1}}updatePriceQuantity({detail:t}){!this.mainPrice||!t?.option||(this.mainPrice.dataset.quantity=t.option)}priceOptionsProvider(t,i){if(this.isNewVariant){if(t.dataset.template===J){i.displayPlanType=this.card?.settings?.displayPlanType??!1;return}(t.dataset.template==="strikethrough"||t.dataset.template==="price")&&(i.displayPerUnit=!1)}}getGlobalCSS(){return Xa}measureMinHeights(){let t=[];if(this.card.getBoundingClientRect().width<=2)return t;if(this.card.heightSync!==!1){let n=["heading-m","heading-xs","subtitle","body-m","heading-m-price","body-xxs","price-commitment","quantity-select","offers","promo-text","callout-content","addon"];this.card.classList.contains("bullet-list")&&n.push("footer-rows");let o=[["top-section",".top-section"],...n.map(s=>[s,`slot[name="${s}"]`]),["footer","footer"]];for(let[s,c]of o){let l=this.card.shadowRoot.querySelector(c);l&&t.push([`--consonant-merch-card-${this.card.variant}-${s}-height`,Math.max(0,parseInt(window.getComputedStyle(l).height)||0)])}}this.card.shadowRoot.querySelector(".mini-compare-chart-badge")?.textContent!==""&&t.push(["--consonant-merch-card-mini-compare-chart-top-section-mobile-height",32]);let a=[];if(this.isNewVariant){let n=this.card.querySelector("merch-whats-included");n&&(a=[...n.querySelectorAll('[slot="content"] merch-mnemonic-list')])}else{let n=this.card.querySelector('[slot="footer-rows"] ul');n?.children&&(a=[...n.children])}return a.forEach((n,o)=>{t.push([this.getRowMinHeightPropertyName(o+1),Math.max(uc,parseFloat(window.getComputedStyle(n).height)||0)])}),t}removeEmptyRows(){this.isNewVariant?this.card.querySelectorAll('merch-whats-included [slot="content"] merch-mnemonic-list').forEach(i=>{if(i.hasAttribute("data-placeholder"))return;let a=i.querySelector('[slot="icon"]'),n=!!a?.querySelector(".sp-icon")||!!a?.querySelector('merch-icon[src]:not([src=""]), img[src]:not([src=""])'),s=i.querySelector('[slot="description"]')?.textContent?.replace(/\u00a0/g," ")?.trim()??"";!n&&!s&&i.remove()}):this.card.querySelectorAll(".footer-row-cell").forEach(i=>{if(i.hasAttribute("data-placeholder"))return;let a=i.querySelector(".footer-row-cell-description");a&&!a.textContent.trim()&&i.remove()})}padFooterRows(){let t=this.getContainer();if(!t)return;let i=t.querySelectorAll('merch-card[variant="mini-compare-chart"]');if(this.isNewVariant){let a=0;if(i.forEach(l=>{let d=l.querySelector("merch-whats-included");if(!d)return;let h=d.querySelectorAll('[slot="content"] merch-mnemonic-list:not([data-placeholder])');a=Math.max(a,h.length)}),a===0)return;let n=this.card.querySelector("merch-whats-included");if(!n)return;let o=n.querySelector('[slot="content"]');if(!o)return;o.querySelectorAll("merch-mnemonic-list[data-placeholder]").forEach(l=>l.remove());let s=o.querySelectorAll("merch-mnemonic-list").length,c=a-s;for(let l=0;l<c;l++){let d=document.createElement("merch-mnemonic-list");d.setAttribute("data-placeholder","");let h=document.createElement("div");h.setAttribute("slot","icon");let m=document.createElement("div");m.setAttribute("slot","description"),d.append(h,m),o.appendChild(d)}}else{let a=0;if(i.forEach(c=>{let l=c.querySelector('[slot="footer-rows"] ul');if(!l)return;let d=l.querySelectorAll("li.footer-row-cell:not([data-placeholder])");a=Math.max(a,d.length)}),a===0)return;let n=this.card.querySelector('[slot="footer-rows"] ul');if(!n)return;n.querySelectorAll("li.footer-row-cell[data-placeholder]").forEach(c=>c.remove());let o=n.querySelectorAll("li.footer-row-cell").length,s=a-o;for(let c=0;c<s;c++){let l=document.createElement("li");l.className="footer-row-cell",l.setAttribute("data-placeholder",""),n.appendChild(l)}}}get mainPrice(){return this.card.querySelector(`[slot="heading-m-price"] ${j}[data-template="price"]`)}get headingMPriceSlot(){return this.card.shadowRoot.querySelector('slot[name="heading-m-price"]')?.assignedElements()[0]}get isNewVariant(){return!!this.card.querySelector("merch-whats-included")}toggleAddon(t){let i=this.mainPrice,a=this.headingMPriceSlot;if(!i&&a){let n=t?.getAttribute("plan-type"),o=null;if(t&&n&&(o=t.querySelector(`p[data-plan-type="${n}"]`)?.querySelector('span[is="inline-price"]')),this.card.querySelectorAll('p[slot="heading-m-price"]').forEach(s=>s.remove()),t.checked){if(o){let s=fe("p",{class:"addon-heading-m-price-addon",slot:"heading-m-price"},o.innerHTML);this.card.appendChild(s)}}else{let s=fe("p",{class:"card-heading",id:"free",slot:"heading-m-price"},"Free");this.card.appendChild(s)}}}showTooltip(t){t.classList.remove("hide-tooltip"),t.setAttribute("aria-expanded","true")}hideTooltip(t){t.classList.add("hide-tooltip"),t.setAttribute("aria-expanded","false")}adjustCallout(){let t=this.card.querySelector('[slot="callout-content"] .icon-button');if(!t||this.calloutListenersAdded)return;let i=t.title||t.dataset.tooltip;if(!i)return;t.title&&(t.dataset.tooltip=t.title,t.removeAttribute("title"));let a=t.parentElement;if(a&&a.tagName==="P"){let n=document.createElement("div"),o=document.createElement("div");o.className="callout-row";let s=document.createElement("div");for(s.className="callout-text";a.firstChild&&a.firstChild!==t;)s.appendChild(a.firstChild);o.appendChild(s),o.appendChild(t),n.appendChild(o),a.replaceWith(n)}t.setAttribute("role","button"),t.setAttribute("tabindex","0"),t.setAttribute("aria-label",i),t.setAttribute("aria-expanded","false"),this.hideTooltip(t),this.handleCalloutTouch=n=>{n.target!==t?this.hideTooltip(t):t.classList.contains("hide-tooltip")?this.showTooltip(t):this.hideTooltip(t)},this.handleCalloutMouse=n=>{n.target!==t?this.hideTooltip(t):this.showTooltip(t)},this.handleCalloutFocusin=()=>{this.showTooltip(t)},this.handleCalloutFocusout=()=>{this.hideTooltip(t)},this.handleCalloutKeydown=n=>{n.key==="Escape"&&(this.hideTooltip(t),t.blur())},document.addEventListener("touchstart",this.handleCalloutTouch),document.addEventListener("mouseover",this.handleCalloutMouse),t.addEventListener("focusin",this.handleCalloutFocusin),t.addEventListener("focusout",this.handleCalloutFocusout),t.addEventListener("keydown",this.handleCalloutKeydown),this.calloutListenersAdded=!0}async adjustAddon(){if(this.addonAdjusted)return;await this.card.updateComplete;let t=this.card.addon;if(!t)return;let i=this.mainPrice,a=this.card.planType;if(i&&(await i.onceSettled?.(),a=i.value?.[0]?.planType),!a)return;t.planType=a,this.addonAdjusted=!0,this.card.querySelector("merch-addon[plan-type]")?.updateComplete.then(()=>{this.updateCardElementMinHeight(this.card.shadowRoot.querySelector('slot[name="addon"]'),"addon")})}async adjustLegal(){if(this.legalAdjusted||this.legalAdjusting)return;this.legalAdjusting=!0;let t;try{await this.card.updateComplete,await customElements.whenDefined("inline-price");let i=this.mainPrice;if(!i||(await i.onceSettled(),!i?.options))return;t=i.cloneNode(!0),i.options.displayPerUnit&&(i.dataset.displayPerUnit="false"),i.options.displayTax&&(i.dataset.displayTax="false"),i.options.displayPlanType&&(i.dataset.displayPlanType="false"),t.setAttribute("data-template","legal"),this.legalResolvedHandler||(this.legalResolvedHandler=()=>this.adjustShortDescription(),t.addEventListener(Ee,this.legalResolvedHandler),this.legalElement=t),i.parentNode.insertBefore(t,i.nextSibling),this.legalAdjusted=!0,await t.onceSettled(),this.legalObserver=new MutationObserver(()=>this.adjustShortDescription()),this.legalObserver.observe(t,{childList:!0,subtree:!0})}catch{t?.parentNode&&(t.parentNode.removeChild(t),this.legalAdjusted=!1,this.legalResolvedHandler=null,this.legalElement=null)}finally{this.legalAdjusting=!1}}adjustShortDescription(){if(!this.shortDescriptionSource){let c=this.card.querySelector('[slot="body-xxs"]');if(!c)return;this.shortDescriptionSource=c,c.remove()}let t=this.shortDescriptionSource,i=t.textContent?.trim(),a=!!t.querySelector(".icon-button");if(!i&&!a)return;let o=this.card.querySelector('[is="inline-price"][data-template="legal"]')?.querySelector(".price-plan-type");if(!o||o.querySelector("em"))return;let s=document.createElement("em");s.innerHTML=` ${t.innerHTML}`,o.appendChild(s)}renderLayout(){return this.isNewVariant?Oe` <div class="top-section${this.badge?" badge":""}">
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
            <slot name="footer-rows"><slot name="body-s"></slot></slot>`:Oe` <div class="top-section${this.badge?" badge":""}">
                    <slot name="icons"></slot> ${this.badge}
                </div>
                <slot name="heading-m"></slot>
                ${this.card.classList.contains("bullet-list")?Oe`<slot name="heading-m-price"></slot>
                          <slot name="price-commitment"></slot>
                          <slot name="body-xxs"></slot>
                          <slot name="promo-text"></slot>
                          <slot name="body-m"></slot>
                          <slot name="offers"></slot>`:Oe`<slot name="body-m"></slot>
                          <slot name="heading-m-price"></slot>
                          <slot name="body-xxs"></slot>
                          <slot name="price-commitment"></slot>
                          <slot name="offers"></slot>
                          <slot name="promo-text"></slot> `}
                <slot name="callout-content"></slot>
                <slot name="addon"></slot>
                ${this.getMiniCompareFooter()}
                <slot name="footer-rows"><slot name="body-s"></slot></slot>`}syncHeights(){let t=this.getContainer();if(!t)return;let i=[...t.querySelectorAll('merch-card[variant="mini-compare-chart"]')].map(n=>n.variantLayout).filter(n=>n instanceof gr);if(!i.length)return;let a=i.map(n=>n.measureMinHeights());for(let n of a)for(let[o,s]of n){let c=parseFloat(t.style.getPropertyValue(o))||0;s>c&&t.style.setProperty(o,`${s}px`)}}async postCardUpdateHook(){await super.postCardUpdateHook(),this.isNewVariant&&(this.legalAdjusted||await this.adjustLegal(),this.adjustShortDescription(),this.adjustCallout()),await this.adjustAddon(),this.isNewVariant&&this.removeEmptyRows(),_.isMobile?this.isNewVariant||this.removeEmptyRows():(this.padFooterRows(),Za(this.getContainer()))}};u(gr,"variantStyle",mc`
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

        @media screen and ${Ka(Y)} {
            [class*'-merch-cards']
                :host([variant='mini-compare-chart'])
                footer {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
        }

        @media screen and ${Ka(C)} {
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
    `);var Ot=gr;import{html as fr,css as gc,unsafeCSS as Pi,nothing as fc}from"./lit-all.min.js";var Ja=`
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
@media screen and ${N} {
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

@media screen and ${Y} {
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
@media screen and ${R} {
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
    display: block;
    margin-top: 16px;
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

@media screen and ${Q} {
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
`;var vc=32,en={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m-price"},promoText:{tag:"div",slot:"promo-text"},shortDescription:{tag:"div",slot:"body-m"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],ctas:{slot:"footer",size:"l"},style:"consonant"},ve,ot=class extends E{constructor(t){super(t);k(this,ve);u(this,"getRowMinHeightPropertyName",t=>`--consonant-merch-card-footer-row-${t}-min-height`);u(this,"getMiniCompareFooter",()=>fr` <footer>
            <slot name="secure-transaction-label">
                <span class="secure-transaction-label-text"
                    >${this.secureLabel}</span
                >
            </slot>
            <p class="action-area">
                <slot name="footer"></slot>
            </p>
        </footer>`);u(this,"getMiniCompareFooterRows",()=>fr` <div class="footer-rows-container">
            <slot name="body-xs"></slot>
            <slot name="footer-rows"></slot>
        </div>`);this.updatePriceQuantity=this.updatePriceQuantity.bind(this)}connectedCallbackHook(){this.card.addEventListener(te,this.updatePriceQuantity)}disconnectedCallbackHook(){this.card.removeEventListener(te,this.updatePriceQuantity),this._syncObserver?.disconnect(),this._syncObserver=null,v(this,ve)?.disconnect(),w(this,ve,null)}updatePriceQuantity({detail:t}){!this.mainPrice||!t?.option||(this.mainPrice.dataset.quantity=t.option)}syncHeights(){if(this.card.getBoundingClientRect().width<=2){v(this,ve)||(w(this,ve,new ResizeObserver(()=>{this.card.getBoundingClientRect().width>2&&(v(this,ve)?.disconnect(),w(this,ve,null),this.syncHeights())})),v(this,ve).observe(this.card));return}let t=["heading-xs","subtitle","heading-m-price","promo-text","body-m","body-xs"];this.syncRowHeights(t.map(i=>({name:i,getElement:a=>a.querySelector(`[slot="${i}"]`)}))),this.adjustMiniCompareFooterRows()}priceOptionsProvider(t,i){if(t.dataset.template===J){i.displayPlanType=this.card?.settings?.displayPlanType??!1;return}(t.dataset.template==="strikethrough"||t.dataset.template==="price")&&(i.displayPerUnit=!1)}getGlobalCSS(){return Ja}adjustMiniCompareBodySlots(){if(this.card.getBoundingClientRect().width<=2){this._syncObserver||(this._syncObserver=new ResizeObserver(()=>{this.card.getBoundingClientRect().width>2&&(this._syncObserver?.disconnect(),this._syncObserver=null,this.adjustMiniCompareBodySlots(),this.adjustMiniCompareFooterRows())}),this._syncObserver.observe(this.card));return}["heading-xs","subtitle","heading-m-price","price-wrapping","promo-text","body-m","body-xs","footer-rows"].forEach(i=>{let n=this.card.querySelector(`[slot="${i}"]`)??this.card.shadowRoot.querySelector(`slot[name="${i}"]`);this.updateCardElementMinHeight(n,i)}),[['slot[name="promo-text"]',"promo-text"],["footer","footer"]].forEach(([i,a])=>{this.updateCardElementMinHeight(this.card.shadowRoot.querySelector(i),a)})}adjustMiniCompareFooterRows(){if(this.card.getBoundingClientRect().width===0)return;let t=this.card.querySelector('[slot="footer-rows"] ul');!t||!t.children||[...t.children].forEach((i,a)=>{let n=Math.max(vc,parseFloat(window.getComputedStyle(i).height)||0),o=parseFloat(this.getContainer().style.getPropertyValue(this.getRowMinHeightPropertyName(a+1)))||0;n>o&&this.getContainer().style.setProperty(this.getRowMinHeightPropertyName(a+1),`${n}px`)})}removeEmptyRows(){this.card.querySelectorAll(".footer-row-cell").forEach(i=>{let a=i.querySelector(".footer-row-cell-description");a&&!a.textContent.trim()&&i.remove()})}setupToggle(){if(this.toggleSetupDone)return;let t=this.card.querySelector('[slot="body-xs"]');if(!t)return;let i=t.querySelector("p"),a=t.querySelector("ul");if(!i||!a||t.querySelector(".footer-rows-title"))return;this.toggleSetupDone=!0;let n=i.textContent.trim(),o=this.card.querySelector("h3")?.id,s=o?`${o}-list`:`mweb-list-${Date.now()}`;a.setAttribute("id",s),a.classList.add("checkmark-copy-container");let c=fe("h4",{class:"footer-rows-title"},n);if(_.isMobile){let l=fe("button",{class:"toggle-icon","aria-label":n,"aria-expanded":"false","aria-controls":s});c.appendChild(l),c.addEventListener("click",()=>{let d=a.classList.toggle("open");l.classList.toggle("expanded",d),l.setAttribute("aria-expanded",String(d))})}else a.classList.add("open");i.replaceWith(c)}get legalDisplayDot(){return!1}get mainPrice(){return this.card.querySelector(`[slot="heading-m-price"] ${j}[data-template="price"]`)}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let t=this.mainPrice;if(!t)return;let i=t.cloneNode(!0);if(await t.onceSettled(),!t?.options)return;t.options.displayPerUnit&&(t.dataset.displayPerUnit="false"),t.options.displayTax&&(t.dataset.displayTax="false"),t.options.displayPlanType&&(t.dataset.displayPlanType="false"),i.setAttribute("data-template","legal"),t.parentNode.insertBefore(i,t.nextSibling),await i.onceSettled()}catch{}}get icons(){return!this.card.querySelector('[slot="icons"]')&&!this.card.getAttribute("id")?fc:fr`<slot name="icons"></slot>`}renderLayout(){return fr`
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
                </div>
                ${this.getMiniCompareFooter()}
            </div>
            ${this.getMiniCompareFooterRows()}
        `}async postCardUpdateHook(){if(this.legalAdjusted||await this.adjustLegal(),this.setupToggle(),_.isMobile&&this.removeEmptyRows(),await super.postCardUpdateHook(),window.matchMedia("(min-width: 768px)").matches){let t=this.card.parentElement,i=Array.from(t.querySelectorAll(`merch-card[variant="${this.card.variant}"]`));await Promise.all(i.map(a=>a.updateComplete)),await new Promise(a=>setTimeout(a,100)),this.card===t.firstElementChild&&requestAnimationFrame(()=>{this.syncHeights()})}}};ve=new WeakMap,u(ot,"variantStyle",gc`
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

        @media screen and ${Pi(Y)} {
            [class*'-merch-cards']
                :host([variant='mini-compare-chart-mweb'])
                footer {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
        }

        @media screen and ${Pi(C)} {
            :host([variant='mini-compare-chart-mweb']) footer {
                padding: 0;
            }
        }

        @media screen and ${Pi(R)} {
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
    `);import{html as Nt,css as xc,nothing as vr}from"./lit-all.min.js";var tn=`
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
@media screen and ${N} {
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
@media screen and ${R} {
    :root {
        --consonant-merch-card-plans-students-width: 486px;
    }

    .four-merch-cards.plans .foreground {
        max-width: unset;
    }
}

@media screen and ${Y} {
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
@media screen and ${Q} {
    .columns .four-merch-cards.plans {
        grid-template-columns: repeat(2, var(--consonant-merch-card-plans-width));
    }

    merch-sidenav.plans {
        --merch-sidenav-collection-gap: 54px;
    }
}
`;var wr={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},addon:!0,secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],whatsIncluded:{tag:"div",slot:"whats-included"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},an={...function(){let{whatsIncluded:e,size:r,...t}=wr;return t}(),title:{tag:"h3",slot:"heading-s"},secureLabel:!1},nn={...function(){let{subtitle:e,whatsIncluded:r,size:t,quantitySelect:i,...a}=wr;return a}()},xr=new Set,br=!1;function yr(e){let r=e.target.closest?.('[slot="callout-content"] .icon-button');for(let t of xr)t===r?e.type==="touchstart"?t.classList.toggle("hide-tooltip"):t.classList.remove("hide-tooltip"):t.classList.add("hide-tooltip")}function bc(e){xr.add(e),!br&&(document.addEventListener("touchstart",yr,{passive:!0}),document.addEventListener("mouseover",yr,{passive:!0}),br=!0)}function rn(e){!e||!xr.delete(e)||xr.size||!br||(document.removeEventListener("touchstart",yr),document.removeEventListener("mouseover",yr),br=!1)}var xe,be,ie=class extends E{constructor(t){super(t);k(this,xe);k(this,be);this.adaptForMedia=this.adaptForMedia.bind(this)}priceOptionsProvider(t,i){t.dataset.template===J&&(i.displayPlanType=this.card?.settings?.displayPlanType??!1)}getGlobalCSS(){return tn}adjustSlotPlacement(t,i,a){let n=this.card.shadowRoot,o=n.querySelector("footer"),s=this.card.getAttribute("size");if(!s)return;let c=n.querySelector(`footer slot[name="${t}"]`),l=n.querySelector(`.body slot[name="${t}"]`),d=n.querySelector(".body");if(s.includes("wide")||(o?.classList.remove("wide-footer"),c&&c.remove()),!!i.includes(s)){if(o?.classList.toggle("wide-footer",_.isDesktopOrUp),!a&&c){if(l)c.remove();else{let h=d.querySelector(`[data-placeholder-for="${t}"]`);h?h.replaceWith(c):d.appendChild(c)}return}if(a&&l){let h=document.createElement("div");if(h.setAttribute("data-placeholder-for",t),h.classList.add("slot-placeholder"),!c){let m=l.cloneNode(!0);o.prepend(m)}l.replaceWith(h)}}}adaptForMedia(){if(!this.card.closest("merch-card-collection,overlay-trigger,.two-merch-cards,.three-merch-cards,.four-merch-cards, .columns")){this.card.removeAttribute("size");return}this.adjustSlotPlacement("addon",["super-wide"],_.isDesktopOrUp),this.adjustSlotPlacement("callout-content",["super-wide"],_.isDesktopOrUp)}adjustCallout(){if(this.calloutIcon?.isConnected)return;let t=this.card.querySelector('[slot="callout-content"] .icon-button');t&&(!t.title&&!(t.dataset.tooltip&&t.classList.contains("hide-tooltip"))||(t.title&&(t.dataset.tooltip=t.title,t.removeAttribute("title")),t.classList.add("hide-tooltip"),rn(this.calloutIcon),bc(t),this.calloutIcon=t))}syncHeights(){if(this.card.getBoundingClientRect().width<=2){v(this,xe)||(w(this,xe,new ResizeObserver(()=>{this.card.getBoundingClientRect().width>2&&(v(this,xe)?.disconnect(),w(this,xe,null),this.syncHeights())})),v(this,xe).observe(this.card));return}let t=["heading-xs","subtitle","heading-m","promo-text","body-xs"];this.syncRowHeights(t.map(i=>({name:i,getElement:a=>a.querySelector(`[slot="${i}"]`)})))}async adjustEduLists(){if(this.card.variant!=="plans-education"||this.card.querySelector(".spacer"))return;let i=this.card.querySelector('[slot="body-xs"]');if(!i)return;let a=i.querySelector("ul");if(!a)return;let n=a.previousElementSibling,o=document.createElement("div");o.classList.add("spacer"),i.insertBefore(o,n);let s=new IntersectionObserver(([c])=>{if(c.boundingClientRect.height===0)return;let l=0,d=this.card.querySelector('[slot="heading-s"]');d&&(l+=Mt(d));let h=this.card.querySelector('[slot="subtitle"]');h&&(l+=Mt(h));let m=this.card.querySelector('[slot="heading-m"]');m&&(l+=8+Mt(m));for(let g of i.childNodes){if(g.classList.contains("spacer"))break;l+=Mt(g)}let p=this.card.parentElement.style.getPropertyValue("--merch-card-plans-edu-list-max-offset");l>(parseFloat(p)||0)&&this.card.parentElement.style.setProperty("--merch-card-plans-edu-list-max-offset",`${l}px`),this.card.style.setProperty("--merch-card-plans-edu-list-offset",`${l}px`),s.disconnect()});s.observe(this.card)}async postCardUpdateHook(t){(!t||t.has("variant")||t.has("size"))&&this.adaptForMedia(),this.adjustAddon(),this.adjustCallout(),this.legalAdjusted||(await this.adjustLegal(),await this.adjustEduLists()),await super.postCardUpdateHook(),window.matchMedia("(min-width: 768px)").matches&&this.card===this.card.parentElement?.firstElementChild&&requestAnimationFrame(()=>{this.syncHeights()})}get headingM(){return this.card.querySelector('[slot="heading-m"]')}get mainPrice(){return this.headingM?.querySelector(`${j}[data-template="price"]`)}get divider(){return this.card.variant==="plans-education"?Nt`<div class="divider"></div>`:vr}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let t=[],i=this.card.querySelector(`[slot="heading-m"] ${j}[data-template="price"]`);i&&t.push(i);let a=t.map(async n=>{let o=n.cloneNode(!0);await n.onceSettled(),n?.options&&(n.options.displayPerUnit&&(n.dataset.displayPerUnit="false"),n.options.displayTax&&(n.dataset.displayTax="false"),n.options.displayPlanType&&(n.dataset.displayPlanType="false"),o.setAttribute("data-template","legal"),n.parentNode.insertBefore(o,n.nextSibling),await o.onceSettled())});await Promise.all(a)}catch{}}async adjustAddon(){if(this.addonAdjusted)return;await this.card.updateComplete;let t=this.card.addon;if(!t)return;t.setAttribute("custom-checkbox","");let i=this.mainPrice;if(!i)return;await i.onceSettled?.();let a=i.value?.[0]?.planType;a&&(t.planType=a,this.addonAdjusted=!0)}get stockCheckbox(){return this.card.checkboxLabel?Nt`<label id="stock-checkbox">
                <input type="checkbox" @change=${this.card.toggleStockOffer}></input>
                <span></span>
                ${this.card.checkboxLabel}
            </label>`:vr}get icons(){return!this.card.querySelector('[slot="icons"]')&&!this.card.getAttribute("id")?vr:Nt`<slot name="icons"></slot>`}resizeHandler(){v(this,be)&&cancelAnimationFrame(v(this,be)),w(this,be,requestAnimationFrame(()=>{w(this,be,null),window.matchMedia("(min-width: 768px)").matches&&this.syncHeights()}))}connectedCallbackHook(){_.matchMobile.addEventListener("change",this.adaptForMedia),_.matchDesktopOrUp.addEventListener("change",this.adaptForMedia)}disconnectedCallbackHook(){_.matchMobile.removeEventListener("change",this.adaptForMedia),_.matchDesktopOrUp.removeEventListener("change",this.adaptForMedia),rn(this.calloutIcon),this.calloutIcon=null,v(this,xe)?.disconnect(),w(this,xe,null),v(this,be)&&(cancelAnimationFrame(v(this,be)),w(this,be,null))}renderLayout(){return Nt` ${this.badge}
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
            <slot></slot>`}};xe=new WeakMap,be=new WeakMap,u(ie,"variantStyle",xc`
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
    `),u(ie,"collectionOptions",{customHeaderArea:t=>t.sidenav?Nt`<slot name="resultsText"></slot>`:vr,headerVisibility:{search:!1,sort:!1,result:["mobile","tablet"],custom:["desktop"]},onSidenavAttached:t=>{let i=()=>{let a=t.querySelectorAll("merch-card");for(let o of a)o.hasAttribute("data-size")&&(o.setAttribute("size",o.getAttribute("data-size")),o.removeAttribute("data-size"));if(!_.isDesktop)return;let n=0;for(let o of a){if(o.style.display==="none")continue;let s=o.getAttribute("size"),c=s==="wide"?2:s==="super-wide"?3:1;c===2&&n%3===2&&(o.setAttribute("data-size",s),o.removeAttribute("size"),c=1),n+=c}};_.matchDesktop.addEventListener("change",i),t.addEventListener(he,i),t.onUnmount.push(()=>{_.matchDesktop.removeEventListener("change",i),t.removeEventListener(he,i)})}});import{html as Ce,css as yc,unsafeCSS as sn,nothing as Er}from"./lit-all.min.js";var on=`
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
@media ${N} {
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
@media ${N} {
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

@media screen and ${N}, ${Y} {
    :root {
        --consonant-merch-card-plans-v2-width: 100%;
    }
    merch-card[variant="plans-v2"] {
        width: 100%;
        max-width: var(--consonant-merch-card-plans-v2-width);
        box-sizing: border-box;
    }
}

@media screen and ${R}, ${C}, ${Q} {
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
@media screen and ${N} {
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
@media screen and ${R} {
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
@media screen and ${Q} {
.columns .four-merch-cards.plans:has(merch-card[variant="plans-v2"]) {
    grid-template-columns: repeat(2, var(--consonant-merch-card-plans-v2-width));
  }

}
`;var cn={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m"},shortDescription:{tag:"p",slot:"short-description"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},addon:!0,secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-red-700-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],whatsIncluded:{tag:"div",slot:"whats-included"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},Ne=class extends E{constructor(r){super(r),this.adaptForMedia=this.adaptForMedia.bind(this),this.toggleShortDescription=this.toggleShortDescription.bind(this),this.shortDescriptionExpanded=!1,this.syncScheduled=!1}priceOptionsProvider(r,t){if(r.dataset.template===J){t.displayPlanType=this.card?.settings?.displayPlanType??!1;return}(r.dataset.template==="strikethrough"||r.dataset.template==="price")&&(t.displayPerUnit=!1)}getGlobalCSS(){return on}adjustSlotPlacement(r,t,i){let{shadowRoot:a}=this.card,n=a.querySelector("footer"),o=a.querySelector(".body"),s=this.card.getAttribute("size");if(!s)return;let c=a.querySelector(`footer slot[name="${r}"]`),l=a.querySelector(`.body slot[name="${r}"]`);if(s.includes("wide")||(n?.classList.remove("wide-footer"),c?.remove()),!!t.includes(s)){if(n?.classList.toggle("wide-footer",_.isDesktopOrUp),!i&&c){if(l)c.remove();else{let d=o.querySelector(`[data-placeholder-for="${r}"]`);d?d.replaceWith(c):o.appendChild(c)}return}if(i&&l){let d=document.createElement("div");d.setAttribute("data-placeholder-for",r),d.classList.add("slot-placeholder"),c||n.prepend(l.cloneNode(!0)),l.replaceWith(d)}}}adaptForMedia(){if(!this.card.closest("merch-card-collection,overlay-trigger,.two-merch-cards,.three-merch-cards,.four-merch-cards,.columns"))return this.card.hasAttribute("size"),void 0;this.adjustSlotPlacement("heading-m",["wide"],!0),this.adjustSlotPlacement("addon",["super-wide"],_.isDesktopOrUp),this.adjustSlotPlacement("callout-content",["super-wide"],_.isDesktopOrUp)}adjustCallout(){let r=this.card.querySelector('[slot="callout-content"] .icon-button');if(!r?.title)return;r.dataset.tooltip=r.title,r.removeAttribute("title"),r.classList.add("hide-tooltip");let t=i=>{i===r?r.classList.toggle("hide-tooltip"):r.classList.add("hide-tooltip")};document.addEventListener("touchstart",i=>{i.preventDefault(),t(i.target)}),document.addEventListener("mouseover",i=>{i.preventDefault(),i.target!==r?r.classList.add("hide-tooltip"):r.classList.remove("hide-tooltip")})}async postCardUpdateHook(){this.card.isConnected&&(this.adaptForMedia(),this.adjustAddon(),this.adjustCallout(),this.updateShortDescriptionVisibility(),this.hasShortDescription?this.card.setAttribute("has-short-description",""):this.card.removeAttribute("has-short-description"),this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook(),window.matchMedia("(min-width: 768px)").matches&&requestAnimationFrame(()=>{this.syncHeights()}))}get mainPrice(){return this.card.querySelector(`[slot="heading-m"] ${j}[data-template="price"]`)}syncHeights(){this.card.getBoundingClientRect().width<=2||this.syncRowHeights([{name:"body",getElement:r=>r.shadowRoot?.querySelector(".body")},{name:"footer",getElement:r=>r.shadowRoot?.querySelector("footer")},{name:"short-description",getElement:r=>r.querySelector('[slot="short-description"]')}])}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let r=this.mainPrice;if(!r)return;let t=r.cloneNode(!0);if(await r.onceSettled(),!r?.options)return;r.options.displayPerUnit&&(r.dataset.displayPerUnit="false"),r.options.displayTax&&(r.dataset.displayTax="false"),r.options.displayPlanType&&(r.dataset.displayPlanType="false"),t.setAttribute("data-template","legal"),r.parentNode.insertBefore(t,r.nextSibling),await t.onceSettled()}catch{}}async adjustAddon(){await this.card.updateComplete;let r=this.card.addon;if(!r)return;r.setAttribute("custom-checkbox","");let t=this.mainPrice;if(!t)return;await t.onceSettled?.();let i=t.value?.[0]?.planType;i&&(r.planType=i)}get stockCheckbox(){return this.card.checkboxLabel?Ce`<label id="stock-checkbox">
                <input type="checkbox" @change=${this.card.toggleStockOffer}></input>
                <span></span>
                ${this.card.checkboxLabel}
            </label>`:Er}get hasShortDescription(){return!!this.card.querySelector('[slot="short-description"]')}get shortDescriptionLabel(){let r=this.card.querySelector('[slot="short-description"]'),t=r.querySelector("strong, b");if(t?.textContent?.trim())return t.textContent.trim();let i=r.querySelector("h1, h2, h3, h4, h5, h6, p");return i?.textContent?.trim()?i.textContent.trim():r.textContent?.trim().split(`
`)[0].trim()}updateShortDescriptionVisibility(){let r=this.card.querySelector('[slot="short-description"]');if(!r)return;let t=r.querySelector("strong, b, p");t&&(_.isMobile?t.style.display="none":t.style.display="")}toggleShortDescription(){this.shortDescriptionExpanded=!this.shortDescriptionExpanded,this.card.requestUpdate()}get shortDescriptionToggle(){return this.hasShortDescription?_.isMobile?Ce`
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
        `:Ce`
                <div class="short-description-content desktop">
                    <slot name="short-description"></slot>
                </div>
            `:Er}get icons(){return this.card.querySelector('[slot="icons"]')||this.card.getAttribute("id")?Ce`<slot name="icons"></slot>`:Er}get secureLabelFooter(){return Ce`<footer>
            ${this.secureLabel}<slot name="quantity-select"></slot
            ><slot name="footer"></slot>
        </footer>`}connectedCallbackHook(){this.handleMediaChange=()=>{this.adaptForMedia(),this.updateShortDescriptionVisibility(),this.card.requestUpdate(),window.matchMedia("(min-width: 768px)").matches&&requestAnimationFrame(()=>{this.syncHeights()})},_.matchMobile.addEventListener("change",this.handleMediaChange),_.matchDesktopOrUp.addEventListener("change",this.handleMediaChange),this.handleResize=()=>{this._resizeFrame&&cancelAnimationFrame(this._resizeFrame),this._resizeFrame=requestAnimationFrame(()=>{this._resizeFrame=null,window.matchMedia("(min-width: 768px)").matches&&this.syncHeights()})},window.addEventListener("resize",this.handleResize),this.visibilityObserver=new IntersectionObserver(([r])=>{r.boundingClientRect.height!==0&&r.isIntersecting&&(window.matchMedia("(min-width: 768px)").matches&&requestAnimationFrame(()=>{this.syncHeights()}),this.visibilityObserver.disconnect())}),this.visibilityObserver.observe(this.card)}disconnectedCallbackHook(){_.matchMobile.removeEventListener("change",this.handleMediaChange),_.matchDesktopOrUp.removeEventListener("change",this.handleMediaChange),this.handleResize&&(window.removeEventListener("resize",this.handleResize),this.handleResize=null),this._resizeFrame&&(cancelAnimationFrame(this._resizeFrame),this._resizeFrame=null),this.visibilityObserver?.disconnect()}renderLayout(){let t=this.card.getAttribute("size")==="wide";return Ce` ${this.badge}
            <div class="body">
                ${t?Ce`
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
                      `:Ce`
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
            <slot></slot>`}};u(Ne,"variantStyle",yc`
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

        @media ${sn(N)}, ${sn(Y)} {
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
    `),u(Ne,"collectionOptions",{customHeaderArea:r=>r.sidenav?Ce`<slot name="resultsText"></slot>`:Er,headerVisibility:{search:!1,sort:!1,result:["mobile","tablet"],custom:["desktop"]},onSidenavAttached:r=>{let t=()=>{let i=r.querySelectorAll("merch-card");if(i.forEach(n=>{n.hasAttribute("data-size")&&(n.setAttribute("size",n.getAttribute("data-size")),n.removeAttribute("data-size"))}),!_.isDesktop)return;let a=0;i.forEach(n=>{if(n.style.display==="none")return;let o=n.getAttribute("size"),s=o==="wide"?2:o==="super-wide"?3:1;s===2&&a%3===2&&(n.setAttribute("data-size",o),n.removeAttribute("size"),s=1),a+=s})};_.matchDesktop.addEventListener("change",t),r.addEventListener(he,t),r.onUnmount.push(()=>{_.matchDesktop.removeEventListener("change",t),r.removeEventListener(he,t)})}});import{html as Ie,css as wc,nothing as It}from"./lit-all.min.js";var ln=`
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
    --consonant-merch-card-bizpro-cta-accent-hover-color: #274dea;
    --consonant-merch-card-bizpro-cta-outline-hover-color: #ebebeb;
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

/* Hover (S2A): the accent button darkens; the outline button gets a subtle
   gray fill while its border and text stay unchanged. Selectors mirror the
   base rules above so hover applies to the same buttons. */
merch-card[variant="bizpro"] [slot="footer"] .con-button.blue:hover,
merch-card[variant="bizpro"] [slot="footer"] a.accent:hover,
merch-card[variant="bizpro"] [slot="footer"] [data-button-type="accent"]:hover {
    background-color: var(--consonant-merch-card-bizpro-cta-accent-hover-color);
}

merch-card[variant="bizpro"] [slot="footer"] .con-button.outline,
merch-card[variant="bizpro"] [slot="footer"] .con-button.primary,
merch-card[variant="bizpro"] [slot="footer"] a.outline,
merch-card[variant="bizpro"] [slot="footer"] [data-button-type="primary"] {
    background: transparent;
    color: var(--consonant-merch-card-bizpro-text-color);
    border: 2px solid var(--consonant-merch-card-bizpro-text-color);
}

merch-card[variant="bizpro"] [slot="footer"] .con-button.outline:hover,
merch-card[variant="bizpro"] [slot="footer"] .con-button.primary:hover,
merch-card[variant="bizpro"] [slot="footer"] a.outline:hover,
merch-card[variant="bizpro"] [slot="footer"] [data-button-type="primary"]:hover {
    background-color: var(--consonant-merch-card-bizpro-cta-outline-hover-color);
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

/* Strikethrough (regular) price \u2014 Figma 988:14784: 14px regular muted, struck,
   on its own line ABOVE the current price (988:14785). Out-specifies the
   18px/900 .price rules above. Covers both markup shapes:
   - promo: .price-strikethrough next to .price-alternative inside one
     price-template inline-price (the promo price keeps the 18px/900 look)
   - authored: a separate strikethrough-template inline-price before the main
     price. The line-through itself comes from the global stylesheet. */
merch-card[variant="bizpro"]
    [slot="heading-m"]
    .price:is(.price-strikethrough, .price-promo-strikethrough),
merch-card[variant="bizpro"]
    [slot="heading-m"]
    .price:is(.price-strikethrough, .price-promo-strikethrough)
    span {
    font-family: var(--consonant-merch-card-bizpro-font-family-regular);
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0.14px;
    color: var(--consonant-merch-card-bizpro-text-muted-color);
}

/* Stack the struck price onto its own line. The authored shape needs the
   inline-price wrapper itself to break (its inner .price going block would
   stay inside the inline-block wrapper); the promo shape needs the inner
   .price-strikethrough to break within the shared wrapper. */
merch-card[variant="bizpro"]
    [slot="heading-m"]
    span[is="inline-price"]:is(
        [data-template="strikethrough"],
        [data-template="priceStrikethrough"]
    ),
merch-card[variant="bizpro"]
    [slot="heading-m"]
    span[is="inline-price"][data-template="price"]
    .price:is(.price-strikethrough, .price-promo-strikethrough) {
    display: block;
}

/* The promo shape separates the two prices with an &nbsp; text node directly
   inside the wrapper; once the strikethrough goes block, that nbsp would
   indent the promo price's line. Zeroing the wrapper font collapses it \u2014 the
   .price spans carry their own explicit sizes (same trick as plans.css.js'
   ja_JP price-alternative block). */
merch-card[variant="bizpro"]
    [slot="heading-m"]
    span[is="inline-price"][data-template="price"]:has(
        .price-strikethrough,
        .price-promo-strikethrough
    ) {
    font-size: 0;
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

/* The legal line opens with an empty unit-type, so the tax label's leading
   ::before nbsp turns into a spurious indent and the line no longer aligns with
   the price above it; drop it when nothing precedes the tax label (MWPW-198626). */
merch-card[variant="bizpro"]
    .price-legal
    .price-unit-type.disabled
    + .price-tax-inclusivity:not(.disabled)::before {
    content: none;
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

@media screen and ${R} {
    merch-card-collection.plans:is(.two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="bizpro"]) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        max-width: 720px;
    }
}

@media screen and ${Ia} {
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

@media screen and ${N} {
    /* Mobile (320\u2013767px): the default track caps cards at 394px, leaving side
       margins wider than the 24px gutter. Collapse to a single 1fr track and
       drop the card cap so cards fill the available width. */
    merch-card-collection.plans:is(.one-merch-card, .two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="bizpro"]) {
        grid-template-columns: minmax(0, 1fr);
    }

    merch-card[variant="bizpro"] {
        width: 100%;
        max-width: none;
    }

    /* A collection inside a Milo .section.container inherits its 24px page
       gutter; one dropped straight into a plain section gets none, so the
       now-full-width cards bleed to the viewport edge. Restore the gutter on
       the collection itself for that case only. The > .content > chain pins
       this to the collection's own section, so it never doubles up where a
       .container already supplies the gutter. */
    .section:not(.container) > .content > .collection-container.plans:has(merch-card[variant="bizpro"]) {
        padding-inline: 24px;
    }
}

`;var[hp,pp,dn,hn,pn,mn]=["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Enter","Tab"];var un={cardName:{attribute:"name"},subtitle:{tag:"p",slot:"subtitle"},title:{tag:"h3",slot:"heading-xs"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"s"},prices:{tag:"p",slot:"heading-m"},promoText:{tag:"p",slot:"promo-text"},perUnitLabel:{tag:"span",slot:"per-unit-label"},callout:{tag:"div",slot:"callout-content",editorLabel:"License callout"},quantitySelect:{tag:"div",slot:"quantity-select"},shortDescription:{tag:"div",slot:"legal-text"},secureLabel:!0,planType:!0,addon:!0,ctas:{slot:"footer",size:"m"},whatsIncluded:{tag:"div",slot:"whats-included"},borderColor:{attribute:"border-color",specialValues:{Black:"black"}},allowedBorderColors:[],style:"consonant"},Te,Ve,Ft,W,gn,Dt,fn,Ht,Li,Sr,Ar=class Ar extends E{constructor(t){super(t);k(this,W);u(this,"expanded",!1);u(this,"licenseOpen",!1);u(this,"licenseQty",null);u(this,"licenseHighlightedIndex",0);k(this,Te,null);k(this,Ve,null);u(this,"lastSyncKey",null);k(this,Ft,({detail:t})=>{let i=t?.quantity==null?null:String(t.quantity);i==null||i===this.licenseQty||this.licenseOptions?.includes(i)&&(this.licenseQty=i,this.card.requestUpdate())});u(this,"toggleExpanded",t=>{t.preventDefault();let i=!this.expanded;for(let a of V(this,W,gn).call(this)){let n=a.variantLayout;n instanceof Ar&&(n.expanded=i,a._bizproExpanded=i,a.requestUpdate())}});u(this,"toggleLicensePopover",t=>{t.preventDefault(),t.stopPropagation(),this.licenseOpen?V(this,W,Li).call(this):V(this,W,Ht).call(this),this.card.requestUpdate()});k(this,Sr,t=>{let i=this.licenseOptions;if(!i?.length)return;let a=i.length-1;switch(t.key){case hn:t.preventDefault(),this.licenseOpen?this.licenseHighlightedIndex=(this.licenseHighlightedIndex+1)%i.length:V(this,W,Ht).call(this);break;case dn:t.preventDefault(),this.licenseOpen?this.licenseHighlightedIndex=(this.licenseHighlightedIndex-1+i.length)%i.length:V(this,W,Ht).call(this);break;case"Home":if(!this.licenseOpen)return;t.preventDefault(),this.licenseHighlightedIndex=0;break;case"End":if(!this.licenseOpen)return;t.preventDefault(),this.licenseHighlightedIndex=a;break;case pn:case" ":if(t.preventDefault(),this.licenseOpen){this.selectLicenseQty(i[this.licenseHighlightedIndex]);return}V(this,W,Ht).call(this);break;case"Escape":if(!this.licenseOpen)return;t.preventDefault(),V(this,W,Li).call(this);break;case mn:this.licenseOpen&&this.selectLicenseQty(i[this.licenseHighlightedIndex]);return;default:return}this.card.requestUpdate()});u(this,"selectLicenseQty",t=>{this.licenseQty=t,this.licenseOpen=!1,V(this,W,Dt).call(this);let i=this.quantitySelectEl;i&&(i.selectedValue=Number(t),i.dispatchEvent(new CustomEvent(te,{detail:{option:Number(t)},bubbles:!0}))),this.card.requestUpdate()});this.updatePriceQuantity=this.updatePriceQuantity.bind(this),this.expanded=t._bizproExpanded??!1}getGlobalCSS(){return ln}priceOptionsProvider(t,i){t.dataset.template===J&&(i.displayPlanType=this.card?.settings?.displayPlanType??!1)}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let t=this.mainPrice;if(!t)return;let i=t.cloneNode(!0);if(await t.onceSettled(),!t?.options)return;t.options.displayTax&&(t.dataset.displayTax="false"),t.options.displayPlanType&&(t.dataset.displayPlanType="false"),i.setAttribute("data-template","legal"),i.dataset.displayPerUnit="false",t.parentNode.insertBefore(i,t.nextSibling),await i.onceSettled(),this.legalResolvedHandler||(this.legalResolvedHandler=()=>this.adjustShortDescription(),i.addEventListener(Ee,this.legalResolvedHandler)),this.adjustShortDescription()}catch{}}adjustShortDescription(){let t=this.card.querySelector('[slot="legal-text"]')?.textContent?.trim();if(!t)return;let i=this.card.querySelector('[slot="heading-m"] [data-template="legal"]'),a=i?.querySelector(".price-plan-type");if(!a)return;a.textContent=t;let n=i.querySelector(".price-tax-inclusivity:not(.disabled)");n?.textContent&&!/\s$/.test(n.textContent)&&(n.textContent+=". ")}get hasWhatsIncluded(){return!!this.card.querySelector('[slot="whats-included"]')}get whatsIncludedToggleLabel(){return this.card.querySelector('[slot="whats-included"] .whats-included-label')?.textContent.trim()||"See what's included:"}get hasCallout(){return!!this.card.querySelector('[slot="callout-content"]')}get hasQuantitySelect(){let t=this.quantitySelectEl;return t?!!t.getAttribute("title")||parseInt(t.getAttribute("min"),10)>0||parseInt(t.getAttribute("step"),10)>0:!1}get hasAddOn(){return!!this.card.querySelector('[slot="addon"]')}get mainPrice(){return this.card.querySelector(`[slot="heading-m"] ${j}[data-template="price"]`)}updatePriceQuantity({detail:t}){!this.mainPrice||!t?.option||(this.mainPrice.dataset.quantity=t.option)}async adjustAddon(){await this.card.updateComplete;let t=this.card.addon;if(!t)return;t.setAttribute("custom-checkbox","");let i=this.mainPrice;if(!i)return;await i.onceSettled?.();let a=i.value?.[0]?.planType;a&&(t.planType=a)}async postCardUpdateHook(){await this.adjustAddon(),this.legalAdjusted||await this.adjustLegal(),this.adjustShortDescription(),await super.postCardUpdateHook(),window.matchMedia("(min-width: 768px)").matches&&this.syncHeights()}async waitForContentFonts(){let t=[this.card.querySelector('[slot="heading-xs"]'),this.card.querySelector('[slot="body-xs"]')].filter(Boolean);document.fonts?.load&&await Promise.all(t.map(i=>{let a=window.getComputedStyle(i),n=`${a.fontWeight} ${a.fontSize} ${a.fontFamily}`;return document.fonts.load(n,i.textContent).catch(()=>null)})),await document.fonts?.ready}async syncHeights(){if(this.card.heightSync===!1)return;await this.waitForContentFonts(),await new Promise(c=>requestAnimationFrame(c)),await new Promise(c=>requestAnimationFrame(c));let t=this.getContainer();if(!t||this.card.getBoundingClientRect().width<=2)return;let i=this.card.variant,a=`--consonant-merch-card-${i}-top-card-height`,n=[...t.querySelectorAll(`merch-card[variant="${i}"]`)].filter(c=>c.getBoundingClientRect().width>2&&c.variantLayout?.card?.heightSync!==!1),o=new Map;for(let c of n){let l=o.get(c.offsetTop)??[];l.push(c),o.set(c.offsetTop,l)}for(let c of o.values())for(let l of c)l.style.removeProperty(a);let s=new Map;for(let c of o.values())for(let l of c){let d=l.shadowRoot?.querySelector(".top-card");s.set(l,d&&parseInt(getComputedStyle(d).height)||0)}for(let c of o.values()){let l=0;for(let d of c)l=Math.max(l,s.get(d));l>0&&c.length>1&&c.forEach(d=>d.style.setProperty(a,`${l}px`))}}resyncOnReflow(){let t=this.card.getBoundingClientRect().width;if(t<=2)return;let i=this.card.querySelector('[slot="body-xs"]'),a=i?Math.round(i.getBoundingClientRect().height):0,n=`${Math.round(t)}:${a}`;n!==this.lastSyncKey&&(this.lastSyncKey=n,this.syncHeights())}connectedCallbackHook(){if(!this.card||(this.card.addEventListener(lr,v(this,Ft)),this.card.addEventListener(te,this.updatePriceQuantity),typeof ResizeObserver>"u"))return;w(this,Ve,new ResizeObserver(()=>this.resyncOnReflow())),v(this,Ve).observe(this.card);let t=this.card.querySelector('[slot="body-xs"]');t&&v(this,Ve).observe(t)}disconnectedCallbackHook(){this.card?.removeEventListener(te,this.updatePriceQuantity),V(this,W,Dt).call(this),v(this,Ve)?.disconnect(),this.card?.removeEventListener(lr,v(this,Ft))}get quantitySelectEl(){return this.card.querySelector("merch-quantity-select")}get licenseOptions(){let t=this.quantitySelectEl;if(!t)return null;let i=parseInt(t.getAttribute("min"),10),a=parseInt(t.getAttribute("max"),10),n=parseInt(t.getAttribute("step"),10)||1;if(Number.isNaN(i)||Number.isNaN(a)||a<i)return null;let o=[];for(let s=i;s<=a;s+=n)o.push(String(s));return o.length?o:null}licenseLabel(t){let i=this.quantitySelectEl?.getAttribute("title")||"License",[a,n]=i.split("|").map(o=>o.trim());return Number(t)===1?a:n||a}get hasLicenseSelector(){return(this.licenseOptions?.length??0)>0}get currentLicenseValue(){let t=this.licenseOptions;if(!t?.length)return null;if(this.licenseQty!=null)return this.licenseQty;let i=this.quantitySelectEl?.getAttribute("default-value");return i!=null&&t.includes(i)?i:t[0]}renderLicenseSelector(){if(!this.hasLicenseSelector)return Ie`<slot name="quantity-select"></slot>`;let t=this.licenseOptions,i=this.currentLicenseValue,a=!!this.licenseOpen,n=this.licenseLabel(Number(i));return Ie`
            <div class="license-select" ?data-open=${a}>
                <div
                    class="license-select-trigger"
                    role="combobox"
                    tabindex="0"
                    aria-expanded=${a?"true":"false"}
                    aria-controls="license-popover"
                    aria-labelledby="license-select-label"
                    aria-activedescendant=${a?`license-option-${this.licenseHighlightedIndex}`:It}
                    @click=${this.toggleLicensePopover}
                    @keydown=${v(this,Sr)}
                >
                    <span class="license-select-trigger-text">
                        <span class="license-select-value">${i}</span>
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
                    aria-labelledby="license-select-label"
                    aria-multiselectable="false"
                    tabindex="-1"
                    ?hidden=${!a}
                >
                    <li
                        class="license-select-popover-header"
                        aria-hidden="true"
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
                    ${t.map((o,s)=>Ie`
                            <li
                                class="license-select-option ${s===this.licenseHighlightedIndex?"highlighted":""}${o===i?" selected":""}"
                                id="license-option-${s}"
                                role="option"
                                aria-selected=${o===i?"true":"false"}
                                @click=${()=>this.selectLicenseQty(o)}
                                @mouseenter=${()=>{this.licenseHighlightedIndex=s,this.card.requestUpdate()}}
                            >
                                ${o}
                            </li>
                        `)}
                </ul>
            </div>
        `}renderLayout(){let t=!!this.expanded;return Ie`
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
                ${this.hasLicenseSelector||this.hasCallout||this.hasQuantitySelect?Ie`<div class="license-zone">
                          ${this.renderLicenseSelector()}
                          ${this.hasCallout?Ie`<div class="callout">
                                    <slot name="callout-content"></slot>
                                </div>`:It}
                      </div>`:It}
                ${this.hasAddOn?Ie`<div class="add-on">
                          <slot name="addon"></slot>
                      </div>`:It}
                <footer>
                    <slot name="footer"></slot>
                </footer>
                ${this.secureLabel}
            </div>
            ${this.hasWhatsIncluded?Ie`
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
                  `:It}
            <slot></slot>
        `}};Te=new WeakMap,Ve=new WeakMap,Ft=new WeakMap,W=new WeakSet,gn=function(){let t=this.card.offsetTop,i=Array.from(this.getContainer()?.querySelectorAll('merch-card[variant="bizpro"]')??[]).filter(a=>a.getBoundingClientRect().width>2&&a.offsetTop===t);return i.length?i:[this.card]},Dt=function(){v(this,Te)&&(document.removeEventListener("mousedown",v(this,Te)),w(this,Te,null))},fn=function(){let t=this.licenseOptions?.indexOf(this.currentLicenseValue);return t>0?t:0},Ht=function(){this.licenseOpen=!0,this.licenseHighlightedIndex=V(this,W,fn).call(this),v(this,Te)||(w(this,Te,t=>{t.composedPath().includes(this.card)||(this.licenseOpen=!1,this.card.requestUpdate(),V(this,W,Dt).call(this))}),document.addEventListener("mousedown",v(this,Te)))},Li=function(){this.licenseOpen=!1,V(this,W,Dt).call(this)},Sr=new WeakMap,u(Ar,"variantStyle",wc`
        :host([variant='bizpro']) {
            display: flex;
            flex-direction: column;
            background: var(
                --consonant-merch-card-bizpro-frame-bg,
                var(--consonant-merch-card-bizpro-bg-subtle, #f8f8f8)
            );
            border-radius: 16px;
            padding: 4px;
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
            /* Natural height (features-zone absorbs the slack). syncHeights
               publishes the row's max .top-card height here as min-height so
               shorter cards match; content-box, so the height maps straight. */
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
            /* Grow so price downward sticks to the bottom of the white card. */
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
            /* Grow to fill remaining height so card bottoms align across a row. */
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

        /* Mirror the collapsed trigger so open/close is seamless: 39px (trigger
           40px − the popover's 1px top border) with the trigger's 12px padding. */
        :host([variant='bizpro']) .license-select-popover-header {
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
        :host([variant='bizpro']) .license-select-option.highlighted,
        :host([variant='bizpro']) .license-select-option.selected {
            background: var(--consonant-merch-card-bizpro-bg-subtle, #f8f8f8);
        }

        /* Focus stays on the trigger, so the highlighted option needs its own
           visible ring (WCAG 2.4.7). */
        :host([variant='bizpro']) .license-select-option.highlighted {
            outline: 2px solid #1473e6;
            outline-offset: -2px;
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
            /* Gradient border: white fill on padding-box, gradient on border-box
               so only the 1px border shows it. */
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
            /* Vertical red→purple sparkle (red on top, per the flipped asset). */
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
    `);var Bt=Ar;import{html as Mi,css as Ec}from"./lit-all.min.js";var vn=`
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

merch-card[variant="product"][id] .price-unit-type:not(.disabled)::before {
    content: "\xA0";
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
    font-weight: 400;
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
@media screen and ${R} {
    .two-merch-cards.product,
    .three-merch-cards.product,
    .four-merch-cards.product {
        grid-template-columns: repeat(2, var(--consonant-merch-card-product-width));
    }
}

/* desktop */
@media screen and ${C} {
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

@media screen and ${Y} {
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

`;var xn={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},prices:{tag:"p",slot:"heading-xs"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},shortDescription:{tag:"div",slot:"short-description"},mnemonics:{size:"l"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},secureLabel:!0,planType:!0,addon:!0,addonBackground:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"color-yellow-300-variation"},allowedBadgeColors:["color-yellow-300-variation","color-gray-300-variation","color-gray-700-variation","color-green-900-variation","gradient-purple-blue"],allowedBorderColors:["color-yellow-300-variation","color-gray-300-variation","color-green-900-variation","gradient-purple-blue"],borderColor:{attribute:"border-color"},whatsIncluded:{tag:"div",slot:"whats-included"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},ye,st=class extends E{constructor(t){super(t);k(this,ye);this.postCardUpdateHook=this.postCardUpdateHook.bind(this),this.updatePriceQuantity=this.updatePriceQuantity.bind(this)}getGlobalCSS(){return vn}priceOptionsProvider(t,i){t.dataset.template===J&&(i.displayPlanType=this.card?.settings?.displayPlanType??!1,(t.dataset.template==="strikethrough"||t.dataset.template==="price")&&(i.displayPerUnit=!1))}adjustProductBodySlots(){if(this.card.getBoundingClientRect().width===0)return;["heading-xs","body-xxs","body-xs","promo-text","callout-content","addon","body-lower"].forEach(i=>this.updateCardElementMinHeight(this.card.shadowRoot.querySelector(`slot[name="${i}"]`),i))}renderLayout(){return Mi` ${this.badge}
            <div class="body" aria-live="polite">
                <slot name="icons"></slot>
                <slot name="heading-xs"></slot>
                ${this.promoBottom?"":Mi`<slot name="promo-text"></slot>`}
                <slot name="body-xs"></slot>
                <slot name="short-description"></slot>
                <slot name="addon"></slot>
                ${this.promoBottom?Mi`<slot name="promo-text"></slot>`:""}
                <slot name="whats-included"></slot>
                <slot name="callout-content"></slot>
                <slot name="quantity-select"></slot>
                <slot name="body-lower"></slot>
                <slot name="badge"></slot>
            </div>
            <hr />
            ${this.secureLabelFooter}`}connectedCallbackHook(){this.handleResize=()=>{v(this,ye)&&cancelAnimationFrame(v(this,ye)),w(this,ye,requestAnimationFrame(()=>{w(this,ye,null),this.postCardUpdateHook()}))},this.adjustShortDescriptionBound=this.adjustShortDescription.bind(this),window.addEventListener("resize",this.handleResize),this.card.addEventListener(te,this.updatePriceQuantity),this.card.addEventListener(dr,this.adjustShortDescriptionBound)}disconnectedCallbackHook(){this.handleResize&&(window.removeEventListener("resize",this.handleResize),this.handleResize=null),v(this,ye)&&(cancelAnimationFrame(v(this,ye)),w(this,ye,null)),this.card.removeEventListener(te,this.updatePriceQuantity),this.card.removeEventListener(dr,this.adjustShortDescriptionBound)}adjustShortDescription(){let t=this.card.querySelector('[slot="short-description"]');if(!t?.textContent?.trim())return;let i=this.card.querySelector('span[data-template="legal"]');if(!i)return;this.card.querySelector(".merch-short-description")?.remove();let a=document.createElement("span");a.className="merch-short-description";let n=t.querySelector("p")??t;a.innerHTML=n.innerHTML,a.querySelectorAll(".icon-button").forEach(o=>{o.dataset.eventsWired||(o.dataset.eventsWired="1",["mouseenter","focus"].forEach(s=>o.addEventListener(s,()=>o.classList.add("tooltip-visible"))),["mouseleave","blur"].forEach(s=>o.addEventListener(s,()=>o.classList.remove("tooltip-visible"))),o.addEventListener("keydown",s=>{s.key==="Escape"&&o.classList.remove("tooltip-visible")}))}),i.after(a),t.hidden=!0}async postCardUpdateHook(){this.card.isConnected&&(this.adjustAddon(),_.isMobile||this.adjustProductBodySlots(),this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook())}async adjustLegal(){if(!(this.legalAdjusted||!this.card.id))try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let t=this.mainPrice;if(!t)return;let i=t.cloneNode(!0);if(await t.onceSettled(),!t?.options)return;t.options.displayTax&&(t.dataset.displayTax="false"),t.options.displayPlanType&&(t.dataset.displayPlanType="false"),i.setAttribute("data-template","legal"),t.closest('[slot="heading-xs"]').appendChild(i),await i.onceSettled(),i.querySelector(".price-unit-type")?.remove()}catch{}}get headingXSSlot(){return this.card.shadowRoot.querySelector('slot[name="heading-xs"]').assignedElements()[0]}get mainPrice(){return this.card.querySelector(`[slot="heading-xs"] ${j}[data-template="price"]`)}updatePriceQuantity({detail:t}){!this.mainPrice||!t?.option||(this.mainPrice.dataset.quantity=t.option)}toggleAddon(t){let i=this.mainPrice,a=this.headingXSSlot;if(!i&&a){let n=t?.getAttribute("plan-type"),o=null;if(t&&n&&(o=t.querySelector(`p[data-plan-type="${n}"]`)?.querySelector('span[is="inline-price"]')),this.card.querySelectorAll('p[slot="heading-xs"]').forEach(s=>s.remove()),t.checked){if(o){let s=fe("p",{class:"addon-heading-xs-price-addon",slot:"heading-xs"},o.innerHTML);this.card.appendChild(s)}}else{let s=fe("p",{class:"card-heading",id:"free",slot:"heading-xs"},"Free");this.card.appendChild(s)}}}async adjustAddon(){await this.card.updateComplete;let t=this.card.addon;if(!t)return;let i=this.mainPrice,a=this.card.planType;i&&(await i.onceSettled?.(),a=i.value?.[0]?.planType),a&&(t.planType=a)}};ye=new WeakMap,u(st,"variantStyle",Ec`
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
    `);import{html as zi,css as Sc}from"./lit-all.min.js";var bn=`
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
@media screen and ${N} {
  :root {
    --consonant-merch-card-segment-width: 276px;
  }
}

@media screen and ${R} {
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
@media screen and ${C} {
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

merch-card[variant="segment"][id] .price-legal .price-unit-type:not(.disabled)::after {
  content: "\\00a0";
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
`;var yn={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},prices:{tag:"p",slot:"heading-xs"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},callout:{tag:"div",slot:"callout-content"},planType:!0,secureLabel:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"color-red-700-variation"},allowedBadgeColors:["color-yellow-300-variation","color-gray-300-variation","color-gray-700-variation","color-green-900-variation","color-red-700-variation","gradient-purple-blue"],allowedBorderColors:["color-yellow-300-variation","color-gray-300-variation","color-green-900-variation","color-red-700-variation","gradient-purple-blue"],borderColor:{attribute:"border-color"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},ct=class extends E{constructor(r){super(r)}priceOptionsProvider(r,t){r.dataset.template===J&&(t.displayPlanType=this.card?.settings?.displayPlanType??!1,(r.dataset.template==="strikethrough"||r.dataset.template==="price")&&(t.displayPerUnit=!1))}getGlobalCSS(){return bn}get badgeElement(){return this.card.querySelector('[slot="badge"]')}get mainPrice(){return this.card.querySelector(`[slot="heading-xs"] ${j}[data-template="price"]`)}async postCardUpdateHook(){this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook()}async adjustLegal(){if(!(this.legalAdjusted||!this.card.id))try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let r=this.mainPrice;if(!r)return;let t=r.cloneNode(!0);if(await r.onceSettled(),!r?.options)return;r.options.displayPerUnit&&(r.dataset.displayPerUnit="false"),r.options.displayTax&&(r.dataset.displayTax="false"),r.options.displayPlanType&&(r.dataset.displayPlanType="false"),t.setAttribute("data-template","legal"),r.parentNode.insertBefore(t,r.nextSibling),await t.onceSettled()}catch{}}renderLayout(){return zi`
            ${this.badge}
            <div class="body">
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${this.promoBottom?"":zi`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`}
                <slot name="body-xs"></slot>
                ${this.promoBottom?zi`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`:""}
                <slot name="badge"></slot>
            </div>
            <hr />
            ${this.secureLabelFooter}
        `}};u(ct,"variantStyle",Sc`
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
    `);import{html as Ac,css as Cc}from"./lit-all.min.js";var wn=`

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

`;var En={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"body-xxs"},description:{tag:"div",slot:"body-xs"},ctas:{slot:"footer",size:"m"},backgroundImage:{tag:"div",slot:"bg-image"},style:"consonant"},lt=class extends E{constructor(r){super(r)}getGlobalCSS(){return wn}removeFocusFromModalClose(){let r=this.card.closest(".dialog-modal");r&&r.querySelector(".dialog-close")?.blur()}async postCardUpdateHook(){this.removeFocusFromModalClose(),await super.postCardUpdateHook()}renderLayout(){return Ac`
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
        `}};u(lt,"variantStyle",Cc`
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
    `);import{html as Ri,css as Tc}from"./lit-all.min.js";var Sn=`
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

@media screen and ${N} {
  :root {
    --consonant-merch-card-special-offers-width: 302px;
  }
}

@media screen and ${R} {
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
@media screen and ${C} {
  .three-merch-cards.special-offers,
  .four-merch-cards.special-offers {
    grid-template-columns: repeat(3, minmax(302px, var(--consonant-merch-card-special-offers-width)));
  }
}

@media screen and ${Q} {
  .four-merch-cards.special-offers {
    grid-template-columns: repeat(4, minmax(302px, var(--consonant-merch-card-special-offers-width)));
  }
}
`;var An={cardName:{attribute:"name"},backgroundImage:{tag:"div",slot:"bg-image"},subtitle:{tag:"p",slot:"detail-m"},title:{tag:"h3",slot:"heading-xs"},prices:{tag:"p",slot:"heading-xs-price"},description:{tag:"div",slot:"body-xs"},ctas:{slot:"footer",size:"l"},badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-special-offers"},allowedBadgeColors:["spectrum-yellow-300-special-offers","spectrum-gray-300-special-offers","spectrum-green-900-special-offers"],allowedBorderColors:["spectrum-yellow-300-special-offers","spectrum-gray-300-special-offers","spectrum-green-900-special-offers"],borderColor:{attribute:"border-color"}},dt=class extends E{constructor(r){super(r)}get headingSelector(){return'[slot="detail-m"]'}getGlobalCSS(){return Sn}renderLayout(){return Ri`${this.cardImage}
            <div class="body">
                <slot name="detail-m"></slot>
                <slot name="heading-xs"></slot>
                <slot name="heading-xs-price"></slot>
                <slot name="body-xs"></slot>
                <slot name="badge"></slot>
            </div>
            ${this.evergreen?Ri`
                      <div
                          class="detail-bg-container"
                          style="background: ${this.card.detailBg}"
                      >
                          <slot name="detail-bg"></slot>
                      </div>
                  `:Ri`
                      <hr />
                      ${this.secureLabelFooter}
                  `}
            <slot></slot>`}};u(dt,"variantStyle",Tc`
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
    `);import{html as kc,css as _c}from"./lit-all.min.js";var Cn=`
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
@media screen and ${C} {
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
@media screen and ${N} {
  merch-card[variant="simplified-pricing-express"] [slot="body-xs"] p:first-child mas-mnemonic:first-child {
    --tooltip-left-offset: 0;
  }
}

/* Tooltip containers - overflow handled by Shadow DOM */

/* Mobile styles */
@media screen and ${N} {
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
@media screen and ${N} {
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
@media screen and ${R} and ${Y} {
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
@media screen and ${C} {
  merch-card[variant="simplified-pricing-express"] [slot="cta"] sp-button.small-font-size-button,
  merch-card[variant="simplified-pricing-express"] [slot="cta"] button.small-font-size-button,
  merch-card[variant="simplified-pricing-express"] [slot="cta"] a.con-button.small-font-size-button,
  merch-card[variant="simplified-pricing-express"] [slot="cta"] a.spectrum-Button.small-font-size-button,
  merch-card[variant="simplified-pricing-express"] a[slot="cta"].small-font-size-button {
      font-size: var(--merch-card-simplified-pricing-express-body-xs-font-size, 14px);
  }
}
`;var Oi={title:{tag:"h3",slot:"heading-xs",maxCount:250,withSuffix:!0},badge:{tag:"div",slot:"badge",default:"spectrum-blue-400"},allowedBadgeColors:["spectrum-blue-400","spectrum-gray-300","spectrum-yellow-300","gradient-purple-blue","gradient-firefly-spectrum"],description:{tag:"div",slot:"body-xs",maxCount:2e3,withSuffix:!1},prices:{tag:"div",slot:"price"},callout:{tag:"div",slot:"callout-content",editorLabel:"Price description"},ctas:{slot:"cta",size:"XL"},borderColor:{attribute:"border-color",specialValues:{gray:"var(--spectrum-gray-300)",blue:"var(--spectrum-blue-400)","gradient-purple-blue":"linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)","gradient-firefly-spectrum":"linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%)"}},disabledAttributes:["badgeColor","badgeBorderColor","trialBadgeColor","trialBadgeBorderColor"],supportsDefaultChild:!0},ht=class extends E{getGlobalCSS(){return Cn}get aemFragmentMapping(){return Oi}get headingSelector(){return'[slot="heading-xs"]'}get badge(){return this.card.querySelector('[slot="badge"]')}syncHeights(){if(this.card.getBoundingClientRect().width===0)return;let r=this.card.shadowRoot;if(!r)return;["header","price-container","cta"].forEach(a=>this.updateCardElementMinHeight(r.querySelector(`.${a}`),a));let t=this.card.querySelector('[slot="body-xs"]');t&&this.updateCardElementMinHeight(t,"description");let i=this.card.querySelector('[slot="body-xs"] p:has(mas-mnemonic)');i&&this.updateCardElementMinHeight(i,"icons")}async postCardUpdateHook(){if(!this.card.isConnected)return;await super.postCardUpdateHook();let r=this.getContainer();if(!r)return;let t=r.querySelectorAll(`merch-card[variant="${this.card.variant}"]`),i=34;t.forEach(a=>{a.classList.remove("small-font-size-button"),a.querySelectorAll('[slot="cta"] sp-button, [slot="cta"] button, [slot="cta"] a.con-button, [slot="cta"] a.spectrum-Button, a[slot="cta"]').forEach(o=>{let s=o.textContent.trim().length>i;o.classList.toggle("small-font-size-button",s)})}),_.isDesktopOrUp&&t.forEach(a=>a.variantLayout?.syncHeights?.())}connectedCallbackHook(){!this.card||this.card.failed||(this.setupAccordion(),this.card?.hasAttribute("data-default-card")&&!sr()&&this.card.setAttribute("data-expanded","true"),this.observeVisibility())}resyncSiblings(){let r=this.getContainer();r&&r.querySelectorAll(`merch-card[variant="${this.card.variant}"]`).forEach(t=>t.variantLayout?.syncHeights?.())}observeVisibility(){typeof ResizeObserver>"u"||(this.lastSyncedWidth=0,this.sizeObserver=new ResizeObserver(()=>{let r=this.card.getBoundingClientRect().width;r<=2||r===this.lastSyncedWidth||(this.lastSyncedWidth=r,this.resyncSiblings())}),this.sizeObserver.observe(this.card))}setupAccordion(){let r=this.card;if(!r)return;let t=()=>{if(sr())r.removeAttribute("data-expanded");else{let a=r.hasAttribute("data-default-card");r.setAttribute("data-expanded",a?"true":"false")}};t();let i=window.matchMedia(N);this.mediaQueryListener=()=>{t()},i.addEventListener("change",this.mediaQueryListener)}disconnectedCallbackHook(){this.mediaQueryListener&&window.matchMedia(N).removeEventListener("change",this.mediaQueryListener),this.sizeObserver?.disconnect(),this.sizeObserver=null}handleChevronClick(r){r.preventDefault(),r.stopPropagation(),this.toggleExpanded()}handleCardClick(r){r.target.closest('.chevron-button, mas-mnemonic, button, a, [role="button"]')||(r.preventDefault(),this.toggleExpanded())}toggleExpanded(){let r=this.card;if(!r||sr())return;let a=r.getAttribute("data-expanded")==="true"?"false":"true";r.setAttribute("data-expanded",a)}renderLayout(){return kc`
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
        `}};u(ht,"variantStyle",_c`
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
    `);import{html as kn,css as Pc}from"./lit-all.min.js";var Tn=`
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
@media screen and ${C} and (max-width: 1399px) {
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
@media screen and ${C} {
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

    merch-card[variant="full-pricing-express"] [slot="body-s"] > *:nth-child(1) {
        min-height: var(--consonant-merch-card-full-pricing-express-description-row-0-height);
    }
    merch-card[variant="full-pricing-express"] [slot="body-s"] > *:nth-child(2) {
        min-height: var(--consonant-merch-card-full-pricing-express-description-row-1-height);
    }
    merch-card[variant="full-pricing-express"] [slot="body-s"] > *:nth-child(3) {
        min-height: var(--consonant-merch-card-full-pricing-express-description-row-2-height);
    }
    merch-card[variant="full-pricing-express"] [slot="body-s"] > *:nth-child(4) {
        min-height: var(--consonant-merch-card-full-pricing-express-description-row-3-height);
    }
    merch-card[variant="full-pricing-express"] [slot="body-s"] > *:nth-child(5) {
        min-height: var(--consonant-merch-card-full-pricing-express-description-row-4-height);
    }
    merch-card[variant="full-pricing-express"] [slot="body-s"] > *:nth-child(6) {
        min-height: var(--consonant-merch-card-full-pricing-express-description-row-5-height);
    }
    merch-card[variant="full-pricing-express"] [slot="body-s"] > *:nth-child(7) {
        min-height: var(--consonant-merch-card-full-pricing-express-description-row-6-height);
    }
    merch-card[variant="full-pricing-express"] [slot="body-s"] > *:nth-child(8) {
        min-height: var(--consonant-merch-card-full-pricing-express-description-row-7-height);
    }
    merch-card[variant="full-pricing-express"] [slot="body-s"] > *:nth-child(9) {
        min-height: var(--consonant-merch-card-full-pricing-express-description-row-8-height);
    }
    merch-card[variant="full-pricing-express"] [slot="body-s"] > *:nth-child(10) {
        min-height: var(--consonant-merch-card-full-pricing-express-description-row-9-height);
    }
    merch-card[variant="full-pricing-express"] [slot="body-s"] > *:nth-child(11) {
        min-height: var(--consonant-merch-card-full-pricing-express-description-row-10-height);
    }
    merch-card[variant="full-pricing-express"] [slot="body-s"] > *:nth-child(12) {
        min-height: var(--consonant-merch-card-full-pricing-express-description-row-11-height);
    }
}
`;var Ni={title:{tag:"h3",slot:"heading-xs",maxCount:250,withSuffix:!0},badge:{tag:"div",slot:"badge",default:"spectrum-blue-400"},allowedBadgeColors:["spectrum-blue-400","spectrum-gray-300","spectrum-yellow-300","gradient-purple-blue","gradient-firefly-spectrum"],description:{tag:"div",slot:"body-s",maxCount:2e3,withSuffix:!1},shortDescription:{tag:"div",slot:"short-description",maxCount:3e3,withSuffix:!1},callout:{tag:"div",slot:"callout-content",editorLabel:"Price description"},prices:{tag:"div",slot:"price"},trialBadge:{tag:"div",slot:"trial-badge"},ctas:{slot:"cta",size:"XL"},mnemonics:{size:"xs"},borderColor:{attribute:"border-color",specialValues:{gray:"var(--spectrum-gray-300)",blue:"var(--spectrum-blue-400)","gradient-purple-blue":"linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)","gradient-firefly-spectrum":"linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%)"}},showAllSpectrumColors:!0,multiWhatsIncluded:"true",disabledAttributes:[]},Ut=class Ut extends E{getGlobalCSS(){return Tn}get aemFragmentMapping(){return Ni}get headingSelector(){return'[slot="heading-xs"]'}get badgeElement(){return this.card.querySelector('[slot="badge"]')}get badge(){return kn`
            <div
                class="badge-wrapper"
                style="${this.badgeElement?"":"visibility: hidden"}"
            >
                <slot name="badge"></slot>
            </div>
        `}async waitForTitleFont(){let r=this.card.querySelector(this.headingSelector);if(r&&document.fonts?.load){let t=window.getComputedStyle(r),i=`${t.fontWeight} ${t.fontSize} ${t.fontFamily}`;await document.fonts.load(i,r.textContent).catch(()=>null)}await document.fonts.ready}async syncHeights(){if(await this.waitForTitleFont(),await new Promise(s=>requestAnimationFrame(s)),await new Promise(s=>requestAnimationFrame(s)),this.card.getBoundingClientRect().width<=2)return;let r=Ut.SYNCED_SECTIONS.map(s=>({name:s,getElement:c=>c.shadowRoot?.querySelector(`.${s}`)})),t=this.getContainer(),i=t?t.querySelectorAll(`merch-card[variant="${this.card.variant}"]`):[this.card],a='[slot="body-s"] > *',n=Math.max(0,...Array.from(i,s=>s.querySelectorAll(a).length)),o=Array.from({length:n},(s,c)=>({name:`description-row-${c}`,getElement:l=>l.querySelectorAll(a)[c]}));this.syncRowHeights([...r,...o])}async postCardUpdateHook(){if(!this.card.isConnected)return;await super.postCardUpdateHook();let r=this.getContainer();if(r){let t=r.querySelectorAll(`merch-card[variant="${this.card.variant}"]`),i=49;t.forEach(a=>{a.classList.remove("small-font-size-button"),a.querySelectorAll('[slot="cta"] sp-button, [slot="cta"] button, [slot="cta"] a.con-button, [slot="cta"] a.spectrum-Button, a[slot="cta"]').forEach(o=>{let s=o.textContent.trim().length>i;o.classList.toggle("small-font-size-button",s)})})}window.matchMedia("(min-width: 768px)").matches&&this.syncHeights()}resyncOnReflow(){let r=this.card.getBoundingClientRect().width;if(r<=2)return;let t=this.card.querySelector(this.headingSelector),i=t?Math.round(t.getBoundingClientRect().height):0,a=`${Math.round(r)}:${i}`;a!==this.lastSyncedKey&&(this.lastSyncedKey=a,this.syncHeights())}connectedCallbackHook(){if(!this.card||typeof ResizeObserver>"u")return;this.lastSyncedKey="",this.sizeObserver=new ResizeObserver(()=>this.resyncOnReflow()),this.sizeObserver.observe(this.card);let r=this.card.querySelector(this.headingSelector);r&&this.sizeObserver.observe(r)}disconnectedCallbackHook(){this.sizeObserver?.disconnect(),this.sizeObserver=null}renderLayout(){return kn`
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
        `}};u(Ut,"SYNCED_SECTIONS",["header","short-description","price-container","cta"]),u(Ut,"variantStyle",Pc`
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
    `);var $t=Ut;import{html as Ii,css as Lc,nothing as Mc}from"./lit-all.min.js";var _n=`
/* Headless variant: minimal container for label/value rows */
.headless {
    display: flex;
    flex-direction: column;
    padding: var(--consonant-merch-spacing-xs, 8px);
}
`;var Pn={cardName:{attribute:"name"},title:{tag:"p",slot:"heading-xs"},cardTitle:{tag:"p",slot:"heading-xs"},subtitle:{tag:"p",slot:"body-xxs"},description:{tag:"div",slot:"body-xs"},promoText:{tag:"p",slot:"promo-text"},shortDescription:{tag:"p",slot:"short-description"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},whatsIncluded:{tag:"div",slot:"whats-included"},addonConfirmation:{tag:"div",slot:"addon-confirmation"},badge:{tag:"div",slot:"badge"},trialBadge:{tag:"div",slot:"trial-badge"},prices:{tag:"p",slot:"prices"},backgroundImage:{tag:"div",slot:"bg-image"},ctas:{slot:"footer",size:"m"},addon:!0,secureLabel:!0,borderColor:{attribute:"border-color"},backgroundColor:{attribute:"background-color"},size:[],mnemonics:{size:"m"}},zc=[{slot:"bg-image",label:"Background Image"},{slot:"badge",label:"Badge"},{slot:"icons",label:"Mnemonic icon"},{slot:"heading-xs",label:"Title"},{slot:"body-xxs",label:"Subtitle"},{slot:"body-xs",label:"Product description"},{slot:"promo-text",label:"Promo Text"},{slot:"callout-content",label:"Callout text"},{slot:"short-description",label:"Short Description"},{slot:"trial-badge",label:"Trial Badge"},{slot:"prices",label:"Product price"},{slot:"quantity-select",label:"Quantity select"},{slot:"addon",label:"Addon"},{slot:"whats-included",label:"What's included"},{slot:"addon-confirmation",label:"Addon confirmation"},{slot:"footer",label:"CTAs"}],pt=class extends E{constructor(r){super(r)}getGlobalCSS(){return _n}renderLayout(){return Ii`
            <div class="headless">
                ${zc.map(({slot:r,label:t})=>Ii`
                        <div class="headless-row">
                            <span class="headless-label">${t}</span>
                            <span class="headless-value">
                                <slot name="${r}"></slot>
                            </span>
                        </div>
                    `)}
                ${this.card.secureLabel?Ii`
                          <div class="headless-row">
                              <span class="headless-label">Secure label</span>
                              <span class="headless-value">
                                  ${this.secureLabel}
                              </span>
                          </div>
                      `:Mc}
            </div>
        `}};u(pt,"variantStyle",Lc`
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
    `);import{css as Rc,html as Oc}from"./lit-all.min.js";var Ln=`
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
`;var Mn={title:{tag:"p",slot:"title"},prices:{tag:"p",slot:"prices"},description:{tag:"p",slot:"description"},planType:!0,ctas:{slot:"ctas",size:"S"}},mt=class extends E{constructor(){super(...arguments);u(this,"legal")}async postCardUpdateHook(){await super.postCardUpdateHook(),this.adjustLegal()}getGlobalCSS(){return Ln}get headingSelector(){return'[slot="title"]'}priceOptionsProvider(t,i){i.literals={...i.literals,strikethroughAriaLabel:"",alternativePriceAriaLabel:""},i.space=!0,i.displayAnnual=this.card.settings?.displayAnnual??!1}adjustLegal(){if(this.legal!==void 0)return;let t=this.card.querySelector(`${j}[data-template="price"]`);if(!t)return;let i=t.cloneNode(!0);this.legal=i,t.dataset.displayTax="false",t.dataset.displayPerUnit="false",i.dataset.template="legal",i.dataset.displayPlanType=this.card?.settings?.displayPlanType??!0,i.setAttribute("slot","legal"),this.card.appendChild(i)}renderLayout(){return Oc`
            ${this.badge}
            <div class="body">
                <slot name="title"></slot>
                <slot name="prices"></slot>
                <slot name="legal"></slot>
                <slot name="description"></slot>
                <slot name="ctas"></slot>
            </div>
        `}};u(mt,"variantStyle",Rc`
        :host([variant='mini']) {
            min-width: 209px;
            min-height: 103px;
            background-color: var(--spectrum-background-base-color);
            border: 1px solid var(--consonant-merch-card-border-color, #dadada);
        }
    `);import{html as Nc,css as Ic}from"./lit-all.min.js";var zn=`
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
`;var Di={mnemonics:{size:"l"},title:{tag:"h3",slot:"header",maxCount:100},prices:{tag:"p",slot:"price"},description:{tag:"div",slot:"detail",maxCount:1e3},ctas:{slot:"cta",size:"M"},features:{tag:"div",slot:"features",unwrap:!0}},Dc=[{key:"header",selector:".seg-header"},{key:"price",selector:".seg-price"},{key:"detail",selector:".seg-detail"},{key:"cta",selector:".seg-cta"}],Cr,Rn,ut=class extends E{constructor(t){super(t);k(this,Cr);this.postCardUpdateHook=this.postCardUpdateHook.bind(this)}getGlobalCSS(){return zn}get aemFragmentMapping(){return Di}getContainer(){return this.card.closest("mas-compare-chart")??this.card.parentElement}connectedCallbackHook(){window.addEventListener("resize",this.postCardUpdateHook)}disconnectedCallbackHook(){window.removeEventListener("resize",this.postCardUpdateHook)}async postCardUpdateHook(){this.card.isConnected&&(await this.card.updateComplete,V(this,Cr,Rn).call(this))}renderLayout(){return Nc`
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
            </div>
            <div class="seg seg-cta">
                <slot name="cta"></slot>
            </div>
            <slot></slot>
        `}};Cr=new WeakSet,Rn=function(){if(this.card.getBoundingClientRect().width===0)return;let t=this.card.shadowRoot;Dc.forEach(({key:i,selector:a})=>this.updateCardElementMinHeight(t.querySelector(a),i))},u(ut,"variantStyle",Ic`
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
    `);import{html as Hc,css as Bc}from"./lit-all.min.js";var On=`
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
`;var Hi={mnemonics:{size:"s"},title:{tag:"h3",slot:"heading-xxs",maxCount:250,withSuffix:!0},description:{tag:"div",slot:"body-s",maxCount:2e3,withSuffix:!1},whatsIncluded:{tag:"div",slot:"whats-included"},badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300"},trialBadge:{tag:"div",slot:"trial-badge",default:"spectrum-green-800"},prices:{tag:"p",slot:"price"},ctas:{slot:"cta",size:"M"},addonConfirmation:{tag:"div",slot:"addon-confirmation"},borderColor:{attribute:"border-color",specialValues:{gray:"--spectrum-gray-300","gradient-purple-blue":"var(--gradient-purple-blue)","gradient-firefly-spectrum":"var(--gradient-firefly-spectrum)"}}},gt=class extends E{getGlobalCSS(){return On}get aemFragmentMapping(){return Hi}renderLayout(){return Hc`
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
        `}};u(gt,"variantStyle",Bc`
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
    `);var Nn=new Map;var G=(e,r,t=null,i=null,a)=>{Nn.set(e,{class:r,fragmentMapping:t,style:i,collectionOptions:a})};G("catalog",nt,qa,nt.variantStyle);G("image",qe);G("inline-heading",ur);G("mini-compare-chart",Ot,Qa,Ot.variantStyle);G("mini-compare-chart-mweb",ot,en,ot.variantStyle);G("plans",ie,wr,ie.variantStyle,ie.collectionOptions);G("plans-students",ie,nn,ie.variantStyle,ie.collectionOptions);G("plans-education",ie,an,ie.variantStyle,ie.collectionOptions);G("plans-v2",Ne,cn,Ne.variantStyle,Ne.collectionOptions);G("bizpro",Bt,un,Bt.variantStyle);G("product",st,xn,st.variantStyle);G("segment",ct,yn,ct.variantStyle);G("media",lt,En,lt.variantStyle);G("headless",pt,Pn,pt.variantStyle);G("special-offers",dt,An,dt.variantStyle);G("simplified-pricing-express",ht,Oi,ht.variantStyle);G("full-pricing-express",$t,Ni,$t.variantStyle);G("mini",mt,Mn,mt.variantStyle);G("image",qe,ja,qe.variantStyle);G("compare-chart-column",ut,Di,ut.variantStyle);G("fries",gt,Hi,gt.variantStyle);function mr(e){return Nn.get(e)?.fragmentMapping}var In="tacocat.js";var Bi=(e,r)=>String(e??"").toLowerCase()==String(r??"").toLowerCase(),Dn=e=>`${e??""}`.replace(/[&<>'"]/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[r]??r)??"";function D(e,r={},{metadata:t=!0,search:i=!0,storage:a=!0}={}){let n;if(i&&n==null){let o=new URLSearchParams(window.location.search),s=ft(i)?i:e;n=o.get(s)}if(a&&n==null){let o=ft(a)?a:e;n=window.sessionStorage.getItem(o)??window.localStorage.getItem(o)}if(t&&n==null){let o=Uc(ft(t)?t:e);n=document.documentElement.querySelector(`meta[name="${o}"]`)?.content}return n??r[e]}var Fc=e=>typeof e=="boolean",Tr=e=>typeof e=="function",kr=e=>typeof e=="number",Hn=e=>e!=null&&typeof e=="object";var ft=e=>typeof e=="string",Bn=e=>ft(e)&&e,vt=e=>kr(e)&&Number.isFinite(e)&&e>0;function _r(e,r=t=>t==null||t===""){return e!=null&&Object.entries(e).forEach(([t,i])=>{r(i)&&delete e[t]}),e}function S(e,r){if(Fc(e))return e;let t=String(e);return t==="1"||t==="true"?!0:t==="0"||t==="false"?!1:r}function Gt(e,r,t){let i=Object.values(r);return i.find(a=>Bi(a,e))??t??i[0]}function Uc(e=""){return String(e).replace(/(\p{Lowercase_Letter})(\p{Uppercase_Letter})/gu,(r,t,i)=>`${t}-${i}`).replace(/\W+/gu,"-").toLowerCase()}function Fn(e,r=1){return kr(e)||(e=Number.parseInt(e,10)),!Number.isNaN(e)&&e>0&&Number.isFinite(e)?e:r}var $c=Date.now(),Fi=()=>`(+${Date.now()-$c}ms)`,Pr=new Set,Gc=S(D("tacocat.debug",{},{metadata:!1}),!1);function Un(e){let r=`[${In}/${e}]`,t=(o,s,...c)=>o?!0:(a(s,...c),!1),i=Gc?(o,...s)=>{console.debug(`${r} ${o}`,...s,Fi())}:()=>{},a=(o,...s)=>{let c=`${r} ${o}`;Pr.forEach(([l])=>l(c,...s))};return{assert:t,debug:i,error:a,warn:(o,...s)=>{let c=`${r} ${o}`;Pr.forEach(([,l])=>l(c,...s))}}}function qc(e,r){let t=[e,r];return Pr.add(t),()=>{Pr.delete(t)}}qc((e,...r)=>{console.error(e,...r,Fi())},(e,...r)=>{console.warn(e,...r,Fi())});var Vc="no promo",$n="promo-tag",jc="yellow",Wc="neutral",Yc=(e,r,t)=>{let i=n=>n||Vc,a=t?` (was "${i(r)}")`:"";return`${i(e)}${a}`},Lr="cancel-context",Mr=(e,r)=>{let t=e===Lr,i=!t&&e?.length>0,a=(i||t)&&(r&&r!=e||!r&&!t),n=a&&i||!a&&!!r,o=n?e||r:void 0;return{effectivePromoCode:o,overridenPromoCode:e,className:n?$n:`${$n} no-promo`,text:Yc(o,r,a),variant:n?jc:Wc,isOverriden:a}};var Ui;(function(e){e.BASE="BASE",e.TRIAL="TRIAL",e.PROMOTION="PROMOTION"})(Ui||(Ui={}));var ce;(function(e){e.MONTH="MONTH",e.YEAR="YEAR",e.TWO_YEARS="TWO_YEARS",e.THREE_YEARS="THREE_YEARS",e.PERPETUAL="PERPETUAL",e.TERM_LICENSE="TERM_LICENSE",e.ACCESS_PASS="ACCESS_PASS",e.THREE_MONTHS="THREE_MONTHS",e.SIX_MONTHS="SIX_MONTHS"})(ce||(ce={}));var de;(function(e){e.ANNUAL="ANNUAL",e.MONTHLY="MONTHLY",e.TWO_YEARS="TWO_YEARS",e.THREE_YEARS="THREE_YEARS",e.P1D="P1D",e.P1Y="P1Y",e.P3Y="P3Y",e.P10Y="P10Y",e.P15Y="P15Y",e.P3D="P3D",e.P7D="P7D",e.P30D="P30D",e.HALF_YEARLY="HALF_YEARLY",e.QUARTERLY="QUARTERLY"})(de||(de={}));var $i;(function(e){e.INDIVIDUAL="INDIVIDUAL",e.TEAM="TEAM",e.ENTERPRISE="ENTERPRISE"})($i||($i={}));var Gi;(function(e){e.COM="COM",e.EDU="EDU",e.GOV="GOV"})(Gi||(Gi={}));var qi;(function(e){e.DIRECT="DIRECT",e.INDIRECT="INDIRECT"})(qi||(qi={}));var Vi;(function(e){e.ENTERPRISE_PRODUCT="ENTERPRISE_PRODUCT",e.ETLA="ETLA",e.RETAIL="RETAIL",e.VIP="VIP",e.VIPMP="VIPMP",e.FREE="FREE"})(Vi||(Vi={}));var ji="ABM",Wi="PUF",Yi="M2M",Xi="PERPETUAL",Ki="P3Y",Xc="TAX_INCLUSIVE_DETAILS",Kc="TAX_EXCLUSIVE",Gn={ABM:ji,PUF:Wi,M2M:Yi,PERPETUAL:Xi,P3Y:Ki},hu={[ji]:{commitment:ce.YEAR,term:de.MONTHLY},[Wi]:{commitment:ce.YEAR,term:de.ANNUAL},[Yi]:{commitment:ce.MONTH,term:de.MONTHLY},[Xi]:{commitment:ce.PERPETUAL,term:void 0},[Ki]:{commitment:ce.THREE_MONTHS,term:de.P3Y}},qn="Value is not an offer",zr=e=>{if(typeof e!="object")return qn;let{commitment:r,term:t}=e,i=Zc(r,t);return{...e,planType:i}};var Zc=(e,r)=>{switch(e){case void 0:return qn;case"":return"";case ce.YEAR:return r===de.MONTHLY?ji:r===de.ANNUAL?Wi:"";case ce.MONTH:return r===de.MONTHLY?Yi:"";case ce.PERPETUAL:return Xi;case ce.TERM_LICENSE:return r===de.P3Y?Ki:"";default:return""}};function Vn(e){let{priceDetails:r}=e,{price:t,priceWithoutDiscount:i,priceWithoutTax:a,priceWithoutDiscountAndTax:n,taxDisplay:o}=r;if(o!==Xc)return e;let s={...e,priceDetails:{...r,price:a??t,priceWithoutDiscount:n??i,taxDisplay:Kc}};return s.offerType==="TRIAL"&&s.priceDetails.price===0&&(s.priceDetails.price=s.priceDetails.priceWithoutDiscount),s}var je={clientId:"merch-at-scale",delimiter:"\xB6",ignoredProperties:["analytics","literals","element"],serializableTypes:["Array","Object"],sampleRate:1,severity:"e",tags:"acom",isProdDomain:!1},jn=1e3;function Qc(e){return e instanceof Error||typeof e?.originatingRequest=="string"}function Wn(e){if(e==null)return;let r=typeof e;if(r==="function")return e.name?`function ${e.name}`:"function";if(r==="object"){if(e instanceof Error)return e.message;if(typeof e.originatingRequest=="string"){let{message:i,originatingRequest:a,status:n}=e;return[i,n,a].filter(Boolean).join(" ")}let t=e[Symbol.toStringTag]??Object.getPrototypeOf(e).constructor.name;if(!je.serializableTypes.includes(t))return t}return e}function Jc(e,r){if(!je.ignoredProperties.includes(e))return Wn(r)}var Zi={append(e){if(e.level!=="error")return;let{message:r,params:t}=e,i=[],a=[],n=r;t.forEach(l=>{l!=null&&(Qc(l)?i:a).push(l)}),i.length&&(n+=` ${i.map(Wn).join(" ")}`);let{pathname:o,search:s}=window.location,c=`${je.delimiter}page=${o}${s}`;c.length>jn&&(c=`${c.slice(0,jn)}<trunc>`),n+=c,a.length&&(n+=`${je.delimiter}facts=`,n+=JSON.stringify(a,Jc)),window.lana?.log(n,je)}};function Rr(e){Object.assign(je,Object.fromEntries(Object.entries(e).filter(([r,t])=>r in je&&t!==""&&t!==null&&t!==void 0&&!Number.isNaN(t))))}var Yn={LOCAL:"local",PROD:"prod",STAGE:"stage"},Qi={DEBUG:"debug",ERROR:"error",INFO:"info",WARN:"warn"},Ji=new Set,ea=new Set,Xn=new Map,Kn={append({level:e,message:r,params:t,timestamp:i,source:a}){console[e](`${i}ms [${a}] %c${r}`,"font-weight: bold;",...t)}},Zn={filter:({level:e})=>e!==Qi.DEBUG},el={filter:()=>!1};function tl(e,r,t,i,a){return{level:e,message:r,namespace:t,get params(){return i.length===1&&Tr(i[0])&&(i=i[0](),Array.isArray(i)||(i=[i])),i},source:a,timestamp:performance.now().toFixed(3)}}function rl(e){[...ea].every(r=>r(e))&&Ji.forEach(r=>r(e))}function Qn(e){let r=(Xn.get(e)??0)+1;Xn.set(e,r);let t=`${e} #${r}`,i={id:t,namespace:e,module:a=>Qn(`${i.namespace}/${a}`),updateConfig:Rr};return Object.values(Qi).forEach(a=>{i[a]=(n,...o)=>rl(tl(a,n,e,o,t))}),Object.seal(i)}function Or(...e){e.forEach(r=>{let{append:t,filter:i}=r;Tr(i)&&ea.add(i),Tr(t)&&Ji.add(t)})}function il(e={}){let{name:r}=e,t=S(D("commerce.debug",{search:!0,storage:!0}),r===Yn.LOCAL);return Or(t?Kn:Zn),r===Yn.PROD&&Or(Zi),ae}function al(){Ji.clear(),ea.clear()}var ae={...Qn(gi),Level:Qi,Plugins:{consoleAppender:Kn,debugFilter:Zn,quietFilter:el,lanaAppender:Zi},init:il,reset:al,use:Or};var nl="mas-commerce-service",ol=ae.module("utilities"),sl={requestId:_t,etag:"Etag",lastModified:"Last-Modified",serverTiming:"server-timing"};function qt(e,{country:r,forceTaxExclusive:t}){let i;if(e.length<2)i=e;else{let a=r==="GB"?"EN":"MULT";e.sort((n,o)=>n.language===a?-1:o.language===a?1:0),e.sort((n,o)=>!n.term&&o.term?-1:n.term&&!o.term?1:0),i=[e[0]]}return t&&(i=i.map(Vn)),i}var Jn=(e,r)=>{let t=e.reduce((i,a)=>i+(r(a)||0),0);return t>0?Math.round(t*100)/100:void 0};function ta(e){if(!e||e.length===0)return null;if(e.length===1)return e[0];let[r,...t]=e;for(let s of t){let c=[["commitment","commitment types"],["term","terms"],["priceDetails.formatString","currency formats"]];for(let[l,d]of c){let h=l.includes(".")?r.priceDetails?.formatString:r[l],m=l.includes(".")?s.priceDetails?.formatString:s[l];m!==h&&ol.warn(`Offers have different ${d}, summing may produce unexpected results`,{expected:h,actual:m})}}let i=[["price",s=>s.priceDetails?.price],["priceWithoutDiscount",s=>s.priceDetails?.priceWithoutDiscount],["priceWithoutTax",s=>s.priceDetails?.priceWithoutTax],["priceWithoutDiscountAndTax",s=>s.priceDetails?.priceWithoutDiscountAndTax]],a={};for(let[s,c]of i){let l=Jn(e,c);l!==void 0&&(a[s]=l)}let n=e.some(s=>s.priceDetails?.annualized),o;if(n){let s=[["annualizedPrice",c=>c.priceDetails?.annualized?.annualizedPrice],["annualizedPriceWithoutTax",c=>c.priceDetails?.annualized?.annualizedPriceWithoutTax],["annualizedPriceWithoutDiscount",c=>c.priceDetails?.annualized?.annualizedPriceWithoutDiscount],["annualizedPriceWithoutDiscountAndTax",c=>c.priceDetails?.annualized?.annualizedPriceWithoutDiscountAndTax]];o={};for(let[c,l]of s){let d=Jn(e,l);d!==void 0&&(o[c]=d)}}return{...r,offerSelectorIds:e.flatMap(s=>s.offerSelectorIds||[]),priceDetails:{...r.priceDetails,...a,...o&&{annualized:o}}}}var Nr=e=>window.setTimeout(e);function xt(e,r=1){if(e==null)return[r];let t=(Array.isArray(e)?e:String(e).split(",")).map(Fn).filter(vt);return t.length||(t=[r]),t}function Ir(e){return e==null?[]:(Array.isArray(e)?e:String(e).split(",")).filter(Bn)}function ne(){return document.getElementsByTagName(nl)?.[0]}function eo(e){let r={};if(!e?.headers)return r;let t=e.headers;for(let[i,a]of Object.entries(sl)){let n=t.get(a);n&&(n=n.replace(/[,;]/g,"|"),n=n.replace(/[| ]+/g,"|"),r[i]=n)}return r}var bt=class e extends Error{constructor(r,t,i){if(super(r,{cause:i}),this.name="MasError",t.response){let a=t.response.headers?.get(_t);a&&(t.requestId=a),t.response.status&&(t.status=t.response.status,t.statusText=t.response.statusText),t.response.url&&(t.url=t.response.url)}delete t.response,this.context=t,Error.captureStackTrace&&Error.captureStackTrace(this,e)}toString(){let r=Object.entries(this.context||{}).map(([i,a])=>`${i}: ${JSON.stringify(a)}`).join(", "),t=`${this.name}: ${this.message}`;return r&&(t+=` (${r})`),this.cause&&(t+=`
Caused by: ${this.cause}`),t}};var cl={[pe]:li,[ze]:di,[Se]:hi},ll={[pe]:ui,[Se]:Ee},Vt,De=class{constructor(r){k(this,Vt);u(this,"changes",new Map);u(this,"connected",!1);u(this,"error");u(this,"log");u(this,"options");u(this,"promises",[]);u(this,"state",ze);u(this,"timer",null);u(this,"value");u(this,"version",0);u(this,"wrapperElement");this.wrapperElement=r,this.log=ae.module("mas-element")}update(){[pe,ze,Se].forEach(r=>{this.wrapperElement.classList.toggle(cl[r],r===this.state)})}notify(){(this.state===Se||this.state===pe)&&(this.state===Se?this.promises.forEach(({resolve:t})=>t(this.wrapperElement)):this.state===pe&&this.promises.forEach(({reject:t})=>t(this.error)),this.promises=[]);let r=this.error;this.error instanceof bt&&(r={message:this.error.message,...this.error.context}),this.wrapperElement.dispatchEvent(new CustomEvent(ll[this.state],{bubbles:!0,composed:!0,detail:r}))}attributeChangedCallback(r,t,i){this.changes.set(r,i),this.requestUpdate()}connectedCallback(){w(this,Vt,ne()),this.requestUpdate(!0)}disconnectedCallback(){this.connected&&(this.connected=!1,this.log?.debug("Disconnected:",{element:this.wrapperElement}))}onceSettled(){let{error:r,promises:t,state:i}=this;return Se===i?Promise.resolve(this.wrapperElement):pe===i?Promise.reject(r):new Promise((a,n)=>{t.push({resolve:a,reject:n})})}toggleResolved(r,t,i){return r!==this.version?!1:(i!==void 0&&(this.options=i),this.state=Se,this.value=t,this.update(),this.log?.debug("Resolved:",{element:this.wrapperElement,value:t}),Nr(()=>this.notify()),!0)}toggleFailed(r,t,i){if(r!==this.version)return!1;i!==void 0&&(this.options=i),this.error=t,this.state=pe,this.update();let a=this.wrapperElement.getAttribute("is");return this.log?.error(`${a}: Failed to render: ${t.message}`,{element:this.wrapperElement,...t.context,...v(this,Vt)?.duration}),Nr(()=>this.notify()),!0}togglePending(r){return this.version++,r&&(this.options=r),this.state=ze,this.update(),this.log?.debug("Pending:",{osi:this.wrapperElement?.options?.wcsOsi}),this.version}requestUpdate(r=!1){if(!this.wrapperElement.isConnected||!ne()||this.timer)return;let{error:t,options:i,state:a,value:n,version:o}=this;this.state=ze,this.timer=Nr(async()=>{this.timer=null;let s=null;if(this.changes.size&&(s=Object.fromEntries(this.changes.entries()),this.changes.clear()),this.connected?this.log?.debug("Updated:",{element:this.wrapperElement,changes:s}):(this.connected=!0,this.log?.debug("Connected:",{element:this.wrapperElement,changes:s})),s||r)try{await this.wrapperElement.render?.()===!1&&this.state===ze&&this.version===o&&(this.state=a,this.error=t,this.value=n,this.update(),this.notify())}catch(c){this.toggleFailed(this.version,c,i)}})}};Vt=new WeakMap;function to(e={}){return Object.entries(e).forEach(([r,t])=>{(t==null||t===""||t?.length===0)&&delete e[r]}),e}function Dr(e,r={}){let{tag:t,is:i}=e,a=document.createElement(t,{is:i});return a.setAttribute("is",i),Object.assign(a.dataset,to(r)),a}function ro(e,r={}){return e instanceof HTMLElement?(Object.assign(e.dataset,to(r)),e):null}function dl(e){return`https://${e==="PRODUCTION"?"www.adobe.com":"www.stage.adobe.com"}/offers/promo-terms.html`}var Xe,We=class We extends HTMLAnchorElement{constructor(){super();u(this,"masElement",new De(this));k(this,Xe);this.setAttribute("is",We.is)}get isUptLink(){return!0}initializeWcsData(t,i){this.setAttribute("data-wcs-osi",t),i&&this.setAttribute("data-promotion-code",i)}attributeChangedCallback(t,i,a){this.masElement.attributeChangedCallback(t,i,a)}connectedCallback(){this.masElement.connectedCallback(),w(this,Xe,Lt()),v(this,Xe)&&(this.log=v(this,Xe).log.module("upt-link"))}disconnectedCallback(){this.masElement.disconnectedCallback(),w(this,Xe,void 0)}requestUpdate(t=!1){this.masElement.requestUpdate(t)}onceSettled(){return this.masElement.onceSettled()}async render(){let t=Lt();if(!t)return!1;this.dataset.imsCountry||t.imsCountryPromise.then(o=>{o&&(this.dataset.imsCountry=o)});let i=t.collectCheckoutOptions({},this);if(!i.wcsOsi)return this.log.error("Missing 'data-wcs-osi' attribute on upt-link."),!1;let a=this.masElement.togglePending(i),n=t.resolveOfferSelectors(i);try{let[[o]]=await Promise.all(n),{country:s,language:c,env:l}=i,d=`locale=${c}_${s}&country=${s}&offer_id=${o.offerId}`,h=this.getAttribute("data-promotion-code");h&&(d+=`&promotion_code=${encodeURIComponent(h)}`),this.href=`${dl(l)}?${d}`,this.masElement.toggleResolved(a,o,i)}catch(o){let s=new Error(`Could not resolve offer selectors for id: ${i.wcsOsi}.`,o.message);return this.masElement.toggleFailed(a,s,i),!1}}static createFrom(t){let i=new We;for(let a of t.attributes)a.name!=="is"&&(a.name==="class"&&a.value.includes("upt-link")?i.setAttribute("class",a.value.replace("upt-link","").trim()):i.setAttribute(a.name,a.value));return i.innerHTML=t.innerHTML,i.setAttribute("tabindex",0),i}};Xe=new WeakMap,u(We,"is","upt-link"),u(We,"tag","a"),u(We,"observedAttributes",["data-wcs-osi","data-promotion-code","data-ims-country"]);var Ye=We;window.customElements.get(Ye.is)||window.customElements.define(Ye.is,Ye,{extends:Ye.tag});function io(e){return e&&(e==="bizpro"||e.startsWith("plans")?"plans":e)}var hl="p_draft_landscape",pl="/store/",ml=new Map([["countrySpecific","cs"],["customerSegment","cs"],["quantity","q"],["authCode","code"],["checkoutPromoCode","apc"],["rurl","rUrl"],["curl","cUrl"],["ctxrturl","ctxRtUrl"],["country","co"],["language","lang"],["clientId","cli"],["context","ctx"],["productArrangementCode","pa"],["addonProductArrangementCode","ao"],["offerType","ot"],["marketSegment","ms"]]),ra=new Set(["af","ai","ao","apc","appctxid","cli","co","cs","csm","ctx","ctxRtUrl","DCWATC","dp","fr","gsp","ijt","lang","lo","mal","ms","mv","mv2","nglwfdata","ot","otac","pa","pcid","promoid","q","rf","sc","scl","sdid","sid","spint","svar","th","thm","trackingid","usid","workflowid","context.guid","so.ca","so.su","so.tr","so.va"]),ul=["env","workflowStep","clientId","country"],gl=["/tw/","/hk_zh/"];function fl(e){let r=e??"";return gl.some(t=>r.startsWith(t))}function vl(){if(typeof window>"u")return!1;let e=[window.location.pathname];try{window.parent!==window&&e.push(window.parent.location.pathname)}catch{}return e.some(fl)}function ia(e){if(!vl())return e instanceof URL?e.toString():String(e);let r;try{r=e instanceof URL?e:new URL(e)}catch{return String(e)}r.searchParams.set("lang","zh-Hant");for(let t of[...r.searchParams.keys()])/^items\[\d+]\[lang]$/.test(t)&&r.searchParams.set(t,"zh-Hant");return r.toString()}var ao=new Set(["gid","gtoken","notifauditid","cohortid","productname","sdid","attimer","gcsrc","gcprog","gcprogcat","gcpagetype","mv","mv2"]),no=e=>ml.get(e)??e;function Hr(e,r,t){for(let[i,a]of Object.entries(e)){let n=no(i);a!=null&&t.has(n)&&r.set(n,a)}}function xl(e){switch(e){case wi.PRODUCTION:return"https://commerce.adobe.com";default:return"https://commerce-stg.adobe.com"}}function bl(e,r){for(let t in e){let i=e[t];for(let[a,n]of Object.entries(i)){if(n==null)continue;let o=no(a);r.set(`items[${t}][${o}]`,n)}}}function yl({url:e,modal:r,is3in1:t}){if(!t||!e?.searchParams)return e;e.searchParams.set("rtc","t"),e.searchParams.set("lo","sl");let i=e.searchParams.get("af");return e.searchParams.set("af",[i,"uc_new_user_iframe","uc_new_system_close"].filter(Boolean).join(",")),e.searchParams.get("cli")!=="doc_cloud"&&e.searchParams.set("cli",r===Ge.CRM?"creative":"mini_plans"),e}function wl(e){let r=new URLSearchParams(window.location.search),t={};ao.forEach(i=>{let a=r.get(i);a!==null&&(t[i]=a)}),Object.keys(t).length>0&&Hr(t,e.searchParams,ao)}function oo(e){El(e);let{env:r,items:t,workflowStep:i,marketSegment:a,customerSegment:n,offerType:o,productArrangementCode:s,landscape:c,modal:l,is3in1:d,preselectPlan:h,...m}=e,p=new URL(xl(r));if(p.pathname=`${pl}${i}`,i!==re.SEGMENTATION&&i!==re.CHANGE_PLAN_TEAM_PLANS&&bl(t,p.searchParams),Hr({...m},p.searchParams,ra),wl(p),c===Re.DRAFT&&Hr({af:hl},p.searchParams,ra),i===re.SEGMENTATION){let g={marketSegment:a,offerType:o,customerSegment:n,productArrangementCode:s,quantity:t?.[0]?.quantity,addonProductArrangementCode:s?t?.find(f=>f.productArrangementCode!==s)?.productArrangementCode:t?.[1]?.productArrangementCode};h?.toLowerCase()==="edu"?p.searchParams.set("ms","EDU"):h?.toLowerCase()==="team"&&p.searchParams.set("cs","TEAM"),Hr(g,p.searchParams,ra),p.searchParams.get("ot")==="PROMOTION"&&p.searchParams.delete("ot"),p=yl({url:p,modal:l,is3in1:d})}return ia(p)}function El(e){for(let r of ul)if(!e[r])throw new Error(`Argument "checkoutData" is not valid, missing: ${r}`);if(e.workflowStep!==re.SEGMENTATION&&e.workflowStep!==re.CHANGE_PLAN_TEAM_PLANS&&!e.items)throw new Error('Argument "checkoutData" is not valid, missing: items');return!0}var Sl=/[0-9\-+#]/,Al=/[^\d\-+#]/g;function so(e){return e.search(Sl)}function Cl(e="#.##"){let r={},t=e.length,i=so(e);r.prefix=i>0?e.substring(0,i):"";let a=so(e.split("").reverse().join("")),n=t-a,o=e.substring(n,n+1),s=n+(o==="."||o===","?1:0);r.suffix=a>0?e.substring(s,t):"",r.mask=e.substring(i,s),r.maskHasNegativeSign=r.mask.charAt(0)==="-",r.maskHasPositiveSign=r.mask.charAt(0)==="+";let c=r.mask.match(Al);return r.decimal=c&&c[c.length-1]||".",r.separator=c&&c[1]&&c[0]||",",c=r.mask.split(r.decimal),r.integer=c[0],r.fraction=c[1],r}function Tl(e,r,t){let i=!1,a={value:e};e<0&&(i=!0,a.value=-a.value),a.sign=i?"-":"",a.value=Number(a.value).toFixed(r.fraction&&r.fraction.length),a.value=Number(a.value).toString();let n=r.fraction&&r.fraction.lastIndexOf("0"),[o="0",s=""]=a.value.split(".");return(!s||s&&s.length<=n)&&(s=n<0?"":(+`0.${s}`).toFixed(n+1).replace("0.","")),a.integer=o,a.fraction=s,kl(a,r),(a.result==="0"||a.result==="")&&(i=!1,a.sign=""),!i&&r.maskHasPositiveSign?a.sign="+":i&&r.maskHasPositiveSign?a.sign="-":i&&(a.sign=t&&t.enforceMaskSign&&!r.maskHasNegativeSign?"":"-"),a}function kl(e,r){e.result="";let t=r.integer.split(r.separator),i=t.join(""),a=i&&i.indexOf("0");if(a>-1)for(;e.integer.length<i.length-a;)e.integer=`0${e.integer}`;else Number(e.integer)===0&&(e.integer="");let n=t[1]&&t[t.length-1].length;if(n){let o=e.integer.length,s=o%n;for(let c=0;c<o;c++)e.result+=e.integer.charAt(c),!((c-s+1)%n)&&c<o-n&&(e.result+=r.separator)}else e.result=e.integer;return e.result+=r.fraction&&e.fraction?r.decimal+e.fraction:"",e}function _l(e,r,t={}){if(!e||isNaN(Number(r)))return r;let i=Cl(e),a=Tl(r,i,t);return i.prefix+a.sign+a.result+i.suffix}var co=_l;var lo=".",Pl=",",po=/^\s+/,mo=/\s+$/,ho="&nbsp;",aa=e=>e*12,Ze=(e,r,t=1)=>{if(!e)return!1;let{start:i,end:a,displaySummary:{amount:n,duration:o,minProductQuantity:s=1,outcomeType:c}={}}=e;if(!(n&&o&&c)||t<s)return!1;let l=r?new Date(r):new Date;if(!i||!a)return!1;let d=new Date(i),h=new Date(a);return l>=d&&l<=h},Ke={MONTH:"MONTH",YEAR:"YEAR"},Ll={[le.ANNUAL]:12,[le.MONTHLY]:1,[le.THREE_YEARS]:36,[le.TWO_YEARS]:24},na=(e,r)=>({accept:e,round:r}),Ml=[na(({divisor:e,price:r})=>r%e==0,({divisor:e,price:r})=>r/e),na(({usePrecision:e})=>e,({divisor:e,price:r})=>Math.round(r/e*100)/100),na(()=>!0,({divisor:e,price:r})=>Math.ceil(Math.floor(r*100/e)/100))],oa={[$e.YEAR]:{[le.MONTHLY]:Ke.MONTH,[le.ANNUAL]:Ke.YEAR},[$e.MONTH]:{[le.MONTHLY]:Ke.MONTH}},zl=(e,r)=>e.indexOf(`'${r}'`)===0,Rl=(e,r=!0)=>{let t=e.replace(/'.*?'/,"").trim(),i=go(t);return!!i?r||(t=t.replace(/[,\.]0+/,i)):t=t.replace(/\s?(#.*0)(?!\s)?/,`$&${Nl(e)}`),t},Ol=e=>{let r=Il(e),t=zl(e,r),i=e.replace(/'.*?'/,""),a=po.test(i)||mo.test(i);return{currencySymbol:r,isCurrencyFirst:t,hasCurrencySpace:a}},uo=e=>e.replace(po,ho).replace(mo,ho),Nl=e=>e.match(/#(.?)#/)?.[1]===lo?Pl:lo,Il=e=>e.match(/'(.*?)'/)?.[1]??"",go=e=>e.match(/0(.?)0/)?.[1]??"";function yt({formatString:e,price:r,usePrecision:t,isIndianPrice:i=!1},a,n=o=>o){let{currencySymbol:o,isCurrencyFirst:s,hasCurrencySpace:c}=Ol(e),l=t?go(e):"",d=Rl(e,t),h=t?2:0,m=n(r,{currencySymbol:o}),p=i?m.toLocaleString("hi-IN",{minimumFractionDigits:h,maximumFractionDigits:h}):co(d,m),g=t?p.lastIndexOf(l):p.length,f=p.substring(0,g),x=p.substring(g+1);return{accessiblePrice:e.replace(/'.*?'/,"SYMBOL").replace(/#.*0/,p).replace(/SYMBOL/,o),currencySymbol:o,decimals:x,decimalsDelimiter:l,hasCurrencySpace:c,integer:f,isCurrencyFirst:s,recurrenceTerm:a}}var fo=e=>{let{commitment:r,term:t,usePrecision:i}=e,a=Ll[t]??1;return yt(e,a>1?Ke.MONTH:oa[r]?.[t],n=>{let o={divisor:a,price:n,usePrecision:i},{round:s}=Ml.find(({accept:c})=>c(o));if(!s)throw new Error(`Missing rounding rule for: ${JSON.stringify(o)}`);return s(o)})},vo=({commitment:e,term:r,...t})=>yt(t,oa[e]?.[r]),xo=e=>{let{commitment:r,instant:t,price:i,originalPrice:a,priceWithoutDiscount:n,promotion:o,quantity:s=1,term:c}=e;if(r===$e.YEAR&&c===le.MONTHLY){if(!o)return yt(e,Ke.YEAR,aa);let{displaySummary:{outcomeType:l,duration:d}={}}=o;switch(l){case"PERCENTAGE_DISCOUNT":if(Ze(o,t,s)){let h=parseInt(d.replace("P","").replace("M",""));if(isNaN(h))return aa(i);let m=a*h,p=n*(12-h),g=Math.round((m+p)*100)/100;return yt({...e,price:g},Ke.YEAR)}default:return yt(e,Ke.YEAR,()=>aa(n??i))}}return yt(e,oa[r]?.[c])};var bo="download",yo="upgrade",wo={e:"EDU",t:"TEAM"};function Eo(e,r={},t=""){let i=ne();if(!i)return null;let{checkoutMarketSegment:a,checkoutWorkflow:n,checkoutWorkflowStep:o,entitlement:s,upgrade:c,modal:l,perpetual:d,promotionCode:h,quantity:m,wcsOsi:p,extraOptions:g,analyticsId:f}=i.collectCheckoutOptions(r),x=Dr(e,{checkoutMarketSegment:a,checkoutWorkflow:n,checkoutWorkflowStep:o,entitlement:s,upgrade:c,modal:l,perpetual:d,promotionCode:r.promotionCode===Lr?Lr:h,quantity:m,wcsOsi:p,extraOptions:g,analyticsId:f});return t&&(x.innerHTML=`<span style="pointer-events: none;">${t}</span>`),x}function So(e){return class extends e{constructor(){super(...arguments);u(this,"checkoutActionHandler");u(this,"masElement",new De(this))}attributeChangedCallback(i,a,n){this.masElement.attributeChangedCallback(i,a,n)}connectedCallback(){this.masElement.connectedCallback(),this.addEventListener("click",this.clickHandler)}disconnectedCallback(){this.masElement.disconnectedCallback(),this.removeEventListener("click",this.clickHandler)}onceSettled(){return this.masElement.onceSettled()}get value(){return this.masElement.value}get options(){return this.masElement.options}get marketSegment(){let i=this.options?.ms??this.value?.[0].marketSegments?.[0];return wo[i]??i}get customerSegment(){let i=this.options?.cs??this.value?.[0]?.customerSegment;return wo[i]??i}get is3in1Modal(){return Object.values(Ge).includes(this.getAttribute("data-modal"))}get isOpen3in1Modal(){let i=document.querySelector("meta[name=mas-ff-3in1]");return this.is3in1Modal&&(!i||i.content!=="off")}requestUpdate(i=!1){return this.masElement.requestUpdate(i)}static get observedAttributes(){return["data-checkout-workflow","data-checkout-workflow-step","data-extra-options","data-ims-country","data-perpetual","data-promotion-code","data-quantity","data-template","data-wcs-osi","data-entitlement","data-upgrade","data-modal"]}async render(i={}){let a=ne();if(!a)return!1;this.dataset.imsCountry||a.imsCountryPromise.then(p=>{p&&(this.dataset.imsCountry=p)}),i.imsCountry=null;let n=a.collectCheckoutOptions(i,this);if(!n.wcsOsi.length)return!1;let o;try{o=JSON.parse(n.extraOptions??"{}")}catch(p){this.masElement.log?.error("cannot parse exta checkout options",p)}let s=this.masElement.togglePending(n);this.setCheckoutUrl("");let c=a.resolveOfferSelectors(n),l=await Promise.all(c);l=l.map(p=>qt(p,n));let d=l.flat().find(p=>p.promotion);!Ze(d?.promotion,d?.promotion?.displaySummary?.instant,n.quantity[0])&&n.promotionCode&&delete n.promotionCode,n.country=this.dataset.imsCountry||n.country;let m=await a.buildCheckoutAction?.(l.flat(),{...o,...n},this);return this.renderOffers(l.flat(),n,{},m,s)}renderOffers(i,a,n={},o=void 0,s=void 0){let c=ne();if(!c)return!1;if(a={...JSON.parse(this.dataset.extraOptions??"{}"),...a,...n},s??(s=this.masElement.togglePending(a)),this.checkoutActionHandler&&(this.checkoutActionHandler=void 0),o){this.classList.remove(bo,yo),this.masElement.toggleResolved(s,i,a);let{url:d,text:h,className:m,handler:p}=o;d&&this.setCheckoutUrl(ia(d)),h&&(this.firstElementChild.innerHTML=h),m&&this.classList.add(...m.split(" ")),p&&(this.setCheckoutUrl("#"),this.checkoutActionHandler=p.bind(this))}if(i.length){if(this.masElement.toggleResolved(s,i,a)){if(!this.classList.contains(bo)&&!this.classList.contains(yo)){let d=c.buildCheckoutURL(i,a);this.setCheckoutUrl(a.modal==="true"?"#":d)}return!0}}else{let d=new Error(`Not provided: ${a?.wcsOsi??"-"}`);if(this.masElement.toggleFailed(s,d,a))return this.setCheckoutUrl("#"),!0}}setCheckoutUrl(){}clickHandler(i){}updateOptions(i={}){let a=ne();if(!a)return!1;let{checkoutMarketSegment:n,checkoutWorkflow:o,checkoutWorkflowStep:s,entitlement:c,upgrade:l,modal:d,perpetual:h,promotionCode:m,quantity:p,wcsOsi:g}=a.collectCheckoutOptions(i);return ro(this,{checkoutMarketSegment:n,checkoutWorkflow:o,checkoutWorkflowStep:s,entitlement:c,upgrade:l,modal:d,perpetual:h,promotionCode:m,quantity:p,wcsOsi:g}),!0}}}var jt=class jt extends So(HTMLAnchorElement){static createCheckoutLink(r={},t=""){return Eo(jt,r,t)}setCheckoutUrl(r){this.setAttribute("href",r)}get isCheckoutLink(){return!0}clickHandler(r){if(this.checkoutActionHandler){this.checkoutActionHandler?.(r);return}}};u(jt,"is","checkout-link"),u(jt,"tag","a");var ke=jt;window.customElements.get(ke.is)||window.customElements.define(ke.is,ke,{extends:ke.tag});var z=Object.freeze({checkoutClientId:"adobe_com",checkoutWorkflowStep:re.EMAIL,country:"US",displayOldPrice:!0,displayPerUnit:!1,displayRecurrence:!0,displayTax:!1,displayPlanType:!1,env:ge.PRODUCTION,forceTaxExclusive:!1,language:"en",entitlement:!1,extraOptions:{},modal:!1,promotionCode:"",quantity:1,alternativePrice:!1,wcsApiKey:"wcms-commerce-ims-ro-user-milo",wcsURL:"https://www.adobe.com/web_commerce_artifact",landscape:Re.PUBLISHED});function Ao({settings:e,providers:r}){function t(n,o){let{checkoutClientId:s,checkoutWorkflowStep:c,country:l,language:d,promotionCode:h,quantity:m,preselectPlan:p,env:g}=e,f={checkoutClientId:s,checkoutWorkflowStep:c,country:l,language:d,promotionCode:h,quantity:m,preselectPlan:p,env:g};if(o)for(let ar of r.checkout)ar(o,f);let{checkoutMarketSegment:x,checkoutWorkflowStep:y=c,imsCountry:O,country:b=O??l,language:T=d,quantity:M=m,entitlement:I,upgrade:F,modal:U,perpetual:$,promotionCode:ee=h,wcsOsi:K,extraOptions:se,...we}=Object.assign(f,o?.dataset??{},n??{}),Me=Gt(y,re,z.checkoutWorkflowStep);return f=_r({...we,extraOptions:se,checkoutClientId:s,checkoutMarketSegment:x,country:b,quantity:xt(M,z.quantity),checkoutWorkflowStep:Me,language:T,entitlement:S(I),upgrade:S(F),modal:U,perpetual:S($),promotionCode:Mr(ee).effectivePromoCode,wcsOsi:Ir(K),preselectPlan:p}),f}function i(n,o){if(!Array.isArray(n)||!n.length||!o)return"";let{env:s,landscape:c}=e,{checkoutClientId:l,checkoutMarketSegment:d,checkoutWorkflowStep:h,country:m,promotionCode:p,quantity:g,preselectPlan:f,ms:x,cs:y,...O}=t(o),b=document.querySelector("meta[name=mas-ff-3in1]"),T=Object.values(Ge).includes(o.modal)&&(!b||b.content!=="off"),M=window.frameElement||T?"if":"fp",[{productArrangementCode:I,marketSegments:[F],customerSegment:U,offerType:$}]=n,ee=x??F??d,K=y??U;f?.toLowerCase()==="edu"?ee="EDU":f?.toLowerCase()==="team"&&(K="TEAM");let se={is3in1:T,checkoutPromoCode:p,clientId:l,context:M,country:m,env:s,items:[],marketSegment:ee,customerSegment:K,offerType:$,productArrangementCode:I,workflowStep:h,landscape:c,...O},we=g[0]>1?g[0]:void 0;if(n.length===1){let{offerId:Me}=n[0];se.items.push({id:Me,quantity:we})}else se.items.push(...n.map(({offerId:Me,productArrangementCode:ar})=>({id:Me,quantity:we,...T?{productArrangementCode:ar}:{}})));return oo(se)}let{createCheckoutLink:a}=ke;return{CheckoutLink:ke,CheckoutWorkflowStep:re,buildCheckoutURL:i,collectCheckoutOptions:t,createCheckoutLink:a}}function Dl({interval:e=200,maxAttempts:r=25}={}){let t=ae.module("ims");return new Promise(i=>{t.debug("Waing for IMS to be ready");let a=0;function n(){window.adobeIMS?.initialized?i():++a>r?(t.debug("Timeout"),i()):setTimeout(n,e)}n()})}function Hl(e){return e.then(()=>window.adobeIMS?.isSignedInUser()??!1)}function Bl(e){let r=ae.module("ims");return e.then(t=>t?window.adobeIMS.getProfile().then(({countryCode:i})=>(r.debug("Got user country:",i),i),i=>{r.error("Unable to get user country:",i)}):null)}function Co({}){let e=Dl(),r=Hl(e),t=Bl(r);return{imsReadyPromise:e,imsSignedInPromise:r,imsCountryPromise:t}}var To=window.masPriceLiterals;function ko(e){if(Array.isArray(To)){let r;switch(e.locale){case"id_ID":r="in";break;case"zh_TW":r="zh-hant";break;case"zh_HK":r="zh-hant";break;default:r=e.language}let t=a=>To.find(n=>Bi(n.lang,a)),i=t(r)??t(z.language);if(i)return Object.freeze(i)}return{}}var sa=function(e,r){return sa=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,i){t.__proto__=i}||function(t,i){for(var a in i)Object.prototype.hasOwnProperty.call(i,a)&&(t[a]=i[a])},sa(e,r)};function Wt(e,r){if(typeof r!="function"&&r!==null)throw new TypeError("Class extends value "+String(r)+" is not a constructor or null");sa(e,r);function t(){this.constructor=e}e.prototype=r===null?Object.create(r):(t.prototype=r.prototype,new t)}var P=function(){return P=Object.assign||function(r){for(var t,i=1,a=arguments.length;i<a;i++){t=arguments[i];for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(r[n]=t[n])}return r},P.apply(this,arguments)};function Br(e,r,t){if(t||arguments.length===2)for(var i=0,a=r.length,n;i<a;i++)(n||!(i in r))&&(n||(n=Array.prototype.slice.call(r,0,i)),n[i]=r[i]);return e.concat(n||Array.prototype.slice.call(r))}var A;(function(e){e[e.EXPECT_ARGUMENT_CLOSING_BRACE=1]="EXPECT_ARGUMENT_CLOSING_BRACE",e[e.EMPTY_ARGUMENT=2]="EMPTY_ARGUMENT",e[e.MALFORMED_ARGUMENT=3]="MALFORMED_ARGUMENT",e[e.EXPECT_ARGUMENT_TYPE=4]="EXPECT_ARGUMENT_TYPE",e[e.INVALID_ARGUMENT_TYPE=5]="INVALID_ARGUMENT_TYPE",e[e.EXPECT_ARGUMENT_STYLE=6]="EXPECT_ARGUMENT_STYLE",e[e.INVALID_NUMBER_SKELETON=7]="INVALID_NUMBER_SKELETON",e[e.INVALID_DATE_TIME_SKELETON=8]="INVALID_DATE_TIME_SKELETON",e[e.EXPECT_NUMBER_SKELETON=9]="EXPECT_NUMBER_SKELETON",e[e.EXPECT_DATE_TIME_SKELETON=10]="EXPECT_DATE_TIME_SKELETON",e[e.UNCLOSED_QUOTE_IN_ARGUMENT_STYLE=11]="UNCLOSED_QUOTE_IN_ARGUMENT_STYLE",e[e.EXPECT_SELECT_ARGUMENT_OPTIONS=12]="EXPECT_SELECT_ARGUMENT_OPTIONS",e[e.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE=13]="EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE",e[e.INVALID_PLURAL_ARGUMENT_OFFSET_VALUE=14]="INVALID_PLURAL_ARGUMENT_OFFSET_VALUE",e[e.EXPECT_SELECT_ARGUMENT_SELECTOR=15]="EXPECT_SELECT_ARGUMENT_SELECTOR",e[e.EXPECT_PLURAL_ARGUMENT_SELECTOR=16]="EXPECT_PLURAL_ARGUMENT_SELECTOR",e[e.EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT=17]="EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT",e[e.EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT=18]="EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT",e[e.INVALID_PLURAL_ARGUMENT_SELECTOR=19]="INVALID_PLURAL_ARGUMENT_SELECTOR",e[e.DUPLICATE_PLURAL_ARGUMENT_SELECTOR=20]="DUPLICATE_PLURAL_ARGUMENT_SELECTOR",e[e.DUPLICATE_SELECT_ARGUMENT_SELECTOR=21]="DUPLICATE_SELECT_ARGUMENT_SELECTOR",e[e.MISSING_OTHER_CLAUSE=22]="MISSING_OTHER_CLAUSE",e[e.INVALID_TAG=23]="INVALID_TAG",e[e.INVALID_TAG_NAME=25]="INVALID_TAG_NAME",e[e.UNMATCHED_CLOSING_TAG=26]="UNMATCHED_CLOSING_TAG",e[e.UNCLOSED_TAG=27]="UNCLOSED_TAG"})(A||(A={}));var H;(function(e){e[e.literal=0]="literal",e[e.argument=1]="argument",e[e.number=2]="number",e[e.date=3]="date",e[e.time=4]="time",e[e.select=5]="select",e[e.plural=6]="plural",e[e.pound=7]="pound",e[e.tag=8]="tag"})(H||(H={}));var Qe;(function(e){e[e.number=0]="number",e[e.dateTime=1]="dateTime"})(Qe||(Qe={}));function ca(e){return e.type===H.literal}function _o(e){return e.type===H.argument}function Fr(e){return e.type===H.number}function Ur(e){return e.type===H.date}function $r(e){return e.type===H.time}function Gr(e){return e.type===H.select}function qr(e){return e.type===H.plural}function Po(e){return e.type===H.pound}function Vr(e){return e.type===H.tag}function jr(e){return!!(e&&typeof e=="object"&&e.type===Qe.number)}function Yt(e){return!!(e&&typeof e=="object"&&e.type===Qe.dateTime)}var la=/[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/;var Fl=/(?:[Eec]{1,6}|G{1,5}|[Qq]{1,5}|(?:[yYur]+|U{1,5})|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHK]{1,2}|w{1,2}|W{1}|m{1,2}|s{1,2}|[zZOvVxX]{1,4})(?=([^']*'[^']*')*[^']*$)/g;function Lo(e){var r={};return e.replace(Fl,function(t){var i=t.length;switch(t[0]){case"G":r.era=i===4?"long":i===5?"narrow":"short";break;case"y":r.year=i===2?"2-digit":"numeric";break;case"Y":case"u":case"U":case"r":throw new RangeError("`Y/u/U/r` (year) patterns are not supported, use `y` instead");case"q":case"Q":throw new RangeError("`q/Q` (quarter) patterns are not supported");case"M":case"L":r.month=["numeric","2-digit","short","long","narrow"][i-1];break;case"w":case"W":throw new RangeError("`w/W` (week) patterns are not supported");case"d":r.day=["numeric","2-digit"][i-1];break;case"D":case"F":case"g":throw new RangeError("`D/F/g` (day) patterns are not supported, use `d` instead");case"E":r.weekday=i===4?"short":i===5?"narrow":"short";break;case"e":if(i<4)throw new RangeError("`e..eee` (weekday) patterns are not supported");r.weekday=["short","long","narrow","short"][i-4];break;case"c":if(i<4)throw new RangeError("`c..ccc` (weekday) patterns are not supported");r.weekday=["short","long","narrow","short"][i-4];break;case"a":r.hour12=!0;break;case"b":case"B":throw new RangeError("`b/B` (period) patterns are not supported, use `a` instead");case"h":r.hourCycle="h12",r.hour=["numeric","2-digit"][i-1];break;case"H":r.hourCycle="h23",r.hour=["numeric","2-digit"][i-1];break;case"K":r.hourCycle="h11",r.hour=["numeric","2-digit"][i-1];break;case"k":r.hourCycle="h24",r.hour=["numeric","2-digit"][i-1];break;case"j":case"J":case"C":throw new RangeError("`j/J/C` (hour) patterns are not supported, use `h/H/K/k` instead");case"m":r.minute=["numeric","2-digit"][i-1];break;case"s":r.second=["numeric","2-digit"][i-1];break;case"S":case"A":throw new RangeError("`S/A` (second) patterns are not supported, use `s` instead");case"z":r.timeZoneName=i<4?"short":"long";break;case"Z":case"O":case"v":case"V":case"X":case"x":throw new RangeError("`Z/O/v/V/X/x` (timeZone) patterns are not supported, use `z` instead")}return""}),r}var Mo=/[\t-\r \x85\u200E\u200F\u2028\u2029]/i;function No(e){if(e.length===0)throw new Error("Number skeleton cannot be empty");for(var r=e.split(Mo).filter(function(m){return m.length>0}),t=[],i=0,a=r;i<a.length;i++){var n=a[i],o=n.split("/");if(o.length===0)throw new Error("Invalid number skeleton");for(var s=o[0],c=o.slice(1),l=0,d=c;l<d.length;l++){var h=d[l];if(h.length===0)throw new Error("Invalid number skeleton")}t.push({stem:s,options:c})}return t}function Ul(e){return e.replace(/^(.*?)-/,"")}var zo=/^\.(?:(0+)(\*)?|(#+)|(0+)(#+))$/g,Io=/^(@+)?(\+|#+)?[rs]?$/g,$l=/(\*)(0+)|(#+)(0+)|(0+)/g,Do=/^(0+)$/;function Ro(e){var r={};return e[e.length-1]==="r"?r.roundingPriority="morePrecision":e[e.length-1]==="s"&&(r.roundingPriority="lessPrecision"),e.replace(Io,function(t,i,a){return typeof a!="string"?(r.minimumSignificantDigits=i.length,r.maximumSignificantDigits=i.length):a==="+"?r.minimumSignificantDigits=i.length:i[0]==="#"?r.maximumSignificantDigits=i.length:(r.minimumSignificantDigits=i.length,r.maximumSignificantDigits=i.length+(typeof a=="string"?a.length:0)),""}),r}function Ho(e){switch(e){case"sign-auto":return{signDisplay:"auto"};case"sign-accounting":case"()":return{currencySign:"accounting"};case"sign-always":case"+!":return{signDisplay:"always"};case"sign-accounting-always":case"()!":return{signDisplay:"always",currencySign:"accounting"};case"sign-except-zero":case"+?":return{signDisplay:"exceptZero"};case"sign-accounting-except-zero":case"()?":return{signDisplay:"exceptZero",currencySign:"accounting"};case"sign-never":case"+_":return{signDisplay:"never"}}}function Gl(e){var r;if(e[0]==="E"&&e[1]==="E"?(r={notation:"engineering"},e=e.slice(2)):e[0]==="E"&&(r={notation:"scientific"},e=e.slice(1)),r){var t=e.slice(0,2);if(t==="+!"?(r.signDisplay="always",e=e.slice(2)):t==="+?"&&(r.signDisplay="exceptZero",e=e.slice(2)),!Do.test(e))throw new Error("Malformed concise eng/scientific notation");r.minimumIntegerDigits=e.length}return r}function Oo(e){var r={},t=Ho(e);return t||r}function Bo(e){for(var r={},t=0,i=e;t<i.length;t++){var a=i[t];switch(a.stem){case"percent":case"%":r.style="percent";continue;case"%x100":r.style="percent",r.scale=100;continue;case"currency":r.style="currency",r.currency=a.options[0];continue;case"group-off":case",_":r.useGrouping=!1;continue;case"precision-integer":case".":r.maximumFractionDigits=0;continue;case"measure-unit":case"unit":r.style="unit",r.unit=Ul(a.options[0]);continue;case"compact-short":case"K":r.notation="compact",r.compactDisplay="short";continue;case"compact-long":case"KK":r.notation="compact",r.compactDisplay="long";continue;case"scientific":r=P(P(P({},r),{notation:"scientific"}),a.options.reduce(function(c,l){return P(P({},c),Oo(l))},{}));continue;case"engineering":r=P(P(P({},r),{notation:"engineering"}),a.options.reduce(function(c,l){return P(P({},c),Oo(l))},{}));continue;case"notation-simple":r.notation="standard";continue;case"unit-width-narrow":r.currencyDisplay="narrowSymbol",r.unitDisplay="narrow";continue;case"unit-width-short":r.currencyDisplay="code",r.unitDisplay="short";continue;case"unit-width-full-name":r.currencyDisplay="name",r.unitDisplay="long";continue;case"unit-width-iso-code":r.currencyDisplay="symbol";continue;case"scale":r.scale=parseFloat(a.options[0]);continue;case"integer-width":if(a.options.length>1)throw new RangeError("integer-width stems only accept a single optional option");a.options[0].replace($l,function(c,l,d,h,m,p){if(l)r.minimumIntegerDigits=d.length;else{if(h&&m)throw new Error("We currently do not support maximum integer digits");if(p)throw new Error("We currently do not support exact integer digits")}return""});continue}if(Do.test(a.stem)){r.minimumIntegerDigits=a.stem.length;continue}if(zo.test(a.stem)){if(a.options.length>1)throw new RangeError("Fraction-precision stems only accept a single optional option");a.stem.replace(zo,function(c,l,d,h,m,p){return d==="*"?r.minimumFractionDigits=l.length:h&&h[0]==="#"?r.maximumFractionDigits=h.length:m&&p?(r.minimumFractionDigits=m.length,r.maximumFractionDigits=m.length+p.length):(r.minimumFractionDigits=l.length,r.maximumFractionDigits=l.length),""});var n=a.options[0];n==="w"?r=P(P({},r),{trailingZeroDisplay:"stripIfInteger"}):n&&(r=P(P({},r),Ro(n)));continue}if(Io.test(a.stem)){r=P(P({},r),Ro(a.stem));continue}var o=Ho(a.stem);o&&(r=P(P({},r),o));var s=Gl(a.stem);s&&(r=P(P({},r),s))}return r}var Xt={AX:["H"],BQ:["H"],CP:["H"],CZ:["H"],DK:["H"],FI:["H"],ID:["H"],IS:["H"],ML:["H"],NE:["H"],RU:["H"],SE:["H"],SJ:["H"],SK:["H"],AS:["h","H"],BT:["h","H"],DJ:["h","H"],ER:["h","H"],GH:["h","H"],IN:["h","H"],LS:["h","H"],PG:["h","H"],PW:["h","H"],SO:["h","H"],TO:["h","H"],VU:["h","H"],WS:["h","H"],"001":["H","h"],AL:["h","H","hB"],TD:["h","H","hB"],"ca-ES":["H","h","hB"],CF:["H","h","hB"],CM:["H","h","hB"],"fr-CA":["H","h","hB"],"gl-ES":["H","h","hB"],"it-CH":["H","h","hB"],"it-IT":["H","h","hB"],LU:["H","h","hB"],NP:["H","h","hB"],PF:["H","h","hB"],SC:["H","h","hB"],SM:["H","h","hB"],SN:["H","h","hB"],TF:["H","h","hB"],VA:["H","h","hB"],CY:["h","H","hb","hB"],GR:["h","H","hb","hB"],CO:["h","H","hB","hb"],DO:["h","H","hB","hb"],KP:["h","H","hB","hb"],KR:["h","H","hB","hb"],NA:["h","H","hB","hb"],PA:["h","H","hB","hb"],PR:["h","H","hB","hb"],VE:["h","H","hB","hb"],AC:["H","h","hb","hB"],AI:["H","h","hb","hB"],BW:["H","h","hb","hB"],BZ:["H","h","hb","hB"],CC:["H","h","hb","hB"],CK:["H","h","hb","hB"],CX:["H","h","hb","hB"],DG:["H","h","hb","hB"],FK:["H","h","hb","hB"],GB:["H","h","hb","hB"],GG:["H","h","hb","hB"],GI:["H","h","hb","hB"],IE:["H","h","hb","hB"],IM:["H","h","hb","hB"],IO:["H","h","hb","hB"],JE:["H","h","hb","hB"],LT:["H","h","hb","hB"],MK:["H","h","hb","hB"],MN:["H","h","hb","hB"],MS:["H","h","hb","hB"],NF:["H","h","hb","hB"],NG:["H","h","hb","hB"],NR:["H","h","hb","hB"],NU:["H","h","hb","hB"],PN:["H","h","hb","hB"],SH:["H","h","hb","hB"],SX:["H","h","hb","hB"],TA:["H","h","hb","hB"],ZA:["H","h","hb","hB"],"af-ZA":["H","h","hB","hb"],AR:["H","h","hB","hb"],CL:["H","h","hB","hb"],CR:["H","h","hB","hb"],CU:["H","h","hB","hb"],EA:["H","h","hB","hb"],"es-BO":["H","h","hB","hb"],"es-BR":["H","h","hB","hb"],"es-EC":["H","h","hB","hb"],"es-ES":["H","h","hB","hb"],"es-GQ":["H","h","hB","hb"],"es-PE":["H","h","hB","hb"],GT:["H","h","hB","hb"],HN:["H","h","hB","hb"],IC:["H","h","hB","hb"],KG:["H","h","hB","hb"],KM:["H","h","hB","hb"],LK:["H","h","hB","hb"],MA:["H","h","hB","hb"],MX:["H","h","hB","hb"],NI:["H","h","hB","hb"],PY:["H","h","hB","hb"],SV:["H","h","hB","hb"],UY:["H","h","hB","hb"],JP:["H","h","K"],AD:["H","hB"],AM:["H","hB"],AO:["H","hB"],AT:["H","hB"],AW:["H","hB"],BE:["H","hB"],BF:["H","hB"],BJ:["H","hB"],BL:["H","hB"],BR:["H","hB"],CG:["H","hB"],CI:["H","hB"],CV:["H","hB"],DE:["H","hB"],EE:["H","hB"],FR:["H","hB"],GA:["H","hB"],GF:["H","hB"],GN:["H","hB"],GP:["H","hB"],GW:["H","hB"],HR:["H","hB"],IL:["H","hB"],IT:["H","hB"],KZ:["H","hB"],MC:["H","hB"],MD:["H","hB"],MF:["H","hB"],MQ:["H","hB"],MZ:["H","hB"],NC:["H","hB"],NL:["H","hB"],PM:["H","hB"],PT:["H","hB"],RE:["H","hB"],RO:["H","hB"],SI:["H","hB"],SR:["H","hB"],ST:["H","hB"],TG:["H","hB"],TR:["H","hB"],WF:["H","hB"],YT:["H","hB"],BD:["h","hB","H"],PK:["h","hB","H"],AZ:["H","hB","h"],BA:["H","hB","h"],BG:["H","hB","h"],CH:["H","hB","h"],GE:["H","hB","h"],LI:["H","hB","h"],ME:["H","hB","h"],RS:["H","hB","h"],UA:["H","hB","h"],UZ:["H","hB","h"],XK:["H","hB","h"],AG:["h","hb","H","hB"],AU:["h","hb","H","hB"],BB:["h","hb","H","hB"],BM:["h","hb","H","hB"],BS:["h","hb","H","hB"],CA:["h","hb","H","hB"],DM:["h","hb","H","hB"],"en-001":["h","hb","H","hB"],FJ:["h","hb","H","hB"],FM:["h","hb","H","hB"],GD:["h","hb","H","hB"],GM:["h","hb","H","hB"],GU:["h","hb","H","hB"],GY:["h","hb","H","hB"],JM:["h","hb","H","hB"],KI:["h","hb","H","hB"],KN:["h","hb","H","hB"],KY:["h","hb","H","hB"],LC:["h","hb","H","hB"],LR:["h","hb","H","hB"],MH:["h","hb","H","hB"],MP:["h","hb","H","hB"],MW:["h","hb","H","hB"],NZ:["h","hb","H","hB"],SB:["h","hb","H","hB"],SG:["h","hb","H","hB"],SL:["h","hb","H","hB"],SS:["h","hb","H","hB"],SZ:["h","hb","H","hB"],TC:["h","hb","H","hB"],TT:["h","hb","H","hB"],UM:["h","hb","H","hB"],US:["h","hb","H","hB"],VC:["h","hb","H","hB"],VG:["h","hb","H","hB"],VI:["h","hb","H","hB"],ZM:["h","hb","H","hB"],BO:["H","hB","h","hb"],EC:["H","hB","h","hb"],ES:["H","hB","h","hb"],GQ:["H","hB","h","hb"],PE:["H","hB","h","hb"],AE:["h","hB","hb","H"],"ar-001":["h","hB","hb","H"],BH:["h","hB","hb","H"],DZ:["h","hB","hb","H"],EG:["h","hB","hb","H"],EH:["h","hB","hb","H"],HK:["h","hB","hb","H"],IQ:["h","hB","hb","H"],JO:["h","hB","hb","H"],KW:["h","hB","hb","H"],LB:["h","hB","hb","H"],LY:["h","hB","hb","H"],MO:["h","hB","hb","H"],MR:["h","hB","hb","H"],OM:["h","hB","hb","H"],PH:["h","hB","hb","H"],PS:["h","hB","hb","H"],QA:["h","hB","hb","H"],SA:["h","hB","hb","H"],SD:["h","hB","hb","H"],SY:["h","hB","hb","H"],TN:["h","hB","hb","H"],YE:["h","hB","hb","H"],AF:["H","hb","hB","h"],LA:["H","hb","hB","h"],CN:["H","hB","hb","h"],LV:["H","hB","hb","h"],TL:["H","hB","hb","h"],"zu-ZA":["H","hB","hb","h"],CD:["hB","H"],IR:["hB","H"],"hi-IN":["hB","h","H"],"kn-IN":["hB","h","H"],"ml-IN":["hB","h","H"],"te-IN":["hB","h","H"],KH:["hB","h","H","hb"],"ta-IN":["hB","h","hb","H"],BN:["hb","hB","h","H"],MY:["hb","hB","h","H"],ET:["hB","hb","h","H"],"gu-IN":["hB","hb","h","H"],"mr-IN":["hB","hb","h","H"],"pa-IN":["hB","hb","h","H"],TW:["hB","hb","h","H"],KE:["hB","hb","H","h"],MM:["hB","hb","H","h"],TZ:["hB","hb","H","h"],UG:["hB","hb","H","h"]};function Fo(e,r){for(var t="",i=0;i<e.length;i++){var a=e.charAt(i);if(a==="j"){for(var n=0;i+1<e.length&&e.charAt(i+1)===a;)n++,i++;var o=1+(n&1),s=n<2?1:3+(n>>1),c="a",l=ql(r);for((l=="H"||l=="k")&&(s=0);s-- >0;)t+=c;for(;o-- >0;)t=l+t}else a==="J"?t+="H":t+=a}return t}function ql(e){var r=e.hourCycle;if(r===void 0&&e.hourCycles&&e.hourCycles.length&&(r=e.hourCycles[0]),r)switch(r){case"h24":return"k";case"h23":return"H";case"h12":return"h";case"h11":return"K";default:throw new Error("Invalid hourCycle")}var t=e.language,i;t!=="root"&&(i=e.maximize().region);var a=Xt[i||""]||Xt[t||""]||Xt["".concat(t,"-001")]||Xt["001"];return a[0]}var da,Vl=new RegExp("^".concat(la.source,"*")),jl=new RegExp("".concat(la.source,"*$"));function L(e,r){return{start:e,end:r}}var Wl=!!String.prototype.startsWith,Yl=!!String.fromCodePoint,Xl=!!Object.fromEntries,Kl=!!String.prototype.codePointAt,Zl=!!String.prototype.trimStart,Ql=!!String.prototype.trimEnd,Jl=!!Number.isSafeInteger,ed=Jl?Number.isSafeInteger:function(e){return typeof e=="number"&&isFinite(e)&&Math.floor(e)===e&&Math.abs(e)<=9007199254740991},pa=!0;try{Uo=Vo("([^\\p{White_Space}\\p{Pattern_Syntax}]*)","yu"),pa=((da=Uo.exec("a"))===null||da===void 0?void 0:da[0])==="a"}catch{pa=!1}var Uo,$o=Wl?function(r,t,i){return r.startsWith(t,i)}:function(r,t,i){return r.slice(i,i+t.length)===t},ma=Yl?String.fromCodePoint:function(){for(var r=[],t=0;t<arguments.length;t++)r[t]=arguments[t];for(var i="",a=r.length,n=0,o;a>n;){if(o=r[n++],o>1114111)throw RangeError(o+" is not a valid code point");i+=o<65536?String.fromCharCode(o):String.fromCharCode(((o-=65536)>>10)+55296,o%1024+56320)}return i},Go=Xl?Object.fromEntries:function(r){for(var t={},i=0,a=r;i<a.length;i++){var n=a[i],o=n[0],s=n[1];t[o]=s}return t},qo=Kl?function(r,t){return r.codePointAt(t)}:function(r,t){var i=r.length;if(!(t<0||t>=i)){var a=r.charCodeAt(t),n;return a<55296||a>56319||t+1===i||(n=r.charCodeAt(t+1))<56320||n>57343?a:(a-55296<<10)+(n-56320)+65536}},td=Zl?function(r){return r.trimStart()}:function(r){return r.replace(Vl,"")},rd=Ql?function(r){return r.trimEnd()}:function(r){return r.replace(jl,"")};function Vo(e,r){return new RegExp(e,r)}var ua;pa?(ha=Vo("([^\\p{White_Space}\\p{Pattern_Syntax}]*)","yu"),ua=function(r,t){var i;ha.lastIndex=t;var a=ha.exec(r);return(i=a[1])!==null&&i!==void 0?i:""}):ua=function(r,t){for(var i=[];;){var a=qo(r,t);if(a===void 0||Wo(a)||nd(a))break;i.push(a),t+=a>=65536?2:1}return ma.apply(void 0,i)};var ha,jo=function(){function e(r,t){t===void 0&&(t={}),this.message=r,this.position={offset:0,line:1,column:1},this.ignoreTag=!!t.ignoreTag,this.locale=t.locale,this.requiresOtherClause=!!t.requiresOtherClause,this.shouldParseSkeletons=!!t.shouldParseSkeletons}return e.prototype.parse=function(){if(this.offset()!==0)throw Error("parser can only be used once");return this.parseMessage(0,"",!1)},e.prototype.parseMessage=function(r,t,i){for(var a=[];!this.isEOF();){var n=this.char();if(n===123){var o=this.parseArgument(r,i);if(o.err)return o;a.push(o.val)}else{if(n===125&&r>0)break;if(n===35&&(t==="plural"||t==="selectordinal")){var s=this.clonePosition();this.bump(),a.push({type:H.pound,location:L(s,this.clonePosition())})}else if(n===60&&!this.ignoreTag&&this.peek()===47){if(i)break;return this.error(A.UNMATCHED_CLOSING_TAG,L(this.clonePosition(),this.clonePosition()))}else if(n===60&&!this.ignoreTag&&ga(this.peek()||0)){var o=this.parseTag(r,t);if(o.err)return o;a.push(o.val)}else{var o=this.parseLiteral(r,t);if(o.err)return o;a.push(o.val)}}}return{val:a,err:null}},e.prototype.parseTag=function(r,t){var i=this.clonePosition();this.bump();var a=this.parseTagName();if(this.bumpSpace(),this.bumpIf("/>"))return{val:{type:H.literal,value:"<".concat(a,"/>"),location:L(i,this.clonePosition())},err:null};if(this.bumpIf(">")){var n=this.parseMessage(r+1,t,!0);if(n.err)return n;var o=n.val,s=this.clonePosition();if(this.bumpIf("</")){if(this.isEOF()||!ga(this.char()))return this.error(A.INVALID_TAG,L(s,this.clonePosition()));var c=this.clonePosition(),l=this.parseTagName();return a!==l?this.error(A.UNMATCHED_CLOSING_TAG,L(c,this.clonePosition())):(this.bumpSpace(),this.bumpIf(">")?{val:{type:H.tag,value:a,children:o,location:L(i,this.clonePosition())},err:null}:this.error(A.INVALID_TAG,L(s,this.clonePosition())))}else return this.error(A.UNCLOSED_TAG,L(i,this.clonePosition()))}else return this.error(A.INVALID_TAG,L(i,this.clonePosition()))},e.prototype.parseTagName=function(){var r=this.offset();for(this.bump();!this.isEOF()&&ad(this.char());)this.bump();return this.message.slice(r,this.offset())},e.prototype.parseLiteral=function(r,t){for(var i=this.clonePosition(),a="";;){var n=this.tryParseQuote(t);if(n){a+=n;continue}var o=this.tryParseUnquoted(r,t);if(o){a+=o;continue}var s=this.tryParseLeftAngleBracket();if(s){a+=s;continue}break}var c=L(i,this.clonePosition());return{val:{type:H.literal,value:a,location:c},err:null}},e.prototype.tryParseLeftAngleBracket=function(){return!this.isEOF()&&this.char()===60&&(this.ignoreTag||!id(this.peek()||0))?(this.bump(),"<"):null},e.prototype.tryParseQuote=function(r){if(this.isEOF()||this.char()!==39)return null;switch(this.peek()){case 39:return this.bump(),this.bump(),"'";case 123:case 60:case 62:case 125:break;case 35:if(r==="plural"||r==="selectordinal")break;return null;default:return null}this.bump();var t=[this.char()];for(this.bump();!this.isEOF();){var i=this.char();if(i===39)if(this.peek()===39)t.push(39),this.bump();else{this.bump();break}else t.push(i);this.bump()}return ma.apply(void 0,t)},e.prototype.tryParseUnquoted=function(r,t){if(this.isEOF())return null;var i=this.char();return i===60||i===123||i===35&&(t==="plural"||t==="selectordinal")||i===125&&r>0?null:(this.bump(),ma(i))},e.prototype.parseArgument=function(r,t){var i=this.clonePosition();if(this.bump(),this.bumpSpace(),this.isEOF())return this.error(A.EXPECT_ARGUMENT_CLOSING_BRACE,L(i,this.clonePosition()));if(this.char()===125)return this.bump(),this.error(A.EMPTY_ARGUMENT,L(i,this.clonePosition()));var a=this.parseIdentifierIfPossible().value;if(!a)return this.error(A.MALFORMED_ARGUMENT,L(i,this.clonePosition()));if(this.bumpSpace(),this.isEOF())return this.error(A.EXPECT_ARGUMENT_CLOSING_BRACE,L(i,this.clonePosition()));switch(this.char()){case 125:return this.bump(),{val:{type:H.argument,value:a,location:L(i,this.clonePosition())},err:null};case 44:return this.bump(),this.bumpSpace(),this.isEOF()?this.error(A.EXPECT_ARGUMENT_CLOSING_BRACE,L(i,this.clonePosition())):this.parseArgumentOptions(r,t,a,i);default:return this.error(A.MALFORMED_ARGUMENT,L(i,this.clonePosition()))}},e.prototype.parseIdentifierIfPossible=function(){var r=this.clonePosition(),t=this.offset(),i=ua(this.message,t),a=t+i.length;this.bumpTo(a);var n=this.clonePosition(),o=L(r,n);return{value:i,location:o}},e.prototype.parseArgumentOptions=function(r,t,i,a){var n,o=this.clonePosition(),s=this.parseIdentifierIfPossible().value,c=this.clonePosition();switch(s){case"":return this.error(A.EXPECT_ARGUMENT_TYPE,L(o,c));case"number":case"date":case"time":{this.bumpSpace();var l=null;if(this.bumpIf(",")){this.bumpSpace();var d=this.clonePosition(),h=this.parseSimpleArgStyleIfPossible();if(h.err)return h;var m=rd(h.val);if(m.length===0)return this.error(A.EXPECT_ARGUMENT_STYLE,L(this.clonePosition(),this.clonePosition()));var p=L(d,this.clonePosition());l={style:m,styleLocation:p}}var g=this.tryParseArgumentClose(a);if(g.err)return g;var f=L(a,this.clonePosition());if(l&&$o(l?.style,"::",0)){var x=td(l.style.slice(2));if(s==="number"){var h=this.parseNumberSkeletonFromString(x,l.styleLocation);return h.err?h:{val:{type:H.number,value:i,location:f,style:h.val},err:null}}else{if(x.length===0)return this.error(A.EXPECT_DATE_TIME_SKELETON,f);var y=x;this.locale&&(y=Fo(x,this.locale));var m={type:Qe.dateTime,pattern:y,location:l.styleLocation,parsedOptions:this.shouldParseSkeletons?Lo(y):{}},O=s==="date"?H.date:H.time;return{val:{type:O,value:i,location:f,style:m},err:null}}}return{val:{type:s==="number"?H.number:s==="date"?H.date:H.time,value:i,location:f,style:(n=l?.style)!==null&&n!==void 0?n:null},err:null}}case"plural":case"selectordinal":case"select":{var b=this.clonePosition();if(this.bumpSpace(),!this.bumpIf(","))return this.error(A.EXPECT_SELECT_ARGUMENT_OPTIONS,L(b,P({},b)));this.bumpSpace();var T=this.parseIdentifierIfPossible(),M=0;if(s!=="select"&&T.value==="offset"){if(!this.bumpIf(":"))return this.error(A.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE,L(this.clonePosition(),this.clonePosition()));this.bumpSpace();var h=this.tryParseDecimalInteger(A.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE,A.INVALID_PLURAL_ARGUMENT_OFFSET_VALUE);if(h.err)return h;this.bumpSpace(),T=this.parseIdentifierIfPossible(),M=h.val}var I=this.tryParsePluralOrSelectOptions(r,s,t,T);if(I.err)return I;var g=this.tryParseArgumentClose(a);if(g.err)return g;var F=L(a,this.clonePosition());return s==="select"?{val:{type:H.select,value:i,options:Go(I.val),location:F},err:null}:{val:{type:H.plural,value:i,options:Go(I.val),offset:M,pluralType:s==="plural"?"cardinal":"ordinal",location:F},err:null}}default:return this.error(A.INVALID_ARGUMENT_TYPE,L(o,c))}},e.prototype.tryParseArgumentClose=function(r){return this.isEOF()||this.char()!==125?this.error(A.EXPECT_ARGUMENT_CLOSING_BRACE,L(r,this.clonePosition())):(this.bump(),{val:!0,err:null})},e.prototype.parseSimpleArgStyleIfPossible=function(){for(var r=0,t=this.clonePosition();!this.isEOF();){var i=this.char();switch(i){case 39:{this.bump();var a=this.clonePosition();if(!this.bumpUntil("'"))return this.error(A.UNCLOSED_QUOTE_IN_ARGUMENT_STYLE,L(a,this.clonePosition()));this.bump();break}case 123:{r+=1,this.bump();break}case 125:{if(r>0)r-=1;else return{val:this.message.slice(t.offset,this.offset()),err:null};break}default:this.bump();break}}return{val:this.message.slice(t.offset,this.offset()),err:null}},e.prototype.parseNumberSkeletonFromString=function(r,t){var i=[];try{i=No(r)}catch{return this.error(A.INVALID_NUMBER_SKELETON,t)}return{val:{type:Qe.number,tokens:i,location:t,parsedOptions:this.shouldParseSkeletons?Bo(i):{}},err:null}},e.prototype.tryParsePluralOrSelectOptions=function(r,t,i,a){for(var n,o=!1,s=[],c=new Set,l=a.value,d=a.location;;){if(l.length===0){var h=this.clonePosition();if(t!=="select"&&this.bumpIf("=")){var m=this.tryParseDecimalInteger(A.EXPECT_PLURAL_ARGUMENT_SELECTOR,A.INVALID_PLURAL_ARGUMENT_SELECTOR);if(m.err)return m;d=L(h,this.clonePosition()),l=this.message.slice(h.offset,this.offset())}else break}if(c.has(l))return this.error(t==="select"?A.DUPLICATE_SELECT_ARGUMENT_SELECTOR:A.DUPLICATE_PLURAL_ARGUMENT_SELECTOR,d);l==="other"&&(o=!0),this.bumpSpace();var p=this.clonePosition();if(!this.bumpIf("{"))return this.error(t==="select"?A.EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT:A.EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT,L(this.clonePosition(),this.clonePosition()));var g=this.parseMessage(r+1,t,i);if(g.err)return g;var f=this.tryParseArgumentClose(p);if(f.err)return f;s.push([l,{value:g.val,location:L(p,this.clonePosition())}]),c.add(l),this.bumpSpace(),n=this.parseIdentifierIfPossible(),l=n.value,d=n.location}return s.length===0?this.error(t==="select"?A.EXPECT_SELECT_ARGUMENT_SELECTOR:A.EXPECT_PLURAL_ARGUMENT_SELECTOR,L(this.clonePosition(),this.clonePosition())):this.requiresOtherClause&&!o?this.error(A.MISSING_OTHER_CLAUSE,L(this.clonePosition(),this.clonePosition())):{val:s,err:null}},e.prototype.tryParseDecimalInteger=function(r,t){var i=1,a=this.clonePosition();this.bumpIf("+")||this.bumpIf("-")&&(i=-1);for(var n=!1,o=0;!this.isEOF();){var s=this.char();if(s>=48&&s<=57)n=!0,o=o*10+(s-48),this.bump();else break}var c=L(a,this.clonePosition());return n?(o*=i,ed(o)?{val:o,err:null}:this.error(t,c)):this.error(r,c)},e.prototype.offset=function(){return this.position.offset},e.prototype.isEOF=function(){return this.offset()===this.message.length},e.prototype.clonePosition=function(){return{offset:this.position.offset,line:this.position.line,column:this.position.column}},e.prototype.char=function(){var r=this.position.offset;if(r>=this.message.length)throw Error("out of bound");var t=qo(this.message,r);if(t===void 0)throw Error("Offset ".concat(r," is at invalid UTF-16 code unit boundary"));return t},e.prototype.error=function(r,t){return{val:null,err:{kind:r,message:this.message,location:t}}},e.prototype.bump=function(){if(!this.isEOF()){var r=this.char();r===10?(this.position.line+=1,this.position.column=1,this.position.offset+=1):(this.position.column+=1,this.position.offset+=r<65536?1:2)}},e.prototype.bumpIf=function(r){if($o(this.message,r,this.offset())){for(var t=0;t<r.length;t++)this.bump();return!0}return!1},e.prototype.bumpUntil=function(r){var t=this.offset(),i=this.message.indexOf(r,t);return i>=0?(this.bumpTo(i),!0):(this.bumpTo(this.message.length),!1)},e.prototype.bumpTo=function(r){if(this.offset()>r)throw Error("targetOffset ".concat(r," must be greater than or equal to the current offset ").concat(this.offset()));for(r=Math.min(r,this.message.length);;){var t=this.offset();if(t===r)break;if(t>r)throw Error("targetOffset ".concat(r," is at invalid UTF-16 code unit boundary"));if(this.bump(),this.isEOF())break}},e.prototype.bumpSpace=function(){for(;!this.isEOF()&&Wo(this.char());)this.bump()},e.prototype.peek=function(){if(this.isEOF())return null;var r=this.char(),t=this.offset(),i=this.message.charCodeAt(t+(r>=65536?2:1));return i??null},e}();function ga(e){return e>=97&&e<=122||e>=65&&e<=90}function id(e){return ga(e)||e===47}function ad(e){return e===45||e===46||e>=48&&e<=57||e===95||e>=97&&e<=122||e>=65&&e<=90||e==183||e>=192&&e<=214||e>=216&&e<=246||e>=248&&e<=893||e>=895&&e<=8191||e>=8204&&e<=8205||e>=8255&&e<=8256||e>=8304&&e<=8591||e>=11264&&e<=12271||e>=12289&&e<=55295||e>=63744&&e<=64975||e>=65008&&e<=65533||e>=65536&&e<=983039}function Wo(e){return e>=9&&e<=13||e===32||e===133||e>=8206&&e<=8207||e===8232||e===8233}function nd(e){return e>=33&&e<=35||e===36||e>=37&&e<=39||e===40||e===41||e===42||e===43||e===44||e===45||e>=46&&e<=47||e>=58&&e<=59||e>=60&&e<=62||e>=63&&e<=64||e===91||e===92||e===93||e===94||e===96||e===123||e===124||e===125||e===126||e===161||e>=162&&e<=165||e===166||e===167||e===169||e===171||e===172||e===174||e===176||e===177||e===182||e===187||e===191||e===215||e===247||e>=8208&&e<=8213||e>=8214&&e<=8215||e===8216||e===8217||e===8218||e>=8219&&e<=8220||e===8221||e===8222||e===8223||e>=8224&&e<=8231||e>=8240&&e<=8248||e===8249||e===8250||e>=8251&&e<=8254||e>=8257&&e<=8259||e===8260||e===8261||e===8262||e>=8263&&e<=8273||e===8274||e===8275||e>=8277&&e<=8286||e>=8592&&e<=8596||e>=8597&&e<=8601||e>=8602&&e<=8603||e>=8604&&e<=8607||e===8608||e>=8609&&e<=8610||e===8611||e>=8612&&e<=8613||e===8614||e>=8615&&e<=8621||e===8622||e>=8623&&e<=8653||e>=8654&&e<=8655||e>=8656&&e<=8657||e===8658||e===8659||e===8660||e>=8661&&e<=8691||e>=8692&&e<=8959||e>=8960&&e<=8967||e===8968||e===8969||e===8970||e===8971||e>=8972&&e<=8991||e>=8992&&e<=8993||e>=8994&&e<=9e3||e===9001||e===9002||e>=9003&&e<=9083||e===9084||e>=9085&&e<=9114||e>=9115&&e<=9139||e>=9140&&e<=9179||e>=9180&&e<=9185||e>=9186&&e<=9254||e>=9255&&e<=9279||e>=9280&&e<=9290||e>=9291&&e<=9311||e>=9472&&e<=9654||e===9655||e>=9656&&e<=9664||e===9665||e>=9666&&e<=9719||e>=9720&&e<=9727||e>=9728&&e<=9838||e===9839||e>=9840&&e<=10087||e===10088||e===10089||e===10090||e===10091||e===10092||e===10093||e===10094||e===10095||e===10096||e===10097||e===10098||e===10099||e===10100||e===10101||e>=10132&&e<=10175||e>=10176&&e<=10180||e===10181||e===10182||e>=10183&&e<=10213||e===10214||e===10215||e===10216||e===10217||e===10218||e===10219||e===10220||e===10221||e===10222||e===10223||e>=10224&&e<=10239||e>=10240&&e<=10495||e>=10496&&e<=10626||e===10627||e===10628||e===10629||e===10630||e===10631||e===10632||e===10633||e===10634||e===10635||e===10636||e===10637||e===10638||e===10639||e===10640||e===10641||e===10642||e===10643||e===10644||e===10645||e===10646||e===10647||e===10648||e>=10649&&e<=10711||e===10712||e===10713||e===10714||e===10715||e>=10716&&e<=10747||e===10748||e===10749||e>=10750&&e<=11007||e>=11008&&e<=11055||e>=11056&&e<=11076||e>=11077&&e<=11078||e>=11079&&e<=11084||e>=11085&&e<=11123||e>=11124&&e<=11125||e>=11126&&e<=11157||e===11158||e>=11159&&e<=11263||e>=11776&&e<=11777||e===11778||e===11779||e===11780||e===11781||e>=11782&&e<=11784||e===11785||e===11786||e===11787||e===11788||e===11789||e>=11790&&e<=11798||e===11799||e>=11800&&e<=11801||e===11802||e===11803||e===11804||e===11805||e>=11806&&e<=11807||e===11808||e===11809||e===11810||e===11811||e===11812||e===11813||e===11814||e===11815||e===11816||e===11817||e>=11818&&e<=11822||e===11823||e>=11824&&e<=11833||e>=11834&&e<=11835||e>=11836&&e<=11839||e===11840||e===11841||e===11842||e>=11843&&e<=11855||e>=11856&&e<=11857||e===11858||e>=11859&&e<=11903||e>=12289&&e<=12291||e===12296||e===12297||e===12298||e===12299||e===12300||e===12301||e===12302||e===12303||e===12304||e===12305||e>=12306&&e<=12307||e===12308||e===12309||e===12310||e===12311||e===12312||e===12313||e===12314||e===12315||e===12316||e===12317||e>=12318&&e<=12319||e===12320||e===12336||e===64830||e===64831||e>=65093&&e<=65094}function fa(e){e.forEach(function(r){if(delete r.location,Gr(r)||qr(r))for(var t in r.options)delete r.options[t].location,fa(r.options[t].value);else Fr(r)&&jr(r.style)||(Ur(r)||$r(r))&&Yt(r.style)?delete r.style.location:Vr(r)&&fa(r.children)})}function Yo(e,r){r===void 0&&(r={}),r=P({shouldParseSkeletons:!0,requiresOtherClause:!0},r);var t=new jo(e,r).parse();if(t.err){var i=SyntaxError(A[t.err.kind]);throw i.location=t.err.location,i.originalMessage=t.err.message,i}return r?.captureLocation||fa(t.val),t.val}function Kt(e,r){var t=r&&r.cache?r.cache:hd,i=r&&r.serializer?r.serializer:dd,a=r&&r.strategy?r.strategy:sd;return a(e,{cache:t,serializer:i})}function od(e){return e==null||typeof e=="number"||typeof e=="boolean"}function Xo(e,r,t,i){var a=od(i)?i:t(i),n=r.get(a);return typeof n>"u"&&(n=e.call(this,i),r.set(a,n)),n}function Ko(e,r,t){var i=Array.prototype.slice.call(arguments,3),a=t(i),n=r.get(a);return typeof n>"u"&&(n=e.apply(this,i),r.set(a,n)),n}function va(e,r,t,i,a){return t.bind(r,e,i,a)}function sd(e,r){var t=e.length===1?Xo:Ko;return va(e,this,t,r.cache.create(),r.serializer)}function cd(e,r){return va(e,this,Ko,r.cache.create(),r.serializer)}function ld(e,r){return va(e,this,Xo,r.cache.create(),r.serializer)}var dd=function(){return JSON.stringify(arguments)};function xa(){this.cache=Object.create(null)}xa.prototype.get=function(e){return this.cache[e]};xa.prototype.set=function(e,r){this.cache[e]=r};var hd={create:function(){return new xa}},Wr={variadic:cd,monadic:ld};var Je;(function(e){e.MISSING_VALUE="MISSING_VALUE",e.INVALID_VALUE="INVALID_VALUE",e.MISSING_INTL_API="MISSING_INTL_API"})(Je||(Je={}));var Zt=function(e){Wt(r,e);function r(t,i,a){var n=e.call(this,t)||this;return n.code=i,n.originalMessage=a,n}return r.prototype.toString=function(){return"[formatjs Error: ".concat(this.code,"] ").concat(this.message)},r}(Error);var ba=function(e){Wt(r,e);function r(t,i,a,n){return e.call(this,'Invalid values for "'.concat(t,'": "').concat(i,'". Options are "').concat(Object.keys(a).join('", "'),'"'),Je.INVALID_VALUE,n)||this}return r}(Zt);var Zo=function(e){Wt(r,e);function r(t,i,a){return e.call(this,'Value for "'.concat(t,'" must be of type ').concat(i),Je.INVALID_VALUE,a)||this}return r}(Zt);var Qo=function(e){Wt(r,e);function r(t,i){return e.call(this,'The intl string context variable "'.concat(t,'" was not provided to the string "').concat(i,'"'),Je.MISSING_VALUE,i)||this}return r}(Zt);var Z;(function(e){e[e.literal=0]="literal",e[e.object=1]="object"})(Z||(Z={}));function pd(e){return e.length<2?e:e.reduce(function(r,t){var i=r[r.length-1];return!i||i.type!==Z.literal||t.type!==Z.literal?r.push(t):i.value+=t.value,r},[])}function md(e){return typeof e=="function"}function Qt(e,r,t,i,a,n,o){if(e.length===1&&ca(e[0]))return[{type:Z.literal,value:e[0].value}];for(var s=[],c=0,l=e;c<l.length;c++){var d=l[c];if(ca(d)){s.push({type:Z.literal,value:d.value});continue}if(Po(d)){typeof n=="number"&&s.push({type:Z.literal,value:t.getNumberFormat(r).format(n)});continue}var h=d.value;if(!(a&&h in a))throw new Qo(h,o);var m=a[h];if(_o(d)){(!m||typeof m=="string"||typeof m=="number")&&(m=typeof m=="string"||typeof m=="number"?String(m):""),s.push({type:typeof m=="string"?Z.literal:Z.object,value:m});continue}if(Ur(d)){var p=typeof d.style=="string"?i.date[d.style]:Yt(d.style)?d.style.parsedOptions:void 0;s.push({type:Z.literal,value:t.getDateTimeFormat(r,p).format(m)});continue}if($r(d)){var p=typeof d.style=="string"?i.time[d.style]:Yt(d.style)?d.style.parsedOptions:i.time.medium;s.push({type:Z.literal,value:t.getDateTimeFormat(r,p).format(m)});continue}if(Fr(d)){var p=typeof d.style=="string"?i.number[d.style]:jr(d.style)?d.style.parsedOptions:void 0;p&&p.scale&&(m=m*(p.scale||1)),s.push({type:Z.literal,value:t.getNumberFormat(r,p).format(m)});continue}if(Vr(d)){var g=d.children,f=d.value,x=a[f];if(!md(x))throw new Zo(f,"function",o);var y=Qt(g,r,t,i,a,n),O=x(y.map(function(M){return M.value}));Array.isArray(O)||(O=[O]),s.push.apply(s,O.map(function(M){return{type:typeof M=="string"?Z.literal:Z.object,value:M}}))}if(Gr(d)){var b=d.options[m]||d.options.other;if(!b)throw new ba(d.value,m,Object.keys(d.options),o);s.push.apply(s,Qt(b.value,r,t,i,a));continue}if(qr(d)){var b=d.options["=".concat(m)];if(!b){if(!Intl.PluralRules)throw new Zt(`Intl.PluralRules is not available in this environment.
Try polyfilling it using "@formatjs/intl-pluralrules"
`,Je.MISSING_INTL_API,o);var T=t.getPluralRules(r,{type:d.pluralType}).select(m-(d.offset||0));b=d.options[T]||d.options.other}if(!b)throw new ba(d.value,m,Object.keys(d.options),o);s.push.apply(s,Qt(b.value,r,t,i,a,m-(d.offset||0)));continue}}return pd(s)}function ud(e,r){return r?P(P(P({},e||{}),r||{}),Object.keys(e).reduce(function(t,i){return t[i]=P(P({},e[i]),r[i]||{}),t},{})):e}function gd(e,r){return r?Object.keys(e).reduce(function(t,i){return t[i]=ud(e[i],r[i]),t},P({},e)):e}function ya(e){return{create:function(){return{get:function(r){return e[r]},set:function(r,t){e[r]=t}}}}}function fd(e){return e===void 0&&(e={number:{},dateTime:{},pluralRules:{}}),{getNumberFormat:Kt(function(){for(var r,t=[],i=0;i<arguments.length;i++)t[i]=arguments[i];return new((r=Intl.NumberFormat).bind.apply(r,Br([void 0],t,!1)))},{cache:ya(e.number),strategy:Wr.variadic}),getDateTimeFormat:Kt(function(){for(var r,t=[],i=0;i<arguments.length;i++)t[i]=arguments[i];return new((r=Intl.DateTimeFormat).bind.apply(r,Br([void 0],t,!1)))},{cache:ya(e.dateTime),strategy:Wr.variadic}),getPluralRules:Kt(function(){for(var r,t=[],i=0;i<arguments.length;i++)t[i]=arguments[i];return new((r=Intl.PluralRules).bind.apply(r,Br([void 0],t,!1)))},{cache:ya(e.pluralRules),strategy:Wr.variadic})}}var Jo=function(){function e(r,t,i,a){var n=this;if(t===void 0&&(t=e.defaultLocale),this.formatterCache={number:{},dateTime:{},pluralRules:{}},this.format=function(o){var s=n.formatToParts(o);if(s.length===1)return s[0].value;var c=s.reduce(function(l,d){return!l.length||d.type!==Z.literal||typeof l[l.length-1]!="string"?l.push(d.value):l[l.length-1]+=d.value,l},[]);return c.length<=1?c[0]||"":c},this.formatToParts=function(o){return Qt(n.ast,n.locales,n.formatters,n.formats,o,void 0,n.message)},this.resolvedOptions=function(){return{locale:n.resolvedLocale.toString()}},this.getAst=function(){return n.ast},this.locales=t,this.resolvedLocale=e.resolveLocale(t),typeof r=="string"){if(this.message=r,!e.__parse)throw new TypeError("IntlMessageFormat.__parse must be set to process `message` of type `string`");this.ast=e.__parse(r,{ignoreTag:a?.ignoreTag,locale:this.resolvedLocale})}else this.ast=r;if(!Array.isArray(this.ast))throw new TypeError("A message must be provided as a String or AST.");this.formats=gd(e.formats,i),this.formatters=a&&a.formatters||fd(this.formatterCache)}return Object.defineProperty(e,"defaultLocale",{get:function(){return e.memoizedDefaultLocale||(e.memoizedDefaultLocale=new Intl.NumberFormat().resolvedOptions().locale),e.memoizedDefaultLocale},enumerable:!1,configurable:!0}),e.memoizedDefaultLocale=null,e.resolveLocale=function(r){var t=Intl.NumberFormat.supportedLocalesOf(r);return t.length>0?new Intl.Locale(t[0]):new Intl.Locale(typeof r=="string"?r:r[0])},e.__parse=Yo,e.formats={number:{integer:{maximumFractionDigits:0},currency:{style:"currency"},percent:{style:"percent"}},date:{short:{month:"numeric",day:"numeric",year:"2-digit"},medium:{month:"short",day:"numeric",year:"numeric"},long:{month:"long",day:"numeric",year:"numeric"},full:{weekday:"long",month:"long",day:"numeric",year:"numeric"}},time:{short:{hour:"numeric",minute:"numeric"},medium:{hour:"numeric",minute:"numeric",second:"numeric"},long:{hour:"numeric",minute:"numeric",second:"numeric",timeZoneName:"short"},full:{hour:"numeric",minute:"numeric",second:"numeric",timeZoneName:"short"}}},e}();var es=Jo;var wa={recurrenceLabel:"{recurrenceTerm, select, MONTH {/mo} YEAR {/yr} other {}}",recurrenceAriaLabel:"{recurrenceTerm, select, MONTH {per month} YEAR {per year} other {}}",perUnitLabel:"{perUnit, select, LICENSE {per license} other {}}",perUnitAriaLabel:"{perUnit, select, LICENSE {per license} other {}}",freeLabel:"Free",freeAriaLabel:"Free",taxExclusiveLabel:"{taxTerm, select, GST {excl. GST} VAT {excl. VAT} TAX {excl. tax} IVA {excl. IVA} SST {excl. SST} KDV {excl. KDV} other {}}",taxInclusiveLabel:"{taxTerm, select, GST {incl. GST} VAT {incl. VAT} TAX {incl. tax} IVA {incl. IVA} SST {incl. SST} KDV {incl. KDV} other {}}",alternativePriceAriaLabel:"Alternatively at",strikethroughAriaLabel:"Regularly at",planTypeLabel:"{planType, select, ABM {Annual, billed monthly} other {}}"},vd=Un("ConsonantTemplates/price"),xd=/<\/?[^>]+(>|$)/g,B={container:"price",containerOptical:"price-optical",containerStrikethrough:"price-strikethrough",containerPromoStrikethrough:"price-promo-strikethrough",containerAlternative:"price-alternative",containerAnnual:"price-annual",containerAnnualPrefix:"price-annual-prefix",containerAnnualSuffix:"price-annual-suffix",disabled:"disabled",currencySpace:"price-currency-space",currencySymbol:"price-currency-symbol",decimals:"price-decimals",decimalsDelimiter:"price-decimals-delimiter",integer:"price-integer",recurrence:"price-recurrence",taxInclusivity:"price-tax-inclusivity",unitType:"price-unit-type"},He={perUnitLabel:"perUnitLabel",perUnitAriaLabel:"perUnitAriaLabel",recurrenceLabel:"recurrenceLabel",recurrenceAriaLabel:"recurrenceAriaLabel",taxExclusiveLabel:"taxExclusiveLabel",taxInclusiveLabel:"taxInclusiveLabel",strikethroughAriaLabel:"strikethroughAriaLabel",alternativePriceAriaLabel:"alternativePriceAriaLabel"},Ea="TAX_EXCLUSIVE",bd=e=>Hn(e)?Object.entries(e).filter(([,r])=>ft(r)||kr(r)||r===!0).reduce((r,[t,i])=>`${r} ${t}${i===!0?"":`="${Dn(i)}"`}`,""):"",q=(e,r,t,i=!1)=>`<span class="${e}${r?"":` ${B.disabled}`}"${bd(t)}>${i?uo(r):r??""}</span>`;function yd(e){e=e.replaceAll("</a>","&lt;/a&gt;");let r=/<a [^>]+(>|$)/g;return e.match(r)?.forEach(i=>{let a=i.replace("<a ","&lt;a ").replace(">","&gt;");e=e.replaceAll(i,a)}),e}function wd(e){e=e.replaceAll("&lt;/a&gt;","</a>");let r=/&lt;a (?!&gt;)(.*?)(&gt;|$)/g;return e.match(r)?.forEach(i=>{let a=i.replace("&lt;a ","<a ").replace("&gt;",">");e=e.replaceAll(i,a)}),e}function _e(e,r,t,i){let a=e[t];if(a==null)return"";let n=a.includes("<"),o=a.includes("<a ");try{a=o?yd(a):a,a=n?a.replace(xd,""):a;let s=new es(a,r).format(i);return o?wd(s):s}catch{return vd.error("Failed to format literal:",a),""}}function Ed(e,{accessibleLabel:r,altAccessibleLabel:t,currencySymbol:i,decimals:a,decimalsDelimiter:n,hasCurrencySpace:o,integer:s,isCurrencyFirst:c,recurrenceLabel:l,perUnitLabel:d,taxInclusivityLabel:h},m={}){let p=q(B.currencySymbol,i),g=q(B.currencySpace,o?"&nbsp;":""),f="";return r?f=`<sr-only class="strikethrough-aria-label">${r}</sr-only>`:t&&(f=`<sr-only class="alt-aria-label">${t}</sr-only>`),c&&(f+=p+g),f+=q(B.integer,s),f+=q(B.decimalsDelimiter,n),f+=q(B.decimals,a),c||(f+=g+p),f+=q(B.recurrence,l,null,!0),f+=q(B.unitType,d,null,!0),f+=q(B.taxInclusivity,h,!0),q(e,f,{...m})}var X=({isAlternativePrice:e=!1,displayOptical:r=!1,displayStrikethrough:t=!1,displayPromoStrikethrough:i=!1,displayAnnual:a=!1,instant:n=void 0}={})=>({country:o,displayFormatted:s=!0,displayRecurrence:c=!0,displayPerUnit:l=!1,displayTax:d=!1,language:h,literals:m={},quantity:p=1,space:g=!1,isPromoApplied:f=!1}={},{commitment:x,offerSelectorIds:y,formatString:O,price:b,priceWithoutDiscount:T,taxDisplay:M,taxTerm:I,term:F,usePrecision:U,promotion:$}={},ee={})=>{Object.entries({country:o,formatString:O,language:h,price:b}).forEach(([Hs,Bs])=>{if(Bs==null)throw new Error(`Argument "${Hs}" is missing for osi ${y?.toString()}, country ${o}, language ${h}`)});let K={...wa,...m},se=`${h.toLowerCase()}-${o.toUpperCase()}`,we;$&&!f&&T?we=e||i?b:T:t&&T?we=T:we=b;let Me=r?fo:vo;a&&(Me=xo);let{accessiblePrice:ar,recurrenceTerm:La,...Ma}=Me({commitment:x,formatString:O,instant:n,isIndianPrice:o==="IN",originalPrice:b,priceWithoutDiscount:T,price:r?b:we,promotion:$,quantity:p,term:F,usePrecision:U}),Kr="",Zr="",Qr="";S(c)&&La&&(Qr=_e(K,se,He.recurrenceLabel,{recurrenceTerm:La}));let nr="";S(l)&&(g&&(nr+=" "),nr+=_e(K,se,He.perUnitLabel,{perUnit:"LICENSE"}));let or="";S(d)&&I&&(g&&(or+=" "),or+=_e(K,se,M===Ea?He.taxExclusiveLabel:He.taxInclusiveLabel,{taxTerm:I})),t&&(Kr=_e(K,se,He.strikethroughAriaLabel,{strikethroughPrice:Kr})),e&&(Zr=_e(K,se,He.alternativePriceAriaLabel,{alternativePrice:Zr}));let Ue=B.container;if(r&&(Ue+=` ${B.containerOptical}`),t&&(Ue+=` ${B.containerStrikethrough}`),i&&(Ue+=` ${B.containerPromoStrikethrough}`),e&&(Ue+=` ${B.containerAlternative}`),a&&(Ue+=` ${B.containerAnnual}`),S(s))return Ed(Ue,{...Ma,accessibleLabel:Kr,altAccessibleLabel:Zr,recurrenceLabel:Qr,perUnitLabel:nr,taxInclusivityLabel:or},ee);let{currencySymbol:za,decimals:Rs,decimalsDelimiter:Os,hasCurrencySpace:Ra,integer:Ns,isCurrencyFirst:Is}=Ma,rt=[Ns,Os,Rs];Is?(rt.unshift(Ra?"\xA0":""),rt.unshift(za)):(rt.push(Ra?"\xA0":""),rt.push(za)),rt.push(Qr,nr,or);let Ds=rt.join("");return q(Ue,Ds,ee)},ts=()=>(e,r,t)=>{let i=Ze(r.promotion,r.promotion?.displaySummary?.instant,Array.isArray(e.quantity)?e.quantity[0]:e.quantity),n=(e.displayOldPrice===void 0||S(e.displayOldPrice))&&r.priceWithoutDiscount&&r.priceWithoutDiscount!=r.price&&(!r.promotion||i);return`${n?`${X({displayStrikethrough:!0})({isPromoApplied:i,...e,displayPerUnit:!1,displayTax:!1},r,t)}&nbsp;`:""}${X({isAlternativePrice:n})({isPromoApplied:i,...e},r,t)}`},rs=()=>(e,r,t)=>{let{instant:i}=e;try{i||(i=new URLSearchParams(document.location.search).get("instant")),i&&(i=new Date(i))}catch{i=void 0}let a=Ze(r.promotion,i,Array.isArray(e.quantity)?e.quantity[0]:e.quantity),n={...e,displayTax:!1,displayPerUnit:!1,isPromoApplied:a};if(!a)return X()(e,{...r,price:r.priceWithoutDiscount},t)+q(B.containerAnnualPrefix," (")+X({displayAnnual:!0,instant:i})(n,{...r,price:r.priceWithoutDiscount},t)+q(B.containerAnnualSuffix,")");let s=(e.displayOldPrice===void 0||S(e.displayOldPrice))&&r.priceWithoutDiscount&&r.priceWithoutDiscount!=r.price;return`${s?`${X({displayStrikethrough:!0})(n,r,t)}&nbsp;`:""}${X({isAlternativePrice:s})({isPromoApplied:a,...e},r,t)}${q(B.containerAnnualPrefix," (")}${X({displayAnnual:!0,instant:i})(n,r,t)}${q(B.containerAnnualSuffix,")")}`},is=()=>(e,r,t)=>{let i={...e,displayTax:!1,displayPerUnit:!1};return`${X({isAlternativePrice:e.displayOldPrice})(e,r,t)}${q(B.containerAnnualPrefix," (")}${X({displayAnnual:!0})(i,r,t)}${q(B.containerAnnualSuffix,")")}`};var Jt={...B,containerLegal:"price-legal",planType:"price-plan-type"},Yr={...He,planTypeLabel:"planTypeLabel"};function Sd(e,{perUnitLabel:r,taxInclusivityLabel:t,planTypeLabel:i},a={},n=!0){let o="";return o+=q(Jt.unitType,r,null,!0),t&&i&&n&&(t+=t.endsWith(".")?" ":". "),o+=q(Jt.taxInclusivity,t,!0),o+=q(Jt.planType,i,null),q(e,o,{...a})}var as=({country:e,displayPerUnit:r=!1,displayTax:t=!1,displayPlanType:i=!1,displayDot:a=!0,language:n,literals:o={}}={},{taxDisplay:s,taxTerm:c,planType:l}={},d={})=>{let h={...wa,...o},m=`${n.toLowerCase()}-${e.toUpperCase()}`,p="";S(r)&&(p=_e(h,m,Yr.perUnitLabel,{perUnit:"LICENSE"}));let g="";e==="US"&&n==="en"&&(t=!1),S(t)&&c&&(g=_e(h,m,s===Ea?Yr.taxExclusiveLabel:Yr.taxInclusiveLabel,{taxTerm:c}));let f="";S(i)&&l&&(f=_e(h,m,Yr.planTypeLabel,{planType:l}));let x=Jt.container;return x+=` ${Jt.containerLegal}`,Sd(x,{perUnitLabel:p,taxInclusivityLabel:g,planTypeLabel:f},d,a)};var ns=X(),os=ts(),ss=X({displayOptical:!0}),cs=X({displayStrikethrough:!0}),ls=X({displayPromoStrikethrough:!0}),ds=X({displayAnnual:!0}),hs=X({displayOptical:!0,isAlternativePrice:!0}),ps=X({isAlternativePrice:!0}),ms=is(),us=rs(),gs=as;var Ad=(e,r)=>{if(!r&&vt(e))return 0;if(!(!vt(e)||!vt(r)))return Math.floor((r-e)/r*100)},fs=()=>(e,r)=>{let{price:t,priceWithoutDiscount:i}=r,a=Ad(t,i);return a===void 0?'<span class="no-discount"></span>':`<span class="discount">${a}%</span>`};var vs=fs();var xs="INDIVIDUAL_COM",Aa="TEAM_COM",bs="INDIVIDUAL_EDU",Ca="TEAM_EDU",Cd=["AT_de","AU_en","BE_en","BE_fr","BE_nl","BG_bg","CH_de","CH_fr","CH_it","CZ_cs","CO_es","DE_de","DK_da","EE_et","EG_ar","EG_en","ES_es","FI_fi","FR_fr","GB_en","GR_el","GR_en","HU_hu","ID_en","ID_id","ID_in","IE_en","IN_en","IN_hi","IT_it","JP_ja","KR_ko","LU_de","LU_en","LU_fr","LT_lt","LV_lv","MY_en","MY_ms","MU_en","NL_nl","NG_en","NO_nb","NZ_en","PE_es","PL_pl","PT_pt","RO_ro","SE_sv","SI_sl","SK_sk","SG_en","TH_en","TH_th","TR_tr","UA_uk","ZA_en","SA_ar","SA_en","MX_es","CL_es","PE_es","PH_en","PH_fil","VN_vi","VN_en","TW_zh"],Td={[xs]:[],[Aa]:[],[bs]:[],[Ca]:[]},kd={MU_en:[!0,!0,!0,!0],NG_en:[!1,!1,!1,!1],AU_en:[!1,!1,!1,!1],JP_ja:[!1,!1,!1,!1],NZ_en:[!1,!1,!1,!1],TH_en:[!1,!1,!1,!1],TH_th:[!1,!1,!1,!1],ZA_en:[!1,!1,!1,!1],PE_es:[!1,!1,!1,!1]},_d=[xs,Aa,bs,Ca],Pd=e=>[Aa,Ca].includes(e);function Sa(e,r,t,i){if(e[r])return e[r];let a=`${r}_${t}`;if(e[a])return e[a];let n;if(i)n=e.find(o=>o.startsWith(`${r}_`));else{let o=Object.keys(e).find(s=>s.startsWith(`${r}_`));n=o?e[o]:null}return n}var Ld=(e,r,t,i)=>{let a=`${t}_${i}`,n=Sa(kd,e,r,!1);if(n){let o=_d.indexOf(a);return n[o]}return Pd(a)},Md=(e,r,t,i)=>{if(Sa(Cd,e,r,!0))return!0;let a=Td[`${t}_${i}`];return a?Sa(a,e,r,!0)?!0:z.displayTax:z.displayTax},Ta=async(e,r,t,i)=>{let a=Md(e,r,t,i);return{displayTax:a,forceTaxExclusive:a?Ld(e,r,t,i):z.forceTaxExclusive}},er=class er extends HTMLSpanElement{constructor(){super();u(this,"masElement",new De(this));this.handleClick=this.handleClick.bind(this)}static get observedAttributes(){return["data-display-old-price","data-display-per-unit","data-display-recurrence","data-display-tax","data-display-plan-type","data-display-annual","data-perpetual","data-promotion-code","data-force-tax-exclusive","data-template","data-wcs-osi","data-quantity"]}static createInlinePrice(t){let i=ne();if(!i)return null;let{displayOldPrice:a,displayPerUnit:n,displayRecurrence:o,displayTax:s,displayPlanType:c,displayAnnual:l,forceTaxExclusive:d,perpetual:h,promotionCode:m,quantity:p,alternativePrice:g,template:f,wcsOsi:x}=i.collectPriceOptions(t);return Dr(er,{displayOldPrice:a,displayPerUnit:n,displayRecurrence:o,displayTax:s,displayPlanType:c,displayAnnual:l,forceTaxExclusive:d,perpetual:h,promotionCode:m,quantity:p,alternativePrice:g,template:f,wcsOsi:x})}get isInlinePrice(){return!0}attributeChangedCallback(t,i,a){this.masElement.attributeChangedCallback(t,i,a)}connectedCallback(){this.masElement.connectedCallback(),this.addEventListener("click",this.handleClick)}disconnectedCallback(){this.masElement.disconnectedCallback(),this.removeEventListener("click",this.handleClick)}handleClick(t){t.target!==this&&(t.stopImmediatePropagation(),this.dispatchEvent(new MouseEvent("click",{bubbles:!0,cancelable:!0,view:window})))}onceSettled(){return this.masElement.onceSettled()}get value(){return this.masElement.value}get options(){return this.masElement.options}get isFailed(){return this.masElement.state===pe}requestUpdate(t=!1){return this.masElement.requestUpdate(t)}async render(t={}){if(!this.isConnected)return!1;let i=ne();if(!i)return!1;let a=i.collectPriceOptions(t,this),n={...i.settings,...a};if(!n.wcsOsi.length)return!1;try{let o=this.masElement.togglePending({}),s=i.resolveOfferSelectors(n),c=await Promise.all(s),l=c.map(p=>{let g=qt(p,n);return g?.length?g[0]:null});if(l.some(p=>!p))throw new Error(`Failed to select offers for: ${n.wcsOsi}`);let d=l,h=ta(l);if(i.featureFlags[Ae]||n[Ae]){if(a.displayPerUnit===void 0&&(n.displayPerUnit=h.customerSegment!=="INDIVIDUAL"),a.displayTax===void 0||a.forceTaxExclusive===void 0){let{country:p,language:g}=n,[f=""]=h.marketSegments,x=await Ta(p,g,h.customerSegment,f);a.displayTax===void 0&&(n.displayTax=x?.displayTax||n.displayTax),a.forceTaxExclusive===void 0&&(n.forceTaxExclusive=x?.forceTaxExclusive||n.forceTaxExclusive),n.forceTaxExclusive&&(d=c.map(y=>{let O=qt(y,n);return O?.length?O[0]:null}))}}else a.displayOldPrice===void 0&&(n.displayOldPrice=!0);if(i.featureFlags[it]&&n.displayAnnual!==!1&&(n.displayAnnual=!0),n.template==="discount"&&d.length===2){let[p,g]=d,f={...p,priceDetails:{...p.priceDetails,priceWithoutDiscount:g.priceDetails?.price}};return this.renderOffers([f],n,o)}let m=ta(d);return this.renderOffers([m],n,o)}catch(o){throw this.innerHTML="",o}}renderOffers(t,i,a=void 0){if(!this.isConnected)return;let n=ne();if(!n)return!1;if(a??(a=this.masElement.togglePending()),this.dataset.alternativePrice==="true"&&i&&(i.alternativePrice=!0),t.length){if(this.masElement.toggleResolved(a,t,i)){let o=n.buildPriceHTML(t,this.options);if(o!==this.innerHTML&&(this.innerHTML=o),this.dataset.template!=="strikethrough"&&!this.options.alternativePrice)return!0;let s=this.closest("p, h3, div");if(!s||!s.querySelector('span[data-template="strikethrough"]')||s.querySelector(".alt-aria-label"))return!0;let c=s?.querySelectorAll('span[is="inline-price"]');return c.length>1&&c.length===s.querySelectorAll('span[data-template="strikethrough"]').length*2&&c.forEach(l=>{if(!(l.dataset.template==="strikethrough"||l.isFailed)){if(!l.options){l.dataset.alternativePrice="true";return}l.options.alternativePrice||(l.options.alternativePrice=!0,l.dataset.alternativePrice="true",l.innerHTML=n.buildPriceHTML(t,l.options))}}),!0}}else{let o=new Error(`Not provided: ${this.options?.wcsOsi??"-"}`);if(this.masElement.toggleFailed(a,o,this.options))return this.innerHTML="",!0}return!1}};u(er,"is","inline-price"),u(er,"tag","span");var Pe=er;window.customElements.get(Pe.is)||window.customElements.define(Pe.is,Pe,{extends:Pe.tag});function ys({literals:e,providers:r,settings:t}){function i(o,s=null){let c={country:t.country,language:t.language,locale:t.locale,literals:{...e.price}};if(s&&r?.price)for(let I of r.price)I(s,c);let{displayOldPrice:l,displayPerUnit:d,displayRecurrence:h,displayTax:m,displayPlanType:p,forceTaxExclusive:g,perpetual:f,displayAnnual:x,promotionCode:y,quantity:O,alternativePrice:b,wcsOsi:T,...M}=Object.assign(c,s?.dataset??{},o??{});return c=_r(Object.assign({...c,...M,displayOldPrice:S(l),displayPerUnit:S(d),displayRecurrence:S(h),displayTax:S(m),displayPlanType:S(p),forceTaxExclusive:S(g),perpetual:S(f),displayAnnual:S(x),promotionCode:Mr(y).effectivePromoCode,quantity:xt(O,z.quantity),alternativePrice:S(b),wcsOsi:Ir(T)})),c}function a(o,s){if(!Array.isArray(o)||!o.length||!s)return"";let{template:c}=s,l;switch(c){case"discount":l=vs;break;case"strikethrough":l=cs;break;case"promo-strikethrough":l=ls;break;case"annual":l=ds;break;case"legal":l=gs;break;default:s.template==="optical"&&s.alternativePrice?l=hs:s.template==="optical"?l=ss:s.displayAnnual&&o[0].planType==="ABM"?l=s.promotionCode&&o[0].promotion?us:ms:s.alternativePrice?l=ps:l=s.promotionCode&&o[0].promotion?os:ns}let[d]=o;return d={...d,...d.priceDetails},l({...t,...s},d)}let n=Pe.createInlinePrice;return{InlinePrice:Pe,buildPriceHTML:a,collectPriceOptions:i,createInlinePrice:n}}function zd({locale:e=void 0,country:r=void 0,language:t=void 0}={}){return t??(t=e?.split("_")?.[0]||z.language),r??(r=e?.split("_")?.[1]||z.country),e??(e=`${t}_${r}`),{locale:e,country:r,language:t}}function ws(e={},r){let t=r.featureFlags[Ae],{commerce:i={}}=e,a=ge.PRODUCTION,n=bi,o=D("checkoutClientId",i)??z.checkoutClientId,s=Gt(D("checkoutWorkflowStep",i),re,z.checkoutWorkflowStep),c=S(D("displayOldPrice",i),z.displayOldPrice),l=z.displayPerUnit,d=S(D("displayRecurrence",i),z.displayRecurrence),h=S(D("displayTax",i),z.displayTax),m=S(D("displayPlanType",i),z.displayPlanType),p=S(D("entitlement",i),z.entitlement),g=S(D("modal",i),z.modal),f=S(D("forceTaxExclusive",i),z.forceTaxExclusive),x=D("promotionCode",i)??z.promotionCode,y=xt(D("quantity",i)),O=D("wcsApiKey",i)??z.wcsApiKey,b=i?.env==="stage",T=Re.PUBLISHED;["true",""].includes(i.allowOverride)&&(b=(D(vi,i,{metadata:!1})?.toLowerCase()??i?.env)==="stage",T=Gt(D(xi,i),Re,T)),b&&(a=ge.STAGE,n=yi);let I=D(fi)??e.preview,F=typeof I<"u"&&I!=="off"&&I!=="false",U={};F&&(U={preview:F});let $=D("mas-io-url")??e.masIOUrl??`https://www${a===ge.STAGE?".stage":""}.adobe.com/mas/io`,ee=D("preselect-plan")??void 0,K=D("instant")??e.instant;return{...zd(e),...U,displayOldPrice:c,checkoutClientId:o,checkoutWorkflowStep:s,displayPerUnit:l,displayRecurrence:d,displayTax:h,displayPlanType:m,entitlement:p,extraOptions:z.extraOptions,modal:g,env:a,forceTaxExclusive:f,promotionCode:x,quantity:y,alternativePrice:z.alternativePrice,wcsApiKey:O,wcsURL:n,landscape:T,masIOUrl:$,...ee&&{preselectPlan:ee},...K&&{instant:K}}}async function Es(e,r={},t=2,i=100){let a;for(let n=0;n<=t;n++)try{let o=await fetch(e,r);return o.retryCount=n,o}catch(o){if(a=o,a.retryCount=n,n===t)break;await new Promise(s=>setTimeout(s,i*(n+1)))}throw a}var ka="wcs";function Ss({settings:e}){let r=ae.module(ka),{env:t,wcsApiKey:i}=e,a=new Map,n=new Map;async function o(h,m,p=!0){let g=ne(),f=mi;r.debug("Fetching:",h);let x="",y;if(h.offerSelectorIds.length>1)throw new Error("Multiple OSIs are not supported anymore");let O=new Map(m),[b]=h.offerSelectorIds,T=Date.now()+Math.random().toString(36).substring(2,7),M=`${ka}:${b}:${T}${Ei}`,I=`${ka}:${b}:${T}${Si}`,F;try{if(performance.mark(M),x=new URL(e.wcsURL),x.searchParams.set("offer_selector_ids",b),x.searchParams.set("country",h.country),x.searchParams.set("locale",h.locale),x.searchParams.set("landscape",t===ge.STAGE?"ALL":e.landscape),x.searchParams.set("api_key",i),h.language&&x.searchParams.set("language",h.language),h.promotionCode&&x.searchParams.set("promotion_code",h.promotionCode),h.currency&&x.searchParams.set("currency",h.currency),y=await Es(x.toString(),{credentials:"omit"}),y.ok){let U=[];try{let $=await y.json();r.debug("Fetched:",h,$),U=$.resolvedOffers??[]}catch($){r.error(`Error parsing JSON: ${$.message}`,{...$.context,...g?.duration})}U=U.map(zr),m.forEach(({resolve:$},ee)=>{let K=U.filter(({offerSelectorIds:se})=>se.includes(ee)).flat();K.length&&(O.delete(ee),m.delete(ee),$(K))})}else f=pi}catch(U){f=`Network error: ${U.message}`}finally{F=performance.measure(I,M),performance.clearMarks(M),performance.clearMeasures(I)}if(p&&m.size){r.debug("Missing:",{offerSelectorIds:[...m.keys()]});let U=eo(y);m.forEach($=>{$.reject(new bt(f,{...h,...U,response:y,measure:hr(F),...g?.duration}))})}}function s(h){if(!h||typeof h!="object")throw new TypeError("Cache must be a Map or similar object");let m=t===ge.STAGE?"stage":"prod",p=h[m];if(!p||typeof p!="object"){r.warn(`No cache found for environment: ${t}`);return}for(let[g,f]of Object.entries(p))a.set(g,Promise.resolve(f.map(zr)));r.debug(`Prefilled WCS cache with ${p.size} entries`)}function c(){let h=a.size;n=new Map(a),a.clear(),r.debug(`Moved ${h} cache entries to stale cache`)}function l(h,m,p){let g=h!=="GB"&&!p?"MULT":"en",f=Ai.includes(h)?h:z.country;return{validCountry:f,validLanguage:g,locale:`${m}_${f}`}}function d({country:h,language:m,perpetual:p=!1,promotionCode:g="",wcsOsi:f=[]}){let{validCountry:x,validLanguage:y,locale:O}=l(h,m,p),b=[x,y,g].filter(T=>T).join("-").toLowerCase();return f.map(T=>{let M=`${T}-${b}`;if(a.has(M))return a.get(M);let I=new Promise((F,U)=>{let $={country:x,locale:O,...y==="MULT"&&{language:y},offerSelectorIds:[T]};g&&($.promotionCode=g),o($,new Map([[T,{resolve:F,reject:U}]]))}).catch(F=>{if(n.has(M))return n.get(M);throw F});return a.set(M,I),I})}return{Commitment:$e,PlanType:Gn,Term:le,applyPlanType:zr,resolveOfferSelectors:d,flushWcsCacheInternal:c,prefillWcsCache:s,normalizeCountryLanguageAndLocale:l}}var As="mas-commerce-service",Cs="mas-commerce-service:start",Ts="mas-commerce-service:ready",tr,wt,et,ks,Pa,_a=class extends HTMLElement{constructor(){super(...arguments);k(this,et);k(this,tr);k(this,wt);u(this,"lastLoggingTime",0)}async registerCheckoutAction(t){typeof t=="function"&&(this.buildCheckoutAction=async(i,a,n)=>{let o=await t?.(i,a,this.imsSignedInPromise,n);return o||null})}get featureFlags(){return v(this,wt)||w(this,wt,{[Ae]:V(this,et,Pa).call(this,Ae),[it]:V(this,et,Pa).call(this,it)}),v(this,wt)}activate(){let t=v(this,et,ks),i=ws(t,this);Rr(t.lana);let a=ae.init(t.hostEnv).module("service");a.debug("Activating:",t);let o={price:ko(i)},s={checkout:new Set,price:new Set},c={literals:o,providers:s,settings:i};Object.defineProperties(this,Object.getOwnPropertyDescriptors({...Ao(c),...Co(c),...ys(c),...Ss(c),...Ci,Log:ae,resolvePriceTaxFlags:Ta,get defaults(){return z},get log(){return ae},get providers(){return{checkout(d){return s.checkout.add(d),()=>s.checkout.delete(d)},price(d){return s.price.add(d),()=>s.price.delete(d)},has:d=>s.price.has(d)||s.checkout.has(d)}},get settings(){return i}})),a.debug("Activated:",{literals:o,settings:i});let l=new CustomEvent(cr,{bubbles:!0,cancelable:!1,detail:this});performance.mark(Ts),w(this,tr,performance.measure(Ts,Cs)),this.dispatchEvent(l),setTimeout(()=>{this.logFailedRequests()},1e4)}connectedCallback(){performance.mark(Cs),this.activate()}flushWcsCache(){this.flushWcsCacheInternal(),this.log.debug("Flushed WCS cache")}isPreview(){let t=this.getAttribute("preview");return t!=null&&["true","on",!0].includes(t)}refreshOffers(){this.flushWcsCacheInternal(),document.querySelectorAll(ti).forEach(t=>t.requestUpdate(!0)),this.log.debug("Refreshed WCS offers"),this.logFailedRequests()}refreshFragments(){this.flushWcsCacheInternal(),customElements.get("aem-fragment")?.cache.clear(),document.querySelectorAll("aem-fragment").forEach(t=>t.refresh(!1)),this.log.debug("Refreshed AEM fragments"),this.logFailedRequests()}get duration(){return{"mas-commerce-service:measure":hr(v(this,tr))}}logFailedRequests(){let t=[...performance.getEntriesByType("resource")].filter(({startTime:a})=>a>this.lastLoggingTime).filter(({transferSize:a,duration:n,responseStatus:o})=>a===0&&n===0&&o<200||o>=400),i=Array.from(new Map(t.map(a=>[a.name,a])).values());if(i.some(({name:a})=>/(\/fragment\?|web_commerce_artifact)/.test(a))){let a=i.map(({name:n})=>n);this.log.error("Failed requests:",{failedUrls:a,...this.duration})}this.lastLoggingTime=performance.now().toFixed(3)}};tr=new WeakMap,wt=new WeakMap,et=new WeakSet,ks=function(){let t=this.getAttribute("env")??"prod",i={commerce:{env:t},hostEnv:{name:t},lana:{tags:this.getAttribute("lana-tags"),sampleRate:parseInt(this.getAttribute("lana-sample-rate")??1,10),isProdDomain:t==="prod"},masIOUrl:this.getAttribute("mas-io-url")};return["locale","country","language","preview","instant"].forEach(a=>{let n=this.getAttribute(a);n&&(i[a]=n)}),["checkout-workflow-step","force-tax-exclusive","checkout-client-id","allow-override","wcs-api-key"].forEach(a=>{let n=this.getAttribute(a);if(n!=null){let o=a.replace(/-([a-z])/g,s=>s[1].toUpperCase());i.commerce[o]=n}}),i},Pa=function(t){return["on","true",!0].includes(this.getAttribute(`data-${t}`)||D(t))};window.customElements.get(As)||window.customElements.define(As,_a);var Ms="merch-card-collection",Rd=3e4,Od={catalog:["four-merch-cards"],plans:["four-merch-cards"],plansTwoColumns:["two-merch-cards"],plansThreeColumns:["three-merch-cards"],product:["four-merch-cards"],productTwoColumns:["two-merch-cards"],productThreeColumns:["three-merch-cards"],segment:["four-merch-cards"],segmentTwoColumns:["two-merch-cards"],segmentThreeColumns:["three-merch-cards"],"special-offers":["three-merch-cards"],image:["three-merch-cards"],"mini-compare-chart":["three-merch-cards"],"mini-compare-chartTwoColumns":["two-merch-cards"],"mini-compare-chart-mweb":["three-merch-cards"],"mini-compare-chart-mwebTwoColumns":["two-merch-cards"]},Nd={plans:!0},Id=(e,{filter:r})=>e.filter(t=>t?.filters&&t?.filters.hasOwnProperty(r)),Dd=(e,{types:r})=>r?(r=r.split(","),e.filter(t=>r.some(i=>t.types.includes(i)))):e,Hd=e=>e.sort((r,t)=>(r.title??"").localeCompare(t.title??"","en",{sensitivity:"base"})),Bd=(e,{filter:r})=>e.sort((t,i)=>i.filters[r]?.order==null||isNaN(i.filters[r]?.order)?-1:t.filters[r]?.order==null||isNaN(t.filters[r]?.order)?1:t.filters[r].order-i.filters[r].order),Fd=(e,{search:r})=>r?.length?(r=r.toLowerCase(),e.filter(t=>(t.title??"").toLowerCase().includes(r))):e,Be,Fe,St,tt,ir,Xr,zs,Et=class extends Ps{constructor(){super();k(this,Xr);k(this,Be,{});k(this,Fe,null);k(this,St);k(this,tt);k(this,ir);this.id=null,this.filter="all",this.hasMore=!1,this.resultCount=void 0,this.displayResult=!1,this.data=null,this.variant=null,this.hydrating=!1,this.hydrationReady=null,this.literalsHandlerAttached=!1,this.onUnmount=[],this.resizeHandlerDebounced=$a(this.resizeHandler.bind(this),300)}resizeHandler(){this.firstChild?.variantLayout?.resizeHandler?.()}render(){return Le` <slot></slot>
            ${this.footer}`}checkReady(){if(!this.querySelector("aem-fragment"))return Promise.resolve(!0);let i=new Promise(a=>setTimeout(()=>a(!1),Rd));return Promise.race([this.hydrationReady,i])}willUpdate(t){if(w(this,Fe,null),!this.querySelector("merch-card"))return;let i=[...this.children].filter(s=>s.tagName==="MERCH-CARD"&&!s.failed);if(i.length===0)return;t.has("singleApp")&&this.singleApp&&i.forEach(s=>{s.updateFilters(s.name===this.singleApp)});let a=this.sort===me.alphabetical?Hd:Bd,o=[Id,Dd,Fd,a].reduce((s,c)=>c(s,this),i).map((s,c)=>[s,c]);if(this.resultCount=o.length,this.page&&this.limit){let s=this.page*this.limit;this.hasMore=o.length>s,o=o.filter(([,c])=>c<s)}w(this,Fe,{children:i,sortedCards:o.map(([s])=>s)})}updated(){if(!v(this,Fe))return;let{children:t,sortedCards:i}=v(this,Fe);w(this,Fe,null);let a=new Set(i),n=t.filter(d=>a.has(d)),o=i.some((d,h)=>n[h]!==d),s=t.some(d=>a.has(d)?d.style.display==="none":d.style.display!=="none"),c=o||s,l=c?window.scrollY||document.documentElement.scrollTop:0;if(o)for(let d=i.length-1;d>=0;d--)this.prepend(i[d]);t.forEach(d=>{if(a.has(d)){let h=d.filters[this.filter]?.size;d.size!==h&&(d.size=h),d.style.display==="none"&&(d.style.removeProperty("display"),d.requestUpdate())}else d.style.display!=="none"&&(d.style.display="none"),d.size!==void 0&&(d.size=void 0)}),c&&window.scrollTo(0,l),this.updateComplete.then(()=>{this.dispatchLiteralsChanged(),this.sidenav&&!this.literalsHandlerAttached&&(this.sidenav.addEventListener(ni,()=>{this.dispatchLiteralsChanged()}),this.literalsHandlerAttached=!0)})}dispatchLiteralsChanged(){this.dispatchEvent(new CustomEvent(he,{detail:{resultCount:this.resultCount,searchTerm:this.search,filter:this.sidenav?.filters?.selectedText}}))}buildOverrideMap(){w(this,Be,{}),this.overrides?.split(",").forEach(t=>{let[i,a]=t?.split(":");i&&a&&(v(this,Be)[i]=a)})}connectedCallback(){super.connectedCallback(),w(this,St,Lt()),v(this,St)&&w(this,tt,v(this,St).Log.module(Ms)),w(this,ir,customElements.get("merch-card")),this.buildOverrideMap(),this.init(),window.addEventListener("resize",this.resizeHandlerDebounced)}async init(){await this.hydrate(),this.sidenav=this.parentElement.querySelector("merch-sidenav"),this.filtered?(this.filter=this.filtered,this.page=1):this.startDeeplink(),this.initializePlaceholders()}disconnectedCallback(){super.disconnectedCallback(),this.stopDeeplink?.();for(let t of this.onUnmount)t();window.removeEventListener("resize",this.resizeHandlerDebounced)}initializeHeader(){let t=document.createElement("merch-card-collection-header");t.collection=this,t.classList.add(this.variant),this.parentElement.insertBefore(t,this),this.header=t,this.querySelectorAll("[placeholder]").forEach(a=>{let n=a.getAttribute("slot");this.header.placeholderKeys.includes(n)&&this.header.append(a)})}initializePlaceholders(){let t=this.data?.placeholders||{};!t.searchText&&this.data?.sidenavSettings?.searchText&&(t.searchText=this.data.sidenavSettings.searchText);for(let i of Object.keys(t)){let a=t[i],n=a.includes("<p>")?"div":"p",o=document.createElement(n);o.setAttribute("slot",i),o.setAttribute("placeholder",""),o.innerHTML=a,this.append(o)}}attachSidenav(t,i=!0){if(!t)return;i&&this.parentElement.prepend(t),this.sidenav=t,this.sidenav.variant=this.variant,this.sidenav.classList.add(this.variant),Nd[this.variant]&&this.sidenav.setAttribute("autoclose",""),this.initializeHeader(),this.dispatchEvent(new CustomEvent(kt));let a=v(this,ir)?.getCollectionOptions(this.variant)?.onSidenavAttached;a&&a(this)}async hydrate(){if(this.hydrating)return!1;let t=this.querySelector("aem-fragment");if(!t)return;this.id=t.getAttribute("fragment"),this.hydrating=!0;let i;this.hydrationReady=new Promise(s=>{i=s});let a=this;function n(s){let c;return s.fields?.checkboxGroups?c=s.fields.checkboxGroups:s.fields?.tagFilters&&(c=[{title:s.fields?.tagFiltersTitle,label:"types",deeplink:"types",checkboxes:s.fields.tagFilters.map(l=>{let d=l.split("/").pop(),h=s.settings?.tagLabels?.[d]||d;return h=h.startsWith("coll-tag-filter")?d.charAt(0).toUpperCase()+d.slice(1):h,{name:d,label:h}})}]),{searchText:s.fields?.searchText,tagFilters:c,linksTitle:s.fields?.linksTitle,link:s.fields?.link,linkText:s.fields?.linkText,linkIcon:s.fields?.linkIcon}}function o(s,c){let l={cards:[],hierarchy:[],placeholders:s.placeholders,sidenavSettings:n(s)};function d(h,m){for(let p of m){if(p.fieldName==="variations")continue;if(p.fieldName==="cards"){if(l.cards.findIndex(b=>b.id===p.identifier)!==-1)continue;if(!s.references[p.identifier]?.value){v(a,tt)?.error(`Reference not found for card: ${p.identifier}`);continue}l.cards.push(s.references[p.identifier].value);continue}let g=s.references[p.identifier]?.value,f=p.referencesTree,x=c[p.identifier];if(x){let b=document.querySelector(`aem-fragment[fragment="${x}"]`)?.rawData;if(b?.fields)g=b,f=b.referencesTree,s.references={...s.references,...b.references};else{v(a,tt)?.error(`Override fragment ${x} not found or invalid:`);continue}}if(!g?.fields)continue;let{fields:y}=g,O={label:y.label||"",icon:y.icon,iconLight:y.iconLight,queryLabel:y.queryLabel,cards:y.cards?y.cards.map(b=>c[b]||b):[],collections:[]};y.defaultchild&&(O.defaultchild=c[y.defaultchild]||y.defaultchild),h.push(O),d(O.collections,f)}}return d(l.hierarchy,s.referencesTree),l.hierarchy.length===0&&(a.filtered="all"),l}t.addEventListener(si,s=>{V(this,Xr,zs).call(this,"Error loading AEM fragment",s.detail),this.hydrating=!1,t.remove()}),t.addEventListener(oi,async s=>{this.limit=27,this.data=o(s.detail,v(this,Be)),s.detail.variationId&&this.setAttribute("variation-id",s.detail.variationId);let{cards:c,hierarchy:l}=this.data,d=l.length===0&&s.detail.fields?.defaultchild?v(this,Be)[s.detail.fields.defaultchild]||s.detail.fields.defaultchild:null;for(let g of c)t.cache.add(g);let h=(g,f)=>{for(let x of g)if(x.defaultchild===f||x.collections&&h(x.collections,f))return!0;return!1};for(let g of c){let b=function(M){for(let I of M){let F=I.cards.indexOf(x);if(F===-1)continue;let U=I.queryLabel??I?.label?.toLowerCase()??"";f.filters[U]={order:F+1,size:g.fields.size},b(I.collections)}},f=document.createElement("merch-card"),x=v(this,Be)[g.id]||g.id;f.setAttribute("consonant",""),f.setAttribute("style","");let y=g.fields.tags?.filter(M=>M.startsWith("mas:types/")).map(M=>M.split("/")[1]).join(",");y&&f.setAttribute("types",y),mr(g.fields.variant)?.supportsDefaultChild&&(d?x===d:h(l,x))&&f.setAttribute("data-default-card","true"),b(l);let T=document.createElement("aem-fragment");T.setAttribute("fragment",x),f.append(T),Object.keys(f.filters).length===0&&(f.filters={all:{order:c.indexOf(g)+1,size:g.fields.size}}),this.append(f)}let m="",p=io(c[0]?.fields?.variant);this.variant=p,p==="plans"&&(c.length===2||c.length===3)&&!c.some(g=>g.fields?.size?.includes("wide"))||(p==="segment"||p==="product")&&(c.length===2||c.length===3)?m=c.length===2?"TwoColumns":"ThreeColumns":(p==="mini-compare-chart"||p==="mini-compare-chart-mweb")&&c.length<=2&&(m=c.length===1?"":"TwoColumns"),p&&this.classList.add("merch-card-collection",p,...Od[`${p}${m}`]||[]),this.displayResult=!0,this.hydrating=!1,t.remove(),i(!0)}),await this.hydrationReady}get footer(){if(!this.filtered)return Le`<div id="footer">
            <sp-theme color="light" scale="medium">
                ${this.showMoreButton}
            </sp-theme>
        </div>`}get showMoreButton(){if(this.hasMore)return Le`<sp-button
            variant="secondary"
            treatment="outline"
            style="order: 1000;"
            @click="${this.showMore}"
        >
            <slot name="showMoreText"></slot>
        </sp-button>`}sortChanged(t){t.target.value===me.authored?Tt({sort:void 0}):Tt({sort:t.target.value}),this.dispatchEvent(new CustomEvent(ii,{bubbles:!0,composed:!0,detail:{value:t.target.value}}))}async showMore(){this.dispatchEvent(new CustomEvent(ai,{bubbles:!0,composed:!0}));let t=this.page+1;Tt({page:t}),this.page=t,await this.updateComplete}startDeeplink(){this.stopDeeplink=Ba(({category:t,filter:i,types:a,sort:n,search:o,single_app:s,page:c})=>{i=i||t,!this.filtered&&i&&i!==this.filter&&setTimeout(()=>{Tt({page:void 0}),this.page=1},1),this.filtered||(this.filter=i??this.filter),this.types=a??"",this.search=o??"",this.singleApp=s,this.sort=n,this.page=Number(c)||1})}openFilters(t){this.sidenav?.showModal(t)}};Be=new WeakMap,Fe=new WeakMap,St=new WeakMap,tt=new WeakMap,ir=new WeakMap,Xr=new WeakSet,zs=function(t,i={},a=!0){v(this,tt)?.error(`merch-card-collection: ${t}`,i),this.failed=!0,a&&this.dispatchEvent(new CustomEvent(ci,{detail:{...i,message:t},bubbles:!0,composed:!0}))},u(Et,"properties",{id:{type:String,attribute:"id",reflect:!0},displayResult:{type:Boolean,attribute:"display-result"},filter:{type:String,attribute:"filter",reflect:!0},filtered:{type:String,attribute:"filtered",reflect:!0},hasMore:{type:Boolean},limit:{type:Number,attribute:"limit"},overrides:{type:String},page:{type:Number,attribute:"page",reflect:!0},resultCount:{type:Number},search:{type:String,attribute:"search",reflect:!0},sidenav:{type:Object},singleApp:{type:String,attribute:"single-app",reflect:!0},sort:{type:String,attribute:"sort",default:me.authored,reflect:!0},types:{type:String,attribute:"types",reflect:!0}}),u(Et,"styles",Ls`
        #footer {
            grid-column: 1 / -1;
            justify-self: stretch;
            color: var(--merch-color-grey-80);
            order: 1000;
        }

        sp-theme {
            display: contents;
        }
    `);Et.SortOrder=me;customElements.define(Ms,Et);var Ud={filters:["noResultText","resultText","resultsText"],filtersMobile:["noResultText","resultMobileText","resultsMobileText"],search:["noSearchResultsText","searchResultText","searchResultsText"],searchMobile:["noSearchResultsMobileText","searchResultMobileText","searchResultsMobileText"]},$d=(e,r,t)=>{e.querySelectorAll(`[data-placeholder="${r}"]`).forEach(a=>{a.innerText=t||""})},Gd={search:["mobile","tablet"],filter:["mobile","tablet"],sort:!0,result:!0,custom:!1},qd={catalog:"l"},oe,At,rr=class extends Ps{constructor(){super();k(this,oe);k(this,At);u(this,"tablet",new Ct(this,R));u(this,"desktop",new Ct(this,C));this.collection=null,w(this,oe,{search:!1,filter:!1,sort:!1,result:!1,custom:!1}),this.updateLiterals=this.updateLiterals.bind(this),this.handleSidenavAttached=this.handleSidenavAttached.bind(this)}connectedCallback(){super.connectedCallback(),this.collection?.addEventListener(he,this.updateLiterals),this.collection?.addEventListener(kt,this.handleSidenavAttached),w(this,At,customElements.get("merch-card"))}disconnectedCallback(){super.disconnectedCallback(),this.collection?.removeEventListener(he,this.updateLiterals),this.collection?.removeEventListener(kt,this.handleSidenavAttached)}willUpdate(){v(this,oe).search=this.getVisibility("search"),v(this,oe).filter=this.getVisibility("filter"),v(this,oe).sort=this.getVisibility("sort"),v(this,oe).result=this.getVisibility("result"),v(this,oe).custom=this.getVisibility("custom")}parseVisibilityOptions(t,i){if(!t||!Object.hasOwn(t,i))return null;let a=t[i];return a===!1?!1:a===!0?!0:a.includes(this.currentMedia)}getVisibility(t){let i=v(this,At)?.getCollectionOptions(this.collection?.variant)?.headerVisibility,a=this.parseVisibilityOptions(i,t);return a!==null?a:this.parseVisibilityOptions(Gd,t)}get sidenav(){return this.collection?.sidenav}get search(){return this.collection?.search}get resultCount(){return this.collection?.resultCount}get variant(){return this.collection?.variant}get isMobile(){return!this.isTablet&&!this.isDesktop}get isTablet(){return this.tablet.matches&&!this.desktop.matches}get isDesktop(){return this.desktop.matches}get currentMedia(){return this.isDesktop?"desktop":this.isTablet?"tablet":"mobile"}get searchAction(){if(!v(this,oe).search)return ue;let t=Pt(this,"searchText");return t?Le`
            <merch-search deeplink="search" id="search">
                <sp-search
                    id="search-bar"
                    placeholder="${t}"
                    .size=${qd[this.variant]}
                    aria-label="${t}"
                ></sp-search>
            </merch-search>
        `:ue}get filterAction(){return v(this,oe).filter?this.sidenav?Le`
            <sp-action-button
                id="filter"
                variant="secondary"
                treatment="outline"
                @click="${this.openFilters}"
                ><slot name="filtersText"></slot
            ></sp-action-button>
        `:ue:ue}get sortAction(){if(!v(this,oe).sort)return ue;let t=Pt(this,"sortText");if(!t)return;let i=Pt(this,"popularityText"),a=Pt(this,"alphabeticallyText");if(!(i&&a))return;let n=this.collection?.sort===me.alphabetical;return Le`
            <sp-action-menu
                id="sort"
                size="m"
                @change="${this.collection?.sortChanged}"
                selects="single"
                value="${n?me.alphabetical:me.authored}"
            >
                <span slot="label-only"
                    >${t}:
                    ${n?a:i}</span
                >
                <sp-menu-item value="${me.authored}"
                    >${i}</sp-menu-item
                >
                <sp-menu-item value="${me.alphabetical}"
                    >${a}</sp-menu-item
                >
            </sp-action-menu>
        `}get resultSlotName(){let t=`${this.search?"search":"filters"}${this.isMobile||this.isTablet?"Mobile":""}`;return Ud[t][Math.min(this.resultCount,2)]}get resultLabel(){if(!v(this,oe).result)return ue;if(!this.sidenav)return ue;let t=this.search?"search":"filter",i=this.resultCount?this.resultCount===1?"single":"multiple":"none";return Le` <div
            id="result"
            aria-live="polite"
            type=${t}
            quantity=${i}
        >
            <slot name="${this.resultSlotName}"></slot>
        </div>`}get customArea(){if(!v(this,oe).custom)return ue;let t=v(this,At)?.getCollectionOptions(this.collection?.variant)?.customHeaderArea;if(!t)return ue;let i=t(this.collection);return!i||i===ue?ue:Le`<div id="custom" role="heading" aria-level="2">
            ${i}
        </div>`}openFilters(t){this.sidenav.showModal(t)}updateLiterals(t){Object.keys(t.detail).forEach(i=>{$d(this,i,t.detail[i])}),this.requestUpdate()}handleSidenavAttached(){this.requestUpdate()}render(){return Le`
            <sp-theme color="light" scale="medium">
                <div id="header">
                    ${this.searchAction}${this.filterAction}${this.sortAction}${this.resultLabel}${this.customArea}
                </div>
            </sp-theme>
        `}get placeholderKeys(){return["searchText","filtersText","sortText","popularityText","alphabeticallyText","noResultText","resultText","resultsText","resultMobileText","resultsMobileText","noSearchResultsText","searchResultText","searchResultsText","noSearchResultsMobileText","searchResultMobileText","searchResultsMobileText"]}};oe=new WeakMap,At=new WeakMap,u(rr,"styles",Ls`
        :host {
            --merch-card-collection-header-max-width: var(
                --merch-card-collection-card-width
            );
            --merch-card-collection-header-margin-bottom: 32px;
            --merch-card-collection-header-column-gap: 8px;
            --merch-card-collection-header-row-gap: 16px;
            --merch-card-collection-header-columns: auto auto;
            --merch-card-collection-header-areas: 'search search' 'filter sort'
                'result result';
            --merch-card-collection-header-search-max-width: unset;
            --merch-card-collection-header-search-min-height: 44px;
            --merch-card-collection-header-filter-height: 44px;
            --merch-card-collection-header-filter-font-size: 16px;
            --merch-card-collection-header-filter-padding: 15px;
            --merch-card-collection-header-sort-height: var(
                --merch-card-collection-header-filter-height
            );
            --merch-card-collection-header-sort-font-size: var(
                --merch-card-collection-header-filter-font-size
            );
            --merch-card-collection-header-sort-padding: var(
                --merch-card-collection-header-filter-padding
            );
            --merch-card-collection-header-result-font-size: 14px;
        }

        sp-theme {
            font-size: inherit;
        }

        #header {
            display: grid;
            column-gap: var(--merch-card-collection-header-column-gap);
            row-gap: var(--merch-card-collection-header-row-gap);
            align-items: center;
            grid-template-columns: var(--merch-card-collection-header-columns);
            grid-template-areas: var(--merch-card-collection-header-areas);
            margin-bottom: var(--merch-card-collection-header-margin-bottom);
            max-width: var(--merch-card-collection-header-max-width);
        }

        #header:empty {
            margin-bottom: 0;
        }

        #search {
            grid-area: search;
        }

        #search sp-search {
            max-width: var(--merch-card-collection-header-search-max-width);
            width: 100%;
            min-height: var(--merch-card-collection-header-search-min-height);
        }

        #filter {
            grid-area: filter;
            --mod-actionbutton-edge-to-text: var(
                --merch-card-collection-header-filter-padding
            );
            --mod-actionbutton-height: var(
                --merch-card-collection-header-filter-height
            );
        }

        #filter slot[name='filtersText'] {
            font-size: var(--merch-card-collection-header-filter-font-size);
        }

        #sort {
            grid-area: sort;
            --mod-actionbutton-edge-to-text: var(
                --merch-card-collection-header-sort-padding
            );
            --mod-actionbutton-height: var(
                --merch-card-collection-header-sort-height
            );
        }

        #sort [slot='label-only'] {
            font-size: var(--merch-card-collection-header-sort-font-size);
        }

        #result {
            grid-area: result;
            font-size: var(--merch-card-collection-header-result-font-size);
        }

        #result[type='search'][quantity='none'] {
            font-size: inherit;
        }

        #custom {
            grid-area: custom;
        }

        /* tablets */
        @media screen and ${_s(R)} {
            :host {
                --merch-card-collection-header-max-width: auto;
                --merch-card-collection-header-columns: 1fr fit-content(100%)
                    fit-content(100%);
                --merch-card-collection-header-areas: 'search filter sort'
                    'result result result';
            }
        }

        /* Laptop */
        @media screen and ${_s(C)} {
            :host {
                --merch-card-collection-header-columns: 1fr fit-content(100%);
                --merch-card-collection-header-areas: 'result sort';
                --merch-card-collection-header-result-font-size: inherit;
            }
        }
    `);customElements.define("merch-card-collection-header",rr);export{Et as MerchCardCollection,rr as default};
