import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { D as t, E as n, F as r, w as i } from "./chart-activity-grid-D6X0iOUw.js";
import { O as a } from "./chart-area-95fIdTeM.js";
import o, { useMemo as s } from "react";
import { Fragment as c, jsx as l, jsxs as u } from "react/jsx-runtime";
import { ResponsiveHeatMap as d } from "@nivo/heatmap";
function f(e) {
	if (e.startsWith("#")) {
		let t = e.slice(1);
		return {
			r: parseInt(t.substring(0, 2), 16),
			g: parseInt(t.substring(2, 4), 16),
			b: parseInt(t.substring(4, 6), 16)
		};
	}
	let t = e.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
	return t ? {
		r: parseInt(t[1], 10),
		g: parseInt(t[2], 10),
		b: parseInt(t[3], 10)
	} : null;
}
function p(e) {
	let t = f(e);
	if (!t) return .5;
	let n = t.r / 255, r = t.g / 255, i = t.b / 255, a = n <= .03928 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4, o = r <= .03928 ? r / 12.92 : ((r + .055) / 1.055) ** 2.4, s = i <= .03928 ? i / 12.92 : ((i + .055) / 1.055) ** 2.4;
	return .2126 * a + .7152 * o + .0722 * s;
}
function m(e) {
	return p(e) < .4 ? "#ffffff" : "#1f2937";
}
function h(e, t, r, i, a, o) {
	if (!t || !r || !i) return {
		data: [],
		truncated: !1,
		originalRows: 0,
		originalCols: 0
	};
	let s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Map();
	for (let u of e) {
		let e = u[r], d = u[t], f = n(e, o) || String(e ?? "(empty)"), p = n(d, a) || String(d ?? "(empty)"), m = Number(u[i]) || 0;
		c.add(p), l.has(p) || l.set(p, d), s.has(f) || s.set(f, /* @__PURE__ */ new Map()), s.get(f).set(p, m);
	}
	let u = Array.from(c).sort((e, t) => {
		let n = l.get(e), r = l.get(t);
		return typeof n == "string" && typeof r == "string" && n.match(/^\d{4}-\d{2}-\d{2}/) && r.match(/^\d{4}-\d{2}-\d{2}/) ? n.localeCompare(r) : e.localeCompare(t);
	}), d = s.size, f = u.length, p = d > 50 || f > 50, m = u.slice(0, 50), h = [], g = 0;
	for (let [e, t] of s) {
		if (g >= 50) break;
		h.push({
			id: e,
			data: m.map((e) => ({
				x: e,
				y: t.get(e) ?? null
			}))
		}), g++;
	}
	return {
		data: h,
		truncated: p,
		originalRows: d,
		originalCols: f
	};
}
function g(e) {
	if (e) return Array.isArray(e) ? e[0] : e;
}
function _(e) {
	let t = e;
	return {
		showLabels: t?.showLabels ?? !1,
		cellShape: t?.cellShape ?? "rect",
		showLegend: t?.showLegend ?? !0,
		xAxisFormat: t?.xAxisFormat,
		yAxisFormat: t?.yAxisFormat,
		valueFormat: t?.valueFormat
	};
}
function v(e) {
	if (e) return (t) => {
		let n = parseFloat(String(t));
		return isNaN(n) ? String(t) : i(n, e);
	};
}
function y(e) {
	return e ? (t) => i(t, e) : ">-.2s";
}
function b(e) {
	return e.length >= 2 ? {
		type: "sequential",
		colors: [e[0], e[e.length - 1]]
	} : {
		type: "sequential",
		scheme: "greens"
	};
}
var x = [
	"#eff3ff",
	"#c6dbef",
	"#9ecae1",
	"#6baed6",
	"#3182bd",
	"#08519c"
], S = {
	text: { fill: "var(--dc-text)" },
	axis: {
		legend: { text: { fill: "var(--dc-text)" } },
		ticks: { text: { fill: "var(--dc-text-secondary)" } }
	},
	legends: {
		text: { fill: "var(--dc-text-secondary)" },
		title: { text: { fill: "var(--dc-text)" } }
	},
	tooltip: { container: {
		background: "var(--dc-surface)",
		color: "var(--dc-text)",
		borderRadius: "4px",
		boxShadow: "0 1px 2px rgba(0, 0, 0, 0.25)"
	} }
};
function C({ data: e, truncated: t, colors: n, options: r, xAxisField: i, yAxisField: a, valueField: o }) {
	let { showLabels: s, cellShape: c, showLegend: u, xAxisFormat: f, yAxisFormat: p, valueFormat: h } = r;
	return /* @__PURE__ */ l(d, {
		data: e,
		margin: {
			top: t ? 40 : 20,
			right: 20,
			bottom: 120,
			left: 120
		},
		valueFormat: y(h),
		axisTop: null,
		axisRight: null,
		axisBottom: {
			tickSize: 5,
			tickPadding: 5,
			tickRotation: -45,
			legend: f?.label || i?.split(".").pop() || "X Axis",
			legendPosition: "middle",
			legendOffset: 70,
			format: v(f)
		},
		axisLeft: {
			tickSize: 5,
			tickPadding: 5,
			tickRotation: 0,
			legend: p?.label || a?.split(".").pop() || "Y Axis",
			legendPosition: "middle",
			legendOffset: -80,
			format: v(p)
		},
		colors: b(n),
		emptyColor: "var(--dc-surface-tertiary)",
		cellComponent: c === "circle" ? "circle" : "rect",
		enableLabels: s,
		labelTextColor: ({ color: e }) => m(e),
		legends: u ? [{
			anchor: "bottom",
			translateX: 0,
			translateY: 95,
			length: 400,
			thickness: 8,
			direction: "row",
			tickPosition: "after",
			tickSize: 3,
			tickSpacing: 4,
			tickOverlap: !1,
			title: o?.split(".").pop() || "Value",
			titleAlign: "start",
			titleOffset: 4
		}] : [],
		annotations: [],
		theme: S
	});
}
//#endregion
//#region src/client/components/charts/HeatMapChart.tsx
var w = /* @__PURE__ */ e({ default: () => T }), T = o.memo(function({ data: e, height: n = "100%", chartConfig: i, colorPalette: o, displayConfig: d, queryObject: f }) {
	let { t: p } = r(), m = _(d), v = g(i?.xAxis), y = g(i?.yAxis), b = g(i?.valueField), S = v ? t(f, v) : void 0, w = y ? t(f, y) : void 0, { data: T, truncated: E, originalRows: D, originalCols: O } = s(() => !e || e.length === 0 ? {
		data: [],
		truncated: !1,
		originalRows: 0,
		originalCols: 0
	} : h(e, v, y, b, S, w), [
		e,
		v,
		y,
		b,
		S,
		w
	]);
	if (!e || e.length === 0) return /* @__PURE__ */ l(a, {
		height: n,
		hint: p("chart.runtime.noDataHint.heatmap")
	});
	if (!v || !y || !b) return /* @__PURE__ */ l(a, {
		height: n,
		titleKey: "chart.runtime.heatmapConfigRequired",
		hint: /* @__PURE__ */ u(c, { children: [
			!v && p("chart.runtime.heatmapXRequired"),
			!y && p("chart.runtime.heatmapYRequired"),
			!b && p("chart.runtime.heatmapValueRequired")
		] })
	});
	if (T.length === 0) return /* @__PURE__ */ l(a, {
		height: n,
		titleKey: "chart.runtime.noDataToDisplay",
		hint: p("chart.runtime.heatmapNoResults")
	});
	let k = o?.gradient || x;
	return /* @__PURE__ */ u("div", {
		className: "dc:relative dc:w-full dc:h-full",
		style: { height: n },
		children: [E && /* @__PURE__ */ l("div", {
			className: "dc:absolute dc:top-0 dc:left-0 dc:right-0 dc:z-10 dc:px-3 dc:py-1.5 dc:text-xs bg-dc-warning-bg text-dc-warning dc:border-b border-dc-border",
			children: p("chart.runtime.heatmapTruncated", {
				maxRows: 50,
				maxCols: 50,
				originalRows: D,
				originalCols: O
			})
		}), /* @__PURE__ */ l(C, {
			data: T,
			truncated: E,
			colors: k,
			options: m,
			xAxisField: v,
			yAxisField: y,
			valueField: b
		})]
	});
});
//#endregion
export { w as t };

//# sourceMappingURL=chart-heat-map-Dq68agx8.js.map