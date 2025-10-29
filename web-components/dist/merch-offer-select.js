var Ue=Object.defineProperty;var ce=o=>{throw TypeError(o)};var De=(o,e,t)=>e in o?Ue(o,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):o[e]=t;var A=(o,e,t)=>De(o,typeof e!="symbol"?e+"":e,t),he=(o,e,t)=>e.has(o)||ce("Cannot "+t);var z=(o,e,t)=>(he(o,e,"read from private field"),t?t.call(o):e.get(o)),de=(o,e,t)=>e.has(o)?ce("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(o):e.set(o,t),pe=(o,e,t,s)=>(he(o,e,"write to private field"),s?s.call(o,t):e.set(o,t),t);var qe=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),je=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var Ie='span[is="inline-price"][data-wcs-osi]',B='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var ke='a[is="upt-link"]',We=`${Ie},${B},${ke}`,x="merch-offer:ready",ue="merch-offer-select:ready";var _e="merch-offer:selected";var K="merch-quantity-selector:change";var Ze=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Qe=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var T,$=class extends E{constructor(){super();de(this,T);this.defaults={},this.variant="plans"}saveContainerDefaultValues(){let t=this.closest(this.getAttribute("container")),s=t?.querySelector('[slot="description"]:not(merch-offer > *)')?.cloneNode(!0),i=t?.badgeText;return{description:s,badgeText:i}}getSlottedElement(t,s){return(s||this.closest(this.getAttribute("container"))).querySelector(`[slot="${t}"]:not(merch-offer > *)`)}updateSlot(t,s){let i=this.getSlottedElement(t,s);if(!i)return;let n=this.selectedOffer.getOptionValue(t)?this.selectedOffer.getOptionValue(t):this.defaults[t];n&&i.replaceWith(n.cloneNode(!0))}handleOfferSelection(t){let s=t.detail;this.selectOffer(s)}handleOfferSelectionByQuantity(t){let s=t.detail.option,i=Number.parseInt(s),n=this.findAppropriateOffer(i);this.selectOffer(n),this.getSlottedElement("cta").setAttribute("data-quantity",i)}selectOffer(t){if(!t)return;let s=this.selectedOffer;s&&(s.selected=!1),t.selected=!0,this.selectedOffer=t,this.planType=t.planType,this.updateContainer(),this.updateComplete.then(()=>{this.dispatchEvent(new CustomEvent(_e,{detail:this,bubbles:!0}))})}findAppropriateOffer(t){let s=null;return this.offers.find(n=>{let r=Number.parseInt(n.getAttribute("value"));if(r===t)return!0;if(r>t)return!1;s=n})||s}updateBadgeText(t){this.selectedOffer.badgeText===""?t.badgeText=null:this.selectedOffer.badgeText?t.badgeText=this.selectedOffer.badgeText:t.badgeText=this.defaults.badgeText}updateContainer(){let t=this.closest(this.getAttribute("container"));!t||!this.selectedOffer||(this.updateSlot("cta",t),this.updateSlot("secondary-cta",t),this.updateSlot("price",t),!this.manageableMode&&(this.updateSlot("description",t),this.updateBadgeText(t)))}render(){return N`<fieldset><slot class="${this.variant}"></slot></fieldset>`}connectedCallback(){super.connectedCallback(),this.addEventListener("focusin",this.handleFocusin),this.addEventListener("click",this.handleFocusin),this.addEventListener(x,this.handleOfferSelectReady);let t=this.closest("merch-quantity-select");this.manageableMode=t,this.offers=[...this.querySelectorAll("merch-offer")],pe(this,T,this.handleOfferSelectionByQuantity.bind(this)),this.manageableMode?t.addEventListener(K,z(this,T)):this.defaults=this.saveContainerDefaultValues(),this.selectedOffer=this.offers[0],this.planType&&this.updateContainer()}get miniCompareMobileCard(){return this.merchCard?.variant==="mini-compare-chart"&&this.isMobile}get merchCard(){return this.closest("merch-card")}get isMobile(){return window.matchMedia("(max-width: 767px)").matches}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(K,z(this,T)),this.removeEventListener(x,this.handleOfferSelectReady),this.removeEventListener("focusin",this.handleFocusin),this.removeEventListener("click",this.handleFocusin)}get price(){return this.querySelector('merch-offer[aria-selected] [is="inline-price"]')}get customerSegment(){return this.selectedOffer?.customerSegment}get marketSegment(){return this.selectedOffer?.marketSegment}handleFocusin(t){t.target?.nodeName==="MERCH-OFFER"&&(t.preventDefault(),t.stopImmediatePropagation(),this.selectOffer(t.target))}async handleOfferSelectReady(){this.planType||this.querySelector("merch-offer:not([plan-type])")||(this.planType=this.selectedOffer.planType,await this.updateComplete,this.selectOffer(this.selectedOffer??this.querySelector("merch-offer[aria-selected]")??this.querySelector("merch-offer")),this.dispatchEvent(new CustomEvent(ue,{bubbles:!0})))}};T=new WeakMap,A($,"styles",O`
        :host {
            display: inline-block;
        }

        :host .horizontal {
            display: flex;
            flex-direction: row;
        }

        fieldset {
            display: contents;
        }

        :host([variant='subscription-options']) {
            display: flex;
            flex-direction: column;
            gap: var(--consonant-merch-spacing-xs);
        }
    `),A($,"properties",{offers:{type:Array},selectedOffer:{type:Object},defaults:{type:Object},variant:{type:String,attribute:"variant",reflect:!0},planType:{type:String,attribute:"plan-type",reflect:!0},stock:{type:Boolean,reflect:!0}});customElements.define("merch-offer-select",$);var k=window,V=k.ShadowRoot&&(k.ShadyCSS===void 0||k.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,q=Symbol(),Ee=new WeakMap,L=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==q)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(V&&e===void 0){let s=t!==void 0&&t.length===1;s&&(e=Ee.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&Ee.set(t,e))}return e}toString(){return this.cssText}},fe=o=>new L(typeof o=="string"?o:o+"",void 0,q),O=(o,...e)=>{let t=o.length===1?o[0]:e.reduce((s,i,n)=>s+(r=>{if(r._$cssResult$===!0)return r.cssText;if(typeof r=="number")return r;throw Error("Value passed to 'css' function must be a 'css' function result: "+r+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+o[n+1],o[0]);return new L(t,o,q)},j=(o,e)=>{V?o.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet):e.forEach(t=>{let s=document.createElement("style"),i=k.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=t.cssText,o.appendChild(s)})},Y=V?o=>o:o=>o instanceof CSSStyleSheet?(e=>{let t="";for(let s of e.cssRules)t+=s.cssText;return fe(t)})(o):o;var W,G=window,me=G.trustedTypes,Ve=me?me.emptyScript:"",Ae=G.reactiveElementPolyfillSupport,Q={toAttribute(o,e){switch(e){case Boolean:o=o?Ve:null;break;case Object:case Array:o=o==null?o:JSON.stringify(o)}return o},fromAttribute(o,e){let t=o;switch(e){case Boolean:t=o!==null;break;case Number:t=o===null?null:Number(o);break;case Object:case Array:try{t=JSON.parse(o)}catch{t=null}}return t}},ve=(o,e)=>e!==o&&(e==e||o==o),Z={attribute:!0,type:String,converter:Q,reflect:!1,hasChanged:ve},X="finalized",f=class extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this._$Eu()}static addInitializer(e){var t;this.finalize(),((t=this.h)!==null&&t!==void 0?t:this.h=[]).push(e)}static get observedAttributes(){this.finalize();let e=[];return this.elementProperties.forEach((t,s)=>{let i=this._$Ep(s,t);i!==void 0&&(this._$Ev.set(i,s),e.push(i))}),e}static createProperty(e,t=Z){if(t.state&&(t.attribute=!1),this.finalize(),this.elementProperties.set(e,t),!t.noAccessor&&!this.prototype.hasOwnProperty(e)){let s=typeof e=="symbol"?Symbol():"__"+e,i=this.getPropertyDescriptor(e,s,t);i!==void 0&&Object.defineProperty(this.prototype,e,i)}}static getPropertyDescriptor(e,t,s){return{get(){return this[t]},set(i){let n=this[e];this[t]=i,this.requestUpdate(e,n,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)||Z}static finalize(){if(this.hasOwnProperty(X))return!1;this[X]=!0;let e=Object.getPrototypeOf(this);if(e.finalize(),e.h!==void 0&&(this.h=[...e.h]),this.elementProperties=new Map(e.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){let t=this.properties,s=[...Object.getOwnPropertyNames(t),...Object.getOwnPropertySymbols(t)];for(let i of s)this.createProperty(i,t[i])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let s=new Set(e.flat(1/0).reverse());for(let i of s)t.unshift(Y(i))}else e!==void 0&&t.push(Y(e));return t}static _$Ep(e,t){let s=t.attribute;return s===!1?void 0:typeof s=="string"?s:typeof e=="string"?e.toLowerCase():void 0}_$Eu(){var e;this._$E_=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$Eg(),this.requestUpdate(),(e=this.constructor.h)===null||e===void 0||e.forEach(t=>t(this))}addController(e){var t,s;((t=this._$ES)!==null&&t!==void 0?t:this._$ES=[]).push(e),this.renderRoot!==void 0&&this.isConnected&&((s=e.hostConnected)===null||s===void 0||s.call(e))}removeController(e){var t;(t=this._$ES)===null||t===void 0||t.splice(this._$ES.indexOf(e)>>>0,1)}_$Eg(){this.constructor.elementProperties.forEach((e,t)=>{this.hasOwnProperty(t)&&(this._$Ei.set(t,this[t]),delete this[t])})}createRenderRoot(){var e;let t=(e=this.shadowRoot)!==null&&e!==void 0?e:this.attachShadow(this.constructor.shadowRootOptions);return j(t,this.constructor.elementStyles),t}connectedCallback(){var e;this.renderRoot===void 0&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(e=this._$ES)===null||e===void 0||e.forEach(t=>{var s;return(s=t.hostConnected)===null||s===void 0?void 0:s.call(t)})}enableUpdating(e){}disconnectedCallback(){var e;(e=this._$ES)===null||e===void 0||e.forEach(t=>{var s;return(s=t.hostDisconnected)===null||s===void 0?void 0:s.call(t)})}attributeChangedCallback(e,t,s){this._$AK(e,s)}_$EO(e,t,s=Z){var i;let n=this.constructor._$Ep(e,s);if(n!==void 0&&s.reflect===!0){let r=(((i=s.converter)===null||i===void 0?void 0:i.toAttribute)!==void 0?s.converter:Q).toAttribute(t,s.type);this._$El=e,r==null?this.removeAttribute(n):this.setAttribute(n,r),this._$El=null}}_$AK(e,t){var s;let i=this.constructor,n=i._$Ev.get(e);if(n!==void 0&&this._$El!==n){let r=i.getPropertyOptions(n),c=typeof r.converter=="function"?{fromAttribute:r.converter}:((s=r.converter)===null||s===void 0?void 0:s.fromAttribute)!==void 0?r.converter:Q;this._$El=n,this[n]=c.fromAttribute(t,r.type),this._$El=null}}requestUpdate(e,t,s){let i=!0;e!==void 0&&(((s=s||this.constructor.getPropertyOptions(e)).hasChanged||ve)(this[e],t)?(this._$AL.has(e)||this._$AL.set(e,t),s.reflect===!0&&this._$El!==e&&(this._$EC===void 0&&(this._$EC=new Map),this._$EC.set(e,s))):i=!1),!this.isUpdatePending&&i&&(this._$E_=this._$Ej())}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var e;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach((i,n)=>this[n]=i),this._$Ei=void 0);let t=!1,s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),(e=this._$ES)===null||e===void 0||e.forEach(i=>{var n;return(n=i.hostUpdate)===null||n===void 0?void 0:n.call(i)}),this.update(s)):this._$Ek()}catch(i){throw t=!1,this._$Ek(),i}t&&this._$AE(s)}willUpdate(e){}_$AE(e){var t;(t=this._$ES)===null||t===void 0||t.forEach(s=>{var i;return(i=s.hostUpdated)===null||i===void 0?void 0:i.call(s)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(e){return!0}update(e){this._$EC!==void 0&&(this._$EC.forEach((t,s)=>this._$EO(s,this[s],t)),this._$EC=void 0),this._$Ek()}updated(e){}firstUpdated(e){}};f[X]=!0,f.elementProperties=new Map,f.elementStyles=[],f.shadowRootOptions={mode:"open"},Ae?.({ReactiveElement:f}),((W=G.reactiveElementVersions)!==null&&W!==void 0?W:G.reactiveElementVersions=[]).push("1.6.3");var J,F=window,y=F.trustedTypes,Se=y?y.createPolicy("lit-html",{createHTML:o=>o}):void 0,te="$lit$",m=`lit$${(Math.random()+"").slice(9)}$`,xe="?"+m,Ye=`<${xe}>`,g=document,M=()=>g.createComment(""),w=o=>o===null||typeof o!="object"&&typeof o!="function",$e=Array.isArray,Ge=o=>$e(o)||typeof o?.[Symbol.iterator]=="function",ee=`[ 	
\f\r]`,P=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ge=/-->/g,be=/>/g,v=RegExp(`>|${ee}(?:([^\\s"'>=/]+)(${ee}*=${ee}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Te=/'/g,ye=/"/g,Oe=/^(?:script|style|textarea|title)$/i,Ne=o=>(e,...t)=>({_$litType$:o,strings:e,values:t}),N=Ne(1),pt=Ne(2),b=Symbol.for("lit-noChange"),p=Symbol.for("lit-nothing"),Ce=new WeakMap,S=g.createTreeWalker(g,129,null,!1);function Le(o,e){if(!Array.isArray(o)||!o.hasOwnProperty("raw"))throw Error("invalid template strings array");return Se!==void 0?Se.createHTML(e):e}var Fe=(o,e)=>{let t=o.length-1,s=[],i,n=e===2?"<svg>":"",r=P;for(let c=0;c<t;c++){let a=o[c],l,h,d=-1,u=0;for(;u<a.length&&(r.lastIndex=u,h=r.exec(a),h!==null);)u=r.lastIndex,r===P?h[1]==="!--"?r=ge:h[1]!==void 0?r=be:h[2]!==void 0?(Oe.test(h[2])&&(i=RegExp("</"+h[2],"g")),r=v):h[3]!==void 0&&(r=v):r===v?h[0]===">"?(r=i??P,d=-1):h[1]===void 0?d=-2:(d=r.lastIndex-h[2].length,l=h[1],r=h[3]===void 0?v:h[3]==='"'?ye:Te):r===ye||r===Te?r=v:r===ge||r===be?r=P:(r=v,i=void 0);let _=r===v&&o[c+1].startsWith("/>")?" ":"";n+=r===P?a+Ye:d>=0?(s.push(l),a.slice(0,d)+te+a.slice(d)+m+_):a+m+(d===-2?(s.push(void 0),c):_)}return[Le(o,n+(o[t]||"<?>")+(e===2?"</svg>":"")),s]},H=class o{constructor({strings:e,_$litType$:t},s){let i;this.parts=[];let n=0,r=0,c=e.length-1,a=this.parts,[l,h]=Fe(e,t);if(this.el=o.createElement(l,s),S.currentNode=this.el.content,t===2){let d=this.el.content,u=d.firstChild;u.remove(),d.append(...u.childNodes)}for(;(i=S.nextNode())!==null&&a.length<c;){if(i.nodeType===1){if(i.hasAttributes()){let d=[];for(let u of i.getAttributeNames())if(u.endsWith(te)||u.startsWith(m)){let _=h[r++];if(d.push(u),_!==void 0){let He=i.getAttribute(_.toLowerCase()+te).split(m),I=/([.?@])?(.*)/.exec(_);a.push({type:1,index:n,name:I[2],strings:He,ctor:I[1]==="."?ie:I[1]==="?"?oe:I[1]==="@"?re:R})}else a.push({type:6,index:n})}for(let u of d)i.removeAttribute(u)}if(Oe.test(i.tagName)){let d=i.textContent.split(m),u=d.length-1;if(u>0){i.textContent=y?y.emptyScript:"";for(let _=0;_<u;_++)i.append(d[_],M()),S.nextNode(),a.push({type:2,index:++n});i.append(d[u],M())}}}else if(i.nodeType===8)if(i.data===xe)a.push({type:2,index:n});else{let d=-1;for(;(d=i.data.indexOf(m,d+1))!==-1;)a.push({type:7,index:n}),d+=m.length-1}n++}}static createElement(e,t){let s=g.createElement("template");return s.innerHTML=e,s}};function C(o,e,t=o,s){var i,n,r,c;if(e===b)return e;let a=s!==void 0?(i=t._$Co)===null||i===void 0?void 0:i[s]:t._$Cl,l=w(e)?void 0:e._$litDirective$;return a?.constructor!==l&&((n=a?._$AO)===null||n===void 0||n.call(a,!1),l===void 0?a=void 0:(a=new l(o),a._$AT(o,t,s)),s!==void 0?((r=(c=t)._$Co)!==null&&r!==void 0?r:c._$Co=[])[s]=a:t._$Cl=a),a!==void 0&&(e=C(o,a._$AS(o,e.values),a,s)),e}var se=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){var t;let{el:{content:s},parts:i}=this._$AD,n=((t=e?.creationScope)!==null&&t!==void 0?t:g).importNode(s,!0);S.currentNode=n;let r=S.nextNode(),c=0,a=0,l=i[0];for(;l!==void 0;){if(c===l.index){let h;l.type===2?h=new U(r,r.nextSibling,this,e):l.type===1?h=new l.ctor(r,l.name,l.strings,this,e):l.type===6&&(h=new ne(r,this,e)),this._$AV.push(h),l=i[++a]}c!==l?.index&&(r=S.nextNode(),c++)}return S.currentNode=g,n}v(e){let t=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(e,s,t),t+=s.strings.length-2):s._$AI(e[t])),t++}},U=class o{constructor(e,t,s,i){var n;this.type=2,this._$AH=p,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=s,this.options=i,this._$Cp=(n=i?.isConnected)===null||n===void 0||n}get _$AU(){var e,t;return(t=(e=this._$AM)===null||e===void 0?void 0:e._$AU)!==null&&t!==void 0?t:this._$Cp}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=C(this,e,t),w(e)?e===p||e==null||e===""?(this._$AH!==p&&this._$AR(),this._$AH=p):e!==this._$AH&&e!==b&&this._(e):e._$litType$!==void 0?this.g(e):e.nodeType!==void 0?this.$(e):Ge(e)?this.T(e):this._(e)}k(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}$(e){this._$AH!==e&&(this._$AR(),this._$AH=this.k(e))}_(e){this._$AH!==p&&w(this._$AH)?this._$AA.nextSibling.data=e:this.$(g.createTextNode(e)),this._$AH=e}g(e){var t;let{values:s,_$litType$:i}=e,n=typeof i=="number"?this._$AC(e):(i.el===void 0&&(i.el=H.createElement(Le(i.h,i.h[0]),this.options)),i);if(((t=this._$AH)===null||t===void 0?void 0:t._$AD)===n)this._$AH.v(s);else{let r=new se(n,this),c=r.u(this.options);r.v(s),this.$(c),this._$AH=r}}_$AC(e){let t=Ce.get(e.strings);return t===void 0&&Ce.set(e.strings,t=new H(e)),t}T(e){$e(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,s,i=0;for(let n of e)i===t.length?t.push(s=new o(this.k(M()),this.k(M()),this,this.options)):s=t[i],s._$AI(n),i++;i<t.length&&(this._$AR(s&&s._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){var s;for((s=this._$AP)===null||s===void 0||s.call(this,!1,!0,t);e&&e!==this._$AB;){let i=e.nextSibling;e.remove(),e=i}}setConnected(e){var t;this._$AM===void 0&&(this._$Cp=e,(t=this._$AP)===null||t===void 0||t.call(this,e))}},R=class{constructor(e,t,s,i,n){this.type=1,this._$AH=p,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=n,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=p}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(e,t=this,s,i){let n=this.strings,r=!1;if(n===void 0)e=C(this,e,t,0),r=!w(e)||e!==this._$AH&&e!==b,r&&(this._$AH=e);else{let c=e,a,l;for(e=n[0],a=0;a<n.length-1;a++)l=C(this,c[s+a],t,a),l===b&&(l=this._$AH[a]),r||(r=!w(l)||l!==this._$AH[a]),l===p?e=p:e!==p&&(e+=(l??"")+n[a+1]),this._$AH[a]=l}r&&!i&&this.j(e)}j(e){e===p?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},ie=class extends R{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===p?void 0:e}},ze=y?y.emptyScript:"",oe=class extends R{constructor(){super(...arguments),this.type=4}j(e){e&&e!==p?this.element.setAttribute(this.name,ze):this.element.removeAttribute(this.name)}},re=class extends R{constructor(e,t,s,i,n){super(e,t,s,i,n),this.type=5}_$AI(e,t=this){var s;if((e=(s=C(this,e,t,0))!==null&&s!==void 0?s:p)===b)return;let i=this._$AH,n=e===p&&i!==p||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,r=e!==p&&(i===p||n);n&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){var t,s;typeof this._$AH=="function"?this._$AH.call((s=(t=this.options)===null||t===void 0?void 0:t.host)!==null&&s!==void 0?s:this.element,e):this._$AH.handleEvent(e)}},ne=class{constructor(e,t,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){C(this,e)}};var Re=F.litHtmlPolyfillSupport;Re?.(H,U),((J=F.litHtmlVersions)!==null&&J!==void 0?J:F.litHtmlVersions=[]).push("2.8.0");var Pe=(o,e,t)=>{var s,i;let n=(s=t?.renderBefore)!==null&&s!==void 0?s:e,r=n._$litPart$;if(r===void 0){let c=(i=t?.renderBefore)!==null&&i!==void 0?i:null;n._$litPart$=r=new U(e.insertBefore(M(),c),c,void 0,t??{})}return r._$AI(o),r};var ae,le;var E=class extends f{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var e,t;let s=super.createRenderRoot();return(e=(t=this.renderOptions).renderBefore)!==null&&e!==void 0||(t.renderBefore=s.firstChild),s}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Pe(t,this.renderRoot,this.renderOptions)}connectedCallback(){var e;super.connectedCallback(),(e=this._$Do)===null||e===void 0||e.setConnected(!0)}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._$Do)===null||e===void 0||e.setConnected(!1)}render(){return b}};E.finalized=!0,E._$litElement$=!0,(ae=globalThis.litElementHydrateSupport)===null||ae===void 0||ae.call(globalThis,{LitElement:E});var Me=globalThis.litElementPolyfillSupport;Me?.({LitElement:E});((le=globalThis.litElementVersions)!==null&&le!==void 0?le:globalThis.litElementVersions=[]).push("3.3.3");var we=O`
    :host {
        --merch-radio: rgba(82, 88, 228);
        --merch-radio-hover: rgba(64, 70, 202);
        --merch-radio-down: rgba(50, 54, 168);
        --merch-radio-selected: rgb(2, 101, 220);
        --merch-hovered-shadow: 0 0 0 1px #aaa;
        --merch-selected-shadow: 0 0 0 2px var(--merch-radio-selected);
        box-sizing: border-box;
    }
    .merch-Radio {
        align-items: flex-start;
        display: flex;
        max-inline-size: 100%;
        margin-inline-end: 19px;
        min-block-size: 32px;
        position: relative;
        vertical-align: top;
    }

    .merch-Radio-input {
        block-size: 100%;
        box-sizing: border-box;
        cursor: pointer;
        font-family: inherit;
        font-size: 100%;
        inline-size: 100%;
        line-height: 1.3;
        margin: 0;
        opacity: 0;
        overflow: visible;
        padding: 0;
        position: absolute;
        z-index: 1;
    }

    .merch-Radio-button {
        block-size: 14px;
        box-sizing: border-box;
        flex-grow: 0;
        flex-shrink: 0;
        inline-size: 14px;
        margin-block-start: 9px;
        position: relative;
    }

    .merch-Radio-button:before {
        border-color: rgb(109, 109, 109);
        border-radius: 50%;
        border-style: solid;
        border-width: 2px;
        box-sizing: border-box;
        content: '';
        display: block;
        height: 14px;
        position: absolute;
        transition:
            border 0.13s ease-in-out,
            box-shadow 0.13s ease-in-out;
        width: 14px;
        z-index: 0;
    }

    .merch-Radio-button:after {
        border-radius: 50%;
        content: '';
        display: block;
        left: 50%;
        position: absolute;
        top: 50%;
        transform: translateX(-50%) translateY(-50%);
        transition:
            opacity 0.13s ease-out,
            margin 0.13s ease-out;
    }

    :host(:active) .merch-Radio-button:before {
        border-color: var(--merch-radio-down);
    }

    :host(:hover) .merch-Radio-button:before {
        border-color: var(--merch-radio-hover);
    }

    :host([aria-selected]) .merch-Radio-button::before {
        border-color: var(--merch-radio-selected);
        border-width: 5px;
    }

    .merch-Radio-label {
        color: rgb(34, 34, 34);
        font-size: 14px;
        line-height: 18.2px;
        margin-block-end: 9px;
        margin-block-start: 6px;
        margin-inline-start: 10px;
        text-align: start;
        transition: color 0.13s ease-in-out;
    }

    input {
        height: 0;
        outline: none;
        position: absolute;
        width: 0;
        z-index: -1;
    }

    .label {
        background-color: white;
        border: 1px solid transparent;
        border-radius: var(--consonant-merch-spacing-xxxs);
        cursor: pointer;
        display: block;
        margin: var(--consonant-merch-spacing-xs) 0;
        padding: var(--consonant-merch-spacing-xs);
        position: relative;
    }

    label:hover {
        box-shadow: var(--merch-hovered-shadow);
    }

    :host([aria-selected]) label {
        box-shadow: var(--merch-selected-shadow);
    }

    sp-icon-info-outline {
        color: #6e6e6e;
        content: '';
    }

    ::slotted(p),
    ::slotted(h5) {
        margin: 0;
    }

    ::slotted([slot='commitment']) {
        font-size: 14px !important;
        font-weight: normal !important;
        line-height: 17px !important;
    }

    #condition {
        line-height: 15px;
    }

    ::slotted([slot='condition']) {
        display: inline-block;
        font-style: italic;
        font-size: 12px;
    }

    ::slotted([slot='teaser']) {
        color: #2d9d78;
        font-size: 14px;
        font-weight: bold;
        line-height: 17px;
    }

    :host([type='subscription-option']) slot[name='price'] {
        display: flex;
        flex-direction: row-reverse;
        align-self: baseline;
        gap: 6px;
    }

    ::slotted(span[is='inline-price']) {
        font-size: 16px;
        font-weight: bold;
        line-height: 20px;
    }

    ::slotted(span[data-template='strikethrough']) {
        font-weight: normal;
    }

    :host([type='subscription-option']) {
        background-color: #fff;
        box-sizing: border-box;
        border-width: 2px;
        border-radius: 5px;
        border-style: solid;
        border-color: #eaeaea;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px;
        min-height: 102px;
    }

    :host([type='subscription-option']:hover) {
        border-color: #cacaca;
    }

    :host([type='subscription-option'][aria-selected]) {
        border-color: #1473e6;
    }

    :host([type='subscription-option']) #condition {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    :host([type='subscription-option'])
        ::slotted([is='inline-price'][data-display-tax='true']) {
        position: relative;
        height: 40px;
    }
`;var Be="merch-offer",D=class extends E{constructor(){super();A(this,"tr");this.type="radio",this.selected=!1}getOptionValue(t){return this.querySelector(`[slot="${t}"]`)}connectedCallback(){super.connectedCallback(),this.initOffer(),this.configuration=this.closest("quantity-selector"),!this.hasAttribute("tabindex")&&!this.configuration&&(this.tabIndex=0),!this.hasAttribute("role")&&!this.configuration&&(this.role="radio")}get asRadioOption(){return N` <div class="merch-Radio">
            <input tabindex="-1" type="radio" class="merch-Radio-input" />
            <span class="merch-Radio-button"></span>
            <span class="merch-Radio-label">${this.text}</span>
        </div>`}get asSubscriptionOption(){return N`<slot name="commitment"></slot>
            <slot name="price"></slot>
            <slot name="teaser"></slot>
            <div id="condition">
                <slot name="condition"></slot>
                <span id="info">
                    <sp-icon-info-outline size="s"></sp-icon-info-outline
                ></span>
                <sp-overlay placement="top" trigger="info@hover" type="hint">
                    <sp-tooltip
                        ><slot name="condition-tooltip"></slot
                    ></sp-tooltip>
                </sp-overlay>
            </div>`}render(){return this.configuration||!this.price?"":this.type==="subscription-option"?this.asSubscriptionOption:this.asRadioOption}get price(){return this.querySelector('span[is="inline-price"]:not([data-template="strikethrough"])')}get cta(){return this.querySelector(B)}get prices(){return this.querySelectorAll('span[is="inline-price"]')}get customerSegment(){return this.price?.value?.[0].customerSegment}get marketSegment(){return this.price?.value?.[0].marketSegments[0]}async initOffer(){if(!this.price)return;this.prices.forEach(s=>s.setAttribute("slot","price")),await this.updateComplete,await Promise.all([...this.prices].map(s=>s.onceSettled()));let{value:[t]}=this.price;this.planType=t.planType,await this.updateComplete,this.dispatchEvent(new CustomEvent(x,{bubbles:!0}))}};A(D,"properties",{text:{type:String},selected:{type:Boolean,attribute:"aria-selected",reflect:!0},badgeText:{type:String,attribute:"badge-text"},type:{type:String,attribute:"type",reflect:!0},planType:{type:String,attribute:"plan-type",reflect:!0}}),A(D,"styles",[we]);customElements.define(Be,D);
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
lit-html/lit-html.js:
lit-element/lit-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
