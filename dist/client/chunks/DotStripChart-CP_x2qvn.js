import { F as e, S as t, o as n, s as r, w as i } from "./chart-activity-grid-D6X0iOUw.js";
import { D as a, O as o, k as s } from "./chart-area-95fIdTeM.js";
import c, { useMemo as l, useState as u } from "react";
import { jsx as d, jsxs as f } from "react/jsx-runtime";
var p = {
	small: 3.5,
	medium: 5,
	large: 7
}, m = 1.5;
function h(e) {
	if (e == null || e === "") return null;
	let t = typeof e == "number" ? e : parseFloat(String(e));
	return Number.isFinite(t) ? t : null;
}
function g(e) {
	let t = e.length;
	if (t === 0) return null;
	let n = Math.floor(t / 2);
	return t % 2 == 0 ? (e[n - 1] + e[n]) / 2 : e[n];
}
function _(e) {
	if (e === 0) return 0;
	let t = Math.ceil(e / 2);
	return e % 2 == 1 ? t : -t;
}
function v(e, t, n) {
	let r = 2 * n + m, i = 2 * n + m, a = [...e].sort((e, t) => e.value - t.value || e.label.localeCompare(t.label)), o = /* @__PURE__ */ new Map(), s = [];
	for (let e of a) {
		let n = t(e.value), a = _(16);
		for (let e = 0; e <= 16; e++) {
			let t = _(e), i = o.get(t);
			if (!i || i.every((e) => Math.abs(n - e) >= r)) {
				a = t;
				break;
			}
		}
		let c = o.get(a);
		c ? c.push(n) : o.set(a, [n]), s.push({
			...e,
			x: n,
			lane: a,
			y: a * i
		});
	}
	return s;
}
function y(e, t) {
	let n = e.reduce((e, t) => Math.max(e, Math.abs(t.lane)), 0), r = 2 * t + m, i = (2 * n + 1) * r + 24;
	return Math.min(Math.max(i, 44), 220);
}
function b(e, t, n) {
	return e === null || t === null || n < 2 || e <= 0 ? null : t / e;
}
function x(e, t, n, r, i) {
	let a = [], o = /* @__PURE__ */ new Map();
	for (let i of e) {
		let e = String(i[t] ?? "");
		o.has(e) || (o.set(e, []), a.push(e));
		let s = h(i[n]);
		s !== null && o.get(e).push({
			value: s,
			label: r ? String(i[r] ?? "") : e,
			row: i
		});
	}
	let s = a.map((e) => {
		let t = o.get(e);
		return {
			label: e,
			values: t.slice(0, 500),
			truncated: t.length > 500
		};
	});
	if (i !== "none") {
		let e = (e) => g(e.map((e) => e.value).sort((e, t) => e - t));
		s = [...s].sort((t, n) => {
			if (i === "count") return n.values.length - t.values.length;
			let r = e(t.values), a = e(n.values);
			return r === null && a === null ? 0 : r === null ? 1 : a === null ? -1 : i === "valueDesc" ? a - r : r - a;
		});
	}
	return s.slice(0, 50);
}
function ee(e) {
	if (e.length === 0) return {
		min: 0,
		max: 1
	};
	let t = Math.min(...e), n = Math.max(...e);
	if (t === n) {
		let e = Math.abs(t) * .1 || 1;
		return {
			min: t - e,
			max: n + e
		};
	}
	let r = (n - t) * .1;
	return {
		min: t - r,
		max: n + r
	};
}
function S(e, t, n = 5) {
	if (t === e) return [e];
	let r = (t - e) / (n - 1);
	return Array.from({ length: n }, (t, n) => e + n * r);
}
//#endregion
//#region src/client/components/charts/DotStripChart.tsx
var C = 190, w = 44, T = 24, te = 60, ne = 36;
function E(e) {
	return Array.isArray(e) ? typeof e[0] == "string" ? e[0] : void 0 : typeof e == "string" && e !== "" ? e : void 0;
}
function re({ band: e, width: t, radius: n, ticks: r, scale: i, showGrid: a, showMedianMarker: o, showExtremeLabels: s, color: c, accentColor: u, drillEnabled: p, onDotClick: m, onDotHover: h, onDotLeave: g }) {
	let _ = e.height / 2, v = l(() => {
		if (!s || e.dots.length < 2) return /* @__PURE__ */ new Set();
		let t = [...e.dots].sort((e, t) => e.value - t.value);
		return /* @__PURE__ */ new Set([t[0], t[t.length - 1]]);
	}, [e.dots, s]);
	return /* @__PURE__ */ f("svg", {
		width: t,
		height: e.height,
		viewBox: `0 0 ${t} ${e.height}`,
		"data-testid": `dot-strip-band-${e.label}`,
		children: [
			a && r.map((t, n) => /* @__PURE__ */ d("line", {
				x1: i(t),
				x2: i(t),
				y1: 0,
				y2: e.height,
				stroke: "currentColor",
				strokeOpacity: .08,
				strokeWidth: 1,
				className: "text-dc-text-secondary"
			}, n)),
			e.dots.length > 0 && /* @__PURE__ */ d("line", {
				x1: i(e.min),
				x2: i(e.max),
				y1: _,
				y2: _,
				stroke: "currentColor",
				strokeOpacity: .25,
				strokeWidth: 1,
				className: "text-dc-text-secondary"
			}),
			o && e.median !== null && /* @__PURE__ */ d("line", {
				x1: i(e.median),
				x2: i(e.median),
				y1: _ - Math.min(_ - 2, 16),
				y2: _ + Math.min(_ - 2, 16),
				stroke: "currentColor",
				strokeOpacity: .55,
				strokeWidth: 2,
				className: "text-dc-text-secondary",
				"data-testid": `dot-strip-median-${e.label}`
			}),
			e.dots.map((t, r) => {
				let i = v.has(t);
				return /* @__PURE__ */ f("g", { children: [/* @__PURE__ */ d("circle", {
					cx: t.x,
					cy: _ + t.y,
					r: n,
					fill: i ? u : c,
					stroke: "var(--dc-surface, #ffffff)",
					strokeWidth: 1.25,
					cursor: p ? "pointer" : void 0,
					"data-testid": "dot-strip-dot",
					onClick: (n) => m(e, t, n),
					onMouseEnter: (n) => h(e, t, n),
					onMouseLeave: g
				}), i && /* @__PURE__ */ d("text", {
					x: t.x,
					y: _ + t.y + (t.y <= 0 ? -n - 6 : n + 14),
					textAnchor: "middle",
					fontSize: 11,
					fill: u,
					"data-testid": `dot-strip-extreme-${t.label}`,
					children: t.label
				})] }, `${t.label}-${r}`);
			})
		]
	});
}
var D = c.memo(function({ data: m, chartConfig: h, displayConfig: _ = {}, height: D = "100%", colorPalette: O, onDataPointClick: k, drillEnabled: A }) {
	let { t: j } = e(), M = t(), { containerRef: N, dimensions: ie } = n(), [P, F] = u(null), ae = _.showGrid !== !1, I = _.showTooltip !== !1, oe = _.showMedianMarker !== !1, L = _.showBandStats !== !1, R = _.showExtremeLabels === !0, z = p[_.dotSize ?? "medium"] ?? p.medium, B = _.bandSort ?? "none", V = _.xAxisFormat, { bandField: H, valueField: U, labelField: W, configError: G } = l(() => {
		let e = E(h?.xAxis) ?? E(h?.x), t = E(h?.yAxis) ?? E(h?.y), n = E(h?.series);
		return !e || !t ? {
			bandField: e,
			valueField: t,
			labelField: n,
			configError: j("chart.runtime.configErrorHint.dotStrip")
		} : {
			bandField: e,
			valueField: t,
			labelField: n,
			configError: null
		};
	}, [h, j]), K = Math.max((ie.width || 720) - C - T, 80), q = L ? te : ne, { bands: J, ticks: Y, scale: X, truncated: se } = l(() => {
		let e = {
			bands: [],
			ticks: [],
			scale: (e) => 0,
			truncated: !1
		};
		if (G || !H || !U || !m || m.length === 0) return e;
		let t = m, n = x(t, H, U, W, B), r = ee(n.flatMap((e) => e.values.map((e) => e.value))), i = r.max - r.min, a = Math.max(K - 2 * z - 2, 10), o = (e) => z + 1 + (i === 0 ? a / 2 : (e - r.min) / i * a);
		return {
			bands: n.map((e) => {
				let t = v(e.values, o, z), n = e.values.map((e) => e.value).sort((e, t) => e - t), r = n.length > 0 ? n[0] : null, i = n.length > 0 ? n[n.length - 1] : null;
				return {
					label: e.label,
					dots: t,
					count: t.length,
					median: g(n),
					min: r,
					max: i,
					spread: b(r, i, t.length),
					noData: t.length === 0,
					height: Math.max(y(t, z), q),
					truncated: e.truncated
				};
			}),
			ticks: S(r.min, r.max, 5),
			scale: o,
			truncated: new Set(t.map((e) => String(e[H] ?? ""))).size > 50
		};
	}, [
		m,
		H,
		U,
		W,
		B,
		G,
		K,
		z,
		q
	]), Z = O?.colors ?? r, ce = Z[0], le = Z[+(Z.length > 1)], Q = (e) => i(e, V), $ = (e, t, n) => {
		!k || !A || !H || k({
			dataPoint: t.row,
			clickedField: H,
			xValue: e.label,
			position: {
				x: n.clientX,
				y: n.clientY
			},
			nativeEvent: n
		});
	}, ue = (e, t, n) => {
		I && F({
			band: e.label,
			dot: t,
			clientX: n.clientX,
			clientY: n.clientY
		});
	};
	if (G) return /* @__PURE__ */ d(a, {
		height: D,
		hint: G
	});
	if (!m || m.length === 0) return /* @__PURE__ */ d(o, {
		height: D,
		hint: j("chart.runtime.noDataHint.dotStrip")
	});
	if (J.length === 0) return /* @__PURE__ */ d(o, {
		height: D,
		titleKey: "chart.runtime.noValidData",
		hint: j("chart.runtime.noValidDataHint.dotStrip")
	});
	try {
		return /* @__PURE__ */ f("div", {
			ref: N,
			className: "dc:relative dc:w-full dc:overflow-y-auto",
			style: { height: D },
			children: [
				/* @__PURE__ */ f("div", {
					className: "dc:grid dc:items-stretch",
					style: { gridTemplateColumns: `${C}px 1fr` },
					"data-testid": "dot-strip-grid",
					children: [
						J.map((e) => /* @__PURE__ */ f(c.Fragment, { children: [/* @__PURE__ */ f("div", {
							className: "dc:flex dc:flex-col dc:justify-center dc:gap-1 dc:pr-3 dc:py-2 dc:border-b border-dc-border",
							style: { minHeight: e.height },
							children: [/* @__PURE__ */ d("div", {
								className: "dc:text-sm dc:font-semibold dc:truncate text-dc-text",
								title: e.label,
								children: e.label || j("chart.runtime.dotStrip.unlabelledBand")
							}), L && /* @__PURE__ */ f("div", {
								className: "dc:flex dc:flex-wrap dc:gap-1 dc:text-xs",
								children: [/* @__PURE__ */ d("span", {
									className: "dc:rounded-sm dc:px-1.5 dc:py-0.5 bg-dc-surface-secondary text-dc-text-secondary",
									children: j(e.truncated ? "chart.runtime.dotStrip.countTruncated" : "chart.runtime.dotStrip.count", { count: e.count })
								}), e.noData ? /* @__PURE__ */ d("span", {
									className: "dc:rounded-sm dc:px-1.5 dc:py-0.5 bg-dc-surface-secondary text-dc-text-muted",
									children: j("chart.runtime.dotStrip.noDataRecorded")
								}) : e.spread !== null && /* @__PURE__ */ d("span", {
									className: "dc:rounded-sm dc:px-1.5 dc:py-0.5 bg-dc-surface-secondary text-dc-text-secondary",
									children: j("chart.runtime.dotStrip.spread", { spread: e.spread.toFixed(2) })
								})]
							})]
						}), /* @__PURE__ */ d("div", {
							className: "dc:flex dc:items-center dc:border-b border-dc-border",
							style: {
								minHeight: e.height,
								paddingRight: T
							},
							children: /* @__PURE__ */ d(re, {
								band: e,
								width: K,
								radius: z,
								ticks: Y,
								scale: X,
								showGrid: ae,
								showMedianMarker: oe,
								showExtremeLabels: R,
								color: ce,
								accentColor: le,
								drillEnabled: A === !0,
								onDotClick: $,
								onDotHover: ue,
								onDotLeave: () => F(null)
							})
						})] }, e.label)),
						/* @__PURE__ */ d("div", {}),
						/* @__PURE__ */ d("div", {
							style: { paddingRight: T },
							children: /* @__PURE__ */ f("svg", {
								width: K,
								height: w,
								viewBox: `0 0 ${K} ${w}`,
								"data-testid": "dot-strip-axis",
								children: [
									/* @__PURE__ */ d("line", {
										x1: 0,
										x2: K,
										y1: 1,
										y2: 1,
										stroke: "currentColor",
										strokeOpacity: .2,
										className: "text-dc-text-secondary"
									}),
									Y.map((e, t) => /* @__PURE__ */ f("g", {
										transform: `translate(${X(e)}, 0)`,
										children: [/* @__PURE__ */ d("line", {
											y1: 1,
											y2: 7,
											stroke: "currentColor",
											strokeOpacity: .4,
											className: "text-dc-text-secondary"
										}), /* @__PURE__ */ d("text", {
											y: 22,
											textAnchor: "middle",
											fontSize: 11,
											fill: "currentColor",
											className: "text-dc-text-secondary",
											children: Q(e)
										})]
									}, t)),
									U && /* @__PURE__ */ d("text", {
										x: K / 2,
										y: 39,
										textAnchor: "middle",
										fontSize: 11,
										fill: "currentColor",
										className: "text-dc-text-muted",
										children: M(U)
									})
								]
							})
						})
					]
				}),
				se && /* @__PURE__ */ d("div", {
					className: "dc:text-xs text-dc-warning dc:text-center dc:mt-1",
					children: j("chart.runtime.dotStrip.truncated", { max: 50 })
				}),
				I && P && /* @__PURE__ */ f("div", {
					className: "dc:fixed dc:z-50 dc:pointer-events-none dc:rounded-sm dc:px-2 dc:py-1 dc:text-xs dc:shadow-lg bg-dc-surface text-dc-text dc:border border-dc-border",
					style: {
						left: P.clientX + 12,
						top: P.clientY + 12
					},
					"data-testid": "dot-strip-tooltip",
					children: [
						/* @__PURE__ */ d("div", {
							className: "dc:font-semibold",
							children: P.dot.label
						}),
						/* @__PURE__ */ d("div", {
							className: "text-dc-text-secondary",
							children: P.band
						}),
						/* @__PURE__ */ d("div", { children: Q(P.dot.value) })
					]
				})
			]
		});
	} catch (e) {
		return /* @__PURE__ */ d(s, {
			height: D,
			chartType: "Dot Strip Chart",
			error: e
		});
	}
});
//#endregion
export { D as default };

//# sourceMappingURL=DotStripChart-CP_x2qvn.js.map