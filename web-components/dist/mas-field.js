var Ut=Object.defineProperty;var st=e=>{throw TypeError(e)};var kt=(e,o,t)=>o in e?Ut(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t;var Y=(e,o,t)=>kt(e,typeof o!="symbol"?o+"":o,t),W=(e,o,t)=>o.has(e)||st("Cannot "+t);var m=(e,o,t)=>(W(e,o,"read from private field"),t?t.call(e):o.get(e)),b=(e,o,t)=>o.has(e)?st("Cannot add the same private member more than once"):o instanceof WeakSet?o.add(e):o.set(e,t),_=(e,o,t,r)=>(W(e,o,"write to private field"),r?r.call(e,t):o.set(e,t),t),u=(e,o,t)=>(W(e,o,"access private method"),t);var $t=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var at=2e4;var Ft='span[is="inline-price"][data-wcs-osi]',Vt='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Gt='a[is="upt-link"]',Le=`${Ft},${Vt},${Gt}`,ct=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var S="aem:load",R="aem:error",lt="mas:ready";var Se=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var dt="legal",pt="plan-type-text",ut="mas-ff-defaults";var qt="mas-commerce-service",z=/^(accent|primary|secondary)(-(outline|link))?$/;function Bt(e,o={},t=null,r=null){let n=r?document.createElement(e,{is:r}):document.createElement(e);t instanceof HTMLElement?n.appendChild(t):n.innerHTML=t;for(let[i,c]of Object.entries(o))n.setAttribute(i,c);return n}function Yt(e){let o=[...e.classList].find(r=>z.test(r));if(o)return o;let t=e.closest("strong, em");return t?.tagName==="STRONG"?"primary":t?.tagName==="EM"?"secondary":"secondary-link"}function K(e){let o=Yt(e),t=e.cloneNode(!0);if([...e.classList].some(n=>z.test(n))){let n=e.parentElement;for(;n?.matches("strong, em");){let i=t.firstElementChild;(i?.tagName!==n.tagName||t.innerHTML.trim()!==i.outerHTML)&&t.replaceChildren(Bt(n.tagName.toLowerCase(),{},t.innerHTML)),n=n.parentElement}}let r=t;if(e.dataset.wcsOsi){r=customElements.get("checkout-link")?.createCheckoutLink(e.dataset,t.innerHTML),r||(r=document.createElement("a",{is:"checkout-link"}),r.setAttribute("is","checkout-link"),r.innerHTML=`<span style="pointer-events: none;">${t.innerHTML}</span>`);for(let{name:i,value:c}of e.attributes)["is","href"].includes(i)||r.setAttribute(i,c)}for(let n of[...r.classList])z.test(n)&&r.classList.remove(n);return o.endsWith("-link")||(r.classList.add("button","con-button"),r.classList.add(o==="accent"||o==="primary"?"blue":"outline")),r}function mt(){return document.getElementsByTagName(qt)?.[0]}function ht(e){let o=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&o?.isInlinePrice&&o?.dataset?.template==="price"}var Wt=[".","!","?"],zt=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=zt,document.head.append(e)}var Kt="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function jt(e){let o=e.closest(Kt)??e.parentNode,t=document.createRange();return t.setStart(o,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function ft(e){let o=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(o.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??o[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function Xt(e){return!e||Wt.includes(e)?"upper":"lower"}function Zt(e){return Xt(jt(e))}function j(e,o){if(e.dataset.placeholder!==pt)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(o.wcsOsi=t,o.planTypeCase=Zt(e))}function Jt(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")}function H(e){return Jt(e)?e.contextPromotionCode:null}function Et(e,o){e&&(o.literals??(o.literals={}),Object.assign(o.literals,e))}function gt(e,o){ht(e)&&(o.displayPerUnit=!1,o.displayTax=!1)}function At(e,o){o.displayAnnual===void 0&&typeof e?.settings?.displayAnnual=="boolean"&&(o.displayAnnual=e.settings.displayAnnual,e.settings.displayAnnual&&e.setAttribute("annualized",""))}function Tt(e,o,t){!e?.providers||e.providers.has(o)||(e.providers.price(o),e.providers.checkout(t),e.providers.has(j)||e.providers.price(j))}function te(e,o){if(typeof e!="string"||!e)return null;let t;try{t=new URL(e,o)}catch{return null}return t.hostname.endsWith(".aem.page")?`${o}${t.pathname}${t.search}`:null}function Z(e){if(typeof e!="string"||!e)return"";try{return new URL(e).href}catch{return""}}function ee(e){if(typeof e!="string"||!e)return!1;try{return new URL(e).hostname.endsWith(".aem.page")}catch{return!1}}var re={png:{type:"image/png",format:"png"},jpg:{type:"image/jpeg",format:"jpg"},jpeg:{type:"image/jpeg",format:"jpg"},webp:{type:"image/webp",format:"webp"},gif:{type:"image/gif",format:"gif"}},X={width:2e3,media:"(min-width: 600px)"},ne=750;function U(e,o,t){let r=new URL(e);return r.searchParams.set("width",o),r.searchParams.set("format",t),r.searchParams.set("optimize","medium"),r.href}function bt(e,o){return o?.width?Math.min(e,o.width):e}function oe(e){let o=new URL(e).pathname.split(".").pop().toLowerCase();return re[o]??null}function _t(e){return String(e??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function xt(e){return!e?.width||!e?.height?"":` width="${e.width}" height="${e.height}"`}function Lt(e,o,t=""){if(!ee(e))return"";let r=Z(e),n=oe(r);if(!n)return`<img loading="lazy" alt="${_t(t)}"${xt(o)} src="${r}">`;let{type:i,format:c}=n,l=bt(X.width,o),s=bt(ne,o);return[`<source type="image/webp" srcset="${U(r,l,"webply")}" media="${X.media}">`,`<source type="image/webp" srcset="${U(r,s,"webply")}">`,`<source type="${i}" srcset="${U(r,l,c)}" media="${X.media}">`,`<img loading="lazy" alt="${_t(t)}" src="${U(r,s,c)}"${xt(o)}>`].join("")}function ie(e){return e?.hostname==="www.adobe.com"||e?.hostname==="adobe.com"}function St(e,o=globalThis.location){if(typeof e!="string"||!e||!ie(o))return e;let t=document.createElement("template");return t.innerHTML=`<picture>${e}</picture>`,t.content.querySelectorAll("source[srcset], img[src]").forEach(r=>{let n=r.tagName==="IMG"?"src":"srcset",i=te(r.getAttribute(n),o.origin);i&&r.setAttribute(n,i)}),t.content.querySelector("picture").innerHTML}var se=new Set(["SOURCE","IMG"]),ae=new Set(["src","srcset","media","type","alt","role","loading","data-mobile-set","width","height"]);function Ct(e){if(typeof e!="string"||!e)return"";let o=document.createElement("template"),t=/^\s*<picture[\s>]/i.test(e);o.innerHTML=t?e:`<picture>${e}</picture>`;let r=o.content.querySelector("picture");return r?(r.querySelectorAll("*").forEach(n=>{if(!se.has(n.tagName)){n.remove();return}[...n.attributes].forEach(i=>{ae.has(i.name.toLowerCase())||n.removeAttribute(i.name)})}),r.innerHTML):""}var ce="(min-width: 1200px)",le="(min-width: 600px)";function yt(e,o){if(!e)return"";let t=new DOMParser().parseFromString(`<picture>${e}</picture>`,"text/html");if(o==="desktop")return t.querySelector(`source[media="${ce}"]`)?.getAttribute("srcset")??"";if(o==="tablet")return t.querySelector(`source[media="${le}"]`)?.getAttribute("srcset")??"";if(o==="mobile"){let r=t.querySelector("img");return r?.hasAttribute("data-mobile-set")?r.getAttribute("src")??"":""}return""}var it="mas-field",de=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"],pe=/\b(accent|primary|secondary)\b(-\b(outline|link)\b)?/g;function ue(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}async function wt(e,o,t){let r=e.content.querySelector('a[data-analytics-id="buy-now"]'),i=[...e.content.querySelectorAll("a")].filter(s=>ct.has(s.dataset.analyticsId));if(i.length===0)return e.innerHTML;if(o&&!r){let s=t.getAttribute("field"),p=[],E=t.parentElement.querySelectorAll("mas-field").length>1?t.parentElement.querySelectorAll('mas-field[field^="ctas"]'):t.parentElement.parentElement.querySelectorAll('mas-field[field^="ctas"]');E.forEach(h=>{h.getAttribute("field")!==s&&p.push(h.checkReady())});let f=Promise.all(p),d,g=new Promise(h=>{d=setTimeout(()=>h([]),at)}),T=await Promise.race([f,g]);if(clearTimeout(d),p.length&&!T.length)return e.innerHTML;T.some(h=>h===!0)&&E.forEach(h=>{h.getAttribute("field")!==s&&(r??(r=h.querySelector('a[data-analytics-id="buy-now"]')))})}let c=!1;i.forEach(s=>{if(s.hasAttribute("data-replaced-osi")){let p=t.aemFragment?.data?.priceLiterals?.buyNow;r||!p||p==="buy-now"?s.remove():(s.hasAttribute("aria-label")&&s.removeAttribute("aria-label"),s.setAttribute("data-analytics-id","buy-now"),s.hasAttribute("data-modal")&&s.setAttribute("data-modal","crm"),s.textContent=p),c=!0}else s.remove()});let l=e.content.querySelector('a[data-analytics-id="buy-now"]')||r;return l&&c&&(l.className.trim()&&l.className.match(pe)?.forEach(s=>{l.classList.remove(s)}),l.classList.add("button","con-button","blue")),e.innerHTML}function me(e,o){if(!e)return o;let t=e.closest(it);if(!(t||e.hasAttribute("fragment-id")))return o;if(o[ut]=!0,o.wrapClauses=!0,Et(t?.aemFragment?.data?.priceLiterals,o),gt(e,o),t&&e.dataset.template===dt&&(o.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!o.promotionCode){let n=e.dataset.promotionCode??(t?H(t):null);n&&(o.promotionCode=n)}At(t,o)}function he(e,o){if(o.promotionCode||!e)return;let t=e.closest(it),r=e.dataset.promotionCode??(t?H(t):null);r&&(o.promotionCode=r)}function fe(e){Tt(e,me,he)}var Ee=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=Ee,document.head.append(e)}function Rt(e,o=globalThis.location){return typeof e!="string"||!e?"":`<picture>${St(e,o)}</picture>`}var y,M,O,x,A,P,I,a,k,J,tt,Nt,$,Mt,Ot,et,rt,Pt,nt,ot,It,N,vt,Dt,C,Q=class extends HTMLElement{constructor(){super(...arguments);b(this,a);b(this,y,null);b(this,M,!1);b(this,O,!1);b(this,x,null);Y(this,"settings",null);b(this,A,null);Y(this,"compatVersion");b(this,P,t=>{t.target===this.aemFragment&&_(this,O,!0)});b(this,I,async t=>{t.target===this.aemFragment&&(_(this,x,t.detail?.fields||null),this.settings=t.detail?.settings??null,_(this,M,!0),await u(this,a,rt).call(this),this.dispatchEvent(new CustomEvent(lt,{bubbles:!0,composed:!0,detail:t.detail})))})}get contextPromotionCode(){return this.getAttribute("data-promotion-code")}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,n){t==="field"&&(_(this,y,n),u(this,a,rt).call(this))}connectedCallback(){this.addEventListener(S,m(this,I)),this.addEventListener(R,m(this,P)),u(this,a,k).call(this),this.aemFragment?.setAttribute("hidden",""),fe(mt())}disconnectedCallback(){this.removeEventListener(S,m(this,I)),this.removeEventListener(R,m(this,P))}checkReady(){return m(this,M)?Promise.resolve(!0):m(this,O)?Promise.resolve(!1):new Promise(t=>{let r=n=>{n.target===this.aemFragment&&(this.removeEventListener(S,r),this.removeEventListener(R,r),t(n.type===S))};this.addEventListener(S,r),this.addEventListener(R,r)})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return ft(this)}};y=new WeakMap,M=new WeakMap,O=new WeakMap,x=new WeakMap,A=new WeakMap,P=new WeakMap,I=new WeakMap,a=new WeakSet,k=function(t=!1){if(m(this,A)?.isConnected&&m(this,A).matches('[data-role="mas-field-content"]')&&(!t||m(this,A).tagName==="SPAN"))return m(this,A);let r=this.querySelector(':scope > [data-role="mas-field-content"]');if(r&&(!t||r.tagName==="SPAN"))return _(this,A,r),r;t&&r?.remove();let n=document.createElement("span");return n.setAttribute("data-role","mas-field-content"),this.append(n),_(this,A,n),n},J=function(){this.querySelector(':scope > [data-role="mas-field-content"]')?.remove(),_(this,A,null)},tt=function(t){let r=document.createElement("template");r.innerHTML=t;let n=r.content.querySelector("picture");if(!n)return;n.innerHTML=Ct(n.innerHTML),n.setAttribute("data-role","mas-field-content");let i=this.querySelector(':scope > [data-role="mas-field-content"]');i?i.replaceWith(n):this.append(n),_(this,A,n),u(this,a,N).call(this,n)},Nt=function(t){let r=u(this,a,C).call(this,u(this,a,$).call(this,m(this,x).backgroundImageAltText));return`<img loading="lazy" ${typeof r=="string"&&r?`alt="${ue(r)}"`:'role="none"'} src="${Z(t)}">`},$=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},Mt=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let n=t?.match(/^(.+)\[(.+)\]$/);return n?{fieldName:n[1],index:n[2]}:{fieldName:t,index:null}},Ot=function(t,r,n){if(typeof t!="string")return null;let i=document.createElement("template");i.innerHTML=t;let c;if(!isNaN(r)){let p=parseInt(r,10);c=[...i.content.querySelectorAll("a")][p-1]}if(c||(c=i.content.querySelector(`a[data-key="${r}"]`)),!c)return null;if(n)return c.removeAttribute("class"),c.outerHTML;let l=c.outerHTML,s=c.parentElement;for(;s?.matches("strong, em");){let p=s.tagName.toLowerCase();l=`<${p}>${l}</${p}>`,s=s.parentElement}return l},et=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},rt=async function(){if(!m(this,x)||!m(this,y))return;this.hidden=!1;let{fieldName:t,index:r}=u(this,a,Mt).call(this,m(this,y)),n=t==="ctas"&&r!==null&&!!(this.closest("strong, em, .feds-cta-wrapper")||this.querySelector(":scope > strong, :scope > em"));if(r!==null&&isNaN(r)){let s=`${t.replace(/s$/,"")}Labels`,p=m(this,x)[s];if(p!==void 0){let f=(Array.isArray(p)?p:[p]).indexOf(r);if(f===-1){this.hidden=!0;return}let d=m(this,x)[t],g=Array.isArray(d)?d:d?[d]:[],T=u(this,a,$).call(this,g[f]);if(!T){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs){let F=document.createElement("template");if(F.innerHTML=T,T=await wt(F,!0,this),!T.trim()){this.hidden=!0;return}}u(this,a,et).call(this);let h=u(this,a,k).call(this,!0);h.innerHTML=u(this,a,C).call(this,T)??"",u(this,a,nt).call(this,h),u(this,a,ot).call(this,h),u(this,a,N).call(this,h);return}}let i=u(this,a,$).call(this,m(this,x)[t]);if(i===void 0){this.hidden=!0;return}if(u(this,a,et).call(this),r===null&&(t==="image"||t==="backgroundImage"||t==="backgrounds")){let s=u(this,a,C).call(this,i);if(typeof s=="string"&&s){let p=t==="image"||t==="backgrounds"?s:u(this,a,Nt).call(this,s);u(this,a,tt).call(this,Rt(p))}else u(this,a,J).call(this),this.hidden=!0;return}if(t==="backgrounds"&&r!==null){let s=u(this,a,C).call(this,yt(i,r)),p=typeof s=="string"&&s?Lt(s):"";p?u(this,a,tt).call(this,Rt(p)):(u(this,a,J).call(this),this.hidden=!0);return}let c=u(this,a,k).call(this,!0),l;if(r!==null){if(l=u(this,a,Ot).call(this,i,r,n),l===null){this.hidden=!0;return}}else l=u(this,a,C).call(this,i);if(typeof l=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs){let s=document.createElement("template");if(s.innerHTML=l,l=await wt(s,r!==null,this),!l.trim()){this.hidden=!0;return}}if(t==="ctas"&&!n){let s=u(this,a,Dt).call(this,l,r!==null);if(s){u(this,a,vt).call(this,s),c.replaceChildren(s),u(this,a,N).call(this,c);return}}c.innerHTML=l,u(this,a,nt).call(this,c),u(this,a,ot).call(this,c),u(this,a,N).call(this,c);return}if(l==null){this.hidden=!0;return}c.textContent=String(l)},Pt=function(t,r){return customElements.get("checkout-link")?.createCheckoutLink(t,r)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${r}</span>`,i})()},nt=function(t){for(let r of t.querySelectorAll("a[data-wcs-osi]:not([is])")){let n=u(this,a,Pt).call(this,r.dataset,r.innerHTML);for(let{name:i,value:c}of r.attributes)["is","href"].includes(i)||n.setAttribute(i,c);r.replaceWith(n)}},ot=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let n of r){if(n.dataset.tooltipWired)continue;n.dataset.tooltipWired="1",n.querySelector("svg")||n.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),n.hasAttribute("tabindex")||n.setAttribute("tabindex","0"),n.hasAttribute("role")||n.setAttribute("role","button"),n.hasAttribute("aria-label")||n.setAttribute("aria-label",n.dataset.tooltip);let i=["top","bottom","left","right"],c=[...n.classList].find(E=>i.includes(E)),l=c||"top";c||n.classList.add(l),n.dataset.originalPosition=l,n.classList.add("hide-tooltip");let s=()=>{n.classList.remove("hide-tooltip"),u(this,a,It).call(this,n)},p=()=>n.classList.add("hide-tooltip");n.addEventListener("mouseenter",s),n.addEventListener("focus",s),n.addEventListener("mouseleave",p),n.addEventListener("blur",p),n.addEventListener("keydown",E=>{E.key==="Escape"&&p()})}},It=function(t){let r=["top","bottom","right","left"],n=window.innerWidth,i=12,c=document.querySelector("header")?.getBoundingClientRect().height||0,l=window.getComputedStyle(t,"::before"),s=B=>parseFloat(B)||0,p=s(l.width)+s(l.paddingLeft)+s(l.paddingRight),E=s(l.height)+s(l.paddingTop)+s(l.paddingBottom),f=t.getBoundingClientRect(),d=t.dataset.originalPosition||"top",g=r.find(B=>t.classList.contains(B)),h=d==="top"||d==="bottom"?p/2:p,Ht=d==="top"?E+(d==="top"?i:0):E/2,v=f.top-Ht<c,V=f.bottom+(d==="bottom"?E+i:0)>window.innerHeight,w=f.right+h+i>n,D=f.left-h-i<0,G=f.left+p/2+i>n,q=f.left-p/2-i<0;if(d!==g&&!(w||D||v||V||G||q)){t.classList.remove(...r),t.classList.add(d);return}let L=d;w&&G?L="left":D&&q?L="right":w&&v||D&&v?L=G&&"left"||q&&"right"||"bottom":w!==D&&!V?L=w?"left":"right":v&&["top","left","right"].includes(d)?L="bottom":V&&["bottom","left","right"].includes(d)&&(L="top"),g!==L&&(t.classList.remove(...r),t.classList.add(L))},N=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let n=(i,c)=>{if(c!=null)for(let l of r)l.hasAttribute(i)||l.setAttribute(i,c)};for(let i of de)n(i,this.getAttribute(i));n("data-promotion-code",H(this))},vt=function(t){let r=this.closest(".section");if(!r)return;let n=this.parentElement;for(;n.matches("strong, em")&&n.childElementCount===1&&n.firstElementChild===this&&n.textContent.trim()===this.textContent.trim();)n.replaceWith(...n.childNodes),n=this.parentElement;let i=this;for(;i.parentElement!==r;)i=i.parentElement;let c=/^button-(s|m|l|xl|xxl)$/,l=[...i.querySelectorAll(".con-button")].find(d=>!this.contains(d)&&[...d.classList].some(g=>c.test(g))),s,p=[];if(l)s=[...l.classList].find(d=>c.test(d)),p=[...l.classList].filter(d=>d.startsWith("button-")&&!c.test(d));else{let d=[...i.classList].find(g=>/^(s|m|l|xl|xxl)-button$/.test(g));d?s=`button-${d.split("-")[0]}`:i.classList.contains("hero-marquee")?(s="button-xl",p=["button-justified-mobile"]):i.matches(".accordion, .media")||(s=i.matches(".large, .xlarge")?"button-xl":"button-l")}for(let d of this.merchLink?.matchAll(/(?:&|#)_button-([a-zA-Z-]+)/g)??[])p.push(d[1]);let E=t.matches(".con-button")?[t]:t.querySelectorAll(".con-button");for(let d of E)s&&![...d.classList].some(g=>c.test(g))&&d.classList.add(s),d.classList.add(...p);let f=this.closest("p");f&&(E.length||[...f.childNodes].every(d=>d===this||d.nodeType===Node.TEXT_NODE&&!d.textContent.trim()))&&f.classList.add("action-area")},Dt=function(t,r=!1){let i=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!i.length)return null;if(r)return K(i[0]);let c=document.createElement("div");return c.setAttribute("slot","footer"),c.classList.add("action-area"),c.append(...i.map(l=>K(l))),c},C=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let i=r.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(it,Q);export{pe as CHECKOUT_STYLE_PATTERN,he as checkoutOptionsProvider,me as priceOptionsProvider,Rt as renderImageMarkup,wt as stripTrialCtas};
