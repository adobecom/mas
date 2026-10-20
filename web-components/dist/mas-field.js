var vt=Object.defineProperty;var nt=e=>{throw TypeError(e)};var Dt=(e,n,t)=>n in e?vt(e,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[n]=t;var B=(e,n,t)=>Dt(e,typeof n!="symbol"?n+"":n,t),W=(e,n,t)=>n.has(e)||nt("Cannot "+t);var p=(e,n,t)=>(W(e,n,"read from private field"),t?t.call(e):n.get(e)),T=(e,n,t)=>n.has(e)?nt("Cannot add the same private member more than once"):n instanceof WeakSet?n.add(e):n.set(e,t),_=(e,n,t,r)=>(W(e,n,"write to private field"),r?r.call(e,t):n.set(e,t),t),d=(e,n,t)=>(W(e,n,"access private method"),t);var fe=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),he=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var ot=2e4;var Ht='span[is="inline-price"][data-wcs-osi]',Ut='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var kt='a[is="upt-link"]',Ee=`${Ht},${Ut},${kt}`,it=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var C="aem:load",y="aem:error",at="mas:ready";var ge=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Ae=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var st="legal",ct="plan-type-text",lt="mas-ff-defaults";var Ft="mas-commerce-service";function dt(){return document.getElementsByTagName(Ft)?.[0]}function pt(e){let n=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&n?.isInlinePrice&&n?.dataset?.template==="price"}var Yt=[".","!","?"],$t=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=$t,document.head.append(e)}var Vt="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function Gt(e){let n=e.closest(Vt)??e.parentNode,t=document.createRange();return t.setStart(n,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function ut(e){let n=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(n.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??n[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function Bt(e){return!e||Yt.includes(e)?"upper":"lower"}function Wt(e){return Bt(Gt(e))}function q(e,n){if(e.dataset.placeholder!==ct)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(n.wcsOsi=t,n.planTypeCase=Wt(e))}function zt(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")}function H(e){return zt(e)?e.contextPromotionCode:null}function mt(e,n){e&&(n.literals??(n.literals={}),Object.assign(n.literals,e))}function ft(e,n){pt(e)&&(n.displayPerUnit=!1,n.displayTax=!1)}function ht(e,n){n.displayAnnual===void 0&&typeof e?.settings?.displayAnnual=="boolean"&&(n.displayAnnual=e.settings.displayAnnual,e.settings.displayAnnual&&e.setAttribute("annualized",""))}function Et(e,n,t){!e?.providers||e.providers.has(n)||(e.providers.price(n),e.providers.checkout(t),e.providers.has(q)||e.providers.price(q))}function Kt(e,n){if(typeof e!="string"||!e)return null;let t;try{t=new URL(e,n)}catch{return null}return t.hostname.endsWith(".aem.page")?`${n}${t.pathname}${t.search}`:null}function K(e){if(typeof e!="string"||!e)return"";try{return new URL(e).href}catch{return""}}function jt(e){if(typeof e!="string"||!e)return!1;try{return new URL(e).hostname.endsWith(".aem.page")}catch{return!1}}var Xt={png:{type:"image/png",format:"png"},jpg:{type:"image/jpeg",format:"jpg"},jpeg:{type:"image/jpeg",format:"jpg"},webp:{type:"image/webp",format:"webp"},gif:{type:"image/gif",format:"gif"}},z={width:2e3,media:"(min-width: 600px)"},Zt=750;function U(e,n,t){let r=new URL(e);return r.searchParams.set("width",n),r.searchParams.set("format",t),r.searchParams.set("optimize","medium"),r.href}function gt(e,n){return n?.width?Math.min(e,n.width):e}function Qt(e){let n=new URL(e).pathname.split(".").pop().toLowerCase();return Xt[n]??null}function At(e){return String(e??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function Tt(e){return!e?.width||!e?.height?"":` width="${e.width}" height="${e.height}"`}function _t(e,n,t=""){if(!jt(e))return"";let r=K(e),o=Qt(r);if(!o)return`<img loading="lazy" alt="${At(t)}"${Tt(n)} src="${r}">`;let{type:i,format:l}=o,s=gt(z.width,n),c=gt(Zt,n);return[`<source type="image/webp" srcset="${U(r,s,"webply")}" media="${z.media}">`,`<source type="image/webp" srcset="${U(r,c,"webply")}">`,`<source type="${i}" srcset="${U(r,s,l)}" media="${z.media}">`,`<img loading="lazy" alt="${At(t)}" src="${U(r,c,l)}"${Tt(n)}>`].join("")}function Jt(e){return e?.hostname==="www.adobe.com"||e?.hostname==="adobe.com"}function bt(e,n=globalThis.location){if(typeof e!="string"||!e||!Jt(n))return e;let t=document.createElement("template");return t.innerHTML=`<picture>${e}</picture>`,t.content.querySelectorAll("source[srcset], img[src]").forEach(r=>{let o=r.tagName==="IMG"?"src":"srcset",i=Kt(r.getAttribute(o),n.origin);i&&r.setAttribute(o,i)}),t.content.querySelector("picture").innerHTML}var te=new Set(["SOURCE","IMG"]),ee=new Set(["src","srcset","media","type","alt","role","loading","data-mobile-set","width","height"]);function xt(e){if(typeof e!="string"||!e)return"";let n=document.createElement("template"),t=/^\s*<picture[\s>]/i.test(e);n.innerHTML=t?e:`<picture>${e}</picture>`;let r=n.content.querySelector("picture");return r?(r.querySelectorAll("*").forEach(o=>{if(!te.has(o.tagName)){o.remove();return}[...o.attributes].forEach(i=>{ee.has(i.name.toLowerCase())||o.removeAttribute(i.name)})}),r.innerHTML):""}var re="(min-width: 1200px)",ne="(min-width: 600px)";function St(e,n){if(!e)return"";let t=new DOMParser().parseFromString(`<picture>${e}</picture>`,"text/html");if(n==="desktop")return t.querySelector(`source[media="${re}"]`)?.getAttribute("srcset")??"";if(n==="tablet")return t.querySelector(`source[media="${ne}"]`)?.getAttribute("srcset")??"";if(n==="mobile"){let r=t.querySelector("img");return r?.hasAttribute("data-mobile-set")?r.getAttribute("src")??"":""}return""}var rt="mas-field",oe=/(accent|primary|secondary)(-(outline|link))?/,ie=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function ae(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}async function Ct(e,n,t){let r=e.content.querySelector('a[data-analytics-id="buy-now"]'),i=[...e.content.querySelectorAll("a")].filter(c=>it.has(c.dataset.analyticsId));if(i.length===0)return e.innerHTML;if(n&&!r){let c=t.getAttribute("field"),u=[],f=t.parentElement.querySelectorAll("mas-field").length>1?t.parentElement.querySelectorAll('mas-field[field^="ctas"]'):t.parentElement.parentElement.querySelectorAll('mas-field[field^="ctas"]');f.forEach(async E=>{E.getAttribute("field")!==c&&u.push(E.checkReady())});let h=Promise.all(u),m,A=new Promise(E=>{m=setTimeout(E,ot)});await Promise.race([h,A]),clearTimeout(m),f.forEach(E=>{E.getAttribute("field")!==c&&(r??(r=E.querySelector('a[data-analytics-id="buy-now"]')))})}let l=!1;i.forEach(c=>{if(c.hasAttribute("data-replaced-osi")){l=!0;let u=t.aemFragment?.data?.priceLiterals?.buyNow;r||!u?c.remove():(c.setAttribute("data-analytics-id","buy-now"),c.hasAttribute("data-modal")&&c.setAttribute("data-modal","crm"),c.textContent=u)}else c.remove()});let s=e.content.querySelector('a[data-analytics-id="buy-now"]')||r;return s&&l&&s.classList.add("blue"),e.innerHTML}function se(e,n){if(!e)return n;let t=e.closest(rt);if(!(t||e.hasAttribute("fragment-id")))return n;if(n[lt]=!0,n.wrapClauses=!0,mt(t?.aemFragment?.data?.priceLiterals,n),ft(e,n),t&&e.dataset.template===st&&(n.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!n.promotionCode){let o=e.dataset.promotionCode??(t?H(t):null);o&&(n.promotionCode=o)}ht(t,n)}function ce(e,n){if(n.promotionCode||!e)return;let t=e.closest(rt),r=e.dataset.promotionCode??(t?H(t):null);r&&(n.promotionCode=r)}function le(e){Et(e,se,ce)}var de=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=de,document.head.append(e)}function Lt(e,n=globalThis.location){return typeof e!="string"||!e?"":`<picture>${bt(e,n)}</picture>`}var S,M,P,b,g,O,I,a,k,X,Z,Rt,F,wt,yt,Q,J,Nt,tt,et,Mt,N,Pt,Ot,L,j=class extends HTMLElement{constructor(){super(...arguments);T(this,a);T(this,S,null);T(this,M,!1);T(this,P,!1);T(this,b,null);B(this,"settings",null);T(this,g,null);B(this,"compatVersion");T(this,O,t=>{t.target===this.aemFragment&&_(this,P,!0)});T(this,I,async t=>{t.target===this.aemFragment&&(_(this,b,t.detail?.fields||null),this.settings=t.detail?.settings??null,_(this,M,!0),await d(this,a,J).call(this),this.dispatchEvent(new CustomEvent(at,{bubbles:!0,composed:!0,detail:t.detail})))})}get contextPromotionCode(){return this.getAttribute("data-promotion-code")}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,o){t==="field"&&(_(this,S,o),d(this,a,J).call(this))}connectedCallback(){this.addEventListener(C,p(this,I)),this.addEventListener(y,p(this,O)),d(this,a,k).call(this),this.aemFragment?.setAttribute("hidden",""),le(dt())}disconnectedCallback(){this.removeEventListener(C,p(this,I)),this.removeEventListener(y,p(this,O))}checkReady(){return p(this,M)?Promise.resolve(!0):p(this,P)?Promise.resolve(!1):new Promise(t=>{let r=o=>{o.target===this.aemFragment&&(this.removeEventListener(C,r),this.removeEventListener(y,r),t(o.type===C))};this.addEventListener(C,r),this.addEventListener(y,r)})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return ut(this)}};S=new WeakMap,M=new WeakMap,P=new WeakMap,b=new WeakMap,g=new WeakMap,O=new WeakMap,I=new WeakMap,a=new WeakSet,k=function(t=!1){if(p(this,g)?.isConnected&&p(this,g).matches('[data-role="mas-field-content"]')&&(!t||p(this,g).tagName==="SPAN"))return p(this,g);let r=this.querySelector(':scope > [data-role="mas-field-content"]');if(r&&(!t||r.tagName==="SPAN"))return _(this,g,r),r;t&&r?.remove();let o=document.createElement("span");return o.setAttribute("data-role","mas-field-content"),this.append(o),_(this,g,o),o},X=function(){this.querySelector(':scope > [data-role="mas-field-content"]')?.remove(),_(this,g,null)},Z=function(t){let r=document.createElement("template");r.innerHTML=t;let o=r.content.querySelector("picture");if(!o)return;o.innerHTML=xt(o.innerHTML),o.setAttribute("data-role","mas-field-content");let i=this.querySelector(':scope > [data-role="mas-field-content"]');i?i.replaceWith(o):this.append(o),_(this,g,o),d(this,a,N).call(this,o)},Rt=function(t){let r=d(this,a,L).call(this,d(this,a,F).call(this,p(this,b).backgroundImageAltText));return`<img loading="lazy" ${typeof r=="string"&&r?`alt="${ae(r)}"`:'role="none"'} src="${K(t)}">`},F=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},wt=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let o=t?.match(/^(.+)\[(.+)\]$/);return o?{fieldName:o[1],index:o[2]}:{fieldName:t,index:null}},yt=function(t,r){if(typeof t!="string")return null;let o=document.createElement("template");o.innerHTML=t;let i;if(!isNaN(r)){let l=parseInt(r,10);i=[...o.content.querySelectorAll("a")][l-1]}return i||(i=o.content.querySelector(`a[data-key="${r}"]`)),i?(i.removeAttribute("class"),i.outerHTML):null},Q=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},J=async function(){if(!p(this,b)||!p(this,S))return;this.hidden=!1;let{fieldName:t,index:r}=d(this,a,wt).call(this,p(this,S));if(r!==null&&isNaN(r)){let s=`${t.replace(/s$/,"")}Labels`,c=p(this,b)[s];if(c!==void 0){let f=(Array.isArray(c)?c:[c]).indexOf(r);if(f===-1){this.hidden=!0;return}let h=p(this,b)[t],m=Array.isArray(h)?h:h?[h]:[],A=d(this,a,F).call(this,m[f]);if(!A){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs){let R=document.createElement("template");if(R.innerHTML=A,A=await Ct(R,!0,this),!A){this.hidden=!0;return}}d(this,a,Q).call(this);let E=d(this,a,k).call(this,!0);E.innerHTML=d(this,a,L).call(this,A)??"",d(this,a,tt).call(this,E),d(this,a,et).call(this,E),d(this,a,N).call(this,E);return}}let o=d(this,a,F).call(this,p(this,b)[t]);if(o===void 0){this.hidden=!0;return}if(d(this,a,Q).call(this),r===null&&(t==="image"||t==="backgroundImage"||t==="backgrounds")){let s=d(this,a,L).call(this,o);if(typeof s=="string"&&s){let c=t==="image"||t==="backgrounds"?s:d(this,a,Rt).call(this,s);d(this,a,Z).call(this,Lt(c))}else d(this,a,X).call(this),this.hidden=!0;return}if(t==="backgrounds"&&r!==null){let s=d(this,a,L).call(this,St(o,r)),c=typeof s=="string"&&s?_t(s):"";c?d(this,a,Z).call(this,Lt(c)):(d(this,a,X).call(this),this.hidden=!0);return}let i=d(this,a,k).call(this,!0),l;if(r!==null){if(l=d(this,a,yt).call(this,o,r),l===null){this.hidden=!0;return}}else l=d(this,a,L).call(this,o);if(typeof l=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs){let s=document.createElement("template");if(s.innerHTML=l,l=await Ct(s,r!==null,this),!l){this.hidden=!0;return}}if(p(this,S)==="ctas"){let s=d(this,a,Ot).call(this,l);if(s){i.replaceChildren(s),d(this,a,N).call(this,i);return}}i.innerHTML=l,d(this,a,tt).call(this,i),d(this,a,et).call(this,i),d(this,a,N).call(this,i);return}if(l==null){this.hidden=!0;return}i.textContent=String(l)},Nt=function(t,r){return customElements.get("checkout-link")?.createCheckoutLink(t,r)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${r}</span>`,i})()},tt=function(t){for(let r of t.querySelectorAll("a[data-wcs-osi]:not([is])")){let o=d(this,a,Nt).call(this,r.dataset,r.innerHTML);for(let{name:i,value:l}of r.attributes)["is","href"].includes(i)||o.setAttribute(i,l);r.replaceWith(o)}},et=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let o of r){if(o.dataset.tooltipWired)continue;o.dataset.tooltipWired="1",o.querySelector("svg")||o.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),o.hasAttribute("tabindex")||o.setAttribute("tabindex","0"),o.hasAttribute("role")||o.setAttribute("role","button"),o.hasAttribute("aria-label")||o.setAttribute("aria-label",o.dataset.tooltip);let i=["top","bottom","left","right"],l=[...o.classList].find(f=>i.includes(f)),s=l||"top";l||o.classList.add(s),o.dataset.originalPosition=s,o.classList.add("hide-tooltip");let c=()=>{o.classList.remove("hide-tooltip"),d(this,a,Mt).call(this,o)},u=()=>o.classList.add("hide-tooltip");o.addEventListener("mouseenter",c),o.addEventListener("focus",c),o.addEventListener("mouseleave",u),o.addEventListener("blur",u),o.addEventListener("keydown",f=>{f.key==="Escape"&&u()})}},Mt=function(t){let r=["top","bottom","right","left"],o=window.innerWidth,i=12,l=document.querySelector("header")?.getBoundingClientRect().height||0,s=window.getComputedStyle(t,"::before"),c=G=>parseFloat(G)||0,u=c(s.width)+c(s.paddingLeft)+c(s.paddingRight),f=c(s.height)+c(s.paddingTop)+c(s.paddingBottom),h=t.getBoundingClientRect(),m=t.dataset.originalPosition||"top",A=r.find(G=>t.classList.contains(G)),R=m==="top"||m==="bottom"?u/2:u,It=m==="top"?f+(m==="top"?i:0):f/2,v=h.top-It<l,Y=h.bottom+(m==="bottom"?f+i:0)>window.innerHeight,w=h.right+R+i>o,D=h.left-R-i<0,$=h.left+u/2+i>o,V=h.left-u/2-i<0;if(m!==A&&!(w||D||v||Y||$||V)){t.classList.remove(...r),t.classList.add(m);return}let x=m;w&&$?x="left":D&&V?x="right":w&&v||D&&v?x=$&&"left"||V&&"right"||"bottom":w!==D&&!Y?x=w?"left":"right":v&&["top","left","right"].includes(m)?x="bottom":Y&&["bottom","left","right"].includes(m)&&(x="top"),A!==x&&(t.classList.remove(...r),t.classList.add(x))},N=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let o=(i,l)=>{if(l!=null)for(let s of r)s.hasAttribute(i)||s.setAttribute(i,l)};for(let i of ie)o(i,this.getAttribute(i));o("data-promotion-code",H(this))},Pt=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let i=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let s=document.createElement("a",{is:"checkout-link"});return s.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,s})();for(let{name:s,value:c}of t.attributes)["class","is","href"].includes(s)||i.setAttribute(s,c);if(i.firstElementChild?.classList.add("spectrum-Button-label"),t.className){let s=oe.exec(t.className)?.[0]??"accent",c=s.startsWith("accent");return s.includes("-link")||(i.classList.add("button","con-button"),c?i.classList.add("blue"):s.startsWith("primary")&&!s.includes("-outline")&&i.classList.add("fill")),i}let l=t.parentElement?.tagName;if(l==="STRONG"||l==="EM"){let s=document.createElement(l.toLowerCase());return s.append(i),s}return i},Ot=function(t){let o=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!o.length)return null;let i=document.createElement("div");return i.setAttribute("slot","footer"),i.append(...o.map(l=>d(this,a,Pt).call(this,l))),i},L=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let i=r.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(rt,j);export{ce as checkoutOptionsProvider,se as priceOptionsProvider,Lt as renderImageMarkup,Ct as stripTrialCtas};
