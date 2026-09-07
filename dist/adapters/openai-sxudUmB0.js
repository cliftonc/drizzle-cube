import { at as e, ct as t, ot as n } from "./utils-ixb9YIRy.js";
//#region node_modules/openai/internal/tslib.mjs
function r(e, t, n, r, i) {
	if (r === "m") throw TypeError("Private method is not writable");
	if (r === "a" && !i) throw TypeError("Private accessor was defined without a setter");
	if (typeof t == "function" ? e !== t || !i : !t.has(e)) throw TypeError("Cannot write private member to an object whose class did not declare it");
	return r === "a" ? i.call(e, n) : i ? i.value = n : t.set(e, n), n;
}
function i(e, t, n, r) {
	if (n === "a" && !r) throw TypeError("Private accessor was defined without a getter");
	if (typeof t == "function" ? e !== t || !r : !t.has(e)) throw TypeError("Cannot read private member from an object whose class did not declare it");
	return n === "m" ? r : n === "a" ? r.call(e) : r ? r.value : t.get(e);
}
//#endregion
//#region node_modules/openai/internal/utils/uuid.mjs
var a = function() {
	let { crypto: e } = globalThis;
	if (e?.randomUUID) return a = e.randomUUID.bind(e), e.randomUUID();
	let t = /* @__PURE__ */ new Uint8Array(1), n = e ? () => e.getRandomValues(t)[0] : () => Math.random() * 255 & 255;
	return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (e) => (+e ^ n() & 15 >> e / 4).toString(16));
};
//#endregion
//#region node_modules/openai/internal/errors.mjs
function o(e) {
	return typeof e == "object" && !!e && ("name" in e && e.name === "AbortError" || "message" in e && String(e.message).includes("FetchRequestCanceledException"));
}
var s = (e) => {
	if (e instanceof Error) return e;
	if (typeof e == "object" && e) {
		try {
			if (Object.prototype.toString.call(e) === "[object Error]") {
				let t = Error(e.message, e.cause ? { cause: e.cause } : {});
				return e.stack && (t.stack = e.stack), e.cause && !t.cause && (t.cause = e.cause), e.name && (t.name = e.name), t;
			}
		} catch {}
		try {
			return Error(JSON.stringify(e));
		} catch {}
	}
	return Error(e);
}, c = class extends Error {}, l = class e extends c {
	constructor(t, n, r, i) {
		super(`${e.makeMessage(t, n, r)}`), this.status = t, this.headers = i, this.requestID = i?.get("x-request-id"), this.error = n;
		let a = n;
		this.code = a?.code, this.param = a?.param, this.type = a?.type;
	}
	static makeMessage(e, t, n) {
		let r = t?.message ? typeof t.message == "string" ? t.message : JSON.stringify(t.message) : t ? JSON.stringify(t) : n;
		return e && r ? `${e} ${r}` : e ? `${e} status code (no body)` : r || "(no status code or body)";
	}
	static generate(t, n, r, i) {
		if (!t || !i) return new d({
			message: r,
			cause: s(n)
		});
		let a = n?.error;
		return t === 400 ? new p(t, a, r, i) : t === 401 ? new m(t, a, r, i) : t === 403 ? new h(t, a, r, i) : t === 404 ? new g(t, a, r, i) : t === 409 ? new _(t, a, r, i) : t === 422 ? new v(t, a, r, i) : t === 429 ? new y(t, a, r, i) : t >= 500 ? new b(t, a, r, i) : new e(t, a, r, i);
	}
}, u = class extends l {
	constructor({ message: e } = {}) {
		super(void 0, void 0, e || "Request was aborted.", void 0);
	}
}, d = class extends l {
	constructor({ message: e, cause: t }) {
		super(void 0, void 0, e || "Connection error.", void 0), t && (this.cause = t);
	}
}, f = class extends d {
	constructor({ message: e } = {}) {
		super({ message: e ?? "Request timed out." });
	}
}, p = class extends l {}, m = class extends l {}, h = class extends l {}, g = class extends l {}, _ = class extends l {}, v = class extends l {}, y = class extends l {}, b = class extends l {}, x = class extends c {
	constructor() {
		super("Could not parse response content as the length limit was reached");
	}
}, ee = class extends c {
	constructor() {
		super("Could not parse response content as the request was rejected by the content filter");
	}
}, S = class extends Error {
	constructor(e) {
		super(e);
	}
}, C = class extends l {
	constructor(e, t, n) {
		let r = "OAuth2 authentication error", i;
		if (t && typeof t == "object") {
			let e = t;
			i = e.error;
			let n = e.error_description;
			n && typeof n == "string" ? r = n : i && (r = i);
		}
		super(e, t, r, n), this.error_code = i;
	}
}, te = class extends c {
	constructor(e, t, n) {
		super(e), this.provider = t, this.cause = n;
	}
}, w = /^[a-z][a-z0-9+.-]*:/i, ne = (e) => w.test(e), T = (e) => (T = Array.isArray, T(e)), re = T;
function ie(e) {
	return typeof e == "object" ? e ?? {} : {};
}
function ae(e) {
	if (!e) return !0;
	for (let t in e) return !1;
	return !0;
}
function E(e, t) {
	return Object.prototype.hasOwnProperty.call(e, t);
}
function oe(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
var se = (e, t) => {
	if (typeof t != "number" || !Number.isInteger(t)) throw new c(`${e} must be an integer`);
	if (t < 0) throw new c(`${e} must be a positive integer`);
	return t;
}, ce = (e) => {
	try {
		return JSON.parse(e);
	} catch {
		return;
	}
}, le = (e) => new Promise((t) => setTimeout(t, e));
//#endregion
//#region node_modules/openai/internal/shims.mjs
function ue() {
	if (typeof fetch < "u") return fetch;
	throw Error("`fetch` is not defined as a global; Either pass `fetch` to the client, `new OpenAI({ fetch })` or polyfill the global, `globalThis.fetch = fetch`");
}
function de(...e) {
	let t = globalThis.ReadableStream;
	if (t === void 0) throw Error("`ReadableStream` is not defined as a global; You will need to polyfill it, `globalThis.ReadableStream = ReadableStream`");
	return new t(...e);
}
function fe(e) {
	let t = Symbol.asyncIterator in e ? e[Symbol.asyncIterator]() : e[Symbol.iterator]();
	return de({
		start() {},
		async pull(e) {
			let { done: n, value: r } = await t.next();
			n ? e.close() : e.enqueue(r);
		},
		async cancel() {
			await t.return?.();
		}
	});
}
function pe(e) {
	if (e[Symbol.asyncIterator]) return e;
	let t = e.getReader();
	return {
		async next() {
			try {
				let e = await t.read();
				return e?.done && t.releaseLock(), e;
			} catch (e) {
				throw t.releaseLock(), e;
			}
		},
		async return() {
			let e = t.cancel();
			return t.releaseLock(), await e, {
				done: !0,
				value: void 0
			};
		},
		[Symbol.asyncIterator]() {
			return this;
		}
	};
}
async function me(e) {
	if (typeof e != "object" || !e) return;
	if (e[Symbol.asyncIterator]) {
		await e[Symbol.asyncIterator]().return?.();
		return;
	}
	let t = e.getReader(), n = t.cancel();
	t.releaseLock(), await n;
}
//#endregion
//#region node_modules/openai/internal/utils/bytes.mjs
var he;
function ge(e) {
	let t;
	return (he ??= (t = new globalThis.TextEncoder(), t.encode.bind(t)))(e);
}
var _e;
function ve(e) {
	let t;
	return (_e ??= (t = new globalThis.TextDecoder(), t.decode.bind(t)))(e);
}
//#endregion
//#region node_modules/openai/internal/decoders/line.mjs
var ye, D, O, k, be, xe, Se, Ce = 65536, we = class {
	constructor() {
		ye.add(this), D.set(this, void 0), O.set(this, void 0), k.set(this, void 0), be.set(this, void 0), xe.set(this, void 0), r(this, D, /* @__PURE__ */ new Uint8Array(), "f"), r(this, O, 0, "f"), r(this, k, 0, "f"), r(this, be, 0, "f"), r(this, xe, !1, "f");
	}
	decode(e) {
		if (e == null) return [];
		let t;
		if (t = e instanceof ArrayBuffer ? new Uint8Array(e) : typeof e == "string" ? ge(e) : e, t.length === 0 || i(this, xe, "f") && (r(this, xe, !1, "f"), t[0] === 10 && (t = t.subarray(1)), t.length === 0)) return [];
		i(this, ye, "m", Se).call(this, t);
		let n = [], a;
		for (; (a = Te(i(this, D, "f"), i(this, be, "f"), i(this, k, "f"))) != null;) {
			let e = ve(i(this, D, "f").subarray(i(this, O, "f"), a.preceding));
			n.push(e), r(this, O, a.index, "f"), a.carriage && (i(this, O, "f") < i(this, k, "f") && i(this, D, "f")[i(this, O, "f")] === 10 ? r(this, O, i(this, O, "f") + 1, "f") : i(this, O, "f") === i(this, k, "f") && r(this, xe, !0, "f")), r(this, be, i(this, O, "f"), "f");
		}
		if (r(this, be, i(this, k, "f"), "f"), i(this, O, "f") === i(this, k, "f")) r(this, O, 0, "f"), r(this, k, 0, "f"), r(this, be, 0, "f"), i(this, D, "f").length > Ce && r(this, D, /* @__PURE__ */ new Uint8Array(), "f");
		else if (n.length > 0 && i(this, D, "f").length > Ce) {
			let e = i(this, k, "f") - i(this, O, "f");
			if (e <= Ce || i(this, D, "f").length > e * 4) {
				let t = e <= Ce ? Math.min(Math.max(e * 2, 256), Ce) : e * 2, n = new Uint8Array(t);
				n.set(i(this, D, "f").subarray(i(this, O, "f"), i(this, k, "f"))), r(this, D, n, "f"), r(this, O, 0, "f"), r(this, k, e, "f"), r(this, be, e, "f");
			}
		}
		return n;
	}
	flush() {
		return r(this, xe, !1, "f"), i(this, O, "f") === i(this, k, "f") ? [] : this.decode("\n");
	}
};
D = /* @__PURE__ */ new WeakMap(), O = /* @__PURE__ */ new WeakMap(), k = /* @__PURE__ */ new WeakMap(), be = /* @__PURE__ */ new WeakMap(), xe = /* @__PURE__ */ new WeakMap(), ye = /* @__PURE__ */ new WeakSet(), Se = function(e) {
	if (i(this, k, "f") + e.length > i(this, D, "f").length) {
		let t = i(this, k, "f") - i(this, O, "f");
		if (i(this, O, "f") >= i(this, D, "f").length / 2 && t + e.length <= i(this, D, "f").length) i(this, D, "f").copyWithin(0, i(this, O, "f"), i(this, k, "f"));
		else {
			let n = Math.max(i(this, D, "f").length * 2, t + e.length, 256), a = new Uint8Array(n);
			a.set(i(this, D, "f").subarray(i(this, O, "f"), i(this, k, "f"))), r(this, D, a, "f");
		}
		r(this, be, i(this, be, "f") - i(this, O, "f"), "f"), r(this, k, t, "f"), r(this, O, 0, "f");
	}
	i(this, D, "f").set(e, i(this, k, "f")), r(this, k, i(this, k, "f") + e.length, "f");
}, we.NEWLINE_CHARS = /* @__PURE__ */ new Set(["\n", "\r"]), we.NEWLINE_REGEXP = /\r\n|[\n\r]/g;
function Te(e, t, n) {
	for (let r = t; r < n; r++) {
		if (e[r] === 10) return {
			preceding: r,
			index: r + 1,
			carriage: !1
		};
		if (e[r] === 13) return {
			preceding: r,
			index: r + 1,
			carriage: !0
		};
	}
	return null;
}
function Ee(e) {
	for (let t = 0; t < e.length - 1; t++) {
		let n = De(e, t);
		if (n > 0) {
			let r = t + n, i = De(e, r);
			if (i > 0) return r + i;
		}
	}
	return -1;
}
function De(e, t) {
	return e[t] === 10 ? 1 : e[t] === 13 ? e[t + 1] === 10 ? 2 : 1 : 0;
}
//#endregion
//#region node_modules/openai/internal/utils/log.mjs
var Oe = {
	off: 0,
	error: 200,
	warn: 300,
	info: 400,
	debug: 500
}, ke = (e, t, n) => {
	if (e) {
		if (E(Oe, e)) return e;
		A(n).warn(`${t} was set to ${JSON.stringify(e)}, expected one of ${JSON.stringify(Object.keys(Oe))}`);
	}
};
function Ae() {}
function je(e, t, n) {
	return !t || Oe[e] > Oe[n] ? Ae : t[e].bind(t);
}
var Me = {
	error: Ae,
	warn: Ae,
	info: Ae,
	debug: Ae
}, Ne = /* @__PURE__ */ new WeakMap();
function A(e) {
	let t = e.logger, n = e.logLevel ?? "off";
	if (!t) return Me;
	let r = Ne.get(t);
	if (r && r[0] === n) return r[1];
	let i = {
		error: je("error", t, n),
		warn: je("warn", t, n),
		info: je("info", t, n),
		debug: je("debug", t, n)
	};
	return Ne.set(t, [n, i]), i;
}
var Pe = /* @__PURE__ */ new Set([
	"apikey",
	"accesstoken",
	"refreshtoken",
	"sessiontoken",
	"sessionid",
	"idtoken",
	"authtoken",
	"authorization",
	"token",
	"password",
	"clientsecret",
	"xamzsecuritytoken",
	"xamzsignature",
	"xamzcredential"
]);
function Fe(e) {
	let t = e.toLowerCase().replace(/[-_]/gu, "");
	return Pe.has(t) || Pe.has(t.replace(/^x/u, ""));
}
var Ie = /* @__PURE__ */ new Set([
	"authorization",
	"proxy-authorization",
	"api-key",
	"x-api-key",
	"x-amz-security-token",
	"cookie",
	"set-cookie",
	"x-session-token",
	"x-session-id",
	"x-auth-token",
	"x-id-token"
]);
function Le(e) {
	return Ie.has(e.toLowerCase().replace(/_/gu, "-")) || Fe(e);
}
function Re(e) {
	let t = new URL(e);
	t.username = "", t.password = "", t.hash = "";
	for (let e of t.searchParams.keys()) Fe(e) && t.searchParams.set(e, "***");
	return t.href;
}
var ze = (e) => {
	if (e.options) {
		if (e.options = { ...e.options }, delete e.options.headers, e.options.path) {
			let t = e.options.path, n = new URL(Re(new URL(t, "https://redacted.invalid").href));
			e.options.path = n.origin === "https://redacted.invalid" ? `${t.startsWith("/") ? "/" : ""}${n.pathname.slice(1)}${n.search}` : n.href;
		}
		e.options.query && (e.options.query = Object.fromEntries(Object.entries(e.options.query).map(([e, t]) => [e, Fe(e) ? "***" : t])));
	}
	return e.url &&= Re(e.url), e.headers &&= Object.fromEntries((e.headers instanceof Headers ? [...e.headers] : Object.entries(e.headers)).map(([e, t]) => [e, Le(e) ? "***" : t])), "retryOfRequestLogID" in e && (e.retryOfRequestLogID && (e.retryOf = e.retryOfRequestLogID), delete e.retryOfRequestLogID), e;
}, Be;
function Ve() {
	let e = [], t = 0;
	return {
		get length() {
			return e.length - t;
		},
		enqueue(t) {
			e.push(t);
		},
		dequeue() {
			if (t === e.length) return;
			let n = e[t];
			return e[t] = void 0, t += 1, t === e.length ? (e = [], t = 0) : t >= 1024 && t * 2 >= e.length && (e = e.slice(t), t = 0), n;
		}
	};
}
var He = class e {
	constructor(e, t, n) {
		Be.set(this, void 0), this.iterator = e, this.controller = t, r(this, Be, n, "f");
	}
	static fromSSEResponse(t, n, r, i) {
		let a = !1, s = r ? A(r) : console;
		async function* u() {
			if (a) throw new c("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
			a = !0;
			let e = !1, r = !1;
			try {
				for await (let e of We(t, n)) {
					if (e.data === "[DONE]") {
						r = !0;
						break;
					}
					if (e.event === null || !e.event.startsWith("thread.")) {
						let n;
						try {
							n = JSON.parse(e.data);
						} catch {
							throw s.error("Could not parse message into JSON:"), s.error("From chunk:"), SyntaxError("Error reading response: malformed server-sent event JSON.");
						}
						if (e.event === "error") throw new l(void 0, n?.error ?? n, void 0, t.headers);
						if (n && n.error) throw new l(void 0, n.error, void 0, t.headers);
						yield i ? {
							event: e.event,
							data: n
						} : n;
					} else {
						let t;
						try {
							t = JSON.parse(e.data);
						} catch {
							throw s.error("Could not parse message into JSON:"), s.error("From chunk:"), SyntaxError("Error reading response: malformed server-sent event JSON.");
						}
						yield {
							event: e.event,
							data: t
						};
					}
				}
				e = !0;
			} catch (e) {
				if (r || o(e) || n.signal.aborted && e === n.signal.reason) return;
				throw e;
			} finally {
				e || n.abort();
			}
		}
		return new e(u, n, r);
	}
	static fromReadableStream(t, n, r) {
		let i = !1;
		async function* a() {
			let e = new we(), r = t.getReader(), i = !1, a, o = () => {
				a ??= r.cancel(), a.catch(() => void 0);
			};
			n.signal.addEventListener("abort", o, { once: !0 });
			try {
				if (n.signal.aborted) {
					o();
					return;
				}
				for (;;) {
					let { value: t, done: a } = await r.read();
					if (a) {
						i = !0;
						break;
					}
					if (n.signal.aborted) return;
					for (let r of e.decode(t)) {
						if (n.signal.aborted) return;
						yield r;
					}
				}
				if (n.signal.aborted) return;
				for (let t of e.flush()) {
					if (n.signal.aborted) return;
					yield t;
				}
			} finally {
				n.signal.removeEventListener("abort", o), i || o(), r.releaseLock();
			}
		}
		async function* s() {
			if (i) throw new c("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
			i = !0;
			let e = !1;
			try {
				for await (let t of a()) if (!e && t) {
					let e;
					try {
						e = JSON.parse(t);
					} catch (e) {
						throw e instanceof SyntaxError ? SyntaxError("Error reading response: malformed newline-delimited JSON.") : e;
					}
					yield e;
				}
				e = !0;
			} catch (e) {
				if (n.signal.aborted || o(e)) return;
				throw e;
			} finally {
				e || n.abort();
			}
		}
		return new e(s, n, r);
	}
	[(Be = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
		return this.iterator();
	}
	tee() {
		let t = Ve(), n = Ve(), r = this.iterator(), a = (e) => ({ next: () => {
			if (e.length === 0) {
				let e = r.next();
				t.enqueue(e), n.enqueue(e);
			}
			return e.dequeue();
		} });
		return [new e(() => a(t), this.controller, i(this, Be, "f")), new e(() => a(n), this.controller, i(this, Be, "f"))];
	}
	toReadableStream() {
		let e;
		return de({
			start: async () => {
				e = this[Symbol.asyncIterator]();
			},
			async pull(t) {
				try {
					let { value: n, done: r } = await e.next();
					if (r) return t.close();
					let i = ge(JSON.stringify(n) + "\n");
					t.enqueue(i);
				} catch (e) {
					t.error(e);
				}
			},
			async cancel() {
				await e.return?.();
			}
		});
	}
};
function Ue(e, t) {
	let n = typeof e.getReader == "function" ? e.getReader() : void 0, r = n ? {
		next: () => n.read(),
		return: () => n.cancel()
	} : pe(e)[Symbol.asyncIterator](), i = {
		value: void 0,
		done: !0
	}, a = !1, s = !1, c, l, u = () => new Promise((e) => {
		l = e;
	}), d = () => {
		if (s || a) return c;
		s = !0;
		try {
			c = Promise.resolve(r.return?.());
		} catch (e) {
			c = Promise.reject(e);
		}
		return c.catch(() => void 0), c;
	}, f = () => {
		queueMicrotask(() => {
			l?.(), d();
		});
	};
	return {
		iterator: {
			async next() {
				if (t.aborted) return i;
				let e = u().then(() => i);
				try {
					let n = await Promise.race([r.next(), e]);
					return t.aborted ? i : n.done ? (a = !0, i) : {
						value: n.value,
						done: !1
					};
				} catch (e) {
					if (t.aborted && (o(e) || e === t.reason)) return i;
					throw e;
				} finally {
					l = void 0;
				}
			},
			async return() {
				let e = d();
				if (e && !t.aborted) {
					let n = u();
					try {
						t.aborted || await Promise.race([e, n]);
					} finally {
						l = void 0;
					}
				}
				return i;
			},
			[Symbol.asyncIterator]() {
				return this;
			}
		},
		start() {
			t.addEventListener("abort", f, { once: !0 }), t.aborted && f();
		},
		async cleanup(e) {
			let r;
			try {
				t.removeEventListener("abort", f);
			} catch (e) {
				r = e;
			}
			if (!a) {
				let n = d();
				if (n && !e && !t.aborted) try {
					await n;
				} catch (e) {
					r ??= e;
				}
			}
			if (n) try {
				n.releaseLock();
			} catch (e) {
				r ??= e;
			}
			if (r !== void 0 && !e && !t.aborted) throw r;
		}
	};
}
async function* We(e, t) {
	if (!e.body) throw t.abort(), globalThis.navigator !== void 0 && globalThis.navigator.product === "ReactNative" ? new c("The default react-native fetch implementation does not support streaming. Please use expo/fetch: https://docs.expo.dev/versions/latest/sdk/expo/#expofetch-api") : new c("Attempted to iterate over a response with no body");
	let n = new qe(), r = new we(), { signal: i } = t, a = Ue(e.body, i), s = !1;
	try {
		a.start();
		for await (let e of Ke(a.iterator)) {
			if (i.aborted) return;
			for (let t of r.decode(e)) {
				if (i.aborted) return;
				let e = n.decode(t);
				e && (yield e);
			}
		}
		if (i.aborted) return;
		for (let e of r.flush()) {
			if (i.aborted) return;
			let t = n.decode(e);
			t && (yield t);
		}
	} catch (e) {
		if (s = !0, !i.aborted || !o(e) && e !== i.reason) throw e;
	} finally {
		await a.cleanup(s);
	}
}
var Ge = 3;
async function* Ke(e) {
	let t = /* @__PURE__ */ new Uint8Array(), n = 0, r = 0, i = 0;
	for await (let a of e) {
		if (a == null) continue;
		let e;
		if (e = a instanceof ArrayBuffer ? new Uint8Array(a) : typeof a == "string" ? ge(a) : a, r + e.length > t.length) {
			let a = r - n;
			if (n >= t.length / 2 && a + e.length <= t.length) t.copyWithin(0, n, r);
			else {
				let i = new Uint8Array(Math.max(t.length * 2, a + e.length));
				i.set(t.subarray(n, r)), t = i;
			}
			i -= n, n = 0, r = a;
		}
		t.set(e, r), r += e.length;
		let o;
		for (; (o = Ee(t.subarray(i, r))) !== -1;) o += i, yield t.slice(n, o), n = o, i = n;
		i = Math.max(n, r - Ge);
	}
	r > n && (yield t.slice(n, r));
}
var qe = class {
	constructor() {
		this.event = null, this.data = [], this.chunks = [];
	}
	decode(e) {
		if (e.endsWith("\r") && (e = e.slice(0, -1)), !e) {
			if (!this.event && !this.data.length) return null;
			let e = {
				event: this.event,
				data: this.data.join("\n"),
				raw: this.chunks
			};
			return this.event = null, this.data = [], this.chunks = [], e;
		}
		if (this.chunks.push(e), e.startsWith(":")) return null;
		let [t, , n] = Je(e, ":"), r = n;
		return r.startsWith(" ") && (r = r.slice(1)), t === "event" ? this.event = r : t === "data" && this.data.push(r), null;
	}
};
function Je(e, t) {
	let n = e.indexOf(t);
	return n === -1 ? [
		e,
		"",
		""
	] : [
		e.slice(0, n),
		t,
		e.slice(n + t.length)
	];
}
//#endregion
//#region node_modules/openai/internal/parse.mjs
async function Ye(e, t) {
	let { response: n, requestLogID: r, retryOfRequestLogID: i, startTime: a } = t, o = await (async () => {
		if (t.options.stream) return A(e).debug("response", n.status, n.url, n.headers, n.body), t.options.__streamClass ? t.options.__streamClass.fromSSEResponse(n, t.controller, e, t.options.__synthesizeEventData) : He.fromSSEResponse(n, t.controller, e, t.options.__synthesizeEventData);
		if (n.status === 204) return null;
		if (t.options.__binaryResponse) return n;
		let r = n.headers.get("content-type")?.split(";")[0]?.trim();
		if (r?.includes("application/json") || r?.endsWith("+json")) {
			if (n.headers.get("content-length") === "0") return;
			let e = await n.text();
			return e ? Ze(JSON.parse(e), n) : void 0;
		}
		return await n.text();
	})().catch((e) => {
		throw Xe(e, t.controller.signal);
	});
	return A(e).debug(`[${r}] response parsed`, ze({
		retryOfRequestLogID: i,
		url: n.url,
		status: n.status,
		body: o,
		durationMs: Date.now() - a
	})), o;
}
function Xe(e, t) {
	if (!t.aborted || e !== t.reason || o(e)) return e;
	let n = "This operation was aborted", r = globalThis.DOMException;
	return typeof r == "function" ? new r(n, "AbortError") : Object.assign(/* @__PURE__ */ Error(n), { name: "AbortError" });
}
function Ze(e, t) {
	return !e || typeof e != "object" || Array.isArray(e) ? e : Object.defineProperty(e, "_request_id", {
		value: t.headers.get("x-request-id"),
		enumerable: !1
	});
}
//#endregion
//#region node_modules/openai/version.mjs
var Qe = "7.10.0", $e = () => typeof window < "u" && window.document !== void 0 && typeof navigator < "u";
function et() {
	return typeof Deno < "u" && Deno.build != null ? "deno" : typeof EdgeRuntime < "u" ? "edge" : Object.prototype.toString.call(globalThis.process === void 0 ? 0 : globalThis.process) === "[object process]" ? "node" : "unknown";
}
var tt = () => {
	let e = et();
	if (e === "deno") return {
		"X-Stainless-Lang": "js",
		"X-Stainless-Package-Version": Qe,
		"X-Stainless-OS": it(Deno.build.os),
		"X-Stainless-Arch": rt(Deno.build.arch),
		"X-Stainless-Runtime": "deno",
		"X-Stainless-Runtime-Version": typeof Deno.version == "string" ? Deno.version : Deno.version?.deno ?? "unknown"
	};
	if (typeof EdgeRuntime < "u") return {
		"X-Stainless-Lang": "js",
		"X-Stainless-Package-Version": Qe,
		"X-Stainless-OS": "Unknown",
		"X-Stainless-Arch": `other:${EdgeRuntime}`,
		"X-Stainless-Runtime": "edge",
		"X-Stainless-Runtime-Version": globalThis.process.version
	};
	if (e === "node") return {
		"X-Stainless-Lang": "js",
		"X-Stainless-Package-Version": Qe,
		"X-Stainless-OS": it(globalThis.process.platform ?? "unknown"),
		"X-Stainless-Arch": rt(globalThis.process.arch ?? "unknown"),
		"X-Stainless-Runtime": "node",
		"X-Stainless-Runtime-Version": globalThis.process.version ?? "unknown"
	};
	let t = nt();
	return t ? {
		"X-Stainless-Lang": "js",
		"X-Stainless-Package-Version": Qe,
		"X-Stainless-OS": "Unknown",
		"X-Stainless-Arch": "unknown",
		"X-Stainless-Runtime": `browser:${t.browser}`,
		"X-Stainless-Runtime-Version": t.version
	} : {
		"X-Stainless-Lang": "js",
		"X-Stainless-Package-Version": Qe,
		"X-Stainless-OS": "Unknown",
		"X-Stainless-Arch": "unknown",
		"X-Stainless-Runtime": "unknown",
		"X-Stainless-Runtime-Version": "unknown"
	};
};
function nt() {
	if (typeof navigator > "u" || !navigator) return null;
	for (let { key: e, pattern: t } of [
		{
			key: "edge",
			pattern: /Edge(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/
		},
		{
			key: "ie",
			pattern: /MSIE(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/
		},
		{
			key: "ie",
			pattern: /Trident(?:.*rv\:(\d+)\.(\d+)(?:\.(\d+))?)?/
		},
		{
			key: "chrome",
			pattern: /Chrome(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/
		},
		{
			key: "firefox",
			pattern: /Firefox(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/
		},
		{
			key: "safari",
			pattern: /(?:Version\W+(\d+)\.(\d+)(?:\.(\d+))?)?(?:\W+Mobile\S*)?\W+Safari/
		}
	]) {
		let n = t.exec(navigator.userAgent);
		if (n) return {
			browser: e,
			version: `${n[1] || 0}.${n[2] || 0}.${n[3] || 0}`
		};
	}
	return null;
}
var rt = (e) => e === "x32" ? "x32" : e === "x86_64" || e === "x64" ? "x64" : e === "arm" ? "arm" : e === "aarch64" || e === "arm64" ? "arm64" : e ? `other:${e}` : "unknown", it = (e) => (e = e.toLowerCase(), e.includes("ios") ? "iOS" : e === "android" ? "Android" : e === "darwin" ? "MacOS" : e === "win32" ? "Windows" : e === "freebsd" ? "FreeBSD" : e === "openbsd" ? "OpenBSD" : e === "linux" ? "Linux" : e ? `Other:${e}` : "Unknown"), at, ot = () => at ??= tt(), st = /* @__PURE__ */ new WeakMap();
function ct(e, t) {
	let n = st.get(e);
	return n || (n = /* @__PURE__ */ new Set(), st.set(e, n)), n.add(t), () => {
		let n = st.get(e);
		n && (n.delete(t), n.size === 0 && st.delete(e));
	};
}
var lt = ({ headers: e, body: t }) => {
	let n = typeof t == "object" && t ? st.get(t) : void 0, r;
	if (!n || n.size === 0) r = JSON.stringify(t);
	else {
		let e = [...n];
		r = JSON.stringify(t, function(t, n) {
			let r = n;
			for (let n of e) {
				let e = n.value(this, t, r);
				e !== void 0 && (r = e);
			}
			return r;
		});
		for (let t of e) t.complete();
	}
	return {
		bodyHeaders: { "content-type": "application/json" },
		body: r
	};
}, ut = "RFC3986", dt = String, ft = {
	RFC1738: (e) => String(e).replace(/%20/g, "+"),
	RFC3986: dt
}, pt, mt = (e, t) => {
	let n = pt ?? Object.hasOwn ?? Function.prototype.call.bind(Object.prototype.hasOwnProperty);
	return pt = n, n(e, t);
}, ht = /* @__PURE__ */ (() => {
	let e = [];
	for (let t = 0; t < 256; ++t) e.push("%" + ((t < 16 ? "0" : "") + t.toString(16)).toUpperCase());
	return e;
})(), gt = 1024, _t = (e, t, n, r, i) => {
	if (e.length === 0) return e;
	let a = e;
	if (typeof e == "symbol" ? a = Symbol.prototype.toString.call(e) : typeof e != "string" && (a = String(e)), n === "iso-8859-1") return escape(a).replace(/%u[0-9a-f]{4}/gi, (e) => "%26%23" + Number.parseInt(e.slice(2), 16) + "%3B");
	let o = "";
	for (let e = 0; e < a.length;) {
		let t = Math.min((Math.floor(e / gt) + 1) * gt, a.length);
		t < a.length && a.codePointAt(t - 1) > 65535 && (t += 1);
		let n = a.length >= gt ? a.slice(e, t) : a, r = [];
		for (let e = 0; e < n.length; ++e) {
			let t = n.charCodeAt(e);
			if (t === 45 || t === 46 || t === 95 || t === 126 || t >= 48 && t <= 57 || t >= 65 && t <= 90 || t >= 97 && t <= 122 || i === "RFC1738" && (t === 40 || t === 41)) {
				r[r.length] = n.charAt(e);
				continue;
			}
			if (t < 128) {
				r[r.length] = ht[t];
				continue;
			}
			if (t < 2048) {
				r[r.length] = ht[192 | t >> 6] + ht[128 | t & 63];
				continue;
			}
			if (t < 55296 || t >= 57344) {
				r[r.length] = ht[224 | t >> 12] + ht[128 | t >> 6 & 63] + ht[128 | t & 63];
				continue;
			}
			e += 1, t = 65536 + ((t & 1023) << 10 | n.charCodeAt(e) & 1023), r[r.length] = ht[240 | t >> 18] + ht[128 | t >> 12 & 63] + ht[128 | t >> 6 & 63] + ht[128 | t & 63];
		}
		o += r.join(""), e = t;
	}
	return o;
};
function vt(e) {
	return !e || typeof e != "object" ? !1 : !!(e.constructor && e.constructor.isBuffer && e.constructor.isBuffer(e));
}
function yt(e, t) {
	if (T(e)) {
		let n = [];
		for (let r of e) n.push(t(r));
		return n;
	}
	return t(e);
}
//#endregion
//#region node_modules/openai/internal/qs/stringify.mjs
var bt = {
	brackets(e) {
		return String(e) + "[]";
	},
	comma: "comma",
	indices(e, t) {
		return String(e) + "[" + t + "]";
	},
	repeat(e) {
		return String(e);
	}
}, xt = function(e, t) {
	Array.prototype.push.apply(e, T(t) ? t : [t]);
}, St, j = {
	addQueryPrefix: !1,
	allowDots: !1,
	allowEmptyArrays: !1,
	arrayFormat: "indices",
	charset: "utf-8",
	charsetSentinel: !1,
	delimiter: "&",
	encode: !0,
	encodeDotInKeys: !1,
	encoder: _t,
	encodeValuesOnly: !1,
	format: ut,
	formatter: dt,
	indices: !1,
	serializeDate(e) {
		return (St ??= Function.prototype.call.bind(Date.prototype.toISOString))(e);
	},
	skipNulls: !1,
	strictNullHandling: !1
};
function Ct(e) {
	return typeof e == "string" || typeof e == "number" || typeof e == "boolean" || typeof e == "symbol" || typeof e == "bigint";
}
var wt = {};
function Tt(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g, _) {
	let v = e, y = _, b = 0, x = !1;
	for (; (y = y.get(wt)) !== void 0 && !x;) {
		let t = y.get(e);
		if (b += 1, t !== void 0) {
			if (t === b) throw RangeError("Cyclic object value");
			x = !0;
		}
		y.get(wt) === void 0 && (b = 0);
	}
	if (typeof l == "function" ? v = l(t, v) : v instanceof Date ? v = f?.(v) : n === "comma" && T(v) && (v = yt(v, (e) => e instanceof Date ? f?.(e) : e)), v === null) {
		if (a) return c && !h ? c(t, j.encoder, g, "key", p) : t;
		v = "";
	}
	if (Ct(v) || vt(v)) {
		if (c) {
			let e = h ? t : c(t, j.encoder, g, "key", p);
			return [m?.(e) + "=" + m?.(c(v, j.encoder, g, "value", p))];
		}
		return [m?.(t) + "=" + m?.(String(v))];
	}
	let ee = [];
	if (v === void 0) return ee;
	let S;
	if (n === "comma" && T(v)) h && c && (v = yt(v, c)), S = [{ value: v.length > 0 ? v.join(",") || null : void 0 }];
	else if (T(l)) S = l;
	else {
		let e = Object.keys(v);
		u && e.sort(u), S = e;
	}
	let C = s ? String(t).replace(/\./g, "%2E") : String(t), te = r && T(v) && v.length === 1 ? C + "[]" : C;
	if (i && T(v) && v.length === 0) return te + "[]";
	for (let t of S) {
		let y = typeof t == "object" && t.value !== void 0 ? t.value : v[t];
		if (o && y === null) continue;
		let x = d && s ? t.replace(/\./g, "%2E") : t, S;
		S = T(v) ? typeof n == "function" ? n(te, x) : te : te + (d ? "." + x : "[" + x + "]"), _.set(e, b);
		let C = new WeakMap([[wt, _]]);
		xt(ee, Tt(y, S, n, r, i, a, o, s, n === "comma" && h && T(v) ? null : c, l, u, d, f, p, m, h, g, C));
	}
	return ee;
}
function Et(e = j) {
	if (e.allowEmptyArrays !== void 0 && typeof e.allowEmptyArrays != "boolean") throw TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
	if (e.encodeDotInKeys !== void 0 && typeof e.encodeDotInKeys != "boolean") throw TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");
	if (e.encoder !== null && e.encoder !== void 0 && typeof e.encoder != "function") throw TypeError("Encoder has to be a function.");
	let t = e.charset || j.charset;
	if (e.charset !== void 0 && e.charset !== "utf-8" && e.charset !== "iso-8859-1") throw TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
	let n = ut;
	if (e.format !== void 0) {
		if (!mt(ft, e.format)) throw TypeError("Unknown format option provided.");
		n = e.format;
	}
	let r = ft[n], i = j.filter;
	(typeof e.filter == "function" || T(e.filter)) && (i = e.filter);
	let a;
	if (a = e.arrayFormat && e.arrayFormat in bt ? e.arrayFormat : "indices" in e ? e.indices ? "indices" : "repeat" : j.arrayFormat, "commaRoundTrip" in e && typeof e.commaRoundTrip != "boolean") throw TypeError("`commaRoundTrip` must be a boolean, or absent");
	let o;
	return o = e.allowDots === void 0 ? e.encodeDotInKeys ? !0 : j.allowDots : !!e.allowDots, {
		addQueryPrefix: typeof e.addQueryPrefix == "boolean" ? e.addQueryPrefix : j.addQueryPrefix,
		allowDots: o,
		allowEmptyArrays: typeof e.allowEmptyArrays == "boolean" ? !!e.allowEmptyArrays : j.allowEmptyArrays,
		arrayFormat: a,
		charset: t,
		charsetSentinel: typeof e.charsetSentinel == "boolean" ? e.charsetSentinel : j.charsetSentinel,
		commaRoundTrip: !!e.commaRoundTrip,
		delimiter: e.delimiter === void 0 ? j.delimiter : e.delimiter,
		encode: typeof e.encode == "boolean" ? e.encode : j.encode,
		encodeDotInKeys: typeof e.encodeDotInKeys == "boolean" ? e.encodeDotInKeys : j.encodeDotInKeys,
		encoder: typeof e.encoder == "function" ? e.encoder : j.encoder,
		encodeValuesOnly: typeof e.encodeValuesOnly == "boolean" ? e.encodeValuesOnly : j.encodeValuesOnly,
		filter: i,
		format: n,
		formatter: r,
		serializeDate: typeof e.serializeDate == "function" ? e.serializeDate : j.serializeDate,
		skipNulls: typeof e.skipNulls == "boolean" ? e.skipNulls : j.skipNulls,
		sort: typeof e.sort == "function" ? e.sort : null,
		strictNullHandling: typeof e.strictNullHandling == "boolean" ? e.strictNullHandling : j.strictNullHandling
	};
}
function Dt(e, t = {}) {
	let n = e, r = Et(t), i, a;
	typeof r.filter == "function" ? (a = r.filter, n = a("", n)) : T(r.filter) && (a = r.filter, i = a);
	let o = [];
	if (typeof n != "object" || !n) return "";
	let s = bt[r.arrayFormat], c = s === "comma" && r.commaRoundTrip;
	i ||= Object.keys(n), r.sort && i.sort(r.sort);
	let l = /* @__PURE__ */ new WeakMap();
	for (let e of i) r.skipNulls && n[e] === null || xt(o, Tt(n[e], e, s, c, r.allowEmptyArrays, r.strictNullHandling, r.skipNulls, r.encodeDotInKeys, r.encode ? r.encoder : null, r.filter, r.sort, r.allowDots, r.serializeDate, r.format, r.formatter, r.encodeValuesOnly, r.charset, l));
	let u = o.join(r.delimiter), d = r.addQueryPrefix === !0 ? "?" : "";
	return r.charsetSentinel && (d += r.charset === "iso-8859-1" ? "utf8=%26%2310003%3B&" : "utf8=%E2%9C%93&"), u.length > 0 ? d + u : "";
}
//#endregion
//#region node_modules/openai/internal/utils/query.mjs
function Ot(e) {
	return Dt(e, { arrayFormat: "brackets" });
}
//#endregion
//#region node_modules/openai/internal/data-residency.mjs
var kt = /* @__PURE__ */ new Map([
	["global", "https://api.openai.com/v1"],
	["us", "https://us.api.openai.com/v1"],
	["eu", "https://eu.api.openai.com/v1"],
	["ae", "https://ae.api.openai.com/v1"]
]);
function At(e) {
	if (e.dataResidency === null || e.dataResidency === void 0) return;
	if (E(e, "baseURL")) throw new c("The `dataResidency` and `baseURL` options are mutually exclusive.");
	let t = kt.get(e.dataResidency);
	if (t === void 0) throw new c("Invalid `dataResidency`; expected one of: global, us, eu, ae.");
	return t;
}
function jt(e, t) {
	if (e != null) throw new c(`${t} does not support \`dataResidency\`.`);
}
//#endregion
//#region node_modules/openai/core/api-promise.mjs
var Mt, Nt = class e extends Promise {
	constructor(e, t, n = Ye) {
		super((e) => {
			e(null);
		}), this.responsePromise = t, this.parseResponse = n, Mt.set(this, void 0), r(this, Mt, e, "f");
	}
	_thenUnwrap(t) {
		return new e(i(this, Mt, "f"), this.responsePromise, async (e, n) => Ze(t(await this.parseResponse(e, n), n), n.response));
	}
	asResponse() {
		return this.responsePromise.then((e) => e.response);
	}
	async withResponse() {
		let [e, t] = await Promise.all([this.parse(), this.asResponse()]);
		return {
			data: e,
			response: t,
			request_id: t.headers.get("x-request-id")
		};
	}
	parse() {
		return this.parsedPromise ||= this.responsePromise.then((e) => this.parseResponse(i(this, Mt, "f"), e)), this.parsedPromise;
	}
	then(e, t) {
		return this.parse().then(e, t);
	}
	catch(e) {
		return this.parse().catch(e);
	}
	finally(e) {
		return this.parse().finally(e);
	}
};
Mt = /* @__PURE__ */ new WeakMap();
//#endregion
//#region node_modules/openai/core/pagination.mjs
var Pt, Ft = class {
	constructor(e, t, n, i) {
		Pt.set(this, void 0), r(this, Pt, e, "f"), this.options = i, this.response = t, this.body = n;
	}
	hasNextPage() {
		return this.getPaginatedItems().length ? this.nextPageRequestOptions() != null : !1;
	}
	async getNextPage() {
		let e = this.nextPageRequestOptions();
		if (!e) throw new c("No next page expected; please check `.hasNextPage()` before calling `.getNextPage()`.");
		return await i(this, Pt, "f").requestAPIList(this.constructor, e);
	}
	async *iterPages() {
		let e = this;
		for (yield e; e.hasNextPage();) e = await e.getNextPage(), yield e;
	}
	async *[(Pt = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
		for await (let e of this.iterPages()) for (let t of e.getPaginatedItems()) yield t;
	}
}, It = class extends Nt {
	constructor(e, t, n) {
		super(e, t, async (e, t) => new n(e, t.response, await Ye(e, t), t.options));
	}
	async *[Symbol.asyncIterator]() {
		let e = await this;
		for await (let t of e) yield t;
	}
}, Lt = class extends Ft {
	constructor(e, t, n, r) {
		super(e, t, n, r), this.data = n.data || [], this.object = n.object;
	}
	getPaginatedItems() {
		return this.data ?? [];
	}
	nextPageRequestOptions() {
		return null;
	}
}, M = class extends Ft {
	constructor(e, t, n, r) {
		super(e, t, n, r), this.data = n.data || [], this.has_more = n.has_more || !1;
	}
	getPaginatedItems() {
		return this.data ?? [];
	}
	hasNextPage() {
		return this.has_more !== !1 && super.hasNextPage();
	}
	nextPageRequestOptions() {
		let e = this.getPaginatedItems(), t = e[e.length - 1]?.id;
		return t ? {
			...this.options,
			query: {
				...ie(this.options.query),
				after: t
			}
		} : null;
	}
}, N = class extends Ft {
	constructor(e, t, n, r) {
		super(e, t, n, r), this.data = n.data || [], this.has_more = n.has_more || !1, this.last_id = n.last_id || "";
	}
	getPaginatedItems() {
		return this.data ?? [];
	}
	hasNextPage() {
		return this.has_more !== !1 && super.hasNextPage();
	}
	nextPageRequestOptions() {
		let e = this.last_id;
		return e ? {
			...this.options,
			query: {
				...ie(this.options.query),
				after: e
			}
		} : null;
	}
}, Rt = class extends Ft {
	constructor(e, t, n, r) {
		super(e, t, n, r), this.data = n.data || [], this.has_more = n.has_more || !1, this.next = n.next || null;
	}
	getPaginatedItems() {
		return this.data ?? [];
	}
	hasNextPage() {
		return this.has_more !== !1 && super.hasNextPage();
	}
	nextPageRequestOptions() {
		let e = this.next;
		return e ? {
			...this.options,
			query: {
				...ie(this.options.query),
				after: e
			}
		} : null;
	}
}, zt = {
	jwt: "urn:ietf:params:oauth:token-type:jwt",
	id: "urn:ietf:params:oauth:token-type:id_token"
}, Bt = "urn:ietf:params:oauth:grant-type:token-exchange", Vt = .5;
function Ht(e, t, n) {
	let r = (n ?? 1200) * 1e3;
	return e - Math.min(r, (e - t) * Vt);
}
var Ut = Response.prototype, Wt = Ut.arrayBuffer;
function Gt(e, t) {
	let n = Object.getOwnPropertyDescriptor(t, "constructor")?.value;
	if (t === e || typeof n != "function" || Object.getOwnPropertyDescriptor(n, "name")?.value !== "Response" || Object.getOwnPropertyDescriptor(n, "prototype")?.value !== t) return !1;
	let r = Object.getOwnPropertyDescriptor(t, Symbol.toStringTag);
	return (r?.value === "Response" || typeof r?.get == "function") && typeof Object.getOwnPropertyDescriptor(t, "headers")?.get == "function" && typeof Object.getOwnPropertyDescriptor(t, "ok")?.get == "function" && typeof Object.getOwnPropertyDescriptor(t, "status")?.get == "function";
}
function Kt(e, t) {
	if (e === t) return !0;
	let n = Object.getOwnPropertyDescriptor(e, "constructor")?.value;
	return t !== null && Object.getPrototypeOf(t) === e && typeof n == "function" && Object.getOwnPropertyDescriptor(n, "name")?.value === "Body" && Object.getOwnPropertyDescriptor(n, "prototype")?.value === e;
}
function qt(e) {
	return new TextDecoder("utf-8", { ignoreBOM: typeof globalThis.Bun?.version == "string" }).decode(e);
}
async function Jt(e) {
	let t, n = null;
	for (let r = 0, i = e; i !== null && r < 16 && i !== Ut; i = Object.getPrototypeOf(i), r += 1) {
		Gt(e, i) && (n = i);
		let r = Object.getOwnPropertyDescriptor(i, "json");
		if (!r) continue;
		if (typeof r.value != "function") break;
		let a = Object.getOwnPropertyDescriptor(i, "text")?.value;
		if (typeof a == "function" && Kt(i, n)) {
			t = a;
			break;
		}
		return r.value.call(e);
	}
	let r = t === void 0 ? qt(await Wt.call(e)) : await t.call(e);
	try {
		return JSON.parse(r);
	} catch {
		throw SyntaxError("Token exchange response contains invalid JSON");
	}
}
function Yt(e) {
	return typeof globalThis.Bun?.version == "string" ? /[^\t\u0020-\u007E]|^[\t ]|[\t ]$/u.test(e) : /[^\t\u0020-\u007E\u0080-\u00FF]|^[\t ]|[\t ]$/u.test(e);
}
var Xt = class e {
	constructor(e, t) {
		this.cachedToken = null, this.refreshPromise = null, this.tokenGeneration = 0, this.tokenExchangeUrl = "https://auth.openai.com/oauth/token";
		let { identityProviderId: n, serviceAccountId: r, clientId: i, refreshBufferSeconds: a, provider: o } = e;
		this.config = {
			identityProviderId: n,
			serviceAccountId: r,
			...i === void 0 ? {} : { clientId: i },
			...a === void 0 ? {} : { refreshBufferSeconds: a },
			provider: {
				tokenType: o.tokenType,
				getToken: o.getToken.bind(o)
			}
		}, this.fetch = t ?? ue();
	}
	async getToken() {
		if (!this.cachedToken || e.isTokenExpired(this.cachedToken)) {
			if (this.refreshPromise) return await this.refreshPromise;
			let e = this.refreshToken(this.tokenGeneration);
			this.refreshPromise = e;
			try {
				return await e;
			} finally {
				this.refreshPromise === e && (this.refreshPromise = null);
			}
		}
		if (e.needsRefresh(this.cachedToken) && !this.refreshPromise) {
			let e = this.refreshToken(this.tokenGeneration).finally(() => {
				this.refreshPromise === e && (this.refreshPromise = null);
			});
			this.refreshPromise = e, e.catch(() => null);
		}
		return this.cachedToken.token;
	}
	async refreshToken(e) {
		let t = {
			grant_type: Bt,
			subject_token: await this.config.provider.getToken(),
			subject_token_type: zt[this.config.provider.tokenType],
			identity_provider_id: this.config.identityProviderId,
			service_account_id: this.config.serviceAccountId
		};
		this.config.clientId && (t.client_id = this.config.clientId);
		let n = await this.fetch(this.tokenExchangeUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(t),
			redirect: "manual"
		});
		if (!n.ok) {
			let e = await n.text(), t;
			try {
				t = JSON.parse(e);
			} catch {}
			throw n.status === 400 || n.status === 401 || n.status === 403 ? new C(n.status, t, n.headers) : l.generate(n.status, t, `Token exchange failed with status ${n.status}`, n.headers);
		}
		let r = await Jt(n), i = typeof r == "object" && r && "access_token" in r ? r.access_token : void 0;
		if (typeof i != "string" || i.trim().length === 0 || Yt(i)) throw new c("Token exchange response missing 'access_token' field");
		let a = r.expires_in ?? 3600;
		if (typeof a != "number" || !Number.isFinite(a) || a <= 0) throw new c("Token exchange response has invalid 'expires_in' field");
		let o = Date.now(), s = o + a * 1e3;
		if (!Number.isSafeInteger(s) || s <= o) throw new c("Token exchange response has invalid 'expires_in' field");
		return this.tokenGeneration === e && (this.cachedToken = {
			token: i,
			expiresAt: s,
			refreshAt: Ht(s, o, this.config.refreshBufferSeconds)
		}), i;
	}
	static isTokenExpired(e) {
		return Date.now() >= e.expiresAt;
	}
	static needsRefresh(e) {
		return Date.now() >= e.refreshAt;
	}
	invalidateToken() {
		this.tokenGeneration += 1, this.cachedToken = null, this.refreshPromise = null;
	}
};
function Zt(e) {
	let t;
	try {
		t = new URL(e);
	} catch {
		throw new c("X.509 workload identity requires the approved global mTLS API origin.");
	}
	if (t.origin !== "https://mtls.api.openai.com" || t.username || t.password) throw new c("X.509 workload identity requires the approved global mTLS API origin.");
	for (let e of t.searchParams.keys()) if (Fe(e)) throw new c("X.509 workload identity cannot send conflicting query authentication credentials.");
	return t;
}
//#endregion
//#region node_modules/openai/internal/headers.mjs
var Qt = /* @__PURE__ */ Symbol("brand.privateNullableHeaders"), $t = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
function* en(e) {
	if (!e) return;
	if (Qt in e) {
		let { values: t, nulls: n } = e;
		yield* t.entries();
		for (let e of n) yield [e, null];
		return;
	}
	let t = !1, n;
	e instanceof Headers ? n = e.entries() : re(e) ? n = e : (t = !0, n = Object.entries(e ?? {}));
	for (let e of n) {
		let n = e[0];
		if (typeof n != "string") throw TypeError("expected header name to be a string");
		let r = re(e[1]) ? e[1] : [e[1]], i = !1;
		for (let e of r) e !== void 0 && (t && !i && (i = !0, yield [n, null]), yield [n, e]);
	}
}
var P = (e) => {
	let t = new Headers(), n = /* @__PURE__ */ new Set();
	for (let r of e) {
		let e = /* @__PURE__ */ new Set();
		for (let [i, a] of en(r)) {
			if (!$t.test(i)) throw TypeError(`Header name must be a valid HTTP token ["${i}"]`);
			let r = i.toLowerCase();
			e.has(r) || (t.delete(r), e.add(r)), a === null ? (t.delete(r), n.add(r)) : (t.append(r, a), n.delete(r));
		}
	}
	return {
		[Qt]: !0,
		values: t,
		nulls: n
	};
}, tn = /* @__PURE__ */ n({
	findRegisteredX509Transport: () => ln,
	findX509Credential: () => bn,
	findX509OAuthError: () => vn,
	isApprovedX509Client: () => gn,
	isRetryableX509IssuerError: () => mn,
	isTransientX509ConnectionError: () => fn,
	markApprovedX509Client: () => hn,
	markRetryableX509IssuerError: () => pn,
	markTransientX509ConnectionError: () => dn,
	rememberRegisteredX509Transport: () => un,
	rememberX509Credential: () => yn,
	rememberX509OAuthError: () => _n
}), nn = /* @__PURE__ */ new WeakMap(), rn = /* @__PURE__ */ new WeakSet(), an = /* @__PURE__ */ new WeakSet(), on = /* @__PURE__ */ new WeakSet(), sn = /* @__PURE__ */ new WeakMap(), cn = /* @__PURE__ */ new WeakMap(), ln = WeakMap.prototype.get.bind(nn), un = WeakMap.prototype.set.bind(nn), dn = WeakSet.prototype.add.bind(rn), fn = WeakSet.prototype.has.bind(rn), pn = WeakSet.prototype.add.bind(an), mn = WeakSet.prototype.has.bind(an), hn = WeakSet.prototype.add.bind(on), gn = WeakSet.prototype.has.bind(on), _n = WeakMap.prototype.set.bind(sn), vn = WeakMap.prototype.get.bind(sn), yn = WeakMap.prototype.set.bind(cn), bn = WeakMap.prototype.get.bind(cn), xn = /* @__PURE__ */ t((/* @__PURE__ */ e(((e, t) => {
	if (t !== void 0 && t !== globalThis.module && e !== void 0 && t.exports === e) {
		Object.defineProperty(e, "__esModule", { value: !0 }), e.findX509Credential = e.rememberX509Credential = e.findX509OAuthError = e.rememberX509OAuthError = e.isApprovedX509Client = e.markApprovedX509Client = e.isRetryableX509IssuerError = e.markRetryableX509IssuerError = e.isTransientX509ConnectionError = e.markTransientX509ConnectionError = e.rememberRegisteredX509Transport = e.findRegisteredX509Transport = void 0;
		let t = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakSet(), r = /* @__PURE__ */ new WeakSet(), i = /* @__PURE__ */ new WeakSet(), a = /* @__PURE__ */ new WeakMap(), o = /* @__PURE__ */ new WeakMap();
		e.findRegisteredX509Transport = WeakMap.prototype.get.bind(t), e.rememberRegisteredX509Transport = WeakMap.prototype.set.bind(t), e.markTransientX509ConnectionError = WeakSet.prototype.add.bind(n), e.isTransientX509ConnectionError = WeakSet.prototype.has.bind(n), e.markRetryableX509IssuerError = WeakSet.prototype.add.bind(r), e.isRetryableX509IssuerError = WeakSet.prototype.has.bind(r), e.markApprovedX509Client = WeakSet.prototype.add.bind(i), e.isApprovedX509Client = WeakSet.prototype.has.bind(i), e.rememberX509OAuthError = WeakMap.prototype.set.bind(a), e.findX509OAuthError = WeakMap.prototype.get.bind(a), e.rememberX509Credential = WeakMap.prototype.set.bind(o), e.findX509Credential = WeakMap.prototype.get.bind(o);
	}
})))(), 1), { findRegisteredX509Transport: Sn, rememberRegisteredX509Transport: Cn, markTransientX509ConnectionError: wn, isTransientX509ConnectionError: Tn, markRetryableX509IssuerError: En, isRetryableX509IssuerError: Dn, markApprovedX509Client: On, isApprovedX509Client: kn, rememberX509OAuthError: An, findX509OAuthError: jn, rememberX509Credential: Mn, findX509Credential: Nn } = typeof xn.findRegisteredX509Transport == "function" ? xn : tn;
//#endregion
//#region node_modules/openai/internal/auth/x509-transport-registry.mjs
function Pn(e) {
	if (!e || typeof e != "object") throw new c("X.509 workload identity requires an approved X.509 transport capability.");
	let t = Sn(e);
	if (!t) throw new c("X.509 workload identity requires an approved X.509 transport capability.");
	return t;
}
//#endregion
//#region node_modules/openai/internal/auth/x509-workload-identity-auth.mjs
var F, I, Fn, In, Ln, Rn, zn, Bn, L, Vn, Hn, Un, Wn, Gn, Kn, qn, Jn, Yn, Xn, Zn, Qn, R, $n, er = [
	"dispatcher",
	"agent",
	"client",
	"tls",
	"proxy"
], tr = (e, t) => Headers.prototype.get.call(e, t), nr = 12e5, rr = 1e3, ir = (e) => {
	let t = new u();
	return Object.defineProperty(t, "cause", {
		value: e.reason,
		writable: !0,
		configurable: !0
	}), t;
};
function ar(e) {
	for (let t of Headers.prototype.keys.call(e)) {
		let e = t.toLowerCase().split("_").join("-");
		if (e !== "authorization" && Le(e) || e === "host") throw new c("X.509 workload identity cannot send conflicting authentication credentials.");
	}
}
function or(e, t) {
	let n = new AbortController(), r = e === void 0 ? void 0 : setTimeout(() => n.abort(new f()), e), i = r;
	typeof i == "object" && i && "unref" in i && typeof i.unref == "function" && i.unref();
	let a = () => n.abort(t?.reason);
	return t?.addEventListener("abort", a, { once: !0 }), t?.aborted && a(), {
		signal: n.signal,
		dispose: () => {
			t?.removeEventListener("abort", a), r && clearTimeout(r);
		}
	};
}
function sr(e, t) {
	let n, r = new Promise((e, r) => {
		n = () => r(t.reason), t.addEventListener("abort", n, { once: !0 }), t.aborted && n();
	});
	return {
		result: Promise.race([e.promise, r]),
		dispose: () => {
			n && t.removeEventListener("abort", n);
		}
	};
}
function cr(e) {
	if (!e || typeof e != "object") return !1;
	let t = e;
	for (; t !== null && t !== Object.prototype;) {
		let e = Object.getOwnPropertyDescriptor(t, "provider");
		if (e) {
			if (!("value" in e) || e.value !== void 0) return !1;
			break;
		}
		t = Object.getPrototypeOf(t);
	}
	let n = e;
	for (; n !== null && n !== Object.prototype;) {
		let e = Object.getOwnPropertyDescriptor(n, "type");
		if (e) {
			if (!("value" in e)) throw new c("X.509 workload identity type must be a plain data property.");
			return e.value === "x509";
		}
		n = Object.getPrototypeOf(n);
	}
	return !1;
}
function lr(e) {
	if (!e) return;
	for (let t of er) if (E(e, t)) throw new c("X.509 workload identity cannot override its approved transport capability.");
	let t = Object.getOwnPropertyDescriptor(e, "redirect")?.value;
	if (t !== void 0 && t !== "manual") throw new c("X.509 workload identity requests require manual redirects.");
}
function ur(e) {
	if (lr(e), e && [
		"body",
		"headers",
		"method",
		"signal"
	].some((t) => E(e, t))) throw new c("X.509 workload identity cannot override its request body, headers, method, or signal through fetch options.");
}
function dr(e) {
	ur(e);
	let t = { ...e };
	return ur(t), t;
}
var fr = class {
	constructor(e, t, n, a) {
		if (F.add(this), Fn.set(this, void 0), In.set(this, void 0), Ln.set(this, void 0), Rn.set(this, void 0), zn.set(this, void 0), Bn.set(this, void 0), L.set(this, void 0), Vn.set(this, void 0), Hn.set(this, void 0), Un.set(this, void 0), Wn.set(this, 0), r(this, L, Pn(t), "f"), r(this, Fn, e.identityProviderId, "f"), r(this, In, e.serviceAccountId, "f"), r(this, Ln, e.refreshBufferMs, "f"), r(this, Rn, e.refreshBufferSeconds, "f"), r(this, zn, n, "f"), r(this, Bn, a, "f"), i(this, Ln, "f") !== void 0 && i(this, Rn, "f") !== void 0) throw new c("X.509 workload identity cannot combine refreshBufferSeconds and refreshBufferMs.");
		if (i(this, Ln, "f") !== void 0 && (!Number.isSafeInteger(i(this, Ln, "f")) || i(this, Ln, "f") < 0)) throw new c("X.509 workload identity requires a nonnegative integer refreshBufferMs.");
		if (i(this, Rn, "f") !== void 0 && (!Number.isSafeInteger(i(this, Rn, "f")) || i(this, Rn, "f") < 0 || !Number.isSafeInteger(i(this, Rn, "f") * 1e3))) throw new c("X.509 workload identity requires a nonnegative integer refreshBufferSeconds.");
		r(this, Vn, i(this, Rn, "f") === void 0 ? i(this, Ln, "f") ?? nr : i(this, Rn, "f") * 1e3, "f");
	}
	identitySnapshot() {
		return {
			type: "x509",
			identityProviderId: i(this, Fn, "f"),
			serviceAccountId: i(this, In, "f"),
			...i(this, Ln, "f") === void 0 ? {} : { refreshBufferMs: i(this, Ln, "f") },
			...i(this, Rn, "f") === void 0 ? {} : { refreshBufferSeconds: i(this, Rn, "f") }
		};
	}
	static shouldAuthenticate(e, t, n = e.headers) {
		return !P([t, n]).nulls.has("authorization");
	}
	snapshotHeaders(e, t) {
		let n = i(this, F, "m", R).call(this);
		return n.defaultHeaders ??= P([e]), n.requestHeaders ??= P([t]), this.headerSnapshots();
	}
	headerSnapshots() {
		let { defaultHeaders: e, requestHeaders: t } = i(this, F, "m", R).call(this);
		if (!e || !t) throw new c("X.509 workload identity requires snapshotted request headers.");
		return {
			defaultHeaders: e,
			requestHeaders: t
		};
	}
	snapshotTenant(e, t) {
		if (e !== i(this, zn, "f") || t !== i(this, Bn, "f")) throw new c("X.509 workload identity cannot override its enrolled organization or project.");
		let n = i(this, F, "m", R).call(this);
		return n.tenant = {
			organization: e,
			project: t
		}, n.tenant;
	}
	tenantSnapshot() {
		let { tenant: e } = i(this, F, "m", R).call(this);
		if (!e) throw new c("X.509 workload identity requires snapshotted tenant selectors.");
		return e;
	}
	snapshotAPIURL(e) {
		Zt(e), i(this, F, "m", R).call(this).apiURL = e;
	}
	requestAPIURL() {
		let { apiURL: e } = i(this, F, "m", R).call(this);
		if (e === void 0) throw new c("X.509 workload identity requires a snapshotted API destination.");
		return e;
	}
	snapshotRequest(e, t, n) {
		var r;
		(r = i(this, F, "m", R).call(this)).request ?? (r.request = {
			signal: e,
			timeout: t,
			fetchOptions: n
		});
	}
	requestSnapshot() {
		let { request: e } = i(this, F, "m", R).call(this);
		if (!e) throw new c("X.509 workload identity requires snapshotted request settings.");
		return e;
	}
	beginRequestPreparation() {
		let e = i(this, F, "m", R).call(this);
		e.deadlineArmed && e.preparationStartedAt === void 0 && (e.preparationStartedAt = performance.now(), e.preparationWallStartedAt = Date.now());
	}
	beginRequestPlanning() {
		i(this, F, "m", R).call(this).phase = "planning";
	}
	beginRequestNetwork() {
		let e = i(this, F, "m", R).call(this);
		e.deadlineArmed ? e.preparationStartedAt !== void 0 && (e.monotonicStartedAt += performance.now() - e.preparationStartedAt, e.wallStartedAt += Date.now() - (e.preparationWallStartedAt ?? Date.now()), delete e.preparationStartedAt, delete e.preparationWallStartedAt) : (e.wallStartedAt = Date.now(), e.monotonicStartedAt = performance.now(), e.deadlineArmed = !0);
	}
	isPlanningRequest() {
		return i(this, F, "m", R).call(this).phase === "planning";
	}
	authorizePlannedRequest(e, t, n, r = !1) {
		let a = i(this, F, "m", R).call(this), o = Object.getOwnPropertyDescriptor(t, "headers"), s = Object.getOwnPropertyDescriptor(t, "body"), l = Object.getOwnPropertyDescriptor(t, "signal"), u = Object.getOwnPropertyDescriptor(t, "redirect");
		if (a.phase !== "planning" || !o || !(o.value instanceof Headers) || !s && "body" in t || [
			s,
			l,
			u
		].some((e) => e && !("value" in e))) throw new c("X.509 workload identity requires an approved final request.");
		this.snapshotAPIURL(e), lr(t);
		try {
			ar(o.value);
		} catch {
			throw new c("X.509 workload identity cannot use caller-supplied authentication credentials.");
		}
		if (tr(o.value, "Authorization") !== null) throw new c("X.509 workload identity cannot use caller-supplied authorization credentials.");
		if (i(this, F, "m", $n).call(this, o.value), !r && (l?.value ?? void 0) !== (this.requestSnapshot().signal ?? void 0)) throw new c("X.509 workload identity must preserve its approved request signal.");
		let d = this.requestSnapshot();
		a.request = {
			...d,
			timeout: Math.min(d.timeout, n)
		}, a.phase = "authorizing";
	}
	ownRequestBody(e, t) {
		e instanceof ReadableStream && e !== t && (i(this, F, "m", R).call(this).materializedBody = e);
	}
	static isStreamingRequestBody(e) {
		return globalThis.ReadableStream !== void 0 && e instanceof globalThis.ReadableStream || typeof e == "object" && !!e && (Symbol.asyncIterator in e || Symbol.iterator in e && "next" in e && typeof e.next == "function");
	}
	retireRequestBody() {
		let e = i(this, F, "m", R).call(this), t = e.materializedBody;
		delete e.materializedBody, t && i(I, I, "m", Gn).call(I, t);
	}
	releaseRequestBody(e) {
		let t = i(this, F, "m", R).call(this);
		t.materializedBody === e ? delete t.materializedBody : this.retireRequestBody();
	}
	setEffectiveSignal(e) {
		e ? i(this, F, "m", R).call(this).effectiveSignal = e : delete i(this, F, "m", R).call(this).effectiveSignal;
	}
	effectiveSignal() {
		let e = i(this, F, "m", R).call(this);
		return e.effectiveSignal ?? e.request?.signal;
	}
	runRequest(e, t) {
		return i(this, L, "f").run(async () => {
			let n = i(this, L, "f").current();
			if (!n) throw new c("X.509 workload identity requires an active certificate request scope.");
			n.owner = this, n.requestOwner = t;
			try {
				return await e();
			} finally {
				this.retireRequestBody(), this.releaseRequestCredentials(), delete n.requestOwner, delete n.owner;
			}
		});
	}
	inRequest(e) {
		let t = i(this, L, "f").current();
		return t?.owner === this && t.requestOwner === e && t.phase !== "authorizing";
	}
	matches(e) {
		return i(this, L, "f") === i(e, L, "f") && i(this, Fn, "f") === i(e, Fn, "f") && i(this, In, "f") === i(e, In, "f") && i(this, zn, "f") === i(e, zn, "f") && i(this, Bn, "f") === i(e, Bn, "f") && i(this, Vn, "f") === i(e, Vn, "f");
	}
	continuation() {
		let { wallStartedAt: e, monotonicStartedAt: t, deadlineArmed: n, request: r, requestOwner: a, effectiveSignal: o } = i(this, F, "m", R).call(this), s = {
			wallStartedAt: e,
			monotonicStartedAt: t,
			owner: this,
			...n ? { deadlineArmed: n } : {},
			...r ? { request: r } : {},
			...o ? { effectiveSignal: o } : {},
			...a ? { requestOwner: a } : {}
		};
		return (e) => i(this, L, "f").resume(s, async () => {
			try {
				return await e();
			} finally {
				this.releaseRequestCredentials(), delete s.requestOwner, delete s.owner;
			}
		});
	}
	releaseRequestCredentials() {
		let e = i(this, F, "m", R).call(this);
		delete e.request, delete e.phase, delete e.deadlineArmed, delete e.preparationStartedAt, delete e.preparationWallStartedAt, delete e.effectiveSignal, delete e.materializedBody, delete e.apiURL, delete e.tenant, delete e.token, delete e.defaultHeaders, delete e.requestHeaders, delete e.tokenGeneration, delete e.headers, delete e.authorization;
	}
	requestStartedAt(e) {
		return i(this, L, "f").current()?.wallStartedAt;
	}
	usedWorkloadToken(e) {
		return i(this, L, "f").current()?.token !== void 0;
	}
	remainingTimeout(e, t) {
		let n = i(this, L, "f").current();
		if (n === void 0) return t;
		let r = t - (performance.now() - n.monotonicStartedAt);
		if (r <= 0) throw new f();
		return r;
	}
	async waitForRetry(e, t) {
		try {
			await i(this, L, "f").sleep(e, t);
		} catch (e) {
			throw t?.aborted ? ir(t) : e;
		}
	}
	static isRetryableFailure(e) {
		return typeof e == "object" && !!e && (Tn(e) || Dn(e));
	}
	static retryHeaders(e) {
		if (!e || typeof e != "object" || !Dn(e)) return;
		let t = Object.getOwnPropertyDescriptor(e, "headers")?.value;
		return t instanceof Headers ? t : void 0;
	}
	async getToken(e, t) {
		let n = t ? t.signal : e?.signal;
		if (n?.aborted) throw ir(n);
		e && ur(t ? t.fetchOptions : e.fetchOptions), i(this, F, "m", Qn).call(this, t);
		let r = e ? i(this, F, "m", R).call(this) : void 0, a = i(this, Hn, "f");
		if (a && performance.now() < a.refreshAt && Date.now() < a.wallRefreshAt) return i(I, I, "m", Kn).call(I, r, a);
		let { signal: o, dispose: s } = or(t && e ? this.remainingTimeout(e, t.timeout) : t?.timeout, n);
		if (n?.aborted) throw s(), ir(n);
		let c = i(this, Un, "f") ?? i(this, F, "m", Xn).call(this);
		c.waiters += 1;
		let l = sr(c, o);
		try {
			let e = await l.result, t = i(this, Hn, "f");
			if (!t || t.accessToken !== e.accessToken) throw new u();
			return i(I, I, "m", Kn).call(I, r, t);
		} catch (n) {
			return await i(this, F, "m", qn).call(this, n, c, a, r, e, t);
		} finally {
			l.dispose(), s(), --c.waiters, i(this, F, "m", Yn).call(this, c);
		}
	}
	invalidateToken() {
		let e = i(this, L, "f").current();
		if (!e?.token || i(this, Hn, "f")?.accessToken !== e.token || i(this, Hn, "f").generation !== e.tokenGeneration) return;
		r(this, Wn, i(this, Wn, "f") + 1, "f"), r(this, Hn, void 0, "f");
		let t = i(this, Un, "f");
		r(this, Un, void 0, "f"), t?.controller.abort(new u());
	}
	bindRequest(e, t, n) {
		if (!(t.headers instanceof Headers)) throw new c("X.509 workload identity requires the original workload authorization headers.");
		let r = i(this, F, "m", R).call(this), { token: a } = r, o = e.__security ?? { bearerAuth: !0 }, s = a ? `Bearer ${a}` : null;
		!a && o.adminAPIKeyAuth && n !== null && tr(t.headers, "Authorization") !== null && (s = new Headers({ Authorization: `Bearer ${n}` }).get("Authorization")), r.headers = t.headers, r.authorization = s, this.assertRequest(t);
	}
	adoptRequestHeaders(e) {
		let t = i(this, F, "m", R).call(this), n = t.headers;
		if (!(n instanceof Headers) || !(e.headers instanceof Headers)) throw new c("X.509 workload identity must preserve its issued workload authorization.");
		t.headers = e.headers;
		try {
			this.assertRequest(e);
		} catch (e) {
			throw t.headers = n, e;
		}
	}
	assertRequest(e) {
		let { headers: t } = e;
		if (!(t instanceof Headers)) throw new c("X.509 workload identity must preserve its issued workload authorization.");
		let n = i(this, L, "f").current();
		if (!n || n.headers !== t || n.authorization === void 0 || tr(t, "Authorization") !== n.authorization) throw new c("X.509 workload identity must preserve its issued workload authorization.");
		i(this, F, "m", $n).call(this, t), ar(t);
	}
	fetch() {
		return async (e, t = {}) => {
			let n = Zt(typeof e == "string" || e instanceof URL ? e : e.url);
			lr(t), this.assertRequest(t);
			let r = t.headers;
			if (!(r instanceof Headers)) throw new c("X.509 workload identity must preserve its issued workload authorization.");
			let a = new Headers([...Headers.prototype.entries.call(r)]);
			return ar(a), t.headers = a, t.redirect = "manual", await i(this, L, "f").dispatch(n, t);
		};
	}
};
I = fr, Fn = /* @__PURE__ */ new WeakMap(), In = /* @__PURE__ */ new WeakMap(), Ln = /* @__PURE__ */ new WeakMap(), Rn = /* @__PURE__ */ new WeakMap(), zn = /* @__PURE__ */ new WeakMap(), Bn = /* @__PURE__ */ new WeakMap(), L = /* @__PURE__ */ new WeakMap(), Vn = /* @__PURE__ */ new WeakMap(), Hn = /* @__PURE__ */ new WeakMap(), Un = /* @__PURE__ */ new WeakMap(), Wn = /* @__PURE__ */ new WeakMap(), F = /* @__PURE__ */ new WeakSet(), Gn = async function(e) {
	try {
		await me(e);
	} catch {}
}, Kn = function(e, t) {
	return e && (e.token = t.accessToken, e.tokenGeneration = t.generation), t.accessToken;
}, qn = async function(e, t, n, r, a, o) {
	let s = o ? o.signal : a?.signal;
	if (s?.aborted) throw ir(s);
	if (t.controller.signal.aborted && t.generation !== i(this, Wn, "f")) return await this.getToken(a, o);
	let c = i(this, F, "m", Jn).call(this, e, n, r);
	if (c !== void 0) return c;
	if (e && typeof e == "object" && !(e instanceof C)) {
		let t = jn(e);
		if (t) throw new C(t.status, t.error, t.headers);
	}
	throw e;
}, Jn = function(e, t, n) {
	if (!t || t !== i(this, Hn, "f") || performance.now() >= t.expiresAt || Date.now() >= t.wallExpiresAt || !I.isRetryableFailure(e)) return;
	let r = I.retryHeaders(e), a = r?.get("retry-after-ms"), o = a ? Number(a) : void 0, s = r?.get("retry-after");
	if (s && (o === void 0 || Number.isNaN(o))) {
		let e = Number(s);
		o = Number.isNaN(e) ? Date.parse(s) - Date.now() : e * 1e3;
	}
	let c = o !== void 0 && Number.isFinite(o) && o >= 0 && o <= 6e4 ? Math.max(rr, o) : rr;
	return t.refreshAt = Math.min(t.expiresAt, performance.now() + c), t.wallRefreshAt = Math.min(t.wallExpiresAt, Date.now() + c), i(I, I, "m", Kn).call(I, n, t);
}, Yn = function(e) {
	e.waiters === 0 && i(this, Un, "f") === e && queueMicrotask(() => {
		e.waiters === 0 && i(this, Un, "f") === e && (r(this, Un, void 0, "f"), r(this, Wn, i(this, Wn, "f") + 1, "f"), e.controller.abort(new u()));
	});
}, Xn = function() {
	let e = new AbortController(), t = i(this, Wn, "f"), n = {
		controller: e,
		generation: t,
		waiters: 0,
		promise: i(this, F, "m", Zn).call(this, e, t)
	};
	return r(this, Un, n, "f"), n;
}, Zn = async function(e, t) {
	let n = performance.now(), a = Date.now();
	try {
		let o = await i(this, L, "f").exchange(i(this, Fn, "f"), i(this, In, "f"), e.signal), s = o.expiresIn * 1e3, l = n + s, d = a + s;
		if (performance.now() >= l || Date.now() >= d) throw new c("X.509 workload identity token expired before its exchange completed.");
		if (i(this, Wn, "f") !== t || e.signal.aborted || i(this, Un, "f")?.controller !== e) throw new u();
		return r(this, Wn, i(this, Wn, "f") + 1, "f"), r(this, Hn, {
			accessToken: o.accessToken,
			generation: i(this, Wn, "f"),
			expiresAt: l,
			refreshAt: l - Math.min(i(this, Vn, "f"), s / 2),
			wallExpiresAt: d,
			wallRefreshAt: d - Math.min(i(this, Vn, "f"), s / 2)
		}, "f"), o;
	} finally {
		i(this, Un, "f")?.controller === e && r(this, Un, void 0, "f");
	}
}, Qn = function(e) {
	if (!e) return;
	if (e.organization !== i(this, zn, "f") || e.project !== i(this, Bn, "f")) throw new c("X.509 workload identity cannot override its enrolled organization or project.");
	Zt(e.apiURL);
	let t = P([e.defaultHeaders, e.requestHeaders]);
	if (i(this, zn, "f") !== null && t.nulls.has("openai-organization") || i(this, Bn, "f") !== null && t.nulls.has("openai-project")) throw new c("X.509 workload identity cannot omit its enrolled organization or project.");
	for (let n of t.values.keys()) {
		let r = n.toLowerCase().split("_").join("-");
		if ((r === "openai-organization" || r === "openai-project") && (n !== r || tr(t.values, n) !== (r === "openai-organization" ? e.organization : e.project))) throw new c("X.509 workload identity cannot override its enrolled organization or project.");
		if (Le(r) || r === "host") throw new c("X.509 workload identity cannot use caller-supplied authentication credentials.");
	}
}, R = function() {
	let e = i(this, L, "f").current();
	if (!e || e.owner !== this) throw new c("X.509 workload identity requires an active certificate request scope.");
	return e;
}, $n = function(e) {
	if (tr(e, "OpenAI-Organization") !== i(this, zn, "f") || tr(e, "OpenAI-Project") !== i(this, Bn, "f")) throw new c("X.509 workload identity cannot override its enrolled organization or project.");
	for (let t of Headers.prototype.keys.call(e)) {
		let e = t.toLowerCase().split("_").join("-");
		if ((e === "openai-organization" || e === "openai-project") && t !== e) throw new c("X.509 workload identity cannot override its enrolled organization or project.");
	}
};
//#endregion
//#region node_modules/openai/internal/auth/x509-credential-options.mjs
function pr(e) {
	let { credential: t } = e;
	if (t === void 0) return {
		credential: t,
		options: e
	};
	let n = Nn(t);
	if (!n) throw new c("An X.509 credential must be created by the SDK authentication helper.");
	let r = [
		"apiKey",
		"adminAPIKey",
		"workloadIdentity",
		"x509Transport"
	].filter((t) => e[t] != null);
	if (r.length > 0) throw new c(`The \`credential\` option cannot be combined with ${r.map((e) => `\`${e}\``).join(", ")}.`);
	return {
		credential: t,
		options: {
			...e,
			apiKey: null,
			adminAPIKey: null,
			baseURL: e.baseURL ?? null,
			organization: e.organization ?? null,
			project: e.project ?? null,
			workloadIdentity: n.identity,
			x509Transport: n.transport
		}
	};
}
function mr({ apiKey: e, adminAPIKey: t }) {
	return e != null || t != null;
}
function hr(e, t) {
	let n = e.provider, r = t.credential ?? t.workloadIdentity, i = t.provider ?? (r ? void 0 : n);
	return i !== n && (delete e.baseURL, delete e.organization, delete e.project, delete e.defaultHeaders, delete e.defaultQuery, delete e.fetchOptions, delete e.fetch), i && (delete e.apiKey, delete e.adminAPIKey, delete e.credential, delete e.workloadIdentity, delete e.x509Transport, delete e.baseURL), i;
}
function gr(e, t, n, r) {
	let i = E(t, "workloadIdentity") ? t.workloadIdentity : e.workloadIdentity, a = n !== void 0 && (mr(t) && t.workloadIdentity === void 0 || t.provider !== void 0);
	n !== void 0 && E(t, "workloadIdentity") && delete e.x509Transport;
	let o = n !== void 0 && !a && t.credential === void 0 && !E(t, "workloadIdentity") && !E(t, "x509Transport") ? n : void 0, s = t.credential === void 0 ? o : t.credential, c = s !== void 0 || !a && cr(i);
	return r !== c && (delete e.fetch, delete e.baseURL, delete e.organization, delete e.project, delete e.defaultHeaders, delete e.defaultQuery, delete e.fetchOptions, c ? e.apiKey = null : (delete e.x509Transport, a && delete e.workloadIdentity)), s !== void 0 && (delete e.apiKey, delete e.adminAPIKey, delete e.workloadIdentity, delete e.x509Transport, e.credential = s, t.credential !== void 0 && (delete e.organization, delete e.project, delete e.defaultHeaders, delete e.defaultQuery, delete e.fetchOptions)), {
		credential: s,
		provider: hr(e, t)
	};
}
//#endregion
//#region node_modules/openai/internal/uploads.mjs
var _r = /* @__PURE__ */ Symbol("brand.privateStreamingFile");
function vr(e, t, n) {
	if (typeof t != "string" || !t) throw TypeError("toStreamingFile requires a non-empty file name");
	let r = n?.type;
	return r && Ur(r), {
		[_r]: !0,
		data: e,
		name: t,
		...r ? { type: r } : {}
	};
}
var yr = () => {
	if (typeof File > "u") {
		let { process: e } = globalThis, t = typeof e?.versions?.node == "string" && Number.parseInt(e.versions.node.split("."), 10) < 20;
		throw Error("`File` is not defined as a global, which is required for file uploads." + (t ? " Update to a supported Node.js LTS release, or set `globalThis.File` to `import('node:buffer').File`." : ""));
	}
};
function br(e, t, n) {
	return yr(), new File(e, t ?? "unknown_file", n);
}
function xr(e, t) {
	if (typeof e != "object" || !e) return;
	let n = "name" in e ? e.name : void 0, r = n && String(n) || "filename" in e && e.filename && String(e.filename);
	if (r) return t?.stripFilename === !1 ? Cr(r) : Sr(r);
	let i = "url" in e && e.url && String(e.url);
	if (i) try {
		return Sr(new URL(i).pathname);
	} catch {
		return Sr(i);
	}
	let a = "path" in e && e.path && String(e.path);
	return a ? Sr(a) : void 0;
}
function Sr(e) {
	return e.split(/[\\/]/).pop() || void 0;
}
function Cr(e) {
	let t = e.replace(/\\/g, "/");
	if (t.startsWith("/") || /^[A-Za-z]:/.test(t) || t.split("/").includes("..")) throw TypeError("Upload file name must be a safe relative path without parent directory segments");
	return t;
}
var wr = (e) => typeof e == "object" && !!e && typeof e[Symbol.asyncIterator] == "function", Tr = async (e, t, n) => Fr(e.body) ? Pr(e.body) ? Lr(e, n) : {
	...e,
	body: await kr(e.body, t, n)
} : e, Er = async (e, t, n) => Pr(e.body) ? Lr(e, n) : {
	...e,
	body: await kr(e.body, t, n)
}, Dr = /* @__PURE__ */ new WeakMap();
function Or(e) {
	let t = typeof e == "function" ? e : e.fetch, n = Dr.get(t);
	if (n) return n;
	let r = (async () => {
		try {
			let e;
			if ("Response" in t) e = t.Response;
			else {
				let n = await t("data:,");
				await n.arrayBuffer(), e = n.constructor;
			}
			let n = new FormData();
			return n.toString() !== await new e(n).text();
		} catch {
			return !0;
		}
	})();
	return Dr.set(t, r), r;
}
var kr = async (e, t, n = {}) => {
	if (!await Or(t)) throw TypeError("The provided fetch function does not support file uploads with the current global FormData class.");
	let r = new FormData();
	return await Promise.all(Object.entries(e || {}).map(([e, t]) => qr(r, e, t, n))), r;
}, Ar = (e) => e instanceof Blob, jr = (e) => typeof e == "object" && !!e && "getReader" in e && typeof e.getReader == "function", Mr = (e) => typeof e == "object" && !!e && _r in e, Nr = (e) => typeof e == "object" && !!e && (e instanceof Response || wr(e) || jr(e) || Mr(e) || Ar(e)), Pr = (e) => {
	if (Mr(e) || wr(e) || jr(e)) return !0;
	if (Array.isArray(e)) return e.some(Pr);
	if (e && typeof e == "object" && !Ar(e) && !(e instanceof Response)) {
		for (let t of Object.keys(e)) if (Pr(e[t])) return !0;
	}
	return !1;
}, Fr = (e) => {
	if (Nr(e)) return !0;
	if (Array.isArray(e)) return e.some(Fr);
	if (e && typeof e == "object") {
		for (let t of Object.keys(e)) if (Fr(e[t])) return !0;
	}
	return !1;
}, Ir = (e, t) => {
	let n = [];
	for (let r of e) Nr(r.value) && !t.has(r.value) && t.set(r.value, Vr(r.value, { stripFilenames: !1 })), n.push(r);
	return n;
}, Lr = (e, t = {}) => {
	let n = zr(e.body), r = t.stripFilenames === !1 ? /* @__PURE__ */ new WeakMap() : void 0, i = r ? Ir(n, r) : n, a = `openai-${Math.random().toString(36).slice(2)}`, o = fe(Rr(i, a, t, r));
	return {
		...e,
		body: o,
		headers: P([{ "content-type": `multipart/form-data; boundary=${a}` }, e.headers])
	};
};
async function* Rr(e, t, n, r) {
	for await (let { key: i, value: a } of e) {
		if (Nr(a)) {
			let e = r?.get(a) ?? Vr(a, n), o = Hr(a);
			yield ge(`--${t}\r\n`), yield ge(`Content-Disposition: form-data; name="${Kr(i)}"; filename="${Kr(e)}"\r\nContent-Type: ${o}\r\n\r\n`), yield* Gr(Wr(a));
		} else yield ge(`--${t}\r\n`), yield ge(`Content-Disposition: form-data; name="${Kr(i)}"\r\n\r\n${String(a)}`);
		yield ge("\r\n");
	}
	yield ge(`--${t}--\r\n`);
}
function* zr(e) {
	if (!(!e || typeof e != "object")) for (let [t, n] of Object.entries(e)) yield* Br(t, n);
}
function* Br(e, t) {
	if (t !== void 0) {
		if (t == null) throw TypeError(`Received null for "${e}"; to pass null in FormData, you must use the string 'null'`);
		if (typeof t == "string" || typeof t == "number" || typeof t == "boolean" || Nr(t)) yield {
			key: e,
			value: t
		};
		else if (Array.isArray(t)) for (let n of t) yield* Br(e + "[]", n);
		else if (typeof t == "object") for (let [n, r] of Object.entries(t)) yield* Br(`${e}[${n}]`, r);
		else throw TypeError(`Invalid value given to form, expected a string, number, boolean, object, Array, File or Blob but got ${t} instead`);
	}
}
function Vr(e, t) {
	if (Mr(e)) {
		let { name: n } = e;
		if (typeof n != "string" || !n) throw TypeError("Streaming upload file name must be a non-empty string");
		return t.stripFilenames === !1 ? Cr(n) : Sr(n) ?? "unknown_file";
	}
	return xr(e, { stripFilename: t.stripFilenames }) ?? "unknown_file";
}
function Hr(e) {
	let t;
	return Mr(e) || Ar(e) ? {type: t} = e : e instanceof Response && (t = e.headers.get("content-type") ?? void 0), Ur(t || "application/octet-stream");
}
function Ur(e) {
	if (typeof e != "string") throw TypeError("Streaming upload content type must be a string");
	for (let t = 0; t < e.length; t += 1) {
		let n = e.codePointAt(t) ?? 0;
		if (n <= 31 || n === 127) throw TypeError("Streaming upload content type must not contain control characters");
	}
	return e;
}
function Wr(e) {
	return Mr(e) ? e.data : e;
}
async function* Gr(e) {
	if (typeof e == "string") yield ge(e);
	else if (ArrayBuffer.isView(e)) yield new Uint8Array(e.buffer, e.byteOffset, e.byteLength);
	else if (e instanceof ArrayBuffer) yield new Uint8Array(e);
	else if (e instanceof Response) yield* Gr(e.body || await e.blob());
	else if (e instanceof Blob) typeof e.stream == "function" ? yield* Gr(e.stream()) : yield new Uint8Array(await e.arrayBuffer());
	else if (jr(e)) for await (let t of pe(e)) yield* Gr(t);
	else if (wr(e)) for await (let t of e) yield* Gr(t);
	else throw TypeError(`Invalid streaming file chunk: ${String(e)}`);
}
function Kr(e) {
	return Array.from(e, (e) => {
		let t = e.codePointAt(0) ?? 0;
		return t <= 31 || t === 127 || e === "\"" || e === "\\" ? encodeURIComponent(e) : e;
	}).join("");
}
var qr = async (e, t, n, r) => {
	if (n !== void 0) {
		if (n == null) throw TypeError(`Received null for "${t}"; to pass null in FormData, you must use the string 'null'`);
		if (typeof n == "string" || typeof n == "number" || typeof n == "boolean") e.append(t, String(n));
		else if (n instanceof Response) {
			let i = await n.blob();
			e.append(t, br([i], xr(n, { stripFilename: r.stripFilenames }), { type: i.type }));
		} else if (wr(n)) e.append(t, br([await new Response(fe(n)).blob()], xr(n, { stripFilename: r.stripFilenames })));
		else if (Ar(n)) {
			let i = xr(n, { stripFilename: r.stripFilenames });
			i === void 0 ? e.append(t, n) : e.append(t, n, i);
		} else if (Array.isArray(n)) {
			let i = await Promise.all(n.map(async (e) => {
				let n = new FormData();
				return await qr(n, t + "[]", e, r), n;
			}));
			for (let t of i) if (t) for (let [n, r] of t.entries()) e.append(n, r);
		} else if (typeof n == "object") await Promise.all(Object.entries(n).map(([n, i]) => qr(e, `${t}[${n}]`, i, r)));
		else throw TypeError(`Invalid value given to form, expected a string, number, boolean, object, Array, File or Blob but got ${n} instead`);
	}
}, Jr = (e) => typeof e == "object" && !!e && typeof e.size == "number" && typeof e.type == "string" && typeof e.text == "function" && typeof e.slice == "function" && typeof e.arrayBuffer == "function", Yr = (e) => typeof e == "object" && !!e && typeof e.name == "string" && typeof e.lastModified == "number" && Jr(e), Xr = (e) => typeof e == "object" && !!e && typeof e.url == "string" && typeof e.blob == "function", Zr = (e, t) => t?.type != null && t.type !== e.type || t?.lastModified != null && t.lastModified !== e.lastModified || t?.endings != null, Qr = (e, t, n) => (t == null || t === e.name) && !Zr(e, n);
async function $r(e, t, n) {
	if (yr(), e = await e, Yr(e)) {
		let r = {
			...n,
			type: n?.type ?? e.type,
			lastModified: n?.lastModified ?? e.lastModified
		};
		return e instanceof File ? Qr(e, t, n) ? e : br([e], t ?? e.name, r) : br([await e.arrayBuffer()], t ?? e.name, r);
	}
	if (Xr(e)) {
		let r = await e.blob();
		t ||= xr(e);
		let i = n?.type === void 0 && r.type ? {
			...n,
			type: r.type
		} : n;
		return br(await ei(r), t, i);
	}
	let r = await ei(e);
	if (t ||= xr(e), n?.type === void 0) {
		let e = r.find((e) => typeof e == "object" && "type" in e && !!e.type);
		e && (n = {
			...n,
			type: e.type
		});
	}
	return br(r, t, n);
}
async function ei(e) {
	let t = [];
	if (typeof e == "string" || ArrayBuffer.isView(e) || e instanceof ArrayBuffer) t.push(e);
	else if (Jr(e)) t.push(e instanceof Blob ? e : new Blob([await e.arrayBuffer()], { type: e.type }));
	else if (wr(e)) for await (let n of e) t.push(...await ei(n));
	else {
		let t = e?.constructor?.name;
		throw Error(`Unexpected data type: ${typeof e}${t ? `; constructor: ${t}` : ""}${ti(e)}`);
	}
	return t;
}
function ti(e) {
	return typeof e != "object" || !e ? "" : `; props: [${Object.getOwnPropertyNames(e).map((e) => `"${e}"`).join(", ")}]`;
}
//#endregion
//#region node_modules/openai/core/resource.mjs
var z = class {
	constructor(e) {
		this._client = e;
	}
};
//#endregion
//#region node_modules/openai/internal/utils/path.mjs
function ni(e) {
	return e.replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@]+/g, encodeURIComponent);
}
var ri = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.create(null)), B = /* @__PURE__ */ ((e = ni) => function(t, ...n) {
	if (t.length === 1) return t[0];
	let r = !1, i = [], a = "";
	for (let o = 0; o < t.length; o += 1) if (o in t) {
		let s = t[o];
		/[?#]/.test(s) && (r = !0);
		let c = n[o], l = (r ? encodeURIComponent : e)("" + c);
		o !== n.length && (c == null || typeof c == "object" && c.toString === Object.getPrototypeOf(Object.getPrototypeOf(c.hasOwnProperty ?? ri) ?? ri)?.toString) && (l = c + "", i.push({
			start: a.length + s.length,
			length: l.length,
			error: `Value of type ${Object.prototype.toString.call(c).slice(8, -1)} is not a valid path parameter`
		})), a += s + (o === n.length ? "" : l);
	}
	let o = a.split(/[?#]/, 1)[0], s = /(?<=^|\/)(?:\.|%2e){1,2}(?=\/|$)/gi, l;
	for (; (l = s.exec(o)) !== null;) i.push({
		start: l.index,
		length: l[0].length,
		error: `Value "${l[0]}" can't be safely passed as a path parameter`
	});
	if (i.sort((e, t) => e.start - t.start), i.length > 0) {
		let e = 0, t = "";
		for (let n of i) {
			let r = " ".repeat(n.start - e), i = "^".repeat(n.length);
			e = n.start + n.length, t += r + i;
		}
		throw new c(`Path parameters result in path with invalid segments:\n${i.map((e) => e.error).join("\n")}\n${a}\n${t}`);
	}
	return a;
})(ni), ii = class extends z {
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/chat/completions/${e}/messages`, M, {
			query: t,
			...n,
			__security: { bearerAuth: !0 }
		});
	}
};
//#endregion
//#region node_modules/openai/lib/parser.mjs
function ai(e) {
	return e !== void 0 && "function" in e && e.function !== void 0;
}
function oi(e) {
	return e?.$brand === "auto-parseable-response-format";
}
function si(e) {
	return oi(e) || e?.type === "json_schema";
}
function ci(e, t) {
	if (!si(e)) return null;
	if (typeof e == "object" && e && "$parseRaw" in e && typeof e.$parseRaw == "function") return e.$parseRaw(t);
	try {
		return JSON.parse(t);
	} catch (e) {
		throw e instanceof SyntaxError ? SyntaxError("Error reading response: invalid structured output JSON.") : e;
	}
}
function li(e) {
	return e?.$brand === "auto-parseable-tool";
}
function ui(e, t) {
	return !t || !hi(t) ? {
		...e,
		choices: e.choices.map((e) => ({
			...e,
			message: {
				...e.message,
				parsed: null,
				...e.message.tool_calls ? { tool_calls: e.message.tool_calls } : void 0
			}
		}))
	} : di(e, t);
}
function di(e, t) {
	let n = e.choices.map((e) => {
		if (e.finish_reason === "length") throw new x();
		if (e.finish_reason === "content_filter") throw new ee();
		return {
			...e,
			message: {
				...e.message,
				...e.message.tool_calls ? { tool_calls: e.message.tool_calls?.map((e) => pi(t, e)) ?? void 0 } : void 0,
				parsed: e.message.content !== null && e.message.content !== void 0 && !e.message.refusal && (e.message.content !== "" || !e.message.tool_calls?.length && !e.message.function_call) ? fi(t, e.message.content) : null
			}
		};
	});
	return {
		...e,
		choices: n
	};
}
function fi(e, t) {
	return ci(e.response_format, t);
}
function pi(e, t) {
	if (t.type === "custom") return t;
	if (t.type !== "function") {
		let e = t.type;
		throw new c(`Currently only \`function\` and \`custom\` tool calls are supported; Received \`${e}\``);
	}
	let n = e.tools?.find((e) => ai(e) && e.function?.name === t.function.name), r = null;
	return li(n) ? r = n.$parseRaw(t.function.arguments) : n?.function.strict && (r = ci({
		type: "json_schema",
		$parseRaw: void 0
	}, t.function.arguments)), {
		...t,
		function: {
			...t.function,
			parsed_arguments: r
		}
	};
}
function mi(e, t) {
	if (!e || !("tools" in e) || !e.tools || t.type !== "function") return !1;
	let n = e.tools?.find((e) => ai(e) && e.function?.name === t.function?.name);
	return ai(n) && (li(n) || n?.function.strict || !1);
}
function hi(e) {
	return si(e.response_format) ? !0 : e.tools?.some((e) => li(e) || e.type === "function" && e.function.strict === !0) ?? !1;
}
function gi(e) {
	for (let t of e ?? []) if (t.type !== "custom") {
		if (t.type !== "function") {
			let e = t.type;
			throw new c(`Currently only \`function\` and \`custom\` tool types are supported; Received \`${e}\``);
		}
		if (t.function.strict !== !0) throw new c(`The \`${t.function.name}\` tool is not marked with \`strict: true\`. Only strict function tools can be auto-parsed`);
	}
}
//#endregion
//#region node_modules/openai/lib/chatCompletionUtils.mjs
var _i = (e) => e?.role === "assistant", vi = (e) => e?.role === "tool", yi, bi, xi, Si, Ci, wi, Ti, Ei, Di, Oi, ki, Ai, ji, Mi, Ni, Pi, Fi, Ii, Li, Ri, zi, Bi, Vi = 4096, Hi = 8388608, Ui = 4096, Wi = 256, Gi = JSON.stringify, Ki = JSON.parse, qi = /* @__PURE__ */ new WeakSet(), Ji = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), "buffer")?.get, Yi = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), "length")?.get, Xi = Object.getOwnPropertyDescriptor(DataView.prototype, "buffer")?.get, Zi = Object.getOwnPropertyDescriptor(Symbol.prototype, "description")?.get, Qi = Date.prototype.getTime, $i = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "byteLength")?.get, ea = typeof SharedArrayBuffer == "function" ? Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype, "byteLength")?.get : void 0, ta = Object.getOwnPropertyDescriptor(/* @__PURE__ */ Error("native stack descriptor"), "stack"), na = Function.prototype.toString, ra = Object.prototype.toString, ia = Object.getOwnPropertyDescriptor(Error, "isError"), aa = ia && "value" in ia && typeof ia.value == "function" ? ia.value : void 0, oa = na.call(Error), sa = na.call(Date), ca = na.call(Function), la = /* @__PURE__ */ new Set([
	d.prototype,
	f.prototype,
	l.prototype,
	c.prototype,
	u.prototype,
	m.prototype,
	p.prototype,
	_.prototype,
	ee.prototype,
	b.prototype,
	S.prototype,
	x.prototype,
	g.prototype,
	C.prototype,
	h.prototype,
	y.prototype,
	te.prototype,
	v.prototype
]), ua = /* @__PURE__ */ new Set(), da = /* @__PURE__ */ new Map(), fa = /* @__PURE__ */ new WeakMap();
function pa() {
	if (!(typeof process > "u")) try {
		let e = Object.getOwnPropertyDescriptor(process, "getBuiltinModule");
		if (!e || !("value" in e) || typeof e.value != "function") return;
		let t = Reflect.apply(e.value, process, ["node:util"]);
		if (typeof t != "object" || !t) return;
		let n = Object.getOwnPropertyDescriptor(t, "types");
		if (!n || !("value" in n) || typeof n.value != "object" || n.value === null) return;
		let r = Object.getOwnPropertyDescriptor(n.value, "isProxy");
		return !r || !("value" in r) || typeof r.value != "function" ? void 0 : r.value;
	} catch {
		return;
	}
}
var ma = pa();
function ha(e) {
	if (typeof e != "function") return;
	let t = Object.getOwnPropertyDescriptor(e, "prototype");
	if (!t || !("value" in t) || typeof t.value != "object" && typeof t.value != "function") return;
	la.add(t.value);
	let n = na.call(e);
	if (/^function [A-Za-z_$][\w$]*\(\) \{ \[native code\] \}$/u.test(n) && t.configurable === !1 && t.writable === !1) {
		ua.add(n);
		let e = /* @__PURE__ */ new Map();
		for (let n of Reflect.ownKeys(t.value)) {
			let r = Object.getOwnPropertyDescriptor(t.value, n);
			r && e.set(n, r);
		}
		da.set(n, e);
	}
}
for (let e of [
	Object,
	Function,
	Array,
	Date,
	Map,
	Set,
	ArrayBuffer,
	DataView,
	Error,
	EvalError,
	RangeError,
	ReferenceError,
	SyntaxError,
	TypeError,
	URIError,
	Uint8Array,
	Uint8ClampedArray,
	Uint16Array,
	Uint32Array,
	Int8Array,
	Int16Array,
	Int32Array,
	Float32Array,
	Float64Array
]) ha(e);
for (let e of [
	"SharedArrayBuffer",
	"AggregateError",
	"Float16Array",
	"BigInt64Array",
	"BigUint64Array",
	"Blob",
	"File",
	"Headers"
]) {
	let t = Object.getOwnPropertyDescriptor(globalThis, e);
	t && "value" in t && ha(t.value);
}
var ga = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), "constructor");
ga && "value" in ga && ha(ga.value), typeof Buffer == "function" && ha(Buffer);
var _a = (() => {
	if (typeof Blob == "function") try {
		let e = new Blob([]);
		for (let t of Object.getOwnPropertySymbols(e)) {
			let n = Object.getOwnPropertyDescriptor(e, t);
			if (n && "value" in n && typeof n.value == "object" && n.value) return Object.getPrototypeOf(n.value);
		}
	} catch {
		return;
	}
})(), va = Map.prototype.entries, ya = Set.prototype.values, ba = typeof Headers == "function" ? Object.getOwnPropertyDescriptor(Headers.prototype, "entries") : void 0, xa = ba && "value" in ba && typeof ba.value == "function" ? ba.value : void 0, Sa = /* @__PURE__ */ new Set([
	"ArrayBuffer",
	"SharedArrayBuffer",
	"Blob",
	"File",
	"Map",
	"Date",
	"Set",
	"Headers"
]);
function Ca(e) {
	let t = Object.getOwnPropertyDescriptor(e, "constructor");
	if (!t || !("value" in t) || typeof t.value != "function") return;
	let n = t.value, r = na.call(n), i = da.get(r);
	if (!ua.has(r) || !i) return;
	let a = Object.getOwnPropertyDescriptor(n, "prototype");
	if (!(!a || !("value" in a) || a.value !== e || a.configurable !== !1 || a.writable !== !1)) return {
		constructor: n,
		descriptors: i,
		functionPrototype: Object.getPrototypeOf(n)
	};
}
function wa(e) {
	return la.has(e) || Ca(e) !== void 0;
}
function Ta(e, t, n) {
	if (t === void 0) return e === void 0;
	if (typeof e != "function" || typeof t != "function") return !1;
	let r = na.call(t);
	if (na.call(e) !== r) return !1;
	let i = Object.getPrototypeOf(e);
	if (i === n) return !0;
	if (!/^function [A-Za-z_$][\w$]*\(\) \{ \[native code\] \}$/u.test(r)) return !1;
	let a = Ca(i);
	return a !== void 0 && na.call(a.constructor) === ca;
}
function Ea(e, t, n) {
	return !t || e.configurable !== t.configurable || e.enumerable !== t.enumerable || "value" in e != "value" in t ? !1 : "value" in e && "value" in t ? e.writable === t.writable ? typeof t.value == "function" ? Ta(e.value, t.value, n) : t.value !== null && typeof t.value == "object" ? !1 : Object.is(e.value, t.value) : !1 : Ta(e.get, t.get, n) && Ta(e.set, t.set, n);
}
function Da(e) {
	if (aa) return aa.call(Error, e);
	let t = e;
	for (let e = 0; t !== null && e < Wi; e += 1) {
		if (Object.getOwnPropertyDescriptor(t, Symbol.toStringTag)) return !1;
		t = Object.getPrototypeOf(t);
	}
	return t === null && ra.call(e) === "[object Error]";
}
function Oa(e, t) {
	if (typeof t.get != "function" || typeof t.set != "function") return;
	let n = Object.getPrototypeOf(e);
	for (let e = 0; n !== null && e < Wi; e += 1) {
		let e = Object.getOwnPropertyDescriptor(n, "constructor");
		if (e && "value" in e && typeof e.value == "function") {
			let r = e.value;
			if (na.call(r) === oa && wa(n)) {
				let e = Object.getPrototypeOf(r);
				return Object.getPrototypeOf(t.get) === e && Object.getPrototypeOf(t.set) === e ? {
					constructor: r,
					prototype: n
				} : void 0;
			}
		}
		n = Object.getPrototypeOf(n);
	}
}
function ka(e, t) {
	if (!Da(e)) return !1;
	if (ta && !("value" in ta) && typeof ta.get == "function" && Object.prototype.isPrototypeOf.call(Error.prototype, e) && t.get === ta.get && t.set === ta.set) return !0;
	let n = Oa(e, t);
	if (!n) return !1;
	let r = fa.get(n.prototype);
	if (!r) {
		let e = Reflect.construct(n.constructor, []);
		if (typeof e != "object" || !e || !Da(e) || Object.getPrototypeOf(e) !== n.prototype || (r = Object.getOwnPropertyDescriptor(e, "stack"), !r || "value" in r || typeof r.get != "function" || typeof r.set != "function")) return !1;
		fa.set(n.prototype, r);
	}
	return t.get === r.get && t.set === r.set;
}
function Aa() {
	let e = [], t = 0;
	return {
		get length() {
			return e.length - t;
		},
		enqueue(t) {
			e.push(t);
		},
		dequeue() {
			if (t === e.length) return;
			let n = e[t];
			return e[t] = void 0, t += 1, t === e.length ? (e = [], t = 0) : t >= 1024 && t * 2 >= e.length && (e = e.slice(t), t = 0), n;
		},
		clear() {
			e = [], t = 0;
		}
	};
}
function ja(e) {
	let t = Object.getPrototypeOf(e);
	for (let e = 0; t !== null && e < Wi; e += 1) {
		if (t === Date.prototype) return "Date";
		if (!la.has(t)) {
			let e = Object.getOwnPropertyDescriptor(t, "constructor");
			if (e && "value" in e && typeof e.value == "function" && na.call(e.value) === sa && Ca(t)) return "Date";
		}
		let e = Object.getOwnPropertyDescriptor(t, Symbol.toStringTag);
		if (e && "value" in e && typeof e.value == "string" && Sa.has(e.value)) return e.value;
		t = Object.getPrototypeOf(t);
	}
}
function Ma(e, t, n) {
	if (ArrayBuffer.isView(e)) {
		let r, i = "typed-array";
		try {
			r = Ji?.call(e);
		} catch {
			i = "data-view", r = Xi?.call(e);
		}
		return typeof r != "object" || !r ? {
			bytes: Infinity,
			kind: i
		} : (t(r, n + 1), {
			bytes: 0,
			kind: i
		});
	}
	let r = ja(e);
	if (!r) return;
	let i;
	switch (r) {
		case "ArrayBuffer":
			i = $i;
			break;
		case "SharedArrayBuffer":
			i = ea;
			break;
		case "Blob":
		case "File": return {
			bytes: Infinity,
			kind: "blob"
		};
		case "Map": return {
			bytes: 0,
			kind: "map"
		};
		case "Date": return Reflect.apply(Qi, e, []), {
			bytes: 8,
			kind: "date"
		};
		case "Set": return {
			bytes: 0,
			kind: "set"
		};
		case "Headers": return {
			bytes: 0,
			kind: "headers"
		};
		default: return;
	}
	let a = i?.call(e);
	return {
		bytes: typeof a == "number" && Number.isSafeInteger(a) && a >= 0 ? a : Infinity,
		kind: "buffer"
	};
}
function Na(e, t, n) {
	if (t === "map") {
		for (let [t, r] of va.call(e)) if (!n(t, 8) || !n(r, 8)) return !1;
	}
	if (t === "set") {
		for (let t of ya.call(e)) if (!n(t, 8)) return !1;
	}
	if (t === "headers") {
		if (!xa) return !1;
		for (let [t, r] of xa.call(e)) if (!n(t, 8) || !n(r, 8)) return !1;
	}
	return !0;
}
function Pa(e, t, n) {
	if (Array.isArray(e)) {
		let t = Object.getOwnPropertyDescriptor(e, "length"), r = t && "value" in t ? t.value : void 0;
		if (typeof r != "number" || !Number.isSafeInteger(r) || r < 0 || r > Math.floor(n / 16)) return;
	}
	if (t !== "typed-array") return Reflect.ownKeys(e);
	let r = Yi?.call(e);
	if (!(typeof r != "number" || !Number.isSafeInteger(r) || r < 0 || r > Ui)) return Reflect.ownKeys(e).filter((e) => {
		if (typeof e != "string") return !0;
		let t = Number(e);
		return !Number.isInteger(t) || t < 0 || t >= r || String(t) !== e;
	});
}
function Fa(e, t, n, r, i, a) {
	let o = Pa(e, t, r());
	if (o === void 0) return !1;
	for (let r of o) {
		if (!i(typeof r == "string" ? r.length * 2 + 8 : 8)) return !1;
		typeof r == "symbol" && a(r, n + 1);
		let o = Object.getOwnPropertyDescriptor(e, r);
		if (!o) return !1;
		if (!("value" in o)) {
			if (r === "stack" && ka(e, o)) continue;
			return !1;
		}
		a(o.value, n + 1, t === "blob");
	}
	return !0;
}
function Ia(e, t, n, r, i, a, o, s) {
	let c = Object.getPrototypeOf(e);
	for (let e = t + 1; c !== null; e += 1) {
		if (e >= Wi) return !1;
		if (la.has(c) || n && c === _a) return !0;
		if (r.has(c)) return o(c, e), i() >= 0;
		r.add(c);
		let t = c;
		if (!s(t, () => {
			if (!a(16)) return !1;
			let n = Ca(t);
			if (!n) return Fa(t, void 0, e, i, a, o);
			for (let r of Reflect.ownKeys(t)) {
				let i = Object.getOwnPropertyDescriptor(t, r);
				if (!i) return !1;
				if (!Ea(i, n.descriptors.get(r), n.functionPrototype)) {
					if (!a(typeof r == "string" ? r.length * 2 + 8 : 8) || !("value" in i)) return !1;
					typeof r == "symbol" && o(r, e + 1), o(i.value, e + 1);
				}
			}
			return i() >= 0;
		})) return !1;
		c = Object.getPrototypeOf(t);
	}
	return !0;
}
var La = 32, Ra = 32, za = 8, Ba = 16, Va = 131072;
function Ha(e, t) {
	let n = 0, r = 0, i = /* @__PURE__ */ new WeakSet(), a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Map(), c, l = () => t - n, u = (e) => !Number.isSafeInteger(e) || e < 0 ? (n = t + 1, !1) : (n += e, c ? c.bytes += e : r += e, n <= t), d = (e) => {
		c ? c.edges.add(e) : o.add(e);
	}, f = (e, t) => {
		d(e);
		let n = {
			bytes: 0,
			edges: /* @__PURE__ */ new Set()
		};
		s.set(e, n);
		let r = c;
		c = n;
		try {
			return t();
		} finally {
			c = r;
		}
	}, p = (e) => {
		if (a.has(e)) {
			d(e), u(8);
			return;
		}
		a.add(e), f(e, () => {
			if (!Zi) return !1;
			let t = Reflect.apply(Zi, e, []);
			return u(8 + (t?.length ?? 0) * 2);
		}) || (n = t + 1);
	}, m = (e, r, a = !1) => {
		if (!(n > t)) {
			if (typeof e == "string") {
				u(e.length * 2);
				return;
			}
			if (typeof e == "symbol") {
				p(e);
				return;
			}
			if (typeof e == "function") {
				n = t + 1;
				return;
			}
			if (typeof e != "object" || !e) {
				u(8);
				return;
			}
			if (ma?.(e)) {
				n = t + 1;
				return;
			}
			if (r >= Wi) {
				n = t + 1;
				return;
			}
			if (i.has(e)) {
				d(e), u(8);
				return;
			}
			i.add(e), f(e, () => {
				if (!u(16)) return !1;
				let o = Ma(e, m, r);
				return !Ia(e, r, a, i, l, u, m, f) || o !== void 0 && !u(o.bytes) || !Na(e, o?.kind, (e, i) => u(i) ? (m(e, r + 1), n <= t) : !1) ? !1 : Fa(e, o?.kind, r, l, u, m);
			}) || (n = t + 1);
		}
	};
	try {
		m(e, 0);
	} catch {
		return;
	}
	return n <= t ? {
		scalarBytes: r,
		roots: o,
		nodes: s
	} : void 0;
}
function Ua(e, t) {
	if (e.size !== t.size) return !1;
	for (let n of e) if (!t.has(n)) return !1;
	return !0;
}
function Wa(e, t) {
	return e.bytes + Ra + e.edges.size * za + t * Ba;
}
function Ga(e) {
	return La + e.scalarBytes + e.roots.size * za;
}
function Ka(e, t, n, r) {
	let i = /* @__PURE__ */ new Set(), a = [...e];
	for (; a.length;) {
		if (--r.remaining, r.remaining < 0) return;
		let e = a.pop();
		if (i.has(e)) continue;
		let o = t.get(e) ?? n.get(e);
		if (!o) return;
		i.add(e);
		for (let e of o.edges) a.push(e);
	}
	return i;
}
function qa(e, t, n, r, i) {
	let a = r.get(e);
	if (a) return i && (a.node = i), a;
	let o = i ?? t.nodes.get(e) ?? n.get(e);
	if (!o) return;
	let s = {
		node: o,
		ownerDelta: 0
	};
	return r.set(e, s), s;
}
function Ja(e, t, n, r, i) {
	let a = /* @__PURE__ */ new Set([e]);
	for (let [e, o] of t.nodes) {
		if (--i.remaining, i.remaining < 0) return;
		let s = n.get(e);
		if (!s) continue;
		let c = !Ua(s.edges, o.edges);
		if ((s.bytes !== o.bytes || c) && qa(e, t, n, r, o), c) for (let e of s.owners) {
			if (--i.remaining, i.remaining < 0) return;
			a.add(e);
		}
	}
	return a;
}
function Ya(e, t, n, r, i, a) {
	for (let o of e.identities) {
		if (--a.remaining, a.remaining < 0) return !1;
		if (!t.has(o)) {
			let e = qa(o, n, r, i);
			if (!e) return !1;
			--e.ownerDelta;
		}
	}
	for (let o of t) {
		if (--a.remaining, a.remaining < 0) return !1;
		if (!e.identities.has(o)) {
			let e = qa(o, n, r, i);
			if (!e) return !1;
			e.ownerDelta += 1;
		}
	}
	return !0;
}
function Xa(e, t, n, r, i, a) {
	let o = /* @__PURE__ */ new Map();
	for (let s of n) {
		let n = Ka(s === e ? t.roots : s.roots, t.nodes, r, a);
		if (!n || !Ya(s, n, t, r, i, a)) return;
		o.set(s, n);
	}
	return o;
}
function Za(e, t, n, r, i, a) {
	let o = e - (r ? 0 : Ga(t)) + Ga(n);
	for (let [e, t] of i) {
		let n = a.get(e), r = (n?.owners.size ?? 0) + t.ownerDelta;
		if (r < 0) return;
		n && (o -= Wa(n, n.owners.size)), r && (o += Wa(t.node, r));
	}
	return Number.isSafeInteger(o) && o >= 0 && o <= Hi ? o : void 0;
}
function Qa(e, t, n) {
	for (let [n, r] of t) {
		let t = e.get(n);
		(t?.owners.size ?? 0) + r.ownerDelta && (t ? (t.bytes = r.node.bytes, t.edges = r.node.edges) : e.set(n, {
			bytes: r.node.bytes,
			edges: r.node.edges,
			owners: /* @__PURE__ */ new Set()
		}));
	}
	for (let [t, r] of n) {
		for (let n of t.identities) r.has(n) || e.get(n)?.owners.delete(t);
		for (let n of r) t.identities.has(n) || e.get(n).owners.add(t);
		t.identities = r;
	}
	for (let n of t.keys()) e.get(n)?.owners.size === 0 && e.delete(n);
}
function $a() {
	let e = /* @__PURE__ */ new Map(), t = 0, n = (n, r, i) => {
		let a = { remaining: Va }, o = /* @__PURE__ */ new Map(), s = Ja(n, r, e, o, a);
		if (!s) return !1;
		let c = Xa(n, r, s, e, o, a);
		if (!c) return !1;
		let l = Za(t, n, r, i, o, e);
		return l !== void 0 && (Qa(e, o, c), n.scalarBytes = r.scalarBytes, n.roots = r.roots, t = l, !0);
	};
	return {
		retain(e) {
			let t = {
				scalarBytes: 0,
				roots: /* @__PURE__ */ new Set(),
				identities: /* @__PURE__ */ new Set()
			};
			return n(t, e, !0) ? t : void 0;
		},
		refresh(e, t) {
			return n(e, t, !1);
		},
		release: (n) => {
			t -= Ga(n);
			for (let r of n.identities) {
				let i = e.get(r);
				i?.owners.delete(n) && (t -= Ba, i.owners.size === 0 && (t -= Wa(i, 0), e.delete(r)));
			}
			n.identities.clear();
		},
		clear() {
			e.clear(), t = 0;
		}
	};
}
var eo = class {
	constructor() {
		yi.add(this), this.controller = new AbortController(), bi.set(this, void 0), xi.set(this, () => void 0), Si.set(this, () => void 0), Ci.set(this, void 0), wi.set(this, () => void 0), Ti.set(this, () => void 0), Ei.set(this, Object.create(null)), Di.set(this, []), Oi.set(this, /* @__PURE__ */ new WeakMap()), ki.set(this, /* @__PURE__ */ new Set()), Ai.set(this, /* @__PURE__ */ new Set()), ji.set(this, 0), Mi.set(this, !1), Ni.set(this, !1), Pi.set(this, !1), Fi.set(this, !1), r(this, bi, new Promise((e, t) => {
			r(this, xi, e, "f"), r(this, Si, t, "f");
		}), "f"), r(this, Ci, new Promise((e, t) => {
			r(this, wi, e, "f"), r(this, Ti, t, "f");
		}), "f"), i(this, bi, "f").catch(() => void 0), i(this, Ci, "f").catch(() => void 0);
	}
	_run(e) {
		setTimeout(() => {
			let t = !1;
			Promise.resolve().then(e).catch((e) => {
				t = !0, i(this, yi, "m", Bi).call(this, e);
			}).then(() => {
				if (!t) {
					try {
						this._emitFinal();
					} catch (e) {
						i(this, yi, "m", Bi).call(this, e);
						return;
					}
					this._emit("end");
				}
			});
		}, 0);
	}
	_connected() {
		this.ended || (i(this, xi, "f").call(this), this._emit("connect"));
	}
	get ended() {
		return i(this, Mi, "f");
	}
	get errored() {
		return i(this, Ni, "f");
	}
	get aborted() {
		return i(this, Pi, "f");
	}
	abort() {
		this.controller.abort();
	}
	_listenForAbort(e) {
		if (!e || this.ended) return;
		if (e.aborted) {
			this.controller.abort();
			return;
		}
		let t = () => this.controller.abort();
		e.addEventListener("abort", t, { once: !0 }), i(this, Di, "f").push({
			signal: e,
			listener: t
		});
	}
	on(e, t) {
		var n;
		return ((n = i(this, Ei, "f"))[e] || (n[e] = [])).push({ listener: t }), this;
	}
	off(e, t) {
		let n = i(this, Ei, "f")[e];
		if (!n) return this;
		let r = i(this, Oi, "f").get(t);
		if (r?.event === e && !r.registration.removed && !r.registration.detached) return i(this, yi, "m", Ri).call(this, e, r.registration), this;
		let a = n.findIndex((e) => !e.removed && e.listener === t);
		return a !== -1 && n.splice(a, 1), this;
	}
	once(e, t) {
		var n;
		return ((n = i(this, Ei, "f"))[e] || (n[e] = [])).push({
			listener: t,
			once: !0
		}), this;
	}
	emitted(e) {
		return new Promise((t, n) => {
			r(this, Fi, !0, "f");
			let a = (t) => {
				this.off(e, o), n(t);
			}, o = (...n) => {
				e !== "error" && this.off("error", a), t(n.length > 1 ? n : n[0]);
			};
			e !== "error" && i(this, yi, "m", Li).call(this, "error", a), i(this, yi, "m", Li).call(this, e, o);
		});
	}
	events(e) {
		return this._createIterator((t) => {
			let n = (...e) => {
				qi.add(e);
				try {
					t(e);
				} finally {
					qi.delete(e);
				}
			};
			return this.on(e, n), () => this.off(e, n);
		}, {
			rejectOnError: e !== "error",
			rejectOnAbort: e !== "abort"
		});
	}
	_createIterator(e, { rejectOnError: t = !0, rejectOnAbort: n = !0, onReturn: r } = {}) {
		let a = Aa(), o = Aa(), s = Aa(), l = $a(), u = this.ended, d, f = !1, p = () => void 0, m = () => ({
			value: void 0,
			done: !0
		}), h = () => {
			for (; s.length;) s.dequeue().resolve(m());
		}, g = () => {
			!d || f || !s.length || (f = !0, s.dequeue().reject(d));
		}, _ = () => {
			p(), this.off("end", S), t && this.off("error", ee), n && this.off("abort", ee);
		}, v = (e) => {
			e.active = !1, e.check &&= (i(this, Ai, "f").delete(e.check), void 0);
		}, y = (e = !1) => {
			if (e) {
				for (; o.length;) v(o.dequeue());
				a.clear(), l.clear();
			}
			let t = new c(`Event stream iterator buffer limit exceeded (${Vi} events or ${Hi} bytes); consume events as they arrive.`);
			try {
				i(this, yi, "m", Bi).call(this, t);
			} finally {
				this.controller.abort();
			}
			return t;
		}, b = (e, t) => {
			if (!t.active || i(this, Mi, "f")) return;
			let n = Ha(e, Hi);
			(!n || !l.refresh(t.retention, n)) && y(!0);
		}, x = (e) => {
			if (u) return;
			let t = s.dequeue();
			if (t) t.resolve({
				value: e,
				done: !1
			});
			else {
				if (a.length >= Vi) {
					y();
					return;
				}
				let t = Ha(e, Hi), n = t && l.retain(t);
				if (!n) {
					y();
					return;
				}
				if (typeof e == "object" && e && qi.has(e)) {
					let t = e;
					for (let e = 0; e < t.length; e += 1) {
						let n = t[e];
						typeof n == "string" && (t[e] = Ki(Gi(n)));
					}
				}
				let r = {
					retention: n,
					active: !0,
					check: void 0
				};
				a.enqueue(e), o.enqueue(r);
				let s = () => {
					r.check = void 0, b(e, r);
				};
				r.check = s, i(this, Ai, "f").add(s);
			}
		}, ee = (e) => {
			d = e, a.length || g();
		}, S = () => {
			u = !0, _(), a.length || (g(), h());
		};
		return u || (p = e(x), this.on("end", S), t && this.on("error", ee), n && this.on("abort", ee)), {
			next: () => {
				if (a.length) {
					let e = a.dequeue(), t = o.dequeue();
					v(t);
					let n = Ha(e, Hi);
					if (!n || !l.refresh(t.retention, n)) {
						let e = y(!0);
						return f = !0, Promise.reject(e);
					}
					return l.release(t.retention), Promise.resolve({
						value: e,
						done: !1
					});
				}
				return d && !f ? (f = !0, Promise.reject(d)) : u ? Promise.resolve(m()) : new Promise((e, t) => {
					s.enqueue({
						resolve: e,
						reject: t
					});
				});
			},
			return: () => {
				for (u = !0; o.length;) v(o.dequeue());
				return a.clear(), l.clear(), _(), h(), r && (this.done().catch(() => void 0), r()), Promise.resolve(m());
			},
			[Symbol.asyncIterator]() {
				return this;
			}
		};
	}
	async done() {
		r(this, Fi, !0, "f"), await i(this, Ci, "f");
	}
	_hasListeners(e) {
		return !!i(this, Ei, "f")[e]?.some((e) => !e.removed);
	}
	_emit(e, ...t) {
		if (i(this, Mi, "f")) return;
		e === "end" && (i(this, yi, "m", Ii).call(this), r(this, Mi, !0, "f"), i(this, wi, "f").call(this));
		let n = i(this, Ei, "f")[e];
		if (n) {
			i(this, Ei, "f")[e] = n.filter((e) => (e.once && (e.detached = !0), !e.once && !e.removed)), r(this, ji, i(this, ji, "f") + 1, "f");
			try {
				for (let e of n) e.removed || e.listener(...t);
			} finally {
				if (r(this, ji, i(this, ji, "f") - 1, "f"), i(this, ji, "f") === 0) {
					i(this, yi, "m", zi).call(this);
					for (let e of i(this, Ai, "f")) i(this, Ai, "f").delete(e), i(this, Mi, "f") || e();
				}
			}
		}
		if (e === "abort") {
			let e = t[0];
			!i(this, Fi, "f") && !n?.length && Promise.reject(e), i(this, Si, "f").call(this, e), i(this, Ti, "f").call(this, e), this._emit("end");
			return;
		}
		if (e === "error") {
			let e = t[0];
			!i(this, Fi, "f") && !n?.length && Promise.reject(e), i(this, Si, "f").call(this, e), i(this, Ti, "f").call(this, e), this._emit("end");
		}
	}
	_emitFinal() {}
};
bi = /* @__PURE__ */ new WeakMap(), xi = /* @__PURE__ */ new WeakMap(), Si = /* @__PURE__ */ new WeakMap(), Ci = /* @__PURE__ */ new WeakMap(), wi = /* @__PURE__ */ new WeakMap(), Ti = /* @__PURE__ */ new WeakMap(), Ei = /* @__PURE__ */ new WeakMap(), Di = /* @__PURE__ */ new WeakMap(), Oi = /* @__PURE__ */ new WeakMap(), ki = /* @__PURE__ */ new WeakMap(), Ai = /* @__PURE__ */ new WeakMap(), ji = /* @__PURE__ */ new WeakMap(), Mi = /* @__PURE__ */ new WeakMap(), Ni = /* @__PURE__ */ new WeakMap(), Pi = /* @__PURE__ */ new WeakMap(), Fi = /* @__PURE__ */ new WeakMap(), yi = /* @__PURE__ */ new WeakSet(), Ii = function() {
	for (let { signal: e, listener: t } of i(this, Di, "f").splice(0)) e.removeEventListener("abort", t);
}, Li = function(e, t) {
	let n = i(this, Ei, "f")[e], r = n?.length ?? 0;
	this.once(e, t);
	let a = i(this, Ei, "f")[e], [o] = a?.slice(-1) ?? [];
	(n === void 0 || a === n) && a?.length === r + 1 && o?.listener === t && o.once && i(this, Oi, "f").set(t, {
		event: e,
		registration: o
	});
}, Ri = function(e, t) {
	t.removed || (t.removed = !0, i(this, Oi, "f").delete(t.listener), i(this, ki, "f").add(e), i(this, ji, "f") === 0 && i(this, yi, "m", zi).call(this));
}, zi = function() {
	for (let e of i(this, ki, "f")) {
		let t = e, n = i(this, Ei, "f")[t];
		n && (i(this, Ei, "f")[t] = n.filter((e) => !e.removed));
	}
	i(this, ki, "f").clear();
}, Bi = function(e) {
	if (r(this, Ni, !0, "f"), e instanceof Error && e.name === "AbortError" && (e = new u()), e instanceof u) return r(this, Pi, !0, "f"), this._emit("abort", e);
	if (e instanceof c) return this._emit("error", e);
	if (e instanceof Error) {
		let t = new c(e.message);
		return t.cause = e, this._emit("error", t);
	}
	return this._emit("error", new c(String(e)));
};
//#endregion
//#region node_modules/openai/lib/RunnableFunction.mjs
function to(e) {
	return typeof e.parse == "function";
}
//#endregion
//#region node_modules/openai/lib/AbstractChatCompletionRunner.mjs
var no, ro, io, ao, oo, so, co, lo, uo, fo, po = 10;
function mo(e) {
	for (let t of e.choices) for (let e of t.message.tool_calls ?? []) e.id ||= `call_${a()}`;
}
function ho(e) {
	if (!_i(e)) return e;
	let t = { role: "assistant" };
	return e.audio != null && (t.audio = { id: e.audio.id }), e.content !== void 0 && (t.content = e.content), e.function_call != null && (t.function_call = e.function_call), e.name !== void 0 && (t.name = e.name), e.refusal != null && (t.refusal = e.refusal), e.tool_calls !== void 0 && (t.tool_calls = e.tool_calls.map((e) => e.type === "custom" ? {
		id: e.id,
		type: e.type,
		custom: {
			input: e.custom.input,
			name: e.custom.name
		}
	} : {
		id: e.id,
		type: e.type,
		function: {
			arguments: e.function.arguments,
			name: e.function.name
		}
	})), t;
}
var go = class extends eo {
	constructor() {
		super(...arguments), no.add(this), this._chatCompletions = [], io.set(this, !1), this.messages = [];
	}
	_addChatCompletion(e) {
		r(this, io, !this.controller.signal.aborted, "f"), mo(e), this._chatCompletions.push(e), this._emit("chatCompletion", e);
		let t = e.choices[0]?.message;
		return t && this._addMessage(t), e;
	}
	_addMessage(e, t = !0) {
		if ("content" in e || (e.content = null), this.messages.push(e), t) {
			if (this._emit("message", e), vi(e) && e.content) this._emit("functionToolCallResult", e.content);
			else if (_i(e) && e.tool_calls) for (let t of e.tool_calls) t.type === "function" && this._emit("functionToolCall", t.function);
		}
	}
	async finalChatCompletion() {
		await this.done();
		let e = this._chatCompletions[this._chatCompletions.length - 1];
		if (!e) throw new c("stream ended without producing a ChatCompletion");
		return e;
	}
	async finalContent() {
		return await this.done(), i(this, no, "m", ao).call(this);
	}
	async finalMessage() {
		return await this.done(), i(this, no, "m", oo).call(this);
	}
	async finalFunctionToolCall() {
		return await this.done(), i(this, no, "m", so).call(this);
	}
	async finalFunctionToolCallResult() {
		return await this.done(), i(this, no, "m", co).call(this);
	}
	async totalUsage() {
		return await this.done(), i(this, no, "m", lo).call(this);
	}
	allChatCompletions() {
		return [...this._chatCompletions];
	}
	_emitFinal() {
		let e = this._chatCompletions[this._chatCompletions.length - 1];
		e && this._emit("finalChatCompletion", e);
		let t = i(this, no, "m", oo).call(this);
		t && this._emit("finalMessage", t);
		let n = i(this, no, "m", ao).call(this);
		n && this._emit("finalContent", n);
		let r = i(this, no, "m", so).call(this);
		r && this._emit("finalFunctionToolCall", r);
		let a = i(this, no, "m", co).call(this);
		a != null && this._emit("finalFunctionToolCallResult", a), this._chatCompletions.some((e) => e.usage) && this._emit("totalUsage", i(this, no, "m", lo).call(this));
	}
	async _createChatCompletion(e, t, n) {
		this._listenForAbort(n?.signal), i(ro, ro, "m", uo).call(ro, t);
		let r = await e.chat.completions.create({
			...t,
			stream: !1
		}, {
			...n,
			signal: this.controller.signal
		});
		return this._connected(), this._addChatCompletion(di(r, t));
	}
	async _runChatCompletion(e, t, n) {
		for (let e of t.messages) this._addMessage(e, !1);
		return await this._createChatCompletion(e, t, n);
	}
	async _runTools(e, t, n, r) {
		let a = "tool", { tool_choice: o = "auto", stream: s, toolContext: l, ...d } = t, f = l, p = typeof o != "string" && o.type === "function" && o?.function?.name, { maxChatCompletions: m = po, afterCompletion: h } = r || {}, g = t.tools.map((e) => {
			if (li(e)) {
				if (!e.$callback) throw new c("Tool given to `.runTools()` that does not have an associated function");
				return {
					type: "function",
					function: {
						function: e.$callback,
						name: e.function.name,
						description: e.function.description || "",
						parameters: e.function.parameters,
						parse: e.$parseRaw,
						strict: !0
					}
				};
			}
			return e;
		}), _ = Object.create(null);
		for (let e of g) e.type === "function" && (_[e.function.name || e.function.function.name] = e.function);
		let v = "tools" in t ? g.map((e) => e.type === "function" ? {
			type: "function",
			function: {
				name: e.function.name || e.function.function.name,
				parameters: e.function.parameters,
				description: e.function.description,
				strict: e.function.strict
			}
		} : e) : void 0;
		for (let e of t.messages) this._addMessage(e, !1);
		let y = !1, b = async (e) => {
			let t = y;
			if (y = !1, e.type !== "function") return {
				message: void 0,
				functionCalled: !1
			};
			let r = e.id, { name: o, arguments: s } = e.function, c = _[o];
			if (!c) {
				let e = `Invalid tool_call: ${JSON.stringify(o)}. Available options are: ${Object.keys(_).map((e) => JSON.stringify(e)).join(", ")}. Please try again`;
				return {
					message: {
						role: a,
						tool_call_id: r,
						content: e
					},
					functionCalled: !1
				};
			}
			if (p && p !== o) {
				let e = `Invalid tool_call: ${JSON.stringify(o)}. ${JSON.stringify(p)} requested. Please try again`;
				return {
					message: {
						role: a,
						tool_call_id: r,
						content: e
					},
					functionCalled: !1
				};
			}
			let l;
			if (to(c)) {
				let e;
				try {
					e = await c.parse(s);
				} catch (e) {
					if (this.controller.signal.aborted) throw new u();
					let t = e instanceof Error ? e.message : String(e);
					return {
						message: {
							role: a,
							tool_call_id: r,
							content: t
						},
						functionCalled: !1
					};
				}
				if (this.controller.signal.aborted) throw new u();
				l = await c.function(e, n, f);
			} else {
				if (this.controller.signal.aborted && !t) throw new u();
				l = await c.function(s, n, f);
			}
			let d = i(ro, ro, "m", fo).call(ro, l);
			return {
				message: {
					role: a,
					tool_call_id: r,
					content: d
				},
				functionCalled: !0
			};
		};
		for (let a = 0; a < m; ++a) {
			let a = await this._createChatCompletion(e, {
				...d,
				tool_choice: o,
				tools: v,
				messages: this.messages.map(ho)
			}, r);
			y = this.controller.signal.aborted && i(this, io, "f");
			let s = a.choices[0]?.message;
			if (!s) throw new c("missing message in ChatCompletion response");
			if (!s.tool_calls?.length) {
				await h?.(a, n);
				return;
			}
			if (p || t.parallel_tool_calls === !1) for (let e of s.tool_calls) {
				let t = await b(e);
				if (t.message && this._addMessage(t.message), this.controller.signal.aborted) throw new u();
				if (p && t.functionCalled) {
					await h?.(a, n);
					return;
				}
			}
			else {
				let e = await Promise.allSettled(s.tool_calls.map(b));
				if (!this.controller.signal.aborted) {
					for (let t of e) if (t.status === "rejected") throw t.reason;
				}
				for (let t of e) t.status === "fulfilled" && t.value.message && this._addMessage(t.value.message);
				if (this.controller.signal.aborted) throw new u();
			}
			await h?.(a, n);
		}
	}
};
ro = go, io = /* @__PURE__ */ new WeakMap(), no = /* @__PURE__ */ new WeakSet(), ao = function() {
	return i(this, no, "m", oo).call(this).content ?? null;
}, oo = function() {
	let e = this.messages.length;
	for (; e-- > 0;) {
		let t = this.messages[e];
		if (_i(t)) return {
			...t,
			content: t.content ?? null,
			refusal: t.refusal ?? null
		};
	}
	throw new c("stream ended without producing a ChatCompletionMessage with role=assistant");
}, so = function() {
	for (let e = this.messages.length - 1; e >= 0; e--) {
		let t = this.messages[e];
		if (_i(t) && t?.tool_calls?.length) for (let e = t.tool_calls.length - 1; e >= 0; e--) {
			let n = t.tool_calls[e];
			if (n?.type === "function") return n.function;
		}
	}
}, co = function() {
	for (let e = this.messages.length - 1; e >= 0; e--) {
		let t = this.messages[e];
		if (vi(t) && t.content != null && typeof t.content == "string" && this.messages.some((e) => e.role === "assistant" && e.tool_calls?.some((e) => e.type === "function" && e.id === t.tool_call_id))) return t.content;
	}
}, lo = function() {
	let e = {
		completion_tokens: 0,
		prompt_tokens: 0,
		total_tokens: 0
	};
	for (let { usage: t } of this._chatCompletions) t && (e.completion_tokens += t.completion_tokens, e.prompt_tokens += t.prompt_tokens, e.total_tokens += t.total_tokens);
	return e;
}, uo = function(e) {
	if (e.n != null && e.n > 1) throw new c("ChatCompletion convenience helpers only support n=1 at this time. To use n>1, please use chat.completions.create() directly.");
}, fo = function(e) {
	return typeof e == "string" ? e : e === void 0 ? "undefined" : JSON.stringify(e);
};
//#endregion
//#region node_modules/openai/lib/ChatCompletionRunner.mjs
var _o = class e extends go {
	static runTools(t, n, r) {
		let i = new e(), a = {
			...r,
			__metadata: {
				...r?.__metadata,
				helperMethod: "runTools"
			}
		};
		return i._run(() => i._runTools(t, n, i, a)), i;
	}
	_addMessage(e, t = !0) {
		super._addMessage(e, t), _i(e) && e.content && this._emit("content", e.content);
	}
}, V = {
	STR: 1,
	NUM: 2,
	ARR: 4,
	OBJ: 8,
	NULL: 16,
	BOOL: 32,
	NAN: 64,
	INFINITY: 128,
	MINUS_INFINITY: 256,
	INF: 384,
	SPECIAL: 496,
	ATOM: 499,
	COLLECTION: 12,
	ALL: 511
}, vo = class extends Error {}, yo = class extends Error {};
function bo(e, t = V.ALL) {
	if (typeof e != "string") throw TypeError(`expecting str, got ${typeof e}`);
	if (!e.trim()) throw Error(`${e} is empty`);
	return xo(e.trim(), t);
}
var xo = (e, t) => {
	let n = e.length, r = 0, i = (e) => {
		throw new vo(`${e} at position ${r}`);
	}, a = (e) => {
		throw new yo(`${e} at position ${r}`);
	}, o = () => (d(), r >= n && i("Unexpected end of input"), e[r] === "\"" ? s() : e[r] === "{" ? c() : e[r] === "[" ? l() : e.substring(r, r + 4) === "null" || V.NULL & t && n - r < 4 && "null".startsWith(e.substring(r)) ? (r += 4, null) : e.substring(r, r + 4) === "true" || V.BOOL & t && n - r < 4 && "true".startsWith(e.substring(r)) ? (r += 4, !0) : e.substring(r, r + 5) === "false" || V.BOOL & t && n - r < 5 && "false".startsWith(e.substring(r)) ? (r += 5, !1) : e.substring(r, r + 8) === "Infinity" || V.INFINITY & t && n - r < 8 && "Infinity".startsWith(e.substring(r)) ? (r += 8, Infinity) : e.substring(r, r + 9) === "-Infinity" || V.MINUS_INFINITY & t && n - r > 1 && n - r < 9 && "-Infinity".startsWith(e.substring(r)) ? (r += 9, -Infinity) : e.substring(r, r + 3) === "NaN" || V.NAN & t && n - r < 3 && "NaN".startsWith(e.substring(r)) ? (r += 3, NaN) : u()), s = () => {
		let o = r, s = !1;
		for (r++; r < n && (e[r] !== "\"" || s && e[r - 1] === "\\");) s = e[r] === "\\" && !s, r++;
		if (e.charAt(r) === "\"") try {
			return JSON.parse(e.substring(o, ++r - Number(s)));
		} catch (e) {
			a(String(e));
		}
		else if (V.STR & t) try {
			return JSON.parse(e.substring(o, r - Number(s)) + "\"");
		} catch {
			return JSON.parse(e.substring(o, e.lastIndexOf("\\")) + "\"");
		}
		i("Unterminated string literal");
	}, c = () => {
		r++, d();
		let a = {};
		try {
			for (; e[r] !== "}";) {
				if (d(), r >= n && V.OBJ & t) return a;
				let i = s();
				d(), r++;
				try {
					let e = o();
					Object.defineProperty(a, i, {
						value: e,
						writable: !0,
						enumerable: !0,
						configurable: !0
					});
				} catch (e) {
					if (V.OBJ & t) return a;
					throw e;
				}
				d(), e[r] === "," && r++;
			}
		} catch {
			if (V.OBJ & t) return a;
			i("Expected '}' at end of object");
		}
		return r++, a;
	}, l = () => {
		r++;
		let n = [];
		try {
			for (; e[r] !== "]";) n.push(o()), d(), e[r] === "," && r++;
		} catch {
			if (V.ARR & t) return n;
			i("Expected ']' at end of array");
		}
		return r++, n;
	}, u = () => {
		if (r === 0) {
			e === "-" && V.NUM & t && i("Not sure what '-' is");
			try {
				return JSON.parse(e);
			} catch (n) {
				if (V.NUM & t) try {
					return e[e.length - 1] === "." ? JSON.parse(e.substring(0, e.lastIndexOf("."))) : JSON.parse(e.substring(0, e.lastIndexOf("e")));
				} catch {}
				a(String(n));
			}
		}
		let o = r;
		for (e[r] === "-" && r++; e[r] && !",]}".includes(e[r]);) r++;
		r === n && !(V.NUM & t) && i("Unterminated number literal");
		try {
			return JSON.parse(e.substring(o, r));
		} catch {
			e.substring(o, r) === "-" && V.NUM & t && i("Not sure what '-' is");
			try {
				return JSON.parse(e.substring(o, e.lastIndexOf("e")));
			} catch (e) {
				a(String(e));
			}
		}
	}, d = () => {
		for (; r < n && " \n\r	".includes(e[r]);) r++;
	};
	return o();
}, So = (e) => bo(e, V.ALL ^ V.NUM), H, U, Co, wo, W, To, Eo, Do, Oo, ko, Ao, jo, Mo, No, Po;
function Fo(e) {
	try {
		return So(e);
	} catch (t) {
		if (t instanceof yo || t instanceof SyntaxError) return ci({
			type: "json_schema",
			$parseRaw: void 0
		}, e);
		throw t;
	}
}
var Io = "chat.completion.chunk.message:";
function Lo(e, t, n) {
	let r = {
		type: "message",
		message: t,
		...n ? { tool_call_ids: n } : {}
	};
	return {
		id: e.id,
		choices: [],
		created: e.created,
		model: e.model,
		object: `${Io}${JSON.stringify(r)}`
	};
}
function Ro(e) {
	return "type" in e && e.type === "message" && "message" in e || "object" in e && typeof e.object == "string" && e.object.startsWith(Io);
}
function zo(e) {
	return "type" in e ? e : JSON.parse(e.object.slice(30));
}
var Bo = 128, Vo = 128, Ho = 16777216, Uo = 65536, Wo = 128, Go = 67108864, Ko = 1024;
function qo() {
	return {
		bytes: 0,
		depth: 0,
		fragments: 0,
		work: 0,
		escaped: !1,
		has_non_whitespace: !1,
		in_string: !1,
		last_parsed_bytes: 0,
		pending_high_surrogate: !1
	};
}
function Jo(e, t, n, r) {
	if (t.fragments >= Uo) throw new c("Chat completion stream exceeded its structured JSON fragment limit");
	let i = 0, { depth: a, escaped: o, has_non_whitespace: s, in_string: l } = e, u = !1, d = !0;
	for (let f of n) {
		let n = i, p = f.codePointAt(0);
		if (d && e.pending_high_surrogate && p >= 56320 && p <= 57343 ? i += 1 : i += p <= 127 ? 1 : p <= 2047 ? 2 : p <= 65535 ? 3 : 4, d = !1, t.bytes + i > Ho) throw new c("Chat completion stream exceeded its structured JSON byte limit");
		if (r && r.work + i > Go) throw r.work += n, new c("Chat completion stream exceeded its structured JSON parse-work limit");
		if (f !== " " && f !== "\n" && f !== "\r" && f !== "	" && (s = !0), l) {
			o ? o = !1 : f === "\\" ? o = !0 : f === "\"" && (l = !1, u ||= a === 0);
			continue;
		}
		if (f === "\"") l = !0;
		else if (f === "{" || f === "[") {
			if (a += 1, a > Wo) throw new c("Chat completion stream exceeded its structured JSON nesting depth limit");
		} else (f === "}" || f === "]") && a > 0 && (--a, u ||= a === 0);
	}
	if (e.bytes += i, e.fragments += 1, e.depth = a, e.escaped = o, e.has_non_whitespace = s, e.in_string = l, n.length > 0) {
		let t = n.codePointAt(n.length - 1) ?? 0;
		e.pending_high_surrogate = t >= 55296 && t <= 56319;
	}
	if (t.bytes += i, t.fragments += 1, r && (r.work += i), !s || i === 0) return !1;
	let f = Math.max(Ko, Math.floor(e.last_parsed_bytes / 2));
	return !(e.bytes > Ko && !u && e.bytes - e.last_parsed_bytes < f);
}
function Yo(e, t) {
	return t.work + e.bytes > Go ? !1 : (t.work += e.bytes, e.work += e.bytes, e.last_parsed_bytes = e.bytes, !0);
}
function Xo(e, t) {
	let n = Object.getOwnPropertyDescriptor(e, t);
	if (!n) {
		let n = Object.getPrototypeOf(e);
		for (let e = 0; n !== null; e += 1) {
			if (e >= Wo || Object.getOwnPropertyDescriptor(n, t)) throw new c("Chat completion stream contains an unsafe structured JSON snapshot");
			n = Object.getPrototypeOf(n);
		}
		return;
	}
	if (!("value" in n) || typeof n.value != "string" && n.value !== null && n.value !== void 0) throw new c("Chat completion stream contains an unsafe structured JSON snapshot");
	return n.value;
}
function Zo(e) {
	let t = Object.getOwnPropertyDescriptor(e, "message");
	if (!t || !("value" in t) || typeof t.value != "object" || t.value === null) throw new c("Chat completion stream contains an unsafe structured JSON snapshot");
	return t.value;
}
function Qo(e, t, n, r) {
	let i = Object.getOwnPropertyDescriptor(e, t);
	if (!i) {
		let n = Object.getPrototypeOf(e);
		for (let e = 0; n !== null; e += 1) {
			if (e >= Wo || Object.getOwnPropertyDescriptor(n, t)) throw new c(`Chat completion stream contains an unsafe snapshot ${r} collection`);
			n = Object.getPrototypeOf(n);
		}
		return;
	}
	if (!("value" in i) || !Array.isArray(i.value)) throw new c(`Chat completion stream contains an unsafe snapshot ${r} collection`);
	let a = Object.getOwnPropertyDescriptor(i.value, "length");
	if (!a || !("value" in a) || !Number.isSafeInteger(a.value) || a.value > n) throw new c(`Chat completion stream exceeded its snapshot ${r} limit`);
	return i.value;
}
function $o(e, t) {
	let n = Object.getOwnPropertyDescriptor(e, t);
	if (n) {
		if (!("value" in n)) throw new c("Chat completion stream contains an unsafe structured JSON snapshot");
		return n.value;
	}
}
function es(e, t, n, r) {
	let i = Object.getOwnPropertyDescriptor(e, "length"), a = i && "value" in i ? i.value : void 0;
	if (typeof a != "number" || !Number.isSafeInteger(a) || a < 0 || a > t) throw new c(`Chat completion stream exceeded its snapshot ${n} limit`);
	let o = [];
	o.length = a;
	for (let t = 0; t < a; t += 1) {
		let n = Object.getOwnPropertyDescriptor(e, t);
		if (n) {
			if (!("value" in n)) throw new c("Chat completion stream contains an unsafe structured JSON snapshot");
			o[t] = r(n.value, t);
		}
	}
	return o;
}
function ts(e, t, n) {
	let r = qo(), i = t ?? {
		bytes: 0,
		fragments: 0,
		work: 0
	};
	if (Jo(r, i, e, n), !Yo(r, i)) throw new c("Chat completion stream exceeded its structured JSON parse-work limit");
	return e;
}
function ns(e) {
	let t = Object.getOwnPropertyDescriptor(e, "type"), n = Object.getOwnPropertyDescriptor(e, "function");
	if (!t || !("value" in t) || t.value !== "function" || !n || !("value" in n) || typeof n.value != "object" || n.value === null) return;
	let r = Object.getOwnPropertyDescriptor(n.value, "name");
	if (!(!r || !("value" in r) || typeof r.value != "string" || r.value.length === 0)) return {
		type: "function",
		name: r.value
	};
}
function rs(e, t) {
	let n = ns(e);
	if (!n || n.name !== t.name || n.type !== t.type) throw new c("Chat completion stream contains a changed tool call identity");
}
function is(e, t) {
	return Object.prototype.propertyIsEnumerable.call(t, "__proto__") && !E(e, "__proto__") && Object.defineProperty(e, "__proto__", {
		value: void 0,
		writable: !0,
		enumerable: !0,
		configurable: !0
	}), Object.assign(e, t);
}
function as(e, t = []) {
	let n = Object.getOwnPropertyDescriptors(e);
	for (let r of t) {
		let t = n[r];
		!t && !(r in e) || (n[r] = {
			value: t && "value" in t ? t.value : Reflect.get(e, r, e),
			enumerable: t?.enumerable ?? !1,
			configurable: t?.configurable ?? !0,
			writable: t && "writable" in t ? t.writable : !1
		});
	}
	return Object.create(Object.getPrototypeOf(e), n);
}
function os(e) {
	let t = as(e);
	if (e.tools) {
		let n = [], r = Object.getOwnPropertyDescriptor(e.tools, "length"), i = r && "value" in r ? r.value : void 0, a = typeof i == "number" && Number.isSafeInteger(i) && i >= 0 ? Math.min(i, Vo) : 0;
		for (let t = 0; t < a; t += 1) {
			let r = Object.getOwnPropertyDescriptor(e.tools, String(t));
			if (!r || !("value" in r)) {
				n.length = t + 1;
				continue;
			}
			let i = r.value, a = as(i, [
				"type",
				"$brand",
				"$parseRaw",
				"$callback",
				"function"
			]), o = Object.getOwnPropertyDescriptors(a);
			if (ai(a)) {
				let e = o.function;
				o.function = {
					...e && "value" in e ? e : {
						configurable: !0,
						enumerable: !0,
						writable: !0
					},
					value: as(a.function, ["name", "strict"])
				};
			}
			n[t] = Object.create(Object.getPrototypeOf(i), o);
		}
		t.tools = n;
	}
	return e.response_format && (t.response_format = as(e.response_format, [
		"type",
		"$brand",
		"$parseRaw"
	])), t;
}
var ss = 4096, cs = JSON.stringify, ls = 1048576, us = 64, ds = Symbol("omitted serialized parser value"), G = Symbol("unsafe serialized parser value");
function fs(e, t) {
	let n = /* @__PURE__ */ new WeakSet(), r = (e) => !Number.isSafeInteger(e) || e < 0 || t.bytes + e > ls ? !1 : (t.bytes += e, !0), i = (e, a) => {
		if (a > us || t.nodes >= ss) return G;
		if (t.nodes += 1, e === void 0 || typeof e == "function" || typeof e == "symbol") return ds;
		if (typeof e == "bigint") return G;
		if (e === null || typeof e == "boolean" || typeof e == "number") {
			let t = cs(e);
			return typeof t == "string" && r(t.length) ? t : G;
		}
		if (typeof e == "string") return r(e.length * 6 + 2) ? cs(e) : G;
		if (typeof e != "object" || n.has(e)) return G;
		let o = Array.isArray(e), s = Object.getPrototypeOf(e);
		if (o && s !== Array.prototype || !o && s !== null && s !== Object.prototype) return G;
		for (let t = e; t !== null; t = Object.getPrototypeOf(t)) {
			let e = Object.getOwnPropertyDescriptor(t, "toJSON");
			if (e) {
				if (!("value" in e) || typeof e.value == "function") return G;
				break;
			}
		}
		n.add(e);
		try {
			if (!r(2)) return G;
			if (o) {
				let n = Object.getOwnPropertyDescriptor(e, "length"), o = n && "value" in n ? n.value : void 0;
				if (typeof o != "number" || !Number.isSafeInteger(o) || o < 0 || o > ss - t.nodes) return G;
				let s = [];
				for (let n = 0; n < o; n += 1) {
					let o = String(n), c = Object.getOwnPropertyDescriptor(e, o);
					if (!c) {
						if (Object.getOwnPropertyDescriptor(Array.prototype, o) || Object.getOwnPropertyDescriptor(Object.prototype, o) || (t.nodes += 1, !r(4))) return G;
						s.push("null");
						continue;
					}
					if (!("value" in c)) return G;
					let l = i(c.value, a + 1);
					if (l === G) return l;
					s.push(l === ds ? "null" : l);
				}
				return `[${s.join(",")}]`;
			}
			let n = Reflect.ownKeys(e);
			if (n.length > ss - t.nodes) return G;
			let s = [];
			for (let t of n) {
				if (typeof t != "string") continue;
				let n = Object.getOwnPropertyDescriptor(e, t);
				if (!n) return G;
				if (n.enumerable) {
					if (!("value" in n)) return G;
					s.push([t, n.value]);
				}
			}
			s.sort(([e], [t]) => e === t ? 0 : e < t ? -1 : 1);
			let c = [];
			for (let [e, t] of s) {
				let n = i(t, a + 1);
				if (n === G) return n;
				if (n !== ds) {
					if (!r(e.length * 6 + 3)) return G;
					c.push(`${cs(e)}:${n}`);
				}
			}
			return `{${c.join(",")}}`;
		} finally {
			n.delete(e);
		}
	};
	try {
		let t = i(e, 0);
		return typeof t == "string" ? t : void 0;
	} catch {
		return;
	}
}
function ps(e, t, n, r) {
	let i = Object.getOwnPropertyDescriptor(t, "$parseRaw"), a = Object.getOwnPropertyDescriptor(n, r);
	if (!i || !("value" in i) || typeof i.value != "function" || !a || !("value" in a)) return;
	let o = fs(a.value, {
		nodes: 0,
		bytes: 0
	});
	o !== void 0 && e.set(t, o);
}
function ms(e, t, n, r, i) {
	let a = t && e.get(t), o = Object.getOwnPropertyDescriptor(n, r);
	return a !== void 0 && o !== void 0 && "value" in o && fs(i, {
		nodes: 0,
		bytes: 0
	}) === a;
}
function hs(e, t) {
	return e && "value" in e ? {
		...e,
		value: t
	} : {
		configurable: !0,
		enumerable: !0,
		writable: !0,
		value: t
	};
}
function gs(e, t, n) {
	for (let r of n) {
		let n = e[r];
		!n && !(r in t) || (e[r] = n && "value" in n ? {
			...n,
			value: void 0
		} : {
			configurable: n?.configurable ?? !0,
			enumerable: n?.enumerable ?? !1,
			writable: !1,
			value: void 0
		});
	}
}
function _s(e) {
	let t = e.source ?? {
		type: e.type,
		...e.type === "function" ? { function: {} } : {}
	}, n = Object.getOwnPropertyDescriptors(t);
	if (n.type = hs(n.type, e.type), e.type !== "function" || !e.function) return n.function &&= hs(n.function, void 0), gs(n, t, [
		"$brand",
		"$parseRaw",
		"$callback"
	]), Object.create(Object.getPrototypeOf(t), n);
	let r = n.function, i = r && "value" in r && typeof r.value == "object" && r.value !== null ? r.value : {}, a = Object.getOwnPropertyDescriptors(i);
	return a.name = hs(a.name, e.function.name), a.strict = hs(a.strict, e.function.strict), n.function = hs(r, Object.create(Object.getPrototypeOf(i), a)), e.function.schemaMatches || gs(n, t, [
		"$brand",
		"$parseRaw",
		"$callback"
	]), Object.create(Object.getPrototypeOf(t), n);
}
function vs(e) {
	let t = e.source ?? { type: e.type }, n = Object.getOwnPropertyDescriptors(t);
	return n.type = hs(n.type, e.type), (e.type !== "json_schema" || !e.source || !e.schemaMatches) && gs(n, t, ["$brand", "$parseRaw"]), Object.create(Object.getPrototypeOf(t), n);
}
function ys(e, t) {
	let n = Object.getOwnPropertyDescriptor(e, t);
	if (!n || !("value" in n)) return;
	let { value: r } = n;
	return typeof r == "object" && r ? r : void 0;
}
function bs(e, t, n) {
	let r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new WeakMap();
	if (e.tools) for (let n = 0; n < e.tools.length && n < Vo; n += 1) {
		let a = ys(e.tools, String(n)), o = t.tools?.[n];
		if (a && o) {
			r.set(a, o);
			let e = ys(o, "function");
			e && ps(i, o, e, "parameters");
		}
	}
	t.response_format && ps(i, t.response_format, t.response_format, "json_schema");
	let a, o, s, c, l = [], u = /* @__PURE__ */ new WeakMap(), d = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new WeakMap();
	return ct(e, {
		value(n, p, m) {
			if (!a && p === "" && typeof m == "object" && m) {
				a = m, o = void 0, s = void 0, c = void 0, l = [], u = /* @__PURE__ */ new WeakMap(), d = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new WeakMap();
				return;
			}
			if (n === a && p === "response_format") {
				typeof m == "object" && m && (s = m, c = {
					source: ys(n, p) === e.response_format ? t.response_format : void 0,
					schemaMatches: !1
				});
				return;
			}
			if (n === a && p === "tools") return Array.isArray(m) ? (o = new Proxy(m, { get(e, t) {
				let n = Reflect.get(e, t, e);
				if (typeof t == "string") {
					let e = Number(t);
					Number.isSafeInteger(e) && e >= 0 && e < Vo && String(e) === t && d.set(e, typeof n == "object" && n ? n : void 0);
				}
				return n;
			} }), o) : void 0;
			if (n === o) {
				let e = Number(p);
				if (!Number.isSafeInteger(e) || e < 0 || e >= Vo || typeof m != "object" || !m) return;
				let t = d.get(e), n = { source: t ? r.get(t) : void 0 };
				l[e] = n, u.set(m, n);
				return;
			}
			let h = u.get(n);
			if (h) {
				if (p === "type" && typeof m == "string") h.type = m;
				else if (p === "function" && typeof m == "object" && m) {
					let e = {
						source: h.source,
						schemaMatches: !1
					};
					h.function = e, f.set(m, e);
				}
				return;
			}
			if (n === s && c) {
				p === "type" && typeof m == "string" ? c.type = m : p === "json_schema" && (c.schemaMatches = ms(i, c.source, n, p, m));
				return;
			}
			let g = f.get(n);
			g && (p === "name" && typeof m == "string" ? g.name = m : p === "strict" && typeof m == "boolean" ? g.strict = m : p === "parameters" && (g.schemaMatches = ms(i, g.source, n, p, m)));
		},
		complete() {
			if (!a) return;
			let e = as(t);
			if (o) {
				let t = [];
				for (let e = 0; e < l.length; e += 1) {
					let n = l[e];
					n && (t[e] = _s(n));
				}
				e.tools = t;
			} else delete e.tools;
			c ? e.response_format = vs(c) : delete e.response_format, n(e), a = void 0, o = void 0, s = void 0, c = void 0, l = [], u = /* @__PURE__ */ new WeakMap(), d = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new WeakMap();
		}
	});
}
var xs = class e extends go {
	constructor(e) {
		super(), H.add(this), U.set(this, void 0), Co.set(this, void 0), wo.set(this, void 0), W.set(this, void 0), To.set(this, void 0), Eo.set(this, void 0), r(this, U, e, "f"), r(this, Co, /* @__PURE__ */ new Set(), "f"), r(this, wo, [], "f"), r(this, To, !1, "f");
		let t = e?.tools, n = t && Object.getOwnPropertyDescriptor(t, "length"), i = n && "value" in n ? n.value : void 0;
		if (t && typeof i == "number" && Number.isSafeInteger(i) && i >= 0) for (let e = 0; e < Math.min(i, Vo); e += 1) {
			let n = Object.getOwnPropertyDescriptor(t, String(e));
			if (!n || !("value" in n)) continue;
			let i = n.value;
			if (ai(i) && (li(i) || i.function.strict === !0)) {
				r(this, To, !0, "f");
				break;
			}
		}
		r(this, Eo, {
			bytes: 0,
			fragments: 0,
			work: 0
		}, "f");
	}
	get currentChatCompletionSnapshot() {
		return i(this, W, "f");
	}
	static fromReadableStream(t) {
		let n = new e(null);
		return n._run(() => n._fromReadableStream(t)), n;
	}
	static createChatCompletion(t, n, r) {
		let i = new e(n);
		return i._run(() => i._runChatCompletion(t, {
			...n,
			stream: !0
		}, {
			...r,
			__metadata: {
				...r?.__metadata,
				helperMethod: "stream"
			}
		})), i;
	}
	async _createChatCompletion(e, t, n) {
		this._listenForAbort(n?.signal);
		let a = {
			...t,
			stream: !0
		};
		r(this, U, a, "f"), i(this, H, "m", Do).call(this);
		let o = os(a);
		r(this, U, o, "f"), r(this, To, o.tools?.some((e) => ai(e) && (li(e) || e.function.strict === !0)) ?? !1, "f");
		let s = a.tools || a.response_format ? bs(a, o, (e) => {
			r(this, U, e, "f"), r(this, To, e.tools?.some((e) => ai(e) && (li(e) || e.function.strict === !0)) ?? !1, "f");
		}) : void 0, c = await e.chat.completions.create(a, {
			...n,
			signal: this.controller.signal
		}).finally(s);
		this._connected();
		for await (let e of c) i(this, H, "m", ko).call(this, e);
		if (c.controller.signal?.aborted) throw new u();
		return this._addChatCompletion(i(this, H, "m", No).call(this));
	}
	async _fromReadableStream(e, t) {
		this._listenForAbort(t?.signal), i(this, H, "m", Do).call(this), this._connected();
		let n = He.fromReadableStream(e, this.controller), r;
		for await (let e of n) {
			if (Ro(e)) {
				let t = zo(e);
				if (i(this, W, "f")) {
					let e = i(this, W, "f").choices[0]?.message.tool_calls;
					for (let [n, r] of t.tool_call_ids?.entries() ?? []) {
						let t = e?.[n];
						t && r && (t.id = r);
					}
					this._addChatCompletion(i(this, H, "m", No).call(this)), r = void 0;
				}
				this._addMessage(t.message);
				continue;
			}
			let t = e;
			r && t.id && r !== t.id && this._addChatCompletion(i(this, H, "m", No).call(this)), i(this, H, "m", ko).call(this, t), t.id && (r = t.id);
		}
		if (n.controller.signal?.aborted) throw new u();
		if (i(this, W, "f")) return this._addChatCompletion(i(this, H, "m", No).call(this));
		let a = this._chatCompletions[this._chatCompletions.length - 1];
		if (a) return a;
		throw new c("request ended without sending any chunks");
	}
	[(U = /* @__PURE__ */ new WeakMap(), Co = /* @__PURE__ */ new WeakMap(), wo = /* @__PURE__ */ new WeakMap(), W = /* @__PURE__ */ new WeakMap(), To = /* @__PURE__ */ new WeakMap(), Eo = /* @__PURE__ */ new WeakMap(), H = /* @__PURE__ */ new WeakSet(), Do = function() {
		this.ended || (r(this, Co, /* @__PURE__ */ new Set(), "f"), r(this, W, void 0, "f"), r(this, Eo, {
			bytes: 0,
			fragments: 0,
			work: 0
		}, "f"));
	}, Oo = function(e) {
		let t = i(this, wo, "f")[e.index];
		return t || (t = {
			content_done: !1,
			content_parse_state: void 0,
			refusal_done: !1,
			logprobs_content_done: !1,
			logprobs_refusal_done: !1,
			done_tool_calls: /* @__PURE__ */ new Set(),
			current_tool_call_index: null,
			tool_call_parse_states: /* @__PURE__ */ new Map(),
			tool_call_identities: /* @__PURE__ */ new Map()
		}, i(this, wo, "f")[e.index] = t, t);
	}, ko = function(e) {
		if (this.ended) return;
		let t = /* @__PURE__ */ new WeakMap(), n = i(this, H, "m", Po).call(this, e, t);
		this._emit("chunk", e, n);
		for (let r of e.choices) {
			let e = t.get(r), a = n.choices[e?.index ?? r.index], o = e?.tool_calls ?? [], { delta: s } = r, l = si(i(this, U, "f")?.response_format), u = l || i(this, To, "f"), d = u ? Zo(a) : a.message, f = u ? Xo(d, "refusal") : d.refusal, p = !f && l ? Xo(d, "content") : d.content;
			s?.content != null && d.role === "assistant" && p && (this._emit("content", s.content, p), this._emit("content.delta", {
				delta: s.content,
				snapshot: p,
				parsed: d.parsed
			})), s?.refusal != null && d.role === "assistant" && f && this._emit("refusal.delta", {
				delta: s.refusal,
				snapshot: f
			}), r.logprobs?.content != null && d.role === "assistant" && this._emit("logprobs.content.delta", {
				content: r.logprobs?.content,
				snapshot: a.logprobs?.content ?? []
			}), r.logprobs?.refusal != null && d.role === "assistant" && this._emit("logprobs.refusal.delta", {
				refusal: r.logprobs?.refusal,
				snapshot: a.logprobs?.refusal ?? []
			});
			let m = i(this, H, "m", Oo).call(this, a);
			a.finish_reason && (i(this, H, "m", jo).call(this, a), m.current_tool_call_index != null && i(this, H, "m", Ao).call(this, a, m.current_tool_call_index));
			for (let e of o) m.current_tool_call_index !== e.index && (i(this, H, "m", jo).call(this, a), m.current_tool_call_index != null && i(this, H, "m", Ao).call(this, a, m.current_tool_call_index)), m.current_tool_call_index = e.index;
			for (let e of o) {
				let t = d.tool_calls?.[e.index];
				if (t?.type) {
					if (t.type === "function") {
						let n = m.tool_call_identities.get(e.index), r;
						if (n?.parseable) {
							let e = Xo(t.function, "arguments");
							if (typeof e != "string") throw new c("Chat completion stream contains an unsafe structured JSON snapshot");
							r = e;
						} else r = t.function.arguments;
						this._emit("tool_calls.function.arguments.delta", {
							name: t.function.name,
							index: e.index,
							arguments: r,
							parsed_arguments: t.function.parsed_arguments,
							arguments_delta: e.arguments_delta
						});
					} else t.type;
				}
			}
		}
	}, Ao = function(e, t) {
		let n = i(this, H, "m", Oo).call(this, e);
		if (n.done_tool_calls.has(t)) return;
		let r = (i(this, To, "f") ? Zo(e) : e.message).tool_calls?.[t];
		if (!r) throw Error("no tool call snapshot");
		let a = n.tool_call_identities.get(t);
		if (a && rs(r, a), !r.type) throw Error("tool call snapshot missing `type`");
		if (r.type === "function") {
			let e = i(this, U, "f")?.tools?.find((e) => ai(e) && e.function.name === r.function.name), n = null, a = li(e) || e?.function.strict === !0, o;
			if (a) {
				i(this, W, "f") && i(this, H, "m", Mo).call(this, i(this, W, "f"));
				let e = Xo(r.function, "arguments");
				if (typeof e != "string") throw new c("Chat completion stream contains an unsafe structured JSON snapshot");
				o = e;
			} else o = r.function.arguments;
			li(e) ? n = e.$parseRaw(ts(o)) : e?.function.strict && (n = ci({
				type: "json_schema",
				$parseRaw: void 0
			}, ts(o))), this._emit("tool_calls.function.arguments.done", {
				name: r.function.name,
				index: t,
				arguments: o,
				parsed_arguments: n
			});
		} else r.type;
	}, jo = function(e) {
		let t = i(this, H, "m", Oo).call(this, e), n = si(i(this, U, "f")?.response_format), r = n || i(this, To, "f"), a = r ? Zo(e) : e.message, o = r ? Xo(a, "refusal") : a.refusal, s = !o && n, c = s ? Xo(a, "content") : a.content;
		c != null && (c !== "" || !o && !a.tool_calls?.length && !a.function_call) && !t.content_done && (s && i(this, W, "f") && i(this, H, "m", Mo).call(this, i(this, W, "f")), t.content_done = !0, this._emit("content.done", {
			content: c,
			parsed: o ? null : ci(i(this, U, "f")?.response_format, s ? ts(c) : c)
		})), o && !t.refusal_done && (t.refusal_done = !0, this._emit("refusal.done", { refusal: o })), e.logprobs?.content && !t.logprobs_content_done && (t.logprobs_content_done = !0, this._emit("logprobs.content.done", { content: e.logprobs.content })), e.logprobs?.refusal && !t.logprobs_refusal_done && (t.logprobs_refusal_done = !0, this._emit("logprobs.refusal.done", { refusal: e.logprobs.refusal }));
	}, Mo = function(e) {
		let t = {
			bytes: 0,
			fragments: 0,
			work: 0
		}, n = si(i(this, U, "f")?.response_format), r = /* @__PURE__ */ new WeakMap(), a = Qo(e, "choices", Bo, "choice");
		if (!a) throw new c("Chat completion stream contains an unsafe snapshot choice collection");
		for (let e = 0; e < a.length; e += 1) {
			let o = $o(a, e);
			if (!o) continue;
			let s = Zo(o), l = Xo(s, "refusal"), u = Xo(s, "content"), d = /* @__PURE__ */ new Map(), f = Qo(s, "tool_calls", Vo, "tool-call");
			r.set(o, Object.freeze({
				message: s,
				content: u,
				refusal: l,
				toolCallCollection: f,
				toolCalls: d
			}));
			let p = i(this, wo, "f")[o.index];
			n && !l && typeof u == "string" && ts(u, t, i(this, Eo, "f"));
			for (let [e, t] of p?.tool_call_identities ?? []) {
				let n = f && $o(f, e);
				if (!n) throw new c("Chat completion stream contains a changed tool call identity");
				rs(n, t);
			}
			if (i(this, To, "f")) for (let e = 0; e < (f?.length ?? 0); e += 1) {
				let n = $o(f, e);
				if (!n) continue;
				let r = ns(n);
				if (!r) {
					let e = Object.getOwnPropertyDescriptor(n, "type");
					if (e && !("value" in e)) throw new c("Chat completion stream contains an unsafe structured JSON snapshot");
					if (e?.value !== "function") continue;
					let t = Object.getOwnPropertyDescriptor(n, "function");
					if (t && !("value" in t)) throw new c("Chat completion stream contains an unsafe structured JSON snapshot");
					if (t && typeof t.value == "object" && t.value !== null) {
						let e = Object.getOwnPropertyDescriptor(t.value, "name");
						if (e && !("value" in e)) throw new c("Chat completion stream contains an unsafe structured JSON snapshot");
					}
					continue;
				}
				if (!mi(i(this, U, "f"), {
					type: r.type,
					function: { name: r.name }
				})) continue;
				let a = Object.getOwnPropertyDescriptor(n, "function");
				if (!a || !("value" in a)) throw new c("Chat completion stream contains an unsafe structured JSON snapshot");
				let o = a.value, s = Xo(o, "arguments");
				if (typeof s != "string") throw new c("Chat completion stream contains an unsafe structured JSON snapshot");
				ts(s, t, i(this, Eo, "f")), d.set(e, Object.freeze({
					tool: n,
					function: o,
					type: r.type,
					name: r.name,
					arguments: s
				}));
			}
		}
		return r;
	}, No = function() {
		if (this.ended) throw new c("stream has ended, this shouldn't happen");
		let e = i(this, W, "f");
		if (!e) throw new c("request ended without sending any chunks");
		let t = i(this, H, "m", Mo).call(this, e), n = i(this, Co, "f");
		return r(this, Co, /* @__PURE__ */ new Set(), "f"), r(this, W, void 0, "f"), r(this, wo, [], "f"), Ss(e, i(this, U, "f"), n, t);
	}, Po = function(e, t) {
		var n, a, o, s, l;
		let u = i(this, W, "f"), { choices: d, obfuscation: f, ...p } = e;
		if (u) e.id && is(u, p);
		else {
			let e = {
				...p,
				choices: []
			};
			r(this, W, e, "f"), u = e;
		}
		let m = i(this, U, "f")?.n, h = typeof m == "number" && Number.isSafeInteger(m) && m > 0 ? Math.min(m, Bo) : Bo;
		for (let r of e.choices) {
			let { delta: e, finish_reason: d, index: f, logprobs: p = null, ...m } = r, g = [];
			if (t.set(r, Object.freeze({
				index: f,
				tool_calls: g
			})), !Number.isSafeInteger(f) || f < 0 || f >= h) throw new c(`Chat completion stream contains an invalid choice index: ${f}`);
			let _ = u.choices[f];
			if (!_) {
				let e = {
					finish_reason: d,
					index: f,
					message: {},
					logprobs: null,
					...m
				};
				u.choices[f] = e, _ = e;
			}
			if ((si(i(this, U, "f")?.response_format) || i(this, To, "f")) && Xo(Zo(_), "refusal"), p) {
				if (_.logprobs) {
					let { content: e, refusal: t, ...r } = p;
					is(_.logprobs, r), e && ((n = _.logprobs).content ?? (n.content = []), _.logprobs.content.push(...e)), t && ((a = _.logprobs).refusal ?? (a.refusal = []), _.logprobs.refusal.push(...t));
				} else _.logprobs = { ...p }, p.content && (_.logprobs.content = [...p.content]), p.refusal && (_.logprobs.refusal = [...p.refusal]);
			}
			if (d && (_.finish_reason = d, i(this, U, "f") && hi(i(this, U, "f")))) {
				if (d === "length") throw new x();
				if (d === "content_filter") throw new ee();
			}
			if (is(_, m), !e) {
				Object.freeze(g);
				continue;
			}
			i(this, Co, "f").delete(f);
			let { audio: v, content: y, refusal: b, function_call: S, role: C, ...te } = e, { tool_calls: w, ...ne } = te, T = E(te, "tool_calls") ? w : e.tool_calls;
			if (is(_.message, ne), v?.expires_at != null && v.id == null && v.data == null && v.transcript == null && y == null && b == null && S == null && C == null && T == null && Object.keys(ne).length === 0 && i(this, Co, "f").add(f), b && (_.message.refusal = (_.message.refusal || "") + b), C && (_.message.role = C), v) {
				let e = (o = _.message).audio ?? (o.audio = {});
				v.id != null && (e.id = v.id), v.data != null && (e.data = (e.data ?? "") + v.data), v.transcript != null && (e.transcript = (e.transcript ?? "") + v.transcript), v.expires_at != null && (e.expires_at = v.expires_at);
			}
			if (S && (_.message.function_call ? (S.name && (_.message.function_call.name = S.name), S.arguments && ((s = _.message.function_call).arguments ?? (s.arguments = ""), _.message.function_call.arguments += S.arguments)) : _.message.function_call = S), y != null) {
				if (!_.message.refusal && si(i(this, U, "f")?.response_format)) {
					let e = i(this, H, "m", Oo).call(this, _), t = e.content_parse_state ??= qo(), n = Jo(t, i(this, Eo, "f"), y);
					_.message.content = (Xo(_.message, "content") || "") + y, t.has_non_whitespace ? n && Yo(t, i(this, Eo, "f")) ? (i(this, H, "m", Mo).call(this, u), _.message.parsed = Fo(ts(_.message.content))) : y.length > 0 && (_.message.parsed = null) : _.message.parsed = null;
				} else _.message.content = (_.message.content || "") + y;
			}
			if (T) {
				let e = (l = _.message).tool_calls ?? (l.tool_calls = []);
				for (let t of T) {
					let { index: n, id: r, type: a, function: o, custom: s, ...l } = t;
					if (!Number.isSafeInteger(n) || n < 0 || n >= Vo) throw new c(`Chat completion stream contains an invalid tool call index: ${n}`);
					let d = "", f = e[n] ?? (e[n] = {}), p = o?.name, m = i(this, To, "f") ? i(this, H, "m", Oo).call(this, _) : void 0, h = m?.tool_call_identities.get(n);
					if (h && (rs(f, h), a !== void 0 && a !== h.type || p !== void 0 && p !== h.name)) throw new c("Chat completion stream contains a changed tool call identity");
					if (is(f, l), r && (f.id = r), a && (f.type = a), s) {
						let e = f.custom ??= {
							name: s.name ?? "",
							input: ""
						};
						s.name && (e.name = s.name), s.input && (e.input += s.input);
					}
					if (o) {
						let e = f.function ??= {
							name: p ?? "",
							arguments: ""
						};
						if (p && (e.name = p), m && !h) {
							let e = ns(f), t = e && i(this, U, "f")?.tools?.find((t) => ai(t) && t.function.name === e.name);
							if (e && (h = {
								...e,
								parseable: t !== void 0 && mi(i(this, U, "f"), {
									type: e.type,
									function: { name: e.name }
								})
							}, m.tool_call_identities.set(n, h), !h.parseable)) {
								let e = m.tool_call_parse_states.get(n);
								e && (i(this, Eo, "f").bytes -= e.bytes, i(this, Eo, "f").fragments -= e.fragments, i(this, Eo, "f").work -= e.work, m.tool_call_parse_states.delete(n));
							}
						}
						let t = o.arguments;
						if (t != null) {
							if (d = t, m && h?.parseable !== !1) {
								let r = m.tool_call_parse_states.get(n);
								r || (r = qo(), m.tool_call_parse_states.set(n, r));
								let a = Jo(r, i(this, Eo, "f"), t), o = Xo(e, "arguments");
								if (typeof o != "string") throw new c("Chat completion stream contains an unsafe structured JSON snapshot");
								e.arguments = o + t, a && h?.parseable === !0 && Yo(r, i(this, Eo, "f")) ? (i(this, H, "m", Mo).call(this, u), e.parsed_arguments = Fo(ts(e.arguments))) : t.length > 0 && E(e, "parsed_arguments") && (e.parsed_arguments = void 0);
							} else e.arguments += t;
						}
					}
					g.push(Object.freeze({
						index: n,
						arguments_delta: d
					}));
				}
			}
			Object.freeze(g);
		}
		return u;
	}, Symbol.asyncIterator)]() {
		return this._createIterator((e) => {
			let t = (t) => e(t);
			return this.on("chunk", t), () => this.off("chunk", t);
		}, { onReturn: () => this.abort() });
	}
	toReadableStream() {
		return new He(this[Symbol.asyncIterator].bind(this), this.controller).toReadableStream();
	}
};
function Ss(e, t, n, r) {
	let { id: i, choices: o, created: s, model: l, system_fingerprint: u, ...d } = e;
	return ui({
		...d,
		id: i,
		choices: es(o, Bo, "choice", (e) => {
			let i = r.get(e);
			if (!i) throw new c("Chat completion stream contains an unsafe structured JSON snapshot");
			let { message: o, finish_reason: s, index: l, logprobs: u, ...d } = new Proxy(e, { get(e, t, n) {
				return t === "message" ? i.message : Reflect.get(e, t, n);
			} }), f = new Proxy(o, { get(e, t, n) {
				return t === "content" ? i.content : t === "refusal" ? i.refusal : t === "tool_calls" ? i.toolCallCollection : Reflect.get(e, t, n);
			} }), { content: p = null, function_call: m, tool_calls: h, audio: g, ..._ } = f, v = s ?? (n.has(l) && Cs(g) ? "stop" : null);
			if (!v) throw new c(`missing finish_reason for choice ${l}`);
			let y = g ? { audio: g } : {}, b = f.role;
			if (!b) throw new c(`missing role for choice ${l}`);
			if (m) {
				let { arguments: e, name: t } = m;
				if (e == null) throw new c(`missing function_call.arguments for choice ${l}`);
				if (!t) throw new c(`missing function_call.name for choice ${l}`);
				return {
					...d,
					message: {
						...y,
						content: p,
						function_call: {
							arguments: e,
							name: t
						},
						role: b,
						refusal: f.refusal ?? null
					},
					finish_reason: v,
					index: l,
					logprobs: u
				};
			}
			return h ? {
				...d,
				index: l,
				finish_reason: v,
				logprobs: u,
				message: {
					..._,
					...y,
					role: b,
					content: p,
					refusal: f.refusal ?? null,
					tool_calls: es(h, Vo, "tool-call", (e, n) => {
						let r = i.toolCalls.get(n);
						if (!r) {
							let n = ns(e);
							if (n && mi(t, {
								type: n.type,
								function: { name: n.name }
							})) throw new c("Chat completion stream contains an unsafe structured JSON snapshot");
						}
						if (r && r.tool !== e) throw new c("Chat completion stream contains a changed tool call identity");
						let o = r && new Proxy(r.function, { get(e, t, n) {
							return t === "arguments" ? r.arguments : t === "name" ? r.name : Reflect.get(e, t, n);
						} }), s = r && o ? new Proxy(e, { get(e, t, n) {
							return t === "type" ? r.type : t === "function" ? o : Reflect.get(e, t, n);
						} }) : e;
						if (s.type == null) throw new c(`missing choices[${l}].tool_calls[${n}].type`);
						if (s.type === "custom") {
							let { custom: e, type: t, id: r, ...i } = s, { input: o = "", name: u, ...d } = e || {};
							if (u == null) throw new c(`missing choices[${l}].tool_calls[${n}].custom.name`);
							return {
								...i,
								id: r || `call_${a()}`,
								type: t,
								custom: {
									...d,
									name: u,
									input: o
								}
							};
						}
						let { function: u, type: d, id: f, ...p } = s, { arguments: m, name: h, ...g } = u || {};
						if (h == null) throw new c(`missing choices[${l}].tool_calls[${n}].function.name`);
						if (m == null) throw new c(`missing choices[${l}].tool_calls[${n}].function.arguments`);
						return {
							...p,
							id: f || `call_${a()}`,
							type: d,
							function: {
								...g,
								name: h,
								arguments: m
							}
						};
					})
				}
			} : {
				...d,
				message: {
					..._,
					...y,
					content: p,
					role: b,
					refusal: f.refusal ?? null
				},
				finish_reason: v,
				index: l,
				logprobs: u
			};
		}),
		created: s,
		model: l,
		object: "chat.completion",
		...u ? { system_fingerprint: u } : {}
	}, t);
}
function Cs(e) {
	return e?.id != null && e.data != null && e.transcript != null && e.expires_at != null;
}
//#endregion
//#region node_modules/openai/lib/ChatCompletionStreamingRunner.mjs
var ws = class e extends xs {
	static fromReadableStream(t) {
		let n = new e(null);
		return n._run(() => n._fromReadableStream(t)), n;
	}
	toReadableStream() {
		let e, t, n = this._createIterator((n) => {
			let r = (t) => {
				e = t, n(t);
			}, i = (r) => {
				if (_i(r)) {
					t = r.tool_calls?.map((e) => e.id);
					return;
				}
				if (vi(r)) {
					if (!e) throw new c("cannot serialize a tool message before receiving any chunks");
					n(Lo(e, r, t));
				}
			};
			return this.on("chunk", r), this.on("message", i), () => {
				this.off("chunk", r), this.off("message", i);
			};
		}, { onReturn: () => this.abort() });
		return new He(() => n, this.controller).toReadableStream();
	}
	static runTools(t, n, r) {
		let i = new e(n), a = {
			...r,
			__metadata: {
				...r?.__metadata,
				helperMethod: "runTools"
			}
		};
		return i._run(() => i._runTools(t, n, i, a)), i;
	}
}, Ts = class extends z {
	constructor() {
		super(...arguments), this.messages = new ii(this._client);
	}
	create(e, t) {
		return this._client.post("/chat/completions", {
			body: e,
			...t,
			stream: e.stream ?? !1,
			__security: { bearerAuth: !0 }
		});
	}
	retrieve(e, t) {
		return this._client.get(B`/chat/completions/${e}`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	update(e, t, n) {
		return this._client.post(B`/chat/completions/${e}`, {
			body: t,
			...n,
			__security: { bearerAuth: !0 }
		});
	}
	list(e = {}, t) {
		return this._client.getAPIList("/chat/completions", M, {
			query: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/chat/completions/${e}`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	parse(e, t) {
		return gi(e.tools), this._client.chat.completions.create(e, {
			...t,
			__metadata: {
				...t?.__metadata,
				helperMethod: "chat.completions.parse"
			}
		})._thenUnwrap((t) => di(t, e));
	}
	runTools(e, t) {
		return e.stream ? ws.runTools(this._client, e, t) : _o.runTools(this._client, e, t);
	}
	stream(e, t) {
		return xs.createChatCompletion(this._client, e, t);
	}
};
Ts.Messages = ii;
//#endregion
//#region node_modules/openai/resources/chat/chat.mjs
var Es = class extends z {
	constructor() {
		super(...arguments), this.completions = new Ts(this._client);
	}
};
Es.Completions = Ts;
//#endregion
//#region node_modules/openai/resources/admin/organization/admin-api-keys.mjs
var Ds = class extends z {
	create(e, t) {
		return this._client.post("/organization/admin_api_keys", {
			body: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	retrieve(e, t) {
		return this._client.get(B`/organization/admin_api_keys/${e}`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e = {}, t) {
		return this._client.getAPIList("/organization/admin_api_keys", M, {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/organization/admin_api_keys/${e}`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, Os = class extends z {
	list(e = {}, t) {
		return this._client.getAPIList("/organization/audit_logs", N, {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, ks = class extends z {
	create(e, t) {
		return this._client.post("/organization/certificates", {
			body: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	retrieve(e, t = {}, n) {
		return this._client.get(B`/organization/certificates/${e}`, {
			query: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	update(e, t, n) {
		return this._client.post(B`/organization/certificates/${e}`, {
			body: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e = {}, t) {
		return this._client.getAPIList("/organization/certificates", N, {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/organization/certificates/${e}`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	activate(e, t) {
		return this._client.getAPIList("/organization/certificates/activate", Lt, {
			body: e,
			method: "post",
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	deactivate(e, t) {
		return this._client.getAPIList("/organization/certificates/deactivate", Lt, {
			body: e,
			method: "post",
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, As = class extends z {
	retrieve(e) {
		return this._client.get("/organization/data_retention", {
			...e,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	update(e, t) {
		return this._client.post("/organization/data_retention", {
			body: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, js = class extends z {
	create(e, t) {
		return this._client.post("/organization/invites", {
			body: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	retrieve(e, t) {
		return this._client.get(B`/organization/invites/${e}`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e = {}, t) {
		return this._client.getAPIList("/organization/invites", N, {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/organization/invites/${e}`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, Ms = class extends z {
	create(e, t) {
		return this._client.post("/organization/roles", {
			body: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	retrieve(e, t) {
		return this._client.get(B`/organization/roles/${e}`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	update(e, t, n) {
		return this._client.post(B`/organization/roles/${e}`, {
			body: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e = {}, t) {
		return this._client.getAPIList("/organization/roles", Rt, {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/organization/roles/${e}`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, Ns = class extends z {
	create(e, t) {
		return this._client.post("/organization/spend_alerts", {
			body: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	retrieve(e, t) {
		return this._client.get(B`/organization/spend_alerts/${e}`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	update(e, t, n) {
		return this._client.post(B`/organization/spend_alerts/${e}`, {
			body: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e = {}, t) {
		return this._client.getAPIList("/organization/spend_alerts", N, {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/organization/spend_alerts/${e}`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, Ps = class extends z {
	retrieve(e) {
		return this._client.get("/organization/spend_limit", {
			...e,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	update(e, t) {
		return this._client.post("/organization/spend_limit", {
			body: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e) {
		return this._client.delete("/organization/spend_limit", {
			...e,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, Fs = class extends z {
	audioSpeeches(e, t) {
		return this._client.get("/organization/usage/audio_speeches", {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	audioTranscriptions(e, t) {
		return this._client.get("/organization/usage/audio_transcriptions", {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	codeInterpreterSessions(e, t) {
		return this._client.get("/organization/usage/code_interpreter_sessions", {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	completions(e, t) {
		return this._client.get("/organization/usage/completions", {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	costs(e, t) {
		return this._client.get("/organization/costs", {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	embeddings(e, t) {
		return this._client.get("/organization/usage/embeddings", {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	fileSearchCalls(e, t) {
		return this._client.get("/organization/usage/file_search_calls", {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	images(e, t) {
		return this._client.get("/organization/usage/images", {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	moderations(e, t) {
		return this._client.get("/organization/usage/moderations", {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	vectorStores(e, t) {
		return this._client.get("/organization/usage/vector_stores", {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	webSearchCalls(e, t) {
		return this._client.get("/organization/usage/web_search_calls", {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, Is = class extends z {
	create(e, t, n) {
		return this._client.post(B`/organization/groups/${e}/roles`, {
			body: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	retrieve(e, t, n) {
		let { group_id: r } = t;
		return this._client.get(B`/organization/groups/${r}/roles/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/organization/groups/${e}/roles`, Rt, {
			query: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t, n) {
		let { group_id: r } = t;
		return this._client.delete(B`/organization/groups/${r}/roles/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, Ls = class extends z {
	create(e, t, n) {
		return this._client.post(B`/organization/groups/${e}/users`, {
			body: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	retrieve(e, t, n) {
		let { group_id: r } = t;
		return this._client.get(B`/organization/groups/${r}/users/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/organization/groups/${e}/users`, Rt, {
			query: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t, n) {
		let { group_id: r } = t;
		return this._client.delete(B`/organization/groups/${r}/users/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, Rs = class extends z {
	constructor() {
		super(...arguments), this.users = new Ls(this._client), this.roles = new Is(this._client);
	}
	create(e, t) {
		return this._client.post("/organization/groups", {
			body: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	retrieve(e, t) {
		return this._client.get(B`/organization/groups/${e}`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	update(e, t, n) {
		return this._client.post(B`/organization/groups/${e}`, {
			body: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e = {}, t) {
		return this._client.getAPIList("/organization/groups", Rt, {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/organization/groups/${e}`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
};
Rs.Users = Ls, Rs.Roles = Is;
//#endregion
//#region node_modules/openai/resources/admin/organization/projects/api-keys.mjs
var zs = class extends z {
	retrieve(e, t, n) {
		let { project_id: r } = t;
		return this._client.get(B`/organization/projects/${r}/api_keys/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/organization/projects/${e}/api_keys`, N, {
			query: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t, n) {
		let { project_id: r } = t;
		return this._client.delete(B`/organization/projects/${r}/api_keys/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, Bs = class extends z {
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/organization/projects/${e}/certificates`, N, {
			query: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	activate(e, t, n) {
		return this._client.getAPIList(B`/organization/projects/${e}/certificates/activate`, Lt, {
			body: t,
			method: "post",
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	deactivate(e, t, n) {
		return this._client.getAPIList(B`/organization/projects/${e}/certificates/deactivate`, Lt, {
			body: t,
			method: "post",
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, Vs = class extends z {
	retrieve(e, t) {
		return this._client.get(B`/organization/projects/${e}/data_retention`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	update(e, t, n) {
		return this._client.post(B`/organization/projects/${e}/data_retention`, {
			body: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, Hs = class extends z {
	retrieve(e, t) {
		return this._client.get(B`/organization/projects/${e}/hosted_tool_permissions`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	update(e, t, n) {
		return this._client.post(B`/organization/projects/${e}/hosted_tool_permissions`, {
			body: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, Us = class extends z {
	retrieve(e, t) {
		return this._client.get(B`/organization/projects/${e}/model_permissions`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	update(e, t, n) {
		return this._client.post(B`/organization/projects/${e}/model_permissions`, {
			body: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/organization/projects/${e}/model_permissions`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, Ws = class extends z {
	listRateLimits(e, t = {}, n) {
		return this._client.getAPIList(B`/organization/projects/${e}/rate_limits`, N, {
			query: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	updateRateLimit(e, t, n) {
		let { project_id: r, ...i } = t;
		return this._client.post(B`/organization/projects/${r}/rate_limits/${e}`, {
			body: i,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, Gs = class extends z {
	create(e, t, n) {
		return this._client.post(B`/projects/${e}/roles`, {
			body: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	retrieve(e, t, n) {
		let { project_id: r } = t;
		return this._client.get(B`/projects/${r}/roles/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	update(e, t, n) {
		let { project_id: r, ...i } = t;
		return this._client.post(B`/projects/${r}/roles/${e}`, {
			body: i,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/projects/${e}/roles`, Rt, {
			query: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t, n) {
		let { project_id: r } = t;
		return this._client.delete(B`/projects/${r}/roles/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, Ks = class extends z {
	create(e, t, n) {
		return this._client.post(B`/organization/projects/${e}/spend_alerts`, {
			body: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	retrieve(e, t, n) {
		let { project_id: r } = t;
		return this._client.get(B`/organization/projects/${r}/spend_alerts/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	update(e, t, n) {
		let { project_id: r, ...i } = t;
		return this._client.post(B`/organization/projects/${r}/spend_alerts/${e}`, {
			body: i,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/organization/projects/${e}/spend_alerts`, N, {
			query: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t, n) {
		let { project_id: r } = t;
		return this._client.delete(B`/organization/projects/${r}/spend_alerts/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, qs = class extends z {
	retrieve(e, t) {
		return this._client.get(B`/organization/projects/${e}/spend_limit`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	update(e, t, n) {
		return this._client.post(B`/organization/projects/${e}/spend_limit`, {
			body: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/organization/projects/${e}/spend_limit`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, Js = class extends z {
	create(e, t, n) {
		let { project_id: r, ...i } = t;
		return this._client.post(B`/projects/${r}/groups/${e}/roles`, {
			body: i,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	retrieve(e, t, n) {
		let { project_id: r, group_id: i } = t;
		return this._client.get(B`/projects/${r}/groups/${i}/roles/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e, t, n) {
		let { project_id: r, ...i } = t;
		return this._client.getAPIList(B`/projects/${r}/groups/${e}/roles`, Rt, {
			query: i,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t, n) {
		let { project_id: r, group_id: i } = t;
		return this._client.delete(B`/projects/${r}/groups/${i}/roles/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, Ys = class extends z {
	constructor() {
		super(...arguments), this.roles = new Js(this._client);
	}
	create(e, t, n) {
		return this._client.post(B`/organization/projects/${e}/groups`, {
			body: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	retrieve(e, t, n) {
		let { project_id: r, ...i } = t;
		return this._client.get(B`/organization/projects/${r}/groups/${e}`, {
			query: i,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/organization/projects/${e}/groups`, Rt, {
			query: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t, n) {
		let { project_id: r } = t;
		return this._client.delete(B`/organization/projects/${r}/groups/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
};
Ys.Roles = Js;
//#endregion
//#region node_modules/openai/resources/admin/organization/projects/service-accounts/api-keys.mjs
var Xs = class extends z {
	create(e, t, n) {
		let { project_id: r, ...i } = t;
		return this._client.post(B`/organization/projects/${r}/service_accounts/${e}/api_keys`, {
			body: i,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, Zs = class extends z {
	constructor() {
		super(...arguments), this.apiKeys = new Xs(this._client);
	}
	create(e, t, n) {
		return this._client.post(B`/organization/projects/${e}/service_accounts`, {
			body: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	retrieve(e, t, n) {
		let { project_id: r } = t;
		return this._client.get(B`/organization/projects/${r}/service_accounts/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	update(e, t, n) {
		let { project_id: r, ...i } = t;
		return this._client.post(B`/organization/projects/${r}/service_accounts/${e}`, {
			body: i,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/organization/projects/${e}/service_accounts`, N, {
			query: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t, n) {
		let { project_id: r } = t;
		return this._client.delete(B`/organization/projects/${r}/service_accounts/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
};
Zs.APIKeys = Xs;
//#endregion
//#region node_modules/openai/resources/admin/organization/projects/users/roles.mjs
var Qs = class extends z {
	create(e, t, n) {
		let { project_id: r, ...i } = t;
		return this._client.post(B`/projects/${r}/users/${e}/roles`, {
			body: i,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	retrieve(e, t, n) {
		let { project_id: r, user_id: i } = t;
		return this._client.get(B`/projects/${r}/users/${i}/roles/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e, t, n) {
		let { project_id: r, ...i } = t;
		return this._client.getAPIList(B`/projects/${r}/users/${e}/roles`, Rt, {
			query: i,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t, n) {
		let { project_id: r, user_id: i } = t;
		return this._client.delete(B`/projects/${r}/users/${i}/roles/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, $s = class extends z {
	constructor() {
		super(...arguments), this.roles = new Qs(this._client);
	}
	create(e, t, n) {
		return this._client.post(B`/organization/projects/${e}/users`, {
			body: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	retrieve(e, t, n) {
		let { project_id: r } = t;
		return this._client.get(B`/organization/projects/${r}/users/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	update(e, t, n) {
		let { project_id: r, ...i } = t;
		return this._client.post(B`/organization/projects/${r}/users/${e}`, {
			body: i,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/organization/projects/${e}/users`, N, {
			query: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t, n) {
		let { project_id: r } = t;
		return this._client.delete(B`/organization/projects/${r}/users/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
};
$s.Roles = Qs;
//#endregion
//#region node_modules/openai/resources/admin/organization/projects/projects.mjs
var K = class extends z {
	constructor() {
		super(...arguments), this.users = new $s(this._client), this.serviceAccounts = new Zs(this._client), this.apiKeys = new zs(this._client), this.rateLimits = new Ws(this._client), this.modelPermissions = new Us(this._client), this.hostedToolPermissions = new Hs(this._client), this.groups = new Ys(this._client), this.roles = new Gs(this._client), this.dataRetention = new Vs(this._client), this.spendLimit = new qs(this._client), this.spendAlerts = new Ks(this._client), this.certificates = new Bs(this._client);
	}
	create(e, t) {
		return this._client.post("/organization/projects", {
			body: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	retrieve(e, t) {
		return this._client.get(B`/organization/projects/${e}`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	update(e, t, n) {
		return this._client.post(B`/organization/projects/${e}`, {
			body: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e = {}, t) {
		return this._client.getAPIList("/organization/projects", N, {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	archive(e, t) {
		return this._client.post(B`/organization/projects/${e}/archive`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
};
K.Users = $s, K.ServiceAccounts = Zs, K.APIKeys = zs, K.RateLimits = Ws, K.ModelPermissions = Us, K.HostedToolPermissions = Hs, K.Groups = Ys, K.Roles = Gs, K.DataRetention = Vs, K.SpendLimit = qs, K.SpendAlerts = Ks, K.Certificates = Bs;
//#endregion
//#region node_modules/openai/resources/admin/organization/users/roles.mjs
var ec = class extends z {
	create(e, t, n) {
		return this._client.post(B`/organization/users/${e}/roles`, {
			body: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	retrieve(e, t, n) {
		let { user_id: r } = t;
		return this._client.get(B`/organization/users/${r}/roles/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/organization/users/${e}/roles`, Rt, {
			query: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t, n) {
		let { user_id: r } = t;
		return this._client.delete(B`/organization/users/${r}/roles/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, tc = class extends z {
	constructor() {
		super(...arguments), this.roles = new ec(this._client);
	}
	retrieve(e, t) {
		return this._client.get(B`/organization/users/${e}`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	update(e, t, n) {
		return this._client.post(B`/organization/users/${e}`, {
			body: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e = {}, t) {
		return this._client.getAPIList("/organization/users", N, {
			query: e,
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/organization/users/${e}`, {
			...t,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
};
tc.Roles = ec;
//#endregion
//#region node_modules/openai/resources/admin/organization/organization.mjs
var nc = class extends z {
	constructor() {
		super(...arguments), this.auditLogs = new Os(this._client), this.adminAPIKeys = new Ds(this._client), this.usage = new Fs(this._client), this.invites = new js(this._client), this.users = new tc(this._client), this.groups = new Rs(this._client), this.roles = new Ms(this._client), this.dataRetention = new As(this._client), this.spendLimit = new Ps(this._client), this.spendAlerts = new Ns(this._client), this.certificates = new ks(this._client), this.projects = new K(this._client);
	}
};
nc.AuditLogs = Os, nc.AdminAPIKeys = Ds, nc.Usage = Fs, nc.Invites = js, nc.Users = tc, nc.Groups = Rs, nc.Roles = Ms, nc.DataRetention = As, nc.SpendLimit = Ps, nc.SpendAlerts = Ns, nc.Certificates = ks, nc.Projects = K;
//#endregion
//#region node_modules/openai/resources/admin/admin.mjs
var rc = class extends z {
	constructor() {
		super(...arguments), this.organization = new nc(this._client);
	}
};
rc.Organization = nc;
//#endregion
//#region node_modules/openai/resources/audio/speech.mjs
var ic = class extends z {
	create(e, t) {
		return this._client.post("/audio/speech", {
			body: e,
			...t,
			headers: P([{ Accept: "application/octet-stream" }, t?.headers]),
			__security: { bearerAuth: !0 },
			__binaryResponse: !0
		});
	}
}, ac = class extends z {
	create(e, t) {
		return this._client.post("/audio/transcriptions", Er({
			body: e,
			...t,
			stream: e.stream ?? !1,
			__metadata: { model: e.model },
			__security: { bearerAuth: !0 }
		}, this._client));
	}
}, oc = class extends z {
	create(e, t) {
		return this._client.post("/audio/translations", Er({
			body: e,
			...t,
			__metadata: { model: e.model },
			__security: { bearerAuth: !0 }
		}, this._client));
	}
}, sc = class extends z {
	constructor() {
		super(...arguments), this.transcriptions = new ac(this._client), this.translations = new oc(this._client), this.speech = new ic(this._client);
	}
};
sc.Transcriptions = ac, sc.Translations = oc, sc.Speech = ic;
//#endregion
//#region node_modules/openai/resources/batches.mjs
var cc = class extends z {
	create(e, t) {
		return this._client.post("/batches", {
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	retrieve(e, t) {
		return this._client.get(B`/batches/${e}`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	list(e = {}, t) {
		return this._client.getAPIList("/batches", M, {
			query: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	cancel(e, t) {
		return this._client.post(B`/batches/${e}/cancel`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
}, lc = class extends z {
	create(e, t) {
		return this._client.post("/assistants", {
			body: e,
			...t,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	retrieve(e, t) {
		return this._client.get(B`/assistants/${e}`, {
			...t,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	update(e, t, n) {
		return this._client.post(B`/assistants/${e}`, {
			body: t,
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	list(e = {}, t) {
		return this._client.getAPIList("/assistants", M, {
			query: e,
			...t,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/assistants/${e}`, {
			...t,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
}, uc = class extends z {
	create(e, t) {
		return this._client.post("/realtime/sessions", {
			body: e,
			...t,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
}, dc = class extends z {
	create(e, t) {
		return this._client.post("/realtime/transcription_sessions", {
			body: e,
			...t,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
}, fc = class extends z {
	constructor() {
		super(...arguments), this.sessions = new uc(this._client), this.transcriptionSessions = new dc(this._client);
	}
};
fc.Sessions = uc, fc.TranscriptionSessions = dc;
//#endregion
//#region node_modules/openai/resources/beta/chatkit/sessions.mjs
var pc = class extends z {
	create(e, t) {
		return this._client.post("/chatkit/sessions", {
			body: e,
			...t,
			headers: P([{ "OpenAI-Beta": "chatkit_beta=v1" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	cancel(e, t) {
		return this._client.post(B`/chatkit/sessions/${e}/cancel`, {
			...t,
			headers: P([{ "OpenAI-Beta": "chatkit_beta=v1" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
}, mc = class extends z {
	retrieve(e, t) {
		return this._client.get(B`/chatkit/threads/${e}`, {
			...t,
			headers: P([{ "OpenAI-Beta": "chatkit_beta=v1" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	list(e = {}, t) {
		return this._client.getAPIList("/chatkit/threads", N, {
			query: e,
			...t,
			headers: P([{ "OpenAI-Beta": "chatkit_beta=v1" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/chatkit/threads/${e}`, {
			...t,
			headers: P([{ "OpenAI-Beta": "chatkit_beta=v1" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	listItems(e, t = {}, n) {
		return this._client.getAPIList(B`/chatkit/threads/${e}/items`, N, {
			query: t,
			...n,
			headers: P([{ "OpenAI-Beta": "chatkit_beta=v1" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
}, hc = class extends z {
	constructor() {
		super(...arguments), this.sessions = new pc(this._client), this.threads = new mc(this._client);
	}
};
hc.Sessions = pc, hc.Threads = mc;
//#endregion
//#region node_modules/openai/resources/beta/responses/input-items.mjs
var gc = class extends z {
	list(e, t = {}, n) {
		let { betas: r, ...i } = t ?? {};
		return this._client.getAPIList(B`/responses/${e}/input_items?beta=true`, M, {
			query: i,
			...n,
			headers: P([{ ...r?.toString() == null ? void 0 : { "openai-beta": r?.toString() } }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
}, _c = class extends z {
	count(e = {}, t) {
		let { betas: n, ...r } = e ?? {};
		return this._client.post("/responses/input_tokens?beta=true", {
			body: r,
			...t,
			headers: P([{ ...n?.toString() == null ? void 0 : { "openai-beta": n?.toString() } }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
}, vc = class extends z {
	constructor() {
		super(...arguments), this.inputItems = new gc(this._client), this.inputTokens = new _c(this._client);
	}
	create(e, t) {
		let { betas: n, ...r } = e;
		return this._client.post("/responses?beta=true", {
			body: r,
			...t,
			headers: P([{ ...n?.toString() == null ? void 0 : { "openai-beta": n?.toString() } }, t?.headers]),
			stream: e.stream ?? !1,
			__security: { bearerAuth: !0 }
		});
	}
	retrieve(e, t = {}, n) {
		let { betas: r, ...i } = t ?? {};
		return this._client.get(B`/responses/${e}?beta=true`, {
			query: i,
			...n,
			headers: P([{ ...r?.toString() == null ? void 0 : { "openai-beta": r?.toString() } }, n?.headers]),
			stream: t?.stream ?? !1,
			__security: { bearerAuth: !0 }
		});
	}
	delete(e, t = {}, n) {
		let { betas: r } = t ?? {};
		return this._client.delete(B`/responses/${e}?beta=true`, {
			...n,
			headers: P([{
				Accept: "*/*",
				...r?.toString() == null ? void 0 : { "openai-beta": r?.toString() }
			}, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	cancel(e, t = {}, n) {
		let { betas: r } = t ?? {};
		return this._client.post(B`/responses/${e}/cancel?beta=true`, {
			...n,
			headers: P([{ ...r?.toString() == null ? void 0 : { "openai-beta": r?.toString() } }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	compact(e, t) {
		let { betas: n, ...r } = e;
		return this._client.post("/responses/compact?beta=true", {
			body: r,
			...t,
			headers: P([{ ...n?.toString() == null ? void 0 : { "openai-beta": n?.toString() } }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
};
vc.InputItems = gc, vc.InputTokens = _c;
//#endregion
//#region node_modules/openai/resources/beta/threads/messages.mjs
var yc = class extends z {
	create(e, t, n) {
		return this._client.post(B`/threads/${e}/messages`, {
			body: t,
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	retrieve(e, t, n) {
		let { thread_id: r } = t;
		return this._client.get(B`/threads/${r}/messages/${e}`, {
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	update(e, t, n) {
		let { thread_id: r, ...i } = t;
		return this._client.post(B`/threads/${r}/messages/${e}`, {
			body: i,
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/threads/${e}/messages`, M, {
			query: t,
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	delete(e, t, n) {
		let { thread_id: r } = t;
		return this._client.delete(B`/threads/${r}/messages/${e}`, {
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
}, bc = class extends z {
	retrieve(e, t, n) {
		let { thread_id: r, run_id: i, ...a } = t;
		return this._client.get(B`/threads/${r}/runs/${i}/steps/${e}`, {
			query: a,
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	list(e, t, n) {
		let { thread_id: r, ...i } = t;
		return this._client.getAPIList(B`/threads/${r}/runs/${e}/steps`, M, {
			query: i,
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
}, xc = (e) => {
	if (globalThis.Buffer !== void 0) {
		let t = globalThis.Buffer.from(e, "base64");
		return new Uint8Array(t.buffer, t.byteOffset, t.byteLength);
	}
	if (typeof atob < "u") {
		let t = atob(e), n = new Uint8Array(t.length);
		for (let e = 0; e < t.length; e++) n[e] = t.charCodeAt(e);
		return n;
	}
	throw new c("Cannot decode base64 string; Expected `Buffer` or `atob` to be defined");
}, Sc = (e) => {
	if (typeof Buffer < "u") {
		let t = Buffer.from(e, "base64");
		return Array.from(new Float32Array(t.buffer, t.byteOffset, t.length / Float32Array.BYTES_PER_ELEMENT));
	}
	{
		let t = atob(e), n = t.length, r = new Uint8Array(n);
		for (let e = 0; e < n; e++) r[e] = t.charCodeAt(e);
		return Array.from(new Float32Array(r.buffer));
	}
}, q = (e) => {
	try {
		if (globalThis.process !== void 0) return globalThis.process.env?.[e]?.trim() || void 0;
		if (globalThis.Deno !== void 0) return globalThis.Deno.env?.get?.(e)?.trim() || void 0;
	} catch {
		return;
	}
}, Cc = 1024, wc = 65536;
function Tc(e) {
	switch (e) {
		case "value":
		case "arguments":
		case "input":
		case "text":
		case "content":
		case "annotations":
		case "metadata":
		case "name":
		case "role":
		case "status":
		case "tool_calls":
		case "step_details": return e;
		default: return "unknown";
	}
}
var Ec = /* @__PURE__ */ new WeakMap(), Dc = /* @__PURE__ */ new WeakSet();
function Oc(e) {
	return {
		arrays: /* @__PURE__ */ new Map(),
		cacheArrays: e,
		records: /* @__PURE__ */ new WeakMap()
	};
}
function kc(e) {
	for (let [t, n] of e.arrays) n.cacheable && !Dc.has(t) ? Ec.set(t, {
		length: n.length,
		ownEntryCount: n.ownEntryCount
	}) : Ec.delete(t);
}
function Ac(e) {
	return typeof e == "string" || typeof e == "number";
}
function jc(e, t) {
	return t.every(Ac) && e.every(Ac);
}
function Mc(e) {
	let t = 0;
	for (let n of Object.keys(e)) {
		let r = Number(n);
		Number.isSafeInteger(r) && r >= 0 && r < e.length && String(r) === n && (t += 1);
	}
	return t;
}
function Nc(e, t, n) {
	return t ? n?.length === e.length ? n.ownEntryCount : Mc(e) : 0;
}
function Pc(e, t, n) {
	let { index: r } = e;
	if (t === "array" && r == null) throw Error("Expected array delta entry to have an `index` property");
	if (t === "array" && typeof r != "number") throw TypeError("Expected array delta entry `index` property to be a number but got an invalid value");
	if (!Number.isSafeInteger(r) || r < 0 || r >= n + Cc || r >= wc) throw new c(`Assistant stream delta contains an invalid ${t} index: ${typeof r == "number" ? r : "unknown"}`);
	return r;
}
function Fc(e, t, n, r, i) {
	let a = r.arrays.get(e);
	if (!a) {
		let t = r.cacheArrays && !Dc.has(e), n = t ? Ec.get(e) : void 0;
		a = {
			baselineLength: e.length,
			cacheable: t,
			enforceSparseHoleBudget: t,
			entries: /* @__PURE__ */ new Map(),
			length: e.length,
			ownEntryCount: Nc(e, t, n)
		}, r.arrays.set(e, a);
	}
	for (let o of t) {
		if (!oe(o)) throw Error("Expected array delta entry to be an object but got an invalid value");
		let t = Pc(o, n, a.baselineLength), s;
		a.entries.has(t) ? s = a.entries.get(t) : E(e, t) ? (s = e[t], s ?? a.entries.set(t, o)) : (a.entries.set(t, o), a.ownEntryCount += 1);
		let l = Math.max(a.length, t + 1);
		if (a.enforceSparseHoleBudget && l - a.ownEntryCount > Cc) throw new c(`Assistant stream delta contains an invalid ${n} index: ${t}`);
		oe(s) && i(s, o, r), a.length = l;
	}
}
function Ic(e, t, n) {
	let r = n.records.get(e);
	for (let [i, a] of Object.entries(t)) {
		if (i === "index" || i === "type") continue;
		let t;
		if (r?.has(i) ? t = r.get(i) : E(e, i) && (t = e[i]), t == null) {
			r || (r = /* @__PURE__ */ new Map(), n.records.set(e, r)), r.set(i, a);
			continue;
		}
		oe(t) && oe(a) ? Ic(t, a, n) : Array.isArray(t) && Array.isArray(a) && !jc(t, a) && Fc(t, a, "array", n, Ic);
	}
}
function Lc(e) {
	return (oe(e) || Array.isArray(e)) && Dc.has(e);
}
function Rc(e) {
	if (!(!oe(e) && !Array.isArray(e) || Dc.has(e))) {
		Dc.add(e), Array.isArray(e) && Ec.delete(e);
		for (let t of Reflect.ownKeys(e)) {
			let n = Object.getOwnPropertyDescriptor(e, t);
			n && "value" in n && Rc(n.value);
		}
	}
}
function zc(e, t, n) {
	Dc.has(e) && Rc(n), Object.defineProperty(e, t, {
		configurable: !0,
		enumerable: !0,
		value: n,
		writable: !0
	});
}
function Bc(e) {
	let { index: t } = e;
	if (t == null) throw Error("Expected array delta entry to have an `index` property");
	if (typeof t != "number") throw TypeError("Expected array delta entry `index` property to be a number but got an invalid value");
	return t;
}
function Vc(e, t, n) {
	if (jc(e, t)) {
		e.push(...t), Ec.delete(e);
		return;
	}
	for (let r of t) {
		if (!oe(r)) throw Error("Expected array delta entry to be an object but got an invalid value");
		let t = Bc(r);
		if (E(e, t)) {
			let i = e[t];
			i == null ? (Dc.has(e) && Rc(r), e[t] = r) : e[t] = n(i, r);
		} else zc(e, t, r);
	}
}
function Hc(e, t) {
	let n = Dc.has(e);
	for (let [r, i] of Object.entries(t)) {
		if (r === "__proto__" || r === "constructor" || r === "prototype") throw new c(`Assistant stream delta contains an unsafe property: ${r}`);
		if (!E(e, r)) {
			n && Rc(i), e[r] = i;
			continue;
		}
		let t = e[r];
		if (t == null) {
			n && Rc(i), e[r] = i;
			continue;
		}
		if (r === "index" || r === "type") {
			e[r] = i;
			continue;
		}
		if (typeof t == "string" && typeof i == "string") t += i;
		else if (typeof t == "number" && typeof i == "number") t += i;
		else if (oe(t) && oe(i)) t = Hc(t, i);
		else if (Array.isArray(t) && Array.isArray(i)) {
			Vc(t, i, Hc);
			continue;
		} else throw TypeError(`Unhandled record type: ${Tc(r)}`);
		e[r] = t;
	}
	return e;
}
function Uc(e) {
	if (!(!oe(e) && !Array.isArray(e))) for (let [t, n] of Object.entries(e)) {
		if (t === "__proto__" || t === "constructor" || t === "prototype") throw new c(`Assistant stream delta contains an unsafe property: ${t}`);
		Uc(n);
	}
}
function Wc(e, t, n = !1) {
	Uc(t);
	let r = e, i = t, a = Oc(n && !Lc(e));
	return Ic(r, i, a), Hc(r, i), kc(a), e;
}
function Gc(e, t, n, r = !0) {
	Uc(t);
	let i = Oc(r && !Lc(e));
	return Fc(e, t, n, i, Ic), () => kc(i);
}
//#endregion
//#region node_modules/openai/lib/AssistantStream.mjs
var J, Y, Kc, qc, Jc, Yc, Xc, Zc, Qc, $c, el, tl, nl, rl, il, al, ol, sl, cl, ll, ul, dl, fl, pl, X, ml, hl, gl, _l, vl;
function yl(e) {
	let t = Object.getOwnPropertyDescriptor(e, "event"), n = Object.getOwnPropertyDescriptor(e, "data"), r = Reflect.get(e, "event", e), i = Reflect.get(e, "data", e), a = i;
	if (r === "thread.message.created" || r === "thread.message.in_progress" || r === "thread.message.delta" || r === "thread.message.completed" || r === "thread.message.incomplete" || r === "thread.run.step.created" || r === "thread.run.step.in_progress" || r === "thread.run.step.delta" || r === "thread.run.step.completed" || r === "thread.run.step.failed" || r === "thread.run.step.cancelled" || r === "thread.run.step.expired") {
		let e = Object.getOwnPropertyDescriptor(i, "id");
		if (e && "value" in e && Reflect.get(i, "id", i) !== e.value) {
			let t = e.value;
			a = new Proxy(i, { get(e, n) {
				return n === "id" ? t : Reflect.get(e, n, e);
			} });
		}
	}
	return {
		event: Object.freeze({
			event: r,
			data: a
		}),
		exposedEvent: t !== void 0 && "value" in t && t.value === r && n !== void 0 && "value" in n && n.value === i && a === i ? e : {
			event: r,
			data: a
		}
	};
}
var bl = class e extends eo {
	constructor() {
		super(...arguments), J.add(this), Y.set(this, Object.create(null)), Kc.set(this, /* @__PURE__ */ new Map()), qc.set(this, void 0), Jc.set(this, Object.create(null)), Yc.set(this, /* @__PURE__ */ new Map()), Xc.set(this, void 0), Zc.set(this, void 0), Qc.set(this, void 0), $c.set(this, void 0), el.set(this, void 0), tl.set(this, void 0), nl.set(this, void 0), rl.set(this, void 0), il.set(this, void 0), al.set(this, void 0);
	}
	[(Y = /* @__PURE__ */ new WeakMap(), Kc = /* @__PURE__ */ new WeakMap(), qc = /* @__PURE__ */ new WeakMap(), Jc = /* @__PURE__ */ new WeakMap(), Yc = /* @__PURE__ */ new WeakMap(), Xc = /* @__PURE__ */ new WeakMap(), Zc = /* @__PURE__ */ new WeakMap(), Qc = /* @__PURE__ */ new WeakMap(), $c = /* @__PURE__ */ new WeakMap(), el = /* @__PURE__ */ new WeakMap(), tl = /* @__PURE__ */ new WeakMap(), nl = /* @__PURE__ */ new WeakMap(), rl = /* @__PURE__ */ new WeakMap(), il = /* @__PURE__ */ new WeakMap(), al = /* @__PURE__ */ new WeakMap(), J = /* @__PURE__ */ new WeakSet(), Symbol.asyncIterator)]() {
		return this._createIterator((e) => {
			let t = (t) => e(structuredClone(t));
			return this.on("event", t), () => this.off("event", t);
		}, { onReturn: () => this.abort() });
	}
	static fromReadableStream(t) {
		let n = new e();
		return n._run(() => n._fromReadableStream(t)), n;
	}
	async _fromReadableStream(e, t) {
		this._listenForAbort(t?.signal), this._connected();
		let n = He.fromReadableStream(e, this.controller);
		for await (let e of n) i(this, J, "m", ol).call(this, e);
		if (n.controller.signal?.aborted) throw new u();
		return this._addRun(i(this, J, "m", sl).call(this));
	}
	toReadableStream() {
		return new He(this[Symbol.asyncIterator].bind(this), this.controller).toReadableStream();
	}
	static createToolAssistantStream(t, n, r, i) {
		let a = new e();
		return a._run(() => a._runToolAssistantStream(t, n, r, {
			...i,
			__metadata: {
				...i?.__metadata,
				helperMethod: "stream"
			}
		})), a;
	}
	async _createToolAssistantStream(e, t, n, r) {
		this._listenForAbort(r?.signal);
		let a = {
			...n,
			stream: !0
		}, o = await e.submitToolOutputs(t, a, {
			...r,
			signal: this.controller.signal
		});
		this._connected();
		for await (let e of o) i(this, J, "m", ol).call(this, e);
		if (o.controller.signal?.aborted) throw new u();
		return this._addRun(i(this, J, "m", sl).call(this));
	}
	static createThreadAssistantStream(t, n, r) {
		let i = new e();
		return i._run(() => i._threadAssistantStream(t, n, {
			...r,
			__metadata: {
				...r?.__metadata,
				helperMethod: "stream"
			}
		})), i;
	}
	static createAssistantStream(t, n, r, i) {
		let a = new e();
		return a._run(() => a._runAssistantStream(t, n, r, {
			...i,
			__metadata: {
				...i?.__metadata,
				helperMethod: "stream"
			}
		})), a;
	}
	currentEvent() {
		return Rc(i(this, rl, "f")), i(this, rl, "f");
	}
	currentRun() {
		return Rc(i(this, il, "f")), i(this, il, "f");
	}
	currentMessageSnapshot() {
		return Rc(i(this, Xc, "f")), i(this, Xc, "f");
	}
	currentRunStepSnapshot() {
		return Rc(i(this, al, "f")), i(this, al, "f");
	}
	async finalRunSteps() {
		return await this.done(), Object.values(i(this, Y, "f"));
	}
	async finalMessages() {
		return await this.done(), Object.values(i(this, Jc, "f"));
	}
	async finalRun() {
		if (await this.done(), !i(this, Qc, "f")) throw Error("Final run was not received.");
		return i(this, Qc, "f");
	}
	async _createThreadAssistantStream(e, t, n) {
		this._listenForAbort(n?.signal);
		let r = {
			...t,
			stream: !0
		}, a = await e.createAndRun(r, {
			...n,
			signal: this.controller.signal
		});
		this._connected();
		for await (let e of a) i(this, J, "m", ol).call(this, e);
		if (a.controller.signal?.aborted) throw new u();
		return this._addRun(i(this, J, "m", sl).call(this));
	}
	async _createAssistantStream(e, t, n, r) {
		this._listenForAbort(r?.signal);
		let a = {
			...n,
			stream: !0
		}, o = await e.create(t, a, {
			...r,
			signal: this.controller.signal
		});
		this._connected();
		for await (let e of o) i(this, J, "m", ol).call(this, e);
		if (o.controller.signal?.aborted) throw new u();
		return this._addRun(i(this, J, "m", sl).call(this));
	}
	static accumulateDelta(e, t) {
		return Wc(e, t);
	}
	_addRun(e) {
		return i(this, J, "m", X).call(this, "run", e), e;
	}
	async _threadAssistantStream(e, t, n) {
		return await this._createThreadAssistantStream(t, e, n);
	}
	async _runAssistantStream(e, t, n, r) {
		return await this._createAssistantStream(t, e, n, r);
	}
	async _runToolAssistantStream(e, t, n, r) {
		return await this._createToolAssistantStream(t, e, n, r);
	}
};
ol = function(e) {
	if (this.ended) return;
	let { event: t, exposedEvent: n } = yl(e), a, o, s, l;
	switch (t.event) {
		case "thread.message.created":
		case "thread.message.in_progress":
		case "thread.message.delta":
		case "thread.message.completed":
		case "thread.message.incomplete":
			a = i(this, J, "m", ul).call(this, t), o = t.data;
			break;
		case "thread.run.step.created":
		case "thread.run.step.in_progress":
		case "thread.run.step.delta":
		case "thread.run.step.completed":
		case "thread.run.step.failed":
		case "thread.run.step.cancelled":
		case "thread.run.step.expired": s = i(this, J, "m", cl).call(this, t), l = t.data;
	}
	switch (r(this, rl, n, "f"), i(this, J, "m", ml).call(this, n), a !== void 0 && o !== void 0 && i(this, J, "m", dl).call(this, o, a), s !== void 0 && l !== void 0 && i(this, J, "m", ll).call(this, l, s), s === void 0 && i(this, qc, "f") !== void 0 && i(this, al, "f") && i(this, J, "m", ll).call(this, i(this, al, "f"), i(this, qc, "f")), t.event) {
		case "thread.created": break;
		case "thread.run.created":
		case "thread.run.queued":
		case "thread.run.in_progress":
		case "thread.run.requires_action":
		case "thread.run.completed":
		case "thread.run.incomplete":
		case "thread.run.failed":
		case "thread.run.cancelling":
		case "thread.run.cancelled":
		case "thread.run.expired":
			i(this, J, "m", vl).call(this, t);
			break;
		case "thread.run.step.created":
		case "thread.run.step.in_progress":
		case "thread.run.step.delta":
		case "thread.run.step.completed":
		case "thread.run.step.failed":
		case "thread.run.step.cancelled":
		case "thread.run.step.expired": {
			if (s === void 0) throw new c("Received assistant run-step event without a canonical run-step ID");
			let e = i(this, Y, "f")[s];
			e && i(this, J, "m", ll).call(this, e, s), i(this, J, "m", pl).call(this, t, s), i(this, J, "m", ll).call(this, t.data, s);
			let n = i(this, Y, "f")[s];
			n && i(this, J, "m", ll).call(this, n, s);
			break;
		}
		case "thread.message.created":
		case "thread.message.in_progress":
		case "thread.message.delta":
		case "thread.message.completed":
		case "thread.message.incomplete":
			if (i(this, J, "m", fl).call(this, t), a !== void 0) {
				i(this, J, "m", dl).call(this, t.data, a);
				let e = i(this, Jc, "f")[a];
				e && i(this, J, "m", dl).call(this, e, a);
			}
			break;
		case "error": throw Error("Encountered an error event in event processing - errors should be processed earlier");
	}
}, sl = function() {
	if (this.ended) throw new c("stream has ended, this shouldn't happen");
	if (!i(this, Qc, "f")) throw Error("Final run has not been received");
	return i(this, Qc, "f");
}, cl = function(e) {
	let t = Object.getOwnPropertyDescriptor(e.data, "id"), n = t && "value" in t ? t.value : void 0;
	if (typeof n != "string" || n.length === 0) throw new c("Received assistant run-step event with an invalid run-step ID");
	if (e.event === "thread.run.step.created") {
		if (i(this, qc, "f") !== void 0) throw new c(`Received run-step creation for "${n}" before the active run step "${i(this, qc, "f")}" reached a terminal state`);
		if (E(i(this, Y, "f"), n) || i(this, Kc, "f").has(n)) throw new c(`Received run-step creation for run step "${n}", which has already been created`);
		return r(this, qc, n, "f"), i(this, Kc, "f").set(n, n), n;
	}
	if (i(this, qc, "f") !== void 0) {
		if (n !== i(this, qc, "f")) throw new c(`Received ${e.event} for run step "${n}", which does not match the active run step "${i(this, qc, "f")}"`);
		return n;
	}
	if (e.event === "thread.run.step.delta") throw E(i(this, Y, "f"), n) ? new c(`Received run-step delta for "${n}" with no active run step`) : new c("Received a RunStepDelta before creation of a snapshot");
	if (E(i(this, Y, "f"), n) || i(this, Kc, "f").has(n)) throw new c(`Received run-step event for run step "${n}", which has already been created`);
	return i(this, Kc, "f").set(n, n), e.event === "thread.run.step.in_progress" && r(this, qc, n, "f"), n;
}, ll = function(e, t) {
	let n = Object.getOwnPropertyDescriptor(e, "id"), r = n && "value" in n ? n.value : void 0;
	if (typeof r != "string" || r.length === 0) throw new c("Received assistant run-step event with an invalid run-step ID");
	let a = i(this, Kc, "f").get(r);
	if (a !== void 0 && a !== t) throw new c(`Received run-step creation for run step "${r}", which has already been created`);
	i(this, Kc, "f").set(r, t);
}, ul = function(e) {
	let t = Object.getOwnPropertyDescriptor(e.data, "id"), n = t && "value" in t ? t.value : void 0;
	if (typeof n != "string" || n.length === 0) throw new c("Received assistant message event with an invalid message ID");
	if (e.event === "thread.message.created") {
		if (i(this, Xc, "f")) throw new c(`Received message creation for "${n}" before the active message "${i(this, Zc, "f")}" reached a terminal state`);
		if (E(i(this, Jc, "f"), n) || i(this, Yc, "f").has(n)) throw new c(`Received message creation for message "${n}", which has already been created`);
		return r(this, Zc, n, "f"), i(this, Yc, "f").set(n, n), n;
	}
	if (!i(this, Xc, "f")) throw e.event === "thread.message.delta" ? new c("Received a delta with no existing snapshot (there should be one from message creation)") : new c("Received thread message event with no existing snapshot");
	if (n !== i(this, Zc, "f")) throw new c(`Received ${e.event} for message "${n}", which does not match the active message "${i(this, Zc, "f")}"`);
	return n;
}, dl = function(e, t) {
	let n = Object.getOwnPropertyDescriptor(e, "id"), r = n && "value" in n ? n.value : void 0;
	if (typeof r != "string" || r.length === 0) throw new c("Received assistant message event with an invalid message ID");
	let a = i(this, Yc, "f").get(r);
	if (a !== void 0 && a !== t) throw new c(`Received message creation for message "${r}", which has already been created`);
	i(this, Yc, "f").set(r, t);
}, fl = function(e) {
	let [t, n] = i(this, J, "m", gl).call(this, e, i(this, Xc, "f"));
	if (r(this, Xc, t, "f"), !i(this, Zc, "f")) throw new c("Received thread message event with no active message ID");
	i(this, Jc, "f")[i(this, Zc, "f")] = t;
	for (let e of n) {
		let n = t.content[e.index];
		n?.type === "text" && i(this, J, "m", X).call(this, "textCreated", n.text);
	}
	switch (e.event) {
		case "thread.message.created":
			r(this, $c, void 0, "f"), r(this, el, void 0, "f"), i(this, J, "m", X).call(this, "messageCreated", e.data);
			break;
		case "thread.message.in_progress": break;
		case "thread.message.delta":
			if (i(this, J, "m", X).call(this, "messageDelta", e.data.delta, t), e.data.delta.content) for (let n of e.data.delta.content) {
				if (n.type === "text" && n.text) {
					let e = n.text, r = t.content[n.index];
					if (r && r.type === "text") i(this, J, "m", X).call(this, "textDelta", e, r.text);
					else throw Error("The snapshot associated with this text delta is not text or missing");
				}
				if (n.index !== i(this, $c, "f")) {
					if (i(this, el, "f")) switch (i(this, el, "f").type) {
						case "text":
							i(this, J, "m", X).call(this, "textDone", i(this, el, "f").text, i(this, Xc, "f"));
							break;
						case "image_file": i(this, J, "m", X).call(this, "imageFileDone", i(this, el, "f").image_file, i(this, Xc, "f"));
					}
					r(this, $c, n.index, "f");
				}
				r(this, el, t.content[n.index], "f");
			}
			break;
		case "thread.message.completed":
		case "thread.message.incomplete":
			if (i(this, $c, "f") !== void 0) {
				let t = e.data.content[i(this, $c, "f")];
				if (t) switch (t.type) {
					case "image_file":
						i(this, J, "m", X).call(this, "imageFileDone", t.image_file, i(this, Xc, "f"));
						break;
					case "text": i(this, J, "m", X).call(this, "textDone", t.text, i(this, Xc, "f"));
				}
			}
			i(this, Xc, "f") && i(this, J, "m", X).call(this, "messageDone", e.data), r(this, $c, void 0, "f"), r(this, el, void 0, "f"), r(this, Xc, void 0, "f"), r(this, Zc, void 0, "f");
	}
}, pl = function(e, t) {
	let n = i(this, J, "m", hl).call(this, e, t);
	switch (r(this, al, n, "f"), e.event) {
		case "thread.run.step.created":
			r(this, tl, void 0, "f"), r(this, nl, void 0, "f"), i(this, J, "m", X).call(this, "runStepCreated", e.data);
			break;
		case "thread.run.step.delta": {
			let t = e.data.delta;
			if (t.step_details && t.step_details.type === "tool_calls" && t.step_details.tool_calls && n.step_details.type === "tool_calls") for (let e of t.step_details.tool_calls) e.index === i(this, tl, "f") ? i(this, J, "m", X).call(this, "toolCallDelta", e, n.step_details.tool_calls[e.index]) : (i(this, nl, "f") && i(this, J, "m", X).call(this, "toolCallDone", i(this, nl, "f")), r(this, tl, e.index, "f"), r(this, nl, n.step_details.tool_calls[e.index], "f"), i(this, nl, "f") && i(this, J, "m", X).call(this, "toolCallCreated", i(this, nl, "f")));
			i(this, J, "m", X).call(this, "runStepDelta", e.data.delta, n);
			break;
		}
		case "thread.run.step.completed":
		case "thread.run.step.failed":
		case "thread.run.step.cancelled":
		case "thread.run.step.expired": r(this, al, void 0, "f"), r(this, qc, void 0, "f"), e.data.step_details.type === "tool_calls" && i(this, nl, "f") && i(this, J, "m", X).call(this, "toolCallDone", i(this, nl, "f")), i(this, J, "m", X).call(this, "runStepDone", e.data, n), r(this, tl, void 0, "f"), r(this, nl, void 0, "f");
	}
}, X = function(e, ...t) {
	if (this._hasListeners(e)) for (let e of t) Rc(e);
	this._emit(e, ...t);
}, ml = function(e) {
	i(this, J, "m", X).call(this, "event", e);
}, hl = function(e, t) {
	switch (e.event) {
		case "thread.run.step.created": return i(this, Y, "f")[t] = e.data, e.data;
		case "thread.run.step.delta": {
			let n = i(this, Y, "f")[t];
			if (!n) throw Error("Received a RunStepDelta before creation of a snapshot");
			let r = e.data;
			if (r.delta) {
				let e = Wc(n, r.delta, !0);
				i(this, Y, "f")[t] = e;
			}
			return i(this, Y, "f")[t];
		}
		case "thread.run.step.completed":
		case "thread.run.step.failed":
		case "thread.run.step.cancelled":
		case "thread.run.step.expired":
		case "thread.run.step.in_progress": i(this, Y, "f")[t] = e.data;
	}
	if (i(this, Y, "f")[t]) return i(this, Y, "f")[t];
	throw Error("No snapshot available");
}, gl = function(e, t) {
	let n = [];
	switch (e.event) {
		case "thread.message.created": return [e.data, n];
		case "thread.message.delta": {
			if (!t) throw Error("Received a delta with no existing snapshot (there should be one from message creation)");
			let r = e.data;
			if (r.delta.content) {
				Uc(r.delta);
				let e = !Lc(t), a = Gc(t.content, r.delta.content, "content", e);
				for (let a of r.delta.content) if (E(t.content, a.index)) {
					let n = t.content[a.index];
					t.content[a.index] = i(this, J, "m", _l).call(this, a, n, e);
				} else zc(t.content, a.index, a), n.push(a);
				a();
			}
			return [t, n];
		}
		case "thread.message.in_progress":
		case "thread.message.completed":
		case "thread.message.incomplete":
			if (t) return [t, n];
			throw Error("Received thread message event with no existing snapshot");
	}
	throw Error("Tried to accumulate a non-message event");
}, _l = function(e, t, n) {
	return Wc(t, e, n);
}, vl = function(e) {
	switch (r(this, il, e.data, "f"), e.event) {
		case "thread.run.created": break;
		case "thread.run.queued": break;
		case "thread.run.in_progress": break;
		case "thread.run.requires_action":
		case "thread.run.cancelled":
		case "thread.run.failed":
		case "thread.run.completed":
		case "thread.run.expired":
		case "thread.run.incomplete": r(this, Qc, e.data, "f"), i(this, nl, "f") && i(this, J, "m", X).call(this, "toolCallDone", i(this, nl, "f")), r(this, tl, void 0, "f"), r(this, nl, void 0, "f");
	}
};
//#endregion
//#region node_modules/openai/lib/polling.mjs
function xl(e, t) {
	return new Promise((n, r) => {
		let i, a, o = !1, s = (e) => {
			try {
				t.removeEventListener("abort", e);
			} catch {}
		}, c = () => {
			if (i !== void 0 && (clearTimeout(i), i = void 0), a) {
				let e = a;
				a = void 0, s(e);
			}
		}, l = () => {
			if (!o) {
				o = !0, c();
				try {
					let e = new u();
					Object.defineProperty(e, "cause", {
						value: t.reason,
						writable: !0,
						configurable: !0
					}), r(e);
				} catch (e) {
					r(e);
				}
			}
		};
		if (t.aborted) {
			l();
			return;
		}
		i = setTimeout(() => {
			o || (o = !0, c(), n());
		}, e), a = l;
		try {
			t.addEventListener("abort", l, { once: !0 }), o ? s(l) : t.aborted && l();
		} catch (e) {
			o ? s(l) : (o = !0, c(), r(e));
		}
	});
}
async function Sl(e, t, n, r) {
	let i = P([r?.headers, {
		"X-Stainless-Poll-Helper": "true",
		"X-Stainless-Custom-Poll-Interval": r?.pollIntervalMs?.toString() ?? void 0
	}]);
	for (;;) {
		let { data: a, response: o } = await e(i).withResponse(), { status: s } = a;
		if (t.includes(s)) {
			let e = 5e3;
			if (r?.pollIntervalMs) e = r.pollIntervalMs;
			else {
				let t = o.headers.get("openai-poll-after-ms");
				if (t) {
					let n = Number.parseInt(t);
					Number.isNaN(n) || (e = n);
				}
			}
			let t = r && Object.prototype.propertyIsEnumerable.call(r, "signal") ? r.signal : void 0;
			await (t ? xl(e, t) : le(e));
		} else if (n.includes(s)) return a;
	}
}
//#endregion
//#region node_modules/openai/lib/assistant-run-polling.mjs
function Cl(e, t, n, r) {
	return Sl((i) => e.retrieve(t, n, {
		...r,
		headers: {
			...r?.headers,
			...i
		}
	}), [
		"queued",
		"in_progress",
		"cancelling"
	], [
		"requires_action",
		"incomplete",
		"cancelled",
		"completed",
		"failed",
		"expired"
	], r);
}
//#endregion
//#region node_modules/openai/resources/beta/threads/runs/runs.mjs
var wl = class extends z {
	constructor() {
		super(...arguments), this.steps = new bc(this._client);
	}
	create(e, t, n) {
		let { include: r, ...i } = t;
		return this._client.post(B`/threads/${e}/runs`, {
			query: { include: r },
			body: i,
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			stream: t.stream ?? !1,
			__synthesizeEventData: !0,
			__security: { bearerAuth: !0 }
		});
	}
	retrieve(e, t, n) {
		let { thread_id: r } = t;
		return this._client.get(B`/threads/${r}/runs/${e}`, {
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	update(e, t, n) {
		let { thread_id: r, ...i } = t;
		return this._client.post(B`/threads/${r}/runs/${e}`, {
			body: i,
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/threads/${e}/runs`, M, {
			query: t,
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	cancel(e, t, n) {
		let { thread_id: r } = t;
		return this._client.post(B`/threads/${r}/runs/${e}/cancel`, {
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	async createAndPoll(e, t, n) {
		let r = await this.create(e, t, n);
		return await this.poll(r.id, { thread_id: e }, n);
	}
	createAndStream(e, t, n) {
		return bl.createAssistantStream(e, this._client.beta.threads.runs, t, n);
	}
	async poll(e, t, n) {
		return await Cl(this, e, t, n);
	}
	stream(e, t, n) {
		return bl.createAssistantStream(e, this._client.beta.threads.runs, t, n);
	}
	submitToolOutputs(e, t, n) {
		let { thread_id: r, ...i } = t;
		return this._client.post(B`/threads/${r}/runs/${e}/submit_tool_outputs`, {
			body: i,
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			stream: t.stream ?? !1,
			__synthesizeEventData: !0,
			__security: { bearerAuth: !0 }
		});
	}
	async submitToolOutputsAndPoll(e, t, n) {
		let r = await this.submitToolOutputs(e, t, n);
		return await this.poll(r.id, t, n);
	}
	submitToolOutputsStream(e, t, n) {
		return bl.createToolAssistantStream(e, this._client.beta.threads.runs, t, n);
	}
};
wl.Steps = bc;
//#endregion
//#region node_modules/openai/resources/beta/threads/threads.mjs
var Tl = class extends z {
	constructor() {
		super(...arguments), this.runs = new wl(this._client), this.messages = new yc(this._client);
	}
	create(e = {}, t) {
		return this._client.post("/threads", {
			body: e,
			...t,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	retrieve(e, t) {
		return this._client.get(B`/threads/${e}`, {
			...t,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	update(e, t, n) {
		return this._client.post(B`/threads/${e}`, {
			body: t,
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/threads/${e}`, {
			...t,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	createAndRun(e, t) {
		return this._client.post("/threads/runs", {
			body: e,
			...t,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
			stream: e.stream ?? !1,
			__synthesizeEventData: !0,
			__security: { bearerAuth: !0 }
		});
	}
	async createAndRunPoll(e, t) {
		let n = await this.createAndRun(e, t);
		return await this.runs.poll(n.id, { thread_id: n.thread_id }, t);
	}
	createAndRunStream(e, t) {
		return bl.createThreadAssistantStream(e, this._client.beta.threads, t);
	}
};
Tl.Runs = wl, Tl.Messages = yc;
//#endregion
//#region node_modules/openai/resources/beta/beta.mjs
var El = class extends z {
	constructor() {
		super(...arguments), this.realtime = new fc(this._client), this.responses = new vc(this._client), this.chatkit = new hc(this._client), this.assistants = new lc(this._client), this.threads = new Tl(this._client);
	}
};
El.Realtime = fc, El.Responses = vc, El.ChatKit = hc, El.Assistants = lc, El.Threads = Tl;
//#endregion
//#region node_modules/openai/resources/completions.mjs
var Dl = class extends z {
	create(e, t) {
		return this._client.post("/completions", {
			body: e,
			...t,
			stream: e.stream ?? !1,
			__security: { bearerAuth: !0 }
		});
	}
}, Ol = class extends z {
	retrieve(e, t, n) {
		let { container_id: r } = t;
		return this._client.get(B`/containers/${r}/files/${e}/content`, {
			...n,
			headers: P([{ Accept: "application/binary" }, n?.headers]),
			__security: { bearerAuth: !0 },
			__binaryResponse: !0
		});
	}
}, kl = class extends z {
	constructor() {
		super(...arguments), this.content = new Ol(this._client);
	}
	create(e, t, n) {
		return this._client.post(B`/containers/${e}/files`, Tr({
			body: t,
			...n,
			__security: { bearerAuth: !0 }
		}, this._client));
	}
	retrieve(e, t, n) {
		let { container_id: r } = t;
		return this._client.get(B`/containers/${r}/files/${e}`, {
			...n,
			__security: { bearerAuth: !0 }
		});
	}
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/containers/${e}/files`, M, {
			query: t,
			...n,
			__security: { bearerAuth: !0 }
		});
	}
	delete(e, t, n) {
		let { container_id: r } = t;
		return this._client.delete(B`/containers/${r}/files/${e}`, {
			...n,
			headers: P([{ Accept: "*/*" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
};
kl.Content = Ol;
//#endregion
//#region node_modules/openai/resources/containers/containers.mjs
var Al = class extends z {
	constructor() {
		super(...arguments), this.files = new kl(this._client);
	}
	create(e, t) {
		return this._client.post("/containers", {
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	retrieve(e, t) {
		return this._client.get(B`/containers/${e}`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	list(e = {}, t) {
		return this._client.getAPIList("/containers", M, {
			query: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/containers/${e}`, {
			...t,
			headers: P([{ Accept: "*/*" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
};
Al.Files = kl;
//#endregion
//#region node_modules/openai/resources/content-provenance-checks.mjs
var jl = class extends z {
	create(e, t) {
		return this._client.post("/content_provenance_checks", Er({
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		}, this._client));
	}
}, Ml = class extends z {
	create(e, t, n) {
		let { include: r, ...i } = t;
		return this._client.post(B`/conversations/${e}/items`, {
			query: { include: r },
			body: i,
			...n,
			__security: { bearerAuth: !0 }
		});
	}
	retrieve(e, t, n) {
		let { conversation_id: r, ...i } = t;
		return this._client.get(B`/conversations/${r}/items/${e}`, {
			query: i,
			...n,
			__security: { bearerAuth: !0 }
		});
	}
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/conversations/${e}/items`, N, {
			query: t,
			...n,
			__security: { bearerAuth: !0 }
		});
	}
	delete(e, t, n) {
		let { conversation_id: r } = t;
		return this._client.delete(B`/conversations/${r}/items/${e}`, {
			...n,
			__security: { bearerAuth: !0 }
		});
	}
}, Nl = class extends z {
	constructor() {
		super(...arguments), this.items = new Ml(this._client);
	}
	create(e = {}, t) {
		return this._client.post("/conversations", {
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	retrieve(e, t) {
		return this._client.get(B`/conversations/${e}`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	update(e, t, n) {
		return this._client.post(B`/conversations/${e}`, {
			body: t,
			...n,
			__security: { bearerAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/conversations/${e}`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
};
Nl.Items = Ml;
//#endregion
//#region node_modules/openai/lib/embeddings.mjs
function Pl(e, t, n) {
	let r = !!t.encoding_format, i = r ? t.encoding_format : "base64";
	r && A(e).debug("embeddings/user defined encoding_format:", t.encoding_format);
	let a = e.post("/embeddings", {
		body: {
			...t,
			encoding_format: i
		},
		...n,
		__security: { bearerAuth: !0 }
	});
	return r ? a : (A(e).debug("embeddings/decoding base64 embeddings from base64"), a._thenUnwrap((e) => {
		if (e && e.data) {
			let t = e.data, { length: n } = t;
			for (let e = 0; e < n; e += 1) if (e in t) {
				let n = t[e], r = n.embedding;
				n.embedding = Sc(r);
			}
		}
		return e;
	}));
}
//#endregion
//#region node_modules/openai/resources/embeddings.mjs
var Fl = class extends z {
	create(e, t) {
		return Pl(this._client, e, t);
	}
}, Il = class extends z {
	retrieve(e, t, n) {
		let { eval_id: r, run_id: i } = t;
		return this._client.get(B`/evals/${r}/runs/${i}/output_items/${e}`, {
			...n,
			__security: { bearerAuth: !0 }
		});
	}
	list(e, t, n) {
		let { eval_id: r, ...i } = t;
		return this._client.getAPIList(B`/evals/${r}/runs/${e}/output_items`, M, {
			query: i,
			...n,
			__security: { bearerAuth: !0 }
		});
	}
}, Ll = class extends z {
	constructor() {
		super(...arguments), this.outputItems = new Il(this._client);
	}
	create(e, t, n) {
		return this._client.post(B`/evals/${e}/runs`, {
			body: t,
			...n,
			__security: { bearerAuth: !0 }
		});
	}
	retrieve(e, t, n) {
		let { eval_id: r } = t;
		return this._client.get(B`/evals/${r}/runs/${e}`, {
			...n,
			__security: { bearerAuth: !0 }
		});
	}
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/evals/${e}/runs`, M, {
			query: t,
			...n,
			__security: { bearerAuth: !0 }
		});
	}
	delete(e, t, n) {
		let { eval_id: r } = t;
		return this._client.delete(B`/evals/${r}/runs/${e}`, {
			...n,
			__security: { bearerAuth: !0 }
		});
	}
	cancel(e, t, n) {
		let { eval_id: r } = t;
		return this._client.post(B`/evals/${r}/runs/${e}`, {
			...n,
			__security: { bearerAuth: !0 }
		});
	}
};
Ll.OutputItems = Il;
//#endregion
//#region node_modules/openai/resources/evals/evals.mjs
var Rl = class extends z {
	constructor() {
		super(...arguments), this.runs = new Ll(this._client);
	}
	create(e, t) {
		return this._client.post("/evals", {
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	retrieve(e, t) {
		return this._client.get(B`/evals/${e}`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	update(e, t, n) {
		return this._client.post(B`/evals/${e}`, {
			body: t,
			...n,
			__security: { bearerAuth: !0 }
		});
	}
	list(e = {}, t) {
		return this._client.getAPIList("/evals", M, {
			query: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/evals/${e}`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
};
Rl.Runs = Ll;
//#endregion
//#region node_modules/openai/lib/file-processing.mjs
async function zl(e, t, n, r) {
	let i = /* @__PURE__ */ new Set([
		"processed",
		"error",
		"deleted"
	]), a = Date.now(), o = await e.retrieve(t);
	for (; !o.status || !i.has(o.status);) if (await le(n), o = await e.retrieve(t), Date.now() - a > r) throw new f({ message: `Giving up on waiting for file ${t} to finish processing after ${r} milliseconds.` });
	return o;
}
//#endregion
//#region node_modules/openai/resources/files.mjs
var Bl = class extends z {
	create(e, t) {
		return this._client.post("/files", Er({
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		}, this._client));
	}
	retrieve(e, t) {
		return this._client.get(B`/files/${e}`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	list(e = {}, t) {
		return this._client.getAPIList("/files", M, {
			query: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/files/${e}`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	content(e, t) {
		return this._client.get(B`/files/${e}/content`, {
			...t,
			headers: P([{ Accept: "application/binary" }, t?.headers]),
			__security: { bearerAuth: !0 },
			__binaryResponse: !0
		});
	}
	async waitForProcessing(e, { pollInterval: t = 5e3, maxWait: n = 18e5 } = {}) {
		return await zl(this, e, t, n);
	}
}, Vl = class extends z {}, Hl = class extends z {
	run(e, t) {
		return this._client.post("/fine_tuning/alpha/graders/run", {
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	validate(e, t) {
		return this._client.post("/fine_tuning/alpha/graders/validate", {
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
}, Ul = class extends z {
	constructor() {
		super(...arguments), this.graders = new Hl(this._client);
	}
};
Ul.Graders = Hl;
//#endregion
//#region node_modules/openai/resources/fine-tuning/checkpoints/permissions.mjs
var Wl = class extends z {
	create(e, t, n) {
		return this._client.getAPIList(B`/fine_tuning/checkpoints/${e}/permissions`, Lt, {
			body: t,
			method: "post",
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	retrieve(e, t = {}, n) {
		return this._client.get(B`/fine_tuning/checkpoints/${e}/permissions`, {
			query: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/fine_tuning/checkpoints/${e}/permissions`, N, {
			query: t,
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
	delete(e, t, n) {
		let { fine_tuned_model_checkpoint: r } = t;
		return this._client.delete(B`/fine_tuning/checkpoints/${r}/permissions/${e}`, {
			...n,
			__security: { adminAPIKeyAuth: !0 }
		});
	}
}, Gl = class extends z {
	constructor() {
		super(...arguments), this.permissions = new Wl(this._client);
	}
};
Gl.Permissions = Wl;
//#endregion
//#region node_modules/openai/resources/fine-tuning/jobs/checkpoints.mjs
var Kl = class extends z {
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/fine_tuning/jobs/${e}/checkpoints`, M, {
			query: t,
			...n,
			__security: { bearerAuth: !0 }
		});
	}
}, ql = class extends z {
	constructor() {
		super(...arguments), this.checkpoints = new Kl(this._client);
	}
	create(e, t) {
		return this._client.post("/fine_tuning/jobs", {
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	retrieve(e, t) {
		return this._client.get(B`/fine_tuning/jobs/${e}`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	list(e = {}, t) {
		return this._client.getAPIList("/fine_tuning/jobs", M, {
			query: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	cancel(e, t) {
		return this._client.post(B`/fine_tuning/jobs/${e}/cancel`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	listEvents(e, t = {}, n) {
		return this._client.getAPIList(B`/fine_tuning/jobs/${e}/events`, M, {
			query: t,
			...n,
			__security: { bearerAuth: !0 }
		});
	}
	pause(e, t) {
		return this._client.post(B`/fine_tuning/jobs/${e}/pause`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	resume(e, t) {
		return this._client.post(B`/fine_tuning/jobs/${e}/resume`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
};
ql.Checkpoints = Kl;
//#endregion
//#region node_modules/openai/resources/fine-tuning/fine-tuning.mjs
var Jl = class extends z {
	constructor() {
		super(...arguments), this.methods = new Vl(this._client), this.jobs = new ql(this._client), this.checkpoints = new Gl(this._client), this.alpha = new Ul(this._client);
	}
};
Jl.Methods = Vl, Jl.Jobs = ql, Jl.Checkpoints = Gl, Jl.Alpha = Ul;
//#endregion
//#region node_modules/openai/resources/graders/grader-models.mjs
var Yl = class extends z {}, Xl = class extends z {
	constructor() {
		super(...arguments), this.graderModels = new Yl(this._client);
	}
};
Xl.GraderModels = Yl;
//#endregion
//#region node_modules/openai/resources/images.mjs
var Zl = class extends z {
	createVariation(e, t) {
		return this._client.post("/images/variations", Er({
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		}, this._client));
	}
	edit(e, t) {
		return this._client.post("/images/edits", Er({
			body: e,
			...t,
			stream: e.stream ?? !1,
			__metadata: {
				...t?.__metadata,
				...e.model == null ? {} : { model: e.model }
			},
			__security: { bearerAuth: !0 }
		}, this._client));
	}
	generate(e, t) {
		return this._client.post("/images/generations", {
			body: e,
			...t,
			stream: e.stream ?? !1,
			__security: { bearerAuth: !0 }
		});
	}
}, Ql = class extends z {
	retrieve(e, t) {
		return this._client.get(B`/models/${e}`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	list(e) {
		return this._client.getAPIList("/models", Lt, {
			...e,
			__security: { bearerAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/models/${e}`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
}, $l = class extends z {
	create(e, t) {
		return this._client.post("/moderations", {
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
};
//#endregion
//#region node_modules/openai/internal/multipart-encoding.mjs
async function eu(e, t, n, r = null) {
	if (e.body === null || typeof e.body != "object" || Array.isArray(e.body)) throw TypeError("Multipart request body must be an object");
	let i = Object.fromEntries(Object.entries(e.body).filter(([, e]) => e !== void 0));
	if (r !== null && Object.keys(i).length === 1 && Object.prototype.hasOwnProperty.call(i, r)) {
		let t = i[r];
		if (typeof t != "string") throw TypeError("Raw multipart alternative must be a string");
		return {
			...e,
			body: t,
			headers: P([e.headers, { "content-type": n[r].content_type }])
		};
	}
	let a = [];
	for (let [e, t] of Object.entries(n)) {
		if (!Object.prototype.hasOwnProperty.call(i, e)) continue;
		let n = i[e], r = t.json ? JSON.stringify(n) : n;
		if (typeof r != "string") throw TypeError(`Multipart field ${e} must encode as a string`);
		a.push([e, br([r], "", { type: t.content_type })]), delete i[e];
	}
	let o = (await Er({
		...e,
		body: i
	}, t)).body;
	if (!(o instanceof FormData)) throw await o.cancel(), TypeError("Unexpected streaming upload in typed multipart request body");
	for (let [e, t] of a) o.append(e, t, "");
	return {
		...e,
		body: o,
		headers: P([e.headers, { "content-type": null }])
	};
}
//#endregion
//#region node_modules/openai/resources/realtime/calls.mjs
var tu = class extends z {
	create(e, t) {
		return this._client.post("/realtime/calls", eu({
			body: e,
			...t,
			headers: P([{ Accept: "application/sdp" }, t?.headers]),
			__security: { bearerAuth: !0 },
			__binaryResponse: !0
		}, this._client, {
			sdp: {
				content_type: "application/sdp",
				json: !1
			},
			session: {
				content_type: "application/json",
				json: !0
			}
		}, "sdp"));
	}
	accept(e, t, n) {
		return this._client.post(B`/realtime/calls/${e}/accept`, {
			body: t,
			...n,
			headers: P([{ Accept: "*/*" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	hangup(e, t) {
		return this._client.post(B`/realtime/calls/${e}/hangup`, {
			...t,
			headers: P([{ Accept: "*/*" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	refer(e, t, n) {
		return this._client.post(B`/realtime/calls/${e}/refer`, {
			body: t,
			...n,
			headers: P([{ Accept: "*/*" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	reject(e, t = {}, n) {
		return this._client.post(B`/realtime/calls/${e}/reject`, {
			body: t,
			...n,
			headers: P([{ Accept: "*/*" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
}, nu = class extends z {
	create(e, t) {
		return this._client.post("/realtime/client_secrets", {
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
}, ru = class extends z {
	constructor() {
		super(...arguments), this.clientSecrets = new nu(this._client), this.calls = new tu(this._client);
	}
};
ru.ClientSecrets = nu, ru.Calls = tu;
//#endregion
//#region node_modules/openai/lib/ResponsesParser.mjs
function iu(e, t) {
	if (!t || !su(t)) {
		let t = {
			...e,
			output_parsed: null,
			output: e.output.map((e) => e.type === "function_call" ? {
				...e,
				parsed_arguments: null
			} : e.type === "message" ? {
				...e,
				content: e.content.map((e) => ({
					...e,
					parsed: null
				}))
			} : e)
		};
		return du(e, t) && fu(t), t;
	}
	return au(e, t);
}
function au(e, t) {
	let n = !e.status || e.status === "completed", r = e.output.map((e) => {
		if (e.type === "function_call") return n ? uu(t, e) : {
			...e,
			parsed_arguments: null
		};
		if (e.type === "message") {
			let r = e.content.map((e) => e.type === "output_text" ? {
				...e,
				parsed: n ? ou(t, e.text) : null
			} : e);
			return {
				...e,
				content: r
			};
		}
		return e;
	}), i = {
		...e,
		output: r
	};
	return du(e, i) && fu(i), Object.defineProperty(i, "output_parsed", {
		enumerable: !0,
		get() {
			for (let e of i.output) if (e.type === "message") {
				for (let t of e.content) if (t.type === "output_text" && t.parsed !== null) return t.parsed;
			}
			return null;
		}
	}), i;
}
function ou(e, t) {
	return ci(e.text?.format, t);
}
function su(e) {
	return si(e.text?.format) ? !0 : Array.isArray(e.tools) && e.tools.some((e) => cu(e) || e.type === "function" && e.strict === !0);
}
function cu(e) {
	return e?.$brand === "auto-parseable-tool";
}
function lu(e, t) {
	return e.find((e) => e.type === "function" && e.name === t);
}
function uu(e, t) {
	let n = lu(e.tools ?? [], t.name), r = null;
	return cu(n) ? r = n.$parseRaw(t.arguments) : n?.strict && (r = ci({
		type: "json_schema",
		$parseRaw: void 0
	}, t.arguments)), {
		...t,
		parsed_arguments: r
	};
}
function du(e, t) {
	return !Object.getOwnPropertyDescriptor(e, "output_text") || t.output_text == null;
}
function fu(e) {
	let t = [];
	for (let n of e.output) if (n.type === "message") for (let e of n.content) e.type === "output_text" && t.push(e.text);
	e.output_text = t.join("");
}
//#endregion
//#region node_modules/openai/internal/responses/output-text-index.mjs
var pu = class {
	constructor() {
		this.capacity = 1, this.values = [0, 0], this.size = 0;
	}
	get length() {
		return this.size;
	}
	append(e) {
		this.size === this.capacity && this.grow();
		let t = this.size;
		this.size += 1, this.update(t, e);
	}
	update(e, t) {
		if (!Number.isSafeInteger(e) || e < 0 || e >= this.size) throw RangeError(`missing output at index ${e}`);
		let n = this.capacity + e, r = t - (this.values[n] ?? 0);
		if (r !== 0) for (; n >= 1;) this.values[n] = (this.values[n] ?? 0) + r, n = Math.floor(n / 2);
	}
	prefixSum(e) {
		if (!Number.isSafeInteger(e) || e < 0 || e > this.size) throw RangeError(`missing output at index ${e}`);
		let t = this.capacity, n = this.capacity + e, r = 0;
		for (; t < n;) t % 2 == 1 && (r += this.values[t] ?? 0, t += 1), n % 2 == 1 && (--n, r += this.values[n] ?? 0), t = Math.floor(t / 2), n = Math.floor(n / 2);
		return r;
	}
	grow() {
		let e = this.capacity;
		this.capacity *= 2;
		let t = Array.from({ length: this.capacity * 2 }, () => 0);
		for (let n = 0; n < this.size; n += 1) t[this.capacity + n] = this.values[e + n] ?? 0;
		for (let e = this.capacity - 1; e > 0; --e) t[e] = (t[e * 2] ?? 0) + (t[e * 2 + 1] ?? 0);
		this.values = t;
	}
};
//#endregion
//#region node_modules/openai/internal/responses/canonical-output-text.mjs
function mu() {
	return {
		canonicalSnapshot: void 0,
		outputTextLengths: /* @__PURE__ */ new WeakMap(),
		outputTextIndex: new pu()
	};
}
function hu(e, t) {
	if (t.type !== "message") return "";
	let n = "";
	for (let e of t.content) e.type === "output_text" && (n += e.text);
	return e.outputTextLengths.set(t, n.length), n;
}
function gu(e, t) {
	if (e.canonicalSnapshot === t) return;
	let n = new pu(), r = "";
	for (let i of t.output) {
		let t = hu(e, i);
		r += t, n.append(t.length);
	}
	t.output_text = r, e.outputTextIndex = n, e.canonicalSnapshot = t;
}
function _u(e, t) {
	e.canonicalSnapshot = void 0, e.outputTextLengths = /* @__PURE__ */ new WeakMap(), e.outputTextIndex = new pu();
	let n = structuredClone(t);
	return !Object.getOwnPropertyDescriptor(n, "output_text") || n.output_text === null || n.output_text === void 0 ? gu(e, n) : n.output.length === 0 && n.output_text === "" && (e.canonicalSnapshot = n), n;
}
function vu(e, t, n, r, i) {
	let a = e.outputTextLengths.get(t);
	if (a !== void 0) {
		let o = a - r.length + i.length;
		e.outputTextLengths.set(t, o), e.outputTextIndex.update(n, o);
	}
}
function yu(e, t, n) {
	if (t.length === 0) {
		e.output_text += n;
		return;
	}
	e.output_text = e.output_text.slice(0, e.output_text.length - t.length) + n;
}
function bu(e, t, n, r) {
	if (n === void 0 || t?.type !== "message") return 0;
	if (n < t.content.length - n - 1) {
		let e = 0;
		for (let r = 0; r < n; r += 1) {
			let n = t.content[r];
			n?.type === "output_text" && (e += n.text.length);
		}
		return e;
	}
	let i = 0;
	for (let e = n + 1; e < t.content.length; e += 1) {
		let n = t.content[e];
		n?.type === "output_text" && (i += n.text.length);
	}
	return (e.outputTextLengths.get(t) ?? hu(e, t).length) - i - r.length;
}
function xu(e, t, n, r, i, a) {
	if (r === i) return;
	let o = t.output[n];
	if (n === t.output.length - 1 && (a === void 0 || o?.type === "message" && a === o.content.length - 1)) {
		yu(t, r, i);
		return;
	}
	let s = bu(e, o, a, i), c = e.outputTextIndex.prefixSum(n) + s;
	if (c + r.length === t.output_text.length) {
		yu(t, r, i);
		return;
	}
	t.output_text = t.output_text.slice(0, c) + i + t.output_text.slice(c + r.length);
}
//#endregion
//#region node_modules/openai/internal/responses/response-accumulator.mjs
var Su = /* @__PURE__ */ new WeakMap();
function Cu(e, t, n, r = !1) {
	if (!Number.isSafeInteger(t) || t < 0 || t > e.length || (t === e.length ? !r || t in e : !E(e, t))) throw new c(`missing ${n} at index ${t}`);
}
function wu(e, t, n) {
	if (t !== e.length) throw new c(`missing ${n} at index ${t}`);
	Cu(e, t, n, !0);
}
function Z(e, t) {
	Cu(e.output, t, "output");
	let n = e.output[t];
	if (!n) throw new c(`missing output at index ${t}`);
	return n;
}
function Tu(e) {
	return e.type === "function_call" || e.type === "custom_tool_call" || e.type === "shell_call" || e.type === "shell_call_output";
}
function Eu(e, t) {
	if (!E(e, "type") || typeof e.type != "string") throw new c(`expected an own output item type for ${t}`);
	let n = e.type === "function_call" || e.type === "custom_tool_call", r = [];
	if (E(e, "id")) {
		if (typeof e.id != "string" || e.id.length === 0) throw new c(`expected a non-empty output item id for ${t}`);
		r.push(`id:${e.id}`);
	} else if (!n) throw new c(`expected a non-empty output item id for ${t}`);
	if (Tu(e)) {
		if (!E(e, "call_id") || typeof e.call_id != "string" || e.call_id.length === 0) throw new c(`expected a non-empty output item call_id for ${t}`);
		r.push(`call:${e.type}:${e.call_id}`);
	}
	return r;
}
function Du(e, t) {
	for (let n of t) if (e.has(n)) throw new c(`duplicate output item identity '${n}'`);
}
function Ou(e, t) {
	Du(e, t);
	for (let n of t) e.add(n);
}
function ku(e) {
	let t = {
		snapshot: e,
		output: e.output,
		length: e.output.length,
		identities: /* @__PURE__ */ new Set()
	};
	for (let n = 0; n < e.output.length; n += 1) {
		let r = Z(e, n);
		Ou(t.identities, Eu(r, "response snapshot"));
	}
	return t;
}
function Au(e, t) {
	let n = Su.get(e);
	if (n && n.snapshot === t && n.output === t.output && n.length === t.output.length) return n;
	let r = ku(t);
	return Su.set(e, r), r;
}
function ju(e, t) {
	let n = mu(), r = _u(n, t), i = ku(r);
	return e.canonicalSnapshot = n.canonicalSnapshot, e.outputTextLengths = n.outputTextLengths, e.outputTextIndex = n.outputTextIndex, Su.set(e, i), r;
}
var Mu = {
	"response.output_text.delta": "message",
	"response.output_text.done": "message",
	"response.output_text.annotation.added": "message",
	"response.refusal.delta": "message",
	"response.refusal.done": "message",
	"response.function_call_arguments.delta": "function_call",
	"response.function_call_arguments.done": "function_call",
	"response.custom_tool_call_input.delta": "custom_tool_call",
	"response.custom_tool_call_input.done": "custom_tool_call",
	"response.mcp_call_arguments.delta": "mcp_call",
	"response.mcp_call_arguments.done": "mcp_call",
	"response.mcp_call.in_progress": "mcp_call",
	"response.mcp_call.completed": "mcp_call",
	"response.mcp_call.failed": "mcp_call",
	"response.shell_call_output_content.delta": "shell_call_output",
	"response.shell_call_output_content.done": "shell_call_output",
	"response.reasoning_text.delta": "reasoning",
	"response.reasoning_text.done": "reasoning",
	"response.reasoning_summary_part.added": "reasoning",
	"response.reasoning_summary_part.done": "reasoning",
	"response.reasoning_summary_text.delta": "reasoning",
	"response.reasoning_summary_text.done": "reasoning",
	"response.code_interpreter_call_code.delta": "code_interpreter_call",
	"response.code_interpreter_call_code.done": "code_interpreter_call",
	"response.code_interpreter_call.in_progress": "code_interpreter_call",
	"response.code_interpreter_call.interpreting": "code_interpreter_call",
	"response.code_interpreter_call.completed": "code_interpreter_call",
	"response.file_search_call.in_progress": "file_search_call",
	"response.file_search_call.searching": "file_search_call",
	"response.file_search_call.completed": "file_search_call",
	"response.web_search_call.in_progress": "web_search_call",
	"response.web_search_call.searching": "web_search_call",
	"response.web_search_call.completed": "web_search_call",
	"response.image_generation_call.in_progress": "image_generation_call",
	"response.image_generation_call.generating": "image_generation_call",
	"response.image_generation_call.completed": "image_generation_call",
	"response.image_generation_call.partial_image": "image_generation_call",
	"response.mcp_list_tools.in_progress": "mcp_list_tools",
	"response.mcp_list_tools.completed": "mcp_list_tools",
	"response.mcp_list_tools.failed": "mcp_list_tools"
};
function Nu(e) {
	return e.type === "response.content_part.added" || e.type === "response.content_part.done" ? e.part.type === "reasoning_text" ? "reasoning" : "message" : Mu[e.type];
}
function Pu(e, t) {
	let n = Z(t, e.output_index), r = e.item;
	if (Eu(n, e.type), Eu(r, e.type), !E(r, "type") || n.type !== r.type) throw new c(`expected output item type '${n.type}', got '${r.type}'`);
	let i = E(n, "id") ? n.id : void 0, a = E(r, "id") ? r.id : void 0;
	if (i !== a) throw new c(`expected output item id '${i}', got '${a}'`);
	if (Tu(n) && Tu(r) && n.call_id !== r.call_id) throw new c(`expected output item call_id '${n.call_id}', got '${r.call_id}'`);
}
function Fu(e, t, n) {
	if (e.type === "response.output_item.done") {
		Pu(e, t);
		return;
	}
	if (n && (e.type === "response.shell_call_command.added" || e.type === "response.shell_call_command.delta" || e.type === "response.shell_call_command.done")) {
		let n = Z(t, e.output_index);
		if (!E(n, "type") || n.type !== "shell_call") throw new c(`expected output item type 'shell_call', got '${n.type}'`);
		return;
	}
	if (e.type !== "response.content_part.added" && e.type !== "response.content_part.done" && !E(Mu, e.type)) return;
	let r = e;
	if (!E(e, "item_id") || typeof r.item_id != "string" || r.item_id.length === 0) throw new c(`expected a non-empty item_id for ${e.type}`);
	let i = Z(t, r.output_index), a = E(i, "id") ? i.id : void 0;
	if (a !== r.item_id) throw new c(`expected item_id '${a}', got '${r.item_id}'`);
	let o = Nu(r);
	if (i.type !== o) throw new c(`expected output item type '${o}', got '${i.type}'`);
}
function Iu(e, t) {
	Cu(e, t, "content");
	let n = e[t];
	if (!n) throw new c(`missing content at index ${t}`);
	return n;
}
function Lu(e, t, n) {
	let r = e.output.find((e) => e.type === "shell_call" && e.call_id === t.call_id);
	for (r ? Cu(r.action.commands, n, "command") : Cu(t.output, n, "content", !0); t.output.length <= n;) t.output.push({
		stdout: "",
		stderr: "",
		outcome: {
			type: "exit",
			exit_code: 0
		}
	});
	return Iu(t.output, n);
}
function Ru(e) {
	return new Set(e);
}
var zu = Ru(/* @__PURE__ */ "response.output_item.added,response.output_item.done,response.content_part.added,response.content_part.done,response.output_text.delta,response.output_text.done,response.output_text.annotation.added,response.refusal.delta,response.refusal.done,response.function_call_arguments.delta,response.function_call_arguments.done,response.custom_tool_call_input.delta,response.custom_tool_call_input.done,response.mcp_call_arguments.delta,response.mcp_call_arguments.done,response.shell_call_command.added,response.shell_call_command.done,response.shell_call_command.delta,response.shell_call_output_content.delta,response.shell_call_output_content.done,response.reasoning_text.delta,response.reasoning_text.done,response.reasoning_summary_part.added,response.reasoning_summary_part.done,response.reasoning_summary_text.delta,response.reasoning_summary_text.done,response.code_interpreter_call_code.delta,response.code_interpreter_call_code.done,response.code_interpreter_call.in_progress,response.code_interpreter_call.interpreting,response.code_interpreter_call.completed,response.file_search_call.in_progress,response.file_search_call.searching,response.file_search_call.completed,response.web_search_call.in_progress,response.web_search_call.searching,response.web_search_call.completed,response.image_generation_call.in_progress,response.image_generation_call.generating,response.image_generation_call.completed,response.mcp_call.in_progress,response.mcp_call.completed,response.mcp_call.failed,response.created,response.queued,response.in_progress,response.completed,response.failed,response.incomplete,response.audio.delta,response.audio.done,response.audio.transcript.delta,response.audio.transcript.done,response.image_generation_call.partial_image,response.mcp_list_tools.in_progress,response.mcp_list_tools.completed,response.mcp_list_tools.failed,keepalive,error".split(","));
function Bu(e) {
	throw new c("Unhandled response stream event: unknown");
}
var Vu = [
	"item_id",
	"output_index",
	"content_index",
	"annotation_index",
	"command_index",
	"summary_index"
];
function Hu(e) {
	let t;
	try {
		t = Object.getOwnPropertyDescriptor(e, "type");
	} catch {
		return Bu(e);
	}
	let n = t?.value;
	if (typeof n != "string" || !zu.has(n)) return Bu(e);
	let r = /* @__PURE__ */ new Map([["type", n]]);
	if (n === "response.output_item.added" || n === "response.output_item.done" || n === "response.content_part.added" || n === "response.content_part.done" || n === "response.shell_call_command.added" || n === "response.shell_call_command.delta" || n === "response.shell_call_command.done" || E(Mu, n)) try {
		for (let t of Vu) {
			let n = Object.getOwnPropertyDescriptor(e, t);
			r.set(t, n ? Reflect.get(e, t, e) : void 0);
		}
		n === "response.output_item.done" ? r.set("item", structuredClone(Reflect.get(e, "item", e))) : (n === "response.content_part.added" || n === "response.content_part.done") && r.set("part", structuredClone(Reflect.get(e, "part", e)));
	} catch {
		return Bu(e);
	}
	return new Proxy(e, { get(e, t) {
		return r.has(t) ? r.get(t) : Reflect.get(e, t, e);
	} });
}
function Uu(e, t, n) {
	switch (e.type) {
		case "response.output_item.added": {
			wu(t.output, e.output_index, "output");
			let r = Au(n, t), i = structuredClone(e.item), a = Eu(i, e.type);
			Du(r.identities, a), i.type === "message" && gu(n, t), t.output.push(i), Ou(r.identities, a), r.length = t.output.length;
			let o = hu(n, i);
			return n.canonicalSnapshot === t && n.outputTextIndex.append(o.length), o && (t.output_text += o), !0;
		}
		case "response.output_item.done": {
			let r = Z(t, e.output_index), i = hu(n, r), a = e.item;
			(r.type === "message" || a.type === "message") && gu(n, t), t.output[e.output_index] = a;
			let o = hu(n, a);
			return n.canonicalSnapshot === t && n.outputTextIndex.update(e.output_index, o.length), xu(n, t, e.output_index, i, o), !0;
		}
		default: return !1;
	}
}
function Wu(e, t, n) {
	switch (e.type) {
		case "response.content_part.added": {
			let r = Z(t, e.output_index), { type: i } = r, { part: a } = e;
			if (i === "message" && a.type !== "reasoning_text") {
				wu(r.content, e.content_index, "content");
				let i = a;
				i.type === "output_text" && gu(n, t), r.content.push(i), i.type === "output_text" && (vu(n, r, e.output_index, "", i.text), xu(n, t, e.output_index, "", i.text, e.content_index));
			} else if (i === "reasoning" && a.type === "reasoning_text") {
				let t = r.content ?? [];
				wu(t, e.content_index, "content"), r.content ||= t, t.push(a);
			}
			return !0;
		}
		default: return !1;
	}
}
function Gu(e, t, n) {
	switch (e.type) {
		case "response.content_part.done": {
			let r = Z(t, e.output_index), { part: i } = e;
			if (r.type === "message" && i.type !== "reasoning_text") {
				let a = Iu(r.content, e.content_index), o = a.type === "output_text" ? a.text : "", s = i;
				(a.type === "output_text" || s.type === "output_text") && gu(n, t), r.content[e.content_index] = s;
				let c = s.type === "output_text" ? s.text : "";
				vu(n, r, e.output_index, o, c), xu(n, t, e.output_index, o, c, e.content_index);
			} else if (r.type === "reasoning" && i.type === "reasoning_text") {
				let { content: t } = r;
				if (!t) throw new c(`missing content at index ${e.content_index}`);
				Iu(t, e.content_index), t[e.content_index] = i;
			}
			return !0;
		}
		default: return !1;
	}
}
function Ku(e, t, n) {
	switch (e.type) {
		case "response.output_text.delta": {
			let r = Z(t, e.output_index);
			if (r.type === "message") {
				let i = Iu(r.content, e.content_index);
				if (i.type !== "output_text") throw new c(`expected content to be 'output_text', got ${i.type}`);
				let a = i.text;
				gu(n, t), i.text = a + e.delta, vu(n, r, e.output_index, a, i.text), e.output_index === t.output.length - 1 && e.content_index === r.content.length - 1 ? t.output_text += e.delta : xu(n, t, e.output_index, a, i.text, e.content_index);
			}
			return !0;
		}
		case "response.output_text.done": {
			let r = Z(t, e.output_index);
			if (r.type === "message") {
				let i = Iu(r.content, e.content_index);
				if (i.type !== "output_text") throw new c(`expected content to be 'output_text', got ${i.type}`);
				let a = i.text;
				gu(n, t), i.text = e.text, vu(n, r, e.output_index, a, e.text), xu(n, t, e.output_index, a, e.text, e.content_index);
			}
			return !0;
		}
		case "response.output_text.annotation.added": {
			let n = Z(t, e.output_index);
			if (n.type === "message") {
				let t = Iu(n.content, e.content_index);
				if (t.type !== "output_text") throw new c(`expected content to be 'output_text', got ${t.type}`);
				Cu(t.annotations, e.annotation_index, "annotation", !0), t.annotations[e.annotation_index] = structuredClone(e.annotation);
			}
			return !0;
		}
		default: return !1;
	}
}
function qu(e, t) {
	switch (e.type) {
		case "response.refusal.delta": {
			let n = Z(t, e.output_index);
			if (n.type === "message") {
				let t = Iu(n.content, e.content_index);
				if (t.type !== "refusal") throw new c(`expected content to be 'refusal', got ${t.type}`);
				t.refusal += e.delta;
			}
			return !0;
		}
		case "response.refusal.done": {
			let n = Z(t, e.output_index);
			if (n.type === "message") {
				let t = Iu(n.content, e.content_index);
				if (t.type !== "refusal") throw new c(`expected content to be 'refusal', got ${t.type}`);
				t.refusal = e.refusal;
			}
			return !0;
		}
		case "response.function_call_arguments.delta": {
			let n = Z(t, e.output_index);
			return n.type === "function_call" && (n.arguments += e.delta), !0;
		}
		case "response.function_call_arguments.done": {
			let n = Z(t, e.output_index);
			return n.type === "function_call" && (n.arguments = e.arguments), !0;
		}
		case "response.custom_tool_call_input.delta": {
			let n = Z(t, e.output_index);
			return n.type === "custom_tool_call" && (n.input += e.delta), !0;
		}
		case "response.custom_tool_call_input.done": {
			let n = Z(t, e.output_index);
			return n.type === "custom_tool_call" && (n.input = e.input), !0;
		}
		case "response.mcp_call_arguments.delta": {
			let n = Z(t, e.output_index);
			return n.type === "mcp_call" && (n.arguments += e.delta), !0;
		}
		case "response.mcp_call_arguments.done": {
			let n = Z(t, e.output_index);
			return n.type === "mcp_call" && (n.arguments = e.arguments), !0;
		}
		default: return !1;
	}
}
function Ju(e, t) {
	switch (e.type) {
		case "response.shell_call_command.added":
		case "response.shell_call_command.done": {
			let n = Z(t, e.output_index);
			if (n.type === "shell_call") {
				let t = e.type === "response.shell_call_command.added";
				Cu(n.action.commands, e.command_index, "command", t), n.action.commands[e.command_index] = e.command;
			}
			return !0;
		}
		case "response.shell_call_command.delta": {
			let n = Z(t, e.output_index);
			return n.type === "shell_call" && (Cu(n.action.commands, e.command_index, "command"), n.action.commands[e.command_index] += e.delta), !0;
		}
		case "response.shell_call_output_content.delta": {
			let n = Z(t, e.output_index);
			if (n.type === "shell_call_output") {
				let r = Lu(t, n, e.command_index);
				r.stdout += e.delta.stdout ?? "", r.stderr += e.delta.stderr ?? "";
			}
			return !0;
		}
		case "response.shell_call_output_content.done": {
			let n = Z(t, e.output_index);
			if (n.type === "shell_call_output") {
				let r = Iu(e.output, 0);
				Lu(t, n, e.command_index), n.output[e.command_index] = structuredClone(r);
			}
			return !0;
		}
		default: return !1;
	}
}
function Yu(e, t) {
	switch (e.type) {
		case "response.reasoning_text.delta": {
			let n = Z(t, e.output_index);
			if (n.type === "reasoning") {
				if (!n.content) throw new c(`missing content at index ${e.content_index}`);
				let t = Iu(n.content, e.content_index);
				if (t.type !== "reasoning_text") throw new c(`expected content to be 'reasoning_text', got ${t.type}`);
				t.text += e.delta;
			}
			return !0;
		}
		case "response.reasoning_text.done": {
			let n = Z(t, e.output_index);
			if (n.type === "reasoning") {
				if (!n.content) throw new c(`missing content at index ${e.content_index}`);
				let t = Iu(n.content, e.content_index);
				if (t.type !== "reasoning_text") throw new c(`expected content to be 'reasoning_text', got ${t.type}`);
				t.text = e.text;
			}
			return !0;
		}
		case "response.reasoning_summary_part.added": {
			let n = Z(t, e.output_index);
			return n.type === "reasoning" && (wu(n.summary, e.summary_index, "content"), n.summary.push(structuredClone(e.part))), !0;
		}
		case "response.reasoning_summary_part.done": {
			let n = Z(t, e.output_index);
			return n.type === "reasoning" && (Iu(n.summary, e.summary_index), n.summary[e.summary_index] = structuredClone(e.part)), !0;
		}
		case "response.reasoning_summary_text.delta": {
			let n = Z(t, e.output_index);
			if (n.type === "reasoning") {
				let t = Iu(n.summary, e.summary_index);
				t.text += e.delta;
			}
			return !0;
		}
		case "response.reasoning_summary_text.done": {
			let n = Z(t, e.output_index);
			if (n.type === "reasoning") {
				let t = Iu(n.summary, e.summary_index);
				t.text = e.text;
			}
			return !0;
		}
		default: return !1;
	}
}
function Xu(e, t) {
	switch (e.type) {
		case "response.code_interpreter_call_code.delta": {
			let n = Z(t, e.output_index);
			return n.type === "code_interpreter_call" && (n.code = (n.code ?? "") + e.delta), !0;
		}
		case "response.code_interpreter_call_code.done": {
			let n = Z(t, e.output_index);
			return n.type === "code_interpreter_call" && (n.code = e.code), !0;
		}
		case "response.code_interpreter_call.in_progress": {
			let n = Z(t, e.output_index);
			return n.type === "code_interpreter_call" && (n.status = "in_progress"), !0;
		}
		case "response.code_interpreter_call.interpreting": {
			let n = Z(t, e.output_index);
			return n.type === "code_interpreter_call" && (n.status = "interpreting"), !0;
		}
		case "response.code_interpreter_call.completed": {
			let n = Z(t, e.output_index);
			return n.type === "code_interpreter_call" && (n.status = "completed"), !0;
		}
		default: return !1;
	}
}
function Zu(e, t) {
	switch (e.type) {
		case "response.file_search_call.in_progress": {
			let n = Z(t, e.output_index);
			return n.type === "file_search_call" && (n.status = "in_progress"), !0;
		}
		case "response.file_search_call.searching": {
			let n = Z(t, e.output_index);
			return n.type === "file_search_call" && (n.status = "searching"), !0;
		}
		case "response.file_search_call.completed": {
			let n = Z(t, e.output_index);
			return n.type === "file_search_call" && (n.status = "completed"), !0;
		}
		case "response.web_search_call.in_progress": {
			let n = Z(t, e.output_index);
			return n.type === "web_search_call" && (n.status = "in_progress"), !0;
		}
		case "response.web_search_call.searching": {
			let n = Z(t, e.output_index);
			return n.type === "web_search_call" && (n.status = "searching"), !0;
		}
		case "response.web_search_call.completed": {
			let n = Z(t, e.output_index);
			return n.type === "web_search_call" && (n.status = "completed"), !0;
		}
		default: return !1;
	}
}
function Qu(e, t) {
	switch (e.type) {
		case "response.image_generation_call.in_progress": {
			let n = Z(t, e.output_index);
			return n.type === "image_generation_call" && (n.status = "in_progress"), !0;
		}
		case "response.image_generation_call.generating": {
			let n = Z(t, e.output_index);
			return n.type === "image_generation_call" && (n.status = "generating"), !0;
		}
		case "response.image_generation_call.completed": {
			let n = Z(t, e.output_index);
			return n.type === "image_generation_call" && (n.status = "completed"), !0;
		}
		case "response.mcp_call.in_progress": {
			let n = Z(t, e.output_index);
			return n.type === "mcp_call" && (n.status = "in_progress"), !0;
		}
		case "response.mcp_call.completed": {
			let n = Z(t, e.output_index);
			return n.type === "mcp_call" && (n.status = "completed"), !0;
		}
		case "response.mcp_call.failed": {
			let n = Z(t, e.output_index);
			return n.type === "mcp_call" && (n.status = "failed"), !0;
		}
		default: return !1;
	}
}
function $u(e) {
	switch (e.type) {
		case "response.created":
		case "response.queued":
		case "response.in_progress":
		case "response.completed":
		case "response.failed":
		case "response.incomplete": return !0;
		default: return !1;
	}
}
function ed(e) {
	switch (e.type) {
		case "response.audio.delta":
		case "response.audio.done":
		case "response.audio.transcript.delta":
		case "response.audio.transcript.done":
		case "response.image_generation_call.partial_image":
		case "response.mcp_list_tools.in_progress":
		case "response.mcp_list_tools.completed":
		case "response.mcp_list_tools.failed":
		case "keepalive":
		case "error": return !0;
		default: return !1;
	}
}
function td() {
	return mu();
}
function nd(e, t, n, r = !1, i) {
	let a = Hu(e);
	if (i && a.type !== "keepalive" && i(a), !t) {
		if (a.type !== "response.created") throw new c(`When snapshot hasn't been set yet, expected 'response.created' event, got ${a.type}`);
		return ju(n, a.response);
	}
	return Fu(a, t, r), Uu(a, t, n) || Wu(a, t, n) || Gu(a, t, n) || Ku(a, t, n) || qu(a, t) || Ju(a, t) || Yu(a, t) || Xu(a, t) || Zu(a, t) || Qu(a, t) ? t : $u(a) ? ju(n, a.response) : ed(a) ? t : Bu(a);
}
//#endregion
//#region node_modules/openai/lib/responses/ResponseStream.mjs
var rd, id, ad, od, sd, cd, ld, ud, dd = class e extends eo {
	constructor(e) {
		super(), rd.add(this), id.set(this, void 0), ad.set(this, void 0), od.set(this, void 0), sd.set(this, td()), r(this, id, e, "f");
	}
	static createResponse(t, n, r) {
		let i = new e(n);
		return i._run(() => i._createOrRetrieveResponse(t, n, {
			...r,
			__metadata: {
				...r?.__metadata,
				helperMethod: "stream"
			}
		})), i;
	}
	static fromReadableStream(t) {
		let n = new e(null);
		return n._run(() => n._fromReadableStream(t)), n;
	}
	async _createOrRetrieveResponse(e, t, n) {
		this._listenForAbort(n?.signal), i(this, rd, "m", cd).call(this);
		let r, a = null;
		"response_id" in t ? (r = await e.responses.retrieve(t.response_id, { stream: !0 }, {
			...n,
			signal: this.controller.signal,
			stream: !0
		}), a = t.starting_after ?? null) : r = await e.responses.create({
			...t,
			stream: !0
		}, {
			...n,
			signal: this.controller.signal
		}), this._connected();
		for await (let e of r) i(this, rd, "m", ld).call(this, e, a);
		if (r.controller.signal?.aborted) throw new u();
		return i(this, rd, "m", ud).call(this);
	}
	async _fromReadableStream(e, t) {
		this._listenForAbort(t?.signal), i(this, rd, "m", cd).call(this), this._connected();
		let n = He.fromReadableStream(e, this.controller);
		for await (let e of n) i(this, rd, "m", ld).call(this, e, null);
		if (n.controller.signal?.aborted) throw new u();
		return i(this, rd, "m", ud).call(this);
	}
	[(id = /* @__PURE__ */ new WeakMap(), ad = /* @__PURE__ */ new WeakMap(), od = /* @__PURE__ */ new WeakMap(), sd = /* @__PURE__ */ new WeakMap(), rd = /* @__PURE__ */ new WeakSet(), cd = function() {
		this.ended || (r(this, ad, void 0, "f"), r(this, sd, td(), "f"));
	}, ld = function(e, t) {
		if (this.ended) return;
		let n = (e, n) => {
			(t == null || n.sequence_number > t) && this._emit(e, n);
		};
		if (e.type === "error") throw new l(void 0, "error" in e && typeof e.error == "object" && e.error !== null ? e.error : e, e.message, void 0);
		let a = e, o = nd(e, i(this, ad, "f"), i(this, sd, "f"), !0, (e) => {
			a = e;
		});
		switch (r(this, ad, o, "f"), n("event", e), a.type) {
			case "response.output_text.delta": {
				let e = o.output[a.output_index];
				if (!e) throw new c(`missing output at index ${a.output_index}`);
				if (e.type === "message") {
					let t = e.content[a.content_index];
					if (!t) throw new c(`missing content at index ${a.content_index}`);
					if (t.type !== "output_text") throw new c(`expected content to be 'output_text', got ${t.type}`);
					n("response.output_text.delta", {
						...a,
						type: a.type,
						item_id: a.item_id,
						output_index: a.output_index,
						content_index: a.content_index,
						snapshot: t.text
					});
				}
				break;
			}
			case "response.function_call_arguments.delta": {
				let e = o.output[a.output_index];
				if (!e) throw new c(`missing output at index ${a.output_index}`);
				e.type === "function_call" && n("response.function_call_arguments.delta", {
					...a,
					type: a.type,
					item_id: a.item_id,
					output_index: a.output_index,
					snapshot: e.arguments
				});
				break;
			}
			default: n(a.type, e);
		}
	}, ud = function() {
		if (this.ended) throw new c("stream has ended, this shouldn't happen");
		let e = i(this, ad, "f");
		if (!e) throw new c("request ended without sending any events");
		r(this, ad, void 0, "f"), r(this, sd, td(), "f");
		let t = fd(e, i(this, id, "f"));
		return r(this, od, t, "f"), t;
	}, Symbol.asyncIterator)]() {
		return this._createIterator((e) => {
			let t = (t) => e(t);
			return this.on("event", t), () => this.off("event", t);
		}, { onReturn: () => this.abort() });
	}
	async finalResponse() {
		await this.done();
		let e = i(this, od, "f");
		if (!e) throw new c("stream ended without producing a Response");
		return e;
	}
};
function fd(e, t) {
	return iu(e, t);
}
//#endregion
//#region node_modules/openai/resources/responses/input-items.mjs
var pd = class extends z {
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/responses/${e}/input_items`, M, {
			query: t,
			...n,
			__security: { bearerAuth: !0 }
		});
	}
}, md = class extends z {
	count(e = {}, t) {
		return this._client.post("/responses/input_tokens", {
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
}, hd = class extends z {
	constructor() {
		super(...arguments), this.inputItems = new pd(this._client), this.inputTokens = new md(this._client);
	}
	create(e, t) {
		return this._client.post("/responses", {
			body: e,
			...t,
			stream: e.stream ?? !1,
			__security: { bearerAuth: !0 }
		})._thenUnwrap((e) => ("object" in e && e.object === "response" && fu(e), e));
	}
	retrieve(e, t = {}, n) {
		return this._client.get(B`/responses/${e}`, {
			query: t,
			...n,
			stream: t?.stream ?? !1,
			__security: { bearerAuth: !0 }
		})._thenUnwrap((e) => ("object" in e && e.object === "response" && fu(e), e));
	}
	delete(e, t) {
		return this._client.delete(B`/responses/${e}`, {
			...t,
			headers: P([{ Accept: "*/*" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	parse(e, t) {
		return this._client.responses.create(e, t)._thenUnwrap((t) => au(t, e));
	}
	stream(e, t) {
		return dd.createResponse(this._client, e, t);
	}
	cancel(e, t) {
		return this._client.post(B`/responses/${e}/cancel`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	compact(e, t) {
		return this._client.post("/responses/compact", {
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
};
hd.InputItems = pd, hd.InputTokens = md;
//#endregion
//#region node_modules/openai/resources/safety/alerts.mjs
var gd = class extends z {
	retrieve(e, t) {
		return this._client.get(B`/safety/alerts/${e}`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
}, _d = class extends z {
	constructor() {
		super(...arguments), this.alerts = new gd(this._client);
	}
};
_d.Alerts = gd;
//#endregion
//#region node_modules/openai/resources/skills/content.mjs
var vd = class extends z {
	retrieve(e, t) {
		return this._client.get(B`/skills/${e}/content`, {
			...t,
			headers: P([{ Accept: "application/binary" }, t?.headers]),
			__security: { bearerAuth: !0 },
			__binaryResponse: !0
		});
	}
}, yd = class extends z {
	retrieve(e, t, n) {
		let { skill_id: r } = t;
		return this._client.get(B`/skills/${r}/versions/${e}/content`, {
			...n,
			headers: P([{ Accept: "application/binary" }, n?.headers]),
			__security: { bearerAuth: !0 },
			__binaryResponse: !0
		});
	}
}, bd = class extends z {
	constructor() {
		super(...arguments), this.content = new yd(this._client);
	}
	create(e, t = {}, n) {
		return this._client.post(B`/skills/${e}/versions`, Tr({
			body: t,
			...n,
			__security: { bearerAuth: !0 }
		}, this._client, { stripFilenames: !1 }));
	}
	retrieve(e, t, n) {
		let { skill_id: r } = t;
		return this._client.get(B`/skills/${r}/versions/${e}`, {
			...n,
			__security: { bearerAuth: !0 }
		});
	}
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/skills/${e}/versions`, M, {
			query: t,
			...n,
			__security: { bearerAuth: !0 }
		});
	}
	delete(e, t, n) {
		let { skill_id: r } = t;
		return this._client.delete(B`/skills/${r}/versions/${e}`, {
			...n,
			__security: { bearerAuth: !0 }
		});
	}
};
bd.Content = yd;
//#endregion
//#region node_modules/openai/resources/skills/skills.mjs
var xd = class extends z {
	constructor() {
		super(...arguments), this.content = new vd(this._client), this.versions = new bd(this._client);
	}
	create(e = {}, t) {
		return this._client.post("/skills", Tr({
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		}, this._client, { stripFilenames: !1 }));
	}
	retrieve(e, t) {
		return this._client.get(B`/skills/${e}`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	update(e, t, n) {
		return this._client.post(B`/skills/${e}`, {
			body: t,
			...n,
			__security: { bearerAuth: !0 }
		});
	}
	list(e = {}, t) {
		return this._client.getAPIList("/skills", M, {
			query: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/skills/${e}`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
};
xd.Content = vd, xd.Versions = bd;
//#endregion
//#region node_modules/openai/resources/uploads/parts.mjs
var Sd = class extends z {
	create(e, t, n) {
		return this._client.post(B`/uploads/${e}/parts`, Er({
			body: t,
			...n,
			__security: { bearerAuth: !0 }
		}, this._client));
	}
}, Cd = class extends z {
	constructor() {
		super(...arguments), this.parts = new Sd(this._client);
	}
	create(e, t) {
		return this._client.post("/uploads", {
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	cancel(e, t) {
		return this._client.post(B`/uploads/${e}/cancel`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	complete(e, t, n) {
		return this._client.post(B`/uploads/${e}/complete`, {
			body: t,
			...n,
			__security: { bearerAuth: !0 }
		});
	}
};
Cd.Parts = Sd;
//#endregion
//#region node_modules/openai/lib/vector-store-polling.mjs
function wd(e, t, n, r) {
	return Sl((i) => e.retrieve(n, { vector_store_id: t }, {
		...r,
		headers: i
	}), ["in_progress"], ["failed", "completed"], r);
}
function Td(e, t, n, r) {
	return Sl((i) => e.retrieve(n, { vector_store_id: t }, {
		...r,
		headers: i
	}), ["in_progress"], [
		"failed",
		"cancelled",
		"completed"
	], r);
}
//#endregion
//#region node_modules/openai/lib/Util.mjs
var Ed = async (e) => {
	let t = await Promise.allSettled(e), n = t.filter((e) => e.status === "rejected");
	if (n.length) throw Object.defineProperty(/* @__PURE__ */ Error(`${n.length} promise(s) failed`), "rejections", {
		configurable: !0,
		value: n.map(({ reason: e }) => e),
		writable: !0
	});
	let r = [];
	for (let e of t) e.status === "fulfilled" && r.push(e.value);
	return r;
};
//#endregion
//#region node_modules/openai/lib/vector-store-upload.mjs
async function Dd(e, t, n, r, i, a) {
	if (r == null || r.length === 0) throw Error("No `files` provided to process. If you've already uploaded files you should use `.createAndPoll()` instead");
	let o = a?.maxConcurrency ?? 5, s = Math.min(o, r.length), c = r.values(), l = [...i];
	async function u(e) {
		for (let n of e) {
			let e = await t.files.create({
				file: n,
				purpose: "assistants"
			}, a);
			l.push(e.id);
		}
	}
	let d = [];
	d.length = s;
	for (let e = 0; e < d.length; e += 1) d[e] = u(c);
	return await Ed(d), await e.createAndPoll(n, { file_ids: l }, a);
}
//#endregion
//#region node_modules/openai/resources/vector-stores/file-batches.mjs
var Od = class extends z {
	create(e, t, n) {
		return this._client.post(B`/vector_stores/${e}/file_batches`, {
			body: t,
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	retrieve(e, t, n) {
		let { vector_store_id: r } = t;
		return this._client.get(B`/vector_stores/${r}/file_batches/${e}`, {
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	cancel(e, t, n) {
		let { vector_store_id: r } = t;
		return this._client.post(B`/vector_stores/${r}/file_batches/${e}/cancel`, {
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	async createAndPoll(e, t, n) {
		let r = await this.create(e, t, n);
		return await this.poll(e, r.id, n);
	}
	listFiles(e, t, n) {
		let { vector_store_id: r, ...i } = t;
		return this._client.getAPIList(B`/vector_stores/${r}/file_batches/${e}/files`, M, {
			query: i,
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	async poll(e, t, n) {
		return await Td(this, e, t, n);
	}
	async uploadAndPoll(e, { files: t, fileIds: n = [] }, r) {
		return await Dd(this, this._client, e, t, n, r);
	}
}, kd = class extends z {
	create(e, t, n) {
		return this._client.post(B`/vector_stores/${e}/files`, {
			body: t,
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	retrieve(e, t, n) {
		let { vector_store_id: r } = t;
		return this._client.get(B`/vector_stores/${r}/files/${e}`, {
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	update(e, t, n) {
		let { vector_store_id: r, ...i } = t;
		return this._client.post(B`/vector_stores/${r}/files/${e}`, {
			body: i,
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	list(e, t = {}, n) {
		return this._client.getAPIList(B`/vector_stores/${e}/files`, M, {
			query: t,
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	delete(e, t, n) {
		let { vector_store_id: r } = t;
		return this._client.delete(B`/vector_stores/${r}/files/${e}`, {
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	async createAndPoll(e, t, n) {
		let r = await this.create(e, t, n);
		return await this.poll(e, r.id, n);
	}
	async poll(e, t, n) {
		return await wd(this, e, t, n);
	}
	async upload(e, t, n) {
		let r = await this._client.files.create({
			file: t,
			purpose: "assistants"
		}, n);
		return this.create(e, { file_id: r.id }, n);
	}
	async uploadAndPoll(e, t, n) {
		let r = await this.upload(e, t, n);
		return await this.poll(e, r.id, n);
	}
	content(e, t, n) {
		let { vector_store_id: r } = t;
		return this._client.getAPIList(B`/vector_stores/${r}/files/${e}/content`, Lt, {
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
}, Ad = class extends z {
	constructor() {
		super(...arguments), this.files = new kd(this._client), this.fileBatches = new Od(this._client);
	}
	create(e, t) {
		return this._client.post("/vector_stores", {
			body: e,
			...t,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	retrieve(e, t) {
		return this._client.get(B`/vector_stores/${e}`, {
			...t,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	update(e, t, n) {
		return this._client.post(B`/vector_stores/${e}`, {
			body: t,
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	list(e = {}, t) {
		return this._client.getAPIList("/vector_stores", M, {
			query: e,
			...t,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/vector_stores/${e}`, {
			...t,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, t?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
	search(e, t, n) {
		return this._client.getAPIList(B`/vector_stores/${e}/search`, Lt, {
			body: t,
			method: "post",
			...n,
			headers: P([{ "OpenAI-Beta": "assistants=v2" }, n?.headers]),
			__security: { bearerAuth: !0 }
		});
	}
};
Ad.Files = kd, Ad.FileBatches = Od;
//#endregion
//#region node_modules/openai/resources/videos.mjs
var jd = class extends z {
	create(e, t) {
		return this._client.post("/videos", Er({
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		}, this._client));
	}
	retrieve(e, t) {
		return this._client.get(B`/videos/${e}`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	list(e = {}, t) {
		return this._client.getAPIList("/videos", N, {
			query: e,
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	delete(e, t) {
		return this._client.delete(B`/videos/${e}`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	createCharacter(e, t) {
		return this._client.post("/videos/characters", Er({
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		}, this._client));
	}
	downloadContent(e, t = {}, n) {
		return this._client.get(B`/videos/${e}/content`, {
			query: t,
			...n,
			headers: P([{ Accept: "application/binary" }, n?.headers]),
			__security: { bearerAuth: !0 },
			__binaryResponse: !0
		});
	}
	edit(e, t) {
		return this._client.post("/videos/edits", Er({
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		}, this._client));
	}
	extend(e, t) {
		return this._client.post("/videos/extensions", Er({
			body: e,
			...t,
			__security: { bearerAuth: !0 }
		}, this._client));
	}
	getCharacter(e, t) {
		return this._client.get(B`/videos/characters/${e}`, {
			...t,
			__security: { bearerAuth: !0 }
		});
	}
	remix(e, t, n) {
		return this._client.post(B`/videos/${e}/remix`, Tr({
			body: t,
			...n,
			__security: { bearerAuth: !0 }
		}, this._client));
	}
}, Md = 32, Nd = 32;
function Pd(e) {
	return e.split(" ", 33).length > Md;
}
function* Fd(e) {
	let t = 0;
	for (; t <= e.length;) {
		let n = e.indexOf(" ", t), r = e.slice(t, n === -1 ? void 0 : n);
		if (yield r.startsWith("v1,") ? r.slice(3) : r, n === -1) break;
		t = n + 1;
	}
}
function Id(e) {
	try {
		let t = xc(e);
		return t.byteLength === Nd ? t : void 0;
	} catch {
		return;
	}
}
function Ld(e) {
	for (let t of Fd(e)) {
		let e = Id(t);
		if (e) return e;
	}
}
function Rd(e, t, n) {
	let r = n;
	for (let n of Fd(e)) {
		let e = Id(n);
		if (!e) continue;
		let i = 0;
		for (let [n, r] of e.entries()) i |= r ^ (t[n] ?? 0);
		i === 0 && (r = e);
	}
	return r;
}
async function zd(e, t, n, r, i, a) {
	let o = Number.parseInt(n, 10);
	if (Number.isNaN(o)) throw new S("Invalid webhook timestamp format");
	let s = Math.floor(Date.now() / 1e3);
	if (s - o > a) throw new S("Webhook timestamp is too old");
	if (o > s + a) throw new S("Webhook timestamp is too new");
	let c = Pd(t), l = c ? Ld(t) : void 0;
	if (c && !l) throw new S("The given webhook signature does not match the expected signature");
	let u = Uint8Array.from(i.startsWith("whsec_") ? xc(i.slice(6)) : ge(i)), d = r ? `${r}.${n}.${e}` : `${n}.${e}`, f = Uint8Array.from(ge(d)), p = await crypto.subtle.importKey("raw", u, {
		name: "HMAC",
		hash: "SHA-256"
	}, !1, c ? ["sign", "verify"] : ["verify"]);
	if (c && l) {
		let e = Rd(t, new Uint8Array(await crypto.subtle.sign("HMAC", p, f)), l);
		try {
			if (await crypto.subtle.verify("HMAC", p, Uint8Array.from(e), f)) return;
		} catch {}
		throw new S("The given webhook signature does not match the expected signature");
	}
	for (let e of Fd(t)) try {
		let t = Uint8Array.from(xc(e));
		if (await crypto.subtle.verify("HMAC", p, t, f)) return;
	} catch {}
	throw new S("The given webhook signature does not match the expected signature");
}
//#endregion
//#region node_modules/openai/resources/webhooks/webhooks.mjs
var Bd, Vd, Hd, Ud = class extends z {
	constructor() {
		super(...arguments), Bd.add(this);
	}
	async unwrap(e, t, n = this._client.webhookSecret, r = 300) {
		return await this.verifySignature(e, t, n, r), JSON.parse(e);
	}
	async verifySignature(e, t, n = this._client.webhookSecret, r = 300) {
		if (typeof crypto > "u" || typeof crypto.subtle?.importKey != "function" || typeof crypto.subtle.verify != "function") throw Error("Webhook signature verification is only supported when the `crypto` global is defined");
		i(this, Bd, "m", Vd).call(this, n);
		let a = P([t]).values, o = i(this, Bd, "m", Hd).call(this, a, "webhook-signature"), s = i(this, Bd, "m", Hd).call(this, a, "webhook-timestamp"), c = i(this, Bd, "m", Hd).call(this, a, "webhook-id");
		if (Pd(o) && typeof crypto.subtle.sign != "function") throw Error("Webhook signature verification is only supported when the `crypto` global is defined");
		return await zd(e, o, s, c, n, r);
	}
};
Bd = /* @__PURE__ */ new WeakSet(), Vd = function(e) {
	if (typeof e != "string" || e.length === 0) throw Error("The webhook secret must either be set using the env var, OPENAI_WEBHOOK_SECRET, on the client class, OpenAI({ webhookSecret: '123' }), or passed to this function");
}, Hd = function(e, t) {
	if (!e) throw Error("Headers are required");
	let n = e.get(t);
	if (n == null) throw Error(`Missing required header: ${t}`);
	return n;
};
//#endregion
//#region node_modules/openai/internal/provider.mjs
var Wd = Symbol.for("openai.node.providerDefinitions.v1"), Gd = globalThis, Kd = Gd[Wd], qd = Kd ?? /* @__PURE__ */ new WeakMap();
Kd || Object.defineProperty(Gd, Wd, { value: qd });
function Jd(e) {
	let t = qd.get(e);
	if (!t) throw Error("Invalid provider. Providers must be created with createProvider().");
	return t.configure();
}
//#endregion
//#region node_modules/openai/client.mjs
var Yd, Xd, Zd, Q, Qd, $d, ef, tf, nf;
function rf() {
	if ($e()) return !0;
	let e = globalThis;
	return typeof e.WorkerGlobalScope == "function" && e instanceof e.WorkerGlobalScope && typeof e.WorkerNavigator == "function" && e.navigator instanceof e.WorkerNavigator && typeof e.navigator?.userAgent == "string" && e.navigator.userAgent !== "Cloudflare-Workers" && e.process?.versions?.node === void 0 && e.Deno === void 0 && e.Bun === void 0 && e.EdgeRuntime === void 0 && e.WebSocketPair === void 0;
}
var af = "workload-identity-auth", of = Symbol("inheritedDataResidencySelection"), $ = class {
	constructor(e = {}) {
		Yd.add(this), Zd.set(this, void 0), Q.set(this, void 0), Qd.set(this, void 0), $d.set(this, void 0), ef.set(this, !1), tf.set(this, /* @__PURE__ */ new WeakMap()), this.completions = new Dl(this), this.chat = new Es(this), this.embeddings = new Fl(this), this.files = new Bl(this), this.images = new Zl(this), this.contentProvenanceChecks = new jl(this), this.audio = new sc(this), this.moderations = new $l(this), this.models = new Ql(this), this.fineTuning = new Jl(this), this.graders = new Xl(this), this.vectorStores = new Ad(this), this.safety = new _d(this), this.webhooks = new Ud(this), this.beta = new El(this), this.batches = new cc(this), this.uploads = new Cd(this), this.admin = new rc(this), this.responses = new hd(this), this.realtime = new ru(this), this.conversations = new Nl(this), this.evals = new Rl(this), this.containers = new Al(this), this.skills = new xd(this), this.videos = new jd(this);
		let { credential: t, options: n } = pr(e);
		e = n;
		let a = At(e), o = e.provider, { baseURL: s = o ? null : q("OPENAI_BASE_URL"), dataResidency: l, [of]: u = !1, apiKey: d = o ? null : q("OPENAI_API_KEY") ?? null, adminAPIKey: f = o ? null : q("OPENAI_ADMIN_KEY") ?? null, organization: p = o ? null : q("OPENAI_ORG_ID") ?? null, project: m = o ? null : q("OPENAI_PROJECT_ID") ?? null, webhookSecret: h = q("OPENAI_WEBHOOK_SECRET") ?? null, workloadIdentity: g, x509Transport: _, credential: v, ...y } = e;
		if (o) {
			let t = [
				"apiKey",
				"adminAPIKey",
				"workloadIdentity",
				"x509Transport",
				"baseURL",
				"dataResidency"
			].filter((t) => (t === "workloadIdentity" ? g : e[t]) != null);
			if (t.length) throw new c(`The \`provider\` option cannot be used with ${t.map((e) => `\`${e}\``).join(", ")}. Configure authentication and the base URL through the provider instead.`);
		}
		let b = cr(g) ? {
			x509: g,
			legacy: void 0
		} : {
			x509: void 0,
			legacy: g
		}, x = b.x509, ee = x !== void 0, S = o ? Jd(o) : void 0, C = {
			apiKey: d,
			adminAPIKey: f,
			organization: p,
			project: m,
			webhookSecret: h,
			workloadIdentity: g,
			x509Transport: _,
			provider: o,
			...y,
			baseURL: S?.baseURL ?? a ?? (s || (ee ? "https://mtls.api.openai.com/v1" : "https://api.openai.com/v1"))
		};
		if (_ && !ee) throw new c("An X.509 transport requires an X.509 workload identity.");
		if (ee) {
			if (a !== void 0 || u) throw new c("X.509 workload identity does not support data residency selection.");
			if (e.fetch !== void 0) throw new c("X.509 workload identity does not support a custom fetch implementation.");
			if (Zt(C.baseURL), ur(C.fetchOptions), this.fetchWithAuth !== Xd.prototype.fetchWithAuth || this.fetchWithTimeout !== Xd.prototype.fetchWithTimeout) throw new c("X.509 workload identity does not support overridden fetch dispatch hooks.");
		}
		if (d && g) throw new c("The `apiKey` and `workloadIdentity` options are mutually exclusive");
		if (!S && !d && !f && !g) throw new c("Missing credentials. Please pass an `apiKey`, `workloadIdentity`, `adminAPIKey`, or set the `OPENAI_API_KEY` or `OPENAI_ADMIN_KEY` environment variable.");
		if (!C.dangerouslyAllowBrowser && rf()) throw new c("It looks like you're running in a browser-like environment.\n\nThis is disabled by default, as it risks exposing your secret API credentials to attackers.\nIf you understand the risks and have appropriate mitigations in place,\nyou can set the `dangerouslyAllowBrowser` option to `true`, e.g.,\n\nnew OpenAI({ apiKey, dangerouslyAllowBrowser: true });\n\nhttps://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety\n");
		this.baseURL = C.baseURL, r(this, ef, a !== void 0 || u, "f"), this.timeout = C.timeout ?? Xd.DEFAULT_TIMEOUT, this.logger = C.logger ?? console;
		let te = "warn";
		this.logLevel = te, this.logLevel = ke(C.logLevel, "ClientOptions.logLevel", this) ?? ke(q("OPENAI_LOG"), "process.env['OPENAI_LOG']", this) ?? te, this.fetchOptions = C.fetchOptions, this.maxRetries = C.maxRetries ?? 2, this.fetch = C.fetch ?? ue(), r(this, Zd, lt, "f");
		let w = o || t ? void 0 : q("OPENAI_CUSTOM_HEADERS");
		if (w) {
			let e = {};
			for (let t of w.split("\n")) {
				let n = t.indexOf(":");
				n >= 0 && (e[t.substring(0, n).trim()] = t.substring(n + 1).trim());
			}
			C.defaultHeaders = P([e, C.defaultHeaders]);
		}
		if (this._options = C, this._provider = S, x) {
			let e = new fr(x, _, p, m);
			this._workloadIdentityAuth = e, r(this, Q, e, "f"), r(this, Qd, t, "f"), r(this, $d, e.fetch(), "f"), this.fetch = i(this, $d, "f"), On(this);
		} else b.legacy && (this._workloadIdentityAuth = new Xt(b.legacy, this.fetch));
		this.apiKey = typeof d == "string" ? d : null, this.adminAPIKey = f, this.organization = p, this.project = m, this.webhookSecret = h;
	}
	withOptions(e) {
		let t = At(e), n = i(this, Q, "f"), a = {
			...this._options,
			baseURL: this.baseURL,
			maxRetries: this.maxRetries,
			timeout: this.timeout,
			logger: this.logger,
			logLevel: this.logLevel,
			fetch: i(this, Q, "f") ? void 0 : this.fetch,
			fetchOptions: this.fetchOptions,
			apiKey: this._options.apiKey,
			adminAPIKey: this.adminAPIKey,
			workloadIdentity: n?.identitySnapshot() ?? this._options.workloadIdentity,
			x509Transport: this._options.x509Transport,
			organization: this.organization,
			project: this.project,
			webhookSecret: this.webhookSecret
		}, { credential: o, provider: s } = gr(a, e, i(this, Qd, "f"), n !== void 0);
		t !== void 0 && delete a.baseURL;
		let c = {
			...a,
			...e,
			credential: o,
			provider: s,
			[of]: i(this, ef, "f") && t === void 0 && !E(e, "baseURL") && e.credential === void 0 && !s
		}, l = new this.constructor(c);
		return s && new URL(l.baseURL).origin !== new URL(this.baseURL).origin && (Object.assign(l._options, {
			defaultHeaders: e.defaultHeaders,
			defaultQuery: e.defaultQuery,
			fetchOptions: e.fetchOptions,
			fetch: e.fetch
		}), l.fetchOptions = e.fetchOptions, l.fetch = e.fetch ?? ue(), l.organization = e.organization ?? null, l.project = e.project ?? null), i(this, Q, "f") && i(l, Q, "f") && this.baseURL === l.baseURL && i(this, Q, "f").matches(i(l, Q, "f")) && (l._workloadIdentityAuth = i(this, Q, "f"), r(l, Q, i(this, Q, "f"), "f"), r(l, $d, i(this, $d, "f"), "f")), l;
	}
	defaultQuery() {
		return this._options.defaultQuery;
	}
	validateHeaders({ values: e, nulls: t }, n = {
		bearerAuth: !0,
		adminAPIKeyAuth: !0
	}) {
		if (!(e.get("authorization") || e.get("api-key")) && !(t.has("authorization") || t.has("api-key")) && !(this._workloadIdentityAuth && n.bearerAuth)) throw Error("Could not resolve authentication method. Expected either apiKey or adminAPIKey to be set. Or for one of the \"Authorization\" or \"api-key\" headers to be explicitly omitted");
	}
	async authHeaders(e, t = {
		bearerAuth: !0,
		adminAPIKeyAuth: !0
	}) {
		return (i(this, Q, "f") ?? this._workloadIdentityAuth) instanceof fr && t.adminAPIKeyAuth && this.adminAPIKey !== null ? await this.adminAPIKeyAuth(e) : P([t.bearerAuth ? await this.bearerAuth(e) : null, t.adminAPIKeyAuth ? await this.adminAPIKeyAuth(e) : null]);
	}
	async bearerAuth(e) {
		let t = i(this, Q, "f") ?? this._workloadIdentityAuth;
		if (t) {
			if (t instanceof fr) {
				if (t === this._workloadIdentityAuth && (this.fetchWithAuth !== Xd.prototype.fetchWithAuth || this.fetchWithTimeout !== Xd.prototype.fetchWithTimeout)) throw new c("X.509 workload identity does not support overridden fetch dispatch hooks.");
				let n = t.headerSnapshots();
				if (!fr.shouldAuthenticate(e, n.defaultHeaders, n.requestHeaders)) return;
			}
			return P([{ Authorization: `Bearer ${t instanceof fr ? await t.getToken(e, {
				apiURL: t.requestAPIURL(),
				...t.headerSnapshots(),
				...t.requestSnapshot(),
				signal: t.effectiveSignal(),
				...t.tenantSnapshot()
			}) : await t.getToken()}` }]);
		}
		if (this.apiKey != null) return P([{ Authorization: `Bearer ${this.apiKey}` }]);
	}
	async adminAPIKeyAuth(e) {
		if (this.adminAPIKey != null) return P([{ Authorization: `Bearer ${this.adminAPIKey}` }]);
	}
	stringifyQuery(e) {
		return Ot(e);
	}
	getUserAgent() {
		return `${this.constructor.name}/JS ${Qe}`;
	}
	defaultIdempotencyKey() {
		return `stainless-node-retry-${a()}`;
	}
	makeStatusError(e, t, n, r) {
		let i = t && typeof t == "object" && t.error == null ? { error: t } : t;
		return l.generate(e, i, n, r);
	}
	async _callApiKey() {
		if (this._provider) return !1;
		let e = this._options.apiKey;
		if (typeof e != "function") return !1;
		let t;
		try {
			t = await e();
		} catch (e) {
			throw e instanceof c ? e : new c(`Failed to get token from 'apiKey' function: ${e.message}`, { cause: e });
		}
		if (typeof t != "string" || !t) throw new c(`Expected 'apiKey' function argument to return a string but it returned ${t}`);
		return this.apiKey = t, !0;
	}
	buildURL(e, t, n) {
		let r = !i(this, Yd, "m", nf).call(this) && n || this.baseURL, a = ne(e) ? new URL(e) : new URL(r + (r.endsWith("/") && e.startsWith("/") ? e.slice(1) : e)), o = this.defaultQuery(), s = Object.fromEntries(a.searchParams);
		return (!ae(o) || !ae(s)) && (t = {
			...s,
			...o,
			...t
		}), typeof t == "object" && t && !Array.isArray(t) && (a.search = this.stringifyQuery(t)), a.toString();
	}
	async prepareOptions(e) {
		this._provider || (e.__security ?? { bearerAuth: !0 }).bearerAuth && await this._callApiKey();
	}
	async prepareRequest(e, { url: t, options: n }) {}
	get(e, t) {
		return this.methodRequest("get", e, t);
	}
	post(e, t) {
		return this.methodRequest("post", e, t);
	}
	patch(e, t) {
		return this.methodRequest("patch", e, t);
	}
	put(e, t) {
		return this.methodRequest("put", e, t);
	}
	delete(e, t) {
		return this.methodRequest("delete", e, t);
	}
	methodRequest(e, t, n) {
		return this.request(Promise.resolve(n).then((n) => ({
			method: e,
			path: t,
			...n
		})));
	}
	request(e, t = null) {
		let n = i(this, Q, "f") ?? this._workloadIdentityAuth, r = n instanceof fr ? Promise.resolve(e).then((e) => n.runRequest(() => this.makeRequest(e, t, void 0), this)) : this.makeRequest(e, t, void 0);
		return this.responsePromise(r);
	}
	responsePromise(e, t = (e, t) => this.parseResponseWithTimeout(e, t)) {
		let n = new Nt(this, e, (e, n) => {
			let r = i(this, tf, "f").get(n.controller)?.continueRequest;
			return r ? r(() => t(e, n)) : t(e, n);
		});
		return n.withResponse = async () => {
			let t = await n, { response: r } = await e;
			return {
				data: t,
				response: r,
				request_id: r.headers.get("x-request-id")
			};
		}, n._thenUnwrap = (n) => this.responsePromise(e, async (e, r) => Ze(n(await t(e, r), r), r.response)), n;
	}
	async parseResponseWithTimeout(e, t) {
		if (t.options.stream || t.options.__binaryResponse || t.response.status === 204 || t.response.headers.get("content-length") === "0") return Ye(e, t);
		for (;;) {
			let n = i(this, tf, "f").get(t.controller), r = n?.timeout ?? t.options.timeout ?? this.timeout, a = n?.authentication, o = a ? t.controller.signal : t.options.signal, s = () => a && o ? this._makeUserAbortError(o) : new u(), l;
			try {
				l = a?.remainingTimeout(t.options, r) ?? Math.max(0, t.startTime + r - Date.now());
			} catch (e) {
				let n = o?.aborted ? s() : void 0;
				throw t.controller.abort(), me(t.response.body).catch(() => void 0), n ?? e;
			}
			let p, m, h = !1;
			try {
				if (o?.aborted && n?.helperMethod !== "runTools") throw s();
				let r = new Promise((e, n) => {
					p = setTimeout(() => {
						h = !0, t.controller.abort(), n(new f());
					}, l), o && (m = () => {
						h || n(s());
					}, o.addEventListener("abort", m, { once: !0 }));
				});
				return await Promise.race([Ye(e, t), r]);
			} catch (e) {
				if (o?.aborted && !h) throw s();
				if (!h) throw a && e instanceof SyntaxError ? SyntaxError("X.509 workload identity API response contains invalid JSON.") : a && !(e instanceof c) ? new d({ message: "X.509 workload identity API response body could not be read." }) : e;
				let r = n?.retriesRemaining ?? 0;
				if (!r || n?.hasStreamingBody || t.options.__metadata?.hasStreamingBody || globalThis.ReadableStream && t.options.body instanceof globalThis.ReadableStream || typeof t.options.body == "object" && t.options.body !== null && (Symbol.asyncIterator in t.options.body || Symbol.iterator in t.options.body && "next" in t.options.body && typeof t.options.body.next == "function")) throw new f();
				p !== void 0 && clearTimeout(p), m && o?.removeEventListener("abort", m), m = void 0;
				let i = await this.retryRequest(t.options, r, t.retryOfRequestLogID ?? t.requestLogID);
				Object.assign(t, i);
			} finally {
				p !== void 0 && clearTimeout(p), m && o?.removeEventListener("abort", m);
			}
		}
	}
	async readX509ResponseError(e, t, n, r, i) {
		let a = new AbortController(), o = r.signal, s = !1, c = () => a.abort(o.reason);
		o.addEventListener("abort", c, { once: !0 }), o.aborted && c();
		try {
			let r = i.remainingTimeout(t, n), s = i.waitForRetry(r, a.signal).then(() => {
				throw new f();
			}), c = await Promise.race([e.text().catch(() => "X.509 workload identity API response body could not be read."), s]);
			if (o.aborted) throw this._makeUserAbortError(o);
			return c;
		} catch (t) {
			throw t instanceof f && (s = !o.aborted, r.abort(), me(e.body).catch(() => void 0)), o.aborted && !s ? this._makeUserAbortError(o) : t;
		} finally {
			o.removeEventListener("abort", c), a.abort();
		}
	}
	async makeRequest(e, t, n) {
		let r = await e, a = r.maxRetries ?? this.maxRetries;
		t ??= a;
		let c = i(this, Q, "f");
		c?.beginRequestPreparation(), await this.prepareOptions(r), c?.beginRequestPlanning();
		let l;
		try {
			let e = await this.buildRequest(r, { retryCount: a - t });
			if (l = {
				req: e.req,
				url: e.url,
				timeout: e.timeout
			}, c) {
				se("timeout", l.timeout), c.authorizePlannedRequest(l.url, l.req, l.timeout), fr.isStreamingRequestBody(l.req.body) && (r.__metadata = {
					...r.__metadata,
					hasStreamingBody: !0
				}), await this.prepareRequest(l.req, {
					url: l.url,
					options: r
				}), await this._provider?.prepareRequest?.(l.req, {
					url: l.url,
					options: r
				}), c.beginRequestPlanning(), c.authorizePlannedRequest(l.url, l.req, l.timeout, !0), fr.isStreamingRequestBody(l.req.body) && (r.__metadata = {
					...r.__metadata,
					hasStreamingBody: !0
				});
				let e = c.requestSnapshot().signal;
				if (e?.aborted || l.req.signal?.aborted) throw this._makeUserAbortError(e?.aborted ? e : l.req.signal);
				c.setEffectiveSignal(l.req.signal || e ? cf(l.req.signal ?? e, e).signal : void 0), c.beginRequestNetwork();
				let t = r.__security ?? { bearerAuth: !0 }, n = await this.authHeaders(r, t), i = c.headerSnapshots(), a = P([i.defaultHeaders, i.requestHeaders]);
				for (let [e, t] of n?.values ?? []) !a.nulls.has(e) && !l.req.headers.has(e) && l.req.headers.set(e, t);
				this.validateHeaders(P([a, l.req.headers]), t);
			}
		} catch (e) {
			if (c?.retireRequestBody(), c && t && !r.__metadata?.hasStreamingBody && fr.isRetryableFailure(e)) return await this.retryRequest(r, t, n ?? "x509-token-exchange", fr.retryHeaders(e));
			throw e;
		}
		let { req: u, url: p } = l, m = c ? Math.min(l.timeout, c.requestSnapshot().timeout) : l.timeout;
		c?.bindRequest(r, u, this.adminAPIKey);
		let h = r.__metadata?.hasStreamingBody === !0;
		c || (await this.prepareRequest(u, {
			url: p,
			options: r
		}), await this._provider?.prepareRequest?.(u, {
			url: p,
			options: r
		})), c?.adoptRequestHeaders(u), c && fr.isStreamingRequestBody(u.body) && (h = !0);
		let g = "log_" + (Math.random() * (1 << 24) | 0).toString(16).padStart(6, "0"), _ = n === void 0 ? "" : `, retryOf: ${n}`, v = c?.requestStartedAt(r) ?? Date.now();
		A(this).debug(`[${g}] sending request`, ze({
			retryOfRequestLogID: n,
			method: r.method,
			url: p,
			options: c ? {
				body: u.body,
				...c.requestSnapshot()
			} : r,
			headers: u.headers
		}));
		let y = c ? c.requestSnapshot().signal : r.signal;
		if (y?.aborted || u.signal?.aborted) throw this._makeUserAbortError(y?.aborted ? y : u.signal);
		let b = r.__security ?? { bearerAuth: !0 }, x = c || this.fetchWithTimeout === Xd.prototype.fetchWithTimeout ? cf(u.signal ?? (c ? y : void 0), c ? y : void 0) : new AbortController(), ee = c?.remainingTimeout(r, m) ?? m, S = c ? Xd.prototype.fetchWithAuth : this.fetchWithAuth;
		c?.releaseRequestBody(u.body);
		let w = await S.call(this, p, u, ee, x, b).catch(s), ne = Date.now();
		if (w instanceof globalThis.Error) {
			let e = `retrying, ${t} attempts remaining`;
			if (y?.aborted || u.signal?.aborted) throw this._makeUserAbortError(y?.aborted ? y : u.signal);
			let i = o(w) || /timed? ?out/i.test(String(w) + ("cause" in w ? String(w.cause) : ""));
			if (t && !h && (!c || Tn(w))) return A(this).info(`[${g}] connection ${i ? "timed out" : "failed"} - ${e}`), A(this).debug(`[${g}] connection ${i ? "timed out" : "failed"} (${e})`, ze({
				retryOfRequestLogID: n,
				url: p,
				durationMs: ne - v,
				message: c ? "X.509 workload identity API connection failed." : w.message
			})), this.retryRequest(r, t, n ?? g);
			let a = h ? "error; streaming body cannot be retried" : "error; no more retries left";
			if (A(this).info(`[${g}] connection ${i ? "timed out" : "failed"} - ${a}`), A(this).debug(`[${g}] connection ${i ? "timed out" : "failed"} (${a})`, ze({
				retryOfRequestLogID: n,
				url: p,
				durationMs: ne - v,
				message: c ? "X.509 workload identity API connection failed." : w.message
			})), w instanceof C || w instanceof te) throw w;
			if (i) {
				let e = "cause" in w ? w.cause : void 0, t = typeof e == "object" && e && "code" in e && e.code === "UND_ERR_HEADERS_TIMEOUT" ? new f({ message: "Request timed out. Node.js fetch timed out waiting for response headers; configure a matching undici fetch and fetchOptions.dispatcher with an Agent whose headersTimeout is at least the SDK timeout." }) : new f();
				throw c ? new f() : Object.assign(t, { cause: w });
			}
			throw c ? new d({ message: "X.509 workload identity API connection failed." }) : new d({
				message: lf(w),
				cause: w
			});
		}
		let T = `[${g}${_}${[...w.headers.entries()].filter(([e]) => e === "x-request-id").map(([e, t]) => ", " + e + ": " + JSON.stringify(t)).join("")}] ${u.method} ${Re(p)} ${w.ok ? "succeeded" : "failed"} with status ${w.status} in ${ne - v}ms`;
		if (!w.ok) {
			let e = w.status === 401 && c && b.bearerAuth && c.usedWorkloadToken(r);
			if (e && c.invalidateToken(), w.status === 401 && (c || this._workloadIdentityAuth) && b.bearerAuth && (!c || c.usedWorkloadToken(r)) && (!c || t > 0) && !h && !r.__metadata?.workloadIdentityTokenRefreshed) {
				c ? me(w.body).catch(() => void 0) : (await me(w.body), this._workloadIdentityAuth?.invalidateToken());
				let e = {
					...r,
					__metadata: {
						...r.__metadata,
						workloadIdentityTokenRefreshed: !0
					}
				};
				return this.makeRequest(e, c ? t - 1 : t, n ?? g);
			}
			let i = e && r.__metadata?.workloadIdentityTokenRefreshed ? !1 : await this.shouldRetry(w);
			if (t && i && !h) {
				let e = `retrying, ${t} attempts remaining`;
				return c ? me(w.body).catch(() => void 0) : await me(w.body), A(this).info(`${T} - ${e}`), A(this).debug(`[${g}] response error (${e})`, ze({
					retryOfRequestLogID: n,
					url: w.url,
					status: w.status,
					headers: w.headers,
					durationMs: ne - v
				})), this.retryRequest(r, t, n ?? g, w.headers);
			}
			let a = i ? h ? "error; streaming body cannot be retried" : "error; no more retries left" : "error; not retryable";
			A(this).info(`${T} - ${a}`);
			let o = c ? await this.readX509ResponseError(w, r, m, x, c) : await w.text().catch((e) => s(e).message), l = ce(o), u = l ? void 0 : o;
			throw A(this).debug(`[${g}] response error (${a})`, ze({
				retryOfRequestLogID: n,
				url: w.url,
				status: w.status,
				headers: w.headers,
				message: u,
				durationMs: Date.now() - v
			})), this.makeStatusError(w.status, l, u, w.headers);
		}
		A(this).info(T), A(this).debug(`[${g}] response start`, ze({
			retryOfRequestLogID: n,
			url: w.url,
			status: w.status,
			headers: w.headers,
			durationMs: ne - v
		}));
		let re = c?.continuation();
		return c?.releaseRequestCredentials(), i(this, tf, "f").set(x, {
			timeout: m,
			retriesRemaining: t,
			hasStreamingBody: h,
			...c ? { authentication: c } : {},
			helperMethod: r.__metadata?.helperMethod,
			...re ? { continueRequest: re } : {}
		}), {
			response: w,
			options: r,
			controller: x,
			requestLogID: g,
			retryOfRequestLogID: n,
			startTime: v
		};
	}
	getAPIList(e, t, n) {
		return this.requestAPIList(t, n && "then" in n ? n.then((t) => ({
			method: "get",
			path: e,
			...t
		})) : {
			method: "get",
			path: e,
			...n
		});
	}
	requestAPIList(e, t) {
		let n = i(this, Q, "f") ?? this._workloadIdentityAuth, r = n instanceof fr ? Promise.resolve(t).then((e) => n.runRequest(() => this.makeRequest(e, null, void 0), this)) : this.makeRequest(t, null, void 0), a = new It(this, r, e), o = this.responsePromise(r, async (t, n) => {
			let r = await this.parseResponseWithTimeout(t, n);
			return new e(t, n.response, r, n.options);
		});
		return a.then = o.then.bind(o), a.catch = o.catch.bind(o), a.finally = o.finally.bind(o), a.withResponse = o.withResponse.bind(o), a._thenUnwrap = o._thenUnwrap.bind(o), a;
	}
	async fetchWithAuth(e, t, n, r, a = {
		bearerAuth: !0,
		adminAPIKeyAuth: !0
	}) {
		if (this._workloadIdentityAuth && !i(this, $d, "f") && a.bearerAuth) {
			let e = t.headers, n = e.get("Authorization");
			if (!n || n === `Bearer ${af}`) {
				let t = await this._workloadIdentityAuth.getToken();
				e.set("Authorization", `Bearer ${t}`);
			}
		}
		return await (i(this, $d, "f") ? Xd.prototype.fetchWithTimeout : this.fetchWithTimeout).call(this, e, t, n, r);
	}
	async fetchWithTimeout(e, t, n, r) {
		let { signal: a, method: o, ...s } = t || {}, c = this._makeAbort(r), l = !!a && sf.get(r) === a;
		a && !l && a.addEventListener("abort", c, { once: !0 });
		let u = setTimeout(c, n), d = globalThis.ReadableStream && s.body instanceof globalThis.ReadableStream || typeof s.body == "object" && s.body !== null && Symbol.asyncIterator in s.body, f = {
			signal: r.signal,
			...d ? { duplex: "half" } : {},
			method: "GET",
			...s
		};
		o && (f.method = o.toUpperCase());
		try {
			return await (i(this, $d, "f") ?? this.fetch).call(void 0, e, f);
		} catch (e) {
			throw a && !l && a.removeEventListener("abort", c), e;
		} finally {
			clearTimeout(u);
		}
	}
	async shouldRetry(e) {
		let t = e.headers.get("x-should-retry");
		return t === "true" ? !0 : t === "false" ? !1 : e.status === 408 || e.status === 409 || e.status === 429 || e.status >= 500;
	}
	async retryRequest(e, t, n, r) {
		let a, o = r?.get("retry-after-ms");
		if (o) {
			let e = parseFloat(o);
			Number.isNaN(e) || (a = e);
		}
		let s = r?.get("retry-after");
		if (s && a === void 0) {
			let e = parseFloat(s);
			a = Number.isNaN(e) ? Date.parse(s) - Date.now() : e * 1e3;
		}
		if (a === void 0 || !Number.isFinite(a) || a < 0 || a > 6e4) {
			let n = e.maxRetries ?? this.maxRetries;
			a = this.calculateDefaultRetryTimeoutMillis(t, n);
		}
		let c = i(this, Q, "f");
		if (c) {
			let t = c.remainingTimeout(e, c.requestSnapshot().timeout);
			if (a >= t) throw new f();
		}
		return c ? await c.waitForRetry(a, c.effectiveSignal()) : await le(a), this.makeRequest(e, t - 1, n);
	}
	calculateDefaultRetryTimeoutMillis(e, t) {
		let n = t - e;
		return Math.min(.5 * 2 ** n, 8) * (1 - Math.random() * .25) * 1e3;
	}
	async buildRequest(e, { retryCount: t = 0 } = {}) {
		if (i(this, Q, "f") && !i(this, Q, "f").inRequest(this)) {
			let n = i(this, Q, "f");
			return await n.runRequest(async () => {
				let r = await Xd.prototype.buildRequest.call(this, e, { retryCount: t });
				return n.releaseRequestBody(r.req.body), r;
			}, this);
		}
		let n = { ...e }, r = i(this, Q, "f"), a = r?.snapshotTenant(this.organization, this.project), o = r?.snapshotHeaders(this._options.defaultHeaders, n.headers);
		o && (n.headers = o.requestHeaders);
		let s = r ? dr(this.fetchOptions) : void 0, c = r ? dr(n.fetchOptions) : void 0, { method: l, path: u, query: d, defaultBaseURL: f } = n, p = this.buildURL(u, d, f);
		r?.snapshotAPIURL(p);
		let m = "timeout" in n;
		if (m && se("timeout", n.timeout), n.timeout = n.timeout ?? this.timeout, r && c && r.snapshotRequest(n.signal, n.timeout, c), r) {
			let e = r.requestSnapshot();
			n.timeout = e.timeout, e.signal === void 0 ? delete n.signal : n.signal = e.signal;
		}
		let { bodyHeaders: h, body: g, isStreamingBody: _ } = this.buildBody({ options: n });
		return _ && (e.__metadata = {
			...e.__metadata,
			hasStreamingBody: !0
		}, r?.ownRequestBody(g, n.body)), {
			req: {
				method: l,
				headers: await this.buildHeaders({
					options: e,
					method: l,
					bodyHeaders: h,
					retryCount: t,
					x509Headers: o,
					x509Timeout: m ? n.timeout : void 0,
					x509Tenant: a
				}),
				...n.signal && { signal: n.signal },
				...globalThis.ReadableStream && g instanceof globalThis.ReadableStream && { duplex: "half" },
				...g && { body: g },
				...(r ? s : this.fetchOptions) ?? {},
				...(r ? c : n.fetchOptions) ?? {}
			},
			url: p,
			timeout: n.timeout
		};
	}
	async buildHeaders({ options: e, method: t, bodyHeaders: n, retryCount: r, x509Headers: a, x509Timeout: o, x509Tenant: s }) {
		let c = {};
		this.idempotencyHeader && t !== "get" && (e.idempotencyKey ||= this.defaultIdempotencyKey(), c[this.idempotencyHeader] = e.idempotencyKey);
		let l = e.__metadata?.helperMethod, u = a ? o : e.timeout, d = P([
			c,
			{
				Accept: "application/json",
				...rf() ? void 0 : { "User-Agent": this.getUserAgent() },
				"X-Stainless-Retry-Count": String(r),
				...u ? { "X-Stainless-Timeout": String(Math.trunc(u / 1e3)) } : {},
				...ot(),
				...typeof l == "string" ? { "X-Stainless-Helper-Method": l } : {},
				"OpenAI-Organization": s ? s.organization : this.organization,
				"OpenAI-Project": s ? s.project : this.project
			},
			this._provider || i(this, Q, "f")?.isPlanningRequest() ? void 0 : await this.authHeaders(e, e.__security ?? { bearerAuth: !0 }),
			a?.defaultHeaders ?? this._options.defaultHeaders,
			n,
			a?.requestHeaders ?? e.headers
		]);
		return !this._provider && !i(this, Q, "f")?.isPlanningRequest() && this.validateHeaders(d, e.__security ?? { bearerAuth: !0 }), d.values;
	}
	_makeAbort(e) {
		return () => e.abort();
	}
	_makeUserAbortError(e) {
		let t = new u();
		return Object.defineProperty(t, "cause", {
			value: e.reason,
			writable: !0,
			configurable: !0
		}), t;
	}
	buildBody({ options: e }) {
		let { body: t, headers: n } = e;
		if (!t) return t === void 0 && "body" in e ? {
			...i(this, Zd, "f").call(this, {
				body: t,
				headers: P([n])
			}),
			isStreamingBody: !1
		} : {
			bodyHeaders: void 0,
			body: void 0,
			isStreamingBody: !1
		};
		let r = P([n]), a = globalThis.ReadableStream !== void 0 && t instanceof globalThis.ReadableStream, o = !a && (typeof t == "string" || t instanceof ArrayBuffer || ArrayBuffer.isView(t) || globalThis.Blob !== void 0 && t instanceof globalThis.Blob || t instanceof URLSearchParams || t instanceof FormData);
		return ArrayBuffer.isView(t) || t instanceof ArrayBuffer || t instanceof DataView || typeof t == "string" && r.values.has("content-type") || globalThis.Blob && t instanceof globalThis.Blob || t instanceof FormData || t instanceof URLSearchParams || a ? {
			bodyHeaders: void 0,
			body: t,
			isStreamingBody: !o
		} : typeof t == "object" && (Symbol.asyncIterator in t || Symbol.iterator in t && "next" in t && typeof t.next == "function") ? {
			bodyHeaders: void 0,
			body: fe(t),
			isStreamingBody: !0
		} : typeof t == "object" && r.values.get("content-type") === "application/x-www-form-urlencoded" ? {
			bodyHeaders: { "content-type": "application/x-www-form-urlencoded" },
			body: this.stringifyQuery(t),
			isStreamingBody: !1
		} : {
			...i(this, Zd, "f").call(this, {
				body: t,
				headers: r
			}),
			isStreamingBody: !1
		};
	}
};
Xd = $, Zd = /* @__PURE__ */ new WeakMap(), Q = /* @__PURE__ */ new WeakMap(), Qd = /* @__PURE__ */ new WeakMap(), $d = /* @__PURE__ */ new WeakMap(), ef = /* @__PURE__ */ new WeakMap(), tf = /* @__PURE__ */ new WeakMap(), Yd = /* @__PURE__ */ new WeakSet(), nf = function() {
	return i(this, ef, "f") || this._provider !== void 0 || this.baseURL !== "https://api.openai.com/v1";
}, $.OpenAI = Xd, $.DEFAULT_TIMEOUT = 6e5, $.OpenAIError = c, $.APIError = l, $.APIConnectionError = d, $.APIConnectionTimeoutError = f, $.APIUserAbortError = u, $.NotFoundError = g, $.ConflictError = _, $.RateLimitError = y, $.BadRequestError = p, $.AuthenticationError = m, $.InternalServerError = b, $.PermissionDeniedError = h, $.UnprocessableEntityError = v, $.InvalidWebhookSignatureError = S, $.toFile = $r, $.toStreamingFile = vr, $.Completions = Dl, $.Chat = Es, $.Embeddings = Fl, $.Files = Bl, $.Images = Zl, $.ContentProvenanceChecks = jl, $.Audio = sc, $.Moderations = $l, $.Models = Ql, $.FineTuning = Jl, $.Graders = Xl, $.VectorStores = Ad, $.Safety = _d, $.Webhooks = Ud, $.Beta = El, $.Batches = cc, $.Uploads = Cd, $.Admin = rc, $.Responses = hd, $.Realtime = ru, $.Conversations = Nl, $.Evals = Rl, $.Containers = Al, $.Skills = xd, $.Videos = jd;
var sf = /* @__PURE__ */ new WeakMap();
function cf(e, t) {
	let n = new AbortController();
	if (!e) return n;
	let r = globalThis.AbortSignal;
	if (typeof r?.any != "function" || !(e instanceof r)) return n;
	try {
		let i = [n.signal, e];
		t && t !== e && i.push(t);
		let a = r.any(i);
		Object.defineProperty(n, "signal", {
			value: a,
			configurable: !0
		}), sf.set(n, e);
	} catch {}
	return n;
}
function lf(e) {
	if (uf(e)) return "Connection error. This may be caused by passing an undici dispatcher, such as ProxyAgent, that is incompatible with the fetch implementation. If you are using undici's ProxyAgent, pass the fetch implementation from the same undici package: import { fetch, ProxyAgent } from 'undici'; new OpenAI({ fetch, fetchOptions: { dispatcher: new ProxyAgent(...) } });";
}
function uf(e) {
	let t = e;
	for (let e = 0; e < 8 && t && typeof t == "object"; e++) {
		let e = t;
		if (e.code === "UND_ERR_INVALID_ARG" && typeof e.message == "string" && e.message.includes("invalid onRequestStart method")) return !0;
		t = e.cause;
	}
	return !1;
}
//#endregion
//#region node_modules/openai/azure.mjs
var df = class extends $ {
	constructor({ baseURL: e = q("OPENAI_BASE_URL"), apiKey: t = q("AZURE_OPENAI_API_KEY"), apiVersion: n = q("OPENAI_API_VERSION"), endpoint: r, deployment: i, azureADTokenProvider: a, dangerouslyAllowBrowser: o, dataResidency: s, ...l } = {}) {
		if (jt(s, "AzureOpenAI"), !n) throw new c("The OPENAI_API_VERSION environment variable is missing or empty; either provide it, or instantiate the AzureOpenAI client with an apiVersion option, like new AzureOpenAI({ apiVersion: 'My API Version' }).");
		if (typeof a == "function" && (o ??= !0), !a && !t) throw new c("Missing credentials. Please pass one of `apiKey` and `azureADTokenProvider`, or set the `AZURE_OPENAI_API_KEY` environment variable.");
		if (a && t) throw new c("The `apiKey` and `azureADTokenProvider` arguments are mutually exclusive; only one can be passed at a time.");
		if (l.defaultQuery = {
			...l.defaultQuery,
			"api-version": n
		}, !e) {
			if (r ||= process.env.AZURE_OPENAI_ENDPOINT, !r) throw new c("Must provide one of the `baseURL` or `endpoint` arguments, or the `AZURE_OPENAI_ENDPOINT` environment variable");
			let t = r.length;
			for (; t > 0 && r[t - 1] === "/";) t--;
			e = `${r.slice(0, t)}/openai`;
		} else if (r) throw new c("baseURL and endpoint are mutually exclusive");
		super({
			apiKey: a ?? t,
			baseURL: e,
			...l,
			...o === void 0 ? {} : { dangerouslyAllowBrowser: o }
		}), this.apiVersion = "", this.apiVersion = n, this.deploymentName = i;
	}
	withOptions(e) {
		return super.withOptions(e);
	}
	async buildRequest(e, t = {}) {
		if (ff.has(e.path) && e.method === "post" && e.body !== void 0) {
			if (!oe(e.body)) throw Error("Expected request body to be an object");
			let t = this.deploymentName || e.body.model || e.__metadata?.model;
			t !== void 0 && !this.baseURL.includes("/deployments") && (e.path = B`/deployments/${t}` + e.path);
		}
		let n = await super.buildRequest(e, t);
		return n.req.headers.has("api-key") && (n.req.redirect = "manual"), n;
	}
	async fetchWithAuth(e, t, n, r, i) {
		return new Headers(t.headers).has("api-key") && (t.redirect = "manual"), super.fetchWithAuth(e, t, n, r, i);
	}
	async authHeaders(e, t) {
		let n = t ?? {
			bearerAuth: !0,
			adminAPIKeyAuth: !0
		};
		return n.bearerAuth && typeof this._options.apiKey == "string" ? P([{ "api-key": this.apiKey }]) : super.authHeaders(e, n);
	}
}, ff = /* @__PURE__ */ new Set([
	"/completions",
	"/chat/completions",
	"/embeddings",
	"/audio/transcriptions",
	"/audio/translations",
	"/audio/speech",
	"/images/generations",
	"/batches",
	"/images/edits"
]), pf = Symbol.for("openai.privateBedrockClient");
function mf(e, t) {
	let n = new URL(e), r = new URL(t), i = n.origin, a = r.origin;
	if (n.protocol !== "http:" && n.protocol !== "https:" || r.protocol !== "http:" && r.protocol !== "https:" || a !== i) throw new c(`Bedrock request origin \`${a}\` does not match the configured base URL origin \`${i}\`.`);
}
function hf(e) {
	if (/^[\t ]|[\t ]$/.test(e)) throw TypeError("Bedrock bearer credential contains an invalid HTTP header value.");
	for (let t of e) {
		let e = t.codePointAt(0) ?? 0;
		if (e < 32 && e !== 9 || e === 127 || e > 255) throw TypeError("Bedrock bearer credential contains an invalid HTTP header value.");
	}
}
//#endregion
//#region node_modules/openai/bedrock.mjs
var gf;
function _f(e) {
	let t = e?.trim();
	if (!t) throw new c("Must provide one of the `baseURL` or `awsRegion` arguments, or set the `AWS_BEDROCK_BASE_URL`, `AWS_REGION`, or `AWS_DEFAULT_REGION` environment variable.");
	if (!/^[a-z]{2,8}(?:-[a-z0-9]+)+-\d+$/u.test(t)) throw new c("The Bedrock AWS `region` is invalid. Use a standard AWS region such as `us-east-1`.");
	return `https://bedrock-mantle.${t}.api.aws/openai/v1`;
}
function vf(e) {
	let t = new URL(e), n = t.pathname.match(/\/responses(?:\/.*)?$/);
	return n?.index !== void 0 && (t.pathname = t.pathname.slice(0, n.index) || "/"), t.toString().replace(/\/$/, "");
}
function yf(e) {
	return Object.getOwnPropertyDescriptor(e, "output_text") || fu(e), e;
}
function bf(e) {
	let t = e.stream.bind(e);
	return e.stream = ((e, n) => {
		let r = t(e, n), i = r.finalResponse.bind(r);
		return r.finalResponse = async () => yf(await i()), r;
	}), e;
}
var xf = class extends $ {
	constructor({ baseURL: e = q("AWS_BEDROCK_BASE_URL"), apiKey: t, awsRegion: n = q("AWS_REGION") ?? q("AWS_DEFAULT_REGION"), bedrockTokenProvider: r, adminAPIKey: i, workloadIdentity: a, x509Transport: o, dataResidency: s, ...l } = {}) {
		if (jt(s, "BedrockOpenAI"), i || a || o) throw new c("BedrockOpenAI only supports Bedrock bearer token authentication.");
		if (t === void 0 && !r && (t = q("AWS_BEARER_TOKEN_BEDROCK") ?? null), typeof t == "function") throw new c("Pass refreshable Bedrock credentials via `bedrockTokenProvider`, not `apiKey`.");
		if (t && r) throw new c("The `apiKey` and `bedrockTokenProvider` arguments are mutually exclusive; only one can be passed at a time.");
		if (!t && !r) throw new c("Missing credentials. Please pass an `apiKey` or `bedrockTokenProvider`, or set the `AWS_BEARER_TOKEN_BEDROCK` environment variable.");
		let u = e?.trim() ? e : _f(n);
		super({
			apiKey: r ?? t,
			adminAPIKey: null,
			baseURL: vf(u),
			...l
		}), this[gf] = !0;
		let d = this.apiKey;
		Object.defineProperty(this, "apiKey", {
			enumerable: !0,
			configurable: !0,
			get() {
				return d !== null && hf(d), d;
			},
			set(e) {
				d = e;
			}
		});
		let f = this.baseURL, p = f;
		Object.defineProperty(this, "baseURL", {
			enumerable: !0,
			configurable: !1,
			get() {
				return p;
			},
			set(e) {
				mf(f, e), p = e;
			}
		}), this.bedrockTokenProvider = r, this.responses = bf(new hd(this));
	}
	async prepareOptions(e) {
		let t = this._options.baseURL ?? this.baseURL;
		mf(t, this.buildURL(e.path, null, e.defaultBaseURL));
		let n = e.__security ?? { bearerAuth: !0 };
		n.adminAPIKeyAuth && !n.bearerAuth && await this._callApiKey(), await super.prepareOptions(e), mf(t, this.buildURL(e.path, null, e.defaultBaseURL));
	}
	async prepareRequest(e, t) {
		mf(this._options.baseURL ?? this.baseURL, t.url), await super.prepareRequest(e, t), e.redirect = "manual";
	}
	async authHeaders(e, t) {
		let n = t ?? {
			bearerAuth: !0,
			adminAPIKeyAuth: !0
		}, r = this.apiKey;
		if ((n.bearerAuth || n.adminAPIKeyAuth) && r !== null) {
			hf(r);
			try {
				return P([{ Authorization: `Bearer ${r}` }]);
			} catch (e) {
				throw e instanceof TypeError ? TypeError("Bedrock bearer credential contains an invalid HTTP header value.") : e;
			}
		}
		return super.authHeaders(e, n);
	}
	withOptions(e) {
		let t = e.apiKey === void 0 ? e.bedrockTokenProvider ?? this.bedrockTokenProvider : void 0;
		return super.withOptions({
			...e,
			...t ? {
				apiKey: void 0,
				bedrockTokenProvider: t
			} : {}
		});
	}
};
gf = pf;
//#endregion
export { d as APIConnectionError, f as APIConnectionTimeoutError, l as APIError, Nt as APIPromise, u as APIUserAbortError, m as AuthenticationError, df as AzureOpenAI, p as BadRequestError, xf as BedrockOpenAI, _ as ConflictError, b as InternalServerError, S as InvalidWebhookSignatureError, g as NotFoundError, C as OAuthError, $ as OpenAI, $ as default, c as OpenAIError, It as PagePromise, h as PermissionDeniedError, y as RateLimitError, te as SubjectTokenProviderError, v as UnprocessableEntityError, $r as toFile, vr as toStreamingFile };
