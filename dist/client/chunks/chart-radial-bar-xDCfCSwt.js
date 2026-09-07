import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { D as t, E as n, F as r, s as i, w as a } from "./chart-activity-grid-D6X0iOUw.js";
import { D as o, M as s, O as c, j as l, k as u } from "./chart-area-95fIdTeM.js";
import d, { useState as f } from "react";
import { jsx as p, jsxs as m } from "react/jsx-runtime";
import { Cell as h, Legend as g, RadialBar as _, RadialBarChart as v } from "recharts";
//#region src/client/components/charts/radialBarChartHelpers.ts
function y(e, t) {
	let n = e?.colors;
	return n && n[t % n.length] || i[t % i.length];
}
function b(e) {
	return typeof e == "string" ? parseFloat(e) : e || 0;
}
function x(e, r, i, a) {
	let o = Array.isArray(r.xAxis) ? r.xAxis[0] : r.xAxis, s = Array.isArray(r.yAxis) ? r.yAxis[0] : r.yAxis, c = t(i, o);
	return { radialData: e.map((e, t) => ({
		name: n(e[o], c) || String(e[o]) || "Unknown",
		value: b(e[s]),
		fill: y(a, t)
	})) };
}
function S(e) {
	return typeof e == "boolean" ? e ? "Active" : "Inactive" : e === "true" || e === "false" ? e === "true" ? "Active" : "Inactive" : String(e);
}
function C(e, t) {
	let n = e[0], r = Object.keys(n), i = r.find((e) => typeof n[e] == "string" || e.toLowerCase().includes("name") || e.toLowerCase().includes("label") || e.toLowerCase().includes("category")) || r[0], a = r.find((e) => typeof n[e] == "number" && e !== i) || r[1];
	return a ? { radialData: e.map((e, n) => ({
		name: S(e[i]),
		value: b(e[a]),
		fill: y(t, n)
	})) } : {
		radialData: [],
		noValueField: !0
	};
}
function w(e, t, n, r) {
	let i = t?.xAxis && t?.yAxis ? x(e, t, n, r) : C(e, r);
	return i.noValueField ? i : { radialData: i.radialData.filter((e) => e.value != null && e.value !== 0) };
}
//#endregion
//#region src/client/components/charts/RadialBarChart.tsx
var T = /* @__PURE__ */ e({ default: () => E }), E = d.memo(function({ data: e, chartConfig: t, displayConfig: n = {}, queryObject: i, height: d = "100%", colorPalette: y }) {
	let { t: b } = r(), [x, S] = f(null);
	try {
		let r = {
			showLegend: n?.showLegend ?? !0,
			showTooltip: n?.showTooltip ?? !0,
			leftYAxisFormat: n?.leftYAxisFormat
		};
		if (!e || e.length === 0) return /* @__PURE__ */ p(c, {
			height: d,
			hint: b("chart.runtime.noDataHint.radialBar")
		});
		let { radialData: u, noValueField: f } = w(e, t, i, y);
		if (f) return /* @__PURE__ */ p(o, {
			height: d,
			hint: b("chart.runtime.configErrorHint.radialBarNumeric")
		});
		if (u.length === 0) return /* @__PURE__ */ p(c, {
			height: d,
			titleKey: "chart.runtime.noValidData",
			hint: "No valid data points for radial bar chart after transformation"
		});
		let { leftYAxisFormat: C } = r;
		return /* @__PURE__ */ p(s, {
			height: d,
			children: /* @__PURE__ */ m(v, {
				data: u,
				innerRadius: "10%",
				outerRadius: "80%",
				margin: {
					top: 20,
					right: 30,
					bottom: 20,
					left: 30
				},
				accessibilityLayer: !1,
				children: [
					r.showTooltip && /* @__PURE__ */ p(l, { formatter: C ? (e, t) => [a(e, C), t] : void 0 }),
					r.showLegend && /* @__PURE__ */ p(g, {
						wrapperStyle: {
							fontSize: "12px",
							paddingTop: "10px"
						},
						iconType: "circle",
						iconSize: 8,
						layout: "horizontal",
						align: "center",
						verticalAlign: "bottom",
						onMouseEnter: (e) => S(String(e.value || "")),
						onMouseLeave: () => S(null)
					}),
					/* @__PURE__ */ p(_, {
						dataKey: "value",
						cornerRadius: 4,
						label: {
							position: "insideStart",
							fill: "#fff",
							fontSize: 12,
							formatter: C ? (e) => a(e, C) : void 0
						},
						children: u.map((e, t) => /* @__PURE__ */ p(h, {
							fill: e.fill,
							fillOpacity: x ? x === e.name ? 1 : .3 : 1
						}, `cell-${t}`))
					})
				]
			})
		});
	} catch (e) {
		return /* @__PURE__ */ p(u, {
			height: d,
			chartType: "Radial Bar Chart",
			error: e
		});
	}
});
//#endregion
export { T as n, E as t };

//# sourceMappingURL=chart-radial-bar-xDCfCSwt.js.map