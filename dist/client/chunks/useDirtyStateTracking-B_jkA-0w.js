import { A as e, B as t, W as n, ct as r } from "./chart-data-table-Bn9EtETl.js";
import { n as i } from "./chart-sankey-DDzokqvF.js";
import { i as a, l as o } from "./chart-funnel-BwJxhDFk.js";
import { useCallback as s, useEffect as c, useMemo as l, useRef as u, useState as d } from "react";
//#region src/client/shared/queryTransforms.ts
function f(e) {
	let t = {};
	return e.measures && e.measures.length > 0 && (t.measures = e.measures), e.dimensions && e.dimensions.length > 0 && (t.dimensions = e.dimensions), e.timeDimensions && e.timeDimensions.length > 0 && (t.timeDimensions = e.timeDimensions), e.filters && e.filters.length > 0 && (t.filters = e.filters), e.order && (t.order = e.order), e.limit && (t.limit = e.limit), e.offset && (t.offset = e.offset), e.segments && e.segments.length > 0 && (t.segments = e.segments), t;
}
//#endregion
//#region src/client/shared/filters/filterOperations.ts
function p(e) {
	return "member" in e && "operator" in e;
}
function m(e) {
	return "type" in e && "filters" in e;
}
function h(e) {
	let t = 0, n = (e) => {
		p(e) ? t++ : m(e) && e.filters.forEach(n);
	};
	return e.forEach(n), t;
}
function g(e) {
	let t = [], n = (e) => {
		p(e) ? t.push(e.member) : m(e) && e.filters.forEach(n);
	};
	return e.forEach(n), t;
}
function _(e, t, n) {
	if (t.length === 0) return e.length === 0 ? [n] : e.length === 1 && p(e[0]) ? [{
		type: "and",
		filters: [e[0], n]
	}] : e.length === 1 && m(e[0]) ? [{
		...e[0],
		filters: [...e[0].filters, n]
	}] : [{
		type: "and",
		filters: [...e, n]
	}];
	let [r, ...i] = t, a = [...e], o = a[r];
	return m(o) && (a[r] = i.length === 0 ? {
		...o,
		filters: [...o.filters, n]
	} : {
		...o,
		filters: _(o.filters, i, n)
	}), a;
}
function v(e, t) {
	let n = e.filter((e, n) => n !== t);
	if (n.length === 1 && m(n[0])) {
		let e = n[0];
		if (e.filters.length === 1) return [e.filters[0]];
	}
	return n;
}
function y(e) {
	return {
		...e,
		type: e.type === "and" ? "or" : "and"
	};
}
function b(e, t) {
	for (let n of e) if (m(n)) {
		let e = b(n.filters, t);
		if (e) return e;
	} else if (p(n) && n.member === t && n.operator === "inDateRange" && n.dateRange) return { dateRange: n.dateRange };
}
function x(e, t, n) {
	return e.reduce((e, r) => {
		if (m(r)) {
			let i = x(r.filters, t, n);
			i.length > 0 && e.push({
				type: r.type,
				filters: i
			});
		} else p(r) ? (r.member !== t || n !== void 0 && r.operator !== n) && e.push(r) : e.push(r);
		return e;
	}, []);
}
function S(e) {
	let t = (e) => {
		if (p(e)) return e;
		if (m(e)) {
			let n = e.filters.map(t);
			return e.type === "and" ? { and: n } : { or: n };
		}
		return e;
	};
	return e.map(t);
}
//#endregion
//#region src/client/shared/utils.ts
function C(e) {
	let t = f(e);
	return t.filters && t.filters.length > 0 && (t.filters = S(t.filters)), t;
}
function w(e, t) {
	let n = {
		today: "today",
		yesterday: "yesterday",
		this_week: "this week",
		this_month: "this month",
		this_quarter: "this quarter",
		this_year: "this year",
		last_7_days: "last 7 days",
		last_30_days: "last 30 days",
		last_week: "last week",
		last_month: "last month",
		last_quarter: "last quarter",
		last_year: "last year",
		last_12_months: "last 12 months"
	};
	if (e.startsWith("last_n_") && t !== void 0 && t > 0) {
		let n = e.replace("last_n_", ""), r = n.slice(0, -1);
		return t === 1 ? `last ${r}` : `last ${t} ${n}`;
	}
	return n[e] || e;
}
function T(e) {
	return e.startsWith("last_n_");
}
function E(e) {
	return e.toISOString().split("T")[0];
}
//#endregion
//#region src/client/shared/queryKey.ts
function D(e) {
	let t = /* @__PURE__ */ new WeakSet(), n = (e) => {
		if (typeof e != "object" || !e) return JSON.stringify(e);
		if (t.has(e)) return "\"[Circular]\"";
		if (t.add(e), Array.isArray(e)) return `[${e.map((e) => n(e)).join(",")}]`;
		let r = e;
		return `{${Object.keys(r).sort().map((e) => `${JSON.stringify(e)}:${n(r[e])}`).join(",")}}`;
	};
	return n(e);
}
//#endregion
//#region src/client/hooks/useDebounceQuery.ts
function O(e, t) {
	let { isValid: n, skip: r = !1, debounceMs: i = 300 } = t, [a, o] = d(null), [s, f] = d(!1), p = u(null), m = u(""), h = u(r), g = l(() => e ? D(e) : "", [e]);
	return c(() => {
		let t = h.current && !r;
		if (h.current = r, !(g === m.current && !t)) return p.current && clearTimeout(p.current), n && !r ? (f(!0), p.current = setTimeout(() => {
			m.current = g, o(e), f(!1);
		}, i)) : (m.current = g, o(null), f(!1)), () => {
			p.current && clearTimeout(p.current);
		};
	}, [
		g,
		n,
		r,
		i,
		e
	]), {
		debouncedValue: a,
		isDebouncing: s
	};
}
//#endregion
//#region src/client/hooks/queries/useCubeLoadQuery.ts
var k = 300;
function A(e) {
	return e ? [
		"cube",
		"load",
		D(e)
	] : [
		"cube",
		"load",
		null
	];
}
function j(e) {
	return e ? !!(e.measures && e.measures.length > 0) || !!(e.dimensions && e.dimensions.length > 0) || !!(e.timeDimensions && e.timeDimensions.length > 0) : !1;
}
function M(i, a = {}) {
	let { skip: o = !1, debounceMs: f = k, resetResultSetOnChange: p = !0, staleTime: m = 6e4, keepPreviousData: h = !0 } = a, { cubeApi: g, batchCoordinator: _, enableBatching: v } = t(), y = r(), { features: b } = e(), x = b.manualRefresh ?? !1, [S, w] = d(null), T = j(i), { debouncedValue: E, isDebouncing: M } = O(i, {
		isValid: T,
		skip: o,
		debounceMs: f
	}), N = l(() => E ? C(E) : null, [E]), P = N ? D(N) : null, F = l(() => !x || !P || S === null ? !1 : P !== S, [
		x,
		P,
		S
	]), I = l(() => !N || o ? !1 : !x || S === null || S === P, [
		N,
		o,
		x,
		S,
		P
	]), L = u(!1), R = n({
		queryKey: A(N),
		queryFn: async () => {
			if (!N) throw Error("No query provided");
			let e = L.current;
			return L.current = !1, e ? g.load(N, { bustCache: !0 }) : v && _ ? _.register(N) : g.load(N);
		},
		enabled: I,
		staleTime: m,
		placeholderData: h ? (e) => e : void 0
	});
	c(() => {
		!x && N && !o && w(P);
	}, [
		x,
		N,
		o,
		P
	]), c(() => {
		x && I && R.isSuccess && !R.isFetching && N && w(P);
	}, [
		x,
		I,
		R.isSuccess,
		R.isFetching,
		N,
		P
	]);
	let z = l(() => {
		if (!R.data) return null;
		try {
			return R.data.rawData();
		} catch {
			return null;
		}
	}, [R.data]), B = l(() => {
		if (!R.data?.loadResponse) return;
		let e = R.data.loadResponse;
		return e.results && e.results[0]?.warnings ? e.results[0].warnings : e.warnings;
	}, [R.data]), V = s((e) => {
		N && (w(P), e?.bustCache && (L.current = !0), y.invalidateQueries({ queryKey: A(N) }));
	}, [
		N,
		P,
		y
	]), H = V;
	return {
		resultSet: l(() => R.data ?? null, [
			R.data,
			M,
			p
		]),
		rawData: z,
		isLoading: R.isLoading || M,
		isFetching: R.isFetching,
		isDebouncing: M,
		error: R.error,
		debouncedQuery: E,
		isValidQuery: T,
		refetch: H,
		clearCache: () => {
			y.removeQueries({ queryKey: ["cube", "load"] });
		},
		needsRefresh: F,
		executeQuery: V,
		warnings: B
	};
}
//#endregion
//#region src/client/utils/multiQueryUtils.ts
function N(e) {
	return e.length > 0 && typeof e[0] == "object" && e[0] !== null && "__queryIndex" in e[0];
}
function P(e) {
	if (!N(e)) return [];
	let t = /* @__PURE__ */ new Set();
	for (let n of e) {
		let e = n.__queryLabel;
		typeof e == "string" && t.add(e);
	}
	return Array.from(t);
}
function F(e) {
	if (!N(e)) return [];
	let t = /* @__PURE__ */ new Set();
	for (let n of e) {
		let e = n.__queryIndex;
		typeof e == "number" && t.add(e);
	}
	return Array.from(t).sort((e, t) => e - t);
}
function I(e, t, n) {
	let r = [];
	return e.forEach((e, t) => {
		let i = e.rawData(), a = n?.[t] || `Query ${t + 1}`;
		i.forEach((e) => {
			r.push({
				...e,
				__queryIndex: t,
				__queryLabel: a
			});
		});
	}), r;
}
function L(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	return e.forEach((e, r) => {
		let a = e.rawData(), o = t[r].measures || [];
		a.forEach((e) => {
			let t = n.map((t) => String(e[t] ?? "")).join("|");
			if (!i.has(t)) {
				let r = {};
				n.forEach((t) => {
					r[t] = e[t];
				}), i.set(t, r);
			}
			let a = i.get(t);
			o.forEach((t) => {
				t in a || (a[t] = e[t]);
			}), r === 0 && Object.keys(e).forEach((t) => {
				!n.includes(t) && !o.includes(t) && (t in a || (a[t] = e[t]));
			});
		});
	}), Array.from(i.values()).sort((e, t) => String(e[n[0]] ?? "").localeCompare(String(t[n[0]] ?? "")));
}
function R(e, t, n, r, i) {
	return e.length === 0 ? [] : e.length === 1 ? e[0].rawData() : n === "merge" && r && r.length > 0 ? L(e, t, r, i) : I(e, t, i);
}
function z(e, t) {
	let n = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set();
	return e.forEach((e) => {
		e.measures?.forEach((e) => n.add(e)), e.dimensions?.forEach((e) => r.add(e)), e.timeDimensions?.forEach((e) => i.add(e.dimension));
	}), {
		measures: Array.from(n),
		dimensions: Array.from(r),
		timeDimensions: Array.from(i)
	};
}
function B(e, t) {
	if (e.measures && e.measures.length > 0) {
		let t = e.measures[0], n = t.split(".");
		return n.length > 1 ? n[n.length - 1] : t;
	}
	return `Query ${t + 1}`;
}
function V(e, t) {
	let n = [];
	return e.forEach((e, r) => {
		[...e.dimensions || [], ...e.timeDimensions?.map((e) => e.dimension) || []].includes(t) || n.push(r);
	}), {
		isValid: n.length === 0,
		missingInQueries: n
	};
}
//#endregion
//#region src/client/hooks/queries/useMultiCubeLoadQuery.ts
var H = 300;
function U(e) {
	return e ? [
		"cube",
		"multiLoad",
		D(e)
	] : [
		"cube",
		"multiLoad",
		null
	];
}
function ee(e) {
	return !e || !e.queries || e.queries.length < 2 ? !1 : e.queries.filter((e) => e.measures && e.measures.length > 0 || e.dimensions && e.dimensions.length > 0 || e.timeDimensions && e.timeDimensions.length > 0).length >= 2;
}
function te(e, i = {}) {
	let { skip: a = !1, debounceMs: o = H, resetResultSetOnChange: s = !0, staleTime: c = 6e4, keepPreviousData: u = !0 } = i, { cubeApi: d, batchCoordinator: f, enableBatching: p } = t(), m = r(), h = ee(e), { debouncedValue: g, isDebouncing: _ } = O(e, {
		isValid: h,
		skip: a,
		debounceMs: o
	}), v = l(() => g ? {
		...g,
		queries: g.queries.map((e) => C(e))
	} : null, [g]), y = n({
		queryKey: U(v),
		queryFn: async () => {
			if (!v) throw Error("No config provided");
			let e;
			e = p && f ? await Promise.all(v.queries.map((e) => f.register(e))) : await d.batchLoad(v.queries);
			let t = e.map((e) => e && "error" in e && e.error ? Error(e.error) : null), n = e.map((e, n) => {
				if (t[n]) return null;
				try {
					return e.rawData();
				} catch {
					return null;
				}
			}), r = e.filter((e, n) => !t[n]), i = v.queries.filter((e, n) => !t[n]);
			return {
				data: r.length > 0 ? R(r, i, v.mergeStrategy, v.mergeKeys, v.queryLabels) : [],
				resultSets: e,
				perQueryData: n,
				errors: t,
				firstError: t.find((e) => e !== null) || null
			};
		},
		enabled: !!v && !a,
		staleTime: c,
		placeholderData: u ? (e) => e : void 0
	});
	return {
		data: y.data?.data ?? null,
		resultSets: y.data?.resultSets ?? null,
		perQueryData: y.data?.perQueryData ?? null,
		isLoading: y.isLoading || _,
		isFetching: y.isFetching,
		isDebouncing: _,
		error: y.data?.firstError ?? y.error,
		errors: y.data?.errors ?? [],
		debouncedConfig: g,
		isValidConfig: h,
		refetch: (e) => {
			v && (e?.bustCache ? (m.removeQueries({ queryKey: U(v) }), m.fetchQuery({
				queryKey: U(v),
				queryFn: async () => {
					let e = await d.batchLoad(v.queries, { bustCache: !0 }), t = e.map((e) => e && "error" in e && e.error ? Error(e.error) : null);
					return {
						data: v.mergeStrategy === "concat" ? e.flatMap((e) => e?.rawData() || []) : e[0]?.rawData() || [],
						resultSets: e,
						perQueryData: v.mergeStrategy === "concat" ? e.map((e) => e?.rawData() || []) : [],
						errors: t,
						firstError: t.find((e) => e !== null) || null
					};
				}
			})) : m.refetchQueries({ queryKey: U(v) }));
		}
	};
}
//#endregion
//#region src/client/hooks/queries/useFunnelQuery.ts
var ne = 300;
function W(e) {
	return e.isError ? "error" : e.isLoading ? "executing" : e.isSuccess ? "success" : "idle";
}
function G(e, t, n, r, i) {
	return {
		stepIndex: t,
		stepName: e.name,
		stepId: r?.steps?.[t]?.id || `step-${t}`,
		data: [],
		bindingKeyValues: [],
		bindingKeyTotalCount: 0,
		count: e.value,
		conversionRate: e.conversionRate === null ? null : e.conversionRate / 100,
		cumulativeConversionRate: n > 0 ? e.value / n : 0,
		executionTime: i,
		error: null
	};
}
function K(e, t) {
	return e || {
		id: "prebuilt-funnel",
		name: "Funnel Analysis",
		bindingKey: { dimension: typeof t?.funnel?.bindingKey == "string" ? t.funnel.bindingKey : t?.funnel?.bindingKey?.[0]?.dimension || "" },
		steps: (t?.funnel?.steps || []).map((e, t) => ({
			id: `step-${t}`,
			name: e.name,
			query: { filters: e.filter ? [e.filter] : [] },
			timeToConvert: e.timeToConvert || void 0
		}))
	};
}
function q(e) {
	if (!e || !e.bindingKey || !e.steps || e.steps.length < 2) return !1;
	if (typeof e.bindingKey.dimension == "string") {
		if (!e.bindingKey.dimension) return !1;
	} else if (Array.isArray(e.bindingKey.dimension) && e.bindingKey.dimension.length === 0) return !1;
	for (let t of e.steps) {
		let e = t.query;
		if (!(e.measures && e.measures.length > 0 || e.dimensions && e.dimensions.length > 0 || e.timeDimensions && e.timeDimensions.length > 0 || e.filters && e.filters.length > 0)) return !1;
	}
	return !0;
}
function J(i, u = {}) {
	let { skip: f = !1, debounceMs: p = ne, onComplete: m, onError: h, prebuiltServerQuery: g } = u, { cubeApi: _ } = t(), v = r(), { features: y } = e(), b = y.manualRefresh ?? !1, [x, S] = d(null), C = q(i), { debouncedValue: w, isDebouncing: T } = O(i, {
		isValid: C,
		skip: f,
		debounceMs: p
	}), E = l(() => {
		if (g) return g;
		if (!w || !C) return null;
		try {
			return a(w.steps.map((e) => e.query), w.bindingKey, w.steps.map((e) => e.name), w.steps.map((e) => e.timeToConvert || null), !0);
		} catch (e) {
			return console.error("Failed to build server funnel query:", e), null;
		}
	}, [
		g,
		w,
		C
	]), k = l(() => E ? [
		"cube",
		"funnel",
		E.funnel?.steps?.length || 0,
		JSON.stringify(E)
	] : [
		"cube",
		"funnel",
		null
	], [E]), A = E ? D(E) : null, j = l(() => !b || !A || x === null ? !1 : A !== x, [
		b,
		A,
		x
	]), M = l(() => !E || f ? !1 : !b || x === null || x === A, [
		E,
		f,
		b,
		x,
		A
	]);
	c(() => {
		!b && E && !f && S(A);
	}, [
		b,
		E,
		f,
		A
	]);
	let N = n({
		queryKey: k,
		queryFn: async () => {
			if (!E) throw Error("No server query available");
			let e = performance.now();
			try {
				let t = await _.load(E);
				return {
					rawData: t.rawData(),
					executionTime: performance.now() - e,
					cacheInfo: t.cacheInfo?.()
				};
			} catch (e) {
				let t = e instanceof Error ? e : Error(String(e));
				throw h?.(t, 0), t;
			}
		},
		enabled: M,
		staleTime: 6e4,
		gcTime: 3e5
	});
	c(() => {
		b && M && N.isSuccess && !N.isFetching && E && S(A);
	}, [
		b,
		M,
		N.isSuccess,
		N.isFetching,
		E,
		A
	]);
	let P = l(() => g?.funnel?.steps ? g.funnel.steps.map((e) => e.name) : w?.steps?.map((e) => e.name), [g, w]), F = l(() => g?.funnel?.steps ? g.funnel.steps.length : w?.steps?.length || 0, [g, w]), I = l(() => !N.data?.rawData || N.data.rawData.length !== F ? [] : o(N.data.rawData, P), [
		N.data,
		F,
		P
	]), L = l(() => {
		if (!I.length) return [];
		let e = I[0]?.value || 0, t = N.data?.executionTime || 0;
		return I.map((n, r) => G(n, r, e, w, t));
	}, [
		I,
		w,
		N.data?.executionTime
	]), R = l(() => {
		if (!I.length || !w && !g) return null;
		let e = I[0]?.value || 0, t = I[I.length - 1]?.value || 0, n = {
			config: K(w, g),
			steps: L,
			summary: {
				totalEntries: e,
				totalCompletions: t,
				overallConversionRate: e > 0 ? t / e : 0,
				totalExecutionTime: N.data?.executionTime || 0
			},
			chartData: I,
			status: W(N),
			error: N.error,
			currentStepIndex: null
		};
		return N.isSuccess && !N.isFetching && m?.(n), n;
	}, [
		w,
		g,
		I,
		L,
		N,
		m
	]), z = W(N), B = s(async (e) => {
		if (!E) return null;
		S(A);
		try {
			return e?.bustCache ? (v.removeQueries({ queryKey: k }), await v.fetchQuery({
				queryKey: k,
				queryFn: async () => {
					let e = performance.now(), t = await _.load(E, { bustCache: !0 });
					return {
						rawData: t.rawData(),
						executionTime: performance.now() - e,
						cacheInfo: t.cacheInfo?.()
					};
				}
			})) : await N.refetch(), R;
		} catch {
			return R;
		}
	}, [
		E,
		N,
		R,
		v,
		k,
		_,
		A
	]), V = s(() => {}, []), H = s(() => {
		v.removeQueries({ queryKey: k });
	}, [v, k]);
	return {
		result: R,
		status: z,
		isExecuting: N.isLoading || N.isFetching,
		isDebouncing: T,
		currentStepIndex: null,
		stepLoadingStates: [],
		stepResults: L,
		chartData: I,
		error: N.error,
		execute: B,
		cancel: V,
		reset: H,
		executedQueries: [],
		serverQuery: E,
		cacheInfo: N.data?.cacheInfo ?? null,
		needsRefresh: j
	};
}
function Y(e) {
	return e ? [
		"cube",
		"funnel",
		JSON.stringify(e)
	] : [
		"cube",
		"funnel",
		null
	];
}
//#endregion
//#region src/client/hooks/queries/useFlowQuery.ts
var X = 300;
function re(e) {
	if (!e?.flow) return !1;
	let { flow: t } = e;
	return !(!t.bindingKey || !t.timeDimension || !t.eventDimension || !t.startingStep?.filter || t.stepsBefore < 0 || t.stepsBefore > 5 || t.stepsAfter < 0 || t.stepsAfter > 5);
}
function ie(e) {
	if (e.length === 1) {
		let t = e[0];
		if (t && typeof t == "object" && "nodes" in t && "links" in t) return t;
	}
	if (e.length > 0) {
		let t = e[0];
		if (t && typeof t == "object" && i(t)) return t;
	}
	return null;
}
function ae(i, a = {}) {
	let { skip: o = !1, debounceMs: u = X, onComplete: f, onError: p } = a, { cubeApi: m } = t(), h = r(), { features: g } = e(), _ = g.manualRefresh ?? !1, [v, y] = d(null), b = re(i), { debouncedValue: x, isDebouncing: S } = O(i, {
		isValid: b,
		skip: o,
		debounceMs: u
	}), C = l(() => x ? JSON.stringify(x) : null, [x]), w = l(() => i ? JSON.stringify(i) : null, [i]), T = l(() => x ? [
		"cube",
		"flow",
		C
	] : [
		"cube",
		"flow",
		null
	], [x, C]), E = i ? D(i) : null, k = l(() => !_ || !E || v === null ? !1 : E !== v, [
		_,
		E,
		v
	]), A = l(() => !b || !x || o ? !1 : !_ || v === null || v === E, [
		b,
		x,
		o,
		_,
		v,
		E
	]);
	c(() => {
		!_ && i && !o && b && y(E);
	}, [
		_,
		i,
		o,
		b,
		E
	]);
	let j = n({
		queryKey: T,
		queryFn: async () => {
			if (!x) throw Error("No flow query available");
			let e = performance.now();
			try {
				let t = await m.load(x);
				return {
					rawData: t.rawData(),
					executionTime: performance.now() - e,
					cacheInfo: t.cacheInfo?.(),
					queryKeyString: w
				};
			} catch (e) {
				let t = e instanceof Error ? e : Error(String(e));
				throw p?.(t), t;
			}
		},
		enabled: A,
		staleTime: 6e4,
		gcTime: 3e5
	});
	c(() => {
		_ && A && j.isSuccess && !j.isFetching && x && y(E);
	}, [
		_,
		A,
		j.isSuccess,
		j.isFetching,
		x,
		E
	]);
	let M = w !== null && j.data?.queryKeyString !== void 0 && j.data.queryKeyString !== w, N = l(() => {
		if (M || !j.data?.rawData) return null;
		let e = ie(j.data.rawData);
		return e && j.isSuccess && !j.isFetching && f?.(e), e;
	}, [
		j.data,
		j.isSuccess,
		j.isFetching,
		f,
		M
	]), P = s((e) => {
		x && b && (y(E), e?.bustCache ? (h.removeQueries({ queryKey: T }), h.fetchQuery({
			queryKey: T,
			queryFn: async () => {
				let e = performance.now(), t = await m.load(x, { bustCache: !0 });
				return {
					rawData: t.rawData(),
					executionTime: performance.now() - e,
					cacheInfo: t.cacheInfo?.()
				};
			}
		})) : j.refetch());
	}, [
		x,
		b,
		j,
		h,
		T,
		m,
		E
	]), F = s(() => {
		h.removeQueries({ queryKey: T });
	}, [h, T]);
	return {
		data: N,
		rawData: M ? null : j.data?.rawData ?? null,
		cacheInfo: j.data?.cacheInfo ?? null,
		isLoading: j.isLoading || M,
		isFetching: j.isFetching,
		isDebouncing: S,
		isExecuting: j.isLoading || j.isFetching || M,
		error: j.error,
		refetch: P,
		reset: F,
		serverQuery: x,
		needsRefresh: k
	};
}
function oe(e) {
	return e ? [
		"cube",
		"flow",
		JSON.stringify(e)
	] : [
		"cube",
		"flow",
		null
	];
}
//#endregion
//#region src/client/hooks/queries/useRetentionQuery.ts
var se = 300;
function ce(e) {
	return !(!e || !e.retention || !e.retention.timeDimension || !e.retention.bindingKey || !e.retention.periods || e.retention.periods < 1);
}
function le(e) {
	if (e) {
		if (typeof e == "string") return e.split(".").pop();
		if (Array.isArray(e) && e.length > 0) {
			let t = e[0];
			if (t?.dimension) return t.dimension.split(".").pop();
		}
	}
}
function Z(e) {
	if (typeof e == "string") return e;
	if (e && typeof e == "object" && !Array.isArray(e)) {
		let t = Object.values(e);
		if (t.length > 0 && t[0] != null) return String(t[0]);
	}
	return null;
}
function Q(e, t, n) {
	if (!e || !Array.isArray(e) || e.length === 0) return {
		rows: [],
		periods: [],
		granularity: t,
		bindingKeyLabel: n
	};
	let r = e.map((e) => {
		let t = e;
		return {
			period: Number(t.period ?? t.period_number ?? 0),
			cohortSize: Number(t.cohortSize ?? t.cohort_size ?? 0),
			retainedUsers: Number(t.retainedUsers ?? t.retained_users ?? 0),
			retentionRate: Number(t.retentionRate ?? t.retention_rate ?? 0),
			breakdownValue: Z(t.breakdownValues) ?? t.breakdownValue ?? t.breakdown_value ?? null
		};
	}), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
	r.forEach((e) => {
		i.add(e.period), e.breakdownValue && a.add(e.breakdownValue);
	});
	let o = Array.from(i).sort((e, t) => e - t), s = a.size > 0 ? Array.from(a).sort() : void 0;
	return {
		rows: r,
		periods: o,
		breakdownValues: s,
		summary: ue(r, s),
		granularity: t,
		bindingKeyLabel: n
	};
}
function ue(e, t) {
	let n = e.filter((e) => e.period === 1).map((e) => e.retentionRate);
	return {
		totalUsers: e.filter((e) => e.period === 0).reduce((e, t) => e + t.cohortSize, 0),
		avgPeriod1Retention: n.length > 0 ? n.reduce((e, t) => e + t, 0) / n.length : 0,
		maxPeriod1Retention: n.length > 0 ? Math.max(...n) : 0,
		minPeriod1Retention: n.length > 0 ? Math.min(...n) : 0,
		segmentCount: t?.length || 1
	};
}
function de(i, a = {}) {
	let { skip: o = !1, debounceMs: u = se, onComplete: f, onError: p, getFieldLabel: m } = a, { cubeApi: h } = t(), g = r(), { features: _ } = e(), v = _.manualRefresh ?? !1, [y, b] = d(null), { debouncedValue: x, isDebouncing: S } = O(i, {
		isValid: ce(i),
		skip: o,
		debounceMs: u
	}), C = l(() => x ? [
		"cube",
		"retention",
		JSON.stringify(x)
	] : [
		"cube",
		"retention",
		null
	], [x]), w = x ? D(x) : null, T = l(() => !v || !w || y === null ? !1 : w !== y, [
		v,
		w,
		y
	]), E = l(() => !x || o ? !1 : !v || y === null || y === w, [
		x,
		o,
		v,
		y,
		w
	]);
	c(() => {
		!v && x && !o && b(w);
	}, [
		v,
		x,
		o,
		w
	]);
	let k = n({
		queryKey: C,
		queryFn: async () => {
			if (!x) throw Error("No retention query available");
			let e = performance.now();
			try {
				let t = await h.load(x);
				return {
					rawData: t.rawData(),
					executionTime: performance.now() - e,
					cacheInfo: t.cacheInfo?.()
				};
			} catch (e) {
				let t = e instanceof Error ? e : Error(String(e));
				throw p?.(t), t;
			}
		},
		enabled: E,
		staleTime: 6e4,
		gcTime: 3e5
	});
	c(() => {
		v && E && k.isSuccess && !k.isFetching && x && b(w);
	}, [
		v,
		E,
		k.isSuccess,
		k.isFetching,
		x,
		w
	]);
	let A = i?.retention?.granularity, j = l(() => {
		let e = i?.retention?.bindingKey;
		if (e) {
			if (typeof e == "string") return e;
			if (Array.isArray(e) && e.length > 0) return e[0]?.dimension;
		}
	}, [i?.retention?.bindingKey]), M = l(() => {
		if (j && m) {
			let e = m(j);
			if (e && e !== j) return e;
		}
		return le(i?.retention?.bindingKey);
	}, [
		j,
		m,
		i?.retention?.bindingKey
	]), N = l(() => {
		if (!k.data?.rawData) return null;
		let e = Q(k.data.rawData, A, M);
		return k.isSuccess && !k.isFetching && f?.(e), e;
	}, [
		k.data,
		k.isSuccess,
		k.isFetching,
		f,
		A,
		M
	]), P = s(async (e) => x ? (e?.bustCache && g.removeQueries({ queryKey: C }), b(w), Q((await g.fetchQuery({
		queryKey: C,
		queryFn: async () => {
			let e = await h.load(x);
			return {
				rawData: e.rawData(),
				executionTime: 0,
				cacheInfo: e.cacheInfo?.()
			};
		}
	})).rawData, A, M)) : null, [
		x,
		g,
		C,
		h,
		w,
		A,
		M
	]), F = s(() => {
		k.refetch();
	}, [k]), I = l(() => k.isError ? "error" : k.isLoading ? "loading" : k.isSuccess ? "success" : "idle", [
		k.isError,
		k.isLoading,
		k.isSuccess
	]);
	return {
		chartData: N,
		rawData: k.data?.rawData ?? null,
		status: I,
		isLoading: k.isLoading,
		isFetching: k.isFetching,
		isDebouncing: S,
		error: k.error,
		cacheInfo: k.data?.cacheInfo ?? null,
		execute: P,
		refetch: F,
		needsRefresh: T
	};
}
//#endregion
//#region src/client/hooks/useResponsiveDashboard.ts
var $ = 1200, fe = 768;
function pe() {
	let [e, t] = d(() => typeof window < "u" ? window.innerWidth : $), n = u(null), r = u(null), i = s((e) => {
		if (n.current &&= (n.current.disconnect(), null), r.current = e, e) {
			let r = e.offsetWidth;
			r > 0 && t(r), n.current = new ResizeObserver((e) => {
				let n = e[0]?.contentRect.width;
				n && n > 0 && t(n);
			}), n.current.observe(e);
		}
	}, []);
	c(() => () => {
		n.current && n.current.disconnect();
	}, []), c(() => {
		let e = () => {
			if (r.current) {
				let e = r.current.offsetWidth;
				e > 0 && t(e);
			}
		};
		window.addEventListener("resize", e);
		let n = setTimeout(e, 100);
		return () => {
			window.removeEventListener("resize", e), clearTimeout(n);
		};
	}, []);
	let a = l(() => e >= $ ? "desktop" : e >= fe ? "scaled" : "mobile", [e]);
	return {
		containerRef: i,
		containerWidth: e,
		displayMode: a,
		scaleFactor: l(() => a === "scaled" ? e / $ : 1, [e, a]),
		isEditable: a === "desktop",
		designWidth: $
	};
}
//#endregion
//#region src/client/hooks/useFilterValues.ts
function me(e, t = !0) {
	let [n, r] = d(null), i = u(""), { resultSet: a, isLoading: o, error: f } = M(n, {
		skip: !n || !t || !e,
		debounceMs: 150,
		keepPreviousData: !0
	}), p = l(() => {
		if (!a || o || f || !e) return [];
		try {
			let t = a.tablePivot(), n = /* @__PURE__ */ new Set();
			return t.forEach((t) => {
				let r = t[e];
				r != null && r !== "" && n.add(r);
			}), Array.from(n);
		} catch (e) {
			return console.error("Error extracting values from result set:", e), [];
		}
	}, [
		a,
		o,
		f,
		e
	]);
	c(() => {
		(!e || !t) && (r(null), i.current = "");
	}, [e, t]);
	let m = s(() => {
		if (e) {
			i.current = "";
			try {
				r({
					dimensions: [e],
					limit: 25,
					order: { [e]: "asc" }
				});
			} catch (e) {
				console.error("Error creating query:", e);
			}
		}
	}, [e]), h = s((t, n = !1) => {
		if (e && !(!n && t === i.current)) {
			i.current = t;
			try {
				let n = {
					dimensions: [e],
					limit: 25,
					order: { [e]: "asc" }
				};
				t && t.trim() && (n.filters = [{
					member: e,
					operator: "contains",
					values: [t.trim()]
				}]), r(n);
			} catch (e) {
				console.error("Error creating search query:", e);
			}
		}
	}, [e]);
	return {
		values: p,
		loading: o,
		error: f ? f instanceof Error ? f.message : String(f) : null,
		refetch: m,
		searchValues: h
	};
}
//#endregion
//#region src/client/hooks/useDebounce.ts
function he(e, t) {
	let [n, r] = d(e);
	return c(() => {
		let n = setTimeout(() => {
			r(e);
		}, t);
		return () => {
			clearTimeout(n);
		};
	}, [e, t]), n;
}
//#endregion
//#region src/client/hooks/useDirtyStateTracking.ts
function ge({ initialConfig: e, onConfigChange: t, onSave: n, onDirtyStateChange: r }) {
	let i = u(e), a = u(!1), o = s(async (e) => {
		if (a.current) {
			r && r(!0);
			try {
				n && await n(e), i.current = e, r && r(!1);
			} catch (e) {
				throw console.error("Save failed:", e), e;
			}
		}
	}, [n, r]);
	return {
		handleConfigChange: s((e) => {
			t && t(e), JSON.stringify(e) !== JSON.stringify(i.current) && (a.current = !0, r && r(!0));
		}, [t, r]),
		handleSave: o,
		hasChanged: s(() => a.current, []),
		resetInitialConfig: s((e) => {
			i.current = e, a.current = !1;
		}, [])
	};
}
//#endregion
export { g as A, D as C, T as D, E, x as F, y as I, S as L, m as M, p as N, _ as O, v as P, M as S, w as T, R as _, de as a, V as b, Y as c, te as d, B as f, N as g, P as h, pe as i, b as j, h as k, J as l, F as m, he as n, oe as o, z as p, me as r, ae as s, ge as t, U as u, L as v, C as w, A as x, I as y };

//# sourceMappingURL=useDirtyStateTracking-B_jkA-0w.js.map