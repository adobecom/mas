var Ie=Object.defineProperty;var ze=(n,e,t)=>e in n?Ie(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var g=(n,e,t)=>ze(n,typeof e!="symbol"?e+"":e,t);var I=globalThis,z=I.ShadowRoot&&(I.ShadyCSS===void 0||I.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Q=Symbol(),de=new WeakMap,C=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==Q)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(z&&e===void 0){let s=t!==void 0&&t.length===1;s&&(e=de.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&de.set(t,e))}return e}toString(){return this.cssText}},ue=n=>new C(typeof n=="string"?n:n+"",void 0,Q),w=(n,...e)=>{let t=n.length===1?n[0]:e.reduce((s,i,r)=>s+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+n[r+1],n[0]);return new C(t,n,Q)},X=(n,e)=>{if(z)n.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let s=document.createElement("style"),i=I.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=t.cssText,n.appendChild(s)}},B=z?n=>n:n=>n instanceof CSSStyleSheet?(e=>{let t="";for(let s of e.cssRules)t+=s.cssText;return ue(t)})(n):n;var{is:Be,defineProperty:Ve,getOwnPropertyDescriptor:qe,getOwnPropertyNames:je,getOwnPropertySymbols:We,getPrototypeOf:Ke}=Object,y=globalThis,me=y.trustedTypes,Ye=me?me.emptyScript:"",Ge=y.reactiveElementPolyfillSupport,P=(n,e)=>n,ee={toAttribute(n,e){switch(e){case Boolean:n=n?Ye:null;break;case Object:case Array:n=n==null?n:JSON.stringify(n)}return n},fromAttribute(n,e){let t=n;switch(e){case Boolean:t=n!==null;break;case Number:t=n===null?null:Number(n);break;case Object:case Array:try{t=JSON.parse(n)}catch{t=null}}return t}},fe=(n,e)=>!Be(n,e),ge={attribute:!0,type:String,converter:ee,reflect:!1,hasChanged:fe};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),y.litPropertyMetadata??(y.litPropertyMetadata=new WeakMap);var v=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=ge){if(t.state&&(t.attribute=!1),this._$Ei(),this.elementProperties.set(e,t),!t.noAccessor){let s=Symbol(),i=this.getPropertyDescriptor(e,s,t);i!==void 0&&Ve(this.prototype,e,i)}}static getPropertyDescriptor(e,t,s){let{get:i,set:r}=qe(this.prototype,e)??{get(){return this[t]},set(a){this[t]=a}};return{get(){return i?.call(this)},set(a){let o=i?.call(this);r.call(this,a),this.requestUpdate(e,o,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??ge}static _$Ei(){if(this.hasOwnProperty(P("elementProperties")))return;let e=Ke(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(P("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(P("properties"))){let t=this.properties,s=[...je(t),...We(t)];for(let i of s)this.createProperty(i,t[i])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[s,i]of t)this.elementProperties.set(s,i)}this._$Eh=new Map;for(let[t,s]of this.elementProperties){let i=this._$Eu(t,s);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let s=new Set(e.flat(1/0).reverse());for(let i of s)t.unshift(B(i))}else e!==void 0&&t.push(B(e));return t}static _$Eu(e,t){let s=t.attribute;return s===!1?void 0:typeof s=="string"?s:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let s of t.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return X(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,s){this._$AK(e,s)}_$EC(e,t){let s=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,s);if(i!==void 0&&s.reflect===!0){let r=(s.converter?.toAttribute!==void 0?s.converter:ee).toAttribute(t,s.type);this._$Em=e,r==null?this.removeAttribute(i):this.setAttribute(i,r),this._$Em=null}}_$AK(e,t){let s=this.constructor,i=s._$Eh.get(e);if(i!==void 0&&this._$Em!==i){let r=s.getPropertyOptions(i),a=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:ee;this._$Em=i,this[i]=a.fromAttribute(t,r.type),this._$Em=null}}requestUpdate(e,t,s){if(e!==void 0){if(s??(s=this.constructor.getPropertyOptions(e)),!(s.hasChanged??fe)(this[e],t))return;this.P(e,t,s)}this.isUpdatePending===!1&&(this._$ES=this._$ET())}P(e,t,s){this._$AL.has(e)||this._$AL.set(e,t),s.reflect===!0&&this._$Em!==e&&(this._$Ej??(this._$Ej=new Set)).add(e)}async _$ET(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(let[i,r]of this._$Ep)this[i]=r;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[i,r]of s)r.wrapped!==!0||this._$AL.has(i)||this[i]===void 0||this.P(i,this[i],r)}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(t)):this._$EU()}catch(s){throw e=!1,this._$EU(),s}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EU(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Ej&&(this._$Ej=this._$Ej.forEach(t=>this._$EC(t,this[t]))),this._$EU()}updated(e){}firstUpdated(e){}};v.elementStyles=[],v.shadowRootOptions={mode:"open"},v[P("elementProperties")]=new Map,v[P("finalized")]=new Map,Ge?.({ReactiveElement:v}),(y.reactiveElementVersions??(y.reactiveElementVersions=[])).push("2.0.4");var F=globalThis,V=F.trustedTypes,ve=V?V.createPolicy("lit-html",{createHTML:n=>n}):void 0,_e="$lit$",E=`lit$${Math.random().toFixed(9).slice(2)}$`,Ae="?"+E,Je=`<${Ae}>`,S=document,U=()=>S.createComment(""),L=n=>n===null||typeof n!="object"&&typeof n!="function",oe=Array.isArray,Ze=n=>oe(n)||typeof n?.[Symbol.iterator]=="function",te=`[ 	
\f\r]`,O=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,be=/-->/g,$e=/>/g,_=RegExp(`>|${te}(?:([^\\s"'>=/]+)(${te}*=${te}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),ye=/'/g,Ee=/"/g,Se=/^(?:script|style|textarea|title)$/i,le=n=>(e,...t)=>({_$litType$:n,strings:e,values:t}),h=le(1),vt=le(2),bt=le(3),b=Symbol.for("lit-noChange"),c=Symbol.for("lit-nothing"),we=new WeakMap,A=S.createTreeWalker(S,129);function Te(n,e){if(!oe(n)||!n.hasOwnProperty("raw"))throw Error("invalid template strings array");return ve!==void 0?ve.createHTML(e):e}var Qe=(n,e)=>{let t=n.length-1,s=[],i,r=e===2?"<svg>":e===3?"<math>":"",a=O;for(let o=0;o<t;o++){let l=n[o],d,m,p=-1,f=0;for(;f<l.length&&(a.lastIndex=f,m=a.exec(l),m!==null);)f=a.lastIndex,a===O?m[1]==="!--"?a=be:m[1]!==void 0?a=$e:m[2]!==void 0?(Se.test(m[2])&&(i=RegExp("</"+m[2],"g")),a=_):m[3]!==void 0&&(a=_):a===_?m[0]===">"?(a=i??O,p=-1):m[1]===void 0?p=-2:(p=a.lastIndex-m[2].length,d=m[1],a=m[3]===void 0?_:m[3]==='"'?Ee:ye):a===Ee||a===ye?a=_:a===be||a===$e?a=O:(a=_,i=void 0);let $=a===_&&n[o+1].startsWith("/>")?" ":"";r+=a===O?l+Je:p>=0?(s.push(d),l.slice(0,p)+_e+l.slice(p)+E+$):l+E+(p===-2?o:$)}return[Te(n,r+(n[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),s]},D=class n{constructor({strings:e,_$litType$:t},s){let i;this.parts=[];let r=0,a=0,o=e.length-1,l=this.parts,[d,m]=Qe(e,t);if(this.el=n.createElement(d,s),A.currentNode=this.el.content,t===2||t===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(i=A.nextNode())!==null&&l.length<o;){if(i.nodeType===1){if(i.hasAttributes())for(let p of i.getAttributeNames())if(p.endsWith(_e)){let f=m[a++],$=i.getAttribute(p).split(E),M=/([.?@])?(.*)/.exec(f);l.push({type:1,index:r,name:M[2],strings:$,ctor:M[1]==="."?ie:M[1]==="?"?ne:M[1]==="@"?re:k}),i.removeAttribute(p)}else p.startsWith(E)&&(l.push({type:6,index:r}),i.removeAttribute(p));if(Se.test(i.tagName)){let p=i.textContent.split(E),f=p.length-1;if(f>0){i.textContent=V?V.emptyScript:"";for(let $=0;$<f;$++)i.append(p[$],U()),A.nextNode(),l.push({type:2,index:++r});i.append(p[f],U())}}}else if(i.nodeType===8)if(i.data===Ae)l.push({type:2,index:r});else{let p=-1;for(;(p=i.data.indexOf(E,p+1))!==-1;)l.push({type:7,index:r}),p+=E.length-1}r++}}static createElement(e,t){let s=S.createElement("template");return s.innerHTML=e,s}};function x(n,e,t=n,s){if(e===b)return e;let i=s!==void 0?t.o?.[s]:t.l,r=L(e)?void 0:e._$litDirective$;return i?.constructor!==r&&(i?._$AO?.(!1),r===void 0?i=void 0:(i=new r(n),i._$AT(n,t,s)),s!==void 0?(t.o??(t.o=[]))[s]=i:t.l=i),i!==void 0&&(e=x(n,i._$AS(n,e.values),i,s)),e}var se=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:s}=this._$AD,i=(e?.creationScope??S).importNode(t,!0);A.currentNode=i;let r=A.nextNode(),a=0,o=0,l=s[0];for(;l!==void 0;){if(a===l.index){let d;l.type===2?d=new N(r,r.nextSibling,this,e):l.type===1?d=new l.ctor(r,l.name,l.strings,this,e):l.type===6&&(d=new ae(r,this,e)),this._$AV.push(d),l=s[++o]}a!==l?.index&&(r=A.nextNode(),a++)}return A.currentNode=S,i}p(e){let t=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(e,s,t),t+=s.strings.length-2):s._$AI(e[t])),t++}},N=class n{get _$AU(){return this._$AM?._$AU??this.v}constructor(e,t,s,i){this.type=2,this._$AH=c,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=s,this.options=i,this.v=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=x(this,e,t),L(e)?e===c||e==null||e===""?(this._$AH!==c&&this._$AR(),this._$AH=c):e!==this._$AH&&e!==b&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Ze(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==c&&L(this._$AH)?this._$AA.nextSibling.data=e:this.T(S.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:s}=e,i=typeof s=="number"?this._$AC(e):(s.el===void 0&&(s.el=D.createElement(Te(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(t);else{let r=new se(i,this),a=r.u(this.options);r.p(t),this.T(a),this._$AH=r}}_$AC(e){let t=we.get(e.strings);return t===void 0&&we.set(e.strings,t=new D(e)),t}k(e){oe(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,s,i=0;for(let r of e)i===t.length?t.push(s=new n(this.O(U()),this.O(U()),this,this.options)):s=t[i],s._$AI(r),i++;i<t.length&&(this._$AR(s&&s._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e&&e!==this._$AB;){let s=e.nextSibling;e.remove(),e=s}}setConnected(e){this._$AM===void 0&&(this.v=e,this._$AP?.(e))}},k=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,s,i,r){this.type=1,this._$AH=c,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=r,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=c}_$AI(e,t=this,s,i){let r=this.strings,a=!1;if(r===void 0)e=x(this,e,t,0),a=!L(e)||e!==this._$AH&&e!==b,a&&(this._$AH=e);else{let o=e,l,d;for(e=r[0],l=0;l<r.length-1;l++)d=x(this,o[s+l],t,l),d===b&&(d=this._$AH[l]),a||(a=!L(d)||d!==this._$AH[l]),d===c?e=c:e!==c&&(e+=(d??"")+r[l+1]),this._$AH[l]=d}a&&!i&&this.j(e)}j(e){e===c?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},ie=class extends k{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===c?void 0:e}},ne=class extends k{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==c)}},re=class extends k{constructor(e,t,s,i,r){super(e,t,s,i,r),this.type=5}_$AI(e,t=this){if((e=x(this,e,t,0)??c)===b)return;let s=this._$AH,i=e===c&&s!==c||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,r=e!==c&&(s===c||i);i&&this.element.removeEventListener(this.name,this,s),r&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},ae=class{constructor(e,t,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){x(this,e)}};var Xe=F.litHtmlPolyfillSupport;Xe?.(D,N),(F.litHtmlVersions??(F.litHtmlVersions=[])).push("3.2.0");var xe=(n,e,t)=>{let s=t?.renderBefore??e,i=s._$litPart$;if(i===void 0){let r=t?.renderBefore??null;s._$litPart$=i=new N(e.insertBefore(U(),r),r,void 0,t??{})}return i._$AI(n),i};var u=class extends v{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t;let e=super.createRenderRoot();return(t=this.renderOptions).renderBefore??(t.renderBefore=e.firstChild),e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=xe(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return b}};u._$litElement$=!0,u.finalized=!0,globalThis.litElementHydrateSupport?.({LitElement:u});var et=globalThis.litElementPolyfillSupport;et?.({LitElement:u});(globalThis.litElementVersions??(globalThis.litElementVersions=[])).push("4.1.1");var ke="submit";var Ce="hashchange";function tt(n=window.location.hash){let e=[],t=n.replace(/^#/,"").split("&");for(let s of t){let[i,r=""]=s.split("=");i&&e.push([i,decodeURIComponent(r.replace(/\+/g," "))])}return Object.fromEntries(e)}function q(n){let e=new URLSearchParams(window.location.hash.slice(1));Object.entries(n).forEach(([i,r])=>{r?e.set(i,r):e.delete(i)}),e.sort();let t=e.toString();if(t===window.location.hash)return;let s=window.scrollY||document.documentElement.scrollTop;window.location.hash=t,window.scrollTo(0,s)}function Pe(n){let e=()=>{if(window.location.hash&&!window.location.hash.includes("="))return;let t=tt(window.location.hash);n(t)};return e(),window.addEventListener(Ce,e),()=>{window.removeEventListener(Ce,e)}}var Oe={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Fe=n=>(...e)=>({_$litDirective$:n,values:e}),j=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,s){this.t=e,this._$AM=t,this.i=s}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var H=class extends j{constructor(e){if(super(e),this.it=c,e.type!==Oe.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===c||e==null)return this._t=void 0,this.it=e;if(e===b)return e;if(typeof e!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;let t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}};H.directiveName="unsafeHTML",H.resultType=1;var W=Fe(H);var st="/conf/mas/settings/dam/cfm/models/card",K=class extends u{createRenderRoot(){return this}render(){if(this.fragment.model.path!==st)return c;let e=Object.fromEntries(this.fragment.fields.map(t=>[t.name,t]));return h` <p>${this.fragment.path}</p>
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
            <sp-field-label for="card-icon">Icons</sp-field-label>
            <sp-textfield
                placeholder="Enter icon URLs"
                id="card-icon"
                data-field="mnemonicIcon"
                multiline
                value="${e.mnemonicIcon.values.join(",")}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="card-icon">Badge</sp-field-label>
            <sp-textfield
                placeholder="Enter yellow badge text"
                id="card-badge"
                data-field="badge"
                value="${e.badge.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
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
                    >${W(e.prices.values[0])}</rte-editor
                >
            </sp-field-group>
            <sp-field-label for="horizontal"> Description </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-editor
                    data-field="description"
                    @blur="${this.updateFragment}"
                    >${W(e.description.values[0])}</rte-editor
                >
            </sp-field-group>
            <sp-field-label for="horizontal"> Footer </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-editor data-field="ctas" @blur="${this.updateFragment}"
                    >${W(e.ctas.values[0])}</rte-editor
                >
            </sp-field-group>`}updateFragment(e){this.dispatchEvent(new CustomEvent("update-fragment",{detail:e}))}};g(K,"properties",{fragment:{type:Object}});customElements.define("merch-card-editor",K);var ce="[data-wcs-osi]",he=class extends HTMLElement{constructor(){super(...arguments);g(this,"editor",null);g(this,"savedBookmark",null)}connectedCallback(){this.addEventListener("editor-action-click",this.handleEditorActionClick),window.tinymce.init({target:this,toolbar:"bold italic underline | link openlink unlink | ost",plugins:"link",license_key:"gpl",promotion:!1,branding:!1,extended_valid_elements:"a[is|href|class],span[is|class]",content_style:".price-strikethrough { text-decoration: line-through;}",setup:t=>{this.editor=t,t.on("blur",async s=>{this.savedBookmark=t.selection.getBookmark(2),[...t.contentDocument.querySelectorAll("p")].forEach(o=>{o.innerText.trim()===""&&o.remove()}),[...t.contentDocument.querySelectorAll("a")].forEach(o=>{Object.keys(o.dataset).forEach(l=>{/mce/.test(l)&&delete o.dataset[l]})});let i=[...t.contentDocument.querySelectorAll(ce)];console.log("elements",i),i.forEach(o=>{o.dataset.wcsOsi&&(o.tagName==="A"?o.setAttribute("is","checkout-link"):o.tagName==="SPAN"&&o.setAttribute("is","inline-price"))}),t.contentDocument.body.innerHTML=`${t.contentDocument.body.innerHTML}`,i=[...t.contentDocument.querySelectorAll(ce)],i.forEach(o=>{o.isInlinePrice&&(o.innerHTML=""),o.isCheckoutLink&&o.setAttribute("href",""),o.removeAttribute("class"),o.removeAttribute("contenteditable")}),it(t.contentDocument.body);let r=t.contentDocument.body.innerHTML;i.forEach(o=>{o.setAttribute("contenteditable","false"),o.render?.()});let a=new CustomEvent("blur",{bubbles:!0,composed:!0,detail:{value:r}});this.dispatchEvent(a)}),t.on("init",s=>{let i=document.querySelector('script[src$="mas.js"]')?.src??document.getElementById("mas-src").content;if(!i)return;let r=t.contentDocument.createElement("script");r.src=i,r.setAttribute("type","module"),t.contentDocument.head.appendChild(r);let a=t.contentDocument.createElement("mas-commerce-service");t.contentDocument.head.appendChild(a);let o=t.contentDocument.createElement("script");o.innerHTML="window.process = { env: {} };",t.contentDocument.head.appendChild(o)}),t.on("SetContent",s=>{[...t.contentDocument.querySelectorAll("a[is],span[is]")].forEach(i=>{i.setAttribute("contenteditable","false")})}),t.ui.registry.addIcon("star-icon",`<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18">
  <title>Star</title>
  <rect id="ToDelete" fill="#ff13dc" opacity="0" width="18" height="18" /><path d="M9.24132.3l2.161,5.715,6.106.289a.255.255,0,0,1,.147.454l-4.77,3.823,1.612,5.9a.255.255,0,0,1-.386.28L9.00232,13.4l-5.11,3.358a.255.255,0,0,1-.386-.28l1.612-5.9-4.77-3.821a.255.255,0,0,1,.147-.457l6.107-.285L8.76332.3a.255.255,0,0,1,.478,0Z" />
</svg>`),t.ui.registry.addButton("ost",{icon:"star-icon",tooltip:"Open Offer Selector Tool",onAction:()=>{let s=new CustomEvent("ost-open",{bubbles:!0,composed:!0});this.dispatchEvent(s)}}),t.on("dblclick",s=>{s.preventDefault(),s.stopImmediatePropagation();let i=s.target.closest(ce);if(i){let r=new CustomEvent("ost-open",{bubbles:!0,composed:!0,detail:{clickedElement:i}});this.dispatchEvent(r)}})}})}disconnectedCallback(){this.removeEventListener("editor-action-click",this.handleEditorActionClick)}appendContent(t,s){s&&s.remove(),this.editor&&(this.savedBookmark&&(this.editor.focus(),this.editor.selection.moveToBookmark(this.savedBookmark)),this.editor.insertContent(t))}};function it(n){let e=document.createTreeWalker(n,NodeFilter.SHOW_COMMENT,null,!1),t=[],s;for(;s=e.nextNode();)t.push(s);t.forEach(i=>i.parentNode.removeChild(i))}customElements.define("rte-editor",he);var pe=class extends u{static get styles(){return w`
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
        `}render(){return h`
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
        `}};customElements.define("mas-top-nav",pe);var Y=class extends u{render(){return h`
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
        `}};g(Y,"styles",w`
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
    `);customElements.define("mas-filter-panel",Y);var nt=[{label:"All",value:"all",surface:"all"},{label:"Catalog",value:"catalog",surface:"acom"},{label:"CCD Action",value:"ccd-action",surface:"ccd"},{label:"Slice",value:"ccd-slice",surface:"ccd"},{label:"Special offers",value:"special-offers",surface:"acom"},{label:"Suggested",value:"ccd-suggested",surface:"ccd"}],G=class extends u{get value(){return this.shadowRoot.querySelector("sp-picker")?.value}get variants(){return nt.filter(e=>this.showAll||e.value!="all").map(e=>h`<sp-menu-item value="${e.value}"
                    >${e.label}</sp-menu-item
                >`)}render(){return h`<sp-picker
            label="Card Variant"
            size="m"
            value=${this.value||this.defaultValue}
        >
            ${this.variants}
        </sp-picker>`}};g(G,"properties",{defaultValue:{type:String,attribute:"default-value"},showAll:{type:Boolean,attribute:"show-all"}});customElements.define("variant-picker",G);var R=class extends u{constructor(){super(),this.searchText="",this.variant="all"}render(){return h`
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
        `}handleSearch(e){this.searchText=e.target.value,this.dispatchEvent(new CustomEvent("search-text-changed",{detail:{searchText:this.searchText},bubbles:!0,composed:!0})),this.searchText||this.dispatchEvent(new CustomEvent("clear-search",{bubbles:!0,composed:!0})),e.type==="submit"&&(e.preventDefault(),this.dispatchEvent(new CustomEvent("search-fragments",{bubbles:!0,composed:!0})))}handleVariantChange(e){this.variant=e.target.value,this.dispatchEvent(new CustomEvent("variant-changed",{detail:{variant:this.variant},bubbles:!0,composed:!0}))}doSearch(){this.dispatchEvent(new CustomEvent("search-fragments",{bubbles:!0,composed:!0}))}handleFilterClick(){this.dispatchEvent(new CustomEvent("toggle-filter-panel",{bubbles:!0,composed:!0}))}};g(R,"styles",w`
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
    `),g(R,"properties",{searchText:{type:String,state:!0},variant:{type:String,state:!0}});customElements.define("mas-filter-toolbar",R);var J,Le,De,T,Ne={"buy-now":"Buy now","free-trial":"Free trial","start-free-trial":"Start free trial","get-started":"Get started","choose-a-plan":"Choose a plan","learn-more":"Learn more","change-plan-team-plans":"Change Plan Team Plans",upgrade:"Upgrade","change-plan-team-payment":"Change Plan Team Payment","take-the-quiz":"Take the quiz","see-more":"See more","upgrade-now":"Upgrade now"},rt=["ccd-action","ah"],Ue={aosApiKey:"wcms-commerce-ims-user-prod",checkoutClientId:"creative",country:"US",environment:"PROD",landscape:"PUBLISHED",language:"en",searchParameters:{},searchOfferSelectorId:null,defaultPlaceholderOptions:{displayRecurrence:!0,displayPerUnit:!0,displayTax:!1,displayOldPrice:!1,forceTaxExclusive:!0},wcsApiKey:"wcms-commerce-ims-ro-user-cc",ctaTextOption:{ctaTexts:Object.entries(Ne).map(([n,e])=>({id:n,name:e})),getDefaultText(){return this.ctaTexts[0].id},getTexts(){return this.ctaTexts},getSelectedText(n){let e=n.get("text");return e&&this.ctaTexts.find(t=>t.id===e)?e:this.getDefaultText()}}},at=(n,e,t,s,i)=>{if(!!e?.startsWith("checkout")){let a=document.createElement("a",{is:"checkout-link"});a.setAttribute("data-checkout-workflow",s.workflow),a.setAttribute("data-checkout-workflow-step",s.workflowStep??"segmentation"),a.setAttribute("data-promotion-code",i??""),a.setAttribute("data-quantity","1"),a.setAttribute("data-wcs-osi",n),a.href="#";let o=document.createElement("span"),l=s.ctaText??"buy-now";return rt.includes(De)&&(l=Ne[l]),o.textContent=l,a.appendChild(o),a}else{let a=document.createElement("span",{is:"inline-price"});return a.setAttribute("data-display-per-unit",s.displayPerUnit??"false"),a.setAttribute("data-quantity",t.ordering.max_quantity??"1"),a.setAttribute("data-template",e),a.setAttribute("data-wcs-osi",n),a.innerHTML="&nbsp;",a}};function ot(n,e,t,s,i){let r=at(n,e,t,s,i);console.log(`Use Link: ${r.outerHTML}`),T?T.outerHTML=r.outerHTML:Le.appendContent(r.outerHTML),ct()}var He=()=>document.getElementById("ostDialog"),lt=()=>{He().open=!0},ct=()=>{He().open=!1};function Re(){return h`
        <sp-overlay id="ostDialog" type="modal">
            <sp-dialog-wrapper dismissable underlay>
                <div id="ost"></div>
            </sp-dialog-wrapper>
        </overlay-trigger>
    `}function Me(n,e,t){Le=e,De=t,T=n.detail?.clickedElement;let s;if(!J||T){J=document.getElementById("ost");let i=localStorage.getItem("masAccessToken")??window.adobeid.authorize(),r=new URLSearchParams,a={...Ue.defaultPlaceholderOptions};T&&(s=T.getAttribute("data-wcs-osi"),Object.assign(a,T.dataset)),window.ost.openOfferSelectorTool({...Ue,rootElement:J,zIndex:20,aosAccessToken:i,searchParameters:r,searchOfferSelectorId:s,defaultPlaceholderOptions:a,onSelect:ot})}J&&lt()}var ht="load-start",pt="load-end",Z=class extends u{constructor(){super(),this.newFragment=null,this.root="/content/dam/mas",this.variant="all",this.searchText="",this.path="",this.showFilterPanel=!1}connectedCallback(){super.connectedCallback(),this.registerListeners(),this.startDeeplink(),this.addEventListener("toggle-filter-panel",this.toggleFilterPanel),this.addEventListener("clear-search",this.clearSearch),this.addEventListener("search-fragments",this.doSearch),this.addEventListener("variant-changed",this.handleVariantChange),this.addEventListener("search-text-changed",this.handleSearchTextChange)}registerListeners(){this.addEventListener(ht,()=>{this.requestUpdate(),this.updateDeeplink()}),this.addEventListener(pt,()=>this.requestUpdate()),document.addEventListener("keydown",e=>{e.key==="Escape"&&(this.closeFragmentEditor(),this.source.clearSelection(),this.contentNavigation.toggleSelectionMode(!1),document.activeElement.blur())}),this.addEventListener("select-fragment",e=>this.handleOpenFragment(e))}disconnectedCallback(){super.disconnectedCallback(),this.deeplinkDisposer&&this.deeplinkDisposer()}updateDeeplink(){let e={...this.source?.search};e.path===this.root&&(e.path=""),q(e)}toggleFilterPanel(){this.showFilterPanel=!this.showFilterPanel}clearSearch(){this.searchText="",q({query:void 0,path:void 0})}handleSearchTextChange(e){this.searchText=e.detail.searchText}updated(e){(e.has("searchText")||e.has("path")||e.has("variant"))&&this.source?.sendSearch()}get search(){return this.querySelector("sp-search")}get picker(){return this.querySelector("sp-picker")}get source(){return this.querySelector("aem-fragments")}get contentNavigation(){return this.querySelector("content-navigation")}get fragment(){return this.source?.fragment}createRenderRoot(){return this}get selectFragmentDialog(){return h`
            ${this.newFragment?h`<sp-overlay type="modal" open>
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
                  </sp-overlay>`:c}
        `}get fragmentEditorToolbar(){return h`<div id="actions" slot="heading">
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
        </div>`}get fragmentEditor(){return h`<sp-overlay type="manual" ?open=${this.source?.fragment}>
            <sp-popover id="editor">
                <sp-dialog no-divider>
                    ${this.source?.fragment?h`
                              <merch-card-editor
                                  .fragment=${this.source?.fragment}
                                  @ost-open="${this.openOfferSelectorTool}"
                                  @update-fragment="${this.updateFragment}"
                              >
                              </merch-card-editor>
                              ${this.fragmentEditorToolbar}
                          `:c}
                </sp-dialog>
            </sp-popover>
        </sp-overlay>`}get content(){return h`
            <aem-fragments
                id="aem"
                base-url="${this.baseUrl}"
                root="${this.root}"
                path="${this.path}"
                search="${this.searchText}"
                bucket="${this.bucket}"
                variant="${this.variant}"
            ></aem-fragments>
            <content-navigation source="aem" ?disabled=${this.source?.fragment}>
                <table-view .customRenderItem=${this.customRenderItem}>
                    <sp-table-head-cell slot="headers"
                        >Variant</sp-table-head-cell
                    >
                </table-view>
                <render-view></render-view>
            </content-navigation>
        `}customRenderItem(e){return e?h` <sp-table-cell>${e.variant}</sp-table-cell>`:h`<sp-table-cell></sp-table-cell>`}render(){return h`
            <mas-top-nav></mas-top-nav>
            <side-nav></side-nav>
            <mas-filter-toolbar></mas-filter-toolbar>
            ${this.showFilterPanel?h`<mas-filter-panel></mas-filter-panel>`:c}
            ${this.content} ${this.fragmentEditor} ${this.selectFragmentDialog}
            ${this.toast} ${this.loadingIndicator} ${Re()}
        `}get toast(){return h`<sp-toast timeout="6000" popover></sp-toast>`}get loadingIndicator(){return this.source?.loading?h`<sp-progress-circle
            indeterminate
            size="l"
        ></sp-progress-circle>`:c}get toastEl(){return this.querySelector("sp-toast")}startDeeplink(){this.deeplinkDisposer=Pe(({query:e,path:t})=>{this.searchText=e??"",this.path=t??""})}showToast(e,t="info"){let s=this.toastEl;s&&(s.textContent=e,s.variant=t,s.open=!0,s.showPopover())}async editFragment(e,t=!1){if(e&&e===this.fragment){this.requestUpdate();return}this.fragment?.hasChanges&&!t?this.newFragment=e:(this.newFragment=null,this.source?.setFragment(e)),this.requestUpdate()}async saveAndEditFragment(e){await this.saveFragment(),await this.editFragment(e,!0)}async adjustEditorPosition(e,t){await this.updateComplete;let s=window.innerWidth/2,i=e>s?"1em":"inherit",r=e<=s?"1em":"inherit";this.style.setProperty("--editor--left",i),this.style.setProperty("--editor--right",r);let a=window.innerHeight/2,o=t>a?"1em":"inherit",l=t<=a?"1em":"inherit";this.style.setProperty("--editor--top",o),this.style.setProperty("--editor--bottom",l)}async handleOpenFragment(e){let{x:t,y:s,fragment:i}=e.detail;await this.adjustEditorPosition(t,s),await this.editFragment(i)}updateFragment({detail:e}){let t=e.target.dataset.field,s=e.target.value||e.detail?.value;s=e.target.multiline?s?.split(","):[s??""],this.fragment.updateField(t,s)&&this.querySelector(`aem-fragment[fragment="${this.fragment.id}"]`)?.refresh(!1)}async saveFragment(){this.showToast("Saving fragment...");try{await this.source?.saveFragment(),this.showToast("Fragment saved","positive")}catch{this.showToast("Fragment could not be saved","negative")}}async discardChanges(){await this.source?.discardChanges(),this.showToast("Changes discarded","info")}async copyFragment(){this.showToast("Cloning fragment...");try{await this.source?.copyFragment(),this.showToast("Fragment cloned","positive")}catch{this.showToast("Fragment could not be cloned","negative")}}async closeFragmentEditor(){await this.source?.setFragment(null),this.requestUpdate()}closeConfirmSelect(){this.newFragment=null}handleSearch(e){this.searchText=this.search.value,this.searchText||q({query:void 0,path:void 0}),e.type===ke&&(e.preventDefault(),this.source?.searchFragments())}handleVariantChange(e){this.variant=e.target.value}doSearch(){this.source?.searchFragments()}openFragmentInOdin(){window.open(`https://experience.adobe.com/?repo=${this.bucket}.adobeaemcloud.com#/@odin02/aem/cf/admin/?appId=aem-cf-admin&q=${this.fragment?.fragmentName}`,"_blank")}async publishFragment(){this.showToast("Publishing fragment...");try{await this.source?.publishFragment(),this.showToast("Fragment published","positive")}catch{this.showToast("Fragment could not be published","negative")}}async unpublishFragment(){this.showToast("Unpublishing fragment...");try{await this.source?.unpublishFragment(),this.showToast("Fragment unpublished","positive")}catch{this.showToast("Fragment could not be unpublished","negative")}}async deleteFragment(){if(confirm("Are you sure you want to delete this fragment?"))try{await this.source?.deleteFragment(),this.showToast("Fragment deleted","positive")}catch{this.showToast("Fragment could not be deleted","negative")}}async copyToUse(){let e=`<merch-card><aem-fragment fragment="${this.fragment?.id}"></aem-fragment></merch-card>`;try{await navigator.clipboard.writeText(e),this.showToast("Code copied to clipboard","positive")}catch{this.showToast("Failed to copy code to clipboard","negative")}}openOfferSelectorTool(e){Me(e,e.target,this.fragment?.variant)}};g(Z,"properties",{bucket:{type:String,attribute:"aem-bucket"},searchText:{type:String,state:!0},baseUrl:{type:String,attribute:"base-url"},root:{type:String,state:!0},path:{type:String,state:!0},variant:{type:String,state:!0},newFragment:{type:Object,state:!0},showFilterPanel:{type:Boolean,state:!0}});customElements.define("mas-studio",Z);
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
