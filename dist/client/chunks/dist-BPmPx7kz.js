//#region node_modules/modern-screenshot/dist/index.mjs
function e(e, t) {
	return e[13] = 1, e[14] = t >> 8, e[15] = t & 255, e[16] = t >> 8, e[17] = t & 255, e;
}
var t;
function n() {
	let e = /* @__PURE__ */ new Int32Array(256);
	for (let t = 0; t < 256; t++) {
		let n = t;
		for (let e = 0; e < 8; e++) n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
		e[t] = n;
	}
	return e;
}
function r(e) {
	let r = -1;
	t ||= n();
	for (let n = 0; n < e.length; n++) r = t[(r ^ e[n]) & 255] ^ r >>> 8;
	return r ^ -1;
}
function i(e) {
	let t = e.length - 1;
	for (let n = t; n >= 4; n--) if (e[n - 4] === 9 && e[n - 3] === 112 && e[n - 2] === 72 && e[n - 1] === 89 && e[n] === 115) return n - 3;
	return 0;
}
function a(e, t, n = !1) {
	let a = /* @__PURE__ */ new Uint8Array(13);
	t *= 39.3701, a[0] = 112, a[1] = 72, a[2] = 89, a[3] = 115, a[4] = t >>> 24, a[5] = t >>> 16, a[6] = t >>> 8, a[7] = t & 255, a[8] = a[4], a[9] = a[5], a[10] = a[6], a[11] = a[7], a[12] = 1;
	let o = r(a), s = /* @__PURE__ */ new Uint8Array(4);
	if (s[0] = o >>> 24, s[1] = o >>> 16, s[2] = o >>> 8, s[3] = o & 255, n) {
		let t = i(e);
		return e.set(a, t), e.set(s, t + 13), e;
	}
	{
		let t = /* @__PURE__ */ new Uint8Array(4);
		t[0] = 0, t[1] = 0, t[2] = 0, t[3] = 9;
		let n = /* @__PURE__ */ new Uint8Array(54);
		return n.set(e, 0), n.set(t, 33), n.set(a, 37), n.set(s, 50), n;
	}
}
function o(e) {
	let t = e.indexOf("AAlwSFlz");
	return t === -1 && (t = e.indexOf("AAAJcEhZ")), t === -1 && (t = e.indexOf("AAAACXBI")), t;
}
var s = "[modern-screenshot]", c = typeof window < "u", l = c && "Worker" in window, u = c && "atob" in window, d = c && "btoa" in window, f = c ? window.navigator?.userAgent : "", p = f.includes("Chrome"), m = f.includes("AppleWebKit") && !p, h = f.includes("Firefox"), g = (e) => e && "__CONTEXT__" in e, _ = (e) => e.constructor.name === "CSSFontFaceRule", v = (e) => e.constructor.name === "CSSImportRule", y = (e) => e.constructor.name === "CSSLayerBlockRule", b = (e) => e.nodeType === 1, x = (e) => typeof e.className == "object", S = (e) => e.tagName === "image", ee = (e) => e.tagName === "use", C = (e) => b(e) && e.style !== void 0 && !x(e), te = (e) => e.nodeType === 8, ne = (e) => e.nodeType === 3, w = (e) => e.tagName === "IMG", T = (e) => e.tagName === "VIDEO", re = (e) => e.tagName === "CANVAS", ie = (e) => e.tagName === "TEXTAREA", ae = (e) => e.tagName === "INPUT", oe = (e) => e.tagName === "STYLE", se = (e) => e.tagName === "SCRIPT", ce = (e) => e.tagName === "SELECT", le = (e) => e.tagName === "SLOT", ue = (e) => e.tagName === "IFRAME", de = (...e) => console.warn(s, ...e);
function fe(e) {
	let t = e?.createElement?.("canvas");
	return t && (t.height = t.width = 1), !!t && "toDataURL" in t && !!t.toDataURL("image/webp").includes("image/webp");
}
var E = (e) => e.startsWith("data:");
function D(e, t) {
	if (e.match(/^[a-z]+:\/\//i)) return e;
	if (c && e.match(/^\/\//)) return window.location.protocol + e;
	if (e.match(/^[a-z]+:/i) || !c) return e;
	let n = O().implementation.createHTMLDocument(), r = n.createElement("base"), i = n.createElement("a");
	return n.head.appendChild(r), n.body.appendChild(i), t && (r.href = t), i.href = e, i.href;
}
function O(e) {
	return (e && b(e) ? e?.ownerDocument : e) ?? window.document;
}
var k = "http://www.w3.org/2000/svg";
function A(e, t, n) {
	let r = O(n).createElementNS(k, "svg");
	return r.setAttributeNS(null, "width", e.toString()), r.setAttributeNS(null, "height", t.toString()), r.setAttributeNS(null, "viewBox", `0 0 ${e} ${t}`), r;
}
function j(e, t) {
	let n = new XMLSerializer().serializeToString(e);
	return t && (n = n.replace(/[\u0000-\u0008\v\f\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/gu, "")), `data:image/svg+xml;charset=utf-8,${encodeURIComponent(n)}`;
}
async function pe(e, t = "image/png", n = 1) {
	try {
		return await new Promise((r, i) => {
			e.toBlob((e) => {
				e ? r(e) : i(/* @__PURE__ */ Error("Blob is null"));
			}, t, n);
		});
	} catch (r) {
		if (u) return me(e.toDataURL(t, n));
		throw r;
	}
}
function me(e) {
	let [t, n] = e.split(","), r = t.match(/data:(.+);/)?.[1] ?? void 0, i = window.atob(n), a = i.length, o = new Uint8Array(a);
	for (let e = 0; e < a; e += 1) o[e] = i.charCodeAt(e);
	return new Blob([o], { type: r });
}
function M(e, t) {
	return new Promise((n, r) => {
		let i = new FileReader();
		i.onload = () => n(i.result), i.onerror = () => r(i.error), i.onabort = () => r(/* @__PURE__ */ Error(`Failed read blob to ${t}`)), t === "dataUrl" ? i.readAsDataURL(e) : t === "arrayBuffer" && i.readAsArrayBuffer(e);
	});
}
var he = (e) => M(e, "dataUrl"), ge = (e) => M(e, "arrayBuffer");
function N(e, t) {
	let n = O(t).createElement("img");
	return n.decoding = "sync", n.loading = "eager", n.src = e, n;
}
function P(e, t) {
	return new Promise((n) => {
		let { timeout: r, ownerDocument: i, onError: a, onWarn: o } = t ?? {}, s = typeof e == "string" ? N(e, O(i)) : e, c = null, l = null;
		function u() {
			n(s), c && clearTimeout(c), l?.();
		}
		if (r && (c = setTimeout(u, r)), T(s)) {
			let e = s.currentSrc || s.src;
			if (!e) return s.poster ? P(s.poster, t).then(n) : u();
			if (s.readyState >= 2) return u();
			let r = u, i = (t) => {
				o?.("Failed video load", e, t), a?.(t), u();
			};
			l = () => {
				s.removeEventListener("loadeddata", r), s.removeEventListener("error", i);
			}, s.addEventListener("loadeddata", r, { once: !0 }), s.addEventListener("error", i, { once: !0 });
		} else {
			let e = S(s) ? s.href.baseVal : s.currentSrc || s.src;
			if (!e) return u();
			let t = async () => {
				if (w(s) && "decode" in s) try {
					await s.decode();
				} catch (t) {
					o?.("Failed to decode image, trying to render anyway", s.dataset.originalSrc || e, t);
				}
				u();
			}, n = (t) => {
				o?.("Failed image load", s.dataset.originalSrc || e, t), u();
			};
			if (w(s) && s.complete) return t();
			l = () => {
				s.removeEventListener("load", t), s.removeEventListener("error", n);
			}, s.addEventListener("load", t, { once: !0 }), s.addEventListener("error", n, { once: !0 });
		}
	});
}
async function F(e, t) {
	C(e) && (w(e) || T(e) ? await P(e, t) : await Promise.all(["img", "video"].flatMap((n) => Array.from(e.querySelectorAll(n)).map((e) => P(e, t)))));
}
var I = /* @__PURE__ */ function() {
	let e = 0, t = () => `0000${(Math.random() * 36 ** 4 << 0).toString(36)}`.slice(-4);
	return () => (e += 1, `u${t()}${e}`);
}();
function L(e) {
	return e?.split(",").map((e) => e.trim().replace(/"|'/g, "").toLowerCase()).filter(Boolean);
}
var R = 0;
function _e(e) {
	let t = `${s}[#${R}]`;
	return R++, {
		time: (n) => e && console.time(`${t} ${n}`),
		timeEnd: (n) => e && console.timeEnd(`${t} ${n}`),
		warn: (...t) => e && de(...t)
	};
}
function ve(e) {
	return { cache: e ? "no-cache" : "force-cache" };
}
async function z(e, t) {
	return g(e) ? e : B(e, {
		...t,
		autoDestruct: !0
	});
}
async function B(e, t) {
	let { scale: n = 1, workerUrl: r, workerNumber: i = 1 } = t || {}, a = !!t?.debug, o = t?.features ?? !0, s = e.ownerDocument ?? (c ? window.document : void 0), u = e.ownerDocument?.defaultView ?? (c ? window : void 0), d = /* @__PURE__ */ new Map(), f = {
		width: 0,
		height: 0,
		quality: 1,
		type: "image/png",
		scale: n,
		backgroundColor: null,
		style: null,
		filter: null,
		maximumCanvasSize: 0,
		timeout: 3e4,
		progress: null,
		debug: a,
		fetch: {
			requestInit: ve(t?.fetch?.bypassingCache),
			placeholderImage: "data:image/png;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
			bypassingCache: !1,
			...t?.fetch
		},
		fetchFn: null,
		font: {},
		drawImageInterval: 100,
		workerUrl: null,
		workerNumber: i,
		onCloneEachNode: null,
		onCloneNode: null,
		onEmbedNode: null,
		onCreateForeignObjectSvg: null,
		includeStyleProperties: null,
		autoDestruct: !1,
		...t,
		__CONTEXT__: !0,
		log: _e(a),
		node: e,
		ownerDocument: s,
		ownerWindow: u,
		dpi: n === 1 ? null : 96 * n,
		svgStyleElement: V(s),
		svgDefsElement: s?.createElementNS(k, "defs"),
		svgStyles: /* @__PURE__ */ new Map(),
		defaultComputedStyles: /* @__PURE__ */ new Map(),
		workers: [...Array.from({ length: l && r && i ? i : 0 })].map(() => {
			try {
				let e = new Worker(r);
				return e.onmessage = async (e) => {
					let { url: t, result: n } = e.data;
					n ? d.get(t)?.resolve?.(n) : d.get(t)?.reject?.(/* @__PURE__ */ Error(`Error receiving message from worker: ${t}`));
				}, e.onmessageerror = (e) => {
					let { url: t } = e.data;
					d.get(t)?.reject?.(/* @__PURE__ */ Error(`Error receiving message from worker: ${t}`));
				}, e;
			} catch (e) {
				return f.log.warn("Failed to new Worker", e), null;
			}
		}).filter(Boolean),
		fontFamilies: /* @__PURE__ */ new Map(),
		fontCssTexts: /* @__PURE__ */ new Map(),
		acceptOfImage: `${[
			fe(s) && "image/webp",
			"image/svg+xml",
			"image/*",
			"*/*"
		].filter(Boolean).join(",")};q=0.8`,
		requests: d,
		drawImageCount: 0,
		tasks: [],
		features: o,
		isEnable: (e) => e === "restoreScrollPosition" ? typeof o == "boolean" ? !1 : o[e] ?? !1 : typeof o == "boolean" ? o : o[e] ?? !0,
		shadowRoots: []
	};
	f.log.time("wait until load"), await F(e, {
		timeout: f.timeout,
		onWarn: f.log.warn
	}), f.log.timeEnd("wait until load");
	let { width: p, height: m } = ye(e, f);
	return f.width = p, f.height = m, f;
}
function V(e) {
	if (!e) return;
	let t = e.createElement("style"), n = t.ownerDocument.createTextNode("\n.______background-clip--text {\n  background-clip: text;\n  -webkit-background-clip: text;\n}\n");
	return t.appendChild(n), t;
}
function ye(e, t) {
	let { width: n, height: r } = t;
	if (b(e) && (!n || !r)) {
		let t = e.getBoundingClientRect();
		n = n || t.width || Number(e.getAttribute("width")) || 0, r = r || t.height || Number(e.getAttribute("height")) || 0;
	}
	return {
		width: n,
		height: r
	};
}
async function be(e, t) {
	let { log: n, timeout: r, drawImageCount: i, drawImageInterval: a } = t;
	n.time("image to canvas");
	let o = await P(e, {
		timeout: r,
		onWarn: t.log.warn
	}), { canvas: s, context2d: c } = xe(e.ownerDocument, t), l = () => {
		try {
			c?.drawImage(o, 0, 0, s.width, s.height);
		} catch (e) {
			t.log.warn("Failed to drawImage", e);
		}
	};
	if (l(), t.isEnable("fixSvgXmlDecode")) for (let e = 0; e < i; e++) await new Promise((t) => {
		setTimeout(() => {
			c?.clearRect(0, 0, s.width, s.height), l(), t();
		}, e + a);
	});
	return t.drawImageCount = 0, n.timeEnd("image to canvas"), s;
}
function xe(e, t) {
	let { width: n, height: r, scale: i, backgroundColor: a, maximumCanvasSize: o } = t, s = e.createElement("canvas");
	s.width = Math.floor(n * i), s.height = Math.floor(r * i), s.style.width = `${n}px`, s.style.height = `${r}px`, o && (s.width > o || s.height > o) && (s.width > o && s.height > o ? s.width > s.height ? (s.height *= o / s.width, s.width = o) : (s.width *= o / s.height, s.height = o) : s.width > o ? (s.height *= o / s.width, s.width = o) : (s.width *= o / s.height, s.height = o));
	let c = s.getContext("2d");
	return c && a && (c.fillStyle = a, c.fillRect(0, 0, s.width, s.height)), {
		canvas: s,
		context2d: c
	};
}
function H(e, t) {
	if (e.ownerDocument) try {
		let t = e.toDataURL();
		if (t !== "data:,") return N(t, e.ownerDocument);
	} catch (e) {
		t.log.warn("Failed to clone canvas", e);
	}
	let n = e.cloneNode(!1), r = e.getContext("2d"), i = n.getContext("2d");
	try {
		return r && i && i.putImageData(r.getImageData(0, 0, e.width, e.height), 0, 0), n;
	} catch (e) {
		t.log.warn("Failed to clone canvas", e);
	}
	return n;
}
function Se(e, t) {
	try {
		if (e?.contentDocument?.documentElement) return q(e.contentDocument.documentElement, t);
	} catch (e) {
		t.log.warn("Failed to clone iframe", e);
	}
	return e.cloneNode(!1);
}
function Ce(e) {
	let t = e.cloneNode(!1);
	return e.currentSrc && e.currentSrc !== e.src && (t.src = e.currentSrc, t.srcset = ""), t.loading === "lazy" && (t.loading = "eager"), t;
}
async function we(e, t) {
	if (e.ownerDocument && !e.currentSrc && e.poster) return N(e.poster, e.ownerDocument);
	let n = e.cloneNode(!1);
	n.crossOrigin = "anonymous", e.currentSrc && e.currentSrc !== e.src && (n.src = e.currentSrc);
	let r = n.ownerDocument;
	if (r) {
		let i = !0;
		if (await P(n, {
			onError: () => i = !1,
			onWarn: t.log.warn
		}), !i) return e.poster ? N(e.poster, e.ownerDocument) : n;
		n.currentTime = e.currentTime, await new Promise((e) => {
			n.addEventListener("seeked", e, { once: !0 });
		});
		let a = r.createElement("canvas");
		a.width = e.offsetWidth, a.height = e.offsetHeight;
		try {
			let e = a.getContext("2d");
			e && e.drawImage(n, 0, 0, a.width, a.height);
		} catch (r) {
			return t.log.warn("Failed to clone video", r), e.poster ? N(e.poster, e.ownerDocument) : n;
		}
		return H(a, t);
	}
	return n;
}
function Te(e, t) {
	return re(e) ? H(e, t) : ue(e) ? Se(e, t) : w(e) ? Ce(e) : T(e) ? we(e, t) : e.cloneNode(!1);
}
function Ee(e) {
	let t = e.sandbox;
	if (!t) {
		let { ownerDocument: n } = e;
		try {
			n && (t = n.createElement("iframe"), t.id = `__SANDBOX__${I()}`, t.width = "0", t.height = "0", t.style.visibility = "hidden", t.style.position = "fixed", n.body.appendChild(t), t.srcdoc = "<!DOCTYPE html><meta charset=\"UTF-8\"><title></title><body>", e.sandbox = t);
		} catch (t) {
			e.log.warn("Failed to getSandBox", t);
		}
	}
	return t;
}
var De = [
	"width",
	"height",
	"-webkit-text-fill-color"
], Oe = ["stroke", "fill"];
function U(e, t, n) {
	let { defaultComputedStyles: r } = n, i = e.nodeName.toLowerCase(), a = x(e) && i !== "svg", o = a ? Oe.map((t) => [t, e.getAttribute(t)]).filter(([, e]) => e !== null) : [], s = [
		a && "svg",
		i,
		o.map((e, t) => `${e}=${t}`).join(","),
		t
	].filter(Boolean).join(":");
	if (r.has(s)) return r.get(s);
	let c = Ee(n)?.contentWindow;
	if (!c) return /* @__PURE__ */ new Map();
	let l = c?.document, u, d;
	a ? (u = l.createElementNS(k, "svg"), d = u.ownerDocument.createElementNS(u.namespaceURI, i), o.forEach(([e, t]) => {
		d.setAttributeNS(null, e, t);
	}), u.appendChild(d)) : u = d = l.createElement(i), d.textContent = " ", l.body.appendChild(u);
	let f = c.getComputedStyle(d, t), p = /* @__PURE__ */ new Map();
	for (let e = f.length, t = 0; t < e; t++) {
		let e = f.item(t);
		De.includes(e) || p.set(e, f.getPropertyValue(e));
	}
	return l.body.removeChild(u), r.set(s, p), p;
}
function W(e, t, n) {
	let r = /* @__PURE__ */ new Map(), i = [], a = /* @__PURE__ */ new Map();
	if (n) for (let e of n) o(e);
	else for (let t = e.length, n = 0; n < t; n++) o(e.item(n));
	for (let e = i.length, t = 0; t < e; t++) a.get(i[t])?.forEach((e, t) => r.set(t, e));
	function o(n) {
		let o = e.getPropertyValue(n), s = e.getPropertyPriority(n), c = n.lastIndexOf("-"), l = c > -1 ? n.substring(0, c) : void 0;
		if (l) {
			let e = a.get(l);
			e || (e = /* @__PURE__ */ new Map(), a.set(l, e)), e.set(n, [o, s]);
		}
		t.get(n) === o && !s || (l ? i.push(l) : r.set(n, [o, s]));
	}
	return r;
}
function ke(e, t, n, r) {
	let { ownerWindow: i, includeStyleProperties: a, currentParentNodeStyle: o } = r, s = t.style, c = i.getComputedStyle(e), l = U(e, null, r);
	o?.forEach((e, t) => {
		l.delete(t);
	});
	let u = W(c, l, a);
	u.delete("transition-property"), u.delete("all"), u.delete("d"), u.delete("content"), n && (u.delete("position"), u.delete("margin-top"), u.delete("margin-right"), u.delete("margin-bottom"), u.delete("margin-left"), u.delete("margin-block-start"), u.delete("margin-block-end"), u.delete("margin-inline-start"), u.delete("margin-inline-end"), u.set("box-sizing", ["border-box", ""])), u.get("background-clip")?.[0] === "text" && t.classList.add("______background-clip--text"), p && (u.has("font-kerning") || u.set("font-kerning", ["normal", ""]), (u.get("overflow-x")?.[0] === "hidden" || u.get("overflow-y")?.[0] === "hidden") && u.get("text-overflow")?.[0] === "ellipsis" && e.scrollWidth === e.clientWidth && u.set("text-overflow", ["clip", ""]));
	for (let e = s.length, t = 0; t < e; t++) s.removeProperty(s.item(t));
	return u.forEach(([e, t], n) => {
		s.setProperty(n, e, t);
	}), u;
}
function Ae(e, t) {
	(ie(e) || ae(e) || ce(e)) && t.setAttribute("value", e.value);
}
var je = ["::before", "::after"], Me = [
	"::-webkit-scrollbar",
	"::-webkit-scrollbar-button",
	"::-webkit-scrollbar-thumb",
	"::-webkit-scrollbar-track",
	"::-webkit-scrollbar-track-piece",
	"::-webkit-scrollbar-corner",
	"::-webkit-resizer"
];
function Ne(e, t, n, r, i) {
	let { ownerWindow: a, svgStyleElement: o, svgStyles: s, currentNodeStyle: c } = r;
	if (!o || !a) return;
	function l(n) {
		let o = a.getComputedStyle(e, n), l = o.getPropertyValue("content");
		if (!l || l === "none") return;
		i?.(l), l = l.replace(/(')|(")|(counter\(.+\))/g, "");
		let u = [I()], d = U(e, n, r);
		c?.forEach((e, t) => {
			d.delete(t);
		});
		let f = W(o, d, r.includeStyleProperties);
		f.delete("content"), f.delete("-webkit-locale"), f.get("background-clip")?.[0] === "text" && t.classList.add("______background-clip--text");
		let p = [`content: '${l}';`];
		if (f.forEach(([e, t], n) => {
			p.push(`${n}: ${e}${t ? " !important" : ""};`);
		}), p.length === 1) return;
		try {
			t.className = [t.className, ...u].join(" ");
		} catch (e) {
			r.log.warn("Failed to copyPseudoClass", e);
			return;
		}
		let m = p.join("\n  "), h = s.get(m);
		h || (h = [], s.set(m, h)), h.push(`.${u[0]}${n}`);
	}
	je.forEach(l), n && Me.forEach(l);
}
var G = /* @__PURE__ */ new Set(["symbol"]);
async function K(e, t, n, r, i) {
	if (b(n) && (oe(n) || se(n)) || r.filter && !r.filter(n)) return;
	r.currentParentNodeStyle = G.has(t.nodeName) || G.has(n.nodeName) ? void 0 : r.currentNodeStyle;
	let a = await q(n, r, !1, i);
	r.isEnable("restoreScrollPosition") && Fe(e, a), t.appendChild(a);
}
async function Pe(e, t, n, r) {
	let i = e.firstChild;
	b(e) && e.shadowRoot && (i = e.shadowRoot?.firstChild, n.shadowRoots.push(e.shadowRoot));
	for (let a = i; a; a = a.nextSibling) if (!te(a)) {
		if (b(a) && le(a) && typeof a.assignedNodes == "function") {
			let i = a.assignedNodes();
			for (let a = 0; a < i.length; a++) await K(e, t, i[a], n, r);
		} else await K(e, t, a, n, r);
	}
}
function Fe(e, t) {
	if (!C(e) || !C(t)) return;
	let { scrollTop: n, scrollLeft: r } = e;
	if (!n && !r) return;
	let { transform: i } = t.style, a = new DOMMatrix(i), { a: o, b: s, c, d: l } = a;
	a.a = 1, a.b = 0, a.c = 0, a.d = 1, a.translateSelf(-r, -n), a.a = o, a.b = s, a.c = c, a.d = l, t.style.transform = a.toString();
}
function Ie(e, t) {
	let { backgroundColor: n, width: r, height: i, style: a } = t, o = e.style;
	if (n && o.setProperty("background-color", n, "important"), r && o.setProperty("width", `${r}px`, "important"), i && o.setProperty("height", `${i}px`, "important"), a) for (let e in a) o[e] = a[e];
}
var Le = /^[\w-:]+$/;
async function q(e, t, n = !1, r) {
	let { ownerDocument: i, ownerWindow: a, fontFamilies: o, onCloneEachNode: s } = t;
	if (i && ne(e)) return r && /\S/.test(e.data) && r(e.data), i.createTextNode(e.data);
	if (i && a && b(e) && (C(e) || x(e))) {
		let r = await Te(e, t);
		if (t.isEnable("removeAbnormalAttributes")) {
			let e = r.getAttributeNames();
			for (let t = e.length, n = 0; n < t; n++) {
				let t = e[n];
				Le.test(t) || r.removeAttribute(t);
			}
		}
		let i = t.currentNodeStyle = ke(e, r, n, t);
		n && Ie(r, t);
		let a = !1;
		if (t.isEnable("copyScrollbar")) {
			let t = [i.get("overflow-x")?.[0], i.get("overflow-y")?.[0]];
			a = t.includes("scroll") || (t.includes("auto") || t.includes("overlay")) && (e.scrollHeight > e.clientHeight || e.scrollWidth > e.clientWidth);
		}
		let c = i.get("text-transform")?.[0], l = L(i.get("font-family")?.[0]), u = l ? (e) => {
			c === "uppercase" ? e = e.toUpperCase() : c === "lowercase" ? e = e.toLowerCase() : c === "capitalize" && (e = e[0].toUpperCase() + e.substring(1)), l.forEach((t) => {
				let n = o.get(t);
				n || o.set(t, n = /* @__PURE__ */ new Set()), e.split("").forEach((e) => n.add(e));
			});
		} : void 0;
		return Ne(e, r, a, t, u), Ae(e, r), T(e) || await Pe(e, r, t, u), await s?.(r), r;
	}
	let c = e.cloneNode(!1);
	return await Pe(e, c, t), await s?.(c), c;
}
function Re(e) {
	if (e.ownerDocument = void 0, e.ownerWindow = void 0, e.svgStyleElement = void 0, e.svgDefsElement = void 0, e.svgStyles.clear(), e.defaultComputedStyles.clear(), e.sandbox) {
		try {
			e.sandbox.remove();
		} catch (t) {
			e.log.warn("Failed to destroyContext", t);
		}
		e.sandbox = void 0;
	}
	e.workers = [], e.fontFamilies.clear(), e.fontCssTexts.clear(), e.requests.clear(), e.tasks = [], e.shadowRoots = [];
}
function ze(e) {
	let { url: t, timeout: n, responseType: r, ...i } = e, a = new AbortController(), o = n ? setTimeout(() => a.abort(), n) : void 0;
	return fetch(t, {
		signal: a.signal,
		...i
	}).then((e) => {
		if (!e.ok) throw Error("Failed fetch, not 2xx response", { cause: e });
		switch (r) {
			case "arrayBuffer": return e.arrayBuffer();
			case "dataUrl": return e.blob().then(he);
			default: return e.text();
		}
	}).finally(() => clearTimeout(o));
}
function J(e, t) {
	let { url: n, requestType: r = "text", responseType: i = "text", imageDom: a } = t, o = n, { timeout: s, acceptOfImage: c, requests: l, fetchFn: u, fetch: { requestInit: d, bypassingCache: f, placeholderImage: p }, font: g, workers: _, fontFamilies: v } = e;
	r === "image" && (m || h) && e.drawImageCount++;
	let y = l.get(n);
	if (!y) {
		f && f instanceof RegExp && f.test(o) && (o += (/\?/.test(o) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime());
		let t = r.startsWith("font") && g && g.minify, h = /* @__PURE__ */ new Set();
		t && r.split(";")[1].split(",").forEach((e) => {
			v.has(e) && v.get(e).forEach((e) => h.add(e));
		});
		let b = {
			url: o,
			timeout: s,
			responseType: t && h.size ? "arrayBuffer" : i,
			headers: r === "image" ? { accept: c } : void 0,
			...d
		};
		y = {
			type: r,
			resolve: void 0,
			reject: void 0,
			response: null
		}, y.response = (async () => {
			if (u && r === "image") {
				let e = await u(n);
				if (e) return e;
			}
			return !m && n.startsWith("http") && _.length ? new Promise((e, t) => {
				_[l.size & _.length - 1].postMessage({
					rawUrl: n,
					...b
				}), y.resolve = e, y.reject = t;
			}) : ze(b);
		})().catch((t) => {
			if (l.delete(n), r === "image" && p) return e.log.warn("Failed to fetch image base64, trying to use placeholder image", o), typeof p == "string" ? p : p(a);
			throw t;
		}), l.set(n, y);
	}
	return y.response;
}
async function Be(e, t, n, r) {
	if (!Ve(e)) return e;
	for (let [i, a] of Ue(e, t)) try {
		let t = await J(n, {
			url: a,
			requestType: r ? "image" : "text",
			responseType: "dataUrl"
		});
		e = e.replace(We(i), `$1${t}$3`);
	} catch (e) {
		n.log.warn("Failed to fetch css data url", i, e);
	}
	return e;
}
function Ve(e) {
	return /url\((['"]?)([^'"]+?)\1\)/.test(e);
}
var He = /url\((['"]?)([^'"]+?)\1\)/g;
function Ue(e, t) {
	let n = [];
	return e.replace(He, (e, r, i) => (n.push([i, D(i, t)]), e)), n.filter(([e]) => !E(e));
}
function We(e) {
	let t = e.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
	return RegExp(`(url\\(['"]?)(${t})(['"]?\\))`, "g");
}
var Ge = [
	"background-image",
	"border-image-source",
	"-webkit-border-image",
	"-webkit-mask-image",
	"list-style-image"
];
function Ke(e, t) {
	return Ge.map((n) => {
		let r = e.getPropertyValue(n);
		return !r || r === "none" ? null : ((m || h) && t.drawImageCount++, Be(r, null, t, !0).then((t) => {
			!t || r === t || e.setProperty(n, t, e.getPropertyPriority(n));
		}));
	}).filter(Boolean);
}
function qe(e, t) {
	if (w(e)) {
		let n = e.currentSrc || e.src;
		if (!E(n)) return [J(t, {
			url: n,
			imageDom: e,
			requestType: "image",
			responseType: "dataUrl"
		}).then((t) => {
			t && (e.srcset = "", e.dataset.originalSrc = n, e.src = t || "");
		})];
		(m || h) && t.drawImageCount++;
	} else if (x(e) && !E(e.href.baseVal)) {
		let n = e.href.baseVal;
		return [J(t, {
			url: n,
			imageDom: e,
			requestType: "image",
			responseType: "dataUrl"
		}).then((t) => {
			t && (e.dataset.originalSrc = n, e.href.baseVal = t || "");
		})];
	}
	return [];
}
function Je(e, t) {
	let { ownerDocument: n, svgDefsElement: r } = t, i = e.getAttribute("href") ?? e.getAttribute("xlink:href");
	if (!i) return [];
	let [a, o] = i.split("#");
	if (o) {
		let i = `#${o}`, s = t.shadowRoots.reduce((e, t) => e ?? t.querySelector(`svg ${i}`), n?.querySelector(`svg ${i}`));
		if (a && e.setAttribute("href", i), r?.querySelector(i)) return [];
		if (s) return r?.appendChild(s.cloneNode(!0)), [];
		if (a) return [J(t, {
			url: a,
			responseType: "text"
		}).then((e) => {
			r?.insertAdjacentHTML("beforeend", e);
		})];
	}
	return [];
}
function Ye(e, t) {
	let { tasks: n } = t;
	b(e) && ((w(e) || S(e)) && n.push(...qe(e, t)), ee(e) && n.push(...Je(e, t))), C(e) && n.push(...Ke(e.style, t)), e.childNodes.forEach((e) => {
		Ye(e, t);
	});
}
async function Xe(e, t) {
	let { ownerDocument: n, svgStyleElement: r, fontFamilies: i, fontCssTexts: a, tasks: o, font: s } = t;
	if (!(!n || !r || !i.size)) {
		if (s && s.cssText) {
			let e = Y(s.cssText, t);
			r.appendChild(n.createTextNode(`${e}
`));
		} else {
			let e = Array.from(n.styleSheets).filter((e) => {
				try {
					return "cssRules" in e && !!e.cssRules.length;
				} catch (n) {
					return t.log.warn(`Error while reading CSS rules from ${e.href}`, n), !1;
				}
			}), s = n.implementation.createHTMLDocument(""), c = s.createElement("style");
			s.head.appendChild(c);
			let l = c.sheet;
			await Promise.all(e.flatMap((e) => Array.from(e.cssRules).map(async (e) => {
				if (v(e)) {
					let n = e.href, r = "";
					try {
						r = await J(t, {
							url: n,
							requestType: "text",
							responseType: "text"
						});
					} catch (e) {
						t.log.warn(`Error fetch remote css import from ${n}`, e);
					}
					let i = r.replace(He, (e, t, r) => e.replace(r, D(r, n)));
					for (let e of $e(i)) try {
						l.insertRule(e, l.cssRules.length);
					} catch (n) {
						t.log.warn("Error inserting rule from remote css import", {
							rule: e,
							error: n
						});
					}
				}
			}))), l.cssRules.length && e.push(l);
			let u = [];
			e.forEach((e) => {
				X(e.cssRules, u);
			}), u.filter((e) => _(e) && Ve(e.style.getPropertyValue("src")) && L(e.style.getPropertyValue("font-family"))?.some((e) => i.has(e))).forEach((e) => {
				let i = e, s = a.get(i.cssText);
				s ? r.appendChild(n.createTextNode(`${s}
`)) : o.push(Be(i.cssText, i.parentStyleSheet ? i.parentStyleSheet.href : null, t).then((e) => {
					e = Y(e, t), a.set(i.cssText, e), r.appendChild(n.createTextNode(`${e}
`));
				}));
			});
		}
	}
}
var Ze = /(\/\*[\s\S]*?\*\/)/g, Qe = /((@.*?keyframes [\s\S]*?){([\s\S]*?}\s*?)})/gi;
function $e(e) {
	if (e == null) return [];
	let t = [], n = e.replace(Ze, "");
	for (;;) {
		let e = Qe.exec(n);
		if (!e) break;
		t.push(e[0]);
	}
	n = n.replace(Qe, "");
	let r = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi, i = /* @__PURE__ */ RegExp("((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})", "gi");
	for (;;) {
		let e = r.exec(n);
		if (e) i.lastIndex = r.lastIndex;
		else if (e = i.exec(n), e) r.lastIndex = i.lastIndex;
		else break;
		t.push(e[0]);
	}
	return t;
}
var et = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g, tt = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
function Y(e, t) {
	let { font: n } = t, r = n ? n?.preferredFormat : void 0;
	return r ? e.replace(tt, (e) => {
		for (;;) {
			let [t, , n] = et.exec(e) || [];
			if (!n) return "";
			if (n === r) return `src: ${t};`;
		}
	}) : e;
}
function X(e, t = []) {
	for (let n of Array.from(e)) y(n) ? t.push(...X(n.cssRules)) : "cssRules" in n ? X(n.cssRules, t) : t.push(n);
	return t;
}
var nt = /\bx?link:?href\s*=\s*["'](?!data:)[^"']+["']/i;
function rt(e) {
	return nt.test(e.innerHTML);
}
async function it(e, t) {
	let n = await z(e, t);
	if (b(n.node) && x(n.node) && !rt(n.node)) return n.node;
	let { ownerDocument: r, log: i, tasks: a, svgStyleElement: o, svgDefsElement: s, svgStyles: c, font: l, progress: u, autoDestruct: d, onCloneNode: f, onEmbedNode: p, onCreateForeignObjectSvg: m } = n;
	i.time("clone node");
	let h = await q(n.node, n, !0);
	if (o && r) {
		let e = "";
		c.forEach((t, n) => {
			e += `${t.join(",\n")} {
  ${n}
}
`;
		}), o.appendChild(r.createTextNode(e));
	}
	i.timeEnd("clone node"), await f?.(h), l !== !1 && b(h) && (i.time("embed web font"), await Xe(h, n), i.timeEnd("embed web font")), i.time("embed node"), Ye(h, n);
	let g = a.length, _ = 0, v = async () => {
		for (;;) {
			let e = a.pop();
			if (!e) break;
			try {
				await e;
			} catch (e) {
				n.log.warn("Failed to run task", e);
			}
			u?.(++_, g);
		}
	};
	u?.(_, g), await Promise.all([...Array.from({ length: 4 })].map(v)), i.timeEnd("embed node"), await p?.(h);
	let y = at(h, n);
	return s && y.insertBefore(s, y.children[0]), o && y.insertBefore(o, y.children[0]), d && Re(n), await m?.(y), y;
}
function at(e, t) {
	let { width: n, height: r } = t, i = A(n, r, e.ownerDocument), a = i.ownerDocument.createElementNS(i.namespaceURI, "foreignObject");
	return a.setAttributeNS(null, "x", "0%"), a.setAttributeNS(null, "y", "0%"), a.setAttributeNS(null, "width", "100%"), a.setAttributeNS(null, "height", "100%"), a.append(e), i.appendChild(a), i;
}
async function Z(e, t) {
	let n = await z(e, t), r = await it(n), i = j(r, n.isEnable("removeControlCharacter"));
	return n.autoDestruct || (n.svgStyleElement = V(n.ownerDocument), n.svgDefsElement = n.ownerDocument?.createElementNS(k, "defs"), n.svgStyles.clear()), await be(N(i, r.ownerDocument), n);
}
async function ot(t, n) {
	let r = await z(t, n), { log: i, type: o, quality: s, dpi: c } = r, l = await Z(r);
	i.time("canvas to blob");
	let u = await pe(l, o, s);
	if (["image/png", "image/jpeg"].includes(o) && c) {
		let t = await ge(u.slice(0, 33)), n = new Uint8Array(t);
		return o === "image/png" ? n = a(n, c) : o === "image/jpeg" && (n = e(n, c)), i.timeEnd("canvas to blob"), new Blob([n, u.slice(33)], { type: o });
	}
	return i.timeEnd("canvas to blob"), u;
}
async function Q(t, n) {
	let r = await z(t, n), { log: i, quality: s, type: c, dpi: l } = r, f = await Z(r);
	i.time("canvas to data url");
	let p = f.toDataURL(c, s);
	if (["image/png", "image/jpeg"].includes(c) && l && u && d) {
		let [t, n] = p.split(","), r = 0, i = !1;
		if (c === "image/png") {
			let e = o(n);
			e >= 0 ? (r = Math.ceil((e + 28) / 3) * 4, i = !0) : r = 44;
		} else c === "image/jpeg" && (r = 24);
		let s = n.substring(0, r), u = n.substring(r), d = window.atob(s), f = new Uint8Array(d.length);
		for (let e = 0; e < f.length; e++) f[e] = d.charCodeAt(e);
		let m = c === "image/png" ? a(f, l, i) : e(f, l);
		p = [
			t,
			",",
			window.btoa(String.fromCharCode(...m)),
			u
		].join("");
	}
	return i.timeEnd("canvas to data url"), p;
}
async function $(e, t) {
	let n = await z(e, t), { width: r, height: i, ownerDocument: a } = n, o = await Q(n), s = A(r, i, a), c = s.ownerDocument.createElementNS(s.namespaceURI, "image");
	return c.setAttributeNS(null, "href", o), c.setAttributeNS(null, "height", "100%"), c.setAttributeNS(null, "width", "100%"), s.appendChild(c), j(s, n.isEnable("removeControlCharacter"));
}
async function st(e, t) {
	let n = await z(e, t), { ownerDocument: r, width: i, height: a, scale: o, type: s } = n, c = N(s === "image/svg+xml" ? await $(n) : await Q(n), r);
	return c.width = Math.floor(i * o), c.height = Math.floor(a * o), c.style.width = `${i}px`, c.style.height = `${a}px`, c;
}
async function ct(e, t) {
	return Q(await z(e, {
		...t,
		type: "image/jpeg"
	}));
}
async function lt(e, t) {
	let n = await Z(await z(e, t));
	return n.getContext("2d").getImageData(0, 0, n.width, n.height).data;
}
async function ut(e, t) {
	return Q(await z(e, {
		...t,
		type: "image/png"
	}));
}
async function dt(e, t) {
	return Q(await z(e, {
		...t,
		type: "image/webp"
	}));
}
//#endregion
export { B as createContext, Re as destroyContext, ot as domToBlob, Z as domToCanvas, Q as domToDataUrl, it as domToForeignObjectSvg, st as domToImage, ct as domToJpeg, lt as domToPixel, ut as domToPng, $ as domToSvg, dt as domToWebp, P as loadMedia, F as waitUntilLoad };

//# sourceMappingURL=dist-BPmPx7kz.js.map