var Qt=Object.defineProperty;var gt=e=>{throw TypeError(e)};var Zt=(e,o,t)=>o in e?Qt(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t;var d=(e,o,t)=>Zt(e,typeof o!="symbol"?o+"":o,t),J=(e,o,t)=>o.has(e)||gt("Cannot "+t);var p=(e,o,t)=>(J(e,o,"read from private field"),t?t.call(e):o.get(e)),g=(e,o,t)=>o.has(e)?gt("Cannot add the same private member more than once"):o instanceof WeakSet?o.add(e):o.set(e,t),b=(e,o,t,r)=>(J(e,o,"write to private field"),r?r.call(e,t):o.set(e,t),t),u=(e,o,t)=>(J(e,o,"access private method"),t);var Oe=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),Pe=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var bt='span[is="inline-price"][data-wcs-osi]',Jt='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var te='a[is="upt-link"]',ve=`${bt},${Jt},${te}`,B=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var U="aem:load";var At="mas:ready";var Tt="placeholder-failed",St="placeholder-pending",Lt="placeholder-resolved";var yt="mas:failed",_t="mas:resolved",xt="mas/commerce";var L="failed",_="pending",y="resolved";var tt="X-Request-Id",Ie=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Me=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var Ct="legal",Rt="plan-type-text",wt="mas-ff-defaults";var ee="mas-commerce-service";function v(){return document.getElementsByTagName(ee)?.[0]}function Nt(e){let o=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&o?.isInlinePrice&&o?.dataset?.template==="price"}var oe=[".","!","?"],re=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=re,document.head.append(e)}var ne="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function ie(e){let o=e.closest(ne)??e.parentNode,t=document.createRange();return t.setStart(o,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function Ot(e){let o=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(o.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??o[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function se(e){let o=ie(e);return!o||oe.includes(o)?"upper":"lower"}function et(e,o){if(e.dataset.placeholder!==Rt)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(o.wcsOsi=t,o.planTypeCase=se(e))}function Pt(e,o={},{metadata:t=!0,search:r=!0,storage:n=!0}={}){let i;if(r&&i==null){let s=new URLSearchParams(window.location.search),a=ot(r)?r:e;i=s.get(a)}if(n&&i==null){let s=ot(n)?n:e;i=window.sessionStorage.getItem(s)??window.localStorage.getItem(s)}if(t&&i==null){let s=ce(ot(t)?t:e);i=document.documentElement.querySelector(`meta[name="${s}"]`)?.content}return i??o[e]}var ae=e=>typeof e=="boolean",V=e=>typeof e=="function";var ot=e=>typeof e=="string";function vt(e,o){if(ae(e))return e;let t=String(e);return t==="1"||t==="true"?!0:t==="0"||t==="false"?!1:o}function ce(e=""){return String(e).replace(/(\p{Lowercase_Letter})(\p{Uppercase_Letter})/gu,(o,t,r)=>`${t}-${r}`).replace(/\W+/gu,"-").toLowerCase()}var x={clientId:"merch-at-scale",delimiter:"\xB6",ignoredProperties:["analytics","literals","element"],serializableTypes:["Array","Object"],sampleRate:1,severity:"e",tags:"acom",isProdDomain:!1},It=1e3;function le(e){return e instanceof Error||typeof e?.originatingRequest=="string"}function Mt(e){if(e==null)return;let o=typeof e;if(o==="function")return e.name?`function ${e.name}`:"function";if(o==="object"){if(e instanceof Error)return e.message;if(typeof e.originatingRequest=="string"){let{message:r,originatingRequest:n,status:i}=e;return[r,i,n].filter(Boolean).join(" ")}let t=e[Symbol.toStringTag]??Object.getPrototypeOf(e).constructor.name;if(!x.serializableTypes.includes(t))return t}return e}function ue(e,o){if(!x.ignoredProperties.includes(e))return Mt(o)}var rt={append(e){if(e.level!=="error")return;let{message:o,params:t}=e,r=[],n=[],i=o;t.forEach(f=>{f!=null&&(le(f)?r:n).push(f)}),r.length&&(i+=` ${r.map(Mt).join(" ")}`);let{pathname:s,search:a}=window.location,l=`${x.delimiter}page=${s}${a}`;l.length>It&&(l=`${l.slice(0,It)}<trunc>`),i+=l,n.length&&(i+=`${x.delimiter}facts=`,i+=JSON.stringify(n,ue)),window.lana?.log(i,x)}};function Dt(e){Object.assign(x,Object.fromEntries(Object.entries(e).filter(([o,t])=>o in x&&t!==""&&t!==null&&t!==void 0&&!Number.isNaN(t))))}var kt={LOCAL:"local",PROD:"prod",STAGE:"stage"},nt={DEBUG:"debug",ERROR:"error",INFO:"info",WARN:"warn"},it=new Set,st=new Set,Ht=new Map,Ft={append({level:e,message:o,params:t,timestamp:r,source:n}){console[e](`${r}ms [${n}] %c${o}`,"font-weight: bold;",...t)}},$t={filter:({level:e})=>e!==nt.DEBUG},de={filter:()=>!1};function pe(e,o,t,r,n){return{level:e,message:o,namespace:t,get params(){return r.length===1&&V(r[0])&&(r=r[0](),Array.isArray(r)||(r=[r])),r},source:n,timestamp:performance.now().toFixed(3)}}function fe(e){[...st].every(o=>o(e))&&it.forEach(o=>o(e))}function Bt(e){let o=(Ht.get(e)??0)+1;Ht.set(e,o);let t=`${e} #${o}`,r={id:t,namespace:e,module:n=>Bt(`${r.namespace}/${n}`),updateConfig:Dt};return Object.values(nt).forEach(n=>{r[n]=(i,...s)=>fe(pe(n,i,e,s,t))}),Object.seal(r)}function Y(...e){e.forEach(o=>{let{append:t,filter:r}=o;V(r)&&st.add(r),V(t)&&it.add(t)})}function me(e={}){let{name:o}=e,t=vt(Pt("commerce.debug",{search:!0,storage:!0}),o===kt.LOCAL);return Y(t?Ft:$t),o===kt.PROD&&Y(rt),I}function he(){it.clear(),st.clear()}var I={...Bt(xt),Level:nt,Plugins:{consoleAppender:Ft,debugFilter:$t,quietFilter:de,lanaAppender:rt},init:me,reset:he,use:Y};var Ee="mas-commerce-service",Xe=I.module("utilities");var G=e=>window.setTimeout(e);function at(){return document.getElementsByTagName(Ee)?.[0]}var q=class e extends Error{constructor(o,t,r){if(super(o,{cause:r}),this.name="MasError",t.response){let n=t.response.headers?.get(tt);n&&(t.requestId=n),t.response.status&&(t.status=t.response.status,t.statusText=t.response.statusText),t.response.url&&(t.url=t.response.url)}delete t.response,this.context=t,Error.captureStackTrace&&Error.captureStackTrace(this,e)}toString(){let o=Object.entries(this.context||{}).map(([r,n])=>`${r}: ${JSON.stringify(n)}`).join(", "),t=`${this.name}: ${this.message}`;return o&&(t+=` (${o})`),this.cause&&(t+=`
Caused by: ${this.cause}`),t}};var ge={[L]:Tt,[_]:St,[y]:Lt},be={[L]:yt,[y]:_t},M,z=class{constructor(o){g(this,M);d(this,"changes",new Map);d(this,"connected",!1);d(this,"error");d(this,"log");d(this,"options");d(this,"promises",[]);d(this,"state",_);d(this,"timer",null);d(this,"value");d(this,"version",0);d(this,"wrapperElement");this.wrapperElement=o,this.log=I.module("mas-element")}update(){[L,_,y].forEach(o=>{this.wrapperElement.classList.toggle(ge[o],o===this.state)})}notify(){(this.state===y||this.state===L)&&(this.state===y?this.promises.forEach(({resolve:t})=>t(this.wrapperElement)):this.state===L&&this.promises.forEach(({reject:t})=>t(this.error)),this.promises=[]);let o=this.error;this.error instanceof q&&(o={message:this.error.message,...this.error.context}),this.wrapperElement.dispatchEvent(new CustomEvent(be[this.state],{bubbles:!0,composed:!0,detail:o}))}attributeChangedCallback(o,t,r){this.changes.set(o,r),this.requestUpdate()}connectedCallback(){b(this,M,at()),this.requestUpdate(!0)}disconnectedCallback(){this.connected&&(this.connected=!1,this.log?.debug("Disconnected:",{element:this.wrapperElement}))}onceSettled(){let{error:o,promises:t,state:r}=this;return y===r?Promise.resolve(this.wrapperElement):L===r?Promise.reject(o):new Promise((n,i)=>{t.push({resolve:n,reject:i})})}toggleResolved(o,t,r){return o!==this.version?!1:(r!==void 0&&(this.options=r),this.state=y,this.value=t,this.update(),this.log?.debug("Resolved:",{element:this.wrapperElement,value:t}),G(()=>this.notify()),!0)}toggleFailed(o,t,r){if(o!==this.version)return!1;r!==void 0&&(this.options=r),this.error=t,this.state=L,this.update();let n=this.wrapperElement.getAttribute("is");return this.log?.error(`${n}: Failed to render: ${t.message}`,{element:this.wrapperElement,...t.context,...p(this,M)?.duration}),G(()=>this.notify()),!0}togglePending(o){return this.version++,o&&(this.options=o),this.state=_,this.update(),this.log?.debug("Pending:",{osi:this.wrapperElement?.options?.wcsOsi}),this.version}requestUpdate(o=!1){if(!this.wrapperElement.isConnected||!at()||this.timer)return;let{error:t,options:r,state:n,value:i,version:s}=this;this.state=_,this.timer=G(async()=>{this.timer=null;let a=null;if(this.changes.size&&(a=Object.fromEntries(this.changes.entries()),this.changes.clear()),this.connected?this.log?.debug("Updated:",{element:this.wrapperElement,changes:a}):(this.connected=!0,this.log?.debug("Connected:",{element:this.wrapperElement,changes:a})),a||o)try{await this.wrapperElement.render?.()===!1&&this.state===_&&this.version===s&&(this.state=n,this.error=t,this.value=i,this.update(),this.notify())}catch(l){this.toggleFailed(this.version,l,r)}})}};M=new WeakMap;function Ae(e){return`https://${e==="PRODUCTION"?"www.adobe.com":"www.stage.adobe.com"}/offers/promo-terms.html`}var w,C=class C extends HTMLAnchorElement{constructor(){super();d(this,"masElement",new z(this));g(this,w);this.setAttribute("is",C.is)}get isUptLink(){return!0}initializeWcsData(t,r){this.setAttribute("data-wcs-osi",t),r&&this.setAttribute("data-promotion-code",r)}attributeChangedCallback(t,r,n){this.masElement.attributeChangedCallback(t,r,n)}connectedCallback(){this.masElement.connectedCallback(),b(this,w,v()),p(this,w)&&(this.log=p(this,w).log.module("upt-link"))}disconnectedCallback(){this.masElement.disconnectedCallback(),b(this,w,void 0)}requestUpdate(t=!1){this.masElement.requestUpdate(t)}onceSettled(){return this.masElement.onceSettled()}async render(){let t=v();if(!t)return!1;this.dataset.imsCountry||t.imsCountryPromise.then(s=>{s&&(this.dataset.imsCountry=s)});let r=t.collectCheckoutOptions({},this);if(!r.wcsOsi)return this.log.error("Missing 'data-wcs-osi' attribute on upt-link."),!1;let n=this.masElement.togglePending(r),i=t.resolveOfferSelectors(r);try{let[[s]]=await Promise.all(i),{country:a,language:l,env:f}=r,h=`locale=${l}_${a}&country=${a}&offer_id=${s.offerId}`,m=this.getAttribute("data-promotion-code");m&&(h+=`&promotion_code=${encodeURIComponent(m)}`),this.href=`${Ae(f)}?${h}`,this.masElement.toggleResolved(n,s,r)}catch(s){let a=new Error(`Could not resolve offer selectors for id: ${r.wcsOsi}.`,s.message);return this.masElement.toggleFailed(n,a,r),!1}}static createFrom(t){let r=new C;for(let n of t.attributes)n.name!=="is"&&(n.name==="class"&&n.value.includes("upt-link")?r.setAttribute("class",n.value.replace("upt-link","").trim()):r.setAttribute(n.name,n.value));return r.innerHTML=t.innerHTML,r.setAttribute("tabindex",0),r}};w=new WeakMap,d(C,"is","upt-link"),d(C,"tag","a"),d(C,"observedAttributes",["data-wcs-osi","data-promotion-code","data-ims-country"]);var R=C;window.customElements.get(R.is)||window.customElements.define(R.is,R,{extends:R.tag});function Ut(e){let o=e.cardName||e.cardTitle||"";return typeof o!="string"?"":Te(o).replace(/\s+/g," ").trim()}function Vt(e,o){if(!o||e.hasAttribute("aria-label"))return;let t=e.textContent?.trim();t&&(t.toLowerCase().includes(o.toLowerCase())||e.setAttribute("aria-label",`${t} for ${o}`))}function Te(e){if(!e)return"";let o="",t=!1;for(let r of e){if(r==="<"&&(t=!0),r===">"){t=!1;continue}t||(o+=r)}return o}var mt="mas-field",Le=/(accent|primary|secondary)(-(outline|link))?/,ye=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function ht(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")?e.getAttribute("data-promotion-code"):null}function Yt(e,o){let t=document.createElement("template");t.innerHTML=e;let r=[...t.content.querySelectorAll("a")],n=r.filter(i=>B.has(i.dataset.analyticsId));return n.length===0?e:n.length===r.length?o?null:e:(n.forEach(i=>i.remove()),t.innerHTML)}function Gt(e,o){if(!e)return o;let t=e.closest(mt);if(!(t||e.hasAttribute("fragment-id")))return o;o[wt]=!0,o.wrapClauses=!0;let n=t?.aemFragment?.data?.priceLiterals;if(n&&(o.literals??(o.literals={}),Object.assign(o.literals,n)),Nt(e)&&(o.displayPerUnit=!1,o.displayTax=!1),t&&e.dataset.template===Ct&&(o.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!o.promotionCode){let i=e.dataset.promotionCode??(t?ht(t):null);i&&(o.promotionCode=i)}o.displayAnnual===void 0&&typeof t?.settings?.displayAnnual=="boolean"&&(o.displayAnnual=t.settings.displayAnnual)}function _e(e,o){if(o.promotionCode||!e)return;let t=e.closest(mt),r=e.dataset.promotionCode??(t?ht(t):null);r&&(o.promotionCode=r)}function xe(e){!e?.providers||e.providers.has(Gt)||(e.providers.price(Gt),e.providers.checkout(_e),e.providers.has(et)||e.providers.price(et))}var Ce=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=Ce,document.head.append(e)}var N,D,A,O,k,c,W,lt,qt,zt,ut,dt,pt,Wt,j,jt,Kt,ft,ct=class extends HTMLElement{constructor(){super(...arguments);g(this,c);g(this,N,null);g(this,D,!1);g(this,A,null);d(this,"settings",null);g(this,O,null);d(this,"compatVersion");g(this,k,t=>{t.target===this.aemFragment&&(b(this,A,t.detail?.fields||null),this.settings=t.detail?.settings??null,b(this,D,!0),u(this,c,dt).call(this),this.dispatchEvent(new CustomEvent(At,{bubbles:!0,composed:!0,detail:t.detail})))})}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,n){t==="field"&&(b(this,N,n),u(this,c,dt).call(this))}connectedCallback(){this.addEventListener(U,p(this,k)),u(this,c,W).call(this),this.aemFragment?.setAttribute("hidden",""),xe(v())}disconnectedCallback(){this.removeEventListener(U,p(this,k))}checkReady(){return p(this,D)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(U,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return Ot(this)}};N=new WeakMap,D=new WeakMap,A=new WeakMap,O=new WeakMap,k=new WeakMap,c=new WeakSet,W=function(){if(p(this,O)?.isConnected)return p(this,O);let t=this.querySelector(':scope > span[data-role="mas-field-content"]');if(t)return b(this,O,t),t;let r=document.createElement("span");return r.setAttribute("data-role","mas-field-content"),this.append(r),b(this,O,r),r},lt=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},qt=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let n=t?.match(/^(.+)\[(.+)\]$/);return n?{fieldName:n[1],index:n[2]}:{fieldName:t,index:null}},zt=function(t,r){if(typeof t!="string")return null;let n=document.createElement("template");n.innerHTML=t;let i;if(!isNaN(r)){let s=parseInt(r,10);i=[...n.content.querySelectorAll("a")][s-1]}return i||(i=n.content.querySelector(`a[data-key="${r}"]`)),i?(i.removeAttribute("class"),i.outerHTML):null},ut=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},dt=function(){if(!p(this,A)||!p(this,N))return;this.hidden=!1;let{fieldName:t,index:r}=u(this,c,qt).call(this,p(this,N));if(r!==null&&isNaN(r)){let a=`${t.replace(/s$/,"")}Labels`,l=p(this,A)[a];if(l!==void 0){let h=(Array.isArray(l)?l:[l]).indexOf(r);if(h===-1){this.hidden=!0;return}let m=p(this,A)[t],E=Array.isArray(m)?m:m?[m]:[],T=u(this,c,lt).call(this,E[h]);if(!T){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs&&(T=Yt(T,!0),T===null)){this.hidden=!0;return}u(this,c,ut).call(this);let H=u(this,c,W).call(this);H.innerHTML=u(this,c,ft).call(this,T)??"",u(this,c,pt).call(this,H),u(this,c,j).call(this,H);return}}let n=u(this,c,lt).call(this,p(this,A)[t]);if(n===void 0){this.hidden=!0;return}u(this,c,ut).call(this);let i=u(this,c,W).call(this),s;if(r!==null){if(s=u(this,c,zt).call(this,n,r),s===null){this.hidden=!0;return}}else s=u(this,c,ft).call(this,n);if(typeof s=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(s=Yt(s,r!==null),s===null)){this.hidden=!0;return}if(p(this,N)==="ctas"){let a=u(this,c,Kt).call(this,s);if(a){i.replaceChildren(a),u(this,c,j).call(this,i);return}}i.innerHTML=s,u(this,c,pt).call(this,i),u(this,c,j).call(this,i);return}if(s==null){this.hidden=!0;return}i.textContent=String(s)},pt=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let n of r){if(n.dataset.tooltipWired)continue;n.dataset.tooltipWired="1",n.querySelector("svg")||n.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),n.hasAttribute("tabindex")||n.setAttribute("tabindex","0"),n.hasAttribute("role")||n.setAttribute("role","button"),n.hasAttribute("aria-label")||n.setAttribute("aria-label",n.dataset.tooltip);let i=["top","bottom","left","right"],s=[...n.classList].find(h=>i.includes(h)),a=s||"top";s||n.classList.add(a),n.dataset.originalPosition=a,n.classList.add("hide-tooltip");let l=()=>{n.classList.remove("hide-tooltip"),u(this,c,Wt).call(this,n)},f=()=>n.classList.add("hide-tooltip");n.addEventListener("mouseenter",l),n.addEventListener("focus",l),n.addEventListener("mouseleave",f),n.addEventListener("blur",f),n.addEventListener("keydown",h=>{h.key==="Escape"&&f()})}},Wt=function(t){let r=["top","bottom","right","left"],n=window.innerWidth,i=12,s=document.querySelector("header")?.getBoundingClientRect().height||0,a=window.getComputedStyle(t,"::before"),l=Z=>parseFloat(Z)||0,f=l(a.width)+l(a.paddingLeft)+l(a.paddingRight),h=l(a.height)+l(a.paddingTop)+l(a.paddingBottom),m=t.getBoundingClientRect(),E=t.dataset.originalPosition||"top",T=r.find(Z=>t.classList.contains(Z)),Et=E==="top"||E==="bottom"?f/2:f,Xt=E==="top"?h+(E==="top"?i:0):h/2,F=m.top-Xt<s,K=m.bottom+(E==="bottom"?h+i:0)>window.innerHeight,P=m.right+Et+i>n,$=m.left-Et-i<0,X=m.left+f/2+i>n,Q=m.left-f/2-i<0;if(E!==T&&!(P||$||F||K||X||Q)){t.classList.remove(...r),t.classList.add(E);return}let S=E;P&&X?S="left":$&&Q?S="right":P&&F||$&&F?S=X&&"left"||Q&&"right"||"bottom":P!==$&&!K?S=P?"left":"right":F&&["top","left","right"].includes(E)?S="bottom":K&&["bottom","left","right"].includes(E)&&(S="top"),T!==S&&(t.classList.remove(...r),t.classList.add(S))},j=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let n=(i,s)=>{if(s!=null)for(let a of r)a.hasAttribute(i)||a.setAttribute(i,s)};for(let i of ye)n(i,this.getAttribute(i));n("data-promotion-code",ht(this))},jt=function(t){if(B.has(t.dataset.analyticsId)&&Vt(t,Ut(p(this,A)??{})),!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let i=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let a=document.createElement("a",{is:"checkout-link"});return a.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,a})();for(let{name:a,value:l}of t.attributes)["class","is","href"].includes(a)||i.setAttribute(a,l);if(i.firstElementChild?.classList.add("spectrum-Button-label"),t.className){let a=Le.exec(t.className)?.[0]??"accent",l=a.startsWith("accent");return a.includes("-link")||(i.classList.add("button","con-button"),l?i.classList.add("blue"):a.startsWith("primary")&&!a.includes("-outline")&&i.classList.add("fill")),i}let s=t.parentElement?.tagName;if(s==="STRONG"||s==="EM"){let a=document.createElement(s.toLowerCase());return a.append(i),a}return i},Kt=function(t){let n=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!n.length)return null;let i=document.createElement("div");return i.setAttribute("slot","footer"),i.append(...n.map(s=>u(this,c,jt).call(this,s))),i},ft=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let i=r.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(mt,ct);export{_e as checkoutOptionsProvider,Gt as priceOptionsProvider};
