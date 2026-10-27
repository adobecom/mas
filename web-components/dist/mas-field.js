var Ut=Object.defineProperty;var at=e=>{throw TypeError(e)};var kt=(e,o,t)=>o in e?Ut(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t;var Y=(e,o,t)=>kt(e,typeof o!="symbol"?o+"":o,t),W=(e,o,t)=>o.has(e)||at("Cannot "+t);var m=(e,o,t)=>(W(e,o,"read from private field"),t?t.call(e):o.get(e)),T=(e,o,t)=>o.has(e)?at("Cannot add the same private member more than once"):o instanceof WeakSet?o.add(e):o.set(e,t),b=(e,o,t,r)=>(W(e,o,"write to private field"),r?r.call(e,t):o.set(e,t),t),u=(e,o,t)=>(W(e,o,"access private method"),t);var st=2e4;var $t='span[is="inline-price"][data-wcs-osi]',Ft='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Vt='a[is="upt-link"]',Ae=`${$t},${Ft},${Vt}`,ct=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var S="aem:load",R="aem:error",lt="mas:ready";var Te=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var be=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var dt="legal",pt="plan-type-text",ut="mas-ff-defaults";var Gt="mas-commerce-service",z=/^(accent|primary|secondary)(-(outline|link))?$/;function qt(e,o={},t=null,r=null){let n=r?document.createElement(e,{is:r}):document.createElement(e);t instanceof HTMLElement?n.appendChild(t):n.innerHTML=t;for(let[i,c]of Object.entries(o))n.setAttribute(i,c);return n}function Bt(e){let o=[...e.classList].find(r=>z.test(r));if(o)return o;let t=e.closest("strong, em");return t?.tagName==="STRONG"?"primary":t?.tagName==="EM"?"secondary":"secondary-link"}function K(e){let o=Bt(e),t=e.cloneNode(!0);if([...e.classList].some(n=>z.test(n))){let n=e.parentElement;for(;n?.matches("strong, em");){let i=t.firstElementChild;(i?.tagName!==n.tagName||t.innerHTML.trim()!==i.outerHTML)&&t.replaceChildren(qt(n.tagName.toLowerCase(),{},t.innerHTML)),n=n.parentElement}}let r=t;if(e.dataset.wcsOsi){r=customElements.get("checkout-link")?.createCheckoutLink(e.dataset,t.innerHTML),r||(r=document.createElement("a",{is:"checkout-link"}),r.setAttribute("is","checkout-link"),r.innerHTML=`<span style="pointer-events: none;">${t.innerHTML}</span>`);for(let{name:i,value:c}of e.attributes)["is","href"].includes(i)||r.setAttribute(i,c)}for(let n of[...r.classList])z.test(n)&&r.classList.remove(n);return o.endsWith("-link")||(r.classList.add("button","con-button"),r.classList.add(o==="accent"||o==="primary"?"blue":"outline")),r}function mt(){return document.getElementsByTagName(Gt)?.[0]}function ht(e){let o=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&o?.isInlinePrice&&o?.dataset?.template==="price"}var Yt=[".","!","?"],Wt=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=Wt,document.head.append(e)}var zt="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function Kt(e){let o=e.closest(zt)??e.parentNode,t=document.createRange();return t.setStart(o,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function ft(e){let o=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(o.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??o[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function jt(e){return!e||Yt.includes(e)?"upper":"lower"}function Xt(e){return jt(Kt(e))}function j(e,o){if(e.dataset.placeholder!==pt)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(o.wcsOsi=t,o.planTypeCase=Xt(e))}function Qt(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")}function H(e){return Qt(e)?e.contextPromotionCode:null}function Et(e,o){e&&(o.literals??(o.literals={}),Object.assign(o.literals,e))}function gt(e,o){ht(e)&&(o.displayPerUnit=!1,o.displayTax=!1)}function At(e,o){o.displayAnnual===void 0&&typeof e?.settings?.displayAnnual=="boolean"&&(o.displayAnnual=e.settings.displayAnnual,e.settings.displayAnnual&&e.setAttribute("annualized",""))}function Tt(e,o,t){!e?.providers||e.providers.has(o)||(e.providers.price(o),e.providers.checkout(t),e.providers.has(j)||e.providers.price(j))}function Jt(e,o){if(typeof e!="string"||!e)return null;let t;try{t=new URL(e,o)}catch{return null}return t.hostname.endsWith(".aem.page")?`${o}${t.pathname}${t.search}`:null}function Z(e){if(typeof e!="string"||!e)return"";try{return new URL(e).href}catch{return""}}function te(e){if(typeof e!="string"||!e)return!1;try{return new URL(e).hostname.endsWith(".aem.page")}catch{return!1}}var ee={png:{type:"image/png",format:"png"},jpg:{type:"image/jpeg",format:"jpg"},jpeg:{type:"image/jpeg",format:"jpg"},webp:{type:"image/webp",format:"webp"},gif:{type:"image/gif",format:"gif"}},X={width:2e3,media:"(min-width: 600px)"},re=750;function U(e,o,t){let r=new URL(e);return r.searchParams.set("width",o),r.searchParams.set("format",t),r.searchParams.set("optimize","medium"),r.href}function bt(e,o){return o?.width?Math.min(e,o.width):e}function ne(e){let o=new URL(e).pathname.split(".").pop().toLowerCase();return ee[o]??null}function _t(e){return String(e??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function xt(e){return!e?.width||!e?.height?"":` width="${e.width}" height="${e.height}"`}function Lt(e,o,t=""){if(!te(e))return"";let r=Z(e),n=ne(r);if(!n)return`<img loading="lazy" alt="${_t(t)}"${xt(o)} src="${r}">`;let{type:i,format:c}=n,l=bt(X.width,o),a=bt(re,o);return[`<source type="image/webp" srcset="${U(r,l,"webply")}" media="${X.media}">`,`<source type="image/webp" srcset="${U(r,a,"webply")}">`,`<source type="${i}" srcset="${U(r,l,c)}" media="${X.media}">`,`<img loading="lazy" alt="${_t(t)}" src="${U(r,a,c)}"${xt(o)}>`].join("")}function oe(e){return e?.hostname==="www.adobe.com"||e?.hostname==="adobe.com"}function St(e,o=globalThis.location){if(typeof e!="string"||!e||!oe(o))return e;let t=document.createElement("template");return t.innerHTML=`<picture>${e}</picture>`,t.content.querySelectorAll("source[srcset], img[src]").forEach(r=>{let n=r.tagName==="IMG"?"src":"srcset",i=Jt(r.getAttribute(n),o.origin);i&&r.setAttribute(n,i)}),t.content.querySelector("picture").innerHTML}var ie=new Set(["SOURCE","IMG"]),ae=new Set(["src","srcset","media","type","alt","role","loading","data-mobile-set","width","height"]);function Ct(e){if(typeof e!="string"||!e)return"";let o=document.createElement("template"),t=/^\s*<picture[\s>]/i.test(e);o.innerHTML=t?e:`<picture>${e}</picture>`;let r=o.content.querySelector("picture");return r?(r.querySelectorAll("*").forEach(n=>{if(!ie.has(n.tagName)){n.remove();return}[...n.attributes].forEach(i=>{ae.has(i.name.toLowerCase())||n.removeAttribute(i.name)})}),r.innerHTML):""}var se="(min-width: 1200px)",ce="(min-width: 600px)";function yt(e,o){if(!e)return"";let t=new DOMParser().parseFromString(`<picture>${e}</picture>`,"text/html");if(o==="desktop")return t.querySelector(`source[media="${se}"]`)?.getAttribute("srcset")??"";if(o==="tablet")return t.querySelector(`source[media="${ce}"]`)?.getAttribute("srcset")??"";if(o==="mobile"){let r=t.querySelector("img");return r?.hasAttribute("data-mobile-set")?r.getAttribute("src")??"":""}return""}var it="mas-field",le=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"],de=/\b(accent|primary|secondary)\b(-\b(outline|link)\b)?/g;function pe(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}async function wt(e,o,t){let r=e.content.querySelector('a[data-analytics-id="buy-now"]'),i=[...e.content.querySelectorAll("a")].filter(a=>ct.has(a.dataset.analyticsId));if(i.length===0)return e.innerHTML;if(o&&!r){let a=t.getAttribute("field"),p=[],f=t.parentElement.querySelectorAll("mas-field").length>1?t.parentElement.querySelectorAll('mas-field[field^="ctas"]'):t.parentElement.parentElement.querySelectorAll('mas-field[field^="ctas"]');f.forEach(E=>{E.getAttribute("field")!==a&&p.push(E.checkReady)});let h=Promise.all(p),d,g=new Promise(E=>{d=setTimeout(E,st)});await Promise.race([h,g]),clearTimeout(d),f.forEach(E=>{E.getAttribute("field")!==a&&(r??(r=E.querySelector('a[data-analytics-id="buy-now"]')))})}let c=!1;i.forEach(a=>{if(a.hasAttribute("data-replaced-osi")){let p=t.aemFragment?.data?.priceLiterals?.buyNow;r||!p||p==="buy-now"?a.remove():(a.hasAttribute("aria-label")&&a.removeAttribute("aria-label"),a.setAttribute("data-analytics-id","buy-now"),a.hasAttribute("data-modal")&&a.setAttribute("data-modal","crm"),a.textContent=p),c=!0}else a.remove()});let l=e.content.querySelector('a[data-analytics-id="buy-now"]')||r;return l&&c&&(l.className.trim()&&l.className.match(de)?.forEach(a=>{l.classList.remove(a)}),l.classList.add("button","con-button","blue")),e.innerHTML}function ue(e,o){if(!e)return o;let t=e.closest(it);if(!(t||e.hasAttribute("fragment-id")))return o;if(o[ut]=!0,o.wrapClauses=!0,Et(t?.aemFragment?.data?.priceLiterals,o),gt(e,o),t&&e.dataset.template===dt&&(o.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!o.promotionCode){let n=e.dataset.promotionCode??(t?H(t):null);n&&(o.promotionCode=n)}At(t,o)}function me(e,o){if(o.promotionCode||!e)return;let t=e.closest(it),r=e.dataset.promotionCode??(t?H(t):null);r&&(o.promotionCode=r)}function he(e){Tt(e,ue,me)}var fe=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=fe,document.head.append(e)}function Rt(e,o=globalThis.location){return typeof e!="string"||!e?"":`<picture>${St(e,o)}</picture>`}var y,M,O,_,A,P,I,s,k,J,tt,Nt,$,Mt,Ot,et,rt,Pt,nt,ot,It,N,vt,Dt,C,Q=class extends HTMLElement{constructor(){super(...arguments);T(this,s);T(this,y,null);T(this,M,!1);T(this,O,!1);T(this,_,null);Y(this,"settings",null);T(this,A,null);Y(this,"compatVersion");T(this,P,t=>{t.target===this.aemFragment&&b(this,O,!0)});T(this,I,async t=>{t.target===this.aemFragment&&(b(this,_,t.detail?.fields||null),this.settings=t.detail?.settings??null,b(this,M,!0),await u(this,s,rt).call(this),this.dispatchEvent(new CustomEvent(lt,{bubbles:!0,composed:!0,detail:t.detail})))})}get contextPromotionCode(){return this.getAttribute("data-promotion-code")}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,n){t==="field"&&(b(this,y,n),u(this,s,rt).call(this))}connectedCallback(){this.addEventListener(S,m(this,I)),this.addEventListener(R,m(this,P)),u(this,s,k).call(this),this.aemFragment?.setAttribute("hidden",""),he(mt())}disconnectedCallback(){this.removeEventListener(S,m(this,I)),this.removeEventListener(R,m(this,P))}checkReady(){return m(this,M)?Promise.resolve(!0):m(this,O)?Promise.resolve(!1):new Promise(t=>{let r=n=>{n.target===this.aemFragment&&(this.removeEventListener(S,r),this.removeEventListener(R,r),t(n.type===S))};this.addEventListener(S,r),this.addEventListener(R,r)})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return ft(this)}};y=new WeakMap,M=new WeakMap,O=new WeakMap,_=new WeakMap,A=new WeakMap,P=new WeakMap,I=new WeakMap,s=new WeakSet,k=function(t=!1){if(m(this,A)?.isConnected&&m(this,A).matches('[data-role="mas-field-content"]')&&(!t||m(this,A).tagName==="SPAN"))return m(this,A);let r=this.querySelector(':scope > [data-role="mas-field-content"]');if(r&&(!t||r.tagName==="SPAN"))return b(this,A,r),r;t&&r?.remove();let n=document.createElement("span");return n.setAttribute("data-role","mas-field-content"),this.append(n),b(this,A,n),n},J=function(){this.querySelector(':scope > [data-role="mas-field-content"]')?.remove(),b(this,A,null)},tt=function(t){let r=document.createElement("template");r.innerHTML=t;let n=r.content.querySelector("picture");if(!n)return;n.innerHTML=Ct(n.innerHTML),n.setAttribute("data-role","mas-field-content");let i=this.querySelector(':scope > [data-role="mas-field-content"]');i?i.replaceWith(n):this.append(n),b(this,A,n),u(this,s,N).call(this,n)},Nt=function(t){let r=u(this,s,C).call(this,u(this,s,$).call(this,m(this,_).backgroundImageAltText));return`<img loading="lazy" ${typeof r=="string"&&r?`alt="${pe(r)}"`:'role="none"'} src="${Z(t)}">`},$=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},Mt=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let n=t?.match(/^(.+)\[(.+)\]$/);return n?{fieldName:n[1],index:n[2]}:{fieldName:t,index:null}},Ot=function(t,r,n){if(typeof t!="string")return null;let i=document.createElement("template");i.innerHTML=t;let c;if(!isNaN(r)){let p=parseInt(r,10);c=[...i.content.querySelectorAll("a")][p-1]}if(c||(c=i.content.querySelector(`a[data-key="${r}"]`)),!c)return null;if(n)return c.removeAttribute("class"),c.outerHTML;let l=c.outerHTML,a=c.parentElement;for(;a?.matches("strong, em");){let p=a.tagName.toLowerCase();l=`<${p}>${l}</${p}>`,a=a.parentElement}return l},et=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},rt=async function(){if(!m(this,_)||!m(this,y))return;this.hidden=!1;let{fieldName:t,index:r}=u(this,s,Mt).call(this,m(this,y)),n=t==="ctas"&&r!==null&&!!(this.closest("strong, em, .feds-cta-wrapper")||this.querySelector(":scope > strong, :scope > em"));if(r!==null&&isNaN(r)){let a=`${t.replace(/s$/,"")}Labels`,p=m(this,_)[a];if(p!==void 0){let h=(Array.isArray(p)?p:[p]).indexOf(r);if(h===-1){this.hidden=!0;return}let d=m(this,_)[t],g=Array.isArray(d)?d:d?[d]:[],E=u(this,s,$).call(this,g[h]);if(!E){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs){let F=document.createElement("template");if(F.innerHTML=E,E=await wt(F,!0,this),!E.trim()){this.hidden=!0;return}}u(this,s,et).call(this);let L=u(this,s,k).call(this,!0);L.innerHTML=u(this,s,C).call(this,E)??"",u(this,s,nt).call(this,L),u(this,s,ot).call(this,L),u(this,s,N).call(this,L);return}}let i=u(this,s,$).call(this,m(this,_)[t]);if(i===void 0){this.hidden=!0;return}if(u(this,s,et).call(this),r===null&&(t==="image"||t==="backgroundImage"||t==="backgrounds")){let a=u(this,s,C).call(this,i);if(typeof a=="string"&&a){let p=t==="image"||t==="backgrounds"?a:u(this,s,Nt).call(this,a);u(this,s,tt).call(this,Rt(p))}else u(this,s,J).call(this),this.hidden=!0;return}if(t==="backgrounds"&&r!==null){let a=u(this,s,C).call(this,yt(i,r)),p=typeof a=="string"&&a?Lt(a):"";p?u(this,s,tt).call(this,Rt(p)):(u(this,s,J).call(this),this.hidden=!0);return}let c=u(this,s,k).call(this,!0),l;if(r!==null){if(l=u(this,s,Ot).call(this,i,r,n),l===null){this.hidden=!0;return}}else l=u(this,s,C).call(this,i);if(typeof l=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs){let a=document.createElement("template");if(a.innerHTML=l,l=await wt(a,r!==null,this),!l.trim()){this.hidden=!0;return}}if(t==="ctas"&&!n){let a=u(this,s,Dt).call(this,l,r!==null);if(a){u(this,s,vt).call(this,a),c.replaceChildren(a),u(this,s,N).call(this,c);return}}c.innerHTML=l,u(this,s,nt).call(this,c),u(this,s,ot).call(this,c),u(this,s,N).call(this,c);return}if(l==null){this.hidden=!0;return}c.textContent=String(l)},Pt=function(t,r){return customElements.get("checkout-link")?.createCheckoutLink(t,r)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${r}</span>`,i})()},nt=function(t){for(let r of t.querySelectorAll("a[data-wcs-osi]:not([is])")){let n=u(this,s,Pt).call(this,r.dataset,r.innerHTML);for(let{name:i,value:c}of r.attributes)["is","href"].includes(i)||n.setAttribute(i,c);r.replaceWith(n)}},ot=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let n of r){if(n.dataset.tooltipWired)continue;n.dataset.tooltipWired="1",n.querySelector("svg")||n.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),n.hasAttribute("tabindex")||n.setAttribute("tabindex","0"),n.hasAttribute("role")||n.setAttribute("role","button"),n.hasAttribute("aria-label")||n.setAttribute("aria-label",n.dataset.tooltip);let i=["top","bottom","left","right"],c=[...n.classList].find(f=>i.includes(f)),l=c||"top";c||n.classList.add(l),n.dataset.originalPosition=l,n.classList.add("hide-tooltip");let a=()=>{n.classList.remove("hide-tooltip"),u(this,s,It).call(this,n)},p=()=>n.classList.add("hide-tooltip");n.addEventListener("mouseenter",a),n.addEventListener("focus",a),n.addEventListener("mouseleave",p),n.addEventListener("blur",p),n.addEventListener("keydown",f=>{f.key==="Escape"&&p()})}},It=function(t){let r=["top","bottom","right","left"],n=window.innerWidth,i=12,c=document.querySelector("header")?.getBoundingClientRect().height||0,l=window.getComputedStyle(t,"::before"),a=B=>parseFloat(B)||0,p=a(l.width)+a(l.paddingLeft)+a(l.paddingRight),f=a(l.height)+a(l.paddingTop)+a(l.paddingBottom),h=t.getBoundingClientRect(),d=t.dataset.originalPosition||"top",g=r.find(B=>t.classList.contains(B)),L=d==="top"||d==="bottom"?p/2:p,Ht=d==="top"?f+(d==="top"?i:0):f/2,v=h.top-Ht<c,V=h.bottom+(d==="bottom"?f+i:0)>window.innerHeight,w=h.right+L+i>n,D=h.left-L-i<0,G=h.left+p/2+i>n,q=h.left-p/2-i<0;if(d!==g&&!(w||D||v||V||G||q)){t.classList.remove(...r),t.classList.add(d);return}let x=d;w&&G?x="left":D&&q?x="right":w&&v||D&&v?x=G&&"left"||q&&"right"||"bottom":w!==D&&!V?x=w?"left":"right":v&&["top","left","right"].includes(d)?x="bottom":V&&["bottom","left","right"].includes(d)&&(x="top"),g!==x&&(t.classList.remove(...r),t.classList.add(x))},N=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let n=(i,c)=>{if(c!=null)for(let l of r)l.hasAttribute(i)||l.setAttribute(i,c)};for(let i of le)n(i,this.getAttribute(i));n("data-promotion-code",H(this))},vt=function(t){let r=this.closest(".section");if(!r)return;let n=this.parentElement;for(;n.matches("strong, em")&&n.childElementCount===1&&n.firstElementChild===this&&n.textContent.trim()===this.textContent.trim();)n.replaceWith(...n.childNodes),n=this.parentElement;let i=this;for(;i.parentElement!==r;)i=i.parentElement;let c=/^button-(s|m|l|xl|xxl)$/,l=[...i.querySelectorAll(".con-button")].find(d=>!this.contains(d)&&[...d.classList].some(g=>c.test(g))),a,p=[];if(l)a=[...l.classList].find(d=>c.test(d)),p=[...l.classList].filter(d=>d.startsWith("button-")&&!c.test(d));else{let d=[...i.classList].find(g=>/^(s|m|l|xl|xxl)-button$/.test(g));d?a=`button-${d.split("-")[0]}`:i.classList.contains("hero-marquee")?(a="button-xl",p=["button-justified-mobile"]):i.matches(".accordion, .media")||(a=i.matches(".large, .xlarge")?"button-xl":"button-l")}for(let d of this.merchLink?.matchAll(/(?:&|#)_button-([a-zA-Z-]+)/g)??[])p.push(d[1]);let f=t.matches(".con-button")?[t]:t.querySelectorAll(".con-button");for(let d of f)a&&![...d.classList].some(g=>c.test(g))&&d.classList.add(a),d.classList.add(...p);let h=this.closest("p");h&&(f.length||[...h.childNodes].every(d=>d===this||d.nodeType===Node.TEXT_NODE&&!d.textContent.trim()))&&h.classList.add("action-area")},Dt=function(t,r=!1){let i=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!i.length)return null;if(r)return K(i[0]);let c=document.createElement("div");return c.setAttribute("slot","footer"),c.classList.add("action-area"),c.append(...i.map(l=>K(l))),c},C=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let i=r.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(it,Q);export{de as CHECKOUT_STYLE_PATTERN,me as checkoutOptionsProvider,ue as priceOptionsProvider,Rt as renderImageMarkup,wt as stripTrialCtas};
