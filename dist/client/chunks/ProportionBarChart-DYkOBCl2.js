import { F as e, S as t, w as n } from "./chart-activity-grid-D6X0iOUw.js";
import { D as r, O as i, k as a, s as o } from "./chart-area-95fIdTeM.js";
import s, { useMemo as c } from "react";
import { jsx as l, jsxs as u } from "react/jsx-runtime";
//#region src/client/components/charts/ProportionBarChart.tsx
var d = s.memo(function({ data: s, chartConfig: d, displayConfig: f = {}, height: p = "100%", colorPalette: m }) {
	let { t: h } = e(), g = t(), _ = c(() => {
		let e = d?.xAxis;
		return (Array.isArray(e) ? e[0] : e) || "";
	}, [d?.xAxis]), v = c(() => {
		let e = d?.yAxis;
		return (Array.isArray(e) ? e[0] : e) || "";
	}, [d?.yAxis]), y = f.sortSegments ?? !1, { segments: b, total: x } = c(() => {
		if (!s || !_ || !v) return {
			segments: [],
			total: 0
		};
		let e = s.map((e, t) => {
			let n = e?.[v], r = typeof n == "number" ? n : parseFloat(String(n)), i = String(e?.[_] ?? "");
			return {
				id: `${t}:${i}`,
				label: i,
				value: !isNaN(r) && isFinite(r) && r > 0 ? r : 0
			};
		}).filter((e) => e.value > 0);
		y && e.sort((e, t) => t.value - e.value);
		let t = e.reduce((e, t) => e + t.value, 0);
		return {
			total: t,
			segments: e.map((e, n) => ({
				...e,
				share: t > 0 ? e.value / t * 100 : 0,
				color: o(m, n)
			}))
		};
	}, [
		s,
		_,
		v,
		m,
		y
	]);
	try {
		if (!s || s.length === 0) return /* @__PURE__ */ l(i, {
			height: p,
			hint: h("chart.runtime.noDataHint.proportionBar")
		});
		if (!_ || !v) return /* @__PURE__ */ l(r, {
			height: p,
			hint: h("chart.runtime.configErrorHint.proportionBar")
		});
		if (b.length === 0 || x === 0) return /* @__PURE__ */ l(i, {
			height: p,
			titleKey: "chart.runtime.noValidData",
			hint: h("chart.runtime.noValidDataHint.proportionBar")
		});
		let e = f.showLabels ?? !0, t = f.showPercentages ?? !0, a = f.decimals ?? 0;
		return /* @__PURE__ */ u("div", {
			className: "dc:w-full dc:h-full dc:flex dc:flex-col dc:justify-center dc:gap-3 dc:px-3 dc:py-2 dc:overflow-hidden",
			style: {
				height: "100%",
				minHeight: "80px"
			},
			"data-testid": "proportion-bar",
			children: [/* @__PURE__ */ l("div", {
				className: "dc:flex dc:w-full dc:overflow-hidden dc:rounded-sm",
				style: { height: 10 },
				children: b.map((e) => /* @__PURE__ */ l("div", {
					"data-testid": "proportion-bar-segment",
					title: `${e.label}: ${n(e.value, f.leftYAxisFormat)}`,
					style: {
						width: `${e.share}%`,
						backgroundColor: e.color
					}
				}, e.id))
			}), (e || t) && /* @__PURE__ */ l("div", {
				className: "dc:flex dc:flex-wrap dc:gap-x-6 dc:gap-y-2",
				children: b.map((n) => /* @__PURE__ */ u("div", {
					className: "dc:flex dc:flex-col dc:gap-0.5 dc:min-w-0",
					children: [e && /* @__PURE__ */ l("span", {
						className: "text-dc-text-muted dc:uppercase dc:truncate dc:font-semibold",
						style: {
							fontSize: "11px",
							letterSpacing: "0.06em"
						},
						children: n.label
					}), t && /* @__PURE__ */ u("span", {
						className: "dc:font-semibold dc:leading-none",
						style: {
							fontSize: "18px",
							color: n.color
						},
						children: [n.share.toFixed(a), "%"]
					})]
				}, n.id))
			})]
		});
	} catch (e) {
		return /* @__PURE__ */ l(a, {
			height: p,
			chartType: g(v),
			error: e
		});
	}
});
//#endregion
export { d as default };

//# sourceMappingURL=ProportionBarChart-DYkOBCl2.js.map