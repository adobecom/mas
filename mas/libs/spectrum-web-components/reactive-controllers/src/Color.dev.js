"use strict";
import { TinyColor } from "@ctrl/tinycolor";
export const extractHueAndSaturationRegExp = /^hs[v|l]a?\s?\((\d{1,3}\.?\d*?),?\s?(\d{1,3})/;
export const replaceHueAndSaturationRegExp = /(^hs[v|l]a?\s?\()\d{1,3}\.?\d*?(,?\s?)\d{1,3}/;
export const replaceHueRegExp = /(^hs[v|l]a?\()\d{1,3}/;
const getHexValue = (color, isString) => isString ? color.toHexString() : color.toHex();
export class ColorController {
  constructor(host, {
    applyColorToState,
    extractColorFromState,
    maintains
  }) {
    this.maintains = "hue";
    this._hue = 0;
    this.getColorProcesses = {
      rgb: (color, isString) => isString ? color.toRgbString() : color.toRgb(),
      prgb: (color, isString) => isString ? color.toPercentageRgbString() : color.toPercentageRgb(),
      hex8: (color, isString) => isString ? color.toHex8String() : color.toHex8(),
      name: (color) => color.toName() || color.toRgbString(),
      hsl: (color, isString) => {
        if (this.maintains === "hue") {
          if (isString) {
            const hslString = color.toHslString();
            return hslString.replace(replaceHueRegExp, `$1${this.hue}`);
          } else {
            const { s, l, a } = color.toHsl();
            return { h: this.hue, s, l, a };
          }
        } else {
          if (isString) {
            const hslString = color.toHslString();
            return hslString.replace(
              replaceHueAndSaturationRegExp,
              `$1${this.hue}$2${this.saturation}`
            );
          } else {
            const { s, l, a } = color.toHsl();
            return { h: this.hue, s, l, a };
          }
        }
      },
      hsv: (color, isString) => {
        if (this.maintains === "hue") {
          if (isString) {
            const hsvString = color.toHsvString();
            return hsvString.replace(replaceHueRegExp, `$1${this.hue}`);
          } else {
            const { s, v, a } = color.toHsv();
            return { h: this.hue, s, v, a };
          }
        } else {
          if (isString) {
            const hsvString = color.toHsvString();
            return hsvString.replace(
              replaceHueAndSaturationRegExp,
              `$1${this.hue}$2${this.saturation}`
            );
          } else {
            const { s, v, a } = color.toHsv();
            return { h: this.hue, s, v, a };
          }
        }
      },
      hex: getHexValue,
      hex3: getHexValue,
      hex4: getHexValue,
      hex6: getHexValue
    };
    this._color = new TinyColor({ h: 0, s: 1, v: 1 });
    this._previousColor = new TinyColor({ h: 0, s: 1, v: 1 });
    this._format = {
      format: "",
      isString: false
    };
    this.host = host;
    this.applyColorToState = applyColorToState;
    this.extractColorFromState = extractColorFromState;
    this.maintains = maintains || this.maintains;
  }
  setColorProcess(currentColor, nextColor, format, isString) {
    if (this.maintains === "hue") {
      this.setColorMaintainHue(currentColor, nextColor, format, isString);
    } else if (this.maintains === "saturation") {
      this.setColorMaintainSaturation(
        currentColor,
        nextColor,
        format,
        isString
      );
    }
  }
  setColorMaintainHue(currentColor, nextColor, format, isString) {
    const { h, s, v } = this._color.toHsv();
    let originalHue = void 0;
    if (isString && format.startsWith("hs")) {
      const values = extractHueAndSaturationRegExp.exec(
        nextColor
      );
      if (values !== null) {
        const [, h2] = values;
        originalHue = Number(h2);
      }
    } else if (!isString && format.startsWith("hs")) {
      const colorInput = currentColor.originalInput;
      const colorValues = Object.values(colorInput);
      originalHue = colorValues[0];
    }
    this.hue = originalHue || h;
    this.applyColorToState({ h, s, v });
  }
  setColorMaintainSaturation(currentColor, nextColor, format, isString) {
    if (isString && format.startsWith("hs")) {
      const values = extractHueAndSaturationRegExp.exec(
        nextColor
      );
      if (values !== null) {
        const [, h, s] = values;
        this.hue = Number(h);
        this.saturation = Number(s);
      }
    } else if (!isString && format.startsWith("hs")) {
      const colorInput = currentColor.originalInput;
      const colorValues = Object.values(colorInput);
      this.hue = colorValues[0];
      this.saturation = colorValues[1];
    } else {
      const { h } = currentColor.toHsv();
      this.hue = h;
    }
    this.applyColorToState(currentColor.toHsv());
  }
  applyColorFromState() {
    this._color = new TinyColor(this.extractColorFromState(this));
  }
  get hue() {
    return this._hue;
  }
  set hue(value) {
    const hue = Math.min(360, Math.max(0, value));
    if (hue === this.hue) {
      return;
    }
    const oldValue = this.hue;
    const { s, v } = this._color.toHsv();
    this._color = new TinyColor({ h: hue, s, v });
    this._hue = hue;
    this.host.requestUpdate("hue", oldValue);
  }
  /* c8 ignore next 3 */
  get value() {
    return this.color;
  }
  get color() {
    return this.getColorProcesses[this._format.format || "hex"](
      this._color,
      this._format.isString
    );
  }
  set color(color) {
    if (color === this.color) {
      return;
    }
    const oldValue = this._color;
    this._color = new TinyColor(color);
    const format = this._color.format;
    let isString = typeof color === "string" || color instanceof String;
    if (format.startsWith("hex")) {
      isString = color.startsWith("#");
    }
    this._format = {
      format,
      isString
    };
    this.setColorProcess(this._color, color, format, isString);
    this.host.requestUpdate("color", oldValue);
  }
  getColor(format) {
    const formatOptions = {
      hsl: "toHsl"
    };
    return this._color[formatOptions[format]]();
  }
  setColor(color) {
    this._color = color;
    const isString = typeof this._color.originalInput === "string" || this._color.originalInput instanceof String;
    this.setColorProcess(this._color, color, this._color.format, isString);
  }
  getHslString() {
    return this._color.toHslString();
  }
  savePreviousColor() {
    this._previousColor = this._color.clone();
  }
  restorePreviousColor() {
    this.setColor(this._previousColor);
  }
}
//# sourceMappingURL=Color.dev.js.map
