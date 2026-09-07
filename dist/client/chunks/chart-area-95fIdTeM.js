import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { D as t, E as n, F as r, M as i, S as a, T as o, l as s, s as c, w as l } from "./chart-activity-grid-D6X0iOUw.js";
import u, { Fragment as d, startTransition as f, useId as p, useLayoutEffect as m, useMemo as h, useRef as g, useState as _ } from "react";
import { Fragment as v, jsx as y, jsxs as b } from "react/jsx-runtime";
import { Area as x, CartesianGrid as S, ComposedChart as ee, Legend as C, Line as w, ResponsiveContainer as T, Tooltip as E, XAxis as te, YAxis as D } from "recharts";
//#region src/client/components/LoadingIndicator.tsx
var O = {
	xs: "dc:h-3 dc:w-3",
	sm: "dc:h-6 dc:w-6",
	md: "dc:h-8 dc:w-8",
	lg: "dc:h-12 dc:w-12"
};
function k({ size: e = "md", className: t = "" }) {
	return /* @__PURE__ */ y("div", {
		className: `dc:animate-spin dc:rounded-full dc:border-b-2 ${O[e]} ${t}`,
		style: { borderBottomColor: "var(--dc-primary)" },
		role: "status",
		"aria-label": "Loading"
	});
}
//#endregion
//#region src/client/utils/comparisonUtils.ts
function A(e) {
	return e.length > 0 && "__periodIndex" in e[0];
}
function j(e) {
	if (!A(e)) return [];
	let t = /* @__PURE__ */ new Set();
	for (let n of e) n.__period && t.add(n.__period);
	return Array.from(t);
}
function M(e) {
	if (!A(e)) return [];
	let t = /* @__PURE__ */ new Set();
	for (let n of e) typeof n.__periodIndex == "number" && t.add(n.__periodIndex);
	return Array.from(t).sort((e, t) => e - t);
}
function N(e, t) {
	return t === 0 ? "Current" : "Prior";
}
function ne(e, t, n) {
	if (!A(e)) return {
		data: e,
		seriesKeys: t
	};
	let r = j(e), i = [];
	for (let e of t) for (let t = 0; t < r.length; t++) {
		let n = `${e} (${N(r[t], t)})`;
		i.push(n);
	}
	return {
		data: e,
		seriesKeys: i
	};
}
function P(e, t, n) {
	if (e.length === 0) return [];
	let r = [
		"__period",
		"__periodIndex",
		"__periodDayIndex"
	], i = e[0], a = [];
	for (let e of Object.keys(i)) !t.includes(e) && e !== n && !r.includes(e) && a.push(e);
	return a;
}
function F(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let e of t) n.set(e, /* @__PURE__ */ new Set());
	for (let r of e) for (let e of t) r[e] !== void 0 && r[e] !== null && n.get(e).add(r[e]);
	return n;
}
function I(e, t, n, r) {
	if (!A(e)) return {
		data: e,
		seriesKeys: t,
		xAxisKey: n
	};
	let i = j(e), a = M(e), o = P(e, t, n), s = o.length > 0, c = s ? F(e, o) : null;
	return {
		data: ie(e, t, n, {
			dimensionFields: o,
			hasDimensions: s,
			periodLabels: i,
			getFieldLabel: r
		}),
		seriesKeys: ae(t, i, a, {
			dimensionFields: o,
			uniqueDimensionValues: c,
			getFieldLabel: r
		}),
		xAxisKey: "__periodDayIndex"
	};
}
function re(e, t, n) {
	return t.length === 0 ? "" : t.map((t) => {
		let r = e[t];
		return n ? n(String(r)) : String(r);
	}).join(" / ");
}
function ie(e, t, n, r) {
	let { dimensionFields: i, hasDimensions: a, periodLabels: o, getFieldLabel: s } = r, c = /* @__PURE__ */ new Map();
	for (let r of e) {
		let e = r.__periodDayIndex, l = r.__periodIndex;
		c.has(e) || c.set(e, {
			__periodDayIndex: e,
			__displayDate: l === 0 ? r[n] : void 0
		});
		let u = c.get(e);
		!u.__displayDate && r[n] && (u.__displayDate = r[n]);
		let d = a ? re(r, i, s) : "", f = N(o[l] || "", l);
		for (let e of t) {
			let t = s ? s(e) : e, n = d ? `${d} - ${t} (${f})` : `${t} (${f})`;
			u[n] = r[e];
		}
	}
	return Array.from(c.values()).sort((e, t) => e.__periodDayIndex - t.__periodDayIndex);
}
function ae(e, t, n, r) {
	let { dimensionFields: i, uniqueDimensionValues: a, getFieldLabel: o } = r, s = [], c = a ? oe(i, a, o) : [""];
	for (let r of c) for (let i of e) {
		let e = o ? o(i) : i;
		for (let i = 0; i < n.length; i++) {
			let n = N(t[i] || "", i);
			s.push(r ? `${r} - ${e} (${n})` : `${e} (${n})`);
		}
	}
	return s;
}
function oe(e, t, n) {
	if (e.length === 0) return [];
	if (e.length === 1) return Array.from(t.get(e[0]) || []).map((e) => n ? n(String(e)) : String(e));
	let r = [], i = e.map((e) => Array.from(t.get(e) || []));
	function a(e, t) {
		if (e === i.length) {
			let e = t.map((e) => n ? n(String(e)) : String(e));
			r.push(e.join(" / "));
			return;
		}
		for (let n of i[e]) a(e + 1, [...t, n]);
	}
	return a(0, []), r;
}
function se(e, t, n) {
	if (n?.showDayNumber) return `Day ${e + 1}`;
	if (t) {
		let e = typeof t == "string" ? new Date(t) : t;
		if (!isNaN(e.getTime())) return e.toLocaleDateString("en-US", {
			month: n?.dateFormat === "long" ? "long" : "short",
			day: "numeric"
		});
	}
	return `${e + 1}`;
}
function L(e, t) {
	if (t.length < 2) return !1;
	for (let n = 1; n < t.length; n++) {
		let r = N(t[n], n);
		if (e.includes(`(${r})`)) return !0;
	}
	return e.includes("(Prior");
}
function R(e = "dashed") {
	switch (e) {
		case "solid": return;
		case "dashed": return "5 5";
		case "dotted": return "2 2";
		default: return "5 5";
	}
}
//#endregion
//#region src/client/components/charts/ChartContainer.tsx
function z({ children: e, height: t = "100%", minHeight: n }) {
	let i = n ?? void 0, { t: a } = r(), o = g(null), [s, c] = _(!1), [l, u] = _({
		width: 0,
		height: 0
	}), d = g({
		width: 0,
		height: 0
	}), p = g(!1), h = g(null), v = g(null);
	m(() => {
		let e = !0, t = null, n = () => {
			if (v.current = null, !e) return;
			let t = h.current;
			if (h.current = null, !t) return;
			let n = Math.round(t.width), r = Math.round(t.height);
			if (n <= 0 || r <= 0) return;
			let i = d.current.width !== n || d.current.height !== r, a = !p.current;
			!i && !a || (d.current = {
				width: n,
				height: r
			}, p.current = !0, f(() => {
				i && u({
					width: n,
					height: r
				}), a && c(!0);
			}));
		}, r = (e, t) => {
			h.current = {
				width: e,
				height: t
			}, v.current === null && (v.current = requestAnimationFrame(n));
		};
		return t = new ResizeObserver((e) => {
			for (let t of e) {
				let { width: e, height: n } = t.contentRect;
				e > 0 && n > 0 && r(e, n);
			}
		}), o.current && (t.observe(o.current), (() => {
			if (!e || !o.current) return;
			let t = o.current.getBoundingClientRect(), n = Math.max(o.current.clientWidth, t.width), i = Math.max(o.current.clientHeight, t.height);
			n > 0 && i > 0 && r(n, i);
		})()), () => {
			e = !1, v.current !== null && (cancelAnimationFrame(v.current), v.current = null), t?.disconnect();
		};
	}, []);
	try {
		if (t === "100%") return /* @__PURE__ */ y("div", {
			ref: o,
			className: "dc:w-full dc:h-full dc:flex-1 dc:flex dc:flex-col dc:relative",
			style: {
				minHeight: i ?? "250px",
				minWidth: "100px",
				overflow: "hidden",
				userSelect: "none"
			},
			children: s && l.width > 0 && l.height > 0 ? /* @__PURE__ */ y(T, {
				width: l.width,
				height: l.height - 16,
				debounce: 100,
				style: { marginTop: "16px" },
				children: e
			}) : /* @__PURE__ */ y("div", {
				className: "dc:flex dc:items-center dc:justify-center dc:w-full dc:h-full",
				children: /* @__PURE__ */ y(k, { size: "sm" })
			})
		});
		let n = {
			height: typeof t == "number" ? `${t}px` : t,
			width: "100%",
			minHeight: i ?? "200px",
			minWidth: "100px",
			userSelect: "none"
		};
		return /* @__PURE__ */ y("div", {
			ref: o,
			className: "dc:w-full dc:flex dc:flex-col dc:relative",
			style: {
				...n,
				overflow: "hidden"
			},
			children: s && l.width > 0 && l.height > 0 ? /* @__PURE__ */ y(T, {
				width: l.width,
				height: l.height - 16,
				debounce: 100,
				style: { marginTop: "16px" },
				children: e
			}) : /* @__PURE__ */ y("div", {
				className: "dc:flex dc:items-center dc:justify-center dc:w-full dc:h-full",
				children: /* @__PURE__ */ y(k, { size: "sm" })
			})
		});
	} catch (e) {
		return /* @__PURE__ */ b("div", {
			className: "dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full dc:h-full dc:p-4 dc:text-center dc:border dc:border-dashed dc:rounded-lg",
			style: {
				height: t,
				borderColor: "var(--dc-border)",
				backgroundColor: "var(--dc-surface)"
			},
			children: [/* @__PURE__ */ y("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1 text-dc-text-muted",
				children: a("chart.runtime.unableToDisplay")
			}), /* @__PURE__ */ y("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: e instanceof Error ? e.message : "Failed to create responsive container"
			})]
		});
	}
}
//#endregion
//#region src/client/components/charts/ChartTooltip.tsx
var ce = (e, t) => e == null ? ["No data", t] : [o(e), t];
function B({ formatter: e, labelFormatter: t }) {
	return /* @__PURE__ */ y(E, {
		formatter: e || ce,
		labelFormatter: t,
		contentStyle: {
			backgroundColor: "white",
			border: "1px solid #e5e7eb",
			borderRadius: "0.5rem",
			fontSize: "0.875rem",
			color: "#1f2937",
			boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
			padding: "8px 12px"
		}
	});
}
var V = ({ x: e = 0, y: t = 0, payload: n, tickFormatter: r, index: i = 0 }) => {
	if (!n) return null;
	let a = r ? r(n.value, i) : String(n.value), o = a.length > 16 ? `${a.slice(0, 15)}\u2026` : a;
	return /* @__PURE__ */ y("g", {
		transform: `translate(${e},${t})`,
		children: /* @__PURE__ */ y("text", {
			x: 0,
			y: 0,
			dy: 16,
			textAnchor: "end",
			fill: "var(--dc-text-muted)",
			fontSize: 12,
			transform: "rotate(-45)",
			children: o
		})
	});
};
//#endregion
//#region src/client/components/charts/ChartStates.tsx
function H({ height: e, hint: t, titleKey: n = "chart.runtime.noData" }) {
	let { t: i } = r();
	return /* @__PURE__ */ y("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted",
		style: { height: e },
		children: /* @__PURE__ */ b("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ y("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: i(n)
			}), t != null && /* @__PURE__ */ y("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: t
			})]
		})
	});
}
function U({ height: e, hint: t }) {
	let { t: n } = r();
	return /* @__PURE__ */ y("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-warning",
		style: { height: e },
		children: /* @__PURE__ */ b("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ y("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: n("chart.runtime.configError")
			}), t != null && /* @__PURE__ */ y("div", {
				className: "dc:text-xs",
				children: t
			})]
		})
	});
}
function W({ height: e, chartType: t, error: n }) {
	let { t: i } = r();
	return /* @__PURE__ */ y("div", {
		className: "dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full text-dc-error dc:p-4",
		style: { height: e },
		children: /* @__PURE__ */ b("div", {
			className: "dc:text-center",
			children: [
				/* @__PURE__ */ y("div", {
					className: "dc:text-sm dc:font-semibold dc:mb-1",
					children: i("chart.runtime.chartError", { chartType: t })
				}),
				/* @__PURE__ */ y("div", {
					className: "dc:text-xs dc:mb-2",
					children: n instanceof Error ? n.message : i("chart.runtime.unknownError")
				}),
				/* @__PURE__ */ y("div", {
					className: "dc:text-xs text-dc-text-muted",
					children: i("chart.runtime.checkConfig")
				})
			]
		})
	});
}
//#endregion
//#region src/client/components/charts/chartAxisResolution.ts
function G(e) {
	let t, n = [], r = [], i = null;
	return e?.xAxis && e?.yAxis ? (t = Array.isArray(e.xAxis) ? e.xAxis[0] : e.xAxis, n = Array.isArray(e.yAxis) ? e.yAxis : [e.yAxis], r = e.series || []) : e?.x && e?.y ? (t = e.x, n = Array.isArray(e.y) ? e.y : [e.y]) : i = "axisInvalid", !i && (!t || n.length === 0) && (i = "axisFields"), {
		xAxisField: t,
		yAxisFields: n,
		seriesFields: r,
		errorCode: i
	};
}
//#endregion
//#region src/client/utils/targetUtils.ts
function K(e) {
	if (!e || typeof e != "string") return [];
	let t = e.trim();
	if (!t) return [];
	try {
		let e = t.split(",").map((e) => e.trim()).filter((e) => e !== "").map((e) => {
			let t = parseFloat(e);
			if (isNaN(t)) throw Error(`Invalid numeric value: ${e}`);
			return t;
		});
		return e.length > 0 ? e : [];
	} catch (e) {
		return console.warn("Failed to parse target values:", e), [];
	}
}
function le(e, t) {
	if (e.length === 0 || t <= 0) return [];
	if (e.length === 1) return Array(t).fill(e[0]);
	let n = [], r = Math.floor(t / e.length), i = t % e.length, a = 0;
	for (let t = 0; t < e.length; t++) {
		let o = r + +(t < i);
		for (let r = 0; r < o; r++) n[a++] = e[t];
	}
	return n;
}
function ue(e, t) {
	return t === 0 ? e === 0 ? 0 : e > 0 ? 100 : -100 : (e - t) / t * 100;
}
function de(e, t = 1) {
	return `${e >= 0 ? "+" : ""}${e.toFixed(t)}%`;
}
//#endregion
//#region src/client/components/charts/chartScaffolding.tsx
function q(e, t) {
	return {
		hasRightAxis: e.some((e) => t[e] === "right"),
		leftAxisFields: e.filter((e) => (t[e] || "left") === "left"),
		rightAxisFields: e.filter((e) => t[e] === "right")
	};
}
function J(e) {
	return {
		...s,
		left: 40,
		right: e ? 40 : 20
	};
}
var fe = 6.6;
function Y(e) {
	let t = 0;
	for (let n of e) {
		if (n == null) continue;
		let e = String(n).length;
		e > t && (t = e);
	}
	if (t === 0) return 60;
	let n = t * fe * Math.SQRT1_2, r = Math.ceil(n) + 20;
	return Math.max(60, Math.min(r, 96));
}
function X(e) {
	return J(e).left + 60;
}
function Z(e, t) {
	let n = le(K(t || ""), e.length);
	return {
		spreadTargets: n,
		enhancedChartData: n.length > 0 ? e.map((e, t) => ({
			...e,
			__target: n[t] || null
		})) : e
	};
}
function pe({ hasRightAxis: e, leftAxisFields: t, rightAxisFields: n }, r, i, a, o = !1) {
	return /* @__PURE__ */ b(d, { children: [/* @__PURE__ */ y(D, {
		yAxisId: "left",
		orientation: "left",
		width: 60,
		tick: { fontSize: 12 },
		tickFormatter: o ? (e) => `${(e * 100).toFixed(0)}%` : i ? (e) => l(e, i) : void 0,
		domain: o ? [0, 1] : void 0,
		label: o ? void 0 : t.length > 0 ? {
			value: i?.label || r(t[0]),
			angle: -90,
			position: "left",
			style: {
				textAnchor: "middle",
				fontSize: "12px",
				fill: "var(--dc-text-muted)"
			}
		} : void 0
	}), e && /* @__PURE__ */ y(D, {
		yAxisId: "right",
		orientation: "right",
		tick: { fontSize: 12 },
		tickFormatter: a ? (e) => l(e, a) : void 0,
		label: n.length > 0 ? {
			value: a?.label || r(n[0]),
			angle: 90,
			position: "right",
			style: {
				textAnchor: "middle",
				fontSize: "12px",
				fill: "var(--dc-text-muted)"
			}
		} : void 0
	})] });
}
function me(e) {
	return e.length === 0 ? null : /* @__PURE__ */ b(d, { children: [/* @__PURE__ */ y(w, {
		type: "monotone",
		dataKey: "__target",
		yAxisId: "left",
		stroke: "#ffffff",
		strokeWidth: 2,
		dot: !1,
		activeDot: !1,
		connectNulls: !1
	}), /* @__PURE__ */ y(w, {
		type: "monotone",
		dataKey: "__target",
		yAxisId: "left",
		name: "Target",
		stroke: "#8B5CF6",
		strokeWidth: 2,
		strokeDasharray: "2 3",
		dot: !1,
		activeDot: !1,
		connectNulls: !1
	})] });
}
function he({ leftYAxisFormat: e, rightYAxisFormat: t, yAxisAssignment: n, resolveField: r, isPercentStack: i = !1 }) {
	return (a, o) => {
		if (a == null) return ["No data", o];
		if (o === "Target") return [l(a, e), "Target Value"];
		if (i && typeof a == "number") return [`${(a * 100).toFixed(1)}%`, o];
		let s = r(o);
		return [l(a, (s && n[s] === "right" ? "right" : "left") == "right" ? t : e), o];
	};
}
function ge({ show: e, iconType: t, paddingTop: n, onHover: r, onLeave: i }) {
	return e ? /* @__PURE__ */ y(C, {
		wrapperStyle: {
			fontSize: "12px",
			paddingTop: `${n}px`
		},
		iconType: t,
		iconSize: 8,
		layout: "horizontal",
		align: "center",
		verticalAlign: "bottom",
		onMouseEnter: (e) => r(String(e.dataKey || "")),
		onMouseLeave: i
	}) : null;
}
//#endregion
//#region src/client/components/charts/cartesianChartHelpers.tsx
function Q({ props: e, color: t, drillEnabled: n, originalField: r, seriesKey: i, onDataPointClick: a, renderPlain: o }) {
	let { cx: s, cy: c, payload: l, key: u } = e;
	if (s === void 0 || c === void 0) return null;
	let d = (e) => {
		e.stopPropagation(), e.preventDefault(), a && a({
			dataPoint: l,
			clickedField: r || i,
			xValue: l.name,
			position: {
				x: e.clientX,
				y: e.clientY
			},
			nativeEvent: e
		});
	};
	return n && a ? /* @__PURE__ */ b("g", { children: [/* @__PURE__ */ y("circle", {
		cx: s,
		cy: c,
		r: 6,
		fill: "var(--dc-surface)",
		style: { pointerEvents: "none" }
	}), /* @__PURE__ */ y("circle", {
		cx: s,
		cy: c,
		r: 4,
		fill: "var(--dc-surface)",
		stroke: t,
		strokeWidth: 2,
		cursor: "pointer",
		onClick: (e) => {
			d(e);
		}
	})] }, u) : o ? /* @__PURE__ */ y("circle", {
		cx: s,
		cy: c,
		r: 3,
		fill: t
	}, u) : null;
}
function _e(e, r, i, a) {
	if (e) {
		let a = t(r, i);
		return n(e, a);
	}
	return `Period ${a + 1}`;
}
function ve(e, t, n, r) {
	if (e) return (e, i) => {
		let a = t[i];
		return _e(a?.__displayDate, n, r, Number(e));
	};
}
function ye(e, t, n) {
	if (e) return (e, r) => _e((r && r.length > 0 ? r[0]?.payload : void 0)?.__displayDate, t, n, Number(e));
}
function be(e, t) {
	let n = e?.stackType ?? (e?.stacked ? "normal" : "none"), r = n !== "none" && !t, i = n === "percent" && !t;
	return {
		effectiveShouldStack: r,
		effectiveIsPercentStack: i,
		stackOffset: i ? "expand" : void 0
	};
}
function xe(e, t) {
	let n = {};
	return e.forEach((e) => {
		n[t(e)] = e;
	}), n;
}
function Se(e) {
	return (t) => {
		if (e[t]) return e[t];
		if (t.length > 1e3) return;
		let n = t.replace(/\s*\((Current|Prior)\)$/, "").split(" - ");
		return e[n[n.length - 1]];
	};
}
function $(e, t) {
	let n = e?.colors;
	return n && n[t % n.length] || c[t % c.length];
}
function Ce(e, t, n) {
	let { colorPalette: r, resolveField: i, yAxisAssignment: a, hoveredLegend: o, connectNulls: s, drillEnabled: c, onDataPointClick: l, hasComparisonData: u, periodLabels: d = [], priorPeriodStyle: f = "dashed", priorPeriodOpacity: p = .5, showPoints: m = !0 } = n, h = i(e), g = h && a[h] === "right" ? "right" : "left", _ = !!u && L(e, d), v = _ ? R(f) : void 0, b = _ ? p : 1, x = $(r, t), S = b;
	return o && (S = o === e ? 1 : .3), /* @__PURE__ */ y(w, {
		type: "monotone",
		dataKey: e,
		yAxisId: g,
		stroke: x,
		strokeWidth: _ ? 1.5 : 2,
		strokeDasharray: v,
		dot: _ || !m ? !1 : (t) => Q({
			props: t,
			color: x,
			drillEnabled: c,
			originalField: h,
			seriesKey: e,
			onDataPointClick: l,
			renderPlain: !0
		}),
		activeDot: m ? !1 : (t) => Q({
			props: t,
			color: x,
			drillEnabled: c,
			originalField: h,
			seriesKey: e,
			onDataPointClick: l,
			renderPlain: !0
		}),
		strokeOpacity: S,
		connectNulls: s
	}, e);
}
function we(e) {
	return e.seriesKeys.map((t, n) => Ce(t, n, e));
}
function Te(e, t, n) {
	let { colorPalette: r, seriesKeyToField: i, yAxisAssignment: a, hoveredLegend: o, connectNulls: s, shouldStack: c, drillEnabled: l, onDataPointClick: u, gradientIdPrefix: d, showPoints: f = !0 } = n, p = i[e], m = p && a[p] === "right" ? "right" : "left", h = $(r, t), g = d && !c ? `url(#${d}-${t})` : h, _ = .3, v = 1;
	if (o) {
		let t = o === e;
		_ = t ? .6 : .1, v = t ? 1 : .3;
	}
	return /* @__PURE__ */ y(x, {
		type: "monotone",
		dataKey: e,
		yAxisId: m,
		stackId: c ? "stack" : void 0,
		stroke: h,
		fill: g,
		fillOpacity: _,
		strokeWidth: 2,
		strokeOpacity: v,
		connectNulls: s,
		dot: f ? (t) => Q({
			props: t,
			color: h,
			drillEnabled: l,
			originalField: p,
			seriesKey: e,
			onDataPointClick: u,
			renderPlain: !0
		}) : !1,
		activeDot: f ? !1 : (t) => Q({
			props: t,
			color: h,
			drillEnabled: l,
			originalField: p,
			seriesKey: e,
			onDataPointClick: u,
			renderPlain: !0
		})
	}, e);
}
function Ee(e, t, n) {
	return /* @__PURE__ */ y("defs", { children: e.map((e, r) => {
		let i = $(t, r);
		return /* @__PURE__ */ b("linearGradient", {
			id: `${n}-${r}`,
			x1: "0",
			y1: "0",
			x2: "0",
			y2: "1",
			children: [/* @__PURE__ */ y("stop", {
				offset: "0%",
				stopColor: i,
				stopOpacity: 1
			}), /* @__PURE__ */ y("stop", {
				offset: "100%",
				stopColor: i,
				stopOpacity: 0
			})]
		}, e);
	}) });
}
function De(e) {
	return e.seriesKeys.map((t, n) => Te(t, n, e));
}
function Oe(e, t) {
	if (!t) return !1;
	let n = e?.timeDimensions;
	return Array.isArray(n) ? n.some((e) => e?.dimension === t) : !1;
}
function ke(e, t) {
	return (n) => {
		let r = e(n);
		return r && t[r] === "right" ? "right" : "left";
	};
}
function Ae(e, t, n, r, i) {
	return t.map((t, a) => {
		let o = r ? r(t) : "left", s = [], c;
		for (let n of e || []) {
			let e = n?.[t];
			if (e == null) continue;
			let r = typeof e == "number" ? e : parseFloat(String(e));
			!isNaN(r) && isFinite(r) && (s.length === 0 && (c = n), s.push(r));
		}
		let l = i ? c?.[i] : void 0, u = l == null || l === "" ? void 0 : String(l), d = $(n, a);
		if (s.length === 0) return {
			seriesKey: t,
			color: d,
			axis: o,
			current: null,
			baseline: null,
			absoluteChange: null,
			percentageChange: null
		};
		let f = s[s.length - 1], p = s[0];
		if (s.length < 2) return {
			seriesKey: t,
			color: d,
			axis: o,
			current: f,
			baseline: null,
			absoluteChange: null,
			percentageChange: null
		};
		let m = f - p;
		return {
			seriesKey: t,
			color: d,
			axis: o,
			current: f,
			baseline: p,
			absoluteChange: m,
			percentageChange: p === 0 ? null : m / Math.abs(p) * 100,
			baselineLabel: u
		};
	});
}
function je(e) {
	let { data: t, xAxisField: n, yAxisFields: r, seriesFields: a, queryObject: o, getFieldLabel: s } = e, c = A(t);
	if (c) {
		let e = I(t, r, n, s);
		return {
			chartData: e.data,
			seriesKeys: e.seriesKeys,
			effectiveXAxisKey: "__periodDayIndex",
			hasComparisonData: c,
			periodLabels: j(t)
		};
	}
	let l = i(t, n, r, o, a, s);
	return {
		chartData: l.data,
		seriesKeys: l.seriesKeys,
		effectiveXAxisKey: "name",
		hasComparisonData: c,
		periodLabels: []
	};
}
//#endregion
//#region src/client/components/charts/ChartSummaryHeader.tsx
var Me = u.memo(function({ summaries: e, getSeriesLabel: t, valueFormat: n, rightValueFormat: i, showChange: a = !0, leftOffset: o = 0 }) {
	let { t: s } = r();
	return e.length === 0 ? null : /* @__PURE__ */ y("div", {
		className: "dc:flex dc:flex-wrap dc:items-start dc:gap-x-8 dc:gap-y-2 dc:flex-shrink-0 dc:pr-1 dc:pb-2",
		style: { paddingLeft: o },
		"data-testid": "chart-summary-header",
		children: e.map((e) => {
			let r = a && e.absoluteChange !== null, o = e.axis === "right" ? i : n, c = (e.absoluteChange ?? 0) >= 0;
			return /* @__PURE__ */ b("div", {
				className: "dc:flex dc:flex-col dc:gap-0.5 dc:min-w-0",
				children: [
					/* @__PURE__ */ b("div", {
						className: "dc:flex dc:items-center dc:gap-1.5 dc:min-w-0",
						children: [/* @__PURE__ */ y("span", {
							className: "dc:rounded-full dc:flex-shrink-0",
							style: {
								width: 8,
								height: 8,
								backgroundColor: e.color
							}
						}), /* @__PURE__ */ y("span", {
							className: "text-dc-text-secondary dc:truncate",
							style: { fontSize: "12px" },
							children: t(e.seriesKey)
						})]
					}),
					/* @__PURE__ */ y("div", {
						className: "dc:font-semibold dc:leading-none text-dc-text",
						style: { fontSize: "24px" },
						children: e.current === null ? "—" : l(e.current, o)
					}),
					r && /* @__PURE__ */ b(v, { children: [/* @__PURE__ */ b("div", {
						className: "dc:font-semibold dc:truncate",
						style: {
							fontSize: "12px",
							color: c ? "#10b981" : "#ef4444"
						},
						children: [
							c ? "+" : "",
							l(e.absoluteChange, o),
							e.percentageChange !== null && /* @__PURE__ */ b(v, { children: [
								" (",
								c ? "+" : "",
								e.percentageChange.toFixed(1),
								"%)"
							] })
						]
					}), /* @__PURE__ */ y("div", {
						className: "text-dc-text-muted dc:truncate",
						style: { fontSize: "11px" },
						children: e.baselineLabel ? s("chart.runtime.summarySince", { period: e.baselineLabel }) : s("chart.runtime.summarySincePeriodStart")
					})] })
				]
			}, e.seriesKey);
		})
	});
}), Ne = /* @__PURE__ */ e({ default: () => Pe }), Pe = u.memo(function({ data: e, chartConfig: t, displayConfig: n = {}, queryObject: o, height: s = "100%", colorPalette: c, onDataPointClick: l, drillEnabled: u }) {
	let { t: d } = r(), [f, m] = _(null), g = `dc-area-${p().replace(/:/g, "")}`, v = a(), { xAxisField: x, yAxisFields: C, seriesFields: w, errorCode: T } = h(() => G(t), [t]), E = h(() => t?.yAxisAssignment || {}, [t?.yAxisAssignment]), { data: D, seriesKeys: O } = h(() => T || !e || e.length === 0 || !x ? {
		data: [],
		seriesKeys: []
	} : i(e, x, C, o, w, v), [
		e,
		x,
		C,
		o,
		w,
		v,
		T
	]);
	try {
		let t = {
			showLegend: n?.showLegend ?? !0,
			showGrid: n?.showGrid ?? !0,
			showTooltip: n?.showTooltip ?? !0,
			connectNulls: n?.connectNulls ?? !1
		}, r = n?.showAllXLabels ?? !1, i = n?.leftYAxisFormat, a = n?.rightYAxisFormat;
		if (!e || e.length === 0) return /* @__PURE__ */ y(H, {
			height: s,
			hint: d("chart.runtime.noDataHint.area")
		});
		if (T) return /* @__PURE__ */ y(U, {
			height: s,
			hint: d(`chart.runtime.configErrorHint.${T}`)
		});
		let p = xe(C, v), h = q(C, E), { hasRightAxis: _ } = h, { effectiveShouldStack: w, effectiveIsPercentStack: k, stackOffset: A } = be(n, _), j = n?.showSummary === !0 && O.length > 0, M = j ? Ae(D, O, c, ke((e) => p[e], E), "name") : [], N = t.showLegend && !j, ne = J(_), { spreadTargets: P, enhancedChartData: F } = Z(D, n?.target);
		return !D || D.length === 0 ? /* @__PURE__ */ y(H, {
			height: s,
			titleKey: "chart.runtime.noValidData",
			hint: "No valid data points for area chart after transformation"
		}) : /* @__PURE__ */ b("div", {
			className: "dc:relative dc:w-full dc:flex dc:flex-col",
			style: { height: s },
			children: [j && /* @__PURE__ */ y(Me, {
				summaries: M,
				getSeriesLabel: (e) => e,
				valueFormat: i,
				rightValueFormat: a,
				showChange: Oe(o, x),
				leftOffset: X(_)
			}), /* @__PURE__ */ y("div", {
				className: j ? "dc:flex-1 dc:min-h-0" : "dc:contents",
				children: /* @__PURE__ */ y(z, {
					height: j ? "100%" : s,
					minHeight: j ? 0 : void 0,
					children: /* @__PURE__ */ b(ee, {
						data: F,
						margin: ne,
						stackOffset: A,
						accessibilityLayer: !1,
						children: [
							t.showGrid && /* @__PURE__ */ y(S, {
								strokeDasharray: "3 3",
								style: { pointerEvents: "none" }
							}),
							/* @__PURE__ */ y(te, {
								dataKey: "name",
								type: "category",
								tick: /* @__PURE__ */ y(V, {}),
								height: Y(F.map((e) => e?.name)),
								interval: r ? 0 : void 0
							}),
							pe(h, v, i, a, k),
							t.showTooltip && /* @__PURE__ */ y(B, { formatter: he({
								leftYAxisFormat: i,
								rightYAxisFormat: a,
								yAxisAssignment: E,
								resolveField: (e) => p[e],
								isPercentStack: k
							}) }),
							ge({
								show: N,
								iconType: "rect",
								paddingTop: 10,
								onHover: m,
								onLeave: () => m(null)
							}),
							!w && Ee(O, c, g),
							De({
								seriesKeys: O,
								colorPalette: c,
								seriesKeyToField: p,
								yAxisAssignment: E,
								hoveredLegend: f,
								connectNulls: t.connectNulls,
								shouldStack: w,
								showPoints: n?.showPoints ?? !1,
								drillEnabled: u,
								onDataPointClick: l,
								gradientIdPrefix: g
							}),
							me(P)
						]
					})
				})
			})]
		});
	} catch (e) {
		return /* @__PURE__ */ y(W, {
			height: s,
			chartType: "Area Chart",
			error: e
		});
	}
});
//#endregion
export { V as A, I as B, ue as C, U as D, G as E, M as F, k as H, j as I, R as L, z as M, se as N, H as O, N as P, A as R, Z as S, K as T, ne as V, he as _, je as a, ge as b, Oe as c, ve as d, Se as f, J as g, X as h, xe as i, B as j, W as k, ke as l, q as m, Ne as n, Ae as o, we as p, Me as r, $ as s, Pe as t, ye as u, me as v, de as w, Y as x, pe as y, L as z };

//# sourceMappingURL=chart-area-95fIdTeM.js.map