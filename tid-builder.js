

import crypto from "crypto";
import * as cheerio from 'cheerio';

class TidBuilder {
  constructor(twitterHtml, onedemandHtml) {
    this.twitterHtml = twitterHtml
    this.onedemandHtml = onedemandHtml
    this.className = null
    this.keyValues = null
    this.siteKey = null
    this.animationStr = ""
    this.$ = null
  }

  getArray(name, KEY) {
    const nodes = this.$(name).toArray();
    
    const node = this.$(nodes[KEY[5] % 4]).find('svg path').eq(1)
  
    const attribute = node.attr('d');
  
    const arr = attribute.substring(9).split("C");
    
    return arr.map(n => n.replace(/[^\d]+/g, " ").trim().split(" ").map(Number));
  }

  getKey(key) {
    return new Uint8Array(atob(key).split("").map(n => n.charCodeAt(0)))
  }

  encode = (n) => {
    return btoa(Array.from(n).map(n => String.fromCharCode(n)).join("")).replace(/=/g, "")
  }
  
  toHex(n) {
    return (n < 16 ? "0" : "") + n["toString"](16)
  }

  createAnimation(numArr, KEY_NUMBER) {
    return {
      animation: {
        color: ["#" + this.toHex(numArr[0]) + this.toHex(numArr[1]) + this.toHex(numArr[2]), "#" + this.toHex(numArr[3]) + this.toHex(numArr[4]) + this.toHex(numArr[5])],
        transform: ["rotate(0deg)", "rotate(" + this.Ac(numArr[6], 60, 360, !0) + "deg)"],
        easing: "cubic-bezier(" + Array.from(numArr["slice"](7))["map"]((n, W) => this.Ac(n, W % 2 ? -1 : 0, 1))["join"]() + ")"
      },
      currentTime: Math.round(KEY_NUMBER / 10) * 10
    }
  }

  textEncoder (n) {
    return typeof n == "string" ? new TextEncoder().encode(n) : n
  }

  sha256 (textEncoder) {
    return crypto.subtle.digest('sha-256', textEncoder)
  }

  XOR (n, W, t) {
    return W ? n ^ t[0] : n
  }

  Ac (n, W, t, c) {
    const r = n * (t - W) / 255 + W;
    return c ? Math.floor(r) : r.toFixed(2)
  }

  cubicBezier(a, b, c, d, x) {
    if (x <= 0) {
      let startGradient = 0;
      if (a > 0) startGradient = b / a;
      else if (!b && c > 0) startGradient = d / c;
      return startGradient * x;
    }
  
    if (x >= 1) {
      let endGradient = 0;
      if (c < 1) endGradient = (d - 1) / (c - 1);
      else if (c === 1 && a < 1) endGradient = (b - 1) / (a - 1);
      return 1 + endGradient * (x - 1);
    }
  
    let start = 0, end = 1, mid = 0;
    while (start < end) {
      mid = (start + end) / 2;
      let xEst = this.f(a, c, mid);
      if (Math.abs(x - xEst) < 0.00001) {
        return this.f(b, d, mid);
      }
      if (xEst < x) start = mid;
      else end = mid;
    }
    return this.f(b, d, mid);
  }

  f(a, b, m) {
    return 3 * a * (1 - m) * (1 - m) * m + 3 * b * (1 - m) * m * m + m * m * m;
  }

