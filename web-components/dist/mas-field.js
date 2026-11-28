var Vt=Object.defineProperty;var lt=t=>{throw TypeError(t)};var Gt=(t,o,e)=>o in t?Vt(t,o,{enumerable:!0,configurable:!0,writable:!0,value:e}):t[o]=e;var q=(t,o,e)=>Gt(t,typeof o!="symbol"?o+"":o,e),z=(t,o,e)=>o.has(t)||lt("Cannot "+e);var m=(t,o,e)=>(z(t,o,"read from private field"),e?e.call(t):o.get(t)),b=(t,o,e)=>o.has(t)?lt("Cannot add the same private member more than once"):o instanceof WeakSet?o.add(t):o.set(t,e),_=(t,o,e,r)=>(z(t,o,"write to private field"),r?r.call(t,e):o.set(t,e),e),p=(t,o,e)=>(z(t,o,"access private method"),e);var Yt=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var K=2e4;var Bt='span[is="inline-price"][data-wcs-osi]',Wt='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var qt='a[is="upt-link"]',ye=`${Bt},${Wt},${qt}`,dt=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var S="aem:load",M="aem:error",ut="mas:ready";var Ne=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var pt="legal",mt="plan-type-text",ft="mas-ff-defaults";var ht=["buy-now","select","save-now","get-offer","save-today"];var zt="mas-commerce-service",j=/^(accent|primary|secondary)(-(outline|link))?$/;function Et(t,o,e){let r=o?.trim();if(!t||!r)return null;let n=t.toLowerCase().indexOf(r.toLowerCase());return n===-1?null:t.slice(0,n)+e+t.slice(n+r.length)}function Kt(t,o={},e=null,r=null){let n=r?document.createElement(t,{is:r}):document.createElement(t);e instanceof HTMLElement?n.appendChild(e):n.innerHTML=e;for(let[i,c]of Object.entries(o))n.setAttribute(i,c);return n}function jt(t){let o=[...t.classList].find(r=>j.test(r));if(o)return o;let e=t.closest("strong, em");return e?.tagName==="STRONG"?"primary":e?.tagName==="EM"?"secondary":"secondary-link"}function Z(t){let o=jt(t),e=t.cloneNode(!0);if([...t.classList].some(n=>j.test(n))){let n=t.parentElement;for(;n?.matches("strong, em");){let i=e.firstElementChild;(i?.tagName!==n.tagName||e.innerHTML.trim()!==i.outerHTML)&&e.replaceChildren(Kt(n.tagName.toLowerCase(),{},e.innerHTML)),n=n.parentElement}}let r=e;if(t.dataset.wcsOsi){r=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,e.innerHTML),r||(r=document.createElement("a",{is:"checkout-link"}),r.setAttribute("is","checkout-link"),r.innerHTML=`<span style="pointer-events: none;">${e.innerHTML}</span>`);for(let{name:i,value:c}of t.attributes)["is","href"].includes(i)||r.setAttribute(i,c)}for(let n of[...r.classList])j.test(n)&&r.classList.remove(n);return o.endsWith("-link")||(r.classList.add("button","con-button"),r.classList.add(o==="accent"||o==="primary"?"blue":"outline")),r}function gt(){return document.getElementsByTagName(zt)?.[0]}function At(t){let o=t.nextElementSibling?.nodeName==="BR"?t.nextElementSibling.nextElementSibling:t.nextElementSibling;return t.dataset.template==="strikethrough"&&(t.nextSibling?.nodeName!=="#text"||t.nextSibling.textContent.trim().length<2)&&o?.isInlinePrice&&o?.dataset?.template==="price"}var Zt=[".","!","?"],Xt=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let t=document.createElement("style");t.setAttribute("data-plan-type-text",""),t.textContent=Xt,document.head.append(t)}var Qt="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function Jt(t){let o=t.closest(Qt)??t.parentNode,e=document.createRange();return e.setStart(o,0),e.setEndBefore(t),e.toString().replace(/\s+$/,"").slice(-1)}function Tt(t){let o=[...t.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(o.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??o[0])?.dataset.wcsOsi??t.aemFragment?.data?.fields?.osi}function te(t){return!t||Zt.includes(t)?"upper":"lower"}function ee(t){return te(Jt(t))}function X(t,o){if(t.dataset.placeholder!==mt)return;let e=t.closest("merch-card, mas-field")?.osi;e&&(o.wcsOsi=e,o.planTypeCase=ee(t))}function ne(t){return t.compatVersion>=1||t.hasAttribute("data-promotion-project")}function U(t){return ne(t)?t.contextPromotionCode:null}function bt(t,o){t&&(o.literals??(o.literals={}),Object.assign(o.literals,t))}function _t(t,o){At(t)&&(o.displayPerUnit=!1,o.displayTax=!1)}function xt(t,o){o.displayAnnual===void 0&&typeof t?.settings?.displayAnnual=="boolean"&&(o.displayAnnual=t.settings.displayAnnual,t.settings.displayAnnual&&t.setAttribute("annualized",""))}function Lt(t,o,e){!t?.providers||t.providers.has(o)||(t.providers.price(o),t.providers.checkout(e),t.providers.has(X)||t.providers.price(X))}function oe(t,o){if(typeof t!="string"||!t)return null;let e;try{e=new URL(t,o)}catch{return null}return e.hostname.endsWith(".aem.page")?`${o}${e.pathname}${e.search}`:null}function J(t){if(typeof t!="string"||!t)return"";try{return new URL(t).href}catch{return""}}function ie(t){if(typeof t!="string"||!t)return!1;try{return new URL(t).hostname.endsWith(".aem.page")}catch{return!1}}var se={png:{type:"image/png",format:"png"},jpg:{type:"image/jpeg",format:"jpg"},jpeg:{type:"image/jpeg",format:"jpg"},webp:{type:"image/webp",format:"webp"},gif:{type:"image/gif",format:"gif"}},Q={width:2e3,media:"(min-width: 600px)"},ae=750;function F(t,o,e){let r=new URL(t);return r.searchParams.set("width",o),r.searchParams.set("format",e),r.searchParams.set("optimize","medium"),r.href}function Ct(t,o){return o?.width?Math.min(t,o.width):t}function ce(t){let o=new URL(t).pathname.split(".").pop().toLowerCase();return se[o]??null}function St(t){return String(t??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function wt(t){return!t?.width||!t?.height?"":` width="${t.width}" height="${t.height}"`}function Rt(t,o,e=""){if(!ie(t))return"";let r=J(t),n=ce(r);if(!n)return`<img loading="lazy" alt="${St(e)}"${wt(o)} src="${r}">`;let{type:i,format:c}=n,l=Ct(Q.width,o),s=Ct(ae,o);return[`<source type="image/webp" srcset="${F(r,l,"webply")}" media="${Q.media}">`,`<source type="image/webp" srcset="${F(r,s,"webply")}">`,`<source type="${i}" srcset="${F(r,l,c)}" media="${Q.media}">`,`<img loading="lazy" alt="${St(e)}" src="${F(r,s,c)}"${wt(o)}>`].join("")}function le(t){return t?.hostname==="www.adobe.com"||t?.hostname==="adobe.com"}function yt(t,o=globalThis.location){if(typeof t!="string"||!t||!le(o))return t;let e=document.createElement("template");return e.innerHTML=`<picture>${t}</picture>`,e.content.querySelectorAll("source[srcset], img[src]").forEach(r=>{let n=r.tagName==="IMG"?"src":"srcset",i=oe(r.getAttribute(n),o.origin);i&&r.setAttribute(n,i)}),e.content.querySelector("picture").innerHTML}var de=new Set(["SOURCE","IMG"]),ue=new Set(["src","srcset","media","type","alt","role","loading","data-mobile-set","width","height"]);function Nt(t){if(typeof t!="string"||!t)return"";let o=document.createElement("template"),e=/^\s*<picture[\s>]/i.test(t);o.innerHTML=e?t:`<picture>${t}</picture>`;let r=o.content.querySelector("picture");return r?(r.querySelectorAll("*").forEach(n=>{if(!de.has(n.tagName)){n.remove();return}[...n.attributes].forEach(i=>{ue.has(i.name.toLowerCase())||n.removeAttribute(i.name)})}),r.innerHTML):""}var pe="(min-width: 1200px)",me="(min-width: 600px)";function Mt(t,o){if(!t)return"";let e=new DOMParser().parseFromString(`<picture>${t}</picture>`,"text/html");if(o==="desktop")return e.querySelector(`source[media="${pe}"]`)?.getAttribute("srcset")??"";if(o==="tablet")return e.querySelector(`source[media="${me}"]`)?.getAttribute("srcset")??"";if(o==="mobile"){let r=e.querySelector("img");return r?.hasAttribute("data-mobile-set")?r.getAttribute("src")??"":""}return""}var ct="mas-field",fe=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"],he=/\b(accent|primary|secondary)\b(-\b(outline|link)\b)?/g;function Ee(t){return t.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}var tt=ht.map(t=>`a[data-analytics-id="${t}"]`).join(","),It='a[href*="mas.adobe.com/studio.html"][href*="field="]';async function ge(t){let o=[...t.querySelectorAll(It)];if(!o.length)return!0;let e,r,n=await new Promise(i=>{e=new MutationObserver(()=>{o.every(c=>!c.isConnected)&&i(!0)}),e.observe(t,{childList:!0,subtree:!0}),r=setTimeout(()=>i(!1),K)});return e.disconnect(),clearTimeout(r),n}async function Ot(t,o,e){let r=t.content.querySelector(tt),i=[...t.content.querySelectorAll("a")].filter(s=>dt.has(s.dataset.analyticsId));if(i.length===0)return t.innerHTML;if(o&&!r){let s=e.getAttribute("field"),u=e.parentElement,f=u.querySelectorAll(`mas-field, ${It}`).length>1?u:u.parentElement;if(!await ge(f))return t.innerHTML;let d=[],g=f.querySelectorAll('mas-field[field^="ctas"]');g.forEach(E=>{E.getAttribute("field")!==s&&d.push(E.checkReady())});let L=Promise.all(d),T,y=new Promise(E=>{T=setTimeout(()=>E([]),K)}),H=await Promise.race([L,y]);if(clearTimeout(T),d.length&&!H.length)return t.innerHTML;H.some(E=>E===!0)&&g.forEach(E=>{E.getAttribute("field")!==s&&(r??(r=E.querySelector(tt)))})}let c=!1;i.forEach(s=>{if(s.hasAttribute("data-replaced-osi")){let u=e.aemFragment?.data?.priceLiterals?.buyNow;if(r||!u||u==="buy-now")s.remove();else{let h=Et(s.getAttribute("aria-label"),s.textContent,u);h!==null?s.setAttribute("aria-label",h):s.removeAttribute("aria-label"),s.setAttribute("data-analytics-id","buy-now"),s.hasAttribute("data-modal")&&s.setAttribute("data-modal","crm"),s.textContent=u}c=!0}else s.remove()});let l=t.content.querySelector(tt)||r;return l&&c&&(l.className.trim()&&l.className.match(he)?.forEach(s=>{l.classList.remove(s)}),l.classList.add("button","con-button","blue")),t.innerHTML}function Ae(t,o){if(!t)return o;let e=t.closest(ct);if(!(e||t.hasAttribute("fragment-id")))return o;if(o[ft]=!0,o.wrapClauses=!0,bt(e?.aemFragment?.data?.priceLiterals,o),_t(t,o),e&&t.dataset.template===pt&&(o.displayPlanType=e.aemFragment?.data?.settings?.displayPlanType??!1),!o.promotionCode){let n=t.dataset.promotionCode??(e?U(e):null);n&&(o.promotionCode=n)}xt(e,o)}function Te(t,o){if(o.promotionCode||!t)return;let e=t.closest(ct),r=t.dataset.promotionCode??(e?U(e):null);r&&(o.promotionCode=r)}function be(t){Lt(t,Ae,Te)}var _e=`
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
`;if(!document.querySelector("style[data-mas-field]")){let t=document.createElement("style");t.setAttribute("data-mas-field",""),t.textContent=_e,document.head.append(t)}function Pt(t,o=globalThis.location){return typeof t!="string"||!t?"":`<picture>${yt(t,o)}</picture>`}var R,P,I,x,A,v,D,a,$,rt,nt,vt,V,Dt,Ht,ot,it,kt,st,at,Ut,O,Ft,$t,w,et=class extends HTMLElement{constructor(){super(...arguments);b(this,a);b(this,R,null);b(this,P,!1);b(this,I,!1);b(this,x,null);q(this,"settings",null);b(this,A,null);q(this,"compatVersion");b(this,v,e=>{e.target===this.aemFragment&&_(this,I,!0)});b(this,D,async e=>{e.target===this.aemFragment&&(_(this,x,e.detail?.fields||null),this.settings=e.detail?.settings??null,_(this,P,!0),await p(this,a,it).call(this),this.dispatchEvent(new CustomEvent(ut,{bubbles:!0,composed:!0,detail:e.detail})))})}get contextPromotionCode(){return this.getAttribute("data-promotion-code")}static get observedAttributes(){return["field"]}attributeChangedCallback(e,r,n){e==="field"&&(_(this,R,n),p(this,a,it).call(this))}connectedCallback(){this.addEventListener(S,m(this,D)),this.addEventListener(M,m(this,v)),p(this,a,$).call(this),this.aemFragment?.setAttribute("hidden",""),be(gt())}disconnectedCallback(){this.removeEventListener(S,m(this,D)),this.removeEventListener(M,m(this,v))}checkReady(){return m(this,P)?Promise.resolve(!0):m(this,I)?Promise.resolve(!1):new Promise(e=>{let r=n=>{n.target===this.aemFragment&&(this.removeEventListener(S,r),this.removeEventListener(M,r),e(n.type===S))};this.addEventListener(S,r),this.addEventListener(M,r)})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return Tt(this)}};R=new WeakMap,P=new WeakMap,I=new WeakMap,x=new WeakMap,A=new WeakMap,v=new WeakMap,D=new WeakMap,a=new WeakSet,$=function(e=!1){if(m(this,A)?.isConnected&&m(this,A).matches('[data-role="mas-field-content"]')&&(!e||m(this,A).tagName==="SPAN"))return m(this,A);let r=this.querySelector(':scope > [data-role="mas-field-content"]');if(r&&(!e||r.tagName==="SPAN"))return _(this,A,r),r;e&&r?.remove();let n=document.createElement("span");return n.setAttribute("data-role","mas-field-content"),this.append(n),_(this,A,n),n},rt=function(){this.querySelector(':scope > [data-role="mas-field-content"]')?.remove(),_(this,A,null)},nt=function(e){let r=document.createElement("template");r.innerHTML=e;let n=r.content.querySelector("picture");if(!n)return;n.innerHTML=Nt(n.innerHTML),n.setAttribute("data-role","mas-field-content");let i=this.querySelector(':scope > [data-role="mas-field-content"]');i?i.replaceWith(n):this.append(n),_(this,A,n),p(this,a,O).call(this,n)},vt=function(e){let r=p(this,a,w).call(this,p(this,a,V).call(this,m(this,x).backgroundImageAltText));return`<img loading="lazy" ${typeof r=="string"&&r?`alt="${Ee(r)}"`:'role="none"'} src="${J(e)}">`},V=function(e){return e&&typeof e=="object"&&"value"in e?e.value:e},Dt=function(e){let r=e?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let n=e?.match(/^(.+)\[(.+)\]$/);return n?{fieldName:n[1],index:n[2]}:{fieldName:e,index:null}},Ht=function(e,r,n){if(typeof e!="string")return null;let i=document.createElement("template");i.innerHTML=e;let c;if(!isNaN(r)){let u=parseInt(r,10);c=[...i.content.querySelectorAll("a")][u-1]}if(c||(c=i.content.querySelector(`a[data-key="${r}"]`)),!c)return null;if(n)return c.removeAttribute("class"),c.outerHTML;let l=c.outerHTML,s=c.parentElement;for(;s?.matches("strong, em");){let u=s.tagName.toLowerCase();l=`<${u}>${l}</${u}>`,s=s.parentElement}return l},ot=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let e=this.aemFragment.data;e&&(e.variationId&&this.setAttribute("variation-id",e.variationId),e.maskId&&this.setAttribute("mask-id",e.maskId),e.promoProject&&this.setAttribute("data-promotion-project",e.promoProject),e.promoVariationProject&&this.setAttribute("data-promotion-variation-project",e.promoVariationProject),this.compatVersion=e.fields?.compatVersion,e.fields?.promoCode&&this.setAttribute("data-promotion-code",e.fields.promoCode))},it=async function(){if(!m(this,x)||!m(this,R))return;this.hidden=!1;let{fieldName:e,index:r}=p(this,a,Dt).call(this,m(this,R)),n=e==="ctas"&&r!==null&&!!(this.closest("strong, em, .feds-cta-wrapper")||this.querySelector(":scope > strong, :scope > em"));if(r!==null&&isNaN(r)){let s=`${e.replace(/s$/,"")}Labels`,u=m(this,x)[s];if(u!==void 0){let f=(Array.isArray(u)?u:[u]).indexOf(r);if(f===-1){this.hidden=!0;return}let d=m(this,x)[e],g=Array.isArray(d)?d:d?[d]:[],L=p(this,a,V).call(this,g[f]);if(!L){this.hidden=!0;return}if(e==="ctas"&&this.settings?.hideTrialCTAs){let y=document.createElement("template");if(y.innerHTML=L,L=await Ot(y,!0,this),!L.trim()){this.hidden=!0;return}}p(this,a,ot).call(this);let T=p(this,a,$).call(this,!0);T.innerHTML=p(this,a,w).call(this,L)??"",p(this,a,st).call(this,T),p(this,a,at).call(this,T),p(this,a,O).call(this,T);return}}let i=p(this,a,V).call(this,m(this,x)[e]);if(i===void 0){this.hidden=!0;return}if(p(this,a,ot).call(this),r===null&&(e==="image"||e==="backgroundImage"||e==="backgrounds")){let s=p(this,a,w).call(this,i);if(typeof s=="string"&&s){let u=e==="image"||e==="backgrounds"?s:p(this,a,vt).call(this,s);p(this,a,nt).call(this,Pt(u))}else p(this,a,rt).call(this),this.hidden=!0;return}if(e==="backgrounds"&&r!==null){let s=p(this,a,w).call(this,Mt(i,r)),u=typeof s=="string"&&s?Rt(s):"";u?p(this,a,nt).call(this,Pt(u)):(p(this,a,rt).call(this),this.hidden=!0);return}let c=p(this,a,$).call(this,!0),l;if(r!==null){if(l=p(this,a,Ht).call(this,i,r,n),l===null){this.hidden=!0;return}}else l=p(this,a,w).call(this,i);if(typeof l=="string"){if(e==="ctas"&&this.settings?.hideTrialCTAs){let s=document.createElement("template");if(s.innerHTML=l,l=await Ot(s,r!==null,this),!l.trim()){this.hidden=!0;return}}if(e==="ctas"&&!n){let s=p(this,a,$t).call(this,l,r!==null);if(s){p(this,a,Ft).call(this,s),c.replaceChildren(s),p(this,a,O).call(this,c);return}}c.innerHTML=l,p(this,a,st).call(this,c),p(this,a,at).call(this,c),p(this,a,O).call(this,c);return}if(l==null){this.hidden=!0;return}c.textContent=String(l)},kt=function(e,r){return customElements.get("checkout-link")?.createCheckoutLink(e,r)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${r}</span>`,i})()},st=function(e){for(let r of e.querySelectorAll("a[data-wcs-osi]:not([is])")){let n=p(this,a,kt).call(this,r.dataset,r.innerHTML);for(let{name:i,value:c}of r.attributes)["is","href"].includes(i)||n.setAttribute(i,c);r.replaceWith(n)}},at=function(e){let r=e.querySelectorAll(".icon-button[data-tooltip]");for(let n of r){if(n.dataset.tooltipWired)continue;n.dataset.tooltipWired="1",n.querySelector("svg")||n.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="m10,18.75c-4.8252,0-8.75-3.9248-8.75-8.75S5.1748,1.25,10,1.25s8.75,3.9248,8.75,8.75-3.9248,8.75-8.75,8.75Zm0-16c-3.99805,0-7.25,3.25195-7.25,7.25s3.25195,7.25,7.25,7.25,7.25-3.25195,7.25-7.25-3.25195-7.25-7.25-7.25Z"></path><path fill="currentcolor" d="m10.00064,5.26036c.23065-.00813.45538.07387.62661.22862.33033.36505.33033.92102,0,1.28607-.16935.15851-.39483.24308-.62664.23504-.23635.00948-.46589-.08035-.63302-.24775-.16207-.1679-.24916-.39432-.24137-.62755-.01238-.23497.06959-.46515.2277-.6394.17358-.16474.40786-.24988.64671-.23503Z"></path><path fill="currentcolor" d="m10,15.0625c-.41406,0-.75-.33594-.75-.75v-4.83496c0-.41406.33594-.75.75-.75s.75.33594.75.75v4.83496c0,.41406-.33594.75-.75.75Z"></path></svg>'),n.hasAttribute("tabindex")||n.setAttribute("tabindex","0"),n.hasAttribute("role")||n.setAttribute("role","button"),n.hasAttribute("aria-label")||n.setAttribute("aria-label",n.dataset.tooltip);let i=["top","bottom","left","right"],c=[...n.classList].find(h=>i.includes(h)),l=c||"top";c||n.classList.add(l),n.dataset.originalPosition=l,n.classList.add("hide-tooltip");let s=()=>{n.classList.remove("hide-tooltip"),p(this,a,Ut).call(this,n)},u=()=>n.classList.add("hide-tooltip");n.addEventListener("mouseenter",s),n.addEventListener("focus",s),n.addEventListener("mouseleave",u),n.addEventListener("blur",u),n.addEventListener("keydown",h=>{h.key==="Escape"&&u()})}},Ut=function(e){let r=["top","bottom","right","left"],n=window.innerWidth,i=12,c=document.querySelector("header")?.getBoundingClientRect().height||0,l=window.getComputedStyle(e,"::before"),s=W=>parseFloat(W)||0,u=s(l.width)+s(l.paddingLeft)+s(l.paddingRight),h=s(l.height)+s(l.paddingTop)+s(l.paddingBottom),f=e.getBoundingClientRect(),d=e.dataset.originalPosition||"top",g=r.find(W=>e.classList.contains(W)),T=d==="top"||d==="bottom"?u/2:u,H=d==="top"?h+(d==="top"?i:0):h/2,E=f.top-H<c,G=f.bottom+(d==="bottom"?h+i:0)>window.innerHeight,N=f.right+T+i>n,k=f.left-T-i<0,Y=f.left+u/2+i>n,B=f.left-u/2-i<0;if(d!==g&&!(N||k||E||G||Y||B)){e.classList.remove(...r),e.classList.add(d);return}let C=d;N&&Y?C="left":k&&B?C="right":N&&E||k&&E?C=Y&&"left"||B&&"right"||"bottom":N!==k&&!G?C=N?"left":"right":E&&["top","left","right"].includes(d)?C="bottom":G&&["bottom","left","right"].includes(d)&&(C="top"),g!==C&&(e.classList.remove(...r),e.classList.add(C))},O=function(e){let r=e.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let n=(i,c)=>{if(c!=null)for(let l of r)l.hasAttribute(i)||l.setAttribute(i,c)};for(let i of fe)n(i,this.getAttribute(i));n("data-promotion-code",U(this))},Ft=function(e){let r=this.closest(".section");if(!r)return;let n=this.parentElement;for(;n.matches("strong, em")&&n.childElementCount===1&&n.firstElementChild===this&&n.textContent.trim()===this.textContent.trim();)n.replaceWith(...n.childNodes),n=this.parentElement;let i=this;for(;i.parentElement!==r;)i=i.parentElement;let c=/^button-(s|m|l|xl|xxl)$/,l=[...i.querySelectorAll(".con-button")].find(d=>!this.contains(d)&&[...d.classList].some(g=>c.test(g))),s,u=[];if(l)s=[...l.classList].find(d=>c.test(d)),u=[...l.classList].filter(d=>d.startsWith("button-")&&!c.test(d));else{let d=[...i.classList].find(g=>/^(s|m|l|xl|xxl)-button$/.test(g));d?s=`button-${d.split("-")[0]}`:i.classList.contains("hero-marquee")?(s="button-xl",u=["button-justified-mobile"]):i.matches(".accordion, .media")||(s=i.matches(".large, .xlarge")?"button-xl":"button-l")}for(let d of this.merchLink?.matchAll(/(?:&|#)_button-([a-zA-Z-]+)/g)??[])u.push(d[1]);let h=e.matches(".con-button")?[e]:e.querySelectorAll(".con-button");for(let d of h)s&&![...d.classList].some(g=>c.test(g))&&d.classList.add(s),d.classList.add(...u);let f=this.closest("p");f&&(h.length||[...f.childNodes].every(d=>d===this||d.nodeType===Node.TEXT_NODE&&!d.textContent.trim()))&&f.classList.add("action-area")},$t=function(e,r=!1){let i=[...new DOMParser().parseFromString(e,"text/html").body.querySelectorAll("a")];if(!i.length)return null;if(r)return Z(i[0]);let c=document.createElement("div");return c.setAttribute("slot","footer"),c.classList.add("action-area"),c.append(...i.map(l=>Z(l))),c},w=function(e){if(typeof e!="string")return e;let r=e.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return e;let i=r.slice(3,-4);return i.includes("<p>")?e:i};customElements.define(ct,et);export{he as CHECKOUT_STYLE_PATTERN,Te as checkoutOptionsProvider,Ae as priceOptionsProvider,Pt as renderImageMarkup,Ot as stripTrialCtas};
