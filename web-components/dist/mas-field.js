var Pt=Object.defineProperty;var tt=e=>{throw TypeError(e)};var Ot=(e,r,t)=>r in e?Pt(e,r,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[r]=t;var Y=(e,r,t)=>Ot(e,typeof r!="symbol"?r+"":r,t),V=(e,r,t)=>r.has(e)||tt("Cannot "+t);var p=(e,r,t)=>(V(e,r,"read from private field"),t?t.call(e):r.get(e)),x=(e,r,t)=>r.has(e)?tt("Cannot add the same private member more than once"):r instanceof WeakSet?r.add(e):r.set(e,t),_=(e,r,t,o)=>(V(e,r,"write to private field"),o?o.call(e,t):r.set(e,t),t),c=(e,r,t)=>(V(e,r,"access private method"),t);var le=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),de=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var Mt='span[is="inline-price"][data-wcs-osi]',It='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var vt='a[is="upt-link"]',pe=`${Mt},${It},${vt}`,et=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var O="aem:load";var rt="mas:ready";var ue=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var me=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var ot="legal",nt="plan-type-text",it="mas-ff-defaults";var Dt="mas-commerce-service";function at(){return document.getElementsByTagName(Dt)?.[0]}function st(e){let r=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&r?.isInlinePrice&&r?.dataset?.template==="price"}var Ht=[".","!","?"],Ut=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=Ut,document.head.append(e)}var kt="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function Ft(e){let r=e.closest(kt)??e.parentNode,t=document.createRange();return t.setStart(r,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function ct(e){let r=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(o=>!o.closest("merch-addon"));return(r.find(o=>o.dataset.promotionCode&&o.dataset.promotionCode!=="cancel-context")??r[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function Yt(e){let r=Ft(e);return!r||Ht.includes(r)?"upper":"lower"}function $(e,r){if(e.dataset.placeholder!==nt)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(r.wcsOsi=t,r.planTypeCase=Yt(e))}function $t(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")}function M(e){return $t(e)?e.contextPromotionCode:null}function lt(e,r){e&&(r.literals??(r.literals={}),Object.assign(r.literals,e))}function dt(e,r){st(e)&&(r.displayPerUnit=!1,r.displayTax=!1)}function pt(e,r){r.displayAnnual===void 0&&typeof e?.settings?.displayAnnual=="boolean"&&(r.displayAnnual=e.settings.displayAnnual,e.settings.displayAnnual&&e.setAttribute("annualized",""))}function ut(e,r,t){!e?.providers||e.providers.has(r)||(e.providers.price(r),e.providers.checkout(t),e.providers.has($)||e.providers.price($))}function Gt(e,r){if(typeof e!="string"||!e)return null;let t;try{t=new URL(e,r)}catch{return null}return t.hostname.endsWith(".aem.page")?`${r}${t.pathname}${t.search}`:null}function B(e){if(typeof e!="string"||!e)return"";try{return new URL(e).href}catch{return""}}function Bt(e){if(typeof e!="string"||!e)return!1;try{return new URL(e).hostname.endsWith(".aem.page")}catch{return!1}}var Wt={png:{type:"image/png",format:"png"},jpg:{type:"image/jpeg",format:"jpg"},jpeg:{type:"image/jpeg",format:"jpg"},webp:{type:"image/webp",format:"webp"},gif:{type:"image/gif",format:"gif"}},G={width:2e3,media:"(min-width: 600px)"},qt=750;function I(e,r,t){let o=new URL(e);return o.searchParams.set("width",r),o.searchParams.set("format",t),o.searchParams.set("optimize","medium"),o.href}function mt(e,r){return r?.width?Math.min(e,r.width):e}function Kt(e){let r=new URL(e).pathname.split(".").pop().toLowerCase();return Wt[r]??null}function ht(e){return String(e??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function ft(e){return!e?.width||!e?.height?"":` width="${e.width}" height="${e.height}"`}function Et(e,r,t=""){if(!Bt(e))return"";let o=B(e),n=Kt(o);if(!n)return`<img loading="lazy" alt="${ht(t)}"${ft(r)} src="${o}">`;let{type:i,format:l}=n,s=mt(G.width,r),d=mt(qt,r);return[`<source type="image/webp" srcset="${I(o,s,"webply")}" media="${G.media}">`,`<source type="image/webp" srcset="${I(o,d,"webply")}">`,`<source type="${i}" srcset="${I(o,s,l)}" media="${G.media}">`,`<img loading="lazy" alt="${ht(t)}" src="${I(o,d,l)}"${ft(r)}>`].join("")}function zt(e){return e?.hostname==="www.adobe.com"||e?.hostname==="adobe.com"}function gt(e,r=globalThis.location){if(typeof e!="string"||!e||!zt(r))return e;let t=document.createElement("template");return t.innerHTML=`<picture>${e}</picture>`,t.content.querySelectorAll("source[srcset], img[src]").forEach(o=>{let n=o.tagName==="IMG"?"src":"srcset",i=Gt(o.getAttribute(n),r.origin);i&&o.setAttribute(n,i)}),t.content.querySelector("picture").innerHTML}var jt=new Set(["SOURCE","IMG"]),Xt=new Set(["src","srcset","media","type","alt","role","loading","data-mobile-set","width","height"]);function At(e){if(typeof e!="string"||!e)return"";let r=document.createElement("template"),t=/^\s*<picture[\s>]/i.test(e);r.innerHTML=t?e:`<picture>${e}</picture>`;let o=r.content.querySelector("picture");return o?(o.querySelectorAll("*").forEach(n=>{if(!jt.has(n.tagName)){n.remove();return}[...n.attributes].forEach(i=>{Xt.has(i.name.toLowerCase())||n.removeAttribute(i.name)})}),o.innerHTML):""}var Zt="(min-width: 1200px)",Qt="(min-width: 600px)";function Tt(e,r){if(!e)return"";let t=new DOMParser().parseFromString(`<picture>${e}</picture>`,"text/html");if(r==="desktop")return t.querySelector(`source[media="${Zt}"]`)?.getAttribute("srcset")??"";if(r==="tablet")return t.querySelector(`source[media="${Qt}"]`)?.getAttribute("srcset")??"";if(r==="mobile"){let o=t.querySelector("img");return o?.hasAttribute("data-mobile-set")?o.getAttribute("src")??"":""}return""}var Q="mas-field",Jt=/(accent|primary|secondary)(-(outline|link))?/,te=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function ee(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}function _t(e,r){let t=document.createElement("template");t.innerHTML=e;let o=[...t.content.querySelectorAll("a")],n=o.filter(i=>et.has(i.dataset.analyticsId));return n.length===0?e:n.length===o.length?r?null:e:(n.forEach(i=>i.remove()),t.innerHTML)}function re(e,r){if(!e)return r;let t=e.closest(Q);if(!(t||e.hasAttribute("fragment-id")))return r;if(r[it]=!0,r.wrapClauses=!0,lt(t?.aemFragment?.data?.priceLiterals,r),dt(e,r),t&&e.dataset.template===ot&&(r.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!r.promotionCode){let n=e.dataset.promotionCode??(t?M(t):null);n&&(r.promotionCode=n)}pt(t,r)}function oe(e,r){if(r.promotionCode||!e)return;let t=e.closest(Q),o=e.dataset.promotionCode??(t?M(t):null);o&&(r.promotionCode=o)}function ne(e){ut(e,re,oe)}var ie=`
mas-field {
    display: contents;
}

