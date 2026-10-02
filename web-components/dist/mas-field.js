var Ot=Object.defineProperty;var rt=e=>{throw TypeError(e)};var It=(e,o,t)=>o in e?Ot(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t;var Y=(e,o,t)=>It(e,typeof o!="symbol"?o+"":o,t),$=(e,o,t)=>o.has(e)||rt("Cannot "+t);var m=(e,o,t)=>($(e,o,"read from private field"),t?t.call(e):o.get(e)),x=(e,o,t)=>o.has(e)?rt("Cannot add the same private member more than once"):o instanceof WeakSet?o.add(e):o.set(e,t),_=(e,o,t,r)=>($(e,o,"write to private field"),r?r.call(e,t):o.set(e,t),t),l=(e,o,t)=>($(e,o,"access private method"),t);var ue=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),me=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var vt='span[is="inline-price"][data-wcs-osi]',Ht='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Dt='a[is="upt-link"]',he=`${vt},${Ht},${Dt}`,nt=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var M="aem:load";var ot="mas:ready";var fe=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Ee=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var it="legal",st="plan-type-text",at="mas-ff-defaults";var Ut="mas-commerce-service",V=/^(accent|primary|secondary)(-(outline|link))?$/;function kt(e,o={},t=null,r=null){let n=r?document.createElement(e,{is:r}):document.createElement(e);t instanceof HTMLElement?n.appendChild(t):n.innerHTML=t;for(let[i,a]of Object.entries(o))n.setAttribute(i,a);return n}function Ft(e){let o=[...e.classList].find(r=>V.test(r));if(o)return o;let t=e.closest("strong, em");return t?.tagName==="STRONG"?"primary":t?.tagName==="EM"?"secondary":"secondary-link"}function G(e){let o=Ft(e),t=e.cloneNode(!0);if([...e.classList].some(n=>V.test(n))){let n=e.parentElement;for(;n?.matches("strong, em");)t.replaceChildren(kt(n.tagName.toLowerCase(),{},t.innerHTML)),n=n.parentElement}let r=t;if(e.dataset.wcsOsi){r=customElements.get("checkout-link")?.createCheckoutLink(e.dataset,t.innerHTML),r||(r=document.createElement("a",{is:"checkout-link"}),r.setAttribute("is","checkout-link"),r.innerHTML=`<span style="pointer-events: none;">${t.innerHTML}</span>`);for(let{name:i,value:a}of e.attributes)["is","href"].includes(i)||r.setAttribute(i,a)}for(let n of[...r.classList])V.test(n)&&r.classList.remove(n);return o.endsWith("-link")||(r.classList.add("button","con-button"),r.classList.add(o==="accent"||o==="primary"?"blue":"outline")),r}function ct(){return document.getElementsByTagName(Ut)?.[0]}function lt(e){let o=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&o?.isInlinePrice&&o?.dataset?.template==="price"}var Yt=[".","!","?"],$t=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=$t,document.head.append(e)}var Vt="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function Gt(e){let o=e.closest(Vt)??e.parentNode,t=document.createRange();return t.setStart(o,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function dt(e){let o=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(o.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??o[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function Bt(e){let o=Gt(e);return!o||Yt.includes(o)?"upper":"lower"}function B(e,o){if(e.dataset.placeholder!==st)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(o.wcsOsi=t,o.planTypeCase=Bt(e))}function qt(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")}function O(e){return qt(e)?e.contextPromotionCode:null}function pt(e,o){e&&(o.literals??(o.literals={}),Object.assign(o.literals,e))}function ut(e,o){lt(e)&&(o.displayPerUnit=!1,o.displayTax=!1)}function mt(e,o){o.displayAnnual===void 0&&typeof e?.settings?.displayAnnual=="boolean"&&(o.displayAnnual=e.settings.displayAnnual,e.settings.displayAnnual&&e.setAttribute("annualized",""))}function ht(e,o,t){!e?.providers||e.providers.has(o)||(e.providers.price(o),e.providers.checkout(t),e.providers.has(B)||e.providers.price(B))}function zt(e,o){if(typeof e!="string"||!e)return null;let t;try{t=new URL(e,o)}catch{return null}return t.hostname.endsWith(".aem.page")?`${o}${t.pathname}${t.search}`:null}function q(e){if(typeof e!="string"||!e)return"";try{return new URL(e).href}catch{return""}}function Kt(e){if(typeof e!="string"||!e)return!1;try{return new URL(e).hostname.endsWith(".aem.page")}catch{return!1}}var jt={png:{type:"image/png",format:"png"},jpg:{type:"image/jpeg",format:"jpg"},jpeg:{type:"image/jpeg",format:"jpg"},webp:{type:"image/webp",format:"webp"},gif:{type:"image/gif",format:"gif"}},W={width:2e3,media:"(min-width: 600px)"},Xt=750;function I(e,o,t){let r=new URL(e);return r.searchParams.set("width",o),r.searchParams.set("format",t),r.searchParams.set("optimize","medium"),r.href}function ft(e,o){return o?.width?Math.min(e,o.width):e}function Zt(e){let o=new URL(e).pathname.split(".").pop().toLowerCase();return jt[o]??null}function Et(e){return String(e??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function gt(e){return!e?.width||!e?.height?"":` width="${e.width}" height="${e.height}"`}function At(e,o,t=""){if(!Kt(e))return"";let r=q(e),n=Zt(r);if(!n)return`<img loading="lazy" alt="${Et(t)}"${gt(o)} src="${r}">`;let{type:i,format:a}=n,c=ft(W.width,o),d=ft(Xt,o);return[`<source type="image/webp" srcset="${I(r,c,"webply")}" media="${W.media}">`,`<source type="image/webp" srcset="${I(r,d,"webply")}">`,`<source type="${i}" srcset="${I(r,c,a)}" media="${W.media}">`,`<img loading="lazy" alt="${Et(t)}" src="${I(r,d,a)}"${gt(o)}>`].join("")}function Qt(e){return e?.hostname==="www.adobe.com"||e?.hostname==="adobe.com"}function Tt(e,o=globalThis.location){if(typeof e!="string"||!e||!Qt(o))return e;let t=document.createElement("template");return t.innerHTML=`<picture>${e}</picture>`,t.content.querySelectorAll("source[srcset], img[src]").forEach(r=>{let n=r.tagName==="IMG"?"src":"srcset",i=zt(r.getAttribute(n),o.origin);i&&r.setAttribute(n,i)}),t.content.querySelector("picture").innerHTML}var Jt=new Set(["SOURCE","IMG"]),te=new Set(["src","srcset","media","type","alt","role","loading","data-mobile-set","width","height"]);function _t(e){if(typeof e!="string"||!e)return"";let o=document.createElement("template"),t=/^\s*<picture[\s>]/i.test(e);o.innerHTML=t?e:`<picture>${e}</picture>`;let r=o.content.querySelector("picture");return r?(r.querySelectorAll("*").forEach(n=>{if(!Jt.has(n.tagName)){n.remove();return}[...n.attributes].forEach(i=>{te.has(i.name.toLowerCase())||n.removeAttribute(i.name)})}),r.innerHTML):""}var ee="(min-width: 1200px)",re="(min-width: 600px)";function xt(e,o){if(!e)return"";let t=new DOMParser().parseFromString(`<picture>${e}</picture>`,"text/html");if(o==="desktop")return t.querySelector(`source[media="${ee}"]`)?.getAttribute("srcset")??"";if(o==="tablet")return t.querySelector(`source[media="${re}"]`)?.getAttribute("srcset")??"";if(o==="mobile"){let r=t.querySelector("img");return r?.hasAttribute("data-mobile-set")?r.getAttribute("src")??"":""}return""}var tt="mas-field",ne=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function oe(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}function bt(e,o){let t=document.createElement("template");t.innerHTML=e;let r=[...t.content.querySelectorAll("a")],n=r.filter(i=>nt.has(i.dataset.analyticsId));return n.length===0?e:n.length===r.length?o?null:e:(n.forEach(i=>i.remove()),t.innerHTML)}function ie(e,o){if(!e)return o;let t=e.closest(tt);if(!(t||e.hasAttribute("fragment-id")))return o;if(o[at]=!0,o.wrapClauses=!0,pt(t?.aemFragment?.data?.priceLiterals,o),ut(e,o),t&&e.dataset.template===it&&(o.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!o.promotionCode){let n=e.dataset.promotionCode??(t?O(t):null);n&&(o.promotionCode=n)}mt(t,o)}function se(e,o){if(o.promotionCode||!e)return;let t=e.closest(tt),r=e.dataset.promotionCode??(t?O(t):null);r&&(o.promotionCode=r)}function ae(e){ht(e,ie,se)}var ce=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=ce,document.head.append(e)}function St(e,o=globalThis.location){return typeof e!="string"||!e?"":`<picture>${Tt(e,o)}</picture>`}var S,w,g,E,N,s,v,K,j,Lt,H,Ct,Rt,X,Z,wt,Q,J,Nt,R,yt,Pt,b,z=class extends HTMLElement{constructor(){super(...arguments);x(this,s);x(this,S,null);x(this,w,!1);x(this,g,null);Y(this,"settings",null);x(this,E,null);Y(this,"compatVersion");x(this,N,t=>{t.target===this.aemFragment&&(_(this,g,t.detail?.fields||null),this.settings=t.detail?.settings??null,_(this,w,!0),l(this,s,Z).call(this),this.dispatchEvent(new CustomEvent(ot,{bubbles:!0,composed:!0,detail:t.detail})))})}get contextPromotionCode(){return this.getAttribute("data-promotion-code")}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,n){t==="field"&&(_(this,S,n),l(this,s,Z).call(this))}connectedCallback(){this.addEventListener(M,m(this,N)),l(this,s,v).call(this),this.aemFragment?.setAttribute("hidden",""),ae(ct())}disconnectedCallback(){this.removeEventListener(M,m(this,N))}checkReady(){return m(this,w)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(M,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return dt(this)}};S=new WeakMap,w=new WeakMap,g=new WeakMap,E=new WeakMap,N=new WeakMap,s=new WeakSet,v=function(t=!1){if(m(this,E)?.isConnected&&m(this,E).matches('[data-role="mas-field-content"]')&&(!t||m(this,E).tagName==="SPAN"))return m(this,E);let r=this.querySelector(':scope > [data-role="mas-field-content"]');if(r&&(!t||r.tagName==="SPAN"))return _(this,E,r),r;t&&r?.remove();let n=document.createElement("span");return n.setAttribute("data-role","mas-field-content"),this.append(n),_(this,E,n),n},K=function(){this.querySelector(':scope > [data-role="mas-field-content"]')?.remove(),_(this,E,null)},j=function(t){let r=document.createElement("template");r.innerHTML=t;let n=r.content.querySelector("picture");if(!n)return;n.innerHTML=_t(n.innerHTML),n.setAttribute("data-role","mas-field-content");let i=this.querySelector(':scope > [data-role="mas-field-content"]');i?i.replaceWith(n):this.append(n),_(this,E,n),l(this,s,R).call(this,n)},Lt=function(t){let r=l(this,s,b).call(this,l(this,s,H).call(this,m(this,g).backgroundImageAltText));return`<img loading="lazy" ${typeof r=="string"&&r?`alt="${oe(r)}"`:'role="none"'} src="${q(t)}">`},H=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},Ct=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let n=t?.match(/^(.+)\[(.+)\]$/);return n?{fieldName:n[1],index:n[2]}:{fieldName:t,index:null}},Rt=function(t,r){if(typeof t!="string")return null;let n=document.createElement("template");n.innerHTML=t;let i;if(!isNaN(r)){let d=parseInt(r,10);i=[...n.content.querySelectorAll("a")][d-1]}if(i||(i=n.content.querySelector(`a[data-key="${r}"]`)),!i)return null;let a=i.outerHTML,c=i.parentElement;for(;c?.matches("strong, em");){let d=c.tagName.toLowerCase();a=`<${d}>${a}</${d}>`,c=c.parentElement}return a},X=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},Z=function(){if(!m(this,g)||!m(this,S))return;this.hidden=!1;let{fieldName:t,index:r}=l(this,s,Ct).call(this,m(this,S));if(r!==null&&isNaN(r)){let c=`${t.replace(/s$/,"")}Labels`,d=m(this,g)[c];if(d!==void 0){let f=(Array.isArray(d)?d:[d]).indexOf(r);if(f===-1){this.hidden=!0;return}let p=m(this,g)[t],u=Array.isArray(p)?p:p?[p]:[],A=l(this,s,H).call(this,u[f]);if(!A){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs&&(A=bt(A,!0),A===null)){this.hidden=!0;return}l(this,s,X).call(this);let L=l(this,s,v).call(this,!0);L.innerHTML=l(this,s,b).call(this,A)??"",l(this,s,Q).call(this,L),l(this,s,J).call(this,L),l(this,s,R).call(this,L);return}}let n=l(this,s,H).call(this,m(this,g)[t]);if(n===void 0){this.hidden=!0;return}if(l(this,s,X).call(this),r===null&&(t==="image"||t==="backgroundImage"||t==="backgrounds")){let c=l(this,s,b).call(this,n);if(typeof c=="string"&&c){let d=t==="image"||t==="backgrounds"?c:l(this,s,Lt).call(this,c);l(this,s,j).call(this,St(d))}else l(this,s,K).call(this),this.hidden=!0;return}if(t==="backgrounds"&&r!==null){let c=l(this,s,b).call(this,xt(n,r)),d=typeof c=="string"&&c?At(c):"";d?l(this,s,j).call(this,St(d)):(l(this,s,K).call(this),this.hidden=!0);return}let i=l(this,s,v).call(this,!0),a;if(r!==null){if(a=l(this,s,Rt).call(this,n,r),a===null){this.hidden=!0;return}}else a=l(this,s,b).call(this,n);if(typeof a=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(a=bt(a,r!==null),a===null)){this.hidden=!0;return}if(t==="ctas"){let c=l(this,s,Pt).call(this,a,r!==null);if(c){l(this,s,yt).call(this,c),i.replaceChildren(c),l(this,s,R).call(this,i);return}}i.innerHTML=a,l(this,s,Q).call(this,i),l(this,s,J).call(this,i),l(this,s,R).call(this,i);return}if(a==null){this.hidden=!0;return}i.textContent=String(a)},wt=function(t,r){return customElements.get("checkout-link")?.createCheckoutLink(t,r)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${r}</span>`,i})()},Q=function(t){for(let r of t.querySelectorAll("a[data-wcs-osi]:not([is])")){let n=l(this,s,wt).call(this,r.dataset,r.innerHTML);for(let{name:i,value:a}of r.attributes)["is","href"].includes(i)||n.setAttribute(i,a);r.replaceWith(n)}},J=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let n of r){if(n.dataset.tooltipWired)continue;n.dataset.tooltipWired="1",n.querySelector("svg")||n.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),n.hasAttribute("tabindex")||n.setAttribute("tabindex","0"),n.hasAttribute("role")||n.setAttribute("role","button"),n.hasAttribute("aria-label")||n.setAttribute("aria-label",n.dataset.tooltip);let i=["top","bottom","left","right"],a=[...n.classList].find(f=>i.includes(f)),c=a||"top";a||n.classList.add(c),n.dataset.originalPosition=c,n.classList.add("hide-tooltip");let d=()=>{n.classList.remove("hide-tooltip"),l(this,s,Nt).call(this,n)},h=()=>n.classList.add("hide-tooltip");n.addEventListener("mouseenter",d),n.addEventListener("focus",d),n.addEventListener("mouseleave",h),n.addEventListener("blur",h),n.addEventListener("keydown",f=>{f.key==="Escape"&&h()})}},Nt=function(t){let r=["top","bottom","right","left"],n=window.innerWidth,i=12,a=document.querySelector("header")?.getBoundingClientRect().height||0,c=window.getComputedStyle(t,"::before"),d=F=>parseFloat(F)||0,h=d(c.width)+d(c.paddingLeft)+d(c.paddingRight),f=d(c.height)+d(c.paddingTop)+d(c.paddingBottom),p=t.getBoundingClientRect(),u=t.dataset.originalPosition||"top",A=r.find(F=>t.classList.contains(F)),et=u==="top"||u==="bottom"?h/2:h,Mt=u==="top"?f+(u==="top"?i:0):f/2,y=p.top-Mt<a,D=p.bottom+(u==="bottom"?f+i:0)>window.innerHeight,C=p.right+et+i>n,P=p.left-et-i<0,U=p.left+h/2+i>n,k=p.left-h/2-i<0;if(u!==A&&!(C||P||y||D||U||k)){t.classList.remove(...r),t.classList.add(u);return}let T=u;C&&U?T="left":P&&k?T="right":C&&y||P&&y?T=U&&"left"||k&&"right"||"bottom":C!==P&&!D?T=C?"left":"right":y&&["top","left","right"].includes(u)?T="bottom":D&&["bottom","left","right"].includes(u)&&(T="top"),A!==T&&(t.classList.remove(...r),t.classList.add(T))},R=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let n=(i,a)=>{if(a!=null)for(let c of r)c.hasAttribute(i)||c.setAttribute(i,a)};for(let i of ne)n(i,this.getAttribute(i));n("data-promotion-code",O(this))},yt=function(t){let r=this.closest(".section");if(!r)return;let n=this.parentElement;for(;n.matches("strong, em")&&n.childElementCount===1&&n.firstElementChild===this&&n.textContent.trim()===this.textContent.trim();)n.replaceWith(...n.childNodes),n=this.parentElement;let i=this;for(;i.parentElement!==r;)i=i.parentElement;let a=/^button-(s|m|l|xl|xxl)$/,c=[...i.querySelectorAll(".con-button")].find(p=>!this.contains(p)&&[...p.classList].some(u=>a.test(u))),d,h=[];if(c)d=[...c.classList].find(p=>a.test(p)),h=[...c.classList].filter(p=>p.startsWith("button-")&&!a.test(p));else{let p=[...i.classList].find(u=>/^(s|m|l|xl|xxl)-button$/.test(u));p?d=`button-${p.split("-")[0]}`:i.classList.contains("hero-marquee")?(d="button-xl",h=["button-justified-mobile"]):i.matches(".accordion, .media")||(d=i.matches(".large, .xlarge")?"button-xl":"button-l")}for(let p of this.merchLink?.matchAll(/(?:&|#)_button-([a-zA-Z-]+)/g)??[])h.push(p[1]);let f=t.matches(".con-button")?[t]:t.querySelectorAll(".con-button");for(let p of f)d&&![...p.classList].some(u=>a.test(u))&&p.classList.add(d),p.classList.add(...h);this.closest("p")?.classList.add("action-area")},Pt=function(t,r=!1){let i=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!i.length)return null;if(r)return G(i[0]);let a=document.createElement("div");return a.setAttribute("slot","footer"),a.classList.add("action-area"),a.append(...i.map(c=>G(c))),a},b=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let i=r.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(tt,z);export{se as checkoutOptionsProvider,ie as priceOptionsProvider,St as renderImageMarkup};
