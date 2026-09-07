import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { F as t, M as n, S as r, d as i, k as a, s as o } from "./chart-activity-grid-D6X0iOUw.js";
import { A as s, D as c, E as l, M as u, O as d, S as f, _ as p, b as m, g as h, j as g, k as _, m as v, v as ee, x as te, y as ne } from "./chart-area-95fIdTeM.js";
import y, { useMemo as b, useState as x } from "react";
import { jsx as S, jsxs as C } from "react/jsx-runtime";
import { Bar as w, CartesianGrid as T, Cell as E, ComposedChart as D, XAxis as re } from "recharts";
//#region src/client/components/charts/BarChart.helpers.ts
function ie(e) {
	let t = e?.stackType ?? (e?.stacked ? "normal" : "none");
	return {
		shouldStack: t !== "none",
		isPercentStack: t === "percent"
	};
}
function O(e, t) {
	if (e.length === 0 || t.length === 0) return {
		chartData: [],
		skippedCount: 0
	};
	let n = e.filter((e) => t.some((t) => a(e[t])));
	return {
		chartData: n,
		skippedCount: e.length - n.length
	};
}
function k(e, t, n) {
	let r = e.length === 1 && t.some((t) => {
		let n = t[e[0]];
		return typeof n == "number" && n < 0;
	});
	return {
		usePositiveNegativeColoring: r,
		useColorByCategory: e.length === 1 && !r && !n && t.length > 1
	};
}
//#endregion
//#region src/client/components/charts/BarSeries.tsx
function A(e, t) {
	return e ? e === t ? 1 : .3 : 1;
}
function j({ seriesKey: e, index: t, originalField: n, axisId: r, stackId: a, chartData: s, enhancedChartData: c, colorPalette: l, hoveredLegend: u, usePositiveNegativeColoring: d, useColorByCategory: f, drillEnabled: p, onDataPointClick: m }) {
	let h = d ? i : l?.colors && l.colors[t % l.colors.length] || o[t % o.length];
	return /* @__PURE__ */ C(w, {
		dataKey: e,
		yAxisId: r,
		stackId: a,
		radius: a ? void 0 : [
			2,
			2,
			0,
			0
		],
		fill: h,
		fillOpacity: A(u, e),
		cursor: p ? "pointer" : void 0,
		onClick: (t, r, i) => {
			m && p && t && m({
				dataPoint: c[r] || t,
				clickedField: n || e,
				xValue: t.name,
				position: {
					x: i.clientX,
					y: i.clientY
				},
				nativeEvent: i
			});
		},
		children: [d && s.map((t, n) => {
			let r = t[e];
			return /* @__PURE__ */ S(E, {
				fill: typeof r == "number" && r < 0 ? "#ef4444" : "#10b981",
				fillOpacity: A(u, e)
			}, `cell-${n}`);
		}), f && s.map((t, n) => {
			let r = l?.colors || o;
			return /* @__PURE__ */ S(E, {
				fill: r[n % r.length],
				fillOpacity: A(u, e)
			}, `cat-${n}`);
		})]
	});
}
//#endregion
//#region src/client/components/charts/BarChart.tsx
var M = /* @__PURE__ */ e({ default: () => N }), N = y.memo(function({ data: e, chartConfig: i, displayConfig: a = {}, queryObject: o, height: y = "100%", colorPalette: w, onDataPointClick: E, drillEnabled: A }) {
	let { t: M } = t(), [N, P] = x(null), F = r(), { shouldStack: I, isPercentStack: L } = ie(a), R = {
		showLegend: a?.showLegend ?? !0,
		showGrid: a?.showGrid ?? !0,
		showTooltip: a?.showTooltip ?? !0
	}, z = a?.showAllXLabels ?? !1, B = a?.leftYAxisFormat, V = a?.rightYAxisFormat, { xAxisField: H, yAxisFields: U, seriesFields: W, errorCode: G } = b(() => l(i), [i]), { data: K, seriesKeys: q } = b(() => G || !e || e.length === 0 || !H ? {
		data: [],
		seriesKeys: []
	} : n(e, H, U, o, W, F), [
		e,
		H,
		U,
		o,
		W,
		F,
		G
	]), J = b(() => i?.yAxisAssignment || {}, [i?.yAxisAssignment]), Y = b(() => {
		let e = {};
		return U.forEach((t) => {
			let n = F(t);
			e[n] = t;
		}), e;
	}, [U, F]), X = v(U, J), { hasRightAxis: Z } = X, { chartData: Q, skippedCount: $ } = b(() => O(K, q), [K, q]);
	try {
		if (!e || e.length === 0) return /* @__PURE__ */ S(d, {
			height: y,
			hint: M("chart.runtime.noDataHint.bar")
		});
		if (G) return /* @__PURE__ */ S(c, {
			height: y,
			hint: M(`chart.runtime.configErrorHint.${G}`)
		});
		let t = I && !Z, n = L && !Z, r = n ? "expand" : void 0, { usePositiveNegativeColoring: i, useColorByCategory: o } = k(q, Q, W.length), l = R.showLegend, _ = h(Z), { spreadTargets: v, enhancedChartData: b } = f(Q, a?.target);
		return !Q || Q.length === 0 ? /* @__PURE__ */ S(d, {
			height: y,
			titleKey: "chart.runtime.noValidData",
			hint: "No valid data points for bar chart after transformation"
		}) : /* @__PURE__ */ C("div", {
			className: "dc:relative dc:w-full",
			style: { height: y },
			children: [/* @__PURE__ */ S(u, {
				height: $ > 0 ? "calc(100% - 20px)" : "100%",
				children: /* @__PURE__ */ C(D, {
					data: b,
					margin: _,
					stackOffset: r,
					accessibilityLayer: !1,
					children: [
						R.showGrid && /* @__PURE__ */ S(T, {
							strokeDasharray: "3 3",
							style: { pointerEvents: "none" }
						}),
						/* @__PURE__ */ S(re, {
							dataKey: "name",
							type: "category",
							tick: /* @__PURE__ */ S(s, {}),
							height: te(b.map((e) => e?.name)),
							interval: z ? 0 : void 0
						}),
						ne(X, F, B, V, n),
						R.showTooltip && /* @__PURE__ */ S(g, { formatter: p({
							leftYAxisFormat: B,
							rightYAxisFormat: V,
							yAxisAssignment: J,
							resolveField: (e) => Y[e],
							isPercentStack: n
						}) }),
						m({
							show: l,
							iconType: "rect",
							paddingTop: 25,
							onHover: P,
							onLeave: () => P(null)
						}),
						q.map((e, n) => {
							let r = Y[e];
							return /* @__PURE__ */ S(j, {
								seriesKey: e,
								index: n,
								originalField: r,
								axisId: r && J[r] === "right" ? "right" : "left",
								stackId: t ? "stack" : void 0,
								chartData: Q,
								enhancedChartData: b,
								colorPalette: w,
								hoveredLegend: N,
								usePositiveNegativeColoring: i,
								useColorByCategory: o,
								drillEnabled: A,
								onDataPointClick: E
							}, e);
						}),
						ee(v)
					]
				})
			}), $ > 0 && /* @__PURE__ */ C("div", {
				className: "dc:text-xs text-dc-text-muted dc:text-center dc:mt-1",
				children: [
					$,
					" data point",
					$ === 1 ? "" : "s",
					" with no values hidden"
				]
			})]
		});
	} catch (e) {
		return /* @__PURE__ */ S(_, {
			height: y,
			chartType: "Bar Chart",
			error: e
		});
	}
});
//#endregion
export { M as n, N as t };

//# sourceMappingURL=chart-bar-XCPUApJ9.js.map