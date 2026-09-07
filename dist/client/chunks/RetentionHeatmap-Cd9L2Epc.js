import { c as e } from "./retention-ChW9jYdy.js";
import { F as t } from "./chart-activity-grid-D6X0iOUw.js";
import n, { useMemo as r, useState as i } from "react";
import { jsx as a, jsxs as o } from "react/jsx-runtime";
//#region src/client/components/charts/RetentionHeatmap.tsx
function s(e) {
	return `rgba(34, 197, 94, ${.1 + Math.max(0, Math.min(1, e)) * .7})`;
}
function c(e) {
	return e > .5 ? "#ffffff" : "var(--dc-text)";
}
function l(e) {
	if (/^\d{4}-\d{2}$/.test(e)) return e;
	let t = new Date(e);
	return isNaN(t.getTime()) ? e : t.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short"
	});
}
function u(e) {
	return `${Math.round(e * 100)}%`;
}
var d = n.memo(function({ data: n, height: d = "100%", displayConfig: f }) {
	let { t: p } = t(), [m, h] = i(null), g = r(() => {
		if (!n) return null;
		if (e(n)) return n;
		if (Array.isArray(n) && n.length > 0) {
			let e = n, t = [...new Set(e.map((e) => e.breakdownValue || "All Users"))].sort(), r = [...new Set(e.map((e) => e.period))].sort((e, t) => e - t);
			return {
				rows: e,
				breakdownValues: t.length > 1 || t[0] !== "All Users" ? t : void 0,
				periods: r
			};
		}
		return null;
	}, [n]), _ = r(() => {
		if (!g) return null;
		let { rows: e, breakdownValues: t, periods: n } = g, r = t || ["All Users"], i = /* @__PURE__ */ new Map();
		for (let t of e) i.set(`${t.breakdownValue || "All Users"}:${t.period}`, t);
		return r.map((e) => {
			let t = n.map((t) => i.get(`${e}:${t}`) || null);
			return {
				cohort: e,
				cohortSize: t[0]?.cohortSize ?? 0,
				periods: t
			};
		});
	}, [g]), v = (e, t, n, r) => {
		if (!r) return;
		let i = e.currentTarget.getBoundingClientRect();
		h({
			cohort: t,
			period: n,
			cohortSize: r.cohortSize,
			retainedUsers: r.retainedUsers,
			retentionRate: r.retentionRate,
			x: i.left + i.width / 2,
			y: i.top
		});
	}, y = () => {
		h(null);
	};
	if (!n || Array.isArray(n) && n.length === 0) return /* @__PURE__ */ a("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted",
		style: { height: d },
		children: /* @__PURE__ */ o("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ a("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: p("chart.runtime.noData")
			}), /* @__PURE__ */ a("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: p("chart.runtime.noDataHint.retention")
			})]
		})
	});
	if (!_ || _.length === 0) return /* @__PURE__ */ a("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted",
		style: { height: d },
		children: /* @__PURE__ */ o("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ a("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: p("chart.runtime.unableToRender")
			}), /* @__PURE__ */ a("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: p("chart.runtime.dataFormatIncorrect")
			})]
		})
	});
	let b = g?.periods ?? [], x = f?.showLegend ?? !0;
	return /* @__PURE__ */ o("div", {
		className: "dc:relative dc:w-full dc:h-full dc:overflow-auto",
		style: { height: d },
		children: [
			/* @__PURE__ */ o("table", {
				className: "dc:w-full dc:border-collapse dc:text-sm",
				children: [/* @__PURE__ */ a("thead", {
					className: "dc:sticky dc:top-0 bg-dc-bg dc:z-10",
					children: /* @__PURE__ */ o("tr", { children: [
						/* @__PURE__ */ a("th", {
							className: "dc:text-left dc:p-2 dc:font-medium text-dc-text dc:border-b border-dc-border dc:min-w-[100px]",
							children: p("chart.runtime.retention.cohort")
						}),
						/* @__PURE__ */ a("th", {
							className: "dc:text-right dc:p-2 dc:font-medium text-dc-text dc:border-b border-dc-border dc:min-w-[80px]",
							children: p("chart.runtime.retention.users")
						}),
						b.map((e) => /* @__PURE__ */ o("th", {
							className: "dc:text-center dc:p-2 dc:font-medium text-dc-text dc:border-b border-dc-border dc:min-w-[60px]",
							children: ["P", e]
						}, e))
					] })
				}), /* @__PURE__ */ a("tbody", { children: _.map((e, t) => /* @__PURE__ */ o("tr", {
					className: t % 2 == 0 ? "bg-dc-bg" : "bg-dc-surface-secondary",
					children: [
						/* @__PURE__ */ a("td", {
							className: "dc:p-2 dc:font-medium text-dc-text dc:border-b border-dc-border dc:whitespace-nowrap",
							children: l(e.cohort)
						}),
						/* @__PURE__ */ a("td", {
							className: "dc:p-2 dc:text-right text-dc-text-secondary dc:border-b border-dc-border",
							children: e.cohortSize.toLocaleString()
						}),
						e.periods.map((t, n) => {
							let r = b[n], i = t?.retentionRate ?? 0, o = t ? s(i) : "transparent", l = t ? c(i) : "var(--dc-text-muted)";
							return /* @__PURE__ */ a("td", {
								className: "dc:p-2 dc:text-center dc:border-b border-dc-border dc:cursor-default dc:transition-opacity dc:hover:opacity-80",
								style: {
									backgroundColor: o,
									color: l
								},
								onMouseEnter: (n) => v(n, e.cohort, r, t),
								onMouseLeave: y,
								children: t ? u(i) : "-"
							}, r);
						})
					]
				}, e.cohort)) })]
			}),
			x && /* @__PURE__ */ o("div", {
				className: "dc:flex dc:items-center dc:justify-center dc:mt-4 dc:gap-2 dc:text-xs text-dc-text-secondary",
				children: [
					/* @__PURE__ */ a("span", { children: "0%" }),
					/* @__PURE__ */ a("div", {
						className: "dc:flex dc:h-4",
						children: [
							0,
							.2,
							.4,
							.6,
							.8,
							1
						].map((e) => /* @__PURE__ */ a("div", {
							className: "dc:w-6 dc:h-4",
							style: { backgroundColor: s(e) }
						}, e))
					}),
					/* @__PURE__ */ a("span", { children: "100%" })
				]
			}),
			m && /* @__PURE__ */ o("div", {
				className: "dc:fixed dc:z-50 dc:px-3 dc:py-2 bg-dc-surface dc:border border-dc-border dc:rounded-sm dc:shadow-lg dc:text-sm dc:pointer-events-none",
				style: {
					left: m.x,
					top: m.y - 10,
					transform: "translate(-50%, -100%)"
				},
				children: [/* @__PURE__ */ a("div", {
					className: "dc:font-medium text-dc-text dc:mb-1",
					children: p("chart.runtime.retention.periodLabel", {
						cohort: l(m.cohort),
						period: m.period
					})
				}), /* @__PURE__ */ o("div", {
					className: "text-dc-text-secondary dc:space-y-0.5",
					children: [
						/* @__PURE__ */ a("div", { children: p("chart.runtime.retention.cohortSize", { count: m.cohortSize.toLocaleString() }) }),
						/* @__PURE__ */ a("div", { children: p("chart.runtime.retention.retained", { count: m.retainedUsers.toLocaleString() }) }),
						/* @__PURE__ */ a("div", {
							className: "dc:font-medium text-dc-text",
							children: p("chart.runtime.retention.rate", { rate: u(m.retentionRate) })
						})
					]
				})]
			})
		]
	});
});
//#endregion
export { d as default };

//# sourceMappingURL=RetentionHeatmap-Cd9L2Epc.js.map