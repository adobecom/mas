"use strict";
import { css } from "@spectrum-web-components/base";
const styles = css`
    :host([disabled]) ::slotted([slot=trigger]){pointer-events:none}slot[name=longpress-describedby-descriptor]{display:none}
`;
export default styles;
//# sourceMappingURL=overlay-trigger.css.dev.js.map
