import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { n as t } from "./chart-sankey-DDzokqvF.js";
import { F as n, s as r } from "./chart-activity-grid-D6X0iOUw.js";
import i, { useEffect as a, useMemo as o, useRef as s, useState as c } from "react";
import { jsx as l, jsxs as u } from "react/jsx-runtime";
import { ResponsiveContainer as d, SunburstChart as f, Tooltip as p } from "recharts";
//#region src/client/components/charts/SunburstChart.tsx
var m = /* @__PURE__ */ e({ default: () => v });
function h(e) {
	if (!e || e.length === 0) return null;
	if (t(e[0])) return e[0];
	if (t(e)) return e;
	let n = e;
	return n.nodes && n.links ? n : null;
}
function g(e, t) {
	let { nodes: n, links: i } = e;
	if (!n || n.length === 0) return null;
	let a = n.filter((e) => e.layer >= 0);
	if (a.length === 0) return null;
	let o = t || r, s = [...new Set(a.map((e) => e.name))], c = /* @__PURE__ */ new Map();
	s.forEach((e, t) => {
		c.set(e, o[t % o.length]);
	});
	let l = /* @__PURE__ */ new Map();
	a.forEach((e) => l.set(e.id, e));
	let u = /* @__PURE__ */ new Map();
	i.forEach((e) => {
		if (!l.has(e.source)) return;
		let t = u.get(e.source) || [];
		t.push(e), u.set(e.source, t);
	});
	let d = Math.max(...a.map((e) => e.layer)), f = 0;
	function p(e, t, n) {
		if (t >= d) return [];
		let r = u.get(e) || [];
		if (r.length === 0) return [];
		let i = [];
		for (let e of r) {
			let r = l.get(e.target);
			if (!r || r.layer !== t + 1) continue;
			f++;
			let a = `${r.name}_${f}`, s = n ? `${n}→${r.name}` : r.name, u = p(e.target, t + 1, s), d = {
				name: a,
				originalName: r.name,
				value: e.value,
				fill: c.get(r.name) || o[0]
			};
			u.length > 0 && (d.children = u), i.push(d);
		}
		return i;
	}
	let m = a.filter((e) => e.layer === 0);
	if (m.length === 0) return null;
	if (m.length === 1) {
		let e = m[0], t = p(e.id, 0, e.name), n = {
			name: e.name,
			originalName: e.name,
			value: e.value || t.reduce((e, t) => e + (t.value || 0), 0),
			fill: c.get(e.name) || o[0]
		};
		return t.length > 0 && (n.children = t), n;
	}
	return {
		name: "Start",
		originalName: "Start",
		children: m.map((e, t) => {
			f++;
			let n = p(e.id, 0, e.name), r = {
				name: `${e.name}_root_${t}`,
				originalName: e.name,
				value: e.value || n.reduce((e, t) => e + (t.value || 0), 0),
				fill: c.get(e.name) || o[0]
			};
			return n.length > 0 && (r.children = n), r;
		})
	};
}
function _({ active: e, payload: t }) {
	if (!e || !t || t.length === 0) return null;
	let n = t[0].payload;
	return /* @__PURE__ */ u("div", {
		className: "bg-dc-surface dc:border border-dc-border dc:rounded-md dc:px-3 dc:py-2 dc:shadow-lg dc:text-sm",
		children: [/* @__PURE__ */ l("div", {
			className: "dc:font-medium text-dc-text",
			children: n.originalName || n.name
		}), n.value !== void 0 && /* @__PURE__ */ u("div", {
			className: "text-dc-text-secondary dc:mt-1",
			children: [/* @__PURE__ */ l("span", {
				className: "dc:font-medium",
				children: n.value.toLocaleString()
			}), " entities"]
		})]
	});
}
var v = i.memo(function({ data: e, height: t = "100%", colorPalette: i, displayConfig: m }) {
	let { t: v } = n(), y = s(null), [b, x] = c({
		width: 400,
		height: 400
	});
	a(() => {
		let e = () => {
			y.current && x({
				width: y.current.offsetWidth,
				height: y.current.offsetHeight
			});
		};
		e(), window.addEventListener("resize", e);
		let t = new ResizeObserver(e);
		return y.current && t.observe(y.current), () => {
			window.removeEventListener("resize", e), t.disconnect();
		};
	}, []);
	let S = m, C = S?.innerRadius ?? 40, w = o(() => {
		let t = h(e || []);
		return t ? g(t, i?.colors || r) : null;
	}, [e, i]), T = o(() => {
		let t = h(e || []);
		if (!t) return null;
		let n = t.nodes.filter((e) => e.layer >= 0), r = t.links.filter((e) => {
			let n = t.nodes.find((t) => t.id === e.source);
			return n && n.layer >= 0;
		}), i = t.nodes.filter((e) => e.layer === 0).reduce((e, t) => e + (t.value || 0), 0);
		return {
			nodeCount: n.length,
			linkCount: r.length,
			totalEntities: i
		};
	}, [e]);
	if (!e || e.length === 0 || !w) return /* @__PURE__ */ l("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted",
		style: { height: t },
		children: /* @__PURE__ */ u("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ l("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: v("chart.runtime.flow.noData")
			}), /* @__PURE__ */ l("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: v("chart.runtime.noDataHint.flow")
			})]
		})
	});
	let E = Math.max(Math.min(b.width, b.height) / 2 - 40, 100), D = w.originalName || w.name, O = w.value;
	return /* @__PURE__ */ u("div", {
		className: "dc:relative dc:w-full dc:h-full dc:flex dc:flex-col",
		style: { height: t },
		children: [/* @__PURE__ */ u("div", {
			ref: y,
			className: "dc:flex-1 dc:min-h-0 dc:relative",
			children: [/* @__PURE__ */ l(d, {
				width: "100%",
				height: "100%",
				children: /* @__PURE__ */ l(f, {
					data: w,
					dataKey: "value",
					innerRadius: C,
					outerRadius: E,
					stroke: "var(--dc-bg)",
					children: /* @__PURE__ */ l(p, { content: /* @__PURE__ */ l(_, {}) })
				})
			}), C > 0 && /* @__PURE__ */ l("div", {
				className: "dc:absolute dc:inset-0 dc:flex dc:items-center dc:justify-center dc:pointer-events-none",
				style: { zIndex: 10 },
				children: /* @__PURE__ */ u("div", {
					className: "dc:text-center",
					children: [/* @__PURE__ */ l("div", {
						className: "dc:text-sm dc:font-semibold text-dc-text",
						children: D
					}), O !== void 0 && /* @__PURE__ */ l("div", {
						className: "dc:text-xs text-dc-text-secondary",
						children: O.toLocaleString()
					})]
				})
			})]
		}), !S?.hideSummaryFooter && T && /* @__PURE__ */ l("div", {
			className: "dc:flex-shrink-0 dc:px-4 dc:py-2 dc:border-t border-dc-border bg-dc-surface-secondary",
			children: /* @__PURE__ */ u("div", {
				className: "dc:flex dc:items-center dc:justify-between dc:text-sm",
				children: [
					/* @__PURE__ */ u("div", {
						className: "text-dc-text-muted",
						children: [/* @__PURE__ */ l("span", {
							className: "dc:font-medium",
							children: T.nodeCount
						}), " events (after)"]
					}),
					/* @__PURE__ */ u("div", {
						className: "text-dc-text",
						children: [
							/* @__PURE__ */ l("span", {
								className: "text-dc-text-muted",
								children: v("chart.runtime.flow.paths")
							}),
							" ",
							/* @__PURE__ */ l("span", {
								className: "dc:font-medium",
								children: T.linkCount
							})
						]
					}),
					/* @__PURE__ */ u("div", {
						className: "text-dc-text-muted",
						children: [
							/* @__PURE__ */ l("span", {
								className: "dc:font-medium",
								children: T.totalEntities.toLocaleString()
							}),
							" ",
							"starting entities"
						]
					})
				]
			})
		})]
	});
});
//#endregion
export { m as t };

//# sourceMappingURL=chart-sunburst-HwZSvUOV.js.map