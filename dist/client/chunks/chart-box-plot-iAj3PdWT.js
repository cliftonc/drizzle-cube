import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { F as t, s as n, w as r } from "./chart-activity-grid-D6X0iOUw.js";
import i, { useLayoutEffect as a, useMemo as o, useRef as s, useState as c } from "react";
import { jsx as l, jsxs as u } from "react/jsx-runtime";
//#region src/client/components/charts/BoxPlotChart.tsx
var d = /* @__PURE__ */ e({ default: () => v }), f = 50;
function p(e) {
	if (e == null) return null;
	let t = typeof e == "number" ? e : parseFloat(String(e));
	return isNaN(t) ? null : t;
}
function m(e, t, n, r, i, a, o, s) {
	let c = p(e[t]), l = p(e[n]), u = p(e[r]), d = p(e[i]), f = p(e[a]);
	return c === null || l === null || u === null || d === null || f === null ? null : {
		label: o,
		min: c,
		q1: l,
		median: u,
		q3: d,
		max: f,
		color: s
	};
}
function h(e, t, n, r, i, a) {
	let o = p(e[t]), s = p(e[n]), c = p(e[r]);
	if (o === null || s === null || c === null) return null;
	let l = Math.abs(s);
	return {
		label: i,
		min: o - 2 * l,
		q1: o - l,
		median: c,
		q3: o + l,
		max: o + 2 * l,
		color: a
	};
}
function g({ x: e, boxWidth: t, minY: n, q1Y: r, medianY: i, q3Y: a, maxY: o, color: s, label: c }) {
	let d = t / 2, f = e, p = t * .4;
	return /* @__PURE__ */ u("g", {
		"data-testid": `box-${c}`,
		children: [
			/* @__PURE__ */ l("line", {
				x1: f,
				y1: n,
				x2: f,
				y2: o,
				stroke: s,
				strokeWidth: 1.5
			}),
			/* @__PURE__ */ l("line", {
				x1: f - p / 2,
				y1: n,
				x2: f + p / 2,
				y2: n,
				stroke: s,
				strokeWidth: 1.5
			}),
			/* @__PURE__ */ l("line", {
				x1: f - p / 2,
				y1: o,
				x2: f + p / 2,
				y2: o,
				stroke: s,
				strokeWidth: 1.5
			}),
			/* @__PURE__ */ l("rect", {
				x: f - d,
				y: Math.min(r, a),
				width: t,
				height: Math.abs(a - r) || 2,
				fill: s,
				fillOpacity: .3,
				stroke: s,
				strokeWidth: 1.5
			}),
			/* @__PURE__ */ l("line", {
				x1: f - d,
				y1: i,
				x2: f + d,
				y2: i,
				stroke: s,
				strokeWidth: 2.5,
				"data-testid": `median-${c}`
			})
		]
	});
}
function _({ scale: e, domainMin: t, domainMax: n, width: r, tickCount: i = 5, format: a }) {
	let s = o(() => {
		let e = n - t;
		if (e === 0) return [t];
		let r = e / (i - 1);
		return Array.from({ length: i }, (e, n) => t + n * r);
	}, [
		t,
		n,
		i
	]);
	return /* @__PURE__ */ u("g", {
		"data-testid": "y-axis",
		children: [s.map((t, n) => /* @__PURE__ */ u("g", {
			transform: `translate(0, ${e(t)})`,
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
					children: a ? a(t) : t.toLocaleString()
				}),
				/* @__PURE__ */ l("line", {
					x1: 0,
					x2: r,
					stroke: "currentColor",
					strokeOpacity: .1,
					strokeWidth: 1
				})
			]
		}, n)), /* @__PURE__ */ l("line", {
			y1: e(s[0]),
			y2: e(s[s.length - 1]),
			stroke: "currentColor",
			strokeWidth: 1
		})]
	});
}
var v = i.memo(function({ data: e, chartConfig: i, displayConfig: d = {}, height: v = "100%", colorPalette: y, onDataPointClick: b, drillEnabled: x }) {
	let { t: S } = t(), C = s(null), [w, T] = c({
		width: 0,
		height: 0
	});
	a(() => {
		let e = C.current;
		if (!e) return;
		let t = new ResizeObserver((e) => {
			for (let t of e) {
				let { width: e, height: n } = t.contentRect;
				e > 0 && n > 0 && T({
					width: e,
					height: n
				});
			}
		});
		t.observe(e);
		let n = e.getBoundingClientRect();
		return n.width > 0 && n.height > 0 && T({
			width: n.width,
			height: n.height
		}), () => t.disconnect();
	}, []);
	let E = d?.leftYAxisFormat, { xField: D, mode: O, fields: k, configError: A } = o(() => {
		let e = Array.isArray(i?.xAxis) ? i.xAxis[0] : i?.xAxis ?? i?.x, t = Array.isArray(i?.yAxis) ? i.yAxis : [];
		return !e || t.length === 0 ? {
			xField: e,
			mode: "none",
			fields: {},
			configError: "BoxPlot requires an X-Axis dimension and at least one measure in Y-Axis"
		} : t.length >= 5 ? {
			xField: e,
			mode: "5measure",
			fields: {
				minField: t[0],
				q1Field: t[1],
				medianField: t[2],
				q3Field: t[3],
				maxField: t[4]
			},
			configError: null
		} : t.length >= 3 ? {
			xField: e,
			mode: "3measure",
			fields: {
				avgField: t[0],
				stddevField: t[1],
				medianField: t[2]
			},
			configError: null
		} : t.length === 2 ? {
			xField: e,
			mode: "none",
			fields: {},
			configError: "BoxPlot requires 1 measure (auto), 3 (avg/stddev/median), or 5 (min/q1/median/q3/max)"
		} : {
			xField: e,
			mode: "auto",
			fields: { valueField: t[0] },
			configError: null
		};
	}, [i]), j = o(() => {
		if (A || !e || e.length === 0 || O === "none") return [];
		let t = e.slice(0, f), r = y?.colors ?? n, i = [];
		for (let e = 0; e < t.length; e++) {
			let n = t[e], a = D ? String(n[D] ?? `Row ${e + 1}`) : `Row ${e + 1}`, o = r[e % r.length], s = null;
			if (O === "5measure") s = m(n, k.minField, k.q1Field, k.medianField, k.q3Field, k.maxField, a, o);
			else if (O === "3measure") s = h(n, k.avgField, k.stddevField, k.medianField, a, o);
			else {
				let e = p(n[k.valueField]);
				e !== null && (s = {
					label: a,
					min: e,
					q1: e,
					median: e,
					q3: e,
					max: e,
					color: o
				});
			}
			s && i.push(s);
		}
		return i;
	}, [
		e,
		D,
		O,
		k,
		y,
		A
	]);
	if (!e || e.length === 0) return /* @__PURE__ */ l("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted",
		style: { height: v },
		children: /* @__PURE__ */ u("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ l("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: S("chart.runtime.noData")
			}), /* @__PURE__ */ l("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: S("chart.runtime.noDataHint.boxPlot")
			})]
		})
	});
	if (A) return /* @__PURE__ */ l("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-warning",
		style: { height: v },
		children: /* @__PURE__ */ u("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ l("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: S("chart.runtime.configError")
			}), /* @__PURE__ */ l("div", {
				className: "dc:text-xs",
				children: A
			})]
		})
	});
	if (j.length === 0) return /* @__PURE__ */ l("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted",
		style: { height: v },
		children: /* @__PURE__ */ u("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ l("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: S("chart.runtime.noValidData")
			}), /* @__PURE__ */ l("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: S("chart.runtime.noValidDataHint.boxPlot")
			})]
		})
	});
	try {
		let t = {
			top: 20,
			right: 20,
			bottom: 60,
			left: 60
		}, n = w.width || 600, i = typeof v == "number" ? v : w.height || 400, a = Math.max(n - t.left - t.right, 50), o = Math.max(i - t.top - t.bottom, 50), s = j.flatMap((e) => [e.min, e.max]), c = Math.min(...s), d = Math.max(...s), p = (d - c) * .1 || 1, m = c - p, h = d + p, y = h - m, T = (e) => y === 0 ? o / 2 : o - (e - m) / y * o, O = a / j.length, k = Math.min(O * .6, 40), A = e.length > f;
		return /* @__PURE__ */ u("div", {
			ref: C,
			className: "dc:relative dc:w-full",
			style: { height: v },
			children: [/* @__PURE__ */ l("svg", {
				width: "100%",
				height: A ? "calc(100% - 20px)" : "100%",
				viewBox: `0 0 ${n} ${typeof i == "number" ? i : 400}`,
				preserveAspectRatio: "none",
				"data-testid": "boxplot-svg",
				children: /* @__PURE__ */ u("g", {
					transform: `translate(${t.left}, ${t.top})`,
					children: [/* @__PURE__ */ l(_, {
						scale: T,
						domainMin: m,
						domainMax: h,
						width: a,
						tickCount: 5,
						format: E ? (e) => r(e, E) : void 0
					}), j.map((e, t) => {
						let n = O * t + O / 2;
						return /* @__PURE__ */ u("g", {
							onClick: (t) => {
								b && x && b({
									dataPoint: { ...e },
									clickedField: D ?? "",
									xValue: e.label,
									position: {
										x: t.clientX,
										y: t.clientY
									},
									nativeEvent: t
								});
							},
							cursor: x ? "pointer" : void 0,
							children: [
								/* @__PURE__ */ l("title", { children: `${e.label}: min=${e.min}, Q1=${e.q1}, median=${e.median}, Q3=${e.q3}, max=${e.max}` }),
								/* @__PURE__ */ l(g, {
									x: n,
									boxWidth: k,
									minY: T(e.min),
									q1Y: T(e.q1),
									medianY: T(e.median),
									q3Y: T(e.q3),
									maxY: T(e.max),
									color: e.color,
									label: e.label
								}),
								/* @__PURE__ */ l("text", {
									x: n,
									y: o + 20,
									textAnchor: "middle",
									fontSize: 11,
									fill: "currentColor",
									className: "text-dc-text-secondary",
									"data-testid": `x-label-${e.label}`,
									children: e.label
								})
							]
						}, `${e.label}-${t}`);
					})]
				})
			}), A && /* @__PURE__ */ l("div", {
				className: "dc:text-xs text-dc-warning dc:text-center dc:mt-1",
				children: S("chart.runtime.boxPlot.truncated", {
					max: f,
					total: e.length
				})
			})]
		});
	} catch (e) {
		return /* @__PURE__ */ l("div", {
			className: "dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full text-dc-error dc:p-4",
			style: { height: v },
			children: /* @__PURE__ */ u("div", {
				className: "dc:text-center",
				children: [
					/* @__PURE__ */ l("div", {
						className: "dc:text-sm dc:font-semibold dc:mb-1",
						children: S("chart.runtime.chartError", { chartType: "Box Plot Chart" })
					}),
					/* @__PURE__ */ l("div", {
						className: "dc:text-xs dc:mb-2",
						children: e instanceof Error ? e.message : S("chart.runtime.unknownError")
					}),
					/* @__PURE__ */ l("div", {
						className: "dc:text-xs text-dc-text-muted",
						children: S("chart.runtime.checkConfig")
					})
				]
			})
		});
	}
});
//#endregion
export { d as t };

//# sourceMappingURL=chart-box-plot-iAj3PdWT.js.map