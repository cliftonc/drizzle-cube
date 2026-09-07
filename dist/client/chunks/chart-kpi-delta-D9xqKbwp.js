import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { O as t, k as n } from "./chart-data-table-Bn9EtETl.js";
import { F as r, S as i } from "./chart-activity-grid-D6X0iOUw.js";
import a, { useEffect as o, useRef as s, useState as c } from "react";
import { jsx as l, jsxs as u } from "react/jsx-runtime";
//#region src/client/utils/periodUtils.ts
function d(e, t) {
	let n = new Date(e);
	switch (t.toLowerCase()) {
		case "day":
			n.setHours(23, 59, 59, 999);
			break;
		case "week": {
			let e = 6 - n.getDay();
			n.setDate(n.getDate() + e), n.setHours(23, 59, 59, 999);
			break;
		}
		case "month":
			n.setMonth(n.getMonth() + 1, 0), n.setHours(23, 59, 59, 999);
			break;
		case "quarter": {
			let e = n.getMonth(), t = Math.floor(e / 3) * 3 + 2;
			n.setMonth(t + 1, 0), n.setHours(23, 59, 59, 999);
			break;
		}
		case "year":
			n.setMonth(11, 31), n.setHours(23, 59, 59, 999);
			break;
		default: n.setHours(23, 59, 59, 999);
	}
	return n;
}
function f(e, t, n) {
	if (!e || !t || !n) return !0;
	let r = e[t];
	if (!r) return !0;
	let i = new Date(r);
	return isNaN(i.getTime()) ? !0 : d(i, n) <= /* @__PURE__ */ new Date();
}
function p(e, t) {
	if (!e?.timeDimensions || e.timeDimensions.length === 0) return null;
	if (t) {
		let n = e.timeDimensions.find((e) => e.dimension === t || e.dimension?.includes(t) || t?.includes(e.dimension));
		if (n?.granularity) return n.granularity;
	}
	return e.timeDimensions[0]?.granularity || null;
}
function m(e, t, n, r, i = !1) {
	let a = {
		filteredData: e,
		excludedIncompletePeriod: !1,
		skippedLastPeriod: !1,
		granularity: null
	};
	if (e.length < 2) return a;
	let o = p(n, t);
	if (i) return {
		filteredData: e.slice(0, -1),
		excludedIncompletePeriod: !1,
		skippedLastPeriod: !0,
		granularity: o
	};
	if (!r || !t || !n?.timeDimensions || n.timeDimensions.length === 0) return {
		...a,
		granularity: o
	};
	if (!o) return a;
	let s = e[e.length - 1];
	return f(s, t, o) ? {
		...a,
		granularity: o
	} : {
		filteredData: e.slice(0, -1),
		excludedIncompletePeriod: !0,
		skippedLastPeriod: !1,
		granularity: o
	};
}
//#endregion
//#region src/client/components/charts/KpiNumber.helpers.ts
function h(e) {
	return e ? typeof e == "string" ? [e] : Array.isArray(e) ? e : [] : [];
}
function g(e, t) {
	if (!e || e.length === 0) return [];
	let n = [...e];
	return t ? n.sort((e, n) => {
		let r = e[t], i = n[t];
		return r < i ? -1 : +(r > i);
	}) : n;
}
function _(e, t) {
	return !t || e.length === 0 ? [] : e.map((e) => {
		if (e[t] !== void 0) return e[t];
		let n = Object.keys(e).filter((t) => typeof e[t] == "number" && !isNaN(e[t]));
		if (n.length > 0) return e[n[0]];
	}).filter((e) => e != null && !isNaN(Number(e))).map((e) => Number(e));
}
function v(e) {
	return e.length === 0 ? {
		avg: 0,
		min: 0,
		max: 0
	} : {
		avg: e.reduce((e, t) => e + t, 0) / e.length,
		min: Math.min(...e),
		max: Math.max(...e)
	};
}
function y(e, t) {
	if (t.formatValue) return t.formatValue(e);
	if (e == null) return "—";
	let n = t.decimals ?? 0, r = t.prefix ?? "", i;
	return i = Math.abs(e) >= 1e9 ? (e / 1e9).toFixed(n) + "B" : Math.abs(e) >= 1e6 ? (e / 1e6).toFixed(n) + "M" : Math.abs(e) >= 1e3 ? (e / 1e3).toFixed(n) + "K" : e.toFixed(n), r + i;
}
function b(e, t) {
	return e && e.length > 1 ? e : t;
}
function x(e, t) {
	return e !== void 0 && t && e >= 0 && e < t.length ? t[e] : t?.[0] || "#1f2937";
}
function S(e, t, n, r) {
	return e === null ? "#6B7280" : e >= 0 ? r?.[t ?? 1] || "#10B981" : r?.[n ?? 7] || "#EF4444";
}
//#endregion
//#region src/client/components/charts/useKpiDimensions.ts
function C({ widthDivisor: e, heightDivisor: t, minFontSize: n, maxFontSize: r, measureWidth: i, deps: a }) {
	let [l, u] = c(32), [d, f] = c(250), p = s(null), m = s(null);
	return o(() => {
		let a = () => {
			if (!p.current) return;
			let a = p.current.getBoundingClientRect(), o = a.width, s = a.height;
			if (o <= 0 || s <= 0) return;
			let c = o / e, l = s / t;
			u(Math.max(n, Math.min(Math.min(c, l), r))), setTimeout(() => {
				if (m.current) {
					let e = m.current.getBoundingClientRect().width;
					f(i(e, o));
				}
			}, 10);
		}, o = setTimeout(a, 50), s = new ResizeObserver(() => {
			setTimeout(a, 10);
		});
		return p.current && s.observe(p.current), () => {
			clearTimeout(o), s.disconnect();
		};
	}, a), {
		containerRef: p,
		valueRef: m,
		fontSize: l,
		textWidth: d
	};
}
//#endregion
//#region src/client/components/charts/KpiStates.tsx
var w = {
	muted: {},
	danger: {
		backgroundColor: "var(--dc-danger-bg)",
		color: "var(--dc-danger)",
		borderColor: "var(--dc-danger-border)"
	},
	warning: {
		backgroundColor: "var(--dc-warning-bg)",
		color: "var(--dc-warning)",
		borderColor: "var(--dc-warning-border)"
	}
};
function T(e, t = "200px") {
	return {
		height: e === "100%" ? "100%" : e,
		minHeight: e === "100%" ? t : void 0
	};
}
function E({ height: e, title: t, hint: n, variant: r = "muted", children: i }) {
	return /* @__PURE__ */ l("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full dc:h-full",
		style: {
			...T(e),
			...w[r]
		},
		children: /* @__PURE__ */ u("div", {
			className: `dc:text-center${r === "muted" ? " text-dc-text-muted" : ""}`,
			children: [
				/* @__PURE__ */ l("div", {
					className: "dc:text-sm dc:font-semibold dc:mb-1",
					children: t
				}),
				n != null && /* @__PURE__ */ l("div", {
					className: `dc:text-xs${r === "muted" ? " text-dc-text-secondary" : ""}`,
					children: n
				}),
				i
			]
		})
	});
}
//#endregion
//#region src/client/components/charts/KpiCompactLayout.tsx
var D = a.memo(function({ label: e, labelAdornment: t, value: n, valueColor: r, suffix: i, valueAdornment: a, detail: o, containerRef: s }) {
	return /* @__PURE__ */ u("div", {
		ref: s,
		className: "dc:flex dc:flex-col dc:justify-center dc:w-full dc:h-full dc:px-4 dc:py-3 dc:gap-1.5 dc:overflow-hidden",
		style: {
			height: "100%",
			minHeight: "80px"
		},
		children: [
			/* @__PURE__ */ u("div", {
				className: "dc:flex dc:items-center dc:gap-1 dc:font-bold text-dc-text-secondary",
				style: {
					fontSize: "14px",
					lineHeight: 1.2
				},
				children: [/* @__PURE__ */ l("span", {
					className: "dc:truncate",
					children: e
				}), t]
			}),
			/* @__PURE__ */ u("div", {
				className: "dc:flex dc:items-baseline dc:gap-1.5",
				children: [
					/* @__PURE__ */ l("span", {
						className: "dc:font-semibold dc:leading-none dc:truncate",
						style: {
							fontSize: "30px",
							color: r || "var(--dc-text)"
						},
						children: n
					}),
					i && /* @__PURE__ */ l("span", {
						className: "text-dc-text-muted dc:truncate",
						style: { fontSize: "14px" },
						children: i
					}),
					a
				]
			}),
			o && /* @__PURE__ */ l("div", {
				className: "text-dc-text-muted dc:truncate",
				style: {
					fontSize: "12px",
					lineHeight: 1.4
				},
				children: o
			})
		]
	});
});
//#endregion
//#region src/client/components/charts/KpiDelta.helpers.ts
function O(e) {
	return e ? Array.isArray(e) ? e : [e] : [];
}
function k(e, t) {
	let n = [...e];
	return t ? n.sort((e, n) => {
		let r = e[t], i = n[t];
		return r < i ? -1 : +(r > i);
	}) : n;
}
function A(e, t) {
	return e.map((e) => e[t]).filter((e) => e != null && !isNaN(Number(e))).map((e) => Number(e));
}
function j(e) {
	let t = e[e.length - 1], n = e[e.length - 2], r = t - n;
	return {
		lastValue: t,
		previousValue: n,
		absoluteChange: r,
		percentageChange: n === 0 ? 0 : r / Math.abs(n) * 100,
		isPositiveChange: r >= 0
	};
}
function M(e, t, n) {
	return e !== void 0 && t && e >= 0 && e < t.length ? t[e] : n;
}
//#endregion
//#region src/client/components/charts/KpiDelta.tsx
var N = /* @__PURE__ */ e({ default: () => F });
function P({ values: e, lastValue: t, positiveColor: n, negativeColor: r, formatValue: i, width: a, height: o }) {
	let s = Math.max(10, Math.floor(a / 10)), c = e.length > s ? e.slice(-s) : e, d = c.map((e) => e - t), f = Math.min(...d, 0), p = Math.max(...d, 0);
	if (Math.max(Math.abs(f), Math.abs(p)) === 0 || d.length === 0) return /* @__PURE__ */ l("div", {
		className: "dc:flex dc:items-center dc:justify-center bg-dc-bg-secondary dc:rounded-sm dc:border border-dc-border",
		style: {
			width: `${a}px`,
			height: `${o}px`
		},
		children: /* @__PURE__ */ l("span", {
			className: "dc:text-xs text-dc-text-muted",
			children: "No variance data"
		})
	});
	let m = a - (c.length - 1) * 2, h = Math.max(4, m / c.length), g = p - f, _ = g > 0 ? p / g * 100 : 50;
	return /* @__PURE__ */ u("div", {
		className: "dc:flex dc:items-center dc:space-x-2",
		children: [/* @__PURE__ */ u("div", {
			className: "dc:relative",
			style: {
				width: `${a}px`,
				height: `${o}px`
			},
			children: [/* @__PURE__ */ l("div", {
				className: "dc:absolute dc:left-0 dc:right-0",
				style: {
					height: "1px",
					top: `${_}%`,
					backgroundColor: "var(--dc-border)",
					zIndex: 1
				}
			}), d.map((e, t) => {
				let a = Math.abs(e) / g, s = Math.max(2, a * (o - 4)), u = e >= 0, d = t === c.length - 1, f = u ? n : r, p = t * (h + 2);
				return /* @__PURE__ */ l("div", {
					className: "dc:absolute dc:rounded-sm",
					style: {
						left: `${p}px`,
						width: `${h}px`,
						height: `${s}px`,
						backgroundColor: f,
						opacity: d ? 1 : .6,
						...u ? { bottom: `${100 - _}%` } : { top: `${_}%` },
						zIndex: 2
					},
					title: `${i(c[t])}: ${e >= 0 ? "+" : ""}${i(e)} vs current`
				}, t);
			})]
		}), /* @__PURE__ */ u("div", {
			className: "dc:flex dc:flex-col dc:justify-between dc:text-xs text-dc-text-muted",
			style: { height: `${o}px` },
			children: [/* @__PURE__ */ u("span", { children: ["+", i(p)] }), /* @__PURE__ */ u("span", { children: ["", i(f)] })]
		})]
	});
}
var F = a.memo(function({ data: e, chartConfig: a, displayConfig: o = {}, queryObject: s, height: c = "100%", colorPalette: d }) {
	let { t: f } = r(), p = i(), { containerRef: h, valueRef: g, fontSize: _, textWidth: v } = C({
		widthDivisor: 4,
		heightDivisor: 4,
		minFontSize: 28,
		maxFontSize: 140,
		measureWidth: (e, t) => {
			let n = t - 100, r = Math.max(e, Math.min(n, t * .7));
			return Math.max(100, r);
		},
		deps: [e, a]
	});
	if (!e || e.length === 0) return /* @__PURE__ */ l(E, {
		height: c,
		title: f("chart.runtime.noData"),
		hint: f("chart.runtime.noDataHint.kpi")
	});
	let x = O(a?.yAxis), S = O(a?.xAxis);
	if (x.length === 0) return /* @__PURE__ */ l(E, {
		height: c,
		variant: "danger",
		title: f("chart.runtime.configError"),
		hint: f("chart.runtime.configErrorHint.noMeasure")
	});
	let w = x[0], N = S[0], F = k(e, N), { useLastCompletePeriod: I = !0, skipLastPeriod: L = !1 } = o, { filteredData: R, excludedIncompletePeriod: z, skippedLastPeriod: B, granularity: V } = m(F, N, s, I, L), H = A(R, w);
	if (H.length < 2) return /* @__PURE__ */ l(E, {
		height: c,
		variant: "warning",
		title: f("chart.runtime.kpiDelta.insufficientData"),
		hint: f("chart.runtime.kpiDelta.requiresTwoPoints"),
		children: /* @__PURE__ */ l("div", {
			className: "dc:text-xs",
			children: f("chart.runtime.kpiDelta.currentPoints", { count: H.length })
		})
	});
	let { lastValue: U, previousValue: W, absoluteChange: G, percentageChange: K, isPositiveChange: q } = j(H), J = (e) => y(e, o), Y = M(o.positiveColorIndex, d?.colors, "#10b981"), X = M(o.negativeColorIndex, d?.colors, "#ef4444"), Z = q ? Y : X, Q = z || B ? /* @__PURE__ */ l("span", {
		title: f(B ? "chart.runtime.kpiExcludesLastPeriod" : "chart.runtime.kpiExcludesIncompletePeriod", { period: V || f("chart.runtime.kpiPeriodFallback") }),
		className: "dc:cursor-help",
		children: /* @__PURE__ */ l(n, {
			icon: t,
			className: "dc:w-4 dc:h-4 text-dc-text-muted dc:opacity-70"
		})
	}) : null;
	return o.layout === "compact" ? /* @__PURE__ */ l(D, {
		containerRef: h,
		label: b(p(w), w),
		labelAdornment: Q,
		value: J(U),
		suffix: o.suffix && !o.formatValue ? o.suffix : void 0,
		valueAdornment: /* @__PURE__ */ u("span", {
			className: "dc:font-semibold dc:whitespace-nowrap",
			style: {
				color: Z,
				fontSize: "15px"
			},
			children: [
				q ? "▲" : "▼",
				" ",
				q ? "+" : "",
				K.toFixed(1),
				"%"
			]
		}),
		detail: o.showBaseline ? `${J(W)} \u2192 ${J(U)}` : void 0
	}) : /* @__PURE__ */ u("div", {
		ref: h,
		className: "dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full dc:h-full dc:p-4",
		style: T(c),
		children: [
			/* @__PURE__ */ u("div", {
				className: "text-dc-text-secondary dc:font-bold dc:text-center dc:mb-2 dc:flex dc:items-center dc:justify-center dc:gap-1",
				style: {
					fontSize: "14px",
					lineHeight: "1.2"
				},
				children: [/* @__PURE__ */ l("span", { children: b(p(w), w) }), Q]
			}),
			/* @__PURE__ */ u("div", {
				className: "dc:flex dc:items-center dc:justify-center dc:space-x-4 dc:mb-2",
				children: [/* @__PURE__ */ l("div", {
					ref: g,
					className: "dc:font-bold dc:leading-none",
					style: {
						fontSize: `${_}px`,
						color: "var(--dc-text)"
					},
					children: J(U)
				}), /* @__PURE__ */ u("div", {
					className: "dc:flex dc:items-center dc:space-x-1",
					children: [/* @__PURE__ */ l("div", {
						className: "dc:font-bold",
						style: {
							color: Z,
							fontSize: `${_ * .35}px`
						},
						children: q ? "▲" : "▼"
					}), /* @__PURE__ */ u("div", {
						className: "dc:text-left",
						children: [/* @__PURE__ */ u("div", {
							className: "dc:font-bold dc:leading-tight",
							style: {
								fontSize: `${_ * .35}px`,
								color: Z
							},
							children: [q ? "+" : "", J(G)]
						}), /* @__PURE__ */ u("div", {
							className: "dc:font-semibold dc:leading-tight",
							style: {
								fontSize: `${_ * .28}px`,
								color: Z,
								opacity: .8
							},
							children: [
								q ? "+" : "",
								K.toFixed(1),
								"%"
							]
						})]
					})]
				})]
			}),
			o.suffix && !o.formatValue && /* @__PURE__ */ l("div", {
				className: "text-dc-text-muted dc:text-center dc:mb-3",
				style: {
					fontSize: "14px",
					lineHeight: "1.2",
					opacity: .8
				},
				children: o.suffix
			}),
			o.showHistogram !== !1 && H.length > 2 && /* @__PURE__ */ l("div", {
				className: "dc:mt-2 dc:w-full dc:flex dc:justify-center dc:overflow-hidden",
				children: /* @__PURE__ */ l(P, {
					values: H,
					lastValue: U,
					positiveColor: Y,
					negativeColor: X,
					formatValue: J,
					width: v,
					height: 64
				})
			})
		]
	});
});
//#endregion
export { f as _, C as a, y as c, x as d, S as f, p as g, d as h, T as i, h as l, m, D as n, v as o, g as p, E as r, _ as s, N as t, b as u };

//# sourceMappingURL=chart-kpi-delta-D9xqKbwp.js.map