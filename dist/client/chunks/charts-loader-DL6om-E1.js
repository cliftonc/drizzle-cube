import { f as e, g as t, h as n, m as r, p as i } from "./chart-data-table-Bn9EtETl.js";
import { Suspense as a, lazy as o } from "react";
import { jsx as s } from "react/jsx-runtime";
//#region src/client/charts/ChartLoader.tsx
var c = {
	bar: () => import("./chart-bar-XCPUApJ9.js").then((e) => e.n),
	line: () => import("./chart-line-CbNgXN-R.js").then((e) => e.n),
	area: () => import("./chart-area-95fIdTeM.js").then((e) => e.n),
	pie: () => import("./chart-pie-CIRsSq2M.js").then((e) => e.n),
	scatter: () => import("./chart-scatter-CDVEUVf9.js").then((e) => e.n),
	radar: () => import("./chart-radar-Dp6uvLyp.js").then((e) => e.n),
	radialBar: () => import("./chart-radial-bar-xDCfCSwt.js").then((e) => e.n),
	treemap: () => import("./chart-tree-map-kGDNnOsu.js").then((e) => e.n),
	bubble: () => import("./chart-bubble-BrB4XrSS.js").then((e) => e.t),
	table: () => import("./chart-data-table-Bn9EtETl.js").then((e) => e.n),
	recordsTable: () => import("./RecordsTable-DRmTjRzq.js"),
	activityGrid: () => import("./chart-activity-grid-D6X0iOUw.js").then((e) => e.t),
	kpiNumber: () => import("./chart-kpi-number-C9o880lP.js").then((e) => e.t),
	kpiDelta: () => import("./chart-kpi-delta-D9xqKbwp.js").then((e) => e.t),
	kpiText: () => import("./chart-kpi-text-agNEqDtQ.js").then((e) => e.t),
	markdown: () => import("./chart-markdown-CRjxC5D7.js").then((e) => e.n),
	funnel: () => import("./chart-funnel-BwJxhDFk.js").then((e) => e.n),
	sankey: () => import("./chart-sankey-DDzokqvF.js").then((e) => e.t),
	sunburst: () => import("./chart-sunburst-HwZSvUOV.js").then((e) => e.t),
	heatmap: () => import("./chart-heat-map-Dq68agx8.js").then((e) => e.t),
	retentionHeatmap: () => import("./RetentionHeatmap-Cd9L2Epc.js"),
	retentionCombined: () => import("./RetentionCombinedChart-DW8tA-BO.js"),
	boxPlot: () => import("./chart-box-plot-iAj3PdWT.js").then((e) => e.t),
	dotStrip: () => import("./DotStripChart-CP_x2qvn.js"),
	waterfall: () => import("./chart-waterfall-DvUZsKDT.js").then((e) => e.t),
	candlestick: () => import("./chart-candlestick-Dj4L6c1I.js").then((e) => e.t),
	measureProfile: () => import("./chart-measure-profile-Bvg2rrkd.js").then((e) => e.t),
	proportionBar: () => import("./ProportionBarChart-DYkOBCl2.js"),
	gauge: () => import("./chart-gauge-nWTc1m7n.js").then((e) => e.t)
};
function l(t) {
	let a = n.get(t);
	if (a) return a;
	if (e.has(t)) return e.get(t);
	let s = c[t];
	if (s) {
		let n = i(t, s);
		return e.set(t, o(n)), e.get(t);
	}
	return o(() => Promise.resolve({ default: r(t) }));
}
function u(e) {
	return e in c || n.has(e);
}
function d({ height: e }) {
	return /* @__PURE__ */ s("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full",
		style: { height: typeof e == "number" ? `${e}px` : e || "200px" },
		children: /* @__PURE__ */ s("div", { className: "dc:animate-pulse bg-dc-surface-secondary dc:rounded-sm dc:w-full dc:h-full dc:min-h-[100px]" })
	});
}
function f({ chartType: e, fallback: t, height: n, ...r }) {
	let i = l(e);
	return /* @__PURE__ */ s(a, {
		fallback: t ?? /* @__PURE__ */ s(d, { height: n }),
		children: /* @__PURE__ */ s(i, {
			height: n,
			...r
		})
	});
}
function p(e) {
	let t = c[e];
	t && t();
}
function m(e) {
	e.forEach(p);
}
function h() {
	let e = Object.keys(c), t = Array.from(n.keys());
	return [.../* @__PURE__ */ new Set([...e, ...t])];
}
function g(e) {
	return !t.has(e);
}
function _() {
	return Array.from(t);
}
//#endregion
export { u as a, g as i, h as n, p as o, _ as r, m as s, f as t };

//# sourceMappingURL=charts-loader-DL6om-E1.js.map