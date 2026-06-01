var mi=Object.defineProperty;var ui=e=>{throw TypeError(e)};var ls=(e,r,t)=>r in e?mi(e,r,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[r]=t;var ds=(e,r)=>{for(var t in r)mi(e,t,{get:r[t],enumerable:!0})};var g=(e,r,t)=>ls(e,typeof r!="symbol"?r+"":r,t),Ir=(e,r,t)=>r.has(e)||ui("Cannot "+t);var x=(e,r,t)=>(Ir(e,r,"read from private field"),t?t.call(e):r.get(e)),D=(e,r,t)=>r.has(e)?ui("Cannot add the same private member more than once"):r instanceof WeakSet?r.add(e):r.set(e,t),M=(e,r,t,a)=>(Ir(e,r,"write to private field"),a?a.call(e,t):r.set(e,t),t),fe=(e,r,t)=>(Ir(e,r,"access private method"),t);import{html as ke,LitElement as Qo,css as Jo,unsafeCSS as Zo,nothing as ge}from"./lit-all.min.js";var z="(max-width: 767px)",X="(max-width: 1199px)",O="(min-width: 768px)",C="(min-width: 1200px)",Z="(min-width: 1600px)",gi="(min-width: 1280px)",fi={matchMobile:window.matchMedia(z),matchDesktop:window.matchMedia(`${C} and (not ${Z})`),matchDesktopOrUp:window.matchMedia(C),matchLargeDesktop:window.matchMedia(Z),get isMobile(){return this.matchMobile.matches},get isDesktop(){return this.matchDesktop.matches},get isDesktopOrUp(){return this.matchDesktopOrUp.matches}},_=fi;function er(){return fi.isDesktop}var Ct=class{constructor(r,t){this.key=Symbol("match-media-key"),this.matches=!1,this.host=r,this.host.addController(this),this.media=window.matchMedia(t),this.matches=this.media.matches,this.onChange=this.onChange.bind(this),r.addController(this)}hostConnected(){var r;(r=this.media)==null||r.addEventListener("change",this.onChange)}hostDisconnected(){var r;(r=this.media)==null||r.removeEventListener("change",this.onChange)}onChange(r){this.matches!==r.matches&&(this.matches=r.matches,this.host.requestUpdate(this.key,!this.matches))}};var vi="hashchange";function hs(e=window.location.hash){let r=[],t=e.replace(/^#/,"").split("&");for(let a of t){let[i,n=""]=a.split("=");i&&r.push([i,decodeURIComponent(n.replace(/\+/g," "))])}return Object.fromEntries(r)}function Tt(e){let r=new URLSearchParams(window.location.hash.slice(1));Object.entries(e).forEach(([i,n])=>{n?r.set(i,n):r.delete(i)}),r.sort();let t=r.toString();if(t===window.location.hash)return;let a=window.scrollY||document.documentElement.scrollTop;window.location.hash=t,window.scrollTo(0,a)}function xi(e){let r=()=>{if(window.location.hash&&!window.location.hash.includes("="))return;let t=hs(window.location.hash);e(t)};return r(),window.addEventListener(vi,r),()=>{window.removeEventListener(vi,r)}}var ca={};ds(ca,{CLASS_NAME_FAILED:()=>jr,CLASS_NAME_HIDDEN:()=>ms,CLASS_NAME_PENDING:()=>Wr,CLASS_NAME_RESOLVED:()=>Yr,CheckoutWorkflow:()=>ks,CheckoutWorkflowStep:()=>ee,Commitment:()=>He,ERROR_MESSAGE_BAD_REQUEST:()=>Xr,ERROR_MESSAGE_MISSING_LITERALS_URL:()=>Cs,ERROR_MESSAGE_OFFER_NOT_FOUND:()=>Kr,EVENT_AEM_ERROR:()=>qr,EVENT_AEM_LOAD:()=>Gr,EVENT_MAS_ERROR:()=>Vr,EVENT_MAS_READY:()=>As,EVENT_MERCH_ADDON_AND_QUANTITY_UPDATE:()=>Es,EVENT_MERCH_CARD_ACTION_MENU_TOGGLE:()=>Br,EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED:()=>he,EVENT_MERCH_CARD_COLLECTION_SHOWMORE:()=>Ur,EVENT_MERCH_CARD_COLLECTION_SIDENAV_ATTACHED:()=>_t,EVENT_MERCH_CARD_COLLECTION_SORT:()=>Fr,EVENT_MERCH_CARD_QUANTITY_CHANGE:()=>ws,EVENT_MERCH_OFFER_READY:()=>fs,EVENT_MERCH_OFFER_SELECT_READY:()=>vs,EVENT_MERCH_QUANTITY_SELECTOR_CHANGE:()=>le,EVENT_MERCH_SEARCH_CHANGE:()=>Ss,EVENT_MERCH_SIDENAV_SELECT:()=>$r,EVENT_MERCH_STOCK_CHANGE:()=>bs,EVENT_MERCH_STORAGE_CHANGE:()=>ys,EVENT_OFFER_SELECTED:()=>xs,EVENT_TYPE_FAILED:()=>Zr,EVENT_TYPE_READY:()=>tr,EVENT_TYPE_RESOLVED:()=>tt,Env:()=>ve,FF_ANNUAL_PRICE:()=>rt,FF_DEFAULTS:()=>Se,HEADER_X_REQUEST_ID:()=>kt,LOG_NAMESPACE:()=>Qr,Landscape:()=>Le,MARK_DURATION_SUFFIX:()=>oa,MARK_START_SUFFIX:()=>na,MERCH_CARD_LOAD_TIMEOUT:()=>Dr,MODAL_TYPE_3_IN_1:()=>Be,NAMESPACE:()=>ps,PARAM_AOS_API_KEY:()=>Ts,PARAM_ENV:()=>ea,PARAM_LANDSCAPE:()=>ta,PARAM_MAS_PREVIEW:()=>Jr,PARAM_WCS_API_KEY:()=>_s,PROVIDER_ENVIRONMENT:()=>ia,SELECTOR_MAS_CHECKOUT_LINK:()=>bi,SELECTOR_MAS_ELEMENT:()=>Hr,SELECTOR_MAS_INLINE_PRICE:()=>V,SELECTOR_MAS_SP_BUTTON:()=>gs,SELECTOR_MAS_UPT_LINK:()=>yi,SORT_ORDER:()=>me,STATE_FAILED:()=>pe,STATE_PENDING:()=>Pe,STATE_RESOLVED:()=>Ee,SUPPORTED_COUNTRIES:()=>sa,TAG_NAME_SERVICE:()=>us,TEMPLATE_PRICE:()=>Ps,TEMPLATE_PRICE_ANNUAL:()=>Ms,TEMPLATE_PRICE_LEGAL:()=>ne,TEMPLATE_PRICE_STRIKETHROUGH:()=>Ls,Term:()=>ce,WCS_PROD_URL:()=>ra,WCS_STAGE_URL:()=>aa});var He=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),ce=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"}),ps="merch",Dr=2e4,ms="hidden",tr="wcms:commerce:ready",us="mas-commerce-service",V='span[is="inline-price"][data-wcs-osi]',bi='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]',gs="sp-button[data-wcs-osi]",yi='a[is="upt-link"]',Hr=`${V},${bi},${yi}`,fs="merch-offer:ready",vs="merch-offer-select:ready",Br="merch-card:action-menu-toggle",xs="merch-offer:selected",bs="merch-stock:change",ys="merch-storage:change",le="merch-quantity-selector:change",ws="merch-card-quantity:change",Es="merch-modal:addon-and-quantity-update",Ss="merch-search:change",Fr="merch-card-collection:sort",he="merch-card-collection:literals-changed",_t="merch-card-collection:sidenav-attached",Ur="merch-card-collection:showmore",$r="merch-sidenav:select",Gr="aem:load",qr="aem:error",As="mas:ready",Vr="mas:error",jr="placeholder-failed",Wr="placeholder-pending",Yr="placeholder-resolved",Xr="Bad WCS request",Kr="Commerce offer not found",Cs="Literals URL not provided",Zr="mas:failed",tt="mas:resolved",Qr="mas/commerce",Jr="mas.preview",ea="commerce.env",ta="commerce.landscape",Ts="commerce.aosKey",_s="commerce.wcsKey",ra="https://www.adobe.com/web_commerce_artifact",aa="https://www.stage.adobe.com/web_commerce_artifact_stage",pe="failed",Pe="pending",Ee="resolved",Le={DRAFT:"DRAFT",PUBLISHED:"PUBLISHED"},kt="X-Request-Id",ee=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"}),ks="UCv3",ve=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"}),ia={PRODUCTION:"PRODUCTION"},Be={TWP:"twp",D2P:"d2p",CRM:"crm"},na=":start",oa=":duration",Ps="price",Ls="price-strikethrough",Ms="annual",ne="legal",Se="mas-ff-defaults",rt="mas-ff-annual-price",me={alphabetical:"alphabetical",authored:"authored"},sa=["AE","AM","AR","AT","AU","AZ","BB","BD","BE","BG","BH","BO","BR","BS","BY","CA","CH","CL","CN","CO","CR","CY","CZ","DE","DK","DO","DZ","EC","EE","EG","ES","FI","FR","GB","GE","GH","GR","GT","HK","HN","HR","HU","ID","IE","IL","IN","IQ","IS","IT","JM","JO","JP","KE","KG","KR","KW","KZ","LA","LB","LK","LT","LU","LV","MA","MD","MO","MT","MU","MX","MY","NG","NI","NL","NO","NP","NZ","OM","PA","PE","PH","PK","PL","PR","PT","PY","QA","RO","RS","RU","SA","SE","SG","SI","SK","SV","TH","TJ","TM","TN","TR","TT","TW","TZ","UA","US","UY","UZ","VE","VN","YE","ZA"];var Rs="mas-commerce-service";var Pt=(e,r)=>e?.querySelector(`[slot="${r}"]`)?.textContent?.trim();function xe(e,r={},t=null,a=null){let i=a?document.createElement(e,{is:a}):document.createElement(e);t instanceof HTMLElement?i.appendChild(t):i.innerHTML=t;for(let[n,o]of Object.entries(r))i.setAttribute(n,o);return i}function rr(e){return`startTime:${e.startTime.toFixed(2)}|duration:${e.duration.toFixed(2)}`}function la(){return window.matchMedia("(max-width: 1024px)").matches}function Lt(){return document.getElementsByTagName(Rs)?.[0]}function Mt(e){let r=window.getComputedStyle(e);return e.offsetHeight+parseFloat(r.marginTop)+parseFloat(r.marginBottom)}import{html as ar,nothing as zs}from"./lit-all.min.js";var at,Rt=class Rt{constructor(r){g(this,"card");D(this,at);this.card=r,this.insertVariantStyle()}getContainer(){return M(this,at,x(this,at)??this.card.closest('merch-card-collection, [class*="-merch-cards"]')??this.card.parentElement),x(this,at)}insertVariantStyle(){let r=this.constructor.name;if(!Rt.styleMap[r]){Rt.styleMap[r]=!0;let t=document.createElement("style");t.innerHTML=this.getGlobalCSS(),document.head.appendChild(t)}}updateCardElementMinHeight(r,t){if(!r||this.card.heightSync===!1)return;let a=`--consonant-merch-card-${this.card.variant}-${t}-height`,i=Math.max(0,parseInt(window.getComputedStyle(r).height)||0),n=this.getContainer(),o=parseInt(n.style.getPropertyValue(a))||0;i>o&&n.style.setProperty(a,`${i}px`)}syncRowHeights(r){if(this.card.heightSync===!1)return;let t=this.getContainer();if(!t)return;let a=this.card.variant,i=Array.from(t.querySelectorAll(`merch-card[variant="${a}"]`)).filter(o=>o.variantLayout?.card?.heightSync!==!1);if(i.length===0)return;for(let{name:o}of r){let s=`--consonant-merch-card-${a}-${o}-height`;t.style.getPropertyValue(s)&&t.style.removeProperty(s)}let n=new Map;for(let o of i){let s=o.getBoundingClientRect();if(s.width<=2)continue;let l=Math.round(s.top),c=n.get(l);c||(c=[],n.set(l,c)),c.push(o)}for(let o of n.values())for(let{name:s,getElement:l}of r){let c=`--consonant-merch-card-${a}-${s}-height`,d=0,p=[];for(let m of o){m.style.removeProperty(c);let h=l(m);if(!h){p.push({card:m,height:0});continue}let u=Math.max(0,parseInt(window.getComputedStyle(h).height)||0);p.push({card:m,height:u}),u>d&&(d=u)}if(!(d<=0))for(let{card:m}of p)m.style.setProperty(c,`${d}px`)}}get legalDisplayDot(){return!0}get badge(){let r;if(!(!this.card.badgeBackgroundColor||!this.card.badgeColor||!this.card.badgeText))return this.evergreen&&(r=`border: 1px solid ${this.card.badgeBackgroundColor}; border-right: none;`),ar`
            <div
                id="badge"
                class="${this.card.variant}-badge"
                style="background-color: ${this.card.badgeBackgroundColor};
                color: ${this.card.badgeColor};
                ${r}"
            >
                ${this.card.badgeText}
            </div>
        `}get cardImage(){return ar` <div class="image">
            <slot name="bg-image"></slot>
            ${this.badge}
        </div>`}getGlobalCSS(){return""}get theme(){return document.querySelector("sp-theme")}get evergreen(){return this.card.classList.contains("intro-pricing")}get promoBottom(){return this.card.classList.contains("promo-bottom")}get headingSelector(){return'[slot="heading-xs"]'}get secureLabel(){return this.card.secureLabel?ar`<span class="secure-transaction-label"
                  >${this.card.secureLabel}</span
              >`:zs}get secureLabelFooter(){return ar`<footer>
            ${this.secureLabel}<slot name="footer"></slot>
        </footer>`}async postCardUpdateHook(){if(this.card.isConnected&&(await this.card.updateComplete,this.card.prices?.length>0)){let r=Promise.allSettled(this.card.prices.map(i=>i.onceSettled?.()||Promise.resolve())),t,a=new Promise(i=>{t=setTimeout(i,Dr)});await Promise.race([r,a]),clearTimeout(t)}}connectedCallbackHook(){}disconnectedCallbackHook(){}syncHeights(){}renderLayout(){}get aemFragmentMapping(){return ir(this.card.variant)}};at=new WeakMap,g(Rt,"styleMap",{});var T=Rt;import{html as da,css as Ns}from"./lit-all.min.js";var wi=`
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

@media screen and ${z} {
    merch-card-collection-header.catalog {
        --merch-card-collection-header-columns: min-content auto;
    }
}

@media screen and ${O} {
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
}`;var Ei={cardName:{attribute:"name"},badge:!0,ctas:{slot:"footer",size:"m"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},prices:{tag:"h3",slot:"heading-xs"},shortDescription:{tag:"div",slot:"action-menu-content",attributes:{tabindex:"0"}},size:["wide","super-wide"],title:{tag:"h3",slot:"heading-xs"}},it=class extends T{constructor(t){super(t);g(this,"dispatchActionMenuToggle",()=>{this.card.dispatchEvent(new CustomEvent(Br,{bubbles:!0,composed:!0,detail:{card:this.card.name,type:"action-menu"}}))});g(this,"toggleActionMenu",t=>{!this.actionMenuContentSlot||!t||t.type!=="click"&&t.code!=="Space"&&t.code!=="Enter"||(t.preventDefault(),t.stopPropagation(),this.setMenuVisibility(!this.isMenuOpen()))});g(this,"toggleActionMenuFromCard",t=>{let a=t?.type==="mouseleave"?!0:void 0;this.card.blur(),this.setIconVisibility(!1),this.actionMenuContentSlot&&t?.type==="mouseleave"&&this.setMenuVisibility(!1)});g(this,"showActionMenuOnHover",()=>{this.actionMenu&&this.setIconVisibility(!0)});g(this,"hideActionMenu",()=>{this.setMenuVisibility(!1),this.setIconVisibility(!1)});g(this,"hideActionMenuOnBlur",t=>{t.relatedTarget===this.actionMenu||this.actionMenu?.contains(t.relatedTarget)||this.slottedContent?.contains(t.relatedTarget)||(this.isMenuOpen()&&this.setMenuVisibility(!1),this.card.contains(t.relatedTarget)||this.setIconVisibility(!1))});g(this,"handleCardFocusOut",t=>{t.relatedTarget===this.actionMenu||this.actionMenu?.contains(t.relatedTarget)||t.relatedTarget===this.card||(this.slottedContent&&(t.target===this.slottedContent||this.slottedContent.contains(t.target))&&(this.slottedContent.contains(t.relatedTarget)||this.setMenuVisibility(!1)),!this.card.contains(t.relatedTarget)&&!this.isMenuOpen()&&this.setIconVisibility(!1))});g(this,"handleKeyDown",t=>{(t.key==="Escape"||t.key==="Esc")&&(t.preventDefault(),this.hideActionMenu(),this.actionMenu?.focus())})}get actionMenu(){return this.card.shadowRoot.querySelector(".action-menu")}get actionMenuContentSlot(){return this.card.shadowRoot.querySelector('slot[name="action-menu-content"]')}get slottedContent(){return this.card.querySelector('[slot="action-menu-content"]')}setIconVisibility(t){if(this.slottedContent){if(la()&&this.card.actionMenu)return;this.actionMenu?.classList.toggle("invisible",!t),this.actionMenu?.classList.toggle("always-visible",t)}}setMenuVisibility(t){this.actionMenuContentSlot?.classList.toggle("hidden",!t),this.setAriaExpanded(this.actionMenu,t.toString()),t&&(this.dispatchActionMenuToggle(),setTimeout(()=>{let a=this.slottedContent?.querySelector("a");a&&a.focus()},0))}isMenuOpen(){return!this.actionMenuContentSlot?.classList.contains("hidden")}renderLayout(){return da` <div class="body">
                <div class="top-section">
                    <slot name="icons"></slot> ${this.badge}
                    <div
                        class="action-menu
                ${this.slottedContent?la()&&this.card.actionMenu?"always-visible":"invisible":"hidden"}"
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
                ${this.promoBottom?"":da`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`}
                <slot name="body-xs"></slot>
                ${this.promoBottom?da`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`:""}
            </div>
            ${this.secureLabelFooter}
            <slot></slot>`}getGlobalCSS(){return wi}setAriaExpanded(t,a){t.setAttribute("aria-expanded",a)}connectedCallbackHook(){this.card.addEventListener("mouseenter",this.showActionMenuOnHover),this.card.addEventListener("mouseleave",this.toggleActionMenuFromCard),this.card.addEventListener("focusin",this.showActionMenuOnHover),this.card.addEventListener("focusout",this.handleCardFocusOut),this.card.addEventListener("keydown",this.handleKeyDown)}disconnectedCallbackHook(){this.card.removeEventListener("mouseenter",this.showActionMenuOnHover),this.card.removeEventListener("mouseleave",this.toggleActionMenuFromCard),this.card.removeEventListener("focusin",this.showActionMenuOnHover),this.card.removeEventListener("focusout",this.handleCardFocusOut),this.card.removeEventListener("keydown",this.handleKeyDown)}};g(it,"variantStyle",Ns`
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
    `);import{html as zt,css as Os}from"./lit-all.min.js";var Si=`
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

@media screen and ${O} {
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
`;var Ai={cardName:{attribute:"name"},badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},badgeIcon:!0,borderColor:{attribute:"border-color"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],ctas:{slot:"footer",size:"m"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},prices:{tag:"h3",slot:"heading-xs"},promoText:{tag:"p",slot:"promo-text"},size:["wide","super-wide"],title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"body-xxs"},backgroundImage:{tag:"div",slot:"bg-image"}},Fe=class extends T{constructor(r){super(r)}getGlobalCSS(){return Si}renderLayout(){return zt`<div class="image">
                <slot name="bg-image"></slot>
                <slot name="badge"></slot>
            </div>
            <div class="body">
                <slot name="icons"></slot>
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${this.promoBottom?zt`<slot name="body-xs"></slot
                          ><slot name="promo-text"></slot>`:zt`<slot name="promo-text"></slot
                          ><slot name="body-xs"></slot>`}
            </div>
            ${this.evergreen?zt`
                      <div
                          class="detail-bg-container"
                          style="background: ${this.card.detailBg}"
                      >
                          <slot name="detail-bg"></slot>
                      </div>
                  `:zt`
                      <hr />
                      ${this.secureLabelFooter}
                  `}`}};g(Fe,"variantStyle",Os`
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
    `);import{html as Ti}from"./lit-all.min.js";var Ci=`
:root {
  --consonant-merch-card-inline-heading-width: 300px;
}

.one-merch-card.inline-heading,
.two-merch-cards.inline-heading,
.three-merch-cards.inline-heading,
.four-merch-cards.inline-heading {
    grid-template-columns: var(--consonant-merch-card-inline-heading-width);
}

@media screen and ${O} {
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

@media screen and ${Z} {
  .four-merch-cards.inline-heading {
      grid-template-columns: repeat(4, var(--consonant-merch-card-inline-heading-width));
  }
}
`;var nr=class extends T{constructor(r){super(r)}getGlobalCSS(){return Ci}renderLayout(){return Ti` ${this.badge}
            <div class="body">
                <div class="top-section">
                    <slot name="icons"></slot>
                    <slot name="heading-xs"></slot>
                </div>
                <slot name="body-xs"></slot>
            </div>
            ${this.card.customHr?"":Ti`<hr />`} ${this.secureLabelFooter}`}};import{html as Me,css as Is,unsafeCSS as ki}from"./lit-all.min.js";var _i=`
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
@media screen and ${z} {
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

@media screen and ${X} {
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
@media screen and ${O} {
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
}

@media screen and ${Z} {
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
`;var Ds=32,Pi={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m-price"},promoText:{tag:"div",slot:"promo-text"},shortDescription:{tag:"div",slot:"body-xxs"},description:{tag:"div",slot:"body-m"},mnemonics:{size:"l"},quantitySelect:{tag:"div",slot:"quantity-select"},callout:{tag:"div",slot:"callout-content"},addon:!0,secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],whatsIncludedDividerColor:{attribute:"whats-included-divider-color"},allowedWhatsIncludedDividerColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],whatsIncluded:{tag:"div",slot:"footer-rows"},ctas:{slot:"footer",size:"l"},style:"consonant"},nt=class extends T{constructor(t){super(t);g(this,"getRowMinHeightPropertyName",t=>`--consonant-merch-card-footer-row-${t}-min-height`);g(this,"getMiniCompareFooter",()=>{let t=this.card.secureLabel?Me`<slot name="secure-transaction-label">
                  <span class="secure-transaction-label"
                      >${this.card.secureLabel}</span
                  ></slot
              >`:Me`<slot name="secure-transaction-label"></slot>`;return this.isNewVariant?Me`<footer>
                ${t}
                <p class="action-area"><slot name="footer"></slot></p>
            </footer>`:Me`<footer>${t}<slot name="footer"></slot></footer>`});this.updatePriceQuantity=this.updatePriceQuantity.bind(this)}connectedCallbackHook(){this.card.addEventListener(le,this.updatePriceQuantity),this.visibilityObserver=new IntersectionObserver(([t])=>{t.boundingClientRect.height!==0&&t.isIntersecting&&(_.isMobile||requestAnimationFrame(()=>{let a=this.getContainer();if(!a)return;a.querySelectorAll('merch-card[variant="mini-compare-chart"]').forEach(n=>n.variantLayout?.syncHeights?.())}),this.visibilityObserver.disconnect())}),this.visibilityObserver.observe(this.card)}disconnectedCallbackHook(){if(this.card.removeEventListener(le,this.updatePriceQuantity),this.visibilityObserver?.disconnect(),this.legalElement&&this.legalResolvedHandler&&(this.legalElement.removeEventListener(tt,this.legalResolvedHandler),this.legalResolvedHandler=null,this.legalElement=null),this.calloutListenersAdded){document.removeEventListener("touchstart",this.handleCalloutTouch),document.removeEventListener("mouseover",this.handleCalloutMouse);let t=this.card.querySelector('[slot="callout-content"] .icon-button');t?.removeEventListener("focusin",this.handleCalloutFocusin),t?.removeEventListener("focusout",this.handleCalloutFocusout),t?.removeEventListener("keydown",this.handleCalloutKeydown),this.calloutListenersAdded=!1}}updatePriceQuantity({detail:t}){!this.mainPrice||!t?.option||(this.mainPrice.dataset.quantity=t.option)}priceOptionsProvider(t,a){if(this.isNewVariant){if(t.dataset.template===ne){a.displayPlanType=this.card?.settings?.displayPlanType??!1;return}(t.dataset.template==="strikethrough"||t.dataset.template==="price")&&(a.displayPerUnit=!1)}}getGlobalCSS(){return _i}adjustMiniCompareBodySlots(){if(this.card.getBoundingClientRect().width<=2)return;this.updateCardElementMinHeight(this.card.shadowRoot.querySelector(".top-section"),"top-section");let t=["heading-m","subtitle","body-m","heading-m-price","body-xxs","price-commitment","quantity-select","offers","promo-text","callout-content","addon"];this.card.classList.contains("bullet-list")&&t.push("footer-rows"),t.forEach(i=>this.updateCardElementMinHeight(this.card.shadowRoot.querySelector(`slot[name="${i}"]`),i)),this.updateCardElementMinHeight(this.card.shadowRoot.querySelector("footer"),"footer"),this.card.shadowRoot.querySelector(".mini-compare-chart-badge")?.textContent!==""&&this.getContainer().style.setProperty("--consonant-merch-card-mini-compare-chart-top-section-mobile-height","32px")}adjustMiniCompareFooterRows(){if(this.card.getBoundingClientRect().width===0)return;let t;if(this.isNewVariant){let a=this.card.querySelector("merch-whats-included");if(!a)return;t=[...a.querySelectorAll('[slot="content"] merch-mnemonic-list')]}else{let a=this.card.querySelector('[slot="footer-rows"] ul');if(!a||!a.children)return;t=[...a.children]}t.length&&t.forEach((a,i)=>{let n=Math.max(Ds,parseFloat(window.getComputedStyle(a).height)||0),o=parseFloat(this.getContainer().style.getPropertyValue(this.getRowMinHeightPropertyName(i+1)))||0;n>o&&this.getContainer().style.setProperty(this.getRowMinHeightPropertyName(i+1),`${n}px`)})}removeEmptyRows(){this.isNewVariant?this.card.querySelectorAll('merch-whats-included [slot="content"] merch-mnemonic-list').forEach(a=>{if(a.hasAttribute("data-placeholder"))return;let i=a.querySelector('[slot="icon"]'),n=!!i?.querySelector(".sp-icon")||!!i?.querySelector('merch-icon[src]:not([src=""]), img[src]:not([src=""])'),s=a.querySelector('[slot="description"]')?.textContent?.replace(/\u00a0/g," ")?.trim()??"";!n&&!s&&a.remove()}):this.card.querySelectorAll(".footer-row-cell").forEach(a=>{if(a.hasAttribute("data-placeholder"))return;let i=a.querySelector(".footer-row-cell-description");i&&!i.textContent.trim()&&a.remove()})}padFooterRows(){let t=this.getContainer();if(!t)return;let a=t.querySelectorAll('merch-card[variant="mini-compare-chart"]');if(this.isNewVariant){let i=0;if(a.forEach(c=>{let d=c.querySelector("merch-whats-included");if(!d)return;let p=d.querySelectorAll('[slot="content"] merch-mnemonic-list:not([data-placeholder])');i=Math.max(i,p.length)}),i===0)return;let n=this.card.querySelector("merch-whats-included");if(!n)return;let o=n.querySelector('[slot="content"]');if(!o)return;o.querySelectorAll("merch-mnemonic-list[data-placeholder]").forEach(c=>c.remove());let s=o.querySelectorAll("merch-mnemonic-list").length,l=i-s;for(let c=0;c<l;c++){let d=document.createElement("merch-mnemonic-list");d.setAttribute("data-placeholder","");let p=document.createElement("div");p.setAttribute("slot","icon");let m=document.createElement("div");m.setAttribute("slot","description"),d.append(p,m),o.appendChild(d)}}else{let i=0;if(a.forEach(l=>{let c=l.querySelector('[slot="footer-rows"] ul');if(!c)return;let d=c.querySelectorAll("li.footer-row-cell:not([data-placeholder])");i=Math.max(i,d.length)}),i===0)return;let n=this.card.querySelector('[slot="footer-rows"] ul');if(!n)return;n.querySelectorAll("li.footer-row-cell[data-placeholder]").forEach(l=>l.remove());let o=n.querySelectorAll("li.footer-row-cell").length,s=i-o;for(let l=0;l<s;l++){let c=document.createElement("li");c.className="footer-row-cell",c.setAttribute("data-placeholder",""),n.appendChild(c)}}}get mainPrice(){return this.card.querySelector(`[slot="heading-m-price"] ${V}[data-template="price"]`)}get headingMPriceSlot(){return this.card.shadowRoot.querySelector('slot[name="heading-m-price"]')?.assignedElements()[0]}get isNewVariant(){return!!this.card.querySelector("merch-whats-included")}toggleAddon(t){let a=this.mainPrice,i=this.headingMPriceSlot;if(!a&&i){let n=t?.getAttribute("plan-type"),o=null;if(t&&n&&(o=t.querySelector(`p[data-plan-type="${n}"]`)?.querySelector('span[is="inline-price"]')),this.card.querySelectorAll('p[slot="heading-m-price"]').forEach(s=>s.remove()),t.checked){if(o){let s=xe("p",{class:"addon-heading-m-price-addon",slot:"heading-m-price"},o.innerHTML);this.card.appendChild(s)}}else{let s=xe("p",{class:"card-heading",id:"free",slot:"heading-m-price"},"Free");this.card.appendChild(s)}}}showTooltip(t){t.classList.remove("hide-tooltip"),t.setAttribute("aria-expanded","true")}hideTooltip(t){t.classList.add("hide-tooltip"),t.setAttribute("aria-expanded","false")}adjustCallout(){let t=this.card.querySelector('[slot="callout-content"] .icon-button');if(!t||this.calloutListenersAdded)return;let a=t.title||t.dataset.tooltip;if(!a)return;t.title&&(t.dataset.tooltip=t.title,t.removeAttribute("title"));let i=t.parentElement;if(i&&i.tagName==="P"){let n=document.createElement("div"),o=document.createElement("div");o.className="callout-row";let s=document.createElement("div");for(s.className="callout-text";i.firstChild&&i.firstChild!==t;)s.appendChild(i.firstChild);o.appendChild(s),o.appendChild(t),n.appendChild(o),i.replaceWith(n)}t.setAttribute("role","button"),t.setAttribute("tabindex","0"),t.setAttribute("aria-label",a),t.setAttribute("aria-expanded","false"),this.hideTooltip(t),this.handleCalloutTouch=n=>{n.target!==t?this.hideTooltip(t):t.classList.contains("hide-tooltip")?this.showTooltip(t):this.hideTooltip(t)},this.handleCalloutMouse=n=>{n.target!==t?this.hideTooltip(t):this.showTooltip(t)},this.handleCalloutFocusin=()=>{this.showTooltip(t)},this.handleCalloutFocusout=()=>{this.hideTooltip(t)},this.handleCalloutKeydown=n=>{n.key==="Escape"&&(this.hideTooltip(t),t.blur())},document.addEventListener("touchstart",this.handleCalloutTouch),document.addEventListener("mouseover",this.handleCalloutMouse),t.addEventListener("focusin",this.handleCalloutFocusin),t.addEventListener("focusout",this.handleCalloutFocusout),t.addEventListener("keydown",this.handleCalloutKeydown),this.calloutListenersAdded=!0}async adjustAddon(){await this.card.updateComplete;let t=this.card.addon;if(!t)return;let a=this.mainPrice,i=this.card.planType;if(a&&(await a.onceSettled(),i=a.value?.[0]?.planType),!i)return;t.planType=i,this.card.querySelector("merch-addon[plan-type]")?.updateComplete.then(()=>{this.updateCardElementMinHeight(this.card.shadowRoot.querySelector('slot[name="addon"]'),"addon")})}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let t=this.mainPrice;if(!t)return;let a=t.cloneNode(!0);if(await t.onceSettled(),!t?.options)return;t.options.displayPerUnit&&(t.dataset.displayPerUnit="false"),t.options.displayTax&&(t.dataset.displayTax="false"),t.options.displayPlanType&&(t.dataset.displayPlanType="false"),a.setAttribute("data-template","legal"),t.parentNode.insertBefore(a,t.nextSibling),await a.onceSettled(),this.legalResolvedHandler||(this.legalResolvedHandler=()=>this.adjustShortDescription(),a.addEventListener(tt,this.legalResolvedHandler),this.legalElement=a)}catch{}}adjustShortDescription(){if(!this.shortDescriptionSource){let o=this.card.querySelector('[slot="body-xxs"]');if(!o)return;this.shortDescriptionSource=o,o.remove()}let t=this.shortDescriptionSource.textContent?.trim();if(!t)return;let i=this.card.querySelector('[slot="heading-m-price"] [data-template="legal"]')?.querySelector(".price-plan-type");if(!i||i.querySelector("em"))return;let n=document.createElement("em");n.textContent=` ${t}`,i.appendChild(n)}renderLayout(){return this.isNewVariant?Me` <div class="top-section${this.badge?" badge":""}">
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
            <slot name="footer-rows"><slot name="body-s"></slot></slot>`:Me` <div class="top-section${this.badge?" badge":""}">
                    <slot name="icons"></slot> ${this.badge}
                </div>
                <slot name="heading-m"></slot>
                ${this.card.classList.contains("bullet-list")?Me`<slot name="heading-m-price"></slot>
                          <slot name="price-commitment"></slot>
                          <slot name="body-xxs"></slot>
                          <slot name="promo-text"></slot>
                          <slot name="body-m"></slot>
                          <slot name="offers"></slot>`:Me`<slot name="body-m"></slot>
                          <slot name="heading-m-price"></slot>
                          <slot name="body-xxs"></slot>
                          <slot name="price-commitment"></slot>
                          <slot name="offers"></slot>
                          <slot name="promo-text"></slot> `}
                <slot name="callout-content"></slot>
                <slot name="addon"></slot>
                ${this.getMiniCompareFooter()}
                <slot name="footer-rows"><slot name="body-s"></slot></slot>`}syncHeights(){this.card.getBoundingClientRect().width<=2||(this.adjustMiniCompareBodySlots(),this.adjustMiniCompareFooterRows())}async postCardUpdateHook(){if(await super.postCardUpdateHook(),this.isNewVariant&&(this.legalAdjusted||await this.adjustLegal(),this.adjustShortDescription(),this.adjustCallout()),await this.adjustAddon(),this.isNewVariant&&this.removeEmptyRows(),_.isMobile)this.isNewVariant||this.removeEmptyRows();else{this.padFooterRows();let t=this.getContainer();if(!t)return;let a=t.style.getPropertyValue("--consonant-merch-card-footer-row-1-min-height");requestAnimationFrame(a?()=>{this.syncHeights()}:()=>{t.querySelectorAll('merch-card[variant="mini-compare-chart"]').forEach(n=>n.variantLayout?.syncHeights?.())})}}};g(nt,"variantStyle",Is`
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

        @media screen and ${ki(X)} {
            [class*'-merch-cards']
                :host([variant='mini-compare-chart'])
                footer {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
        }

        @media screen and ${ki(C)} {
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
    `);import{html as or,css as Hs,unsafeCSS as Mi,nothing as Bs}from"./lit-all.min.js";var Li=`
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
@media screen and ${z} {
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

@media screen and ${X} {
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
@media screen and ${O} {
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

  /* Card fills the wider column in sparse layouts (one/two cards) */
  .one-merch-card.mini-compare-chart-mweb merch-card[variant="mini-compare-chart-mweb"],
  .one-merch-card:has(merch-card[variant="mini-compare-chart-mweb"]) merch-card[variant="mini-compare-chart-mweb"],
  .two-merch-cards.mini-compare-chart-mweb merch-card[variant="mini-compare-chart-mweb"],
  .two-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) merch-card[variant="mini-compare-chart-mweb"] {
    max-width: var(--consonant-merch-card-mini-compare-chart-mweb-wide-width);
  }
}

@media screen and ${Z} {
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
`;var Fs=32,Ri={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m-price"},promoText:{tag:"div",slot:"promo-text"},shortDescription:{tag:"div",slot:"body-m"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],ctas:{slot:"footer",size:"l"},style:"consonant"},ot=class extends T{constructor(t){super(t);g(this,"getRowMinHeightPropertyName",t=>`--consonant-merch-card-footer-row-${t}-min-height`);g(this,"getMiniCompareFooter",()=>or` <footer>
            <slot name="secure-transaction-label">
                <span class="secure-transaction-label-text"
                    >${this.secureLabel}</span
                >
            </slot>
            <p class="action-area">
                <slot name="footer"></slot>
            </p>
        </footer>`);g(this,"getMiniCompareFooterRows",()=>or` <div class="footer-rows-container">
            <slot name="body-xs"></slot>
            <slot name="footer-rows"></slot>
        </div>`);this.updatePriceQuantity=this.updatePriceQuantity.bind(this)}connectedCallbackHook(){this.card.addEventListener(le,this.updatePriceQuantity)}disconnectedCallbackHook(){this.card.removeEventListener(le,this.updatePriceQuantity),this._syncObserver?.disconnect(),this._syncObserver=null}updatePriceQuantity({detail:t}){!this.mainPrice||!t?.option||(this.mainPrice.dataset.quantity=t.option)}priceOptionsProvider(t,a){if(t.dataset.template===ne){a.displayPlanType=this.card?.settings?.displayPlanType??!1;return}(t.dataset.template==="strikethrough"||t.dataset.template==="price")&&(a.displayPerUnit=!1)}getGlobalCSS(){return Li}adjustMiniCompareBodySlots(){if(this.card.getBoundingClientRect().width<=2){this._syncObserver||(this._syncObserver=new ResizeObserver(()=>{this.card.getBoundingClientRect().width>2&&(this._syncObserver?.disconnect(),this._syncObserver=null,this.adjustMiniCompareBodySlots(),this.adjustMiniCompareFooterRows())}),this._syncObserver.observe(this.card));return}["heading-xs","subtitle","heading-m-price","promo-text","body-m","body-xs","footer-rows"].forEach(a=>{let n=this.card.querySelector(`[slot="${a}"]`)??this.card.shadowRoot.querySelector(`slot[name="${a}"]`);this.updateCardElementMinHeight(n,a)}),this.updateCardElementMinHeight(this.card.shadowRoot.querySelector('slot[name="promo-text"]'),"promo-text"),this.updateCardElementMinHeight(this.card.shadowRoot.querySelector("footer"),"footer")}adjustMiniCompareFooterRows(){if(this.card.getBoundingClientRect().width===0)return;let t=this.card.querySelector('[slot="footer-rows"] ul');!t||!t.children||[...t.children].forEach((a,i)=>{let n=Math.max(Fs,parseFloat(window.getComputedStyle(a).height)||0),o=parseFloat(this.getContainer().style.getPropertyValue(this.getRowMinHeightPropertyName(i+1)))||0;n>o&&this.getContainer().style.setProperty(this.getRowMinHeightPropertyName(i+1),`${n}px`)})}removeEmptyRows(){this.card.querySelectorAll(".footer-row-cell").forEach(a=>{let i=a.querySelector(".footer-row-cell-description");i&&!i.textContent.trim()&&a.remove()})}setupToggle(){if(this.toggleSetupDone)return;let t=this.card.querySelector('[slot="body-xs"]');if(!t)return;let a=t.querySelector("p"),i=t.querySelector("ul");if(!a||!i||t.querySelector(".footer-rows-title"))return;this.toggleSetupDone=!0;let n=a.textContent.trim(),o=this.card.querySelector("h3")?.id,s=o?`${o}-list`:`mweb-list-${Date.now()}`;i.setAttribute("id",s),i.classList.add("checkmark-copy-container");let l=xe("div",{class:"footer-rows-title"},n);if(_.isMobile){let c=xe("button",{class:"toggle-icon","aria-label":n,"aria-expanded":"false","aria-controls":s});l.appendChild(c),l.addEventListener("click",()=>{let d=i.classList.toggle("open");c.classList.toggle("expanded",d),c.setAttribute("aria-expanded",String(d))})}else i.classList.add("open");a.replaceWith(l)}get legalDisplayDot(){return!1}get mainPrice(){return this.card.querySelector(`[slot="heading-m-price"] ${V}[data-template="price"]`)}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let t=this.mainPrice;if(!t)return;let a=t.cloneNode(!0);if(await t.onceSettled(),!t?.options)return;t.options.displayPerUnit&&(t.dataset.displayPerUnit="false"),t.options.displayTax&&(t.dataset.displayTax="false"),t.options.displayPlanType&&(t.dataset.displayPlanType="false"),a.setAttribute("data-template","legal"),t.parentNode.insertBefore(a,t.nextSibling),await a.onceSettled()}catch{}}get icons(){return!this.card.querySelector('[slot="icons"]')&&!this.card.getAttribute("id")?Bs:or`<slot name="icons"></slot>`}renderLayout(){return or`
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
        `}async postCardUpdateHook(){if(await super.postCardUpdateHook(),this.legalAdjusted||await this.adjustLegal(),this.setupToggle(),_.isMobile)this.removeEmptyRows();else{this.adjustMiniCompareFooterRows();let t=this.getContainer();if(!t)return;requestAnimationFrame(()=>{t.querySelectorAll('merch-card[variant="mini-compare-chart-mweb"]').forEach(i=>{i.variantLayout?.adjustMiniCompareBodySlots?.(),i.variantLayout?.adjustMiniCompareFooterRows?.()})})}}};g(ot,"variantStyle",Hs`
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

        @media screen and ${Mi(X)} {
            [class*'-merch-cards']
                :host([variant='mini-compare-chart-mweb'])
                footer {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
        }

        @media screen and ${Mi(C)} {
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
    `);import{html as Nt,css as Us,nothing as sr}from"./lit-all.min.js";var zi=`
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
@media screen and ${z} {
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
@media screen and ${O} {
    :root {
        --consonant-merch-card-plans-students-width: 486px;
    }

    .four-merch-cards.plans .foreground {
        max-width: unset;
    }
}

@media screen and ${X} {
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
@media screen and ${Z} {
    .columns .four-merch-cards.plans {
        grid-template-columns: repeat(2, var(--consonant-merch-card-plans-width));
    }

    merch-sidenav.plans {
        --merch-sidenav-collection-gap: 54px;
    }
}
`;var cr={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},addon:!0,secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],whatsIncluded:{tag:"div",slot:"whats-included"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},Ni={...function(){let{whatsIncluded:e,size:r,...t}=cr;return t}(),title:{tag:"h3",slot:"heading-s"},secureLabel:!1},Oi={...function(){let{subtitle:e,whatsIncluded:r,size:t,quantitySelect:a,...i}=cr;return i}()},be,ye,te=class extends T{constructor(t){super(t);D(this,be);D(this,ye);this.adaptForMedia=this.adaptForMedia.bind(this)}priceOptionsProvider(t,a){t.dataset.template===ne&&(a.displayPlanType=this.card?.settings?.displayPlanType??!1)}getGlobalCSS(){return zi}adjustSlotPlacement(t,a,i){let n=this.card.shadowRoot,o=n.querySelector("footer"),s=this.card.getAttribute("size");if(!s)return;let l=n.querySelector(`footer slot[name="${t}"]`),c=n.querySelector(`.body slot[name="${t}"]`),d=n.querySelector(".body");if(s.includes("wide")||(o?.classList.remove("wide-footer"),l&&l.remove()),!!a.includes(s)){if(o?.classList.toggle("wide-footer",_.isDesktopOrUp),!i&&l){if(c)l.remove();else{let p=d.querySelector(`[data-placeholder-for="${t}"]`);p?p.replaceWith(l):d.appendChild(l)}return}if(i&&c){let p=document.createElement("div");if(p.setAttribute("data-placeholder-for",t),p.classList.add("slot-placeholder"),!l){let m=c.cloneNode(!0);o.prepend(m)}c.replaceWith(p)}}}adaptForMedia(){if(!this.card.closest("merch-card-collection,overlay-trigger,.two-merch-cards,.three-merch-cards,.four-merch-cards, .columns")){this.card.removeAttribute("size");return}this.adjustSlotPlacement("addon",["super-wide"],_.isDesktopOrUp),this.adjustSlotPlacement("callout-content",["super-wide"],_.isDesktopOrUp)}adjustCallout(){let t=this.card.querySelector('[slot="callout-content"] .icon-button');t&&t.title&&(t.dataset.tooltip=t.title,t.removeAttribute("title"),t.classList.add("hide-tooltip"),document.addEventListener("touchstart",a=>{a.preventDefault(),a.target!==t?t.classList.add("hide-tooltip"):a.target.classList.toggle("hide-tooltip")}),document.addEventListener("mouseover",a=>{a.preventDefault(),a.target!==t?t.classList.add("hide-tooltip"):a.target.classList.remove("hide-tooltip")}))}syncHeights(){if(this.card.getBoundingClientRect().width<=2){x(this,be)||(M(this,be,new ResizeObserver(()=>{this.card.getBoundingClientRect().width>2&&(x(this,be)?.disconnect(),M(this,be,null),this.syncHeights())})),x(this,be).observe(this.card));return}let t=["heading-xs","subtitle","heading-m","promo-text","body-xs"];this.syncRowHeights(t.map(a=>({name:a,getElement:i=>i.querySelector(`[slot="${a}"]`)})))}async adjustEduLists(){if(this.card.variant!=="plans-education"||this.card.querySelector(".spacer"))return;let a=this.card.querySelector('[slot="body-xs"]');if(!a)return;let i=a.querySelector("ul");if(!i)return;let n=i.previousElementSibling,o=document.createElement("div");o.classList.add("spacer"),a.insertBefore(o,n);let s=new IntersectionObserver(([l])=>{if(l.boundingClientRect.height===0)return;let c=0,d=this.card.querySelector('[slot="heading-s"]');d&&(c+=Mt(d));let p=this.card.querySelector('[slot="subtitle"]');p&&(c+=Mt(p));let m=this.card.querySelector('[slot="heading-m"]');m&&(c+=8+Mt(m));for(let u of a.childNodes){if(u.classList.contains("spacer"))break;c+=Mt(u)}let h=this.card.parentElement.style.getPropertyValue("--merch-card-plans-edu-list-max-offset");c>(parseFloat(h)||0)&&this.card.parentElement.style.setProperty("--merch-card-plans-edu-list-max-offset",`${c}px`),this.card.style.setProperty("--merch-card-plans-edu-list-offset",`${c}px`),s.disconnect()});s.observe(this.card)}async postCardUpdateHook(){this.adaptForMedia(),this.adjustAddon(),this.adjustCallout(),this.legalAdjusted||(await this.adjustLegal(),await this.adjustEduLists()),await super.postCardUpdateHook(),window.matchMedia("(min-width: 768px)").matches&&requestAnimationFrame(()=>{this.syncHeights()})}get headingM(){return this.card.querySelector('[slot="heading-m"]')}get mainPrice(){return this.headingM?.querySelector(`${V}[data-template="price"]`)}get divider(){return this.card.variant==="plans-education"?Nt`<div class="divider"></div>`:sr}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let t=[],a=this.card.querySelector(`[slot="heading-m"] ${V}[data-template="price"]`);a&&t.push(a);let i=t.map(async n=>{let o=n.cloneNode(!0);await n.onceSettled(),n?.options&&(n.options.displayPerUnit&&(n.dataset.displayPerUnit="false"),n.options.displayTax&&(n.dataset.displayTax="false"),n.options.displayPlanType&&(n.dataset.displayPlanType="false"),o.setAttribute("data-template","legal"),n.parentNode.insertBefore(o,n.nextSibling),await o.onceSettled())});await Promise.all(i)}catch{}}async adjustAddon(){await this.card.updateComplete;let t=this.card.addon;if(!t)return;t.setAttribute("custom-checkbox","");let a=this.mainPrice;if(!a)return;await a.onceSettled();let i=a.value?.[0]?.planType;i&&(t.planType=i)}get stockCheckbox(){return this.card.checkboxLabel?Nt`<label id="stock-checkbox">
                <input type="checkbox" @change=${this.card.toggleStockOffer}></input>
                <span></span>
                ${this.card.checkboxLabel}
            </label>`:sr}get icons(){return!this.card.querySelector('[slot="icons"]')&&!this.card.getAttribute("id")?sr:Nt`<slot name="icons"></slot>`}connectedCallbackHook(){_.matchMobile.addEventListener("change",this.adaptForMedia),_.matchDesktopOrUp.addEventListener("change",this.adaptForMedia),this.handleResize=()=>{x(this,ye)&&cancelAnimationFrame(x(this,ye)),M(this,ye,requestAnimationFrame(()=>{M(this,ye,null),window.matchMedia("(min-width: 768px)").matches&&this.syncHeights()}))},window.addEventListener("resize",this.handleResize)}disconnectedCallbackHook(){_.matchMobile.removeEventListener("change",this.adaptForMedia),_.matchDesktopOrUp.removeEventListener("change",this.adaptForMedia),x(this,be)?.disconnect(),M(this,be,null),this.handleResize&&(window.removeEventListener("resize",this.handleResize),this.handleResize=null),x(this,ye)&&(cancelAnimationFrame(x(this,ye)),M(this,ye,null))}renderLayout(){return Nt` ${this.badge}
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
            <slot></slot>`}};be=new WeakMap,ye=new WeakMap,g(te,"variantStyle",Us`
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
    `),g(te,"collectionOptions",{customHeaderArea:t=>t.sidenav?Nt`<slot name="resultsText"></slot>`:sr,headerVisibility:{search:!1,sort:!1,result:["mobile","tablet"],custom:["desktop"]},onSidenavAttached:t=>{let a=()=>{let i=t.querySelectorAll("merch-card");for(let o of i)o.hasAttribute("data-size")&&(o.setAttribute("size",o.getAttribute("data-size")),o.removeAttribute("data-size"));if(!_.isDesktop)return;let n=0;for(let o of i){if(o.style.display==="none")continue;let s=o.getAttribute("size"),l=s==="wide"?2:s==="super-wide"?3:1;l===2&&n%3===2&&(o.setAttribute("data-size",s),o.removeAttribute("size"),l=1),n+=l}};_.matchDesktop.addEventListener("change",a),t.addEventListener(he,a),t.onUnmount.push(()=>{_.matchDesktop.removeEventListener("change",a),t.removeEventListener(he,a)})}});import{html as Ae,css as $s,unsafeCSS as Di,nothing as lr}from"./lit-all.min.js";var Ii=`
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
@media ${z} {
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
@media ${z} {
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

@media screen and ${z}, ${X} {
    :root {
        --consonant-merch-card-plans-v2-width: 100%;
    }
    merch-card[variant="plans-v2"] {
        width: 100%;
        max-width: var(--consonant-merch-card-plans-v2-width);
        box-sizing: border-box;
    }
}

@media screen and ${O}, ${C}, ${Z} {
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
@media screen and ${z} {
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
@media screen and ${O} {
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
@media screen and ${Z} {
.columns .four-merch-cards.plans:has(merch-card[variant="plans-v2"]) {
    grid-template-columns: repeat(2, var(--consonant-merch-card-plans-v2-width));
  }

}
`;var Hi={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m"},shortDescription:{tag:"p",slot:"short-description"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},addon:!0,secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-red-700-plans"},allowedBadgeColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-gray-700-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300-plans","spectrum-gray-300-plans","spectrum-green-900-plans","spectrum-red-700-plans","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],whatsIncluded:{tag:"div",slot:"whats-included"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},Re=class extends T{constructor(r){super(r),this.adaptForMedia=this.adaptForMedia.bind(this),this.toggleShortDescription=this.toggleShortDescription.bind(this),this.shortDescriptionExpanded=!1,this.syncScheduled=!1}priceOptionsProvider(r,t){if(r.dataset.template===ne){t.displayPlanType=this.card?.settings?.displayPlanType??!1;return}(r.dataset.template==="strikethrough"||r.dataset.template==="price")&&(t.displayPerUnit=!1)}getGlobalCSS(){return Ii}adjustSlotPlacement(r,t,a){let{shadowRoot:i}=this.card,n=i.querySelector("footer"),o=i.querySelector(".body"),s=this.card.getAttribute("size");if(!s)return;let l=i.querySelector(`footer slot[name="${r}"]`),c=i.querySelector(`.body slot[name="${r}"]`);if(s.includes("wide")||(n?.classList.remove("wide-footer"),l?.remove()),!!t.includes(s)){if(n?.classList.toggle("wide-footer",_.isDesktopOrUp),!a&&l){if(c)l.remove();else{let d=o.querySelector(`[data-placeholder-for="${r}"]`);d?d.replaceWith(l):o.appendChild(l)}return}if(a&&c){let d=document.createElement("div");d.setAttribute("data-placeholder-for",r),d.classList.add("slot-placeholder"),l||n.prepend(c.cloneNode(!0)),c.replaceWith(d)}}}adaptForMedia(){if(!this.card.closest("merch-card-collection,overlay-trigger,.two-merch-cards,.three-merch-cards,.four-merch-cards,.columns"))return this.card.hasAttribute("size"),void 0;this.adjustSlotPlacement("heading-m",["wide"],!0),this.adjustSlotPlacement("addon",["super-wide"],_.isDesktopOrUp),this.adjustSlotPlacement("callout-content",["super-wide"],_.isDesktopOrUp)}adjustCallout(){let r=this.card.querySelector('[slot="callout-content"] .icon-button');if(!r?.title)return;r.dataset.tooltip=r.title,r.removeAttribute("title"),r.classList.add("hide-tooltip");let t=a=>{a===r?r.classList.toggle("hide-tooltip"):r.classList.add("hide-tooltip")};document.addEventListener("touchstart",a=>{a.preventDefault(),t(a.target)}),document.addEventListener("mouseover",a=>{a.preventDefault(),a.target!==r?r.classList.add("hide-tooltip"):r.classList.remove("hide-tooltip")})}async postCardUpdateHook(){this.card.isConnected&&(this.adaptForMedia(),this.adjustAddon(),this.adjustCallout(),this.updateShortDescriptionVisibility(),this.hasShortDescription?this.card.setAttribute("has-short-description",""):this.card.removeAttribute("has-short-description"),this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook(),window.matchMedia("(min-width: 768px)").matches&&requestAnimationFrame(()=>{this.syncHeights()}))}get mainPrice(){return this.card.querySelector(`[slot="heading-m"] ${V}[data-template="price"]`)}syncHeights(){this.card.getBoundingClientRect().width<=2||this.syncRowHeights([{name:"body",getElement:r=>r.shadowRoot?.querySelector(".body")},{name:"footer",getElement:r=>r.shadowRoot?.querySelector("footer")},{name:"short-description",getElement:r=>r.querySelector('[slot="short-description"]')}])}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let r=this.mainPrice;if(!r)return;let t=r.cloneNode(!0);if(await r.onceSettled(),!r?.options)return;r.options.displayPerUnit&&(r.dataset.displayPerUnit="false"),r.options.displayTax&&(r.dataset.displayTax="false"),r.options.displayPlanType&&(r.dataset.displayPlanType="false"),t.setAttribute("data-template","legal"),r.parentNode.insertBefore(t,r.nextSibling),await t.onceSettled()}catch{}}async adjustAddon(){await this.card.updateComplete;let r=this.card.addon;if(!r)return;r.setAttribute("custom-checkbox","");let t=this.mainPrice;if(!t)return;await t.onceSettled();let a=t.value?.[0]?.planType;a&&(r.planType=a)}get stockCheckbox(){return this.card.checkboxLabel?Ae`<label id="stock-checkbox">
                <input type="checkbox" @change=${this.card.toggleStockOffer}></input>
                <span></span>
                ${this.card.checkboxLabel}
            </label>`:lr}get hasShortDescription(){return!!this.card.querySelector('[slot="short-description"]')}get shortDescriptionLabel(){let r=this.card.querySelector('[slot="short-description"]'),t=r.querySelector("strong, b");if(t?.textContent?.trim())return t.textContent.trim();let a=r.querySelector("h1, h2, h3, h4, h5, h6, p");return a?.textContent?.trim()?a.textContent.trim():r.textContent?.trim().split(`
`)[0].trim()}updateShortDescriptionVisibility(){let r=this.card.querySelector('[slot="short-description"]');if(!r)return;let t=r.querySelector("strong, b, p");t&&(_.isMobile?t.style.display="none":t.style.display="")}toggleShortDescription(){this.shortDescriptionExpanded=!this.shortDescriptionExpanded,this.card.requestUpdate()}get shortDescriptionToggle(){return this.hasShortDescription?_.isMobile?Ae`
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
        `:Ae`
                <div class="short-description-content desktop">
                    <slot name="short-description"></slot>
                </div>
            `:lr}get icons(){return this.card.querySelector('[slot="icons"]')||this.card.getAttribute("id")?Ae`<slot name="icons"></slot>`:lr}get secureLabelFooter(){return Ae`<footer>
            ${this.secureLabel}<slot name="quantity-select"></slot
            ><slot name="footer"></slot>
        </footer>`}connectedCallbackHook(){this.handleMediaChange=()=>{this.adaptForMedia(),this.updateShortDescriptionVisibility(),this.card.requestUpdate(),window.matchMedia("(min-width: 768px)").matches&&requestAnimationFrame(()=>{this.syncHeights()})},_.matchMobile.addEventListener("change",this.handleMediaChange),_.matchDesktopOrUp.addEventListener("change",this.handleMediaChange),this.handleResize=()=>{this._resizeFrame&&cancelAnimationFrame(this._resizeFrame),this._resizeFrame=requestAnimationFrame(()=>{this._resizeFrame=null,window.matchMedia("(min-width: 768px)").matches&&this.syncHeights()})},window.addEventListener("resize",this.handleResize),this.visibilityObserver=new IntersectionObserver(([r])=>{r.boundingClientRect.height!==0&&r.isIntersecting&&(window.matchMedia("(min-width: 768px)").matches&&requestAnimationFrame(()=>{this.syncHeights()}),this.visibilityObserver.disconnect())}),this.visibilityObserver.observe(this.card)}disconnectedCallbackHook(){_.matchMobile.removeEventListener("change",this.handleMediaChange),_.matchDesktopOrUp.removeEventListener("change",this.handleMediaChange),this.handleResize&&(window.removeEventListener("resize",this.handleResize),this.handleResize=null),this._resizeFrame&&(cancelAnimationFrame(this._resizeFrame),this._resizeFrame=null),this.visibilityObserver?.disconnect()}renderLayout(){let t=this.card.getAttribute("size")==="wide";return Ae` ${this.badge}
            <div class="body">
                ${t?Ae`
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
                      `:Ae`
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
            <slot></slot>`}};g(Re,"variantStyle",$s`
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

        @media ${Di(z)}, ${Di(X)} {
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
    `),g(Re,"collectionOptions",{customHeaderArea:r=>r.sidenav?Ae`<slot name="resultsText"></slot>`:lr,headerVisibility:{search:!1,sort:!1,result:["mobile","tablet"],custom:["desktop"]},onSidenavAttached:r=>{let t=()=>{let a=r.querySelectorAll("merch-card");if(a.forEach(n=>{n.hasAttribute("data-size")&&(n.setAttribute("size",n.getAttribute("data-size")),n.removeAttribute("data-size"))}),!_.isDesktop)return;let i=0;a.forEach(n=>{if(n.style.display==="none")return;let o=n.getAttribute("size"),s=o==="wide"?2:o==="super-wide"?3:1;s===2&&i%3===2&&(n.setAttribute("data-size",o),n.removeAttribute("size"),s=1),i+=s})};_.matchDesktop.addEventListener("change",t),r.addEventListener(he,t),r.onUnmount.push(()=>{_.matchDesktop.removeEventListener("change",t),r.removeEventListener(he,t)})}});import{html as ue,css as Gs,nothing as Ue}from"./lit-all.min.js";var Bi=`
:root {
    --consonant-merch-card-plans-bizpro-max-width: 394px;
    --consonant-merch-card-plans-bizpro-min-width: 261px;
    --consonant-merch-card-plans-bizpro-frame-bg-default: var(--s2a-color-background-subtle, #f8f8f8);
    --consonant-merch-card-plans-bizpro-frame-bg-black: var(--s2a-color-background-knockout, #000);
}

/* Width is driven by the grid track, not a fixed value \u2014 cards fluidly fit
   261px (1280 viewport) \u2192 394px (1920 viewport) per Figma. */
merch-card[variant="plans-bizpro"] {
    width: 100%;
    max-width: var(--consonant-merch-card-plans-bizpro-max-width);
    overflow: visible;
    position: relative;
}

/* Callout banner link \u2014 inherits dark text color + weight, just underlined.
   Force display:inline so the link flows with the surrounding text and
   doesn't get broken onto its own line by any inherited inline-block. */
merch-card[variant="plans-bizpro"] [slot="callout-content"] a {
    display: inline;
    color: inherit;
    font-weight: inherit;
    text-decoration: underline;
    white-space: normal;
}

/* The callout sits flat on the license-zone (Figma 1098:30779) \u2014 drop the
   global gray "pill" (background/radius/fit-content) that other variants use,
   so it's full-width caption text on the zone background instead of a box. */
merch-card[variant="plans-bizpro"] [slot="callout-content"] > p,
merch-card[variant="plans-bizpro"] [slot="callout-content"] > div > div {
    background: transparent;
    border-radius: 0;
    padding: 0;
    width: auto;
    font-size: 12px;
    line-height: 16px;
}

merch-card[variant="plans-bizpro"] [slot="callout-content"] > div {
    margin: 0;
}

/* Terms link \u2014 "See terms | See what's included" inline anchors */
merch-card[variant="plans-bizpro"] [slot="terms-link"] a {
    color: inherit;
    text-decoration: underline;
}

/* AI Assistant add-on row \u2014 Figma 1098:33812 / 1098:33951.
   Themes the real <merch-addon> injected at slot="addon". The purple frame
   and trailing sparkle live on the variant's .add-on wrapper (see variantStyle);
   here we size/colour the merch-addon checkbox + label via its custom props. */
merch-card[variant="plans-bizpro"] merch-addon[slot="addon"] {
    flex: 1 0 0;
    min-width: 0;
    --merch-addon-gap: var(--s2a-spacing-xs, 8px);
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
    --merch-addon-label-color: var(--s2a-color-content-default, #000);
}

/* Light-DOM color overrides \u2014 beat global promo/legal styling */
merch-card[variant="plans-bizpro"] [slot="promo-text"] {
    color: var(--s2a-color-content-subtle, #000000a3);
    font-family: 'Adobe Clean', adobe-clean, sans-serif;
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
merch-card[variant="plans-bizpro"] [slot="heading-xs"] {
    margin: 0;
    font-family: 'Adobe Clean Display', 'adobe-clean-display', sans-serif;
    font-weight: 900;
    font-size: var(--s2a-typography-font-size-title-4, 24px);
    line-height: var(--s2a-typography-line-height-title-4, 24px);
    letter-spacing: var(--s2a-font-letter-spacing-4xl, -0.48px);
    color: var(--s2a-color-content-default, #000);
}

merch-card[variant="plans-bizpro"] [slot="body-xs"] {
    margin: 0;
    font-family: 'Adobe Clean', adobe-clean, sans-serif;
    font-weight: 400;
    font-size: var(--s2a-typography-font-size-body-sm, 14px);
    line-height: var(--s2a-typography-line-height-body-sm, 18px);
    letter-spacing: var(--s2a-typography-letter-spacing-body-sm, 0.14px);
    color: var(--s2a-color-content-default, #000);
}

/* Title / description fields are RTE \u2014 authors may save <h3>Title</h3> or
   <div><p>desc</p></div>, which the AEM mapping then wraps again. Make any
   inner block descendant inherit the outer slot styles so the visible text
   uses the variant typography instead of UA defaults. */
merch-card[variant="plans-bizpro"] [slot="heading-xs"] :is(h1, h2, h3, h4, h5, h6, p, div, span),
merch-card[variant="plans-bizpro"] [slot="body-xs"] :is(h1, h2, h3, h4, h5, h6, p, div, span) {
    margin: 0;
    font: inherit;
    color: inherit;
    letter-spacing: inherit;
}

/* Rich whats-included styling: section title + bullet items + dividers */
merch-card[variant="plans-bizpro"] [slot="whats-included"] {
    font-family: 'Adobe Clean', adobe-clean, sans-serif;
}

merch-card[variant="plans-bizpro"] [slot="whats-included"] .section,
merch-card[variant="plans-bizpro"] [slot="whats-included"] h4,
merch-card[variant="plans-bizpro"] [slot="whats-included"] h5 {
    margin: 0;
}

/* Studio's preview pane defines a global \`.section\` style (padding:32px,
   border-radius:16px, box-shadow, background) for its own editor panels.
   That selector inadvertently matches authored \`<div class="section">\`
   blocks inside the whats-included slot, blowing out paddings and forcing
   list items to wrap. Reset visual chrome so the section behaves as a
   transparent grouping container, per Figma. */
merch-card[variant="plans-bizpro"] [slot="whats-included"] .section {
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
}

merch-card[variant="plans-bizpro"] [slot="whats-included"] h4 {
    font-weight: 700;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0.14px;
    color: inherit;
    display: flex;
    align-items: center;
    gap: var(--s2a-spacing-2xs, 4px);
}

merch-card[variant="plans-bizpro"] [slot="whats-included"] ul {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--s2a-spacing-sm, 12px);
}

merch-card[variant="plans-bizpro"] [slot="whats-included"] ul li {
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0.14px;
    color: var(--s2a-color-content-subtle, #000000a3);
    padding: 0 20px;
}

merch-card[variant="plans-bizpro"][border-color="black"] [slot="whats-included"] ul li {
    color: var(--s2a-color-content-knockout, #ffffff);
}

merch-card[variant="plans-bizpro"] [slot="whats-included"] .section + .section {
    border-top: 1px solid var(--consonant-merch-card-plans-bizpro-divider-color, var(--s2a-color-transparent-black-12, #0000001f));
    padding-top: 16px;
}

/* Per Figma: the last section in a multi-section list uses 8px gap between title and items
   (the leading + middle sections stay at 12px). Single-section cards keep 12px. */
merch-card[variant="plans-bizpro"] [slot="whats-included"] .section:not(:only-child):last-child ul {
    margin-top: 8px;
}

/* Section title icons: 20px on the first (lead) section, 16px on subsequent sections per Figma.
   Covers raw <svg> (curated registry), Spectrum <sp-icon-*> and <merch-icon> (standard picker). */
merch-card[variant="plans-bizpro"] [slot="whats-included"] .section h4 > svg,
merch-card[variant="plans-bizpro"] [slot="whats-included"] .section h4 > .sp-icon,
merch-card[variant="plans-bizpro"] [slot="whats-included"] .section h4 > merch-icon {
    width: 16px;
    height: 16px;
    flex: 0 0 auto;
    color: inherit;
}
merch-card[variant="plans-bizpro"] [slot="whats-included"] .section:first-child h4 > svg,
merch-card[variant="plans-bizpro"] [slot="whats-included"] .section:first-child h4 > .sp-icon,
merch-card[variant="plans-bizpro"] [slot="whats-included"] .section:first-child h4 > merch-icon {
    width: 20px;
    height: 20px;
}

/* CTA styling \u2014 pill-shaped buttons, accent solid + outlined */
merch-card[variant="plans-bizpro"] [slot="footer"] a,
merch-card[variant="plans-bizpro"] [slot="footer"] button {
    flex: 1 0 0;
    min-width: 0;
    height: 40px;
    padding: 14px var(--s2a-spacing-lg, 24px);
    border-radius: var(--s2a-border-radius-999, 999px);
    font-family: 'Adobe Clean', adobe-clean, sans-serif;
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

merch-card[variant="plans-bizpro"] [slot="footer"] .con-button.blue,
merch-card[variant="plans-bizpro"] [slot="footer"] a.accent,
merch-card[variant="plans-bizpro"] [slot="footer"] [data-button-type="accent"] {
    background: var(--s2a-color-button-background-primary-solid-default, #3b63fb);
    color: var(--s2a-color-button-content-primary-solid-default, #fff);
    border: none;
}

merch-card[variant="plans-bizpro"] [slot="footer"] .con-button.outline,
merch-card[variant="plans-bizpro"] [slot="footer"] a.outline,
merch-card[variant="plans-bizpro"] [slot="footer"] [data-button-type="primary"] {
    background: var(--s2a-color-button-background-primary-outlined-default, transparent);
    color: var(--s2a-color-button-content-primary-outlined-default, #000);
    border: var(--s2a-border-width-md, 2px) solid var(--s2a-color-button-border-primary-outlined-default, #000);
}

/* Price spans \u2014 individually styled per Figma */
merch-card[variant="plans-bizpro"] [slot="heading-m"] .price,
merch-card[variant="plans-bizpro"] [slot="heading-m"] .price-currency-symbol,
merch-card[variant="plans-bizpro"] [slot="heading-m"] .price-integer,
merch-card[variant="plans-bizpro"] [slot="heading-m"] .price-decimals-delimiter,
merch-card[variant="plans-bizpro"] [slot="heading-m"] .price-decimals,
merch-card[variant="plans-bizpro"] [slot="heading-m"] .price-recurrence {
    font-family: 'Adobe Clean Display', 'adobe-clean-display', sans-serif;
    font-weight: 900;
    font-size: 18px;
    line-height: 21px;
    letter-spacing: -0.48px;
    color: var(--s2a-color-content-default, #000);
}

/* WCS recurrence dictionary returns abbreviations uppercased ("/MO");
   Figma's pricing typography presents it lowercase ("/mo"). */
merch-card[variant="plans-bizpro"] [slot="heading-m"] .price-recurrence {
    text-transform: lowercase;
}

/* Collection grid \u2014 C2 breakpoints only (768, 1280).
   - Mobile: single column, full width.
   - Tablet (\u2265768): 2-column grid for 2/3/4 cards.
   - Desktop (\u22651280): full column count.
   Cards stretch to equal height within a row (matches Figma row-equal layout)
   and widths flow fluidly via 1fr tracks. Container max-width caps growth so
   cards don't exceed the Figma xl (394px) width. */
merch-card-collection.plans:is(.one-merch-card, .two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="plans-bizpro"]) {
    display: grid;
    gap: var(--s2a-grid-gutter, 8px);
    grid-template-columns: minmax(0, var(--consonant-merch-card-plans-bizpro-max-width));
    justify-content: center;
    align-items: stretch;
    margin-inline: auto;
}

@media screen and ${O} {
    merch-card-collection.plans:is(.two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="plans-bizpro"]) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        max-width: 720px;
    }
}

@media screen and ${gi} {
    merch-card-collection.plans:is(.three-merch-cards):has(merch-card[variant="plans-bizpro"]) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        max-width: 1192px;
    }
    merch-card-collection.plans:is(.four-merch-cards):has(merch-card[variant="plans-bizpro"]) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        max-width: 1600px;
    }
}

@media screen and ${z} {
    merch-card[variant="plans-bizpro"] {
        width: 100%;
        max-width: var(--consonant-merch-card-plans-bizpro-max-width);
    }
}

/* ETF / legal text inline link styling \u2014 underlined inline anchors */
merch-card[variant="plans-bizpro"] [slot="legal-text"] a {
    color: inherit;
    text-decoration: underline;
}
`;var Fi={cardName:{attribute:"name"},subtitle:{tag:"p",slot:"subtitle"},title:{tag:"h3",slot:"heading-xs"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"s"},prices:{tag:"p",slot:"heading-m"},promoText:{tag:"p",slot:"promo-text"},perUnitLabel:{tag:"span",slot:"per-unit-label"},callout:{tag:"div",slot:"callout-content",editorLabel:"License callout"},quantitySelect:{tag:"div",slot:"quantity-select"},shortDescription:{tag:"div",slot:"legal-text"},secureLabel:!0,addon:!0,ctas:{slot:"footer",size:"m"},whatsIncluded:{tag:"div",slot:"whats-included"},borderColor:{attribute:"border-color",specialValues:{Black:"black"}},allowedBorderColors:[],style:"consonant"},ze,$e,Ot,st=class extends T{constructor(){super(...arguments);D(this,$e);g(this,"expanded",!1);g(this,"licenseOpen",!1);g(this,"licenseQty",null);D(this,ze,null);g(this,"toggleExpanded",t=>{t.preventDefault(),this.expanded=!this.expanded,this.card.requestUpdate()});g(this,"toggleLicensePopover",t=>{t.preventDefault(),t.stopPropagation(),this.licenseOpen=!this.licenseOpen,this.licenseOpen?(M(this,ze,a=>{a.composedPath().includes(this.card)||(this.licenseOpen=!1,this.card.requestUpdate(),fe(this,$e,Ot).call(this))}),document.addEventListener("mousedown",x(this,ze))):fe(this,$e,Ot).call(this),this.card.requestUpdate()});g(this,"selectLicenseQty",t=>{this.licenseQty=t,this.licenseOpen=!1,fe(this,$e,Ot).call(this);let a=this.quantitySelectEl;a&&(a.selectedValue=Number(t),a.dispatchEvent(new CustomEvent(le,{detail:{option:Number(t)},bubbles:!0}))),this.card.requestUpdate()})}getGlobalCSS(){return Bi}get hasWhatsIncluded(){return!!this.card.querySelector('[slot="whats-included"]')}get hasCallout(){return!!this.card.querySelector('[slot="callout-content"]')}get hasQuantitySelect(){let t=this.quantitySelectEl;return t?!!t.getAttribute("title")||parseInt(t.getAttribute("min"),10)>0||parseInt(t.getAttribute("step"),10)>0:!1}get hasPriceOriginal(){return!!this.card.querySelector('[slot="price-original"]')}get hasTermsLink(){return!!this.card.querySelector('[slot="terms-link"]')}get hasAddOn(){return!!this.card.querySelector('[slot="addon"]')}get mainPrice(){return this.card.querySelector(`[slot="heading-m"] ${V}[data-template="price"]`)}async adjustAddon(){await this.card.updateComplete;let t=this.card.addon;if(!t)return;t.setAttribute("custom-checkbox","");let a=this.mainPrice;if(!a)return;await a.onceSettled();let i=a.value?.[0]?.planType;i&&(t.planType=i)}async postCardUpdateHook(){await this.adjustAddon(),await super.postCardUpdateHook()}disconnectedCallbackHook(){fe(this,$e,Ot).call(this)}get hasLegalText(){return!!this.card.querySelector('[slot="legal-text"]')}get quantitySelectEl(){return this.card.querySelector("merch-quantity-select")}get licenseOptions(){let t=this.quantitySelectEl;if(!t)return null;let a=parseInt(t.getAttribute("min"),10),i=parseInt(t.getAttribute("max"),10),n=parseInt(t.getAttribute("step"),10)||1;if(Number.isNaN(a)||Number.isNaN(i)||i<a)return null;let o=[];for(let s=a;s<=i;s+=n)o.push(String(s));return o.length?o:null}get licenseLabel(){return this.quantitySelectEl?.getAttribute("title")||"License"}get licenseLabelPlural(){return`${this.licenseLabel}s`}get hasLicenseSelector(){return(this.licenseOptions?.length??0)>0}get currentLicenseValue(){let t=this.licenseOptions;if(!t?.length)return null;if(this.licenseQty!=null)return this.licenseQty;let a=this.quantitySelectEl?.getAttribute("default-value");return a!=null&&t.includes(a)?a:t[0]}formatLicenseRow(t){let i=String(t).replace(/\D/g,"")==="1"?this.licenseLabel:this.licenseLabelPlural;return{value:t,label:i}}renderLicenseSelector(){if(!this.hasLicenseSelector)return ue`<slot name="quantity-select"></slot>`;let t=this.licenseOptions,a=this.currentLicenseValue,i=!!this.licenseOpen,{value:n,label:o}=this.formatLicenseRow(a);return ue`
            <div class="license-select" ?data-open=${i}>
                <button
                    class="license-select-trigger"
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded=${i?"true":"false"}
                    aria-controls="license-popover"
                    @click=${this.toggleLicensePopover}
                >
                    <span class="license-select-trigger-text">
                        <span class="license-select-value">${n}</span>
                        <span class="license-select-label">${o}</span>
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
                    ?hidden=${!i}
                >
                    <li
                        class="license-select-popover-header"
                        @click=${this.toggleLicensePopover}
                    >
                        <span class="license-select-trigger-text">
                            <span class="license-select-value">${n}</span>
                            <span class="license-select-label">${o}</span>
                        </span>
                        <span
                            class="license-select-chevron"
                            aria-hidden="true"
                            style="transform: rotate(180deg);"
                        ></span>
                    </li>
                    ${t.map(s=>ue`
                            <li
                                class="license-select-option ${s===a?"selected":""}"
                                role="option"
                                aria-selected=${s===a?"true":"false"}
                                @click=${()=>this.selectLicenseQty(s)}
                            >
                                ${s}
                            </li>
                        `)}
                </ul>
            </div>
        `}renderLayout(){let t=!!this.expanded;return ue`
            <div class="top-card">
                <div class="mnemonic">
                    <slot name="icons"></slot>
                    <slot name="subtitle"></slot>
                </div>
                <div class="name-description">
                    <slot name="heading-xs"></slot>
                    <slot name="body-xs"></slot>
                    ${this.hasTermsLink?ue`<div class="terms-link">
                              <slot name="terms-link"></slot>
                          </div>`:Ue}
                </div>
                <div class="pricing">
                    ${this.hasPriceOriginal?ue`<slot name="price-original"></slot>`:Ue}
                    <div class="pricing-line">
                        <slot name="heading-m"></slot>
                        <slot name="per-unit-label"></slot>
                    </div>
                    <slot name="promo-text"></slot>
                </div>
                ${this.hasLegalText?ue`<div class="legal-text">
                          <slot name="legal-text"></slot>
                      </div>`:Ue}
                ${this.hasLicenseSelector||this.hasCallout||this.hasQuantitySelect?ue`<div class="license-zone">
                          ${this.renderLicenseSelector()}
                          ${this.hasCallout?ue`<div class="callout">
                                    <slot name="callout-content"></slot>
                                </div>`:Ue}
                      </div>`:Ue}
                ${this.hasAddOn?ue`<div class="add-on">
                          <slot name="addon"></slot>
                      </div>`:Ue}
                <footer>
                    <slot name="footer"></slot>
                </footer>
                ${this.secureLabel}
            </div>
            ${this.hasWhatsIncluded?ue`
                      <button
                          class="whats-included-toggle"
                          type="button"
                          aria-expanded=${t?"true":"false"}
                          aria-controls="features-zone"
                          @click=${this.toggleExpanded}
                      >
                          <!-- TODO(MWPW-192902): English-only; source from a
                               placeholder/literal once copy is authored in AEM. -->
                          <span class="whats-included-toggle-label">
                              See what's included:
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
                  `:Ue}
            <slot></slot>
        `}};ze=new WeakMap,$e=new WeakSet,Ot=function(){x(this,ze)&&(document.removeEventListener("mousedown",x(this,ze)),M(this,ze,null))},g(st,"variantStyle",Gs`
        :host([variant='plans-bizpro']) {
            display: flex;
            flex-direction: column;
            background: var(
                --consonant-merch-card-plans-bizpro-frame-bg,
                var(--s2a-color-background-subtle, #f8f8f8)
            );
            border-radius: var(--s2a-border-radius-md, 16px);
            padding: var(--s2a-spacing-xs, 8px);
            box-sizing: border-box;
            overflow: hidden;
            position: relative;
            color: var(
                --consonant-merch-card-plans-bizpro-frame-text,
                var(--s2a-color-content-default, #000)
            );
            --secure-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='currentColor'%3E%3Cpath d='M9 9.2C9 8.64844 8.55156 8.2 8 8.2C7.44844 8.2 7 8.64844 7 9.2C7 9.52207 7.16289 9.7959 7.4 9.9789V10.6C7.4 10.9312 7.66875 11.2 8 11.2C8.33125 11.2 8.6 10.9312 8.6 10.6V9.9789C8.83711 9.7959 9 9.52207 9 9.2Z'/%3E%3Cpath d='M12 5.62031V5.2C12 2.99453 10.2055 1.2 8 1.2C5.79453 1.2 4 2.99453 4 5.2V5.62031C3.10274 5.72129 2.4 6.47637 2.4 7.4V12.6C2.4 13.5922 3.20782 14.4 4.2 14.4H11.8C12.7922 14.4 13.6 13.5922 13.6 12.6V7.4C13.6 6.47637 12.8973 5.72129 12 5.62031ZM8 2.4C9.54375 2.4 10.8 3.65625 10.8 5.2V5.6H5.2V5.2C5.2 3.65625 6.45625 2.4 8 2.4ZM12.4 12.6C12.4 12.9305 12.1305 13.2 11.8 13.2H4.2C3.86953 13.2 3.6 12.9305 3.6 12.6V7.4C3.6 7.06953 3.86953 6.8 4.2 6.8H11.8C12.1305 6.8 12.4 7.06953 12.4 7.4V12.6Z'/%3E%3C/svg%3E");
        }

        :host([variant='plans-bizpro'][border-color='black']) {
            --consonant-merch-card-plans-bizpro-frame-bg: var(
                --s2a-color-background-knockout,
                #000
            );
            --consonant-merch-card-plans-bizpro-frame-text: var(
                --s2a-color-content-knockout,
                #fff
            );
            --consonant-merch-card-plans-bizpro-divider-color: var(
                --s2a-color-transparent-white-16,
                #ffffff29
            );
            --consonant-merch-card-plans-bizpro-subtitle-color: var(
                --s2a-color-content-default,
                #000
            );
        }

        :host([variant='plans-bizpro']) .top-card {
            background: var(--s2a-color-background-default, #fff);
            border-radius: 12px;
            padding: var(--s2a-spacing-lg, 24px);
            display: flex;
            flex-direction: column;
            gap: var(--s2a-spacing-lg, 24px);
            color: var(--s2a-color-content-default, #000);
            /* Fill the merch-card's height so price/CTA/secure-label
               anchor to the bottom of the white card. Combined with
               .name-description flex-grow below, this aligns the price
               + CTA rows across cards in the same grid row. */
            flex: 1 1 auto;
        }

        :host([variant='plans-bizpro']) .mnemonic {
            display: flex;
            align-items: center;
            gap: var(--s2a-spacing-sm, 12px);
        }

        :host([variant='plans-bizpro']) ::slotted([slot='icons']) {
            width: 24px;
            height: 24px;
        }

        :host([variant='plans-bizpro']) ::slotted([slot='subtitle']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 700;
            font-size: 16px;
            line-height: 20px;
            letter-spacing: var(--s2a-typography-letter-spacing-eyebrow, 0);
            color: var(
                --consonant-merch-card-plans-bizpro-subtitle-color,
                var(--s2a-color-content-subtle, #000000a3)
            );
            flex: 1;
        }

        :host([variant='plans-bizpro']) .name-description {
            display: flex;
            flex-direction: column;
            gap: var(--s2a-spacing-xs, 8px);
            /* Grow to absorb height differences so everything from price
               downward sticks to the bottom edge of the white card. */
            flex: 1 1 auto;
        }

        :host([variant='plans-bizpro']) ::slotted([slot='heading-xs']) {
            margin: 0;
            font-family: 'Adobe Clean Display', 'adobe-clean-display',
                sans-serif;
            font-weight: 900;
            font-size: var(--s2a-typography-font-size-title-4, 24px);
            line-height: var(--s2a-typography-line-height-title-4, 24px);
            letter-spacing: var(--s2a-font-letter-spacing-4xl, -0.48px);
            color: var(--s2a-color-content-default, #000);
        }

        :host([variant='plans-bizpro']) ::slotted([slot='body-xs']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
            color: var(--s2a-color-content-default, #000);
        }

        :host([variant='plans-bizpro']) .pricing {
            display: flex;
            flex-direction: column;
            gap: 0;
        }

        :host([variant='plans-bizpro']) ::slotted([slot='heading-m']) {
            margin: 0;
            font-family: 'Adobe Clean Display', 'adobe-clean-display',
                sans-serif;
            font-weight: 900;
            font-size: 18px;
            line-height: 21px;
            letter-spacing: -0.48px;
            color: var(--s2a-color-content-default, #000);
        }

        :host([variant='plans-bizpro']) ::slotted([slot='promo-text']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
            color: var(--s2a-color-content-subtle, #000000a3);
        }

        :host([variant='plans-bizpro']) ::slotted([slot='price-original']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
            color: var(--s2a-color-content-subtle, #000000a3);
            text-decoration: line-through;
            text-decoration-skip-ink: none;
        }

        :host([variant='plans-bizpro']) .terms-link {
            color: var(--s2a-color-content-default, #000);
        }

        :host([variant='plans-bizpro']) ::slotted([slot='terms-link']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
            color: var(--s2a-color-content-default, #000);
        }

        :host([variant='plans-bizpro']) .legal-text {
            color: var(--s2a-color-content-default, #000);
        }

        :host([variant='plans-bizpro']) ::slotted([slot='legal-text']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
            color: var(--s2a-color-content-subtle, #000000a3);
        }

        :host([variant='plans-bizpro']) footer {
            display: flex;
            gap: var(--s2a-spacing-xs, 8px);
            padding: 0;
            margin: 0;
            background: transparent;
            min-height: auto;
        }

        :host([variant='plans-bizpro']) footer ::slotted([slot='footer']) {
            display: flex;
            gap: var(--s2a-spacing-xs, 8px);
            flex: 1;
        }

        :host([variant='plans-bizpro']) .secure-transaction-label {
            display: inline-flex;
            align-items: center;
            gap: var(--s2a-spacing-xs, 8px);
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
            color: var(--s2a-color-content-subtle, #000000a3);
            padding: 0;
            margin: 0;
            align-self: flex-start;
            flex: 0 0 auto;
            white-space: normal;
        }

        :host([variant='plans-bizpro']) .secure-transaction-label::before {
            content: '';
            display: inline-block;
            width: 16px;
            height: 16px;
            background-image: var(--secure-icon);
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
        }

        :host([variant='plans-bizpro']) .features-zone {
            padding: var(--s2a-spacing-lg, 24px);
            display: flex;
            flex-direction: column;
            gap: var(--s2a-spacing-lg, 24px);
            color: var(
                --consonant-merch-card-plans-bizpro-frame-text,
                var(--s2a-color-content-default, #000)
            );
        }

        :host([variant='plans-bizpro']) .features-zone[hidden] {
            display: none;
        }

        :host([variant='plans-bizpro']) ::slotted([slot='whats-included']) {
            color: inherit;
            display: flex;
            flex-direction: column;
            gap: var(--s2a-spacing-lg, 24px);
        }

        :host([variant='plans-bizpro']) .whats-included-toggle {
            all: unset;
            display: flex;
            align-items: center;
            padding: var(--s2a-spacing-lg, 24px);
            cursor: pointer;
            color: var(
                --consonant-merch-card-plans-bizpro-frame-text,
                var(--s2a-color-content-default, #000)
            );
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 700;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
        }

        /* Expanded state: no bottom padding — features-zone provides spacing */
        :host([variant='plans-bizpro'])
            .whats-included-toggle[aria-expanded='true'] {
            padding-bottom: 0;
        }

        :host([variant='plans-bizpro']) .whats-included-toggle-label {
            flex: 1 0 0;
        }

        :host([variant='plans-bizpro']) .whats-included-toggle:focus-visible {
            outline: 2px solid #1473e6;
            outline-offset: -2px;
            border-radius: 8px;
        }

        :host([variant='plans-bizpro']) .whats-included-toggle-chevron {
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

        :host([variant='plans-bizpro'])
            .whats-included-toggle[aria-expanded='true']
            .whats-included-toggle-chevron {
            transform: rotate(180deg);
        }

        :host([variant='plans-bizpro']) .pricing-line {
            display: flex;
            align-items: baseline;
            flex-wrap: wrap;
            gap: 0;
        }

        :host([variant='plans-bizpro']) ::slotted([slot='per-unit-label']) {
            font-family: 'Adobe Clean Display', 'adobe-clean-display',
                sans-serif;
            font-weight: 900;
            font-size: 18px;
            line-height: 21px;
            letter-spacing: -0.48px;
            color: var(--s2a-color-content-default, #000);
            margin-inline-start: var(--s2a-spacing-2xs, 4px);
        }

        :host([variant='plans-bizpro']) .license-zone {
            display: flex;
            flex-direction: column;
            background: var(--s2a-color-background-subtle, #f8f8f8);
            border-radius: 8px;
            overflow: visible;
        }

        :host([variant='plans-bizpro']) .license-select {
            position: relative;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
        }

        :host([variant='plans-bizpro']) .license-select-trigger {
            all: unset;
            box-sizing: border-box;
            width: 100%;
            height: 40px;
            padding: var(--s2a-spacing-sm, 12px);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--s2a-color-background-default, #fff);
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 8px;
            cursor: pointer;
            color: var(--s2a-color-content-default, #000);
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0;
        }

        :host([variant='plans-bizpro']) .license-select-trigger:focus-visible {
            outline: 2px solid #1473e6;
            outline-offset: 1px;
        }

        :host([variant='plans-bizpro']) .license-select-trigger-text {
            display: flex;
            align-items: center;
            gap: var(--s2a-spacing-xs, 8px);
        }

        :host([variant='plans-bizpro']) .license-select-value {
            font-weight: 700;
            color: var(--s2a-color-content-default, #000);
        }

        :host([variant='plans-bizpro']) .license-select-label {
            font-weight: 700;
            color: rgba(0, 0, 0, 0.64);
        }

        :host([variant='plans-bizpro']) .license-select-chevron {
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

        :host([variant='plans-bizpro'])
            .license-select-trigger[aria-expanded='true']
            .license-select-chevron {
            transform: rotate(180deg);
        }

        :host([variant='plans-bizpro']) .license-select-popover {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            margin: 0;
            padding: 0;
            list-style: none;
            background: var(--s2a-color-background-default, #fff);
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

        :host([variant='plans-bizpro']) .license-select-popover[hidden] {
            display: none;
        }

        :host([variant='plans-bizpro']) .license-select-popover-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--s2a-spacing-sm, 12px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 14px;
            line-height: 18px;
            font-weight: 700;
            cursor: pointer;
            background: var(--s2a-color-background-default, #fff);
        }

        :host([variant='plans-bizpro']) .license-select-option {
            padding: 16px 12px;
            cursor: pointer;
            color: var(--s2a-color-content-default, #000);
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 14px;
            line-height: 18px;
            font-weight: 700;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        :host([variant='plans-bizpro']) .license-select-option:last-child {
            border-bottom: none;
        }

        :host([variant='plans-bizpro']) .license-select-option:hover,
        :host([variant='plans-bizpro']) .license-select-option.selected {
            background: var(--s2a-color-background-subtle, #f8f8f8);
        }

        :host([variant='plans-bizpro']) .callout {
            padding: 8px 12px 12px 12px;
            color: var(--s2a-color-content-default, #000);
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 12px;
            line-height: 16px;
            letter-spacing: 0.24px;
            font-weight: 700;
            text-align: start;
        }

        :host([variant='plans-bizpro']) ::slotted([slot='callout-content']) {
            margin: 0;
        }

        :host([variant='plans-bizpro']) .add-on {
            display: flex;
            align-items: center;
            gap: var(--s2a-spacing-xs, 8px);
            padding: var(--s2a-spacing-md, 16px) var(--s2a-spacing-sm, 12px);
            /* Gradient border (Figma 1098:33812) — same purple→red AI gradient
               as the trailing sparkle. Paint the white fill on padding-box and
               the gradient on border-box so only the 1px border shows it. */
            background:
                linear-gradient(
                        var(--s2a-color-background-default, #fff),
                        var(--s2a-color-background-default, #fff)
                    )
                    padding-box,
                linear-gradient(45deg, #8d88f2 0%, #8d88f2 48.8%, #eb1000 100%)
                    border-box;
            border: 1px solid transparent;
            border-radius: var(--s2a-border-radius-sm, 8px);
            box-sizing: border-box;
        }

        :host([variant='plans-bizpro']) .add-on::after {
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
            :host([variant='plans-bizpro']) .whats-included-toggle {
                display: none;
            }
            :host([variant='plans-bizpro']) .features-zone[hidden] {
                display: flex;
            }
        }
    `);import{html as ha,css as qs}from"./lit-all.min.js";var Ui=`
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
@media screen and ${O} {
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

`;var $i={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},prices:{tag:"p",slot:"heading-xs"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},mnemonics:{size:"l"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"color-yellow-300-variation"},allowedBadgeColors:["color-yellow-300-variation","color-gray-300-variation","color-gray-700-variation","color-green-900-variation","gradient-purple-blue"],allowedBorderColors:["color-yellow-300-variation","color-gray-300-variation","color-green-900-variation","gradient-purple-blue"],borderColor:{attribute:"border-color"},whatsIncluded:{tag:"div",slot:"whats-included"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},we,ct=class extends T{constructor(t){super(t);D(this,we);this.postCardUpdateHook=this.postCardUpdateHook.bind(this),this.updatePriceQuantity=this.updatePriceQuantity.bind(this)}getGlobalCSS(){return Ui}priceOptionsProvider(t,a){t.dataset.template===ne&&(a.displayPlanType=this.card?.settings?.displayPlanType??!1,(t.dataset.template==="strikethrough"||t.dataset.template==="price")&&(a.displayPerUnit=!1))}adjustProductBodySlots(){if(this.card.getBoundingClientRect().width===0)return;["heading-xs","body-xxs","body-xs","promo-text","callout-content","addon","body-lower"].forEach(a=>this.updateCardElementMinHeight(this.card.shadowRoot.querySelector(`slot[name="${a}"]`),a))}renderLayout(){return ha` ${this.badge}
            <div class="body" aria-live="polite">
                <slot name="icons"></slot>
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${this.promoBottom?"":ha`<slot name="promo-text"></slot>`}
                <slot name="body-xs"></slot>
                ${this.promoBottom?ha`<slot name="promo-text"></slot>`:""}
                <slot name="whats-included"></slot>
                <slot name="callout-content"></slot>
                <slot name="quantity-select"></slot>
                <slot name="addon"></slot>
                <slot name="body-lower"></slot>
                <slot name="badge"></slot>
            </div>
            <hr />
            ${this.secureLabelFooter}`}connectedCallbackHook(){this.handleResize=()=>{x(this,we)&&cancelAnimationFrame(x(this,we)),M(this,we,requestAnimationFrame(()=>{M(this,we,null),this.postCardUpdateHook()}))},window.addEventListener("resize",this.handleResize),this.card.addEventListener(le,this.updatePriceQuantity)}disconnectedCallbackHook(){this.handleResize&&(window.removeEventListener("resize",this.handleResize),this.handleResize=null),x(this,we)&&(cancelAnimationFrame(x(this,we)),M(this,we,null)),this.card.removeEventListener(le,this.updatePriceQuantity)}async postCardUpdateHook(){this.card.isConnected&&(this.adjustAddon(),_.isMobile||this.adjustProductBodySlots(),this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook())}async adjustLegal(){if(!(this.legalAdjusted||!this.card.id))try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let t=this.mainPrice;if(!t)return;let a=t.cloneNode(!0);if(await t.onceSettled(),!t?.options)return;t.options.displayPerUnit&&(t.dataset.displayPerUnit="false"),t.options.displayTax&&(t.dataset.displayTax="false"),t.options.displayPlanType&&(t.dataset.displayPlanType="false"),a.setAttribute("data-template","legal"),t.parentNode.insertBefore(a,t.nextSibling),await a.onceSettled()}catch{}}get headingXSSlot(){return this.card.shadowRoot.querySelector('slot[name="heading-xs"]').assignedElements()[0]}get mainPrice(){return this.card.querySelector(`[slot="heading-xs"] ${V}[data-template="price"]`)}updatePriceQuantity({detail:t}){!this.mainPrice||!t?.option||(this.mainPrice.dataset.quantity=t.option)}toggleAddon(t){let a=this.mainPrice,i=this.headingXSSlot;if(!a&&i){let n=t?.getAttribute("plan-type"),o=null;if(t&&n&&(o=t.querySelector(`p[data-plan-type="${n}"]`)?.querySelector('span[is="inline-price"]')),this.card.querySelectorAll('p[slot="heading-xs"]').forEach(s=>s.remove()),t.checked){if(o){let s=xe("p",{class:"addon-heading-xs-price-addon",slot:"heading-xs"},o.innerHTML);this.card.appendChild(s)}}else{let s=xe("p",{class:"card-heading",id:"free",slot:"heading-xs"},"Free");this.card.appendChild(s)}}}async adjustAddon(){await this.card.updateComplete;let t=this.card.addon;if(!t)return;let a=this.mainPrice,i=this.card.planType;a&&(await a.onceSettled(),i=a.value?.[0]?.planType),i&&(t.planType=i)}};we=new WeakMap,g(ct,"variantStyle",qs`
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
    `);import{html as pa,css as Vs}from"./lit-all.min.js";var Gi=`
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
@media screen and ${z} {
  :root {
    --consonant-merch-card-segment-width: 276px;
  }
}

@media screen and ${O} {
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
`;var qi={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},prices:{tag:"p",slot:"heading-xs"},promoText:{tag:"p",slot:"promo-text"},description:{tag:"div",slot:"body-xs"},callout:{tag:"div",slot:"callout-content"},planType:!0,secureLabel:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"color-red-700-variation"},allowedBadgeColors:["color-yellow-300-variation","color-gray-300-variation","color-gray-700-variation","color-green-900-variation","color-red-700-variation","gradient-purple-blue"],allowedBorderColors:["color-yellow-300-variation","color-gray-300-variation","color-green-900-variation","color-red-700-variation","gradient-purple-blue"],borderColor:{attribute:"border-color"},ctas:{slot:"footer",size:"m"},style:"consonant",perUnitLabel:{tag:"span",slot:"per-unit-label"}},lt=class extends T{constructor(r){super(r)}priceOptionsProvider(r,t){r.dataset.template===ne&&(t.displayPlanType=this.card?.settings?.displayPlanType??!1,(r.dataset.template==="strikethrough"||r.dataset.template==="price")&&(t.displayPerUnit=!1))}getGlobalCSS(){return Gi}get badgeElement(){return this.card.querySelector('[slot="badge"]')}get mainPrice(){return this.card.querySelector(`[slot="heading-xs"] ${V}[data-template="price"]`)}async postCardUpdateHook(){this.legalAdjusted||await this.adjustLegal(),await super.postCardUpdateHook()}async adjustLegal(){if(!(this.legalAdjusted||!this.card.id))try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let r=this.mainPrice;if(!r)return;let t=r.cloneNode(!0);if(await r.onceSettled(),!r?.options)return;r.options.displayPerUnit&&(r.dataset.displayPerUnit="false"),r.options.displayTax&&(r.dataset.displayTax="false"),r.options.displayPlanType&&(r.dataset.displayPlanType="false"),t.setAttribute("data-template","legal"),r.parentNode.insertBefore(t,r.nextSibling),await t.onceSettled()}catch{}}renderLayout(){return pa`
            ${this.badge}
            <div class="body">
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${this.promoBottom?"":pa`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`}
                <slot name="body-xs"></slot>
                ${this.promoBottom?pa`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>`:""}
                <slot name="badge"></slot>
            </div>
            <hr />
            ${this.secureLabelFooter}
        `}};g(lt,"variantStyle",Vs`
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
    `);import{html as js,css as Ws}from"./lit-all.min.js";var Vi=`

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

`;var ji={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"body-xxs"},description:{tag:"div",slot:"body-xs"},ctas:{slot:"footer",size:"m"},backgroundImage:{tag:"div",slot:"bg-image"},style:"consonant"},dt=class extends T{constructor(r){super(r)}getGlobalCSS(){return Vi}removeFocusFromModalClose(){let r=this.card.closest(".dialog-modal");r&&r.querySelector(".dialog-close")?.blur()}async postCardUpdateHook(){this.removeFocusFromModalClose(),await super.postCardUpdateHook()}renderLayout(){return js`
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
        `}};g(dt,"variantStyle",Ws`
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
    `);import{html as ma,css as Ys}from"./lit-all.min.js";var Wi=`
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

@media screen and ${z} {
  :root {
    --consonant-merch-card-special-offers-width: 302px;
  }
}

@media screen and ${O} {
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

@media screen and ${Z} {
  .four-merch-cards.special-offers {
    grid-template-columns: repeat(4, minmax(302px, var(--consonant-merch-card-special-offers-width)));
  }
}
`;var Yi={cardName:{attribute:"name"},backgroundImage:{tag:"div",slot:"bg-image"},subtitle:{tag:"p",slot:"detail-m"},title:{tag:"h3",slot:"heading-xs"},prices:{tag:"p",slot:"heading-xs-price"},description:{tag:"div",slot:"body-xs"},ctas:{slot:"footer",size:"l"},badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300-special-offers"},allowedBadgeColors:["spectrum-yellow-300-special-offers","spectrum-gray-300-special-offers","spectrum-green-900-special-offers"],allowedBorderColors:["spectrum-yellow-300-special-offers","spectrum-gray-300-special-offers","spectrum-green-900-special-offers"],borderColor:{attribute:"border-color"}},ht=class extends T{constructor(r){super(r)}get headingSelector(){return'[slot="detail-m"]'}getGlobalCSS(){return Wi}renderLayout(){return ma`${this.cardImage}
            <div class="body">
                <slot name="detail-m"></slot>
                <slot name="heading-xs"></slot>
                <slot name="heading-xs-price"></slot>
                <slot name="body-xs"></slot>
                <slot name="badge"></slot>
            </div>
            ${this.evergreen?ma`
                      <div
                          class="detail-bg-container"
                          style="background: ${this.card.detailBg}"
                      >
                          <slot name="detail-bg"></slot>
                      </div>
                  `:ma`
                      <hr />
                      ${this.secureLabelFooter}
                  `}
            <slot></slot>`}};g(ht,"variantStyle",Ys`
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
    `);import{html as Xs,css as Ks}from"./lit-all.min.js";var Xi=`
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
@media screen and ${z} {
  merch-card[variant="simplified-pricing-express"] [slot="body-xs"] p:first-child mas-mnemonic:first-child {
    --tooltip-left-offset: 0;
  }
}

/* Tooltip containers - overflow handled by Shadow DOM */

/* Mobile styles */
@media screen and ${z} {
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
@media screen and ${z} {
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
@media screen and ${O} and ${X} {
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
`;var ua={title:{tag:"h3",slot:"heading-xs",maxCount:250,withSuffix:!0},badge:{tag:"div",slot:"badge",default:"spectrum-blue-400"},allowedBadgeColors:["spectrum-blue-400","spectrum-gray-300","spectrum-yellow-300","gradient-purple-blue","gradient-firefly-spectrum"],description:{tag:"div",slot:"body-xs",maxCount:2e3,withSuffix:!1},prices:{tag:"div",slot:"price"},callout:{tag:"div",slot:"callout-content",editorLabel:"Price description"},ctas:{slot:"cta",size:"XL"},borderColor:{attribute:"border-color",specialValues:{gray:"var(--spectrum-gray-300)",blue:"var(--spectrum-blue-400)","gradient-purple-blue":"linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)","gradient-firefly-spectrum":"linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%)"}},disabledAttributes:["badgeColor","badgeBorderColor","trialBadgeColor","trialBadgeBorderColor"],supportsDefaultChild:!0},pt=class extends T{getGlobalCSS(){return Xi}get aemFragmentMapping(){return ua}get headingSelector(){return'[slot="heading-xs"]'}get badge(){return this.card.querySelector('[slot="badge"]')}syncHeights(){if(this.card.getBoundingClientRect().width===0)return;let r=this.card.shadowRoot;if(!r)return;["header","price-container","cta"].forEach(i=>this.updateCardElementMinHeight(r.querySelector(`.${i}`),i));let t=this.card.querySelector('[slot="body-xs"]');t&&this.updateCardElementMinHeight(t,"description");let a=this.card.querySelector('[slot="body-xs"] p:has(mas-mnemonic)');a&&this.updateCardElementMinHeight(a,"icons")}async postCardUpdateHook(){if(!this.card.isConnected)return;await super.postCardUpdateHook();let r=this.getContainer();if(!r)return;let t=r.querySelectorAll(`merch-card[variant="${this.card.variant}"]`),a=34;t.forEach(i=>{i.classList.remove("small-font-size-button"),i.querySelectorAll('[slot="cta"] sp-button, [slot="cta"] button, [slot="cta"] a.con-button, [slot="cta"] a.spectrum-Button, a[slot="cta"]').forEach(o=>{let s=o.textContent.trim().length>a;o.classList.toggle("small-font-size-button",s)})}),_.isDesktopOrUp&&t.forEach(i=>i.variantLayout?.syncHeights?.())}connectedCallbackHook(){!this.card||this.card.failed||(this.setupAccordion(),this.card?.hasAttribute("data-default-card")&&!er()&&this.card.setAttribute("data-expanded","true"),this.observeVisibility())}resyncSiblings(){let r=this.getContainer();r&&r.querySelectorAll(`merch-card[variant="${this.card.variant}"]`).forEach(t=>t.variantLayout?.syncHeights?.())}observeVisibility(){typeof ResizeObserver>"u"||(this.lastSyncedWidth=0,this.sizeObserver=new ResizeObserver(()=>{let r=this.card.getBoundingClientRect().width;r<=2||r===this.lastSyncedWidth||(this.lastSyncedWidth=r,this.resyncSiblings())}),this.sizeObserver.observe(this.card))}setupAccordion(){let r=this.card;if(!r)return;let t=()=>{if(er())r.removeAttribute("data-expanded");else{let i=r.hasAttribute("data-default-card");r.setAttribute("data-expanded",i?"true":"false")}};t();let a=window.matchMedia(z);this.mediaQueryListener=()=>{t()},a.addEventListener("change",this.mediaQueryListener)}disconnectedCallbackHook(){this.mediaQueryListener&&window.matchMedia(z).removeEventListener("change",this.mediaQueryListener),this.sizeObserver?.disconnect(),this.sizeObserver=null}handleChevronClick(r){r.preventDefault(),r.stopPropagation(),this.toggleExpanded()}handleCardClick(r){r.target.closest('.chevron-button, mas-mnemonic, button, a, [role="button"]')||(r.preventDefault(),this.toggleExpanded())}toggleExpanded(){let r=this.card;if(!r||er())return;let i=r.getAttribute("data-expanded")==="true"?"false":"true";r.setAttribute("data-expanded",i)}renderLayout(){return Xs`
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
        `}};g(pt,"variantStyle",Ks`
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
    `);import{html as Zi,css as Zs}from"./lit-all.min.js";var Ki=`
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
}
`;var ga={title:{tag:"h3",slot:"heading-xs",maxCount:250,withSuffix:!0},badge:{tag:"div",slot:"badge",default:"spectrum-blue-400"},allowedBadgeColors:["spectrum-blue-400","spectrum-gray-300","spectrum-yellow-300","gradient-purple-blue","gradient-firefly-spectrum"],description:{tag:"div",slot:"body-s",maxCount:2e3,withSuffix:!1},shortDescription:{tag:"div",slot:"short-description",maxCount:3e3,withSuffix:!1},callout:{tag:"div",slot:"callout-content",editorLabel:"Price description"},prices:{tag:"div",slot:"price"},trialBadge:{tag:"div",slot:"trial-badge"},ctas:{slot:"cta",size:"XL"},mnemonics:{size:"xs"},borderColor:{attribute:"border-color",specialValues:{gray:"var(--spectrum-gray-300)",blue:"var(--spectrum-blue-400)","gradient-purple-blue":"linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)","gradient-firefly-spectrum":"linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%)"}},showAllSpectrumColors:!0,multiWhatsIncluded:"true",disabledAttributes:[]},mt=class extends T{getGlobalCSS(){return Ki}get aemFragmentMapping(){return ga}get headingSelector(){return'[slot="heading-xs"]'}get badgeElement(){return this.card.querySelector('[slot="badge"]')}get badge(){return Zi`
            <div
                class="badge-wrapper"
                style="${this.badgeElement?"":"visibility: hidden"}"
            >
                <slot name="badge"></slot>
            </div>
        `}syncHeights(){if(this.card.getBoundingClientRect().width<=2)return;let r=this.card.shadowRoot;r&&["header","short-description","price-container","cta"].forEach(t=>this.updateCardElementMinHeight(r.querySelector(`.${t}`),t))}resyncSiblings(){let r=this.getContainer();r&&r.querySelectorAll(`merch-card[variant="${this.card.variant}"]`).forEach(t=>t.variantLayout?.syncHeights?.())}async postCardUpdateHook(){if(!this.card.isConnected)return;await super.postCardUpdateHook();let r=this.getContainer();if(r){let t=r.querySelectorAll(`merch-card[variant="${this.card.variant}"]`),a=49;t.forEach(i=>{i.classList.remove("small-font-size-button"),i.querySelectorAll('[slot="cta"] sp-button, [slot="cta"] button, [slot="cta"] a.con-button, [slot="cta"] a.spectrum-Button, a[slot="cta"]').forEach(o=>{let s=o.textContent.trim().length>a;o.classList.toggle("small-font-size-button",s)})})}window.matchMedia("(min-width: 768px)").matches&&this.resyncSiblings()}connectedCallbackHook(){!this.card||typeof ResizeObserver>"u"||(this.lastSyncedWidth=0,this.sizeObserver=new ResizeObserver(()=>{let r=this.card.getBoundingClientRect().width;r<=2||r===this.lastSyncedWidth||(this.lastSyncedWidth=r,this.resyncSiblings())}),this.sizeObserver.observe(this.card))}disconnectedCallbackHook(){this.sizeObserver?.disconnect(),this.sizeObserver=null}renderLayout(){return Zi`
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
        `}};g(mt,"variantStyle",Zs`
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
    `);import{html as fa,css as Qs,nothing as Js}from"./lit-all.min.js";var Qi=`
/* Headless variant: minimal container for label/value rows */
.headless {
    display: flex;
    flex-direction: column;
    padding: var(--consonant-merch-spacing-xs, 8px);
}
`;var Ji={cardName:{attribute:"name"},title:{tag:"p",slot:"heading-xs"},cardTitle:{tag:"p",slot:"heading-xs"},subtitle:{tag:"p",slot:"body-xxs"},description:{tag:"div",slot:"body-xs"},promoText:{tag:"p",slot:"promo-text"},shortDescription:{tag:"p",slot:"short-description"},callout:{tag:"div",slot:"callout-content"},quantitySelect:{tag:"div",slot:"quantity-select"},whatsIncluded:{tag:"div",slot:"whats-included"},addonConfirmation:{tag:"div",slot:"addon-confirmation"},badge:{tag:"div",slot:"badge"},trialBadge:{tag:"div",slot:"trial-badge"},prices:{tag:"p",slot:"prices"},backgroundImage:{tag:"div",slot:"bg-image"},ctas:{slot:"footer",size:"m"},addon:!0,secureLabel:!0,borderColor:{attribute:"border-color"},backgroundColor:{attribute:"background-color"},size:[],mnemonics:{size:"m"}},ec=[{slot:"bg-image",label:"Background Image"},{slot:"badge",label:"Badge"},{slot:"icons",label:"Mnemonic icon"},{slot:"heading-xs",label:"Title"},{slot:"body-xxs",label:"Subtitle"},{slot:"body-xs",label:"Product description"},{slot:"promo-text",label:"Promo Text"},{slot:"callout-content",label:"Callout text"},{slot:"short-description",label:"Short Description"},{slot:"trial-badge",label:"Trial Badge"},{slot:"prices",label:"Product price"},{slot:"quantity-select",label:"Quantity select"},{slot:"addon",label:"Addon"},{slot:"whats-included",label:"What's included"},{slot:"addon-confirmation",label:"Addon confirmation"},{slot:"footer",label:"CTAs"}],ut=class extends T{constructor(r){super(r)}getGlobalCSS(){return Qi}renderLayout(){return fa`
            <div class="headless">
                ${ec.map(({slot:r,label:t})=>fa`
                        <div class="headless-row">
                            <span class="headless-label">${t}</span>
                            <span class="headless-value">
                                <slot name="${r}"></slot>
                            </span>
                        </div>
                    `)}
                ${this.card.secureLabel?fa`
                          <div class="headless-row">
                              <span class="headless-label">Secure label</span>
                              <span class="headless-value">
                                  ${this.secureLabel}
                              </span>
                          </div>
                      `:Js}
            </div>
        `}};g(ut,"variantStyle",Qs`
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
    `);import{css as tc,html as rc}from"./lit-all.min.js";var en=`
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
`;var tn={title:{tag:"p",slot:"title"},prices:{tag:"p",slot:"prices"},description:{tag:"p",slot:"description"},planType:!0,ctas:{slot:"ctas",size:"S"}},gt=class extends T{constructor(){super(...arguments);g(this,"legal")}async postCardUpdateHook(){await super.postCardUpdateHook(),this.adjustLegal()}getGlobalCSS(){return en}get headingSelector(){return'[slot="title"]'}priceOptionsProvider(t,a){a.literals={...a.literals,strikethroughAriaLabel:"",alternativePriceAriaLabel:""},a.space=!0,a.displayAnnual=this.card.settings?.displayAnnual??!1}adjustLegal(){if(this.legal!==void 0)return;let t=this.card.querySelector(`${V}[data-template="price"]`);if(!t)return;let a=t.cloneNode(!0);this.legal=a,t.dataset.displayTax="false",t.dataset.displayPerUnit="false",a.dataset.template="legal",a.dataset.displayPlanType=this.card?.settings?.displayPlanType??!0,a.setAttribute("slot","legal"),this.card.appendChild(a)}renderLayout(){return rc`
            ${this.badge}
            <div class="body">
                <slot name="title"></slot>
                <slot name="prices"></slot>
                <slot name="legal"></slot>
                <slot name="description"></slot>
                <slot name="ctas"></slot>
            </div>
        `}};g(gt,"variantStyle",tc`
        :host([variant='mini']) {
            min-width: 209px;
            min-height: 103px;
            background-color: var(--spectrum-background-base-color);
            border: 1px solid var(--consonant-merch-card-border-color, #dadada);
        }
    `);import{html as ac,css as ic}from"./lit-all.min.js";var rn=`
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
`;var va={mnemonics:{size:"s"},title:{tag:"h3",slot:"heading-xxs",maxCount:250,withSuffix:!0},description:{tag:"div",slot:"body-s",maxCount:2e3,withSuffix:!1},whatsIncluded:{tag:"div",slot:"whats-included"},badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300"},trialBadge:{tag:"div",slot:"trial-badge",default:"spectrum-green-800"},prices:{tag:"p",slot:"price"},ctas:{slot:"cta",size:"M"},addonConfirmation:{tag:"div",slot:"addon-confirmation"},borderColor:{attribute:"border-color",specialValues:{gray:"--spectrum-gray-300","gradient-purple-blue":"var(--gradient-purple-blue)","gradient-firefly-spectrum":"var(--gradient-firefly-spectrum)"}}},ft=class extends T{getGlobalCSS(){return rn}get aemFragmentMapping(){return va}renderLayout(){return ac`
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
        `}};g(ft,"variantStyle",ic`
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
    `);var an=new Map;var j=(e,r,t=null,a=null,i)=>{an.set(e,{class:r,fragmentMapping:t,style:a,collectionOptions:i})};j("catalog",it,Ei,it.variantStyle);j("image",Fe);j("inline-heading",nr);j("mini-compare-chart",nt,Pi,nt.variantStyle);j("mini-compare-chart-mweb",ot,Ri,ot.variantStyle);j("plans",te,cr,te.variantStyle,te.collectionOptions);j("plans-students",te,Oi,te.variantStyle,te.collectionOptions);j("plans-education",te,Ni,te.variantStyle,te.collectionOptions);j("plans-v2",Re,Hi,Re.variantStyle,Re.collectionOptions);j("plans-bizpro",st,Fi,st.variantStyle);j("product",ct,$i,ct.variantStyle);j("segment",lt,qi,lt.variantStyle);j("media",dt,ji,dt.variantStyle);j("headless",ut,Ji,ut.variantStyle);j("special-offers",ht,Yi,ht.variantStyle);j("simplified-pricing-express",pt,ua,pt.variantStyle);j("full-pricing-express",mt,ga,mt.variantStyle);j("mini",gt,tn,gt.variantStyle);j("image",Fe,Ai,Fe.variantStyle);j("fries",ft,va,ft.variantStyle);function ir(e){return an.get(e)?.fragmentMapping}var nn="tacocat.js";var xa=(e,r)=>String(e??"").toLowerCase()==String(r??"").toLowerCase(),on=e=>`${e??""}`.replace(/[&<>'"]/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[r]??r)??"";function H(e,r={},{metadata:t=!0,search:a=!0,storage:i=!0}={}){let n;if(a&&n==null){let o=new URLSearchParams(window.location.search),s=vt(a)?a:e;n=o.get(s)}if(i&&n==null){let o=vt(i)?i:e;n=window.sessionStorage.getItem(o)??window.localStorage.getItem(o)}if(t&&n==null){let o=oc(vt(t)?t:e);n=document.documentElement.querySelector(`meta[name="${o}"]`)?.content}return n??r[e]}var nc=e=>typeof e=="boolean",dr=e=>typeof e=="function",hr=e=>typeof e=="number",sn=e=>e!=null&&typeof e=="object";var vt=e=>typeof e=="string",cn=e=>vt(e)&&e,It=e=>hr(e)&&Number.isFinite(e)&&e>0;function pr(e,r=t=>t==null||t===""){return e!=null&&Object.entries(e).forEach(([t,a])=>{r(a)&&delete e[t]}),e}function w(e,r){if(nc(e))return e;let t=String(e);return t==="1"||t==="true"?!0:t==="0"||t==="false"?!1:r}function Dt(e,r,t){let a=Object.values(r);return a.find(i=>xa(i,e))??t??a[0]}function oc(e=""){return String(e).replace(/(\p{Lowercase_Letter})(\p{Uppercase_Letter})/gu,(r,t,a)=>`${t}-${a}`).replace(/\W+/gu,"-").toLowerCase()}function ln(e,r=1){return hr(e)||(e=Number.parseInt(e,10)),!Number.isNaN(e)&&e>0&&Number.isFinite(e)?e:r}var sc=Date.now(),ba=()=>`(+${Date.now()-sc}ms)`,mr=new Set,cc=w(H("tacocat.debug",{},{metadata:!1}),!1);function dn(e){let r=`[${nn}/${e}]`,t=(o,s,...l)=>o?!0:(i(s,...l),!1),a=cc?(o,...s)=>{console.debug(`${r} ${o}`,...s,ba())}:()=>{},i=(o,...s)=>{let l=`${r} ${o}`;mr.forEach(([c])=>c(l,...s))};return{assert:t,debug:a,error:i,warn:(o,...s)=>{let l=`${r} ${o}`;mr.forEach(([,c])=>c(l,...s))}}}function lc(e,r){let t=[e,r];return mr.add(t),()=>{mr.delete(t)}}lc((e,...r)=>{console.error(e,...r,ba())},(e,...r)=>{console.warn(e,...r,ba())});var dc="no promo",hn="promo-tag",hc="yellow",pc="neutral",mc=(e,r,t)=>{let a=n=>n||dc,i=t?` (was "${a(r)}")`:"";return`${a(e)}${i}`},uc="cancel-context",ur=(e,r)=>{let t=e===uc,a=!t&&e?.length>0,i=(a||t)&&(r&&r!=e||!r&&!t),n=i&&a||!i&&!!r,o=n?e||r:void 0;return{effectivePromoCode:o,overridenPromoCode:e,className:n?hn:`${hn} no-promo`,text:mc(o,r,i),variant:n?hc:pc,isOverriden:i}};var ya;(function(e){e.BASE="BASE",e.TRIAL="TRIAL",e.PROMOTION="PROMOTION"})(ya||(ya={}));var oe;(function(e){e.MONTH="MONTH",e.YEAR="YEAR",e.TWO_YEARS="TWO_YEARS",e.THREE_YEARS="THREE_YEARS",e.PERPETUAL="PERPETUAL",e.TERM_LICENSE="TERM_LICENSE",e.ACCESS_PASS="ACCESS_PASS",e.THREE_MONTHS="THREE_MONTHS",e.SIX_MONTHS="SIX_MONTHS"})(oe||(oe={}));var de;(function(e){e.ANNUAL="ANNUAL",e.MONTHLY="MONTHLY",e.TWO_YEARS="TWO_YEARS",e.THREE_YEARS="THREE_YEARS",e.P1D="P1D",e.P1Y="P1Y",e.P3Y="P3Y",e.P10Y="P10Y",e.P15Y="P15Y",e.P3D="P3D",e.P7D="P7D",e.P30D="P30D",e.HALF_YEARLY="HALF_YEARLY",e.QUARTERLY="QUARTERLY"})(de||(de={}));var wa;(function(e){e.INDIVIDUAL="INDIVIDUAL",e.TEAM="TEAM",e.ENTERPRISE="ENTERPRISE"})(wa||(wa={}));var Ea;(function(e){e.COM="COM",e.EDU="EDU",e.GOV="GOV"})(Ea||(Ea={}));var Sa;(function(e){e.DIRECT="DIRECT",e.INDIRECT="INDIRECT"})(Sa||(Sa={}));var Aa;(function(e){e.ENTERPRISE_PRODUCT="ENTERPRISE_PRODUCT",e.ETLA="ETLA",e.RETAIL="RETAIL",e.VIP="VIP",e.VIPMP="VIPMP",e.FREE="FREE"})(Aa||(Aa={}));var Ca="ABM",Ta="PUF",_a="M2M",ka="PERPETUAL",Pa="P3Y",gc="TAX_INCLUSIVE_DETAILS",fc="TAX_EXCLUSIVE",pn={ABM:Ca,PUF:Ta,M2M:_a,PERPETUAL:ka,P3Y:Pa},ym={[Ca]:{commitment:oe.YEAR,term:de.MONTHLY},[Ta]:{commitment:oe.YEAR,term:de.ANNUAL},[_a]:{commitment:oe.MONTH,term:de.MONTHLY},[ka]:{commitment:oe.PERPETUAL,term:void 0},[Pa]:{commitment:oe.THREE_MONTHS,term:de.P3Y}},mn="Value is not an offer",gr=e=>{if(typeof e!="object")return mn;let{commitment:r,term:t}=e,a=vc(r,t);return{...e,planType:a}};var vc=(e,r)=>{switch(e){case void 0:return mn;case"":return"";case oe.YEAR:return r===de.MONTHLY?Ca:r===de.ANNUAL?Ta:"";case oe.MONTH:return r===de.MONTHLY?_a:"";case oe.PERPETUAL:return ka;case oe.TERM_LICENSE:return r===de.P3Y?Pa:"";default:return""}};function un(e){let{priceDetails:r}=e,{price:t,priceWithoutDiscount:a,priceWithoutTax:i,priceWithoutDiscountAndTax:n,taxDisplay:o}=r;if(o!==gc)return e;let s={...e,priceDetails:{...r,price:i??t,priceWithoutDiscount:n??a,taxDisplay:fc}};return s.offerType==="TRIAL"&&s.priceDetails.price===0&&(s.priceDetails.price=s.priceDetails.priceWithoutDiscount),s}var Ge={clientId:"merch-at-scale",delimiter:"\xB6",ignoredProperties:["analytics","literals","element"],serializableTypes:["Array","Object"],sampleRate:1,severity:"e",tags:"acom",isProdDomain:!1},gn=1e3;function xc(e){return e instanceof Error||typeof e?.originatingRequest=="string"}function fn(e){if(e==null)return;let r=typeof e;if(r==="function")return e.name?`function ${e.name}`:"function";if(r==="object"){if(e instanceof Error)return e.message;if(typeof e.originatingRequest=="string"){let{message:a,originatingRequest:i,status:n}=e;return[a,n,i].filter(Boolean).join(" ")}let t=e[Symbol.toStringTag]??Object.getPrototypeOf(e).constructor.name;if(!Ge.serializableTypes.includes(t))return t}return e}function bc(e,r){if(!Ge.ignoredProperties.includes(e))return fn(r)}var La={append(e){if(e.level!=="error")return;let{message:r,params:t}=e,a=[],i=[],n=r;t.forEach(c=>{c!=null&&(xc(c)?a:i).push(c)}),a.length&&(n+=` ${a.map(fn).join(" ")}`);let{pathname:o,search:s}=window.location,l=`${Ge.delimiter}page=${o}${s}`;l.length>gn&&(l=`${l.slice(0,gn)}<trunc>`),n+=l,i.length&&(n+=`${Ge.delimiter}facts=`,n+=JSON.stringify(i,bc)),window.lana?.log(n,Ge)}};function fr(e){Object.assign(Ge,Object.fromEntries(Object.entries(e).filter(([r,t])=>r in Ge&&t!==""&&t!==null&&t!==void 0&&!Number.isNaN(t))))}var vn={LOCAL:"local",PROD:"prod",STAGE:"stage"},Ma={DEBUG:"debug",ERROR:"error",INFO:"info",WARN:"warn"},Ra=new Set,za=new Set,xn=new Map,bn={append({level:e,message:r,params:t,timestamp:a,source:i}){console[e](`${a}ms [${i}] %c${r}`,"font-weight: bold;",...t)}},yn={filter:({level:e})=>e!==Ma.DEBUG},yc={filter:()=>!1};function wc(e,r,t,a,i){return{level:e,message:r,namespace:t,get params(){return a.length===1&&dr(a[0])&&(a=a[0](),Array.isArray(a)||(a=[a])),a},source:i,timestamp:performance.now().toFixed(3)}}function Ec(e){[...za].every(r=>r(e))&&Ra.forEach(r=>r(e))}function wn(e){let r=(xn.get(e)??0)+1;xn.set(e,r);let t=`${e} #${r}`,a={id:t,namespace:e,module:i=>wn(`${a.namespace}/${i}`),updateConfig:fr};return Object.values(Ma).forEach(i=>{a[i]=(n,...o)=>Ec(wc(i,n,e,o,t))}),Object.seal(a)}function vr(...e){e.forEach(r=>{let{append:t,filter:a}=r;dr(a)&&za.add(a),dr(t)&&Ra.add(t)})}function Sc(e={}){let{name:r}=e,t=w(H("commerce.debug",{search:!0,storage:!0}),r===vn.LOCAL);return vr(t?bn:yn),r===vn.PROD&&vr(La),re}function Ac(){Ra.clear(),za.clear()}var re={...wn(Qr),Level:Ma,Plugins:{consoleAppender:bn,debugFilter:yn,quietFilter:yc,lanaAppender:La},init:Sc,reset:Ac,use:vr};var Cc="mas-commerce-service",Tc=re.module("utilities"),_c={requestId:kt,etag:"Etag",lastModified:"Last-Modified",serverTiming:"server-timing"};function Ht(e,{country:r,forceTaxExclusive:t}){let a;if(e.length<2)a=e;else{let i=r==="GB"?"EN":"MULT";e.sort((n,o)=>n.language===i?-1:o.language===i?1:0),e.sort((n,o)=>!n.term&&o.term?-1:n.term&&!o.term?1:0),a=[e[0]]}return t&&(a=a.map(un)),a}var En=(e,r)=>{let t=e.reduce((a,i)=>a+(r(i)||0),0);return t>0?Math.round(t*100)/100:void 0};function Na(e){if(!e||e.length===0)return null;if(e.length===1)return e[0];let[r,...t]=e;for(let s of t){let l=[["commitment","commitment types"],["term","terms"],["priceDetails.formatString","currency formats"]];for(let[c,d]of l){let p=c.includes(".")?r.priceDetails?.formatString:r[c],m=c.includes(".")?s.priceDetails?.formatString:s[c];m!==p&&Tc.warn(`Offers have different ${d}, summing may produce unexpected results`,{expected:p,actual:m})}}let a=[["price",s=>s.priceDetails?.price],["priceWithoutDiscount",s=>s.priceDetails?.priceWithoutDiscount],["priceWithoutTax",s=>s.priceDetails?.priceWithoutTax],["priceWithoutDiscountAndTax",s=>s.priceDetails?.priceWithoutDiscountAndTax]],i={};for(let[s,l]of a){let c=En(e,l);c!==void 0&&(i[s]=c)}let n=e.some(s=>s.priceDetails?.annualized),o;if(n){let s=[["annualizedPrice",l=>l.priceDetails?.annualized?.annualizedPrice],["annualizedPriceWithoutTax",l=>l.priceDetails?.annualized?.annualizedPriceWithoutTax],["annualizedPriceWithoutDiscount",l=>l.priceDetails?.annualized?.annualizedPriceWithoutDiscount],["annualizedPriceWithoutDiscountAndTax",l=>l.priceDetails?.annualized?.annualizedPriceWithoutDiscountAndTax]];o={};for(let[l,c]of s){let d=En(e,c);d!==void 0&&(o[l]=d)}}return{...r,offerSelectorIds:e.flatMap(s=>s.offerSelectorIds||[]),priceDetails:{...r.priceDetails,...i,...o&&{annualized:o}}}}var xr=e=>window.setTimeout(e);function xt(e,r=1){if(e==null)return[r];let t=(Array.isArray(e)?e:String(e).split(",")).map(ln).filter(It);return t.length||(t=[r]),t}function br(e){return e==null?[]:(Array.isArray(e)?e:String(e).split(",")).filter(cn)}function ae(){return document.getElementsByTagName(Cc)?.[0]}function Sn(e){let r={};if(!e?.headers)return r;let t=e.headers;for(let[a,i]of Object.entries(_c)){let n=t.get(i);n&&(n=n.replace(/[,;]/g,"|"),n=n.replace(/[| ]+/g,"|"),r[a]=n)}return r}var bt=class e extends Error{constructor(r,t,a){if(super(r,{cause:a}),this.name="MasError",t.response){let i=t.response.headers?.get(kt);i&&(t.requestId=i),t.response.status&&(t.status=t.response.status,t.statusText=t.response.statusText),t.response.url&&(t.url=t.response.url)}delete t.response,this.context=t,Error.captureStackTrace&&Error.captureStackTrace(this,e)}toString(){let r=Object.entries(this.context||{}).map(([a,i])=>`${a}: ${JSON.stringify(i)}`).join(", "),t=`${this.name}: ${this.message}`;return r&&(t+=` (${r})`),this.cause&&(t+=`
Caused by: ${this.cause}`),t}};var kc={[pe]:jr,[Pe]:Wr,[Ee]:Yr},Pc={[pe]:Zr,[Ee]:tt},Bt,Ne=class{constructor(r){D(this,Bt);g(this,"changes",new Map);g(this,"connected",!1);g(this,"error");g(this,"log");g(this,"options");g(this,"promises",[]);g(this,"state",Pe);g(this,"timer",null);g(this,"value");g(this,"version",0);g(this,"wrapperElement");this.wrapperElement=r,this.log=re.module("mas-element")}update(){[pe,Pe,Ee].forEach(r=>{this.wrapperElement.classList.toggle(kc[r],r===this.state)})}notify(){(this.state===Ee||this.state===pe)&&(this.state===Ee?this.promises.forEach(({resolve:t})=>t(this.wrapperElement)):this.state===pe&&this.promises.forEach(({reject:t})=>t(this.error)),this.promises=[]);let r=this.error;this.error instanceof bt&&(r={message:this.error.message,...this.error.context}),this.wrapperElement.dispatchEvent(new CustomEvent(Pc[this.state],{bubbles:!0,composed:!0,detail:r}))}attributeChangedCallback(r,t,a){this.changes.set(r,a),this.requestUpdate()}connectedCallback(){M(this,Bt,ae()),this.requestUpdate(!0)}disconnectedCallback(){this.connected&&(this.connected=!1,this.log?.debug("Disconnected:",{element:this.wrapperElement}))}onceSettled(){let{error:r,promises:t,state:a}=this;return Ee===a?Promise.resolve(this.wrapperElement):pe===a?Promise.reject(r):new Promise((i,n)=>{t.push({resolve:i,reject:n})})}toggleResolved(r,t,a){return r!==this.version?!1:(a!==void 0&&(this.options=a),this.state=Ee,this.value=t,this.update(),this.log?.debug("Resolved:",{element:this.wrapperElement,value:t}),xr(()=>this.notify()),!0)}toggleFailed(r,t,a){if(r!==this.version)return!1;a!==void 0&&(this.options=a),this.error=t,this.state=pe,this.update();let i=this.wrapperElement.getAttribute("is");return this.log?.error(`${i}: Failed to render: ${t.message}`,{element:this.wrapperElement,...t.context,...x(this,Bt)?.duration}),xr(()=>this.notify()),!0}togglePending(r){return this.version++,r&&(this.options=r),this.state=Pe,this.update(),this.log?.debug("Pending:",{osi:this.wrapperElement?.options?.wcsOsi}),this.version}requestUpdate(r=!1){if(!this.wrapperElement.isConnected||!ae()||this.timer)return;let{error:t,options:a,state:i,value:n,version:o}=this;this.state=Pe,this.timer=xr(async()=>{this.timer=null;let s=null;if(this.changes.size&&(s=Object.fromEntries(this.changes.entries()),this.changes.clear()),this.connected?this.log?.debug("Updated:",{element:this.wrapperElement,changes:s}):(this.connected=!0,this.log?.debug("Connected:",{element:this.wrapperElement,changes:s})),s||r)try{await this.wrapperElement.render?.()===!1&&this.state===Pe&&this.version===o&&(this.state=i,this.error=t,this.value=n,this.update(),this.notify())}catch(l){this.toggleFailed(this.version,l,a)}})}};Bt=new WeakMap;function An(e={}){return Object.entries(e).forEach(([r,t])=>{(t==null||t===""||t?.length===0)&&delete e[r]}),e}function yr(e,r={}){let{tag:t,is:a}=e,i=document.createElement(t,{is:a});return i.setAttribute("is",a),Object.assign(i.dataset,An(r)),i}function Cn(e,r={}){return e instanceof HTMLElement?(Object.assign(e.dataset,An(r)),e):null}function Lc(e){return`https://${e==="PRODUCTION"?"www.adobe.com":"www.stage.adobe.com"}/offers/promo-terms.html`}var je,qe=class qe extends HTMLAnchorElement{constructor(){super();g(this,"masElement",new Ne(this));D(this,je);this.setAttribute("is",qe.is)}get isUptLink(){return!0}initializeWcsData(t,a){this.setAttribute("data-wcs-osi",t),a&&this.setAttribute("data-promotion-code",a)}attributeChangedCallback(t,a,i){this.masElement.attributeChangedCallback(t,a,i)}connectedCallback(){this.masElement.connectedCallback(),M(this,je,Lt()),x(this,je)&&(this.log=x(this,je).log.module("upt-link"))}disconnectedCallback(){this.masElement.disconnectedCallback(),M(this,je,void 0)}requestUpdate(t=!1){this.masElement.requestUpdate(t)}onceSettled(){return this.masElement.onceSettled()}async render(){let t=Lt();if(!t)return!1;this.dataset.imsCountry||t.imsCountryPromise.then(o=>{o&&(this.dataset.imsCountry=o)});let a=t.collectCheckoutOptions({},this);if(!a.wcsOsi)return this.log.error("Missing 'data-wcs-osi' attribute on upt-link."),!1;let i=this.masElement.togglePending(a),n=t.resolveOfferSelectors(a);try{let[[o]]=await Promise.all(n),{country:s,language:l,env:c}=a,d=`locale=${l}_${s}&country=${s}&offer_id=${o.offerId}`,p=this.getAttribute("data-promotion-code");p&&(d+=`&promotion_code=${encodeURIComponent(p)}`),this.href=`${Lc(c)}?${d}`,this.masElement.toggleResolved(i,o,a)}catch(o){let s=new Error(`Could not resolve offer selectors for id: ${a.wcsOsi}.`,o.message);return this.masElement.toggleFailed(i,s,a),!1}}static createFrom(t){let a=new qe;for(let i of t.attributes)i.name!=="is"&&(i.name==="class"&&i.value.includes("upt-link")?a.setAttribute("class",i.value.replace("upt-link","").trim()):a.setAttribute(i.name,i.value));return a.innerHTML=t.innerHTML,a.setAttribute("tabindex",0),a}};je=new WeakMap,g(qe,"is","upt-link"),g(qe,"tag","a"),g(qe,"observedAttributes",["data-wcs-osi","data-promotion-code","data-ims-country"]);var Ve=qe;window.customElements.get(Ve.is)||window.customElements.define(Ve.is,Ve,{extends:Ve.tag});function Tn(e){return e&&(e.startsWith("plans")?"plans":e)}var Mc="p_draft_landscape",Rc="/store/",zc=new Map([["countrySpecific","cs"],["customerSegment","cs"],["quantity","q"],["authCode","code"],["checkoutPromoCode","apc"],["rurl","rUrl"],["curl","cUrl"],["ctxrturl","ctxRtUrl"],["country","co"],["language","lang"],["clientId","cli"],["context","ctx"],["productArrangementCode","pa"],["addonProductArrangementCode","ao"],["offerType","ot"],["marketSegment","ms"]]),Oa=new Set(["af","ai","ao","apc","appctxid","cli","co","cs","csm","ctx","ctxRtUrl","DCWATC","dp","fr","gsp","ijt","lang","lo","mal","ms","mv","mv2","nglwfdata","ot","otac","pa","pcid","promoid","q","rf","sc","scl","sdid","sid","spint","svar","th","thm","trackingid","usid","workflowid","context.guid","so.ca","so.su","so.tr","so.va"]),Nc=["env","workflowStep","clientId","country"],Oc=["/tw/","/hk_zh/"];function Ic(e){let r=e??"";return Oc.some(t=>r.startsWith(t))}function Dc(){if(typeof window>"u")return!1;let e=[window.location.pathname];try{window.parent!==window&&e.push(window.parent.location.pathname)}catch{}return e.some(Ic)}function Ia(e){if(!Dc())return e instanceof URL?e.toString():String(e);let r;try{r=e instanceof URL?e:new URL(e)}catch{return String(e)}r.searchParams.set("lang","zh-Hant");for(let t of[...r.searchParams.keys()])/^items\[\d+]\[lang]$/.test(t)&&r.searchParams.set(t,"zh-Hant");return r.toString()}var _n=new Set(["gid","gtoken","notifauditid","cohortid","productname","sdid","attimer","gcsrc","gcprog","gcprogcat","gcpagetype","mv","mv2"]),kn=e=>zc.get(e)??e;function wr(e,r,t){for(let[a,i]of Object.entries(e)){let n=kn(a);i!=null&&t.has(n)&&r.set(n,i)}}function Hc(e){switch(e){case ia.PRODUCTION:return"https://commerce.adobe.com";default:return"https://commerce-stg.adobe.com"}}function Bc(e,r){for(let t in e){let a=e[t];for(let[i,n]of Object.entries(a)){if(n==null)continue;let o=kn(i);r.set(`items[${t}][${o}]`,n)}}}function Fc({url:e,modal:r,is3in1:t}){if(!t||!e?.searchParams)return e;e.searchParams.set("rtc","t"),e.searchParams.set("lo","sl");let a=e.searchParams.get("af");return e.searchParams.set("af",[a,"uc_new_user_iframe","uc_new_system_close"].filter(Boolean).join(",")),e.searchParams.get("cli")!=="doc_cloud"&&e.searchParams.set("cli",r===Be.CRM?"creative":"mini_plans"),e}function Uc(e){let r=new URLSearchParams(window.location.search),t={};_n.forEach(a=>{let i=r.get(a);i!==null&&(t[a]=i)}),Object.keys(t).length>0&&wr(t,e.searchParams,_n)}function Pn(e){$c(e);let{env:r,items:t,workflowStep:a,marketSegment:i,customerSegment:n,offerType:o,productArrangementCode:s,landscape:l,modal:c,is3in1:d,preselectPlan:p,...m}=e,h=new URL(Hc(r));if(h.pathname=`${Rc}${a}`,a!==ee.SEGMENTATION&&a!==ee.CHANGE_PLAN_TEAM_PLANS&&Bc(t,h.searchParams),wr({...m},h.searchParams,Oa),Uc(h),l===Le.DRAFT&&wr({af:Mc},h.searchParams,Oa),a===ee.SEGMENTATION){let u={marketSegment:i,offerType:o,customerSegment:n,productArrangementCode:s,quantity:t?.[0]?.quantity,addonProductArrangementCode:s?t?.find(f=>f.productArrangementCode!==s)?.productArrangementCode:t?.[1]?.productArrangementCode};p?.toLowerCase()==="edu"?h.searchParams.set("ms","EDU"):p?.toLowerCase()==="team"&&h.searchParams.set("cs","TEAM"),wr(u,h.searchParams,Oa),h.searchParams.get("ot")==="PROMOTION"&&h.searchParams.delete("ot"),h=Fc({url:h,modal:c,is3in1:d})}return Ia(h)}function $c(e){for(let r of Nc)if(!e[r])throw new Error(`Argument "checkoutData" is not valid, missing: ${r}`);if(e.workflowStep!==ee.SEGMENTATION&&e.workflowStep!==ee.CHANGE_PLAN_TEAM_PLANS&&!e.items)throw new Error('Argument "checkoutData" is not valid, missing: items');return!0}var Gc=/[0-9\-+#]/,qc=/[^\d\-+#]/g;function Ln(e){return e.search(Gc)}function Vc(e="#.##"){let r={},t=e.length,a=Ln(e);r.prefix=a>0?e.substring(0,a):"";let i=Ln(e.split("").reverse().join("")),n=t-i,o=e.substring(n,n+1),s=n+(o==="."||o===","?1:0);r.suffix=i>0?e.substring(s,t):"",r.mask=e.substring(a,s),r.maskHasNegativeSign=r.mask.charAt(0)==="-",r.maskHasPositiveSign=r.mask.charAt(0)==="+";let l=r.mask.match(qc);return r.decimal=l&&l[l.length-1]||".",r.separator=l&&l[1]&&l[0]||",",l=r.mask.split(r.decimal),r.integer=l[0],r.fraction=l[1],r}function jc(e,r,t){let a=!1,i={value:e};e<0&&(a=!0,i.value=-i.value),i.sign=a?"-":"",i.value=Number(i.value).toFixed(r.fraction&&r.fraction.length),i.value=Number(i.value).toString();let n=r.fraction&&r.fraction.lastIndexOf("0"),[o="0",s=""]=i.value.split(".");return(!s||s&&s.length<=n)&&(s=n<0?"":(+`0.${s}`).toFixed(n+1).replace("0.","")),i.integer=o,i.fraction=s,Wc(i,r),(i.result==="0"||i.result==="")&&(a=!1,i.sign=""),!a&&r.maskHasPositiveSign?i.sign="+":a&&r.maskHasPositiveSign?i.sign="-":a&&(i.sign=t&&t.enforceMaskSign&&!r.maskHasNegativeSign?"":"-"),i}function Wc(e,r){e.result="";let t=r.integer.split(r.separator),a=t.join(""),i=a&&a.indexOf("0");if(i>-1)for(;e.integer.length<a.length-i;)e.integer=`0${e.integer}`;else Number(e.integer)===0&&(e.integer="");let n=t[1]&&t[t.length-1].length;if(n){let o=e.integer.length,s=o%n;for(let l=0;l<o;l++)e.result+=e.integer.charAt(l),!((l-s+1)%n)&&l<o-n&&(e.result+=r.separator)}else e.result=e.integer;return e.result+=r.fraction&&e.fraction?r.decimal+e.fraction:"",e}function Yc(e,r,t={}){if(!e||isNaN(Number(r)))return r;let a=Vc(e),i=jc(r,a,t);return a.prefix+i.sign+i.result+a.suffix}var Mn=Yc;var Rn=".",Xc=",",Nn=/^\s+/,On=/\s+$/,zn="&nbsp;",Da=e=>e*12,Ye=(e,r,t=1)=>{if(!e)return!1;let{start:a,end:i,displaySummary:{amount:n,duration:o,minProductQuantity:s=1,outcomeType:l}={}}=e;if(!(n&&o&&l)||t<s)return!1;let c=r?new Date(r):new Date;if(!a||!i)return!1;let d=new Date(a),p=new Date(i);return c>=d&&c<=p},We={MONTH:"MONTH",YEAR:"YEAR"},Kc={[ce.ANNUAL]:12,[ce.MONTHLY]:1,[ce.THREE_YEARS]:36,[ce.TWO_YEARS]:24},Ha=(e,r)=>({accept:e,round:r}),Zc=[Ha(({divisor:e,price:r})=>r%e==0,({divisor:e,price:r})=>r/e),Ha(({usePrecision:e})=>e,({divisor:e,price:r})=>Math.round(r/e*100)/100),Ha(()=>!0,({divisor:e,price:r})=>Math.ceil(Math.floor(r*100/e)/100))],Ba={[He.YEAR]:{[ce.MONTHLY]:We.MONTH,[ce.ANNUAL]:We.YEAR},[He.MONTH]:{[ce.MONTHLY]:We.MONTH}},Qc=(e,r)=>e.indexOf(`'${r}'`)===0,Jc=(e,r=!0)=>{let t=e.replace(/'.*?'/,"").trim(),a=Dn(t);return!!a?r||(t=t.replace(/[,\.]0+/,a)):t=t.replace(/\s?(#.*0)(?!\s)?/,`$&${tl(e)}`),t},el=e=>{let r=rl(e),t=Qc(e,r),a=e.replace(/'.*?'/,""),i=Nn.test(a)||On.test(a);return{currencySymbol:r,isCurrencyFirst:t,hasCurrencySpace:i}},In=e=>e.replace(Nn,zn).replace(On,zn),tl=e=>e.match(/#(.?)#/)?.[1]===Rn?Xc:Rn,rl=e=>e.match(/'(.*?)'/)?.[1]??"",Dn=e=>e.match(/0(.?)0/)?.[1]??"";function yt({formatString:e,price:r,usePrecision:t,isIndianPrice:a=!1},i,n=o=>o){let{currencySymbol:o,isCurrencyFirst:s,hasCurrencySpace:l}=el(e),c=t?Dn(e):"",d=Jc(e,t),p=t?2:0,m=n(r,{currencySymbol:o}),h=a?m.toLocaleString("hi-IN",{minimumFractionDigits:p,maximumFractionDigits:p}):Mn(d,m),u=t?h.lastIndexOf(c):h.length,f=h.substring(0,u),v=h.substring(u+1);return{accessiblePrice:e.replace(/'.*?'/,"SYMBOL").replace(/#.*0/,h).replace(/SYMBOL/,o),currencySymbol:o,decimals:v,decimalsDelimiter:c,hasCurrencySpace:l,integer:f,isCurrencyFirst:s,recurrenceTerm:i}}var Hn=e=>{let{commitment:r,term:t,usePrecision:a}=e,i=Kc[t]??1;return yt(e,i>1?We.MONTH:Ba[r]?.[t],n=>{let o={divisor:i,price:n,usePrecision:a},{round:s}=Zc.find(({accept:l})=>l(o));if(!s)throw new Error(`Missing rounding rule for: ${JSON.stringify(o)}`);return s(o)})},Bn=({commitment:e,term:r,...t})=>yt(t,Ba[e]?.[r]),Fn=e=>{let{commitment:r,instant:t,price:a,originalPrice:i,priceWithoutDiscount:n,promotion:o,quantity:s=1,term:l}=e;if(r===He.YEAR&&l===ce.MONTHLY){if(!o)return yt(e,We.YEAR,Da);let{displaySummary:{outcomeType:c,duration:d}={}}=o;switch(c){case"PERCENTAGE_DISCOUNT":if(Ye(o,t,s)){let p=parseInt(d.replace("P","").replace("M",""));if(isNaN(p))return Da(a);let m=i*p,h=n*(12-p),u=Math.round((m+h)*100)/100;return yt({...e,price:u},We.YEAR)}default:return yt(e,We.YEAR,()=>Da(n??a))}}return yt(e,Ba[r]?.[l])};var Un="download",$n="upgrade",Gn={e:"EDU",t:"TEAM"};function qn(e,r={},t=""){let a=ae();if(!a)return null;let{checkoutMarketSegment:i,checkoutWorkflow:n,checkoutWorkflowStep:o,entitlement:s,upgrade:l,modal:c,perpetual:d,promotionCode:p,quantity:m,wcsOsi:h,extraOptions:u,analyticsId:f}=a.collectCheckoutOptions(r),v=yr(e,{checkoutMarketSegment:i,checkoutWorkflow:n,checkoutWorkflowStep:o,entitlement:s,upgrade:l,modal:c,perpetual:d,promotionCode:p,quantity:m,wcsOsi:h,extraOptions:u,analyticsId:f});return t&&(v.innerHTML=`<span style="pointer-events: none;">${t}</span>`),v}function Vn(e){return class extends e{constructor(){super(...arguments);g(this,"checkoutActionHandler");g(this,"masElement",new Ne(this))}attributeChangedCallback(a,i,n){this.masElement.attributeChangedCallback(a,i,n)}connectedCallback(){this.masElement.connectedCallback(),this.addEventListener("click",this.clickHandler)}disconnectedCallback(){this.masElement.disconnectedCallback(),this.removeEventListener("click",this.clickHandler)}onceSettled(){return this.masElement.onceSettled()}get value(){return this.masElement.value}get options(){return this.masElement.options}get marketSegment(){let a=this.options?.ms??this.value?.[0].marketSegments?.[0];return Gn[a]??a}get customerSegment(){let a=this.options?.cs??this.value?.[0]?.customerSegment;return Gn[a]??a}get is3in1Modal(){return Object.values(Be).includes(this.getAttribute("data-modal"))}get isOpen3in1Modal(){let a=document.querySelector("meta[name=mas-ff-3in1]");return this.is3in1Modal&&(!a||a.content!=="off")}requestUpdate(a=!1){return this.masElement.requestUpdate(a)}static get observedAttributes(){return["data-checkout-workflow","data-checkout-workflow-step","data-extra-options","data-ims-country","data-perpetual","data-promotion-code","data-quantity","data-template","data-wcs-osi","data-entitlement","data-upgrade","data-modal"]}async render(a={}){let i=ae();if(!i)return!1;this.dataset.imsCountry||i.imsCountryPromise.then(h=>{h&&(this.dataset.imsCountry=h)}),a.imsCountry=null;let n=i.collectCheckoutOptions(a,this);if(!n.wcsOsi.length)return!1;let o;try{o=JSON.parse(n.extraOptions??"{}")}catch(h){this.masElement.log?.error("cannot parse exta checkout options",h)}let s=this.masElement.togglePending(n);this.setCheckoutUrl("");let l=i.resolveOfferSelectors(n),c=await Promise.all(l);c=c.map(h=>Ht(h,n));let d=c.flat().find(h=>h.promotion);!Ye(d?.promotion,d?.promotion?.displaySummary?.instant,n.quantity[0])&&n.promotionCode&&delete n.promotionCode,n.country=this.dataset.imsCountry||n.country;let m=await i.buildCheckoutAction?.(c.flat(),{...o,...n},this);return this.renderOffers(c.flat(),n,{},m,s)}renderOffers(a,i,n={},o=void 0,s=void 0){let l=ae();if(!l)return!1;if(i={...JSON.parse(this.dataset.extraOptions??"{}"),...i,...n},s??(s=this.masElement.togglePending(i)),this.checkoutActionHandler&&(this.checkoutActionHandler=void 0),o){this.classList.remove(Un,$n),this.masElement.toggleResolved(s,a,i);let{url:d,text:p,className:m,handler:h}=o;d&&this.setCheckoutUrl(Ia(d)),p&&(this.firstElementChild.innerHTML=p),m&&this.classList.add(...m.split(" ")),h&&(this.setCheckoutUrl("#"),this.checkoutActionHandler=h.bind(this))}if(a.length){if(this.masElement.toggleResolved(s,a,i)){if(!this.classList.contains(Un)&&!this.classList.contains($n)){let d=l.buildCheckoutURL(a,i);this.setCheckoutUrl(i.modal==="true"?"#":d)}return!0}}else{let d=new Error(`Not provided: ${i?.wcsOsi??"-"}`);if(this.masElement.toggleFailed(s,d,i))return this.setCheckoutUrl("#"),!0}}setCheckoutUrl(){}clickHandler(a){}updateOptions(a={}){let i=ae();if(!i)return!1;let{checkoutMarketSegment:n,checkoutWorkflow:o,checkoutWorkflowStep:s,entitlement:l,upgrade:c,modal:d,perpetual:p,promotionCode:m,quantity:h,wcsOsi:u}=i.collectCheckoutOptions(a);return Cn(this,{checkoutMarketSegment:n,checkoutWorkflow:o,checkoutWorkflowStep:s,entitlement:l,upgrade:c,modal:d,perpetual:p,promotionCode:m,quantity:h,wcsOsi:u}),!0}}}var Ft=class Ft extends Vn(HTMLAnchorElement){static createCheckoutLink(r={},t=""){return qn(Ft,r,t)}setCheckoutUrl(r){this.setAttribute("href",r)}get isCheckoutLink(){return!0}clickHandler(r){if(this.checkoutActionHandler){this.checkoutActionHandler?.(r);return}}};g(Ft,"is","checkout-link"),g(Ft,"tag","a");var Ce=Ft;window.customElements.get(Ce.is)||window.customElements.define(Ce.is,Ce,{extends:Ce.tag});var L=Object.freeze({checkoutClientId:"adobe_com",checkoutWorkflowStep:ee.EMAIL,country:"US",displayOldPrice:!0,displayPerUnit:!1,displayRecurrence:!0,displayTax:!1,displayPlanType:!1,env:ve.PRODUCTION,forceTaxExclusive:!1,language:"en",entitlement:!1,extraOptions:{},modal:!1,promotionCode:"",quantity:1,alternativePrice:!1,wcsApiKey:"wcms-commerce-ims-ro-user-milo",wcsURL:"https://www.adobe.com/web_commerce_artifact",landscape:Le.PUBLISHED});function jn({settings:e,providers:r}){function t(n,o){let{checkoutClientId:s,checkoutWorkflowStep:l,country:c,language:d,promotionCode:p,quantity:m,preselectPlan:h,env:u}=e,f={checkoutClientId:s,checkoutWorkflowStep:l,country:c,language:d,promotionCode:p,quantity:m,preselectPlan:h,env:u};if(o)for(let Je of r.checkout)Je(o,f);let{checkoutMarketSegment:v,checkoutWorkflowStep:y=l,imsCountry:S,country:b=S??c,language:A=d,quantity:I=m,entitlement:R,upgrade:U,modal:q,perpetual:Q,promotionCode:W=p,wcsOsi:F,extraOptions:N,...J}=Object.assign(f,o?.dataset??{},n??{}),se=Dt(y,ee,L.checkoutWorkflowStep);return f=pr({...J,extraOptions:N,checkoutClientId:s,checkoutMarketSegment:v,country:b,quantity:xt(I,L.quantity),checkoutWorkflowStep:se,language:A,entitlement:w(R),upgrade:w(U),modal:q,perpetual:w(Q),promotionCode:ur(W).effectivePromoCode,wcsOsi:br(F),preselectPlan:h}),f}function a(n,o){if(!Array.isArray(n)||!n.length||!o)return"";let{env:s,landscape:l}=e,{checkoutClientId:c,checkoutMarketSegment:d,checkoutWorkflowStep:p,country:m,promotionCode:h,quantity:u,preselectPlan:f,ms:v,cs:y,...S}=t(o),b=document.querySelector("meta[name=mas-ff-3in1]"),A=Object.values(Be).includes(o.modal)&&(!b||b.content!=="off"),I=window.frameElement||A?"if":"fp",[{productArrangementCode:R,marketSegments:[U],customerSegment:q,offerType:Q}]=n,W=v??U??d,F=y??q;f?.toLowerCase()==="edu"?W="EDU":f?.toLowerCase()==="team"&&(F="TEAM");let N={is3in1:A,checkoutPromoCode:h,clientId:c,context:I,country:m,env:s,items:[],marketSegment:W,customerSegment:F,offerType:Q,productArrangementCode:R,workflowStep:p,landscape:l,...S},J=u[0]>1?u[0]:void 0;if(n.length===1){let{offerId:se}=n[0];N.items.push({id:se,quantity:J})}else N.items.push(...n.map(({offerId:se,productArrangementCode:Je})=>({id:se,quantity:J,...A?{productArrangementCode:Je}:{}})));return Pn(N)}let{createCheckoutLink:i}=Ce;return{CheckoutLink:Ce,CheckoutWorkflowStep:ee,buildCheckoutURL:a,collectCheckoutOptions:t,createCheckoutLink:i}}function al({interval:e=200,maxAttempts:r=25}={}){let t=re.module("ims");return new Promise(a=>{t.debug("Waing for IMS to be ready");let i=0;function n(){window.adobeIMS?.initialized?a():++i>r?(t.debug("Timeout"),a()):setTimeout(n,e)}n()})}function il(e){return e.then(()=>window.adobeIMS?.isSignedInUser()??!1)}function nl(e){let r=re.module("ims");return e.then(t=>t?window.adobeIMS.getProfile().then(({countryCode:a})=>(r.debug("Got user country:",a),a),a=>{r.error("Unable to get user country:",a)}):null)}function Wn({}){let e=al(),r=il(e),t=nl(r);return{imsReadyPromise:e,imsSignedInPromise:r,imsCountryPromise:t}}var Yn=window.masPriceLiterals;function Xn(e){if(Array.isArray(Yn)){let r;switch(e.locale){case"id_ID":r="in";break;case"zh_TW":r="zh-hant";break;case"zh_HK":r="zh-hant";break;default:r=e.language}let t=i=>Yn.find(n=>xa(n.lang,i)),a=t(r)??t(L.language);if(a)return Object.freeze(a)}return{}}var Fa=function(e,r){return Fa=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,a){t.__proto__=a}||function(t,a){for(var i in a)Object.prototype.hasOwnProperty.call(a,i)&&(t[i]=a[i])},Fa(e,r)};function Ut(e,r){if(typeof r!="function"&&r!==null)throw new TypeError("Class extends value "+String(r)+" is not a constructor or null");Fa(e,r);function t(){this.constructor=e}e.prototype=r===null?Object.create(r):(t.prototype=r.prototype,new t)}var k=function(){return k=Object.assign||function(r){for(var t,a=1,i=arguments.length;a<i;a++){t=arguments[a];for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(r[n]=t[n])}return r},k.apply(this,arguments)};function Er(e,r,t){if(t||arguments.length===2)for(var a=0,i=r.length,n;a<i;a++)(n||!(a in r))&&(n||(n=Array.prototype.slice.call(r,0,a)),n[a]=r[a]);return e.concat(n||Array.prototype.slice.call(r))}var E;(function(e){e[e.EXPECT_ARGUMENT_CLOSING_BRACE=1]="EXPECT_ARGUMENT_CLOSING_BRACE",e[e.EMPTY_ARGUMENT=2]="EMPTY_ARGUMENT",e[e.MALFORMED_ARGUMENT=3]="MALFORMED_ARGUMENT",e[e.EXPECT_ARGUMENT_TYPE=4]="EXPECT_ARGUMENT_TYPE",e[e.INVALID_ARGUMENT_TYPE=5]="INVALID_ARGUMENT_TYPE",e[e.EXPECT_ARGUMENT_STYLE=6]="EXPECT_ARGUMENT_STYLE",e[e.INVALID_NUMBER_SKELETON=7]="INVALID_NUMBER_SKELETON",e[e.INVALID_DATE_TIME_SKELETON=8]="INVALID_DATE_TIME_SKELETON",e[e.EXPECT_NUMBER_SKELETON=9]="EXPECT_NUMBER_SKELETON",e[e.EXPECT_DATE_TIME_SKELETON=10]="EXPECT_DATE_TIME_SKELETON",e[e.UNCLOSED_QUOTE_IN_ARGUMENT_STYLE=11]="UNCLOSED_QUOTE_IN_ARGUMENT_STYLE",e[e.EXPECT_SELECT_ARGUMENT_OPTIONS=12]="EXPECT_SELECT_ARGUMENT_OPTIONS",e[e.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE=13]="EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE",e[e.INVALID_PLURAL_ARGUMENT_OFFSET_VALUE=14]="INVALID_PLURAL_ARGUMENT_OFFSET_VALUE",e[e.EXPECT_SELECT_ARGUMENT_SELECTOR=15]="EXPECT_SELECT_ARGUMENT_SELECTOR",e[e.EXPECT_PLURAL_ARGUMENT_SELECTOR=16]="EXPECT_PLURAL_ARGUMENT_SELECTOR",e[e.EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT=17]="EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT",e[e.EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT=18]="EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT",e[e.INVALID_PLURAL_ARGUMENT_SELECTOR=19]="INVALID_PLURAL_ARGUMENT_SELECTOR",e[e.DUPLICATE_PLURAL_ARGUMENT_SELECTOR=20]="DUPLICATE_PLURAL_ARGUMENT_SELECTOR",e[e.DUPLICATE_SELECT_ARGUMENT_SELECTOR=21]="DUPLICATE_SELECT_ARGUMENT_SELECTOR",e[e.MISSING_OTHER_CLAUSE=22]="MISSING_OTHER_CLAUSE",e[e.INVALID_TAG=23]="INVALID_TAG",e[e.INVALID_TAG_NAME=25]="INVALID_TAG_NAME",e[e.UNMATCHED_CLOSING_TAG=26]="UNMATCHED_CLOSING_TAG",e[e.UNCLOSED_TAG=27]="UNCLOSED_TAG"})(E||(E={}));var B;(function(e){e[e.literal=0]="literal",e[e.argument=1]="argument",e[e.number=2]="number",e[e.date=3]="date",e[e.time=4]="time",e[e.select=5]="select",e[e.plural=6]="plural",e[e.pound=7]="pound",e[e.tag=8]="tag"})(B||(B={}));var Xe;(function(e){e[e.number=0]="number",e[e.dateTime=1]="dateTime"})(Xe||(Xe={}));function Ua(e){return e.type===B.literal}function Kn(e){return e.type===B.argument}function Sr(e){return e.type===B.number}function Ar(e){return e.type===B.date}function Cr(e){return e.type===B.time}function Tr(e){return e.type===B.select}function _r(e){return e.type===B.plural}function Zn(e){return e.type===B.pound}function kr(e){return e.type===B.tag}function Pr(e){return!!(e&&typeof e=="object"&&e.type===Xe.number)}function $t(e){return!!(e&&typeof e=="object"&&e.type===Xe.dateTime)}var $a=/[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/;var ol=/(?:[Eec]{1,6}|G{1,5}|[Qq]{1,5}|(?:[yYur]+|U{1,5})|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHK]{1,2}|w{1,2}|W{1}|m{1,2}|s{1,2}|[zZOvVxX]{1,4})(?=([^']*'[^']*')*[^']*$)/g;function Qn(e){var r={};return e.replace(ol,function(t){var a=t.length;switch(t[0]){case"G":r.era=a===4?"long":a===5?"narrow":"short";break;case"y":r.year=a===2?"2-digit":"numeric";break;case"Y":case"u":case"U":case"r":throw new RangeError("`Y/u/U/r` (year) patterns are not supported, use `y` instead");case"q":case"Q":throw new RangeError("`q/Q` (quarter) patterns are not supported");case"M":case"L":r.month=["numeric","2-digit","short","long","narrow"][a-1];break;case"w":case"W":throw new RangeError("`w/W` (week) patterns are not supported");case"d":r.day=["numeric","2-digit"][a-1];break;case"D":case"F":case"g":throw new RangeError("`D/F/g` (day) patterns are not supported, use `d` instead");case"E":r.weekday=a===4?"short":a===5?"narrow":"short";break;case"e":if(a<4)throw new RangeError("`e..eee` (weekday) patterns are not supported");r.weekday=["short","long","narrow","short"][a-4];break;case"c":if(a<4)throw new RangeError("`c..ccc` (weekday) patterns are not supported");r.weekday=["short","long","narrow","short"][a-4];break;case"a":r.hour12=!0;break;case"b":case"B":throw new RangeError("`b/B` (period) patterns are not supported, use `a` instead");case"h":r.hourCycle="h12",r.hour=["numeric","2-digit"][a-1];break;case"H":r.hourCycle="h23",r.hour=["numeric","2-digit"][a-1];break;case"K":r.hourCycle="h11",r.hour=["numeric","2-digit"][a-1];break;case"k":r.hourCycle="h24",r.hour=["numeric","2-digit"][a-1];break;case"j":case"J":case"C":throw new RangeError("`j/J/C` (hour) patterns are not supported, use `h/H/K/k` instead");case"m":r.minute=["numeric","2-digit"][a-1];break;case"s":r.second=["numeric","2-digit"][a-1];break;case"S":case"A":throw new RangeError("`S/A` (second) patterns are not supported, use `s` instead");case"z":r.timeZoneName=a<4?"short":"long";break;case"Z":case"O":case"v":case"V":case"X":case"x":throw new RangeError("`Z/O/v/V/X/x` (timeZone) patterns are not supported, use `z` instead")}return""}),r}var Jn=/[\t-\r \x85\u200E\u200F\u2028\u2029]/i;function ao(e){if(e.length===0)throw new Error("Number skeleton cannot be empty");for(var r=e.split(Jn).filter(function(m){return m.length>0}),t=[],a=0,i=r;a<i.length;a++){var n=i[a],o=n.split("/");if(o.length===0)throw new Error("Invalid number skeleton");for(var s=o[0],l=o.slice(1),c=0,d=l;c<d.length;c++){var p=d[c];if(p.length===0)throw new Error("Invalid number skeleton")}t.push({stem:s,options:l})}return t}function sl(e){return e.replace(/^(.*?)-/,"")}var eo=/^\.(?:(0+)(\*)?|(#+)|(0+)(#+))$/g,io=/^(@+)?(\+|#+)?[rs]?$/g,cl=/(\*)(0+)|(#+)(0+)|(0+)/g,no=/^(0+)$/;function to(e){var r={};return e[e.length-1]==="r"?r.roundingPriority="morePrecision":e[e.length-1]==="s"&&(r.roundingPriority="lessPrecision"),e.replace(io,function(t,a,i){return typeof i!="string"?(r.minimumSignificantDigits=a.length,r.maximumSignificantDigits=a.length):i==="+"?r.minimumSignificantDigits=a.length:a[0]==="#"?r.maximumSignificantDigits=a.length:(r.minimumSignificantDigits=a.length,r.maximumSignificantDigits=a.length+(typeof i=="string"?i.length:0)),""}),r}function oo(e){switch(e){case"sign-auto":return{signDisplay:"auto"};case"sign-accounting":case"()":return{currencySign:"accounting"};case"sign-always":case"+!":return{signDisplay:"always"};case"sign-accounting-always":case"()!":return{signDisplay:"always",currencySign:"accounting"};case"sign-except-zero":case"+?":return{signDisplay:"exceptZero"};case"sign-accounting-except-zero":case"()?":return{signDisplay:"exceptZero",currencySign:"accounting"};case"sign-never":case"+_":return{signDisplay:"never"}}}function ll(e){var r;if(e[0]==="E"&&e[1]==="E"?(r={notation:"engineering"},e=e.slice(2)):e[0]==="E"&&(r={notation:"scientific"},e=e.slice(1)),r){var t=e.slice(0,2);if(t==="+!"?(r.signDisplay="always",e=e.slice(2)):t==="+?"&&(r.signDisplay="exceptZero",e=e.slice(2)),!no.test(e))throw new Error("Malformed concise eng/scientific notation");r.minimumIntegerDigits=e.length}return r}function ro(e){var r={},t=oo(e);return t||r}function so(e){for(var r={},t=0,a=e;t<a.length;t++){var i=a[t];switch(i.stem){case"percent":case"%":r.style="percent";continue;case"%x100":r.style="percent",r.scale=100;continue;case"currency":r.style="currency",r.currency=i.options[0];continue;case"group-off":case",_":r.useGrouping=!1;continue;case"precision-integer":case".":r.maximumFractionDigits=0;continue;case"measure-unit":case"unit":r.style="unit",r.unit=sl(i.options[0]);continue;case"compact-short":case"K":r.notation="compact",r.compactDisplay="short";continue;case"compact-long":case"KK":r.notation="compact",r.compactDisplay="long";continue;case"scientific":r=k(k(k({},r),{notation:"scientific"}),i.options.reduce(function(l,c){return k(k({},l),ro(c))},{}));continue;case"engineering":r=k(k(k({},r),{notation:"engineering"}),i.options.reduce(function(l,c){return k(k({},l),ro(c))},{}));continue;case"notation-simple":r.notation="standard";continue;case"unit-width-narrow":r.currencyDisplay="narrowSymbol",r.unitDisplay="narrow";continue;case"unit-width-short":r.currencyDisplay="code",r.unitDisplay="short";continue;case"unit-width-full-name":r.currencyDisplay="name",r.unitDisplay="long";continue;case"unit-width-iso-code":r.currencyDisplay="symbol";continue;case"scale":r.scale=parseFloat(i.options[0]);continue;case"integer-width":if(i.options.length>1)throw new RangeError("integer-width stems only accept a single optional option");i.options[0].replace(cl,function(l,c,d,p,m,h){if(c)r.minimumIntegerDigits=d.length;else{if(p&&m)throw new Error("We currently do not support maximum integer digits");if(h)throw new Error("We currently do not support exact integer digits")}return""});continue}if(no.test(i.stem)){r.minimumIntegerDigits=i.stem.length;continue}if(eo.test(i.stem)){if(i.options.length>1)throw new RangeError("Fraction-precision stems only accept a single optional option");i.stem.replace(eo,function(l,c,d,p,m,h){return d==="*"?r.minimumFractionDigits=c.length:p&&p[0]==="#"?r.maximumFractionDigits=p.length:m&&h?(r.minimumFractionDigits=m.length,r.maximumFractionDigits=m.length+h.length):(r.minimumFractionDigits=c.length,r.maximumFractionDigits=c.length),""});var n=i.options[0];n==="w"?r=k(k({},r),{trailingZeroDisplay:"stripIfInteger"}):n&&(r=k(k({},r),to(n)));continue}if(io.test(i.stem)){r=k(k({},r),to(i.stem));continue}var o=oo(i.stem);o&&(r=k(k({},r),o));var s=ll(i.stem);s&&(r=k(k({},r),s))}return r}var Gt={AX:["H"],BQ:["H"],CP:["H"],CZ:["H"],DK:["H"],FI:["H"],ID:["H"],IS:["H"],ML:["H"],NE:["H"],RU:["H"],SE:["H"],SJ:["H"],SK:["H"],AS:["h","H"],BT:["h","H"],DJ:["h","H"],ER:["h","H"],GH:["h","H"],IN:["h","H"],LS:["h","H"],PG:["h","H"],PW:["h","H"],SO:["h","H"],TO:["h","H"],VU:["h","H"],WS:["h","H"],"001":["H","h"],AL:["h","H","hB"],TD:["h","H","hB"],"ca-ES":["H","h","hB"],CF:["H","h","hB"],CM:["H","h","hB"],"fr-CA":["H","h","hB"],"gl-ES":["H","h","hB"],"it-CH":["H","h","hB"],"it-IT":["H","h","hB"],LU:["H","h","hB"],NP:["H","h","hB"],PF:["H","h","hB"],SC:["H","h","hB"],SM:["H","h","hB"],SN:["H","h","hB"],TF:["H","h","hB"],VA:["H","h","hB"],CY:["h","H","hb","hB"],GR:["h","H","hb","hB"],CO:["h","H","hB","hb"],DO:["h","H","hB","hb"],KP:["h","H","hB","hb"],KR:["h","H","hB","hb"],NA:["h","H","hB","hb"],PA:["h","H","hB","hb"],PR:["h","H","hB","hb"],VE:["h","H","hB","hb"],AC:["H","h","hb","hB"],AI:["H","h","hb","hB"],BW:["H","h","hb","hB"],BZ:["H","h","hb","hB"],CC:["H","h","hb","hB"],CK:["H","h","hb","hB"],CX:["H","h","hb","hB"],DG:["H","h","hb","hB"],FK:["H","h","hb","hB"],GB:["H","h","hb","hB"],GG:["H","h","hb","hB"],GI:["H","h","hb","hB"],IE:["H","h","hb","hB"],IM:["H","h","hb","hB"],IO:["H","h","hb","hB"],JE:["H","h","hb","hB"],LT:["H","h","hb","hB"],MK:["H","h","hb","hB"],MN:["H","h","hb","hB"],MS:["H","h","hb","hB"],NF:["H","h","hb","hB"],NG:["H","h","hb","hB"],NR:["H","h","hb","hB"],NU:["H","h","hb","hB"],PN:["H","h","hb","hB"],SH:["H","h","hb","hB"],SX:["H","h","hb","hB"],TA:["H","h","hb","hB"],ZA:["H","h","hb","hB"],"af-ZA":["H","h","hB","hb"],AR:["H","h","hB","hb"],CL:["H","h","hB","hb"],CR:["H","h","hB","hb"],CU:["H","h","hB","hb"],EA:["H","h","hB","hb"],"es-BO":["H","h","hB","hb"],"es-BR":["H","h","hB","hb"],"es-EC":["H","h","hB","hb"],"es-ES":["H","h","hB","hb"],"es-GQ":["H","h","hB","hb"],"es-PE":["H","h","hB","hb"],GT:["H","h","hB","hb"],HN:["H","h","hB","hb"],IC:["H","h","hB","hb"],KG:["H","h","hB","hb"],KM:["H","h","hB","hb"],LK:["H","h","hB","hb"],MA:["H","h","hB","hb"],MX:["H","h","hB","hb"],NI:["H","h","hB","hb"],PY:["H","h","hB","hb"],SV:["H","h","hB","hb"],UY:["H","h","hB","hb"],JP:["H","h","K"],AD:["H","hB"],AM:["H","hB"],AO:["H","hB"],AT:["H","hB"],AW:["H","hB"],BE:["H","hB"],BF:["H","hB"],BJ:["H","hB"],BL:["H","hB"],BR:["H","hB"],CG:["H","hB"],CI:["H","hB"],CV:["H","hB"],DE:["H","hB"],EE:["H","hB"],FR:["H","hB"],GA:["H","hB"],GF:["H","hB"],GN:["H","hB"],GP:["H","hB"],GW:["H","hB"],HR:["H","hB"],IL:["H","hB"],IT:["H","hB"],KZ:["H","hB"],MC:["H","hB"],MD:["H","hB"],MF:["H","hB"],MQ:["H","hB"],MZ:["H","hB"],NC:["H","hB"],NL:["H","hB"],PM:["H","hB"],PT:["H","hB"],RE:["H","hB"],RO:["H","hB"],SI:["H","hB"],SR:["H","hB"],ST:["H","hB"],TG:["H","hB"],TR:["H","hB"],WF:["H","hB"],YT:["H","hB"],BD:["h","hB","H"],PK:["h","hB","H"],AZ:["H","hB","h"],BA:["H","hB","h"],BG:["H","hB","h"],CH:["H","hB","h"],GE:["H","hB","h"],LI:["H","hB","h"],ME:["H","hB","h"],RS:["H","hB","h"],UA:["H","hB","h"],UZ:["H","hB","h"],XK:["H","hB","h"],AG:["h","hb","H","hB"],AU:["h","hb","H","hB"],BB:["h","hb","H","hB"],BM:["h","hb","H","hB"],BS:["h","hb","H","hB"],CA:["h","hb","H","hB"],DM:["h","hb","H","hB"],"en-001":["h","hb","H","hB"],FJ:["h","hb","H","hB"],FM:["h","hb","H","hB"],GD:["h","hb","H","hB"],GM:["h","hb","H","hB"],GU:["h","hb","H","hB"],GY:["h","hb","H","hB"],JM:["h","hb","H","hB"],KI:["h","hb","H","hB"],KN:["h","hb","H","hB"],KY:["h","hb","H","hB"],LC:["h","hb","H","hB"],LR:["h","hb","H","hB"],MH:["h","hb","H","hB"],MP:["h","hb","H","hB"],MW:["h","hb","H","hB"],NZ:["h","hb","H","hB"],SB:["h","hb","H","hB"],SG:["h","hb","H","hB"],SL:["h","hb","H","hB"],SS:["h","hb","H","hB"],SZ:["h","hb","H","hB"],TC:["h","hb","H","hB"],TT:["h","hb","H","hB"],UM:["h","hb","H","hB"],US:["h","hb","H","hB"],VC:["h","hb","H","hB"],VG:["h","hb","H","hB"],VI:["h","hb","H","hB"],ZM:["h","hb","H","hB"],BO:["H","hB","h","hb"],EC:["H","hB","h","hb"],ES:["H","hB","h","hb"],GQ:["H","hB","h","hb"],PE:["H","hB","h","hb"],AE:["h","hB","hb","H"],"ar-001":["h","hB","hb","H"],BH:["h","hB","hb","H"],DZ:["h","hB","hb","H"],EG:["h","hB","hb","H"],EH:["h","hB","hb","H"],HK:["h","hB","hb","H"],IQ:["h","hB","hb","H"],JO:["h","hB","hb","H"],KW:["h","hB","hb","H"],LB:["h","hB","hb","H"],LY:["h","hB","hb","H"],MO:["h","hB","hb","H"],MR:["h","hB","hb","H"],OM:["h","hB","hb","H"],PH:["h","hB","hb","H"],PS:["h","hB","hb","H"],QA:["h","hB","hb","H"],SA:["h","hB","hb","H"],SD:["h","hB","hb","H"],SY:["h","hB","hb","H"],TN:["h","hB","hb","H"],YE:["h","hB","hb","H"],AF:["H","hb","hB","h"],LA:["H","hb","hB","h"],CN:["H","hB","hb","h"],LV:["H","hB","hb","h"],TL:["H","hB","hb","h"],"zu-ZA":["H","hB","hb","h"],CD:["hB","H"],IR:["hB","H"],"hi-IN":["hB","h","H"],"kn-IN":["hB","h","H"],"ml-IN":["hB","h","H"],"te-IN":["hB","h","H"],KH:["hB","h","H","hb"],"ta-IN":["hB","h","hb","H"],BN:["hb","hB","h","H"],MY:["hb","hB","h","H"],ET:["hB","hb","h","H"],"gu-IN":["hB","hb","h","H"],"mr-IN":["hB","hb","h","H"],"pa-IN":["hB","hb","h","H"],TW:["hB","hb","h","H"],KE:["hB","hb","H","h"],MM:["hB","hb","H","h"],TZ:["hB","hb","H","h"],UG:["hB","hb","H","h"]};function co(e,r){for(var t="",a=0;a<e.length;a++){var i=e.charAt(a);if(i==="j"){for(var n=0;a+1<e.length&&e.charAt(a+1)===i;)n++,a++;var o=1+(n&1),s=n<2?1:3+(n>>1),l="a",c=dl(r);for((c=="H"||c=="k")&&(s=0);s-- >0;)t+=l;for(;o-- >0;)t=c+t}else i==="J"?t+="H":t+=i}return t}function dl(e){var r=e.hourCycle;if(r===void 0&&e.hourCycles&&e.hourCycles.length&&(r=e.hourCycles[0]),r)switch(r){case"h24":return"k";case"h23":return"H";case"h12":return"h";case"h11":return"K";default:throw new Error("Invalid hourCycle")}var t=e.language,a;t!=="root"&&(a=e.maximize().region);var i=Gt[a||""]||Gt[t||""]||Gt["".concat(t,"-001")]||Gt["001"];return i[0]}var Ga,hl=new RegExp("^".concat($a.source,"*")),pl=new RegExp("".concat($a.source,"*$"));function P(e,r){return{start:e,end:r}}var ml=!!String.prototype.startsWith,ul=!!String.fromCodePoint,gl=!!Object.fromEntries,fl=!!String.prototype.codePointAt,vl=!!String.prototype.trimStart,xl=!!String.prototype.trimEnd,bl=!!Number.isSafeInteger,yl=bl?Number.isSafeInteger:function(e){return typeof e=="number"&&isFinite(e)&&Math.floor(e)===e&&Math.abs(e)<=9007199254740991},Va=!0;try{lo=uo("([^\\p{White_Space}\\p{Pattern_Syntax}]*)","yu"),Va=((Ga=lo.exec("a"))===null||Ga===void 0?void 0:Ga[0])==="a"}catch{Va=!1}var lo,ho=ml?function(r,t,a){return r.startsWith(t,a)}:function(r,t,a){return r.slice(a,a+t.length)===t},ja=ul?String.fromCodePoint:function(){for(var r=[],t=0;t<arguments.length;t++)r[t]=arguments[t];for(var a="",i=r.length,n=0,o;i>n;){if(o=r[n++],o>1114111)throw RangeError(o+" is not a valid code point");a+=o<65536?String.fromCharCode(o):String.fromCharCode(((o-=65536)>>10)+55296,o%1024+56320)}return a},po=gl?Object.fromEntries:function(r){for(var t={},a=0,i=r;a<i.length;a++){var n=i[a],o=n[0],s=n[1];t[o]=s}return t},mo=fl?function(r,t){return r.codePointAt(t)}:function(r,t){var a=r.length;if(!(t<0||t>=a)){var i=r.charCodeAt(t),n;return i<55296||i>56319||t+1===a||(n=r.charCodeAt(t+1))<56320||n>57343?i:(i-55296<<10)+(n-56320)+65536}},wl=vl?function(r){return r.trimStart()}:function(r){return r.replace(hl,"")},El=xl?function(r){return r.trimEnd()}:function(r){return r.replace(pl,"")};function uo(e,r){return new RegExp(e,r)}var Wa;Va?(qa=uo("([^\\p{White_Space}\\p{Pattern_Syntax}]*)","yu"),Wa=function(r,t){var a;qa.lastIndex=t;var i=qa.exec(r);return(a=i[1])!==null&&a!==void 0?a:""}):Wa=function(r,t){for(var a=[];;){var i=mo(r,t);if(i===void 0||fo(i)||Cl(i))break;a.push(i),t+=i>=65536?2:1}return ja.apply(void 0,a)};var qa,go=function(){function e(r,t){t===void 0&&(t={}),this.message=r,this.position={offset:0,line:1,column:1},this.ignoreTag=!!t.ignoreTag,this.locale=t.locale,this.requiresOtherClause=!!t.requiresOtherClause,this.shouldParseSkeletons=!!t.shouldParseSkeletons}return e.prototype.parse=function(){if(this.offset()!==0)throw Error("parser can only be used once");return this.parseMessage(0,"",!1)},e.prototype.parseMessage=function(r,t,a){for(var i=[];!this.isEOF();){var n=this.char();if(n===123){var o=this.parseArgument(r,a);if(o.err)return o;i.push(o.val)}else{if(n===125&&r>0)break;if(n===35&&(t==="plural"||t==="selectordinal")){var s=this.clonePosition();this.bump(),i.push({type:B.pound,location:P(s,this.clonePosition())})}else if(n===60&&!this.ignoreTag&&this.peek()===47){if(a)break;return this.error(E.UNMATCHED_CLOSING_TAG,P(this.clonePosition(),this.clonePosition()))}else if(n===60&&!this.ignoreTag&&Ya(this.peek()||0)){var o=this.parseTag(r,t);if(o.err)return o;i.push(o.val)}else{var o=this.parseLiteral(r,t);if(o.err)return o;i.push(o.val)}}}return{val:i,err:null}},e.prototype.parseTag=function(r,t){var a=this.clonePosition();this.bump();var i=this.parseTagName();if(this.bumpSpace(),this.bumpIf("/>"))return{val:{type:B.literal,value:"<".concat(i,"/>"),location:P(a,this.clonePosition())},err:null};if(this.bumpIf(">")){var n=this.parseMessage(r+1,t,!0);if(n.err)return n;var o=n.val,s=this.clonePosition();if(this.bumpIf("</")){if(this.isEOF()||!Ya(this.char()))return this.error(E.INVALID_TAG,P(s,this.clonePosition()));var l=this.clonePosition(),c=this.parseTagName();return i!==c?this.error(E.UNMATCHED_CLOSING_TAG,P(l,this.clonePosition())):(this.bumpSpace(),this.bumpIf(">")?{val:{type:B.tag,value:i,children:o,location:P(a,this.clonePosition())},err:null}:this.error(E.INVALID_TAG,P(s,this.clonePosition())))}else return this.error(E.UNCLOSED_TAG,P(a,this.clonePosition()))}else return this.error(E.INVALID_TAG,P(a,this.clonePosition()))},e.prototype.parseTagName=function(){var r=this.offset();for(this.bump();!this.isEOF()&&Al(this.char());)this.bump();return this.message.slice(r,this.offset())},e.prototype.parseLiteral=function(r,t){for(var a=this.clonePosition(),i="";;){var n=this.tryParseQuote(t);if(n){i+=n;continue}var o=this.tryParseUnquoted(r,t);if(o){i+=o;continue}var s=this.tryParseLeftAngleBracket();if(s){i+=s;continue}break}var l=P(a,this.clonePosition());return{val:{type:B.literal,value:i,location:l},err:null}},e.prototype.tryParseLeftAngleBracket=function(){return!this.isEOF()&&this.char()===60&&(this.ignoreTag||!Sl(this.peek()||0))?(this.bump(),"<"):null},e.prototype.tryParseQuote=function(r){if(this.isEOF()||this.char()!==39)return null;switch(this.peek()){case 39:return this.bump(),this.bump(),"'";case 123:case 60:case 62:case 125:break;case 35:if(r==="plural"||r==="selectordinal")break;return null;default:return null}this.bump();var t=[this.char()];for(this.bump();!this.isEOF();){var a=this.char();if(a===39)if(this.peek()===39)t.push(39),this.bump();else{this.bump();break}else t.push(a);this.bump()}return ja.apply(void 0,t)},e.prototype.tryParseUnquoted=function(r,t){if(this.isEOF())return null;var a=this.char();return a===60||a===123||a===35&&(t==="plural"||t==="selectordinal")||a===125&&r>0?null:(this.bump(),ja(a))},e.prototype.parseArgument=function(r,t){var a=this.clonePosition();if(this.bump(),this.bumpSpace(),this.isEOF())return this.error(E.EXPECT_ARGUMENT_CLOSING_BRACE,P(a,this.clonePosition()));if(this.char()===125)return this.bump(),this.error(E.EMPTY_ARGUMENT,P(a,this.clonePosition()));var i=this.parseIdentifierIfPossible().value;if(!i)return this.error(E.MALFORMED_ARGUMENT,P(a,this.clonePosition()));if(this.bumpSpace(),this.isEOF())return this.error(E.EXPECT_ARGUMENT_CLOSING_BRACE,P(a,this.clonePosition()));switch(this.char()){case 125:return this.bump(),{val:{type:B.argument,value:i,location:P(a,this.clonePosition())},err:null};case 44:return this.bump(),this.bumpSpace(),this.isEOF()?this.error(E.EXPECT_ARGUMENT_CLOSING_BRACE,P(a,this.clonePosition())):this.parseArgumentOptions(r,t,i,a);default:return this.error(E.MALFORMED_ARGUMENT,P(a,this.clonePosition()))}},e.prototype.parseIdentifierIfPossible=function(){var r=this.clonePosition(),t=this.offset(),a=Wa(this.message,t),i=t+a.length;this.bumpTo(i);var n=this.clonePosition(),o=P(r,n);return{value:a,location:o}},e.prototype.parseArgumentOptions=function(r,t,a,i){var n,o=this.clonePosition(),s=this.parseIdentifierIfPossible().value,l=this.clonePosition();switch(s){case"":return this.error(E.EXPECT_ARGUMENT_TYPE,P(o,l));case"number":case"date":case"time":{this.bumpSpace();var c=null;if(this.bumpIf(",")){this.bumpSpace();var d=this.clonePosition(),p=this.parseSimpleArgStyleIfPossible();if(p.err)return p;var m=El(p.val);if(m.length===0)return this.error(E.EXPECT_ARGUMENT_STYLE,P(this.clonePosition(),this.clonePosition()));var h=P(d,this.clonePosition());c={style:m,styleLocation:h}}var u=this.tryParseArgumentClose(i);if(u.err)return u;var f=P(i,this.clonePosition());if(c&&ho(c?.style,"::",0)){var v=wl(c.style.slice(2));if(s==="number"){var p=this.parseNumberSkeletonFromString(v,c.styleLocation);return p.err?p:{val:{type:B.number,value:a,location:f,style:p.val},err:null}}else{if(v.length===0)return this.error(E.EXPECT_DATE_TIME_SKELETON,f);var y=v;this.locale&&(y=co(v,this.locale));var m={type:Xe.dateTime,pattern:y,location:c.styleLocation,parsedOptions:this.shouldParseSkeletons?Qn(y):{}},S=s==="date"?B.date:B.time;return{val:{type:S,value:a,location:f,style:m},err:null}}}return{val:{type:s==="number"?B.number:s==="date"?B.date:B.time,value:a,location:f,style:(n=c?.style)!==null&&n!==void 0?n:null},err:null}}case"plural":case"selectordinal":case"select":{var b=this.clonePosition();if(this.bumpSpace(),!this.bumpIf(","))return this.error(E.EXPECT_SELECT_ARGUMENT_OPTIONS,P(b,k({},b)));this.bumpSpace();var A=this.parseIdentifierIfPossible(),I=0;if(s!=="select"&&A.value==="offset"){if(!this.bumpIf(":"))return this.error(E.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE,P(this.clonePosition(),this.clonePosition()));this.bumpSpace();var p=this.tryParseDecimalInteger(E.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE,E.INVALID_PLURAL_ARGUMENT_OFFSET_VALUE);if(p.err)return p;this.bumpSpace(),A=this.parseIdentifierIfPossible(),I=p.val}var R=this.tryParsePluralOrSelectOptions(r,s,t,A);if(R.err)return R;var u=this.tryParseArgumentClose(i);if(u.err)return u;var U=P(i,this.clonePosition());return s==="select"?{val:{type:B.select,value:a,options:po(R.val),location:U},err:null}:{val:{type:B.plural,value:a,options:po(R.val),offset:I,pluralType:s==="plural"?"cardinal":"ordinal",location:U},err:null}}default:return this.error(E.INVALID_ARGUMENT_TYPE,P(o,l))}},e.prototype.tryParseArgumentClose=function(r){return this.isEOF()||this.char()!==125?this.error(E.EXPECT_ARGUMENT_CLOSING_BRACE,P(r,this.clonePosition())):(this.bump(),{val:!0,err:null})},e.prototype.parseSimpleArgStyleIfPossible=function(){for(var r=0,t=this.clonePosition();!this.isEOF();){var a=this.char();switch(a){case 39:{this.bump();var i=this.clonePosition();if(!this.bumpUntil("'"))return this.error(E.UNCLOSED_QUOTE_IN_ARGUMENT_STYLE,P(i,this.clonePosition()));this.bump();break}case 123:{r+=1,this.bump();break}case 125:{if(r>0)r-=1;else return{val:this.message.slice(t.offset,this.offset()),err:null};break}default:this.bump();break}}return{val:this.message.slice(t.offset,this.offset()),err:null}},e.prototype.parseNumberSkeletonFromString=function(r,t){var a=[];try{a=ao(r)}catch{return this.error(E.INVALID_NUMBER_SKELETON,t)}return{val:{type:Xe.number,tokens:a,location:t,parsedOptions:this.shouldParseSkeletons?so(a):{}},err:null}},e.prototype.tryParsePluralOrSelectOptions=function(r,t,a,i){for(var n,o=!1,s=[],l=new Set,c=i.value,d=i.location;;){if(c.length===0){var p=this.clonePosition();if(t!=="select"&&this.bumpIf("=")){var m=this.tryParseDecimalInteger(E.EXPECT_PLURAL_ARGUMENT_SELECTOR,E.INVALID_PLURAL_ARGUMENT_SELECTOR);if(m.err)return m;d=P(p,this.clonePosition()),c=this.message.slice(p.offset,this.offset())}else break}if(l.has(c))return this.error(t==="select"?E.DUPLICATE_SELECT_ARGUMENT_SELECTOR:E.DUPLICATE_PLURAL_ARGUMENT_SELECTOR,d);c==="other"&&(o=!0),this.bumpSpace();var h=this.clonePosition();if(!this.bumpIf("{"))return this.error(t==="select"?E.EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT:E.EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT,P(this.clonePosition(),this.clonePosition()));var u=this.parseMessage(r+1,t,a);if(u.err)return u;var f=this.tryParseArgumentClose(h);if(f.err)return f;s.push([c,{value:u.val,location:P(h,this.clonePosition())}]),l.add(c),this.bumpSpace(),n=this.parseIdentifierIfPossible(),c=n.value,d=n.location}return s.length===0?this.error(t==="select"?E.EXPECT_SELECT_ARGUMENT_SELECTOR:E.EXPECT_PLURAL_ARGUMENT_SELECTOR,P(this.clonePosition(),this.clonePosition())):this.requiresOtherClause&&!o?this.error(E.MISSING_OTHER_CLAUSE,P(this.clonePosition(),this.clonePosition())):{val:s,err:null}},e.prototype.tryParseDecimalInteger=function(r,t){var a=1,i=this.clonePosition();this.bumpIf("+")||this.bumpIf("-")&&(a=-1);for(var n=!1,o=0;!this.isEOF();){var s=this.char();if(s>=48&&s<=57)n=!0,o=o*10+(s-48),this.bump();else break}var l=P(i,this.clonePosition());return n?(o*=a,yl(o)?{val:o,err:null}:this.error(t,l)):this.error(r,l)},e.prototype.offset=function(){return this.position.offset},e.prototype.isEOF=function(){return this.offset()===this.message.length},e.prototype.clonePosition=function(){return{offset:this.position.offset,line:this.position.line,column:this.position.column}},e.prototype.char=function(){var r=this.position.offset;if(r>=this.message.length)throw Error("out of bound");var t=mo(this.message,r);if(t===void 0)throw Error("Offset ".concat(r," is at invalid UTF-16 code unit boundary"));return t},e.prototype.error=function(r,t){return{val:null,err:{kind:r,message:this.message,location:t}}},e.prototype.bump=function(){if(!this.isEOF()){var r=this.char();r===10?(this.position.line+=1,this.position.column=1,this.position.offset+=1):(this.position.column+=1,this.position.offset+=r<65536?1:2)}},e.prototype.bumpIf=function(r){if(ho(this.message,r,this.offset())){for(var t=0;t<r.length;t++)this.bump();return!0}return!1},e.prototype.bumpUntil=function(r){var t=this.offset(),a=this.message.indexOf(r,t);return a>=0?(this.bumpTo(a),!0):(this.bumpTo(this.message.length),!1)},e.prototype.bumpTo=function(r){if(this.offset()>r)throw Error("targetOffset ".concat(r," must be greater than or equal to the current offset ").concat(this.offset()));for(r=Math.min(r,this.message.length);;){var t=this.offset();if(t===r)break;if(t>r)throw Error("targetOffset ".concat(r," is at invalid UTF-16 code unit boundary"));if(this.bump(),this.isEOF())break}},e.prototype.bumpSpace=function(){for(;!this.isEOF()&&fo(this.char());)this.bump()},e.prototype.peek=function(){if(this.isEOF())return null;var r=this.char(),t=this.offset(),a=this.message.charCodeAt(t+(r>=65536?2:1));return a??null},e}();function Ya(e){return e>=97&&e<=122||e>=65&&e<=90}function Sl(e){return Ya(e)||e===47}function Al(e){return e===45||e===46||e>=48&&e<=57||e===95||e>=97&&e<=122||e>=65&&e<=90||e==183||e>=192&&e<=214||e>=216&&e<=246||e>=248&&e<=893||e>=895&&e<=8191||e>=8204&&e<=8205||e>=8255&&e<=8256||e>=8304&&e<=8591||e>=11264&&e<=12271||e>=12289&&e<=55295||e>=63744&&e<=64975||e>=65008&&e<=65533||e>=65536&&e<=983039}function fo(e){return e>=9&&e<=13||e===32||e===133||e>=8206&&e<=8207||e===8232||e===8233}function Cl(e){return e>=33&&e<=35||e===36||e>=37&&e<=39||e===40||e===41||e===42||e===43||e===44||e===45||e>=46&&e<=47||e>=58&&e<=59||e>=60&&e<=62||e>=63&&e<=64||e===91||e===92||e===93||e===94||e===96||e===123||e===124||e===125||e===126||e===161||e>=162&&e<=165||e===166||e===167||e===169||e===171||e===172||e===174||e===176||e===177||e===182||e===187||e===191||e===215||e===247||e>=8208&&e<=8213||e>=8214&&e<=8215||e===8216||e===8217||e===8218||e>=8219&&e<=8220||e===8221||e===8222||e===8223||e>=8224&&e<=8231||e>=8240&&e<=8248||e===8249||e===8250||e>=8251&&e<=8254||e>=8257&&e<=8259||e===8260||e===8261||e===8262||e>=8263&&e<=8273||e===8274||e===8275||e>=8277&&e<=8286||e>=8592&&e<=8596||e>=8597&&e<=8601||e>=8602&&e<=8603||e>=8604&&e<=8607||e===8608||e>=8609&&e<=8610||e===8611||e>=8612&&e<=8613||e===8614||e>=8615&&e<=8621||e===8622||e>=8623&&e<=8653||e>=8654&&e<=8655||e>=8656&&e<=8657||e===8658||e===8659||e===8660||e>=8661&&e<=8691||e>=8692&&e<=8959||e>=8960&&e<=8967||e===8968||e===8969||e===8970||e===8971||e>=8972&&e<=8991||e>=8992&&e<=8993||e>=8994&&e<=9e3||e===9001||e===9002||e>=9003&&e<=9083||e===9084||e>=9085&&e<=9114||e>=9115&&e<=9139||e>=9140&&e<=9179||e>=9180&&e<=9185||e>=9186&&e<=9254||e>=9255&&e<=9279||e>=9280&&e<=9290||e>=9291&&e<=9311||e>=9472&&e<=9654||e===9655||e>=9656&&e<=9664||e===9665||e>=9666&&e<=9719||e>=9720&&e<=9727||e>=9728&&e<=9838||e===9839||e>=9840&&e<=10087||e===10088||e===10089||e===10090||e===10091||e===10092||e===10093||e===10094||e===10095||e===10096||e===10097||e===10098||e===10099||e===10100||e===10101||e>=10132&&e<=10175||e>=10176&&e<=10180||e===10181||e===10182||e>=10183&&e<=10213||e===10214||e===10215||e===10216||e===10217||e===10218||e===10219||e===10220||e===10221||e===10222||e===10223||e>=10224&&e<=10239||e>=10240&&e<=10495||e>=10496&&e<=10626||e===10627||e===10628||e===10629||e===10630||e===10631||e===10632||e===10633||e===10634||e===10635||e===10636||e===10637||e===10638||e===10639||e===10640||e===10641||e===10642||e===10643||e===10644||e===10645||e===10646||e===10647||e===10648||e>=10649&&e<=10711||e===10712||e===10713||e===10714||e===10715||e>=10716&&e<=10747||e===10748||e===10749||e>=10750&&e<=11007||e>=11008&&e<=11055||e>=11056&&e<=11076||e>=11077&&e<=11078||e>=11079&&e<=11084||e>=11085&&e<=11123||e>=11124&&e<=11125||e>=11126&&e<=11157||e===11158||e>=11159&&e<=11263||e>=11776&&e<=11777||e===11778||e===11779||e===11780||e===11781||e>=11782&&e<=11784||e===11785||e===11786||e===11787||e===11788||e===11789||e>=11790&&e<=11798||e===11799||e>=11800&&e<=11801||e===11802||e===11803||e===11804||e===11805||e>=11806&&e<=11807||e===11808||e===11809||e===11810||e===11811||e===11812||e===11813||e===11814||e===11815||e===11816||e===11817||e>=11818&&e<=11822||e===11823||e>=11824&&e<=11833||e>=11834&&e<=11835||e>=11836&&e<=11839||e===11840||e===11841||e===11842||e>=11843&&e<=11855||e>=11856&&e<=11857||e===11858||e>=11859&&e<=11903||e>=12289&&e<=12291||e===12296||e===12297||e===12298||e===12299||e===12300||e===12301||e===12302||e===12303||e===12304||e===12305||e>=12306&&e<=12307||e===12308||e===12309||e===12310||e===12311||e===12312||e===12313||e===12314||e===12315||e===12316||e===12317||e>=12318&&e<=12319||e===12320||e===12336||e===64830||e===64831||e>=65093&&e<=65094}function Xa(e){e.forEach(function(r){if(delete r.location,Tr(r)||_r(r))for(var t in r.options)delete r.options[t].location,Xa(r.options[t].value);else Sr(r)&&Pr(r.style)||(Ar(r)||Cr(r))&&$t(r.style)?delete r.style.location:kr(r)&&Xa(r.children)})}function vo(e,r){r===void 0&&(r={}),r=k({shouldParseSkeletons:!0,requiresOtherClause:!0},r);var t=new go(e,r).parse();if(t.err){var a=SyntaxError(E[t.err.kind]);throw a.location=t.err.location,a.originalMessage=t.err.message,a}return r?.captureLocation||Xa(t.val),t.val}function qt(e,r){var t=r&&r.cache?r.cache:Ml,a=r&&r.serializer?r.serializer:Ll,i=r&&r.strategy?r.strategy:_l;return i(e,{cache:t,serializer:a})}function Tl(e){return e==null||typeof e=="number"||typeof e=="boolean"}function xo(e,r,t,a){var i=Tl(a)?a:t(a),n=r.get(i);return typeof n>"u"&&(n=e.call(this,a),r.set(i,n)),n}function bo(e,r,t){var a=Array.prototype.slice.call(arguments,3),i=t(a),n=r.get(i);return typeof n>"u"&&(n=e.apply(this,a),r.set(i,n)),n}function Ka(e,r,t,a,i){return t.bind(r,e,a,i)}function _l(e,r){var t=e.length===1?xo:bo;return Ka(e,this,t,r.cache.create(),r.serializer)}function kl(e,r){return Ka(e,this,bo,r.cache.create(),r.serializer)}function Pl(e,r){return Ka(e,this,xo,r.cache.create(),r.serializer)}var Ll=function(){return JSON.stringify(arguments)};function Za(){this.cache=Object.create(null)}Za.prototype.get=function(e){return this.cache[e]};Za.prototype.set=function(e,r){this.cache[e]=r};var Ml={create:function(){return new Za}},Lr={variadic:kl,monadic:Pl};var Ke;(function(e){e.MISSING_VALUE="MISSING_VALUE",e.INVALID_VALUE="INVALID_VALUE",e.MISSING_INTL_API="MISSING_INTL_API"})(Ke||(Ke={}));var Vt=function(e){Ut(r,e);function r(t,a,i){var n=e.call(this,t)||this;return n.code=a,n.originalMessage=i,n}return r.prototype.toString=function(){return"[formatjs Error: ".concat(this.code,"] ").concat(this.message)},r}(Error);var Qa=function(e){Ut(r,e);function r(t,a,i,n){return e.call(this,'Invalid values for "'.concat(t,'": "').concat(a,'". Options are "').concat(Object.keys(i).join('", "'),'"'),Ke.INVALID_VALUE,n)||this}return r}(Vt);var yo=function(e){Ut(r,e);function r(t,a,i){return e.call(this,'Value for "'.concat(t,'" must be of type ').concat(a),Ke.INVALID_VALUE,i)||this}return r}(Vt);var wo=function(e){Ut(r,e);function r(t,a){return e.call(this,'The intl string context variable "'.concat(t,'" was not provided to the string "').concat(a,'"'),Ke.MISSING_VALUE,a)||this}return r}(Vt);var K;(function(e){e[e.literal=0]="literal",e[e.object=1]="object"})(K||(K={}));function Rl(e){return e.length<2?e:e.reduce(function(r,t){var a=r[r.length-1];return!a||a.type!==K.literal||t.type!==K.literal?r.push(t):a.value+=t.value,r},[])}function zl(e){return typeof e=="function"}function jt(e,r,t,a,i,n,o){if(e.length===1&&Ua(e[0]))return[{type:K.literal,value:e[0].value}];for(var s=[],l=0,c=e;l<c.length;l++){var d=c[l];if(Ua(d)){s.push({type:K.literal,value:d.value});continue}if(Zn(d)){typeof n=="number"&&s.push({type:K.literal,value:t.getNumberFormat(r).format(n)});continue}var p=d.value;if(!(i&&p in i))throw new wo(p,o);var m=i[p];if(Kn(d)){(!m||typeof m=="string"||typeof m=="number")&&(m=typeof m=="string"||typeof m=="number"?String(m):""),s.push({type:typeof m=="string"?K.literal:K.object,value:m});continue}if(Ar(d)){var h=typeof d.style=="string"?a.date[d.style]:$t(d.style)?d.style.parsedOptions:void 0;s.push({type:K.literal,value:t.getDateTimeFormat(r,h).format(m)});continue}if(Cr(d)){var h=typeof d.style=="string"?a.time[d.style]:$t(d.style)?d.style.parsedOptions:a.time.medium;s.push({type:K.literal,value:t.getDateTimeFormat(r,h).format(m)});continue}if(Sr(d)){var h=typeof d.style=="string"?a.number[d.style]:Pr(d.style)?d.style.parsedOptions:void 0;h&&h.scale&&(m=m*(h.scale||1)),s.push({type:K.literal,value:t.getNumberFormat(r,h).format(m)});continue}if(kr(d)){var u=d.children,f=d.value,v=i[f];if(!zl(v))throw new yo(f,"function",o);var y=jt(u,r,t,a,i,n),S=v(y.map(function(I){return I.value}));Array.isArray(S)||(S=[S]),s.push.apply(s,S.map(function(I){return{type:typeof I=="string"?K.literal:K.object,value:I}}))}if(Tr(d)){var b=d.options[m]||d.options.other;if(!b)throw new Qa(d.value,m,Object.keys(d.options),o);s.push.apply(s,jt(b.value,r,t,a,i));continue}if(_r(d)){var b=d.options["=".concat(m)];if(!b){if(!Intl.PluralRules)throw new Vt(`Intl.PluralRules is not available in this environment.
Try polyfilling it using "@formatjs/intl-pluralrules"
`,Ke.MISSING_INTL_API,o);var A=t.getPluralRules(r,{type:d.pluralType}).select(m-(d.offset||0));b=d.options[A]||d.options.other}if(!b)throw new Qa(d.value,m,Object.keys(d.options),o);s.push.apply(s,jt(b.value,r,t,a,i,m-(d.offset||0)));continue}}return Rl(s)}function Nl(e,r){return r?k(k(k({},e||{}),r||{}),Object.keys(e).reduce(function(t,a){return t[a]=k(k({},e[a]),r[a]||{}),t},{})):e}function Ol(e,r){return r?Object.keys(e).reduce(function(t,a){return t[a]=Nl(e[a],r[a]),t},k({},e)):e}function Ja(e){return{create:function(){return{get:function(r){return e[r]},set:function(r,t){e[r]=t}}}}}function Il(e){return e===void 0&&(e={number:{},dateTime:{},pluralRules:{}}),{getNumberFormat:qt(function(){for(var r,t=[],a=0;a<arguments.length;a++)t[a]=arguments[a];return new((r=Intl.NumberFormat).bind.apply(r,Er([void 0],t,!1)))},{cache:Ja(e.number),strategy:Lr.variadic}),getDateTimeFormat:qt(function(){for(var r,t=[],a=0;a<arguments.length;a++)t[a]=arguments[a];return new((r=Intl.DateTimeFormat).bind.apply(r,Er([void 0],t,!1)))},{cache:Ja(e.dateTime),strategy:Lr.variadic}),getPluralRules:qt(function(){for(var r,t=[],a=0;a<arguments.length;a++)t[a]=arguments[a];return new((r=Intl.PluralRules).bind.apply(r,Er([void 0],t,!1)))},{cache:Ja(e.pluralRules),strategy:Lr.variadic})}}var Eo=function(){function e(r,t,a,i){var n=this;if(t===void 0&&(t=e.defaultLocale),this.formatterCache={number:{},dateTime:{},pluralRules:{}},this.format=function(o){var s=n.formatToParts(o);if(s.length===1)return s[0].value;var l=s.reduce(function(c,d){return!c.length||d.type!==K.literal||typeof c[c.length-1]!="string"?c.push(d.value):c[c.length-1]+=d.value,c},[]);return l.length<=1?l[0]||"":l},this.formatToParts=function(o){return jt(n.ast,n.locales,n.formatters,n.formats,o,void 0,n.message)},this.resolvedOptions=function(){return{locale:n.resolvedLocale.toString()}},this.getAst=function(){return n.ast},this.locales=t,this.resolvedLocale=e.resolveLocale(t),typeof r=="string"){if(this.message=r,!e.__parse)throw new TypeError("IntlMessageFormat.__parse must be set to process `message` of type `string`");this.ast=e.__parse(r,{ignoreTag:i?.ignoreTag,locale:this.resolvedLocale})}else this.ast=r;if(!Array.isArray(this.ast))throw new TypeError("A message must be provided as a String or AST.");this.formats=Ol(e.formats,a),this.formatters=i&&i.formatters||Il(this.formatterCache)}return Object.defineProperty(e,"defaultLocale",{get:function(){return e.memoizedDefaultLocale||(e.memoizedDefaultLocale=new Intl.NumberFormat().resolvedOptions().locale),e.memoizedDefaultLocale},enumerable:!1,configurable:!0}),e.memoizedDefaultLocale=null,e.resolveLocale=function(r){var t=Intl.NumberFormat.supportedLocalesOf(r);return t.length>0?new Intl.Locale(t[0]):new Intl.Locale(typeof r=="string"?r:r[0])},e.__parse=vo,e.formats={number:{integer:{maximumFractionDigits:0},currency:{style:"currency"},percent:{style:"percent"}},date:{short:{month:"numeric",day:"numeric",year:"2-digit"},medium:{month:"short",day:"numeric",year:"numeric"},long:{month:"long",day:"numeric",year:"numeric"},full:{weekday:"long",month:"long",day:"numeric",year:"numeric"}},time:{short:{hour:"numeric",minute:"numeric"},medium:{hour:"numeric",minute:"numeric",second:"numeric"},long:{hour:"numeric",minute:"numeric",second:"numeric",timeZoneName:"short"},full:{hour:"numeric",minute:"numeric",second:"numeric",timeZoneName:"short"}}},e}();var So=Eo;var ei={recurrenceLabel:"{recurrenceTerm, select, MONTH {/mo} YEAR {/yr} other {}}",recurrenceAriaLabel:"{recurrenceTerm, select, MONTH {per month} YEAR {per year} other {}}",perUnitLabel:"{perUnit, select, LICENSE {per license} other {}}",perUnitAriaLabel:"{perUnit, select, LICENSE {per license} other {}}",freeLabel:"Free",freeAriaLabel:"Free",taxExclusiveLabel:"{taxTerm, select, GST {excl. GST} VAT {excl. VAT} TAX {excl. tax} IVA {excl. IVA} SST {excl. SST} KDV {excl. KDV} other {}}",taxInclusiveLabel:"{taxTerm, select, GST {incl. GST} VAT {incl. VAT} TAX {incl. tax} IVA {incl. IVA} SST {incl. SST} KDV {incl. KDV} other {}}",alternativePriceAriaLabel:"Alternatively at",strikethroughAriaLabel:"Regularly at",planTypeLabel:"{planType, select, ABM {Annual, billed monthly} other {}}"},Dl=dn("ConsonantTemplates/price"),Hl=/<\/?[^>]+(>|$)/g,$={container:"price",containerOptical:"price-optical",containerStrikethrough:"price-strikethrough",containerPromoStrikethrough:"price-promo-strikethrough",containerAlternative:"price-alternative",containerAnnual:"price-annual",containerAnnualPrefix:"price-annual-prefix",containerAnnualSuffix:"price-annual-suffix",disabled:"disabled",currencySpace:"price-currency-space",currencySymbol:"price-currency-symbol",decimals:"price-decimals",decimalsDelimiter:"price-decimals-delimiter",integer:"price-integer",recurrence:"price-recurrence",taxInclusivity:"price-tax-inclusivity",unitType:"price-unit-type"},Oe={perUnitLabel:"perUnitLabel",perUnitAriaLabel:"perUnitAriaLabel",recurrenceLabel:"recurrenceLabel",recurrenceAriaLabel:"recurrenceAriaLabel",taxExclusiveLabel:"taxExclusiveLabel",taxInclusiveLabel:"taxInclusiveLabel",strikethroughAriaLabel:"strikethroughAriaLabel",alternativePriceAriaLabel:"alternativePriceAriaLabel"},ti="TAX_EXCLUSIVE",Bl=e=>sn(e)?Object.entries(e).filter(([,r])=>vt(r)||hr(r)||r===!0).reduce((r,[t,a])=>`${r} ${t}${a===!0?"":`="${on(a)}"`}`,""):"",G=(e,r,t,a=!1)=>`<span class="${e}${r?"":` ${$.disabled}`}"${Bl(t)}>${a?In(r):r??""}</span>`;function Fl(e){e=e.replaceAll("</a>","&lt;/a&gt;");let r=/<a [^>]+(>|$)/g;return e.match(r)?.forEach(a=>{let i=a.replace("<a ","&lt;a ").replace(">","&gt;");e=e.replaceAll(a,i)}),e}function Ul(e){e=e.replaceAll("&lt;/a&gt;","</a>");let r=/&lt;a (?!&gt;)(.*?)(&gt;|$)/g;return e.match(r)?.forEach(a=>{let i=a.replace("&lt;a ","<a ").replace("&gt;",">");e=e.replaceAll(a,i)}),e}function Te(e,r,t,a){let i=e[t];if(i==null)return"";let n=i.includes("<"),o=i.includes("<a ");try{i=o?Fl(i):i,i=n?i.replace(Hl,""):i;let s=new So(i,r).format(a);return o?Ul(s):s}catch{return Dl.error("Failed to format literal:",i),""}}function $l(e,{accessibleLabel:r,altAccessibleLabel:t,currencySymbol:a,decimals:i,decimalsDelimiter:n,hasCurrencySpace:o,integer:s,isCurrencyFirst:l,recurrenceLabel:c,perUnitLabel:d,taxInclusivityLabel:p},m={}){let h=G($.currencySymbol,a),u=G($.currencySpace,o?"&nbsp;":""),f="";return r?f=`<sr-only class="strikethrough-aria-label">${r}</sr-only>`:t&&(f=`<sr-only class="alt-aria-label">${t}</sr-only>`),l&&(f+=h+u),f+=G($.integer,s),f+=G($.decimalsDelimiter,n),f+=G($.decimals,i),l||(f+=u+h),f+=G($.recurrence,c,null,!0),f+=G($.unitType,d,null,!0),f+=G($.taxInclusivity,p,!0),G(e,f,{...m})}var Y=({isAlternativePrice:e=!1,displayOptical:r=!1,displayStrikethrough:t=!1,displayPromoStrikethrough:a=!1,displayAnnual:i=!1,instant:n=void 0}={})=>({country:o,displayFormatted:s=!0,displayRecurrence:l=!0,displayPerUnit:c=!1,displayTax:d=!1,language:p,literals:m={},quantity:h=1,space:u=!1,isPromoApplied:f=!1}={},{commitment:v,offerSelectorIds:y,formatString:S,price:b,priceWithoutDiscount:A,taxDisplay:I,taxTerm:R,term:U,usePrecision:q,promotion:Q}={},W={})=>{Object.entries({country:o,formatString:S,language:p,price:b}).forEach(([ss,cs])=>{if(cs==null)throw new Error(`Argument "${ss}" is missing for osi ${y?.toString()}, country ${o}, language ${p}`)});let F={...ei,...m},N=`${p.toLowerCase()}-${o.toUpperCase()}`,J;Q&&!f&&A?J=e||a?b:A:t&&A?J=A:J=b;let se=r?Hn:Bn;i&&(se=Fn);let{accessiblePrice:Je,recurrenceTerm:li,...di}=se({commitment:v,formatString:S,instant:n,isIndianPrice:o==="IN",originalPrice:b,priceWithoutDiscount:A,price:r?b:J,promotion:Q,quantity:h,term:U,usePrecision:q}),zr="",Nr="",Or="";w(l)&&li&&(Or=Te(F,N,Oe.recurrenceLabel,{recurrenceTerm:li}));let Qt="";w(c)&&(u&&(Qt+=" "),Qt+=Te(F,N,Oe.perUnitLabel,{perUnit:"LICENSE"}));let Jt="";w(d)&&R&&(u&&(Jt+=" "),Jt+=Te(F,N,I===ti?Oe.taxExclusiveLabel:Oe.taxInclusiveLabel,{taxTerm:R})),t&&(zr=Te(F,N,Oe.strikethroughAriaLabel,{strikethroughPrice:zr})),e&&(Nr=Te(F,N,Oe.alternativePriceAriaLabel,{alternativePrice:Nr}));let De=$.container;if(r&&(De+=` ${$.containerOptical}`),t&&(De+=` ${$.containerStrikethrough}`),a&&(De+=` ${$.containerPromoStrikethrough}`),e&&(De+=` ${$.containerAlternative}`),i&&(De+=` ${$.containerAnnual}`),w(s))return $l(De,{...di,accessibleLabel:zr,altAccessibleLabel:Nr,recurrenceLabel:Or,perUnitLabel:Qt,taxInclusivityLabel:Jt},W);let{currencySymbol:hi,decimals:rs,decimalsDelimiter:as,hasCurrencySpace:pi,integer:is,isCurrencyFirst:ns}=di,et=[is,as,rs];ns?(et.unshift(pi?"\xA0":""),et.unshift(hi)):(et.push(pi?"\xA0":""),et.push(hi)),et.push(Or,Qt,Jt);let os=et.join("");return G(De,os,W)},Ao=()=>(e,r,t)=>{let a=Ye(r.promotion,r.promotion?.displaySummary?.instant,Array.isArray(e.quantity)?e.quantity[0]:e.quantity),n=(e.displayOldPrice===void 0||w(e.displayOldPrice))&&r.priceWithoutDiscount&&r.priceWithoutDiscount!=r.price&&(!r.promotion||a);return`${n?`${Y({displayStrikethrough:!0})({isPromoApplied:a,...e,displayPerUnit:!1,displayTax:!1},r,t)}&nbsp;`:""}${Y({isAlternativePrice:n})({isPromoApplied:a,...e},r,t)}`},Co=()=>(e,r,t)=>{let{instant:a}=e;try{a||(a=new URLSearchParams(document.location.search).get("instant")),a&&(a=new Date(a))}catch{a=void 0}let i=Ye(r.promotion,a,Array.isArray(e.quantity)?e.quantity[0]:e.quantity),n={...e,displayTax:!1,displayPerUnit:!1,isPromoApplied:i};if(!i)return Y()(e,{...r,price:r.priceWithoutDiscount},t)+G($.containerAnnualPrefix," (")+Y({displayAnnual:!0,instant:a})(n,{...r,price:r.priceWithoutDiscount},t)+G($.containerAnnualSuffix,")");let s=(e.displayOldPrice===void 0||w(e.displayOldPrice))&&r.priceWithoutDiscount&&r.priceWithoutDiscount!=r.price;return`${s?`${Y({displayStrikethrough:!0})(n,r,t)}&nbsp;`:""}${Y({isAlternativePrice:s})({isPromoApplied:i,...e},r,t)}${G($.containerAnnualPrefix," (")}${Y({displayAnnual:!0,instant:a})(n,r,t)}${G($.containerAnnualSuffix,")")}`},To=()=>(e,r,t)=>{let a={...e,displayTax:!1,displayPerUnit:!1};return`${Y({isAlternativePrice:e.displayOldPrice})(e,r,t)}${G($.containerAnnualPrefix," (")}${Y({displayAnnual:!0})(a,r,t)}${G($.containerAnnualSuffix,")")}`};var Wt={...$,containerLegal:"price-legal",planType:"price-plan-type"},Mr={...Oe,planTypeLabel:"planTypeLabel"};function Gl(e,{perUnitLabel:r,taxInclusivityLabel:t,planTypeLabel:a},i={},n=!0){let o="";return o+=G(Wt.unitType,r,null,!0),t&&a&&n&&(t+=". "),o+=G(Wt.taxInclusivity,t,!0),o+=G(Wt.planType,a,null),G(e,o,{...i})}var _o=({country:e,displayPerUnit:r=!1,displayTax:t=!1,displayPlanType:a=!1,displayDot:i=!0,language:n,literals:o={}}={},{taxDisplay:s,taxTerm:l,planType:c}={},d={})=>{let p={...ei,...o},m=`${n.toLowerCase()}-${e.toUpperCase()}`,h="";w(r)&&(h=Te(p,m,Mr.perUnitLabel,{perUnit:"LICENSE"}));let u="";e==="US"&&n==="en"&&(t=!1),w(t)&&l&&(u=Te(p,m,s===ti?Mr.taxExclusiveLabel:Mr.taxInclusiveLabel,{taxTerm:l}));let f="";w(a)&&c&&(f=Te(p,m,Mr.planTypeLabel,{planType:c}));let v=Wt.container;return v+=` ${Wt.containerLegal}`,Gl(v,{perUnitLabel:h,taxInclusivityLabel:u,planTypeLabel:f},d,i)};var ko=Y(),Po=Ao(),Lo=Y({displayOptical:!0}),Mo=Y({displayStrikethrough:!0}),Ro=Y({displayPromoStrikethrough:!0}),zo=Y({displayAnnual:!0}),No=Y({displayOptical:!0,isAlternativePrice:!0}),Oo=Y({isAlternativePrice:!0}),Io=To(),Do=Co(),Ho=_o;var ql=(e,r)=>{if(!(!It(e)||!It(r)))return Math.floor((r-e)/r*100)},Bo=()=>(e,r)=>{let{price:t,priceWithoutDiscount:a}=r,i=ql(t,a);return i===void 0?'<span class="no-discount"></span>':`<span class="discount">${i}%</span>`};var Fo=Bo();var Uo="INDIVIDUAL_COM",ai="TEAM_COM",$o="INDIVIDUAL_EDU",ii="TEAM_EDU",Vl=["AT_de","AU_en","BE_en","BE_fr","BE_nl","BG_bg","CH_de","CH_fr","CH_it","CZ_cs","CO_es","DE_de","DK_da","EE_et","EG_ar","EG_en","ES_es","FI_fi","FR_fr","GB_en","GR_el","GR_en","HU_hu","ID_en","ID_id","ID_in","IE_en","IN_en","IN_hi","IT_it","JP_ja","KR_ko","LU_de","LU_en","LU_fr","LT_lt","LV_lv","MY_en","MY_ms","MU_en","NL_nl","NG_en","NO_nb","NZ_en","PE_es","PL_pl","PT_pt","RO_ro","SE_sv","SI_sl","SK_sk","SG_en","TH_en","TH_th","TR_tr","UA_uk","ZA_en","SA_ar","SA_en","MX_es","CL_es","PE_es","AR_es","PH_en","PH_fil"],jl={[Uo]:[],[ai]:["VN_vi","VN_en","TW_zh"],[$o]:[],[ii]:["VN_vi","VN_en","TW_zh"]},Wl={MU_en:[!0,!0,!0,!0],NG_en:[!1,!1,!1,!1],AU_en:[!1,!1,!1,!1],JP_ja:[!1,!1,!1,!1],NZ_en:[!1,!1,!1,!1],TH_en:[!1,!1,!1,!1],TH_th:[!1,!1,!1,!1],ZA_en:[!1,!1,!1,!1],PE_es:[!1,!1,!1,!1]},Yl=[Uo,ai,$o,ii],Xl=e=>[ai,ii].includes(e);function ri(e,r,t,a){if(e[r])return e[r];let i=`${r}_${t}`;if(e[i])return e[i];let n;if(a)n=e.find(o=>o.startsWith(`${r}_`));else{let o=Object.keys(e).find(s=>s.startsWith(`${r}_`));n=o?e[o]:null}return n}var Kl=(e,r,t,a)=>{let i=`${t}_${a}`,n=ri(Wl,e,r,!1);if(n){let o=Yl.indexOf(i);return n[o]}return Xl(i)},Zl=(e,r,t,a)=>{if(ri(Vl,e,r,!0))return!0;let i=jl[`${t}_${a}`];return i?ri(i,e,r,!0)?!0:L.displayTax:L.displayTax},ni=async(e,r,t,a)=>{let i=Zl(e,r,t,a);return{displayTax:i,forceTaxExclusive:i?Kl(e,r,t,a):L.forceTaxExclusive}},Yt=class Yt extends HTMLSpanElement{constructor(){super();g(this,"masElement",new Ne(this));this.handleClick=this.handleClick.bind(this)}static get observedAttributes(){return["data-display-old-price","data-display-per-unit","data-display-recurrence","data-display-tax","data-display-plan-type","data-display-annual","data-perpetual","data-promotion-code","data-force-tax-exclusive","data-template","data-wcs-osi","data-quantity"]}static createInlinePrice(t){let a=ae();if(!a)return null;let{displayOldPrice:i,displayPerUnit:n,displayRecurrence:o,displayTax:s,displayPlanType:l,displayAnnual:c,forceTaxExclusive:d,perpetual:p,promotionCode:m,quantity:h,alternativePrice:u,template:f,wcsOsi:v}=a.collectPriceOptions(t);return yr(Yt,{displayOldPrice:i,displayPerUnit:n,displayRecurrence:o,displayTax:s,displayPlanType:l,displayAnnual:c,forceTaxExclusive:d,perpetual:p,promotionCode:m,quantity:h,alternativePrice:u,template:f,wcsOsi:v})}get isInlinePrice(){return!0}attributeChangedCallback(t,a,i){this.masElement.attributeChangedCallback(t,a,i)}connectedCallback(){this.masElement.connectedCallback(),this.addEventListener("click",this.handleClick)}disconnectedCallback(){this.masElement.disconnectedCallback(),this.removeEventListener("click",this.handleClick)}handleClick(t){t.target!==this&&(t.stopImmediatePropagation(),this.dispatchEvent(new MouseEvent("click",{bubbles:!0,cancelable:!0,view:window})))}onceSettled(){return this.masElement.onceSettled()}get value(){return this.masElement.value}get options(){return this.masElement.options}get isFailed(){return this.masElement.state===pe}requestUpdate(t=!1){return this.masElement.requestUpdate(t)}async render(t={}){if(!this.isConnected)return!1;let a=ae();if(!a)return!1;let i=a.collectPriceOptions(t,this),n={...a.settings,...i};if(!n.wcsOsi.length)return!1;try{let o=this.masElement.togglePending({});this.innerHTML="";let s=a.resolveOfferSelectors(n),l=await Promise.all(s),c=l.map(h=>{let u=Ht(h,n);return u?.length?u[0]:null});if(c.some(h=>!h))throw new Error(`Failed to select offers for: ${n.wcsOsi}`);let d=c,p=Na(c);if(a.featureFlags[Se]||n[Se]){if(i.displayPerUnit===void 0&&(n.displayPerUnit=p.customerSegment!=="INDIVIDUAL"),i.displayTax===void 0||i.forceTaxExclusive===void 0){let{country:h,language:u}=n,[f=""]=p.marketSegments,v=await ni(h,u,p.customerSegment,f);i.displayTax===void 0&&(n.displayTax=v?.displayTax||n.displayTax),i.forceTaxExclusive===void 0&&(n.forceTaxExclusive=v?.forceTaxExclusive||n.forceTaxExclusive),n.forceTaxExclusive&&(d=l.map(y=>{let S=Ht(y,n);return S?.length?S[0]:null}))}}else i.displayOldPrice===void 0&&(n.displayOldPrice=!0);if(a.featureFlags[rt]&&n.displayAnnual!==!1&&(n.displayAnnual=!0),n.template==="discount"&&d.length===2){let[h,u]=d,f={...h,priceDetails:{...h.priceDetails,priceWithoutDiscount:u.priceDetails?.price}};return this.renderOffers([f],n,o)}let m=Na(d);return this.renderOffers([m],n,o)}catch(o){throw this.innerHTML="",o}}renderOffers(t,a,i=void 0){if(!this.isConnected)return;let n=ae();if(!n)return!1;if(i??(i=this.masElement.togglePending()),t.length){if(this.masElement.toggleResolved(i,t,a)){this.innerHTML=n.buildPriceHTML(t,this.options);let o=this.closest("p, h3, div");if(!o||!o.querySelector('span[data-template="strikethrough"]')||o.querySelector(".alt-aria-label"))return!0;let s=o?.querySelectorAll('span[is="inline-price"]');return s.length>1&&s.length===o.querySelectorAll('span[data-template="strikethrough"]').length*2&&s.forEach(l=>{l.dataset.template!=="strikethrough"&&l.options&&!l.options.alternativePrice&&!l.isFailed&&(l.options.alternativePrice=!0,l.innerHTML=n.buildPriceHTML(t,l.options))}),!0}}else{let o=new Error(`Not provided: ${this.options?.wcsOsi??"-"}`);if(this.masElement.toggleFailed(i,o,this.options))return this.innerHTML="",!0}return!1}};g(Yt,"is","inline-price"),g(Yt,"tag","span");var _e=Yt;window.customElements.get(_e.is)||window.customElements.define(_e.is,_e,{extends:_e.tag});function Go({literals:e,providers:r,settings:t}){function a(o,s=null){let l={country:t.country,language:t.language,locale:t.locale,literals:{...e.price}};if(s&&r?.price)for(let R of r.price)R(s,l);let{displayOldPrice:c,displayPerUnit:d,displayRecurrence:p,displayTax:m,displayPlanType:h,forceTaxExclusive:u,perpetual:f,displayAnnual:v,promotionCode:y,quantity:S,alternativePrice:b,wcsOsi:A,...I}=Object.assign(l,s?.dataset??{},o??{});return l=pr(Object.assign({...l,...I,displayOldPrice:w(c),displayPerUnit:w(d),displayRecurrence:w(p),displayTax:w(m),displayPlanType:w(h),forceTaxExclusive:w(u),perpetual:w(f),displayAnnual:w(v),promotionCode:ur(y).effectivePromoCode,quantity:xt(S,L.quantity),alternativePrice:w(b),wcsOsi:br(A)})),l}function i(o,s){if(!Array.isArray(o)||!o.length||!s)return"";let{template:l}=s,c;switch(l){case"discount":c=Fo;break;case"strikethrough":c=Mo;break;case"promo-strikethrough":c=Ro;break;case"annual":c=zo;break;case"legal":c=Ho;break;default:s.template==="optical"&&s.alternativePrice?c=No:s.template==="optical"?c=Lo:s.displayAnnual&&o[0].planType==="ABM"?c=s.promotionCode&&o[0].promotion?Do:Io:s.alternativePrice?c=Oo:c=s.promotionCode&&o[0].promotion?Po:ko}let[d]=o;return d={...d,...d.priceDetails},c({...t,...s},d)}let n=_e.createInlinePrice;return{InlinePrice:_e,buildPriceHTML:i,collectPriceOptions:a,createInlinePrice:n}}function Ql({locale:e=void 0,country:r=void 0,language:t=void 0}={}){return t??(t=e?.split("_")?.[0]||L.language),r??(r=e?.split("_")?.[1]||L.country),e??(e=`${t}_${r}`),{locale:e,country:r,language:t}}function qo(e={},r){let t=r.featureFlags[Se],{commerce:a={}}=e,i=ve.PRODUCTION,n=ra,o=H("checkoutClientId",a)??L.checkoutClientId,s=Dt(H("checkoutWorkflowStep",a),ee,L.checkoutWorkflowStep),l=w(H("displayOldPrice",a),L.displayOldPrice),c=L.displayPerUnit,d=w(H("displayRecurrence",a),L.displayRecurrence),p=w(H("displayTax",a),L.displayTax),m=w(H("displayPlanType",a),L.displayPlanType),h=w(H("entitlement",a),L.entitlement),u=w(H("modal",a),L.modal),f=w(H("forceTaxExclusive",a),L.forceTaxExclusive),v=H("promotionCode",a)??L.promotionCode,y=xt(H("quantity",a)),S=H("wcsApiKey",a)??L.wcsApiKey,b=a?.env==="stage",A=Le.PUBLISHED;["true",""].includes(a.allowOverride)&&(b=(H(ea,a,{metadata:!1})?.toLowerCase()??a?.env)==="stage",A=Dt(H(ta,a),Le,A)),b&&(i=ve.STAGE,n=aa);let R=H(Jr)??e.preview,U=typeof R<"u"&&R!=="off"&&R!=="false",q={};U&&(q={preview:U});let Q=H("mas-io-url")??e.masIOUrl??`https://www${i===ve.STAGE?".stage":""}.adobe.com/mas/io`,W=H("preselect-plan")??void 0,F=H("instant")??e.instant;return{...Ql(e),...q,displayOldPrice:l,checkoutClientId:o,checkoutWorkflowStep:s,displayPerUnit:c,displayRecurrence:d,displayTax:p,displayPlanType:m,entitlement:h,extraOptions:L.extraOptions,modal:u,env:i,forceTaxExclusive:f,promotionCode:v,quantity:y,alternativePrice:L.alternativePrice,wcsApiKey:S,wcsURL:n,landscape:A,masIOUrl:Q,...W&&{preselectPlan:W},...F&&{instant:F}}}async function Vo(e,r={},t=2,a=100){let i;for(let n=0;n<=t;n++)try{let o=await fetch(e,r);return o.retryCount=n,o}catch(o){if(i=o,i.retryCount=n,n>t)break;await new Promise(s=>setTimeout(s,a*(n+1)))}throw i}var oi="wcs";function jo({settings:e}){let r=re.module(oi),{env:t,wcsApiKey:a}=e,i=new Map,n=new Map,o,s=new Map;async function l(u,f,v=!0){let y=ae(),S=Kr;r.debug("Fetching:",u);let b="",A;if(u.offerSelectorIds.length>1)throw new Error("Multiple OSIs are not supported anymore");let I=new Map(f),[R]=u.offerSelectorIds,U=Date.now()+Math.random().toString(36).substring(2,7),q=`${oi}:${R}:${U}${na}`,Q=`${oi}:${R}:${U}${oa}`,W;try{if(performance.mark(q),b=new URL(e.wcsURL),b.searchParams.set("offer_selector_ids",R),b.searchParams.set("country",u.country),b.searchParams.set("locale",u.locale),b.searchParams.set("landscape",t===ve.STAGE?"ALL":e.landscape),b.searchParams.set("api_key",a),u.language&&b.searchParams.set("language",u.language),u.promotionCode&&b.searchParams.set("promotion_code",u.promotionCode),u.currency&&b.searchParams.set("currency",u.currency),A=await Vo(b.toString(),{credentials:"omit"}),A.ok){let F=[];try{let N=await A.json();r.debug("Fetched:",u,N),F=N.resolvedOffers??[]}catch(N){r.error(`Error parsing JSON: ${N.message}`,{...N.context,...y?.duration})}F=F.map(gr),f.forEach(({resolve:N},J)=>{let se=F.filter(({offerSelectorIds:Je})=>Je.includes(J)).flat();se.length&&(I.delete(J),f.delete(J),N(se))})}else S=Xr}catch(F){S=`Network error: ${F.message}`}finally{W=performance.measure(Q,q),performance.clearMarks(q),performance.clearMeasures(Q)}if(v&&f.size){r.debug("Missing:",{offerSelectorIds:[...f.keys()]});let F=Sn(A);f.forEach(N=>{N.reject(new bt(S,{...u,...F,response:A,measure:rr(W),...y?.duration}))})}}function c(){clearTimeout(o);let u=[...n.values()];n.clear(),u.forEach(({options:f,promises:v})=>l(f,v))}function d(u){if(!u||typeof u!="object")throw new TypeError("Cache must be a Map or similar object");let f=t===ve.STAGE?"stage":"prod",v=u[f];if(!v||typeof v!="object"){r.warn(`No cache found for environment: ${t}`);return}for(let[y,S]of Object.entries(v))i.set(y,Promise.resolve(S.map(gr)));r.debug(`Prefilled WCS cache with ${v.size} entries`)}function p(){let u=i.size;s=new Map(i),i.clear(),r.debug(`Moved ${u} cache entries to stale cache`)}function m(u,f,v){let y=u!=="GB"&&!v?"MULT":"en",S=sa.includes(u)?u:L.country;return{validCountry:S,validLanguage:y,locale:`${f}_${S}`}}function h({country:u,language:f,perpetual:v=!1,promotionCode:y="",wcsOsi:S=[]}){let{validCountry:b,validLanguage:A,locale:I}=m(u,f,v),R=[b,A,y].filter(U=>U).join("-").toLowerCase();return S.map(U=>{let q=`${U}-${R}`;if(i.has(q))return i.get(q);let Q=new Promise((W,F)=>{let N=n.get(R);N||(N={options:{country:b,locale:I,...A==="MULT"&&{language:A},offerSelectorIds:[]},promises:new Map},n.set(R,N)),y&&(N.options.promotionCode=y),N.options.offerSelectorIds.push(U),N.promises.set(U,{resolve:W,reject:F}),c()}).catch(W=>{if(s.has(q))return s.get(q);throw W});return i.set(q,Q),Q})}return{Commitment:He,PlanType:pn,Term:ce,applyPlanType:gr,resolveOfferSelectors:h,flushWcsCacheInternal:p,prefillWcsCache:d,normalizeCountryLanguageAndLocale:m}}var Wo="mas-commerce-service",Yo="mas-commerce-service:start",Xo="mas-commerce-service:ready",Xt,wt,Ze,Ko,ci,si=class extends HTMLElement{constructor(){super(...arguments);D(this,Ze);D(this,Xt);D(this,wt);g(this,"lastLoggingTime",0)}async registerCheckoutAction(t){typeof t=="function"&&(this.buildCheckoutAction=async(a,i,n)=>{let o=await t?.(a,i,this.imsSignedInPromise,n);return o||null})}get featureFlags(){return x(this,wt)||M(this,wt,{[Se]:fe(this,Ze,ci).call(this,Se),[rt]:fe(this,Ze,ci).call(this,rt)}),x(this,wt)}activate(){let t=x(this,Ze,Ko),a=qo(t,this);fr(t.lana);let i=re.init(t.hostEnv).module("service");i.debug("Activating:",t);let o={price:Xn(a)},s={checkout:new Set,price:new Set},l={literals:o,providers:s,settings:a};Object.defineProperties(this,Object.getOwnPropertyDescriptors({...jn(l),...Wn(l),...Go(l),...jo(l),...ca,Log:re,resolvePriceTaxFlags:ni,get defaults(){return L},get log(){return re},get providers(){return{checkout(d){return s.checkout.add(d),()=>s.checkout.delete(d)},price(d){return s.price.add(d),()=>s.price.delete(d)},has:d=>s.price.has(d)||s.checkout.has(d)}},get settings(){return a}})),i.debug("Activated:",{literals:o,settings:a});let c=new CustomEvent(tr,{bubbles:!0,cancelable:!1,detail:this});performance.mark(Xo),M(this,Xt,performance.measure(Xo,Yo)),this.dispatchEvent(c),setTimeout(()=>{this.logFailedRequests()},1e4)}connectedCallback(){performance.mark(Yo),this.activate()}flushWcsCache(){this.flushWcsCacheInternal(),this.log.debug("Flushed WCS cache")}isPreview(){let t=this.getAttribute("preview");return t!=null&&["true","on",!0].includes(t)}refreshOffers(){this.flushWcsCacheInternal(),document.querySelectorAll(Hr).forEach(t=>t.requestUpdate(!0)),this.log.debug("Refreshed WCS offers"),this.logFailedRequests()}refreshFragments(){this.flushWcsCacheInternal(),customElements.get("aem-fragment")?.cache.clear(),document.querySelectorAll("aem-fragment").forEach(t=>t.refresh(!1)),this.log.debug("Refreshed AEM fragments"),this.logFailedRequests()}get duration(){return{"mas-commerce-service:measure":rr(x(this,Xt))}}logFailedRequests(){let t=[...performance.getEntriesByType("resource")].filter(({startTime:i})=>i>this.lastLoggingTime).filter(({transferSize:i,duration:n,responseStatus:o})=>i===0&&n===0&&o<200||o>=400),a=Array.from(new Map(t.map(i=>[i.name,i])).values());if(a.some(({name:i})=>/(\/fragment\?|web_commerce_artifact)/.test(i))){let i=a.map(({name:n})=>n);this.log.error("Failed requests:",{failedUrls:i,...this.duration})}this.lastLoggingTime=performance.now().toFixed(3)}};Xt=new WeakMap,wt=new WeakMap,Ze=new WeakSet,Ko=function(){let t=this.getAttribute("env")??"prod",a={commerce:{env:t},hostEnv:{name:t},lana:{tags:this.getAttribute("lana-tags"),sampleRate:parseInt(this.getAttribute("lana-sample-rate")??1,10),isProdDomain:t==="prod"},masIOUrl:this.getAttribute("mas-io-url")};return["locale","country","language","preview","instant"].forEach(i=>{let n=this.getAttribute(i);n&&(a[i]=n)}),["checkout-workflow-step","force-tax-exclusive","checkout-client-id","allow-override","wcs-api-key"].forEach(i=>{let n=this.getAttribute(i);if(n!=null){let o=i.replace(/-([a-z])/g,s=>s[1].toUpperCase());a.commerce[o]=n}}),a},ci=function(t){return["on","true",!0].includes(this.getAttribute(`data-${t}`)||H(t))};window.customElements.get(Wo)||window.customElements.define(Wo,si);var es="merch-card-collection",Jl=3e4,ed={catalog:["four-merch-cards"],plans:["four-merch-cards"],plansThreeColumns:["three-merch-cards"],product:["four-merch-cards"],productTwoColumns:["two-merch-cards"],productThreeColumns:["three-merch-cards"],segment:["four-merch-cards"],segmentTwoColumns:["two-merch-cards"],segmentThreeColumns:["three-merch-cards"],"special-offers":["three-merch-cards"],image:["three-merch-cards"],"mini-compare-chart":["three-merch-cards"],"mini-compare-chartTwoColumns":["two-merch-cards"],"mini-compare-chart-mweb":["three-merch-cards"],"mini-compare-chart-mwebTwoColumns":["two-merch-cards"]},td={plans:!0},rd=(e,{filter:r})=>e.filter(t=>t?.filters&&t?.filters.hasOwnProperty(r)),ad=(e,{types:r})=>r?(r=r.split(","),e.filter(t=>r.some(a=>t.types.includes(a)))):e,id=e=>e.sort((r,t)=>(r.title??"").localeCompare(t.title??"","en",{sensitivity:"base"})),nd=(e,{filter:r})=>e.sort((t,a)=>a.filters[r]?.order==null||isNaN(a.filters[r]?.order)?-1:t.filters[r]?.order==null||isNaN(t.filters[r]?.order)?1:t.filters[r].order-a.filters[r].order),od=(e,{search:r})=>r?.length?(r=r.toLowerCase(),e.filter(t=>(t.title??"").toLowerCase().includes(r))):e,Ie,St,Qe,Zt,Rr,ts,Et=class extends Qo{constructor(){super();D(this,Rr);D(this,Ie,{});D(this,St);D(this,Qe);D(this,Zt);this.id=null,this.filter="all",this.hasMore=!1,this.resultCount=void 0,this.displayResult=!1,this.data=null,this.variant=null,this.hydrating=!1,this.hydrationReady=null,this.literalsHandlerAttached=!1,this.onUnmount=[]}render(){return ke` <slot></slot>
            ${this.footer}`}checkReady(){if(!this.querySelector("aem-fragment"))return Promise.resolve(!0);let a=new Promise(i=>setTimeout(()=>i(!1),Jl));return Promise.race([this.hydrationReady,a])}updated(t){if(!this.querySelector("merch-card"))return;let a=window.scrollY||document.documentElement.scrollTop,i=[...this.children].filter(c=>c.tagName==="MERCH-CARD"&&!c.failed);if(i.length===0)return;t.has("singleApp")&&this.singleApp&&i.forEach(c=>{c.updateFilters(c.name===this.singleApp)});let n=this.sort===me.alphabetical?id:nd,s=[rd,ad,od,n].reduce((c,d)=>d(c,this),i).map((c,d)=>[c,d]);if(this.resultCount=s.length,this.page&&this.limit){let c=this.page*this.limit;this.hasMore=s.length>c,s=s.filter(([,d])=>d<c)}let l=new Map(s.reverse());for(let c of l.keys())this.prepend(c);i.forEach(c=>{l.has(c)?(c.size=c.filters[this.filter]?.size,c.style.removeProperty("display"),c.requestUpdate()):(c.style.display="none",c.size=void 0)}),window.scrollTo(0,a),this.updateComplete.then(()=>{this.dispatchLiteralsChanged(),this.sidenav&&!this.literalsHandlerAttached&&(this.sidenav.addEventListener($r,()=>{this.dispatchLiteralsChanged()}),this.literalsHandlerAttached=!0)})}dispatchLiteralsChanged(){this.dispatchEvent(new CustomEvent(he,{detail:{resultCount:this.resultCount,searchTerm:this.search,filter:this.sidenav?.filters?.selectedText}}))}buildOverrideMap(){M(this,Ie,{}),this.overrides?.split(",").forEach(t=>{let[a,i]=t?.split(":");a&&i&&(x(this,Ie)[a]=i)})}connectedCallback(){super.connectedCallback(),M(this,St,Lt()),x(this,St)&&M(this,Qe,x(this,St).Log.module(es)),M(this,Zt,customElements.get("merch-card")),this.buildOverrideMap(),this.init()}async init(){await this.hydrate(),this.sidenav=this.parentElement.querySelector("merch-sidenav"),this.filtered?(this.filter=this.filtered,this.page=1):this.startDeeplink(),this.initializePlaceholders()}disconnectedCallback(){super.disconnectedCallback(),this.stopDeeplink?.();for(let t of this.onUnmount)t()}initializeHeader(){let t=document.createElement("merch-card-collection-header");t.collection=this,t.classList.add(this.variant),this.parentElement.insertBefore(t,this),this.header=t,this.querySelectorAll("[placeholder]").forEach(i=>{let n=i.getAttribute("slot");this.header.placeholderKeys.includes(n)&&this.header.append(i)})}initializePlaceholders(){let t=this.data?.placeholders||{};!t.searchText&&this.data?.sidenavSettings?.searchText&&(t.searchText=this.data.sidenavSettings.searchText);for(let a of Object.keys(t)){let i=t[a],n=i.includes("<p>")?"div":"p",o=document.createElement(n);o.setAttribute("slot",a),o.setAttribute("placeholder",""),o.innerHTML=i,this.append(o)}}attachSidenav(t,a=!0){if(!t)return;a&&this.parentElement.prepend(t),this.sidenav=t,this.sidenav.variant=this.variant,this.sidenav.classList.add(this.variant),td[this.variant]&&this.sidenav.setAttribute("autoclose",""),this.initializeHeader(),this.dispatchEvent(new CustomEvent(_t));let i=x(this,Zt)?.getCollectionOptions(this.variant)?.onSidenavAttached;i&&i(this)}async hydrate(){if(this.hydrating)return!1;let t=this.querySelector("aem-fragment");if(!t)return;this.id=t.getAttribute("fragment"),this.hydrating=!0;let a;this.hydrationReady=new Promise(s=>{a=s});let i=this;function n(s){let l;return s.fields?.checkboxGroups?l=s.fields.checkboxGroups:s.fields?.tagFilters&&(l=[{title:s.fields?.tagFiltersTitle,label:"types",deeplink:"types",checkboxes:s.fields.tagFilters.map(c=>{let d=c.split("/").pop(),p=s.settings?.tagLabels?.[d]||d;return p=p.startsWith("coll-tag-filter")?d.charAt(0).toUpperCase()+d.slice(1):p,{name:d,label:p}})}]),{searchText:s.fields?.searchText,tagFilters:l,linksTitle:s.fields?.linksTitle,link:s.fields?.link,linkText:s.fields?.linkText,linkIcon:s.fields?.linkIcon}}function o(s,l){let c={cards:[],hierarchy:[],placeholders:s.placeholders,sidenavSettings:n(s)};function d(p,m){for(let h of m){if(h.fieldName==="variations")continue;if(h.fieldName==="cards"){if(c.cards.findIndex(b=>b.id===h.identifier)!==-1)continue;if(!s.references[h.identifier]?.value){x(i,Qe)?.error(`Reference not found for card: ${h.identifier}`);continue}c.cards.push(s.references[h.identifier].value);continue}let u=s.references[h.identifier]?.value,f=h.referencesTree,v=l[h.identifier];if(v){let b=document.querySelector(`aem-fragment[fragment="${v}"]`)?.rawData;if(b?.fields)u=b,f=b.referencesTree,s.references={...s.references,...b.references};else{x(i,Qe)?.error(`Override fragment ${v} not found or invalid:`);continue}}if(!u?.fields)continue;let{fields:y}=u,S={label:y.label||"",icon:y.icon,iconLight:y.iconLight,queryLabel:y.queryLabel,cards:y.cards?y.cards.map(b=>l[b]||b):[],collections:[]};y.defaultchild&&(S.defaultchild=l[y.defaultchild]||y.defaultchild),p.push(S),d(S.collections,f)}}return d(c.hierarchy,s.referencesTree),c.hierarchy.length===0&&(i.filtered="all"),c}t.addEventListener(qr,s=>{fe(this,Rr,ts).call(this,"Error loading AEM fragment",s.detail),this.hydrating=!1,t.remove()}),t.addEventListener(Gr,async s=>{this.limit=27,this.data=o(s.detail,x(this,Ie)),s.detail.variationId&&this.setAttribute("variation-id",s.detail.variationId);let{cards:l,hierarchy:c}=this.data,d=c.length===0&&s.detail.fields?.defaultchild?x(this,Ie)[s.detail.fields.defaultchild]||s.detail.fields.defaultchild:null;t.cache.add(...l);let p=(u,f)=>{for(let v of u)if(v.defaultchild===f||v.collections&&p(v.collections,f))return!0;return!1};for(let u of l){let b=function(I){for(let R of I){let U=R.cards.indexOf(v);if(U===-1)continue;let q=R.queryLabel??R?.label?.toLowerCase()??"";f.filters[q]={order:U+1,size:u.fields.size},b(R.collections)}},f=document.createElement("merch-card"),v=x(this,Ie)[u.id]||u.id;f.setAttribute("consonant",""),f.setAttribute("style","");let y=u.fields.tags?.filter(I=>I.startsWith("mas:types/")).map(I=>I.split("/")[1]).join(",");y&&f.setAttribute("types",y),ir(u.fields.variant)?.supportsDefaultChild&&(d?v===d:p(c,v))&&f.setAttribute("data-default-card","true"),b(c);let A=document.createElement("aem-fragment");A.setAttribute("fragment",v),f.append(A),Object.keys(f.filters).length===0&&(f.filters={all:{order:l.indexOf(u)+1,size:u.fields.size}}),this.append(f)}let m="",h=Tn(l[0]?.fields?.variant);this.variant=h,h==="plans"&&l.length===3&&!l.some(u=>u.fields?.size?.includes("wide"))?m="ThreeColumns":(h==="segment"||h==="product")&&(l.length===2||l.length===3)?m=l.length===2?"TwoColumns":"ThreeColumns":(h==="mini-compare-chart"||h==="mini-compare-chart-mweb")&&l.length<=2&&(m=l.length===1?"":"TwoColumns"),h&&this.classList.add("merch-card-collection",h,...ed[`${h}${m}`]||[]),this.displayResult=!0,this.hydrating=!1,t.remove(),a(!0)}),await this.hydrationReady}get footer(){if(!this.filtered)return ke`<div id="footer">
            <sp-theme color="light" scale="medium">
                ${this.showMoreButton}
            </sp-theme>
        </div>`}get showMoreButton(){if(this.hasMore)return ke`<sp-button
            variant="secondary"
            treatment="outline"
            style="order: 1000;"
            @click="${this.showMore}"
        >
            <slot name="showMoreText"></slot>
        </sp-button>`}sortChanged(t){t.target.value===me.authored?Tt({sort:void 0}):Tt({sort:t.target.value}),this.dispatchEvent(new CustomEvent(Fr,{bubbles:!0,composed:!0,detail:{value:t.target.value}}))}async showMore(){this.dispatchEvent(new CustomEvent(Ur,{bubbles:!0,composed:!0}));let t=this.page+1;Tt({page:t}),this.page=t,await this.updateComplete}startDeeplink(){this.stopDeeplink=xi(({category:t,filter:a,types:i,sort:n,search:o,single_app:s,page:l})=>{a=a||t,!this.filtered&&a&&a!==this.filter&&setTimeout(()=>{Tt({page:void 0}),this.page=1},1),this.filtered||(this.filter=a??this.filter),this.types=i??"",this.search=o??"",this.singleApp=s,this.sort=n,this.page=Number(l)||1})}openFilters(t){this.sidenav?.showModal(t)}};Ie=new WeakMap,St=new WeakMap,Qe=new WeakMap,Zt=new WeakMap,Rr=new WeakSet,ts=function(t,a={},i=!0){x(this,Qe)?.error(`merch-card-collection: ${t}`,a),this.failed=!0,i&&this.dispatchEvent(new CustomEvent(Vr,{detail:{...a,message:t},bubbles:!0,composed:!0}))},g(Et,"properties",{id:{type:String,attribute:"id",reflect:!0},displayResult:{type:Boolean,attribute:"display-result"},filter:{type:String,attribute:"filter",reflect:!0},filtered:{type:String,attribute:"filtered",reflect:!0},hasMore:{type:Boolean},limit:{type:Number,attribute:"limit"},overrides:{type:String},page:{type:Number,attribute:"page",reflect:!0},resultCount:{type:Number},search:{type:String,attribute:"search",reflect:!0},sidenav:{type:Object},singleApp:{type:String,attribute:"single-app",reflect:!0},sort:{type:String,attribute:"sort",default:me.authored,reflect:!0},types:{type:String,attribute:"types",reflect:!0}}),g(Et,"styles",Jo`
        #footer {
            grid-column: 1 / -1;
            justify-self: stretch;
            color: var(--merch-color-grey-80);
            order: 1000;
        }

        sp-theme {
            display: contents;
        }
    `);Et.SortOrder=me;customElements.define(es,Et);var sd={filters:["noResultText","resultText","resultsText"],filtersMobile:["noResultText","resultMobileText","resultsMobileText"],search:["noSearchResultsText","searchResultText","searchResultsText"],searchMobile:["noSearchResultsMobileText","searchResultMobileText","searchResultsMobileText"]},cd=(e,r,t)=>{e.querySelectorAll(`[data-placeholder="${r}"]`).forEach(i=>{i.innerText=t||""})},ld={search:["mobile","tablet"],filter:["mobile","tablet"],sort:!0,result:!0,custom:!1},dd={catalog:"l"},ie,At,Kt=class extends Qo{constructor(){super();D(this,ie);D(this,At);g(this,"tablet",new Ct(this,O));g(this,"desktop",new Ct(this,C));this.collection=null,M(this,ie,{search:!1,filter:!1,sort:!1,result:!1,custom:!1}),this.updateLiterals=this.updateLiterals.bind(this),this.handleSidenavAttached=this.handleSidenavAttached.bind(this)}connectedCallback(){super.connectedCallback(),this.collection?.addEventListener(he,this.updateLiterals),this.collection?.addEventListener(_t,this.handleSidenavAttached),M(this,At,customElements.get("merch-card"))}disconnectedCallback(){super.disconnectedCallback(),this.collection?.removeEventListener(he,this.updateLiterals),this.collection?.removeEventListener(_t,this.handleSidenavAttached)}willUpdate(){x(this,ie).search=this.getVisibility("search"),x(this,ie).filter=this.getVisibility("filter"),x(this,ie).sort=this.getVisibility("sort"),x(this,ie).result=this.getVisibility("result"),x(this,ie).custom=this.getVisibility("custom")}parseVisibilityOptions(t,a){if(!t||!Object.hasOwn(t,a))return null;let i=t[a];return i===!1?!1:i===!0?!0:i.includes(this.currentMedia)}getVisibility(t){let a=x(this,At)?.getCollectionOptions(this.collection?.variant)?.headerVisibility,i=this.parseVisibilityOptions(a,t);return i!==null?i:this.parseVisibilityOptions(ld,t)}get sidenav(){return this.collection?.sidenav}get search(){return this.collection?.search}get resultCount(){return this.collection?.resultCount}get variant(){return this.collection?.variant}get isMobile(){return!this.isTablet&&!this.isDesktop}get isTablet(){return this.tablet.matches&&!this.desktop.matches}get isDesktop(){return this.desktop.matches}get currentMedia(){return this.isDesktop?"desktop":this.isTablet?"tablet":"mobile"}get searchAction(){if(!x(this,ie).search)return ge;let t=Pt(this,"searchText");return t?ke`
            <merch-search deeplink="search" id="search">
                <sp-search
                    id="search-bar"
                    placeholder="${t}"
                    .size=${dd[this.variant]}
                    aria-label="${t}"
                ></sp-search>
            </merch-search>
        `:ge}get filterAction(){return x(this,ie).filter?this.sidenav?ke`
            <sp-action-button
                id="filter"
                variant="secondary"
                treatment="outline"
                @click="${this.openFilters}"
                ><slot name="filtersText"></slot
            ></sp-action-button>
        `:ge:ge}get sortAction(){if(!x(this,ie).sort)return ge;let t=Pt(this,"sortText");if(!t)return;let a=Pt(this,"popularityText"),i=Pt(this,"alphabeticallyText");if(!(a&&i))return;let n=this.collection?.sort===me.alphabetical;return ke`
            <sp-action-menu
                id="sort"
                size="m"
                @change="${this.collection?.sortChanged}"
                selects="single"
                value="${n?me.alphabetical:me.authored}"
            >
                <span slot="label-only"
                    >${t}:
                    ${n?i:a}</span
                >
                <sp-menu-item value="${me.authored}"
                    >${a}</sp-menu-item
                >
                <sp-menu-item value="${me.alphabetical}"
                    >${i}</sp-menu-item
                >
            </sp-action-menu>
        `}get resultSlotName(){let t=`${this.search?"search":"filters"}${this.isMobile||this.isTablet?"Mobile":""}`;return sd[t][Math.min(this.resultCount,2)]}get resultLabel(){if(!x(this,ie).result)return ge;if(!this.sidenav)return ge;let t=this.search?"search":"filter",a=this.resultCount?this.resultCount===1?"single":"multiple":"none";return ke` <div
            id="result"
            aria-live="polite"
            type=${t}
            quantity=${a}
        >
            <slot name="${this.resultSlotName}"></slot>
        </div>`}get customArea(){if(!x(this,ie).custom)return ge;let t=x(this,At)?.getCollectionOptions(this.collection?.variant)?.customHeaderArea;if(!t)return ge;let a=t(this.collection);return!a||a===ge?ge:ke`<div id="custom" role="heading" aria-level="2">
            ${a}
        </div>`}openFilters(t){this.sidenav.showModal(t)}updateLiterals(t){Object.keys(t.detail).forEach(a=>{cd(this,a,t.detail[a])}),this.requestUpdate()}handleSidenavAttached(){this.requestUpdate()}render(){return ke`
            <sp-theme color="light" scale="medium">
                <div id="header">
                    ${this.searchAction}${this.filterAction}${this.sortAction}${this.resultLabel}${this.customArea}
                </div>
            </sp-theme>
        `}get placeholderKeys(){return["searchText","filtersText","sortText","popularityText","alphabeticallyText","noResultText","resultText","resultsText","resultMobileText","resultsMobileText","noSearchResultsText","searchResultText","searchResultsText","noSearchResultsMobileText","searchResultMobileText","searchResultsMobileText"]}};ie=new WeakMap,At=new WeakMap,g(Kt,"styles",Jo`
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
        @media screen and ${Zo(O)} {
            :host {
                --merch-card-collection-header-max-width: auto;
                --merch-card-collection-header-columns: 1fr fit-content(100%)
                    fit-content(100%);
                --merch-card-collection-header-areas: 'search filter sort'
                    'result result result';
            }
        }

        /* Laptop */
        @media screen and ${Zo(C)} {
            :host {
                --merch-card-collection-header-columns: 1fr fit-content(100%);
                --merch-card-collection-header-areas: 'result sort';
                --merch-card-collection-header-result-font-size: inherit;
            }
        }
    `);customElements.define("merch-card-collection-header",Kt);export{Et as MerchCardCollection,Kt as default};
