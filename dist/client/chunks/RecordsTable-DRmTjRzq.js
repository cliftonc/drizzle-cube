import { i as e, y as t } from "./chart-data-table-Bn9EtETl.js";
import { B as n, E as r, F as i, w as a } from "./chart-activity-grid-D6X0iOUw.js";
import { O as o } from "./chart-area-95fIdTeM.js";
import s, { useCallback as c, useEffect as l, useMemo as u, useRef as d, useState as f } from "react";
import { jsx as p, jsxs as m } from "react/jsx-runtime";
//#region src/client/utils/rowLinkUtils.ts
var h = /\{([A-Za-z0-9_]+\.[A-Za-z0-9_]+)\}/g, g = /* @__PURE__ */ new Set(["http:", "https:"]);
function _(e, t, n = y()) {
	if (!e) return null;
	let r = !1, i = e.replace(h, (e, n) => {
		let i = t[n];
		return i == null ? (r = !0, "") : encodeURIComponent(String(i));
	});
	return r ? null : v(i, n) ? i : null;
}
function v(e, t = y()) {
	let n = e.trim();
	if (n === "" || /[\u0000-\u001F\u007F]/.test(n) || n.includes("\\") || n.startsWith("//")) return !1;
	try {
		let e = new URL(n, t);
		return !(!g.has(e.protocol) || !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(n) && e.origin !== new URL(t).origin);
	} catch {
		return !1;
	}
}
function y() {
	return typeof window < "u" && window.location?.origin ? window.location.origin : "http://localhost";
}
//#endregion
//#region src/client/utils/recordsTableUtils.ts
var b = "dc-records-table-column-widths", x = "dc-records-table-column-order";
function S(e) {
	return [...e].sort().join("|");
}
function C(e) {
	try {
		let t = localStorage.getItem(b);
		return t ? JSON.parse(t)[e] ?? {} : {};
	} catch {
		return {};
	}
}
function w(e, t) {
	try {
		let n = localStorage.getItem(b), r = n ? JSON.parse(n) : {};
		r[e] = t, localStorage.setItem(b, JSON.stringify(r));
	} catch {}
}
function T(e) {
	try {
		let t = localStorage.getItem(x);
		if (!t) return [];
		let n = JSON.parse(t)[e];
		return Array.isArray(n) ? n : [];
	} catch {
		return [];
	}
}
function E(e, t) {
	try {
		let n = localStorage.getItem(x), r = n ? JSON.parse(n) : {};
		r[e] = t, localStorage.setItem(x, JSON.stringify(r));
	} catch {}
}
function D(e, t) {
	if (t.length === 0) return e;
	let n = new Set(e), r = t.filter((e) => n.has(e)), i = e.filter((e) => !r.includes(e));
	return [...r, ...i];
}
function O(e, t, n) {
	let r = e.indexOf(t), i = e.indexOf(n);
	if (r === -1 || i === -1 || r === i) return e;
	let a = [...e];
	return a.splice(r, 1), a.splice(i, 0, t), a;
}
var k = {
	kind: "text",
	text: ""
};
function A(e, t) {
	return W(e) ? k : (j[t?.kind ?? "text"] ?? M)(e, t);
}
var j = {
	text: M,
	number: N,
	date: P,
	badge: I,
	progress: R
};
function M(e) {
	return {
		kind: "text",
		text: B(e)
	};
}
function N(e, t) {
	let n = V(e);
	return n === null ? {
		kind: "text",
		text: String(e)
	} : {
		kind: "text",
		text: a(n, t?.numberFormat ?? {})
	};
}
function P(e, t) {
	return {
		kind: "text",
		text: r(e, t?.dateGranularity)
	};
}
function F(e) {
	return Array.isArray(e?.badgeColors) ? e.badgeColors.filter((e) => e && typeof e.colorIndex == "number") : [];
}
function I(e, t) {
	let n = B(e);
	return {
		kind: "badge",
		text: n,
		colorIndex: F(t)?.find((e) => e.value === n)?.colorIndex
	};
}
var L = {
	unit: "number",
	abbreviate: !1,
	decimals: 0
};
function R(e, t) {
	let n = V(e);
	return n === null ? {
		kind: "text",
		text: String(e)
	} : {
		kind: "progress",
		fraction: z(n, t),
		style: t?.progressStyle ?? "bar",
		text: a(n, t?.numberFormat ?? L)
	};
}
function z(e, t) {
	let n = t?.progressMin ?? 0, r = (t?.progressMax ?? 100) - n;
	return r === 0 ? 1 : H((e - n) / r, 0, 1);
}
function B(e) {
	return typeof e == "boolean" ? e ? "true" : "false" : typeof e == "number" ? e.toLocaleString() : e instanceof Date ? e.toISOString() : String(e);
}
function V(e) {
	if (typeof e == "number") return Number.isFinite(e) ? e : null;
	if (typeof e == "string" && e.trim() !== "") {
		let t = Number(e);
		return Number.isFinite(t) ? t : null;
	}
	return null;
}
function H(e, t, n) {
	return Math.min(n, Math.max(t, e));
}
function U(e, t, n) {
	let r = n === "asc" ? 1 : -1;
	return [...e].sort((e, n) => {
		let i = W(e[t]), a = W(n[t]);
		return i || a ? i && a ? 0 : i ? 1 : -1 : r * G(e[t], n[t]);
	});
}
function W(e) {
	return e == null || e === "";
}
function G(e, t) {
	let n = V(e), r = V(t);
	return n !== null && r !== null ? n - r : String(e).localeCompare(String(t));
}
function ee(e) {
	let { rows: t, chartConfig: n, queryObject: r } = e, i = u(() => K(t, n, r), [
		t,
		n,
		r
	]), a = u(() => S(i), [i]), [o, s] = f([]);
	l(() => {
		s(T(a));
	}, [a]);
	let p = u(() => D(i, o), [i, o]), [m, h] = f(null), g = d(!1), _ = c((e) => {
		g.current = !0, h(e);
	}, []), v = c(() => {
		h(null), requestAnimationFrame(() => {
			g.current = !1;
		});
	}, []);
	return {
		columns: p,
		storageKey: a,
		draggedColumn: m,
		didDragRef: g,
		startColumnDrag: _,
		endColumnDrag: v,
		dropColumn: c((e) => {
			let t = m;
			if (v(), !t || t === e) return;
			let n = O(p, t, e);
			s(n), E(a, n);
		}, [
			p,
			m,
			v,
			a
		])
	};
}
function K(t, n, r) {
	let i = Object.keys(t[0] ?? {}), a = new Set(n?.hiddenColumns ?? []), o = n?.columns?.filter((e) => i.includes(e));
	if (o && o.length > 0) return o.filter((e) => !a.has(e));
	let s = e(r).filter((e) => i.includes(e));
	return (s.length > 0 ? [...s, ...i.filter((e) => !s.includes(e))] : i).filter((e) => !a.has(e));
}
function te(e) {
	let { columns: t, storageKey: n, authored: r } = e, [i, a] = f({}), o = d(null), s = d(!1);
	l(() => {
		a({
			...r ?? {},
			...C(n)
		});
	}, [n, r]);
	let u = c((e, r) => {
		e.preventDefault(), e.stopPropagation();
		let i = e.clientX;
		s.current = !1;
		let c = {};
		o.current?.querySelectorAll("thead th").forEach((e, n) => {
			let r = t[n];
			r && (c[r] = e.getBoundingClientRect().width);
		});
		let l = c[r] ?? 160, u = c, d = (e) => {
			let t = e.clientX - i;
			Math.abs(t) > 2 && (s.current = !0), u = {
				...u,
				[r]: Math.max(60, l + t)
			}, a(u);
		}, f = () => {
			document.removeEventListener("mousemove", d), document.removeEventListener("mouseup", f), document.body.style.cursor = "", document.body.style.userSelect = "", w(n, u), requestAnimationFrame(() => {
				s.current = !1;
			});
		};
		document.addEventListener("mousemove", d), document.addEventListener("mouseup", f), document.body.style.cursor = "col-resize", document.body.style.userSelect = "none";
	}, [t, n]);
	return {
		columnWidths: i,
		totalWidth: Object.keys(i).length > 0 ? t.reduce((e, t) => e + (i[t] ?? 160), 0) : void 0,
		tableRef: o,
		didResizeRef: s,
		startResize: u
	};
}
function ne(e) {
	let { rows: t, pagination: n, authoredPageSize: r } = e, [i, a] = f(null), [o, s] = f(0), d = !!n, p = n ? n.sort ?? null : i, m = c((e) => {
		if (n) {
			n.toggleSort(e);
			return;
		}
		a((t) => t?.column === e ? t.direction === "asc" ? {
			column: e,
			direction: "desc"
		} : null : {
			column: e,
			direction: "asc"
		});
	}, [n]), h = u(() => !d && i ? U(t, i.column, i.direction) : t, [
		t,
		d,
		i
	]), g = n?.pageSize ?? r ?? 25, _ = n?.page ?? o, v = d ? n?.total ?? _ * g + h.length : h.length, y = Math.max(1, Math.ceil(v / g)), b = c((e) => {
		n ? n.setPage(e) : s(e);
	}, [n]);
	return l(() => {
		d || s((e) => Math.min(e, y - 1));
	}, [y, d]), {
		sort: p,
		toggleSort: m,
		visibleRows: u(() => d ? h : h.slice(_ * g, _ * g + g), [
			h,
			d,
			_,
			g
		]),
		page: _,
		pageSize: g,
		pageCount: y,
		rowCount: v,
		goToPage: b,
		showPager: v > g
	};
}
//#endregion
//#region src/client/components/charts/RecordsTable.tsx
var q = t("chevronUp"), re = t("chevronDown"), ie = s.memo(function({ data: e, chartConfig: t, displayConfig: r = {}, queryObject: a, colorPalette: s, height: l = 300, onDataPointClick: d, drillEnabled: f, pagination: h }) {
	let { t: g } = i(), { getFieldLabel: v } = n(), y = u(() => Array.isArray(e) ? e : [], [e]), b = r.columnFormats ?? {}, { columns: x, storageKey: S, draggedColumn: C, didDragRef: w, startColumnDrag: T, endColumnDrag: E, dropColumn: D } = ee({
		rows: y,
		chartConfig: t,
		queryObject: a
	}), { columnWidths: O, totalWidth: k, tableRef: A, didResizeRef: j, startResize: M } = te({
		columns: x,
		storageKey: S,
		authored: r.columnWidths
	}), { sort: N, toggleSort: P, visibleRows: F, page: I, pageSize: L, pageCount: R, rowCount: z, goToPage: B, showPager: V } = ne({
		rows: y,
		pagination: h,
		authoredPageSize: r.pageSize
	}), H = c((e) => {
		j.current || w.current || P(e);
	}, [
		w,
		j,
		P
	]), U = r.rowLink, W = !!(!U && f && d), G = c((e, t, n) => {
		W && d?.({
			dataPoint: e,
			clickedField: t,
			xValue: e[t],
			position: {
				x: n.clientX,
				y: n.clientY
			},
			nativeEvent: n
		});
	}, [d, W]);
	if (y.length === 0) return /* @__PURE__ */ p(o, {
		height: l,
		hint: g("chart.runtime.noDataHint.table")
	});
	if (x.length === 0) return /* @__PURE__ */ p(o, {
		height: l,
		titleKey: "chart.runtime.recordsTable.noColumns",
		hint: g("chart.runtime.table.invalidStructure")
	});
	let K = I * L + 1, q = Math.min(z, I * L + F.length);
	return /* @__PURE__ */ m("div", {
		className: "dc:flex dc:flex-col dc:w-full",
		style: { height: l },
		children: [/* @__PURE__ */ p("div", {
			className: "dc:flex-1 dc:overflow-auto",
			children: /* @__PURE__ */ m("table", {
				ref: A,
				className: "dc:border-collapse",
				style: {
					tableLayout: "fixed",
					width: k,
					minWidth: "100%"
				},
				children: [
					/* @__PURE__ */ p("colgroup", { children: x.map((e) => /* @__PURE__ */ p("col", { style: { width: O[e] ?? 160 } }, e)) }),
					/* @__PURE__ */ p("thead", {
						className: "bg-dc-surface-secondary dc:sticky dc:top-0 dc:z-20",
						children: /* @__PURE__ */ p("tr", { children: x.map((e) => /* @__PURE__ */ p(ae, {
							column: e,
							label: b[e]?.label || v(e),
							align: b[e]?.align ?? J(b[e]),
							sortDirection: N?.column === e ? N.direction : void 0,
							isDropTarget: C !== null && C !== e,
							onClick: H,
							onResizeStart: M,
							onDragStart: T,
							onDragEnd: E,
							onDrop: D
						}, e)) })
					}),
					/* @__PURE__ */ p("tbody", {
						className: "bg-dc-surface",
						children: F.map((e, t) => /* @__PURE__ */ p(oe, {
							row: e,
							columns: x,
							columnFormats: b,
							colorPalette: s,
							href: U ? _(U.urlTemplate, e) : null,
							target: U?.target,
							clickable: W,
							onCellClick: G
						}, t))
					})
				]
			})
		}), V && /* @__PURE__ */ m("div", {
			className: "dc:flex dc:items-center dc:justify-between dc:gap-2 dc:px-3 dc:py-1.5 dc:border-t border-dc-border dc:text-xs text-dc-text-secondary",
			children: [/* @__PURE__ */ p("span", { children: g("chart.runtime.recordsTable.rowRange", {
				from: K,
				to: q,
				total: z
			}) }), /* @__PURE__ */ m("div", {
				className: "dc:flex dc:items-center dc:gap-1",
				children: [
					/* @__PURE__ */ p($, {
						label: g("chart.runtime.recordsTable.previousPage"),
						disabled: I === 0,
						onClick: () => B(Math.max(0, I - 1)),
						children: "‹"
					}),
					/* @__PURE__ */ p("span", { children: g("chart.runtime.recordsTable.pageOf", {
						page: I + 1,
						pages: R
					}) }),
					/* @__PURE__ */ p($, {
						label: g("chart.runtime.recordsTable.nextPage"),
						disabled: I >= R - 1,
						onClick: () => B(Math.min(R - 1, I + 1)),
						children: "›"
					})
				]
			})]
		})]
	});
});
function J(e) {
	return e?.kind === "number" ? "right" : "left";
}
function ae({ column: e, label: t, align: n, sortDirection: r, isDropTarget: i, onClick: a, onResizeStart: o, onDragStart: s, onDragEnd: c, onDrop: l }) {
	return /* @__PURE__ */ m("th", {
		draggable: !0,
		onDragStart: (t) => {
			t.dataTransfer.setData("text/plain", e), t.dataTransfer.effectAllowed = "move", s(e);
		},
		onDragOver: (e) => {
			i && e.preventDefault();
		},
		onDrop: (t) => {
			t.preventDefault(), l(e);
		},
		onDragEnd: c,
		onClick: () => a(e),
		className: `dc:relative dc:px-3 dc:py-2 dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider dc:cursor-pointer dc:select-none dc:border-b border-dc-border ${n === "right" ? "dc:text-right" : "dc:text-left"}${i ? " dc:border-l-2 border-dc-accent" : ""}`,
		children: [/* @__PURE__ */ m("div", {
			className: `dc:flex dc:items-center dc:gap-1.5 dc:overflow-hidden${n === "right" ? " dc:justify-end" : ""}`,
			children: [
				/* @__PURE__ */ p("span", {
					className: "dc:truncate",
					children: t
				}),
				r === "asc" && /* @__PURE__ */ p(q, { className: "dc:w-3 dc:h-3 text-dc-accent dc:shrink-0" }),
				r === "desc" && /* @__PURE__ */ p(re, { className: "dc:w-3 dc:h-3 text-dc-accent dc:shrink-0" })
			]
		}), /* @__PURE__ */ p("div", {
			onMouseDown: (t) => o(t, e),
			className: "dc:absolute dc:top-0 dc:right-0 dc:w-1.5 dc:h-full dc:cursor-col-resize dc:hover:bg-dc-accent dc:opacity-0 dc:hover:opacity-100 dc:transition-opacity dc:z-30"
		})]
	});
}
function oe({ row: e, columns: t, columnFormats: n, colorPalette: r, href: i, target: a, clickable: o, onCellClick: s }) {
	return /* @__PURE__ */ p("tr", {
		className: `dc:border-b border-dc-border hover:bg-dc-surface-secondary${o ? " dc:cursor-pointer" : ""}`,
		children: t.map((t) => {
			let o = n[t], c = o?.align ?? J(o);
			return /* @__PURE__ */ p("td", {
				onClick: (n) => s(e, t, n),
				className: `dc:px-3 dc:py-1.5 dc:text-sm text-dc-text dc:overflow-hidden${c === "right" ? " dc:text-right dc:tabular-nums" : ""}`,
				children: /* @__PURE__ */ p(se, {
					cell: A(e[t], o),
					colorPalette: r,
					href: i,
					target: a
				})
			}, t);
		})
	});
}
function se({ cell: e, colorPalette: t, href: n, target: r }) {
	let i = /* @__PURE__ */ p(ce, {
		cell: e,
		colorPalette: t
	});
	return n ? /* @__PURE__ */ p("a", {
		href: n,
		target: r === "blank" ? "_blank" : void 0,
		rel: r === "blank" ? "noopener noreferrer" : void 0,
		className: "dc:block dc:no-underline dc:text-inherit hover:dc:underline",
		children: i
	}) : i;
}
function ce({ cell: e, colorPalette: t }) {
	if (e.kind === "badge") {
		let n = e.colorIndex === void 0 ? void 0 : t?.colors[e.colorIndex];
		return /* @__PURE__ */ p("span", {
			className: "dc:inline-block dc:px-2 dc:py-0.5 dc:rounded-full dc:text-xs dc:font-medium dc:truncate dc:max-w-full",
			style: n ? {
				backgroundColor: `${n}22`,
				color: n,
				border: `1px solid ${n}55`
			} : {
				backgroundColor: "var(--dc-surface-secondary)",
				color: "var(--dc-text-secondary)",
				border: "1px solid var(--dc-border)"
			},
			children: e.text
		});
	}
	return e.kind === "progress" ? /* @__PURE__ */ m("div", {
		className: "dc:flex dc:items-center dc:gap-2",
		children: [e.style === "circle" ? /* @__PURE__ */ p(le, {
			fraction: e.fraction,
			label: e.text
		}) : /* @__PURE__ */ p("div", {
			className: "dc:flex-1 dc:h-2 dc:rounded-full dc:overflow-hidden dc:border border-dc-border bg-dc-surface-secondary dc:min-w-[2rem]",
			children: /* @__PURE__ */ p("div", {
				className: "dc:h-full dc:rounded-full bg-dc-primary",
				style: { width: `${e.fraction * 100}%` }
			})
		}), /* @__PURE__ */ p("span", {
			className: "dc:w-16 dc:shrink-0 dc:text-right dc:text-xs dc:tabular-nums dc:truncate",
			children: e.text
		})]
	}) : /* @__PURE__ */ p("span", {
		className: "dc:truncate dc:block",
		children: e.text
	});
}
var Y = 18, X = 3, Z = Y / 2, Q = Z - X / 2;
function le({ fraction: e, label: t }) {
	return /* @__PURE__ */ m("svg", {
		role: "img",
		"aria-label": t,
		width: Y,
		height: Y,
		viewBox: `0 0 ${Y} ${Y}`,
		className: "dc:shrink-0",
		children: [/* @__PURE__ */ p("circle", {
			cx: Z,
			cy: Z,
			r: Q,
			fill: "none",
			stroke: "var(--dc-surface-secondary)",
			strokeWidth: X
		}), e > 0 && /* @__PURE__ */ p("circle", {
			cx: Z,
			cy: Z,
			r: Q,
			fill: "none",
			stroke: "var(--dc-primary)",
			strokeWidth: X,
			strokeLinecap: "round",
			pathLength: 100,
			strokeDasharray: 100,
			strokeDashoffset: 100 - e * 100,
			transform: `rotate(-90 ${Z} ${Z})`
		})]
	});
}
function $({ label: e, disabled: t, onClick: n, children: r }) {
	return /* @__PURE__ */ p("button", {
		type: "button",
		"aria-label": e,
		title: e,
		disabled: t,
		onClick: n,
		className: "dc:px-2 dc:py-0.5 dc:border border-dc-border dc:rounded-sm bg-dc-surface text-dc-text hover:bg-dc-surface-secondary dc:disabled:opacity-40 dc:disabled:cursor-not-allowed",
		children: r
	});
}
//#endregion
export { ie as default };

//# sourceMappingURL=RecordsTable-DRmTjRzq.js.map