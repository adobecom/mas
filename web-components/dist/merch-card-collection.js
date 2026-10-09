var Qi=Object.defineProperty;var Zi=a=>{throw TypeError(a)};var nc=(a,r,e)=>r in a?Qi(a,r,{enumerable:!0,configurable:!0,writable:!0,value:e}):a[r]=e;var oc=(a,r)=>{for(var e in r)Qi(a,e,{get:r[e],enumerable:!0})};var m=(a,r,e)=>nc(a,typeof r!="symbol"?r+"":r,e),ha=(a,r,e)=>r.has(a)||Zi("Cannot "+e);var v=(a,r,e)=>(ha(a,r,"read from private field"),e?e.call(a):r.get(a)),k=(a,r,e)=>r.has(a)?Zi("Cannot add the same private member more than once"):r instanceof WeakSet?r.add(a):r.set(a,e),A=(a,r,e,t)=>(ha(a,r,"write to private field"),t?t.call(a,e):r.set(a,e),e),$=(a,r,e)=>(ha(a,r,"access private method"),e);import{html as Oe,LitElement as Ys,css as Ks,unsafeCSS as Ws,nothing as fe}from"./lit-all.min.js";var R="(max-width: 767px)",K="(max-width: 1199px)",S="(min-width: 768px)",L="(min-width: 1200px)",re="(min-width: 1600px)",je="(min-width: 1280px)",Xi="(min-width: 1440px)",Ji={matchMobile:window.matchMedia(R),matchDesktop:window.matchMedia(`${L} and (not ${re})`),matchDesktopOrUp:window.matchMedia(L),matchLargeDesktop:window.matchMedia(re),get isMobile(){return this.matchMobile.matches},get isDesktop(){return this.matchDesktop.matches},get isDesktopOrUp(){return this.matchDesktopOrUp.matches}},T=Ji;function Ar(){return Ji.isDesktop}var Bt=class{constructor(r,e){this.key=Symbol("match-media-key"),this.matches=!1,this.host=r,this.host.addController(this),this.media=window.matchMedia(e),this.matches=this.media.matches,this.onChange=this.onChange.bind(this),r.addController(this)}hostConnected(){var r;(r=this.media)==null||r.addEventListener("change",this.onChange)}hostDisconnected(){var r;(r=this.media)==null||r.removeEventListener("change",this.onChange)}onChange(r){this.matches!==r.matches&&(this.matches=r.matches,this.host.requestUpdate(this.key,!this.matches))}};var en="hashchange";function pa(a=window.location.hash){let r=[],e=a.replace(/^#/,"").split("&");for(let t of e){let[i,n=""]=t.split("=");i&&r.push([i,decodeURIComponent(n.replace(/\+/g," "))])}return Object.fromEntries(r)}function qt(a){let r=new URLSearchParams(window.location.hash.slice(1));Object.entries(a).forEach(([i,n])=>{n?r.set(i,n):r.delete(i)}),r.sort();let e=r.toString();if(e===window.location.hash)return;let t=window.scrollY||document.documentElement.scrollTop;window.location.hash=e,window.scrollTo(0,t)}function ma(a){let r=()=>{if(window.location.hash&&!window.location.hash.includes("="))return;let e=pa(window.location.hash);a(e)};return r(),window.addEventListener(en,r),()=>{window.removeEventListener(en,r)}}var Ha={};oc(Ha,{AUP_CHECKOUT_CLIENT_IDS:()=>Da,CLASS_NAME_FAILED:()=>ka,CLASS_NAME_HIDDEN:()=>cc,CLASS_NAME_PENDING:()=>Sa,CLASS_NAME_RESOLVED:()=>Ca,CheckoutWorkflow:()=>Ec,CheckoutWorkflowStep:()=>J,Commitment:()=>Ne,ERROR_MESSAGE_BAD_REQUEST:()=>Ta,ERROR_MESSAGE_MISSING_LITERALS_URL:()=>bc,ERROR_MESSAGE_OFFER_NOT_FOUND:()=>ot,EVENT_AEM_ERROR:()=>Ea,EVENT_AEM_LOAD:()=>wa,EVENT_COMPARE_CHART_REHYDRATE:()=>vc,EVENT_EXPANDED_GROUPS_CHANGE:()=>xc,EVENT_MAS_ERROR:()=>Aa,EVENT_MAS_READY:()=>Cr,EVENT_MERCH_ADDON_AND_QUANTITY_UPDATE:()=>va,EVENT_MERCH_CARD_ACTION_MENU_TOGGLE:()=>fa,EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED:()=>me,EVENT_MERCH_CARD_COLLECTION_SHOWMORE:()=>ba,EVENT_MERCH_CARD_COLLECTION_SIDENAV_ATTACHED:()=>Gt,EVENT_MERCH_CARD_COLLECTION_SORT:()=>xa,EVENT_MERCH_CARD_QUANTITY_CHANGE:()=>Sr,EVENT_MERCH_OFFER_READY:()=>hc,EVENT_MERCH_OFFER_SELECT_READY:()=>pc,EVENT_MERCH_QUANTITY_SELECTOR_CHANGE:()=>ae,EVENT_MERCH_SEARCH_CHANGE:()=>fc,EVENT_MERCH_SIDENAV_SELECT:()=>ya,EVENT_MERCH_STOCK_CHANGE:()=>uc,EVENT_MERCH_STORAGE_CHANGE:()=>gc,EVENT_OFFER_SELECTED:()=>mc,EVENT_TYPE_FAILED:()=>La,EVENT_TYPE_READY:()=>kr,EVENT_TYPE_RESOLVED:()=>ie,Env:()=>ve,FF_ANNUAL_PRICE:()=>st,FF_DEFAULTS:()=>Ce,HEADER_X_REQUEST_ID:()=>Vt,LOG_NAMESPACE:()=>Pa,Landscape:()=>Ie,MARK_DURATION_SUFFIX:()=>$a,MARK_START_SUFFIX:()=>Ia,MERCH_CARD_LOAD_TIMEOUT:()=>ua,MODAL_TYPE_3_IN_1:()=>xe,NAMESPACE:()=>sc,PARAM_AOS_API_KEY:()=>yc,PARAM_ENV:()=>Ma,PARAM_LANDSCAPE:()=>Ra,PARAM_MAS_PREVIEW:()=>_a,PARAM_WCS_API_KEY:()=>wc,PLACEHOLDER_PLAN_TYPE_TEXT:()=>Cc,PROVIDER_ENVIRONMENT:()=>Na,SELECTOR_MAS_CHECKOUT_LINK:()=>tn,SELECTOR_MAS_ELEMENT:()=>ga,SELECTOR_MAS_INLINE_PRICE:()=>O,SELECTOR_MAS_SP_BUTTON:()=>dc,SELECTOR_MAS_UPT_LINK:()=>rn,SORT_ORDER:()=>ge,STATE_FAILED:()=>ue,STATE_PENDING:()=>De,STATE_RESOLVED:()=>ne,SUPPORTED_COUNTRIES:()=>Fa,TAG_NAME_SERVICE:()=>lc,TEMPLATE_PRICE:()=>Ac,TEMPLATE_PRICE_ANNUAL:()=>Sc,TEMPLATE_PRICE_LEGAL:()=>G,TEMPLATE_PRICE_STRIKETHROUGH:()=>kc,TRIAL_ANALYTICS_IDS:()=>an,Term:()=>ce,WCS_PROD_URL:()=>za,WCS_STAGE_URL:()=>Oa});var Ne=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),ce=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"}),sc="merch",ua=2e4,cc="hidden",kr="wcms:commerce:ready",lc="mas-commerce-service",O='span[is="inline-price"][data-wcs-osi]',tn='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]',dc="sp-button[data-wcs-osi]",rn='a[is="upt-link"]',ga=`${O},${tn},${rn}`,an=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]),hc="merch-offer:ready",pc="merch-offer-select:ready",fa="merch-card:action-menu-toggle",mc="merch-offer:selected",uc="merch-stock:change",gc="merch-storage:change",ae="merch-quantity-selector:change",Sr="merch-card-quantity:change",va="merch-modal:addon-and-quantity-update",fc="merch-search:change",xa="merch-card-collection:sort",me="merch-card-collection:literals-changed",Gt="merch-card-collection:sidenav-attached",ba="merch-card-collection:showmore",ya="merch-sidenav:select",wa="aem:load",Ea="aem:error",Cr="mas:ready",Aa="mas:error",vc="mas-compare-chart:rehydrate",xc="expanded-groups-change",ka="placeholder-failed",Sa="placeholder-pending",Ca="placeholder-resolved",Ta="Bad WCS request",ot="Commerce offer not found",bc="Literals URL not provided",La="mas:failed",ie="mas:resolved",Pa="mas/commerce",_a="mas.preview",Ma="commerce.env",Ra="commerce.landscape",yc="commerce.aosKey",wc="commerce.wcsKey",za="https://www.adobe.com/web_commerce_artifact",Oa="https://www.stage.adobe.com/web_commerce_artifact_stage",ue="failed",De="pending",ne="resolved",Ie={DRAFT:"DRAFT",PUBLISHED:"PUBLISHED"},Vt="X-Request-Id",J=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"}),Ec="UCv3",ve=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"}),Na={PRODUCTION:"PRODUCTION"},xe={TWP:"twp",D2P:"d2p",CRM:"crm"},Da=new Set(["creative","mini_plans","doc_cloud","acom_bc"]),Ia=":start",$a=":duration",Ac="price",kc="price-strikethrough",Sc="annual",G="legal",Cc="plan-type-text",Ce="mas-ff-defaults",st="mas-ff-annual-price",ge={alphabetical:"alphabetical",authored:"authored"},Fa=["AE","AM","AR","AT","AU","AZ","BB","BD","BE","BG","BH","BO","BR","BS","BY","CA","CH","CL","CN","CO","CR","CY","CZ","DE","DK","DO","DZ","EC","EE","EG","ES","FI","FR","GB","GE","GH","GR","GT","HK","HN","HR","HU","ID","IE","IL","IN","IQ","IS","IT","JM","JO","JP","KE","KG","KR","KW","KZ","LA","LB","LK","LT","LU","LV","MA","MD","MO","MT","MU","MX","MY","NG","NI","NL","NO","NP","NZ","OM","PA","PE","PH","PK","PL","PR","PT","PY","QA","RO","RS","RU","SA","SE","SG","SI","SK","SV","TH","TJ","TM","TN","TR","TT","TW","TZ","UA","US","UY","UZ","VE","VN","YE","ZA"];var Tc="mas-commerce-service";function on(a,r){let e;return function(){let t=this,i=arguments;clearTimeout(e),e=setTimeout(()=>a.apply(t,i),r)}}var jt=(a,r)=>a?.querySelector(`[slot="${r}"]`)?.textContent?.trim();function be(a,r={},e=null,t=null){let i=t?document.createElement(a,{is:t}):document.createElement(a);e instanceof HTMLElement?i.appendChild(e):i.innerHTML=e;for(let[n,o]of Object.entries(r))i.setAttribute(n,o);return i}function Tr(a){return`startTime:${a.startTime.toFixed(2)}|duration:${a.duration.toFixed(2)}`}function qa(){return window.matchMedia("(max-width: 1024px)").matches}var Ua=new Map,Lc=0;function sn(a,r){let e=++Lc,t=r,i=performance.now(),n,o=()=>{Ga(e),a()},s=()=>{i=performance.now(),n=setTimeout(o,t)},c=()=>{document.visibilityState==="hidden"?(clearTimeout(n),t-=performance.now()-i):s()};return Ua.set(e,()=>{clearTimeout(n),document.removeEventListener("visibilitychange",c)}),document.addEventListener("visibilitychange",c),document.visibilityState!=="hidden"&&s(),e}function Ga(a){let r=Ua.get(a);r&&(r(),Ua.delete(a))}function Wt(){return document.getElementsByTagName(Tc)?.[0]}function Yt(a){let r=window.getComputedStyle(a);return a.offsetHeight+parseFloat(r.marginTop)+parseFloat(r.marginBottom)}var Pc=/^14257-merchatscale(-[a-z0-9-]+)?$/,_c=/^(14257-merchatscale(-[a-z0-9-]+)?)\.adobeioruntime\.net$/,Mc=/^[a-z0-9-]+$/,Rc=/^([a-z0-9-]+\.)+adobe\.com$/,zc="/api/v1/web/MerchAtScale",Ba=a=>`https://${a}.adobeioruntime.net${zc}`;function nn(a){let r=_c.exec(a)?.[1];if(r)return Ba(r);if(Rc.test(a))return`https://${a}/mas/io`}function cn(a){if(a){if(a.startsWith("https://"))try{return nn(new URL(a).hostname)}catch{return}return Pc.test(a)?Ba(a):Mc.test(a)?Ba(`14257-merchatscale-${a}`):nn(a)}}import{html as Lr,nothing as Oc}from"./lit-all.min.js";var ct,Kt=class Kt{constructor(r){m(this,"card");k(this,ct);this.card=r,this.insertVariantStyle()}getContainer(){return A(this,ct,v(this,ct)??this.card.closest('merch-card-collection, [class*="-merch-cards"]')??this.card.parentElement),v(this,ct)}insertVariantStyle(){let r=this.constructor.name;if(!Kt.styleMap[r]){Kt.styleMap[r]=!0;let e=document.createElement("style");e.innerHTML=this.getGlobalCSS(),document.head.appendChild(e)}}updateCardElementMinHeight(r,e){if(!r||this.card.heightSync===!1)return;let t=`--consonant-merch-card-${this.card.variant}-${e}-height`,i=Math.max(0,parseInt(window.getComputedStyle(r).height)||0),n=this.getContainer(),o=parseInt(n.style.getPropertyValue(t))||0;i>o&&n.style.setProperty(t,`${i}px`)}syncRowHeights(r){if(this.card.heightSync===!1)return;let e=this.getContainer();if(!e)return;let t=this.card.variant,i=Array.from(e.querySelectorAll(`merch-card[variant="${t}"]`)).filter(o=>o.variantLayout?.card?.heightSync!==!1);if(i.length===0)return;for(let{name:o}of r){let s=`--consonant-merch-card-${t}-${o}-height`;e.style.getPropertyValue(s)&&e.style.removeProperty(s)}let n=new Map;for(let o of i){let s=o.getBoundingClientRect();if(s.width<=2)continue;let c=Math.round(s.top),l=n.get(c);l||(l=[],n.set(c,l)),l.push(o)}for(let o of n.values())for(let{name:s,getElement:c}of r){let l=`--consonant-merch-card-${t}-${s}-height`,d=o.map(p=>p.style.getPropertyValue(l)),f=0,g=o.map(p=>{p.style.removeProperty(l);let h=c(p);if(!h)return h;let u=Math.max(0,parseInt(window.getComputedStyle(h).height)||0);return u>f&&(f=u),h});o.forEach((p,h)=>{g[h]?.tagName!=="HR"&&(f>0?p.style.setProperty(l,`${f}px`):d[h]&&p.style.setProperty(l,d[h]))})}}get legalDisplayDot(){return!0}get badge(){let r;if(!(!this.card.badgeBackgroundColor||!this.card.badgeColor||!this.card.badgeText))return this.evergreen&&(r=`border: 1px solid ${this.card.badgeBackgroundColor}; border-right: none;`),Lr`
            <div
                id="badge"
                class="${this.card.variant}-badge"
                style="background-color: ${this.card.badgeBackgroundColor};
                color: ${this.card.badgeColor};
                ${r}"
            >
                ${this.card.badgeText}
            </div>
        `}get cardImage(){return Lr` <div class="image">
            <slot name="bg-image"></slot>
            ${this.badge}
        </div>`}getGlobalCSS(){return""}get theme(){return document.querySelector("sp-theme")}get evergreen(){return this.card.classList.contains("intro-pricing")}get promoBottom(){return this.card.classList.contains("promo-bottom")}get headingSelector(){return'[slot="heading-xs"]'}get secureLabel(){return this.card.secureLabel?Lr`<span class="secure-transaction-label"
                  >${this.card.secureLabel}</span
              >`:Oc}get secureLabelFooter(){return Lr`<footer>
            ${this.secureLabel}<slot name="footer"></slot>
        </footer>`}async postCardUpdateHook(){if(this.card.isConnected&&(await this.card.updateComplete,this.card.prices?.length>0)){let r=Promise.allSettled(this.card.prices.map(i=>i.onceSettled?.()||Promise.resolve())),e,t=new Promise(i=>{e=setTimeout(i,ua)});await Promise.race([r,t]),clearTimeout(e)}}connectedCallbackHook(){}disconnectedCallbackHook(){}syncHeights(){}renderLayout(){}get aemFragmentMapping(){return Qt(this.card.variant)}};ct=new WeakMap,m(Kt,"styleMap",{});var w=Kt;import{html as Va,css as Nc}from"./lit-all.min.js";var ln=`
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

@media screen and ${R} {
    merch-card-collection-header.catalog {
        --merch-card-collection-header-columns: min-content auto;
    }
}

@media screen and ${S} {
    merch-card-collection-header.catalog {
        --merch-card-collection-header-column-gap: 16px;
    }
}

@media screen and ${L} {
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
}`;var dn={cardName:{attribute:"name"},badge:!0,ctas:{slot:"footer",size:"m"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},prices:{tag:"h3",slot:"heading-xs"},shortDescription:{tag:"div",slot:"action-menu-content",attributes:{tabindex:"0"}},size:["wide","super-wide"],title:{tag:"h3",slot:"heading-xs"}},lt=class extends w{constructor(e){super(e);m(this,"dispatchActionMenuToggle",()=>{this.card.dispatchEvent(new CustomEvent(fa,{bubbles:!0,composed:!0,detail:{card:this.card.name,type:"action-menu"}}))});m(this,"toggleActionMenu",e=>{!this.actionMenuContentSlot||!e||e.type!=="click"&&e.code!=="Space"&&e.code!=="Enter"||(e.preventDefault(),e.stopPropagation(),this.setMenuVisibility(!this.isMenuOpen()))});m(this,"toggleActionMenuFromCard",e=>{let t=e?.type==="mouseleave"?!0:void 0;this.card.blur(),this.setIconVisibility(!1),this.actionMenuContentSlot&&e?.type==="mouseleave"&&this.setMenuVisibility(!1)});m(this,"showActionMenuOnHover",()=>{this.actionMenu&&this.setIconVisibility(!0)});m(this,"hideActionMenu",()=>{this.setMenuVisibility(!1),this.setIconVisibility(!1)});m(this,"hideActionMenuOnBlur",e=>{e.relatedTarget===this.actionMenu||this.actionMenu?.contains(e.relatedTarget)||this.slottedContent?.contains(e.relatedTarget)||(this.isMenuOpen()&&this.setMenuVisibility(!1),this.card.contains(e.relatedTarget)||this.setIconVisibility(!1))});m(this,"handleCardFocusOut",e=>{e.relatedTarget===this.actionMenu||this.actionMenu?.contains(e.relatedTarget)||e.relatedTarget===this.card||(this.slottedContent&&(e.target===this.slottedContent||this.slottedContent.contains(e.target))&&(this.slottedContent.contains(e.relatedTarget)||this.setMenuVisibility(!1)),!this.card.contains(e.relatedTarget)&&!this.isMenuOpen()&&this.setIconVisibility(!1))});m(this,"handleKeyDown",e=>{(e.key==="Escape"||e.key==="Esc")&&(e.preventDefault(),this.hideActionMenu(),this.actionMenu?.focus())})}get actionMenu(){return this.card.shadowRoot.querySelector(".action-menu")}get actionMenuContentSlot(){return this.card.shadowRoot.querySelector('slot[name="action-menu-content"]')}get slottedContent(){return this.card.querySelector('[slot="action-menu-content"]')}setIconVisibility(e){if(this.slottedContent){if(qa()&&this.card.actionMenu)return;this.actionMenu?.classList.toggle("invisible",!e),this.actionMenu?.classList.toggle("always-visible",e)}}setMenuVisibility(e){this.actionMenuContentSlot?.classList.toggle("hidden",!e),this.setAriaExpanded(this.actionMenu,e.toString()),e&&(this.dispatchActionMenuToggle(),setTimeout(()=>{let t=this.slottedContent?.querySelector("a");t&&t.focus()},0))}isMenuOpen(){return!this.actionMenuContentSlot?.classList.contains("hidden")}renderLayout(){return Va` <div class="body">
                <div class="top-section">
                    <slot name="icons"></slot> ${this.badge}
                    <div
                        class="action-menu
                ${this.slottedContent?qa()&&this.card.actionMenu?"always-visible":"invisible":"hidden"}"
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
                ${this.promoBottom?"":Va`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`}
                <slot name="body-xs"></slot>
                ${this.promoBottom?Va`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`:""}
            </div>
            ${this.secureLabelFooter}
            <slot></slot>`}getGlobalCSS(){return ln}setAriaExpanded(e,t){e.setAttribute("aria-expanded",t)}connectedCallbackHook(){this.card.addEventListener("mouseenter",this.showActionMenuOnHover),this.card.addEventListener("mouseleave",this.toggleActionMenuFromCard),this.card.addEventListener("focusin",this.showActionMenuOnHover),this.card.addEventListener("focusout",this.handleCardFocusOut),this.card.addEventListener("keydown",this.handleKeyDown)}disconnectedCallbackHook(){this.card.removeEventListener("mouseenter",this.showActionMenuOnHover),this.card.removeEventListener("mouseleave",this.toggleActionMenuFromCard),this.card.removeEventListener("focusin",this.showActionMenuOnHover),this.card.removeEventListener("focusout",this.handleCardFocusOut),this.card.removeEventListener("keydown",this.handleKeyDown)}};m(lt,"variantStyle",Nc`
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
    `);import{html as Zt,css as Dc}from"./lit-all.min.js";var hn=`
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

@media screen and ${S} {
  .two-merch-cards.image,
  .three-merch-cards.image,
  .four-merch-cards.image,
  .two-merch-cards:has(merch-card[variant="image"]),
  .three-merch-cards:has(merch-card[variant="image"]),
  .four-merch-cards:has(merch-card[variant="image"]) {
      grid-template-columns: repeat(2, minmax(300px, var(--consonant-merch-card-image-width)));
  }
}

@media screen and ${L} {
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
`;var pn={cardName:{attribute:"name"},badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},badgeIcon:!0,borderColor:{attribute:"border-color"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],ctas:{slot:"footer",size:"m"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},prices:{tag:"h3",slot:"heading-xs"},promoText:{tag:"p",slot:"promo-text"},size:["wide","super-wide"],title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"body-xxs"},backgroundImage:{tag:"div",slot:"bg-image"}},We=class extends w{constructor(r){super(r)}getGlobalCSS(){return hn}renderLayout(){return Zt`<div class="image">
                <slot name="bg-image"></slot>
                <slot name="badge"></slot>
            </div>
            <div class="body">
                <slot name="icons"></slot>
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${this.promoBottom?Zt`<slot name="body-xs"></slot
                          ><slot name="promo-text"></slot>`:Zt`<slot name="promo-text"></slot
                          ><slot name="body-xs"></slot>`}
            </div>
            ${this.evergreen?Zt`
                      <div
                          class="detail-bg-container"
                          style="background: ${this.card.detailBg}"
                      >
                          <slot name="detail-bg"></slot>
                      </div>
                  `:Zt`
                      <hr />
                      ${this.secureLabelFooter}
                  `}`}};m(We,"variantStyle",Dc`
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
    `);import{html as un}from"./lit-all.min.js";var mn=`
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

@media screen and ${S} {
  .two-merch-cards.inline-heading,
  .three-merch-cards.inline-heading,
  .four-merch-cards.inline-heading,
  .two-merch-cards:has(merch-card[variant="inline-heading"]),
  .three-merch-cards:has(merch-card[variant="inline-heading"]),
  .four-merch-cards:has(merch-card[variant="inline-heading"]) {
      grid-template-columns: repeat(2, var(--consonant-merch-card-inline-heading-width));
  }
}

@media screen and ${L} {
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

@media screen and ${re} {
  .four-merch-cards.inline-heading,
  .four-merch-cards:has(merch-card[variant="inline-heading"]) {
      grid-template-columns: repeat(4, var(--consonant-merch-card-inline-heading-width));
  }
}
`;var Pr=class extends w{constructor(r){super(r)}getGlobalCSS(){return mn}renderLayout(){return un` ${this.badge}
            <div class="body">
                <div class="top-section">
                    <slot name="icons"></slot>
                    <slot name="heading-xs"></slot>
                </div>
                <slot name="body-xs"></slot>
            </div>
            ${this.card.customHr?"":un`<hr />`} ${this.secureLabelFooter}`}};import{html as $e,css as Ic,unsafeCSS as fn}from"./lit-all.min.js";var gn=`
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
@media screen and ${R} {
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

@media screen and ${K} {
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
@media screen and ${S} {
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
@media screen and ${L} {
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

@media screen and ${re} {
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
`;var $c=32,ja={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m-price"},promoText:{tag:"div",slot:"promo-text"},shortDescription:{tag:"div",slot:"body-xxs"},description:{tag:"div",slot:"body-m"},mnemonics:{size:"l"},quantitySelect:{tag:"div",slot:"quantity-select"},callout:{tag:"div",slot:"callout-content"},addon:!0,secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],whatsIncludedDividerColor:{attribute:"whats-included-divider-color"},allowedWhatsIncludedDividerColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],whatsIncluded:{tag:"div",slot:"footer-rows"},ctas:{slot:"footer",size:"l"},style:"consonant"};function Xt(a,r,e,t){a.settings?.displayAnnual&&r?.options[t]?e.dataset[t]="false":r?.options[t]&&(r.dataset[t]="false")}var dt=class extends w{constructor(e){super(e);m(this,"getRowMinHeightPropertyName",e=>`--consonant-merch-card-footer-row-${e}-min-height`);m(this,"getMiniCompareFooter",()=>{let e=this.card.secureLabel?$e`<slot name="secure-transaction-label">
                  <span class="secure-transaction-label"
                      >${this.card.secureLabel}</span
                  ></slot
              >`:$e`<slot name="secure-transaction-label"></slot>`;return this.isNewVariant?$e`<footer>
                ${e}
                <p class="action-area"><slot name="footer"></slot></p>
            </footer>`:$e`<footer>${e}<slot name="footer"></slot></footer>`});this.updatePriceQuantity=this.updatePriceQuantity.bind(this)}connectedCallbackHook(){if(this.card.addEventListener(ae,this.updatePriceQuantity),this.legalAdjusted&&!this.legalObserver){let e=this.card.querySelector('[is="inline-price"][data-template="legal"]');e?(this.legalResolvedHandler=()=>this.adjustShortDescription(),e.addEventListener(ie,this.legalResolvedHandler),this.legalElement=e,this.legalObserver=new MutationObserver(()=>this.adjustShortDescription()),this.legalObserver.observe(e,{childList:!0,subtree:!0}),this.adjustShortDescription()):this.legalAdjusted=!1}this.visibilityObserver=new IntersectionObserver(([e])=>{e.boundingClientRect.height!==0&&e.isIntersecting&&(T.isMobile||requestAnimationFrame(()=>{let t=this.getContainer();if(!t)return;t.querySelectorAll('merch-card[variant="mini-compare-chart"]').forEach(n=>n.variantLayout?.syncHeights?.())}),this.visibilityObserver.disconnect())}),this.visibilityObserver.observe(this.card)}disconnectedCallbackHook(){if(this.card.removeEventListener(ae,this.updatePriceQuantity),this.visibilityObserver?.disconnect(),this.legalObserver?.disconnect(),this.legalObserver=null,this.legalElement&&this.legalResolvedHandler&&(this.legalElement.removeEventListener(ie,this.legalResolvedHandler),this.legalResolvedHandler=null,this.legalElement=null),this.calloutListenersAdded){document.removeEventListener("touchstart",this.handleCalloutTouch),document.removeEventListener("mouseover",this.handleCalloutMouse);let e=this.card.querySelector('[slot="callout-content"] .icon-button');e?.removeEventListener("focusin",this.handleCalloutFocusin),e?.removeEventListener("focusout",this.handleCalloutFocusout),e?.removeEventListener("keydown",this.handleCalloutKeydown),this.calloutListenersAdded=!1}}updatePriceQuantity({detail:e}){!this.mainPrice||!e?.option||(this.mainPrice.dataset.quantity=e.option)}priceOptionsProvider(e,t){let i=ja.prices.slot;if(e.closest(`[slot="${i}"]`)&&this.isNewVariant){if(e.dataset.template===G){t.displayPlanType=this.card?.settings?.displayPlanType??!1;return}(e.dataset.template==="strikethrough"||e.dataset.template==="price"&&!e.closest?.("merch-card")?.settings?.displayAnnual)&&(t.displayPerUnit=!1)}}getGlobalCSS(){return gn}adjustMiniCompareBodySlots(){if(this.card.getBoundingClientRect().width<=2)return;this.updateCardElementMinHeight(this.card.shadowRoot.querySelector(".top-section"),"top-section");let e=["heading-m","heading-xs","subtitle","body-m","heading-m-price","body-xxs","price-commitment","quantity-select","offers","promo-text","callout-content","addon"];this.card.classList.contains("bullet-list")&&e.push("footer-rows"),e.forEach(i=>this.updateCardElementMinHeight(this.card.shadowRoot.querySelector(`slot[name="${i}"]`),i)),this.updateCardElementMinHeight(this.card.shadowRoot.querySelector("footer"),"footer"),this.card.shadowRoot.querySelector(".mini-compare-chart-badge")?.textContent!==""&&this.getContainer().style.setProperty("--consonant-merch-card-mini-compare-chart-top-section-mobile-height","32px")}adjustMiniCompareFooterRows(){if(this.card.getBoundingClientRect().width===0)return;let e;if(this.isNewVariant){let t=this.card.querySelector("merch-whats-included");if(!t)return;e=[...t.querySelectorAll('[slot="content"] merch-mnemonic-list')]}else{let t=this.card.querySelector('[slot="footer-rows"] ul');if(!t||!t.children)return;e=[...t.children]}e.length&&e.forEach((t,i)=>{let n=Math.max($c,parseFloat(window.getComputedStyle(t).height)||0),o=parseFloat(this.getContainer().style.getPropertyValue(this.getRowMinHeightPropertyName(i+1)))||0;n>o&&this.getContainer().style.setProperty(this.getRowMinHeightPropertyName(i+1),`${n}px`)})}removeEmptyRows(){this.isNewVariant?this.card.querySelectorAll('merch-whats-included [slot="content"] merch-mnemonic-list').forEach(t=>{if(t.hasAttribute("data-placeholder"))return;let i=t.querySelector('[slot="icon"]'),n=!!i?.querySelector(".sp-icon")||!!i?.querySelector('merch-icon[src]:not([src=""]), img[src]:not([src=""])'),s=t.querySelector('[slot="description"]')?.textContent?.replace(/\u00a0/g," ")?.trim()??"";!n&&!s&&t.remove()}):this.card.querySelectorAll(".footer-row-cell").forEach(t=>{if(t.hasAttribute("data-placeholder"))return;let i=t.querySelector(".footer-row-cell-description");i&&!i.textContent.trim()&&t.remove()})}padFooterRows(){let e=this.getContainer();if(!e)return;let t=e.querySelectorAll('merch-card[variant="mini-compare-chart"]');if(this.isNewVariant){let i=0;if(t.forEach(l=>{let d=l.querySelector("merch-whats-included");if(!d)return;let f=d.querySelectorAll('[slot="content"] merch-mnemonic-list:not([data-placeholder])');i=Math.max(i,f.length)}),i===0)return;let n=this.card.querySelector("merch-whats-included");if(!n)return;let o=n.querySelector('[slot="content"]');if(!o)return;o.querySelectorAll("merch-mnemonic-list[data-placeholder]").forEach(l=>l.remove());let s=o.querySelectorAll("merch-mnemonic-list").length,c=i-s;for(let l=0;l<c;l++){let d=document.createElement("merch-mnemonic-list");d.setAttribute("data-placeholder","");let f=document.createElement("div");f.setAttribute("slot","icon");let g=document.createElement("div");g.setAttribute("slot","description"),d.append(f,g),o.appendChild(d)}}else{let i=0;if(t.forEach(c=>{let l=c.querySelector('[slot="footer-rows"] ul');if(!l)return;let d=l.querySelectorAll("li.footer-row-cell:not([data-placeholder])");i=Math.max(i,d.length)}),i===0)return;let n=this.card.querySelector('[slot="footer-rows"] ul');if(!n)return;n.querySelectorAll("li.footer-row-cell[data-placeholder]").forEach(c=>c.remove());let o=n.querySelectorAll("li.footer-row-cell").length,s=i-o;for(let c=0;c<s;c++){let l=document.createElement("li");l.className="footer-row-cell",l.setAttribute("data-placeholder",""),n.appendChild(l)}}}get mainPrice(){return this.card.querySelector(`[slot="heading-m-price"] ${O}[data-template="price"]`)}get headingMPriceSlot(){return this.card.shadowRoot?.querySelector('slot[name="heading-m-price"]')?.assignedElements()[0]}get isNewVariant(){return!!this.card.querySelector("merch-whats-included")}toggleAddon(e){let t=this.mainPrice,i=this.headingMPriceSlot;if(!t&&i){let n=e?.getAttribute("plan-type"),o=null;if(e&&n&&(o=e.querySelector(`p[data-plan-type="${n}"]`)?.querySelector('span[is="inline-price"]')),this.card.querySelectorAll('p[slot="heading-m-price"]').forEach(s=>s.remove()),e.checked){if(o){let s=be("p",{class:"addon-heading-m-price-addon",slot:"heading-m-price"},o.innerHTML);this.card.appendChild(s)}}else{let s=be("p",{class:"card-heading",id:"free",slot:"heading-m-price"},"Free");this.card.appendChild(s)}}}showTooltip(e){e.classList.remove("hide-tooltip"),e.setAttribute("aria-expanded","true")}hideTooltip(e){e.classList.add("hide-tooltip"),e.setAttribute("aria-expanded","false")}adjustCallout(){let e=this.card.querySelector('[slot="callout-content"] .icon-button');if(!e||this.calloutListenersAdded)return;let t=e.title||e.dataset.tooltip;if(!t)return;e.title&&(e.dataset.tooltip=e.title,e.removeAttribute("title"));let i=e.parentElement;if(i&&i.tagName==="P"){let n=document.createElement("div"),o=document.createElement("div");o.className="callout-row";let s=document.createElement("div");for(s.className="callout-text";i.firstChild&&i.firstChild!==e;)s.appendChild(i.firstChild);o.appendChild(s),o.appendChild(e),n.appendChild(o),i.replaceWith(n)}e.setAttribute("role","button"),e.setAttribute("tabindex","0"),e.setAttribute("aria-label",t),e.setAttribute("aria-expanded","false"),this.hideTooltip(e),this.handleCalloutTouch=n=>{n.target!==e?this.hideTooltip(e):e.classList.contains("hide-tooltip")?this.showTooltip(e):this.hideTooltip(e)},this.handleCalloutMouse=n=>{n.target!==e?this.hideTooltip(e):this.showTooltip(e)},this.handleCalloutFocusin=()=>{this.showTooltip(e)},this.handleCalloutFocusout=()=>{this.hideTooltip(e)},this.handleCalloutKeydown=n=>{n.key==="Escape"&&(this.hideTooltip(e),e.blur())},document.addEventListener("touchstart",this.handleCalloutTouch),document.addEventListener("mouseover",this.handleCalloutMouse),e.addEventListener("focusin",this.handleCalloutFocusin),e.addEventListener("focusout",this.handleCalloutFocusout),e.addEventListener("keydown",this.handleCalloutKeydown),this.calloutListenersAdded=!0}async adjustAddon(){await this.card.updateComplete;let e=this.card.addon;if(!e)return;let t=this.mainPrice,i=this.card.planType;if(t&&(await t.onceSettled?.(),i=t.value?.[0]?.planType),!i)return;e.planType=i,this.card.querySelector("merch-addon[plan-type]")?.updateComplete.then(()=>{this.updateCardElementMinHeight(this.card.shadowRoot.querySelector('slot[name="addon"]'),"addon")})}async adjustLegal(){if(this.legalAdjusted||this.legalAdjusting)return;this.legalAdjusting=!0;let e;try{await this.card.updateComplete,await customElements.whenDefined("inline-price");let t=this.mainPrice;if(!t||(await t.onceSettled(),!t?.options))return;e=t.cloneNode(!0),t.options.displayPlanType&&(t.dataset.displayPlanType="false"),Xt(this.card,t,e,"displayTax"),Xt(this.card,t,e,"displayPerUnit"),e.setAttribute("data-template","legal"),this.legalResolvedHandler||(this.legalResolvedHandler=()=>this.adjustShortDescription(),e.addEventListener(ie,this.legalResolvedHandler),this.legalElement=e),t.parentNode.insertBefore(e,t.nextSibling),this.legalAdjusted=!0,await e.onceSettled(),this.legalObserver=new MutationObserver(()=>this.adjustShortDescription()),this.legalObserver.observe(e,{childList:!0,subtree:!0})}catch{e?.parentNode&&(e.parentNode.removeChild(e),this.legalAdjusted=!1,this.legalResolvedHandler=null,this.legalElement=null)}finally{this.legalAdjusting=!1}}getOrCreateFallbackPlanType(){let e=this.headingMPriceSlot;if(!e)return null;let t=e.querySelector(".price-legal[data-fallback]");if(!t){t=document.createElement("span"),t.className="price price-legal",t.dataset.fallback="true";let i=document.createElement("span");i.className="price-plan-type disabled",t.appendChild(i),e.appendChild(t)}return t.querySelector(".price-plan-type")}adjustShortDescription(){let t=this.card.querySelector('[is="inline-price"][data-template="legal"]')?.querySelector(".price-plan-type"),i=this.headingMPriceSlot?.querySelector(".price-legal[data-fallback]"),n=i?.querySelector(".price-plan-type");if(t&&n){let l=n.querySelector("em");l&&!t.querySelector("em")&&t.appendChild(l),i.remove()}let o=this.card.querySelector('[slot="body-xxs"]');if(o){let l=o.textContent?.trim(),d=!!o.querySelector(".icon-button");(l||d)&&(this.shortDescriptionHTML=o.innerHTML,o.remove())}if(!this.shortDescriptionHTML)return;let s=t??this.getOrCreateFallbackPlanType();if(!s||s.querySelector("em"))return;let c=document.createElement("em");c.innerHTML=` ${this.shortDescriptionHTML}`,s.appendChild(c)}renderLayout(){return this.isNewVariant?$e` <div class="top-section${this.badge?" badge":""}">
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
            <slot name="footer-rows"><slot name="body-s"></slot></slot>`:$e` <div class="top-section${this.badge?" badge":""}">
                    <slot name="icons"></slot> ${this.badge}
                </div>
                <slot name="heading-m"></slot>
                ${this.card.classList.contains("bullet-list")?$e`<slot name="heading-m-price"></slot>
                          <slot name="price-commitment"></slot>
                          <slot name="body-xxs"></slot>
                          <slot name="promo-text"></slot>
                          <slot name="body-m"></slot>
                          <slot name="offers"></slot>`:$e`<slot name="body-m"></slot>
                          <slot name="heading-m-price"></slot>
                          <slot name="body-xxs"></slot>
                          <slot name="price-commitment"></slot>
                          <slot name="offers"></slot>
                          <slot name="promo-text"></slot> `}
                <slot name="callout-content"></slot>
                <slot name="addon"></slot>
                ${this.getMiniCompareFooter()}
                <slot name="footer-rows"><slot name="body-s"></slot></slot>`}syncHeights(){this.card.getBoundingClientRect().width<=2||(this.adjustMiniCompareBodySlots(),this.adjustMiniCompareFooterRows())}async postCardUpdateHook(){if(await super.postCardUpdateHook(),this.isNewVariant&&(this.legalAdjusted||await this.adjustLegal(),this.adjustShortDescription(),this.adjustCallout()),await this.adjustAddon(),this.isNewVariant&&this.removeEmptyRows(),T.isMobile)this.isNewVariant||this.removeEmptyRows();else{this.padFooterRows();let e=this.getContainer();if(!e)return;let t=e.style.getPropertyValue("--consonant-merch-card-footer-row-1-min-height");requestAnimationFrame(t?()=>{this.syncHeights()}:()=>{e.querySelectorAll('merch-card[variant="mini-compare-chart"]').forEach(n=>n.variantLayout?.syncHeights?.())})}}};m(dt,"variantStyle",Ic`
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

        @media screen and ${fn(K)} {
            [class*'-merch-cards']
                :host([variant='mini-compare-chart'])
                footer {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
        }

        @media screen and ${fn(L)} {
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
    `);import{html as _r,css as Fc,unsafeCSS as Wa,nothing as Hc}from"./lit-all.min.js";var vn=`
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
@media screen and ${R} {
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

@media screen and ${K} {
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
@media screen and ${S} {
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
@media screen and ${L} {
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

@media screen and ${re} {
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
`;var Uc=32,Bc=0,qc=()=>`mweb-list-${Bc+=1}`,Gc=["heading-xs","subtitle","heading-m-price","promo-text","body-m","body-xs"],Vc=8,Qa={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m-price"},promoText:{tag:"div",slot:"promo-text"},shortDescription:{tag:"div",slot:"body-m"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],ctas:{slot:"footer",size:"l"},style:"consonant"},ye,Ye,pt,mt,ut,Fe,Ya,Ka,ht=class extends w{constructor(e){super(e);k(this,Fe);k(this,ye);k(this,Ye);k(this,pt);k(this,mt,0);k(this,ut);m(this,"getRowMinHeightPropertyName",e=>`--consonant-merch-card-footer-row-${e}-min-height`);m(this,"getMiniCompareFooter",()=>_r` <footer>
            <slot name="secure-transaction-label">
                <span class="secure-transaction-label-text"
                    >${this.secureLabel}</span
                >
            </slot>
            <p class="action-area">
                <slot name="footer"></slot>
            </p>
        </footer>`);m(this,"getMiniCompareFooterRows",()=>_r` <div class="footer-rows-container">
            <slot name="body-xs"></slot>
            <slot name="footer-rows"></slot>
        </div>`);this.updatePriceQuantity=this.updatePriceQuantity.bind(this)}connectedCallbackHook(){this.card.addEventListener(ae,this.updatePriceQuantity),A(this,mt,this.card.getBoundingClientRect().width),A(this,Ye,new ResizeObserver(()=>{let e=this.card.getBoundingClientRect().width;e!==v(this,mt)&&(A(this,mt,e),clearTimeout(v(this,pt)),A(this,pt,setTimeout(()=>this.reconcileBreakpoint(),150)))})),v(this,Ye).observe(this.card)}disconnectedCallbackHook(){this.card.removeEventListener(ae,this.updatePriceQuantity),clearTimeout(v(this,pt)),v(this,Ye)?.disconnect(),A(this,Ye,null),v(this,ye)?.disconnect(),A(this,ye,null)}reconcileBreakpoint(){T.isMobile?(this.resetSyncedHeights(),this.removeEmptyRows()):$(this,Fe,Ka).call(this)}updatePriceQuantity({detail:e}){!this.mainPrice||!e?.option||(this.mainPrice.dataset.quantity=e.option)}syncHeights(){if(T.isMobile)return;if(this.card.getBoundingClientRect().width<=2){v(this,ye)||(A(this,ye,new ResizeObserver(()=>{this.card.getBoundingClientRect().width>2&&(v(this,ye)?.disconnect(),A(this,ye,null),this.syncHeights())})),v(this,ye).observe(this.card));return}let e=["heading-xs","subtitle","heading-m-price","promo-text","body-m","body-xs"];this.syncRowHeights(e.map(t=>({name:t,getElement:i=>i.querySelector(`[slot="${t}"]`)}))),this.adjustMiniCompareFooterRows()}priceOptionsProvider(e,t){let i=Qa.prices.slot;if(e.closest(`[slot="${i}"]`)){if(e.dataset.template===G){t.displayPlanType=this.card?.settings?.displayPlanType??!1;return}(e.dataset.template==="strikethrough"||e.dataset.template==="price"&&!e.closest?.("merch-card")?.settings?.displayAnnual)&&(t.displayPerUnit=!1)}}getGlobalCSS(){return vn}adjustMiniCompareFooterRows(){if(this.card.getBoundingClientRect().width===0)return;let e=this.card.querySelector('[slot="footer-rows"] ul');!e||!e.children||[...e.children].forEach((t,i)=>{let n=Math.max(Uc,parseFloat(window.getComputedStyle(t).height)||0),o=parseFloat(this.getContainer().style.getPropertyValue(this.getRowMinHeightPropertyName(i+1)))||0;n>o&&this.getContainer().style.setProperty(this.getRowMinHeightPropertyName(i+1),`${n}px`)})}removeEmptyRows(){this.card.querySelectorAll(".footer-row-cell").forEach(t=>{let i=t.querySelector(".footer-row-cell-description");i&&!i.textContent.trim()&&t.remove()})}setupToggle(){let e=this.card.querySelector('[slot="body-xs"]'),t=e?.querySelector("p"),i=e?.querySelector("ul");if(!t||!i||e.querySelector(".footer-rows-title"))return;let n=t.textContent.trim(),o=this.card.querySelector("h3")?.id,s=o?`${o}-list`:qc();i.id=s,i.classList.add("checkmark-copy-container");let c=be("h4",{class:"footer-rows-title"},n),l=be("button",{class:"toggle-icon","aria-label":n,"aria-expanded":"false","aria-controls":s});A(this,ut,{toggleBtn:l,listEl:i}),c.append(l),c.addEventListener("click",()=>{T.isMobile&&this.setListOpen(!this.isListOpen)}),t.replaceWith(c)}get isListOpen(){return v(this,ut)?.listEl.classList.contains("open")??!1}setListOpen(e){let{toggleBtn:t,listEl:i}=v(this,ut);i.classList.toggle("open",e),t.classList.toggle("expanded",e),t.setAttribute("aria-expanded",String(e))}get legalDisplayDot(){return!1}get mainPrice(){return this.card.querySelector(`[slot="heading-m-price"] ${O}[data-template="price"]`)}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let e=this.mainPrice;if(!e)return;let t=e.cloneNode(!0);if(await e.onceSettled(),!e?.options)return;e.options.displayPlanType&&(e.dataset.displayPlanType="false"),Xt(this.card,e,t,"displayTax"),Xt(this.card,e,t,"displayPerUnit"),t.setAttribute("data-template","legal"),e.parentNode.insertBefore(t,e.nextSibling),await t.onceSettled()}catch{}}get icons(){return!this.card.querySelector('[slot="icons"]')&&!this.card.getAttribute("id")?Hc:_r`<slot name="icons"></slot>`}renderLayout(){return _r`
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
        `}async postCardUpdateHook(){this.legalAdjusted||await this.adjustLegal(),this.setupToggle(),T.isMobile&&this.removeEmptyRows(),await super.postCardUpdateHook(),T.isMobile||await $(this,Fe,Ka).call(this)}resetSyncedHeights(){let e=this.getContainer();if(!e)return;let t=this.card.variant,i=$(this,Fe,Ya).call(this,e);for(let n of Gc){let o=`--consonant-merch-card-${t}-${n}-height`;e.style.removeProperty(o),i.forEach(s=>s.style.removeProperty(o))}for(let n=1;n<=Vc;n+=1)e.style.removeProperty(this.getRowMinHeightPropertyName(n))}};ye=new WeakMap,Ye=new WeakMap,pt=new WeakMap,mt=new WeakMap,ut=new WeakMap,Fe=new WeakSet,Ya=function(e){return e.querySelectorAll(`merch-card[variant="${this.card.variant}"]`)},Ka=async function(){let e=this.getContainer();if(!e)return;let t=Array.from($(this,Fe,Ya).call(this,e));this.card===t[0]&&(await Promise.all(t.map(i=>i.updateComplete)),await new Promise(i=>setTimeout(i,100)),requestAnimationFrame(()=>{this.resetSyncedHeights(),this.syncHeights()}))},m(ht,"variantStyle",Fc`
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

        @media screen and ${Wa(K)} {
            [class*'-merch-cards']
                :host([variant='mini-compare-chart-mweb'])
                footer {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
        }

        @media screen and ${Wa(L)} {
            :host([variant='mini-compare-chart-mweb']) footer {
                padding: 0;
            }
        }

        @media screen and ${Wa(S)} {
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
    `);import{html as Jt,css as jc,nothing as Mr}from"./lit-all.min.js";var xn=`
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
@media screen and ${R} {
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
@media screen and ${S} {
    :root {
        --consonant-merch-card-plans-students-width: 486px;
    }

    .four-merch-cards.plans .foreground {
        max-width: unset;
    }
}

@media screen and ${K} {
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
@media screen and ${L} {
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
@media screen and ${re} {
    .columns .four-merch-cards.plans {
        grid-template-columns: repeat(2, var(--consonant-merch-card-plans-width));
    }

    merch-sidenav.plans {
        --merch-sidenav-collection-gap: 54px;
    }
}
`;var Rr={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},addon:!0,secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],whatsIncluded:{tag:"div",slot:"whats-included"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},bn={...(function(){let{whatsIncluded:a,size:r,...e}=Rr;return e})(),title:{tag:"h3",slot:"heading-s"},secureLabel:!1},yn={...(function(){let{subtitle:a,whatsIncluded:r,size:e,quantitySelect:t,...i}=Rr;return i})()},we,Ee,oe=class extends w{constructor(e){super(e);k(this,we);k(this,Ee);this.adaptForMedia=this.adaptForMedia.bind(this)}priceOptionsProvider(e,t){e.dataset.template===G&&(t.displayPlanType=this.card?.settings?.displayPlanType??!1)}getGlobalCSS(){return xn}adjustSlotPlacement(e,t,i){let n=this.card.shadowRoot,o=n.querySelector("footer"),s=this.card.getAttribute("size");if(!s)return;let c=n.querySelector(`footer slot[name="${e}"]`),l=n.querySelector(`.body slot[name="${e}"]`),d=n.querySelector(".body");if(s.includes("wide")||(o?.classList.remove("wide-footer"),c&&c.remove()),!!t.includes(s)){if(o?.classList.toggle("wide-footer",T.isDesktopOrUp),!i&&c){if(l)c.remove();else{let f=d.querySelector(`[data-placeholder-for="${e}"]`);f?f.replaceWith(c):d.appendChild(c)}return}if(i&&l){let f=document.createElement("div");if(f.setAttribute("data-placeholder-for",e),f.classList.add("slot-placeholder"),!c){let g=l.cloneNode(!0);o.prepend(g)}l.replaceWith(f)}}}adaptForMedia(){if(!this.card.closest("merch-card-collection,overlay-trigger,.two-merch-cards,.three-merch-cards,.four-merch-cards, .columns")){this.card.removeAttribute("size");return}this.adjustSlotPlacement("addon",["super-wide"],T.isDesktopOrUp),this.adjustSlotPlacement("callout-content",["super-wide"],T.isDesktopOrUp)}adjustCallout(){let e=this.card.querySelector('[slot="callout-content"] .icon-button');e&&e.title&&(e.dataset.tooltip=e.title,e.removeAttribute("title"),e.classList.add("hide-tooltip"),document.addEventListener("touchstart",t=>{t.preventDefault(),t.target!==e?e.classList.add("hide-tooltip"):t.target.classList.toggle("hide-tooltip")}),document.addEventListener("mouseover",t=>{t.preventDefault(),t.target!==e?e.classList.add("hide-tooltip"):t.target.classList.remove("hide-tooltip")}))}syncHeights(){if(this.card.getBoundingClientRect().width<=2){v(this,we)||(A(this,we,new ResizeObserver(()=>{this.card.getBoundingClientRect().width>2&&(v(this,we)?.disconnect(),A(this,we,null),this.syncHeights())})),v(this,we).observe(this.card));return}let e=["heading-xs","subtitle","heading-m","promo-text","body-xs"];this.syncRowHeights(e.map(t=>({name:t,getElement:i=>i.querySelector(`[slot="${t}"]`)})))}async adjustEduLists(){if(this.card.variant!=="plans-education"||this.card.querySelector(".spacer"))return;let t=this.card.querySelector('[slot="body-xs"]');if(!t)return;let i=t.querySelector("ul");if(!i)return;let n=i.previousElementSibling,o=document.createElement("div");o.classList.add("spacer"),t.insertBefore(o,n);let s=new IntersectionObserver(([c])=>{if(c.boundingClientRect.height===0)return;let l=0,d=this.card.querySelector('[slot="heading-s"]');d&&(l+=Yt(d));let f=this.card.querySelector('[slot="subtitle"]');f&&(l+=Yt(f));let g=this.card.querySelector('[slot="heading-m"]');g&&(l+=8+Yt(g));for(let h of t.childNodes){if(h.classList.contains("spacer"))break;l+=Yt(h)}let p=this.card.parentElement.style.getPropertyValue("--merch-card-plans-edu-list-max-offset");l>(parseFloat(p)||0)&&this.card.parentElement.style.setProperty("--merch-card-plans-edu-list-max-offset",`${l}px`),this.card.style.setProperty("--merch-card-plans-edu-list-offset",`${l}px`),s.disconnect()});s.observe(this.card)}async postCardUpdateHook(){this.adaptForMedia(),this.adjustAddon(),this.adjustCallout(),this.legalAdjusted||(await this.adjustLegal(),await this.adjustEduLists()),await super.postCardUpdateHook(),window.matchMedia("(min-width: 768px)").matches&&this.card===this.card.parentElement.firstElementChild&&requestAnimationFrame(()=>{this.syncHeights()})}get headingM(){return this.card.querySelector('[slot="heading-m"]')}get mainPrice(){return this.headingM?.querySelector(`${O}[data-template="price"]`)}get divider(){return this.card.variant==="plans-education"?Jt`<div class="divider"></div>`:Mr}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let e=[],t=this.card.querySelector(`[slot="heading-m"] ${O}[data-template="price"]`);t&&e.push(t);let i=e.map(async n=>{let o=n.cloneNode(!0);await n.onceSettled(),n?.options&&(n.options.displayPerUnit&&(n.dataset.displayPerUnit="false"),n.options.displayTax&&(n.dataset.displayTax="false"),n.options.displayPlanType&&(n.dataset.displayPlanType="false"),o.setAttribute("data-template","legal"),n.parentNode.insertBefore(o,n.nextSibling),await o.onceSettled())});await Promise.all(i)}catch{}}async adjustAddon(){await this.card.updateComplete;let e=this.card.addon;if(!e)return;e.setAttribute("custom-checkbox","");let t=this.mainPrice;if(!t)return;await t.onceSettled?.();let i=t.value?.[0]?.planType;i&&(e.planType=i)}get stockCheckbox(){return this.card.checkboxLabel?Jt`<label id="stock-checkbox">
                <input type="checkbox" @change=${this.card.toggleStockOffer}></input>
                <span></span>
                ${this.card.checkboxLabel}
            </label>`:Mr}get icons(){return!this.card.querySelector('[slot="icons"]')&&!this.card.getAttribute("id")?Mr:Jt`<slot name="icons"></slot>`}resizeHandler(){v(this,Ee)&&cancelAnimationFrame(v(this,Ee)),A(this,Ee,requestAnimationFrame(()=>{A(this,Ee,null),window.matchMedia("(min-width: 768px)").matches&&this.syncHeights()}))}connectedCallbackHook(){T.matchMobile.addEventListener("change",this.adaptForMedia),T.matchDesktopOrUp.addEventListener("change",this.adaptForMedia)}disconnectedCallbackHook(){T.matchMobile.removeEventListener("change",this.adaptForMedia),T.matchDesktopOrUp.removeEventListener("change",this.adaptForMedia),v(this,we)?.disconnect(),A(this,we,null),v(this,Ee)&&(cancelAnimationFrame(v(this,Ee)),A(this,Ee,null))}renderLayout(){return Jt` ${this.badge}
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
            <slot></slot>`}};we=new WeakMap,Ee=new WeakMap,m(oe,"variantStyle",jc`
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
    `),m(oe,"collectionOptions",{customHeaderArea:e=>e.sidenav?Jt`<slot name="resultsText"></slot>`:Mr,headerVisibility:{search:!1,sort:!1,result:["mobile","tablet"],custom:["desktop"]},onSidenavAttached:e=>{let t=()=>{let i=e.querySelectorAll("merch-card");for(let o of i)o.hasAttribute("data-size")&&(o.setAttribute("size",o.getAttribute("data-size")),o.removeAttribute("data-size"));if(!T.isDesktop)return;let n=0;for(let o of i){if(o.style.display==="none")continue;let s=o.getAttribute("size"),c=s==="wide"?2:s==="super-wide"?3:1;c===2&&n%3===2&&(o.setAttribute("data-size",s),o.removeAttribute("size"),c=1),n+=c}};T.matchDesktop.addEventListener("change",t),e.addEventListener(me,t),e.onUnmount.push(()=>{T.matchDesktop.removeEventListener("change",t),e.removeEventListener(me,t)})}});import{html as Te,css as Wc,unsafeCSS as En,nothing as zr}from"./lit-all.min.js";var wn=`
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
@media ${R} {
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
@media ${R} {
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

@media screen and ${R}, ${K} {
    :root {
        --consonant-merch-card-plans-v2-width: 100%;
    }
    merch-card[variant="plans-v2"] {
        width: 100%;
        max-width: var(--consonant-merch-card-plans-v2-width);
        box-sizing: border-box;
    }
}

@media screen and ${S}, ${L}, ${re} {
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
@media screen and ${R} {
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
@media screen and ${S} {
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
@media screen and ${L} {
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
@media screen and ${re} {
.columns .four-merch-cards.plans:has(merch-card[variant="plans-v2"]) {
    grid-template-columns: repeat(2, var(--consonant-merch-card-plans-v2-width));
  }

}
`;var Za={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m"},shortDescription:{tag:"p",slot:"short-description"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},addon:!0,secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-red-700-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],whatsIncluded:{tag:"div",slot:"whats-included"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},He=class extends w{constructor(r){super(r),this.adaptForMedia=this.adaptForMedia.bind(this),this.toggleShortDescription=this.toggleShortDescription.bind(this),this.shortDescriptionExpanded=!1,this.syncScheduled=!1}priceOptionsProvider(r,e){let t=Za.prices.slot;if(r.closest(`[slot="${t}"]`)){if(r.dataset.template===G){e.displayPlanType=this.card?.settings?.displayPlanType??!1;return}(r.dataset.template==="strikethrough"||r.dataset.template==="price")&&(e.displayPerUnit=!1)}}getGlobalCSS(){return wn}adjustSlotPlacement(r,e,t){let{shadowRoot:i}=this.card,n=i.querySelector("footer"),o=i.querySelector(".body"),s=this.card.getAttribute("size");if(!s)return;let c=i.querySelector(`footer slot[name="${r}"]`),l=i.querySelector(`.body slot[name="${r}"]`);if(s.includes("wide")||(n?.classList.remove("wide-footer"),c?.remove()),!!e.includes(s)){if(n?.classList.toggle("wide-footer",T.isDesktopOrUp),!t&&c){if(l)c.remove();else{let d=o.querySelector(`[data-placeholder-for="${r}"]`);d?d.replaceWith(c):o.appendChild(c)}return}if(t&&l){let d=document.createElement("div");d.setAttribute("data-placeholder-for",r),d.classList.add("slot-placeholder"),c||n.prepend(l.cloneNode(!0)),l.replaceWith(d)}}}adaptForMedia(){if(!this.card.closest("merch-card-collection,overlay-trigger,.two-merch-cards,.three-merch-cards,.four-merch-cards,.columns"))return this.card.hasAttribute("size"),void 0;this.adjustSlotPlacement("heading-m",["wide"],!0),this.adjustSlotPlacement("addon",["super-wide"],T.isDesktopOrUp),this.adjustSlotPlacement("callout-content",["super-wide"],T.isDesktopOrUp)}adjustCallout(){let r=this.card.querySelector('[slot="callout-content"] .icon-button');if(!r?.title)return;r.dataset.tooltip=r.title,r.removeAttribute("title"),r.classList.add("hide-tooltip");let e=t=>{t===r?r.classList.toggle("hide-tooltip"):r.classList.add("hide-tooltip")};document.addEventListener("touchstart",t=>{t.preventDefault(),e(t.target)}),document.addEventListener("mouseover",t=>{t.preventDefault(),t.target!==r?r.classList.add("hide-tooltip"):r.classList.remove("hide-tooltip")})}async postCardUpdateHook(){this.card.isConnected&&(this.adaptForMedia(),this.adjustAddon(),this.adjustCallout(),this.updateShortDescriptionVisibility(),this.hasShortDescription?this.card.setAttribute("has-short-description",""):this.card.removeAttribute("has-short-description"),this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook(),window.matchMedia("(min-width: 768px)").matches&&requestAnimationFrame(()=>{this.syncHeights()}))}get mainPrice(){return this.card.querySelector(`[slot="heading-m"] ${O}[data-template="price"]`)}syncHeights(){this.card.getBoundingClientRect().width<=2||this.syncRowHeights([{name:"body",getElement:r=>r.shadowRoot?.querySelector(".body")},{name:"footer",getElement:r=>r.shadowRoot?.querySelector("footer")},{name:"short-description",getElement:r=>r.querySelector('[slot="short-description"]')}])}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let r=this.mainPrice;if(!r)return;let e=r.cloneNode(!0);if(await r.onceSettled(),!r?.options)return;r.options.displayPerUnit&&(r.dataset.displayPerUnit="false"),r.options.displayPlanType&&(r.dataset.displayPlanType="false"),this.card.settings?.displayAnnual&&r.options.displayTax?e.dataset.displayTax="false":r.options.displayTax&&(r.dataset.displayTax="false"),e.setAttribute("data-template","legal"),r.parentNode.insertBefore(e,r.nextSibling),await e.onceSettled()}catch{}}async adjustAddon(){await this.card.updateComplete;let r=this.card.addon;if(!r)return;r.setAttribute("custom-checkbox","");let e=this.mainPrice;if(!e)return;await e.onceSettled?.();let t=e.value?.[0]?.planType;t&&(r.planType=t)}get stockCheckbox(){return this.card.checkboxLabel?Te`<label id="stock-checkbox">
                <input type="checkbox" @change=${this.card.toggleStockOffer}></input>
                <span></span>
                ${this.card.checkboxLabel}
            </label>`:zr}get hasShortDescription(){return!!this.card.querySelector('[slot="short-description"]')}get shortDescriptionLabel(){let r=this.card.querySelector('[slot="short-description"]'),e=r.querySelector("strong, b");if(e?.textContent?.trim())return e.textContent.trim();let t=r.querySelector("h1, h2, h3, h4, h5, h6, p");return t?.textContent?.trim()?t.textContent.trim():r.textContent?.trim().split(`
`)[0].trim()}updateShortDescriptionVisibility(){let r=this.card.querySelector('[slot="short-description"]');if(!r)return;let e=r.querySelector("strong, b, p");e&&(T.isMobile?e.style.display="none":e.style.display="")}toggleShortDescription(){this.shortDescriptionExpanded=!this.shortDescriptionExpanded,this.card.requestUpdate()}get shortDescriptionToggle(){return this.hasShortDescription?T.isMobile?Te`
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
        `:Te`
                <div class="short-description-content desktop">
                    <slot name="short-description"></slot>
                </div>
            `:zr}get icons(){return this.card.querySelector('[slot="icons"]')||this.card.getAttribute("id")?Te`<slot name="icons"></slot>`:zr}get secureLabelFooter(){return Te`<footer>
            ${this.secureLabel}<slot name="quantity-select"></slot
            ><slot name="footer"></slot>
        </footer>`}connectedCallbackHook(){this.handleMediaChange=()=>{this.adaptForMedia(),this.updateShortDescriptionVisibility(),this.card.requestUpdate(),window.matchMedia("(min-width: 768px)").matches&&requestAnimationFrame(()=>{this.syncHeights()})},T.matchMobile.addEventListener("change",this.handleMediaChange),T.matchDesktopOrUp.addEventListener("change",this.handleMediaChange),this.handleResize=()=>{this._resizeFrame&&cancelAnimationFrame(this._resizeFrame),this._resizeFrame=requestAnimationFrame(()=>{this._resizeFrame=null,window.matchMedia("(min-width: 768px)").matches&&this.syncHeights()})},window.addEventListener("resize",this.handleResize),this.visibilityObserver=new IntersectionObserver(([r])=>{r.boundingClientRect.height!==0&&r.isIntersecting&&(window.matchMedia("(min-width: 768px)").matches&&requestAnimationFrame(()=>{this.syncHeights()}),this.visibilityObserver.disconnect())}),this.visibilityObserver.observe(this.card)}disconnectedCallbackHook(){T.matchMobile.removeEventListener("change",this.handleMediaChange),T.matchDesktopOrUp.removeEventListener("change",this.handleMediaChange),this.handleResize&&(window.removeEventListener("resize",this.handleResize),this.handleResize=null),this._resizeFrame&&(cancelAnimationFrame(this._resizeFrame),this._resizeFrame=null),this.visibilityObserver?.disconnect()}renderLayout(){let e=this.card.getAttribute("size")==="wide";return Te` ${this.badge}
            <div class="body">
                ${e?Te`
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
                      `:Te`
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
            <slot></slot>`}};m(He,"variantStyle",Wc`
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

        @media ${En(R)}, ${En(K)} {
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
    `),m(He,"collectionOptions",{customHeaderArea:r=>r.sidenav?Te`<slot name="resultsText"></slot>`:zr,headerVisibility:{search:!1,sort:!1,result:["mobile","tablet"],custom:["desktop"]},onSidenavAttached:r=>{let e=()=>{let t=r.querySelectorAll("merch-card");if(t.forEach(n=>{n.hasAttribute("data-size")&&(n.setAttribute("size",n.getAttribute("data-size")),n.removeAttribute("data-size"))}),!T.isDesktop)return;let i=0;t.forEach(n=>{if(n.style.display==="none")return;let o=n.getAttribute("size"),s=o==="wide"?2:o==="super-wide"?3:1;s===2&&i%3===2&&(n.setAttribute("data-size",o),n.removeAttribute("size"),s=1),i+=s})};T.matchDesktop.addEventListener("change",e),r.addEventListener(me,e),r.onUnmount.push(()=>{T.matchDesktop.removeEventListener("change",e),r.removeEventListener(me,e)})}});import{html as Le,css as Yc,nothing as gt,unsafeCSS as er}from"./lit-all.min.js";var An=`
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

/* Width is driven by the grid track, not a fixed value \u2014 cards fluidly fit
   261px (1280 viewport) \u2192 394px (1920 viewport) per Figma. */
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

@media screen and ${je} {
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
    flex: 1 0 0;
    min-width: 0;
    height: 40px;
    padding: 14px 24px;
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
    white-space: nowrap;
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

/* WCS recurrence dictionary returns abbreviations uppercased ("/MO");
   Figma's pricing typography presents it lowercase ("/mo"). */
merch-card[variant="pro"] [slot="heading-m"] .price-recurrence {
    text-transform: lowercase;
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

/* Collection grid \u2014 C2 breakpoints only (768, 1280).
   - Mobile: single column, full width.
   - Tablet (\u2265768): 2-column grid for 2/3/4 cards.
   - Desktop (\u22651280): full column count.
   Cards stretch to equal height within a row (matches Figma row-equal layout)
   and widths flow fluidly via 1fr tracks. Container max-width caps growth so
   cards don't exceed the Figma xl (394px) width. */
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
@media screen and ${S} {
    merch-card-collection.plans:is(.two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="pro"]) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        max-width: 720px;
    }
}

@media screen and ${je} {
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

@media screen and ${R} {
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

`;var[Qp,Zp,kn,Sn,Cn,Tn]=["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Enter","Tab"];var Nr="pro",Xa=`--consonant-merch-card-${Nr}-top-card-height`,Or=[{prop:`--consonant-merch-card-${Nr}-mnemonic-height`,selector:".mnemonic"},{prop:`--consonant-merch-card-${Nr}-name-description-height`,selector:".name-description"}],Ln=`--consonant-merch-card-${Nr}-strike-reserve`,Ja='[slot="heading-m"] :is(.price-strikethrough, .price-promo-strikethrough, [data-template="strikethrough"])',Kc="(min-width: 768px)",Pn={cardName:{attribute:"name"},subtitle:{tag:"p",slot:"subtitle"},title:{tag:"h3",slot:"heading-xs"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"s"},size:["wide","edu"],prices:{tag:"p",slot:"heading-m"},promoText:{tag:"p",slot:"promo-text"},perUnitLabel:{tag:"span",slot:"per-unit-label"},callout:{tag:"div",slot:"callout-content",editorLabel:"License callout"},quantitySelect:{tag:"div",slot:"quantity-select"},shortDescription:{tag:"div",slot:"legal-text"},secureLabel:!0,planType:!0,addon:!0,ctas:{slot:"footer",size:"m"},whatsIncluded:{tag:"div",slot:"whats-included"},eduDisclaimer:{tag:"div",slot:"edu-disclaimer"},backgroundColor:{attribute:"background-color",editorLabel:"Theme",specialValues:{Light:"light",Dark:"dark"}},borderColor:{attribute:"border-color",specialValues:{Black:"black"},hideTransparent:!0,disableWhenBackgroundColor:"dark"},allowedBorderColors:[],style:"consonant"},Pe,Ke,ir,nr,j,_n,tr,Mn,rr,ei,Dr,Ir=class Ir extends w{constructor(e){super(e);k(this,j);m(this,"expanded",!1);m(this,"licenseOpen",!1);m(this,"licenseQty",null);m(this,"licenseHighlightedIndex",0);k(this,Pe,null);k(this,Ke,null);k(this,ir,()=>this.resyncOnReflow());m(this,"lastSyncKey",null);k(this,nr,({detail:e})=>{let t=e?.quantity==null?null:String(e.quantity);t==null||t===this.licenseQty||this.licenseOptions?.includes(t)&&(this.licenseQty=t,this.card.requestUpdate())});m(this,"toggleExpanded",e=>{e.preventDefault();let t=!this.expanded;for(let i of $(this,j,_n).call(this)){let n=i.variantLayout;n instanceof Ir&&(n.expanded=t,i._proExpanded=t,i.requestUpdate())}});m(this,"toggleLicensePopover",e=>{e.preventDefault(),e.stopPropagation(),this.licenseOpen?$(this,j,ei).call(this):$(this,j,rr).call(this),this.card.requestUpdate()});k(this,Dr,e=>{let t=this.licenseOptions;if(!t?.length)return;let i=t.length-1;switch(e.key){case Sn:e.preventDefault(),this.licenseOpen?this.licenseHighlightedIndex=(this.licenseHighlightedIndex+1)%t.length:$(this,j,rr).call(this);break;case kn:e.preventDefault(),this.licenseOpen?this.licenseHighlightedIndex=(this.licenseHighlightedIndex-1+t.length)%t.length:$(this,j,rr).call(this);break;case"Home":if(!this.licenseOpen)return;e.preventDefault(),this.licenseHighlightedIndex=0;break;case"End":if(!this.licenseOpen)return;e.preventDefault(),this.licenseHighlightedIndex=i;break;case Cn:case" ":if(e.preventDefault(),this.licenseOpen){this.selectLicenseQty(t[this.licenseHighlightedIndex]);return}$(this,j,rr).call(this);break;case"Escape":if(!this.licenseOpen)return;e.preventDefault(),$(this,j,ei).call(this);break;case Tn:this.licenseOpen&&this.selectLicenseQty(t[this.licenseHighlightedIndex]);return;default:return}this.card.requestUpdate()});m(this,"selectLicenseQty",e=>{this.licenseQty=e,this.licenseOpen=!1,$(this,j,tr).call(this);let t=this.quantitySelectEl;t&&(t.selectedValue=Number(e),t.dispatchEvent(new CustomEvent(ae,{detail:{option:Number(e)},bubbles:!0}))),this.card.requestUpdate()});this.updatePriceQuantity=this.updatePriceQuantity.bind(this),this.expanded=e._proExpanded??!1}getGlobalCSS(){return An}priceOptionsProvider(e,t){e.dataset.template===G&&(t.displayPlanType=this.card?.settings?.displayPlanType??!1)}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let e=this.mainPrice;if(!e)return;let t=e.cloneNode(!0);if(await e.onceSettled(),!e?.options)return;e.options.displayTax&&(e.dataset.displayTax="false"),e.options.displayPlanType&&(e.dataset.displayPlanType="false"),t.setAttribute("data-template","legal"),t.dataset.displayPerUnit="false",e.parentNode.insertBefore(t,e.nextSibling),await t.onceSettled(),this.legalResolvedHandler||(this.legalResolvedHandler=()=>this.adjustShortDescription(),t.addEventListener(ie,this.legalResolvedHandler)),this.adjustShortDescription()}catch{}}adjustShortDescription(){let e=this.card.querySelector('[slot="legal-text"]');if(!e?.textContent?.trim())return;let i=this.card.querySelector('[slot="heading-m"] [data-template="legal"]'),n=i?.querySelector(".price-plan-type");if(!n)return;n.innerHTML=e.innerHTML;let o=i.querySelector(".price-tax-inclusivity:not(.disabled)");o?.textContent&&!/\s$/.test(o.textContent)&&(o.textContent+=". ")}get hasWhatsIncluded(){return!!this.card.querySelector('[slot="whats-included"]')}get hasEduDisclaimer(){return!this.card?.settings?.hideEduDisclaimer}get whatsIncludedToggleLabel(){return this.card.querySelector('[slot="whats-included"] .whats-included-label')?.textContent.trim()||"See what's included:"}get hasCallout(){return!!this.card.querySelector('[slot="callout-content"]')}get hasQuantitySelect(){let e=this.quantitySelectEl;return e?!!e.getAttribute("title")||parseInt(e.getAttribute("min"),10)>0||parseInt(e.getAttribute("step"),10)>0:!1}get hasAddOn(){return!!this.card.querySelector('[slot="addon"]')}get addonBackground(){return this.card.querySelector('[slot="addon"]')?.getAttribute("background")??null}get mainPrice(){return this.card.querySelector(`[slot="heading-m"] ${O}[data-template="price"]`)}updatePriceQuantity({detail:e}){!this.mainPrice||!e?.option||(this.mainPrice.dataset.quantity=e.option)}async adjustAddon(){await this.card.updateComplete;let e=this.card.addon;if(!e)return;e.setAttribute("custom-checkbox","");let t=this.mainPrice;if(!t)return;await t.onceSettled?.();let i=t.value?.[0]?.planType;i&&(e.planType=i)}async postCardUpdateHook(){this.adjustEduWhatsIncluded(),await this.adjustAddon(),this.legalAdjusted||await this.adjustLegal(),this.adjustShortDescription(),await super.postCardUpdateHook(),window.matchMedia("(min-width: 768px)").matches&&this.syncHeights()}adjustEduWhatsIncluded(){if(this.card.size!=="edu")return;let e=this.card.querySelector('[slot="whats-included"]');if(!e||e.querySelector(".whats-included-title"))return;let t=e.querySelector(".whats-included-label");if(!t)return;let i=document.createElement("h4");i.className="whats-included-title",i.innerHTML=t.innerHTML,t.replaceWith(i);let{whatsIncludedLabel:n,eduDisclaimer:o}=this.card.placeholders??{},s=document.createElement("p");if(s.className="whats-included-label",s.textContent=n??"",i.after(s),e.querySelectorAll(".section h4:not(.whats-included-title)").forEach(c=>{let l=document.createElement("p");l.innerHTML=c.innerHTML,c.replaceWith(l)}),o){let c=document.createElement("div");c.className="whats-included-disclaimer",c.innerHTML=o,e.append(c)}}async waitForContentFonts(){let e=[this.card.querySelector('[slot="heading-xs"]'),this.card.querySelector('[slot="body-xs"]')].filter(Boolean);document.fonts?.load&&await Promise.all(e.map(t=>{let i=window.getComputedStyle(t),n=`${i.fontWeight} ${i.fontSize} ${i.fontFamily}`;return document.fonts.load(n,t.textContent).catch(()=>null)})),await document.fonts?.ready}async syncHeights(){if(this.card.heightSync===!1){this.clearSyncedHeights(this.card);return}await this.waitForContentFonts(),await new Promise(c=>requestAnimationFrame(c)),await new Promise(c=>requestAnimationFrame(c));let e=this.getContainer();if(!e||this.card.getBoundingClientRect().width<=2)return;let t=this.card.variant,i=Xa,n=[...e.querySelectorAll(`merch-card[variant="${t}"]`)].filter(c=>c.getBoundingClientRect().width>2&&c.variantLayout?.card?.heightSync!==!1);if(!window.matchMedia(Kc).matches){n.forEach(c=>this.clearSyncedHeights(c));return}let o=new Map;for(let c of n){let l=o.get(c.offsetTop)??[];l.push(c),o.set(c.offsetTop,l)}let s=(c,l)=>c.reduce((d,f)=>{let g=l(f);return g?Math.max(d,parseInt(getComputedStyle(g).height)||0):d},0);for(let c of o.values()){if(c.forEach(g=>this.clearSyncedHeights(g)),c.length<2)continue;let l=c.map(g=>g.querySelector(Ja)&&parseInt(getComputedStyle(g.querySelector(Ja)).height)||0),d=Math.max(0,...l);d>0&&c.forEach((g,p)=>{let h=d-l[p];h>0&&g.style.setProperty(Ln,`${h}px`)});for(let g of Or){let p=s(c,h=>h.shadowRoot?.querySelector(g.selector));p>0&&c.forEach(h=>h.style.setProperty(g.prop,`${p}px`))}let f=s(c,g=>g.shadowRoot?.querySelector(".top-card"));f>0&&c.forEach(g=>g.style.setProperty(i,`${f}px`))}}clearSyncedHeights(e){e.style.removeProperty(Xa),e.style.removeProperty(Ln),Or.forEach(t=>e.style.removeProperty(t.prop))}resyncOnReflow(){let e=this.card.getBoundingClientRect().width;if(e<=2)return;let t=(n,o=this.card)=>Math.round(o?.querySelector(n)?.getBoundingClientRect().height||0),i=[Math.round(e),t('[slot="body-xs"]'),t(Ja),t('[slot="heading-m"] span[is="inline-price"]'),t('[slot="heading-m"] :is(.price-legal, [data-template="legal"])'),t(".license-zone",this.card.shadowRoot),t(".add-on",this.card.shadowRoot)].join(":");i!==this.lastSyncKey&&(this.lastSyncKey=i,this.syncHeights())}connectedCallbackHook(){if(!this.card||(this.card.addEventListener(Sr,v(this,nr)),this.card.addEventListener(ae,this.updatePriceQuantity),this.card.addEventListener(ie,v(this,ir)),typeof ResizeObserver>"u"))return;A(this,Ke,new ResizeObserver(()=>this.resyncOnReflow())),v(this,Ke).observe(this.card);let e=this.card.querySelector('[slot="body-xs"]');e&&v(this,Ke).observe(e)}disconnectedCallbackHook(){this.card?.removeEventListener(ae,this.updatePriceQuantity),this.card?.removeEventListener(ie,v(this,ir)),$(this,j,tr).call(this),v(this,Ke)?.disconnect(),this.card?.removeEventListener(Sr,v(this,nr))}get quantitySelectEl(){return this.card.querySelector("merch-quantity-select")}get licenseOptions(){let e=this.quantitySelectEl;if(!e)return null;let t=parseInt(e.getAttribute("min"),10),i=parseInt(e.getAttribute("max"),10),n=parseInt(e.getAttribute("step"),10)||1;if(Number.isNaN(t)||Number.isNaN(i)||i<t||n<1)return null;let o=[];for(let s=t;s<=i;s+=n)o.push(String(s));return o}licenseLabel(e){let t=this.quantitySelectEl?.getAttribute("title")||"License",[i,n]=t.split("|").map(o=>o.trim());return Number(e)===1?i:n||i}get hasLicenseSelector(){return(this.licenseOptions?.length??0)>0}get currentLicenseValue(){let e=this.licenseOptions;if(!e?.length)return null;if(this.licenseQty!=null)return this.licenseQty;let t=this.quantitySelectEl?.getAttribute("default-value");return t!=null&&e.includes(t)?t:e[0]}renderLicenseSelector(){if(!this.hasLicenseSelector)return Le`<slot name="quantity-select"></slot>`;let e=this.licenseOptions,t=this.currentLicenseValue,i=!!this.licenseOpen,n=this.licenseLabel(Number(t));return Le`
            <div class="license-select" ?data-open=${i}>
                <div
                    class="license-select-trigger"
                    role="combobox"
                    tabindex="0"
                    aria-expanded=${i?"true":"false"}
                    aria-controls="license-popover"
                    aria-labelledby="license-select-label"
                    aria-activedescendant=${i?`license-option-${this.licenseHighlightedIndex}`:gt}
                    @click=${this.toggleLicensePopover}
                    @keydown=${v(this,Dr)}
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
                    aria-labelledby="license-select-label"
                    aria-multiselectable="false"
                    tabindex="-1"
                    ?hidden=${!i}
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
                    ${e.map((o,s)=>Le`
                            <li
                                class="license-select-option ${s===this.licenseHighlightedIndex?"highlighted":""}${o===t?" selected":""}"
                                id="license-option-${s}"
                                role="option"
                                aria-selected=${o===t?"true":"false"}
                                @click=${()=>this.selectLicenseQty(o)}
                                @mouseenter=${()=>{this.licenseHighlightedIndex=s,this.card.requestUpdate()}}
                            >
                                ${o}
                            </li>
                        `)}
                </ul>
            </div>
        `}renderLayout(){let e=!!this.expanded;return Le`
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
                ${this.hasLicenseSelector||this.hasCallout||this.hasQuantitySelect?Le`<div class="license-zone">
                          ${this.renderLicenseSelector()}
                          ${this.hasCallout?Le`<div class="callout">
                                    <slot name="callout-content"></slot>
                                </div>`:gt}
                      </div>`:gt}
                ${this.hasAddOn?Le`<div
                          class="add-on"
                          ?data-addon-grey=${this.addonBackground==="grey"}
                      >
                          <slot name="addon"></slot>
                      </div>`:gt}
                <footer>
                    <slot name="footer"></slot>
                </footer>
                ${this.secureLabel}
            </div>
            ${this.hasWhatsIncluded?Le`
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
                  `:gt}
            ${this.hasEduDisclaimer?Le`<div class="edu-disclaimer">
                      <slot name="edu-disclaimer"></slot>
                  </div>`:gt}
            <slot></slot>
        `}};Pe=new WeakMap,Ke=new WeakMap,ir=new WeakMap,nr=new WeakMap,j=new WeakSet,_n=function(){let e=this.card.offsetTop,t=Array.from(this.getContainer()?.querySelectorAll(`merch-card[variant="${this.card.variant}"]`)??[]).filter(i=>i.getBoundingClientRect().width>2&&i.offsetTop===e);return t.length?t:[this.card]},tr=function(){v(this,Pe)&&(document.removeEventListener("mousedown",v(this,Pe)),A(this,Pe,null))},Mn=function(){let e=this.licenseOptions?.indexOf(this.currentLicenseValue);return e>0?e:0},rr=function(){this.licenseOpen=!0,this.licenseHighlightedIndex=$(this,j,Mn).call(this),v(this,Pe)||(A(this,Pe,e=>{e.composedPath().includes(this.card)||(this.licenseOpen=!1,this.card.requestUpdate(),$(this,j,tr).call(this))}),document.addEventListener("mousedown",v(this,Pe)))},ei=function(){this.licenseOpen=!1,$(this,j,tr).call(this)},Dr=new WeakMap,m(Ir,"variantStyle",Yc`
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
            min-height: var(${er(Xa)}, auto);
        }

        :host([variant='pro']) .mnemonic {
            display: flex;
            align-items: center;
            gap: 12px;
            min-height: var(${er(Or[0].prop)}, auto);
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
            min-height: var(${er(Or[1].prop)}, auto);
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
        :host([variant='pro']) .license-select-option.highlighted,
        :host([variant='pro']) .license-select-option.selected {
            background: var(--consonant-merch-card-pro-control-hover-bg);
        }

        /* Focus stays on the trigger, so the highlighted option needs its own
           visible ring (WCAG 2.4.7). */
        :host([variant='pro']) .license-select-option.highlighted {
            outline: 2px solid #1473e6;
            outline-offset: -2px;
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
        @media screen and ${er(je)} {
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

        @media screen and ${er(S)} {
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
    `);var ar=Ir;import{html as ti,css as Qc}from"./lit-all.min.js";var Rn=`
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
@media screen and ${S} {
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
@media screen and ${L} {
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

@media screen and ${K} {
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

`;var zn={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},prices:{tag:"p",slot:"heading-xs"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},shortDescription:{tag:"div",slot:"short-description"},mnemonics:{size:"l"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},secureLabel:!0,planType:!0,addon:!0,addonBackground:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"color-yellow-300-variation"},allowedBadgeColors:["color-yellow-300-variation","color-gray-300-variation","color-gray-700-variation","color-green-900-variation","gradient-purple-blue"],allowedBorderColors:["color-yellow-300-variation","color-gray-300-variation","color-green-900-variation","gradient-purple-blue"],borderColor:{attribute:"border-color"},whatsIncluded:{tag:"div",slot:"whats-included"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},Ae,ft=class extends w{constructor(e){super(e);k(this,Ae);this.postCardUpdateHook=this.postCardUpdateHook.bind(this),this.updatePriceQuantity=this.updatePriceQuantity.bind(this)}getGlobalCSS(){return Rn}priceOptionsProvider(e,t){e.dataset.template===G&&(t.displayPlanType=this.card?.settings?.displayPlanType??!1,(e.dataset.template==="strikethrough"||e.dataset.template==="price")&&(t.displayPerUnit=!1))}adjustProductBodySlots(){if(this.card.getBoundingClientRect().width===0)return;["heading-xs","body-xxs","body-xs","promo-text","callout-content","addon","body-lower"].forEach(t=>this.updateCardElementMinHeight(this.card.shadowRoot.querySelector(`slot[name="${t}"]`),t))}renderLayout(){return ti` ${this.badge}
            <div class="body" aria-live="polite">
                <slot name="icons"></slot>
                <slot name="heading-xs"></slot>
                ${this.promoBottom?"":ti`<slot name="promo-text"></slot>`}
                <slot name="body-xs"></slot>
                <slot name="short-description"></slot>
                <slot name="addon"></slot>
                ${this.promoBottom?ti`<slot name="promo-text"></slot>`:""}
                <slot name="whats-included"></slot>
                <slot name="callout-content"></slot>
                <slot name="quantity-select"></slot>
                <slot name="body-lower"></slot>
                <slot name="badge"></slot>
            </div>
            <hr />
            ${this.secureLabelFooter}`}connectedCallbackHook(){this.handleResize=()=>{v(this,Ae)&&cancelAnimationFrame(v(this,Ae)),A(this,Ae,requestAnimationFrame(()=>{A(this,Ae,null),this.postCardUpdateHook()}))},this.adjustShortDescriptionBound=this.adjustShortDescription.bind(this),window.addEventListener("resize",this.handleResize),this.card.addEventListener(ae,this.updatePriceQuantity),this.card.addEventListener(Cr,this.adjustShortDescriptionBound)}disconnectedCallbackHook(){this.handleResize&&(window.removeEventListener("resize",this.handleResize),this.handleResize=null),v(this,Ae)&&(cancelAnimationFrame(v(this,Ae)),A(this,Ae,null)),this.card.removeEventListener(ae,this.updatePriceQuantity),this.card.removeEventListener(Cr,this.adjustShortDescriptionBound)}adjustShortDescription(){let e=this.card.querySelector('[slot="short-description"]');if(!e?.textContent?.trim())return;let t=this.card.querySelector('span[data-template="legal"]');if(!t)return;this.card.querySelector(".merch-short-description")?.remove();let i=document.createElement("span");i.className="merch-short-description",i.innerHTML=e.innerHTML,i.querySelectorAll("p").forEach(n=>n.replaceWith(...n.childNodes)),i.querySelectorAll(".icon-button").forEach(n=>{n.dataset.eventsWired||(n.dataset.eventsWired="1",["mouseenter","focus"].forEach(o=>n.addEventListener(o,()=>n.classList.add("tooltip-visible"))),["mouseleave","blur"].forEach(o=>n.addEventListener(o,()=>n.classList.remove("tooltip-visible"))),n.addEventListener("keydown",o=>{o.key==="Escape"&&n.classList.remove("tooltip-visible")}))}),t.after(i),e.hidden=!0}async postCardUpdateHook(){this.card.isConnected&&(this.adjustAddon(),T.isMobile||this.adjustProductBodySlots(),this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook())}async adjustLegal(){if(!(this.legalAdjusted||!this.card.id))try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let e=this.mainPrice;if(!e)return;let t=e.cloneNode(!0);if(await e.onceSettled(),!e?.options)return;e.options.displayTax&&(e.dataset.displayTax="false"),e.options.displayPlanType&&(e.dataset.displayPlanType="false"),t.setAttribute("data-template","legal"),t.dataset.displayPerUnit="false",e.dataset.template==="optical"&&(t.dataset.displayPlanType="false"),e.closest('[slot="heading-xs"]').appendChild(t),await t.onceSettled()}catch{}}get headingXSSlot(){return this.card.shadowRoot.querySelector('slot[name="heading-xs"]').assignedElements()[0]}get mainPrice(){let e=`[slot="heading-xs"] ${O}`;return this.card.querySelector(`${e}[data-template="price"], ${e}[data-template="optical"]`)}updatePriceQuantity({detail:e}){!this.mainPrice||!e?.option||(this.mainPrice.dataset.quantity=e.option)}toggleAddon(e){let t=this.mainPrice,i=this.headingXSSlot;if(!t&&i){let n=e?.getAttribute("plan-type"),o=null;if(e&&n&&(o=e.querySelector(`p[data-plan-type="${n}"]`)?.querySelector('span[is="inline-price"]')),this.card.querySelectorAll('p[slot="heading-xs"]').forEach(s=>s.remove()),e.checked){if(o){let s=be("p",{class:"addon-heading-xs-price-addon",slot:"heading-xs"},o.innerHTML);this.card.appendChild(s)}}else{let s=be("p",{class:"card-heading",id:"free",slot:"heading-xs"},"Free");this.card.appendChild(s)}}}async adjustAddon(){await this.card.updateComplete;let e=this.card.addon;if(!e)return;let t=this.mainPrice,i=this.card.planType;t&&(await t.onceSettled?.(),i=t.value?.[0]?.planType),i&&(e.planType=i)}};Ae=new WeakMap,m(ft,"variantStyle",Qc`
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
    `);import{html as Zc,css as Xc}from"./lit-all.min.js";var On=`
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
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 4px;
}

merch-card[variant="brand-concierge-product"] [slot="heading-xs"] span.price-strikethrough {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
    font-weight: 400;
    color: var(--ah-gray-500);
}

merch-card[variant="brand-concierge-product"] [slot="heading-xs"] span.price:not(.price-strikethrough):not(.price-legal) {
    font-size: var(--consonant-merch-card-heading-xs-font-size);
    line-height: var(--consonant-merch-card-heading-xs-line-height);
    font-weight: 700;
    color: var(--consonant-merch-card-heading-xxxs-color);
}

merch-card[variant="brand-concierge-product"] [slot="heading-xs"] span[is="inline-price"][data-template="legal"] {
    display: block;
    width: 100%;
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
`;var Nn={cardName:{attribute:"name"},mnemonics:{size:"l"},badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","gradient-purple-blue"],title:{tag:"h3",slot:"heading-s"},prices:{tag:"p",slot:"heading-xs"},planType:!0,promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},ctas:{slot:"footer",size:"m"},style:"consonant"},vt=class extends w{getGlobalCSS(){return On}priceOptionsProvider(r,e){r.dataset.template===G&&(e.displayPlanType=this.card?.settings?.displayPlanType??!1)}async adjustLegal(){if(!(this.legalAdjusted||!this.card.id))try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let r=this.card.querySelector(`[slot="heading-xs"] ${O}[data-template="price"]`);if(!r)return;let e=r.cloneNode(!0);if(await r.onceSettled(),!r.options)return;r.options.displayPerUnit&&(r.dataset.displayPerUnit="false"),r.options.displayTax&&(r.dataset.displayTax="false"),r.options.displayPlanType&&(r.dataset.displayPlanType="false"),e.setAttribute("data-template","legal"),r.parentNode.insertBefore(e,r.nextSibling),await e.onceSettled()}catch{}}async postCardUpdateHook(){this.card.isConnected&&(this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook())}renderLayout(){return Zc` ${this.badge}
            <div class="body">
                <slot name="icons"></slot>
                <slot name="badge"></slot>
                <slot name="heading-s"></slot>
                <slot name="heading-xs"></slot>
                <slot name="promo-text"></slot>
                <slot name="body-xs"></slot>
            </div>
            <footer><slot name="footer"></slot></footer>
            <slot></slot>`}};m(vt,"variantStyle",Xc`
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
    `);import{html as ri,css as Jc}from"./lit-all.min.js";var Dn=`
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
@media screen and ${R} {
  :root {
    --consonant-merch-card-segment-width: 276px;
  }
}

@media screen and ${S} {
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
@media screen and ${L} {
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
`;var In={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},prices:{tag:"p",slot:"heading-xs"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},callout:{tag:"div",slot:"callout-content"},planType:!0,secureLabel:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"color-red-700-variation"},allowedBadgeColors:["color-yellow-300-variation","color-gray-300-variation","color-gray-700-variation","color-green-900-variation","color-red-700-variation","gradient-purple-blue"],allowedBorderColors:["color-yellow-300-variation","color-gray-300-variation","color-green-900-variation","color-red-700-variation","gradient-purple-blue"],borderColor:{attribute:"border-color"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},xt=class extends w{constructor(r){super(r)}priceOptionsProvider(r,e){r.dataset.template===G&&(e.displayPlanType=this.card?.settings?.displayPlanType??!1,(r.dataset.template==="strikethrough"||r.dataset.template==="price")&&(e.displayPerUnit=!1))}getGlobalCSS(){return Dn}get badgeElement(){return this.card.querySelector('[slot="badge"]')}get mainPrice(){return this.card.querySelector(`[slot="heading-xs"] ${O}[data-template="price"]`)}async postCardUpdateHook(){this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook()}async adjustLegal(){if(!(this.legalAdjusted||!this.card.id))try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let r=this.mainPrice;if(!r)return;let e=r.cloneNode(!0);if(await r.onceSettled(),!r?.options)return;r.options.displayTax&&(r.dataset.displayTax="false"),r.options.displayPlanType&&(r.dataset.displayPlanType="false"),e.setAttribute("data-template","legal"),e.dataset.displayPerUnit="false",r.parentNode.insertBefore(e,r.nextSibling),await e.onceSettled()}catch{}}renderLayout(){return ri`
            ${this.badge}
            <div class="body">
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${this.promoBottom?"":ri`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`}
                <slot name="body-xs"></slot>
                ${this.promoBottom?ri`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`:""}
                <slot name="badge"></slot>
            </div>
            <hr />
            ${this.secureLabelFooter}
        `}};m(xt,"variantStyle",Jc`
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
    `);import{html as el,css as tl}from"./lit-all.min.js";var $n=`

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

`;var Fn={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"body-xxs"},description:{tag:"div",slot:"body-xs"},ctas:{slot:"footer",size:"m"},backgroundImage:{tag:"div",slot:"bg-image"},style:"consonant"},bt=class extends w{constructor(r){super(r)}getGlobalCSS(){return $n}removeFocusFromModalClose(){let r=this.card.closest(".dialog-modal");r&&r.querySelector(".dialog-close")?.blur()}async postCardUpdateHook(){this.removeFocusFromModalClose(),await super.postCardUpdateHook()}renderLayout(){return el`
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
        `}};m(bt,"variantStyle",tl`
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
    `);import{html as ai,css as rl}from"./lit-all.min.js";var Hn=`
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

@media screen and ${R} {
  :root {
    --consonant-merch-card-special-offers-width: 302px;
  }
}

@media screen and ${S} {
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
@media screen and ${L} {
  .three-merch-cards.special-offers,
  .four-merch-cards.special-offers,
  .three-merch-cards:has(merch-card[variant="special-offers"]),
  .four-merch-cards:has(merch-card[variant="special-offers"]) {
    grid-template-columns: repeat(3, minmax(302px, var(--consonant-merch-card-special-offers-width)));
  }
}

@media screen and ${re} {
  .four-merch-cards.special-offers,
  .four-merch-cards:has(merch-card[variant="special-offers"]) {
    grid-template-columns: repeat(4, minmax(302px, var(--consonant-merch-card-special-offers-width)));
  }
}
`;var Un={cardName:{attribute:"name"},backgroundImage:{tag:"div",slot:"bg-image"},subtitle:{tag:"p",slot:"detail-m"},title:{tag:"h3",slot:"heading-xs"},prices:{tag:"p",slot:"heading-xs-price"},description:{tag:"div",slot:"body-xs"},ctas:{slot:"footer",size:"l"},planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-special-offers"},allowedBadgeColors:["spectrum-yellow-300-special-offers","spectrum-gray-300-special-offers","spectrum-green-900-special-offers"],allowedBorderColors:["spectrum-yellow-300-special-offers","spectrum-gray-300-special-offers","spectrum-green-900-special-offers"],borderColor:{attribute:"border-color"}},yt=class extends w{constructor(e){super(e);m(this,"legal")}get headingSelector(){return'[slot="detail-m"]'}getGlobalCSS(){return Hn}priceOptionsProvider(e,t){t.displayPlanType=this.card?.settings?.displayPlanType??!1}async postCardUpdateHook(){await super.postCardUpdateHook(),this.adjustLegal()}adjustLegal(){if(this.legal!==void 0)return;let e=this.card.querySelector(`${O}[data-template="price"]`);if(!e)return;let t=e.cloneNode(!0);this.legal=t,e.dataset.displayPlanType="false",t.dataset.template="legal",t.dataset.displayPerUnit="false",t.setAttribute("slot","legal"),this.card.appendChild(t)}renderLayout(){return ai`${this.cardImage}
            <div class="body">
                <slot name="detail-m"></slot>
                <slot name="heading-xs"></slot>
                <slot name="heading-xs-price"></slot>
                <slot name="legal"></slot>
                <slot name="body-xs"></slot>
                <slot name="badge"></slot>
            </div>
            ${this.evergreen?ai`
                      <div
                          class="detail-bg-container"
                          style="background: ${this.card.detailBg}"
                      >
                          <slot name="detail-bg"></slot>
                      </div>
                  `:ai`
                      <hr />
                      ${this.secureLabelFooter}
                  `}
            <slot></slot>`}};m(yt,"variantStyle",rl`
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
    `);import{html as qn,css as al}from"./lit-all.min.js";var Bn=`
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
@media screen and ${L} {
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
@media screen and ${R} {
  merch-card[variant="simplified-pricing-express"] [slot="body-xs"] p:first-child mas-mnemonic:first-child {
    --tooltip-left-offset: 0;
  }
}

/* Tooltip containers - overflow handled by Shadow DOM */

/* Mobile styles */
@media screen and ${R} {
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
@media screen and ${R} {
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
@media screen and ${S} and ${K} {
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
@media screen and ${L} {
  merch-card[variant="simplified-pricing-express"] [slot="cta"] sp-button.small-font-size-button,
  merch-card[variant="simplified-pricing-express"] [slot="cta"] button.small-font-size-button,
  merch-card[variant="simplified-pricing-express"] [slot="cta"] a.con-button.small-font-size-button,
  merch-card[variant="simplified-pricing-express"] [slot="cta"] a.spectrum-Button.small-font-size-button,
  merch-card[variant="simplified-pricing-express"] a[slot="cta"].small-font-size-button {
      font-size: var(--merch-card-simplified-pricing-express-body-xs-font-size, 14px);
  }
}
`;var ii={title:{tag:"h3",slot:"heading-xs",maxCount:250,withSuffix:!0},badge:{tag:"div",slot:"badge",default:"spectrum-blue-400"},allowedBadgeColors:["spectrum-blue-400","spectrum-gray-300","spectrum-yellow-300","gradient-purple-blue","gradient-firefly-spectrum"],description:{tag:"div",slot:"body-xs",maxCount:2e3,withSuffix:!1},prices:{tag:"div",slot:"price"},callout:{tag:"div",slot:"callout-content",editorLabel:"Price description"},ctas:{slot:"cta",size:"XL"},borderColor:{attribute:"border-color",specialValues:{gray:"var(--spectrum-gray-300)",blue:"var(--spectrum-blue-400)","gradient-purple-blue":"linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)","gradient-firefly-spectrum":"linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%)"}},disabledAttributes:["badgeColor","badgeBorderColor","trialBadgeColor","trialBadgeBorderColor"],supportsDefaultChild:!0},wt=class extends w{getGlobalCSS(){return Bn}get aemFragmentMapping(){return ii}get headingSelector(){return'[slot="heading-xs"]'}get badge(){let r=this.card.querySelector('[slot="badge"]');return qn`<div
            class="badge-wrapper"
            style="${r?"":"visibility: hidden"}"
        >
            <slot name="badge"></slot>
        </div>`}syncHeights(){if(this.card.getBoundingClientRect().width===0)return;let r=this.card.shadowRoot;if(!r)return;["header","price-container","cta"].forEach(i=>this.updateCardElementMinHeight(r.querySelector(`.${i}`),i));let e=this.card.querySelector('[slot="body-xs"]');e&&this.updateCardElementMinHeight(e,"description");let t=this.card.querySelector('[slot="body-xs"] p:has(mas-mnemonic)');t&&this.updateCardElementMinHeight(t,"icons")}async postCardUpdateHook(){if(!this.card.isConnected)return;await super.postCardUpdateHook();let r=this.getContainer();if(!r)return;let e=r.querySelectorAll(`merch-card[variant="${this.card.variant}"]`),t=34;e.forEach(i=>{i.classList.remove("small-font-size-button"),i.querySelectorAll('[slot="cta"] sp-button, [slot="cta"] button, [slot="cta"] a.con-button, [slot="cta"] a.spectrum-Button, a[slot="cta"]').forEach(o=>{let s=o.textContent.trim().length>t;o.classList.toggle("small-font-size-button",s)})}),T.isDesktopOrUp&&e.forEach(i=>i.variantLayout?.syncHeights?.())}connectedCallbackHook(){!this.card||this.card.failed||(this.setupAccordion(),this.card?.hasAttribute("data-default-card")&&!Ar()&&this.card.setAttribute("data-expanded","true"),this.observeVisibility())}resyncSiblings(){let r=this.getContainer();r&&r.querySelectorAll(`merch-card[variant="${this.card.variant}"]`).forEach(e=>e.variantLayout?.syncHeights?.())}observeVisibility(){typeof ResizeObserver>"u"||(this.lastSyncedWidth=0,this.sizeObserver=new ResizeObserver(()=>{let r=this.card.getBoundingClientRect().width;r<=2||r===this.lastSyncedWidth||(this.lastSyncedWidth=r,this.resyncSiblings())}),this.sizeObserver.observe(this.card))}setupAccordion(){let r=this.card;if(!r)return;let e=()=>{if(Ar())r.removeAttribute("data-expanded");else{let i=r.hasAttribute("data-default-card");r.setAttribute("data-expanded",i?"true":"false")}};e();let t=window.matchMedia(R);this.mediaQueryListener=()=>{e()},t.addEventListener("change",this.mediaQueryListener)}disconnectedCallbackHook(){this.mediaQueryListener&&window.matchMedia(R).removeEventListener("change",this.mediaQueryListener),this.sizeObserver?.disconnect(),this.sizeObserver=null}handleChevronClick(r){r.preventDefault(),r.stopPropagation(),this.toggleExpanded()}handleCardClick(r){r.target.closest('.chevron-button, mas-mnemonic, button, a, [role="button"]')||(r.preventDefault(),this.toggleExpanded())}toggleExpanded(){let r=this.card;if(!r||Ar())return;let i=r.getAttribute("data-expanded")==="true"?"false":"true";r.setAttribute("data-expanded",i)}renderLayout(){return qn`
            ${this.badge}
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
        `}};m(wt,"variantStyle",al`
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
            border: 1px solid transparent;
            padding: calc(
                var(--merch-card-simplified-pricing-express-padding) + 1px
            );
            border-radius: 8px;
            background-origin: border-box;
            background-clip: padding-box, border-box;
        }

        :host(
                [variant='simplified-pricing-express'][border-color='gradient-purple-blue']
            )
            .badge-wrapper {
            background: var(--gradient-purple-blue);
        }
        :host(
                [variant='simplified-pricing-express'][border-color='gradient-purple-blue']
            )
            .card-content {
            background-image: linear-gradient(
                    var(--spectrum-gray-50),
                    var(--spectrum-gray-50)
                ),
                var(--gradient-purple-blue);
        }

        :host(
                [variant='simplified-pricing-express'][border-color='gradient-firefly-spectrum']
            )
            .badge-wrapper {
            background: var(--gradient-firefly-spectrum);
        }
        :host(
                [variant='simplified-pricing-express'][border-color='gradient-firefly-spectrum']
            )
            .card-content {
            background-image: linear-gradient(
                    var(--spectrum-gray-50),
                    var(--spectrum-gray-50)
                ),
                var(--gradient-firefly-spectrum);
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
    `);import{html as Vn,css as il}from"./lit-all.min.js";var Gn=`
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
@media screen and ${L} and (max-width: 1399px) {
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
@media screen and ${L} {
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
`;var ni={title:{tag:"h3",slot:"heading-xs",maxCount:250,withSuffix:!0},badge:{tag:"div",slot:"badge",default:"spectrum-blue-400"},allowedBadgeColors:["spectrum-blue-400","spectrum-gray-300","spectrum-yellow-300","gradient-purple-blue","gradient-firefly-spectrum"],description:{tag:"div",slot:"body-s",maxCount:2e3,withSuffix:!1},shortDescription:{tag:"div",slot:"short-description",maxCount:3e3,withSuffix:!1},callout:{tag:"div",slot:"callout-content",editorLabel:"Price description"},prices:{tag:"div",slot:"price"},trialBadge:{tag:"div",slot:"trial-badge"},ctas:{slot:"cta",size:"XL"},mnemonics:{size:"xs"},borderColor:{attribute:"border-color",specialValues:{gray:"var(--spectrum-gray-300)",blue:"var(--spectrum-blue-400)","gradient-purple-blue":"linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)","gradient-firefly-spectrum":"linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%)"}},showAllSpectrumColors:!0,multiWhatsIncluded:"true",disabledAttributes:[]},or=class or extends w{getGlobalCSS(){return Gn}get aemFragmentMapping(){return ni}get headingSelector(){return'[slot="heading-xs"]'}get badge(){let r=this.card.querySelector('[slot="badge"]');return Vn`<div
            class="badge-wrapper"
            style="${r?"":"visibility: hidden"}"
        >
            <slot name="badge"></slot>
        </div>`}async waitForTitleFont(){let r=this.card.querySelector(this.headingSelector);if(r&&document.fonts?.load){let e=window.getComputedStyle(r),t=`${e.fontWeight} ${e.fontSize} ${e.fontFamily}`;await document.fonts.load(t,r.textContent).catch(()=>null)}await document.fonts.ready}async syncHeights(){if(await this.waitForTitleFont(),await new Promise(s=>requestAnimationFrame(s)),await new Promise(s=>requestAnimationFrame(s)),this.card.getBoundingClientRect().width<=2)return;let r=or.SYNCED_SECTIONS.map(s=>({name:s,getElement:c=>c.shadowRoot?.querySelector(`.${s}`)})),e=this.getContainer(),t=e?e.querySelectorAll(`merch-card[variant="${this.card.variant}"]`):[this.card],i='[slot="body-s"] > *',n=Math.max(0,...Array.from(t,s=>s.querySelectorAll(i).length)),o=Array.from({length:n},(s,c)=>({name:`description-row-${c}`,getElement:l=>l.querySelectorAll(i)[c]}));this.syncRowHeights([...r,...o])}async postCardUpdateHook(){if(!this.card.isConnected)return;await super.postCardUpdateHook();let r=this.getContainer();if(r){let e=r.querySelectorAll(`merch-card[variant="${this.card.variant}"]`),t=49;e.forEach(i=>{i.classList.remove("small-font-size-button"),i.querySelectorAll('[slot="cta"] sp-button, [slot="cta"] button, [slot="cta"] a.con-button, [slot="cta"] a.spectrum-Button, a[slot="cta"]').forEach(o=>{let s=o.textContent.trim().length>t;o.classList.toggle("small-font-size-button",s)})})}window.matchMedia("(min-width: 768px)").matches&&this.syncHeights()}resyncOnReflow(){let r=this.card.getBoundingClientRect().width;if(r<=2)return;let e=this.card.querySelector(this.headingSelector),t=e?Math.round(e.getBoundingClientRect().height):0,i=`${Math.round(r)}:${t}`;i!==this.lastSyncedKey&&(this.lastSyncedKey=i,this.syncHeights())}connectedCallbackHook(){if(!this.card||typeof ResizeObserver>"u")return;this.lastSyncedKey="",this.sizeObserver=new ResizeObserver(()=>this.resyncOnReflow()),this.sizeObserver.observe(this.card);let r=this.card.querySelector(this.headingSelector);r&&this.sizeObserver.observe(r)}disconnectedCallbackHook(){this.sizeObserver?.disconnect(),this.sizeObserver=null}renderLayout(){return Vn`
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
        `}};m(or,"SYNCED_SECTIONS",["header","short-description","price-container","cta"]),m(or,"variantStyle",il`
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
            border: 1px solid transparent;
            padding: calc(var(--merch-card-full-pricing-express-padding) + 1px);
            border-radius: 8px;
            background-origin: border-box;
            background-clip: padding-box, border-box;
        }

        /* Gradient backgrounds */
        :host(
                [variant='full-pricing-express'][border-color='gradient-purple-blue']
            )
            .badge-wrapper {
            background: var(--gradient-purple-blue);
        }
        :host(
                [variant='full-pricing-express'][border-color='gradient-purple-blue']
            )
            .card-content {
            background-image: linear-gradient(
                    var(--spectrum-express-white, #ffffff),
                    var(--spectrum-express-white, #ffffff)
                ),
                var(--gradient-purple-blue);
        }

        :host(
                [variant='full-pricing-express'][border-color='gradient-firefly-spectrum']
            )
            .badge-wrapper {
            background: var(--gradient-firefly-spectrum);
        }
        :host(
                [variant='full-pricing-express'][border-color='gradient-firefly-spectrum']
            )
            .card-content {
            background-image: linear-gradient(
                    var(--spectrum-express-white, #ffffff),
                    var(--spectrum-express-white, #ffffff)
                ),
                var(--gradient-firefly-spectrum);
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
    `);var sr=or;import{html as cr,nothing as Wn}from"./lit-all.min.js";import{css as nl,unsafeCSS as ol}from"./lit-all.min.js";var jn=["headless","marquee","faq","banner-blade"],Et=(a,r="")=>jn.map(e=>`merch-card[variant='${e}'] [slot='${a}']${r}`).join(`,
`),oi=a=>jn.map(r=>`merch-card[variant='${r}'] ${a}`).join(`,
`),Ue=`
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
${Et("heading-xs")},
${Et("promo-text")} {
    color: var(--consonant-merch-card-body-xs-color);
    font-weight: 400;
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
}
${Et("callout-content")} {
    display: block;
    margin: 0;
    gap: 0;
}
${Et("callout-content"," > p")},
${Et("callout-content"," > div")},
${Et("callout-content"," > div > div")} {
    background: transparent;
    padding: 0;
    border-radius: 0;
    width: auto;
}
/* Subtle gray annotation next to each headless CTA showing its authored variant
   (Primary/Secondary/Link), set alongside the button in hydrate.js's transformLinkToButton(). */
${oi(".headless-cta-item")} {
    display: inline-flex;
    align-items: center;
}
${oi(".headless-cta-variant-label")} {
    font-size: 0.75em;
    color: var(--spectrum-gray-600);
    background: var(--spectrum-gray-100);
    border-radius: 4px;
    padding: 2px 6px;
    line-height: 1.4;
    margin-left: var(--consonant-merch-spacing-xxs, 4px);
}
${oi(".headless-cta-item:not(:last-child)::after")} {
    content: ', ';
}
`;function Be(a){let r=ol(a);return nl`
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
    `}var Yn={cardName:{attribute:"name"},title:{tag:"p",slot:"heading-xs"},cardTitle:{tag:"p",slot:"heading-xs"},subtitle:{tag:"p",slot:"body-xxs"},description:{tag:"div",slot:"body-xs"},promoText:{tag:"p",slot:"promo-text"},shortDescription:{tag:"p",slot:"short-description"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},whatsIncluded:{tag:"div",slot:"whats-included"},addonConfirmation:{tag:"div",slot:"addon-confirmation"},badge:{tag:"div",slot:"badge"},trialBadge:{tag:"div",slot:"trial-badge"},prices:{tag:"p",slot:"prices"},backgroundImage:{tag:"div",slot:"bg-image"},ctas:{slot:"footer",size:"m"},addon:!0,secureLabel:!0,borderColor:{attribute:"border-color"},backgroundColor:{attribute:"background-color"},size:[],mnemonics:{size:"m"},customFields:{tag:"div",slot:"custom-fields"}},sl=[{slot:"bg-image",label:"Background Image"},{slot:"badge",label:"Badge"},{slot:"icons",label:"Mnemonic icon"},{slot:"heading-xs",label:"Title"},{slot:"body-xxs",label:"Subtitle"},{slot:"body-xs",label:"Product description"},{slot:"promo-text",label:"Promo Text"},{slot:"callout-content",label:"Callout text"},{slot:"short-description",label:"Short Description"},{slot:"trial-badge",label:"Trial Badge"},{slot:"prices",label:"Product price"},{slot:"quantity-select",label:"Quantity select"},{slot:"addon",label:"Addon"},{slot:"whats-included",label:"What's included"},{slot:"addon-confirmation",label:"Addon confirmation"},{slot:"footer",label:"CTAs"}],At=class extends w{constructor(r){super(r)}getGlobalCSS(){return Ue}renderLayout(){let r=[...this.card.querySelectorAll('[slot^="custom-field-"]')];return cr`
            <div class="headless">
                ${sl.map(({slot:e,label:t})=>cr`
                        <div class="headless-row">
                            <span class="headless-label">${t}</span>
                            <span class="headless-value" data-slot="${e}">
                                <slot name="${e}"></slot>
                            </span>
                        </div>
                    `)}
                ${r.length?cr`
                          <div class="headless-row">
                              <span class="headless-label headless-section">
                                  Custom fields
                              </span>
                          </div>
                          ${r.map((e,t)=>cr`
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
                      `:Wn}
                ${this.card.secureLabel?cr`
                          <div class="headless-row">
                              <span class="headless-label">Secure label</span>
                              <span class="headless-value">
                                  ${this.secureLabel}
                              </span>
                          </div>
                      `:Wn}
            </div>
        `}};m(At,"variantStyle",Be("headless"));import{css as cl,html as ll}from"./lit-all.min.js";var Kn=`
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
`;var Qn={title:{tag:"p",slot:"title"},prices:{tag:"p",slot:"prices"},description:{tag:"p",slot:"description"},planType:!0,ctas:{slot:"ctas",size:"S"}},kt=class extends w{constructor(){super(...arguments);m(this,"legal")}async postCardUpdateHook(){await super.postCardUpdateHook(),this.adjustLegal()}getGlobalCSS(){return Kn}get headingSelector(){return'[slot="title"]'}priceOptionsProvider(e,t){t.literals={...t.literals,strikethroughAriaLabel:"",alternativePriceAriaLabel:""},t.space=!0,t.displayAnnual=this.card.settings?.displayAnnual??!1}adjustLegal(){if(this.legal!==void 0)return;let e=this.card.querySelector(`${O}[data-template="price"]`);if(!e)return;let t=e.cloneNode(!0);this.legal=t,e.dataset.displayTax="false",e.dataset.displayPerUnit="false",t.dataset.template="legal",t.dataset.displayPlanType=this.card?.settings?.displayPlanType??!0,t.setAttribute("slot","legal"),this.card.appendChild(t)}renderLayout(){return ll`
            ${this.badge}
            <div class="body">
                <slot name="title"></slot>
                <slot name="prices"></slot>
                <slot name="legal"></slot>
                <slot name="description"></slot>
                <slot name="ctas"></slot>
            </div>
        `}};m(kt,"variantStyle",cl`
        :host([variant='mini']) {
            min-width: 209px;
            min-height: 103px;
            background-color: var(--spectrum-background-base-color);
            border: 1px solid var(--consonant-merch-card-border-color, #dadada);
        }
    `);import{html as dl,css as hl}from"./lit-all.min.js";var Zn=`
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
`;var si={mnemonics:{size:"l"},title:{tag:"h3",slot:"header",maxCount:100},badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],prices:{tag:"p",slot:"price"},description:{tag:"div",slot:"detail",maxCount:1e3},callout:{tag:"div",slot:"callout-content"},ctas:{slot:"cta",size:"M"},features:{tag:"div",slot:"features",unwrap:!0}},pl=[{key:"header",selector:".seg-header"},{key:"price",selector:".seg-price"},{key:"detail",selector:".seg-detail"},{key:"cta",selector:".seg-cta"}],$r,Xn,St=class extends w{constructor(e){super(e);k(this,$r);this.postCardUpdateHook=this.postCardUpdateHook.bind(this)}getGlobalCSS(){return Zn}get aemFragmentMapping(){return si}getContainer(){return this.card.closest("mas-compare-chart")??this.card.parentElement}connectedCallbackHook(){window.addEventListener("resize",this.postCardUpdateHook)}disconnectedCallbackHook(){window.removeEventListener("resize",this.postCardUpdateHook)}async postCardUpdateHook(){this.card.isConnected&&(await this.card.updateComplete,$(this,$r,Xn).call(this))}renderLayout(){return dl`
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
        `}};$r=new WeakSet,Xn=function(){if(this.card.getBoundingClientRect().width===0)return;let e=this.card.shadowRoot;pl.forEach(({key:t,selector:i})=>this.updateCardElementMinHeight(e.querySelector(i),t))},m(St,"variantStyle",hl`
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
    `);import{html as ml,css as ul}from"./lit-all.min.js";var Jn=`
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
`;var ci={mnemonics:{size:"s"},title:{tag:"h3",slot:"heading-xxs",maxCount:250,withSuffix:!0},description:{tag:"div",slot:"body-s",maxCount:2e3,withSuffix:!1},whatsIncluded:{tag:"div",slot:"whats-included"},badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300"},trialBadge:{tag:"div",slot:"trial-badge",default:"spectrum-green-800"},prices:{tag:"p",slot:"price"},ctas:{slot:"cta",size:"M"},addonConfirmation:{tag:"div",slot:"addon-confirmation"},borderColor:{attribute:"border-color",specialValues:{gray:"--spectrum-gray-300","gradient-purple-blue":"var(--gradient-purple-blue)","gradient-firefly-spectrum":"var(--gradient-firefly-spectrum)"}}},Ct=class extends w{getGlobalCSS(){return Jn}get aemFragmentMapping(){return ci}renderLayout(){return ml`
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
        `}};m(Ct,"variantStyle",ul`
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
    `);import{html as di,nothing as qr}from"./lit-all.min.js";import{html as li}from"./lit-all.min.js";var gl="(min-width: 1200px)",fl="(min-width: 600px)";function eo(a,r){if(!a)return"";let e=new DOMParser().parseFromString(`<picture>${a}</picture>`,"text/html");if(r==="desktop")return e.querySelector(`source[media="${gl}"]`)?.getAttribute("srcset")??"";if(r==="tablet")return e.querySelector(`source[media="${fl}"]`)?.getAttribute("srcset")??"";if(r==="mobile"){let t=e.querySelector("img");return t?.hasAttribute("data-mobile-set")?t.getAttribute("src")??"":""}return""}var to=["tablet","mobile"];function ro(a,r){let t=a.querySelector('[slot="backgrounds"]')?.innerHTML??"";to.forEach(i=>{let n=r.querySelector(`[data-backgrounds-breakpoint="${i}"]`);if(!n)return;n.replaceChildren();let o=eo(t,i);if(!o){n.textContent="\u2014";return}let s=document.createElement("img");s.loading="lazy",s.alt="",s.src=o,n.append(s)})}function Fr(a){return function(e){let t=a(),i=t.shadowRoot?.querySelector(".headless-backgrounds-detail");if(!i)return;let n=i.classList.contains("hidden");n&&ro(t,i),i.classList.toggle("hidden",!n),e.target.textContent=n?"Show default only":"See all backgrounds"}}function Hr(a){return function(){let e=a(),t=e.shadowRoot?.querySelector(".headless-backgrounds-detail");!t||t.classList.contains("hidden")||ro(e,t)}}function Ur(a){return li`
        <button
            type="button"
            class="headless-backgrounds-toggle"
            @click="${a}"
        >
            See all backgrounds
        </button>
    `}function vl(a){return`Background ${a[0].toUpperCase()}${a.slice(1)}`}function Br(){return li`
        <div class="headless-row headless-backgrounds-detail hidden">
            ${to.map(a=>li`
                    <div class="headless-backgrounds-detail-row">
                        <span class="headless-label"
                            >${vl(a)}</span
                        >
                        <span
                            class="headless-value"
                            data-backgrounds-breakpoint="${a}"
                        ></span>
                    </div>
                `)}
        </div>
    `}var ao={cardName:{attribute:"name"},image:{tag:"picture",slot:"image"},backgrounds:{tag:"picture",slot:"backgrounds"},title:{tag:"p",slot:"heading-xs"},description:{tag:"div",slot:"body-xs"},shortDescription:{tag:"p",slot:"short-description"},prices:{tag:"p",slot:"prices"},ctas:{slot:"footer",size:"m"}},xl=[{slot:"image",label:"Image"},{slot:"backgrounds",label:"Background"},{slot:"heading-xs",label:"Title"},{slot:"body-xs",label:"Product description"},{slot:"short-description",label:"Short Description"},{slot:"prices",label:"Product price"},{slot:"footer",label:"CTAs"}],Tt=class extends w{constructor(e){super(e);m(this,"toggleBackgroundsDetail",Fr(()=>this.card));m(this,"refreshBackgroundsDetail",Hr(()=>this.card))}getGlobalCSS(){return Ue}renderLayout(){return di`
            <div class="headless">
                ${xl.map(({slot:e,label:t})=>di`
                        <div class="headless-row">
                            <span class="headless-label">${t}</span>
                            <span class="headless-value" data-slot="${e}">
                                <slot
                                    name="${e}"
                                    @slotchange=${e==="backgrounds"?this.refreshBackgroundsDetail:qr}
                                ></slot>
                                ${e==="backgrounds"?Ur(this.toggleBackgroundsDetail):qr}
                            </span>
                        </div>
                        ${e==="backgrounds"?Br():qr}
                    `)}
                ${this.card.secureLabel?di`
                          <div class="headless-row">
                              <span class="headless-label">Secure label</span>
                              <span class="headless-value">
                                  ${this.secureLabel}
                              </span>
                          </div>
                      `:qr}
            </div>
        `}};m(Tt,"variantStyle",Be("marquee"));import{html as io}from"./lit-all.min.js";var no={cardName:{attribute:"name"},prices:{tag:"p",slot:"prices"},description:{tag:"div",slot:"body-xs",editorLabel:"FAQ answer 1"},shortDescription:{tag:"p",slot:"short-description",editorLabel:"FAQ answer 2"},callout:{tag:"div",slot:"callout-content",editorLabel:"FAQ answer 3"}},bl=[{slot:"prices",label:"Product price"},{slot:"body-xs",label:"FAQ answer 1"},{slot:"short-description",label:"FAQ answer 2"},{slot:"callout-content",label:"FAQ answer 3"}],Lt=class extends w{constructor(r){super(r)}getGlobalCSS(){return Ue}renderLayout(){return io`
            <div class="headless">
                ${bl.map(({slot:r,label:e})=>io`
                        <div class="headless-row">
                            <span class="headless-label">${e}</span>
                            <span class="headless-value">
                                <slot name="${r}"></slot>
                            </span>
                        </div>
                    `)}
            </div>
        `}};m(Lt,"variantStyle",Be("faq"));import{html as oo,nothing as hi}from"./lit-all.min.js";var so={cardName:{attribute:"name"},image:{tag:"picture",slot:"image"},backgrounds:{tag:"picture",slot:"backgrounds"},title:{tag:"p",slot:"heading-xs"},description:{tag:"div",slot:"body-xs"},ctas:{slot:"footer",size:"m"}},yl=[{slot:"image",label:"Image"},{slot:"backgrounds",label:"Background"},{slot:"heading-xs",label:"Title"},{slot:"body-xs",label:"Description"},{slot:"footer",label:"CTAs"}],Pt=class extends w{constructor(e){super(e);m(this,"toggleBackgroundsDetail",Fr(()=>this.card));m(this,"refreshBackgroundsDetail",Hr(()=>this.card))}getGlobalCSS(){return Ue}renderLayout(){return oo`
            <div class="headless">
                ${yl.map(({slot:e,label:t})=>oo`
                        <div class="headless-row">
                            <span class="headless-label">${t}</span>
                            <span class="headless-value" data-slot="${e}">
                                <slot
                                    name="${e}"
                                    @slotchange=${e==="backgrounds"?this.refreshBackgroundsDetail:hi}
                                ></slot>
                                ${e==="backgrounds"?Ur(this.toggleBackgroundsDetail):hi}
                            </span>
                        </div>
                        ${e==="backgrounds"?Br():hi}
                    `)}
            </div>
        `}};m(Pt,"variantStyle",Be("banner-blade"));import{html as wl,css as El}from"./lit-all.min.js";var co=`
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
}

/* Studio uses <merch-card-collection>; milo/preview wraps cards in
   .N-merch-cards grid containers, so both selector families are covered. */
@media screen and ${S} {
    merch-card-collection.product-pricing,
    .two-merch-cards:has(merch-card[variant='product-pricing']),
    .three-merch-cards:has(merch-card[variant='product-pricing']),
    .four-merch-cards:has(merch-card[variant='product-pricing']) {
        grid-template-columns: repeat(2, minmax(261px, 474px));
    }
}

@media screen and ${je} {
    merch-card-collection.product-pricing,
    .three-merch-cards:has(merch-card[variant='product-pricing']),
    .four-merch-cards:has(merch-card[variant='product-pricing']) {
        grid-template-columns: repeat(3, minmax(261px, 474px));
    }
}

@media screen and ${Xi} {
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
    --product-frame-border: #dadada;
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

/* Figma stacks the legal block: per-unit on its own line, tax and plan type
   below. The global leading nbsp would indent the line, so drop it. */
merch-card[variant="product-pricing"] span[data-template="legal"] .price-unit-type:not(.disabled) {
    display: block;
}

merch-card[variant="product-pricing"] span[data-template="legal"] .price-unit-type:not(.disabled)::before,
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

merch-card[variant="product-pricing"] [slot="footer"] {
    display: flex;
    gap: 4px;
    width: 100%;
}

merch-card[variant="product-pricing"] [slot="footer"] a {
    flex: 1 0 0;
    min-width: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    border-radius: 999px;
    min-height: 40px;
    padding: 0 24px;
    font-size: 14px;
    font-weight: 700;
    text-align: center;
    text-decoration: none;
    white-space: nowrap;
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
`;var lo=S,ho=[{name:"heading-s",getElement:a=>a.querySelector('[slot="heading-s"]')},{name:"body-xs",getElement:a=>a.querySelector('[slot="body-xs"]')},{name:"price",getElement:a=>a.shadowRoot?.querySelector(".price")}],po={cardName:{attribute:"name"},mnemonics:{size:"s"},badge:{tag:"div",slot:"badge"},title:{tag:"h3",slot:"heading-s"},prices:{tag:"p",slot:"heading-xs"},description:{tag:"div",slot:"body-xs"},shortDescription:{tag:"div",slot:"short-description"},ctas:{slot:"footer",size:"m"},planType:!0,style:"consonant"},_e,lr,_t=class extends w{constructor(){super(...arguments);k(this,_e,null);k(this,lr,()=>this.resyncOnReflow());m(this,"lastSyncKey",null)}getGlobalCSS(){return co}get headingSelector(){return'[slot="heading-s"]'}priceOptionsProvider(e,t){e.dataset.template===G&&(t.displayPlanType=this.card?.settings?.displayPlanType??!0)}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let e=this.card.querySelector(`[slot="heading-xs"] ${O}:not([data-template="legal"])`);if(!e)return;let t=e.cloneNode(!0);if(await e.onceSettled(),!e.options)return;e.options.displayPerUnit&&(e.dataset.displayPerUnit="false"),e.options.displayTax&&(e.dataset.displayTax="false"),e.options.displayPlanType&&(e.dataset.displayPlanType="false"),t.setAttribute("data-template","legal"),this.legalHost().appendChild(t),await t.onceSettled()}catch{}}legalHost(){let e=this.card.querySelector('p[slot="legal"]');return e||(e=document.createElement("p"),e.setAttribute("slot","legal"),this.card.appendChild(e)),e}async postCardUpdateHook(){this.card.isConnected&&(this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook(),this.flagPriceRow(),window.matchMedia(lo).matches&&requestAnimationFrame(()=>this.syncHeights()))}syncHeights(){this.card.getBoundingClientRect().width<=2||window.matchMedia(lo).matches&&this.syncRowHeights(ho)}flagPriceRow(){this.card.toggleAttribute("no-price",!this.card.querySelector('[slot="heading-xs"]'))}resyncOnReflow(){let e=this.card.getBoundingClientRect().width;if(e<=2)return;let t=[Math.round(e),...ho.map(({getElement:i})=>Math.round(i(this.card)?.getBoundingClientRect().height||0))].join(":");t!==this.lastSyncKey&&(this.lastSyncKey=t,this.syncHeights())}connectedCallbackHook(){if(this.card.addEventListener(ie,v(this,lr)),typeof ResizeObserver>"u")return;A(this,_e,new ResizeObserver(()=>this.resyncOnReflow())),v(this,_e).observe(this.card);let e=this.card.querySelector('[slot="body-xs"]');e&&v(this,_e).observe(e);let t=this.card.querySelector('[slot="short-description"]');t&&v(this,_e).observe(t)}disconnectedCallbackHook(){this.card.removeEventListener(ie,v(this,lr)),v(this,_e)?.disconnect(),A(this,_e,null)}renderLayout(){return wl` <div class="header">
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
                    <div class="price">
                        <slot name="heading-xs"></slot>
                        <div class="fine">
                            <slot name="legal"></slot>
                            <slot name="short-description"></slot>
                        </div>
                    </div>
                    <footer><slot name="footer"></slot></footer>
                </div>
            </div>
            <slot></slot>`}};_e=new WeakMap,lr=new WeakMap,m(_t,"variantStyle",El`
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
           background is white by default, black when framed (badge authored or a
           CTA hovered); triggers live in product-pricing.css.js. */
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
        }

        /* No price authored: hide the price slot and drop the reserved row
           height, else it leaves a blank band above the CTAs. Chrome rejects
           :has() inside :host(), so the flag is an attribute (see flagPriceRow). */
        :host([variant='product-pricing'][no-price]) slot[name='heading-xs'] {
            display: none;
        }

        :host([variant='product-pricing'][no-price]) .price {
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

        /* Price + short-description: one bottom-aligned synced row (SYNCED_ROWS). */
        :host([variant='product-pricing']) .price {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            gap: 8px;
            min-height: var(
                --consonant-merch-card-product-pricing-price-height
            );
        }

        /* Legal + short-description share this sub-row; a card shows one. */
        :host([variant='product-pricing']) .fine {
            display: flex;
            flex-direction: column;
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
        }
    `);import{html as Al,css as kl}from"./lit-all.min.js";var mo=`
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

@media screen and ${R} {
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

@media screen and ${S} {
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

`;var uo={cardName:{attribute:"name"},subtitle:{tag:"p",slot:"subtitle"},description:{tag:"div",slot:"body-xs"},prices:{tag:"p",slot:"heading-m"},shortDescription:{tag:"div",slot:"short-description"},ctas:{slot:"footer",size:"m"},planType:!0,backgroundColor:{attribute:"background-color"},allowedColors:{gray:"--spectrum-gray-100",black:"--spectrum-black"},badge:{tag:"div",slot:"badge",default:"color-yellow-300-variation"},allowedBadgeColors:["color-white","color-yellow-300-variation","color-gray-300-variation","color-gray-700-variation","color-green-900-variation","color-red-700-variation"],style:"consonant"},Mt=class extends w{getGlobalCSS(){return mo}get mainPrice(){return this.card.querySelector(`[slot="heading-m"] ${O}[data-template="price"]`)}async postCardUpdateHook(){this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook()}async adjustLegal(){if(!(this.legalAdjusted||!this.card.id))try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let r=this.mainPrice;if(!r)return;let e=r.cloneNode(!0);if(await r.onceSettled(),!r?.options)return;r.options.displayPlanType&&(r.dataset.displayPlanType="false"),e.setAttribute("data-template","legal"),e.dataset.displayPerUnit="false",r.parentNode.insertBefore(e,r.nextSibling),await e.onceSettled()}catch{}}priceOptionsProvider(r,e){r.dataset.template===G&&(e.displayPlanType=this.card?.settings?.displayPlanType??!0)}renderLayout(){return Al`
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
        `}};m(Mt,"variantStyle",kl`
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
    `);var go=new Map;var D=(a,r,e=null,t=null,i)=>{go.set(a,{class:r,fragmentMapping:e,style:t,collectionOptions:i})};D("catalog",lt,dn,lt.variantStyle);D("image",We);D("inline-heading",Pr);D("mini-compare-chart",dt,ja,dt.variantStyle);D("mini-compare-chart-mweb",ht,Qa,ht.variantStyle);D("plans",oe,Rr,oe.variantStyle,oe.collectionOptions);D("plans-students",oe,yn,oe.variantStyle,oe.collectionOptions);D("plans-education",oe,bn,oe.variantStyle,oe.collectionOptions);D("plans-v2",He,Za,He.variantStyle,He.collectionOptions);D("pro",ar,Pn,ar.variantStyle);D("product",ft,zn,ft.variantStyle);D("brand-concierge-product",vt,Nn,vt.variantStyle);D("segment",xt,In,xt.variantStyle);D("media",bt,Fn,bt.variantStyle);D("headless",At,Yn,At.variantStyle);D("special-offers",yt,Un,yt.variantStyle);D("simplified-pricing-express",wt,ii,wt.variantStyle);D("full-pricing-express",sr,ni,sr.variantStyle);D("mini",kt,Qn,kt.variantStyle);D("image",We,pn,We.variantStyle);D("compare-chart-column",St,si,St.variantStyle);D("fries",Ct,ci,Ct.variantStyle);D("marquee",Tt,ao,Tt.variantStyle);D("faq",Lt,no,Lt.variantStyle);D("banner-blade",Pt,so,Pt.variantStyle);D("product-pricing",_t,po,_t.variantStyle);D("product-c2",Mt,uo,Mt.variantStyle);function Qt(a){return go.get(a)?.fragmentMapping}var vo=a=>{let r=a.replace(/^mas:/,"").split("/");return r.length<2?[null,null]:[r[0],r[r.length-1]]},fo=(a,r)=>{let e=r?.tagLabels?.[a]||a;return e.startsWith("coll-tag-filter")?a.charAt(0).toUpperCase()+a.slice(1):e},xo=(a,r,e)=>{let t=new Map;for(let n of a){let[o,s]=vo(n);!o||!s||(t.has(o)||t.set(o,[]),t.get(o).push({name:s,label:fo(s,e)}))}let i=t.size===1;return[...t.entries()].map(([n,o])=>({title:i&&r?r:fo(n,e),label:n,deeplink:n,checkboxes:o}))},bo=(a,r)=>(a??[]).map(vo).filter(([e,t])=>e&&t&&r.has(e)).map(([e,t])=>`${e}:${t}`),yo=(a,r,e)=>r.every(t=>{let i=(e[t.deeplink]||"").split(",").filter(Boolean);return i.length?i.some(n=>a.includes(`${t.deeplink}:${n}`)):!0});var wo="tacocat.js";var pi=(a,r)=>String(a??"").toLowerCase()==String(r??"").toLowerCase(),Eo=a=>`${a??""}`.replace(/[&<>'"]/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[r]??r)??"";function I(a,r={},{metadata:e=!0,search:t=!0,storage:i=!0}={}){let n;if(t&&n==null){let o=new URLSearchParams(window.location.search),s=Rt(t)?t:a;n=o.get(s)}if(i&&n==null){let o=Rt(i)?i:a;n=window.sessionStorage.getItem(o)??window.localStorage.getItem(o)}if(e&&n==null){let o=Cl(Rt(e)?e:a);n=document.documentElement.querySelector(`meta[name="${o}"]`)?.content}return n??r[a]}var Sl=a=>typeof a=="boolean",Gr=a=>typeof a=="function",Vr=a=>typeof a=="number",Ao=a=>a!=null&&typeof a=="object";var Rt=a=>typeof a=="string",mi=a=>Rt(a)&&a,zt=a=>Vr(a)&&Number.isFinite(a)&&a>0;function jr(a,r=e=>e==null||e===""){return a!=null&&Object.entries(a).forEach(([e,t])=>{r(t)&&delete a[e]}),a}function C(a,r){if(Sl(a))return a;let e=String(a);return e==="1"||e==="true"?!0:e==="0"||e==="false"?!1:r}function dr(a,r,e){let t=Object.values(r);return t.find(i=>pi(i,a))??e??t[0]}function Cl(a=""){return String(a).replace(/(\p{Lowercase_Letter})(\p{Uppercase_Letter})/gu,(r,e,t)=>`${e}-${t}`).replace(/\W+/gu,"-").toLowerCase()}function ko(a,r=1){return Vr(a)||(a=Number.parseInt(a,10)),!Number.isNaN(a)&&a>0&&Number.isFinite(a)?a:r}var Tl=Date.now(),ui=()=>`(+${Date.now()-Tl}ms)`,Wr=new Set,Ll=C(I("tacocat.debug",{},{metadata:!1}),!1);function So(a){let r=`[${wo}/${a}]`,e=(o,s,...c)=>o?!0:(i(s,...c),!1),t=Ll?(o,...s)=>{console.debug(`${r} ${o}`,...s,ui())}:()=>{},i=(o,...s)=>{let c=`${r} ${o}`;Wr.forEach(([l])=>l(c,...s))};return{assert:e,debug:t,error:i,warn:(o,...s)=>{let c=`${r} ${o}`;Wr.forEach(([,l])=>l(c,...s))}}}function Pl(a,r){let e=[a,r];return Wr.add(e),()=>{Wr.delete(e)}}Pl((a,...r)=>{console.error(a,...r,ui())},(a,...r)=>{console.warn(a,...r,ui())});var _l="no promo",Co="promo-tag",Ml="yellow",Rl="neutral",zl=(a,r,e)=>{let t=n=>n||_l,i=e?` (was "${t(r)}")`:"";return`${t(a)}${i}`},Yr="cancel-context",Kr=(a,r)=>{let e=a===Yr,t=!e&&a?.length>0,i=(t||e)&&(r&&r!=a||!r&&!e),n=i&&t||!i&&!!r,o=n?a||r:void 0;return{effectivePromoCode:o,overridenPromoCode:a,className:n?Co:`${Co} no-promo`,text:zl(o,r,i),variant:n?Ml:Rl,isOverriden:i}};var gi;(function(a){a.BASE="BASE",a.TRIAL="TRIAL",a.PROMOTION="PROMOTION"})(gi||(gi={}));var le;(function(a){a.MONTH="MONTH",a.YEAR="YEAR",a.TWO_YEARS="TWO_YEARS",a.THREE_YEARS="THREE_YEARS",a.PERPETUAL="PERPETUAL",a.TERM_LICENSE="TERM_LICENSE",a.ACCESS_PASS="ACCESS_PASS",a.THREE_MONTHS="THREE_MONTHS",a.SIX_MONTHS="SIX_MONTHS"})(le||(le={}));var he;(function(a){a.ANNUAL="ANNUAL",a.MONTHLY="MONTHLY",a.TWO_YEARS="TWO_YEARS",a.THREE_YEARS="THREE_YEARS",a.P1D="P1D",a.P1Y="P1Y",a.P3Y="P3Y",a.P10Y="P10Y",a.P15Y="P15Y",a.P3D="P3D",a.P7D="P7D",a.P30D="P30D",a.HALF_YEARLY="HALF_YEARLY",a.QUARTERLY="QUARTERLY"})(he||(he={}));var fi;(function(a){a.INDIVIDUAL="INDIVIDUAL",a.TEAM="TEAM",a.ENTERPRISE="ENTERPRISE"})(fi||(fi={}));var vi;(function(a){a.COM="COM",a.EDU="EDU",a.GOV="GOV"})(vi||(vi={}));var xi;(function(a){a.DIRECT="DIRECT",a.INDIRECT="INDIRECT"})(xi||(xi={}));var bi;(function(a){a.ENTERPRISE_PRODUCT="ENTERPRISE_PRODUCT",a.ETLA="ETLA",a.RETAIL="RETAIL",a.VIP="VIP",a.VIPMP="VIPMP",a.FREE="FREE"})(bi||(bi={}));var yi="ABM",wi="PUF",Ei="M2M",Ai="PERPETUAL",ki="P3Y",Ol="TAX_INCLUSIVE_DETAILS",Nl="TAX_EXCLUSIVE",To={ABM:yi,PUF:wi,M2M:Ei,PERPETUAL:Ai,P3Y:ki},ef={[yi]:{commitment:le.YEAR,term:he.MONTHLY},[wi]:{commitment:le.YEAR,term:he.ANNUAL},[Ei]:{commitment:le.MONTH,term:he.MONTHLY},[Ai]:{commitment:le.PERPETUAL,term:void 0},[ki]:{commitment:le.THREE_MONTHS,term:he.P3Y}},Lo="Value is not an offer",Qr=a=>{if(typeof a!="object")return Lo;let{commitment:r,term:e}=a,t=Dl(r,e);return{...a,planType:t}};var Dl=(a,r)=>{switch(a){case void 0:return Lo;case"":return"";case le.YEAR:return r===he.MONTHLY?yi:r===he.ANNUAL?wi:"";case le.MONTH:return r===he.MONTHLY?Ei:"";case le.PERPETUAL:return Ai;case le.TERM_LICENSE:return r===he.P3Y?ki:"";default:return""}};function Po(a){let{priceDetails:r}=a,{price:e,priceWithoutDiscount:t,priceWithoutTax:i,priceWithoutDiscountAndTax:n,taxDisplay:o}=r;if(o!==Ol)return a;let s={...a,priceDetails:{...r,price:i??e,priceWithoutDiscount:n??t,taxDisplay:Nl}};return s.offerType==="TRIAL"&&s.priceDetails.price===0&&(s.priceDetails.price=s.priceDetails.priceWithoutDiscount),s}var Me={clientId:"merch-at-scale",delimiter:"\xB6",ignoredProperties:["analytics","literals","element"],serializableTypes:["Array","Object"],sampleRate:1,severity:"e",tags:"acom",isProdDomain:!1,country:""},_o=1e3,Mo="mas-commerce-service:country";function Il(a){return a instanceof Error||typeof a?.originatingRequest=="string"}function Ro(a){if(a==null)return;let r=typeof a;if(r==="function")return a.name?`function ${a.name}`:"function";if(r==="object"){if(a instanceof Error)return a.message;if(typeof a.originatingRequest=="string"){let{message:t,originatingRequest:i,status:n}=a;return[t,n,i].filter(Boolean).join(" ")}let e=a[Symbol.toStringTag]??Object.getPrototypeOf(a).constructor.name;if(!Me.serializableTypes.includes(e))return e}return a}function $l(a,r){if(!Me.ignoredProperties.includes(a))return Ro(r)}function Fl(a){let[r,...e]=a;return r?.constructor===Object?[{...r,[Mo]:Me.country},...e]:[{[Mo]:Me.country},...a]}var Si={append(a){if(a.level!=="error")return;let{message:r,params:e}=a,t=[],i=[],n=r;e.forEach(l=>{l!=null&&(Il(l)?t:i).push(l)}),t.length&&(n+=` ${t.map(Ro).join(" ")}`);let{pathname:o,search:s}=window.location,c=`${Me.delimiter}page=${o}${s}`;c.length>_o&&(c=`${c.slice(0,_o)}<trunc>`),n+=c,n+=`${Me.delimiter}facts=`,n+=JSON.stringify(Fl(i),$l),window.lana?.log(n,Me)}};function Zr(a){Object.assign(Me,Object.fromEntries(Object.entries(a).filter(([r,e])=>r in Me&&e!==""&&e!==null&&e!==void 0&&!Number.isNaN(e))))}var zo={LOCAL:"local",PROD:"prod",STAGE:"stage"},Ci={DEBUG:"debug",ERROR:"error",INFO:"info",WARN:"warn"},Ti=new Set,Li=new Set,Oo=new Map,No={append({level:a,message:r,params:e,timestamp:t,source:i}){console[a](`${t}ms [${i}] %c${r}`,"font-weight: bold;",...e)}},Do={filter:({level:a})=>a!==Ci.DEBUG},Hl={filter:()=>!1};function Ul(a,r,e,t,i){return{level:a,message:r,namespace:e,get params(){return t.length===1&&Gr(t[0])&&(t=t[0](),Array.isArray(t)||(t=[t])),t},source:i,timestamp:performance.now().toFixed(3)}}function Bl(a){[...Li].every(r=>r(a))&&Ti.forEach(r=>r(a))}function Io(a){let r=(Oo.get(a)??0)+1;Oo.set(a,r);let e=`${a} #${r}`,t={id:e,namespace:a,module:i=>Io(`${t.namespace}/${i}`),updateConfig:Zr};return Object.values(Ci).forEach(i=>{t[i]=(n,...o)=>Bl(Ul(i,n,a,o,e))}),Object.seal(t)}function Xr(...a){a.forEach(r=>{let{append:e,filter:t}=r;Gr(t)&&Li.add(t),Gr(e)&&Ti.add(e)})}function ql(a={}){let{name:r}=a,e=C(I("commerce.debug",{search:!0,storage:!0}),r===zo.LOCAL);return Xr(e?No:Do),r===zo.PROD&&Xr(Si),ee}function Gl(){Ti.clear(),Li.clear()}var ee={...Io(Pa),Level:Ci,Plugins:{consoleAppender:No,debugFilter:Do,quietFilter:Hl,lanaAppender:Si},init:ql,reset:Gl,use:Xr};var Vl="mas-commerce-service",jl=ee.module("utilities"),Wl={requestId:Vt,etag:"Etag",lastModified:"Last-Modified",serverTiming:"server-timing"};function hr(a,{country:r,forceTaxExclusive:e}){let t;if(a.length<2)t=a;else{let i=r==="GB"?"EN":"MULT";a.sort((n,o)=>n.language===i?-1:o.language===i?1:0),a.sort((n,o)=>!n.term&&o.term?-1:n.term&&!o.term?1:0),t=[a[0]]}return e&&(t=t.map(i=>{let n=Po(i);return n===i?i:{...n,priceInfo:void 0}})),t}var $o=(a,r)=>{let e=a.reduce((t,i)=>t+(r(i)||0),0);return e>0?Math.round(e*100)/100:void 0};function Pi(a){if(!a||a.length===0)return null;if(a.length===1)return a[0];let[r,...e]=a;for(let s of e){let c=[["commitment","commitment types"],["term","terms"],["priceDetails.formatString","currency formats"]];for(let[l,d]of c){let f=l.includes(".")?r.priceDetails?.formatString:r[l],g=l.includes(".")?s.priceDetails?.formatString:s[l];g!==f&&jl.warn(`Offers have different ${d}, summing may produce unexpected results`,{expected:f,actual:g})}}let t=[["price",s=>s.priceDetails?.price],["priceWithoutDiscount",s=>s.priceDetails?.priceWithoutDiscount],["priceWithoutTax",s=>s.priceDetails?.priceWithoutTax],["priceWithoutDiscountAndTax",s=>s.priceDetails?.priceWithoutDiscountAndTax]],i={};for(let[s,c]of t){let l=$o(a,c);l!==void 0&&(i[s]=l)}let n=a.some(s=>s.priceDetails?.annualized),o;if(n){let s=[["annualizedPrice",c=>c.priceDetails?.annualized?.annualizedPrice],["annualizedPriceWithoutTax",c=>c.priceDetails?.annualized?.annualizedPriceWithoutTax],["annualizedPriceWithoutDiscount",c=>c.priceDetails?.annualized?.annualizedPriceWithoutDiscount],["annualizedPriceWithoutDiscountAndTax",c=>c.priceDetails?.annualized?.annualizedPriceWithoutDiscountAndTax]];o={};for(let[c,l]of s){let d=$o(a,l);d!==void 0&&(o[c]=d)}}return{...r,offerSelectorIds:a.flatMap(s=>s.offerSelectorIds||[]),priceInfo:void 0,priceDetails:{...r.priceDetails,...i,...o&&{annualized:o}}}}var Jr=a=>window.setTimeout(a);function Ot(a,r=1){if(a==null)return[r];let e=(Array.isArray(a)?a:String(a).split(",")).map(ko).filter(zt);return e.length||(e=[r]),e}function Yl(a){return a==null?[]:Array.isArray(a)?a:String(a).split(",").map(r=>r.trim())}function ea(a,r){let e=Yl(r);if(a==null)return{wcsOsi:[],promotionCodes:e};let t=Array.isArray(a)?a:String(a).split(",");if(e.length<=1)return{wcsOsi:t.filter(mi),promotionCodes:e};let i=[],n=[];return t.forEach((o,s)=>{mi(o)&&(i.push(o),n.push(e[s]??""))}),{wcsOsi:i,promotionCodes:n}}function te(){return document.getElementsByTagName(Vl)?.[0]}function Fo(a){let r={};if(!a?.headers)return r;let e=a.headers;for(let[t,i]of Object.entries(Wl)){let n=e.get(i);n&&(n=n.replace(/[,;]/g,"|"),n=n.replace(/[| ]+/g,"|"),r[t]=n)}return r}var Nt=class a extends Error{constructor(r,e,t){if(super(r,{cause:t}),this.name="MasError",e.response){let i=e.response.headers?.get(Vt);i&&(e.requestId=i),e.response.status&&(e.status=e.response.status,e.statusText=e.response.statusText),e.response.url&&(e.url=e.response.url)}delete e.response,this.context=e,Error.captureStackTrace&&Error.captureStackTrace(this,a)}toString(){let r=Object.entries(this.context||{}).map(([t,i])=>`${t}: ${JSON.stringify(i)}`).join(", "),e=`${this.name}: ${this.message}`;return r&&(e+=` (${r})`),this.cause&&(e+=`
Caused by: ${this.cause}`),e}};var Kl={[ue]:ka,[De]:Sa,[ne]:Ca},Ql={[ue]:La,[ne]:ie},pr,qe=class{constructor(r){k(this,pr);m(this,"changes",new Map);m(this,"connected",!1);m(this,"error");m(this,"log");m(this,"options");m(this,"promises",[]);m(this,"state",De);m(this,"timer",null);m(this,"value");m(this,"version",0);m(this,"wrapperElement");this.wrapperElement=r,this.log=ee.module("mas-element")}update(){[ue,De,ne].forEach(r=>{this.wrapperElement.classList.toggle(Kl[r],r===this.state)})}notify(){(this.state===ne||this.state===ue)&&(this.state===ne?this.promises.forEach(({resolve:e})=>e(this.wrapperElement)):this.state===ue&&this.promises.forEach(({reject:e})=>e(this.error)),this.promises=[]);let r=this.error;this.error instanceof Nt&&(r={message:this.error.message,...this.error.context}),this.wrapperElement.dispatchEvent(new CustomEvent(Ql[this.state],{bubbles:!0,composed:!0,detail:r}))}attributeChangedCallback(r,e,t){this.changes.set(r,t),this.requestUpdate()}connectedCallback(){A(this,pr,te()),this.requestUpdate(!0)}disconnectedCallback(){this.connected&&(this.connected=!1,this.log?.debug("Disconnected:",{element:this.wrapperElement}))}onceSettled(){let{error:r,promises:e,state:t}=this;return ne===t?Promise.resolve(this.wrapperElement):ue===t?Promise.reject(r):new Promise((i,n)=>{e.push({resolve:i,reject:n})})}toggleResolved(r,e,t){return r!==this.version?!1:(t!==void 0&&(this.options=t),this.state=ne,this.value=e,this.update(),this.log?.debug("Resolved:",{element:this.wrapperElement,value:e}),Jr(()=>this.notify()),!0)}toggleFailed(r,e,t){if(r!==this.version)return!1;t!==void 0&&(this.options=t),this.error=e,this.state=ue,this.update();let i=this.wrapperElement.getAttribute("is");return this.log?.error(`${i}: Failed to render: ${e.message}`,{element:this.wrapperElement,...e.context,...v(this,pr)?.duration}),Jr(()=>this.notify()),!0}togglePending(r){return this.version++,r&&(this.options=r),this.state=De,this.update(),this.log?.debug("Pending:",{osi:this.wrapperElement?.options?.wcsOsi}),this.version}requestUpdate(r=!1){if(!this.wrapperElement.isConnected||!te()||this.timer)return;let{error:e,options:t,state:i,value:n,version:o}=this;this.state=De,this.timer=Jr(async()=>{this.timer=null;let s=null;if(this.changes.size&&(s=Object.fromEntries(this.changes.entries()),this.changes.clear()),this.connected?this.log?.debug("Updated:",{element:this.wrapperElement,changes:s}):(this.connected=!0,this.log?.debug("Connected:",{element:this.wrapperElement,changes:s})),s||r)try{await this.wrapperElement.render?.()===!1&&this.state===De&&this.version===o&&(this.state=i,this.error=e,this.value=n,this.update(),this.notify())}catch(c){this.toggleFailed(this.version,c,t)}})}};pr=new WeakMap;function Ho(a={}){return Object.entries(a).forEach(([r,e])=>{(e==null||e===""||e?.length===0)&&delete a[r]}),a}function ta(a,r={}){let{tag:e,is:t}=a,i=document.createElement(e,{is:t});return i.setAttribute("is",t),Object.assign(i.dataset,Ho(r)),i}function Uo(a,r={}){return a instanceof HTMLElement?(Object.assign(a.dataset,Ho(r)),a):null}function Zl(a){return`https://${a==="PRODUCTION"?"www.adobe.com":"www.stage.adobe.com"}/offers/promo-terms.html`}var Xe,Qe=class Qe extends HTMLAnchorElement{constructor(){super();m(this,"masElement",new qe(this));k(this,Xe);this.setAttribute("is",Qe.is)}get isUptLink(){return!0}initializeWcsData(e,t){this.setAttribute("data-wcs-osi",e),t&&this.setAttribute("data-promotion-code",t)}attributeChangedCallback(e,t,i){this.masElement.attributeChangedCallback(e,t,i)}connectedCallback(){this.masElement.connectedCallback(),A(this,Xe,Wt()),v(this,Xe)&&(this.log=v(this,Xe).log.module("upt-link"))}disconnectedCallback(){this.masElement.disconnectedCallback(),A(this,Xe,void 0)}requestUpdate(e=!1){this.masElement.requestUpdate(e)}onceSettled(){return this.masElement.onceSettled()}async render(){let e=Wt();if(!e)return!1;this.dataset.imsCountry||e.imsCountryPromise.then(o=>{o&&(this.dataset.imsCountry=o)});let t=e.collectCheckoutOptions({},this);if(!t.wcsOsi)return this.log.error("Missing 'data-wcs-osi' attribute on upt-link."),!1;let i=this.masElement.togglePending(t),n=e.resolveOfferSelectors(t);try{let[[o]]=await Promise.all(n),{country:s,language:c,env:l}=t,d=`locale=${c}_${s}&country=${s}&offer_id=${o.offerId}`,f=this.getAttribute("data-promotion-code");f&&(d+=`&promotion_code=${encodeURIComponent(f)}`),this.href=`${Zl(l)}?${d}`,this.masElement.toggleResolved(i,o,t)}catch(o){let s=new Error(`Could not resolve offer selectors for id: ${t.wcsOsi}.`,o.message);return this.masElement.toggleFailed(i,s,t),!1}}static createFrom(e){let t=new Qe;for(let i of e.attributes)i.name!=="is"&&(i.name==="class"&&i.value.includes("upt-link")?t.setAttribute("class",i.value.replace("upt-link","").trim()):t.setAttribute(i.name,i.value));return t.innerHTML=e.innerHTML,t.setAttribute("tabindex",0),t}};Xe=new WeakMap,m(Qe,"is","upt-link"),m(Qe,"tag","a"),m(Qe,"observedAttributes",["data-wcs-osi","data-promotion-code","data-ims-country"]);var Ze=Qe;window.customElements.get(Ze.is)||window.customElements.define(Ze.is,Ze,{extends:Ze.tag});function Bo(a){return a&&(a==="bizpro"&&(a="pro"),a==="pro"||a.startsWith("plans")?"plans":a)}var Xl="p_draft_landscape",Jl="/store/",ed=new Map([["countrySpecific","cs"],["customerSegment","cs"],["quantity","q"],["authCode","code"],["checkoutPromoCode","apc"],["rurl","rUrl"],["curl","cUrl"],["ctxrturl","ctxRtUrl"],["country","co"],["language","lang"],["clientId","cli"],["context","ctx"],["productArrangementCode","pa"],["addonProductArrangementCode","ao"],["offerType","ot"],["marketSegment","ms"]]),_i=new Set(["af","ai","ao","apc","appctxid","cli","co","cs","csm","ctx","ctxRtUrl","DCWATC","dp","fr","gsp","ijt","lang","lo","mal","ms","mv","mv2","nglwfdata","ot","otac","pa","pcid","promoid","q","rf","sc","scl","sdid","sid","spint","svar","th","thm","trackingid","usid","workflowid","context.guid","so.ca","so.su","so.tr","so.va"]),td=["env","workflowStep","clientId","country"],rd=["/tw/","/hk_zh/"];function ad(a){let r=a??"";return rd.some(e=>r.startsWith(e))}function id(){if(typeof window>"u")return!1;let a=[window.location.pathname];try{window.parent!==window&&a.push(window.parent.location.pathname)}catch{}return a.some(ad)}function mr(a){if(!id())return a instanceof URL?a.toString():String(a);let r;try{r=a instanceof URL?a:new URL(a)}catch{return String(a)}r.searchParams.set("lang","zh-Hant");for(let e of[...r.searchParams.keys()])/^items\[\d+]\[lang]$/.test(e)&&r.searchParams.set(e,"zh-Hant");return r.toString()}var qo=new Set(["gid","gtoken","notifauditid","cohortid","productname","sdid","attimer","gcsrc","gcprog","gcprogcat","gcpagetype","mv","mv2"]),Go=a=>ed.get(a)??a;function ra(a,r,e){for(let[t,i]of Object.entries(a)){let n=Go(t);i!=null&&e.has(n)&&r.set(n,i)}}function nd(a){return a===Na.PRODUCTION?"https://commerce.adobe.com":"https://commerce-stg.adobe.com"}function od(a,r){for(let e in a){let t=a[e];for(let[i,n]of Object.entries(t)){if(n==null)continue;let o=Go(i);r.set(`items[${e}][${o}]`,n)}}}function sd({url:a,modal:r,is3in1:e}){if(!e||!a?.searchParams)return a;a.searchParams.set("rtc","t"),a.searchParams.set("lo","sl");let t=a.searchParams.get("af");return a.searchParams.set("af",[t,"uc_new_user_iframe","uc_new_system_close"].filter(Boolean).join(",")),a.searchParams.get("cli")!=="doc_cloud"&&a.searchParams.set("cli",r===xe.CRM?"creative":"mini_plans"),a}function cd(a){let r=a.indexOf("?");return r===-1?a:a.slice(0,r)}function ld(a){let r=new URLSearchParams(window.location.search),e={};qo.forEach(t=>{let i=r.get(t);i!==null&&(e[t]=cd(i))}),Object.keys(e).length>0&&ra(e,a.searchParams,qo)}function Vo(a){dd(a);let{env:r,items:e,workflowStep:t,marketSegment:i,customerSegment:n,offerType:o,productArrangementCode:s,landscape:c,modal:l,is3in1:d,preselectPlan:f,...g}=a,p=new URL(nd(r));if(p.pathname=`${Jl}${t}`,t!==J.SEGMENTATION&&t!==J.CHANGE_PLAN_TEAM_PLANS&&od(e,p.searchParams),ra({...g},p.searchParams,_i),ld(p),c===Ie.DRAFT&&ra({af:Xl},p.searchParams,_i),t===J.SEGMENTATION){let h={marketSegment:i,offerType:o,customerSegment:n,productArrangementCode:s,quantity:e?.[0]?.quantity,addonProductArrangementCode:s?e?.find(u=>u.productArrangementCode!==s)?.productArrangementCode:e?.[1]?.productArrangementCode};f?.toLowerCase()==="edu"?p.searchParams.set("ms","EDU"):f?.toLowerCase()==="team"&&p.searchParams.set("cs","TEAM"),ra(h,p.searchParams,_i),p.searchParams.get("ot")==="PROMOTION"&&p.searchParams.delete("ot"),p=sd({url:p,modal:l,is3in1:d})}return mr(p)}function dd(a){for(let r of td)if(!a[r])throw new Error(`Argument "checkoutData" is not valid, missing: ${r}`);if(a.workflowStep!==J.SEGMENTATION&&a.workflowStep!==J.CHANGE_PLAN_TEAM_PLANS&&!a.items)throw new Error('Argument "checkoutData" is not valid, missing: items');return!0}var hd=2e4;function pd(a,r,e){let t,i=new Promise((n,o)=>{t=setTimeout(()=>o(new Error(`AUP host timed out: ${r}`)),e)});return Promise.race([a,i]).finally(()=>clearTimeout(t))}function jo({checkoutClientId:a,modal:r}){return a!=="doc_cloud"&&Object.values(xe).includes(r)?r===xe.CRM?"creative":"mini_plans":a}function aa(a,r,e,t=jo(r)){return Da.has(t)&&a.length>0&&!e&&!r.perpetual&&!a.some(i=>i.commitment==="PERPETUAL")}function md(a,r){if(r.addonProductArrangementCode!=null)return r.addonProductArrangementCode;if(r.checkoutWorkflowStep!==J.SEGMENTATION)return;let e=a[0]?.productArrangementCode;return(e?a.find(t=>t.productArrangementCode!==e):a[1])?.productArrangementCode}function ud(a,r,e){let t=jo(r);if(!aa(a,r,e,t))return;let[i]=a,n={clientId:t,clientType:"web",co:r.country,pa:i.productArrangementCode,cs:r.cs,ms:r.ms},o=r.preselectPlan?.toLowerCase();o==="edu"&&(n.ms="EDU"),o==="team"&&(n.cs="TEAM");let s=i.productArrangement?.productCode;s&&(n.pc=s);for(let d of["svar","customerIntent","sid"])r[d]&&(n[d]=r[d]);let c=new URL("https://commerce.adobe.com");c.searchParams.set("lang",r.language);let l={lang:new URL(mr(c)).searchParams.get("lang"),nr:"stable",ctxrturl:r.ctxrturl??window.location.href,ot:i.offerType,items:a.map(({offerId:d},f)=>{let g=r.q??r.quantity?.[f]??r.quantity?.[0];return g==null?d:`${d}|${g}`}).join(",")};for(let[d,f]of Object.entries({step:r.checkoutWorkflowStep,apc:r.promotionCode,ao:md(a,r),code:r.authCode,soSu:r["so.su"],soCa:r["so.ca"],soVa:r["so.va"],soTr:r["so.tr"],contextGuid:r["context.guid"],dcwatc:r.DCWATC}))f!=null&&(l[d]=f);for(let d of["step","apc","ao","ctx","ijt","otac","nglwfdata","appctxid","soSu","soCa","soVa","soTr","promoid","sdid","trackingid","mv","mv2","contextGuid","ai","sc","th","lo","gsp","spint","mal","csm","af","rf","usid","dcwatc","cf","rtc","ccli","csc","referrer","code","ew","pp","token","mat","pcid"])r[d]!=null&&(l[d]=r[d]);return{intent:i.offerType==="TRIAL"?"try":"buy",context:n,params:l,enableRenderIn:"iframe"}}async function Wo(a,r,e,t,i=hd,n=!1){let o=ud(r,e,n);if(!o)return!1;let s=await pd(a.getOrchestratorContext(),"getOrchestratorContext",i);if(typeof s?.launchWorkflowInModal!="function")return!1;let c,l;if(t){let f=s.clientMessageHandler;l=(g,p,h)=>{let u=p?.data?.actions;return g==="System"&&p?.subType==="AppClosed"&&Array.isArray(u)&&(c=u.find(x=>x?.required&&x.actionMessage?.type==="System"&&x.actionMessage?.subType==="ReportState")?.actionMessage.data?.commerce?.cart),typeof f=="function"?f(g,p,h):h(g,p)}}ee.module("aup-select").debug("Launching workflow:",o);let d=await(l?s.launchWorkflowInModal(o,l):s.launchWorkflowInModal(o));return d?.status==="cancel"&&Array.isArray(c)&&c.every(f=>typeof f?.productArrangementCode=="string")&&c.some(f=>f?.productArrangementCode===o.context.pa)&&t?.(c),d?.status!=="no-workflow-found"}var gd=/[0-9\-+#]/,fd=/[^\d\-+#]/g;function Yo(a){return a.search(gd)}function vd(a="#.##"){let r={},e=a.length,t=Yo(a);r.prefix=t>0?a.substring(0,t):"";let i=Yo(a.split("").reverse().join("")),n=e-i,o=a.substring(n,n+1),s=n+(o==="."||o===","?1:0);r.suffix=i>0?a.substring(s,e):"",r.mask=a.substring(t,s),r.maskHasNegativeSign=r.mask.charAt(0)==="-",r.maskHasPositiveSign=r.mask.charAt(0)==="+";let c=r.mask.match(fd);return r.decimal=c&&c[c.length-1]||".",r.separator=c&&c[1]&&c[0]||",",c=r.mask.split(r.decimal),r.integer=c[0],r.fraction=c[1],r}function xd(a,r,e){let t=!1,i={value:a};a<0&&(t=!0,i.value=-i.value),i.sign=t?"-":"",i.value=Number(i.value).toFixed(r.fraction&&r.fraction.length),i.value=Number(i.value).toString();let n=r.fraction&&r.fraction.lastIndexOf("0"),[o="0",s=""]=i.value.split(".");return(!s||s&&s.length<=n)&&(s=n<0?"":(+`0.${s}`).toFixed(n+1).replace("0.","")),i.integer=o,i.fraction=s,bd(i,r),(i.result==="0"||i.result==="")&&(t=!1,i.sign=""),!t&&r.maskHasPositiveSign?i.sign="+":t&&r.maskHasPositiveSign?i.sign="-":t&&(i.sign=e&&e.enforceMaskSign&&!r.maskHasNegativeSign?"":"-"),i}function bd(a,r){a.result="";let e=r.integer.split(r.separator),t=e.join(""),i=t&&t.indexOf("0");if(i>-1)for(;a.integer.length<t.length-i;)a.integer=`0${a.integer}`;else Number(a.integer)===0&&(a.integer="");let n=e[1]&&e[e.length-1].length;if(n){let o=a.integer.length,s=o%n;for(let c=0;c<o;c++)a.result+=a.integer.charAt(c),!((c-s+1)%n)&&c<o-n&&(a.result+=r.separator)}else a.result=a.integer;return a.result+=r.fraction&&a.fraction?r.decimal+a.fraction:"",a}function yd(a,r,e={}){if(!a||isNaN(Number(r)))return r;let t=vd(a),i=xd(r,t,e);return t.prefix+i.sign+i.result+t.suffix}var Ko=yd;var Qo=".",wd=",",Xo=/^\s+/,Jo=/\s+$/,Zo="&nbsp;",Mi=a=>a*12,et=(a,r,e=1)=>{if(!a)return!1;let{start:t,end:i,displaySummary:{amount:n,duration:o,minProductQuantity:s=1,outcomeType:c}={}}=a;if(!(n&&o&&c)||e<s)return!1;let l=r?new Date(r):new Date;if(!t||!i)return!1;let d=new Date(t),f=new Date(i);return l>=d&&l<=f},Je={MONTH:"MONTH",YEAR:"YEAR"},Ed={[ce.ANNUAL]:12,[ce.MONTHLY]:1,[ce.THREE_YEARS]:36,[ce.TWO_YEARS]:24},Ri=(a,r)=>({accept:a,round:r}),Ad=[Ri(({divisor:a,price:r})=>r%a==0,({divisor:a,price:r})=>r/a),Ri(({usePrecision:a})=>a,({divisor:a,price:r})=>Math.round(r/a*100)/100),Ri(()=>!0,({divisor:a,price:r})=>Math.ceil(Math.floor(r*100/a)/100))],Oi={[Ne.YEAR]:{[ce.MONTHLY]:Je.MONTH,[ce.ANNUAL]:Je.YEAR},[Ne.MONTH]:{[ce.MONTHLY]:Je.MONTH}},kd=(a,r)=>a.indexOf(`'${r}'`)===0,Sd=(a,r=!0)=>{let e=a.replace(/'.*?'/,"").trim(),t=zi(e);return!!t?r||(e=e.replace(/[,\.]0+/,t)):e=e.replace(/\s?(#.*0)(?!\s)?/,`$&${Td(a)}`),e},Cd=a=>{let r=Ld(a),e=kd(a,r),t=a.replace(/'.*?'/,""),i=Xo.test(t)||Jo.test(t);return{currencySymbol:r,isCurrencyFirst:e,hasCurrencySpace:i}},es=a=>a.replace(Xo,Zo).replace(Jo,Zo),Td=a=>a.match(/#(.?)#/)?.[1]===Qo?wd:Qo,Ld=a=>a.match(/'(.*?)'/)?.[1]??"",zi=a=>a.match(/0(.?)0/)?.[1]??"",ts=({priceInfo:a,showWithoutDiscount:r,displayAnnual:e,displayOptical:t,commitment:i,term:n,promotion:o})=>{if(e&&o)return;let c=e&&i===Ne.YEAR&&n===ce.MONTHLY?"annualized":t?"optical":"asIs",l=r?"withoutDiscount":"withDiscount";return a[c]?.[l]?.withTax};function Dt({formatString:a,price:r,usePrecision:e,isIndianPrice:t=!1,preformatted:i,priceInfoFormat:n},o,s=c=>c){let{currencySymbol:c,isCurrencyFirst:l,hasCurrencySpace:d}=Cd(a);if(i?.integer!=null)return{accessiblePrice:i.full,currencySymbol:n?.currencySymbol??c,decimals:i.decimals??"",decimalsDelimiter:i.decimals?n?.decimalsDelimiter??zi(a):"",hasCurrencySpace:n?.hasCurrencySpace??d,integer:i.integer,isCurrencyFirst:n?.isCurrencyFirst??l,recurrenceTerm:o};let f=e?zi(a):"",g=Sd(a,e),p=e?2:0,h=s(r,{currencySymbol:c}),u=t?h.toLocaleString("hi-IN",{minimumFractionDigits:p,maximumFractionDigits:p}):Ko(g,h),x=e?u.lastIndexOf(f):u.length,b=u.substring(0,x),y=u.substring(x+1);return{accessiblePrice:a.replace(/'.*?'/,"SYMBOL").replace(/#.*0/,u).replace(/SYMBOL/,c),currencySymbol:c,decimals:y,decimalsDelimiter:f,hasCurrencySpace:d,integer:b,isCurrencyFirst:l,recurrenceTerm:o}}var rs=a=>{let{commitment:r,term:e,usePrecision:t}=a,i=Ed[e]??1;return Dt(a,i>1?Je.MONTH:Oi[r]?.[e],n=>{let o={divisor:i,price:n,usePrecision:t},{round:s}=Ad.find(({accept:c})=>c(o));if(!s)throw new Error(`Missing rounding rule for: ${JSON.stringify(o)}`);return s(o)})},as=({commitment:a,term:r,...e})=>Dt(e,Oi[a]?.[r]),is=a=>{let{commitment:r,instant:e,price:t,originalPrice:i,priceWithoutDiscount:n,promotion:o,quantity:s=1,term:c}=a;if(r===Ne.YEAR&&c===ce.MONTHLY){if(!o)return Dt(a,Je.YEAR,Mi);let{displaySummary:{outcomeType:l,duration:d}={}}=o;switch(l){case"PERCENTAGE_DISCOUNT":if(et(o,e,s)){let f=parseInt(d.replace("P","").replace("M",""));if(isNaN(f))return Mi(t);let g=i*f,p=n*(12-f),h=Math.round((g+p)*100)/100;return Dt({...a,price:h},Je.YEAR)}default:return Dt(a,Je.YEAR,()=>Mi(n??t))}}return Dt(a,Oi[r]?.[c])};var ia="download",na="upgrade",ns={e:"EDU",t:"TEAM"},Ni=!1;function os(a,r={},e=""){let t=te();if(!t)return null;let{checkoutMarketSegment:i,checkoutWorkflow:n,checkoutWorkflowStep:o,entitlement:s,upgrade:c,modal:l,perpetual:d,promotionCode:f,quantity:g,wcsOsi:p,extraOptions:h,analyticsId:u}=t.collectCheckoutOptions(r),x=ta(a,{checkoutMarketSegment:i,checkoutWorkflow:n,checkoutWorkflowStep:o,entitlement:s,upgrade:c,modal:l,perpetual:d,promotionCode:r.promotionCode===Yr?Yr:f,quantity:g,wcsOsi:p,extraOptions:h,analyticsId:u});return e&&(x.innerHTML=`<span style="pointer-events: none;">${e}</span>`),x}function ss(a){return class extends a{constructor(){super(...arguments);m(this,"checkoutActionHandler");m(this,"aupHandler");m(this,"masElement",new qe(this))}attributeChangedCallback(t,i,n){this.masElement.attributeChangedCallback(t,i,n)}connectedCallback(){this.masElement.connectedCallback(),this.addEventListener("click",this.clickHandler),this.addEventListener("auxclick",this.handleAupModifiedClick),this.updateCheckoutUrl()}disconnectedCallback(){this.masElement.disconnectedCallback(),this.removeEventListener("click",this.clickHandler),this.removeEventListener("auxclick",this.handleAupModifiedClick)}onceSettled(){return this.masElement.onceSettled()}get value(){return this.masElement.value}get options(){return this.masElement.options}get marketSegment(){let t=this.options?.ms??this.value?.[0]?.marketSegments?.[0];return ns[t]??t}get customerSegment(){let t=this.options?.cs??this.value?.[0]?.customerSegment;return ns[t]??t}get is3in1Modal(){return Object.values(xe).includes(this.getAttribute("data-modal"))}get isOpen3in1Modal(){let t=document.querySelector("meta[name=mas-ff-3in1]");return this.is3in1Modal&&(!t||t.content!=="off")}requestUpdate(t=!1){return this.masElement.requestUpdate(t)}static get observedAttributes(){return["data-checkout-workflow","data-checkout-workflow-step","data-extra-options","data-ims-country","data-perpetual","data-promotion-code","data-quantity","data-template","data-wcs-osi","data-entitlement","data-upgrade","data-modal"]}async render(t={}){let i=te();if(!i)return!1;this.dataset.imsCountry||i.imsCountryPromise.then(p=>{p&&(this.dataset.imsCountry=p)}),t.imsCountry=null;let n=i.collectCheckoutOptions(t,this);if(!n.wcsOsi.length)return!1;let o;try{o=JSON.parse(n.extraOptions??"{}")}catch(p){this.masElement.log?.error("cannot parse exta checkout options",p)}let s=this.masElement.togglePending(n);this.setCheckoutUrl("");let c=i.resolveOfferSelectors(n),l=await Promise.all(c);l=l.map(p=>hr(p,n));let d=l.flat().find(p=>p.promotion);!et(d?.promotion,d?.promotion?.displaySummary?.instant,n.quantity[0])&&n.promotionCode&&delete n.promotionCode,n.country=this.dataset.imsCountry||n.country;let g=await i.buildCheckoutAction?.(l.flat(),{...o,...n},this);return this.renderOffers(l.flat(),n,{},g,s)}renderOffers(t,i,n={},o=void 0,s=void 0){let c=te();if(!c)return!1;if(i={...JSON.parse(this.dataset.extraOptions??"{}"),...i,...n},s??(s=this.masElement.togglePending(i)),this.checkoutActionHandler&&(this.checkoutActionHandler=void 0),this.aupHandler=void 0,this.classList.remove(ia,na),o){this.masElement.toggleResolved(s,t,i);let{url:d,text:f,className:g,handler:p,aupHandler:h}=o;d&&this.setCheckoutUrl(mr(d)),f&&(this.firstElementChild.innerHTML=f),g&&this.classList.add(...g.split(" ")),p&&(this.setCheckoutUrl(this.isOpen3in1Modal?c.buildCheckoutURL(t,i):"#"),this.checkoutActionHandler=p.bind(this)),typeof h=="function"&&(this.aupHandler=h.bind(this)),this.updateCheckoutUrl()}if(t.length){if(this.masElement.toggleResolved(s,t,i)){if(!this.classList.contains(ia)&&!this.classList.contains(na)){let d=c.buildCheckoutURL(t,i);this.setCheckoutUrl(i.modal==="true"?"#":d)}return!0}}else{let d=new Error(`Not provided: ${i?.wcsOsi??"-"}`);if(this.masElement.toggleFailed(s,d,i))return this.setCheckoutUrl("#"),!0}}setCheckoutUrl(t){this.checkoutUrl=t,this.updateCheckoutUrl()}updateCheckoutUrl(t=te()?.settings?.aupSelect){if(this.checkoutUrl===void 0)return;let i=t&&this.checkoutUrl&&this.masElement.state===ne&&!this.classList.contains(ia)&&!this.hasAttribute("download")&&(!this.target||this.target==="_self")&&aa(this.value,this.options,this.classList.contains(na));return this.setAttribute(this.isCheckoutLink?"href":"data-href",i?"#":this.checkoutUrl),i}handleAupModifiedClick(t){return(t.metaKey||t.ctrlKey||t.shiftKey||t.altKey||t.button!==0)&&this.updateCheckoutUrl()?(t.preventDefault(),!0):!1}handleAupCheckout(t){if(this.handleAupModifiedClick(t))return!0;if(this.updateCheckoutUrl(!1),setTimeout(()=>this.updateCheckoutUrl(),0),t.defaultPrevented||t.button!==0||t.metaKey||t.ctrlKey||t.shiftKey||t.altKey||this.classList.contains(ia)||this.hasAttribute("download")||this.target&&this.target!=="_self")return!1;let i=window.aupsdk;if(this.masElement.state!==ne||!te()?.settings.aupSelect||typeof i?.getOrchestratorContext!="function")return!1;let{aupHandler:n,checkoutActionHandler:o,href:s,value:c}=this,l=this.closest("merch-card"),d=this.getAttribute("data-modal-id"),f={...this.options,cs:this.customerSegment,ms:this.marketSegment},g=this.classList.contains(na);if(!aa(c,f,g))return!1;if(this.updateCheckoutUrl(),t.preventDefault(),Ni)return!0;let p=()=>{if(o)return o(t);s&&(window.location.href=s)},h=x=>{if(n)try{n({type:x,element:this})}catch(b){this.masElement.log?.error(`AUP checkout ${x} handler failed`,b)}},u;return Ni=!0,h("open"),this.aupCheckoutPromise=Wo(i,c,f,l&&d?x=>{u=x}:void 0,void 0,g).catch(x=>(this.masElement.log?.error("AUP checkout launch failed",x),!1)).then(async x=>{if(h("close"),!x)try{return await p()}catch(b){this.masElement.log?.error("AUP checkout fallback failed",b);return}if(u)try{let b=c[0].productArrangementCode;if(this.masElement.state!==ne||this.value[0]?.productArrangementCode!==b)return;let y=[...l.querySelectorAll('merch-addon [is="inline-price"]')];if(l.addonCheckbox&&(!y.length||y.some(M=>M.masElement.state!==ne||!M.value?.length)))return;let E=y.flatMap(M=>M.value),P=u.filter(M=>M.productArrangementCode===b||E.some(z=>z.productArrangementCode===M.productArrangementCode));l.dispatchEvent(new CustomEvent(va,{detail:{id:d,items:P,productArrangementCode:b}}))}catch(b){this.masElement.log?.warn("AUP checkout cart synchronization failed",b)}}).finally(()=>{Ni=!1}),!0}clickHandler(t){}updateOptions(t={}){let i=te();if(!i)return!1;let{checkoutMarketSegment:n,checkoutWorkflow:o,checkoutWorkflowStep:s,entitlement:c,upgrade:l,modal:d,perpetual:f,promotionCode:g,quantity:p,wcsOsi:h}=i.collectCheckoutOptions(t);return Uo(this,{checkoutMarketSegment:n,checkoutWorkflow:o,checkoutWorkflowStep:s,entitlement:c,upgrade:l,modal:d,perpetual:f,promotionCode:g,quantity:p,wcsOsi:h}),!0}}}var ur=class ur extends ss(HTMLAnchorElement){static createCheckoutLink(r={},e=""){return os(ur,r,e)}get isCheckoutLink(){return!0}clickHandler(r){if(!this.handleAupCheckout(r)&&this.checkoutActionHandler){this.checkoutActionHandler?.(r);return}}};m(ur,"is","checkout-link"),m(ur,"tag","a");var Re=ur;window.customElements.get(Re.is)||window.customElements.define(Re.is,Re,{extends:Re.tag});var _=Object.freeze({checkoutClientId:"adobe_com",checkoutWorkflowStep:J.EMAIL,country:"US",displayOldPrice:!0,displayPerUnit:!1,displayRecurrence:!0,displayTax:!1,displayPlanType:!1,env:ve.PRODUCTION,forceTaxExclusive:!1,language:"en",entitlement:!1,extraOptions:{},modal:!1,promotionCode:"",quantity:1,alternativePrice:!1,wcsApiKey:"wcms-commerce-ims-ro-user-milo",wcsURL:"https://www.adobe.com/web_commerce_artifact",landscape:Ie.PUBLISHED});function cs({settings:a,providers:r}){function e(n,o){let{checkoutClientId:s,checkoutWorkflowStep:c,country:l,language:d,promotionCode:f,quantity:g,preselectPlan:p,env:h}=a,u={checkoutClientId:s,checkoutWorkflowStep:c,country:l,language:d,promotionCode:f,quantity:g,preselectPlan:p,env:h};if(o)for(let it of r.checkout)it(o,u);let{checkoutMarketSegment:x,checkoutWorkflowStep:b=c,imsCountry:y,country:E=y??l,language:P=d,quantity:M=g,entitlement:z,upgrade:F,modal:q,perpetual:W,promotionCode:Y=f,wcsOsi:H,extraOptions:N,...Q}=Object.assign(u,o?.dataset??{},n??{}),V=dr(b,J,_.checkoutWorkflowStep),{wcsOsi:Se,promotionCodes:pe}=ea(H,Y),Ut=pe.map(it=>Kr(it).effectivePromoCode);return u=jr({...Q,extraOptions:N,checkoutClientId:s,checkoutMarketSegment:x,country:E,quantity:Ot(M,_.quantity),checkoutWorkflowStep:V,language:P,entitlement:C(z),upgrade:C(F),modal:q,perpetual:C(W),promotionCode:Ut[0],promotionCodes:Ut,wcsOsi:Se,preselectPlan:p}),u}function t(n,o){if(!Array.isArray(n)||!n.length||!o)return"";let{env:s,landscape:c}=a,{checkoutClientId:l,checkoutMarketSegment:d,checkoutWorkflowStep:f,country:g,promotionCode:p,quantity:h,preselectPlan:u,ms:x,cs:b,...y}=e(o),E=document.querySelector("meta[name=mas-ff-3in1]"),P=Object.values(xe).includes(o.modal)&&(!E||E.content!=="off"),M=window.frameElement||P?"if":"fp",[{productArrangementCode:z,marketSegments:[F],customerSegment:q,offerType:W}]=n,Y=x??F??d,H=b??q;u?.toLowerCase()==="edu"?Y="EDU":u?.toLowerCase()==="team"&&(H="TEAM");let N={is3in1:P,checkoutPromoCode:p,clientId:l,context:M,country:g,env:s,items:[],marketSegment:Y,customerSegment:H,offerType:W,productArrangementCode:z,workflowStep:f,landscape:c,...y},Q=h[0]>1?h[0]:void 0;if(n.length===1){let{offerId:V}=n[0];N.items.push({id:V,quantity:Q})}else N.items.push(...n.map(({offerId:V,productArrangementCode:Se})=>({id:V,quantity:Q,...P?{productArrangementCode:Se}:{}})));return Vo(N)}let{createCheckoutLink:i}=Re;return{CheckoutLink:Re,CheckoutWorkflowStep:J,buildCheckoutURL:t,collectCheckoutOptions:e,createCheckoutLink:i}}var Pd="ims_country_code";function _d(){if(typeof document>"u")return null;let a=document.cookie.match(new RegExp(`(?:^|;\\s*)${Pd}=([^;]*)`));if(!a)return null;let r;try{r=decodeURIComponent(a[1])}catch{return null}return r.trim().toUpperCase()||null}function Md({interval:a=200,maxAttempts:r=25}={}){let e=ee.module("ims");return new Promise(t=>{e.debug("Waiting for IMS to be ready");let i=0;function n(){window.adobeIMS?.initialized?t():++i>r?(e.debug("Timeout"),t()):setTimeout(n,a)}n()})}function Rd(a){return a.then(()=>window.adobeIMS?.isSignedInUser()??!1)}function zd(){let a=_d();return a&&ee.module("ims").debug("Got user country from cookie:",a),Promise.resolve(a)}function ls(){let a=Md();return{imsReadyPromise:a,imsSignedInPromise:Rd(a),imsCountryPromise:zd()}}var ds=window.masPriceLiterals;function hs(a){if(Array.isArray(ds)){let r;switch(a.locale){case"id_ID":r="in";break;case"zh_TW":r="zh-hant";break;case"zh_HK":r="zh-hant";break;default:r=a.language}let e=i=>ds.find(n=>pi(n.lang,i)),t=e(r)??e(_.language);if(t)return Object.freeze(t)}return{}}var Od=/[\t-\r \x85\u200E\u200F\u2028\u2029]*/y,Nd=/[^\p{White_Space}\p{Pattern_Syntax}]*/uy,Dd=/[+-]?\d+/y,Id=["{","<",">","}"],Z=a=>{throw new SyntaxError(`Invalid message: ${a}`)};function $d(a,r){let e=0,t=g=>{g.lastIndex=e;let p=g.exec(a);return p&&(e=g.lastIndex),p},i=g=>a.startsWith(g,e)?(e+=g.length,!0):!1,n=()=>t(Od),o=()=>t(Nd)[0],s=()=>{let g=Number((t(Dd)??Z(a))[0]);return Number.isSafeInteger(g)?g:Z(a)},c=(g,p)=>{let h=p==="plural"||p==="selectordinal",u=[];for(;e<a.length;){let x=a[e];if(x==="{")u.push(f(g));else{if(x==="}"&&g>0)break;x==="#"&&h?(e++,u.push({type:"pound"})):u.push({type:"literal",value:l(g,h)})}}return u},l=(g,p)=>{let h="";for(let u;(u=a[e])!==void 0;){let x=a[e+1];if(u==="'"&&x==="'")h+="'",e+=2;else if(u==="'"&&(Id.includes(x)||x==="#"&&p))for(e++,h+=a[e++];e<a.length;)if(a[e]!=="'")h+=a[e++];else if(a[e+1]==="'")h+="'",e+=2;else{e++;break}else{if(u==="{"||u==="#"&&p||u==="}"&&g>0)break;h+=u,e++}}return h},d=()=>{let g=e;for(;e<a.length&&a[e]!=="}";e++)a[e]==="'"&&(e=a.indexOf("'",e+1),e<0&&Z(a));return a.slice(g,e).trimEnd()||Z(a)},f=g=>{e++,n();let p=o()||Z(a);if(n(),i("}"))return{type:"argument",name:p};i(",")||Z(a),n();let h=o();if(h==="number"||h==="date"||h==="time"){n();let y;if(i(",")&&(n(),y=d()),i("}")||Z(a),y&&y.startsWith("::")){let E=y.slice(2).trimStart();y=h==="number"?Bd(E):Wd(Kd(E||Z(a),r))}return{type:h,name:p,style:y}}h!=="plural"&&h!=="selectordinal"&&h!=="select"&&Z(a),n(),i(",")||Z(a),n();let u=o(),x=0;h!=="select"&&u==="offset"&&(i(":")||Z(a),n(),x=s(),n(),u=o());let b=[];for(;;){if(!u){let y=e;if(h==="select"||!i("="))break;s(),u=a.slice(y,e)}b.some(([y])=>y===u)&&Z(a),n(),i("{")||Z(a),b.push([u,c(g+1,h)]),i("}")||Z(a),n(),u=o()}return b.some(([y])=>y==="other")||Z(a),i("}")||Z(a),{type:h,name:p,offset:x,options:Object.fromEntries(b)}};return c(0,"")}var Fd=/^\.(?:(0+)(\*)?|(#+)|(0+)(#+))$/,vs=/^(@+)?(\+|#+)?[rs]?$/,xs=/^(0+)$/,Hd=/(\*)(0+)|(#+)(0+)|(0+)/g,ps={"sign-auto":{signDisplay:"auto"},"sign-accounting":{currencySign:"accounting"},"()":{currencySign:"accounting"},"sign-always":{signDisplay:"always"},"+!":{signDisplay:"always"},"sign-accounting-always":{signDisplay:"always",currencySign:"accounting"},"()!":{signDisplay:"always",currencySign:"accounting"},"sign-except-zero":{signDisplay:"exceptZero"},"+?":{signDisplay:"exceptZero"},"sign-accounting-except-zero":{signDisplay:"exceptZero",currencySign:"accounting"},"()?":{signDisplay:"exceptZero",currencySign:"accounting"},"sign-never":{signDisplay:"never"},"+_":{signDisplay:"never"}},ms=a=>Object.hasOwn(ps,a)?{...ps[a]}:void 0;function us(a){let r={};a.endsWith("r")?r.roundingPriority="morePrecision":a.endsWith("s")&&(r.roundingPriority="lessPrecision");let e=a.match(vs);if(e){let[,t,i]=e;typeof i!="string"?(r.minimumSignificantDigits=t.length,r.maximumSignificantDigits=t.length):i==="+"?r.minimumSignificantDigits=t.length:(r.minimumSignificantDigits=t.length,r.maximumSignificantDigits=t.length+i.length)}return r}function Ud(a){let r=a.startsWith("EE")?"engineering":a.startsWith("E")?"scientific":void 0;if(!r)return;let e={notation:r},t=a.slice(r==="engineering"?2:1),i={"+!":"always","+?":"exceptZero"}[t.slice(0,2)];if(i&&(e.signDisplay=i,t=t.slice(2)),!xs.test(t))throw new RangeError("Malformed concise eng/scientific notation");return e.minimumIntegerDigits=t.length,e}function Bd(a){if(!a)throw new RangeError("Empty number skeleton");let r=a.split(/[\t-\r \x85\u200E\u200F\u2028\u2029]/).filter(Boolean).map(t=>{let[i,...n]=t.split("/");if(n.some(o=>!o))throw new RangeError(`Invalid number skeleton: ${a}`);return{stem:i,options:n}}),e={};for(let{stem:t,options:i}of r){switch(t){case"percent":case"%":e.style="percent";continue;case"%x100":e.style="percent",e.scale=100;continue;case"currency":e.style="currency",e.currency=i[0];continue;case"group-off":case",_":e.useGrouping=!1;continue;case"precision-integer":case".":e.maximumFractionDigits=0;continue;case"measure-unit":case"unit":e.style="unit",e.unit=i[0].replace(/^(.*?)-/,"");continue;case"compact-short":case"K":e.notation="compact",e.compactDisplay="short";continue;case"compact-long":case"KK":e.notation="compact",e.compactDisplay="long";continue;case"scientific":case"engineering":e={...e,notation:t};for(let o of i)Object.assign(e,ms(o));continue;case"notation-simple":e.notation="standard";continue;case"unit-width-narrow":e.currencyDisplay="narrowSymbol",e.unitDisplay="narrow";continue;case"unit-width-short":e.currencyDisplay="code",e.unitDisplay="short";continue;case"unit-width-full-name":e.currencyDisplay="name",e.unitDisplay="long";continue;case"unit-width-iso-code":e.currencyDisplay="symbol";continue;case"scale":e.scale=parseFloat(i[0]);continue;case"integer-width":if(i.length>1)throw new RangeError("integer-width takes one option");for(let[,o,s,c,l,d]of i[0].matchAll(Hd))if(o)e.minimumIntegerDigits=s.length;else if(c&&l||d)throw new RangeError("Unsupported integer-width");continue}if(xs.test(t)){e.minimumIntegerDigits=t.length;continue}let n=t.match(Fd);if(n){if(i.length>1)throw new RangeError("Fraction precision takes one option");let[,o,s,c,l,d]=n;s==="*"?e.minimumFractionDigits=o.length:c?e.maximumFractionDigits=c.length:l&&d?(e.minimumFractionDigits=l.length,e.maximumFractionDigits=l.length+d.length):(e.minimumFractionDigits=o.length,e.maximumFractionDigits=o.length);let[f]=i;f==="w"?e.trailingZeroDisplay="stripIfInteger":f&&Object.assign(e,us(f));continue}if(vs.test(t)){Object.assign(e,us(t));continue}Object.assign(e,ms(t),Ud(t))}return e}var qd=/(?:[Eec]{1,6}|G{1,5}|[Qq]{1,5}|(?:[yYur]+|U{1,5})|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHK]{1,2}|w{1,2}|W{1}|m{1,2}|s{1,2}|[zZOvVxX]{1,4})(?=([^']*'[^']*')*[^']*$)/g,Gd={h:"h12",H:"h23",K:"h11",k:"h24"},Vd={h12:"h",h23:"H",h11:"K",h24:"k"},gr=["numeric","2-digit"],jd=["short","long","narrow","short"];function Wd(a){let r={};for(let[e]of a.matchAll(qd)){let{length:t}=e,i=e[0];switch(i){case"G":r.era=t===4?"long":t===5?"narrow":"short";break;case"y":r.year=t===2?"2-digit":"numeric";break;case"M":case"L":r.month=[...gr,"short","long","narrow"][t-1];break;case"d":r.day=gr[t-1];break;case"E":r.weekday=t===5?"narrow":"short";break;case"e":case"c":if(t<4)throw new RangeError(`Unsupported ${e}`);r.weekday=jd[t-4];break;case"a":r.hour12=!0;break;case"h":case"H":case"K":case"k":r.hourCycle=Gd[i],r.hour=gr[t-1];break;case"m":r.minute=gr[t-1];break;case"s":r.second=gr[t-1];break;case"z":r.timeZoneName=t<4?"short":"long";break;default:throw new RangeError(`Unsupported ${e}`)}}return r}function Yd(a){let r=a.hourCycle||a.hourCycles?.[0]||new Intl.DateTimeFormat(a,{hour:"numeric"}).resolvedOptions().hourCycle;return Vd[r]??Z(r)}function Kd(a,r){let e="";for(let t=0;t<a.length;t++){let i=a[t];if(i!=="j"){e+=i==="J"?"H":i;continue}let n=0;for(;a[t+1]==="j";)n++,t++;let o=Yd(r),s=o==="H"||o==="k"?0:n<2?1:3+(n>>1);e=o.repeat(1+(n&1))+e+"a".repeat(s)}return e}var Qd={integer:{maximumFractionDigits:0},currency:{style:"currency"},percent:{style:"percent"}},Zd={short:{month:"numeric",day:"numeric",year:"2-digit"},medium:{month:"short",day:"numeric",year:"numeric"},long:{month:"long",day:"numeric",year:"numeric"},full:{weekday:"long",month:"long",day:"numeric",year:"numeric"}},gs={hour:"numeric",minute:"numeric",second:"numeric",timeZoneName:"short"},fs={short:{hour:"numeric",minute:"numeric"},medium:{hour:"numeric",minute:"numeric",second:"numeric"},long:gs,full:gs},Di=(a,r)=>typeof r=="string"?a[r]:r;function Ii(a,r,e,t){return a.map(i=>{let{type:n,name:o,style:s}=i;if(n==="literal")return i.value;if(n==="pound")return new Intl.NumberFormat(r).format(t);if(!(e&&o in e))throw new ReferenceError(`Missing value: ${o}`);let c=e[o];switch(n){case"argument":return typeof c=="string"||typeof c=="number"?String(c):"";case"number":{let l=Di(Qd,s);return new Intl.NumberFormat(r,l).format(l?.scale?c*l.scale:c)}case"date":return new Intl.DateTimeFormat(r,Di(Zd,s)).format(c);case"time":return new Intl.DateTimeFormat(r,s===void 0?fs.medium:Di(fs,s)).format(c);case"select":return Ii(i.options[c]||i.options.other,r,e);default:{let{options:l,offset:d}=i,f=new Intl.PluralRules(r,{type:n==="plural"?"cardinal":"ordinal"}).select(c-d);return Ii(l[`=${c}`]||l[f]||l.other,r,e,c-d)}}}).join("")}function bs(a,r,e){let t=r??new Intl.NumberFormat().resolvedOptions().locale,[i]=Intl.NumberFormat.supportedLocalesOf(t),n=$d(a,new Intl.Locale(i??t));return Ii(n,t,e)}var tt={recurrenceLabel:"{recurrenceTerm, select, MONTH {/mo} YEAR {/yr} other {}}",recurrenceAriaLabel:"{recurrenceTerm, select, MONTH {per month} YEAR {per year} other {}}",perUnitLabel:"{perUnit, select, LICENSE {per license} other {}}",perUnitAriaLabel:"{perUnit, select, LICENSE {per license} other {}}",freeLabel:"Free",freeAriaLabel:"Free",taxExclusiveLabel:"{taxTerm, select, GST {excl. GST} VAT {excl. VAT} TAX {excl. tax} IVA {excl. IVA} SST {excl. SST} KDV {excl. KDV} other {}}",taxInclusiveLabel:"{taxTerm, select, GST {incl. GST} VAT {incl. VAT} TAX {incl. tax} IVA {incl. IVA} SST {incl. SST} KDV {incl. KDV} other {}}",alternativePriceAriaLabel:"Alternatively at",strikethroughAriaLabel:"Regularly at",planTypeLabel:"{planType, select, ABM {Annual, billed monthly} other {}}",discountLabel:"{discount}%",priceUnavailableLabel:"no price available"},Xd=So("ConsonantTemplates/price"),Jd=/<\/?[^>]+(>|$)/g,B={container:"price",containerOptical:"price-optical",containerStrikethrough:"price-strikethrough",containerPromoStrikethrough:"price-promo-strikethrough",containerAlternative:"price-alternative",containerAnnual:"price-annual",containerAnnualPrefix:"price-annual-prefix",containerAnnualSuffix:"price-annual-suffix",disabled:"disabled",currencySpace:"price-currency-space",currencySymbol:"price-currency-symbol",decimals:"price-decimals",decimalsDelimiter:"price-decimals-delimiter",integer:"price-integer",recurrence:"price-recurrence",taxInclusivity:"price-tax-inclusivity",unitType:"price-unit-type"},ke={perUnitLabel:"perUnitLabel",perUnitAriaLabel:"perUnitAriaLabel",recurrenceLabel:"recurrenceLabel",recurrenceAriaLabel:"recurrenceAriaLabel",taxExclusiveLabel:"taxExclusiveLabel",taxInclusiveLabel:"taxInclusiveLabel",strikethroughAriaLabel:"strikethroughAriaLabel",alternativePriceAriaLabel:"alternativePriceAriaLabel"},$i="TAX_EXCLUSIVE",eh=a=>Ao(a)?Object.entries(a).filter(([,r])=>Rt(r)||Vr(r)||r===!0).reduce((r,[e,t])=>`${r} ${e}${t===!0?"":`="${Eo(t)}"`}`,""):"",U=(a,r,e,t=!1)=>`<span class="${a}${r?"":` ${B.disabled}`}"${eh(e)}>${t?es(r):r??""}</span>`;function th(a){a=a.replaceAll("</a>","&lt;/a&gt;");let r=/<a [^>]+(>|$)/g;return a.match(r)?.forEach(t=>{let i=t.replace("<a ","&lt;a ").replace(">","&gt;");a=a.replaceAll(t,i)}),a}function rh(a){a=a.replaceAll("&lt;/a&gt;","</a>");let r=/&lt;a (?!&gt;)(.*?)(&gt;|$)/g;return a.match(r)?.forEach(t=>{let i=t.replace("&lt;a ","<a ").replace("&gt;",">");a=a.replaceAll(t,i)}),a}function de(a,r,e,t){let i=a[e];if(i==null)return"";let n=i.includes("<"),o=i.includes("<a ");try{i=o?th(i):i,i=n?i.replace(Jd,""):i;let s=bs(i,r,t);return o?rh(s):s}catch{return Xd.error("Failed to format literal:",i),""}}function ah(a,{accessibleLabel:r,altAccessibleLabel:e,currencySymbol:t,decimals:i,decimalsDelimiter:n,hasCurrencySpace:o,integer:s,isCurrencyFirst:c,recurrenceLabel:l,perUnitLabel:d,taxInclusivityLabel:f},g={}){let p=U(B.currencySymbol,t),h=U(B.currencySpace,o?"&nbsp;":""),u="";return r?u=`<sr-only class="strikethrough-aria-label">${r}</sr-only>`:e&&(u=`<sr-only class="alt-aria-label">${e}</sr-only>`),c&&(u+=p+h),u+=U(B.integer,s),u+=U(B.decimalsDelimiter,n),u+=U(B.decimals,i),c||(u+=h+p),u+=U(B.recurrence,l,null,!0),u+=U(B.unitType,d,null,!0),u+=U(B.taxInclusivity,f,!0),U(a,u,{...g})}var X=({isAlternativePrice:a=!1,displayOptical:r=!1,displayStrikethrough:e=!1,displayPromoStrikethrough:t=!1,displayAnnual:i=!1,instant:n=void 0}={})=>({country:o,displayFormatted:s=!0,displayRecurrence:c=!0,displayPerUnit:l=!1,displayTax:d=!1,language:f,literals:g={},quantity:p=1,space:h=!1,isPromoApplied:u=!1}={},{commitment:x,offerSelectorIds:b,formatString:y,price:E,priceWithoutDiscount:P,taxDisplay:M,taxTerm:z,term:F,usePrecision:q,promotion:W,priceInfo:Y}={},H={})=>{Object.entries({country:o,formatString:y,language:f,price:E}).forEach(([ac,ic])=>{if(ic==null)throw new Error(`Argument "${ac}" is missing for osi ${b?.toString()}, country ${o}, language ${f}`)});let N={...tt,...g},Q=`${f.toLowerCase()}-${o.toUpperCase()}`,V;W&&!u&&P?V=a||t?E:P:e&&P?V=P:V=E;let Se=!r&&V===P,pe=r?rs:as;i&&(pe=is);let Ut=o==="IN",it=Y&&C(s)?ts({priceInfo:Y,showWithoutDiscount:Se,displayAnnual:i,displayOptical:r,commitment:x,term:F,promotion:W}):void 0,{recurrenceTerm:ji,...Wi}=pe({commitment:x,formatString:y,instant:n,isIndianPrice:Ut,originalPrice:E,priceWithoutDiscount:P,price:r?E:V,promotion:W,quantity:p,term:F,usePrecision:q,preformatted:it,priceInfoFormat:Y?.format}),ca="",la="",da="";C(c)&&ji&&(da=de(N,Q,ke.recurrenceLabel,{recurrenceTerm:ji}));let wr="";C(l)&&(h&&(wr+=" "),wr+=de(N,Q,ke.perUnitLabel,{perUnit:"LICENSE"}));let Er="";C(d)&&z&&(h&&(Er+=" "),Er+=de(N,Q,M===$i?ke.taxExclusiveLabel:ke.taxInclusiveLabel,{taxTerm:z})),e&&(ca=de(N,Q,ke.strikethroughAriaLabel,{strikethroughPrice:ca})),a&&(la=de(N,Q,ke.alternativePriceAriaLabel,{alternativePrice:la}));let Ve=B.container;if(r&&(Ve+=` ${B.containerOptical}`),e&&(Ve+=` ${B.containerStrikethrough}`),t&&(Ve+=` ${B.containerPromoStrikethrough}`),a&&(Ve+=` ${B.containerAlternative}`),i&&(Ve+=` ${B.containerAnnual}`),C(s))return ah(Ve,{...Wi,accessibleLabel:ca,altAccessibleLabel:la,recurrenceLabel:da,perUnitLabel:wr,taxInclusivityLabel:Er},H);let{currencySymbol:Yi,decimals:Xs,decimalsDelimiter:Js,hasCurrencySpace:Ki,integer:ec,isCurrencyFirst:tc}=Wi,nt=[ec,Js,Xs];tc?(nt.unshift(Ki?"\xA0":""),nt.unshift(Yi)):(nt.push(Ki?"\xA0":""),nt.push(Yi)),nt.push(da,wr,Er);let rc=nt.join("");return U(Ve,rc,H)},ys=()=>(a,r,e)=>{let t=et(r.promotion,r.promotion?.displaySummary?.instant,Array.isArray(a.quantity)?a.quantity[0]:a.quantity),n=(a.displayOldPrice===void 0||C(a.displayOldPrice))&&r.priceWithoutDiscount&&r.priceWithoutDiscount!=r.price&&(!r.promotion||t);return`${n?`${X({displayStrikethrough:!0})({isPromoApplied:t,...a,displayPerUnit:!1,displayTax:!1},r,e)}${a.wrapClauses?" ":"&nbsp;"}`:""}${X({isAlternativePrice:n})({isPromoApplied:t,...a},r,e)}`},ws=()=>(a,r,e)=>{let{instant:t}=a;try{t||(t=new URLSearchParams(document.location.search).get("instant")),t&&(t=new Date(t))}catch{t=void 0}let i=et(r.promotion,t,Array.isArray(a.quantity)?a.quantity[0]:a.quantity),n={...a,displayTax:!1,displayPerUnit:!1,isPromoApplied:i};if(!i)return X()(a,{...r,price:r.priceWithoutDiscount},e)+U(B.containerAnnualPrefix," (")+X({displayAnnual:!0,instant:t})(n,{...r,price:r.priceWithoutDiscount},e)+U(B.containerAnnualSuffix,")");let s=(a.displayOldPrice===void 0||C(a.displayOldPrice))&&r.priceWithoutDiscount&&r.priceWithoutDiscount!=r.price;return`${s?`${X({displayStrikethrough:!0})(n,r,e)}${a.wrapClauses?" ":"&nbsp;"}`:""}${X({isAlternativePrice:s})({isPromoApplied:i,...a},r,e)}${U(B.containerAnnualPrefix," (")}${X({displayAnnual:!0,instant:t})(n,r,e)}${U(B.containerAnnualSuffix,")")}`},Es=()=>(a,r,e)=>{let t={...a,displayTax:!1,displayPerUnit:!1};return`${X({isAlternativePrice:a.displayOldPrice})(a,r,e)}${U(B.containerAnnualPrefix," (")}${X({displayAnnual:!0})(t,r,e)}${U(B.containerAnnualSuffix,")")}`};var fr={...B,containerLegal:"price-legal",planType:"price-plan-type"},oa={...ke,planTypeLabel:"planTypeLabel"};function ih(a,{perUnitLabel:r,taxInclusivityLabel:e,planTypeLabel:t},i={},n=!0){let o="";return o+=U(fr.unitType,r,null,!0),e&&t&&n&&(e+=e.endsWith(".")?" ":". "),o+=U(fr.taxInclusivity,e,!0),o+=U(fr.planType,t,null),U(a,o,{...i})}var As=({country:a,displayPerUnit:r=!1,displayTax:e=!1,displayPlanType:t=!1,displayDot:i=!0,planTypeCase:n,language:o,literals:s={}}={},{taxDisplay:c,taxTerm:l,planType:d}={},f={})=>{let g={...tt,...s},p=`${o.toLowerCase()}-${a.toUpperCase()}`,h="";C(r)&&(h=de(g,p,oa.perUnitLabel,{perUnit:"LICENSE"}));let u="";a==="US"&&o==="en"&&(e=!1),C(e)&&l&&(u=de(g,p,c===$i?oa.taxExclusiveLabel:oa.taxInclusiveLabel,{taxTerm:l}));let x="";C(t)&&d&&(x=de(g,p,oa.planTypeLabel,{planType:d})),x&&n&&(x=(n==="lower"?x[0].toLowerCase():x[0].toUpperCase())+x.slice(1));let b=fr.container;return b+=` ${fr.containerLegal}`,ih(b,{perUnitLabel:h,taxInclusivityLabel:u,planTypeLabel:x},f,i)};var ks=X(),Ss=ys(),Cs=X({displayOptical:!0}),Ts=X({displayStrikethrough:!0}),Ls=X({displayPromoStrikethrough:!0}),Ps=X({displayAnnual:!0}),_s=X({displayOptical:!0,isAlternativePrice:!0}),Ms=X({isAlternativePrice:!0}),Rs=Es(),zs=ws(),Os=As;var nh={...ke,discountLabel:"discountLabel"},oh=(a,r)=>{if(!r&&zt(a))return 0;if(!(!zt(a)||!zt(r)))return Math.floor((r-a)/r*100)},Ns=()=>(a,r)=>{let{country:e,language:t,literals:i={}}=a??{},{price:n,priceWithoutDiscount:o}=r,s=oh(n,o);if(s===void 0)return'<span class="no-discount"></span>';let c={...tt,...i},l=t&&e?`${t.toLowerCase()}-${e.toUpperCase()}`:"en-US";return`<span class="discount">${de(c,l,nh.discountLabel,{discount:s,remainingPercent:100-s})}</span>`};var Ds=Ns();var Is="INDIVIDUAL_COM",Hi="TEAM_COM",$s="INDIVIDUAL_EDU",Ui="TEAM_EDU",sh=["AT_de","AU_en","BE_en","BE_fr","BE_nl","BG_bg","CH_de","CH_fr","CH_it","CZ_cs","CO_es","DE_de","DK_da","EE_et","EG_ar","EG_en","ES_es","FI_fi","FR_fr","GB_en","GR_el","GR_en","HU_hu","ID_en","ID_id","ID_in","IE_en","IN_en","IN_hi","IT_it","JP_ja","KR_ko","LU_de","LU_en","LU_fr","LT_lt","LV_lv","MY_en","MY_ms","MU_en","NL_nl","NG_en","NO_nb","NZ_en","PE_es","PL_pl","PT_pt","RO_ro","SE_sv","SI_sl","SK_sk","SG_en","TH_en","TH_th","TR_tr","UA_uk","ZA_en","SA_ar","SA_en","MX_es","CL_es","PE_es","PH_en","PH_fil","VN_vi","VN_en","TW_zh","KE_en","GH_en","TZ_en","AM_en","AZ_en","GE_en","MD_en","KZ_en","KG_en","TJ_en","UZ_en","OM_en","BH_en"],ch={[Is]:[],[Hi]:[],[$s]:[],[Ui]:[]},lh={MU_en:[!0,!0,!0,!0],NG_en:[!1,!1,!1,!1],AU_en:[!1,!1,!1,!1],JP_ja:[!1,!1,!1,!1],NZ_en:[!1,!1,!1,!1],TH_en:[!1,!1,!1,!1],TH_th:[!1,!1,!1,!1],ZA_en:[!1,!1,!1,!1],PE_es:[!1,!1,!1,!1]},dh=[Is,Hi,$s,Ui],hh=a=>[Hi,Ui].includes(a);function Fi(a,r,e,t){if(a[r])return a[r];let i=`${r}_${e}`;if(a[i])return a[i];let n;if(t)n=a.find(o=>o.startsWith(`${r}_`));else{let o=Object.keys(a).find(s=>s.startsWith(`${r}_`));n=o?a[o]:null}return n}var ph=(a,r,e,t)=>{let i=`${e}_${t}`,n=Fi(lh,a,r,!1);if(n){let o=dh.indexOf(i);return n[o]}return hh(i)},mh=(a,r,e,t)=>{if(Fi(sh,a,r,!0))return!0;let i=ch[`${e}_${t}`];return i?Fi(i,a,r,!0)?!0:_.displayTax:_.displayTax},Bi=async(a,r,e,t)=>{let i=mh(a,r,e,t);return{displayTax:i,forceTaxExclusive:i?ph(a,r,e,t):_.forceTaxExclusive}};function uh({country:a,language:r,literals:e={}}){let t={...tt,...e},i=`${r.toLowerCase()}-${a.toUpperCase()}`,n=de(t,i,"priceUnavailableLabel",{});return U("price-unavailable",n)}var vr=class vr extends HTMLSpanElement{constructor(){super();m(this,"masElement",new qe(this));this.handleClick=this.handleClick.bind(this)}static get observedAttributes(){return["data-display-old-price","data-display-per-unit","data-display-recurrence","data-display-tax","data-display-plan-type","data-display-annual","data-perpetual","data-promotion-code","data-force-tax-exclusive","data-template","data-wcs-osi","data-quantity"]}static createInlinePrice(e){let t=te();if(!t)return null;let{displayOldPrice:i,displayPerUnit:n,displayRecurrence:o,displayTax:s,displayPlanType:c,displayAnnual:l,forceTaxExclusive:d,perpetual:f,promotionCode:g,quantity:p,alternativePrice:h,template:u,wcsOsi:x}=t.collectPriceOptions(e);return ta(vr,{displayOldPrice:i,displayPerUnit:n,displayRecurrence:o,displayTax:s,displayPlanType:c,displayAnnual:l,forceTaxExclusive:d,perpetual:f,promotionCode:g,quantity:p,alternativePrice:h,template:u,wcsOsi:x})}get isInlinePrice(){return!0}attributeChangedCallback(e,t,i){this.masElement.attributeChangedCallback(e,t,i)}connectedCallback(){this.masElement.connectedCallback(),this.addEventListener("click",this.handleClick)}disconnectedCallback(){this.masElement.disconnectedCallback(),this.removeEventListener("click",this.handleClick)}handleClick(e){e.target!==this&&(e.stopImmediatePropagation(),this.dispatchEvent(new MouseEvent("click",{bubbles:!0,cancelable:!0,view:window})))}onceSettled(){return this.masElement.onceSettled()}get value(){return this.masElement.value}get options(){return this.masElement.options}get isFailed(){return this.masElement.state===ue}requestUpdate(e=!1){return this.masElement.requestUpdate(e)}async render(e={}){if(!this.isConnected)return!1;let t=te();if(!t)return!1;let i=t.collectPriceOptions(e,this),n={...t.settings,...i};if(!n.wcsOsi.length)return!1;try{let o=this.masElement.togglePending({});this.innerHTML="";let s=t.resolveOfferSelectors(n),c=await Promise.all(s),l=c.map(p=>{let h=hr(p,n);return h?.length?h[0]:null});if(l.some(p=>!p))throw new Error(ot);let d=l,f=Pi(l);if(t.featureFlags[Ce]||n[Ce]){if(i.displayPerUnit===void 0&&(n.displayPerUnit=f.customerSegment!=="INDIVIDUAL"),i.displayTax===void 0||i.forceTaxExclusive===void 0){let{country:p,language:h}=n,[u=""]=f.marketSegments,x=await Bi(p,h,f.customerSegment,u);i.displayTax===void 0&&(n.displayTax=x?.displayTax||n.displayTax),i.forceTaxExclusive===void 0&&(n.forceTaxExclusive=x?.forceTaxExclusive||n.forceTaxExclusive),n.forceTaxExclusive&&(d=c.map(b=>{let y=hr(b,n);return y?.length?y[0]:null}))}}else i.displayOldPrice===void 0&&(n.displayOldPrice=!0);if(t.featureFlags[st]&&n.displayAnnual!==!1&&(n.displayAnnual=!0),n.template==="discount"&&d.length===2){let[p,h]=d,u={...p,priceInfo:void 0,priceDetails:{...p.priceDetails,priceWithoutDiscount:h.priceDetails?.price}};return this.renderOffers([u],n,o)}let g=Pi(d);return this.renderOffers([g],n,o)}catch(o){throw this.innerHTML=o.message===ot&&!t.settings.preview?uh(n):"",o}}renderOffers(e,t,i=void 0){if(!this.isConnected)return;let n=te();if(!n)return!1;if(i??(i=this.masElement.togglePending()),e.length){if(this.masElement.toggleResolved(i,e,t)){this.innerHTML=n.buildPriceHTML(e,this.options);let o=this.closest("p, h3, div");if(!o||!o.querySelector('span[data-template="strikethrough"]')||o.querySelector(".alt-aria-label"))return!0;let s=o?.querySelectorAll('span[is="inline-price"]:not([data-template="legal"])');return s.length>1&&s.length===o.querySelectorAll('span[data-template="strikethrough"]').length*2&&s.forEach(c=>{c.dataset.template!=="strikethrough"&&c.options&&!c.options.alternativePrice&&!c.isFailed&&(c.options.alternativePrice=!0,c.innerHTML=n.buildPriceHTML(e,c.options))}),!0}}else{let o=new Error(`Not provided: ${this.options?.wcsOsi??"-"}`);if(this.masElement.toggleFailed(i,o,this.options))return this.innerHTML="",!0}return!1}};m(vr,"is","inline-price"),m(vr,"tag","span");var ze=vr;window.customElements.get(ze.is)||window.customElements.define(ze.is,ze,{extends:ze.tag});function Fs({literals:a,providers:r,settings:e}){function t(o,s=null){let c={country:e.country,language:e.language,locale:e.locale,literals:{...a.price}};if(s&&r?.price)for(let W of r.price)W(s,c);let{displayOldPrice:l,displayPerUnit:d,displayRecurrence:f,displayTax:g,displayPlanType:p,forceTaxExclusive:h,perpetual:u,displayAnnual:x,promotionCode:b,quantity:y,alternativePrice:E,wcsOsi:P,...M}=Object.assign(c,s?.dataset??{},o??{}),{wcsOsi:z,promotionCodes:F}=ea(P,b),q=F.map(W=>Kr(W).effectivePromoCode);return c=jr(Object.assign({...c,...M,displayOldPrice:C(l),displayPerUnit:C(d),displayRecurrence:C(f),displayTax:C(g),displayPlanType:C(p),forceTaxExclusive:C(h),perpetual:C(u),displayAnnual:C(x),promotionCode:q[0],promotionCodes:q,quantity:Ot(y,_.quantity),alternativePrice:C(E),wcsOsi:z})),c}function i(o,s){if(!Array.isArray(o)||!o.length||!s)return"";let{template:c}=s,l;switch(c){case"discount":l=Ds;break;case"strikethrough":l=Ts;break;case"promo-strikethrough":l=Ls;break;case"annual":l=Ps;break;case"legal":l=Os;break;default:s.template==="optical"&&s.alternativePrice?l=_s:s.template==="optical"?l=Cs:s.displayAnnual&&o[0].planType==="ABM"?l=s.promotionCode&&o[0].promotion?zs:Rs:s.alternativePrice?l=Ms:l=s.promotionCode&&o[0].promotion?Ss:ks}let[d]=o;return d={...d,...d.priceDetails},l({...e,...s},d)}let n=ze.createInlinePrice;return{InlinePrice:ze,buildPriceHTML:i,collectPriceOptions:t,createInlinePrice:n}}function gh({locale:a=void 0,country:r=void 0,language:e=void 0}={}){e??(e=a?.split("_")?.[0]||_.language);let t=!!(r||a?.split("_")?.[1]);return r??(r=a?.split("_")?.[1]||_.country),r==="PR"&&(r="US"),a??(a=`${e}_${r}`),{locale:a,country:r,language:e,hasExplicitCountry:t}}function Hs(a={},r){let e=r.featureFlags[Ce],{commerce:t={}}=a,i=ve.PRODUCTION,n=za,o=I("checkoutClientId",t)??_.checkoutClientId,s=dr(I("checkoutWorkflowStep",t),J,_.checkoutWorkflowStep),c=C(I("displayOldPrice",t),_.displayOldPrice),l=_.displayPerUnit,d=C(I("displayRecurrence",t),_.displayRecurrence),f=C(I("displayTax",t),_.displayTax),g=C(I("displayPlanType",t),_.displayPlanType),p=C(I("entitlement",t),_.entitlement),h=C(I("modal",t),_.modal),u=C(I("forceTaxExclusive",t),_.forceTaxExclusive),x=I("promotionCode",t)??_.promotionCode,b=Ot(I("quantity",t)),y=I("wcsApiKey",t)??_.wcsApiKey,E=t?.env==="stage",P=Ie.PUBLISHED;["true",""].includes(t.allowOverride)&&(E=(I(Ma,t,{metadata:!1})?.toLowerCase()??t?.env)==="stage",P=dr(I(Ra,t),Ie,P)),E&&(i=ve.STAGE,n=Oa);let z=I(_a)??a.preview,F=typeof z<"u"&&z!=="off"&&z!=="false",q={};F&&(q={preview:F});let W=cn(I("mas-io-url")??a.masIOUrl)??`https://www${i===ve.STAGE?".stage":""}.adobe.com/mas/io`,Y=I("preselect-plan")??void 0,H=I("instant")??a.instant;return{...gh(a),...q,aupSelect:I("aup-select",{"aup-select":r.getAttribute("aup-select")},{search:!0,storage:!1})==="on",displayOldPrice:c,checkoutClientId:o,checkoutWorkflowStep:s,displayPerUnit:l,displayRecurrence:d,displayTax:f,displayPlanType:g,entitlement:p,extraOptions:_.extraOptions,modal:h,env:i,forceTaxExclusive:u,promotionCode:x,quantity:b,alternativePrice:_.alternativePrice,wcsApiKey:y,wcsURL:n,landscape:P,masIOUrl:W,...Y&&{preselectPlan:Y},...H&&{instant:H}}}async function Us(a,r={},e=2,t=100){let i;for(let n=0;n<=e;n++)try{let o=await fetch(a,r);return o.retryCount=n,o}catch(o){if(i=o,i.retryCount=n,n>e)break;await new Promise(s=>setTimeout(s,t*(n+1)))}throw i}var qi="wcs";function Bs({settings:a}){let r=ee.module(qi),{env:e,wcsApiKey:t}=a,i=new Map,n=new Map,o,s=new Map;async function c(h,u,x=!0){let b=te(),y=ot;r.debug("Fetching:",h);let E="",P;if(h.offerSelectorIds.length>1)throw new Error("Multiple OSIs are not supported anymore");let M=new Map(u),[z]=h.offerSelectorIds,F=Date.now()+Math.random().toString(36).substring(2,7),q=`${qi}:${z}:${F}${Ia}`,W=`${qi}:${z}:${F}${$a}`,Y;try{if(performance.mark(q),E=new URL(a.wcsURL),E.searchParams.set("offer_selector_ids",z),E.searchParams.set("country",h.country),E.searchParams.set("locale",h.locale),E.searchParams.set("landscape",e===ve.STAGE?"ALL":a.landscape),E.searchParams.set("api_key",t),h.language&&E.searchParams.set("language",h.language),h.promotionCode&&E.searchParams.set("promotion_code",h.promotionCode),h.currency&&E.searchParams.set("currency",h.currency),P=await Us(E.toString(),{credentials:"omit"}),P.ok){let H=[];try{let N=await P.json();r.debug("Fetched:",h,N),H=N.resolvedOffers??[]}catch(N){r.error(`Error parsing JSON: ${N.message}`,{...N.context,...b?.duration})}H=H.map(Qr),u.forEach(({resolve:N},Q)=>{let V=H.filter(({offerSelectorIds:Se})=>Se.includes(Q)).flat();V.length&&(M.delete(Q),u.delete(Q),N(V))})}else y=Ta}catch(H){y=`Network error: ${H.message}`}finally{Y=performance.measure(W,q),performance.clearMarks(q),performance.clearMeasures(W)}if(x&&u.size){r.debug("Missing:",{offerSelectorIds:[...u.keys()]});let H=Fo(P);u.forEach(N=>{N.reject(new Nt(y,{...h,...H,response:P,measure:Tr(Y),...b?.duration}))})}}function l(){clearTimeout(o);let h=[...n.values()];n.clear(),h.forEach(({options:u,promises:x})=>c(u,x))}function d(h){if(!h||typeof h!="object")throw new TypeError("Cache must be a Map or similar object");let u=e===ve.STAGE?"stage":"prod",x=h[u];if(!x||typeof x!="object"){r.warn(`No cache found for environment: ${e}`);return}for(let[b,y]of Object.entries(x))i.set(b,Promise.resolve(y.map(Qr)));r.debug(`Prefilled WCS cache with ${x.size} entries`)}function f(){let h=i.size;s=new Map(i),i.clear(),r.debug(`Moved ${h} cache entries to stale cache`)}function g(h,u,x){let b=h!=="GB"&&!x?"MULT":"en",y=Fa.includes(h)?h:_.country;return{validCountry:y,validLanguage:b,locale:`${u}_${y}`}}function p({country:h,language:u,perpetual:x=!1,promotionCode:b="",promotionCodes:y,wcsOsi:E=[]}){let{validCountry:P,validLanguage:M,locale:z}=g(h,u,x),F=Array.isArray(y)&&y.length?y:[b];return E.map((q,W)=>{let Y=F.length===1?F[0]:F[W]??"",H=[P,M,Y].filter(V=>V).join("-").toLowerCase(),N=`${q}-${H}`;if(i.has(N))return i.get(N);let Q=new Promise((V,Se)=>{let pe=n.get(H);pe||(pe={options:{country:P,locale:z,...M==="MULT"&&{language:M},offerSelectorIds:[]},promises:new Map},n.set(H,pe)),Y&&(pe.options.promotionCode=Y),pe.options.offerSelectorIds.push(q),pe.promises.set(q,{resolve:V,reject:Se}),l()}).catch(V=>{if(s.has(N))return s.get(N);throw V});return i.set(N,Q),Q})}return{Commitment:Ne,PlanType:To,Term:ce,applyPlanType:Qr,resolveOfferSelectors:p,flushWcsCacheInternal:f,prefillWcsCache:d,normalizeCountryLanguageAndLocale:g}}var qs="mas-commerce-service",Gs="mas-commerce-service:start",Vs="mas-commerce-service:ready",xr,It,rt,js,Vi,Gi=class extends HTMLElement{constructor(){super(...arguments);k(this,rt);k(this,xr);k(this,It);m(this,"lastLoggingTime",0)}async registerCheckoutAction(e){typeof e=="function"&&(this.buildCheckoutAction=async(t,i,n)=>{let o=await e?.(t,i,this.imsSignedInPromise,n);return o||null})}get featureFlags(){return v(this,It)||A(this,It,{[Ce]:$(this,rt,Vi).call(this,Ce),[st]:$(this,rt,Vi).call(this,st)}),v(this,It)}activate(){let e=v(this,rt,js),t=Hs(e,this);Zr({...e.lana,country:t.country});let i=ee.init(e.hostEnv).module("service");i.debug("Activating:",e);let o={price:hs(t)},s={checkout:new Set,price:new Set},c={literals:o,providers:s,settings:t};Object.defineProperties(this,Object.getOwnPropertyDescriptors({...cs(c),...ls(c),...Fs(c),...Bs(c),...Ha,Log:ee,resolvePriceTaxFlags:Bi,get defaults(){return _},get log(){return ee},get providers(){return{checkout(d){return s.checkout.add(d),()=>s.checkout.delete(d)},price(d){return s.price.add(d),()=>s.price.delete(d)},has:d=>s.price.has(d)||s.checkout.has(d)}},get settings(){return t}})),i.debug("Activated:",{literals:o,settings:t});let l=new CustomEvent(kr,{bubbles:!0,cancelable:!1,detail:this});performance.mark(Vs),A(this,xr,performance.measure(Vs,Gs)),this.dispatchEvent(l),setTimeout(()=>{this.logFailedRequests()},1e4)}connectedCallback(){performance.mark(Gs),this.activate()}flushWcsCache(){this.flushWcsCacheInternal(),this.log.debug("Flushed WCS cache")}isPreview(){let e=this.getAttribute("preview");return e!=null&&["true","on",!0].includes(e)}refreshOffers(){this.flushWcsCacheInternal(),document.querySelectorAll(ga).forEach(e=>e.requestUpdate(!0)),this.log.debug("Refreshed WCS offers"),this.logFailedRequests()}refreshFragments(){this.flushWcsCacheInternal(),customElements.get("aem-fragment")?.cache.clear(),document.querySelectorAll("aem-fragment").forEach(e=>e.refresh(!1)),this.log.debug("Refreshed AEM fragments"),this.logFailedRequests()}get duration(){return{"mas-commerce-service:measure":Tr(v(this,xr))}}logFailedRequests(){let e=[...performance.getEntriesByType("resource")].filter(({startTime:i})=>i>this.lastLoggingTime).filter(({transferSize:i,duration:n,responseStatus:o})=>i===0&&n===0&&o<200||o>=400),t=Array.from(new Map(e.map(i=>[i.name,i])).values());if(t.some(({name:i})=>/(\/fragment\?|web_commerce_artifact)/.test(i))){let i=t.map(({name:n})=>n);this.log.error("Failed requests:",{failedUrls:i,...this.duration})}this.lastLoggingTime=performance.now().toFixed(3)}};xr=new WeakMap,It=new WeakMap,rt=new WeakSet,js=function(){let e=this.getAttribute("env")??"prod",t={commerce:{env:e},hostEnv:{name:e},lana:{tags:this.getAttribute("lana-tags"),sampleRate:parseInt(this.getAttribute("lana-sample-rate")??1,10),isProdDomain:e==="prod"},masIOUrl:this.getAttribute("mas-io-url")};return["locale","country","language","preview","instant"].forEach(i=>{let n=this.getAttribute(i);n&&(t[i]=n)}),["checkout-workflow-step","force-tax-exclusive","checkout-client-id","allow-override","wcs-api-key"].forEach(i=>{let n=this.getAttribute(i);if(n!=null){let o=i.replace(/-([a-z])/g,s=>s[1].toUpperCase());t.commerce[o]=n}}),t},Vi=function(e){return["on","true",!0].includes(this.getAttribute(`data-${e}`)||I(e))};window.customElements.get(qs)||window.customElements.define(qs,Gi);var Qs="merch-card-collection",fh=3e4,vh={catalog:["four-merch-cards"],plans:["four-merch-cards"],plansTwoColumns:["two-merch-cards"],plansThreeColumns:["three-merch-cards"],product:["four-merch-cards"],productTwoColumns:["two-merch-cards"],productThreeColumns:["three-merch-cards"],segment:["four-merch-cards"],segmentTwoColumns:["two-merch-cards"],segmentThreeColumns:["three-merch-cards"],"special-offers":["three-merch-cards"],image:["three-merch-cards"],"mini-compare-chart":["three-merch-cards"],"mini-compare-chartTwoColumns":["two-merch-cards"],"mini-compare-chart-mweb":["three-merch-cards"],"mini-compare-chart-mwebTwoColumns":["two-merch-cards"]},xh={plans:!0},bh=(a,{filter:r})=>a.filter(e=>e?.filters&&e?.filters.hasOwnProperty(r)),yh=(a,{types:r})=>r?(r=r.split(","),a.filter(e=>r.some(t=>e.types.includes(t)))):a,wh=(a,r)=>{let e=r.tagGroups;if(!e?.length)return a;let t=pa();return a.filter(i=>yo((i.getAttribute("filter-tags")||"").split(",").filter(Boolean),e,t))},Eh=a=>a.sort((r,e)=>(r.title??"").localeCompare(e.title??"","en",{sensitivity:"base"})),Ah=(a,{filter:r})=>a.sort((e,t)=>t.filters[r]?.order==null||isNaN(t.filters[r]?.order)?-1:e.filters[r]?.order==null||isNaN(e.filters[r]?.order)?1:e.filters[r].order-t.filters[r].order),kh=(a,{search:r})=>r?.length?(r=r.toLowerCase(),a.filter(e=>(e.title??"").toLowerCase().includes(r))):a,Ge,Ft,at,yr,sa,Zs,$t=class extends Ys{constructor(){super();k(this,sa);k(this,Ge,{});k(this,Ft);k(this,at);k(this,yr);this.id=null,this.filter="all",this.hasMore=!1,this.resultCount=void 0,this.displayResult=!1,this.data=null,this.variant=null,this.hydrating=!1,this.hydrationReady=null,this.literalsHandlerAttached=!1,this.onUnmount=[],this.resizeHandlerDebounced=on(this.resizeHandler.bind(this),300)}resizeHandler(){this.firstChild?.variantLayout?.resizeHandler?.()}render(){return Oe` <slot></slot>
            ${this.footer}`}checkReady(){if(!this.querySelector("aem-fragment"))return Promise.resolve(!0);let t,i=new Promise(o=>{t=sn(()=>o(!1),fh)}),n=Promise.race([this.hydrationReady,i]);return n.finally(()=>Ga(t)),n}updated(e){if(!this.querySelector("merch-card"))return;let t=window.scrollY||document.documentElement.scrollTop,i=[...this.children].filter(l=>l.tagName==="MERCH-CARD"&&!l.failed);if(i.length===0)return;e.has("singleApp")&&this.singleApp&&i.forEach(l=>{l.updateFilters(l.name===this.singleApp)});let n=this.sort===ge.alphabetical?Eh:Ah,s=[bh,yh,wh,kh,n].reduce((l,d)=>d(l,this),i).map((l,d)=>[l,d]);if(this.resultCount=s.length,this.page&&this.limit){let l=this.page*this.limit;this.hasMore=s.length>l,s=s.filter(([,d])=>d<l)}let c=new Map(s.reverse());for(let l of c.keys())this.prepend(l);i.forEach(l=>{c.has(l)?(l.size=l.filters[this.filter]?.size,l.style.removeProperty("display"),l.requestUpdate()):(l.style.display="none",l.size=void 0)}),window.scrollTo(0,t),this.updateComplete.then(()=>{this.dispatchLiteralsChanged(),this.sidenav&&!this.literalsHandlerAttached&&(this.sidenav.addEventListener(ya,()=>{this.dispatchLiteralsChanged()}),this.literalsHandlerAttached=!0)})}dispatchLiteralsChanged(){this.dispatchEvent(new CustomEvent(me,{detail:{resultCount:this.resultCount,searchTerm:this.search,filter:this.sidenav?.filters?.selectedText}}))}buildOverrideMap(){A(this,Ge,{}),this.overrides?.split(",").forEach(e=>{let[t,i]=e?.split(":");t&&i&&(v(this,Ge)[t]=i)})}connectedCallback(){super.connectedCallback(),A(this,Ft,Wt()),v(this,Ft)&&A(this,at,v(this,Ft).Log.module(Qs)),A(this,yr,customElements.get("merch-card")),this.buildOverrideMap(),this.init(),window.addEventListener("resize",this.resizeHandlerDebounced)}async init(){await this.hydrate(),this.sidenav=this.parentElement.querySelector("merch-sidenav"),this.filtered?(this.filter=this.filtered,this.page=1):this.startDeeplink(),this.tagGroups?.length&&(this.stopFilterDeeplink=ma(()=>this.requestUpdate())),this.initializePlaceholders()}disconnectedCallback(){super.disconnectedCallback(),this.stopDeeplink?.(),this.stopFilterDeeplink?.();for(let e of this.onUnmount)e();window.removeEventListener("resize",this.resizeHandlerDebounced)}initializeHeader(){let e=document.createElement("merch-card-collection-header");e.collection=this,e.classList.add(this.variant),this.parentElement.insertBefore(e,this),this.header=e,this.querySelectorAll("[placeholder]").forEach(i=>{let n=i.getAttribute("slot");this.header.placeholderKeys.includes(n)&&this.header.append(i)})}initializePlaceholders(){let e=this.data?.placeholders||{};!e.searchText&&this.data?.sidenavSettings?.searchText&&(e.searchText=this.data.sidenavSettings.searchText);for(let t of Object.keys(e)){let i=e[t],n=i.includes("<p>")?"div":"p",o=document.createElement(n);o.setAttribute("slot",t),o.setAttribute("placeholder",""),o.innerHTML=i,this.append(o)}}attachSidenav(e,t=!0){if(!e)return;t&&this.parentElement.prepend(e),this.sidenav=e,this.sidenav.variant=this.variant,this.sidenav.classList.add(this.variant),xh[this.variant]&&this.sidenav.setAttribute("autoclose",""),this.initializeHeader(),this.dispatchEvent(new CustomEvent(Gt));let i=v(this,yr)?.getCollectionOptions(this.variant)?.onSidenavAttached;i&&i(this)}async hydrate(){if(this.hydrating)return!1;let e=this.querySelector("aem-fragment");if(!e)return;this.id=e.getAttribute("fragment"),this.hydrating=!0;let t;this.hydrationReady=new Promise(s=>{t=s});let i=this;function n(s){let c;return s.fields?.tagFilters?.length&&(c=xo(s.fields.tagFilters,s.fields.tagFiltersTitle,s.settings)),{searchText:s.fields?.searchText,tagFilters:c,linksTitle:s.fields?.linksTitle,link:s.fields?.link,linkText:s.fields?.linkText,linkIcon:s.fields?.linkIcon}}function o(s,c){let l={cards:[],hierarchy:[],placeholders:s.placeholders,sidenavSettings:n(s)};function d(f,g){for(let p of g){if(p.fieldName==="variations")continue;if(p.fieldName==="cards"){if(l.cards.findIndex(E=>E.id===p.identifier)!==-1)continue;if(!s.references[p.identifier]?.value){v(i,at)?.error(`Reference not found for card: ${p.identifier}`);continue}l.cards.push(s.references[p.identifier].value);continue}let h=s.references[p.identifier]?.value,u=p.referencesTree,x=c[p.identifier];if(x){let E=document.querySelector(`aem-fragment[fragment="${x}"]`)?.rawData;if(E?.fields)h=E,u=E.referencesTree,s.references={...s.references,...E.references};else{v(i,at)?.error(`Override fragment ${x} not found or invalid:`);continue}}if(!h?.fields)continue;let{fields:b}=h,y={label:b.label||"",icon:b.icon,iconLight:b.iconLight,queryLabel:b.queryLabel,cards:b.cards?b.cards.map(E=>c[E]||E):[],collections:[]};b.defaultchild&&(y.defaultchild=c[b.defaultchild]||b.defaultchild),f.push(y),d(y.collections,u)}}return d(l.hierarchy,s.referencesTree),l.hierarchy.length===0&&(i.filtered="all"),l}e.addEventListener(Ea,s=>{$(this,sa,Zs).call(this,"Error loading AEM fragment",s.detail),this.hydrating=!1,e.remove()}),e.addEventListener(wa,async s=>{this.limit=27,this.data=o(s.detail,v(this,Ge)),this.tagGroups=this.data.sidenavSettings?.tagFilters??null,s.detail.variationId&&this.setAttribute("variation-id",s.detail.variationId);let{cards:c,hierarchy:l}=this.data,d=l.length===0&&s.detail.fields?.defaultchild?v(this,Ge)[s.detail.fields.defaultchild]||s.detail.fields.defaultchild:null;e.cache.add(...c);let f=(h,u)=>{for(let x of h)if(x.defaultchild===u||x.collections&&f(x.collections,u))return!0;return!1};for(let h of c){let E=function(M){for(let z of M){let F=z.cards.indexOf(x);if(F===-1)continue;let q=z.queryLabel??z?.label?.toLowerCase()??"";u.filters[q]={order:F+1,size:h.fields.size},E(z.collections)}},u=document.createElement("merch-card"),x=v(this,Ge)[h.id]||h.id;u.setAttribute("consonant",""),u.setAttribute("style","");let b=h.fields.tags?.filter(M=>M.startsWith("mas:types/")).map(M=>M.split("/")[1]).join(",");if(b&&u.setAttribute("types",b),this.tagGroups){let M=new Set(this.tagGroups.map(F=>F.deeplink)),z=bo(h.fields.tags,M);z.length&&u.setAttribute("filter-tags",z.join(","))}Qt(h.fields.variant)?.supportsDefaultChild&&(d?x===d:f(l,x))&&u.setAttribute("data-default-card","true"),E(l);let P=document.createElement("aem-fragment");P.setAttribute("fragment",x),u.append(P),Object.keys(u.filters).length===0&&(u.filters={all:{order:c.indexOf(h)+1,size:h.fields.size}}),this.append(u)}let g="",p=Bo(c[0]?.fields?.variant);this.variant=p,p==="plans"&&(c.length===2||c.length===3)&&!c.some(h=>h.fields?.size?.includes("wide"))||(p==="segment"||p==="product")&&(c.length===2||c.length===3)?g=c.length===2?"TwoColumns":"ThreeColumns":(p==="mini-compare-chart"||p==="mini-compare-chart-mweb")&&c.length<=2&&(g=c.length===1?"":"TwoColumns"),p&&this.classList.add("merch-card-collection",p,...vh[`${p}${g}`]||[]),this.displayResult=!0,this.hydrating=!1,e.remove(),t(!0)}),await this.hydrationReady}get footer(){if(!this.filtered)return Oe`<div id="footer">
            <sp-theme color="light" scale="medium">
                ${this.showMoreButton}
            </sp-theme>
        </div>`}get showMoreButton(){if(this.hasMore)return Oe`<sp-button
            variant="secondary"
            treatment="outline"
            style="order: 1000;"
            @click="${this.showMore}"
        >
            <slot name="showMoreText"></slot>
        </sp-button>`}sortChanged(e){e.target.value===ge.authored?qt({sort:void 0}):qt({sort:e.target.value}),this.dispatchEvent(new CustomEvent(xa,{bubbles:!0,composed:!0,detail:{value:e.target.value}}))}async showMore(){this.dispatchEvent(new CustomEvent(ba,{bubbles:!0,composed:!0}));let e=this.page+1;qt({page:e}),this.page=e,await this.updateComplete}startDeeplink(){this.stopDeeplink=ma(({category:e,filter:t,types:i,sort:n,search:o,single_app:s,page:c})=>{t=t||e,!this.filtered&&t&&t!==this.filter&&setTimeout(()=>{qt({page:void 0}),this.page=1},1),this.filtered||(this.filter=t??this.filter),this.types=i??"",this.search=o??"",this.singleApp=s,this.sort=n,this.page=Number(c)||1})}openFilters(e){this.sidenav?.showModal(e)}};Ge=new WeakMap,Ft=new WeakMap,at=new WeakMap,yr=new WeakMap,sa=new WeakSet,Zs=function(e,t={},i=!0){v(this,at)?.error(`merch-card-collection: ${e}`,t),this.failed=!0,i&&this.dispatchEvent(new CustomEvent(Aa,{detail:{...t,message:e},bubbles:!0,composed:!0}))},m($t,"properties",{id:{type:String,attribute:"id",reflect:!0},displayResult:{type:Boolean,attribute:"display-result"},filter:{type:String,attribute:"filter",reflect:!0},filtered:{type:String,attribute:"filtered",reflect:!0},hasMore:{type:Boolean},limit:{type:Number,attribute:"limit"},overrides:{type:String},page:{type:Number,attribute:"page",reflect:!0},resultCount:{type:Number},search:{type:String,attribute:"search",reflect:!0},sidenav:{type:Object},singleApp:{type:String,attribute:"single-app",reflect:!0},sort:{type:String,attribute:"sort",default:ge.authored,reflect:!0},types:{type:String,attribute:"types",reflect:!0}}),m($t,"styles",Ks`
        #footer {
            grid-column: 1 / -1;
            justify-self: stretch;
            color: var(--merch-color-grey-80);
            order: 1000;
        }

        sp-theme {
            display: contents;
        }
    `);$t.SortOrder=ge;customElements.define(Qs,$t);var Sh={filters:["noResultText","resultText","resultsText"],filtersMobile:["noResultText","resultMobileText","resultsMobileText"],search:["noSearchResultsText","searchResultText","searchResultsText"],searchMobile:["noSearchResultsMobileText","searchResultMobileText","searchResultsMobileText"]},Ch=(a,r,e)=>{a.querySelectorAll(`[data-placeholder="${r}"]`).forEach(i=>{i.innerText=e||""})},Th={search:["mobile","tablet"],filter:["mobile","tablet"],sort:!0,result:!0,custom:!1},Lh={catalog:"l"},se,Ht,br=class extends Ys{constructor(){super();k(this,se);k(this,Ht);m(this,"tablet",new Bt(this,S));m(this,"desktop",new Bt(this,L));this.collection=null,A(this,se,{search:!1,filter:!1,sort:!1,result:!1,custom:!1}),this.updateLiterals=this.updateLiterals.bind(this),this.handleSidenavAttached=this.handleSidenavAttached.bind(this)}connectedCallback(){super.connectedCallback(),this.collection?.addEventListener(me,this.updateLiterals),this.collection?.addEventListener(Gt,this.handleSidenavAttached),A(this,Ht,customElements.get("merch-card"))}disconnectedCallback(){super.disconnectedCallback(),this.collection?.removeEventListener(me,this.updateLiterals),this.collection?.removeEventListener(Gt,this.handleSidenavAttached)}willUpdate(){v(this,se).search=this.getVisibility("search"),v(this,se).filter=this.getVisibility("filter"),v(this,se).sort=this.getVisibility("sort"),v(this,se).result=this.getVisibility("result"),v(this,se).custom=this.getVisibility("custom")}parseVisibilityOptions(e,t){if(!e||!Object.hasOwn(e,t))return null;let i=e[t];return i===!1?!1:i===!0?!0:i.includes(this.currentMedia)}getVisibility(e){let t=v(this,Ht)?.getCollectionOptions(this.collection?.variant)?.headerVisibility,i=this.parseVisibilityOptions(t,e);return i!==null?i:this.parseVisibilityOptions(Th,e)}get sidenav(){return this.collection?.sidenav}get search(){return this.collection?.search}get resultCount(){return this.collection?.resultCount}get variant(){return this.collection?.variant}get isMobile(){return!this.isTablet&&!this.isDesktop}get isTablet(){return this.tablet.matches&&!this.desktop.matches}get isDesktop(){return this.desktop.matches}get currentMedia(){return this.isDesktop?"desktop":this.isTablet?"tablet":"mobile"}get searchAction(){if(!v(this,se).search)return fe;let e=jt(this,"searchText");return e?Oe`
            <merch-search deeplink="search" id="search">
                <sp-search
                    id="search-bar"
                    placeholder="${e}"
                    .size=${Lh[this.variant]}
                    aria-label="${e}"
                ></sp-search>
            </merch-search>
        `:fe}get filterAction(){return v(this,se).filter?this.sidenav?Oe`
            <sp-action-button
                id="filter"
                variant="secondary"
                treatment="outline"
                @click="${this.openFilters}"
                ><slot name="filtersText"></slot
            ></sp-action-button>
        `:fe:fe}get sortAction(){if(!v(this,se).sort)return fe;let e=jt(this,"sortText");if(!e)return;let t=jt(this,"popularityText"),i=jt(this,"alphabeticallyText");if(!(t&&i))return;let n=this.collection?.sort===ge.alphabetical;return Oe`
            <sp-action-menu
                id="sort"
                size="m"
                @change="${this.collection?.sortChanged}"
                selects="single"
                value="${n?ge.alphabetical:ge.authored}"
            >
                <span slot="label-only"
                    >${e}:
                    ${n?i:t}</span
                >
                <sp-menu-item value="${ge.authored}"
                    >${t}</sp-menu-item
                >
                <sp-menu-item value="${ge.alphabetical}"
                    >${i}</sp-menu-item
                >
            </sp-action-menu>
        `}get resultSlotName(){let e=`${this.search?"search":"filters"}${this.isMobile||this.isTablet?"Mobile":""}`;return Sh[e][Math.min(this.resultCount,2)]}get resultLabel(){if(!v(this,se).result)return fe;if(!this.sidenav)return fe;let e=this.search?"search":"filter",t=this.resultCount?this.resultCount===1?"single":"multiple":"none";return Oe` <div
            id="result"
            aria-live="polite"
            type=${e}
            quantity=${t}
        >
            <slot name="${this.resultSlotName}"></slot>
        </div>`}get customArea(){if(!v(this,se).custom)return fe;let e=v(this,Ht)?.getCollectionOptions(this.collection?.variant)?.customHeaderArea;if(!e)return fe;let t=e(this.collection);return!t||t===fe?fe:Oe`<div id="custom" role="heading" aria-level="2">
            ${t}
        </div>`}openFilters(e){this.sidenav.showModal(e)}updateLiterals(e){Object.keys(e.detail).forEach(t=>{Ch(this,t,e.detail[t])}),this.requestUpdate()}handleSidenavAttached(){this.requestUpdate()}render(){return Oe`
            <sp-theme color="light" scale="medium">
                <div id="header">
                    ${this.searchAction}${this.filterAction}${this.sortAction}${this.resultLabel}${this.customArea}
                </div>
            </sp-theme>
        `}get placeholderKeys(){return["searchText","filtersText","sortText","popularityText","alphabeticallyText","noResultText","resultText","resultsText","resultMobileText","resultsMobileText","noSearchResultsText","searchResultText","searchResultsText","noSearchResultsMobileText","searchResultMobileText","searchResultsMobileText"]}};se=new WeakMap,Ht=new WeakMap,m(br,"styles",Ks`
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
        @media screen and ${Ws(S)} {
            :host {
                --merch-card-collection-header-max-width: auto;
                --merch-card-collection-header-columns: 1fr fit-content(100%)
                    fit-content(100%);
                --merch-card-collection-header-areas: 'search filter sort'
                    'result result result';
            }
        }

        /* Laptop */
        @media screen and ${Ws(L)} {
            :host {
                --merch-card-collection-header-columns: 1fr fit-content(100%);
                --merch-card-collection-header-areas: 'result sort';
                --merch-card-collection-header-result-font-size: inherit;
            }
        }
    `);customElements.define("merch-card-collection-header",br);export{$t as MerchCardCollection,br as default};
