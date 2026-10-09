var Ot=Object.defineProperty;var rt=e=>{throw TypeError(e)};var It=(e,n,t)=>n in e?Ot(e,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[n]=t;var Y=(e,n,t)=>It(e,typeof n!="symbol"?n+"":n,t),V=(e,n,t)=>n.has(e)||rt("Cannot "+t);var h=(e,n,t)=>(V(e,n,"read from private field"),t?t.call(e):n.get(e)),x=(e,n,t)=>n.has(e)?rt("Cannot add the same private member more than once"):n instanceof WeakSet?n.add(e):n.set(e,t),T=(e,n,t,r)=>(V(e,n,"write to private field"),r?r.call(e,t):n.set(e,t),t),d=(e,n,t)=>(V(e,n,"access private method"),t);var ue=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),me=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var vt='span[is="inline-price"][data-wcs-osi]',Ht='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Dt='a[is="upt-link"]',he=`${vt},${Ht},${Dt}`,nt=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var O="aem:load";var ot="mas:ready";var fe=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Ee=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var it="legal",st="plan-type-text",at="mas-ff-defaults";var Ut="mas-commerce-service",G=/^(accent|primary|secondary)(-(outline|link))?$/;function kt(e,n={},t=null,r=null){let o=r?document.createElement(e,{is:r}):document.createElement(e);t instanceof HTMLElement?o.appendChild(t):o.innerHTML=t;for(let[i,a]of Object.entries(n))o.setAttribute(i,a);return o}function $t(e){let n=[...e.classList].find(r=>G.test(r));if(n)return n;let t=e.closest("strong, em");return t?.tagName==="STRONG"?"primary":t?.tagName==="EM"?"secondary":"secondary-link"}function B(e){let n=$t(e),t=e.cloneNode(!0);if([...e.classList].some(o=>G.test(o))){let o=e.parentElement;for(;o?.matches("strong, em");)t.replaceChildren(kt(o.tagName.toLowerCase(),{},t.innerHTML)),o=o.parentElement}let r=t;if(e.dataset.wcsOsi){r=customElements.get("checkout-link")?.createCheckoutLink(e.dataset,t.innerHTML),r||(r=document.createElement("a",{is:"checkout-link"}),r.setAttribute("is","checkout-link"),r.innerHTML=`<span style="pointer-events: none;">${t.innerHTML}</span>`);for(let{name:i,value:a}of e.attributes)["is","href"].includes(i)||r.setAttribute(i,a)}for(let o of[...r.classList])G.test(o)&&r.classList.remove(o);return n.endsWith("-link")||(r.classList.add("button","con-button"),r.classList.add(n==="accent"||n==="primary"?"blue":"outline")),r}function ct(){return document.getElementsByTagName(Ut)?.[0]}function lt(e){let n=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&n?.isInlinePrice&&n?.dataset?.template==="price"}var Ft=[".","!","?"],Yt=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=Yt,document.head.append(e)}var Vt="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function Gt(e){let n=e.closest(Vt)??e.parentNode,t=document.createRange();return t.setStart(n,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function dt(e){let n=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(n.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??n[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function Bt(e){let n=Gt(e);return!n||Ft.includes(n)?"upper":"lower"}function W(e,n){if(e.dataset.placeholder!==st)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(n.wcsOsi=t,n.planTypeCase=Bt(e))}function qt(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")}function I(e){return qt(e)?e.contextPromotionCode:null}function pt(e,n){e&&(n.literals??(n.literals={}),Object.assign(n.literals,e))}function ut(e,n){lt(e)&&(n.displayPerUnit=!1,n.displayTax=!1)}function mt(e,n){n.displayAnnual===void 0&&typeof e?.settings?.displayAnnual=="boolean"&&(n.displayAnnual=e.settings.displayAnnual,e.settings.displayAnnual&&e.setAttribute("annualized",""))}function ht(e,n,t){!e?.providers||e.providers.has(n)||(e.providers.price(n),e.providers.checkout(t),e.providers.has(W)||e.providers.price(W))}function zt(e,n){if(typeof e!="string"||!e)return null;let t;try{t=new URL(e,n)}catch{return null}return t.hostname.endsWith(".aem.page")?`${n}${t.pathname}${t.search}`:null}function z(e){if(typeof e!="string"||!e)return"";try{return new URL(e).href}catch{return""}}function Kt(e){if(typeof e!="string"||!e)return!1;try{return new URL(e).hostname.endsWith(".aem.page")}catch{return!1}}var jt={png:{type:"image/png",format:"png"},jpg:{type:"image/jpeg",format:"jpg"},jpeg:{type:"image/jpeg",format:"jpg"},webp:{type:"image/webp",format:"webp"},gif:{type:"image/gif",format:"gif"}},q={width:2e3,media:"(min-width: 600px)"},Xt=750;function v(e,n,t){let r=new URL(e);return r.searchParams.set("width",n),r.searchParams.set("format",t),r.searchParams.set("optimize","medium"),r.href}function ft(e,n){return n?.width?Math.min(e,n.width):e}function Zt(e){let n=new URL(e).pathname.split(".").pop().toLowerCase();return jt[n]??null}function Et(e){return String(e??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function gt(e){return!e?.width||!e?.height?"":` width="${e.width}" height="${e.height}"`}function At(e,n,t=""){if(!Kt(e))return"";let r=z(e),o=Zt(r);if(!o)return`<img loading="lazy" alt="${Et(t)}"${gt(n)} src="${r}">`;let{type:i,format:a}=o,l=ft(q.width,n),c=ft(Xt,n);return[`<source type="image/webp" srcset="${v(r,l,"webply")}" media="${q.media}">`,`<source type="image/webp" srcset="${v(r,c,"webply")}">`,`<source type="${i}" srcset="${v(r,l,a)}" media="${q.media}">`,`<img loading="lazy" alt="${Et(t)}" src="${v(r,c,a)}"${gt(n)}>`].join("")}function Qt(e){return e?.hostname==="www.adobe.com"||e?.hostname==="adobe.com"}function Tt(e,n=globalThis.location){if(typeof e!="string"||!e||!Qt(n))return e;let t=document.createElement("template");return t.innerHTML=`<picture>${e}</picture>`,t.content.querySelectorAll("source[srcset], img[src]").forEach(r=>{let o=r.tagName==="IMG"?"src":"srcset",i=zt(r.getAttribute(o),n.origin);i&&r.setAttribute(o,i)}),t.content.querySelector("picture").innerHTML}var Jt=new Set(["SOURCE","IMG"]),te=new Set(["src","srcset","media","type","alt","role","loading","data-mobile-set","width","height"]);function _t(e){if(typeof e!="string"||!e)return"";let n=document.createElement("template"),t=/^\s*<picture[\s>]/i.test(e);n.innerHTML=t?e:`<picture>${e}</picture>`;let r=n.content.querySelector("picture");return r?(r.querySelectorAll("*").forEach(o=>{if(!Jt.has(o.tagName)){o.remove();return}[...o.attributes].forEach(i=>{te.has(i.name.toLowerCase())||o.removeAttribute(i.name)})}),r.innerHTML):""}var ee="(min-width: 1200px)",re="(min-width: 600px)";function xt(e,n){if(!e)return"";let t=new DOMParser().parseFromString(`<picture>${e}</picture>`,"text/html");if(n==="desktop")return t.querySelector(`source[media="${ee}"]`)?.getAttribute("srcset")??"";if(n==="tablet")return t.querySelector(`source[media="${re}"]`)?.getAttribute("srcset")??"";if(n==="mobile"){let r=t.querySelector("img");return r?.hasAttribute("data-mobile-set")?r.getAttribute("src")??"":""}return""}var et="mas-field",ne=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function oe(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}function bt(e,n){let t=document.createElement("template");t.innerHTML=e;let r=[...t.content.querySelectorAll("a")],o=r.filter(i=>nt.has(i.dataset.analyticsId));return o.length===0?e:o.length===r.length?n?null:e:(o.forEach(i=>i.remove()),t.innerHTML)}function ie(e,n){if(!e)return n;let t=e.closest(et);if(!(t||e.hasAttribute("fragment-id")))return n;if(n[at]=!0,n.wrapClauses=!0,pt(t?.aemFragment?.data?.priceLiterals,n),ut(e,n),t&&e.dataset.template===it&&(n.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!n.promotionCode){let o=e.dataset.promotionCode??(t?I(t):null);o&&(n.promotionCode=o)}mt(t,n)}function se(e,n){if(n.promotionCode||!e)return;let t=e.closest(et),r=e.dataset.promotionCode??(t?I(t):null);r&&(n.promotionCode=r)}function ae(e){ht(e,ie,se)}var ce=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=ce,document.head.append(e)}function St(e,n=globalThis.location){return typeof e!="string"||!e?"":`<picture>${Tt(e,n)}</picture>`}var L,w,g,f,N,s,H,j,X,Lt,D,Ct,Rt,Z,Q,wt,J,tt,Nt,R,yt,Mt,S,K=class extends HTMLElement{constructor(){super(...arguments);x(this,s);x(this,L,null);x(this,w,!1);x(this,g,null);Y(this,"settings",null);x(this,f,null);Y(this,"compatVersion");x(this,N,t=>{t.target===this.aemFragment&&(T(this,g,t.detail?.fields||null),this.settings=t.detail?.settings??null,T(this,w,!0),d(this,s,Q).call(this),this.dispatchEvent(new CustomEvent(ot,{bubbles:!0,composed:!0,detail:t.detail})))})}get contextPromotionCode(){return this.getAttribute("data-promotion-code")}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,o){t==="field"&&(T(this,L,o),d(this,s,Q).call(this))}connectedCallback(){this.addEventListener(O,h(this,N)),d(this,s,H).call(this),this.aemFragment?.setAttribute("hidden",""),ae(ct())}disconnectedCallback(){this.removeEventListener(O,h(this,N))}checkReady(){return h(this,w)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(O,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return dt(this)}};L=new WeakMap,w=new WeakMap,g=new WeakMap,f=new WeakMap,N=new WeakMap,s=new WeakSet,H=function(t=!1){if(h(this,f)?.isConnected&&h(this,f).matches('[data-role="mas-field-content"]')&&(!t||h(this,f).tagName==="SPAN"))return h(this,f);let r=this.querySelector(':scope > [data-role="mas-field-content"]');if(r&&(!t||r.tagName==="SPAN"))return T(this,f,r),r;t&&r?.remove();let o=document.createElement("span");return o.setAttribute("data-role","mas-field-content"),this.append(o),T(this,f,o),o},j=function(){this.querySelector(':scope > [data-role="mas-field-content"]')?.remove(),T(this,f,null)},X=function(t){let r=document.createElement("template");r.innerHTML=t;let o=r.content.querySelector("picture");if(!o)return;o.innerHTML=_t(o.innerHTML),o.setAttribute("data-role","mas-field-content");let i=this.querySelector(':scope > [data-role="mas-field-content"]');i?i.replaceWith(o):this.append(o),T(this,f,o),d(this,s,R).call(this,o)},Lt=function(t){let r=d(this,s,S).call(this,d(this,s,D).call(this,h(this,g).backgroundImageAltText));return`<img loading="lazy" ${typeof r=="string"&&r?`alt="${oe(r)}"`:'role="none"'} src="${z(t)}">`},D=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},Ct=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let o=t?.match(/^(.+)\[(.+)\]$/);return o?{fieldName:o[1],index:o[2]}:{fieldName:t,index:null}},Rt=function(t,r,o){if(typeof t!="string")return null;let i=document.createElement("template");i.innerHTML=t;let a;if(!isNaN(r)){let p=parseInt(r,10);a=[...i.content.querySelectorAll("a")][p-1]}if(a||(a=i.content.querySelector(`a[data-key="${r}"]`)),!a)return null;if(o)return a.removeAttribute("class"),a.outerHTML;let l=a.outerHTML,c=a.parentElement;for(;c?.matches("strong, em");){let p=c.tagName.toLowerCase();l=`<${p}>${l}</${p}>`,c=c.parentElement}return l},Z=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},Q=function(){if(!h(this,g)||!h(this,L))return;this.hidden=!1;let{fieldName:t,index:r}=d(this,s,Ct).call(this,h(this,L)),o=t==="ctas"&&r!==null&&!!(this.closest("strong, em, .feds-cta-wrapper")||this.querySelector(":scope > strong, :scope > em"));if(r!==null&&isNaN(r)){let c=`${t.replace(/s$/,"")}Labels`,p=h(this,g)[c];if(p!==void 0){let u=(Array.isArray(p)?p:[p]).indexOf(r);if(u===-1){this.hidden=!0;return}let m=h(this,g)[t],y=Array.isArray(m)?m:m?[m]:[],b=d(this,s,D).call(this,y[u]);if(!b){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs&&(b=bt(b,!0),b===null)){this.hidden=!0;return}d(this,s,Z).call(this);let _=d(this,s,H).call(this,!0);_.innerHTML=d(this,s,S).call(this,b)??"",d(this,s,J).call(this,_),d(this,s,tt).call(this,_),d(this,s,R).call(this,_);return}}let i=d(this,s,D).call(this,h(this,g)[t]);if(i===void 0){this.hidden=!0;return}if(d(this,s,Z).call(this),r===null&&(t==="image"||t==="backgroundImage"||t==="backgrounds")){let c=d(this,s,S).call(this,i);if(typeof c=="string"&&c){let p=t==="image"||t==="backgrounds"?c:d(this,s,Lt).call(this,c);d(this,s,X).call(this,St(p))}else d(this,s,j).call(this),this.hidden=!0;return}if(t==="backgrounds"&&r!==null){let c=d(this,s,S).call(this,xt(i,r)),p=typeof c=="string"&&c?At(c):"";p?d(this,s,X).call(this,St(p)):(d(this,s,j).call(this),this.hidden=!0);return}let a=d(this,s,H).call(this,!0),l;if(r!==null){if(l=d(this,s,Rt).call(this,i,r,o),l===null){this.hidden=!0;return}}else l=d(this,s,S).call(this,i);if(typeof l=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(l=bt(l,r!==null),l===null)){this.hidden=!0;return}if(t==="ctas"&&!o){let c=d(this,s,Mt).call(this,l,r!==null);if(c){d(this,s,yt).call(this,c),a.replaceChildren(c),d(this,s,R).call(this,a);return}}a.innerHTML=l,d(this,s,J).call(this,a),d(this,s,tt).call(this,a),d(this,s,R).call(this,a);return}if(l==null){this.hidden=!0;return}a.textContent=String(l)},wt=function(t,r){return customElements.get("checkout-link")?.createCheckoutLink(t,r)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${r}</span>`,i})()},J=function(t){for(let r of t.querySelectorAll("a[data-wcs-osi]:not([is])")){let o=d(this,s,wt).call(this,r.dataset,r.innerHTML);for(let{name:i,value:a}of r.attributes)["is","href"].includes(i)||o.setAttribute(i,a);r.replaceWith(o)}},tt=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let o of r){if(o.dataset.tooltipWired)continue;o.dataset.tooltipWired="1",o.querySelector("svg")||o.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),o.hasAttribute("tabindex")||o.setAttribute("tabindex","0"),o.hasAttribute("role")||o.setAttribute("role","button"),o.hasAttribute("aria-label")||o.setAttribute("aria-label",o.dataset.tooltip);let i=["top","bottom","left","right"],a=[...o.classList].find(E=>i.includes(E)),l=a||"top";a||o.classList.add(l),o.dataset.originalPosition=l,o.classList.add("hide-tooltip");let c=()=>{o.classList.remove("hide-tooltip"),d(this,s,Nt).call(this,o)},p=()=>o.classList.add("hide-tooltip");o.addEventListener("mouseenter",c),o.addEventListener("focus",c),o.addEventListener("mouseleave",p),o.addEventListener("blur",p),o.addEventListener("keydown",E=>{E.key==="Escape"&&p()})}},Nt=function(t){let r=["top","bottom","right","left"],o=window.innerWidth,i=12,a=document.querySelector("header")?.getBoundingClientRect().height||0,l=window.getComputedStyle(t,"::before"),c=F=>parseFloat(F)||0,p=c(l.width)+c(l.paddingLeft)+c(l.paddingRight),E=c(l.height)+c(l.paddingTop)+c(l.paddingBottom),u=t.getBoundingClientRect(),m=t.dataset.originalPosition||"top",y=r.find(F=>t.classList.contains(F)),_=m==="top"||m==="bottom"?p/2:p,Pt=m==="top"?E+(m==="top"?i:0):E/2,M=u.top-Pt<a,U=u.bottom+(m==="bottom"?E+i:0)>window.innerHeight,C=u.right+_+i>o,P=u.left-_-i<0,k=u.left+p/2+i>o,$=u.left-p/2-i<0;if(m!==y&&!(C||P||M||U||k||$)){t.classList.remove(...r),t.classList.add(m);return}let A=m;C&&k?A="left":P&&$?A="right":C&&M||P&&M?A=k&&"left"||$&&"right"||"bottom":C!==P&&!U?A=C?"left":"right":M&&["top","left","right"].includes(m)?A="bottom":U&&["bottom","left","right"].includes(m)&&(A="top"),y!==A&&(t.classList.remove(...r),t.classList.add(A))},R=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let o=(i,a)=>{if(a!=null)for(let l of r)l.hasAttribute(i)||l.setAttribute(i,a)};for(let i of ne)o(i,this.getAttribute(i));o("data-promotion-code",I(this))},yt=function(t){let r=this.closest(".section");if(!r)return;let o=this.parentElement;for(;o.matches("strong, em")&&o.childElementCount===1&&o.firstElementChild===this&&o.textContent.trim()===this.textContent.trim();)o.replaceWith(...o.childNodes),o=this.parentElement;let i=this;for(;i.parentElement!==r;)i=i.parentElement;let a=/^button-(s|m|l|xl|xxl)$/,l=[...i.querySelectorAll(".con-button")].find(u=>!this.contains(u)&&[...u.classList].some(m=>a.test(m))),c,p=[];if(l)c=[...l.classList].find(u=>a.test(u)),p=[...l.classList].filter(u=>u.startsWith("button-")&&!a.test(u));else{let u=[...i.classList].find(m=>/^(s|m|l|xl|xxl)-button$/.test(m));u?c=`button-${u.split("-")[0]}`:i.classList.contains("hero-marquee")?(c="button-xl",p=["button-justified-mobile"]):i.matches(".accordion, .media")||(c=i.matches(".large, .xlarge")?"button-xl":"button-l")}for(let u of this.merchLink?.matchAll(/(?:&|#)_button-([a-zA-Z-]+)/g)??[])p.push(u[1]);let E=t.matches(".con-button")?[t]:t.querySelectorAll(".con-button");for(let u of E)c&&![...u.classList].some(m=>a.test(m))&&u.classList.add(c),u.classList.add(...p);this.closest("p")?.classList.add("action-area")},Mt=function(t,r=!1){let i=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!i.length)return null;if(r)return B(i[0]);let a=document.createElement("div");return a.setAttribute("slot","footer"),a.classList.add("action-area"),a.append(...i.map(l=>B(l))),a},S=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let i=r.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(et,K);export{se as checkoutOptionsProvider,ie as priceOptionsProvider,St as renderImageMarkup};