/* An :empty span still counts as a flex gap item under display:contents; hide it. */
mas-field > [data-role="mas-field-content"]:empty {
    display: none;
}

/* A headless mas-field is often authored with CTA classes (e.g. feds-cta) directly
   on the host. Those classes can carry their own display value at the same
   specificity as the rule above, which can beat display:contents and leave an
   empty, still-styled CTA box visible when the field resolves to nothing (e.g. a
   trial CTA stripped by hideTrialCTAs). #renderField sets [hidden] in that case;
   force it to win regardless of what other classes are on the host. */
mas-field[hidden] {
    display: none !important;
}

mas-field div[slot="footer"] {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    align-items: center;
}

mas-field span.placeholder-resolved[data-template='priceStrikethrough'],
mas-field span.placeholder-resolved[data-template='strikethrough'],
mas-field span.price.price-strikethrough,
mas-field span.price.price-promo-strikethrough {
    text-decoration: line-through;
    color: var(--merch-color-inline-price-strikethrough);
}

/* Render the RTE tooltip node (serialized as a bare .icon-button span) as an info
   glyph with a tooltip when a placeholder is consumed through mas-field outside a
   merch-card (e.g. a headless DA page). Ports Milo's tooltip model (libs/features/
   icons/icons.css) so it looks/behaves like production: a placement class
   (top|bottom|left|right) drives the popover side and #decorateTooltips re-picks the
   side on hover/focus so it never clips. Kept self-contained because mas-field is a
   bundled component and Milo does not decorate mas-field content. */
