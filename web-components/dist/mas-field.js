var It=Object.defineProperty;var nt=e=>{throw TypeError(e)};var vt=(e,n,t)=>n in e?It(e,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[n]=t;var G=(e,n,t)=>vt(e,typeof n!="symbol"?n+"":n,t),B=(e,n,t)=>n.has(e)||nt("Cannot "+t);var u=(e,n,t)=>(B(e,n,"read from private field"),t?t.call(e):n.get(e)),g=(e,n,t)=>n.has(e)?nt("Cannot add the same private member more than once"):n instanceof WeakSet?n.add(e):n.set(e,t),A=(e,n,t,r)=>(B(e,n,"write to private field"),r?r.call(e,t):n.set(e,t),t),l=(e,n,t)=>(B(e,n,"access private method"),t);var me=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),he=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var Dt='span[is="inline-price"][data-wcs-osi]',Ht='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Ut='a[is="upt-link"]',fe=`${Dt},${Ht},${Ut}`,ot=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var S="aem:load",w="aem:error",it="mas:ready";var Ee=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var ge=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var at="legal",st="plan-type-text",ct="mas-ff-defaults";var kt="mas-commerce-service";function lt(){return document.getElementsByTagName(kt)?.[0]}function dt(e){let n=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&n?.isInlinePrice&&n?.dataset?.template==="price"}var Ft=[".","!","?"],Yt=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=Yt,document.head.append(e)}var $t="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function Vt(e){let n=e.closest($t)??e.parentNode,t=document.createRange();return t.setStart(n,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function pt(e){let n=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(n.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??n[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function Gt(e){return!e||Ft.includes(e)?"upper":"lower"}function Bt(e){return Gt(Vt(e))}function W(e,n){if(e.dataset.placeholder!==st)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(n.wcsOsi=t,n.planTypeCase=Bt(e))}function qt(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")}function D(e){return qt(e)?e.contextPromotionCode:null}function ut(e,n){e&&(n.literals??(n.literals={}),Object.assign(n.literals,e))}function mt(e,n){dt(e)&&(n.displayPerUnit=!1,n.displayTax=!1)}function ht(e,n){n.displayAnnual===void 0&&typeof e?.settings?.displayAnnual=="boolean"&&(n.displayAnnual=e.settings.displayAnnual,e.settings.displayAnnual&&e.setAttribute("annualized",""))}function ft(e,n,t){!e?.providers||e.providers.has(n)||(e.providers.price(n),e.providers.checkout(t),e.providers.has(W)||e.providers.price(W))}function zt(e,n){if(typeof e!="string"||!e)return null;let t;try{t=new URL(e,n)}catch{return null}return t.hostname.endsWith(".aem.page")?`${n}${t.pathname}${t.search}`:null}function z(e){if(typeof e!="string"||!e)return"";try{return new URL(e).href}catch{return""}}function Kt(e){if(typeof e!="string"||!e)return!1;try{return new URL(e).hostname.endsWith(".aem.page")}catch{return!1}}var jt={png:{type:"image/png",format:"png"},jpg:{type:"image/jpeg",format:"jpg"},jpeg:{type:"image/jpeg",format:"jpg"},webp:{type:"image/webp",format:"webp"},gif:{type:"image/gif",format:"gif"}},q={width:2e3,media:"(min-width: 600px)"},Xt=750;function H(e,n,t){let r=new URL(e);return r.searchParams.set("width",n),r.searchParams.set("format",t),r.searchParams.set("optimize","medium"),r.href}function Et(e,n){return n?.width?Math.min(e,n.width):e}function Zt(e){let n=new URL(e).pathname.split(".").pop().toLowerCase();return jt[n]??null}function gt(e){return String(e??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function At(e){return!e?.width||!e?.height?"":` width="${e.width}" height="${e.height}"`}function Tt(e,n,t=""){if(!Kt(e))return"";let r=z(e),o=Zt(r);if(!o)return`<img loading="lazy" alt="${gt(t)}"${At(n)} src="${r}">`;let{type:i,format:c}=o,s=Et(q.width,n),d=Et(Xt,n);return[`<source type="image/webp" srcset="${H(r,s,"webply")}" media="${q.media}">`,`<source type="image/webp" srcset="${H(r,d,"webply")}">`,`<source type="${i}" srcset="${H(r,s,c)}" media="${q.media}">`,`<img loading="lazy" alt="${gt(t)}" src="${H(r,d,c)}"${At(n)}>`].join("")}function Qt(e){return e?.hostname==="www.adobe.com"||e?.hostname==="adobe.com"}function _t(e,n=globalThis.location){if(typeof e!="string"||!e||!Qt(n))return e;let t=document.createElement("template");return t.innerHTML=`<picture>${e}</picture>`,t.content.querySelectorAll("source[srcset], img[src]").forEach(r=>{let o=r.tagName==="IMG"?"src":"srcset",i=zt(r.getAttribute(o),n.origin);i&&r.setAttribute(o,i)}),t.content.querySelector("picture").innerHTML}var Jt=new Set(["SOURCE","IMG"]),te=new Set(["src","srcset","media","type","alt","role","loading","data-mobile-set","width","height"]);function bt(e){if(typeof e!="string"||!e)return"";let n=document.createElement("template"),t=/^\s*<picture[\s>]/i.test(e);n.innerHTML=t?e:`<picture>${e}</picture>`;let r=n.content.querySelector("picture");return r?(r.querySelectorAll("*").forEach(o=>{if(!Jt.has(o.tagName)){o.remove();return}[...o.attributes].forEach(i=>{te.has(i.name.toLowerCase())||o.removeAttribute(i.name)})}),r.innerHTML):""}var ee="(min-width: 1200px)",re="(min-width: 600px)";function xt(e,n){if(!e)return"";let t=new DOMParser().parseFromString(`<picture>${e}</picture>`,"text/html");if(n==="desktop")return t.querySelector(`source[media="${ee}"]`)?.getAttribute("srcset")??"";if(n==="tablet")return t.querySelector(`source[media="${re}"]`)?.getAttribute("srcset")??"";if(n==="mobile"){let r=t.querySelector("img");return r?.hasAttribute("data-mobile-set")?r.getAttribute("src")??"":""}return""}var et="mas-field",ne=/(accent|primary|secondary)(-(outline|link))?/,oe=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function ie(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}async function St(e,n,t){let r=document.createElement("template");r.innerHTML=e;let o=r.content.querySelector('a[data-analytics-id="buy-now"]'),c=[...r.content.querySelectorAll("a")].filter(p=>ot.has(p.dataset.analyticsId));if(c.length===0)return e;if(n&&!o){let p=t.getAttribute("field"),f=[],h=t.parentElement.querySelectorAll("mas-field").length>1?t.parentElement.querySelectorAll("mas-field"):t.parentElement.parentElement.querySelectorAll("mas-field");h.forEach(async m=>{m.getAttribute("field")!==p&&f.push(m.checkReady())}),await Promise.all(f),h.forEach(m=>{m.getAttribute("field")!==p&&(o=m.querySelector('a[data-analytics-id="buy-now"]'))})}let s=!1;c.forEach(p=>{p.hasAttribute("data-replaced-osi")?(s=!0,o?p.remove():(p.setAttribute("data-analytics-id","buy-now"),p.hasAttribute("data-modal")&&p.setAttribute("data-modal","crm"),p.textContent=t.aemFragment?.data?.priceLiterals?.buyNow)):p.remove()});let d=r.content.querySelector('a[data-analytics-id="buy-now"]')||o;return d&&s&&(d.classList.remove("primary-outline"),d.classList.add("accent","button","con-button","blue")),r.innerHTML}function ae(e,n){if(!e)return n;let t=e.closest(et);if(!(t||e.hasAttribute("fragment-id")))return n;if(n[ct]=!0,n.wrapClauses=!0,ut(t?.aemFragment?.data?.priceLiterals,n),mt(e,n),t&&e.dataset.template===at&&(n.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!n.promotionCode){let o=e.dataset.promotionCode??(t?D(t):null);o&&(n.promotionCode=o)}ht(t,n)}function se(e,n){if(n.promotionCode||!e)return;let t=e.closest(et),r=e.dataset.promotionCode??(t?D(t):null);r&&(n.promotionCode=r)}function ce(e){ft(e,ae,se)}var le=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=le,document.head.append(e)}function Ct(e,n=globalThis.location){return typeof e!="string"||!e?"":`<picture>${_t(e,n)}</picture>`}var x,N,P,T,E,M,O,a,U,j,X,Lt,k,Rt,wt,Z,Q,yt,J,tt,Nt,y,Pt,Mt,C,K=class extends HTMLElement{constructor(){super(...arguments);g(this,a);g(this,x,null);g(this,N,!1);g(this,P,!1);g(this,T,null);G(this,"settings",null);g(this,E,null);G(this,"compatVersion");g(this,M,t=>{t.target===this.aemFragment&&A(this,P,!0)});g(this,O,t=>{t.target===this.aemFragment&&(A(this,T,t.detail?.fields||null),this.settings=t.detail?.settings??null,A(this,N,!0),l(this,a,Q).call(this),this.dispatchEvent(new CustomEvent(it,{bubbles:!0,composed:!0,detail:t.detail})))})}get contextPromotionCode(){return this.getAttribute("data-promotion-code")}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,o){t==="field"&&(A(this,x,o),l(this,a,Q).call(this))}connectedCallback(){this.addEventListener(S,u(this,O)),this.addEventListener(w,u(this,M)),l(this,a,U).call(this),this.aemFragment?.setAttribute("hidden",""),ce(lt())}disconnectedCallback(){this.removeEventListener(S,u(this,O)),this.removeEventListener(w,u(this,M))}checkReady(){return u(this,N)?Promise.resolve(!0):u(this,P)?Promise.resolve(!1):new Promise(t=>{let r=o=>{o.target===this.aemFragment&&(this.removeEventListener(S,r),this.removeEventListener(w,r),t(o.type===S))};this.addEventListener(S,r),this.addEventListener(w,r)})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return pt(this)}};x=new WeakMap,N=new WeakMap,P=new WeakMap,T=new WeakMap,E=new WeakMap,M=new WeakMap,O=new WeakMap,a=new WeakSet,U=function(t=!1){if(u(this,E)?.isConnected&&u(this,E).matches('[data-role="mas-field-content"]')&&(!t||u(this,E).tagName==="SPAN"))return u(this,E);let r=this.querySelector(':scope > [data-role="mas-field-content"]');if(r&&(!t||r.tagName==="SPAN"))return A(this,E,r),r;t&&r?.remove();let o=document.createElement("span");return o.setAttribute("data-role","mas-field-content"),this.append(o),A(this,E,o),o},j=function(){this.querySelector(':scope > [data-role="mas-field-content"]')?.remove(),A(this,E,null)},X=function(t){let r=document.createElement("template");r.innerHTML=t;let o=r.content.querySelector("picture");if(!o)return;o.innerHTML=bt(o.innerHTML),o.setAttribute("data-role","mas-field-content");let i=this.querySelector(':scope > [data-role="mas-field-content"]');i?i.replaceWith(o):this.append(o),A(this,E,o),l(this,a,y).call(this,o)},Lt=function(t){let r=l(this,a,C).call(this,l(this,a,k).call(this,u(this,T).backgroundImageAltText));return`<img loading="lazy" ${typeof r=="string"&&r?`alt="${ie(r)}"`:'role="none"'} src="${z(t)}">`},k=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},Rt=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let o=t?.match(/^(.+)\[(.+)\]$/);return o?{fieldName:o[1],index:o[2]}:{fieldName:t,index:null}},wt=function(t,r){if(typeof t!="string")return null;let o=document.createElement("template");o.innerHTML=t;let i;if(!isNaN(r)){let c=parseInt(r,10);i=[...o.content.querySelectorAll("a")][c-1]}return i||(i=o.content.querySelector(`a[data-key="${r}"]`)),i?(i.removeAttribute("class"),i.outerHTML):null},Z=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},Q=async function(){if(!u(this,T)||!u(this,x))return;this.hidden=!1;let{fieldName:t,index:r}=l(this,a,Rt).call(this,u(this,x));if(r!==null&&isNaN(r)){let s=`${t.replace(/s$/,"")}Labels`,d=u(this,T)[s];if(d!==void 0){let f=(Array.isArray(d)?d:[d]).indexOf(r);if(f===-1){this.hidden=!0;return}let h=u(this,T)[t],m=Array.isArray(h)?h:h?[h]:[],_=l(this,a,k).call(this,m[f]);if(!_){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs&&(_=await St(_,!0,this),_===null)){this.hidden=!0;return}l(this,a,Z).call(this);let L=l(this,a,U).call(this,!0);L.innerHTML=l(this,a,C).call(this,_)??"",l(this,a,J).call(this,L),l(this,a,tt).call(this,L),l(this,a,y).call(this,L);return}}let o=l(this,a,k).call(this,u(this,T)[t]);if(o===void 0){this.hidden=!0;return}if(l(this,a,Z).call(this),r===null&&(t==="image"||t==="backgroundImage"||t==="backgrounds")){let s=l(this,a,C).call(this,o);if(typeof s=="string"&&s){let d=t==="image"||t==="backgrounds"?s:l(this,a,Lt).call(this,s);l(this,a,X).call(this,Ct(d))}else l(this,a,j).call(this),this.hidden=!0;return}if(t==="backgrounds"&&r!==null){let s=l(this,a,C).call(this,xt(o,r)),d=typeof s=="string"&&s?Tt(s):"";d?l(this,a,X).call(this,Ct(d)):(l(this,a,j).call(this),this.hidden=!0);return}let i=l(this,a,U).call(this,!0),c;if(r!==null){if(c=l(this,a,wt).call(this,o,r),c===null){this.hidden=!0;return}}else c=l(this,a,C).call(this,o);if(typeof c=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(c=await St(c,r!==null,this),!c)){this.hidden=!0;return}if(u(this,x)==="ctas"){let s=l(this,a,Mt).call(this,c);if(s){i.replaceChildren(s),l(this,a,y).call(this,i);return}}i.innerHTML=c,l(this,a,J).call(this,i),l(this,a,tt).call(this,i),l(this,a,y).call(this,i);return}if(c==null){this.hidden=!0;return}i.textContent=String(c)},yt=function(t,r){return customElements.get("checkout-link")?.createCheckoutLink(t,r)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${r}</span>`,i})()},J=function(t){for(let r of t.querySelectorAll("a[data-wcs-osi]:not([is])")){let o=l(this,a,yt).call(this,r.dataset,r.innerHTML);for(let{name:i,value:c}of r.attributes)["is","href"].includes(i)||o.setAttribute(i,c);r.replaceWith(o)}},tt=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let o of r){if(o.dataset.tooltipWired)continue;o.dataset.tooltipWired="1",o.querySelector("svg")||o.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),o.hasAttribute("tabindex")||o.setAttribute("tabindex","0"),o.hasAttribute("role")||o.setAttribute("role","button"),o.hasAttribute("aria-label")||o.setAttribute("aria-label",o.dataset.tooltip);let i=["top","bottom","left","right"],c=[...o.classList].find(f=>i.includes(f)),s=c||"top";c||o.classList.add(s),o.dataset.originalPosition=s,o.classList.add("hide-tooltip");let d=()=>{o.classList.remove("hide-tooltip"),l(this,a,Nt).call(this,o)},p=()=>o.classList.add("hide-tooltip");o.addEventListener("mouseenter",d),o.addEventListener("focus",d),o.addEventListener("mouseleave",p),o.addEventListener("blur",p),o.addEventListener("keydown",f=>{f.key==="Escape"&&p()})}},Nt=function(t){let r=["top","bottom","right","left"],o=window.innerWidth,i=12,c=document.querySelector("header")?.getBoundingClientRect().height||0,s=window.getComputedStyle(t,"::before"),d=V=>parseFloat(V)||0,p=d(s.width)+d(s.paddingLeft)+d(s.paddingRight),f=d(s.height)+d(s.paddingTop)+d(s.paddingBottom),h=t.getBoundingClientRect(),m=t.dataset.originalPosition||"top",_=r.find(V=>t.classList.contains(V)),rt=m==="top"||m==="bottom"?p/2:p,Ot=m==="top"?f+(m==="top"?i:0):f/2,I=h.top-Ot<c,F=h.bottom+(m==="bottom"?f+i:0)>window.innerHeight,R=h.right+rt+i>o,v=h.left-rt-i<0,Y=h.left+p/2+i>o,$=h.left-p/2-i<0;if(m!==_&&!(R||v||I||F||Y||$)){t.classList.remove(...r),t.classList.add(m);return}let b=m;R&&Y?b="left":v&&$?b="right":R&&I||v&&I?b=Y&&"left"||$&&"right"||"bottom":R!==v&&!F?b=R?"left":"right":I&&["top","left","right"].includes(m)?b="bottom":F&&["bottom","left","right"].includes(m)&&(b="top"),_!==b&&(t.classList.remove(...r),t.classList.add(b))},y=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let o=(i,c)=>{if(c!=null)for(let s of r)s.hasAttribute(i)||s.setAttribute(i,c)};for(let i of oe)o(i,this.getAttribute(i));o("data-promotion-code",D(this))},Pt=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let i=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let s=document.createElement("a",{is:"checkout-link"});return s.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,s})();for(let{name:s,value:d}of t.attributes)["class","is","href"].includes(s)||i.setAttribute(s,d);if(i.firstElementChild?.classList.add("spectrum-Button-label"),t.className){let s=ne.exec(t.className)?.[0]??"accent",d=s.startsWith("accent");return s.includes("-link")||(i.classList.add("button","con-button"),d?i.classList.add("blue"):s.startsWith("primary")&&!s.includes("-outline")&&i.classList.add("fill")),i}let c=t.parentElement?.tagName;if(c==="STRONG"||c==="EM"){let s=document.createElement(c.toLowerCase());return s.append(i),s}return i},Mt=function(t){let o=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!o.length)return null;let i=document.createElement("div");return i.setAttribute("slot","footer"),i.append(...o.map(c=>l(this,a,Pt).call(this,c))),i},C=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let i=r.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(et,K);export{se as checkoutOptionsProvider,ae as priceOptionsProvider,Ct as renderImageMarkup};
