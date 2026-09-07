import { c as e, l as t } from "./vendor-6y3E67du.js";
import { A as n, B as r, W as i, ct as a } from "./chart-data-table-Bn9EtETl.js";
import { C as o, w as s } from "./useDirtyStateTracking-B_jkA-0w.js";
import { useCallback as c, useMemo as l, useState as u } from "react";
//#region src/client/hooks/queries/useDryRunQuery.ts
function d(e) {
	return e ? [
		"cube",
		"dryRun",
		o(e)
	] : [
		"cube",
		"dryRun",
		null
	];
}
function f(e) {
	return e.mode ? e.mode : e.queryType === "comparisonQuery" ? "comparison" : e.queryType === "funnelQuery" ? "funnel" : e.queryType === "flowQuery" ? "flow" : e.queryType === "retentionQuery" ? "retention" : e.queryType === "regularQuery" ? "regular" : null;
}
function p(e) {
	let t = f(e);
	return {
		sql: e.sql ? {
			sql: e.sql.sql,
			params: e.sql.params || []
		} : null,
		analysis: e.analysis || null,
		mode: t,
		queryType: e.queryType || null,
		joinType: e.joinType || null,
		cubesUsed: e.cubesUsed || [],
		modeMetadata: e.modeMetadata
	};
}
function m(e, t = {}) {
	let { skip: n = !1, staleTime: a = 3e5 } = t, { cubeApi: o } = r(), c = l(() => {
		if (!e) return null;
		let t = e;
		return t.funnel || t.flow || t.retention ? e : s(e);
	}, [e]), u = i({
		queryKey: d(c),
		queryFn: async () => {
			if (!c) throw Error("No query provided");
			return p(await o.dryRun(c));
		},
		enabled: !!c && !n,
		staleTime: a
	});
	return {
		debugData: {
			...u.data || {
				sql: null,
				analysis: null,
				mode: null,
				queryType: null,
				joinType: null,
				cubesUsed: [],
				modeMetadata: void 0
			},
			loading: u.isLoading,
			error: u.error ?? null
		},
		refetch: () => u.refetch()
	};
}
function h(e, n = {}) {
	let { skip: i = !1, staleTime: a = 3e5 } = n, { cubeApi: o } = r(), c = l(() => e.map((e) => s(e)), [e]), u = t({ queries: c.map((e) => ({
		queryKey: d(e),
		queryFn: async () => p(await o.dryRun(e)),
		enabled: !i,
		staleTime: a
	})) });
	return {
		debugDataPerQuery: u.map((e) => ({
			...e.data || {
				sql: null,
				analysis: null,
				mode: null,
				queryType: null,
				joinType: null,
				cubesUsed: [],
				modeMetadata: void 0
			},
			loading: e.isLoading,
			error: e.error ?? null
		})),
		isLoading: u.some((e) => e.isLoading),
		refetchAll: () => {
			u.forEach((e) => e.refetch());
		}
	};
}
function g(e) {
	let { queries: t, isMultiQueryMode: n, skip: r = !1, staleTime: i } = e;
	return h(n ? t : t.slice(0, 1), {
		skip: r,
		staleTime: i
	});
}
//#endregion
//#region src/client/hooks/queries/useExplainQuery.ts
function _(e, t) {
	return e ? [
		"cube",
		"explain",
		o(e),
		t?.analyze ?? !1
	] : [
		"cube",
		"explain",
		null,
		null
	];
}
function v(e) {
	return !e || typeof e != "object" ? !1 : Object.prototype.hasOwnProperty.call(e, "funnel");
}
function y(e) {
	return !e || typeof e != "object" ? !1 : Object.prototype.hasOwnProperty.call(e, "flow");
}
function b(e) {
	return !e || typeof e != "object" ? !1 : Object.prototype.hasOwnProperty.call(e, "retention");
}
function x(e, t = {}) {
	let { skip: n = !1 } = t, { cubeApi: a } = r(), [o, d] = u(null), [f, p] = u(!1), m = l(() => e ? v(e) || y(e) || b(e) ? e : s(e) : null, [e]), h = !!m && !n && f, g = i({
		queryKey: _(m, o ?? void 0),
		queryFn: async () => {
			if (!m) throw Error("No query provided");
			return await a.explain(m, o ?? void 0);
		},
		enabled: h,
		staleTime: 0,
		gcTime: 0,
		refetchOnWindowFocus: !1,
		refetchOnReconnect: !1,
		refetchOnMount: !1
	}), x = c((e) => {
		n || !m || (d(e ?? null), p(!0), f && g.refetch());
	}, [
		n,
		m,
		f,
		g
	]), S = c(() => {
		p(!1), d(null);
	}, []);
	return {
		explainResult: g.data ?? null,
		isLoading: g.isLoading || g.isFetching,
		hasRun: f,
		error: g.error ?? null,
		runExplain: x,
		clearExplain: S
	};
}
//#endregion
//#region src/client/hooks/queries/useExplainAI.ts
var S = [
	"cube",
	"explain",
	"ai"
];
function C(t = {}) {
	let { features: i } = n(), { apiOptions: o } = r(), s = i.enableAI ?? !0, l = a(), u = t.aiEndpoint ?? "/api/ai/explain/analyze", d = e({
		mutationKey: S,
		mutationFn: async ({ explainResult: e, query: t }) => {
			if (!s) throw Error("AI features are disabled");
			let n = await fetch(u, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...o?.headers
				},
				credentials: "include",
				body: JSON.stringify({
					explainResult: e,
					query: t
				})
			});
			if (!n.ok) {
				let e = await n.json().catch(() => ({}));
				throw Error(e.error || e.message || `AI analysis failed: ${n.status} ${n.statusText}`);
			}
			return await n.json();
		},
		gcTime: 0
	}), f = c((e, t) => {
		d.mutate({
			explainResult: e,
			query: t
		});
	}, [d]), p = c(() => {
		d.reset(), l.removeQueries({ queryKey: S });
	}, [d, l]);
	return {
		analysis: d.data ?? null,
		isAnalyzing: d.isPending,
		error: d.error ?? null,
		analyze: f,
		clearAnalysis: p
	};
}
//#endregion
export { m as a, g as i, _ as n, h as o, x as r, C as t };

//# sourceMappingURL=useExplainAI-BAJgZbo9.js.map