var kt=Object.defineProperty;var st=t=>{throw TypeError(t)};var $t=(t,o,e)=>o in t?kt(t,o,{enumerable:!0,configurable:!0,writable:!0,value:e}):t[o]=e;var Y=(t,o,e)=>$t(t,typeof o!="symbol"?o+"":o,e),W=(t,o,e)=>o.has(t)||st("Cannot "+e);var h=(t,o,e)=>(W(t,o,"read from private field"),e?e.call(t):o.get(t)),b=(t,o,e)=>o.has(t)?st("Cannot add the same private member more than once"):o instanceof WeakSet?o.add(t):o.set(t,e),_=(t,o,e,r)=>(W(t,o,"write to private field"),r?r.call(t,e):o.set(t,e),e),p=(t,o,e)=>(W(t,o,"access private method"),e);var at=2e4;var Ft='span[is="inline-price"][data-wcs-osi]',Vt='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Gt='a[is="upt-link"]',Te=`${Ft},${Vt},${Gt}`,ct=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var C="aem:load",N="aem:error",lt="mas:ready";var be=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var _e=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var dt="legal",ut="plan-type-text",pt="mas-ff-defaults";var qt="mas-commerce-service",z=/^(accent|primary|secondary)(-(outline|link))?$/;function Bt(t,o={},e=null,r=null){let n=r?document.createElement(t,{is:r}):document.createElement(t);e instanceof HTMLElement?n.appendChild(e):n.innerHTML=e;for(let[i,c]of Object.entries(o))n.setAttribute(i,c);return n}function Yt(t){let o=[...t.classList].find(r=>z.test(r));if(o)return o;let e=t.closest("strong, em");return e?.tagName==="STRONG"?"primary":e?.tagName==="EM"?"secondary":"secondary-link"}function K(t){let o=Yt(t),e=t.cloneNode(!0);if([...t.classList].some(n=>z.test(n))){let n=t.parentElement;for(;n?.matches("strong, em");){let i=e.firstElementChild;(i?.tagName!==n.tagName||e.innerHTML.trim()!==i.outerHTML)&&e.replaceChildren(Bt(n.tagName.toLowerCase(),{},e.innerHTML)),n=n.parentElement}}let r=e;if(t.dataset.wcsOsi){r=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,e.innerHTML),r||(r=document.createElement("a",{is:"checkout-link"}),r.setAttribute("is","checkout-link"),r.innerHTML=`<span style="pointer-events: none;">${e.innerHTML}</span>`);for(let{name:i,value:c}of t.attributes)["is","href"].includes(i)||r.setAttribute(i,c)}for(let n of[...r.classList])z.test(n)&&r.classList.remove(n);return o.endsWith("-link")||(r.classList.add("button","con-button"),r.classList.add(o==="accent"||o==="primary"?"blue":"outline")),r}function mt(){return document.getElementsByTagName(qt)?.[0]}function ht(t){let o=t.nextElementSibling?.nodeName==="BR"?t.nextElementSibling.nextElementSibling:t.nextElementSibling;return t.dataset.template==="strikethrough"&&(t.nextSibling?.nodeName!=="#text"||t.nextSibling.textContent.trim().length<2)&&o?.isInlinePrice&&o?.dataset?.template==="price"}var Wt=[".","!","?"],zt=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let t=document.createElement("style");t.setAttribute("data-plan-type-text",""),t.textContent=zt,document.head.append(t)}var Kt="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function jt(t){let o=t.closest(Kt)??t.parentNode,e=document.createRange();return e.setStart(o,0),e.setEndBefore(t),e.toString().replace(/\s+$/,"").slice(-1)}function ft(t){let o=[...t.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(o.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??o[0])?.dataset.wcsOsi??t.aemFragment?.data?.fields?.osi}function Xt(t){return!t||Wt.includes(t)?"upper":"lower"}function Zt(t){return Xt(jt(t))}function j(t,o){if(t.dataset.placeholder!==ut)return;let e=t.closest("merch-card, mas-field")?.osi;e&&(o.wcsOsi=e,o.planTypeCase=Zt(t))}function Jt(t){return t.compatVersion>=1||t.hasAttribute("data-promotion-project")}function U(t){return Jt(t)?t.contextPromotionCode:null}function Et(t,o){t&&(o.literals??(o.literals={}),Object.assign(o.literals,t))}function gt(t,o){ht(t)&&(o.displayPerUnit=!1,o.displayTax=!1)}function At(t,o){o.displayAnnual===void 0&&typeof t?.settings?.displayAnnual=="boolean"&&(o.displayAnnual=t.settings.displayAnnual,t.settings.displayAnnual&&t.setAttribute("annualized",""))}function Tt(t,o,e){!t?.providers||t.providers.has(o)||(t.providers.price(o),t.providers.checkout(e),t.providers.has(j)||t.providers.price(j))}function te(t,o){if(typeof t!="string"||!t)return null;let e;try{e=new URL(t,o)}catch{return null}return e.hostname.endsWith(".aem.page")?`${o}${e.pathname}${e.search}`:null}function Z(t){if(typeof t!="string"||!t)return"";try{return new URL(t).href}catch{return""}}function ee(t){if(typeof t!="string"||!t)return!1;try{return new URL(t).hostname.endsWith(".aem.page")}catch{return!1}}var re={png:{type:"image/png",format:"png"},jpg:{type:"image/jpeg",format:"jpg"},jpeg:{type:"image/jpeg",format:"jpg"},webp:{type:"image/webp",format:"webp"},gif:{type:"image/gif",format:"gif"}},X={width:2e3,media:"(min-width: 600px)"},ne=750;function k(t,o,e){let r=new URL(t);return r.searchParams.set("width",o),r.searchParams.set("format",e),r.searchParams.set("optimize","medium"),r.href}function bt(t,o){return o?.width?Math.min(t,o.width):t}function oe(t){let o=new URL(t).pathname.split(".").pop().toLowerCase();return re[o]??null}function _t(t){return String(t??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function xt(t){return!t?.width||!t?.height?"":` width="${t.width}" height="${t.height}"`}function Lt(t,o,e=""){if(!ee(t))return"";let r=Z(t),n=oe(r);if(!n)return`<img loading="lazy" alt="${_t(e)}"${xt(o)} src="${r}">`;let{type:i,format:c}=n,d=bt(X.width,o),a=bt(ne,o);return[`<source type="image/webp" srcset="${k(r,d,"webply")}" media="${X.media}">`,`<source type="image/webp" srcset="${k(r,a,"webply")}">`,`<source type="${i}" srcset="${k(r,d,c)}" media="${X.media}">`,`<img loading="lazy" alt="${_t(e)}" src="${k(r,a,c)}"${xt(o)}>`].join("")}function ie(t){return t?.hostname==="www.adobe.com"||t?.hostname==="adobe.com"}function St(t,o=globalThis.location){if(typeof t!="string"||!t||!ie(o))return t;let e=document.createElement("template");return e.innerHTML=`<picture>${t}</picture>`,e.content.querySelectorAll("source[srcset], img[src]").forEach(r=>{let n=r.tagName==="IMG"?"src":"srcset",i=te(r.getAttribute(n),o.origin);i&&r.setAttribute(n,i)}),e.content.querySelector("picture").innerHTML}var se=new Set(["SOURCE","IMG"]),ae=new Set(["src","srcset","media","type","alt","role","loading","data-mobile-set","width","height"]);function Ct(t){if(typeof t!="string"||!t)return"";let o=document.createElement("template"),e=/^\s*<picture[\s>]/i.test(t);o.innerHTML=e?t:`<picture>${t}</picture>`;let r=o.content.querySelector("picture");return r?(r.querySelectorAll("*").forEach(n=>{if(!se.has(n.tagName)){n.remove();return}[...n.attributes].forEach(i=>{ae.has(i.name.toLowerCase())||n.removeAttribute(i.name)})}),r.innerHTML):""}var ce="(min-width: 1200px)",le="(min-width: 600px)";function yt(t,o){if(!t)return"";let e=new DOMParser().parseFromString(`<picture>${t}</picture>`,"text/html");if(o==="desktop")return e.querySelector(`source[media="${ce}"]`)?.getAttribute("srcset")??"";if(o==="tablet")return e.querySelector(`source[media="${le}"]`)?.getAttribute("srcset")??"";if(o==="mobile"){let r=e.querySelector("img");return r?.hasAttribute("data-mobile-set")?r.getAttribute("src")??"":""}return""}var it="mas-field",de=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"],ue=/\b(accent|primary|secondary)\b(-\b(outline|link)\b)?/g;function pe(t){return t.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}var wt=["buy-now","select","see-all-plans-and-pricing"].map(t=>`a[data-analytics-id="${t}"]`).join(",");async function Rt(t,o,e){let r=t.content.querySelector('a[data-analytics-id="buy-now"]'),n=t.content.querySelector(wt),c=[...t.content.querySelectorAll("a")].filter(l=>ct.has(l.dataset.analyticsId));if(c.length===0)return t.innerHTML;if(o&&!r){let l=e.getAttribute("field"),m=[],f=e.parentElement.querySelectorAll("mas-field").length>1?e.parentElement.querySelectorAll('mas-field[field^="ctas"]'):e.parentElement.parentElement.querySelectorAll('mas-field[field^="ctas"]');f.forEach(E=>{E.getAttribute("field")!==l&&m.push(E.checkReady())});let u=Promise.all(m),g,L=new Promise(E=>{g=setTimeout(()=>E([]),at)}),T=await Promise.race([u,L]);if(clearTimeout(g),m.length&&!T.length)return t.innerHTML;T.some(E=>E===!0)&&f.forEach(E=>{E.getAttribute("field")!==l&&(r??(r=E.querySelector('a[data-analytics-id="buy-now"]')),n??(n=E.querySelector(wt)))})}let d=!1;c.forEach(l=>{if(l.hasAttribute("data-replaced-osi")){let m=e.aemFragment?.data?.priceLiterals?.buyNow;n||!m||m==="buy-now"?l.remove():(l.hasAttribute("aria-label")&&l.removeAttribute("aria-label"),l.setAttribute("data-analytics-id","buy-now"),l.hasAttribute("data-modal")&&l.setAttribute("data-modal","crm"),l.textContent=m),d=!0}else l.remove()});let a=t.content.querySelector('a[data-analytics-id="buy-now"]')||r;return a&&d&&(a.className.trim()&&a.className.match(ue)?.forEach(l=>{a.classList.remove(l)}),a.classList.add("button","con-button","blue")),t.innerHTML}function me(t,o){if(!t)return o;let e=t.closest(it);if(!(e||t.hasAttribute("fragment-id")))return o;if(o[pt]=!0,o.wrapClauses=!0,Et(e?.aemFragment?.data?.priceLiterals,o),gt(t,o),e&&t.dataset.template===dt&&(o.displayPlanType=e.aemFragment?.data?.settings?.displayPlanType??!1),!o.promotionCode){let n=t.dataset.promotionCode??(e?U(e):null);n&&(o.promotionCode=n)}At(e,o)}function he(t,o){if(o.promotionCode||!t)return;let e=t.closest(it),r=t.dataset.promotionCode??(e?U(e):null);r&&(o.promotionCode=r)}function fe(t){Tt(t,me,he)}var Ee=`
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
`;if(!document.querySelector("style[data-mas-field]")){let t=document.createElement("style");t.setAttribute("data-mas-field",""),t.textContent=Ee,document.head.append(t)}function Nt(t,o=globalThis.location){return typeof t!="string"||!t?"":`<picture>${St(t,o)}</picture>`}var w,O,P,x,A,I,v,s,$,J,tt,Mt,F,Ot,Pt,et,rt,It,nt,ot,vt,M,Ht,Dt,y,Q=class extends HTMLElement{constructor(){super(...arguments);b(this,s);b(this,w,null);b(this,O,!1);b(this,P,!1);b(this,x,null);Y(this,"settings",null);b(this,A,null);Y(this,"compatVersion");b(this,I,e=>{e.target===this.aemFragment&&_(this,P,!0)});b(this,v,async e=>{e.target===this.aemFragment&&(_(this,x,e.detail?.fields||null),this.settings=e.detail?.settings??null,_(this,O,!0),await p(this,s,rt).call(this),this.dispatchEvent(new CustomEvent(lt,{bubbles:!0,composed:!0,detail:e.detail})))})}get contextPromotionCode(){return this.getAttribute("data-promotion-code")}static get observedAttributes(){return["field"]}attributeChangedCallback(e,r,n){e==="field"&&(_(this,w,n),p(this,s,rt).call(this))}connectedCallback(){this.addEventListener(C,h(this,v)),this.addEventListener(N,h(this,I)),p(this,s,$).call(this),this.aemFragment?.setAttribute("hidden",""),fe(mt())}disconnectedCallback(){this.removeEventListener(C,h(this,v)),this.removeEventListener(N,h(this,I))}checkReady(){return h(this,O)?Promise.resolve(!0):h(this,P)?Promise.resolve(!1):new Promise(e=>{let r=n=>{n.target===this.aemFragment&&(this.removeEventListener(C,r),this.removeEventListener(N,r),e(n.type===C))};this.addEventListener(C,r),this.addEventListener(N,r)})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return ft(this)}};w=new WeakMap,O=new WeakMap,P=new WeakMap,x=new WeakMap,A=new WeakMap,I=new WeakMap,v=new WeakMap,s=new WeakSet,$=function(e=!1){if(h(this,A)?.isConnected&&h(this,A).matches('[data-role="mas-field-content"]')&&(!e||h(this,A).tagName==="SPAN"))return h(this,A);let r=this.querySelector(':scope > [data-role="mas-field-content"]');if(r&&(!e||r.tagName==="SPAN"))return _(this,A,r),r;e&&r?.remove();let n=document.createElement("span");return n.setAttribute("data-role","mas-field-content"),this.append(n),_(this,A,n),n},J=function(){this.querySelector(':scope > [data-role="mas-field-content"]')?.remove(),_(this,A,null)},tt=function(e){let r=document.createElement("template");r.innerHTML=e;let n=r.content.querySelector("picture");if(!n)return;n.innerHTML=Ct(n.innerHTML),n.setAttribute("data-role","mas-field-content");let i=this.querySelector(':scope > [data-role="mas-field-content"]');i?i.replaceWith(n):this.append(n),_(this,A,n),p(this,s,M).call(this,n)},Mt=function(e){let r=p(this,s,y).call(this,p(this,s,F).call(this,h(this,x).backgroundImageAltText));return`<img loading="lazy" ${typeof r=="string"&&r?`alt="${pe(r)}"`:'role="none"'} src="${Z(e)}">`},F=function(e){return e&&typeof e=="object"&&"value"in e?e.value:e},Ot=function(e){let r=e?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let n=e?.match(/^(.+)\[(.+)\]$/);return n?{fieldName:n[1],index:n[2]}:{fieldName:e,index:null}},Pt=function(e,r,n){if(typeof e!="string")return null;let i=document.createElement("template");i.innerHTML=e;let c;if(!isNaN(r)){let l=parseInt(r,10);c=[...i.content.querySelectorAll("a")][l-1]}if(c||(c=i.content.querySelector(`a[data-key="${r}"]`)),!c)return null;if(n)return c.removeAttribute("class"),c.outerHTML;let d=c.outerHTML,a=c.parentElement;for(;a?.matches("strong, em");){let l=a.tagName.toLowerCase();d=`<${l}>${d}</${l}>`,a=a.parentElement}return d},et=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let e=this.aemFragment.data;e&&(e.variationId&&this.setAttribute("variation-id",e.variationId),e.maskId&&this.setAttribute("mask-id",e.maskId),e.promoProject&&this.setAttribute("data-promotion-project",e.promoProject),e.promoVariationProject&&this.setAttribute("data-promotion-variation-project",e.promoVariationProject),this.compatVersion=e.fields?.compatVersion,e.fields?.promoCode&&this.setAttribute("data-promotion-code",e.fields.promoCode))},rt=async function(){if(!h(this,x)||!h(this,w))return;this.hidden=!1;let{fieldName:e,index:r}=p(this,s,Ot).call(this,h(this,w)),n=e==="ctas"&&r!==null&&!!(this.closest("strong, em, .feds-cta-wrapper")||this.querySelector(":scope > strong, :scope > em"));if(r!==null&&isNaN(r)){let a=`${e.replace(/s$/,"")}Labels`,l=h(this,x)[a];if(l!==void 0){let f=(Array.isArray(l)?l:[l]).indexOf(r);if(f===-1){this.hidden=!0;return}let u=h(this,x)[e],g=Array.isArray(u)?u:u?[u]:[],L=p(this,s,F).call(this,g[f]);if(!L){this.hidden=!0;return}if(e==="ctas"&&this.settings?.hideTrialCTAs){let E=document.createElement("template");if(E.innerHTML=L,L=await Rt(E,!0,this),!L.trim()){this.hidden=!0;return}}p(this,s,et).call(this);let T=p(this,s,$).call(this,!0);T.innerHTML=p(this,s,y).call(this,L)??"",p(this,s,nt).call(this,T),p(this,s,ot).call(this,T),p(this,s,M).call(this,T);return}}let i=p(this,s,F).call(this,h(this,x)[e]);if(i===void 0){this.hidden=!0;return}if(p(this,s,et).call(this),r===null&&(e==="image"||e==="backgroundImage"||e==="backgrounds")){let a=p(this,s,y).call(this,i);if(typeof a=="string"&&a){let l=e==="image"||e==="backgrounds"?a:p(this,s,Mt).call(this,a);p(this,s,tt).call(this,Nt(l))}else p(this,s,J).call(this),this.hidden=!0;return}if(e==="backgrounds"&&r!==null){let a=p(this,s,y).call(this,yt(i,r)),l=typeof a=="string"&&a?Lt(a):"";l?p(this,s,tt).call(this,Nt(l)):(p(this,s,J).call(this),this.hidden=!0);return}let c=p(this,s,$).call(this,!0),d;if(r!==null){if(d=p(this,s,Pt).call(this,i,r,n),d===null){this.hidden=!0;return}}else d=p(this,s,y).call(this,i);if(typeof d=="string"){if(e==="ctas"&&this.settings?.hideTrialCTAs){let a=document.createElement("template");if(a.innerHTML=d,d=await Rt(a,r!==null,this),!d.trim()){this.hidden=!0;return}}if(e==="ctas"&&!n){let a=p(this,s,Dt).call(this,d,r!==null);if(a){p(this,s,Ht).call(this,a),c.replaceChildren(a),p(this,s,M).call(this,c);return}}c.innerHTML=d,p(this,s,nt).call(this,c),p(this,s,ot).call(this,c),p(this,s,M).call(this,c);return}if(d==null){this.hidden=!0;return}c.textContent=String(d)},It=function(e,r){return customElements.get("checkout-link")?.createCheckoutLink(e,r)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${r}</span>`,i})()},nt=function(e){for(let r of e.querySelectorAll("a[data-wcs-osi]:not([is])")){let n=p(this,s,It).call(this,r.dataset,r.innerHTML);for(let{name:i,value:c}of r.attributes)["is","href"].includes(i)||n.setAttribute(i,c);r.replaceWith(n)}},ot=function(e){let r=e.querySelectorAll(".icon-button[data-tooltip]");for(let n of r){if(n.dataset.tooltipWired)continue;n.dataset.tooltipWired="1",n.querySelector("svg")||n.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),n.hasAttribute("tabindex")||n.setAttribute("tabindex","0"),n.hasAttribute("role")||n.setAttribute("role","button"),n.hasAttribute("aria-label")||n.setAttribute("aria-label",n.dataset.tooltip);let i=["top","bottom","left","right"],c=[...n.classList].find(m=>i.includes(m)),d=c||"top";c||n.classList.add(d),n.dataset.originalPosition=d,n.classList.add("hide-tooltip");let a=()=>{n.classList.remove("hide-tooltip"),p(this,s,vt).call(this,n)},l=()=>n.classList.add("hide-tooltip");n.addEventListener("mouseenter",a),n.addEventListener("focus",a),n.addEventListener("mouseleave",l),n.addEventListener("blur",l),n.addEventListener("keydown",m=>{m.key==="Escape"&&l()})}},vt=function(e){let r=["top","bottom","right","left"],n=window.innerWidth,i=12,c=document.querySelector("header")?.getBoundingClientRect().height||0,d=window.getComputedStyle(e,"::before"),a=B=>parseFloat(B)||0,l=a(d.width)+a(d.paddingLeft)+a(d.paddingRight),m=a(d.height)+a(d.paddingTop)+a(d.paddingBottom),f=e.getBoundingClientRect(),u=e.dataset.originalPosition||"top",g=r.find(B=>e.classList.contains(B)),T=u==="top"||u==="bottom"?l/2:l,Ut=u==="top"?m+(u==="top"?i:0):m/2,H=f.top-Ut<c,V=f.bottom+(u==="bottom"?m+i:0)>window.innerHeight,R=f.right+T+i>n,D=f.left-T-i<0,G=f.left+l/2+i>n,q=f.left-l/2-i<0;if(u!==g&&!(R||D||H||V||G||q)){e.classList.remove(...r),e.classList.add(u);return}let S=u;R&&G?S="left":D&&q?S="right":R&&H||D&&H?S=G&&"left"||q&&"right"||"bottom":R!==D&&!V?S=R?"left":"right":H&&["top","left","right"].includes(u)?S="bottom":V&&["bottom","left","right"].includes(u)&&(S="top"),g!==S&&(e.classList.remove(...r),e.classList.add(S))},M=function(e){let r=e.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let n=(i,c)=>{if(c!=null)for(let d of r)d.hasAttribute(i)||d.setAttribute(i,c)};for(let i of de)n(i,this.getAttribute(i));n("data-promotion-code",U(this))},Ht=function(e){let r=this.closest(".section");if(!r)return;let n=this.parentElement;for(;n.matches("strong, em")&&n.childElementCount===1&&n.firstElementChild===this&&n.textContent.trim()===this.textContent.trim();)n.replaceWith(...n.childNodes),n=this.parentElement;let i=this;for(;i.parentElement!==r;)i=i.parentElement;let c=/^button-(s|m|l|xl|xxl)$/,d=[...i.querySelectorAll(".con-button")].find(u=>!this.contains(u)&&[...u.classList].some(g=>c.test(g))),a,l=[];if(d)a=[...d.classList].find(u=>c.test(u)),l=[...d.classList].filter(u=>u.startsWith("button-")&&!c.test(u));else{let u=[...i.classList].find(g=>/^(s|m|l|xl|xxl)-button$/.test(g));u?a=`button-${u.split("-")[0]}`:i.classList.contains("hero-marquee")?(a="button-xl",l=["button-justified-mobile"]):i.matches(".accordion, .media")||(a=i.matches(".large, .xlarge")?"button-xl":"button-l")}for(let u of this.merchLink?.matchAll(/(?:&|#)_button-([a-zA-Z-]+)/g)??[])l.push(u[1]);let m=e.matches(".con-button")?[e]:e.querySelectorAll(".con-button");for(let u of m)a&&![...u.classList].some(g=>c.test(g))&&u.classList.add(a),u.classList.add(...l);let f=this.closest("p");f&&(m.length||[...f.childNodes].every(u=>u===this||u.nodeType===Node.TEXT_NODE&&!u.textContent.trim()))&&f.classList.add("action-area")},Dt=function(e,r=!1){let i=[...new DOMParser().parseFromString(e,"text/html").body.querySelectorAll("a")];if(!i.length)return null;if(r)return K(i[0]);let c=document.createElement("div");return c.setAttribute("slot","footer"),c.classList.add("action-area"),c.append(...i.map(d=>K(d))),c},y=function(e){if(typeof e!="string")return e;let r=e.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return e;let i=r.slice(3,-4);return i.includes("<p>")?e:i};customElements.define(it,Q);export{ue as CHECKOUT_STYLE_PATTERN,he as checkoutOptionsProvider,me as priceOptionsProvider,Nt as renderImageMarkup,Rt as stripTrialCtas};
