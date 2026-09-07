import { c as e } from "./retention-ChW9jYdy.js";
import { F as t, l as n, s as r } from "./chart-activity-grid-D6X0iOUw.js";
import { M as i, j as a } from "./chart-area-95fIdTeM.js";
import o, { useMemo as s, useState as c } from "react";
import { jsx as l, jsxs as u } from "react/jsx-runtime";
import { CartesianGrid as d, ComposedChart as f, Legend as p, Line as m, XAxis as h, YAxis as g } from "recharts";
//#region src/client/components/charts/RetentionCombinedChart.tsx
function _(e) {
	return `rgba(34, 197, 94, ${.1 + Math.max(0, Math.min(1, e)) * .7})`;
}
function v(e) {
	return `${Math.round(e * 100)}%`;
}
function y(e, t) {
	let n = t === "day" ? "Day" : t === "week" ? "Week" : t === "month" ? "Month" : "P";
	return e === 0 ? t ? `< 1 ${n}` : "P0" : t ? `${n} ${e}` : `P${e}`;
}
function b(e) {
	return "Total";
}
function x(e) {
	return e ? `${e} Retention` : "Retention";
}
function S(e, t, n, r, i) {
	let a = x(i);
	return !n || n.length === 0 ? {
		chartData: t.map((t) => {
			let n = e.find((e) => e.period === t && !e.breakdownValue);
			return {
				period: t,
				periodLabel: y(t, r),
				[a]: n ? n.retentionRate : null,
				cohortSize: n?.cohortSize ?? 0,
				retainedUsers: n?.retainedUsers ?? 0
			};
		}),
		seriesKeys: [a],
		defaultSeriesName: a
	} : {
		chartData: t.map((t) => {
			let i = {
				period: t,
				periodLabel: y(t, r)
			};
			return n.forEach((n) => {
				let r = e.find((e) => e.period === t && e.breakdownValue === n);
				i[n] = r ? r.retentionRate : null, i[`${n}_cohortSize`] = r?.cohortSize ?? 0, i[`${n}_retainedUsers`] = r?.retainedUsers ?? 0;
			}), i;
		}),
		seriesKeys: n,
		defaultSeriesName: a
	};
}
var C = o.memo(function({ data: o, height: x = "100%", displayConfig: C, colorPalette: w }) {
	let { t: T } = t(), [E, D] = c(null), [O, k] = c(null), A = s(() => {
		if (!o) return null;
		if (e(o)) return o;
		if (Array.isArray(o) && o.length > 0) {
			let e = o, t = [...new Set(e.map((e) => e.period))].sort((e, t) => e - t), n = [...new Set(e.filter((e) => e.breakdownValue).map((e) => e.breakdownValue))];
			return {
				rows: e,
				periods: t,
				breakdownValues: n.length > 0 ? n : void 0
			};
		}
		return null;
	}, [o]), { chartData: j, seriesKeys: M, defaultSeriesName: N } = s(() => A ? S(A.rows, A.periods, A.breakdownValues, A.granularity, A.bindingKeyLabel) : {
		chartData: [],
		seriesKeys: [],
		defaultSeriesName: "Retention"
	}, [A]), P = b(A?.bindingKeyLabel), F = C?.retentionDisplayMode || "line", I = C?.showLegend ?? !0, L = C?.showGrid ?? !0, R = C?.showTooltip ?? !0;
	if (!o || Array.isArray(o) && o.length === 0) return /* @__PURE__ */ l("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted",
		style: { height: x },
		children: /* @__PURE__ */ u("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ l("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: T("chart.runtime.noData")
			}), /* @__PURE__ */ l("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: T("chart.runtime.noDataHint.retention")
			})]
		})
	});
	if (!j || j.length === 0) return /* @__PURE__ */ l("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted",
		style: { height: x },
		children: /* @__PURE__ */ u("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ l("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: T("chart.runtime.unableToRender")
			}), /* @__PURE__ */ l("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: T("chart.runtime.dataFormatIncorrect")
			})]
		})
	});
	let z = (e) => /* @__PURE__ */ l(i, {
		height: e,
		children: /* @__PURE__ */ u(f, {
			data: j,
			margin: {
				...n,
				left: 50,
				right: 20
			},
			accessibilityLayer: !1,
			children: [
				L && /* @__PURE__ */ l(d, { strokeDasharray: "3 3" }),
				/* @__PURE__ */ l(h, {
					dataKey: "periodLabel",
					tick: { fontSize: 12 },
					axisLine: { stroke: "var(--dc-border)" },
					tickLine: { stroke: "var(--dc-border)" }
				}),
				/* @__PURE__ */ l(g, {
					domain: [0, 1],
					tickFormatter: (e) => v(e),
					tick: { fontSize: 12 },
					axisLine: { stroke: "var(--dc-border)" },
					tickLine: { stroke: "var(--dc-border)" },
					label: {
						value: "Retention %",
						angle: -90,
						position: "insideLeft",
						style: {
							textAnchor: "middle",
							fontSize: "12px",
							fill: "var(--dc-text-secondary)"
						}
					}
				}),
				R && /* @__PURE__ */ l(a, {
					formatter: (e, t) => e == null ? ["No data", t] : [v(e), t],
					labelFormatter: (e) => e
				}),
				I && /* @__PURE__ */ l(p, {
					wrapperStyle: {
						fontSize: "12px",
						paddingTop: "10px"
					},
					iconType: "line",
					iconSize: 8,
					layout: "horizontal",
					align: "center",
					verticalAlign: "bottom",
					onMouseEnter: (e) => D(String(e.dataKey || "")),
					onMouseLeave: () => D(null)
				}),
				M.map((e, t) => /* @__PURE__ */ l(m, {
					type: "monotone",
					dataKey: e,
					stroke: w?.colors && w.colors[t % w.colors.length] || r[t % r.length],
					strokeWidth: 2,
					dot: {
						r: 4,
						strokeWidth: 2
					},
					activeDot: { r: 6 },
					strokeOpacity: E ? E === e ? 1 : .3 : 1,
					connectNulls: !1
				}, e))
			]
		})
	}), B = () => /* @__PURE__ */ u("table", {
		className: "dc:w-full dc:border-collapse dc:text-sm",
		children: [/* @__PURE__ */ l("thead", {
			className: "dc:sticky dc:top-0 bg-dc-bg dc:z-10",
			children: /* @__PURE__ */ u("tr", { children: [
				/* @__PURE__ */ l("th", {
					className: "dc:text-left dc:p-2 dc:font-medium text-dc-text dc:border-b border-dc-border dc:min-w-[100px] dc:whitespace-nowrap",
					children: A?.breakdownValues?.length ? "Segment" : "Cohort"
				}),
				/* @__PURE__ */ l("th", {
					className: "dc:text-right dc:p-2 dc:font-medium text-dc-text dc:border-b border-dc-border dc:min-w-[60px] dc:whitespace-nowrap",
					children: P
				}),
				A?.periods.map((e) => /* @__PURE__ */ l("th", {
					className: "dc:text-center dc:p-2 dc:font-medium text-dc-text dc:border-b border-dc-border dc:min-w-[70px] dc:whitespace-nowrap",
					children: y(e, A?.granularity)
				}, e))
			] })
		}), /* @__PURE__ */ l("tbody", { children: M.map((e, t) => {
			let n = j.find((e) => e.period === 0), r = e === N, i = r ? n?.cohortSize ?? 0 : n?.[`${e}_cohortSize`] ?? 0;
			return /* @__PURE__ */ u("tr", {
				className: t % 2 == 0 ? "bg-dc-bg" : "bg-dc-surface-secondary",
				children: [
					/* @__PURE__ */ l("td", {
						className: "dc:p-2 dc:font-medium text-dc-text dc:border-b border-dc-border dc:whitespace-nowrap",
						children: e
					}),
					/* @__PURE__ */ l("td", {
						className: "dc:p-2 dc:text-right text-dc-text-secondary dc:border-b border-dc-border",
						children: i.toLocaleString()
					}),
					A?.periods.map((t) => {
						let n = j.find((e) => e.period === t), a = n?.[e] ?? 0, o = a > 0 ? _(a) : "transparent";
						return /* @__PURE__ */ l("td", {
							className: "dc:p-2 dc:text-center dc:border-b border-dc-border dc:cursor-default dc:transition-opacity dc:hover:opacity-80",
							style: {
								backgroundColor: o,
								color: a > .5 ? "#ffffff" : "var(--dc-text)"
							},
							onMouseEnter: (o) => {
								let s = o.currentTarget.getBoundingClientRect(), c = r ? n?.retainedUsers ?? 0 : n?.[`${e}_retainedUsers`] ?? 0;
								k({
									period: t,
									breakdownValue: r ? null : e,
									cohortSize: i,
									retainedUsers: c,
									retentionRate: a,
									x: s.left + s.width / 2,
									y: s.top
								});
							},
							onMouseLeave: () => k(null),
							children: a > 0 ? v(a) : "-"
						}, t);
					})
				]
			}, e);
		}) })]
	}), V = () => O && /* @__PURE__ */ u("div", {
		className: "dc:fixed dc:z-50 dc:px-3 dc:py-2 bg-dc-surface dc:border border-dc-border dc:rounded-sm dc:shadow-lg dc:text-sm dc:pointer-events-none",
		style: {
			left: O.x,
			top: O.y - 10,
			transform: "translate(-50%, -100%)"
		},
		children: [/* @__PURE__ */ l("div", {
			className: "dc:font-medium text-dc-text dc:mb-1",
			children: O.breakdownValue ? `${O.breakdownValue} - ${y(O.period, A?.granularity)}` : y(O.period, A?.granularity)
		}), /* @__PURE__ */ u("div", {
			className: "text-dc-text-secondary dc:space-y-0.5",
			children: [
				/* @__PURE__ */ l("div", { children: T("chart.runtime.retention.cohortSize", { count: O.cohortSize.toLocaleString() }) }),
				/* @__PURE__ */ l("div", { children: T("chart.runtime.retention.retained", { count: O.retainedUsers.toLocaleString() }) }),
				/* @__PURE__ */ l("div", {
					className: "dc:font-medium text-dc-text",
					children: T("chart.runtime.retention.rate", { rate: v(O.retentionRate) })
				})
			]
		})]
	});
	return F === "heatmap" ? /* @__PURE__ */ u("div", {
		className: "dc:relative dc:w-full dc:h-full dc:overflow-auto",
		style: { height: x },
		children: [B(), V()]
	}) : F === "combined" ? /* @__PURE__ */ u("div", {
		className: "dc:flex dc:flex-col dc:w-full dc:h-full",
		style: { height: x },
		children: [
			/* @__PURE__ */ l("div", {
				className: "dc:flex-1 dc:min-h-[200px]",
				children: z("100%")
			}),
			/* @__PURE__ */ l("div", {
				className: "dc:flex-shrink-0 dc:max-h-[40%] dc:overflow-auto dc:border-t border-dc-border",
				children: B()
			}),
			V()
		]
	}) : z(x);
});
//#endregion
export { C as default };

//# sourceMappingURL=RetentionCombinedChart-DW8tA-BO.js.map