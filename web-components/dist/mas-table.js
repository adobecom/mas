var ce=Object.defineProperty;var se=t=>{throw TypeError(t)};var pr=(t,r,e)=>r in t?ce(t,r,{enumerable:!0,configurable:!0,writable:!0,value:e}):t[r]=e;var ur=(t,r)=>()=>(t&&(r=t(t=0)),r);var gr=(t,r)=>{for(var e in r)ce(t,e,{get:r[e],enumerable:!0})};var w=(t,r,e)=>pr(t,typeof r!="symbol"?r+"":r,e),le=(t,r,e)=>r.has(t)||se("Cannot "+e);var f=(t,r,e)=>(le(t,r,"read from private field"),e?e.call(t):r.get(t)),S=(t,r,e)=>r.has(t)?se("Cannot add the same private member more than once"):r instanceof WeakSet?r.add(t):r.set(t,e),L=(t,r,e,n)=>(le(t,r,"write to private field"),n?n.call(t,e):r.set(t,e),e);var de=(t,r,e,n)=>({set _(o){L(t,r,o,e)},get _(){return f(t,r,n)}});var Me={};gr(Me,{default:()=>ct});import{LitElement as Mr,html as at,css as Or}from"./lit-all.min.js";import{unsafeHTML as Pr}from"./lit-all.min.js";function Ir(){return customElements.get("sp-tooltip")!==void 0&&customElements.get("overlay-trigger")!==void 0&&document.querySelector("sp-theme")!==null}var N,ct,Oe=ur(()=>{N=class N extends Mr{constructor(){super(),this.content="",this.placement="top",this.variant="info",this.size="xs",this.tooltipVisible=!1,this.lastPointerType=null,this.handleClickOutside=this.handleClickOutside.bind(this)}connectedCallback(){super.connectedCallback(),window.addEventListener("mousedown",this.handleClickOutside)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("mousedown",this.handleClickOutside)}handleClickOutside(r){let e=r.composedPath();N.activeTooltip===this&&!e.includes(this)&&this.hideTooltip()}showTooltip(){N.activeTooltip&&N.activeTooltip!==this&&(N.activeTooltip.closeOverlay(),N.activeTooltip.tooltipVisible=!1,N.activeTooltip.requestUpdate()),N.activeTooltip=this,this.tooltipVisible=!0}hideTooltip(){N.activeTooltip===this&&(N.activeTooltip=null),this.tooltipVisible=!1}handleTap(r){r.preventDefault(),this.tooltipVisible?this.hideTooltip():this.showTooltip()}closeOverlay(){let r=this.shadowRoot?.querySelector("overlay-trigger");r?.open!==void 0&&(r.open=!1)}get effectiveContent(){return this.tooltipText||this.mnemonicText||this.content||""}get effectivePlacement(){return this.tooltipPlacement||this.mnemonicPlacement||this.placement||"top"}renderIcon(){return this.src?this.src.startsWith("sp-icon-")?at`${Pr(`<${this.src} size="${this.size||"m"}"></${this.src}>`)}`:at`<merch-icon
            src="${this.src}"
            size="${this.size}"
        ></merch-icon>`:at`<slot></slot>`}render(){let r=this.effectiveContent,e=this.effectivePlacement;return r?Ir()?at`
                <overlay-trigger
                    placement="${e}"
                    @sp-opened=${()=>this.showTooltip()}
                >
                    <span slot="trigger">${this.renderIcon()}</span>
                    <sp-tooltip
                        placement="${e}"
                        variant="${this.variant}"
                    >
                        ${r}
                    </sp-tooltip>
                </overlay-trigger>
            `:at`
                <span
                    class="css-tooltip ${e} ${this.tooltipVisible?"tooltip-visible":""}"
                    data-tooltip="${r}"
                    tabindex="0"
                    role="img"
                    aria-label="${r}"
                    @pointerdown=${o=>{this.lastPointerType=o.pointerType}}
                    @pointerenter=${o=>o.pointerType!=="touch"&&this.showTooltip()}
                    @pointerleave=${o=>o.pointerType!=="touch"&&this.hideTooltip()}
                    @click=${o=>{this.lastPointerType==="touch"&&this.handleTap(o),this.lastPointerType=null}}
                >
                    ${this.renderIcon()}
                </span>
            `:this.renderIcon()}};w(N,"activeTooltip",null),w(N,"properties",{content:{type:String},placement:{type:String},variant:{type:String},src:{type:String},size:{type:String},tooltipText:{type:String,attribute:"tooltip-text"},tooltipPlacement:{type:String,attribute:"tooltip-placement"},mnemonicText:{type:String,attribute:"mnemonic-text"},mnemonicPlacement:{type:String,attribute:"mnemonic-placement"},tooltipVisible:{type:Boolean,state:!0}}),w(N,"styles",Or`
        :host {
            display: contents;
            overflow: visible;
        }

        /* CSS tooltip styles - these are local fallbacks, main styles in global.css.js */
        .css-tooltip {
            position: relative;
            display: inline-block;
            cursor: pointer;
        }

        .css-tooltip[data-tooltip]::before {
            content: attr(data-tooltip);
            position: absolute;
            z-index: 999;
            background: var(--spectrum-gray-800, #323232);
            color: #fff;
            padding: var(--mas-mnemonic-tooltip-padding, 8px 12px);
            border-radius: 4px;
            white-space: normal;
            width: max-content;
            max-width: 60px;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition:
                opacity 0.2s ease,
                visibility 0.2s ease;
            font-size: 12px;
            line-height: 1.4;
            text-align: center;
        }

        .css-tooltip[data-tooltip]::after {
            content: '';
            position: absolute;
            z-index: 999;
            width: 0;
            height: 0;
            border: 6px solid transparent;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition:
                opacity 0.1s ease,
                visibility 0.1s ease;
        }

        .css-tooltip.tooltip-visible[data-tooltip]::before,
        .css-tooltip.tooltip-visible[data-tooltip]::after,
        .css-tooltip:focus-visible[data-tooltip]::before,
        .css-tooltip:focus-visible[data-tooltip]::after {
            opacity: 1;
            visibility: visible;
        }

        /* Position variants */
        .css-tooltip.top[data-tooltip]::before {
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 16px;
        }

        .css-tooltip.top[data-tooltip]::after {
            top: -80%;
            left: 50%;
            transform: translateX(-50%);
            border-color: var(--spectrum-gray-800, #323232) transparent
                transparent transparent;
        }

        .css-tooltip.bottom[data-tooltip]::before {
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 10px;
        }

        .css-tooltip.bottom[data-tooltip]::after {
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 5px;
            border-bottom-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip.left[data-tooltip]::before {
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-right: 10px;
            left: var(--tooltip-left-offset, auto);
        }

        .css-tooltip.left[data-tooltip]::after {
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-right: 5px;
            border-left-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip.right[data-tooltip]::before {
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-left: 10px;
        }

        .css-tooltip.right[data-tooltip]::after {
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-left: 5px;
            border-right-color: var(--spectrum-gray-800, #323232);
        }
    `);ct=N;customElements.define("mas-mnemonic",ct)});var so=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),lo=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var _='span[is="inline-price"][data-wcs-osi]',fr='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var br='a[is="upt-link"]',Ht=`${_},${fr},${br}`;var Dt="merch-quantity-selector:change";var gt="aem:load",ft="aem:error",he="mas:ready",me="mas:error",pe="placeholder-failed",ue="placeholder-pending",ge="placeholder-resolved";var fe="mas:failed",be="mas:resolved",ye="mas/commerce";var P="failed",F="pending",I="resolved";var $t="X-Request-Id",ho=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var mo=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var Ee=":start",ve=":duration";var Y="legal";var yr="mas-commerce-service";function bt(t,r){let e;return function(){let n=this,o=arguments;clearTimeout(e),e=setTimeout(()=>t.apply(n,o),r)}}function k(t,r={},e=null,n=null){let o=n?document.createElement(t,{is:n}):document.createElement(t);e instanceof HTMLElement?o.appendChild(e):o.innerHTML=e;for(let[i,a]of Object.entries(r))o.setAttribute(i,a);return o}function xe(t){return`startTime:${t.startTime.toFixed(2)}|duration:${t.duration.toFixed(2)}`}function nt(){return document.getElementsByTagName(yr)?.[0]}function we(t,r={},{metadata:e=!0,search:n=!0,storage:o=!0}={}){let i;if(n&&i==null){let a=new URLSearchParams(window.location.search),c=qt(n)?n:t;i=a.get(c)}if(o&&i==null){let a=qt(o)?o:t;i=window.sessionStorage.getItem(a)??window.localStorage.getItem(a)}if(e&&i==null){let a=vr(qt(e)?e:t);i=document.documentElement.querySelector(`meta[name="${a}"]`)?.content}return i??r[t]}var Er=t=>typeof t=="boolean",yt=t=>typeof t=="function";var qt=t=>typeof t=="string";function Ae(t,r){if(Er(t))return t;let e=String(t);return e==="1"||e==="true"?!0:e==="0"||e==="false"?!1:r}function vr(t=""){return String(t).replace(/(\p{Lowercase_Letter})(\p{Uppercase_Letter})/gu,(r,e,n)=>`${e}-${n}`).replace(/\W+/gu,"-").toLowerCase()}var B={clientId:"merch-at-scale",delimiter:"\xB6",ignoredProperties:["analytics","literals","element"],serializableTypes:["Array","Object"],sampleRate:1,severity:"e",tags:"acom",isProdDomain:!1},Te=1e3;function xr(t){return t instanceof Error||typeof t?.originatingRequest=="string"}function Se(t){if(t==null)return;let r=typeof t;if(r==="function")return t.name?`function ${t.name}`:"function";if(r==="object"){if(t instanceof Error)return t.message;if(typeof t.originatingRequest=="string"){let{message:n,originatingRequest:o,status:i}=t;return[n,i,o].filter(Boolean).join(" ")}let e=t[Symbol.toStringTag]??Object.getPrototypeOf(t).constructor.name;if(!B.serializableTypes.includes(e))return e}return t}function wr(t,r){if(!B.ignoredProperties.includes(t))return Se(r)}var zt={append(t){if(t.level!=="error")return;let{message:r,params:e}=t,n=[],o=[],i=r;e.forEach(l=>{l!=null&&(xr(l)?n:o).push(l)}),n.length&&(i+=" "+n.map(Se).join(" "));let{pathname:a,search:c}=window.location,s=`${B.delimiter}page=${a}${c}`;s.length>Te&&(s=`${s.slice(0,Te)}<trunc>`),i+=s,o.length&&(i+=`${B.delimiter}facts=`,i+=JSON.stringify(o,wr)),window.lana?.log(i,B)}};function Le(t){Object.assign(B,Object.fromEntries(Object.entries(t).filter(([r,e])=>r in B&&e!==""&&e!==null&&e!==void 0&&!Number.isNaN(e))))}var Ce={LOCAL:"local",PROD:"prod",STAGE:"stage"},Ft={DEBUG:"debug",ERROR:"error",INFO:"info",WARN:"warn"},Bt=new Set,Ut=new Set,Ne=new Map,_e={append({level:t,message:r,params:e,timestamp:n,source:o}){console[t](`${n}ms [${o}] %c${r}`,"font-weight: bold;",...e)}},Re={filter:({level:t})=>t!==Ft.DEBUG},Ar={filter:()=>!1};function Tr(t,r,e,n,o){return{level:t,message:r,namespace:e,get params(){return n.length===1&&yt(n[0])&&(n=n[0](),Array.isArray(n)||(n=[n])),n},source:o,timestamp:performance.now().toFixed(3)}}function Sr(t){[...Ut].every(r=>r(t))&&Bt.forEach(r=>r(t))}function ke(t){let r=(Ne.get(t)??0)+1;Ne.set(t,r);let e=`${t} #${r}`,n={id:e,namespace:t,module:o=>ke(`${n.namespace}/${o}`),updateConfig:Le};return Object.values(Ft).forEach(o=>{n[o]=(i,...a)=>Sr(Tr(o,i,t,a,e))}),Object.seal(n)}function Et(...t){t.forEach(r=>{let{append:e,filter:n}=r;yt(n)&&Ut.add(n),yt(e)&&Bt.add(e)})}function Lr(t={}){let{name:r}=t,e=Ae(we("commerce.debug",{search:!0,storage:!0}),r===Ce.LOCAL);return Et(e?_e:Re),r===Ce.PROD&&Et(zt),ot}function Cr(){Bt.clear(),Ut.clear()}var ot={...ke(ye),Level:Ft,Plugins:{consoleAppender:_e,debugFilter:Re,quietFilter:Ar,lanaAppender:zt},init:Lr,reset:Cr,use:Et};var Nr="mas-commerce-service",So=ot.module("utilities");var vt=t=>window.setTimeout(t);function Vt(){return document.getElementsByTagName(Nr)?.[0]}var xt=class t extends Error{constructor(r,e,n){if(super(r,{cause:n}),this.name="MasError",e.response){let o=e.response.headers?.get($t);o&&(e.requestId=o),e.response.status&&(e.status=e.response.status,e.statusText=e.response.statusText),e.response.url&&(e.url=e.response.url)}delete e.response,this.context=e,Error.captureStackTrace&&Error.captureStackTrace(this,t)}toString(){let r=Object.entries(this.context||{}).map(([n,o])=>`${n}: ${JSON.stringify(o)}`).join(", "),e=`${this.name}: ${this.message}`;return r&&(e+=` (${r})`),this.cause&&(e+=`
