var d=Object.defineProperty;var r=e=>{throw TypeError(e)};var h=(e,t,s)=>t in e?d(e,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):e[t]=s;var o=(e,t,s)=>h(e,typeof t!="symbol"?t+"":t,s),m=(e,t,s)=>t.has(e)||r("Cannot "+s);var l=(e,t,s)=>t.has(e)?r("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,s);var c=(e,t,s)=>(m(e,t,"access private method"),s);import{html as x,css as g,LitElement as u}from"./lit-all.min.js";var n,a,i=class extends u{constructor(){super();l(this,n)}render(){return x`
            <slot name="icon" @slotchange=${c(this,n,a)}></slot>
            <slot name="description">${this.description}</slot>
        `}};n=new WeakSet,a=function(){this.querySelector('[slot="description"]')?.textContent.trim()&&this.querySelectorAll("merch-icon").forEach(p=>{p.alt=""})},o(i,"styles",g`
        :host {
            display: flex;
            flex-wrap: nowrap;
            gap: 8px;
            margin-right: 16px;
            align-items: center;
        }

        ::slotted([slot='icon']) {
            display: flex;
            justify-content: center;
            align-items: center;
            height: max-content;
        }

        ::slotted([slot='description']) {
            font-size: 14px;
            line-height: 21px;
            margin: 0;
        }

        :host .hidden {
            display: none;
        }
    `),o(i,"properties",{description:{type:String,attribute:!0}});customElements.define("merch-mnemonic-list",i);export{i as MerchMnemonicList};
