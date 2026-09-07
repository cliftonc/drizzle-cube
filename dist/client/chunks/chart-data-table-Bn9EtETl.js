import { i as e, n as t } from "./rolldown-runtime-DArdT4gl.js";
import { n, o as r, s as i } from "./chart-config-area-DsrZCIwF.js";
import { B as a, E as o, F as s, I as c, L as l, w as u, z as d } from "./chart-activity-grid-D6X0iOUw.js";
import { n as f } from "./chart-config-bar-BixSs43E.js";
import { n as p } from "./chart-config-line-CBF9Px9b.js";
import { n as m } from "./chart-config-pie-DZLa6Eqm.js";
import { n as h } from "./chart-config-scatter-CWA89oX4.js";
import { n as g } from "./chart-config-bubble-1IyZinH0.js";
import { n as _ } from "./chart-config-radar-DR6vHHyd.js";
import { n as v } from "./chart-config-radial-bar-DVFou4fB.js";
import { n as ee } from "./chart-config-tree-map-Uhise6Bx.js";
import { n as y } from "./chart-config-data-table-CrGyS7aJ.js";
import { n as te } from "./chart-config-activity-grid-C4vXGQNu.js";
import { n as ne } from "./chart-config-kpi-number-DCcnANWC.js";
import { n as re } from "./chart-config-kpi-delta-Cl7k6jTj.js";
import { n as ie } from "./chart-config-kpi-text-DnnxvOSA.js";
import { n as ae } from "./chart-config-markdown-C5kBQOjP.js";
import { n as oe } from "./chart-config-funnel-DMLLKtPF.js";
import { n as se } from "./chart-config-sankey-De8E0C1A.js";
import { n as ce } from "./chart-config-sunburst-B4NUYHMH.js";
import { n as le } from "./chart-config-heat-map-CJF65SyL.js";
import { n as ue } from "./chart-config-box-plot-DMuJZqkr.js";
import { n as de } from "./chart-config-waterfall-DlQb_PLh.js";
import { n as fe } from "./chart-config-candlestick-QwQwJB_-.js";
import { n as pe } from "./chart-config-measure-profile-CRSRIpKh.js";
import { n as me } from "./chart-config-gauge-CJktdjox.js";
import * as b from "react";
import he, { createContext as ge, createElement as _e, forwardRef as ve, lazy as ye, useCallback as be, useContext as xe, useEffect as x, useMemo as S, useRef as Se, useState as C } from "react";
import { jsx as w, jsxs as T } from "react/jsx-runtime";
//#region src/client/charts/chartConfigs.ts
var Ce = {
	dropZones: [
		{
			key: "xAxis",
			label: "chart.dropZone.xAxis.label",
			description: "chart.dropZone.xAxis.description",
			mandatory: !1,
			acceptTypes: ["dimension", "timeDimension"],
			emptyText: "chart.dropZone.xAxis.empty"
		},
		{
			key: "yAxis",
			label: "chart.dropZone.yAxis.label",
			description: "chart.dropZone.yAxis.description",
			mandatory: !1,
			acceptTypes: ["measure", "dimension"],
			emptyText: "chart.dropZone.yAxis.empty"
		},
		{
			key: "series",
			label: "chart.dropZone.series.label",
			description: "chart.dropZone.series.description",
			mandatory: !1,
			acceptTypes: ["dimension"],
			emptyText: "chart.dropZone.series.empty"
		}
	],
	displayOptions: [
		"showLegend",
		"showGrid",
		"showTooltip"
	]
}, E = {
	packageName: "recharts",
	installCommand: "npm install recharts"
}, D = {
	bar: {
		label: "chart.bar.label",
		icon: "chartBar",
		description: "chart.bar.description",
		useCase: "chart.bar.useCase",
		isAvailable: i,
		dependencies: E,
		config: async () => (await import("./chart-config-bar-BixSs43E.js").then((e) => e.t)).barChartConfig
	},
	line: {
		label: "chart.line.label",
		icon: "chartLine",
		description: "chart.line.description",
		useCase: "chart.line.useCase",
		isAvailable: i,
		dependencies: E,
		config: async () => (await import("./chart-config-line-CBF9Px9b.js").then((e) => e.t)).lineChartConfig
	},
	area: {
		label: "chart.area.label",
		icon: "chartArea",
		description: "chart.area.description",
		useCase: "chart.area.useCase",
		isAvailable: i,
		dependencies: E,
		config: async () => (await import("./chart-config-area-DsrZCIwF.js").then((e) => e.t)).areaChartConfig
	},
	pie: {
		label: "chart.pie.label",
		icon: "chartPie",
		description: "chart.pie.description",
		useCase: "chart.pie.useCase",
		isAvailable: i,
		dependencies: E,
		config: async () => (await import("./chart-config-pie-DZLa6Eqm.js").then((e) => e.t)).pieChartConfig
	},
	scatter: {
		label: "chart.scatter.label",
		icon: "chartScatter",
		description: "chart.scatter.description",
		useCase: "chart.scatter.useCase",
		isAvailable: ({ measureCount: e, dimensionCount: t }) => e < 1 ? {
			available: !1,
			reason: "chart.availability.requiresMeasure"
		} : e < 2 && t < 1 ? {
			available: !1,
			reason: "chart.availability.scatter"
		} : { available: !0 },
		dependencies: E,
		config: async () => (await import("./chart-config-scatter-CWA89oX4.js").then((e) => e.t)).scatterChartConfig
	},
	bubble: {
		label: "chart.bubble.label",
		icon: "chartBubble",
		description: "chart.bubble.description",
		useCase: "chart.bubble.useCase",
		isAvailable: ({ measureCount: e, dimensionCount: t }) => e < 2 ? {
			available: !1,
			reason: "chart.availability.requiresTwoMeasures"
		} : t < 1 ? {
			available: !1,
			reason: "chart.availability.bubble"
		} : { available: !0 },
		dependencies: E,
		config: async () => (await import("./chart-config-bubble-1IyZinH0.js").then((e) => e.t)).bubbleChartConfig
	},
	radar: {
		label: "chart.radar.label",
		icon: "chartRadar",
		description: "chart.radar.description",
		useCase: "chart.radar.useCase",
		isAvailable: i,
		dependencies: E,
		config: async () => (await import("./chart-config-radar-DR6vHHyd.js").then((e) => e.t)).radarChartConfig
	},
	radialBar: {
		label: "chart.radialBar.label",
		icon: "chartRadialBar",
		description: "chart.radialBar.description",
		useCase: "chart.radialBar.useCase",
		isAvailable: i,
		dependencies: E,
		config: async () => (await import("./chart-config-radial-bar-DVFou4fB.js").then((e) => e.t)).radialBarChartConfig
	},
	treemap: {
		label: "chart.treemap.label",
		icon: "chartTreemap",
		description: "chart.treemap.description",
		useCase: "chart.treemap.useCase",
		isAvailable: i,
		dependencies: E,
		config: async () => (await import("./chart-config-tree-map-Uhise6Bx.js").then((e) => e.t)).treemapChartConfig
	},
	table: {
		label: "chart.table.label",
		icon: "chartTable",
		description: "chart.table.description",
		useCase: "chart.table.useCase",
		config: async () => (await import("./chart-config-data-table-CrGyS7aJ.js").then((e) => e.t)).dataTableConfig
	},
	recordsTable: {
		label: "chart.recordsTable.label",
		icon: "chartRecordsTable",
		description: "chart.recordsTable.description",
		useCase: "chart.recordsTable.useCase",
		config: async () => (await Promise.resolve().then(() => ho)).recordsTableConfig
	},
	activityGrid: {
		label: "chart.activityGrid.label",
		icon: "chartActivityGrid",
		description: "chart.activityGrid.description",
		useCase: "chart.activityGrid.useCase",
		isAvailable: ({ measureCount: e, timeDimensionCount: t }) => e < 1 ? {
			available: !1,
			reason: "chart.availability.requiresMeasure"
		} : t < 1 ? {
			available: !1,
			reason: "chart.availability.requiresTimeDimension"
		} : { available: !0 },
		config: async () => (await import("./chart-config-activity-grid-C4vXGQNu.js").then((e) => e.t)).activityGridChartConfig
	},
	kpiNumber: {
		label: "chart.kpiNumber.label",
		icon: "chartKpiNumber",
		description: "chart.kpiNumber.description",
		useCase: "chart.kpiNumber.useCase",
		isAvailable: r,
		config: async () => (await import("./chart-config-kpi-number-DCcnANWC.js").then((e) => e.t)).kpiNumberConfig
	},
	kpiDelta: {
		label: "chart.kpiDelta.label",
		icon: "chartKpiDelta",
		description: "chart.kpiDelta.description",
		useCase: "chart.kpiDelta.useCase",
		isAvailable: i,
		config: async () => (await import("./chart-config-kpi-delta-Cl7k6jTj.js").then((e) => e.t)).kpiDeltaConfig
	},
	kpiText: {
		label: "chart.kpiText.label",
		icon: "chartKpiText",
		description: "chart.kpiText.description",
		useCase: "chart.kpiText.useCase",
		isAvailable: r,
		config: async () => (await import("./chart-config-kpi-text-DnnxvOSA.js").then((e) => e.t)).kpiTextConfig
	},
	markdown: {
		label: "chart.markdown.label",
		icon: "chartMarkdown",
		description: "chart.markdown.description",
		useCase: "chart.markdown.useCase",
		config: async () => (await import("./chart-config-markdown-C5kBQOjP.js").then((e) => e.t)).markdownConfig
	},
	funnel: {
		label: "chart.funnel.label",
		icon: "chartFunnel",
		description: "chart.funnel.description",
		useCase: "chart.funnel.useCase",
		dependencies: E,
		config: async () => (await import("./chart-config-funnel-DMLLKtPF.js").then((e) => e.t)).funnelChartConfig
	},
	sankey: {
		label: "chart.sankey.label",
		icon: "chartSankey",
		description: "chart.sankey.description",
		useCase: "chart.sankey.useCase",
		dependencies: E,
		config: async () => (await import("./chart-config-sankey-De8E0C1A.js").then((e) => e.t)).sankeyChartConfig
	},
	sunburst: {
		label: "chart.sunburst.label",
		icon: "chartSunburst",
		description: "chart.sunburst.description",
		useCase: "chart.sunburst.useCase",
		dependencies: E,
		config: async () => (await import("./chart-config-sunburst-B4NUYHMH.js").then((e) => e.t)).sunburstChartConfig
	},
	heatmap: {
		label: "chart.heatmap.label",
		icon: "chartHeatmap",
		description: "chart.heatmap.description",
		useCase: "chart.heatmap.useCase",
		isAvailable: ({ measureCount: e, dimensionCount: t }) => e < 1 ? {
			available: !1,
			reason: "chart.availability.requiresMeasure"
		} : t < 2 ? {
			available: !1,
			reason: "chart.availability.requiresTwoDimensions"
		} : { available: !0 },
		dependencies: {
			packageName: "@nivo/heatmap",
			installCommand: "npm install @nivo/heatmap"
		},
		config: async () => (await import("./chart-config-heat-map-CJF65SyL.js").then((e) => e.t)).heatmapChartConfig
	},
	retentionHeatmap: {
		label: "chart.retentionHeatmap.label",
		icon: "chartRetention",
		description: "chart.retentionHeatmap.description",
		useCase: "chart.retentionHeatmap.useCase",
		config: async () => (await Promise.resolve().then(() => _o)).retentionHeatmapConfig
	},
	retentionCombined: {
		label: "chart.retentionCombined.label",
		icon: "chartRetention",
		description: "chart.retentionCombined.description",
		useCase: "chart.retentionCombined.useCase",
		config: async () => (await Promise.resolve().then(() => yo)).retentionCombinedConfig
	},
	boxPlot: {
		label: "chart.boxPlot.label",
		icon: "chartBoxPlot",
		description: "chart.boxPlot.description",
		useCase: "chart.boxPlot.useCase",
		isAvailable: i,
		config: async () => (await import("./chart-config-box-plot-DMuJZqkr.js").then((e) => e.t)).boxPlotChartConfig
	},
	dotStrip: {
		label: "chart.dotStrip.label",
		icon: "chartDotStrip",
		description: "chart.dotStrip.description",
		useCase: "chart.dotStrip.useCase",
		isAvailable: i,
		config: async () => (await Promise.resolve().then(() => xo)).dotStripChartConfig
	},
	waterfall: {
		label: "chart.waterfall.label",
		icon: "chartWaterfall",
		description: "chart.waterfall.description",
		useCase: "chart.waterfall.useCase",
		isAvailable: i,
		dependencies: E,
		config: async () => (await import("./chart-config-waterfall-DlQb_PLh.js").then((e) => e.t)).waterfallChartConfig
	},
	candlestick: {
		label: "chart.candlestick.label",
		icon: "chartCandlestick",
		description: "chart.candlestick.description",
		useCase: "chart.candlestick.useCase",
		isAvailable: ({ measureCount: e, dimensionCount: t }) => e < 2 ? {
			available: !1,
			reason: "chart.availability.requiresTwoMeasures"
		} : t < 1 ? {
			available: !1,
			reason: "chart.availability.requiresDimension"
		} : { available: !0 },
		config: async () => (await import("./chart-config-candlestick-QwQwJB_-.js").then((e) => e.t)).candlestickChartConfig
	},
	measureProfile: {
		label: "chart.measureProfile.label",
		icon: "chartMeasureProfile",
		description: "chart.measureProfile.description",
		useCase: "chart.measureProfile.useCase",
		isAvailable: ({ measureCount: e }) => e < 2 ? {
			available: !1,
			reason: "chart.availability.requiresTwoMeasures"
		} : { available: !0 },
		dependencies: E,
		config: async () => (await import("./chart-config-measure-profile-CRSRIpKh.js").then((e) => e.t)).measureProfileChartConfig
	},
	proportionBar: {
		label: "chart.proportionBar.label",
		icon: "chartProportionBar",
		description: "chart.proportionBar.description",
		useCase: "chart.proportionBar.useCase",
		isAvailable: i,
		config: async () => (await Promise.resolve().then(() => Co)).proportionBarChartConfig
	},
	gauge: {
		label: "chart.gauge.label",
		icon: "chartGauge",
		description: "chart.gauge.description",
		useCase: "chart.gauge.useCase",
		isAvailable: r,
		dependencies: {
			packageName: "d3-shape",
			installCommand: "npm install d3-shape"
		},
		config: async () => (await import("./chart-config-gauge-CJktdjox.js").then((e) => e.t)).gaugeChartConfig
	}
}, O = /* @__PURE__ */ new Map();
function we(e) {
	return O.get(e) ?? D[e];
}
function Te(e, t) {
	O.set(e, t);
}
function Ee(e) {
	O.delete(e);
}
function De(e) {
	return O.get(e);
}
function Oe(e, t) {
	return {
		...t,
		label: e.label,
		description: e.description,
		useCase: e.useCase,
		isAvailable: e.isAvailable
	};
}
//#endregion
//#region src/client/charts/lazyChartConfigRegistry.ts
var k = /* @__PURE__ */ new Map();
async function ke(e) {
	if (k.has(e)) return k.get(e);
	let t = we(e);
	if (!t) return null;
	try {
		let n = await t.config();
		if (n) {
			let r = Oe(t, n);
			return k.set(e, r), r;
		}
		return null;
	} catch (t) {
		return console.error(`Failed to load config for chart type: ${e}`, t), null;
	}
}
function Ae(e) {
	return k.get(e) || Ce;
}
function je(e) {
	return k.has(e);
}
function Me(e) {
	let [t, n] = C(e ? Ae(e) : Ce), [r, i] = C(!1), [a, o] = C(!1);
	return x(() => {
		if (!e) {
			n(Ce), o(!1);
			return;
		}
		if (k.has(e)) {
			n(k.get(e)), o(!0);
			return;
		}
		i(!0), ke(e).then((e) => {
			e ? (n(e), o(!0)) : (n(Ce), o(!0));
		}).finally(() => i(!1));
	}, [e]), {
		config: t,
		loading: r,
		loaded: a
	};
}
async function Ne(e) {
	k.has(e) || await ke(e);
}
async function Pe(e) {
	await Promise.all(e.map(Ne));
}
async function Fe() {
	let e = Object.keys(D);
	await Promise.all(e.map(ke));
	let t = {};
	for (let n of e) {
		let e = k.get(n);
		e && (t[n] = e);
	}
	return t;
}
function Ie() {
	k.clear();
}
function Le(e, t) {
	k.set(e, t);
}
function Re(e) {
	k.delete(e);
}
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js
var ze = b.createContext(void 0), Be = (e) => {
	let t = b.useContext(ze);
	if (e) return e;
	if (!t) throw Error("No QueryClient set, use QueryClientProvider to set one");
	return t;
}, Ve = ({ client: e, children: t }) => (b.useEffect(() => (e.mount(), () => {
	e.unmount();
}), [e]), /* @__PURE__ */ w(ze.Provider, {
	value: e,
	children: t
})), He = {
	setTimeout: (e, t) => setTimeout(e, t),
	clearTimeout: (e) => clearTimeout(e),
	setInterval: (e, t) => setInterval(e, t),
	clearInterval: (e) => clearInterval(e)
}, A = new class {
	#e = He;
	#t = !1;
	setTimeoutProvider(e) {
		process.env.NODE_ENV !== "production" && this.#t && e !== this.#e && console.error("[timeoutManager]: Switching provider after calls to previous provider might result in unexpected behavior.", {
			previous: this.#e,
			provider: e
		}), this.#e = e, process.env.NODE_ENV !== "production" && (this.#t = !1);
	}
	setTimeout(e, t) {
		return process.env.NODE_ENV !== "production" && (this.#t = !0), this.#e.setTimeout(e, t);
	}
	clearTimeout(e) {
		this.#e.clearTimeout(e);
	}
	setInterval(e, t) {
		return process.env.NODE_ENV !== "production" && (this.#t = !0), this.#e.setInterval(e, t);
	}
	clearInterval(e) {
		this.#e.clearInterval(e);
	}
}();
function Ue(e) {
	setTimeout(e, 0);
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/utils.js
var We = typeof window > "u" || "Deno" in globalThis;
function j() {}
function Ge(e, t) {
	return typeof e == "function" ? e(t) : e;
}
function Ke(e) {
	return typeof e == "number" && e >= 0 && e !== Infinity;
}
function qe(e, t) {
	return Math.max(e + (t || 0) - Date.now(), 0);
}
function M(e, t) {
	return typeof e == "function" ? e(t) : e;
}
function Je(e, t) {
	let { type: n = "all", exact: r, fetchStatus: i, predicate: a, queryKey: o, stale: s } = e;
	if (o) {
		if (r) {
			if (t.queryHash !== Xe(o, t.options)) return !1;
		} else if (!P(t.queryKey, o)) return !1;
	}
	if (n !== "all") {
		let e = t.isActive();
		if (n === "active" && !e || n === "inactive" && e) return !1;
	}
	return !(typeof s == "boolean" && t.isStale() !== s || i && i !== t.state.fetchStatus || a && !a(t));
}
function Ye(e, t) {
	let { exact: n, status: r, predicate: i, mutationKey: a } = e;
	if (a) {
		if (!t.options.mutationKey) return !1;
		if (n) {
			if (N(t.options.mutationKey) !== N(a)) return !1;
		} else if (!P(t.options.mutationKey, a)) return !1;
	}
	return !(r && t.state.status !== r || i && !i(t));
}
function Xe(e, t) {
	return (t?.queryKeyHashFn || N)(e);
}
function N(e) {
	return JSON.stringify(e, (e, t) => tt(t) ? Object.keys(t).sort().reduce((e, n) => (e[n] = t[n], e), {}) : t);
}
function P(e, t) {
	if (e === t) return !0;
	if (typeof e != typeof t) return !1;
	if (e && t && typeof e == "object" && typeof t == "object") {
		if (Array.isArray(e) && Array.isArray(t)) {
			for (let n = 0; n < t.length; n++) if (!P(e[n], t[n])) return !1;
			return !0;
		}
		let n = Object.keys(t);
		for (let r of n) if (!P(e[r], t[r])) return !1;
		return !0;
	}
	return !1;
}
var Ze = Object.prototype.hasOwnProperty;
function Qe(e, t, n = 0) {
	if (e === t) return e;
	if (n > 500) return t;
	let r = et(e) && et(t);
	if (!r && !(tt(e) && tt(t))) return t;
	let i = (r ? e : Object.keys(e)).length, a = r ? t : Object.keys(t), o = a.length, s = r ? Array(o) : {}, c = 0;
	for (let l = 0; l < o; l++) {
		let o = r ? l : a[l], u = e[o], d = t[o];
		if (u === d) {
			s[o] = u, (r ? l < i : Ze.call(e, o)) && c++;
			continue;
		}
		if (u === null || d === null || typeof u != "object" || typeof d != "object") {
			s[o] = d;
			continue;
		}
		let f = Qe(u, d, n + 1);
		s[o] = f, f === u && c++;
	}
	return i === o && c === i ? e : s;
}
function $e(e, t) {
	if (!t || Object.keys(e).length !== Object.keys(t).length) return !1;
	for (let n in e) if (e[n] !== t[n]) return !1;
	return !0;
}
function et(e) {
	return Array.isArray(e) && e.length === Object.keys(e).length;
}
function tt(e) {
	if (!nt(e)) return !1;
	let t = e.constructor;
	if (t === void 0) return !0;
	let n = t.prototype;
	return !(!nt(n) || !n.hasOwnProperty("isPrototypeOf") || Object.getPrototypeOf(e) !== Object.prototype);
}
function nt(e) {
	return Object.prototype.toString.call(e) === "[object Object]";
}
function rt(e) {
	return new Promise((t) => {
		A.setTimeout(t, e);
	});
}
function it(e, t, n) {
	if (typeof n.structuralSharing == "function") return n.structuralSharing(e, t);
	if (n.structuralSharing !== !1) {
		if (process.env.NODE_ENV !== "production") try {
			return Qe(e, t);
		} catch (e) {
			throw console.error(`Structural sharing requires data to be JSON serializable. To fix this, turn off structuralSharing or return JSON-serializable data from your queryFn. [${n.queryHash}]: ${e}`), e;
		}
		return Qe(e, t);
	}
	return t;
}
function at(e, t, n = 0) {
	let r = [...e, t];
	return n && r.length > n ? r.slice(1) : r;
}
function ot(e, t, n = 0) {
	let r = [t, ...e];
	return n && r.length > n ? r.slice(0, -1) : r;
}
var st = Symbol();
function ct(e, t) {
	return process.env.NODE_ENV !== "production" && e.queryFn === st && console.error(`Attempted to invoke queryFn when set to skipToken. This is likely a configuration error. Query hash: '${e.queryHash}'`), !e.queryFn && t?.initialPromise ? () => t.initialPromise : !e.queryFn || e.queryFn === st ? () => Promise.reject(/* @__PURE__ */ Error(`Missing queryFn: '${e.queryHash}'`)) : e.queryFn;
}
function lt(e, t) {
	return typeof e == "function" ? e(...t) : !!e;
}
function ut(e, t, n) {
	let r = !1, i;
	return Object.defineProperty(e, "signal", {
		enumerable: !0,
		get: () => (i ??= t(), r ? i : (r = !0, i.aborted ? n() : i.addEventListener("abort", n, { once: !0 }), i))
	}), e;
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/environmentManager.js
var dt = () => We, ft = () => dt(), F = class {
	constructor() {
		this.listeners = /* @__PURE__ */ new Set(), this.subscribe = this.subscribe.bind(this);
	}
	subscribe(e) {
		return this.listeners.add(e), this.onSubscribe(), () => {
			this.listeners.delete(e), this.onUnsubscribe();
		};
	}
	hasListeners() {
		return this.listeners.size > 0;
	}
	onSubscribe() {}
	onUnsubscribe() {}
}, pt = new class extends F {
	#e;
	#t;
	#n;
	constructor() {
		super(), this.#n = (e) => {
			if (typeof window < "u" && window.addEventListener) {
				let t = () => e();
				return window.addEventListener("visibilitychange", t, !1), () => {
					window.removeEventListener("visibilitychange", t);
				};
			}
		};
	}
	onSubscribe() {
		this.#t || this.setEventListener(this.#n);
	}
	onUnsubscribe() {
		this.hasListeners() || (this.#t?.(), this.#t = void 0);
	}
	setEventListener(e) {
		this.#n = e, this.#t?.(), this.#t = e((e) => {
			typeof e == "boolean" ? this.setFocused(e) : this.onFocus();
		});
	}
	setFocused(e) {
		this.#e !== e && (this.#e = e, this.onFocus());
	}
	onFocus() {
		let e = this.isFocused();
		this.listeners.forEach((t) => {
			t(e);
		});
	}
	isFocused() {
		return typeof this.#e == "boolean" ? this.#e : globalThis.document?.visibilityState !== "hidden";
	}
}(), mt = Ue;
function ht() {
	let e = [], t = 0, n = (e) => {
		e();
	}, r = (e) => {
		e();
	}, i = mt, a = (r) => {
		t ? e.push(r) : i(() => {
			n(r);
		});
	}, o = () => {
		let t = e;
		e = [], t.length && i(() => {
			r(() => {
				t.forEach((e) => {
					n(e);
				});
			});
		});
	};
	return {
		batch: (e) => {
			let n;
			t++;
			try {
				n = e();
			} finally {
				t--, t || o();
			}
			return n;
		},
		batchCalls: (e) => (...t) => {
			a(() => {
				e(...t);
			});
		},
		schedule: a,
		setNotifyFunction: (e) => {
			n = e;
		},
		setBatchNotifyFunction: (e) => {
			r = e;
		},
		setScheduler: (e) => {
			i = e;
		}
	};
}
var I = ht(), gt = new class extends F {
	#e = !0;
	#t;
	#n;
	constructor() {
		super(), this.#n = (e) => {
			if (typeof window < "u" && window.addEventListener) {
				let t = () => e(!0), n = () => e(!1);
				return window.addEventListener("online", t, !1), window.addEventListener("offline", n, !1), () => {
					window.removeEventListener("online", t), window.removeEventListener("offline", n);
				};
			}
		};
	}
	onSubscribe() {
		this.#t || this.setEventListener(this.#n);
	}
	onUnsubscribe() {
		this.hasListeners() || (this.#t?.(), this.#t = void 0);
	}
	setEventListener(e) {
		this.#n = e, this.#t?.(), this.#t = e(this.setOnline.bind(this));
	}
	setOnline(e) {
		this.#e !== e && (this.#e = e, this.listeners.forEach((t) => {
			t(e);
		}));
	}
	isOnline() {
		return this.#e;
	}
}();
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/retryer.js
function _t(e) {
	return Math.min(1e3 * 2 ** e, 3e4);
}
function vt(e) {
	return (e ?? "online") !== "online" || gt.isOnline();
}
var yt = class extends Error {
	constructor(e) {
		super("CancelledError"), this.revert = e?.revert, this.silent = e?.silent;
	}
};
function bt(e) {
	let t = !1, n = 0, r, i = "pending", a, o, s = new Promise((e, t) => {
		a = e, o = t;
	});
	s.catch(j);
	let c = () => i !== "pending", l = (t) => {
		if (!c()) {
			let n = new yt(t);
			h(n), e.onCancel?.(n);
		}
	}, u = () => {
		t = !0;
	}, d = () => {
		t = !1;
	}, f = () => pt.isFocused() && (e.networkMode === "always" || gt.isOnline()) && e.canRun(), p = () => vt(e.networkMode) && e.canRun(), m = (e) => {
		c() || (r?.(), i = "resolved", a(e));
	}, h = (e) => {
		c() || (r?.(), i = "rejected", o(e));
	}, g = () => new Promise((t) => {
		r = (e) => {
			(c() || f()) && t(e);
		}, e.onPause?.();
	}).then(() => {
		r = void 0, c() || e.onContinue?.();
	}), _ = () => {
		if (c()) return;
		let r, i = n === 0 ? e.initialPromise : void 0;
		try {
			r = i ?? e.fn();
		} catch (e) {
			r = Promise.reject(e);
		}
		Promise.resolve(r).then(m).catch((r) => {
			if (c()) return;
			let i = e.retry ?? (ft() ? 0 : 3), a = e.retryDelay ?? _t, o = typeof a == "function" ? a(n, r) : a, s = i === !0 || typeof i == "number" && n < i || typeof i == "function" && i(n, r);
			if (t || !s) {
				h(r);
				return;
			}
			n++, e.onFail?.(n, r), rt(o).then(() => f() ? void 0 : g()).then(() => {
				t ? h(r) : _();
			});
		});
	};
	return {
		promise: s,
		status: () => i,
		cancel: l,
		continue: () => (r?.(), s),
		cancelRetry: u,
		continueRetry: d,
		canStart: p,
		start: () => (p() ? _() : g().then(_), s)
	};
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/removable.js
var xt = class {
	#e;
	destroy() {
		this.clearGcTimeout();
	}
	scheduleGc() {
		this.clearGcTimeout(), Ke(this.gcTime) && (this.#e = A.setTimeout(() => {
			this.optionalRemove();
		}, this.gcTime));
	}
	updateGcTime(e) {
		this.gcTime = Math.max(this.gcTime || 0, e ?? (ft() ? Infinity : 3e5));
	}
	clearGcTimeout() {
		this.#e !== void 0 && (A.clearTimeout(this.#e), this.#e = void 0);
	}
};
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/infiniteQueryBehavior.js
function St(e) {
	return { onFetch: (t, n) => {
		let r = t.options, i = t.fetchOptions?.meta?.fetchMore?.direction, a = t.state.data?.pages || [], o = t.state.data?.pageParams || [], s = {
			pages: [],
			pageParams: []
		}, c = 0, l = async () => {
			let n = !1, l = (e) => {
				ut(e, () => t.signal, () => n = !0);
			}, u = ct(t.options, t.fetchOptions), d = async (e, r, i) => {
				if (n) return Promise.reject(t.signal.reason);
				if (r == null && e.pages.length) return Promise.resolve(e);
				let a = (() => {
					let e = {
						client: t.client,
						queryKey: t.queryKey,
						pageParam: r,
						direction: i ? "backward" : "forward",
						meta: t.options.meta
					};
					return l(e), e;
				})(), o = await u(a), { maxPages: s } = t.options, c = i ? ot : at;
				return {
					pages: c(e.pages, o, s),
					pageParams: c(e.pageParams, r, s)
				};
			};
			if (i && a.length) {
				let e = i === "backward", t = e ? wt : Ct, n = {
					pages: a,
					pageParams: o
				};
				s = await d(n, t(r, n), e);
			} else {
				let t = e ?? a.length;
				do {
					let e = c === 0 ? o[0] ?? r.initialPageParam : Ct(r, s);
					if (c > 0 && e == null) break;
					s = await d(s, e), c++;
				} while (c < t);
			}
			return s;
		};
		t.fetchFn = t.options.persister ? () => t.options.persister?.(l, {
			client: t.client,
			queryKey: t.queryKey,
			meta: t.options.meta,
			signal: t.signal
		}, n) : l;
	} };
}
function Ct(e, { pages: t, pageParams: n }) {
	let r = t.length - 1;
	return t.length > 0 ? e.getNextPageParam(t[r], t, n[r], n) : void 0;
}
function wt(e, { pages: t, pageParams: n }) {
	return t.length > 0 ? e.getPreviousPageParam?.(t[0], t, n[0], n) : void 0;
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/query.js
var Tt = class extends xt {
	#e;
	#t;
	#n;
	#r;
	#i;
	#a;
	#o;
	#s;
	constructor(e) {
		super(), this.#s = !1, this.#o = e.defaultOptions, this.setOptions(e.options), this.observers = [], this.#i = e.client, this.#r = this.#i.getQueryCache(), this.queryKey = e.queryKey, this.queryHash = e.queryHash, this.#t = Ot(this.options), this.state = e.state ?? this.#t, this.scheduleGc();
	}
	get meta() {
		return this.options.meta;
	}
	get queryType() {
		return this.#e;
	}
	get promise() {
		return this.#a?.promise;
	}
	setOptions(e) {
		if (this.options = {
			...this.#o,
			...e
		}, e?._type && (this.#e = e._type), this.updateGcTime(this.options.gcTime), this.state && this.state.data === void 0) {
			let e = Ot(this.options);
			e.data !== void 0 && (this.setState(Dt(e.data, e.dataUpdatedAt)), this.#t = e);
		}
	}
	optionalRemove() {
		!this.observers.length && this.state.fetchStatus === "idle" && this.#r.remove(this);
	}
	setData(e, t) {
		let n = it(this.state.data, e, this.options);
		return this.#c({
			data: n,
			type: "success",
			dataUpdatedAt: t?.updatedAt,
			manual: t?.manual
		}), n;
	}
	setState(e) {
		this.#c({
			type: "setState",
			state: e
		});
	}
	cancel(e) {
		let t = this.#a?.promise;
		return this.#a?.cancel(e), t ? t.then(j).catch(j) : Promise.resolve();
	}
	destroy() {
		super.destroy(), this.cancel({ silent: !0 });
	}
	get resetState() {
		return this.#t;
	}
	reset() {
		this.destroy(), this.setState(this.resetState);
	}
	isActive() {
		return this.observers.some((e) => M(e.options.enabled, this) !== !1);
	}
	isDisabled() {
		return this.getObserversCount() > 0 ? !this.isActive() : this.options.queryFn === st || !this.isFetched();
	}
	isFetched() {
		return this.state.dataUpdateCount + this.state.errorUpdateCount > 0;
	}
	isStatic() {
		return this.getObserversCount() > 0 && this.observers.some((e) => M(e.options.staleTime, this) === "static");
	}
	isStale() {
		return this.getObserversCount() > 0 ? this.observers.some((e) => e.getCurrentResult().isStale) : this.state.data === void 0 || this.state.isInvalidated;
	}
	isStaleByTime(e = 0) {
		return this.state.data === void 0 ? !0 : e === "static" ? !1 : this.state.isInvalidated ? !0 : !qe(this.state.dataUpdatedAt, e);
	}
	onFocus() {
		this.observers.find((e) => e.shouldFetchOnWindowFocus())?.refetch({ cancelRefetch: !1 }), this.#a?.continue();
	}
	onOnline() {
		this.observers.find((e) => e.shouldFetchOnReconnect())?.refetch({ cancelRefetch: !1 }), this.#a?.continue();
	}
	addObserver(e) {
		this.observers.includes(e) || (this.observers.push(e), this.clearGcTimeout(), this.#r.notify({
			type: "observerAdded",
			query: this,
			observer: e
		}));
	}
	removeObserver(e) {
		let t = this.observers.indexOf(e);
		t !== -1 && (this.observers.splice(t, 1), this.observers.length || (this.#a && (this.#s || this.state.fetchStatus === "paused" && this.state.status === "pending" ? this.#a.cancel({ revert: !0 }) : this.#a.cancelRetry()), this.scheduleGc()), this.#r.notify({
			type: "observerRemoved",
			query: this,
			observer: e
		}));
	}
	getObserversCount() {
		return this.observers.length;
	}
	invalidate() {
		this.state.isInvalidated || this.#c({ type: "invalidate" });
	}
	async fetch(e, t) {
		if (this.state.fetchStatus !== "idle" && this.#a?.status() !== "rejected") {
			if (this.state.data !== void 0 && t?.cancelRefetch) this.cancel({ silent: !0 });
			else if (this.#a) return this.#a.continueRetry(), this.#a.promise;
		}
		if (e && this.setOptions(e), !this.options.queryFn) {
			let e = this.observers.find((e) => e.options.queryFn);
			e && this.setOptions(e.options);
		}
		process.env.NODE_ENV !== "production" && (Array.isArray(this.options.queryKey) || console.error("As of v4, queryKey needs to be an Array. If you are using a string like 'repoData', please change it to an Array, e.g. ['repoData']"));
		let n = new AbortController(), r = (e) => {
			Object.defineProperty(e, "signal", {
				enumerable: !0,
				get: () => (this.#s = !0, n.signal)
			});
		}, i = () => {
			let e = ct(this.options, t), n = (() => {
				let e = {
					client: this.#i,
					queryKey: this.queryKey,
					meta: this.meta
				};
				return r(e), e;
			})();
			return this.#s = !1, this.options.persister ? this.options.persister(e, n, this) : e(n);
		}, a = (() => {
			let e = {
				fetchOptions: t,
				options: this.options,
				queryKey: this.queryKey,
				client: this.#i,
				state: this.state,
				fetchFn: i
			};
			return r(e), e;
		})();
		(this.#e === "infinite" ? St(this.options.pages) : this.options.behavior)?.onFetch(a, this), this.#n = this.state, (this.state.fetchStatus === "idle" || this.state.fetchMeta !== a.fetchOptions?.meta) && this.#c({
			type: "fetch",
			meta: a.fetchOptions?.meta
		});
		let o = this.#a = bt({
			initialPromise: t?.initialPromise,
			fn: a.fetchFn,
			onCancel: (e) => {
				e instanceof yt && e.revert && this.setState({
					...this.#n,
					fetchStatus: "idle"
				}), n.abort();
			},
			onFail: (e, t) => {
				this.#c({
					type: "failed",
					failureCount: e,
					error: t
				});
			},
			onPause: () => {
				this.#c({ type: "pause" });
			},
			onContinue: () => {
				this.#c({ type: "continue" });
			},
			retry: a.options.retry,
			retryDelay: a.options.retryDelay,
			networkMode: a.options.networkMode,
			canRun: () => !0
		});
		try {
			let e = await o.start();
			if (e === void 0) throw process.env.NODE_ENV !== "production" && console.error(`Query data cannot be undefined. Please make sure to return a value other than undefined from your query function. Affected query key: ${this.queryHash}`), Error(`${this.queryHash} data is undefined`);
			return this.setData(e), this.#r.config.onSuccess?.(e, this), this.#r.config.onSettled?.(e, this.state.error, this), e;
		} catch (e) {
			if (e instanceof yt) {
				if (e.silent) return this.#a.promise;
				if (e.revert) {
					if (this.state.data === void 0) throw e;
					return this.state.data;
				}
			}
			throw this.#c({
				type: "error",
				error: e
			}), this.#r.config.onError?.(e, this), this.#r.config.onSettled?.(this.state.data, e, this), e;
		} finally {
			this.#a === o && (this.#a = void 0), this.scheduleGc();
		}
	}
	#c(e) {
		let t = (t) => {
			switch (e.type) {
				case "failed": return {
					...t,
					fetchFailureCount: e.failureCount,
					fetchFailureReason: e.error
				};
				case "pause": return {
					...t,
					fetchStatus: "paused"
				};
				case "continue": return {
					...t,
					fetchStatus: "fetching"
				};
				case "fetch": return {
					...t,
					...Et(t.data, this.options),
					fetchMeta: e.meta ?? null
				};
				case "success":
					let n = {
						...t,
						...Dt(e.data, e.dataUpdatedAt),
						dataUpdateCount: t.dataUpdateCount + 1,
						...!e.manual && {
							fetchStatus: "idle",
							fetchFailureCount: 0,
							fetchFailureReason: null
						}
					};
					return this.#n = e.manual ? n : void 0, n;
				case "error":
					let r = e.error;
					return {
						...t,
						error: r,
						errorUpdateCount: t.errorUpdateCount + 1,
						errorUpdatedAt: Date.now(),
						fetchFailureCount: t.fetchFailureCount + 1,
						fetchFailureReason: r,
						fetchStatus: "idle",
						status: "error",
						isInvalidated: !0
					};
				case "invalidate": return {
					...t,
					isInvalidated: !0
				};
				case "setState": return {
					...t,
					...e.state
				};
			}
		};
		this.state = t(this.state), I.batch(() => {
			this.observers.slice().forEach((e) => {
				e.onQueryUpdate();
			}), this.#r.notify({
				query: this,
				type: "updated",
				action: e
			});
		});
	}
};
function Et(e, t) {
	return {
		fetchFailureCount: 0,
		fetchFailureReason: null,
		fetchStatus: vt(t.networkMode) ? "fetching" : "paused",
		...e === void 0 && {
			error: null,
			status: "pending"
		}
	};
}
function Dt(e, t) {
	return {
		data: e,
		dataUpdatedAt: t ?? Date.now(),
		error: null,
		isInvalidated: !1,
		status: "success"
	};
}
function Ot(e) {
	let t = typeof e.initialData == "function" ? e.initialData() : e.initialData, n = t !== void 0, r = n ? typeof e.initialDataUpdatedAt == "function" ? e.initialDataUpdatedAt() : e.initialDataUpdatedAt : 0;
	return {
		data: t,
		dataUpdateCount: 0,
		dataUpdatedAt: n ? r ?? Date.now() : 0,
		error: null,
		errorUpdateCount: 0,
		errorUpdatedAt: 0,
		fetchFailureCount: 0,
		fetchFailureReason: null,
		fetchMeta: null,
		isInvalidated: !1,
		status: n ? "success" : "pending",
		fetchStatus: "idle"
	};
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/queryObserver.js
var kt = class extends F {
	#e;
	#t = void 0;
	#n = void 0;
	#r = void 0;
	#i;
	#a;
	#o;
	#s;
	#c;
	#l;
	#u;
	#d;
	#f;
	#p = /* @__PURE__ */ new Set();
	constructor(e, t) {
		super(), this.options = t, this.#e = e, this.#o = null, this.bindMethods(), this.setOptions(t);
	}
	bindMethods() {
		this.refetch = this.refetch.bind(this);
	}
	onSubscribe() {
		this.listeners.size === 1 && (this.#t.addObserver(this), jt(this.#t, this.options) ? this.#m() : this.updateResult(), this.#y());
	}
	onUnsubscribe() {
		this.hasListeners() || this.destroy();
	}
	shouldFetchOnReconnect() {
		return Mt(this.#t, this.options, this.options.refetchOnReconnect);
	}
	shouldFetchOnWindowFocus() {
		return Mt(this.#t, this.options, this.options.refetchOnWindowFocus);
	}
	destroy() {
		this.listeners = /* @__PURE__ */ new Set(), this.#b(), this.#x(), this.#t.removeObserver(this);
	}
	setOptions(e) {
		let t = this.options, n = this.#t;
		if (this.options = this.#e.defaultQueryOptions(e), this.options.enabled !== void 0 && typeof this.options.enabled != "boolean" && typeof this.options.enabled != "function" && typeof M(this.options.enabled, this.#t) != "boolean") throw Error("Expected enabled to be a boolean or a callback that returns a boolean");
		this.#S(), this.#t.setOptions(this.options), t._defaulted && !$e(this.options, t) && this.#e.getQueryCache().notify({
			type: "observerOptionsUpdated",
			query: this.#t,
			observer: this
		});
		let r = this.hasListeners();
		r && Nt(this.#t, n, this.options, t) && this.#m(), this.updateResult(), r && (this.#t !== n || M(this.options.enabled, this.#t) !== M(t.enabled, this.#t) || M(this.options.staleTime, this.#t) !== M(t.staleTime, this.#t)) && this.#g();
		let i = this.#_();
		r && (this.#t !== n || M(this.options.enabled, this.#t) !== M(t.enabled, this.#t) || i !== this.#f) && this.#v(i);
	}
	getOptimisticResult(e) {
		let t = this.#e.getQueryCache().build(this.#e, e), n = this.createResult(t, e);
		return $e(this.getCurrentResult(), n) || (this.#r = n, this.#a = this.options, this.#i = this.#t.state), n;
	}
	getCurrentResult() {
		return this.#r;
	}
	trackResult(e, t) {
		return new Proxy(e, { get: (e, n) => (this.trackProp(n), t?.(n), Reflect.get(e, n)) });
	}
	trackProp(e) {
		this.#p.add(e);
	}
	getCurrentQuery() {
		return this.#t;
	}
	refetch({ ...e } = {}) {
		return this.fetch({ ...e });
	}
	fetchOptimistic(e) {
		let t = this.#e.defaultQueryOptions(e), n = this.#e.getQueryCache().build(this.#e, t), r = () => {}, i, a = new Promise((e) => {
			i = e, r = this.#e.getQueryCache().subscribe((i) => {
				i.type === "updated" && i.query.queryHash === n.queryHash && n.state.data !== void 0 && (r(), e(this.createResult(n, t)));
			});
		});
		return Promise.race([n.fetch().then(() => {
			let e = this.createResult(n, t);
			return i?.(e), e;
		}).finally(() => {
			r();
		}), a]);
	}
	fetch(e) {
		return this.#m({
			...e,
			cancelRefetch: e.cancelRefetch ?? !0
		}).then(() => (this.updateResult(), this.#r));
	}
	#m(e) {
		this.#S();
		let t = this.#t.fetch(this.options, e);
		return e?.throwOnError || (t = t.catch(j)), t;
	}
	#h(e) {
		return !ft() && M(this.options.enabled, this.#t) !== !1 && Ke(e);
	}
	#g() {
		this.#b();
		let e = M(this.options.staleTime, this.#t);
		if (this.#r.isStale || !this.#h(e)) return;
		let t = qe(this.#r.dataUpdatedAt, e) + 1;
		this.#u = A.setTimeout(() => {
			this.#r.isStale || this.updateResult();
		}, t);
	}
	#_() {
		return (typeof this.options.refetchInterval == "function" ? this.options.refetchInterval(this.#t) : this.options.refetchInterval) ?? !1;
	}
	#v(e) {
		this.#x(), this.#f = e, !(this.#f === 0 || !this.#h(this.#f)) && (this.#d = A.setInterval(() => {
			(this.options.refetchIntervalInBackground || pt.isFocused()) && this.#m();
		}, this.#f));
	}
	#y() {
		this.#g(), this.#v(this.#_());
	}
	#b() {
		this.#u !== void 0 && (A.clearTimeout(this.#u), this.#u = void 0);
	}
	#x() {
		this.#d !== void 0 && (A.clearInterval(this.#d), this.#d = void 0);
	}
	createResult(e, t) {
		let n = this.#t, r = this.options, i = this.#r, a = this.#i, o = this.#a, s = e === n ? this.#n : e.state, { state: c } = e, l = { ...c }, u = !1, d;
		if (t._optimisticResults) {
			let i = this.hasListeners(), a = !i && jt(e, t), o = i && Nt(e, n, t, r);
			(a || o) && (l = {
				...l,
				...Et(c.data, e.options)
			}), t._optimisticResults === "isRestoring" && (l.fetchStatus = "idle");
		}
		let { error: f, errorUpdatedAt: p, status: m } = l;
		d = l.data;
		let h = !1;
		if (t.placeholderData !== void 0 && d === void 0 && m === "pending") {
			let e;
			i?.isPlaceholderData && t.placeholderData === o?.placeholderData ? (e = i.data, h = !0) : e = typeof t.placeholderData == "function" ? t.placeholderData(this.#l?.state.data, this.#l) : t.placeholderData, e !== void 0 && (m = "success", d = it(i?.data, e, t), u = !0);
		}
		if (t.select && d !== void 0 && !h) {
			if (i && d === a?.data && t.select === this.#s) d = this.#c;
			else try {
				this.#s = t.select, d = t.select(d), d = it(i?.data, d, t), this.#c = d, this.#o = null;
			} catch (e) {
				this.#o = e;
			}
		} else d === void 0 && (this.#o = null);
		this.#o && (f = this.#o, d = this.#c, p = Date.now(), m = "error", u = !1);
		let g = l.fetchStatus === "fetching", _ = m === "pending", v = m === "error", ee = _ && g, y = d !== void 0;
		return {
			status: m,
			fetchStatus: l.fetchStatus,
			isPending: _,
			isSuccess: m === "success",
			isError: v,
			isInitialLoading: ee,
			isLoading: ee,
			data: d,
			dataUpdatedAt: l.dataUpdatedAt,
			error: f,
			errorUpdatedAt: p,
			failureCount: l.fetchFailureCount,
			failureReason: l.fetchFailureReason,
			errorUpdateCount: l.errorUpdateCount,
			isFetched: e.isFetched(),
			isFetchedAfterMount: l.dataUpdateCount > s.dataUpdateCount || l.errorUpdateCount > s.errorUpdateCount,
			isFetching: g,
			isRefetching: g && !_,
			isLoadingError: v && !y,
			isPaused: l.fetchStatus === "paused",
			isPlaceholderData: u,
			isRefetchError: v && y,
			isStale: Pt(e, t),
			refetch: this.refetch,
			isEnabled: M(t.enabled, e) !== !1
		};
	}
	updateResult() {
		let e = this.#r, t = this.createResult(this.#t, this.options);
		if (this.#i = this.#t.state, this.#a = this.options, this.#i.data !== void 0 && (this.#l = this.#t), $e(t, e)) return;
		this.#r = t;
		let n = (() => {
			if (!e) return !0;
			let { notifyOnChangeProps: t } = this.options, n = typeof t == "function" ? t() : t;
			if (n === "all" || !n && !this.#p.size) return !0;
			let r = new Set(n ?? this.#p);
			return this.options.throwOnError && r.add("error"), Object.keys(this.#r).some((t) => {
				let n = t;
				return this.#r[n] !== e[n] && r.has(n);
			});
		})();
		I.batch(() => {
			n && this.listeners.forEach((e) => {
				e(this.#r);
			}), this.#e.getQueryCache().notify({
				query: this.#t,
				type: "observerResultsUpdated"
			});
		});
	}
	#S() {
		let e = this.#e.getQueryCache().build(this.#e, this.options);
		if (e === this.#t) return;
		let t = this.#t;
		this.#t = e, this.#n = e.state, this.hasListeners() && (t?.removeObserver(this), e.addObserver(this));
	}
	onQueryUpdate() {
		this.updateResult(), this.hasListeners() && this.#y();
	}
};
function At(e, t) {
	return M(t.enabled, e) !== !1 && e.state.data === void 0 && (e.state.status !== "error" || M(t.retryOnMount, e) !== !1);
}
function jt(e, t) {
	return At(e, t) || e.state.data !== void 0 && Mt(e, t, t.refetchOnMount);
}
function Mt(e, t, n) {
	if (M(t.enabled, e) !== !1 && M(t.staleTime, e) !== "static") {
		let r = typeof n == "function" ? n(e) : n;
		return r === "always" || r !== !1 && Pt(e, t);
	}
	return !1;
}
function Nt(e, t, n, r) {
	return (e !== t || M(r.enabled, e) === !1) && (!n.suspense || e.state.status !== "error") && Pt(e, n);
}
function Pt(e, t) {
	return M(t.enabled, e) !== !1 && e.isStaleByTime(M(t.staleTime, e));
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/mutation.js
var Ft = class extends xt {
	#e;
	#t;
	#n;
	#r;
	constructor(e) {
		super(), this.#e = e.client, this.mutationId = e.mutationId, this.#n = e.mutationCache, this.#t = [], this.state = e.state || It(), this.setOptions(e.options), this.scheduleGc();
	}
	setOptions(e) {
		this.options = e, this.updateGcTime(this.options.gcTime);
	}
	get meta() {
		return this.options.meta;
	}
	addObserver(e) {
		this.#t.includes(e) || (this.#t.push(e), this.clearGcTimeout(), this.#n.notify({
			type: "observerAdded",
			mutation: this,
			observer: e
		}));
	}
	removeObserver(e) {
		this.#t = this.#t.filter((t) => t !== e), this.scheduleGc(), this.#n.notify({
			type: "observerRemoved",
			mutation: this,
			observer: e
		});
	}
	optionalRemove() {
		this.#t.length || (this.state.status === "pending" ? this.scheduleGc() : this.#n.remove(this));
	}
	continue() {
		return this.#r?.continue() ?? (this.state.status === "pending" ? this.execute(this.state.variables) : Promise.resolve());
	}
	async execute(e) {
		let t = () => {
			this.#i({ type: "continue" });
		}, n = {
			client: this.#e,
			meta: this.options.meta,
			mutationKey: this.options.mutationKey
		}, r = this.#r = bt({
			fn: () => this.options.mutationFn ? this.options.mutationFn(e, n) : Promise.reject(/* @__PURE__ */ Error("No mutationFn found")),
			onFail: (e, t) => {
				this.#i({
					type: "failed",
					failureCount: e,
					error: t
				});
			},
			onPause: () => {
				this.#i({ type: "pause" });
			},
			onContinue: t,
			retry: this.options.retry ?? 0,
			retryDelay: this.options.retryDelay,
			networkMode: this.options.networkMode,
			canRun: () => this.#n.canRun(this)
		}), i = this.state.status === "pending", a = !r.canStart();
		try {
			if (i) t();
			else {
				this.#i({
					type: "pending",
					variables: e,
					isPaused: a
				}), this.#n.config.onMutate && await this.#n.config.onMutate(e, this, n);
				let t = await this.options.onMutate?.(e, n);
				t !== this.state.context && this.#i({
					type: "pending",
					context: t,
					variables: e,
					isPaused: a
				});
			}
			let o = await r.start();
			return await this.#n.config.onSuccess?.(o, e, this.state.context, this, n), await this.options.onSuccess?.(o, e, this.state.context, n), await this.#n.config.onSettled?.(o, null, this.state.variables, this.state.context, this, n), await this.options.onSettled?.(o, null, e, this.state.context, n), this.#i({
				type: "success",
				data: o
			}), o;
		} catch (t) {
			try {
				await this.#n.config.onError?.(t, e, this.state.context, this, n);
			} catch (e) {
				Promise.reject(e);
			}
			try {
				await this.options.onError?.(t, e, this.state.context, n);
			} catch (e) {
				Promise.reject(e);
			}
			try {
				await this.#n.config.onSettled?.(void 0, t, this.state.variables, this.state.context, this, n);
			} catch (e) {
				Promise.reject(e);
			}
			try {
				await this.options.onSettled?.(void 0, t, e, this.state.context, n);
			} catch (e) {
				Promise.reject(e);
			}
			throw this.#i({
				type: "error",
				error: t
			}), t;
		} finally {
			this.#r === r && (this.#r = void 0), this.#n.runNext(this);
		}
	}
	#i(e) {
		let t = (t) => {
			switch (e.type) {
				case "failed": return {
					...t,
					failureCount: e.failureCount,
					failureReason: e.error
				};
				case "pause": return {
					...t,
					isPaused: !0
				};
				case "continue": return {
					...t,
					isPaused: !1
				};
				case "pending": return {
					...t,
					context: e.context,
					data: void 0,
					failureCount: 0,
					failureReason: null,
					error: null,
					isPaused: e.isPaused,
					status: "pending",
					variables: e.variables,
					submittedAt: Date.now()
				};
				case "success": return {
					...t,
					data: e.data,
					failureCount: 0,
					failureReason: null,
					error: null,
					status: "success",
					isPaused: !1
				};
				case "error": return {
					...t,
					data: void 0,
					error: e.error,
					failureCount: t.failureCount + 1,
					failureReason: e.error,
					isPaused: !1,
					status: "error"
				};
			}
		};
		this.state = t(this.state), I.batch(() => {
			this.#t.forEach((t) => {
				t.onMutationUpdate(e);
			}), this.#n.notify({
				mutation: this,
				type: "updated",
				action: e
			});
		});
	}
};
function It() {
	return {
		context: void 0,
		data: void 0,
		error: null,
		failureCount: 0,
		failureReason: null,
		isPaused: !1,
		status: "idle",
		variables: void 0,
		submittedAt: 0
	};
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/mutationCache.js
var Lt = class extends F {
	#e;
	#t;
	#n;
	constructor(e = {}) {
		super(), this.config = e, this.#e = /* @__PURE__ */ new Set(), this.#t = /* @__PURE__ */ new Map(), this.#n = 0;
	}
	build(e, t, n) {
		let r = new Ft({
			client: e,
			mutationCache: this,
			mutationId: ++this.#n,
			options: e.defaultMutationOptions(t),
			state: n
		});
		return this.add(r), r;
	}
	add(e) {
		this.#e.add(e);
		let t = Rt(e);
		if (typeof t == "string") {
			let n = this.#t.get(t);
			n ? n.push(e) : this.#t.set(t, [e]);
		}
		this.notify({
			type: "added",
			mutation: e
		});
	}
	remove(e) {
		if (this.#e.delete(e)) {
			let t = Rt(e);
			if (typeof t == "string") {
				let n = this.#t.get(t);
				if (n) {
					if (n.length > 1) {
						let t = n.indexOf(e);
						t !== -1 && n.splice(t, 1);
					} else n[0] === e && this.#t.delete(t);
				}
			}
		}
		this.notify({
			type: "removed",
			mutation: e
		});
	}
	canRun(e) {
		let t = Rt(e);
		if (typeof t == "string") {
			let n = this.#t.get(t)?.find((e) => e.state.status === "pending");
			return !n || n === e;
		}
		return !0;
	}
	runNext(e) {
		let t = Rt(e);
		return typeof t == "string" ? (this.#t.get(t)?.find((t) => t !== e && t.state.isPaused))?.continue() ?? Promise.resolve() : Promise.resolve();
	}
	clear() {
		I.batch(() => {
			this.#e.forEach((e) => {
				this.notify({
					type: "removed",
					mutation: e
				});
			}), this.#e.clear(), this.#t.clear();
		});
	}
	getAll() {
		return Array.from(this.#e);
	}
	find(e) {
		let t = {
			exact: !0,
			...e
		};
		return this.getAll().find((e) => Ye(t, e));
	}
	findAll(e = {}) {
		return this.getAll().filter((t) => Ye(e, t));
	}
	notify(e) {
		I.batch(() => {
			this.listeners.forEach((t) => {
				t(e);
			});
		});
	}
	resumePausedMutations() {
		let e = this.getAll().filter((e) => e.state.isPaused);
		return I.batch(() => Promise.all(e.map((e) => e.continue().catch(j))));
	}
};
function Rt(e) {
	return e.options.scope?.id;
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/queryCache.js
var zt = class extends F {
	#e;
	constructor(e = {}) {
		super(), this.config = e, this.#e = /* @__PURE__ */ new Map();
	}
	build(e, t, n) {
		let r = t.queryKey, i = t.queryHash ?? Xe(r, t), a = this.get(i);
		return a || (a = new Tt({
			client: e,
			queryKey: r,
			queryHash: i,
			options: e.defaultQueryOptions(t),
			state: n,
			defaultOptions: e.getQueryDefaults(r)
		}), this.add(a)), a;
	}
	add(e) {
		this.#e.has(e.queryHash) || (this.#e.set(e.queryHash, e), this.notify({
			type: "added",
			query: e
		}));
	}
	remove(e) {
		let t = this.#e.get(e.queryHash);
		t && (e.destroy(), t === e && this.#e.delete(e.queryHash), this.notify({
			type: "removed",
			query: e
		}));
	}
	clear() {
		I.batch(() => {
			this.getAll().forEach((e) => {
				this.remove(e);
			});
		});
	}
	get(e) {
		return this.#e.get(e);
	}
	getAll() {
		return [...this.#e.values()];
	}
	find(e) {
		let t = {
			exact: !0,
			...e
		};
		return this.getAll().find((e) => Je(t, e));
	}
	findAll(e = {}) {
		let t = this.getAll();
		return Object.keys(e).length > 0 ? t.filter((t) => Je(e, t)) : t;
	}
	notify(e) {
		I.batch(() => {
			this.listeners.forEach((t) => {
				t(e);
			});
		});
	}
	onFocus() {
		I.batch(() => {
			this.getAll().forEach((e) => {
				e.onFocus();
			});
		});
	}
	onOnline() {
		I.batch(() => {
			this.getAll().forEach((e) => {
				e.onOnline();
			});
		});
	}
}, Bt = class {
	#e;
	#t;
	#n;
	#r;
	#i;
	#a;
	#o;
	#s;
	constructor(e = {}) {
		this.#e = e.queryCache || new zt(), this.#t = e.mutationCache || new Lt(), this.#n = e.defaultOptions || {}, this.#r = /* @__PURE__ */ new Map(), this.#i = /* @__PURE__ */ new Map(), this.#a = 0;
	}
	mount() {
		this.#a++, this.#a === 1 && (this.#o = pt.subscribe(async (e) => {
			e && (await this.resumePausedMutations(), this.#e.onFocus());
		}), this.#s = gt.subscribe(async (e) => {
			e && (await this.resumePausedMutations(), this.#e.onOnline());
		}));
	}
	unmount() {
		this.#a--, this.#a === 0 && (this.#o?.(), this.#o = void 0, this.#s?.(), this.#s = void 0);
	}
	isFetching(e) {
		return this.#e.findAll({
			...e,
			fetchStatus: "fetching"
		}).length;
	}
	isMutating(e) {
		return this.#t.findAll({
			...e,
			status: "pending"
		}).length;
	}
	getQueryData(e) {
		let t = this.defaultQueryOptions({ queryKey: e });
		return this.#e.get(t.queryHash)?.state.data;
	}
	ensureQueryData(e) {
		let t = this.defaultQueryOptions(e), n = this.#e.build(this, t), r = n.state.data;
		return r === void 0 ? this.fetchQuery(e) : (e.revalidateIfStale && n.isStaleByTime(M(t.staleTime, n)) && this.prefetchQuery(t), Promise.resolve(r));
	}
	getQueriesData(e) {
		return this.#e.findAll(e).map(({ queryKey: e, state: t }) => [e, t.data]);
	}
	setQueryData(e, t, n) {
		let r = this.defaultQueryOptions({ queryKey: e }), i = this.#e.get(r.queryHash)?.state.data, a = Ge(t, i);
		if (a !== void 0) return this.#e.build(this, r).setData(a, {
			...n,
			manual: !0
		});
	}
	setQueriesData(e, t, n) {
		return I.batch(() => this.#e.findAll(e).map(({ queryKey: e }) => [e, this.setQueryData(e, t, n)]));
	}
	getQueryState(e) {
		let t = this.defaultQueryOptions({ queryKey: e });
		return this.#e.get(t.queryHash)?.state;
	}
	removeQueries(e) {
		let t = this.#e;
		I.batch(() => {
			t.findAll(e).forEach((e) => {
				t.remove(e);
			});
		});
	}
	resetQueries(e, t) {
		let n = this.#e;
		return I.batch(() => {
			let r = n.findAll(e), i = new Set(r);
			return r.forEach((e) => {
				e.reset();
			}), this.refetchQueries({
				type: "active",
				predicate: (e) => i.has(e)
			}, t);
		});
	}
	cancelQueries(e, t = {}) {
		let n = {
			revert: !0,
			...t
		}, r = I.batch(() => this.#e.findAll(e).map((e) => e.cancel(n)));
		return Promise.all(r).then(j).catch(j);
	}
	invalidateQueries(e, t = {}) {
		return I.batch(() => (this.#e.findAll(e).forEach((e) => {
			e.invalidate();
		}), e?.refetchType === "none" ? Promise.resolve() : this.refetchQueries({
			...e,
			type: e?.refetchType ?? e?.type ?? "active"
		}, t)));
	}
	refetchQueries(e, t = {}) {
		let n = {
			...t,
			cancelRefetch: t.cancelRefetch ?? !0
		}, r = I.batch(() => this.#e.findAll(e).filter((e) => !e.isDisabled() && !e.isStatic()).map((e) => {
			let t = e.fetch(void 0, n);
			return n.throwOnError || (t = t.catch(j)), e.state.fetchStatus === "paused" ? Promise.resolve() : t;
		}));
		return Promise.all(r).then(j);
	}
	async query(e) {
		let t = this.defaultQueryOptions(e);
		t.retry === void 0 && (t.retry = !1);
		let n = this.#e.build(this, t), r = n.isStaleByTime(M(t.staleTime, n)) ? await n.fetch(t) : n.state.data, i = t.select;
		return i ? i(r) : r;
	}
	fetchQuery(e) {
		let t = this.defaultQueryOptions(e);
		t.retry === void 0 && (t.retry = !1);
		let n = this.#e.build(this, t);
		return n.isStaleByTime(M(t.staleTime, n)) ? n.fetch(t) : Promise.resolve(n.state.data);
	}
	prefetchQuery(e) {
		return this.fetchQuery(e).then(j).catch(j);
	}
	infiniteQuery(e) {
		return e._type = "infinite", this.query(e);
	}
	fetchInfiniteQuery(e) {
		return e._type = "infinite", this.fetchQuery(e);
	}
	prefetchInfiniteQuery(e) {
		return this.fetchInfiniteQuery(e).then(j).catch(j);
	}
	ensureInfiniteQueryData(e) {
		return e._type = "infinite", this.ensureQueryData(e);
	}
	resumePausedMutations() {
		return gt.isOnline() ? this.#t.resumePausedMutations() : Promise.resolve();
	}
	getQueryCache() {
		return this.#e;
	}
	getMutationCache() {
		return this.#t;
	}
	getDefaultOptions() {
		return this.#n;
	}
	setDefaultOptions(e) {
		this.#n = e;
	}
	setQueryDefaults(e, t) {
		this.#r.set(N(e), {
			queryKey: e,
			defaultOptions: t
		});
	}
	getQueryDefaults(e) {
		let t = [...this.#r.values()], n = {};
		return t.forEach((t) => {
			P(e, t.queryKey) && Object.assign(n, t.defaultOptions);
		}), n;
	}
	setMutationDefaults(e, t) {
		this.#i.set(N(e), {
			mutationKey: e,
			defaultOptions: t
		});
	}
	getMutationDefaults(e) {
		let t = [...this.#i.values()], n = {};
		return t.forEach((t) => {
			P(e, t.mutationKey) && Object.assign(n, t.defaultOptions);
		}), n;
	}
	defaultQueryOptions(e) {
		if (e._defaulted) return e;
		let t = {
			...this.#n.queries,
			...this.getQueryDefaults(e.queryKey),
			...e,
			_defaulted: !0
		};
		return t.queryHash ||= Xe(t.queryKey, t), t.refetchOnReconnect === void 0 && (t.refetchOnReconnect = t.networkMode !== "always"), t.throwOnError === void 0 && (t.throwOnError = !!t.suspense), !t.networkMode && t.persister && (t.networkMode = "offlineFirst"), t.queryFn === st && (t.enabled = !1), t;
	}
	defaultMutationOptions(e) {
		return e?._defaulted ? e : {
			...this.#n.mutations,
			...e?.mutationKey && this.getMutationDefaults(e.mutationKey),
			...e,
			_defaulted: !0
		};
	}
	clear() {
		this.#e.clear(), this.#t.clear();
	}
}, Vt = b.createContext(!1), Ht = () => b.useContext(Vt);
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/QueryErrorResetBoundary.js
function Ut() {
	let e = !1;
	return {
		clearReset: () => {
			e = !1;
		},
		reset: () => {
			e = !0;
		},
		isReset: () => e
	};
}
var Wt = b.createContext(Ut()), Gt = () => b.useContext(Wt), Kt = (e, t, n) => {
	let r = n?.state.error && typeof e.throwOnError == "function" ? lt(e.throwOnError, [n.state.error, n]) : e.throwOnError;
	(e.suspense || r) && (t.isReset() || (e.retryOnMount = !1));
}, qt = (e) => {
	b.useEffect(() => {
		e.clearReset();
	}, [e]);
}, Jt = ({ result: e, errorResetBoundary: t, throwOnError: n, query: r, suspense: i }) => e.isError && !t.isReset() && !e.isFetching && r && (i && e.data === void 0 || lt(n, [e.error, r])), Yt = (e) => {
	if (e.suspense) {
		let t = 1e3, n = (e) => e === "static" ? e : Math.max(e ?? t, t), r = e.staleTime;
		e.staleTime = typeof r == "function" ? (...e) => n(r(...e)) : n(r), typeof e.gcTime == "number" && (e.gcTime = Math.max(e.gcTime, t));
	}
}, Xt = (e, t) => e?.suspense && t.isPending, Zt = (e, t, n) => t.fetchOptimistic(e).catch(() => {
	n.clearReset();
});
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/useBaseQuery.js
function Qt(e, t, n) {
	if (process.env.NODE_ENV !== "production" && (typeof e != "object" || Array.isArray(e))) throw Error("Bad argument type. Starting with v5, only the \"Object\" form is allowed when calling query related functions. Please use the error stack to find the culprit call. More info here: https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5#supports-a-single-signature-one-object");
	let r = Ht(), i = Gt(), a = Be(n), o = a.defaultQueryOptions(e), s = a.getQueryCache().get(o.queryHash);
	process.env.NODE_ENV !== "production" && (o.queryFn || console.error(`[${o.queryHash}]: No queryFn was passed as an option, and no default queryFn was found. The queryFn parameter is only optional when using a default queryFn. More info here: https://tanstack.com/query/latest/docs/framework/react/guides/default-query-function`));
	let c = e.subscribed !== !1;
	o._optimisticResults = r ? "isRestoring" : c ? "optimistic" : void 0, Yt(o), Kt(o, i, s), qt(i);
	let [l] = b.useState(() => new t(a, o)), u = l.getOptimisticResult(o), d = !r && c;
	if (b.useSyncExternalStore(b.useCallback((e) => {
		let t = d ? l.subscribe(I.batchCalls(e)) : j;
		return l.updateResult(), t;
	}, [l, d]), () => l.getCurrentResult(), () => l.getCurrentResult()), b.useEffect(() => {
		l.setOptions(o);
	}, [o, l]), Xt(o, u)) throw Zt(o, l, i);
	if (Jt({
		result: u,
		errorResetBoundary: i,
		throwOnError: o.throwOnError,
		query: s,
		suspense: o.suspense
	})) throw u.error;
	return o.notifyOnChangeProps ? u : l.trackResult(u);
}
//#endregion
//#region node_modules/@tanstack/react-query/build/modern/useQuery.js
function $t(e, t) {
	return Qt(e, kt, t);
}
//#endregion
//#region src/client/client/CubeClient.ts
var en = class extends Error {
	status;
	issues;
	constructor(e, t, n) {
		super(e), this.name = "CubeQueryError", this.status = t, this.issues = n;
	}
};
async function L(e, t) {
	let n = `${t}: ${e.status}`, r;
	try {
		let t = await e.text();
		try {
			let e = JSON.parse(t);
			n = e.error ? e.error : `${n} ${t}`, Array.isArray(e.issues) && (r = e.issues);
		} catch {
			n += ` ${t}`;
		}
	} catch {}
	return new en(n, e.status, r);
}
var tn = class {
	apiUrl;
	headers;
	credentials;
	constructor(e, t = {}) {
		this.apiUrl = t.apiUrl || "/cubejs-api/v1", this.headers = {
			"Content-Type": "application/json",
			...t.headers
		}, this.credentials = t.credentials ?? "include", e && (this.headers.Authorization = e);
	}
	async load(e, t) {
		let n = JSON.stringify(e), r = encodeURIComponent(n), i = `${this.apiUrl}/load?query=${r}`, a = { ...Object.fromEntries(Object.entries(this.headers).filter(([e]) => e !== "Content-Type")) };
		t?.bustCache && (a["X-Cache-Control"] = "no-cache");
		let o = await fetch(i, {
			method: "GET",
			headers: a,
			credentials: this.credentials
		});
		if (!o.ok) throw await L(o, "Cube query failed");
		return new nn(await o.json());
	}
	async meta() {
		let e = `${this.apiUrl}/meta`, t = await fetch(e, {
			method: "GET",
			headers: this.headers,
			credentials: this.credentials
		});
		if (!t.ok) throw await L(t, "Failed to fetch meta");
		return t.json();
	}
	async sql(e) {
		let t = encodeURIComponent(JSON.stringify(e)), n = `${this.apiUrl}/sql?query=${t}`, r = await fetch(n, {
			method: "GET",
			headers: { ...Object.fromEntries(Object.entries(this.headers).filter(([e]) => e !== "Content-Type")) },
			credentials: this.credentials
		});
		if (!r.ok) throw await L(r, "SQL generation failed");
		return r.json();
	}
	async dryRun(e) {
		let t = `${this.apiUrl}/dry-run`, n = await fetch(t, {
			method: "POST",
			headers: this.headers,
			credentials: this.credentials,
			body: JSON.stringify({ query: e })
		});
		if (!n.ok) throw await L(n, "Dry run failed");
		return n.json();
	}
	async explain(e, t) {
		let n = `${this.apiUrl}/explain`, r = await fetch(n, {
			method: "POST",
			headers: this.headers,
			credentials: this.credentials,
			body: JSON.stringify({
				query: e,
				options: t
			})
		});
		if (!r.ok) throw await L(r, "Explain failed");
		return r.json();
	}
	async batchLoad(e, t) {
		let n = `${this.apiUrl}/batch`, r = { ...this.headers };
		t?.bustCache && (r["X-Cache-Control"] = "no-cache");
		let i = await fetch(n, {
			method: "POST",
			headers: r,
			credentials: this.credentials,
			body: JSON.stringify({ queries: e })
		});
		if (!i.ok) throw await L(i, "Batch query failed");
		return (await i.json()).results.map((e) => !e.success && e.error ? {
			...new nn({
				data: [],
				annotation: {}
			}),
			error: e.error
		} : new nn(e));
	}
}, nn = class {
	loadResponse;
	constructor(e) {
		this.loadResponse = e;
	}
	rawData() {
		return this.loadResponse.results && this.loadResponse.results[0] ? this.loadResponse.results[0].data || [] : this.loadResponse.data || [];
	}
	tablePivot() {
		return this.rawData();
	}
	series() {
		return this.rawData();
	}
	annotation() {
		return this.loadResponse.results && this.loadResponse.results[0] ? this.loadResponse.results[0].annotation || {} : this.loadResponse.annotation || {};
	}
	totalCount() {
		return this.loadResponse.results && this.loadResponse.results[0] ? this.loadResponse.results[0].total : this.loadResponse.total;
	}
	cacheInfo() {
		return this.loadResponse.results && this.loadResponse.results[0] ? this.loadResponse.results[0].cache : this.loadResponse.cache;
	}
};
function rn(e, t = {}) {
	return new tn(e, t);
}
//#endregion
//#region src/client/client/BatchCoordinator.ts
var an = class {
	queue = [];
	flushScheduled = !1;
	batchExecutor;
	delayMs;
	constructor(e, t = 50) {
		this.batchExecutor = e, this.delayMs = t;
	}
	register(e) {
		return new Promise((t, n) => {
			this.queue.push({
				query: e,
				resolve: t,
				reject: n
			}), this.flushScheduled || this.scheduleFlush();
		});
	}
	scheduleFlush() {
		this.flushScheduled = !0, setTimeout(() => {
			this.flush();
		}, this.delayMs);
	}
	async flush() {
		this.flushScheduled = !1;
		let e = this.queue.slice();
		if (this.queue = [], e.length !== 0) try {
			let t = e.map((e) => e.query), n = await this.batchExecutor(t);
			e.forEach((e, t) => {
				let r = n[t];
				if (r && "error" in r && r.error) {
					let t = r.issues;
					e.reject(new en(r.error, 400, t));
				} else e.resolve(r);
			});
		} catch (t) {
			e.forEach((e) => {
				e.reject(t instanceof Error ? t : Error(String(t)));
			});
		}
	}
	getQueueSize() {
		return this.queue.length;
	}
	clear() {
		this.queue = [], this.flushScheduled = !1;
	}
}, on = ge(null);
function sn({ apiOptions: e, token: t, options: n = {}, locale: r, enableBatching: i = !0, batchDelayMs: a = 50, children: o }) {
	let s = S(() => ({
		apiOptions: e,
		token: t
	}), [e, t]), [c, l] = C(null);
	x(() => {
		l(null);
	}, [s]);
	let u = c ?? s, d = S(() => r ? {
		...u.apiOptions,
		headers: {
			...u.apiOptions.headers ?? {},
			"X-DC-Locale": r
		}
	} : u.apiOptions, [u.apiOptions, r]), f = S(() => rn(u.token, d), [d, u.token]), p = S(() => i ? new an((e) => f.batchLoad(e), a) : null, [
		i,
		f,
		a
	]), m = be((e, t) => {
		l({
			apiOptions: e,
			token: t
		});
	}, []), h = S(() => ({
		cubeApi: f,
		options: n,
		apiOptions: d,
		updateApiConfig: m,
		batchCoordinator: p,
		enableBatching: i
	}), [
		f,
		n,
		d,
		m,
		p,
		i
	]);
	return /* @__PURE__ */ w(on.Provider, {
		value: h,
		children: o
	});
}
function cn() {
	let e = xe(on);
	if (!e) throw Error("useCubeApi must be used within CubeApiProvider");
	return e;
}
//#endregion
//#region src/client/hooks/queries/useCubeMetaQuery.ts
var ln = ["cube", "meta"];
function un(e) {
	let t = {};
	return e.cubes.forEach((e) => {
		e.measures.forEach((e) => {
			t[e.name] = e.title || e.shortTitle || e.name;
		}), e.dimensions.forEach((e) => {
			t[e.name] = e.title || e.shortTitle || e.name;
		}), e.segments.forEach((e) => {
			t[e.name] = e.title || e.shortTitle || e.name;
		});
	}), t;
}
function dn(e = {}) {
	let { enabled: t = !0, staleTime: n = 3e5 } = e, { cubeApi: r } = cn(), i = Be(), a = $t({
		queryKey: ln,
		queryFn: async () => {
			let e = await r.meta();
			return {
				meta: e,
				labelMap: un(e)
			};
		},
		enabled: t,
		staleTime: n,
		gcTime: 9e5
	}), o = a.data?.meta ?? null, s = a.data?.labelMap ?? {};
	return {
		meta: o,
		labelMap: s,
		isLoading: a.isLoading,
		isFetching: a.isFetching,
		error: a.error,
		refetch: () => {
			i.invalidateQueries({ queryKey: ln });
		},
		getFieldLabel: (e) => s[e] || e
	};
}
//#endregion
//#region src/client/utils/thumbnail.ts
var fn = null, pn = !1;
function mn(e, t, n, r, i) {
	return new Promise((a, o) => {
		let s = new Image();
		s.onload = () => {
			let e = document.createElement("canvas");
			e.width = t, e.height = n;
			let c = e.getContext("2d");
			if (!c) {
				o(/* @__PURE__ */ Error("Failed to get canvas context"));
				return;
			}
			c.imageSmoothingEnabled = !0, c.imageSmoothingQuality = "high";
			let l = s.width / s.height, u = t / n, d = 0, f = 0, p = s.width, m = s.height;
			l > u ? (p = s.height * u, d = (s.width - p) / 2) : l < u && (m = s.width / u, f = 0), c.drawImage(s, d, f, p, m, 0, 0, t, n), a(e.toDataURL(r === "jpeg" ? "image/jpeg" : "image/png", i));
		}, s.onerror = () => o(/* @__PURE__ */ Error("Failed to load image for resizing")), s.src = e;
	});
}
async function R() {
	if (pn) return fn;
	try {
		return fn = await import("./dist-BPmPx7kz.js"), pn = !0, fn;
	} catch {
		return pn = !0, fn = null, null;
	}
}
function hn(e) {
	typeof window > "u" || e?.enabled && (window.__drizzle_cube_thumbnail_warning__ || R().then((e) => {
		!e && typeof process < "u" && process.env.NODE_ENV === "development" && (console.warn("[drizzle-cube] Thumbnail feature enabled but modern-screenshot not installed. Run: npm install modern-screenshot"), window.__drizzle_cube_thumbnail_warning__ = !0);
	}));
}
async function gn(e, t) {
	if (typeof window > "u" || !e.current) return null;
	let n = await R();
	if (!n) return null;
	try {
		let r = t.width ?? 1600, i = t.height ?? 1200, a = t.format ?? "png", o = t.quality ?? .95, s = e.current, c = bn(s);
		return await mn(await n.domToPng(s, {
			scale: 2,
			backgroundColor: c
		}), r, i, a, o);
	} catch (e) {
		return console.error("[drizzle-cube] Failed to capture thumbnail:", e), null;
	}
}
async function _n(e) {
	return !e?.enabled || typeof window > "u" ? !1 : await R() !== null;
}
async function vn() {
	return typeof window > "u" || !await R() ? !1 : typeof ClipboardItem < "u" && typeof navigator?.clipboard?.write == "function";
}
function yn(e) {
	if (!e || e === "transparent" || e === "rgba(0, 0, 0, 0)") return !0;
	let t = e.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
	return !!(t && parseFloat(t[1]) === 0);
}
function bn(e) {
	let t = e;
	for (; t;) {
		let e = getComputedStyle(t).backgroundColor;
		if (!yn(e)) return e;
		t = t.parentElement;
	}
	return getComputedStyle(document.documentElement).getPropertyValue("--dc-surface").trim() || "#ffffff";
}
async function xn(e) {
	try {
		let t = await R();
		if (!t) return console.warn("[drizzle-cube] Cannot copy portlet: modern-screenshot not available"), !1;
		let n = bn(e), r = await t.domToPng(e, {
			scale: 2,
			backgroundColor: n
		}), i = await (await fetch(r)).blob();
		return await navigator.clipboard.write([new ClipboardItem({ "image/png": i })]), !0;
	} catch (e) {
		return console.warn("[drizzle-cube] Failed to copy portlet to clipboard:", e), !1;
	}
}
//#endregion
//#region src/client/utils/exportXlsx.ts
var z = null, Sn = !1, B = {
	headerBg: "FF3B82F6",
	headerText: "FFFFFFFF",
	borderColor: "FFE5E7EB"
};
function Cn(e) {
	if (!e) return null;
	let t = e.trim();
	if (t.startsWith("#")) {
		let e = t.slice(1);
		return e.length === 3 ? `FF${e.split("").map((e) => e + e).join("").toUpperCase()}` : e.length === 6 ? `FF${e.toUpperCase()}` : e.length === 8 ? `${e.slice(6, 8)}${e.slice(0, 6)}`.toUpperCase() : null;
	}
	let n = t.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
	if (n) {
		let e = parseInt(n[1]).toString(16).padStart(2, "0"), t = parseInt(n[2]).toString(16).padStart(2, "0"), r = parseInt(n[3]).toString(16).padStart(2, "0");
		return `${n[4] === void 0 ? "FF" : Math.round(parseFloat(n[4]) * 255).toString(16).padStart(2, "0")}${e}${t}${r}`.toUpperCase();
	}
	return null;
}
function wn() {
	if (typeof document > "u") return B;
	let e = getComputedStyle(document.documentElement), t = e.getPropertyValue("--dc-primary").trim(), n = e.getPropertyValue("--dc-primary-content").trim(), r = e.getPropertyValue("--dc-border").trim();
	return {
		headerBg: Cn(t) ?? B.headerBg,
		headerText: Cn(n) ?? B.headerText,
		borderColor: Cn(r) ?? B.borderColor
	};
}
function Tn(e) {
	return e == null ? null : e instanceof Date ? e : typeof e == "number" ? Number.isFinite(e) ? e : null : typeof e == "boolean" ? e : Array.isArray(e) ? e.map((e) => String(e)).join(", ") : typeof e == "object" ? JSON.stringify(e) : String(e);
}
function En(e, t) {
	e.height = 18, e.eachCell((e) => {
		e.font = {
			bold: !0,
			color: { argb: t.headerText }
		}, e.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: t.headerBg }
		}, e.alignment = {
			vertical: "middle",
			horizontal: "center",
			wrapText: !0
		};
	});
}
function Dn(e, t) {
	e.eachRow((e) => {
		e.eachCell((e) => {
			e.border = {
				top: {
					style: "thin",
					color: { argb: t.borderColor }
				},
				left: {
					style: "thin",
					color: { argb: t.borderColor }
				},
				bottom: {
					style: "thin",
					color: { argb: t.borderColor }
				},
				right: {
					style: "thin",
					color: { argb: t.borderColor }
				}
			}, e.alignment = {
				vertical: "top",
				wrapText: !0
			};
		});
	});
}
function On(e, t = []) {
	e.columns?.forEach((e, n) => {
		let r = t[n] ?? 10;
		e.eachCell?.({ includeEmpty: !0 }, (e) => {
			let t = String(e.value ?? "").length;
			t > r && (r = t);
		}), e.width = Math.min(Math.max(r + 2, t[n] ?? 10), 70);
	});
}
function V(e, t, n, r) {
	let i = e.addWorksheet(t);
	if (n.length === 0) {
		i.addRow(["No data available"]), On(i, [32]);
		return;
	}
	let a = Object.keys(n[0]);
	En(i.addRow(a), r);
	for (let e of n) i.addRow(a.map((t) => Tn(e[t])));
	i.views = [{
		state: "frozen",
		ySplit: 1
	}], i.autoFilter = {
		from: {
			row: 1,
			column: 1
		},
		to: {
			row: 1,
			column: a.length
		}
	}, Dn(i, r), On(i);
}
function kn(e) {
	return e.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}
