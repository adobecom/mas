var he=Object.defineProperty;var Ot=i=>{throw TypeError(i)};var ce=(i,t,e)=>t in i?he(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var y=(i,t,e)=>ce(i,typeof t!="symbol"?t+"":t,e),Mt=(i,t,e)=>t.has(i)||Ot("Cannot "+e);var p=(i,t,e)=>(Mt(i,t,"read from private field"),e?e.call(i):t.get(i)),_=(i,t,e)=>t.has(i)?Ot("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(i):t.set(i,e),b=(i,t,e,s)=>(Mt(i,t,"write to private field"),s?s.call(i,e):t.set(i,e),e);var nt=globalThis,ot=nt.ShadowRoot&&(nt.ShadyCSS===void 0||nt.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Et=Symbol(),Dt=new WeakMap,W=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==Et)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(ot&&t===void 0){let s=e!==void 0&&e.length===1;s&&(t=Dt.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&Dt.set(e,t))}return t}toString(){return this.cssText}},Lt=i=>new W(typeof i=="string"?i:i+"",void 0,Et),G=(i,...t)=>{let e=i.length===1?i[0]:t.reduce((s,r,n)=>s+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+i[n+1],i[0]);return new W(e,i,Et)},_t=(i,t)=>{if(ot)i.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let s=document.createElement("style"),r=nt.litNonce;r!==void 0&&s.setAttribute("nonce",r),s.textContent=e.cssText,i.appendChild(s)}},at=ot?i=>i:i=>i instanceof CSSStyleSheet?(t=>{let e="";for(let s of t.cssRules)e+=s.cssText;return Lt(e)})(i):i;var{is:de,defineProperty:pe,getOwnPropertyDescriptor:ue,getOwnPropertyNames:me,getOwnPropertySymbols:fe,getPrototypeOf:ge}=Object,P=globalThis,It=P.trustedTypes,$e=It?It.emptyScript:"",be=P.reactiveElementPolyfillSupport,J=(i,t)=>i,wt={toAttribute(i,t){switch(t){case Boolean:i=i?$e:null;break;case Object:case Array:i=i==null?i:JSON.stringify(i)}return i},fromAttribute(i,t){let e=i;switch(t){case Boolean:e=i!==null;break;case Number:e=i===null?null:Number(i);break;case Object:case Array:try{e=JSON.parse(i)}catch{e=null}}return e}},Bt=(i,t)=>!de(i,t),Ht={attribute:!0,type:String,converter:wt,reflect:!1,hasChanged:Bt};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),P.litPropertyMetadata??(P.litPropertyMetadata=new WeakMap);var x=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??(this.l=[])).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=Ht){if(e.state&&(e.attribute=!1),this._$Ei(),this.elementProperties.set(t,e),!e.noAccessor){let s=Symbol(),r=this.getPropertyDescriptor(t,s,e);r!==void 0&&pe(this.prototype,t,r)}}static getPropertyDescriptor(t,e,s){let{get:r,set:n}=ue(this.prototype,t)??{get(){return this[e]},set(o){this[e]=o}};return{get(){return r?.call(this)},set(o){let h=r?.call(this);n.call(this,o),this.requestUpdate(t,h,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Ht}static _$Ei(){if(this.hasOwnProperty(J("elementProperties")))return;let t=ge(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(J("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(J("properties"))){let e=this.properties,s=[...me(e),...fe(e)];for(let r of s)this.createProperty(r,e[r])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[s,r]of e)this.elementProperties.set(s,r)}this._$Eh=new Map;for(let[e,s]of this.elementProperties){let r=this._$Eu(e,s);r!==void 0&&this._$Eh.set(r,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let s=new Set(t.flat(1/0).reverse());for(let r of s)e.unshift(at(r))}else t!==void 0&&e.push(at(t));return e}static _$Eu(t,e){let s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??(this._$EO=new Set)).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return _t(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$EC(t,e){let s=this.constructor.elementProperties.get(t),r=this.constructor._$Eu(t,s);if(r!==void 0&&s.reflect===!0){let n=(s.converter?.toAttribute!==void 0?s.converter:wt).toAttribute(e,s.type);this._$Em=t,n==null?this.removeAttribute(r):this.setAttribute(r,n),this._$Em=null}}_$AK(t,e){let s=this.constructor,r=s._$Eh.get(t);if(r!==void 0&&this._$Em!==r){let n=s.getPropertyOptions(r),o=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:wt;this._$Em=r,this[r]=o.fromAttribute(e,n.type),this._$Em=null}}requestUpdate(t,e,s){if(t!==void 0){if(s??(s=this.constructor.getPropertyOptions(t)),!(s.hasChanged??Bt)(this[t],e))return;this.P(t,e,s)}this.isUpdatePending===!1&&(this._$ES=this._$ET())}P(t,e,s){this._$AL.has(t)||this._$AL.set(t,e),s.reflect===!0&&this._$Em!==t&&(this._$Ej??(this._$Ej=new Set)).add(t)}async _$ET(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(let[r,n]of this._$Ep)this[r]=n;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[r,n]of s)n.wrapped!==!0||this._$AL.has(r)||this[r]===void 0||this.P(r,this[r],n)}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(e)):this._$EU()}catch(s){throw t=!1,this._$EU(),s}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EU(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Ej&&(this._$Ej=this._$Ej.forEach(e=>this._$EC(e,this[e]))),this._$EU()}updated(t){}firstUpdated(t){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[J("elementProperties")]=new Map,x[J("finalized")]=new Map,be?.({ReactiveElement:x}),(P.reactiveElementVersions??(P.reactiveElementVersions=[])).push("2.0.4");var Y=globalThis,lt=Y.trustedTypes,Vt=lt?lt.createPolicy("lit-html",{createHTML:i=>i}):void 0,At="$lit$",U=`lit$${Math.random().toFixed(9).slice(2)}$`,St="?"+U,ye=`<${St}>`,M=document,Q=()=>M.createComment(""),X=i=>i===null||typeof i!="object"&&typeof i!="function",Ct=Array.isArray,Jt=i=>Ct(i)||typeof i?.[Symbol.iterator]=="function",vt=`[ 	
\f\r]`,K=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,jt=/-->/g,zt=/>/g,N=RegExp(`>|${vt}(?:([^\\s"'>=/]+)(${vt}*=${vt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),qt=/'/g,Wt=/"/g,Kt=/^(?:script|style|textarea|title)$/i,Tt=i=>(t,...e)=>({_$litType$:i,strings:t,values:e}),$=Tt(1),ke=Tt(2),Ne=Tt(3),A=Symbol.for("lit-noChange"),u=Symbol.for("lit-nothing"),Gt=new WeakMap,O=M.createTreeWalker(M,129);function Yt(i,t){if(!Ct(i)||!i.hasOwnProperty("raw"))throw Error("invalid template strings array");return Vt!==void 0?Vt.createHTML(t):t}var Qt=(i,t)=>{let e=i.length-1,s=[],r,n=t===2?"<svg>":t===3?"<math>":"",o=K;for(let h=0;h<e;h++){let a=i[h],c,m,l=-1,f=0;for(;f<a.length&&(o.lastIndex=f,m=o.exec(a),m!==null);)f=o.lastIndex,o===K?m[1]==="!--"?o=jt:m[1]!==void 0?o=zt:m[2]!==void 0?(Kt.test(m[2])&&(r=RegExp("</"+m[2],"g")),o=N):m[3]!==void 0&&(o=N):o===N?m[0]===">"?(o=r??K,l=-1):m[1]===void 0?l=-2:(l=o.lastIndex-m[2].length,c=m[1],o=m[3]===void 0?N:m[3]==='"'?Wt:qt):o===Wt||o===qt?o=N:o===jt||o===zt?o=K:(o=N,r=void 0);let d=o===N&&i[h+1].startsWith("/>")?" ":"";n+=o===K?a+ye:l>=0?(s.push(c),a.slice(0,l)+At+a.slice(l)+U+d):a+U+(l===-2?h:d)}return[Yt(i,n+(i[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]},Z=class i{constructor({strings:t,_$litType$:e},s){let r;this.parts=[];let n=0,o=0,h=t.length-1,a=this.parts,[c,m]=Qt(t,e);if(this.el=i.createElement(c,s),O.currentNode=this.el.content,e===2||e===3){let l=this.el.content.firstChild;l.replaceWith(...l.childNodes)}for(;(r=O.nextNode())!==null&&a.length<h;){if(r.nodeType===1){if(r.hasAttributes())for(let l of r.getAttributeNames())if(l.endsWith(At)){let f=m[o++],d=r.getAttribute(l).split(U),g=/([.?@])?(.*)/.exec(f);a.push({type:1,index:n,name:g[2],strings:d,ctor:g[1]==="."?ct:g[1]==="?"?dt:g[1]==="@"?pt:L}),r.removeAttribute(l)}else l.startsWith(U)&&(a.push({type:6,index:n}),r.removeAttribute(l));if(Kt.test(r.tagName)){let l=r.textContent.split(U),f=l.length-1;if(f>0){r.textContent=lt?lt.emptyScript:"";for(let d=0;d<f;d++)r.append(l[d],Q()),O.nextNode(),a.push({type:2,index:++n});r.append(l[f],Q())}}}else if(r.nodeType===8)if(r.data===St)a.push({type:2,index:n});else{let l=-1;for(;(l=r.data.indexOf(U,l+1))!==-1;)a.push({type:7,index:n}),l+=U.length-1}n++}}static createElement(t,e){let s=M.createElement("template");return s.innerHTML=t,s}};function D(i,t,e=i,s){if(t===A)return t;let r=s!==void 0?e.o?.[s]:e.l,n=X(t)?void 0:t._$litDirective$;return r?.constructor!==n&&(r?._$AO?.(!1),n===void 0?r=void 0:(r=new n(i),r._$AT(i,e,s)),s!==void 0?(e.o??(e.o=[]))[s]=r:e.l=r),r!==void 0&&(t=D(i,r._$AS(i,t.values),r,s)),t}var ht=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:s}=this._$AD,r=(t?.creationScope??M).importNode(e,!0);O.currentNode=r;let n=O.nextNode(),o=0,h=0,a=s[0];for(;a!==void 0;){if(o===a.index){let c;a.type===2?c=new H(n,n.nextSibling,this,t):a.type===1?c=new a.ctor(n,a.name,a.strings,this,t):a.type===6&&(c=new ut(n,this,t)),this._$AV.push(c),a=s[++h]}o!==a?.index&&(n=O.nextNode(),o++)}return O.currentNode=M,r}p(t){let e=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}},H=class i{get _$AU(){return this._$AM?._$AU??this.v}constructor(t,e,s,r){this.type=2,this._$AH=u,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=r,this.v=r?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=D(this,t,e),X(t)?t===u||t==null||t===""?(this._$AH!==u&&this._$AR(),this._$AH=u):t!==this._$AH&&t!==A&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Jt(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==u&&X(this._$AH)?this._$AA.nextSibling.data=t:this.T(M.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:s}=t,r=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=Z.createElement(Yt(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===r)this._$AH.p(e);else{let n=new ht(r,this),o=n.u(this.options);n.p(e),this.T(o),this._$AH=n}}_$AC(t){let e=Gt.get(t.strings);return e===void 0&&Gt.set(t.strings,e=new Z(t)),e}k(t){Ct(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,s,r=0;for(let n of t)r===e.length?e.push(s=new i(this.O(Q()),this.O(Q()),this,this.options)):s=e[r],s._$AI(n),r++;r<e.length&&(this._$AR(s&&s._$AB.nextSibling,r),e.length=r)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t&&t!==this._$AB;){let s=t.nextSibling;t.remove(),t=s}}setConnected(t){this._$AM===void 0&&(this.v=t,this._$AP?.(t))}},L=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,r,n){this.type=1,this._$AH=u,this._$AN=void 0,this.element=t,this.name=e,this._$AM=r,this.options=n,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=u}_$AI(t,e=this,s,r){let n=this.strings,o=!1;if(n===void 0)t=D(this,t,e,0),o=!X(t)||t!==this._$AH&&t!==A,o&&(this._$AH=t);else{let h=t,a,c;for(t=n[0],a=0;a<n.length-1;a++)c=D(this,h[s+a],e,a),c===A&&(c=this._$AH[a]),o||(o=!X(c)||c!==this._$AH[a]),c===u?t=u:t!==u&&(t+=(c??"")+n[a+1]),this._$AH[a]=c}o&&!r&&this.j(t)}j(t){t===u?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},ct=class extends L{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===u?void 0:t}},dt=class extends L{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==u)}},pt=class extends L{constructor(t,e,s,r,n){super(t,e,s,r,n),this.type=5}_$AI(t,e=this){if((t=D(this,t,e,0)??u)===A)return;let s=this._$AH,r=t===u&&s!==u||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,n=t!==u&&(s===u||r);r&&this.element.removeEventListener(this.name,this,s),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},ut=class{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){D(this,t)}},Xt={M:At,P:U,A:St,C:1,L:Qt,R:ht,D:Jt,V:D,I:H,H:L,N:dt,U:pt,B:ct,F:ut},Ee=Y.litHtmlPolyfillSupport;Ee?.(Z,H),(Y.litHtmlVersions??(Y.litHtmlVersions=[])).push("3.2.0");var Zt=(i,t,e)=>{let s=e?.renderBefore??t,r=s._$litPart$;if(r===void 0){let n=e?.renderBefore??null;s._$litPart$=r=new H(t.insertBefore(Q(),n),n,void 0,e??{})}return r._$AI(i),r};var E=class extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var e;let t=super.createRenderRoot();return(e=this.renderOptions).renderBefore??(e.renderBefore=t.firstChild),t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Zt(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return A}};E._$litElement$=!0,E.finalized=!0,globalThis.litElementHydrateSupport?.({LitElement:E});var _e=globalThis.litElementPolyfillSupport;_e?.({LitElement:E});(globalThis.litElementVersions??(globalThis.litElementVersions=[])).push("4.1.1");var mt={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},ft=i=>(...t)=>({_$litDirective$:i,values:t}),B=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,s){this.t=t,this._$AM=e,this.i=s}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};var te="important",we=" !"+te,gt=ft(class extends B{constructor(i){if(super(i),i.type!==mt.ATTRIBUTE||i.name!=="style"||i.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(i){return Object.keys(i).reduce((t,e)=>{let s=i[e];return s==null?t:t+`${e=e.includes("-")?e:e.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${s};`},"")}update(i,[t]){let{style:e}=i.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(t)),this.render(t);for(let s of this.ft)t[s]==null&&(this.ft.delete(s),s.includes("-")?e.removeProperty(s):e[s]=null);for(let s in t){let r=t[s];if(r!=null){this.ft.add(s);let n=typeof r=="string"&&r.endsWith(we);s.includes("-")||n?e.setProperty(s,n?r.slice(0,-11):r,n?te:""):e[s]=r}}return A}});var w="change";var xt="load-start",ee="load-end",F="load";var se="mas-render-mode",Ut=class extends E{static get styles(){return G`
            :host {
                display: block;
                padding: 0 10px;
            }

            #toolbar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                height: 48px;
            }

            .divider {
                flex: 1;
            }

            sp-action-bar {
                display: none;
                flex: 1;
            }

            sp-action-bar[open] {
                display: flex;
            }
        `}static get properties(){return{mode:{type:String,attribute:!0,reflect:!0},source:{type:Object,attribute:!1},disabled:{type:Boolean,attribute:!0},inSelection:{type:Boolean,attribute:"in-selection",reflect:!0}}}constructor(){super(),this.mode=sessionStorage.getItem(se)??"render",this.inSelection=!1,this.disabled=!1,this.forceUpdate=this.forceUpdate.bind(this)}connectedCallback(){super.connectedCallback(),this.registerToSource()}disconnectedCallback(){super.disconnectedCallback(),this.unregisterFromSource()}registerToSource(){this.source=document.getElementById(this.getAttribute("source")),this.source&&(this.source.addEventListener(F,this.forceUpdate),this.source.addEventListener(w,this.forceUpdate))}async forceUpdate(){this.requestUpdate()}unregisterFromSource(){this.source?.removeEventListener(F,this.forceUpdate),this.source?.removeEventListener(w,this.forceUpdate)}updated(t){t.size!==0&&(t.has("mode")&&sessionStorage.setItem(se,this.mode),this.forceUpdate())}get currentRenderer(){return[...this.children].find(t=>t.canRender())}get searchInfo(){return $`<sp-icon-search></sp-icon-search> Search results for
            "${this.source.searchText}"`}get breadcrumbs(){let t=this.source?.currentFolder?.path;if(!t)return u;let s=(t.split("/")??[]).map(r=>{let[n]=t.split(`/${r}/`);return $`<sp-breadcrumb-item
                value="${n}/${r}"
                ?disabled=${this.inSelection||this.disabled}
                >${r}</sp-breadcrumb-item
            >`});return $`<sp-breadcrumbs
            maxVisibleItems="10"
            @change=${this.handleBreadcrumbChange}
            value="${this.source.path}"
            >${s}</sp-breadcrumbs
        >`}handleBreadcrumbChange(t){this.source.path=t.detail.value,this.source.listFragments()}render(){return $`<div id="toolbar">
                ${this.source.searchText?this.searchInfo:this.breadcrumbs}
                <div class="divider"></div>
                ${this.actions}
            </div>
            ${this.selectionActions}
            <slot></slot> `}toggleSelectionMode(t){this.inSelection=t!==void 0?t:!this.inSelection,this.inSelection||this.source.clearSelection(),this.notify()}get selectionCount(){return this.source.selectedFragments.length??0}get selectionActions(){let t=gt({display:this.selectionCount===1?"flex":"none"}),e=gt({display:this.selectionCount>0?"flex":"none"});return $`<sp-action-bar
            emphasized
            ?open=${this.inSelection}
            variant="fixed"
            @close=${()=>this.toggleSelectionMode(!1)}
        >
            ${this.selectionCount} selected
            <sp-action-button
                slot="buttons"
                style=${t}
                label="Duplicate"
            >
                <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
            </sp-action-button>
            <sp-action-button
                slot="buttons"
                style=${e}
                label="Delete"
            >
                <sp-icon-delete-outline slot="icon"></sp-icon-delete-outline>
            </sp-action-button>
            <sp-action-button
                slot="buttons"
                style=${e}
                label="Publish"
            >
                <sp-icon-publish-check slot="icon"></sp-icon-publish-check>
            </sp-action-button>
            <sp-action-button
                slot="buttons"
                style=${e}
                label="Unpublish"
            >
                <sp-icon-publish-remove slot="icon"></sp-icon-publish-remove>
            </sp-action-button>
        </sp-action-bar>`}get renderActions(){return[...this.children].filter(t=>t.actionData).map(({actionData:[t,e,s]})=>$`<sp-menu-item value="${t}"
                        >${s} ${e}</sp-menu-item
                    >`)}get actions(){let t=gt({display:!this.disabled&&!this.inSelection?"flex":"none"});return $`<sp-action-group emphasized>
            <slot name="toolbar-actions"></slot>
            <sp-action-button emphasized style=${t}>
                <sp-icon-new-item slot="icon"></sp-icon-new-item>
                Create New Card
            </sp-action-button>
            <sp-action-button
                style=${t}
                @click=${this.toggleSelectionMode}
            >
                <sp-icon-selection-checked
                    slot="icon"
                ></sp-icon-selection-checked>
                Select
            </sp-action-button>
            <sp-action-menu
                style=${t}
                selects="single"
                value="${this.mode}"
                placement="left-end"
                @change=${this.handleRenderModeChange}
            >
                ${this.renderActions}
            </sp-action-menu>
        </sp-action-group>`}handleRenderModeChange(t){this.mode=t.target.value,this.notify()}notify(){this.dispatchEvent(new CustomEvent(w))}};customElements.define("content-navigation",Ut);var S="Network error",ve={sort:[{on:"created",order:"ASC"}]},tt,$t=class{constructor(t,e){_(this,tt);y(this,"sites",{cf:{fragments:{search:this.searchFragment.bind(this),getByPath:this.getFragmentByPath.bind(this),getById:t=>this.getFragmentById(this.baseUrl,t,this.headers),save:this.saveFragment.bind(this),copy:this.copyFragmentClassic.bind(this),create:this.createFragment.bind(this),publish:this.publishFragment.bind(this),delete:this.deleteFragment.bind(this)}}});y(this,"folders",{list:this.listFoldersClassic.bind(this)});b(this,tt,/^author-/.test(t));let s=e||`https://${t}.adobeaemcloud.com`;this.baseUrl=s;let r=`${s}/adobe/sites`;this.cfFragmentsUrl=`${r}/cf/fragments`,this.cfSearchUrl=`${this.cfFragmentsUrl}/search`,this.cfPublishUrl=`${this.cfFragmentsUrl}/publish`,this.wcmcommandUrl=`${s}/bin/wcmcommand`,this.csrfTokenUrl=`${s}/libs/granite/csrf/token.json`,this.foldersUrl=`${s}/adobe/folders`,this.foldersClassicUrl=`${s}/api/assets`,this.headers={Authorization:`Bearer ${sessionStorage.getItem("masAccessToken")??window.adobeid?.authorize?.()}`,pragma:"no-cache","cache-control":"no-cache"}}wait(t=1e3){return new Promise(e=>setTimeout(e,t))}async getCsrfToken(){let t=await fetch(this.csrfTokenUrl,{headers:this.headers}).catch(s=>{throw new Error(`${S}: ${s.message}`)});if(!t.ok)throw new Error(`Failed to get CSRF token: ${t.status} ${t.statusText}`);let{token:e}=await t.json();return e}async*searchFragment({path:t,query:e="",sort:s}){let r={path:t};e?r.fullText={text:encodeURIComponent(e),queryMode:"EXACT_WORDS"}:r.onlyDirectChildren=!0;let n={...ve,filter:r};s&&(n.sort=s);let o={query:JSON.stringify(n)},h;for(;;){h&&(o.cursor=h);let a=new URLSearchParams(o).toString(),c=await fetch(`${this.cfSearchUrl}?${a}`,{headers:this.headers}).catch(l=>{throw new Error(`${S}: ${l.message}`)});if(!c.ok)throw new Error(`Search failed: ${c.status} ${c.statusText}`);let m;if({items:m,cursor:h}=await c.json(),yield m,!h)break}}async getFragment(t){let e=t.headers.get("Etag"),s=await t.json();return s.etag=e,s}async getFragmentById(t,e,s){let r=await fetch(`${t}/adobe/sites/cf/fragments/${e}`,{headers:s});if(!r.ok)throw new Error(`Failed to get fragment: ${r.status} ${r.statusText}`);return await this.getFragment(r)}async getFragmentByPath(t){let e=p(this,tt)?this.headers:{},s=await fetch(`${this.cfFragmentsUrl}?path=${t}`,{headers:e}).catch(n=>{throw new Error(`${S}: ${n.message}`)});if(!s.ok)throw new Error(`Failed to get fragment: ${s.status} ${s.statusText}`);let{items:r}=await s.json();if(!r||r.length===0)throw new Error("Fragment not found");return r[0]}async saveFragment(t){let{title:e,description:s,fields:r}=t,n=await fetch(`${this.cfFragmentsUrl}/${t.id}`,{method:"PUT",headers:{"Content-Type":"application/json","If-Match":t.etag,...this.headers},body:JSON.stringify({title:e,description:s,fields:r})}).catch(o=>{throw new Error(`${S}: ${o.message}`)});if(!n.ok)throw new Error(`Failed to save fragment: ${n.status} ${n.statusText}`);return await this.getFragment(n)}async copyFragmentClassic(t){let e=await this.getCsrfToken(),s=t.path.split("/").slice(0,-1).join("/"),r=new FormData;r.append("cmd","copyPage"),r.append("srcPath",t.path),r.append("destParentPath",s),r.append("shallow","false"),r.append("_charset_","UTF-8");let n=await fetch(this.wcmcommandUrl,{method:"POST",headers:{...this.headers,"csrf-token":e},body:r}).catch(f=>{throw new Error(`${S}: ${f.message}`)});if(!n.ok)throw new Error(`Failed to copy fragment: ${n.status} ${n.statusText}`);let o=await n.text(),m=new DOMParser().parseFromString(o,"text/html").getElementById("Message")?.textContent.trim();if(!m)throw new Error("Failed to extract new path from copy response");await this.wait();let l=await this.getFragmentByPath(m);return l&&(l=await this.sites.cf.fragments.getById(l.id)),l}async createFragment(t,e){let{title:s,fields:r,model:{id:n}}=t;if(!e||!s||!n)throw new Error(`Missing data to create a fragment: ${e}, ${s}, ${n}`);let o=await fetch(`${this.cfFragmentsUrl}`,{method:"POST",headers:{"Content-Type":"application/json",...this.headers},body:JSON.stringify({title:s,modelId:n,fields:r})}).catch(h=>{throw new Error(`${S}: ${h.message}`)});if(!o.ok)throw new Error(`Failed to create fragment: ${o.status} ${o.statusText}`);return await this.getFragment(o)}async publishFragment(t){let e=await fetch(this.cfPublishUrl,{method:"POST",headers:{"Content-Type":"application/json","If-Match":t.etag,...this.headers},body:JSON.stringify({paths:[t.path],filterReferencesByStatus:["DRAFT","UNPUBLISHED"],workflowModelId:"/var/workflow/models/scheduled_activation_with_references"})}).catch(s=>{throw new Error(`${S}: ${s.message}`)});if(!e.ok)throw new Error(`Failed to publish fragment: ${e.status} ${e.statusText}`);return await e.json()}async deleteFragment(t){let e=await fetch(`${this.cfFragmentsUrl}/${t.id}`,{method:"DELETE",headers:{"Content-Type":"application/json","If-Match":t.etag,...this.headers}}).catch(s=>{throw new Error(`${S}: ${s.message}`)});if(!e.ok)throw new Error(`Failed to delete fragment: ${e.status} ${e.statusText}`);return e}async listFolders(t){let e=new URLSearchParams({path:t}).toString(),s=await fetch(`${this.foldersUrl}/?${e}`,{method:"GET",headers:{...this.headers,"X-Adobe-Accept-Experimental":"1"}}).catch(r=>{throw new Error(`${S}: ${r.message}`)});if(!s.ok)throw new Error(`Failed to list folders: ${s.status} ${s.statusText}`);return await s.json()}async listFoldersClassic(t){let e=t?.replace(/^\/content\/dam/,""),s=await fetch(`${this.foldersClassicUrl}${e}.json?limit=1000`,{method:"GET",headers:{...this.headers}}).catch(o=>{throw new Error(`${S}: ${o.message}`)});if(!s.ok)throw new Error(`Failed to list folders: ${s.status} ${s.statusText}`);let{properties:{name:r},entities:n=[]}=await s.json();return{self:{name:r,path:t},children:n.filter(({class:[o]})=>/folder/.test(o)).map(({properties:{name:o,title:h}})=>({name:o,title:h,folderId:`${t}/${o}`,path:`${t}/${o}`}))}}};tt=new WeakMap;var V,Ft=class Ft{constructor(t){_(this,V,!1);y(this,"folders",[]);y(this,"fragments",[]);this.path=t}open({folderId:t,name:e,title:s},r){p(this,V)||(this.folderId=t,this.name=e,this.title=s,b(this,V,open),r.forEach(n=>{let o=new Ft(n.path);this.folders.push(o)}))}get isOpen(){return p(this,V)}clear(){this.fragments=[]}add(...t){this.fragments=[...this.fragments,...t]}};V=new WeakMap;var et=Ft;var st=class{constructor({id:t,etag:e,model:s,path:r,title:n,description:o,status:h,modified:a,fields:c},m){y(this,"path","");y(this,"hasChanges",!1);y(this,"status","");y(this,"fields",[]);y(this,"selected",!1);this.id=t,this.model=s,this.etag=e,this.path=r,this.name=r.split("/").pop(),this.title=n,this.description=o,this.status=h,this.modified=a,this.fields=c,this.eventTarget=m}get variant(){return this.fields.find(t=>t.name==="variant")?.values?.[0]}get fragmentName(){return this.path.split("/").pop()}get statusVariant(){return this.hasChanges?"yellow":this.status==="PUBLISHED"?"positive":"info"}refreshFrom(t){Object.assign(this,t),this.hasChanges=!1,this.notify()}notify(){this.eventTarget.dispatchEvent(new CustomEvent(w,{detail:this}))}toggleSelection(t){t!==void 0?this.selected=t:this.selected=!this.selected,this.notify()}updateFieldInternal(t,e){this[t]=e??"",this.hasChanges=!0,this.notify()}updateField(t,e){let s=!1;return this.fields.filter(r=>r.name===t).forEach(r=>{r.values.length===e.length&&r.values.every((n,o)=>n===e[o])||(r.values=e,this.hasChanges=!0,s=!0)}),this.notify(),s}};var rt,v,j,it,R,I,C,z,Pt=class extends E{constructor(){super(...arguments);_(this,v);_(this,j);y(this,"currentFolder");_(this,it,new Map);_(this,R,!0);_(this,I);_(this,C);_(this,z)}static get properties(){return{bucket:{type:String},baseUrl:{type:String,attribute:"base-url"},root:{type:String,attribute:!0,reflect:!0},path:{type:String,attribute:!0,reflect:!0},searchText:{type:String,attribute:"search"},fragment:{type:Object}}}createRenderRoot(){return this}connectedCallback(){if(super.connectedCallback(),!this.root)throw new Error("root attribute is required");if(!(this.bucket||this.baseUrl))throw new Error("Either the bucket or baseUrl attribute is required.");b(this,v,new $t(this.bucket,this.baseUrl)),b(this,j,new et(this.root)),this.style.display="none"}async sendSearch(){this.searchText?await this.searchFragments():(await this.openFolder(this.path||this.root),await this.listFragments())}async openFolder(e){b(this,R,!0),this.dispatchEvent(new CustomEvent(xt)),typeof e=="string"?(this.currentFolder=p(this,it).get(e),this.currentFolder||(this.currentFolder=new et(e),p(this,it).set(e,this.currentFolder))):this.currentFolder=e;let{self:s,children:r}=await p(this,v).folders.list(this.currentFolder.path);this.currentFolder.open(s,r)}async selectFragment(e,s,r){let n=await p(this,v).sites.cf.fragments.getById(r.id);Object.assign(r,n),r.refreshFrom(n),this.setFragment(r),this.dispatchEvent(new CustomEvent("select-fragment",{detail:{x:e,y:s,fragment:r},bubbles:!0,composed:!0}))}setFragment(e){this.fragment=e}async processFragments(e,s=!1){p(this,z)&&(p(this,z).cancelled=!0),b(this,z,e),b(this,R,!0),b(this,I,[]),this.currentFolder?.clear(),this.dispatchEvent(new CustomEvent(xt,{bubbles:!0}));for await(let r of e){if(e.cancelled)break;b(this,R,!0);let n=r.map(o=>new st(o,this));s?b(this,I,[...p(this,I),...n]):this.currentFolder.add(...n),rt||await customElements.whenDefined("aem-fragment").then(()=>{rt=document.createElement("aem-fragment").cache}),rt.add(...n),this.dispatchEvent(new CustomEvent(F))}b(this,R,!1),this.dispatchEvent(new CustomEvent(ee,{bubbles:!0}))}async listFragments(){b(this,C,{path:this.path||this.currentFolder.path||p(this,j).path});let e=p(this,v).sites.cf.fragments.search(p(this,C));this.processFragments(e)}async searchFragments(){b(this,C,{query:this.searchText,path:p(this,j).path});let e=await p(this,v).sites.cf.fragments.search(p(this,C));this.processFragments(e,!0)}async saveFragment(){let e=await p(this,v).sites.cf.fragments.save(this.fragment);if(!e)throw new Error("Failed to save fragment");rt.get(e.id)?.refreshFrom(e)}async copyFragment(){let e=this.fragment;this.setFragment(null);let s=await p(this,v).sites.cf.fragments.copy(e);rt?.add(s);let r=new st(s);p(this,C).addToResult(r,e),this.setFragment(r)}async publishFragment(){await p(this,v).sites.cf.fragments.publish(this.fragment)}async deleteFragment(){await p(this,v).sites.cf.fragments.delete(this.fragment),p(this,C).removeFromResult(this.fragment),this.setFragment(null)}clearSelection(){this.fragments.forEach(e=>e.toggleSelection(!1))}get fragments(){return(this.searchText?p(this,I):this.currentFolder?.fragments)??[]}get selectedFragments(){return this.fragments.filter(e=>e.selected)}get folders(){return this.currentFolder?.folders??[]}get search(){return{...p(this,C)}}get loading(){return p(this,R)}render(){return u}};v=new WeakMap,j=new WeakMap,it=new WeakMap,R=new WeakMap,I=new WeakMap,C=new WeakMap,z=new WeakMap;customElements.define("aem-fragments",Pt);var Ae="table",Rt=class extends E{static get styles(){return G`
            :host {
                display: contents;
            }

            sp-table {
                height: var(--table-height, 100%);
            }
        `}static get properties(){return{rowCount:{type:Number,attribute:"row-count"},customRenderItem:{type:Function}}}constructor(){super(),this.forceUpdate=this.forceUpdate.bind(this),this.itemValue=this.itemValue.bind(this),this.renderItem=this.renderItem.bind(this)}get table(){return this.shadowRoot?.querySelector("sp-table")}get tableBody(){return this.table?.querySelector("sp-table-body")}canRender(){return this.parentElement?.mode===Ae&&this.parentElement.source}render(){return this.canRender()?$`
            <sp-table
                emphasized
                scroller
                .itemValue=${this.itemValue}
                .renderItem=${this.renderItem}
                selects=${this.parentElement.inSelection?"multiple":void 0}
                @change=${this.handleTableSelectionChange}
                @dblclick="${this.handleDoubleClick}"
            >
                <sp-table-head>
                    <sp-table-head-cell sortable>Title</sp-table-head-cell>
                    <sp-table-head-cell sortable>Name</sp-table-head-cell>
                    <slot name="headers"></slot>
                    <sp-table-head-cell sortable>Status</sp-table-head-cell>
                    <sp-table-head-cell sortable
                        >Modified at</sp-table-head-cell
                    >
                    <sp-table-head-cell sortable
                        >Modified by</sp-table-head-cell
                    >
                </sp-table-head>
            </sp-table>
        `:u}updated(){(async()=>this.table&&(this.parentElement.inSelection||this.table.deselectAllRows(),this.table.items=this.parentElement.source.fragments,this.table.renderVirtualizedItems()))()}itemValue(t){return t.id}renderItem(t){return t?$` <sp-table-cell>${t.title}</sp-table-cell>
            <sp-table-cell>${t.name}</sp-table-cell>
            ${this.customRenderItem?.(t)}
            <sp-table-cell>${t.status}</sp-table-cell>
            <sp-table-cell>${t.modified.at}</sp-table-cell>
            <sp-table-cell>${t.modified.by}</sp-table-cell>`:u}handleDoubleClick(t){if(this.parentElement.inSelection)return;let{value:e}=t.target.closest("sp-table-row");if(!e)return;let s=this.parentElement.source.fragments.find(r=>r.id===e);s&&this.parentElement.source.selectFragment(t.clientX,t.clientY,s)}connectedCallback(){super.connectedCallback(),this.rowCount&&this.style.setProperty("--table-height",`${this.rowCount*40}px`),this.parentElement.addEventListener(w,this.forceUpdate),this.parentElement.source.addEventListener(F,this.forceUpdate),this.parentElement.source.addEventListener(w,this.forceUpdate)}async forceUpdate(){this.requestUpdate()}handleTableSelectionChange(t){let{selected:e}=t.target;this.parentElement.source.fragments.forEach(s=>{s.toggleSelection(e.includes(s.id))})}disconnectedCallback(){super.disconnectedCallback()}get actionData(){return["table","Table view",$`<sp-icon-table slot="icon"></sp-icon-table>`]}};customElements.define("table-view",Rt);var{I:Se}=Xt;var re=()=>document.createComment(""),q=(i,t,e)=>{let s=i._$AA.parentNode,r=t===void 0?i._$AB:t._$AA;if(e===void 0){let n=s.insertBefore(re(),r),o=s.insertBefore(re(),r);e=new Se(n,o,i,i.options)}else{let n=e._$AB.nextSibling,o=e._$AM,h=o!==i;if(h){let a;e._$AQ?.(i),e._$AM=i,e._$AP!==void 0&&(a=i._$AU)!==o._$AU&&e._$AP(a)}if(n!==r||h){let a=e._$AA;for(;a!==n;){let c=a.nextSibling;s.insertBefore(a,r),a=c}}}return e},k=(i,t,e=i)=>(i._$AI(t,e),i),Ce={},ie=(i,t=Ce)=>i._$AH=t,ne=i=>i._$AH,bt=i=>{i._$AP?.(!1,!0);let t=i._$AA,e=i._$AB.nextSibling;for(;t!==e;){let s=t.nextSibling;t.remove(),t=s}};var oe=(i,t,e)=>{let s=new Map;for(let r=t;r<=e;r++)s.set(i[r],r);return s},ae=ft(class extends B{constructor(i){if(super(i),i.type!==mt.CHILD)throw Error("repeat() can only be used in text expressions")}dt(i,t,e){let s;e===void 0?e=t:t!==void 0&&(s=t);let r=[],n=[],o=0;for(let h of i)r[o]=s?s(h,o):o,n[o]=e(h,o),o++;return{values:n,keys:r}}render(i,t,e){return this.dt(i,t,e).values}update(i,[t,e,s]){let r=ne(i),{values:n,keys:o}=this.dt(t,e,s);if(!Array.isArray(r))return this.ut=o,n;let h=this.ut??(this.ut=[]),a=[],c,m,l=0,f=r.length-1,d=0,g=n.length-1;for(;l<=f&&d<=g;)if(r[l]===null)l++;else if(r[f]===null)f--;else if(h[l]===o[d])a[d]=k(r[l],n[d]),l++,d++;else if(h[f]===o[g])a[g]=k(r[f],n[g]),f--,g--;else if(h[l]===o[g])a[g]=k(r[l],n[g]),q(i,a[g+1],r[l]),l++,g--;else if(h[f]===o[d])a[d]=k(r[f],n[d]),q(i,r[l],r[f]),f--,d++;else if(c===void 0&&(c=oe(o,d,g),m=oe(h,l,f)),c.has(h[l]))if(c.has(h[f])){let T=m.get(o[d]),yt=T!==void 0?r[T]:null;if(yt===null){let Nt=q(i,r[l]);k(Nt,n[d]),a[d]=Nt}else a[d]=k(yt,n[d]),q(i,r[l],yt),r[T]=null;d++}else bt(r[f]),f--;else bt(r[l]),l++;for(;d<=g;){let T=q(i,a[g+1]);k(T,n[d]),a[d++]=T}for(;l<=f;){let T=r[l++];T!==null&&bt(T)}return this.ut=o,ie(i,a),A}});var le="render",Te={merchCard:{path:"/conf/mas/settings/dam/cfm/models/card",name:"Merch Card"}},kt=class extends E{constructor(){super(),this.forceUpdate=this.forceUpdate.bind(this)}createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.addEventListener("click",t=>{t.preventDefault()}),this.parentElement.addEventListener(w,this.forceUpdate),this.parentElement.source.addEventListener(F,this.forceUpdate),this.parentElement.source.addEventListener(w,this.forceUpdate)}async forceUpdate(t){this.requestUpdate()}renderItem(t){let e=this.parentElement.source.selectedFragments.includes(t);return $`<merch-card
            class="${e?"selected":""}"
            @dblclick="${s=>this.handleDoubleClick(s,t)}"
        >
            <aem-fragment fragment="${t.id}" ims></aem-fragment>
            <sp-status-light
                size="l"
                variant="${t.statusVariant}"
            ></sp-status-light>
            <div class="overlay" @click="${()=>t.toggleSelection()}">
                ${e?$`<sp-icon-remove slot="icon"></sp-icon-remove>`:$`<sp-icon-add slot="icon"></sp-icon-add>`}
            </div>
        </merch-card>`}handleDoubleClick(t,e){this.parentElement.inSelection||this.parentElement.source.selectFragment(t.clientX,t.clientY,e)}canRender(){return this.parentElement?.mode===le&&this.parentElement.source?.fragments}render(){return this.canRender()?$` ${ae(this.parentElement.source.fragments,t=>t.path,t=>{switch(t.model.path){case Te.merchCard.path:return this.renderItem(t);default:return u}})}`:u}get actionData(){return[le,"Render view",$`<sp-icon-view-card slot="icon"></sp-icon-view-card>`]}};customElements.define("render-view",kt);export{et as Folder,st as Fragment};
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

lit-html/directives/style-map.js:
  (**
   * @license
   * Copyright 2018 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directive-helpers.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/repeat.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
//# sourceMappingURL=aem.js.map
