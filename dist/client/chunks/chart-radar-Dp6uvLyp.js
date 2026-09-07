import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { D as t, E as n, F as r, M as i, s as a, w as o } from "./chart-activity-grid-D6X0iOUw.js";
import { D as s, M as c, O as l, j as u, k as d } from "./chart-area-95fIdTeM.js";
import f, { useState as p } from "react";
import { jsx as m, jsxs as h } from "react/jsx-runtime";
import { Legend as g, PolarAngleAxis as _, PolarGrid as v, PolarRadiusAxis as y, Radar as b, RadarChart as x } from "recharts";
//#region src/client/components/charts/radarChartHelpers.ts
function S(e, t, n) {
	let { data: r, seriesKeys: a } = i(e, Array.isArray(t.xAxis) ? t.xAxis[0] : t.xAxis, Array.isArray(t.yAxis) ? t.yAxis : [t.yAxis], n, t.series || []);
	return {
		radarData: r,
		seriesKeys: a
	};
}
function C(e) {
	return typeof e == "string" ? parseFloat(e) : e || 0;
}
function w(e, r) {
	let i = e[0], a = Object.keys(i), o = a.find((e) => typeof i[e] == "string" || e.toLowerCase().includes("subject") || e.toLowerCase().includes("name") || e.toLowerCase().includes("category")) || a[0], s = a.filter((e) => typeof i[e] == "number" && e !== o);
	if (s.length === 0) return {
		radarData: [],
		seriesKeys: [],
		noNumericFields: !0
	};
	if (o) {
		let i = t(r, o);
		return {
			radarData: e.map((e) => {
				let t = { name: n(e[o], i) || String(e[o]) || "Unknown" };
				return s.forEach((n) => {
					let r = n.split(".").pop() || n;
					t[r] = C(e[n]);
				}), t;
			}),
			seriesKeys: s.map((e) => e.split(".").pop() || e)
		};
	}
	return {
		radarData: e.map((e) => ({
			name: String(e[a[0]] || "Unknown"),
			value: C(e[s[0]])
		})),
		seriesKeys: ["value"]
	};
}
function T(e, t, n) {
	return t?.xAxis && t?.yAxis ? S(e, t, n) : w(e, n);
}
//#endregion
//#region src/client/components/charts/RadarChart.tsx
var E = /* @__PURE__ */ e({ default: () => D }), D = f.memo(function({ data: e, chartConfig: t, displayConfig: n = {}, queryObject: i, height: f = "100%", colorPalette: S }) {
	let { t: C } = r(), [w, E] = p(null);
	try {
		let r = {
			showLegend: n?.showLegend ?? !0,
			showTooltip: n?.showTooltip ?? !0,
			showGrid: n?.showGrid ?? !0,
			leftYAxisFormat: n?.leftYAxisFormat
		};
		if (!e || e.length === 0) return /* @__PURE__ */ m(l, {
			height: f,
			hint: C("chart.runtime.noDataHint.radar")
		});
		let { radarData: d, seriesKeys: p, noNumericFields: D } = T(e, t, i);
		if (D) return /* @__PURE__ */ m(s, {
			height: f,
			hint: C("chart.runtime.configErrorHint.radarNumeric")
		});
		if (!d || d.length === 0) return /* @__PURE__ */ m(l, {
			height: f,
			titleKey: "chart.runtime.noValidData",
			hint: "No valid data points for radar chart after transformation"
		});
		let { leftYAxisFormat: O } = r;
		return /* @__PURE__ */ m(c, {
			height: f,
			children: /* @__PURE__ */ h(x, {
				data: d,
				margin: {
					top: 20,
					right: 80,
					bottom: 20,
					left: 80
				},
				accessibilityLayer: !1,
				children: [
					r.showGrid && /* @__PURE__ */ m(v, {}),
					/* @__PURE__ */ m(_, {
						dataKey: "name",
						tick: { fontSize: 12 },
						className: "text-dc-text-muted"
					}),
					/* @__PURE__ */ m(y, {
						tick: { fontSize: 10 },
						className: "text-dc-text-muted",
						tickFormatter: O ? (e) => o(e, O) : void 0
					}),
					r.showTooltip && /* @__PURE__ */ m(u, { formatter: O ? (e, t) => [o(e, O), t] : void 0 }),
					r.showLegend && p.length > 1 && /* @__PURE__ */ m(g, {
						wrapperStyle: {
							fontSize: "12px",
							paddingTop: "10px"
						},
						iconType: "rect",
						iconSize: 8,
						layout: "horizontal",
						align: "center",
						verticalAlign: "bottom",
						onMouseEnter: (e) => E(String(e.dataKey || "")),
						onMouseLeave: () => E(null)
					}),
					p.map((e, t) => {
						let n = S?.colors && S.colors[t % S.colors.length] || a[t % a.length];
						return /* @__PURE__ */ m(b, {
							name: e,
							dataKey: e,
							stroke: n,
							fill: n,
							fillOpacity: w ? w === e ? .6 : .1 : .3,
							strokeOpacity: w ? w === e ? 1 : .3 : 1,
							strokeWidth: 2
						}, e);
					})
				]
			})
		});
	} catch (e) {
		return /* @__PURE__ */ m(d, {
			height: f,
			chartType: "Radar Chart",
			error: e
		});
	}
});
//#endregion
export { E as n, D as t };

//# sourceMappingURL=chart-radar-Dp6uvLyp.js.map