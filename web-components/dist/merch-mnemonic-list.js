var o=Object.defineProperty;var r=(e,t,i)=>t in e?o(e,t,{enumerable:!0,configurable:!0,writable:!0,value:i}):e[t]=i;var n=(e,t,i)=>r(e,typeof t!="symbol"?t+"":t,i);import{html as l,css as p,LitElement as a}from"lit";var s=class extends a{constructor(){super()}render(){return l`
            <slot name="icon"></slot>
            <slot name="description">${this.description}</slot>
        `}};n(s,"styles",p`
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
    `),n(s,"properties",{description:{type:String,attribute:!0}});customElements.define("merch-mnemonic-list",s);export{s as MerchMnemonicList};
