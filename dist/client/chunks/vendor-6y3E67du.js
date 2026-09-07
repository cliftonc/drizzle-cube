import { t as e } from "./rolldown-runtime-DArdT4gl.js";
import { $ as t, G as n, J as r, K as i, Q as a, X as o, Y as s, Z as c, at as l, ct as u, et as d, it as f, nt as p, ot as m, q as h, rt as g, st as _, tt as v } from "./chart-data-table-Bn9EtETl.js";
import * as y from "react";
import b from "react";
//#region node_modules/react-intersection-observer/dist/index.mjs
var x = /* @__PURE__ */ new Map(), S = /* @__PURE__ */ new WeakMap(), C = 0, w;
function T(e) {
	return e ? S.has(e) ? S.get(e) : (C += 1, S.set(e, C.toString()), S.get(e)) : "0";
}
function E(e) {
	return Object.keys(e).sort().filter((t) => e[t] !== void 0).map((t) => `${t}_${t === "root" ? T(e.root) : e[t]}`).toString();
}
function D(e) {
	let t = E(e), n = x.get(t);
	if (!n) {
		let r = /* @__PURE__ */ new Map(), i, a = new IntersectionObserver((t) => {
			t.forEach((t) => {
				let n = t.isIntersecting && i.some((e) => t.intersectionRatio >= e);
				e.trackVisibility && t.isVisible === void 0 && (t.isVisible = n), [...r.get(t.target) ?? []].forEach((e) => {
					e(n, t);
				});
			});
		}, e);
		i = a.thresholds || (Array.isArray(e.threshold) ? e.threshold : [e.threshold || 0]), n = {
			id: t,
			observer: a,
			elements: r
		}, x.set(t, n);
	}
	return n;
}
function O(e, t, n = {}, r = w) {
	if (window.IntersectionObserver === void 0 && r !== void 0) {
		let i = e.getBoundingClientRect();
		return t(r, {
			isIntersecting: r,
			target: e,
			intersectionRatio: typeof n.threshold == "number" ? n.threshold : 0,
			time: 0,
			boundingClientRect: i,
			intersectionRect: i,
			rootBounds: i
		}), () => {};
	}
	let { id: i, observer: a, elements: o } = D(n), s = o.get(e) || [];
	o.has(e) || o.set(e, s), s.push(t), a.observe(e);
	let c = !1;
	return function() {
		c || (c = !0, s.splice(s.indexOf(t), 1), s.length === 0 && (o.delete(e), a.unobserve(e)), o.size === 0 && (a.disconnect(), x.delete(i)));
	};
}
var k = Reflect.get(y, "useInsertionEffect"), ee = k ?? y.useEffect;
function A(e) {
	return e?.startsWith("19.") || !1;
}
var j = A(y.version);
function M(e, { threshold: t, root: n, rootMargin: r, scrollMargin: i, trackVisibility: a, delay: o, fallbackInView: s, skip: c, triggerOnce: l }) {
	let u = y.useRef(e), d = y.useRef({
		node: null,
		stop: void 0,
		owner: null
	});
	return k || (u.current = e), ee(() => {
		u.current = e;
	}, [e]), y.useCallback(function e(f) {
		let p = d.current;
		if (!f && p.owner !== e) return;
		if (f === p.node) return p.owner = e, j ? p.stop : void 0;
		let m = p.stop;
		if (p.stop = void 0, m?.(), !f || c) {
			p.node = null, p.owner = f ? e : null;
			return;
		}
		p.node = f, p.owner = e;
		let h, g;
		function _() {
			h?.(), p.stop === _ && (p.node = null, p.stop = void 0);
		}
		return p.stop = _, h = O(f, (e, t) => {
			u.current(e, t, g), g = e, l && e && _();
		}, {
			threshold: t,
			root: n,
			rootMargin: r,
			scrollMargin: i,
			trackVisibility: a,
			delay: o
		}, s), p.stop !== _ && h(), j ? p.stop : void 0;
	}, [
		Array.isArray(t) ? t.toString() : t,
		n,
		r,
		i,
		a,
		o,
		s,
		c,
		l
	]);
}
var N = typeof window > "u" ? y.useEffect : y.useLayoutEffect;
function te({ threshold: e, delay: t, trackVisibility: n, rootMargin: r, scrollMargin: i, root: a, triggerOnce: o, skip: s, initialInView: c, fallbackInView: l, onChange: u } = {}) {
	let d = y.useRef(c), [f, p] = y.useState({
		inView: !!c,
		entry: void 0
	}), m = M((e, t) => {
		let n = d.current;
		d.current = e, !(n === void 0 && !e) && (p({
			inView: e,
			entry: t
		}), u?.(e, t));
	}, {
		threshold: e,
		root: a,
		rootMargin: r,
		scrollMargin: i,
		trackVisibility: n,
		delay: t,
		fallbackInView: l,
		skip: s,
		triggerOnce: o
	}), h = y.useRef({
		node: null,
		reset: !1
	}), g = y.useCallback(function(e) {
		e ? (h.current.node = e, h.current.reset = !1) : h.current.node && (h.current.node = null, h.current.reset = !0);
		let t = m(e);
		if (t) return () => {
			t(), h.current.node === e && (h.current.node = null, h.current.reset = !0);
		};
	}, [m]);
	N(() => {
		h.current.reset && (h.current.reset = !1, !(o || s) && (p({
			inView: !!c,
			entry: void 0
		}), d.current = c));
	});
	let _ = [
		g,
		f.inView,
		f.entry
	];
	return _.ref = _[0], _.inView = _[1], _.entry = _[2], _;
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/mutationObserver.js
var ne = class extends p {
	#e;
	#t = void 0;
	#n;
	#r;
	constructor(e, t) {
		super(), this.#e = e, this.setOptions(t), this.bindMethods(), this.#i();
	}
	bindMethods() {
		this.mutate = this.mutate.bind(this), this.reset = this.reset.bind(this);
	}
	setOptions(e) {
		let t = this.options;
		this.options = this.#e.defaultMutationOptions(e), m(this.options, t) || this.#e.getMutationCache().notify({
			type: "observerOptionsUpdated",
			mutation: this.#n,
			observer: this
		}), t?.mutationKey && this.options.mutationKey && g(t.mutationKey) !== g(this.options.mutationKey) ? this.reset() : this.#n?.state.status === "pending" && this.#n.setOptions(this.options);
	}
	onSubscribe() {
		this.listeners.size === 1 && this.#n && (this.#n.addObserver(this), this.#i());
	}
	onUnsubscribe() {
		this.hasListeners() || this.#n?.removeObserver(this);
	}
	onMutationUpdate(e) {
		this.#i(), this.#a(e);
	}
	getCurrentResult() {
		return this.#t;
	}
	reset() {
		this.#n?.removeObserver(this), this.#n = void 0, this.#i(), this.#a();
	}
	mutate(e, t) {
		return this.#r = t, this.#n?.removeObserver(this), this.#n = this.#e.getMutationCache().build(this.#e, this.options), this.#n.addObserver(this), this.#n.execute(e);
	}
	#i() {
		let e = this.#n?.state ?? t();
		this.#t = {
			...e,
			isPending: e.status === "pending",
			isSuccess: e.status === "success",
			isError: e.status === "error",
			isIdle: e.status === "idle",
			mutate: this.mutate,
			reset: this.reset
		};
	}
	#a(e) {
		v.batch(() => {
			if (this.#r && this.hasListeners()) {
				let t = this.#t.variables, n = this.#t.context, r = {
					client: this.#e,
					meta: this.options.meta,
					mutationKey: this.options.mutationKey
				};
				if (e?.type === "success") {
					try {
						this.#r.onSuccess?.(e.data, t, n, r);
					} catch (e) {
						Promise.reject(e);
					}
					try {
						this.#r.onSettled?.(e.data, null, t, n, r);
					} catch (e) {
						Promise.reject(e);
					}
				} else if (e?.type === "error") {
					try {
						this.#r.onError?.(e.error, t, n, r);
					} catch (e) {
						Promise.reject(e);
					}
					try {
						this.#r.onSettled?.(void 0, e.error, t, n, r);
					} catch (e) {
						Promise.reject(e);
					}
				}
			}
			this.listeners.forEach((e) => {
				e(this.#t);
			});
		});
	}
};
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/queriesObserver.js
function P(e, t) {
	let n = new Set(t);
	return e.filter((e) => !n.has(e));
}
var re = class extends p {
	#e;
	#t;
	#n;
	#r;
	#i;
	#a;
	#o;
	#s;
	#c;
	#l = [];
	constructor(e, t, n) {
		super(), this.#e = e, this.#r = n, this.#n = [], this.#i = [], this.#t = [], this.setQueries(t);
	}
	onSubscribe() {
		this.listeners.size === 1 && this.#i.forEach((e) => {
			e.subscribe((t) => {
				this.#m(e, t);
			});
		});
	}
	onUnsubscribe() {
		this.listeners.size || this.destroy();
	}
	destroy() {
		this.listeners = /* @__PURE__ */ new Set(), this.#i.forEach((e) => {
			e.destroy();
		});
	}
	setQueries(e, t) {
		if (this.#n = e, this.#r = t, process.env.NODE_ENV !== "production") {
			let t = e.map((e) => this.#e.defaultQueryOptions(e).queryHash);
			new Set(t).size !== t.length && console.warn("[QueriesObserver]: Duplicate Queries found. This might result in unexpected behavior.");
		}
		v.batch(() => {
			let e = this.#i, t = this.#p(this.#n);
			t.forEach((e) => e.observer.setOptions(e.defaultedQueryOptions));
			let n = t.map((e) => e.observer), r = n.map((e) => e.getCurrentResult()), i = e.length !== n.length, a = n.some((t, n) => t !== e[n]), o = i || a, s = o ? !0 : r.some((e, t) => {
				let n = this.#t[t];
				return !n || !m(e, n);
			});
			!o && !s || (o && (this.#l = t, this.#i = n), this.#t = r, this.hasListeners() && (o && (P(e, n).forEach((e) => {
				e.destroy();
			}), P(n, e).forEach((e) => {
				e.subscribe((t) => {
					this.#m(e, t);
				});
			})), this.#h()));
		});
	}
	getCurrentResult() {
		return this.#t;
	}
	getQueries() {
		return this.#i.map((e) => e.getCurrentQuery());
	}
	getObservers() {
		return this.#i;
	}
	getOptimisticResult(e, t) {
		let n = this.#p(e), r = n.map((e) => e.observer.getOptimisticResult(e.defaultedQueryOptions)), i = n.map((e) => e.defaultedQueryOptions.queryHash);
		return [
			r,
			(e) => this.#d(e ?? r, t, i),
			() => this.#u(r, n)
		];
	}
	#u(e, t) {
		let n = /* @__PURE__ */ new Set();
		return t.map((r, i) => {
			let a = e[i];
			return r.defaultedQueryOptions.notifyOnChangeProps ? a : r.observer.trackResult(a, (e) => {
				n.has(e) || (n.add(e), t.forEach((t) => {
					t.observer.trackProp(e);
				}));
			});
		});
	}
	#d(e, t, n) {
		if (t) {
			let r = this.#c, i = n !== void 0 && r !== void 0 && (r.length !== n.length || n.some((e, t) => e !== r[t]));
			return (this.#t !== this.#s || i || t !== this.#o) && (this.#o = t, this.#s = this.#t, n !== void 0 && (this.#c = n), this.#a = l(this.#a, t(e))), this.#a;
		}
		return e;
	}
	#f() {
		return !this.#r?.combine || this.#i.some((e, t) => e.options.suspense && this.#t[t]?.data === void 0);
	}
	#p(e) {
		let t = /* @__PURE__ */ new Map();
		this.#i.forEach((e) => {
			let n = e.options.queryHash;
			if (!n) return;
			let r = t.get(n);
			r ? r.push(e) : t.set(n, [e]);
		});
		let n = [];
		return e.forEach((e) => {
			let r = this.#e.defaultQueryOptions(e), i = t.get(r.queryHash)?.shift() ?? new d(this.#e, r);
			n.push({
				defaultedQueryOptions: r,
				observer: i
			});
		}), n;
	}
	#m(e, t) {
		let n = this.#i.indexOf(e);
		n !== -1 && (this.#t = this.#t.slice(), this.#t[n] = t, this.#h());
	}
	#h() {
		if (this.hasListeners()) {
			let e = this.#f(), t = this.#a, n = e ? t : this.#d(this.#u(this.#t, this.#l), this.#r?.combine);
			(e || t !== n) && v.batch(() => {
				this.listeners.forEach((e) => {
					e(this.#t);
				});
			});
		}
	}
};
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/useQueries.js
function ie({ queries: e, ...t }, l) {
	let p = u(l), m = a(), g = c(), _ = t.subscribed !== !1, b = y.useMemo(() => e.map((e) => {
		let t = p.defaultQueryOptions(e);
		return t._optimisticResults = m ? "isRestoring" : _ ? "optimistic" : void 0, t;
	}), [
		e,
		p,
		m,
		_
	]);
	b.forEach((e) => {
		n(e);
		let t = p.getQueryCache().get(e.queryHash);
		r(e, g, t);
	}), o(g);
	let [x] = y.useState(() => new re(p, b, t)), [S, C, w] = x.getOptimisticResult(b, t.combine), T = !m && _;
	y.useSyncExternalStore(y.useCallback((e) => T ? x.subscribe(v.batchCalls(e)) : f, [x, T]), () => x.getCurrentResult(), () => x.getCurrentResult()), y.useEffect(() => {
		x.setQueries(b, t);
	}, [
		b,
		t,
		x
	]);
	let E = S.some((e, t) => h(b[t], e)) ? S.flatMap((e, t) => {
		let n = b[t];
		if (n && h(n, e)) {
			let e = new d(p, n);
			return i(n, e, g);
		}
		return [];
	}) : [];
	if (E.length > 0) throw Promise.all(E);
	let D = S.find((e, t) => {
		let n = b[t];
		return n && s({
			result: e,
			errorResetBoundary: g,
			throwOnError: n.throwOnError,
			query: p.getQueryCache().get(n.queryHash),
			suspense: n.suspense
		});
	});
	if (D) throw D.error;
	return C(w());
}
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/useMutation.js
function ae(e, t) {
	let n = u(t), [r] = y.useState(() => new ne(n, e));
	y.useEffect(() => {
		r.setOptions(e);
	}, [r, e]);
	let i = y.useSyncExternalStore(y.useCallback((e) => r.subscribe(v.batchCalls(e)), [r]), () => r.getCurrentResult(), () => r.getCurrentResult()), a = y.useCallback((...e) => {
		r.mutate(e[0], e[1]).catch(f);
	}, [r]);
	if (i.error && _(r.options.throwOnError, [i.error])) throw i.error;
	return {
		...i,
		mutate: a,
		mutateAsync: i.mutate
	};
}
//#endregion
//#region node_modules/zustand/esm/vanilla.mjs
var F = (e) => {
	let t, n = /* @__PURE__ */ new Set(), r = (e, r) => {
		let i = typeof e == "function" ? e(t) : e;
		if (!Object.is(i, t)) {
			let e = t;
			t = r ?? (typeof i != "object" || !i) ? i : Object.assign({}, t, i), n.forEach((n) => n(t, e));
		}
	}, i = () => t, a = {
		setState: r,
		getState: i,
		getInitialState: () => o,
		subscribe: (e) => (n.add(e), () => n.delete(e))
	}, o = t = e(r, i, a);
	return a;
}, I = ((e) => e ? F(e) : F), L = (e) => e;
function R(e, t = L) {
	let n = b.useSyncExternalStore(e.subscribe, b.useCallback(() => t(e.getState()), [e, t]), b.useCallback(() => t(e.getInitialState()), [e, t]));
	return b.useDebugValue(n), n;
}
//#endregion
//#region node_modules/zustand/esm/middleware.mjs
var z = (e) => !!e.dispatchFromDevtools && typeof e.dispatch == "function", B = /* @__PURE__ */ new Map(), V = (e) => {
	let t = B.get(e);
	return t ? Object.fromEntries(Object.entries(t.stores).map(([e, t]) => [e, t.getState()])) : {};
}, H = (e, t, n) => {
	if (e === void 0) return {
		type: "untracked",
		connection: t.connect(n)
	};
	let r = B.get(n.name);
	if (r) return {
		type: "tracked",
		store: e,
		...r
	};
	let i = {
		connection: t.connect(n),
		stores: {}
	};
	return B.set(n.name, i), {
		type: "tracked",
		store: e,
		...i
	};
}, U = (e, t) => {
	if (t === void 0) return;
	let n = B.get(e);
	n && (delete n.stores[t], Object.keys(n.stores).length === 0 && B.delete(e));
}, W = /^at (?:new |async )?(.+?) \(/, G = /^([^@]+)@/;
function K(e) {
	if (!e) return;
	let t = e.split("\n"), n = t.findIndex((e) => e.includes("api.setState"));
	if (n < 0) return;
	let r = t[n + 1]?.trim() || "";
	return W.exec(r)?.[1] || G.exec(r)?.[1];
}
var q = (e, t = {}) => (n, r, i) => {
	let { enabled: a, anonymousActionType: o, store: s, ...c } = t, l;
	try {
		l = (a ?? !1) && window.__REDUX_DEVTOOLS_EXTENSION__;
	} catch {}
	if (!l) return e(n, r, i);
	let { connection: u, ...d } = H(s, l, c), f = !0;
	i.setState = ((e, t, a) => {
		let l = n(e, t);
		if (!f) return l;
		let d = a === void 0 ? { type: o || K((/* @__PURE__ */ Error()).stack) || "anonymous" } : typeof a == "string" ? { type: a } : a;
		return s === void 0 ? (u?.send(d, r()), l) : (u?.send({
			...d,
			type: `${s}/${d.type}`
		}, {
			...V(c.name),
			[s]: i.getState()
		}), l);
	}), i.devtools = { cleanup: () => {
		u && typeof u.unsubscribe == "function" && u.unsubscribe(), U(c.name, s);
	} };
	let p = (...e) => {
		let t = f;
		f = !1, n(...e), f = t;
	}, m = e(i.setState, r, i);
	if (d.type === "untracked" ? u?.init(m) : (d.stores[d.store] = i, u?.init(Object.fromEntries(Object.entries(d.stores).map(([e, t]) => [e, e === d.store ? m : t.getState()])))), z(i)) {
		let e = i.dispatch;
		i.dispatch = (...t) => {
			e(...t);
		};
	}
	return u.subscribe((e) => {
		switch (e.type) {
			case "ACTION":
				if (typeof e.payload != "string") {
					console.error("[zustand devtools middleware] Unsupported action format");
					return;
				}
				return J(e.payload, (e) => {
					if (e.type === "__setState") {
						if (s === void 0) {
							p(e.state);
							return;
						}
						Object.keys(e.state).length !== 1 && console.error("\n                    [zustand devtools middleware] Unsupported __setState action format.\n                    When using 'store' option in devtools(), the 'state' should have only one key, which is a value of 'store' that was passed in devtools(),\n                    and value of this only key should be a state object. Example: { \"type\": \"__setState\", \"state\": { \"abc123Store\": { \"foo\": \"bar\" } } }\n                    ");
						let t = e.state[s];
						if (t == null) return;
						JSON.stringify(i.getState()) !== JSON.stringify(t) && p(t);
						return;
					}
					z(i) && i.dispatch(e);
				});
			case "DISPATCH":
				switch (e.payload.type) {
					case "RESET": return p(m), s === void 0 ? u?.init(i.getState()) : u?.init(V(c.name));
					case "COMMIT":
						if (s === void 0) {
							u?.init(i.getState());
							return;
						}
						return u?.init(V(c.name));
					case "ROLLBACK": return J(e.state, (e) => {
						if (s === void 0) {
							p(e), u?.init(i.getState());
							return;
						}
						p(e[s]), u?.init(V(c.name));
					});
					case "JUMP_TO_STATE":
					case "JUMP_TO_ACTION": return J(e.state, (e) => {
						if (s === void 0) {
							p(e);
							return;
						}
						JSON.stringify(i.getState()) !== JSON.stringify(e[s]) && p(e[s]);
					});
					case "IMPORT_STATE": {
						let { nextLiftedState: t } = e.payload, n = t.computedStates.slice(-1)[0]?.state;
						if (!n) return;
						p(s === void 0 ? n : n[s]), u?.send(null, t);
						return;
					}
					case "PAUSE_RECORDING": return f = !f;
				}
				return;
		}
	}), m;
}, J = (e, t) => {
	let n;
	try {
		n = JSON.parse(e);
	} catch (e) {
		console.error("[zustand devtools middleware] Could not parse the received json", e);
	}
	n !== void 0 && t(n);
}, oe = (e) => (t, n, r) => {
	let i = r.subscribe;
	return r.subscribe = ((e, t, n) => {
		let a = e;
		if (t) {
			let i = n?.equalityFn || Object.is, o = e(r.getState());
			a = (n) => {
				let r = e(n);
				if (!i(o, r)) {
					let e = o;
					t(o = r, e);
				}
			}, n?.fireImmediately && t(o, o);
		}
		return i(a);
	}), e(t, n, r);
};
function se(e, t) {
	let n;
	try {
		n = e();
	} catch {
		return;
	}
	return {
		getItem: (e) => {
			let r = (e) => e === null ? null : JSON.parse(e, t?.reviver), i = n.getItem(e) ?? null;
			return i instanceof Promise ? i.then(r) : r(i);
		},
		setItem: (e, r) => n.setItem(e, JSON.stringify(r, t?.replacer)),
		removeItem: (e) => n.removeItem(e)
	};
}
var Y = (e) => (t) => {
	try {
		let n = e(t);
		return n instanceof Promise ? n : {
			then(e) {
				return Y(e)(n);
			},
			catch(e) {
				return this;
			}
		};
	} catch (e) {
		return {
			then(e) {
				return this;
			},
			catch(t) {
				return Y(t)(e);
			}
		};
	}
}, ce = (e, t) => (n, r, i) => {
	let a = {
		storage: se(() => window.localStorage),
		partialize: (e) => e,
		version: 0,
		merge: (e, t) => ({
			...t,
			...e
		}),
		...t
	}, o = !1, s = 0, c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set(), u = a.storage;
	if (!u) return e((...e) => {
		console.warn(`[zustand persist middleware] Unable to update item '${a.name}', the given storage is currently unavailable.`), n(...e);
	}, r, i);
	let d = () => {
		let e = a.partialize({ ...r() });
		return u.setItem(a.name, {
			state: e,
			version: a.version
		});
	}, f = i.setState;
	i.setState = (e, t) => (f(e, t), d());
	let p = e((...e) => (n(...e), d()), r, i);
	i.getInitialState = () => p;
	let m, h = () => {
		if (!u) return;
		let e = ++s;
		o = !1, c.forEach((e) => e(r() ?? p));
		let t = a.onRehydrateStorage?.call(a, r() ?? p) || void 0;
		return Y(u.getItem.bind(u))(a.name).then((e) => {
			if (e) {
				if (typeof e.version == "number" && e.version !== a.version) {
					if (a.migrate) {
						let t = a.migrate(e.state, e.version);
						return t instanceof Promise ? t.then((e) => [!0, e]) : [!0, t];
					}
					console.error("State loaded from storage couldn't be migrated since no migrate function was provided");
				} else return [!1, e.state];
			}
			return [!1, void 0];
		}).then((t) => {
			if (e !== s) return;
			let [i, o] = t;
			if (m = a.merge(o, r() ?? p), n(m, !0), i) return d();
		}).then(() => {
			e === s && (t?.(r(), void 0), m = r(), o = !0, l.forEach((e) => e(m)));
		}).catch((n) => {
			e === s && t?.(void 0, n);
		});
	};
	return i.persist = {
		setOptions: (e) => {
			a = {
				...a,
				...e
			}, e.storage && (u = e.storage);
		},
		clearStorage: () => {
			++s, u?.removeItem(a.name);
		},
		getOptions: () => a,
		rehydrate: () => h(),
		hasHydrated: () => o,
		onHydrate: (e) => (c.add(e), () => {
			c.delete(e);
		}),
		onFinishHydration: (e) => (l.add(e), () => {
			l.delete(e);
		})
	}, a.skipHydration || h(), m || p;
}, X = (e) => Symbol.iterator in e, Z = (e) => "entries" in e, Q = (e, t) => {
	let n = e instanceof Map ? e : new Map(e.entries()), r = t instanceof Map ? t : new Map(t.entries());
	if (n.size !== r.size) return !1;
	for (let [e, t] of n) if (!r.has(e) || !Object.is(t, r.get(e))) return !1;
	return !0;
}, le = (e, t) => {
	let n = e[Symbol.iterator](), r = t[Symbol.iterator](), i = n.next(), a = r.next();
	for (; !i.done && !a.done;) {
		if (!Object.is(i.value, a.value)) return !1;
		i = n.next(), a = r.next();
	}
	return !!i.done && !!a.done;
};
function $(e, t) {
	return Object.is(e, t) ? !0 : typeof e != "object" || !e || typeof t != "object" || !t || Object.getPrototypeOf(e) !== Object.getPrototypeOf(t) ? !1 : X(e) && X(t) ? Z(e) && Z(t) ? Q(e, t) : le(e, t) : Q({ entries: () => Object.entries(e) }, { entries: () => Object.entries(t) });
}
//#endregion
//#region node_modules/zustand/esm/react/shallow.mjs
function ue(e) {
	let t = b.useRef(void 0);
	return (n) => {
		let r = e(n);
		return $(t.current, r) ? t.current : t.current = r;
	};
}
//#endregion
//#region node_modules/lz-string/libs/lz-string.js
var de = /* @__PURE__ */ e(((e, t) => {
	var n = (function() {
		var e = String.fromCharCode, t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", n = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$", r = {};
		function i(e, t) {
			if (!r[e]) {
				r[e] = {};
				for (var n = 0; n < e.length; n++) r[e][e.charAt(n)] = n;
			}
			return r[e][t];
		}
		var a = {
			compressToBase64: function(e) {
				if (e == null) return "";
				var n = a._compress(e, 6, function(e) {
					return t.charAt(e);
				});
				switch (n.length % 4) {
					default:
					case 0: return n;
					case 1: return n + "===";
					case 2: return n + "==";
					case 3: return n + "=";
				}
			},
			decompressFromBase64: function(e) {
				return e == null ? "" : e == "" ? null : a._decompress(e.length, 32, function(n) {
					return i(t, e.charAt(n));
				});
			},
			compressToUTF16: function(t) {
				return t == null ? "" : a._compress(t, 15, function(t) {
					return e(t + 32);
				}) + " ";
			},
			decompressFromUTF16: function(e) {
				return e == null ? "" : e == "" ? null : a._decompress(e.length, 16384, function(t) {
					return e.charCodeAt(t) - 32;
				});
			},
			compressToUint8Array: function(e) {
				for (var t = a.compress(e), n = new Uint8Array(t.length * 2), r = 0, i = t.length; r < i; r++) {
					var o = t.charCodeAt(r);
					n[r * 2] = o >>> 8, n[r * 2 + 1] = o % 256;
				}
				return n;
			},
			decompressFromUint8Array: function(t) {
				if (t == null) return a.decompress(t);
				for (var n = Array(t.length / 2), r = 0, i = n.length; r < i; r++) n[r] = t[r * 2] * 256 + t[r * 2 + 1];
				var o = [];
				return n.forEach(function(t) {
					o.push(e(t));
				}), a.decompress(o.join(""));
			},
			compressToEncodedURIComponent: function(e) {
				return e == null ? "" : a._compress(e, 6, function(e) {
					return n.charAt(e);
				});
			},
			decompressFromEncodedURIComponent: function(e) {
				return e == null ? "" : e == "" ? null : (e = e.replace(/ /g, "+"), a._decompress(e.length, 32, function(t) {
					return i(n, e.charAt(t));
				}));
			},
			compress: function(t) {
				return a._compress(t, 16, function(t) {
					return e(t);
				});
			},
			_compress: function(e, t, n) {
				if (e == null) return "";
				var r, i, a = {}, o = {}, s = "", c = "", l = "", u = 2, d = 3, f = 2, p = [], m = 0, h = 0, g;
				for (g = 0; g < e.length; g += 1) if (s = e.charAt(g), Object.prototype.hasOwnProperty.call(a, s) || (a[s] = d++, o[s] = !0), c = l + s, Object.prototype.hasOwnProperty.call(a, c)) l = c;
				else {
					if (Object.prototype.hasOwnProperty.call(o, l)) {
						if (l.charCodeAt(0) < 256) {
							for (r = 0; r < f; r++) m <<= 1, h == t - 1 ? (h = 0, p.push(n(m)), m = 0) : h++;
							for (i = l.charCodeAt(0), r = 0; r < 8; r++) m = m << 1 | i & 1, h == t - 1 ? (h = 0, p.push(n(m)), m = 0) : h++, i >>= 1;
						} else {
							for (i = 1, r = 0; r < f; r++) m = m << 1 | i, h == t - 1 ? (h = 0, p.push(n(m)), m = 0) : h++, i = 0;
							for (i = l.charCodeAt(0), r = 0; r < 16; r++) m = m << 1 | i & 1, h == t - 1 ? (h = 0, p.push(n(m)), m = 0) : h++, i >>= 1;
						}
						u--, u == 0 && (u = 2 ** f, f++), delete o[l];
					} else for (i = a[l], r = 0; r < f; r++) m = m << 1 | i & 1, h == t - 1 ? (h = 0, p.push(n(m)), m = 0) : h++, i >>= 1;
					u--, u == 0 && (u = 2 ** f, f++), a[c] = d++, l = String(s);
				}
				if (l !== "") {
					if (Object.prototype.hasOwnProperty.call(o, l)) {
						if (l.charCodeAt(0) < 256) {
							for (r = 0; r < f; r++) m <<= 1, h == t - 1 ? (h = 0, p.push(n(m)), m = 0) : h++;
							for (i = l.charCodeAt(0), r = 0; r < 8; r++) m = m << 1 | i & 1, h == t - 1 ? (h = 0, p.push(n(m)), m = 0) : h++, i >>= 1;
						} else {
							for (i = 1, r = 0; r < f; r++) m = m << 1 | i, h == t - 1 ? (h = 0, p.push(n(m)), m = 0) : h++, i = 0;
							for (i = l.charCodeAt(0), r = 0; r < 16; r++) m = m << 1 | i & 1, h == t - 1 ? (h = 0, p.push(n(m)), m = 0) : h++, i >>= 1;
						}
						u--, u == 0 && (u = 2 ** f, f++), delete o[l];
					} else for (i = a[l], r = 0; r < f; r++) m = m << 1 | i & 1, h == t - 1 ? (h = 0, p.push(n(m)), m = 0) : h++, i >>= 1;
					u--, u == 0 && (u = 2 ** f, f++);
				}
				for (i = 2, r = 0; r < f; r++) m = m << 1 | i & 1, h == t - 1 ? (h = 0, p.push(n(m)), m = 0) : h++, i >>= 1;
				for (;;) {
					if (m <<= 1, h == t - 1) {
						p.push(n(m));
						break;
					}
					h++;
				}
				return p.join("");
			},
			decompress: function(e) {
				return e == null ? "" : e == "" ? null : a._decompress(e.length, 32768, function(t) {
					return e.charCodeAt(t);
				});
			},
			_decompress: function(t, n, r) {
				var i = [], a = 4, o = 4, s = 3, c = "", l = [], u, d, f, p, m, h, g, _ = {
					val: r(0),
					position: n,
					index: 1
				};
				for (u = 0; u < 3; u += 1) i[u] = u;
				for (f = 0, m = 4, h = 1; h != m;) p = _.val & _.position, _.position >>= 1, _.position == 0 && (_.position = n, _.val = r(_.index++)), f |= +(p > 0) * h, h <<= 1;
				switch (f) {
					case 0:
						for (f = 0, m = 256, h = 1; h != m;) p = _.val & _.position, _.position >>= 1, _.position == 0 && (_.position = n, _.val = r(_.index++)), f |= +(p > 0) * h, h <<= 1;
						g = e(f);
						break;
					case 1:
						for (f = 0, m = 2 ** 16, h = 1; h != m;) p = _.val & _.position, _.position >>= 1, _.position == 0 && (_.position = n, _.val = r(_.index++)), f |= +(p > 0) * h, h <<= 1;
						g = e(f);
						break;
					case 2: return "";
				}
				for (i[3] = g, d = g, l.push(g);;) {
					if (_.index > t) return "";
					for (f = 0, m = 2 ** s, h = 1; h != m;) p = _.val & _.position, _.position >>= 1, _.position == 0 && (_.position = n, _.val = r(_.index++)), f |= +(p > 0) * h, h <<= 1;
					switch (g = f) {
						case 0:
							for (f = 0, m = 256, h = 1; h != m;) p = _.val & _.position, _.position >>= 1, _.position == 0 && (_.position = n, _.val = r(_.index++)), f |= +(p > 0) * h, h <<= 1;
							i[o++] = e(f), g = o - 1, a--;
							break;
						case 1:
							for (f = 0, m = 2 ** 16, h = 1; h != m;) p = _.val & _.position, _.position >>= 1, _.position == 0 && (_.position = n, _.val = r(_.index++)), f |= +(p > 0) * h, h <<= 1;
							i[o++] = e(f), g = o - 1, a--;
							break;
						case 2: return l.join("");
					}
					if (a == 0 && (a = 2 ** s, s++), i[g]) c = i[g];
					else if (g === o) c = d + d.charAt(0);
					else return null;
					l.push(c), i[o++] = d + c.charAt(0), a--, d = c, a == 0 && (a = 2 ** s, s++);
				}
			}
		};
		return a;
	})();
	typeof define == "function" && define.amd ? define(function() {
		return n;
	}) : t !== void 0 && t != null ? t.exports = n : typeof angular < "u" && angular != null && angular.module("LZString", []).factory("LZString", function() {
		return n;
	});
}));
//#endregion
export { oe as a, ae as c, ce as i, ie as l, ue as n, R as o, q as r, I as s, de as t, te as u };

//# sourceMappingURL=vendor-6y3E67du.js.map