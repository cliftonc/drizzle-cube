import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { F as t, S as n } from "./chart-activity-grid-D6X0iOUw.js";
import { n as r } from "./chart-kpi-number-C9o880lP.js";
import i, { useEffect as a, useRef as o, useState as s } from "react";
import { jsx as c, jsxs as l } from "react/jsx-runtime";
//#region src/client/components/charts/kpiTextHelpers.ts
function u(e) {
	return e ? typeof e == "string" ? [e] : Array.isArray(e) ? e : [] : [];
}
function d(e, t) {
	return e.map((e) => {
		if (e[t] !== void 0) return e[t];
		let n = Object.keys(e);
		if (n.length > 0) return e[n[0]];
	}).filter((e) => e != null);
}
function f(e) {
	let t = e.map((e) => Number(e)).filter((e) => !isNaN(e));
	return t.length > 0 ? e.length === 1 ? {
		mainValue: e[0],
		min: null,
		max: null,
		showStats: !1
	} : {
		mainValue: t.reduce((e, t) => e + t, 0) / t.length,
		min: Math.min(...t),
		max: Math.max(...t),
		showStats: !0
	} : {
		mainValue: e.length === 1 ? e[0] : e.join(", "),
		min: null,
		max: null,
		showStats: !1
	};
}
function p(e, t) {
	if (t.formatValue) return t.formatValue(e);
	if (e == null) return "—";
	let n = t.decimals ?? 2, r = Math.abs(e);
	return r >= 1e9 ? (e / 1e9).toFixed(n) + "B" : r >= 1e6 ? (e / 1e6).toFixed(n) + "M" : r >= 1e3 ? (e / 1e3).toFixed(n) + "K" : e.toFixed(n);
}
function m(e, t) {
	let { value: n, valueField: r, fieldLabel: i, min: a, max: o, count: s, formatNumber: c } = t;
	try {
		let t = {
			value: typeof n == "number" ? c(n) : String(n),
			rawValue: n,
			field: r,
			fieldLabel: i,
			min: a === null ? "" : c(a),
			max: o === null ? "" : c(o),
			count: s
		};
		return e.replace(/\$\{(\w+)\}/g, (e, n) => n in t ? String(t[n]) : e);
	} catch {
		return String(n);
	}
}
function h(e, t) {
	return e !== void 0 && t?.colors && e >= 0 && e < t.colors.length ? t.colors[e] : t?.colors?.[0] || "#1f2937";
}
//#endregion
//#region src/client/components/charts/KpiText.tsx
var g = /* @__PURE__ */ e({ default: () => _ }), _ = i.memo(function({ data: e, chartConfig: i, displayConfig: g = {}, height: _ = "100%", colorPalette: v }) {
	let { t: y } = t(), [b, x] = s(28), [S, C] = s(0), w = o(null), T = o(null), E = n();
	if (a(() => {
		let e = () => {
			if (w.current) {
				let e = w.current.getBoundingClientRect(), t = e.width, n = e.height;
				if (t > 0 && n > 0) {
					let e = t / 8, r = n / 5;
					x(Math.max(18, Math.min(Math.min(e, r), 80)));
				}
			}
			if (T.current) {
				let e = T.current.getBoundingClientRect();
				C(e.width);
			}
		}, t = setTimeout(e, 100), n = new ResizeObserver(() => {
			clearTimeout(t), setTimeout(e, 50);
		});
		return w.current && n.observe(w.current), () => {
			clearTimeout(t), n.disconnect();
		};
	}, [e, i]), !e || e.length === 0) return /* @__PURE__ */ c("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full dc:h-full",
		style: {
			height: _ === "100%" ? "100%" : _,
			minHeight: _ === "100%" ? "200px" : void 0
		},
		children: /* @__PURE__ */ l("div", {
			className: "dc:text-center text-dc-text-muted",
			children: [/* @__PURE__ */ c("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: y("chart.runtime.noData")
			}), /* @__PURE__ */ c("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: y("chart.runtime.noDataHint.kpi")
			})]
		})
	});
	let D = u(i?.yAxis);
	if (D.length === 0) return /* @__PURE__ */ c("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full dc:h-full",
		style: {
			height: _ === "100%" ? "100%" : _,
			minHeight: _ === "100%" ? "200px" : void 0,
			backgroundColor: "var(--dc-danger-bg)",
			color: "var(--dc-danger)",
			borderColor: "var(--dc-danger-border)"
		},
		children: /* @__PURE__ */ l("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ c("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: y("chart.runtime.configError")
			}), /* @__PURE__ */ c("div", {
				className: "dc:text-xs",
				children: y("chart.runtime.configErrorHint.noMeasures")
			})]
		})
	});
	let O = D[0], k = d(e, O);
	if (k.length === 0) return /* @__PURE__ */ c("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full dc:h-full",
		style: {
			height: _ === "100%" ? "100%" : _,
			minHeight: _ === "100%" ? "200px" : void 0,
			backgroundColor: "var(--dc-warning-bg)",
			color: "var(--dc-warning)",
			borderColor: "var(--dc-warning-border)"
		},
		children: /* @__PURE__ */ l("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ c("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: y("chart.runtime.noValidData")
			}), /* @__PURE__ */ c("div", {
				className: "dc:text-xs",
				children: y("chart.runtime.noValidDataHint.kpiText")
			})]
		})
	});
	let { mainValue: A, min: j, max: M, showStats: N } = f(k), P = (e) => p(e, {
		formatValue: g.formatValue,
		decimals: g.decimals
	}), F = m(g.template || "${fieldLabel}: ${value}", {
		value: A,
		valueField: O,
		fieldLabel: E(O),
		min: j,
		max: M,
		count: k.length,
		formatNumber: P
	}), I = h(g.valueColorIndex, v);
	return /* @__PURE__ */ l("div", {
		ref: w,
		className: "dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full dc:h-full dc:p-4",
		style: {
			height: _ === "100%" ? "100%" : _,
			minHeight: _ === "100%" ? "200px" : void 0
		},
		children: [/* @__PURE__ */ c("div", {
			ref: T,
			className: "dc:font-bold dc:leading-tight dc:text-center",
			style: {
				fontSize: `${b}px`,
				color: I
			},
			children: F
		}), N && j !== null && M !== null && /* @__PURE__ */ c("div", {
			className: "dc:mt-4",
			children: /* @__PURE__ */ c(r, {
				values: k,
				min: j,
				max: M,
				color: I,
				formatValue: P,
				height: 24,
				width: S || 200
			})
		})]
	});
});
//#endregion
export { g as t };

//# sourceMappingURL=chart-kpi-text-agNEqDtQ.js.map