Caused by: ${this.cause}`),e}};var _r={[P]:pe,[F]:ue,[I]:ge},Rr={[P]:fe,[I]:be},it,wt=class{constructor(r){S(this,it);w(this,"changes",new Map);w(this,"connected",!1);w(this,"error");w(this,"log");w(this,"options");w(this,"promises",[]);w(this,"state",F);w(this,"timer",null);w(this,"value");w(this,"version",0);w(this,"wrapperElement");this.wrapperElement=r,this.log=ot.module("mas-element")}update(){[P,F,I].forEach(r=>{this.wrapperElement.classList.toggle(_r[r],r===this.state)})}notify(){(this.state===I||this.state===P)&&(this.state===I?this.promises.forEach(({resolve:e})=>e(this.wrapperElement)):this.state===P&&this.promises.forEach(({reject:e})=>e(this.error)),this.promises=[]);let r=this.error;this.error instanceof xt&&(r={message:this.error.message,...this.error.context}),this.wrapperElement.dispatchEvent(new CustomEvent(Rr[this.state],{bubbles:!0,composed:!0,detail:r}))}attributeChangedCallback(r,e,n){this.changes.set(r,n),this.requestUpdate()}connectedCallback(){L(this,it,Vt()),this.requestUpdate(!0)}disconnectedCallback(){this.connected&&(this.connected=!1,this.log?.debug("Disconnected:",{element:this.wrapperElement}))}onceSettled(){let{error:r,promises:e,state:n}=this;return I===n?Promise.resolve(this.wrapperElement):P===n?Promise.reject(r):new Promise((o,i)=>{e.push({resolve:o,reject:i})})}toggleResolved(r,e,n){return r!==this.version?!1:(n!==void 0&&(this.options=n),this.state=I,this.value=e,this.update(),this.log?.debug("Resolved:",{element:this.wrapperElement,value:e}),vt(()=>this.notify()),!0)}toggleFailed(r,e,n){if(r!==this.version)return!1;n!==void 0&&(this.options=n),this.error=e,this.state=P,this.update();let o=this.wrapperElement.getAttribute("is");return this.log?.error(`${o}: Failed to render: ${e.message}`,{element:this.wrapperElement,...e.context,...f(this,it)?.duration}),vt(()=>this.notify()),!0}togglePending(r){return this.version++,r&&(this.options=r),this.state=F,this.update(),this.log?.debug("Pending:",{osi:this.wrapperElement?.options?.wcsOsi}),this.version}requestUpdate(r=!1){if(!this.wrapperElement.isConnected||!Vt()||this.timer)return;let{error:e,options:n,state:o,value:i,version:a}=this;this.state=F,this.timer=vt(async()=>{this.timer=null;let c=null;if(this.changes.size&&(c=Object.fromEntries(this.changes.entries()),this.changes.clear()),this.connected?this.log?.debug("Updated:",{element:this.wrapperElement,changes:c}):(this.connected=!0,this.log?.debug("Connected:",{element:this.wrapperElement,changes:c})),c||r)try{await this.wrapperElement.render?.()===!1&&this.state===F&&this.version===a&&(this.state=o,this.error=e,this.value=i,this.update(),this.notify())}catch(s){this.toggleFailed(this.version,s,n)}})}};it=new WeakMap;function kr(t){return`https://${t==="PRODUCTION"?"www.adobe.com":"www.stage.adobe.com"}/offers/promo-terms.html`}var V,U=class U extends HTMLAnchorElement{constructor(){super();w(this,"masElement",new wt(this));S(this,V);this.setAttribute("is",U.is)}get isUptLink(){return!0}initializeWcsData(e,n){this.setAttribute("data-wcs-osi",e),n&&this.setAttribute("data-promotion-code",n)}attributeChangedCallback(e,n,o){this.masElement.attributeChangedCallback(e,n,o)}connectedCallback(){this.masElement.connectedCallback(),L(this,V,nt()),f(this,V)&&(this.log=f(this,V).log.module("upt-link"))}disconnectedCallback(){this.masElement.disconnectedCallback(),L(this,V,void 0)}requestUpdate(e=!1){this.masElement.requestUpdate(e)}onceSettled(){return this.masElement.onceSettled()}async render(){let e=nt();if(!e)return!1;this.dataset.imsCountry||e.imsCountryPromise.then(a=>{a&&(this.dataset.imsCountry=a)});let n=e.collectCheckoutOptions({},this);if(!n.wcsOsi)return this.log.error("Missing 'data-wcs-osi' attribute on upt-link."),!1;let o=this.masElement.togglePending(n),i=e.resolveOfferSelectors(n);try{let[[a]]=await Promise.all(i),{country:c,language:s,env:l}=n,m=`locale=${s}_${c}&country=${c}&offer_id=${a.offerId}`,d=this.getAttribute("data-promotion-code");d&&(m+=`&promotion_code=${encodeURIComponent(d)}`),this.href=`${kr(l)}?${m}`,this.masElement.toggleResolved(o,a,n)}catch(a){let c=new Error(`Could not resolve offer selectors for id: ${n.wcsOsi}.`,a.message);return this.masElement.toggleFailed(o,c,n),!1}}static createFrom(e){let n=new U;for(let o of e.attributes)o.name!=="is"&&(o.name==="class"&&o.value.includes("upt-link")?n.setAttribute("class",o.value.replace("upt-link","").trim()):n.setAttribute(o.name,o.value));return n.innerHTML=e.innerHTML,n.setAttribute("tabindex",0),n}};V=new WeakMap,w(U,"is","upt-link"),w(U,"tag","a"),w(U,"observedAttributes",["data-wcs-osi","data-promotion-code","data-ims-country"]);var H=U;window.customElements.get(H.is)||window.customElements.define(H.is,H,{extends:H.tag});var Hr="#000000",jt="#F8D904",Dr="#EAEAEA",$r="#31A547",qr=/(accent|primary|secondary)(-(outline|link))?/,zr="mas:product_code/",Fr="daa-ll",Ie="daa-lh",Br=["XL","L","M","S"],Gt="...";function R(t,r,e,n){let o=n[t];if(r[t]&&o){let i={slot:o?.slot,...o?.attributes},a=r[t];if(o.maxCount&&typeof a=="string"){let[s,l]=an(a,o.maxCount,o.withSuffix);s!==a&&(i.title=l,a=s)}let c=k(o.tag,i,a);e.append(c)}}function Ur(t,r,e){let o=(t.mnemonicIcon||[]).filter(a=>a).map((a,c)=>({icon:a,alt:t.mnemonicAlt?.[c]??"",link:t.mnemonicLink?.[c]??""}));o?.forEach(({icon:a,alt:c,link:s})=>{if(s&&!/^https?:/.test(s))try{s=new URL(`https://${s}`).href.toString()}catch{s="#"}let l={slot:"icons",src:a,loading:r.loading,size:e?.size??"l"};c&&(l.alt=c),s&&(l.href=s);let m=k("merch-icon",l);r.append(m)});let i=r.shadowRoot.querySelector('slot[name="icons"]');i&&(i.style.display=o?.length?null:"none")}function Vr(t,r,e){if(e.badge?.slot){if(t.badge?.length&&!t.badge?.startsWith("<merch-badge")){let n=jt,o=!1;e.allowedBadgeColors?.includes(e.badge?.default)&&(n=e.badge?.default,t.borderColor||(o=!0));let i=t.badgeBackgroundColor||n,a=t.borderColor||"";o&&(a=e.badge?.default,t.borderColor=e.badge?.default),t.badge=`<merch-badge variant="${t.variant}" background-color="${i}" border-color="${a}">${t.badge}</merch-badge>`}R("badge",t,r,e)}else t.badge?(r.setAttribute("badge-text",t.badge),e.disabledAttributes?.includes("badgeColor")||r.setAttribute("badge-color",t.badgeColor||Hr),e.disabledAttributes?.includes("badgeBackgroundColor")||r.setAttribute("badge-background-color",t.badgeBackgroundColor||jt),r.setAttribute("border-color",t.badgeBackgroundColor||jt)):r.setAttribute("border-color",t.borderColor||Dr)}function jr(t,r,e){if(e.trialBadge&&t.trialBadge){if(!t.trialBadge.startsWith("<merch-badge")){let n=!e.disabledAttributes?.includes("trialBadgeBorderColor")&&t.trialBadgeBorderColor||$r;t.trialBadge=`<merch-badge variant="${t.variant}" border-color="${n}">${t.trialBadge}</merch-badge>`}R("trialBadge",t,r,e)}}function Gr(t,r,e){e?.includes(t.size)&&r.setAttribute("size",t.size)}function Wr(t,r){t.cardName&&r.setAttribute("name",t.cardName)}function Yr(t,r,e){t.cardTitle&&(t.cardTitle=K(t.cardTitle)),R("cardTitle",t,r,{cardTitle:e})}function Kr(t,r,e){R("subtitle",t,r,e)}function Xr(t,r,e,n){if(!t.backgroundColor||t.backgroundColor.toLowerCase()==="default"){r.style.removeProperty("--merch-card-custom-background-color"),r.removeAttribute("background-color");return}e?.[t.backgroundColor]?(r.style.setProperty("--merch-card-custom-background-color",`var(${e[t.backgroundColor]})`),r.setAttribute("background-color",t.backgroundColor)):n?.attribute&&t.backgroundColor&&(r.setAttribute(n.attribute,t.backgroundColor),r.style.removeProperty("--merch-card-custom-background-color"))}function Qr(t,r,e){let n=e?.borderColor,o="--consonant-merch-card-border-color";if(t.borderColor?.toLowerCase()==="transparent")r.style.setProperty(o,"transparent");else if(t.borderColor&&n){let a=n?.specialValues?.[t.borderColor]?.includes("gradient")||/-gradient/.test(t.borderColor),c=/^spectrum-.*-(plans|special-offers)$/.test(t.borderColor);if(a){r.setAttribute("gradient-border","true");let s=t.borderColor;if(n?.specialValues){for(let[l,m]of Object.entries(n.specialValues))if(m===t.borderColor){s=l;break}}r.setAttribute("border-color",s),r.style.removeProperty(o)}else c?(r.setAttribute("border-color",t.borderColor),r.style.setProperty(o,`var(--${t.borderColor})`)):r.style.setProperty(o,`var(--${t.borderColor})`)}}function Zr(t,r,e){if(t.backgroundImage){let n={loading:r.loading??"lazy",src:t.backgroundImage};if(t.backgroundImageAltText?n.alt=t.backgroundImageAltText:n.role="none",!e)return;if(e?.attribute){r.setAttribute(e.attribute,t.backgroundImage);return}r.append(k(e.tag,{slot:e.slot},k("img",n)))}}function K(t){return!t||typeof t!="string"||t.includes("<mas-mnemonic")&&Promise.resolve().then(()=>(Oe(),Me)).catch(console.error),t}function Jr(t,r,e){t.prices&&(t.prices=K(t.prices)),R("prices",t,r,e)}function He(t,r,e){let n=t.hasAttribute("data-wcs-osi")&&!!t.getAttribute("data-wcs-osi"),o=t.className||"",i=qr.exec(o)?.[0]??"accent",a=i.includes("accent"),c=i.includes("primary"),s=i.includes("secondary"),l=i.includes("-outline"),m=i.includes("-link");t.classList.remove("accent","primary","secondary");let d;if(r.consonant)d=dn(t,a,n,m,c,s,e?.ctas?.size);else if(m)d=t;else{let h;a?h="accent":c?h="primary":s&&(h="secondary"),d=r.spectrum==="swc"?ln(t,e,l,h,n):sn(t,e,l,h,n)}return d}function tn(t,r){let{slot:e}=r?.description,n=t.querySelectorAll(`[slot="${e}"] a[data-wcs-osi]`);n.length&&n.forEach(o=>{let i=He(o,t,r);o.replaceWith(i)})}function en(t,r,e){t.description&&(t.description=K(t.description)),t.promoText&&(t.promoText=K(t.promoText)),t.shortDescription&&(t.shortDescription=K(t.shortDescription)),R("promoText",t,r,e),R("description",t,r,e),R("shortDescription",t,r,e),t.shortDescription&&(r.setAttribute("action-menu","true"),t.actionMenuLabel||r.setAttribute("action-menu-label","More options")),tn(r,e),R("callout",t,r,e),R("quantitySelect",t,r,e),R("whatsIncluded",t,r,e)}function rn(t,r,e){if(!e.addon)return;let n=t.addon?.replace(/[{}]/g,"");if(!n||/disabled/.test(n))return;let o=k("merch-addon",{slot:"addon"},n);[...o.querySelectorAll(_)].forEach(i=>{let a=i.parentElement;a?.nodeName==="P"&&a.setAttribute("data-plan-type","")}),r.append(o)}function nn(t,r,e){t.addonConfirmation&&R("addonConfirmation",t,r,e)}function on(t,r,e,n){n?.secureLabel&&e?.secureLabel&&r.setAttribute("secure-label",n.secureLabel)}function an(t,r,e=!0){try{let n=typeof t!="string"?"":t,o=Pe(n);if(o.length<=r)return[n,o];let i=0,a=!1,c=e?r-Gt.length<1?1:r-Gt.length:r,s=[];for(let d of n){if(i++,d==="<")if(a=!0,n[i]==="/")s.pop();else{let h="";for(let y of n.substring(i)){if(y===" "||y===">")break;h+=y}s.push(h)}if(d==="/"&&n[i]===">"&&s.pop(),d===">"){a=!1;continue}if(!a&&(c--,c===0))break}let l=n.substring(0,i).trim();if(s.length>0){s[0]==="p"&&s.shift();for(let d of s.reverse())l+=`</${d}>`}return[`${l}${e?Gt:""}`,o]}catch{let o=typeof t=="string"?t:"",i=Pe(o);return[o,i]}}function Pe(t){if(!t)return"";let r="",e=!1;for(let n of t){if(n==="<"&&(e=!0),n===">"){e=!1;continue}e||(r+=n)}return r}function cn(t,r){r.querySelectorAll("a.upt-link").forEach(n=>{let o=H.createFrom(n);n.replaceWith(o),o.initializeWcsData(t.osi,t.promoCode)})}function sn(t,r,e,n,o){let i=t;o?i=customElements.get("checkout-button").createCheckoutButton({},t.innerHTML):i.innerHTML=`<span>${i.textContent}</span>`,i.setAttribute("tabindex",0);for(let m of t.attributes)["class","is"].includes(m.name)||i.setAttribute(m.name,m.value);i.firstElementChild?.classList.add("spectrum-Button-label");let a=r?.ctas?.size??"M",c=`spectrum-Button--${n}`,s=Br.includes(a)?`spectrum-Button--size${a}`:"spectrum-Button--sizeM",l=["spectrum-Button",c,s];return e&&l.push("spectrum-Button--outline"),i.classList.add(...l),i}function ln(t,r,e,n,o){let i=t;o&&(i=customElements.get("checkout-button").createCheckoutButton(t.dataset),i.connectedCallback(),i.render());let a="fill";e&&(a="outline");let c=k("sp-button",{treatment:a,variant:n,tabIndex:0,size:r?.ctas?.size??"m",...t.dataset.analyticsId&&{"data-analytics-id":t.dataset.analyticsId}},t.innerHTML);return c.source=i,(o?i.onceSettled():Promise.resolve(i)).then(s=>{c.setAttribute("data-navigation-url",s.href)}),c.addEventListener("click",s=>{s.defaultPrevented||i.click()}),c}function dn(t,r,e,n,o,i,a){let c=t;if(e)try{let s=customElements.get("checkout-link");s&&(c=s.createCheckoutLink(t.dataset,t.innerHTML)??t)}catch{}return n||(c.classList.add("button","con-button"),a&&a!=="m"&&c.classList.add(`button-${a}`),r&&c.classList.add("blue"),o&&c.classList.add("primary"),i&&c.classList.add("secondary")),c}function hn(t,r,e,n){if(t.ctas){t.ctas=K(t.ctas);let{slot:o}=e.ctas,i=k("div",{slot:o},t.ctas),a=[...i.querySelectorAll("a")].map(c=>He(c,r,e));i.innerHTML="",i.append(...a),r.append(i)}}function mn(t,r){let{tags:e}=t,n=e?.find(i=>typeof i=="string"&&i.startsWith(zr))?.split("/").pop();if(!n)return;r.setAttribute(Ie,n),[...r.shadowRoot.querySelectorAll("a[data-analytics-id],button[data-analytics-id]"),...r.querySelectorAll("a[data-analytics-id],button[data-analytics-id]")].forEach((i,a)=>{i.setAttribute(Fr,`${i.dataset.analyticsId}-${a+1}`)})}function pn(t){t.spectrum==="css"&&[["primary-link","primary"],["secondary-link","secondary"]].forEach(([r,e])=>{t.querySelectorAll(`a.${r}`).forEach(n=>{n.classList.remove(r),n.classList.add("spectrum-Link",`spectrum-Link--${e}`)})})}function un(t){t.querySelectorAll("[slot]").forEach(n=>{n.remove()}),t.variant=void 0,["checkbox-label","stock-offer-osis","secure-label","background-image","background-color","border-color","badge-background-color","badge-color","badge-text","gradient-border","size",Ie].forEach(n=>t.removeAttribute(n));let e=["wide-strip","thin-strip"];t.classList.remove(...e)}async function De(t,r){if(!t){let s=r?.id||"unknown";throw console.error(`hydrate: Fragment is undefined. Cannot hydrate card (merchCard id: ${s}).`),new Error(`hydrate: Fragment is undefined for card (merchCard id: ${s}).`)}if(!t.fields){let s=t.id||"unknown",l=r?.id||"unknown";throw console.error(`hydrate: Fragment for card ID '${s}' (merchCard id: ${l}) is missing 'fields'. Cannot hydrate.`),new Error(`hydrate: Fragment for card ID '${s}' (merchCard id: ${l}) is missing 'fields'.`)}let{id:e,fields:n,settings:o={},priceLiterals:i}=t,{variant:a}=n;if(!a)throw new Error(`hydrate: no variant found in payload ${e}`);un(r),r.settings=o,i&&(r.priceLiterals=i),r.id??(r.id=t.id),r.variant=a,await r.updateComplete;let{aemFragmentMapping:c}=r.variantLayout;if(!c)throw new Error(`hydrate: variant mapping not found for ${e}`);c.style==="consonant"&&r.setAttribute("consonant",!0),Ur(n,r,c.mnemonics),jr(n,r,c),Gr(n,r,c.size),Wr(n,r),Yr(n,r,c.title),Vr(n,r,c),Kr(n,r,c),Jr(n,r,c),Zr(n,r,c.backgroundImage),Xr(n,r,c.allowedColors,c.backgroundColor),Qr(n,r,c),en(n,r,c),rn(n,r,c),nn(n,r,c),on(n,r,c,o);try{cn(n,r)}catch{}hn(n,r,c,a),mn(n,r),pn(r)}import{html as D,css as bn,unsafeCSS as ze}from"./lit-all.min.js";import{html as At,nothing as gn}from"./lit-all.min.js";var X,st=class st{constructor(r){w(this,"card");S(this,X);this.card=r,this.insertVariantStyle()}getContainer(){return L(this,X,f(this,X)??this.card.closest('merch-card-collection, [class*="-merch-cards"]')??this.card.parentElement),f(this,X)}insertVariantStyle(){let r=this.constructor.name;if(!st.styleMap[r]){st.styleMap[r]=!0;let e=document.createElement("style");e.innerHTML=this.getGlobalCSS(),document.head.appendChild(e)}}updateCardElementMinHeight(r,e){if(!r||this.card.heightSync===!1)return;let n=`--consonant-merch-card-${this.card.variant}-${e}-height`,o=Math.max(0,parseInt(window.getComputedStyle(r).height)||0),i=this.getContainer(),a=parseInt(i.style.getPropertyValue(n))||0;o>a&&i.style.setProperty(n,`${o}px`)}get badge(){let r;if(!(!this.card.badgeBackgroundColor||!this.card.badgeColor||!this.card.badgeText))return this.evergreen&&(r=`border: 1px solid ${this.card.badgeBackgroundColor}; border-right: none;`),At`
            <div
                id="badge"
                class="${this.card.variant}-badge"
                style="background-color: ${this.card.badgeBackgroundColor};
                color: ${this.card.badgeColor};
                ${r}"
            >
                ${this.card.badgeText}
            </div>
        `}get cardImage(){return At` <div class="image">
            <slot name="bg-image"></slot>
            ${this.badge}
        </div>`}getGlobalCSS(){return""}get theme(){return document.querySelector("sp-theme")}get evergreen(){return this.card.classList.contains("intro-pricing")}get promoBottom(){return this.card.classList.contains("promo-bottom")}get headingSelector(){return'[slot="heading-xs"]'}get secureLabel(){return this.card.secureLabel?At`<span class="secure-transaction-label"
                  >${this.card.secureLabel}</span
              >`:gn}get secureLabelFooter(){return At`<footer>
            ${this.secureLabel}<slot name="footer"></slot>
        </footer>`}async postCardUpdateHook(){}connectedCallbackHook(){}disconnectedCallbackHook(){}syncHeights(){}renderLayout(){}get aemFragmentMapping(){return this.constructor.fragmentMapping??null}};X=new WeakMap,w(st,"styleMap",{});var Tt=st;var Wt="(max-width: 767px)",Lt="(max-width: 1199px)",$e="(min-width: 768px)",Q="(min-width: 1200px)",St="(min-width: 1600px)",fn={matchMobile:window.matchMedia(Wt),matchDesktop:window.matchMedia(`${Q} and (not ${St})`),matchDesktopOrUp:window.matchMedia(Q),matchLargeDesktop:window.matchMedia(St),get isMobile(){return this.matchMobile.matches},get isDesktop(){return this.matchDesktop.matches},get isDesktopOrUp(){return this.matchDesktopOrUp.matches}},Yt=fn;var qe=`
  :root {
    --consonant-merch-card-mini-compare-chart-icon-size: 32px;
    --consonant-merch-card-mini-compare-border-color: #E9E9E9;
    --consonant-merch-card-mini-compare-mobile-cta-font-size: 16px;
    --consonant-merch-card-mini-compare-mobile-cta-width: 75px;
    --consonant-merch-card-mini-compare-badge-mobile-max-width: 50px;
    --consonant-merch-card-mini-compare-mobile-price-font-size: 32px;
    --consonant-merch-card-card-mini-compare-mobile-background-color: #F8F8F8;
    --consonant-merch-card-card-mini-compare-mobile-spacing-xs: 12px;
    --consonant-merch-card-mini-compare-chart-heading-m-price-height: 30px;
  }

  merch-card[variant="mini-compare-chart"] {
    background: linear-gradient(#FFFFFF, #FFFFFF) padding-box, var(--consonant-merch-card-border-color, #E9E9E9) border-box;
    border: 1px solid transparent;
  }

  merch-card[variant="mini-compare-chart"] merch-badge {
    position: absolute;
    top: 16px;
    inset-inline-start: auto;
    inset-inline-end: 0;
  }
   merch-card[variant="mini-compare-chart"] div[class$='-badge'] {
     font-size: 14px;
   }

  merch-card[variant="mini-compare-chart"] div[class$='-badge']:dir(rtl) {
    left: 0;
    right: initial;
    padding: 8px 11px;
    border-radius: 0 5px 5px 0;
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m"] {
    padding: 0 var(--consonant-merch-spacing-s) 0;
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-xs"] {
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s);
    font-size: var(--consonant-merch-card-heading-m-font-size);
    line-height: var(--consonant-merch-card-heading-m-line-height);
  }

  merch-card[variant="mini-compare-chart"] merch-addon {
    box-sizing: border-box;
  }

  merch-card[variant="mini-compare-chart"] merch-addon {
    padding-inline-start: 4px;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-inline-end: 8px;
    border-radius: 10px;
    font-family: var(--merch-body-font-family, 'Adobe Clean');
    margin: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) .5rem;
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
    background: linear-gradient(211deg, rgb(245, 246, 253) 33.52%, rgb(248, 241, 248) 67.33%, rgb(249, 233, 237) 110.37%);
  }

  merch-card[variant="mini-compare-chart"] merch-addon [is="inline-price"] {
    min-height: unset;
    font-weight: bold;
    pointer-events: none;
  }

  merch-card[variant="mini-compare-chart"] merch-addon::part(checkbox) {
      height: 18px;
      width: 18px;
      margin: 14px 12px 0 8px;
  }

  merch-card[variant="mini-compare-chart"] merch-addon::part(label) {
    display: flex;
    flex-direction: column;
    padding: 8px 4px 8px 0;
    width: 100%;
  }

  merch-card[variant="mini-compare-chart"] [is="inline-price"] {
    display: inline-block;
    min-height: 30px;
    line-height: 30px;
    min-width: 1px;
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m-price"]  {
    min-height: 30px;
    line-height: 30px;
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m-price"] [is="inline-price"][data-template="legal"] {
    display: inline;
    min-height: unset;
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m-price"] .price-plan-type {
    display: block;
    font-size: var(--consonant-merch-card-body-xs-font-size);
		font-style: italic;
		font-weight: normal;
  }

  merch-card[variant="mini-compare-chart"] [slot="callout-content"] {
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) 0px;
  }

  merch-card[variant="mini-compare-chart"] [slot="callout-content"] .callout-row {
    flex-direction: row;
    align-items: flex-start;
    padding: 2px 10px 3px;
  }

  merch-card[variant="mini-compare-chart"] [slot="callout-content"] .callout-row .icon-button {
    position: relative;
    top: 2px;
    left: auto;
    flex-shrink: 0;
    align-self: flex-start;
    margin-inline-start: var(--consonant-merch-spacing-xxs);
  }

  merch-card[variant="mini-compare-chart"] [slot="quantity-select"] {
    padding: 0 var(--consonant-merch-spacing-s);
  }

  merch-card[variant="mini-compare-chart"] [slot="subtitle"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    padding: 0 var(--consonant-merch-spacing-s);
    font-weight: 500;
  }

  merch-card[variant="mini-compare-chart"] [slot="body-m"] {
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s);
  }

  merch-card[variant="mini-compare-chart"] [slot="callout-content"] [is="inline-price"] {
    min-height: unset;
  }

  merch-card[variant="mini-compare-chart"] [slot="price-commitment"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    padding: 0 var(--consonant-merch-spacing-s);
    font-style: italic;
  }

  merch-card[variant="mini-compare-chart"] [slot="price-commitment"] a {
    display: inline-block;
    height: 27px;
  }

  merch-card[variant="mini-compare-chart"] [slot="offers"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
  }

  merch-card[variant="mini-compare-chart"] [slot="body-xxs"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
  }

  merch-card[variant="mini-compare-chart"] .price-plan-type [slot="body-xxs"] {
    font-style: italic;
    font-weight: normal;
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] {
    font-size: var(--consonant-merch-card-body-m-font-size);
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) 0;
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] p {
    margin: 0;
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] [is="inline-price"] {
    line-height: var(--consonant-merch-card-body-xs-line-height);
    min-height: unset;
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] a {
    color: var(--color-accent);
    text-decoration: underline;
  }

  merch-card[variant="mini-compare-chart"] a.upt-link {
    color: var(--link-color);
  }


  merch-card[variant="mini-compare-chart"] [slot="body-m"] p {
    margin: 0;
  }

  merch-card[variant="mini-compare-chart"] .action-area {
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    flex-wrap: wrap;
    width: 100%;
    gap: var(--consonant-merch-spacing-xxs);
  }

  /* Override merch-whats-included host layout for footer-row display */
  merch-card[variant="mini-compare-chart"] merch-whats-included {
    display: flex;
    flex-direction: column;
    width: 100%;
    row-gap: 0;
  }

  /* Hide heading in footer context */
  merch-card[variant="mini-compare-chart"] merch-whats-included [slot="heading"] {
    display: none;
  }

  /* Icon sizing */
  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="icon"] {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: var(--consonant-merch-card-mini-compare-chart-icon-size);
    width: var(--consonant-merch-card-mini-compare-chart-icon-size);
    height: var(--consonant-merch-card-mini-compare-chart-icon-size);
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="icon"] img {
    max-width: initial;
    width: var(--consonant-merch-card-mini-compare-chart-icon-size);
    height: var(--consonant-merch-card-mini-compare-chart-icon-size);
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="icon"] merch-icon {
    --mod-img-width: var(--consonant-merch-card-mini-compare-chart-icon-size);
    --mod-img-height: var(--consonant-merch-card-mini-compare-chart-icon-size);
  }

  merch-card[variant="mini-compare-chart"] .footer-rows-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-color: var(--merch-color-grey-60);
    font-weight: 700;
    line-height: var(--consonant-merch-card-body-xs-line-height);
    font-size: var(--consonant-merch-card-body-s-font-size);
  }

  /* Footer-row-cell layout (legacy footer-rows structure used by DC pages) */
  merch-card[variant="mini-compare-chart"] [slot="footer-rows"] ul {
    margin-block: 0px;
    padding-inline-start: 0px;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell {
    border-top: 1px solid var(--consonant-merch-card-border-color);
    display: flex;
    gap: var(--consonant-merch-spacing-xs);
    justify-content: start;
    place-items: center;
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s);
    margin-block: 0px;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-icon {
    display: flex;
    place-items: center;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-icon img {
    max-width: initial;
    width: var(--consonant-merch-card-mini-compare-chart-icon-size);
    height: var(--consonant-merch-card-mini-compare-chart-icon-size);
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description p {
    color: var(--merch-color-grey-80);
    vertical-align: bottom;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description a {
    color: var(--color-accent);
  }

  /* Style each mnemonic-list as a footer row */
  merch-card[variant="mini-compare-chart"] merch-mnemonic-list {
    width: 100%;
    margin-inline: 0;
    border-top: 1px solid var(--consonant-merch-card-mini-compare-border-color);
    display: flex;
    gap: var(--consonant-merch-spacing-xs);
    justify-content: start;
    align-items: center;
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s);
    box-sizing: border-box;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-icon-checkmark img {
    max-width: initial;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-icon-checkmark {
    display: flex;
    align-items: center;
    height: 20px;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-checkmark {
    display: flex;
    gap: var(--consonant-merch-spacing-xs);
    justify-content: start;
    align-items: flex-start;
    margin-block: var(--consonant-merch-spacing-xxxs);
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description-checkmark {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    font-weight: 400;
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="description"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="description"] p {
    color: var(--merch-color-grey-80);
    vertical-align: bottom;
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="description"] a {
    color: var(--color-accent);
  }

  merch-card[variant="mini-compare-chart"] .toggle-icon {
    display: flex;
    background-color: transparent;
    border: none;
    padding: 0;
    margin: 0;
    text-align: inherit;
    font: inherit;
    border-radius: 0;
  }

  merch-card[variant="mini-compare-chart"] .checkmark-copy-container {
    display: none;
  }

  merch-card[variant="mini-compare-chart"] .checkmark-copy-container.open {
    display: block;
    padding-block-start: var(--consonant-merch-card-card-mini-compare-mobile-spacing-xs);
    padding-block-end: 4px;
  }

.one-merch-card.mini-compare-chart {
  grid-template-columns: var(--consonant-merch-card-mini-compare-chart-wide-width);
  gap: var(--consonant-merch-spacing-xs);
}

.two-merch-cards.mini-compare-chart,
.three-merch-cards.mini-compare-chart,
.four-merch-cards.mini-compare-chart {
  grid-template-columns: repeat(2, var(--consonant-merch-card-mini-compare-chart-width));
  gap: var(--consonant-merch-spacing-xs);
}

/* Sections inside tabs/fragments that don't receive the .mini-compare-chart class.
   Make .content wrapper transparent so the section grid applies directly to cards. */
.one-merch-card:has(merch-card[variant="mini-compare-chart"]) .content,
.two-merch-cards:has(merch-card[variant="mini-compare-chart"]) .content,
.three-merch-cards:has(merch-card[variant="mini-compare-chart"]) .content,
.four-merch-cards:has(merch-card[variant="mini-compare-chart"]) .content {
  display: contents;
}

.one-merch-card:has(merch-card[variant="mini-compare-chart"]) {
  grid-template-columns: var(--consonant-merch-card-mini-compare-chart-wide-width);
  gap: var(--consonant-merch-spacing-xs);
}

.two-merch-cards:has(merch-card[variant="mini-compare-chart"]),
.three-merch-cards:has(merch-card[variant="mini-compare-chart"]),
.four-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
  grid-template-columns: repeat(2, var(--consonant-merch-card-mini-compare-chart-width));
  gap: var(--consonant-merch-spacing-xs);
}

/* Place compare-plans text-block below all cards in multi-card layouts */
.two-merch-cards:has(merch-card[variant="mini-compare-chart"]) .text-block,
.three-merch-cards:has(merch-card[variant="mini-compare-chart"]) .text-block,
.four-merch-cards:has(merch-card[variant="mini-compare-chart"]) .text-block {
  grid-column: 1 / -1;
}

/* bullet list */
merch-card[variant="mini-compare-chart"].bullet-list {
  border-radius: var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart"].bullet-list:not(.badge-card):not(.mini-compare-chart-badge) {
  border-color: var(--consonant-merch-card-mini-compare-border-color);
}

merch-card[variant="mini-compare-chart"].badge-card {
  border: var(--consonant-merch-card-border);
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m"] {
  padding: var(--consonant-merch-spacing-xxs) var(--consonant-merch-spacing-xs);
  font-size: var(--consonant-merch-card-heading-xxs-font-size);
  line-height: var(--consonant-merch-card-heading-xxs-line-height);
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"],
merch-card[variant="mini-compare-chart"].bullet-list [slot="price-commitment"] {
  padding: 0 var(--consonant-merch-spacing-xs);
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] .starting-at {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] .price {
  font-size: var(--consonant-merch-card-heading-l-font-size);
  line-height: 35px;
  font-weight: 800;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] .price-alternative:has(+ .price-annual-prefix) {
  margin-bottom: 4px;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] [data-template="strikethrough"] {
  min-height: 24px;
  margin-bottom: 2px;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] [data-template="strikethrough"],
merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] .price-strikethrough {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 700;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"].annual-price-new-line > span[is="inline-price"] > .price-annual,
merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"].annual-price-new-line > span[is="inline-price"] > .price-annual-prefix::after,
merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"].annual-price-new-line > span[is="inline-price"] >.price-annual-suffix {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
  font-style: italic;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="body-xxs"] {
  padding: var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xs) 0;
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
  letter-spacing: normal;
  font-style: italic;
}

merch-card[variant="mini-compare-chart"]:not(.bullet-list) p.card-heading[slot="body-xxs"] {
  padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) 0;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="promo-text"] {
  padding: var(--consonant-merch-card-card-mini-compare-mobile-spacing-xs) var(--consonant-merch-spacing-xs) 0;
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 700;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="promo-text"] a {
  font-weight: 400;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="body-m"] {
  padding: var(--consonant-merch-card-card-mini-compare-mobile-spacing-xs) var(--consonant-merch-spacing-xs) 0;
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="body-m"] p:has(+ p) {
  margin-bottom: 8px;
}

merch-card[variant="mini-compare-chart"] [slot="body-m"] a.spectrum-Link.spectrum-Link--secondary {
  color: inherit;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="callout-content"] {
  padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-xs) 0px;
  margin: 0;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="callout-content"] > div > div {
  background-color: #D9D9D9;
}

merch-card[variant="mini-compare-chart"].bullet-list merch-addon {
  margin: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart"].bullet-list merch-addon [is="inline-price"] {
  font-weight: 400;
}

merch-card[variant="mini-compare-chart"].bullet-list footer {
  gap: var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart"].bullet-list .action-area {
  justify-content: flex-start;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="footer-rows"] {
  background-color: var(--consonant-merch-card-card-mini-compare-mobile-background-color);
  border-radius: 0 0 var(--consonant-merch-spacing-xxs) var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="price-commitment"] {
  padding: var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xs) 0 var(--consonant-merch-spacing-xs);
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
}

/* mini compare mobile */
@media screen and ${Wt} {
  :root {
    --consonant-merch-card-mini-compare-chart-width: 302px;
    --consonant-merch-card-mini-compare-chart-wide-width: 302px;
  }

  .two-merch-cards.mini-compare-chart,
  .three-merch-cards.mini-compare-chart,
  .four-merch-cards.mini-compare-chart,
  .two-merch-cards:has(merch-card[variant="mini-compare-chart"]),
  .three-merch-cards:has(merch-card[variant="mini-compare-chart"]),
  .four-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
    grid-template-columns: var(--consonant-merch-card-mini-compare-chart-width);
    gap: var(--consonant-merch-spacing-xs);
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="subtitle"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m-price"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="body-m"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="description"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart"] merch-addon {
    box-sizing: border-box;
  }
}

@media screen and ${Lt} {
  merch-card[variant="mini-compare-chart"] [slot="heading-m"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="subtitle"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m-price"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="body-m"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="description"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart"].bullet-list merch-mnemonic-list [slot="description"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="footer"] a.con-button {
    min-width: 66px;
    padding: 4px 18px 5px 21px;
    font-size: var(--consonant-merch-card-mini-compare-mobile-cta-font-size);
  }

  merch-card[variant="mini-compare-chart"].bullet-list [slot="footer"] a.con-button {
    padding: 6px 18px 4px;
  }
}
@media screen and ${$e} {
  :root {
    --consonant-merch-card-mini-compare-chart-width: 302px;
    --consonant-merch-card-mini-compare-chart-wide-width: 302px;
  }

  .two-merch-cards.mini-compare-chart,
  .two-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
    grid-template-columns: repeat(2, minmax(var(--consonant-merch-card-mini-compare-chart-width), var(--consonant-merch-card-mini-compare-chart-wide-width)));
    gap: var(--consonant-merch-spacing-m);
  }

  .three-merch-cards.mini-compare-chart,
  .four-merch-cards.mini-compare-chart,
  .three-merch-cards:has(merch-card[variant="mini-compare-chart"]),
  .four-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
      grid-template-columns: repeat(2, minmax(var(--consonant-merch-card-mini-compare-chart-width), var(--consonant-merch-card-mini-compare-chart-wide-width)));
  }

   merch-card[variant="mini-compare-chart"].bullet-list [slot="price-commitment"] {
    padding: var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xs) 0 var(--consonant-merch-spacing-xs);
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart"].bullet-list [slot="footer-rows"] {
    padding: var(--consonant-merch-spacing-xs);
  }

  merch-card[variant="mini-compare-chart"].bullet-list .footer-rows-title {
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"].bullet-list .checkmark-copy-container.open {
    padding-block-start: var(--consonant-merch-spacing-xs);
    padding-block-end: 0;
    padding-inline: 0;
  }

  merch-card[variant="mini-compare-chart"].bullet-list .footer-row-cell-checkmark {
    gap: var(--consonant-merch-spacing-xxs);
  }
}