  hexToRgba(hex) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, 1.0];
  }

  interpolate(from, to, f) {
    let result = [];
    for (let i = 0; i < from.length; i++) {
      result.push(from[i] * (1 - f) + to[i] * f);
    }
    return result;
  }

  convertRotationToMatrix(degrees) {
    const radians = degrees * (Math.PI / 180);
    const c = Math.cos(radians);
    const s = Math.sin(radians);
  
    return [c, s, -s, c, 0, 0];
  }

  generateAnimation (currentTime, totalDuration, fromColorHex, toColorHex, fromRotation, toRotation, easingParams) {

    const normalizedTime = currentTime / totalDuration;
  
    const scaledLocalTime = this.cubicBezier(easingParams.a, easingParams.b, easingParams.c, easingParams.d, normalizedTime);
  
    const fromColor = this.hexToRgba(fromColorHex);
    const toColor = this.hexToRgba(toColorHex);
  
    const color = this.interpolate(fromColor, toColor, scaledLocalTime);
  
    const rotation = this.interpolate(fromRotation, toRotation, scaledLocalTime);
  
    const matrix = this.convertRotationToMatrix(rotation[0]);
  
    const r = Math.round(color[0]);
    const g = Math.round(color[1]);
    const b = Math.round(color[2]);
  
    const rgbColor = `rgb(${r}, ${g}, ${b})`;
  
    const formatValue = (value) => {
      if (Math.abs(value) < 0.000001) {
        return 0;
      }
      return value.toFixed(6);
    };
  
    const matrixOut = `matrix(${matrix.map(val => formatValue(val)).join(', ')})`;
  
    return {
      color: rgbColor,
      transform: matrixOut
    }
  }

  getClassName() {
    const styleContent = this.$('#react-native-stylesheet').text();
    const regex = /(\.[\w-]+)\.loaded/;
    const match = styleContent.match(regex);
    return match[1]
  }

  getSiteKey() {
    return this.$('meta[name="twitter-site-verification"]').attr('content');
  }

  getKeyValues() {
    const matches = [...this.onedemandHtml.matchAll(/n\[(\d+)\],\s*16/g)];
    return matches.map(match => parseInt(match[1]));
  }

  async generate (path, method) {
    this.$ = cheerio.load(this.twitterHtml);

    this.className = this.getClassName()
    this.siteKey = this.getSiteKey()
    this.keyValues = this.getKeyValues()

    let time = Math.floor((Date.now() - 1682924400 * 1e3) / 1e3)
    let timeBuffer = new Uint8Array(new Uint32Array([time]).buffer)
    let key = this.getKey(this.siteKey)
  
    let [r, o] = [key[this.keyValues[0]] % 16, key[this.keyValues[1]] % 16 * (key[this.keyValues[2]] % 16) * (key[this.keyValues[3]] % 16)]
  
    const array = this.getArray(this.className, key);
  
    let result = this.createAnimation(array[r], o)
  
    const easingData = result.animation.easing
      .replace('cubic-bezier(', '')
      .replace(')', '')
      .split(',')
      .map(Number)
  
    const currentTime = result.currentTime;
    const totalDuration = 4096;
    const fromColorHex = result.animation.color[0];
    const toColorHex = result.animation.color[1];
    const fromRotation = [parseInt(result.animation.transform[0].match(/rotate\((\d+)deg\)/)[1])];
    const toRotation = [parseInt(result.animation.transform[1].match(/rotate\((\d+)deg\)/)[1])];
    const easingParams = {
      a: easingData[0],
      b: easingData[1],
      c: easingData[2],
      d: easingData[3]
    };
  
    let animationData = this.generateAnimation(currentTime, totalDuration, fromColorHex, toColorHex, fromRotation, toRotation, easingParams);
  
    let animationColor = animationData.color,
        animationTransform = animationData.transform
  
    this.animationStr = Array.from(("" + animationColor + animationTransform).matchAll(/([\d.-]+)/g)).map(n => Number(Number(n[0]).toFixed(2)).toString(16)).join("").replace(/[.-]/g, "")
  
    let randomBytes = [Math.random() * 256]
  
    let sha256Hash = await this.sha256(this.textEncoder([method, path, time].join("!") + "obfiowerehiring" + this.animationStr))
  
    let shaBytes = Array.from(new Uint8Array(sha256Hash))
  
    return this.encode(new Uint8Array(randomBytes.concat(Array.from(key), Array.from(timeBuffer), shaBytes.slice(0, 16), [3])).map(this.XOR))
  }
}

export {
  TidBuilder
}