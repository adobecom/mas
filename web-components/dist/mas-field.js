var Lt=Object.defineProperty;var tt=e=>{throw TypeError(e)};var xt=(e,o,t)=>o in e?Lt(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t;var Y=(e,o,t)=>xt(e,typeof o!="symbol"?o+"":o,t),F=(e,o,t)=>o.has(e)||tt("Cannot "+t);var p=(e,o,t)=>(F(e,o,"read from private field"),t?t.call(e):o.get(e)),S=(e,o,t)=>o.has(e)?tt("Cannot add the same private member more than once"):o instanceof WeakSet?o.add(e):o.set(e,t),g=(e,o,t,n)=>(F(e,o,"write to private field"),n?n.call(e,t):o.set(e,t),t),c=(e,o,t)=>(F(e,o,"access private method"),t);var Xt=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),Zt=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var Rt='span[is="inline-price"][data-wcs-osi]',Ct='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Nt='a[is="upt-link"]',Qt=`${Rt},${Ct},${Nt}`,et=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var P="aem:load";var ot="mas:ready";var Jt=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var te=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var nt="legal",rt="plan-type-text",it="mas-ff-defaults";var wt="mas-commerce-service";function st(){return document.getElementsByTagName(wt)?.[0]}function at(e){let o=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&o?.isInlinePrice&&o?.dataset?.template==="price"}var Ot=[".","!","?"],Mt=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=Mt,document.head.append(e)}var Pt="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function yt(e){let o=e.closest(Pt)??e.parentNode,t=document.createRange();return t.setStart(o,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function ct(e){let o=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(n=>!n.closest("merch-addon"));return(o.find(n=>n.dataset.promotionCode&&n.dataset.promotionCode!=="cancel-context")??o[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function It(e){let o=yt(e);return!o||Ot.includes(o)?"upper":"lower"}function V(e,o){if(e.dataset.placeholder!==rt)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(o.wcsOsi=t,o.planTypeCase=It(e))}function vt(e,o){if(typeof e!="string"||!e)return null;let t;try{t=new URL(e,o)}catch{return null}return t.hostname.endsWith(".aem.page")?`${o}${t.pathname}${t.search}`:null}function $(e){if(typeof e!="string"||!e)return"";try{return new URL(e).href}catch{return""}}function Dt(e){if(typeof e!="string"||!e)return!1;try{return new URL(e).hostname.endsWith(".aem.page")}catch{return!1}}var Ht={png:{type:"image/png",format:"png"},jpg:{type:"image/jpeg",format:"jpg"},jpeg:{type:"image/jpeg",format:"jpg"}},y={width:2e3,media:"(min-width: 600px)"},lt=750;function I(e,o,t){let n=new URL(e);return n.searchParams.set("width",o),n.searchParams.set("format",t),n.searchParams.set("optimize","medium"),n.href}function Ut(e){let o=new URL(e).pathname.split(".").pop().toLowerCase();return Ht[o]??null}function dt(e){if(!Dt(e))return"";let o=$(e),t=Ut(o);if(!t)return"";let{type:n,format:r}=t;return[`<source type="image/webp" srcset="${I(o,y.width,"webply")}" media="${y.media}">`,`<source type="image/webp" srcset="${I(o,lt,"webply")}">`,`<source type="${n}" srcset="${I(o,y.width,r)}" media="${y.media}">`,`<img loading="lazy" alt="" src="${I(o,lt,r)}">`].join("")}function kt(e){let o=e?.hostname??"";return o==="www.adobe.com"||o==="adobe.com"||o.endsWith(".aem.live")}function pt(e,o=globalThis.location){if(typeof e!="string"||!e||!kt(o))return e;let t=document.createElement("template");return t.innerHTML=`<picture>${e}</picture>`,t.content.querySelectorAll("source[srcset], img[src]").forEach(n=>{let r=n.tagName==="IMG"?"src":"srcset",i=vt(n.getAttribute(r),o.origin);i&&n.setAttribute(r,i)}),t.content.querySelector("picture").innerHTML}var Yt="(min-width: 1200px)",Ft="(min-width: 600px)";function ut(e,o){if(!e)return"";let t=new DOMParser().parseFromString(`<picture>${e}</picture>`,"text/html");if(o==="desktop")return t.querySelector(`source[media="${Yt}"]`)?.getAttribute("srcset")??"";if(o==="tablet")return t.querySelector(`source[media="${Ft}"]`)?.getAttribute("srcset")??"";if(o==="mobile"){let n=t.querySelector("img");return n?.hasAttribute("data-mobile-set")?n.getAttribute("src")??"":""}return""}var Z="mas-field",$t=/(accent|primary|secondary)(-(outline|link))?/,Gt=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function Q(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")?e.getAttribute("data-promotion-code"):null}function mt(e,o){let t=document.createElement("template");t.innerHTML=e;let n=[...t.content.querySelectorAll("a")],r=n.filter(i=>et.has(i.dataset.analyticsId));return r.length===0?e:r.length===n.length?o?null:e:(r.forEach(i=>i.remove()),t.innerHTML)}function ht(e,o){if(!e)return o;let t=e.closest(Z);if(!(t||e.hasAttribute("fragment-id")))return o;o[it]=!0,o.wrapClauses=!0;let r=t?.aemFragment?.data?.priceLiterals;if(r&&(o.literals??(o.literals={}),Object.assign(o.literals,r)),at(e)&&(o.displayPerUnit=!1,o.displayTax=!1),t&&e.dataset.template===nt&&(o.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!o.promotionCode){let i=e.dataset.promotionCode??(t?Q(t):null);i&&(o.promotionCode=i)}o.displayAnnual===void 0&&typeof t?.settings?.displayAnnual=="boolean"&&(o.displayAnnual=t.settings.displayAnnual)}function Bt(e,o){if(o.promotionCode||!e)return;let t=e.closest(Z),n=e.dataset.promotionCode??(t?Q(t):null);n&&(o.promotionCode=n)}function Wt(e){!e?.providers||e.providers.has(ht)||(e.providers.price(ht),e.providers.checkout(Bt),e.providers.has(V)||e.providers.price(V))}var qt=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=qt,document.head.append(e)}function ft(e,o=globalThis.location){return typeof e!="string"||!e?"":`<picture>${pt(e,o)}</picture>`}var b,N,_,f,w,s,v,B,W,q,Et,At,K,j,Tt,z,X,gt,R,_t,St,C,G=class extends HTMLElement{constructor(){super(...arguments);S(this,s);S(this,b,null);S(this,N,!1);S(this,_,null);Y(this,"settings",null);S(this,f,null);Y(this,"compatVersion");S(this,w,t=>{t.target===this.aemFragment&&(g(this,_,t.detail?.fields||null),this.settings=t.detail?.settings??null,g(this,N,!0),c(this,s,j).call(this),this.dispatchEvent(new CustomEvent(ot,{bubbles:!0,composed:!0,detail:t.detail})))})}static get observedAttributes(){return["field"]}attributeChangedCallback(t,n,r){t==="field"&&(g(this,b,r),c(this,s,j).call(this))}connectedCallback(){this.addEventListener(P,p(this,w)),c(this,s,v).call(this),this.aemFragment?.setAttribute("hidden",""),Wt(st())}disconnectedCallback(){this.removeEventListener(P,p(this,w))}checkReady(){return p(this,N)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(P,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return ct(this)}};b=new WeakMap,N=new WeakMap,_=new WeakMap,f=new WeakMap,w=new WeakMap,s=new WeakSet,v=function(){if(p(this,f)?.isConnected&&p(this,f).matches('[data-role="mas-field-content"]'))return p(this,f);let t=this.querySelector(':scope > [data-role="mas-field-content"]');if(t)return g(this,f,t),t;let n=document.createElement("span");return n.setAttribute("data-role","mas-field-content"),this.append(n),g(this,f,n),n},B=function(){this.querySelector(':scope > [data-role="mas-field-content"]')?.remove(),g(this,f,null)},W=function(t){let n=document.createElement("template");n.innerHTML=t;let r=n.content.querySelector("picture");if(!r)return;r.setAttribute("data-role","mas-field-content");let i=this.querySelector(':scope > [data-role="mas-field-content"]');i?i.replaceWith(r):this.append(r),g(this,f,r),c(this,s,R).call(this,r)},q=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},Et=function(t){let n=t?.match(/^(.+)\[(\d+)\]$/);if(n)return{fieldName:n[1],index:parseInt(n[2],10)};let r=t?.match(/^(.+)\[(.+)\]$/);return r?{fieldName:r[1],index:r[2]}:{fieldName:t,index:null}},At=function(t,n){if(typeof t!="string")return null;let r=document.createElement("template");r.innerHTML=t;let i;if(!isNaN(n)){let l=parseInt(n,10);i=[...r.content.querySelectorAll("a")][l-1]}return i||(i=r.content.querySelector(`a[data-key="${n}"]`)),i?(i.removeAttribute("class"),i.outerHTML):null},K=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},j=function(){if(!p(this,_)||!p(this,b))return;this.hidden=!1;let{fieldName:t,index:n}=c(this,s,Et).call(this,p(this,b));if(n!==null&&isNaN(n)){let a=`${t.replace(/s$/,"")}Labels`,d=p(this,_)[a];if(d!==void 0){let h=(Array.isArray(d)?d:[d]).indexOf(n);if(h===-1){this.hidden=!0;return}let m=p(this,_)[t],u=Array.isArray(m)?m:m?[m]:[],A=c(this,s,q).call(this,u[h]);if(!A){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs&&(A=mt(A,!0),A===null)){this.hidden=!0;return}c(this,s,K).call(this);let L=c(this,s,v).call(this);L.innerHTML=c(this,s,C).call(this,A)??"",c(this,s,z).call(this,L),c(this,s,X).call(this,L),c(this,s,R).call(this,L);return}}let r=c(this,s,q).call(this,p(this,_)[t]);if(r===void 0){this.hidden=!0;return}if(c(this,s,K).call(this),n===null&&(t==="image"||t==="backgroundImage"||t==="backgrounds")){let a=c(this,s,C).call(this,r);if(typeof a=="string"&&a){let d=t==="image"||t==="backgrounds"?a:`<img loading="lazy" alt="" src="${$(a)}">`;c(this,s,W).call(this,ft(d))}else c(this,s,B).call(this),this.hidden=!0;return}if(t==="backgrounds"&&n!==null){let a=c(this,s,C).call(this,ut(r,n)),d=typeof a=="string"&&a?dt(a):"";d?c(this,s,W).call(this,ft(d)):(c(this,s,B).call(this),this.hidden=!0);return}let i=c(this,s,v).call(this),l;if(n!==null){if(l=c(this,s,At).call(this,r,n),l===null){this.hidden=!0;return}}else l=c(this,s,C).call(this,r);if(typeof l=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(l=mt(l,n!==null),l===null)){this.hidden=!0;return}if(p(this,b)==="ctas"){let a=c(this,s,St).call(this,l);if(a){i.replaceChildren(a),c(this,s,R).call(this,i);return}}i.innerHTML=l,c(this,s,z).call(this,i),c(this,s,X).call(this,i),c(this,s,R).call(this,i);return}if(l==null){this.hidden=!0;return}i.textContent=String(l)},Tt=function(t,n){return customElements.get("checkout-link")?.createCheckoutLink(t,n)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${n}</span>`,i})()},z=function(t){for(let n of t.querySelectorAll("a[data-wcs-osi]:not([is])")){let r=c(this,s,Tt).call(this,n.dataset,n.innerHTML);for(let{name:i,value:l}of n.attributes)["is","href"].includes(i)||r.setAttribute(i,l);n.replaceWith(r)}},X=function(t){let n=t.querySelectorAll(".icon-button[data-tooltip]");for(let r of n){if(r.dataset.tooltipWired)continue;r.dataset.tooltipWired="1",r.querySelector("svg")||r.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),r.hasAttribute("tabindex")||r.setAttribute("tabindex","0"),r.hasAttribute("role")||r.setAttribute("role","button"),r.hasAttribute("aria-label")||r.setAttribute("aria-label",r.dataset.tooltip);let i=["top","bottom","left","right"],l=[...r.classList].find(h=>i.includes(h)),a=l||"top";l||r.classList.add(a),r.dataset.originalPosition=a,r.classList.add("hide-tooltip");let d=()=>{r.classList.remove("hide-tooltip"),c(this,s,gt).call(this,r)},E=()=>r.classList.add("hide-tooltip");r.addEventListener("mouseenter",d),r.addEventListener("focus",d),r.addEventListener("mouseleave",E),r.addEventListener("blur",E),r.addEventListener("keydown",h=>{h.key==="Escape"&&E()})}},gt=function(t){let n=["top","bottom","right","left"],r=window.innerWidth,i=12,l=document.querySelector("header")?.getBoundingClientRect().height||0,a=window.getComputedStyle(t,"::before"),d=k=>parseFloat(k)||0,E=d(a.width)+d(a.paddingLeft)+d(a.paddingRight),h=d(a.height)+d(a.paddingTop)+d(a.paddingBottom),m=t.getBoundingClientRect(),u=t.dataset.originalPosition||"top",A=n.find(k=>t.classList.contains(k)),J=u==="top"||u==="bottom"?E/2:E,bt=u==="top"?h+(u==="top"?i:0):h/2,O=m.top-bt<l,D=m.bottom+(u==="bottom"?h+i:0)>window.innerHeight,x=m.right+J+i>r,M=m.left-J-i<0,H=m.left+E/2+i>r,U=m.left-E/2-i<0;if(u!==A&&!(x||M||O||D||H||U)){t.classList.remove(...n),t.classList.add(u);return}let T=u;x&&H?T="left":M&&U?T="right":x&&O||M&&O?T=H&&"left"||U&&"right"||"bottom":x!==M&&!D?T=x?"left":"right":O&&["top","left","right"].includes(u)?T="bottom":D&&["bottom","left","right"].includes(u)&&(T="top"),A!==T&&(t.classList.remove(...n),t.classList.add(T))},R=function(t){let n=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!n.length)return;let r=(i,l)=>{if(l!=null)for(let a of n)a.hasAttribute(i)||a.setAttribute(i,l)};for(let i of Gt)r(i,this.getAttribute(i));r("data-promotion-code",Q(this))},_t=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let i=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let a=document.createElement("a",{is:"checkout-link"});return a.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,a})();for(let{name:a,value:d}of t.attributes)["class","is","href"].includes(a)||i.setAttribute(a,d);if(i.firstElementChild?.classList.add("spectrum-Button-label"),t.className){let a=$t.exec(t.className)?.[0]??"accent",d=a.startsWith("accent");return a.includes("-link")||(i.classList.add("button","con-button"),d?i.classList.add("blue"):a.startsWith("primary")&&!a.includes("-outline")&&i.classList.add("fill")),i}let l=t.parentElement?.tagName;if(l==="STRONG"||l==="EM"){let a=document.createElement(l.toLowerCase());return a.append(i),a}return i},St=function(t){let r=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!r.length)return null;let i=document.createElement("div");return i.setAttribute("slot","footer"),i.append(...r.map(l=>c(this,s,_t).call(this,l))),i},C=function(t){if(typeof t!="string")return t;let n=t.trim();if(!(n.startsWith("<p>")&&n.endsWith("</p>")))return t;let i=n.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(Z,G);export{Bt as checkoutOptionsProvider,ht as priceOptionsProvider,ft as renderImageMarkup};
