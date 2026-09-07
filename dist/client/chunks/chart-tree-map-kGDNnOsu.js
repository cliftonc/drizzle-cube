import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { D as t, E as n, F as r, S as i, c as a, s as o, w as s } from "./chart-activity-grid-D6X0iOUw.js";
import { D as c, M as l, O as u, j as d, k as f } from "./chart-area-95fIdTeM.js";
import p, { useState as m } from "react";
import { jsx as h, jsxs as g } from "react/jsx-runtime";
import { Treemap as _ } from "recharts";
import { scaleOrdinal as v, scaleQuantize as y } from "d3";
//#region src/client/components/charts/TreeMapChart.helpers.ts
function b(e) {
	return e ? Array.isArray(e) ? e[0] : e : "";
}
function x(e) {
	return typeof e == "string" ? parseFloat(e) : e || 0;
}
function S(e) {
	return typeof e == "string" ? parseFloat(e) : e;
}
function C(e, r, i, s) {
	let c = b(r.xAxis), l = b(r.yAxis), u = Array.isArray(r.series) ? r.series[0] : r.series, d = t(i, c), f = (e) => n(e[c], d) || String(e[c]) || "Unknown";
	if (!u) return {
		treemapData: e.map((e, t) => ({
			name: f(e),
			size: x(e[l]),
			fill: s?.colors && s.colors[t % s.colors.length] || o[t % o.length]
		})),
		isNumericSeries: !1,
		seriesField: u
	};
	let p = e.map((e) => S(e[u])).filter((e) => !isNaN(e)), m = p.length === e.length && p.every((e) => typeof e == "number");
	if (m) {
		let t = y().domain([Math.min(...p), Math.max(...p)]).range(a);
		return {
			treemapData: e.map((e) => ({
				name: f(e),
				size: x(e[l]),
				fill: t(S(e[u])),
				series: String(e[u])
			})),
			isNumericSeries: m,
			seriesField: u
		};
	}
	let h = [...new Set(e.map((e) => String(e[u])))], g = v().domain(h).range(s?.colors || o);
	return {
		treemapData: e.map((e) => ({
			name: f(e),
			size: x(e[l]),
			fill: g(String(e[u])),
			series: String(e[u])
		})),
		isNumericSeries: m,
		seriesField: u
	};
}
function w(e) {
	return typeof e == "boolean" ? e ? "Active" : "Inactive" : e === "true" || e === "false" ? e === "true" ? "Active" : "Inactive" : String(e);
}
function T(e, t) {
	let n = e[0], r = Object.keys(n), i = r.find((e) => typeof n[e] == "string" || e.toLowerCase().includes("name") || e.toLowerCase().includes("label") || e.toLowerCase().includes("category")) || r[0], a = r.find((e) => e.toLowerCase().includes("size")) || r.find((e) => typeof n[e] == "number" && e !== i) || r[1];
	return a ? {
		treemapData: e.map((e, n) => ({
			name: w(e[i]),
			size: x(e[a]),
			fill: t?.colors && t.colors[n % t.colors.length] || o[n % o.length]
		})),
		isNumericSeries: !1,
		seriesField: void 0
	} : null;
}
function E(e, t, n, r) {
	let i = t?.xAxis && t?.yAxis ? C(e, t, n, r) : T(e, r);
	return i ? {
		...i,
		treemapData: i.treemapData.filter((e) => e.size != null && e.size > 0)
	} : null;
}
function D(e, t) {
	let n = e.map((e) => S(e[t]));
	return {
		min: Math.min(...n),
		max: Math.max(...n)
	};
}
function O(e, t) {
	return t ? s(e, t) : e.toFixed(2);
}
function k(e, t, n, r, i, s) {
	if (!n || !r) return [];
	if (i) {
		let { min: t, max: n } = D(e, r);
		return a.map((e, r) => {
			let i = r / (a.length - 1);
			return {
				value: O(t + (n - t) * i, s),
				type: "rect",
				color: e
			};
		});
	}
	let c = [...new Set(t.map((e) => e.series).filter(Boolean))];
	return c.length > 1 ? c.map((e, t) => ({
		value: e,
		type: "rect",
		color: o[t % o.length]
	})) : [];
}
function A(e, t) {
	return !t || typeof e == "string" && e.includes("%") ? e : typeof e == "number" ? e + 60 : `calc(${e} + 60px)`;
}
//#endregion
//#region src/client/components/charts/TreeMapContent.tsx
function j(e, t) {
	return e === null ? .8 : e === t ? 1 : .6;
}
function M(e, t) {
	return t ? s(e, t) : typeof e == "number" ? e.toLocaleString() : String(e);
}
function N({ treemapData: e, colorPalette: t, hoveredIndex: n, setHoveredIndex: r, leftYAxisFormat: i, drillEnabled: a, onDataPointClick: s, queryObject: c, chartConfig: l }) {
	return function(u) {
		let { x: d, y: f, width: p, height: m, index: _, name: v, size: y } = u;
		if (p < 20 || m < 20) return null;
		let b = (t) => {
			t.stopPropagation();
			let n = e[_];
			n && s && s({
				dataPoint: n,
				clickedField: c?.measures?.[0] || l?.yAxis?.[0] || "",
				xValue: v,
				position: {
					x: t.clientX,
					y: t.clientY
				},
				nativeEvent: t
			});
		}, x = e[_]?.fill || t?.colors && t.colors[_ % t.colors.length] || o[_ % o.length];
		return /* @__PURE__ */ g("g", { children: [/* @__PURE__ */ h("rect", {
			x: d,
			y: f,
			width: p,
			height: m,
			style: {
				fill: x,
				fillOpacity: j(n, _),
				stroke: "#fff",
				strokeWidth: 2,
				cursor: a ? "pointer" : "default",
				pointerEvents: "all"
			},
			onMouseEnter: () => r(_),
			onMouseLeave: () => r(null),
			onClick: a && s ? b : void 0
		}), /* @__PURE__ */ h("foreignObject", {
			x: d,
			y: f,
			width: p,
			height: m,
			style: {
				pointerEvents: "none",
				overflow: "visible"
			},
			children: /* @__PURE__ */ g("div", {
				style: {
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					padding: "4px",
					boxSizing: "border-box",
					color: "#ffffff",
					textShadow: "0 1px 2px rgba(0,0,0,0.8)",
					fontFamily: "system-ui, -apple-system, sans-serif",
					overflow: "hidden"
				},
				children: [p > 40 && m > 30 && /* @__PURE__ */ h("div", {
					style: {
						fontSize: `${Math.max(10, Math.min(p / 8, m / 8, 16))}px`,
						fontWeight: "600",
						textAlign: "center",
						lineHeight: "1.2",
						marginBottom: p > 60 && m > 45 ? "4px" : "0",
						wordBreak: "break-word",
						hyphens: "auto"
					},
					children: v
				}), p > 60 && m > 45 && /* @__PURE__ */ h("div", {
					style: {
						fontSize: `${Math.max(8, Math.min(p / 10, m / 10, 14))}px`,
						textAlign: "center",
						opacity: .9
					},
					children: M(y, i)
				})]
			})
		})] });
	};
}
//#endregion
//#region src/client/components/charts/TreeMapLegend.tsx
function P({ seriesLabel: e, data: t, seriesField: n, leftYAxisFormat: r }) {
	let { min: i, max: o } = D(t, n);
	return /* @__PURE__ */ g("div", {
		className: "dc:flex dc:flex-col dc:items-center",
		children: [/* @__PURE__ */ h("div", {
			className: "dc:text-xs dc:font-semibold text-dc-text-primary dc:mb-2",
			children: e
		}), /* @__PURE__ */ g("div", {
			className: "dc:flex dc:items-center dc:gap-2",
			children: [
				/* @__PURE__ */ h("span", {
					className: "dc:text-xs text-dc-text-muted",
					children: O(i, r)
				}),
				/* @__PURE__ */ h("div", {
					className: "dc:h-4 dc:rounded-sm",
					style: {
						width: "200px",
						background: `linear-gradient(to right, ${a.join(", ")})`
					}
				}),
				/* @__PURE__ */ h("span", {
					className: "dc:text-xs text-dc-text-muted",
					children: O(o, r)
				})
			]
		})]
	});
}
function F({ legendPayload: e }) {
	return /* @__PURE__ */ h("div", {
		className: "dc:flex dc:flex-wrap dc:justify-center dc:gap-4",
		children: e.map((e, t) => /* @__PURE__ */ g("div", {
			className: "dc:flex dc:items-center dc:gap-2",
			children: [/* @__PURE__ */ h("div", {
				className: "dc:w-3 dc:h-3 rounded-xs",
				style: { backgroundColor: e.color }
			}), /* @__PURE__ */ h("span", {
				className: "dc:text-xs text-dc-text-muted",
				children: e.value
			})]
		}, t))
	});
}
function I({ isNumericSeries: e, seriesField: t, seriesLabel: n, legendPayload: r, data: i, leftYAxisFormat: a }) {
	return /* @__PURE__ */ h("div", {
		className: "dc:flex dc:justify-center dc:items-center dc:mt-4 dc:pb-2",
		children: e && t ? /* @__PURE__ */ h(P, {
			seriesLabel: n,
			data: i,
			seriesField: t,
			leftYAxisFormat: a
		}) : /* @__PURE__ */ h(F, { legendPayload: r })
	});
}
//#endregion
//#region src/client/components/charts/TreeMapChart.tsx
var L = /* @__PURE__ */ e({ default: () => R }), R = p.memo(function({ data: e, chartConfig: t, displayConfig: n = {}, queryObject: a, height: o = "100%", colorPalette: p, onDataPointClick: v, drillEnabled: y }) {
	let { t: b } = r(), [x, S] = m(null), C = i();
	try {
		let r = {
			showTooltip: n?.showTooltip ?? !0,
			showLegend: n?.showLegend ?? !0,
			leftYAxisFormat: n?.leftYAxisFormat
		};
		if (!e || e.length === 0) return /* @__PURE__ */ h(u, {
			height: o,
			hint: b("chart.runtime.noDataHint.treemap")
		});
		let i = E(e, t, a, p);
		if (!i) return /* @__PURE__ */ h(c, {
			height: o,
			hint: b("chart.runtime.configErrorHint.treemapNumeric")
		});
		let { treemapData: f, isNumericSeries: m, seriesField: w } = i;
		if (f.length === 0) return /* @__PURE__ */ h(u, {
			height: o,
			titleKey: "chart.runtime.noValidData",
			hint: "No valid data points for treemap chart after transformation"
		});
		let T = N({
			treemapData: f,
			colorPalette: p,
			hoveredIndex: x,
			setHoveredIndex: S,
			leftYAxisFormat: r.leftYAxisFormat,
			drillEnabled: y,
			onDataPointClick: v,
			queryObject: a,
			chartConfig: t
		}), D = k(e, f, r.showLegend, w, m, r.leftYAxisFormat), O = r.showLegend && D.length > 0, j = A(o, O);
		return /* @__PURE__ */ g("div", {
			className: "dc:w-full",
			style: { height: j },
			children: [/* @__PURE__ */ h(l, {
				height: O ? "calc(100% - 50px)" : "100%",
				children: /* @__PURE__ */ h(_, {
					data: f,
					dataKey: "size",
					aspectRatio: 4 / 3,
					stroke: "#fff",
					content: /* @__PURE__ */ h(T, {}),
					children: r.showTooltip && /* @__PURE__ */ h(d, { formatter: r.leftYAxisFormat ? (e, t) => [s(e, r.leftYAxisFormat), t] : void 0 })
				})
			}), O && /* @__PURE__ */ h(I, {
				isNumericSeries: m,
				seriesField: w,
				seriesLabel: w ? C(w) : "",
				legendPayload: D,
				data: e,
				leftYAxisFormat: r.leftYAxisFormat
			})]
		});
	} catch (e) {
		return /* @__PURE__ */ h(f, {
			height: o,
			chartType: "TreeMap Chart",
			error: e
		});
	}
});
//#endregion
export { L as n, R as t };

//# sourceMappingURL=chart-tree-map-kGDNnOsu.js.map