mas-field .icon-button {
    position: relative;
    text-decoration: none;
    border-bottom: none;
    margin-inline-start: 7px;
}

mas-field .icon-button svg {
    height: 1em;
    width: auto;
    position: relative;
    top: 0.1em;
}

/* Default (right) popover. */
mas-field .icon-button::before {
    content: attr(data-tooltip);
    position: absolute;
    top: 50%;
    left: 100%;
    transform: translateY(-50%);
    margin-left: 7px;
    width: max-content;
    max-width: 140px;
    padding: 10px;
    border-radius: 5px;
    background: #0469E3;
    color: #fff;
    text-align: left;
    font-size: 12px;
    font-weight: 400;
    line-height: 16px;
    z-index: 10;
    display: none;
}

mas-field .icon-button::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 100%;
    margin-left: -8px;
    transform: translateY(-50%);
    border: 8px solid transparent;
    border-right-color: #0469E3;
    z-index: 10;
    display: none;
}

mas-field .icon-button.left::before {
    left: initial;
    margin: initial;
    right: 100%;
    margin-right: 8px;
}

mas-field .icon-button.left::after {
    left: initial;
    right: 100%;
    margin-left: 0;
    margin-right: -8px;
    border-right-color: transparent;
    border-left-color: #0469E3;
}

mas-field .icon-button.top::before {
    left: calc(50% - 11px);
    right: initial;
    top: -6px;
    margin: 0 0 15px 7px;
    transform: translateX(-50%) translateY(-100%);
}

mas-field .icon-button.top::after {
    left: 50%;
    right: initial;
    top: 2px;
    margin-left: -8px;
    transform: translateY(-50%);
    border-right-color: transparent;
    border-top-color: #0469E3;
}

mas-field .icon-button.bottom::before {
    left: calc(50% - 11px);
    right: initial;
    top: 100%;
    margin: 9px 0 0 7px;
    transform: translateX(-50%);
}

mas-field .icon-button.bottom::after {
    left: 50%;
    right: initial;
    top: calc(100% + 1px);
    margin-left: -8px;
    transform: translateY(-50%);
    border-right-color: transparent;
    border-bottom-color: #0469E3;
}

mas-field .icon-button:hover::before,
mas-field .icon-button:focus::before,
mas-field .icon-button:active::before,
mas-field .icon-button:hover::after,
mas-field .icon-button:focus::after,
mas-field .icon-button:active::after {
    display: block;
}

mas-field .icon-button.hide-tooltip::before,
mas-field .icon-button.hide-tooltip::after {
    display: none;
}

@media (max-width: 600px) {
    mas-field .icon-button::before {
        max-width: 180px;
    }
}

.table .row-heading .col-heading .pricing:has(.price-annual-prefix) {
  display: flex;
  flex-direction: column;
}

.table .row-heading .col-heading .pricing .price-annual-prefix + .price-annual,
.table .row-heading .col-heading .pricing .price-annual-prefix,
.table .row-heading .col-heading .pricing .price-annual-suffix {
  font-size: var(--type-heading-xxs-size);
  line-height: var(--type-heading-xxs-size);
  font-weight: 400;
  position: relative;
}

.pricing.has-pricing-after .price-annual-prefix {
  display: none;
}

.pricing.has-pricing-after:has(.price-annual-prefix) .price:not(.price-annual) {
  display: block;
}