/* desktop */
@media screen and ${Q} {
  :root {
    --consonant-merch-card-mini-compare-chart-width: 378px;
    --consonant-merch-card-mini-compare-chart-wide-width: 484px;
  }
  .one-merch-card.mini-compare-chart,
  .one-merch-card:has(merch-card[variant="mini-compare-chart"]) {
    grid-template-columns: var(--consonant-merch-card-mini-compare-chart-wide-width);
  }

  .two-merch-cards.mini-compare-chart,
  .two-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
    grid-template-columns: repeat(2, var(--consonant-merch-card-mini-compare-chart-wide-width));
    gap: var(--consonant-merch-spacing-m);
  }

  .three-merch-cards.mini-compare-chart,
  .four-merch-cards.mini-compare-chart,
  .three-merch-cards:has(merch-card[variant="mini-compare-chart"]),
  .four-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
    grid-template-columns: repeat(3, var(--consonant-merch-card-mini-compare-chart-width));
    gap: var(--consonant-merch-spacing-m);
  }
}

@media screen and ${St} {
  .four-merch-cards.mini-compare-chart,
  .four-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
      grid-template-columns: repeat(4, var(--consonant-merch-card-mini-compare-chart-width));
  }
}

merch-card[variant="mini-compare-chart"].bullet-list div[slot="footer-rows"]  {
  height: 100%;
}

