import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { F as t, S as n } from "./chart-activity-grid-D6X0iOUw.js";
import { A as ee, D as r, E as i, M as te, O as a, S as ne, _ as o, a as s, b as c, c as l, d as u, f as d, g as f, h as p, i as m, j as re, k as h, l as ie, m as g, o as _, p as v, r as y, u as b, v as x, x as S, y as ae } from "./chart-area-95fIdTeM.js";
import C, { useMemo as w, useState as T } from "react";
import { jsx as E, jsxs as D } from "react/jsx-runtime";
import { CartesianGrid as O, LineChart as k, XAxis as A } from "recharts";
//#region src/client/components/charts/LineChart.tsx
var j = /* @__PURE__ */ e({ default: () => M }), M = C.memo(function({ data: e, chartConfig: C, displayConfig: j = {}, queryObject: M, height: N = "100%", colorPalette: P, onDataPointClick: F, drillEnabled: I }) {
	let { t: L } = t(), [R, z] = T(null), B = n(), { xAxisField: oe, yAxisFields: V, seriesFields: H, errorCode: U } = w(() => i(C), [C]), W = w(() => C?.yAxisAssignment || {}, [C?.yAxisAssignment]), G = w(() => m(V, B), [V, B]);
	try {
		let t = {
			showLegend: j?.showLegend ?? !0,
			showGrid: j?.showGrid ?? !0,
			showTooltip: j?.showTooltip ?? !0,
			connectNulls: j?.connectNulls ?? !1
		}, n = j?.showAllXLabels ?? !1, i = j?.leftYAxisFormat, m = j?.rightYAxisFormat;
		if (!e || e.length === 0) return /* @__PURE__ */ E(a, {
			height: N,
			hint: L("chart.runtime.noDataHint.line")
		});
		if (U) return /* @__PURE__ */ E(r, {
			height: N,
			hint: L(`chart.runtime.configErrorHint.${U}`)
		});
		let h = oe, C = j?.priorPeriodStyle || "dashed", w = j?.priorPeriodOpacity ?? .5, { chartData: T, seriesKeys: K, effectiveXAxisKey: q, hasComparisonData: J, periodLabels: se } = s({
			data: e,
			xAxisField: h,
			yAxisFields: V,
			seriesFields: H,
			queryObject: M,
			getFieldLabel: B
		}), Y = d(G), X = g(V, W), { hasRightAxis: Z } = X, Q = j?.showSummary === !0 && K.length > 0, ce = Q ? _(T, K, P, ie(Y, W), J ? void 0 : q) : [], le = t.showLegend && !Q, ue = f(Z), { spreadTargets: de, enhancedChartData: $ } = ne(T, j?.target);
		return !T || T.length === 0 ? /* @__PURE__ */ E(a, {
			height: N,
			titleKey: "chart.runtime.noValidData",
			hint: "No valid data points for line chart after transformation"
		}) : /* @__PURE__ */ D("div", {
			className: "dc:relative dc:w-full dc:flex dc:flex-col",
			style: { height: N },
			children: [Q && /* @__PURE__ */ E(y, {
				summaries: ce,
				getSeriesLabel: (e) => e,
				valueFormat: i,
				rightValueFormat: m,
				showChange: l(M, h),
				leftOffset: p(Z)
			}), /* @__PURE__ */ E("div", {
				className: Q ? "dc:flex-1 dc:min-h-0" : "dc:contents",
				children: /* @__PURE__ */ E(te, {
					height: Q ? "100%" : N,
					minHeight: Q ? 0 : void 0,
					children: /* @__PURE__ */ D(k, {
						data: $,
						margin: ue,
						accessibilityLayer: !1,
						children: [
							t.showGrid && /* @__PURE__ */ E(O, {
								strokeDasharray: "3 3",
								style: { pointerEvents: "none" }
							}),
							/* @__PURE__ */ E(A, {
								dataKey: q,
								type: "category",
								tick: /* @__PURE__ */ E(ee, { tickFormatter: u(J, T, M, h) }),
								height: S($.map((e) => e?.[q])),
								interval: n ? 0 : void 0
							}),
							ae(X, B, i, m),
							t.showTooltip && /* @__PURE__ */ E(re, {
								formatter: o({
									leftYAxisFormat: i,
									rightYAxisFormat: m,
									yAxisAssignment: W,
									resolveField: Y
								}),
								labelFormatter: b(J, M, h)
							}),
							c({
								show: le,
								iconType: "line",
								paddingTop: 25,
								onHover: z,
								onLeave: () => z(null)
							}),
							v({
								seriesKeys: K,
								colorPalette: P,
								resolveField: Y,
								yAxisAssignment: W,
								hoveredLegend: R,
								connectNulls: t.connectNulls,
								showPoints: j?.showPoints ?? !0,
								drillEnabled: I,
								onDataPointClick: F,
								hasComparisonData: J,
								periodLabels: se,
								priorPeriodStyle: C,
								priorPeriodOpacity: w
							}),
							x(de)
						]
					})
				})
			})]
		});
	} catch (e) {
		return /* @__PURE__ */ E(h, {
			height: N,
			chartType: "Line Chart",
			error: e
		});
	}
});
//#endregion
export { j as n, M as t };

//# sourceMappingURL=chart-line-CbNgXN-R.js.map