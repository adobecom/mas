"use strict";
import {
  firstFocusableIn,
  firstFocusableSlottedIn
} from "@spectrum-web-components/shared/src/first-focusable-in.js";
import { VirtualTrigger } from "./VirtualTrigger.dev.js";
import { guaranteedAllTransitionend, nextFrame } from "./AbstractOverlay.dev.js";
import {
  BeforetoggleClosedEvent,
  BeforetoggleOpenEvent,
  OverlayStateEvent
} from "./events.dev.js";
import { userFocusableSelector } from "@spectrum-web-components/shared";
export function OverlayDialog(constructor) {
  class OverlayWithDialog extends constructor {
    async manageDialogOpen() {
      const targetOpenState = this.open;
      await this.managePosition();
      if (this.open !== targetOpenState) {
        return;
      }
      const focusEl = await this.dialogMakeTransition(targetOpenState);
      if (this.open !== targetOpenState) {
        return;
      }
      await this.dialogApplyFocus(targetOpenState, focusEl);
    }
    async dialogMakeTransition(targetOpenState) {
      let focusEl = null;
      const start = (el, index) => async () => {
        el.open = targetOpenState;
        if (!targetOpenState) {
          const close = () => {
            el.removeEventListener("close", close);
            finish(el, index);
          };
          el.addEventListener("close", close);
        }
        if (index > 0) {
          return;
        }
        const event = targetOpenState ? BeforetoggleOpenEvent : BeforetoggleClosedEvent;
        this.dispatchEvent(new event());
        if (!targetOpenState) {
          return;
        }
        if (el.matches(userFocusableSelector)) {
          focusEl = el;
        }
        focusEl = focusEl || firstFocusableIn(el);
        if (!focusEl) {
          const childSlots = el.querySelectorAll("slot");
          childSlots.forEach((slot) => {
            if (!focusEl) {
              focusEl = firstFocusableSlottedIn(slot);
            }
          });
        }
        if (!this.isConnected || this.dialogEl.open) {
          return;
        }
        this.dialogEl.showModal();
      };
      const finish = (el, index) => () => {
        if (this.open !== targetOpenState) {
          return;
        }
        const eventName = targetOpenState ? "sp-opened" : "sp-closed";
        if (index > 0) {
          el.dispatchEvent(
            new OverlayStateEvent(eventName, this, {
              interaction: this.type,
              publish: false
            })
          );
          return;
        }
        if (!this.isConnected || targetOpenState !== this.open) {
          return;
        }
        const reportChange = async () => {
          const hasVirtualTrigger = this.triggerElement instanceof VirtualTrigger;
          this.dispatchEvent(
            new OverlayStateEvent(eventName, this, {
              interaction: this.type,
              publish: hasVirtualTrigger
            })
          );
          el.dispatchEvent(
            new OverlayStateEvent(eventName, this, {
              interaction: this.type,
              publish: false
            })
          );
          if (this.triggerElement && !hasVirtualTrigger) {
            this.triggerElement.dispatchEvent(
              new OverlayStateEvent(eventName, this, {
                interaction: this.type,
                publish: true
              })
            );
          }
          this.state = targetOpenState ? "opened" : "closed";
          this.returnFocus();
          await nextFrame();
          await nextFrame();
          if (targetOpenState === this.open && targetOpenState === false) {
            this.requestSlottable();
          }
        };
        if (!targetOpenState && this.dialogEl.open) {
          this.dialogEl.addEventListener(
            "close",
            () => {
              reportChange();
            },
            { once: true }
          );
          this.dialogEl.close();
        } else {
          reportChange();
        }
      };
      this.elements.forEach((el, index) => {
        guaranteedAllTransitionend(
          el,
          start(el, index),
          finish(el, index)
        );
      });
      return focusEl;
    }
    async dialogApplyFocus(targetOpenState, focusEl) {
      this.applyFocus(targetOpenState, focusEl);
    }
  }
  return OverlayWithDialog;
}
//# sourceMappingURL=OverlayDialog.dev.js.map
