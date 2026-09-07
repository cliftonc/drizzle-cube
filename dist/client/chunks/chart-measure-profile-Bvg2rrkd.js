import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { F as t, S as n, l as r, s as i, w as a } from "./chart-activity-grid-D6X0iOUw.js";
import { A as o, M as s, j as c } from "./chart-area-95fIdTeM.js";
import l, { useMemo as u } from "react";
import { jsx as d, jsxs as f } from "react/jsx-runtime";
import { CartesianGrid as p, Legend as m, Line as h, LineChart as g, ReferenceLine as _, XAxis as v, YAxis as y } from "recharts";
//#region src/client/components/charts/MeasureProfileChart.tsx
var b = /* @__PURE__ */ e({ default: () => S });
function x(e, t, n, r) {
	if (!e || e.length === 0 || t.length === 0) return {
		profileData: [],
		seriesKeys: []
	};
	if (n) {
		let i = Array.from(new Set(e.map((e) => String(e[n] ?? "Unknown"))));
		return {
			profileData: t.map((t) => {
				let a = {
					measureKey: t,
					measureLabel: r(t)
				};
				for (let r of i) {
					let i = e.filter((e) => String(e[n] ?? "Unknown") === r).map((e) => {
						let n = e[t];
						return typeof n == "number" ? n : parseFloat(String(n ?? ""));
					}).filter((e) => !isNaN(e));
					a[r] = i.length > 0 ? i.reduce((e, t) => e + t, 0) / i.length : null;
				}
				return a;
			}),
			seriesKeys: i
		};
	}
	{
		let n = "_value";
		return {
			profileData: t.map((t) => {
				let i = e.map((e) => {
					let n = e[t];
					return typeof n == "number" ? n : parseFloat(String(n ?? ""));
				}).filter((e) => !isNaN(e));
				return {
					measureKey: t,
					measureLabel: r(t),
					[n]: i.length > 0 ? i.reduce((e, t) => e + t, 0) / i.length : null
				};
			}),
			seriesKeys: [n]
		};
	}
}
var S = l.memo(function({ data: e, chartConfig: l, displayConfig: b = {}, height: S = "100%", colorPalette: C, drillEnabled: w }) {
	let { t: T } = t(), E = n(), D = b?.showReferenceLineAtZero ?? !0, O = b?.showDataLabels ?? !1, k = b?.lineType ?? "monotone", A = b?.leftYAxisFormat, { yAxisFields: j, seriesField: M, configError: N } = u(() => {
		let e = Array.isArray(l?.yAxis) ? l.yAxis : [];
		return {
			yAxisFields: e,
			seriesField: Array.isArray(l?.series) ? l.series[0] : l?.series ?? void 0,
			configError: e.length < 2 ? "Measure Profile chart requires at least 2 measures in Y-Axis" : null
		};
	}, [l]), { profileData: P, seriesKeys: F } = u(() => N || !e || e.length === 0 ? {
		profileData: [],
		seriesKeys: []
	} : x(e, j, M, E), [
		e,
		j,
		M,
		E,
		N
	]), I = (b?.showLegend ?? !0) && F.length > 1;
	try {
		return !e || e.length === 0 ? /* @__PURE__ */ d("div", {
			className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted",
			style: { height: S },
			children: /* @__PURE__ */ f("div", {
				className: "dc:text-center",
				children: [/* @__PURE__ */ d("div", {
					className: "dc:text-sm dc:font-semibold dc:mb-1",
					children: T("chart.runtime.noData")
				}), /* @__PURE__ */ d("div", {
					className: "dc:text-xs text-dc-text-secondary",
					children: T("chart.runtime.noDataHint.measureProfile")
				})]
			})
		}) : N ? /* @__PURE__ */ d("div", {
			className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-warning",
			style: { height: S },
			children: /* @__PURE__ */ f("div", {
				className: "dc:text-center",
				children: [/* @__PURE__ */ d("div", {
					className: "dc:text-sm dc:font-semibold dc:mb-1",
					children: T("chart.runtime.configError")
				}), /* @__PURE__ */ d("div", {
					className: "dc:text-xs",
					children: N
				})]
			})
		}) : /* @__PURE__ */ d("div", {
			className: "dc:relative dc:w-full",
			style: { height: S },
			children: /* @__PURE__ */ d(s, {
				height: "100%",
				children: /* @__PURE__ */ f(g, {
					data: P,
					margin: {
						...r,
						left: 40
					},
					accessibilityLayer: !1,
					children: [
						/* @__PURE__ */ d(p, {
							strokeDasharray: "3 3",
							style: { pointerEvents: "none" }
						}),
						/* @__PURE__ */ d(v, {
							dataKey: "measureLabel",
							type: "category",
							tick: /* @__PURE__ */ d(o, {}),
							height: 60
						}),
						/* @__PURE__ */ d(y, {
							tick: { fontSize: 12 },
							tickFormatter: A ? (e) => a(e, A) : void 0
						}),
						/* @__PURE__ */ d(c, { formatter: (e, t) => e == null ? ["No data", t] : [A ? a(e, A) : e?.toLocaleString?.() ?? e, t === "_value" ? E(j[0]?.split(".")[0]) || "Value" : t] }),
						D && /* @__PURE__ */ d(_, {
							y: 0,
							stroke: "var(--dc-border, #94a3b8)",
							strokeDasharray: "4 2"
						}),
						I && /* @__PURE__ */ d(m, { wrapperStyle: {
							fontSize: "12px",
							paddingTop: "8px"
						} }),
						F.map((e, t) => /* @__PURE__ */ d(h, {
							type: k,
							dataKey: e,
							name: e === "_value" ? E(j[0]?.split(".")[0]) || "Value" : e,
							stroke: C?.colors && C.colors[t % C.colors.length] || i[t % i.length],
							strokeWidth: 2,
							dot: O ? { r: 4 } : { r: 3 },
							activeDot: { r: 5 },
							label: O ? {
								position: "top",
								fontSize: 10
							} : void 0,
							isAnimationActive: !1,
							cursor: w ? "pointer" : void 0
						}, e))
					]
				})
			})
		});
	} catch (e) {
		return /* @__PURE__ */ d("div", {
			className: "dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full text-dc-error dc:p-4",
			style: { height: S },
			children: /* @__PURE__ */ f("div", {
				className: "dc:text-center",
				children: [
					/* @__PURE__ */ d("div", {
						className: "dc:text-sm dc:font-semibold dc:mb-1",
						children: T("chart.runtime.chartError", { chartType: "Measure Profile Chart" })
					}),
					/* @__PURE__ */ d("div", {
						className: "dc:text-xs dc:mb-2",
						children: e instanceof Error ? e.message : T("chart.runtime.unknownError")
					}),
					/* @__PURE__ */ d("div", {
						className: "dc:text-xs text-dc-text-muted",
						children: T("chart.runtime.checkConfig")
					})
				]
			})
		});
	}
});
//#endregion
export { b as t };

//# sourceMappingURL=chart-measure-profile-Bvg2rrkd.js.map