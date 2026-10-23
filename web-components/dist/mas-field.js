var Ut=Object.defineProperty;var at=e=>{throw TypeError(e)};var kt=(e,o,t)=>o in e?Ut(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t;var B=(e,o,t)=>kt(e,typeof o!="symbol"?o+"":o,t),W=(e,o,t)=>o.has(e)||at("Cannot "+t);var h=(e,o,t)=>(W(e,o,"read from private field"),t?t.call(e):o.get(e)),A=(e,o,t)=>o.has(e)?at("Cannot add the same private member more than once"):o instanceof WeakSet?o.add(e):o.set(e,t),T=(e,o,t,r)=>(W(e,o,"write to private field"),r?r.call(e,t):o.set(e,t),t),p=(e,o,t)=>(W(e,o,"access private method"),t);var Ae=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),Te=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var st=2e4;var Ft='span[is="inline-price"][data-wcs-osi]',$t='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Yt='a[is="upt-link"]',_e=`${Ft},${$t},${Yt}`,ct=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var L="aem:load",w="aem:error",lt="mas:ready";var be=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var xe=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var dt="legal",pt="plan-type-text",ut="mas-ff-defaults";var Vt="mas-commerce-service",z=/^(accent|primary|secondary)(-(outline|link))?$/;function Gt(e,o={},t=null,r=null){let n=r?document.createElement(e,{is:r}):document.createElement(e);t instanceof HTMLElement?n.appendChild(t):n.innerHTML=t;for(let[i,c]of Object.entries(o))n.setAttribute(i,c);return n}function qt(e){let o=[...e.classList].find(r=>z.test(r));if(o)return o;let t=e.closest("strong, em");return t?.tagName==="STRONG"?"primary":t?.tagName==="EM"?"secondary":"secondary-link"}function K(e){let o=qt(e),t=e.cloneNode(!0);if([...e.classList].some(n=>z.test(n))){let n=e.parentElement;for(;n?.matches("strong, em");){let i=t.firstElementChild;(i?.tagName!==n.tagName||t.innerHTML.trim()!==i.outerHTML)&&t.replaceChildren(Gt(n.tagName.toLowerCase(),{},t.innerHTML)),n=n.parentElement}}let r=t;if(e.dataset.wcsOsi){r=customElements.get("checkout-link")?.createCheckoutLink(e.dataset,t.innerHTML),r||(r=document.createElement("a",{is:"checkout-link"}),r.setAttribute("is","checkout-link"),r.innerHTML=`<span style="pointer-events: none;">${t.innerHTML}</span>`);for(let{name:i,value:c}of e.attributes)["is","href"].includes(i)||r.setAttribute(i,c)}for(let n of[...r.classList])z.test(n)&&r.classList.remove(n);return o.endsWith("-link")||(r.classList.add("button","con-button"),r.classList.add(o==="accent"||o==="primary"?"blue":"outline")),r}function mt(){return document.getElementsByTagName(Vt)?.[0]}function ht(e){let o=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&o?.isInlinePrice&&o?.dataset?.template==="price"}var Bt=[".","!","?"],Wt=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=Wt,document.head.append(e)}var zt="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function Kt(e){let o=e.closest(zt)??e.parentNode,t=document.createRange();return t.setStart(o,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function ft(e){let o=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(o.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??o[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function jt(e){return!e||Bt.includes(e)?"upper":"lower"}function Xt(e){return jt(Kt(e))}function j(e,o){if(e.dataset.placeholder!==pt)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(o.wcsOsi=t,o.planTypeCase=Xt(e))}function Qt(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")}function D(e){return Qt(e)?e.contextPromotionCode:null}function Et(e,o){e&&(o.literals??(o.literals={}),Object.assign(o.literals,e))}function gt(e,o){ht(e)&&(o.displayPerUnit=!1,o.displayTax=!1)}function At(e,o){o.displayAnnual===void 0&&typeof e?.settings?.displayAnnual=="boolean"&&(o.displayAnnual=e.settings.displayAnnual,e.settings.displayAnnual&&e.setAttribute("annualized",""))}function Tt(e,o,t){!e?.providers||e.providers.has(o)||(e.providers.price(o),e.providers.checkout(t),e.providers.has(j)||e.providers.price(j))}function Jt(e,o){if(typeof e!="string"||!e)return null;let t;try{t=new URL(e,o)}catch{return null}return t.hostname.endsWith(".aem.page")?`${o}${t.pathname}${t.search}`:null}function Z(e){if(typeof e!="string"||!e)return"";try{return new URL(e).href}catch{return""}}function te(e){if(typeof e!="string"||!e)return!1;try{return new URL(e).hostname.endsWith(".aem.page")}catch{return!1}}var ee={png:{type:"image/png",format:"png"},jpg:{type:"image/jpeg",format:"jpg"},jpeg:{type:"image/jpeg",format:"jpg"},webp:{type:"image/webp",format:"webp"},gif:{type:"image/gif",format:"gif"}},X={width:2e3,media:"(min-width: 600px)"},re=750;function U(e,o,t){let r=new URL(e);return r.searchParams.set("width",o),r.searchParams.set("format",t),r.searchParams.set("optimize","medium"),r.href}function _t(e,o){return o?.width?Math.min(e,o.width):e}function ne(e){let o=new URL(e).pathname.split(".").pop().toLowerCase();return ee[o]??null}function bt(e){return String(e??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function xt(e){return!e?.width||!e?.height?"":` width="${e.width}" height="${e.height}"`}function St(e,o,t=""){if(!te(e))return"";let r=Z(e),n=ne(r);if(!n)return`<img loading="lazy" alt="${bt(t)}"${xt(o)} src="${r}">`;let{type:i,format:c}=n,a=_t(X.width,o),l=_t(re,o);return[`<source type="image/webp" srcset="${U(r,a,"webply")}" media="${X.media}">`,`<source type="image/webp" srcset="${U(r,l,"webply")}">`,`<source type="${i}" srcset="${U(r,a,c)}" media="${X.media}">`,`<img loading="lazy" alt="${bt(t)}" src="${U(r,l,c)}"${xt(o)}>`].join("")}function oe(e){return e?.hostname==="www.adobe.com"||e?.hostname==="adobe.com"}function Lt(e,o=globalThis.location){if(typeof e!="string"||!e||!oe(o))return e;let t=document.createElement("template");return t.innerHTML=`<picture>${e}</picture>`,t.content.querySelectorAll("source[srcset], img[src]").forEach(r=>{let n=r.tagName==="IMG"?"src":"srcset",i=Jt(r.getAttribute(n),o.origin);i&&r.setAttribute(n,i)}),t.content.querySelector("picture").innerHTML}var ie=new Set(["SOURCE","IMG"]),ae=new Set(["src","srcset","media","type","alt","role","loading","data-mobile-set","width","height"]);function Ct(e){if(typeof e!="string"||!e)return"";let o=document.createElement("template"),t=/^\s*<picture[\s>]/i.test(e);o.innerHTML=t?e:`<picture>${e}</picture>`;let r=o.content.querySelector("picture");return r?(r.querySelectorAll("*").forEach(n=>{if(!ie.has(n.tagName)){n.remove();return}[...n.attributes].forEach(i=>{ae.has(i.name.toLowerCase())||n.removeAttribute(i.name)})}),r.innerHTML):""}var se="(min-width: 1200px)",ce="(min-width: 600px)";function Rt(e,o){if(!e)return"";let t=new DOMParser().parseFromString(`<picture>${e}</picture>`,"text/html");if(o==="desktop")return t.querySelector(`source[media="${se}"]`)?.getAttribute("srcset")??"";if(o==="tablet")return t.querySelector(`source[media="${ce}"]`)?.getAttribute("srcset")??"";if(o==="mobile"){let r=t.querySelector("img");return r?.hasAttribute("data-mobile-set")?r.getAttribute("src")??"":""}return""}var it="mas-field",le=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"],de=/(accent|primary|secondary)(-(outline|link))?/gm;function pe(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}async function yt(e,o,t){let r=e.content.querySelector('a[data-analytics-id="buy-now"]'),i=[...e.content.querySelectorAll("a")].filter(a=>ct.has(a.dataset.analyticsId));if(i.length===0)return e.innerHTML;if(o&&!r){let a=t.getAttribute("field"),l=[],u=t.parentElement.querySelectorAll("mas-field").length>1?t.parentElement.querySelectorAll('mas-field[field^="ctas"]'):t.parentElement.parentElement.querySelectorAll('mas-field[field^="ctas"]');u.forEach(async m=>{m.getAttribute("field")!==a&&l.push(m.checkReady())});let E=Promise.all(l),f,d=new Promise(m=>{f=setTimeout(m,st)});await Promise.race([E,d]),clearTimeout(f),u.forEach(m=>{m.getAttribute("field")!==a&&(r??(r=m.querySelector('a[data-analytics-id="buy-now"]')))})}i.forEach(a=>{if(a.hasAttribute("data-replaced-osi")){let l=t.aemFragment?.data?.priceLiterals?.buyNow;r||!l||l==="buy-now"?a.remove():(a.hasAttribute("aria-label")&&a.removeAttribute("aria-label"),a.setAttribute("data-analytics-id","buy-now"),a.hasAttribute("data-modal")&&a.setAttribute("data-modal","crm"),a.textContent=l)}else a.remove()});let c=e.content.querySelector('a[data-analytics-id="buy-now"]')||r;return c&&(c.className.trim()&&c.className.match(de)?.forEach(a=>{c.classList.remove(a)}),c.classList.add("button","con-button","blue")),e.innerHTML}function ue(e,o){if(!e)return o;let t=e.closest(it);if(!(t||e.hasAttribute("fragment-id")))return o;if(o[ut]=!0,o.wrapClauses=!0,Et(t?.aemFragment?.data?.priceLiterals,o),gt(e,o),t&&e.dataset.template===dt&&(o.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!o.promotionCode){let n=e.dataset.promotionCode??(t?D(t):null);n&&(o.promotionCode=n)}At(t,o)}function me(e,o){if(o.promotionCode||!e)return;let t=e.closest(it),r=e.dataset.promotionCode??(t?D(t):null);r&&(o.promotionCode=r)}function he(e){Tt(e,ue,me)}var fe=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=fe,document.head.append(e)}function wt(e,o=globalThis.location){return typeof e!="string"||!e?"":`<picture>${Lt(e,o)}</picture>`}var R,M,P,_,g,O,I,s,k,J,tt,Nt,F,Mt,Pt,et,rt,Ot,nt,ot,It,N,vt,Ht,C,Q=class extends HTMLElement{constructor(){super(...arguments);A(this,s);A(this,R,null);A(this,M,!1);A(this,P,!1);A(this,_,null);B(this,"settings",null);A(this,g,null);B(this,"compatVersion");A(this,O,t=>{t.target===this.aemFragment&&T(this,P,!0)});A(this,I,async t=>{t.target===this.aemFragment&&(T(this,_,t.detail?.fields||null),this.settings=t.detail?.settings??null,T(this,M,!0),await p(this,s,rt).call(this),this.dispatchEvent(new CustomEvent(lt,{bubbles:!0,composed:!0,detail:t.detail})))})}get contextPromotionCode(){return this.getAttribute("data-promotion-code")}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,n){t==="field"&&(T(this,R,n),p(this,s,rt).call(this))}connectedCallback(){this.addEventListener(L,h(this,I)),this.addEventListener(w,h(this,O)),p(this,s,k).call(this),this.aemFragment?.setAttribute("hidden",""),he(mt())}disconnectedCallback(){this.removeEventListener(L,h(this,I)),this.removeEventListener(w,h(this,O))}checkReady(){return h(this,M)?Promise.resolve(!0):h(this,P)?Promise.resolve(!1):new Promise(t=>{let r=n=>{n.target===this.aemFragment&&(this.removeEventListener(L,r),this.removeEventListener(w,r),t(n.type===L))};this.addEventListener(L,r),this.addEventListener(w,r)})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return ft(this)}};R=new WeakMap,M=new WeakMap,P=new WeakMap,_=new WeakMap,g=new WeakMap,O=new WeakMap,I=new WeakMap,s=new WeakSet,k=function(t=!1){if(h(this,g)?.isConnected&&h(this,g).matches('[data-role="mas-field-content"]')&&(!t||h(this,g).tagName==="SPAN"))return h(this,g);let r=this.querySelector(':scope > [data-role="mas-field-content"]');if(r&&(!t||r.tagName==="SPAN"))return T(this,g,r),r;t&&r?.remove();let n=document.createElement("span");return n.setAttribute("data-role","mas-field-content"),this.append(n),T(this,g,n),n},J=function(){this.querySelector(':scope > [data-role="mas-field-content"]')?.remove(),T(this,g,null)},tt=function(t){let r=document.createElement("template");r.innerHTML=t;let n=r.content.querySelector("picture");if(!n)return;n.innerHTML=Ct(n.innerHTML),n.setAttribute("data-role","mas-field-content");let i=this.querySelector(':scope > [data-role="mas-field-content"]');i?i.replaceWith(n):this.append(n),T(this,g,n),p(this,s,N).call(this,n)},Nt=function(t){let r=p(this,s,C).call(this,p(this,s,F).call(this,h(this,_).backgroundImageAltText));return`<img loading="lazy" ${typeof r=="string"&&r?`alt="${pe(r)}"`:'role="none"'} src="${Z(t)}">`},F=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},Mt=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let n=t?.match(/^(.+)\[(.+)\]$/);return n?{fieldName:n[1],index:n[2]}:{fieldName:t,index:null}},Pt=function(t,r,n){if(typeof t!="string")return null;let i=document.createElement("template");i.innerHTML=t;let c;if(!isNaN(r)){let u=parseInt(r,10);c=[...i.content.querySelectorAll("a")][u-1]}if(c||(c=i.content.querySelector(`a[data-key="${r}"]`)),!c)return null;if(n)return c.removeAttribute("class"),c.outerHTML;let a=c.outerHTML,l=c.parentElement;for(;l?.matches("strong, em");){let u=l.tagName.toLowerCase();a=`<${u}>${a}</${u}>`,l=l.parentElement}return a},et=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},rt=async function(){if(!h(this,_)||!h(this,R))return;this.hidden=!1;let{fieldName:t,index:r}=p(this,s,Mt).call(this,h(this,R)),n=t==="ctas"&&r!==null&&!!(this.closest("strong, em, .feds-cta-wrapper")||this.querySelector(":scope > strong, :scope > em"));if(r!==null&&isNaN(r)){let l=`${t.replace(/s$/,"")}Labels`,u=h(this,_)[l];if(u!==void 0){let f=(Array.isArray(u)?u:[u]).indexOf(r);if(f===-1){this.hidden=!0;return}let d=h(this,_)[t],m=Array.isArray(d)?d:d?[d]:[],S=p(this,s,F).call(this,m[f]);if(!S){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs){let $=document.createElement("template");if($.innerHTML=S,S=await yt($,!0,this),!S.trim()){this.hidden=!0;return}}p(this,s,et).call(this);let x=p(this,s,k).call(this,!0);x.innerHTML=p(this,s,C).call(this,S)??"",p(this,s,nt).call(this,x),p(this,s,ot).call(this,x),p(this,s,N).call(this,x);return}}let i=p(this,s,F).call(this,h(this,_)[t]);if(i===void 0){this.hidden=!0;return}if(p(this,s,et).call(this),r===null&&(t==="image"||t==="backgroundImage"||t==="backgrounds")){let l=p(this,s,C).call(this,i);if(typeof l=="string"&&l){let u=t==="image"||t==="backgrounds"?l:p(this,s,Nt).call(this,l);p(this,s,tt).call(this,wt(u))}else p(this,s,J).call(this),this.hidden=!0;return}if(t==="backgrounds"&&r!==null){let l=p(this,s,C).call(this,Rt(i,r)),u=typeof l=="string"&&l?St(l):"";u?p(this,s,tt).call(this,wt(u)):(p(this,s,J).call(this),this.hidden=!0);return}let c=p(this,s,k).call(this,!0),a;if(r!==null){if(a=p(this,s,Pt).call(this,i,r,n),a===null){this.hidden=!0;return}}else a=p(this,s,C).call(this,i);if(typeof a=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs){let l=document.createElement("template");if(l.innerHTML=a,a=await yt(l,r!==null,this),!a.trim()){this.hidden=!0;return}}if(t==="ctas"&&!n){let l=p(this,s,Ht).call(this,a,r!==null);if(l){p(this,s,vt).call(this,l),c.replaceChildren(l),p(this,s,N).call(this,c);return}}c.innerHTML=a,p(this,s,nt).call(this,c),p(this,s,ot).call(this,c),p(this,s,N).call(this,c);return}if(a==null){this.hidden=!0;return}c.textContent=String(a)},Ot=function(t,r){return customElements.get("checkout-link")?.createCheckoutLink(t,r)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${r}</span>`,i})()},nt=function(t){for(let r of t.querySelectorAll("a[data-wcs-osi]:not([is])")){let n=p(this,s,Ot).call(this,r.dataset,r.innerHTML);for(let{name:i,value:c}of r.attributes)["is","href"].includes(i)||n.setAttribute(i,c);r.replaceWith(n)}},ot=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let n of r){if(n.dataset.tooltipWired)continue;n.dataset.tooltipWired="1",n.querySelector("svg")||n.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),n.hasAttribute("tabindex")||n.setAttribute("tabindex","0"),n.hasAttribute("role")||n.setAttribute("role","button"),n.hasAttribute("aria-label")||n.setAttribute("aria-label",n.dataset.tooltip);let i=["top","bottom","left","right"],c=[...n.classList].find(E=>i.includes(E)),a=c||"top";c||n.classList.add(a),n.dataset.originalPosition=a,n.classList.add("hide-tooltip");let l=()=>{n.classList.remove("hide-tooltip"),p(this,s,It).call(this,n)},u=()=>n.classList.add("hide-tooltip");n.addEventListener("mouseenter",l),n.addEventListener("focus",l),n.addEventListener("mouseleave",u),n.addEventListener("blur",u),n.addEventListener("keydown",E=>{E.key==="Escape"&&u()})}},It=function(t){let r=["top","bottom","right","left"],n=window.innerWidth,i=12,c=document.querySelector("header")?.getBoundingClientRect().height||0,a=window.getComputedStyle(t,"::before"),l=q=>parseFloat(q)||0,u=l(a.width)+l(a.paddingLeft)+l(a.paddingRight),E=l(a.height)+l(a.paddingTop)+l(a.paddingBottom),f=t.getBoundingClientRect(),d=t.dataset.originalPosition||"top",m=r.find(q=>t.classList.contains(q)),x=d==="top"||d==="bottom"?u/2:u,Dt=d==="top"?E+(d==="top"?i:0):E/2,v=f.top-Dt<c,Y=f.bottom+(d==="bottom"?E+i:0)>window.innerHeight,y=f.right+x+i>n,H=f.left-x-i<0,V=f.left+u/2+i>n,G=f.left-u/2-i<0;if(d!==m&&!(y||H||v||Y||V||G)){t.classList.remove(...r),t.classList.add(d);return}let b=d;y&&V?b="left":H&&G?b="right":y&&v||H&&v?b=V&&"left"||G&&"right"||"bottom":y!==H&&!Y?b=y?"left":"right":v&&["top","left","right"].includes(d)?b="bottom":Y&&["bottom","left","right"].includes(d)&&(b="top"),m!==b&&(t.classList.remove(...r),t.classList.add(b))},N=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let n=(i,c)=>{if(c!=null)for(let a of r)a.hasAttribute(i)||a.setAttribute(i,c)};for(let i of le)n(i,this.getAttribute(i));n("data-promotion-code",D(this))},vt=function(t){let r=this.closest(".section");if(!r)return;let n=this.parentElement;for(;n.matches("strong, em")&&n.childElementCount===1&&n.firstElementChild===this&&n.textContent.trim()===this.textContent.trim();)n.replaceWith(...n.childNodes),n=this.parentElement;let i=this;for(;i.parentElement!==r;)i=i.parentElement;let c=/^button-(s|m|l|xl|xxl)$/,a=[...i.querySelectorAll(".con-button")].find(d=>!this.contains(d)&&[...d.classList].some(m=>c.test(m))),l,u=[];if(a)l=[...a.classList].find(d=>c.test(d)),u=[...a.classList].filter(d=>d.startsWith("button-")&&!c.test(d));else{let d=[...i.classList].find(m=>/^(s|m|l|xl|xxl)-button$/.test(m));d?l=`button-${d.split("-")[0]}`:i.classList.contains("hero-marquee")?(l="button-xl",u=["button-justified-mobile"]):i.matches(".accordion, .media")||(l=i.matches(".large, .xlarge")?"button-xl":"button-l")}for(let d of this.merchLink?.matchAll(/(?:&|#)_button-([a-zA-Z-]+)/g)??[])u.push(d[1]);let E=t.matches(".con-button")?[t]:t.querySelectorAll(".con-button");for(let d of E)l&&![...d.classList].some(m=>c.test(m))&&d.classList.add(l),d.classList.add(...u);let f=this.closest("p");f&&(E.length||[...f.childNodes].every(d=>d===this||d.nodeType===Node.TEXT_NODE&&!d.textContent.trim()))&&f.classList.add("action-area")},Ht=function(t,r=!1){let i=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!i.length)return null;if(r)return K(i[0]);let c=document.createElement("div");return c.setAttribute("slot","footer"),c.classList.add("action-area"),c.append(...i.map(a=>K(a))),c},C=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let i=r.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(it,Q);export{de as CHECKOUT_STYLE_PATTERN,me as checkoutOptionsProvider,ue as priceOptionsProvider,wt as renderImageMarkup,yt as stripTrialCtas};
