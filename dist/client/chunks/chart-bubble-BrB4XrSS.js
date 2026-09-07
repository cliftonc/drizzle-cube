import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { F as t, S as n, a as r, c as i, h as a, i as o, l as s, n as c, o as l, r as u, s as d, w as f, x as p, y as m } from "./chart-activity-grid-D6X0iOUw.js";
import h, { useCallback as g, useEffect as _, useMemo as v, useSyncExternalStore as y } from "react";
import { jsx as b, jsxs as x } from "react/jsx-runtime";
import { axisBottom as S, axisLeft as C, extent as w, max as T, scaleLinear as E, scaleOrdinal as D, scaleQuantize as O, scaleSqrt as k, select as A } from "d3";
//#region src/client/hooks/useTheme.ts
var j = {
	listeners: /* @__PURE__ */ new Set(),
	subscribe(e) {
		return this.listeners.add(e), () => this.listeners.delete(e);
	},
	notify() {
		this.listeners.forEach((e) => e());
	}
};
p(() => {
	j.notify();
});
function M() {
	return {
		theme: y(j.subscribe.bind(j), a, a),
		setTheme: g((e) => {
			m(e), j.notify();
		}, [])
	};
}
//#endregion
//#region src/client/components/charts/BubbleChart.render.ts
function N(e, t, n) {
	if (t && e.length > 0) {
		let t = e.map((e) => typeof e.color == "string" ? parseFloat(e.color) : e.color).filter((e) => !isNaN(e)), r = t.length === e.length && t.every((e) => typeof e == "number");
		if (r) return {
			colorScale: O().domain([Math.min(...t), Math.max(...t)]).range(n?.gradient || i),
			isNumericColorField: r,
			uniqueColors: []
		};
		let a = [...new Set(e.map((e) => String(e.color)))];
		return {
			colorScale: D().domain(a).range(n?.colors || d),
			isNumericColorField: r,
			uniqueColors: a
		};
	}
	return {
		colorScale: D().domain(["default"]).range([d[0]]),
		isNumericColorField: !1,
		uniqueColors: []
	};
}
function P(e, t) {
	let n = new Date(e);
	if (isNaN(n.getTime())) return String(e);
	let r = n.getUTCFullYear(), i = String(n.getUTCMonth() + 1).padStart(2, "0"), a = String(n.getUTCDate()).padStart(2, "0");
	switch (t?.toLowerCase()) {
		case "year": return String(r);
		case "quarter": return `${r}-Q${Math.floor(n.getUTCMonth() / 3) + 1}`;
		case "month": return `${r}-${i}`;
		case "week":
		case "day": return `${r}-${i}-${a}`;
		case "hour": return `${i}-${a} ${String(n.getUTCHours()).padStart(2, "0")}:00`;
		default: return `${r}-${i}`;
	}
}
function F(e, t, n, r, i, a) {
	let o = (e) => {
		e.selectAll("line").style("stroke", a).style("stroke-dasharray", "3,3").style("opacity", .3), e.select(".domain").style("stroke", "none");
	};
	o(e.append("g").attr("transform", `translate(0,${i})`).call(S(t).tickSize(-i).tickFormat(() => ""))), o(e.append("g").call(C(n).tickSize(-r).tickFormat(() => "")));
}
function I(e, t, n, r, i, a, o, s) {
	let { fields: c, options: l, queryObject: u, getFieldLabel: d } = e, p = u?.timeDimensions?.some((e) => e.dimension === c.xAxisField) || !1, m = u?.timeDimensions?.find((e) => e.dimension === c.xAxisField)?.granularity, h = S(n);
	p ? h.tickFormat((e) => P(e, m)) : l.xAxisFormat && h.tickFormat((e) => f(e, l.xAxisFormat));
	let g = t.append("g").attr("transform", `translate(0,${a})`).call(h);
	g.selectAll("text").style("fill", o), g.selectAll("line, path").style("stroke", s), g.append("text").attr("x", i / 2).attr("y", 35).attr("fill", o).style("text-anchor", "middle").style("font-size", "12px").text(l.xAxisFormat?.label || d(c.xAxisField));
	let _ = C(r);
	l.leftYAxisFormat && _.tickFormat((e) => f(e, l.leftYAxisFormat));
	let v = t.append("g").call(_);
	v.selectAll("text").style("fill", o), v.selectAll("line, path").style("stroke", s), v.append("text").attr("transform", "rotate(-90)").attr("y", -35).attr("x", -a / 2).attr("fill", o).style("text-anchor", "middle").style("font-size", "12px").text(l.leftYAxisFormat?.label || d(c.yAxisField));
}
function L() {
	return A("body").append("div").attr("class", "bubble-chart-tooltip").style("position", "absolute").style("padding", "8px").style("background", "rgba(0, 0, 0, 0.8)").style("color", "white").style("border-radius", "4px").style("font-size", "12px").style("pointer-events", "none").style("opacity", 0).style("z-index", 1e3);
}
function R(e, t) {
	let { fields: n, options: r, getFieldLabel: i } = e, a = (e) => r.leftYAxisFormat ? f(e, r.leftYAxisFormat) : e;
	return [
		`<strong>${t.series || "Unknown"}</strong>`,
		`${i(n.xAxisField)}: ${t.xLabel || (r.xAxisFormat ? f(t.x, r.xAxisFormat) : t.x)}`,
		`${i(n.yAxisField)}: ${a(t.y)}`,
		`${i(n.sizeFieldName)}: ${a(t.size)}`,
		n.colorFieldName && t.color ? `${i(n.colorFieldName)}: ${t.color}` : ""
	].filter(Boolean).join("<br>");
}
function z(e, t, n, r) {
	t.on("mouseover", function(t, i) {
		A(this).transition().duration(200).style("opacity", 1).attr("r", r(i.size) * 1.1), n.html(R(e, i)).style("left", t.pageX + 10 + "px").style("top", t.pageY - 10 + "px").transition().duration(200).style("opacity", 1);
	}).on("mousemove", function(e) {
		n.style("left", e.pageX + 10 + "px").style("top", e.pageY - 10 + "px");
	}).on("mouseout", function(t, i) {
		A(this).transition().duration(200).style("opacity", e.options.bubbleOpacity).attr("r", r(i.size)), n.transition().duration(200).style("opacity", 0);
	});
}
function B(e, t, n, r, a, o) {
	let { bubbleData: s, fields: c, options: l, colorPalette: u, getFieldLabel: d } = e, p = Math.min(...s.map((e) => e.color)), m = Math.max(...s.map((e) => e.color)), h = (e) => l.leftYAxisFormat ? f(e, l.leftYAxisFormat) : e.toFixed(2), g = n.append("g").attr("class", "color-legend").attr("transform", `translate(${r / 2 - 100}, ${a + 60})`), _ = t.append("defs").append("linearGradient").attr("id", "color-scale-gradient").attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "0%"), v = u?.gradient || i;
	v.forEach((e, t) => {
		_.append("stop").attr("offset", `${t / (v.length - 1) * 100}%`).attr("stop-color", e);
	}), g.append("rect").attr("width", 200).attr("height", 20).style("fill", "url(#color-scale-gradient)").style("stroke", "#ccc").style("stroke-width", 1), g.append("text").attr("x", 0).attr("y", 35).attr("text-anchor", "start").style("font-size", "11px").style("fill", o).text(h(p)), g.append("text").attr("x", 200).attr("y", 35).attr("text-anchor", "end").style("font-size", "11px").style("fill", o).text(h(m)), g.append("text").attr("x", 100).attr("y", -5).attr("text-anchor", "middle").style("font-size", "12px").style("font-weight", "bold").style("fill", o).text(d(c.colorFieldName));
}
function V(e, t, n, r, i, a, o, s) {
	let { fields: c, options: l } = e;
	if (a.length === 0) return;
	let u = t.append("g").attr("class", "legend").attr("transform", `translate(${n / 2 - a.length * 80 / 2}, ${r + 60})`).selectAll(".legend-item").data(a).enter().append("g").attr("class", "legend-item").attr("transform", (e, t) => `translate(${t * 80}, 0)`).style("cursor", "pointer");
	u.append("circle").attr("cx", 5).attr("cy", 5).attr("r", 5).style("fill", (e) => o(e)).style("opacity", l.bubbleOpacity), u.append("text").attr("x", 15).attr("y", 5).attr("dy", ".35em").style("font-size", "11px").style("fill", i).text((e) => String(e)), u.on("mouseover", function(e, t) {
		s.transition().duration(200).style("opacity", (e) => c.colorFieldName && String(e.color) === t ? 1 : .2);
	}).on("mouseout", function() {
		s.transition().duration(200).style("opacity", l.bubbleOpacity);
	});
}
function H(e) {
	let { svgEl: t, bubbleData: n, fields: r, options: i, dimensions: a, colorPalette: c, isDark: l } = e;
	if (A(t).selectAll("*").remove(), n.length === 0) return;
	let u = {
		...s,
		left: s.left + 30,
		bottom: i.showLegend && r.colorFieldName ? 100 : 40
	}, f = a.width - u.left - u.right, p = a.height - u.top - u.bottom, m = A(t).attr("width", a.width).attr("height", a.height), h = m.append("g").attr("transform", `translate(${u.left},${u.top})`), g = E().domain(w(n, (e) => e.x)).range([0, f]).nice(), _ = E().domain(w(n, (e) => e.y)).range([p, 0]).nice(), v = k().domain([0, T(n, (e) => e.size)]).range([i.minBubbleSize, i.maxBubbleSize]), { colorScale: y, isNumericColorField: b, uniqueColors: x } = N(n, r.colorFieldName, c), { textColor: S, gridColor: C } = o(l);
	i.showGrid && F(h, g, _, f, p, C), I(e, h, g, _, f, p, S, C);
	let D = L(), O = h.selectAll(".bubble").data(n).enter().append("circle").attr("class", "bubble").attr("cx", (e) => g(e.x)).attr("cy", (e) => _(e.y)).attr("r", (e) => v(e.size)).style("fill", (e) => r.colorFieldName && e.color !== void 0 ? y(b ? e.color : String(e.color)) : d[0]).style("opacity", i.bubbleOpacity).style("stroke", "#fff").style("stroke-width", 1).style("cursor", "pointer");
	return i.showTooltip && z(e, O, D, v), i.showLegend && r.colorFieldName && (b ? B(e, m, h, f, p, S) : V(e, h, f, p, S, x, y, O)), () => {
		D.remove();
	};
}
//#endregion
//#region src/client/components/charts/BubbleChart.tsx
var U = /* @__PURE__ */ e({ default: () => W }), W = h.memo(function({ data: e, chartConfig: i, displayConfig: a = {}, queryObject: o, height: s = "100%", colorPalette: d }) {
	let { t: f } = t(), p = h.useRef(null), { containerRef: m, dimensions: g, dimensionsReady: y } = l(), { theme: S } = M(), C = n(), w = v(() => c(a), [a]);
	return _(() => {
		if (!e || e.length === 0 || !p.current || !y || g.width === 0) return;
		let t = u(i);
		if (!t) return;
		let n = r(e, t, o);
		return H({
			svgEl: p.current,
			bubbleData: n,
			fields: t,
			options: w,
			dimensions: g,
			queryObject: o,
			colorPalette: d,
			isDark: S !== "light",
			getFieldLabel: C
		});
	}, [
		e,
		i,
		w,
		o,
		g,
		y,
		d,
		S,
		C
	]), !e || e.length === 0 ? /* @__PURE__ */ b("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted",
		style: { height: s },
		children: /* @__PURE__ */ x("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ b("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: f("chart.runtime.noData")
			}), /* @__PURE__ */ b("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: f("chart.runtime.noDataHint.bubble")
			})]
		})
	}) : i?.xAxis && i?.yAxis && i?.series ? /* @__PURE__ */ b("div", {
		className: "dc:w-full dc:flex-1 dc:flex dc:flex-col dc:relative",
		style: {
			height: s,
			minHeight: "250px",
			overflow: "hidden"
		},
		children: /* @__PURE__ */ x("div", {
			ref: m,
			className: "dc:w-full dc:h-full dc:relative",
			children: [/* @__PURE__ */ b("svg", {
				ref: p,
				className: "dc:w-full dc:h-full"
			}), !y && /* @__PURE__ */ b("div", {
				className: "dc:absolute dc:inset-0 dc:flex dc:items-center dc:justify-center",
				children: /* @__PURE__ */ b("div", {
					className: "text-dc-text-muted dc:text-sm",
					children: f("chart.runtime.measuringDimensions")
				})
			})]
		})
	}) : /* @__PURE__ */ b("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-warning",
		style: { height: s },
		children: /* @__PURE__ */ x("div", {
			className: "dc:text-center",
			children: [
				/* @__PURE__ */ b("div", {
					className: "dc:text-sm dc:font-semibold dc:mb-1",
					children: f("chart.runtime.activityGridConfigRequired")
				}),
				/* @__PURE__ */ b("div", {
					className: "dc:text-xs",
					children: f("chart.runtime.configErrorHint.bubbleRequired")
				}),
				/* @__PURE__ */ b("div", {
					className: "dc:text-xs dc:mt-1",
					children: f("chart.runtime.configErrorHint.bubbleOptional")
				})
			]
		})
	});
});
//#endregion
export { M as n, U as t };

//# sourceMappingURL=chart-bubble-BrB4XrSS.js.map