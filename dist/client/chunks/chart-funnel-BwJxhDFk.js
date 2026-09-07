import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { F as t, s as n } from "./chart-activity-grid-D6X0iOUw.js";
import r, { useMemo as i } from "react";
import { jsx as a, jsxs as o } from "react/jsx-runtime";
import { Cell as s, Funnel as c, FunnelChart as l, LabelList as u, ResponsiveContainer as d, Tooltip as f } from "recharts";
//#region src/client/utils/funnelExecution.ts
function p(e, t) {
	if (typeof e.dimension == "string") return e.dimension;
	let n = e.dimension, r = m(t);
	if (!r) return n[0]?.dimension || "";
	let i = n.find((e) => e.cube === r);
	return i ? i.dimension : n[0]?.dimension || "";
}
function m(e) {
	if (e.measures && e.measures.length > 0) {
		let t = e.measures[0].split(".");
		if (t.length >= 2) return t[0];
	}
	if (e.dimensions && e.dimensions.length > 0) {
		let t = e.dimensions[0].split(".");
		if (t.length >= 2) return t[0];
	}
	if (e.timeDimensions && e.timeDimensions.length > 0) {
		let t = e.timeDimensions[0].dimension.split(".");
		if (t.length >= 2) return t[0];
	}
	return null;
}
function h(e, t, n, r) {
	let i = e.map((e, t) => ({
		id: `step-${t}`,
		name: n?.[t] || `Step ${t + 1}`,
		query: e,
		timeToConvert: r?.[t] || void 0
	}));
	return {
		id: `funnel-${Date.now()}`,
		name: "Funnel Analysis",
		bindingKey: t,
		steps: i,
		countUnique: !0
	};
}
function g(e) {
	return e.length > 0 && typeof e[0] == "object" && e[0] !== null && "__stepIndex" in e[0];
}
function _(e, t, n, r, i = !0) {
	return { funnel: {
		bindingKey: t.dimension,
		timeDimension: v(e, t),
		steps: e.map((e, t) => {
			let i = { name: n?.[t] || `Step ${t + 1}` }, a = x(e);
			a && (i.filter = a);
			let o = r?.[t];
			return o && (i.timeToConvert = o), i;
		}),
		includeTimeMetrics: i
	} };
}
function v(e, t) {
	return Array.isArray(t.dimension) ? b(e, t.dimension) : y(e);
}
function y(e) {
	for (let t of e) if (t.timeDimensions?.length) return t.timeDimensions[0].dimension;
	let t = m(e[0]);
	if (t) return `${t}.createdAt`;
	throw Error("Funnel requires at least one time dimension in step queries");
}
function b(e, t) {
	return t.map((t) => {
		let n = e.find((e) => m(e) === t.cube), r = n?.timeDimensions?.length ? n.timeDimensions[0].dimension : `${t.cube}.createdAt`;
		return {
			cube: t.cube,
			dimension: r
		};
	});
}
function x(e) {
	if (!e.filters?.length) return;
	let t = e.filters.filter((e) => "member" in e);
	if (t.length !== 0) return t.length === 1 ? t[0] : t;
}
function S(e, t) {
	return e?.length ? e.map((e, n) => ({
		name: t?.[n] || e.step,
		value: e.count,
		percentage: e.cumulativeConversionRate * 100,
		conversionRate: e.conversionRate === null ? null : e.conversionRate * 100,
		stepIndex: e.stepIndex,
		avgSecondsToConvert: e.avgSecondsToConvert,
		medianSecondsToConvert: e.medianSecondsToConvert,
		p90SecondsToConvert: e.p90SecondsToConvert
	})) : [];
}
function C(e) {
	if (e == null) return "-";
	if (e < 60) return `${Math.round(e)}s`;
	if (e < 3600) {
		let t = e / 60;
		return t < 10 ? `${t.toFixed(1)}m` : `${Math.round(t)}m`;
	}
	if (e < 86400) {
		let t = e / 3600;
		return t < 10 ? `${t.toFixed(1)}h` : `${Math.round(t)}h`;
	}
	let t = e / 86400;
	return t < 10 ? `${t.toFixed(1)}d` : `${Math.round(t)}d`;
}
//#endregion
//#region src/client/components/charts/FunnelChart.helpers.ts
function w(e) {
	if (!e || e.length === 0) return !1;
	let t = e[0];
	return typeof t == "object" && !!t && "name" in t && "value" in t && "percentage" in t;
}
function T(e, t, n, r) {
	let i = [];
	return t && e.avgSecondsToConvert != null && i.push(`Avg: ${C(e.avgSecondsToConvert)}`), n && e.medianSecondsToConvert != null && i.push(`Med: ${C(e.medianSecondsToConvert)}`), r && e.p90SecondsToConvert != null && i.push(`P90: ${C(e.p90SecondsToConvert)}`), i;
}
function E(e) {
	return !e || e.length === 0 ? [] : w(e) ? e : e.map((e, t) => {
		let n = e, r = Object.keys(n).find((e) => e.toLowerCase().includes("step") || e.toLowerCase().includes("name") || e === "__stepName"), i = r ? String(n[r]) : `Step ${t + 1}`, a = Object.keys(n).find((e) => e.toLowerCase().includes("count") || e.toLowerCase().includes("value") || e === "__count"), o = a && Number(n[a]) || 0, s = Object.keys(n).find((e) => e.toLowerCase().includes("percent") || e === "__percentage"), c = s && Number(n[s]) || 0, l = Object.keys(n).find((e) => e.toLowerCase().includes("conversion") || e === "__conversionRate");
		return {
			name: i,
			value: o,
			percentage: c,
			conversionRate: l && Number(n[l]) || null,
			stepIndex: t
		};
	});
}
function D(e) {
	return {
		customStepLabels: e?.funnelStepLabels,
		isVertical: (e?.funnelOrientation || "horizontal") === "vertical",
		funnelStyle: e?.funnelStyle ?? "bars",
		showConversion: e?.showFunnelConversion ?? !0,
		showAvgTime: e?.showFunnelAvgTime ?? e?.showFunnelTimeMetrics ?? !1,
		showMedianTime: e?.showFunnelMedianTime ?? !1,
		showP90Time: e?.showFunnelP90Time ?? !1,
		hideSummaryFooter: e?.hideSummaryFooter ?? !1
	};
}
function O(e, t) {
	return t[e % t.length];
}
//#endregion
//#region src/client/components/charts/FunnelViews.tsx
function k({ funnelData: e, firstStepValue: n }) {
	let { t: r } = t(), i = e[e.length - 1]?.value || 0;
	return /* @__PURE__ */ a("div", {
		className: "dc:flex-shrink-0 dc:px-4 dc:py-2 dc:border-t border-dc-border bg-dc-surface-secondary",
		children: /* @__PURE__ */ o("div", {
			className: "dc:flex dc:items-center dc:justify-between dc:text-sm",
			children: [
				/* @__PURE__ */ o("div", {
					className: "text-dc-text-muted",
					children: [/* @__PURE__ */ a("span", {
						className: "dc:font-medium",
						children: e.length
					}), " steps"]
				}),
				/* @__PURE__ */ o("div", {
					className: "text-dc-text",
					children: [
						/* @__PURE__ */ a("span", {
							className: "text-dc-text-muted",
							children: r("chart.runtime.funnel.overall")
						}),
						" ",
						/* @__PURE__ */ a("span", {
							className: "dc:font-medium",
							children: n > 0 ? `${(i / n * 100).toFixed(1)}%` : "0%"
						})
					]
				}),
				/* @__PURE__ */ o("div", {
					className: "text-dc-text-muted",
					children: [
						i.toLocaleString() || 0,
						" / ",
						n.toLocaleString(),
						" completed"
					]
				})
			]
		})
	});
}
function A({ stepConversionRate: e, arrow: t, showConversion: n, timeMetricsLines: r }) {
	return e === null ? /* @__PURE__ */ a("div", {
		className: "dc:text-xs text-dc-text-muted",
		children: "—"
	}) : /* @__PURE__ */ o("div", {
		className: "dc:text-xs text-dc-text-secondary",
		children: [n && /* @__PURE__ */ o("span", { children: [
			t,
			" ",
			e.toFixed(1),
			"%"
		] }), r.length > 0 && /* @__PURE__ */ a("div", {
			className: "text-dc-text-muted dc:mt-0.5 dc:space-y-0.5",
			children: r.map((e, t) => /* @__PURE__ */ o("div", { children: ["⏱ ", e] }, t))
		})]
	});
}
function j({ funnelData: e, firstStepValue: t, paletteColors: n, options: r, height: i }) {
	return /* @__PURE__ */ o("div", {
		className: "dc:relative dc:w-full dc:h-full dc:flex dc:flex-col",
		style: { height: i },
		children: [/* @__PURE__ */ a("div", {
			className: "dc:flex-1",
			children: /* @__PURE__ */ a(d, {
				width: "100%",
				height: "100%",
				children: /* @__PURE__ */ o(l, {
					layout: r.isVertical ? "horizontal" : "vertical",
					accessibilityLayer: !1,
					children: [/* @__PURE__ */ a(f, {
						formatter: (e) => typeof e == "number" ? e.toLocaleString() : String(e),
						contentStyle: {
							backgroundColor: "var(--dc-surface)",
							border: "1px solid var(--dc-border)",
							borderRadius: "4px"
						}
					}), /* @__PURE__ */ o(c, {
						dataKey: "value",
						nameKey: "name",
						data: e,
						isAnimationActive: !0,
						children: [
							e.map((e, t) => /* @__PURE__ */ a(s, { fill: O(t, n) }, `cell-${t}`)),
							/* @__PURE__ */ a(u, {
								position: "right",
								dataKey: "name",
								fill: "var(--dc-text)",
								style: { fontSize: "12px" }
							}),
							/* @__PURE__ */ a(u, {
								position: "center",
								dataKey: "percentage",
								formatter: (e) => typeof e == "number" ? `${e.toFixed(1)}%` : String(e),
								fill: "#fff",
								style: {
									fontSize: "11px",
									fontWeight: 500
								}
							})
						]
					})]
				})
			})
		}), !r.hideSummaryFooter && /* @__PURE__ */ a(k, {
			funnelData: e,
			firstStepValue: t
		})]
	});
}
function M({ funnelData: e, firstStepValue: t, paletteColors: n, options: r, height: i }) {
	return /* @__PURE__ */ o("div", {
		className: "dc:relative dc:w-full dc:h-full dc:flex dc:flex-col",
		style: { height: i },
		children: [/* @__PURE__ */ a("div", {
			className: "dc:flex-1 dc:flex dc:items-end dc:justify-center dc:gap-4 dc:px-4 dc:py-3 dc:overflow-hidden",
			children: e.map((i, s) => {
				let c = t > 0 ? i.value / t * 100 : 0, l = s > 0 ? e[s - 1] : null, u = l && l.value > 0 ? i.value / l.value * 100 : null, d = r.customStepLabels?.[s] || i.name, f = T(i, r.showAvgTime, r.showMedianTime, r.showP90Time), p = f.length;
				return /* @__PURE__ */ o("div", {
					className: "dc:flex dc:flex-col dc:items-center dc:gap-2 dc:flex-1 dc:max-w-32 dc:h-full",
					children: [
						/* @__PURE__ */ a("div", {
							className: `${p > 0 ? p > 1 ? "dc:min-h-16" : "dc:min-h-10" : "dc:h-5"} dc:flex-shrink-0 dc:text-center`,
							children: /* @__PURE__ */ a(A, {
								stepConversionRate: u,
								arrow: "→",
								showConversion: r.showConversion,
								timeMetricsLines: f
							})
						}),
						/* @__PURE__ */ o("div", {
							className: "dc:flex-1 dc:w-full dc:relative dc:min-h-12",
							children: [
								/* @__PURE__ */ a("div", { className: "dc:absolute dc:inset-0 bg-dc-surface-secondary dc:rounded-sm" }),
								/* @__PURE__ */ a("div", {
									className: "dc:absolute dc:bottom-0 dc:left-0 dc:right-0 dc:rounded-sm dc:transition-all dc:duration-300",
									style: {
										height: `${Math.max(c, 5)}%`,
										backgroundColor: O(s, n)
									}
								}),
								/* @__PURE__ */ a("div", {
									className: "dc:absolute dc:bottom-0 dc:left-0 dc:right-0 dc:flex dc:items-end dc:justify-center dc:pb-1 dc:pointer-events-none",
									style: { height: `${Math.max(c, 20)}%` },
									children: /* @__PURE__ */ o("span", {
										className: "dc:text-xs dc:font-medium text-white dc:drop-shadow-sm",
										children: [i.percentage?.toFixed(1) ?? c.toFixed(1), "%"]
									})
								})
							]
						}),
						/* @__PURE__ */ o("div", {
							className: "dc:flex-shrink-0 dc:text-center",
							children: [/* @__PURE__ */ a("div", {
								className: "dc:text-sm dc:font-medium text-dc-text dc:truncate",
								title: d,
								children: d
							}), /* @__PURE__ */ a("div", {
								className: "dc:text-xs text-dc-text-muted",
								children: i.value.toLocaleString()
							})]
						})
					]
				}, i.name);
			})
		}), !r.hideSummaryFooter && /* @__PURE__ */ a(k, {
			funnelData: e,
			firstStepValue: t
		})]
	});
}
function N({ funnelData: e, firstStepValue: t, paletteColors: n, options: r, height: i }) {
	return /* @__PURE__ */ o("div", {
		className: "dc:relative dc:w-full dc:h-full dc:flex dc:flex-col",
		style: { height: i },
		children: [/* @__PURE__ */ a("div", {
			className: "dc:flex-1 dc:flex dc:flex-col dc:justify-center dc:gap-2 dc:px-4 dc:py-3 dc:overflow-hidden",
			children: e.map((i, s) => {
				let c = t > 0 ? i.value / t * 100 : 0, l = s > 0 ? e[s - 1] : null, u = l && l.value > 0 ? i.value / l.value * 100 : null, d = r.customStepLabels?.[s] || i.name, f = T(i, r.showAvgTime, r.showMedianTime, r.showP90Time), p = f.length;
				return /* @__PURE__ */ o("div", {
					className: "dc:flex dc:items-center dc:gap-3",
					children: [
						/* @__PURE__ */ o("div", {
							className: "dc:w-24 dc:flex-shrink-0 dc:text-right",
							children: [/* @__PURE__ */ a("div", {
								className: "dc:text-sm dc:font-medium text-dc-text dc:truncate",
								title: d,
								children: d
							}), /* @__PURE__ */ a("div", {
								className: "dc:text-xs text-dc-text-muted",
								children: i.value.toLocaleString()
							})]
						}),
						/* @__PURE__ */ o("div", {
							className: "dc:flex-1 dc:relative",
							children: [
								/* @__PURE__ */ a("div", { className: "dc:w-full dc:h-8 bg-dc-surface-secondary dc:rounded-sm" }),
								/* @__PURE__ */ a("div", {
									className: "dc:absolute dc:top-0 dc:left-0 dc:h-8 dc:rounded-sm dc:transition-all dc:duration-300",
									style: {
										width: `${Math.max(c, 2)}%`,
										backgroundColor: O(s, n)
									}
								}),
								/* @__PURE__ */ a("div", {
									className: "dc:absolute dc:top-0 dc:left-0 dc:h-8 dc:flex dc:items-center dc:px-2 dc:pointer-events-none",
									style: { width: `${Math.max(c, 20)}%` },
									children: /* @__PURE__ */ o("span", {
										className: "dc:text-xs dc:font-medium text-white dc:drop-shadow-sm",
										children: [i.percentage?.toFixed(1) ?? c.toFixed(1), "%"]
									})
								})
							]
						}),
						/* @__PURE__ */ a("div", {
							className: `${p > 0 ? p > 1 ? "dc:w-36" : "dc:w-28" : "dc:w-16"} dc:flex-shrink-0 dc:text-left`,
							children: /* @__PURE__ */ a(A, {
								stepConversionRate: u,
								arrow: "↓",
								showConversion: r.showConversion,
								timeMetricsLines: f
							})
						})
					]
				}, i.name);
			})
		}), !r.hideSummaryFooter && /* @__PURE__ */ a(k, {
			funnelData: e,
			firstStepValue: t
		})]
	});
}
//#endregion
//#region src/client/components/charts/FunnelChart.tsx
var P = /* @__PURE__ */ e({ default: () => F }), F = r.memo(function({ data: e, height: r = "100%", colorPalette: s, displayConfig: c }) {
	let { t: l } = t(), u = D(c), d = i(() => E(e), [e]);
	return !e || e.length === 0 || d.length === 0 ? /* @__PURE__ */ a("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted",
		style: { height: r },
		children: /* @__PURE__ */ o("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ a("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: l("chart.runtime.funnel.noData")
			}), /* @__PURE__ */ a("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: l("chart.runtime.noDataHint.funnel")
			})]
		})
	}) : a(u.funnelStyle === "funnel" ? j : u.isVertical ? M : N, {
		funnelData: d,
		firstStepValue: d[0]?.value || 0,
		paletteColors: s?.colors || n,
		options: u,
		height: r
	});
});
//#endregion
export { C as a, g as c, _ as i, S as l, P as n, p as o, h as r, m as s, F as t };

//# sourceMappingURL=chart-funnel-BwJxhDFk.js.map