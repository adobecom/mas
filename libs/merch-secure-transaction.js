// branch: MWPW-153962-3 commit: 73e67d72ac678797fbcc49debf86f24586e6db1a Tue, 09 Jul 2024 13:22:44 GMT
import{LitElement as p,html as n}from"/libs/deps/lit-all.min.js";import{css as l}from"/libs/deps/lit-all.min.js";var i=l`
    #label {
        align-items: center;
        cursor: pointer;
        display: inline-flex;
        gap: var(--consonant-merch-spacing-xxxs);
        white-space: nowrap;
        font-size: 12px;
        line-height: 15px;
    }

    #label.icon::before {
        background-position: center;
        background-size: contain;
        background: var(--secure-icon) no-repeat;
        content: '';
        display: inline-block;
        height: 1em;
        width: 1em;
    }
`;var a="merch-secure-transaction",t=class extends p{static properties={labelText:{attribute:"label",type:String},showIcon:{attribute:"icon",type:Boolean},tooltipText:{attribute:"tooltip",type:String}};static styles=[i];labelText="";showIcon=!0;tooltipText="";render(){let{labelText:r,showIcon:s,tooltipText:e}=this,o=n`
            <div class="${s?"icon":""}" id="label" slot="trigger">
                ${r}
            </div>
        `;return e?n`
            <overlay-trigger placement="top-start" offset="4">
                ${o}
                <sp-tooltip id="tooltip" slot="hover-content" delayed
                    >${e}</sp-tooltip
                >
            </overlay-trigger>
        `:o}};window.customElements.define(a,t);export{t as default};
//# sourceMappingURL=merch-secure-transaction.js.map
