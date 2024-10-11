var We=Object.defineProperty;var Ke=(n,t,e)=>t in n?We(n,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):n[t]=e;var $=(n,t,e)=>Ke(n,typeof t!="symbol"?t+"":t,e);var Z=window,Q=Z.ShadowRoot&&(Z.ShadyCSS===void 0||Z.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Xt=Symbol(),Zt=new WeakMap,X=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==Xt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(Q&&t===void 0){let s=e!==void 0&&e.length===1;s&&(t=Zt.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&Zt.set(e,t))}return t}toString(){return this.cssText}},Qt=n=>new X(typeof n=="string"?n:n+"",void 0,Xt);var _t=(n,t)=>{Q?n.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet):t.forEach(e=>{let s=document.createElement("style"),i=Z.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=e.cssText,n.appendChild(s)})},tt=Q?n=>n:n=>n instanceof CSSStyleSheet?(t=>{let e="";for(let s of t.cssRules)e+=s.cssText;return Qt(e)})(n):n;var bt,et=window,te=et.trustedTypes,Ye=te?te.emptyScript:"",ee=et.reactiveElementPolyfillSupport,At={toAttribute(n,t){switch(t){case Boolean:n=n?Ye:null;break;case Object:case Array:n=n==null?n:JSON.stringify(n)}return n},fromAttribute(n,t){let e=n;switch(t){case Boolean:e=n!==null;break;case Number:e=n===null?null:Number(n);break;case Object:case Array:try{e=JSON.parse(n)}catch{e=null}}return e}},se=(n,t)=>t!==n&&(t==t||n==n),yt={attribute:!0,type:String,converter:At,reflect:!1,hasChanged:se},Et="finalized",E=class extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this._$Eu()}static addInitializer(t){var e;this.finalize(),((e=this.h)!==null&&e!==void 0?e:this.h=[]).push(t)}static get observedAttributes(){this.finalize();let t=[];return this.elementProperties.forEach((e,s)=>{let i=this._$Ep(s,e);i!==void 0&&(this._$Ev.set(i,s),t.push(i))}),t}static createProperty(t,e=yt){if(e.state&&(e.attribute=!1),this.finalize(),this.elementProperties.set(t,e),!e.noAccessor&&!this.prototype.hasOwnProperty(t)){let s=typeof t=="symbol"?Symbol():"__"+t,i=this.getPropertyDescriptor(t,s,e);i!==void 0&&Object.defineProperty(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){return{get(){return this[e]},set(i){let r=this[t];this[e]=i,this.requestUpdate(t,r,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||yt}static finalize(){if(this.hasOwnProperty(Et))return!1;this[Et]=!0;let t=Object.getPrototypeOf(this);if(t.finalize(),t.h!==void 0&&(this.h=[...t.h]),this.elementProperties=new Map(t.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){let e=this.properties,s=[...Object.getOwnPropertyNames(e),...Object.getOwnPropertySymbols(e)];for(let i of s)this.createProperty(i,e[i])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let s=new Set(t.flat(1/0).reverse());for(let i of s)e.unshift(tt(i))}else t!==void 0&&e.push(tt(t));return e}static _$Ep(t,e){let s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}_$Eu(){var t;this._$E_=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$Eg(),this.requestUpdate(),(t=this.constructor.h)===null||t===void 0||t.forEach(e=>e(this))}addController(t){var e,s;((e=this._$ES)!==null&&e!==void 0?e:this._$ES=[]).push(t),this.renderRoot!==void 0&&this.isConnected&&((s=t.hostConnected)===null||s===void 0||s.call(t))}removeController(t){var e;(e=this._$ES)===null||e===void 0||e.splice(this._$ES.indexOf(t)>>>0,1)}_$Eg(){this.constructor.elementProperties.forEach((t,e)=>{this.hasOwnProperty(e)&&(this._$Ei.set(e,this[e]),delete this[e])})}createRenderRoot(){var t;let e=(t=this.shadowRoot)!==null&&t!==void 0?t:this.attachShadow(this.constructor.shadowRootOptions);return _t(e,this.constructor.elementStyles),e}connectedCallback(){var t;this.renderRoot===void 0&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(t=this._$ES)===null||t===void 0||t.forEach(e=>{var s;return(s=e.hostConnected)===null||s===void 0?void 0:s.call(e)})}enableUpdating(t){}disconnectedCallback(){var t;(t=this._$ES)===null||t===void 0||t.forEach(e=>{var s;return(s=e.hostDisconnected)===null||s===void 0?void 0:s.call(e)})}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$EO(t,e,s=yt){var i;let r=this.constructor._$Ep(t,s);if(r!==void 0&&s.reflect===!0){let o=(((i=s.converter)===null||i===void 0?void 0:i.toAttribute)!==void 0?s.converter:At).toAttribute(e,s.type);this._$El=t,o==null?this.removeAttribute(r):this.setAttribute(r,o),this._$El=null}}_$AK(t,e){var s;let i=this.constructor,r=i._$Ev.get(t);if(r!==void 0&&this._$El!==r){let o=i.getPropertyOptions(r),l=typeof o.converter=="function"?{fromAttribute:o.converter}:((s=o.converter)===null||s===void 0?void 0:s.fromAttribute)!==void 0?o.converter:At;this._$El=r,this[r]=l.fromAttribute(e,o.type),this._$El=null}}requestUpdate(t,e,s){let i=!0;t!==void 0&&(((s=s||this.constructor.getPropertyOptions(t)).hasChanged||se)(this[t],e)?(this._$AL.has(t)||this._$AL.set(t,e),s.reflect===!0&&this._$El!==t&&(this._$EC===void 0&&(this._$EC=new Map),this._$EC.set(t,s))):i=!1),!this.isUpdatePending&&i&&(this._$E_=this._$Ej())}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach((i,r)=>this[r]=i),this._$Ei=void 0);let e=!1,s=this._$AL;try{e=this.shouldUpdate(s),e?(this.willUpdate(s),(t=this._$ES)===null||t===void 0||t.forEach(i=>{var r;return(r=i.hostUpdate)===null||r===void 0?void 0:r.call(i)}),this.update(s)):this._$Ek()}catch(i){throw e=!1,this._$Ek(),i}e&&this._$AE(s)}willUpdate(t){}_$AE(t){var e;(e=this._$ES)===null||e===void 0||e.forEach(s=>{var i;return(i=s.hostUpdated)===null||i===void 0?void 0:i.call(s)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(t){return!0}update(t){this._$EC!==void 0&&(this._$EC.forEach((e,s)=>this._$EO(s,this[s],e)),this._$EC=void 0),this._$Ek()}updated(t){}firstUpdated(t){}};E[Et]=!0,E.elementProperties=new Map,E.elementStyles=[],E.shadowRootOptions={mode:"open"},ee?.({ReactiveElement:E}),((bt=et.reactiveElementVersions)!==null&&bt!==void 0?bt:et.reactiveElementVersions=[]).push("1.6.3");var St,st=window,N=st.trustedTypes,ie=N?N.createPolicy("lit-html",{createHTML:n=>n}):void 0,Ct="$lit$",y=`lit$${(Math.random()+"").slice(9)}$`,he="?"+y,Je=`<${he}>`,C=document,it=()=>C.createComment(""),z=n=>n===null||typeof n!="object"&&typeof n!="function",de=Array.isArray,Ge=n=>de(n)||typeof n?.[Symbol.iterator]=="function",wt=`[ 	
\f\r]`,I=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ne=/-->/g,oe=/>/g,S=RegExp(`>|${wt}(?:([^\\s"'>=/]+)(${wt}*=${wt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),re=/'/g,ae=/"/g,pe=/^(?:script|style|textarea|title)$/i,ue=n=>(t,...e)=>({_$litType$:n,strings:t,values:e}),ys=ue(1),As=ue(2),x=Symbol.for("lit-noChange"),f=Symbol.for("lit-nothing"),le=new WeakMap,w=C.createTreeWalker(C,129,null,!1);function me(n,t){if(!Array.isArray(n)||!n.hasOwnProperty("raw"))throw Error("invalid template strings array");return ie!==void 0?ie.createHTML(t):t}var Ze=(n,t)=>{let e=n.length-1,s=[],i,r=t===2?"<svg>":"",o=I;for(let l=0;l<e;l++){let a=n[l],c,h,d=-1,p=0;for(;p<a.length&&(o.lastIndex=p,h=o.exec(a),h!==null);)p=o.lastIndex,o===I?h[1]==="!--"?o=ne:h[1]!==void 0?o=oe:h[2]!==void 0?(pe.test(h[2])&&(i=RegExp("</"+h[2],"g")),o=S):h[3]!==void 0&&(o=S):o===S?h[0]===">"?(o=i??I,d=-1):h[1]===void 0?d=-2:(d=o.lastIndex-h[2].length,c=h[1],o=h[3]===void 0?S:h[3]==='"'?ae:re):o===ae||o===re?o=S:o===ne||o===oe?o=I:(o=S,i=void 0);let v=o===S&&n[l+1].startsWith("/>")?" ":"";r+=o===I?a+Je:d>=0?(s.push(c),a.slice(0,d)+Ct+a.slice(d)+y+v):a+y+(d===-2?(s.push(void 0),l):v)}return[me(n,r+(n[e]||"<?>")+(t===2?"</svg>":"")),s]},B=class n{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let r=0,o=0,l=t.length-1,a=this.parts,[c,h]=Ze(t,e);if(this.el=n.createElement(c,s),w.currentNode=this.el.content,e===2){let d=this.el.content,p=d.firstChild;p.remove(),d.append(...p.childNodes)}for(;(i=w.nextNode())!==null&&a.length<l;){if(i.nodeType===1){if(i.hasAttributes()){let d=[];for(let p of i.getAttributeNames())if(p.endsWith(Ct)||p.startsWith(y)){let v=h[o++];if(d.push(p),v!==void 0){let $t=i.getAttribute(v.toLowerCase()+Ct).split(y),_=/([.?@])?(.*)/.exec(v);a.push({type:1,index:r,name:_[2],strings:$t,ctor:_[1]==="."?Tt:_[1]==="?"?kt:_[1]==="@"?Pt:D})}else a.push({type:6,index:r})}for(let p of d)i.removeAttribute(p)}if(pe.test(i.tagName)){let d=i.textContent.split(y),p=d.length-1;if(p>0){i.textContent=N?N.emptyScript:"";for(let v=0;v<p;v++)i.append(d[v],it()),w.nextNode(),a.push({type:2,index:++r});i.append(d[p],it())}}}else if(i.nodeType===8)if(i.data===he)a.push({type:2,index:r});else{let d=-1;for(;(d=i.data.indexOf(y,d+1))!==-1;)a.push({type:7,index:r}),d+=y.length-1}r++}}static createElement(t,e){let s=C.createElement("template");return s.innerHTML=t,s}};function L(n,t,e=n,s){var i,r,o,l;if(t===x)return t;let a=s!==void 0?(i=e._$Co)===null||i===void 0?void 0:i[s]:e._$Cl,c=z(t)?void 0:t._$litDirective$;return a?.constructor!==c&&((r=a?._$AO)===null||r===void 0||r.call(a,!1),c===void 0?a=void 0:(a=new c(n),a._$AT(n,e,s)),s!==void 0?((o=(l=e)._$Co)!==null&&o!==void 0?o:l._$Co=[])[s]=a:e._$Cl=a),a!==void 0&&(t=L(n,a._$AS(n,t.values),a,s)),t}var xt=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var e;let{el:{content:s},parts:i}=this._$AD,r=((e=t?.creationScope)!==null&&e!==void 0?e:C).importNode(s,!0);w.currentNode=r;let o=w.nextNode(),l=0,a=0,c=i[0];for(;c!==void 0;){if(l===c.index){let h;c.type===2?h=new nt(o,o.nextSibling,this,t):c.type===1?h=new c.ctor(o,c.name,c.strings,this,t):c.type===6&&(h=new Ut(o,this,t)),this._$AV.push(h),c=i[++a]}l!==c?.index&&(o=w.nextNode(),l++)}return w.currentNode=C,r}v(t){let e=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}},nt=class n{constructor(t,e,s,i){var r;this.type=2,this._$AH=f,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cp=(r=i?.isConnected)===null||r===void 0||r}get _$AU(){var t,e;return(e=(t=this._$AM)===null||t===void 0?void 0:t._$AU)!==null&&e!==void 0?e:this._$Cp}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=L(this,t,e),z(t)?t===f||t==null||t===""?(this._$AH!==f&&this._$AR(),this._$AH=f):t!==this._$AH&&t!==x&&this._(t):t._$litType$!==void 0?this.g(t):t.nodeType!==void 0?this.$(t):Ge(t)?this.T(t):this._(t)}k(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}$(t){this._$AH!==t&&(this._$AR(),this._$AH=this.k(t))}_(t){this._$AH!==f&&z(this._$AH)?this._$AA.nextSibling.data=t:this.$(C.createTextNode(t)),this._$AH=t}g(t){var e;let{values:s,_$litType$:i}=t,r=typeof i=="number"?this._$AC(t):(i.el===void 0&&(i.el=B.createElement(me(i.h,i.h[0]),this.options)),i);if(((e=this._$AH)===null||e===void 0?void 0:e._$AD)===r)this._$AH.v(s);else{let o=new xt(r,this),l=o.u(this.options);o.v(s),this.$(l),this._$AH=o}}_$AC(t){let e=le.get(t.strings);return e===void 0&&le.set(t.strings,e=new B(t)),e}T(t){de(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,s,i=0;for(let r of t)i===e.length?e.push(s=new n(this.k(it()),this.k(it()),this,this.options)):s=e[i],s._$AI(r),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){var s;for((s=this._$AP)===null||s===void 0||s.call(this,!1,!0,e);t&&t!==this._$AB;){let i=t.nextSibling;t.remove(),t=i}}setConnected(t){var e;this._$AM===void 0&&(this._$Cp=t,(e=this._$AP)===null||e===void 0||e.call(this,t))}},D=class{constructor(t,e,s,i,r){this.type=1,this._$AH=f,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=r,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=f}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,e=this,s,i){let r=this.strings,o=!1;if(r===void 0)t=L(this,t,e,0),o=!z(t)||t!==this._$AH&&t!==x,o&&(this._$AH=t);else{let l=t,a,c;for(t=r[0],a=0;a<r.length-1;a++)c=L(this,l[s+a],e,a),c===x&&(c=this._$AH[a]),o||(o=!z(c)||c!==this._$AH[a]),c===f?t=f:t!==f&&(t+=(c??"")+r[a+1]),this._$AH[a]=c}o&&!i&&this.j(t)}j(t){t===f?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},Tt=class extends D{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===f?void 0:t}},Xe=N?N.emptyScript:"",kt=class extends D{constructor(){super(...arguments),this.type=4}j(t){t&&t!==f?this.element.setAttribute(this.name,Xe):this.element.removeAttribute(this.name)}},Pt=class extends D{constructor(t,e,s,i,r){super(t,e,s,i,r),this.type=5}_$AI(t,e=this){var s;if((t=(s=L(this,t,e,0))!==null&&s!==void 0?s:f)===x)return;let i=this._$AH,r=t===f&&i!==f||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,o=t!==f&&(i===f||r);r&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,s;typeof this._$AH=="function"?this._$AH.call((s=(e=this.options)===null||e===void 0?void 0:e.host)!==null&&s!==void 0?s:this.element,t):this._$AH.handleEvent(t)}},Ut=class{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){L(this,t)}};var ce=st.litHtmlPolyfillSupport;ce?.(B,nt),((St=st.litHtmlVersions)!==null&&St!==void 0?St:st.litHtmlVersions=[]).push("2.8.0");var ot=window,rt=ot.ShadowRoot&&(ot.ShadyCSS===void 0||ot.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Ot=Symbol(),ve=new WeakMap,V=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==Ot)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(rt&&t===void 0){let s=e!==void 0&&e.length===1;s&&(t=ve.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&ve.set(e,t))}return t}toString(){return this.cssText}},fe=n=>new V(typeof n=="string"?n:n+"",void 0,Ot),T=(n,...t)=>{let e=n.length===1?n[0]:t.reduce((s,i,r)=>s+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+n[r+1],n[0]);return new V(e,n,Ot)},Ht=(n,t)=>{rt?n.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet):t.forEach(e=>{let s=document.createElement("style"),i=ot.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=e.cssText,n.appendChild(s)})},at=rt?n=>n:n=>n instanceof CSSStyleSheet?(t=>{let e="";for(let s of t.cssRules)e+=s.cssText;return fe(e)})(n):n;var Nt,lt=window,ge=lt.trustedTypes,Qe=ge?ge.emptyScript:"",$e=lt.reactiveElementPolyfillSupport,Dt={toAttribute(n,t){switch(t){case Boolean:n=n?Qe:null;break;case Object:case Array:n=n==null?n:JSON.stringify(n)}return n},fromAttribute(n,t){let e=n;switch(t){case Boolean:e=n!==null;break;case Number:e=n===null?null:Number(n);break;case Object:case Array:try{e=JSON.parse(n)}catch{e=null}}return e}},_e=(n,t)=>t!==n&&(t==t||n==n),Lt={attribute:!0,type:String,converter:Dt,reflect:!1,hasChanged:_e},Ft="finalized",b=class extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this._$Eu()}static addInitializer(t){var e;this.finalize(),((e=this.h)!==null&&e!==void 0?e:this.h=[]).push(t)}static get observedAttributes(){this.finalize();let t=[];return this.elementProperties.forEach((e,s)=>{let i=this._$Ep(s,e);i!==void 0&&(this._$Ev.set(i,s),t.push(i))}),t}static createProperty(t,e=Lt){if(e.state&&(e.attribute=!1),this.finalize(),this.elementProperties.set(t,e),!e.noAccessor&&!this.prototype.hasOwnProperty(t)){let s=typeof t=="symbol"?Symbol():"__"+t,i=this.getPropertyDescriptor(t,s,e);i!==void 0&&Object.defineProperty(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){return{get(){return this[e]},set(i){let r=this[t];this[e]=i,this.requestUpdate(t,r,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||Lt}static finalize(){if(this.hasOwnProperty(Ft))return!1;this[Ft]=!0;let t=Object.getPrototypeOf(this);if(t.finalize(),t.h!==void 0&&(this.h=[...t.h]),this.elementProperties=new Map(t.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){let e=this.properties,s=[...Object.getOwnPropertyNames(e),...Object.getOwnPropertySymbols(e)];for(let i of s)this.createProperty(i,e[i])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let s=new Set(t.flat(1/0).reverse());for(let i of s)e.unshift(at(i))}else t!==void 0&&e.push(at(t));return e}static _$Ep(t,e){let s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}_$Eu(){var t;this._$E_=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$Eg(),this.requestUpdate(),(t=this.constructor.h)===null||t===void 0||t.forEach(e=>e(this))}addController(t){var e,s;((e=this._$ES)!==null&&e!==void 0?e:this._$ES=[]).push(t),this.renderRoot!==void 0&&this.isConnected&&((s=t.hostConnected)===null||s===void 0||s.call(t))}removeController(t){var e;(e=this._$ES)===null||e===void 0||e.splice(this._$ES.indexOf(t)>>>0,1)}_$Eg(){this.constructor.elementProperties.forEach((t,e)=>{this.hasOwnProperty(e)&&(this._$Ei.set(e,this[e]),delete this[e])})}createRenderRoot(){var t;let e=(t=this.shadowRoot)!==null&&t!==void 0?t:this.attachShadow(this.constructor.shadowRootOptions);return Ht(e,this.constructor.elementStyles),e}connectedCallback(){var t;this.renderRoot===void 0&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(t=this._$ES)===null||t===void 0||t.forEach(e=>{var s;return(s=e.hostConnected)===null||s===void 0?void 0:s.call(e)})}enableUpdating(t){}disconnectedCallback(){var t;(t=this._$ES)===null||t===void 0||t.forEach(e=>{var s;return(s=e.hostDisconnected)===null||s===void 0?void 0:s.call(e)})}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$EO(t,e,s=Lt){var i;let r=this.constructor._$Ep(t,s);if(r!==void 0&&s.reflect===!0){let o=(((i=s.converter)===null||i===void 0?void 0:i.toAttribute)!==void 0?s.converter:Dt).toAttribute(e,s.type);this._$El=t,o==null?this.removeAttribute(r):this.setAttribute(r,o),this._$El=null}}_$AK(t,e){var s;let i=this.constructor,r=i._$Ev.get(t);if(r!==void 0&&this._$El!==r){let o=i.getPropertyOptions(r),l=typeof o.converter=="function"?{fromAttribute:o.converter}:((s=o.converter)===null||s===void 0?void 0:s.fromAttribute)!==void 0?o.converter:Dt;this._$El=r,this[r]=l.fromAttribute(e,o.type),this._$El=null}}requestUpdate(t,e,s){let i=!0;t!==void 0&&(((s=s||this.constructor.getPropertyOptions(t)).hasChanged||_e)(this[t],e)?(this._$AL.has(t)||this._$AL.set(t,e),s.reflect===!0&&this._$El!==t&&(this._$EC===void 0&&(this._$EC=new Map),this._$EC.set(t,s))):i=!1),!this.isUpdatePending&&i&&(this._$E_=this._$Ej())}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach((i,r)=>this[r]=i),this._$Ei=void 0);let e=!1,s=this._$AL;try{e=this.shouldUpdate(s),e?(this.willUpdate(s),(t=this._$ES)===null||t===void 0||t.forEach(i=>{var r;return(r=i.hostUpdate)===null||r===void 0?void 0:r.call(i)}),this.update(s)):this._$Ek()}catch(i){throw e=!1,this._$Ek(),i}e&&this._$AE(s)}willUpdate(t){}_$AE(t){var e;(e=this._$ES)===null||e===void 0||e.forEach(s=>{var i;return(i=s.hostUpdated)===null||i===void 0?void 0:i.call(s)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(t){return!0}update(t){this._$EC!==void 0&&(this._$EC.forEach((e,s)=>this._$EO(s,this[s],e)),this._$EC=void 0),this._$Ek()}updated(t){}firstUpdated(t){}};b[Ft]=!0,b.elementProperties=new Map,b.elementStyles=[],b.shadowRootOptions={mode:"open"},$e?.({ReactiveElement:b}),((Nt=lt.reactiveElementVersions)!==null&&Nt!==void 0?Nt:lt.reactiveElementVersions=[]).push("1.6.3");var Rt,ct=window,F=ct.trustedTypes,be=F?F.createPolicy("lit-html",{createHTML:n=>n}):void 0,It="$lit$",A=`lit$${(Math.random()+"").slice(9)}$`,xe="?"+A,ts=`<${xe}>`,U=document,q=()=>U.createComment(""),W=n=>n===null||typeof n!="object"&&typeof n!="function",Te=Array.isArray,es=n=>Te(n)||typeof n?.[Symbol.iterator]=="function",Mt=`[ 	
\f\r]`,j=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ye=/-->/g,Ae=/>/g,k=RegExp(`>|${Mt}(?:([^\\s"'>=/]+)(${Mt}*=${Mt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Ee=/'/g,Se=/"/g,ke=/^(?:script|style|textarea|title)$/i,Pe=n=>(t,...e)=>({_$litType$:n,strings:t,values:e}),u=Pe(1),Ts=Pe(2),O=Symbol.for("lit-noChange"),m=Symbol.for("lit-nothing"),we=new WeakMap,P=U.createTreeWalker(U,129,null,!1);function Ue(n,t){if(!Array.isArray(n)||!n.hasOwnProperty("raw"))throw Error("invalid template strings array");return be!==void 0?be.createHTML(t):t}var ss=(n,t)=>{let e=n.length-1,s=[],i,r=t===2?"<svg>":"",o=j;for(let l=0;l<e;l++){let a=n[l],c,h,d=-1,p=0;for(;p<a.length&&(o.lastIndex=p,h=o.exec(a),h!==null);)p=o.lastIndex,o===j?h[1]==="!--"?o=ye:h[1]!==void 0?o=Ae:h[2]!==void 0?(ke.test(h[2])&&(i=RegExp("</"+h[2],"g")),o=k):h[3]!==void 0&&(o=k):o===k?h[0]===">"?(o=i??j,d=-1):h[1]===void 0?d=-2:(d=o.lastIndex-h[2].length,c=h[1],o=h[3]===void 0?k:h[3]==='"'?Se:Ee):o===Se||o===Ee?o=k:o===ye||o===Ae?o=j:(o=k,i=void 0);let v=o===k&&n[l+1].startsWith("/>")?" ":"";r+=o===j?a+ts:d>=0?(s.push(c),a.slice(0,d)+It+a.slice(d)+A+v):a+A+(d===-2?(s.push(void 0),l):v)}return[Ue(n,r+(n[e]||"<?>")+(t===2?"</svg>":"")),s]},K=class n{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let r=0,o=0,l=t.length-1,a=this.parts,[c,h]=ss(t,e);if(this.el=n.createElement(c,s),P.currentNode=this.el.content,e===2){let d=this.el.content,p=d.firstChild;p.remove(),d.append(...p.childNodes)}for(;(i=P.nextNode())!==null&&a.length<l;){if(i.nodeType===1){if(i.hasAttributes()){let d=[];for(let p of i.getAttributeNames())if(p.endsWith(It)||p.startsWith(A)){let v=h[o++];if(d.push(p),v!==void 0){let $t=i.getAttribute(v.toLowerCase()+It).split(A),_=/([.?@])?(.*)/.exec(v);a.push({type:1,index:r,name:_[2],strings:$t,ctor:_[1]==="."?Bt:_[1]==="?"?Vt:_[1]==="@"?jt:M})}else a.push({type:6,index:r})}for(let p of d)i.removeAttribute(p)}if(ke.test(i.tagName)){let d=i.textContent.split(A),p=d.length-1;if(p>0){i.textContent=F?F.emptyScript:"";for(let v=0;v<p;v++)i.append(d[v],q()),P.nextNode(),a.push({type:2,index:++r});i.append(d[p],q())}}}else if(i.nodeType===8)if(i.data===xe)a.push({type:2,index:r});else{let d=-1;for(;(d=i.data.indexOf(A,d+1))!==-1;)a.push({type:7,index:r}),d+=A.length-1}r++}}static createElement(t,e){let s=U.createElement("template");return s.innerHTML=t,s}};function R(n,t,e=n,s){var i,r,o,l;if(t===O)return t;let a=s!==void 0?(i=e._$Co)===null||i===void 0?void 0:i[s]:e._$Cl,c=W(t)?void 0:t._$litDirective$;return a?.constructor!==c&&((r=a?._$AO)===null||r===void 0||r.call(a,!1),c===void 0?a=void 0:(a=new c(n),a._$AT(n,e,s)),s!==void 0?((o=(l=e)._$Co)!==null&&o!==void 0?o:l._$Co=[])[s]=a:e._$Cl=a),a!==void 0&&(t=R(n,a._$AS(n,t.values),a,s)),t}var zt=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var e;let{el:{content:s},parts:i}=this._$AD,r=((e=t?.creationScope)!==null&&e!==void 0?e:U).importNode(s,!0);P.currentNode=r;let o=P.nextNode(),l=0,a=0,c=i[0];for(;c!==void 0;){if(l===c.index){let h;c.type===2?h=new Y(o,o.nextSibling,this,t):c.type===1?h=new c.ctor(o,c.name,c.strings,this,t):c.type===6&&(h=new qt(o,this,t)),this._$AV.push(h),c=i[++a]}l!==c?.index&&(o=P.nextNode(),l++)}return P.currentNode=U,r}v(t){let e=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}},Y=class n{constructor(t,e,s,i){var r;this.type=2,this._$AH=m,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cp=(r=i?.isConnected)===null||r===void 0||r}get _$AU(){var t,e;return(e=(t=this._$AM)===null||t===void 0?void 0:t._$AU)!==null&&e!==void 0?e:this._$Cp}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=R(this,t,e),W(t)?t===m||t==null||t===""?(this._$AH!==m&&this._$AR(),this._$AH=m):t!==this._$AH&&t!==O&&this._(t):t._$litType$!==void 0?this.g(t):t.nodeType!==void 0?this.$(t):es(t)?this.T(t):this._(t)}k(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}$(t){this._$AH!==t&&(this._$AR(),this._$AH=this.k(t))}_(t){this._$AH!==m&&W(this._$AH)?this._$AA.nextSibling.data=t:this.$(U.createTextNode(t)),this._$AH=t}g(t){var e;let{values:s,_$litType$:i}=t,r=typeof i=="number"?this._$AC(t):(i.el===void 0&&(i.el=K.createElement(Ue(i.h,i.h[0]),this.options)),i);if(((e=this._$AH)===null||e===void 0?void 0:e._$AD)===r)this._$AH.v(s);else{let o=new zt(r,this),l=o.u(this.options);o.v(s),this.$(l),this._$AH=o}}_$AC(t){let e=we.get(t.strings);return e===void 0&&we.set(t.strings,e=new K(t)),e}T(t){Te(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,s,i=0;for(let r of t)i===e.length?e.push(s=new n(this.k(q()),this.k(q()),this,this.options)):s=e[i],s._$AI(r),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){var s;for((s=this._$AP)===null||s===void 0||s.call(this,!1,!0,e);t&&t!==this._$AB;){let i=t.nextSibling;t.remove(),t=i}}setConnected(t){var e;this._$AM===void 0&&(this._$Cp=t,(e=this._$AP)===null||e===void 0||e.call(this,t))}},M=class{constructor(t,e,s,i,r){this.type=1,this._$AH=m,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=r,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=m}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,e=this,s,i){let r=this.strings,o=!1;if(r===void 0)t=R(this,t,e,0),o=!W(t)||t!==this._$AH&&t!==O,o&&(this._$AH=t);else{let l=t,a,c;for(t=r[0],a=0;a<r.length-1;a++)c=R(this,l[s+a],e,a),c===O&&(c=this._$AH[a]),o||(o=!W(c)||c!==this._$AH[a]),c===m?t=m:t!==m&&(t+=(c??"")+r[a+1]),this._$AH[a]=c}o&&!i&&this.j(t)}j(t){t===m?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},Bt=class extends M{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===m?void 0:t}},is=F?F.emptyScript:"",Vt=class extends M{constructor(){super(...arguments),this.type=4}j(t){t&&t!==m?this.element.setAttribute(this.name,is):this.element.removeAttribute(this.name)}},jt=class extends M{constructor(t,e,s,i,r){super(t,e,s,i,r),this.type=5}_$AI(t,e=this){var s;if((t=(s=R(this,t,e,0))!==null&&s!==void 0?s:m)===O)return;let i=this._$AH,r=t===m&&i!==m||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,o=t!==m&&(i===m||r);r&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,s;typeof this._$AH=="function"?this._$AH.call((s=(e=this.options)===null||e===void 0?void 0:e.host)!==null&&s!==void 0?s:this.element,t):this._$AH.handleEvent(t)}},qt=class{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){R(this,t)}};var Ce=ct.litHtmlPolyfillSupport;Ce?.(K,Y),((Rt=ct.litHtmlVersions)!==null&&Rt!==void 0?Rt:ct.litHtmlVersions=[]).push("2.8.0");var Oe=(n,t,e)=>{var s,i;let r=(s=e?.renderBefore)!==null&&s!==void 0?s:t,o=r._$litPart$;if(o===void 0){let l=(i=e?.renderBefore)!==null&&i!==void 0?i:null;r._$litPart$=o=new Y(t.insertBefore(q(),l),l,void 0,e??{})}return o._$AI(n),o};var Wt,Kt;var g=class extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t,e;let s=super.createRenderRoot();return(t=(e=this.renderOptions).renderBefore)!==null&&t!==void 0||(e.renderBefore=s.firstChild),s}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Oe(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),(t=this._$Do)===null||t===void 0||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),(t=this._$Do)===null||t===void 0||t.setConnected(!1)}render(){return O}};g.finalized=!0,g._$litElement$=!0,(Wt=globalThis.litElementHydrateSupport)===null||Wt===void 0||Wt.call(globalThis,{LitElement:g});var He=globalThis.litElementPolyfillSupport;He?.({LitElement:g});((Kt=globalThis.litElementVersions)!==null&&Kt!==void 0?Kt:globalThis.litElementVersions=[]).push("3.3.3");var Ne="submit";var Le="hashchange";function ns(n=window.location.hash){let t=[],e=n.replace(/^#/,"").split("&");for(let s of e){let[i,r=""]=s.split("=");i&&t.push([i,decodeURIComponent(r.replace(/\+/g," "))])}return Object.fromEntries(t)}function ht(n){let t=new URLSearchParams(window.location.hash.slice(1));Object.entries(n).forEach(([i,r])=>{r?t.set(i,r):t.delete(i)}),t.sort();let e=t.toString();if(e===window.location.hash)return;let s=window.scrollY||document.documentElement.scrollTop;window.location.hash=e,window.scrollTo(0,s)}function De(n){let t=()=>{if(window.location.hash&&!window.location.hash.includes("="))return;let e=ns(window.location.hash);n(e)};return t(),window.addEventListener(Le,t),()=>{window.removeEventListener(Le,t)}}var Fe={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Re=n=>(...t)=>({_$litDirective$:n,values:t}),dt=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,s){this._$Ct=t,this._$AM=e,this._$Ci=s}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};var J=class extends dt{constructor(t){if(super(t),this.et=f,t.type!==Fe.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===f||t==null)return this.ft=void 0,this.et=t;if(t===x)return t;if(typeof t!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.et)return this.ft;this.et=t;let e=[t];return e.raw=e,this.ft={_$litType$:this.constructor.resultType,strings:e,values:[]}}};J.directiveName="unsafeHTML",J.resultType=1;var pt=Re(J);var os="/conf/mas/settings/dam/cfm/models/card",ut=class extends g{createRenderRoot(){return this}render(){if(this.fragment.model.path!==os)return m;let t=Object.fromEntries(this.fragment.fields.map(e=>[e.name,e]));return u` <p>${this.fragment.path}</p>
            <sp-field-label for="card-variant">Variant</sp-field-label>
            <variant-picker
                id="card-variant"
                ?show-all="false"
                data-field="variant"
                default-value="${t.variant.values[0]}"
                @change="${this.updateFragment}"
            ></variant-picker>
            <sp-field-label for="card-title">Title</sp-field-label>
            <sp-textfield
                placeholder="Enter card title"
                id="card-title"
                data-field="cardTitle"
                value="${t.cardTitle.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="card-subtitle">Subtitle</sp-field-label>
            <sp-textfield
                placeholder="Enter card subtitle"
                id="card-subtitle"
                data-field="subtitle"
                value="${t.subtitle.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="card-size">Size</sp-field-label>
            <sp-textfield
                placeholder="Enter card size"
                id="card-size"
                data-field="size"
                value="${t.size.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="card-icon">Icons</sp-field-label>
            <sp-textfield
                placeholder="Enter icon URLs"
                id="card-icon"
                data-field="mnemonicIcon"
                multiline
                value="${t.mnemonicIcon.values.join(",")}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="card-icon">Background Image</sp-field-label>
            <sp-textfield
                placeholder="Enter backgroung image URL"
                id="background-title"
                data-field="backgroundImage"
                value="${t.backgroundImage.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="horizontal"> Prices </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-editor data-field="prices" @blur="${this.updateFragment}"
                    >${pt(t.prices.values[0])}</rte-editor
                >
            </sp-field-group>
            <sp-field-label for="horizontal"> Description </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-editor
                    data-field="description"
                    @blur="${this.updateFragment}"
                    >${pt(t.description.values[0])}</rte-editor
                >
            </sp-field-group>
            <sp-field-label for="horizontal"> Footer </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-editor data-field="ctas" @blur="${this.updateFragment}"
                    >${pt(t.ctas.values[0])}</rte-editor
                >
            </sp-field-group>`}updateFragment(t){this.dispatchEvent(new CustomEvent("update-fragment",{detail:t}))}};$(ut,"properties",{fragment:{type:Object}});customElements.define("merch-card-editor",ut);var Yt="[data-wcs-osi]",Jt=class extends HTMLElement{constructor(){super(...arguments);$(this,"editor",null);$(this,"savedBookmark",null)}connectedCallback(){this.addEventListener("editor-action-click",this.handleEditorActionClick),window.tinymce.init({target:this,toolbar:"bold italic underline | link openlink unlink | ost",plugins:"link",license_key:"gpl",promotion:!1,branding:!1,extended_valid_elements:"a[is|href|class],span[is|class]",content_style:".price-strikethrough { text-decoration: line-through;}",setup:e=>{this.editor=e,e.on("blur",async s=>{this.savedBookmark=e.selection.getBookmark(2),[...e.contentDocument.querySelectorAll("p")].forEach(l=>{l.innerText.trim()===""&&l.remove()}),[...e.contentDocument.querySelectorAll("a")].forEach(l=>{Object.keys(l.dataset).forEach(a=>{/mce/.test(a)&&delete l.dataset[a]})});let i=[...e.contentDocument.querySelectorAll(Yt)];console.log("elements",i),i.forEach(l=>{l.dataset.wcsOsi&&(l.tagName==="A"?l.setAttribute("is","checkout-link"):l.tagName==="SPAN"&&l.setAttribute("is","inline-price"))}),e.contentDocument.body.innerHTML=`${e.contentDocument.body.innerHTML}`,i=[...e.contentDocument.querySelectorAll(Yt)],i.forEach(l=>{l.isInlinePrice&&(l.innerHTML=""),l.isCheckoutLink&&l.setAttribute("href",""),l.removeAttribute("class"),l.removeAttribute("contenteditable")}),rs(e.contentDocument.body);let r=e.contentDocument.body.innerHTML;i.forEach(l=>{l.setAttribute("contenteditable","false"),l.render?.()});let o=new CustomEvent("blur",{bubbles:!0,composed:!0,detail:{value:r}});this.dispatchEvent(o)}),e.on("init",s=>{let i=document.querySelector('script[src$="mas.js"]')?.src??document.getElementById("mas-src").content;if(!i)return;let r=e.contentDocument.createElement("script");r.src=i,r.setAttribute("type","module"),e.contentDocument.head.appendChild(r);let o=e.contentDocument.createElement("mas-commerce-service");e.contentDocument.head.appendChild(o);let l=e.contentDocument.createElement("script");l.innerHTML="window.process = { env: {} };",e.contentDocument.head.appendChild(l)}),e.on("SetContent",s=>{[...e.contentDocument.querySelectorAll("a[is],span[is]")].forEach(i=>{i.setAttribute("contenteditable","false")})}),e.ui.registry.addIcon("star-icon",`<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18">
  <title>Star</title>
  <rect id="ToDelete" fill="#ff13dc" opacity="0" width="18" height="18" /><path d="M9.24132.3l2.161,5.715,6.106.289a.255.255,0,0,1,.147.454l-4.77,3.823,1.612,5.9a.255.255,0,0,1-.386.28L9.00232,13.4l-5.11,3.358a.255.255,0,0,1-.386-.28l1.612-5.9-4.77-3.821a.255.255,0,0,1,.147-.457l6.107-.285L8.76332.3a.255.255,0,0,1,.478,0Z" />
</svg>`),e.ui.registry.addButton("ost",{icon:"star-icon",tooltip:"Open Offer Selector Tool",onAction:()=>{let s=new CustomEvent("ost-open",{bubbles:!0,composed:!0});this.dispatchEvent(s)}}),e.on("dblclick",s=>{s.preventDefault(),s.stopImmediatePropagation();let i=s.target.closest(Yt);if(i){let r=new CustomEvent("ost-open",{bubbles:!0,composed:!0,detail:{clickedElement:i}});this.dispatchEvent(r)}})}})}disconnectedCallback(){this.removeEventListener("editor-action-click",this.handleEditorActionClick)}appendContent(e,s){s&&s.remove(),this.editor&&(this.savedBookmark&&(this.editor.focus(),this.editor.selection.moveToBookmark(this.savedBookmark)),this.editor.insertContent(e))}};function rs(n){let t=document.createTreeWalker(n,NodeFilter.SHOW_COMMENT,null,!1),e=[],s;for(;s=t.nextNode();)e.push(s);e.forEach(i=>i.parentNode.removeChild(i))}customElements.define("rte-editor",Jt);var Gt=class extends g{static get styles(){return T`
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
        `}render(){return u`
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
        `}};customElements.define("mas-top-nav",Gt);var mt=class extends g{render(){return u`
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
        `}};$(mt,"styles",T`
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
    `);customElements.define("mas-filter-panel",mt);var as=[{label:"All",value:"all",surface:"all"},{label:"Catalog",value:"catalog",surface:"acom"},{label:"CCD Action",value:"ccd-action",surface:"ccd"},{label:"Slice",value:"ccd-slice",surface:"ccd"},{label:"Special offers",value:"special-offers",surface:"acom"},{label:"Suggested",value:"ccd-suggested",surface:"ccd"}],vt=class extends g{get value(){return this.shadowRoot.querySelector("sp-picker")?.value}get variants(){return as.filter(t=>this.showAll||t.value!="all").map(t=>u`<sp-menu-item value="${t.value}"
                    >${t.label}</sp-menu-item
                >`)}render(){return u`<sp-picker
            label="Card Variant"
            size="m"
            value=${this.value||this.defaultValue}
        >
            ${this.variants}
        </sp-picker>`}};$(vt,"properties",{defaultValue:{type:String,attribute:"default-value"},showAll:{type:Boolean,attribute:"show-all"}});customElements.define("variant-picker",vt);var G=class extends g{constructor(){super(),this.searchText="",this.variant="all"}render(){return u`
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
        `}handleSearch(t){this.searchText=t.target.value,this.dispatchEvent(new CustomEvent("search-text-changed",{detail:{searchText:this.searchText},bubbles:!0,composed:!0})),this.searchText||this.dispatchEvent(new CustomEvent("clear-search",{bubbles:!0,composed:!0})),t.type==="submit"&&(t.preventDefault(),this.dispatchEvent(new CustomEvent("search-fragments",{bubbles:!0,composed:!0})))}handleVariantChange(t){this.variant=t.target.value,this.dispatchEvent(new CustomEvent("variant-changed",{detail:{variant:this.variant},bubbles:!0,composed:!0}))}doSearch(){this.dispatchEvent(new CustomEvent("search-fragments",{bubbles:!0,composed:!0}))}handleFilterClick(){this.dispatchEvent(new CustomEvent("toggle-filter-panel",{bubbles:!0,composed:!0}))}};$(G,"styles",T`
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
    `),$(G,"properties",{searchText:{type:String,state:!0},variant:{type:String,state:!0}});customElements.define("mas-filter-toolbar",G);var ft,Ie,ze,H,Be={"buy-now":"Buy now","free-trial":"Free trial","start-free-trial":"Start free trial","get-started":"Get started","choose-a-plan":"Choose a plan","learn-more":"Learn more","change-plan-team-plans":"Change Plan Team Plans",upgrade:"Upgrade","change-plan-team-payment":"Change Plan Team Payment","take-the-quiz":"Take the quiz","see-more":"See more","upgrade-now":"Upgrade now"},ls=["ccd-action","ah"],Me={aosApiKey:"wcms-commerce-ims-user-prod",checkoutClientId:"creative",country:"US",environment:"PROD",landscape:"PUBLISHED",language:"en",searchParameters:{},searchOfferSelectorId:null,defaultPlaceholderOptions:{displayRecurrence:!0,displayPerUnit:!0,displayTax:!1,displayOldPrice:!1,forceTaxExclusive:!0},wcsApiKey:"wcms-commerce-ims-ro-user-cc",ctaTextOption:{ctaTexts:Object.entries(Be).map(([n,t])=>({id:n,name:t})),getDefaultText(){return this.ctaTexts[0].id},getTexts(){return this.ctaTexts},getSelectedText(n){let t=n.get("text");return t&&this.ctaTexts.find(e=>e.id===t)?t:this.getDefaultText()}}},cs=(n,t,e,s,i)=>{if(!!t?.startsWith("checkout")){let o=document.createElement("a",{is:"checkout-link"});o.setAttribute("data-checkout-workflow",s.workflow),o.setAttribute("data-checkout-workflow-step",s.workflowStep??"segmentation"),o.setAttribute("data-promotion-code",i??""),o.setAttribute("data-quantity","1"),o.setAttribute("data-wcs-osi",n),o.href="#";let l=document.createElement("span"),a=s.ctaText??"buy-now";return ls.includes(ze)&&(a=Be[a]),l.textContent=a,o.appendChild(l),o}else{let o=document.createElement("span",{is:"inline-price"});return o.setAttribute("data-display-per-unit",s.displayPerUnit??"false"),o.setAttribute("data-quantity",e.ordering.max_quantity??"1"),o.setAttribute("data-template",t),o.setAttribute("data-wcs-osi",n),o.innerHTML="&nbsp;",o}};function hs(n,t,e,s,i){let r=cs(n,t,e,s,i);console.log(`Use Link: ${r.outerHTML}`),H?H.outerHTML=r.outerHTML:Ie.appendContent(r.outerHTML),ps()}var Ve=()=>document.getElementById("ostDialog"),ds=()=>{Ve().open=!0},ps=()=>{Ve().open=!1};function je(){return u`
        <sp-overlay id="ostDialog" type="modal">
            <sp-dialog-wrapper dismissable underlay>
                <div id="ost"></div>
            </sp-dialog-wrapper>
        </overlay-trigger>
    `}function qe(n,t,e){Ie=t,ze=e,H=n.detail?.clickedElement;let s;if(!ft||H){ft=document.getElementById("ost");let i=localStorage.getItem("masAccessToken")??window.adobeid.authorize(),r=new URLSearchParams,o={...Me.defaultPlaceholderOptions};H&&(s=H.getAttribute("data-wcs-osi"),Object.assign(o,H.dataset)),window.ost.openOfferSelectorTool({...Me,rootElement:ft,zIndex:20,aosAccessToken:i,searchParameters:r,searchOfferSelectorId:s,defaultPlaceholderOptions:o,onSelect:hs})}ft&&ds()}var us="load-start",ms="load-end",gt=class extends g{constructor(){super(),this.newFragment=null,this.root="/content/dam/mas",this.variant="all",this.searchText="",this.path="",this.showFilterPanel=!1}connectedCallback(){super.connectedCallback(),this.registerListeners(),this.startDeeplink(),this.addEventListener("toggle-filter-panel",this.toggleFilterPanel),this.addEventListener("clear-search",this.clearSearch),this.addEventListener("search-fragments",this.doSearch),this.addEventListener("variant-changed",this.handleVariantChange),this.addEventListener("search-text-changed",this.handleSearchTextChange)}registerListeners(){this.addEventListener(us,()=>{this.requestUpdate(),this.updateDeeplink()}),this.addEventListener(ms,()=>this.requestUpdate()),document.addEventListener("keydown",t=>{t.key==="Escape"&&(this.closeFragmentEditor(),this.source.clearSelection(),this.contentNavigation.toggleSelectionMode(!1),document.activeElement.blur())}),this.addEventListener("select-fragment",t=>this.handleOpenFragment(t))}disconnectedCallback(){super.disconnectedCallback(),this.deeplinkDisposer&&this.deeplinkDisposer()}updateDeeplink(){let t={...this.source?.search};t.path===this.root&&(t.path=""),ht(t)}toggleFilterPanel(){this.showFilterPanel=!this.showFilterPanel}clearSearch(){this.searchText="",ht({query:void 0,path:void 0})}handleSearchTextChange(t){this.searchText=t.detail.searchText}updated(t){(t.has("searchText")||t.has("path")||t.has("variant"))&&this.source?.sendSearch()}get search(){return this.querySelector("sp-search")}get picker(){return this.querySelector("sp-picker")}get source(){return this.querySelector("aem-fragments")}get contentNavigation(){return this.querySelector("content-navigation")}get fragment(){return this.source?.fragment}createRenderRoot(){return this}get selectFragmentDialog(){return u`
            ${this.newFragment?u`<sp-overlay type="modal" open>
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
                  </sp-overlay>`:m}
        `}get fragmentEditorToolbar(){return u`<div id="actions" slot="heading">
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
        </div>`}get fragmentEditor(){return u`<sp-overlay type="manual" ?open=${this.source?.fragment}>
            <sp-popover id="editor">
                <sp-dialog no-divider>
                    ${this.source?.fragment?u`
                              <merch-card-editor
                                  .fragment=${this.source?.fragment}
                                  @ost-open="${this.openOfferSelectorTool}"
                                  @update-fragment="${this.updateFragment}"
                              >
                              </merch-card-editor>
                              ${this.fragmentEditorToolbar}
                          `:m}
                </sp-dialog>
            </sp-popover>
        </sp-overlay>`}get content(){return u`
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
        `}customRenderItem(t){return t?u` <sp-table-cell>${t.variant}</sp-table-cell>`:u`<sp-table-cell></sp-table-cell>`}render(){return u`
            <mas-top-nav></mas-top-nav>
            <side-nav></side-nav>
            <mas-filter-toolbar></mas-filter-toolbar>
            ${this.showFilterPanel?u`<mas-filter-panel></mas-filter-panel>`:m}
            ${this.content} ${this.fragmentEditor} ${this.selectFragmentDialog}
            ${this.toast} ${this.loadingIndicator} ${je()}
        `}get toast(){return u`<sp-toast timeout="6000" popover></sp-toast>`}get loadingIndicator(){return this.source?.loading?u`<sp-progress-circle
            indeterminate
            size="l"
        ></sp-progress-circle>`:m}get toastEl(){return this.querySelector("sp-toast")}startDeeplink(){this.deeplinkDisposer=De(({query:t,path:e})=>{this.searchText=t??"",this.path=e??""})}showToast(t,e="info"){let s=this.toastEl;s&&(s.textContent=t,s.variant=e,s.open=!0,s.showPopover())}async editFragment(t,e=!1){if(t&&t===this.fragment){this.requestUpdate();return}this.fragment?.hasChanges&&!e?this.newFragment=t:(this.newFragment=null,this.source?.setFragment(t)),this.requestUpdate()}async saveAndEditFragment(t){await this.saveFragment(),await this.editFragment(t,!0)}async adjustEditorPosition(t,e){await this.updateComplete;let s=window.innerWidth/2,i=t>s?"1em":"inherit",r=t<=s?"1em":"inherit";this.style.setProperty("--editor--left",i),this.style.setProperty("--editor--right",r);let o=window.innerHeight/2,l=e>o?"1em":"inherit",a=e<=o?"1em":"inherit";this.style.setProperty("--editor--top",l),this.style.setProperty("--editor--bottom",a)}async handleOpenFragment(t){let{x:e,y:s,fragment:i}=t.detail;await this.adjustEditorPosition(e,s),await this.editFragment(i)}updateFragment({detail:t}){let e=t.target.dataset.field,s=t.target.value||t.detail?.value;s=t.target.multiline?s?.split(","):[s??""],this.fragment.updateField(e,s)&&this.querySelector(`aem-fragment[fragment="${this.fragment.id}"]`)?.refresh(!1)}async saveFragment(){this.showToast("Saving fragment...");try{await this.source?.saveFragment(),this.showToast("Fragment saved","positive")}catch{this.showToast("Fragment could not be saved","negative")}}async discardChanges(){await this.source?.discardChanges(),this.showToast("Changes discarded","info")}async copyFragment(){this.showToast("Cloning fragment...");try{await this.source?.copyFragment(),this.showToast("Fragment cloned","positive")}catch{this.showToast("Fragment could not be cloned","negative")}}async closeFragmentEditor(){await this.source?.setFragment(null),this.requestUpdate()}closeConfirmSelect(){this.newFragment=null}handleSearch(t){this.searchText=this.search.value,this.searchText||ht({query:void 0,path:void 0}),t.type===Ne&&(t.preventDefault(),this.source?.searchFragments())}handleVariantChange(t){this.variant=t.target.value}doSearch(){this.source?.searchFragments()}openFragmentInOdin(){window.open(`https://experience.adobe.com/?repo=${this.bucket}.adobeaemcloud.com#/@odin02/aem/cf/admin/?appId=aem-cf-admin&q=${this.fragment?.fragmentName}`,"_blank")}async publishFragment(){this.showToast("Publishing fragment...");try{await this.source?.publishFragment(),this.showToast("Fragment published","positive")}catch{this.showToast("Fragment could not be published","negative")}}async unpublishFragment(){this.showToast("Unpublishing fragment...");try{await this.source?.unpublishFragment(),this.showToast("Fragment unpublished","positive")}catch{this.showToast("Fragment could not be unpublished","negative")}}async deleteFragment(){if(confirm("Are you sure you want to delete this fragment?"))try{await this.source?.deleteFragment(),this.showToast("Fragment deleted","positive")}catch{this.showToast("Fragment could not be deleted","negative")}}async copyToUse(){let t=`<merch-card><aem-fragment fragment="${this.fragment?.id}"></aem-fragment></merch-card>`;try{await navigator.clipboard.writeText(t),this.showToast("Code copied to clipboard","positive")}catch{this.showToast("Failed to copy code to clipboard","negative")}}openOfferSelectorTool(t){qe(t,t.target,this.fragment?.variant)}};$(gt,"properties",{bucket:{type:String,attribute:"aem-bucket"},searchText:{type:String,state:!0},baseUrl:{type:String,attribute:"base-url"},root:{type:String,state:!0},path:{type:String,state:!0},variant:{type:String,state:!0},newFragment:{type:Object,state:!0},showFilterPanel:{type:Boolean,state:!0}});customElements.define("mas-studio",gt);
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