.pricing.has-pricing-after .price-annual-prefix + .price-annual::before {
  content: '(';
}
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=ie,document.head.append(e)}function xt(e,r=globalThis.location){return typeof e!="string"||!e?"":`<picture>${gt(e,r)}</picture>`}var S,w,g,h,N,a,v,q,K,St,D,bt,Lt,z,j,Ct,X,Z,Rt,R,wt,Nt,b,W=class extends HTMLElement{constructor(){super(...arguments);x(this,a);x(this,S,null);x(this,w,!1);x(this,g,null);Y(this,"settings",null);x(this,h,null);Y(this,"compatVersion");x(this,N,t=>{t.target===this.aemFragment&&(_(this,g,t.detail?.fields||null),this.settings=t.detail?.settings??null,_(this,w,!0),c(this,a,j).call(this),this.dispatchEvent(new CustomEvent(rt,{bubbles:!0,composed:!0,detail:t.detail})))})}get contextPromotionCode(){return this.getAttribute("data-promotion-code")}static get observedAttributes(){return["field"]}attributeChangedCallback(t,o,n){t==="field"&&(_(this,S,n),c(this,a,j).call(this))}connectedCallback(){this.addEventListener(O,p(this,N)),c(this,a,v).call(this),this.aemFragment?.setAttribute("hidden",""),ne(at())}disconnectedCallback(){this.removeEventListener(O,p(this,N))}checkReady(){return p(this,w)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(O,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return ct(this)}};S=new WeakMap,w=new WeakMap,g=new WeakMap,h=new WeakMap,N=new WeakMap,a=new WeakSet,v=function(t=!1){if(p(this,h)?.isConnected&&p(this,h).matches('[data-role="mas-field-content"]')&&(!t||p(this,h).tagName==="SPAN"))return p(this,h);let o=this.querySelector(':scope > [data-role="mas-field-content"]');if(o&&(!t||o.tagName==="SPAN"))return _(this,h,o),o;t&&o?.remove();let n=document.createElement("span");return n.setAttribute("data-role","mas-field-content"),this.append(n),_(this,h,n),n},q=function(){this.querySelector(':scope > [data-role="mas-field-content"]')?.remove(),_(this,h,null)},K=function(t){let o=document.createElement("template");o.innerHTML=t;let n=o.content.querySelector("picture");if(!n)return;n.innerHTML=At(n.innerHTML),n.setAttribute("data-role","mas-field-content");let i=this.querySelector(':scope > [data-role="mas-field-content"]');i?i.replaceWith(n):this.append(n),_(this,h,n),c(this,a,R).call(this,n)},St=function(t){let o=c(this,a,b).call(this,c(this,a,D).call(this,p(this,g).backgroundImageAltText));return`<img loading="lazy" ${typeof o=="string"&&o?`alt="${ee(o)}"`:'role="none"'} src="${B(t)}">`},D=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},bt=function(t){let o=t?.match(/^(.+)\[(\d+)\]$/);if(o)return{fieldName:o[1],index:parseInt(o[2],10)};let n=t?.match(/^(.+)\[(.+)\]$/);return n?{fieldName:n[1],index:n[2]}:{fieldName:t,index:null}},Lt=function(t,o){if(typeof t!="string")return null;let n=document.createElement("template");n.innerHTML=t;let i;if(!isNaN(o)){let l=parseInt(o,10);i=[...n.content.querySelectorAll("a")][l-1]}return i||(i=n.content.querySelector(`a[data-key="${o}"]`)),i?(i.removeAttribute("class"),i.outerHTML):null},z=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},j=function(){if(!p(this,g)||!p(this,S))return;this.hidden=!1;let{fieldName:t,index:o}=c(this,a,bt).call(this,p(this,S));if(o!==null&&isNaN(o)){let s=`${t.replace(/s$/,"")}Labels`,d=p(this,g)[s];if(d!==void 0){let f=(Array.isArray(d)?d:[d]).indexOf(o);if(f===-1){this.hidden=!0;return}let m=p(this,g)[t],u=Array.isArray(m)?m:m?[m]:[],A=c(this,a,D).call(this,u[f]);if(!A){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs&&(A=_t(A,!0),A===null)){this.hidden=!0;return}c(this,a,z).call(this);let L=c(this,a,v).call(this,!0);L.innerHTML=c(this,a,b).call(this,A)??"",c(this,a,X).call(this,L),c(this,a,Z).call(this,L),c(this,a,R).call(this,L);return}}let n=c(this,a,D).call(this,p(this,g)[t]);if(n===void 0){this.hidden=!0;return}if(c(this,a,z).call(this),o===null&&(t==="image"||t==="backgroundImage"||t==="backgrounds")){let s=c(this,a,b).call(this,n);if(typeof s=="string"&&s){let d=t==="image"||t==="backgrounds"?s:c(this,a,St).call(this,s);c(this,a,K).call(this,xt(d))}else c(this,a,q).call(this),this.hidden=!0;return}if(t==="backgrounds"&&o!==null){let s=c(this,a,b).call(this,Tt(n,o)),d=typeof s=="string"&&s?Et(s):"";d?c(this,a,K).call(this,xt(d)):(c(this,a,q).call(this),this.hidden=!0);return}let i=c(this,a,v).call(this,!0),l;if(o!==null){if(l=c(this,a,Lt).call(this,n,o),l===null){this.hidden=!0;return}}else l=c(this,a,b).call(this,n);if(typeof l=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(l=_t(l,o!==null),l===null)){this.hidden=!0;return}if(p(this,S)==="ctas"){let s=c(this,a,Nt).call(this,l);if(s){i.replaceChildren(s),c(this,a,R).call(this,i);return}}i.innerHTML=l,c(this,a,X).call(this,i),c(this,a,Z).call(this,i),c(this,a,R).call(this,i);return}if(l==null){this.hidden=!0;return}i.textContent=String(l)},Ct=function(t,o){return customElements.get("checkout-link")?.createCheckoutLink(t,o)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${o}</span>`,i})()},X=function(t){for(let o of t.querySelectorAll("a[data-wcs-osi]:not([is])")){let n=c(this,a,Ct).call(this,o.dataset,o.innerHTML);for(let{name:i,value:l}of o.attributes)["is","href"].includes(i)||n.setAttribute(i,l);o.replaceWith(n)}},Z=function(t){let o=t.querySelectorAll(".icon-button[data-tooltip]");for(let n of o){if(n.dataset.tooltipWired)continue;n.dataset.tooltipWired="1",n.querySelector("svg")||n.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),n.hasAttribute("tabindex")||n.setAttribute("tabindex","0"),n.hasAttribute("role")||n.setAttribute("role","button"),n.hasAttribute("aria-label")||n.setAttribute("aria-label",n.dataset.tooltip);let i=["top","bottom","left","right"],l=[...n.classList].find(f=>i.includes(f)),s=l||"top";l||n.classList.add(s),n.dataset.originalPosition=s,n.classList.add("hide-tooltip");let d=()=>{n.classList.remove("hide-tooltip"),c(this,a,Rt).call(this,n)},E=()=>n.classList.add("hide-tooltip");n.addEventListener("mouseenter",d),n.addEventListener("focus",d),n.addEventListener("mouseleave",E),n.addEventListener("blur",E),n.addEventListener("keydown",f=>{f.key==="Escape"&&E()})}},Rt=function(t){let o=["top","bottom","right","left"],n=window.innerWidth,i=12,l=document.querySelector("header")?.getBoundingClientRect().height||0,s=window.getComputedStyle(t,"::before"),d=F=>parseFloat(F)||0,E=d(s.width)+d(s.paddingLeft)+d(s.paddingRight),f=d(s.height)+d(s.paddingTop)+d(s.paddingBottom),m=t.getBoundingClientRect(),u=t.dataset.originalPosition||"top",A=o.find(F=>t.classList.contains(F)),J=u==="top"||u==="bottom"?E/2:E,yt=u==="top"?f+(u==="top"?i:0):f/2,y=m.top-yt<l,H=m.bottom+(u==="bottom"?f+i:0)>window.innerHeight,C=m.right+J+i>n,P=m.left-J-i<0,U=m.left+E/2+i>n,k=m.left-E/2-i<0;if(u!==A&&!(C||P||y||H||U||k)){t.classList.remove(...o),t.classList.add(u);return}let T=u;C&&U?T="left":P&&k?T="right":C&&y||P&&y?T=U&&"left"||k&&"right"||"bottom":C!==P&&!H?T=C?"left":"right":y&&["top","left","right"].includes(u)?T="bottom":H&&["bottom","left","right"].includes(u)&&(T="top"),A!==T&&(t.classList.remove(...o),t.classList.add(T))},R=function(t){let o=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!o.length)return;let n=(i,l)=>{if(l!=null)for(let s of o)s.hasAttribute(i)||s.setAttribute(i,l)};for(let i of te)n(i,this.getAttribute(i));n("data-promotion-code",M(this))},wt=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let i=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let s=document.createElement("a",{is:"checkout-link"});return s.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,s})();for(let{name:s,value:d}of t.attributes)["class","is","href"].includes(s)||i.setAttribute(s,d);if(i.firstElementChild?.classList.add("spectrum-Button-label"),t.className){let s=Jt.exec(t.className)?.[0]??"accent",d=s.startsWith("accent");return s.includes("-link")||(i.classList.add("button","con-button"),d?i.classList.add("blue"):s.startsWith("primary")&&!s.includes("-outline")&&i.classList.add("fill")),i}let l=t.parentElement?.tagName;if(l==="STRONG"||l==="EM"){let s=document.createElement(l.toLowerCase());return s.append(i),s}return i},Nt=function(t){let n=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!n.length)return null;let i=document.createElement("div");return i.setAttribute("slot","footer"),i.append(...n.map(l=>c(this,a,wt).call(this,l))),i},b=function(t){if(typeof t!="string")return t;let o=t.trim();if(!(o.startsWith("<p>")&&o.endsWith("</p>")))return t;let i=o.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(Q,W);export{oe as checkoutOptionsProvider,re as priceOptionsProvider,xt as renderImageMarkup};
