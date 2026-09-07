import { a as e, i as t, n, o as r, r as i, s as a, t as o } from "./vendor-6y3E67du.js";
import { A as s, B as c, d as l, u, y as d } from "./chart-data-table-Bn9EtETl.js";
import { C as f, E as p, S as m, _ as h, b as g, bt as _, d as v, g as y, j as b, l as x, nt as S, rt as C, tt as w, u as T, v as E, y as D, yt as O } from "./DashboardEditModal-CBdNSTX_.js";
import { a as k, s as ee, t as A } from "./retention-ChW9jYdy.js";
import { A as te, D as j, F as M, I as ne, M as N, N as re, O as ie, P as ae, S as P, T as F, a as oe, d as se, j as I, k as L, l as ce, n as le, r as ue, s as de } from "./useDirtyStateTracking-B_jkA-0w.js";
import { B as fe, F as R } from "./chart-activity-grid-D6X0iOUw.js";
import { a as pe, i as me } from "./useExplainAI-BAJgZbo9.js";
import { r as he, s as ge } from "./chart-funnel-BwJxhDFk.js";
import { n as _e } from "./charts-core-pzDVGMWV.js";
import z, { createContext as ve, memo as ye, useCallback as B, useContext as be, useEffect as V, useMemo as H, useRef as U, useState as W } from "react";
import { Fragment as G, jsx as K, jsxs as q } from "react/jsx-runtime";
//#region src/shared/date-utils.ts
function xe(e) {
	let t = /* @__PURE__ */ new Date(), n = e.toLowerCase().trim(), r = t.getUTCFullYear(), i = t.getUTCMonth(), a = t.getUTCDate(), o = t.getUTCDay();
	if (n === "today") {
		let e = new Date(t);
		e.setUTCHours(0, 0, 0, 0);
		let n = new Date(t);
		return n.setUTCHours(23, 59, 59, 999), {
			start: e,
			end: n
		};
	}
	if (n === "yesterday") {
		let e = new Date(t);
		e.setUTCDate(a - 1), e.setUTCHours(0, 0, 0, 0);
		let n = new Date(t);
		return n.setUTCDate(a - 1), n.setUTCHours(23, 59, 59, 999), {
			start: e,
			end: n
		};
	}
	if (n === "this week") {
		let e = o === 0 ? -6 : 1 - o, n = new Date(t);
		n.setUTCDate(a + e), n.setUTCHours(0, 0, 0, 0);
		let r = new Date(n);
		return r.setUTCDate(n.getUTCDate() + 6), r.setUTCHours(23, 59, 59, 999), {
			start: n,
			end: r
		};
	}
	if (n === "this month") return {
		start: new Date(Date.UTC(r, i, 1, 0, 0, 0, 0)),
		end: new Date(Date.UTC(r, i + 1, 0, 23, 59, 59, 999))
	};
	if (n === "this quarter") {
		let e = Math.floor(i / 3);
		return {
			start: new Date(Date.UTC(r, e * 3, 1, 0, 0, 0, 0)),
			end: new Date(Date.UTC(r, e * 3 + 3, 0, 23, 59, 59, 999))
		};
	}
	if (n === "this year") return {
		start: new Date(Date.UTC(r, 0, 1, 0, 0, 0, 0)),
		end: new Date(Date.UTC(r, 11, 31, 23, 59, 59, 999))
	};
	let s = n.match(/^last\s+(\d+)\s+days?$/);
	if (s) {
		let e = parseInt(s[1], 10), n = new Date(t);
		n.setUTCDate(a - e + 1), n.setUTCHours(0, 0, 0, 0);
		let r = new Date(t);
		return r.setUTCHours(23, 59, 59, 999), {
			start: n,
			end: r
		};
	}
	let c = n.match(/^last\s+(\d+)\s+weeks?$/);
	if (c) {
		let e = parseInt(c[1], 10) * 7, n = new Date(t);
		n.setUTCDate(a - e + 1), n.setUTCHours(0, 0, 0, 0);
		let r = new Date(t);
		return r.setUTCHours(23, 59, 59, 999), {
			start: n,
			end: r
		};
	}
	if (n === "last week") {
		let e = o === 0 ? -13 : -6 - o, n = new Date(t);
		n.setUTCDate(a + e), n.setUTCHours(0, 0, 0, 0);
		let r = new Date(n);
		return r.setUTCDate(n.getUTCDate() + 6), r.setUTCHours(23, 59, 59, 999), {
			start: n,
			end: r
		};
	}
	if (n === "last month") return {
		start: new Date(Date.UTC(r, i - 1, 1, 0, 0, 0, 0)),
		end: new Date(Date.UTC(r, i, 0, 23, 59, 59, 999))
	};
	if (n === "last quarter") {
		let e = Math.floor(i / 3), t = e === 0 ? 3 : e - 1, n = e === 0 ? r - 1 : r;
		return {
			start: new Date(Date.UTC(n, t * 3, 1, 0, 0, 0, 0)),
			end: new Date(Date.UTC(n, t * 3 + 3, 0, 23, 59, 59, 999))
		};
	}
	if (n === "last year") return {
		start: new Date(Date.UTC(r - 1, 0, 1, 0, 0, 0, 0)),
		end: new Date(Date.UTC(r - 1, 11, 31, 23, 59, 59, 999))
	};
	if (n === "last 12 months") {
		let e = new Date(Date.UTC(r, i - 11, 1, 0, 0, 0, 0)), n = new Date(t);
		return n.setUTCHours(23, 59, 59, 999), {
			start: e,
			end: n
		};
	}
	let l = n.match(/^last\s+(\d+)\s+months?$/);
	if (l) {
		let e = new Date(Date.UTC(r, i - parseInt(l[1], 10) + 1, 1, 0, 0, 0, 0)), n = new Date(t);
		return n.setUTCHours(23, 59, 59, 999), {
			start: e,
			end: n
		};
	}
	let u = n.match(/^last\s+(\d+)\s+years?$/);
	if (u) {
		let e = new Date(Date.UTC(r - parseInt(u[1], 10), 0, 1, 0, 0, 0, 0)), n = new Date(t);
		return n.setUTCHours(23, 59, 59, 999), {
			start: e,
			end: n
		};
	}
	return null;
}
function Se(e) {
	if (Array.isArray(e)) {
		if (e.length < 2) return null;
		let t = new Date(e[0]), n = new Date(e[1]);
		return isNaN(t.getTime()) || isNaN(n.getTime()) ? null : (n.setUTCHours(23, 59, 59, 999), {
			start: t,
			end: n
		});
	}
	return xe(e);
}
function J(e) {
	return e.toISOString().split("T")[0];
}
function Ce(e, t) {
	let n = t.getTime() - e.getTime(), r = Math.ceil(n / 864e5), i = new Date(e);
	i.setUTCDate(i.getUTCDate() - 1), i.setUTCHours(23, 59, 59, 999);
	let a = new Date(i);
	return a.setUTCDate(a.getUTCDate() - r + 1), a.setUTCHours(0, 0, 0, 0), {
		start: a,
		end: i
	};
}
//#endregion
//#region src/client/components/AnalysisBuilder/utils/filterUtils.ts
function we(e, t) {
	let n = I(t, e);
	if (!n?.dateRange) return;
	let r = Se(n.dateRange);
	if (!r) return;
	let i = Ce(r.start, r.end);
	return [[J(r.start), J(r.end)], [J(i.start), J(i.end)]];
}
function Te(e, t) {
	return M(e, t, "inDateRange");
}
//#endregion
//#region src/client/components/AnalysisBuilder/utils/queryUtils.ts
function Ee(e, t, n, r, i = !1, a, o = !1) {
	let s = t.filter((e) => e.isTimeDimension && e.enableComparison).map((e) => e.field), c = n;
	if (!i) for (let e of s) c = Te(c, e);
	c = c.filter((e) => w(e));
	let l = {
		measures: e.map((e) => e.field),
		dimensions: t.filter((e) => !e.isTimeDimension).map((e) => e.field),
		timeDimensions: t.filter((e) => e.isTimeDimension).map((e) => {
			let t = {
				dimension: e.field,
				granularity: e.granularity || "day"
			};
			if (e.enableComparison) {
				let r = we(e.field, n);
				r && (t.compareDateRange = r);
			}
			return t;
		}),
		filters: c.length > 0 ? c : void 0,
		order: r && Object.keys(r).length > 0 ? r : void 0,
		limit: a ?? void 0,
		ungrouped: o || void 0
	};
	return l.measures?.length === 0 && delete l.measures, l.dimensions?.length === 0 && delete l.dimensions, l.timeDimensions?.length === 0 && delete l.timeDimensions, l;
}
function Y() {
	return {
		metrics: [],
		breakdowns: [],
		filters: [],
		order: void 0,
		limit: void 0,
		validationStatus: "idle",
		validationError: null
	};
}
//#endregion
//#region src/client/components/AnalysisBuilder/filterConfigModalUtils.ts
function De(e, t, n, r) {
	if (!t || n === 0) return { type: "none" };
	switch (e) {
		case "ArrowDown": return {
			type: "highlight",
			index: r < n - 1 ? r + 1 : 0
		};
		case "ArrowUp": return {
			type: "highlight",
			index: r > 0 ? r - 1 : n - 1
		};
		case "Enter": return r >= 0 && r < n ? {
			type: "select",
			index: r
		} : { type: "none" };
		case "Escape": return { type: "close" };
		default: return { type: "none" };
	}
}
//#endregion
//#region src/client/components/AnalysisBuilder/FilterValueInput.tsx
var Oe = d("close"), ke = d("chevronDown");
function Ae({ filter: e, dateRange: t }) {
	let { t: n } = R(), { rangeType: r, numberValue: i, label: a, isOpen: o, onToggle: s, onRangeTypeChange: c, onNumberValueChange: l, onCustomStartDate: u, onCustomEndDate: d, onOpen: f } = t;
	return /* @__PURE__ */ q("div", {
		className: "dc:space-y-2",
		children: [
			/* @__PURE__ */ q("div", {
				className: "dc:relative",
				children: [/* @__PURE__ */ q("button", {
					onClick: () => {
						f(), s(!o);
					},
					className: "dc:w-full dc:flex dc:items-center dc:justify-between dc:text-left dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text hover:bg-dc-surface-hover",
					children: [/* @__PURE__ */ K("span", {
						className: "dc:truncate",
						children: a
					}), /* @__PURE__ */ K(ke, { className: `dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0 dc:ml-2 dc:transition-transform ${o ? "dc:rotate-180" : ""}` })]
				}), o && /* @__PURE__ */ K("div", {
					className: "dc:absolute dc:z-[60] dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded-sm dc:shadow-lg dc:max-h-48 dc:overflow-y-auto",
					children: h.map((e) => /* @__PURE__ */ K("button", {
						onClick: () => c(e.value),
						className: `dc:w-full dc:text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover ${e.value === r ? "bg-dc-primary/10 text-dc-primary" : "text-dc-text"}`,
						children: n(e.label)
					}, e.value))
				})]
			}),
			j(r) && /* @__PURE__ */ q("div", {
				className: "dc:flex dc:items-center dc:gap-2",
				children: [/* @__PURE__ */ K("input", {
					type: "number",
					min: "1",
					max: "1000",
					value: i,
					onChange: (e) => l(Math.max(1, parseInt(e.target.value) || 1)),
					className: "dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text dc:w-20"
				}), /* @__PURE__ */ K("span", {
					className: "dc:text-sm text-dc-text-muted",
					children: r.replace("last_n_", "")
				})]
			}),
			r === "custom" && /* @__PURE__ */ q("div", {
				className: "dc:flex dc:items-center dc:gap-2",
				children: [
					/* @__PURE__ */ K("input", {
						type: "date",
						value: Array.isArray(e.dateRange) ? e.dateRange[0] : "",
						onChange: u,
						className: "dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-2 bg-dc-surface text-dc-text"
					}),
					/* @__PURE__ */ K("span", {
						className: "dc:text-sm text-dc-text-muted",
						children: n("filter.modal.dateTo")
					}),
					/* @__PURE__ */ K("input", {
						type: "date",
						value: Array.isArray(e.dateRange) ? e.dateRange[1] : "",
						onChange: d,
						className: "dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-2 bg-dc-surface text-dc-text"
					})
				]
			})
		]
	});
}
function je({ filter: e, combo: t }) {
	let { t: n } = R(), { options: r, loading: i, error: a, highlightedIndex: o, listRef: s, onSelect: c } = t;
	return i ? /* @__PURE__ */ K("div", {
		className: "dc:px-3 dc:py-2 dc:text-sm text-dc-text-muted",
		children: n("filter.modal.loading")
	}) : a ? /* @__PURE__ */ q("div", {
		className: "dc:px-3 dc:py-2 dc:text-sm text-dc-error",
		children: [n("filter.modal.errorPrefix"), String(a)]
	}) : r.length === 0 ? /* @__PURE__ */ K("div", {
		className: "dc:px-3 dc:py-2 dc:text-sm text-dc-text-muted",
		children: n("filter.modal.noValues")
	}) : /* @__PURE__ */ K("div", {
		ref: s,
		className: "dc:max-h-40 dc:overflow-y-auto",
		children: r.map((t, n) => {
			let r = e.values?.includes(t);
			return /* @__PURE__ */ q("button", {
				onClick: (e) => c(t, e),
				className: `dc:w-full dc:text-left dc:px-3 dc:py-2 dc:text-sm dc:transition-colors ${n === o ? "bg-dc-surface-hover" : ""} ${r ? "bg-dc-primary/10 text-dc-primary" : "text-dc-text hover:bg-dc-surface-hover"}`,
				children: [String(t), r && /* @__PURE__ */ K("span", {
					className: "dc:float-right",
					children: "✓"
				})]
			}, `${t}-${n}`);
		})
	});
}
function Me({ filter: e, operatorMeta: t, combo: n }) {
	let { t: r } = R(), { isOpen: i, loading: a, searchText: o, onSearchTextChange: s, onHighlightedIndexChange: c, onRemove: l, onKeyDown: u, onOpen: d } = n;
	return /* @__PURE__ */ q("div", {
		className: "dc:space-y-2",
		children: [
			e.values && e.values.length > 0 && /* @__PURE__ */ K("div", {
				className: "dc:flex dc:flex-wrap dc:gap-1.5",
				children: e.values.map((e, t) => /* @__PURE__ */ q("span", {
					className: "dc:inline-flex dc:items-center dc:gap-1 bg-dc-primary/10 text-dc-primary dc:text-sm dc:px-2 dc:py-1 dc:rounded-sm",
					children: [/* @__PURE__ */ K("span", {
						className: "dc:max-w-[150px] dc:truncate",
						children: String(e)
					}), /* @__PURE__ */ K("button", {
						onClick: () => l(e),
						className: "hover:text-dc-danger",
						children: /* @__PURE__ */ K(Oe, { className: "dc:w-3.5 dc:h-3.5" })
					})]
				}, t))
			}),
			/* @__PURE__ */ q("div", {
				className: "dc:relative",
				children: [/* @__PURE__ */ q("button", {
					onClick: () => {
						d();
					},
					className: "dc:w-full dc:flex dc:items-center dc:justify-between dc:text-left dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text hover:bg-dc-surface-hover",
					children: [/* @__PURE__ */ K("span", {
						className: "text-dc-text-muted dc:truncate",
						children: r(a ? "filter.modal.loading" : "filter.modal.selectValue")
					}), /* @__PURE__ */ K(ke, { className: `dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0 dc:ml-2 dc:transition-transform ${i ? "dc:rotate-180" : ""}` })]
				}), i && /* @__PURE__ */ q("div", {
					className: "dc:absolute dc:z-[60] dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded-sm dc:shadow-lg dc:max-h-56 dc:overflow-hidden",
					children: [/* @__PURE__ */ K("div", {
						className: "dc:p-2 dc:border-b border-dc-border",
						children: /* @__PURE__ */ K("input", {
							type: "text",
							value: o,
							onChange: (e) => {
								s(e.target.value), c(-1);
							},
							onKeyDown: u,
							placeholder: r("filter.modal.search"),
							className: "dc:w-full dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text",
							autoFocus: !0
						})
					}), /* @__PURE__ */ K(je, {
						filter: e,
						combo: n
					})]
				})]
			}),
			t?.supportsMultipleValues && /* @__PURE__ */ K("p", {
				className: "dc:text-xs text-dc-text-muted",
				children: r("filter.modal.multiSelectHint")
			})
		]
	});
}
function Ne({ field: e, dateRange: t, combo: n, inputs: r }) {
	let { t: i } = R(), { filter: a, operatorMeta: o, shouldShowDateRange: s, shouldShowComboBox: c } = e, { onBetweenStart: l, onBetweenEnd: u, onDate: d, onDirect: f } = r;
	return o?.requiresValues ? s ? /* @__PURE__ */ K(Ae, {
		filter: a,
		dateRange: t
	}) : a.operator === "between" || a.operator === "notBetween" ? /* @__PURE__ */ q("div", {
		className: "dc:flex dc:items-center dc:gap-2",
		children: [
			/* @__PURE__ */ K("input", {
				type: "number",
				value: a.values?.[0] ?? "",
				onChange: l,
				placeholder: i("filter.modal.min"),
				className: "dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
			}),
			/* @__PURE__ */ K("span", {
				className: "dc:text-sm text-dc-text-muted",
				children: i("filter.modal.to")
			}),
			/* @__PURE__ */ K("input", {
				type: "number",
				value: a.values?.[1] ?? "",
				onChange: u,
				placeholder: i("filter.modal.max"),
				className: "dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
			})
		]
	}) : o?.valueType === "date" ? /* @__PURE__ */ K("input", {
		type: "date",
		value: a.values?.[0] || "",
		onChange: d,
		className: "dc:w-full dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
	}) : o?.valueType === "number" ? /* @__PURE__ */ K("input", {
		type: "number",
		value: a.values?.[0] ?? "",
		onChange: f,
		placeholder: i("filter.modal.enterNumber"),
		className: "dc:w-full dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
	}) : c ? /* @__PURE__ */ K(Me, {
		filter: a,
		operatorMeta: o,
		combo: n
	}) : /* @__PURE__ */ K("input", {
		type: "text",
		value: a.values?.[0] ?? "",
		onChange: f,
		placeholder: i("filter.modal.enterValue"),
		className: "dc:w-full dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text placeholder-dc-text-muted"
	}) : /* @__PURE__ */ K("div", {
		className: "dc:text-sm text-dc-text-muted dc:italic dc:py-2",
		children: i("filter.modal.noValueRequired")
	});
}
//#endregion
//#region src/client/components/AnalysisBuilder/FilterConfigModal.tsx
var Pe = d("close"), Fe = d("chevronDown"), Ie = d("dimension"), Le = d("timeDimension"), Re = d("measure");
function ze({ filter: e, schema: t, onSave: n, onCancel: r, anchorElement: i }) {
	let { t: a } = R(), [o, s] = W(e), [c, l] = W(!1), [u, d] = W(!1), [f, p] = W(!1), [m, _] = W("this_month"), [v, b] = W(1), [x, w] = W(""), [T, E] = W(null), [O, k] = W(-1), ee = U(null), A = U(null), te = le(x, 300), M = D(o.member, t), ne = M?.field.type || "string", N = ne === "time", re = M?.fieldType === "measure", ie = M?.fieldType === "dimension", ae = g(o.member, t), P = S[o.operator], oe = C(ne), se = N && o.operator === "inDateRange", I = B(() => [
		"equals",
		"notEquals",
		"in",
		"notIn"
	].includes(o.operator) && ie && !N, [
		o.operator,
		ie,
		N
	])(), { values: L, loading: ce, error: de, searchValues: fe } = ue(o.member, I);
	V(() => {
		if (!i) {
			E(null);
			return;
		}
		let e = i.getBoundingClientRect(), t = e.top, n = window.innerHeight - e.bottom, r = t > 500 || t > n, a = Math.max(16, Math.min(e.left, window.innerWidth - 400 - 16));
		E(r ? {
			bottom: window.innerHeight - e.top + 8,
			left: a
		} : {
			top: e.bottom + 8,
			left: a
		});
	}, [i]), V(() => {
		let e = (e) => {
			ee.current && !ee.current.contains(e.target) && (l(!1), d(!1), p(!1));
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, []), V(() => {
		u && I && fe && fe("", !0), u || k(-1);
	}, [
		u,
		I,
		fe
	]), V(() => {
		if (O >= 0 && A.current) {
			let e = A.current.children[O];
			e && e.scrollIntoView({ block: "nearest" });
		}
	}, [O]), V(() => {
		u && I && fe && te !== void 0 && fe(te);
	}, [
		te,
		u,
		I,
		fe
	]), V(() => {
		if (!se) return;
		let e = y(o.dateRange);
		e && (_(e.rangeType), e.numberValue !== void 0 && b(e.numberValue));
	}, [o.dateRange, se]);
	let pe = B((e) => {
		s({
			member: o.member,
			operator: e,
			values: []
		}), l(!1);
	}, [o.member]), me = B((e, t) => {
		let n = t?.shiftKey ?? !1, r = o.values || [];
		P?.supportsMultipleValues ? (r.includes(e) ? s({
			...o,
			values: r.filter((t) => t !== e)
		}) : s({
			...o,
			values: [...r, e]
		}), n || d(!1)) : (s({
			...o,
			values: [e]
		}), d(!1)), w(""), k(-1);
	}, [o, P?.supportsMultipleValues]), he = B((e) => {
		let t = (o.values || []).filter((t) => t !== e);
		s({
			...o,
			values: t
		});
	}, [o]), ge = B((e) => {
		let t = De(e.key, u, L.length, O);
		if (t.type !== "none") {
			if (e.preventDefault(), t.type === "highlight") return k(t.index);
			if (t.type === "select") return me(L[t.index], { shiftKey: e.shiftKey });
			d(!1), k(-1);
		}
	}, [
		u,
		L,
		O,
		me
	]), _e = B((e) => {
		let t = e.target.value;
		if (P?.valueType === "number") {
			let e = parseFloat(t);
			isNaN(e) ? (t === "" || t === "-") && s({
				...o,
				values: []
			}) : s({
				...o,
				values: [e]
			});
		} else s({
			...o,
			values: t ? [t] : []
		});
	}, [o, P?.valueType]), z = B((e) => {
		let t = parseFloat(e.target.value), n = [isNaN(t) ? "" : t, (o.values?.length >= 2 ? o.values : ["", ""])[1]].filter((e) => e !== "");
		s({
			...o,
			values: n
		});
	}, [o]), ve = B((e) => {
		let t = parseFloat(e.target.value), n = [(o.values?.length >= 2 ? o.values : ["", ""])[0], isNaN(t) ? "" : t].filter((e) => e !== "");
		s({
			...o,
			values: n
		});
	}, [o]), ye = B((e) => {
		let t = e.target.value;
		s({
			...o,
			values: t ? [t] : []
		});
	}, [o]), be = B((e) => {
		_(e), p(!1);
		let t;
		if (e === "custom") {
			let e = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
			t = [e, e];
		} else t = j(e) ? F(e, v) : F(e);
		s({
			...o,
			dateRange: t
		});
	}, [o, v]), xe = B((e) => {
		if (b(e), j(m)) {
			let t = F(m, e);
			s({
				...o,
				dateRange: t
			});
		}
	}, [o, m]), Se = B((e) => {
		let t = e.target.value, n = (Array.isArray(o.dateRange) ? o.dateRange : [o.dateRange || "", ""])[1] || t;
		s({
			...o,
			dateRange: [t, n]
		});
	}, [o]), J = B((e) => {
		let t = e.target.value, n = (Array.isArray(o.dateRange) ? o.dateRange : ["", o.dateRange || ""])[0] || t;
		s({
			...o,
			dateRange: [n, t]
		});
	}, [o]), Ce = a(oe.find((e) => e.operator === o.operator)?.label || o.operator), we = a(h.find((e) => e.value === m)?.label || "filter.modal.selectRange"), Te = {
		filter: o,
		operatorMeta: P,
		shouldShowDateRange: se,
		shouldShowComboBox: I
	}, Ee = {
		rangeType: m,
		numberValue: v,
		label: we,
		isOpen: f,
		onToggle: p,
		onRangeTypeChange: be,
		onNumberValueChange: xe,
		onCustomStartDate: Se,
		onCustomEndDate: J,
		onOpen: B(() => {
			l(!1), d(!1);
		}, [])
	}, Y = {
		isOpen: u,
		options: L,
		loading: ce,
		error: de,
		searchText: x,
		highlightedIndex: O,
		listRef: A,
		onSearchTextChange: w,
		onHighlightedIndexChange: k,
		onSelect: me,
		onRemove: he,
		onKeyDown: ge,
		onOpen: B(() => {
			l(!1), p(!1), d((e) => !e);
		}, [])
	}, Oe = H(() => ({
		onBetweenStart: z,
		onBetweenEnd: ve,
		onDate: ye,
		onDirect: _e
	}), [
		z,
		ve,
		ye,
		_e
	]), ke = N ? Le : re ? Re : Ie;
	return /* @__PURE__ */ K(G, { children: /* @__PURE__ */ K("div", {
		className: `dc:fixed dc:inset-0 bg-dc-overlay dc:z-50 ${T ? "" : "dc:flex dc:items-center dc:justify-center dc:p-4"}`,
		onClick: r,
		children: /* @__PURE__ */ q("div", {
			ref: ee,
			className: T ? "bg-dc-surface dc:rounded-lg dc:border border-dc-border" : "bg-dc-surface dc:rounded-lg dc:border border-dc-border dc:max-w-md dc:w-full",
			style: {
				...T ? {
					position: "fixed",
					...T,
					maxWidth: "400px",
					width: "100%"
				} : {},
				boxShadow: "var(--dc-shadow-xl)"
			},
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ q("div", {
					className: "dc:flex dc:items-center dc:justify-between dc:p-4 dc:border-b border-dc-border",
					children: [/* @__PURE__ */ K("h2", {
						className: "dc:text-lg dc:font-semibold text-dc-text",
						children: a("filter.modal.title")
					}), /* @__PURE__ */ K("button", {
						onClick: r,
						className: "dc:p-1 text-dc-text-muted hover:text-dc-text dc:transition-colors",
						children: /* @__PURE__ */ K(Pe, { className: "dc:w-5 dc:h-5" })
					})]
				}),
				/* @__PURE__ */ q("div", {
					className: "dc:p-4 dc:space-y-4",
					children: [
						/* @__PURE__ */ q("div", { children: [/* @__PURE__ */ K("label", {
							className: "dc:block dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2",
							children: a("filter.modal.fieldLabel")
						}), /* @__PURE__ */ q("div", {
							className: "dc:flex dc:items-center dc:gap-2 dc:p-3 bg-dc-surface-secondary dc:rounded-sm",
							children: [/* @__PURE__ */ K(ke, { className: "dc:w-5 dc:h-5 text-dc-filter-text" }), /* @__PURE__ */ K("span", {
								className: "dc:text-sm dc:font-medium text-dc-text",
								children: ae
							})]
						})] }),
						/* @__PURE__ */ q("div", { children: [/* @__PURE__ */ K("label", {
							className: "dc:block dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2",
							children: a("filter.modal.operatorLabel")
						}), /* @__PURE__ */ q("div", {
							className: "dc:relative",
							children: [/* @__PURE__ */ q("button", {
								onClick: () => {
									d(!1), p(!1), l(!c);
								},
								className: "dc:w-full dc:flex dc:items-center dc:justify-between dc:text-left dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-3 dc:py-2 bg-dc-surface text-dc-text hover:bg-dc-surface-hover",
								children: [/* @__PURE__ */ K("span", {
									className: "dc:truncate",
									children: Ce
								}), /* @__PURE__ */ K(Fe, { className: `dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0 dc:ml-2 dc:transition-transform ${c ? "dc:rotate-180" : ""}` })]
							}), c && /* @__PURE__ */ K("div", {
								className: "dc:absolute dc:z-[60] dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded-sm dc:shadow-lg dc:max-h-48 dc:overflow-y-auto",
								children: oe.map((e) => /* @__PURE__ */ K("button", {
									onClick: () => pe(e.operator),
									className: `dc:w-full dc:text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover ${e.operator === o.operator ? "bg-dc-primary/10 text-dc-primary" : "text-dc-text"}`,
									children: a(e.label)
								}, e.operator))
							})]
						})] }),
						/* @__PURE__ */ q("div", { children: [/* @__PURE__ */ K("label", {
							className: "dc:block dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2",
							children: a("filter.modal.valueLabel")
						}), /* @__PURE__ */ K(Ne, {
							field: Te,
							dateRange: Ee,
							combo: Y,
							inputs: Oe
						})] })
					]
				}),
				/* @__PURE__ */ q("div", {
					className: "dc:flex dc:items-center dc:justify-end dc:gap-2 dc:p-4 dc:border-t border-dc-border",
					children: [/* @__PURE__ */ K("button", {
						onClick: r,
						className: "dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-dc-text-secondary hover:text-dc-text dc:transition-colors",
						children: a("common.actions.cancel")
					}), /* @__PURE__ */ K("button", {
						onClick: () => n(o),
						className: "dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-dc-primary-content bg-dc-primary hover:bg-dc-primary-hover dc:rounded-sm dc:transition-colors",
						children: a("common.actions.save")
					})]
				})
			]
		})
	}) });
}
//#endregion
//#region src/client/components/AnalysisBuilder/AnalysisFilterItem.tsx
var Be = d("close"), Ve = d("dimension"), He = d("timeDimension"), Ue = d("measure");
function We({ filter: e, schema: t, onRemove: n, onUpdate: r }) {
	let { t: i } = R(), [a, o] = W(!1), s = U(null), c = D(e.member, t), l = (c?.field.type || "string") === "time", u = c?.fieldType === "measure", d = g(e.member, t), f = S[e.operator], p = f?.label ? i(f.label) : e.operator, m = Ge(e, f, i), h = l ? He : u ? Ue : Ve;
	return /* @__PURE__ */ q(G, { children: [/* @__PURE__ */ q("div", {
		className: "dc:flex dc:items-start dc:gap-2 dc:px-2 dc:py-1.5 bg-dc-surface-secondary dc:rounded-lg dc:group hover:bg-dc-surface-tertiary dc:transition-all dc:duration-150 dc:w-full",
		children: [
			/* @__PURE__ */ K("span", {
				className: `dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded-sm ${l ? "bg-dc-time-dimension" : u ? "bg-dc-measure" : "bg-dc-dimension"} ${l ? "text-dc-time-dimension-text" : u ? "text-dc-measure-text" : "text-dc-dimension-text"} dc:flex-shrink-0 dc:mt-0.5`,
				children: h && /* @__PURE__ */ K(h, { className: "dc:w-4 dc:h-4" })
			}),
			/* @__PURE__ */ K("button", {
				ref: s,
				onClick: () => o(!0),
				className: "dc:flex-1 dc:min-w-0 dc:text-left",
				title: `${d} ${p} ${m}`,
				children: /* @__PURE__ */ q("div", {
					className: "dc:text-sm text-dc-text dc:break-words",
					children: [
						/* @__PURE__ */ K("span", {
							className: "dc:font-medium",
							children: d
						}),
						/* @__PURE__ */ K("span", {
							className: "text-dc-text-muted dc:mx-1",
							children: p
						}),
						/* @__PURE__ */ K("span", {
							className: "text-dc-primary",
							children: m
						})
					]
				})
			}),
			/* @__PURE__ */ K("button", {
				onClick: n,
				className: "dc:p-1 text-dc-text-muted hover:text-dc-danger dc:opacity-100 dc:sm:opacity-0 dc:sm:group-hover:opacity-100 dc:transition-opacity dc:flex-shrink-0 dc:mt-0.5",
				title: i("filter.removeButton.title"),
				children: Be && /* @__PURE__ */ K(Be, { className: "dc:w-4 dc:h-4" })
			})
		]
	}), a && /* @__PURE__ */ K(ze, {
		filter: e,
		schema: t,
		onSave: (e) => {
			r(e), o(!1);
		},
		onCancel: () => o(!1),
		anchorElement: s.current
	})] });
}
function Ge(e, t, n) {
	if (!t?.requiresValues) return "";
	if (e.dateRange) return Array.isArray(e.dateRange) ? `${e.dateRange[0]} to ${e.dateRange[1]}` : e.dateRange;
	let r = e.values || [];
	return r.length === 0 ? n("filter.valueDisplay.empty") : r.length === 1 ? String(r[0]) : r.length === 2 ? `${r[0]}, ${r[1]}` : `${r[0]}, ${r[1]}, +${r.length - 2} ${n("filter.valueDisplay.more")}`;
}
//#endregion
//#region src/client/components/AnalysisBuilder/AnalysisFilterGroup.tsx
var Ke = d("add"), qe = d("close");
function Je({ group: e, schema: t, onUpdate: n, onRemove: r, onAddFilter: i, depth: a = 0, hideRemoveButton: o = !1 }) {
	let { t: s } = R(), [c, l] = W(!1), u = U(null);
	V(() => {
		let e = (e) => {
			u.current && !u.current.contains(e.target) && l(!1);
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, []);
	let d = B(() => {
		n(ne(e));
	}, [e, n]), f = B((t, r) => {
		let i = [...e.filters];
		i[t] = r, n({
			...e,
			filters: i
		});
	}, [e, n]), p = B((t) => {
		let i = e.filters.filter((e, n) => n !== t);
		i.length === 0 ? r() : n({
			...e,
			filters: i
		});
	}, [
		e,
		n,
		r,
		a
	]), m = B((t) => {
		let r = {
			type: t,
			filters: []
		};
		n({
			...e,
			filters: [...e.filters, r]
		}), l(!1);
	}, [e, n]), h = B(() => {
		i([]), l(!1);
	}, [i]), g = B((e) => (t = []) => {
		i([e, ...t]);
	}, [i]), _ = () => a % 2 == 0 ? "border-dc-border" : "border-dc-border dark:border-dc-border", v = () => e.type === "and" ? "bg-dc-info-bg/50" : "bg-dc-warning-bg/50", y = e.filters.length, b = s(y === 1 ? "filter.group.condition" : "filter.group.conditions");
	return /* @__PURE__ */ q("div", {
		className: `dc:border ${_()} dc:rounded-lg bg-dc-surface dc:w-full`,
		children: [/* @__PURE__ */ q("div", {
			className: `dc:flex dc:items-center dc:justify-between dc:px-2 dc:py-1.5 dc:border-b border-dc-border/50 dc:rounded-t-lg ${v()}`,
			children: [/* @__PURE__ */ q("div", {
				className: "dc:flex dc:items-center dc:gap-2",
				children: [/* @__PURE__ */ K("button", {
					onClick: d,
					className: `dc:px-2 dc:py-0.5 dc:text-xs dc:font-semibold dc:rounded-sm dc:transition-colors ${e.type === "and" ? "bg-dc-info-bg text-dc-info dc:hover:opacity-80" : "bg-dc-warning-bg text-dc-warning dc:hover:opacity-80"}`,
					title: `Click to switch to ${e.type === "and" ? "OR" : "AND"}`,
					children: e.type.toUpperCase()
				}), /* @__PURE__ */ q("span", {
					className: "dc:text-xs text-dc-text-muted",
					children: [
						y,
						" ",
						b
					]
				})]
			}), /* @__PURE__ */ q("div", {
				className: "dc:flex dc:items-center dc:gap-1",
				children: [/* @__PURE__ */ q("div", {
					className: "dc:relative",
					ref: u,
					children: [/* @__PURE__ */ K("button", {
						onClick: () => l(!c),
						className: "dc:p-1 text-dc-text-secondary hover:text-dc-primary hover:bg-dc-surface-hover dc:rounded-sm dc:transition-colors",
						title: "Add condition",
						children: /* @__PURE__ */ K(Ke, { className: "dc:w-4 dc:h-4" })
					}), c && /* @__PURE__ */ q("div", {
						className: "dc:absolute dc:right-0 dc:mt-1 dc:z-40 bg-dc-surface dc:border border-dc-border dc:rounded-sm dc:shadow-lg dc:py-1 dc:min-w-[120px]",
						children: [
							/* @__PURE__ */ K("button", {
								onClick: h,
								className: "dc:w-full dc:text-left dc:px-3 dc:py-1.5 dc:text-xs text-dc-text hover:bg-dc-surface-hover",
								children: s("filter.group.addFilter")
							}),
							/* @__PURE__ */ K("button", {
								onClick: () => m("and"),
								className: "dc:w-full dc:text-left dc:px-3 dc:py-1.5 dc:text-xs text-dc-text hover:bg-dc-surface-hover",
								children: s("filter.group.addAndGroup")
							}),
							/* @__PURE__ */ K("button", {
								onClick: () => m("or"),
								className: "dc:w-full dc:text-left dc:px-3 dc:py-1.5 dc:text-xs text-dc-text hover:bg-dc-surface-hover",
								children: s("filter.group.addOrGroup")
							})
						]
					})]
				}), !o && /* @__PURE__ */ K("button", {
					onClick: r,
					className: "dc:p-1 text-dc-text-muted hover:text-dc-danger dc:transition-colors",
					title: s("filter.group.removeGroup"),
					children: /* @__PURE__ */ K(qe, { className: "dc:w-4 dc:h-4" })
				})]
			})]
		}), /* @__PURE__ */ K("div", {
			className: "dc:p-1.5 dc:flex dc:flex-wrap dc:gap-2",
			children: e.filters.length === 0 ? /* @__PURE__ */ q("div", {
				className: "dc:text-center dc:py-3",
				children: [/* @__PURE__ */ K("p", {
					className: "dc:text-xs text-dc-text-muted dc:mb-1",
					children: s("filter.group.empty")
				}), /* @__PURE__ */ K("button", {
					onClick: () => i([]),
					className: "dc:text-xs text-dc-primary dc:hover:underline",
					children: s("filter.group.addFilterLink")
				})]
			}) : e.filters.map((e, n) => re(e) ? /* @__PURE__ */ K(We, {
				filter: e,
				schema: t,
				onUpdate: (e) => f(n, e),
				onRemove: () => p(n)
			}, `filter-${n}`) : N(e) ? /* @__PURE__ */ K(Je, {
				group: e,
				schema: t,
				onUpdate: (e) => f(n, e),
				onRemove: () => p(n),
				onAddFilter: g(n),
				depth: a + 1
			}, `group-${n}`) : null)
		})]
	});
}
//#endregion
//#region src/client/components/AnalysisBuilder/AnalysisFilterSection.tsx
var Ye = d("add");
function Xe({ filters: e, schema: t, onFiltersChange: n, onFieldDropped: r, dimensionsOnly: i = !1 }) {
	let { t: a } = R(), [o, s] = W(!1), [c, l] = W(!1), u = U([]), d = L(e), f = B((e) => {
		e.preventDefault(), e.stopPropagation(), l(!0);
	}, []), p = B((e) => {
		e.preventDefault(), e.stopPropagation(), l(!1);
	}, []), m = B((e) => {
		e.preventDefault(), e.stopPropagation(), l(!1);
		try {
			let t = JSON.parse(e.dataTransfer.getData("text/plain"));
			t.field && r && r(t.field);
		} catch {}
	}, [r]), h = te(e), g = B((t, r, i) => {
		let a = t.type === "time", o = a ? "inDateRange" : "equals", c = {
			member: t.name,
			operator: o,
			values: []
		};
		a && o === "inDateRange" && (c.dateRange = F("this_month")), n(ie(e, u.current, c)), s(!1), u.current = [];
	}, [e, n]), _ = B((t, r) => {
		let i = [...e];
		i[t] = r, n(i);
	}, [e, n]), v = B((t) => {
		n(ae(e, t));
	}, [e, n]), y = B(() => {
		n([]);
	}, [n]), b = B(() => {
		u.current = [], s(!0);
	}, []), x = B((e) => (t = []) => {
		u.current = [...e, ...t], s(!0);
	}, []), S = (n, r, i = []) => {
		let a = [...i, r];
		return re(n) ? /* @__PURE__ */ K(We, {
			filter: n,
			schema: t,
			onUpdate: (e) => _(r, e),
			onRemove: () => v(r)
		}, `filter-${a.join("-")}`) : N(n) ? /* @__PURE__ */ K(Je, {
			group: n,
			schema: t,
			onUpdate: (e) => _(r, e),
			onRemove: () => v(r),
			onAddFilter: x(a),
			hideRemoveButton: e.length === 1
		}, `group-${a.join("-")}`) : null;
	};
	return /* @__PURE__ */ q("div", { children: [
		/* @__PURE__ */ q("button", {
			onClick: b,
			className: "dc:flex dc:items-center dc:justify-between dc:mb-3 dc:w-full dc:py-1 dc:px-2 dc:-ml-2 dc:rounded-lg hover:bg-dc-primary/10 dc:transition-colors dc:group",
			title: "Add filter",
			children: [/* @__PURE__ */ q(_e, { children: [a("analysis.sections.filters"), d > 0 && /* @__PURE__ */ q("span", {
				className: "dc:ml-1.5 dc:text-xs dc:font-normal text-dc-text-muted dc:normal-case dc:tracking-normal",
				children: [
					"(",
					d,
					")"
				]
			})] }), /* @__PURE__ */ q("div", {
				className: "dc:flex dc:items-center dc:gap-2",
				children: [d > 0 && /* @__PURE__ */ K("span", {
					role: "button",
					tabIndex: 0,
					onClick: (e) => {
						e.stopPropagation(), y();
					},
					onKeyDown: (e) => {
						(e.key === "Enter" || e.key === " ") && (e.stopPropagation(), y());
					},
					className: "dc:text-xs text-dc-text-muted hover:text-dc-error dc:underline dc:cursor-pointer",
					children: a("filter.section.clearAll")
				}), /* @__PURE__ */ K(Ye, { className: "dc:w-5 dc:h-5 text-dc-text-secondary group-hover:text-dc-primary dc:transition-colors" })]
			})]
		}),
		/* @__PURE__ */ K("div", {
			onDragOver: r ? f : void 0,
			onDragLeave: r ? p : void 0,
			onDrop: r ? m : void 0,
			className: `dc:p-2 dc:-mx-2 dc:rounded-lg dc:border-2 dc:border-dashed dc:transition-all ${c ? "border-dc-primary bg-dc-primary/5" : "border-transparent"}`,
			children: e.length === 0 ? /* @__PURE__ */ K("p", {
				className: `dc:text-sm ${c ? "text-dc-primary dc:font-medium" : "text-dc-text-muted"}`,
				children: a(c ? "filter.section.dropHint" : "filter.section.empty")
			}) : /* @__PURE__ */ K("div", {
				className: "dc:flex dc:flex-wrap dc:gap-2",
				children: e.map((e, t) => S(e, t))
			})
		}),
		/* @__PURE__ */ K(E, {
			isOpen: o,
			onClose: () => {
				s(!1), u.current = [];
			},
			onSelect: g,
			mode: i ? "dimensionFilter" : "filter",
			schema: t,
			selectedFields: h
		})
	] });
}
//#endregion
//#region src/client/components/AnalysisBuilder/ExplainAIPanel.tsx
function Ze(e) {
	return typeof e == "string" ? e : typeof e == "object" && e ? JSON.stringify(e) : String(e ?? "");
}
var Qe = {
	good: "bg-dc-success-bg text-dc-success border-dc-success",
	warning: "bg-dc-warning-bg text-dc-warning border-dc-warning",
	critical: "bg-dc-danger-bg text-dc-error border-dc-error"
}, $e = {
	critical: "bg-dc-danger-bg text-dc-error",
	warning: "bg-dc-warning-bg text-dc-warning",
	suggestion: "bg-dc-accent-bg text-dc-accent"
}, et = {
	high: "text-dc-error",
	medium: "text-dc-warning",
	low: "text-dc-text-muted"
};
function tt({ assessment: e, reason: t }) {
	let { t: n } = R(), r = {
		good: n("explainAI.assessment.good"),
		warning: n("explainAI.assessment.warning"),
		critical: n("explainAI.assessment.critical")
	};
	return /* @__PURE__ */ q("div", {
		className: `dc:p-4 dc:rounded-lg dc:border ${Qe[e]}`,
		children: [/* @__PURE__ */ K("div", {
			className: "dc:flex dc:items-center dc:gap-2 dc:mb-1",
			children: /* @__PURE__ */ q("span", {
				className: "dc:font-semibold dc:uppercase dc:text-base",
				children: [
					e === "good" && "✓ ",
					e === "warning" && "⚠ ",
					e === "critical" && "✕ ",
					r[e]
				]
			})
		}), /* @__PURE__ */ K("p", {
			className: "dc:text-sm",
			children: Ze(t)
		})]
	});
}
function nt({ issue: e }) {
	return /* @__PURE__ */ q("div", {
		className: "dc:flex dc:items-start dc:gap-2 dc:py-2",
		children: [/* @__PURE__ */ q("span", {
			className: `dc:text-sm ${et[e.severity]}`,
			children: [
				e.severity === "high" && "●",
				e.severity === "medium" && "○",
				e.severity === "low" && "○"
			]
		}), /* @__PURE__ */ K("span", {
			className: "dc:text-sm text-dc-text-secondary",
			children: Ze(e.description)
		})]
	});
}
function rt({ text: e }) {
	let { t } = R(), [n, r] = z.useState(!1), i = z.useRef(null);
	return z.useEffect(() => () => {
		i.current && clearTimeout(i.current);
	}, []), /* @__PURE__ */ K("button", {
		onClick: async () => {
			try {
				await navigator.clipboard.writeText(e), r(!0), i.current && clearTimeout(i.current), i.current = setTimeout(() => r(!1), 2e3);
			} catch (e) {
				console.error("Failed to copy:", e);
			}
		},
		className: "dc:px-2 dc:py-1 dc:text-xs dc:rounded-sm bg-dc-surface hover:bg-dc-surface-hover text-dc-text-muted",
		title: "Copy to clipboard",
		children: t(n ? "explainAI.copied" : "explainAI.copy")
	});
}
function it({ rec: e }) {
	let { t } = R(), n = {
		index: t("explainAI.type.index"),
		table: t("explainAI.type.table"),
		cube: t("explainAI.type.cube"),
		general: t("explainAI.type.general")
	};
	return /* @__PURE__ */ q("div", {
		className: "dc:p-4 dc:border border-dc-border dc:rounded-lg bg-dc-surface",
		children: [
			/* @__PURE__ */ q("div", {
				className: "dc:flex dc:items-center dc:gap-2 dc:mb-2",
				children: [/* @__PURE__ */ K("span", {
					className: `dc:px-2 dc:py-0.5 dc:text-xs dc:font-medium dc:rounded-sm ${$e[e.severity]}`,
					children: n[e.type]
				}), /* @__PURE__ */ K("h5", {
					className: "dc:font-medium text-dc-text",
					children: Ze(e.title)
				})]
			}),
			/* @__PURE__ */ K("p", {
				className: "dc:text-sm text-dc-text-secondary dc:mb-3",
				children: Ze(e.description)
			}),
			e.sql && /* @__PURE__ */ K("div", {
				className: "dc:mt-2",
				children: /* @__PURE__ */ K(b, {
					code: e.sql,
					language: "sql",
					headerRight: /* @__PURE__ */ K(rt, { text: e.sql })
				})
			}),
			e.cubeCode && /* @__PURE__ */ q("div", {
				className: "dc:mt-2",
				children: [e.cubeName && /* @__PURE__ */ K("p", {
					className: "dc:text-xs text-dc-text-muted dc:mb-1",
					children: t("explainAI.addToCube", { cubeName: e.cubeName })
				}), /* @__PURE__ */ q("div", {
					className: "dc:relative",
					children: [/* @__PURE__ */ K("pre", {
						className: "dc:p-3 dc:text-xs bg-dc-surface-secondary dc:rounded-sm dc:overflow-x-auto dc:font-mono text-dc-text",
						children: e.cubeCode
					}), /* @__PURE__ */ K("div", {
						className: "dc:absolute dc:top-1 dc:right-1",
						children: /* @__PURE__ */ K(rt, { text: e.cubeCode })
					})]
				})]
			}),
			e.estimatedImpact && /* @__PURE__ */ q("p", {
				className: "dc:text-xs text-dc-text-muted dc:mt-2",
				children: [
					/* @__PURE__ */ K("strong", { children: t("explainAI.expectedImpact") }),
					" ",
					Ze(e.estimatedImpact)
				]
			})
		]
	});
}
function at({ analysis: e, onClose: t, onClear: n }) {
	let { t: r } = R(), i = t || n;
	return z.useEffect(() => {
		let e = (e) => {
			e.key === "Escape" && i && i();
		};
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [i]), z.useEffect(() => (document.body.style.overflow = "hidden", () => {
		document.body.style.overflow = "";
	}), []), /* @__PURE__ */ q("div", {
		className: "dc:fixed dc:inset-0 dc:z-50 dc:flex dc:items-center dc:justify-center dc:p-4 bg-black/50",
		children: [/* @__PURE__ */ K("div", {
			className: "dc:absolute dc:inset-0",
			onClick: i,
			"aria-hidden": "true"
		}), /* @__PURE__ */ q("div", {
			className: "dc:relative dc:w-full dc:max-w-4xl dc:max-h-[90vh] bg-dc-surface dc:rounded-lg dc:shadow-xl dc:flex dc:flex-col",
			children: [
				/* @__PURE__ */ q("div", {
					className: "dc:flex dc:items-center dc:justify-between dc:px-6 dc:py-4 dc:border-b border-dc-border dc:flex-shrink-0",
					children: [/* @__PURE__ */ q("div", {
						className: "dc:flex dc:items-center dc:gap-3",
						children: [/* @__PURE__ */ K("span", {
							className: "dc:text-lg",
							children: "✨"
						}), /* @__PURE__ */ K("h3", {
							className: "dc:text-lg dc:font-semibold text-dc-text",
							children: r("explainAI.title")
						})]
					}), /* @__PURE__ */ K("button", {
						onClick: i,
						className: "dc:p-2 dc:rounded-lg hover:bg-dc-surface-hover text-dc-text-secondary hover:text-dc-text dc:transition-colors",
						"aria-label": "Close",
						children: /* @__PURE__ */ K("svg", {
							className: "dc:w-5 dc:h-5",
							fill: "none",
							stroke: "currentColor",
							viewBox: "0 0 24 24",
							children: /* @__PURE__ */ K("path", {
								strokeLinecap: "round",
								strokeLinejoin: "round",
								strokeWidth: 2,
								d: "M6 18L18 6M6 6l12 12"
							})
						})
					})]
				}),
				/* @__PURE__ */ q("div", {
					className: "dc:flex-1 dc:overflow-y-auto dc:px-6 dc:py-4 dc:space-y-6",
					children: [
						/* @__PURE__ */ K(tt, {
							assessment: e.assessment,
							reason: e.assessmentReason
						}),
						/* @__PURE__ */ q("div", { children: [/* @__PURE__ */ K("h4", {
							className: "dc:text-sm dc:font-semibold text-dc-text-muted dc:uppercase dc:mb-2",
							children: r("explainAI.summary")
						}), /* @__PURE__ */ K("p", {
							className: "text-dc-text",
							children: Ze(e.summary)
						})] }),
						e.queryUnderstanding && /* @__PURE__ */ q("div", { children: [/* @__PURE__ */ K("h4", {
							className: "dc:text-sm dc:font-semibold text-dc-text-muted dc:uppercase dc:mb-2",
							children: r("explainAI.queryAnalysis")
						}), /* @__PURE__ */ K("p", {
							className: "text-dc-text-secondary",
							children: Ze(e.queryUnderstanding)
						})] }),
						e.issues && e.issues.length > 0 && /* @__PURE__ */ q("div", { children: [/* @__PURE__ */ K("h4", {
							className: "dc:text-sm dc:font-semibold text-dc-text-muted dc:uppercase dc:mb-2",
							children: r("explainAI.issuesFound", { count: e.issues.length })
						}), /* @__PURE__ */ K("div", {
							className: "dc:space-y-1 bg-dc-surface-secondary dc:rounded-lg dc:p-3",
							children: e.issues.map((e, t) => /* @__PURE__ */ K(nt, { issue: e }, t))
						})] }),
						e.recommendations && e.recommendations.length > 0 && /* @__PURE__ */ q("div", { children: [/* @__PURE__ */ K("h4", {
							className: "dc:text-sm dc:font-semibold text-dc-text-muted dc:uppercase dc:mb-3",
							children: r("explainAI.recommendations", { count: e.recommendations.length })
						}), /* @__PURE__ */ K("div", {
							className: "dc:space-y-4",
							children: e.recommendations.map((e, t) => /* @__PURE__ */ K(it, { rec: e }, t))
						})] }),
						(!e.recommendations || e.recommendations.length === 0) && /* @__PURE__ */ K("div", {
							className: "text-dc-text-muted dc:italic dc:p-4 bg-dc-surface-secondary dc:rounded-lg",
							children: r("explainAI.noRecommendations")
						})
					]
				}),
				/* @__PURE__ */ q("div", {
					className: "dc:flex dc:items-center dc:justify-between dc:px-6 dc:py-3 dc:border-t border-dc-border dc:flex-shrink-0 bg-dc-surface-secondary",
					children: [e._meta && /* @__PURE__ */ q("div", {
						className: "dc:text-xs text-dc-text-muted",
						children: [
							r("explainAI.modelLabel"),
							" ",
							e._meta.model,
							e._meta.usingUserKey && ` ${r("explainAI.usingUserKey")}`
						]
					}), /* @__PURE__ */ K("button", {
						onClick: i,
						className: "dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:rounded-lg bg-dc-primary text-white hover:bg-dc-primary-hover dc:transition-colors",
						children: r("common.actions.close")
					})]
				})
			]
		})]
	});
}
//#endregion
//#region src/client/shared/chartConfigBuilders.ts
var ot = (e) => e.map((e) => e.field), st = (e) => e.length > 0 ? [e[0].field] : [];
function ct(e) {
	let { metrics: t, timeDimension: n, dimension: r, dimensions: i } = e;
	return {
		xAxis: n ? [n.field] : r ? [r.field] : [],
		yAxis: ot(t),
		series: i.length > 1 ? [i[1].field] : r && n ? [r.field] : []
	};
}
function lt(e) {
	let { metrics: t, timeDimension: n, dimension: r, dimensions: i } = e;
	return {
		xAxis: r ? [r.field] : n ? [n.field] : [],
		yAxis: ot(t),
		series: i.length > 1 ? [i[1].field] : n && r ? [n.field] : []
	};
}
function ut(e) {
	let { metrics: t, dimension: n } = e;
	return {
		xAxis: n ? [n.field] : [],
		yAxis: st(t)
	};
}
function dt(e) {
	let { metrics: t, breakdowns: n, dimension: r, dimensions: i } = e;
	return t.length >= 2 ? {
		xAxis: [t[0].field],
		yAxis: [t[1].field],
		series: r ? [r.field] : []
	} : {
		xAxis: n.length > 0 ? [n[0].field] : [],
		yAxis: st(t),
		series: i.length > 1 ? [i[1].field] : []
	};
}
function ft(e) {
	let { metrics: t, timeDimension: n, dimension: r } = e;
	return {
		xAxis: t.length > 0 ? [t[0].field] : [],
		yAxis: t.length > 1 ? [t[1].field] : [],
		sizeField: t.length > 2 ? t[2].field : t.length > 1 ? t[1].field : void 0,
		series: r ? [r.field] : n ? [n.field] : []
	};
}
function pt(e) {
	let { metrics: t, dimension: n } = e;
	return {
		xAxis: n ? [n.field] : [],
		yAxis: st(t)
	};
}
function mt(e) {
	let { metrics: t, timeDimension: n } = e;
	return {
		dateField: n ? [n.field] : [],
		valueField: st(t)
	};
}
function ht(e) {
	return { yAxis: st(e.metrics) };
}
function gt(e) {
	let { metrics: t, breakdowns: n } = e;
	return { xAxis: [...n.map((e) => e.field), ...t.map((e) => e.field)] };
}
function _t(e) {
	let { metrics: t, breakdowns: n } = e;
	return { columns: [...n.map((e) => e.field), ...t.map((e) => e.field)] };
}
function vt() {
	return {};
}
function yt(e) {
	let { metrics: t, breakdowns: n } = e;
	return {
		xAxis: n.length > 0 ? [n[0].field] : [],
		yAxis: ot(t)
	};
}
var bt = {
	line: ct,
	area: ct,
	bar: lt,
	pie: ut,
	scatter: dt,
	bubble: ft,
	radar: pt,
	radialBar: pt,
	treemap: pt,
	proportionBar: ut,
	activityGrid: mt,
	kpiNumber: ht,
	kpiDelta: ht,
	kpiText: ht,
	table: gt,
	recordsTable: _t,
	markdown: vt
};
function xt(e) {
	return bt[e] || yt;
}
//#endregion
//#region src/client/shared/chartDefaults.ts
function St(e) {
	return e.isTimeDimension;
}
function Ct(e) {
	return e.find(St);
}
function wt(e) {
	return e.find((e) => !e.isTimeDimension);
}
function Tt(e) {
	return e.filter((e) => !e.isTimeDimension);
}
function Et(e) {
	return e.filter(St);
}
function Dt(e, t) {
	return {
		measureCount: e.length,
		dimensionCount: t.length,
		timeDimensionCount: Et(t).length
	};
}
function Ot(e, t, n) {
	let r = u[e];
	return !r || !r.isAvailable ? { available: !0 } : r.isAvailable(Dt(t, n));
}
function kt(e, t) {
	let n = Object.keys(u), r = {};
	for (let i of n) r[i] = Ot(i, e, t);
	return r;
}
function At(e, t, n) {
	if (Ot(n, e, t).available || e.length === 0 && t.length === 0) return n;
	let r = Et(t).length > 0, i = Tt(t).length > 0, a = e.length > 0;
	return r && a ? "line" : i && a ? "bar" : a && !i && !r ? "kpiNumber" : "table";
}
function jt(e, t, n) {
	let r = At(e, t, n);
	return {
		chartType: r,
		chartConfig: Mt(r, e, t)
	};
}
function Mt(e, t, n) {
	return xt(e)({
		metrics: t,
		breakdowns: n,
		timeDimension: Ct(n),
		dimension: wt(n),
		dimensions: Tt(n)
	});
}
function Nt(e, t, n, r) {
	if (r && Ot(n, e, t).available) return null;
	let i = At(e, t, n);
	return i === n ? null : i;
}
//#endregion
//#region src/client/components/AnalysisBuilder/ExecutionPlanPanelParts.tsx
function Pt({ title: e, height: t, className: n, children: r }) {
	return /* @__PURE__ */ q(G, { children: [/* @__PURE__ */ K("h4", {
		className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-2",
		children: e
	}), /* @__PURE__ */ K("div", {
		className: n,
		style: { height: t },
		children: r
	})] });
}
function Ft({ sql: e, sqlLoading: t, sqlError: n, sqlPlaceholder: r, formattedSql: i, title: a, height: o, headerRight: s }) {
	let { t: c } = R();
	return t ? /* @__PURE__ */ K(Pt, {
		title: a,
		height: o,
		className: "bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm dc:p-3 text-dc-text-muted dc:text-sm dc:animate-pulse",
		children: c("results.debug.loadingSql")
	}) : n ? /* @__PURE__ */ K(Pt, {
		title: a,
		height: o,
		className: "text-dc-error dc:text-sm bg-dc-danger-bg dc:p-3 dc:rounded-sm dc:border border-dc-error",
		children: n.message
	}) : e ? /* @__PURE__ */ K(b, {
		code: i,
		language: "sql",
		title: a,
		height: o,
		headerRight: s
	}) : /* @__PURE__ */ K(Pt, {
		title: a,
		height: o,
		className: "bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm dc:p-3 text-dc-text-muted dc:text-sm",
		children: r
	});
}
function It({ summary: e }) {
	let { t } = R();
	return /* @__PURE__ */ q("div", {
		className: "dc:flex dc:flex-wrap dc:items-center dc:gap-2",
		children: [
			/* @__PURE__ */ K("span", {
				className: "dc:px-2 dc:py-1 dc:text-xs dc:font-medium bg-dc-accent text-white dc:rounded-sm",
				children: e.database.toUpperCase()
			}),
			e.hasSequentialScans && /* @__PURE__ */ K("span", {
				className: "dc:px-2 dc:py-1 dc:text-xs dc:font-medium bg-dc-warning-bg text-dc-warning dc:border border-dc-warning dc:rounded-sm",
				children: t("debug.sequentialScans")
			}),
			e.usedIndexes.length > 0 && /* @__PURE__ */ K("span", {
				className: "dc:px-2 dc:py-1 dc:text-xs dc:font-medium bg-dc-success-bg text-dc-success dc:border border-dc-success dc:rounded-sm",
				children: t(e.usedIndexes.length === 1 ? "debug.indexesUsed" : "debug.indexesUsedPlural", { count: e.usedIndexes.length })
			}),
			e.executionTime !== void 0 && /* @__PURE__ */ K("span", {
				className: "dc:px-2 dc:py-1 dc:text-xs dc:font-medium bg-dc-surface-secondary text-dc-text-secondary dc:border border-dc-border dc:rounded-sm",
				children: t("debug.executionTime", { time: e.executionTime.toFixed(2) })
			}),
			e.planningTime !== void 0 && /* @__PURE__ */ K("span", {
				className: "dc:px-2 dc:py-1 dc:text-xs dc:font-medium bg-dc-surface-secondary text-dc-text-secondary dc:border border-dc-border dc:rounded-sm",
				children: t("debug.planningTime", { time: e.planningTime.toFixed(2) })
			}),
			e.totalCost !== void 0 && /* @__PURE__ */ K("span", {
				className: "dc:px-2 dc:py-1 dc:text-xs dc:font-medium bg-dc-surface-secondary text-dc-text-secondary dc:border border-dc-border dc:rounded-sm",
				children: t("debug.cost", { cost: e.totalCost.toFixed(2) })
			})
		]
	});
}
function Lt({ explainLoading: e, explainError: t, explainResult: n, useAnalyze: r, aiButton: i }) {
	let { t: a } = R();
	return e ? /* @__PURE__ */ K("div", {
		className: "bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm dc:p-3 text-dc-text-muted dc:text-sm dc:animate-pulse",
		children: a(r ? "debug.explainRunningAnalyze" : "debug.explainRunningBasic")
	}) : t ? /* @__PURE__ */ q("div", {
		className: "text-dc-error dc:text-sm bg-dc-danger-bg dc:p-3 dc:rounded-sm dc:border border-dc-error",
		children: [
			/* @__PURE__ */ K("strong", { children: a("debug.explainError") }),
			" ",
			t.message
		]
	}) : n ? /* @__PURE__ */ q("div", {
		className: "dc:space-y-3",
		children: [
			/* @__PURE__ */ K(It, { summary: n.summary }),
			n.summary.usedIndexes.length > 0 && /* @__PURE__ */ q("div", {
				className: "dc:text-xs text-dc-text-muted",
				children: [
					/* @__PURE__ */ K("strong", { children: a("debug.indexes") }),
					" ",
					n.summary.usedIndexes.join(", ")
				]
			}),
			/* @__PURE__ */ K(b, {
				code: n.raw,
				language: "sql",
				title: a("debug.executionPlanTitle", { database: n.summary.database }),
				height: "16rem",
				headerRight: i
			})
		]
	}) : null;
}
//#endregion
//#region src/client/components/AnalysisBuilder/ExecutionPlanPanel.tsx
var Rt = ye(function({ sql: e, sqlLoading: t = !1, sqlError: n, sqlPlaceholder: r = "Add metrics to generate SQL", explainResult: i, explainLoading: a = !1, explainHasRun: o = !1, explainError: s, runExplain: c, aiAnalysis: l, aiAnalysisLoading: u = !1, aiAnalysisError: d, runAIAnalysis: f, clearAIAnalysis: p, enableAI: m = !1, query: h, title: g = "Generated SQL", height: _ = "16rem" }) {
	let { t: v } = R(), [y, b] = W(!1), [x, S] = W(!1), C = e ? e.sql + (e.params && e.params.length > 0 ? "\n\n-- Parameters:\n" + JSON.stringify(e.params, null, 2) : "") : "", w = () => {
		f && i && h && (f(i, h), S(!0));
	}, T = () => {
		S(!1);
	}, E = m && i ? /* @__PURE__ */ K("button", {
		onClick: w,
		disabled: u,
		className: "dc:px-2 dc:py-1 dc:text-xs dc:font-medium dc:rounded-sm bg-dc-accent text-white hover:bg-dc-accent-hover dc:disabled:opacity-50 dc:disabled:cursor-not-allowed dc:flex dc:items-center dc:gap-1",
		children: u ? /* @__PURE__ */ q(G, { children: [/* @__PURE__ */ K("span", {
			className: "dc:animate-spin",
			children: "⟳"
		}), v("debug.aiAnalyzing")] }) : /* @__PURE__ */ K(G, { children: `✨ ${v("debug.aiAnalysis")}` })
	}) : null;
	return /* @__PURE__ */ q("div", {
		className: "dc:space-y-3",
		children: [
			/* @__PURE__ */ K(Ft, {
				sql: e,
				sqlLoading: t,
				sqlError: n,
				sqlPlaceholder: r,
				formattedSql: C,
				title: g,
				height: _,
				headerRight: /* @__PURE__ */ q(G, { children: [/* @__PURE__ */ q("label", {
					className: "dc:flex dc:items-center dc:gap-1 dc:text-xs text-dc-text-secondary dc:cursor-pointer",
					children: [/* @__PURE__ */ K("input", {
						type: "checkbox",
						checked: y,
						onChange: (e) => b(e.target.checked),
						className: "dc:w-3 dc:h-3 dc:rounded-sm border-dc-border text-dc-accent focus:ring-dc-accent"
					}), v("debug.explainIncludeTiming")]
				}), /* @__PURE__ */ K("button", {
					onClick: () => c({ analyze: y }),
					disabled: a,
					className: "dc:px-2 dc:py-1 dc:text-xs dc:font-medium dc:rounded-sm dc:border border-dc-border bg-dc-surface hover:bg-dc-surface-hover text-dc-text-secondary hover:text-dc-text dc:transition-colors dc:disabled:opacity-50 dc:disabled:cursor-not-allowed",
					children: v(a ? "debug.explainRunning" : "debug.explainPlan")
				})] })
			}),
			o && /* @__PURE__ */ K("div", { children: /* @__PURE__ */ K(Lt, {
				explainLoading: a,
				explainError: s,
				explainResult: i,
				useAnalyze: y,
				aiButton: E
			}) }),
			d && /* @__PURE__ */ q("div", {
				className: "text-dc-error dc:text-sm bg-dc-danger-bg dc:p-3 dc:rounded-sm dc:border border-dc-error",
				children: [
					/* @__PURE__ */ K("strong", { children: v("debug.aiAnalysisError") }),
					" ",
					d.message
				]
			}),
			x && l && /* @__PURE__ */ K(at, {
				analysis: l,
				onClose: T
			})
		]
	});
});
//#endregion
//#region src/client/adapters/queryModeAdapter.ts
function zt() {
	return {
		metrics: [],
		breakdowns: [],
		filters: [],
		order: void 0,
		limit: void 0,
		validationStatus: "idle",
		validationError: null
	};
}
function Bt(e) {
	return e.map((e) => e.field);
}
function Vt(e, t) {
	let n = [], r = [];
	for (let i of e) if (i.isTimeDimension) {
		let e = {
			dimension: i.field,
			granularity: i.granularity || "day"
		};
		if (i.enableComparison) {
			let n = we(i.field, t);
			n && (e.compareDateRange = n);
		}
		r.push(e);
	} else n.push(i.field);
	return {
		dimensions: n,
		timeDimensions: r
	};
}
function Ht(e) {
	let { dimensions: t, timeDimensions: n } = Vt(e.breakdowns, e.filters), r = {
		measures: Bt(e.metrics),
		dimensions: t
	};
	return n.length > 0 && (r.timeDimensions = n), e.filters.length > 0 && (r.filters = e.filters), e.order && Object.keys(e.order).length > 0 && (r.order = e.order), e.limit != null && (r.limit = e.limit), r;
}
function Ut(e) {
	return e.map((e, t) => ({
		id: m(),
		field: e,
		label: f(t)
	}));
}
function Wt(e) {
	let t = [];
	if (e.dimensions) for (let n of e.dimensions) t.push({
		id: m(),
		field: n,
		isTimeDimension: !1
	});
	if (e.timeDimensions) for (let n of e.timeDimensions) {
		let e = !!(n.compareDateRange && n.compareDateRange.length > 0);
		t.push({
			id: m(),
			field: n.dimension,
			granularity: n.granularity,
			isTimeDimension: !0,
			enableComparison: e
		});
	}
	return t;
}
function Gt(e) {
	return {
		metrics: Ut(e.measures || []),
		breakdowns: Wt(e),
		filters: e.filters || [],
		order: e.order,
		limit: e.limit,
		validationStatus: "idle",
		validationError: null
	};
}
function Kt(e) {
	return typeof e == "object" && !!e && "queries" in e && Array.isArray(e.queries);
}
var X = {
	type: "query",
	createInitial() {
		return {
			queryStates: [zt()],
			activeQueryIndex: 0,
			mergeStrategy: "concat"
		};
	},
	extractState(e) {
		return {
			queryStates: e.queryStates,
			activeQueryIndex: e.activeQueryIndex,
			mergeStrategy: e.mergeStrategy
		};
	},
	canLoad(e) {
		if (!e || typeof e != "object") return !1;
		let t = e;
		return !(t.version !== 1 || t.analysisType !== "query" || !t.query || typeof t.query != "object");
	},
	load(e) {
		if (e.analysisType !== "query") throw Error(`Cannot load ${e.analysisType} config with query adapter`);
		let t = e;
		if (Kt(t.query)) {
			let e = t.query, n = e.queries.map(Gt);
			return n.length === 0 && n.push(zt()), {
				queryStates: n,
				activeQueryIndex: 0,
				mergeStrategy: e.mergeStrategy || "concat"
			};
		}
		return {
			queryStates: [Gt(t.query)],
			activeQueryIndex: 0,
			mergeStrategy: "concat"
		};
	},
	save(e, t, n) {
		let r = e.queryStates.map(Ht), i = r.length === 1 && e.mergeStrategy === "concat" ? r[0] : {
			queries: r,
			mergeStrategy: e.mergeStrategy
		};
		return {
			version: 1,
			analysisType: "query",
			activeView: n,
			charts: { query: t.query || this.getDefaultChartConfig() },
			query: i
		};
	},
	validate(e) {
		let t = [], n = [];
		if (e.queryStates.length > 1 && e.mergeStrategy === "merge") {
			let t = e.queryStates[0].breakdowns.map((e) => e.field);
			e.queryStates.every((e) => {
				let n = e.breakdowns.map((e) => e.field);
				return n.length === t.length && n.every((e) => t.includes(e));
			}) || n.push("Queries have different breakdowns - merge results may be unexpected");
		}
		return {
			isValid: t.length === 0,
			errors: t,
			warnings: n
		};
	},
	clear(e) {
		return this.createInitial();
	},
	getDefaultChartConfig() {
		return {
			chartType: "bar",
			chartConfig: {},
			displayConfig: {
				showLegend: !0,
				showGrid: !0,
				showTooltip: !0
			}
		};
	}
}, Z = /* @__PURE__ */ new Map(), qt = !1;
function Jt() {
	qt ||= (Z.has("query") || Z.set("query", X), Z.has("funnel") || Z.set("funnel", v), Z.has("flow") || Z.set("flow", T), Z.has("retention") || Z.set("retention", x), !0);
}
var Q = {
	register(e) {
		Z.has(e.type) && console.warn(`[adapterRegistry] Overwriting existing adapter for type: ${e.type}`), Z.set(e.type, e);
	},
	get(e) {
		Jt();
		let t = Z.get(e);
		if (!t) throw Error(`[adapterRegistry] No adapter registered for type: ${e}. Available types: ${Array.from(Z.keys()).join(", ") || "none"}`);
		return t;
	},
	has(e) {
		return Jt(), Z.has(e);
	},
	getRegisteredTypes() {
		return Jt(), Array.from(Z.keys());
	},
	clear() {
		Z.clear(), qt = !1;
	}
}, Yt = () => ({
	analysisType: "query",
	charts: {
		query: X.getDefaultChartConfig(),
		funnel: v.getDefaultChartConfig(),
		flow: T.getDefaultChartConfig(),
		retention: x.getDefaultChartConfig()
	},
	activeViews: {
		query: "chart",
		funnel: "chart",
		flow: "chart",
		retention: "chart"
	},
	userManuallySelectedChart: !1,
	localPaletteName: "default"
}), Xt = (e, t, n) => ({
	...Yt(),
	setAnalysisType: (t) => {
		e((e) => {
			let n = { ...e.charts };
			n[t] || (n[t] = Q.get(t).getDefaultChartConfig());
			let r = { ...e.activeViews };
			return r[t] || (r[t] = "chart"), {
				analysisType: t,
				charts: n,
				activeViews: r,
				activeView: r[t] ?? "chart"
			};
		});
	},
	setChartType: (t) => {
		e((e) => {
			let n = e.analysisType, r = e.charts[n] || {
				chartType: t,
				chartConfig: {},
				displayConfig: {}
			};
			return { charts: {
				...e.charts,
				[n]: {
					...r,
					chartType: t
				}
			} };
		});
	},
	setChartTypeManual: (t) => {
		e((e) => {
			let n = e.analysisType, r = e.charts[n] || {
				chartType: t,
				chartConfig: {},
				displayConfig: {}
			};
			return {
				charts: {
					...e.charts,
					[n]: {
						...r,
						chartType: t
					}
				},
				userManuallySelectedChart: !0,
				activeView: "chart",
				activeViews: {
					...e.activeViews,
					[n]: "chart"
				}
			};
		});
	},
	setChartConfig: (t) => {
		e((e) => {
			let n = e.analysisType, r = e.charts[n] || {
				chartType: "bar",
				chartConfig: t,
				displayConfig: {}
			};
			return {
				charts: {
					...e.charts,
					[n]: {
						...r,
						chartConfig: t
					}
				},
				activeView: "chart",
				activeViews: {
					...e.activeViews,
					[n]: "chart"
				}
			};
		});
	},
	setDisplayConfig: (t) => {
		e((e) => {
			let n = e.analysisType, r = e.charts[n] || {
				chartType: "bar",
				chartConfig: {},
				displayConfig: t
			};
			return {
				charts: {
					...e.charts,
					[n]: {
						...r,
						displayConfig: t
					}
				},
				activeView: "chart",
				activeViews: {
					...e.activeViews,
					[n]: "chart"
				}
			};
		});
	},
	setLocalPaletteName: (t) => e({ localPaletteName: t }),
	setUserManuallySelectedChart: (t) => e({ userManuallySelectedChart: t }),
	setFunnelChartType: (t) => {
		e((e) => {
			let n = e.charts.funnel || {
				chartType: t,
				chartConfig: {},
				displayConfig: {}
			};
			return { charts: {
				...e.charts,
				funnel: {
					...n,
					chartType: t
				}
			} };
		});
	},
	setFunnelChartConfig: (t) => {
		e((e) => {
			let n = e.charts.funnel || {
				chartType: "funnel",
				chartConfig: t,
				displayConfig: {}
			};
			return { charts: {
				...e.charts,
				funnel: {
					...n,
					chartConfig: t
				}
			} };
		});
	},
	setFunnelDisplayConfig: (t) => {
		e((e) => {
			let n = e.charts.funnel || {
				chartType: "funnel",
				chartConfig: {},
				displayConfig: t
			};
			return { charts: {
				...e.charts,
				funnel: {
					...n,
					displayConfig: t
				}
			} };
		});
	},
	save: () => {
		let e = t(), n = Q.get(e.analysisType), r = n.extractState(e);
		return n.save(r, e.charts, e.activeViews[e.analysisType] ?? e.activeView ?? "chart");
	},
	load: (n) => {
		let r = Q.get(n.analysisType);
		if (!r.canLoad(n)) {
			console.warn("[coreSlice] Invalid config, cannot load");
			return;
		}
		let i = r.load(n), a = t(), o = {
			...a.charts,
			...n.charts
		};
		o[n.analysisType] || (o[n.analysisType] = r.getDefaultChartConfig()), e({
			analysisType: n.analysisType,
			charts: o,
			activeView: n.activeView,
			activeViews: {
				...a.activeViews,
				[n.analysisType]: n.activeView
			},
			...i
		});
	},
	saveWorkspace: () => {
		let e = t(), n = e, r = Q.get("query"), i = r.extractState(n), a = r.save(i, e.charts, e.activeViews.query ?? e.activeView ?? "chart"), o = Q.get("funnel"), s = o.extractState(n), c = o.save(s, e.charts, e.activeViews.funnel ?? e.activeView ?? "chart"), l = Q.get("flow"), u = l.extractState(n), d = l.save(u, e.charts, e.activeViews.flow ?? e.activeView ?? "chart"), f = Q.get("retention"), p = f.extractState(n), m = f.save(p, e.charts, e.activeViews.retention ?? e.activeView ?? "chart");
		return {
			version: 1,
			activeType: e.analysisType,
			modes: {
				query: a,
				funnel: c,
				flow: d,
				retention: m
			}
		};
	},
	loadWorkspace: (n) => {
		let r = Q.get("query"), i = Q.get("funnel"), a = Q.get("flow"), o = Q.get("retention"), s = {}, c = {}, l = {}, u = {}, d = { ...t().charts }, f = { ...t().activeViews };
		n.modes.query && r.canLoad(n.modes.query) && (s = r.load(n.modes.query), d = {
			...d,
			...n.modes.query.charts
		}, f.query = n.modes.query.activeView ?? "chart"), n.modes.funnel && i.canLoad(n.modes.funnel) && (c = i.load(n.modes.funnel), d = {
			...d,
			...n.modes.funnel.charts
		}, f.funnel = n.modes.funnel.activeView ?? "chart"), n.modes.flow && a.canLoad(n.modes.flow) && (l = a.load(n.modes.flow), d = {
			...d,
			...n.modes.flow.charts
		}, f.flow = n.modes.flow.activeView ?? "chart"), n.modes.retention && o.canLoad(n.modes.retention) && (u = o.load(n.modes.retention), d = {
			...d,
			...n.modes.retention.charts
		}, f.retention = n.modes.retention.activeView ?? "chart"), e({
			analysisType: n.activeType,
			charts: d,
			activeViews: f,
			activeView: n.modes[n.activeType]?.activeView ?? "chart",
			...s,
			...c,
			...l,
			...u
		});
	}
}), Zt = () => ({
	queryStates: [Y()],
	activeQueryIndex: 0,
	mergeStrategy: "concat"
}), Qt = (e, t, n) => ({
	...Zt(),
	setQueryStates: (t) => e({ queryStates: t }),
	updateQueryState: (t, n) => e((e) => {
		let r = [...e.queryStates];
		return r[t] = n(r[t] || Y()), { queryStates: r };
	}),
	setActiveQueryIndex: (t) => e({ activeQueryIndex: t }),
	setMergeStrategy: (t) => e({ mergeStrategy: t }),
	addQuery: () => e((e) => {
		let t = e.queryStates[e.activeQueryIndex] || Y(), n = {
			...Y(),
			metrics: [...t.metrics],
			breakdowns: [...t.breakdowns],
			filters: [...t.filters]
		};
		return {
			queryStates: [...e.queryStates, n],
			activeQueryIndex: e.queryStates.length
		};
	}),
	removeQuery: (t) => e((e) => {
		if (e.queryStates.length <= 1) return e;
		let n = e.queryStates.filter((e, n) => n !== t), r = e.activeQueryIndex;
		return t === e.activeQueryIndex ? r = Math.max(0, e.activeQueryIndex - 1) : t < e.activeQueryIndex && (r = e.activeQueryIndex - 1), {
			queryStates: n,
			activeQueryIndex: r
		};
	}),
	addMetric: (t, n) => e((e) => {
		let r = e.activeQueryIndex, i = [...e.queryStates], a = i[r] || Y(), o = {
			id: m(),
			field: t,
			label: n || f(a.metrics.length)
		};
		return i[r] = {
			...a,
			metrics: [...a.metrics, o]
		}, { queryStates: i };
	}),
	removeMetric: (t) => e((e) => {
		let n = e.activeQueryIndex, r = [...e.queryStates], i = r[n] || Y(), a = i.metrics.find((e) => e.id === t)?.field, o = i.metrics.filter((e) => e.id !== t), s = i.order;
		return a && s && s[a] && (s = { ...s }, delete s[a], Object.keys(s).length === 0 && (s = void 0)), r[n] = {
			...i,
			metrics: o,
			order: s
		}, { queryStates: r };
	}),
	toggleMetric: (t) => e((e) => {
		let n = e.activeQueryIndex, r = [...e.queryStates], i = r[n] || Y(), a = i.metrics.findIndex((e) => e.field === t);
		if (a >= 0) r[n] = {
			...i,
			metrics: i.metrics.filter((e, t) => t !== a)
		};
		else {
			let e = {
				id: m(),
				field: t,
				label: f(i.metrics.length)
			};
			r[n] = {
				...i,
				metrics: [...i.metrics, e]
			};
		}
		return { queryStates: r };
	}),
	reorderMetrics: (t, n) => e((e) => {
		let r = e.activeQueryIndex, i = [...e.queryStates], a = i[r] || Y(), o = [...a.metrics], [s] = o.splice(t, 1);
		return o.splice(n, 0, s), i[r] = {
			...a,
			metrics: o
		}, { queryStates: i };
	}),
	addBreakdown: (t, n, r) => e((e) => {
		let i = e.activeQueryIndex, a = [...e.queryStates], o = a[i] || Y();
		if (n && o.breakdowns.some((e) => e.isTimeDimension)) return e;
		let s = {
			id: m(),
			field: t,
			isTimeDimension: n,
			granularity: n ? r || "month" : void 0
		};
		return a[i] = {
			...o,
			breakdowns: [...o.breakdowns, s]
		}, { queryStates: a };
	}),
	removeBreakdown: (t) => e((e) => {
		let n = e.activeQueryIndex, r = [...e.queryStates], i = r[n] || Y(), a = i.breakdowns.find((e) => e.id === t)?.field, o = i.breakdowns.filter((e) => e.id !== t), s = i.order;
		return a && s && s[a] && (s = { ...s }, delete s[a], Object.keys(s).length === 0 && (s = void 0)), r[n] = {
			...i,
			breakdowns: o,
			order: s
		}, { queryStates: r };
	}),
	toggleBreakdown: (t, n, r) => e((e) => {
		let i = e.activeQueryIndex, a = [...e.queryStates], o = a[i] || Y(), s = o.breakdowns.findIndex((e) => e.field === t);
		if (s >= 0) a[i] = {
			...o,
			breakdowns: o.breakdowns.filter((e, t) => t !== s)
		};
		else {
			if (n && o.breakdowns.some((e) => e.isTimeDimension)) return e;
			let s = {
				id: m(),
				field: t,
				isTimeDimension: n,
				granularity: n ? r || "month" : void 0
			};
			a[i] = {
				...o,
				breakdowns: [...o.breakdowns, s]
			};
		}
		return { queryStates: a };
	}),
	setBreakdownGranularity: (t, n) => e((e) => {
		let { mergeStrategy: r, activeQueryIndex: i, queryStates: a } = e, o = [...a], s = r === "merge" && i > 0 ? 0 : i;
		return o[s] = {
			...o[s],
			breakdowns: o[s].breakdowns.map((e) => e.id === t ? {
				...e,
				granularity: n
			} : e)
		}, { queryStates: o };
	}),
	toggleBreakdownComparison: (t) => e((e) => {
		let { mergeStrategy: n, activeQueryIndex: r, queryStates: i, charts: a, analysisType: o } = e, s = [...i], c = n === "merge" && r > 0 ? 0 : r, l = s[c].breakdowns.find((e) => e.id === t), u = l && !l.enableComparison, d = s[c].breakdowns.map((e) => e.id === t ? {
			...e,
			enableComparison: !e.enableComparison
		} : e.isTimeDimension && e.enableComparison ? {
			...e,
			enableComparison: !1
		} : e);
		s[c] = {
			...s[c],
			breakdowns: d
		};
		let f = { queryStates: s };
		if (u && l?.isTimeDimension && l.field) {
			let t = s[c].filters || [];
			if (!t.some((e) => {
				if ("member" in e) {
					let t = e;
					return t.member === l.field && t.operator === "inDateRange";
				}
				return !1;
			})) {
				let e = {
					member: l.field,
					operator: "inDateRange",
					values: [],
					dateRange: F("last_n_months", 3)
				};
				s[c] = {
					...s[c],
					filters: [...t, e]
				}, f.queryStates = s;
			}
			let n = a[o];
			n && n.chartType !== "line" && (f.charts = {
				...a,
				[o]: {
					...n,
					chartType: "line"
				}
			}, f.userManuallySelectedChart = !1, f.activeView = "chart", f.activeViews = {
				...e.activeViews,
				[o]: "chart"
			});
		}
		return f;
	}),
	reorderBreakdowns: (t, n) => e((e) => {
		let r = e.activeQueryIndex, i = [...e.queryStates], a = i[r] || Y(), o = [...a.breakdowns], [s] = o.splice(t, 1);
		return o.splice(n, 0, s), i[r] = {
			...a,
			breakdowns: o
		}, { queryStates: i };
	}),
	setFilters: (t) => e((e) => {
		let n = e.activeQueryIndex, r = [...e.queryStates];
		return r[n] = {
			...r[n],
			filters: t
		}, { queryStates: r };
	}),
	dropFieldToFilter: (t) => e((e) => {
		let n = e.activeQueryIndex, r = [...e.queryStates], i = r[n] || Y(), a = i.filters || [];
		if (a.some((e) => "member" in e && e.member === t)) return e;
		let o = {
			member: t,
			operator: "set",
			values: []
		}, s;
		if (a.length === 0) s = [o];
		else if (a.length === 1 && "type" in a[0]) {
			let e = a[0];
			s = [{
				...e,
				filters: [...e.filters, o]
			}];
		} else s = [{
			type: "and",
			filters: [...a, o]
		}];
		return r[n] = {
			...i,
			filters: s
		}, { queryStates: r };
	}),
	setOrder: (t, n) => e((e) => {
		let r = e.activeQueryIndex, i = [...e.queryStates], a = i[r] || Y(), o = { ...a.order || {} };
		return n === null ? delete o[t] : o[t] = n, i[r] = {
			...a,
			order: Object.keys(o).length > 0 ? o : void 0
		}, { queryStates: i };
	}),
	setLimit: (t) => e((e) => {
		let n = e.activeQueryIndex, r = [...e.queryStates];
		return r[n] = {
			...r[n],
			limit: t
		}, { queryStates: r };
	}),
	getCurrentState: () => {
		let e = t();
		return e.queryStates[e.activeQueryIndex] || Y();
	},
	getMergeKeys: () => {
		let e = t();
		if (e.mergeStrategy !== "merge" || e.queryStates.length === 0) return;
		let n = e.queryStates[0].breakdowns;
		if (n.length !== 0) return n.map((e) => e.field);
	},
	isMultiQueryMode: () => {
		let e = t();
		return e.queryStates.length <= 1 ? !1 : e.queryStates.filter((e) => e.metrics.length > 0 || e.breakdowns.length > 0).length > 1;
	},
	buildCurrentQuery: () => {
		let e = t(), n = e.queryStates[e.activeQueryIndex] || Y(), r = l(e.charts[e.analysisType]?.chartType ?? "");
		return Ee(n.metrics, n.breakdowns, n.filters, n.order, !1, n.limit, r);
	},
	buildAllQueries: () => {
		let e = t(), n = e.queryStates[0]?.breakdowns || [], r = l(e.charts[e.analysisType]?.chartType ?? "");
		return e.queryStates.map((t, i) => Ee(t.metrics, e.mergeStrategy === "merge" && i > 0 ? n : t.breakdowns, t.filters, t.order, !1, t.limit, r));
	},
	buildMultiQueryConfig: () => {
		let e = t();
		if (!t().isMultiQueryMode()) return null;
		let n = t().buildAllQueries().filter((e) => e.measures && e.measures.length > 0 || e.dimensions && e.dimensions.length > 0 || e.timeDimensions && e.timeDimensions.length > 0);
		return n.length < 2 ? null : {
			queries: n,
			mergeStrategy: e.mergeStrategy,
			mergeKeys: t().getMergeKeys(),
			queryLabels: n.map((e, t) => `Q${t + 1}`)
		};
	}
}), $t = () => ({
	funnelCube: null,
	funnelSteps: [],
	activeFunnelStepIndex: 0,
	funnelTimeDimension: null,
	funnelBindingKey: null,
	stepTimeToConvert: []
}), en = (e, t, n) => ({
	...$t(),
	addFunnelStep: () => e((e) => {
		let t = e.funnelSteps[e.funnelSteps.length - 1], n = {
			id: m(),
			name: `Step ${e.funnelSteps.length + 1}`,
			cube: e.funnelCube || "",
			filters: t?.filters ? JSON.parse(JSON.stringify(t.filters)) : [],
			timeToConvert: t?.timeToConvert
		};
		return {
			funnelSteps: [...e.funnelSteps, n],
			activeFunnelStepIndex: e.funnelSteps.length
		};
	}),
	removeFunnelStep: (t) => e((e) => {
		if (e.funnelSteps.length <= 1) return e;
		let n = e.funnelSteps.filter((e, n) => n !== t);
		return {
			funnelSteps: n,
			activeFunnelStepIndex: Math.min(e.activeFunnelStepIndex, n.length - 1)
		};
	}),
	updateFunnelStep: (t, n) => e((e) => {
		let r = [...e.funnelSteps];
		return r[t] && (r[t] = {
			...r[t],
			...n
		}), { funnelSteps: r };
	}),
	setActiveFunnelStepIndex: (t) => e({ activeFunnelStepIndex: t }),
	reorderFunnelSteps: (t, n) => e((e) => {
		let r = [...e.funnelSteps], [i] = r.splice(t, 1);
		return r.splice(n, 0, i), { funnelSteps: r };
	}),
	setFunnelTimeDimension: (t) => e({ funnelTimeDimension: t }),
	setFunnelBindingKey: (t) => e({ funnelBindingKey: t }),
	setFunnelCube: (t) => e((e) => ({
		funnelCube: t,
		funnelBindingKey: null,
		funnelTimeDimension: null,
		funnelSteps: e.funnelSteps.map((e) => ({
			...e,
			cube: t || ""
		}))
	})),
	setStepTimeToConvert: () => {},
	buildFunnelConfig: () => null,
	buildFunnelQueryFromSteps: () => {
		let e = t();
		if (e.analysisType !== "funnel" || !e.funnelBindingKey || !e.funnelTimeDimension || e.funnelSteps.length < 2) return null;
		let n = e.funnelSteps.filter((e) => e.cube && e.name);
		return n.length < 2 ? null : { funnel: {
			bindingKey: e.funnelBindingKey.dimension,
			timeDimension: e.funnelTimeDimension,
			steps: n.map((e) => ({
				name: e.name,
				cube: e.cube,
				filter: e.filters.length > 0 ? e.filters : void 0,
				timeToConvert: e.timeToConvert
			})),
			includeTimeMetrics: !0
		} };
	},
	isFunnelMode: () => t().analysisType === "funnel",
	isFunnelModeEnabled: () => {
		let e = t();
		return e.analysisType !== "funnel" || !e.funnelBindingKey || !e.funnelTimeDimension || e.funnelSteps.length < 2 ? !1 : e.funnelSteps.filter((e) => e.cube && e.name).length >= 2;
	}
}), tn = () => ({
	flowCube: null,
	flowBindingKey: null,
	flowTimeDimension: null,
	startingStep: {
		name: "",
		filters: []
	},
	stepsBefore: 3,
	stepsAfter: 3,
	eventDimension: null,
	joinStrategy: "auto"
}), nn = (e, t, n) => ({
	...tn(),
	setFlowCube: (t) => e(() => ({
		flowCube: t,
		flowBindingKey: null,
		flowTimeDimension: null,
		eventDimension: null,
		startingStep: {
			name: "",
			filters: []
		}
	})),
	setFlowBindingKey: (t) => e({ flowBindingKey: t }),
	setFlowTimeDimension: (t) => e({ flowTimeDimension: t }),
	setEventDimension: (t) => e({ eventDimension: t }),
	setStartingStepName: (t) => e((e) => ({ startingStep: {
		...e.startingStep,
		name: t
	} })),
	setStartingStepFilters: (t) => e((e) => ({ startingStep: {
		...e.startingStep,
		filters: t
	} })),
	addStartingStepFilter: (t) => e((e) => ({ startingStep: {
		...e.startingStep,
		filters: [...e.startingStep.filters, t]
	} })),
	removeStartingStepFilter: (t) => e((e) => ({ startingStep: {
		...e.startingStep,
		filters: e.startingStep.filters.filter((e, n) => n !== t)
	} })),
	updateStartingStepFilter: (t, n) => e((e) => {
		let r = [...e.startingStep.filters];
		return r[t] && (r[t] = n), { startingStep: {
			...e.startingStep,
			filters: r
		} };
	}),
	setStepsBefore: (t) => e({ stepsBefore: Math.max(0, Math.min(5, t)) }),
	setStepsAfter: (t) => e({ stepsAfter: Math.max(0, Math.min(5, t)) }),
	setJoinStrategy: (t) => e(() => ({ joinStrategy: t })),
	isFlowMode: () => t().analysisType === "flow",
	isFlowModeEnabled: () => {
		let e = t();
		return !(e.analysisType !== "flow" || !e.flowCube || !e.flowBindingKey?.dimension || !e.flowTimeDimension || !e.eventDimension || e.startingStep.filters.length === 0);
	},
	buildFlowQuery: () => {
		let e = t();
		if (e.analysisType !== "flow" || !e.flowBindingKey?.dimension || !e.flowTimeDimension || !e.eventDimension || e.startingStep.filters.length === 0) return null;
		let n;
		if (typeof e.flowBindingKey.dimension == "string") n = e.flowBindingKey.dimension;
		else if (Array.isArray(e.flowBindingKey.dimension)) n = e.flowBindingKey.dimension.map((e) => ({
			cube: e.cube,
			dimension: e.dimension
		}));
		else return null;
		let r = e.startingStep.filters.length === 1 ? e.startingStep.filters[0] : e.startingStep.filters, i = e.charts?.flow?.chartType === "sunburst" ? "sunburst" : "sankey";
		return { flow: {
			bindingKey: n,
			timeDimension: e.flowTimeDimension,
			startingStep: {
				name: e.startingStep.name || "Starting Step",
				filter: r
			},
			stepsBefore: i === "sunburst" ? 0 : e.stepsBefore,
			stepsAfter: e.stepsAfter,
			eventDimension: e.eventDimension,
			outputMode: i,
			joinStrategy: e.joinStrategy
		} };
	}
}), rn = () => ({ ...k }), an = (e, t, n) => ({
	...rn(),
	setRetentionCube: (t) => e(() => ({
		retentionCube: t,
		retentionTimeDimension: null,
		retentionBindingKey: null,
		retentionCohortFilters: [],
		retentionActivityFilters: [],
		retentionBreakdowns: []
	})),
	setRetentionBindingKey: (t) => e({ retentionBindingKey: t }),
	setRetentionTimeDimension: (t) => e({ retentionTimeDimension: t }),
	setRetentionDateRange: (t) => e({ retentionDateRange: t }),
	setRetentionCohortFilters: (t) => e({ retentionCohortFilters: t }),
	addRetentionCohortFilter: (t) => e((e) => ({ retentionCohortFilters: [...e.retentionCohortFilters, t] })),
	removeRetentionCohortFilter: (t) => e((e) => ({ retentionCohortFilters: e.retentionCohortFilters.filter((e, n) => n !== t) })),
	updateRetentionCohortFilter: (t, n) => e((e) => {
		let r = [...e.retentionCohortFilters];
		return r[t] && (r[t] = n), { retentionCohortFilters: r };
	}),
	setRetentionActivityFilters: (t) => e({ retentionActivityFilters: t }),
	addRetentionActivityFilter: (t) => e((e) => ({ retentionActivityFilters: [...e.retentionActivityFilters, t] })),
	removeRetentionActivityFilter: (t) => e((e) => ({ retentionActivityFilters: e.retentionActivityFilters.filter((e, n) => n !== t) })),
	updateRetentionActivityFilter: (t, n) => e((e) => {
		let r = [...e.retentionActivityFilters];
		return r[t] && (r[t] = n), { retentionActivityFilters: r };
	}),
	setRetentionBreakdowns: (t) => e({ retentionBreakdowns: t }),
	addRetentionBreakdown: (t) => e((e) => ({ retentionBreakdowns: [...e.retentionBreakdowns, t] })),
	removeRetentionBreakdown: (t) => e((e) => ({ retentionBreakdowns: e.retentionBreakdowns.filter((e) => e.field !== t) })),
	setRetentionViewGranularity: (t) => e({ retentionViewGranularity: t }),
	setRetentionPeriods: (t) => e({ retentionPeriods: Math.max(1, Math.min(52, t)) }),
	setRetentionType: (t) => e({ retentionType: t }),
	isRetentionMode: () => t().analysisType === "retention",
	isRetentionModeEnabled: () => {
		let e = t();
		return !(e.analysisType !== "retention" || !e.retentionBindingKey?.dimension || !e.retentionTimeDimension);
	},
	buildRetentionQuery: () => {
		let e = t();
		if (e.analysisType !== "retention" || !e.retentionBindingKey?.dimension || !e.retentionTimeDimension) return null;
		let n;
		if (typeof e.retentionBindingKey.dimension == "string") n = e.retentionBindingKey.dimension;
		else if (Array.isArray(e.retentionBindingKey.dimension)) n = e.retentionBindingKey.dimension.map((e) => ({
			cube: e.cube,
			dimension: e.dimension
		}));
		else return null;
		let r = { retention: {
			timeDimension: e.retentionTimeDimension,
			bindingKey: n,
			dateRange: e.retentionDateRange,
			granularity: e.retentionViewGranularity,
			periods: e.retentionPeriods,
			retentionType: e.retentionType
		} };
		return e.retentionCohortFilters.length > 0 && (r.retention.cohortFilters = e.retentionCohortFilters.length === 1 ? e.retentionCohortFilters[0] : e.retentionCohortFilters), e.retentionActivityFilters.length > 0 && (r.retention.activityFilters = e.retentionActivityFilters.length === 1 ? e.retentionActivityFilters[0] : e.retentionActivityFilters), e.retentionBreakdowns.length > 0 && (r.retention.breakdownDimensions = e.retentionBreakdowns.map((e) => e.field)), r;
	},
	getRetentionValidation: () => {
		let e = t(), n = [], r = [];
		if (e.analysisType !== "retention") return {
			isValid: !0,
			errors: [],
			warnings: []
		};
		if (e.retentionCube || n.push("Select a cube for retention analysis"), e.retentionBindingKey?.dimension || n.push("Select a user identifier (binding key) to track retention"), e.retentionTimeDimension || n.push("Select a timestamp dimension for the analysis"), !e.retentionDateRange?.start || !e.retentionDateRange?.end) n.push("Date range is required for retention analysis");
		else {
			let t = new Date(e.retentionDateRange.start), r = new Date(e.retentionDateRange.end);
			isNaN(t.getTime()) && n.push("Invalid start date format"), isNaN(r.getTime()) && n.push("Invalid end date format"), t > r && n.push("Start date must be before or equal to end date");
		}
		return e.retentionPeriods < 1 && n.push("At least 1 retention period is required"), e.retentionPeriods > 52 && r.push("More than 52 periods may impact performance"), {
			isValid: n.length === 0,
			errors: n,
			warnings: r
		};
	}
}), on = {
	isOpen: !1,
	userPrompt: "",
	isGenerating: !1,
	error: null,
	hasGeneratedQuery: !1,
	previousState: null
}, sn = () => ({
	activeTab: "query",
	activeView: "chart",
	displayLimit: 100,
	showFieldModal: !1,
	fieldModalMode: "metrics",
	aiState: on
}), cn = (e, t, n) => ({
	...sn(),
	setActiveTab: (t) => e({ activeTab: t }),
	setActiveView: (t) => e((e) => ({
		activeView: t,
		activeViews: {
			...e.activeViews,
			[e.analysisType]: t
		}
	})),
	setDisplayLimit: (t) => e({ displayLimit: t }),
	openMetricsModal: () => e({
		showFieldModal: !0,
		fieldModalMode: "metrics"
	}),
	openBreakdownsModal: () => e({
		showFieldModal: !0,
		fieldModalMode: "breakdown"
	}),
	closeFieldModal: () => e({ showFieldModal: !1 }),
	openAI: () => e((e) => ({ aiState: {
		...e.aiState,
		isOpen: !0
	} })),
	closeAI: () => e((e) => ({ aiState: {
		...e.aiState,
		isOpen: !1
	} })),
	setAIPrompt: (t) => e((e) => ({ aiState: {
		...e.aiState,
		userPrompt: t
	} })),
	setAIGenerating: (t) => e((e) => ({ aiState: {
		...e.aiState,
		isGenerating: t
	} })),
	setAIError: (t) => e((e) => ({ aiState: {
		...e.aiState,
		error: t
	} })),
	setAIHasGeneratedQuery: (t) => e((e) => ({ aiState: {
		...e.aiState,
		hasGeneratedQuery: t
	} })),
	saveAIPreviousState: () => e((e) => {
		let t = e.queryStates[e.activeQueryIndex], n = e.charts[e.analysisType] || {
			chartType: "bar",
			chartConfig: {},
			displayConfig: {
				showLegend: !0,
				showGrid: !0,
				showTooltip: !0
			}
		};
		return { aiState: {
			...e.aiState,
			previousState: t ? {
				metrics: [...t.metrics],
				breakdowns: [...t.breakdowns],
				filters: [...t.filters],
				chartType: n.chartType,
				chartConfig: { ...n.chartConfig },
				displayConfig: { ...n.displayConfig }
			} : null
		} };
	}),
	restoreAIPreviousState: () => e((e) => {
		let t = e.aiState.previousState;
		if (!t) return e;
		let n = e.activeQueryIndex, r = [...e.queryStates];
		return r[n] = {
			...r[n] || Y(),
			metrics: t.metrics,
			breakdowns: t.breakdowns,
			filters: t.filters
		}, {
			queryStates: r,
			charts: {
				...e.charts,
				[e.analysisType]: {
					chartType: t.chartType,
					chartConfig: t.chartConfig,
					displayConfig: t.displayConfig
				}
			},
			aiState: { ...on }
		};
	})
});
//#endregion
//#region src/client/stores/optionsToAnalysisConfig.ts
function ln(e) {
	let t = e.filters ? [...e.filters] : [], n = e.timeDimensions || [], r = [...(e.dimensions || []).map((e) => ({
		id: m(),
		field: e,
		isTimeDimension: !1
	})), ...n.map((e) => ({
		id: m(),
		field: e.dimension,
		granularity: e.granularity,
		isTimeDimension: !0,
		enableComparison: !!(e.compareDateRange && e.compareDateRange.length > 0)
	}))], i = t;
	for (let e of n) {
		if (!e.compareDateRange || e.compareDateRange.length === 0) continue;
		let t = i.some((t) => "member" in t && t.member === e.dimension && t.operator === "inDateRange"), n = e.compareDateRange[0], r = Array.isArray(n) || typeof n == "string" ? n : void 0;
		if (r) {
			if (!t) {
				i = [...i, {
					member: e.dimension,
					operator: "inDateRange",
					values: [],
					dateRange: r
				}];
				continue;
			}
			i = i.map((t) => "member" in t && t.member === e.dimension && t.operator === "inDateRange" && !t.dateRange ? {
				...t,
				dateRange: r
			} : t);
		}
	}
	return {
		...Y(),
		metrics: (e.measures || []).map((e, t) => ({
			id: m(),
			field: e,
			label: f(t)
		})),
		breakdowns: r,
		filters: i,
		order: e.order
	};
}
function un(e) {
	return "queries" in e && Array.isArray(e.queries);
}
function dn(e, t) {
	let n = e.getDefaultChartConfig();
	return {
		chartType: t?.chartType || n.chartType,
		chartConfig: t?.chartConfig || n.chartConfig,
		displayConfig: t?.displayConfig || n.displayConfig
	};
}
function fn(e) {
	return e.initialActiveView || "chart";
}
function pn(e) {
	let t = dn(v, e.initialChartConfig), n = e.initialFunnelState ?? {};
	return v.save({
		funnelCube: n.funnelCube ?? null,
		funnelSteps: n.funnelSteps || [],
		activeFunnelStepIndex: 0,
		funnelTimeDimension: n.funnelTimeDimension ?? null,
		funnelBindingKey: n.funnelBindingKey ?? null
	}, { funnel: t }, fn(e));
}
function mn(e) {
	let t = dn(T, e.initialChartConfig), n = e.initialFlowState ?? {};
	return T.save({
		flowCube: n.flowCube ?? null,
		flowBindingKey: n.flowBindingKey ?? null,
		flowTimeDimension: n.flowTimeDimension ?? null,
		startingStep: n.startingStep || {
			name: "",
			filters: []
		},
		stepsBefore: n.stepsBefore ?? 3,
		stepsAfter: n.stepsAfter ?? 3,
		eventDimension: n.eventDimension ?? null,
		joinStrategy: n.joinStrategy ?? "auto"
	}, { flow: t }, fn(e));
}
function hn(e) {
	let t = dn(x, e.initialChartConfig), n = e.initialRetentionState ?? {}, r = ee(A);
	return x.save({
		retentionCube: n.retentionCube ?? null,
		retentionBindingKey: n.retentionBindingKey ?? null,
		retentionTimeDimension: n.retentionTimeDimension ?? null,
		retentionDateRange: n.retentionDateRange ?? r,
		retentionCohortFilters: n.retentionCohortFilters || [],
		retentionActivityFilters: n.retentionActivityFilters || [],
		retentionBreakdowns: n.retentionBreakdowns || [],
		retentionViewGranularity: n.retentionViewGranularity ?? "week",
		retentionPeriods: n.retentionPeriods ?? 12,
		retentionType: n.retentionType ?? "classic"
	}, { retention: t }, fn(e));
}
function gn(e, t) {
	let n, r = "concat";
	un(t) ? (n = t.queries.map(ln), t.mergeStrategy && (r = t.mergeStrategy)) : n = [ln(t)];
	let i = dn(X, e.initialChartConfig);
	return X.save({
		queryStates: n,
		activeQueryIndex: 0,
		mergeStrategy: r
	}, { query: i }, fn(e));
}
function _n(e) {
	let t = dn(X, e.initialChartConfig);
	return X.save({
		queryStates: [Y()],
		activeQueryIndex: 0,
		mergeStrategy: "concat"
	}, { query: t }, fn(e));
}
function vn(e) {
	return X.save({
		queryStates: [Y()],
		activeQueryIndex: 0,
		mergeStrategy: "concat"
	}, { query: X.getDefaultChartConfig() }, e.initialActiveView);
}
function yn(e) {
	return e.initialAnalysisType === "funnel" && e.initialFunnelState ? pn(e) : e.initialAnalysisType === "flow" && e.initialFlowState ? mn(e) : e.initialAnalysisType === "retention" && e.initialRetentionState ? hn(e) : e.initialQuery ? gn(e, e.initialQuery) : e.initialChartConfig ? _n(e) : e.initialActiveView ? vn(e) : null;
}
//#endregion
//#region src/client/stores/analysisBuilderStore.tsx
function bn(e, t) {
	return {
		reset: () => {
			e({
				...Yt(),
				...Zt(),
				...$t(),
				...tn(),
				...rn(),
				charts: {
					query: X.getDefaultChartConfig(),
					funnel: v.getDefaultChartConfig(),
					flow: T.getDefaultChartConfig(),
					retention: x.getDefaultChartConfig()
				},
				activeViews: {
					query: "chart",
					funnel: "chart",
					flow: "chart",
					retention: "chart"
				}
			});
		},
		clearCurrentMode: () => e((e) => {
			switch (e.analysisType) {
				case "funnel": return {
					...$t(),
					charts: {
						...e.charts,
						funnel: v.getDefaultChartConfig()
					}
				};
				case "flow": return {
					...tn(),
					charts: {
						...e.charts,
						flow: T.getDefaultChartConfig()
					}
				};
				case "retention": return {
					...rn(),
					charts: {
						...e.charts,
						retention: x.getDefaultChartConfig()
					}
				};
				default: return {
					...Zt(),
					userManuallySelectedChart: !1,
					charts: {
						...e.charts,
						query: X.getDefaultChartConfig()
					}
				};
			}
		}),
		clearQuery: () => e((e) => {
			let t = [...e.queryStates];
			return t[e.activeQueryIndex] = Y(), {
				queryStates: t,
				userManuallySelectedChart: !1,
				charts: {
					...e.charts,
					query: X.getDefaultChartConfig()
				}
			};
		}),
		getValidation: () => {
			let e = t(), n = Q.get(e.analysisType), r = n.extractState(e);
			return n.validate(r);
		}
	};
}
function xn(n = {}) {
	let r = yn(n), o = (e, t, n) => ({
		...Xt(e, t, n),
		...Qt(e, t, n),
		...en(e, t, n),
		...nn(e, t, n),
		...an(e, t, n),
		...cn(e, t, n),
		...bn(e, t)
	});
	if (n.disableLocalStorage) {
		let t = a()(i(e(o), { name: "AnalysisBuilderStore (no-persist)" }));
		return r && t.getState().load(r), t;
	}
	return a()(i(e(t(o, {
		name: n.storageKey || "drizzle-cube-analysis-builder-v3",
		partialize: (e) => e.saveWorkspace(),
		merge: (e, t) => e && _(e) ? {
			...t,
			_persistedWorkspace: e
		} : e && O(e) ? {
			...t,
			_persistedConfig: e
		} : r ? {
			...t,
			_initialConfig: r
		} : t,
		onRehydrateStorage: () => (e) => {
			if (e) {
				if (e._persistedWorkspace) {
					let t = e._persistedWorkspace;
					delete e._persistedWorkspace, delete e._persistedConfig, delete e._initialConfig, e.loadWorkspace(t);
				} else if (e._persistedConfig) {
					let t = e._persistedConfig;
					delete e._persistedConfig, delete e._initialConfig, e.load(t);
				} else if (e._initialConfig) {
					let t = e._initialConfig;
					delete e._initialConfig, e.load(t);
				}
			}
		}
	})), { name: "AnalysisBuilderStore" }));
}
var Sn = ve(null);
function Cn({ children: e, initialQuery: t, initialChartConfig: n, disableLocalStorage: r, storageKey: i, initialAnalysisType: a, initialFunnelState: o, initialFlowState: s, initialRetentionState: c, initialActiveView: l }) {
	let u = U(null);
	return u.current ||= xn({
		initialQuery: t,
		initialChartConfig: n,
		disableLocalStorage: r,
		storageKey: i,
		initialAnalysisType: a,
		initialFunnelState: o,
		initialFlowState: s,
		initialRetentionState: c,
		initialActiveView: l
	}), /* @__PURE__ */ K(Sn.Provider, {
		value: u.current,
		children: e
	});
}
function $(e) {
	let t = be(Sn);
	if (!t) throw Error("useAnalysisBuilderStore must be used within AnalysisBuilderStoreProvider");
	return r(t, e);
}
function wn() {
	let e = be(Sn);
	if (!e) throw Error("useAnalysisBuilderStoreApi must be used within AnalysisBuilderStoreProvider");
	return e;
}
var Tn = (e) => e.queryStates[e.activeQueryIndex] || Y(), En = (e) => Tn(e).metrics, Dn = (e) => Tn(e).breakdowns, On = (e) => Tn(e).filters, kn = (e) => {
	let t = e.charts[e.analysisType];
	return t ? {
		chartType: t.chartType,
		chartConfig: t.chartConfig,
		displayConfig: t.displayConfig
	} : {
		chartType: "bar",
		chartConfig: {},
		displayConfig: {
			showLegend: !0,
			showGrid: !0,
			showTooltip: !0
		}
	};
}, An = (e) => ({
	activeTab: e.activeTab,
	activeView: e.activeView,
	displayLimit: e.displayLimit,
	showFieldModal: e.showFieldModal,
	fieldModalMode: e.fieldModalMode
}), jn = (e) => ({
	queryStates: e.queryStates,
	activeQueryIndex: e.activeQueryIndex,
	mergeStrategy: e.mergeStrategy,
	isMultiQueryMode: e.analysisType === "query" && e.queryStates.length > 1
}), Mn = (e) => ({
	funnelCube: e.funnelCube,
	funnelSteps: e.funnelSteps,
	activeFunnelStepIndex: e.activeFunnelStepIndex,
	funnelTimeDimension: e.funnelTimeDimension,
	funnelBindingKey: e.funnelBindingKey,
	isFunnelMode: e.analysisType === "funnel",
	stepTimeToConvert: e.stepTimeToConvert
});
//#endregion
//#region src/client/utils/multiQueryValidation.ts
function Nn(e) {
	return e.timeDimensions || [];
}
function Pn(e) {
	let t = [];
	if (e.length < 2) return t;
	let n = Nn(e[0]);
	if (n.length === 0) return t;
	for (let r = 1; r < e.length; r++) {
		let i = Nn(e[r]);
		if (i.length === 0 && n.length > 0) {
			t.push({
				type: "missing_time_dimension",
				queryIndex: r,
				message: `Query ${r + 1} is missing time dimension "${n[0].dimension}"`,
				details: { field: n[0].dimension }
			});
			continue;
		}
		for (let e of n) {
			let n = i.find((t) => t.dimension === e.dimension);
			n && n.granularity !== e.granularity && t.push({
				type: "granularity_mismatch",
				queryIndex: r,
				message: `Query ${r + 1} uses "${n.granularity}" granularity but Query 1 uses "${e.granularity}"`,
				details: {
					field: e.dimension,
					expectedGranularity: e.granularity,
					actualGranularity: n.granularity
				}
			});
		}
	}
	return t;
}
function Fn(e, t) {
	let n = [];
	if (e.length < 2 || t.length === 0) return n;
	for (let r = 0; r < e.length; r++) {
		let i = e[r], a = /* @__PURE__ */ new Set([...i.dimensions || [], ...i.timeDimensions?.map((e) => e.dimension) || []]);
		for (let e of t) a.has(e) || n.push({
			type: "missing_merge_key",
			queryIndex: r,
			message: `Query ${r + 1} is missing merge dimension "${e}"`,
			details: { field: e }
		});
	}
	return n;
}
function In(e) {
	let t = [];
	if (e.length < 2) return t;
	let n = /* @__PURE__ */ new Map();
	e.forEach((e, t) => {
		e.measures?.forEach((e) => {
			n.has(e) || n.set(e, []), n.get(e).push(t);
		});
	});
	let r = [], i = /* @__PURE__ */ new Set();
	return n.forEach((e, t) => {
		e.length > 1 && (r.push(t), e.forEach((e) => i.add(e)));
	}), r.length > 0 && t.push({
		type: "measure_collision",
		queryIndices: Array.from(i).sort(),
		message: `Measure${r.length > 1 ? "s" : ""} "${r.join("\", \"")}" appear${r.length === 1 ? "s" : ""} in multiple queries - first value will be used`,
		affectedMeasures: r
	}), t;
}
function Ln(e) {
	let t = [];
	if (e.length < 2) return t;
	let n = e.map((e) => e.timeDimensions?.[0]?.dateRange);
	return new Set(n.map((e) => JSON.stringify(e))).size > 1 && t.push({
		type: "asymmetric_date_range",
		queryIndices: e.map((e, t) => t),
		message: "Queries have different date ranges - some data points may be missing in merged results"
	}), t;
}
function Rn(e, t, n = []) {
	let r = [], i = [];
	return e.length < 2 ? {
		isValid: !0,
		errors: r,
		warnings: i
	} : (i.push(...In(e)), i.push(...Ln(e)), t === "merge" && (r.push(...Pn(e)), n.length > 0 && r.push(...Fn(e, n))), {
		isValid: r.length === 0,
		errors: r,
		warnings: i
	});
}
function zn(e) {
	return (e.measures?.length || 0) + (e.dimensions?.length || 0) + (e.timeDimensions?.length || 0);
}
function Bn(e) {
	return e.filter((e) => zn(e) > 0).length >= 2;
}
function Vn(e, t) {
	return `${e} ${t}${e === 1 ? "" : "s"}`;
}
function Hn(e) {
	if (e.isValid && e.warnings.length === 0) return "Configuration is valid";
	let t = [];
	return e.errors.length > 0 && t.push(Vn(e.errors.length, "error")), e.warnings.length > 0 && t.push(Vn(e.warnings.length, "warning")), t.join(", ");
}
//#endregion
//#region src/client/hooks/useAnalysisState.ts
function Un(e = {}) {
	let { externalColorPalette: t } = e, r = wn(), i = $((e) => e.queryStates), a = $((e) => e.activeQueryIndex), o = $((e) => e.mergeStrategy), s = $((e) => e.setActiveQueryIndex), c = $((e) => e.setMergeStrategy), u = $((e) => e.addQuery), d = $((e) => e.removeQuery), f = $((e) => e.getCurrentState), m = $((e) => e.getMergeKeys), h = $((e) => e.isMultiQueryMode), g = f(), _ = h(), v = m(), y = $((e) => l(e.charts[e.analysisType]?.chartType ?? "")), b = H(() => {
		let e = i[a] || g;
		return Ee(e.metrics, e.breakdowns, e.filters, e.order, !1, e.limit, y);
	}, [
		i,
		a,
		g,
		y
	]), x = H(() => {
		let e = i[0]?.breakdowns || [];
		return i.map((t, n) => Ee(t.metrics, o === "merge" && n > 0 ? e : t.breakdowns, t.filters, t.order, !1, t.limit, y));
	}, [
		i,
		o,
		y
	]), S = H(() => {
		if (i.length <= 1) return null;
		let e = x.filter((e) => e.measures && e.measures.length > 0 || e.dimensions && e.dimensions.length > 0 || e.timeDimensions && e.timeDimensions.length > 0);
		return e.length < 2 ? null : {
			queries: e,
			mergeStrategy: o,
			mergeKeys: v,
			queryLabels: e.map((e, t) => `Q${t + 1}`)
		};
	}, [
		x,
		i.length,
		o,
		v
	]), C = H(() => _ ? Rn(x, o, v || []) : null, [
		_,
		x,
		o,
		v
	]), w = H(() => b.measures && b.measures.length > 0 || b.dimensions && b.dimensions.length > 0 || b.timeDimensions && b.timeDimensions.length > 0, [b]), T = H(() => {
		if (!_) return g.metrics;
		let e = /* @__PURE__ */ new Set(), t = [];
		for (let n = 0; n < i.length; n++) {
			let r = i[n];
			for (let i of r.metrics) {
				let r = `Q${n + 1}:${i.field}`;
				e.has(r) || (e.add(r), t.push({
					...i,
					label: `${i.label} (Q${n + 1})`
				}));
			}
		}
		return t;
	}, [
		_,
		i,
		g.metrics
	]), E = H(() => {
		if (!_) return g.breakdowns;
		let e = /* @__PURE__ */ new Set(), t = [];
		for (let n of i) for (let r of n.breakdowns) e.has(r.field) || (e.add(r.field), t.push(r));
		return t;
	}, [
		_,
		i,
		g.breakdowns
	]), D = H(() => o === "merge" && a > 0 ? i[0]?.breakdowns || [] : g.breakdowns, [
		o,
		a,
		i,
		g.breakdowns
	]), O = $((e) => e.analysisType), k = $((e) => e.funnelBindingKey), ee = $((e) => e.funnelCube), A = $((e) => e.funnelSteps), te = $((e) => e.activeFunnelStepIndex), j = $((e) => e.funnelTimeDimension), M = H(() => O !== "funnel" || !k?.dimension || !j || !A || A.length < 2 ? !1 : A.every((e) => e.filters.length > 0), [
		O,
		k,
		j,
		A
	]), ne = $((e) => e.charts.funnel?.chartType) || "funnel", N = $((e) => e.charts.funnel?.chartConfig), re = H(() => N || {}, [N]), ie = $((e) => e.charts.funnel?.displayConfig), ae = H(() => ie || {
		showLegend: !0,
		showGrid: !0,
		showTooltip: !0
	}, [ie]), P = $((e) => e.flowCube), F = $((e) => e.flowBindingKey), oe = $((e) => e.flowTimeDimension), se = $((e) => e.eventDimension), I = $((e) => e.startingStep), L = $((e) => e.stepsBefore), ce = $((e) => e.stepsAfter), le = $((e) => e.joinStrategy), ue = $((e) => e.charts.flow?.displayConfig), de = H(() => ue || {
		showLegend: !0,
		showGrid: !0,
		showTooltip: !0
	}, [ue]), fe = $((e) => e.charts.flow?.chartType) || "sankey", R = $((e) => e.buildFunnelQueryFromSteps), pe = H(() => O === "funnel" ? R() : null, [
		O,
		R,
		A
	]), me = $((e) => e.buildFlowQuery), he = H(() => O === "flow" ? me() : null, [
		O,
		me,
		P,
		F,
		oe,
		se,
		I,
		L,
		ce,
		fe,
		le
	]), ge = $((e) => e.retentionCube), _e = $((e) => e.retentionBindingKey), z = $((e) => e.retentionTimeDimension), ve = $((e) => e.retentionDateRange), ye = $((e) => e.retentionCohortFilters), be = $((e) => e.retentionActivityFilters), V = $((e) => e.retentionBreakdowns), U = $((e) => e.retentionViewGranularity), G = $((e) => e.retentionPeriods), K = $((e) => e.retentionType), q = $((e) => e.buildRetentionQuery), xe = $((e) => e.getRetentionValidation), Se = $((e) => e.charts.retention?.displayConfig), J = H(() => O === "retention" ? q() : null, [
		O,
		q,
		ge,
		_e,
		z,
		ve,
		V,
		U,
		G,
		K,
		ye,
		be
	]), Ce = H(() => O === "retention" ? xe() : null, [
		O,
		xe,
		ge,
		_e,
		z,
		ve
	]), we = H(() => O === "retention" ? J !== null : O === "flow" ? he !== null : O === "funnel" ? pe !== null : w ?? !1, [
		O,
		J,
		he,
		pe,
		w
	]), { chartType: Te, chartConfig: Y, displayConfig: De } = $(n(kn)), Oe = $((e) => e.userManuallySelectedChart), ke = $((e) => e.localPaletteName), Ae = $((e) => e.setChartTypeManual), je = $((e) => e.setChartConfig), Me = $((e) => e.setDisplayConfig), Ne = $((e) => e.setFunnelChartType), Pe = $((e) => e.setFunnelChartConfig), Fe = $((e) => e.setFunnelDisplayConfig), Ie = $((e) => e.setLocalPaletteName), Le = $((e) => e.setUserManuallySelectedChart), Re = B((e) => {
		if (O === "funnel") Ne(e);
		else {
			Ae(e);
			let { chartConfig: t } = jt(T, E, e);
			je(t);
		}
	}, [
		O,
		T,
		E,
		Ne,
		Ae,
		je
	]), ze = B((e) => {
		O === "funnel" ? Pe(e) : je(e);
	}, [
		O,
		Pe,
		je
	]), Be = B((e) => {
		O === "funnel" ? Fe(e) : Me(e);
	}, [
		O,
		Fe,
		Me
	]), Ve = H(() => kt(T, E), [T, E]), He = H(() => t ? Array.isArray(t) && typeof t[0] == "string" ? {
		name: "custom",
		label: "Custom",
		colors: t,
		gradient: t
	} : t : p(ke), [t, ke]), Ue = B((e) => {
		r.setState((t) => ({ charts: {
			...t.charts,
			flow: {
				...t.charts.flow || {
					chartType: "sankey",
					chartConfig: {},
					displayConfig: {}
				},
				displayConfig: e
			}
		} }));
	}, [r]), We = B((e) => {
		r.setState((t) => ({ charts: {
			...t.charts,
			retention: {
				...t.charts.retention || {
					chartType: "retentionCombined",
					chartConfig: {},
					displayConfig: {}
				},
				displayConfig: e
			}
		} }));
	}, [r]), Ge = $((e) => e.activeTab), Ke = $((e) => e.activeView), qe = $((e) => e.displayLimit), Je = $((e) => e.showFieldModal), Ye = $((e) => e.fieldModalMode), Xe = $((e) => e.setActiveTab), Ze = $((e) => e.setActiveView), Qe = $((e) => e.setDisplayLimit), $e = $((e) => e.closeFieldModal), [et, tt] = W(0), nt = $((e) => e.openMetricsModal), rt = $((e) => e.addMetric), it = $((e) => e.removeMetric), at = $((e) => e.toggleMetric), ot = $((e) => e.reorderMetrics), st = $((e) => e.openBreakdownsModal), ct = $((e) => e.addBreakdown), lt = $((e) => e.removeBreakdown), ut = $((e) => e.toggleBreakdown), dt = $((e) => e.setBreakdownGranularity), ft = $((e) => e.toggleBreakdownComparison), pt = $((e) => e.reorderBreakdowns), mt = $((e) => e.setFilters), ht = $((e) => e.dropFieldToFilter), gt = $((e) => e.setOrder), _t = $((e) => e.setLimit), vt = $((e) => e.clearQuery), yt = $((e) => e.clearCurrentMode), bt = $((e) => e.setFunnelBindingKey), xt = $((e) => e.setAnalysisType), St = $((e) => e.setFunnelCube), Ct = $((e) => e.addFunnelStep), wt = $((e) => e.removeFunnelStep), Tt = $((e) => e.updateFunnelStep), Et = $((e) => e.setActiveFunnelStepIndex), Dt = $((e) => e.reorderFunnelSteps), Ot = $((e) => e.setFunnelTimeDimension), At = $((e) => e.setFlowCube), Mt = $((e) => e.setFlowBindingKey), Nt = $((e) => e.setFlowTimeDimension), Pt = $((e) => e.setEventDimension), Ft = $((e) => e.setStartingStepName), It = $((e) => e.setStartingStepFilters), Lt = $((e) => e.setStepsBefore), Rt = $((e) => e.setStepsAfter), zt = $((e) => e.setJoinStrategy), Bt = $((e) => e.setRetentionCube), Vt = $((e) => e.setRetentionBindingKey), Ht = $((e) => e.setRetentionTimeDimension), Ut = $((e) => e.setRetentionDateRange), Wt = $((e) => e.setRetentionCohortFilters), Gt = $((e) => e.setRetentionActivityFilters), Kt = $((e) => e.setRetentionBreakdowns), X = $((e) => e.addRetentionBreakdown), Z = $((e) => e.removeRetentionBreakdown), qt = $((e) => e.setRetentionViewGranularity), Jt = $((e) => e.setRetentionPeriods), Q = $((e) => e.setRetentionType), Yt = $((e) => e.getValidation), Xt = H(() => Yt(), [
		Yt,
		i,
		O,
		A,
		k,
		j,
		P,
		F,
		oe,
		se,
		I,
		L,
		ce,
		le
	]), Zt = B((e, t) => {
		O === "retention" && t === "dimension" ? X({ field: e.name }) : ut(e.name, t === "timeDimension");
	}, [
		O,
		X,
		ut
	]), Qt = B((e, t, n, r) => {
		Ye === "metrics" && t === "measure" ? at(e.name) : Ye === "breakdown" && Zt(e, t), r || $e();
	}, [
		Ye,
		at,
		Zt,
		$e
	]);
	return {
		storeApi: r,
		queryState: g,
		queryStates: i,
		activeQueryIndex: a,
		mergeStrategy: o,
		isMultiQueryMode: _,
		mergeKeys: v,
		currentQuery: b,
		allQueries: x,
		multiQueryConfig: S,
		multiQueryValidation: C,
		isValidQuery: w,
		effectiveIsValidQuery: we,
		combinedMetrics: T,
		combinedBreakdowns: E,
		effectiveBreakdowns: D,
		analysisType: O,
		funnelBindingKey: k,
		isFunnelModeEnabled: M,
		funnelCube: ee,
		funnelSteps: A,
		activeFunnelStepIndex: te,
		funnelTimeDimension: j,
		funnelChartType: ne,
		funnelChartConfig: re,
		funnelDisplayConfig: ae,
		serverFunnelQuery: pe,
		flowCube: P,
		flowBindingKey: F,
		flowTimeDimension: oe,
		eventDimension: se,
		startingStep: I,
		stepsBefore: L,
		stepsAfter: ce,
		joinStrategy: le,
		flowDisplayConfig: de,
		serverFlowQuery: he,
		retentionCube: ge,
		retentionBindingKey: _e,
		retentionTimeDimension: z,
		retentionDateRange: ve,
		retentionCohortFilters: ye,
		retentionActivityFilters: be,
		retentionBreakdowns: V,
		retentionViewGranularity: U,
		retentionPeriods: G,
		retentionType: K,
		retentionDisplayConfig: Se,
		serverRetentionQuery: J,
		retentionValidation: Ce,
		chartType: Te,
		chartConfig: Y,
		displayConfig: De,
		colorPalette: He,
		localPaletteName: ke,
		chartAvailability: Ve,
		userManuallySelectedChart: Oe,
		activeTab: Ge,
		activeView: Ke,
		displayLimit: qe,
		showFieldModal: Je,
		fieldModalMode: Ye,
		activeTableIndex: et,
		adapterValidation: Xt,
		getQueryConfig: B(() => {
			let e = r.getState();
			return e.analysisType === "funnel" ? e.buildFunnelQueryFromSteps() || e.buildCurrentQuery() : e.queryStates.length > 1 ? {
				queries: e.buildAllQueries(),
				mergeStrategy: e.mergeStrategy,
				mergeKeys: e.getMergeKeys(),
				queryLabels: e.queryStates.map((e, t) => `Q${t + 1}`),
				funnelBindingKey: e.funnelBindingKey,
				stepTimeToConvert: e.stepTimeToConvert
			} : e.buildCurrentQuery();
		}, [r]),
		getChartConfig: B(() => {
			let e = r.getState(), t = e.charts[e.analysisType];
			return t ? {
				chartType: t.chartType,
				chartConfig: t.chartConfig,
				displayConfig: t.displayConfig
			} : {
				chartType: Te,
				chartConfig: Y,
				displayConfig: De
			};
		}, [
			r,
			Te,
			Y,
			De
		]),
		getAnalysisType: B(() => r.getState().analysisType, [r]),
		actions: {
			setActiveQueryIndex: s,
			setMergeStrategy: c,
			addQuery: u,
			removeQuery: d,
			openMetricsModal: nt,
			addMetric: rt,
			removeMetric: it,
			toggleMetric: at,
			reorderMetrics: ot,
			openBreakdownsModal: st,
			addBreakdown: ct,
			removeBreakdown: lt,
			toggleBreakdown: ut,
			setBreakdownGranularity: dt,
			toggleBreakdownComparison: ft,
			reorderBreakdowns: pt,
			setFilters: mt,
			dropFieldToFilter: ht,
			setOrder: gt,
			setLimit: _t,
			setFunnelBindingKey: bt,
			setAnalysisType: xt,
			setFunnelCube: St,
			addFunnelStep: Ct,
			removeFunnelStep: wt,
			updateFunnelStep: Tt,
			setActiveFunnelStepIndex: Et,
			reorderFunnelSteps: Dt,
			setFunnelTimeDimension: Ot,
			setFunnelDisplayConfig: Fe,
			setFlowCube: At,
			setFlowBindingKey: Mt,
			setFlowTimeDimension: Nt,
			setEventDimension: Pt,
			setStartingStepName: Ft,
			setStartingStepFilters: It,
			setStepsBefore: Lt,
			setStepsAfter: Rt,
			setJoinStrategy: zt,
			setFlowDisplayConfig: Ue,
			setRetentionCube: Bt,
			setRetentionBindingKey: Vt,
			setRetentionTimeDimension: Ht,
			setRetentionDateRange: Ut,
			setRetentionCohortFilters: Wt,
			setRetentionActivityFilters: Gt,
			setRetentionBreakdowns: Kt,
			addRetentionBreakdown: X,
			removeRetentionBreakdown: Z,
			setRetentionViewGranularity: qt,
			setRetentionPeriods: Jt,
			setRetentionType: Q,
			setRetentionDisplayConfig: We,
			setChartType: Re,
			setChartConfig: ze,
			setDisplayConfig: Be,
			setLocalPaletteName: Ie,
			setUserManuallySelectedChart: Le,
			setActiveTab: Xe,
			setActiveView: Ze,
			setDisplayLimit: Qe,
			closeFieldModal: $e,
			setActiveTableIndex: tt,
			clearQuery: vt,
			clearCurrentMode: yt,
			handleFieldSelected: Qt
		}
	};
}
//#endregion
//#region src/client/hooks/analysisQueryExecutionModes.ts
function Wn(e) {
	return e.isRetentionMode ? "retention" : e.isFlowMode ? "flow" : e.isFunnelMode ? "funnel" : e.isMultiMode ? "multi" : "single";
}
function Gn(e, t) {
	return t[e];
}
function Kn(e) {
	return {
		funnelExecutedQueries: e.isFunnelMode && e.funnelExecutedQueries && e.funnelExecutedQueries.length > 0 ? e.funnelExecutedQueries : null,
		funnelServerQuery: e.isFunnelMode ? e.funnelServerQuery : null,
		funnelDebugData: e.isFunnelMode ? e.funnelDebugData : null,
		flowServerQuery: e.isFlowMode ? e.flowServerQuery : null,
		flowChartData: e.isFlowMode ? e.flowData : null,
		flowDebugData: e.isFlowMode ? e.flowDebugData : null,
		retentionServerQuery: e.isRetentionMode ? e.retentionServerQuery : null,
		retentionChartData: e.isRetentionMode ? e.retentionChartData : null,
		retentionDebugData: e.isRetentionMode ? e.retentionDebugData : null
	};
}
function qn(e) {
	return {
		single: !e.isValidQuery || !e.isSingleMode,
		multi: !e.hasMultiQueryConfig || !e.isMultiMode,
		funnel: !e.isFunnelMode || !e.hasFunnelConfig && !e.hasServerFunnelQuery,
		flow: !e.isFlowMode || !e.hasServerFlowQuery,
		retention: !e.isRetentionMode || !e.hasServerRetentionQuery,
		dryRun: !!(!e.isValidQuery || e.isFunnelMode || e.isFlowMode || e.isRetentionMode)
	};
}
function Jn(e) {
	let { hasResults: t, initialData: n, isValidQuery: r, isLoading: i, isFetching: a, error: o } = e;
	return n && n.length > 0 && !t ? "success" : r ? i && !t ? "loading" : a && t ? "refreshing" : o ? "error" : t ? "success" : "idle" : "idle";
}
function Yn(e) {
	return e.isRetentionMode && e.retentionChartData ? e.retentionChartData.rows.map((e) => ({
		"Retention.period": `P${e.period}`,
		"Retention.rate": e.retentionRate,
		"Retention.retained": e.retainedUsers,
		"Retention.cohortSize": e.cohortSize,
		"Retention.segment": e.breakdownValue || "All Users"
	})) : e.isFlowMode && e.flowData ? [e.flowData] : e.isFunnelMode && e.funnelChartData ? e.funnelChartData : e.isMultiMode && e.multiData ? e.multiData : e.singleRawData ? e.singleRawData : e.initialData && e.initialData.length > 0 ? e.initialData : null;
}
//#endregion
//#region src/client/hooks/useAnalysisQuery.ts
function Xn(e) {
	let { currentQuery: t, allQueries: n, multiQueryConfig: r, isMultiQueryMode: i, isValidQuery: a, initialData: o, mergeStrategy: s, funnelBindingKey: c, isFunnelModeEnabled: l, analysisType: u, serverFunnelQuery: d, serverFlowQuery: f, serverRetentionQuery: p, retentionValidation: m } = e, { getFieldLabel: h } = fe(), g = u === "funnel" || l, _ = u === "flow", v = u === "retention", y = u === "query" && i, b = u === "query" && !i, x = u === "funnel" && !!d, S = Wn({
		isRetentionMode: v,
		isFlowMode: _,
		isFunnelMode: g,
		isMultiMode: y
	}), C = H(() => x || !g || !c || n.length < 2 ? null : he(n, c), [
		x,
		g,
		c,
		n
	]), w = qn({
		isValidQuery: a,
		isSingleMode: b,
		isMultiMode: y,
		isFunnelMode: g,
		isFlowMode: _,
		isRetentionMode: v,
		hasMultiQueryConfig: !!r,
		hasFunnelConfig: !!C,
		hasServerFunnelQuery: !!d,
		hasServerFlowQuery: !!f,
		hasServerRetentionQuery: !!p
	}), T = P(t, {
		skip: w.single,
		debounceMs: 300
	}), E = se(r, {
		skip: w.multi,
		debounceMs: 300
	}), D = ce(C, {
		skip: w.funnel,
		debounceMs: 300,
		prebuiltServerQuery: x ? d : void 0
	}), O = de(f ?? null, {
		skip: w.flow,
		debounceMs: 300
	}), k = oe(p ?? null, {
		skip: w.retention,
		debounceMs: 300,
		getFieldLabel: h
	}), ee = me({
		queries: i ? n : [t],
		isMultiQueryMode: i,
		skip: w.dryRun
	}), A = pe(D.serverQuery, { skip: !g || !D.serverQuery }), te = pe(O.serverQuery, { skip: !_ || !O.serverQuery }), j = pe(p, { skip: !v || !p }), M = Gn(S, {
		retention: k.isLoading || k.isDebouncing,
		flow: O.isLoading || O.isDebouncing,
		funnel: D.isExecuting || D.isDebouncing,
		multi: E.isLoading,
		single: T.isLoading
	}), ne = Gn(S, {
		retention: k.isFetching,
		flow: O.isFetching,
		funnel: D.isExecuting,
		multi: E.isFetching,
		single: T.isFetching
	}), N = Gn(S, {
		retention: k.error,
		flow: O.error,
		funnel: D.error,
		multi: E.error,
		single: T.error
	}), re = !!(T.debouncedQuery || E.debouncedConfig || !D.isDebouncing || !O.isDebouncing || !k.isDebouncing), ie = B((e) => {
		switch (S) {
			case "retention":
				k.execute(e);
				break;
			case "flow":
				O.refetch(e);
				break;
			case "funnel":
				D.execute(e);
				break;
			case "multi":
				E.refetch(e);
				break;
			default: T.refetch(e);
		}
	}, [
		S,
		k,
		O,
		D,
		E,
		T
	]), ae = H(() => Jn({
		hasResults: Gn(S, {
			retention: k.chartData,
			flow: O.data,
			funnel: D.chartData,
			multi: E.data,
			single: T.rawData
		}),
		initialData: o,
		isValidQuery: a,
		isLoading: M,
		isFetching: ne,
		error: N
	}), [
		a,
		M,
		ne,
		N,
		T.rawData,
		E.data,
		D.chartData,
		O.data,
		k.chartData,
		o,
		S
	]), F = H(() => Yn({
		isRetentionMode: v,
		isFlowMode: _,
		isFunnelMode: g,
		isMultiMode: y,
		retentionChartData: k.chartData,
		flowData: O.data,
		funnelChartData: D.chartData,
		multiData: E.data,
		singleRawData: T.rawData,
		initialData: o
	}), [
		T.rawData,
		E.data,
		D.chartData,
		O.data,
		k.chartData,
		o,
		y,
		g,
		_,
		v
	]), I = H(() => g && D.stepResults ? D.stepResults.map((e) => e.data) : !y || !E.perQueryData ? null : E.perQueryData, [
		y,
		g,
		E.perQueryData,
		D.stepResults
	]), { funnelExecutedQueries: L, funnelServerQuery: le, funnelDebugData: ue, flowServerQuery: R, flowChartData: ge, flowDebugData: _e, retentionServerQuery: z, retentionChartData: ve, retentionDebugData: ye } = Kn({
		isFunnelMode: g,
		isFlowMode: _,
		isRetentionMode: v,
		funnelExecutedQueries: D.executedQueries,
		funnelServerQuery: D.serverQuery,
		funnelDebugData: A.debugData,
		flowServerQuery: O.serverQuery,
		flowData: O.data,
		flowDebugData: te.debugData,
		retentionServerQuery: p ?? null,
		retentionChartData: k.chartData,
		retentionDebugData: j.debugData
	}), be = H(() => Gn(S, {
		retention: k.needsRefresh,
		flow: O.needsRefresh,
		funnel: D.needsRefresh,
		multi: !1,
		single: T.needsRefresh
	}), [
		S,
		k.needsRefresh,
		O.needsRefresh,
		D.needsRefresh,
		T.needsRefresh
	]), V = H(() => {
		if (b && T.warnings) return T.warnings;
	}, [b, T.warnings]);
	return {
		executionStatus: ae,
		executionResults: F,
		perQueryResults: I,
		isLoading: M,
		isFetching: ne,
		error: N,
		debugDataPerQuery: ee.debugDataPerQuery,
		hasDebounced: re,
		refetch: ie,
		funnelExecutedQueries: L,
		funnelServerQuery: le,
		funnelDebugData: ue,
		flowServerQuery: R,
		flowChartData: ge,
		flowDebugData: _e,
		retentionServerQuery: z,
		retentionChartData: ve,
		retentionDebugData: ye,
		retentionValidation: m ?? null,
		needsRefresh: be,
		warnings: V
	};
}
//#endregion
//#region src/client/utils/shareUtils.ts
var Zn = o(), Qn = 1800, $n = "share=";
function er(e) {
	let t = JSON.stringify(e);
	return (0, Zn.compressToEncodedURIComponent)(t);
}
function tr(e) {
	try {
		let t = (0, Zn.decompressFromEncodedURIComponent)(e);
		if (!t) return null;
		let n = JSON.parse(t);
		return O(n) ? n : (console.warn("[shareUtils] Invalid AnalysisConfig in share URL"), null);
	} catch {
		return null;
	}
}
function nr(e) {
	let t = er(e);
	return {
		ok: t.length <= Qn,
		size: t.length,
		maxSize: Qn
	};
}
function rr(e) {
	let t = er(e);
	if (t.length <= Qn) return {
		encoded: t,
		queryOnly: !1
	};
	let n = er({
		version: e.version,
		analysisType: e.analysisType,
		activeView: e.activeView,
		charts: {},
		query: e.query
	});
	return n.length <= Qn ? {
		encoded: n,
		queryOnly: !0
	} : {
		encoded: null,
		queryOnly: !0
	};
}
function ir(e) {
	let { encoded: t } = rr(e);
	return t ? `${window.location.origin}${window.location.pathname}#${$n}${t}` : null;
}
function ar() {
	if (typeof window > "u") return null;
	let e = window.location.hash;
	return !e || !e.startsWith(`#${$n}`) ? null : e.slice(7);
}
function or() {
	if (typeof window > "u") return;
	let e = new URL(window.location.href);
	e.hash = "", window.history.replaceState(null, "", e.toString());
}
function sr() {
	let e = ar();
	return e ? tr(e) : null;
}
//#endregion
//#region src/client/components/AIAssistant/utils.ts
async function cr(e, t, n = "/api/ai/generate", r) {
	let i = { text: t }, a = {
		"Content-Type": "application/json",
		...r
	};
	e && e.trim() && (a["X-API-Key"] = e), console.log("🤖 Client: Sending user prompt to AI proxy"), console.log("  URL:", n), console.log("  Headers:", a), console.log("  User prompt length:", t.length);
	let o = await fetch(n, {
		method: "POST",
		headers: a,
		body: JSON.stringify(i)
	});
	if (console.log("📥 Client: Proxy response"), console.log("  Status:", o.status), console.log("  Status Text:", o.statusText), !o.ok) {
		let e = `Failed to generate content: ${o.status} ${o.statusText}`;
		try {
			let t = await o.json();
			if (console.error("❌ Client: Proxy error:", t), o.status === 429 && t.error === "Daily quota exceeded") throw Error(`${t.message}\n\n${t.suggestion || "Add your own Gemini API key for unlimited access."}`);
			t.error && (e = t.message || t.error, t.suggestion && (e += `\n\n💡 ${t.suggestion}`));
		} catch {
			try {
				let t = await o.text();
				console.error("❌ Client: Proxy text error:", t), e = t || e;
			} catch {
				console.error("❌ Client: Could not parse error response");
			}
		}
		throw Error(e);
	}
	let s = await o.json();
	return console.log("✅ Client: Successfully generated content"), s;
}
function lr(e) {
	return (e.query || "").replace(/```json\s*/g, "").replace(/```\s*/g, "").replace(/^\s*```.*\n/gm, "").trim();
}
//#endregion
//#region src/client/hooks/useAnalysisEffects.ts
function ur(e) {
	return typeof e == "object" && !!e && "funnel" in e && typeof e.funnel == "object";
}
function dr(e) {
	let { state: t, query: n, aiEndpoint: r = "/api/ai", onQueryChange: i, onChartConfigChange: a } = e, { storeApi: o, actions: s } = t, { apiOptions: l } = c(), u = U(!1);
	V(() => {
		if (u.current) return;
		u.current = !0;
		let e = sr();
		e && (o.getState().load(e), or());
	}, [o]), V(() => {
		i && t.isValidQuery && i(t.currentQuery);
	}, [
		t.currentQuery,
		t.isValidQuery,
		i
	]), V(() => {
		a && a({
			chartType: t.chartType,
			chartConfig: t.chartConfig,
			displayConfig: t.displayConfig
		});
	}, [
		t.chartType,
		t.chartConfig,
		t.displayConfig,
		a
	]);
	let { combinedMetrics: d, combinedBreakdowns: p, chartType: h, chartConfig: g, userManuallySelectedChart: _ } = t, { hasDebounced: v } = n, { setChartType: y, setChartConfig: b } = s, x = U("");
	V(() => {
		if (!v || d.length === 0 && p.length === 0) return;
		let e = JSON.stringify({
			metrics: d.map((e) => e.field),
			breakdowns: p.map((e) => ({
				field: e.field,
				isTime: e.isTimeDimension
			}))
		});
		if (e === x.current) return;
		x.current = e;
		let t = Nt(d, p, h, _);
		if (t) {
			let { chartConfig: e } = jt(d, p, t);
			y(t), b(e), s.setUserManuallySelectedChart(!1);
		} else if (d.length > 0 || p.length > 0) {
			if (h === "table" || h === "recordsTable") {
				let e = h === "recordsTable" ? "columns" : "xAxis", t = [...p.map((e) => e.field), ...d.map((e) => e.field)], n = Array.isArray(g[e]) ? g[e] : [], r = new Set(g.hiddenColumns ?? []), i = t.filter((e) => !n.includes(e) && !r.has(e));
				i.length > 0 && b({
					...g,
					[e]: [...n, ...i]
				});
			} else if (!g.xAxis?.length && !g.yAxis?.length && !g.series?.length) {
				let { chartConfig: e } = jt(d, p, h);
				b(e);
			}
		}
	}, [
		v,
		d,
		p,
		h,
		_,
		g,
		y,
		b,
		s
	]);
	let [S, C] = W({
		isOpen: !1,
		userPrompt: "",
		isGenerating: !1,
		error: null,
		hasGeneratedQuery: !1,
		previousState: null,
		previousConfig: null
	}), w = B((e) => {
		o.getState().updateQueryState(t.activeQueryIndex, (t) => {
			let n = e(t);
			return {
				...t,
				metrics: n.metrics,
				breakdowns: n.breakdowns,
				filters: n.filters,
				order: n.order,
				limit: n.limit
			};
		});
	}, [o, t.activeQueryIndex]), T = B((e) => {
		let t = {
			version: 1,
			analysisType: "funnel",
			activeView: "chart",
			charts: { funnel: {
				chartType: "funnel",
				chartConfig: {},
				displayConfig: {}
			} },
			query: e
		};
		o.getState().load(t);
	}, [o]), E = B(() => {
		let e = o.getState().save();
		C({
			isOpen: !0,
			userPrompt: "",
			isGenerating: !1,
			error: null,
			hasGeneratedQuery: !1,
			previousState: {
				metrics: [...t.queryState.metrics],
				breakdowns: [...t.queryState.breakdowns],
				filters: [...t.queryState.filters],
				chartType: t.chartType,
				chartConfig: { ...t.chartConfig },
				displayConfig: { ...t.displayConfig },
				analysisType: t.analysisType || "query"
			},
			previousConfig: e
		});
	}, [
		o,
		t.queryState.metrics,
		t.queryState.breakdowns,
		t.queryState.filters,
		t.chartType,
		t.chartConfig,
		t.displayConfig,
		t.analysisType
	]), D = B(() => {
		C((e) => ({
			...e,
			isOpen: !1,
			userPrompt: "",
			error: null,
			hasGeneratedQuery: !1
		}));
	}, []), O = B((e) => {
		C((t) => ({
			...t,
			userPrompt: e
		}));
	}, []), k = B(async () => {
		if (S.userPrompt.trim()) {
			C((e) => ({
				...e,
				isGenerating: !0,
				error: null
			}));
			try {
				let e = lr(await cr("", S.userPrompt, r, l?.headers)), n = JSON.parse(e), i = "query" in n && n.query ? n.query : n, a = "chartType" in n ? n.chartType : void 0, o = "chartConfig" in n ? n.chartConfig : void 0;
				if (ur(i)) {
					s.setAnalysisType("funnel"), T(i), s.setChartType("funnel"), o && s.setChartConfig(o), s.setActiveView("chart"), C((e) => ({
						...e,
						isGenerating: !1,
						hasGeneratedQuery: !0
					}));
					return;
				}
				let c = i;
				w((e) => ({
					...e,
					metrics: (c.measures || []).map((e, t) => ({
						id: m(),
						field: e,
						label: f(t)
					})),
					breakdowns: [...(c.dimensions || []).map((e) => ({
						id: m(),
						field: e,
						isTimeDimension: !1
					})), ...(c.timeDimensions || []).map((e) => ({
						id: m(),
						field: e.dimension,
						granularity: e.granularity,
						isTimeDimension: !0
					}))],
					filters: c.filters || [],
					order: c.order || void 0,
					limit: c.limit ?? void 0
				})), t.analysisType === "funnel" && s.setAnalysisType("query"), a && s.setChartType(a), o && s.setChartConfig(o), s.setActiveView("chart"), C((e) => ({
					...e,
					isGenerating: !1,
					hasGeneratedQuery: !0
				}));
			} catch (e) {
				C((t) => ({
					...t,
					isGenerating: !1,
					error: e instanceof Error ? e.message : "Failed to generate query"
				}));
			}
		}
	}, [
		S.userPrompt,
		r,
		l?.headers,
		w,
		T,
		t.analysisType,
		s
	]), ee = B(() => {
		C({
			isOpen: !1,
			userPrompt: "",
			isGenerating: !1,
			error: null,
			hasGeneratedQuery: !1,
			previousState: null,
			previousConfig: null
		});
	}, []), A = B(() => {
		S.previousConfig ? o.getState().load(S.previousConfig) : S.previousState && (w((e) => ({
			...e,
			metrics: S.previousState.metrics,
			breakdowns: S.previousState.breakdowns,
			filters: S.previousState.filters
		})), s.setChartType(S.previousState.chartType), s.setChartConfig(S.previousState.chartConfig), s.setDisplayConfig(S.previousState.displayConfig), S.previousState.analysisType && s.setAnalysisType(S.previousState.analysisType)), C({
			isOpen: !1,
			userPrompt: "",
			isGenerating: !1,
			error: null,
			hasGeneratedQuery: !1,
			previousState: null,
			previousConfig: null
		});
	}, [
		S.previousState,
		S.previousConfig,
		o,
		w,
		s
	]), [te, j] = W("idle"), M = t.effectiveIsValidQuery;
	return {
		aiState: S,
		openAI: E,
		closeAI: D,
		setAIPrompt: O,
		generateAI: k,
		acceptAI: ee,
		cancelAI: A,
		shareButtonState: te,
		share: B(async () => {
			if (!M) return;
			let { encoded: e, queryOnly: t } = rr(o.getState().save());
			if (!e) return;
			let n = `${window.location.origin}${window.location.pathname}#share=${e}`;
			try {
				await navigator.clipboard.writeText(n);
			} catch {
				let e = document.createElement("textarea");
				e.value = n, document.body.appendChild(e), e.select(), document.execCommand("copy"), document.body.removeChild(e);
			}
			j(t ? "copied-no-chart" : "copied"), setTimeout(() => {
				j("idle");
			}, 2e3);
		}, [M, o]),
		canShare: M
	};
}
//#endregion
//#region src/client/hooks/useAnalysisBuilderHook.ts
function fr(e = {}) {
	let { initialData: t, externalColorPalette: n, onQueryChange: r, onChartConfigChange: i } = e, { features: a } = s(), o = Un({ externalColorPalette: n }), c = Xn({
		currentQuery: o.currentQuery,
		allQueries: o.allQueries,
		multiQueryConfig: o.multiQueryConfig,
		isMultiQueryMode: o.isMultiQueryMode,
		isValidQuery: o.effectiveIsValidQuery,
		initialData: t,
		mergeStrategy: o.mergeStrategy,
		funnelBindingKey: o.funnelBindingKey,
		isFunnelModeEnabled: o.isFunnelModeEnabled,
		analysisType: o.analysisType,
		serverFunnelQuery: o.serverFunnelQuery,
		serverFlowQuery: o.serverFlowQuery,
		serverRetentionQuery: o.serverRetentionQuery,
		retentionValidation: o.retentionValidation
	}), l = dr({
		state: o,
		query: c,
		aiEndpoint: a?.aiEndpoint,
		onQueryChange: r,
		onChartConfigChange: i
	});
	return {
		queryState: o.queryState,
		queryStates: o.queryStates,
		activeQueryIndex: o.activeQueryIndex,
		mergeStrategy: o.mergeStrategy,
		isMultiQueryMode: o.isMultiQueryMode,
		mergeKeys: o.mergeKeys,
		currentQuery: o.currentQuery,
		allQueries: o.allQueries,
		multiQueryConfig: o.multiQueryConfig,
		multiQueryValidation: o.multiQueryValidation,
		funnelBindingKey: o.funnelBindingKey,
		isFunnelModeEnabled: o.isFunnelModeEnabled,
		analysisType: o.analysisType,
		funnelCube: o.funnelCube,
		funnelSteps: o.funnelSteps,
		activeFunnelStepIndex: o.activeFunnelStepIndex,
		funnelTimeDimension: o.funnelTimeDimension,
		funnelChartType: o.funnelChartType,
		funnelChartConfig: o.funnelChartConfig,
		funnelDisplayConfig: o.funnelDisplayConfig,
		flowCube: o.flowCube,
		flowBindingKey: o.flowBindingKey,
		flowTimeDimension: o.flowTimeDimension,
		eventDimension: o.eventDimension,
		startingStep: o.startingStep,
		stepsBefore: o.stepsBefore,
		stepsAfter: o.stepsAfter,
		joinStrategy: o.joinStrategy,
		flowDisplayConfig: o.flowDisplayConfig,
		retentionCube: o.retentionCube,
		retentionBindingKey: o.retentionBindingKey,
		retentionTimeDimension: o.retentionTimeDimension,
		retentionDateRange: o.retentionDateRange,
		retentionCohortFilters: o.retentionCohortFilters,
		retentionActivityFilters: o.retentionActivityFilters,
		retentionBreakdowns: o.retentionBreakdowns,
		retentionViewGranularity: o.retentionViewGranularity,
		retentionPeriods: o.retentionPeriods,
		retentionType: o.retentionType,
		retentionDisplayConfig: o.retentionDisplayConfig,
		executionStatus: c.executionStatus,
		executionResults: c.executionResults,
		perQueryResults: c.perQueryResults,
		isLoading: c.isLoading,
		isFetching: c.isFetching,
		error: c.error,
		isValidQuery: o.effectiveIsValidQuery,
		debugDataPerQuery: c.debugDataPerQuery,
		needsRefresh: c.needsRefresh,
		warnings: c.warnings,
		funnelExecutedQueries: c.funnelExecutedQueries,
		funnelServerQuery: c.funnelServerQuery,
		funnelDebugData: c.funnelDebugData,
		flowServerQuery: c.flowServerQuery,
		flowDebugData: c.flowDebugData,
		retentionServerQuery: c.retentionServerQuery,
		retentionDebugData: c.retentionDebugData,
		retentionChartData: c.retentionChartData,
		retentionValidation: c.retentionValidation,
		chartType: o.chartType,
		chartConfig: o.chartConfig,
		displayConfig: o.displayConfig,
		colorPalette: o.colorPalette,
		localPaletteName: o.localPaletteName,
		chartAvailability: o.chartAvailability,
		combinedMetrics: o.combinedMetrics,
		combinedBreakdowns: o.combinedBreakdowns,
		effectiveBreakdowns: o.effectiveBreakdowns,
		activeTab: o.activeTab,
		activeView: o.activeView,
		displayLimit: o.displayLimit,
		showFieldModal: o.showFieldModal,
		fieldModalMode: o.fieldModalMode,
		activeTableIndex: o.activeTableIndex,
		userManuallySelectedChart: o.userManuallySelectedChart,
		aiState: {
			isOpen: l.aiState.isOpen,
			userPrompt: l.aiState.userPrompt,
			isGenerating: l.aiState.isGenerating,
			error: l.aiState.error,
			hasGeneratedQuery: l.aiState.hasGeneratedQuery
		},
		shareButtonState: l.shareButtonState,
		canShare: l.canShare,
		adapterValidation: o.adapterValidation,
		actions: {
			setActiveQueryIndex: o.actions.setActiveQueryIndex,
			setMergeStrategy: o.actions.setMergeStrategy,
			openMetricsModal: o.actions.openMetricsModal,
			addMetric: o.actions.addMetric,
			removeMetric: o.actions.removeMetric,
			toggleMetric: o.actions.toggleMetric,
			reorderMetrics: o.actions.reorderMetrics,
			openBreakdownsModal: o.actions.openBreakdownsModal,
			addBreakdown: o.actions.addBreakdown,
			removeBreakdown: o.actions.removeBreakdown,
			toggleBreakdown: o.actions.toggleBreakdown,
			setBreakdownGranularity: o.actions.setBreakdownGranularity,
			toggleBreakdownComparison: o.actions.toggleBreakdownComparison,
			reorderBreakdowns: o.actions.reorderBreakdowns,
			setFilters: o.actions.setFilters,
			dropFieldToFilter: o.actions.dropFieldToFilter,
			setOrder: o.actions.setOrder,
			setLimit: o.actions.setLimit,
			addQuery: o.actions.addQuery,
			removeQuery: o.actions.removeQuery,
			setFunnelBindingKey: o.actions.setFunnelBindingKey,
			setAnalysisType: o.actions.setAnalysisType,
			setFunnelCube: o.actions.setFunnelCube,
			addFunnelStep: o.actions.addFunnelStep,
			removeFunnelStep: o.actions.removeFunnelStep,
			updateFunnelStep: o.actions.updateFunnelStep,
			setActiveFunnelStepIndex: o.actions.setActiveFunnelStepIndex,
			reorderFunnelSteps: o.actions.reorderFunnelSteps,
			setFunnelTimeDimension: o.actions.setFunnelTimeDimension,
			setFunnelDisplayConfig: o.actions.setFunnelDisplayConfig,
			setFlowCube: o.actions.setFlowCube,
			setFlowBindingKey: o.actions.setFlowBindingKey,
			setFlowTimeDimension: o.actions.setFlowTimeDimension,
			setEventDimension: o.actions.setEventDimension,
			setStartingStepName: o.actions.setStartingStepName,
			setStartingStepFilters: o.actions.setStartingStepFilters,
			setStepsBefore: o.actions.setStepsBefore,
			setStepsAfter: o.actions.setStepsAfter,
			setJoinStrategy: o.actions.setJoinStrategy,
			setFlowDisplayConfig: o.actions.setFlowDisplayConfig,
			setRetentionCube: o.actions.setRetentionCube,
			setRetentionBindingKey: o.actions.setRetentionBindingKey,
			setRetentionTimeDimension: o.actions.setRetentionTimeDimension,
			setRetentionDateRange: o.actions.setRetentionDateRange,
			setRetentionCohortFilters: o.actions.setRetentionCohortFilters,
			setRetentionActivityFilters: o.actions.setRetentionActivityFilters,
			setRetentionBreakdowns: o.actions.setRetentionBreakdowns,
			addRetentionBreakdown: o.actions.addRetentionBreakdown,
			removeRetentionBreakdown: o.actions.removeRetentionBreakdown,
			setRetentionViewGranularity: o.actions.setRetentionViewGranularity,
			setRetentionPeriods: o.actions.setRetentionPeriods,
			setRetentionType: o.actions.setRetentionType,
			setRetentionDisplayConfig: o.actions.setRetentionDisplayConfig,
			setChartType: o.actions.setChartType,
			setChartConfig: o.actions.setChartConfig,
			setDisplayConfig: o.actions.setDisplayConfig,
			setLocalPaletteName: o.actions.setLocalPaletteName,
			setActiveTab: o.actions.setActiveTab,
			setActiveView: o.actions.setActiveView,
			setDisplayLimit: o.actions.setDisplayLimit,
			closeFieldModal: o.actions.closeFieldModal,
			setActiveTableIndex: o.actions.setActiveTableIndex,
			openAI: l.openAI,
			closeAI: l.closeAI,
			setAIPrompt: l.setAIPrompt,
			generateAI: l.generateAI,
			acceptAI: l.acceptAI,
			cancelAI: l.cancelAI,
			share: l.share,
			clearQuery: o.actions.clearQuery,
			clearCurrentMode: o.actions.clearCurrentMode,
			refetch: c.refetch,
			handleFieldSelected: o.actions.handleFieldSelected
		},
		getQueryConfig: o.getQueryConfig,
		getChartConfig: o.getChartConfig,
		getAnalysisType: o.getAnalysisType
	};
}
//#endregion
//#region src/client/utils/funnelValidation.ts
function pr(e, t) {
	let n = [];
	if (!t?.cubes) return n;
	if (typeof e.dimension == "string") {
		let [r, i] = e.dimension.split("."), a = t.cubes.find((e) => e.name === r);
		a ? a.dimensions?.find((t) => t.name === e.dimension) || n.push({
			type: "binding_key",
			message: `Dimension "${i}" not found in cube "${r}"`
		}) : n.push({
			type: "binding_key",
			message: `Cube "${r}" not found for binding key`
		});
	} else for (let r of e.dimension) {
		let e = t.cubes.find((e) => e.name === r.cube);
		e ? e.dimensions?.find((e) => e.name === r.dimension) || n.push({
			type: "cross_cube",
			message: `Dimension "${r.dimension}" not found in cube "${r.cube}"`
		}) : n.push({
			type: "cross_cube",
			message: `Cube "${r.cube}" not found for binding key mapping`
		});
	}
	return n;
}
function mr(e) {
	let t = [];
	for (let n = 0; n < e.length; n++) {
		let r = e[n], i = r.query;
		i.measures && i.measures.length > 0 || i.dimensions && i.dimensions.length > 0 || i.timeDimensions && i.timeDimensions.length > 0 || t.push({
			type: "step_query",
			message: `Step ${n + 1} "${r.name}" has no measures, dimensions, or time dimensions`,
			stepIndex: n
		});
	}
	return t;
}
function hr(e, t) {
	if (typeof e.dimension == "string") return !0;
	let n = ge(t);
	return n ? e.dimension.some((e) => e.cube === n) : !1;
}
function gr(e, t) {
	let n = [];
	for (let r = 0; r < t.length; r++) {
		let i = t[r];
		if (!hr(e, i.query)) {
			let e = ge(i.query) || "unknown";
			n.push({
				type: "cross_cube",
				message: `Step ${r + 1} uses cube "${e}" but no binding key mapping exists for it`,
				stepIndex: r
			});
		}
	}
	return n;
}
function _r(e) {
	return e ? /^P(?:\d+Y)?(?:\d+M)?(?:\d+W)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+S)?)?$/.test(e) ? null : {
		type: "time_window",
		message: `Invalid time window format "${e}". Expected ISO 8601 duration (e.g., P7D, PT1H)`
	} : null;
}
function vr(e, t) {
	let n = [], r = [];
	e.steps.length < 2 && n.push({
		type: "general",
		message: "Funnel requires at least 2 steps"
	}), e.bindingKey?.dimension ? (n.push(...pr(e.bindingKey, t)), n.push(...gr(e.bindingKey, e.steps))) : n.push({
		type: "binding_key",
		message: "Binding key dimension is required"
	}), n.push(...mr(e.steps));
	for (let t = 0; t < e.steps.length; t++) {
		let r = e.steps[t], i = _r(r.timeToConvert);
		i && (i.stepIndex = t, n.push(i));
	}
	let i = _r(e.globalTimeWindow);
	return i && n.push(i), e.steps.length > 5 && r.push({
		type: "general",
		message: "Funnels with more than 5 steps may have reduced performance"
	}), {
		isValid: n.length === 0,
		errors: n,
		warnings: r
	};
}
function yr(e, t) {
	return t < 2 ? {
		isValid: !1,
		message: "Add at least 2 steps for funnel"
	} : !e?.dimension || typeof e.dimension == "string" && !e.dimension || Array.isArray(e.dimension) && e.dimension.length === 0 ? {
		isValid: !1,
		message: "Select a binding key dimension"
	} : { isValid: !0 };
}
function br(e) {
	if (!e?.cubes) return [];
	let t = [];
	for (let n of e.cubes) if (n.dimensions) for (let e of n.dimensions) (e.type === "string" || e.type === "number") && t.push({
		cube: n.name,
		dimension: e.name,
		label: e.title || e.shortTitle || e.name.split(".")[1] || e.name
	});
	return t;
}
function xr(e) {
	if (!e?.dimension) return "Select binding key...";
	if (typeof e.dimension == "string") return e.dimension.split(".")[1] || e.dimension;
	if (e.dimension.length > 0) {
		let t = e.dimension[0];
		return `${t.dimension.split(".")[1] || t.dimension} (${e.dimension.length} cubes)`;
	}
	return "Select binding key...";
}
//#endregion
export { An as A, Dn as C, Mn as D, On as E, Xe as F, wn as M, Rt as N, En as O, at as P, Cn as S, Tn as T, Hn as _, gr as a, Rn as b, fr as c, ir as d, nr as f, In as g, Ln as h, pr as i, $ as j, jn as k, er as l, sr as m, xr as n, vr as o, ar as p, yr as r, mr as s, br as t, tr as u, Bn as v, kn as w, Pn as x, Fn as y };

//# sourceMappingURL=analysis-builder-shared-n20CH0VA.js.map