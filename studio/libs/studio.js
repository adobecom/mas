var Qe=Object.defineProperty;var we=n=>{throw TypeError(n)};var Xe=(n,e,t)=>e in n?Qe(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var m=(n,e,t)=>Xe(n,typeof e!="symbol"?e+"":e,t),re=(n,e,t)=>e.has(n)||we("Cannot "+t);var ae=(n,e,t)=>(re(n,e,"read from private field"),t?t.call(n):e.get(n)),oe=(n,e,t)=>e.has(n)?we("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(n):e.set(n,t),Ae=(n,e,t,s)=>(re(n,e,"write to private field"),s?s.call(n,t):e.set(n,t),t),L=(n,e,t)=>(re(n,e,"access private method"),t);var j=globalThis,W=j.ShadowRoot&&(j.ShadyCSS===void 0||j.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,le=Symbol(),_e=new WeakMap,O=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==le)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(W&&e===void 0){let s=t!==void 0&&t.length===1;s&&(e=_e.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&_e.set(t,e))}return e}toString(){return this.cssText}},Se=n=>new O(typeof n=="string"?n:n+"",void 0,le),f=(n,...e)=>{let t=n.length===1?n[0]:e.reduce((s,i,r)=>s+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+n[r+1],n[0]);return new O(t,n,le)},ce=(n,e)=>{if(W)n.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let s=document.createElement("style"),i=j.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=t.cssText,n.appendChild(s)}},K=W?n=>n:n=>n instanceof CSSStyleSheet?(e=>{let t="";for(let s of e.cssRules)t+=s.cssText;return Se(t)})(n):n;var{is:et,defineProperty:tt,getOwnPropertyDescriptor:st,getOwnPropertyNames:it,getOwnPropertySymbols:nt,getPrototypeOf:rt}=Object,E=globalThis,xe=E.trustedTypes,at=xe?xe.emptyScript:"",ot=E.reactiveElementPolyfillSupport,U=(n,e)=>n,he={toAttribute(n,e){switch(e){case Boolean:n=n?at:null;break;case Object:case Array:n=n==null?n:JSON.stringify(n)}return n},fromAttribute(n,e){let t=n;switch(e){case Boolean:t=n!==null;break;case Number:t=n===null?null:Number(n);break;case Object:case Array:try{t=JSON.parse(n)}catch{t=null}}return t}},ke=(n,e)=>!et(n,e),Te={attribute:!0,type:String,converter:he,reflect:!1,hasChanged:ke};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),E.litPropertyMetadata??(E.litPropertyMetadata=new WeakMap);var b=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Te){if(t.state&&(t.attribute=!1),this._$Ei(),this.elementProperties.set(e,t),!t.noAccessor){let s=Symbol(),i=this.getPropertyDescriptor(e,s,t);i!==void 0&&tt(this.prototype,e,i)}}static getPropertyDescriptor(e,t,s){let{get:i,set:r}=st(this.prototype,e)??{get(){return this[t]},set(a){this[t]=a}};return{get(){return i?.call(this)},set(a){let o=i?.call(this);r.call(this,a),this.requestUpdate(e,o,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Te}static _$Ei(){if(this.hasOwnProperty(U("elementProperties")))return;let e=rt(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(U("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(U("properties"))){let t=this.properties,s=[...it(t),...nt(t)];for(let i of s)this.createProperty(i,t[i])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[s,i]of t)this.elementProperties.set(s,i)}this._$Eh=new Map;for(let[t,s]of this.elementProperties){let i=this._$Eu(t,s);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let s=new Set(e.flat(1/0).reverse());for(let i of s)t.unshift(K(i))}else e!==void 0&&t.push(K(e));return t}static _$Eu(e,t){let s=t.attribute;return s===!1?void 0:typeof s=="string"?s:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let s of t.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ce(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,s){this._$AK(e,s)}_$EC(e,t){let s=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,s);if(i!==void 0&&s.reflect===!0){let r=(s.converter?.toAttribute!==void 0?s.converter:he).toAttribute(t,s.type);this._$Em=e,r==null?this.removeAttribute(i):this.setAttribute(i,r),this._$Em=null}}_$AK(e,t){let s=this.constructor,i=s._$Eh.get(e);if(i!==void 0&&this._$Em!==i){let r=s.getPropertyOptions(i),a=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:he;this._$Em=i,this[i]=a.fromAttribute(t,r.type),this._$Em=null}}requestUpdate(e,t,s){if(e!==void 0){if(s??(s=this.constructor.getPropertyOptions(e)),!(s.hasChanged??ke)(this[e],t))return;this.P(e,t,s)}this.isUpdatePending===!1&&(this._$ES=this._$ET())}P(e,t,s){this._$AL.has(e)||this._$AL.set(e,t),s.reflect===!0&&this._$Em!==e&&(this._$Ej??(this._$Ej=new Set)).add(e)}async _$ET(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(let[i,r]of this._$Ep)this[i]=r;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[i,r]of s)r.wrapped!==!0||this._$AL.has(i)||this[i]===void 0||this.P(i,this[i],r)}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(t)):this._$EU()}catch(s){throw e=!1,this._$EU(),s}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EU(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Ej&&(this._$Ej=this._$Ej.forEach(t=>this._$EC(t,this[t]))),this._$EU()}updated(e){}firstUpdated(e){}};b.elementStyles=[],b.shadowRootOptions={mode:"open"},b[U("elementProperties")]=new Map,b[U("finalized")]=new Map,ot?.({ReactiveElement:b}),(E.reactiveElementVersions??(E.reactiveElementVersions=[])).push("2.0.4");var N=globalThis,Y=N.trustedTypes,Ce=Y?Y.createPolicy("lit-html",{createHTML:n=>n}):void 0,De="$lit$",w=`lit$${Math.random().toFixed(9).slice(2)}$`,Ne="?"+w,lt=`<${Ne}>`,S=document,R=()=>S.createComment(""),H=n=>n===null||typeof n!="object"&&typeof n!="function",ve=Array.isArray,ct=n=>ve(n)||typeof n?.[Symbol.iterator]=="function",de=`[ 	
\f\r]`,D=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Fe=/-->/g,Pe=/>/g,A=RegExp(`>|${de}(?:([^\\s"'>=/]+)(${de}*=${de}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Le=/'/g,Oe=/"/g,Re=/^(?:script|style|textarea|title)$/i,be=n=>(e,...t)=>({_$litType$:n,strings:e,values:t}),c=be(1),Ct=be(2),Ft=be(3),$=Symbol.for("lit-noChange"),h=Symbol.for("lit-nothing"),Ue=new WeakMap,_=S.createTreeWalker(S,129);function He(n,e){if(!ve(n)||!n.hasOwnProperty("raw"))throw Error("invalid template strings array");return Ce!==void 0?Ce.createHTML(e):e}var ht=(n,e)=>{let t=n.length-1,s=[],i,r=e===2?"<svg>":e===3?"<math>":"",a=D;for(let o=0;o<t;o++){let l=n[o],u,g,d=-1,v=0;for(;v<l.length&&(a.lastIndex=v,g=a.exec(l),g!==null);)v=a.lastIndex,a===D?g[1]==="!--"?a=Fe:g[1]!==void 0?a=Pe:g[2]!==void 0?(Re.test(g[2])&&(i=RegExp("</"+g[2],"g")),a=A):g[3]!==void 0&&(a=A):a===A?g[0]===">"?(a=i??D,d=-1):g[1]===void 0?d=-2:(d=a.lastIndex-g[2].length,u=g[1],a=g[3]===void 0?A:g[3]==='"'?Oe:Le):a===Oe||a===Le?a=A:a===Fe||a===Pe?a=D:(a=A,i=void 0);let y=a===A&&n[o+1].startsWith("/>")?" ":"";r+=a===D?l+lt:d>=0?(s.push(u),l.slice(0,d)+De+l.slice(d)+w+y):l+w+(d===-2?o:y)}return[He(n,r+(n[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),s]},I=class n{constructor({strings:e,_$litType$:t},s){let i;this.parts=[];let r=0,a=0,o=e.length-1,l=this.parts,[u,g]=ht(e,t);if(this.el=n.createElement(u,s),_.currentNode=this.el.content,t===2||t===3){let d=this.el.content.firstChild;d.replaceWith(...d.childNodes)}for(;(i=_.nextNode())!==null&&l.length<o;){if(i.nodeType===1){if(i.hasAttributes())for(let d of i.getAttributeNames())if(d.endsWith(De)){let v=g[a++],y=i.getAttribute(d).split(w),q=/([.?@])?(.*)/.exec(v);l.push({type:1,index:r,name:q[2],strings:y,ctor:q[1]==="."?ue:q[1]==="?"?me:q[1]==="@"?ge:C}),i.removeAttribute(d)}else d.startsWith(w)&&(l.push({type:6,index:r}),i.removeAttribute(d));if(Re.test(i.tagName)){let d=i.textContent.split(w),v=d.length-1;if(v>0){i.textContent=Y?Y.emptyScript:"";for(let y=0;y<v;y++)i.append(d[y],R()),_.nextNode(),l.push({type:2,index:++r});i.append(d[v],R())}}}else if(i.nodeType===8)if(i.data===Ne)l.push({type:2,index:r});else{let d=-1;for(;(d=i.data.indexOf(w,d+1))!==-1;)l.push({type:7,index:r}),d+=w.length-1}r++}}static createElement(e,t){let s=S.createElement("template");return s.innerHTML=e,s}};function k(n,e,t=n,s){if(e===$)return e;let i=s!==void 0?t.o?.[s]:t.l,r=H(e)?void 0:e._$litDirective$;return i?.constructor!==r&&(i?._$AO?.(!1),r===void 0?i=void 0:(i=new r(n),i._$AT(n,t,s)),s!==void 0?(t.o??(t.o=[]))[s]=i:t.l=i),i!==void 0&&(e=k(n,i._$AS(n,e.values),i,s)),e}var pe=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:s}=this._$AD,i=(e?.creationScope??S).importNode(t,!0);_.currentNode=i;let r=_.nextNode(),a=0,o=0,l=s[0];for(;l!==void 0;){if(a===l.index){let u;l.type===2?u=new M(r,r.nextSibling,this,e):l.type===1?u=new l.ctor(r,l.name,l.strings,this,e):l.type===6&&(u=new fe(r,this,e)),this._$AV.push(u),l=s[++o]}a!==l?.index&&(r=_.nextNode(),a++)}return _.currentNode=S,i}p(e){let t=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(e,s,t),t+=s.strings.length-2):s._$AI(e[t])),t++}},M=class n{get _$AU(){return this._$AM?._$AU??this.v}constructor(e,t,s,i){this.type=2,this._$AH=h,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=s,this.options=i,this.v=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=k(this,e,t),H(e)?e===h||e==null||e===""?(this._$AH!==h&&this._$AR(),this._$AH=h):e!==this._$AH&&e!==$&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):ct(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==h&&H(this._$AH)?this._$AA.nextSibling.data=e:this.T(S.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:s}=e,i=typeof s=="number"?this._$AC(e):(s.el===void 0&&(s.el=I.createElement(He(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(t);else{let r=new pe(i,this),a=r.u(this.options);r.p(t),this.T(a),this._$AH=r}}_$AC(e){let t=Ue.get(e.strings);return t===void 0&&Ue.set(e.strings,t=new I(e)),t}k(e){ve(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,s,i=0;for(let r of e)i===t.length?t.push(s=new n(this.O(R()),this.O(R()),this,this.options)):s=t[i],s._$AI(r),i++;i<t.length&&(this._$AR(s&&s._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e&&e!==this._$AB;){let s=e.nextSibling;e.remove(),e=s}}setConnected(e){this._$AM===void 0&&(this.v=e,this._$AP?.(e))}},C=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,s,i,r){this.type=1,this._$AH=h,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=r,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=h}_$AI(e,t=this,s,i){let r=this.strings,a=!1;if(r===void 0)e=k(this,e,t,0),a=!H(e)||e!==this._$AH&&e!==$,a&&(this._$AH=e);else{let o=e,l,u;for(e=r[0],l=0;l<r.length-1;l++)u=k(this,o[s+l],t,l),u===$&&(u=this._$AH[l]),a||(a=!H(u)||u!==this._$AH[l]),u===h?e=h:e!==h&&(e+=(u??"")+r[l+1]),this._$AH[l]=u}a&&!i&&this.j(e)}j(e){e===h?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},ue=class extends C{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===h?void 0:e}},me=class extends C{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==h)}},ge=class extends C{constructor(e,t,s,i,r){super(e,t,s,i,r),this.type=5}_$AI(e,t=this){if((e=k(this,e,t,0)??h)===$)return;let s=this._$AH,i=e===h&&s!==h||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,r=e!==h&&(s===h||i);i&&this.element.removeEventListener(this.name,this,s),r&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},fe=class{constructor(e,t,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){k(this,e)}};var dt=N.litHtmlPolyfillSupport;dt?.(I,M),(N.litHtmlVersions??(N.litHtmlVersions=[])).push("3.2.0");var Ie=(n,e,t)=>{let s=t?.renderBefore??e,i=s._$litPart$;if(i===void 0){let r=t?.renderBefore??null;s._$litPart$=i=new M(e.insertBefore(R(),r),r,void 0,t??{})}return i._$AI(n),i};var p=class extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t;let e=super.createRenderRoot();return(t=this.renderOptions).renderBefore??(t.renderBefore=e.firstChild),e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Ie(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return $}};p._$litElement$=!0,p.finalized=!0,globalThis.litElementHydrateSupport?.({LitElement:p});var pt=globalThis.litElementPolyfillSupport;pt?.({LitElement:p});(globalThis.litElementVersions??(globalThis.litElementVersions=[])).push("4.1.1");var F="change",Me="submit";var ze="hashchange";function ut(n=window.location.hash){let e=[],t=n.replace(/^#/,"").split("&");for(let s of t){let[i,r=""]=s.split("=");i&&e.push([i,decodeURIComponent(r.replace(/\+/g," "))])}return Object.fromEntries(e)}function G(n){let e=new URLSearchParams(window.location.hash.slice(1));Object.entries(n).forEach(([i,r])=>{r?e.set(i,r):e.delete(i)}),e.sort();let t=e.toString();if(t===window.location.hash)return;let s=window.scrollY||document.documentElement.scrollTop;window.location.hash=t,window.scrollTo(0,s)}function Be(n){let e=()=>{if(window.location.hash&&!window.location.hash.includes("="))return;let t=ut(window.location.hash);n(t)};return e(),window.addEventListener(ze,e),()=>{window.removeEventListener(ze,e)}}var Ve={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},qe=n=>(...e)=>({_$litDirective$:n,values:e}),J=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,s){this.t=e,this._$AM=t,this.i=s}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var z=class extends J{constructor(e){if(super(e),this.it=h,e.type!==Ve.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===h||e==null)return this._t=void 0,this.it=e;if(e===$)return e;if(typeof e!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;let t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}};z.directiveName="unsafeHTML",z.resultType=1;var Z=qe(z);var P,x,B,Q=class extends p{constructor(){super();oe(this,x);oe(this,P);this.draggingIndex=-1,this.min=0,this.initValue()}static get properties(){return{min:{type:Number,attribute:!0},value:{type:Array,attribute:!1},draggingIndex:{type:Number,state:!0}}}initValue(){this.value=this.value?.map((t,s)=>({...t}))??[]}firstUpdated(){this.initValue()}connectedCallback(){super.connectedCallback(),this.initFieldTemplate()}initFieldTemplate(){let t=this.querySelector("template");if(!t){console.warn("Template field not found",this);return}if(Ae(this,P,t.content),t.remove(),this.value.length===0)for(let s=0;s<this.min;s++)this.addField()}addField(){this.value=[...this.value,{}],L(this,x,B).call(this)}getFieldIndex(t){return Array.from(this.shadowRoot.querySelectorAll(".field-wrapper")).indexOf(t.closest(".field-wrapper"))}removeField(t){this.value.splice(t,1),this.value=[...this.value],L(this,x,B).call(this)}handleChange(t){t.stopPropagation();let s=t.target.value;typeof s=="string"&&(s={value:s});let i=this.getFieldIndex(t.target),r=this.value[i];r&&(Object.assign(r,s),L(this,x,B).call(this))}dragStart(t,s){this.draggingIndex=s,t.dataTransfer.effectAllowed="move",t.target.classList.add("dragging")}dragOver(t,s){t.preventDefault(),this.draggingIndex!==s&&t.target.classList.add("dragover")}dragLeave(t){t.target.classList.remove("dragover")}drop(t,s){t.preventDefault();let i=this.value[this.draggingIndex],r=[...this.value];r.splice(this.draggingIndex,1),r.splice(s,0,i),this.value=r,t.target.classList.remove("dragover"),this.draggingIndex=-1,L(this,x,B).call(this)}dragEnd(t){t.target.classList.remove("dragging")}renderField(t,s){let i=ae(this,P).cloneNode(!0).firstElementChild;return i=i.querySelector(".field")??i,Object.keys(t).forEach(r=>{i.setAttribute(r,t[r])}),c`
            <div
                class="field-wrapper"
                draggable="true"
                @dragstart=${r=>this.dragStart(r,s)}
                @dragover=${r=>this.dragOver(r,s)}
                @dragleave=${this.dragLeave}
                @drop=${r=>this.drop(r,s)}
                @dragend=${this.dragEnd}
            >
                ${i}
                <sp-icon-close
                    label="Remove field"
                    @click=${()=>this.removeField(s)}
                ></sp-icon-close>
                <sp-icon-drag-handle label="Order"></sp-icon-drag-handle>
            </div>
        `}render(){return ae(this,P)?c`
            <div @change="${this.handleChange}">
                ${this.value.map((t,s)=>this.renderField(t,s))}
                <sp-action-button quiet @click=${this.addField}>
                    <sp-icon-add label="Add" slot="icon"></sp-icon-add>Add
                </sp-action-button>
            </div>
        `:h}};P=new WeakMap,x=new WeakSet,B=function(){this.dispatchEvent(new CustomEvent(F,{bubbles:!0,composed:!0}))},m(Q,"styles",f`
        :host {
            display: block;
        }

        :host > div {
            display: contents;
        }

        .field-wrapper {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            padding: 4px;
        }

        .field-wrapper:hover {
            outline: 2px dashed var(--spectrum-global-color-gray-400);
            border-radius: var(--spectrum-global-dimension-size-50);
        }

        .field-wrapper > *:first-child {
            flex: 1;
        }

        .field-wrapper.dragging {
            opacity: 0.5;
        }

        .field-wrapper.dragover {
            border: 1px dashed #007bff;
        }

        sp-icon-drag-handle {
            visibility: hidden;
            margin-block-start: 24px;
            cursor: grab;
            pointer-events: auto;
        }

        .field-wrapper:hover sp-icon-drag-handle {
            visibility: visible;
        }

        sp-icon-close {
            pointer-events: auto;
            padding: 8px;
            margin-block-start: 24px;
            align-self: start;
            cursor: pointer;
        }

        sp-icon-close:hover {
            cursor: pointer;
        }
    `);customElements.define("mas-multifield",Q);var X=class extends p{static get properties(){return{icon:{type:String,reflect:!0},alt:{type:String,reflect:!0},link:{type:String,reflect:!0}}}get iconElement(){return this.shadowRoot.getElementById("icon")}get altElement(){return this.shadowRoot.getElementById("alt")}get linkElement(){return this.shadowRoot.getElementById("link")}connectedCallback(){super.connectedCallback(),this.shadowRoot.addEventListener(F,this.handleChange)}disconnectedCallback(){super.disconnectedCallback(),this.shadowRoot.removeEventListener(F,this.handleChange)}handleChange(e){e.target!==this&&(this[e.target.id]=e.target.value??"",e.stopPropagation(),this.dispatchEvent(new CustomEvent(F,{bubbles:!0,composed:!0,detail:this})))}get value(){return{icon:this.icon??"",alt:this.alt??"",link:this.link??""}}render(){return c`
            <sp-field-label required for="icon">Icon URL</sp-field-label>
            <sp-textfield id="icon" required placeholder="Enter icon URL" value="${this.icon}" @change="${this.handleChange}"></sp-textfield>
            <sp-field-label for="alt">Alt text</sp-field-label>
            <sp-textfield id="alt" placeholder="enter alt text" value="${this.alt}" @change="${this.handleChange}"></sp-textfield>
            <sp-field-label for="link">Link</sp-field-label>
            <sp-textfield id="link" placeholder="Enter target link" value="${this.link}" @change="${this.handleChange}"></sp-textfield
        `}};m(X,"styles",f`
        sp-textfield {
            width: 100%;
        }
    `);customElements.define("mas-mnemonic-field",X);var mt="/conf/mas/settings/dam/cfm/models/card",ee=class extends p{createRenderRoot(){return this}render(){if(this.fragment.model.path!==mt)return h;let e=Object.fromEntries([...this.fragment.fields.map(t=>[t.name,t])]);return c` <p>${this.fragment.path}</p>
            <sp-field-label for="card-variant">Variant</sp-field-label>
            <variant-picker
                id="card-variant"
                ?show-all="false"
                data-field="variant"
                default-value="${e.variant.values[0]}"
                @change="${this.updateFragment}"
            ></variant-picker>
            <sp-field-label for="card-title">Title</sp-field-label>
            <sp-textfield
                placeholder="Enter card title"
                id="card-title"
                data-field="cardTitle"
                value="${e.cardTitle.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="card-subtitle">Subtitle</sp-field-label>
            <sp-textfield
                placeholder="Enter card subtitle"
                id="card-subtitle"
                data-field="subtitle"
                value="${e.subtitle.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="card-size">Size</sp-field-label>
            <sp-textfield
                placeholder="Enter card size"
                id="card-size"
                data-field="size"
                value="${e.size.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="card-icon">Badge</sp-field-label>
            <sp-textfield
                placeholder="Enter badge text"
                id="card-badge"
                data-field="badge"
                value="${e.badge.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="mnemonic">Mnemonics</sp-field-label>
            <mas-multifield
                id="mnemonic"
                .value="${this.fragment.computed.mnemonics}"
                @change="${this.updateMnemonics}"
            >
                <template>
                    <mas-mnemonic-field></mas-mnemonic-field>
                </template>
            </mas-multifield>
            <sp-field-label for="card-icon">Background Image</sp-field-label>
            <sp-textfield
                placeholder="Enter backgroung image URL"
                id="background-title"
                data-field="backgroundImage"
                value="${e.backgroundImage.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="horizontal"> Prices </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-editor data-field="prices" @blur="${this.updateFragment}"
                    >${Z(e.prices.values[0])}</rte-editor
                >
            </sp-field-group>
            <sp-field-label for="horizontal"> Description </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-editor
                    data-field="description"
                    @blur="${this.updateFragment}"
                    >${Z(e.description.values[0])}</rte-editor
                >
            </sp-field-group>
            <sp-field-label for="horizontal"> Footer </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-editor data-field="ctas" @blur="${this.updateFragment}"
                    >${Z(e.ctas.values[0])}</rte-editor
                >
            </sp-field-group>`}updateFragment(e){this.dispatchEvent(new CustomEvent("update-fragment",{detail:e}))}updateMnemonics(e){let t=[],s=[],i=[];e.target.value.forEach(({icon:r,alt:a,link:o})=>{t.push(r??""),s.push(a??""),i.push(o??"")}),this.fragment.updateField("mnemonicIcon",t),this.fragment.updateField("mnemonicAlt",s),this.fragment.updateField("mnemonicLink",i),this.dispatchEvent(new CustomEvent("refresh-fragment"))}};m(ee,"properties",{fragment:{type:Object}});customElements.define("merch-card-editor",ee);var $e="[data-wcs-osi]",ye=class extends HTMLElement{constructor(){super(...arguments);m(this,"editor",null);m(this,"savedBookmark",null)}connectedCallback(){this.addEventListener("editor-action-click",this.handleEditorActionClick),window.tinymce.init({target:this,toolbar:"bold italic underline | link openlink unlink | ost",plugins:"link",license_key:"gpl",promotion:!1,branding:!1,extended_valid_elements:"a[is|href|class],span[is|class]",content_style:".price-strikethrough { text-decoration: line-through;}",setup:t=>{this.editor=t,t.on("blur",async s=>{this.savedBookmark=t.selection.getBookmark(2),[...t.contentDocument.querySelectorAll("p")].forEach(o=>{o.innerText.trim()===""&&o.remove()}),[...t.contentDocument.querySelectorAll("a")].forEach(o=>{Object.keys(o.dataset).forEach(l=>{/mce/.test(l)&&delete o.dataset[l]})});let i=[...t.contentDocument.querySelectorAll($e)];console.log("elements",i),i.forEach(o=>{o.dataset.wcsOsi&&(o.tagName==="A"?o.setAttribute("is","checkout-link"):o.tagName==="SPAN"&&o.setAttribute("is","inline-price"))}),t.contentDocument.body.innerHTML=`${t.contentDocument.body.innerHTML}`,i=[...t.contentDocument.querySelectorAll($e)],i.forEach(o=>{o.isInlinePrice&&(o.innerHTML=""),o.isCheckoutLink&&o.setAttribute("href",""),o.removeAttribute("class"),o.removeAttribute("contenteditable")}),gt(t.contentDocument.body);let r=t.contentDocument.body.innerHTML;i.forEach(o=>{o.setAttribute("contenteditable","false"),o.render?.()});let a=new CustomEvent("blur",{bubbles:!0,composed:!0,detail:{value:r}});this.dispatchEvent(a)}),t.on("init",s=>{let i=document.querySelector('script[src$="mas.js"]')?.src??document.getElementById("mas-src").content;if(!i)return;let r=t.contentDocument.createElement("script");r.src=i,r.setAttribute("type","module"),t.contentDocument.head.appendChild(r);let a=t.contentDocument.createElement("mas-commerce-service");t.contentDocument.head.appendChild(a);let o=t.contentDocument.createElement("script");o.innerHTML="window.process = { env: {} };",t.contentDocument.head.appendChild(o)}),t.on("SetContent",s=>{[...t.contentDocument.querySelectorAll("a[is],span[is]")].forEach(i=>{i.setAttribute("contenteditable","false")})}),t.ui.registry.addIcon("star-icon",`<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18">
  <title>Star</title>
  <rect id="ToDelete" fill="#ff13dc" opacity="0" width="18" height="18" /><path d="M9.24132.3l2.161,5.715,6.106.289a.255.255,0,0,1,.147.454l-4.77,3.823,1.612,5.9a.255.255,0,0,1-.386.28L9.00232,13.4l-5.11,3.358a.255.255,0,0,1-.386-.28l1.612-5.9-4.77-3.821a.255.255,0,0,1,.147-.457l6.107-.285L8.76332.3a.255.255,0,0,1,.478,0Z" />
</svg>`),t.ui.registry.addButton("ost",{icon:"star-icon",tooltip:"Open Offer Selector Tool",onAction:()=>{let s=new CustomEvent("ost-open",{bubbles:!0,composed:!0});this.dispatchEvent(s)}}),t.on("dblclick",s=>{s.preventDefault(),s.stopImmediatePropagation();let i=s.target.closest($e);if(i){let r=new CustomEvent("ost-open",{bubbles:!0,composed:!0,detail:{clickedElement:i}});this.dispatchEvent(r)}})}})}disconnectedCallback(){this.removeEventListener("editor-action-click",this.handleEditorActionClick)}appendContent(t,s){s&&s.remove(),this.editor&&(this.savedBookmark&&(this.editor.focus(),this.editor.selection.moveToBookmark(this.savedBookmark)),this.editor.insertContent(t))}};function gt(n){let e=document.createTreeWalker(n,NodeFilter.SHOW_COMMENT,null,!1),t=[],s;for(;s=e.nextNode();)t.push(s);t.forEach(i=>i.parentNode.removeChild(i))}customElements.define("rte-editor",ye);var Ee=class extends p{static get styles(){return f`
            :host {
                display: block;
                width: 100%;
            }
            sp-top-nav {
                width: 100%;
            }

            sp-top-nav-item {
                margin-inline-end: auto;
                margin-inline-start: 20px;
            }

            sp-top-nav-item.logo {
                color: #eb1000;
                width: 24px;
            }

            sp-top-nav-item strong {
                font-size: 21px;
                font-weight: 800;
                line-height: 20px;
                vertical-align: top;
                padding-inline-start: 5px;
            }
            sp-top-nav-item[placement='bottom-end'] {
                margin-inline-end: 10px;
            }
        `}render(){return c`
            <sp-top-nav>
                <sp-top-nav-item
                    class="logo"
                    size="l"
                    href="#"
                    label="Home"
                    quiet
                >
                    <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        x="0"
                        y="0"
                        viewBox="0 0 30 26"
                        width="24px"
                        xml:space="preserve"
                        role="img"
                        aria-label="Adobe"
                    >
                        <path
                            fill="#FA0F00"
                            d="M19 0h11v26zM11.1 0H0v26zM15 9.6L22.1 26h-4.6l-2.1-5.2h-5.2z"
                        ></path>
                    </svg>
                    <strong>Merch @ Scale Studio</strong>
                </sp-top-nav-item>
                <sp-top-nav-item href="#" label="Help" placement="bottom-end">
                    <sp-icon-help-outline></sp-icon-help-outline>
                </sp-top-nav-item>
                <sp-top-nav-item href="#" label="Help" placement="bottom-end">
                    <sp-icon-bell></sp-icon-bell>
                    <sp-top-nav-item
                        href="#"
                        label="Help"
                        placement="bottom-end"
                </sp-top-nav-item>
                </sp-top-nav-item>
            </sp-top-nav>
        `}};customElements.define("mas-top-nav",Ee);var te=class extends p{render(){return c`
            <sp-picker label="Offer Type" selected="None">
                <sp-menu-item>Base</sp-menu-item>
                <sp-menu-item>Trial</sp-menu-item>
                <sp-menu-item>Promotion</sp-menu-item>
            </sp-picker>

            <sp-picker label="Plan Type">
                <sp-menu-item>All</sp-menu-item>
                <sp-menu-item>ABM</sp-menu-item>
                <sp-menu-item>PUF</sp-menu-item>
                <sp-menu-item>M2M</sp-menu-item>
                <sp-menu-item>P3Y</sp-menu-item>
                <sp-menu-item>Perpetual</sp-menu-item>
            </sp-picker>

            <sp-picker label="Country">
                <sp-menu-item>United States</sp-menu-item>
                <sp-menu-item>United Kingdom</sp-menu-item>
                <sp-menu-item>Canada</sp-menu-item>
                <sp-menu-item>Australia</sp-menu-item>
            </sp-picker>

            <sp-picker label="Market Segment">
                <sp-menu-item>Individual</sp-menu-item>
                <sp-menu-item>Team</sp-menu-item>
            </sp-picker>

            <sp-picker label="Tags">
                <sp-menu-item>black-friday-2024</sp-menu-item>
                <sp-menu-item>cyber-monday-2024</sp-menu-item>
            </sp-picker>
        `}};m(te,"styles",f`
        :host {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 10px;
            align-self: flex-end;
        }
        sp-picker {
            width: 150px;
        }
    `);customElements.define("mas-filter-panel",te);var ft=[{label:"All",value:"all",surface:"all"},{label:"Catalog",value:"catalog",surface:"acom"},{label:"CCD Action",value:"ccd-action",surface:"ccd"},{label:"Slice",value:"ccd-slice",surface:"ccd"},{label:"Special offers",value:"special-offers",surface:"acom"},{label:"Suggested",value:"ccd-suggested",surface:"ccd"}],se=class extends p{get value(){return this.shadowRoot.querySelector("sp-picker")?.value}get variants(){return ft.filter(e=>this.showAll||e.value!="all").map(e=>c`<sp-menu-item value="${e.value}"
                    >${e.label}</sp-menu-item
                >`)}render(){return c`<sp-picker
            label="Card Variant"
            size="m"
            value=${this.value||this.defaultValue}
        >
            ${this.variants}
        </sp-picker>`}};m(se,"properties",{defaultValue:{type:String,attribute:"default-value"},showAll:{type:Boolean,attribute:"show-all"}});customElements.define("variant-picker",se);var V=class extends p{constructor(){super(),this.searchText="",this.variant="all"}render(){return c`
            <sp-button
                label="Filter"
                variant="secondary"
                @click=${this.handleFilterClick}
                >Filter</sp-button
            >
            <sp-picker label="Sort">
                <sp-menu-item>Ascending</sp-menu-item>
                <sp-menu-item>Descending</sp-menu-item>
            </sp-picker>
            <div>
                <sp-search
                    placeholder="Search"
                    @change="${this.handleSearch}"
                    @submit="${this.handleSearch}"
                    value=${this.searchText}
                    size="m"
                ></sp-search>
                <variant-picker
                    id="vpick"
                    show-all="true"
                    default-value="${this.variant}"
                    @change="${this.handleVariantChange}"
                ></variant-picker>
                <sp-button @click=${this.doSearch}>Search</sp-button>
            </div>
        `}handleSearch(e){this.searchText=e.target.value,this.dispatchEvent(new CustomEvent("search-text-changed",{detail:{searchText:this.searchText},bubbles:!0,composed:!0})),this.searchText||this.dispatchEvent(new CustomEvent("clear-search",{bubbles:!0,composed:!0})),e.type==="submit"&&(e.preventDefault(),this.dispatchEvent(new CustomEvent("search-fragments",{bubbles:!0,composed:!0})))}handleVariantChange(e){this.variant=e.target.value,this.dispatchEvent(new CustomEvent("variant-changed",{detail:{variant:this.variant},bubbles:!0,composed:!0}))}doSearch(){this.dispatchEvent(new CustomEvent("search-fragments",{bubbles:!0,composed:!0}))}handleFilterClick(){this.dispatchEvent(new CustomEvent("toggle-filter-panel",{bubbles:!0,composed:!0}))}};m(V,"styles",f`
        :host {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 10px;
            align-self: flex-end;
        }
        sp-picker {
            width: 100px;
        }
        sp-textfield {
            width: 200px;
        }
    `),m(V,"properties",{searchText:{type:String,state:!0},variant:{type:String,state:!0}});customElements.define("mas-filter-toolbar",V);var ie,We,Ke,T,Ye={"buy-now":"Buy now","free-trial":"Free trial","start-free-trial":"Start free trial","get-started":"Get started","choose-a-plan":"Choose a plan","learn-more":"Learn more","change-plan-team-plans":"Change Plan Team Plans",upgrade:"Upgrade","change-plan-team-payment":"Change Plan Team Payment","take-the-quiz":"Take the quiz","see-more":"See more","upgrade-now":"Upgrade now"},vt=["ccd-action","ah"],je={aosApiKey:"wcms-commerce-ims-user-prod",checkoutClientId:"creative",country:"US",environment:"PROD",landscape:"PUBLISHED",language:"en",searchParameters:{},searchOfferSelectorId:null,defaultPlaceholderOptions:{displayRecurrence:!0,displayPerUnit:!0,displayTax:!1,displayOldPrice:!1,forceTaxExclusive:!0},wcsApiKey:"wcms-commerce-ims-ro-user-cc",ctaTextOption:{ctaTexts:Object.entries(Ye).map(([n,e])=>({id:n,name:e})),getDefaultText(){return this.ctaTexts[0].id},getTexts(){return this.ctaTexts},getSelectedText(n){let e=n.get("text");return e&&this.ctaTexts.find(t=>t.id===e)?e:this.getDefaultText()}}},bt=(n,e,t,s,i)=>{if(!!e?.startsWith("checkout")){let a=document.createElement("a",{is:"checkout-link"});a.setAttribute("data-checkout-workflow",s.workflow),a.setAttribute("data-checkout-workflow-step",s.workflowStep??"segmentation"),a.setAttribute("data-promotion-code",i??""),a.setAttribute("data-quantity","1"),a.setAttribute("data-wcs-osi",n),a.href="#";let o=document.createElement("span"),l=s.ctaText??"buy-now";return vt.includes(Ke)&&(l=Ye[l]),o.textContent=l,a.appendChild(o),a}else{let a=document.createElement("span",{is:"inline-price"});return a.setAttribute("data-display-per-unit",s.displayPerUnit??"false"),a.setAttribute("data-quantity",t.ordering.max_quantity??"1"),a.setAttribute("data-template",e),a.setAttribute("data-wcs-osi",n),a.innerHTML="&nbsp;",a}};function $t(n,e,t,s,i){let r=bt(n,e,t,s,i);console.log(`Use Link: ${r.outerHTML}`),T?T.outerHTML=r.outerHTML:We.appendContent(r.outerHTML),Et()}var Ge=()=>document.getElementById("ostDialog"),yt=()=>{Ge().open=!0},Et=()=>{Ge().open=!1};function Je(){return c`
        <sp-overlay id="ostDialog" type="modal">
            <sp-dialog-wrapper dismissable underlay>
                <div id="ost"></div>
            </sp-dialog-wrapper>
        </overlay-trigger>
    `}function Ze(n,e,t){We=e,Ke=t,T=n.detail?.clickedElement;let s;if(!ie||T){ie=document.getElementById("ost");let i=localStorage.getItem("masAccessToken")??window.adobeid.authorize(),r=new URLSearchParams,a={...je.defaultPlaceholderOptions};T&&(s=T.getAttribute("data-wcs-osi"),Object.assign(a,T.dataset)),window.ost.openOfferSelectorTool({...je,rootElement:ie,zIndex:20,aosAccessToken:i,searchParameters:r,searchOfferSelectorId:s,defaultPlaceholderOptions:a,onSelect:$t})}ie&&yt()}var wt="load-start",At="load-end",ne=class extends p{constructor(){super(),this.newFragment=null,this.root="/content/dam/mas",this.variant="all",this.searchText="",this.path="",this.showFilterPanel=!1}connectedCallback(){super.connectedCallback(),this.registerListeners(),this.startDeeplink(),this.addEventListener("toggle-filter-panel",this.toggleFilterPanel),this.addEventListener("clear-search",this.clearSearch),this.addEventListener("search-fragments",this.doSearch),this.addEventListener("variant-changed",this.handleVariantChange),this.addEventListener("search-text-changed",this.handleSearchTextChange)}registerListeners(){this.addEventListener(wt,()=>{this.requestUpdate(),this.updateDeeplink()}),this.addEventListener(At,()=>this.requestUpdate()),document.addEventListener("keydown",e=>{e.key==="Escape"&&(this.closeFragmentEditor(),this.source.clearSelection(),this.contentNavigation.toggleSelectionMode(!1),document.activeElement.blur())}),this.addEventListener("select-fragment",e=>this.handleOpenFragment(e))}disconnectedCallback(){super.disconnectedCallback(),this.deeplinkDisposer&&this.deeplinkDisposer()}updateDeeplink(){let e={...this.source?.search};e.path===this.root&&(e.path=""),G(e)}toggleFilterPanel(){this.showFilterPanel=!this.showFilterPanel}clearSearch(){this.searchText="",G({query:void 0,path:void 0})}handleSearchTextChange(e){this.searchText=e.detail.searchText}updated(e){(e.has("searchText")||e.has("path")||e.has("variant"))&&this.source?.sendSearch()}get search(){return this.querySelector("sp-search")}get picker(){return this.querySelector("sp-picker")}get source(){return this.querySelector("aem-fragments")}get contentNavigation(){return this.querySelector("content-navigation")}get fragment(){return this.source?.fragment}createRenderRoot(){return this}get selectFragmentDialog(){return c`
            ${this.newFragment?c`<sp-overlay type="modal" open>
                      <sp-dialog-wrapper
                          headline="You have unsaved changes!"
                          underlay
                          @confirm=${()=>this.saveAndEditFragment(this.newFragment)}
                          @secondary="${()=>this.editFragment(this.newFragment,!0)}"
                          @cancel="${this.closeConfirmSelect}"
                          confirm-label="Save"
                          secondary-label="Discard"
                          cancel-label="Cancel"
                      >
                          <p>
                              Do you want to save your changes before selecting
                              another merch card?
                          </p>
                      </sp-dialog-wrapper>
                  </sp-overlay>`:h}
        `}get fragmentEditorToolbar(){return c`<div id="actions" slot="heading">
            <sp-action-group
                aria-label="Fragment actions"
                role="group"
                size="l"
                compact
                emphasized
            >
                <sp-action-button
                    label="Save"
                    title="Save changes"
                    value="save"
                    @click="${this.saveFragment}"
                >
                    <sp-icon-save-floppy slot="icon"></sp-icon-save-floppy>
                </sp-action-button>
                <sp-action-button
                    label="Discard"
                    title="Discard changes"
                    value="discard"
                    @click="${this.discardChanges}"
                >
                    <sp-icon-undo slot="icon"></sp-icon-undo>
                </sp-action-button>
                <sp-action-button
                    label="Clone"
                    value="clone"
                    @click="${this.copyFragment}"
                >
                    <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                </sp-action-button>
                <sp-action-button
                    label="Publish"
                    value="publish"
                    @click="${this.publishFragment}"
                >
                    <sp-icon-publish-check slot="icon"></sp-icon-publish-check>
                </sp-action-button>
                <sp-action-button
                    label="Unpublish"
                    value="unpublish"
                    @click="${this.unpublishFragment}"
                >
                    <sp-icon-publish-remove
                        slot="icon"
                    ></sp-icon-publish-remove>
                </sp-action-button>
                <sp-action-button
                    label="Open in Odin"
                    value="open"
                    @click="${this.openFragmentInOdin}"
                >
                    <sp-icon-open-in slot="icon"></sp-icon-open-in>
                </sp-action-button>
                <sp-action-button
                    label="Use"
                    value="use"
                    @click="${this.copyToUse}"
                >
                    <sp-icon-code slot="icon"></sp-icon-code>
                </sp-action-button>
                <sp-action-button
                    label="Delete fragment"
                    value="delete"
                    @click="${this.deleteFragment}"
                >
                    <sp-icon-delete-outline
                        slot="icon"
                    ></sp-icon-delete-outline>
                </sp-action-button>
            </sp-action-group>
            <sp-divider vertical></sp-divider>
            <sp-action-group size="l">
                <sp-action-button
                    title="Close"
                    label="Close"
                    value="close"
                    @click="${this.closeFragmentEditor}"
                >
                    <sp-icon-close-circle slot="icon"></sp-icon-close-circle>
                </sp-action-button>
            </sp-action-group>
        </div>`}get fragmentEditor(){return c`<sp-overlay type="manual" ?open=${this.fragment}>
            <sp-popover id="editor">
                <sp-dialog no-divider>
                    ${this.fragment?c`
                              <merch-card-editor
                                  .fragment=${this.fragment}
                                  @ost-open="${this.openOfferSelectorTool}"
                                  @refresh-fragment="${this.refreshFragment}"
                                  @update-fragment="${this.updateFragment}"
                              >
                              </merch-card-editor>
                              <p>Fragment details (not shown on the card)</p>
                              <sp-divider size="s"></sp-divider>
                              <sp-field-label for="fragment-title"
                                  >Fragment Title</sp-field-label
                              >
                              <sp-textfield
                                  placeholder="Enter fragment title"
                                  id="fragment-title"
                                  data-field="title"
                                  value="${this.fragment.title}"
                                  @change="${this.updateFragmentInternal}"
                              ></sp-textfield>
                              <sp-field-label for="fragment-description"
                                  >Fragment Description</sp-field-label
                              >
                              <sp-textfield
                                  placeholder="Enter fragment description"
                                  id="fragment-description"
                                  data-field="description"
                                  multiline
                                  value="${this.fragment.description}"
                                  @change="${this.updateFragmentInternal}"
                              ></sp-textfield>
                              ${this.fragmentEditorToolbar}
                          `:h}
                </sp-dialog>
            </sp-popover>
        </sp-overlay>`}get content(){return c`
            <aem-fragments
                id="aem"
                base-url="${this.baseUrl}"
                root="${this.root}"
                path="${this.path}"
                search="${this.searchText}"
                bucket="${this.bucket}"
                variant="${this.variant}"
            ></aem-fragments>
            <content-navigation source="aem" ?disabled=${this.fragment}>
                <table-view .customRenderItem=${this.customRenderItem}>
                    <sp-table-head-cell slot="headers"
                        >Variant</sp-table-head-cell
                    >
                </table-view>
                <render-view></render-view>
            </content-navigation>
        `}customRenderItem(e){return e?c` <sp-table-cell>${e.variant}</sp-table-cell>`:c`<sp-table-cell></sp-table-cell>`}render(){return c`
            <mas-top-nav></mas-top-nav>
            <side-nav></side-nav>
            <mas-filter-toolbar></mas-filter-toolbar>
            ${this.showFilterPanel?c`<mas-filter-panel></mas-filter-panel>`:h}
            ${this.content} ${this.fragmentEditor} ${this.selectFragmentDialog}
            ${this.toast} ${this.loadingIndicator} ${Je()}
        `}get toast(){return c`<sp-toast timeout="6000" popover></sp-toast>`}get loadingIndicator(){return this.source?.loading?c`<sp-progress-circle
            indeterminate
            size="l"
        ></sp-progress-circle>`:h}get toastEl(){return this.querySelector("sp-toast")}startDeeplink(){this.deeplinkDisposer=Be(({query:e,path:t})=>{this.searchText=e??"",this.path=t??""})}showToast(e,t="info"){let s=this.toastEl;s&&(s.textContent=e,s.variant=t,s.open=!0,s.showPopover())}async editFragment(e,t=!1){if(e&&e===this.fragment){this.requestUpdate();return}this.fragment?.hasChanges&&!t?this.newFragment=e:(this.newFragment=null,this.source?.setFragment(e)),this.requestUpdate()}async saveAndEditFragment(e){await this.saveFragment(),await this.editFragment(e,!0)}async adjustEditorPosition(e,t){await this.updateComplete;let s=window.innerWidth/2,i=e>s?"1em":"inherit",r=e<=s?"1em":"inherit";this.style.setProperty("--editor--left",i),this.style.setProperty("--editor--right",r);let a=window.innerHeight/2,o=t>a?"1em":"inherit",l=t<=a?"1em":"inherit";this.style.setProperty("--editor--top",o),this.style.setProperty("--editor--bottom",l)}async handleOpenFragment(e){let{x:t,y:s,fragment:i}=e.detail;await this.adjustEditorPosition(t,s),await this.editFragment(i)}updateFragmentInternal(e){let t=e.target.dataset.field,s=e.target.value;this.fragment.updateFieldInternal(t,s)}updateFragment({detail:e}){let t=e.target.dataset.field,s=e.target.value||e.detail?.value;s=e.target.multiline?s?.split(","):[s??""],this.fragment.updateField(t,s)&&this.fragmentElement?.refresh(!1)}get fragmentElement(){return this.querySelector(`aem-fragment[fragment="${this.fragment.id}"]`)}async refreshFragment(e){var t;this.fragmentElement&&((t=this.fragment).eventTarget??(t.eventTarget=this.fragmentElement.parentElement),this.fragmentElement.refresh(!1),await this.fragmentElement.updateComplete)}async saveFragment(){this.showToast("Saving fragment...");try{await this.source?.saveFragment(),await this.refreshFragment(),this.requestUpdate(),this.showToast("Fragment saved","positive")}catch{this.showToast("Fragment could not be saved","negative")}}async discardChanges(){await this.source?.discardChanges(),this.showToast("Changes discarded","info")}async copyFragment(){this.showToast("Cloning fragment...");try{await this.source?.copyFragment(),this.showToast("Fragment cloned","positive")}catch{this.showToast("Fragment could not be cloned","negative")}}async closeFragmentEditor(){await this.source?.setFragment(null),this.requestUpdate()}closeConfirmSelect(){this.newFragment=null}handleSearch(e){this.searchText=this.search.value,this.searchText||G({query:void 0,path:void 0}),e.type===Me&&(e.preventDefault(),this.source?.searchFragments())}handleVariantChange(e){this.variant=e.target.value}doSearch(){this.source?.searchFragments()}openFragmentInOdin(){window.open(`https://experience.adobe.com/?repo=${this.bucket}.adobeaemcloud.com#/@odin02/aem/cf/admin/?appId=aem-cf-admin&q=${this.fragment?.fragmentName}`,"_blank")}async publishFragment(){this.showToast("Publishing fragment...");try{await this.source?.publishFragment(),this.showToast("Fragment published","positive")}catch{this.showToast("Fragment could not be published","negative")}}async unpublishFragment(){this.showToast("Unpublishing fragment...");try{await this.source?.unpublishFragment(),this.showToast("Fragment unpublished","positive")}catch{this.showToast("Fragment could not be unpublished","negative")}}async deleteFragment(){if(confirm("Are you sure you want to delete this fragment?"))try{await this.source?.deleteFragment(),this.showToast("Fragment deleted","positive")}catch{this.showToast("Fragment could not be deleted","negative")}}async copyToUse(){let e=`<merch-card><aem-fragment fragment="${this.fragment?.id}"></aem-fragment></merch-card>`;try{await navigator.clipboard.writeText(e),this.showToast("Code copied to clipboard","positive")}catch{this.showToast("Failed to copy code to clipboard","negative")}}openOfferSelectorTool(e){Ze(e,e.target,this.fragment?.variant)}};m(ne,"properties",{bucket:{type:String,attribute:"aem-bucket"},searchText:{type:String,state:!0},baseUrl:{type:String,attribute:"base-url"},root:{type:String,state:!0},path:{type:String,state:!0},variant:{type:String,state:!0},newFragment:{type:Object,state:!0},showFilterPanel:{type:Boolean,state:!0}});customElements.define("mas-studio",ne);
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/lit-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

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

lit-html/directive.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/unsafe-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
//# sourceMappingURL=studio.js.map
