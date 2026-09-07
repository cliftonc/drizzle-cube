import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { F as t, w as n } from "./chart-activity-grid-D6X0iOUw.js";
import r, { useLayoutEffect as i, useMemo as a, useRef as o, useState as s } from "react";
import { Fragment as c, jsx as l, jsxs as u } from "react/jsx-runtime";
//#region src/client/components/charts/CandlestickChart.tsx
var d = /* @__PURE__ */ e({ default: () => y }), f = "#22c55e", p = "#ef4444", m = "#94a3b8", h = 200;
function g(e) {
	if (e == null) return null;
	let t = typeof e == "number" ? e : parseFloat(String(e));
	return isNaN(t) ? null : t;
}
function _({ x: e, candleWidth: t, openY: n, closeY: r, highY: i, lowY: a, isBullish: o, bullColor: s, bearColor: d, showWicks: f, label: p }) {
	let h = o ? s : d, g = Math.min(n, r), _ = Math.max(n, r), v = Math.max(_ - g, 1), y = t / 2;
	return /* @__PURE__ */ u("g", {
		"data-testid": `candle-${p}`,
		children: [/* @__PURE__ */ l("rect", {
			x: e - y,
			y: g,
			width: t,
			height: v,
			fill: h,
			"data-testid": `candle-body-${p}`,
			"data-bullish": o
		}), f && /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l("line", {
			x1: e,
			y1: i,
			x2: e,
			y2: g,
			stroke: m,
			strokeWidth: 1,
			"data-testid": `wick-high-${p}`
		}), /* @__PURE__ */ l("line", {
			x1: e,
			y1: _,
			x2: e,
			y2: a,
			stroke: m,
			strokeWidth: 1,
			"data-testid": `wick-low-${p}`
		})] })]
	});
}
function v({ domainMin: e, domainMax: t, innerHeight: n, tickCount: r, format: i }) {
	let o = a(() => {
		let n = (t - e) / (r - 1);
		return Array.from({ length: r }, (t, r) => e + r * n);
	}, [
		e,
		t,
		r
	]), s = (r) => n - (r - e) / (t - e) * n;
	return /* @__PURE__ */ u("g", {
		"data-testid": "y-axis",
		children: [/* @__PURE__ */ l("line", {
			y1: 0,
			y2: n,
			stroke: "currentColor",
			strokeWidth: 1
		}), o.map((e, t) => /* @__PURE__ */ u("g", {
			transform: `translate(0, ${s(e)})`,
			children: [
				/* @__PURE__ */ l("line", {
					x1: 0,
					x2: -6,
					stroke: "currentColor",
					strokeWidth: 1
				}),
				/* @__PURE__ */ l("text", {
					x: -10,
					textAnchor: "end",
					dominantBaseline: "middle",
					fontSize: 11,
					fill: "currentColor",
					className: "text-dc-text-secondary",
					children: i ? i(e) : e.toLocaleString()
				}),
				/* @__PURE__ */ l("line", {
					x1: 0,
					x2: "100%",
					stroke: "currentColor",
					strokeOpacity: .1,
					strokeWidth: 1
				})
			]
		}, t))]
	});
}
var y = r.memo(function({ data: e, chartConfig: r, displayConfig: c = {}, height: d = "100%", onDataPointClick: m, drillEnabled: y }) {
	let { t: b } = t(), x = o(null), [S, C] = s({
		width: 0,
		height: 0
	});
	i(() => {
		let e = x.current;
		if (!e) return;
		let t = new ResizeObserver((e) => {
			for (let t of e) {
				let { width: e, height: n } = t.contentRect;
				e > 0 && n > 0 && C({
					width: e,
					height: n
				});
			}
		});
		t.observe(e);
		let n = e.getBoundingClientRect();
		return n.width > 0 && n.height > 0 && C({
			width: n.width,
			height: n.height
		}), () => t.disconnect();
	}, []);
	let w = c?.bullColor ?? f, T = c?.bearColor ?? p, E = c?.showWicks ?? !0, D = c?.rangeMode ?? "ohlc", O = c?.leftYAxisFormat, { xField: k, openField: A, closeField: j, highField: M, lowField: N, configError: P } = a(() => {
		let e = Array.isArray(r?.xAxis) ? r.xAxis[0] : r?.xAxis ?? r?.x, t = Array.isArray(r?.yAxis) ? r.yAxis : [], n = t[0] ?? "", i = (D === "range" ? t[0] : t[1]) ?? "", a = (D === "range" ? t[0] : t[2]) ?? "", o = (D === "range" ? t[1] : t[3]) ?? "";
		return e ? D === "range" && (!a || !o) ? {
			xField: e,
			openField: n,
			closeField: i,
			highField: a,
			lowField: o,
			configError: "Range mode requires at least 2 measures (high, low) in Y-Axis"
		} : D === "ohlc" && (!n || !i) ? {
			xField: e,
			openField: n,
			closeField: i,
			highField: a,
			lowField: o,
			configError: "OHLC mode requires at least 2 measures (open, close) in Y-Axis"
		} : {
			xField: e,
			openField: n,
			closeField: i,
			highField: a,
			lowField: o,
			configError: null
		} : {
			xField: e,
			openField: n,
			closeField: i,
			highField: a,
			lowField: o,
			configError: "Candlestick chart requires an X-Axis (time or category dimension)"
		};
	}, [r, D]), F = a(() => {
		if (P || !e || e.length === 0) return [];
		let t = e.slice(0, h), n = [];
		for (let e = 0; e < t.length; e++) {
			let r = t[e], i = String(r[k] ?? `Bar ${e + 1}`), a = g(r[A]), o = g(r[j]);
			if (a === null || o === null) continue;
			let s = a, c = o, l = M ? g(r[M]) ?? Math.max(s, c) : Math.max(s, c), u = N ? g(r[N]) ?? Math.min(s, c) : Math.min(s, c);
			D === "range" && (s = u, c = l), n.push({
				label: i,
				open: s,
				close: c,
				high: Math.max(s, c, l),
				low: Math.min(s, c, u),
				isBullish: c >= s,
				originalIndex: e
			});
		}
		return n;
	}, [
		e,
		k,
		A,
		j,
		M,
		N,
		D,
		P
	]);
	try {
		if (!e || e.length === 0) return /* @__PURE__ */ l("div", {
			className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted",
			style: { height: d },
			children: /* @__PURE__ */ u("div", {
				className: "dc:text-center",
				children: [/* @__PURE__ */ l("div", {
					className: "dc:text-sm dc:font-semibold dc:mb-1",
					children: b("chart.runtime.noData")
				}), /* @__PURE__ */ l("div", {
					className: "dc:text-xs text-dc-text-secondary",
					children: b("chart.runtime.noDataHint.candlestick")
				})]
			})
		});
		if (P) return /* @__PURE__ */ l("div", {
			className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-warning",
			style: { height: d },
			children: /* @__PURE__ */ u("div", {
				className: "dc:text-center",
				children: [/* @__PURE__ */ l("div", {
					className: "dc:text-sm dc:font-semibold dc:mb-1",
					children: b("chart.runtime.configError")
				}), /* @__PURE__ */ l("div", {
					className: "dc:text-xs",
					children: P
				})]
			})
		});
		let t = {
			top: 20,
			right: 20,
			bottom: 60,
			left: 70
		}, r = S.width || 600, i = typeof d == "number" ? d : S.height || 400, a = Math.max(r - t.left - t.right, 50), o = Math.max((typeof i == "number" ? i : parseInt(String(i)) || 400) - t.top - t.bottom, 50), s = F.flatMap((e) => [e.low, e.high]), c = Math.min(...s), f = Math.max(...s), p = (f - c) * .05 || 1, g = c - p, C = f + p, D = (e) => o - (e - g) / (C - g) * o, A = a / F.length, j = Math.min(A * .7, 20), M = e.length > h;
		return /* @__PURE__ */ u("div", {
			ref: x,
			className: "dc:relative dc:w-full",
			style: { height: d },
			children: [/* @__PURE__ */ l("svg", {
				width: "100%",
				height: M ? "calc(100% - 20px)" : "100%",
				viewBox: `0 0 ${r} ${typeof i == "number" ? i : 400}`,
				"data-testid": "candlestick-svg",
				children: /* @__PURE__ */ u("g", {
					transform: `translate(${t.left}, ${t.top})`,
					children: [/* @__PURE__ */ l(v, {
						domainMin: g,
						domainMax: C,
						innerHeight: o,
						tickCount: 5,
						format: O ? (e) => n(e, O) : void 0
					}), F.map((e, t) => {
						let n = A * t + A / 2;
						return /* @__PURE__ */ u("g", {
							onClick: (t) => {
								m && y && m({
									dataPoint: { ...e },
									clickedField: k ?? "",
									xValue: e.label,
									position: {
										x: t.clientX,
										y: t.clientY
									},
									nativeEvent: t
								});
							},
							cursor: y ? "pointer" : void 0,
							children: [
								/* @__PURE__ */ l("title", { children: `${e.label}: O=${e.open} H=${e.high} L=${e.low} C=${e.close}` }),
								/* @__PURE__ */ l(_, {
									x: n,
									candleWidth: j,
									openY: D(e.open),
									closeY: D(e.close),
									highY: D(e.high),
									lowY: D(e.low),
									isBullish: e.isBullish,
									bullColor: w,
									bearColor: T,
									showWicks: E,
									label: e.label
								}),
								/* @__PURE__ */ l("text", {
									x: n,
									y: o + 20,
									textAnchor: "middle",
									fontSize: 10,
									fill: "currentColor",
									className: "text-dc-text-secondary",
									"data-testid": `x-label-${e.label}`,
									children: e.label
								})
							]
						}, e.label + t);
					})]
				})
			}), M && /* @__PURE__ */ l("div", {
				className: "dc:text-xs text-dc-warning dc:text-center dc:mt-1",
				children: b("chart.runtime.candlestick.truncated", {
					max: h,
					total: e.length
				})
			})]
		});
	} catch (e) {
		return /* @__PURE__ */ l("div", {
			className: "dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full text-dc-error dc:p-4",
			style: { height: d },
			children: /* @__PURE__ */ u("div", {
				className: "dc:text-center",
				children: [
					/* @__PURE__ */ l("div", {
						className: "dc:text-sm dc:font-semibold dc:mb-1",
						children: b("chart.runtime.chartError", { chartType: "Candlestick Chart" })
					}),
					/* @__PURE__ */ l("div", {
						className: "dc:text-xs dc:mb-2",
						children: e instanceof Error ? e.message : b("chart.runtime.unknownError")
					}),
					/* @__PURE__ */ l("div", {
						className: "dc:text-xs text-dc-text-muted",
						children: b("chart.runtime.checkConfig")
					})
				]
			})
		});
	}
});
//#endregion
export { d as t };

//# sourceMappingURL=chart-candlestick-Dj4L6c1I.js.map