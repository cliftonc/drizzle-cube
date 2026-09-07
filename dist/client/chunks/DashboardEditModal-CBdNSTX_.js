import { a as e, n as t, o as n, r, s as i, u as a } from "./vendor-6y3E67du.js";
import { n as o, t as s } from "./providers-DwQCKdGW.js";
import { A as c, C as l, F as u, I as d, M as f, P as p, ct as m, gt as h, j as g, v as _, y as v } from "./chart-data-table-Bn9EtETl.js";
import { r as y } from "./chart-sankey-DDzokqvF.js";
import { a as b, l as x, s as S } from "./retention-ChW9jYdy.js";
import { A as C, D as w, E as T, L as E, S as D, T as O, a as k, d as A, i as j, l as M, n as N, r as P, s as ee, t as te, u as F, w as I, x as ne } from "./useDirtyStateTracking-B_jkA-0w.js";
import { B as L, F as R, R as z } from "./chart-activity-grid-D6X0iOUw.js";
import { a as B, t as re } from "./charts-loader-DL6om-E1.js";
import { H as ie } from "./chart-area-95fIdTeM.js";
import { a as ae, t as oe } from "./syntaxHighlighting-Cm43as8i.js";
import { n as se, t as ce } from "./charts-core-pzDVGMWV.js";
import { n as le } from "./chart-gauge-nWTc1m7n.js";
import { t as ue } from "./chart-markdown-CRjxC5D7.js";
import de, { Component as fe, Fragment as pe, Suspense as me, createContext as V, forwardRef as he, lazy as ge, memo as H, startTransition as _e, useCallback as U, useContext as ve, useEffect as W, useImperativeHandle as ye, useMemo as G, useRef as K, useState as q } from "react";
import { Fragment as J, jsx as Y, jsxs as X } from "react/jsx-runtime";
import { createPortal as be } from "react-dom";
import xe, { verticalCompactor as Se } from "react-grid-layout";
//#region src/client/types.ts
function Ce(e) {
	return typeof e == "object" && !!e && "queries" in e && Array.isArray(e.queries) && e.queries.length > 0;
}
function we(e) {
	return typeof e == "object" && !!e && "funnel" in e && typeof e.funnel == "object";
}
//#endregion
//#region src/client/types/analysisConfig.ts
var Te = (e) => e.analysisType === "query", Ee = (e) => e.analysisType === "funnel", De = (e) => e.analysisType === "flow", Oe = (e) => e.analysisType === "retention", ke = (e) => "queries" in e.query && Array.isArray(e.query.queries), Ae = (e) => !ke(e), je = (e) => {
	if (!e || typeof e != "object") return !1;
	let t = e;
	return !(t.version !== 1 || t.analysisType !== "query" && t.analysisType !== "funnel" && t.analysisType !== "flow" && t.analysisType !== "retention" || !t.query || typeof t.query != "object" || t.activeView !== "table" && t.activeView !== "chart");
}, Me = () => ({
	version: 1,
	analysisType: "query",
	activeView: "chart",
	charts: { query: {
		chartType: "bar",
		chartConfig: {},
		displayConfig: {}
	} },
	query: {
		measures: [],
		dimensions: []
	}
}), Ne = () => ({
	version: 1,
	analysisType: "funnel",
	activeView: "chart",
	charts: { funnel: {
		chartType: "funnel",
		chartConfig: {},
		displayConfig: {}
	} },
	query: { funnel: {
		bindingKey: "",
		timeDimension: "",
		steps: []
	} }
}), Pe = () => ({
	version: 1,
	analysisType: "flow",
	activeView: "chart",
	charts: { flow: {
		chartType: "sankey",
		chartConfig: {},
		displayConfig: {}
	} },
	query: { flow: {
		bindingKey: "",
		timeDimension: "",
		eventDimension: "",
		startingStep: {
			name: "",
			filter: void 0
		},
		stepsBefore: 3,
		stepsAfter: 3,
		joinStrategy: "auto"
	} }
}), Fe = () => ({
	version: 1,
	analysisType: "retention",
	activeView: "chart",
	charts: { retention: {
		chartType: "heatmap",
		chartConfig: {},
		displayConfig: {}
	} },
	query: { retention: {
		timeDimension: "",
		bindingKey: "",
		dateRange: {
			start: "",
			end: ""
		},
		granularity: "week",
		periods: 12,
		retentionType: "classic"
	} }
}), Z = (e = "query") => {
	switch (e) {
		case "funnel": return Ne();
		case "flow": return Pe();
		case "retention": return Fe();
		default: return Me();
	}
}, Ie = (e) => {
	if (!e || typeof e != "object") return !1;
	let t = e;
	return !(t.version !== 1 || t.activeType !== "query" && t.activeType !== "funnel" && t.activeType !== "flow" && t.activeType !== "retention" || !t.modes || typeof t.modes != "object");
}, Le = () => ({
	version: 1,
	activeType: "query",
	modes: {
		query: Me(),
		funnel: Ne(),
		flow: Pe(),
		retention: Fe()
	}
});
//#endregion
//#region src/client/utils/configMigration.ts
function Re(e) {
	return typeof e == "object" && !!e && "queries" in e && Array.isArray(e.queries);
}
function ze(e) {
	return typeof e == "object" && !!e && "queries" in e && Array.isArray(e.queries) && "mergeStrategy" in e && e.mergeStrategy === "funnel";
}
function Be(e) {
	return typeof e == "object" && !!e && "funnel" in e && typeof e.funnel == "object";
}
function Ve(e) {
	return typeof e == "object" && !!e && "flow" in e && typeof e.flow == "object";
}
function He(e, t) {
	return t === "funnel" ? {
		chartType: e.funnelChartType || e.chartType || "funnel",
		chartConfig: e.funnelChartConfig || e.chartConfig || {},
		displayConfig: e.funnelDisplayConfig || e.displayConfig || {}
	} : t === "flow" ? {
		chartType: e.chartType || "sankey",
		chartConfig: e.chartConfig || {},
		displayConfig: e.displayConfig || {}
	} : t === "retention" ? {
		chartType: e.chartType || "retentionCombined",
		chartConfig: e.chartConfig || {},
		displayConfig: e.displayConfig || {}
	} : {
		chartType: e.chartType || "bar",
		chartConfig: e.chartConfig || {},
		displayConfig: e.displayConfig || {}
	};
}
function Ue(e) {
	try {
		let t = JSON.parse(e.query);
		if (x(t)) return {
			version: 1,
			analysisType: "retention",
			activeView: "chart",
			charts: { retention: He(e, "retention") },
			query: t
		};
		if (Ve(t)) return {
			version: 1,
			analysisType: "flow",
			activeView: "chart",
			charts: { flow: He(e, "flow") },
			query: t
		};
		if (Be(t)) return {
			version: 1,
			analysisType: "funnel",
			activeView: "chart",
			charts: { funnel: He(e, "funnel") },
			query: t
		};
		if (ze(t)) return We(t, e);
		if (e.analysisType === "funnel") return {
			version: 1,
			analysisType: "funnel",
			activeView: "chart",
			charts: { funnel: He(e, "funnel") },
			query: Be(t) ? t : { funnel: {
				bindingKey: "",
				timeDimension: "",
				steps: []
			} }
		};
		let n = He(e, "query");
		return Re(t) ? {
			version: 1,
			analysisType: "query",
			activeView: "chart",
			charts: { query: n },
			query: {
				queries: t.queries,
				mergeStrategy: t.mergeStrategy === "funnel" ? "concat" : t.mergeStrategy,
				mergeKeys: t.mergeKeys,
				queryLabels: t.queryLabels
			}
		} : {
			version: 1,
			analysisType: "query",
			activeView: "chart",
			charts: { query: n },
			query: t
		};
	} catch (e) {
		return console.warn("[configMigration] Failed to parse legacy portlet:", e), Me();
	}
}
function We(e, t) {
	let n = "";
	e.funnelBindingKey?.dimension && (typeof e.funnelBindingKey.dimension == "string" ? n = e.funnelBindingKey.dimension : Array.isArray(e.funnelBindingKey.dimension) && (n = e.funnelBindingKey.dimension.map((e) => ({
		cube: e.cube,
		dimension: e.dimension
	}))));
	let r = "";
	e.queries.length > 0 && e.queries[0].timeDimensions?.length && (r = e.queries[0].timeDimensions[0].dimension);
	let i = e.queries.map((t, n) => {
		let r = { name: e.queryLabels?.[n] || `Step ${n + 1}` };
		return t.filters && t.filters.length > 0 && (r.filter = t.filters.length === 1 ? t.filters[0] : { and: t.filters }), e.stepTimeToConvert && e.stepTimeToConvert[n] && (r.timeToConvert = e.stepTimeToConvert[n]), r;
	});
	return {
		version: 1,
		analysisType: "funnel",
		activeView: "chart",
		charts: { funnel: t ? He(t, "funnel") : {
			chartType: "funnel",
			chartConfig: {},
			displayConfig: {}
		} },
		query: { funnel: {
			bindingKey: n,
			timeDimension: r,
			steps: i,
			includeTimeMetrics: !0
		} }
	};
}
function Ge(e) {
	if (je(e)) return e;
	if (e && typeof e == "object" && "query" in e && typeof e.query == "string") return Ue(e);
	if (e && typeof e == "object") try {
		return Ue({ query: JSON.stringify(e) });
	} catch {}
	return console.warn("[configMigration] Unknown config format, using defaults"), Me();
}
function Ke(e) {
	return typeof e == "object" && !!e && "analysisConfig" in e && je(e.analysisConfig);
}
function Q(e) {
	if (Ke(e)) return e;
	let t = Ue({
		query: e.query ?? "{}",
		chartType: e.chartType,
		chartConfig: e.chartConfig,
		displayConfig: e.displayConfig,
		analysisType: e.analysisType === "flow" || e.analysisType === "retention" ? void 0 : e.analysisType,
		funnelChartType: e.funnelChartType,
		funnelChartConfig: e.funnelChartConfig,
		funnelDisplayConfig: e.funnelDisplayConfig
	});
	return {
		...e,
		analysisConfig: t
	};
}
//#endregion
//#region src/client/shared/filters/operators.ts
var qe = {
	equals: {
		label: "filter.operator.equals.label",
		description: "filter.operator.equals.description",
		requiresValues: !0,
		supportsMultipleValues: !0,
		valueType: "any",
		fieldTypes: [
			"string",
			"number",
			"boolean",
			"time"
		]
	},
	notEquals: {
		label: "filter.operator.notEquals.label",
		description: "filter.operator.notEquals.description",
		requiresValues: !0,
		supportsMultipleValues: !0,
		valueType: "any",
		fieldTypes: [
			"string",
			"number",
			"boolean",
			"time"
		]
	},
	contains: {
		label: "filter.operator.contains.label",
		description: "filter.operator.contains.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "string",
		fieldTypes: ["string"]
	},
	notContains: {
		label: "filter.operator.notContains.label",
		description: "filter.operator.notContains.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "string",
		fieldTypes: ["string"]
	},
	startsWith: {
		label: "filter.operator.startsWith.label",
		description: "filter.operator.startsWith.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "string",
		fieldTypes: ["string"]
	},
	notStartsWith: {
		label: "filter.operator.notStartsWith.label",
		description: "filter.operator.notStartsWith.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "string",
		fieldTypes: ["string"]
	},
	endsWith: {
		label: "filter.operator.endsWith.label",
		description: "filter.operator.endsWith.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "string",
		fieldTypes: ["string"]
	},
	notEndsWith: {
		label: "filter.operator.notEndsWith.label",
		description: "filter.operator.notEndsWith.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "string",
		fieldTypes: ["string"]
	},
	like: {
		label: "filter.operator.like.label",
		description: "filter.operator.like.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "string",
		fieldTypes: ["string"]
	},
	notLike: {
		label: "filter.operator.notLike.label",
		description: "filter.operator.notLike.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "string",
		fieldTypes: ["string"]
	},
	ilike: {
		label: "filter.operator.ilike.label",
		description: "filter.operator.ilike.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "string",
		fieldTypes: ["string"]
	},
	gt: {
		label: "filter.operator.gt.label",
		description: "filter.operator.gt.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "number",
		fieldTypes: [
			"number",
			"count",
			"sum",
			"avg",
			"min",
			"max"
		]
	},
	gte: {
		label: "filter.operator.gte.label",
		description: "filter.operator.gte.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "number",
		fieldTypes: [
			"number",
			"count",
			"sum",
			"avg",
			"min",
			"max"
		]
	},
	lt: {
		label: "filter.operator.lt.label",
		description: "filter.operator.lt.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "number",
		fieldTypes: [
			"number",
			"count",
			"sum",
			"avg",
			"min",
			"max"
		]
	},
	lte: {
		label: "filter.operator.lte.label",
		description: "filter.operator.lte.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "number",
		fieldTypes: [
			"number",
			"count",
			"sum",
			"avg",
			"min",
			"max"
		]
	},
	between: {
		label: "filter.operator.between.label",
		description: "filter.operator.between.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "number",
		fieldTypes: [
			"number",
			"count",
			"sum",
			"avg",
			"min",
			"max"
		]
	},
	notBetween: {
		label: "filter.operator.notBetween.label",
		description: "filter.operator.notBetween.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "number",
		fieldTypes: [
			"number",
			"count",
			"sum",
			"avg",
			"min",
			"max"
		]
	},
	in: {
		label: "filter.operator.in.label",
		description: "filter.operator.in.description",
		requiresValues: !0,
		supportsMultipleValues: !0,
		valueType: "any",
		fieldTypes: [
			"string",
			"number",
			"boolean"
		]
	},
	notIn: {
		label: "filter.operator.notIn.label",
		description: "filter.operator.notIn.description",
		requiresValues: !0,
		supportsMultipleValues: !0,
		valueType: "any",
		fieldTypes: [
			"string",
			"number",
			"boolean"
		]
	},
	set: {
		label: "filter.operator.set.label",
		description: "filter.operator.set.description",
		requiresValues: !1,
		supportsMultipleValues: !1,
		valueType: "any",
		fieldTypes: [
			"string",
			"number",
			"time",
			"boolean"
		]
	},
	notSet: {
		label: "filter.operator.notSet.label",
		description: "filter.operator.notSet.description",
		requiresValues: !1,
		supportsMultipleValues: !1,
		valueType: "any",
		fieldTypes: [
			"string",
			"number",
			"time",
			"boolean"
		]
	},
	isEmpty: {
		label: "filter.operator.isEmpty.label",
		description: "filter.operator.isEmpty.description",
		requiresValues: !1,
		supportsMultipleValues: !1,
		valueType: "string",
		fieldTypes: ["string"]
	},
	isNotEmpty: {
		label: "filter.operator.isNotEmpty.label",
		description: "filter.operator.isNotEmpty.description",
		requiresValues: !1,
		supportsMultipleValues: !1,
		valueType: "string",
		fieldTypes: ["string"]
	},
	inDateRange: {
		label: "filter.operator.inDateRange.label",
		description: "filter.operator.inDateRange.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "date",
		fieldTypes: ["time"]
	},
	beforeDate: {
		label: "filter.operator.beforeDate.label",
		description: "filter.operator.beforeDate.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "date",
		fieldTypes: ["time"]
	},
	afterDate: {
		label: "filter.operator.afterDate.label",
		description: "filter.operator.afterDate.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "date",
		fieldTypes: ["time"]
	},
	regex: {
		label: "filter.operator.regex.label",
		description: "filter.operator.regex.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "string",
		fieldTypes: ["string"]
	},
	notRegex: {
		label: "filter.operator.notRegex.label",
		description: "filter.operator.notRegex.description",
		requiresValues: !0,
		supportsMultipleValues: !1,
		valueType: "string",
		fieldTypes: ["string"]
	},
	arrayContains: {
		label: "filter.operator.arrayContains.label",
		description: "filter.operator.arrayContains.description",
		requiresValues: !0,
		supportsMultipleValues: !0,
		valueType: "string",
		fieldTypes: ["string"]
	},
	arrayOverlaps: {
		label: "filter.operator.arrayOverlaps.label",
		description: "filter.operator.arrayOverlaps.description",
		requiresValues: !0,
		supportsMultipleValues: !0,
		valueType: "string",
		fieldTypes: ["string"]
	},
	arrayContained: {
		label: "filter.operator.arrayContained.label",
		description: "filter.operator.arrayContained.description",
		requiresValues: !0,
		supportsMultipleValues: !0,
		valueType: "string",
		fieldTypes: ["string"]
	}
}, Je = /* @__PURE__ */ new Set([
	"string",
	"time",
	"boolean"
]);
function Ye(e) {
	return Je.has(e) ? e : "number";
}
function Xe(e) {
	let t = Ye(e), n = [];
	for (let [e, r] of Object.entries(qe)) r.fieldTypes.includes(t) && n.push({
		operator: e,
		label: r.label
	});
	return n;
}
//#endregion
//#region src/client/utils/filterUtils.ts
function Ze(e) {
	return e ? e.map((e) => typeof e == "string" ? { filterId: e } : e) : [];
}
function Qe(e) {
	return e.map((e) => e.member ? e : e.filterId);
}
function $e(e, t) {
	return e ? e.some((e) => typeof e == "string" ? e === t : e.filterId === t) : !1;
}
function et(e, t) {
	if (!e) return;
	let n = e.find((e) => typeof e == "string" ? e === t : e.filterId === t);
	return typeof n == "object" ? n.member : void 0;
}
function tt(e, t) {
	return t && "member" in e && "operator" in e ? {
		...e,
		member: t
	} : e;
}
function nt(e) {
	if ("member" in e && "operator" in e) {
		let t = e;
		return [
			"set",
			"notSet",
			"isEmpty",
			"isNotEmpty"
		].includes(t.operator) || t.operator === "inDateRange" && t.dateRange ? !0 : !!(t.values && t.values.length > 0);
	}
	return "type" in e && "filters" in e && e.filters.filter((e) => nt(e)).length > 0;
}
function rt(e, t) {
	return !e || !e.length || !t || !t.length ? [] : e.filter((e) => $e(t, e.id)).filter((e) => nt(e.filter)).map((e) => tt(e.filter, et(t, e.id)));
}
function it(e, t, n = "server") {
	return !e || e.length === 0 ? t : !t || t.length === 0 ? [...e] : n === "server" ? [{ and: E([...e, ...t]) }] : [{
		type: "and",
		filters: [...e, ...t]
	}];
}
function at(e) {
	let t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set();
	return e.portlets.forEach((e) => {
		try {
			let i = Q(e).analysisConfig.query, a = (e) => {
				e.measures && Array.isArray(e.measures) && e.measures.forEach((e) => t.add(e)), e.dimensions && Array.isArray(e.dimensions) && e.dimensions.forEach((e) => n.add(e)), e.timeDimensions && Array.isArray(e.timeDimensions) && e.timeDimensions.forEach((e) => {
					e.dimension && r.add(e.dimension);
				}), e.filters && C(e.filters).forEach((e) => {
					n.add(e);
				});
			};
			if ("funnel" in i) {
				let e = i;
				e.funnel?.timeDimension && r.add(e.funnel.timeDimension);
			} else "queries" in i ? i.queries.forEach((e) => a(e)) : a(i);
		} catch (t) {
			console.warn("Failed to extract fields from portlet:", e.id, t);
		}
	}), {
		measures: t,
		dimensions: n,
		timeDimensions: r
	};
}
function ot(e) {
	if (e.dateRange) return e.dateRange;
	if (e.values && e.values.length > 0) return e.values.length === 1 ? e.values[0] : e.values;
}
function st(e, t) {
	if (!t || t.length === 0) return t;
	let n = e?.find((e) => !e.isUniversalTime || !("member" in e.filter) ? !1 : ot(e.filter) !== void 0);
	if (!n) return t;
	let r = ot(n.filter), i = Array.isArray(r) ? r : [r], a = (e) => {
		if ("filters" in e && Array.isArray(e.filters)) {
			let t = e;
			return {
				...t,
				filters: t.filters.map(a)
			};
		}
		let t = e;
		return t.operator === "inDateRange" && t.member ? {
			...t,
			values: i,
			dateRange: r
		} : e;
	};
	return t.map(a);
}
function ct(e, t, n) {
	if (!n || n.length === 0) return n;
	let r = e?.filter((e) => e.isUniversalTime)?.filter((e) => {
		if (!("member" in e.filter)) return !1;
		let t = e.filter;
		return ot(t) !== void 0;
	});
	if (!r || r.length === 0) return n;
	let i = r[0].filter, a = ot(i);
	return n.map((e) => ({
		...e,
		dateRange: a
	}));
}
//#endregion
//#region src/client/components/analyticsPortlet/parsePortletQuery.ts
var lt = {
	queryObject: null,
	multiQueryConfig: null,
	serverFunnelQuery: null,
	serverFlowQuery: null,
	serverRetentionQuery: null
};
function ut(e) {
	if (typeof e == "string") return e;
	if (Array.isArray(e) && e.length > 0) {
		let t = e[0];
		return `${t.cube}.${t.dimension}`;
	}
}
function dt(e, t) {
	let n = t?.filter((e) => e.isUniversalTime);
	if (!n || n.length === 0 || e.funnel.steps.length === 0) return;
	let r = n[0];
	if (!("member" in r.filter)) return;
	let i = r.filter, a = i.dateRange || i.values?.[0];
	if (!a) return;
	let o = ut(e.funnel.timeDimension);
	if (!o) return;
	let s = { ...e.funnel.steps[0] }, c = {
		member: o,
		operator: "inDateRange",
		values: [],
		dateRange: a
	};
	s.filter = [...s.filter ? Array.isArray(s.filter) ? s.filter : [s.filter] : [], c], e.funnel.steps[0] = s;
}
function ft(e, t, n) {
	let r = {
		...e,
		funnel: {
			...e.funnel,
			steps: [...e.funnel.steps]
		}
	};
	if (t.length > 0 && r.funnel.steps.length > 0) {
		let e = { ...r.funnel.steps[0] };
		e.filter = it(t, e.filter ? Array.isArray(e.filter) ? e.filter : [e.filter] : []), r.funnel.steps[0] = e;
	}
	return dt(r, n), r;
}
function pt(e) {
	let { query: t, shouldSkipQuery: n, regularFilters: r, dashboardFilters: i, dashboardFilterMapping: a } = e;
	if (n) return lt;
	try {
		let e = JSON.parse(t), n = rt(r, a);
		if (x(e)) return {
			...lt,
			serverRetentionQuery: e
		};
		if (y(e)) return {
			...lt,
			serverFlowQuery: e
		};
		if (we(e)) {
			let t = ft(e, n, i);
			return {
				...lt,
				serverFunnelQuery: t
			};
		}
		if (Ce(e)) {
			let t = {
				...e,
				queries: e.queries.map((e) => ({
					...e,
					filters: st(i, it(n, e.filters)),
					timeDimensions: ct(i, a, e.timeDimensions)
				}))
			};
			return {
				...lt,
				multiQueryConfig: t
			};
		}
		let o = st(i, it(n, e.filters)), s = ct(i, a, e.timeDimensions);
		return {
			...lt,
			queryObject: {
				...e,
				filters: o,
				timeDimensions: s
			}
		};
	} catch (e) {
		return console.error("AnalyticsPortlet: Invalid query JSON:", e), lt;
	}
}
//#endregion
//#region src/client/utils/drillQueryBuilder.ts
function mt() {
	return `drill-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
function ht(e, t) {
	for (let n of t.cubes) {
		let t = n.dimensions.find((t) => t.name === e);
		if (t && t.type === "time") return !0;
	}
	return !1;
}
function gt(e, t) {
	for (let n of t.cubes) {
		let t = n.dimensions.find((t) => t.name === e);
		if (t && t.type === "time" && t.granularities) return t.granularities;
	}
	return [
		"year",
		"quarter",
		"month",
		"week",
		"day",
		"hour"
	];
}
function _t(e, t) {
	for (let n of t.cubes) {
		let t = n.measures.find((t) => t.name === e);
		if (t && t.drillMembers && t.drillMembers.length > 0) return t.drillMembers;
	}
	return null;
}
function vt(e, t) {
	let [n] = e.split("."), r = t.cubes.find((e) => e.name === n);
	if (r && r.hierarchies) for (let t of r.hierarchies) {
		let n = t.levels.indexOf(e);
		if (n !== -1) return {
			hierarchy: t,
			levelIndex: n
		};
	}
	return null;
}
function yt(e, t, n, r, i) {
	if (!n) return [];
	let a = [], { clickedField: o } = e, s = o, c = _t(s, n), l = bt(t, n, r, i);
	a.push(...l);
	let u = xt(t, n, r, i);
	if (a.push(...u), c && c.length > 0) for (let e of c) {
		let t = St(e, n);
		a.push({
			id: `details-${s}-${e}`,
			label: `Show by ${t}`,
			type: "details",
			icon: "table",
			scope: "portlet",
			measure: s,
			targetDimension: e
		});
	}
	return a;
}
function bt(e, t, n, r) {
	let i = [];
	if (!e.timeDimensions || e.timeDimensions.length === 0) return i;
	let a = e.timeDimensions[0], o = a.granularity, s = gt(a.dimension, t);
	if (s.length === 0) return i;
	if (!o) {
		for (let e of s) i.push({
			id: `time-set-${e}-portlet`,
			label: `View by ${Ct(e)}`,
			type: "drillDown",
			icon: "time",
			targetGranularity: e,
			scope: "portlet"
		});
		return i;
	}
	let c = s.indexOf(o);
	for (let e = c + 1; e < s.length; e++) {
		let t = s[e];
		i.push({
			id: `time-down-${t}-portlet`,
			label: `Drill to ${Ct(t)}`,
			type: "drillDown",
			icon: "time",
			targetGranularity: t,
			scope: "portlet"
		});
	}
	for (let e = c - 1; e >= 0; e--) {
		let t = s[e];
		i.push({
			id: `time-up-${t}-portlet`,
			label: `Roll up to ${Ct(t)}`,
			type: "drillUp",
			icon: "time",
			targetGranularity: t,
			scope: "portlet"
		});
	}
	return i;
}
function xt(e, t, n, r) {
	let i = [];
	if (!e.dimensions || e.dimensions.length === 0) return i;
	for (let n of e.dimensions) {
		let e = vt(n, t);
		if (!e) continue;
		let { hierarchy: r, levelIndex: a } = e;
		if (a < r.levels.length - 1) {
			let e = r.levels[a + 1];
			i.push({
				id: `hierarchy-down-${r.name}-${e}`,
				label: `Drill to ${St(e, t)}`,
				type: "drillDown",
				icon: "hierarchy",
				hierarchy: r.name,
				targetDimension: e,
				scope: "portlet"
			});
		}
		if (a > 0) {
			let e = r.levels[a - 1];
			i.push({
				id: `hierarchy-up-${r.name}-${e}`,
				label: `Roll up to ${St(e, t)}`,
				type: "drillUp",
				icon: "hierarchy",
				hierarchy: r.name,
				targetDimension: e,
				scope: "portlet"
			});
		}
	}
	return i;
}
function St(e, t) {
	for (let n of t.cubes) {
		let t = n.dimensions.find((t) => t.name === e);
		if (t) return t.title || t.shortTitle || e.split(".")[1];
	}
	return e.split(".")[1];
}
function Ct(e) {
	return e.charAt(0).toUpperCase() + e.slice(1);
}
function wt(e, t, n, r) {
	switch (e.type) {
		case "drillDown": return Tt(e, t, n, r);
		case "drillUp": return Et(e, t, n, r);
		case "details": return Dt(e, t, n, r);
		default: throw Error(`Unknown drill type: ${e.type}`);
	}
}
function Tt(e, t, n, r) {
	let { xValue: i } = t, a = { ...n }, o = [];
	if (e.targetGranularity && n.timeDimensions) {
		let t = n.timeDimensions[0], r = t.granularity;
		return a.timeDimensions = [{
			...t,
			granularity: e.targetGranularity,
			dateRange: Ot(String(i), r || "month")
		}], {
			query: a,
			pathEntry: {
				id: mt(),
				label: String(i),
				query: a,
				filters: o,
				granularity: e.targetGranularity,
				clickedValue: i
			}
		};
	}
	if (e.targetDimension) {
		let t = n.dimensions || [], s = e.hierarchy ? vt(e.targetDimension, r) : null, c = t.map((t) => s && s.hierarchy.levels.includes(t) ? e.targetDimension : t);
		c.includes(e.targetDimension) || c.push(e.targetDimension), a.dimensions = c;
		let l = t.find((t) => {
			let n = vt(t, r);
			return n && n.hierarchy.name === e.hierarchy;
		});
		if (l && i !== void 0) {
			let e = {
				member: l,
				operator: "equals",
				values: [String(i)]
			};
			o.push(e), a.filters = [...n.filters || [], e];
		}
		return {
			query: a,
			pathEntry: {
				id: mt(),
				label: String(i),
				query: a,
				filters: o,
				dimension: e.targetDimension,
				hierarchy: e.hierarchy,
				clickedValue: i
			}
		};
	}
	return {
		query: a,
		pathEntry: {
			id: mt(),
			label: "Drill",
			query: a,
			filters: o,
			clickedValue: i
		}
	};
}
function Et(e, t, n, r) {
	let i = { ...n };
	if (e.targetGranularity && n.timeDimensions) {
		let t = n.timeDimensions[0];
		return i.timeDimensions = [{
			...t,
			granularity: e.targetGranularity,
			dateRange: t.dateRange
		}], {
			query: i,
			pathEntry: {
				id: mt(),
				label: `By ${Ct(e.targetGranularity)}`,
				query: i,
				granularity: e.targetGranularity
			}
		};
	}
	if (e.targetDimension) {
		let t = n.dimensions || [], a = e.hierarchy ? vt(e.targetDimension, r) : null;
		if (i.dimensions = t.map((t) => a && a.hierarchy.levels.includes(t) ? e.targetDimension : t), n.filters && a) {
			let t = a.hierarchy.levels.indexOf(e.targetDimension), r = a.hierarchy.levels.slice(t + 1);
			i.filters = n.filters.filter((e) => "member" in e ? !r.includes(e.member) : !0);
		}
		return {
			query: i,
			pathEntry: {
				id: mt(),
				label: `By ${St(e.targetDimension, r)}`,
				query: i,
				dimension: e.targetDimension,
				hierarchy: e.hierarchy
			}
		};
	}
	return {
		query: i,
		pathEntry: {
			id: mt(),
			label: "Roll Up",
			query: i
		}
	};
}
function Dt(e, t, n, r) {
	let { xValue: i } = t, a = e.measure || t.clickedField, o = e.targetDimension;
	if (!o) throw Error(`No targetDimension specified for details drill on measure ${a}`);
	let s = St(o, r), c = n.dimensions?.[0] || n.timeDimensions?.[0]?.dimension, l = c ? St(c, r) : null, u = ht(o, r), d = {
		measures: [a],
		dimensions: u ? [] : [o],
		timeDimensions: u ? [{
			dimension: o,
			granularity: n.timeDimensions?.[0]?.granularity || "day",
			dateRange: n.timeDimensions?.[0]?.dateRange
		}] : n.timeDimensions,
		filters: [...n.filters || []],
		limit: 100
	};
	if (c && i != null && i !== "") {
		let e = {
			member: c,
			operator: "equals",
			values: [String(i)]
		};
		d.filters = [...d.filters || [], e];
	}
	let f = {
		xAxis: [o],
		yAxis: [a]
	}, p = i != null && i !== "" ? `By ${s} (${l}: ${i})` : `By ${s}`;
	return {
		query: d,
		chartConfig: f,
		pathEntry: {
			id: mt(),
			label: p,
			query: d,
			filters: d.filters,
			clickedValue: i,
			chartConfig: f
		}
	};
}
function Ot(e, t) {
	let n = new Date(e);
	if (isNaN(n.getTime())) return [e, e];
	switch (t) {
		case "year": {
			let e = n.getFullYear();
			return [`${e}-01-01`, `${e}-12-31`];
		}
		case "quarter": {
			let e = n.getFullYear(), t = Math.floor(n.getMonth() / 3) * 3, r = t + 2;
			return [`${e}-${String(t + 1).padStart(2, "0")}-01`, `${e}-${String(r + 1).padStart(2, "0")}-${new Date(e, r + 1, 0).getDate()}`];
		}
		case "month": {
			let e = n.getFullYear(), t = n.getMonth(), r = new Date(e, t + 1, 0).getDate();
			return [`${e}-${String(t + 1).padStart(2, "0")}-01`, `${e}-${String(t + 1).padStart(2, "0")}-${r}`];
		}
		case "week": {
			let e = n.getDay(), t = e === 0 ? -6 : 1 - e, r = new Date(n);
			r.setDate(n.getDate() + t);
			let i = new Date(r);
			return i.setDate(r.getDate() + 6), [r.toISOString().split("T")[0], i.toISOString().split("T")[0]];
		}
		default: {
			let e = n.toISOString().split("T")[0];
			return [e, e];
		}
	}
}
//#endregion
//#region src/client/hooks/drillNavigation.ts
function kt(e, t) {
	let n = e.findIndex(t);
	if (n === -1) return null;
	let r = n + 1;
	if (r < e.length) {
		let t = e.slice(0, r), n = t[t.length - 1];
		return {
			newPath: t,
			query: n.query,
			chartConfig: n.chartConfig || null
		};
	}
	return null;
}
function At(e, t) {
	return !!(e.targetGranularity && t && e.targetGranularity === t);
}
function jt(e, t) {
	return e.targetGranularity && t.timeDimensions?.[0] ? t.timeDimensions[0].granularity ?? null : null;
}
//#endregion
//#region src/client/hooks/useDrillInteraction.ts
function Mt(e) {
	let { query: t, metadata: n, onQueryChange: r, chartConfig: i, dashboardFilters: a, dashboardFilterMapping: o, enabled: s = !0 } = e, [c, l] = q(!1), [u, d] = q(null), [f, p] = q([]), [m, h] = q(null), [g, _] = q([]), [v, y] = q(null), [b, x] = q(null), [S, C] = q(null), [w, T] = q(null), E = G(() => {
		if (!s || !n) return !1;
		let e = (t.timeDimensions?.length ?? 0) > 0, r = (t.dimensions?.length ?? 0) > 0, i = t.measures?.some((e) => _t(e, n) !== null) ?? !1;
		return e || r || i;
	}, [
		s,
		n,
		t
	]), D = G(() => !a || !o ? !1 : a.some((e) => e.isUniversalTime && $e(o, e.id)), [a, o]), O = U((e) => {
		if (!s || !n) return;
		let r = yt(e, t, n, a, o);
		r.length !== 0 && (h(e), p(r), d(e.position), l(!0));
	}, [
		s,
		n,
		t,
		a,
		o
	]), k = U(() => {
		let e = w || t;
		_([]), C(b), x(null), y(null), T(null), r(e);
	}, [
		w,
		t,
		b,
		r
	]), A = U((e) => {
		_(e.newPath), r(e.query), C(e.chartConfig);
	}, [r]);
	return {
		handleDataPointClick: O,
		menuOpen: c,
		menuPosition: u,
		menuOptions: f,
		handleOptionSelect: U((e) => {
			if (!(!m || !n)) {
				try {
					if (e.targetGranularity && g.length > 0) {
						let t = kt(g, (t) => t.granularity === e.targetGranularity);
						if (t) {
							A(t), l(!1), h(null);
							return;
						}
						if (At(e, v)) {
							k(), l(!1), h(null);
							return;
						}
					}
					if (e.targetDimension && g.length > 0) {
						let t = kt(g, (t) => t.dimension === e.targetDimension);
						if (t) {
							A(t), l(!1), h(null);
							return;
						}
					}
					let a = wt(e, m, t, n);
					if (g.length === 0) {
						T(t), i && x(i);
						let n = jt(e, t);
						n && y(n);
					}
					_((e) => [...e, a.pathEntry]), r(a.query), a.chartConfig && C(a.chartConfig);
				} catch (e) {
					console.error("Error building drill query:", e);
				}
				l(!1), h(null);
			}
		}, [
			m,
			n,
			t,
			g,
			v,
			r,
			i,
			A,
			k
		]),
		closeMenu: U(() => {
			l(!1), d(null), p([]), h(null);
		}, []),
		drillPath: g,
		navigateBack: U(() => {
			if (g.length !== 0) {
				if (g.length === 1) k();
				else {
					let e = g.slice(0, -1), t = e[e.length - 1];
					_(e), r(t.query), C(t.chartConfig || null);
				}
			}
		}, [
			g,
			r,
			k
		]),
		navigateToLevel: U((e) => {
			if (e <= 0) k();
			else if (e < g.length) {
				let t = g.slice(0, e), n = t[t.length - 1];
				_(t), r(n.query), C(n.chartConfig || null);
			}
		}, [
			g,
			r,
			k
		]),
		drillEnabled: E,
		hasDashboardFilterMatch: D,
		currentChartConfig: S
	};
}
//#endregion
//#region src/client/components/analyticsPortlet/usePortletDrillState.ts
function Nt(e) {
	let { queryObject: t, chartConfig: n, dashboardFilters: r, dashboardFilterMapping: i, isMultiQuery: a, isFunnelMode: o, isFlowMode: s, isRetentionMode: c } = e, [l, u] = q(null), d = t ? JSON.stringify(t) : null, f = K(null);
	W(() => {
		d !== f.current && (f.current = d, l && u(null));
	}, [d, l]);
	let p = l || t, { meta: m } = L(), h = Mt({
		query: p || {
			measures: [],
			dimensions: []
		},
		metadata: m,
		onQueryChange: (e) => {
			u(e);
		},
		chartConfig: n,
		dashboardFilters: r,
		dashboardFilterMapping: i,
		enabled: !a && !o && !s && !c && !!p
	});
	return {
		drill: h,
		activeQuery: p,
		handleNavigateBack: U(() => {
			h.drillPath.length === 1 && u(null), h.navigateBack();
		}, [h]),
		handleNavigateToLevel: U((e) => {
			e === 0 && u(null), h.navigateToLevel(e);
		}, [h])
	};
}
//#endregion
//#region src/client/components/analyticsPortlet/usePortletPagination.ts
var Pt = [
	25,
	50,
	100
], Ft = 25;
function It(e) {
	return e === "recordsTable";
}
function Lt({ chartType: e, activeQuery: t, pageSize: n }) {
	let r = It(e) && t !== null, [i, a] = q(0), [o, s] = q(n ?? Ft), [c, l] = q();
	W(() => {
		s(n ?? Ft);
	}, [n]);
	let u = t ? JSON.stringify(t) : null, d = K(null);
	W(() => {
		u !== d.current && (d.current = u, a(0), l(void 0));
	}, [u]);
	let f = U((e) => {
		a(0), l((t) => t?.column === e ? t.direction === "asc" ? {
			column: e,
			direction: "desc"
		} : void 0 : {
			column: e,
			direction: "asc"
		});
	}, []), p = U((e) => {
		s(e), a(0);
	}, []);
	return {
		paginatedQuery: G(() => !r || !t ? t : {
			...t,
			limit: o,
			offset: i * o,
			total: !0,
			order: c ? { [c.column]: c.direction } : t.order
		}, [
			r,
			t,
			i,
			o,
			c
		]),
		pagination: G(() => {
			if (r) return {
				page: i,
				pageSize: o,
				pageSizeOptions: Pt,
				sort: c,
				setPage: a,
				setPageSize: p,
				toggleSort: f
			};
		}, [
			r,
			i,
			o,
			c,
			p,
			f
		])
	};
}
//#endregion
//#region src/client/components/analyticsPortlet/usePortletDeadMembers.ts
var Rt = /* @__PURE__ */ new Set([
	"measure",
	"dimension",
	"timeDimension"
]);
function zt(e) {
	let t = e?.issues;
	return !Array.isArray(t) || t.length === 0 || t.some((e) => !Rt.has(e.source)) ? null : [...new Set(t.map((e) => e.member))];
}
function Bt(e, t) {
	if (t.length === 0) return e;
	let n = new Set(t), r = {
		...e,
		measures: e.measures?.filter((e) => !n.has(e)),
		dimensions: e.dimensions?.filter((e) => !n.has(e)),
		timeDimensions: e.timeDimensions?.filter((e) => !n.has(e.dimension))
	};
	if (e.order) {
		let t = Object.fromEntries(Object.entries(e.order).filter(([e]) => !n.has(e)));
		r.order = Object.keys(t).length > 0 ? t : void 0;
	}
	return r;
}
function Vt({ queryObject: e, error: t }) {
	let [n, r] = q([]), i = e ? JSON.stringify(e) : null, a = K(null);
	return W(() => {
		i !== a.current && (a.current = i, r((e) => e.length > 0 ? [] : e));
	}, [i]), W(() => {
		let e = zt(t);
		e && r((t) => {
			let n = e.filter((e) => !t.includes(e));
			return n.length > 0 ? [...t, ...n] : t;
		});
	}, [t]), {
		query: G(() => e ? Bt(e, n) : null, [e, n]),
		droppedMembers: n
	};
}
//#endregion
//#region src/client/components/analyticsPortlet/usePortletQueryResults.ts
function Ht(e) {
	let { activeQuery: t, multiQueryConfig: n, serverFunnelQuery: r, serverFlowQuery: i, serverRetentionQuery: a, isMultiQuery: o, isFunnelMode: s, isFlowMode: c, isRetentionMode: l, shouldSkipQuery: u, eagerLoad: d, isVisible: f } = e, p = m(), h = u || !d && !f, g = !t || h || o || s || c || l, _ = !n || h || s || c || l, v = !s || h, y = !c || h, b = !l || h, x = D(t, {
		skip: g,
		resetResultSetOnChange: !0,
		debounceMs: 100
	}), S = A(n, {
		skip: _,
		resetResultSetOnChange: !0,
		debounceMs: 100
	}), C = M(null, {
		skip: v || !r,
		debounceMs: 100,
		prebuiltServerQuery: r
	}), w = ee(i, {
		skip: y,
		debounceMs: 100
	}), T = k(a, {
		skip: b,
		debounceMs: 100
	}), E = o ? null : x.resultSet;
	function O(e) {
		return l ? e.retention : c ? e.flow : s ? e.funnel : o ? e.multi : e.single;
	}
	let j = O({
		retention: T.isLoading || T.isDebouncing,
		flow: w.isLoading || w.isDebouncing,
		funnel: C.isExecuting || C.isDebouncing,
		multi: S.isLoading,
		single: x.isLoading
	}), N = O({
		retention: T.isFetching,
		flow: w.isFetching,
		funnel: C.isExecuting,
		multi: S.isFetching,
		single: x.isFetching
	}), P = O({
		retention: T.error,
		flow: w.error,
		funnel: C.error,
		multi: S.error,
		single: x.error
	}), te = O({
		retention: null,
		flow: null,
		funnel: C.chartData,
		multi: S.data,
		single: null
	}), L = c ? w.data : null, R = l ? T.chartData : null, z = U((e, t) => {
		t ? p.removeQueries({ queryKey: e }) : p.invalidateQueries({ queryKey: e });
	}, [p]), B = U((e) => {
		let u = e?.bustCache ?? !1;
		if (l && a) z([
			"cube",
			"retention",
			JSON.stringify(a)
		], u), T.refetch();
		else if (c && i) z([
			"cube",
			"flow",
			JSON.stringify(i)
		], u), w.refetch({ bustCache: u });
		else if (s && r) z([
			"cube",
			"funnel",
			r.funnel?.steps?.length || 0,
			JSON.stringify(r)
		], u), C.execute({ bustCache: u });
		else if (o && n) {
			let e = {
				...n,
				queries: n.queries.map((e) => I(e))
			};
			z(F(e), u), S.refetch({ bustCache: u });
		} else t && (z(ne(I(t)), u), x.refetch({ bustCache: u }));
	}, [
		l,
		c,
		s,
		o,
		n,
		t,
		z,
		a,
		i,
		r,
		T,
		w,
		C,
		S,
		x
	]), re = U(() => {
		l ? T.refetch() : c ? w.refetch() : s ? C.execute() : o ? S.refetch() : x.refetch();
	}, [
		l,
		c,
		s,
		o,
		T,
		w,
		C,
		S,
		x
	]);
	return {
		resultSet: E,
		isLoading: j,
		isFetching: N,
		error: P,
		multiQueryData: te,
		flowChartData: L,
		retentionChartData: R,
		funnelCacheInfo: C.cacheInfo,
		flowCacheInfo: w.cacheInfo,
		retentionCacheInfo: T.cacheInfo,
		refresh: B,
		retry: re
	};
}
//#endregion
//#region src/client/components/analyticsPortlet/usePortletDebugData.ts
function Ut(e, t) {
	switch (e) {
		case "pie":
		case "table": return t.tablePivot();
		default: return t.rawData();
	}
}
function Wt(e) {
	let { chartConfig: t, displayConfig: n, chartType: r, queryObject: i, activeQuery: a, resultSet: o, drillPath: s, currentChartConfig: c } = e;
	if (!t || !i || !o) return null;
	let l = Ut(r, o);
	if (!l) return null;
	let u = s.length > 0 ? {
		isDrilling: !0,
		drillPath: s.map((e) => ({
			id: e.id,
			label: e.label,
			clickedValue: e.clickedValue,
			dimension: e.dimension,
			granularity: e.granularity,
			hierarchy: e.hierarchy
		})),
		currentDrillDepth: s.length,
		originalQuery: i,
		activeQuery: a
	} : void 0;
	return {
		chartConfig: c || t || {},
		displayConfig: n || {},
		queryObject: a || i,
		data: l,
		chartType: r,
		cacheInfo: o.cacheInfo?.(),
		drillState: u
	};
}
function Gt(e) {
	let { chartConfig: t, displayConfig: n, chartType: r, isFunnelMode: i, isFlowMode: a, isRetentionMode: o, serverFunnelQuery: s, serverFlowQuery: c, serverRetentionQuery: l, multiQueryData: u, flowChartData: d, retentionChartData: f, funnelCacheInfo: p, flowCacheInfo: m, retentionCacheInfo: h } = e, g = {
		chartConfig: t || {},
		displayConfig: n || {},
		chartType: r
	};
	return i && u && u.length > 0 ? {
		...g,
		queryObject: s,
		data: u,
		cacheInfo: p ?? void 0
	} : a && c && d ? {
		...g,
		queryObject: c,
		data: d,
		cacheInfo: m
	} : o && l && f ? {
		...g,
		queryObject: l,
		data: f,
		cacheInfo: h ?? void 0
	} : Wt(e);
}
function Kt(e) {
	let { onDebugDataReady: t, error: n, chartType: r, chartConfig: i, displayConfig: a, isFunnelMode: o, isFlowMode: s, isRetentionMode: c, queryObject: l, activeQuery: u, serverFunnelQuery: d, serverFlowQuery: f, serverRetentionQuery: p, resultSet: m, multiQueryData: h, flowChartData: g, retentionChartData: _, funnelCacheInfo: v, flowCacheInfo: y, retentionCacheInfo: b, drillPath: x, currentChartConfig: S } = e, C = K(t);
	W(() => {
		C.current = t;
	}, [t]), W(() => {
		let t = C.current;
		if (!t || n) return;
		let r = Gt(e);
		r && t(r);
	}, [
		i,
		a,
		l,
		u,
		m,
		r,
		n,
		o,
		s,
		c,
		h,
		d,
		f,
		p,
		g,
		_,
		y,
		v,
		b,
		x,
		S
	]);
}
//#endregion
//#region src/client/components/analyticsPortlet/portletRenderState.ts
function qt(e) {
	return e.isRetentionMode ? e.retentionChartData !== null && e.serverRetentionQuery !== null : e.isFlowMode ? e.flowChartData !== null && e.serverFlowQuery !== null : e.isFunnelMode ? e.multiQueryData !== null && e.serverFunnelQuery !== null : e.isMultiQuery ? e.multiQueryData !== null && e.multiQueryConfig !== null : e.resultSet !== null && e.queryObject !== null;
}
function Jt(e) {
	return !e.hasChartConfig && e.hasMandatoryFields ? "config-required" : !e.shouldSkipQuery && !e.eagerLoad && !e.isVisible ? "lazy-placeholder" : e.shouldSkipQuery ? "chart" : e.isLoading || e.isFetching || e.queryObject && !e.resultSet && !e.error ? "loading" : e.error ? "error" : qt(e) ? "chart" : "no-data";
}
//#endregion
//#region src/client/components/ChartErrorBoundary.tsx
var Yt = v("refresh"), Xt = class extends fe {
	constructor(e) {
		super(e), this.state = {
			hasError: !1,
			error: null,
			errorInfo: null
		};
	}
	static getDerivedStateFromError(e) {
		return {
			hasError: !0,
			error: e,
			errorInfo: null
		};
	}
	componentDidCatch(e, t) {
		this.setState({
			error: e,
			errorInfo: t.componentStack || null
		}), console.error("Chart Error Boundary caught a rendering error:", e, t);
	}
	handleReset = () => {
		this.setState({
			hasError: !1,
			error: null,
			errorInfo: null
		});
	};
	render() {
		return this.state.hasError ? this.props.fallback ? this.props.fallback : /* @__PURE__ */ X("div", {
			className: "dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full dc:h-full dc:p-6 dc:text-center dc:border dc:border-dashed dc:rounded-lg",
			style: {
				borderColor: "var(--dc-border)",
				backgroundColor: "var(--dc-surface)"
			},
			children: [
				/* @__PURE__ */ Y("div", {
					className: "dc:h-12 dc:w-12 dc:mb-4 text-dc-text-muted",
					children: "⚠️"
				}),
				/* @__PURE__ */ Y("h3", {
					className: "dc:text-lg dc:font-semibold dc:mb-2 text-dc-text",
					children: this.props.portletTitle ? `Unable to render ${this.props.portletTitle}` : "Unable to render chart"
				}),
				/* @__PURE__ */ Y("p", {
					className: "dc:text-sm text-dc-text-secondary dc:mb-4 dc:max-w-md",
					children: z("error.renderDescription")
				}),
				/* @__PURE__ */ Y("div", {
					className: "dc:w-full dc:max-w-2xl dc:mb-4",
					children: /* @__PURE__ */ X("div", {
						className: "bg-dc-surface-secondary dc:rounded-lg dc:p-3 dc:text-left",
						children: [
							/* @__PURE__ */ X("div", {
								className: "dc:text-xs dc:font-mono dc:mb-2 text-dc-text",
								children: [
									/* @__PURE__ */ Y("strong", { children: z("error.errorLabel") }),
									" ",
									this.state.error?.message
								]
							}),
							this.state.error?.name && /* @__PURE__ */ X("div", {
								className: "dc:text-xs dc:font-mono text-dc-text-secondary dc:mb-2",
								children: [
									/* @__PURE__ */ Y("strong", { children: z("error.typeLabel") }),
									" ",
									this.state.error.name
								]
							}),
							this.props.portletConfig && /* @__PURE__ */ X("details", {
								className: "dc:text-xs dc:font-mono text-dc-text-secondary dc:mb-2",
								children: [/* @__PURE__ */ Y("summary", {
									className: "dc:cursor-pointer",
									children: z("error.portletConfig")
								}), /* @__PURE__ */ Y("pre", {
									className: "dc:mt-2 dc:whitespace-pre-wrap dc:p-2 dc:rounded-sm dc:overflow-auto dc:max-h-32",
									style: { backgroundColor: "rgba(var(--dc-primary-rgb), 0.1)" },
									children: JSON.stringify(this.props.portletConfig, null, 2)
								})]
							}),
							this.props.cubeQuery && /* @__PURE__ */ X("details", {
								className: "dc:text-xs dc:font-mono text-dc-text-secondary dc:mb-2",
								children: [/* @__PURE__ */ Y("summary", {
									className: "dc:cursor-pointer",
									children: z("error.cubeQuery")
								}), /* @__PURE__ */ Y("pre", {
									className: "dc:mt-2 dc:whitespace-pre-wrap dc:p-2 dc:rounded-sm dc:overflow-auto dc:max-h-32",
									style: { backgroundColor: "#d1fae5" },
									children: typeof this.props.cubeQuery == "string" ? JSON.stringify(JSON.parse(this.props.cubeQuery), null, 2) : JSON.stringify(this.props.cubeQuery, null, 2)
								})]
							}),
							this.state.errorInfo && /* @__PURE__ */ X("details", {
								className: "dc:text-xs dc:font-mono text-dc-text-secondary",
								children: [/* @__PURE__ */ Y("summary", {
									className: "dc:cursor-pointer",
									children: z("error.componentStack")
								}), /* @__PURE__ */ Y("pre", {
									className: "dc:mt-2 dc:whitespace-pre-wrap",
									children: this.state.errorInfo
								})]
							})
						]
					})
				}),
				/* @__PURE__ */ X("button", {
					onClick: this.handleReset,
					className: "dc:px-3 dc:py-1 text-white dc:rounded-sm dc:text-sm dc:hover:opacity-90 dc:transition-opacity",
					style: { backgroundColor: "var(--dc-primary)" },
					children: [/* @__PURE__ */ Y(Yt, { style: {
						width: "16px",
						height: "16px",
						display: "inline",
						marginRight: "4px"
					} }), z("error.tryAgain")]
				})
			]
		}) : this.props.children;
	}
};
//#endregion
//#region src/client/components/DrillMenu.tsx
function Zt({ className: e }) {
	return /* @__PURE__ */ X("svg", {
		className: e,
		width: "16",
		height: "16",
		viewBox: "0 0 16 16",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		children: [/* @__PURE__ */ Y("circle", {
			cx: "8",
			cy: "8",
			r: "6",
			stroke: "currentColor",
			strokeWidth: "1.5"
		}), /* @__PURE__ */ Y("path", {
			d: "M8 5V8L10 10",
			stroke: "currentColor",
			strokeWidth: "1.5",
			strokeLinecap: "round"
		})]
	});
}
function Qt({ className: e }) {
	return /* @__PURE__ */ X("svg", {
		className: e,
		width: "16",
		height: "16",
		viewBox: "0 0 16 16",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		children: [
			/* @__PURE__ */ Y("rect", {
				x: "6",
				y: "2",
				width: "4",
				height: "3",
				rx: "0.5",
				stroke: "currentColor",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ Y("rect", {
				x: "2",
				y: "11",
				width: "4",
				height: "3",
				rx: "0.5",
				stroke: "currentColor",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ Y("rect", {
				x: "10",
				y: "11",
				width: "4",
				height: "3",
				rx: "0.5",
				stroke: "currentColor",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ Y("path", {
				d: "M8 5V8M8 8L4 11M8 8L12 11",
				stroke: "currentColor",
				strokeWidth: "1.5"
			})
		]
	});
}
function $t({ className: e }) {
	return /* @__PURE__ */ X("svg", {
		className: e,
		width: "16",
		height: "16",
		viewBox: "0 0 16 16",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		children: [/* @__PURE__ */ Y("rect", {
			x: "2",
			y: "2",
			width: "12",
			height: "12",
			rx: "1",
			stroke: "currentColor",
			strokeWidth: "1.5"
		}), /* @__PURE__ */ Y("path", {
			d: "M2 6H14M6 6V14",
			stroke: "currentColor",
			strokeWidth: "1.5"
		})]
	});
}
function en({ className: e }) {
	return /* @__PURE__ */ Y("svg", {
		className: e,
		width: "12",
		height: "12",
		viewBox: "0 0 12 12",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		children: /* @__PURE__ */ Y("path", {
			d: "M6 2V10M6 10L3 7M6 10L9 7",
			stroke: "currentColor",
			strokeWidth: "1.5",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		})
	});
}
function tn({ className: e }) {
	return /* @__PURE__ */ Y("svg", {
		className: e,
		width: "12",
		height: "12",
		viewBox: "0 0 12 12",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		children: /* @__PURE__ */ Y("path", {
			d: "M6 10V2M6 2L3 5M6 2L9 5",
			stroke: "currentColor",
			strokeWidth: "1.5",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		})
	});
}
function nn(e) {
	return e.type === "drillDown" ? /* @__PURE__ */ Y(en, { className: "dc:w-3 dc:h-3 text-dc-success" }) : e.type === "drillUp" ? /* @__PURE__ */ Y(tn, { className: "dc:w-3 dc:h-3 text-dc-warning" }) : null;
}
function rn(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = n.icon || "other", r = t.get(e) || [];
		r.push(n), t.set(e, r);
	}
	return t;
}
function an(e) {
	switch (e) {
		case "time": return "Time";
		case "hierarchy": return "Hierarchy";
		case "table": return "Details";
		default: return "Options";
	}
}
function on({ options: e, position: t, onSelect: n, onClose: r }) {
	let i = K(null), [a, o] = q(!1);
	if (W(() => (o(!0), () => o(!1)), []), W(() => {
		function e(e) {
			i.current && !i.current.contains(e.target) && r();
		}
		function t(e) {
			e.key === "Escape" && r();
		}
		function n() {
			r();
		}
		return document.addEventListener("mousedown", e), document.addEventListener("keydown", t), window.addEventListener("scroll", n, !0), () => {
			document.removeEventListener("mousedown", e), document.removeEventListener("keydown", t), window.removeEventListener("scroll", n, !0);
		};
	}, [r]), e.length === 0 || !a) return null;
	let s = {
		position: "fixed",
		left: Math.min(t.x, window.innerWidth - 250),
		top: Math.min(t.y, window.innerHeight - 300),
		zIndex: 99999
	}, c = rn(e), l = /* @__PURE__ */ Y("div", {
		ref: i,
		className: "dc:min-w-[200px] dc:max-w-[280px] bg-dc-surface dc:rounded-lg dc:shadow-lg border border-dc-border dc:overflow-hidden",
		style: s,
		children: Array.from(c.entries()).map(([e, t], i) => /* @__PURE__ */ X("div", { children: [
			/* @__PURE__ */ X("div", {
				className: "dc:px-3 dc:py-2 dc:flex dc:items-center dc:gap-2 bg-dc-surface-secondary text-dc-text-secondary dc:text-xs dc:font-medium dc:uppercase dc:tracking-wide",
				children: [
					e === "time" && /* @__PURE__ */ Y(Zt, { className: "dc:w-3 dc:h-3" }),
					e === "hierarchy" && /* @__PURE__ */ Y(Qt, { className: "dc:w-3 dc:h-3" }),
					e === "table" && /* @__PURE__ */ Y($t, { className: "dc:w-3 dc:h-3" }),
					an(e)
				]
			}),
			/* @__PURE__ */ Y("div", {
				className: "dc:py-1",
				children: t.map((e) => /* @__PURE__ */ X("button", {
					className: "dc:w-full dc:px-3 dc:py-2 dc:flex dc:items-center dc:gap-2 dc:cursor-pointer text-dc-text dc:text-sm dc:text-left hover:bg-dc-surface-hover hover:text-dc-accent dc:transition-colors dc:rounded-sm",
					onClick: () => {
						n(e), r();
					},
					children: [/* @__PURE__ */ Y("span", {
						className: "dc:w-4 dc:flex dc:justify-center",
						children: nn(e)
					}), /* @__PURE__ */ Y("span", {
						className: "dc:flex-1",
						children: e.label
					})]
				}, e.id))
			}),
			i < c.size - 1 && /* @__PURE__ */ Y("div", { className: "border-t border-dc-border" })
		] }, e))
	});
	return be(l, document.body);
}
//#endregion
//#region src/client/components/DrillBreadcrumb.tsx
function sn({ className: e }) {
	return /* @__PURE__ */ X("svg", {
		className: e,
		width: "14",
		height: "14",
		viewBox: "0 0 14 14",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		children: [/* @__PURE__ */ Y("path", {
			d: "M2 7L7 2L12 7",
			stroke: "currentColor",
			strokeWidth: "1.5",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		}), /* @__PURE__ */ Y("path", {
			d: "M3 6V11.5C3 11.7761 3.22386 12 3.5 12H5.5V9H8.5V12H10.5C10.7761 12 11 11.7761 11 11.5V6",
			stroke: "currentColor",
			strokeWidth: "1.5",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		})]
	});
}
function cn({ className: e }) {
	return /* @__PURE__ */ Y("svg", {
		className: e,
		width: "12",
		height: "12",
		viewBox: "0 0 12 12",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		children: /* @__PURE__ */ Y("path", {
			d: "M4 2L8 6L4 10",
			stroke: "currentColor",
			strokeWidth: "1.5",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		})
	});
}
function ln({ className: e }) {
	return /* @__PURE__ */ Y("svg", {
		className: e,
		width: "14",
		height: "14",
		viewBox: "0 0 14 14",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		children: /* @__PURE__ */ Y("path", {
			d: "M12 7H2M2 7L6 3M2 7L6 11",
			stroke: "currentColor",
			strokeWidth: "1.5",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		})
	});
}
function un(e) {
	return !e || e === "undefined" || e === "null" || e === "" || e.trim() === "" ? "(empty)" : e;
}
function dn({ path: e, onNavigate: t, onLevelClick: n }) {
	let { t: r } = R();
	return e.length === 0 ? null : /* @__PURE__ */ X("div", {
		className: "dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1.5 bg-dc-surface-secondary dc:rounded-md dc:text-xs",
		children: [
			/* @__PURE__ */ X("button", {
				className: "dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1 dc:rounded-sm dc:cursor-pointer dc:hover:bg-dc-surface-hover text-dc-text-secondary dc:hover:text-dc-text dc:transition-colors",
				onClick: t,
				title: "Go back one level",
				children: [/* @__PURE__ */ Y(ln, { className: "dc:w-3.5 dc:h-3.5" }), /* @__PURE__ */ Y("span", {
					className: "dc:sr-only",
					children: r("drill.back")
				})]
			}),
			/* @__PURE__ */ Y("span", {
				className: "text-dc-text-muted",
				children: "|"
			}),
			/* @__PURE__ */ Y("button", {
				className: "dc:flex dc:items-center dc:gap-1 dc:px-1.5 dc:py-1 dc:rounded-sm dc:cursor-pointer dc:hover:bg-dc-surface-hover text-dc-text-secondary dc:hover:text-dc-text dc:transition-colors",
				onClick: () => n?.(0),
				title: "Return to top level",
				children: /* @__PURE__ */ Y(sn, { className: "dc:w-3.5 dc:h-3.5" })
			}),
			e.map((t, r) => {
				let i = un(t.label);
				return /* @__PURE__ */ X(de.Fragment, { children: [/* @__PURE__ */ Y(cn, { className: "dc:w-3 dc:h-3 text-dc-text-muted" }), r === e.length - 1 ? /* @__PURE__ */ Y("span", {
					className: "dc:px-1.5 dc:py-1 text-dc-text dc:font-medium",
					title: i,
					children: i
				}) : /* @__PURE__ */ Y("button", {
					className: "dc:px-1.5 dc:py-1 dc:rounded-sm dc:cursor-pointer dc:hover:bg-dc-surface-hover text-dc-text-secondary dc:hover:text-dc-text dc:transition-colors",
					onClick: () => n?.(r + 1),
					title: `Navigate to ${i}`,
					children: i
				})] }, t.id);
			})
		]
	});
}
//#endregion
//#region src/client/components/analyticsPortlet/PortletChart.tsx
function fn(e) {
	let { shouldSkipQuery: t, isRetentionMode: n, isFlowMode: r, isFunnelMode: i, isMultiQuery: a, resultSet: o, multiQueryData: s, flowChartData: c, retentionChartData: l, chartType: u } = e;
	if (t) return [];
	if (n) return l || {
		rows: [],
		periods: []
	};
	if (r) return c || {
		nodes: [],
		links: []
	};
	if (i || a) return s || [];
	if (!o) return [];
	switch (u) {
		case "pie":
		case "table":
		case "recordsTable": return o.tablePivot();
		default: return o.rawData();
	}
}
function pn(e) {
	let { t } = R(), { chartType: n, height: r, chartConfig: i, displayConfig: a, activeQuery: o, pagination: s, colorPalette: c, drillEnabled: l, currentChartConfig: u, onDataPointClick: d } = e;
	try {
		let f = n === "sankey" && a?.flowVisualization === "sunburst" ? "sunburst" : n;
		if (!B(f)) return /* @__PURE__ */ Y("div", {
			className: "dc:flex dc:items-center dc:justify-center dc:w-full",
			style: { height: r },
			children: /* @__PURE__ */ X("div", {
				className: "dc:text-center text-dc-text-muted",
				children: [/* @__PURE__ */ Y("div", {
					className: "dc:text-sm dc:font-semibold dc:mb-1",
					children: t("portlet.unsupportedChartType")
				}), /* @__PURE__ */ Y("div", {
					className: "dc:text-xs",
					children: f
				})]
			})
		});
		let p = fn(e);
		return /* @__PURE__ */ Y(re, {
			chartType: f,
			data: f === "markdown" ? [] : p,
			chartConfig: l && u ? u : i,
			displayConfig: a,
			queryObject: o ?? void 0,
			pagination: s,
			height: r,
			colorPalette: c,
			onDataPointClick: l ? d : void 0,
			drillEnabled: l,
			fallback: /* @__PURE__ */ Y("div", {
				className: "dc:flex dc:items-center dc:justify-center dc:w-full",
				style: { height: typeof r == "number" ? `${r}px` : r },
				children: /* @__PURE__ */ Y("div", { className: "dc:animate-pulse bg-dc-surface-secondary dc:rounded-sm dc:w-full dc:h-full dc:min-h-[100px]" })
			})
		});
	} catch (e) {
		return console.error("Chart rendering error:", e), /* @__PURE__ */ Y("div", {
			className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted dc:p-4",
			style: { height: r },
			children: /* @__PURE__ */ X("div", {
				className: "dc:text-center",
				children: [/* @__PURE__ */ Y("div", {
					className: "dc:text-sm dc:font-semibold dc:mb-1",
					children: t("portlet.unableToRender")
				}), /* @__PURE__ */ Y("div", {
					className: "dc:text-xs text-dc-text-secondary",
					children: e instanceof Error ? e.message : t("errorBoundary.unknownError")
				})]
			})
		});
	}
}
//#endregion
//#region src/client/components/analyticsPortlet/intrinsicChartHeight.ts
var mn = ["markdown", "proportionBar"], hn = ["kpiNumber", "kpiDelta"];
function gn(e, t) {
	return mn.includes(e) ? !0 : hn.includes(e) && t?.layout === "compact";
}
//#endregion
//#region src/client/components/analyticsPortlet/PortletChartView.tsx
function _n(e) {
	let { t } = R(), { title: n, query: r, chartType: i, height: a, chartConfig: o, displayConfig: s, colorPalette: c, shouldSkipQuery: l, isMultiQuery: u, isFunnelMode: d, isFlowMode: f, isRetentionMode: p, resultSet: m, multiQueryData: h, flowChartData: g, retentionChartData: _, activeQuery: v, pagination: y, droppedMembers: b, drill: x, isDrillEnabled: S, onNavigateBack: C, onNavigateToLevel: w } = e, T = gn(i, s);
	return /* @__PURE__ */ X(J, { children: [/* @__PURE__ */ Y(Xt, {
		portletTitle: n,
		portletConfig: {
			chartType: i,
			chartConfig: o,
			displayConfig: s,
			height: a
		},
		cubeQuery: r,
		children: /* @__PURE__ */ X("div", {
			className: "dc:w-full dc:h-full dc:flex dc:flex-col dc:flex-1",
			style: { minHeight: T ? void 0 : "200px" },
			children: [
				S && x.drillPath.length > 0 && /* @__PURE__ */ Y("div", {
					className: "dc:mb-2 dc:flex-shrink-0",
					children: /* @__PURE__ */ Y(dn, {
						path: x.drillPath,
						onNavigate: C,
						onLevelClick: w
					})
				}),
				b && b.length > 0 && /* @__PURE__ */ Y("div", {
					className: "dc:mb-1 dc:flex-shrink-0 dc:text-xs text-dc-text-muted dc:truncate",
					title: b.join(", "),
					children: t("portlet.droppedMembers", { members: b.join(", ") })
				}),
				/* @__PURE__ */ Y("div", {
					className: "dc:flex-1 dc:min-h-0",
					children: /* @__PURE__ */ Y(pn, {
						chartType: i,
						height: a,
						shouldSkipQuery: l,
						isMultiQuery: u,
						isFunnelMode: d,
						isFlowMode: f,
						isRetentionMode: p,
						resultSet: m,
						multiQueryData: h,
						flowChartData: g,
						retentionChartData: _,
						chartConfig: o,
						displayConfig: s,
						activeQuery: v,
						pagination: y,
						colorPalette: c,
						drillEnabled: S,
						currentChartConfig: x.currentChartConfig,
						onDataPointClick: x.handleDataPointClick
					})
				})
			]
		})
	}), S && x.menuOpen && x.menuPosition && /* @__PURE__ */ Y(on, {
		options: x.menuOptions,
		position: x.menuPosition,
		onSelect: x.handleOptionSelect,
		onClose: x.closeMenu
	})] });
}
//#endregion
//#region src/client/components/analyticsPortlet/PortletStates.tsx
function vn({ inViewRef: e, height: t }) {
	let { t: n } = R();
	return /* @__PURE__ */ Y("div", {
		ref: e,
		className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted",
		style: { height: t },
		children: /* @__PURE__ */ X("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ Y("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: n("portlet.configRequired")
			}), /* @__PURE__ */ Y("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: n("portlet.configRequiredHint")
			})]
		})
	});
}
function yn({ inViewRef: e, height: t }) {
	return /* @__PURE__ */ Y("div", {
		ref: e,
		className: "dc:w-full dc:h-full",
		style: { height: t },
		children: /* @__PURE__ */ Y("div", {
			className: "dc:w-full dc:h-full dc:animate-pulse bg-dc-surface-secondary dc:rounded-sm",
			style: { minHeight: "100px" }
		})
	});
}
function bn({ inViewRef: e, height: t, loadingComponent: n }) {
	return /* @__PURE__ */ Y("div", {
		ref: e,
		className: "dc:flex dc:items-center dc:justify-center dc:w-full",
		style: { height: t },
		children: n || /* @__PURE__ */ Y(ie, { size: "md" })
	});
}
function xn({ inViewRef: e, height: t, error: n, onRetry: r, activeQuery: i, query: a, chartType: o, chartConfig: s, displayConfig: c }) {
	let { t: l } = R();
	return /* @__PURE__ */ X("div", {
		ref: e,
		className: "dc:p-4 dc:border dc:rounded-sm",
		style: {
			height: t,
			borderColor: "var(--dc-border)",
			backgroundColor: "var(--dc-surface)"
		},
		children: [
			/* @__PURE__ */ Y("div", {
				className: "dc:mb-2",
				children: /* @__PURE__ */ X("div", {
					className: "dc:flex dc:items-center dc:justify-between",
					children: [/* @__PURE__ */ Y("span", {
						className: "dc:font-medium dc:text-sm",
						style: { color: "var(--dc-text)" },
						children: `⚠️ ${l("portlet.queryError")}`
					}), /* @__PURE__ */ Y("button", {
						onClick: r,
						className: "dc:px-2 dc:py-1 text-white dc:rounded-sm dc:text-xs",
						style: { backgroundColor: "var(--dc-primary)" },
						children: l("common.actions.retry")
					})]
				})
			}),
			/* @__PURE__ */ Y("div", {
				className: "dc:mb-3",
				children: /* @__PURE__ */ Y("div", {
					className: "dc:text-xs dc:p-2 dc:rounded-sm dc:border",
					style: {
						color: "var(--dc-text-secondary)",
						backgroundColor: "var(--dc-surface)",
						borderColor: "var(--dc-border)"
					},
					children: n.message || n.toString()
				})
			}),
			/* @__PURE__ */ X("div", {
				className: "dc:space-y-2 dc:text-xs",
				children: [/* @__PURE__ */ X("details", { children: [/* @__PURE__ */ Y("summary", {
					className: "dc:cursor-pointer dc:font-medium",
					style: { color: "var(--dc-text-secondary)" },
					children: l("portlet.queryWithFilters")
				}), /* @__PURE__ */ Y("pre", {
					className: "dc:mt-1 dc:p-2 dc:rounded-sm dc:text-xs dc:overflow-auto dc:max-h-20",
					style: { backgroundColor: "rgba(var(--dc-primary-rgb), 0.1)" },
					children: i ? JSON.stringify(i, null, 2) : a
				})] }), /* @__PURE__ */ X("details", { children: [/* @__PURE__ */ Y("summary", {
					className: "dc:cursor-pointer dc:font-medium",
					style: { color: "var(--dc-text-secondary)" },
					children: l("portlet.chartConfig")
				}), /* @__PURE__ */ Y("pre", {
					className: "dc:mt-1 dc:p-2 dc:rounded-sm dc:text-xs dc:overflow-auto dc:max-h-20",
					style: { backgroundColor: "rgba(var(--dc-primary-rgb), 0.05)" },
					children: JSON.stringify({
						chartType: o,
						chartConfig: s,
						displayConfig: c
					}, null, 2)
				})] })]
			})
		]
	});
}
function Sn({ inViewRef: e, height: t, drillPath: n, onNavigateBack: r, onNavigateToLevel: i }) {
	let a = n.length > 0;
	return /* @__PURE__ */ X("div", {
		ref: e,
		className: "dc:flex dc:flex-col dc:w-full",
		style: { height: t },
		children: [a && /* @__PURE__ */ Y("div", {
			className: "dc:mb-2 dc:flex-shrink-0",
			children: /* @__PURE__ */ Y(dn, {
				path: n,
				onNavigate: r,
				onLevelClick: i
			})
		}), /* @__PURE__ */ Y("div", {
			className: "dc:flex dc:items-center dc:justify-center dc:flex-1 text-dc-text-muted",
			children: /* @__PURE__ */ X("div", {
				className: "dc:text-center",
				children: [/* @__PURE__ */ Y("div", {
					className: "dc:text-sm dc:font-semibold dc:mb-1",
					children: "No data available"
				}), /* @__PURE__ */ Y("div", {
					className: "dc:text-xs text-dc-text-secondary",
					children: a ? "No data points to display for the current filter" : "Invalid query or no results"
				})]
			})
		})]
	});
}
function Cn(e) {
	let { kind: t, inViewRef: n, height: r } = e;
	return t === "config-required" ? /* @__PURE__ */ Y(vn, {
		inViewRef: n,
		height: r
	}) : t === "lazy-placeholder" ? /* @__PURE__ */ Y(yn, {
		inViewRef: n,
		height: r
	}) : t === "loading" ? /* @__PURE__ */ Y(bn, {
		inViewRef: n,
		height: r,
		loadingComponent: e.loadingComponent
	}) : t === "error" ? /* @__PURE__ */ Y(xn, {
		inViewRef: n,
		height: r,
		error: e.error ?? { toString: () => "" },
		onRetry: e.onRetry,
		activeQuery: e.activeQuery,
		query: e.query,
		chartType: e.chartType,
		chartConfig: e.chartConfig,
		displayConfig: e.displayConfig
	}) : /* @__PURE__ */ Y(Sn, {
		inViewRef: n,
		height: r,
		drillPath: e.drillPath,
		onNavigateBack: e.onNavigateBack,
		onNavigateToLevel: e.onNavigateToLevel
	});
}
//#endregion
//#region src/client/components/AnalyticsPortlet.tsx
var wn = de.memo(he(({ query: e, chartType: t, chartConfig: n, displayConfig: r, dashboardFilters: i, dashboardFilterMapping: s, eagerLoad: c = !1, isVisible: l, height: u = 300, title: d, colorPalette: f, loadingComponent: p, onDebugDataReady: m }, g) => {
	let _ = o(), { ref: v, inView: y } = a({
		root: _,
		rootMargin: "500px",
		triggerOnce: !0,
		initialInView: !1,
		skip: c
	}), b = c || y, { config: x } = h(t), S = x.skipQuery === !0, C = G(() => i?.filter((e) => !e.isUniversalTime), [i]), { queryObject: w, multiQueryConfig: T, serverFunnelQuery: E, serverFlowQuery: D, serverRetentionQuery: O } = G(() => pt({
		query: e,
		shouldSkipQuery: S,
		regularFilters: C,
		dashboardFilters: i,
		dashboardFilterMapping: s
	}), [
		e,
		S,
		C,
		i,
		s
	]), k = T !== null, A = E !== null, j = D !== null, M = O !== null, [N, P] = q(null), { query: ee, droppedMembers: te } = Vt({
		queryObject: w,
		error: N
	}), { drill: F, activeQuery: I, handleNavigateBack: ne, handleNavigateToLevel: L } = Nt({
		queryObject: ee,
		chartConfig: n,
		dashboardFilters: i,
		dashboardFilterMapping: s,
		isMultiQuery: k,
		isFunnelMode: A,
		isFlowMode: j,
		isRetentionMode: M
	}), { paginatedQuery: R, pagination: z } = Lt({
		chartType: t,
		activeQuery: I,
		pageSize: r?.pageSize
	}), { resultSet: B, isLoading: re, isFetching: ie, error: ae, multiQueryData: oe, flowChartData: se, retentionChartData: ce, funnelCacheInfo: le, flowCacheInfo: ue, retentionCacheInfo: de, refresh: fe, retry: pe } = Ht({
		activeQuery: R,
		multiQueryConfig: T,
		serverFunnelQuery: E,
		serverFlowQuery: D,
		serverRetentionQuery: O,
		isMultiQuery: k,
		isFunnelMode: A,
		isFlowMode: j,
		isRetentionMode: M,
		shouldSkipQuery: S,
		eagerLoad: c,
		isVisible: b
	});
	W(() => {
		P(ae ?? null);
	}, [ae]), ye(g, () => ({ refresh: fe }), [fe]);
	let me = G(() => z ? {
		...z,
		total: B?.totalCount?.()
	} : void 0, [z, B]);
	Kt({
		onDebugDataReady: m,
		error: ae,
		chartType: t,
		chartConfig: n,
		displayConfig: r,
		isFunnelMode: A,
		isFlowMode: j,
		isRetentionMode: M,
		queryObject: w,
		activeQuery: R,
		serverFunnelQuery: E,
		serverFlowQuery: D,
		serverRetentionQuery: O,
		resultSet: B,
		multiQueryData: oe,
		flowChartData: se,
		retentionChartData: ce,
		funnelCacheInfo: le,
		flowCacheInfo: ue,
		retentionCacheInfo: de,
		drillPath: F.drillPath,
		currentChartConfig: F.currentChartConfig
	});
	let V = !S && x.dropZones.some((e) => e.mandatory === !0), he = Jt({
		hasChartConfig: !!n,
		hasMandatoryFields: V,
		shouldSkipQuery: S,
		eagerLoad: c,
		isVisible: b,
		isLoading: re,
		isFetching: ie,
		error: ae,
		isMultiQuery: k,
		isFunnelMode: A,
		isFlowMode: j,
		isRetentionMode: M,
		queryObject: w,
		multiQueryConfig: T,
		serverFunnelQuery: E,
		serverFlowQuery: D,
		serverRetentionQuery: O,
		resultSet: B,
		multiQueryData: oe,
		flowChartData: se,
		retentionChartData: ce
	});
	return he === "chart" ? /* @__PURE__ */ Y("div", {
		ref: v,
		className: "dc:w-full dc:h-full dc:relative",
		children: /* @__PURE__ */ Y(_n, {
			title: d,
			query: e,
			chartType: t,
			height: u,
			chartConfig: n,
			displayConfig: r,
			colorPalette: f,
			shouldSkipQuery: S,
			isMultiQuery: k,
			isFunnelMode: A,
			isFlowMode: j,
			isRetentionMode: M,
			resultSet: B,
			multiQueryData: oe,
			flowChartData: se,
			retentionChartData: ce,
			activeQuery: R,
			pagination: me,
			droppedMembers: te,
			drill: F,
			isDrillEnabled: !k && !A && !j && !M && F.drillEnabled,
			onNavigateBack: ne,
			onNavigateToLevel: L
		})
	}) : /* @__PURE__ */ Y(Cn, {
		kind: he,
		inViewRef: v,
		height: u,
		loadingComponent: p,
		error: ae ?? null,
		onRetry: pe,
		activeQuery: I,
		query: e,
		chartType: t,
		chartConfig: F.currentChartConfig || n,
		displayConfig: r,
		drillPath: F.drillPath,
		onNavigateBack: ne,
		onNavigateToLevel: L
	});
}));
wn.displayName = "AnalyticsPortlet";
//#endregion
//#region src/client/stores/dashboardStore.tsx
var Tn = () => ({
	isEditMode: !1,
	selectedFilterId: null,
	isPortletModalOpen: !1,
	editingPortlet: null,
	isFilterConfigModalOpen: !1,
	filterConfigPortlet: null,
	deleteConfirmPortletId: null,
	deleteConfirmGroupId: null,
	isTextModalOpen: !1,
	editingTextPortlet: null,
	draftRows: null,
	draftGroups: null,
	isDraggingPortlet: !1,
	lastKnownLayout: [],
	isInitialized: !1,
	dragState: null,
	debugData: {},
	thumbnailDirty: !1
});
function En(e) {
	return {
		...Tn(),
		isEditMode: e.initialEditMode ?? !1
	};
}
function Dn(e, t, n) {
	return {
		setEditMode: (t) => e({
			isEditMode: t,
			selectedFilterId: null
		}),
		toggleEditMode: () => e((e) => ({
			isEditMode: !e.isEditMode,
			selectedFilterId: null
		})),
		setSelectedFilterId: (t) => e({ selectedFilterId: t }),
		exitFilterSelectionMode: () => e({ selectedFilterId: null }),
		openPortletModal: (t) => e({
			isPortletModalOpen: !0,
			editingPortlet: t ?? null
		}),
		closePortletModal: () => e({
			isPortletModalOpen: !1,
			editingPortlet: null
		}),
		openFilterConfigModal: (t) => e({
			isFilterConfigModalOpen: !0,
			filterConfigPortlet: t
		}),
		closeFilterConfigModal: () => e({
			isFilterConfigModalOpen: !1,
			filterConfigPortlet: null
		}),
		openTextModal: (t) => e({
			isTextModalOpen: !0,
			editingTextPortlet: t ?? null
		}),
		closeTextModal: () => e({
			isTextModalOpen: !1,
			editingTextPortlet: null
		}),
		openDeleteConfirm: (t) => e({
			deleteConfirmPortletId: t,
			deleteConfirmGroupId: null
		}),
		openDeleteGroupConfirm: (t) => e({
			deleteConfirmGroupId: t,
			deleteConfirmPortletId: null
		}),
		closeDeleteConfirm: () => e({
			deleteConfirmPortletId: null,
			deleteConfirmGroupId: null
		}),
		setDraftRows: (t) => e({ draftRows: t }),
		setDraftGroups: (t) => e({ draftGroups: t }),
		setIsDraggingPortlet: (t) => e({ isDraggingPortlet: t }),
		setLastKnownLayout: (t) => e({ lastKnownLayout: t }),
		setIsInitialized: (t) => e({ isInitialized: t }),
		setDragState: (t) => e({ dragState: t }),
		clearDragState: () => e({
			dragState: null,
			isDraggingPortlet: !1
		}),
		setDebugData: (t, n) => e((e) => ({ debugData: {
			...e.debugData,
			[t]: n
		} })),
		clearDebugData: (t) => e((e) => {
			if (t) {
				let { [t]: n, ...r } = e.debugData;
				return { debugData: r };
			}
			return { debugData: {} };
		}),
		setThumbnailDirty: (t) => e({ thumbnailDirty: t }),
		reset: () => e(n)
	};
}
function On(t = {}) {
	let n = En(t);
	return i()(r(e((e, t) => ({
		...n,
		...Dn(e, t, n)
	})), { name: "DashboardStore" }));
}
var kn = null;
function An() {
	return kn ||= On(), kn;
}
var jn = V(null);
function Mn({ children: e, initialEditMode: t }) {
	let n = K(null);
	return n.current ||= On({ initialEditMode: t }), /* @__PURE__ */ Y(jn.Provider, {
		value: n.current,
		children: e
	});
}
function Nn(e) {
	let t = ve(jn);
	if (!t) throw Error("useDashboardStore must be used within DashboardStoreProvider");
	return n(t, e);
}
function Pn() {
	let e = ve(jn);
	if (!e) throw Error("useDashboardStoreApi must be used within DashboardStoreProvider");
	return e;
}
function Fn(e) {
	let t = ve(jn), r = n(t ?? An(), e);
	return t ? r : null;
}
var In = (e) => ({
	isEditMode: e.isEditMode,
	selectedFilterId: e.selectedFilterId
}), Ln = (e) => ({
	isPortletModalOpen: e.isPortletModalOpen,
	editingPortlet: e.editingPortlet,
	isFilterConfigModalOpen: e.isFilterConfigModalOpen,
	filterConfigPortlet: e.filterConfigPortlet,
	isTextModalOpen: e.isTextModalOpen,
	editingTextPortlet: e.editingTextPortlet
}), Rn = (e) => ({
	draftRows: e.draftRows,
	draftGroups: e.draftGroups,
	isDraggingPortlet: e.isDraggingPortlet,
	lastKnownLayout: e.lastKnownLayout,
	isInitialized: e.isInitialized,
	dragState: e.dragState
}), zn = (e) => e.debugData, Bn = (e) => (t) => t.debugData[e], Vn = (e) => ({
	setEditMode: e.setEditMode,
	toggleEditMode: e.toggleEditMode,
	setSelectedFilterId: e.setSelectedFilterId,
	exitFilterSelectionMode: e.exitFilterSelectionMode
}), Hn = (e) => ({
	openPortletModal: e.openPortletModal,
	closePortletModal: e.closePortletModal,
	openTextModal: e.openTextModal,
	closeTextModal: e.closeTextModal,
	openFilterConfigModal: e.openFilterConfigModal,
	closeFilterConfigModal: e.closeFilterConfigModal,
	openDeleteConfirm: e.openDeleteConfirm,
	openDeleteGroupConfirm: e.openDeleteGroupConfirm,
	closeDeleteConfirm: e.closeDeleteConfirm
}), Un = (e) => ({
	setDraftRows: e.setDraftRows,
	setDraftGroups: e.setDraftGroups,
	setIsDraggingPortlet: e.setIsDraggingPortlet,
	setLastKnownLayout: e.setLastKnownLayout,
	setIsInitialized: e.setIsInitialized,
	setDragState: e.setDragState,
	clearDragState: e.clearDragState
}), Wn = (e) => ({
	setDebugData: e.setDebugData,
	clearDebugData: e.clearDebugData
}), Gn = (e) => e.thumbnailDirty, Kn = (e) => ({
	setEditMode: e.setEditMode,
	toggleEditMode: e.toggleEditMode,
	setSelectedFilterId: e.setSelectedFilterId,
	exitFilterSelectionMode: e.exitFilterSelectionMode,
	openPortletModal: e.openPortletModal,
	closePortletModal: e.closePortletModal,
	openTextModal: e.openTextModal,
	closeTextModal: e.closeTextModal,
	openFilterConfigModal: e.openFilterConfigModal,
	closeFilterConfigModal: e.closeFilterConfigModal,
	openDeleteConfirm: e.openDeleteConfirm,
	openDeleteGroupConfirm: e.openDeleteGroupConfirm,
	closeDeleteConfirm: e.closeDeleteConfirm,
	setDraftRows: e.setDraftRows,
	setIsDraggingPortlet: e.setIsDraggingPortlet,
	setLastKnownLayout: e.setLastKnownLayout,
	setIsInitialized: e.setIsInitialized,
	setDragState: e.setDragState,
	clearDragState: e.clearDragState,
	setDebugData: e.setDebugData,
	clearDebugData: e.clearDebugData,
	setThumbnailDirty: e.setThumbnailDirty,
	reset: e.reset
});
//#endregion
//#region src/client/hooks/useScrollDetection.ts
function qn(e, { threshold: t = 20, debounceMs: n = 150, container: r } = {}) {
	let [i, a] = q(!1), o = K();
	return W(() => {
		let r = e.current;
		if (!r) return;
		let i = () => {
			o.current && clearTimeout(o.current), o.current = window.setTimeout(() => {
				let e = r.scrollTop > t;
				a((t) => t === e ? t : e);
			}, n);
		};
		return r.addEventListener("scroll", i, { passive: !0 }), i(), () => {
			r.removeEventListener("scroll", i), o.current && clearTimeout(o.current);
		};
	}, [
		t,
		n,
		r
	]), i;
}
//#endregion
//#region src/client/hooks/useElementVisibility.ts
function Jn(e, { threshold: t = 80, debounceMs: n = 100, containerRef: r, container: i } = {}) {
	let [a, o] = q(!0), s = K(), c = K(!1);
	return W(() => {
		let i = r?.current, a = () => {
			let r = e.current;
			r && (s.current && clearTimeout(s.current), s.current = window.setTimeout(() => {
				let e = r.getBoundingClientRect();
				if (i) {
					let n = i.getBoundingClientRect(), r = e.bottom > n.top + t;
					r && (c.current = !0), o((e) => e === r ? e : r);
				} else {
					let n = e.bottom > t;
					n && (c.current = !0), o((e) => e === n ? e : n);
				}
			}, n));
		}, l = i || window;
		l.addEventListener("scroll", a, { passive: !0 }), window.addEventListener("resize", a, { passive: !0 }), a();
		let u = requestAnimationFrame(() => {
			a();
		});
		return () => {
			l.removeEventListener("scroll", a), window.removeEventListener("resize", a), cancelAnimationFrame(u), s.current && clearTimeout(s.current);
		};
	}, [
		e,
		r,
		t,
		n,
		i
	]), a;
}
//#endregion
//#region src/client/hooks/useDragAutoScroll.ts
function Yn(e, t = {}) {
	let { edgeThreshold: n = 80, maxScrollSpeed: r = 15, enabled: i = !0 } = t, a = K(null), o = K(null), s = K(0), c = U((e) => {
		let t = Math.max(0, Math.min(1, 1 - e / n));
		return Math.round(t * t * r);
	}, [n, r]), l = U(() => {
		let t = e.current;
		if (!o.current) {
			a.current = null;
			return;
		}
		let n = s.current;
		if (n > 0) {
			let e = o.current === "up" ? -n : n;
			t ? t.scrollTop += e : window.scrollBy(0, e);
		}
		a.current = requestAnimationFrame(l);
	}, [e]), u = U((e, t) => {
		o.current = e, s.current = t, a.current === null && (a.current = requestAnimationFrame(l));
	}, [l]), d = U(() => {
		o.current = null, s.current = 0, a.current !== null && (cancelAnimationFrame(a.current), a.current = null);
	}, []), f = U((t) => {
		let r = e.current, i = r ? r.getBoundingClientRect() : new DOMRect(0, 0, window.innerWidth, window.innerHeight), a = r ? r.scrollTop : window.scrollY, o = r ? r.scrollHeight - r.clientHeight : document.documentElement.scrollHeight - window.innerHeight, s = t.clientY;
		if (t.clientX < i.left || t.clientX > i.right) {
			d();
			return;
		}
		let l = s - i.top, f = i.bottom - s;
		if (l < n && a > 0) {
			let e = c(l);
			u("up", e);
		} else if (f < n && a < o) {
			let e = c(f);
			u("down", e);
		} else d();
	}, [
		e,
		n,
		c,
		u,
		d
	]), p = U(() => {
		d();
	}, [d]);
	W(() => {
		if (!i) {
			d();
			return;
		}
		return document.addEventListener("dragover", f, { capture: !0 }), document.addEventListener("dragend", p), document.addEventListener("drop", p), () => {
			document.removeEventListener("dragover", f, { capture: !0 }), document.removeEventListener("dragend", p), document.removeEventListener("drop", p), d();
		};
	}, [
		i,
		f,
		p,
		d
	]), W(() => () => {
		a.current !== null && cancelAnimationFrame(a.current);
	}, []);
}
//#endregion
//#region src/client/components/dashboardPortletCard/propsEqual.ts
function Xn(e, t) {
	if (e === t) return !0;
	if (!e || !t) return e === t;
	let n = Object.keys(e);
	if (n.length !== Object.keys(t).length) return !1;
	for (let r of n) if (e[r] !== t[r]) return !1;
	return !0;
}
var Zn = [
	"editable",
	"layoutMode",
	"configEagerLoad",
	"variant"
], Qn = [
	"portlet",
	"dashboardFilters",
	"colorPalette",
	"loadingComponent",
	"callbacks",
	"icons",
	"setPortletRef",
	"setPortletComponentRef"
];
function $n(e, t) {
	if (e === t) return !0;
	let n = e, r = t;
	for (let e of [...Zn, ...Qn]) if (n[e] !== r[e]) return !1;
	return Xn(e.containerProps, t.containerProps) && Xn(e.headerProps, t.headerProps);
}
//#endregion
//#region src/client/components/dashboardPortletCard/filterField.ts
function er(e) {
	let { isInSelectionMode: t, hasSelectedFilter: n, selectedFilterId: r, dashboardFilters: i, dashboardFilterMapping: a } = e;
	if (!t || !n || !r) return null;
	let o = i?.find((e) => e.id === r);
	if (!o || o.isUniversalTime) return null;
	let s = et(a, r);
	return s ? {
		field: s,
		isOverride: !0
	} : "member" in o.filter && o.filter.member ? {
		field: o.filter.member,
		isOverride: !1
	} : null;
}
//#endregion
//#region src/client/components/dashboardPortletCard/usePortletCardActions.ts
function tr(e) {
	let { portletTitle: t, debugData: n } = e, { features: r } = c(), [i, a] = q(!1), [o, s] = q(!1), l = K(null), [p, m] = q(!1), [h, _] = q(!1), [v, y] = q(!1), [b, x] = q(!1);
	W(() => {
		let e = (e) => {
			e.key === "Shift" && y(!0);
		}, t = (e) => {
			e.key === "Shift" && y(!1);
		};
		return window.addEventListener("keydown", e), window.addEventListener("keyup", t), () => {
			window.removeEventListener("keydown", e), window.removeEventListener("keyup", t);
		};
	}, []), W(() => {
		r.thumbnail?.enabled ? d().then(s) : s(!1);
	}, [r.thumbnail?.enabled]), W(() => {
		r.xlsExport?.enabled ? f().then(m) : m(!1);
	}, [r.xlsExport?.enabled]);
	let S = U(async (e) => {
		if (e.stopPropagation(), !(!n || h)) {
			_(!0);
			try {
				await g(t || "export", n);
			} finally {
				_(!1);
			}
		}
	}, [
		n,
		h,
		t
	]), C = U(async (e) => {
		e.stopPropagation(), l.current && await u(l.current) && (a(!0), setTimeout(() => a(!1), 2e3));
	}, []);
	return {
		chartContainerRef: l,
		copySuccess: i,
		copyAvailable: o,
		xlsExportAvailable: p,
		exportInProgress: h,
		showCacheBustIndicator: v && b,
		setIsHoveringRefresh: x,
		handleExportXlsx: S,
		handleCopyToClipboard: C
	};
}
//#endregion
//#region src/client/shared/components/CodeBlock.tsx
var nr = ({ code: e, language: t, title: n, maxHeight: r = "16rem", height: i, className: a = "", headerRight: o }) => {
	let { t: s } = R(), [c, l] = q(!1), u = K(null), d = v("copy"), f = v("check");
	return W(() => {
		if (!u.current) return;
		let n = u.current, r = !0;
		return n.textContent = e, ae().then(() => {
			if (!r) return;
			let i = oe();
			i && (n.innerHTML = i.highlight(e, { language: t }).value);
		}).catch(() => {
			r && (n.textContent = e);
		}), () => {
			r = !1;
		};
	}, [e, t]), /* @__PURE__ */ X("div", {
		className: `dc:relative ${a}`,
		children: [/* @__PURE__ */ X("div", {
			className: "dc:flex dc:items-center dc:justify-between dc:mb-2 dc:gap-2",
			children: [n && /* @__PURE__ */ Y("h4", {
				className: "dc:text-sm dc:font-semibold text-dc-text",
				children: n
			}), /* @__PURE__ */ X("div", {
				className: "dc:flex dc:items-center dc:gap-2 dc:ml-auto",
				children: [o, /* @__PURE__ */ Y("button", {
					onClick: async () => {
						try {
							await navigator.clipboard.writeText(e), l(!0), setTimeout(() => l(!1), 2e3);
						} catch {
							let t = document.createElement("textarea");
							t.value = e, t.style.position = "fixed", t.style.left = "-999999px", document.body.appendChild(t), t.select(), document.execCommand("copy"), document.body.removeChild(t), l(!0), setTimeout(() => l(!1), 2e3);
						}
					},
					className: "dc:px-2 dc:py-1 dc:text-xs dc:rounded-sm hover:bg-dc-surface-secondary dc:border border-dc-border dc:transition-colors dc:flex dc:items-center dc:gap-1.5",
					title: c ? "Copied!" : "Copy to clipboard",
					children: c ? /* @__PURE__ */ X(J, { children: [/* @__PURE__ */ Y(f, { className: "dc:w-3.5 dc:h-3.5 text-dc-success" }), /* @__PURE__ */ Y("span", {
						className: "text-dc-success",
						children: s("common.actions.copied")
					})] }) : /* @__PURE__ */ X(J, { children: [/* @__PURE__ */ Y(d, { className: "dc:w-3.5 dc:h-3.5 text-dc-text-secondary" }), /* @__PURE__ */ Y("span", {
						className: "text-dc-text-secondary",
						children: s("common.actions.copy")
					})] })
				})]
			})]
		}), /* @__PURE__ */ Y("div", {
			className: "bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm dc:overflow-auto",
			style: i ? {
				height: i,
				minHeight: i,
				maxHeight: i
			} : { maxHeight: r },
			children: /* @__PURE__ */ Y("pre", {
				className: "dc:p-3 dc:text-xs dc:m-0",
				children: /* @__PURE__ */ Y("code", {
					ref: u,
					className: `hljs language-${t}`,
					children: e
				})
			})
		})]
	});
};
//#endregion
//#region src/client/components/DebugModal.tsx
function rr({ chartConfig: e, displayConfig: t, queryObject: n, data: r, chartType: i, cacheInfo: a }) {
	let { t: o } = R(), [s, c] = q(!1);
	if (W(() => {
		let e = (e) => {
			e.key === "Escape" && s && c(!1);
		};
		return document.addEventListener("keydown", e), () => document.removeEventListener("keydown", e);
	}, [s]), !s) return /* @__PURE__ */ Y("button", {
		onClick: () => c(!0),
		className: "dc:p-1 text-dc-text-muted hover:text-dc-text-secondary dc:transition-colors",
		title: "Debug chart configuration",
		children: /* @__PURE__ */ X("svg", {
			width: "16",
			height: "16",
			viewBox: "0 0 24 24",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "2",
			strokeLinecap: "round",
			strokeLinejoin: "round",
			children: [
				/* @__PURE__ */ Y("circle", {
					cx: "12",
					cy: "12",
					r: "10"
				}),
				/* @__PURE__ */ Y("line", {
					x1: "12",
					y1: "8",
					x2: "12",
					y2: "12"
				}),
				/* @__PURE__ */ Y("line", {
					x1: "12",
					y1: "16",
					x2: "12.01",
					y2: "16"
				})
			]
		})
	});
	let l = [
		`xAxis: ${Array.isArray(e?.xAxis) ? `[${e.xAxis.join(", ")}]` : JSON.stringify(e?.xAxis ?? null)}`,
		`yAxis: ${Array.isArray(e?.yAxis) ? `[${e.yAxis.join(", ")}]` : JSON.stringify(e?.yAxis ?? null)}`,
		`series: ${Array.isArray(e?.series) ? `[${e.series.join(", ")}]` : JSON.stringify(e?.series ?? null)}`,
		...e?.sizeField ? [`sizeField: ${JSON.stringify(e.sizeField)}`] : [],
		...e?.colorField ? [`colorField: ${JSON.stringify(e.colorField)}`] : []
	].join("\n");
	return /* @__PURE__ */ Y("div", {
		className: "dc:absolute dc:inset-0 bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:z-50 dc:overflow-auto",
		onClick: (e) => e.stopPropagation(),
		children: /* @__PURE__ */ X("div", {
			className: "dc:p-4 dc:h-full dc:flex dc:flex-col",
			children: [
				/* @__PURE__ */ X("div", {
					className: "dc:flex dc:justify-between dc:items-center dc:mb-4 dc:shrink-0",
					children: [/* @__PURE__ */ Y("h2", {
						className: "dc:text-lg dc:font-semibold text-dc-text",
						children: o("debug.title")
					}), /* @__PURE__ */ Y("button", {
						onClick: () => c(!1),
						className: "dc:p-2 text-dc-text-muted hover:text-dc-text-secondary hover:bg-dc-surface-secondary dc:rounded-sm",
						children: /* @__PURE__ */ X("svg", {
							width: "16",
							height: "16",
							viewBox: "0 0 24 24",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "2",
							children: [/* @__PURE__ */ Y("line", {
								x1: "18",
								y1: "6",
								x2: "6",
								y2: "18"
							}), /* @__PURE__ */ Y("line", {
								x1: "6",
								y1: "6",
								x2: "18",
								y2: "18"
							})]
						})
					})]
				}),
				/* @__PURE__ */ X("div", {
					className: "dc:grid dc:grid-cols-1 dc:lg:grid-cols-2 dc:gap-4 dc:flex-1 dc:overflow-auto",
					children: [
						/* @__PURE__ */ Y(nr, {
							code: i,
							language: "json",
							title: "Chart Type",
							maxHeight: "3rem"
						}),
						/* @__PURE__ */ Y(nr, {
							code: l,
							language: "json",
							title: "Field Analysis",
							maxHeight: "8rem"
						}),
						/* @__PURE__ */ Y(nr, {
							code: JSON.stringify(e, null, 2),
							language: "json",
							title: "Chart Config",
							className: "dc:lg:col-span-2"
						}),
						/* @__PURE__ */ Y(nr, {
							code: JSON.stringify(t, null, 2),
							language: "json",
							title: "Display Config",
							className: "dc:lg:col-span-2"
						}),
						/* @__PURE__ */ Y(nr, {
							code: JSON.stringify(n, null, 2),
							language: "json",
							title: "Query Object",
							className: "dc:lg:col-span-2"
						}),
						/* @__PURE__ */ Y(nr, {
							code: JSON.stringify(Array.isArray(r) ? r.slice(0, 3) : r, null, 2),
							language: "json",
							title: "Data Sample (first 3 rows)",
							className: "dc:lg:col-span-2"
						}),
						/* @__PURE__ */ X("div", {
							className: "dc:lg:col-span-2",
							children: [/* @__PURE__ */ Y("h4", {
								className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-2",
								children: o("debug.cacheStatus")
							}), /* @__PURE__ */ Y("div", {
								className: "bg-dc-surface-secondary dc:p-2 dc:rounded-sm dc:text-xs dc:border border-dc-border",
								children: a ? /* @__PURE__ */ X("div", {
									className: "dc:flex dc:items-center dc:gap-4 dc:flex-wrap",
									children: [
										/* @__PURE__ */ Y("span", {
											className: "dc:inline-flex dc:items-center dc:px-2 dc:py-0.5 dc:rounded-sm dc:text-xs dc:font-medium bg-dc-success-bg text-dc-success",
											children: o("debug.cacheHit")
										}),
										/* @__PURE__ */ X("span", { children: [
											/* @__PURE__ */ Y("strong", { children: o("debug.cachedAt") }),
											" ",
											new Date(a.cachedAt).toLocaleString()
										] }),
										/* @__PURE__ */ X("span", { children: [
											/* @__PURE__ */ Y("strong", { children: o("debug.ttl") }),
											" ",
											Math.round(a.ttlMs / 1e3),
											"s"
										] }),
										/* @__PURE__ */ X("span", { children: [
											/* @__PURE__ */ Y("strong", { children: o("debug.ttlRemaining") }),
											" ",
											Math.round(a.ttlRemainingMs / 1e3),
											"s"
										] })
									]
								}) : /* @__PURE__ */ X("div", {
									className: "dc:flex dc:items-center dc:gap-2",
									children: [/* @__PURE__ */ Y("span", {
										className: "dc:inline-flex dc:items-center dc:px-2 dc:py-0.5 dc:rounded-sm dc:text-xs dc:font-medium bg-dc-surface text-dc-text-muted dc:border border-dc-border",
										children: o("debug.freshQuery")
									}), /* @__PURE__ */ Y("span", {
										className: "text-dc-text-muted",
										children: o("debug.notFromCache")
									})]
								})
							})]
						})
					]
				}),
				/* @__PURE__ */ X("div", {
					className: "dc:mt-4 dc:pt-2 dc:border-t border-dc-border dc:text-xs text-dc-text-muted dc:shrink-0",
					children: [
						o("debug.escToClose"),
						" ",
						/* @__PURE__ */ Y("kbd", {
							className: "dc:px-1 dc:py-0.5 bg-dc-surface-secondary dc:rounded-sm dc:text-xs",
							children: o("debug.escKey")
						}),
						" ",
						o("debug.toClose")
					]
				})
			]
		})
	});
}
//#endregion
//#region src/client/components/dashboardPortletCard/EditActionButtons.tsx
var ir = {
	width: "16px",
	height: "16px",
	color: "currentColor"
}, ar = "dc:p-1 bg-transparent dc:border-none dc:rounded-sm dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors";
function or({ portlet: e, icons: t, onOpenFilterConfig: n, onDuplicate: r, onEdit: i, onDelete: a }) {
	let { t: o } = R(), s = e.dashboardFilterMapping?.length ?? 0, c = (e) => (t) => {
		t.stopPropagation(), "preventDefault" in t && t.type === "touchend" && t.preventDefault(), e();
	};
	return /* @__PURE__ */ X(J, { children: [
		/* @__PURE__ */ Y("button", {
			draggable: !1,
			onClick: c(n),
			onTouchEnd: c(n),
			className: `${ar} dc:relative`,
			title: s > 0 ? o("dashboard.portlet.action.filterConfigActive", { count: String(s) }) : o("dashboard.portlet.action.filterConfig"),
			style: { color: s > 0 ? "var(--dc-primary)" : "var(--dc-text-secondary)" },
			children: /* @__PURE__ */ Y(t.FilterIcon, { style: ir })
		}),
		/* @__PURE__ */ Y("button", {
			draggable: !1,
			onClick: c(r),
			onTouchEnd: c(r),
			className: `${ar} text-dc-text-secondary`,
			title: o("dashboard.portlet.action.duplicate"),
			children: /* @__PURE__ */ Y(t.CopyIcon, { style: ir })
		}),
		/* @__PURE__ */ Y("button", {
			draggable: !1,
			onClick: c(i),
			onTouchEnd: c(i),
			className: `${ar} text-dc-text-secondary`,
			title: o("dashboard.portlet.action.edit"),
			children: /* @__PURE__ */ Y(t.EditIcon, { style: ir })
		}),
		/* @__PURE__ */ Y("button", {
			draggable: !1,
			onClick: c(a),
			onTouchEnd: c(a),
			className: "dc:p-1 dc:mr-0.5 bg-transparent dc:border-none dc:rounded-sm dc:cursor-pointer hover:bg-dc-danger-bg text-dc-danger dc:transition-colors",
			title: o("dashboard.portlet.action.delete"),
			children: /* @__PURE__ */ Y(t.DeleteIcon, { style: ir })
		})
	] });
}
//#endregion
//#region src/client/components/dashboardPortletCard/PortletCardHeader.tsx
var sr = {
	onMouseDown: (e) => {
		e.stopPropagation(), e.preventDefault();
	},
	onClick: (e) => e.stopPropagation(),
	onTouchStart: (e) => {
		e.stopPropagation(), e.preventDefault();
	},
	onTouchEnd: (e) => e.stopPropagation()
};
function cr({ cachedAt: e }) {
	return /* @__PURE__ */ Y("span", {
		className: "dc:p-1 text-dc-text-muted dc:opacity-40",
		title: `Cached ${Math.round((Date.now() - new Date(e).getTime()) / 1e3)}s ago`,
		children: /* @__PURE__ */ X("svg", {
			width: "12",
			height: "12",
			viewBox: "0 0 24 24",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "2",
			strokeLinecap: "round",
			strokeLinejoin: "round",
			children: [
				/* @__PURE__ */ Y("ellipse", {
					cx: "12",
					cy: "5",
					rx: "9",
					ry: "3"
				}),
				/* @__PURE__ */ Y("path", { d: "M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" }),
				/* @__PURE__ */ Y("path", { d: "M3 12c0 1.66 4 3 9 3s9-1.34 9-3" })
			]
		})
	});
}
function lr(e) {
	let { portlet: t, className: n, headerStyle: r, restHeaderProps: i, headerOnClick: a, editable: o, isEditMode: s, isInSelectionMode: c, debugData: l, copyAvailable: u, copySuccess: d, xlsExportAvailable: f, exportInProgress: p, showCacheBustIndicator: m, icons: h, onRefresh: g, onHoverRefreshChange: _, onCopyToClipboard: y, onExportXlsx: b, onOpenFilterConfig: x, onDuplicate: S, onEdit: C, onDelete: w } = e, T = v("camera"), E = v("check"), D = v("download");
	return /* @__PURE__ */ X("div", {
		className: n,
		style: r,
		onClick: (e) => {
			a?.(e);
		},
		...i,
		children: [/* @__PURE__ */ X("div", {
			className: "dc:flex dc:items-center dc:gap-2 dc:flex-1 dc:min-w-0",
			children: [/* @__PURE__ */ Y("h3", {
				className: "dc:font-semibold dc:text-sm text-dc-text dc:truncate",
				children: t.title
			}), o && s && l && /* @__PURE__ */ Y("div", {
				...sr,
				children: /* @__PURE__ */ Y(rr, {
					chartConfig: l.chartConfig,
					displayConfig: l.displayConfig,
					queryObject: l.queryObject,
					data: l.data,
					chartType: l.chartType,
					cacheInfo: l.cacheInfo
				})
			})]
		}), /* @__PURE__ */ X("div", {
			className: "dc:flex dc:items-center dc:gap-1 dc:shrink-0 dc:ml-4 dc:-mr-2",
			...sr,
			children: [
				l?.cacheInfo && /* @__PURE__ */ Y(cr, { cachedAt: l.cacheInfo.cachedAt }),
				/* @__PURE__ */ Y("button", {
					onClick: (e) => {
						e.stopPropagation(), g({ bustCache: e.shiftKey });
					},
					onTouchEnd: (e) => {
						e.stopPropagation(), e.preventDefault(), g();
					},
					onMouseEnter: () => _(!0),
					onMouseLeave: () => _(!1),
					disabled: c,
					className: `dc:p-1 bg-transparent dc:border-none dc:rounded-sm dc:transition-colors ${c ? "dc:cursor-not-allowed dc:opacity-50 text-dc-text-secondary" : m ? "dc:cursor-pointer text-dc-warning bg-dc-warning-bg" : "dc:cursor-pointer text-dc-text-secondary hover:bg-dc-surface-hover"}`,
					title: m ? "Click to refresh and bypass cache" : "Refresh portlet data (Shift+click to bypass cache)",
					children: /* @__PURE__ */ Y(h.RefreshIcon, { style: ir })
				}),
				u && !c && /* @__PURE__ */ Y("button", {
					onClick: y,
					onTouchEnd: (e) => {
						e.preventDefault(), y(e);
					},
					className: "dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors",
					title: d ? "Copied!" : "Copy chart to clipboard",
					children: Y(d ? E : T, { style: ir })
				}),
				f && !c && l && /* @__PURE__ */ Y("button", {
					onClick: b,
					onTouchEnd: (e) => {
						e.preventDefault(), b(e);
					},
					disabled: p,
					className: `dc:p-1 bg-transparent dc:border-none dc:rounded-sm dc:transition-colors ${p ? "dc:opacity-50 dc:cursor-wait text-dc-text-secondary" : "text-dc-text-secondary dc:cursor-pointer dc:hover:bg-dc-surface-hover"}`,
					title: p ? "Exporting..." : "Download data as XLSX",
					children: /* @__PURE__ */ Y(D, { style: ir })
				}),
				o && s && !c && /* @__PURE__ */ Y(or, {
					portlet: t,
					icons: h,
					onOpenFilterConfig: x,
					onDuplicate: S,
					onEdit: C,
					onDelete: w
				})
			]
		})]
	});
}
//#endregion
//#region src/client/components/dashboardPortletCard/PortletFloatingActions.tsx
var ur = {
	width: "14px",
	height: "14px",
	color: "currentColor"
};
function dr() {
	return /* @__PURE__ */ X("svg", {
		style: ur,
		viewBox: "0 0 24 24",
		fill: "currentColor",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ Y("circle", {
				cx: "9",
				cy: "6",
				r: "1.6"
			}),
			/* @__PURE__ */ Y("circle", {
				cx: "15",
				cy: "6",
				r: "1.6"
			}),
			/* @__PURE__ */ Y("circle", {
				cx: "9",
				cy: "12",
				r: "1.6"
			}),
			/* @__PURE__ */ Y("circle", {
				cx: "15",
				cy: "12",
				r: "1.6"
			}),
			/* @__PURE__ */ Y("circle", {
				cx: "9",
				cy: "18",
				r: "1.6"
			}),
			/* @__PURE__ */ Y("circle", {
				cx: "15",
				cy: "18",
				r: "1.6"
			})
		]
	});
}
function fr({ portlet: e, icons: t, showEditActions: n, copyAvailable: r, copySuccess: i, xlsExportAvailable: a, exportInProgress: o, onRefresh: s, onCopyToClipboard: c, onExportXlsx: l, onOpenFilterConfig: u, onDuplicate: d, onEdit: f, onDelete: p }) {
	let { t: m } = R(), h = v("camera"), g = v("check"), _ = v("download");
	return /* @__PURE__ */ X("div", {
		className: "dc-portlet-floating-actions dc:flex dc:items-center dc:gap-0.5 dc:px-1 dc:py-0.5 dc:rounded-sm dc:border border-dc-border bg-dc-surface dc:opacity-0 dc:transition-opacity",
		style: { boxShadow: "var(--dc-shadow-sm)" },
		onClick: (e) => e.stopPropagation(),
		children: [n && /* @__PURE__ */ Y("span", {
			className: "dc-portlet-drag-grip dc:p-1 text-dc-text-muted dc:cursor-move",
			title: m("dashboard.portlet.action.drag"),
			children: /* @__PURE__ */ Y(dr, {})
		}), /* @__PURE__ */ X("div", {
			className: "dc:flex dc:items-center dc:gap-0.5",
			onMouseDown: (e) => {
				e.stopPropagation(), e.preventDefault();
			},
			onTouchStart: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ Y("button", {
					draggable: !1,
					onClick: (e) => {
						e.stopPropagation(), s({ bustCache: e.shiftKey });
					},
					className: "dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors",
					title: m("dashboard.portlet.action.refresh"),
					children: /* @__PURE__ */ Y(t.RefreshIcon, { style: ir })
				}),
				r && /* @__PURE__ */ Y("button", {
					draggable: !1,
					onClick: c,
					className: "dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors",
					title: m(i ? "portlet.copied" : "portlet.copyToClipboard"),
					children: Y(i ? g : h, { style: ir })
				}),
				a && /* @__PURE__ */ Y("button", {
					draggable: !1,
					onClick: l,
					disabled: o,
					className: `dc:p-1 bg-transparent dc:border-none dc:rounded-sm dc:transition-colors ${o ? "dc:opacity-50 dc:cursor-wait text-dc-text-secondary" : "text-dc-text-secondary dc:cursor-pointer dc:hover:bg-dc-surface-hover"}`,
					title: m(o ? "portlet.exporting" : "portlet.downloadXlsx"),
					children: /* @__PURE__ */ Y(_, { style: ir })
				}),
				n && /* @__PURE__ */ Y(or, {
					portlet: e,
					icons: t,
					onOpenFilterConfig: u,
					onDuplicate: d,
					onEdit: f,
					onDelete: p
				})
			]
		})]
	});
}
//#endregion
//#region src/client/components/dashboardPortletCard/FilterFieldChip.tsx
function pr({ field: e, FilterIcon: t, onOpenFilterConfig: n }) {
	let { t: r } = R();
	return /* @__PURE__ */ X("button", {
		onClick: (e) => {
			e.stopPropagation(), n();
		},
		onTouchEnd: (e) => {
			e.stopPropagation(), e.preventDefault(), n();
		},
		title: r("dashboard.filterFieldChipHint"),
		className: "dc:absolute dc:bottom-2 dc:left-1/2 dc:-translate-x-1/2 dc:z-10 dc:flex dc:items-center dc:gap-1 dc:px-2.5 dc:py-1 dc:text-xs dc:font-medium dc:rounded-full dc:border dc:cursor-pointer dc:transition-colors dc:max-w-[90%] dc:truncate",
		style: {
			backgroundColor: e.isOverride ? "var(--dc-primary)" : "var(--dc-surface)",
			color: e.isOverride ? "white" : "var(--dc-text-secondary)",
			borderColor: "var(--dc-primary)",
			boxShadow: "var(--dc-shadow-sm)"
		},
		children: [/* @__PURE__ */ Y(t, { style: {
			width: "12px",
			height: "12px"
		} }), /* @__PURE__ */ Y("span", {
			className: "dc:truncate",
			children: e.field
		})]
	});
}
//#endregion
//#region src/client/components/dashboardPortletCard/cardStyles.ts
function mr(e) {
	let { renderChartType: t, renderDisplayConfig: n, layoutMode: r, isEditMode: i, portletTitle: a, variant: o } = e;
	if (o === "groupChild") return {
		isMarkdownAutoHeight: !1,
		isTransparentContent: t === "markdown" && !!n?.transparentBackground,
		isTransparent: !0,
		shouldHideHeader: !0
	};
	let s = t === "markdown", c = r !== "grid" && s && (n?.autoHeight ?? !0), l = s ? (n?.hideHeader ?? !0) || !!n?.transparentBackground || !a : n?.hideHeader ?? !1;
	if (o === "sectionChild") return {
		isMarkdownAutoHeight: c,
		isTransparentContent: !1,
		isTransparent: !0,
		shouldHideHeader: l
	};
	let u = s && !!n?.transparentBackground;
	return {
		isMarkdownAutoHeight: c,
		isTransparentContent: u,
		isTransparent: u && !i,
		shouldHideHeader: l
	};
}
function hr(e) {
	let { isTransparent: t, isMarkdownAutoHeight: n, isInSelectionMode: r, extraClassName: i, variant: a } = e;
	return a === "groupChild" ? [
		"dc-portlet-group-child dc:group dc:relative dc:flex dc:flex-col dc:h-full dc:min-h-0 dc:overflow-hidden",
		r ? "dc:cursor-pointer" : "",
		i
	].filter(Boolean).join(" ") : [
		a === "sectionChild" ? "dc-portlet-section-child" : "",
		t ? "dc:flex dc:flex-col dc:transition-all" : "bg-dc-surface dc:border dc:rounded-lg dc:flex dc:flex-col dc:transition-all",
		n ? "" : "dc:h-full",
		r ? "dc:cursor-pointer dc:relative" : "",
		i
	].filter(Boolean).join(" ");
}
function gr(e, t, n) {
	return [
		"dc:flex dc:items-center dc:justify-between dc:px-3 dc:md:px-4 dc:shrink-0 portlet-drag-handle",
		n === "sectionChild" ? "dc:py-3 dc:md:py-3" : "dc:py-1.5 dc:md:py-1 dc:border-b border-dc-border bg-dc-surface-secondary dc:rounded-t-lg",
		e ? "dc:cursor-move" : "dc:cursor-default",
		t
	].filter(Boolean).join(" ");
}
function _r(e) {
	let { isTransparent: t, isInSelectionMode: n, hasSelectedFilter: r, containerStyle: i, variant: a } = e, o = n && r;
	return a === "groupChild" || a === "sectionChild" ? {
		boxShadow: o ? "inset 0 0 0 2px var(--dc-primary)" : "none",
		borderWidth: 0,
		backgroundColor: o ? "color-mix(in srgb, var(--dc-primary) 5%, transparent)" : "transparent",
		opacity: n && !r ? "0.5" : "1",
		...i
	} : {
		boxShadow: t ? "none" : "var(--dc-shadow-sm)",
		borderColor: t ? "transparent" : o ? "var(--dc-primary)" : "var(--dc-border)",
		borderWidth: t ? "0" : o ? "2px" : "1px",
		backgroundColor: t ? "transparent" : o ? "color-mix(in srgb, var(--dc-primary) 5%, transparent)" : "var(--dc-surface)",
		opacity: n && !r ? "0.5" : "1",
		...i
	};
}
//#endregion
//#region src/client/components/DashboardPortletCard.tsx
var vr = de.memo(function({ isTransparent: e, setChartContainerRef: t, setPortletComponentRef: n, renderQuery: r, renderChartType: i, renderChartConfig: a, renderDisplayConfig: o, dashboardFilters: s, dashboardFilterMapping: c, eagerLoad: l, title: u, isMarkdownAutoHeight: d, colorPalette: f, loadingComponent: p, onDebugDataReady: m }) {
	return /* @__PURE__ */ Y("div", {
		ref: t,
		className: `dc-portlet-card-body dc:flex-1 dc:min-h-0 dc:flex dc:flex-col${e ? "" : " dc:px-2 dc:py-3 dc:md:px-4 dc:md:py-4"}`,
		children: /* @__PURE__ */ Y(wn, {
			ref: n,
			query: r,
			chartType: i,
			chartConfig: a,
			displayConfig: o,
			dashboardFilters: s,
			dashboardFilterMapping: c,
			eagerLoad: l,
			title: u,
			height: d ? "auto" : "100%",
			colorPalette: f,
			loadingComponent: p,
			onDebugDataReady: m
		})
	});
}), yr = de.memo(function({ portlet: e, editable: t, layoutMode: n = "grid", dashboardFilters: r, configEagerLoad: i, loadingComponent: a, colorPalette: o, containerProps: s, headerProps: c, variant: l = "standalone", setPortletRef: u, setPortletComponentRef: d, callbacks: f, icons: p }) {
	let { analysisConfig: m } = G(() => Q(e), [e]), h = m.charts[m.analysisType], g = G(() => JSON.stringify(m.query), [m.query]), _ = h?.chartType || "line", v = h?.chartConfig, y = h?.displayConfig, b = Nn((e) => e.isEditMode), x = Nn((e) => e.selectedFilterId), S = Nn((t) => t.debugData[e.id]), { isMarkdownAutoHeight: C, isTransparentContent: w, isTransparent: T, shouldHideHeader: E } = mr({
		renderChartType: _,
		renderDisplayConfig: y,
		layoutMode: n,
		isEditMode: b,
		portletTitle: e.title,
		variant: l
	}), D = Nn((e) => e.setDebugData), { chartContainerRef: O, copySuccess: k, copyAvailable: A, xlsExportAvailable: j, exportInProgress: M, showCacheBustIndicator: N, setIsHoveringRefresh: P, handleExportXlsx: ee, handleCopyToClipboard: te } = tr({
		portletTitle: e.title,
		debugData: S
	}), F = x ? $e(e.dashboardFilterMapping, x) : !1, I = !!x, ne = G(() => er({
		isInSelectionMode: I,
		hasSelectedFilter: F,
		selectedFilterId: x,
		dashboardFilters: r,
		dashboardFilterMapping: e.dashboardFilterMapping
	}), [
		I,
		F,
		x,
		r,
		e.dashboardFilterMapping
	]), L = hr({
		isTransparent: T,
		isMarkdownAutoHeight: C,
		isInSelectionMode: I,
		extraClassName: s?.className,
		variant: l
	}), R = gr(b, c?.className, l), { onClick: z, className: B, style: re, ...ie } = s ?? {}, { onClick: ae, className: oe, style: se, ...ce } = c ?? {}, le = U((t) => {
		D(e.id, t);
	}, [e.id, D]), ue = U((t) => {
		u(e.id, t);
	}, [e.id, u]), de = U((t) => {
		d(e.id, t);
	}, [e.id, d]), fe = U((e) => {
		O.current = e;
	}, [O]);
	return /* @__PURE__ */ X("div", {
		"data-portlet-id": e.id,
		ref: ue,
		className: L,
		style: _r({
			isTransparent: T,
			isInSelectionMode: I,
			hasSelectedFilter: F,
			containerStyle: re,
			variant: l
		}),
		onClick: (t) => {
			I && x && (t.stopPropagation(), f.onToggleFilter(e.id, x)), z?.(t);
		},
		...ie,
		children: [
			ne && /* @__PURE__ */ Y(pr, {
				field: ne,
				FilterIcon: p.FilterIcon,
				onOpenFilterConfig: () => f.onOpenFilterConfig(e)
			}),
			l === "groupChild" && !I && /* @__PURE__ */ Y(fr, {
				portlet: e,
				icons: p,
				showEditActions: t && b,
				copyAvailable: A,
				copySuccess: k,
				xlsExportAvailable: j && !!S,
				exportInProgress: M,
				onRefresh: (t) => f.onRefresh(e.id, t),
				onCopyToClipboard: te,
				onExportXlsx: ee,
				onOpenFilterConfig: () => f.onOpenFilterConfig(e),
				onDuplicate: () => f.onDuplicate(e.id),
				onEdit: () => f.onEdit(e),
				onDelete: () => f.onDelete(e.id)
			}),
			l !== "groupChild" && (!E || b) && /* @__PURE__ */ Y(lr, {
				portlet: e,
				className: R,
				headerStyle: se,
				restHeaderProps: ce,
				headerOnClick: ae,
				editable: t,
				isEditMode: b,
				isInSelectionMode: I,
				debugData: S,
				copyAvailable: A,
				copySuccess: k,
				xlsExportAvailable: j,
				exportInProgress: M,
				showCacheBustIndicator: N,
				icons: p,
				onRefresh: (t) => f.onRefresh(e.id, t),
				onHoverRefreshChange: P,
				onCopyToClipboard: te,
				onExportXlsx: ee,
				onOpenFilterConfig: () => f.onOpenFilterConfig(e),
				onDuplicate: () => f.onDuplicate(e.id),
				onEdit: () => f.onEdit(e),
				onDelete: () => f.onDelete(e.id)
			}),
			/* @__PURE__ */ Y(vr, {
				isTransparent: w,
				setChartContainerRef: fe,
				setPortletComponentRef: de,
				renderQuery: g,
				renderChartType: _,
				renderChartConfig: v,
				renderDisplayConfig: y,
				dashboardFilters: r,
				dashboardFilterMapping: e.dashboardFilterMapping,
				eagerLoad: e.eagerLoad ?? i ?? !1,
				title: e.title,
				isMarkdownAutoHeight: C,
				colorPalette: o,
				loadingComponent: a,
				onDebugDataReady: le
			})
		]
	});
}, $n);
//#endregion
//#region src/client/components/rowManagedLayout/sections.ts
function br(e) {
	let t = Q(e), n = t.analysisConfig.charts[t.analysisConfig.analysisType];
	return n?.chartType === "markdown" && (n.displayConfig?.autoHeight ?? !0);
}
function xr(e, t) {
	return e.columns.length > 0 && e.columns.every((e) => {
		if (e.groupId) return !1;
		let n = e.portletId ? t.get(e.portletId) : void 0;
		return !!n && br(n);
	});
}
function Sr(e, t, n) {
	if (e.columns.length !== 1) return !1;
	let [r] = e.columns;
	return r.groupId || !r.portletId || Math.abs(r.w - n) > 1e-6 ? !1 : xr(e, t);
}
var Cr = /^ {0,3}([-*_])[ \t]*(?:\1[ \t]*){2,}$/;
function wr(e) {
	let t = Q(e), n = t.analysisConfig.charts[t.analysisConfig.analysisType]?.displayConfig;
	if (n?.accentBorder === "bottom") return !0;
	let r = n?.content;
	if (typeof r != "string") return !1;
	let i = r.trimEnd().split("\n");
	return Cr.test(i[i.length - 1] ?? "");
}
function Tr(e, t, n) {
	let r = [], i = 0;
	for (; i < e.length;) {
		if (!Sr(e[i], t, n)) {
			r.push({
				kind: "loose",
				rowIndex: i
			}), i += 1;
			continue;
		}
		let a = i, o = [];
		for (i += 1; i < e.length && !Sr(e[i], t, n);) o.push(i), i += 1;
		r.push(o.length === 0 ? {
			kind: "loose",
			rowIndex: a
		} : {
			kind: "section",
			headerRowIndex: a,
			bodyRowIndices: o
		});
	}
	return r;
}
//#endregion
//#region src/client/components/RowManagedLayout.tsx
var Er = [
	"top",
	"right",
	"bottom",
	"left"
], Dr = 16;
function Or({ rows: e, portlets: t, groups: n = [], gridSettings: r, gridWidth: i, canEdit: a, isDragging: o, onRowResize: s, onColumnResize: c, onPortletDragStart: l, onPortletDragEnd: u, onRowDrop: d, onNewRowDrop: f, onSnapDrop: p, draggingPortletId: m, draggingGroupId: h, renderPortlet: g, renderGroup: _ }) {
	let v = new Map(t.map((e) => [e.id, e])), y = new Map(n.map((e) => [e.id, e])), [b, x] = q(null), S = (e) => {
		x(e);
	}, C = o || b !== null, w = U((e) => {
		l(parseInt(e.currentTarget.dataset.rowIndex || "0", 10), parseInt(e.currentTarget.dataset.columnIndex || "0", 10), e.currentTarget.dataset.portletId || "", e, e.currentTarget.dataset.groupId || void 0);
	}, [l]), T = U(() => {
		S(null), u();
	}, [u]), E = U((e) => !a || !p || !o || h || m === e ? null : Er.map((t) => {
		let n = `snap-${e}-${t}`, r = b === n;
		return /* @__PURE__ */ X(pe, { children: [/* @__PURE__ */ Y("div", {
			"data-snap-edge": t,
			"data-snap-portlet-id": e,
			className: `dc-portlet-snap-band dc-portlet-snap-band-${t}${r ? " dc-snap-zone-active" : ""}`,
			onDragOver: (e) => {
				e.preventDefault(), e.stopPropagation(), S(n);
			},
			onDragLeave: () => S(null),
			onDrop: (n) => {
				n.preventDefault(), n.stopPropagation(), S(null), p(e, t);
			}
		}), r && /* @__PURE__ */ Y("div", { className: `dc-portlet-snap-preview dc-portlet-snap-preview-${t}` })] }, n);
	}), [
		b,
		a,
		h,
		m,
		o,
		p
	]), D = a ? null : Tr(e, v, r.cols), O = (t) => {
		let n = e[t]?.columns[0]?.portletId, r = n ? v.get(n) : void 0;
		return !!r && wr(r);
	}, k = (e, t, n) => {
		let o = xr(e, v), l = o ? void 0 : e.h * r.rowHeight, u = i || r.cols * r.rowHeight, p = b === `row-${t}-insert-0` ? Dr : 0, x = b === `row-${t}-insert-${e.columns.length}` ? Dr : 0, C = (u - (e.columns.length - 1) * Dr - p - x) / r.cols;
		return /* @__PURE__ */ X("div", {
			className: "dc-row-layout-row-wrapper",
			children: [
				/* @__PURE__ */ Y("div", {
					className: "dc-row-layout-row",
					style: {
						height: l ?? "auto",
						paddingLeft: p,
						paddingRight: x
					},
					children: e.columns.map((r, i) => {
						let o = r.groupId ? y.get(r.groupId) : void 0, s = !o && r.portletId ? v.get(r.portletId) : void 0;
						if (!o && !s) return null;
						let l = o ? o.id : s.id, u = r.w * C;
						return /* @__PURE__ */ X("div", {
							className: `dc-row-layout-column-wrapper dc-row-layout-column${(o ? h === o.id : m === s.id) ? " dc-row-layout-column-dragging" : ""}`,
							draggable: a,
							"data-row-index": t.toString(),
							"data-column-index": i.toString(),
							"data-portlet-id": s?.id,
							"data-group-id": o?.id,
							onDragStart: w,
							onDragEnd: T,
							style: {
								flex: `0 0 ${u}px`,
								maxWidth: `${u}px`
							},
							children: [o ? _?.(o, E, n) : /* @__PURE__ */ X(J, { children: [g(s, void 0, void 0, n ? "sectionChild" : "standalone"), E(s.id)] }), i < e.columns.length - 1 && /* @__PURE__ */ Y("div", {
								className: `dc-column-resize-handle dc-split-handle${b === `row-${t}-insert-${i + 1}` ? " dc-drop-zone-active" : ""}`,
								onMouseDown: (e) => c(t, i, e),
								onDragOver: (e) => {
									a && (e.preventDefault(), S(`row-${t}-insert-${i + 1}`));
								},
								onDragLeave: () => S(null),
								onDrop: (e) => {
									a && (e.preventDefault(), e.stopPropagation(), S(null), d(t, i + 1));
								}
							})]
						}, l);
					})
				}),
				a && /* @__PURE__ */ X(J, { children: [/* @__PURE__ */ Y("div", {
					className: `dc-row-edge-drop dc-row-edge-drop-left dc-split-handle${b === `row-${t}-insert-0` ? " dc-drop-zone-active" : ""}`,
					onDragOver: (e) => {
						e.preventDefault(), S(`row-${t}-insert-0`);
					},
					onDragLeave: () => {
						S(null);
					},
					onDrop: (e) => {
						e.preventDefault(), S(null), d(t, 0);
					}
				}), /* @__PURE__ */ Y("div", {
					className: `dc-row-edge-drop dc-row-edge-drop-right dc-split-handle${b === `row-${t}-insert-${e.columns.length}` ? " dc-drop-zone-active" : ""}`,
					onDragOver: (n) => {
						n.preventDefault(), S(`row-${t}-insert-${e.columns.length}`);
					},
					onDragLeave: () => {
						S(null);
					},
					onDrop: (n) => {
						n.preventDefault(), S(null), d(t, e.columns.length);
					}
				})] }),
				a && /* @__PURE__ */ Y("div", {
					className: `dc-row-resize-handle dc-split-handle${o ? " dc-row-resize-handle-drop-only" : ""}${b === `row-insert-${t + 1}` ? " dc-drop-zone-active" : ""}`,
					onMouseDown: o ? void 0 : (e) => s(t, e),
					onDragOver: (e) => {
						e.preventDefault(), S(`row-insert-${t + 1}`);
					},
					onDragLeave: () => S(null),
					onDrop: (e) => {
						e.preventDefault(), S(null), f(t + 1);
					}
				})
			]
		}, e.id);
	}, A = b === "row-insert-0", j = b === "row-bottom";
	return /* @__PURE__ */ X("div", {
		className: `dc-row-layout${a ? " dc-row-layout-editable" : ""}${C ? " dc-row-layout-dragging" : ""}`,
		style: {
			"--dc-row-gap": "24px",
			"--dc-column-gap": `${Dr}px`,
			"--dc-top-drop-space": A ? "24px" : "0px",
			"--dc-bottom-drop-space": j ? "24px" : "0px"
		},
		children: [
			a && /* @__PURE__ */ Y("div", {
				className: `dc-row-boundary-drop dc-row-boundary-drop-top dc-split-handle${b === "row-insert-0" ? " dc-drop-zone-active" : ""}`,
				onDragOver: (e) => {
					e.preventDefault(), S("row-insert-0");
				},
				onDragLeave: () => S(null),
				onDrop: (e) => {
					e.preventDefault(), S(null), f(0);
				}
			}),
			D ? D.map((t) => t.kind === "loose" ? k(e[t.rowIndex], t.rowIndex, !1) : /* @__PURE__ */ X("div", {
				className: `dc-dashboard-section${O(t.headerRowIndex) ? " dc-dashboard-section-ruled" : ""}`,
				children: [k(e[t.headerRowIndex], t.headerRowIndex, !0), t.bodyRowIndices.map((t) => k(e[t], t, !0))]
			}, `section-${e[t.headerRowIndex].id}`)) : e.map((e, t) => k(e, t, !1)),
			a && /* @__PURE__ */ Y("div", {
				className: `dc-row-boundary-drop dc-row-boundary-drop-bottom dc-split-handle${b === "row-bottom" ? " dc-drop-zone-active" : ""}`,
				onDragOver: (e) => {
					e.preventDefault(), S("row-bottom");
				},
				onDragLeave: () => S(null),
				onDrop: (t) => {
					t.preventDefault(), S(null), f(e.length);
				}
			})
		]
	});
}
//#endregion
//#region src/client/components/PortletGroupCard.tsx
function kr() {
	return /* @__PURE__ */ X("svg", {
		style: {
			width: "14px",
			height: "14px",
			color: "currentColor"
		},
		viewBox: "0 0 24 24",
		fill: "currentColor",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ Y("circle", {
				cx: "9",
				cy: "6",
				r: "1.6"
			}),
			/* @__PURE__ */ Y("circle", {
				cx: "15",
				cy: "6",
				r: "1.6"
			}),
			/* @__PURE__ */ Y("circle", {
				cx: "9",
				cy: "12",
				r: "1.6"
			}),
			/* @__PURE__ */ Y("circle", {
				cx: "15",
				cy: "12",
				r: "1.6"
			}),
			/* @__PURE__ */ Y("circle", {
				cx: "9",
				cy: "18",
				r: "1.6"
			}),
			/* @__PURE__ */ Y("circle", {
				cx: "15",
				cy: "18",
				r: "1.6"
			})
		]
	});
}
var Ar = v("edit"), jr = v("delete"), Mr = v("segment");
function Nr({ group: e, portlets: t, canEdit: n, renderChild: r, onRename: i, onUngroup: a, onDelete: o, onChildDragStart: s, onChildDragEnd: c, renderSnapBands: l, frameless: u = !1 }) {
	let { t: d } = R(), [f, p] = q(!1), [m, h] = q(e.title ?? ""), g = e.direction === "row", _ = !!(e.title && e.title.trim()), v = U(() => {
		p(!1), m !== (e.title ?? "") && i(e.id, m);
	}, [
		e.id,
		e.title,
		i,
		m
	]), y = U(() => {
		h(e.title ?? ""), p(!0);
	}, [e.title]), b = n ? /* @__PURE__ */ X("div", {
		className: "dc-portlet-group-toolbar dc:flex dc:items-center dc:gap-0.5 dc:shrink-0",
		onMouseDown: (e) => {
			e.stopPropagation(), e.preventDefault();
		},
		onClick: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ Y("button", {
				draggable: !1,
				onClick: y,
				className: "dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors",
				title: d("dashboard.group.rename"),
				children: /* @__PURE__ */ Y(Ar, { style: {
					width: "14px",
					height: "14px",
					color: "currentColor"
				} })
			}),
			/* @__PURE__ */ Y("button", {
				draggable: !1,
				onClick: () => a(e.id),
				className: "dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors",
				title: d("dashboard.group.ungroup"),
				children: /* @__PURE__ */ Y(Mr, { style: {
					width: "14px",
					height: "14px",
					color: "currentColor"
				} })
			}),
			/* @__PURE__ */ Y("button", {
				draggable: !1,
				onClick: () => o(e.id),
				className: "dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-danger dc:cursor-pointer hover:bg-dc-danger-bg dc:transition-colors",
				title: d("dashboard.group.delete"),
				children: /* @__PURE__ */ Y(jr, { style: {
					width: "14px",
					height: "14px",
					color: "currentColor"
				} })
			})
		]
	}) : null, x = n ? /* @__PURE__ */ Y("span", {
		className: "dc-portlet-group-drag-grip dc:inline-flex dc:items-center dc:p-1 text-dc-text-muted dc:cursor-move dc:shrink-0",
		title: d("dashboard.group.drag"),
		children: /* @__PURE__ */ Y(kr, {})
	}) : null;
	return /* @__PURE__ */ X("div", {
		className: `dc-portlet-group${u ? " dc-portlet-group-frameless" : " bg-dc-surface dc:border border-dc-border dc:rounded-lg"} dc:flex dc:flex-col dc:h-full dc:min-h-0 dc:relative`,
		style: { boxShadow: u ? "none" : "var(--dc-shadow-sm)" },
		"data-group-id": e.id,
		children: [
			(_ || f) && /* @__PURE__ */ X("div", {
				className: "dc-portlet-group-title portlet-drag-handle dc:flex dc:items-center dc:justify-between dc:gap-2 dc:px-2 dc:py-1 dc:border-b border-dc-border dc:shrink-0 bg-dc-surface-secondary dc:rounded-t-lg",
				children: [/* @__PURE__ */ X("div", {
					className: "dc:flex dc:items-center dc:gap-1 dc:min-w-0 dc:flex-1",
					children: [x, f ? /* @__PURE__ */ Y("input", {
						autoFocus: !0,
						value: m,
						onChange: (e) => h(e.target.value),
						onBlur: v,
						onKeyDown: (e) => {
							e.key === "Enter" && v(), e.key === "Escape" && p(!1);
						},
						onMouseDown: (e) => e.stopPropagation(),
						placeholder: d("dashboard.group.titlePlaceholder"),
						className: "dc:flex-1 dc:min-w-0 dc:text-sm dc:font-semibold text-dc-text bg-transparent dc:border-none dc:outline-hidden"
					}) : /* @__PURE__ */ Y("h3", {
						className: "dc:font-semibold dc:text-sm text-dc-text dc:truncate",
						children: e.title
					})]
				}), b]
			}),
			!_ && !f && n && /* @__PURE__ */ X("div", {
				className: "dc-portlet-group-floating-toolbar dc:flex dc:items-center dc:px-1 dc:py-0.5 dc:rounded-sm dc:border border-dc-border bg-dc-surface",
				children: [x, b]
			}),
			/* @__PURE__ */ Y("div", {
				className: "dc-portlet-group-body dc:flex dc:flex-1 dc:min-h-0 dc:p-1",
				style: {
					flexDirection: g ? "row" : "column",
					gap: "var(--dc-group-gap, 4px)"
				},
				children: e.cells.map((i, a) => /* @__PURE__ */ Y("div", {
					className: "dc-portlet-group-cell dc:flex dc:min-w-0 dc:min-h-0 dc:relative",
					style: {
						flexGrow: 1,
						flexShrink: 1,
						flexBasis: 0,
						flexDirection: g ? "column" : "row",
						gap: "var(--dc-group-gap, 4px)"
					},
					children: i.portletIds.map((i) => {
						let a = t.get(i);
						return a ? /* @__PURE__ */ X("div", {
							className: "dc:flex-1 dc:min-w-0 dc:min-h-0 dc:relative",
							draggable: n,
							onDragStart: (t) => {
								t.stopPropagation(), s(e.id, i, t);
							},
							onDragEnd: (e) => {
								e.stopPropagation(), c();
							},
							children: [r(a, {}), l?.(i)]
						}, i) : null;
					})
				}, `${e.id}-cell-${a}`))
			})
		]
	});
}
//#endregion
//#region src/client/hooks/dashboard/groupGeometry.ts
function Pr(e, t) {
	let n = t.length;
	if (n === 0) return [];
	if (e <= n) return t.map(() => 1);
	let r = t.reduce((e, t) => e + Math.max(t, 0), 0) || n, i = t.map((t) => Math.max(t, 0) / r * e), a = i.map((e) => Math.max(1, Math.floor(e))), o = e - a.reduce((e, t) => e + t, 0), s = i.map((e, t) => ({
		index: t,
		fraction: e - Math.floor(e)
	})).sort((e, t) => t.fraction - e.fraction), c = 0;
	for (; o > 0;) a[s[c % n].index] += 1, --o, c += 1;
	for (; o < 0;) {
		let e = a.map((e, t) => ({
			value: e,
			index: t
		})).filter((e) => e.value > 1).sort((e, t) => t.value - e.value);
		if (e.length === 0) break;
		--a[e[0].index], o += 1;
	}
	return a;
}
function Fr(e, t, n, r, i) {
	let a = e.cells.filter((e) => e.portletIds.length > 0);
	if (a.length === 0) return [];
	let o = a.map(() => 1), s = e.direction === "row", c = Pr(s ? r : i, o), l = [], u = s ? t : n;
	return a.forEach((e, a) => {
		let o = c[a], d = Pr(s ? i : r, e.portletIds.map(() => 1)), f = s ? n : t;
		e.portletIds.forEach((e, t) => {
			let n = d[t];
			l.push(s ? {
				portletId: e,
				x: u,
				y: f,
				w: o,
				h: n
			} : {
				portletId: e,
				x: f,
				y: u,
				w: n,
				h: o
			}), f += n;
		}), u += o;
	}), l;
}
//#endregion
//#region src/client/hooks/dashboard/layoutUtils.ts
var Ir = () => `row-${Date.now()}`, Lr = (e, t, n) => n && t < e ? e - 1 : e, $ = (e, t) => {
	let n = e.length;
	if (n === 0) return [];
	let { cols: r, minW: i } = t, a = i * n;
	if (a > r) {
		let t = Math.floor(r / n), i = r % n;
		return e.map((e, n) => ({
			...e,
			w: Math.max(1, t + +(n < i))
		}));
	}
	let o = r - a, s = Math.floor(o / n), c = o % n;
	return e.map((e, t) => ({
		...e,
		w: i + s + +(t < c)
	}));
}, Rr = (e, t) => {
	if (e.length === 0) return [];
	let { cols: n, minW: r } = t, i = e.map((e) => ({
		...e,
		w: Math.max(r, e.w)
	})), a = i.reduce((e, t) => e + t.w, 0);
	if (Math.abs(a - n) < 1e-6) return i[i.length - 1].w += n - a, i;
	if (a < n) {
		let e = Math.round(n - a), t = 0;
		for (; e > 0;) i[t % i.length].w += 1, --e, t += 1;
		return i;
	}
	let o = Math.round(a - n);
	for (let e = i.length - 1; e >= 0 && o > 0; --e) {
		let t = i[e], n = Math.max(0, t.w - r);
		if (n === 0) continue;
		let a = Math.min(n, o);
		t.w -= a, o -= a;
	}
	return i;
}, zr = (e, t) => {
	if (e.length === 0) return [];
	let n = [...e].sort((e, t) => e.y === t.y ? e.x - t.x : e.y - t.y), r = /* @__PURE__ */ new Map();
	return n.forEach((e) => {
		let t = r.get(e.y) ?? [];
		t.push(e), r.set(e.y, t);
	}), Array.from(r.entries()).sort(([e], [t]) => e - t).map(([e, n]) => {
		let r = Math.max(t.minH, ...n.map((e) => e.h));
		return {
			id: `row-${e}`,
			h: r,
			columns: $(n.map((e) => ({
				portletId: e.id,
				w: 0
			})), t)
		};
	});
}, Br = (e, t, n, r = []) => {
	let i = new Set(t.map((e) => e.id)), a = new Set(r.map((e) => e.id)), o = (e) => e.groupId ? a.has(e.groupId) : !!e.portletId && i.has(e.portletId);
	return e.map((e) => ({
		...e,
		h: Math.max(n.minH, e.h),
		columns: Rr(e.columns.filter(o), n)
	})).filter((e) => e.columns.length > 0);
}, Vr = (e, t, n = []) => {
	let r = new Map(t.map((e) => [e.id, e])), i = new Map(n.map((e) => [e.id, e])), a = 0, o = [];
	e.forEach((e) => {
		let t = Math.max(1, Math.round(e.h)), n = 0;
		e.columns.forEach((e) => {
			let s = Math.round(n), c = Math.max(1, Math.round(n + e.w) - s);
			if (e.groupId) {
				let l = i.get(e.groupId);
				l && Fr(l, s, a, c, t).forEach((e) => {
					let t = r.get(e.portletId);
					t && o.push({
						...t,
						x: e.x,
						y: e.y,
						w: e.w,
						h: e.h
					});
				}), n += e.w;
				return;
			}
			let l = e.portletId ? r.get(e.portletId) : void 0;
			l && (o.push({
				...l,
				x: s,
				y: a,
				w: c,
				h: t
			}), n += e.w);
		}), a += t;
	});
	let s = new Set(o.map((e) => e.id));
	return t.forEach((e) => {
		s.has(e.id) || o.push(e);
	}), o;
}, Hr = 0, Ur = () => `group-${Date.now()}-${Hr += 1}`, Wr = (e) => e.cells.flatMap((e) => e.portletIds), Gr = (e) => ({
	...e,
	cells: e.cells.map((e) => ({
		...e,
		portletIds: [...e.portletIds]
	}))
}), Kr = (e) => e.map((e) => ({
	...e,
	columns: e.columns.map((e) => ({ ...e }))
}));
function qr(e, t, n) {
	let r = new Map(t.map((e) => [e.id, e]));
	for (let t = 0; t < e.length; t += 1) {
		let { columns: i } = e[t];
		for (let e = 0; e < i.length; e += 1) {
			let a = i[e];
			if (a.portletId === n) return {
				rowIndex: t,
				colIndex: e
			};
			if (!a.groupId) continue;
			let o = r.get(a.groupId);
			if (o) for (let r = 0; r < o.cells.length; r += 1) {
				let i = o.cells[r].portletIds.indexOf(n);
				if (i !== -1) return {
					rowIndex: t,
					colIndex: e,
					groupId: o.id,
					cellIndex: r,
					stackIndex: i
				};
			}
		}
	}
	return null;
}
function Jr(e, t) {
	let n = null;
	return {
		groups: e.flatMap((e) => {
			if (!Wr(e).includes(t)) return [e];
			n = e.id;
			let r = e.cells.map((e) => ({
				...e,
				portletIds: e.portletIds.filter((e) => e !== t)
			})).filter((e) => e.portletIds.length > 0);
			return r.length > 0 ? [{
				...e,
				cells: r
			}] : [];
		}),
		groupId: n
	};
}
function Yr(e, t, n, r) {
	let i = new Set(t.map((e) => e.id)), a = /* @__PURE__ */ new Map(), o = [];
	for (let t of e ?? []) {
		let e = t.cells.map((e) => ({ portletIds: e.portletIds.filter((e) => i.has(e) && !a.has(e)) })).filter((e) => e.portletIds.length > 0);
		e.length !== 0 && (e.forEach((e) => e.portletIds.forEach((e) => a.set(e, t.id))), o.push({
			...t,
			cells: e
		}));
	}
	if (o.length === 0) return {
		groups: [],
		rows: n
	};
	let s = new Map(o.map((e) => [e.id, e])), c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set();
	for (let e of n) for (let t of e.columns) {
		if (!t.groupId) continue;
		let e = s.get(t.groupId);
		!e || c.has(e.id) || (c.add(e.id), e.cells.length === 1 && e.cells[0].portletIds.length === 1 && l.add(e.id));
	}
	let u = o.filter((e) => c.has(e.id) && !l.has(e.id)), d = new Set(u.map((e) => e.id)), f = new Set(u.flatMap(Wr)), p = /* @__PURE__ */ new Set(), m = n.map((e) => ({
		...e,
		columns: e.columns.flatMap((e) => {
			if (e.groupId) {
				let t = s.get(e.groupId);
				return !t || p.has(t.id) ? [] : (p.add(t.id), l.has(t.id) ? [{
					portletId: t.cells[0].portletIds[0],
					w: e.w
				}] : d.has(t.id) ? [{
					groupId: t.id,
					w: e.w
				}] : []);
			}
			return !e.portletId || f.has(e.portletId) ? [] : [{
				portletId: e.portletId,
				w: e.w
			}];
		})
	})), h = new Set(m.flatMap((e) => e.columns.map((e) => e.portletId).filter(Boolean))), g = o.filter((e) => !c.has(e.id)).flatMap(Wr).filter((e) => !h.has(e));
	return g.length > 0 && (m = [...m, {
		id: `row-orphans-${Date.now()}`,
		h: Math.max(r.minH, 3),
		columns: $(g.map((e) => ({
			portletId: e,
			w: 0
		})), r)
	}]), m = m.map((e) => ({
		...e,
		columns: Rr(e.columns, r)
	})).filter((e) => e.columns.length > 0), {
		groups: u,
		rows: m
	};
}
var Xr = {
	left: "row",
	right: "row",
	top: "column",
	bottom: "column"
}, Zr = (e) => e === "left" || e === "top";
function Qr(e, t, n) {
	let r = qr(e.rows, e.groups, t);
	return r ? r.groupId ? {
		rows: e.rows,
		groups: Jr(e.groups, t).groups
	} : {
		rows: e.rows.map((e, t) => {
			if (t !== r.rowIndex) return e;
			let i = e.columns.filter((e, t) => t !== r.colIndex);
			return {
				...e,
				columns: $(i, n)
			};
		}).filter((e) => e.columns.length > 0),
		groups: e.groups
	} : e;
}
function $r(e, t, n, r, i) {
	if (t === n || !qr(e.rows, e.groups, n)) return null;
	let a = Qr({
		rows: Kr(e.rows),
		groups: e.groups.map(Gr)
	}, t, i), o = qr(a.rows, a.groups, n);
	if (!o) return null;
	let s = Xr[r], c = Zr(r);
	if (!o.groupId) {
		let e = {
			id: Ur(),
			direction: s,
			cells: (c ? [t, n] : [n, t]).map((e) => ({ portletIds: [e] }))
		};
		return {
			rows: a.rows.map((t, n) => n === o.rowIndex ? {
				...t,
				columns: t.columns.map((t, n) => n === o.colIndex ? {
					groupId: e.id,
					w: t.w
				} : t)
			} : t),
			groups: [...a.groups, e]
		};
	}
	let l = a.groups.map((e) => {
		if (e.id !== o.groupId) return e;
		let n = e.cells.map((e) => ({
			...e,
			portletIds: [...e.portletIds]
		}));
		if (s === e.direction) {
			let e = c ? o.cellIndex : o.cellIndex + 1;
			n.splice(e, 0, { portletIds: [t] });
		} else n[o.cellIndex].portletIds.splice(c ? o.stackIndex : o.stackIndex + 1, 0, t);
		return {
			...e,
			cells: n
		};
	});
	return {
		rows: a.rows,
		groups: l
	};
}
function ei(e, t, n) {
	let r = e.groups.find((e) => e.id === t);
	if (!r) return e;
	let i = Wr(r);
	return {
		rows: e.rows.map((e) => {
			if (!e.columns.some((e) => e.groupId === t)) return e;
			let r = e.columns.flatMap((e) => e.groupId === t ? i.map((e) => ({
				portletId: e,
				w: 0
			})) : [e]);
			return {
				...e,
				columns: $(r, n)
			};
		}),
		groups: e.groups.filter((e) => e.id !== t)
	};
}
function ti(e, t, n) {
	let r = e.groups.find((e) => e.id === t);
	return r ? {
		state: {
			rows: e.rows.map((e) => {
				if (!e.columns.some((e) => e.groupId === t)) return e;
				let r = e.columns.filter((e) => e.groupId !== t);
				return {
					...e,
					columns: $(r, n)
				};
			}).filter((e) => e.columns.length > 0),
			groups: e.groups.filter((e) => e.id !== t)
		},
		removedPortletIds: Wr(r)
	} : {
		state: e,
		removedPortletIds: []
	};
}
//#endregion
//#region src/client/hooks/dashboard/useGridLayoutEngine.ts
function ni({ storeApi: e }) {
	return { hasLayoutActuallyChanged: U((t) => {
		let { isInitialized: n, lastKnownLayout: r } = e.getState();
		if (!n || r.length === 0) return !1;
		for (let e of t) {
			let t = r.find((t) => t.i === e.i);
			if (t && (t.x !== e.x || t.y !== e.y || t.w !== e.w || t.h !== e.h)) return !0;
		}
		return !1;
	}, [e]) };
}
//#endregion
//#region src/client/hooks/dashboard/useRowLayoutEngine.ts
function ri({ layoutMode: e, draftRows: t, draftGroups: n, config: r, gridSettings: i, configRef: a, onConfigChangeRef: o, onSaveRef: s, setDraftRows: c, setDraftGroups: l, setThumbnailDirty: u }) {
	let d = G(() => {
		if (e !== "rows") return {
			rows: [],
			groups: []
		};
		let a = !!(t ?? r.rows), o = t ?? r.rows ?? zr(r.portlets, i), s = Yr(a ? n ?? r.groups : void 0, r.portlets, o, i);
		return {
			groups: s.groups,
			rows: Br(s.rows, r.portlets, i, s.groups)
		};
	}, [
		e,
		t,
		n,
		r.rows,
		r.groups,
		r.portlets,
		i
	]), f = d.rows, p = d.groups, m = U(async (e, t = !0) => {
		if (!o.current) return;
		let n = e.portlets ?? a.current.portlets, r = Yr(e.groups ?? a.current.groups, n, e.rows, i), d = Br(r.rows, n, i, r.groups), f = Vr(d, n, r.groups), p = {
			...a.current,
			layoutMode: "rows",
			rows: d,
			groups: r.groups,
			portlets: f
		};
		if (c(null), l(null), o.current(p), t && u(!0), t && s.current) try {
			await s.current(p);
		} catch (e) {
			console.error("Auto-save failed after row layout change:", e);
		}
	}, [
		a,
		i,
		o,
		s,
		l,
		c,
		u
	]);
	return {
		resolvedRows: f,
		resolvedGroups: p,
		updateLayout: m,
		updateRowLayout: U(async (e, t = !0, n) => m({
			rows: e,
			portlets: n
		}, t), [m])
	};
}
//#endregion
//#region src/client/hooks/dashboard/useDashboardController.ts
function ii({ allowedModes: e, canChangeLayoutMode: t, isResponsiveEditable: n, layoutMode: r, resolvedRows: i, resolvedGroups: a, gridSettings: o, thumbnailConfig: s, dashboardRef: c, storeApi: l, storeActions: u, configRef: d, onConfigChangeRef: f, onSaveRef: m, onSaveThumbnailRef: h, updateLayout: g, updateRowLayout: _, portletComponentRefs: v, onPortletRefresh: y }) {
	let b = K(r);
	b.current = r;
	let x = K(t);
	x.current = t;
	let S = K(i);
	S.current = i;
	let C = K(a);
	C.current = a;
	let w = U(async (e, t) => {
		if (f.current && (f.current(e), u.setThumbnailDirty(!0), m.current)) try {
			await m.current(e);
		} catch (e) {
			console.error(t, e);
		}
	}, [
		f,
		m,
		u
	]), T = U(() => {
		_e(() => {
			u.setEditMode(!0);
		});
	}, [u]), E = U(() => {
		_e(() => {
			u.setEditMode(!1);
		}), l.getState().thumbnailDirty && s?.enabled && c && setTimeout(async () => {
			let e = await p(c, s);
			if (e && h.current) try {
				let t = await h.current(e);
				t && f.current && f.current({
					...d.current,
					thumbnailUrl: t,
					thumbnailData: void 0
				});
			} catch (e) {
				console.error("Failed to save thumbnail:", e);
			}
			u.setThumbnailDirty(!1);
		}, 500);
	}, [
		d,
		c,
		f,
		h,
		l,
		u,
		s
	]), D = U(() => {
		n && (l.getState().isEditMode ? E() : _e(() => {
			u.setEditMode(!0);
		}));
	}, [
		E,
		n,
		u,
		l
	]), O = U((e) => {
		let t = l.getState().selectedFilterId;
		l.getState().setSelectedFilterId(e === t ? null : e);
	}, [l]), k = U(() => {
		u.openPortletModal(null);
	}, [u]), A = U((e) => {
		u.openPortletModal(e);
	}, [u]), j = U(() => {
		u.openTextModal(null);
	}, [u]), M = U((e) => {
		u.openTextModal(e);
	}, [u]), N = U((e) => {
		u.openFilterConfigModal(e);
	}, [u]), P = U(async (t) => {
		if (!f.current || t === b.current || !x.current || !e.includes(t)) return;
		let n = d.current, r = !!(n.rows && n.rows.length > 0), i = r ? n.rows : zr(n.portlets, o), a = Yr(r ? n.groups : void 0, n.portlets, i, o), s = Br(a.rows, n.portlets, o, a.groups), c = Vr(s, n.portlets, a.groups);
		await w({
			...n,
			layoutMode: t,
			rows: s,
			groups: a.groups,
			portlets: c
		}, "Auto-save failed after layout mode switch:");
	}, [
		e,
		d,
		o,
		f,
		w
	]), ee = U(async (e) => {
		if (!f.current) return null;
		let t = d.current, n = [...t.portlets], r = !1, i = null, a = l.getState(), s = a.editingPortlet || a.editingTextPortlet;
		if (s) {
			let t = n.findIndex((e) => e.id === s.id);
			t !== -1 && (n[t] = e);
		} else {
			r = !0;
			let a = {
				...e,
				id: `portlet-${Date.now()}`,
				x: 0,
				y: 0
			};
			i = a.id;
			let o = 0;
			t.portlets.forEach((e) => {
				e.y + e.h > o && (o = e.y + e.h);
			}), a.y = o, n.push(a);
		}
		if (b.current === "rows") {
			let e = S.current, a = e.length > 0 ? e.map((e) => ({
				...e,
				columns: e.columns.map((e) => ({ ...e }))
			})) : Br(t.rows ?? zr(t.portlets, o), n, o);
			await _(r && i ? [...a, {
				id: Ir(),
				h: Math.max(o.minH, 3),
				columns: $([{
					portletId: i,
					w: 0
				}], o)
			}] : a, !0, n);
		} else await w({
			...t,
			portlets: n
		}, "Auto-save failed:");
		return u.closePortletModal(), u.closeTextModal(), i;
	}, [
		d,
		o,
		f,
		S,
		w,
		u,
		l,
		_
	]), te = U(async (e) => {
		if (!f.current) return;
		let t = d.current, n = t.portlets.filter((t) => t.id !== e);
		if (b.current === "rows") {
			let t = Jr(C.current, e).groups;
			await g({
				rows: S.current.map((t) => ({
					...t,
					columns: t.columns.filter((t) => t.portletId !== e)
				})).filter((e) => e.columns.length > 0).map((e) => ({
					...e,
					columns: $(e.columns, o)
				})),
				groups: t,
				portlets: n
			});
		} else await w({
			...t,
			portlets: n
		}, "Auto-save failed:");
	}, [
		d,
		o,
		f,
		C,
		S,
		w,
		g
	]), F = U(async (e) => {
		u.openDeleteConfirm(e);
	}, [u]), I = U(async (e, t, n) => {
		if (b.current !== "rows") return;
		let r = $r({
			rows: S.current,
			groups: C.current
		}, e, t, n, o);
		r && await g({
			rows: r.rows,
			groups: r.groups
		});
	}, [
		o,
		C,
		S,
		g
	]), ne = U(async (e) => {
		if (b.current !== "rows") return;
		let t = ei({
			rows: S.current,
			groups: C.current
		}, e, o);
		await g({
			rows: t.rows,
			groups: t.groups
		});
	}, [
		o,
		C,
		S,
		g
	]), L = U((e) => {
		u.openDeleteGroupConfirm(e);
	}, [u]), R = U(async (e) => {
		if (b.current !== "rows") return;
		let { state: t, removedPortletIds: n } = ti({
			rows: S.current,
			groups: C.current
		}, e, o), r = new Set(n), i = d.current.portlets.filter((e) => !r.has(e.id));
		await g({
			rows: t.rows,
			groups: t.groups,
			portlets: i
		});
	}, [
		d,
		o,
		C,
		S,
		g
	]), z = U(async (e, t) => {
		if (b.current !== "rows") return;
		let n = t.trim(), r = C.current.map((t) => t.id === e ? {
			...t,
			title: n || void 0
		} : t);
		await g({
			rows: S.current,
			groups: r
		});
	}, [
		C,
		S,
		g
	]);
	return {
		enterEditMode: T,
		exitEditMode: E,
		toggleEditMode: D,
		selectFilter: O,
		openAddPortlet: k,
		openEditPortlet: A,
		openAddText: j,
		openEditText: M,
		openFilterConfig: N,
		handleLayoutModeChange: P,
		savePortlet: ee,
		deletePortlet: F,
		confirmDelete: U(async () => {
			let { deleteConfirmPortletId: e, deleteConfirmGroupId: t } = l.getState();
			if (t) await R(t);
			else if (e) await te(e);
			else return;
			u.closeDeleteConfirm();
		}, [
			R,
			te,
			u,
			l
		]),
		duplicatePortlet: U(async (e) => {
			if (!f.current) return;
			let t = d.current, n = t.portlets.find((t) => t.id === e);
			if (!n) return;
			let r = {
				...n,
				id: `portlet-${Date.now()}`,
				title: `${n.title} Duplicated`,
				x: 0,
				y: 0
			}, i = 0;
			t.portlets.forEach((e) => {
				e.y + e.h > i && (i = e.y + e.h);
			}), r.y = i;
			let a = [...t.portlets, r];
			if (b.current === "rows") {
				let t = S.current.map((e) => ({
					...e,
					columns: e.columns.map((e) => ({ ...e }))
				})), n = qr(t, C.current, e);
				if (n?.groupId) return await g({
					rows: t,
					groups: C.current.map((e) => {
						if (e.id !== n.groupId) return e;
						let t = e.cells.map((e, t) => t === n.cellIndex ? {
							...e,
							portletIds: [
								...e.portletIds.slice(0, n.stackIndex + 1),
								r.id,
								...e.portletIds.slice(n.stackIndex + 1)
							]
						} : e);
						return {
							...e,
							cells: t
						};
					}),
					portlets: a
				}), r.id;
				await _([...t, {
					id: Ir(),
					h: Math.max(o.minH, 3),
					columns: $([{
						portletId: r.id,
						w: 0
					}], o)
				}], !0, a);
			} else await w({
				...t,
				portlets: a
			}, "Auto-save failed:");
			return r.id;
		}, [
			d,
			o,
			f,
			C,
			S,
			w,
			g,
			_
		]),
		refreshPortlet: U((e, t) => {
			let n = v?.current?.[e];
			n?.refresh && n.refresh(t), y?.(e, t);
		}, [y, v]),
		toggleFilterForPortlet: U(async (e, t) => {
			if (!f.current) return;
			let n = d.current, r = n.portlets.map((n) => {
				if (n.id === e) {
					let e = n.dashboardFilterMapping || [], r = $e(e, t);
					return {
						...n,
						dashboardFilterMapping: r ? e.filter((e) => typeof e == "string" ? e !== t : e.filterId !== t) : [...e, t]
					};
				}
				return n;
			});
			await w({
				...n,
				portlets: r
			}, "Auto-save failed:");
		}, [
			d,
			f,
			w
		]),
		selectAllForFilter: U(async (e) => {
			if (!f.current) return;
			let t = d.current, n = t.portlets.map((t) => {
				let n = t.dashboardFilterMapping || [];
				return $e(n, e) ? t : {
					...t,
					dashboardFilterMapping: [...n, e]
				};
			});
			await w({
				...t,
				portlets: n
			}, "Auto-save failed:");
		}, [
			d,
			f,
			w
		]),
		saveFilterConfig: U(async (e) => {
			let t = l.getState().filterConfigPortlet;
			if (!f.current || !t) return;
			let n = d.current, r = n.portlets.map((n) => n.id === t.id ? {
				...n,
				dashboardFilterMapping: e
			} : n);
			await w({
				...n,
				portlets: r
			}, "Auto-save failed:");
		}, [
			d,
			f,
			w,
			l
		]),
		handlePaletteChange: U(async (e) => {
			f.current && await w({
				...d.current,
				colorPalette: e
			}, "Auto-save failed:");
		}, [
			d,
			f,
			w
		]),
		snapPortletIntoGroup: I,
		ungroupGroup: ne,
		deleteGroup: L,
		renameGroup: z
	};
}
//#endregion
//#region src/client/hooks/useDashboardHook.ts
var ai = (e) => ({
	isEditMode: e.isEditMode,
	selectedFilterId: e.selectedFilterId,
	isPortletModalOpen: e.isPortletModalOpen,
	editingPortlet: e.editingPortlet,
	isTextModalOpen: e.isTextModalOpen,
	editingTextPortlet: e.editingTextPortlet,
	isFilterConfigModalOpen: e.isFilterConfigModalOpen,
	filterConfigPortlet: e.filterConfigPortlet,
	deleteConfirmPortletId: e.deleteConfirmPortletId,
	deleteConfirmGroupId: e.deleteConfirmGroupId,
	draftRows: e.draftRows,
	draftGroups: e.draftGroups,
	isDraggingPortlet: e.isDraggingPortlet,
	lastKnownLayout: e.lastKnownLayout,
	isInitialized: e.isInitialized
}), oi = (e) => ({
	setEditMode: e.setEditMode,
	toggleEditMode: e.toggleEditMode,
	setSelectedFilterId: e.setSelectedFilterId,
	exitFilterSelectionMode: e.exitFilterSelectionMode,
	openPortletModal: e.openPortletModal,
	closePortletModal: e.closePortletModal,
	openTextModal: e.openTextModal,
	closeTextModal: e.closeTextModal,
	openFilterConfigModal: e.openFilterConfigModal,
	closeFilterConfigModal: e.closeFilterConfigModal,
	openDeleteConfirm: e.openDeleteConfirm,
	openDeleteGroupConfirm: e.openDeleteGroupConfirm,
	closeDeleteConfirm: e.closeDeleteConfirm,
	setDraftRows: e.setDraftRows,
	setDraftGroups: e.setDraftGroups,
	setIsDraggingPortlet: e.setIsDraggingPortlet,
	setLastKnownLayout: e.setLastKnownLayout,
	setIsInitialized: e.setIsInitialized,
	setDragState: e.setDragState,
	clearDragState: e.clearDragState,
	setDebugData: e.setDebugData,
	clearDebugData: e.clearDebugData,
	setThumbnailDirty: e.setThumbnailDirty
});
function si(e) {
	let { config: n, editable: r = !1, dashboardFilters: i, gridSettings: a, allowedModes: o, isResponsiveEditable: s = !0, onConfigChange: l, onSave: u, onSaveThumbnail: d, portletComponentRefs: f, onPortletRefresh: p, dashboardRef: m } = e, h = Nn(t(ai)), g = Nn(t(oi)), _ = Pn(), { features: v } = c(), y = v.thumbnail, b = K(n);
	b.current = n;
	let x = K(l);
	x.current = l;
	let S = K(u);
	S.current = u;
	let C = K(d);
	C.current = d;
	let w = G(() => o && o.length > 0 ? o : ["rows", "grid"], [o]), T = G(() => {
		let e = w.includes("rows") ? "rows" : w[0] ?? "grid", t = n.layoutMode ?? "grid";
		return w.includes(t) ? t : e;
	}, [n.layoutMode, w]), E = G(() => r && h.isEditMode && s && !h.selectedFilterId, [
		r,
		h.isEditMode,
		s,
		h.selectedFilterId
	]), D = G(() => !((n.groups?.length ?? 0) > 0) || T !== "rows" ? w : w.filter((e) => e !== "grid"), [
		w,
		n.groups,
		T
	]), O = G(() => r && h.isEditMode && s && !h.selectedFilterId && D.length > 1, [
		r,
		h.isEditMode,
		s,
		h.selectedFilterId,
		D.length
	]), k = G(() => !h.selectedFilterId || !i ? null : i.find((e) => e.id === h.selectedFilterId) ?? null, [h.selectedFilterId, i]), { resolvedRows: A, resolvedGroups: j, updateLayout: M, updateRowLayout: N } = ri({
		layoutMode: T,
		draftRows: h.draftRows,
		draftGroups: h.draftGroups,
		config: n,
		gridSettings: a,
		configRef: b,
		onConfigChangeRef: x,
		onSaveRef: S,
		setDraftRows: g.setDraftRows,
		setDraftGroups: g.setDraftGroups,
		setThumbnailDirty: g.setThumbnailDirty
	}), { hasLayoutActuallyChanged: P } = ni({ storeApi: _ }), { enterEditMode: ee, exitEditMode: te, toggleEditMode: F, selectFilter: I, openAddPortlet: ne, openEditPortlet: L, openAddText: R, openEditText: z, openFilterConfig: B, handleLayoutModeChange: re, savePortlet: ie, deletePortlet: ae, confirmDelete: oe, duplicatePortlet: se, refreshPortlet: ce, toggleFilterForPortlet: le, selectAllForFilter: ue, saveFilterConfig: de, handlePaletteChange: fe, snapPortletIntoGroup: pe, ungroupGroup: me, deleteGroup: V, renameGroup: he } = ii({
		allowedModes: w,
		canChangeLayoutMode: O,
		isResponsiveEditable: s,
		layoutMode: T,
		resolvedRows: A,
		resolvedGroups: j,
		gridSettings: a,
		thumbnailConfig: y,
		dashboardRef: m,
		storeApi: _,
		storeActions: g,
		configRef: b,
		onConfigChangeRef: x,
		onSaveRef: S,
		onSaveThumbnailRef: C,
		updateLayout: M,
		updateRowLayout: N,
		portletComponentRefs: f,
		onPortletRefresh: p
	}), ge = G(() => ({
		enterEditMode: ee,
		exitEditMode: te,
		toggleEditMode: F,
		selectFilter: I,
		exitFilterSelectionMode: g.exitFilterSelectionMode,
		openAddPortlet: ne,
		openEditPortlet: L,
		closePortletModal: g.closePortletModal,
		openAddText: R,
		openEditText: z,
		closeTextModal: g.closeTextModal,
		openFilterConfig: B,
		closeFilterConfig: g.closeFilterConfigModal,
		setDraftRows: g.setDraftRows,
		setDraftGroups: g.setDraftGroups,
		setIsDraggingPortlet: g.setIsDraggingPortlet,
		setLastKnownLayout: g.setLastKnownLayout,
		setIsInitialized: g.setIsInitialized,
		setDragState: g.setDragState,
		clearDragState: g.clearDragState,
		hasLayoutActuallyChanged: P,
		updateLayout: M,
		updateRowLayout: N,
		handleLayoutModeChange: re,
		savePortlet: ie,
		deletePortlet: ae,
		duplicatePortlet: se,
		refreshPortlet: ce,
		toggleFilterForPortlet: le,
		selectAllForFilter: ue,
		saveFilterConfig: de,
		handlePaletteChange: fe,
		snapPortletIntoGroup: pe,
		ungroupGroup: me,
		deleteGroup: V,
		renameGroup: he,
		openDeleteConfirm: g.openDeleteConfirm,
		openDeleteGroupConfirm: g.openDeleteGroupConfirm,
		closeDeleteConfirm: g.closeDeleteConfirm,
		confirmDelete: oe,
		setDebugData: g.setDebugData,
		clearDebugData: g.clearDebugData
	}), [
		ee,
		te,
		F,
		I,
		g,
		ne,
		L,
		R,
		z,
		B,
		P,
		M,
		N,
		re,
		ie,
		ae,
		se,
		ce,
		le,
		ue,
		de,
		fe,
		pe,
		me,
		V,
		he,
		oe
	]);
	return {
		...h,
		canEdit: E,
		canChangeLayoutMode: O,
		selectedFilter: k,
		resolvedRows: A,
		resolvedGroups: j,
		layoutMode: T,
		allowedModes: w,
		selectableModes: D,
		actions: ge
	};
}
//#endregion
//#region src/client/components/dashboard/dashboardGridUtils.tsx
var ci = {
	cols: 12,
	rowHeight: 80,
	minW: 2,
	minH: 1
}, li = (e) => ({
	cols: e.grid?.cols ?? ci.cols,
	rowHeight: e.grid?.rowHeight ?? ci.rowHeight,
	minW: e.grid?.minW ?? ci.minW,
	minH: e.grid?.minH ?? ci.minH
});
function ui(e) {
	if (!e) return null;
	let t = null, n = e.parentElement;
	for (; n;) {
		let e = window.getComputedStyle(n), r = e.overflowY, i = e.overflowX;
		if ((r === "auto" || r === "scroll" || i === "auto" || i === "scroll") && (n.scrollHeight > n.clientHeight || n.scrollWidth > n.clientWidth)) return n;
		if (!t && (r === "auto" || r === "scroll") && (t = n), n === document.body) break;
		n = n.parentElement;
	}
	return t;
}
function di({ className: e, style: t }) {
	return /* @__PURE__ */ X("svg", {
		className: e,
		style: t,
		viewBox: "0 0 24 24",
		fill: "currentColor",
		xmlns: "http://www.w3.org/2000/svg",
		children: [/* @__PURE__ */ Y("text", {
			x: "1",
			y: "20",
			fontSize: "20",
			fontWeight: "700",
			fontFamily: "serif",
			children: "T"
		}), /* @__PURE__ */ Y("text", {
			x: "14",
			y: "20",
			fontSize: "13",
			fontWeight: "600",
			fontFamily: "serif",
			children: "t"
		})]
	});
}
//#endregion
//#region src/client/components/dashboard/DashboardContext.tsx
var fi = V(null);
function pi() {
	let e = ve(fi);
	if (!e) throw Error("useDashboardContext must be used within a DashboardProvider");
	return e;
}
//#endregion
//#region src/client/components/dashboard/DashboardCoordinator.tsx
var mi = v("refresh"), hi = v("edit"), gi = v("delete"), _i = v("copy"), vi = v("filter");
function yi({ config: e, editable: t = !1, dashboardFilters: n, loadingComponent: r, onConfigChange: i, onPortletRefresh: a, onSave: o, onSaveThumbnail: l, colorPalette: u, schema: d, onDashboardFiltersChange: f, dashboardModes: p, hideToolbar: m, children: h }) {
	let { features: g } = c(), { containerRef: _, containerWidth: v, displayMode: y, scaleFactor: b, isEditable: x, designWidth: S } = j(), C = p && p.length > 0 ? p : ["rows", "grid"], w = G(() => li(e), [e]), [T, E] = q(null), D = K(null), O = K(null), k = K(null), A = K(null), M = U((e) => {
		if (D.current = e, _(e), e) {
			let t = ui(e);
			E(t), O.current = t;
		}
	}, [_]), N = y === "desktop" ? v : S, P = K({}), ee = K({}), te = K(null), F = K(null), I = K(null), [ne, L] = q(null), [R, z] = q(null), { isEditMode: B, selectedFilterId: re, isPortletModalOpen: ie, editingPortlet: ae, isTextModalOpen: oe, editingTextPortlet: se, isFilterConfigModalOpen: ce, filterConfigPortlet: le, deleteConfirmPortletId: ue, deleteConfirmGroupId: de, draftRows: fe, isDraggingPortlet: pe, isInitialized: me, canEdit: V, canChangeLayoutMode: he, selectedFilter: ge, resolvedRows: H, resolvedGroups: _e, layoutMode: ve, selectableModes: ye, actions: J } = si({
		config: e,
		editable: t,
		dashboardFilters: n,
		gridSettings: w,
		allowedModes: C,
		isResponsiveEditable: x,
		onConfigChange: i,
		onSave: o,
		onSaveThumbnail: l,
		gridWidth: N,
		portletComponentRefs: ee,
		onPortletRefresh: a,
		dashboardRef: A
	}), X = K(J);
	X.current = J;
	let be = K(V);
	be.current = V;
	let Ce = K(H);
	Ce.current = H;
	let we = K(_e);
	we.current = _e, W(() => {
		te.current = fe;
	}, [fe]), W(() => {
		(!B || !x) && re && J.exitFilterSelectionMode();
	}, [
		B,
		x,
		re,
		J
	]), W(() => {
		!x && B && J.exitEditMode();
	}, [
		x,
		B,
		J
	]);
	let Te = qn(O, {
		threshold: 20,
		debounceMs: 150,
		container: T
	}), Ee = Jn(k, {
		threshold: 80,
		debounceMs: 100,
		containerRef: O,
		container: T
	});
	Yn(O, {
		enabled: ve === "rows" && pe,
		edgeThreshold: 80,
		maxScrollSpeed: 15
	}), W(() => {
		if (me) return;
		let t = setTimeout(() => {
			J.setIsInitialized(!0);
			let t = e.portlets.map((e) => ({
				i: e.id,
				x: e.x,
				y: e.y,
				w: e.w,
				h: e.h
			}));
			J.setLastKnownLayout(t);
		}, 200);
		return () => clearTimeout(t);
	}, [
		me,
		e.portlets,
		J
	]);
	let De = ie || oe || ce || !!ue;
	W(() => {
		let e = (e) => {
			if (!(!re || De)) {
				if (e.key === "Escape") J.exitFilterSelectionMode();
				else if (e.key === "Enter") {
					if (e.target?.closest("button, a, input, select, textarea, [contenteditable=\"true\"]")) return;
					J.exitFilterSelectionMode();
				}
			}
		};
		return window.addEventListener("keydown", e), () => {
			window.removeEventListener("keydown", e);
		};
	}, [
		re,
		De,
		J
	]);
	let Oe = U((e) => {}, []), ke = U(async (n, r, a, s, c, l) => {
		if (!t || !B || !o || !me) return;
		let u = [...n];
		if (!J.hasLayoutActuallyChanged(u)) return;
		let d = e.portlets.map((e) => {
			let t = u.find((t) => t.i === e.id);
			return t ? {
				...e,
				x: t.x,
				y: t.y,
				w: t.w,
				h: t.h
			} : e;
		}), f = {
			...e,
			portlets: d,
			layouts: {
				...e.layouts,
				lg: u
			}
		};
		J.setLastKnownLayout(u), i?.(f);
		try {
			await o(f);
		} catch (e) {
			console.error("Auto-save failed after drag:", e);
		}
	}, [
		e,
		t,
		B,
		i,
		o,
		me,
		J
	]), Ae = U(async (n, r, a, s, c, l) => {
		if (!t || !B || !i || !me) return;
		let u = [...n];
		if (!J.hasLayoutActuallyChanged(u)) return;
		let d = e.portlets.map((e) => {
			let t = u.find((t) => t.i === e.id);
			return t ? {
				...e,
				x: t.x,
				y: t.y,
				w: t.w,
				h: t.h
			} : e;
		}), f = {
			...e,
			portlets: d,
			layouts: {
				...e.layouts,
				lg: u
			}
		};
		if (J.setLastKnownLayout(u), i(f), o) try {
			await o(f);
		} catch (e) {
			console.error("Auto-save failed after resize:", e);
		}
	}, [
		e,
		t,
		B,
		i,
		o,
		me,
		J
	]), je = (e, t) => t ? e : Math.round(e * 2) / 2, Me = U((e, t) => {
		if (!V) return;
		t.preventDefault();
		let n = t.clientY, r = H.map((e) => ({
			...e,
			columns: e.columns.map((e) => ({ ...e }))
		}));
		F.current = null;
		let i = (t) => {
			let i = t.clientY - n, a = je(i / w.rowHeight, t.shiftKey), o = r.map((t, n) => n === e ? {
				...t,
				h: Math.max(w.minH, t.h + a)
			} : t);
			F.current = o, J.setDraftRows(o);
		}, a = () => {
			document.removeEventListener("mousemove", i), document.removeEventListener("mouseup", a);
			let e = F.current ?? r;
			F.current = null, J.updateRowLayout(e);
		};
		document.addEventListener("mousemove", i), document.addEventListener("mouseup", a);
	}, [
		V,
		w,
		H,
		J
	]), Ne = U((e, t, n) => {
		if (!V) return;
		n.preventDefault();
		let r = n.clientX, i = H.map((e) => ({
			...e,
			columns: e.columns.map((e) => ({ ...e }))
		})), a = i[e], o = a?.columns[t], s = a?.columns[t + 1];
		if (!a || !o || !s) return;
		let c = (N - (a.columns.length - 1) * 16) / w.cols;
		F.current = null;
		let l = (n) => {
			let a = n.clientX - r, l = je(a / c, n.shiftKey);
			if (l === 0) {
				F.current = i, J.setDraftRows(i);
				return;
			}
			let u = o.w + l, d = s.w - l;
			if (u < w.minW) {
				let e = w.minW - u;
				u = w.minW, d -= e;
			}
			if (d < w.minW) {
				let e = w.minW - d;
				d = w.minW, u -= e;
			}
			if (u < w.minW || d < w.minW) return;
			let f = i.map((n, r) => {
				if (r !== e) return n;
				let i = n.columns.map((e, n) => n === t ? {
					...e,
					w: u
				} : n === t + 1 ? {
					...e,
					w: d
				} : e);
				return {
					...n,
					columns: Rr(i, w)
				};
			});
			F.current = f, J.setDraftRows(f);
		}, u = () => {
			document.removeEventListener("mousemove", l), document.removeEventListener("mouseup", u);
			let e = F.current ?? i;
			F.current = null, J.updateRowLayout(e);
		};
		document.addEventListener("mousemove", l), document.addEventListener("mouseup", u);
	}, [
		V,
		w,
		N,
		H,
		J
	]), Pe = U((e, t, n, r, i) => {
		r.dataTransfer.effectAllowed = "move", r.dataTransfer.setData("text/plain", i ?? n), be.current && (I.current = i ? {
			kind: "group",
			rowIndex: e,
			colIndex: t,
			groupId: i
		} : {
			kind: "column",
			rowIndex: e,
			colIndex: t,
			portletId: n
		}, L(i ? null : n), z(i ?? null), X.current.setIsDraggingPortlet(!0));
	}, []), Fe = U((e, t, n) => {
		if (n.dataTransfer.effectAllowed = "move", n.dataTransfer.setData("text/plain", t), !be.current) return;
		let r = qr(Ce.current, we.current, t);
		I.current = {
			kind: "groupChild",
			rowIndex: r?.rowIndex ?? 0,
			colIndex: r?.colIndex ?? 0,
			groupId: e,
			portletId: t
		}, L(t), X.current.setIsDraggingPortlet(!0);
	}, []), Z = U(() => {
		I.current = null, L(null), z(null), X.current.setIsDraggingPortlet(!1);
	}, []), Ie = U((e, t) => {
		let n = I.current;
		if (!n) return;
		Z();
		let r = H.map((e) => ({
			...e,
			columns: e.columns.map((e) => ({ ...e }))
		})), i = n.rowIndex, a = r[i];
		if (!a) return;
		if (n.kind === "groupChild") {
			let { groups: i } = Jr(_e, n.portletId), a = r[e];
			if (!a) return;
			a.columns.splice(t ?? a.columns.length, 0, {
				portletId: n.portletId,
				w: 0
			}), a.columns = $(a.columns, w), J.updateLayout({
				rows: r,
				groups: i
			});
			return;
		}
		let [o] = a.columns.splice(n.colIndex, 1), s = !1;
		a.columns.length === 0 && (r.splice(i, 1), s = !0);
		let c = e;
		s && i < e && --c;
		let l = r[c];
		if (!l) return;
		let u = t ?? l.columns.length;
		!s && i === c && t !== null && t > n.colIndex && --u, l.columns.splice(u, 0, o), (i !== c || s) && (s || (r[i] = {
			...r[i],
			columns: $(r[i].columns, w)
		}), r[c] = {
			...r[c],
			columns: $(r[c].columns, w)
		}), J.updateRowLayout(r);
	}, [
		w,
		_e,
		H,
		J,
		Z
	]), Le = U((e) => {
		let t = I.current;
		if (!t) return;
		Z();
		let n = H.map((e) => ({
			...e,
			columns: e.columns.map((e) => ({ ...e }))
		})), r = n[t.rowIndex];
		if (!r) return;
		let i = Math.max(r.h || 0, w.minH, 1);
		if (t.kind === "groupChild") {
			let { groups: r } = Jr(_e, t.portletId);
			n.splice(e, 0, {
				id: Ir(),
				h: i,
				columns: $([{
					portletId: t.portletId,
					w: 0
				}], w)
			}), J.updateLayout({
				rows: n,
				groups: r
			});
			return;
		}
		let [a] = r.columns.splice(t.colIndex, 1), o = r.columns.length === 0;
		o ? n.splice(t.rowIndex, 1) : r.columns = $(r.columns, w);
		let s = Lr(e, t.rowIndex, o), c = {
			id: Ir(),
			h: i,
			columns: $([a], w)
		};
		n.splice(s, 0, c), J.updateRowLayout(n);
	}, [
		w,
		_e,
		H,
		J,
		Z
	]), Re = U((e, t) => {
		let n = I.current;
		if (n) {
			if (n.kind === "group" || n.portletId === e) return Z();
			Z(), X.current.snapPortletIntoGroup(n.portletId, e, t);
		}
	}, [Z]), ze = U((e, t) => {
		X.current.refreshPortlet(e, t);
	}, []), Be = U(async (e) => {
		let t = await J.savePortlet(e);
		J.closePortletModal(), t && setTimeout(() => {
			let e = () => {
				let e = P.current[t];
				return e ||= document.querySelector(`[data-portlet-id="${t}"]`), e ? (e.scrollIntoView({
					behavior: "smooth",
					block: "center",
					inline: "nearest"
				}), !0) : !1;
			};
			e() || setTimeout(() => {
				e() || setTimeout(() => {
					e();
				}, 300);
			}, 200);
		}, 200);
	}, [J]), Ve = U(async (e) => {
		await X.current.deletePortlet(e);
	}, []), He = U(async (e) => {
		let t = await X.current.duplicatePortlet(e);
		t && setTimeout(() => {
			let e = () => {
				let e = P.current[t];
				return e ||= document.querySelector(`[data-portlet-id="${t}"]`), e ? (e.scrollIntoView({
					behavior: "smooth",
					block: "center",
					inline: "nearest"
				}), !0) : !1;
			};
			e() || setTimeout(() => {
				e() || setTimeout(() => {
					e();
				}, 300);
			}, 200);
		}, 200);
	}, []), Ue = U(() => {
		J.openAddPortlet();
	}, [J]), We = U(() => {
		J.openAddText();
	}, [J]), Ge = U((e) => {
		let t = Q(e);
		t.analysisConfig.charts[t.analysisConfig.analysisType]?.chartType === "markdown" ? X.current.openEditText(e) : X.current.openEditPortlet(e);
	}, []), Ke = U(async (e) => {
		await J.handlePaletteChange(e);
	}, [J]), qe = U((e) => {
		X.current.openFilterConfig(e);
	}, []), Je = U(async (e) => {
		await J.saveFilterConfig(e);
	}, [J]), Ye = U((e, t) => {
		P.current[e] = t;
	}, []), Xe = U((e, t) => {
		ee.current[e] = t;
	}, []), Ze = G(() => ({
		RefreshIcon: mi,
		EditIcon: hi,
		DeleteIcon: gi,
		CopyIcon: _i,
		FilterIcon: vi
	}), []), Qe = U(async (e, t) => {
		await X.current.toggleFilterForPortlet(e, t);
	}, []), $e = U((e) => {
		J.selectFilter(e);
	}, [J]), et = U(async (e) => {
		await J.selectAllForFilter(e);
	}, [J]), tt = G(() => ({
		onToggleFilter: Qe,
		onRefresh: ze,
		onDuplicate: He,
		onEdit: Ge,
		onDelete: Ve,
		onOpenFilterConfig: qe
	}), [
		Qe,
		ze,
		He,
		Ge,
		Ve,
		qe
	]), nt = U((i, a, o, s = "standalone") => /* @__PURE__ */ Y(yr, {
		portlet: i,
		variant: s,
		editable: t,
		layoutMode: ve,
		dashboardFilters: n,
		configEagerLoad: e.eagerLoad,
		loadingComponent: r,
		colorPalette: u,
		containerProps: a,
		headerProps: o,
		callbacks: tt,
		setPortletRef: Ye,
		setPortletComponentRef: Xe,
		icons: Ze
	}), [
		t,
		ve,
		n,
		e.eagerLoad,
		r,
		u,
		tt,
		Ye,
		Xe,
		Ze
	]), rt = e.portlets.map((e) => ({
		i: e.id,
		x: e.x,
		y: e.y,
		w: e.w,
		h: e.h,
		minW: Math.min(w.minW, e.w),
		minH: Math.min(w.minH, e.h),
		isDraggable: V,
		isResizable: V,
		...V ? { resizeHandles: [
			"s",
			"w",
			"e",
			"n",
			"se",
			"sw",
			"ne",
			"nw"
		] } : {}
	})), it = U(() => /* @__PURE__ */ Y(xe, {
		className: "layout",
		layout: rt,
		onLayoutChange: Oe,
		onDragStop: ke,
		onResizeStop: Ae,
		width: N,
		gridConfig: {
			cols: w.cols,
			rowHeight: w.rowHeight,
			margin: [16, 16],
			containerPadding: [0, 0]
		},
		dragConfig: {
			enabled: V,
			handle: ".portlet-drag-handle"
		},
		resizeConfig: {
			enabled: V,
			handles: [
				"s",
				"w",
				"e",
				"n",
				"se",
				"sw",
				"ne",
				"nw"
			],
			handleComponent: (e, t) => /* @__PURE__ */ Y("div", {
				ref: t,
				className: `react-resizable-handle react-resizable-handle-${e}`,
				style: { opacity: 0 }
			})
		},
		compactor: Se,
		children: e.portlets.filter((e) => e && e.id).map((e) => /* @__PURE__ */ Y("div", { children: nt(e) }, e.id))
	}), [
		rt,
		Oe,
		ke,
		Ae,
		N,
		w,
		V,
		e.portlets,
		nt
	]), at = G(() => new Map(e.portlets.map((e) => [e.id, e])), [e.portlets]), ot = U((e, t, n) => /* @__PURE__ */ Y(Nr, {
		group: e,
		portlets: at,
		canEdit: V,
		frameless: n,
		renderChild: (e, t) => nt(e, t, void 0, "groupChild"),
		onRename: (e, t) => {
			X.current.renameGroup(e, t);
		},
		onUngroup: (e) => {
			X.current.ungroupGroup(e);
		},
		onDelete: (e) => X.current.deleteGroup(e),
		onChildDragStart: Fe,
		onChildDragEnd: Z,
		renderSnapBands: t
	}), [
		V,
		Fe,
		Z,
		at,
		nt
	]), st = U(() => /* @__PURE__ */ Y(Or, {
		rows: H,
		portlets: e.portlets,
		groups: _e,
		gridSettings: w,
		gridWidth: N,
		canEdit: V,
		isDragging: pe,
		onRowResize: Me,
		onColumnResize: Ne,
		onPortletDragStart: Pe,
		onPortletDragEnd: Z,
		onRowDrop: Ie,
		onNewRowDrop: Le,
		onSnapDrop: Re,
		draggingPortletId: ne,
		draggingGroupId: R,
		renderPortlet: nt,
		renderGroup: ot
	}), [
		H,
		_e,
		e.portlets,
		w,
		N,
		V,
		pe,
		Me,
		Ne,
		Pe,
		Z,
		Ie,
		Le,
		Re,
		ne,
		R,
		nt,
		ot
	]), ct = {
		config: e,
		editable: t,
		dashboardFilters: n,
		loadingComponent: r,
		colorPalette: u,
		schema: d,
		onSave: o,
		onConfigChange: i,
		onDashboardFiltersChange: f,
		hideToolbar: m,
		isEditMode: B,
		selectedFilterId: re,
		isPortletModalOpen: ie,
		editingPortlet: ae,
		isTextModalOpen: oe,
		editingTextPortlet: se,
		isFilterConfigModalOpen: ce,
		filterConfigPortlet: le,
		deleteConfirmPortletId: ue,
		deleteConfirmGroupId: de,
		draftRows: fe,
		isDraggingPortlet: pe,
		isInitialized: me,
		canEdit: V,
		canChangeLayoutMode: he,
		selectedFilter: ge,
		resolvedRows: H,
		resolvedGroups: _e,
		layoutMode: ve,
		allowedModes: C,
		selectableModes: ye,
		actions: J,
		displayMode: y,
		scaleFactor: b,
		designWidth: S,
		gridWidth: N,
		isResponsiveEditable: x,
		isScrolled: Te,
		isEditBarVisible: Ee,
		scrollContainer: T,
		features: g,
		editBarRef: k,
		gridContentRef: A,
		gridSettings: w,
		baseLayout: rt,
		renderPortletCard: nt,
		renderActiveLayout: U(() => ve === "rows" ? st() : it(), [
			ve,
			st,
			it
		]),
		handleAddPortlet: Ue,
		handleAddText: We,
		handlePaletteChange: Ke,
		handleFilterSelect: $e,
		handleSelectAllForFilter: et,
		handleSaveFilterConfig: Je,
		handlePortletSave: Be,
		handlePortletRefresh: ze,
		handleLayoutChange: Oe,
		handleDragStop: ke,
		handleResizeStop: Ae,
		startRowResize: Me,
		startColumnResize: Ne,
		handlePortletDragStart: Pe,
		handlePortletDragEnd: Z,
		handleRowDrop: Ie,
		handleNewRowDrop: Le
	};
	return /* @__PURE__ */ Y(fi.Provider, {
		value: ct,
		children: /* @__PURE__ */ Y(s, {
			value: T,
			children: /* @__PURE__ */ Y("div", {
				ref: M,
				className: "dashboard-grid-container dc:w-full",
				style: {
					maxWidth: "100%",
					overflow: "hidden"
				},
				children: h
			})
		})
	});
}
//#endregion
//#region src/client/components/dashboard/DashboardProvider.tsx
function bi({ children: e, ...t }) {
	return /* @__PURE__ */ Y(Mn, { children: /* @__PURE__ */ Y(yi, {
		...t,
		children: e
	}) });
}
//#endregion
//#region src/client/utils/colorPalettes.ts
var xi = [
	{
		name: "default",
		label: "Default",
		colors: [
			"#3b82f6",
			"#10b981",
			"#f59e0b",
			"#ef4444",
			"#8b5cf6",
			"#f97316",
			"#06b6d4",
			"#84cc16"
		],
		gradient: [
			"#fde725",
			"#7ad151",
			"#22a884",
			"#2a788e",
			"#414487",
			"#440154"
		]
	},
	{
		name: "ocean",
		label: "Ocean",
		colors: [
			"#1e3a8a",
			"#1e40af",
			"#2563eb",
			"#3b82f6",
			"#06b6d4",
			"#0891b2",
			"#0e7490",
			"#0f766e"
		],
		gradient: [
			"#38bdf8",
			"#0ea5e9",
			"#0284c7",
			"#0369a1",
			"#075985",
			"#0c4a6e"
		]
	},
	{
		name: "sunset",
		label: "Sunset",
		colors: [
			"#dc2626",
			"#ea580c",
			"#f59e0b",
			"#eab308",
			"#d97706",
			"#b45309",
			"#92400e",
			"#7c2d12"
		],
		gradient: [
			"#fbbf24",
			"#f59e0b",
			"#d97706",
			"#b45309",
			"#92400e",
			"#7c2d12"
		]
	},
	{
		name: "forest",
		label: "Forest",
		colors: [
			"#166534",
			"#15803d",
			"#16a34a",
			"#22c55e",
			"#4ade80",
			"#65a30d",
			"#84cc16",
			"#a3e635"
		],
		gradient: [
			"#4ade80",
			"#22c55e",
			"#16a34a",
			"#15803d",
			"#166534",
			"#14532d"
		]
	},
	{
		name: "purple",
		label: "Purple",
		colors: [
			"#581c87",
			"#7c3aed",
			"#8b5cf6",
			"#a855f7",
			"#c084fc",
			"#e879f9",
			"#f0abfc",
			"#fbbf24"
		],
		gradient: [
			"#a855f7",
			"#8b5cf6",
			"#7c3aed",
			"#6d28d9",
			"#581c87",
			"#4c1d95"
		]
	},
	{
		name: "monochrome",
		label: "Monochrome",
		colors: [
			"#1f2937",
			"#374151",
			"#4b5563",
			"#6b7280",
			"#9ca3af",
			"#d1d5db",
			"#e5e7eb",
			"#f3f4f6"
		],
		gradient: [
			"#9ca3af",
			"#6b7280",
			"#4b5563",
			"#374151",
			"#1f2937",
			"#111827"
		]
	},
	{
		name: "pastel",
		label: "Pastel",
		colors: [
			"#93c5fd",
			"#86efac",
			"#fde047",
			"#fca5a5",
			"#c4b5fd",
			"#fdba74",
			"#67e8f9",
			"#bef264"
		],
		gradient: [
			"#fed7aa",
			"#ddd6fe",
			"#fecaca",
			"#fef08a",
			"#a7f3d0",
			"#bfdbfe"
		]
	},
	{
		name: "vibrant",
		label: "Vibrant",
		colors: [
			"#0000ff",
			"#00ff00",
			"#ffff00",
			"#ff0000",
			"#ff00ff",
			"#ff8000",
			"#00ffff",
			"#8000ff"
		],
		gradient: [
			"#ffff00",
			"#80ff00",
			"#00ff80",
			"#00ffff",
			"#0080ff",
			"#4000ff"
		]
	},
	{
		name: "d3Category10",
		label: "D3 Category 10",
		colors: [
			"#1f77b4",
			"#ff7f0e",
			"#2ca02c",
			"#d62728",
			"#9467bd",
			"#8c564b",
			"#e377c2",
			"#7f7f7f",
			"#bcbd22",
			"#17becf"
		],
		gradient: [
			"#9467bd",
			"#d62728",
			"#ff7f0e",
			"#bcbd22",
			"#2ca02c",
			"#1f77b4"
		]
	},
	{
		name: "d3Tableau10",
		label: "D3 Tableau 10",
		colors: [
			"#4e79a7",
			"#f28e2c",
			"#e15759",
			"#76b7b2",
			"#59a14f",
			"#edc949",
			"#af7aa1",
			"#ff9da7",
			"#9c755f",
			"#bab0ab"
		],
		gradient: [
			"#e15759",
			"#f28e2c",
			"#edc949",
			"#59a14f",
			"#76b7b2",
			"#4e79a7"
		]
	},
	{
		name: "colorBrewerSet1",
		label: "ColorBrewer Set 1",
		colors: [
			"#e41a1c",
			"#377eb8",
			"#4daf4a",
			"#984ea3",
			"#ff7f00",
			"#ffff33",
			"#a65628",
			"#f781bf",
			"#999999"
		],
		gradient: [
			"#984ea3",
			"#e41a1c",
			"#ff7f00",
			"#ffff33",
			"#4daf4a",
			"#377eb8"
		]
	},
	{
		name: "colorBrewerSet2",
		label: "ColorBrewer Set 2",
		colors: [
			"#66c2a5",
			"#fc8d62",
			"#8da0cb",
			"#e78ac3",
			"#a6d854",
			"#ffd92f",
			"#e5c494",
			"#b3b3b3"
		],
		gradient: [
			"#e78ac3",
			"#fc8d62",
			"#ffd92f",
			"#a6d854",
			"#66c2a5",
			"#8da0cb"
		]
	},
	{
		name: "colorBrewerDark2",
		label: "ColorBrewer Dark 2",
		colors: [
			"#1b9e77",
			"#d95f02",
			"#7570b3",
			"#e7298a",
			"#66a61e",
			"#e6ab02",
			"#a6761d",
			"#666666"
		],
		gradient: [
			"#e7298a",
			"#d95f02",
			"#e6ab02",
			"#66a61e",
			"#1b9e77",
			"#7570b3"
		]
	},
	{
		name: "colorBrewerPaired",
		label: "ColorBrewer Paired",
		colors: [
			"#a6cee3",
			"#1f78b4",
			"#b2df8a",
			"#33a02c",
			"#fb9a99",
			"#e31a1c",
			"#fdbf6f",
			"#ff7f00",
			"#cab2d6",
			"#6a3d9a",
			"#ffff99",
			"#b15928"
		],
		gradient: [
			"#6a3d9a",
			"#e31a1c",
			"#ff7f00",
			"#ffff99",
			"#33a02c",
			"#1f78b4"
		]
	},
	{
		name: "viridis",
		label: "Viridis",
		colors: [
			"#440154",
			"#482677",
			"#3f4a8a",
			"#31678e",
			"#26838f",
			"#1f9d8a",
			"#6cce5a",
			"#b6de2b"
		],
		gradient: [
			"#b6de2b",
			"#6cce5a",
			"#1f9d8a",
			"#26838f",
			"#31678e",
			"#3f4a8a",
			"#482677",
			"#440154"
		]
	},
	{
		name: "plasma",
		label: "Plasma",
		colors: [
			"#0c0786",
			"#5c01a6",
			"#900da4",
			"#bf3984",
			"#e16462",
			"#f99b45",
			"#fcce25",
			"#f0f921"
		],
		gradient: [
			"#f0f921",
			"#fcce25",
			"#f99b45",
			"#e16462",
			"#bf3984",
			"#900da4",
			"#5c01a6",
			"#0c0786"
		]
	},
	{
		name: "inferno",
		label: "Inferno",
		colors: [
			"#000003",
			"#1f0c47",
			"#550f6d",
			"#88226a",
			"#a83655",
			"#cc4f39",
			"#e6862a",
			"#fec228"
		],
		gradient: [
			"#fec228",
			"#e6862a",
			"#cc4f39",
			"#a83655",
			"#88226a",
			"#550f6d",
			"#1f0c47",
			"#000003"
		]
	},
	{
		name: "magma",
		label: "Magma",
		colors: [
			"#000003",
			"#140b34",
			"#3b0f6f",
			"#641a80",
			"#8b2981",
			"#b63679",
			"#de4968",
			"#fd9f6c"
		],
		gradient: [
			"#fd9f6c",
			"#de4968",
			"#b63679",
			"#8b2981",
			"#641a80",
			"#3b0f6f",
			"#140b34",
			"#000003"
		]
	},
	{
		name: "cividis",
		label: "Cividis",
		colors: [
			"#00204c",
			"#003f5c",
			"#2c4b7a",
			"#51576f",
			"#7f6874",
			"#a8786e",
			"#d2906d",
			"#ffb570"
		],
		gradient: [
			"#ffb570",
			"#d2906d",
			"#a8786e",
			"#7f6874",
			"#51576f",
			"#2c4b7a",
			"#003f5c",
			"#00204c"
		]
	},
	{
		name: "turbo",
		label: "Turbo",
		colors: [
			"#30123b",
			"#4454c4",
			"#1dd3c0",
			"#42f465",
			"#b2df22",
			"#faba39",
			"#f66c19",
			"#c42e02"
		],
		gradient: [
			"#c42e02",
			"#f66c19",
			"#faba39",
			"#b2df22",
			"#42f465",
			"#1dd3c0",
			"#4454c4",
			"#30123b"
		]
	},
	{
		name: "warm",
		label: "Warm",
		colors: [
			"#8b0000",
			"#b22222",
			"#cd5c5c",
			"#ff6347",
			"#ff8c00",
			"#ffa500",
			"#ffd700",
			"#ffff00"
		],
		gradient: [
			"#ffd700",
			"#ffa500",
			"#ff8c00",
			"#ff6347",
			"#b22222",
			"#8b0000"
		]
	},
	{
		name: "cool",
		label: "Cool",
		colors: [
			"#000080",
			"#0000ff",
			"#4169e1",
			"#00bfff",
			"#00ffff",
			"#40e0d0",
			"#20b2aa",
			"#008b8b"
		],
		gradient: [
			"#40e0d0",
			"#00ffff",
			"#00bfff",
			"#4169e1",
			"#0000ff",
			"#000080"
		]
	},
	{
		name: "earth",
		label: "Earth",
		colors: [
			"#8b4513",
			"#a0522d",
			"#cd853f",
			"#daa520",
			"#d2691e",
			"#bc8f8f",
			"#f4a460",
			"#deb887"
		],
		gradient: [
			"#f4a460",
			"#d2691e",
			"#daa520",
			"#cd853f",
			"#a0522d",
			"#8b4513"
		]
	},
	{
		name: "autumn",
		label: "Autumn",
		colors: [
			"#8b0000",
			"#a0522d",
			"#cd853f",
			"#daa520",
			"#ff8c00",
			"#ff4500",
			"#dc143c",
			"#b22222"
		],
		gradient: [
			"#ff4500",
			"#ff8c00",
			"#daa520",
			"#cd853f",
			"#a0522d",
			"#8b0000"
		]
	},
	{
		name: "spring",
		label: "Spring",
		colors: [
			"#32cd32",
			"#98fb98",
			"#90ee90",
			"#ffb6c1",
			"#ffc0cb",
			"#ffffe0",
			"#f0fff0",
			"#e0ffff"
		],
		gradient: [
			"#e0ffff",
			"#ffc0cb",
			"#ffb6c1",
			"#ffffe0",
			"#98fb98",
			"#32cd32"
		]
	},
	{
		name: "winter",
		label: "Winter",
		colors: [
			"#191970",
			"#4682b4",
			"#87ceeb",
			"#b0e0e6",
			"#e0ffff",
			"#f0f8ff",
			"#c0c0c0",
			"#708090"
		],
		gradient: [
			"#f0f8ff",
			"#e0ffff",
			"#b0e0e6",
			"#87ceeb",
			"#4682b4",
			"#191970"
		]
	},
	{
		name: "neon",
		label: "Neon",
		colors: [
			"#ff0080",
			"#00ff80",
			"#8000ff",
			"#ff8000",
			"#0080ff",
			"#80ff00",
			"#ff0040",
			"#40ff00"
		],
		gradient: [
			"#ff0080",
			"#ff8000",
			"#80ff00",
			"#00ff80",
			"#0080ff",
			"#8000ff"
		]
	},
	{
		name: "retro",
		label: "Retro",
		colors: [
			"#ff69b4",
			"#ffd700",
			"#32cd32",
			"#00ced1",
			"#ff6347",
			"#9370db",
			"#ffa500",
			"#20b2aa"
		],
		gradient: [
			"#00ced1",
			"#32cd32",
			"#ffd700",
			"#ff6347",
			"#ff69b4",
			"#9370db"
		]
	},
	{
		name: "corporate",
		label: "Corporate",
		colors: [
			"#003366",
			"#0066cc",
			"#336699",
			"#6699cc",
			"#4d4d4d",
			"#808080",
			"#b3b3b3",
			"#cccccc"
		],
		gradient: [
			"#b3b3b3",
			"#808080",
			"#6699cc",
			"#336699",
			"#0066cc",
			"#003366"
		]
	},
	{
		name: "material",
		label: "Material Design",
		colors: [
			"#f44336",
			"#e91e63",
			"#9c27b0",
			"#673ab7",
			"#3f51b5",
			"#2196f3",
			"#03a9f4",
			"#00bcd4"
		],
		gradient: [
			"#e91e63",
			"#03a9f4",
			"#00bcd4",
			"#2196f3",
			"#3f51b5",
			"#673ab7"
		]
	}
];
function Si(e) {
	return e && xi.find((t) => t.name === e) || xi[0];
}
//#endregion
//#region src/client/components/FloatingEditToolbar.tsx
var Ci = v("edit"), wi = v("check"), Ti = v("segment"), Ei = v("table"), Di = v("add");
function Oi({ className: e }) {
	return /* @__PURE__ */ X("svg", {
		className: e,
		viewBox: "0 0 24 24",
		fill: "currentColor",
		xmlns: "http://www.w3.org/2000/svg",
		children: [/* @__PURE__ */ Y("text", {
			x: "1",
			y: "20",
			fontSize: "20",
			fontWeight: "700",
			fontFamily: "serif",
			children: "T"
		}), /* @__PURE__ */ Y("text", {
			x: "14",
			y: "20",
			fontSize: "13",
			fontWeight: "600",
			fontFamily: "serif",
			children: "t"
		})]
	});
}
var ki = v("swatch");
function Ai({ isEditBarVisible: e, position: t, isEditMode: n, onEditModeToggle: r, layoutMode: i, onLayoutModeChange: a, allowedModes: o, canChangeLayoutMode: s, currentPalette: c, onPaletteChange: l, onAddPortlet: u, onAddText: d }) {
	let [f, p] = q(!1), m = K(null);
	W(() => {
		if (!f) return;
		let e = (e) => {
			m.current && !m.current.contains(e.target) && p(!1);
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [f]), W(() => {
		e && p(!1);
	}, [e]);
	let h = t === "left" ? "dc:left-4" : "dc:right-4", g = e, _ = /* @__PURE__ */ X("div", {
		className: `dc:fixed dc:top-1/2 dc:-translate-y-1/2 dc:z-50 dc:flex dc:flex-col dc:gap-1.5 dc:p-2
        bg-dc-surface-tertiary dc:border border-dc-border dc:rounded-lg
        dc:transition-all dc:duration-300 dc:ease-in-out
        ${h} ${t === "left" ? g ? "dc:-translate-x-16 dc:opacity-0 dc:pointer-events-none" : "dc:translate-x-0 dc:opacity-100" : g ? "dc:translate-x-16 dc:opacity-0 dc:pointer-events-none" : "dc:translate-x-0 dc:opacity-100"}`,
		style: { boxShadow: "var(--dc-shadow-lg)" },
		children: [
			/* @__PURE__ */ Y(ji, {
				icon: n ? wi : Ci,
				tooltip: n ? "Finish Editing" : "Edit Dashboard",
				isActive: n,
				onClick: r
			}),
			n && o.length > 1 && /* @__PURE__ */ X(J, { children: [
				/* @__PURE__ */ Y("div", { className: "dc:w-full dc:h-px bg-dc-border dc:my-0.5" }),
				/* @__PURE__ */ Y(ji, {
					icon: Ti,
					tooltip: "Grid Layout",
					isActive: i === "grid",
					disabled: !s,
					onClick: () => a("grid")
				}),
				/* @__PURE__ */ Y(ji, {
					icon: Ei,
					tooltip: "Rows Layout",
					isActive: i === "rows",
					disabled: !s,
					onClick: () => a("rows")
				})
			] }),
			n && /* @__PURE__ */ X(J, { children: [/* @__PURE__ */ Y("div", { className: "dc:w-full dc:h-px bg-dc-border dc:my-0.5" }), /* @__PURE__ */ X("div", {
				ref: m,
				className: "dc:relative",
				children: [/* @__PURE__ */ Y(ji, {
					icon: ki,
					tooltip: "Color Palette",
					isActive: f,
					onClick: () => p(!f)
				}), f && /* @__PURE__ */ Y(Mi, {
					position: t,
					currentPalette: c,
					onPaletteChange: (e) => {
						l(e), p(!1);
					}
				})]
			})] }),
			n && /* @__PURE__ */ X(J, { children: [
				/* @__PURE__ */ Y("div", { className: "dc:w-full dc:h-px bg-dc-border dc:my-0.5" }),
				d && /* @__PURE__ */ Y(ji, {
					icon: Oi,
					tooltip: "Add Text",
					onClick: d
				}),
				/* @__PURE__ */ Y(ji, {
					icon: Di,
					tooltip: "Add Portlet",
					onClick: u
				})
			] })
		]
	});
	return typeof document > "u" ? null : be(_, document.body);
}
function ji({ icon: e, tooltip: t, isActive: n, disabled: r, onClick: i }) {
	return /* @__PURE__ */ Y("button", {
		type: "button",
		onClick: i,
		disabled: r,
		title: t,
		className: `dc:p-2 dc:rounded-md dc:transition-colors focus:outline-hidden dc:focus:ring-2 focus:ring-dc-accent
        ${r ? "dc:opacity-50 dc:cursor-not-allowed bg-dc-surface-secondary text-dc-text-muted" : n ? "bg-dc-accent-bg text-dc-accent" : "bg-dc-surface text-dc-text-secondary hover:bg-dc-surface-hover"}`,
		children: /* @__PURE__ */ Y(e, { className: "dc:w-5 dc:h-5" })
	});
}
function Mi({ position: e, currentPalette: t, onPaletteChange: n }) {
	return /* @__PURE__ */ Y("div", {
		className: `dc:absolute dc:top-0 ${e === "left" ? "dc:left-full dc:ml-2" : "dc:right-full dc:mr-2"} dc:w-52 bg-dc-surface dc:border border-dc-border dc:rounded-md dc:z-50 dc:max-h-72 dc:overflow-y-auto`,
		style: { boxShadow: "var(--dc-shadow-lg)" },
		children: /* @__PURE__ */ Y("div", {
			className: "dc:py-1",
			children: xi.slice().sort((e, t) => e.label.localeCompare(t.label)).map((e) => /* @__PURE__ */ Y("button", {
				type: "button",
				onClick: () => n(e.name),
				className: `dc:w-full dc:px-3 dc:py-2 dc:text-left dc:text-sm hover:bg-dc-surface-hover dc:transition-colors ${e.name === t ? "bg-dc-surface-secondary text-dc-primary" : "text-dc-text-secondary"}`,
				children: /* @__PURE__ */ X("div", {
					className: "dc:flex dc:items-center dc:gap-2",
					children: [
						/* @__PURE__ */ Y("div", {
							className: "dc:flex dc:gap-0.5 dc:shrink-0",
							children: e.colors.slice(0, 4).map((e, t) => /* @__PURE__ */ Y("div", {
								className: "dc:w-2.5 dc:h-2.5 rounded-xs dc:border border-dc-border",
								style: { backgroundColor: e }
							}, t))
						}),
						/* @__PURE__ */ Y("span", {
							className: "dc:text-xs dc:font-medium dc:truncate text-dc-text",
							children: e.label
						}),
						e.name === t && /* @__PURE__ */ Y("div", { className: "dc:ml-auto dc:w-1.5 dc:h-1.5 dc:rounded-full dc:shrink-0 bg-dc-primary" })
					]
				})
			}, e.name))
		})
	});
}
//#endregion
//#region src/client/components/ColorPaletteSelector.tsx
var Ni = v("chevronDown");
function Pi({ currentPalette: e = "default", onPaletteChange: t, className: n = "" }) {
	let [r, i] = q(!1), a = K(null), o = Si(e);
	W(() => {
		function e(e) {
			a.current && !a.current.contains(e.target) && i(!1);
		}
		if (r) return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [r]);
	let s = (e) => {
		t(e), i(!1);
	};
	return /* @__PURE__ */ X("div", {
		className: `dc:relative ${n}`,
		ref: a,
		children: [/* @__PURE__ */ X("button", {
			type: "button",
			onClick: () => i(!r),
			className: "dc:inline-flex dc:items-center dc:gap-2 dc:px-3 dc:py-1.5 bg-dc-surface dc:border border-dc-border dc:rounded-md shadow-xs dc:text-sm dc:font-medium text-dc-text-secondary hover:bg-dc-surface-hover focus:outline-hidden dc:focus:ring-2 dc:focus:ring-offset-2 focus:ring-dc-accent",
			children: [
				/* @__PURE__ */ X("div", {
					className: "dc:hidden dc:md:flex dc:items-center dc:gap-1.5",
					children: [
						/* @__PURE__ */ Y("div", {
							className: "dc:flex dc:gap-0.5",
							children: o.colors.slice(0, 4).map((e, t) => /* @__PURE__ */ Y("div", {
								className: "dc:w-3 dc:h-3 rounded-xs dc:border border-dc-border",
								style: { backgroundColor: e },
								title: `Series Color ${t + 1}`
							}, t))
						}),
						/* @__PURE__ */ Y("span", {
							className: "dc:text-xs text-dc-text-secondary",
							children: "|"
						}),
						/* @__PURE__ */ Y("div", {
							className: "dc:flex dc:gap-0.5",
							children: o.gradient.slice(0, 3).map((e, t) => /* @__PURE__ */ Y("div", {
								className: "dc:w-2 dc:h-3 dc:border-r dc:first:rounded-l-sm dc:last:rounded-r-sm dc:last:border-r-0",
								style: {
									backgroundColor: e,
									borderColor: "var(--dc-border)"
								},
								title: `Gradient Color ${t + 1}`
							}, t))
						})
					]
				}),
				/* @__PURE__ */ Y("span", { children: o.label }),
				/* @__PURE__ */ Y(Ni, { className: `dc:w-4 dc:h-4 dc:transition-transform ${r ? "dc:rotate-180" : ""}` })
			]
		}), r && /* @__PURE__ */ Y("div", {
			className: "dc:absolute dc:top-full dc:left-0 dc:mt-1 dc:w-72 dc:md:w-80 dc:lg:w-96 bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg dc:z-50 dc:max-h-80 dc:overflow-y-auto",
			children: /* @__PURE__ */ Y("div", {
				className: "dc:py-1",
				children: xi.slice().sort((e, t) => e.label.localeCompare(t.label)).map((t) => /* @__PURE__ */ Y("button", {
					type: "button",
					onClick: () => s(t.name),
					className: `dc:w-full dc:px-3 dc:py-2 dc:text-left dc:text-sm hover:bg-dc-surface-hover focus:outline-hidden focus:bg-dc-surface-hover ${t.name === e ? "bg-dc-surface-secondary" : "text-dc-text-secondary"}`,
					style: t.name === e ? { color: "var(--dc-primary)" } : void 0,
					children: /* @__PURE__ */ X("div", {
						className: "dc:flex dc:items-center dc:gap-3",
						children: [
							/* @__PURE__ */ X("div", {
								className: "dc:hidden dc:md:flex dc:items-center dc:gap-2",
								children: [
									/* @__PURE__ */ Y("div", {
										className: "dc:flex dc:gap-0.5",
										children: t.colors.slice(0, 6).map((e, t) => /* @__PURE__ */ Y("div", {
											className: "dc:w-3 dc:h-3 rounded-xs dc:border border-dc-border",
											style: { backgroundColor: e }
										}, `series-${t}`))
									}),
									/* @__PURE__ */ Y("div", { className: "dc:w-px dc:h-4 bg-dc-border" }),
									/* @__PURE__ */ Y("div", {
										className: "dc:flex",
										children: t.gradient.map((e, t) => /* @__PURE__ */ Y("div", {
											className: "dc:w-2 dc:h-4 dc:first:rounded-l-sm dc:last:rounded-r-sm",
											style: { backgroundColor: e }
										}, `gradient-${t}`))
									})
								]
							}),
							/* @__PURE__ */ Y("span", {
								className: "dc:font-medium",
								children: t.label
							}),
							t.name === e && /* @__PURE__ */ Y("div", {
								className: "dc:ml-auto",
								children: /* @__PURE__ */ Y("div", {
									className: "dc:w-2 dc:h-2 dc:rounded-full",
									style: { backgroundColor: "var(--dc-primary)" }
								})
							})
						]
					})
				}, t.name))
			})
		})]
	});
}
//#endregion
//#region src/client/components/dashboard/LayoutModeToggle.tsx
var Fi = v("segment"), Ii = v("table");
function Li({ active: e, disabled: t, onClick: n, icon: r, label: i }) {
	return /* @__PURE__ */ X("button", {
		onClick: n,
		disabled: t,
		className: `dc:inline-flex dc:items-center dc:gap-2 dc:whitespace-nowrap dc:px-3 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors dc:border-b-2 ${e ? "bg-dc-accent-bg text-dc-accent border-b-dc-accent" : "bg-dc-surface text-dc-text-secondary hover:bg-dc-surface-hover border-b-transparent"} ${t ? "dc:cursor-not-allowed dc:opacity-50" : ""}`,
		children: [r, i]
	});
}
function Ri({ layoutMode: e, canChangeLayoutMode: t, onLayoutModeChange: n }) {
	let { t: r } = R();
	return /* @__PURE__ */ X("div", {
		className: "dc:inline-flex dc:rounded-md dc:border border-dc-border dc:overflow-hidden dc:whitespace-nowrap",
		children: [/* @__PURE__ */ Y(Li, {
			active: e === "grid",
			disabled: !t,
			onClick: () => n("grid"),
			icon: /* @__PURE__ */ Y(Fi, { className: "dc:w-4 dc:h-4 dc:shrink-0" }),
			label: r("dashboard.grid")
		}), /* @__PURE__ */ Y(Li, {
			active: e === "rows",
			disabled: !t,
			onClick: () => n("rows"),
			icon: /* @__PURE__ */ Y(Ii, { className: "dc:w-4 dc:h-4 dc:shrink-0" }),
			label: r("dashboard.rows")
		})]
	});
}
//#endregion
//#region src/client/components/dashboard/DashboardEditBar.tsx
var zi = v("edit"), Bi = v("check"), Vi = v("add"), Hi = v("desktop");
function Ui({ isEditMode: e, isResponsiveEditable: t, onToggle: n }) {
	let { t: r } = R();
	return /* @__PURE__ */ X("button", {
		onClick: () => t && n(),
		disabled: !t,
		className: `dc:inline-flex dc:items-center dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:rounded-md dc:transition-colors focus:outline-hidden dc:focus:ring-2 dc:focus:ring-offset-2 ${t ? e ? "bg-dc-surface-secondary dc:border border-dc-border hover:bg-dc-surface-hover" : "bg-dc-surface dc:border border-dc-border hover:bg-dc-surface-hover" : "dc:opacity-50 dc:cursor-not-allowed bg-dc-surface-secondary dc:border border-dc-border"}`,
		style: {
			color: t ? "var(--dc-primary)" : "var(--dc-text-muted)",
			borderColor: t ? e ? "var(--dc-border)" : "var(--dc-primary)" : "var(--dc-border)"
		},
		children: [Y(e ? Bi : zi, { className: "dc:w-4 dc:h-4 dc:mr-1.5" }), r(e ? "dashboard.finishEditing" : "dashboard.edit")]
	});
}
function Wi({ colorPalette: e, onPaletteChange: t, onAddText: n, onAddPortlet: r }) {
	let { t: i } = R();
	return /* @__PURE__ */ X("div", {
		className: "dc:flex dc:items-center dc:gap-3",
		children: [
			/* @__PURE__ */ Y(Pi, {
				currentPalette: e,
				onPaletteChange: t,
				className: "dc:shrink-0"
			}),
			/* @__PURE__ */ X("button", {
				onClick: n,
				className: "dc:inline-flex dc:items-center dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:border dc:rounded-md focus:outline-hidden dc:focus:ring-2 dc:focus:ring-offset-2 border-dc-border bg-dc-surface hover:bg-dc-surface-hover",
				style: {
					color: "var(--dc-text-secondary)",
					borderColor: "var(--dc-border)"
				},
				children: [/* @__PURE__ */ Y(di, { className: "dc:w-5 dc:h-5 dc:mr-2" }), i("dashboard.addText")]
			}),
			/* @__PURE__ */ X("button", {
				onClick: r,
				className: "dc:inline-flex dc:items-center dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:border dc:rounded-md focus:outline-hidden dc:focus:ring-2 dc:focus:ring-offset-2 border-dc-border bg-dc-surface hover:bg-dc-surface-hover",
				style: {
					color: "var(--dc-primary)",
					borderColor: "var(--dc-primary)"
				},
				children: [/* @__PURE__ */ Y(Vi, { className: "dc:w-5 dc:h-5 dc:mr-2" }), i("dashboard.addPortlet")]
			})
		]
	});
}
function Gi() {
	let { t: e } = R(), { isEditMode: t, isResponsiveEditable: n, layoutMode: r, selectableModes: i, canChangeLayoutMode: a, isScrolled: o, editBarRef: s, config: c, actions: l, handleAddText: u, handleAddPortlet: d, handlePaletteChange: f } = pi();
	return /* @__PURE__ */ X("div", {
		ref: s,
		className: `dc:mb-4 dc:flex dc:justify-between dc:items-center dc:sticky dc:top-0 dc:z-10 dc:px-4 dc:py-4 bg-dc-surface-tertiary dc:border border-dc-border dc:rounded-lg dc:transition-all dc:duration-200 ${o ? "dc:border-b" : ""}`,
		style: { boxShadow: o ? "var(--dc-shadow-md)" : "var(--dc-shadow-sm)" },
		children: [/* @__PURE__ */ X("div", {
			className: "dc:flex dc:items-center dc:gap-4",
			children: [
				/* @__PURE__ */ Y(Ui, {
					isEditMode: t,
					isResponsiveEditable: n,
					onToggle: l.toggleEditMode
				}),
				t && i.length > 1 && /* @__PURE__ */ Y(Ri, {
					layoutMode: r,
					canChangeLayoutMode: a,
					onLayoutModeChange: l.handleLayoutModeChange
				}),
				!n && /* @__PURE__ */ X("div", {
					className: "dc:flex dc:items-center dc:gap-2 dc:text-sm text-dc-text-secondary",
					children: [/* @__PURE__ */ Y(Hi, { className: "dc:w-4 dc:h-4" }), /* @__PURE__ */ Y("span", { children: e("dashboard.desktopRequired") })]
				}),
				t && n && /* @__PURE__ */ Y("p", {
					className: "dc:hidden dc:md:block dc:text-sm text-dc-text-secondary",
					children: e("dashboard.editModeHint")
				})
			]
		}), t && /* @__PURE__ */ Y(Wi, {
			colorPalette: c.colorPalette,
			onPaletteChange: f,
			onAddText: u,
			onAddPortlet: d
		})]
	});
}
//#endregion
//#region src/client/components/dashboard/DashboardToolbar.tsx
function Ki() {
	let { editable: e, hideToolbar: t, features: n, displayMode: r, isEditMode: i, isResponsiveEditable: a, layoutMode: o, selectableModes: s, canChangeLayoutMode: c, isEditBarVisible: l, config: u, actions: d } = pi();
	return !e || t ? null : /* @__PURE__ */ X(J, { children: [n.editToolbar !== "floating" && /* @__PURE__ */ Y(Gi, {}), n.editToolbar !== "top" && r === "desktop" && /* @__PURE__ */ Y(Ai, {
		isEditBarVisible: n.editToolbar !== "floating" && l,
		position: n.floatingToolbarPosition || "right",
		isEditMode: i,
		onEditModeToggle: () => a && d.toggleEditMode(),
		layoutMode: o,
		onLayoutModeChange: d.handleLayoutModeChange,
		allowedModes: s,
		canChangeLayoutMode: c,
		currentPalette: u.colorPalette || "default",
		onPaletteChange: d.handlePaletteChange,
		onAddPortlet: d.openAddPortlet,
		onAddText: d.openAddText
	})] });
}
//#endregion
//#region src/client/components/AnalysisBuilder/utils/idUtils.ts
function qi() {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function Ji(e) {
	let t = "", n = e;
	do
		t = String.fromCharCode(65 + n % 26) + t, n = Math.floor(n / 26) - 1;
	while (n >= 0);
	return t;
}
//#endregion
//#region src/client/components/AnalysisBuilder/utils/fieldUtils.ts
function Yi(e, t) {
	if (!t) return null;
	for (let n of t.cubes) {
		let t = n.measures.find((t) => t.name === e);
		if (t) return {
			field: t,
			cubeName: n.name,
			fieldType: "measure"
		};
		let r = n.dimensions.find((t) => t.name === e);
		if (r) return {
			field: r,
			cubeName: n.name,
			fieldType: r.type === "time" ? "timeDimension" : "dimension"
		};
	}
	return null;
}
function Xi(e, t) {
	let n = Yi(e, t);
	return n && (n.field.title || n.field.shortTitle) || e;
}
function Zi(e, t) {
	return {
		name: t.name,
		title: t.title || t.shortTitle || t.name,
		shortTitle: t.shortTitle || t.title || t.name,
		type: t.type,
		description: t.description,
		cubeName: e,
		fieldType: "measure"
	};
}
function Qi(e, t) {
	return {
		name: t.name,
		title: t.title || t.shortTitle || t.name,
		shortTitle: t.shortTitle || t.title || t.name,
		type: t.type,
		description: t.description,
		cubeName: e,
		fieldType: t.type === "time" ? "timeDimension" : "dimension"
	};
}
function $i(e, t) {
	if (!e) return [];
	let n = t === "metrics" || t === "filter", r = t !== "metrics", i = [];
	for (let t of e.cubes) {
		if (n) for (let e of t.measures) i.push(Zi(t.name, e));
		if (r) for (let e of t.dimensions) i.push(Qi(t.name, e));
	}
	return i;
}
function ea(e, t, n) {
	let r = e;
	if (n && n !== "all" && (r = r.filter((e) => e.cubeName === n)), t.trim()) {
		let e = t.toLowerCase();
		r = r.filter((t) => t.name.toLowerCase().includes(e) || t.title.toLowerCase().includes(e) || (t.description?.toLowerCase().includes(e) ?? !1));
	}
	return r;
}
function ta(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = t.get(n.cubeName) || [];
		e.push(n), t.set(n.cubeName, e);
	}
	return t;
}
function na(e) {
	return e ? e.cubes.map((e) => e.name) : [];
}
function ra(e, t) {
	return t && t.cubes.find((t) => t.name === e)?.title || e;
}
function ia(e, t) {
	let n = /* @__PURE__ */ new Set();
	if (!t) return n;
	n.add(e);
	let r = t.cubes.find((t) => t.name === e);
	if (!r || !r.relationships) return n;
	for (let e of r.relationships) n.add(e.targetCube);
	return n;
}
function aa(e, t) {
	if (!t) return null;
	let n = ia(e, t);
	return { cubes: t.cubes.filter((e) => n.has(e.name)).map((e) => ({
		...e,
		description: e.description || ""
	})) };
}
//#endregion
//#region src/client/components/AnalysisBuilder/utils/recentFieldsUtils.ts
var oa = "drizzle-cube-recent-fields", sa = 10;
function ca() {
	try {
		let e = localStorage.getItem(oa);
		if (e) return JSON.parse(e);
	} catch {}
	return {
		metrics: [],
		breakdowns: []
	};
}
function la(e, t) {
	try {
		let n = ca(), r = n[t].filter((t) => t !== e);
		r.unshift(e), n[t] = r.slice(0, sa), localStorage.setItem(oa, JSON.stringify(n));
	} catch {}
}
function ua(e, t, n) {
	if (!e || n.length === 0) return [];
	let r = $i(e, t), i = [];
	for (let e of n) {
		let t = r.find((t) => t.name === e);
		t && i.push(t);
	}
	return i;
}
//#endregion
//#region src/client/components/AnalysisBuilder/FieldDetailPanel.tsx
function da({ field: e }) {
	let { t } = R();
	return e ? /* @__PURE__ */ X("div", {
		className: "dc:p-4",
		children: [
			/* @__PURE__ */ X("div", {
				className: "dc:flex dc:items-start dc:gap-3 dc:mb-4",
				children: [/* @__PURE__ */ Y("span", {
					className: `dc:shrink-0 dc:w-12 dc:h-12 dc:flex dc:items-center dc:justify-center dc:rounded-lg ${e.fieldType === "measure" ? "bg-dc-measure text-dc-measure-text" : e.fieldType === "timeDimension" ? "bg-dc-time-dimension text-dc-time-dimension-text" : "bg-dc-dimension text-dc-dimension-text"}`,
					children: (() => {
						if (e.fieldType === "measure") {
							let t = l(e.type);
							return t ? /* @__PURE__ */ Y(t, { className: "dc:w-6 dc:h-6" }) : null;
						}
						if (e.fieldType === "timeDimension") {
							let e = _("time");
							return e ? /* @__PURE__ */ Y(e, { className: "dc:w-6 dc:h-6" }) : null;
						}
						{
							let e = _("dimension");
							return e ? /* @__PURE__ */ Y(e, { className: "dc:w-6 dc:h-6" }) : null;
						}
					})()
				}), /* @__PURE__ */ X("div", {
					className: "dc:flex-1 dc:min-w-0",
					children: [/* @__PURE__ */ Y("h3", {
						className: "dc:text-base dc:font-semibold text-dc-text dc:leading-tight",
						children: e.title
					}), /* @__PURE__ */ Y("p", {
						className: "dc:text-xs text-dc-text-muted dc:mt-0.5 dc:truncate",
						children: e.name
					})]
				})]
			}),
			e.description && /* @__PURE__ */ Y("div", {
				className: "dc:mb-4",
				children: /* @__PURE__ */ Y("p", {
					className: "dc:text-sm text-dc-text-secondary dc:leading-relaxed",
					children: e.description
				})
			}),
			/* @__PURE__ */ X("div", {
				className: "dc:space-y-3 dc:pt-4 dc:border-t border-dc-border",
				children: [
					/* @__PURE__ */ X("div", {
						className: "dc:flex dc:items-center dc:justify-between",
						children: [/* @__PURE__ */ Y("span", {
							className: "dc:text-xs text-dc-text-muted",
							children: t("fieldPanel.labels.type")
						}), /* @__PURE__ */ Y("span", {
							className: "dc:text-sm text-dc-text dc:font-medium",
							children: e.fieldType === "measure" ? {
								count: t("fieldTypes.count"),
								countDistinct: t("fieldTypes.countDistinct"),
								countDistinctApprox: t("fieldTypes.countDistinctApprox"),
								sum: t("fieldTypes.sum"),
								avg: t("fieldTypes.avg"),
								min: t("fieldTypes.min"),
								max: t("fieldTypes.max"),
								runningTotal: t("fieldTypes.runningTotal"),
								number: t("fieldTypes.number")
							}[e.type] || e.type : e.fieldType === "timeDimension" ? t("fieldTypes.time") : {
								string: t("fieldTypes.string"),
								number: t("fieldTypes.number"),
								boolean: t("fieldTypes.boolean"),
								geo: t("fieldTypes.geo")
							}[e.type] || t("fieldTypes.dimension")
						})]
					}),
					/* @__PURE__ */ X("div", {
						className: "dc:flex dc:items-center dc:justify-between",
						children: [/* @__PURE__ */ Y("span", {
							className: "dc:text-xs text-dc-text-muted",
							children: t("fieldPanel.labels.cube")
						}), /* @__PURE__ */ Y("span", {
							className: "dc:text-sm text-dc-text dc:font-medium",
							children: e.cubeName
						})]
					}),
					/* @__PURE__ */ X("div", {
						className: "dc:flex dc:items-center dc:justify-between",
						children: [/* @__PURE__ */ Y("span", {
							className: "dc:text-xs text-dc-text-muted",
							children: t("fieldPanel.labels.category")
						}), /* @__PURE__ */ Y("span", {
							className: `dc:text-xs dc:px-2 dc:py-0.5 dc:rounded-sm dc:font-medium ${e.fieldType === "measure" ? "bg-dc-measure text-dc-measure-text" : e.fieldType === "timeDimension" ? "bg-dc-time-dimension text-dc-time-dimension-text" : "bg-dc-dimension text-dc-dimension-text"}`,
							children: t(e.fieldType === "measure" ? "fieldCategory.measure" : e.fieldType === "timeDimension" ? "fieldCategory.timeDimension" : "fieldCategory.dimension")
						})]
					})
				]
			}),
			/* @__PURE__ */ Y("div", {
				className: "dc:mt-6 dc:p-3 bg-dc-surface dc:rounded-lg",
				children: /* @__PURE__ */ Y("p", {
					className: "dc:text-xs text-dc-text-muted",
					children: t("fieldPanel.usageHint")
				})
			})
		]
	}) : /* @__PURE__ */ Y("div", {
		className: "dc:p-6 dc:text-center text-dc-text-muted",
		children: /* @__PURE__ */ Y("p", {
			className: "dc:text-sm",
			children: t("fieldPanel.emptyState")
		})
	});
}
var fa = H(da), pa = v("check");
function ma({ field: e, isSelected: t, isFocused: n, onClick: r, onMouseEnter: i, ...a }) {
	let o = () => {
		if (e.fieldType === "measure") {
			let t = l(e.type);
			return t ? /* @__PURE__ */ Y(t, { className: "dc:w-4 dc:h-4" }) : null;
		}
		if (e.fieldType === "timeDimension") {
			let e = _("time");
			return e ? /* @__PURE__ */ Y(e, { className: "dc:w-4 dc:h-4" }) : null;
		}
		{
			let e = _("dimension");
			return e ? /* @__PURE__ */ Y(e, { className: "dc:w-4 dc:h-4" }) : null;
		}
	}, s = () => e.fieldType === "measure" ? "bg-dc-measure text-dc-measure-text" : e.fieldType === "timeDimension" ? "bg-dc-time-dimension text-dc-time-dimension-text" : "bg-dc-dimension text-dc-dimension-text", c = () => e.fieldType === "measure" ? e.type.charAt(0).toUpperCase() + e.type.slice(1) : e.fieldType === "timeDimension" ? "Time" : "Dim";
	return /* @__PURE__ */ X("button", {
		onClick: r,
		onMouseEnter: i,
		className: `dc:w-full dc:text-left dc:px-3 dc:py-2 dc:rounded-lg dc:flex dc:items-center dc:gap-3 dc:transition-colors dc:group ${n ? "bg-dc-primary/10 dc:ring-1 ring-dc-primary" : t ? "bg-dc-success/10" : "hover:bg-dc-surface-hover"}`,
		...a,
		children: [
			/* @__PURE__ */ Y("span", {
				className: `dc:shrink-0 dc:w-8 dc:h-8 dc:flex dc:items-center dc:justify-center dc:rounded-md ${e.fieldType === "measure" ? "bg-dc-measure text-dc-measure-text" : e.fieldType === "timeDimension" ? "bg-dc-time-dimension text-dc-time-dimension-text" : "bg-dc-dimension text-dc-dimension-text"}`,
				children: o()
			}),
			/* @__PURE__ */ X("div", {
				className: "dc:flex-1 dc:min-w-0",
				children: [/* @__PURE__ */ Y("div", {
					className: "dc:text-sm dc:font-medium text-dc-text dc:truncate",
					children: e.title
				}), /* @__PURE__ */ Y("div", {
					className: "dc:text-xs text-dc-text-muted dc:truncate",
					children: e.name
				})]
			}),
			/* @__PURE__ */ Y("span", {
				className: `dc:shrink-0 dc:px-2 dc:py-0.5 dc:rounded-sm dc:text-xs dc:font-medium ${s()}`,
				children: c()
			}),
			t && /* @__PURE__ */ Y("span", {
				className: "dc:shrink-0 dc:w-5 dc:h-5 dc:flex dc:items-center dc:justify-center dc:rounded-full bg-dc-success text-white",
				children: /* @__PURE__ */ Y(pa, { className: "dc:w-3 dc:h-3" })
			})
		]
	});
}
var ha = H(ma);
//#endregion
//#region src/client/components/AnalysisBuilder/FieldSearchResults.tsx
function ga(e, t, n, r, i) {
	let a = Array.from(e.entries()), o = Array.from(e.keys()).indexOf(n);
	return t + a.slice(0, o).reduce((e, [, t]) => e + t.length, 0) + r.indexOf(i);
}
var _a = H(function({ mode: e, schema: t, searchTerm: n, recentOptions: r, groupedFields: i, filteredCount: a, selectedFields: o, focusedIndex: s, onSelectField: c, onFocusField: l }) {
	let { t: u } = R();
	if (a === 0 && r.length === 0) {
		let t;
		return t = n ? u(e === "metrics" ? "fieldSearch.empty.noMatchMetrics" : "fieldSearch.empty.noMatchDimensions", { searchTerm: n }) : u(e === "metrics" ? "fieldSearch.empty.noMetrics" : "fieldSearch.empty.noDimensions"), /* @__PURE__ */ X("div", {
			className: "dc:text-center dc:py-12 text-dc-text-muted",
			children: [/* @__PURE__ */ Y("p", {
				className: "dc:text-lg dc:mb-2",
				children: u("fieldSearch.empty.heading")
			}), /* @__PURE__ */ Y("p", {
				className: "dc:text-sm",
				children: t
			})]
		});
	}
	let d = (e, t, n = "") => /* @__PURE__ */ Y(ha, {
		field: e,
		isSelected: o.includes(e.name),
		isFocused: s === t,
		onClick: (n) => c(e, t, n.shiftKey),
		onMouseEnter: () => l(e, t),
		"data-field-index": t
	}, `${n}${e.name}`);
	return /* @__PURE__ */ X("div", {
		className: "dc:space-y-6",
		children: [r.length > 0 && /* @__PURE__ */ X("div", { children: [/* @__PURE__ */ Y("h3", {
			className: "dc:text-xs dc:font-semibold text-dc-text-muted dc:uppercase dc:tracking-wider dc:mb-2",
			children: u("fieldSearch.section.recents")
		}), /* @__PURE__ */ Y("div", {
			className: "dc:space-y-1",
			children: r.map((e, t) => d(e, t, "recent-"))
		})] }), Array.from(i.entries()).map(([e, n]) => /* @__PURE__ */ X("div", { children: [/* @__PURE__ */ Y("h3", {
			className: "dc:text-xs dc:font-semibold text-dc-text-muted dc:uppercase dc:tracking-wider dc:mb-2",
			children: ra(e, t)
		}), /* @__PURE__ */ Y("div", {
			className: "dc:space-y-1",
			children: n.map((t) => d(t, ga(i, r.length, e, n, t)))
		})] }, e))]
	});
});
//#endregion
//#region src/client/components/AnalysisBuilder/hooks/useFieldSearchKeyboard.ts
function va(e, t, n) {
	let [r, i] = q(null), [a, o] = q(-1), s = K(null), c = U((t) => {
		o((n) => {
			let r = t > 0 ? Math.min(n + 1, e.length - 1) : Math.max(n - 1, 0);
			return i(e[r]), r;
		});
	}, [e]), l = U((r) => {
		if (e.length !== 0) switch (r.key) {
			case "ArrowDown":
				r.preventDefault(), c(1);
				break;
			case "ArrowUp":
				r.preventDefault(), c(-1);
				break;
			case "Enter":
				r.preventDefault(), a >= 0 && e[a] && t(e[a], a, r.shiftKey);
				break;
			case "Escape": r.preventDefault(), n();
		}
	}, [
		e,
		a,
		c,
		t,
		n
	]);
	return W(() => {
		if (a >= 0 && s.current) {
			let e = s.current.querySelector(`[data-field-index="${a}"]`);
			e && e.scrollIntoView({
				block: "nearest",
				behavior: "smooth"
			});
		}
	}, [a]), {
		focusedField: r,
		setFocusedField: i,
		focusedIndex: a,
		setFocusedIndex: o,
		resultsContainerRef: s,
		handleKeyDown: l
	};
}
//#endregion
//#region src/client/components/AnalysisBuilder/FieldSearchModal.tsx
var ya = v("search"), ba = v("close");
function xa({ isOpen: e, onClose: t, onSelect: n, mode: r, schema: i, selectedFields: a, recentFields: o }) {
	let { t: s } = R(), [c, l] = q(""), [u, d] = q(null), [f, p] = q(null), m = K(null), h = G(() => {
		if (o) return o;
		let e = ca();
		return r === "metrics" ? e.metrics : e.breakdowns;
	}, [o, r]), g = r, _ = G(() => $i(i, g), [i, g]), v = G(() => na(i), [i]), y = G(() => ea(_, c, u), [
		_,
		c,
		u
	]), b = G(() => ta(y), [y]), x = G(() => c.trim() ? [] : ua(i, g, h).filter((e) => !u || e.cubeName === u), [
		i,
		g,
		h,
		c,
		u
	]), S = G(() => {
		let e = [...x];
		return b.forEach((t) => {
			e.push(...t);
		}), e;
	}, [x, b]);
	W(() => {
		e && m.current && m.current.focus();
	}, [e]);
	let C = U((e, t = !1) => {
		la(e.name, r === "metrics" ? "metrics" : "breakdowns"), n({
			name: e.name,
			title: e.title,
			shortTitle: e.shortTitle,
			type: e.type,
			description: e.description
		}, e.fieldType, e.cubeName, t);
	}, [r, n]), w = U((e, t, n = !1) => {
		if (n && f !== null && f !== t) {
			let e = Math.min(f, t), n = Math.max(f, t);
			for (let t = e; t <= n; t++) {
				let e = S[t];
				e && !a.includes(e.name) && C(e, !0);
			}
		} else n ? C(e, !0) : C(e, !1);
		p(t);
	}, [
		S,
		f,
		C,
		a
	]), { focusedField: T, setFocusedField: E, focusedIndex: D, setFocusedIndex: O, resultsContainerRef: k, handleKeyDown: A } = va(S, w, t), j = U((e, t) => {
		E(e), O(t);
	}, [E, O]);
	if (W(() => {
		e || (l(""), d(null), E(null), O(-1), p(null));
	}, [
		e,
		E,
		O
	]), !e) return null;
	let M = s(r === "metrics" ? "fieldSearch.placeholder.metrics" : r === "filter" ? "fieldSearch.placeholder.filter" : "fieldSearch.placeholder.dimensions"), N = s(r === "metrics" ? "fieldSearch.modal.title.metrics" : r === "filter" ? "fieldSearch.modal.title.filter" : "fieldSearch.modal.title.dimensions"), P = D >= 0 && S[D] ? `field-option-${S[D].name.replace(/\./g, "-")}` : void 0;
	return /* @__PURE__ */ Y("div", {
		className: "dc:fixed dc:inset-0 dc:z-50 dc:flex dc:items-center dc:justify-center",
		style: { backgroundColor: "var(--dc-overlay)" },
		onClick: t,
		role: "presentation",
		children: /* @__PURE__ */ X("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": N,
			className: "bg-dc-surface dc:shadow-xl dc:w-full dc:h-full dc:md:rounded-lg dc:md:w-[900px] dc:md:max-w-[900px] dc:md:h-[80vh] dc:md:max-h-[700px] dc:flex dc:flex-col dc:overflow-hidden",
			onClick: (e) => e.stopPropagation(),
			onKeyDown: A,
			children: [
				/* @__PURE__ */ X("div", {
					className: "dc:shrink-0 dc:border-b border-dc-border",
					children: [/* @__PURE__ */ X("div", {
						className: "dc:flex dc:items-center dc:px-4 dc:py-3 dc:gap-3",
						children: [
							/* @__PURE__ */ Y(ya, {
								className: "dc:w-5 dc:h-5 text-dc-text-muted",
								"aria-hidden": !0
							}),
							/* @__PURE__ */ Y("input", {
								ref: m,
								type: "text",
								value: c,
								onChange: (e) => {
									l(e.target.value), O(-1);
								},
								placeholder: M,
								className: "dc:flex-1 bg-transparent dc:border-none dc:outline-none text-dc-text placeholder-dc-text-muted dc:text-lg",
								"aria-label": M,
								"aria-controls": "field-search-results",
								"aria-activedescendant": P,
								role: "combobox",
								"aria-expanded": "true",
								"aria-autocomplete": "list"
							}),
							/* @__PURE__ */ Y("button", {
								onClick: t,
								className: "dc:p-1 text-dc-text-secondary hover:text-dc-text dc:rounded-sm",
								"aria-label": "Close dialog",
								children: /* @__PURE__ */ Y(ba, {
									className: "dc:w-5 dc:h-5",
									"aria-hidden": !0
								})
							})
						]
					}), v.length > 1 && /* @__PURE__ */ Y("div", {
						className: "dc:md:hidden dc:px-4 dc:pb-3",
						children: /* @__PURE__ */ X("select", {
							value: u || "",
							onChange: (e) => d(e.target.value || null),
							className: "dc:w-full dc:px-3 dc:py-2 bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:text-sm text-dc-text dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary",
							"aria-label": "Filter by cube",
							children: [/* @__PURE__ */ Y("option", {
								value: "",
								children: s("fieldSearch.filter.allCubes")
							}), v.map((e) => /* @__PURE__ */ Y("option", {
								value: e,
								children: ra(e, i)
							}, e))]
						})
					})]
				}),
				/* @__PURE__ */ X("div", {
					className: "dc:flex-1 dc:flex dc:overflow-hidden",
					children: [
						/* @__PURE__ */ Y("nav", {
							className: "dc:hidden dc:md:block dc:w-48 dc:shrink-0 dc:border-r border-dc-border dc:overflow-y-auto bg-dc-surface-secondary",
							"aria-label": "Filter by cube",
							children: /* @__PURE__ */ X("div", {
								className: "dc:p-2",
								role: "group",
								"aria-label": "Cube categories",
								children: [/* @__PURE__ */ Y("button", {
									onClick: () => d(null),
									className: `dc:w-full dc:text-left dc:px-3 dc:py-2 dc:rounded-md dc:text-sm dc:transition-colors ${u === null ? "bg-dc-primary/10 text-dc-primary dc:font-medium" : "text-dc-text hover:bg-dc-surface-hover"}`,
									"aria-pressed": u === null,
									children: s("fieldSearch.categories.all")
								}), v.map((e) => /* @__PURE__ */ Y("button", {
									onClick: () => d(e),
									className: `dc:w-full dc:text-left dc:px-3 dc:py-2 dc:rounded-md dc:text-sm dc:transition-colors dc:truncate ${u === e ? "bg-dc-primary/10 text-dc-primary dc:font-medium" : "text-dc-text hover:bg-dc-surface-hover"}`,
									title: ra(e, i),
									"aria-pressed": u === e,
									children: ra(e, i)
								}, e))]
							})
						}),
						/* @__PURE__ */ Y("div", {
							id: "field-search-results",
							ref: k,
							className: "dc:flex-1 dc:overflow-y-auto dc:p-4",
							role: "listbox",
							"aria-label": "Available fields",
							children: /* @__PURE__ */ Y(_a, {
								mode: r,
								schema: i,
								searchTerm: c,
								recentOptions: x,
								groupedFields: b,
								filteredCount: y.length,
								selectedFields: a,
								focusedIndex: D,
								onSelectField: w,
								onFocusField: j
							})
						}),
						/* @__PURE__ */ Y("div", {
							className: "dc:hidden dc:md:block dc:w-72 dc:shrink-0 dc:border-l border-dc-border bg-dc-surface-secondary dc:overflow-y-auto",
							children: /* @__PURE__ */ Y(fa, { field: T })
						})
					]
				}),
				/* @__PURE__ */ X("div", {
					className: "dc:shrink-0 dc:border-t border-dc-border dc:px-4 dc:py-3 dc:flex dc:items-center dc:justify-between dc:text-sm text-dc-text-muted",
					children: [/* @__PURE__ */ X("div", { children: [
						/* @__PURE__ */ Y("span", {
							className: "text-dc-text-secondary",
							children: y.length
						}),
						" ",
						s(r === "metrics" ? "fieldSearch.footer.metricsAvailable" : r === "filter" ? "fieldSearch.footer.fieldsAvailable" : "fieldSearch.footer.dimensionsAvailable")
					] }), /* @__PURE__ */ X("div", {
						className: "dc:hidden dc:md:flex dc:items-center dc:gap-4",
						children: [
							/* @__PURE__ */ X("span", { children: [
								/* @__PURE__ */ Y("kbd", {
									className: "dc:px-1.5 dc:py-0.5 bg-dc-surface-tertiary dc:rounded-sm dc:text-xs",
									children: "↑↓"
								}),
								" ",
								s("fieldSearch.shortcut.navigate")
							] }),
							/* @__PURE__ */ X("span", { children: [
								/* @__PURE__ */ Y("kbd", {
									className: "dc:px-1.5 dc:py-0.5 bg-dc-surface-tertiary dc:rounded-sm dc:text-xs",
									children: s("fieldSearch.shortcut.keyEnter")
								}),
								" ",
								s("fieldSearch.shortcut.select")
							] }),
							/* @__PURE__ */ X("span", { children: [
								/* @__PURE__ */ Y("kbd", {
									className: "dc:px-1.5 dc:py-0.5 bg-dc-surface-tertiary dc:rounded-sm dc:text-xs",
									children: s("fieldSearch.shortcut.keyShift")
								}),
								s("fieldSearch.shortcut.plusClick"),
								" ",
								s("fieldSearch.shortcut.multiSelect")
							] }),
							/* @__PURE__ */ X("span", { children: [
								/* @__PURE__ */ Y("kbd", {
									className: "dc:px-1.5 dc:py-0.5 bg-dc-surface-tertiary dc:rounded-sm dc:text-xs",
									children: s("fieldSearch.shortcut.keyEsc")
								}),
								" ",
								s("fieldSearch.shortcut.close")
							] })
						]
					})]
				})
			]
		})
	});
}
//#endregion
//#region src/client/shared/types.ts
var Sa = [
	{
		value: "custom",
		label: "dateRange.custom"
	},
	{
		value: "today",
		label: "dateRange.today"
	},
	{
		value: "yesterday",
		label: "dateRange.yesterday"
	},
	{
		value: "this_week",
		label: "dateRange.thisWeek"
	},
	{
		value: "this_month",
		label: "dateRange.thisMonth"
	},
	{
		value: "this_quarter",
		label: "dateRange.thisQuarter"
	},
	{
		value: "this_year",
		label: "dateRange.thisYear"
	},
	{
		value: "last_7_days",
		label: "dateRange.last7Days"
	},
	{
		value: "last_30_days",
		label: "dateRange.last30Days"
	},
	{
		value: "last_n_days",
		label: "dateRange.lastNDays"
	},
	{
		value: "last_week",
		label: "dateRange.lastWeek"
	},
	{
		value: "last_n_weeks",
		label: "dateRange.lastNWeeks"
	},
	{
		value: "last_month",
		label: "dateRange.lastMonth"
	},
	{
		value: "last_12_months",
		label: "dateRange.last12Months"
	},
	{
		value: "last_n_months",
		label: "dateRange.lastNMonths"
	},
	{
		value: "last_quarter",
		label: "dateRange.lastQuarter"
	},
	{
		value: "last_n_quarters",
		label: "dateRange.lastNQuarters"
	},
	{
		value: "last_year",
		label: "dateRange.lastYear"
	},
	{
		value: "last_n_years",
		label: "dateRange.lastNYears"
	}
], Ca = [
	{
		id: "today",
		label: "dashboardFilter.presets.today",
		value: "today"
	},
	{
		id: "yesterday",
		label: "dashboardFilter.presets.yesterday",
		value: "yesterday"
	},
	{
		id: "7d",
		label: "dashboardFilter.presets.7d",
		value: "last 7 days"
	},
	{
		id: "30d",
		label: "dashboardFilter.presets.30d",
		value: "last 30 days"
	},
	{
		id: "3m",
		label: "dashboardFilter.presets.3m",
		value: "last 3 months"
	},
	{
		id: "6m",
		label: "dashboardFilter.presets.6m",
		value: "last 6 months"
	},
	{
		id: "12m",
		label: "dashboardFilter.presets.12m",
		value: "last 12 months"
	}
], wa = [
	{
		id: "wtd",
		label: "dashboardFilter.xtd.wtd",
		value: "this week"
	},
	{
		id: "mtd",
		label: "dashboardFilter.xtd.mtd",
		value: "this month"
	},
	{
		id: "qtd",
		label: "dashboardFilter.xtd.qtd",
		value: "this quarter"
	},
	{
		id: "ytd",
		label: "dashboardFilter.xtd.ytd",
		value: "this year"
	}
];
function Ta(e) {
	let t = new Date(e), n = t.getDay(), r = n === 0 ? 6 : n - 1;
	return t.setDate(t.getDate() - r), t;
}
function Ea(e, t, n) {
	switch (e) {
		case "today": return {
			start: t,
			end: n
		};
		case "yesterday": {
			let e = new Date(t);
			e.setDate(e.getDate() - 1);
			let n = new Date(e);
			return n.setHours(23, 59, 59, 999), {
				start: e,
				end: n
			};
		}
		case "this week": return {
			start: Ta(t),
			end: n
		};
		case "this month": return {
			start: new Date(t.getFullYear(), t.getMonth(), 1),
			end: n
		};
		case "this quarter": {
			let e = Math.floor(t.getMonth() / 3);
			return {
				start: new Date(t.getFullYear(), e * 3, 1),
				end: n
			};
		}
		case "this year": return {
			start: new Date(t.getFullYear(), 0, 1),
			end: n
		};
		default: return null;
	}
}
function Da(e, t, n) {
	let r = e.match(/^last\s+(\d+)\s+(day|days|week|weeks|month|months|quarter|quarters|year|years)$/i);
	if (!r) return null;
	let i = parseInt(r[1], 10), a = r[2].toLowerCase(), o = new Date(t);
	return a === "day" || a === "days" ? o.setDate(o.getDate() - i + 1) : a === "week" || a === "weeks" ? o.setDate(o.getDate() - i * 7 + 1) : a === "month" || a === "months" ? (o.setMonth(o.getMonth() - i), o.setDate(o.getDate() + 1)) : a === "quarter" || a === "quarters" ? (o.setMonth(o.getMonth() - i * 3), o.setDate(o.getDate() + 1)) : (a === "year" || a === "years") && (o.setFullYear(o.getFullYear() - i), o.setDate(o.getDate() + 1)), {
		start: o,
		end: n
	};
}
function Oa(e, t) {
	let n = e.match(/^last\s+(week|month|quarter|year)$/i);
	if (!n) return null;
	let r = n[1].toLowerCase();
	if (r === "week") {
		let e = new Date(t), n = e.getDay(), r = n === 0 ? 6 : n - 1;
		e.setDate(e.getDate() - r - 1), e.setHours(23, 59, 59, 999);
		let i = new Date(e);
		return i.setDate(i.getDate() - 6), i.setHours(0, 0, 0, 0), {
			start: i,
			end: e
		};
	}
	if (r === "month") {
		let e = new Date(t.getFullYear(), t.getMonth() - 1, 1), n = new Date(t.getFullYear(), t.getMonth(), 0);
		return n.setHours(23, 59, 59, 999), {
			start: e,
			end: n
		};
	}
	if (r === "quarter") {
		let e = Math.floor(t.getMonth() / 3), n = e === 0 ? 3 : e - 1, r = e === 0 ? t.getFullYear() - 1 : t.getFullYear(), i = new Date(r, n * 3, 1), a = new Date(r, n * 3 + 3, 0);
		return a.setHours(23, 59, 59, 999), {
			start: i,
			end: a
		};
	}
	let i = new Date(t.getFullYear() - 1, 0, 1), a = new Date(t.getFullYear() - 1, 11, 31);
	return a.setHours(23, 59, 59, 999), {
		start: i,
		end: a
	};
}
function ka(e) {
	let t = /* @__PURE__ */ new Date();
	t.setHours(0, 0, 0, 0);
	let n = new Date(t);
	return n.setHours(23, 59, 59, 999), Ea(e.toLowerCase(), t, n) ?? Da(e, t, n) ?? Oa(e, t);
}
function Aa(e, t) {
	let n = {
		month: "short",
		day: "numeric",
		year: "numeric"
	}, r = e.toLocaleDateString("en-US", n), i = t.toLocaleDateString("en-US", n);
	return r === i ? r : e.getFullYear() === t.getFullYear() ? `${e.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric"
	})} - ${i}` : `${r} - ${i}`;
}
function ja(e) {
	if (!e) return null;
	if (Array.isArray(e)) return "custom";
	let t = e.toLowerCase().trim(), n = [...Ca, ...wa].find((e) => e.value.toLowerCase() === t);
	return n ? n.id : "custom";
}
var Ma = {
	day: "days",
	week: "weeks",
	month: "months",
	quarter: "quarters",
	year: "years"
};
function Na(e) {
	if (!e) return null;
	if (Array.isArray(e)) return { rangeType: "custom" };
	let t = e.match(/^last (\d+) (days|weeks|months|quarters|years)$/);
	if (t) {
		let [, e, n] = t;
		return {
			rangeType: `last_n_${n}`,
			numberValue: parseInt(e) || 1
		};
	}
	let n = e.match(/^last (day|week|month|quarter|year)$/);
	if (n) {
		let [, e] = n;
		return {
			rangeType: `last_n_${Ma[e] ?? "years"}`,
			numberValue: 1
		};
	}
	for (let t of Sa) if (t.value !== "custom" && !w(t.value) && O(t.value) === e) return { rangeType: t.value };
	return { rangeType: "custom" };
}
//#endregion
//#region src/client/components/DashboardFilters/dashboardFilterConfigModalUtils.ts
function Pa(e, t) {
	if (t === "number") {
		let t = parseFloat(e);
		return isNaN(t) ? e === "" || e === "-" ? [] : null : [t];
	}
	return e ? [e] : [];
}
//#endregion
//#region src/client/components/DashboardFilters/useFilterDropdowns.ts
function Fa() {
	let e = K(null), [t, n] = q(!1), [r, i] = q(!1), [a, o] = q(!1);
	return W(() => {
		let t = (t) => {
			e.current && !e.current.contains(t.target) && (n(!1), i(!1), o(!1));
		};
		return document.addEventListener("mousedown", t), () => document.removeEventListener("mousedown", t);
	}, []), {
		containerRef: e,
		isOperatorDropdownOpen: t,
		setIsOperatorDropdownOpen: n,
		isValueDropdownOpen: r,
		setIsValueDropdownOpen: i,
		isDateRangeDropdownOpen: a,
		setIsDateRangeDropdownOpen: o
	};
}
//#endregion
//#region src/client/components/DashboardFilters/useFilterValueFetch.ts
function Ia({ localFilter: e, setLocalFilter: t, operatorMeta: n, shouldShowComboBox: r, isValueDropdownOpen: i, setIsValueDropdownOpen: a }) {
	let [o, s] = q(""), c = N(o, 300), { values: l, loading: u, error: d, searchValues: f } = P(e.member, r);
	return W(() => {
		i && r && f && f("", !0);
	}, [
		i,
		r,
		f
	]), W(() => {
		i && r && f && c !== void 0 && f(c);
	}, [
		c,
		i,
		r,
		f
	]), {
		searchText: o,
		setSearchText: s,
		distinctValues: l,
		valuesLoading: u,
		valuesError: d,
		handleValueSelect: U((r) => {
			let i = e.values || [];
			n?.supportsMultipleValues ? i.includes(r) || t({
				...e,
				values: [...i, r]
			}) : (t({
				...e,
				values: [r]
			}), a(!1)), s("");
		}, [
			e,
			n?.supportsMultipleValues,
			t,
			a
		]),
		handleValueRemove: U((n) => {
			let r = (e.values || []).filter((e) => e !== n);
			t({
				...e,
				values: r
			});
		}, [e, t])
	};
}
//#endregion
//#region src/client/components/DashboardFilters/useDateRangeState.ts
function La({ localFilter: e, setLocalFilter: t, shouldShowDateRange: n, setIsDateRangeDropdownOpen: r }) {
	let [i, a] = q("this_month"), [o, s] = q(1);
	return W(() => {
		if (!n) return;
		let t = Na(e.dateRange);
		t && (a(t.rangeType), t.numberValue !== void 0 && s(t.numberValue));
	}, [e.dateRange, n]), {
		rangeType: i,
		numberValue: o,
		handleRangeTypeChange: U((n) => {
			a(n), r(!1);
			let i;
			if (n === "custom") {
				let e = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
				i = [e, e];
			} else i = w(n) ? O(n, o) : O(n);
			t({
				...e,
				dateRange: i
			});
		}, [
			e,
			o,
			t,
			r
		]),
		handleNumberValueChange: U((n) => {
			if (s(n), w(i)) {
				let r = O(i, n);
				t({
					...e,
					dateRange: r
				});
			}
		}, [
			e,
			i,
			t
		]),
		handleCustomStartDate: U((n) => {
			let r = n.target.value, i = (Array.isArray(e.dateRange) ? e.dateRange : [e.dateRange || "", ""])[1] || r;
			t({
				...e,
				dateRange: [r, i]
			});
		}, [e, t]),
		handleCustomEndDate: U((n) => {
			let r = n.target.value, i = (Array.isArray(e.dateRange) ? e.dateRange : ["", e.dateRange || ""])[0] || r;
			t({
				...e,
				dateRange: [i, r]
			});
		}, [e, t])
	};
}
//#endregion
//#region src/client/components/DashboardFilters/useDashboardFilterConfigModal.ts
function Ra({ initialFilter: e, fullSchema: t, filteredSchema: n, isOpen: r, onSave: i }) {
	let { t: a } = R(), [o, s] = q(e.label), [c, l] = q(e.filter), [u, d] = q(!1), [f, p] = q(!1), m = Fa(), { setIsOperatorDropdownOpen: h, setIsValueDropdownOpen: g, setIsDateRangeDropdownOpen: _ } = m, v = u ? t : n;
	W(() => {
		r && (s(e.label), l(e.filter));
	}, [e, r]);
	let y = Yi(c.member, v), b = y?.field.type || "string", x = b === "time", S = y?.fieldType === "measure", C = y?.fieldType === "dimension", w = Xi(c.member, v), T = qe[c.operator], E = Xe(b), D = x && c.operator === "inDateRange", O = [
		"equals",
		"notEquals",
		"in",
		"notIn"
	].includes(c.operator) && C && !x, k = Ia({
		localFilter: c,
		setLocalFilter: l,
		operatorMeta: T,
		shouldShowComboBox: O,
		isValueDropdownOpen: m.isValueDropdownOpen,
		setIsValueDropdownOpen: g
	}), A = La({
		localFilter: c,
		setLocalFilter: l,
		shouldShowDateRange: D,
		setIsDateRangeDropdownOpen: _
	}), j = U((e, t) => {
		let n = e.type, r = Xe(n)[0]?.operator || "equals";
		l({
			member: e.name,
			operator: r,
			values: []
		}), p(!1);
	}, []), M = U((e) => {
		l({
			member: c.member,
			operator: e,
			values: []
		}), h(!1);
	}, [c.member, h]), N = U((e) => {
		let t = Pa(e.target.value, T?.valueType);
		t !== null && l({
			...c,
			values: t
		});
	}, [c, T?.valueType]), P = U((e) => {
		let t = parseFloat(e.target.value), n = [isNaN(t) ? "" : t, (c.values?.length >= 2 ? c.values : ["", ""])[1]].filter((e) => e !== "");
		l({
			...c,
			values: n
		});
	}, [c]), ee = U((e) => {
		let t = parseFloat(e.target.value), n = [(c.values?.length >= 2 ? c.values : ["", ""])[0], isNaN(t) ? "" : t].filter((e) => e !== "");
		l({
			...c,
			values: n
		});
	}, [c]), te = U((e) => {
		let t = e.target.value;
		l({
			...c,
			values: t ? [t] : []
		});
	}, [c]), F = U(() => {
		if (!o.trim()) {
			alert(a("dashboardFilter.filterLabelRequired"));
			return;
		}
		if (!e.isUniversalTime && !c.member) {
			alert(a("dashboardFilter.selectFieldRequired"));
			return;
		}
		i({
			id: e.id,
			label: o,
			filter: c,
			...e.isUniversalTime && { isUniversalTime: !0 }
		});
	}, [
		e.id,
		e.isUniversalTime,
		o,
		c,
		i,
		a
	]), I = a(E.find((e) => e.operator === c.operator)?.label || c.operator), ne = a(Sa.find((e) => e.value === A.rangeType)?.label || "filter.modal.selectRange");
	return {
		localLabel: o,
		setLocalLabel: s,
		localFilter: c,
		showAllFields: u,
		setShowAllFields: d,
		showFieldSearch: f,
		setShowFieldSearch: p,
		field: {
			activeSchema: v,
			isTimeField: x,
			isMeasureField: S,
			fieldTitle: w,
			operatorMeta: T,
			availableOperators: E,
			operatorLabel: I,
			shouldShowDateRange: D,
			shouldShowComboBox: O
		},
		dropdowns: m,
		values: k,
		dateRange: {
			...A,
			dateRangeLabel: ne
		},
		handleFieldSelected: j,
		handleOperatorChange: M,
		handleDirectInput: N,
		handleBetweenStartInput: P,
		handleBetweenEndInput: ee,
		handleDateInput: te,
		handleSave: F
	};
}
//#endregion
//#region src/client/components/DashboardFilters/DashboardFilterValueInput.tsx
var za = v("close"), Ba = v("chevronDown");
function Va(e) {
	let { t } = R(), { filter: n, rangeType: r, numberValue: i, dateRangeLabel: a, isDateRangeDropdownOpen: o, setIsOperatorDropdownOpen: s, setIsValueDropdownOpen: c, setIsDateRangeDropdownOpen: l, handleRangeTypeChange: u, handleNumberValueChange: d, handleCustomStartDate: f, handleCustomEndDate: p } = e;
	return /* @__PURE__ */ X("div", {
		className: "dc:space-y-2",
		children: [
			/* @__PURE__ */ X("div", {
				className: "dc:relative",
				children: [/* @__PURE__ */ X("button", {
					onClick: () => {
						s(!1), c(!1), l(!o);
					},
					className: "dc:w-full dc:flex dc:items-center dc:justify-between dc:text-left dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text hover:bg-dc-surface-hover",
					children: [/* @__PURE__ */ Y("span", {
						className: "dc:truncate",
						children: a
					}), /* @__PURE__ */ Y(Ba, { className: `dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0 dc:ml-2 dc:transition-transform ${o ? "dc:rotate-180" : ""}` })]
				}), o && /* @__PURE__ */ Y("div", {
					className: "dc:absolute dc:z-[60] dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded-sm dc:shadow-lg dc:max-h-48 dc:overflow-y-auto",
					children: Sa.map((e) => /* @__PURE__ */ Y("button", {
						onClick: () => u(e.value),
						className: `dc:w-full dc:text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover ${e.value === r ? "bg-dc-primary/10 text-dc-primary" : "text-dc-text"}`,
						children: t(e.label)
					}, e.value))
				})]
			}),
			w(r) && /* @__PURE__ */ X("div", {
				className: "dc:flex dc:items-center dc:gap-2",
				children: [/* @__PURE__ */ Y("input", {
					type: "number",
					min: "1",
					max: "1000",
					value: i,
					onChange: (e) => d(Math.max(1, parseInt(e.target.value) || 1)),
					className: "dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text dc:w-20"
				}), /* @__PURE__ */ Y("span", {
					className: "dc:text-sm text-dc-text-muted",
					children: r.replace("last_n_", "")
				})]
			}),
			r === "custom" && /* @__PURE__ */ X("div", {
				className: "dc:flex dc:items-center dc:gap-2",
				children: [
					/* @__PURE__ */ Y("input", {
						type: "date",
						value: Array.isArray(n.dateRange) ? n.dateRange[0] : "",
						onChange: f,
						className: "dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-2 bg-dc-surface text-dc-text"
					}),
					/* @__PURE__ */ Y("span", {
						className: "dc:text-sm text-dc-text-muted",
						children: "to"
					}),
					/* @__PURE__ */ Y("input", {
						type: "date",
						value: Array.isArray(n.dateRange) ? n.dateRange[1] : "",
						onChange: p,
						className: "dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-2 bg-dc-surface text-dc-text"
					})
				]
			})
		]
	});
}
function Ha(e) {
	let { t } = R(), { filter: n, distinctValues: r, valuesLoading: i, valuesError: a, handleValueSelect: o } = e;
	return i ? /* @__PURE__ */ Y("div", {
		className: "dc:px-3 dc:py-2 dc:text-sm text-dc-text-muted",
		children: t("common.loading")
	}) : a ? /* @__PURE__ */ X("div", {
		className: "dc:px-3 dc:py-2 dc:text-sm text-dc-error",
		children: [t("dashboardFilter.errorPrefix"), String(a)]
	}) : r.length === 0 ? /* @__PURE__ */ Y("div", {
		className: "dc:px-3 dc:py-2 dc:text-sm text-dc-text-muted",
		children: t("dashboardFilter.noValuesFound")
	}) : /* @__PURE__ */ Y("div", {
		className: "dc:max-h-40 dc:overflow-y-auto",
		children: r.map((e, t) => {
			let r = n.values?.includes(e);
			return /* @__PURE__ */ X("button", {
				onClick: () => o(e),
				className: `dc:w-full dc:text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover ${r ? "bg-dc-primary/10 text-dc-primary" : "text-dc-text"}`,
				children: [String(e), r && /* @__PURE__ */ Y("span", {
					className: "dc:float-right",
					children: "✓"
				})]
			}, `${e}-${t}`);
		})
	});
}
function Ua(e) {
	let { t } = R(), { filter: n, isValueDropdownOpen: r, valuesLoading: i, searchText: a, setSearchText: o, setIsOperatorDropdownOpen: s, setIsValueDropdownOpen: c, setIsDateRangeDropdownOpen: l, handleValueRemove: u } = e;
	return /* @__PURE__ */ X("div", {
		className: "dc:space-y-2",
		children: [n.values && n.values.length > 0 && /* @__PURE__ */ Y("div", {
			className: "dc:flex dc:flex-wrap dc:gap-1.5",
			children: n.values.map((e, t) => /* @__PURE__ */ X("span", {
				className: "dc:inline-flex dc:items-center dc:gap-1 bg-dc-primary/10 text-dc-primary dc:text-sm dc:px-2 dc:py-1 dc:rounded-sm",
				children: [/* @__PURE__ */ Y("span", {
					className: "dc:max-w-[150px] dc:truncate",
					children: String(e)
				}), /* @__PURE__ */ Y("button", {
					onClick: () => u(e),
					className: "hover:text-dc-danger",
					children: /* @__PURE__ */ Y(za, { className: "dc:w-3.5 dc:h-3.5" })
				})]
			}, t))
		}), /* @__PURE__ */ X("div", {
			className: "dc:relative",
			children: [/* @__PURE__ */ X("button", {
				onClick: () => {
					s(!1), l(!1), c(!r);
				},
				className: "dc:w-full dc:flex dc:items-center dc:justify-between dc:text-left dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text hover:bg-dc-surface-hover",
				children: [/* @__PURE__ */ Y("span", {
					className: "text-dc-text-muted dc:truncate",
					children: i ? "Loading..." : "Select value..."
				}), /* @__PURE__ */ Y(Ba, { className: `dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0 dc:ml-2 dc:transition-transform ${r ? "dc:rotate-180" : ""}` })]
			}), r && /* @__PURE__ */ X("div", {
				className: "dc:absolute dc:z-[60] dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded-sm dc:shadow-lg dc:max-h-56 dc:overflow-hidden",
				children: [/* @__PURE__ */ Y("div", {
					className: "dc:p-2 dc:border-b border-dc-border",
					children: /* @__PURE__ */ Y("input", {
						type: "text",
						value: a,
						onChange: (e) => o(e.target.value),
						placeholder: t("dashboardFilter.search"),
						className: "dc:w-full dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text",
						autoFocus: !0
					})
				}), /* @__PURE__ */ Y(Ha, { ...e })]
			})]
		})]
	});
}
function Wa(e) {
	let { t } = R(), { filter: n, operatorMeta: r, shouldShowDateRange: i, shouldShowComboBox: a, handleBetweenStartInput: o, handleBetweenEndInput: s, handleDateInput: c, handleDirectInput: l } = e;
	return r?.requiresValues ? i ? /* @__PURE__ */ Y(Va, { ...e }) : n.operator === "between" || n.operator === "notBetween" ? /* @__PURE__ */ X("div", {
		className: "dc:flex dc:items-center dc:gap-2",
		children: [
			/* @__PURE__ */ Y("input", {
				type: "number",
				value: n.values?.[0] ?? "",
				onChange: o,
				placeholder: "Min",
				className: "dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
			}),
			/* @__PURE__ */ Y("span", {
				className: "dc:text-sm text-dc-text-muted",
				children: "to"
			}),
			/* @__PURE__ */ Y("input", {
				type: "number",
				value: n.values?.[1] ?? "",
				onChange: s,
				placeholder: "Max",
				className: "dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
			})
		]
	}) : r?.valueType === "date" ? /* @__PURE__ */ Y("input", {
		type: "date",
		value: n.values?.[0] || "",
		onChange: c,
		className: "dc:w-full dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
	}) : r?.valueType === "number" ? /* @__PURE__ */ Y("input", {
		type: "number",
		value: n.values?.[0] ?? "",
		onChange: l,
		placeholder: "Enter number",
		className: "dc:w-full dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
	}) : a ? /* @__PURE__ */ Y(Ua, { ...e }) : /* @__PURE__ */ Y("input", {
		type: "text",
		value: n.values?.[0] ?? "",
		onChange: l,
		placeholder: "Enter value...",
		className: "dc:w-full dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text placeholder-dc-text-muted"
	}) : /* @__PURE__ */ Y("div", {
		className: "dc:text-sm text-dc-text-muted dc:italic dc:py-2",
		children: t("dashboardFilter.noValueRequired")
	});
}
//#endregion
//#region src/client/components/DashboardFilters/DashboardFilterConfigModalParts.tsx
var Ga = v("chevronDown"), Ka = v("dimension"), qa = v("timeDimension"), Ja = v("measure"), Ya = v("edit"), Xa = v("eye"), Za = v("eyeOff");
function Qa({ localFilter: e, activeSchema: t, isTimeField: n, isMeasureField: r, showAllFields: i, setShowAllFields: a, setShowFieldSearch: o }) {
	let { t: s } = R(), c = Xi(e.member, t), l = n ? qa : r ? Ja : Ka, u = n ? "bg-dc-time-dimension" : r ? "bg-dc-measure" : "bg-dc-dimension", d = n ? "text-dc-time-dimension-text" : r ? "text-dc-measure-text" : "text-dc-dimension-text";
	return /* @__PURE__ */ X("div", { children: [/* @__PURE__ */ X("div", {
		className: "dc:flex dc:items-center dc:justify-between dc:mb-2",
		children: [/* @__PURE__ */ Y("label", {
			className: "dc:block dc:text-sm dc:font-medium text-dc-text-secondary",
			children: s("dashboardFilter.field")
		}), /* @__PURE__ */ Y("button", {
			onClick: () => a(!i),
			className: "dc:flex dc:items-center dc:gap-1 dc:text-xs dc:px-2 dc:py-1 dc:rounded-sm hover:bg-dc-surface-hover text-dc-text-muted",
			title: i ? "Show dashboard fields only" : "Show all fields",
			children: i ? /* @__PURE__ */ X(J, { children: [/* @__PURE__ */ Y(Za, { className: "dc:w-3.5 dc:h-3.5" }), /* @__PURE__ */ Y("span", { children: s("dashboardFilter.dashboard") })] }) : /* @__PURE__ */ X(J, { children: [/* @__PURE__ */ Y(Xa, { className: "dc:w-3.5 dc:h-3.5" }), /* @__PURE__ */ Y("span", { children: s("dashboardFilter.all") })] })
		})]
	}), /* @__PURE__ */ X("button", {
		onClick: () => o(!0),
		className: "dc:w-full dc:flex dc:items-center dc:gap-2 dc:p-3 bg-dc-surface-secondary dc:rounded-sm hover:bg-dc-surface-tertiary dc:transition-colors",
		children: [e.member ? /* @__PURE__ */ X(J, { children: [/* @__PURE__ */ Y("span", {
			className: `dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded-sm ${u} ${d}`,
			children: l && /* @__PURE__ */ Y(l, { className: "dc:w-4 dc:h-4" })
		}), /* @__PURE__ */ Y("span", {
			className: "dc:flex-1 dc:text-sm dc:font-medium text-dc-text dc:text-left",
			children: c
		})] }) : /* @__PURE__ */ X(J, { children: [/* @__PURE__ */ Y("span", {
			className: "dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded-sm bg-dc-surface-tertiary text-dc-text-muted",
			children: /* @__PURE__ */ Y(Ka, { className: "dc:w-4 dc:h-4" })
		}), /* @__PURE__ */ Y("span", {
			className: "dc:flex-1 dc:text-sm text-dc-text-muted dc:text-left",
			children: s("dashboardFilter.clickToSelectField")
		})] }), /* @__PURE__ */ Y(Ya, { className: "dc:w-4 dc:h-4 text-dc-text-muted" })]
	})] });
}
function $a({ localFilter: e, operatorLabel: t, availableOperators: n, isOperatorDropdownOpen: r, setIsOperatorDropdownOpen: i, setIsValueDropdownOpen: a, setIsDateRangeDropdownOpen: o, handleOperatorChange: s }) {
	let { t: c } = R();
	return /* @__PURE__ */ X("div", { children: [/* @__PURE__ */ Y("label", {
		className: "dc:block dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2",
		children: c("dashboardFilter.operator")
	}), /* @__PURE__ */ X("div", {
		className: "dc:relative",
		children: [/* @__PURE__ */ X("button", {
			onClick: () => {
				a(!1), o(!1), i(!r);
			},
			className: "dc:w-full dc:flex dc:items-center dc:justify-between dc:text-left dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text hover:bg-dc-surface-hover",
			children: [/* @__PURE__ */ Y("span", {
				className: "dc:truncate",
				children: t
			}), /* @__PURE__ */ Y(Ga, { className: `dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0 dc:ml-2 dc:transition-transform ${r ? "dc:rotate-180" : ""}` })]
		}), r && /* @__PURE__ */ Y("div", {
			className: "dc:absolute dc:z-[60] dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded-sm dc:shadow-lg dc:max-h-48 dc:overflow-y-auto",
			children: n.map((t) => /* @__PURE__ */ Y("button", {
				onClick: () => s(t.operator),
				className: `dc:w-full dc:text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover ${t.operator === e.operator ? "bg-dc-primary/10 text-dc-primary" : "text-dc-text"}`,
				children: c(t.label)
			}, t.operator))
		})]
	})] });
}
//#endregion
//#region src/client/components/DashboardFilters/DashboardFilterConfigModal.tsx
var eo = v("close");
function to({ filter: e, fullSchema: t, filteredSchema: n, isOpen: r, onSave: i, onDelete: a, onClose: o }) {
	let { t: s } = R(), c = Ra({
		initialFilter: e,
		fullSchema: t,
		filteredSchema: n,
		isOpen: r,
		onSave: i
	});
	if (!r) return null;
	let { localLabel: l, setLocalLabel: u, localFilter: d, showAllFields: f, setShowAllFields: p, showFieldSearch: m, setShowFieldSearch: h, field: g, dropdowns: _, values: v, dateRange: y, handleFieldSelected: b, handleOperatorChange: x, handleDirectInput: S, handleBetweenStartInput: C, handleBetweenEndInput: w, handleDateInput: T, handleSave: E } = c, { containerRef: D, isOperatorDropdownOpen: O, setIsOperatorDropdownOpen: k, isValueDropdownOpen: A, setIsValueDropdownOpen: j, isDateRangeDropdownOpen: M, setIsDateRangeDropdownOpen: N } = _, { activeSchema: P, isTimeField: ee, isMeasureField: te, operatorMeta: F, availableOperators: I, operatorLabel: ne, shouldShowDateRange: L, shouldShowComboBox: z } = g, { distinctValues: B, valuesLoading: re, valuesError: ie, searchText: ae, setSearchText: oe, handleValueSelect: se, handleValueRemove: ce } = v, { rangeType: le, numberValue: ue, dateRangeLabel: de, handleRangeTypeChange: fe, handleNumberValueChange: pe, handleCustomStartDate: me, handleCustomEndDate: V } = y, he = !e.isUniversalTime, ge = d.member && !e.isUniversalTime, H = d.member && !e.isUniversalTime;
	return /* @__PURE__ */ X(J, { children: [/* @__PURE__ */ Y("div", {
		className: "dc:fixed dc:inset-0 dc:z-50 dc:flex dc:items-center dc:justify-center dc:p-4",
		style: { backgroundColor: "var(--dc-overlay)" },
		onClick: o,
		children: /* @__PURE__ */ X("div", {
			ref: D,
			className: "bg-dc-surface dc:rounded-lg dc:border border-dc-border dc:max-w-md dc:w-full dc:max-h-[90vh] dc:overflow-auto",
			style: { boxShadow: "var(--dc-shadow-xl)" },
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ X("div", {
					className: "dc:flex dc:items-center dc:justify-between dc:p-4 dc:border-b border-dc-border",
					children: [/* @__PURE__ */ Y("h2", {
						className: "dc:text-lg dc:font-semibold text-dc-text",
						children: s("dashboardFilter.editFilter")
					}), /* @__PURE__ */ Y("button", {
						onClick: o,
						className: "dc:p-1 text-dc-text-muted hover:text-dc-text dc:transition-colors",
						children: /* @__PURE__ */ Y(eo, { className: "dc:w-5 dc:h-5" })
					})]
				}),
				/* @__PURE__ */ X("div", {
					className: "dc:p-4 dc:space-y-4",
					children: [
						/* @__PURE__ */ X("div", { children: [/* @__PURE__ */ Y("label", {
							className: "dc:block dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2",
							children: s("dashboardFilter.filterLabel")
						}), /* @__PURE__ */ Y("input", {
							type: "text",
							value: l,
							onChange: (e) => u(e.target.value),
							placeholder: "Enter filter label",
							className: "dc:w-full dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
						})] }),
						e.isUniversalTime && /* @__PURE__ */ X("div", {
							className: "dc:p-3 dc:rounded-md bg-dc-info-bg dc:border border-dc-info-border",
							children: [/* @__PURE__ */ Y("div", {
								className: "dc:text-sm dc:font-medium text-dc-info dc:mb-1",
								children: s("dashboardFilter.universalTimeFilter")
							}), /* @__PURE__ */ Y("div", {
								className: "dc:text-xs text-dc-text-secondary",
								children: s("dashboardFilter.universalTimeDescription")
							})]
						}),
						he && /* @__PURE__ */ Y(Qa, {
							localFilter: d,
							activeSchema: P,
							isTimeField: ee,
							isMeasureField: te,
							showAllFields: f,
							setShowAllFields: p,
							setShowFieldSearch: h
						}),
						ge && /* @__PURE__ */ Y($a, {
							localFilter: d,
							operatorLabel: ne,
							availableOperators: I,
							isOperatorDropdownOpen: O,
							setIsOperatorDropdownOpen: k,
							setIsValueDropdownOpen: j,
							setIsDateRangeDropdownOpen: N,
							handleOperatorChange: x
						}),
						H && /* @__PURE__ */ X("div", { children: [/* @__PURE__ */ Y("label", {
							className: "dc:block dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2",
							children: s("dashboardFilter.defaultValue")
						}), /* @__PURE__ */ Y(Wa, {
							filter: d,
							operatorMeta: F,
							shouldShowDateRange: L,
							shouldShowComboBox: z,
							rangeType: le,
							numberValue: ue,
							dateRangeLabel: de,
							isDateRangeDropdownOpen: M,
							setIsOperatorDropdownOpen: k,
							setIsValueDropdownOpen: j,
							setIsDateRangeDropdownOpen: N,
							handleRangeTypeChange: fe,
							handleNumberValueChange: pe,
							handleCustomStartDate: me,
							handleCustomEndDate: V,
							handleBetweenStartInput: C,
							handleBetweenEndInput: w,
							handleDateInput: T,
							handleDirectInput: S,
							isValueDropdownOpen: A,
							distinctValues: B,
							valuesLoading: re,
							valuesError: ie,
							searchText: ae,
							setSearchText: oe,
							handleValueSelect: se,
							handleValueRemove: ce
						})] })
					]
				}),
				/* @__PURE__ */ X("div", {
					className: "dc:flex dc:items-center dc:justify-between dc:p-4 dc:border-t border-dc-border",
					children: [/* @__PURE__ */ Y("button", {
						onClick: a,
						className: "dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-dc-danger hover:bg-dc-danger-bg dc:rounded-sm dc:transition-colors",
						children: s("dashboardFilter.deleteFilter")
					}), /* @__PURE__ */ X("div", {
						className: "dc:flex dc:items-center dc:gap-2",
						children: [/* @__PURE__ */ Y("button", {
							onClick: o,
							className: "dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-dc-text-secondary hover:text-dc-text dc:transition-colors",
							children: s("common.actions.cancel")
						}), /* @__PURE__ */ Y("button", {
							onClick: E,
							className: "dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-dc-primary-content bg-dc-primary hover:bg-dc-primary-hover dc:rounded-sm dc:transition-colors",
							children: s("common.actions.done")
						})]
					})]
				})
			]
		})
	}), m && /* @__PURE__ */ Y(xa, {
		isOpen: m,
		onClose: () => h(!1),
		onSelect: b,
		mode: "filter",
		schema: P,
		selectedFields: d.member ? [d.member] : []
	})] });
}
//#endregion
//#region src/client/components/DashboardFilters/FilterEditModal.tsx
var no = ({ filter: e, schema: t, dashboardConfig: n, isOpen: r, onSave: i, onClose: a, onDelete: o, convertToMetaResponse: s }) => {
	let c = G(() => s(t), [t, s]), l = G(() => at(n), [n]), u = G(() => {
		if (!t) return null;
		let e = t.cubes.map((e) => {
			let t = e.name, n = e.measures.filter((e) => {
				let n = e.name.includes(".") ? e.name : `${t}.${e.name}`;
				return l.measures.has(n);
			}), r = e.dimensions.filter((e) => {
				let n = e.name.includes(".") ? e.name : `${t}.${e.name}`;
				return l.dimensions.has(n) || l.timeDimensions.has(n);
			});
			return n.length > 0 || r.length > 0 ? {
				...e,
				measures: n,
				dimensions: r
			} : null;
		}).filter((e) => e !== null);
		return s({
			...t,
			cubes: e
		});
	}, [
		t,
		l,
		s
	]), d = U(async (e) => {
		try {
			await i(e), a();
		} catch (e) {
			console.error("Failed to save filter:", e), alert("Failed to save filter. Please try again.");
		}
	}, [i, a]);
	return r ? /* @__PURE__ */ Y(to, {
		filter: e,
		fullSchema: c,
		filteredSchema: u,
		isOpen: r,
		onSave: d,
		onDelete: o,
		onClose: a
	}) : null;
}, ro = v("filter"), io = v("add"), ao = v("close"), oo = v("edit"), so = v("chevronDown"), co = v("timeDimension"), lo = ({ dashboardFilters: e, onAddFilter: t, onAddTimeFilter: n, onEditFilter: r, onRemoveFilter: i, selectedFilterId: a, onFilterSelect: o }) => {
	let { t: s } = R(), [c, l] = de.useState(!1), u = (e) => {
		let { id: t, label: n, isUniversalTime: s } = e, c = a === t;
		return /* @__PURE__ */ X("div", {
			className: "dc:inline-flex dc:items-center dc:gap-1.5 dc:px-2.5 dc:py-1 dc:rounded-md dc:border dc:text-xs dc:transition-all dc:cursor-pointer dc:hover:shadow-md",
			style: {
				backgroundColor: c ? "var(--dc-primary)" : "var(--dc-surface)",
				borderColor: c ? "var(--dc-primary)" : "var(--dc-border)",
				borderWidth: c ? "2px" : "1px",
				color: c ? "white" : "var(--dc-text)",
				boxShadow: c ? "0 0 0 3px rgba(var(--dc-primary-rgb), 0.1)" : "none"
			},
			onClick: () => {
				o && o(t);
			},
			children: [
				/* @__PURE__ */ Y(s ? co : ro, {
					className: "dc:w-3.5 dc:h-3.5 dc:shrink-0",
					style: { color: c ? "white" : "var(--dc-primary)" }
				}),
				/* @__PURE__ */ Y("span", {
					className: "dc:font-medium dc:truncate",
					children: n
				}),
				!c && /* @__PURE__ */ X("div", {
					className: "dc:flex dc:items-center dc:gap-0.5 dc:ml-1",
					onClick: (e) => e.stopPropagation(),
					children: [/* @__PURE__ */ Y("button", {
						onClick: () => r(t),
						className: "dc:p-0.5 hover:bg-dc-hover dc:rounded-sm dc:transition-colors",
						title: "Edit filter",
						children: /* @__PURE__ */ Y(oo, { className: "dc:w-3 dc:h-3" })
					}), /* @__PURE__ */ Y("button", {
						onClick: () => i(t),
						className: "dc:p-0.5 hover:bg-dc-danger-bg hover:text-dc-danger dc:rounded-sm dc:transition-colors",
						title: "Remove filter",
						children: /* @__PURE__ */ Y(ao, { className: "dc:w-3 dc:h-3" })
					})]
				})
			]
		}, t);
	};
	return /* @__PURE__ */ X(J, { children: [/* @__PURE__ */ X("div", {
		className: "dc:md:hidden",
		children: [
			/* @__PURE__ */ X("div", {
				className: "dc:px-4 dc:py-2 dc:flex dc:items-center dc:justify-between dc:cursor-pointer",
				onClick: () => l(!c),
				children: [/* @__PURE__ */ X("div", {
					className: "dc:flex dc:items-center dc:gap-2",
					children: [
						/* @__PURE__ */ Y(ro, {
							className: "dc:w-4 dc:h-4 dc:shrink-0",
							style: { color: "var(--dc-primary)" }
						}),
						/* @__PURE__ */ Y("h3", {
							className: "dc:text-sm dc:font-semibold",
							style: { color: "var(--dc-text)" },
							children: s("dashboardFilter.editMode.filters")
						}),
						e.length > 0 && /* @__PURE__ */ Y("span", {
							className: "dc:px-1.5 dc:py-0.5 dc:rounded-full dc:text-xs dc:font-medium",
							style: {
								backgroundColor: "var(--dc-primary)",
								color: "white"
							},
							children: e.length
						}),
						/* @__PURE__ */ Y(so, {
							className: `dc:w-4 dc:h-4 dc:transition-transform ${c ? "" : "dc:rotate-180"}`,
							style: { color: "var(--dc-text-secondary)" }
						})
					]
				}), /* @__PURE__ */ X("div", {
					className: "dc:flex dc:items-center dc:gap-1",
					children: [!e.some((e) => e.isUniversalTime) && /* @__PURE__ */ X("button", {
						onClick: (e) => {
							e.stopPropagation(), n();
						},
						className: "dc:inline-flex dc:items-center dc:gap-1 dc:px-2 dc:py-1 dc:rounded-md dc:text-xs dc:font-medium dc:transition-colors dc:hover:opacity-80",
						style: {
							backgroundColor: "var(--dc-surface)",
							color: "var(--dc-primary)",
							border: "1px solid var(--dc-border)"
						},
						title: "Add date range filter (applies to all time dimensions)",
						children: [/* @__PURE__ */ Y(io, { className: "dc:w-3.5 dc:h-3.5" }), /* @__PURE__ */ Y(co, { className: "dc:w-3.5 dc:h-3.5" })]
					}), /* @__PURE__ */ Y("button", {
						onClick: (e) => {
							e.stopPropagation(), t();
						},
						className: "dc:inline-flex dc:items-center dc:gap-1 dc:px-2 dc:py-1 dc:rounded-md dc:text-xs dc:font-medium dc:transition-colors dc:hover:opacity-80",
						style: {
							backgroundColor: "var(--dc-primary)",
							color: "white"
						},
						children: /* @__PURE__ */ Y(io, { className: "dc:w-3.5 dc:h-3.5" })
					})]
				})]
			}),
			e.length > 0 && !c && /* @__PURE__ */ Y("div", {
				className: "dc:px-4 dc:pb-2 dc:flex dc:flex-col dc:gap-2",
				children: e.map(u)
			}),
			e.length === 0 && !c && /* @__PURE__ */ Y("div", {
				className: "dc:px-4 dc:pb-2",
				children: /* @__PURE__ */ Y("div", {
					className: "dc:text-xs dc:p-2 dc:rounded-md dc:text-center",
					style: {
						backgroundColor: "var(--dc-surface-secondary)",
						color: "var(--dc-text-secondary)"
					},
					children: s("dashboardFilter.editMode.noFilters")
				})
			})
		]
	}), /* @__PURE__ */ X("div", {
		className: "dc:hidden dc:md:flex dc:md:items-center dc:md:gap-3 dc:px-4 dc:py-2",
		children: [
			/* @__PURE__ */ X("div", {
				className: "dc:flex dc:items-center dc:gap-2 dc:shrink-0",
				children: [
					/* @__PURE__ */ Y(ro, {
						className: "dc:w-4 dc:h-4 dc:shrink-0",
						style: { color: "var(--dc-primary)" }
					}),
					/* @__PURE__ */ Y("h3", {
						className: "dc:text-sm dc:font-semibold dc:whitespace-nowrap",
						style: { color: "var(--dc-text)" },
						children: s("dashboardFilter.editMode.filters")
					}),
					e.length > 0 && /* @__PURE__ */ Y("span", {
						className: "dc:px-1.5 dc:py-0.5 dc:rounded-full dc:text-xs dc:font-medium",
						style: {
							backgroundColor: "var(--dc-primary)",
							color: "white"
						},
						children: e.length
					})
				]
			}),
			e.length > 0 ? /* @__PURE__ */ Y("div", {
				className: "dc:flex dc:flex-wrap dc:gap-2 dc:flex-1 dc:min-w-0",
				children: e.map(u)
			}) : /* @__PURE__ */ Y("div", {
				className: "dc:flex-1 dc:min-w-0",
				children: /* @__PURE__ */ Y("div", {
					className: "dc:text-xs dc:px-3 dc:py-1 dc:rounded-md dc:inline-block",
					style: {
						backgroundColor: "var(--dc-surface-secondary)",
						color: "var(--dc-text-secondary)"
					},
					children: s("dashboardFilter.editMode.noFilters")
				})
			}),
			/* @__PURE__ */ X("div", {
				className: "dc:flex dc:items-center dc:gap-1 dc:shrink-0",
				children: [!e.some((e) => e.isUniversalTime) && /* @__PURE__ */ X("button", {
					onClick: n,
					className: "dc:inline-flex dc:items-center dc:gap-1 dc:px-2 dc:py-1 dc:rounded-md dc:text-xs dc:font-medium dc:transition-colors dc:hover:opacity-80",
					style: {
						backgroundColor: "var(--dc-surface)",
						color: "var(--dc-primary)",
						border: "1px solid var(--dc-border)"
					},
					title: "Add date range filter (applies to all time dimensions)",
					children: [/* @__PURE__ */ Y(io, { className: "dc:w-3.5 dc:h-3.5" }), /* @__PURE__ */ Y("span", { children: s("dashboardFilter.editMode.dateRange") })]
				}), /* @__PURE__ */ X("button", {
					onClick: t,
					className: "dc:inline-flex dc:items-center dc:gap-1 dc:px-2 dc:py-1 dc:rounded-md dc:text-xs dc:font-medium dc:transition-colors dc:hover:opacity-80",
					style: {
						backgroundColor: "var(--dc-primary)",
						color: "white"
					},
					children: [/* @__PURE__ */ Y(io, { className: "dc:w-3.5 dc:h-3.5" }), /* @__PURE__ */ Y("span", { children: s("dashboardFilter.editMode.filter") })]
				})]
			})
		]
	})] });
}, uo = {
	set: "is set",
	notSet: "is not set",
	isEmpty: "is empty",
	isNotEmpty: "is not empty"
}, fo = {
	gt: ">",
	gte: ">=",
	lt: "<",
	lte: "<="
}, po = {
	contains: "contains",
	notContains: "!contains",
	startsWith: "starts with",
	endsWith: "ends with"
};
function mo(e) {
	return e === !0 ? "true" : e === !1 ? "false" : e == null ? "null" : String(e);
}
function ho(e, t) {
	if (!e || e.length === 0) return uo[t] ?? "";
	let n = e.map(mo);
	if (fo[t]) return `${fo[t]} ${n[0]}`;
	if (po[t]) return `${po[t]} "${n[0]}"`;
	switch (t) {
		case "equals": return n.length === 1 ? `= ${n[0]}` : `in (${n.join(", ")})`;
		case "notEquals": return n.length === 1 ? `!= ${n[0]}` : `not in (${n.join(", ")})`;
		case "between": return `${n[0]} - ${n[1] || "?"}`;
		case "in": return `in (${n.join(", ")})`;
		case "notIn": return `not in (${n.join(", ")})`;
		case "set": return "is set";
		case "notSet": return "is not set";
		default: return n.join(", ");
	}
}
//#endregion
//#region src/client/components/DashboardFilters/useCompactFilterBar.ts
function go(e, t) {
	let [n, r] = q(e);
	W(() => {
		r(e);
	}, [e]);
	let [i, a] = q(!1), [o, s] = q(!1), c = K(null), l = K(null), u = G(() => n.find((e) => e.isUniversalTime), [n]), d = G(() => {
		if (!u) return null;
		let e = u.filter;
		return e.dateRange ? e.dateRange : e.values && e.values.length > 0 ? e.values.length === 1 && typeof e.values[0] == "string" ? e.values[0] : e.values : null;
	}, [u]), f = G(() => ja(d), [d]), p = G(() => {
		if (!d || Array.isArray(d)) return null;
		let e = ja(d);
		return wa.find((t) => t.id === e)?.id || null;
	}, [d]), m = G(() => n.filter((e) => !e.isUniversalTime), [n]), h = U(() => `df_${Date.now()}_${Math.random().toString(36).substring(7)}`, []), g = U((e) => {
		if (u) {
			let i = n.map((t) => t.id === u.id ? {
				...t,
				filter: {
					...t.filter,
					values: Array.isArray(e) ? e : [e],
					dateRange: e
				}
			} : t);
			r(i), t(i);
		} else {
			let i = {
				id: h(),
				label: "Date Range",
				isUniversalTime: !0,
				filter: {
					member: "__universal_time__",
					operator: "inDateRange",
					values: Array.isArray(e) ? e : [e],
					dateRange: e
				}
			}, a = [...n, i];
			r(a), t(a);
		}
	}, [
		n,
		u,
		t,
		h
	]);
	return {
		localFilters: n,
		showCustomDropdown: i,
		setShowCustomDropdown: a,
		showXTDDropdown: o,
		setShowXTDDropdown: s,
		customButtonRef: c,
		xtdButtonRef: l,
		currentDateRange: d,
		activePresetId: f,
		activeXTDId: p,
		nonDateFilters: m,
		handlePresetSelect: U((e) => {
			g(e);
		}, [g]),
		handleXTDSelect: U((e) => {
			g(e), s(!1);
		}, [g]),
		handleCustomDateSelect: U((e) => {
			g(e), a(!1);
		}, [g]),
		handleFilterChange: U((e, i) => {
			let a = n.map((t) => t.id === e ? i : t);
			r(a), t(a);
		}, [n, t]),
		dateRangeTooltip: G(() => {
			if (!d) return null;
			if (Array.isArray(d)) return Aa(new Date(d[0]), new Date(d[1] || d[0]));
			let e = ka(d);
			return e ? Aa(e.start, e.end) : d;
		}, [d])
	};
}
//#endregion
//#region src/client/components/DashboardFilters/DatePresetChips.tsx
var _o = ({ activePreset: e, onPresetSelect: t, disabled: n = !1 }) => {
	let { t: r } = R(), i = G(() => {
		let e = {};
		for (let t of Ca) {
			let n = ka(t.value);
			n && (e[t.id] = Aa(n.start, n.end));
		}
		return e;
	}, []);
	return /* @__PURE__ */ Y("div", {
		className: "dc:flex dc:items-center dc:gap-1",
		children: Ca.map((a) => {
			let o = e === a.id, s = i[a.id];
			return /* @__PURE__ */ Y("button", {
				type: "button",
				onClick: () => t(a.value),
				disabled: n,
				title: s,
				className: `
              dc:px-2.5 dc:py-1 dc:rounded-sm dc:text-xs dc:font-medium dc:transition-colors
              dc:focus:outline-none dc:focus:ring-2 dc:focus:ring-offset-1
              dc:disabled:opacity-50 dc:disabled:cursor-not-allowed
              ${o ? "dc:shadow-sm" : "dc:border"}
            `,
				style: {
					backgroundColor: o ? "var(--dc-primary)" : "var(--dc-surface)",
					color: o ? "white" : "var(--dc-text)",
					borderColor: o ? "transparent" : "var(--dc-border)",
					...n ? {} : { cursor: "pointer" }
				},
				onMouseEnter: (e) => {
					!o && !n && (e.currentTarget.style.backgroundColor = "var(--dc-surface-hover)");
				},
				onMouseLeave: (e) => {
					!o && !n && (e.currentTarget.style.backgroundColor = "var(--dc-surface)");
				},
				children: r(a.label)
			}, a.id);
		})
	});
}, vo = [
	{
		value: "days",
		label: "dashboardFilter.units.days"
	},
	{
		value: "weeks",
		label: "dashboardFilter.units.weeks"
	},
	{
		value: "months",
		label: "dashboardFilter.units.months"
	},
	{
		value: "quarters",
		label: "dashboardFilter.units.quarters"
	},
	{
		value: "years",
		label: "dashboardFilter.units.years"
	}
], yo = ({ isOpen: e, onClose: t, onDateRangeChange: n, currentDateRange: r }) => {
	let { t: i } = R(), a = K(null), [o, s] = q("fixed"), [c, l] = q(""), [u, d] = q(""), [f, p] = q(""), [m, h] = q(7), [g, _] = q("days");
	W(() => {
		if (r) {
			if (Array.isArray(r)) s("fixed"), l(r[0] || ""), d(r[1] || r[0] || "");
			else {
				let e = r.match(/^last\s+(\d+)\s+(day|days|week|weeks|month|months|quarter|quarters|year|years)$/i);
				if (e) {
					s("last"), h(parseInt(e[1], 10));
					let t = e[2].toLowerCase();
					_(t === "day" ? "days" : t === "week" ? "weeks" : t === "month" ? "months" : t === "quarter" ? "quarters" : t === "year" ? "years" : t.endsWith("s") ? t : `${t}s`);
				}
			}
		}
	}, [r]), W(() => {
		if (!e) return;
		let n = (e) => {
			a.current && !a.current.contains(e.target) && t();
		}, r = (e) => {
			e.key === "Escape" && t();
		}, i = setTimeout(() => {
			document.addEventListener("mousedown", n), document.addEventListener("keydown", r);
		}, 0);
		return () => {
			clearTimeout(i), document.removeEventListener("mousedown", n), document.removeEventListener("keydown", r);
		};
	}, [e, t]);
	let v = U(() => {
		c && u ? n([c, u]) : c && n([c, c]);
	}, [
		c,
		u,
		n
	]), y = U(() => {
		if (f) {
			let e = T(/* @__PURE__ */ new Date());
			n([f, e]);
		}
	}, [f, n]), b = U(() => {
		if (m > 0) {
			let e = `last_n_${g}`;
			n(O(e, m));
		}
	}, [
		m,
		g,
		n
	]);
	if (!e) return null;
	let x = (e) => ({
		backgroundColor: e ? "var(--dc-primary)" : "transparent",
		color: e ? "white" : "var(--dc-text)",
		borderBottom: e ? "none" : "2px solid var(--dc-border)"
	}), S = (e) => {
		e.stopPropagation();
	};
	return /* @__PURE__ */ X("div", {
		ref: a,
		className: "dc:absolute dc:top-full dc:left-0 dc:mt-1 dc:z-50 dc:border dc:rounded-lg dc:shadow-lg dc:min-w-[280px]",
		style: {
			backgroundColor: "var(--dc-surface)",
			borderColor: "var(--dc-border)",
			boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)"
		},
		onClick: S,
		onMouseDown: S,
		children: [
			/* @__PURE__ */ Y("div", {
				className: "dc:flex dc:border-b",
				style: { borderColor: "var(--dc-border)" },
				children: [
					"fixed",
					"since",
					"last"
				].map((e) => /* @__PURE__ */ Y("button", {
					type: "button",
					onClick: () => s(e),
					className: "dc:flex-1 dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:capitalize dc:transition-colors",
					style: x(o === e),
					children: i(`dashboardFilter.customTabs.${e}`)
				}, e))
			}),
			/* @__PURE__ */ X("div", {
				className: "dc:p-4",
				children: [
					o === "fixed" && /* @__PURE__ */ X("div", {
						className: "dc:space-y-3",
						children: [
							/* @__PURE__ */ X("div", { children: [/* @__PURE__ */ Y("label", {
								className: "dc:block dc:text-xs dc:font-medium dc:mb-1",
								style: { color: "var(--dc-text-secondary)" },
								children: i("dashboardFilter.customDate.startDate")
							}), /* @__PURE__ */ Y("input", {
								type: "date",
								value: c,
								onChange: (e) => l(e.target.value),
								className: "dc:w-full dc:px-3 dc:py-2 dc:text-sm dc:border dc:rounded-sm dc:focus:outline-none dc:focus:ring-2",
								style: {
									borderColor: "var(--dc-border)",
									backgroundColor: "var(--dc-bg)",
									color: "var(--dc-text)"
								}
							})] }),
							/* @__PURE__ */ X("div", { children: [/* @__PURE__ */ Y("label", {
								className: "dc:block dc:text-xs dc:font-medium dc:mb-1",
								style: { color: "var(--dc-text-secondary)" },
								children: i("dashboardFilter.customDate.endDate")
							}), /* @__PURE__ */ Y("input", {
								type: "date",
								value: u,
								onChange: (e) => d(e.target.value),
								className: "dc:w-full dc:px-3 dc:py-2 dc:text-sm dc:border dc:rounded-sm dc:focus:outline-none dc:focus:ring-2",
								style: {
									borderColor: "var(--dc-border)",
									backgroundColor: "var(--dc-bg)",
									color: "var(--dc-text)"
								}
							})] }),
							/* @__PURE__ */ Y("button", {
								type: "button",
								onClick: v,
								disabled: !c,
								className: "dc:w-full dc:py-2 dc:text-sm dc:font-medium dc:rounded-sm dc:transition-colors dc:disabled:opacity-50 dc:disabled:cursor-not-allowed",
								style: {
									backgroundColor: "var(--dc-primary)",
									color: "white"
								},
								children: i("common.actions.apply")
							})
						]
					}),
					o === "since" && /* @__PURE__ */ X("div", {
						className: "dc:space-y-3",
						children: [
							/* @__PURE__ */ X("div", { children: [/* @__PURE__ */ Y("label", {
								className: "dc:block dc:text-xs dc:font-medium dc:mb-1",
								style: { color: "var(--dc-text-secondary)" },
								children: i("dashboardFilter.customDate.sinceDate")
							}), /* @__PURE__ */ Y("input", {
								type: "date",
								value: f,
								onChange: (e) => p(e.target.value),
								className: "dc:w-full dc:px-3 dc:py-2 dc:text-sm dc:border dc:rounded-sm dc:focus:outline-none dc:focus:ring-2",
								style: {
									borderColor: "var(--dc-border)",
									backgroundColor: "var(--dc-bg)",
									color: "var(--dc-text)"
								}
							})] }),
							/* @__PURE__ */ Y("p", {
								className: "dc:text-xs",
								style: { color: "var(--dc-text-secondary)" },
								children: i("dashboardFilter.customDate.fromSelectedToToday")
							}),
							/* @__PURE__ */ Y("button", {
								type: "button",
								onClick: y,
								disabled: !f,
								className: "dc:w-full dc:py-2 dc:text-sm dc:font-medium dc:rounded-sm dc:transition-colors dc:disabled:opacity-50 dc:disabled:cursor-not-allowed",
								style: {
									backgroundColor: "var(--dc-primary)",
									color: "white"
								},
								children: i("common.actions.apply")
							})
						]
					}),
					o === "last" && /* @__PURE__ */ X("div", {
						className: "dc:space-y-3",
						children: [
							/* @__PURE__ */ X("div", {
								className: "dc:flex dc:gap-2",
								children: [/* @__PURE__ */ X("div", {
									className: "dc:flex-1",
									children: [/* @__PURE__ */ Y("label", {
										className: "dc:block dc:text-xs dc:font-medium dc:mb-1",
										style: { color: "var(--dc-text-secondary)" },
										children: i("dashboardFilter.customDate.number")
									}), /* @__PURE__ */ Y("input", {
										type: "number",
										min: "1",
										max: "999",
										value: m,
										onChange: (e) => h(Math.max(1, parseInt(e.target.value, 10) || 1)),
										className: "dc:w-full dc:px-3 dc:py-2 dc:text-sm dc:border dc:rounded-sm dc:focus:outline-none dc:focus:ring-2",
										style: {
											borderColor: "var(--dc-border)",
											backgroundColor: "var(--dc-bg)",
											color: "var(--dc-text)"
										}
									})]
								}), /* @__PURE__ */ X("div", {
									className: "dc:flex-1",
									children: [/* @__PURE__ */ Y("label", {
										className: "dc:block dc:text-xs dc:font-medium dc:mb-1",
										style: { color: "var(--dc-text-secondary)" },
										children: i("dashboardFilter.customDate.unit")
									}), /* @__PURE__ */ Y("select", {
										value: g,
										onChange: (e) => _(e.target.value),
										className: "dc:w-full dc:px-3 dc:py-2 dc:text-sm dc:border dc:rounded-sm dc:focus:outline-none dc:focus:ring-2",
										style: {
											borderColor: "var(--dc-border)",
											backgroundColor: "var(--dc-bg)",
											color: "var(--dc-text)"
										},
										children: vo.map((e) => /* @__PURE__ */ Y("option", {
											value: e.value,
											children: i(e.label)
										}, e.value))
									})]
								})]
							}),
							/* @__PURE__ */ Y("p", {
								className: "dc:text-xs",
								style: { color: "var(--dc-text-secondary)" },
								children: i("dashboardFilter.customDate.lastNPreview", {
									number: m,
									unit: m === 1 ? g.slice(0, -1) : g
								})
							}),
							/* @__PURE__ */ Y("button", {
								type: "button",
								onClick: b,
								disabled: m < 1,
								className: "dc:w-full dc:py-2 dc:text-sm dc:font-medium dc:rounded-sm dc:transition-colors dc:disabled:opacity-50 dc:disabled:cursor-not-allowed",
								style: {
									backgroundColor: "var(--dc-primary)",
									color: "white"
								},
								children: i("common.actions.apply")
							})
						]
					})
				]
			}),
			/* @__PURE__ */ Y("div", {
				className: "dc:px-4 dc:pb-4",
				children: /* @__PURE__ */ Y("button", {
					type: "button",
					onClick: t,
					className: "dc:w-full dc:py-2 dc:text-sm dc:font-medium dc:rounded-sm dc:border dc:transition-colors",
					style: {
						borderColor: "var(--dc-border)",
						color: "var(--dc-text-secondary)",
						backgroundColor: "transparent"
					},
					children: i("common.actions.cancel")
				})
			})
		]
	});
}, bo = v("check"), xo = ({ isOpen: e, onClose: t, onSelect: n, currentXTD: r }) => {
	let { t: i } = R(), a = K(null);
	if (W(() => {
		if (!e) return;
		let n = (e) => {
			a.current && !a.current.contains(e.target) && t();
		}, r = (e) => {
			e.key === "Escape" && t();
		}, i = setTimeout(() => {
			document.addEventListener("mousedown", n), document.addEventListener("keydown", r);
		}, 0);
		return () => {
			clearTimeout(i), document.removeEventListener("mousedown", n), document.removeEventListener("keydown", r);
		};
	}, [e, t]), !e) return null;
	let o = (e) => {
		e.stopPropagation();
	};
	return /* @__PURE__ */ Y("div", {
		ref: a,
		className: "dc:absolute dc:top-full dc:left-0 dc:mt-1 dc:z-50 dc:border dc:rounded-lg dc:shadow-lg dc:min-w-[180px] dc:py-1",
		style: {
			backgroundColor: "var(--dc-surface)",
			borderColor: "var(--dc-border)",
			boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)"
		},
		onClick: o,
		onMouseDown: o,
		children: wa.map((e) => {
			let t = r === e.id, a = ka(e.value), o = a ? Aa(a.start, a.end) : "";
			return /* @__PURE__ */ X("button", {
				type: "button",
				onClick: () => n(e.value),
				className: "dc:w-full dc:px-3 dc:py-2 dc:text-left dc:text-sm dc:transition-colors dc:flex dc:items-center dc:justify-between dc:gap-2",
				style: {
					backgroundColor: t ? "var(--dc-primary-bg)" : "transparent",
					color: "var(--dc-text)"
				},
				onMouseEnter: (e) => {
					t || (e.currentTarget.style.backgroundColor = "var(--dc-surface-hover)");
				},
				onMouseLeave: (e) => {
					t || (e.currentTarget.style.backgroundColor = "transparent");
				},
				children: [/* @__PURE__ */ X("div", {
					className: "dc:flex dc:flex-col",
					children: [/* @__PURE__ */ Y("span", {
						className: "dc:font-medium",
						children: i(e.label)
					}), o && /* @__PURE__ */ Y("span", {
						className: "dc:text-xs dc:mt-0.5",
						style: { color: "var(--dc-text-secondary)" },
						children: o
					})]
				}), t && /* @__PURE__ */ Y(bo, {
					className: "dc:w-4 dc:h-4 dc:shrink-0",
					style: { color: "var(--dc-primary)" }
				})]
			}, e.id);
		})
	});
}, So = [
	"equals",
	"notEquals",
	"in",
	"notIn"
];
function Co({ fieldName: e, operator: t, values: n, onValuesChange: r, schema: i }) {
	let a = qe[t], [o, s] = q(!1), [c, l] = q(""), [u, d] = q(!1), f = K(null), p = K(""), m = N(c, 300), h = G(() => i ? i.cubes.some((t) => t.dimensions.some((t) => t.name === e)) : !1, [i, e]), g = G(() => i ? i.cubes.some((t) => t.dimensions.some((t) => t.name === e && t.type === "time")) : !1, [i, e]), _ = G(() => So.includes(t) && h && !g, [
		t,
		h,
		g
	]), v = _, { values: y, loading: b, error: x, searchValues: S } = P(e, _);
	return W(() => {
		let e = (e) => {
			f.current && !f.current.contains(e.target) && s(!1);
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, []), W(() => {
		o && _ && S && (S("", !0), d(!0), p.current = "");
	}, [
		o,
		_,
		S
	]), W(() => {
		u && _ && S && m !== p.current && (p.current = m, S(m));
	}, [
		m,
		u,
		_,
		S
	]), {
		operatorMeta: a,
		isOpen: o,
		searchText: c,
		hasLoadedInitial: u,
		dropdownRef: f,
		isTimeDimension: g,
		shouldShowComboBox: v,
		distinctValues: y,
		valuesLoading: b,
		valuesError: x,
		handleDropdownToggle: U(() => {
			let e = !o;
			s(e), e || (l(""), p.current = "");
		}, [o]),
		handleSearchChange: U((e) => {
			l(e.target.value);
		}, []),
		handleValueSelect: U((e) => {
			a.supportsMultipleValues ? n.includes(e) || r([...n, e]) : (r([e]), s(!1)), l("");
		}, [
			a.supportsMultipleValues,
			n,
			r
		]),
		handleValueRemove: U((e) => {
			r(n.filter((t) => t !== e));
		}, [n, r]),
		handleDirectInput: U((e) => {
			let t = e.target.value;
			if (a.valueType === "number") {
				let e = parseFloat(t);
				isNaN(e) ? (t === "" || t === "-") && r([]) : r([e]);
			} else r(t ? [t] : []);
		}, [a.valueType, r]),
		handleDateInput: U((e) => {
			let i = e.target.value;
			r(t === "inDateRange" ? [i, (n.length >= 2 ? n : ["", ""])[1]] : i ? [i] : []);
		}, [
			t,
			n,
			r
		]),
		handleDateRangeEndInput: U((e) => {
			let t = e.target.value;
			r([(n.length >= 2 ? n : ["", ""])[0], t]);
		}, [n, r]),
		handleBetweenStartInput: U((e) => {
			let t = parseFloat(e.target.value), i = n.length >= 2 ? n : ["", ""];
			r([isNaN(t) ? e.target.value === "" ? "" : i[0] : t, i[1]].filter((e) => e !== ""));
		}, [n, r]),
		handleBetweenEndInput: U((e) => {
			let t = parseFloat(e.target.value), i = n.length >= 2 ? n : ["", ""];
			r([i[0], isNaN(t) ? e.target.value === "" ? "" : i[1] : t].filter((e) => e !== ""));
		}, [n, r])
	};
}
//#endregion
//#region src/client/components/shared/filterValueSelector/FilterValueInputs.tsx
var wo = v("chevronDown"), To = v("close"), Eo = "dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent";
function Do() {
	return /* @__PURE__ */ Y("div", {
		className: "dc:text-sm text-dc-text-muted dc:italic",
		children: "No value required"
	});
}
function Oo({ values: e, onStartChange: t, onEndChange: n }) {
	return /* @__PURE__ */ X("div", {
		className: "dc:flex dc:items-center dc:space-x-2",
		children: [
			/* @__PURE__ */ Y("input", {
				type: "date",
				value: e[0] || "",
				onChange: t,
				className: Eo
			}),
			/* @__PURE__ */ Y("span", {
				className: "dc:text-sm text-dc-text-muted",
				children: "to"
			}),
			/* @__PURE__ */ Y("input", {
				type: "date",
				value: e[1] || "",
				onChange: n,
				className: Eo
			})
		]
	});
}
function ko({ values: e, onStartChange: t, onEndChange: n }) {
	return /* @__PURE__ */ X("div", {
		className: "dc:flex dc:items-center dc:space-x-2",
		children: [
			/* @__PURE__ */ Y("input", {
				type: "number",
				value: e[0] !== void 0 && e[0] !== null ? e[0] : "",
				onChange: t,
				placeholder: "Min",
				className: Eo
			}),
			/* @__PURE__ */ Y("span", {
				className: "dc:text-sm text-dc-text-muted",
				children: "to"
			}),
			/* @__PURE__ */ Y("input", {
				type: "number",
				value: e[1] !== void 0 && e[1] !== null ? e[1] : "",
				onChange: n,
				placeholder: "Max",
				className: Eo
			})
		]
	});
}
function Ao({ values: e, onChange: t }) {
	return /* @__PURE__ */ Y("input", {
		type: "date",
		value: e[0] || "",
		onChange: t,
		className: Eo
	});
}
function jo({ values: e, onChange: t }) {
	return /* @__PURE__ */ Y("input", {
		type: "number",
		value: e[0] !== void 0 && e[0] !== null ? e[0] : "",
		onChange: t,
		placeholder: "Enter number",
		className: Eo
	});
}
function Mo({ values: e, onChange: t, valueType: n }) {
	return /* @__PURE__ */ Y("input", {
		type: "text",
		value: e[0] !== void 0 && e[0] !== null ? e[0] : "",
		onChange: t,
		placeholder: `Enter ${n} value`,
		className: Eo
	});
}
function No({ value: e, onRemove: t }) {
	return /* @__PURE__ */ X("div", {
		className: "dc:inline-flex dc:items-center bg-dc-time-dimension text-dc-time-dimension dc:text-xs dc:px-2 dc:py-1 dc:rounded-sm dc:border border-dc-time-dimension",
		children: [/* @__PURE__ */ Y("span", {
			className: "dc:mr-1",
			children: String(e)
		}), /* @__PURE__ */ Y("button", {
			onClick: t,
			className: "text-dc-accent hover:text-dc-accent focus:outline-hidden",
			children: /* @__PURE__ */ Y(To, { className: "dc:w-3 dc:h-3" })
		})]
	});
}
function Po({ values: e, onValuesChange: t, onValueRemove: n }) {
	return /* @__PURE__ */ X("div", {
		className: "dc:space-y-2 dc:min-w-0 dc:max-w-full",
		children: [e.length > 0 && /* @__PURE__ */ Y("div", {
			className: "dc:flex dc:flex-wrap dc:gap-1 dc:max-w-full",
			children: e.map((e, t) => /* @__PURE__ */ Y(No, {
				value: e,
				onRemove: () => n(e)
			}, t))
		}), /* @__PURE__ */ Y("input", {
			type: "date",
			onChange: (n) => {
				n.target.value && !e.includes(n.target.value) && (t([...e, n.target.value]), n.target.value = "");
			},
			className: Eo,
			placeholder: "Add date..."
		})]
	});
}
function Fo({ supportsMultipleValues: e, values: t, onValueRemove: n, onClear: r }) {
	return t.length === 0 ? null : e ? /* @__PURE__ */ Y("div", {
		className: "dc:flex dc:flex-wrap dc:gap-1 dc:mb-2 dc:max-w-full",
		children: t.map((e, t) => /* @__PURE__ */ Y(No, {
			value: e,
			onRemove: () => n(e)
		}, t))
	}) : /* @__PURE__ */ Y("div", {
		className: "dc:mb-2",
		children: /* @__PURE__ */ Y(No, {
			value: t[0],
			onRemove: r
		})
	});
}
function Io({ searchText: e, valuesLoading: t, valuesError: n, distinctValues: r, values: i, onValueSelect: a, onSearchChange: o }) {
	let { t: s } = R();
	return /* @__PURE__ */ X("div", {
		className: "dc:absolute dc:z-30 dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg dc:max-h-60 dc:overflow-y-auto",
		children: [/* @__PURE__ */ Y("div", {
			className: "dc:p-2 dc:border-b border-dc-border",
			children: /* @__PURE__ */ Y("input", {
				type: "text",
				value: e,
				onChange: o,
				placeholder: s("filter.shared.valueSelector.searchValues"),
				className: "dc:w-full dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent",
				autoFocus: !0
			})
		}), /* @__PURE__ */ Y("div", {
			className: "dc:max-h-48 dc:overflow-y-auto",
			children: t ? /* @__PURE__ */ Y("div", {
				className: "dc:p-2 dc:text-sm text-dc-text-muted",
				children: s(e ? "filter.shared.valueSelector.searching" : "filter.shared.valueSelector.loadingValues")
			}) : n ? /* @__PURE__ */ Y("div", {
				className: "dc:p-2 dc:text-sm text-dc-error",
				children: s("filter.shared.valueSelector.errorLoading", { error: n })
			}) : r.length === 0 ? /* @__PURE__ */ Y("div", {
				className: "dc:p-2 dc:text-sm text-dc-text-muted",
				children: s(e ? "filter.shared.valueSelector.noMatchingValues" : "filter.shared.valueSelector.noValuesAvailable")
			}) : r.map((e, t) => {
				let n = i.includes(e);
				return /* @__PURE__ */ X("button", {
					onClick: () => a(e),
					className: `dc:w-full dc:text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover focus:outline-hidden focus:bg-dc-surface-hover ${n ? "bg-dc-accent-bg text-dc-accent" : "text-dc-text-secondary"}`,
					children: [String(e), n && /* @__PURE__ */ Y("span", {
						className: "dc:float-right text-dc-accent",
						children: "✓"
					})]
				}, `${e}-${t}`);
			})
		})]
	});
}
function Lo({ dropdownRef: e, supportsMultipleValues: t, values: n, isOpen: r, searchText: i, hasLoadedInitial: a, valuesLoading: o, valuesError: s, distinctValues: c, onValuesChange: l, onValueRemove: u, onValueSelect: d, onToggle: f, onSearchChange: p }) {
	let { t: m } = R();
	return /* @__PURE__ */ X("div", {
		className: "dc:relative dc:min-w-0 dc:max-w-full",
		ref: e,
		children: [
			/* @__PURE__ */ Y(Fo, {
				supportsMultipleValues: t,
				values: n,
				onValueRemove: u,
				onClear: () => l([])
			}),
			/* @__PURE__ */ X("button", {
				onClick: f,
				className: "dc:w-full dc:text-left dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface hover:bg-dc-surface-hover dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent dc:flex dc:items-center dc:justify-between dc:min-w-0",
				children: [/* @__PURE__ */ Y("span", {
					className: "text-dc-text-muted dc:truncate",
					children: m(o && !a ? "filter.shared.valueSelector.loadingValues" : "filter.shared.valueSelector.selectValue")
				}), /* @__PURE__ */ Y(wo, { className: "dc:w-4 dc:h-4 text-dc-text-muted" })]
			}),
			r && /* @__PURE__ */ Y(Io, {
				searchText: i,
				valuesLoading: o,
				valuesError: s,
				distinctValues: c,
				values: n,
				onValueSelect: d,
				onSearchChange: p
			})
		]
	});
}
//#endregion
//#region src/client/components/shared/FilterValueSelector.tsx
var Ro = (e) => {
	let { operator: t, values: n, onValuesChange: r } = e, { operatorMeta: i, isOpen: a, searchText: o, hasLoadedInitial: s, dropdownRef: c, isTimeDimension: l, shouldShowComboBox: u, distinctValues: d, valuesLoading: f, valuesError: p, handleDropdownToggle: m, handleSearchChange: h, handleValueSelect: g, handleValueRemove: _, handleDirectInput: v, handleDateInput: y, handleDateRangeEndInput: b, handleBetweenStartInput: x, handleBetweenEndInput: S } = Co(e);
	return i.requiresValues ? t === "inDateRange" ? /* @__PURE__ */ Y(Oo, {
		values: n,
		onStartChange: y,
		onEndChange: b
	}) : t === "between" || t === "notBetween" ? /* @__PURE__ */ Y(ko, {
		values: n,
		onStartChange: x,
		onEndChange: S
	}) : i.valueType === "date" ? /* @__PURE__ */ Y(Ao, {
		values: n,
		onChange: y
	}) : i.valueType === "number" ? /* @__PURE__ */ Y(jo, {
		values: n,
		onChange: v
	}) : l && So.includes(t) ? i.supportsMultipleValues ? /* @__PURE__ */ Y(Po, {
		values: n,
		onValuesChange: r,
		onValueRemove: _
	}) : /* @__PURE__ */ Y(Ao, {
		values: n,
		onChange: y
	}) : u ? /* @__PURE__ */ Y(Lo, {
		dropdownRef: c,
		supportsMultipleValues: i.supportsMultipleValues,
		values: n,
		isOpen: a,
		searchText: o,
		hasLoadedInitial: s,
		valuesLoading: f,
		valuesError: p,
		distinctValues: d,
		onValuesChange: r,
		onValueRemove: _,
		onValueSelect: g,
		onToggle: m,
		onSearchChange: h
	}) : /* @__PURE__ */ Y(Mo, {
		values: n,
		onChange: v,
		valueType: i.valueType
	}) : /* @__PURE__ */ Y(Do, {});
};
//#endregion
//#region src/client/components/DashboardFilters/FilterValuePopover.tsx
function zo(e) {
	return e ? { cubes: e.cubes.map((e) => ({
		name: e.name,
		title: e.title || e.name,
		description: e.description || "",
		measures: e.measures.map((e) => ({
			name: e.name,
			title: e.title || e.name,
			type: e.type,
			description: "",
			shortTitle: e.shortTitle || e.title || e.name
		})),
		dimensions: e.dimensions.map((e) => ({
			name: e.name,
			title: e.title || e.name,
			type: e.type,
			description: "",
			shortTitle: e.shortTitle || e.title || e.name
		})),
		segments: e.segments?.map((e) => ({
			name: e.name,
			title: e.title || e.name,
			type: e.type,
			description: "",
			shortTitle: e.shortTitle || e.title || e.name
		})) || []
	})) } : null;
}
var Bo = ({ filter: e, schema: t, onValuesChange: n, onClose: r, anchorRef: i }) => {
	let { t: a } = R(), o = K(null);
	W(() => {
		let e = (e) => {
			o.current && !o.current.contains(e.target) && i.current && !i.current.contains(e.target) && r();
		}, t = (e) => {
			e.key === "Escape" && r();
		}, n = setTimeout(() => {
			document.addEventListener("mousedown", e), document.addEventListener("keydown", t);
		}, 0);
		return () => {
			clearTimeout(n), document.removeEventListener("mousedown", e), document.removeEventListener("keydown", t);
		};
	}, [r, i]);
	let s = U((e) => {
		n(e);
	}, [n]), c = zo(t);
	return /* @__PURE__ */ X("div", {
		ref: o,
		className: "dc:absolute dc:top-full dc:left-0 dc:mt-1 dc:z-50 dc:border dc:rounded-lg dc:shadow-lg dc:p-3 dc:min-w-[220px]",
		style: {
			backgroundColor: "var(--dc-surface)",
			borderColor: "var(--dc-border)",
			boxShadow: "var(--dc-shadow-lg)"
		},
		children: [
			/* @__PURE__ */ Y("div", {
				className: "dc:text-xs dc:font-medium dc:mb-2",
				style: { color: "var(--dc-text-secondary)" },
				children: a("dashboardFilter.filterValue.editValue")
			}),
			/* @__PURE__ */ Y("div", {
				className: "dc:min-w-[180px]",
				children: /* @__PURE__ */ Y(Ro, {
					fieldName: e.member,
					operator: e.operator,
					values: e.values || [],
					onValuesChange: s,
					schema: c
				})
			}),
			/* @__PURE__ */ Y("div", {
				className: "dc:flex dc:justify-end dc:gap-2 dc:mt-3 dc:pt-2 dc:border-t",
				style: { borderColor: "var(--dc-border)" },
				children: /* @__PURE__ */ Y("button", {
					type: "button",
					onClick: r,
					className: "dc:px-3 dc:py-1 dc:text-xs dc:font-medium dc:rounded-sm dc:border dc:transition-colors",
					style: {
						borderColor: "var(--dc-border)",
						color: "var(--dc-text-secondary)",
						backgroundColor: "transparent"
					},
					children: a("common.actions.close")
				})
			})
		]
	});
}, Vo = v("close"), Ho = v("edit"), Uo = ({ filter: e, schema: t, isEditMode: n, onChange: r, onEdit: i, onRemove: a }) => {
	let [o, s] = q(!1), c = K(null), l = e.filter, { label: u } = e, { operator: d, values: f } = l, p = ho(f || [], d), m = U((t) => {
		r({
			...e,
			filter: {
				...l,
				values: t
			}
		});
	}, [
		e,
		l,
		r
	]), h = U(() => {
		n ? i?.() : s(!0);
	}, [n, i]);
	return "member" in e.filter ? /* @__PURE__ */ X("div", {
		ref: c,
		className: "dc:relative dc:inline-flex",
		children: [/* @__PURE__ */ X("div", {
			className: `
          dc:inline-flex dc:items-center dc:gap-1 dc:px-2 dc:py-1 dc:rounded-sm dc:text-xs
          dc:border dc:transition-colors dc:cursor-pointer
          ${n ? "dc:pr-1" : ""}
        `,
			style: {
				backgroundColor: "var(--dc-surface)",
				borderColor: "var(--dc-border)",
				color: "var(--dc-text)"
			},
			onClick: h,
			onMouseEnter: (e) => {
				e.currentTarget.style.backgroundColor = "var(--dc-surface-hover)";
			},
			onMouseLeave: (e) => {
				e.currentTarget.style.backgroundColor = "var(--dc-surface)";
			},
			title: `${u} ${p}`,
			children: [
				/* @__PURE__ */ Y("span", {
					className: "dc:font-medium dc:truncate dc:max-w-[100px]",
					children: u
				}),
				p && /* @__PURE__ */ Y(J, { children: /* @__PURE__ */ Y("span", {
					style: { color: "var(--dc-text-secondary)" },
					children: p
				}) }),
				n && /* @__PURE__ */ X(J, { children: [/* @__PURE__ */ Y("button", {
					type: "button",
					onClick: (e) => {
						e.stopPropagation(), i?.();
					},
					className: "dc:p-0.5 dc:rounded-sm dc:transition-colors",
					style: { color: "var(--dc-text-secondary)" },
					onMouseEnter: (e) => {
						e.currentTarget.style.color = "var(--dc-text)";
					},
					onMouseLeave: (e) => {
						e.currentTarget.style.color = "var(--dc-text-secondary)";
					},
					children: /* @__PURE__ */ Y(Ho, { className: "dc:w-3 dc:h-3" })
				}), /* @__PURE__ */ Y("button", {
					type: "button",
					onClick: (e) => {
						e.stopPropagation(), a?.();
					},
					className: "dc:p-0.5 dc:rounded-sm dc:transition-colors",
					style: { color: "var(--dc-text-secondary)" },
					onMouseEnter: (e) => {
						e.currentTarget.style.color = "var(--dc-error)";
					},
					onMouseLeave: (e) => {
						e.currentTarget.style.color = "var(--dc-text-secondary)";
					},
					children: /* @__PURE__ */ Y(Vo, { className: "dc:w-3 dc:h-3" })
				})] })
			]
		}), o && !n && /* @__PURE__ */ Y(Bo, {
			filter: l,
			schema: t,
			onValuesChange: m,
			onClose: () => s(!1),
			anchorRef: c
		})]
	}) : null;
}, Wo = v("add"), Go = v("timeDimension"), Ko = v("chevronDown"), qo = v("filter");
function Jo({ isEditMode: e, onAddFilter: t, withHoverHandlers: n }) {
	return !e || !t ? null : /* @__PURE__ */ Y("button", {
		type: "button",
		onClick: t,
		className: "dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1 dc:rounded-sm dc:text-xs dc:font-medium dc:border dc:transition-colors",
		style: {
			borderColor: "var(--dc-border)",
			color: "var(--dc-text-secondary)",
			backgroundColor: "transparent"
		},
		onMouseEnter: n ? (e) => {
			e.currentTarget.style.backgroundColor = "var(--dc-surface-hover)";
		} : void 0,
		onMouseLeave: n ? (e) => {
			e.currentTarget.style.backgroundColor = "transparent";
		} : void 0,
		children: /* @__PURE__ */ Y(Wo, { className: "dc:w-3.5 dc:h-3.5" })
	});
}
function Yo({ nonDateFilters: e, schema: t, isEditMode: n, onEditFilter: r, onRemoveFilter: i, handleFilterChange: a }) {
	return /* @__PURE__ */ Y(J, { children: e.map((e) => /* @__PURE__ */ Y(Uo, {
		filter: e,
		schema: t,
		isEditMode: n,
		onChange: (t) => a(e.id, t),
		onEdit: () => r?.(e.id),
		onRemove: () => i?.(e.id)
	}, e.id)) });
}
function Xo({ props: e, showLabel: t, withTitle: n }) {
	let { t: r } = R(), { activePresetId: i, dateRangeTooltip: a, showCustomDropdown: o, setShowCustomDropdown: s, setShowXTDDropdown: c, customButtonRef: l, currentDateRange: u, handleCustomDateSelect: d } = e;
	return /* @__PURE__ */ X("div", {
		className: "dc:relative",
		children: [/* @__PURE__ */ X("button", {
			ref: l,
			type: "button",
			onClick: () => {
				s(!o), c(!1);
			},
			title: n ? i === "custom" && a ? a : "Custom date range" : void 0,
			className: `
          dc:flex dc:items-center dc:gap-1 dc:px-2.5 dc:py-1 dc:rounded-sm dc:text-xs dc:font-medium dc:border
          dc:transition-colors${n ? " dc:focus:outline-none dc:focus:ring-2 dc:focus:ring-offset-1" : ""}
        `,
			style: {
				backgroundColor: i === "custom" ? "var(--dc-primary)" : "var(--dc-surface)",
				color: i === "custom" ? "white" : "var(--dc-text)",
				borderColor: i === "custom" ? "transparent" : "var(--dc-border)"
			},
			children: [
				/* @__PURE__ */ Y(Go, { className: "dc:w-3 dc:h-3" }),
				/* @__PURE__ */ Y("span", { children: r("dateRange.custom") }),
				t && /* @__PURE__ */ Y(Ko, { className: "dc:w-3 dc:h-3" })
			]
		}), o && /* @__PURE__ */ Y(yo, {
			isOpen: o,
			onClose: () => s(!1),
			onDateRangeChange: d,
			currentDateRange: u,
			anchorRef: l
		})]
	});
}
function Zo({ props: e, withTitle: t }) {
	let { t: n } = R(), { activeXTDId: r, dateRangeTooltip: i, showXTDDropdown: a, setShowXTDDropdown: o, setShowCustomDropdown: s, xtdButtonRef: c, handleXTDSelect: l } = e;
	return /* @__PURE__ */ X("div", {
		className: "dc:relative",
		children: [/* @__PURE__ */ X("button", {
			ref: c,
			type: "button",
			onClick: () => {
				o(!a), s(!1);
			},
			title: t ? r && i ? i : "X to Date options" : void 0,
			className: `
          dc:flex dc:items-center dc:gap-1 dc:px-2.5 dc:py-1 dc:rounded-sm dc:text-xs dc:font-medium dc:border
          dc:transition-colors${t ? " dc:focus:outline-none dc:focus:ring-2 dc:focus:ring-offset-1" : ""}
        `,
			style: {
				backgroundColor: r ? "var(--dc-primary)" : "var(--dc-surface)",
				color: r ? "white" : "var(--dc-text)",
				borderColor: r ? "transparent" : "var(--dc-border)"
			},
			children: [/* @__PURE__ */ Y("span", { children: n("dashboardFilter.xtd.trigger") }), /* @__PURE__ */ Y(Ko, { className: "dc:w-3 dc:h-3" })]
		}), a && /* @__PURE__ */ Y(xo, {
			isOpen: a,
			onClose: () => o(!1),
			onSelect: l,
			currentXTD: r,
			anchorRef: c
		})]
	});
}
function Qo(e) {
	let { activePresetId: t, activeXTDId: n, nonDateFilters: r, handlePresetSelect: i, isEditMode: a, onAddFilter: o } = e;
	return /* @__PURE__ */ X("div", {
		className: "dc:hidden dc:md:flex dc:items-center dc:gap-2 dc:px-3 dc:py-2",
		children: [
			/* @__PURE__ */ Y(qo, {
				className: "dc:w-4 dc:h-4 dc:shrink-0",
				style: { color: "var(--dc-text-secondary)" }
			}),
			/* @__PURE__ */ Y(_o, {
				activePreset: t !== "custom" && !n ? t : null,
				onPresetSelect: i
			}),
			/* @__PURE__ */ Y(Xo, {
				props: e,
				showLabel: !0,
				withTitle: !0
			}),
			/* @__PURE__ */ Y(Zo, {
				props: e,
				withTitle: !0
			}),
			r.length > 0 && /* @__PURE__ */ Y("div", {
				className: "dc:h-5 dc:w-px dc:mx-1",
				style: { backgroundColor: "var(--dc-border)" }
			}),
			/* @__PURE__ */ Y("div", {
				className: "dc:flex dc:items-center dc:gap-1.5 dc:flex-wrap",
				children: /* @__PURE__ */ Y(Yo, { ...e })
			}),
			/* @__PURE__ */ Y(Jo, {
				isEditMode: a,
				onAddFilter: o,
				withHoverHandlers: !0
			})
		]
	});
}
function $o(e) {
	let { activePresetId: t, activeXTDId: n, nonDateFilters: r, handlePresetSelect: i, isEditMode: a, onAddFilter: o } = e;
	return /* @__PURE__ */ X("div", {
		className: "dc:md:hidden",
		children: [
			/* @__PURE__ */ X("div", {
				className: "dc:flex dc:items-center dc:gap-2 dc:overflow-x-auto dc:px-3 dc:py-2 scrollbar-thin",
				children: [/* @__PURE__ */ Y(qo, {
					className: "dc:w-4 dc:h-4 dc:shrink-0",
					style: { color: "var(--dc-text-secondary)" }
				}), /* @__PURE__ */ Y(_o, {
					activePreset: t !== "custom" && !n ? t : null,
					onPresetSelect: i
				})]
			}),
			/* @__PURE__ */ X("div", {
				className: "dc:flex dc:items-center dc:justify-between dc:px-3 dc:py-2 dc:border-t",
				style: { borderColor: "var(--dc-border)" },
				children: [/* @__PURE__ */ X("div", {
					className: "dc:flex dc:items-center dc:gap-2",
					children: [/* @__PURE__ */ Y(Xo, {
						props: e,
						showLabel: !1,
						withTitle: !1
					}), /* @__PURE__ */ Y(Zo, {
						props: e,
						withTitle: !1
					})]
				}), /* @__PURE__ */ Y(Jo, {
					isEditMode: a,
					onAddFilter: o,
					withHoverHandlers: !1
				})]
			}),
			r.length > 0 && /* @__PURE__ */ Y("div", {
				className: "dc:px-3 dc:py-2 dc:border-t",
				style: { borderColor: "var(--dc-border)" },
				children: /* @__PURE__ */ Y("div", {
					className: "dc:flex dc:items-center dc:gap-1.5 dc:flex-wrap",
					children: /* @__PURE__ */ Y(Yo, { ...e })
				})
			})
		]
	});
}
//#endregion
//#region src/client/components/DashboardFilters/CompactFilterBar.tsx
function es() {
	let [e, t] = q(!0);
	return W(() => {
		let e = window.matchMedia("(min-width: 768px)"), n = () => t(e.matches);
		return n(), e.addEventListener("change", n), () => e.removeEventListener("change", n);
	}, []), e;
}
var ts = ({ dashboardFilters: e, schema: t, isEditMode: n, onDashboardFiltersChange: r, onAddFilter: i, onEditFilter: a, onRemoveFilter: o }) => {
	let s = go(e, r), c = es();
	return !n && s.localFilters.length === 0 ? null : /* @__PURE__ */ Y("div", {
		className: "dc:border dc:rounded-lg",
		style: {
			borderColor: "var(--dc-border)",
			backgroundColor: "var(--dc-surface)"
		},
		children: Y(c ? Qo : $o, {
			schema: t,
			isEditMode: n,
			onAddFilter: i,
			onEditFilter: a,
			onRemoveFilter: o,
			currentDateRange: s.currentDateRange,
			activePresetId: s.activePresetId,
			activeXTDId: s.activeXTDId,
			nonDateFilters: s.nonDateFilters,
			dateRangeTooltip: s.dateRangeTooltip,
			showCustomDropdown: s.showCustomDropdown,
			setShowCustomDropdown: s.setShowCustomDropdown,
			showXTDDropdown: s.showXTDDropdown,
			setShowXTDDropdown: s.setShowXTDDropdown,
			customButtonRef: s.customButtonRef,
			xtdButtonRef: s.xtdButtonRef,
			handlePresetSelect: s.handlePresetSelect,
			handleXTDSelect: s.handleXTDSelect,
			handleCustomDateSelect: s.handleCustomDateSelect,
			handleFilterChange: s.handleFilterChange
		})
	});
}, ns = ({ dashboardFilters: e, editable: t, schema: n, dashboardConfig: r, onDashboardFiltersChange: i, onSaveFilters: a, selectedFilterId: o, onFilterSelect: s, isEditMode: c = !1 }) => {
	let [l, u] = q(null), [d, f] = q(!1), p = U((e) => e ? { cubes: e.cubes.map((e) => ({
		name: e.name,
		title: e.title || e.name,
		description: e.description || "",
		measures: e.measures.map((e) => ({
			name: e.name,
			title: e.title,
			type: e.type,
			description: "",
			shortTitle: e.shortTitle
		})),
		dimensions: e.dimensions.map((e) => ({
			name: e.name,
			title: e.title,
			type: e.type,
			description: "",
			shortTitle: e.shortTitle
		})),
		segments: e.segments?.map((e) => ({
			name: e.name,
			title: e.title,
			type: e.type,
			description: "",
			shortTitle: e.shortTitle
		})) || []
	})) } : null, []), m = U(() => `df_${Date.now()}_${Math.random().toString(36).substring(7)}`, []), h = U(async (e) => {
		i(e), a && await a(e);
	}, [i, a]), g = U(() => {
		let t = {
			id: m(),
			label: `Filter ${e.length + 1}`,
			filter: {
				member: "",
				operator: "equals",
				values: []
			}
		};
		u(t), f(!0);
	}, [e.length, m]), _ = U(() => {
		let t = {
			id: m(),
			label: "Date Range Filter",
			isUniversalTime: !0,
			filter: {
				member: "__universal_time__",
				operator: "inDateRange",
				values: ["last 30 days"]
			}
		}, n = [...e, t];
		h(n).catch((e) => {
			console.error("Failed to save filters:", e);
		});
	}, [
		m,
		e,
		h
	]), v = U((t) => {
		let n = e.find((e) => e.id === t);
		n && (u(n), f(!0));
	}, [e]), y = U((t) => {
		let n = e.filter((e) => e.id !== t);
		h(n).catch((e) => {
			console.error("Failed to save filters:", e);
		}), l?.id === t && (u(null), f(!1));
	}, [
		e,
		l,
		h
	]), b = U(async (t) => {
		let n = e.findIndex((e) => e.id === t.id), r;
		r = n >= 0 ? e.map((e) => e.id === t.id ? t : e) : [...e, t];
		try {
			await h(r);
		} catch (e) {
			throw console.error("Failed to save filters:", e), e;
		}
	}, [e, h]), x = U(() => {
		u(null), f(!1);
	}, []);
	return !t || !c && e.length === 0 ? null : /* @__PURE__ */ X("div", {
		className: "dc:mb-4",
		children: [c ? /* @__PURE__ */ Y("div", {
			className: "dc:border dc:rounded-lg",
			style: {
				borderColor: "var(--dc-border)",
				backgroundColor: "var(--dc-surface)",
				boxShadow: "var(--dc-shadow-sm)"
			},
			children: /* @__PURE__ */ Y(lo, {
				dashboardFilters: e,
				onAddFilter: g,
				onAddTimeFilter: _,
				onEditFilter: v,
				onRemoveFilter: y,
				selectedFilterId: o,
				onFilterSelect: s
			})
		}) : /* @__PURE__ */ Y(ts, {
			dashboardFilters: e,
			schema: n,
			isEditMode: !1,
			onDashboardFiltersChange: i,
			onAddFilter: g,
			onEditFilter: v,
			onRemoveFilter: y
		}), d && l && /* @__PURE__ */ Y(no, {
			filter: l,
			schema: n,
			dashboardConfig: r,
			isOpen: d,
			onSave: b,
			onClose: x,
			onDelete: () => y(l.id),
			convertToMetaResponse: p
		})]
	});
}, rs = v("filter");
function is() {
	let { t: e } = R(), { dashboardFilters: t, editable: n, schema: r, config: i, onDashboardFiltersChange: a, onSave: o, selectedFilterId: s, selectedFilter: c, isEditMode: l, handleFilterSelect: u, handleSelectAllForFilter: d, actions: f } = pi();
	return /* @__PURE__ */ X(J, { children: [/* @__PURE__ */ Y(ns, {
		dashboardFilters: t || [],
		editable: n,
		schema: r || null,
		dashboardConfig: i,
		onDashboardFiltersChange: a || (() => {}),
		onSaveFilters: o ? async (e) => {
			await o({
				...i,
				filters: e
			});
		} : void 0,
		selectedFilterId: s,
		onFilterSelect: u,
		isEditMode: l
	}), s && c && /* @__PURE__ */ Y("div", {
		className: "dc:mb-4 dc:px-4 dc:py-3 dc:rounded-md dc:border-2 dc:transition-all",
		style: {
			backgroundColor: "var(--dc-primary)",
			borderColor: "var(--dc-primary)",
			color: "white"
		},
		children: /* @__PURE__ */ X("div", {
			className: "dc:flex dc:items-center dc:justify-between dc:flex-wrap dc:gap-2",
			children: [/* @__PURE__ */ X("div", {
				className: "dc:flex dc:items-center dc:gap-2 dc:flex-wrap",
				children: [
					/* @__PURE__ */ Y(rs, { className: "dc:w-5 dc:h-5 dc:shrink-0" }),
					/* @__PURE__ */ Y("span", {
						className: "dc:font-medium",
						children: e("dashboard.filterSelectionMode", { filterLabel: c.label })
					}),
					/* @__PURE__ */ Y("span", {
						className: "dc:text-sm dc:opacity-90 dc:hidden dc:sm:inline",
						children: e("dashboard.filterSelectionEscHint")
					})
				]
			}), /* @__PURE__ */ X("div", {
				className: "dc:flex dc:items-center dc:gap-2",
				children: [/* @__PURE__ */ Y("button", {
					onClick: () => d(s),
					className: "dc:px-3 dc:py-1 dc:rounded-md dc:transition-colors dc:text-sm dc:font-medium",
					style: {
						backgroundColor: "rgba(255, 255, 255, 0.2)",
						color: "white"
					},
					onMouseEnter: (e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.3)",
					onMouseLeave: (e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)",
					children: e("common.actions.selectAll")
				}), /* @__PURE__ */ Y("button", {
					onClick: () => f.exitFilterSelectionMode(),
					className: "dc:px-3 dc:py-1 dc:rounded-md dc:transition-colors dc:text-sm dc:font-medium",
					style: {
						backgroundColor: "rgba(255, 255, 255, 0.2)",
						color: "white"
					},
					onMouseEnter: (e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.3)",
					onMouseLeave: (e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)",
					children: e("common.actions.exit")
				})]
			})]
		})
	})] });
}
//#endregion
//#region src/client/components/mobileStackedLayout/memberDisplay.ts
var as = ["kpiNumber", "kpiDelta"];
function os(e) {
	let { portlet: t, framed: n, memberCount: r } = e, { analysisConfig: i } = Q(t), a = i.charts[i.analysisType], o = a?.chartType || "line", s = a?.displayConfig;
	!n && as.includes(o) && (s = {
		...s,
		layout: "compact"
	});
	let c = o === "markdown", l = c && !!s?.transparentBackground, u = c && (s?.autoHeight ?? !0), d = n ? c ? (s?.hideHeader ?? !0) || !t.title : s?.hideHeader ?? !1 : !0, f = gn(o, s) ? 96 : 200, p = n ? Math.max(300, t.h * 80) : Math.max(f, t.h * 80 / r), m = p - (d ? 0 : 40) - 24;
	return {
		query: JSON.stringify(i.query),
		chartType: o,
		chartConfig: a?.chartConfig,
		displayConfig: s,
		isTransparent: l,
		isAutoHeight: u,
		shouldHideHeader: d,
		height: p,
		contentHeight: m
	};
}
//#endregion
//#region src/client/components/MobileStackedLayout.tsx
var ss = v("refresh");
function cs({ config: e, colorPalette: t, dashboardFilters: n, onPortletRefresh: r }) {
	let { t: i } = R(), a = K({}), [o, c] = q(null), l = K(null), u = U((e) => {
		l.current = e, e && c(ui(e));
	}, []), d = G(() => {
		let t = new Map(e.portlets.map((e) => [e.id, e])), n = /* @__PURE__ */ new Set(), r = [];
		for (let i of e.groups ?? []) {
			let e = i.cells.flatMap((e) => e.portletIds).map((e) => t.get(e)).filter((e) => !!e);
			if (e.length === 0) continue;
			e.forEach((e) => n.add(e.id));
			let a = Math.min(...e.map((e) => e.y)), o = Math.min(...e.map((e) => e.x));
			r.push({
				kind: "group",
				sort: [a, o],
				group: i,
				portlets: e
			});
		}
		for (let t of e.portlets) n.has(t.id) || r.push({
			kind: "portlet",
			sort: [t.y, t.x],
			portlet: t
		});
		return r.sort((e, t) => e.sort[0] === t.sort[0] ? e.sort[1] - t.sort[1] : e.sort[0] - t.sort[0]);
	}, [e.groups, e.portlets]), f = G(() => {
		if (e.layoutMode !== "rows") return null;
		let t = /* @__PURE__ */ new Map();
		d.forEach((e) => {
			t.set(e.sort[0], (t.get(e.sort[0]) ?? 0) + 1);
		});
		let n = (e) => e.kind === "portlet" && t.get(e.sort[0]) === 1 && br(e.portlet), r = [], i = 0;
		for (; i < d.length;) {
			if (!n(d[i])) {
				r.push({
					kind: "loose",
					block: d[i]
				}), i += 1;
				continue;
			}
			let e = d[i], t = [];
			for (i += 1; i < d.length && !n(d[i]);) t.push(d[i]), i += 1;
			r.push(t.length === 0 ? {
				kind: "loose",
				block: e
			} : {
				kind: "section",
				header: e,
				body: t
			});
		}
		return r.some((e) => e.kind === "section") ? r : null;
	}, [d, e.layoutMode]), p = (e) => {
		a.current[e]?.refresh(), r?.(e);
	}, m = (r, o, s = 1, c = !1) => {
		let l = os({
			portlet: r,
			framed: o,
			memberCount: s
		}), { isTransparent: u, isAutoHeight: d, shouldHideHeader: f, contentHeight: m } = l, h = u || !o || c;
		return /* @__PURE__ */ X("div", {
			"data-portlet-id": r.id,
			className: h ? "dc:flex dc:flex-col" : "bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:flex dc:flex-col",
			style: {
				height: d ? "auto" : l.height,
				boxShadow: h ? "none" : "var(--dc-shadow-sm)",
				borderColor: u ? "transparent" : void 0,
				borderWidth: u ? "0" : void 0,
				backgroundColor: u ? "transparent" : void 0
			},
			children: [!f && /* @__PURE__ */ X("div", {
				className: `dc:flex dc:items-center dc:justify-between dc:px-3 dc:shrink-0${c ? " dc:py-3" : " dc:py-2 dc:border-b border-dc-border bg-dc-surface-secondary dc:rounded-t-lg"}`,
				children: [/* @__PURE__ */ Y("h3", {
					className: "dc:font-semibold dc:text-sm text-dc-text dc:truncate dc:flex-1",
					children: r.title
				}), /* @__PURE__ */ Y("div", {
					className: "dc:flex dc:items-center dc:gap-1 dc:shrink-0 dc:ml-2",
					children: /* @__PURE__ */ Y("button", {
						onClick: () => p(r.id),
						className: "dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors",
						title: i("dashboard.portlet.action.refresh"),
						children: /* @__PURE__ */ Y(ss, { style: {
							width: "16px",
							height: "16px",
							color: "currentColor"
						} })
					})
				})]
			}), /* @__PURE__ */ Y("div", {
				className: `dc-portlet-card-body dc:overflow-visible dc:flex dc:flex-col${u && !c ? "" : " dc:px-2 dc:py-3"}`,
				style: { height: d ? "auto" : m },
				children: /* @__PURE__ */ Y(wn, {
					ref: (e) => {
						a.current[r.id] = e;
					},
					query: l.query,
					chartType: l.chartType,
					chartConfig: l.chartConfig,
					displayConfig: l.displayConfig,
					dashboardFilters: n,
					dashboardFilterMapping: r.dashboardFilterMapping,
					eagerLoad: r.eagerLoad ?? e.eagerLoad ?? !1,
					title: r.title,
					height: d ? "auto" : m,
					colorPalette: t
				})
			})]
		}, r.id);
	}, h = (e) => e.kind === "group" ? e.group.id : e.portlet.id, g = (e, t) => e.kind === "portlet" ? m(e.portlet, !0, 1, t) : /* @__PURE__ */ X("div", {
		"data-group-id": e.group.id,
		className: `dc:flex dc:flex-col${t ? "" : " bg-dc-surface dc:border border-dc-border dc:rounded-lg"}`,
		style: { boxShadow: t ? "none" : "var(--dc-shadow-sm)" },
		children: [e.group.title && e.group.title.trim() && /* @__PURE__ */ Y("div", {
			className: "dc:flex dc:items-center dc:px-3 dc:py-2 dc:border-b border-dc-border dc:shrink-0 bg-dc-surface-secondary dc:rounded-t-lg",
			children: /* @__PURE__ */ Y("h3", {
				className: "dc:font-semibold dc:text-sm text-dc-text dc:truncate",
				children: e.group.title
			})
		}), /* @__PURE__ */ Y("div", {
			className: "dc:flex dc:flex-col dc:p-1 dc:gap-1",
			children: e.portlets.map((t) => m(t, !1, e.portlets.length))
		})]
	}, e.group.id);
	return /* @__PURE__ */ Y(s, {
		value: o,
		children: /* @__PURE__ */ Y("div", {
			ref: u,
			className: "mobile-stacked-layout dc:space-y-4 dc:px-2",
			children: f ? f.map((e) => e.kind === "loose" ? g(e.block, !1) : /* @__PURE__ */ X("div", {
				className: `dc-dashboard-section${e.header.kind === "portlet" && wr(e.header.portlet) ? " dc-dashboard-section-ruled" : ""}`,
				children: [g(e.header, !0), e.body.map((e) => g(e, !0))]
			}, `section-${h(e.header)}`)) : d.map((e) => g(e, !1))
		})
	});
}
//#endregion
//#region src/client/components/ScaledGridWrapper.tsx
function ls({ scaleFactor: e, designWidth: t, children: n }) {
	let [r, i] = q(0), a = K(null);
	W(() => {
		if (!a.current) return;
		let e = new ResizeObserver((e) => {
			i(e[0]?.contentRect.height ?? 0);
		});
		return e.observe(a.current), i(a.current.offsetHeight || 0), () => e.disconnect();
	}, []);
	let o = r * e;
	return /* @__PURE__ */ Y("div", {
		className: "scaled-grid-container",
		style: {
			height: o > 0 ? o : "auto",
			overflow: "hidden",
			width: "100%"
		},
		children: /* @__PURE__ */ Y("div", {
			ref: a,
			className: "scaled-grid-inner",
			style: {
				transform: `scale(${e})`,
				transformOrigin: "top left",
				width: t
			},
			children: n
		})
	});
}
//#endregion
//#region src/client/components/dashboard/DashboardGridSurface.tsx
var us = v("measure"), ds = v("add");
function fs() {
	let { t: e } = R(), { config: t, gridContentRef: n, displayMode: r, scaleFactor: i, designWidth: a, colorPalette: o, dashboardFilters: s, handlePortletRefresh: c, renderActiveLayout: l, editable: u, handleAddText: d, handleAddPortlet: f } = pi();
	return !t.portlets || t.portlets.length === 0 ? /* @__PURE__ */ Y("div", {
		className: "dc:flex dc:justify-center dc:items-center dc:min-h-[50vh]",
		children: /* @__PURE__ */ X("div", {
			className: "dc:text-center",
			children: [
				/* @__PURE__ */ Y(us, { style: {
					width: "64px",
					height: "64px",
					color: "var(--dc-text-muted)",
					margin: "0 auto 16px auto"
				} }),
				/* @__PURE__ */ Y("h3", {
					className: "dc:text-lg dc:font-semibold dc:mb-2 text-dc-text",
					children: e("dashboard.noPortlets")
				}),
				/* @__PURE__ */ Y("p", {
					className: "dc:text-sm text-dc-text-secondary dc:mb-4",
					children: e("dashboard.noPortletsDescription")
				}),
				u && /* @__PURE__ */ X("div", {
					className: "dc:flex dc:items-center dc:gap-3",
					children: [/* @__PURE__ */ X("button", {
						onClick: d,
						className: "dc:inline-flex dc:items-center dc:px-4 dc:py-2 dc:border border-dc-border bg-dc-surface dc:rounded-md focus:outline-hidden dc:focus:ring-2",
						style: {
							color: "var(--dc-text-secondary)",
							borderColor: "var(--dc-border)"
						},
						onMouseEnter: (e) => e.currentTarget.style.backgroundColor = "var(--dc-surface-hover)",
						onMouseLeave: (e) => e.currentTarget.style.backgroundColor = "var(--dc-surface)",
						children: [/* @__PURE__ */ Y(di, { className: "dc:w-5 dc:h-5 dc:mr-2" }), e("dashboard.addText")]
					}), /* @__PURE__ */ X("button", {
						onClick: f,
						className: "dc:inline-flex dc:items-center dc:px-4 dc:py-2 dc:border border-dc-border bg-dc-surface dc:rounded-md focus:outline-hidden dc:focus:ring-2",
						style: {
							color: "var(--dc-primary)",
							borderColor: "var(--dc-primary)"
						},
						onMouseEnter: (e) => e.currentTarget.style.backgroundColor = "var(--dc-surface-hover)",
						onMouseLeave: (e) => e.currentTarget.style.backgroundColor = "var(--dc-surface)",
						children: [/* @__PURE__ */ Y(ds, { className: "dc:w-5 dc:h-5 dc:mr-2" }), e("dashboard.addPortlet")]
					})]
				})
			]
		})
	}) : /* @__PURE__ */ Y("div", {
		ref: n,
		children: r === "mobile" ? /* @__PURE__ */ Y(cs, {
			config: t,
			colorPalette: o,
			dashboardFilters: s,
			onPortletRefresh: c
		}) : r === "scaled" ? /* @__PURE__ */ Y(ls, {
			scaleFactor: i,
			designWidth: a,
			children: l()
		}) : l()
	});
}
//#endregion
//#region src/client/components/Modal.tsx
var ps = ({ isOpen: e, onClose: t, title: n, size: r = "md", closeOnBackdropClick: i = !0, closeOnEscape: a = !0, showCloseButton: o = !0, children: s, footer: c, noPadding: l = !1 }) => {
	let u = U((e) => {
		e.key === "Escape" && a && t();
	}, [a, t]);
	return W(() => (e ? (a && document.addEventListener("keydown", u), document.body.style.overflow = "hidden") : document.body.style.overflow = "unset", () => {
		document.removeEventListener("keydown", u), document.body.style.overflow = "unset";
	}), [
		e,
		a,
		u
	]), e ? /* @__PURE__ */ Y("div", {
		className: `dc:fixed dc:inset-0 dc:z-50 dc:backdrop-blur-md ${r === "fullscreen-mobile" ? "dc:flex dc:md:flex dc:md:items-center dc:md:justify-center" : "dc:flex dc:items-center dc:justify-center"}`,
		style: { backgroundColor: "var(--dc-overlay)" },
		onClick: i ? t : void 0,
		children: /* @__PURE__ */ X("div", {
			className: `dc:relative bg-dc-surface dc:border border-dc-border ${r === "fullscreen-mobile" ? "dc:rounded-none dc:md:rounded-lg" : "dc:rounded-lg"} ${r === "fullscreen" || r === "fullscreen-mobile" ? "" : "dc:mx-4"} ${(() => {
				switch (r) {
					case "sm": return "dc:max-w-md";
					case "md": return "dc:max-w-lg";
					case "lg": return "dc:max-w-2xl";
					case "xl": return "dc:max-w-6xl";
					case "xxl": return "dc:max-w-[1400px]";
					case "full": return "dc:max-w-7xl";
					case "fullscreen": return "dc:w-[90vw] dc:h-[90vh] dc:max-w-none";
					case "fullscreen-mobile": return "dc:w-full dc:h-full dc:md:w-[min(90vw,1400px)] dc:md:h-[90vh]";
					default: return "dc:max-w-lg";
				}
			})()} ${r === "fullscreen" || r === "fullscreen-mobile" ? "" : "dc:max-h-[90vh]"} dc:flex dc:flex-col`,
			style: { boxShadow: "var(--dc-shadow-2xl)" },
			onClick: (e) => e.stopPropagation(),
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": n ? "modal-title" : void 0,
			children: [
				(n || o) && /* @__PURE__ */ X("div", {
					className: "dc:flex dc:items-center dc:justify-between dc:px-6 dc:py-4 dc:border-b border-dc-border",
					children: [n && /* @__PURE__ */ Y("h2", {
						id: "modal-title",
						className: "dc:text-xl dc:font-semibold text-dc-text",
						children: n
					}), o && /* @__PURE__ */ Y("button", {
						type: "button",
						onClick: t,
						className: "text-dc-text-muted hover:text-dc-text-secondary dc:transition-colors dc:p-2 dc:-mr-2",
						"aria-label": "Close modal",
						children: /* @__PURE__ */ Y("svg", {
							width: "24",
							height: "24",
							fill: "none",
							viewBox: "0 0 24 24",
							stroke: "currentColor",
							children: /* @__PURE__ */ Y("path", {
								strokeLinecap: "round",
								strokeLinejoin: "round",
								strokeWidth: 2,
								d: "M6 18L18 6M6 6l12 12"
							})
						})
					})]
				}),
				/* @__PURE__ */ Y("div", {
					className: `dc:flex-1 dc:overflow-y-auto ${l ? "" : "dc:px-6 dc:py-4"}`,
					children: s
				}),
				c && /* @__PURE__ */ Y("div", {
					className: "dc:flex dc:items-center dc:justify-end dc:space-x-3 dc:px-6 dc:py-4 dc:border-t border-dc-border bg-dc-surface-secondary",
					children: de.Children.toArray(c)
				})
			]
		})
	}) : null;
}, ms = ge(() => import("./analysis-builder-Ehr0jHhS.js")), hs = he((e, t) => /* @__PURE__ */ Y(me, {
	fallback: /* @__PURE__ */ Y("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full dc:py-6",
		children: /* @__PURE__ */ Y(ie, {})
	}),
	children: /* @__PURE__ */ Y(ms, {
		...e,
		ref: t
	})
}));
hs.displayName = "AnalysisBuilder";
//#endregion
//#region src/client/adapters/funnelModeAdapter.ts
function gs(e) {
	let t = "";
	e.funnelBindingKey && (typeof e.funnelBindingKey.dimension == "string" ? t = e.funnelBindingKey.dimension : Array.isArray(e.funnelBindingKey.dimension) && (t = e.funnelBindingKey.dimension.map((e) => ({
		cube: e.cube,
		dimension: e.dimension
	}))));
	let n = e.funnelTimeDimension || "", r = e.funnelSteps.map((t) => {
		let n = { name: t.name };
		return t.cube && t.cube !== e.funnelCube && (n.cube = t.cube), t.filters && t.filters.length > 0 && (n.filter = t.filters.length === 1 ? t.filters[0] : { and: t.filters }), t.timeToConvert && (n.timeToConvert = t.timeToConvert), n;
	});
	return { funnel: {
		bindingKey: t,
		timeDimension: n,
		steps: r,
		includeTimeMetrics: !0
	} };
}
function _s(e) {
	let { funnel: t } = e, n = null;
	if (t.steps.length > 0 && t.steps[0].cube) n = t.steps[0].cube;
	else if (typeof t.bindingKey == "string") {
		let e = t.bindingKey.split(".");
		e.length > 0 && (n = e[0]);
	}
	let r = null;
	t.bindingKey && (typeof t.bindingKey == "string" ? r = { dimension: t.bindingKey } : Array.isArray(t.bindingKey) && (r = { dimension: t.bindingKey.map((e) => ({
		cube: e.cube,
		dimension: e.dimension
	})) }));
	let i = null;
	t.timeDimension && (typeof t.timeDimension == "string" ? i = t.timeDimension : Array.isArray(t.timeDimension) && t.timeDimension.length > 0 && (i = `${t.timeDimension[0].cube}.${t.timeDimension[0].dimension}`));
	let a = t.steps.map((e) => {
		let t = [];
		return e.filter && (t = Array.isArray(e.filter) ? e.filter : typeof e.filter == "object" && "and" in e.filter ? e.filter.and : [e.filter]), {
			id: qi(),
			name: e.name,
			cube: e.cube || n || "",
			filters: t,
			timeToConvert: e.timeToConvert
		};
	});
	return {
		funnelCube: n,
		funnelSteps: a,
		activeFunnelStepIndex: 0,
		funnelTimeDimension: i,
		funnelBindingKey: r
	};
}
function vs(e) {
	if (!e || typeof e != "object") return !1;
	let t = e;
	if (t.version !== 1 || t.analysisType !== "funnel" || !t.query || typeof t.query != "object") return !1;
	let n = t.query;
	return !(!n.funnel || typeof n.funnel != "object");
}
var ys = {
	type: "funnel",
	createInitial() {
		return {
			funnelCube: null,
			funnelSteps: [],
			activeFunnelStepIndex: 0,
			funnelTimeDimension: null,
			funnelBindingKey: null
		};
	},
	extractState(e) {
		return {
			funnelCube: e.funnelCube,
			funnelSteps: e.funnelSteps,
			activeFunnelStepIndex: e.activeFunnelStepIndex,
			funnelTimeDimension: e.funnelTimeDimension,
			funnelBindingKey: e.funnelBindingKey
		};
	},
	canLoad(e) {
		return vs(e);
	},
	load(e) {
		if (e.analysisType !== "funnel") throw Error(`Cannot load ${e.analysisType} config with funnel adapter`);
		return _s(e.query);
	},
	save(e, t, n) {
		return {
			version: 1,
			analysisType: "funnel",
			activeView: n,
			charts: { funnel: t.funnel || this.getDefaultChartConfig() },
			query: gs(e)
		};
	},
	validate(e) {
		let t = [], n = [];
		e.funnelSteps.length < 2 && t.push("A funnel requires at least 2 steps"), e.funnelBindingKey?.dimension || t.push("A binding key is required to link funnel steps"), e.funnelTimeDimension || t.push("A time dimension is required for funnel ordering"), e.funnelSteps.forEach((e, t) => {
			(!e.name || e.name.trim() === "") && n.push(`Step ${t + 1} has no name`), e.filters.length === 0 && n.push(`Step ${t + 1} "${e.name}" has no filter - all events will match`);
		});
		let r = e.funnelSteps.map((e) => e.name.toLowerCase()), i = r.filter((e, t) => r.indexOf(e) !== t);
		return i.length > 0 && n.push(`Duplicate step names: ${[...new Set(i)].join(", ")}`), {
			isValid: t.length === 0,
			errors: t,
			warnings: n
		};
	},
	clear(e) {
		return {
			...this.createInitial(),
			funnelCube: e.funnelCube
		};
	},
	getDefaultChartConfig() {
		return {
			chartType: "funnel",
			chartConfig: {},
			displayConfig: {
				showLegend: !0,
				showGrid: !0,
				showTooltip: !0
			}
		};
	}
};
//#endregion
//#region src/client/adapters/flowModeAdapter.ts
function bs(e) {
	let t = "";
	return e.flowBindingKey && (typeof e.flowBindingKey.dimension == "string" ? t = e.flowBindingKey.dimension : Array.isArray(e.flowBindingKey.dimension) && (t = e.flowBindingKey.dimension.map((e) => ({
		cube: e.cube,
		dimension: e.dimension
	})))), { flow: {
		bindingKey: t,
		timeDimension: e.flowTimeDimension || "",
		startingStep: {
			name: e.startingStep.name || "Starting Step",
			filter: e.startingStep.filters.length === 1 ? e.startingStep.filters[0] : e.startingStep.filters.length > 1 ? e.startingStep.filters : void 0
		},
		stepsBefore: e.stepsBefore,
		stepsAfter: e.stepsAfter,
		eventDimension: e.eventDimension || "",
		joinStrategy: e.joinStrategy
	} };
}
function xs(e) {
	let { flow: t } = e, n = null;
	if (typeof t.bindingKey == "string") {
		let e = t.bindingKey.split(".");
		e.length > 0 && (n = e[0]);
	} else Array.isArray(t.bindingKey) && t.bindingKey.length > 0 && (n = t.bindingKey[0].cube);
	let r = null;
	t.bindingKey && (typeof t.bindingKey == "string" ? r = { dimension: t.bindingKey } : Array.isArray(t.bindingKey) && (r = { dimension: t.bindingKey.map((e) => ({
		cube: e.cube,
		dimension: e.dimension
	})) }));
	let i = null;
	t.timeDimension && (typeof t.timeDimension == "string" ? i = t.timeDimension : Array.isArray(t.timeDimension) && t.timeDimension.length > 0 && (i = `${t.timeDimension[0].cube}.${t.timeDimension[0].dimension}`));
	let a = [];
	return t.startingStep.filter && (a = Array.isArray(t.startingStep.filter) ? t.startingStep.filter : [t.startingStep.filter]), {
		flowCube: n,
		flowBindingKey: r,
		flowTimeDimension: i,
		startingStep: {
			name: t.startingStep.name || "",
			filters: a
		},
		stepsBefore: t.stepsBefore || 3,
		stepsAfter: t.stepsAfter || 3,
		eventDimension: t.eventDimension || null,
		joinStrategy: t.joinStrategy || "auto"
	};
}
function Ss(e) {
	if (!e || typeof e != "object") return !1;
	let t = e;
	if (t.version !== 1 || t.analysisType !== "flow" || !t.query || typeof t.query != "object") return !1;
	let n = t.query;
	return !(!n.flow || typeof n.flow != "object");
}
var Cs = {
	type: "flow",
	createInitial() {
		return {
			flowCube: null,
			flowBindingKey: null,
			flowTimeDimension: null,
			startingStep: {
				name: "",
				filters: []
			},
			stepsBefore: 3,
			stepsAfter: 3,
			eventDimension: null,
			joinStrategy: "auto"
		};
	},
	extractState(e) {
		return {
			flowCube: e.flowCube,
			flowBindingKey: e.flowBindingKey,
			flowTimeDimension: e.flowTimeDimension,
			startingStep: e.startingStep,
			stepsBefore: e.stepsBefore,
			stepsAfter: e.stepsAfter,
			eventDimension: e.eventDimension,
			joinStrategy: e.joinStrategy || "auto"
		};
	},
	canLoad(e) {
		return Ss(e);
	},
	load(e) {
		if (e.analysisType !== "flow") throw Error(`Cannot load ${e.analysisType} config with flow adapter`);
		return xs(e.query);
	},
	save(e, t, n) {
		return {
			version: 1,
			analysisType: "flow",
			activeView: n,
			charts: { flow: t.flow || this.getDefaultChartConfig() },
			query: bs(e)
		};
	},
	validate(e) {
		let t = [], n = [];
		return e.flowCube || t.push("Select an event stream cube for flow analysis"), e.flowBindingKey?.dimension || t.push("A binding key is required to link events to entities"), e.flowTimeDimension || t.push("A time dimension is required for event ordering"), e.eventDimension || t.push("An event dimension is required to categorize events"), e.startingStep.filters.length === 0 && t.push("The starting step must have at least one filter to identify the anchor event"), (e.stepsBefore < 0 || e.stepsBefore > 5) && t.push("Steps before must be between 0 and 5"), (e.stepsAfter < 0 || e.stepsAfter > 5) && t.push("Steps after must be between 0 and 5"), e.joinStrategy && ![
			"auto",
			"lateral",
			"window"
		].includes(e.joinStrategy) && t.push("Join strategy must be auto, lateral, or window"), e.startingStep.name || n.push("Starting step has no name - using default"), (e.stepsBefore >= 4 || e.stepsAfter >= 4) && n.push("High step depth (4-5) may impact query performance on large datasets"), {
			isValid: t.length === 0,
			errors: t,
			warnings: n
		};
	},
	clear(e) {
		return {
			...this.createInitial(),
			flowCube: e.flowCube
		};
	},
	getDefaultChartConfig() {
		return {
			chartType: "sankey",
			chartConfig: {},
			displayConfig: {
				showLegend: !0,
				showGrid: !1,
				showTooltip: !0
			}
		};
	}
};
//#endregion
//#region src/client/adapters/retentionModeAdapter.ts
function ws(e) {
	let t = "";
	e.retentionBindingKey && (typeof e.retentionBindingKey.dimension == "string" ? t = e.retentionBindingKey.dimension : Array.isArray(e.retentionBindingKey.dimension) && (t = e.retentionBindingKey.dimension.map((e) => ({
		cube: e.cube,
		dimension: e.dimension
	}))));
	let n = { retention: {
		timeDimension: e.retentionTimeDimension || "",
		bindingKey: t,
		dateRange: e.retentionDateRange,
		granularity: e.retentionViewGranularity,
		periods: e.retentionPeriods,
		retentionType: e.retentionType
	} };
	return e.retentionCohortFilters.length > 0 && (n.retention.cohortFilters = e.retentionCohortFilters.length === 1 ? e.retentionCohortFilters[0] : e.retentionCohortFilters), e.retentionActivityFilters.length > 0 && (n.retention.activityFilters = e.retentionActivityFilters.length === 1 ? e.retentionActivityFilters[0] : e.retentionActivityFilters), e.retentionBreakdowns && e.retentionBreakdowns.length > 0 && (n.retention.breakdownDimensions = e.retentionBreakdowns.map((e) => e.field)), n;
}
function Ts(e) {
	let { retention: t } = e, n = null;
	if (typeof t.timeDimension == "string") {
		let e = t.timeDimension.split(".");
		e.length > 0 && (n = e[0]);
	} else t.timeDimension?.cube && (n = t.timeDimension.cube);
	let r = null;
	t.bindingKey && (typeof t.bindingKey == "string" ? r = { dimension: t.bindingKey } : Array.isArray(t.bindingKey) && (r = { dimension: t.bindingKey.map((e) => ({
		cube: e.cube,
		dimension: e.dimension
	})) }));
	let i = null;
	t.timeDimension && (i = typeof t.timeDimension == "string" ? t.timeDimension : `${t.timeDimension.cube}.${t.timeDimension.dimension}`);
	let a = [];
	t.cohortFilters && (a = Array.isArray(t.cohortFilters) ? t.cohortFilters : [t.cohortFilters]);
	let o = [];
	t.activityFilters && (o = Array.isArray(t.activityFilters) ? t.activityFilters : [t.activityFilters]);
	let s = [];
	t.breakdownDimensions && Array.isArray(t.breakdownDimensions) && (s = t.breakdownDimensions.map((e) => ({
		field: e,
		label: e.split(".").pop() || e
	})));
	let c = t.dateRange || S("last_3_months");
	return {
		retentionCube: n,
		retentionBindingKey: r,
		retentionTimeDimension: i,
		retentionDateRange: c,
		retentionViewGranularity: t.granularity,
		retentionPeriods: t.periods,
		retentionType: t.retentionType,
		retentionCohortFilters: a,
		retentionActivityFilters: o,
		retentionBreakdowns: s
	};
}
function Es(e) {
	if (!e || typeof e != "object") return !1;
	let t = e;
	if (t.version !== 1 || t.analysisType !== "retention" || !t.query || typeof t.query != "object") return !1;
	let n = t.query;
	return !(!n.retention || typeof n.retention != "object");
}
var Ds = {
	type: "retention",
	createInitial() {
		return { ...b };
	},
	extractState(e) {
		return {
			retentionCube: e.retentionCube,
			retentionBindingKey: e.retentionBindingKey,
			retentionTimeDimension: e.retentionTimeDimension,
			retentionDateRange: e.retentionDateRange || S("last_3_months"),
			retentionViewGranularity: e.retentionViewGranularity || "week",
			retentionPeriods: e.retentionPeriods || 12,
			retentionType: e.retentionType || "classic",
			retentionCohortFilters: e.retentionCohortFilters || [],
			retentionActivityFilters: e.retentionActivityFilters || [],
			retentionBreakdowns: e.retentionBreakdowns || []
		};
	},
	canLoad(e) {
		return Es(e);
	},
	load(e) {
		if (e.analysisType !== "retention") throw Error(`Cannot load ${e.analysisType} config with retention adapter`);
		return Ts(e.query);
	},
	save(e, t, n) {
		return {
			version: 1,
			analysisType: "retention",
			activeView: n,
			charts: { retention: t.retention || this.getDefaultChartConfig() },
			query: ws(e)
		};
	},
	validate(e) {
		let t = [], n = [];
		if (e.retentionCube || t.push("Select a cube for retention analysis"), e.retentionTimeDimension || t.push("Select a timestamp dimension for the analysis"), e.retentionBindingKey?.dimension || t.push("Select a user identifier (binding key) to track retention"), !e.retentionDateRange?.start || !e.retentionDateRange?.end) t.push("Date range is required for retention analysis");
		else {
			let n = new Date(e.retentionDateRange.start), r = new Date(e.retentionDateRange.end);
			isNaN(n.getTime()) && t.push("Invalid start date format"), isNaN(r.getTime()) && t.push("Invalid end date format"), n > r && t.push("Start date must be before or equal to end date");
		}
		return e.retentionPeriods < 1 && t.push("At least 1 retention period is required"), e.retentionPeriods > 52 && n.push("More than 52 periods may impact performance"), e.retentionTimeDimension && e.retentionTimeDimension.split(".").length < 2 && n.push("Time dimension should be in format \"Cube.dimension\""), {
			isValid: t.length === 0,
			errors: t,
			warnings: n
		};
	},
	clear(e) {
		return {
			...this.createInitial(),
			retentionCube: e.retentionCube,
			retentionDateRange: e.retentionDateRange
		};
	},
	getDefaultChartConfig() {
		return {
			chartType: "retentionCombined",
			chartConfig: {},
			displayConfig: {
				showLegend: !0,
				showTooltip: !0,
				showGrid: !0,
				retentionDisplayMode: "combined"
			}
		};
	}
};
//#endregion
//#region src/client/components/portletAnalysisModal/saveValidation.ts
function Os(e) {
	return "flow" in e && e.flow ? !!(e.flow.bindingKey && e.flow.timeDimension && e.flow.eventDimension && e.flow.startingStep?.filter) : "retention" in e && e.retention ? !!(e.retention.bindingKey && e.retention.timeDimension && e.retention.dateRange?.start && e.retention.dateRange?.end) : "funnel" in e && e.funnel ? !!(e.funnel.steps && e.funnel.steps.length >= 2) : "queries" in e ? ks(e.queries[0]) : ks(e);
}
function ks(e) {
	return !!(e?.measures && e.measures.length > 0 || e?.dimensions && e.dimensions.length > 0 || e?.timeDimensions && e.timeDimensions.length > 0);
}
function As(e) {
	switch (e) {
		case "flow": return "Please configure the flow analysis (binding key, time dimension, event dimension, and starting step filter).";
		case "retention": return "Please configure the retention analysis (binding key, time dimension, and date range).";
		case "funnel": return "Please add at least two funnel steps.";
		default: return "Please add at least one metric or breakdown to your query.";
	}
}
//#endregion
//#region src/client/components/PortletAnalysisModal.tsx
function js({ isOpen: e, onClose: t, onSave: n, portlet: r, initialData: i, title: a, submitText: o, colorPalette: s }) {
	let { t: c } = R(), l = K(null), [u, d] = q(""), f = G(() => r ? Q(r).analysisConfig : null, [r]), p = G(() => {
		if (!f) return;
		let e = f.query;
		if (e) return e;
	}, [f]), m = G(() => {
		if (!f) return;
		let e = f.charts[f.analysisType];
		if (e) return {
			chartType: e.chartType,
			chartConfig: e.chartConfig,
			displayConfig: e.displayConfig
		};
	}, [f]), h = f?.analysisType, g = G(() => {
		if (f?.analysisType === "funnel") {
			if (r?.funnelSteps && r.funnelSteps.length > 0) return {
				funnelCube: r.funnelCube,
				funnelSteps: r.funnelSteps,
				funnelTimeDimension: r.funnelTimeDimension,
				funnelBindingKey: r.funnelBindingKey,
				funnelChartType: r.funnelChartType,
				funnelChartConfig: r.funnelChartConfig,
				funnelDisplayConfig: r.funnelDisplayConfig
			};
			if (f.query && "funnel" in f.query) {
				let e = ys.load(f), t = f.charts?.funnel;
				return {
					...e,
					funnelChartType: t?.chartType,
					funnelChartConfig: t?.chartConfig,
					funnelDisplayConfig: t?.displayConfig
				};
			}
		}
	}, [f, r]), _ = G(() => {
		if (f?.analysisType === "flow" && f.query && "flow" in f.query) {
			let e = Cs.load(f), t = f.charts?.flow;
			return {
				...e,
				flowChartType: t?.chartType,
				flowChartConfig: t?.chartConfig,
				flowDisplayConfig: t?.displayConfig
			};
		}
	}, [f]), v = G(() => {
		if (f?.analysisType === "retention" && f.query && "retention" in f.query) {
			let e = Ds.load(f), t = f.charts?.retention;
			return {
				...e,
				retentionChartType: t?.chartType,
				retentionChartConfig: t?.chartConfig,
				retentionDisplayConfig: t?.displayConfig
			};
		}
	}, [f]);
	W(() => {
		e && d(r?.title || "");
	}, [e, r]);
	let y = U(() => {
		if (!u.trim()) {
			alert("Please enter a title for the portlet.");
			return;
		}
		let e = l.current?.getAnalysisConfig();
		if (!e) {
			alert("Please configure a query before saving.");
			return;
		}
		let { query: i, analysisType: a } = e;
		if (!Os(i)) {
			alert(As(a));
			return;
		}
		n({
			...r || {},
			title: u.trim(),
			analysisConfig: e,
			dashboardFilterMapping: r?.dashboardFilterMapping,
			eagerLoad: r?.eagerLoad,
			w: r?.w || 5,
			h: r?.h || 4
		}), t();
	}, [
		u,
		r,
		n,
		t
	]), b = U(() => {
		t();
	}, [t]), x = /* @__PURE__ */ X(J, { children: [/* @__PURE__ */ Y("button", {
		type: "button",
		onClick: b,
		className: "dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-dc-text-secondary hover:text-dc-text bg-dc-surface dc:border border-dc-border dc:rounded-md hover:bg-dc-surface-hover dc:transition-colors",
		children: c("common.actions.cancel")
	}), /* @__PURE__ */ Y("button", {
		type: "button",
		onClick: y,
		className: "dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-white bg-dc-accent hover:bg-dc-accent-hover dc:rounded-md dc:transition-colors",
		children: o
	})] });
	return /* @__PURE__ */ Y(ps, {
		isOpen: e,
		onClose: t,
		title: a,
		size: "fullscreen-mobile",
		showCloseButton: !0,
		closeOnBackdropClick: !1,
		closeOnEscape: !0,
		noPadding: !0,
		footer: x,
		children: /* @__PURE__ */ X("div", {
			className: "dc:flex dc:flex-col dc:h-full",
			children: [/* @__PURE__ */ Y("div", {
				className: "dc:shrink-0 dc:px-4 dc:py-3 dc:border-b border-dc-border bg-dc-surface-secondary",
				children: /* @__PURE__ */ X("div", {
					className: "dc:flex dc:items-center dc:gap-3",
					children: [/* @__PURE__ */ Y("label", {
						htmlFor: "portlet-title",
						className: "dc:text-sm dc:font-medium text-dc-text-secondary dc:shrink-0",
						children: c("common.labels.title")
					}), /* @__PURE__ */ Y("input", {
						id: "portlet-title",
						type: "text",
						value: u,
						onChange: (e) => d(e.target.value),
						placeholder: "Enter portlet title...",
						autoComplete: "off",
						className: "dc:flex-1 dc:px-3 dc:py-1.5 dc:text-sm bg-dc-surface dc:border border-dc-border dc:rounded-md text-dc-text placeholder-dc-text-muted dc:focus:outline-none dc:focus:ring-2 focus:ring-dc-accent focus:border-transparent",
						autoFocus: !0
					})]
				})
			}), /* @__PURE__ */ Y("div", {
				className: "dc:flex-1 dc:min-h-0",
				children: /* @__PURE__ */ Y(hs, {
					ref: l,
					maxHeight: "100%",
					initialQuery: p,
					initialChartConfig: m,
					initialAnalysisType: h,
					initialFunnelState: g,
					initialFlowState: _,
					initialRetentionState: v,
					initialData: i,
					colorPalette: s,
					disableLocalStorage: !0,
					className: "dc:h-full"
				})
			})]
		})
	});
}
//#endregion
//#region src/client/components/AnalysisBuilder/StringArrayInput.tsx
function Ms({ label: e, value: t, onChange: n, placeholder: r, description: i }) {
	let [a, o] = q(() => t.join("\n"));
	W(() => {
		o(t.join("\n"));
	}, [t]);
	let s = U(() => {
		n(a.split("\n").map((e) => e.trim()).filter((e) => e.length > 0));
	}, [a, n]);
	return /* @__PURE__ */ X("div", {
		className: "dc:space-y-1",
		children: [
			/* @__PURE__ */ Y("label", {
				className: "dc:text-sm text-dc-text-secondary",
				children: e
			}),
			/* @__PURE__ */ Y("textarea", {
				value: a,
				onChange: (e) => o(e.target.value),
				onBlur: s,
				placeholder: r,
				rows: 4,
				className: "dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text dc:resize-y"
			}),
			i && /* @__PURE__ */ Y("p", {
				className: "dc:text-xs text-dc-text-muted",
				children: i
			})
		]
	});
}
//#endregion
//#region src/client/components/AnalysisBuilder/ColumnFormatsEditor.tsx
var Ns = [
	"text",
	"number",
	"date",
	"badge",
	"progress"
], Ps = ["bar", "circle"], Fs = [
	"hour",
	"day",
	"week",
	"month",
	"quarter",
	"year"
];
function Is({ value: e, chartConfig: t, colorPalette: n, onChange: r, t: i }) {
	let { getFieldLabel: a } = L(), [o, s] = q(null), c = t?.columns ?? [];
	if (c.length === 0) return /* @__PURE__ */ Y("p", {
		className: "dc:text-xs text-dc-text-muted",
		children: i("chart.recordsTable.columnFormats.noColumns")
	});
	let l = (t, n) => {
		let i = { ...e };
		!n || n.kind === "text" && !n.label && !n.align ? delete i[t] : i[t] = n, r(Object.keys(i).length > 0 ? i : void 0);
	};
	return /* @__PURE__ */ Y("div", {
		className: "dc:space-y-1",
		children: c.map((t) => /* @__PURE__ */ Y(Ls, {
			column: t,
			format: e[t] ?? { kind: "text" },
			fallbackLabel: a(t),
			isOpen: o === t,
			colorPalette: n,
			onToggle: () => s(o === t ? null : t),
			onChange: (e) => l(t, e),
			t: i
		}, t))
	});
}
function Ls({ format: e, fallbackLabel: t, isOpen: n, colorPalette: r, onToggle: i, onChange: a, t: o }) {
	return /* @__PURE__ */ X("div", {
		className: "dc:border border-dc-border dc:rounded-sm",
		children: [/* @__PURE__ */ X("button", {
			type: "button",
			onClick: i,
			className: "dc:w-full dc:flex dc:items-center dc:justify-between dc:gap-2 dc:px-2 dc:py-1.5 dc:text-sm text-dc-text hover:bg-dc-surface-secondary dc:cursor-pointer",
			children: [/* @__PURE__ */ Y("span", {
				className: "dc:truncate",
				children: e.label || t
			}), /* @__PURE__ */ Y("span", {
				className: "dc:text-xs text-dc-text-muted dc:shrink-0",
				children: o(`chart.recordsTable.columnFormats.kind.${e.kind}`)
			})]
		}), n && /* @__PURE__ */ X("div", {
			className: "dc:px-2 dc:py-2 dc:space-y-2 dc:border-t border-dc-border",
			children: [
				/* @__PURE__ */ Y(Bs, {
					kind: e.kind,
					onSelect: (t) => a({
						...e,
						kind: t
					}),
					t: o
				}),
				/* @__PURE__ */ Y(Rs, {
					format: e,
					colorPalette: r,
					onChange: a,
					t: o
				}),
				/* @__PURE__ */ X("label", {
					className: "dc:block dc:space-y-1",
					children: [/* @__PURE__ */ Y("span", {
						className: "dc:text-xs text-dc-text-secondary",
						children: o("chart.recordsTable.columnFormats.header")
					}), /* @__PURE__ */ Y("input", {
						type: "text",
						value: e.label ?? "",
						onChange: (t) => a({
							...e,
							label: t.target.value || void 0
						}),
						placeholder: t,
						className: "dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm bg-dc-surface text-dc-text"
					})]
				})
			]
		})]
	});
}
function Rs({ format: e, colorPalette: t, onChange: n, t: r }) {
	return e.kind === "number" ? /* @__PURE__ */ Y(ce, {
		axisLabel: r("chart.recordsTable.columnFormats.numberFormat"),
		value: e.numberFormat ?? {},
		onChange: (t) => n({
			...e,
			numberFormat: t
		}),
		previewValue: 1250
	}) : e.kind === "date" ? /* @__PURE__ */ X("label", {
		className: "dc:block dc:space-y-1",
		children: [/* @__PURE__ */ Y("span", {
			className: "dc:text-xs text-dc-text-secondary",
			children: r("chart.recordsTable.columnFormats.granularity")
		}), /* @__PURE__ */ Y("select", {
			value: e.dateGranularity ?? "day",
			onChange: (t) => n({
				...e,
				dateGranularity: t.target.value
			}),
			className: "dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm bg-dc-surface text-dc-text",
			children: Fs.map((e) => /* @__PURE__ */ Y("option", {
				value: e,
				children: r(`timeGranularity.${e}`)
			}, e))
		})]
	}) : e.kind === "badge" ? /* @__PURE__ */ Y(Hs, {
		format: e,
		colorPalette: t,
		onChange: n,
		t: r
	}) : e.kind === "progress" ? /* @__PURE__ */ Y(zs, {
		format: e,
		onChange: n,
		t: r
	}) : null;
}
function zs({ format: e, onChange: t, t: n }) {
	return /* @__PURE__ */ X("div", {
		className: "dc:space-y-2",
		children: [/* @__PURE__ */ X("div", {
			className: "dc:space-y-1",
			children: [/* @__PURE__ */ Y("span", {
				className: "dc:block dc:text-xs text-dc-text-secondary",
				children: n("chart.recordsTable.columnFormats.progressStyle")
			}), /* @__PURE__ */ Y(Vs, {
				style: e.progressStyle ?? "bar",
				onSelect: (n) => t({
					...e,
					progressStyle: n
				}),
				t: n
			})]
		}), /* @__PURE__ */ X("div", {
			className: "dc:flex dc:gap-2",
			children: [/* @__PURE__ */ Y(Us, {
				label: n("chart.recordsTable.columnFormats.progressMin"),
				value: e.progressMin ?? 0,
				onChange: (n) => t({
					...e,
					progressMin: n
				})
			}), /* @__PURE__ */ Y(Us, {
				label: n("chart.recordsTable.columnFormats.progressMax"),
				value: e.progressMax ?? 100,
				onChange: (n) => t({
					...e,
					progressMax: n
				})
			})]
		})]
	});
}
function Bs({ kind: e, onSelect: t, t: n }) {
	return /* @__PURE__ */ Y("div", {
		className: "dc:flex dc:border border-dc-border dc:rounded-sm dc:overflow-hidden",
		children: Ns.map((r) => /* @__PURE__ */ Y("button", {
			type: "button",
			onClick: () => t(r),
			className: `dc:flex-1 dc:px-1 dc:py-1 dc:text-xs dc:font-medium dc:transition-colors dc:cursor-pointer ${e === r ? "bg-dc-primary text-white" : "bg-dc-surface text-dc-text hover:bg-dc-border"}`,
			children: n(`chart.recordsTable.columnFormats.kind.${r}`)
		}, r))
	});
}
function Vs({ style: e, onSelect: t, t: n }) {
	return /* @__PURE__ */ Y("div", {
		className: "dc:flex dc:border border-dc-border dc:rounded-sm dc:overflow-hidden",
		children: Ps.map((r) => /* @__PURE__ */ Y("button", {
			type: "button",
			onClick: () => t(r),
			className: `dc:flex-1 dc:px-1 dc:py-1 dc:text-xs dc:font-medium dc:transition-colors dc:cursor-pointer ${e === r ? "bg-dc-primary text-white" : "bg-dc-surface text-dc-text hover:bg-dc-border"}`,
			children: n(`chart.recordsTable.columnFormats.progressStyle.${r}`)
		}, r))
	});
}
function Hs({ format: e, colorPalette: t, onChange: n, t: r }) {
	let i = Array.isArray(e.badgeColors) ? e.badgeColors : [], a = t?.colors ?? [], o = (t) => n({
		...e,
		badgeColors: t.length > 0 ? t : void 0
	});
	return /* @__PURE__ */ X("div", {
		className: "dc:space-y-1",
		children: [
			/* @__PURE__ */ Y("span", {
				className: "dc:text-xs text-dc-text-secondary",
				children: r("chart.recordsTable.columnFormats.badgeColours")
			}),
			i.map((e, t) => /* @__PURE__ */ X("div", {
				className: "dc:space-y-1 dc:border border-dc-border dc:rounded-sm dc:p-1.5",
				children: [/* @__PURE__ */ X("div", {
					className: "dc:flex dc:items-center dc:gap-2",
					children: [/* @__PURE__ */ Y("input", {
						type: "text",
						value: e.value,
						onChange: (e) => o(i.map((n, r) => r === t ? {
							...n,
							value: e.target.value
						} : n)),
						placeholder: r("chart.recordsTable.columnFormats.badgeValue"),
						"aria-label": r("chart.recordsTable.columnFormats.badgeValue"),
						className: "dc:flex-1 dc:min-w-0 dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm bg-dc-surface text-dc-text"
					}), /* @__PURE__ */ Y("button", {
						type: "button",
						onClick: () => o(i.filter((e, n) => n !== t)),
						title: r("chart.recordsTable.columnFormats.badgeRemove"),
						"aria-label": r("chart.recordsTable.columnFormats.badgeRemove"),
						className: "dc:px-2 dc:py-1 dc:text-sm dc:shrink-0 dc:rounded-sm text-dc-danger hover:bg-dc-danger-bg dc:cursor-pointer",
						children: "×"
					})]
				}), /* @__PURE__ */ Y("div", {
					className: "dc:flex dc:flex-wrap dc:gap-1",
					children: a.map((n, a) => /* @__PURE__ */ Y("button", {
						type: "button",
						onClick: () => o(i.map((e, n) => n === t ? {
							...e,
							colorIndex: a
						} : e)),
						title: n,
						"aria-label": `${r("chart.recordsTable.columnFormats.badgeColour")} ${a + 1}`,
						className: `dc:w-6 dc:h-6 dc:rounded-sm dc:border-2 dc:cursor-pointer dc:transition-transform dc:hover:scale-110 ${e.colorIndex === a ? "dc:ring-2 dc:ring-offset-1 dc:scale-110" : ""}`,
						style: {
							backgroundColor: n,
							borderColor: e.colorIndex === a ? "var(--dc-primary)" : "var(--dc-border)"
						}
					}, a))
				})]
			}, t)),
			/* @__PURE__ */ Y("button", {
				type: "button",
				onClick: () => o([...i, {
					value: "",
					colorIndex: i.length % Math.max(1, a.length)
				}]),
				className: "dc:text-xs dc:px-2 dc:py-1 dc:rounded-sm dc:border border-dc-border text-dc-text-secondary hover:bg-dc-surface-hover dc:cursor-pointer",
				children: r("chart.recordsTable.columnFormats.badgeAdd")
			})
		]
	});
}
function Us({ label: e, value: t, onChange: n }) {
	return /* @__PURE__ */ X("label", {
		className: "dc:flex-1 dc:space-y-1",
		children: [/* @__PURE__ */ Y("span", {
			className: "dc:text-xs text-dc-text-secondary",
			children: e
		}), /* @__PURE__ */ Y("input", {
			type: "number",
			value: t,
			onChange: (e) => {
				let t = Number(e.target.value);
				Number.isFinite(t) && n(t);
			},
			"aria-label": e,
			className: "dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm bg-dc-surface text-dc-text"
		})]
	});
}
//#endregion
//#region src/client/components/AnalysisBuilder/DisplayOptionControl.tsx
var Ws = "#22c55e";
function Gs({ description: e, t }) {
	return e ? /* @__PURE__ */ Y("p", {
		className: "dc:text-xs text-dc-text-muted",
		children: t(e)
	}) : null;
}
function Ks({ option: e, displayConfig: t, setValue: n, t: r }) {
	let i = e.key;
	return /* @__PURE__ */ X("label", {
		className: "dc:flex dc:items-center dc:space-x-2",
		children: [/* @__PURE__ */ Y("input", {
			type: "checkbox",
			checked: t[i] ?? e.defaultValue ?? !1,
			onChange: (e) => n(e.target.checked),
			className: "dc:rounded-sm border-dc-border focus:ring-dc-accent",
			style: { color: "var(--dc-primary)" }
		}), /* @__PURE__ */ Y("span", {
			className: "dc:text-sm text-dc-text",
			children: r(e.label)
		})]
	});
}
function qs({ option: e, displayConfig: t, setValue: n, t: r }) {
	let i = t[e.key] ?? e.defaultValue ?? "";
	return /* @__PURE__ */ X("div", {
		className: "dc:space-y-1",
		children: [
			/* @__PURE__ */ X("label", {
				className: "dc:text-sm text-dc-text-secondary",
				children: [r(e.label), e.key === "content" && /* @__PURE__ */ Y("span", {
					className: "dc:text-xs text-dc-text-muted dc:ml-1",
					children: "(only headers, lists and links)"
				})]
			}),
			e.key === "content" ? /* @__PURE__ */ Y("textarea", {
				value: i,
				onChange: (e) => n(e.target.value),
				placeholder: e.placeholder,
				rows: 8,
				className: "dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent dc:font-mono dc:resize-y bg-dc-surface text-dc-text"
			}) : /* @__PURE__ */ Y("input", {
				type: "text",
				value: i,
				onChange: (e) => n(e.target.value),
				placeholder: e.placeholder,
				className: "dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
			}),
			/* @__PURE__ */ Y(Gs, {
				description: e.description,
				t: r
			})
		]
	});
}
function Js({ option: e, displayConfig: t, colorPalette: n, setValue: r, t: i }) {
	let a = t[e.key] ?? e.defaultValue ?? 0;
	return /* @__PURE__ */ X("div", {
		className: "dc:space-y-1",
		children: [
			/* @__PURE__ */ Y("label", {
				className: "dc:text-sm text-dc-text-secondary",
				children: i(e.label)
			}),
			/* @__PURE__ */ Y("div", {
				className: "dc:flex dc:flex-wrap dc:gap-2",
				children: n?.colors.map((e, t) => /* @__PURE__ */ Y("button", {
					type: "button",
					onClick: () => r(t),
					className: `dc:w-8 dc:h-8 dc:rounded-sm dc:border-2 dc:transition-all dc:duration-200 dc:hover:scale-110 focus:outline-hidden dc:focus:ring-2 focus:ring-dc-accent dc:focus:ring-offset-1 ${a === t ? "dc:ring-2 dc:ring-offset-1 dc:scale-110" : "hover:border-dc-text-muted"}`,
					style: {
						backgroundColor: e,
						borderColor: a === t ? "var(--dc-primary)" : "var(--dc-border)"
					},
					title: `Color ${t + 1}: ${e}`
				}, t)) || [/* @__PURE__ */ Y("button", {
					type: "button",
					onClick: () => r(0),
					className: "dc:w-8 dc:h-8 dc:rounded-sm dc:border-2 dc:ring-2 dc:ring-offset-1",
					style: {
						backgroundColor: "#8884d8",
						borderColor: "var(--dc-primary)",
						boxShadow: "0 0 0 2px var(--dc-primary)"
					},
					title: "Default Color"
				}, 0)]
			}),
			/* @__PURE__ */ Y(Gs, {
				description: e.description,
				t: i
			})
		]
	});
}
function Ys({ option: e, displayConfig: t, setValue: n, t: r }) {
	let i = e.key;
	return /* @__PURE__ */ X("div", {
		className: "dc:space-y-1",
		children: [
			/* @__PURE__ */ Y("label", {
				className: "dc:text-sm text-dc-text-secondary",
				children: r(e.label)
			}),
			/* @__PURE__ */ Y("input", {
				type: "number",
				value: t[i] ?? e.defaultValue ?? 0,
				onChange: (e) => n(e.target.value === "" ? void 0 : Number(e.target.value)),
				placeholder: e.placeholder,
				min: e.min,
				max: e.max,
				step: e.step,
				className: "dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
			}),
			/* @__PURE__ */ Y(Gs, {
				description: e.description,
				t: r
			})
		]
	});
}
function Xs({ option: e, displayConfig: t, setValue: n, t: r }) {
	let i = e.key;
	return /* @__PURE__ */ X("div", {
		className: "dc:space-y-1",
		children: [
			/* @__PURE__ */ Y("label", {
				className: "dc:text-sm text-dc-text-secondary",
				children: r(e.label)
			}),
			/* @__PURE__ */ Y("select", {
				value: t[i] ?? e.defaultValue ?? "",
				onChange: (e) => n(e.target.value),
				className: "dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text",
				children: e.options?.map((e) => /* @__PURE__ */ Y("option", {
					value: e.value,
					children: r(e.label)
				}, e.value))
			}),
			/* @__PURE__ */ Y(Gs, {
				description: e.description,
				t: r
			})
		]
	});
}
function Zs({ option: e, displayConfig: t, setValue: n, t: r }) {
	let i = t[e.key] ?? e.defaultValue ?? "#8884d8";
	return /* @__PURE__ */ X("div", {
		className: "dc:space-y-1",
		children: [
			/* @__PURE__ */ Y("label", {
				className: "dc:text-sm text-dc-text-secondary",
				children: r(e.label)
			}),
			/* @__PURE__ */ X("div", {
				className: "dc:flex dc:items-center dc:space-x-2",
				children: [/* @__PURE__ */ Y("input", {
					type: "color",
					value: i,
					onChange: (e) => n(e.target.value),
					className: "dc:w-12 dc:h-8 dc:border border-dc-border dc:rounded-sm dc:cursor-pointer"
				}), /* @__PURE__ */ Y("input", {
					type: "text",
					value: i,
					onChange: (e) => n(e.target.value),
					placeholder: e.placeholder || "#8884d8",
					className: "dc:flex-1 dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
				})]
			}),
			/* @__PURE__ */ Y(Gs, {
				description: e.description,
				t: r
			})
		]
	});
}
function Qs({ option: e, displayConfig: t, setValue: n, t: r }) {
	let i = e.key;
	return /* @__PURE__ */ Y(ce, {
		axisLabel: r(e.label),
		value: t[i] || {},
		onChange: (e) => n(Object.keys(e).length > 0 ? e : void 0)
	});
}
function $s({ option: e, displayConfig: t, setValue: n, t: r }) {
	let i = e.key;
	return /* @__PURE__ */ Y(Ms, {
		label: r(e.label),
		value: t[i] ?? [],
		onChange: (e) => n(e.length > 0 ? e : void 0),
		placeholder: e.placeholder,
		description: e.description ? r(e.description) : void 0
	});
}
function ec({ option: e, displayConfig: t, setValue: n, t: r }) {
	let i = e.key;
	return /* @__PURE__ */ X("div", {
		className: "dc:space-y-1",
		children: [
			/* @__PURE__ */ Y("label", {
				className: "dc:text-sm text-dc-text-secondary",
				children: r(e.label)
			}),
			/* @__PURE__ */ Y("div", {
				className: "dc:flex dc:border border-dc-border dc:rounded-sm dc:overflow-hidden",
				children: e.options?.map((a) => /* @__PURE__ */ Y("button", {
					type: "button",
					onClick: () => n(a.value),
					className: `dc:flex-1 dc:px-3 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors ${(t[i] ?? e.defaultValue) === a.value ? "bg-dc-primary text-white" : "bg-dc-surface text-dc-text hover:bg-dc-border"}`,
					children: r(a.label)
				}, a.value))
			}),
			/* @__PURE__ */ Y(Gs, {
				description: e.description,
				t: r
			})
		]
	});
}
function tc({ option: e, displayConfig: t, setValue: n, t: r }) {
	let i = t[e.key], a = le(i), o = Number(t.minValue ?? 0), s = Number(t.maxValue ?? 100) - o, c = Number.isFinite(s) && s !== 0, l = (e) => c ? o + e * s : e, u = (e) => c ? (e - o) / s : e, d = (e) => {
		let t = [...e].sort((e, t) => e.value - t.value);
		n(t.length > 0 ? t : void 0);
	}, f = (e, t) => d(a.map((n, r) => r === e ? {
		...n,
		...t
	} : n));
	return /* @__PURE__ */ X("div", {
		className: "dc:space-y-1",
		children: [
			/* @__PURE__ */ Y("label", {
				className: "dc:text-sm text-dc-text-secondary",
				children: r(e.label)
			}),
			/* @__PURE__ */ Y("div", {
				className: "dc:space-y-1",
				children: a.map((e, t) => /* @__PURE__ */ X("div", {
					className: "dc:flex dc:items-center dc:gap-2",
					children: [
						/* @__PURE__ */ Y("input", {
							type: "color",
							value: e.color,
							onChange: (e) => f(t, { color: e.target.value }),
							"aria-label": r("chart.gauge.thresholds.colour"),
							className: "dc:w-10 dc:h-8 dc:shrink-0 dc:border border-dc-border dc:rounded-sm dc:cursor-pointer"
						}),
						/* @__PURE__ */ Y("input", {
							type: "number",
							value: Number(l(e.value).toFixed(4)),
							onChange: (e) => {
								let n = Number(e.target.value);
								Number.isFinite(n) && f(t, { value: u(n) });
							},
							"aria-label": r("chart.gauge.thresholds.from"),
							className: "dc:flex-1 dc:min-w-0 dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
						}),
						/* @__PURE__ */ Y("button", {
							type: "button",
							onClick: () => d(a.filter((e, n) => n !== t)),
							title: r("chart.gauge.thresholds.remove"),
							className: "dc:px-2 dc:py-1 dc:text-sm dc:shrink-0 dc:rounded-sm text-dc-danger hover:bg-dc-danger-bg dc:cursor-pointer",
							children: "×"
						})
					]
				}, t))
			}),
			/* @__PURE__ */ Y("button", {
				type: "button",
				onClick: () => {
					let e = a[a.length - 1], t = e ? Math.min(1, (e.value + 1) / 2) : 0;
					d([...a, {
						value: t,
						color: Ws
					}]);
				},
				className: "dc:text-xs dc:px-2 dc:py-1 dc:rounded-sm dc:border border-dc-border text-dc-text-secondary hover:bg-dc-surface-hover dc:cursor-pointer",
				children: r("chart.gauge.thresholds.add")
			}),
			/* @__PURE__ */ Y(Gs, {
				description: e.description,
				t: r
			})
		]
	});
}
function nc({ option: e, displayConfig: t, chartConfig: n, colorPalette: r, setValue: i, t: a }) {
	let o = e.key;
	return /* @__PURE__ */ X("div", {
		className: "dc:space-y-1",
		children: [
			/* @__PURE__ */ Y("label", {
				className: "dc:text-sm text-dc-text-secondary",
				children: a(e.label)
			}),
			/* @__PURE__ */ Y(Is, {
				value: t[o] ?? {},
				chartConfig: n,
				colorPalette: r,
				onChange: i,
				t: a
			}),
			/* @__PURE__ */ Y(Gs, {
				description: e.description,
				t: a
			})
		]
	});
}
function rc({ option: e, displayConfig: t, setValue: n, t: r }) {
	let i = t[e.key] ?? { urlTemplate: "" }, a = (e) => n(e.urlTemplate.trim() ? e : void 0);
	return /* @__PURE__ */ X("div", {
		className: "dc:space-y-1",
		children: [
			/* @__PURE__ */ Y("label", {
				className: "dc:text-sm text-dc-text-secondary",
				children: r(e.label)
			}),
			/* @__PURE__ */ Y("input", {
				type: "text",
				value: i.urlTemplate,
				onChange: (e) => a({
					...i,
					urlTemplate: e.target.value
				}),
				placeholder: r("chart.recordsTable.rowLink.placeholder"),
				"aria-label": r("chart.recordsTable.rowLink.urlTemplate"),
				className: "dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
			}),
			/* @__PURE__ */ Y("div", {
				className: "dc:flex dc:border border-dc-border dc:rounded-sm dc:overflow-hidden",
				children: ["self", "blank"].map((e) => /* @__PURE__ */ Y("button", {
					type: "button",
					onClick: () => a({
						...i,
						target: e
					}),
					className: `dc:flex-1 dc:px-2 dc:py-1 dc:text-xs dc:font-medium dc:cursor-pointer ${(i.target ?? "self") === e ? "bg-dc-primary text-white" : "bg-dc-surface text-dc-text hover:bg-dc-border"}`,
					children: r(`chart.recordsTable.rowLink.target.${e}`)
				}, e))
			}),
			/* @__PURE__ */ Y(Gs, {
				description: e.description,
				t: r
			})
		]
	});
}
var ic = {
	boolean: Ks,
	string: qs,
	paletteColor: Js,
	number: Ys,
	select: Xs,
	color: Zs,
	axisFormat: Qs,
	stringArray: $s,
	buttonGroup: ec,
	thresholdBands: tc,
	columnFormats: nc,
	rowLink: rc
};
function ac({ option: e, displayConfig: t, colorPalette: n, chartConfig: r, onDisplayConfigChange: i }) {
	let { t: a } = R(), o = (n) => i({
		...t,
		[e.key]: n
	}), s = ic[e.type];
	return s ? /* @__PURE__ */ Y(s, {
		option: e,
		displayConfig: t,
		colorPalette: n,
		chartConfig: r,
		setValue: o,
		t: a
	}) : null;
}
//#endregion
//#region src/client/components/AnalysisBuilder/LegacyBooleanOptions.tsx
var oc = [
	{
		key: "showLegend",
		labelKey: "display.showLegend",
		defaultChecked: !0
	},
	{
		key: "showGrid",
		labelKey: "display.showGrid",
		defaultChecked: !0
	},
	{
		key: "showTooltip",
		labelKey: "display.showTooltip",
		defaultChecked: !0
	},
	{
		key: "stacked",
		labelKey: "display.stacked",
		defaultChecked: !1
	},
	{
		key: "showAllXLabels",
		labelKey: "chart.option.showAllXLabels.label",
		defaultChecked: !1
	},
	{
		key: "hideHeader",
		labelKey: "display.hideHeader",
		defaultChecked: !1
	}
], sc = H(function({ displayOptions: e, displayConfig: t, onDisplayConfigChange: n }) {
	let { t: r } = R();
	return !e || e.length === 0 ? null : /* @__PURE__ */ Y(J, { children: oc.filter((t) => e.includes(t.key)).map((e) => /* @__PURE__ */ X("label", {
		className: "dc:flex dc:items-center dc:space-x-2",
		children: [/* @__PURE__ */ Y("input", {
			type: "checkbox",
			checked: t[e.key] ?? e.defaultChecked,
			onChange: (r) => n({
				...t,
				[e.key]: r.target.checked
			}),
			className: "dc:rounded-sm border-dc-border focus:ring-dc-accent",
			style: { color: "var(--dc-primary)" }
		}), /* @__PURE__ */ Y("span", {
			className: "dc:text-sm text-dc-text",
			children: r(e.labelKey)
		})]
	}, e.key)) });
});
//#endregion
//#region src/client/components/AnalysisBuilder/AnalysisDisplayConfigPanel.tsx
function cc({ chartType: e, displayConfig: t, colorPalette: n, chartConfig: r, onDisplayConfigChange: i, excludeKeys: a }) {
	let { t: o } = R(), { config: s, loaded: c } = h(e);
	return c ? s.displayOptions && s.displayOptions.length > 0 || s.displayOptionsConfig && s.displayOptionsConfig.length > 0 ? /* @__PURE__ */ Y("div", {
		className: "dc:space-y-6",
		children: /* @__PURE__ */ X("div", { children: [/* @__PURE__ */ Y(se, {
			className: "dc:mb-2",
			children: o("display.heading")
		}), /* @__PURE__ */ X("div", {
			className: "dc:space-y-2",
			children: [/* @__PURE__ */ Y(sc, {
				displayOptions: s.displayOptions,
				displayConfig: t,
				onDisplayConfigChange: i
			}), s.displayOptionsConfig?.filter((e) => !a?.includes(e.key)).map((e) => /* @__PURE__ */ Y("div", {
				className: `dc:space-y-1 ${e.type === "axisFormat" ? "dc:mt-6 dc:pt-2" : ""}`,
				children: /* @__PURE__ */ Y(ac, {
					option: e,
					displayConfig: t,
					colorPalette: n,
					chartConfig: r,
					onDisplayConfigChange: i
				})
			}, e.key))]
		})] })
	}) : /* @__PURE__ */ Y("div", {
		className: "dc:text-center text-dc-text-muted dc:text-sm dc:py-4",
		children: /* @__PURE__ */ Y("p", { children: o("display.noOptions") })
	}) : /* @__PURE__ */ Y("div", {
		className: "dc:text-center text-dc-text-muted dc:text-sm dc:py-4",
		children: o("display.loading")
	});
}
//#endregion
//#region src/client/components/TextPortletModal.tsx
var lc = v("close");
function uc({ isOpen: e, onClose: t, onSave: n, portlet: r, colorPalette: i, existingTitles: a = [] }) {
	let { t: o } = R(), s = G(() => r ? Q(r).analysisConfig.charts.query?.displayConfig ?? {} : {
		content: "",
		hideHeader: !0,
		autoHeight: !0,
		fontSize: "medium",
		alignment: "left",
		accentColorIndex: 0,
		transparentBackground: !1,
		accentBorder: "none"
	}, [r]), [c, l] = q(s), [u, d] = q(() => r?.title ?? ""), [f, p] = q(!1), [m, h] = q(r);
	if (r !== m) {
		if (h(r), p(!1), r) {
			let e = Q(r).analysisConfig.charts.query;
			l(e?.displayConfig ?? {}), d(r.title ?? "");
		} else l({
			content: "",
			hideHeader: !0,
			autoHeight: !0,
			fontSize: "medium",
			alignment: "left",
			accentColorIndex: 0,
			transparentBackground: !1,
			accentBorder: "none"
		}), d("");
	}
	let g = U((e) => {
		d(e), p(!0);
	}, []), _ = G(() => {
		if (f) return u;
		if (r?.title) return r.title;
		let e = "Text", t = 2;
		for (; a.includes(e);) e = `Text ${t}`, t++;
		return e;
	}, [
		u,
		f,
		r,
		a
	]), v = U((e) => {
		l(e);
	}, []), y = U(() => {
		let e = {
			...c,
			autoHeight: c.autoHeight ?? !0,
			hideHeader: c.hideHeader ?? !0
		};
		_.trim() || (e.hideHeader = !0);
		let t = {
			version: 1,
			analysisType: "query",
			activeView: "chart",
			charts: { query: {
				chartType: "markdown",
				chartConfig: {},
				displayConfig: e
			} },
			query: {}
		};
		n(r ? {
			...r,
			title: _,
			analysisConfig: t
		} : {
			title: _,
			analysisConfig: t,
			w: 12,
			h: 3
		});
	}, [
		c,
		r,
		_,
		n
	]), b = U((e) => {
		l((t) => ({
			...t,
			content: e
		}));
	}, []);
	return e ? /* @__PURE__ */ X("div", {
		className: "dc:fixed dc:inset-0 dc:z-50 dc:flex dc:items-center dc:justify-center",
		onClick: t,
		children: [/* @__PURE__ */ Y("div", { className: "dc:absolute dc:inset-0 dc:bg-black/50" }), /* @__PURE__ */ X("div", {
			className: "dc:relative dc:w-full dc:max-w-5xl dc:mx-4 dc:max-h-[85vh] dc:flex dc:flex-col bg-dc-surface dc:rounded-lg dc:border border-dc-border",
			style: { boxShadow: "var(--dc-shadow-xl)" },
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ X("div", {
					className: "dc:flex dc:items-center dc:justify-between dc:px-6 dc:py-4 dc:border-b border-dc-border dc:shrink-0",
					children: [/* @__PURE__ */ Y("h2", {
						className: "dc:text-lg dc:font-semibold text-dc-text",
						children: o(r ? "textPortlet.editText" : "textPortlet.addText")
					}), /* @__PURE__ */ Y("button", {
						onClick: t,
						className: "dc:p-1 dc:rounded-md text-dc-text-secondary dc:hover:bg-dc-surface-hover dc:transition-colors",
						children: /* @__PURE__ */ Y(lc, { className: "dc:w-5 dc:h-5" })
					})]
				}),
				/* @__PURE__ */ Y("div", {
					className: "dc:flex-1 dc:min-h-0 dc:overflow-y-auto dc:p-6",
					children: /* @__PURE__ */ X("div", {
						className: "dc:flex dc:gap-6 dc:h-full",
						children: [/* @__PURE__ */ X("div", {
							className: "dc:flex-1 dc:min-w-0 dc:flex dc:flex-col dc:gap-4",
							children: [
								!c.transparentBackground && /* @__PURE__ */ X("div", { children: [/* @__PURE__ */ Y("label", {
									className: "dc:block dc:text-sm dc:font-medium text-dc-text dc:mb-1.5",
									children: o("common.labels.title")
								}), /* @__PURE__ */ Y("input", {
									type: "text",
									value: u,
									onChange: (e) => g(e.target.value),
									placeholder: "Text",
									className: "dc:w-full dc:rounded-md dc:border border-dc-border bg-dc-surface dc:px-3 dc:py-2 dc:text-sm text-dc-text focus:outline-hidden dc:focus:ring-2 focus:ring-dc-accent"
								})] }),
								/* @__PURE__ */ X("div", { children: [
									/* @__PURE__ */ Y("label", {
										className: "dc:block dc:text-sm dc:font-medium text-dc-text dc:mb-1.5",
										children: o("textPortlet.markdownContent")
									}),
									/* @__PURE__ */ Y("textarea", {
										value: c.content || "",
										onChange: (e) => b(e.target.value),
										placeholder: "# Welcome\n\nAdd your **markdown** content here:\n\n- Lists with bullets\n- [Links](https://example.com)\n- *Italic* and **bold** text\n\n---\n\nUse --- for horizontal rules.",
										className: "dc:w-full dc:rounded-md dc:border border-dc-border bg-dc-surface dc:px-3 dc:py-2 dc:text-sm text-dc-text dc:font-mono dc:resize-y focus:outline-hidden dc:focus:ring-2 focus:ring-dc-accent",
										style: { minHeight: "140px" },
										rows: 7
									}),
									/* @__PURE__ */ Y("p", {
										className: "dc:mt-1 dc:text-xs text-dc-text-muted",
										children: o("textPortlet.markdownHint")
									})
								] }),
								/* @__PURE__ */ X("div", {
									className: "dc:flex-1 dc:min-h-0",
									children: [/* @__PURE__ */ Y("div", {
										className: "dc:text-xs dc:font-medium dc:uppercase dc:tracking-wider text-dc-text-muted dc:mb-2",
										children: o("textPortlet.preview")
									}), /* @__PURE__ */ Y("div", {
										className: "dc:overflow-hidden",
										style: { minHeight: "200px" },
										children: /* @__PURE__ */ Y(ue, {
											data: [],
											displayConfig: c,
											colorPalette: i,
											height: "auto"
										})
									})]
								})
							]
						}), /* @__PURE__ */ Y("div", {
							className: "dc:w-72 dc:shrink-0",
							children: /* @__PURE__ */ Y(cc, {
								chartType: "markdown",
								displayConfig: c,
								colorPalette: i,
								onDisplayConfigChange: v,
								excludeKeys: ["content", "hideHeader"]
							})
						})]
					})
				}),
				/* @__PURE__ */ X("div", {
					className: "dc:flex dc:items-center dc:justify-end dc:gap-3 dc:px-6 dc:py-4 dc:border-t border-dc-border dc:shrink-0",
					children: [/* @__PURE__ */ Y("button", {
						onClick: t,
						className: "dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:rounded-md dc:border border-dc-border text-dc-text-secondary dc:hover:bg-dc-surface-hover dc:transition-colors",
						children: o("common.actions.cancel")
					}), /* @__PURE__ */ Y("button", {
						onClick: y,
						className: "dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:rounded-md dc:text-white dc:transition-colors",
						style: { backgroundColor: "var(--dc-primary)" },
						children: r ? "Update" : "Save"
					})]
				})
			]
		})]
	}) : null;
}
//#endregion
//#region src/client/utils/joinReachability.ts
function dc(e, t) {
	let n = new Set(t);
	if (!e?.cubes || t.length === 0) return n;
	let r = /* @__PURE__ */ new Map(), i = (e, t) => {
		r.has(e) || r.set(e, /* @__PURE__ */ new Set()), r.has(t) || r.set(t, /* @__PURE__ */ new Set()), r.get(e).add(t), r.get(t).add(e);
	};
	e.cubes.forEach((e) => {
		e.relationships?.forEach((t) => i(e.name, t.targetCube));
	});
	let a = [...t];
	for (; a.length > 0;) {
		let e = a.shift(), t = r.get(e);
		t && t.forEach((e) => {
			n.has(e) || (n.add(e), a.push(e));
		});
	}
	return n;
}
function fc(e) {
	let t = e.indexOf(".");
	return t > 0 ? e.substring(0, t) : null;
}
function pc(e) {
	let t = /* @__PURE__ */ new Set(), n = (e) => {
		if (typeof e == "string") {
			let n = fc(e);
			n && t.add(n);
		}
	}, r = (e) => {
		Array.isArray(e?.measures) && e.measures.forEach(n), Array.isArray(e?.dimensions) && e.dimensions.forEach(n), Array.isArray(e?.timeDimensions) && e.timeDimensions.forEach((e) => n(e?.dimension));
	};
	try {
		let i = Q(e).analysisConfig.query;
		if (!i) return [];
		if ("funnel" in i) {
			let e = i.funnel;
			typeof e?.timeDimension == "string" ? n(e.timeDimension) : Array.isArray(e?.timeDimension) && e.timeDimension.forEach((e) => e?.cube && t.add(e.cube)), typeof e?.bindingKey == "string" ? n(e.bindingKey) : Array.isArray(e?.bindingKey) && e.bindingKey.forEach((e) => e?.cube && t.add(e.cube)), Array.isArray(e?.steps) && e.steps.forEach((e) => e?.cube && t.add(e.cube));
		} else "queries" in i && Array.isArray(i.queries) ? i.queries.forEach(r) : r(i);
	} catch (t) {
		console.warn("Failed to extract cubes from portlet:", e.id, t);
	}
	return [...t];
}
function mc(e, t, n) {
	if (!e?.cubes) return [];
	let r = pc(t);
	if (r.length === 0) return [];
	let i = dc(e, r), a;
	if (n?.sameTypeAs) for (let t of e.cubes) {
		let e = t.dimensions?.find((e) => e.name === n.sameTypeAs);
		if (e) {
			a = e.type;
			break;
		}
	}
	return e.cubes.filter((e) => i.has(e.name)).map((e) => ({
		cubeName: e.name,
		cubeTitle: e.title || e.name,
		dimensions: (e.dimensions || []).filter((e) => !a || e.type === a)
	})).filter((e) => e.dimensions.length > 0);
}
//#endregion
//#region src/client/components/PortletFilterConfigModal.tsx
function hc({ isOpen: e, onClose: t, dashboardFilters: n = [], currentMapping: r = [], onSave: i, portletTitle: a, schema: o = null, portlet: s = null }) {
	let { t: c } = R(), [l, u] = q(() => Ze(r));
	W(() => {
		u((e) => {
			let t = Ze(r);
			return JSON.stringify(t) === JSON.stringify(e) ? e : t;
		});
	}, [r, e]);
	let d = (e) => {
		u((t) => t.some((t) => t.filterId === e) ? t.filter((t) => t.filterId !== e) : [...t, { filterId: e }]);
	}, f = (e, t) => {
		u((n) => n.map((n) => n.filterId === e ? t ? {
			filterId: e,
			member: t
		} : { filterId: e } : n));
	}, p = () => {
		i(Qe(l)), t();
	}, m = () => {
		u(Ze(r)), t();
	}, h = G(() => {
		let e = /* @__PURE__ */ new Map();
		return !o || !s || n.forEach((t) => {
			t.isUniversalTime || !("member" in t.filter) || !t.filter.member || e.has(t.filter.member) || e.set(t.filter.member, mc(o, s, { sameTypeAs: t.filter.member }));
		}), e;
	}, [
		o,
		s,
		n
	]), g = (e) => {
		if (!e.filter) return "";
		if ("member" in e.filter && e.filter.member) {
			let t = e.filter.values || [], n = t.length > 0 ? t.join(", ") : c("portlet.filterConfig.noValue");
			return `${e.filter.member} ${e.filter.operator} ${n}`;
		}
		if ("type" in e.filter && e.filter.type) {
			let t = e.filter.filters?.length || 0;
			return c(t === 1 ? "portlet.filterConfig.groupFilter" : "portlet.filterConfig.groupFilterPlural", {
				type: e.filter.type.toUpperCase(),
				count: t
			});
		}
		return c("portlet.filterConfig.complexFilter");
	};
	return e ? /* @__PURE__ */ Y("div", {
		className: "dc:fixed dc:inset-0 dc:z-50 dc:flex dc:items-center dc:justify-center bg-black bg-opacity-50",
		onClick: m,
		children: /* @__PURE__ */ X("div", {
			className: "bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:max-w-2xl dc:w-full dc:mx-4 dc:max-h-[80vh] dc:flex dc:flex-col",
			style: { boxShadow: "var(--dc-shadow-lg)" },
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ X("div", {
					className: "dc:px-6 dc:py-4 dc:border-b border-dc-border bg-dc-surface-secondary dc:rounded-t-lg",
					children: [/* @__PURE__ */ Y("h2", {
						className: "dc:text-lg dc:font-semibold text-dc-text",
						children: c("portlet.filterConfig.title")
					}), /* @__PURE__ */ Y("p", {
						className: "dc:text-sm text-dc-text-secondary dc:mt-1",
						children: c("portlet.filterConfig.subtitle", { portletTitle: a })
					})]
				}),
				/* @__PURE__ */ Y("div", {
					className: "dc:flex-1 dc:overflow-y-auto dc:px-6 dc:py-4",
					children: n.length === 0 ? /* @__PURE__ */ X("div", {
						className: "dc:text-center dc:py-8 text-dc-text-muted",
						children: [
							/* @__PURE__ */ Y("svg", {
								className: "dc:mx-auto dc:h-12 dc:w-12 dc:mb-3",
								fill: "none",
								viewBox: "0 0 24 24",
								stroke: "currentColor",
								children: /* @__PURE__ */ Y("path", {
									strokeLinecap: "round",
									strokeLinejoin: "round",
									strokeWidth: 1.5,
									d: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
								})
							}),
							/* @__PURE__ */ Y("p", {
								className: "dc:text-sm dc:font-medium",
								children: c("portlet.filterConfig.noFilters")
							}),
							/* @__PURE__ */ Y("p", {
								className: "dc:text-xs dc:mt-1",
								children: c("portlet.filterConfig.noFiltersHint")
							})
						]
					}) : /* @__PURE__ */ X("div", {
						className: "dc:space-y-3",
						children: [/* @__PURE__ */ X("div", {
							className: "dc:flex dc:items-center dc:justify-between dc:mb-4 dc:pb-2 dc:border-b border-dc-border",
							children: [/* @__PURE__ */ Y("span", {
								className: "dc:text-sm dc:font-medium text-dc-text",
								children: c("portlet.filterConfig.availableFilters")
							}), /* @__PURE__ */ Y("span", {
								className: "dc:text-xs text-dc-text-secondary",
								children: c("portlet.filterConfig.selectedCount", {
									selected: l.filter((e) => n.some((t) => t.id === e.filterId)).length,
									total: n.length
								})
							})]
						}), n.map((e) => {
							let t = l.find((t) => t.filterId === e.id), n = !!t, r = !!e.filter && "member" in e.filter && !!e.filter.member, i = n && r && !e.isUniversalTime, a = i && h.get(e.filter.member) || [], o = !!t?.member && !a.some((e) => e.dimensions.some((e) => e.name === t.member));
							return /* @__PURE__ */ X("label", {
								className: `dc:flex dc:items-start dc:p-3 dc:rounded-md dc:border dc:cursor-pointer dc:transition-colors ${n ? "border-dc-primary bg-dc-surface-secondary" : "border-dc-border hover:bg-dc-surface-hover"}`,
								children: [/* @__PURE__ */ Y("input", {
									type: "checkbox",
									checked: n,
									onChange: () => d(e.id),
									className: "dc:mt-0.5 dc:mr-3 dc:h-4 dc:w-4 dc:rounded-sm border-dc-border dc:focus:ring-2 focus:ring-dc-primary",
									style: { accentColor: "var(--dc-primary)" }
								}), /* @__PURE__ */ X("div", {
									className: "dc:flex-1 dc:min-w-0",
									children: [
										/* @__PURE__ */ X("div", {
											className: "dc:flex dc:items-center dc:gap-2",
											children: [
												/* @__PURE__ */ Y("span", {
													className: "dc:font-medium dc:text-sm text-dc-text dc:truncate",
													children: e.label
												}),
												n && /* @__PURE__ */ Y("span", {
													className: "dc:px-2 dc:py-0.5 dc:text-xs dc:rounded-full",
													style: {
														backgroundColor: "var(--dc-primary)",
														color: "white"
													},
													children: c("portlet.filterConfig.applied")
												}),
												t?.member && /* @__PURE__ */ Y("span", {
													className: "dc:px-2 dc:py-0.5 dc:text-xs dc:rounded-full bg-dc-accent-bg text-dc-accent dc:truncate",
													title: t.member,
													children: c("portlet.filterConfig.mappedTo", { field: t.member })
												})
											]
										}),
										/* @__PURE__ */ Y("div", {
											className: "dc:mt-1 dc:text-xs text-dc-text-secondary dc:break-words",
											children: g(e)
										}),
										i && a.length > 0 && /* @__PURE__ */ X("div", {
											className: "dc:mt-2",
											onClick: (e) => e.preventDefault(),
											children: [
												/* @__PURE__ */ Y("label", {
													className: "dc:block dc:text-xs dc:font-medium text-dc-text-secondary dc:mb-1",
													children: c("portlet.filterConfig.applyToField")
												}),
												/* @__PURE__ */ X("select", {
													value: t?.member || "",
													onChange: (t) => f(e.id, t.target.value),
													className: "dc:w-full dc:text-sm dc:rounded-md dc:border border-dc-border bg-dc-surface text-dc-text dc:px-2 dc:py-1.5 dc:focus:ring-2 focus:ring-dc-primary",
													children: [
														/* @__PURE__ */ Y("option", {
															value: "",
															children: c("portlet.filterConfig.applyToFieldDefault", { field: e.filter.member })
														}),
														o && t?.member && /* @__PURE__ */ Y("option", {
															value: t.member,
															children: t.member
														}),
														a.map((e) => /* @__PURE__ */ Y("optgroup", {
															label: e.cubeTitle,
															children: e.dimensions.map((e) => /* @__PURE__ */ Y("option", {
																value: e.name,
																children: e.title || e.name
															}, e.name))
														}, e.cubeName))
													]
												}),
												o && /* @__PURE__ */ Y("p", {
													className: "dc:mt-1 dc:text-xs text-dc-warning",
													children: c("portlet.filterConfig.mappedFieldMissing", { field: t?.member || "" })
												})
											]
										})
									]
								})]
							}, e.id);
						})]
					})
				}),
				/* @__PURE__ */ X("div", {
					className: "dc:px-6 dc:py-4 dc:border-t border-dc-border bg-dc-surface-secondary dc:rounded-b-lg dc:flex dc:justify-end dc:gap-3",
					children: [/* @__PURE__ */ Y("button", {
						onClick: m,
						className: "dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:rounded-md dc:border border-dc-border bg-dc-surface hover:bg-dc-surface-hover dc:transition-colors text-dc-text",
						children: c("common.actions.cancel")
					}), /* @__PURE__ */ Y("button", {
						onClick: p,
						className: "dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:rounded-md text-white dc:transition-colors",
						style: { backgroundColor: "var(--dc-primary)" },
						children: c("portlet.filterConfig.applyFilters")
					})]
				})
			]
		})
	}) : null;
}
//#endregion
//#region src/client/components/ConfirmModal.tsx
var gc = ({ isOpen: e, onClose: t, onConfirm: n, title: r, message: i, confirmText: a, cancelText: o, confirmVariant: s = "primary", isLoading: c = !1 }) => {
	let { t: l } = R(), u = r ?? l("common.actions.confirm"), d = a ?? l("common.actions.confirm"), f = o ?? l("common.actions.cancel");
	return /* @__PURE__ */ Y(ps, {
		isOpen: e,
		onClose: t,
		title: u,
		size: "sm",
		closeOnBackdropClick: !c,
		closeOnEscape: !c,
		footer: /* @__PURE__ */ X(J, { children: [/* @__PURE__ */ Y("button", {
			type: "button",
			onClick: t,
			disabled: c,
			className: "dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-dc-text-secondary bg-dc-surface dc:border border-dc-border dc:rounded-md hover:bg-dc-surface-hover dc:transition-colors dc:focus:outline-none dc:focus:ring-2 dc:focus:ring-offset-2 focus:ring-dc-primary dc:disabled:opacity-50 dc:disabled:cursor-not-allowed",
			children: f
		}), /* @__PURE__ */ Y("button", {
			type: "button",
			onClick: async () => {
				await n(), t();
			},
			disabled: c,
			className: (() => {
				let e = "dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:rounded-md dc:transition-colors dc:focus:outline-none dc:focus:ring-2 dc:focus:ring-offset-2 dc:disabled:opacity-50 dc:disabled:cursor-not-allowed";
				switch (s) {
					case "danger": return `${e} bg-dc-danger dc:text-white dc:hover:bg-dc-danger/90 focus:ring-dc-danger`;
					case "warning": return `${e} bg-dc-warning dc:text-white dc:hover:bg-dc-warning/90 focus:ring-dc-warning`;
					default: return `${e} bg-dc-primary dc:text-white dc:hover:bg-dc-primary/90 focus:ring-dc-primary`;
				}
			})(),
			children: c ? /* @__PURE__ */ X("span", {
				className: "dc:flex dc:items-center dc:gap-2",
				children: [/* @__PURE__ */ X("svg", {
					className: "dc:animate-spin dc:h-4 dc:w-4",
					xmlns: "http://www.w3.org/2000/svg",
					fill: "none",
					viewBox: "0 0 24 24",
					children: [/* @__PURE__ */ Y("circle", {
						className: "dc:opacity-25",
						cx: "12",
						cy: "12",
						r: "10",
						stroke: "currentColor",
						strokeWidth: "4"
					}), /* @__PURE__ */ Y("path", {
						className: "dc:opacity-75",
						fill: "currentColor",
						d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					})]
				}), l("common.modal.processing")]
			}) : d
		})] }),
		children: /* @__PURE__ */ Y("div", {
			className: "text-dc-text-secondary",
			children: i
		})
	});
};
//#endregion
//#region src/client/components/dashboard/DashboardModals.tsx
function _c() {
	let { t: e } = R(), { config: t, colorPalette: n, dashboardFilters: r, schema: i, isPortletModalOpen: a, editingPortlet: o, isTextModalOpen: s, editingTextPortlet: c, isFilterConfigModalOpen: l, filterConfigPortlet: u, deleteConfirmPortletId: d, deleteConfirmGroupId: f, handlePortletSave: p, handleSaveFilterConfig: m, actions: h } = pi(), g = t.portlets.find((e) => e.id === d)?.title || e("dashboard.thisPortlet"), _ = (t.groups?.find((e) => e.id === f))?.cells.reduce((e, t) => e + t.portletIds.length, 0) ?? 0;
	return /* @__PURE__ */ X(J, { children: [
		/* @__PURE__ */ Y(js, {
			isOpen: a,
			onClose: h.closePortletModal,
			onSave: p,
			portlet: o,
			title: e(o ? "dashboard.editPortlet" : "dashboard.addNewPortlet"),
			submitText: e(o ? "dashboard.updatePortlet" : "dashboard.addPortlet"),
			colorPalette: n,
			dashboardFilters: r
		}),
		/* @__PURE__ */ Y(uc, {
			isOpen: s,
			onClose: h.closeTextModal,
			onSave: p,
			portlet: c,
			colorPalette: n,
			existingTitles: t.portlets.map((e) => e.title)
		}),
		/* @__PURE__ */ Y(hc, {
			isOpen: l,
			onClose: h.closeFilterConfig,
			dashboardFilters: r || [],
			currentMapping: u?.dashboardFilterMapping || [],
			onSave: m,
			portletTitle: u?.title || "",
			schema: i || null,
			portlet: u
		}),
		/* @__PURE__ */ Y(gc, {
			isOpen: !!f,
			onClose: h.closeDeleteConfirm,
			onConfirm: h.confirmDelete,
			title: e("dashboard.group.deleteTitle"),
			message: e("dashboard.group.deleteConfirm", { count: String(_) }),
			confirmText: e("common.actions.delete"),
			confirmVariant: "danger"
		}),
		/* @__PURE__ */ Y(gc, {
			isOpen: !!d,
			onClose: h.closeDeleteConfirm,
			onConfirm: h.confirmDelete,
			title: e("dashboard.deletePortlet"),
			message: /* @__PURE__ */ X(J, { children: [
				e("dashboard.deletePortletConfirm"),
				" ",
				/* @__PURE__ */ Y("strong", { children: g }),
				e("dashboard.deletePortletSuffix")
			] }),
			confirmText: e("common.actions.delete"),
			confirmVariant: "danger"
		})
	] });
}
//#endregion
//#region src/client/components/DashboardGrid.tsx
function vc(e) {
	let t = !e.config.portlets || e.config.portlets.length === 0;
	return /* @__PURE__ */ X(bi, {
		...e,
		children: [
			!t && !e.hideToolbar && /* @__PURE__ */ Y(Ki, {}),
			!t && /* @__PURE__ */ Y(is, {}),
			/* @__PURE__ */ Y(fs, {}),
			/* @__PURE__ */ Y(_c, {})
		]
	});
}
//#endregion
//#region src/client/components/AnalyticsDashboard.tsx
function yc({ config: e, editable: t = !1, dashboardFilters: n, loadingComponent: r, onConfigChange: i, onSave: a, onSaveThumbnail: o, onDirtyStateChange: s }) {
	let { meta: l } = L(), { dashboardModes: u } = c(), { handleConfigChange: d, handleSave: f } = te({
		initialConfig: e,
		onConfigChange: i,
		onSave: a,
		onDirtyStateChange: s
	}), p = G(() => {
		let t = e.filters || [], r = n || [];
		if (r.length === 0) return t;
		if (t.length === 0) return r;
		let i = t.map((e) => {
			let t = r.find((t) => t.id === e.id);
			return t ? {
				...e,
				filter: t.filter
			} : e;
		}), a = new Set(t.map((e) => e.id)), o = r.filter((e) => !a.has(e.id));
		return [...i, ...o];
	}, [e.filters, n]), m = U((t) => {
		!n || n.length === 0 ? d({
			...e,
			filters: t
		}) : console.warn("Dashboard filters are controlled via props - config changes ignored");
	}, [
		e,
		n,
		d
	]), h = G(() => {
		let t = e.colorPalette;
		return Si(t);
	}, [e.colorPalette]);
	return /* @__PURE__ */ Y("div", {
		className: "dc:w-full",
		children: /* @__PURE__ */ Y(vc, {
			config: e,
			editable: t,
			dashboardFilters: p,
			loadingComponent: r,
			onConfigChange: d,
			onSave: f,
			onSaveThumbnail: o,
			colorPalette: h,
			schema: l,
			dashboardModes: u,
			onDashboardFiltersChange: m
		})
	});
}
//#endregion
//#region src/client/components/PortletContainer.tsx
function bc({ portlet: e, editable: t = !1, onEdit: n, onDelete: r, onRefresh: i }) {
	let { analysisConfig: a } = G(() => Q(e), [e]), o = a.charts[a.analysisType], s = G(() => JSON.stringify(a.query), [a.query]), c = o?.chartType || "line", l = o?.chartConfig, u = o?.displayConfig, [d, f] = q(null), p = U((e) => {
		f(e);
	}, []);
	return /* @__PURE__ */ X("div", {
		className: "bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:flex dc:flex-col dc:h-full",
		style: { boxShadow: "var(--dc-shadow-sm)" },
		children: [/* @__PURE__ */ X("div", {
			className: "dc:flex dc:items-center dc:justify-between dc:border-b border-dc-border dc:shrink-0 bg-dc-surface-secondary dc:rounded-t-lg dc:px-3 dc:py-2 dc:md:px-6 dc:md:py-3",
			children: [/* @__PURE__ */ X("div", {
				className: "dc:flex dc:items-center dc:gap-2 dc:flex-1 dc:min-w-0",
				children: [/* @__PURE__ */ Y("h3", {
					className: "dc:font-semibold dc:text-sm dc:truncate text-dc-text",
					children: e.title
				}), d && /* @__PURE__ */ Y(rr, {
					chartConfig: d.chartConfig,
					displayConfig: d.displayConfig,
					queryObject: d.queryObject,
					data: d.data,
					chartType: d.chartType,
					cacheInfo: d.cacheInfo
				})]
			}), /* @__PURE__ */ Y("div", {
				className: "dc:flex dc:items-center dc:gap-2 dc:ml-4",
				children: t && /* @__PURE__ */ X(J, { children: [
					/* @__PURE__ */ Y("button", {
						onClick: () => i?.(e.id),
						className: "dc:p-1.5 hover:bg-dc-surface-hover dc:rounded-sm text-dc-text-secondary",
						title: "Refresh",
						children: /* @__PURE__ */ Y("svg", {
							className: "dc:h-4 dc:w-4",
							fill: "none",
							viewBox: "0 0 24 24",
							stroke: "currentColor",
							children: /* @__PURE__ */ Y("path", {
								strokeLinecap: "round",
								strokeLinejoin: "round",
								strokeWidth: 2,
								d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							})
						})
					}),
					/* @__PURE__ */ Y("button", {
						onClick: () => n?.(e),
						className: "dc:p-1.5 hover:bg-dc-surface-hover dc:rounded-sm text-dc-text-secondary",
						title: "Edit",
						children: /* @__PURE__ */ Y("svg", {
							className: "dc:h-4 dc:w-4",
							fill: "none",
							viewBox: "0 0 24 24",
							stroke: "currentColor",
							children: /* @__PURE__ */ Y("path", {
								strokeLinecap: "round",
								strokeLinejoin: "round",
								strokeWidth: 2,
								d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							})
						})
					}),
					/* @__PURE__ */ Y("button", {
						onClick: () => r?.(e.id),
						className: "dc:p-1.5 dc:rounded-sm text-dc-danger",
						style: { backgroundColor: "transparent" },
						onMouseEnter: (e) => e.currentTarget.style.backgroundColor = "var(--dc-danger-bg)",
						onMouseLeave: (e) => e.currentTarget.style.backgroundColor = "transparent",
						title: "Delete",
						children: /* @__PURE__ */ Y("svg", {
							className: "dc:h-4 dc:w-4",
							fill: "none",
							viewBox: "0 0 24 24",
							stroke: "currentColor",
							children: /* @__PURE__ */ Y("path", {
								strokeLinecap: "round",
								strokeLinejoin: "round",
								strokeWidth: 2,
								d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							})
						})
					})
				] })
			})]
		}), /* @__PURE__ */ Y("div", {
			className: "dc:px-2 dc:py-3 dc:md:px-4 dc:md:pt-6 dc:md:pb-4 dc:flex-1 dc:min-h-0",
			children: /* @__PURE__ */ Y(wn, {
				query: s,
				chartType: c,
				chartConfig: l,
				displayConfig: u,
				title: e.title,
				height: "100%",
				onDebugDataReady: p
			})
		})]
	});
}
//#endregion
//#region src/client/components/DashboardEditModal.tsx
function xc({ isOpen: e, onClose: t, onSave: n, title: r, submitText: i, initialName: a = "", initialDescription: o = "" }) {
	let { t: s } = R(), [c, l] = q(""), [u, d] = q(""), [f, p] = q(!1);
	W(() => {
		e && (l(a), d(o));
	}, [
		e,
		a,
		o
	]);
	let m = async (e) => {
		if (e.preventDefault(), c.trim()) {
			p(!0);
			try {
				await n({
					name: c.trim(),
					description: u.trim() || void 0
				}), h();
			} catch {} finally {
				p(!1);
			}
		}
	}, h = () => {
		l(""), d(""), p(!1), t();
	}, g = /* @__PURE__ */ X(J, { children: [/* @__PURE__ */ Y("button", {
		type: "button",
		onClick: h,
		disabled: f,
		className: "dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-dc-text-secondary bg-dc-surface dc:border border-dc-border dc:rounded-md hover:bg-dc-surface-hover dc:disabled:opacity-50",
		children: s("common.actions.cancel")
	}), /* @__PURE__ */ Y("button", {
		type: "submit",
		form: "dashboard-form",
		disabled: f || !c.trim(),
		className: "dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-white bg-dc-primary dc:border border-transparent dc:rounded-md hover:bg-dc-primary-hover dc:disabled:opacity-50 dc:disabled:cursor-not-allowed",
		children: f ? "Saving..." : i
	})] });
	return /* @__PURE__ */ Y(ps, {
		isOpen: e,
		onClose: h,
		title: r,
		size: "fullscreen-mobile",
		footer: g,
		children: /* @__PURE__ */ X("form", {
			id: "dashboard-form",
			onSubmit: m,
			className: "dc:space-y-4 dc:w-full",
			children: [/* @__PURE__ */ X("div", { children: [/* @__PURE__ */ Y("label", {
				htmlFor: "dashboard-name",
				className: "dc:block dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-1",
				children: s("dashboard.editModal.dashboardName")
			}), /* @__PURE__ */ Y("input", {
				type: "text",
				id: "dashboard-name",
				value: c,
				onChange: (e) => l(e.target.value),
				className: "dc:w-full dc:px-3 dc:py-2 dc:border border-dc-border dc:rounded-md bg-dc-surface text-dc-text dc:focus:outline-none dc:focus:ring-2 focus:ring-dc-primary focus:border-dc-primary",
				placeholder: "Enter dashboard name...",
				required: !0,
				autoFocus: !0
			})] }), /* @__PURE__ */ X("div", { children: [/* @__PURE__ */ Y("label", {
				htmlFor: "dashboard-description",
				className: "dc:block dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-1",
				children: s("dashboard.editModal.descriptionOptional")
			}), /* @__PURE__ */ Y("textarea", {
				id: "dashboard-description",
				rows: 3,
				value: u,
				onChange: (e) => d(e.target.value),
				className: "dc:w-full dc:px-3 dc:py-2 dc:border border-dc-border dc:rounded-md bg-dc-surface text-dc-text dc:focus:outline-none dc:focus:ring-2 focus:ring-dc-primary focus:border-dc-primary",
				placeholder: "Enter description..."
			})] })]
		})
	});
}
//#endregion
export { Xt as $, rr as A, In as B, Ji as C, bi as D, Si as E, On as F, Bn as G, Rn as H, Kn as I, Pn as J, Gn as K, zn as L, Jn as M, qn as N, pi as O, Mn as P, on as Q, Wn as R, qi as S, we as St, Pi as T, Hn as U, Un as V, Ln as W, wn as X, Fn as Y, dn as Z, Sa as _, Oe as _t, _c as a, Ge as at, Xi as b, Ie as bt, js as c, Pe as ct, ys as d, Fe as dt, Mt as et, hs as f, Le as ft, Na as g, Te as gt, is as h, ke as ht, vc as i, Q as it, nr as j, si as k, Ds as l, Ne as lt, fs as m, Ee as mt, bc as n, qe as nt, gc as o, Ue as ot, ps as p, De as pt, Nn as q, yc as r, Xe as rt, cc as s, Z as st, xc as t, nt as tt, Cs as u, Me as ut, xa as v, Ae as vt, Ki as w, aa as x, Ce as xt, Yi as y, je as yt, Vn as z };

//# sourceMappingURL=DashboardEditModal-CBdNSTX_.js.map