var vt=Object.defineProperty;var nt=e=>{throw TypeError(e)};var Dt=(e,n,t)=>n in e?vt(e,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[n]=t;var B=(e,n,t)=>Dt(e,typeof n!="symbol"?n+"":n,t),W=(e,n,t)=>n.has(e)||nt("Cannot "+t);var u=(e,n,t)=>(W(e,n,"read from private field"),t?t.call(e):n.get(e)),A=(e,n,t)=>n.has(e)?nt("Cannot add the same private member more than once"):n instanceof WeakSet?n.add(e):n.set(e,t),T=(e,n,t,r)=>(W(e,n,"write to private field"),r?r.call(e,t):n.set(e,t),t),l=(e,n,t)=>(W(e,n,"access private method"),t);var fe=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),he=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var ot=2e4;var Ht='span[is="inline-price"][data-wcs-osi]',Ut='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var kt='a[is="upt-link"]',Ee=`${Ht},${Ut},${kt}`,it=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var S="aem:load",y="aem:error",at="mas:ready";var ge=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Ae=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var st="legal",ct="plan-type-text",lt="mas-ff-defaults";var Ft="mas-commerce-service";function dt(){return document.getElementsByTagName(Ft)?.[0]}function ut(e){let n=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&n?.isInlinePrice&&n?.dataset?.template==="price"}var Yt=[".","!","?"],$t=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=$t,document.head.append(e)}var Vt="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function Gt(e){let n=e.closest(Vt)??e.parentNode,t=document.createRange();return t.setStart(n,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function pt(e){let n=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(n.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??n[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function Bt(e){return!e||Yt.includes(e)?"upper":"lower"}function Wt(e){return Bt(Gt(e))}function q(e,n){if(e.dataset.placeholder!==ct)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(n.wcsOsi=t,n.planTypeCase=Wt(e))}function zt(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")}function H(e){return zt(e)?e.contextPromotionCode:null}function mt(e,n){e&&(n.literals??(n.literals={}),Object.assign(n.literals,e))}function ft(e,n){ut(e)&&(n.displayPerUnit=!1,n.displayTax=!1)}function ht(e,n){n.displayAnnual===void 0&&typeof e?.settings?.displayAnnual=="boolean"&&(n.displayAnnual=e.settings.displayAnnual,e.settings.displayAnnual&&e.setAttribute("annualized",""))}function Et(e,n,t){!e?.providers||e.providers.has(n)||(e.providers.price(n),e.providers.checkout(t),e.providers.has(q)||e.providers.price(q))}function Kt(e,n){if(typeof e!="string"||!e)return null;let t;try{t=new URL(e,n)}catch{return null}return t.hostname.endsWith(".aem.page")?`${n}${t.pathname}${t.search}`:null}function K(e){if(typeof e!="string"||!e)return"";try{return new URL(e).href}catch{return""}}function jt(e){if(typeof e!="string"||!e)return!1;try{return new URL(e).hostname.endsWith(".aem.page")}catch{return!1}}var Xt={png:{type:"image/png",format:"png"},jpg:{type:"image/jpeg",format:"jpg"},jpeg:{type:"image/jpeg",format:"jpg"},webp:{type:"image/webp",format:"webp"},gif:{type:"image/gif",format:"gif"}},z={width:2e3,media:"(min-width: 600px)"},Zt=750;function U(e,n,t){let r=new URL(e);return r.searchParams.set("width",n),r.searchParams.set("format",t),r.searchParams.set("optimize","medium"),r.href}function gt(e,n){return n?.width?Math.min(e,n.width):e}function Qt(e){let n=new URL(e).pathname.split(".").pop().toLowerCase();return Xt[n]??null}function At(e){return String(e??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function Tt(e){return!e?.width||!e?.height?"":` width="${e.width}" height="${e.height}"`}function _t(e,n,t=""){if(!jt(e))return"";let r=K(e),o=Qt(r);if(!o)return`<img loading="lazy" alt="${At(t)}"${Tt(n)} src="${r}">`;let{type:i,format:c}=o,a=gt(z.width,n),d=gt(Zt,n);return[`<source type="image/webp" srcset="${U(r,a,"webply")}" media="${z.media}">`,`<source type="image/webp" srcset="${U(r,d,"webply")}">`,`<source type="${i}" srcset="${U(r,a,c)}" media="${z.media}">`,`<img loading="lazy" alt="${At(t)}" src="${U(r,d,c)}"${Tt(n)}>`].join("")}function Jt(e){return e?.hostname==="www.adobe.com"||e?.hostname==="adobe.com"}function bt(e,n=globalThis.location){if(typeof e!="string"||!e||!Jt(n))return e;let t=document.createElement("template");return t.innerHTML=`<picture>${e}</picture>`,t.content.querySelectorAll("source[srcset], img[src]").forEach(r=>{let o=r.tagName==="IMG"?"src":"srcset",i=Kt(r.getAttribute(o),n.origin);i&&r.setAttribute(o,i)}),t.content.querySelector("picture").innerHTML}var te=new Set(["SOURCE","IMG"]),ee=new Set(["src","srcset","media","type","alt","role","loading","data-mobile-set","width","height"]);function xt(e){if(typeof e!="string"||!e)return"";let n=document.createElement("template"),t=/^\s*<picture[\s>]/i.test(e);n.innerHTML=t?e:`<picture>${e}</picture>`;let r=n.content.querySelector("picture");return r?(r.querySelectorAll("*").forEach(o=>{if(!te.has(o.tagName)){o.remove();return}[...o.attributes].forEach(i=>{ee.has(i.name.toLowerCase())||o.removeAttribute(i.name)})}),r.innerHTML):""}var re="(min-width: 1200px)",ne="(min-width: 600px)";function St(e,n){if(!e)return"";let t=new DOMParser().parseFromString(`<picture>${e}</picture>`,"text/html");if(n==="desktop")return t.querySelector(`source[media="${re}"]`)?.getAttribute("srcset")??"";if(n==="tablet")return t.querySelector(`source[media="${ne}"]`)?.getAttribute("srcset")??"";if(n==="mobile"){let r=t.querySelector("img");return r?.hasAttribute("data-mobile-set")?r.getAttribute("src")??"":""}return""}var rt="mas-field",oe=/(accent|primary|secondary)(-(outline|link))?/,ie=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function ae(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}async function Lt(e,n,t){let r=e.content.querySelector('a[data-analytics-id="buy-now"]'),i=[...e.content.querySelectorAll("a")].filter(a=>it.has(a.dataset.analyticsId));if(i.length===0)return e.innerHTML;if(n&&!r){let a=t.getAttribute("field"),d=[],h=t.parentElement.querySelectorAll("mas-field").length>1?t.parentElement.querySelectorAll('mas-field[field^="ctas"]'):t.parentElement.parentElement.querySelectorAll('mas-field[field^="ctas"]');h.forEach(async p=>{p.getAttribute("field")!==a&&d.push(p.checkReady())});let E=Promise.all(d),m,f=new Promise(p=>{m=setTimeout(p,ot)});await Promise.race([E,f]),clearTimeout(m),h.forEach(p=>{p.getAttribute("field")!==a&&(r??(r=p.querySelector('a[data-analytics-id="buy-now"]')))})}i.forEach(a=>{if(a.hasAttribute("data-replaced-osi")){let d=t.aemFragment?.data?.priceLiterals?.buyNow;r||!d||d==="buy-now"?a.remove():(a.hasAttribute("aria-label")&&a.removeAttribute("aria-label"),a.setAttribute("data-analytics-id","buy-now"),a.hasAttribute("data-modal")&&a.setAttribute("data-modal","crm"),a.textContent=d)}else a.remove()});let c=e.content.querySelector('a[data-analytics-id="buy-now"]')||r;return c&&(c.className="",c.classList.add("button","con-button","blue")),e.innerHTML}function se(e,n){if(!e)return n;let t=e.closest(rt);if(!(t||e.hasAttribute("fragment-id")))return n;if(n[lt]=!0,n.wrapClauses=!0,mt(t?.aemFragment?.data?.priceLiterals,n),ft(e,n),t&&e.dataset.template===st&&(n.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!n.promotionCode){let o=e.dataset.promotionCode??(t?H(t):null);o&&(n.promotionCode=o)}ht(t,n)}function ce(e,n){if(n.promotionCode||!e)return;let t=e.closest(rt),r=e.dataset.promotionCode??(t?H(t):null);r&&(n.promotionCode=r)}function le(e){Et(e,se,ce)}var de=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=de,document.head.append(e)}function Ct(e,n=globalThis.location){return typeof e!="string"||!e?"":`<picture>${bt(e,n)}</picture>`}var x,M,P,_,g,O,I,s,k,X,Z,Rt,F,wt,yt,Q,J,Nt,tt,et,Mt,N,Pt,Ot,L,j=class extends HTMLElement{constructor(){super(...arguments);A(this,s);A(this,x,null);A(this,M,!1);A(this,P,!1);A(this,_,null);B(this,"settings",null);A(this,g,null);B(this,"compatVersion");A(this,O,t=>{t.target===this.aemFragment&&T(this,P,!0)});A(this,I,async t=>{t.target===this.aemFragment&&(T(this,_,t.detail?.fields||null),this.settings=t.detail?.settings??null,T(this,M,!0),await l(this,s,J).call(this),this.dispatchEvent(new CustomEvent(at,{bubbles:!0,composed:!0,detail:t.detail})))})}get contextPromotionCode(){return this.getAttribute("data-promotion-code")}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,o){t==="field"&&(T(this,x,o),l(this,s,J).call(this))}connectedCallback(){this.addEventListener(S,u(this,I)),this.addEventListener(y,u(this,O)),l(this,s,k).call(this),this.aemFragment?.setAttribute("hidden",""),le(dt())}disconnectedCallback(){this.removeEventListener(S,u(this,I)),this.removeEventListener(y,u(this,O))}checkReady(){return u(this,M)?Promise.resolve(!0):u(this,P)?Promise.resolve(!1):new Promise(t=>{let r=o=>{o.target===this.aemFragment&&(this.removeEventListener(S,r),this.removeEventListener(y,r),t(o.type===S))};this.addEventListener(S,r),this.addEventListener(y,r)})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return pt(this)}};x=new WeakMap,M=new WeakMap,P=new WeakMap,_=new WeakMap,g=new WeakMap,O=new WeakMap,I=new WeakMap,s=new WeakSet,k=function(t=!1){if(u(this,g)?.isConnected&&u(this,g).matches('[data-role="mas-field-content"]')&&(!t||u(this,g).tagName==="SPAN"))return u(this,g);let r=this.querySelector(':scope > [data-role="mas-field-content"]');if(r&&(!t||r.tagName==="SPAN"))return T(this,g,r),r;t&&r?.remove();let o=document.createElement("span");return o.setAttribute("data-role","mas-field-content"),this.append(o),T(this,g,o),o},X=function(){this.querySelector(':scope > [data-role="mas-field-content"]')?.remove(),T(this,g,null)},Z=function(t){let r=document.createElement("template");r.innerHTML=t;let o=r.content.querySelector("picture");if(!o)return;o.innerHTML=xt(o.innerHTML),o.setAttribute("data-role","mas-field-content");let i=this.querySelector(':scope > [data-role="mas-field-content"]');i?i.replaceWith(o):this.append(o),T(this,g,o),l(this,s,N).call(this,o)},Rt=function(t){let r=l(this,s,L).call(this,l(this,s,F).call(this,u(this,_).backgroundImageAltText));return`<img loading="lazy" ${typeof r=="string"&&r?`alt="${ae(r)}"`:'role="none"'} src="${K(t)}">`},F=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},wt=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let o=t?.match(/^(.+)\[(.+)\]$/);return o?{fieldName:o[1],index:o[2]}:{fieldName:t,index:null}},yt=function(t,r){if(typeof t!="string")return null;let o=document.createElement("template");o.innerHTML=t;let i;if(!isNaN(r)){let c=parseInt(r,10);i=[...o.content.querySelectorAll("a")][c-1]}return i||(i=o.content.querySelector(`a[data-key="${r}"]`)),i?(i.removeAttribute("class"),i.outerHTML):null},Q=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},J=async function(){if(!u(this,_)||!u(this,x))return;this.hidden=!1;let{fieldName:t,index:r}=l(this,s,wt).call(this,u(this,x));if(r!==null&&isNaN(r)){let a=`${t.replace(/s$/,"")}Labels`,d=u(this,_)[a];if(d!==void 0){let E=(Array.isArray(d)?d:[d]).indexOf(r);if(E===-1){this.hidden=!0;return}let m=u(this,_)[t],f=Array.isArray(m)?m:m?[m]:[],p=l(this,s,F).call(this,f[E]);if(!p){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs){let R=document.createElement("template");if(R.innerHTML=p,p=await Lt(R,!0,this),!p.trim()){this.hidden=!0;return}}l(this,s,Q).call(this);let C=l(this,s,k).call(this,!0);C.innerHTML=l(this,s,L).call(this,p)??"",l(this,s,tt).call(this,C),l(this,s,et).call(this,C),l(this,s,N).call(this,C);return}}let o=l(this,s,F).call(this,u(this,_)[t]);if(o===void 0){this.hidden=!0;return}if(l(this,s,Q).call(this),r===null&&(t==="image"||t==="backgroundImage"||t==="backgrounds")){let a=l(this,s,L).call(this,o);if(typeof a=="string"&&a){let d=t==="image"||t==="backgrounds"?a:l(this,s,Rt).call(this,a);l(this,s,Z).call(this,Ct(d))}else l(this,s,X).call(this),this.hidden=!0;return}if(t==="backgrounds"&&r!==null){let a=l(this,s,L).call(this,St(o,r)),d=typeof a=="string"&&a?_t(a):"";d?l(this,s,Z).call(this,Ct(d)):(l(this,s,X).call(this),this.hidden=!0);return}let i=l(this,s,k).call(this,!0),c;if(r!==null){if(c=l(this,s,yt).call(this,o,r),c===null){this.hidden=!0;return}}else c=l(this,s,L).call(this,o);if(typeof c=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs){let a=document.createElement("template");if(a.innerHTML=c,c=await Lt(a,r!==null,this),!c.trim()){this.hidden=!0;return}}if(u(this,x)==="ctas"){let a=l(this,s,Ot).call(this,c);if(a){i.replaceChildren(a),l(this,s,N).call(this,i);return}}i.innerHTML=c,l(this,s,tt).call(this,i),l(this,s,et).call(this,i),l(this,s,N).call(this,i);return}if(c==null){this.hidden=!0;return}i.textContent=String(c)},Nt=function(t,r){return customElements.get("checkout-link")?.createCheckoutLink(t,r)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${r}</span>`,i})()},tt=function(t){for(let r of t.querySelectorAll("a[data-wcs-osi]:not([is])")){let o=l(this,s,Nt).call(this,r.dataset,r.innerHTML);for(let{name:i,value:c}of r.attributes)["is","href"].includes(i)||o.setAttribute(i,c);r.replaceWith(o)}},et=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let o of r){if(o.dataset.tooltipWired)continue;o.dataset.tooltipWired="1",o.querySelector("svg")||o.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),o.hasAttribute("tabindex")||o.setAttribute("tabindex","0"),o.hasAttribute("role")||o.setAttribute("role","button"),o.hasAttribute("aria-label")||o.setAttribute("aria-label",o.dataset.tooltip);let i=["top","bottom","left","right"],c=[...o.classList].find(E=>i.includes(E)),a=c||"top";c||o.classList.add(a),o.dataset.originalPosition=a,o.classList.add("hide-tooltip");let d=()=>{o.classList.remove("hide-tooltip"),l(this,s,Mt).call(this,o)},h=()=>o.classList.add("hide-tooltip");o.addEventListener("mouseenter",d),o.addEventListener("focus",d),o.addEventListener("mouseleave",h),o.addEventListener("blur",h),o.addEventListener("keydown",E=>{E.key==="Escape"&&h()})}},Mt=function(t){let r=["top","bottom","right","left"],o=window.innerWidth,i=12,c=document.querySelector("header")?.getBoundingClientRect().height||0,a=window.getComputedStyle(t,"::before"),d=G=>parseFloat(G)||0,h=d(a.width)+d(a.paddingLeft)+d(a.paddingRight),E=d(a.height)+d(a.paddingTop)+d(a.paddingBottom),m=t.getBoundingClientRect(),f=t.dataset.originalPosition||"top",p=r.find(G=>t.classList.contains(G)),R=f==="top"||f==="bottom"?h/2:h,It=f==="top"?E+(f==="top"?i:0):E/2,v=m.top-It<c,Y=m.bottom+(f==="bottom"?E+i:0)>window.innerHeight,w=m.right+R+i>o,D=m.left-R-i<0,$=m.left+h/2+i>o,V=m.left-h/2-i<0;if(f!==p&&!(w||D||v||Y||$||V)){t.classList.remove(...r),t.classList.add(f);return}let b=f;w&&$?b="left":D&&V?b="right":w&&v||D&&v?b=$&&"left"||V&&"right"||"bottom":w!==D&&!Y?b=w?"left":"right":v&&["top","left","right"].includes(f)?b="bottom":Y&&["bottom","left","right"].includes(f)&&(b="top"),p!==b&&(t.classList.remove(...r),t.classList.add(b))},N=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let o=(i,c)=>{if(c!=null)for(let a of r)a.hasAttribute(i)||a.setAttribute(i,c)};for(let i of ie)o(i,this.getAttribute(i));o("data-promotion-code",H(this))},Pt=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let i=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let a=document.createElement("a",{is:"checkout-link"});return a.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,a})();for(let{name:a,value:d}of t.attributes)["class","is","href"].includes(a)||i.setAttribute(a,d);if(i.firstElementChild?.classList.add("spectrum-Button-label"),t.className){let a=oe.exec(t.className)?.[0]??"accent",d=a.startsWith("accent");return a.includes("-link")||(i.classList.add("button","con-button"),d?i.classList.add("blue"):a.startsWith("primary")&&!a.includes("-outline")&&i.classList.add("fill")),i}let c=t.parentElement?.tagName;if(c==="STRONG"||c==="EM"){let a=document.createElement(c.toLowerCase());return a.append(i),a}return i},Ot=function(t){let o=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!o.length)return null;let i=document.createElement("div");return i.setAttribute("slot","footer"),i.append(...o.map(c=>l(this,s,Pt).call(this,c))),i},L=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let i=r.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(rt,j);export{ce as checkoutOptionsProvider,se as priceOptionsProvider,Ct as renderImageMarkup,Lt as stripTrialCtas};
