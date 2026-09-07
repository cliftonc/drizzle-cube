import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { O as t, k as n } from "./chart-data-table-Bn9EtETl.js";
import { F as r, S as i } from "./chart-activity-grid-D6X0iOUw.js";
import { C as a, T as o, w as s } from "./chart-area-95fIdTeM.js";
import { a as c, c as l, d as u, f as d, i as f, l as p, m, n as h, o as g, p as _, r as v, s as ee, u as y } from "./chart-kpi-delta-D9xqKbwp.js";
import b, { useCallback as x, useMemo as S } from "react";
import { Fragment as te, jsx as C, jsxs as w } from "react/jsx-runtime";
//#region src/client/components/DataHistogram.tsx
function T(e, t, n, r) {
	let i = Array(r).fill(0), a = n - t;
	e.forEach((e) => {
		if (a === 0) i[Math.floor(r / 2)]++;
		else {
			let n = Math.floor((e - t) / a * (r - 1));
			n = Math.max(0, Math.min(r - 1, n)), i[n]++;
		}
	});
	let o = Math.max(...i), s = e.reduce((e, t) => e + t, 0) / e.length;
	return {
		buckets: i,
		range: a,
		maxBucketCount: o,
		average: s,
		averagePosition: a === 0 ? 50 : (s - t) / a * 100
	};
}
function E({ position: e, clamp: t = !1, color: n, zIndex: r, title: i }) {
	return /* @__PURE__ */ C("div", {
		className: "dc:absolute dc:top-0 dc:bottom-0 dc:pointer-events-none",
		style: {
			left: `${t ? Math.max(0, Math.min(100, e)) : e}%`,
			transform: "translateX(-50%)",
			width: "2px",
			backgroundColor: n,
			opacity: .8,
			zIndex: r
		},
		title: i,
		children: /* @__PURE__ */ C("div", {
			className: "dc:absolute dc:-top-1",
			style: {
				left: "50%",
				transform: "translateX(-50%)",
				width: "0",
				height: "0",
				borderLeft: "4px solid transparent",
				borderRight: "4px solid transparent",
				borderTop: `6px solid ${n}`
			}
		})
	});
}
function D({ values: e, min: t, max: n, color: i = "#1f2937", bucketCount: a = 12, height: o = 32, formatValue: s = (e) => e.toString(), width: c, showAverageIndicator: l = !0, targetValue: u }) {
	let { t: d } = r(), { buckets: f, range: p, maxBucketCount: m, average: h, averagePosition: g } = T(e, t, n, a), _ = u !== void 0 && p > 0 ? (u - t) / p * 100 : null, v = {
		width: c ? `${c}px` : "200px",
		minWidth: "200px"
	};
	return /* @__PURE__ */ w("div", {
		className: "dc:flex dc:flex-col dc:items-center",
		children: [
			/* @__PURE__ */ w("div", {
				className: "dc:relative dc:flex dc:items-end dc:justify-center dc:space-x-0.5",
				style: {
					height: `${o}px`,
					...v
				},
				children: [
					f.map((e, t) => {
						let n = m > 0 ? e / m : 0, r = .1;
						return /* @__PURE__ */ C("div", {
							className: "dc:flex-1 dc:rounded-t-sm dc:transition-all dc:duration-300 dc:ease-out",
							style: {
								height: `${(e > 0 ? Math.max(r, n) : r) * o}px`,
								backgroundColor: i,
								opacity: e > 0 ? .7 + n * .3 : .2
							},
							title: `${e} values in this range`
						}, t);
					}),
					l && /* @__PURE__ */ C(E, {
						position: g,
						color: "#ef4444",
						zIndex: 10,
						title: `Average: ${s(h)}`
					}),
					_ !== null && u !== void 0 && /* @__PURE__ */ C(E, {
						position: _,
						clamp: !0,
						color: "#10b981",
						zIndex: 11,
						title: `Target: ${s(u)}`
					})
				]
			}),
			/* @__PURE__ */ w("div", {
				className: "dc:flex dc:justify-between dc:mt-2 dc:text-xs text-dc-text-muted",
				style: v,
				children: [/* @__PURE__ */ C("span", { children: s(t) }), /* @__PURE__ */ C("span", { children: s(n) })]
			}),
			/* @__PURE__ */ C("div", {
				className: "dc:text-center dc:mt-1 dc:text-xs text-dc-text-muted",
				children: d("dataHistogram.average", { count: e.length })
			})
		]
	});
}
//#endregion
//#region src/client/components/charts/KpiNumber.tsx
var O = /* @__PURE__ */ e({ default: () => k }), k = b.memo(function({ data: e, chartConfig: b, displayConfig: T = {}, queryObject: E, height: O = "100%", colorPalette: k }) {
	let { t: A } = r(), j = i(), M = S(() => p(b?.yAxis), [b?.yAxis]), N = M[0] || "", P = E?.timeDimensions?.[0]?.dimension || void 0, F = S(() => _(e, P), [e, P]), { useLastCompletePeriod: I = !0, skipLastPeriod: L = !1 } = T, { filteredData: R, excludedIncompletePeriod: z, skippedLastPeriod: B, granularity: V } = S(() => F.length === 0 ? {
		filteredData: [],
		excludedIncompletePeriod: !1,
		skippedLastPeriod: !1,
		granularity: void 0
	} : m(F, P, E, I, L), [
		F,
		P,
		E,
		I,
		L
	]), H = R, U = S(() => ee(H, N), [H, N]), { avg: ne, min: re, max: ie } = S(() => g(U), [U]), W = x((e) => l(e, T), [T]), G = U.length === 1 ? U[0] : ne, ae = U.length > 1, K = S(() => u(T.valueColorIndex, k?.colors), [T.valueColorIndex, k?.colors]), q = S(() => o(T?.target || ""), [T?.target]), J = q.length > 0 ? q[0] : null, Y = J !== null && U.length > 0 ? a(G, J) : null, X = S(() => d(Y, T.positiveColorIndex, T.negativeColorIndex, k?.colors), [
		Y,
		T.positiveColorIndex,
		T.negativeColorIndex,
		k?.colors
	]), oe = T.layout === "compact", { containerRef: Z, valueRef: se, fontSize: Q, textWidth: ce } = c({
		widthDivisor: 5,
		heightDivisor: 4,
		minFontSize: 24,
		maxFontSize: 120,
		measureWidth: (e, t) => Math.max(e, Math.min(t * .6, 300)),
		deps: [e, b]
	});
	if (!e || e.length === 0) return /* @__PURE__ */ C(v, {
		height: O,
		title: A("chart.runtime.noData"),
		hint: A("chart.runtime.noDataHint.kpi")
	});
	if (M.length === 0) return /* @__PURE__ */ C(v, {
		height: O,
		variant: "danger",
		title: A("chart.runtime.configError"),
		hint: A("chart.runtime.configErrorHint.noMeasures")
	});
	let $ = z || B ? /* @__PURE__ */ C("span", {
		title: A(B ? "chart.runtime.kpiExcludesLastPeriod" : "chart.runtime.kpiExcludesIncompletePeriod", { period: V || A("chart.runtime.kpiPeriodFallback") }),
		className: "dc:cursor-help",
		children: /* @__PURE__ */ C(n, {
			icon: t,
			className: "dc:w-4 dc:h-4 text-dc-text-muted dc:opacity-70"
		})
	}) : null;
	return oe ? /* @__PURE__ */ C(h, {
		containerRef: Z,
		label: y(j(N), N),
		labelAdornment: $,
		value: U.length === 0 ? "—" : W(G),
		valueColor: U.length === 0 ? void 0 : K,
		suffix: T.suffix && !T.formatValue ? T.suffix : void 0,
		detail: J !== null && Y !== null ? /* @__PURE__ */ w(te, { children: [
			/* @__PURE__ */ C("span", {
				className: "dc:font-semibold",
				style: { color: X },
				children: s(Y, 1)
			}),
			" ",
			A("chart.runtime.kpiVsTarget", { target: W(J) })
		] }) : void 0
	}) : U.length === 0 ? /* @__PURE__ */ w("div", {
		ref: Z,
		className: "dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full dc:h-full dc:p-4",
		style: f(O),
		children: [
			/* @__PURE__ */ C("div", {
				className: "text-dc-text-secondary dc:font-bold dc:text-center dc:mb-3",
				style: {
					fontSize: "14px",
					lineHeight: "1.2"
				},
				children: j(N)
			}),
			/* @__PURE__ */ C("div", {
				className: "dc:font-bold dc:leading-none text-dc-text-muted",
				style: { fontSize: `${Q}px` },
				children: "—"
			}),
			/* @__PURE__ */ C("div", {
				className: "dc:text-xs text-dc-text-muted dc:mt-2",
				children: A("chart.runtime.noDataShort")
			})
		]
	}) : /* @__PURE__ */ w("div", {
		ref: Z,
		className: "dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full dc:h-full dc:p-4",
		style: f(O),
		children: [
			/* @__PURE__ */ w("div", {
				className: "text-dc-text-secondary dc:font-bold dc:text-center dc:mb-3 dc:flex dc:items-center dc:justify-center dc:gap-1",
				style: {
					fontSize: "14px",
					lineHeight: "1.2"
				},
				children: [/* @__PURE__ */ C("span", { children: y(j(N), N) }), $]
			}),
			/* @__PURE__ */ w("div", {
				className: "dc:flex dc:items-center dc:justify-center dc:gap-4 dc:mb-3",
				children: [/* @__PURE__ */ C("div", {
					ref: se,
					className: "dc:font-bold dc:leading-none",
					style: {
						fontSize: `${Q}px`,
						color: K
					},
					children: W(G)
				}), J !== null && Y !== null && /* @__PURE__ */ w("div", {
					className: "dc:flex dc:flex-col dc:items-start",
					children: [/* @__PURE__ */ C("div", {
						className: "dc:font-semibold",
						style: {
							fontSize: `${Math.max(12, Q * .3)}px`,
							color: X,
							lineHeight: "1.2"
						},
						children: s(Y, 1)
					}), /* @__PURE__ */ C("div", {
						className: "text-dc-text-muted dc:text-xs",
						style: {
							opacity: .7,
							fontSize: `${Math.max(10, Q * .2)}px`
						},
						children: A("chart.runtime.kpiVsTarget", { target: W(J) })
					})]
				})]
			}),
			T.suffix && !T.formatValue && /* @__PURE__ */ C("div", {
				className: "text-dc-text-muted dc:text-center",
				style: {
					fontSize: "14px",
					lineHeight: "1.2",
					opacity: .8
				},
				children: T.suffix
			}),
			ae && /* @__PURE__ */ C("div", {
				className: "dc:mt-4",
				children: /* @__PURE__ */ C(D, {
					values: U,
					min: re,
					max: ie,
					color: K,
					formatValue: W,
					height: 24,
					width: ce,
					targetValue: J || void 0
				})
			})
		]
	});
});
//#endregion
export { D as n, O as t };

//# sourceMappingURL=chart-kpi-number-C9o880lP.js.map