/* Height sync for legacy footer-row-cell structure (DC pages without mini-compare-chart-mweb variant) */
merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(1) {
  min-height: var(--consonant-merch-card-footer-row-1-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(2) {
  min-height: var(--consonant-merch-card-footer-row-2-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(3) {
  min-height: var(--consonant-merch-card-footer-row-3-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(4) {
  min-height: var(--consonant-merch-card-footer-row-4-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(5) {
  min-height: var(--consonant-merch-card-footer-row-5-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(6) {
  min-height: var(--consonant-merch-card-footer-row-6-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(7) {
  min-height: var(--consonant-merch-card-footer-row-7-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(8) {
  min-height: var(--consonant-merch-card-footer-row-8-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(1) {
  min-height: var(--consonant-merch-card-footer-row-1-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(2) {
  min-height: var(--consonant-merch-card-footer-row-2-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(3) {
  min-height: var(--consonant-merch-card-footer-row-3-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(4) {
  min-height: var(--consonant-merch-card-footer-row-4-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(5) {
  min-height: var(--consonant-merch-card-footer-row-5-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(6) {
  min-height: var(--consonant-merch-card-footer-row-6-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(7) {
  min-height: var(--consonant-merch-card-footer-row-7-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(8) {
  min-height: var(--consonant-merch-card-footer-row-8-min-height);
}
`;var yn=32,Fe={cardName:{attribute:"name"},title:{tag:"h3",slot:"heading-xs"},subtitle:{tag:"p",slot:"subtitle"},prices:{tag:"p",slot:"heading-m-price"},promoText:{tag:"div",slot:"promo-text"},shortDescription:{tag:"div",slot:"body-xxs"},description:{tag:"div",slot:"body-m"},mnemonics:{size:"l"},quantitySelect:{tag:"div",slot:"quantity-select"},callout:{tag:"div",slot:"callout-content"},addon:!0,secureLabel:!0,planType:!0,badgeIcon:!0,badge:{tag:"div",slot:"badge",default:"spectrum-yellow-300"},allowedBadgeColors:["spectrum-yellow-300","spectrum-gray-300","spectrum-gray-700","spectrum-green-900","spectrum-red-700","gradient-purple-blue"],allowedBorderColors:["spectrum-yellow-300","spectrum-gray-300","spectrum-green-900","spectrum-red-700","gradient-purple-blue"],borderColor:{attribute:"border-color"},size:["wide","super-wide"],whatsIncluded:{tag:"div",slot:"footer-rows"},ctas:{slot:"footer",size:"l"},style:"consonant"},Kt=class extends Tt{constructor(e){super(e);w(this,"getRowMinHeightPropertyName",e=>`--consonant-merch-card-footer-row-${e}-min-height`);w(this,"getMiniCompareFooter",()=>{let e=this.card.secureLabel?D`<slot name="secure-transaction-label">
                  <span class="secure-transaction-label"
                      >${this.card.secureLabel}</span
                  ></slot
              >`:D`<slot name="secure-transaction-label"></slot>`;return this.isNewVariant?D`<footer>
                ${e}
                <p class="action-area"><slot name="footer"></slot></p>
            </footer>`:D`<footer>${e}<slot name="footer"></slot></footer>`});this.updatePriceQuantity=this.updatePriceQuantity.bind(this)}connectedCallbackHook(){this.card.addEventListener(Dt,this.updatePriceQuantity),this.visibilityObserver=new IntersectionObserver(([e])=>{e.boundingClientRect.height!==0&&e.isIntersecting&&(Yt.isMobile||requestAnimationFrame(()=>{let n=this.getContainer();if(!n)return;n.querySelectorAll('merch-card[variant="mini-compare-chart"]').forEach(i=>i.variantLayout?.syncHeights?.())}),this.visibilityObserver.disconnect())}),this.visibilityObserver.observe(this.card)}disconnectedCallbackHook(){if(this.card.removeEventListener(Dt,this.updatePriceQuantity),this.visibilityObserver?.disconnect(),this.calloutListenersAdded){document.removeEventListener("touchstart",this.handleCalloutTouch),document.removeEventListener("mouseover",this.handleCalloutMouse);let e=this.card.querySelector('[slot="callout-content"] .icon-button');e?.removeEventListener("focusin",this.handleCalloutFocusin),e?.removeEventListener("focusout",this.handleCalloutFocusout),e?.removeEventListener("keydown",this.handleCalloutKeydown),this.calloutListenersAdded=!1}}updatePriceQuantity({detail:e}){!this.mainPrice||!e?.option||(this.mainPrice.dataset.quantity=e.option)}priceOptionsProvider(e,n){if(this.isNewVariant){if(e.dataset.template===Y){n.displayPlanType=this.card?.settings?.displayPlanType??!0;return}(e.dataset.template==="strikethrough"||e.dataset.template==="price")&&(n.displayPerUnit=!1)}}getGlobalCSS(){return qe}adjustMiniCompareBodySlots(){if(this.card.getBoundingClientRect().width<=2)return;this.updateCardElementMinHeight(this.card.shadowRoot.querySelector(".top-section"),"top-section");let e=["heading-m","subtitle","body-m","heading-m-price","body-xxs","price-commitment","quantity-select","offers","promo-text","callout-content","addon"];this.card.classList.contains("bullet-list")&&e.push("footer-rows"),e.forEach(o=>this.updateCardElementMinHeight(this.card.shadowRoot.querySelector(`slot[name="${o}"]`),o)),this.updateCardElementMinHeight(this.card.shadowRoot.querySelector("footer"),"footer"),this.card.shadowRoot.querySelector(".mini-compare-chart-badge")?.textContent!==""&&this.getContainer().style.setProperty("--consonant-merch-card-mini-compare-chart-top-section-mobile-height","32px")}adjustMiniCompareFooterRows(){if(this.card.getBoundingClientRect().width===0)return;let e;if(this.isNewVariant){let n=this.card.querySelector("merch-whats-included");if(!n)return;e=[...n.querySelectorAll('[slot="content"] merch-mnemonic-list')]}else{let n=this.card.querySelector('[slot="footer-rows"] ul');if(!n||!n.children)return;e=[...n.children]}e.length&&e.forEach((n,o)=>{let i=Math.max(yn,parseFloat(window.getComputedStyle(n).height)||0),a=parseFloat(this.getContainer().style.getPropertyValue(this.getRowMinHeightPropertyName(o+1)))||0;i>a&&this.getContainer().style.setProperty(this.getRowMinHeightPropertyName(o+1),`${i}px`)})}removeEmptyRows(){this.isNewVariant?this.card.querySelectorAll("merch-whats-included merch-mnemonic-list").forEach(n=>{let o=n.querySelector('[slot="description"]');o&&!o.textContent.trim()&&n.remove()}):this.card.querySelectorAll(".footer-row-cell").forEach(n=>{let o=n.querySelector(".footer-row-cell-description");o&&!o.textContent.trim()&&n.remove()})}padFooterRows(){let e=this.getContainer();if(!e)return;let n=e.querySelectorAll('merch-card[variant="mini-compare-chart"]');if(this.isNewVariant){let o=0;if(n.forEach(l=>{let m=l.querySelector("merch-whats-included");if(!m)return;let d=m.querySelectorAll('[slot="content"] merch-mnemonic-list:not([data-placeholder])');o=Math.max(o,d.length)}),o===0)return;let i=this.card.querySelector("merch-whats-included");if(!i)return;let a=i.querySelector('[slot="content"]');if(!a)return;a.querySelectorAll("merch-mnemonic-list[data-placeholder]").forEach(l=>l.remove());let c=a.querySelectorAll("merch-mnemonic-list").length,s=o-c;for(let l=0;l<s;l++){let m=document.createElement("merch-mnemonic-list");m.setAttribute("data-placeholder","");let d=document.createElement("div");d.setAttribute("slot","description"),m.appendChild(d),a.appendChild(m)}}else{let o=0;if(n.forEach(s=>{let l=s.querySelector('[slot="footer-rows"] ul');if(!l)return;let m=l.querySelectorAll("li.footer-row-cell:not([data-placeholder])");o=Math.max(o,m.length)}),o===0)return;let i=this.card.querySelector('[slot="footer-rows"] ul');if(!i)return;i.querySelectorAll("li.footer-row-cell[data-placeholder]").forEach(s=>s.remove());let a=i.querySelectorAll("li.footer-row-cell").length,c=o-a;for(let s=0;s<c;s++){let l=document.createElement("li");l.className="footer-row-cell",l.setAttribute("data-placeholder",""),i.appendChild(l)}}}get mainPrice(){return this.card.querySelector(`[slot="heading-m-price"] ${_}[data-template="price"]`)}get headingMPriceSlot(){return this.card.shadowRoot.querySelector('slot[name="heading-m-price"]')?.assignedElements()[0]}get isNewVariant(){return!!this.card.querySelector("merch-whats-included")}toggleAddon(e){let n=this.mainPrice,o=this.headingMPriceSlot;if(!n&&o){let i=e?.getAttribute("plan-type"),a=null;if(e&&i&&(a=e.querySelector(`p[data-plan-type="${i}"]`)?.querySelector('span[is="inline-price"]')),this.card.querySelectorAll('p[slot="heading-m-price"]').forEach(c=>c.remove()),e.checked){if(a){let c=k("p",{class:"addon-heading-m-price-addon",slot:"heading-m-price"},a.innerHTML);this.card.appendChild(c)}}else{let c=k("p",{class:"card-heading",id:"free",slot:"heading-m-price"},"Free");this.card.appendChild(c)}}}showTooltip(e){e.classList.remove("hide-tooltip"),e.setAttribute("aria-expanded","true")}hideTooltip(e){e.classList.add("hide-tooltip"),e.setAttribute("aria-expanded","false")}adjustCallout(){let e=this.card.querySelector('[slot="callout-content"] .icon-button');if(!e||this.calloutListenersAdded)return;let n=e.title||e.dataset.tooltip;if(!n)return;e.title&&(e.dataset.tooltip=e.title,e.removeAttribute("title"));let o=e.parentElement;if(o&&o.tagName==="P"){let i=document.createElement("div"),a=document.createElement("div");a.className="callout-row";let c=document.createElement("div");for(c.className="callout-text";o.firstChild&&o.firstChild!==e;)c.appendChild(o.firstChild);a.appendChild(c),a.appendChild(e),i.appendChild(a),o.replaceWith(i)}e.setAttribute("role","button"),e.setAttribute("tabindex","0"),e.setAttribute("aria-label",n),e.setAttribute("aria-expanded","false"),this.hideTooltip(e),this.handleCalloutTouch=i=>{i.target!==e?this.hideTooltip(e):e.classList.contains("hide-tooltip")?this.showTooltip(e):this.hideTooltip(e)},this.handleCalloutMouse=i=>{i.target!==e?this.hideTooltip(e):this.showTooltip(e)},this.handleCalloutFocusin=()=>{this.showTooltip(e)},this.handleCalloutFocusout=()=>{this.hideTooltip(e)},this.handleCalloutKeydown=i=>{i.key==="Escape"&&(this.hideTooltip(e),e.blur())},document.addEventListener("touchstart",this.handleCalloutTouch),document.addEventListener("mouseover",this.handleCalloutMouse),e.addEventListener("focusin",this.handleCalloutFocusin),e.addEventListener("focusout",this.handleCalloutFocusout),e.addEventListener("keydown",this.handleCalloutKeydown),this.calloutListenersAdded=!0}async adjustAddon(){await this.card.updateComplete;let e=this.card.addon;if(!e)return;let n=this.mainPrice,o=this.card.planType;if(n&&(await n.onceSettled(),o=n.value?.[0]?.planType),!o)return;e.planType=o,this.card.querySelector("merch-addon[plan-type]")?.updateComplete.then(()=>{this.updateCardElementMinHeight(this.card.shadowRoot.querySelector('slot[name="addon"]'),"addon")})}async adjustLegal(){if(!this.legalAdjusted)try{this.legalAdjusted=!0,await this.card.updateComplete,await customElements.whenDefined("inline-price");let e=this.mainPrice;if(!e)return;let n=e.cloneNode(!0);if(await e.onceSettled(),!e?.options)return;e.options.displayPerUnit&&(e.dataset.displayPerUnit="false"),e.options.displayTax&&(e.dataset.displayTax="false"),e.options.displayPlanType&&(e.dataset.displayPlanType="false"),n.setAttribute("data-template","legal"),e.parentNode.insertBefore(n,e.nextSibling),await n.onceSettled()}catch{}}adjustShortDescription(){let e=this.card.querySelector('[slot="body-xxs"]'),n=e?.textContent?.trim();if(!n)return;let i=this.card.querySelector('[slot="heading-m-price"] [data-template="legal"]')?.querySelector(".price-plan-type");if(!i)return;let a=document.createElement("em");a.setAttribute("slot","body-xxs"),a.textContent=` ${n}`,i.appendChild(a),e.remove()}renderLayout(){return this.isNewVariant?D` <div class="top-section${this.badge?" badge":""}">
                <slot name="icons"></slot> ${this.badge}
                <slot name="badge"></slot>
            </div>
            <slot name="heading-m"></slot>
            <slot name="heading-xs"></slot>
            <slot name="body-m"></slot>
            <slot name="subtitle"></slot>
            <slot name="heading-m-price"></slot>
            <slot name="body-xxs"></slot>
            <slot name="price-commitment"></slot>
            <slot name="offers"></slot>
            <slot name="quantity-select"></slot>
            <slot name="promo-text"></slot>
            <slot name="callout-content"></slot>
            <slot name="addon"></slot>
            ${this.getMiniCompareFooter()}
            <slot name="footer-rows"><slot name="body-s"></slot></slot>`:D` <div class="top-section${this.badge?" badge":""}">
                    <slot name="icons"></slot> ${this.badge}
                </div>
                <slot name="heading-m"></slot>
                ${this.card.classList.contains("bullet-list")?D`<slot name="heading-m-price"></slot>
                          <slot name="price-commitment"></slot>
                          <slot name="body-xxs"></slot>
                          <slot name="promo-text"></slot>
                          <slot name="body-m"></slot>
                          <slot name="offers"></slot>`:D`<slot name="body-m"></slot>
                          <slot name="heading-m-price"></slot>
                          <slot name="body-xxs"></slot>
                          <slot name="price-commitment"></slot>
                          <slot name="offers"></slot>
                          <slot name="promo-text"></slot> `}
                <slot name="callout-content"></slot>
                <slot name="addon"></slot>
                ${this.getMiniCompareFooter()}
                <slot name="footer-rows"><slot name="body-s"></slot></slot>`}syncHeights(){this.card.getBoundingClientRect().width<=2||(this.adjustMiniCompareBodySlots(),this.adjustMiniCompareFooterRows())}async postCardUpdateHook(){if(await Promise.all(this.card.prices.map(e=>e.onceSettled())),this.isNewVariant&&(this.legalAdjusted||await this.adjustLegal(),this.adjustShortDescription(),this.adjustCallout()),await this.adjustAddon(),Yt.isMobile)this.removeEmptyRows();else{this.padFooterRows();let e=this.getContainer();if(!e)return;let n=e.style.getPropertyValue("--consonant-merch-card-footer-row-1-min-height");requestAnimationFrame(n?()=>{this.syncHeights()}:()=>{e.querySelectorAll('merch-card[variant="mini-compare-chart"]').forEach(i=>i.variantLayout?.syncHeights?.())})}}};w(Kt,"variantStyle",bn`
        :host([variant='mini-compare-chart']) {
            max-width: var(
                --consonant-merch-card-mini-compare-chart-wide-width,
                484px
            );
        }

        :host([variant='mini-compare-chart']) > slot:not([name='icons']) {
            display: block;
        }

        :host([variant='mini-compare-chart'].bullet-list)
            > slot[name='heading-m-price'] {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
        }

        :host([variant='mini-compare-chart']) .mini-compare-chart-badge {
            font-size: 14px;
        }

        :host([variant='mini-compare-chart'].bullet-list)
            .mini-compare-chart-badge {
            padding: 2px 10px 3px 10px;
            font-size: var(--consonant-merch-card-body-xs-font-size);
            line-height: var(--consonant-merch-card-body-xs-line-height);
            border-radius: 7.11px 0 0 7.11px;
            font-weight: 700;
        }

        :host([variant='mini-compare-chart']) footer {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-footer-height
            );
            padding: var(--consonant-merch-spacing-s);
        }

        :host([variant='mini-compare-chart']) footer:has(.action-area) {
            align-items: start;
            flex-flow: column nowrap;
        }

        :host([variant='mini-compare-chart'])
            footer:has(.action-area)
            .secure-transaction-label {
            align-self: flex-end;
        }

        :host([variant='mini-compare-chart'].bullet-list) footer {
            flex-flow: column nowrap;
            min-height: var(
                --consonant-merch-card-mini-compare-chart-footer-height
            );
            padding: var(--consonant-merch-spacing-xs);
        }

        :host([variant='mini-compare-chart']) .action-area {
            display: flex;
            justify-content: end;
            align-items: flex-end;
            flex-wrap: wrap;
            width: 100%;
            gap: var(--consonant-merch-spacing-xxs);
            margin: unset;
        }

        /* mini-compare card  */
        :host([variant='mini-compare-chart']) .top-section {
            padding-top: var(--consonant-merch-spacing-s);
            padding-inline-start: var(--consonant-merch-spacing-s);
            height: var(
                --consonant-merch-card-mini-compare-chart-top-section-height
            );
        }

        :host([variant='mini-compare-chart'].bullet-list) .top-section {
            padding-top: var(--consonant-merch-spacing-xs);
            padding-inline-start: var(--consonant-merch-spacing-xs);
        }

        :host([variant='mini-compare-chart'].bullet-list)
            .secure-transaction-label {
            align-self: flex-start;
            flex: none;
            font-size: var(--consonant-merch-card-body-xxs-font-size);
            font-weight: 400;
            color: #505050;
        }

        @media screen and ${ze(Lt)} {
            [class*'-merch-cards']
                :host([variant='mini-compare-chart'])
                footer {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
        }

        @media screen and ${ze(Q)} {
            :host([variant='mini-compare-chart']) footer {
                padding: var(--consonant-merch-spacing-xs)
                    var(--consonant-merch-spacing-s)
                    var(--consonant-merch-spacing-s)
                    var(--consonant-merch-spacing-s);
            }
        }

        :host([variant='mini-compare-chart']) slot[name='footer-rows'] {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: end;
        }
        /* mini-compare card heights for the slots: heading-m, body-m, heading-m-price, price-commitment, offers, promo-text, footer */
        :host([variant='mini-compare-chart']) slot[name='heading-m'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-heading-m-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='subtitle'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-subtitle-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='body-m'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-body-m-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='heading-m-price'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-heading-m-price-height
            );
            line-height: 30px;
        }
        :host([variant='mini-compare-chart']) slot[name='body-xxs'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-body-xxs-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='price-commitment'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-price-commitment-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='offers'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-offers-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='promo-text'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-promo-text-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='callout-content'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-callout-content-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='quantity-select'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-quantity-select-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='addon'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-addon-height
            );
        }
        :host([variant='mini-compare-chart']:not(.bullet-list))
            slot[name='footer-rows'] {
            justify-content: flex-start;
        }

        /* Border color styles */
        :host(
            [variant='mini-compare-chart'][border-color='spectrum-yellow-300']
        ) {
            --consonant-merch-card-border-color: #ffd947;
        }

        :host(
            [variant='mini-compare-chart'][border-color='spectrum-gray-300']
        ) {
            --consonant-merch-card-border-color: #dadada;
        }

        :host(
            [variant='mini-compare-chart'][border-color='spectrum-green-900']
        ) {
            --consonant-merch-card-border-color: #05834e;
        }

        :host([variant='mini-compare-chart'][border-color='spectrum-red-700']) {
            --consonant-merch-card-border-color: #eb1000;
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
        }

        :host(
            [variant='mini-compare-chart'][border-color='gradient-purple-blue']
        ) {
            --consonant-merch-card-border-color: linear-gradient(
                135deg,
                #9256dc,
                #1473e6
            );
        }

        /* Badge color styles */
        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-red-700) {
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-yellow-300),
        :host([variant='mini-compare-chart']) #badge.spectrum-yellow-300 {
            background-color: #ffd947;
            color: #2c2c2c;
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-gray-300),
        :host([variant='mini-compare-chart']) #badge.spectrum-gray-300 {
            background-color: #dadada;
            color: #2c2c2c;
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-gray-700),
        :host([variant='mini-compare-chart']) #badge.spectrum-gray-700 {
            background-color: #4b4b4b;
            color: #ffffff;
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-green-900),
        :host([variant='mini-compare-chart']) #badge.spectrum-green-900 {
            background-color: #05834e;
            color: #ffffff;
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-red-700),
        :host([variant='mini-compare-chart']) #badge.spectrum-red-700 {
            background-color: #eb1000;
            color: #ffffff;
        }
    `);var te="mas-table",En="mas-table, mas-comparison-table",Be="mas-table:",Xt=2e4,Ue="milo:tab:changed",vn="milo:table:highlight:loaded",xn=900,rr=768,Ve={"toggle-row":"Toggle row","choose-table-column":"Choose table column"},di=new URL("./img/chevron-wide-black.svg",import.meta.url).href,je="mini-compare-chart",Nt={title:"heading-xs",prices:"heading-m-price",description:"body-m",ctas:"footer"},wn=[{className:"header-section-icon",cssVar:"--mas-table-header-icon-height"},{className:"header-section-title",cssVar:"--mas-table-header-title-height"},{className:"header-section-description",cssVar:"--mas-table-header-description-height"},{className:"header-section-price-strikethrough",cssVar:"--mas-table-header-strikethrough-height"},{className:"header-section-price",cssVar:"--mas-table-header-price-height"},{className:"header-section-legal",cssVar:"--mas-table-header-legal-height"},{className:"header-section-buttons",cssVar:"--mas-table-header-buttons-height"}],nr="data-mas-table-height-rules",_t="data-mas-table-height-scope",Ge=0;var or=0;function ir(t){return t?.hasAttribute(_t)||(Ge+=1,t.setAttribute(_t,`${Ge}`)),t.getAttribute(_t)}function An(t){let e=t?.closest(En)?.querySelector(`style[${nr}]`);return e?(e._tableHeightRules||(e._tableHeightRules=new Map),e):null}function Rt(t,r=""){let e=An(t),n=ir(t);!e||!n||(r?e._tableHeightRules.set(n,r):e._tableHeightRules.delete(n),e.textContent=Array.from(e._tableHeightRules.values()).join(`
`))}function Tn(t,r=[]){let e=ir(t);return!e||!r.length?"":`[${_t}="${e}"] .row-heading { ${r.join(" ")} }`}function b(t,r={},e=null){let n=document.createElement(t);return Object.entries(r).forEach(([o,i])=>{i!=null&&n.setAttribute(o,i)}),ar(n,e),n}function ar(t,r){if(r!=null){if(Array.isArray(r)){r.forEach(e=>ar(t,e));return}if(r instanceof Node){t.append(r);return}t.append(document.createTextNode(String(r)))}}function Sn(t,r){if(!r)return;let e=document.createElement("template");e.innerHTML=r,t.append(e.content.cloneNode(!0))}function oe(t){return t?.fields?Array.isArray(t.fields)?t.fields.reduce((r,e)=>(e?.name&&(r[e.name]=e.multiple?e.values||[]:e.values?.[0]),r),{}):t.fields:{}}function cr(t,r){let e=t?.[r];return e==null?"":Array.isArray(e)?String(e[0]??""):typeof e=="object"&&"value"in e?String(e.value??""):String(e)}function sr(t,r){let e=t?.[r];return e==null?[]:Array.isArray(e)?e:[e]}function ee(t){return Array.isArray(t)?t.map(r=>ee(r)):t&&typeof t=="object"&&"value"in t?ee(t.value):t}function Ln(t){let r=oe(t);return Object.fromEntries(Object.entries(r).map(([e,n])=>[e,ee(n)]))}function Cn(t={}){let r=new Map;return Object.values(t).forEach(e=>{if(e?.type!=="content-fragment"||!e.value)return;let n=e.value,o={...n,fields:oe(n)};o.id&&r.set(o.id,o),o.fields.originalId&&r.set(o.fields.originalId,o)}),r}function We(t,r){let e=t?.dictionary?.[r];return typeof e=="object"&&e&&"value"in e?e.value:e}function Nn(t){return{"toggle-row":We(t,"toggle-row")||Ve["toggle-row"],"choose-table-column":We(t,"choose-table-column")||Ve["choose-table-column"]}}function _n(){return window.matchMedia("(orientation: landscape)").matches&&window.innerHeight<=rr}function et(){let t=window.innerWidth;return t>=xn?"DESKTOP":t<=rr?"MOBILE":"TABLET"}function ie(t){return t.classList.contains("sticky")||t.classList.contains("sticky-desktop-up")&&et()==="DESKTOP"||t.classList.contains("sticky-tablet-up")&&et()!=="MOBILE"&&!_n()}function lr(t){if(!t||t.classList.contains("merch"))return!1;let r=t.querySelector(".row-heading"),e=r?.querySelector(".col-1"),n=r?.querySelector(".col-2");return!!(r&&n&&e&&!e.textContent?.trim())}function Rn(t,r){let e=t.querySelectorAll("em a, strong a, p > a strong");if(!e.length)return;let n={STRONG:"blue",EM:"outline",A:"blue"};e.forEach(o=>{let i=o.parentElement,a=o,c=n[i.nodeName]||"outline";o.nodeName==="STRONG"?a=i:(i.insertAdjacentElement("afterend",o),i.remove()),a.classList.add("con-button",c),r&&a.classList.add(r),(a.href&&[...a.href.matchAll(/#_button-([a-zA-Z-]+)/g)])?.forEach(m=>{a.href=a.href.replace(m[0],""),a.dataset.modalHash&&a.setAttribute("data-modal-hash",a.dataset.modalHash.replace(m[0],"")),a.classList.add(m[1])});let l=o.closest("p, div");l&&(l.classList.add("action-area"),l.nextElementSibling?.classList.add("supplemental-text","body-xl"))})}function kn(t,r){let e=t.classList.contains("pricing-bottom");r.forEach((n,o)=>{if(n.classList.add("col-heading"),!n.innerHTML)return;let i=n.querySelector(":scope > .heading-content")&&n.querySelector(":scope > .heading-button"),a=n.children;if(!i)if(!a.length)n.innerHTML=`<div class="heading-content"><p class="tracking-header">${n.innerHTML}</p></div>`;else{let s=0,l=!1,m=x=>x?.matches?.("img, picture, mas-mnemonic, merch-icon"),d=a[s];if(d?.classList?.contains("header-product-tile")||m(d)||d?.querySelector("img, picture, mas-mnemonic, merch-icon")){if(m(d)){let x=b("p"),C=d;for(;m(C);){let Pt=C.nextElementSibling;x.append(C),C=Pt}n.insertBefore(x,C||null),d=x}s+=1,t.classList.contains("merch")||d?.classList.add("header-product-tile")}a[s]&&(a[s].classList.add("tracking-header"),l=!0);let y=[...a].slice(s+1),E="em a, strong a, p > a strong, a.con-button",p=y.find(x=>x.querySelector(E)),v=x=>{if(!x)return!1;if(x.querySelector('[is="inline-price"], .price, [data-template], .price-integer, .price-strikethrough, .price-alternative'))return!0;let C=x.textContent?.trim()||"";return/(?:US?\$|CA\$|A\$|€|£|¥|\/(?:mo|month|Monat))/i.test(C)},A=y.filter(x=>x!==p),g=A.find(v);!g&&A.length>1&&(g=A[A.length-1]);let u=A.find(x=>x!==g);g&&g.classList.add("pricing"),u&&u.classList.add("body"),Rn(n,"button-xl");let T=b("div",{class:"buttons-wrapper"});n.append(T),n.querySelectorAll(".con-button").forEach(x=>{let C=x.closest("p");C&&T.append(C)});let G=b("div",{class:"heading-content"}),W=b("div",{class:"heading-button"});if([...a].forEach(x=>{x.classList.contains("pricing")&&e?W.appendChild(x):G.appendChild(x)}),W.appendChild(T),n.append(G,W),!l){let x=Array.from(n.childNodes).find(C=>C.nodeType===Node.TEXT_NODE);x?.textContent?.trim()&&G.append(b("p",{class:"tracking-header"},x.textContent)),x?.remove()}}let c=n.querySelector(".tracking-header");if(c){let s=`t${or+1}-c${o+1}-header`;c.setAttribute("id",s);let l=n.querySelector(".body:not(.action-area)");l?.setAttribute("id",`${s}-body`);let m=n.querySelector(".pricing");m?.setAttribute("id",`${s}-pricing`);let d=`${l?.id??""} ${m?.id??""}`.trim();c.setAttribute("aria-describedby",d),n.setAttribute("role","columnheader")}n.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(s=>{s.setAttribute("role","paragraph")})})}function j(t,r=[]){return b("div",{class:`header-section ${t}`},Array.isArray(r)?r.filter(Boolean):r)}function Mn(t,r){if(!t||t.tagName.toLowerCase()===r)return t;let e=document.createElement(r);return Array.from(t.attributes).forEach(({name:n,value:o})=>{e.setAttribute(n,o)}),e.append(...Array.from(t.childNodes)),t.replaceWith(e),e}function On(t){t.querySelectorAll(".row-heading p.pricing, .row-heading p.supplemental-text, .row-heading p.pricing-after").forEach(r=>{Mn(r,"div")})}function Qt(t,r){return!t||t.nodeType!==Node.ELEMENT_NODE?!1:t.matches(r)||!!t.querySelector(r)}function dr(t){return t?t.nodeType===Node.TEXT_NODE?t.textContent?.trim()?"price":"":t.nodeType!==Node.ELEMENT_NODE?"":Qt(t,`${_}[data-template="${Y}"], [data-template="${Y}"], .price-legal`)?"legal":Qt(t,`${_}[data-template="strikethrough"], [data-template="strikethrough"], .price-strikethrough, .price-promo-strikethrough`)?"strikethrough":Qt(t,`${_}, [data-template], .price, .price-alternative`)?"price":"":""}function Ye(t,r,e=[]){let n=e.filter(o=>o&&(o.nodeType!==Node.TEXT_NODE||o.textContent.trim()));return n.length?b(t.tagName.toLowerCase(),{class:r},n):null}function Pn(t){if(!t)return{strikethrough:null,price:null,legal:null};let r={strikethrough:[],price:[],legal:[]},e="";Array.from(t.childNodes).forEach(i=>{let a=dr(i);!a&&i.nodeType===Node.TEXT_NODE&&(a=e||"price"),a||(a=i.textContent?.trim()?"price":e),a&&(r[a].push(i),e=a)}),!r.strikethrough.length&&!r.price.length&&!r.legal.length&&(r.price=Array.from(t.childNodes));let o=Array.from(t.classList).filter(i=>!["has-pricing-before","has-pricing-after"].includes(i)).join(" ");return{strikethrough:Ye(t,[o,"pricing-strikethrough-group"].filter(Boolean).join(" "),r.strikethrough),price:Ye(t,[o,"pricing-main-group"].filter(Boolean).join(" "),r.price),legal:b("div",{class:"pricing-legal-group"},r.legal.filter(i=>i&&(i.nodeType!==Node.TEXT_NODE||i.textContent.trim())))}}function In(t){let r=Array.from(t.children);if(!r.length)return;let e=r.find(u=>u.classList.contains("heading-content"))||null,n=r.find(u=>u.classList.contains("heading-button"))||null,o=Array.from(e?.children||[]),i=r.filter(u=>u!==e&&u!==n&&(u.classList.contains("content-before")||u.classList.contains("content-after"))),a=o.find(u=>u.classList.contains("header-product-tile"))||null,c=o.find(u=>u.classList.contains("tracking-header"))||null,s=o.find(u=>u.classList.contains("body"))||null,l=o.filter(u=>u!==a&&u!==c&&u!==s),m=Array.from(n?.children||[]),d=m.find(u=>u.classList.contains("pricing"))||null,h=m.filter(u=>u!==d&&!u.classList.contains("buttons-wrapper")&&(u.classList.contains("pricing-before")||u.classList.contains("pricing-after")||u.classList.contains("supplemental-text"))),y=m.find(u=>u.classList.contains("buttons-wrapper"))||null,{strikethrough:E,price:p,legal:v}=Pn(d),A=[...h,...v?.childNodes?Array.from(v.childNodes):[]],g=[j("header-section-icon",a?[a]:[]),j("header-section-title",c?[c]:[]),j("header-section-description",[...i,s,...l].filter(Boolean)),j("header-section-price-strikethrough",E?[E]:[]),j("header-section-price",p?[p]:[]),j("header-section-legal",A),j("header-section-buttons",y?[y]:[])];t.replaceChildren(...g)}function Hn(t){if(!t.classList.contains("merch"))return;t.querySelectorAll(".row-heading .col-heading").forEach(e=>In(e))}function Dn(t){let r=t.querySelector(".row-heading");if(!r){Rt(t,"");return}let e=Array.from(r.querySelectorAll(":scope > .col-heading")).filter(o=>!o.classList.contains("col-1")&&!o.classList.contains("hidden")&&getComputedStyle(o).display!=="none");if(!e.length){Rt(t,"");return}let n=[];wn.forEach(({className:o,cssVar:i})=>{let a=0;e.forEach(c=>{let s=c.querySelector(`:scope > .${o}`);s&&(a=Math.max(a,Math.ceil(s.getBoundingClientRect().height)))}),a>0&&n.push(`${i}: ${a}px;`)}),Rt(t,Tn(t,n))}function rt(t){Rt(t,""),t.classList.contains("merch")&&Dn(t)}function $n(t){let r=[...t.querySelectorAll(".section-row-title")].filter(e=>e.innerText.toUpperCase().includes("ADDON"));r.length&&(t.classList.add("has-addon"),r.forEach(e=>{let n=e.parentElement;n.remove();let[o,i,a]=e.innerText.split("-").filter(s=>s.toUpperCase()!=="ADDON").map(s=>s.toLowerCase());if(!o||!i)return;let c="data-col-index";[...t.querySelector(".row-heading").children].forEach(s=>{s.querySelector(".heading-content")?.classList.add("content");let l=s.getAttribute(c);if(Number(l)<=1)return;let m=`${o}-${i}`,d=[...n.children].find(v=>v.getAttribute(c)===l);if(!d)return;let h=[...d.childNodes],y=d.querySelector(".icon");if(a==="label"&&y){let v=h.filter(A=>!A.classList?.contains("icon"));h=[b("span",{},v),y]}let E=b("div",{class:a?`${m} addon-${a}`:m},h.map(v=>v.cloneNode(!0))),p=s.querySelector(`.${o}`);o==="pricing"&&i==="after"||p?.classList.add(`has-${m}`),p?.insertAdjacentElement(i==="before"?"beforebegin":"afterend",E)})}),setTimeout(()=>rt(t),0),t.addEventListener("mas:resolved",bt(()=>{rt(t)},100)))}function re(t,r){let e=t.querySelectorAll('.icon.expand[role="button"]');[...t.parentElement.querySelectorAll(".filters .filter"),...e].forEach(i=>{let a=i.classList.contains("filter")?"choose-table-column":"toggle-row";i.setAttribute("aria-label",r[a])})}function kt(t){t.dispatchEvent(new Event(vn))}function Ke(t,r=[]){t.forEach((e,n)=>{let o=n===0||n===t.length-1,i=r[n],a=!!i&&(i.innerText||i.dataset.hasBadge==="true");e.classList.toggle("no-rounded",!o||a)})}function qn(t){let r=t.classList.contains("highlight"),e=t.querySelector(".row-1"),n=e.querySelectorAll(".col"),o=t.querySelector(".row-2"),i=o?.querySelectorAll(".col")||[],a;r&&o?(e.classList.add("row-highlight"),e.setAttribute("aria-hidden","true"),o.classList.add("row-heading"),i.forEach(c=>c.classList.add("col-heading")),a=i,n.forEach((c,s)=>{c.classList.add("col-highlight"),c.innerText||c.dataset.hasBadge==="true"?t.classList.contains("compare-chart-features")||a[s]?.classList.add("no-rounded"):c.classList.add("hidden")}),t.classList.contains("compare-chart-features")&&Ke(a,n)):(a=n,e.classList.add("row-heading"),t.classList.contains("compare-chart-features")&&Ke(a)),kn(t,a),$n(t),On(t),Hn(t),kt(t)}function Xe(t){let r=t.closest(".row"),e=r.nextElementSibling,n=t.getAttribute("aria-expanded")==="false";for(t.setAttribute("aria-expanded",n.toString());e&&!e.classList.contains("divider");)n?(r.classList.remove("section-head-collaped"),e.classList.remove("hidden")):(r.classList.add("section-head-collaped"),e.classList.add("hidden")),e=e.nextElementSibling}function Qe(t){t.querySelectorAll(".icon.expand").forEach(r=>{let e=r.parentElement,n=()=>Xe(r),o=i=>{i.key===" "&&i.preventDefault(),(i.key==="Enter"||i.key===" ")&&Xe(r)};e.classList.add("point-cursor"),e.setAttribute("tabindex",0),e.addEventListener("click",n),e.addEventListener("keydown",o)})}function Ze(t){if(!t||t.querySelector(".table-title-text"))return;let r=b("span",{class:"table-title-text"});for(;t.firstChild;)r.append(t.firstChild);let e=r.textContent?.replace(/\u00a0/g," ").trim();if(!r.querySelector('a, em, strong, b, i, picture, img, mas-mnemonic, merch-icon, [is="inline-price"], .icon, .icon-info, .icon-tooltip, .milo-tooltip, blockquote')&&(!e||e==="-")){t.replaceChildren();return}let o=r.querySelector(".icon-info, .icon-tooltip, .milo-tooltip");o&&t.append(o.closest("em")||o);let i=r.querySelector(".icon:first-child"),a=r;if(i){let s=b("span",{class:"table-title-row"});s.append(i,r),a=s}let c=a.querySelector("blockquote");if(c){let s=b("div",{class:"blockquote"});for(;c.firstChild;)s.appendChild(c.firstChild);c.replaceWith(s)}t.insertBefore(a,t.firstChild)}function zn(t){let{row:r,index:e,allRows:n,rowCols:o,isMerch:i,isCollapseTable:a,isHighlightTable:c}=t,{expandSection:s}=t,l=n[e-1],m=n[e+1],d=Array.from(m?.children||[]);if(r.querySelector("hr")&&m){r.classList.add("divider"),r.removeAttribute("role"),m.classList.add("section-head");let h=d[0];if(i&&d.length?d.forEach(y=>{y.classList.add("section-head-title"),y.setAttribute("role","rowheader")}):(Ze(h),h.classList.add("section-head-title"),h.setAttribute("role","rowheader")),a&&h){let y=b("span",{class:"icon expand",role:"button"});if(h.querySelector(".icon.expand")||h.prepend(y),s)y.setAttribute("aria-expanded","true"),s=!1;else{y.setAttribute("aria-expanded","false"),m.classList.add("section-head-collaped");let E=r.nextElementSibling;for(;E&&!E.classList.contains("divider");)E.classList.add("hidden"),E=E.nextElementSibling}}}else if(l?.querySelector("hr")&&m){if(m.classList.add("section-row"),!i){let h=d[0];h?.classList.add("section-row-title"),h?.setAttribute("role","rowheader"),h?.setAttribute("scope","row")}}else if(!r.classList.contains("row-1")&&(!c||!r.classList.contains("row-2")))if(r.classList.add("section-row"),o.forEach(h=>{if(h.querySelector("a")&&!h.querySelector("span")){let y=b("span",{class:"col-text"},[...h.childNodes]);h.appendChild(y)}}),i&&!r.classList.contains("divider"))o.forEach(h=>{if(h.classList.add("col-merch"),!h.children.length&&h.innerText){let y=b("p",{class:"merch-col-text"},h.innerText);h.innerText="",h.append(y)}});else{let h=o[0];Ze(h),h.classList.add("section-row-title"),h.setAttribute("role","rowheader"),h.setAttribute("scope","row")}return o.forEach(h=>{h.querySelector(":scope > :is(strong, em, del, code, sub, sup)")&&h.childNodes.length>1&&!h.querySelector("picture")&&h.replaceChildren(b("p",{},[...h.childNodes]))}),s}function Fn(t){let r=t.querySelectorAll(".row"),e=r.length,i=r[0].querySelectorAll(".col").length;for(let a=i;a>0;a-=1){let c=t.querySelectorAll(`.col-${a}`);for(let s=e-1;s>=0;s-=1){let l=c[s];if(!l?.innerText&&l?.children.length===0)l.classList.add("no-borders");else{l.classList.add("border-bottom");break}}}}function Je(t){t.forEach(r=>r.classList.remove("hover","no-top-border","hover-border-bottom"))}function Bn(t){let r=t.querySelector(".row-1");if(!r)return;let e=r.childElementCount,o=t.classList.contains("merch")&&!t.classList.contains("compare-chart-features")?1:2,i=t.classList.contains("collapse"),a=t.querySelectorAll(".section-head"),c=a[a.length-1],s=c?.querySelector(".icon.expand");for(let l=o;l<=e;l+=1){let m=t.querySelectorAll(`.col-${l}`);m.forEach(d=>{d.addEventListener("mouseover",()=>{Je(m);let h=t.querySelector(".row-heading"),y=`col-${l}`,E=s?.getAttribute("aria-expanded")==="false";m.forEach(p=>{if(p.classList.contains("col-highlight")&&p.innerText){let v=Array.from(p.classList).find(g=>g.startsWith(y));h?.querySelector(`.${v}`)?.classList.add("no-top-border")}i&&E&&c?.querySelector(`.col-${l}`)?.classList.add("hover-border-bottom"),p.classList.add("hover")})}),d.addEventListener("mouseout",()=>Je(m))})}}function hr(t,r){t._stickyObserver?.disconnect();let e=r(),n=t.querySelector(".row-highlight"),o=t.querySelector(".row-heading");if(!o)return;n?(n.style.top=`${e}px`,n.classList.add("top-border-transparent")):o.classList.add("top-border-transparent");let i=e+(n?n.offsetHeight:0);o.style.top=`${i}px`;let a=t.querySelector(".intercept")||b("div",{class:"intercept"});a.setAttribute("data-observer-intercept",""),o.insertAdjacentElement("beforebegin",a);let c=new IntersectionObserver(([s])=>{o.classList.toggle("active",!s.isIntersecting)},{rootMargin:`-${i}px`});c.observe(a),t._stickyObserver=c}function Zt(t,r){t._filterObserver?.disconnect();let e=t.parentElement?.querySelector(".filters");if(!e)return;let n=ie(t)&&et()==="MOBILE"&&lr(t);if(e.classList.toggle("sticky-mobile-compare",n),e.classList.remove("active"),!n){e.style.removeProperty("top");return}let o=r();e.style.top=`${o}px`;let i=e.parentElement?.querySelector(".filters-intercept")||b("div",{class:"filters-intercept"});i.setAttribute("data-observer-intercept",""),e.insertAdjacentElement("beforebegin",i);let a=new IntersectionObserver(([c])=>{e.classList.toggle("active",!c.isIntersecting)},{rootMargin:`-${o}px`});a.observe(i),t._filterObserver=a}function Un(t,r,e,n){let o=t.querySelector(".row-heading");if(!o){kt(t);return}let i=t.classList.contains("merch"),a=lr(t),c=et(),s=()=>{if(i)return;let d=Array.from(t.getElementsByClassName("section-row"));if(d.length){let E=`repeat(auto-fit, ${100/(d[0].children.length-1)}%)`;d.forEach(p=>{c==="TABLET"||c==="MOBILE"&&!p.querySelector(".col-3")?p.style.gridTemplateColumns=E:p.style.gridTemplateColumns=""})}},l=()=>{kt(t);let d=t.querySelectorAll(".row-heading .col"),h=Array.from(d).filter(p=>p.textContent.trim()).length;if(t.querySelectorAll(".hide-mobile").forEach(p=>{p.classList.remove("hide-mobile")}),i&&h>=2?t.querySelectorAll(".col:not(.col-1, .col-2)").forEach(p=>{p.classList.add("hide-mobile")}):h>=3&&t.querySelectorAll(".col:not(.col-1, .col-2, .col-3), .col.no-borders").forEach(p=>{p.classList.add("hide-mobile")}),!i&&!t.querySelector(".col-3")||i&&!t.querySelector(".col-2"))return;a&&t.querySelectorAll(".row-heading .col-1, .row-highlight .col-1").forEach(p=>{p.classList.add("hide-mobile"),p.style.display="none"});let y=p=>{let v=Array.from(t.parentElement.querySelectorAll(".filter")).map(g=>parseInt(g.value,10)),A=t.querySelectorAll(".row");if(t.querySelectorAll(".hide-mobile, .force-last").forEach(g=>{g.classList.remove("hide-mobile","force-last")}),A.forEach(g=>{g.querySelectorAll(".col[data-cloned]").forEach(u=>u.remove())}),i?t.querySelectorAll(`.col:not(.col-${v[0]+1}, .col-${v[1]+1})`).forEach(g=>{g.classList.add("hide-mobile")}):t.querySelectorAll(`.col:not(.col-1, .col-${v[0]+1}, .col-${v[1]+1}), .col.no-borders`).forEach(g=>{g.classList.add("hide-mobile")}),a&&t.querySelectorAll(".row-heading .col-1, .row-highlight .col-1").forEach(g=>{g.classList.add("hide-mobile"),g.style.display="none"}),A.forEach(g=>{let u=g.querySelector(`.col-${v[0]+1}`),T=g.querySelector(`.col-${v[1]+1}`);u?.classList.contains("col-heading")&&(u.classList.remove("right-round"),u.classList.add("left-round")),T?.classList.contains("col-heading")&&(T.classList.remove("left-round"),T.classList.add("right-round")),T&&T.classList.add("force-last")}),v[0]===v[1]){let g=v[0]+1;A.forEach(u=>{let T=u.querySelector(`.col-${g}`);if(!T)return;let O=T.cloneNode(!0);O.setAttribute("data-cloned","true"),T.classList.remove("force-last"),T.classList.contains("col-heading")&&(T.classList.remove("right-round"),T.classList.add("left-round"),O.classList.remove("left-round"),O.classList.add("right-round")),u.appendChild(O)})}s(),ie(t)&&hr(t,n),Zt(t,n),p&&rt(t),re(t,e)},E=h>2;if(!t.parentElement.querySelector(".filters")&&E){let p=b("div",{class:"filters"}),v=b("div",{class:"filter-wrapper"}),A=b("div",{class:"filter-wrapper"}),g=b("select",{class:"filter"});r.querySelectorAll(".col-heading").forEach((C,Pt)=>{let It=C.querySelector(".tracking-header");if(!It||!i&&It.closest(".col-1"))return;let mr=b("option",{value:Pt},It.innerText);g.append(mr)});let T=g.cloneNode(!0);g.dataset.filterIndex=0,T.dataset.filterIndex=1;let O=t.querySelectorAll(`.col-heading:not([style*="display: none"], .hidden${i?"":", .col-1"})`),G=i?1:2,W=g.querySelectorAll("option").item(O.item(0).dataset.colIndex-G),x=T.querySelectorAll("option").item(O.item(1).dataset.colIndex-G);W&&(W.selected=!0),x&&(x.selected=!0),v.append(g),A.append(T),p.append(v,A),v.addEventListener("change",y),A.addEventListener("change",y),t.parentElement.insertBefore(p,t),t.parentElement.classList.add(`table-${t.classList.contains("merch")?"merch-":""}section`),!i&&h<3&&(p.style.display="none"),y()}Zt(t,n)},m=()=>{t.querySelectorAll(".row .col[data-cloned]").forEach(d=>{d.remove()})};!i&&!t.querySelector(".row-heading .col-2")&&(o.style.display="block",o.querySelector(".col-1")?.style.setProperty("display","flex")),m(),c==="MOBILE"||i&&c==="TABLET"?l():(t.querySelectorAll(".hide-mobile, .left-round, .right-round").forEach(d=>{d.classList.remove("hide-mobile","left-round","right-round")}),a&&t.querySelectorAll(".row-heading .col-1, .row-highlight .col-1").forEach(d=>{d.style.removeProperty("display")}),Zt(t,n),[...o.children].forEach(d=>[...d.children].forEach(h=>h.style.removeProperty("height"))),t.parentElement.querySelectorAll(".filters select").forEach((d,h)=>{d.querySelectorAll("option").item(h).selected=!0})),kt(t),Bn(t),s()}function Ct(t){t.classList.value.includes("sticky")&&setTimeout(()=>{let r=t.querySelector(".row-heading")?.offsetHeight||0;t.classList.toggle("cancel-sticky",!(r/window.innerHeight<.45))})}function Vn(t,r){t.setAttribute("role","table"),t.parentElement.classList.contains("section")&&t.parentElement.classList.add(`table-${t.classList.contains("merch")?"merch-":""}section`);let e=Array.from(t.children),n=t.classList.contains("merch"),o=t.classList.contains("collapse")&&!n,i=t.classList.contains("highlight"),a=!0;e.forEach((E,p)=>{E.classList.add("row",`row-${p+1}`),E.setAttribute("role","row");let v=Array.from(E.children),A={row:E,index:p,allRows:e,rowCols:v,isMerch:n,isCollapseTable:o,expandSection:a,isHighlightTable:i};v.forEach((g,u)=>{g.dataset.colIndex=u+1,g.classList.add("col",`col-${u+1}`),g.setAttribute("role",g.matches(".section-head-title")?"columnheader":"cell")}),a=zn(A)}),qn(t),Ct(t),n&&Fn(t);let c=!1,s=et(),l=()=>{Un(t,t._originTable,r.labels,r.getStickyTop),rt(t),ie(t)&&hr(t,r.getStickyTop)};t.querySelectorAll(n?".col-heading:not(.hidden)":".col-heading:not(.hidden, .col-1)").length>2?t._originTable=t.cloneNode(!0):t._originTable=t;let m=bt(()=>{rt(t),Ct(t);let E=et();s!==E&&(s=E,l())},100),d=()=>Ct(t),h=new IntersectionObserver(E=>{E.some(p=>p.isIntersecting)&&(h.disconnect(),c||(l(),Qe(t),re(t,r.labels),c=!0))}),y=new ResizeObserver(bt(()=>Ct(t),100));return y.observe(t),window.addEventListener("resize",m),window.addEventListener(Ue,d),h.observe(t),c||setTimeout(()=>{c||(l(),Qe(t),re(t,r.labels),c=!0)},0),or+=1,()=>{h.disconnect(),y.disconnect(),t._stickyObserver?.disconnect(),t._filterObserver?.disconnect(),delete t._stickyObserver,delete t._filterObserver,delete t._originTable,window.removeEventListener("resize",m),window.removeEventListener(Ue,d)}}function z(t){return t?t.startsWith("color-")||t.startsWith("spectrum-")||t.startsWith("--")?t.startsWith("--")?`var(${t})`:`var(--${t})`:t:""}function jn(t,r=""){let e=b("mas-mnemonic",{slot:"icons",src:t,size:"l"});return r&&(e.setAttribute("role","img"),e.setAttribute("aria-label",r)),e}function Mt(t,r){return t?Array.from(t.querySelectorAll(`[slot="${r}"]`)).map(e=>e.cloneNode(!0)):[]}function tr(t){return t?Array.from(t.childNodes).map(r=>r.cloneNode(!0)):[]}function ae(t){if(!t)return[];if(t.nodeType!==Node.ELEMENT_NODE)return[t.cloneNode(!0)];let r=Ot(t.cloneNode(!0)),e=Array.from(r.childNodes).some(o=>o.nodeType===Node.TEXT_NODE&&o.textContent.trim()),n=r.childElementCount===1&&r.firstElementChild&&!e;return n&&r.firstElementChild.matches?.(`${_}, ${Ht}, merch-icon, merch-badge, mas-mnemonic`)?[r.firstElementChild.cloneNode(!0)]:n?tr(r.firstElementChild):["P","DIV","H1","H2","H3","H4","H5","H6"].includes(r.tagName)?tr(r):[r]}function Ot(t){return!t||t.nodeType!==Node.ELEMENT_NODE||(t.removeAttribute("slot"),t.querySelectorAll?.("[slot]").forEach(r=>r.removeAttribute("slot"))),t}function er(t,r){return Mt(t,r).map(Ot).find(Boolean)}function Gn(t,r){if(!t)return null;let e=b("p",{class:r}),n=ae(t);return n.length?e.append(...n):e.textContent=t.textContent?.trim()||"",e.textContent?.trim()||e.childNodes.length?e:null}function Wn(t){if(!t)return null;let r=b("p",{class:"body"}),e=ae(t);return e.length?r.append(...e):r.textContent=t.textContent?.trim()||"",r.textContent?.trim()||r.childNodes.length?r:null}function Yn(t=[]){let r={strikethrough:[],price:[],legal:[]},e="";return t.forEach(n=>{let o=Ot(n.cloneNode(!0)),i=dr(o);!i&&o.nodeType===Node.TEXT_NODE&&(i=o.textContent?.trim()?e||"price":""),!i&&o.textContent?.trim()&&(i="price"),i&&(r[i].push(o),e=i)}),r}function Jt(t,r=[]){let e=r.filter(n=>n&&(n.nodeType!==Node.TEXT_NODE||n.textContent.trim()));return e.length?b("div",{class:t},e):null}function Kn(t=[]){for(let r of t){if(r?.nodeType!==Node.ELEMENT_NODE)continue;let e=r.matches?.(_)?r.cloneNode(!0):r.querySelector?.(_)?.cloneNode(!0);if(e)return e.setAttribute("data-template",Y),e.setAttribute("data-display-plan-type","true"),e.setAttribute("data-display-per-unit","false"),e.setAttribute("data-display-tax","false"),e.setAttribute("data-display-old-price","false"),e.hasAttribute("data-force-tax-exclusive")||e.setAttribute("data-force-tax-exclusive","true"),e}return null}function Xn(t){let e=Mt(t,Nt.ctas).map(Ot).flatMap(o=>o.matches?.(".con-button, button, a.con-button")?[o]:Array.from(o.querySelectorAll?.(".con-button, button, a.con-button")||[]).map(i=>i.cloneNode(!0)));if(!e.length)return null;let n=b("div",{class:"buttons-wrapper"});return e.forEach((o,i)=>{let a=i===0?b("p"):b("div",{class:"supplemental-text body-xl action-area"});a.append(o),n.append(a)}),n}function Qn(t){let r=document.createDocumentFragment(),e=b("div",{class:"heading-content content"}),n=b("div",{class:"heading-button"}),o=Mt(t,"icons");if(o.length){let E=b("p",{class:"header-product-tile"});o.forEach(p=>{if(p.tagName==="MERCH-ICON"){let v=jn(p.getAttribute("src")||"",p.getAttribute("alt")||"");v.removeAttribute("slot"),E.append(v);return}p.removeAttribute?.("slot"),E.append(p)}),e.append(E)}let i=Gn(er(t,Nt.title),"tracking-header");i&&e.append(i);let a=Wn(er(t,Nt.description));a&&e.append(a);let c=Mt(t,Nt.prices).flatMap(E=>ae(E)),s=Yn(c),l=Jt("pricing-before",s.strikethrough);l&&n.append(l);let m=Jt("pricing",s.price);m&&n.append(m);let d=s.legal.length?s.legal:[Kn(s.price)].filter(Boolean),h=Jt("pricing-after",d);h&&n.append(h);let y=Xn(t);return y&&n.append(y),r.append(e,n),r}function Zn(t){if(!t)return null;if(t._masTableBadgeData?.contentHtml||t._masTableBadgeData?.text)return t._masTableBadgeData;let r=t.querySelector('[slot="badge"]'),e=t.shadowRoot?.getElementById("badge"),n=r?.matches("merch-badge")?r:r?.querySelector("merch-badge"),o=n?.innerHTML?.trim()||r?.innerHTML?.trim()||e?.innerHTML?.trim()||"",i=n?.textContent?.trim()||r?.textContent?.trim()||e?.textContent?.trim()||t.getAttribute("badge-text")||"";if(!o&&!i)return null;let a=e?getComputedStyle(e):null,c=z(n?.getAttribute("background-color")||"")||z(t.getAttribute("badge-background-color")||"")||a?.backgroundColor||"",s=z(n?.getAttribute("color")||"")||z(t.getAttribute("badge-color")||"")||a?.color||"";return{contentHtml:o,text:i,icon:n?.getAttribute("icon")||"",backgroundColor:c,textColor:s}}function Jn(t){return t?t.startsWith("sp-icon-")?b(t,{class:"badge-icon"}):b("img",{class:"badge-icon",src:t,alt:""}):null}function to(t){let r=b("span",{class:"badge-inline-content"}),e=Jn(t.icon),n=!!(t.contentHtml||t.text);if(e&&r.append(e),e&&n&&r.append(document.createTextNode(" ")),t.contentHtml){let o=document.createElement("template");o.innerHTML=t.contentHtml,r.append(o.content.cloneNode(!0))}else t.text&&r.append(document.createTextNode(t.text));return r}function eo(t={}){let r=t.badge;if(!r)return null;if(typeof r!="string"){let a=String(r).trim();return a?{contentHtml:"",text:a,icon:"",backgroundColor:z(t.badgeBackgroundColor||""),textColor:z(t.badgeColor||"")}:null}let e=document.createElement("template");e.innerHTML=r;let n=e.content.querySelector("merch-badge")||e.content.firstElementChild,o=n?.innerHTML?.trim()||"",i=n?.textContent?.trim()||r.trim();return!o&&!i?null:{contentHtml:o,text:i,icon:n?.getAttribute?.("icon")||"",backgroundColor:z(n?.getAttribute?.("background-color")||t.badgeBackgroundColor||""),textColor:z(n?.getAttribute?.("color")||t.badgeColor||"")}}async function ro(t,r,e){let n=await Promise.all(t.map(async o=>{let i=r.get(o);if(!i)return[o,null];try{let a=document.createElement("merch-card"),c={...Ln(i),variant:je};return a.variant=je,a._masTableBadgeData=eo(c),e.append(a),await De({...i,fields:c,settings:i.settings||{},variantLayout:{aemFragmentMapping:Fe}},a),[o,a]}catch{return[o,null]}}));return new Map(n.filter(([,o])=>o))}function no(t,r,e){if(!t.classList.contains("merch")&&!t.classList.contains("compare-chart-features")||!t.classList.contains("highlight"))return;let n=t.firstElementChild;if(!n)return;let o=Array.from(n.children),i=t.classList.contains("compare-chart-features")?1:0;r.forEach((a,c)=>{let s=o[c+i],l=Zn(e.get(a));if(s){if(!l?.contentHtml&&!l?.text){s.removeAttribute("data-has-badge"),s.replaceChildren();return}s.dataset.hasBadge="true",s.replaceChildren(to(l)),l.backgroundColor&&(s.style.backgroundColor=l.backgroundColor,s.style.borderColor=l.backgroundColor),l.textColor&&(s.style.color=l.textColor)}})}function oo(t,r,e){if(!t.classList.contains("merch")&&!t.classList.contains("compare-chart-features")||!r?.length)return;let n=Array.from(t.children);if(!n.length)return;let o=t.classList.contains("highlight")&&n.length>1?1:0,i=n[o];if(!i)return;let a=Array.from(i.children),c=t.classList.contains("compare-chart-features")?1:0;r.forEach((s,l)=>{let m=a[l+c],d=e.get(s);!m||!d||m.replaceChildren(Qn(d))})}function io(t,r){cr(r,"blockName")==="Table"&&sr(r,"selectedVariantNames").forEach(n=>{n&&t.classList.add(String(n))})}async function ao(t){let r=[...t.querySelectorAll(Ht)];await Promise.all(r.map(e=>typeof e.onceSettled!="function"?Promise.resolve(e):e.onceSettled().catch(()=>e)))}var lt,Z,dt,$,ht,mt,J,pt,ut,tt,q,M,ne=class extends HTMLElement{constructor(){super();S(this,lt,[]);S(this,Z,0);S(this,dt);S(this,$);S(this,ht);S(this,mt);S(this,J);S(this,pt);S(this,ut,Promise.resolve(this));S(this,tt);S(this,q);S(this,M);L(this,tt,document.createElement("style")),f(this,tt).setAttribute(nr,""),L(this,q,document.createElement("div")),L(this,M,document.createElement("div")),f(this,M).className="mas-table-scratch",f(this,M).hidden=!0,f(this,M).setAttribute("aria-hidden","true"),this.append(f(this,tt),f(this,q),f(this,M)),this.handleAemFragmentEvents=this.handleAemFragmentEvents.bind(this)}connectedCallback(){let e=this.localName||te;L(this,$,nt()),f(this,dt)??L(this,dt,f(this,$)?.Log?.module?.(e)??f(this,$)?.log?.module?.(e)??console),this.syncDirection();let n=this.getAttribute("id")??this.aemFragment?.getAttribute("fragment")??"unknown";L(this,J,`${Be}${n}${Ee}`),L(this,pt,`${Be}${n}${ve}`),performance.mark(f(this,J)),this.addEventListener(ft,this.handleAemFragmentEvents),this.addEventListener(gt,this.handleAemFragmentEvents),this.aemFragment?.setAttribute("hidden","")}disconnectedCallback(){this.removeEventListener(ft,this.handleAemFragmentEvents),this.removeEventListener(gt,this.handleAemFragmentEvents),this.cleanup()}get aemFragment(){return this.querySelector("aem-fragment")}get updateComplete(){return f(this,ut)}syncDirection(){let e=this.closest("[dir]")?.getAttribute("dir")||document.documentElement.getAttribute("dir")||"ltr";this.setAttribute("dir",e)}cleanup(){f(this,lt).splice(0).forEach(e=>e())}beginUpdate(){L(this,ut,new Promise((e,n)=>{L(this,ht,e),L(this,mt,n)}))}async handleAemFragmentEvents(e){var o;if(!this.isConnected)return;if(e.type===ft&&e.target===this.aemFragment){this.fail("AEM fragment cannot be loaded");return}if(e.type!==gt||e.target!==this.aemFragment)return;this.removeAttribute("failed"),this.beginUpdate();let n=++de(this,Z)._;try{if(await this.renderFragment(e.detail),n!==f(this,Z))return;await ao(this),f(this,q).querySelectorAll(".table").forEach(c=>rt(c));let i=performance.measure(f(this,pt),f(this,J)),a={...this.aemFragment?.fetchInfo,...f(this,$)?.duration,measure:xe(i)};this.dispatchEvent(new CustomEvent(he,{bubbles:!0,composed:!0,detail:a})),(o=f(this,ht))==null||o.call(this,this)}catch(i){if(n!==f(this,Z))return;this.fail(i.message||"Failed to render table")}}getStickyTop(){let e=getComputedStyle(this).getPropertyValue("--mas-table-sticky-top"),n=parseFloat(e);return Number.isFinite(n)?n:0}async renderFragment(e){let n=oe(e),o=cr(n,"compareChart").trim();if(!o)throw new Error("compareChart field is missing");this.cleanup(),f(this,q).replaceChildren(),f(this,M).replaceChildren();let i=document.createElement("div");i.className="mas-table-empty",Sn(i,o);let a=Array.from(i.querySelectorAll(".table"));if(!a.length)throw new Error("compareChart does not contain a .table block");let c=Cn(e.references),s=sr(n,"cards").map(String),l=await ro(s,c,f(this,M)),m=Nn(e);a.forEach(d=>{io(d,n),no(d,s,l),oo(d,s,l);let h=Vn(d,{labels:m,getStickyTop:()=>this.getStickyTop()});f(this,lt).push(h)}),f(this,q).append(...Array.from(i.childNodes))}fail(e,n={}){var a;if(!this.isConnected)return;this.setAttribute("failed","");let o=this.localName||te,i={...this.aemFragment?.fetchInfo,...f(this,$)?.duration,...n,message:e};f(this,dt)?.error?.(`${o}: ${e}`,i),this.dispatchEvent(new CustomEvent(me,{bubbles:!0,composed:!0,detail:i})),(a=f(this,mt))==null||a.call(this,new Error(e))}async checkReady(){let e=new Promise(o=>setTimeout(()=>o("timeout"),Xt));if(this.aemFragment){let o=await Promise.race([this.aemFragment.updateComplete,e]);if(o===!1||o==="timeout"){let i=o==="timeout"?`AEM fragment was not resolved within ${Xt} timeout`:"AEM fragment cannot be loaded";throw this.fail(i),new Error(i)}}let n=await Promise.race([this.updateComplete,e]);if(n==="timeout"){let o=`mas-table was not resolved within ${Xt} timeout`;throw this.fail(o),new Error(o)}return n}};lt=new WeakMap,Z=new WeakMap,dt=new WeakMap,$=new WeakMap,ht=new WeakMap,mt=new WeakMap,J=new WeakMap,pt=new WeakMap,ut=new WeakMap,tt=new WeakMap,q=new WeakMap,M=new WeakMap;customElements.define(te,ne);export{ne as MasTable};
