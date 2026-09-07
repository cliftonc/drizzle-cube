import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { D as t, E as n, F as r, M as i, S as a, s as o, w as s } from "./chart-activity-grid-D6X0iOUw.js";
import { D as c, E as l, M as u, O as d, j as f, k as p } from "./chart-area-95fIdTeM.js";
import m, { useMemo as h, useState as g } from "react";
import { jsx as _, jsxs as v } from "react/jsx-runtime";
import { Cell as y, Legend as b, Pie as x, PieChart as S } from "recharts";
//#region src/client/components/charts/PieChart.tsx
var C = /* @__PURE__ */ e({ default: () => T });
function w(e, r, a, o, s, c) {
	let l;
	if (o.length > 0) {
		let { data: t } = i(e, r, a, s, o, c);
		if (l = [], t.length > 0) {
			let e = t[0];
			Object.keys(e).forEach((t) => {
				t !== "name" && typeof e[t] == "number" && l.push({
					name: String(t),
					value: e[t]
				});
			});
		}
	} else {
		let i = t(s, r);
		l = e.map((e) => {
			let t = n(e[r], i) || String(e[r]) || "Unknown";
			return typeof e[r] == "boolean" ? t = e[r] ? "Active" : "Inactive" : (t === "true" || t === "false") && (t = t === "true" ? "Active" : "Inactive"), {
				name: t,
				value: typeof e[a[0]] == "string" ? parseFloat(e[a[0]]) : e[a[0]] || 0
			};
		});
	}
	let u = l.length;
	return l = l.filter((e) => e.value != null && !isNaN(e.value) && e.value !== 0 && e.value > 0), {
		pieData: l,
		originalLength: u
	};
}
var T = m.memo(function({ data: e, chartConfig: t, displayConfig: n = {}, queryObject: i, height: m = "100%", colorPalette: C, onDataPointClick: T, drillEnabled: E }) {
	let { t: D } = r(), [O, k] = g(null), A = a(), { xAxisField: j, yAxisFields: M, seriesFields: N, errorCode: P } = h(() => l(t), [t]);
	try {
		let t = {
			showLegend: n?.showLegend ?? !0,
			showTooltip: n?.showTooltip ?? !0,
			leftYAxisFormat: n?.leftYAxisFormat,
			innerRadius: n?.innerRadius || "0%"
		};
		if (!e || e.length === 0) return /* @__PURE__ */ _(d, {
			height: m,
			hint: D("chart.runtime.noDataHint.pie")
		});
		if (P) return /* @__PURE__ */ _(c, {
			height: m,
			hint: D(P === "axisInvalid" ? "chart.runtime.configErrorHint.pieAxis" : "chart.runtime.configErrorHint.axisFields")
		});
		let { pieData: r, originalLength: a } = w(e, j, M, N, i, A);
		return r.length === 0 ? /* @__PURE__ */ _(d, {
			height: m,
			titleKey: "chart.runtime.noValidData",
			hint: a > 0 ? `Filtered out ${a} data points (zero or invalid values)` : "No data points to display in pie chart"
		}) : /* @__PURE__ */ _(u, {
			height: m,
			children: /* @__PURE__ */ v(S, {
				accessibilityLayer: !1,
				children: [
					/* @__PURE__ */ _(x, {
						data: r,
						cx: "50%",
						cy: "50%",
						innerRadius: t.innerRadius === "0%" ? void 0 : t.innerRadius,
						outerRadius: "70%",
						dataKey: "value",
						label: t.showLegend ? void 0 : ({ name: e, percent: t }) => `${e} ${((t || 0) * 100).toFixed(0)}%`,
						cursor: E ? "pointer" : void 0,
						onClick: (e, t, n) => {
							T && E && e && T({
								dataPoint: e,
								clickedField: M[0],
								xValue: e.name,
								position: {
									x: n.clientX,
									y: n.clientY
								},
								nativeEvent: n
							});
						},
						children: r.map((e, t) => /* @__PURE__ */ _(y, {
							fill: C?.colors && C.colors[t % C.colors.length] || o[t % o.length],
							fillOpacity: O ? O === r[t].name ? 1 : .3 : 1
						}, `cell-${t}`))
					}),
					t.showTooltip && /* @__PURE__ */ _(f, { formatter: t.leftYAxisFormat ? (e, n) => [s(e, t.leftYAxisFormat), n] : void 0 }),
					t.showLegend && /* @__PURE__ */ _(b, {
						wrapperStyle: {
							fontSize: "12px",
							paddingTop: "10px"
						},
						iconType: "circle",
						iconSize: 8,
						layout: "horizontal",
						align: "center",
						verticalAlign: "bottom",
						onMouseEnter: (e) => k(String(e.value || "")),
						onMouseLeave: () => k(null)
					})
				]
			})
		});
	} catch (e) {
		return /* @__PURE__ */ _(p, {
			height: m,
			chartType: "Pie Chart",
			error: e
		});
	}
});
//#endregion
export { C as n, T as t };

//# sourceMappingURL=chart-pie-CIRsSq2M.js.map