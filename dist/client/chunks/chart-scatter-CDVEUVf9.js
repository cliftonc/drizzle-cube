import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { A as t, D as n, E as r, F as i, S as a, k as o, l as s, s as c, w as l } from "./chart-activity-grid-D6X0iOUw.js";
import { D as u, M as d, O as f, k as p } from "./chart-area-95fIdTeM.js";
import m, { useState as h } from "react";
import { Fragment as g, jsx as _, jsxs as v } from "react/jsx-runtime";
import { CartesianGrid as y, Legend as b, Scatter as x, ScatterChart as S, Tooltip as C, XAxis as w, YAxis as T } from "recharts";
//#region src/client/components/charts/ScatterChart.helpers.ts
var E = 20;
function D(e, t) {
	let n = e?.showLegend ?? !0, r = t.length > 1 && t.length <= E;
	return {
		showLegend: n && r,
		showGrid: e?.showGrid ?? !0,
		showTooltip: e?.showTooltip ?? !0,
		hasSeries: r,
		xAxisFormat: e?.xAxisFormat,
		yAxisFormat: e?.leftYAxisFormat,
		chartMargins: {
			...s,
			left: 40
		}
	};
}
function O(e) {
	let t, n, r = [];
	if (e?.xAxis && e?.yAxis) {
		t = Array.isArray(e.xAxis) ? e.xAxis[0] : e.xAxis, n = Array.isArray(e.yAxis) ? e.yAxis[0] : e.yAxis;
		let i = e.series;
		r = i ? Array.isArray(i) ? i : [i] : [];
	} else if (e?.x && e?.y) t = e.x, n = Array.isArray(e.y) ? e.y[0] : e.y;
	else return {
		xAxisField: "",
		yAxisField: "",
		seriesFields: [],
		errorCode: "axisInvalid"
	};
	return !t || !n ? {
		xAxisField: "",
		yAxisField: "",
		seriesFields: [],
		errorCode: "axisFields"
	} : {
		xAxisField: t,
		yAxisField: n,
		seriesFields: r
	};
}
function k(e, t, i) {
	let a = {};
	return t.forEach((t) => {
		if (e[t]) {
			let o = n(i, t);
			a[t] = r(e[t], o);
		}
	}), a;
}
function A(e, t, n) {
	let i = r(e[t], n) || e[t];
	return typeof i == "string" ? parseFloat(i) : i;
}
function j(e, r, i, a, s, c) {
	let l = n(c, r);
	if (a.length > 0) {
		let n = a[0], u = {};
		return e.forEach((e) => {
			let a = String(e[n] || "Default");
			u[a] || (u[a] = []);
			let d = A(e, r, l), f = t(e[i]);
			o(d) && f !== null && u[a].push({
				x: d,
				y: f,
				name: a,
				timeValues: k(e, s, c),
				originalItem: e
			});
		}), {
			scatterData: Object.keys(u).flatMap((e) => u[e]),
			seriesGroups: u
		};
	}
	return {
		scatterData: e.map((e) => {
			let n = A(e, r, l), a = t(e[i]);
			return {
				x: n,
				y: a,
				name: "Point",
				timeValues: k(e, s, c),
				originalItem: e,
				isValid: o(n) && a !== null
			};
		}).filter((e) => e.isValid).map(({ isValid: e, ...t }) => t),
		seriesGroups: {}
	};
}
//#endregion
//#region src/client/components/charts/ScatterTooltip.tsx
function M({ active: e, payload: t, xAxisField: n, yAxisField: r, xAxisFormat: i, yAxisFormat: a, getFieldLabel: o }) {
	if (!e || !t || t.length === 0) return null;
	let s = t[0]?.payload;
	return s ? /* @__PURE__ */ v("div", {
		style: {
			backgroundColor: "white",
			border: "1px solid #e5e7eb",
			borderRadius: "0.5rem",
			fontSize: "0.875rem",
			color: "#1f2937",
			boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
			padding: "8px 12px"
		},
		children: [
			/* @__PURE__ */ _("div", {
				style: {
					fontWeight: 600,
					marginBottom: "4px"
				},
				children: s.name
			}),
			s.timeValues && Object.keys(s.timeValues).length > 0 && /* @__PURE__ */ _("div", {
				style: {
					marginBottom: "4px",
					color: "#6b7280"
				},
				children: Object.entries(s.timeValues).map(([e, t]) => /* @__PURE__ */ v("div", { children: [
					o(e),
					": ",
					t
				] }, e))
			}),
			/* @__PURE__ */ v("div", { children: [
				i?.label || o(n),
				": ",
				l(s.x, i)
			] }),
			/* @__PURE__ */ v("div", { children: [
				a?.label || o(r),
				": ",
				l(s.y, a)
			] })
		]
	}) : null;
}
//#endregion
//#region src/client/components/charts/ScatterSeries.tsx
function N(e, t) {
	return e?.colors && e.colors[t % e.colors.length] || c[t % c.length];
}
function P({ hasSeries: e, seriesKeys: t, seriesGroups: n, scatterData: r, colorPalette: i, hoveredLegend: a }) {
	return e ? /* @__PURE__ */ _(g, { children: t.map((e, t) => /* @__PURE__ */ _(x, {
		name: e,
		data: n[e],
		fill: N(i, t),
		fillOpacity: a ? a === e ? 1 : .3 : 1
	}, e)) }) : /* @__PURE__ */ _(x, {
		name: "Data",
		data: r,
		fill: i?.colors && i.colors[0] || c[0]
	});
}
//#endregion
//#region src/client/components/charts/ScatterChart.tsx
var F = /* @__PURE__ */ e({ default: () => I }), I = m.memo(function({ data: e, chartConfig: t, displayConfig: n = {}, queryObject: r, height: o = "100%", colorPalette: s }) {
	let { t: c } = i(), [m, g] = h(null), x = a();
	try {
		if (!e || e.length === 0) return /* @__PURE__ */ _(f, {
			height: o,
			hint: c("chart.runtime.noDataHint.scatter")
		});
		let { xAxisField: i, yAxisField: a, seriesFields: p, errorCode: h } = O(t);
		if (h) return /* @__PURE__ */ _(u, {
			height: o,
			hint: c(`chart.runtime.configErrorHint.${h}`)
		});
		let { scatterData: E, seriesGroups: k } = j(e, i, a, p, (r?.timeDimensions || []).map((e) => e.dimension), r);
		if (!E || E.length === 0) return /* @__PURE__ */ _(f, {
			height: o,
			titleKey: "chart.runtime.noValidData",
			hint: "No valid data points for scatter chart after transformation"
		});
		let A = Object.keys(k), { showLegend: N, showGrid: F, showTooltip: I, hasSeries: L, xAxisFormat: R, yAxisFormat: z, chartMargins: B } = D(n, A);
		return /* @__PURE__ */ _(d, {
			height: o,
			children: /* @__PURE__ */ v(S, {
				margin: B,
				accessibilityLayer: !1,
				children: [
					F && /* @__PURE__ */ _(y, { strokeDasharray: "3 3" }),
					/* @__PURE__ */ _(w, {
						type: "number",
						dataKey: "x",
						name: R?.label || x(i),
						tick: { fontSize: 12 },
						tickFormatter: R ? (e) => l(e, R) : void 0
					}),
					/* @__PURE__ */ _(T, {
						type: "number",
						dataKey: "y",
						name: z?.label || x(a),
						tick: { fontSize: 12 },
						tickFormatter: z ? (e) => l(e, z) : void 0,
						label: {
							value: z?.label || x(a),
							angle: -90,
							position: "left",
							style: {
								textAnchor: "middle",
								fontSize: "12px"
							}
						}
					}),
					I && /* @__PURE__ */ _(C, {
						cursor: { strokeDasharray: "3 3" },
						content: ({ active: e, payload: t }) => /* @__PURE__ */ _(M, {
							active: e,
							payload: t,
							xAxisField: i,
							yAxisField: a,
							xAxisFormat: R,
							yAxisFormat: z,
							getFieldLabel: x
						})
					}),
					N && /* @__PURE__ */ _(b, {
						wrapperStyle: {
							fontSize: "12px",
							paddingTop: "10px"
						},
						iconType: "circle",
						iconSize: 8,
						layout: "horizontal",
						align: "center",
						verticalAlign: "bottom",
						onMouseEnter: (e) => g(String(e.dataKey || "")),
						onMouseLeave: () => g(null)
					}),
					/* @__PURE__ */ _(P, {
						hasSeries: L,
						seriesKeys: A,
						seriesGroups: k,
						scatterData: E,
						colorPalette: s,
						hoveredLegend: m
					})
				]
			})
		});
	} catch (e) {
		return /* @__PURE__ */ _(p, {
			height: o,
			chartType: "Scatter Chart",
			error: e
		});
	}
});
//#endregion
export { F as n, I as t };

//# sourceMappingURL=chart-scatter-CDVEUVf9.js.map