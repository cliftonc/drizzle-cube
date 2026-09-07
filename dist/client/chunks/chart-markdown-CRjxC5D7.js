import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { F as t } from "./chart-activity-grid-D6X0iOUw.js";
import * as n from "react";
import r, { useMemo as i } from "react";
import { jsx as a, jsxs as o } from "react/jsx-runtime";
//#region node_modules/markdown-to-jsx/dist/entities.browser.js
var s;
function c(e) {
	if (!s) {
		if (typeof document > "u") return;
		s = document.createElement("textarea");
	}
	var t = `&${e};`;
	s.innerHTML = t;
	var n = s.value;
	return n === t ? void 0 : n;
}
//#endregion
//#region node_modules/markdown-to-jsx/dist/index.js
var l = 32, u = 9, d = 13, f = 10, p = 96, m = 126, h = 91, g = 94, _ = 62, v = 35, y = 37, b = 45, x = 61, S = 92, C = 42, w = 95, T = 60, E = 64, D = 93, O = 33, k = 38, A = 58, j = 70, M = 102, N = 104, P = 119, F = 116, I = 112, L = 115, R = 160, ee = 12, te = 44, ne = 59, re = 63, ie = 46, ae = 47, oe = 39, se = 34, z = 43, B = 124, ce = 123, V = 125, le = 40, ue = 41, de = 78, fe = 110, pe = 79, me = 111, he = 120, ge = 88, _e = 30, H = 48, U = 57, W = 65, G = 90, K = 97, q = 122, ve = 128, J = 32, Y = {
	blockQuote: 0,
	breakLine: 1,
	breakThematic: 2,
	codeBlock: 3,
	codeInline: 4,
	footnote: 5,
	footnoteReference: 6,
	frontmatter: 7,
	gfmTask: 8,
	heading: 9,
	htmlBlock: 10,
	htmlComment: 11,
	htmlSelfClosing: 12,
	image: 13,
	link: 14,
	orderedList: 15,
	paragraph: 16,
	ref: 17,
	refCollection: 18,
	table: 19,
	text: 20,
	textFormatted: 21,
	unorderedList: 22
};
function ye(e) {
	if (!Ae(e, "---")) return null;
	let t = 3;
	for (; t < e.length && (e[t] === " " || e[t] === "	");) t++;
	if (t < e.length && e[t] === "\r" && t++, t >= e.length || e[t] !== "\n") return null;
	t++;
	let n = !1;
	for (; t < e.length;) {
		let r = t;
		for (; t < e.length && e[t] !== "\n" && e[t] !== "\r";) t++;
		if (t >= e.length) break;
		let i = t;
		if (e[t] === "\r" && t++, t < e.length && e[t] === "\n" && t++, Ae(e, "---", r)) return {
			endPos: t,
			hasValidYaml: n
		};
		if (!n) {
			let t = Ge(e, r, i);
			if (t < i) {
				let r = e.charCodeAt(t);
				if (r >= K && r <= q || r >= W && r <= G || r >= H && r <= U || r === w) {
					for (t++; t < i && (r = e.charCodeAt(t), r >= K && r <= q || r >= W && r <= G || r >= H && r <= U || r === w || r === b || r === ie);) t++;
					t < i && e.charCodeAt(t) === A && (t++, t >= i ? n = !0 : (r = e.charCodeAt(t), (r === l || r === u) && (n = !0)));
				}
			}
		}
	}
	return null;
}
var X = /&([a-zA-Z0-9]+|#[0-9]{1,7}|#x[0-9a-fA-F]{1,6});/gi, be = {
	class: "className",
	for: "htmlFor",
	allowfullscreen: "allowFullScreen",
	allowtransparency: "allowTransparency",
	autocomplete: "autoComplete",
	autofocus: "autoFocus",
	autoplay: "autoPlay",
	cellpadding: "cellPadding",
	cellspacing: "cellSpacing",
	charset: "charSet",
	classid: "classId",
	colspan: "colSpan",
	contenteditable: "contentEditable",
	contextmenu: "contextMenu",
	crossorigin: "crossOrigin",
	enctype: "encType",
	formaction: "formAction",
	formenctype: "formEncType",
	formmethod: "formMethod",
	formnovalidate: "formNoValidate",
	formtarget: "formTarget",
	frameborder: "frameBorder",
	hreflang: "hrefLang",
	inputmode: "inputMode",
	keyparams: "keyParams",
	keytype: "keyType",
	marginheight: "marginHeight",
	marginwidth: "marginWidth",
	maxlength: "maxLength",
	mediagroup: "mediaGroup",
	minlength: "minLength",
	novalidate: "noValidate",
	radiogroup: "radioGroup",
	readonly: "readOnly",
	rowspan: "rowSpan",
	spellcheck: "spellCheck",
	srcdoc: "srcDoc",
	srclang: "srcLang",
	srcset: "srcSet",
	tabindex: "tabIndex",
	usemap: "useMap",
	viewbox: "viewBox"
}, xe = {};
function Se(e) {
	if (!e) return xe;
	var t = {};
	for (var n in e) {
		var r = be[n.toLowerCase()];
		if (r) t[r] = e[n];
		else {
			var i = n.indexOf(":");
			i === -1 ? t[n] = e[n] : t[n.slice(0, i) + n[i + 1].toUpperCase() + n.slice(i + 2)] = e[n];
		}
	}
	return t;
}
var Ce = /(\n|^[-*]\s|^#|^ {2,}|^-{2,}|^>\s|^<(div|p|h[1-6]|ul|ol|li|blockquote|pre|table|thead|tbody|tr|td|th|dl|dt|dd|hr|address|article|aside|details|dialog|figure|figcaption|footer|form|header|main|menu|nav|section|summary|textarea|fieldset|legend|center|dir|hgroup|marquee|search|output|template)\b)/i;
function we(e) {
	return e.indexOf("&") === -1 ? e : e.replace(X, (e, t) => {
		var n = c(t);
		if (n) return n;
		if (t[0] === "#") {
			var r = t[1] === "x" || t[1] === "X" ? Number.parseInt(t.slice(2), 16) : Number.parseInt(t.slice(1), 10);
			return r === 0 || r >= 55296 && r <= 57343 || r > 1114111 ? "�" : r <= 65535 ? String.fromCharCode(r) : String.fromCharCode(55296 + (r - 65536 >> 10), 56320 + (r - 65536 & 1023));
		}
		return e;
	});
}
var Te = /(javascript|vbscript|data(?!:image)):/i;
function Ee(e) {
	if (Te.test(e)) return null;
	if (e.indexOf("%") === -1) return e;
	try {
		let t = decodeURIComponent(e).replace(/[^A-Za-z0-9/:]/g, "");
		if (Te.test(t)) return null;
	} catch {
		return null;
	}
	return e;
}
var Z = {}, De, Oe;
for (De = [
	192,
	193,
	194,
	195,
	196,
	197,
	224,
	225,
	226,
	227,
	228,
	229,
	230,
	198
], Oe = 0; Oe < De.length; Oe++) Z[De[Oe]] = "a";
for (Z[231] = Z[199] = "c", Z[240] = Z[208] = "d", De = [
	200,
	201,
	202,
	203,
	233,
	232,
	234,
	235
], Oe = 0; Oe < De.length; Oe++) Z[De[Oe]] = "e";
for (De = [
	207,
	239,
	206,
	238,
	205,
	237,
	204,
	236
], Oe = 0; Oe < De.length; Oe++) Z[De[Oe]] = "i";
for (Z[209] = Z[241] = "n", De = [
	248,
	216,
	339,
	338,
	213,
	245,
	212,
	244,
	211,
	243,
	210,
	242
], Oe = 0; Oe < De.length; Oe++) Z[De[Oe]] = "o";
for (De = [
	220,
	252,
	219,
	251,
	218,
	250,
	217,
	249
], Oe = 0; Oe < De.length; Oe++) Z[De[Oe]] = "u";
Z[376] = Z[255] = Z[221] = Z[253] = "y";
function ke(e) {
	for (var t = "", n = -1, r = e.length, i = 0; i < r; i++) {
		var a = e.charCodeAt(i);
		if (a >= K && a <= q || a >= H && a <= U) {
			n < 0 && (n = i);
			continue;
		}
		if (a >= W && a <= G) {
			n >= 0 && (t += e.slice(n, i), n = -1), t += String.fromCharCode(a + J);
			continue;
		}
		if (a === l || a === b) {
			n >= 0 && (t += e.slice(n, i), n = -1), t += "-";
			continue;
		}
		n >= 0 && (t += e.slice(n, i), n = -1);
		var o = Z[a];
		o && (t += o);
	}
	return n >= 0 && (t += e.slice(n)), t;
}
function Ae(e, t, n) {
	return e.startsWith(t, n);
}
var je = /* @__PURE__ */ new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr",
	"circle",
	"ellipse",
	"line",
	"path",
	"polygon",
	"polyline",
	"rect",
	"use",
	"stop",
	"animate",
	"set"
]);
function Me(e) {
	let t = e.toLowerCase();
	if (je.has(t)) return !0;
	let n = t.indexOf(":");
	return n !== -1 && (t = t.slice(n + 1), je.has(t));
}
var Ne = 1, Pe = 2, Q = 4, Fe = 8, Ie = 16, Le = 32, Re = 64, ze = (() => {
	var e = /* @__PURE__ */ new Uint8Array(128), t;
	for (e[u] = Ne, e[f] = Ne | Pe, e[ee] = Ne, e[d] = Ne | Pe, e[l] = Ne, t = O; t <= ae; t++) e[t] = Q;
	for (t = A; t <= E; t++) e[t] = Q;
	for (t = h; t <= p; t++) e[t] = Q;
	for (t = ce; t <= m; t++) e[t] = Q;
	for (t = H; t <= U; t++) e[t] = Ie;
	for (t = W; t <= G; t++) e[t] = Fe;
	for (t = K; t <= q; t++) e[t] = Fe;
	return e;
})(), Be = /[\p{P}\p{S}]/u, Ve = /\p{Zs}/u, He = [];
function Ue(e) {
	var t = e.indexOf("\r"), n = e.indexOf("\0");
	if (t === -1 && n === -1) return e;
	var r = e.length;
	He.length = 0;
	var i = 0, a = 0;
	for (a = t === -1 ? n : n === -1 || t < n ? t : n; a < r; a++) {
		var o = e.charCodeAt(a);
		o === d ? (i < a && He.push(e.slice(i, a)), a + 1 < r && e.charCodeAt(a + 1) === f && a++, He.push("\n"), i = a + 1) : o === 0 && (i < a && He.push(e.slice(i, a)), He.push("�"), i = a + 1);
	}
	return i < r && He.push(e.slice(i)), He.join("");
}
function We(e) {
	return e.replace(/>\s+</g, "><").replace(/\n+/g, " ").trim();
}
function Ge(e, t, n) {
	let r = n ?? e.length;
	for (; t < r && (e[t] === " " || e[t] === "	");) t++;
	return t;
}
function Ke(e) {
	if (!e) return !1;
	for (var t in e) return !0;
	return !1;
}
function qe(e) {
	return {
		attrs: {},
		children: [{
			type: Y.text,
			text: e
		}],
		c: !0,
		type: Y.htmlBlock,
		tag: "header"
	};
}
var Je = /^\n+/;
function Ye(e) {
	for (var t = e.length; t > 0 && (e[t - 1] === "\n" || e[t - 1] === "\r");) t--;
	return `${e.slice(0, t).replace(Je, "")}

`;
}
function Xe(e) {
	if ((e.type === Y.htmlSelfClosing || e.type === Y.htmlBlock) && e.a) return [];
	if (e.type === Y.paragraph) {
		var t = e.children;
		return t ? t.flatMap(Xe) : [];
	}
	return e.type === Y.text ? e.text?.trim() ? [e] : [] : e.type === Y.htmlBlock && e.children ? [{
		...e,
		children: e.children?.flatMap(Xe)
	}] : [e];
}
function Ze(e) {
	for (var t = 0; t < e.length; t++) {
		if (e[t].type === Y.htmlBlock) {
			var n = e[t], r = !1;
			if (n.c && t === e.length - 1) {
				var i = n.j === void 0 ? n.a ? n.e || "" : (n.e || "") + (n.h || "") : n.j, a = `</${String(n.tag).toLowerCase()}>`, o = i.toLowerCase().indexOf(a);
				o !== -1 && i.slice(o + a.length).replace(/<\/[a-z][a-z0-9-]*\s*>/gi, "").trim() && (r = !0);
			}
			r || (n.c = !1);
		}
		"children" in e[t] && e[t].children && Ze(e[t].children);
	}
}
function Qe(e, t) {
	for (var n = 0; n < e.length; n++) {
		var r = e[n];
		if (r.type === Y.paragraph && r.children) for (var i = r.children, a = 0; a < i.length; a++) {
			var o = i[a];
			if (o.type === Y.htmlSelfClosing && o.a && o.tag.toLowerCase() === t) {
				var s = e.slice(0, n);
				a > 0 && s.push({
					type: Y.paragraph,
					children: i.slice(0, a)
				});
				var c = [];
				if (a + 1 < i.length) {
					var l = i.slice(a + 1).filter((e) => !(e.type === Y.htmlSelfClosing && e.a));
					l.length > 0 && (c = l);
				}
				return c = c.concat(e.slice(n + 1)), {
					found: !0,
					beforeClose: s,
					afterClose: c
				};
			}
		}
		if ((r.type === Y.htmlSelfClosing || r.type === Y.htmlBlock) && r.a && r.tag.toLowerCase() === t) return {
			found: !0,
			beforeClose: e.slice(0, n),
			afterClose: e.slice(n + 1)
		};
	}
	return {
		found: !1,
		beforeClose: e,
		afterClose: []
	};
}
function $e(e) {
	var t = "";
	for (var n in e) {
		var r = e[n];
		r === !0 ? t += ` ${n}` : r !== void 0 && r != null && r !== !1 && (t += ` ${n}="${String(r)}"`);
	}
	return t;
}
function et(e, t, n, r) {
	var i;
	return i = t === void 0 ? $e(n) : t.length > 0 && t.charCodeAt(0) > l ? ` ${t}` : t, `<${e}${i}${r}`;
}
function tt(e) {
	var t = e.tag, n = e.type === Y.htmlSelfClosing, r = e, i = r.b, a = `</${t}>`;
	if (!n && r.a) return {
		kind: "literal",
		literal: (r.h || a) + (r.e || "")
	};
	if (n) {
		var o = e;
		return o.a ? {
			kind: "literal",
			literal: o.h || a
		} : o.m ? {
			kind: "literal",
			literal: o.m
		} : {
			kind: "literal",
			literal: et(t, i, e.attrs, " />")
		};
	}
	var s = et(t, i, e.attrs, ">"), c = r.children, l = c != null && c.length > 0;
	if (r.c && r.j !== void 0) return l ? {
		kind: "sandwich",
		open: s,
		close: a
	} : {
		kind: "literal",
		literal: r.j
	};
	if (r.c && !l) return {
		kind: "literal",
		literal: s + (r.e || "") + (r.h || a)
	};
	if (c != null && c.length > 0) {
		for (var u = "", d = 0; d < c.length; d++) {
			var f = c[d];
			if (f.type !== Y.text) return {
				kind: "sandwich",
				open: s,
				close: a
			};
			u += f.text;
		}
		return {
			kind: "literal",
			literal: s + u + a
		};
	}
	var p = r.e || "";
	return p && p.indexOf(a) !== -1 ? {
		kind: "literal",
		literal: s + p
	} : {
		kind: "literal",
		literal: s + p + a
	};
}
function nt(e, t, n) {
	var r = [], i = e, a = n;
	if (i && r.push(i), Array.isArray(t)) for (var o = 0; o < t.length; o++) r.push(t[o]);
	else t != null && r.push(t);
	a && r.push(a);
	for (var s = [], c = 0; c < r.length; c++) {
		var l = r[c];
		typeof l == "string" && s.length > 0 && typeof s.at(-1) == "string" ? s[s.length - 1] = s.at(-1) + l : s.push(l);
	}
	return s;
}
function rt(e) {
	return e == null || e.tagfilter !== !1;
}
function it(e, t, n, r) {
	var i = t(e, n, r);
	return i === null ? null : st(i);
}
function at(e) {
	var t = [];
	if (!e) return t;
	for (var n in e) n.charCodeAt(0) === 94 && t.push({
		identifier: n,
		footnote: e[n].target
	});
	return t;
}
function ot(e, t, n) {
	if (t.indexOf(".") === -1) return e?.[t] || n;
	for (var r = e, i = t.split("."), a = 0; a < i.length && (r = r?.[i[a]], r !== void 0);) a++;
	return r || n;
}
function st(e) {
	for (var t = !1, n = 0; n < e.length; n++) {
		var r = e.charCodeAt(n);
		if (r <= l || r === se || r === y || r === T || r === _ || r === h || r === S || r === D || r === g || r === p || r >= 123) {
			t = !0;
			break;
		}
	}
	if (!t) return e;
	for (var i = "", n = 0; n < e.length; n++) {
		var r = e.charCodeAt(n);
		if (r === y && n + 2 < e.length) {
			var a = e.charCodeAt(n + 1), o = e.charCodeAt(n + 2);
			if ((a >= H && a <= U || a >= W && a <= j || a >= K && a <= M) && (o >= H && o <= U || o >= W && o <= j || o >= K && o <= M)) {
				i += e[n] + e[n + 1] + e[n + 2], n += 2;
				continue;
			}
		}
		if (r >= 55296 && r <= 57343) {
			if (r <= 56319 && n + 1 < e.length) {
				var s = e.charCodeAt(n + 1);
				if (s >= 56320 && s <= 57343) {
					i += encodeURI(e[n] + e[n + 1]), n++;
					continue;
				}
			}
			i += e[n];
			continue;
		}
		i += encodeURI(e[n]);
	}
	return i;
}
function ct(...e) {
	return e.filter(Boolean).join(" ");
}
var lt = /* @__PURE__ */ new Set([
	"title",
	"textarea",
	"style",
	"xmp",
	"iframe",
	"noembed",
	"noframes",
	"script",
	"plaintext"
]), ut = /<(\/?)(title|textarea|style|xmp|iframe|noembed|noframes|script|plaintext)(\s|>|\/)/gi;
function dt(e) {
	return lt.has(e.toLowerCase());
}
function ft(e) {
	return ut.lastIndex = 0, ut.test(e);
}
function pt(e) {
	return ut.lastIndex = 0, e.replace(ut, (e, t, n, r) => `&lt;${t}${n}${r}`);
}
function mt(e, t) {
	var n = e || {}, r = n.slugify, i;
	if (r) {
		var a = r;
		i = (e) => a(e, ke);
	} else i = ke;
	return {
		disableAutoLink: n.disableAutoLink,
		disableFrontmatter: n.disableFrontmatter,
		disableParsingRawHTML: n.disableParsingRawHTML,
		enforceAtxHeadings: n.enforceAtxHeadings,
		evalUnserializableExpressions: n.evalUnserializableExpressions,
		forceBlock: n.forceBlock,
		forceInline: t === void 0 ? n.forceInline : t,
		ignoreHTMLBlocks: n.ignoreHTMLBlocks,
		optimizeForStreaming: n.optimizeForStreaming,
		preserveFrontmatter: n.preserveFrontmatter,
		sanitizer: n.sanitizer || Ee,
		slugify: i,
		tagfilter: rt(n)
	};
}
var ht = /^<([a-zA-Z][a-zA-Z0-9-]*)\s[^>]*>/, gt = /^<[A-Z]/, _t = [
	"script",
	"pre",
	"style",
	"textarea"
], vt = new Set(_t), yt = /<(?:pre|script|style|textarea)\b/i, bt = /<(?:pre|script|style|textarea)\b/iy, xt = /^(\s{0,3}#[#\s]|\s{0,3}[-*+]\s|\s{0,3}\d+\.\s|\s{0,3}>\s|\s{0,3}```)/m, St = /^<([a-z][^ >/\n\r]*) ?([^>]*?)>/im, Ct = /* @__PURE__ */ new Uint8Array(128);
(() => {
	for (var e = [
		p,
		C,
		w,
		m,
		x,
		h,
		O,
		T,
		S,
		k,
		f,
		N,
		P,
		M
	], t = 0; t < e.length; t++) Ct[e[t]] = 1;
})();
var wt = /([a-zA-Z_][a-zA-Z0-9_-]*)=(?:"([^"]*)"|'([^']*)')/g;
function Tt(e) {
	return vt.has(e);
}
function Et(e) {
	return yt.test(e);
}
function Dt(e, t, n) {
	for (var r = t, i = n; r < i && (e.charCodeAt(r) === l || e.charCodeAt(r) === u);) r++;
	if (r >= i) return !1;
	e.charCodeAt(r) === B && r++;
	for (var a = 0; r < i;) {
		for (; r < i && (e.charCodeAt(r) === l || e.charCodeAt(r) === u);) r++;
		if (r >= i) break;
		if (e.charCodeAt(r) === B && a > 0) {
			for (var o = r + 1; o < i && (e.charCodeAt(o) === l || e.charCodeAt(o) === u);) o++;
			if (o >= i) return !0;
		}
		if (e.charCodeAt(r) === A && r++, r >= i || e.charCodeAt(r) !== b) return !1;
		for (; r < i && e.charCodeAt(r) === b;) r++;
		for (r < i && e.charCodeAt(r) === A && r++, a++; r < i && (e.charCodeAt(r) === l || e.charCodeAt(r) === u);) r++;
		if (r < i) {
			if (e.charCodeAt(r) === B) r++;
			else return !1;
		}
	}
	return a > 0;
}
var Ot = /[\u0000-\u001F\u007F]/g, kt = {
	action: 1,
	background: 1,
	cite: 1,
	data: 1,
	formaction: 1,
	href: 1,
	longdesc: 1,
	poster: 1,
	src: 1,
	"xlink:href": 1
}, At = /&#(x[0-9a-f]+|[0-9]+);?/gi;
function jt(e) {
	return e.indexOf("&#") === -1 ? e : e.replace(At, (e, t) => {
		var n = t.charCodeAt(0) === he || t.charCodeAt(0) === ge ? Number.parseInt(t.slice(1), 16) : Number.parseInt(t, 10);
		return n > 0 && n <= 1114111 ? String.fromCodePoint(n) : e;
	});
}
function Mt(e, t, n) {
	if (n && t.charCodeAt(0) === ce) return !1;
	var r = e.charCodeAt(0), i = e.charCodeAt(1);
	if ((r === me || r === pe) && (i === fe || i === de)) return !(n && t === "");
	var a = e.toLowerCase();
	if (a === "srcdoc") return !0;
	if (a === "style") return /url\s*\(\s*(javascript|vbscript|data:(?!image\/))/i.test(t);
	if (kt[a] === 1) {
		var o = jt(we(t));
		if (Ee(o) === null) return !0;
		var s = o.replace(Ot, "");
		return s !== o && Ee(s) === null;
	}
	return !1;
}
function Nt(e) {
	return "<" + (e.f ? "/" : "") + e.tag + e.g + e.b + (e.n ? e.r ? " />" : "/>" : ">");
}
function Pt(e, t, n, r) {
	for (var i = [], a = t, o = 0; o < r.length; o += 2) {
		var s = r[o];
		if (s > a) {
			var c = e.slice(a, s).trim();
			c && i.push(c);
		}
		a = r[o + 1];
	}
	if (a < n) {
		var l = e.slice(a, n).trim();
		l && i.push(l);
	}
	return i.join(" ");
}
function Ft(e, t) {
	if (e.charCodeAt(t) !== T) return null;
	let n = t + 1, r = e.length, i = !1;
	e.charCodeAt(n) === ae && (n++, i = !0);
	let a = n, o = e.charCodeAt(n);
	if (!(o >= K && o <= q || o >= W && o <= G)) return null;
	for (; n < r && (e.charCodeAt(n) >= K && e.charCodeAt(n) <= q || e.charCodeAt(n) >= W && e.charCodeAt(n) <= G || e.charCodeAt(n) >= H && e.charCodeAt(n) <= U || e.charCodeAt(n) === b);) n++;
	let s = e.slice(a, n);
	if (!s) return null;
	let c = s.charCodeAt(0), d = c >= W && c <= G || s.indexOf("-") !== -1, m = n;
	for (; n < r && (e.charCodeAt(n) === l || e.charCodeAt(n) === u || e.charCodeAt(n) === f);) n++;
	let h = e.slice(m, n);
	if (n === m && n < r) {
		var g = e.charCodeAt(n);
		if (g !== _ && g !== ae) return null;
	}
	let v = n, y = {}, S = !1;
	for (var C = null; n < r;) {
		let t = e.charCodeAt(n);
		if (t === _) {
			let t = C ? Pt(e, v, n, C) : e.slice(v, n);
			return {
				r: S,
				u: d,
				f: i,
				b: t,
				q: C != null,
				n: !1,
				g: h,
				attrs: y,
				end: n + 1,
				tag: s
			};
		}
		if (t === l || t === u || t === f) {
			n++;
			continue;
		}
		if (t === ae && n + 1 < r && e.charCodeAt(n + 1) === _) {
			S = n > v && e.charCodeAt(n - 1) === l;
			let t = C ? Pt(e, v, n, C) : e.slice(v, n);
			return {
				r: S,
				u: d,
				f: i,
				b: t,
				q: C != null,
				n: !0,
				g: h,
				attrs: y,
				end: n + 2,
				tag: s
			};
		}
		var E = n, D = e.charCodeAt(n);
		if (!(D >= K && D <= q || D >= W && D <= G || D === w || D === A)) return null;
		for (n++; n < r;) {
			var O = e.charCodeAt(n);
			if (O >= K && O <= q || O >= W && O <= G || O >= H && O <= U || O === w || O === ie || O === A || O === b) n++;
			else break;
		}
		for (var k = e.slice(E, n), j = n; n < r && (e.charCodeAt(n) === l || e.charCodeAt(n) === u);) n++;
		var M, N;
		if (e.charCodeAt(n) === x) {
			for (n++; n < r && (e.charCodeAt(n) === l || e.charCodeAt(n) === u);) n++;
			var P = e.charCodeAt(n);
			if (P === se || P === oe) {
				n++;
				for (var F = n; n < r && e.charCodeAt(n) !== P;) n++;
				if (n >= r) return null;
				if (M = e.slice(F, n), n++, n < r) {
					var I = e.charCodeAt(n);
					if (I !== l && I !== u && I !== f && I !== _ && I !== ae) return null;
				}
				N = n;
			} else if (P === ce) {
				var L = 1, F = n;
				for (n++; n < r && L > 0;) {
					var O = e.charCodeAt(n);
					O === ce ? L++ : O === V && L--, n++;
				}
				M = e.slice(F, n), N = n;
			} else {
				for (var F = n; n < r;) {
					var R = e.charCodeAt(n);
					if (R === l || R === u || R === _ || R === f || R === se || R === oe || R === x || R === T || R === p) break;
					n++;
				}
				if (n === F) return null;
				M = e.slice(F, n), N = n;
			}
		} else M = "", N = j;
		Mt(k, M, d) ? (C === null && (C = []), C.push(E, N)) : y[k] = M;
	}
	return null;
}
function It(e) {
	var t = e.indexOf("<");
	if (t === -1) return e;
	for (var n = "", r = 0, i = !1; t !== -1;) {
		var a = Ft(e, t);
		a ? (a.q && (n += e.slice(r, t) + Nt(a), r = a.end, i = !0), t = e.indexOf("<", a.end)) : t = e.indexOf("<", t + 1);
	}
	return i ? n + e.slice(r) : e;
}
function Lt(e, t, n) {
	if (!n.optimizeForStreaming && e.indexOf("[") === -1) return !1;
	for (var r = 0, i = e.length, a = !1, o = !1; r < i;) {
		for (var s = e.indexOf("\n", r), c = s < 0 ? i : s, d = r, y = 0; d < c && y < 4;) if (e.charCodeAt(d) === l) y++, d++;
		else if (e.charCodeAt(d) === u) y += 4, d++;
		else break;
		if (d >= c) {
			a = !1, r = s < 0 ? i : s + 1;
			continue;
		}
		if (y < 4) {
			var x = e.charCodeAt(d);
			if (x === p || x === m) {
				for (var S = x, T = 0, E = d; E < c && e.charCodeAt(E) === S;) T++, E++;
				if (T >= 3) {
					var D = !0;
					if (S === p) {
						for (var O = E; O < c; O++) if (e.charCodeAt(O) === p) {
							D = !1;
							break;
						}
					}
					if (D) {
						a = !1;
						for (var k = s < 0 ? i : s + 1; k < i;) {
							for (var A = k, j = 0; A < i && j < 4;) {
								var M = e.charCodeAt(A);
								if (M === l) j++, A++;
								else if (M === u) j += 4, A++;
								else break;
							}
							if (j < 4 && A < i && e.charCodeAt(A) === S) {
								for (var N = 0; A < i && e.charCodeAt(A) === S;) N++, A++;
								if (N >= T) {
									for (; A < i && (e.charCodeAt(A) === l || e.charCodeAt(A) === u);) A++;
									if (A >= i || e.charCodeAt(A) === f) {
										r = A >= i ? i : A + 1;
										break;
									}
								}
							}
							for (; k < i && e.charCodeAt(k) !== f;) k++;
							k < i && k++;
						}
						k >= i && (r = i, o = !0);
						continue;
					}
				}
			}
		}
		for (var P = d; P < c && e.charCodeAt(P) === _;) {
			P++, P < c && e.charCodeAt(P) === l && P++;
			for (var F = 0; P < c && F < 4;) if (e.charCodeAt(P) === l) F++, P++;
			else if (e.charCodeAt(P) === u) F += 4, P++;
			else break;
			if (F >= 4) break;
			a = !1;
		}
		if (!a && y < 4 && P < c && e.charCodeAt(P) === h && !(P + 1 < i && e.charCodeAt(P + 1) === g)) {
			var I = Rt(e, P, t);
			if (I) {
				r = I, a = !1;
				continue;
			}
		}
		var L = e.charCodeAt(d);
		if (L === v && y < 4) a = !1;
		else if (y < 4 && (L === b || L === C || L === w)) {
			for (var R = d, ee = 0; R < c;) {
				var te = e.charCodeAt(R);
				if (te === L) ee++;
				else if (te !== l && te !== u) break;
				R++;
			}
			a = !(ee >= 3 && R >= c);
		} else a = !0;
		r = s < 0 ? i : s + 1;
	}
	return o;
}
function Rt(e, t, n) {
	let r = e.length;
	if (e.charCodeAt(t) !== h) return null;
	let i = t + 1 < r && e.charCodeAt(t + 1) === g, a = t + 1;
	for (; a < r;) {
		var o = e.charCodeAt(a);
		if (o === D) {
			a++;
			break;
		}
		if (o === h) return null;
		o === S && a + 1 < r && a++, a++;
	}
	if (a > r || e.charCodeAt(a - 1) !== D) return null;
	let s = e.slice(t + 1, a - 1);
	if (s.length > 999) return null;
	let c = Ht(s);
	if (!c || a >= r || e.charCodeAt(a) !== A) return null;
	a++;
	let d = !1;
	for (; a < r;) {
		let t = e.charCodeAt(a);
		if (t === l || t === u) a++;
		else if (t === f && !d) d = !0, a++;
		else break;
	}
	if (i) {
		let t = e.indexOf("\n", a);
		return n[c] = {
			target: e.slice(a, t < 0 ? r : t).trim(),
			title: void 0
		}, t < 0 ? r : t + 1;
	}
	var p;
	if (a < r && e.charCodeAt(a) === T) {
		a++;
		for (var m = a; a < r && e.charCodeAt(a) !== _ && e.charCodeAt(a) !== f;) e.charCodeAt(a) === S && a + 1 < r && a++, a++;
		if (a >= r || e.charCodeAt(a) !== _) return null;
		p = e.slice(m, a), a++;
		for (var v = e.indexOf("\n", a), y = v < 0 ? r : v, b = a; b < y && (e.charCodeAt(b) === l || e.charCodeAt(b) === u);) b++;
		if (b < y) {
			if (b === a) return null;
			var x = e.charCodeAt(b);
			if (x !== se && x !== oe && x !== le) return null;
		}
	} else {
		for (var m = a, C = 0; a < r;) {
			var o = e.charCodeAt(a);
			if (o === le) C++;
			else if (o === ue) {
				if (C === 0) break;
				C--;
			} else {
				if (o === l || o === u || o === f) break;
				o === S && a + 1 < r && a++;
			}
			a++;
		}
		if (p = e.slice(m, a), !p) return null;
	}
	for (; a < r && (e.charCodeAt(a) === l || e.charCodeAt(a) === u);) a++;
	var w = e.indexOf("\n", a), E = w < 0 ? r : w, O, k = !1, j = a, M = a;
	if (a === E && a < r) for (M = a + 1; M < r && (e.charCodeAt(M) === l || e.charCodeAt(M) === u);) M++;
	if (M < r) {
		var N = e.charCodeAt(M);
		if (N === se || N === oe || N === le) {
			for (var P = N === le ? 41 : N, F = M + 1, I = F; F < r;) {
				var L = e.charCodeAt(F);
				if (L === P) {
					for (var R = F + 1; R < r && (e.charCodeAt(R) === l || e.charCodeAt(R) === u);) R++;
					(R >= r || e.charCodeAt(R) === f) && (O = e.slice(I, F), k = !0, j = R < r ? R + 1 : r);
					break;
				}
				if (L === S && F + 1 < r) {
					F += 2;
					continue;
				}
				if (L === f && F + 1 < r && e.charCodeAt(F + 1) === f) break;
				F++;
			}
			if (!k && M === a) return null;
		}
	}
	if (k) return n[c] || (n[c] = {
		target: we(Wt(p)),
		title: O === void 0 ? O : we(Wt(O))
	}), j;
	for (; a < E && (e.charCodeAt(a) === l || e.charCodeAt(a) === u);) a++;
	return a < E ? null : (n[c] || (n[c] = {
		target: we(Wt(p)),
		title: O
	}), w < 0 ? r : w + 1);
}
var zt = new Uint8Array(ze);
for (zt[v] |= Le, zt[_] |= Le, zt[b] |= Le | Re, zt[z] |= Le, zt[C] |= Le | Re, zt[w] |= Le | Re, zt[p] |= Le | Re, zt[m] |= Le | Re, zt[T] |= Le | Re, zt[h] |= Re, zt[O] |= Re, zt[B] |= Le, Bt = H; Bt <= U; Bt++) zt[Bt] |= Le;
var Bt;
function Vt(e) {
	if (e.indexOf("[") < 0 && e.indexOf("]") < 0) return !1;
	for (var t = 0; t < e.length; t++) {
		if (e.charCodeAt(t) === S) {
			t++;
			continue;
		}
		if (e.charCodeAt(t) === h || e.charCodeAt(t) === D) return !0;
	}
	return !1;
}
function Ht(e) {
	for (var t = e.length, n = !0, r = t > 0, i = 0; i < t; i++) {
		var a = e.charCodeAt(i);
		if (a === l) {
			if (n) {
				r = !1;
				break;
			}
			n = !0;
		} else if (a < 33 || a > 126 || a >= W && a <= G) {
			r = !1;
			break;
		} else n = !1;
	}
	if (r && !n) return e;
	var o = e.replace(/\s+/g, " ").trim();
	return o.indexOf("ẞ") === -1 ? o.toLowerCase() : o.replace(/\u1E9E/g, "ss").toLowerCase();
}
function Ut(e) {
	return e < ve ? zt[e] : e === R ? Ne : 0;
}
function Wt(e) {
	return e.indexOf("\\") === -1 ? e : e.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, "$1");
}
var Gt = null, Kt = -1, qt = -1;
function Jt(e, t) {
	if (t >= Kt && t <= qt && e === Gt) return qt;
	var n = e.indexOf("\n", t), r = n < 0 ? e.length : n;
	return Gt = e, Kt = t, qt = r, r;
}
function $(e, t) {
	let n = Jt(e, t);
	return n < e.length ? n + 1 : n;
}
function Yt(e, t, n) {
	for (; t < n;) {
		let n = e.charCodeAt(t);
		if (n !== l && n !== u) break;
		t++;
	}
	return t;
}
function Xt(e, t) {
	let n = $(e, t);
	for (; n < e.length;) {
		let t = Jt(e, n);
		if (tn(e, n, t)) return n;
		n = $(e, n);
	}
	return e.length;
}
function Zt(e, t, n, r) {
	let i = 0;
	for (; t + i < n && e.charCodeAt(t + i) === r;) i++;
	return i;
}
var Qt = 0, $t = 0;
function en(e, t, n) {
	for (Qt = 0, $t = 0; t + $t < n;) {
		let n = e.charCodeAt(t + $t);
		if (n === u) Qt += 4 - Qt % 4;
		else if (n === l) Qt++;
		else break;
		$t++;
	}
}
function tn(e, t, n) {
	return Yt(e, t, n) >= n;
}
function nn(e, t) {
	if (!e) return e;
	var n = t.v ||= Object.create(null), r = n[e];
	if (r === void 0) return n[e] = 0, e;
	for (var i = r + 1, a = `${e}-${i}`; n[a] !== void 0;) i++, a = `${e}-${i}`;
	return n[e] = i, n[a] = 0, a;
}
function rn(e, t, n, r) {
	let i = Jt(e, t);
	if (en(e, t, i), Qt > 3) return null;
	let a = t + $t;
	if (e.charCodeAt(a) !== v) return null;
	let o = Zt(e, a, i, 35);
	if (o < 1 || o > 6 || (a += o, a < i && e.charCodeAt(a) !== l && e.charCodeAt(a) !== u)) return null;
	a = Yt(e, a, i);
	for (var s = i; s > a && e.charCodeAt(s - 1) === l;) s--;
	for (var c = s; s > a && e.charCodeAt(s - 1) === v;) s--;
	if (s < c) {
		if (s === a || e.charCodeAt(s - 1) === l) for (; s > a && e.charCodeAt(s - 1) === l;) s--;
		else s = c;
	}
	let d = Mn(e.slice(a, s), !1, n, r);
	return {
		node: {
			type: Y.heading,
			level: o,
			children: d,
			id: ""
		},
		end: $(e, i)
	};
}
function an(e, t, n) {
	var r = e.charCodeAt(t);
	if (r !== x && r !== b) return !1;
	for (var i = t; i < n && e.charCodeAt(i) === r;) i++;
	for (; i < n && (e.charCodeAt(i) === l || e.charCodeAt(i) === u);) i++;
	return i >= n;
}
function on(e, t) {
	let n = Jt(e, t);
	if (en(e, t, n), Qt > 3) return null;
	let r = t + $t, i = e.charCodeAt(r);
	if (i !== b && i !== C && i !== w) return null;
	let a = 0;
	for (; r < n;) {
		let t = e.charCodeAt(r);
		if (t === i) a++;
		else if (t !== l && t !== u) return null;
		r++;
	}
	return a < 3 ? null : {
		node: { type: Y.breakThematic },
		end: $(e, n)
	};
}
var sn = 0, cn = 0, ln = "";
function un(e, t, n) {
	let r = Jt(e, t);
	if (en(e, t, r), Qt > 3) return null;
	let i = Qt, a = t + $t, o = e.charCodeAt(a);
	if (o !== p && o !== m) return null;
	let s = Zt(e, a, r, o);
	if (s < 3) return null;
	a += s;
	let c = Yt(e, a, r), d = r;
	if (o === p) {
		for (let t = c; t < r; t++) if (e.charCodeAt(t) === p) return null;
	}
	for (; d > c && (e.charCodeAt(d - 1) === l || e.charCodeAt(d - 1) === u);) d--;
	let h = e.slice(c, d), g = "", _ = "", v = h.indexOf(" ");
	v === -1 ? g = h : (g = h.slice(0, v), _ = h.slice(v + 1).trim()), g = Wt(g);
	var y;
	if (_) {
		wt.lastIndex = 0;
		for (var b; (b = wt.exec(_)) != null;) y ||= {}, y[b[1]] = b[2] === void 0 ? b[3] : b[2];
	}
	let x = $(e, r), S = e.length, C = e.length;
	var w;
	o === sn && s === cn ? w = ln : (w = String.fromCharCode(o).repeat(s), sn = o, cn = s, ln = w);
	for (var T = x; T < e.length;) {
		var E = e.indexOf(w, T);
		if (E === -1) break;
		for (var D = E, O = 0; D > 0 && O < 4 && e.charCodeAt(D - 1) === l;) D--, O++;
		if (O <= 3 && (D === 0 || e.charCodeAt(D - 1) === f)) {
			for (var k = E + s; k < e.length && e.charCodeAt(k) === o;) k++;
			var A = Jt(e, k);
			if (tn(e, k, A)) {
				S = D, C = $(e, A);
				break;
			}
		}
		T = E + 1;
	}
	var j;
	if (i === 0) j = S > x && e.charCodeAt(S - 1) === f ? e.slice(x, S - 1) : e.slice(x, S);
	else {
		j = "";
		for (var M = x; M < S;) {
			var N = Jt(e, M);
			en(e, M, N), j += `${e.slice(M + Math.min($t, i), N)}
`, M = $(e, N);
		}
		j.length > 0 && j.charCodeAt(j.length - 1) === f && (j = j.slice(0, -1));
	}
	return {
		node: {
			type: Y.codeBlock,
			lang: g || void 0,
			text: j,
			infoString: _ || void 0,
			attrs: y
		},
		end: C
	};
}
function dn(e, t, n) {
	for (var r = 0, i = t; i < n && r < 4;) e.charCodeAt(i) === u ? r += 4 - r % 4 : r++, i++;
	if (r < 4) return "";
	for (var a = "", o = 4; o < r; o++) a += " ";
	return a + e.slice(i, n);
}
function fn(e, t) {
	if (en(e, t, Jt(e, t)), Qt < 4) return null;
	let n = "", r = t;
	for (; r < e.length;) {
		let t = Jt(e, r);
		if (en(e, r, t), tn(e, r, t)) {
			for (var i = `${dn(e, r, t)}
`, a = $(e, t); a < e.length;) {
				var o = Jt(e, a);
				if (tn(e, a, o)) {
					i += `${dn(e, a, o)}
`, a = $(e, o);
					continue;
				}
				en(e, a, o), Qt >= 4 && (n += i, r = a);
				break;
			}
			if (r !== a) break;
			continue;
		}
		if (Qt < 4) break;
		let f = 0, p = 0;
		var s = 0;
		for (let n = r; n < t && p < 4; n++) {
			if (e.charCodeAt(n) === u) {
				var c = 4 - p % 4;
				p + c > 4 && (s = p + c - 4), p += c;
			} else p++;
			f++;
		}
		var l = "";
		if (s > 0) for (var d = 0; d < s; d++) l += " ";
		l += e.slice(r + f, t), n += `${l}
`, r = $(e, t);
	}
	for (; n.length > 0 && n.charCodeAt(n.length - 1) === f;) n = n.slice(0, -1);
	return n ? {
		node: {
			type: Y.codeBlock,
			lang: void 0,
			text: n,
			infoString: void 0,
			attrs: void 0
		},
		end: r
	} : null;
}
function pn(e, t, n, r) {
	if (en(e, t, Jt(e, t)), Qt > 3) return null;
	let i = t + $t;
	if (e.charCodeAt(i) !== _) return null;
	let a = "", o = t, s, c = !1, d = !1, f = !1;
	for (; o < e.length;) {
		let t = Jt(e, o);
		en(e, o, t);
		let n = o + $t;
		if (e.charCodeAt(n) === _) {
			let r = n + 1;
			var h = Qt + 1, g = !1;
			if (r < t) {
				var y = e.charCodeAt(r);
				y === l ? (r++, h++, g = !0) : y === u && (g = !0);
			}
			for (var x = "", S = !1, E = r; E < t; E++) if (e.charCodeAt(E) === u) {
				S = !0;
				break;
			}
			if (S) {
				var D = h;
				if (g && r < t && e.charCodeAt(r) === u) {
					for (var O = 4 - D % 4, k = 0; k < O - 1; k++) x += " ";
					D += O, r++;
				}
				for (var A = r; A < t; A++) if (e.charCodeAt(A) === u) {
					for (var j = 4 - D % 4, M = 0; M < j; M++) x += " ";
					D += j;
				} else x += e[A], D++;
			} else x = e.slice(r, t);
			if (!(a || s)) {
				let n = x.match(/^\[!([A-Za-z]+)\]\s*$/);
				if (n) {
					s = n[1].toUpperCase(), o = $(e, t);
					continue;
				}
			}
			a += `${x}
`;
			var N = x.trimStart();
			N.startsWith("```") || N.startsWith("~~~") ? f = !f : (x.startsWith("    ") || x.startsWith("	")) && (f = !0), d = N.length > 0, o = $(e, t);
		} else if (a && !tn(e, o, t) && d) {
			if (Qt < 4) {
				var P = o + $t, F = P < t ? e.charCodeAt(P) : 0;
				if (F === v || F === _ || F === p || F === m || F === T || (F === b || F === C || F === w) && on(e, o) || (F === b || F === C || F === z) && P + 1 < t && (e.charCodeAt(P + 1) === l || e.charCodeAt(P + 1) === u)) break;
				if (F >= H && F <= U) {
					for (var I = P; I < t && e.charCodeAt(I) >= H && e.charCodeAt(I) <= U;) I++;
					if (I < t && (e.charCodeAt(I) === ie || e.charCodeAt(I) === ue)) break;
				}
			}
			if (f) break;
			a += `${e.slice(o, t)}
`, c = !0, o = $(e, t);
		} else break;
	}
	if (!(a || s)) return null;
	var { inBlockQuote: L, l: R } = n;
	n.inBlockQuote = !0, c && (n.l = !0);
	var ee = n.i;
	n.i = ee || !tn(e, o, e.length);
	let te = _r(a || "", n, r);
	return n.i = ee, n.inBlockQuote = L, n.l = R, {
		node: {
			type: Y.blockQuote,
			children: te,
			alert: s || void 0
		},
		end: o
	};
}
function mn(e, t, n) {
	for (var r = 0, i = t; i < n; i++) e.charCodeAt(i) === u ? r += 4 - r % 4 : r++;
	return r;
}
function hn(e, t, n) {
	if (en(e, t, n), Qt > 3) return null;
	var r = t + $t;
	if (r >= n) return null;
	var i = e.charCodeAt(r), a = Qt, o = r, s = r;
	if (i === b || i === C || i === z) {
		if (o = r + 1, o < n && e.charCodeAt(o) !== l && e.charCodeAt(o) !== u && e.charCodeAt(o) !== f) return null;
	} else if (i >= H && i <= U) {
		for (; s < n && s - r < 9;) {
			var c = e.charCodeAt(s);
			if (c < H || c > U) break;
			s++;
		}
		if (s > r && s < n) {
			var d = e.charCodeAt(s);
			if (d === ie || d === ue) {
				if (o = s + 1, o < n && e.charCodeAt(o) !== l && e.charCodeAt(o) !== u && e.charCodeAt(o) !== f) return null;
			} else return null;
		} else return null;
	} else return null;
	var p = o, m = mn(e, t, o), h = 0, g = p, _ = m;
	if (p >= n) return {
		ordered: i >= H && i <= U,
		marker: i >= H && i <= U ? e[s] : e[r],
		start: i >= H && i <= U ? Number.parseInt(e.slice(r, s), 10) : void 0,
		contentStart: p,
		contentCol: m + 1,
		markerCol: a,
		isEmpty: !0
	};
	for (; g < n && (e.charCodeAt(g) === l || e.charCodeAt(g) === u);) {
		if (e.charCodeAt(g) === u) {
			var v = 4 - _ % 4;
			_ += v;
		} else _++;
		g++, h++;
	}
	var y = g >= n, x = _ - m;
	return y || x > 4 ? (_ = m + 1, g = p + 1, h = 1) : h === 0 && (_ = m + 1, g = p, h = 1), {
		ordered: i >= H && i <= U,
		marker: i >= H && i <= U ? e[s] : e[r],
		start: i >= H && i <= U ? Number.parseInt(e.slice(r, s), 10) : void 0,
		contentStart: g,
		contentCol: _,
		markerCol: a,
		isEmpty: y
	};
}
var gn = 0;
function _n(e, t, n, r) {
	var i = 0, a = t;
	for (gn = 0; a < n && i < r;) {
		var o = e.charCodeAt(a);
		if (o === u) {
			var s = 4 - i % 4;
			if (i + s > r) {
				gn = i + s - r, a++, i = r;
				break;
			}
			i += s;
		} else if (o === l) i++;
		else break;
		a++;
	}
	return a;
}
function vn(e, t, n, r) {
	var i = Jt(e, t), a = hn(e, t, i);
	if (!a) return null;
	var o = [], s = t, c = a.contentCol, g = "", y = a.isEmpty, x = !1, S = !1;
	if (!a.isEmpty) {
		for (var E = !1, O = a.contentStart; O < i; O++) if (e.charCodeAt(O) === u) {
			E = !0;
			break;
		}
		if (E) {
			var k = "", A = mn(e, t, a.contentStart), j = A - a.contentCol;
			if (j > 0) for (var M = 0; M < j; M++) k += " ";
			for (var N = a.contentStart; N < i; N++) if (e.charCodeAt(N) === u) {
				for (var P = 4 - A % 4, F = 0; F < P; F++) k += " ";
				A += P;
			} else k += e[N], A++;
			g = `${k}
`;
		} else g = `${e.slice(a.contentStart, i)}
`;
	}
	for (s = $(e, i); s < e.length;) {
		var I = Jt(e, s);
		en(e, s, I);
		var L = e.charCodeAt(s + $t);
		if (Qt < c && (L === b || L === C || L === w) && Qt <= 3 && on(e, s)) break;
		var R = hn(e, s, I);
		if (R && R.ordered === a.ordered && R.marker === a.marker && R.markerCol < c) {
			o.push({
				contentCol: c,
				raw: g,
				hasBlankAfter: x,
				isEmpty: y
			}), x && (S = !0), c = R.contentCol, y = R.isEmpty, x = !1, g = R.isEmpty ? "" : `${e.slice(R.contentStart, I)}
`, s = $(e, I);
			continue;
		}
		if (tn(e, s, I)) {
			var ee = _n(e, s, I, c);
			if (gn > 0 || ee < I) {
				for (var te = "", ne = 0; ne < gn; ne++) te += " ";
				g += `${te + e.slice(ee, I)}
`;
			} else g += "\n";
			s = $(e, I);
			for (var re = !1, ie = 0; ie < g.length; ie++) {
				var ae = g.charCodeAt(ie);
				if (ae !== f && ae !== d && ae !== l && ae !== u) {
					re = !0;
					break;
				}
			}
			if (y && !re) {
				if (s < e.length) {
					var oe = Jt(e, s), se = hn(e, s, oe);
					if (!se || se.ordered !== a.ordered || se.marker !== a.marker) break;
					x = !0;
				} else break;
			}
			if (s < e.length) {
				var B = Jt(e, s);
				en(e, s, B);
				var ce = e.charCodeAt(s + $t);
				if ((ce === b || ce === C || ce === w) && Qt <= 3 && on(e, s)) break;
				var V = hn(e, s, B);
				if (V && V.ordered === a.ordered && V.marker === a.marker && V.markerCol < c) {
					x = !0;
					continue;
				}
				if (!tn(e, s, B) && Qt < c) break;
			}
			continue;
		}
		if (Qt >= c) {
			var le = _n(e, s, I, c);
			if (gn > 0) {
				for (var ue = "", de = c, fe = 0; fe < gn; fe++) ue += " ", de++;
				for (var pe = le; pe < I; pe++) if (e.charCodeAt(pe) === u) {
					for (var me = 4 - de % 4, he = 0; he < me; he++) ue += " ";
					de += me;
				} else ue += e[pe], de++;
				g += `${ue}
`;
			} else g += `${e.slice(le, I)}
`;
			s = $(e, I);
			continue;
		}
		for (var ge = !1, _e = 0; _e < g.length; _e++) {
			var W = g.charCodeAt(_e);
			if (W !== f && W !== d && W !== l && W !== u) {
				ge = !0;
				break;
			}
		}
		if (!x && ge && !y) {
			var G = s + $t, K = e.charCodeAt(G);
			if (!(K === v || K === _ || K === T || K === p || K === m || (K === b || K === C || K === w || K === z) && (on(e, s) != null || hn(e, s, I) != null) || K >= H && K <= U && hn(e, s, I) != null)) {
				g += `${e.slice(G, I)}
`, s = $(e, I);
				continue;
			}
		}
		break;
	}
	if (o.push({
		contentCol: c,
		raw: g,
		hasBlankAfter: x,
		isEmpty: y
	}), o.length === 0) return null;
	var q = S;
	if (!q) for (var ve = 0; ve < o.length; ve++) {
		if (o[ve].hasBlankAfter && ve < o.length - 1) {
			q = !0;
			break;
		}
		if (!o[ve].isEmpty) {
			for (var J = o[ve].raw, ye = J.length, X = 0, be = !1, xe = !1, Se = !1, Ce = !1, we = 0, Te = 0, Ee = -1; X < ye;) {
				var Z = J.indexOf("\n", X);
				if (Z < 0 && (Z = ye), Ce) {
					en(J, X, Z);
					for (var De = J.slice(X + $t, Z), Oe = 0; Oe < De.length && De.charCodeAt(Oe) === we;) Oe++;
					Oe >= Te && De.slice(Oe).trim() === "" && (Ce = !1), X = Z < ye ? Z + 1 : ye;
					continue;
				}
				if (tn(J, X, Z)) {
					Ee >= 0 ? Se = !0 : be && (xe = !0), X = Z < ye ? Z + 1 : ye;
					continue;
				}
				if (en(J, X, Z), Ee >= 0) {
					if (Qt >= Ee) {
						X = Z < ye ? Z + 1 : ye;
						continue;
					}
					var ke = hn(J, X, Z);
					if (ke && ke.markerCol < Ee && ke.contentCol <= Ee) {
						X = Z < ye ? Z + 1 : ye;
						continue;
					}
					if (ke) {
						X = Z < ye ? Z + 1 : ye;
						continue;
					}
					Ee = -1, Se &&= (xe = !0, !1);
				}
				var Ae = J.slice(X + $t, Z), je = Ae.charCodeAt(0);
				if ((je === p || je === m) && Qt <= 3) {
					for (var Me = 0; Me < Ae.length && Ae.charCodeAt(Me) === je;) Me++;
					if (Me >= 3) {
						if (xe && be) {
							q = !0;
							break;
						}
						Ce = !0, we = je, Te = Me, be = !0, X = Z < ye ? Z + 1 : ye;
						continue;
					}
				}
				var Ne = Qt <= 3 ? hn(J, X, Z) : null;
				if (Ne && be) {
					if (xe) {
						q = !0;
						break;
					}
					Ee = Ne.contentCol, Se = !1, X = Z < ye ? Z + 1 : ye, be = !0;
					continue;
				}
				if (xe) {
					q = !0;
					break;
				}
				be = !0, X = Z < ye ? Z + 1 : ye;
			}
			if (q) break;
		}
	}
	for (var Pe = [], Q = 0; Q < o.length; Q++) {
		for (var Fe = o[Q], Ie = Fe.raw, Le = Ie.length; Le > 0 && Ie.charCodeAt(Le - 1) === f;) Le--;
		var Re = Le < Ie.length ? Ie.slice(0, Le) : Ie, ze = null;
		if (Re.length >= 3 && Re.charCodeAt(0) === h) {
			var Be = Re[1];
			(Be === " " || Be === "x" || Be === "X") && Re.charCodeAt(2) === D && (ze = {
				type: Y.gfmTask,
				completed: Be === "x" || Be === "X"
			}, Re = Re.slice(3));
		}
		var Ve;
		if (Fe.isEmpty && Re.trim() === "") Ve = [];
		else if (q) {
			var He = n.inList;
			n.inList = !0;
			var Ue = n.i;
			n.i = Ue || Q !== o.length - 1, Ve = _r(Re, n, r), n.i = Ue, n.inList = He;
		} else {
			var We = n.inList;
			n.inList = !0;
			var Ge = n.i;
			if (n.i = Ge || Q !== o.length - 1, Ve = _r(Re, n, r), n.i = Ge, n.inList = We, Ve.length === 1 && Ve[0].type === Y.paragraph) Ve = Ve[0].children;
			else if (n.p) {
				var Ke = [];
				n.p.push({
					src: Ve,
					dest: Ke,
					unwrap: !0
				}), Ve = Ke;
			} else {
				for (var qe = [], Je = 0; Je < Ve.length; Je++) if (Ve[Je].type === Y.paragraph) for (var Ye = Ve[Je].children, Xe = 0; Xe < Ye.length; Xe++) qe.push(Ye[Xe]);
				else qe.push(Ve[Je]);
				Ve = qe;
			}
		}
		if (ze) {
			var Ze = [ze, {
				type: Y.text,
				text: " "
			}];
			if (n.p) n.p.push({
				src: Ve,
				dest: Ze,
				unwrap: !1
			});
			else for (var Qe = 0; Qe < Ve.length; Qe++) Ze.push(Ve[Qe]);
			Pe.push(Ze);
		} else Pe.push(Ve);
	}
	return {
		node: {
			type: a.ordered ? Y.orderedList : Y.unorderedList,
			start: a.ordered ? a.start : void 0,
			items: Pe
		},
		end: s
	};
}
var yn = /* @__PURE__ */ new Set(/* @__PURE__ */ "address.article.aside.base.basefont.blockquote.body.caption.center.col.colgroup.dd.details.dialog.dir.div.dl.dt.fieldset.figcaption.figure.footer.form.frame.frameset.h1.h2.h3.h4.h5.h6.head.header.hr.html.iframe.legend.li.link.main.menu.menuitem.nav.noframes.ol.optgroup.option.p.param.search.section.summary.table.tbody.td.tfoot.th.thead.title.tr.track.ul".split("."));
function bn(e, t, n) {
	let r = {};
	for (let [o, s] of Object.entries(e)) {
		let e = o.toLowerCase();
		if (e === "style" && typeof s == "string") {
			let e = {}, t = [], n = 0, i = 0;
			for (let e = 0; e < s.length; e++) {
				let r = s.charCodeAt(e);
				r === le ? n++ : r === ue ? n-- : r === ne && n === 0 && (t.push(s.slice(i, e)), i = e + 1);
			}
			i < s.length && t.push(s.slice(i));
			let a = !1;
			t.forEach((t) => {
				let n = t.indexOf(":");
				if (n === -1) return;
				let r = t.slice(0, n).trim(), i = t.slice(n + 1).trim();
				if (r && i) {
					if (/url\s*\(\s*(javascript|vbscript|data:(?!image\/))/i.test(i)) {
						a = !0;
						return;
					}
					let t = r.indexOf("-") === -1 ? r : r.replace(/-([a-z])/g, (e, t) => t.toUpperCase());
					e[t] = i;
				}
			}), !a && Object.keys(e).length > 0 && (r[o] = e);
		} else if ((e === "href" || e === "src") && n?.sanitizer) {
			let i = n.sanitizer(s, t, e);
			i != null && (r[o] = i);
		} else if (s === "") r[o] = !0;
		else if (s.length >= 2 && s.charCodeAt(0) === ce && s.charCodeAt(s.length - 1) === V) {
			var i = s.slice(1, -1);
			if (i.length > 0) {
				var a = i.charCodeAt(0);
				if (a === h || a === ce) try {
					r[o] = JSON.parse(i);
					continue;
				} catch {}
			}
			if (i === "true") {
				r[o] = !0;
				continue;
			}
			if (i === "false") {
				r[o] = !1;
				continue;
			}
			if (n?.evalUnserializableExpressions) try {
				r[o] = (0, eval)(`(${i})`);
				continue;
			} catch {}
			r[o] = i;
		} else r[o] = s;
	}
	return r;
}
function xn(e, t, n) {
	let r = t.length;
	if (r === 0) return n;
	var i = t.charCodeAt(0);
	if (!(i >= W && i <= G || i >= K && i <= q)) {
		for (var a = String.fromCharCode(i), o = e.length - r, s = n; s <= o;) {
			var c = e.indexOf(a, s);
			if (c === -1 || c > o) return -1;
			for (var l = !0, u = 1; u < r; u++) {
				var d = e.charCodeAt(c + u), f = t.charCodeAt(u);
				if (d >= W && d <= G && (d += J), f >= W && f <= G && (f += J), d !== f) {
					l = !1;
					break;
				}
			}
			if (l) return c;
			s = c + 1;
		}
		return -1;
	}
	i >= W && i <= G && (i += J);
	for (let a = n; a <= e.length - r; a++) {
		var p = e.charCodeAt(a);
		if (p >= W && p <= G && (p += J), p !== i) continue;
		let n = !0;
		for (let i = 1; i < r; i++) {
			let r = e.charCodeAt(a + i), o = t.charCodeAt(i);
			if (r >= W && r <= G && (r += J), o >= W && o <= G && (o += J), r !== o) {
				n = !1;
				break;
			}
		}
		if (n) return a;
	}
	return -1;
}
function Sn(e, t, n) {
	let r = t.length;
	var i = t.charCodeAt(0);
	i >= W && i <= G && (i += J);
	for (let o = Math.min(n, e.length - r); o >= 0; o--) {
		var a = e.charCodeAt(o);
		if (a >= W && a <= G && (a += J), a !== i) continue;
		let n = !0;
		for (let i = 1; i < r; i++) {
			let r = e.charCodeAt(o + i), a = t.charCodeAt(i);
			if (r >= W && r <= G && (r += J), a >= W && a <= G && (a += J), r !== a) {
				n = !1;
				break;
			}
		}
		if (n) return o;
	}
	return -1;
}
var Cn = -1;
function wn(e, t, n) {
	let r = n.toLowerCase(), i = `<${r}`, a = `</${r}`, o = 1, s = t, c = e.length;
	for (Cn = -1; s < c && o > 0;) {
		let t = xn(e, i, s), n = xn(e, a, s);
		if (n === -1) return -1;
		if (t !== -1 && t < n) {
			let n = Ft(e, t);
			n ? (n.tag.toLowerCase() === r && !n.f && !n.n && !Me(n.tag) && o++, s = n.end) : s = t + 1;
		} else {
			var d = n + a.length, p = d < c ? e.charCodeAt(d) : 62;
			if ((p === _ || p === l || p === u || p === f) && (o--, o === 0)) {
				Cn = n;
				let t = n + a.length;
				for (; t < c && e.charCodeAt(t) !== _;) t++;
				return t + 1;
			}
			s = n + 1;
		}
	}
	return -1;
}
function Tn(e, t, n, r) {
	if (r.ignoreHTMLBlocks || r.disableParsingRawHTML) return null;
	var i = Jt(e, t);
	if (en(e, t, i), Qt > 3 && !n.inHTML) return null;
	var a = t + $t;
	if (e.charCodeAt(a) !== T) return null;
	var o = e.indexOf(">", a + 1);
	if (o !== -1 && o < i) {
		var s = e.slice(a + 1, o);
		if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s) || /^[^\s@]+@[^\s@]+$/.test(s)) return null;
	}
	var c = En(e, a);
	if (c >= 1 && c <= 5) {
		var p = e.length;
		if (c === 1) {
			for (var m = e.length, h = 0; h < _t.length; h++) {
				var g = xn(e, `</${_t[h]}>`, a);
				g >= 0 && g < m && (m = g);
			}
			if (m < e.length) {
				var v = e.indexOf(">", m);
				p = v >= 0 ? $(e, v + 1) : e.length;
			}
		} else {
			var y = c === 2 ? "-->" : c === 3 ? "?>" : c === 4 ? ">" : "]]>", b = e.indexOf(y, a);
			b >= 0 && (p = $(e, b + y.length));
		}
		var x = e.slice(a, p);
		if (c >= 2) return {
			node: {
				type: Y.htmlComment,
				text: x,
				s: !1,
				raw: !0
			},
			end: p
		};
		var S = "div", C = x.match(/^<\/?([a-zA-Z][a-zA-Z0-9-]*)/);
		C && (S = C[1]);
		var w = Ft(e, a), E = {}, D;
		w && !w.f && (E = bn(w.attrs, S, r), D = w.g + w.b);
		var O = [], k = xn(x, `</${S.toLowerCase()}`, 0), A = "", j, M, N;
		if (w?.f) {
			N = x.slice(0, w.end - a);
			for (var P = x.slice(w.end - a); P.length > 0 && P.charCodeAt(P.length - 1) === f;) P = P.slice(0, -1);
			P && (M = It(P));
		} else if (w && !w.f) {
			var R = w.end - a;
			if (k === -1) {
				for (var ee = x; ee.length > 0 && ee.charCodeAt(ee.length - 1) === f;) ee = ee.slice(0, -1);
				j = It(ee);
			} else {
				var te = R;
				x.charCodeAt(te) === f && te++;
				for (var ne = k; ne > te;) {
					var re = x.charCodeAt(ne - 1);
					if (re !== l && re !== u && re !== f && re !== d) break;
					ne--;
				}
				var ie = x.slice(te, ne);
				ie && (M = It(ie));
				for (var oe = x.slice(k); oe.length > 0 && oe.charCodeAt(oe.length - 1) === f;) oe = oe.slice(0, -1);
				N = It(oe), A = x.slice(R, k).trim();
			}
		}
		return {
			node: {
				type: Y.htmlBlock,
				tag: S,
				attrs: E,
				b: D,
				children: O,
				e: M,
				h: N,
				j,
				text: A,
				c: !0,
				a: w ? w.f : !1
			},
			end: p
		};
	}
	if (c === 6 || c === 7) {
		var se = Xt(e, t), z = se < e.length ? se : e.length, B = e.slice(a, z), ce = se < e.length ? $(e, se) : e.length, V = Ft(e, a);
		if (V) {
			var le = V.tag, ue = le.toLowerCase();
			if (V.f) {
				var de = e.slice(V.end, z);
				return {
					node: {
						type: Y.htmlBlock,
						tag: le,
						attrs: {},
						children: [],
						h: e.slice(a, V.end),
						e: de ? It(de) : void 0,
						text: de,
						c: !0,
						a: !0
					},
					end: ce
				};
			}
			if (V.n || Me(le)) return {
				node: {
					type: Y.htmlBlock,
					tag: le,
					attrs: bn(V.attrs, le, r),
					b: V.g + V.b,
					children: [],
					text: "",
					c: !1,
					a: !1
				},
				end: V.end < e.length && e.charCodeAt(V.end) === f ? V.end + 1 : V.end
			};
			var fe = n.d || 0, pe = e.slice(a, z), me = -1, he = -1, ge = !1;
			if (fe < 10) {
				for (var _e = `</${ue}`, H = V.end - a, U = 1, K = H; K < pe.length && U > 0;) {
					var q = xn(pe, `<${ue}`, K), ve = xn(pe, _e, K);
					if (ve === -1) break;
					if (q !== -1 && q < ve) {
						var J = q + ue.length + 1;
						if (J < pe.length) {
							var ye = pe.charCodeAt(J);
							(ye === l || ye === u || ye === f || ye === _ || ye === ae) && U++;
						}
						K = q + 1;
					} else {
						var X = ve + _e.length;
						if (X < pe.length) {
							var be = pe.charCodeAt(X);
							if ((be === _ || be === l || be === u || be === f) && (U--, U === 0)) {
								me = ve;
								for (var xe = X; xe < pe.length && pe.charCodeAt(xe) !== _;) xe++;
								he = xe + 1;
								break;
							}
						} else if (U--, U === 0) {
							me = ve, he = pe.length;
							break;
						}
						K = ve + 1;
					}
				}
				if (me === -1 && !V.f && (c === 6 || V.u)) {
					var Se = wn(e, V.end, ue);
					if (Se !== -1) {
						for (var Ce = Cn, we = V.end, Te = !1, Ee = !1, Z = !1, De = 0, Oe = !1, ke = !1, Ae = we; Ae < Ce;) {
							var je = e.charCodeAt(Ae);
							if (je === f) ke && (Te = !0), Oe || De++, ke = !0, Ae++;
							else if (je === l || je === u) Ae++;
							else {
								if (!Oe && (Oe = !0, De >= 2 && je === T)) {
									Z = !0;
									break;
								}
								if (ke = !1, je === T) {
									var Ne = e.charCodeAt(Ae + 1) | 32;
									if ((Ne === I || Ne === L || Ne === F) && (bt.lastIndex = Ae, bt.test(e))) {
										Ee = !0;
										break;
									}
								}
								Ae++;
							}
						}
						if (Te && !Z && !Ee) {
							var Pe = Jt(e, Se);
							z = Pe, ce = $(e, Pe), pe = e.slice(a, z), B = e.slice(a, z), me = Ce - a, he = Se - a, ge = !0;
						}
					}
				}
			}
			var Q = V.b.indexOf("\n") !== -1 || V.g.indexOf("\n") !== -1, Fe = !1;
			me !== -1 && (Fe = pe.slice(he).trim().length === 0);
			var Ie = !1, Le = z, Re = ce;
			if (me !== -1) {
				var ze = a + he, Be = Jt(e, ze - 1);
				if (ze < Be) {
					for (var Ve = ze; Ve < Be && (e.charCodeAt(Ve) === l || e.charCodeAt(Ve) === u);) Ve++;
					if (Ve < Be && e.charCodeAt(Ve) === T) {
						var He = Ft(e, Ve);
						He && !He.f && (Ie = !0, Le = ze, Re = ze, Fe = !0);
					}
				}
				if (!Ie) {
					var Ue = $(e, Be);
					if (Ue < z) {
						for (var We = Ue; We < z && (e.charCodeAt(We) === l || e.charCodeAt(We) === u);) We++;
						We < z && e.charCodeAt(We) === T && Ft(e, We) && (Ie = !0, Le = Be, Re = Ue, Fe = !0);
					}
				}
				!Ie && n.inHTML && (Ie = !0, Le = Be, Re = $(e, Be), Fe = e.slice(ze, Be).trim().length === 0);
			}
			var Ge = [], Ke = "";
			if (me !== -1) {
				Ke = pe.slice(V.end - a, me);
				var qe = Ke.trim();
				if (qe) {
					var { inline: Je, inHTML: Ye, d: Xe } = n;
					if (n.inHTML = !0, n.d = fe + 1, ue === "p") n.inline = !0, Ge = Mn(qe, !1, n, r);
					else {
						var Ze = Ke.indexOf("\n\n") !== -1, Qe = xt.test(qe), $e = St.test(qe), et = Ze || Qe || n.inHTML && $e;
						Ke.length >= 2 && Ke.charCodeAt(0) === f && Ke.charCodeAt(Ke.length - 1) === f && !Ze && !Qe && !$e ? Ge = [{
							type: Y.text,
							text: qe
						}] : et || $e ? (n.inline = !1, Ge = _r(Ke, n, r)) : (n.inline = !0, Ge = Mn(qe, !1, n, r));
					}
					n.inline = Je, n.inHTML = Ye, n.d = Xe;
				}
			}
			var tt = !1;
			if (c === 6 && me !== -1 && !n.inHTML && !Q) {
				var nt = /<[a-zA-Z][^>]*>/.test(Ke), rt = Ke.indexOf("\n\n") !== -1 || xt.test(Ke);
				nt && !rt && (tt = !0);
			}
			if (!ge && (n.inHTML || c === 7 || Q || !Fe || tt)) {
				var it, at, ot = !1;
				if (me !== -1 && Ie) {
					var st = !1;
					if (n.inHTML && he < pe.length) {
						for (var ct = he; ct < pe.length && pe.charCodeAt(ct) !== f;) ct++;
						var lt = pe.slice(he, ct).trim();
						st = lt.length > 1 && lt.charCodeAt(0) === T && lt.charCodeAt(1) !== ae;
					}
					at = st ? pe.slice(V.end - a) : Ke, ot = !0;
				} else (c === 7 || n.inHTML) && me !== -1 ? (at = pe.slice(V.end - a), at.charCodeAt(0) === f && (at = at.slice(1))) : Ie ? it = e.slice(a, Le) : Q ? it = B : (at = pe.slice(V.end - a), at.charCodeAt(0) === f && (at = at.slice(1)));
				var ut = it !== void 0, dt = It(it === void 0 ? at || "" : it), ft = {
					type: Y.htmlBlock,
					tag: le,
					attrs: bn(V.attrs, le, r),
					b: V.g + V.b,
					children: Ge,
					e: ut ? void 0 : dt,
					j: ut ? dt : void 0,
					text: dt,
					c: !0,
					a: !1
				};
				return ot && (ft.x = !0), {
					node: ft,
					end: Re
				};
			}
			var pt = It(Ke);
			return {
				node: {
					type: Y.htmlBlock,
					tag: le,
					attrs: bn(V.attrs, le, r),
					b: V.g + V.b,
					children: Ge,
					e: ge ? void 0 : pt,
					text: pt,
					c: !1,
					a: !1
				},
				end: Re
			};
		}
		var mt = B.match(/^<(\/?)([a-zA-Z][a-zA-Z0-9-]*)/), ht = mt ? mt[2] : "div", gt = mt ? mt[1] === "/" : !1, yt, Ct, wt, Tt = "";
		if (gt) {
			var Et = B.indexOf(">");
			Et === -1 ? yt = B : (yt = B.slice(0, Et + 1), Tt = B.slice(Et + 1), Tt && (Ct = It(Tt)));
		} else wt = It(B);
		return {
			node: {
				type: Y.htmlBlock,
				tag: ht,
				attrs: {},
				children: [],
				e: Ct,
				h: yt,
				j: wt,
				text: gt ? Tt : B,
				c: !0,
				a: gt
			},
			end: ce
		};
	}
	var Dt = Ft(e, a);
	if (!Dt) return null;
	var Ot = Dt.tag, kt = Ot.toLowerCase(), At = Ot.charCodeAt(0), jt = At >= W && At <= G;
	if (!(jt || yn.has(kt) || vt.has(kt) || kt.includes("-"))) return null;
	if (Dt.f) return {
		node: {
			type: Y.htmlSelfClosing,
			tag: Ot,
			attrs: {},
			h: e.slice(a, Dt.end),
			a: !0
		},
		end: Dt.end
	};
	var Mt = wn(e, Dt.end, Ot), Nt = [];
	if (Mt !== -1) {
		var Pt = e.slice(Dt.end, Cn), Lt = Pt.trim();
		if (Lt) {
			var Rt = Pt.indexOf("\n\n") !== -1, zt = xt.test(Lt), Bt = St.test(Lt), Vt = n.inline, Ht = n.inHTML, Ut = n.d;
			n.inHTML = !0, n.d = (n.d || 0) + 1, Rt || zt || Bt ? (n.inline = !1, Nt = _r(Pt, n, r)) : (n.inline = !0, Nt = Mn(Lt, !1, n, r)), n.inline = Vt, n.inHTML = Ht, n.d = Ut;
		}
		var Wt = Jt(e, Mt), Gt = e.slice(Mt, Wt).trim() ? Mt : $(e, Mt), Kt = jt ? e.slice(a, Mt) : e.slice(a, Gt);
		return {
			node: {
				type: Y.htmlBlock,
				tag: Ot,
				attrs: bn(Dt.attrs, Ot, r),
				b: Dt.g + Dt.b,
				children: Nt,
				j: It(Kt),
				text: jt ? Pt : Kt,
				c: !0,
				a: !1
			},
			end: Gt
		};
	}
	var qt = Xt(e, Dt.end), Yt = qt < e.length ? $(e, qt) : qt, Zt = e.slice(Dt.end, qt);
	if (Zt.trim()) {
		var { inline: tn, inHTML: nn, d: rn } = n;
		n.inline = !1, n.inHTML = !0, n.d = (n.d || 0) + 1, Nt = _r(Zt, n, r), n.inline = tn, n.inHTML = nn, n.d = rn;
	}
	var an = e.slice(Dt.end, qt);
	return {
		node: {
			type: Y.htmlBlock,
			tag: Ot,
			attrs: bn(Dt.attrs, Ot, r),
			b: Dt.g + Dt.b,
			children: Nt,
			e: It(an),
			text: Zt,
			c: !0,
			a: !1
		},
		end: Yt
	};
}
function En(e, t) {
	if (e.charCodeAt(t) !== T) return 0;
	var n = t + 1, r = e.length;
	if (e.charCodeAt(n) === O && e.charCodeAt(n + 1) === b && e.charCodeAt(n + 2) === b) return 2;
	if (e.charCodeAt(n) === re) return 3;
	if (e.charCodeAt(n) === O) {
		var i = e.charCodeAt(n + 1);
		if (i >= W && i <= G) return 4;
		if (e.slice(n + 1, n + 8) === "[CDATA[") return 5;
	}
	for (var a = e.charCodeAt(n) === ae, o = a ? n + 1 : n, s = o; s < r;) {
		var c = e.charCodeAt(s);
		if (c >= W && c <= G || c >= K && c <= q || c >= H && c <= U || c === b) s++;
		else break;
	}
	if (s === o) return 0;
	var d = e.slice(o, s);
	if (vt.has(d.toLowerCase())) {
		if (a) return 0;
		var p = e.charCodeAt(s);
		return +(p === l || p === u || p === _ || p === f || s >= r);
	}
	if (yn.has(d.toLowerCase())) {
		if (a) {
			for (var m = s; m < r && (e.charCodeAt(m) === l || e.charCodeAt(m) === u);) m++;
			return m < r && e.charCodeAt(m) === _ ? 6 : 0;
		}
		var h = s < r ? e.charCodeAt(s) : -1;
		return h === l || h === u || h === _ || h === f || h === ae || h === -1 ? 6 : 0;
	}
	if (a) {
		for (var g = s; g < r && (e.charCodeAt(g) === l || e.charCodeAt(g) === u);) g++;
		if (g < r && e.charCodeAt(g) === _) {
			var v = Jt(e, t);
			if (e.slice(g + 1, v).trim() === "") return 7;
		}
	} else {
		var y = Jt(e, t), x = Ft(e, t);
		if (x && x.end <= y && e.slice(x.end, y).trim() === "") return 7;
	}
	return 0;
}
function Dn(e, t, n) {
	for (var r = 0, i = e.length; r < i && (e.charCodeAt(r) === l || e.charCodeAt(r) === u);) r++;
	for (; i > r && (e.charCodeAt(i - 1) === l || e.charCodeAt(i - 1) === u);) i--;
	r < i && e.charCodeAt(r) === B && r++, i > r && e.charCodeAt(i - 1) === B && (i - 2 < r || e.charCodeAt(i - 2) !== S) && i--;
	for (var a = [], o = r, s = !1, c = [], d = r; d < i;) {
		var f = e.charCodeAt(d);
		if (f === S && d + 1 < i) {
			e.charCodeAt(d + 1) === B ? (s || (s = !0, c = []), c.push(e.slice(o, d)), c.push("|"), d += 2, o = d) : d += 2;
			continue;
		}
		if (f === p) {
			for (var m = 0; d < i && e.charCodeAt(d) === p;) m++, d++;
			for (var h = !1; d < i && !h;) {
				for (var g = 0; d < i && e.charCodeAt(d) === p;) g++, d++;
				g === m ? h = !0 : g === 0 && d++;
			}
			continue;
		}
		if (f === B) {
			var _ = s ? (c.push(e.slice(o, d)), c.join("")) : e.slice(o, d);
			a.push(_.trim()), d++, o = d, s = !1, c = [];
			continue;
		}
		d++;
	}
	var v = s ? (c.push(e.slice(o, i)), c.join("")) : e.slice(o, i);
	return a.push(v.trim()), a.map((e) => {
		var r = e.indexOf("\\|") === -1 ? e : e.replace(/\\\|/g, "|");
		return r ? Mn(r, !1, t, n) : [];
	});
}
function On(e, t, n, r) {
	let i = Jt(e, t);
	var a = e.indexOf("|", t);
	if (a < 0 || a >= i) return null;
	let o = $(e, i);
	if (o >= e.length) return null;
	let s = Jt(e, o);
	if (!Dt(e, o, s)) return null;
	let c = e.slice(t, i), d = e.slice(o, s);
	for (var f = [], h = 0, g = d.length; h < g && (d.charCodeAt(h) === l || d.charCodeAt(h) === u);) h++;
	for (h < g && d.charCodeAt(h) === B && h++; h < g;) {
		for (; h < g && (d.charCodeAt(h) === l || d.charCodeAt(h) === u);) h++;
		if (h >= g || d.charCodeAt(h) === B) break;
		var y = d.charCodeAt(h) === A;
		for (y && h++; h < g && d.charCodeAt(h) === b;) h++;
		var x = h < g && d.charCodeAt(h) === A;
		for (x && h++, f.push(y && x ? "center" : x ? "right" : y ? "left" : null); h < g && (d.charCodeAt(h) === l || d.charCodeAt(h) === u);) h++;
		h < g && d.charCodeAt(h) === B && h++;
	}
	let S = Dn(c, n, r);
	if (f.length !== S.length) return null;
	let T = [], E = $(e, s);
	for (; E < e.length;) {
		let t = Jt(e, E), i = e.slice(E, t);
		if (tn(e, E, t)) break;
		if (en(e, E, t), Qt < 4) {
			var D = e.charCodeAt(E + $t);
			if (D === _ || D === v || (D === b || D === C || D === w) && on(e, E)) break;
			if (D === p || D === m) {
				for (var O = E + $t, k = 0; O < t && e.charCodeAt(O) === D;) k++, O++;
				if (k >= 3) break;
			}
		}
		T.push(Dn(i, n, r)), E = $(e, t);
	}
	if (r.optimizeForStreaming && T.length === 0) return null;
	for (var j = S.length, M = 0; M < T.length; M++) if (T[M].length < j) for (; T[M].length < j;) T[M].push([]);
	else T[M].length > j && (T[M].length = j);
	return {
		node: {
			type: Y.table,
			header: S,
			cells: T,
			align: f
		},
		end: E
	};
}
function kn(e, t, n) {
	if (en(e, t, Jt(e, t)), Qt > 3) return null;
	var r = t + $t;
	if (e.charCodeAt(r) !== h) return null;
	if (r + 1 < e.length && e.charCodeAt(r + 1) === g) return An(e, r, n) || null;
	n.refs ||= {};
	var i = Rt(e, r, n.refs);
	return i === null ? null : {
		node: { type: Y.refCollection },
		end: i
	};
}
function An(e, t, n) {
	var r = e.length;
	if (e.charCodeAt(t) !== h || t + 1 >= r || e.charCodeAt(t + 1) !== g) return null;
	for (var i = t + 2, a = i; i < r && e.charCodeAt(i) !== D;) {
		if (e.charCodeAt(i) === f) return null;
		i++;
	}
	if (i >= r) return null;
	var o = `^${e.slice(a, i)}`.toLowerCase();
	if (i++, i >= r || e.charCodeAt(i) !== A) return null;
	for (i++; i < r && (e.charCodeAt(i) === l || e.charCodeAt(i) === u);) i++;
	if (i < r && e.charCodeAt(i) === f) for (i++; i < r && (e.charCodeAt(i) === l || e.charCodeAt(i) === u);) i++;
	var s = e.indexOf("\n", i);
	s < 0 && (s = r);
	for (var c = e.slice(i, s).trim(), d = s < r ? s + 1 : r; d < r;) {
		var p = Jt(e, d);
		if (en(e, d, p), Qt >= 2 && !tn(e, d, p)) c += `
${e.slice(d, p)}`, d = $(e, p);
		else if (tn(e, d, p)) {
			var m = $(e, p);
			if (m < r && (en(e, m, Jt(e, m)), Qt >= 2)) {
				c += "\n", d = $(e, p);
				continue;
			}
			break;
		} else break;
	}
	var _ = n.refs;
	return _ && !_[o] && (_[o] = {
		target: c,
		title: void 0
	}), {
		node: { type: Y.footnote },
		end: d
	};
}
function jn(e, t, n, r) {
	let i = t, a = 0, o = 0, s = -1;
	for (; i < e.length;) {
		let t = s >= 0 ? s : Jt(e, i);
		if (s = -1, tn(e, i, t)) break;
		if (en(e, i, t), Qt < 4 && o > 0 && !n.l) {
			let n = e.charCodeAt(i + $t);
			if (n === x || n === b) {
				let r = i + $t;
				for (; r < t && e.charCodeAt(r) === n;) r++;
				for (; r < t && (e.charCodeAt(r) === l || e.charCodeAt(r) === u);) r++;
				if (r >= t) {
					a = n === x ? 1 : 2, i = $(e, t);
					break;
				}
			}
		}
		o = t;
		let d = $(e, t);
		if (d < e.length) {
			if (e.charCodeAt(d) === _e) {
				var c = Jt(e, d);
				i = $(e, c), o = c;
				continue;
			}
			let t = Jt(e, d);
			if (s = t, en(e, d, t), Qt < 4) {
				let a = e.charCodeAt(d + $t);
				if (a === _) {
					i = d;
					break;
				}
				if (a === v) {
					for (var h = d + $t, g = 0; h < t && e.charCodeAt(h) === v && g <= 6;) g++, h++;
					if (g >= 1 && g <= 6 && (h >= t || e.charCodeAt(h) === l || e.charCodeAt(h) === u)) {
						i = d;
						break;
					}
				}
				if (a === p || a === m) {
					for (var y = d + $t, S = 0; y < t && e.charCodeAt(y) === a;) S++, y++;
					if (S >= 3) {
						i = d;
						break;
					}
				}
				if (a === T) {
					var E = d + $t + 1, D = E < t ? e.charCodeAt(E) : 0, k = D === O || D === re;
					if (!k && D === ae) {
						for (var A = E + 1, j = A; j < t && (e.charCodeAt(j) >= W && e.charCodeAt(j) <= G || e.charCodeAt(j) >= K && e.charCodeAt(j) <= q || e.charCodeAt(j) >= H && e.charCodeAt(j) <= U || e.charCodeAt(j) === b);) j++;
						j > A && (k = yn.has(e.slice(A, j).toLowerCase()));
					} else if (!k) {
						for (var M = E; M < t && (e.charCodeAt(M) >= W && e.charCodeAt(M) <= G || e.charCodeAt(M) >= K && e.charCodeAt(M) <= q || e.charCodeAt(M) >= H && e.charCodeAt(M) <= U || e.charCodeAt(M) === b);) M++;
						if (M > E) {
							var N = e.slice(E, M).toLowerCase();
							k = yn.has(N) || vt.has(N);
						}
					}
					if (k && Tn(e, d, n, r)) {
						i = d;
						break;
					}
				}
				if (a === b || a === C || a === z) {
					let n = d + $t + 1;
					if (n < t && (e.charCodeAt(n) === l || e.charCodeAt(n) === u) && Yt(e, n, t) < t && !on(e, d)) {
						i = d;
						break;
					}
				}
				if (a >= H && a <= U) {
					let n = d + $t;
					for (; n < t && e.charCodeAt(n) >= H && e.charCodeAt(n) <= U;) n++;
					if (n < t && (e.charCodeAt(n) === ie || e.charCodeAt(n) === ue) && n - (d + $t) === 1 && e.charCodeAt(d + $t) === 49) {
						var P = n + 1;
						if (P < t && (e.charCodeAt(P) === l || e.charCodeAt(P) === u) && Yt(e, P, t) < t) {
							i = d;
							break;
						}
					}
				}
				if (a === B) {
					let n = $(e, t);
					if (n < e.length && Dt(e, n, Jt(e, n))) {
						i = d;
						break;
					}
				}
				if ((a === b || a === C || a === w) && on(e, d)) {
					if (a !== b) {
						i = d;
						break;
					}
					let n = 0, r = d + $t;
					for (; r < t && e.charCodeAt(r) === b;) n++, r++;
					for (; r < t && (e.charCodeAt(r) === l || e.charCodeAt(r) === u);) r++;
					if (r < t) {
						i = d;
						break;
					}
				}
			}
		}
		i = $(e, t);
	}
	for (var F = a ? o : i; F > t && (e.charCodeAt(F - 1) === f || e.charCodeAt(F - 1) === d || e.charCodeAt(F - 1) === l || e.charCodeAt(F - 1) === u);) F--;
	for (var I = t; I < F && (e.charCodeAt(I) === l || e.charCodeAt(I) === u);) I++;
	if (I >= F) return null;
	for (var L = !1, R = I; R < F; R++) if (e.charCodeAt(R) === _e) {
		L = !0;
		break;
	}
	var ee = L ? e.slice(I, F).replace(/\u001E/g, "") : e.slice(I, F);
	if (!ee) return null;
	let te = Mn(ee, !0, n, r);
	return a ? {
		node: {
			type: Y.heading,
			level: a,
			children: te,
			id: ""
		},
		end: i
	} : {
		node: {
			type: Y.paragraph,
			children: te
		},
		end: i
	};
}
function Mn(e, t, n, r) {
	var i = n.t;
	if (!i) {
		var a = n.k;
		n.k = t;
		var o = hr(e, 0, e.length, n, r);
		return n.k = a, o;
	}
	var s = [];
	return i.push({
		dest: s,
		text: e,
		breaks: t,
		inline: n.inline,
		inAnchor: n.inAnchor,
		inHTML: n.inHTML,
		htmlDepth: n.d,
		inList: n.inList,
		inBlockQuote: n.inBlockQuote,
		noSetext: n.l,
		depth: n.o
	}), s;
}
function Nn(e, t, n) {
	if (e.charCodeAt(t) !== p) return null;
	let r = Zt(e, t, n, 96), i = t + r;
	for (; i < n;) {
		let a = e.indexOf("`", i);
		if (a < 0 || a >= n) return null;
		let o = Zt(e, a, n, 96);
		if (o === r) {
			let n = e.slice(t + r, a);
			return n.indexOf("\n") !== -1 && (n = n.replace(/\n/g, " ")), n.length > 0 && n[0] === " " && n.at(-1) === " " && n.trim().length > 0 && (n = n.slice(1, -1)), {
				node: {
					type: Y.codeInline,
					text: n
				},
				end: a + o
			};
		}
		i = a + o;
	}
	return null;
}
function Pn(e, t, n) {
	if (e.charCodeAt(t) !== p) return t;
	let r = Zt(e, t, n, 96), i = t + r;
	for (; i < n;) {
		let a = e.indexOf("`", i);
		if (a < 0 || a >= n) return t;
		let o = Zt(e, a, n, 96);
		if (o === r) return a + o;
		i = a + o;
	}
	return t;
}
function Fn(e, t, n) {
	if (e.charCodeAt(t) !== T) return t;
	if (t + 1 < n && e.charCodeAt(t + 1) === ae) {
		let r = t + 2;
		for (; r < n && e.charCodeAt(r) !== _;) r++;
		return r < n ? r + 1 : t;
	}
	if (t + 3 < n && e.charCodeAt(t + 1) === O && e.charCodeAt(t + 2) === b && e.charCodeAt(t + 3) === b) {
		let n = e.indexOf("-->", t + 4);
		return n >= 0 ? n + 3 : t;
	}
	let r = t + 1, i = r;
	for (; r < n;) {
		let t = e.charCodeAt(r);
		if (t >= W && t <= G || t >= K && t <= q || t >= H && t <= U || t === b) r++;
		else break;
	}
	if (r === i) return t;
	let a = e.slice(i, r).toLowerCase(), o = !1;
	for (; r < n;) {
		let i = e.charCodeAt(r);
		if (i === _) {
			r++;
			break;
		}
		if (i === ae && r + 1 < n && e.charCodeAt(r + 1) === _) {
			r += 2, o = !0;
			break;
		}
		if (i === se || i === oe) {
			var s = i;
			for (r++; r < n && e.charCodeAt(r) !== s;) r++;
			r < n && r++;
			continue;
		}
		if (i === f) return t;
		r++;
	}
	if (o || Me(a)) return r;
	let c = 1;
	for (; r < n && c > 0;) if (e.charCodeAt(r) === T) {
		if (r + 1 < n && e.charCodeAt(r + 1) === ae) {
			let t = r + 2, i = t;
			for (; i < n && (e.charCodeAt(i) >= W && e.charCodeAt(i) <= G || e.charCodeAt(i) >= K && e.charCodeAt(i) <= q);) i++;
			if (e.slice(t, i).toLowerCase() === a) {
				for (; i < n && e.charCodeAt(i) !== _;) i++;
				if (i < n && i++, c--, c === 0) return i;
			}
			r = i;
		} else {
			let t = r + 1, i = t;
			for (; i < n && (e.charCodeAt(i) >= W && e.charCodeAt(i) <= G || e.charCodeAt(i) >= K && e.charCodeAt(i) <= q);) i++;
			e.slice(t, i).toLowerCase() === a && c++, r++;
		}
	} else r++;
	return r;
}
function In(e, t, n, r, i) {
	if (e.charCodeAt(t) !== m || t + 1 >= n || e.charCodeAt(t + 1) !== m) return null;
	let a = t + 2;
	for (; a + 1 < n;) {
		let o = e.charCodeAt(a);
		if (o === p) {
			let t = Pn(e, a, n);
			if (t > a) {
				a = t;
				continue;
			}
		}
		if (o === m && e.charCodeAt(a + 1) === m) {
			let n = e.slice(t + 2, a), o = hr(n, 0, n.length, r, i);
			return {
				node: {
					type: Y.textFormatted,
					tag: "del",
					children: o
				},
				end: a + 2
			};
		}
		o === S && a + 1 < n && a++, a++;
	}
	return null;
}
function Ln(e, t, n, r, i) {
	if (e.charCodeAt(t) !== x || t + 1 >= n || e.charCodeAt(t + 1) !== x) return null;
	let a = t + 2;
	for (; a + 1 < n;) {
		let o = e.charCodeAt(a);
		if (o === p) {
			let t = Pn(e, a, n);
			if (t > a) {
				a = t;
				continue;
			}
		}
		if (o === x && e.charCodeAt(a + 1) === x && a > t + 2) {
			let n = e.slice(t + 2, a), o = hr(n, 0, n.length, r, i);
			return {
				node: {
					type: Y.textFormatted,
					tag: "mark",
					children: o
				},
				end: a + 2
			};
		}
		o === S && a + 1 < n && a++, a++;
	}
	return null;
}
function Rn(e, t, n) {
	return e < ve ? !!(Ut(e) & Q) : Be.test(t[n]);
}
function zn(e, t, n) {
	return e < ve ? !!(Ut(e) & Ne) : Ve.test(t[n]);
}
function Bn(e, t, n) {
	var r = e.charCodeAt(t);
	if (r !== C && r !== w) return null;
	var i = Zt(e, t, n, r);
	if (i === 0) return null;
	var a = t > 0 ? e.charCodeAt(t - 1) : 32, o = t + i < n ? e.charCodeAt(t + i) : 32, s = zn(a, e, t - 1), c = zn(o, e, t + i), l = t > 0 && Rn(a, e, t - 1), u = t + i < n && Rn(o, e, t + i), d = !c && (!u || s || l), f = !s && (!l || c || u), p, m;
	return r === C ? (p = d, m = f) : (p = d && (!f || l), m = f && (!d || u)), {
		len: i,
		canOpen: p,
		canClose: m
	};
}
function Vn(e, t, n, r) {
	if (t.length !== 0) {
		for (var i = e.length, a = Array(i), o = null, s = null, c = 0; c < i; c++) {
			var l = {
				node: e[c],
				prev: s,
				next: null
			};
			s ? s.next = l : o = l, a[c] = l, s = l;
		}
		for (var u = Array(t.length), d = 0; d < t.length; d++) u[d] = a[t[d].idx];
		for (var f = [], p = 0; p < 12; p++) f[p] = -1;
		for (var m = 0; m < t.length;) {
			var h = t[m];
			if (!(h.active && h.canClose)) {
				m++;
				continue;
			}
			for (var g = (h.ch === C ? 0 : 1) * 6 + h.len % 3 * 2 + +!!h.canOpen, _ = f[g] === void 0 ? -1 : f[g], v = -1, y = m - 1; y > _; y--) {
				var b = t[y];
				if (!(!b.active || b.ch !== h.ch || !b.canOpen) && !((h.canOpen || b.canClose) && (b.len + h.len) % 3 == 0 && b.len % 3 != 0)) {
					v = y;
					break;
				}
			}
			if (v < 0) {
				f[g] = m - 1, !h.canOpen && (h.active = !1), m++;
				continue;
			}
			var x = t[v], S = x.len >= 2 && h.len >= 2, w = S ? 2 : 1;
			x.len -= w, h.len -= w;
			var T = u[v], E = u[m], D = T.node, O = E.node;
			D.text = D.text.slice(0, D.text.length - w), O.text = O.text.slice(w);
			for (var k = [], A = T.next; A && A !== E;) k.push(A.node), A = A.next;
			var j = {
				node: {
					type: Y.textFormatted,
					tag: S ? "strong" : "em",
					children: k
				},
				prev: T,
				next: E
			};
			T.next = j, E.prev = j;
			for (var M = v + 1; M < m; M++) t[M].active = !1;
			if (x.len === 0 && (x.active = !1, D.text === "")) {
				var N = T.prev;
				j.prev = N, N ? N.next = j : o = j;
			}
			if (h.len === 0) {
				if (h.active = !1, O.text === "") {
					var P = E.next;
					j.next = P, P && (P.prev = j);
				}
			} else continue;
			m++;
		}
		for (var F = 0, I = o; I;) {
			var L = I.node;
			if (L.type === Y.text) {
				var R = L;
				if (R.text === "") {
					I = I.next;
					continue;
				}
				if (F > 0 && e[F - 1].type === Y.text) {
					e[F - 1].text += R.text, I = I.next;
					continue;
				}
			}
			e[F++] = L, I = I.next;
		}
		e.length = F;
	}
}
function Hn(e, t, n, r) {
	return t(e, n, r) === null ? null : e;
}
var Un = 0, Wn = 0, Gn = 0, Kn = 0, qn = 0, Jn = 0, Yn = 0, Xn = 0;
function Zn() {
	return Yn === 2147483647 && (Wn = 0, Kn = 0, Jn = 0, $n = 0, Yn = 0), ++Yn;
}
var Qn = null, $n = 0, er = [], tr = 256;
function nr(e, t, n, r, i) {
	let a = e.charCodeAt(t) === O, o = a ? t + 1 : t;
	if (e.charCodeAt(o) !== h || Kn === Xn && o >= Gn) return null;
	var s = $n === Xn ? Qn : null, c = s === null ? 0 : s[o];
	if (c < 0) return null;
	var u = c;
	if (c === 0) {
		var d = e.indexOf("]", o + 1);
		if (d < 0 || d >= n) return Gn = o, Kn = Xn, null;
		u = o + 1;
		var m = 0;
		er[m++] = o;
		for (var g = n - o >= tr; u < n && m > 0;) {
			var v = e.charCodeAt(u);
			if (v === S && u + 1 < n) {
				u += 2;
				continue;
			}
			if (v === p) {
				var y = Pn(e, u, n);
				if (y > u) {
					u = y;
					continue;
				}
			}
			if (v === T) {
				var b = rr(e, u, n);
				if (b) {
					u = b.end;
					continue;
				}
				var x = Fn(e, u, n);
				if (x > u) {
					u = x;
					continue;
				}
			}
			if (v === h) er[m++] = u;
			else if (v === D) {
				var C = er[--m];
				s === null && g && u - o >= tr && (s = Qn = new Int32Array(n), $n = Xn), s !== null && (s[C] = u + 1);
			}
			u++;
		}
		if (m > 0) {
			if (s === null && g && u - o >= tr && (s = Qn = new Int32Array(n), $n = Xn), s !== null) for (; m > 0;) s[er[--m]] = -1;
			return null;
		}
	}
	var w = u - 1, E = e.slice(o + 1, w), k = u < n ? e.charCodeAt(u) : 0, A = !1;
	if (k === le) {
		var j = !0;
		for (u++; u < n && (e.charCodeAt(u) === l || e.charCodeAt(u) === f);) u++;
		var M = "", N = u;
		if (u < n && e.charCodeAt(u) === T) {
			for (u++, N = u; N < n && e.charCodeAt(N) !== _;) {
				if (e.charCodeAt(N) === S && N + 1 < n) {
					N += 2;
					continue;
				}
				if (e.charCodeAt(N) === f) {
					j = !1;
					break;
				}
				N++;
			}
			j && (N >= n || e.charCodeAt(N) !== _) && (j = !1), j && (M = e.slice(u, N), N++);
		} else if (j) {
			var P = Wn === Xn ? Un : -1;
			if (P >= 0 && u >= P) j = !1;
			else {
				for (var F = 0, I = !1; N < n;) {
					var L = e.charCodeAt(N);
					if (L === S && N + 1 < n) {
						N += 2;
						continue;
					}
					if (L === le) F++;
					else if (L === ue) {
						if (I = !0, F === 0) break;
						F--;
					} else if (L === l || L === f) break;
					N++;
				}
				N >= n && !I && (P < 0 || u < P) && (Un = u, Wn = Xn), M = e.slice(u, N);
			}
		}
		if (j) {
			for (u = N; u < n && (e.charCodeAt(u) === l || e.charCodeAt(u) === f);) u++;
			var R;
			if (u < n) {
				var ee = e.charCodeAt(u);
				if (ee === se || ee === oe || ee === le) {
					var te = ee === le ? 41 : ee;
					u++;
					for (var ne = u; u < n && e.charCodeAt(u) !== te;) e.charCodeAt(u) === S && u + 1 < n && u++, u++;
					u >= n ? j = !1 : (R = e.slice(ne, u), u++);
				}
			}
			if (j) {
				for (; u < n && (e.charCodeAt(u) === l || e.charCodeAt(u) === f);) u++;
				(u >= n || e.charCodeAt(u) !== ue) && (j = !1);
			}
		}
		if (j) {
			if (u++, M = we(Wt(M)), R !== void 0 && (R = we(Wt(R))), a) {
				var re = cr(hr(E, 0, E.length, r, i));
				return {
					node: {
						type: Y.image,
						target: Hn(M, i?.sanitizer || Ee, "img", "src"),
						alt: re,
						title: R
					},
					end: u
				};
			}
			var ie = r.inAnchor;
			r.inAnchor = !0;
			var ae = ie ? [{
				type: Y.text,
				text: E
			}] : hr(E, 0, E.length, r, i);
			return r.inAnchor = ie, !r.inAnchor && sr(ae) ? null : {
				node: {
					type: Y.link,
					target: Hn(M, i?.sanitizer || Ee, "a", "href"),
					title: R,
					children: ae
				},
				end: u
			};
		}
		u = w + 1, A = !0;
	}
	var z = "", B = u;
	if (!A && k === h) {
		var ce = u + 1;
		B = ce;
		for (var V = !1; B < n && e.charCodeAt(B) !== D;) {
			if (e.charCodeAt(B) === S && B + 1 < n) {
				B += 2;
				continue;
			}
			if (e.charCodeAt(B) === h) {
				V = !0;
				break;
			}
			B++;
		}
		if (V || B >= n) return null;
		var de = e.slice(ce, B);
		if (de.trim()) z = Ht(de);
		else {
			if (Vt(E)) return null;
			z = Ht(E);
		}
		B += 1;
	} else {
		if (Vt(E)) return null;
		z = Ht(E);
	}
	var fe = r.refs?.[z];
	if (!fe) return null;
	if (a) return {
		node: {
			type: Y.image,
			target: Hn(fe.target, i?.sanitizer || Ee, "img", "src"),
			alt: cr(hr(E, 0, E.length, r, i)),
			title: fe.title
		},
		end: B
	};
	var pe = r.inAnchor;
	r.inAnchor = !0;
	var ae = pe ? [{
		type: Y.text,
		text: E
	}] : hr(E, 0, E.length, r, i);
	return r.inAnchor = pe, !r.inAnchor && sr(ae) ? null : {
		node: {
			type: Y.link,
			target: Hn(fe.target, i?.sanitizer || Ee, "a", "href"),
			title: fe.title,
			children: ae
		},
		end: B
	};
}
function rr(e, t, n) {
	if (e.charCodeAt(t) !== T) return null;
	for (var r = t + 1; r < n;) {
		var i = e.charCodeAt(r);
		if (i === _) break;
		if (i === l || i === f || i === d || i === T) return null;
		r++;
	}
	if (r >= n || e.charCodeAt(r) !== _) return null;
	var a = e.slice(t + 1, r);
	return a.match(/^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^\x00-\x20]*)$/) ? {
		node: {
			type: Y.link,
			target: a,
			title: void 0,
			children: [{
				type: Y.text,
				text: a
			}]
		},
		end: r + 1
	} : a.indexOf("@") !== -1 && /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(a) ? {
		node: {
			type: Y.link,
			target: `mailto:${a}`,
			title: void 0,
			children: [{
				type: Y.text,
				text: a
			}]
		},
		end: r + 1
	} : null;
}
function ir(e, t, n, r) {
	if (e.charCodeAt(t) !== h || t + 1 >= n || e.charCodeAt(t + 1) !== g || Jn === Xn && t >= qn) return null;
	let i = t + 2;
	for (; i < n && e.charCodeAt(i) !== D && e.charCodeAt(i) !== f;) i++;
	if (i >= n) return qn = t, Jn = Xn, null;
	if (e.charCodeAt(i) !== D) return null;
	let a = e.slice(t + 2, i);
	return a ? {
		node: {
			type: Y.footnoteReference,
			target: `#${ke(a)}`,
			text: a
		},
		end: i + 1
	} : null;
}
function ar(e, t, n, r) {
	if (r.disableBareUrls) return null;
	var i = "", a = !1, o = e.charCodeAt(t);
	if (o === N || o === 72 ? t + 8 <= n && e.charCodeAt(t + 1) === F && e.charCodeAt(t + 2) === F && e.charCodeAt(t + 3) === I && (e.charCodeAt(t + 4) === L && e.charCodeAt(t + 5) === A && e.charCodeAt(t + 6) === ae && e.charCodeAt(t + 7) === ae ? i = "https://" : e.charCodeAt(t + 4) === A && e.charCodeAt(t + 5) === ae && e.charCodeAt(t + 6) === ae && (i = "http://")) : o === M || o === 70 ? t + 6 <= n && e.charCodeAt(t + 1) === F && e.charCodeAt(t + 2) === I && e.charCodeAt(t + 3) === A && e.charCodeAt(t + 4) === ae && e.charCodeAt(t + 5) === ae && (i = "ftp://") : (o === P || o === 87) && t + 4 <= n && e.charCodeAt(t + 1) === P && e.charCodeAt(t + 2) === P && e.charCodeAt(t + 3) === ie && (i = "www.", a = !0), !i) return null;
	let s = t + i.length;
	for (; s < n;) {
		let t = e.charCodeAt(s);
		if (t === l || t === f || t === u || t === d || t === T || t === _) break;
		s++;
	}
	for (var c = 0, p = 0, h = t; h < s; h++) {
		var g = e.charCodeAt(h);
		g === le ? c++ : g === ue && p++;
	}
	let v = s;
	for (; v > t + i.length;) {
		let n = e.charCodeAt(v - 1);
		if (n === ie || n === te || n === A || n === O || n === re || n === ue || n === C || n === w || n === m) {
			if (n === ue) {
				if (c >= p) break;
				p--;
			}
			v--;
		} else if (n === ne) {
			for (var y = v - 2; y > t && (e.charCodeAt(y) >= W && e.charCodeAt(y) <= G || e.charCodeAt(y) >= K && e.charCodeAt(y) <= q || e.charCodeAt(y) >= H && e.charCodeAt(y) <= U);) y--;
			y >= t && e.charCodeAt(y) === k ? v = y : v--;
		} else break;
	}
	if (v <= t + i.length) return null;
	var b = t + (a ? 4 : i.length), x = e.indexOf("/", b);
	if ((x < 0 || x > v) && (x = v), a && e.indexOf(".", b) === -1) return null;
	for (var S = -1, E = -1, D = x - 1; D >= b; D--) if (e.charCodeAt(D) === ie) {
		if (S < 0) S = D;
		else {
			E = D;
			break;
		}
	}
	for (var D = E >= 0 ? E + 1 : b; D < x; D++) if (e.charCodeAt(D) === w) return null;
	var j = e.slice(t, v), R = a ? `http://${j}` : j;
	return {
		node: {
			type: Y.link,
			target: R,
			title: void 0,
			children: [{
				type: Y.text,
				text: j
			}]
		},
		end: v
	};
}
function or(e, t, n, r) {
	if (r.disableBareUrls) return null;
	for (var i = t, a = i; i < n;) {
		var o = e.charCodeAt(i);
		if (o >= W && o <= G || o >= K && o <= q || o >= H && o <= U || o === ie || o === O || o === v || o === 36 || o === y || o === k || o === oe || o === C || o === z || o === ae || o === x || o === re || o === g || o === w || o === p || o === ce || o === B || o === V || o === m || o === b) i++;
		else break;
	}
	if (i === a || i >= n || e.charCodeAt(i) !== E) return null;
	i++;
	for (var s = i, c = -1, l = i; i < n;) {
		var o = e.charCodeAt(i);
		if (o >= W && o <= G || o >= K && o <= q || o >= H && o <= U) i++;
		else if ((o === b || o === w) && i > s) i++;
		else if (o === ie) {
			if (i === s) break;
			var u = e.charCodeAt(i - 1);
			if (u === b || u === w || i - l > 63) break;
			if (i + 1 < n) {
				var d = e.charCodeAt(i + 1);
				if (d >= W && d <= G || d >= K && d <= q || d >= H && d <= U) c = i, l = i + 1, i++;
				else break;
			} else break;
		} else break;
	}
	if (i - l > 63 || c < 0) return null;
	var f = e.charCodeAt(i - 1);
	if (!(f >= W && f <= G || f >= K && f <= q || f >= H && f <= U) || i <= c + 1) return null;
	for (var h = -1, _ = c - 1; _ >= s; _--) if (e.charCodeAt(_) === ie) {
		h = _;
		break;
	}
	for (var _ = h >= 0 ? h + 1 : s; _ < i; _++) if (e.charCodeAt(_) === w) return null;
	var S = e.slice(t, i);
	return {
		node: {
			type: Y.link,
			target: `mailto:${S}`,
			title: void 0,
			children: [{
				type: Y.text,
				text: S
			}]
		},
		end: i
	};
}
function sr(e) {
	for (var t = 0; t < e.length; t++) if (e[t].type === Y.link || "children" in e[t] && Array.isArray(e[t].children) && sr(e[t].children)) return !0;
	return !1;
}
function cr(e, t) {
	for (var n = "", r = 0; r < e.length; r++) {
		var i = e[r];
		i.type === Y.text ? n += i.text : i.type === Y.breakLine ? n += " " : i.type === Y.codeInline || i.type === Y.footnoteReference ? n += i.text : "children" in i && Array.isArray(i.children) ? n += cr(i.children, t) : !t && i.type === Y.image && (n += i.alt || "");
	}
	return n;
}
function lr(e, t, n) {
	for (var r = 0; r < e.length; r++) {
		var i = e[r];
		if (i.type === Y.heading) {
			var a = i;
			a.id = nn(n(cr(a.children, !0)), t);
		}
		if ("children" in i) {
			var o = i.children;
			Array.isArray(o) && lr(o, t, n);
		}
		if ((i.type === Y.orderedList || i.type === Y.unorderedList) && Array.isArray(i.items)) for (var s = i.items, c = 0; c < s.length; c++) lr(s[c], t, n);
	}
}
function ur(e) {
	return {
		type: Y.text,
		text: e
	};
}
function dr(e, t, n) {
	var r = t + 1;
	if (r >= n) return -1;
	if (e.charCodeAt(r) === v) {
		r++;
		var i = r < n && (e.charCodeAt(r) === he || e.charCodeAt(r) === ge);
		i && r++;
		for (var a = r, o = i ? 6 : 7; r < n && r - a <= o;) {
			var s = e.charCodeAt(r);
			if (!(s >= H && s <= U || i && (s >= W && s <= j || s >= K && s <= M))) break;
			r++;
		}
		return r === a || r - a > o ? -1 : r < n && e.charCodeAt(r) === ne ? r + 1 : -1;
	}
	for (var c = r; r < n && r - c < 48;) {
		var l = e.charCodeAt(r);
		if (l >= W && l <= G || l >= K && l <= q || l >= H && l <= U) {
			r++;
			continue;
		}
		break;
	}
	return r === c ? -1 : r < n && e.charCodeAt(r) === ne ? r + 1 : -1;
}
function fr(e, t, n, r, i) {
	if (e.charCodeAt(t) !== T) return null;
	var a = t + 1;
	if (a >= n) return null;
	var o = e.charCodeAt(a);
	if (o === O && a + 1 < n && e.charCodeAt(a + 1) === b && a + 2 < n && e.charCodeAt(a + 2) === b) {
		var s = a + 3;
		if (s < n && e.charCodeAt(s) === _) return {
			node: {
				type: Y.htmlComment,
				text: "",
				s: !0
			},
			end: s + 1
		};
		if (s + 1 < n && e.charCodeAt(s) === b && e.charCodeAt(s + 1) === _) return {
			node: {
				type: Y.htmlComment,
				text: "-",
				s: !0
			},
			end: s + 2
		};
		var c = e.indexOf("-->", s);
		return c !== -1 && c <= n - 3 ? {
			node: {
				type: Y.htmlComment,
				text: e.slice(t + 4, c),
				s: !1
			},
			end: c + 3
		} : null;
	}
	if (o === re) {
		var d = e.indexOf("?>", a + 1);
		return d !== -1 && d < n ? {
			node: {
				type: Y.htmlSelfClosing,
				tag: "?",
				attrs: {},
				m: e.slice(t, d + 2),
				a: !1
			},
			end: d + 2
		} : null;
	}
	if (o === O && a + 1 < n) {
		var p = e.charCodeAt(a + 1);
		if (p === h && e.slice(a + 1, a + 8) === "[CDATA[") {
			var m = e.indexOf("]]>", a + 8);
			return m !== -1 && m < n ? {
				node: {
					type: Y.htmlSelfClosing,
					tag: "![CDATA[",
					attrs: {},
					m: e.slice(t, m + 3),
					a: !1
				},
				end: m + 3
			} : null;
		}
		if (p >= W && p <= G) {
			var g = e.indexOf(">", a + 2);
			return g !== -1 && g < n ? {
				node: {
					type: Y.htmlSelfClosing,
					tag: `!${e.slice(a + 1, g)}`,
					attrs: {},
					m: e.slice(t, g + 1),
					a: !1
				},
				end: g + 1
			} : null;
		}
	}
	if (o === ae) {
		var v = a + 1;
		if (v >= n) return null;
		var y = e.charCodeAt(v);
		if (!(y >= W && y <= G || y >= K && y <= q)) return null;
		for (v++; v < n;) {
			var x = e.charCodeAt(v);
			if (x >= W && x <= G || x >= K && x <= q || x >= H && x <= U || x === b) v++;
			else break;
		}
		for (; v < n && (e.charCodeAt(v) === l || e.charCodeAt(v) === u || e.charCodeAt(v) === f);) v++;
		if (v < n && e.charCodeAt(v) === _) {
			var S = e.slice(a + 1, v).trim();
			return {
				node: {
					type: Y.htmlSelfClosing,
					tag: S,
					attrs: {},
					h: e.slice(t, v + 1),
					a: !0
				},
				end: v + 1
			};
		}
		return null;
	}
	if (!(o >= W && o <= G || o >= K && o <= q)) return null;
	var C = Ft(e, t);
	if (!C) return null;
	var w = C.tag, E = w.toLowerCase();
	if (C.n || Me(w)) return {
		node: {
			type: Y.htmlSelfClosing,
			tag: w,
			attrs: bn(C.attrs, w, i),
			m: C.q ? Nt(C) : e.slice(t, C.end),
			a: !1
		},
		end: C.end
	};
	var D = vt.has(E), k = wn(e.slice(0, n), C.end, w);
	if (k === -1) return {
		node: {
			type: Y.htmlSelfClosing,
			tag: w,
			attrs: bn(C.attrs, w, i),
			m: C.q ? Nt(C) : e.slice(t, C.end),
			a: !1
		},
		end: C.end
	};
	var A = Sn(e, `</${E}`, k), j = e.slice(C.end, A);
	if (D) {
		var M = It(j);
		return {
			node: {
				type: Y.htmlBlock,
				tag: w,
				attrs: bn(C.attrs, w, i),
				b: C.g + C.b,
				children: [],
				e: M || void 0,
				h: e.slice(A, k),
				text: M,
				c: !0,
				a: !1
			},
			end: k
		};
	}
	var N = [], P = j.trim();
	if (P) {
		var { inAnchor: F, inline: I, k: L } = r;
		E === "a" && (r.inAnchor = !0), r.k = !1, P.indexOf("\n\n") !== -1 || /^#{1,6}\s/.test(P) ? (r.inline = !1, N = _r(P, r, i)) : N = hr(P, 0, P.length, r, i), r.inAnchor = F, r.inline = I, r.k = L;
	}
	return {
		node: {
			type: Y.htmlBlock,
			tag: w,
			attrs: bn(C.attrs, w, i),
			b: C.b,
			children: N,
			text: It(j),
			c: !1,
			a: !1
		},
		end: k
	};
}
var pr = 200, mr = 0;
function hr(e, t, n, r, i) {
	if (mr++, mr > pr) return mr--, [{
		type: Y.text,
		text: e.slice(t, n)
	}];
	var a = Xn;
	Xn = Zn();
	let o = r;
	if (i.optimizeForStreaming) {
		let r = function(e, t) {
			for (var n = 1, r = t + 1; r < e.length; r++) {
				var i = e.charCodeAt(r);
				if (i === h) n++;
				else if (i === D && (n--, n === 0)) return r;
			}
			return -1;
		}, i = e.slice(t, n), a = i;
		for (var s = 0, c = 0, u = 0, d = 0, _ = 0, v = -1, y = -1, b = -1, E = -1, A = -1, j = 0; j < i.length; j++) {
			var I = i.charCodeAt(j);
			I === C ? j + 1 < i.length && i.charCodeAt(j + 1) === C ? (s++, v = j, j++) : (c++, y = j) : I === w ? j + 1 < i.length && i.charCodeAt(j + 1) === w ? (u++, b = j, j++) : (d++, E = j) : I === m && j + 1 < i.length && i.charCodeAt(j + 1) === m && (_++, A = j, j++);
		}
		var L = [];
		_ % 2 == 1 && A >= 0 && L.push([A, 2]), u % 2 == 1 && b >= 0 && L.push([b, 2]), d % 2 == 1 && E >= 0 && L.push([E, 1]), s % 2 == 1 && v >= 0 && L.push([v, 2]), c % 2 == 1 && y >= 0 && L.push([y, 1]), L.sort((e, t) => t[0] - e[0]);
		for (var R = 0; R < L.length; R++) {
			var ee = L[R][0], te = L[R][1];
			i = i.slice(0, ee) + i.slice(ee + te);
		}
		let o = 0, l = -1;
		for (let e = 0; e < i.length; e++) i.charCodeAt(e) === p && (o++, l = e);
		if (o % 2 == 1 && l !== -1) {
			let e = !1, t = -1, n = 0;
			for (; n < i.length;) i.charCodeAt(n) === p && (e ? (e = !1, t = -1) : (t = n, e = !0)), n++;
			e && t !== -1 && (i = i.slice(0, t));
		}
		for (var ne = !0; ne;) {
			ne = !1;
			for (var re = -1, ie = -1, oe = -1, se = !1, z = 0; z < i.length; z++) if (i.charCodeAt(z) === h && (z === 0 || i.charCodeAt(z - 1) !== S)) {
				var B = z > 0 && i.charCodeAt(z - 1) === O, ce = B ? z - 1 : z, V = r(i, z);
				if (V === -1) re = ce, se = B, ie = z + 1, oe = i.length;
				else {
					var ue = V + 1;
					if (ue >= i.length) re = ce, se = B, ie = z + 1, oe = V;
					else if (i.charCodeAt(ue) === le) {
						var de = i.indexOf(")", ue + 1);
						de === -1 ? (re = ce, se = B, ie = z + 1, oe = V, z = i.length) : z = de;
					} else if (i.charCodeAt(ue) === h) {
						var fe = i.indexOf("]", ue + 1);
						fe === -1 ? (re = ce, se = B, ie = z + 1, oe = V, z = i.length) : z = fe;
					} else z = V;
				}
			}
			if (re >= 0) {
				var pe = se ? "" : i.slice(ie, oe);
				i = i.slice(0, re) + pe, ne = !0;
			}
		}
		let f = i.match(/<([A-Z][A-Za-z0-9]*)(?:\s[^>]*)?>([^<]*)$/);
		if (f && f.index !== void 0) {
			var me = f[0].length - f[2].length;
			if (!(me >= 2 && f[0].charCodeAt(me - 2) === ae)) {
				for (var he = !1, ge = 0, _e = 0; _e < f.index; _e++) i.charCodeAt(_e) === p && ge++;
				if (he = ge % 2 == 1, !he) {
					let e = f[1];
					xn(i, `</${e}`, 0) === -1 && (i = i.slice(0, f.index) + f[2]);
				}
			}
		}
		i !== a && (e = e.slice(0, t) + i, n = t + i.length);
	}
	let J = [];
	var ye = [];
	let X = t;
	var be = "", xe = i.disableAutoLink || i.disableBareUrls || o.inAnchor ? -1 : e.indexOf("@", t);
	for (xe >= n && (xe = -1); t < n;) {
		let r = e.charCodeAt(t), a = null;
		if (r === p) {
			if (a = Nn(e, t, n), !a) {
				var Se = Zt(e, t, n, p);
				t += Se - 1;
			}
		} else if (r === C || r === w) {
			var Ce = Bn(e, t, n);
			if (Ce) {
				if (Ce.canOpen || Ce.canClose) {
					(be || t > X) && (J.push(ur(be + e.slice(X, t))), be = "");
					var Te = ur(e.slice(t, t + Ce.len));
					ye.push({
						idx: J.length,
						ch: r,
						len: Ce.len,
						canOpen: Ce.canOpen,
						canClose: Ce.canClose,
						active: !0
					}), J.push(Te), t += Ce.len, X = t;
					continue;
				}
				t += Ce.len - 1;
			}
		} else if (r === m) a = In(e, t, n, o, i);
		else if (r === x) a = Ln(e, t, n, o, i);
		else if (r === h) t + 1 < n && e.charCodeAt(t + 1) === g && (a = ir(e, t, n, o)), a ||= nr(e, t, n, o, i);
		else if (r === O && t + 1 < n && e.charCodeAt(t + 1) === h) a = nr(e, t, n, o, i);
		else if (r === T) a = rr(e, t, n), !(a || i.disableParsingRawHTML || i.ignoreHTMLBlocks) && (a = fr(e, t, n, o, i));
		else if (r === k) {
			var Ee = dr(e, t, n);
			if (Ee !== -1) {
				var Z = e.slice(t, Ee), De = we(Z);
				if (De !== Z) {
					be = be + e.slice(X, t) + De, t = Ee, X = Ee;
					continue;
				}
			}
		} else if ((r === N || r === P || r === M) && !o.inAnchor && !i.disableAutoLink && (t === 0 || e.charCodeAt(t - 1) !== T)) {
			var Oe = t + 1 < n ? e.charCodeAt(t + 1) : 0;
			(r === N && Oe === F || r === M && Oe === F || r === P && Oe === P) && (a = ar(e, t, n, i));
		}
		if (!a && xe >= 0 && xe - t <= 64 && !o.inAnchor && !i.disableAutoLink && !i.disableBareUrls && (r >= W && r <= G || r >= K && r <= q || r >= H && r <= U) && (a = or(e, t, n, i), !a && t >= xe && (xe = e.indexOf("@", t + 1), xe >= n && (xe = -1))), r === f && o.k) {
			var ke = !1, Ae = 0;
			if (t > X && e.charCodeAt(t - 1) === S) ke = !0, Ae = 1;
			else {
				for (var je = 0, Me = t - 1; Me >= X && e.charCodeAt(Me) === l;) je++, Me--;
				je >= 2 && (ke = !0, Ae = je);
			}
			if (ke) {
				for ((be || t - Ae > X) && (J.push(ur(be + e.slice(X, t - Ae))), be = ""), J.push({ type: Y.breakLine }), t++; t < n && e.charCodeAt(t) === l;) t++;
				X = t;
				continue;
			}
			var Ne = t > X && e.charCodeAt(t - 1) === l, Pe = t + 1 < n && e.charCodeAt(t + 1) === l;
			if (Ne || Pe) {
				for (var Fe = t; Fe > X && e.charCodeAt(Fe - 1) === l;) Fe--;
				for (be += `${e.slice(X, Fe)}
`, t++; t < n && e.charCodeAt(t) === l;) t++;
				X = t;
				continue;
			}
		}
		if (a) (be || t > X) && (J.push(ur(be + e.slice(X, t))), be = ""), J.push(a.node), t = a.end, X = t;
		else {
			if (r === S && t + 1 < n && Ut(e.charCodeAt(t + 1)) & Q) {
				(be || t > X) && (J.push(ur(be + e.slice(X, t))), be = ""), J.push(ur(e[t + 1])), t += 2, X = t;
				continue;
			}
			if (t++, xe < 0 || xe - t > 64) for (; t < n && !(xe >= 0 && xe - t <= 64);) {
				var Ie = e.charCodeAt(t);
				if (Ie < ve && !Ct[Ie]) t++;
				else break;
			}
		}
	}
	return (be || n > X) && (J.push(ur(be + e.slice(X, n))), be = ""), ye.length > 0 && Vn(J, ye, r, i), Xn = a, mr--, J;
}
var gr = 500;
function _r(e, t, n) {
	var r = t.o || 0;
	if (r > gr) return [{
		type: Y.text,
		text: e
	}];
	if (t.o = r + 1, n.optimizeForStreaming && !(t.i || t.w)) {
		for (var i = e.length; i > 0 && e.charCodeAt(i - 1) === f;) i--;
		for (var a = i; a > 0 && e.charCodeAt(a - 1) !== f;) a--;
		if (i > a && e.charCodeAt(a) === B) {
			for (var o = !1, s = a + 1; s < i; s++) {
				var c = e.charCodeAt(s);
				if (c !== l && c !== u && c !== B && c !== A && c !== b) {
					o = !0;
					break;
				}
			}
			for (var d = !1, g = !1, y = 0, x = a, S = a - 1; S > 0;) {
				for (var E = S; E > 0 && e.charCodeAt(E - 1) !== f;) E--;
				if (e.charCodeAt(E) !== B) break;
				x = E;
				for (var D = !0, k = !1, j = E; j < S; j++) {
					var M = e.charCodeAt(j);
					if (M === b) k = !0;
					else if (M !== l && M !== u && M !== A && M !== B) {
						D = !1;
						break;
					}
				}
				D && k ? (d = !0, g = !0) : g || y++, S = E - 1;
			}
			o ? d || (e = e.slice(0, a).trimEnd()) : e = d && y > 0 ? e.slice(0, a).trimEnd() : e.slice(0, x).trimEnd();
		}
		for (var N = -1, P = -1, F = -1, I = !1, L = e.length - 1; L >= 0; L--) if (e.charCodeAt(L) === T) {
			for (var R = L + 1 < e.length ? e.charCodeAt(L + 1) : 0, ee = R >= W && R <= G || R >= K && R <= q, te = R === ae && L + 2 < e.length && (e.charCodeAt(L + 2) >= W && e.charCodeAt(L + 2) <= G || e.charCodeAt(L + 2) >= K && e.charCodeAt(L + 2) <= q), ne = R === O || R === re, oe = e.length; oe > L + 1 && e.charCodeAt(oe - 1) === f;) oe--;
			var se = L + 1 >= oe;
			if (ee || te || ne || se) {
				var ce = L + 1;
				if ((te || ee) && (ce = L + 2), ee || te) for (; ce < e.length;) {
					var V = e.charCodeAt(ce);
					if (V >= W && V <= G || V >= K && V <= q || V >= H && V <= U) ce++;
					else break;
				}
				for (var le = ee || te ? ce : L + 2; le < e.length && e.charCodeAt(le) !== _;) le++;
				if (le >= e.length) N = L, I = !0;
				else if ((ee || te) && e.charCodeAt(le - 1) !== ae) {
					for (var de = !1, fe = le + 1; fe < e.length; fe++) if (e.charCodeAt(fe) === T) {
						de = !0;
						break;
					}
					de || (N = L, P = ce, F = le + 1);
				}
			}
			break;
		}
		if (N >= 0) {
			for (var pe = 0, me = 0; me < N; me++) e.charCodeAt(me) === p && pe++;
			if (pe % 2 == 0) {
				if (I) e = e.slice(0, N);
				else {
					var he = e.slice(N + 1, P);
					xn(e, `</${he}`, 0) === -1 && (e = e.slice(0, N) + e.slice(F));
				}
			}
		}
		for (var ge = e.length; ge > 0 && e.charCodeAt(ge - 1) === f;) ge--;
		if (ge > 0) {
			for (var ve = ge; ve > 0 && e.charCodeAt(ve - 1) !== f;) ve--;
			for (var J = ve, X = 0; J < ge && e.charCodeAt(J) === l && X < 3;) J++, X++;
			if (ve > 0 && J < ge && an(e, J, ge)) {
				for (var be = ve - 1, xe = be; xe > 0 && e.charCodeAt(xe - 1) !== f;) xe--;
				tn(e, xe, be) || (e = e.slice(0, ve).trimEnd());
			}
		}
		var Se = e.length;
		if (Se > 0) {
			for (var Ce = e.lastIndexOf("\n"), we = Ce === -1 ? 0 : Ce + 1, Te = Se, Ee = we, Z = 0; Ee < Te && e.charCodeAt(Ee) === l && Z < 3;) Ee++, Z++;
			if (Ee < Te) {
				var De = e.charCodeAt(Ee), Oe = !1;
				if (De === C || De === b || De === z) {
					var ke = Ee + 1;
					if (ke >= Te || e.charCodeAt(ke) === l || e.charCodeAt(ke) === u) {
						for (var Ae = ke; Ae < Te && (e.charCodeAt(Ae) === l || e.charCodeAt(Ae) === u);) Ae++;
						Ae >= Te && (Oe = !0);
					}
				} else if (De >= H && De <= U) {
					for (var je = Ee; je < Te && e.charCodeAt(je) >= H && e.charCodeAt(je) <= U;) je++;
					if (je < Te && (e.charCodeAt(je) === ie || e.charCodeAt(je) === ue)) {
						var Me = je + 1;
						if (Me >= Te || e.charCodeAt(Me) === l || e.charCodeAt(Me) === u) {
							for (var Ne = Me; Ne < Te && (e.charCodeAt(Ne) === l || e.charCodeAt(Ne) === u);) Ne++;
							Ne >= Te && (Oe = !0);
						}
					}
				}
				Oe && (e = e.slice(0, we).trimEnd());
			}
		}
	}
	if (t.inline) return hr(e, 0, e.length, t, n);
	let Pe = [], Q = 0, Fe = e.length;
	if (Q === 0 && !n.disableFrontmatter && e.startsWith("---")) {
		let t = ye(e);
		if (t?.hasValidYaml) {
			if (n.preserveFrontmatter !== !1) {
				let n = e.slice(0, t.endPos).trimEnd();
				Pe.push({
					type: Y.frontmatter,
					text: n
				});
			}
			Q = t.endPos;
		}
	}
	for (; Q < Fe;) {
		for (var Ie = e.indexOf("\n", Q), Le = Ie < 0 ? Fe : Ie; Q < Fe && tn(e, Q, Le);) Q = Le < Fe ? Le + 1 : Le, Q < Fe && (Ie = e.indexOf("\n", Q), Le = Ie < 0 ? Fe : Ie);
		if (Q >= Fe) break;
		var Re = e.charCodeAt(Q) === _e;
		en(e, Q, Le);
		let r = null;
		if (Gt = e, Kt = Q, qt = Le, !Re && Qt >= 4 && !t.inHTML) r = fn(e, Q);
		else if (!Re) {
			let i = Q + $t, a = e.charCodeAt(i);
			a === v ? r = rn(e, Q, t, n) : a === _ ? r = pn(e, Q, t, n) : a === p || a === m ? r = un(e, Q, t) : a === b || a === C || a === w ? (r = on(e, Q), !r && (r = vn(e, Q, t, n))) : a === z || a >= H && a <= U ? r = vn(e, Q, t, n) : a === T ? r = Tn(e, Q, t, n) : a === B ? r = On(e, Q, t, n) : a === h && (r = kn(e, Q, t));
		}
		if (!r) {
			for (var ze = !1, Be = Q; Be < Le; Be++) if (e.charCodeAt(Be) === B) {
				ze = !0;
				break;
			}
			ze && (r = On(e, Q, t, n));
		}
		if (r ||= jn(e, Q, t, n), r) r.node.type !== Y.refCollection && Pe.push(r.node), Q = r.end;
		else {
			var Ve = e.indexOf("\n", Q);
			Q = Ve < 0 ? Fe : Ve + 1;
		}
	}
	return t.o = r, Pe;
}
function vr(e, t, n, r) {
	var i = Ft(e, t);
	return i ? {
		tagName: i.tag,
		tagLower: i.tag.toLowerCase(),
		attrs: i.b,
		whitespaceBeforeAttrs: i.g,
		isSelfClosing: i.n,
		hasSpaceBeforeSlash: i.r,
		isClosing: i.f,
		hasNewline: i.g.includes("\n") || i.b.includes("\n"),
		endPos: i.end
	} : null;
}
function yr(e, t, n) {
	mr = 0, e = Ue(e), !t.refs && (t.refs = {}), (n.optimizeForStreaming || t.inline) && (t.w = Lt(e, t.refs, n));
	var r, i;
	t.t || (t.t = r = [], t.p = i = []);
	let a = _r(e, t, n);
	if (r && i) {
		for (var o = r, s = {
			inline: t.inline,
			inAnchor: t.inAnchor,
			inHTML: t.inHTML,
			htmlDepth: t.d,
			inList: t.inList,
			inBlockQuote: t.inBlockQuote,
			noSetext: t.l,
			depth: t.o
		}, c = 0; c < o.length; c++) {
			var l = o[c];
			t.inline = l.inline, t.inAnchor = l.inAnchor, t.inHTML = l.inHTML, t.d = l.htmlDepth, t.inList = l.inList, t.inBlockQuote = l.inBlockQuote, t.l = l.noSetext, t.o = l.depth, t.k = l.breaks;
			var u = hr(l.text, 0, l.text.length, t, n);
			t.k = !1;
			for (var d = 0; d < u.length; d++) l.dest.push(u[d]);
		}
		t.inline = s.inline, t.inAnchor = s.inAnchor, t.inHTML = s.inHTML, t.d = s.htmlDepth, t.inList = s.inList, t.inBlockQuote = s.inBlockQuote, t.l = s.noSetext, t.o = s.depth;
		for (var f = i, p = 0; p < f.length; p++) for (var m = f[p], h = 0; h < m.src.length; h++) {
			var g = m.src[h];
			if (m.unwrap && g.type === Y.paragraph) for (var _ = g.children, v = 0; v < _.length; v++) m.dest.push(_[v]);
			else m.dest.push(g);
		}
		t.t = void 0, t.p = void 0, lr(a, t, n.slugify);
	}
	return Ke(t.refs) ? [{
		type: Y.refCollection,
		refs: t.refs
	}, ...a] : a;
}
var br;
try {
	xr = n.createElement("div"), br = typeof xr == "object" && xr && "$$typeof" in xr && typeof xr.$$typeof == "symbol" ? xr.$$typeof : Symbol.for("react.transitional.element");
} catch {
	br = Symbol.for("react.transitional.element");
}
var xr;
function Sr(e, t, n) {
	return {
		$$typeof: br,
		type: e,
		key: n == null ? null : String(n),
		ref: null,
		props: t,
		_owner: null,
		_store: {},
		_debugStack: null,
		_debugTask: null
	};
}
function Cr(e, t) {
	var n = { key: e };
	if (t) {
		var r = Se(t);
		for (var i in r) n[i] = r[i];
	}
	return n;
}
var wr = typeof n.createContext > "u" ? void 0 : n.createContext(void 0);
function Tr(e, t, r, i, a, o, s, c, l) {
	switch (e.type) {
		case Y.blockQuote: {
			let n = { key: r.key };
			return e.alert && (n.className = `markdown-alert-${o(e.alert.toLowerCase(), ke)}`, e.children.unshift(qe(e.alert))), i("blockquote", n, t(e.children, r));
		}
		case Y.breakLine: return i("br", { key: r.key });
		case Y.breakThematic: return i("hr", { key: r.key });
		case Y.frontmatter: return c.preserveFrontmatter ? i("pre", { key: r.key }, e.text) : null;
		case Y.codeBlock: {
			let t = e.lang ? we(e.lang) : "";
			var u = e.attrs ? Se(e.attrs) : {};
			return u.className = t ? `language-${t} lang-${t}` : "", i("pre", { key: r.key }, i("code", u, e.text));
		}
		case Y.codeInline: return i("code", { key: r.key }, e.text);
		case Y.footnoteReference: return i("a", {
			key: r.key,
			href: a(e.target, "a", "href") || void 0
		}, i("sup", null, e.text));
		case Y.gfmTask: return i("input", {
			checked: e.completed,
			key: r.key,
			readOnly: !0,
			type: "checkbox"
		});
		case Y.heading: return i(`h${e.level}`, {
			id: e.id,
			key: r.key
		}, t(e.children, r));
		case Y.htmlBlock: {
			let o = e;
			if (rt(c) && dt(o.tag)) {
				var d = tt(o);
				return d.kind === "literal" ? i("span", { key: r.key }, d.literal) : i("span", { key: r.key }, ...nt(d.open, o.children ? t(o.children, r) : null, d.close));
			}
			let u = o.j, _ = u !== void 0, v = _ ? u : o.a ? o.e || "" : (o.e || "") + (o.h || "");
			if (v && o.c) {
				let i = Tt(o.tag.toLowerCase()), d = o.children, y = d != null && d.length > 0;
				if (i) {
					let t = _ ? u : o.e || "", n = rt(c) ? pt(t) : t;
					if (/<[a-z][^>]{0,100}>/i.test(v)) {
						var f = Cr(r.key, e.attrs);
						return f.dangerouslySetInnerHTML = { __html: n }, l(e.tag, f);
					}
					return l(e.tag, Cr(r.key, e.attrs), n);
				}
				let b = RegExp(`^<${o.tag}(\\s|>)`, "i");
				if (y && !b.test(v) && rt(c) && ft(v)) return l(e.tag, Cr(r.key, e.attrs), t(d, r));
				if (Et(v)) {
					let t = rt(c) ? pt(v) : v;
					var p = Cr(r.key, e.attrs);
					return p.dangerouslySetInnerHTML = { __html: t }, l(e.tag, p);
				}
				let x = mt({
					slugify: c.slugify,
					sanitizer: a,
					tagfilter: !0
				}), S = We(v);
				if (RegExp(`^<${o.tag}(\\s[^>]*)?>(\\s*</${o.tag}>)?$`, "i").test(S)) return o.children && o.children.length > 0 ? l(e.tag, Cr(r.key, e.attrs), t(o.children, r)) : l(e.tag, Cr(r.key, e.attrs));
				let C = yr(S, {
					inline: !1,
					refs: s,
					inHTML: !1
				}, x);
				Ze(C);
				let w = o.tag.toLowerCase(), T = _;
				if (T && y) return l(e.tag, Cr(r.key, e.attrs), t(d, r));
				if (T) return t(C.flatMap(Xe), r);
				var m = Qe(C, w);
				if (m.found && m.afterClose.length > 0) {
					var h = m.beforeClose.flatMap(Xe), g = m.afterClose.flatMap(Xe);
					return Sr(n.Fragment, { children: [l(e.tag, Cr(r.key, e.attrs), t(h, r)), t(g, r)] }, r.key);
				}
				return l(e.tag, Cr(r.key, e.attrs), t(C.flatMap(Xe), r));
			}
			return Me(e.tag) ? l(e.tag, Cr(r.key, e.attrs)) : l(e.tag, Cr(r.key, e.attrs), e.children ? t(e.children, r) : "");
		}
		case Y.htmlSelfClosing: {
			let t = e;
			if (rt(c) && dt(t.tag)) {
				var _ = tt(t);
				return i("span", { key: r.key }, _.kind === "literal" ? _.literal : _.open + (_.close || ""));
			}
			return l(e.tag, Cr(r.key, e.attrs));
		}
		case Y.image: {
			let t = e.target === null ? null : a(e.target, "img", "src");
			return i("img", {
				key: r.key,
				alt: e.alt && e.alt.length > 0 ? e.alt : void 0,
				title: e.title || void 0,
				src: t || void 0
			});
		}
		case Y.link: {
			let n = { key: r.key };
			if (e.target != null) {
				let t = it(e.target, a, "a", "href");
				t != null && (n.href = t);
			}
			return e.title && (n.title = e.title), i("a", n, t(e.children, r));
		}
		case Y.table: {
			let n = e;
			return i("table", { key: r.key }, i("thead", { key: "thead" }, i("tr", null, n.header.map(function(e, a) {
				return i("th", {
					key: a,
					style: n.align[a] === null ? {} : { textAlign: n.align[a] }
				}, t(e, r));
			}))), n.cells.length > 0 && i("tbody", { key: "tbody" }, n.cells.map(function(e, a) {
				return i("tr", { key: a }, e.map(function(e, a) {
					return i("td", {
						key: a,
						style: n.align[a] === null ? {} : { textAlign: n.align[a] }
					}, t(e, r));
				}));
			})));
		}
		case Y.text: return e.text;
		case Y.textFormatted: return i(e.tag, { key: r.key }, t(e.children, r));
		case Y.orderedList:
		case Y.unorderedList: return i(e.type === Y.orderedList ? "ol" : "ul", {
			key: r.key,
			start: e.type === Y.orderedList ? e.start : void 0
		}, e.items.map(function(e, n) {
			return i("li", { key: n }, t(e, r));
		}));
		case Y.paragraph: return i("p", { key: r.key }, t(e.children, r));
		case Y.ref: return null;
		default: return null;
	}
}
var Er = (e, t, n, r, i, a, o) => {
	var s = (e) => e.map((e) => "text" in e ? e.text : ""), c = (l, u = {}) => {
		var d = Array.isArray(l) ? l : [l], f = (u.renderDepth || 0) + 1;
		if (f > 2500) return s(d);
		u.renderDepth = f;
		for (var p = u.key, m = [], h = !1, g = 0; g < d.length; g++) {
			u.key = g;
			var _ = e ? e(Tr.bind(null, d[g], c, u, t, n, r, i, a, o), d[g], c, u) : Tr(d[g], c, u, t, n, r, i, a, o), v = typeof _ == "string";
			if (h && typeof _ == "string") {
				var y = m.at(-1);
				m[m.length - 1] = (typeof y == "string" ? y : "") + _;
			} else if (_ != null) {
				if (Array.isArray(_)) for (var b = 0; b < _.length; b++) m.push(_[b]);
				else m.push(_);
			}
			h = v;
		}
		return u.key = p, u.renderDepth = f - 1, m;
	};
	return c;
}, Dr = (e, t) => {
	let n = ot(t, e, void 0);
	return n ? typeof n == "function" || typeof n == "object" && "render" in n ? n : ot(t, `${e}.component`, e) : e;
};
function Or(e, t) {
	let n = { ...t || {} };
	n.overrides = n.overrides || {};
	let r = n.slugify || ke, i = n.sanitizer || Ee, a = n.createElement, o = Ke(n.overrides), s = (e) => kr(e, {
		...n,
		wrapper: null
	});
	function c(e) {
		for (var t in e) {
			var n = e[t];
			if (typeof n == "string" && n.length > 0 && n.charCodeAt(0) === T && (ht.test(n) || gt.test(n) || vr(n, 0))) {
				var r = s(n.trim());
				e[t] = t === "innerHTML" && Array.isArray(r) ? r[0] : r;
			}
		}
	}
	function l(e, t, ...r) {
		var i = t || {}, s = e;
		if (o) {
			var c = ot(n.overrides, `${e}.props`, {});
			s = Dr(e, n.overrides), i = {
				...i,
				...c,
				className: ct(i.className, c.className) || void 0
			};
		}
		if (!a) {
			var l = i.key;
			return l != null && delete i.key, r.length === 1 ? i.children = r[0] : r.length > 1 && (i.children = r), Sr(s, i, l);
		}
		return a(s, i, ...r);
	}
	function u(e, t, ...n) {
		return t && c(t), l(e, t, ...n);
	}
	let d = mt(n, n.forceInline), f = e[0] && e[0].type === Y.refCollection ? e[0].refs : {}, p = Er(n.renderRule, l, i, r, f, n, u), m = p(e, {
		inline: n.forceInline,
		refs: f
	}), h = at(f);
	if (h.length > 0 && m.push(l("footer", { key: "footer" }, h.map(function(e) {
		let t = e.identifier.charCodeAt(0) === g ? e.identifier.slice(1) : e.identifier, n = yr(e.footnote, {
			inline: !0,
			refs: f
		}, d);
		return l("div", {
			id: r(t, ke),
			key: e.identifier
		}, `${t}: `, p(n, {
			inline: !0,
			refs: f
		}));
	}))), n.wrapper === null) return m;
	let _ = n.wrapper || (n.forceInline ? "span" : "div"), v;
	if (m.length > 1 || n.forceWrapper) v = m;
	else return m.length === 1 ? m[0] : null;
	var y = n.wrapperProps ? { ...n.wrapperProps } : {};
	return y.children = v, Sr(_, y, "outer");
}
function kr(e = "", t = {}) {
	let n = { ...t || {} };
	n.overrides = n.overrides || {};
	function r(e) {
		let t = n.forceInline || !(n.forceBlock || Ce.test(e)), r = mt(n, t);
		return Or(yr(t ? e : Ye(e), {
			inline: t,
			refs: i
		}, r), {
			...n,
			forceInline: t
		});
	}
	let i = {};
	return r(e);
}
function Ar(e) {
	let t = n.useRef(e), r = t.current;
	if (r !== e) {
		var i = !0, a = 0;
		for (var o in e) if (a++, !Object.is(r[o], e[o])) {
			i = !1;
			break;
		}
		if (i) {
			var s = 0;
			for (var c in r) s++;
			i = s === a;
		}
		i || (t.current = e);
	}
	return t.current;
}
var jr = ({ children: e, options: t, ...r }) => {
	if (!(typeof n.useContext < "u")) return kr(e ?? "", {
		...t,
		overrides: { ...t?.overrides },
		wrapperProps: {
			...t?.wrapperProps,
			...r
		}
	});
	let i = wr ? n.useContext(wr) : void 0, a = Ar(r), o = n.useMemo(() => ({
		...i,
		...t,
		overrides: {
			...i?.overrides,
			...t?.overrides
		},
		wrapperProps: {
			...i?.wrapperProps,
			...t?.wrapperProps,
			...a
		}
	}), [
		i,
		t,
		a
	]), s = e ?? "";
	return n.useMemo(() => kr(s, o), [s, o]);
}, Mr = /* @__PURE__ */ e({ default: () => Fr }), Nr = {
	small: {
		1: "dc:text-lg",
		2: "dc:text-base",
		3: "dc:text-sm"
	},
	medium: {
		1: "dc:text-3xl",
		2: "dc:text-2xl",
		3: "dc:text-xl"
	},
	large: {
		1: "dc:text-5xl",
		2: "dc:text-4xl",
		3: "dc:text-3xl"
	}
}, Pr = {
	1: "dc:mb-4",
	2: "dc:mb-3",
	3: "dc:mb-2"
}, Fr = r.memo(function({ displayConfig: e = {}, height: n = "100%", colorPalette: r }) {
	let { t: s } = t(), c = e.content || "", l = e.accentColorIndex ?? 0, u = e.fontSize || "medium", d = e.alignment || "left", f = !!e.transparentBackground, p = e.accentBorder || "none", m = i(() => r?.colors && l < r.colors.length ? r.colors[l] : "#8884d8", [r, l]), h = {
		small: "dc:text-sm",
		medium: "dc:text-lg",
		large: "dc:text-xl"
	}, g = {
		left: "dc:text-left",
		center: "dc:text-center",
		right: "dc:text-right"
	}, _ = i(() => ({ overrides: {
		h1: { props: {
			className: `dc:font-bold ${Nr[u]?.[1] || "dc:text-3xl"} ${Pr[1]}`,
			style: { color: m }
		} },
		h2: { props: {
			className: `dc:font-bold ${Nr[u]?.[2] || "dc:text-2xl"} ${Pr[2]}`,
			style: { color: m }
		} },
		h3: { props: {
			className: `dc:font-bold ${Nr[u]?.[3] || "dc:text-xl"} ${Pr[3]}`,
			style: { color: m }
		} },
		p: { props: { className: "dc:mb-3 dc:leading-relaxed text-dc-text" } },
		strong: { props: { className: "dc:font-bold text-dc-text" } },
		em: { props: { className: "dc:italic text-dc-text" } },
		a: { props: {
			className: "dc:hover:underline dc:transition-colors",
			target: "_blank",
			rel: "nofollow noopener noreferrer",
			style: { color: m }
		} },
		code: { props: { className: "dc:px-1 dc:py-0.5 dc:rounded-sm dc:text-xs bg-dc-surface-secondary text-dc-accent dc:font-mono" } },
		pre: { props: { className: "dc:rounded-lg dc:p-3 dc:my-2 dc:overflow-x-auto dc:text-xs bg-dc-surface-secondary text-dc-text dc:font-mono" } },
		ul: { props: { className: "dc:list-disc dc:ml-6 dc:mb-3 text-dc-text dc:space-y-1" } },
		ol: { props: { className: "dc:list-decimal dc:ml-6 dc:mb-3 text-dc-text dc:space-y-1" } },
		li: { props: { className: "dc:mb-1 text-dc-text" } },
		blockquote: { props: { className: "dc:border-l-4 border-dc-accent dc:pl-3 dc:my-2 dc:italic text-dc-text-secondary" } },
		hr: { props: {
			className: "dc:my-4 dc:border-none",
			style: {
				height: "2px",
				backgroundColor: m,
				opacity: .3
			}
		} },
		table: { props: { className: "dc:w-full dc:border-collapse dc:my-3 dc:text-sm" } },
		thead: { props: { className: "bg-dc-surface-secondary" } },
		th: { props: { className: "dc:px-3 dc:py-2 dc:text-left dc:font-semibold dc:text-xs text-dc-text-secondary dc:uppercase dc:tracking-wider border-dc-border dc:border-b" } },
		td: { props: { className: "dc:px-3 dc:py-2 text-dc-text border-dc-border dc:border-b" } },
		tr: { props: { className: "dc:hover:opacity-80" } }
	} }), [m, u]);
	if (!c.trim()) return f ? null : /* @__PURE__ */ a("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full dc:h-full",
		style: { height: n === "100%" ? "100%" : n },
		children: /* @__PURE__ */ o("div", {
			className: "dc:text-center text-dc-text-muted",
			children: [/* @__PURE__ */ a("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: s("chart.runtime.markdown.noContent")
			}), /* @__PURE__ */ a("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: s("chart.runtime.markdown.addContent")
			})]
		})
	});
	let v = {};
	if (p !== "none") {
		let e = `border${p.charAt(0).toUpperCase() + p.slice(1)}`;
		if (v[e] = `4px solid ${m}`, f) {
			let e = `padding${p.charAt(0).toUpperCase() + p.slice(1)}`;
			p === "left" && (v[e] = "12px");
		}
	}
	return /* @__PURE__ */ a("div", {
		className: `dc-markdown-content dc:w-full dc:overflow-auto ${f ? "" : "dc:p-4 "}${h[u] || "dc:text-lg"} ${g[d] || "dc:text-left"}`,
		style: {
			height: n === "100%" ? "100%" : n,
			...v
		},
		children: /* @__PURE__ */ a(jr, {
			options: _,
			children: c
		})
	});
});
//#endregion
export { Mr as n, jr as r, Fr as t };

//# sourceMappingURL=chart-markdown-CRjxC5D7.js.map