function An(e, t) {
	let n = kn(e), r = /* @__PURE__ */ new Date();
	return `${n}-${`${r.getFullYear()}${String(r.getMonth() + 1).padStart(2, "0")}${String(r.getDate()).padStart(2, "0")}`}-${crypto.randomUUID().slice(0, 4).toUpperCase()}.${t}`;
}
async function jn() {
	if (Sn) return z;
	try {
		return z = await import("./exceljs.min-CiByP8VQ.js").then((t) => /* @__PURE__ */ e(t.default, 1)), Sn = !0, z;
	} catch {
		return Sn = !0, z = null, null;
	}
}
async function Mn() {
	return typeof window > "u" ? !1 : await jn() !== null;
}
function Nn(e) {
	typeof window > "u" || e?.enabled && (window.__drizzle_cube_xls_export_warning__ || jn().then((e) => {
		!e && typeof process < "u" && process.env.NODE_ENV === "development" && (console.warn("[drizzle-cube] XLS export feature enabled but exceljs not installed. Run: npm install exceljs"), window.__drizzle_cube_xls_export_warning__ = !0);
	}));
}
function Pn(e) {
	return !!e && typeof e == "object" && "nodes" in e && "links" in e && Array.isArray(e.nodes) && Array.isArray(e.links);
}
function Fn(e) {
	return !!e && typeof e == "object" && "rows" in e && "periods" in e && Array.isArray(e.rows) && Array.isArray(e.periods);
}
function In(e, t) {
	let n = new Blob([e], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), r = URL.createObjectURL(n), i = document.createElement("a");
	i.href = r, i.download = t, document.body.appendChild(i), i.click(), document.body.removeChild(i), URL.revokeObjectURL(r);
}
async function Ln(e, t) {
	let n = await jn();
	if (!n) return console.warn("[drizzle-cube] Cannot export: exceljs not available"), !1;
	try {
		let r = new n.Workbook(), i = wn(), { data: a } = t;
		if (Pn(a)) V(r, "Nodes", a.nodes, i), V(r, "Links", a.links, i);
		else if (Fn(a)) V(r, e, a.rows, i);
		else if (Array.isArray(a)) V(r, e, a, i);
		else return console.warn("[drizzle-cube] Cannot export: unrecognized data format"), !1;
		return In(await r.xlsx.writeBuffer(), An(e || "export", "xlsx")), !0;
	} catch (e) {
		return console.error("[drizzle-cube] Failed to export XLSX:", e), !1;
	}
}
//#endregion
//#region src/client/providers/CubeFeaturesProvider.tsx
var Rn = ge(null), zn = {
	enableAI: !0,
	aiEndpoint: "/api/ai/generate",
	showSchemaDiagram: !1,
	useAnalysisBuilder: !1,
	editToolbar: "both",
	floatingToolbarPosition: "right"
};
function Bn({ features: e, dashboardModes: t = ["rows", "grid"], children: n }) {
	let [r, i] = C(() => ({
		...zn,
		...e
	}));
	x(() => {
		hn(r.thumbnail);
	}, [r.thumbnail]), x(() => {
		Nn(r.xlsExport);
	}, [r.xlsExport]);
	let a = be((e) => {
		i((t) => ({
			...t,
			...e
		}));
	}, []), o = S(() => ({
		features: r,
		dashboardModes: t,
		updateFeatures: a
	}), [
		r,
		t,
		a
	]);
	return /* @__PURE__ */ w(Rn.Provider, {
		value: o,
		children: n
	});
}
var Vn = {
	features: zn,
	dashboardModes: ["rows", "grid"],
	updateFeatures: () => {}
};
function Hn() {
	return xe(Rn) ?? Vn;
}
//#endregion
//#region node_modules/@iconify/react/dist/iconify.js
function Un(e, t) {
	let n = e.icons, r = e.aliases || Object.create(null), i = Object.create(null);
	function a(e) {
		if (n[e]) return i[e] = [];
		if (!(e in i)) {
			i[e] = null;
			let t = r[e] && r[e].parent, n = t && a(t);
			n && (i[e] = [t].concat(n));
		}
		return i[e];
	}
	return Object.keys(n).concat(Object.keys(r)).forEach(a), i;
}
var Wn = Object.freeze({
	left: 0,
	top: 0,
	width: 16,
	height: 16
}), H = Object.freeze({
	rotate: 0,
	vFlip: !1,
	hFlip: !1
}), Gn = Object.freeze({
	...Wn,
	...H
}), Kn = Object.freeze({
	...Gn,
	body: "",
	hidden: !1
});
function qn(e, t) {
	let n = {};
	!e.hFlip != !t.hFlip && (n.hFlip = !0), !e.vFlip != !t.vFlip && (n.vFlip = !0);
	let r = ((e.rotate || 0) + (t.rotate || 0)) % 4;
	return r && (n.rotate = r), n;
}
function Jn(e, t) {
	let n = qn(e, t);
	for (let r in Kn) r in H ? r in e && !(r in n) && (n[r] = H[r]) : r in t ? n[r] = t[r] : r in e && (n[r] = e[r]);
	return n;
}
function Yn(e, t, n) {
	let r = e.icons, i = e.aliases || Object.create(null), a = {};
	function o(e) {
		a = Jn(r[e] || i[e], a);
	}
	return o(t), n.forEach(o), Jn(e, a);
}
function Xn(e, t) {
	let n = [];
	if (typeof e != "object" || typeof e.icons != "object") return n;
	e.not_found instanceof Array && e.not_found.forEach((e) => {
		t(e, null), n.push(e);
	});
	let r = Un(e);
	for (let i in r) {
		let a = r[i];
		a && (t(i, Yn(e, i, a)), n.push(i));
	}
	return n;
}
var Zn = {
	provider: "",
	aliases: {},
	not_found: {},
	...Wn
};
function Qn(e, t) {
	for (let n in t) if (n in e && typeof e[n] != typeof t[n]) return !1;
	return !0;
}
function $n(e) {
	if (typeof e != "object" || !e) return null;
	let t = e;
	if (typeof t.prefix != "string" || !e.icons || typeof e.icons != "object" || !Qn(e, Zn)) return null;
	let n = t.icons;
	for (let e in n) {
		let t = n[e];
		if (!e || typeof t.body != "string" || !Qn(t, Kn)) return null;
	}
	let r = t.aliases || Object.create(null);
	for (let e in r) {
		let t = r[e], i = t.parent;
		if (!e || typeof i != "string" || !n[i] && !r[i] || !Qn(t, Kn)) return null;
	}
	return t;
}
var er = Object.create(null);
function tr(e, t) {
	return {
		provider: e,
		prefix: t,
		icons: Object.create(null),
		missing: /* @__PURE__ */ new Set()
	};
}
function U(e, t) {
	let n = er[e] || (er[e] = Object.create(null));
	return n[t] || (n[t] = tr(e, t));
}
function nr(e, t) {
	return $n(t) ? Xn(t, (t, n) => {
		n ? e.icons[t] = n : e.missing.add(t);
	}) : [];
}
function rr(e, t, n) {
	try {
		if (typeof n.body == "string") return e.icons[t] = { ...n }, !0;
	} catch {}
	return !1;
}
var ir = /^[a-z0-9]+(-[a-z0-9]+)*$/, W = (e, t, n, r = "") => {
	let i = e.split(":");
	if (e.slice(0, 1) === "@") {
		if (i.length < 2 || i.length > 3) return null;
		r = i.shift().slice(1);
	}
	if (i.length > 3 || !i.length) return null;
	if (i.length > 1) {
		let e = i.pop(), n = i.pop(), a = {
			provider: i.length > 0 ? i[0] : r,
			prefix: n,
			name: e
		};
		return t && !ar(a) ? null : a;
	}
	let a = i[0], o = a.split("-");
	if (o.length > 1) {
		let e = {
			provider: r,
			prefix: o.shift(),
			name: o.join("-")
		};
		return t && !ar(e) ? null : e;
	}
	if (n && r === "") {
		let e = {
			provider: r,
			prefix: "",
			name: a
		};
		return t && !ar(e, n) ? null : e;
	}
	return null;
}, ar = (e, t) => e ? !!((t && e.prefix === "" || e.prefix) && e.name) : !1, G = !1;
function or(e) {
	return typeof e == "boolean" && (G = e), G;
}
function sr(e) {
	let t = typeof e == "string" ? W(e, !0, G) : e;
	if (t) {
		let e = U(t.provider, t.prefix), n = t.name;
		return e.icons[n] || (e.missing.has(n) ? null : void 0);
	}
}
function cr(e, t) {
	let n = W(e, !0, G);
	if (!n) return !1;
	let r = U(n.provider, n.prefix);
	return t ? rr(r, n.name, t) : (r.missing.add(n.name), !0);
}
function lr(e, t) {
	if (typeof e != "object") return !1;
	if (typeof t != "string" && (t = e.provider || ""), G && !t && !e.prefix) {
		let t = !1;
		return $n(e) && (e.prefix = "", Xn(e, (e, n) => {
			cr(e, n) && (t = !0);
		})), t;
	}
	let n = e.prefix;
	return ar({
		prefix: n,
		name: "a"
	}) ? !!nr(U(t, n), e) : !1;
}
var ur = Object.freeze({
	width: null,
	height: null
}), dr = Object.freeze({
	...ur,
	...H
}), fr = /(-?[0-9.]*[0-9]+[0-9.]*)/g, pr = /^-?[0-9.]*[0-9]+[0-9.]*$/g;
function mr(e, t, n) {
	if (t === 1) return e;
	if (n ||= 100, typeof e == "number") return Math.ceil(e * t * n) / n;
	if (typeof e != "string") return e;
	let r = e.split(fr);
	if (r === null || !r.length) return e;
	let i = [], a = r.shift(), o = pr.test(a);
	for (;;) {
		if (o) {
			let e = parseFloat(a);
			i.push(isNaN(e) ? a : Math.ceil(e * t * n) / n);
		} else i.push(a);
		if (a = r.shift(), a === void 0) return i.join("");
		o = !o;
	}
}
function hr(e, t = "defs") {
	let n = "", r = e.indexOf("<" + t);
	for (; r >= 0;) {
		let i = e.indexOf(">", r), a = e.indexOf("</" + t);
		if (i === -1 || a === -1) break;
		let o = e.indexOf(">", a);
		if (o === -1) break;
		n += e.slice(i + 1, a).trim(), e = e.slice(0, r).trim() + e.slice(o + 1);
	}
	return {
		defs: n,
		content: e
	};
}
function gr(e, t) {
	return e ? "<defs>" + e + "</defs>" + t : t;
}
function _r(e, t, n) {
	let r = hr(e);
	return gr(r.defs, t + r.content + n);
}
var vr = (e) => e === "unset" || e === "undefined" || e === "none";
function yr(e, t) {
	let n = {
		...Gn,
		...e
	}, r = {
		...dr,
		...t
	}, i = {
		left: n.left,
		top: n.top,
		width: n.width,
		height: n.height
	}, a = n.body;
	[n, r].forEach((e) => {
		let t = [], n = e.hFlip, r = e.vFlip, o = e.rotate;
		n ? r ? o += 2 : (t.push("translate(" + (i.width + i.left).toString() + " " + (0 - i.top).toString() + ")"), t.push("scale(-1 1)"), i.top = i.left = 0) : r && (t.push("translate(" + (0 - i.left).toString() + " " + (i.height + i.top).toString() + ")"), t.push("scale(1 -1)"), i.top = i.left = 0);
		let s;
		switch (o < 0 && (o -= Math.floor(o / 4) * 4), o %= 4, o) {
			case 1:
				s = i.height / 2 + i.top, t.unshift("rotate(90 " + s.toString() + " " + s.toString() + ")");
				break;
			case 2:
				t.unshift("rotate(180 " + (i.width / 2 + i.left).toString() + " " + (i.height / 2 + i.top).toString() + ")");
				break;
			case 3: s = i.width / 2 + i.left, t.unshift("rotate(-90 " + s.toString() + " " + s.toString() + ")");
		}
		o % 2 == 1 && (i.left !== i.top && (s = i.left, i.left = i.top, i.top = s), i.width !== i.height && (s = i.width, i.width = i.height, i.height = s)), t.length && (a = _r(a, "<g transform=\"" + t.join(" ") + "\">", "</g>"));
	});
	let o = r.width, s = r.height, c = i.width, l = i.height, u, d;
	o === null ? (d = s === null ? "1em" : s === "auto" ? l : s, u = mr(d, c / l)) : (u = o === "auto" ? c : o, d = s === null ? mr(u, l / c) : s === "auto" ? l : s);
	let f = {}, p = (e, t) => {
		vr(t) || (f[e] = t.toString());
	};
	p("width", u), p("height", d);
	let m = [
		i.left,
		i.top,
		c,
		l
	];
	return f.viewBox = m.join(" "), {
		attributes: f,
		viewBox: m,
		body: a
	};
}
var br = /\sid="(\S+)"/g, xr = "IconifyId" + Date.now().toString(16) + (Math.random() * 16777216 | 0).toString(16), Sr = 0;
function Cr(e, t = xr) {
	let n = [], r;
	for (; r = br.exec(e);) n.push(r[1]);
	if (!n.length) return e;
	let i = "suffix" + (Math.random() * 16777216 | Date.now()).toString(16);
	return n.forEach((n) => {
		let r = typeof t == "function" ? t(n) : t + (Sr++).toString(), a = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		e = e.replace(RegExp("([#;\"])(" + a + ")([\")]|\\.[a-z])", "g"), "$1" + r + i + "$3");
	}), e = e.replace(new RegExp(i, "g"), ""), e;
}
var wr = Object.create(null);
function Tr(e, t) {
	wr[e] = t;
}
function Er(e) {
	return wr[e] || wr[""];
}
function Dr(e) {
	let t;
	if (typeof e.resources == "string") t = [e.resources];
	else if (t = e.resources, !(t instanceof Array) || !t.length) return null;
	return {
		resources: t,
		path: e.path || "/",
		maxURL: e.maxURL || 500,
		rotate: e.rotate || 750,
		timeout: e.timeout || 5e3,
		random: e.random === !0,
		index: e.index || 0,
		dataAfterTimeout: e.dataAfterTimeout !== !1
	};
}
for (var Or = Object.create(null), kr = ["https://api.simplesvg.com", "https://api.unisvg.com"], Ar = []; kr.length > 0;) Ar.push(kr.length === 1 || Math.random() > .5 ? kr.shift() : kr.pop());
Or[""] = Dr({ resources: ["https://api.iconify.design"].concat(Ar) });
function jr(e, t) {
	let n = Dr(t);
	return n !== null && (Or[e] = n, !0);
}
function Mr(e) {
	return Or[e];
}
var Nr = (() => {
	let e;
	try {
		if (e = fetch, typeof e == "function") return e;
	} catch {}
})();
function Pr(e, t) {
	let n = Mr(e);
	if (!n) return 0;
	let r;
	if (!n.maxURL) r = 0;
	else {
		let e = 0;
		n.resources.forEach((t) => {
			e = Math.max(e, t.length);
		});
		let i = t + ".json?icons=";
		r = n.maxURL - e - n.path.length - i.length;
	}
	return r;
}
function Fr(e) {
	return e === 404;
}
var Ir = (e, t, n) => {
	let r = [], i = Pr(e, t), a = "icons", o = {
		type: a,
		provider: e,
		prefix: t,
		icons: []
	}, s = 0;
	return n.forEach((n, c) => {
		s += n.length + 1, s >= i && c > 0 && (r.push(o), o = {
			type: a,
			provider: e,
			prefix: t,
			icons: []
		}, s = n.length), o.icons.push(n);
	}), r.push(o), r;
};
function Lr(e) {
	if (typeof e == "string") {
		let t = Mr(e);
		if (t) return t.path;
	}
	return "/";
}
var Rr = {
	prepare: Ir,
	send: (e, t, n) => {
		if (!Nr) {
			n("abort", 424);
			return;
		}
		let r = Lr(t.provider);
		switch (t.type) {
			case "icons": {
				let e = t.prefix, n = t.icons.join(","), i = new URLSearchParams({ icons: n });
				r += e + ".json?" + i.toString();
				break;
			}
			case "custom": {
				let e = t.uri;
				r += e.slice(0, 1) === "/" ? e.slice(1) : e;
				break;
			}
			default:
				n("abort", 400);
				return;
		}
		let i = 503;
		Nr(e + r).then((e) => {
			let t = e.status;
			if (t !== 200) {
				setTimeout(() => {
					n(Fr(t) ? "abort" : "next", t);
				});
				return;
			}
			return i = 501, e.json();
		}).then((e) => {
			if (typeof e != "object" || !e) {
				setTimeout(() => {
					e === 404 ? n("abort", e) : n("next", i);
				});
				return;
			}
			setTimeout(() => {
				n("success", e);
			});
		}).catch(() => {
			n("next", i);
		});
	}
};
function zr(e, t) {
	e.forEach((e) => {
		let n = e.loaderCallbacks;
		n && (e.loaderCallbacks = n.filter((e) => e.id !== t));
	});
}
function Br(e) {
	e.pendingCallbacksFlag || (e.pendingCallbacksFlag = !0, setTimeout(() => {
		e.pendingCallbacksFlag = !1;
		let t = e.loaderCallbacks ? e.loaderCallbacks.slice(0) : [];
		if (!t.length) return;
		let n = !1, r = e.provider, i = e.prefix;
		t.forEach((t) => {
			let a = t.icons, o = a.pending.length;
			a.pending = a.pending.filter((t) => {
				if (t.prefix !== i) return !0;
				let o = t.name;
				if (e.icons[o]) a.loaded.push({
					provider: r,
					prefix: i,
					name: o
				});
				else if (e.missing.has(o)) a.missing.push({
					provider: r,
					prefix: i,
					name: o
				});
				else return n = !0, !0;
				return !1;
			}), a.pending.length !== o && (n || zr([e], t.id), t.callback(a.loaded.slice(0), a.missing.slice(0), a.pending.slice(0), t.abort));
		});
	}));
}
var Vr = 0;
function Hr(e, t, n) {
	let r = Vr++, i = zr.bind(null, n, r);
	if (!t.pending.length) return i;
	let a = {
		id: r,
		icons: t,
		callback: e,
		abort: i
	};
	return n.forEach((e) => {
		(e.loaderCallbacks ||= []).push(a);
	}), i;
}
function Ur(e) {
	let t = {
		loaded: [],
		missing: [],
		pending: []
	}, n = Object.create(null);
	e.sort((e, t) => e.provider === t.provider ? e.prefix === t.prefix ? e.name.localeCompare(t.name) : e.prefix.localeCompare(t.prefix) : e.provider.localeCompare(t.provider));
	let r = {
		provider: "",
		prefix: "",
		name: ""
	};
	return e.forEach((e) => {
		if (r.name === e.name && r.prefix === e.prefix && r.provider === e.provider) return;
		r = e;
		let i = e.provider, a = e.prefix, o = e.name, s = n[i] || (n[i] = Object.create(null)), c = s[a] || (s[a] = U(i, a)), l;
		l = o in c.icons ? t.loaded : a === "" || c.missing.has(o) ? t.missing : t.pending, l.push({
			provider: i,
			prefix: a,
			name: o
		});
	}), t;
}
function Wr(e, t = !0, n = !1) {
	let r = [];
	return e.forEach((e) => {
		let i = typeof e == "string" ? W(e, t, n) : e;
		i && r.push(i);
	}), r;
}
var Gr = {
	resources: [],
	index: 0,
	timeout: 2e3,
	rotate: 750,
	random: !1,
	dataAfterTimeout: !1
};
function Kr(e, t, n, r) {
	let i = e.random ? Math.floor(Math.random() * e.resources.length) : e.index, a;
	if (e.random) {
		let t = e.resources.slice(0);
		for (a = []; t.length > 1;) {
			let e = Math.floor(Math.random() * t.length);
			a.push(t[e]), t = t.slice(0, e).concat(t.slice(e + 1));
		}
		a = a.concat(t);
	} else a = e.resources.slice(i).concat(e.resources.slice(0, i));
	let o = Date.now(), s = "pending", c = 0, l, u = null, d = [], f = [];
	typeof r == "function" && f.push(r);
	function p() {
		u &&= (clearTimeout(u), null);
	}
	function m() {
		s === "pending" && (s = "aborted"), p(), d.forEach((e) => {
			e.status === "pending" && (e.status = "aborted");
		}), d = [];
	}
	function h(e, t) {
		t && (f = []), typeof e == "function" && f.push(e);
	}
	function g() {
		return {
			startTime: o,
			payload: t,
			status: s,
			queriesSent: c,
			queriesPending: d.length,
			subscribe: h,
			abort: m
		};
	}
	function _() {
		s = "failed", f.forEach((e) => {
			e(void 0, l);
		});
	}
	function v() {
		d.forEach((e) => {
			e.status === "pending" && (e.status = "aborted");
		}), d = [];
	}
	function ee(t, n, r) {
		let i = n !== "success";
		switch (d = d.filter((e) => e !== t), s) {
			case "pending": break;
			case "failed":
				if (i || !e.dataAfterTimeout) return;
				break;
			default: return;
		}
		if (n === "abort") {
			l = r, _();
			return;
		}
		if (i) {
			l = r, d.length || (a.length ? y() : _());
			return;
		}
		if (p(), v(), !e.random) {
			let n = e.resources.indexOf(t.resource);
			n !== -1 && n !== e.index && (e.index = n);
		}
		s = "completed", f.forEach((e) => {
			e(r);
		});
	}
	function y() {
		if (s !== "pending") return;
		p();
		let r = a.shift();
		if (r === void 0) {
			if (d.length) {
				u = setTimeout(() => {
					p(), s === "pending" && (v(), _());
				}, e.timeout);
				return;
			}
			_();
			return;
		}
		let i = {
			status: "pending",
			resource: r,
			callback: (e, t) => {
				ee(i, e, t);
			}
		};
		d.push(i), c++, u = setTimeout(y, e.rotate), n(r, t, i.callback);
	}
	return setTimeout(y), g;
}
function qr(e) {
	let t = {
		...Gr,
		...e
	}, n = [];
	function r() {
		n = n.filter((e) => e().status === "pending");
	}
	function i(e, i, a) {
		let o = Kr(t, e, i, (e, t) => {
			r(), a && a(e, t);
		});
		return n.push(o), o;
	}
	function a(e) {
		return n.find((t) => e(t)) || null;
	}
	return {
		query: i,
		find: a,
		setIndex: (e) => {
			t.index = e;
		},
		getIndex: () => t.index,
		cleanup: r
	};
}
function Jr() {}
var Yr = Object.create(null);
function Xr(e) {
	if (!Yr[e]) {
		let t = Mr(e);
		if (!t) return;
		Yr[e] = {
			config: t,
			redundancy: qr(t)
		};
	}
	return Yr[e];
}
function Zr(e, t, n) {
	let r, i;
	if (typeof e == "string") {
		let t = Er(e);
		if (!t) return n(void 0, 424), Jr;
		i = t.send;
		let a = Xr(e);
		a && (r = a.redundancy);
	} else {
		let t = Dr(e);
		if (t) {
			r = qr(t);
			let n = Er(e.resources ? e.resources[0] : "");
			n && (i = n.send);
		}
	}
	return !r || !i ? (n(void 0, 424), Jr) : r.query(t, i, n)().abort;
}
function Qr() {}
function $r(e) {
	e.iconsLoaderFlag || (e.iconsLoaderFlag = !0, setTimeout(() => {
		e.iconsLoaderFlag = !1, Br(e);
	}));
}
function ei(e) {
	let t = [], n = [];
	return e.forEach((e) => {
		(e.match(ir) ? t : n).push(e);
	}), {
		valid: t,
		invalid: n
	};
}
function K(e, t, n) {
	function r() {
		let n = e.pendingIcons;
		t.forEach((t) => {
			n && n.delete(t), e.icons[t] || e.missing.add(t);
		});
	}
	if (n && typeof n == "object") try {
		if (!nr(e, n).length) {
			r();
			return;
		}
	} catch (e) {
		console.error(e);
	}
	r(), $r(e);
}
function ti(e, t) {
	e instanceof Promise ? e.then((e) => {
		t(e);
	}).catch(() => {
		t(null);
	}) : t(e);
}
function ni(e, t) {
	e.iconsToLoad = e.iconsToLoad ? e.iconsToLoad.concat(t).sort() : t, e.iconsQueueFlag || (e.iconsQueueFlag = !0, setTimeout(() => {
		e.iconsQueueFlag = !1;
		let { provider: t, prefix: n } = e, r = e.iconsToLoad;
		if (delete e.iconsToLoad, !r || !r.length) return;
		let i = e.loadIcon;
		if (e.loadIcons && (r.length > 1 || !i)) {
			ti(e.loadIcons(r, n, t), (t) => {
				K(e, r, t);
			});
			return;
		}
		if (i) {
			r.forEach((r) => {
				ti(i(r, n, t), (t) => {
					K(e, [r], t ? {
						prefix: n,
						icons: { [r]: t }
					} : null);
				});
			});
			return;
		}
		let { valid: a, invalid: o } = ei(r);
		if (o.length && K(e, o, null), !a.length) return;
		let s = n.match(ir) ? Er(t) : null;
		if (!s) {
			K(e, a, null);
			return;
		}
		s.prepare(t, n, a).forEach((n) => {
			Zr(t, n, (t) => {
				K(e, n.icons, t);
			});
		});
	}));
}
var ri = (e, t) => {
	let n = Ur(Wr(e, !0, or()));
	if (!n.pending.length) {
		let e = !0;
		return t && setTimeout(() => {
			e && t(n.loaded, n.missing, n.pending, Qr);
		}), () => {
			e = !1;
		};
	}
	let r = Object.create(null), i = [], a, o;
	return n.pending.forEach((e) => {
		let { provider: t, prefix: n } = e;
		if (n === o && t === a) return;
		a = t, o = n, i.push(U(t, n));
		let s = r[t] || (r[t] = Object.create(null));
		s[n] || (s[n] = []);
	}), n.pending.forEach((e) => {
		let { provider: t, prefix: n, name: i } = e, a = U(t, n), o = a.pendingIcons ||= /* @__PURE__ */ new Set();
		o.has(i) || (o.add(i), r[t][n].push(i));
	}), i.forEach((e) => {
		let t = r[e.provider][e.prefix];
		t.length && ni(e, t);
	}), t ? Hr(t, n, i) : Qr;
};
function ii(e, t) {
	let n = { ...e };
	for (let e in t) {
		let r = t[e], i = typeof r;
		e in ur ? (r === null || r && (i === "string" || i === "number")) && (n[e] = r) : i === typeof n[e] && (n[e] = e === "rotate" ? r % 4 : r);
	}
	return n;
}
var ai = /[\s,]+/;
function oi(e, t) {
	t.split(ai).forEach((t) => {
		switch (t.trim()) {
			case "horizontal":
				e.hFlip = !0;
				break;
			case "vertical": e.vFlip = !0;
		}
	});
}
function si(e, t = 0) {
	let n = e.replace(/^-?[0-9.]*/, "");
	function r(e) {
		for (; e < 0;) e += 4;
		return e % 4;
	}
	if (n === "") {
		let t = parseInt(e);
		return isNaN(t) ? 0 : r(t);
	}
	if (n !== e) {
		let t = 0;
		switch (n) {
			case "%":
				t = 25;
				break;
			case "deg": t = 90;
		}
		if (t) {
			let i = parseFloat(e.slice(0, e.length - n.length));
			return isNaN(i) ? 0 : (i /= t, i % 1 == 0 ? r(i) : 0);
		}
	}
	return t;
}
function ci(e, t) {
	let n = e.indexOf("xlink:") === -1 ? "" : " xmlns:xlink=\"http://www.w3.org/1999/xlink\"";
	for (let e in t) n += " " + e + "=\"" + t[e] + "\"";
	return "<svg xmlns=\"http://www.w3.org/2000/svg\"" + n + ">" + e + "</svg>";
}
function li(e) {
	return e.replace(/"/g, "'").replace(/%/g, "%25").replace(/#/g, "%23").replace(/</g, "%3C").replace(/>/g, "%3E").replace(/\s+/g, " ");
}
function ui(e) {
	return "data:image/svg+xml," + li(e);
}
function di(e) {
	return "url(\"" + ui(e) + "\")";
}
var q;
function fi() {
	try {
		q = window.trustedTypes.createPolicy("iconify", { createHTML: (e) => e });
	} catch {
		q = null;
	}
}
function pi(e) {
	return q === void 0 && fi(), q ? q.createHTML(e) : e;
}
var mi = {
	...dr,
	inline: !1
}, hi = {
	xmlns: "http://www.w3.org/2000/svg",
	xmlnsXlink: "http://www.w3.org/1999/xlink",
	"aria-hidden": !0,
	role: "img"
}, gi = { display: "inline-block" }, _i = { backgroundColor: "currentColor" }, vi = { backgroundColor: "transparent" }, yi = {
	Image: "var(--svg)",
	Repeat: "no-repeat",
	Size: "100% 100%"
}, bi = {
	WebkitMask: _i,
	mask: _i,
	background: vi
};
for (let e in bi) {
	let t = bi[e];
	for (let n in yi) t[e + n] = yi[n];
}
var xi = {
	...mi,
	inline: !0
};
function Si(e) {
	return e + (e.match(/^[-0-9.]+$/) ? "px" : "");
}
var Ci = (e, t, n) => {
	let r = t.inline ? xi : mi, i = ii(r, t), a = t.mode || "svg", o = {}, s = t.style || {}, c = { ...a === "svg" ? hi : {} };
	if (n) {
		let e = W(n, !1, !0);
		if (e) {
			let t = ["iconify"];
			for (let n of ["provider", "prefix"]) e[n] && t.push("iconify--" + e[n]);
			c.className = t.join(" ");
		}
	}
	for (let e in t) {
		let n = t[e];
		if (n !== void 0) switch (e) {
			case "icon":
			case "style":
			case "children":
			case "onLoad":
			case "mode":
			case "ssr":
			case "fallback": break;
			case "_ref":
				c.ref = n;
				break;
			case "className":
				c[e] = (c[e] ? c[e] + " " : "") + n;
				break;
			case "inline":
			case "hFlip":
			case "vFlip":
				i[e] = n === !0 || n === "true" || n === 1;
				break;
			case "flip":
				typeof n == "string" && oi(i, n);
				break;
			case "color":
				o.color = n;
				break;
			case "rotate":
				typeof n == "string" ? i[e] = si(n) : typeof n == "number" && (i[e] = n);
				break;
			case "ariaHidden":
			case "aria-hidden":
				n !== !0 && n !== "true" && delete c["aria-hidden"];
				break;
			default: r[e] === void 0 && (c[e] = n);
		}
	}
	let l = yr(e, i), u = l.attributes;
	if (i.inline && (o.verticalAlign = "-0.125em"), a === "svg") {
		c.style = {
			...o,
			...s
		}, Object.assign(c, u);
		let e = 0, n = t.id;
		return typeof n == "string" && (n = n.replace(/-/g, "_")), c.dangerouslySetInnerHTML = { __html: pi(Cr(l.body, n ? () => n + "ID" + e++ : "iconifyReact")) }, _e("svg", c);
	}
	let { body: d, width: f, height: p } = e, m = a === "mask" || a !== "bg" && d.indexOf("currentColor") !== -1, h = ci(d, {
		...u,
		width: f + "",
		height: p + ""
	});
	return c.style = {
		...o,
		"--svg": di(h),
		width: Si(u.width),
		height: Si(u.height),
		...gi,
		...m ? _i : vi,
		...s
	}, _e("span", c);
};
if (or(!0), Tr("", Rr), typeof document < "u" && typeof window < "u") {
	let e = window;
	if (e.IconifyPreload !== void 0) {
		let t = e.IconifyPreload, n = "Invalid IconifyPreload syntax.";
		typeof t == "object" && t && (t instanceof Array ? t : [t]).forEach((e) => {
			try {
				(typeof e != "object" || !e || e instanceof Array || typeof e.icons != "object" || typeof e.prefix != "string" || !lr(e)) && console.error(n);
			} catch {
				console.error(n);
			}
		});
	}
	if (e.IconifyProviders !== void 0) {
		let t = e.IconifyProviders;
		if (typeof t == "object" && t) for (let e in t) {
			let n = "IconifyProviders[" + e + "] is invalid.";
			try {
				let r = t[e];
				if (typeof r != "object" || !r || r.resources === void 0) continue;
				jr(e, r) || console.error(n);
			} catch {
				console.error(n);
			}
		}
	}
}
function wi(e) {
	let [t, n] = C(!!e.ssr), [r, i] = C({});
	function a(t) {
		if (t) {
			let t = e.icon;
			if (typeof t == "object") return {
				name: "",
				data: t
			};
			let n = sr(t);
			if (n) return {
				name: t,
				data: n
			};
		}
		return { name: "" };
	}
	let [o, s] = C(a(!!e.ssr));
	function c() {
		let e = r.callback;
		e && (e(), i({}));
	}
	function l(e) {
		if (JSON.stringify(o) !== JSON.stringify(e)) return c(), s(e), !0;
	}
	function u() {
		var t;
		let n = e.icon;
		if (typeof n == "object") {
			l({
				name: "",
				data: n
			});
			return;
		}
		let r = sr(n);
		if (l({
			name: n,
			data: r
		})) {
			if (r === void 0) {
				let e = ri([n], u);
				i({ callback: e });
			} else r && ((t = e.onLoad) == null || t.call(e, n));
		}
	}
	x(() => (n(!0), c), []), x(() => {
		t && u();
	}, [e.icon, t]);
	let { name: d, data: f } = o;
	return f ? Ci({
		...Gn,
		...f
	}, e, d) : e.children ? e.children : e.fallback ? e.fallback : _e("span", {});
}
var Ti = ve((e, t) => wi({
	...e,
	_ref: t
}));
ve((e, t) => wi({
	inline: !0,
	...e,
	_ref: t
}));
//#endregion
//#region node_modules/@iconify-icons/heroicons-outline/data/x/x-mark.js
var Ei = {
	width: 24,
	height: 24,
	hidden: !0,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"m4.5 19.5l15-15m-15 0l15 15\"/>"
}, Di = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 4v16m8-8H4\"/>"
}, Oi = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 1 1 3.536 3.536L6.5 21.036H3v-3.572z\"/>"
}, ki = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16\"/>"
}, Ai = {
	width: 24,
	height: 24,
	hidden: !0,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"M4.5 12c0-1.232.046-2.453.138-3.662a4.006 4.006 0 0 1 3.7-3.7a48.678 48.678 0 0 1 7.324 0a4.006 4.006 0 0 1 3.7 3.7c.017.22.032.441.046.662M4.5 12l-3-3m3 3l3-3m12 3c0 1.232-.046 2.453-.138 3.662a4.006 4.006 0 0 1-3.7 3.7a48.657 48.657 0 0 1-7.324 0a4.006 4.006 0 0 1-3.7-3.7c-.017-.22-.032-.441-.046-.662M19.5 12l-3 3m3-3l3 3\"/>"
}, ji = {
	width: 24,
	height: 24,
	hidden: !0,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192c.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z\"/>"
}, Mi = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8 7v8a2 2 0 0 0 2 2h6M8 7V5a2 2 0 0 1 2-2h4.586a1 1 0 0 1 .707.293l4.414 4.414a1 1 0 0 1 .293.707V15a2 2 0 0 1-2 2h-2M8 7H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2\"/>"
}, Ni = {
	width: 24,
	height: 24,
	body: "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37c.996.608 2.296.07 2.572-1.065\"/><path d=\"M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0\"/></g>"
}, Pi = {
	width: 24,
	height: 24,
	hidden: !0,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"M12 3c2.755 0 5.455.232 8.083.678c.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z\"/>"
}, Fi = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 1 1 0-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 1 0 5.367-2.684a3 3 0 0 0-5.367 2.684m0 9.316a3 3 0 1 0 5.368 2.684a3 3 0 0 0-5.368-2.684\"/>"
}, Ii = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m5 15l7-7l7 7\"/>"
}, Li = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m19 9l-7 7l-7-7\"/>"
}, Ri = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m15 19l-7-7l7-7\"/>"
}, zi = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m9 5l7 7l-7 7\"/>"
}, Bi = {
	width: 24,
	height: 24,
	hidden: !0,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"m21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z\"/>"
}, Vi = {
	width: 24,
	height: 24,
	hidden: !0,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5\"/>"
}, Hi = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m9 12l2 2l4-4m6 2a9 9 0 1 1-18 0a9 9 0 0 1 18 0\"/>"
}, Ui = {
	width: 24,
	height: 24,
	hidden: !0,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"M12 10.5v3.75m-9.303 3.376C1.83 19.126 2.914 21 4.645 21h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 4.88c-.866-1.501-3.032-1.501-3.898 0L2.697 17.626ZM12 17.25h.007v.008H12v-.008Z\"/>"
}, Wi = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0\"/>"
}, Gi = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143z\"/>"
}, Ki = {
	width: 24,
	height: 24,
	body: "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0\"/><path d=\"M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7s-8.268-2.943-9.542-7\"/></g>"
}, qi = {
	width: 24,
	height: 24,
	hidden: !0,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88\"/>"
}, Ji = {
	width: 24,
	height: 24,
	hidden: !0,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75\"/>"
}, Yi = {
	width: 24,
	height: 24,
	hidden: !0,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25\"/>"
}, Xi = {
	width: 24,
	height: 24,
	hidden: !0,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5\"/>"
}, Zi = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1\"/>"
}, Qi = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m14 5l7 7m0 0l-7 7m7-7H3\"/>"
}, $i = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 1 1-8 0a4 4 0 0 1 8 0\"/>"
}, ea = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M20.354 15.354A9 9 0 0 1 8.646 3.646A9.003 9.003 0 0 0 12 21a9 9 0 0 0 8.354-5.646\"/>"
}, ta = {
	width: 24,
	height: 24,
	hidden: !0,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"M6.75 12a.75.75 0 1 1-1.5 0a.75.75 0 0 1 1.5 0Zm6 0a.75.75 0 1 1-1.5 0a.75.75 0 0 1 1.5 0Zm6 0a.75.75 0 1 1-1.5 0a.75.75 0 0 1 1.5 0Z\"/>"
}, na = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2\"/>"
}, ra = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18s-3.332.477-4.5 1.253\"/>"
}, ia = {
	width: 24,
	height: 24,
	hidden: !0,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5\"/>"
}, aa = {
	width: 24,
	height: 24,
	hidden: !0,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88a1.124 1.124 0 0 1 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z\"/>"
}, oa = {
	width: 24,
	height: 24,
	body: "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/><path d=\"M15 13a3 3 0 1 1-6 0a3 3 0 0 1 6 0\"/></g>"
}, sa = {
	width: 24,
	height: 24,
	hidden: !0,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3\"/>"
}, ca = {
	width: 20,
	height: 20,
	hidden: !0,
	body: "<path fill=\"currentColor\" d=\"M1 8.25a1.25 1.25 0 1 1 2.5 0v7.5a1.25 1.25 0 1 1-2.5 0v-7.5ZM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0 1 14 3c0 .995-.182 1.948-.514 2.826c-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 0 1-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 0 1-1.341-.317l-2.734-1.366A3 3 0 0 0 6.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 0 1 2.166-1.73c.432-.143.853-.386 1.011-.814c.16-.432.248-.9.248-1.388Z\"/>"
}, la = {
	width: 20,
	height: 20,
	hidden: !0,
	body: "<path fill=\"currentColor\" d=\"M18.905 12.75a1.25 1.25 0 0 1-2.5 0v-7.5a1.25 1.25 0 1 1 2.5 0v7.5Zm-10 4.25v1.3c0 .268-.14.526-.395.607A2 2 0 0 1 5.905 17c0-.995.182-1.948.514-2.826c.204-.54-.166-1.174-.744-1.174h-2.52c-1.242 0-2.26-1.01-2.146-2.247c.193-2.08.652-4.082 1.341-5.974C2.752 3.678 3.833 3 5.005 3h3.192a3 3 0 0 1 1.342.317l2.733 1.366A3 3 0 0 0 13.613 5h1.292v7h-.963c-.684 0-1.258.482-1.612 1.068a4.012 4.012 0 0 1-2.165 1.73c-.433.143-.854.386-1.012.814c-.16.432-.248.9-.248 1.388Z\"/>"
}, ua = {
	width: 20,
	height: 20,
	body: "<path fill=\"currentColor\" d=\"M2 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1zm6-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1zm6-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z\"/>"
}, da = {
	width: 20,
	height: 20,
	body: "<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M17.707 9.293a1 1 0 0 1 0 1.414l-7 7a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 10V5a3 3 0 0 1 3-3h5c.256 0 .512.098.707.293zM5 6a1 1 0 1 0 0-2a1 1 0 0 0 0 2\" clip-rule=\"evenodd\"/>"
}, fa = {
	width: 20,
	height: 20,
	body: "<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M6 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H7V3a1 1 0 0 0-1-1m0 5a1 1 0 0 0 0 2h8a1 1 0 1 0 0-2z\" clip-rule=\"evenodd\"/>"
}, pa = {
	width: 20,
	height: 20,
	hidden: !0,
	body: "<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M2.5 3A1.5 1.5 0 0 0 1 4.5v4A1.5 1.5 0 0 0 2.5 10h6A1.5 1.5 0 0 0 10 8.5v-4A1.5 1.5 0 0 0 8.5 3h-6Zm11 2A1.5 1.5 0 0 0 12 6.5v7a1.5 1.5 0 0 0 1.5 1.5h4a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 17.5 5h-4Zm-10 7A1.5 1.5 0 0 0 2 13.5v2A1.5 1.5 0 0 0 3.5 17h6a1.5 1.5 0 0 0 1.5-1.5v-2A1.5 1.5 0 0 0 9.5 12h-6Z\" clip-rule=\"evenodd\"/>"
}, ma = {
	width: 20,
	height: 20,
	body: "<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M10 18a8 8 0 1 0 0-16a8 8 0 0 0 0 16M9.555 7.168A1 1 0 0 0 8 8v4a1 1 0 0 0 1.555.832l3-2a1 1 0 0 0 0-1.664z\" clip-rule=\"evenodd\"/>"
}, ha = {
	width: 20,
	height: 20,
	body: "<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0\" clip-rule=\"evenodd\"/>"
}, ga = {
	width: 20,
	height: 20,
	body: "<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M10 2a1 1 0 0 1 1 1v1.323l3.954 1.582l1.599-.8a1 1 0 0 1 .894 1.79l-1.233.616l1.738 5.42a1 1 0 0 1-.285 1.05A4 4 0 0 1 15 15a4 4 0 0 1-2.667-1.019a1 1 0 0 1-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 1 1 0 2H7a1 1 0 1 1 0-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 0 1-.285 1.05A4 4 0 0 1 5 15a4 4 0 0 1-2.667-1.019a1 1 0 0 1-.285-1.05l1.738-5.42l-1.233-.617a1 1 0 0 1 .894-1.788l1.599.799L9 4.323V3a1 1 0 0 1 1-1m-5 8.275l-.818 2.55a2 2 0 0 0 1.636 0zm10 0l-.818 2.55a2 2 0 0 0 1.636 0z\" clip-rule=\"evenodd\"/>"
}, _a = {
	width: 20,
	height: 20,
	hidden: !0,
	body: "<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M10 18a8 8 0 1 0 0-16a8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v4.59L7.3 9.24a.75.75 0 0 0-1.1 1.02l3.25 3.5a.75.75 0 0 0 1.1 0l3.25-3.5a.75.75 0 1 0-1.1-1.02l-1.95 2.1V6.75Z\" clip-rule=\"evenodd\"/>"
}, va = {
	width: 20,
	height: 20,
	hidden: !0,
	body: "<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M10 18a8 8 0 1 0 0-16a8 8 0 0 0 0 16Zm-.75-4.75a.75.75 0 0 0 1.5 0V8.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0L6.2 9.74a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z\" clip-rule=\"evenodd\"/>"
}, ya = {
	width: 20,
	height: 20,
	hidden: !0,
	body: "<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M12.577 4.878a.75.75 0 0 1 .919-.53l4.78 1.281a.75.75 0 0 1 .531.919l-1.281 4.78a.75.75 0 0 1-1.449-.387l.81-3.022a19.407 19.407 0 0 0-5.594 5.203a.75.75 0 0 1-1.139.093L7 10.06l-4.72 4.72a.75.75 0 0 1-1.06-1.061l5.25-5.25a.75.75 0 0 1 1.06 0l3.074 3.073a20.923 20.923 0 0 1 5.545-4.931l-3.042-.815a.75.75 0 0 1-.53-.919Z\" clip-rule=\"evenodd\"/>"
}, ba = {
	width: 20,
	height: 20,
	body: "<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M7 2a1 1 0 0 0-.707 1.707L7 4.414v3.758a1 1 0 0 1-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0 1 13 8.172V4.414l.707-.707A1 1 0 0 0 13 2zm2 6.172V4h2v4.172a3 3 0 0 0 .879 2.12l1.027 1.028a4 4 0 0 0-2.171.102l-.47.156a4 4 0 0 1-2.53 0l-.563-.187l-.114-.035l1.063-1.063A3 3 0 0 0 9 8.172\" clip-rule=\"evenodd\"/>"
}, xa = {
	width: 20,
	height: 20,
	hidden: !0,
	body: "<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z\" clip-rule=\"evenodd\"/>"
}, Sa = {
	width: 20,
	height: 20,
	body: "<g fill=\"currentColor\" fill-rule=\"evenodd\" clip-rule=\"evenodd\"><path d=\"M6.625 2.655A9 9 0 0 1 19 11a1 1 0 1 1-2 0a7 7 0 0 0-9.625-6.492a1 1 0 1 1-.75-1.853M4.662 4.959A1 1 0 0 1 4.75 6.37A6.97 6.97 0 0 0 3 11a1 1 0 1 1-2 0a8.97 8.97 0 0 1 2.25-5.953a1 1 0 0 1 1.412-.088\"/><path d=\"M5 11a5 5 0 1 1 10 0a1 1 0 1 1-2 0a3 3 0 1 0-6 0c0 1.677-.345 3.276-.968 4.729a1 1 0 1 1-1.838-.789A10 10 0 0 0 5 11m8.921 2.012a1 1 0 0 1 .831 1.145a20 20 0 0 1-.545 2.436a1 1 0 1 1-1.92-.558q.311-1.07.49-2.192a1 1 0 0 1 1.144-.83\"/><path d=\"M10 10a1 1 0 0 1 1 1c0 2.236-.46 4.368-1.29 6.304a1 1 0 0 1-1.838-.789A13.95 13.95 0 0 0 9 11a1 1 0 0 1 1-1\"/></g>"
}, Ca = {
	width: 20,
	height: 20,
	hidden: !0,
	body: "<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M4.25 2A2.25 2.25 0 0 0 2 4.25v11.5A2.25 2.25 0 0 0 4.25 18h11.5A2.25 2.25 0 0 0 18 15.75V4.25A2.25 2.25 0 0 0 15.75 2H4.25ZM15 5.75a.75.75 0 0 0-1.5 0v8.5a.75.75 0 0 0 1.5 0v-8.5Zm-8.5 6a.75.75 0 0 0-1.5 0v2.5a.75.75 0 0 0 1.5 0v-2.5ZM8.584 9a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm3.58-1.25a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0v-6.5Z\" clip-rule=\"evenodd\"/>"
}, wa = {
	width: 20,
	height: 20,
	body: "<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M10 18a8 8 0 1 0 0-16a8 8 0 0 0 0 16m1-11a1 1 0 1 0-2 0v2H7a1 1 0 1 0 0 2h2v2a1 1 0 1 0 2 0v-2h2a1 1 0 1 0 0-2h-2z\" clip-rule=\"evenodd\"/>"
}, Ta = {
	width: 20,
	height: 20,
	body: "<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M9.243 3.03a1 1 0 0 1 .727 1.213L9.53 6h2.94l.56-2.243a1 1 0 1 1 1.94.486L14.53 6H17a1 1 0 1 1 0 2h-2.97l-1 4H15a1 1 0 1 1 0 2h-2.47l-.56 2.242a1 1 0 1 1-1.94-.485L10.47 14H7.53l-.56 2.242a1 1 0 1 1-1.94-.485L5.47 14H3a1 1 0 1 1 0-2h2.97l1-4H5a1 1 0 1 1 0-2h2.47l.56-2.243a1 1 0 0 1 1.213-.727M9.03 8l-1 4h2.938l1-4z\" clip-rule=\"evenodd\"/>"
}, Ea = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 13a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zm12-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zM9 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zM4 20h14\"/>"
}, Da = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 19h16M4 15l4-6l4 2l4-5l4 4\"/>"
}, Oa = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m4 19l4-6l4 2l4-5l4 4v5zm0-7l3-4l4 2l5-6l4 4\"/>"
}, ka = {
	width: 24,
	height: 24,
	body: "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M10 3.2A9 9 0 1 0 20.8 14a1 1 0 0 0-1-1H13a2 2 0 0 1-2-2V4a.9.9 0 0 0-1-.8\"/><path d=\"M15 3.5A9 9 0 0 1 20.5 9H16a1 1 0 0 1-1-1z\"/></g>"
}, Aa = {
	width: 24,
	height: 24,
	body: "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M3 3v18h18\"/><path d=\"M7 15a2 2 0 1 0 4 0a2 2 0 1 0-4 0m4-10a2 2 0 1 0 4 0a2 2 0 1 0-4 0m5 7a2 2 0 1 0 4 0a2 2 0 1 0-4 0m5-9l-6 1.5m-.887 2.15l2.771 3.695M16 12.5l-5 2\"/></g>"
}, ja = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 7a2 2 0 1 0 4 0a2 2 0 1 0-4 0m11 8a2 2 0 1 0 4 0a2 2 0 1 0-4 0m1-9a3 3 0 1 0 6 0a3 3 0 1 0-6 0M3 18a3 3 0 1 0 6 0a3 3 0 1 0-6 0m6-1l5-1.5m-7.5-7l7.81 5.37M7 7l8-1\"/>"
}, Ma = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 16a3 3 0 1 0 6 0a3 3 0 1 0-6 0m11 3a2 2 0 1 0 4 0a2 2 0 1 0-4 0M10 7.5a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0\"/>"
}, Na = {
	width: 24,
	height: 24,
	body: "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"m12 3l9.5 7L18 21H6L2.5 10z\"/><path d=\"m12 7.5l5.5 4L15 17H8.5l-2-5.5z\"/><path d=\"m2.5 10l9.5 3l9.5-3\"/><path d=\"M12 3v10l6 8M6 21l6-8\"/></g>"
}, Pa = {
	width: 24,
	height: 24,
	body: "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M11 12a1 1 0 1 0 2 0a1 1 0 1 0-2 0\"/><path d=\"M15.51 15.56A5 5 0 1 0 12 17\"/><path d=\"M18.832 17.86A9 9 0 1 0 12 21m0-9v9\"/></g>"
}, Fa = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm8-2v16m-8-5h8m0-3h8m-4 0v8m0-4h4\"/>"
}, Ia = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 5h8m-8 4h5m-5 6h8m-8 4h5M3 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zm0 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z\"/>"
}, La = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 4h16M4 20h16M6 11a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z\"/>"
}, Ra = {
	body: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n    <rect x=\"3\" y=\"4\" width=\"5\" height=\"3\" rx=\"0.75\"/>\n    <rect x=\"16\" y=\"4\" width=\"5\" height=\"3\" rx=\"0.75\"/>\n    <rect x=\"16\" y=\"10.5\" width=\"5\" height=\"3\" rx=\"0.75\"/>\n    <rect x=\"16\" y=\"17\" width=\"5\" height=\"3\" rx=\"0.75\"/>\n    <path d=\"M8 5.5 C11 5.5, 13 5.5, 16 5.5\"/>\n    <path d=\"M8 5.5 C10 5.5, 11 7, 12 9 C13 11, 14 12, 16 12\"/>\n    <path d=\"M8 5.5 C10 5.5, 11 10, 12 14 C13 17, 14 18.5, 16 18.5\"/>\n  </g>",
	width: 24,
	height: 24
}, za = {
	body: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n    <rect x=\"2\" y=\"3\" width=\"20\" height=\"4\" rx=\"1\"/>\n    <rect x=\"4\" y=\"10\" width=\"16\" height=\"4\" rx=\"1\"/>\n    <rect x=\"6\" y=\"17\" width=\"12\" height=\"4\" rx=\"1\"/>\n  </g>",
	width: 24,
	height: 24
}, Ba = {
	body: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n    <!-- Grid cells representing retention matrix -->\n    <rect x=\"3\" y=\"3\" width=\"4\" height=\"4\" rx=\"0.5\"/>\n    <rect x=\"10\" y=\"3\" width=\"4\" height=\"4\" rx=\"0.5\"/>\n    <rect x=\"17\" y=\"3\" width=\"4\" height=\"4\" rx=\"0.5\"/>\n    <rect x=\"3\" y=\"10\" width=\"4\" height=\"4\" rx=\"0.5\"/>\n    <rect x=\"10\" y=\"10\" width=\"4\" height=\"4\" rx=\"0.5\"/>\n    <rect x=\"17\" y=\"10\" width=\"4\" height=\"4\" rx=\"0.5\"/>\n    <rect x=\"3\" y=\"17\" width=\"4\" height=\"4\" rx=\"0.5\"/>\n    <rect x=\"10\" y=\"17\" width=\"4\" height=\"4\" rx=\"0.5\"/>\n    <rect x=\"17\" y=\"17\" width=\"4\" height=\"4\" rx=\"0.5\"/>\n  </g>",
	width: 24,
	height: 24
}, Va = {
	width: 24,
	height: 24,
	body: "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M8.848 14.667L5.5 17.5M12 3v5m4 4h5M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0m11.219 3.328L17 19.5\"/><path d=\"M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0\"/></g>"
}, Ha = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm0 5h18M10 3v18\"/>"
}, Ua = {
	width: 24,
	height: 24,
	body: "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M11.795 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4m-1 3v4h4\"/><path d=\"M14 18a4 4 0 1 0 8 0a4 4 0 1 0-8 0m1-15v4M7 3v4m-4 4h16\"/></g>"
}, Wa = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 17V7l7 10V7m4 10h5m-5-7a2.5 3 0 1 0 5 0a2.5 3 0 1 0-5 0\"/>"
}, Ga = {
	width: 24,
	height: 24,
	body: "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"m3 17l6-6l4 4l8-8\"/><path d=\"M14 7h7v7\"/></g>"
}, Ka = {
	width: 24,
	height: 24,
	body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 20h3m7 0h7M6.9 15h6.9m-3.6-8.7L16 20M5 20l6-16h2l7 16\"/>"
}, qa = {
	width: 24,
	height: 24,
	body: "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M14 3v4a1 1 0 0 0 1 1h4\"/><path d=\"M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2M9 9h1m-1 4h6m-6 4h6\"/></g>"
}, Ja = {
	width: 24,
	height: 24,
	body: "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0m9-3h.01\"/><path d=\"M11 12h1v4h1\"/></g>"
}, Ya = {
	close: {
		icon: Ei,
		category: "action"
	},
	add: {
		icon: Di,
		category: "action"
	},
	edit: {
		icon: Oi,
		category: "action"
	},
	delete: {
		icon: ki,
		category: "action"
	},
	refresh: {
		icon: Ai,
		category: "action"
	},
	copy: {
		icon: ji,
		category: "action"
	},
	duplicate: {
		icon: Mi,
		category: "action"
	},
	settings: {
		icon: Ni,
		category: "action"
	},
	filter: {
		icon: Pi,
		category: "action"
	},
	share: {
		icon: Fi,
		category: "action"
	},
	expand: {
		icon: Li,
		category: "action"
	},
	collapse: {
		icon: Ii,
		category: "action"
	},
	search: {
		icon: Bi,
		category: "action"
	},
	menu: {
		icon: Vi,
		category: "action"
	},
	run: {
		icon: ma,
		category: "action"
	},
	check: {
		icon: ha,
		category: "action"
	},
	link: {
		icon: Zi,
		category: "action"
	},
	eye: {
		icon: Ki,
		category: "action"
	},
	eyeOff: {
		icon: qi,
		category: "action"
	},
	adjustments: {
		icon: Ji,
		category: "action"
	},
	desktop: {
		icon: Yi,
		category: "action"
	},
	table: {
		icon: Xi,
		category: "action"
	},
	sun: {
		icon: $i,
		category: "action"
	},
	moon: {
		icon: ea,
		category: "action"
	},
	ellipsisHorizontal: {
		icon: ta,
		category: "action"
	},
	documentText: {
		icon: na,
		category: "action"
	},
	bookOpen: {
		icon: ra,
		category: "action"
	},
	codeBracket: {
		icon: ia,
		category: "action"
	},
	swatch: {
		icon: aa,
		category: "action"
	},
	camera: {
		icon: oa,
		category: "action"
	},
	thumbUp: {
		icon: ca,
		category: "action"
	},
	thumbDown: {
		icon: la,
		category: "action"
	},
	schemaGraph: {
		icon: {
			width: 24,
			height: 24,
			body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7\"/>"
		},
		category: "action"
	},
	cube: {
		icon: {
			width: 24,
			height: 24,
			body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m20 7l-8-4l-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4\"/>"
		},
		category: "action"
	},
	download: {
		icon: sa,
		category: "action"
	},
	measure: {
		icon: ua,
		category: "field"
	},
	dimension: {
		icon: da,
		category: "field"
	},
	timeDimension: {
		icon: fa,
		category: "field"
	},
	segment: {
		icon: pa,
		category: "field"
	},
	chartBar: {
		icon: Ea,
		category: "chart"
	},
	chartLine: {
		icon: Da,
		category: "chart"
	},
	chartArea: {
		icon: Oa,
		category: "chart"
	},
	chartPie: {
		icon: ka,
		category: "chart"
	},
	chartScatter: {
		icon: Aa,
		category: "chart"
	},
	chartBubble: {
		icon: Ma,
		category: "chart"
	},
	chartRadar: {
		icon: Na,
		category: "chart"
	},
	chartRadialBar: {
		icon: Pa,
		category: "chart"
	},
	chartTreemap: {
		icon: Fa,
		category: "chart"
	},
	chartTable: {
		icon: Ha,
		category: "chart"
	},
	chartRecordsTable: {
		icon: Ia,
		category: "chart"
	},
	chartActivityGrid: {
		icon: Ua,
		category: "chart"
	},
	chartKpiNumber: {
		icon: Wa,
		category: "chart"
	},
	chartKpiDelta: {
		icon: Ga,
		category: "chart"
	},
	chartKpiText: {
		icon: Ka,
		category: "chart"
	},
	chartMarkdown: {
		icon: qa,
		category: "chart"
	},
	chartFunnel: {
		icon: za,
		category: "chart"
	},
	chartSankey: {
		icon: Ra,
		category: "chart"
	},
	chartSunburst: {
		icon: Va,
		category: "chart"
	},
	chartHeatmap: {
		icon: {
			width: 24,
			height: 24,
			body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M16 6a2 2 0 1 0 4 0a2 2 0 1 0-4 0M4 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0m0 6a2 2 0 1 0 4 0a2 2 0 1 0-4 0m12 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0m-8 0h8m2 2v1m0-18v1M6 20v1m0-11V3m6 0v18m6-13v8M8 12h13m0-6h-1m-4 0H3m0 6h1m16 6h1M3 18h1m2-4v2\"/>"
		},
		category: "chart"
	},
	chartRetention: {
		icon: Ba,
		category: "chart"
	},
	chartBoxPlot: {
		icon: {
			width: 24,
			height: 24,
			body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm4 10v.01M8 12v.01M8 8v.01M16 16v.01M16 12v.01M16 8v.01M12 8v.01M12 16v.01\"/>"
		},
		category: "chart"
	},
	chartDotStrip: {
		icon: ja,
		category: "chart"
	},
	chartWaterfall: {
		icon: {
			width: 24,
			height: 24,
			body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M22 5h-5v5h-5v5H7v5H2\"/>"
		},
		category: "chart"
	},
	chartCandlestick: {
		icon: {
			width: 24,
			height: 24,
			body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm2-3v2m0 5v9m4-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zm2-11v10m0 5v1m4-14a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zm2-2v1m0 6v9\"/>"
		},
		category: "chart"
	},
	chartMeasureProfile: {
		icon: {
			width: 24,
			height: 24,
			body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M18 21V7m-9 8l3-3l3 3m0-5l3-3l3 3M3 21h18m-9 0v-9M3 6l3-3l3 3M6 21V3\"/>"
		},
		category: "chart"
	},
	chartProportionBar: {
		icon: La,
		category: "chart"
	},
	chartGauge: {
		icon: {
			width: 24,
			height: 24,
			body: "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0\"/><path d=\"M11 12a1 1 0 1 0 2 0a1 1 0 1 0-2 0m2.41-1.41L16 8m-9 4a5 5 0 0 1 5-5\"/></g>"
		},
		category: "chart"
	},
	measureCount: {
		icon: xa,
		category: "measure"
	},
	measureCountDistinct: {
		icon: Sa,
		category: "measure"
	},
	measureCountDistinctApprox: {
		icon: Ca,
		category: "measure"
	},
	measureSum: {
		icon: wa,
		category: "measure"
	},
	measureAvg: {
		icon: ga,
		category: "measure"
	},
	measureMin: {
		icon: _a,
		category: "measure"
	},
	measureMax: {
		icon: va,
		category: "measure"
	},
	measureRunningTotal: {
		icon: ya,
		category: "measure"
	},
	measureCalculated: {
		icon: ba,
		category: "measure"
	},
	measureNumber: {
		icon: Ta,
		category: "measure"
	},
	success: {
		icon: Hi,
		category: "state"
	},
	warning: {
		icon: Ui,
		category: "state"
	},
	error: {
		icon: Wi,
		category: "state"
	},
	info: {
		icon: Ja,
		category: "state"
	},
	loading: {
		icon: Ai,
		category: "state"
	},
	sparkles: {
		icon: Gi,
		category: "state"
	},
	chevronUp: {
		icon: Ii,
		category: "navigation"
	},
	chevronDown: {
		icon: Li,
		category: "navigation"
	},
	chevronLeft: {
		icon: Ri,
		category: "navigation"
	},
	chevronRight: {
		icon: zi,
		category: "navigation"
	},
	chevronUpDown: {
		icon: {
			width: 24,
			height: 24,
			body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m8 9l4-4l4 4m0 6l-4 4l-4-4\"/>"
		},
		category: "navigation"
	},
	arrowUp: {
		icon: va,
		category: "navigation"
	},
	arrowDown: {
		icon: _a,
		category: "navigation"
	},
	arrowRight: {
		icon: Qi,
		category: "navigation"
	},
	arrowPath: {
		icon: Ai,
		category: "navigation"
	}
}, J = { ...Ya }, Y = /* @__PURE__ */ new Map();
function Xa() {
	return J;
}
function X(e) {
	let t = Y.get(e);
	if (t) return t;
	let n = J[e];
	if (!n) return console.warn(`Icon "${e}" not found in registry, using fallback`), ({ className: e, ...t }) => /* @__PURE__ */ w(Ti, {
		icon: J.info.icon,
		className: e,
		...t
	});
	let r = ({ className: e, ...t }) => /* @__PURE__ */ w(Ti, {
		icon: n.icon,
		className: e,
		...t
	});
	return Y.set(e, r), r;
}
function Za(e) {
	return J[e]?.icon ?? J.info.icon;
}
function Qa(e, t) {
	J[e] && (J[e] = {
		...J[e],
		icon: t
	}, Y.delete(e));
}
function $a(e) {
	for (let [t, n] of Object.entries(e)) if (n && t in J) {
		let e = t;
		if ("body" in n) J[e] = {
			...J[e],
			icon: n
		};
		else {
			let t = n;
			J[e] = {
				...J[e],
				...t,
				icon: t.icon ?? J[e].icon
			};
		}
		Y.delete(e);
	}
}
function eo() {
	J = { ...Ya }, Y.clear();
}
function to(e) {
	let t = {};
	for (let [n, r] of Object.entries(J)) r.category === e && (t[n] = X(n));
	return t;
}
function no(e) {
	return X({
		count: "measureCount",
		countDistinct: "measureCountDistinct",
		countDistinctApprox: "measureCountDistinctApprox",
		sum: "measureSum",
		avg: "measureAvg",
		min: "measureMin",
		max: "measureMax",
		runningTotal: "measureRunningTotal",
		calculated: "measureCalculated",
		number: "measureNumber"
	}[e || ""] || "measureCount");
}
function ro(e) {
	let t = we(e)?.icon;
	return t ? typeof t == "string" ? X(t) : t : X("chartBar");
}
function io(e) {
	return X({
		measure: "measure",
		dimension: "dimension",
		timeDimension: "timeDimension",
		time: "timeDimension",
		segment: "segment"
	}[e] || "dimension");
}
//#endregion
//#region src/client/components/charts/MissingDependencyFallback.tsx
function ao({ chartType: e, packageName: t, installCommand: n, height: r = 200 }) {
	let { t: i } = s();
	return /* @__PURE__ */ T("div", {
		className: "dc-missing-dependency-fallback",
		style: {
			height: typeof r == "number" ? `${r}px` : r,
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "center",
			width: "100%",
			padding: "1.5rem",
			textAlign: "center",
			border: "1px dashed var(--dc-border, #e5e7eb)",
			borderRadius: "0.5rem",
			backgroundColor: "var(--dc-surface, #f9fafb)"
		},
		children: [
			/* @__PURE__ */ w("div", {
				style: {
					fontSize: "2.5rem",
					marginBottom: "1rem"
				},
				children: "📦"
			}),
			/* @__PURE__ */ w("h3", {
				style: {
					fontSize: "1.125rem",
					fontWeight: 600,
					marginBottom: "0.5rem",
					color: "var(--dc-text, #111827)"
				},
				children: i("chart.runtime.missingDep.title")
			}),
			/* @__PURE__ */ w("p", {
				style: {
					fontSize: "0.875rem",
					color: "var(--dc-text-secondary, #6b7280)",
					marginBottom: "1rem",
					maxWidth: "28rem"
				},
				children: i("chart.runtime.missingDep.description", {
					chartType: e,
					packageName: t
				})
			}),
			/* @__PURE__ */ T("div", {
				style: {
					backgroundColor: "var(--dc-surface-secondary, #f3f4f6)",
					borderRadius: "0.5rem",
					padding: "0.75rem 1rem",
					fontFamily: "monospace",
					fontSize: "0.875rem",
					color: "var(--dc-text, #111827)"
				},
				children: [/* @__PURE__ */ w("span", {
					style: {
						color: "var(--dc-text-muted, #9ca3af)",
						userSelect: "none"
					},
					children: "$ "
				}), n]
			}),
			/* @__PURE__ */ w("p", {
				style: {
					fontSize: "0.75rem",
					color: "var(--dc-text-muted, #9ca3af)",
					marginTop: "0.75rem"
				},
				children: i("chart.runtime.missingDep.restartHint")
			})
		]
	});
}
//#endregion
//#region src/client/charts/chartComponentRegistry.tsx
var oo = /* @__PURE__ */ new Map(), Z = /* @__PURE__ */ new Set(), so = /* @__PURE__ */ new Map();
function co(e) {
	let t = ({ height: t }) => {
		let { t: n } = s();
		return /* @__PURE__ */ T("div", {
			className: "dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full dc:gap-2",
			style: { height: typeof t == "number" ? `${t}px` : t || "200px" },
			children: [/* @__PURE__ */ w("div", {
				className: "dc:text-sm dc:font-semibold text-dc-text-muted",
				children: n("chart.runtime.unknownChartType")
			}), /* @__PURE__ */ T("div", {
				className: "dc:text-xs text-dc-text-muted",
				children: [
					"“",
					e,
					"” is not registered"
				]
			})]
		});
	};
	return t.displayName = `UnknownChart_${e}`, t;
}
function lo(e) {
	let t = we(e)?.dependencies, n = ({ height: n }) => /* @__PURE__ */ w(ao, {
		chartType: e,
		packageName: t?.packageName || "unknown",
		installCommand: t?.installCommand || "npm install [package-name]",
		height: n
	});
	return n.displayName = `${e}Fallback`, n;
}
function uo(e, t) {
	return async () => {
		try {
			return await t();
		} catch (t) {
			return console.warn(`[drizzle-cube] Failed to load ${e} chart:`, t instanceof Error ? t.message : t), Z.add(e), { default: lo(e) };
		}
	};
}
function fo(e, t, n, r) {
	if (oo.delete(e), Z.delete(e), n) {
		let t = r ? uo(e, n) : n;
		so.set(e, ye(t));
	} else if (t) {
		let n = t;
		so.set(e, ye(() => Promise.resolve({ default: n })));
	}
}
function po(e) {
	so.delete(e), oo.delete(e), Z.delete(e);
}
//#endregion
//#region src/client/providers/CubeMetaProvider.tsx
function mo({ children: e }) {
	let { meta: t, labelMap: n, isLoading: r, error: i, refetch: a, getFieldLabel: o } = dn(), s = i ? i instanceof Error ? i.message : String(i) : null, c = be(() => {
		a();
	}, [a]), l = be((e) => o(e), [o]), u = S(() => ({
		meta: t,
		labelMap: n,
		metaLoading: r,
		metaError: s,
		getFieldLabel: l,
		refetchMeta: c
	}), [
		t,
		n,
		r,
		s,
		l,
		c
	]);
	return /* @__PURE__ */ w(d.Provider, {
		value: u,
		children: e
	});
}
//#endregion
//#region src/client/components/charts/RecordsTable.config.ts
var ho = /* @__PURE__ */ t({ recordsTableConfig: () => go }), go = {
	dropZones: [{
		key: "columns",
		label: "chart.recordsTable.dropZone.columns.label",
		description: "chart.recordsTable.dropZone.columns.description",
		mandatory: !1,
		acceptTypes: [
			"dimension",
			"timeDimension",
			"measure"
		],
		emptyText: "chart.recordsTable.dropZone.columns.empty"
	}, {
		key: "hiddenColumns",
		label: "chart.recordsTable.dropZone.hiddenColumns.label",
		description: "chart.recordsTable.dropZone.hiddenColumns.description",
		mandatory: !1,
		acceptTypes: [
			"dimension",
			"timeDimension",
			"measure"
		],
		emptyText: "chart.recordsTable.dropZone.hiddenColumns.empty",
		excludeFromInference: !0
	}],
	displayOptions: ["hideHeader"],
	displayOptionsConfig: [
		{
			key: "columnFormats",
			label: "chart.recordsTable.option.columnFormats.label",
			type: "columnFormats",
			description: "chart.recordsTable.option.columnFormats.description"
		},
		{
			key: "rowLink",
			label: "chart.recordsTable.option.rowLink.label",
			type: "rowLink",
			description: "chart.recordsTable.option.rowLink.description"
		},
		{
			key: "pageSize",
			label: "chart.recordsTable.option.pageSize.label",
			type: "select",
			defaultValue: 25,
			description: "chart.recordsTable.option.pageSize.description",
			options: [
				{
					value: 25,
					label: "chart.recordsTable.option.pageSize.option.25"
				},
				{
					value: 50,
					label: "chart.recordsTable.option.pageSize.option.50"
				},
				{
					value: 100,
					label: "chart.recordsTable.option.pageSize.option.100"
				}
			]
		}
	],
	clickableElements: { row: !0 },
	recordGrain: !0
}, _o = /* @__PURE__ */ t({ retentionHeatmapConfig: () => vo }), vo = {
	dropZones: [],
	displayOptionsConfig: [{
		key: "showLegend",
		label: "chart.option.showLegend.label",
		type: "boolean",
		defaultValue: !0,
		description: "chart.configText.show_the_color_intensity_legend"
	}, {
		key: "showTooltip",
		label: "chart.option.showTooltip.label",
		type: "boolean",
		defaultValue: !0,
		description: "chart.option.showTooltip.description"
	}]
}, yo = /* @__PURE__ */ t({ retentionCombinedConfig: () => bo }), bo = {
	dropZones: [],
	displayOptionsConfig: [
		{
			key: "retentionDisplayMode",
			label: "chart.option.retentionDisplayMode.label",
			type: "select",
			defaultValue: "line",
			options: [
				{
					value: "line",
					label: "chart.option.retentionDisplayMode.lineChart"
				},
				{
					value: "heatmap",
					label: "chart.option.retentionDisplayMode.heatmapTable"
				},
				{
					value: "combined",
					label: "chart.option.retentionDisplayMode.combined"
				}
			],
			description: "chart.configText.choose_how_to_visualize_retention_data"
		},
		{
			key: "showLegend",
			label: "chart.option.showLegend.label",
			type: "boolean",
			defaultValue: !0,
			description: "chart.configText.show_the_legend_for_breakdown_segments"
		},
		{
			key: "showGrid",
			label: "chart.option.showGrid.label",
			type: "boolean",
			defaultValue: !0,
			description: "chart.option.showGrid.description"
		},
		{
			key: "showTooltip",
			label: "chart.option.showTooltip.label",
			type: "boolean",
			defaultValue: !0,
			description: "chart.option.showTooltip.description"
		}
	]
}, xo = /* @__PURE__ */ t({ dotStripChartConfig: () => So }), So = {
	displayOptions: [
		"showGrid",
		"showTooltip",
		"hideHeader"
	],
	dropZones: [
		{
			key: "xAxis",
			label: "chart.dotStrip.dropZone.xAxis.label",
			description: "chart.dotStrip.dropZone.xAxis.description",
			mandatory: !0,
			maxItems: 1,
			acceptTypes: ["dimension", "timeDimension"],
			emptyText: "chart.dotStrip.dropZone.xAxis.empty"
		},
		{
			key: "yAxis",
			label: "chart.dotStrip.dropZone.yAxis.label",
			description: "chart.dotStrip.dropZone.yAxis.description",
			mandatory: !0,
			maxItems: 1,
			acceptTypes: ["measure"],
			emptyText: "chart.dotStrip.dropZone.yAxis.empty"
		},
		{
			key: "series",
			label: "chart.dotStrip.dropZone.series.label",
			description: "chart.dotStrip.dropZone.series.description",
			mandatory: !1,
			maxItems: 1,
			acceptTypes: ["dimension"],
			emptyText: "chart.dotStrip.dropZone.series.empty"
		}
	],
	clickableElements: { point: !0 },
	displayOptionsConfig: [
		{
			key: "showMedianMarker",
			label: "chart.option.showMedianMarker.label",
			type: "boolean",
			defaultValue: !0,
			description: "chart.option.showMedianMarker.description"
		},
		{
			key: "showBandStats",
			label: "chart.option.showBandStats.label",
			type: "boolean",
			defaultValue: !0,
			description: "chart.option.showBandStats.description"
		},
		{
			key: "showExtremeLabels",
			label: "chart.option.showExtremeLabels.label",
			type: "boolean",
			defaultValue: !1,
			description: "chart.option.showExtremeLabels.description"
		},
		{
			key: "dotSize",
			label: "chart.option.dotSize.label",
			type: "select",
			defaultValue: "medium",
			options: [
				{
					value: "small",
					label: "chart.option.dotSize.small"
				},
				{
					value: "medium",
					label: "chart.option.dotSize.medium"
				},
				{
					value: "large",
					label: "chart.option.dotSize.large"
				}
			],
			description: "chart.option.dotSize.description"
		},
		{
			key: "bandSort",
			label: "chart.option.bandSort.label",
			type: "select",
			defaultValue: "none",
			options: [
				{
					value: "none",
					label: "chart.option.bandSort.none"
				},
				{
					value: "valueDesc",
					label: "chart.option.bandSort.valueDesc"
				},
				{
					value: "valueAsc",
					label: "chart.option.bandSort.valueAsc"
				},
				{
					value: "count",
					label: "chart.option.bandSort.count"
				}
			],
			description: "chart.option.bandSort.description"
		},
		{
			key: "xAxisFormat",
			label: "chart.option.xAxisFormat.label",
			type: "axisFormat",
			description: "chart.option.xAxisFormat.description"
		}
	]
}, Co = /* @__PURE__ */ t({ proportionBarChartConfig: () => wo }), wo = {
	dropZones: [{
		key: "xAxis",
		label: "chart.configText.category",
		description: "chart.configText.dimension_to_split_the_bar_into_segments",
		mandatory: !0,
		maxItems: 1,
		acceptTypes: ["dimension", "timeDimension"],
		emptyText: "chart.proportionBar.dropZone.xAxis.empty"
	}, {
		key: "yAxis",
		label: "chart.configText.value",
		description: "chart.configText.measure_that_determines_each_segments_share",
		mandatory: !0,
		maxItems: 1,
		acceptTypes: ["measure"],
		emptyText: "chart.proportionBar.dropZone.yAxis.empty"
	}],
	displayOptions: ["hideHeader"],
	displayOptionsConfig: [
		{
			key: "showLabels",
			label: "chart.option.proportionBarLabels.label",
			type: "boolean",
			defaultValue: !0,
			description: "chart.option.proportionBarLabels.description"
		},
		{
			key: "showPercentages",
			label: "chart.option.showPercentages.label",
			type: "boolean",
			defaultValue: !0,
			description: "chart.option.showPercentages.description"
		},
		{
			key: "sortSegments",
			label: "chart.option.sortSegments.label",
			type: "boolean",
			defaultValue: !1,
			description: "chart.option.sortSegments.description"
		},
		{
			key: "decimals",
			label: "chart.option.decimals.label",
			type: "number",
			defaultValue: 0,
			min: 0,
			max: 2,
			description: "chart.option.proportionBarDecimals.description"
		}
	],
	validate: (e) => !e?.xAxis || Array.isArray(e.xAxis) && e.xAxis.length === 0 ? {
		isValid: !1,
		message: "chart.proportionBar.validation.dimensionRequired"
	} : !e?.yAxis || Array.isArray(e.yAxis) && e.yAxis.length === 0 ? {
		isValid: !1,
		message: "chart.proportionBar.validation.measureRequired"
	} : { isValid: !0 }
}, To = {
	bar: f,
	line: p,
	area: n,
	pie: m,
	scatter: h,
	bubble: g,
	radar: _,
	radialBar: v,
	treemap: ee,
	table: y,
	recordsTable: go,
	activityGrid: te,
	kpiNumber: ne,
	kpiDelta: re,
	kpiText: ie,
	markdown: ae,
	funnel: oe,
	sankey: se,
	sunburst: ce,
	heatmap: le,
	retentionHeatmap: vo,
	retentionCombined: bo,
	boxPlot: ue,
	dotStrip: So,
	waterfall: de,
	candlestick: fe,
	measureProfile: pe,
	proportionBar: wo,
	gauge: me
}, Q = Object.fromEntries(Object.keys(D).map((e) => [e, Oe(D[e], To[e])]));
function Eo(e) {
	return Q[e]?.recordGrain === !0;
}
function Do(e, t) {
	Q[e] = t;
}
function Oo(e) {
	delete Q[e];
}
//#endregion
//#region src/client/charts/chartPlugin.ts
function ko(e, t) {
	return {
		label: t.label ?? e.label,
		icon: e.icon ?? "chartBar",
		description: t.description,
		useCase: t.useCase,
		isAvailable: t.isAvailable,
		dependencies: e.dependencies,
		config: async () => t
	};
}
var $ = new class {
	customCharts = /* @__PURE__ */ new Map();
	builtInBackups = /* @__PURE__ */ new Map();
	version = 0;
	listeners = /* @__PURE__ */ new Set();
	register(e) {
		let t = {
			...e.config,
			label: e.config.label || e.label
		};
		Q[e.type] && !this.builtInBackups.has(e.type) && !this.customCharts.has(e.type) && this.builtInBackups.set(e.type, Q[e.type]), this.customCharts.set(e.type, e), Te(e.type, ko(e, t)), Do(e.type, t), Le(e.type, t), fo(e.type, e.component, e.lazyComponent, e.dependencies), this.bump();
	}
	unregister(e) {
		if (!this.customCharts.has(e)) return;
		this.customCharts.delete(e), Ee(e);
		let t = this.builtInBackups.get(e);
		t ? (Do(e, t), Le(e, t), this.builtInBackups.delete(e)) : (Oo(e), Re(e)), po(e), this.bump();
	}
	getIcon(e) {
		let t = De(e)?.icon;
		return t && typeof t != "string" ? t : void 0;
	}
	getCustomTypes() {
		return Array.from(this.customCharts.keys());
	}
	isCustom(e) {
		return this.customCharts.has(e);
	}
	subscribe = (e) => (this.listeners.add(e), () => {
		this.listeners.delete(e);
	});
	getSnapshot = () => this.version;
	bump() {
		this.version++;
		for (let e of this.listeners) e();
	}
}(), Ao = { apiUrl: "/cubejs-api/v1" }, jo = 3;
function Mo(e) {
	let t = e?.status;
	return typeof t == "number" && t >= 400 && t < 500;
}
var No = () => new Bt({ defaultOptions: { queries: {
	staleTime: 3e5,
	gcTime: 9e5,
	retry: (e, t) => !Mo(t) && e < jo,
	refetchOnWindowFocus: !1
} } });
No();
function Po({ cubeApi: e, apiOptions: t, token: n, options: r, features: i, dashboardModes: a, enableBatching: o, batchDelayMs: s, queryClient: u, customCharts: d, locale: f, translations: p, debugI18n: m, children: h }) {
	x(() => {
		l(!!m);
	}, [m]);
	let [g] = C(() => No()), _ = u ?? g, v = Se([]);
	return x(() => {
		if (!d || d.length === 0) {
			for (let e of v.current) $.unregister(e);
			v.current = [];
			return;
		}
		let e = new Set(d.map((e) => e.type));
		for (let t of v.current) e.has(t) || $.unregister(t);
		for (let e of d) $.register(e);
		return v.current = d.map((e) => e.type), () => {
			for (let e of v.current) $.unregister(e);
			v.current = [];
		};
	}, [d]), /* @__PURE__ */ w(c, {
		locale: f,
		translations: p,
		children: /* @__PURE__ */ w(Ve, {
			client: _,
			children: /* @__PURE__ */ w(sn, {
				apiOptions: t || Ao,
				token: n,
				options: r,
				locale: f,
				enableBatching: o,
				batchDelayMs: s,
				children: /* @__PURE__ */ w(mo, { children: /* @__PURE__ */ w(Bn, {
					features: i,
					dashboardModes: a,
					children: h
				}) })
			})
		})
	});
}
function Fo() {
	let e = cn(), t = a(), n = Hn();
	return S(() => ({
		...e,
		...t,
		features: n.features,
		dashboardModes: n.dashboardModes
	}), [
		e,
		t,
		n
	]);
}
//#endregion
//#region src/client/utils/pivotUtils.ts
function Io(e) {
	if (!e) return [];
	let t = [];
	return e.dimensions && t.push(...e.dimensions), e.timeDimensions && e.timeDimensions.forEach((e) => {
		t.includes(e.dimension) || t.push(e.dimension);
	}), e.measures && t.push(...e.measures), t;
}
function Lo(e, t) {
	if (!e?.timeDimensions?.length) return null;
	let n = e.timeDimensions.find((e) => e.granularity);
	if (!n?.granularity || !e.measures?.length) return null;
	let r, i;
	if (t && t.length > 0) {
		r = t.filter((t) => !(t === n.dimension || e.measures?.includes(t)));
		let a = t.filter((t) => e.measures?.includes(t));
		i = a.length > 0 ? a : e.measures;
	} else r = e.dimensions || [], i = e.measures;
	return i.length === 0 ? null : {
		timeDimension: n.dimension,
		granularity: n.granularity,
		dimensions: r,
		measures: i
	};
}
function Ro(e, t, n) {
	let r = /* @__PURE__ */ new Set();
	return e.forEach((e) => {
		let i = e[t];
		if (i != null) {
			let e = o(i, n);
			r.add(e);
		}
	}), Array.from(r).sort();
}
function zo(e, t, n) {
	let r = [];
	return e.measures.length > 1 && r.push({
		key: "__measure__",
		label: "Measure",
		isTimeColumn: !1,
		isMeasureColumn: !0
	}), e.dimensions.forEach((e) => {
		r.push({
			key: e,
			label: n(e),
			isTimeColumn: !1
		});
	}), t.forEach((e) => {
		r.push({
			key: e,
			label: e,
			isTimeColumn: !0
		});
	}), r;
}
function Bo(e, t) {
	let n = /* @__PURE__ */ new Map();
	return e.forEach((e) => {
		let r = t.dimensions.length > 0 ? t.dimensions.map((t) => String(e[t] ?? "")).join("|") : "__all__";
		n.has(r) || n.set(r, /* @__PURE__ */ new Map());
		let i = e[t.timeDimension];
		if (i != null) {
			let a = o(i, t.granularity);
			n.get(r).set(a, e);
		}
	}), n;
}
function Vo(e, t, n, r) {
	let i = Bo(e, t), a = Array.from(i.keys()), o = [], s = t.measures.length, c = a.length;
	return t.measures.forEach((e) => {
		a.forEach((a, l) => {
			let u = i.get(a), d = s > 1 ? `${e}|${a}` : a, f = {}, p = a === "__all__" ? [] : a.split("|");
			t.dimensions.forEach((e, t) => {
				f[e] = p[t] ?? "";
			}), s > 1 && (f.__measure__ = r(e)), n.forEach((t) => {
				let n = u.get(t);
				f[t] = n?.[e] ?? null;
			});
			let m = l === 0;
			o.push({
				id: d,
				measureField: e,
				values: f,
				isFirstInGroup: m,
				dimensionRowSpan: m && s > 1 ? c : void 0
			});
		});
	}), o;
}
function Ho(e, t, n, r) {
	if (!e || e.length === 0) return {
		isPivoted: !0,
		columns: [],
		rows: []
	};
	let i = Ro(e, t.timeDimension, t.granularity);
	return {
		isPivoted: !0,
		columns: zo(t, i, n),
		rows: Vo(e, t, i, n)
	};
}
function Uo(e, t) {
	if (t?.cubes) for (let n of t.cubes) {
		let t = n.measures.find((t) => t.name === e);
		if (t) return t.type;
	}
}
//#endregion
//#region src/client/components/charts/DataTable.tsx
var Wo = /* @__PURE__ */ t({ default: () => Go }), Go = he.memo(function({ data: e, chartConfig: t, displayConfig: n = {}, queryObject: r, height: i = 300 }) {
	let { t: o } = s(), { getFieldLabel: c, meta: l } = a(), u = S(() => Lo(r, t?.xAxis), [r, t?.xAxis]), d = n?.pivotTimeDimension !== !1, f = S(() => !u || !d ? null : Ho(e, u, c, l), [
		e,
		u,
		d,
		c,
		l
	]);
	return !e || e.length === 0 ? /* @__PURE__ */ w("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full",
		style: { height: i },
		children: /* @__PURE__ */ T("div", {
			className: "dc:text-center text-dc-text-muted",
			children: [/* @__PURE__ */ w("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: o("chart.runtime.noData")
			}), /* @__PURE__ */ w("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: o("chart.runtime.noDataHint.table")
			})]
		})
	}) : f?.isPivoted && f.columns.length > 0 ? /* @__PURE__ */ w(Ko, {
		pivotedData: f,
		height: i,
		meta: l,
		leftYAxisFormat: n?.leftYAxisFormat
	}) : /* @__PURE__ */ w(Yo, {
		data: e,
		chartConfig: t,
		queryObject: r,
		height: i,
		getFieldLabel: c,
		leftYAxisFormat: n?.leftYAxisFormat
	});
});
function Ko({ pivotedData: e, height: t, meta: n, leftYAxisFormat: r }) {
	let { t: i } = s(), { columns: a, rows: o } = e;
	return a.length === 0 || o.length === 0 ? /* @__PURE__ */ w("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full",
		style: { height: t },
		children: /* @__PURE__ */ T("div", {
			className: "dc:text-center text-dc-text-muted",
			children: [/* @__PURE__ */ w("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: i("chart.runtime.noData")
			}), /* @__PURE__ */ w("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: i("chart.runtime.noDataHint.table")
			})]
		})
	}) : /* @__PURE__ */ w("div", {
		className: "dc:w-full dc:overflow-auto",
		style: { height: t },
		children: /* @__PURE__ */ T("table", {
			className: "dc:min-w-full dc:divide-y border-dc-border",
			children: [/* @__PURE__ */ w("thead", {
				className: "bg-dc-surface-secondary dc:sticky dc:top-0",
				children: /* @__PURE__ */ w("tr", { children: a.map((e) => /* @__PURE__ */ w("th", {
					className: `dc:px-3 dc:py-2 dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider dc:whitespace-nowrap ${e.isTimeColumn ? "dc:text-right" : "dc:text-left"}`,
					children: e.label
				}, e.key)) })
			}), /* @__PURE__ */ w("tbody", {
				className: "bg-dc-surface dc:divide-y border-dc-border",
				children: o.map((e) => /* @__PURE__ */ w(qo, {
					row: e,
					columns: a,
					meta: n,
					leftYAxisFormat: r
				}, e.id))
			})]
		})
	});
}
function qo({ row: e, columns: t, meta: n, leftYAxisFormat: r }) {
	let i = no(Uo(e.measureField, n));
	return /* @__PURE__ */ w("tr", {
		className: "hover:bg-dc-surface-secondary",
		children: t.map((t) => {
			let n = e.values[t.key];
			return t.isMeasureColumn ? e.isFirstInGroup === !1 ? null : /* @__PURE__ */ w("td", {
				className: "dc:px-3 dc:py-2 dc:whitespace-nowrap dc:text-sm text-dc-text dc:align-top",
				rowSpan: e.dimensionRowSpan,
				children: /* @__PURE__ */ T("div", {
					className: "dc:flex dc:items-center",
					children: [/* @__PURE__ */ w(i, { className: "dc:w-3.5 dc:h-3.5 dc:mr-1.5 text-dc-text-muted dc:shrink-0" }), /* @__PURE__ */ w("span", { children: n })]
				})
			}, t.key) : t.isTimeColumn ? /* @__PURE__ */ w("td", {
				className: "dc:px-3 dc:py-2 dc:whitespace-nowrap dc:text-sm dc:text-right text-dc-text",
				children: Jo(n, r)
			}, t.key) : /* @__PURE__ */ w("td", {
				className: "dc:px-3 dc:py-2 dc:whitespace-nowrap dc:text-sm text-dc-text",
				children: Jo(n)
			}, t.key);
		})
	});
}
function Jo(e, t) {
	return e == null ? "-" : typeof e == "number" ? t ? u(e, t) : Number.isInteger(e) ? e.toLocaleString() : parseFloat(e.toFixed(2)).toLocaleString() : typeof e == "boolean" ? e ? "Yes" : "No" : String(e);
}
function Yo({ data: e, chartConfig: t, queryObject: n, height: r, getFieldLabel: i, leftYAxisFormat: a }) {
	let { t: o } = s(), c = Object.keys(e[0] || {}), l = S(() => {
		if (t?.xAxis && t.xAxis.length > 0) return t.xAxis.filter((e) => c.includes(e));
		let e = Io(n);
		if (e.length > 0) {
			let t = e.filter((e) => c.includes(e)), n = c.filter((e) => !t.includes(e));
			return [...t, ...n];
		}
		return c;
	}, [
		t?.xAxis,
		n,
		c
	]);
	return l.length === 0 ? /* @__PURE__ */ w("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full",
		style: { height: r },
		children: /* @__PURE__ */ T("div", {
			className: "dc:text-center text-dc-text-muted",
			children: [/* @__PURE__ */ w("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: "No columns available"
			}), /* @__PURE__ */ w("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: o("chart.runtime.table.invalidStructure")
			})]
		})
	}) : /* @__PURE__ */ w("div", {
		className: "dc:w-full dc:overflow-auto",
		style: { height: r },
		children: /* @__PURE__ */ T("table", {
			className: "dc:min-w-full dc:divide-y border-dc-border",
			children: [/* @__PURE__ */ w("thead", {
				className: "bg-dc-surface-secondary dc:sticky dc:top-0",
				children: /* @__PURE__ */ w("tr", { children: l.map((e) => /* @__PURE__ */ w("th", {
					className: "dc:px-3 dc:py-2 dc:text-left dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider",
					children: i(e)
				}, e)) })
			}), /* @__PURE__ */ w("tbody", {
				className: "bg-dc-surface dc:divide-y border-dc-border",
				children: e.map((e, t) => /* @__PURE__ */ w("tr", {
					className: "hover:bg-dc-surface-secondary",
					children: l.map((t) => /* @__PURE__ */ w("td", {
						className: "dc:px-3 dc:py-2 dc:whitespace-nowrap dc:text-sm text-dc-text",
						children: Xo(e[t], a)
					}, t))
				}, t))
			})]
		})
	});
}
function Xo(e, t) {
	return e == null ? "" : typeof e == "number" ? t ? u(e, t) : e.toLocaleString() : typeof e == "boolean" ? e ? "Yes" : "No" : String(e);
}
//#endregion
export { It as $, Hn as A, cn as B, no as C, Ya as D, Qa as E, xn as F, Yt as G, en as H, vn as I, Kt as J, Zt as K, _n as L, Mn as M, Nn as N, Ja as O, gn as P, Ht as Q, hn as R, to as S, eo as T, rn as U, tn as V, $t as W, qt as X, Jt as Y, Gt as Z, ro as _, Lo as a, Qe as at, Za as b, Fo as c, Be as ct, Eo as d, Ae as dt, kt as et, oo as f, je as ft, Z as g, Me as gt, so as h, Pe as ht, Io as i, j as it, Ln as j, Ti as k, $ as l, Ie as lt, co as m, Ne as mt, Wo as n, F as nt, Ho as o, $e as ot, uo as p, Fe as pt, Xt as q, Uo as r, N as rt, Po as s, lt as st, Go as t, I as tt, Q as u, ke as ut, io as v, $a as w, Xa as x, X as y, dn as z };

//# sourceMappingURL=chart-data-table-Bn9EtETl.js.map