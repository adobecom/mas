"use strict";var d=Object.defineProperty;var c=Object.getOwnPropertyDescriptor;var r=(o,s,e,t)=>{for(var i=t>1?void 0:t?c(s,e):s,n=o.length-1,a;n>=0;n--)(a=o[n])&&(i=(t?a(s,e,i):a(i))||i);return t&&i&&d(s,e,i),i};import{html as p,nothing as m}from"@spectrum-web-components/base";import{property as l,query as h}from"@spectrum-web-components/base/src/decorators.js";import{ifDefined as u}from"@spectrum-web-components/base/src/directives.js";import{Textfield as b}from"@spectrum-web-components/textfield";import"@spectrum-web-components/button/sp-clear-button.js";import"@spectrum-web-components/icons-workflow/icons/sp-icon-magnify.js";import f from"./search.css.js";const v=o=>o.stopPropagation();export class Search extends b{constructor(){super(...arguments);this.action="";this.label="Search";this.placeholder="Search"}static get styles(){return[...super.styles,f]}handleSubmit(e){this.dispatchEvent(new Event("submit",{cancelable:!0,bubbles:!0}))||e.preventDefault()}handleKeydown(e){const{code:t}=e;t==="Escape"&&this.holdValueOnEscape||!this.value||t!=="Escape"||this.reset()}async reset(){this.value="",await this.updateComplete,this.focusElement.dispatchEvent(new InputEvent("input",{bubbles:!0,composed:!0})),this.focusElement.dispatchEvent(new InputEvent("change",{bubbles:!0}))}renderField(){return p`
            <form
                action=${this.action}
                id="form"
                method=${u(this.method)}
                @submit=${this.handleSubmit}
                @reset=${this.reset}
                @keydown=${this.handleKeydown}
            >
                <sp-icon-magnify
                    class="icon magnifier icon-workflow icon-search"
                ></sp-icon-magnify>
                ${super.renderField()}
                ${this.value?p`
                          <sp-clear-button
                              id="button"
                              label="Reset"
                              tabindex="-1"
                              type="reset"
                              size=${u(this.size)}
                              @keydown=${v}
                          ></sp-clear-button>
                      `:m}
            </form>
        `}firstUpdated(e){super.firstUpdated(e),this.hasAttribute("holdValueOnEscape")||this.inputElement.setAttribute("type","search")}willUpdate(){this.multiline=!1}}r([l()],Search.prototype,"action",2),r([l()],Search.prototype,"label",2),r([l()],Search.prototype,"method",2),r([l()],Search.prototype,"placeholder",2),r([l({type:Boolean})],Search.prototype,"holdValueOnEscape",2),r([h("#form")],Search.prototype,"form",2);
//# sourceMappingURL=Search.js.map
