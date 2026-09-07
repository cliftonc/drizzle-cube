import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { F as t, S as n, l as r, w as i } from "./chart-activity-grid-D6X0iOUw.js";
import { A as a, M as o, j as s } from "./chart-area-95fIdTeM.js";
import c, { useMemo as l } from "react";
import { jsx as u, jsxs as d } from "react/jsx-runtime";
import { Bar as f, CartesianGrid as p, Cell as m, ComposedChart as h, LabelList as g, Legend as _, Line as v, XAxis as y, YAxis as b } from "recharts";
//#region src/client/components/charts/WaterfallChart.tsx
var x = /* @__PURE__ */ e({ default: () => O }), S = "#22c55e", C = "#ef4444", w = "#6366f1", T = "#94a3b8";
function E(e, t, n, r, i) {
	let a = 0, o = e.map((e, r) => {
		let i = String(e[t] ?? `Row ${r + 1}`), o = e[n], s = typeof o == "number" ? o : parseFloat(String(o ?? "")), c = isNaN(s) ? 0 : s, l = c < 0, u = l ? a + c : a, d = {
			label: i,
			value: Math.abs(c),
			runningBase: u,
			isTotal: !1,
			isNegative: l,
			displayValue: c,
			originalIndex: r
		};
		return a += c, d;
	});
	if (r) {
		let e = i(n) || "Total";
		o.push({
			label: e,
			value: Math.abs(a),
			runningBase: a >= 0 ? 0 : a,
			isTotal: !0,
			isNegative: a < 0,
			displayValue: a,
			originalIndex: o.length
		});
	}
	return o;
}
function D(e) {
	let { x: t = 0, y: n = 0, width: r = 0, value: i = 0, isNegative: a, displayValue: o } = e;
	if (o == null) return null;
	let s = Number(o), c = a || s < 0 ? n + i + 14 : n - 6;
	return /* @__PURE__ */ d("text", {
		x: t + r / 2,
		y: c,
		fill: "currentColor",
		textAnchor: "middle",
		fontSize: 11,
		children: [s >= 0 ? "+" : "", s.toLocaleString()]
	});
}
var O = c.memo(function({ data: e, chartConfig: c, displayConfig: x = {}, height: O = "100%", onDataPointClick: k, drillEnabled: A }) {
	let { t: j } = t(), M = n(), N = x?.showTotal ?? !0, P = x?.showConnectorLine ?? !0, F = x?.showDataLabels ?? !1, I = x?.leftYAxisFormat, { xAxisField: L, yAxisField: R, configError: z } = l(() => {
		let e = Array.isArray(c?.xAxis) ? c.xAxis[0] : c?.x, t = Array.isArray(c?.yAxis) ? c.yAxis[0] : c?.y?.[0];
		return {
			xAxisField: e,
			yAxisField: t,
			configError: !e || !t ? "Waterfall chart requires an X-axis dimension and a Y-axis measure" : null
		};
	}, [c]), B = l(() => z || !e || e.length === 0 || !L || !R ? [] : E(e, L, R, N, M), [
		e,
		L,
		R,
		N,
		M,
		z
	]), V = l(() => !P || B.length === 0 ? [] : B.map((e) => {
		let t = e.isNegative ? e.runningBase : e.runningBase + e.value;
		return {
			label: e.label,
			_connector: t
		};
	}), [B, P]), H = l(() => B.map((e, t) => ({
		...e,
		_connector: V[t]?._connector
	})), [B, V]);
	try {
		return !e || e.length === 0 ? /* @__PURE__ */ u("div", {
			className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted",
			style: { height: O },
			children: /* @__PURE__ */ d("div", {
				className: "dc:text-center",
				children: [/* @__PURE__ */ u("div", {
					className: "dc:text-sm dc:font-semibold dc:mb-1",
					children: j("chart.runtime.noData")
				}), /* @__PURE__ */ u("div", {
					className: "dc:text-xs text-dc-text-secondary",
					children: j("chart.runtime.noDataHint.waterfall")
				})]
			})
		}) : z ? /* @__PURE__ */ u("div", {
			className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-warning",
			style: { height: O },
			children: /* @__PURE__ */ d("div", {
				className: "dc:text-center",
				children: [/* @__PURE__ */ u("div", {
					className: "dc:text-sm dc:font-semibold dc:mb-1",
					children: j("chart.runtime.configError")
				}), /* @__PURE__ */ u("div", {
					className: "dc:text-xs",
					children: z
				})]
			})
		}) : /* @__PURE__ */ u("div", {
			className: "dc:relative dc:w-full",
			style: { height: O },
			children: /* @__PURE__ */ u(o, {
				height: "100%",
				children: /* @__PURE__ */ d(h, {
					data: H,
					margin: {
						...r,
						left: 40
					},
					accessibilityLayer: !1,
					children: [
						/* @__PURE__ */ u(p, {
							strokeDasharray: "3 3",
							style: { pointerEvents: "none" }
						}),
						/* @__PURE__ */ u(y, {
							dataKey: "label",
							type: "category",
							tick: /* @__PURE__ */ u(a, {}),
							height: 60
						}),
						/* @__PURE__ */ u(b, {
							tick: { fontSize: 12 },
							tickFormatter: I ? (e) => i(e, I) : void 0
						}),
						/* @__PURE__ */ u(s, {
							formatter: (e, t, n) => {
								if (t === "_connector") return ["", ""];
								let r = n?.payload;
								if (!r) return [e, t];
								let a = r.displayValue ?? e;
								return [I ? i(a, I) : a?.toLocaleString?.() ?? a, r.isTotal ? "Total" : r.isNegative ? "Decrease" : "Increase"];
							},
							labelFormatter: (e) => e
						}),
						/* @__PURE__ */ u(_, {
							wrapperStyle: {
								fontSize: "12px",
								paddingTop: "8px"
							},
							payload: [
								{
									value: "Increase",
									type: "rect",
									color: S
								},
								{
									value: "Decrease",
									type: "rect",
									color: C
								},
								...N ? [{
									value: "Total",
									type: "rect",
									color: w
								}] : []
							]
						}),
						/* @__PURE__ */ u(f, {
							dataKey: "runningBase",
							stackId: "wf",
							fill: "transparent",
							legendType: "none",
							isAnimationActive: !1
						}),
						/* @__PURE__ */ d(f, {
							dataKey: "value",
							stackId: "wf",
							isAnimationActive: !1,
							cursor: A ? "pointer" : void 0,
							onClick: (e, t, n) => {
								k && A && e && !e.isTotal && k({
									dataPoint: e,
									clickedField: R,
									xValue: e.label,
									position: {
										x: n.clientX,
										y: n.clientY
									},
									nativeEvent: n
								});
							},
							children: [F && /* @__PURE__ */ u(g, {
								dataKey: "displayValue",
								content: (e) => /* @__PURE__ */ u(D, {
									...e,
									runningBase: H[e.index]?.runningBase,
									isNegative: H[e.index]?.isNegative,
									displayValue: H[e.index]?.displayValue
								})
							}), H.map((e, t) => /* @__PURE__ */ u(m, { fill: e.isTotal ? w : e.isNegative ? C : S }, `cell-${t}`))]
						}),
						P && /* @__PURE__ */ u(v, {
							type: "stepAfter",
							dataKey: "_connector",
							stroke: T,
							strokeWidth: 1.5,
							strokeDasharray: "4 2",
							dot: !1,
							activeDot: !1,
							legendType: "none",
							isAnimationActive: !1
						})
					]
				})
			})
		});
	} catch (e) {
		return /* @__PURE__ */ u("div", {
			className: "dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full text-dc-error dc:p-4",
			style: { height: O },
			children: /* @__PURE__ */ d("div", {
				className: "dc:text-center",
				children: [
					/* @__PURE__ */ u("div", {
						className: "dc:text-sm dc:font-semibold dc:mb-1",
						children: j("chart.runtime.chartError", { chartType: "Waterfall Chart" })
					}),
					/* @__PURE__ */ u("div", {
						className: "dc:text-xs dc:mb-2",
						children: e instanceof Error ? e.message : j("chart.runtime.unknownError")
					}),
					/* @__PURE__ */ u("div", {
						className: "dc:text-xs text-dc-text-muted",
						children: j("chart.runtime.checkConfig")
					})
				]
			})
		});
	}
});
//#endregion
export { x as t };

//# sourceMappingURL=chart-waterfall-DvUZsKDT.js.map