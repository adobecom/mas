var Ve=Object.defineProperty;var je=(n,t,e)=>t in n?Ve(n,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):n[t]=e;var $=(n,t,e)=>je(n,typeof t!="symbol"?t+"":t,e);var Y=window,G=Y.ShadowRoot&&(Y.ShadyCSS===void 0||Y.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Kt=Symbol(),Wt=new WeakMap,J=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==Kt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(G&&t===void 0){let s=e!==void 0&&e.length===1;s&&(t=Wt.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&Wt.set(e,t))}return t}toString(){return this.cssText}},Yt=n=>new J(typeof n=="string"?n:n+"",void 0,Kt);var vt=(n,t)=>{G?n.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet):t.forEach(e=>{let s=document.createElement("style"),i=Y.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=e.cssText,n.appendChild(s)})},Z=G?n=>n:n=>n instanceof CSSStyleSheet?(t=>{let e="";for(let s of t.cssRules)e+=s.cssText;return Yt(e)})(n):n;var ft,X=window,Jt=X.trustedTypes,ze=Jt?Jt.emptyScript:"",Gt=X.reactiveElementPolyfillSupport,$t={toAttribute(n,t){switch(t){case Boolean:n=n?ze:null;break;case Object:case Array:n=n==null?n:JSON.stringify(n)}return n},fromAttribute(n,t){let e=n;switch(t){case Boolean:e=n!==null;break;case Number:e=n===null?null:Number(n);break;case Object:case Array:try{e=JSON.parse(n)}catch{e=null}}return e}},Zt=(n,t)=>t!==n&&(t==t||n==n),gt={attribute:!0,type:String,converter:$t,reflect:!1,hasChanged:Zt},_t="finalized",E=class extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this._$Eu()}static addInitializer(t){var e;this.finalize(),((e=this.h)!==null&&e!==void 0?e:this.h=[]).push(t)}static get observedAttributes(){this.finalize();let t=[];return this.elementProperties.forEach((e,s)=>{let i=this._$Ep(s,e);i!==void 0&&(this._$Ev.set(i,s),t.push(i))}),t}static createProperty(t,e=gt){if(e.state&&(e.attribute=!1),this.finalize(),this.elementProperties.set(t,e),!e.noAccessor&&!this.prototype.hasOwnProperty(t)){let s=typeof t=="symbol"?Symbol():"__"+t,i=this.getPropertyDescriptor(t,s,e);i!==void 0&&Object.defineProperty(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){return{get(){return this[e]},set(i){let r=this[t];this[e]=i,this.requestUpdate(t,r,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||gt}static finalize(){if(this.hasOwnProperty(_t))return!1;this[_t]=!0;let t=Object.getPrototypeOf(this);if(t.finalize(),t.h!==void 0&&(this.h=[...t.h]),this.elementProperties=new Map(t.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){let e=this.properties,s=[...Object.getOwnPropertyNames(e),...Object.getOwnPropertySymbols(e)];for(let i of s)this.createProperty(i,e[i])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let s=new Set(t.flat(1/0).reverse());for(let i of s)e.unshift(Z(i))}else t!==void 0&&e.push(Z(t));return e}static _$Ep(t,e){let s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}_$Eu(){var t;this._$E_=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$Eg(),this.requestUpdate(),(t=this.constructor.h)===null||t===void 0||t.forEach(e=>e(this))}addController(t){var e,s;((e=this._$ES)!==null&&e!==void 0?e:this._$ES=[]).push(t),this.renderRoot!==void 0&&this.isConnected&&((s=t.hostConnected)===null||s===void 0||s.call(t))}removeController(t){var e;(e=this._$ES)===null||e===void 0||e.splice(this._$ES.indexOf(t)>>>0,1)}_$Eg(){this.constructor.elementProperties.forEach((t,e)=>{this.hasOwnProperty(e)&&(this._$Ei.set(e,this[e]),delete this[e])})}createRenderRoot(){var t;let e=(t=this.shadowRoot)!==null&&t!==void 0?t:this.attachShadow(this.constructor.shadowRootOptions);return vt(e,this.constructor.elementStyles),e}connectedCallback(){var t;this.renderRoot===void 0&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(t=this._$ES)===null||t===void 0||t.forEach(e=>{var s;return(s=e.hostConnected)===null||s===void 0?void 0:s.call(e)})}enableUpdating(t){}disconnectedCallback(){var t;(t=this._$ES)===null||t===void 0||t.forEach(e=>{var s;return(s=e.hostDisconnected)===null||s===void 0?void 0:s.call(e)})}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$EO(t,e,s=gt){var i;let r=this.constructor._$Ep(t,s);if(r!==void 0&&s.reflect===!0){let o=(((i=s.converter)===null||i===void 0?void 0:i.toAttribute)!==void 0?s.converter:$t).toAttribute(e,s.type);this._$El=t,o==null?this.removeAttribute(r):this.setAttribute(r,o),this._$El=null}}_$AK(t,e){var s;let i=this.constructor,r=i._$Ev.get(t);if(r!==void 0&&this._$El!==r){let o=i.getPropertyOptions(r),l=typeof o.converter=="function"?{fromAttribute:o.converter}:((s=o.converter)===null||s===void 0?void 0:s.fromAttribute)!==void 0?o.converter:$t;this._$El=r,this[r]=l.fromAttribute(e,o.type),this._$El=null}}requestUpdate(t,e,s){let i=!0;t!==void 0&&(((s=s||this.constructor.getPropertyOptions(t)).hasChanged||Zt)(this[t],e)?(this._$AL.has(t)||this._$AL.set(t,e),s.reflect===!0&&this._$El!==t&&(this._$EC===void 0&&(this._$EC=new Map),this._$EC.set(t,s))):i=!1),!this.isUpdatePending&&i&&(this._$E_=this._$Ej())}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach((i,r)=>this[r]=i),this._$Ei=void 0);let e=!1,s=this._$AL;try{e=this.shouldUpdate(s),e?(this.willUpdate(s),(t=this._$ES)===null||t===void 0||t.forEach(i=>{var r;return(r=i.hostUpdate)===null||r===void 0?void 0:r.call(i)}),this.update(s)):this._$Ek()}catch(i){throw e=!1,this._$Ek(),i}e&&this._$AE(s)}willUpdate(t){}_$AE(t){var e;(e=this._$ES)===null||e===void 0||e.forEach(s=>{var i;return(i=s.hostUpdated)===null||i===void 0?void 0:i.call(s)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(t){return!0}update(t){this._$EC!==void 0&&(this._$EC.forEach((e,s)=>this._$EO(s,this[s],e)),this._$EC=void 0),this._$Ek()}updated(t){}firstUpdated(t){}};E[_t]=!0,E.elementProperties=new Map,E.elementStyles=[],E.shadowRootOptions={mode:"open"},Gt?.({ReactiveElement:E}),((ft=X.reactiveElementVersions)!==null&&ft!==void 0?ft:X.reactiveElementVersions=[]).push("1.6.3");var yt,Q=window,N=Q.trustedTypes,Xt=N?N.createPolicy("lit-html",{createHTML:n=>n}):void 0,bt="$lit$",A=`lit$${(Math.random()+"").slice(9)}$`,oe="?"+A,qe=`<${oe}>`,C=document,tt=()=>C.createComment(""),I=n=>n===null||typeof n!="object"&&typeof n!="function",re=Array.isArray,We=n=>re(n)||typeof n?.[Symbol.iterator]=="function",At=`[ 	
\f\r]`,F=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Qt=/-->/g,te=/>/g,S=RegExp(`>|${At}(?:([^\\s"'>=/]+)(${At}*=${At}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),ee=/'/g,se=/"/g,ae=/^(?:script|style|textarea|title)$/i,le=n=>(t,...e)=>({_$litType$:n,strings:t,values:e}),gs=le(1),$s=le(2),T=Symbol.for("lit-noChange"),v=Symbol.for("lit-nothing"),ie=new WeakMap,w=C.createTreeWalker(C,129,null,!1);function ce(n,t){if(!Array.isArray(n)||!n.hasOwnProperty("raw"))throw Error("invalid template strings array");return Xt!==void 0?Xt.createHTML(t):t}var Ke=(n,t)=>{let e=n.length-1,s=[],i,r=t===2?"<svg>":"",o=F;for(let l=0;l<e;l++){let a=n[l],c,h,d=-1,u=0;for(;u<a.length&&(o.lastIndex=u,h=o.exec(a),h!==null);)u=o.lastIndex,o===F?h[1]==="!--"?o=Qt:h[1]!==void 0?o=te:h[2]!==void 0?(ae.test(h[2])&&(i=RegExp("</"+h[2],"g")),o=S):h[3]!==void 0&&(o=S):o===S?h[0]===">"?(o=i??F,d=-1):h[1]===void 0?d=-2:(d=o.lastIndex-h[2].length,c=h[1],o=h[3]===void 0?S:h[3]==='"'?se:ee):o===se||o===ee?o=S:o===Qt||o===te?o=F:(o=S,i=void 0);let m=o===S&&n[l+1].startsWith("/>")?" ":"";r+=o===F?a+qe:d>=0?(s.push(c),a.slice(0,d)+bt+a.slice(d)+A+m):a+A+(d===-2?(s.push(void 0),l):m)}return[ce(n,r+(n[e]||"<?>")+(t===2?"</svg>":"")),s]},B=class n{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let r=0,o=0,l=t.length-1,a=this.parts,[c,h]=Ke(t,e);if(this.el=n.createElement(c,s),w.currentNode=this.el.content,e===2){let d=this.el.content,u=d.firstChild;u.remove(),d.append(...u.childNodes)}for(;(i=w.nextNode())!==null&&a.length<l;){if(i.nodeType===1){if(i.hasAttributes()){let d=[];for(let u of i.getAttributeNames())if(u.endsWith(bt)||u.startsWith(A)){let m=h[o++];if(d.push(u),m!==void 0){let mt=i.getAttribute(m.toLowerCase()+bt).split(A),_=/([.?@])?(.*)/.exec(m);a.push({type:1,index:r,name:_[2],strings:mt,ctor:_[1]==="."?St:_[1]==="?"?wt:_[1]==="@"?Ct:L})}else a.push({type:6,index:r})}for(let u of d)i.removeAttribute(u)}if(ae.test(i.tagName)){let d=i.textContent.split(A),u=d.length-1;if(u>0){i.textContent=N?N.emptyScript:"";for(let m=0;m<u;m++)i.append(d[m],tt()),w.nextNode(),a.push({type:2,index:++r});i.append(d[u],tt())}}}else if(i.nodeType===8)if(i.data===oe)a.push({type:2,index:r});else{let d=-1;for(;(d=i.data.indexOf(A,d+1))!==-1;)a.push({type:7,index:r}),d+=A.length-1}r++}}static createElement(t,e){let s=C.createElement("template");return s.innerHTML=t,s}};function H(n,t,e=n,s){var i,r,o,l;if(t===T)return t;let a=s!==void 0?(i=e._$Co)===null||i===void 0?void 0:i[s]:e._$Cl,c=I(t)?void 0:t._$litDirective$;return a?.constructor!==c&&((r=a?._$AO)===null||r===void 0||r.call(a,!1),c===void 0?a=void 0:(a=new c(n),a._$AT(n,e,s)),s!==void 0?((o=(l=e)._$Co)!==null&&o!==void 0?o:l._$Co=[])[s]=a:e._$Cl=a),a!==void 0&&(t=H(n,a._$AS(n,t.values),a,s)),t}var Et=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var e;let{el:{content:s},parts:i}=this._$AD,r=((e=t?.creationScope)!==null&&e!==void 0?e:C).importNode(s,!0);w.currentNode=r;let o=w.nextNode(),l=0,a=0,c=i[0];for(;c!==void 0;){if(l===c.index){let h;c.type===2?h=new et(o,o.nextSibling,this,t):c.type===1?h=new c.ctor(o,c.name,c.strings,this,t):c.type===6&&(h=new Tt(o,this,t)),this._$AV.push(h),c=i[++a]}l!==c?.index&&(o=w.nextNode(),l++)}return w.currentNode=C,r}v(t){let e=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}},et=class n{constructor(t,e,s,i){var r;this.type=2,this._$AH=v,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cp=(r=i?.isConnected)===null||r===void 0||r}get _$AU(){var t,e;return(e=(t=this._$AM)===null||t===void 0?void 0:t._$AU)!==null&&e!==void 0?e:this._$Cp}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=H(this,t,e),I(t)?t===v||t==null||t===""?(this._$AH!==v&&this._$AR(),this._$AH=v):t!==this._$AH&&t!==T&&this._(t):t._$litType$!==void 0?this.g(t):t.nodeType!==void 0?this.$(t):We(t)?this.T(t):this._(t)}k(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}$(t){this._$AH!==t&&(this._$AR(),this._$AH=this.k(t))}_(t){this._$AH!==v&&I(this._$AH)?this._$AA.nextSibling.data=t:this.$(C.createTextNode(t)),this._$AH=t}g(t){var e;let{values:s,_$litType$:i}=t,r=typeof i=="number"?this._$AC(t):(i.el===void 0&&(i.el=B.createElement(ce(i.h,i.h[0]),this.options)),i);if(((e=this._$AH)===null||e===void 0?void 0:e._$AD)===r)this._$AH.v(s);else{let o=new Et(r,this),l=o.u(this.options);o.v(s),this.$(l),this._$AH=o}}_$AC(t){let e=ie.get(t.strings);return e===void 0&&ie.set(t.strings,e=new B(t)),e}T(t){re(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,s,i=0;for(let r of t)i===e.length?e.push(s=new n(this.k(tt()),this.k(tt()),this,this.options)):s=e[i],s._$AI(r),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){var s;for((s=this._$AP)===null||s===void 0||s.call(this,!1,!0,e);t&&t!==this._$AB;){let i=t.nextSibling;t.remove(),t=i}}setConnected(t){var e;this._$AM===void 0&&(this._$Cp=t,(e=this._$AP)===null||e===void 0||e.call(this,t))}},L=class{constructor(t,e,s,i,r){this.type=1,this._$AH=v,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=r,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=v}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,e=this,s,i){let r=this.strings,o=!1;if(r===void 0)t=H(this,t,e,0),o=!I(t)||t!==this._$AH&&t!==T,o&&(this._$AH=t);else{let l=t,a,c;for(t=r[0],a=0;a<r.length-1;a++)c=H(this,l[s+a],e,a),c===T&&(c=this._$AH[a]),o||(o=!I(c)||c!==this._$AH[a]),c===v?t=v:t!==v&&(t+=(c??"")+r[a+1]),this._$AH[a]=c}o&&!i&&this.j(t)}j(t){t===v?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},St=class extends L{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===v?void 0:t}},Ye=N?N.emptyScript:"",wt=class extends L{constructor(){super(...arguments),this.type=4}j(t){t&&t!==v?this.element.setAttribute(this.name,Ye):this.element.removeAttribute(this.name)}},Ct=class extends L{constructor(t,e,s,i,r){super(t,e,s,i,r),this.type=5}_$AI(t,e=this){var s;if((t=(s=H(this,t,e,0))!==null&&s!==void 0?s:v)===T)return;let i=this._$AH,r=t===v&&i!==v||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,o=t!==v&&(i===v||r);r&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,s;typeof this._$AH=="function"?this._$AH.call((s=(e=this.options)===null||e===void 0?void 0:e.host)!==null&&s!==void 0?s:this.element,t):this._$AH.handleEvent(t)}},Tt=class{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){H(this,t)}};var ne=Q.litHtmlPolyfillSupport;ne?.(B,et),((yt=Q.litHtmlVersions)!==null&&yt!==void 0?yt:Q.litHtmlVersions=[]).push("2.8.0");var st=window,nt=st.ShadowRoot&&(st.ShadyCSS===void 0||st.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,de=Symbol(),he=new WeakMap,it=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==de)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(nt&&t===void 0){let s=e!==void 0&&e.length===1;s&&(t=he.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&he.set(e,t))}return t}toString(){return this.cssText}},ue=n=>new it(typeof n=="string"?n:n+"",void 0,de);var xt=(n,t)=>{nt?n.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet):t.forEach(e=>{let s=document.createElement("style"),i=st.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=e.cssText,n.appendChild(s)})},ot=nt?n=>n:n=>n instanceof CSSStyleSheet?(t=>{let e="";for(let s of t.cssRules)e+=s.cssText;return ue(e)})(n):n;var kt,rt=window,pe=rt.trustedTypes,Je=pe?pe.emptyScript:"",me=rt.reactiveElementPolyfillSupport,Pt={toAttribute(n,t){switch(t){case Boolean:n=n?Je:null;break;case Object:case Array:n=n==null?n:JSON.stringify(n)}return n},fromAttribute(n,t){let e=n;switch(t){case Boolean:e=n!==null;break;case Number:e=n===null?null:Number(n);break;case Object:case Array:try{e=JSON.parse(n)}catch{e=null}}return e}},ve=(n,t)=>t!==n&&(t==t||n==n),Ut={attribute:!0,type:String,converter:Pt,reflect:!1,hasChanged:ve},Ot="finalized",y=class extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this._$Eu()}static addInitializer(t){var e;this.finalize(),((e=this.h)!==null&&e!==void 0?e:this.h=[]).push(t)}static get observedAttributes(){this.finalize();let t=[];return this.elementProperties.forEach((e,s)=>{let i=this._$Ep(s,e);i!==void 0&&(this._$Ev.set(i,s),t.push(i))}),t}static createProperty(t,e=Ut){if(e.state&&(e.attribute=!1),this.finalize(),this.elementProperties.set(t,e),!e.noAccessor&&!this.prototype.hasOwnProperty(t)){let s=typeof t=="symbol"?Symbol():"__"+t,i=this.getPropertyDescriptor(t,s,e);i!==void 0&&Object.defineProperty(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){return{get(){return this[e]},set(i){let r=this[t];this[e]=i,this.requestUpdate(t,r,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||Ut}static finalize(){if(this.hasOwnProperty(Ot))return!1;this[Ot]=!0;let t=Object.getPrototypeOf(this);if(t.finalize(),t.h!==void 0&&(this.h=[...t.h]),this.elementProperties=new Map(t.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){let e=this.properties,s=[...Object.getOwnPropertyNames(e),...Object.getOwnPropertySymbols(e)];for(let i of s)this.createProperty(i,e[i])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let s=new Set(t.flat(1/0).reverse());for(let i of s)e.unshift(ot(i))}else t!==void 0&&e.push(ot(t));return e}static _$Ep(t,e){let s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}_$Eu(){var t;this._$E_=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$Eg(),this.requestUpdate(),(t=this.constructor.h)===null||t===void 0||t.forEach(e=>e(this))}addController(t){var e,s;((e=this._$ES)!==null&&e!==void 0?e:this._$ES=[]).push(t),this.renderRoot!==void 0&&this.isConnected&&((s=t.hostConnected)===null||s===void 0||s.call(t))}removeController(t){var e;(e=this._$ES)===null||e===void 0||e.splice(this._$ES.indexOf(t)>>>0,1)}_$Eg(){this.constructor.elementProperties.forEach((t,e)=>{this.hasOwnProperty(e)&&(this._$Ei.set(e,this[e]),delete this[e])})}createRenderRoot(){var t;let e=(t=this.shadowRoot)!==null&&t!==void 0?t:this.attachShadow(this.constructor.shadowRootOptions);return xt(e,this.constructor.elementStyles),e}connectedCallback(){var t;this.renderRoot===void 0&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(t=this._$ES)===null||t===void 0||t.forEach(e=>{var s;return(s=e.hostConnected)===null||s===void 0?void 0:s.call(e)})}enableUpdating(t){}disconnectedCallback(){var t;(t=this._$ES)===null||t===void 0||t.forEach(e=>{var s;return(s=e.hostDisconnected)===null||s===void 0?void 0:s.call(e)})}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$EO(t,e,s=Ut){var i;let r=this.constructor._$Ep(t,s);if(r!==void 0&&s.reflect===!0){let o=(((i=s.converter)===null||i===void 0?void 0:i.toAttribute)!==void 0?s.converter:Pt).toAttribute(e,s.type);this._$El=t,o==null?this.removeAttribute(r):this.setAttribute(r,o),this._$El=null}}_$AK(t,e){var s;let i=this.constructor,r=i._$Ev.get(t);if(r!==void 0&&this._$El!==r){let o=i.getPropertyOptions(r),l=typeof o.converter=="function"?{fromAttribute:o.converter}:((s=o.converter)===null||s===void 0?void 0:s.fromAttribute)!==void 0?o.converter:Pt;this._$El=r,this[r]=l.fromAttribute(e,o.type),this._$El=null}}requestUpdate(t,e,s){let i=!0;t!==void 0&&(((s=s||this.constructor.getPropertyOptions(t)).hasChanged||ve)(this[t],e)?(this._$AL.has(t)||this._$AL.set(t,e),s.reflect===!0&&this._$El!==t&&(this._$EC===void 0&&(this._$EC=new Map),this._$EC.set(t,s))):i=!1),!this.isUpdatePending&&i&&(this._$E_=this._$Ej())}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach((i,r)=>this[r]=i),this._$Ei=void 0);let e=!1,s=this._$AL;try{e=this.shouldUpdate(s),e?(this.willUpdate(s),(t=this._$ES)===null||t===void 0||t.forEach(i=>{var r;return(r=i.hostUpdate)===null||r===void 0?void 0:r.call(i)}),this.update(s)):this._$Ek()}catch(i){throw e=!1,this._$Ek(),i}e&&this._$AE(s)}willUpdate(t){}_$AE(t){var e;(e=this._$ES)===null||e===void 0||e.forEach(s=>{var i;return(i=s.hostUpdated)===null||i===void 0?void 0:i.call(s)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(t){return!0}update(t){this._$EC!==void 0&&(this._$EC.forEach((e,s)=>this._$EO(s,this[s],e)),this._$EC=void 0),this._$Ek()}updated(t){}firstUpdated(t){}};y[Ot]=!0,y.elementProperties=new Map,y.elementStyles=[],y.shadowRootOptions={mode:"open"},me?.({ReactiveElement:y}),((kt=rt.reactiveElementVersions)!==null&&kt!==void 0?kt:rt.reactiveElementVersions=[]).push("1.6.3");var Nt,at=window,R=at.trustedTypes,fe=R?R.createPolicy("lit-html",{createHTML:n=>n}):void 0,Lt="$lit$",b=`lit$${(Math.random()+"").slice(9)}$`,Ee="?"+b,Ge=`<${Ee}>`,U=document,j=()=>U.createComment(""),z=n=>n===null||typeof n!="object"&&typeof n!="function",Se=Array.isArray,Ze=n=>Se(n)||typeof n?.[Symbol.iterator]=="function",Ht=`[ 	
\f\r]`,V=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ge=/-->/g,$e=/>/g,x=RegExp(`>|${Ht}(?:([^\\s"'>=/]+)(${Ht}*=${Ht}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),_e=/'/g,ye=/"/g,we=/^(?:script|style|textarea|title)$/i,Ce=n=>(t,...e)=>({_$litType$:n,strings:t,values:e}),f=Ce(1),ws=Ce(2),P=Symbol.for("lit-noChange"),p=Symbol.for("lit-nothing"),Ae=new WeakMap,k=U.createTreeWalker(U,129,null,!1);function Te(n,t){if(!Array.isArray(n)||!n.hasOwnProperty("raw"))throw Error("invalid template strings array");return fe!==void 0?fe.createHTML(t):t}var Xe=(n,t)=>{let e=n.length-1,s=[],i,r=t===2?"<svg>":"",o=V;for(let l=0;l<e;l++){let a=n[l],c,h,d=-1,u=0;for(;u<a.length&&(o.lastIndex=u,h=o.exec(a),h!==null);)u=o.lastIndex,o===V?h[1]==="!--"?o=ge:h[1]!==void 0?o=$e:h[2]!==void 0?(we.test(h[2])&&(i=RegExp("</"+h[2],"g")),o=x):h[3]!==void 0&&(o=x):o===x?h[0]===">"?(o=i??V,d=-1):h[1]===void 0?d=-2:(d=o.lastIndex-h[2].length,c=h[1],o=h[3]===void 0?x:h[3]==='"'?ye:_e):o===ye||o===_e?o=x:o===ge||o===$e?o=V:(o=x,i=void 0);let m=o===x&&n[l+1].startsWith("/>")?" ":"";r+=o===V?a+Ge:d>=0?(s.push(c),a.slice(0,d)+Lt+a.slice(d)+b+m):a+b+(d===-2?(s.push(void 0),l):m)}return[Te(n,r+(n[e]||"<?>")+(t===2?"</svg>":"")),s]},q=class n{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let r=0,o=0,l=t.length-1,a=this.parts,[c,h]=Xe(t,e);if(this.el=n.createElement(c,s),k.currentNode=this.el.content,e===2){let d=this.el.content,u=d.firstChild;u.remove(),d.append(...u.childNodes)}for(;(i=k.nextNode())!==null&&a.length<l;){if(i.nodeType===1){if(i.hasAttributes()){let d=[];for(let u of i.getAttributeNames())if(u.endsWith(Lt)||u.startsWith(b)){let m=h[o++];if(d.push(u),m!==void 0){let mt=i.getAttribute(m.toLowerCase()+Lt).split(b),_=/([.?@])?(.*)/.exec(m);a.push({type:1,index:r,name:_[2],strings:mt,ctor:_[1]==="."?Dt:_[1]==="?"?Mt:_[1]==="@"?Ft:M})}else a.push({type:6,index:r})}for(let u of d)i.removeAttribute(u)}if(we.test(i.tagName)){let d=i.textContent.split(b),u=d.length-1;if(u>0){i.textContent=R?R.emptyScript:"";for(let m=0;m<u;m++)i.append(d[m],j()),k.nextNode(),a.push({type:2,index:++r});i.append(d[u],j())}}}else if(i.nodeType===8)if(i.data===Ee)a.push({type:2,index:r});else{let d=-1;for(;(d=i.data.indexOf(b,d+1))!==-1;)a.push({type:7,index:r}),d+=b.length-1}r++}}static createElement(t,e){let s=U.createElement("template");return s.innerHTML=t,s}};function D(n,t,e=n,s){var i,r,o,l;if(t===P)return t;let a=s!==void 0?(i=e._$Co)===null||i===void 0?void 0:i[s]:e._$Cl,c=z(t)?void 0:t._$litDirective$;return a?.constructor!==c&&((r=a?._$AO)===null||r===void 0||r.call(a,!1),c===void 0?a=void 0:(a=new c(n),a._$AT(n,e,s)),s!==void 0?((o=(l=e)._$Co)!==null&&o!==void 0?o:l._$Co=[])[s]=a:e._$Cl=a),a!==void 0&&(t=D(n,a._$AS(n,t.values),a,s)),t}var Rt=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var e;let{el:{content:s},parts:i}=this._$AD,r=((e=t?.creationScope)!==null&&e!==void 0?e:U).importNode(s,!0);k.currentNode=r;let o=k.nextNode(),l=0,a=0,c=i[0];for(;c!==void 0;){if(l===c.index){let h;c.type===2?h=new W(o,o.nextSibling,this,t):c.type===1?h=new c.ctor(o,c.name,c.strings,this,t):c.type===6&&(h=new It(o,this,t)),this._$AV.push(h),c=i[++a]}l!==c?.index&&(o=k.nextNode(),l++)}return k.currentNode=U,r}v(t){let e=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}},W=class n{constructor(t,e,s,i){var r;this.type=2,this._$AH=p,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cp=(r=i?.isConnected)===null||r===void 0||r}get _$AU(){var t,e;return(e=(t=this._$AM)===null||t===void 0?void 0:t._$AU)!==null&&e!==void 0?e:this._$Cp}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=D(this,t,e),z(t)?t===p||t==null||t===""?(this._$AH!==p&&this._$AR(),this._$AH=p):t!==this._$AH&&t!==P&&this._(t):t._$litType$!==void 0?this.g(t):t.nodeType!==void 0?this.$(t):Ze(t)?this.T(t):this._(t)}k(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}$(t){this._$AH!==t&&(this._$AR(),this._$AH=this.k(t))}_(t){this._$AH!==p&&z(this._$AH)?this._$AA.nextSibling.data=t:this.$(U.createTextNode(t)),this._$AH=t}g(t){var e;let{values:s,_$litType$:i}=t,r=typeof i=="number"?this._$AC(t):(i.el===void 0&&(i.el=q.createElement(Te(i.h,i.h[0]),this.options)),i);if(((e=this._$AH)===null||e===void 0?void 0:e._$AD)===r)this._$AH.v(s);else{let o=new Rt(r,this),l=o.u(this.options);o.v(s),this.$(l),this._$AH=o}}_$AC(t){let e=Ae.get(t.strings);return e===void 0&&Ae.set(t.strings,e=new q(t)),e}T(t){Se(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,s,i=0;for(let r of t)i===e.length?e.push(s=new n(this.k(j()),this.k(j()),this,this.options)):s=e[i],s._$AI(r),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){var s;for((s=this._$AP)===null||s===void 0||s.call(this,!1,!0,e);t&&t!==this._$AB;){let i=t.nextSibling;t.remove(),t=i}}setConnected(t){var e;this._$AM===void 0&&(this._$Cp=t,(e=this._$AP)===null||e===void 0||e.call(this,t))}},M=class{constructor(t,e,s,i,r){this.type=1,this._$AH=p,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=r,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=p}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,e=this,s,i){let r=this.strings,o=!1;if(r===void 0)t=D(this,t,e,0),o=!z(t)||t!==this._$AH&&t!==P,o&&(this._$AH=t);else{let l=t,a,c;for(t=r[0],a=0;a<r.length-1;a++)c=D(this,l[s+a],e,a),c===P&&(c=this._$AH[a]),o||(o=!z(c)||c!==this._$AH[a]),c===p?t=p:t!==p&&(t+=(c??"")+r[a+1]),this._$AH[a]=c}o&&!i&&this.j(t)}j(t){t===p?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},Dt=class extends M{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===p?void 0:t}},Qe=R?R.emptyScript:"",Mt=class extends M{constructor(){super(...arguments),this.type=4}j(t){t&&t!==p?this.element.setAttribute(this.name,Qe):this.element.removeAttribute(this.name)}},Ft=class extends M{constructor(t,e,s,i,r){super(t,e,s,i,r),this.type=5}_$AI(t,e=this){var s;if((t=(s=D(this,t,e,0))!==null&&s!==void 0?s:p)===P)return;let i=this._$AH,r=t===p&&i!==p||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,o=t!==p&&(i===p||r);r&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,s;typeof this._$AH=="function"?this._$AH.call((s=(e=this.options)===null||e===void 0?void 0:e.host)!==null&&s!==void 0?s:this.element,t):this._$AH.handleEvent(t)}},It=class{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){D(this,t)}};var be=at.litHtmlPolyfillSupport;be?.(q,W),((Nt=at.litHtmlVersions)!==null&&Nt!==void 0?Nt:at.litHtmlVersions=[]).push("2.8.0");var xe=(n,t,e)=>{var s,i;let r=(s=e?.renderBefore)!==null&&s!==void 0?s:t,o=r._$litPart$;if(o===void 0){let l=(i=e?.renderBefore)!==null&&i!==void 0?i:null;r._$litPart$=o=new W(t.insertBefore(j(),l),l,void 0,e??{})}return o._$AI(n),o};var Bt,Vt;var g=class extends y{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t,e;let s=super.createRenderRoot();return(t=(e=this.renderOptions).renderBefore)!==null&&t!==void 0||(e.renderBefore=s.firstChild),s}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=xe(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),(t=this._$Do)===null||t===void 0||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),(t=this._$Do)===null||t===void 0||t.setConnected(!1)}render(){return P}};g.finalized=!0,g._$litElement$=!0,(Bt=globalThis.litElementHydrateSupport)===null||Bt===void 0||Bt.call(globalThis,{LitElement:g});var ke=globalThis.litElementPolyfillSupport;ke?.({LitElement:g});((Vt=globalThis.litElementVersions)!==null&&Vt!==void 0?Vt:globalThis.litElementVersions=[]).push("3.3.3");var Ue="submit";var Pe="hashchange";function ts(n=window.location.hash){let t=[],e=n.replace(/^#/,"").split("&");for(let s of e){let[i,r=""]=s.split("=");i&&t.push([i,decodeURIComponent(r.replace(/\+/g," "))])}return Object.fromEntries(t)}function jt(n){let t=new URLSearchParams(window.location.hash.slice(1));Object.entries(n).forEach(([i,r])=>{r?t.set(i,r):t.delete(i)}),t.sort();let e=t.toString();if(e===window.location.hash)return;let s=window.scrollY||document.documentElement.scrollTop;window.location.hash=e,window.scrollTo(0,s)}function Oe(n){let t=()=>{if(window.location.hash&&!window.location.hash.includes("="))return;let e=ts(window.location.hash);n(e)};return t(),window.addEventListener(Pe,t),()=>{window.removeEventListener(Pe,t)}}var Ne={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},He=n=>(...t)=>({_$litDirective$:n,values:t}),lt=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,s){this._$Ct=t,this._$AM=e,this._$Ci=s}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};var K=class extends lt{constructor(t){if(super(t),this.et=v,t.type!==Ne.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===v||t==null)return this.ft=void 0,this.et=t;if(t===T)return t;if(typeof t!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.et)return this.ft;this.et=t;let e=[t];return e.raw=e,this.ft={_$litType$:this.constructor.resultType,strings:e,values:[]}}};K.directiveName="unsafeHTML",K.resultType=1;var ct=He(K);var es="/conf/mas/settings/dam/cfm/models/card",ht=class extends g{createRenderRoot(){return this}render(){if(this.fragment.model.path!==es)return p;let t=Object.fromEntries(this.fragment.fields.map(e=>[e.name,e]));return f` <p>${this.fragment.path}</p>
            <sp-field-label for="card-variant">Variant</sp-field-label>
            <variant-picker
                id="card-variant"
                data-field="variant"
                value="${t.variant.values[0]}"
                @selectionchange="${this.updateFragment}"
            ></variant-picker>
            <sp-field-label for="card-title">Title</sp-field-label>
            <sp-textfield
                placeholder="Enter card title"
                id="card-title"
                data-field="cardTitle"
                value="${t.cardTitle.values[0]}"
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
                    >${ct(t.prices.values[0])}</rte-editor
                >
            </sp-field-group>
            <sp-field-label for="horizontal"> Description </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-editor
                    data-field="description"
                    @blur="${this.updateFragment}"
                    >${ct(t.description.values[0])}</rte-editor
                >
            </sp-field-group>
            <sp-field-label for="horizontal"> Footer </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-editor data-field="ctas" @blur="${this.updateFragment}"
                    >${ct(t.ctas.values[0])}</rte-editor
                >
            </sp-field-group>`}updateFragment(t){this.dispatchEvent(new CustomEvent("update-fragment",{detail:t}))}};$(ht,"properties",{fragment:{type:Object}});customElements.define("merch-card-editor",ht);var ss=[{label:"All",value:"all",surface:"all"},{label:"Catalog",value:"catalog",surface:"acom"},{label:"CCD Action",value:"ccd-action",surface:"ccd"},{label:"Slice",value:"ccd-slice",surface:"ccd"},{label:"Special offers",value:"special-offers",surface:"acom"}],dt=class extends g{constructor(){super(...arguments);$(this,"renderVariants",()=>ss.map(e=>f`<sp-menu-item value="${e.value}"
                    >${e.label}</sp-menu-item
                >`));$(this,"handler",()=>{this.dispatchEvent(new CustomEvent("selectionchange"))})}get value(){return this.querySelector("sp-picker")?.value}createRenderRoot(){return this}render(){return f`<sp-picker
            label="Card Variant"
            size="m"
            value=${this.value||this.initvalue}
            @change="${this.handler}"
        >
            ${this.renderVariants()}
        </sp-picker>`}};$(dt,"properties",{initvalue:{type:String}});customElements.define("variant-picker",dt);var zt="[data-wcs-osi]",qt=class extends HTMLElement{constructor(){super(...arguments);$(this,"editor",null);$(this,"savedBookmark",null)}connectedCallback(){this.addEventListener("editor-action-click",this.handleEditorActionClick),window.tinymce.init({target:this,toolbar:"bold italic underline | link openlink unlink | ost",plugins:"link",license_key:"gpl",promotion:!1,branding:!1,extended_valid_elements:"a[is|href|class],span[is|class]",content_style:".price-strikethrough { text-decoration: line-through;}",setup:e=>{this.editor=e,e.on("blur",async s=>{this.savedBookmark=e.selection.getBookmark(2),[...e.contentDocument.querySelectorAll("p")].forEach(l=>{l.innerText.trim()===""&&l.remove()}),[...e.contentDocument.querySelectorAll("a")].forEach(l=>{Object.keys(l.dataset).forEach(a=>{/mce/.test(a)&&delete l.dataset[a]})});let i=[...e.contentDocument.querySelectorAll(zt)];console.log("elements",i),i.forEach(l=>{l.dataset.wcsOsi&&(l.tagName==="A"?l.setAttribute("is","checkout-link"):l.tagName==="SPAN"&&l.setAttribute("is","inline-price"))}),e.contentDocument.body.innerHTML=`${e.contentDocument.body.innerHTML}`,i=[...e.contentDocument.querySelectorAll(zt)],i.forEach(l=>{l.isInlinePrice&&(l.innerHTML=""),l.isCheckoutLink&&l.setAttribute("href",""),l.removeAttribute("class"),l.removeAttribute("contenteditable")}),is(e.contentDocument.body);let r=e.contentDocument.body.innerHTML;i.forEach(l=>{l.setAttribute("contenteditable","false"),l.render?.()});let o=new CustomEvent("blur",{bubbles:!0,composed:!0,detail:{value:r}});this.dispatchEvent(o)}),e.on("init",s=>{let i=document.querySelector('script[src$="mas.js"]')?.src??document.getElementById("mas-src").content;if(!i)return;let r=e.contentDocument.createElement("script");r.src=i,r.setAttribute("type","module"),e.contentDocument.head.appendChild(r);let o=e.contentDocument.createElement("script");o.innerHTML="window.process = { env: {} };",e.contentDocument.head.appendChild(o)}),e.on("SetContent",s=>{[...e.contentDocument.querySelectorAll("a[is],span[is]")].forEach(i=>{i.setAttribute("contenteditable","false")})}),e.ui.registry.addIcon("star-icon",`<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18">
  <title>Star</title>
  <rect id="ToDelete" fill="#ff13dc" opacity="0" width="18" height="18" /><path d="M9.24132.3l2.161,5.715,6.106.289a.255.255,0,0,1,.147.454l-4.77,3.823,1.612,5.9a.255.255,0,0,1-.386.28L9.00232,13.4l-5.11,3.358a.255.255,0,0,1-.386-.28l1.612-5.9-4.77-3.821a.255.255,0,0,1,.147-.457l6.107-.285L8.76332.3a.255.255,0,0,1,.478,0Z" />
</svg>`),e.ui.registry.addButton("ost",{icon:"star-icon",tooltip:"Open Offer Selector Tool",onAction:()=>{let s=new CustomEvent("ost-open",{bubbles:!0,composed:!0});this.dispatchEvent(s)}}),e.on("dblclick",s=>{s.preventDefault(),s.stopImmediatePropagation();let i=s.target.closest(zt);if(i){let r=new CustomEvent("ost-open",{bubbles:!0,composed:!0,detail:{clickedElement:i}});this.dispatchEvent(r)}})}})}disconnectedCallback(){this.removeEventListener("editor-action-click",this.handleEditorActionClick)}appendContent(e,s){s&&s.remove(),this.editor&&(this.savedBookmark&&(this.editor.focus(),this.editor.selection.moveToBookmark(this.savedBookmark)),this.editor.insertContent(e))}};function is(n){let t=document.createTreeWalker(n,NodeFilter.SHOW_COMMENT,null,!1),e=[],s;for(;s=t.nextNode();)e.push(s);e.forEach(i=>i.parentNode.removeChild(i))}customElements.define("rte-editor",qt);var ut,Re,De,O,Me={"buy-now":"Buy now","free-trial":"Free trial","start-free-trial":"Start free trial","get-started":"Get started","choose-a-plan":"Choose a plan","learn-more":"Learn more","change-plan-team-plans":"Change Plan Team Plans",upgrade:"Upgrade","change-plan-team-payment":"Change Plan Team Payment","take-the-quiz":"Take the quiz","see-more":"See more","upgrade-now":"Upgrade now"},ns=["ccd-action","ah"],Le={aosApiKey:"wcms-commerce-ims-user-prod",checkoutClientId:"creative",country:"US",environment:"PROD",landscape:"PUBLISHED",language:"en",searchParameters:{},searchOfferSelectorId:null,defaultPlaceholderOptions:{displayRecurrence:!0,displayPerUnit:!0,displayTax:!1,displayOldPrice:!1,forceTaxExclusive:!0},wcsApiKey:"wcms-commerce-ims-ro-user-cc",ctaTextOption:{ctaTexts:Object.entries(Me).map(([n,t])=>({id:n,name:t})),getDefaultText(){return this.ctaTexts[0].id},getTexts(){return this.ctaTexts},getSelectedText(n){let t=n.get("text");return t&&this.ctaTexts.find(e=>e.id===t)?t:this.getDefaultText()}}},os=(n,t,e,s,i)=>{if(!!t?.startsWith("checkout")){let o=document.createElement("a",{is:"checkout-link"});o.setAttribute("data-checkout-workflow",s.workflow),o.setAttribute("data-checkout-workflow-step",s.workflowStep??"segmentation"),o.setAttribute("data-promotion-code",i??""),o.setAttribute("data-quantity","1"),o.setAttribute("data-wcs-osi",n),o.href="#";let l=document.createElement("span"),a=s.ctaText??"buy-now";return ns.includes(De)&&(a=Me[a]),l.textContent=a,o.appendChild(l),o}else{let o=document.createElement("span",{is:"inline-price"});return o.setAttribute("data-display-per-unit",s.displayPerUnit??"false"),o.setAttribute("data-quantity",e.ordering.max_quantity??"1"),o.setAttribute("data-template",t),o.setAttribute("data-wcs-osi",n),o.innerHTML="&nbsp;",o}};function rs(n,t,e,s,i){let r=os(n,t,e,s,i);console.log(`Use Link: ${r.outerHTML}`),O?O.outerHTML=r.outerHTML:Re.appendContent(r.outerHTML),ls()}var Fe=()=>document.getElementById("ostDialog"),as=()=>{Fe().open=!0},ls=()=>{Fe().open=!1};function Ie(){return f`
        <sp-overlay id="ostDialog" type="modal">
            <sp-dialog-wrapper dismissable underlay>
                <div id="ost"></div>
            </sp-dialog-wrapper>
        </overlay-trigger>
    `}function Be(n,t,e){Re=t,De=e,O=n.detail?.clickedElement;let s;if(!ut||O){ut=document.getElementById("ost");let i=localStorage.getItem("masAccessToken")??window.adobeid.authorize(),r=new URLSearchParams,o={...Le.defaultPlaceholderOptions};O&&(s=O.getAttribute("data-wcs-osi"),Object.assign(o,O.dataset)),window.ost.openOfferSelectorTool({...Le,rootElement:ut,zIndex:20,aosAccessToken:i,searchParameters:r,searchOfferSelectorId:s,defaultPlaceholderOptions:o,onSelect:rs})}ut&&as()}var cs="load-start",hs="load-end",pt=class extends g{constructor(){super(),this.newFragment=null,this.root="/content/dam/mas",this.variant="all",this.searchText="",this.path=""}connectedCallback(){super.connectedCallback(),this.registerListeners(),this.startDeeplink()}registerListeners(){this.addEventListener(cs,()=>{this.requestUpdate(),this.updateDeeplink()}),this.addEventListener(hs,()=>this.requestUpdate()),document.addEventListener("keydown",t=>{t.key==="Escape"&&(this.closeFragmentEditor(),this.source.clearSelection(),this.contentNavigation.toggleSelectionMode(!1),document.activeElement.blur())}),this.addEventListener("select-fragment",t=>this.handleOpenFragment(t))}disconnectedCallback(){super.disconnectedCallback(),this.deeplinkDisposer&&this.deeplinkDisposer()}updateDeeplink(){let t={...this.source?.search};t.path===this.root&&(t.path=""),jt(t)}updated(t){(t.has("searchText")||t.has("path")||t.has("variant"))&&this.source?.sendSearch()}get search(){return this.querySelector("sp-search")}get picker(){return this.querySelector("sp-picker")}get source(){return this.querySelector("aem-fragments")}get contentNavigation(){return this.querySelector("content-navigation")}get fragment(){return this.source?.fragment}createRenderRoot(){return this}get selectFragmentDialog(){return f`
            ${this.newFragment?f`<sp-overlay type="modal" open>
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
                  </sp-overlay>`:p}
        `}get fragmentEditorToolbar(){return f`<div id="actions" slot="heading">
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
        </div>`}get fragmentEditor(){return f`<sp-overlay type="manual" ?open=${this.source?.fragment}>
            <sp-popover id="editor">
                <sp-dialog no-divider>
                    ${this.source?.fragment?f`
                              <merch-card-editor
                                  .fragment=${this.source?.fragment}
                                  @ost-open="${this.openOfferSelectorTool}"
                                  @update-fragment="${this.updateFragment}"
                              >
                              </merch-card-editor>
                              ${this.fragmentEditorToolbar}
                          `:p}
                </sp-dialog>
            </sp-popover>
        </sp-overlay>`}get content(){return f`
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
        `}customRenderItem(t){return t?f` <sp-table-cell>${t.variant}</sp-table-cell>`:f`<sp-table-cell></sp-table-cell>`}render(){return f`
            <h1>Merch at Scale Studio</h1>
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
                    value="${this.variant}"
                    @selectionchange="${this.handleVariantChange}"
                ></variant-picker>
                <sp-button @click=${this.doSearch}>Search</sp-button>
            </div>
            ${this.content} ${this.fragmentEditor} ${this.selectFragmentDialog}
            ${this.toast} ${this.loadingIndicator} ${Ie()}
        `}get toast(){return f`<sp-toast timeout="6000" popover></sp-toast>`}get loadingIndicator(){return this.source?.loading?f`<sp-progress-circle
            indeterminate
            size="l"
        ></sp-progress-circle>`:p}get toastEl(){return this.querySelector("sp-toast")}startDeeplink(){this.deeplinkDisposer=Oe(({query:t,path:e})=>{this.searchText=t??"",this.path=e??""})}showToast(t,e="info"){let s=this.toastEl;s&&(s.textContent=t,s.variant=e,s.open=!0,s.showPopover())}async editFragment(t,e=!1){if(t&&t===this.fragment){this.requestUpdate();return}this.fragment?.hasChanges&&!e?this.newFragment=t:(this.newFragment=null,this.source?.setFragment(t)),this.requestUpdate()}async saveAndEditFragment(t){await this.saveFragment(),await this.editFragment(t,!0)}async adjustEditorPosition(t,e){await this.updateComplete;let s=window.innerWidth/2,i=t>s?"1em":"inherit",r=t<=s?"1em":"inherit";this.style.setProperty("--editor--left",i),this.style.setProperty("--editor--right",r);let o=window.innerHeight/2,l=e>o?"1em":"inherit",a=e<=o?"1em":"inherit";this.style.setProperty("--editor--top",l),this.style.setProperty("--editor--bottom",a)}async handleOpenFragment(t){let{x:e,y:s,fragment:i}=t.detail;await this.adjustEditorPosition(e,s),await this.editFragment(i)}updateFragment({detail:t}){let e=t.target.dataset.field,s=t.target.value||t.detail?.value;s=t.target.multiline?s?.split(","):[s??""],this.fragment.updateField(e,s)&&this.querySelector(`merch-datasource[path="${this.fragment.path}"]`)?.refresh(!1)}async saveFragment(){this.showToast("Saving fragment...");try{await this.source?.saveFragment(),this.showToast("Fragment saved","positive")}catch{this.showToast("Fragment could not be saved","negative")}}async discardChanges(){await this.source?.discardChanges(),this.showToast("Changes discarded","info")}async copyFragment(){this.showToast("Cloning fragment...");try{await this.source?.copyFragment(),this.showToast("Fragment cloned","positive")}catch{this.showToast("Fragment could not be cloned","negative")}}async closeFragmentEditor(){await this.source?.setFragment(null),this.requestUpdate()}closeConfirmSelect(){this.newFragment=null}handleSearch(t){this.searchText=this.search.value,this.searchText||jt({query:void 0,path:void 0}),t.type===Ue&&(t.preventDefault(),this.source?.searchFragments())}handleVariantChange(t){this.variant=t.target.value}doSearch(){this.source?.searchFragments()}openFragmentInOdin(){window.open(`https://experience.adobe.com/?repo=${this.bucket}.adobeaemcloud.com#/@odin02/aem/cf/admin/?appId=aem-cf-admin&q=${this.fragment?.fragmentName}`,"_blank")}async publishFragment(){this.showToast("Publishing fragment...");try{await this.source?.publishFragment(),this.showToast("Fragment published","positive")}catch{this.showToast("Fragment could not be published","negative")}}async unpublishFragment(){this.showToast("Unpublishing fragment...");try{await this.source?.unpublishFragment(),this.showToast("Fragment unpublished","positive")}catch{this.showToast("Fragment could not be unpublished","negative")}}async deleteFragment(){if(confirm("Are you sure you want to delete this fragment?"))try{await this.source?.deleteFragment(),this.showToast("Fragment deleted","positive")}catch{this.showToast("Fragment could not be deleted","negative")}}async copyToUse(){let t=`<merch-card><merch-datasource path="${this.fragment?.path}"></merch-datasource></merch-card>`;try{await navigator.clipboard.writeText(t),this.showToast("Code copied to clipboard","positive")}catch{this.showToast("Failed to copy code to clipboard","negative")}}openOfferSelectorTool(t){Be(t,t.target,this.fragment?.variant)}};$(pt,"properties",{bucket:{type:String,attribute:"aem-bucket"},searchText:{type:String,state:!0},baseUrl:{type:String,attribute:"base-url"},root:{type:String,state:!0},path:{type:String,state:!0},variant:{type:String,state:!0},newFragment:{type:Object,state:!0}});customElements.define("mas-studio",pt);
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
