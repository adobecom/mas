var Ft=Object.defineProperty;var lt=t=>{throw TypeError(t)};var Vt=(t,o,e)=>o in t?Ft(t,o,{enumerable:!0,configurable:!0,writable:!0,value:e}):t[o]=e;var W=(t,o,e)=>Vt(t,typeof o!="symbol"?o+"":o,e),z=(t,o,e)=>o.has(t)||lt("Cannot "+e);var m=(t,o,e)=>(z(t,o,"read from private field"),e?e.call(t):o.get(t)),_=(t,o,e)=>o.has(t)?lt("Cannot add the same private member more than once"):o instanceof WeakSet?o.add(t):o.set(t,e),b=(t,o,e,r)=>(z(t,o,"write to private field"),r?r.call(t,e):o.set(t,e),e),p=(t,o,e)=>(z(t,o,"access private method"),e);var Gt=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var K=2e4;var Bt='span[is="inline-price"][data-wcs-osi]',Yt='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var qt='a[is="upt-link"]',ye=`${Bt},${Yt},${qt}`,dt=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var S="aem:load",M="aem:error",ut="mas:ready";var Re=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var pt="legal",mt="plan-type-text",ft="mas-ff-defaults";var ht=["buy-now","select","save-now","get-offer","save-today"];var Wt="mas-commerce-service",j=/^(accent|primary|secondary)(-(outline|link))?$/;function zt(t,o={},e=null,r=null){let n=r?document.createElement(t,{is:r}):document.createElement(t);e instanceof HTMLElement?n.appendChild(e):n.innerHTML=e;for(let[i,c]of Object.entries(o))n.setAttribute(i,c);return n}function Kt(t){let o=[...t.classList].find(r=>j.test(r));if(o)return o;let e=t.closest("strong, em");return e?.tagName==="STRONG"?"primary":e?.tagName==="EM"?"secondary":"secondary-link"}function X(t){let o=Kt(t),e=t.cloneNode(!0);if([...t.classList].some(n=>j.test(n))){let n=t.parentElement;for(;n?.matches("strong, em");){let i=e.firstElementChild;(i?.tagName!==n.tagName||e.innerHTML.trim()!==i.outerHTML)&&e.replaceChildren(zt(n.tagName.toLowerCase(),{},e.innerHTML)),n=n.parentElement}}let r=e;if(t.dataset.wcsOsi){r=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,e.innerHTML),r||(r=document.createElement("a",{is:"checkout-link"}),r.setAttribute("is","checkout-link"),r.innerHTML=`<span style="pointer-events: none;">${e.innerHTML}</span>`);for(let{name:i,value:c}of t.attributes)["is","href"].includes(i)||r.setAttribute(i,c)}for(let n of[...r.classList])j.test(n)&&r.classList.remove(n);return o.endsWith("-link")||(r.classList.add("button","con-button"),r.classList.add(o==="accent"||o==="primary"?"blue":"outline")),r}function Et(){return document.getElementsByTagName(Wt)?.[0]}function gt(t){let o=t.nextElementSibling?.nodeName==="BR"?t.nextElementSibling.nextElementSibling:t.nextElementSibling;return t.dataset.template==="strikethrough"&&(t.nextSibling?.nodeName!=="#text"||t.nextSibling.textContent.trim().length<2)&&o?.isInlinePrice&&o?.dataset?.template==="price"}var jt=[".","!","?"],Xt=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let t=document.createElement("style");t.setAttribute("data-plan-type-text",""),t.textContent=Xt,document.head.append(t)}var Zt="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function Qt(t){let o=t.closest(Zt)??t.parentNode,e=document.createRange();return e.setStart(o,0),e.setEndBefore(t),e.toString().replace(/\s+$/,"").slice(-1)}function At(t){let o=[...t.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(o.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??o[0])?.dataset.wcsOsi??t.aemFragment?.data?.fields?.osi}function Jt(t){return!t||jt.includes(t)?"upper":"lower"}function te(t){return Jt(Qt(t))}function Z(t,o){if(t.dataset.placeholder!==mt)return;let e=t.closest("merch-card, mas-field")?.osi;e&&(o.wcsOsi=e,o.planTypeCase=te(t))}function re(t){return t.compatVersion>=1||t.hasAttribute("data-promotion-project")}function k(t){return re(t)?t.contextPromotionCode:null}function Tt(t,o){t&&(o.literals??(o.literals={}),Object.assign(o.literals,t))}function _t(t,o){gt(t)&&(o.displayPerUnit=!1,o.displayTax=!1)}function bt(t,o){o.displayAnnual===void 0&&typeof t?.settings?.displayAnnual=="boolean"&&(o.displayAnnual=t.settings.displayAnnual,t.settings.displayAnnual&&t.setAttribute("annualized",""))}function xt(t,o,e){!t?.providers||t.providers.has(o)||(t.providers.price(o),t.providers.checkout(e),t.providers.has(Z)||t.providers.price(Z))}function ne(t,o){if(typeof t!="string"||!t)return null;let e;try{e=new URL(t,o)}catch{return null}return e.hostname.endsWith(".aem.page")?`${o}${e.pathname}${e.search}`:null}function J(t){if(typeof t!="string"||!t)return"";try{return new URL(t).href}catch{return""}}function oe(t){if(typeof t!="string"||!t)return!1;try{return new URL(t).hostname.endsWith(".aem.page")}catch{return!1}}var ie={png:{type:"image/png",format:"png"},jpg:{type:"image/jpeg",format:"jpg"},jpeg:{type:"image/jpeg",format:"jpg"},webp:{type:"image/webp",format:"webp"},gif:{type:"image/gif",format:"gif"}},Q={width:2e3,media:"(min-width: 600px)"},se=750;function $(t,o,e){let r=new URL(t);return r.searchParams.set("width",o),r.searchParams.set("format",e),r.searchParams.set("optimize","medium"),r.href}function Lt(t,o){return o?.width?Math.min(t,o.width):t}function ae(t){let o=new URL(t).pathname.split(".").pop().toLowerCase();return ie[o]??null}function Ct(t){return String(t??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function St(t){return!t?.width||!t?.height?"":` width="${t.width}" height="${t.height}"`}function wt(t,o,e=""){if(!oe(t))return"";let r=J(t),n=ae(r);if(!n)return`<img loading="lazy" alt="${Ct(e)}"${St(o)} src="${r}">`;let{type:i,format:c}=n,l=Lt(Q.width,o),s=Lt(se,o);return[`<source type="image/webp" srcset="${$(r,l,"webply")}" media="${Q.media}">`,`<source type="image/webp" srcset="${$(r,s,"webply")}">`,`<source type="${i}" srcset="${$(r,l,c)}" media="${Q.media}">`,`<img loading="lazy" alt="${Ct(e)}" src="${$(r,s,c)}"${St(o)}>`].join("")}function ce(t){return t?.hostname==="www.adobe.com"||t?.hostname==="adobe.com"}function yt(t,o=globalThis.location){if(typeof t!="string"||!t||!ce(o))return t;let e=document.createElement("template");return e.innerHTML=`<picture>${t}</picture>`,e.content.querySelectorAll("source[srcset], img[src]").forEach(r=>{let n=r.tagName==="IMG"?"src":"srcset",i=ne(r.getAttribute(n),o.origin);i&&r.setAttribute(n,i)}),e.content.querySelector("picture").innerHTML}var le=new Set(["SOURCE","IMG"]),de=new Set(["src","srcset","media","type","alt","role","loading","data-mobile-set","width","height"]);function Rt(t){if(typeof t!="string"||!t)return"";let o=document.createElement("template"),e=/^\s*<picture[\s>]/i.test(t);o.innerHTML=e?t:`<picture>${t}</picture>`;let r=o.content.querySelector("picture");return r?(r.querySelectorAll("*").forEach(n=>{if(!le.has(n.tagName)){n.remove();return}[...n.attributes].forEach(i=>{de.has(i.name.toLowerCase())||n.removeAttribute(i.name)})}),r.innerHTML):""}var ue="(min-width: 1200px)",pe="(min-width: 600px)";function Nt(t,o){if(!t)return"";let e=new DOMParser().parseFromString(`<picture>${t}</picture>`,"text/html");if(o==="desktop")return e.querySelector(`source[media="${ue}"]`)?.getAttribute("srcset")??"";if(o==="tablet")return e.querySelector(`source[media="${pe}"]`)?.getAttribute("srcset")??"";if(o==="mobile"){let r=e.querySelector("img");return r?.hasAttribute("data-mobile-set")?r.getAttribute("src")??"":""}return""}var ct="mas-field",me=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"],fe=/\b(accent|primary|secondary)\b(-\b(outline|link)\b)?/g;function he(t){return t.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}var tt=ht.map(t=>`a[data-analytics-id="${t}"]`).join(","),Pt='a[href*="mas.adobe.com/studio.html"][href*="field="]';async function Ee(t){let o=[...t.querySelectorAll(Pt)];if(!o.length)return!0;let e,r,n=await new Promise(i=>{e=new MutationObserver(()=>{o.every(c=>!c.isConnected)&&i(!0)}),e.observe(t,{childList:!0,subtree:!0}),r=setTimeout(()=>i(!1),K)});return e.disconnect(),clearTimeout(r),n}async function Mt(t,o,e){let r=t.content.querySelector(tt),i=[...t.content.querySelectorAll("a")].filter(s=>dt.has(s.dataset.analyticsId));if(i.length===0)return t.innerHTML;if(o&&!r){let s=e.getAttribute("field"),u=e.parentElement,f=u.querySelectorAll(`mas-field, ${Pt}`).length>1?u:u.parentElement;if(!await Ee(f))return t.innerHTML;let d=[],E=f.querySelectorAll('mas-field[field^="ctas"]');E.forEach(h=>{h.getAttribute("field")!==s&&d.push(h.checkReady())});let L=Promise.all(d),T,R=new Promise(h=>{T=setTimeout(()=>h([]),K)}),H=await Promise.race([L,R]);if(clearTimeout(T),d.length&&!H.length)return t.innerHTML;H.some(h=>h===!0)&&E.forEach(h=>{h.getAttribute("field")!==s&&(r??(r=h.querySelector(tt)))})}let c=!1;i.forEach(s=>{if(s.hasAttribute("data-replaced-osi")){let u=e.aemFragment?.data?.priceLiterals?.buyNow;r||!u||u==="buy-now"?s.remove():(s.hasAttribute("aria-label")&&s.removeAttribute("aria-label"),s.setAttribute("data-analytics-id","buy-now"),s.hasAttribute("data-modal")&&s.setAttribute("data-modal","crm"),s.textContent=u),c=!0}else s.remove()});let l=t.content.querySelector(tt)||r;return l&&c&&(l.className.trim()&&l.className.match(fe)?.forEach(s=>{l.classList.remove(s)}),l.classList.add("button","con-button","blue")),t.innerHTML}function ge(t,o){if(!t)return o;let e=t.closest(ct);if(!(e||t.hasAttribute("fragment-id")))return o;if(o[ft]=!0,o.wrapClauses=!0,Tt(e?.aemFragment?.data?.priceLiterals,o),_t(t,o),e&&t.dataset.template===pt&&(o.displayPlanType=e.aemFragment?.data?.settings?.displayPlanType??!1),!o.promotionCode){let n=t.dataset.promotionCode??(e?k(e):null);n&&(o.promotionCode=n)}bt(e,o)}function Ae(t,o){if(o.promotionCode||!t)return;let e=t.closest(ct),r=t.dataset.promotionCode??(e?k(e):null);r&&(o.promotionCode=r)}function Te(t){xt(t,ge,Ae)}var _e=`
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
`;if(!document.querySelector("style[data-mas-field]")){let t=document.createElement("style");t.setAttribute("data-mas-field",""),t.textContent=_e,document.head.append(t)}function Ot(t,o=globalThis.location){return typeof t!="string"||!t?"":`<picture>${yt(t,o)}</picture>`}var y,P,I,x,A,v,D,a,F,rt,nt,It,V,vt,Dt,ot,it,Ht,st,at,Ut,O,kt,$t,w,et=class extends HTMLElement{constructor(){super(...arguments);_(this,a);_(this,y,null);_(this,P,!1);_(this,I,!1);_(this,x,null);W(this,"settings",null);_(this,A,null);W(this,"compatVersion");_(this,v,e=>{e.target===this.aemFragment&&b(this,I,!0)});_(this,D,async e=>{e.target===this.aemFragment&&(b(this,x,e.detail?.fields||null),this.settings=e.detail?.settings??null,b(this,P,!0),await p(this,a,it).call(this),this.dispatchEvent(new CustomEvent(ut,{bubbles:!0,composed:!0,detail:e.detail})))})}get contextPromotionCode(){return this.getAttribute("data-promotion-code")}static get observedAttributes(){return["field"]}attributeChangedCallback(e,r,n){e==="field"&&(b(this,y,n),p(this,a,it).call(this))}connectedCallback(){this.addEventListener(S,m(this,D)),this.addEventListener(M,m(this,v)),p(this,a,F).call(this),this.aemFragment?.setAttribute("hidden",""),Te(Et())}disconnectedCallback(){this.removeEventListener(S,m(this,D)),this.removeEventListener(M,m(this,v))}checkReady(){return m(this,P)?Promise.resolve(!0):m(this,I)?Promise.resolve(!1):new Promise(e=>{let r=n=>{n.target===this.aemFragment&&(this.removeEventListener(S,r),this.removeEventListener(M,r),e(n.type===S))};this.addEventListener(S,r),this.addEventListener(M,r)})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return At(this)}};y=new WeakMap,P=new WeakMap,I=new WeakMap,x=new WeakMap,A=new WeakMap,v=new WeakMap,D=new WeakMap,a=new WeakSet,F=function(e=!1){if(m(this,A)?.isConnected&&m(this,A).matches('[data-role="mas-field-content"]')&&(!e||m(this,A).tagName==="SPAN"))return m(this,A);let r=this.querySelector(':scope > [data-role="mas-field-content"]');if(r&&(!e||r.tagName==="SPAN"))return b(this,A,r),r;e&&r?.remove();let n=document.createElement("span");return n.setAttribute("data-role","mas-field-content"),this.append(n),b(this,A,n),n},rt=function(){this.querySelector(':scope > [data-role="mas-field-content"]')?.remove(),b(this,A,null)},nt=function(e){let r=document.createElement("template");r.innerHTML=e;let n=r.content.querySelector("picture");if(!n)return;n.innerHTML=Rt(n.innerHTML),n.setAttribute("data-role","mas-field-content");let i=this.querySelector(':scope > [data-role="mas-field-content"]');i?i.replaceWith(n):this.append(n),b(this,A,n),p(this,a,O).call(this,n)},It=function(e){let r=p(this,a,w).call(this,p(this,a,V).call(this,m(this,x).backgroundImageAltText));return`<img loading="lazy" ${typeof r=="string"&&r?`alt="${he(r)}"`:'role="none"'} src="${J(e)}">`},V=function(e){return e&&typeof e=="object"&&"value"in e?e.value:e},vt=function(e){let r=e?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let n=e?.match(/^(.+)\[(.+)\]$/);return n?{fieldName:n[1],index:n[2]}:{fieldName:e,index:null}},Dt=function(e,r,n){if(typeof e!="string")return null;let i=document.createElement("template");i.innerHTML=e;let c;if(!isNaN(r)){let u=parseInt(r,10);c=[...i.content.querySelectorAll("a")][u-1]}if(c||(c=i.content.querySelector(`a[data-key="${r}"]`)),!c)return null;if(n)return c.removeAttribute("class"),c.outerHTML;let l=c.outerHTML,s=c.parentElement;for(;s?.matches("strong, em");){let u=s.tagName.toLowerCase();l=`<${u}>${l}</${u}>`,s=s.parentElement}return l},ot=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let e=this.aemFragment.data;e&&(e.variationId&&this.setAttribute("variation-id",e.variationId),e.maskId&&this.setAttribute("mask-id",e.maskId),e.promoProject&&this.setAttribute("data-promotion-project",e.promoProject),e.promoVariationProject&&this.setAttribute("data-promotion-variation-project",e.promoVariationProject),this.compatVersion=e.fields?.compatVersion,e.fields?.promoCode&&this.setAttribute("data-promotion-code",e.fields.promoCode))},it=async function(){if(!m(this,x)||!m(this,y))return;this.hidden=!1;let{fieldName:e,index:r}=p(this,a,vt).call(this,m(this,y)),n=e==="ctas"&&r!==null&&!!(this.closest("strong, em, .feds-cta-wrapper")||this.querySelector(":scope > strong, :scope > em"));if(r!==null&&isNaN(r)){let s=`${e.replace(/s$/,"")}Labels`,u=m(this,x)[s];if(u!==void 0){let f=(Array.isArray(u)?u:[u]).indexOf(r);if(f===-1){this.hidden=!0;return}let d=m(this,x)[e],E=Array.isArray(d)?d:d?[d]:[],L=p(this,a,V).call(this,E[f]);if(!L){this.hidden=!0;return}if(e==="ctas"&&this.settings?.hideTrialCTAs){let R=document.createElement("template");if(R.innerHTML=L,L=await Mt(R,!0,this),!L.trim()){this.hidden=!0;return}}p(this,a,ot).call(this);let T=p(this,a,F).call(this,!0);T.innerHTML=p(this,a,w).call(this,L)??"",p(this,a,st).call(this,T),p(this,a,at).call(this,T),p(this,a,O).call(this,T);return}}let i=p(this,a,V).call(this,m(this,x)[e]);if(i===void 0){this.hidden=!0;return}if(p(this,a,ot).call(this),r===null&&(e==="image"||e==="backgroundImage"||e==="backgrounds")){let s=p(this,a,w).call(this,i);if(typeof s=="string"&&s){let u=e==="image"||e==="backgrounds"?s:p(this,a,It).call(this,s);p(this,a,nt).call(this,Ot(u))}else p(this,a,rt).call(this),this.hidden=!0;return}if(e==="backgrounds"&&r!==null){let s=p(this,a,w).call(this,Nt(i,r)),u=typeof s=="string"&&s?wt(s):"";u?p(this,a,nt).call(this,Ot(u)):(p(this,a,rt).call(this),this.hidden=!0);return}let c=p(this,a,F).call(this,!0),l;if(r!==null){if(l=p(this,a,Dt).call(this,i,r,n),l===null){this.hidden=!0;return}}else l=p(this,a,w).call(this,i);if(typeof l=="string"){if(e==="ctas"&&this.settings?.hideTrialCTAs){let s=document.createElement("template");if(s.innerHTML=l,l=await Mt(s,r!==null,this),!l.trim()){this.hidden=!0;return}}if(e==="ctas"&&!n){let s=p(this,a,$t).call(this,l,r!==null);if(s){p(this,a,kt).call(this,s),c.replaceChildren(s),p(this,a,O).call(this,c);return}}c.innerHTML=l,p(this,a,st).call(this,c),p(this,a,at).call(this,c),p(this,a,O).call(this,c);return}if(l==null){this.hidden=!0;return}c.textContent=String(l)},Ht=function(e,r){return customElements.get("checkout-link")?.createCheckoutLink(e,r)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${r}</span>`,i})()},st=function(e){for(let r of e.querySelectorAll("a[data-wcs-osi]:not([is])")){let n=p(this,a,Ht).call(this,r.dataset,r.innerHTML);for(let{name:i,value:c}of r.attributes)["is","href"].includes(i)||n.setAttribute(i,c);r.replaceWith(n)}},at=function(e){let r=e.querySelectorAll(".icon-button[data-tooltip]");for(let n of r){if(n.dataset.tooltipWired)continue;n.dataset.tooltipWired="1",n.querySelector("svg")||n.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="m10,18.75c-4.8252,0-8.75-3.9248-8.75-8.75S5.1748,1.25,10,1.25s8.75,3.9248,8.75,8.75-3.9248,8.75-8.75,8.75Zm0-16c-3.99805,0-7.25,3.25195-7.25,7.25s3.25195,7.25,7.25,7.25,7.25-3.25195,7.25-7.25-3.25195-7.25-7.25-7.25Z"></path><path fill="currentcolor" d="m10.00064,5.26036c.23065-.00813.45538.07387.62661.22862.33033.36505.33033.92102,0,1.28607-.16935.15851-.39483.24308-.62664.23504-.23635.00948-.46589-.08035-.63302-.24775-.16207-.1679-.24916-.39432-.24137-.62755-.01238-.23497.06959-.46515.2277-.6394.17358-.16474.40786-.24988.64671-.23503Z"></path><path fill="currentcolor" d="m10,15.0625c-.41406,0-.75-.33594-.75-.75v-4.83496c0-.41406.33594-.75.75-.75s.75.33594.75.75v4.83496c0,.41406-.33594.75-.75.75Z"></path></svg>'),n.hasAttribute("tabindex")||n.setAttribute("tabindex","0"),n.hasAttribute("role")||n.setAttribute("role","button"),n.hasAttribute("aria-label")||n.setAttribute("aria-label",n.dataset.tooltip);let i=["top","bottom","left","right"],c=[...n.classList].find(g=>i.includes(g)),l=c||"top";c||n.classList.add(l),n.dataset.originalPosition=l,n.classList.add("hide-tooltip");let s=()=>{n.classList.remove("hide-tooltip"),p(this,a,Ut).call(this,n)},u=()=>n.classList.add("hide-tooltip");n.addEventListener("mouseenter",s),n.addEventListener("focus",s),n.addEventListener("mouseleave",u),n.addEventListener("blur",u),n.addEventListener("keydown",g=>{g.key==="Escape"&&u()})}},Ut=function(e){let r=["top","bottom","right","left"],n=window.innerWidth,i=12,c=document.querySelector("header")?.getBoundingClientRect().height||0,l=window.getComputedStyle(e,"::before"),s=q=>parseFloat(q)||0,u=s(l.width)+s(l.paddingLeft)+s(l.paddingRight),g=s(l.height)+s(l.paddingTop)+s(l.paddingBottom),f=e.getBoundingClientRect(),d=e.dataset.originalPosition||"top",E=r.find(q=>e.classList.contains(q)),T=d==="top"||d==="bottom"?u/2:u,H=d==="top"?g+(d==="top"?i:0):g/2,h=f.top-H<c,G=f.bottom+(d==="bottom"?g+i:0)>window.innerHeight,N=f.right+T+i>n,U=f.left-T-i<0,B=f.left+u/2+i>n,Y=f.left-u/2-i<0;if(d!==E&&!(N||U||h||G||B||Y)){e.classList.remove(...r),e.classList.add(d);return}let C=d;N&&B?C="left":U&&Y?C="right":N&&h||U&&h?C=B&&"left"||Y&&"right"||"bottom":N!==U&&!G?C=N?"left":"right":h&&["top","left","right"].includes(d)?C="bottom":G&&["bottom","left","right"].includes(d)&&(C="top"),E!==C&&(e.classList.remove(...r),e.classList.add(C))},O=function(e){let r=e.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let n=(i,c)=>{if(c!=null)for(let l of r)l.hasAttribute(i)||l.setAttribute(i,c)};for(let i of me)n(i,this.getAttribute(i));n("data-promotion-code",k(this))},kt=function(e){let r=this.closest(".section");if(!r)return;let n=this.parentElement;for(;n.matches("strong, em")&&n.childElementCount===1&&n.firstElementChild===this&&n.textContent.trim()===this.textContent.trim();)n.replaceWith(...n.childNodes),n=this.parentElement;let i=this;for(;i.parentElement!==r;)i=i.parentElement;let c=/^button-(s|m|l|xl|xxl)$/,l=[...i.querySelectorAll(".con-button")].find(d=>!this.contains(d)&&[...d.classList].some(E=>c.test(E))),s,u=[];if(l)s=[...l.classList].find(d=>c.test(d)),u=[...l.classList].filter(d=>d.startsWith("button-")&&!c.test(d));else{let d=[...i.classList].find(E=>/^(s|m|l|xl|xxl)-button$/.test(E));d?s=`button-${d.split("-")[0]}`:i.classList.contains("hero-marquee")?(s="button-xl",u=["button-justified-mobile"]):i.matches(".accordion, .media")||(s=i.matches(".large, .xlarge")?"button-xl":"button-l")}for(let d of this.merchLink?.matchAll(/(?:&|#)_button-([a-zA-Z-]+)/g)??[])u.push(d[1]);let g=e.matches(".con-button")?[e]:e.querySelectorAll(".con-button");for(let d of g)s&&![...d.classList].some(E=>c.test(E))&&d.classList.add(s),d.classList.add(...u);let f=this.closest("p");f&&(g.length||[...f.childNodes].every(d=>d===this||d.nodeType===Node.TEXT_NODE&&!d.textContent.trim()))&&f.classList.add("action-area")},$t=function(e,r=!1){let i=[...new DOMParser().parseFromString(e,"text/html").body.querySelectorAll("a")];if(!i.length)return null;if(r)return X(i[0]);let c=document.createElement("div");return c.setAttribute("slot","footer"),c.classList.add("action-area"),c.append(...i.map(l=>X(l))),c},w=function(e){if(typeof e!="string")return e;let r=e.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return e;let i=r.slice(3,-4);return i.includes("<p>")?e:i};customElements.define(ct,et);export{fe as CHECKOUT_STYLE_PATTERN,Ae as checkoutOptionsProvider,ge as priceOptionsProvider,Ot as renderImageMarkup,Mt as stripTrialCtas};
