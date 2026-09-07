import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { F as t, s as n } from "./chart-activity-grid-D6X0iOUw.js";
import r, { useEffect as i, useMemo as a, useRef as o, useState as s } from "react";
import { jsx as c, jsxs as l } from "react/jsx-runtime";
import { ResponsiveContainer as u, Sankey as d, Tooltip as f } from "recharts";
//#region src/client/types/flow.ts
function p(e) {
	if (!e || typeof e != "object") return !1;
	let t = e;
	return Array.isArray(t.nodes) && Array.isArray(t.links) && (t.nodes.length === 0 || typeof t.nodes[0] == "object" && t.nodes[0] !== null && "id" in t.nodes[0]);
}
function m(e) {
	return typeof e == "object" && !!e && "flow" in e && typeof e.flow == "object";
}
//#endregion
//#region src/client/components/charts/SankeyChart.tsx
var h = /* @__PURE__ */ e({ default: () => w }), g = {
	before: "#F97316",
	start: "#3B82F6",
	after: "#10B981"
};
function _(e, t) {
	return t && t.length > 0 ? t[Math.abs(e) % t.length] : e < 0 ? g.before : e === 0 ? g.start : g.after;
}
function v(e, t) {
	if (!e.nodes || e.nodes.length === 0) return null;
	let n = /* @__PURE__ */ new Map();
	return e.nodes.forEach((e, t) => {
		n.set(e.id, t);
	}), {
		nodes: e.nodes.map((e) => ({
			name: e.name,
			fill: _(e.layer, t),
			layer: e.layer,
			value: e.value
		})),
		links: e.links.map((e) => {
			let t = n.get(e.source), r = n.get(e.target);
			return t === void 0 || r === void 0 ? (console.warn(`Sankey: Could not resolve link ${e.source} -> ${e.target}`), null) : {
				source: t,
				target: r,
				value: e.value
			};
		}).filter((e) => e !== null)
	};
}
function y(e) {
	if (!e || e.length === 0) return null;
	if (p(e[0])) return e[0];
	if (p(e)) return e;
	let t = e;
	return t.nodes && t.links ? t : null;
}
function b({ x: e, y: t, width: n, height: r, payload: i, containerWidth: a, showLabels: o = !0 }) {
	let s = e > a / 2, u = s ? e - 6 : e + n + 6, d = s ? "end" : "start";
	return /* @__PURE__ */ l("g", { children: [/* @__PURE__ */ c("rect", {
		x: e,
		y: t,
		width: n,
		height: r,
		fill: i.fill,
		rx: 2,
		ry: 2
	}), o && /* @__PURE__ */ l("text", {
		x: u,
		y: t + r / 2,
		textAnchor: d,
		dominantBaseline: "middle",
		className: "dc:text-xs dc:fill-dc-text",
		style: { fontSize: 11 },
		children: [i.name, i.value !== void 0 && /* @__PURE__ */ l("tspan", {
			className: "dc:fill-dc-text-secondary",
			dx: 4,
			children: [
				"(",
				i.value.toLocaleString(),
				")"
			]
		})]
	})] });
}
function x({ children: e }) {
	return /* @__PURE__ */ c("div", {
		className: "bg-dc-surface dc:border border-dc-border dc:rounded-md dc:px-3 dc:py-2 dc:shadow-lg dc:text-sm",
		children: e
	});
}
function S({ value: e }) {
	return /* @__PURE__ */ l("div", {
		className: "text-dc-text-secondary dc:mt-1",
		children: [/* @__PURE__ */ c("span", {
			className: "dc:font-medium",
			children: e.toLocaleString()
		}), " entities"]
	});
}
function C({ active: e, payload: t }) {
	if (!e || !t || t.length === 0) return null;
	let n = t[0].payload, { source: r, target: i } = n;
	return r && i ? /* @__PURE__ */ l(x, { children: [/* @__PURE__ */ l("div", {
		className: "dc:font-medium text-dc-text",
		children: [
			r.name,
			" → ",
			i.name
		]
	}), /* @__PURE__ */ c(S, { value: n.value })] }) : /* @__PURE__ */ l(x, { children: [/* @__PURE__ */ c("div", {
		className: "dc:font-medium text-dc-text",
		children: n.name
	}), n.value !== void 0 && /* @__PURE__ */ c(S, { value: n.value })] });
}
var w = r.memo(function({ data: e, height: r = "100%", colorPalette: p, displayConfig: m }) {
	let { t: h } = t(), g = o(null), [_, x] = s(800);
	i(() => {
		let e = () => {
			g.current && x(g.current.offsetWidth);
		};
		return e(), window.addEventListener("resize", e), () => window.removeEventListener("resize", e);
	}, []);
	let S = m, w = parseFloat(String(S?.linkOpacity || "0.5")), T = S?.nodeWidth ?? 10, E = S?.nodePadding ?? 50, D = S?.showNodeLabels !== !1, O = a(() => {
		let t = y(e || []);
		return t ? v(t, p?.colors || n) : null;
	}, [e, p]), k = a(() => {
		let t = y(e || []);
		if (!t) return null;
		let n = t.nodes.filter((e) => e.layer === 0).reduce((e, t) => e + (t.value || 0), 0), r = t.links.reduce((e, t) => e + t.value, 0);
		return {
			nodeCount: t.nodes.length,
			linkCount: t.links.length,
			totalEntities: n,
			totalPaths: r
		};
	}, [e]);
	return !e || e.length === 0 || !O || O.nodes.length === 0 ? /* @__PURE__ */ c("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted",
		style: { height: r },
		children: /* @__PURE__ */ l("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ c("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: h("chart.runtime.flow.noData")
			}), /* @__PURE__ */ c("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: h("chart.runtime.noDataHint.flow")
			})]
		})
	}) : /* @__PURE__ */ l("div", {
		ref: g,
		className: "dc:relative dc:w-full dc:h-full dc:flex dc:flex-col",
		style: { height: r },
		children: [/* @__PURE__ */ c("div", {
			className: "dc:flex-1 dc:min-h-0",
			children: /* @__PURE__ */ c(u, {
				width: "100%",
				height: "100%",
				children: /* @__PURE__ */ c(d, {
					data: O,
					nodeWidth: T,
					nodePadding: E,
					margin: {
						top: 20,
						right: 20,
						bottom: 20,
						left: 20
					},
					link: {
						stroke: "var(--dc-border)",
						strokeOpacity: w
					},
					node: (e) => /* @__PURE__ */ c(b, {
						...e,
						containerWidth: _,
						showLabels: D
					}),
					children: /* @__PURE__ */ c(f, { content: /* @__PURE__ */ c(C, {}) })
				})
			})
		}), !S?.hideSummaryFooter && k && /* @__PURE__ */ c("div", {
			className: "dc:flex-shrink-0 dc:px-4 dc:py-2 dc:border-t border-dc-border bg-dc-surface-secondary",
			children: /* @__PURE__ */ l("div", {
				className: "dc:flex dc:items-center dc:justify-between dc:text-sm",
				children: [
					/* @__PURE__ */ l("div", {
						className: "text-dc-text-muted",
						children: [/* @__PURE__ */ c("span", {
							className: "dc:font-medium",
							children: k.nodeCount
						}), " events"]
					}),
					/* @__PURE__ */ l("div", {
						className: "text-dc-text",
						children: [
							/* @__PURE__ */ c("span", {
								className: "text-dc-text-muted",
								children: h("chart.runtime.flow.paths")
							}),
							" ",
							/* @__PURE__ */ c("span", {
								className: "dc:font-medium",
								children: k.linkCount
							})
						]
					}),
					/* @__PURE__ */ l("div", {
						className: "text-dc-text-muted",
						children: [/* @__PURE__ */ c("span", {
							className: "dc:font-medium",
							children: k.totalEntities.toLocaleString()
						}), " starting entities"]
					})
				]
			})
		})]
	});
});
//#endregion
export { p as n, m as r, h as t };

//# sourceMappingURL=chart-sankey-DDzokqvF.js.map