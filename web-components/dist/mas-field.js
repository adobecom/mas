var $t=Object.defineProperty;var at=e=>{throw TypeError(e)};var Ft=(e,o,t)=>o in e?$t(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t;var q=(e,o,t)=>Ft(e,typeof o!="symbol"?o+"":o,t),W=(e,o,t)=>o.has(e)||at("Cannot "+t);var m=(e,o,t)=>(W(e,o,"read from private field"),t?t.call(e):o.get(e)),_=(e,o,t)=>o.has(e)?at("Cannot add the same private member more than once"):o instanceof WeakSet?o.add(e):o.set(e,t),b=(e,o,t,r)=>(W(e,o,"write to private field"),r?r.call(e,t):o.set(e,t),t),u=(e,o,t)=>(W(e,o,"access private method"),t);var Vt=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var ct=2e4;var Gt='span[is="inline-price"][data-wcs-osi]',Bt='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Yt='a[is="upt-link"]',Ce=`${Gt},${Bt},${Yt}`,lt=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var S="aem:load",R="aem:error",dt="mas:ready";var we=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var pt="legal",ut="plan-type-text",mt="mas-ff-defaults";var ft=["buy-now","select","save-now","get-offer","save-today"];var qt="mas-commerce-service",z=/^(accent|primary|secondary)(-(outline|link))?$/;function Wt(e,o={},t=null,r=null){let n=r?document.createElement(e,{is:r}):document.createElement(e);t instanceof HTMLElement?n.appendChild(t):n.innerHTML=t;for(let[i,c]of Object.entries(o))n.setAttribute(i,c);return n}function zt(e){let o=[...e.classList].find(r=>z.test(r));if(o)return o;let t=e.closest("strong, em");return t?.tagName==="STRONG"?"primary":t?.tagName==="EM"?"secondary":"secondary-link"}function K(e){let o=zt(e),t=e.cloneNode(!0);if([...e.classList].some(n=>z.test(n))){let n=e.parentElement;for(;n?.matches("strong, em");){let i=t.firstElementChild;(i?.tagName!==n.tagName||t.innerHTML.trim()!==i.outerHTML)&&t.replaceChildren(Wt(n.tagName.toLowerCase(),{},t.innerHTML)),n=n.parentElement}}let r=t;if(e.dataset.wcsOsi){r=customElements.get("checkout-link")?.createCheckoutLink(e.dataset,t.innerHTML),r||(r=document.createElement("a",{is:"checkout-link"}),r.setAttribute("is","checkout-link"),r.innerHTML=`<span style="pointer-events: none;">${t.innerHTML}</span>`);for(let{name:i,value:c}of e.attributes)["is","href"].includes(i)||r.setAttribute(i,c)}for(let n of[...r.classList])z.test(n)&&r.classList.remove(n);return o.endsWith("-link")||(r.classList.add("button","con-button"),r.classList.add(o==="accent"||o==="primary"?"blue":"outline")),r}function ht(){return document.getElementsByTagName(qt)?.[0]}function Et(e){let o=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&o?.isInlinePrice&&o?.dataset?.template==="price"}var Kt=[".","!","?"],jt=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=jt,document.head.append(e)}var Xt="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function Zt(e){let o=e.closest(Xt)??e.parentNode,t=document.createRange();return t.setStart(o,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function gt(e){let o=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(o.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??o[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function Qt(e){return!e||Kt.includes(e)?"upper":"lower"}function Jt(e){return Qt(Zt(e))}function j(e,o){if(e.dataset.placeholder!==ut)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(o.wcsOsi=t,o.planTypeCase=Jt(e))}function ee(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")}function H(e){return ee(e)?e.contextPromotionCode:null}function At(e,o){e&&(o.literals??(o.literals={}),Object.assign(o.literals,e))}function Tt(e,o){Et(e)&&(o.displayPerUnit=!1,o.displayTax=!1)}function _t(e,o){o.displayAnnual===void 0&&typeof e?.settings?.displayAnnual=="boolean"&&(o.displayAnnual=e.settings.displayAnnual,e.settings.displayAnnual&&e.setAttribute("annualized",""))}function bt(e,o,t){!e?.providers||e.providers.has(o)||(e.providers.price(o),e.providers.checkout(t),e.providers.has(j)||e.providers.price(j))}function re(e,o){if(typeof e!="string"||!e)return null;let t;try{t=new URL(e,o)}catch{return null}return t.hostname.endsWith(".aem.page")?`${o}${t.pathname}${t.search}`:null}function Z(e){if(typeof e!="string"||!e)return"";try{return new URL(e).href}catch{return""}}function ne(e){if(typeof e!="string"||!e)return!1;try{return new URL(e).hostname.endsWith(".aem.page")}catch{return!1}}var oe={png:{type:"image/png",format:"png"},jpg:{type:"image/jpeg",format:"jpg"},jpeg:{type:"image/jpeg",format:"jpg"},webp:{type:"image/webp",format:"webp"},gif:{type:"image/gif",format:"gif"}},X={width:2e3,media:"(min-width: 600px)"},ie=750;function U(e,o,t){let r=new URL(e);return r.searchParams.set("width",o),r.searchParams.set("format",t),r.searchParams.set("optimize","medium"),r.href}function xt(e,o){return o?.width?Math.min(e,o.width):e}function se(e){let o=new URL(e).pathname.split(".").pop().toLowerCase();return oe[o]??null}function Lt(e){return String(e??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function St(e){return!e?.width||!e?.height?"":` width="${e.width}" height="${e.height}"`}function Ct(e,o,t=""){if(!ne(e))return"";let r=Z(e),n=se(r);if(!n)return`<img loading="lazy" alt="${Lt(t)}"${St(o)} src="${r}">`;let{type:i,format:c}=n,l=xt(X.width,o),s=xt(ie,o);return[`<source type="image/webp" srcset="${U(r,l,"webply")}" media="${X.media}">`,`<source type="image/webp" srcset="${U(r,s,"webply")}">`,`<source type="${i}" srcset="${U(r,l,c)}" media="${X.media}">`,`<img loading="lazy" alt="${Lt(t)}" src="${U(r,s,c)}"${St(o)}>`].join("")}function ae(e){return e?.hostname==="www.adobe.com"||e?.hostname==="adobe.com"}function wt(e,o=globalThis.location){if(typeof e!="string"||!e||!ae(o))return e;let t=document.createElement("template");return t.innerHTML=`<picture>${e}</picture>`,t.content.querySelectorAll("source[srcset], img[src]").forEach(r=>{let n=r.tagName==="IMG"?"src":"srcset",i=re(r.getAttribute(n),o.origin);i&&r.setAttribute(n,i)}),t.content.querySelector("picture").innerHTML}var ce=new Set(["SOURCE","IMG"]),le=new Set(["src","srcset","media","type","alt","role","loading","data-mobile-set","width","height"]);function yt(e){if(typeof e!="string"||!e)return"";let o=document.createElement("template"),t=/^\s*<picture[\s>]/i.test(e);o.innerHTML=t?e:`<picture>${e}</picture>`;let r=o.content.querySelector("picture");return r?(r.querySelectorAll("*").forEach(n=>{if(!ce.has(n.tagName)){n.remove();return}[...n.attributes].forEach(i=>{le.has(i.name.toLowerCase())||n.removeAttribute(i.name)})}),r.innerHTML):""}var de="(min-width: 1200px)",pe="(min-width: 600px)";function Rt(e,o){if(!e)return"";let t=new DOMParser().parseFromString(`<picture>${e}</picture>`,"text/html");if(o==="desktop")return t.querySelector(`source[media="${de}"]`)?.getAttribute("srcset")??"";if(o==="tablet")return t.querySelector(`source[media="${pe}"]`)?.getAttribute("srcset")??"";if(o==="mobile"){let r=t.querySelector("img");return r?.hasAttribute("data-mobile-set")?r.getAttribute("src")??"":""}return""}var st="mas-field",ue=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"],me=/\b(accent|primary|secondary)\b(-\b(outline|link)\b)?/g;function fe(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}var Q=ft.map(e=>`a[data-analytics-id="${e}"]`).join(",");async function Nt(e,o,t){let r=e.content.querySelector(Q),i=[...e.content.querySelectorAll("a")].filter(s=>lt.has(s.dataset.analyticsId));if(i.length===0)return e.innerHTML;if(o&&!r){let s=t.getAttribute("field"),p=[],E=t.parentElement.querySelectorAll("mas-field").length>1?t.parentElement.querySelectorAll('mas-field[field^="ctas"]'):t.parentElement.parentElement.querySelectorAll('mas-field[field^="ctas"]');E.forEach(f=>{f.getAttribute("field")!==s&&p.push(f.checkReady())});let h=Promise.all(p),d,g=new Promise(f=>{d=setTimeout(()=>f([]),ct)}),T=await Promise.race([h,g]);if(clearTimeout(d),p.length&&!T.length)return e.innerHTML;T.some(f=>f===!0)&&E.forEach(f=>{f.getAttribute("field")!==s&&(r??(r=f.querySelector(Q)))})}let c=!1;i.forEach(s=>{if(s.hasAttribute("data-replaced-osi")){let p=t.aemFragment?.data?.priceLiterals?.buyNow;r||!p||p==="buy-now"?s.remove():(s.hasAttribute("aria-label")&&s.removeAttribute("aria-label"),s.setAttribute("data-analytics-id","buy-now"),s.hasAttribute("data-modal")&&s.setAttribute("data-modal","crm"),s.textContent=p),c=!0}else s.remove()});let l=e.content.querySelector(Q)||r;return l&&c&&(l.className.trim()&&l.className.match(me)?.forEach(s=>{l.classList.remove(s)}),l.classList.add("button","con-button","blue")),e.innerHTML}function he(e,o){if(!e)return o;let t=e.closest(st);if(!(t||e.hasAttribute("fragment-id")))return o;if(o[mt]=!0,o.wrapClauses=!0,At(t?.aemFragment?.data?.priceLiterals,o),Tt(e,o),t&&e.dataset.template===pt&&(o.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!o.promotionCode){let n=e.dataset.promotionCode??(t?H(t):null);n&&(o.promotionCode=n)}_t(t,o)}function Ee(e,o){if(o.promotionCode||!e)return;let t=e.closest(st),r=e.dataset.promotionCode??(t?H(t):null);r&&(o.promotionCode=r)}function ge(e){bt(e,he,Ee)}var Ae=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=Ae,document.head.append(e)}function Mt(e,o=globalThis.location){return typeof e!="string"||!e?"":`<picture>${wt(e,o)}</picture>`}var w,M,O,x,A,P,I,a,k,tt,et,Ot,$,Pt,It,rt,nt,vt,ot,it,Dt,N,Ht,Ut,C,J=class extends HTMLElement{constructor(){super(...arguments);_(this,a);_(this,w,null);_(this,M,!1);_(this,O,!1);_(this,x,null);q(this,"settings",null);_(this,A,null);q(this,"compatVersion");_(this,P,t=>{t.target===this.aemFragment&&b(this,O,!0)});_(this,I,async t=>{t.target===this.aemFragment&&(b(this,x,t.detail?.fields||null),this.settings=t.detail?.settings??null,b(this,M,!0),await u(this,a,nt).call(this),this.dispatchEvent(new CustomEvent(dt,{bubbles:!0,composed:!0,detail:t.detail})))})}get contextPromotionCode(){return this.getAttribute("data-promotion-code")}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,n){t==="field"&&(b(this,w,n),u(this,a,nt).call(this))}connectedCallback(){this.addEventListener(S,m(this,I)),this.addEventListener(R,m(this,P)),u(this,a,k).call(this),this.aemFragment?.setAttribute("hidden",""),ge(ht())}disconnectedCallback(){this.removeEventListener(S,m(this,I)),this.removeEventListener(R,m(this,P))}checkReady(){return m(this,M)?Promise.resolve(!0):m(this,O)?Promise.resolve(!1):new Promise(t=>{let r=n=>{n.target===this.aemFragment&&(this.removeEventListener(S,r),this.removeEventListener(R,r),t(n.type===S))};this.addEventListener(S,r),this.addEventListener(R,r)})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return gt(this)}};w=new WeakMap,M=new WeakMap,O=new WeakMap,x=new WeakMap,A=new WeakMap,P=new WeakMap,I=new WeakMap,a=new WeakSet,k=function(t=!1){if(m(this,A)?.isConnected&&m(this,A).matches('[data-role="mas-field-content"]')&&(!t||m(this,A).tagName==="SPAN"))return m(this,A);let r=this.querySelector(':scope > [data-role="mas-field-content"]');if(r&&(!t||r.tagName==="SPAN"))return b(this,A,r),r;t&&r?.remove();let n=document.createElement("span");return n.setAttribute("data-role","mas-field-content"),this.append(n),b(this,A,n),n},tt=function(){this.querySelector(':scope > [data-role="mas-field-content"]')?.remove(),b(this,A,null)},et=function(t){let r=document.createElement("template");r.innerHTML=t;let n=r.content.querySelector("picture");if(!n)return;n.innerHTML=yt(n.innerHTML),n.setAttribute("data-role","mas-field-content");let i=this.querySelector(':scope > [data-role="mas-field-content"]');i?i.replaceWith(n):this.append(n),b(this,A,n),u(this,a,N).call(this,n)},Ot=function(t){let r=u(this,a,C).call(this,u(this,a,$).call(this,m(this,x).backgroundImageAltText));return`<img loading="lazy" ${typeof r=="string"&&r?`alt="${fe(r)}"`:'role="none"'} src="${Z(t)}">`},$=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},Pt=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let n=t?.match(/^(.+)\[(.+)\]$/);return n?{fieldName:n[1],index:n[2]}:{fieldName:t,index:null}},It=function(t,r,n){if(typeof t!="string")return null;let i=document.createElement("template");i.innerHTML=t;let c;if(!isNaN(r)){let p=parseInt(r,10);c=[...i.content.querySelectorAll("a")][p-1]}if(c||(c=i.content.querySelector(`a[data-key="${r}"]`)),!c)return null;if(n)return c.removeAttribute("class"),c.outerHTML;let l=c.outerHTML,s=c.parentElement;for(;s?.matches("strong, em");){let p=s.tagName.toLowerCase();l=`<${p}>${l}</${p}>`,s=s.parentElement}return l},rt=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},nt=async function(){if(!m(this,x)||!m(this,w))return;this.hidden=!1;let{fieldName:t,index:r}=u(this,a,Pt).call(this,m(this,w)),n=t==="ctas"&&r!==null&&!!(this.closest("strong, em, .feds-cta-wrapper")||this.querySelector(":scope > strong, :scope > em"));if(r!==null&&isNaN(r)){let s=`${t.replace(/s$/,"")}Labels`,p=m(this,x)[s];if(p!==void 0){let h=(Array.isArray(p)?p:[p]).indexOf(r);if(h===-1){this.hidden=!0;return}let d=m(this,x)[t],g=Array.isArray(d)?d:d?[d]:[],T=u(this,a,$).call(this,g[h]);if(!T){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs){let F=document.createElement("template");if(F.innerHTML=T,T=await Nt(F,!0,this),!T.trim()){this.hidden=!0;return}}u(this,a,rt).call(this);let f=u(this,a,k).call(this,!0);f.innerHTML=u(this,a,C).call(this,T)??"",u(this,a,ot).call(this,f),u(this,a,it).call(this,f),u(this,a,N).call(this,f);return}}let i=u(this,a,$).call(this,m(this,x)[t]);if(i===void 0){this.hidden=!0;return}if(u(this,a,rt).call(this),r===null&&(t==="image"||t==="backgroundImage"||t==="backgrounds")){let s=u(this,a,C).call(this,i);if(typeof s=="string"&&s){let p=t==="image"||t==="backgrounds"?s:u(this,a,Ot).call(this,s);u(this,a,et).call(this,Mt(p))}else u(this,a,tt).call(this),this.hidden=!0;return}if(t==="backgrounds"&&r!==null){let s=u(this,a,C).call(this,Rt(i,r)),p=typeof s=="string"&&s?Ct(s):"";p?u(this,a,et).call(this,Mt(p)):(u(this,a,tt).call(this),this.hidden=!0);return}let c=u(this,a,k).call(this,!0),l;if(r!==null){if(l=u(this,a,It).call(this,i,r,n),l===null){this.hidden=!0;return}}else l=u(this,a,C).call(this,i);if(typeof l=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs){let s=document.createElement("template");if(s.innerHTML=l,l=await Nt(s,r!==null,this),!l.trim()){this.hidden=!0;return}}if(t==="ctas"&&!n){let s=u(this,a,Ut).call(this,l,r!==null);if(s){u(this,a,Ht).call(this,s),c.replaceChildren(s),u(this,a,N).call(this,c);return}}c.innerHTML=l,u(this,a,ot).call(this,c),u(this,a,it).call(this,c),u(this,a,N).call(this,c);return}if(l==null){this.hidden=!0;return}c.textContent=String(l)},vt=function(t,r){return customElements.get("checkout-link")?.createCheckoutLink(t,r)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${r}</span>`,i})()},ot=function(t){for(let r of t.querySelectorAll("a[data-wcs-osi]:not([is])")){let n=u(this,a,vt).call(this,r.dataset,r.innerHTML);for(let{name:i,value:c}of r.attributes)["is","href"].includes(i)||n.setAttribute(i,c);r.replaceWith(n)}},it=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let n of r){if(n.dataset.tooltipWired)continue;n.dataset.tooltipWired="1",n.querySelector("svg")||n.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="m10,18.75c-4.8252,0-8.75-3.9248-8.75-8.75S5.1748,1.25,10,1.25s8.75,3.9248,8.75,8.75-3.9248,8.75-8.75,8.75Zm0-16c-3.99805,0-7.25,3.25195-7.25,7.25s3.25195,7.25,7.25,7.25,7.25-3.25195,7.25-7.25-3.25195-7.25-7.25-7.25Z"></path><path fill="currentcolor" d="m10.00064,5.26036c.23065-.00813.45538.07387.62661.22862.33033.36505.33033.92102,0,1.28607-.16935.15851-.39483.24308-.62664.23504-.23635.00948-.46589-.08035-.63302-.24775-.16207-.1679-.24916-.39432-.24137-.62755-.01238-.23497.06959-.46515.2277-.6394.17358-.16474.40786-.24988.64671-.23503Z"></path><path fill="currentcolor" d="m10,15.0625c-.41406,0-.75-.33594-.75-.75v-4.83496c0-.41406.33594-.75.75-.75s.75.33594.75.75v4.83496c0,.41406-.33594.75-.75.75Z"></path></svg>'),n.hasAttribute("tabindex")||n.setAttribute("tabindex","0"),n.hasAttribute("role")||n.setAttribute("role","button"),n.hasAttribute("aria-label")||n.setAttribute("aria-label",n.dataset.tooltip);let i=["top","bottom","left","right"],c=[...n.classList].find(E=>i.includes(E)),l=c||"top";c||n.classList.add(l),n.dataset.originalPosition=l,n.classList.add("hide-tooltip");let s=()=>{n.classList.remove("hide-tooltip"),u(this,a,Dt).call(this,n)},p=()=>n.classList.add("hide-tooltip");n.addEventListener("mouseenter",s),n.addEventListener("focus",s),n.addEventListener("mouseleave",p),n.addEventListener("blur",p),n.addEventListener("keydown",E=>{E.key==="Escape"&&p()})}},Dt=function(t){let r=["top","bottom","right","left"],n=window.innerWidth,i=12,c=document.querySelector("header")?.getBoundingClientRect().height||0,l=window.getComputedStyle(t,"::before"),s=Y=>parseFloat(Y)||0,p=s(l.width)+s(l.paddingLeft)+s(l.paddingRight),E=s(l.height)+s(l.paddingTop)+s(l.paddingBottom),h=t.getBoundingClientRect(),d=t.dataset.originalPosition||"top",g=r.find(Y=>t.classList.contains(Y)),f=d==="top"||d==="bottom"?p/2:p,kt=d==="top"?E+(d==="top"?i:0):E/2,v=h.top-kt<c,V=h.bottom+(d==="bottom"?E+i:0)>window.innerHeight,y=h.right+f+i>n,D=h.left-f-i<0,G=h.left+p/2+i>n,B=h.left-p/2-i<0;if(d!==g&&!(y||D||v||V||G||B)){t.classList.remove(...r),t.classList.add(d);return}let L=d;y&&G?L="left":D&&B?L="right":y&&v||D&&v?L=G&&"left"||B&&"right"||"bottom":y!==D&&!V?L=y?"left":"right":v&&["top","left","right"].includes(d)?L="bottom":V&&["bottom","left","right"].includes(d)&&(L="top"),g!==L&&(t.classList.remove(...r),t.classList.add(L))},N=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let n=(i,c)=>{if(c!=null)for(let l of r)l.hasAttribute(i)||l.setAttribute(i,c)};for(let i of ue)n(i,this.getAttribute(i));n("data-promotion-code",H(this))},Ht=function(t){let r=this.closest(".section");if(!r)return;let n=this.parentElement;for(;n.matches("strong, em")&&n.childElementCount===1&&n.firstElementChild===this&&n.textContent.trim()===this.textContent.trim();)n.replaceWith(...n.childNodes),n=this.parentElement;let i=this;for(;i.parentElement!==r;)i=i.parentElement;let c=/^button-(s|m|l|xl|xxl)$/,l=[...i.querySelectorAll(".con-button")].find(d=>!this.contains(d)&&[...d.classList].some(g=>c.test(g))),s,p=[];if(l)s=[...l.classList].find(d=>c.test(d)),p=[...l.classList].filter(d=>d.startsWith("button-")&&!c.test(d));else{let d=[...i.classList].find(g=>/^(s|m|l|xl|xxl)-button$/.test(g));d?s=`button-${d.split("-")[0]}`:i.classList.contains("hero-marquee")?(s="button-xl",p=["button-justified-mobile"]):i.matches(".accordion, .media")||(s=i.matches(".large, .xlarge")?"button-xl":"button-l")}for(let d of this.merchLink?.matchAll(/(?:&|#)_button-([a-zA-Z-]+)/g)??[])p.push(d[1]);let E=t.matches(".con-button")?[t]:t.querySelectorAll(".con-button");for(let d of E)s&&![...d.classList].some(g=>c.test(g))&&d.classList.add(s),d.classList.add(...p);let h=this.closest("p");h&&(E.length||[...h.childNodes].every(d=>d===this||d.nodeType===Node.TEXT_NODE&&!d.textContent.trim()))&&h.classList.add("action-area")},Ut=function(t,r=!1){let i=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!i.length)return null;if(r)return K(i[0]);let c=document.createElement("div");return c.setAttribute("slot","footer"),c.classList.add("action-area"),c.append(...i.map(l=>K(l))),c},C=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let i=r.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(st,J);export{me as CHECKOUT_STYLE_PATTERN,Ee as checkoutOptionsProvider,he as priceOptionsProvider,Mt as renderImageMarkup,Nt as stripTrialCtas};
