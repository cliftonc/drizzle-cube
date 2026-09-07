import { a as e, n as t, o as n, r, s as i } from "./chunks/vendor-6y3E67du.js";
import { n as a, t as o } from "./chunks/providers-DwQCKdGW.js";
import { A as s, B as c, C as l, D as u, E as d, H as f, L as p, M as m, N as h, P as g, R as _, S as v, T as y, U as b, V as x, _ as S, b as C, c as w, j as T, l as E, s as D, v as O, w as k, x as A, y as j, z as M } from "./chunks/chart-data-table-Bn9EtETl.js";
import { n as N, r as P } from "./chunks/chart-sankey-DDzokqvF.js";
import { $ as F, A as ee, B as I, D as te, E as ne, F as L, G as re, H as ie, I as ae, J as oe, K as se, L as ce, M as le, N as ue, O as de, P as fe, Q as pe, R as me, St as he, U as ge, V as _e, W as ve, X as ye, Y as be, Z as xe, _t as Se, a as Ce, at as we, bt as Te, c as Ee, ct as De, dt as Oe, et as ke, f as Ae, ft as je, gt as Me, h as Ne, ht as Pe, i as Fe, it as Ie, k as Le, lt as Re, m as ze, mt as Be, n as Ve, o as He, ot as Ue, p as We, pt as Ge, q as Ke, r as qe, st as Je, t as Ye, ut as Xe, v as Ze, vt as Qe, w as $e, xt as et, yt as tt, z as nt } from "./chunks/DashboardEditModal-CBdNSTX_.js";
import { S as rt, _ as it, b as at, c as ot, d as st, f as ct, g as lt, h as ut, l as dt, m as ft, o as pt, p as mt, s as ht, v as gt, y as _t } from "./chunks/useDirtyStateTracking-B_jkA-0w.js";
import { B as vt, F as R, S as yt, _ as bt, b as xt, g as St, h as Ct, m as wt, p as Tt, v as Et, x as Dt, y as Ot } from "./chunks/chart-activity-grid-D6X0iOUw.js";
import { a as kt, i as At, n as jt, o as Mt, r as Nt, t as Pt } from "./chunks/useExplainAI-BAJgZbo9.js";
import { a as Ft, c as It, i as Lt, l as Rt, o as zt, r as Bt, s as Vt } from "./chunks/chart-funnel-BwJxhDFk.js";
import { a as Ht, i as Ut, n as Wt, o as Gt, r as Kt, s as qt, t as Jt } from "./chunks/charts-loader-DL6om-E1.js";
import { H as z } from "./chunks/chart-area-95fIdTeM.js";
import { r as Yt } from "./chunks/syntaxHighlighting-Cm43as8i.js";
import { A as Xt, C as Zt, D as Qt, E as $t, F as en, N as tn, O as nn, P as rn, T as an, _ as on, a as sn, b as cn, c as ln, d as un, f as dn, g as fn, h as pn, i as mn, j as hn, k as gn, l as _n, m as vn, n as yn, o as bn, r as xn, s as Sn, t as Cn, u as wn, v as Tn, w as En, x as Dn, y as On } from "./chunks/analysis-builder-shared-n20CH0VA.js";
import { r as kn } from "./chunks/chart-markdown-CRjxC5D7.js";
import { t as An } from "./chunks/useNotebookLayout-Ck3Z3uzg.js";
import { n as jn } from "./chunks/chart-bubble-BrB4XrSS.js";
import { i as Mn, t as Nn } from "./chunks/utils-CToHkuhU.js";
import B, { createContext as Pn, useCallback as V, useContext as Fn, useEffect as H, useMemo as U, useRef as W, useState as G } from "react";
import { Fragment as K, jsx as q, jsxs as J } from "react/jsx-runtime";
//#region src/client/stores/notebookStore.tsx
var In = () => ({
	blocks: [],
	messages: [],
	isStreaming: !1,
	sessionId: null,
	inputValue: ""
});
function Ln(e, t) {
	return {
		addBlock: (t) => e((e) => ({ blocks: [...e.blocks, t] })),
		removeBlock: (t) => e((e) => ({ blocks: e.blocks.filter((e) => e.id !== t) })),
		moveBlock: (t, n) => e((e) => {
			let r = e.blocks.findIndex((e) => e.id === t);
			if (r === -1 || n === "up" && r === 0 || n === "down" && r === e.blocks.length - 1) return {};
			let i = [...e.blocks], a = n === "up" ? r - 1 : r + 1;
			return [i[r], i[a]] = [i[a], i[r]], { blocks: i };
		}),
		updateBlock: (t, n) => e((e) => ({ blocks: e.blocks.map((e) => e.id === t && e.type === "portlet" ? {
			...e,
			...n
		} : e) })),
		addMessage: (t) => e((e) => ({ messages: [...e.messages, t] })),
		appendToLastAssistantMessage: (t) => e((e) => {
			let n = [...e.messages], r = n[n.length - 1];
			return r && r.role === "assistant" && (n[n.length - 1] = {
				...r,
				content: r.content + t
			}), { messages: n };
		}),
		setLastAssistantError: (t) => e((e) => {
			let n = [...e.messages], r = n[n.length - 1];
			return r && r.role === "assistant" && (n[n.length - 1] = {
				...r,
				error: t
			}), { messages: n };
		}),
		addToolCallToLastAssistant: (t) => e((e) => {
			let n = [...e.messages], r = n[n.length - 1];
			return r && r.role === "assistant" && (n[n.length - 1] = {
				...r,
				toolCalls: [...r.toolCalls || [], t]
			}), { messages: n };
		}),
		updateLastToolCall: (t) => e((e) => {
			let n = [...e.messages], r = n[n.length - 1];
			if (r?.role === "assistant" && r.toolCalls?.length) {
				let e = [...r.toolCalls], i = t.id ? e.findIndex((e) => e.id === t.id) : e.length - 1;
				i !== -1 && (e[i] = {
					...e[i],
					...t
				}, n[n.length - 1] = {
					...r,
					toolCalls: e
				});
			}
			return { messages: n };
		}),
		setIsStreaming: (t) => e({ isStreaming: t }),
		setSessionId: (t) => e({ sessionId: t }),
		setInputValue: (t) => e({ inputValue: t }),
		save: () => {
			let e = t();
			return {
				blocks: e.blocks,
				messages: e.messages
			};
		},
		load: (t) => e({
			blocks: t.blocks || [],
			messages: t.messages || []
		}),
		reset: () => e(In())
	};
}
function Rn() {
	let t = In();
	return i()(r(e((e, n) => ({
		...t,
		...Ln(e, n)
	})), { name: "NotebookStore" }));
}
var zn = Pn(null);
function Bn({ children: e, initialConfig: t }) {
	let n = W(null);
	if (!n.current) {
		let e = Rn();
		t && e.getState().load(t), n.current = e;
	}
	return /* @__PURE__ */ q(zn.Provider, {
		value: n.current,
		children: e
	});
}
function Y(e) {
	let t = Fn(zn);
	if (!t) throw Error("useNotebookStore must be used within NotebookStoreProvider");
	return n(t, e);
}
var Vn = (e) => e.blocks, Hn = (e) => e.messages, Un = (e) => e.isStreaming, Wn = (e) => e.sessionId, Gn = (e) => e.inputValue, Kn = (e) => ({
	messages: e.messages,
	isStreaming: e.isStreaming,
	inputValue: e.inputValue
}), qn = (e) => ({
	addMessage: e.addMessage,
	appendToLastAssistantMessage: e.appendToLastAssistantMessage,
	setLastAssistantError: e.setLastAssistantError,
	addToolCallToLastAssistant: e.addToolCallToLastAssistant,
	updateLastToolCall: e.updateLastToolCall,
	setIsStreaming: e.setIsStreaming,
	setInputValue: e.setInputValue,
	setSessionId: e.setSessionId
}), Jn = (e) => ({
	addBlock: e.addBlock,
	removeBlock: e.removeBlock,
	moveBlock: e.moveBlock,
	updateBlock: e.updateBlock
}), X = {
	width: "16px",
	height: "16px",
	color: "currentColor"
}, Yn = j("chevronUp"), Xn = j("chevronDown"), Zn = j("edit"), Qn = j("delete"), $n = B.memo(function({ block: e, colorPalette: t, onRemove: n, onMoveUp: r, onMoveDown: i, onEdit: a, isFirst: o, isLast: s }) {
	let [c, l] = G(null), u = V((e) => {
		l(e);
	}, []);
	return /* @__PURE__ */ J("div", {
		className: "dc:relative dc:mb-4 bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:flex dc:flex-col",
		children: [/* @__PURE__ */ J("div", {
			className: "dc:flex dc:items-center dc:justify-between dc:px-3 dc:py-1.5 dc:border-b border-dc-border dc:shrink-0 bg-dc-surface-secondary dc:rounded-t-lg",
			children: [/* @__PURE__ */ J("div", {
				className: "dc:flex dc:items-center dc:gap-2 dc:flex-1 dc:min-w-0",
				children: [/* @__PURE__ */ q("h3", {
					className: "dc:font-semibold dc:text-sm text-dc-text dc:truncate",
					children: e.title || "Untitled"
				}), c && /* @__PURE__ */ q(ee, {
					chartConfig: c.chartConfig,
					displayConfig: c.displayConfig,
					queryObject: c.queryObject,
					data: c.data,
					chartType: c.chartType,
					cacheInfo: c.cacheInfo ?? void 0
				})]
			}), /* @__PURE__ */ J("div", {
				className: "dc:flex dc:items-center dc:gap-1 dc:shrink-0 dc:ml-4 dc:-mr-2",
				children: [
					!o && /* @__PURE__ */ q("button", {
						onClick: () => r(e.id),
						className: "dc:p-1 dc:bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer dc:hover:bg-dc-surface-hover dc:transition-colors",
						title: "Move up",
						children: /* @__PURE__ */ q(Yn, { style: X })
					}),
					!s && /* @__PURE__ */ q("button", {
						onClick: () => i(e.id),
						className: "dc:p-1 dc:bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer dc:hover:bg-dc-surface-hover dc:transition-colors",
						title: "Move down",
						children: /* @__PURE__ */ q(Xn, { style: X })
					}),
					/* @__PURE__ */ q("button", {
						onClick: () => a(e),
						className: "dc:p-1 dc:bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer dc:hover:bg-dc-surface-hover dc:transition-colors",
						title: "Edit visualization",
						children: /* @__PURE__ */ q(Zn, { style: X })
					}),
					/* @__PURE__ */ q("button", {
						onClick: () => n(e.id),
						className: "dc:p-1 dc:mr-0.5 dc:bg-transparent dc:border-none dc:rounded-sm dc:cursor-pointer dc:hover:bg-dc-danger-bg text-dc-danger dc:transition-colors",
						title: "Remove",
						children: /* @__PURE__ */ q(Qn, { style: X })
					})
				]
			})]
		}), /* @__PURE__ */ q("div", {
			className: "dc:flex-1 dc:min-h-0",
			children: /* @__PURE__ */ q(ye, {
				query: e.query,
				chartType: e.chartType,
				chartConfig: e.chartConfig,
				displayConfig: e.displayConfig,
				colorPalette: t,
				height: 400,
				eagerLoad: !0,
				onDebugDataReady: u
			})
		})]
	});
});
//#endregion
//#region src/client/components/markdownOverrides.tsx
function er({ children: e, ...t }) {
	return /* @__PURE__ */ q("div", {
		className: "dc:overflow-x-auto dc:my-2",
		children: /* @__PURE__ */ q("table", {
			...t,
			children: e
		})
	});
}
var tr = {
	code: { props: { className: "dc:px-1 dc:py-0.5 dc:rounded-sm dc:text-xs bg-dc-surface-secondary text-dc-accent dc:font-mono" } },
	pre: { props: { className: "dc:rounded-lg dc:p-3 dc:my-2 dc:overflow-x-auto dc:text-xs bg-dc-surface-secondary text-dc-text dc:font-mono" } },
	a: { props: {
		className: "text-dc-accent dc:hover:underline",
		target: "_blank",
		rel: "noopener noreferrer"
	} },
	table: {
		component: er,
		props: { className: "dc:w-full dc:border-collapse dc:text-sm" }
	},
	thead: { props: { className: "bg-dc-surface-secondary" } },
	th: { props: { className: "dc:px-3 dc:py-2 dc:text-left dc:font-semibold dc:text-xs text-dc-text-secondary dc:uppercase dc:tracking-wider border-dc-border dc:border-b" } },
	td: { props: { className: "dc:px-3 dc:py-2 dc:text-sm text-dc-text border-dc-border dc:border-b" } },
	tr: { props: { className: "dc:hover:opacity-80" } }
}, nr = { overrides: {
	h1: { props: { className: "dc:text-lg dc:font-bold text-dc-text dc:mb-2 dc:mt-3" } },
	h2: { props: { className: "dc:text-base dc:font-semibold text-dc-text dc:mb-2 dc:mt-3" } },
	h3: { props: { className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-2 dc:mt-3" } },
	p: { props: { className: "dc:text-sm dc:leading-relaxed text-dc-text dc:mb-2" } },
	strong: { props: { className: "dc:font-semibold" } },
	ul: { props: { className: "dc:list-disc dc:ml-5 dc:mb-2 dc:text-sm text-dc-text dc:space-y-1" } },
	ol: { props: { className: "dc:list-decimal dc:ml-5 dc:mb-2 dc:text-sm text-dc-text dc:space-y-1" } },
	li: { props: { className: "dc:text-sm text-dc-text" } },
	hr: { props: { className: "dc:my-3 border-dc-border" } },
	blockquote: { props: { className: "dc:border-l-4 border-dc-accent dc:pl-3 dc:my-2 dc:italic text-dc-text-secondary dc:text-sm" } },
	...tr
} }, rr = { overrides: {
	h1: { props: { className: "dc:font-semibold text-dc-text dc:mt-2 dc:mb-1 dc:first:mt-0" } },
	h2: { props: { className: "dc:font-semibold text-dc-text dc:mt-2 dc:mb-1 dc:first:mt-0" } },
	h3: { props: { className: "dc:font-semibold text-dc-text dc:mt-2 dc:mb-1 dc:first:mt-0" } },
	p: { props: { className: "dc:leading-snug dc:mb-1.5 dc:last:mb-0" } },
	strong: { props: { className: "dc:font-semibold" } },
	ul: { props: { className: "dc:list-disc dc:ml-4 dc:mb-1.5 dc:last:mb-0 dc:space-y-0.5" } },
	ol: { props: { className: "dc:list-decimal dc:ml-4 dc:mb-1.5 dc:last:mb-0 dc:space-y-0.5" } },
	li: { props: { className: "dc:leading-snug" } },
	hr: { props: { className: "dc:my-2 border-dc-border" } },
	blockquote: { props: { className: "dc:border-l-2 border-dc-accent dc:pl-2 dc:my-1.5 dc:italic text-dc-text-secondary" } },
	...tr
} }, Z = {
	width: "16px",
	height: "16px",
	color: "currentColor"
}, ir = j("documentText"), ar = j("chevronUp"), or = j("chevronDown"), sr = j("delete"), cr = B.memo(function({ block: e, onRemove: t, onMoveUp: n, onMoveDown: r, isFirst: i, isLast: a }) {
	return /* @__PURE__ */ J("div", {
		className: "dc:relative dc:mb-4 bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:flex dc:flex-col",
		children: [/* @__PURE__ */ J("div", {
			className: "dc:flex dc:items-center dc:justify-between dc:px-3 dc:py-1.5 dc:border-b border-dc-border dc:shrink-0 bg-dc-surface-secondary dc:rounded-t-lg",
			children: [/* @__PURE__ */ J("div", {
				className: "dc:flex dc:items-center dc:gap-2 dc:flex-1 dc:min-w-0",
				children: [/* @__PURE__ */ q(ir, { style: Z }), /* @__PURE__ */ q("h3", {
					className: "dc:font-semibold dc:text-sm text-dc-text dc:truncate",
					children: e.title || "Markdown"
				})]
			}), /* @__PURE__ */ J("div", {
				className: "dc:flex dc:items-center dc:gap-1 dc:shrink-0 dc:ml-4 dc:-mr-2",
				children: [
					!i && /* @__PURE__ */ q("button", {
						onClick: () => n(e.id),
						className: "dc:p-1 dc:bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer dc:hover:bg-dc-surface-hover dc:transition-colors",
						title: "Move up",
						children: /* @__PURE__ */ q(ar, { style: Z })
					}),
					!a && /* @__PURE__ */ q("button", {
						onClick: () => r(e.id),
						className: "dc:p-1 dc:bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer dc:hover:bg-dc-surface-hover dc:transition-colors",
						title: "Move down",
						children: /* @__PURE__ */ q(or, { style: Z })
					}),
					/* @__PURE__ */ q("button", {
						onClick: () => t(e.id),
						className: "dc:p-1 dc:mr-0.5 dc:bg-transparent dc:border-none dc:rounded-sm dc:cursor-pointer dc:hover:bg-dc-danger-bg text-dc-danger dc:transition-colors",
						title: "Remove",
						children: /* @__PURE__ */ q(sr, { style: Z })
					})
				]
			})]
		}), /* @__PURE__ */ q("div", {
			className: "dc:p-4 dc:min-w-0 dc:overflow-hidden",
			children: /* @__PURE__ */ q(kn, {
				options: nr,
				children: e.content
			})
		})]
	});
});
//#endregion
//#region src/client/components/AgenticNotebook/NotebookCanvas.tsx
function lr(e) {
	let { analysisConfig: t } = Ie(e);
	if (!t) return null;
	let n = t.charts[t.analysisType];
	return {
		title: e.title,
		query: JSON.stringify(t.query),
		chartType: n?.chartType || "bar",
		chartConfig: n?.chartConfig,
		displayConfig: n?.displayConfig
	};
}
var ur = B.memo(function({ colorPalette: e }) {
	let { t: n } = R(), r = e ?? ne(), i = Y(Vn), { removeBlock: a, moveBlock: o, updateBlock: s } = Y(t(Jn)), c = W(null), [l, u] = G(null), d = W(i.length);
	H(() => {
		i.length > d.current && c.current?.scrollIntoView({ behavior: "smooth" }), d.current = i.length;
	}, [i.length]);
	let f = V((e) => a(e), [a]), p = V((e) => o(e, "up"), [o]), m = V((e) => o(e, "down"), [o]), h = V((e) => u(e), []), g = V((e) => {
		if (!l) return;
		let t = lr(e);
		t && s(l.id, t), u(null);
	}, [l, s]);
	return i.length === 0 ? /* @__PURE__ */ q("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:h-full",
		children: /* @__PURE__ */ J("div", {
			className: "dc:text-center dc:max-w-sm dc:px-6",
			children: [/* @__PURE__ */ q("h3", {
				className: "dc:text-base dc:font-semibold text-dc-text dc:mb-2",
				children: n("notebook.canvas.emptyTitle")
			}), /* @__PURE__ */ q("p", {
				className: "dc:text-sm text-dc-text-secondary",
				children: n("notebook.canvas.emptyDescription")
			})]
		})
	}) : /* @__PURE__ */ J("div", {
		className: "dc:h-full dc:overflow-y-auto dc:p-4",
		children: [
			i.map((e, t) => {
				let n = t === 0, a = t === i.length - 1;
				return e.type === "portlet" ? /* @__PURE__ */ q($n, {
					block: e,
					colorPalette: r,
					onRemove: f,
					onMoveUp: p,
					onMoveDown: m,
					onEdit: h,
					isFirst: n,
					isLast: a
				}, e.id) : e.type === "markdown" ? /* @__PURE__ */ q(cr, {
					block: e,
					onRemove: f,
					onMoveUp: p,
					onMoveDown: m,
					isFirst: n,
					isLast: a
				}, e.id) : null;
			}),
			/* @__PURE__ */ q("div", { ref: c }),
			/* @__PURE__ */ q(Ee, {
				isOpen: !!l,
				onClose: () => u(null),
				onSave: g,
				colorPalette: r,
				portlet: l ? {
					id: l.id,
					title: l.title,
					query: l.query,
					chartType: l.chartType,
					chartConfig: l.chartConfig,
					displayConfig: l.displayConfig,
					w: 5,
					h: 4,
					x: 0,
					y: 0
				} : null,
				title: n("notebook.canvas.editVisualization"),
				submitText: n("notebook.canvas.update")
			})
		]
	});
}), dr = {
	discover_cubes: "Discovering cubes",
	get_cube_metadata: "Reading metadata",
	execute_query: "Executing query",
	add_portlet: "Adding visualization",
	add_markdown: "Adding explanation"
};
function fr(e, t, n) {
	return e ? "bg-dc-accent text-dc-accent-text dc:rounded-br-sm" : t && !n ? "bg-dc-warning-bg text-dc-text dc:rounded-bl-sm" : "bg-dc-surface-secondary text-dc-text dc:rounded-bl-sm";
}
function pr({ toolCall: e, loadingComponent: t }) {
	return e.status === "running" ? t ? /* @__PURE__ */ q("span", {
		className: "dc:inline-flex dc:items-center dc:justify-center dc:h-3 dc:w-3",
		children: t
	}) : /* @__PURE__ */ q(z, { size: "xs" }) : /* @__PURE__ */ q("span", {
		className: "dc:text-xs",
		children: e.status === "error" ? "✗" : "✓"
	});
}
function mr(e) {
	return typeof e == "string" ? e : JSON.stringify(e, null, 2);
}
function hr({ result: e }) {
	return e == null ? null : /* @__PURE__ */ q("pre", {
		className: "dc:mt-1 dc:p-2 dc:rounded-sm dc:text-[11px] dc:overflow-x-auto dc:max-h-32 dc:overflow-y-auto bg-dc-surface-secondary text-dc-text-secondary",
		children: mr(e)
	});
}
function gr({ toolCall: e, loadingComponent: t }) {
	let [n, r] = G(!1), i = dr[e.name] || e.name, a = e.status === "running";
	return /* @__PURE__ */ J("div", {
		className: "dc:my-1 dc:text-xs",
		children: [/* @__PURE__ */ J("button", {
			onClick: () => r(!n),
			className: "dc:flex dc:items-center dc:gap-1.5 text-dc-text-secondary dc:hover:opacity-80 dc:transition-opacity",
			children: [
				/* @__PURE__ */ q(pr, {
					toolCall: e,
					loadingComponent: t
				}),
				/* @__PURE__ */ J("span", { children: [i, a ? "..." : ""] }),
				!a && /* @__PURE__ */ q("span", {
					className: "dc:text-[10px] dc:opacity-60",
					children: n ? "▲" : "▼"
				})
			]
		}), n && /* @__PURE__ */ q(hr, { result: e.result })]
	});
}
function _r({ error: e, hasContent: t }) {
	return /* @__PURE__ */ J("div", {
		className: `dc:flex dc:items-start dc:gap-2 ${t ? "dc:mt-2 dc:pt-2 dc:border-t dc:border-current dc:border-opacity-10" : ""}`,
		children: [/* @__PURE__ */ q("span", {
			className: "dc:text-base dc:leading-none dc:mt-0.5 text-dc-warning dc:flex-shrink-0",
			children: "⚠"
		}), /* @__PURE__ */ q("span", {
			className: "text-dc-text-secondary",
			children: e
		})]
	});
}
function vr(e) {
	let t = e.role === "user", n = !!e.content?.trim(), r = !!e.error, i = e.toolCalls ?? [], a = i.length > 0;
	return {
		isUser: t,
		hasContent: n,
		hasError: r,
		hasToolCalls: a,
		toolCalls: i,
		shouldRender: t || n || r || a
	};
}
function yr({ message: e, flags: t, loadingComponent: n }) {
	let { isUser: r, hasContent: i, hasError: a, hasToolCalls: o, toolCalls: s } = t;
	return /* @__PURE__ */ J(K, { children: [
		i && (r ? /* @__PURE__ */ q("div", {
			className: "dc:whitespace-pre-wrap dc:break-words",
			children: e.content
		}) : /* @__PURE__ */ q("div", {
			className: "dc:break-words dc:min-w-0",
			children: /* @__PURE__ */ q(kn, {
				options: rr,
				children: e.content
			})
		})),
		a && /* @__PURE__ */ q(_r, {
			error: e.error,
			hasContent: i
		}),
		o && /* @__PURE__ */ q(br, {
			toolCalls: s,
			loadingComponent: n,
			separated: i || a
		})
	] });
}
function br({ toolCalls: e, loadingComponent: t, separated: n }) {
	return /* @__PURE__ */ q("div", {
		className: n ? "dc:mt-1 dc:border-t dc:border-current dc:border-opacity-10 dc:pt-1" : "",
		children: e.map((e, n) => /* @__PURE__ */ q(gr, {
			toolCall: e,
			loadingComponent: t
		}, e.id || n))
	});
}
//#endregion
//#region src/client/components/AgenticNotebook/ChatMessage.tsx
var xr = { animation: "dc-msg-in 100ms ease-out" }, Sr = B.memo(function({ message: e, loadingComponent: t }) {
	let n = vr(e);
	if (!n.shouldRender) return null;
	let { isUser: r, hasContent: i, hasError: a } = n;
	return /* @__PURE__ */ q("div", {
		className: `dc:flex dc:mb-3 ${r ? "dc:justify-end" : "dc:justify-start"}`,
		style: xr,
		children: /* @__PURE__ */ q("div", {
			className: `dc:max-w-[85%] dc:rounded-lg dc:px-3 dc:py-2 dc:text-sm ${fr(r, a, i)}`,
			children: /* @__PURE__ */ q(yr, {
				message: e,
				flags: n,
				loadingComponent: t
			})
		})
	});
}), Cr = B.memo(function({ value: e, onChange: t, onSend: n, onStop: r, onContinue: i, isStreaming: a = !1, showContinue: o = !1, disabled: s = !1, placeholder: c }) {
	let { t: l } = R(), u = c ?? l("notebook.chatInput.placeholder"), d = W(null);
	H(() => {
		let e = d.current;
		e && (e.style.height = "auto", e.style.height = `${Math.min(e.scrollHeight, 150)}px`);
	}, [e]);
	let f = V((t) => {
		t.key === "Enter" && !t.shiftKey && (t.preventDefault(), !s && e.trim() && n());
	}, [
		s,
		e,
		n
	]);
	return /* @__PURE__ */ J("div", {
		className: "dc:flex dc:gap-2 dc:items-end dc:p-3 border-dc-border dc:border-t",
		children: [/* @__PURE__ */ q("textarea", {
			ref: d,
			value: e,
			onChange: (e) => t(e.target.value),
			onKeyDown: f,
			placeholder: u,
			disabled: s,
			rows: 1,
			className: "dc:flex-1 dc:resize-none dc:rounded-lg dc:px-3 dc:py-2 dc:text-sm bg-dc-surface-secondary text-dc-text border-dc-border dc:border dc:outline-none dc:focus:ring-1 focus:ring-dc-accent dc:disabled:opacity-50"
		}), a ? /* @__PURE__ */ q("button", {
			onClick: r,
			className: "dc:px-4 dc:py-2 dc:rounded-lg dc:text-sm dc:font-medium dc:transition-colors text-dc-error border-dc-border dc:border dc:hover:opacity-80 dc:shrink-0",
			children: l("notebook.chatInput.stop")
		}) : /* @__PURE__ */ J(K, { children: [o && !e.trim() && /* @__PURE__ */ q("button", {
			onClick: () => {
				i?.(), d.current?.focus();
			},
			className: "dc:px-4 dc:py-2 dc:rounded-lg dc:text-sm dc:font-medium dc:transition-colors border-dc-border dc:border text-dc-text-secondary dc:hover:opacity-80 dc:shrink-0",
			children: l("notebook.chatInput.continue")
		}), /* @__PURE__ */ q("button", {
			onClick: n,
			disabled: s || !e.trim(),
			className: "dc:px-4 dc:py-2 dc:rounded-lg dc:text-sm dc:font-medium dc:transition-colors bg-dc-accent text-dc-accent-text dc:hover:opacity-90 dc:disabled:opacity-40 dc:disabled:cursor-not-allowed dc:shrink-0",
			children: l("notebook.chatInput.send")
		})] })]
	});
});
//#endregion
//#region src/client/hooks/agentChatStream.ts
function wr(e) {
	if (e.startsWith("{") || e.includes("\"type\":\"error\"")) try {
		let t = JSON.parse(e.replace(/^Error:\s*/, ""));
		return {
			overloaded_error: "The AI service is temporarily busy. Please try again in a moment.",
			rate_limit_error: "Too many requests. Please wait a moment and try again.",
			api_error: "The AI service encountered an error. Please try again.",
			authentication_error: "Authentication failed. Please check your configuration."
		}[t.error?.type || t.type || ""] || "The AI service encountered an error. Please try again.";
	} catch {
		return "The AI service encountered an error. Please try again.";
	}
	if (e.startsWith("Agent request failed:")) {
		let t = e.match(/\d+/)?.[0];
		return t === "429" ? "Too many requests. Please wait a moment and try again." : t === "503" || t === "529" ? "The AI service is temporarily busy. Please try again in a moment." : "The AI service is temporarily unavailable. Please try again.";
	}
	return e;
}
function Tr(e, t) {
	switch (e.type) {
		case "text_delta":
			t.onTextDelta(e.data);
			break;
		case "tool_use_start":
			t.onToolStart(e.data.id, e.data.name, e.data.input);
			break;
		case "tool_use_result":
			t.onToolResult(e.data.id, e.data.name, e.data.result, e.data.isError, e.data.input);
			break;
		case "add_portlet":
			t.onAddPortlet({
				...e.data,
				type: "portlet"
			});
			break;
		case "update_portlet":
			t.onUpdatePortlet?.({
				...e.data,
				type: "portlet"
			});
			break;
		case "add_markdown":
			t.onAddMarkdown({
				...e.data,
				type: "markdown"
			});
			break;
		case "dashboard_saved":
			t.onDashboardSaved?.(e.data);
			break;
		case "turn_complete":
			t.onTurnComplete?.();
			break;
		case "done":
			t.onDone(e.data.sessionId, e.data.traceId);
			break;
		case "error": t.onError(e.data.message);
	}
}
function Er(e, t) {
	let n = e.trim().split("\n");
	for (let e of n) if (e.startsWith("data: ")) try {
		t(JSON.parse(e.slice(6)));
	} catch {}
}
function Dr(e) {
	let t = {
		"Content-Type": "application/json",
		...e.baseHeaders
	};
	return e.agentApiKey && (t["X-Agent-Api-Key"] = e.agentApiKey), e.agentProvider && (t["X-Agent-Provider"] = e.agentProvider), e.agentModel && (t["X-Agent-Model"] = e.agentModel), e.agentProviderEndpoint && (t["X-Agent-Provider-Endpoint"] = e.agentProviderEndpoint), t;
}
//#endregion
//#region src/client/hooks/useAgentChat.ts
function Or(e) {
	let { agentEndpoint: t, agentApiKey: n, agentProvider: r, agentModel: i, agentProviderEndpoint: a } = e, { cubeApi: o } = c(), s = W(null), [l, u] = G(!1), d = W(e);
	return d.current = e, {
		sendMessage: V(async (e, c, l) => {
			let f = (e) => Tr(e, d.current);
			s.current && s.current.abort();
			let p = new AbortController();
			s.current = p, u(!0);
			try {
				let s = t || `${o.apiUrl || "/cubejs-api/v1"}/agent/chat`, u = Dr({
					baseHeaders: o.headers,
					agentApiKey: n,
					agentProvider: r,
					agentModel: i,
					agentProviderEndpoint: a
				}), d = await fetch(s, {
					method: "POST",
					headers: u,
					credentials: o.credentials ?? "include",
					body: JSON.stringify({
						message: e,
						...c ? { sessionId: c } : {},
						...l && l.length > 0 ? { history: l } : {}
					}),
					signal: p.signal
				});
				if (!d.ok) {
					let e = await d.json().catch(() => ({}));
					throw Error(e.error || `Agent request failed: ${d.status}`);
				}
				if (!d.body) throw Error("No response body received");
				let m = d.body.getReader(), h = new TextDecoder(), g = "";
				for (;;) {
					let { done: e, value: t } = await m.read();
					if (e) break;
					g += h.decode(t, { stream: !0 });
					let n = g.split("\n\n");
					g = n.pop() || "";
					for (let e of n) Er(e, f);
				}
				g.trim() && Er(g, f);
			} catch (e) {
				if (e.name !== "AbortError") {
					let t = e instanceof Error ? e.message : "Stream failed";
					d.current.onError(wr(t));
				}
			} finally {
				u(!1), s.current = null;
			}
		}, [
			o,
			t,
			n,
			r,
			i,
			a
		]),
		isStreaming: l,
		abort: V(() => {
			s.current && (s.current.abort(), s.current = null, u(!1));
		}, [])
	};
}
//#endregion
//#region src/client/components/AgenticNotebook/useAgentChatController.ts
function kr({ agentEndpoint: e, agentApiKey: n, agentProvider: r, agentModel: i, agentProviderEndpoint: a, onDashboardSaved: o, messages: s, isStreaming: c }) {
	let [l, u] = G(!1), [d, f] = G(null), p = W(!1), { addMessage: m, appendToLastAssistantMessage: h, setLastAssistantError: g, addToolCallToLastAssistant: _, updateLastToolCall: v, setIsStreaming: y, setInputValue: b, setSessionId: x } = Y(t(qn)), S = Y((e) => e.sessionId), C = Y((e) => e.addBlock), w = Y((e) => e.updateBlock), T = W(s);
	T.current = s;
	let E = W(c);
	E.current = c;
	let D = W(S);
	D.current = S;
	let O = V(() => {
		p.current && (p.current = !1, m({
			id: `msg-${Date.now()}`,
			role: "assistant",
			content: "",
			toolCalls: [],
			timestamp: Date.now()
		}));
	}, [m]), { sendMessage: k, abort: A } = Or({
		agentEndpoint: e,
		agentApiKey: n,
		agentProvider: r,
		agentModel: i,
		agentProviderEndpoint: a,
		onTextDelta: V((e) => {
			u(!1), O(), h(e);
		}, [O, h]),
		onToolStart: V((e, t, n) => {
			u(!1), O(), _({
				id: e,
				name: t,
				input: n,
				status: "running"
			});
		}, [O, _]),
		onToolResult: V((e, t, n, r, i) => {
			v({
				id: e,
				status: r ? "error" : "complete",
				result: n,
				...i === void 0 ? {} : { input: i }
			});
		}, [v]),
		onAddPortlet: V((e) => {
			C(e);
		}, [C]),
		onUpdatePortlet: V(({ id: e, ...t }) => {
			w(e, t);
		}, [w]),
		onAddMarkdown: V((e) => {
			C(e);
		}, [C]),
		onDashboardSaved: o,
		onTurnComplete: V(() => {
			p.current = !0, u(!0);
		}, []),
		onDone: V((e, t) => {
			p.current = !1, x(e), y(!1), u(!1), t && f(t);
		}, [x, y]),
		onError: V((e) => {
			u(!1), O(), g(e), y(!1);
		}, [
			O,
			g,
			y
		])
	});
	return {
		doSend: V((e) => {
			if (!e || E.current) return;
			p.current = !1;
			let t = T.current.map((e) => ({
				role: e.role,
				content: e.content,
				...e.toolCalls && e.toolCalls.length > 0 ? { toolCalls: e.toolCalls } : {}
			}));
			m({
				id: `msg-${Date.now()}`,
				role: "user",
				content: e,
				timestamp: Date.now()
			}), m({
				id: `msg-${Date.now() + 1}`,
				role: "assistant",
				content: "",
				toolCalls: [],
				timestamp: Date.now()
			}), b(""), y(!0), u(!0), k(e, D.current, t);
		}, [
			m,
			b,
			y,
			k
		]),
		handleStop: V(() => {
			A(), y(!1);
		}, [A, y]),
		abort: A,
		isThinking: l,
		setIsThinking: u,
		lastTraceId: d,
		setLastTraceId: f
	};
}
//#endregion
//#region src/client/components/AgenticNotebook/agentChatParts.tsx
var Ar = j("thumbUp"), jr = j("thumbDown");
function Mr(...e) {
	return e.every(Boolean);
}
function Nr(e) {
	let t = Mr(!e.isStreaming, e.messageCount > 0), n = e.lastTraceId ? e.scoredTraceIds.has(e.lastTraceId) : !1;
	return {
		showSaveAsDashboard: Mr(t, e.onDashboardSaved, e.portletBlockCount > 0),
		showClear: e.messageCount > 0,
		showFeedback: Mr(t, e.onScore, !!e.lastTraceId, !n),
		lastScored: n
	};
}
function Pr({ showSaveAsDashboard: e, showClear: t, isStreaming: n, onSaveAsDashboard: r, onClear: i }) {
	let { t: a } = R();
	return /* @__PURE__ */ J("div", {
		className: "dc:flex dc:items-center dc:justify-between dc:px-4 dc:py-3 border-dc-border dc:border-b",
		children: [/* @__PURE__ */ q("h3", {
			className: "dc:text-sm dc:font-semibold text-dc-text",
			children: a("notebook.aiAssistant")
		}), /* @__PURE__ */ J("div", {
			className: "dc:flex dc:items-center dc:gap-1",
			children: [e && /* @__PURE__ */ q("button", {
				onClick: r,
				className: "dc:text-xs dc:px-2 dc:py-1 dc:rounded-sm text-dc-accent dc:hover:opacity-80",
				title: a("notebook.saveAsDashboardTitle"),
				children: a("notebook.saveAsDashboard")
			}), t && /* @__PURE__ */ q("button", {
				onClick: i,
				disabled: n,
				className: "dc:text-xs dc:px-2 dc:py-1 dc:rounded-sm text-dc-text-secondary dc:hover:opacity-80 dc:disabled:opacity-40",
				title: a("notebook.clearTitle"),
				children: a("common.actions.clear")
			})]
		})]
	});
}
function Fr({ scored: e, onScore: t }) {
	let { t: n } = R();
	return /* @__PURE__ */ q("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:gap-3 dc:py-4 dc:mt-2",
		children: e ? /* @__PURE__ */ q("span", {
			className: "dc:text-sm text-dc-text-secondary",
			children: n("notebook.feedbackThanks")
		}) : /* @__PURE__ */ J(K, { children: [/* @__PURE__ */ q("span", {
			className: "dc:text-sm text-dc-text-secondary",
			children: n("notebook.feedbackQuestion")
		}), /* @__PURE__ */ J("div", {
			className: "dc:flex dc:items-center dc:gap-2",
			children: [/* @__PURE__ */ J("button", {
				onClick: () => t(1),
				className: "dc:flex dc:items-center dc:gap-1.5 dc:px-3 dc:py-1.5 dc:rounded-lg dc:text-sm dc:font-medium border-dc-border dc:border text-dc-success hover:bg-dc-success-bg dc:transition-colors bg-dc-surface dc:cursor-pointer",
				children: [/* @__PURE__ */ q(Ar, { className: "dc:w-4 dc:h-4" }), n("notebook.feedbackYes")]
			}), /* @__PURE__ */ J("button", {
				onClick: () => t(0),
				className: "dc:flex dc:items-center dc:gap-1.5 dc:px-3 dc:py-1.5 dc:rounded-lg dc:text-sm dc:font-medium border-dc-border dc:border text-dc-error hover:bg-dc-danger-bg dc:transition-colors bg-dc-surface dc:cursor-pointer",
				children: [/* @__PURE__ */ q(jr, { className: "dc:w-4 dc:h-4" }), n("notebook.feedbackNo")]
			})]
		})] })
	});
}
function Ir({ loadingComponent: e }) {
	let { t } = R();
	return /* @__PURE__ */ q("div", {
		className: "dc:flex dc:mb-3 dc:justify-start",
		style: { animation: "dc-msg-in 100ms ease-out" },
		children: /* @__PURE__ */ J("div", {
			className: "dc:rounded-lg dc:px-3 dc:py-2 dc:text-sm bg-dc-surface-secondary text-dc-text-secondary dc:rounded-bl-sm dc:flex dc:items-center dc:gap-2",
			children: [e ? /* @__PURE__ */ q("span", {
				className: "dc:inline-flex dc:items-center dc:justify-center dc:h-4 dc:w-4",
				children: e
			}) : /* @__PURE__ */ q(z, { size: "xs" }), /* @__PURE__ */ q("span", { children: t("notebook.thinking") })]
		})
	});
}
function Lr() {
	let { t: e } = R();
	return /* @__PURE__ */ q("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:h-full",
		children: /* @__PURE__ */ J("div", {
			className: "dc:text-center dc:max-w-xs",
			children: [
				/* @__PURE__ */ q("div", {
					className: "dc:text-lg dc:font-semibold text-dc-text dc:mb-2",
					children: e("notebook.emptyState.title")
				}),
				/* @__PURE__ */ q("p", {
					className: "dc:text-sm text-dc-text-secondary dc:mb-4",
					children: e("notebook.emptyState.description")
				}),
				/* @__PURE__ */ J("div", {
					className: "dc:space-y-2 dc:text-xs text-dc-text-muted",
					children: [
						/* @__PURE__ */ q("p", { children: e("notebook.emptyState.example1") }),
						/* @__PURE__ */ q("p", { children: e("notebook.emptyState.example2") }),
						/* @__PURE__ */ q("p", { children: e("notebook.emptyState.example3") })
					]
				})
			]
		})
	});
}
//#endregion
//#region src/client/components/AgenticNotebook/AgentChatPanel.tsx
function Rr({ messages: e, loadingComponent: t }) {
	return e.length === 0 ? /* @__PURE__ */ q(Lr, {}) : /* @__PURE__ */ q(K, { children: e.map((e) => /* @__PURE__ */ q(Sr, {
		message: e,
		loadingComponent: t
	}, e.id)) });
}
var zr = B.memo(function({ agentEndpoint: e, agentApiKey: n, agentProvider: r, agentModel: i, agentProviderEndpoint: a, onClear: o, onDashboardSaved: s, onScore: c, loadingComponent: l, initialPrompt: u }) {
	let { t: d } = R(), f = W(null), p = W(!1), [m, h] = G(/* @__PURE__ */ new Set()), { messages: g, isStreaming: _, inputValue: v } = Y(t(Kn)), y = Y((e) => e.setInputValue), b = Y((e) => e.reset), x = Y((e) => e.setIsStreaming), S = Y((e) => e.blocks.filter((e) => e.type === "portlet").length), { doSend: C, handleStop: w, abort: T, isThinking: E, setIsThinking: D, lastTraceId: O, setLastTraceId: k } = kr({
		agentEndpoint: e,
		agentApiKey: n,
		agentProvider: r,
		agentModel: i,
		agentProviderEndpoint: a,
		onDashboardSaved: s,
		messages: g,
		isStreaming: _
	}), A = W(g.length);
	H(() => {
		g.length > A.current && f.current?.scrollIntoView({ behavior: "smooth" }), A.current = g.length;
	}, [g]), H(() => {
		E && f.current?.scrollIntoView({ behavior: "smooth" });
	}, [E]), H(() => {
		if (u && !p.current && g.length === 0) {
			p.current = !0;
			let e = setTimeout(() => C(u), 100);
			return () => {
				clearTimeout(e), p.current = !1;
			};
		}
	}, [
		u,
		g.length,
		C
	]);
	let j = W(v);
	j.current = v;
	let M = V(() => {
		C(j.current.trim());
	}, [C]), N = V(() => {
		y("");
	}, [y]), P = V(() => {
		T(), x(!1), D(!1), b(), k(null), h(/* @__PURE__ */ new Set()), o?.();
	}, [
		T,
		x,
		D,
		b,
		k,
		o
	]), F = V(() => {
		C(d("notebook.saveAsDashboardPrompt"));
	}, [C, d]), ee = V((e) => {
		!O || !c || (c({
			traceId: O,
			value: e
		}), h((e) => new Set(e).add(O)));
	}, [O, c]), { showSaveAsDashboard: I, showClear: te, showFeedback: ne, lastScored: L } = Nr({
		onDashboardSaved: !!s,
		onScore: !!c,
		isStreaming: _,
		portletBlockCount: S,
		messageCount: g.length,
		lastTraceId: O,
		scoredTraceIds: m
	});
	return /* @__PURE__ */ J("div", {
		className: "dc:flex dc:flex-col dc:h-full bg-dc-surface",
		children: [
			/* @__PURE__ */ q(Pr, {
				showSaveAsDashboard: I,
				showClear: te,
				isStreaming: _,
				onSaveAsDashboard: F,
				onClear: P
			}),
			/* @__PURE__ */ J("div", {
				className: "dc:flex-1 dc:overflow-y-auto dc:px-4 dc:py-3",
				children: [
					/* @__PURE__ */ q(Rr, {
						messages: g,
						loadingComponent: l
					}),
					E && /* @__PURE__ */ q(Ir, { loadingComponent: l }),
					(ne || L) && /* @__PURE__ */ q(Fr, {
						scored: L,
						onScore: ee
					}),
					/* @__PURE__ */ q("div", { ref: f })
				]
			}),
			/* @__PURE__ */ q(Cr, {
				value: v,
				onChange: y,
				onSend: M,
				onStop: w,
				onContinue: N,
				isStreaming: _,
				showContinue: !_ && g.length > 0
			})
		]
	});
});
//#endregion
//#region src/client/components/AgenticNotebook/useNotebookAutosave.ts
function Br({ blockCount: e, messageCount: t, isStreaming: n, save: r, onSave: i }) {
	let a = W(), o = W(!1), s = W(i);
	s.current = i;
	let c = W(e > 0 || t > 0), l = V(() => {
		a.current && clearTimeout(a.current);
	}, []), u = V(() => {
		l(), a.current = setTimeout(() => {
			o.current = !1;
			let e = r();
			s.current?.(e);
		}, 1e3);
	}, [l, r]);
	(e > 0 || t > 0) && (c.current = !0);
	let d = !!s.current && c.current;
	return H(() => {
		if (d) {
			if (n) {
				o.current = !0, l();
				return;
			}
			return u(), l;
		}
	}, [
		d,
		e,
		t,
		n,
		l,
		u
	]), H(() => {
		!n && o.current && s.current && c.current && u();
	}, [n, u]), { clearSave: V(() => {
		s.current && (l(), s.current({
			blocks: [],
			messages: []
		}));
	}, [l]) };
}
//#endregion
//#region src/client/components/AgenticNotebook/index.tsx
function Vr({ blocks: e, pulsingBlockId: t, nudge: n, onExpand: r }) {
	let { t: i } = R(), a = j("bookOpen"), o = j("documentText");
	return /* @__PURE__ */ J("button", {
		type: "button",
		onClick: r,
		className: "dc:h-full dc:flex-shrink-0 dc:flex dc:flex-col dc:items-center dc:pt-3 dc:gap-2 bg-dc-surface border-dc-border dc:border-r dc:cursor-pointer dc:hover:bg-dc-surface-hover dc:transition-colors",
		style: n ? {
			animation: "dc-strip-nudge 0.8s ease-in-out 2",
			width: 48
		} : { width: 48 },
		title: i("notebook.collapsed.expandNotebook"),
		children: [/* @__PURE__ */ q(a, { className: "dc:w-5 dc:h-5 text-dc-text-muted" }), /* @__PURE__ */ q("div", {
			className: "dc:flex dc:flex-col dc:items-center dc:gap-1.5 dc:flex-1 dc:overflow-y-auto dc:py-1",
			style: { scrollbarWidth: "none" },
			children: e.length === 0 ? /* @__PURE__ */ q("span", {
				className: "dc:text-[9px] text-dc-text-disabled dc:writing-vertical-lr dc:mt-2",
				style: { writingMode: "vertical-lr" },
				children: i("notebook.collapsed.noBlocks")
			}) : e.map((e) => {
				let n = e.id === t, r;
				return r = e.type === "portlet" ? S(e.chartType) : o, /* @__PURE__ */ q("div", {
					className: "dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded-sm",
					style: n ? { animation: "dc-icon-pulse 0.6s ease-in-out 3" } : void 0,
					title: e.type === "portlet" ? e.title : e.title || i("notebook.collapsed.markdown"),
					children: /* @__PURE__ */ q(r, { className: "dc:w-4 dc:h-4 text-dc-text-muted" })
				}, e.id);
			})
		})]
	});
}
function Hr({ onExpand: e }) {
	let { t } = R(), n = j("sparkles");
	return /* @__PURE__ */ J("button", {
		type: "button",
		onClick: e,
		className: "dc:w-12 dc:h-full dc:flex-shrink-0 dc:flex dc:flex-col dc:items-center dc:pt-3 dc:gap-2 bg-dc-surface border-dc-border dc:border-l dc:cursor-pointer dc:hover:bg-dc-surface-hover dc:transition-colors",
		title: t("notebook.collapsed.expandChat"),
		children: [/* @__PURE__ */ q(n, { className: "dc:w-5 dc:h-5 text-dc-accent" }), /* @__PURE__ */ q("span", {
			className: "dc:text-[10px] dc:font-medium text-dc-text-muted",
			style: { writingMode: "vertical-lr" },
			children: t("notebook.collapsed.aiChat")
		})]
	});
}
function Ur({ agentEndpoint: e, agentApiKey: t, agentProvider: n, agentModel: r, agentProviderEndpoint: i, onSave: a, onDirtyStateChange: o, onDashboardSaved: s, onScore: c, colorPalette: l, loadingComponent: u, className: d, initialPrompt: f }) {
	let [p, m] = G(60), h = W(null), g = W(!1), { containerRef: _, layoutMode: v } = An(), [y, b] = G("chat"), [x, S] = G(null), [C, w] = G(!1), T = W(v), E = Y((e) => e.blocks), D = E.length, O = Y((e) => e.messages.length), k = Y((e) => e.isStreaming), A = Y((e) => e.save);
	H(() => {
		T.current === "narrow" && v === "wide" && b("chat"), T.current = v;
	}, [v]);
	let j = W(D);
	H(() => {
		if (v === "narrow" && y === "chat" && D > j.current) {
			let e = E[E.length - 1];
			if (e) {
				S(e.id);
				let t = setTimeout(() => S(null), 2e3);
				return () => clearTimeout(t);
			}
		}
		j.current = D;
	}, [
		D,
		E,
		v,
		y
	]);
	let M = W(!1);
	H(() => {
		if (k) M.current = !0;
		else if (M.current && v === "narrow" && y === "chat" && D > 0) {
			M.current = !1, w(!0);
			let e = setTimeout(() => w(!1), 1700);
			return () => clearTimeout(e);
		}
	}, [
		k,
		v,
		y,
		D
	]);
	let N = V((e) => {
		_(e), h.current = e;
	}, [_]), P = W({
		blockCount: D,
		msgCount: O
	});
	H(() => {
		o?.(D !== P.current.blockCount || O !== P.current.msgCount);
	}, [
		D,
		O,
		o
	]);
	let { clearSave: F } = Br({
		blockCount: D,
		messageCount: O,
		isStreaming: k,
		save: A,
		onSave: a
	}), ee = V((e) => {
		e.preventDefault(), g.current = !0;
		let t = (e) => {
			if (!g.current || !h.current) return;
			let t = h.current.getBoundingClientRect(), n = (e.clientX - t.left) / t.width * 100;
			m(Math.min(Math.max(n, 30), 80));
		}, n = () => {
			g.current = !1, document.removeEventListener("mousemove", t), document.removeEventListener("mouseup", n);
		};
		document.addEventListener("mousemove", t), document.addEventListener("mouseup", n);
	}, []), I = /* @__PURE__ */ q(zr, {
		agentEndpoint: e,
		agentApiKey: t,
		agentProvider: n,
		agentModel: r,
		agentProviderEndpoint: i,
		onClear: F,
		onDashboardSaved: s,
		onScore: c,
		loadingComponent: u,
		initialPrompt: f
	});
	return v === "narrow" ? /* @__PURE__ */ q("div", {
		ref: N,
		className: `dc:flex dc:h-full dc:w-full dc:overflow-hidden bg-dc-surface-secondary ${d || ""}`,
		children: y === "chat" ? /* @__PURE__ */ J(K, { children: [/* @__PURE__ */ q(Vr, {
			blocks: E,
			pulsingBlockId: x,
			nudge: C,
			onExpand: () => b("notebook")
		}), /* @__PURE__ */ q("div", {
			className: "dc:h-full dc:overflow-hidden dc:flex-1",
			children: I
		})] }) : /* @__PURE__ */ J(K, { children: [/* @__PURE__ */ q("div", {
			className: "dc:h-full dc:overflow-hidden dc:flex-1",
			children: /* @__PURE__ */ q(ur, { colorPalette: l })
		}), /* @__PURE__ */ q(Hr, { onExpand: () => b("chat") })] })
	}) : /* @__PURE__ */ J("div", {
		ref: N,
		className: `dc:flex dc:h-full dc:w-full dc:overflow-hidden bg-dc-surface-secondary ${d || ""}`,
		children: [
			/* @__PURE__ */ q("div", {
				className: "dc:h-full dc:overflow-hidden",
				style: { width: `${p}%` },
				children: /* @__PURE__ */ q(ur, { colorPalette: l })
			}),
			/* @__PURE__ */ q("div", {
				className: "dc:w-1 dc:h-full dc:cursor-col-resize dc:flex-shrink-0 dc:transition-colors bg-dc-border dc:hover:bg-dc-accent",
				onMouseDown: ee
			}),
			/* @__PURE__ */ q("div", {
				className: "dc:h-full dc:overflow-hidden",
				style: { width: `${100 - p}%` },
				children: I
			})
		]
	});
}
var Wr = B.memo(function({ config: e, colorPalette: t, ...n }) {
	return /* @__PURE__ */ q(Bn, {
		initialConfig: e,
		children: /* @__PURE__ */ q(Ur, {
			...n,
			colorPalette: t
		})
	});
});
//#endregion
//#region src/client/components/AnalyticsPage.tsx
function Gr() {
	let { t: e } = R();
	return /* @__PURE__ */ q("div", { children: e("analyticsPage.title") });
}
//#endregion
//#region src/client/stores/dataBrowserStore.tsx
var Kr = "dc-data-browser-column-widths";
function qr(e) {
	try {
		let t = localStorage.getItem(Kr);
		return t ? JSON.parse(t)[e] ?? {} : {};
	} catch {
		return {};
	}
}
function Jr(e, t) {
	try {
		let n = localStorage.getItem(Kr), r = n ? JSON.parse(n) : {};
		r[e] = t, localStorage.setItem(Kr, JSON.stringify(r));
	} catch {}
}
function Yr(e = {}) {
	return i()((t, n) => ({
		selectedCube: e.defaultCube ?? null,
		visibleColumns: e.defaultColumns ?? [],
		sortColumn: null,
		sortDirection: "asc",
		page: 0,
		pageSize: e.defaultPageSize ?? 20,
		filters: [],
		showFilterBar: !1,
		showColumnPicker: !1,
		columnWidths: e.defaultCube ? qr(e.defaultCube) : {},
		selectCube: (e, n) => t({
			selectedCube: e,
			visibleColumns: n,
			sortColumn: null,
			sortDirection: "asc",
			page: 0,
			filters: [],
			showFilterBar: !1,
			columnWidths: qr(e)
		}),
		setVisibleColumns: (e) => t({
			visibleColumns: e,
			page: 0
		}),
		toggleColumn: (e) => t((t) => {
			let n = t.visibleColumns.indexOf(e);
			return {
				visibleColumns: n >= 0 ? t.visibleColumns.filter((t) => t !== e) : [...t.visibleColumns, e],
				page: 0,
				sortColumn: n >= 0 && t.sortColumn === e ? null : t.sortColumn
			};
		}),
		setSort: (e) => t((t) => t.sortColumn === e ? t.sortDirection === "asc" ? {
			sortDirection: "desc",
			page: 0
		} : {
			sortColumn: null,
			sortDirection: "asc",
			page: 0
		} : {
			sortColumn: e,
			sortDirection: "asc",
			page: 0
		}),
		clearSort: () => t({
			sortColumn: null,
			sortDirection: "asc",
			page: 0
		}),
		setPage: (e) => t({ page: e }),
		setPageSize: (e) => t({
			pageSize: e,
			page: 0
		}),
		setFilters: (e) => t({
			filters: e,
			page: 0
		}),
		toggleFilterBar: () => t((e) => ({ showFilterBar: !e.showFilterBar })),
		setShowColumnPicker: (e) => t({ showColumnPicker: e }),
		setColumnWidth: (e, n) => t((t) => {
			let r = {
				...t.columnWidths,
				[e]: n
			};
			return t.selectedCube && Jr(t.selectedCube, r), { columnWidths: r };
		}),
		setColumnWidths: (e) => {
			let r = n().selectedCube;
			r && Jr(r, e), t({ columnWidths: e });
		}
	}));
}
var Xr = Pn(null);
function Zr({ children: e, defaultPageSize: t, defaultCube: n, defaultColumns: r }) {
	let i = W(null);
	return i.current ||= Yr({
		defaultPageSize: t,
		defaultCube: n,
		defaultColumns: r
	}), /* @__PURE__ */ q(Xr.Provider, {
		value: i.current,
		children: e
	});
}
function Q(e) {
	let t = Fn(Xr);
	if (!t) throw Error("useDataBrowserStore must be used within DataBrowserStoreProvider");
	return n(t, e);
}
//#endregion
//#region src/client/hooks/useDataBrowser.ts
function Qr(e, t) {
	if (!t) return !0;
	let [n, r] = e.split("."), i = t.cubes.find((e) => e.name === n);
	return !i || i.dimensions.some((e) => e.name === `${n}.${r}`);
}
function $r(e, t) {
	if (!t) return "string";
	let [n] = e.split("."), r = t.cubes.find((e) => e.name === n);
	if (!r) return "string";
	let i = r.dimensions.find((t) => t.name === e);
	if (i) return i.type;
	let a = r.measures.find((t) => t.name === e);
	return a ? a.type : "string";
}
function ei(e, t) {
	if (!t) return {
		dimensions: [],
		measures: []
	};
	let n = t.cubes.find((t) => t.name === e);
	if (!n) return {
		dimensions: [],
		measures: []
	};
	let r = /* @__PURE__ */ new Set([
		"sum",
		"avg",
		"min",
		"max",
		"number"
	]);
	return {
		dimensions: n.dimensions.map((e) => e.name),
		measures: n.measures.filter((e) => r.has(e.type)).map((e) => e.name)
	};
}
function ti() {
	let e = Q((e) => e.selectedCube), n = Q((e) => e.visibleColumns), r = Q((e) => e.sortColumn), i = Q((e) => e.sortDirection), a = Q((e) => e.page), o = Q((e) => e.pageSize), s = Q((e) => e.filters), c = Q((e) => e.showFilterBar), l = Q((e) => e.showColumnPicker), u = Q(t((e) => ({
		selectCube: e.selectCube,
		setVisibleColumns: e.setVisibleColumns,
		toggleColumn: e.toggleColumn,
		setSort: e.setSort,
		clearSort: e.clearSort,
		setPage: e.setPage,
		setPageSize: e.setPageSize,
		setFilters: e.setFilters,
		toggleFilterBar: e.toggleFilterBar,
		setShowColumnPicker: e.setShowColumnPicker
	}))), { meta: d, getFieldLabel: f } = vt(), p = U(() => {
		if (!d || !e) return null;
		let t = d.cubes.find((t) => t.name === e);
		if (!t) return null;
		let n = t.dimensions.find((e) => e.primaryKey);
		return n ? n.name : t.dimensions.length > 0 ? t.dimensions[0].name : null;
	}, [d, e]), m = r ?? p, h = r ? i : "asc", g = U(() => {
		if (!e || n.length === 0) return null;
		let t = n.filter((e) => Qr(e, d)), r = n.filter((e) => !Qr(e, d));
		if (t.length === 0) return null;
		let i = {
			dimensions: t,
			ungrouped: !0,
			limit: o,
			offset: a * o
		};
		return r.length > 0 && (i.measures = r), s.length > 0 && (i.filters = s), m && (i.order = { [m]: h }), i;
	}, [
		e,
		n,
		s,
		m,
		h,
		a,
		o,
		d
	]), { rawData: _, isLoading: v, isFetching: y, isDebouncing: b, error: x, refetch: S } = rt(g, {
		skip: !g,
		debounceMs: 400,
		keepPreviousData: !0,
		staleTime: 6e4
	}), C = (() => {
		if (!_ || _.length === 0) return _;
		let e = Object.keys(_[0]);
		return n.some((t) => e.includes(t)) ? _ : null;
	})(), w = v || !C && (b || y), T = C?.length ?? 0;
	return {
		selectedCube: e,
		visibleColumns: n,
		sortColumn: m,
		sortDirection: h,
		page: a,
		pageSize: o,
		filters: s,
		showFilterBar: c,
		showColumnPicker: l,
		rawData: C,
		isLoading: w,
		isFetching: y,
		error: x,
		query: g,
		rowCount: T,
		hasNextPage: T === o,
		hasPrevPage: a > 0,
		meta: d,
		getFieldLabel: f,
		...u,
		refetch: S
	};
}
//#endregion
//#region src/client/components/DataBrowser/DataBrowserSidebar.tsx
var ni = j("search"), ri = j("cube");
function ii({ cubes: e, selectedCube: t, onSelectCube: n }) {
	let { t: r } = R(), [i, a] = G(""), o = U(() => {
		let t = [...e].sort((e, t) => (e.title || e.name).localeCompare(t.title || t.name));
		if (!i) return t;
		let n = i.toLowerCase();
		return t.filter((e) => e.name.toLowerCase().includes(n) || e.title.toLowerCase().includes(n));
	}, [e, i]);
	return /* @__PURE__ */ J("div", {
		className: "dc:flex dc:flex-col dc:h-full dc:border-r border-dc-border bg-dc-surface dc:w-60 dc:shrink-0",
		children: [/* @__PURE__ */ J("div", {
			className: "dc:px-3 dc:py-3 dc:border-b border-dc-border",
			children: [/* @__PURE__ */ q("h2", {
				className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-2",
				children: r("dataBrowser.sidebar.cubes")
			}), /* @__PURE__ */ J("div", {
				className: "dc:relative",
				children: [/* @__PURE__ */ q(ni, { className: "dc:absolute dc:left-2 dc:top-1/2 dc:-translate-y-1/2 dc:w-3.5 dc:h-3.5 text-dc-text-muted" }), /* @__PURE__ */ q("input", {
					type: "text",
					value: i,
					onChange: (e) => a(e.target.value),
					placeholder: r("dataBrowser.sidebar.searchPlaceholder"),
					className: "dc:w-full dc:pl-7 dc:pr-2 dc:py-1.5 dc:text-xs dc:rounded-sm border-dc-border dc:border bg-dc-surface text-dc-text dc:outline-none dc:focus:ring-1 focus:ring-dc-accent"
				})]
			})]
		}), /* @__PURE__ */ J("div", {
			className: "dc:flex-1 dc:overflow-y-auto dc:py-1",
			children: [o.map((e) => /* @__PURE__ */ J("button", {
				onClick: () => n(e.name),
				className: `dc:flex dc:items-center dc:gap-2 dc:w-full dc:px-3 dc:py-1.5 dc:text-left dc:text-sm dc:transition-colors ${t === e.name ? "bg-dc-accent-bg text-dc-accent dc:font-medium" : "text-dc-text dc:hover:bg-dc-surface-hover"}`,
				children: [/* @__PURE__ */ q(ri, { className: "dc:w-4 dc:h-4 dc:shrink-0 text-dc-text-muted" }), /* @__PURE__ */ q("span", {
					className: "dc:truncate",
					children: e.title || e.name
				})]
			}, e.name)), o.length === 0 && /* @__PURE__ */ q("div", {
				className: "dc:px-3 dc:py-4 dc:text-xs text-dc-text-muted dc:text-center",
				children: r("dataBrowser.sidebar.noCubes")
			})]
		})]
	});
}
//#endregion
//#region src/client/components/DataBrowser/DataBrowserToolbar.tsx
var ai = j("filter"), oi = j("settings"), si = j("chevronLeft"), ci = j("chevronRight"), li = j("refresh");
function ui({ showFilterBar: e, filterCount: t, onToggleFilterBar: n, onToggleColumnPicker: r, page: i, pageSize: a, rowCount: o, hasNextPage: s, hasPrevPage: c, onPageChange: l, onPageSizeChange: u, isFetching: d, onRefresh: f }) {
	let { t: p } = R();
	return /* @__PURE__ */ J("div", {
		className: "dc:flex dc:items-center dc:gap-2 dc:px-3 dc:py-2 dc:border-b border-dc-border bg-dc-surface-secondary",
		children: [
			/* @__PURE__ */ J("button", {
				onClick: n,
				className: `dc:flex dc:items-center dc:gap-1.5 dc:px-2.5 dc:py-1.5 dc:text-xs dc:font-medium dc:rounded-sm dc:border dc:transition-colors ${e ? "border-dc-accent bg-dc-accent-bg text-dc-accent" : "border-dc-border bg-dc-surface text-dc-text dc:hover:bg-dc-surface-hover"}`,
				children: [
					/* @__PURE__ */ q(ai, { className: "dc:w-3.5 dc:h-3.5" }),
					p("dataBrowser.toolbar.filters"),
					t > 0 && /* @__PURE__ */ q("span", {
						className: "dc:inline-flex dc:items-center dc:justify-center dc:w-4 dc:h-4 dc:text-[10px] dc:font-bold dc:rounded-full bg-dc-accent text-dc-surface",
						children: t
					})
				]
			}),
			/* @__PURE__ */ J("button", {
				onClick: r,
				className: "dc:flex dc:items-center dc:gap-1.5 dc:px-2.5 dc:py-1.5 dc:text-xs dc:font-medium dc:rounded-sm dc:border border-dc-border bg-dc-surface text-dc-text dc:hover:bg-dc-surface-hover dc:transition-colors",
				children: [/* @__PURE__ */ q(oi, { className: "dc:w-3.5 dc:h-3.5" }), p("dataBrowser.toolbar.columns")]
			}),
			/* @__PURE__ */ q("div", { className: "dc:flex-1" }),
			/* @__PURE__ */ q("span", {
				className: "dc:text-xs text-dc-text-muted",
				children: p("dataBrowser.toolbar.rows", { count: o })
			}),
			/* @__PURE__ */ q("button", {
				onClick: f,
				className: "dc:p-1 dc:rounded-sm dc:hover:bg-dc-surface-hover dc:transition-colors",
				title: "Refresh",
				children: /* @__PURE__ */ q(li, { className: `dc:w-3.5 dc:h-3.5 text-dc-text-muted ${d ? "dc:animate-spin" : ""}` })
			}),
			/* @__PURE__ */ J("select", {
				value: a,
				onChange: (e) => u(Number(e.target.value)),
				className: "dc:text-xs dc:px-1.5 dc:py-1 dc:rounded-sm dc:border border-dc-border bg-dc-surface text-dc-text dc:outline-none",
				children: [
					/* @__PURE__ */ q("option", {
						value: 20,
						children: "20"
					}),
					/* @__PURE__ */ q("option", {
						value: 50,
						children: "50"
					}),
					/* @__PURE__ */ q("option", {
						value: 100,
						children: "100"
					})
				]
			}),
			/* @__PURE__ */ J("div", {
				className: "dc:flex dc:items-center dc:gap-1",
				children: [
					/* @__PURE__ */ q("button", {
						onClick: () => l(i - 1),
						disabled: !c,
						className: "dc:p-1 dc:rounded-sm dc:hover:bg-dc-surface-hover dc:disabled:opacity-30 dc:disabled:cursor-not-allowed dc:transition-colors",
						children: /* @__PURE__ */ q(si, { className: "dc:w-4 dc:h-4 text-dc-text-muted" })
					}),
					/* @__PURE__ */ q("span", {
						className: "dc:text-xs dc:font-medium text-dc-text dc:min-w-[2rem] dc:text-center",
						children: i + 1
					}),
					/* @__PURE__ */ q("button", {
						onClick: () => l(i + 1),
						disabled: !s,
						className: "dc:p-1 dc:rounded-sm dc:hover:bg-dc-surface-hover dc:disabled:opacity-30 dc:disabled:cursor-not-allowed dc:transition-colors",
						children: /* @__PURE__ */ q(ci, { className: "dc:w-4 dc:h-4 text-dc-text-muted" })
					})
				]
			})
		]
	});
}
//#endregion
//#region src/client/components/DataBrowser/DataBrowserTable.tsx
var di = j("chevronUp"), fi = j("chevronDown");
function pi(e, t) {
	let n = $r(e, t);
	return {
		string: "text",
		number: "num",
		time: "time",
		boolean: "bool",
		sum: "num",
		avg: "num",
		min: "num",
		max: "num"
	}[n] || n;
}
function mi(e, t) {
	return pi(e, t) === "num";
}
function hi(e) {
	return e == null ? "" : typeof e == "number" ? e.toLocaleString() : typeof e == "boolean" ? e ? "true" : "false" : e instanceof Date ? e.toISOString() : String(e);
}
var gi = 60, $ = 150, _i = B.memo(function({ data: e, columns: t, sortColumn: n, sortDirection: r, onSort: i, getFieldLabel: a, meta: o, isLoading: s, isFetching: c, selectedCube: l, loadingComponent: u }) {
	let { t: d } = R(), f = Q((e) => e.columnWidths), p = Q((e) => e.setColumnWidth), m = Q((e) => e.setColumnWidths), h = W(null), g = W(!1), _ = V((e, n) => {
		e.preventDefault(), e.stopPropagation();
		let r = e.clientX;
		g.current = !1;
		let i = h.current;
		if (i) {
			let e = i.querySelectorAll("thead th"), n = {};
			e.forEach((e, r) => {
				let i = t[r];
				i && (n[i] = e.getBoundingClientRect().width);
			}), m(n);
		}
		let a = e.target.closest("th"), o = a ? a.getBoundingClientRect().width : $, s = (e) => {
			let t = e.clientX - r;
			Math.abs(t) > 2 && (g.current = !0);
			let i = Math.max(gi, o + t);
			p(n, i);
		}, c = () => {
			document.removeEventListener("mousemove", s), document.removeEventListener("mouseup", c), document.body.style.cursor = "", document.body.style.userSelect = "", requestAnimationFrame(() => {
				g.current = !1;
			});
		};
		document.addEventListener("mousemove", s), document.addEventListener("mouseup", c), document.body.style.cursor = "col-resize", document.body.style.userSelect = "none";
	}, [
		t,
		p,
		m
	]), v = V((e) => {
		g.current || i(e);
	}, [i]), y = Object.keys(f).length > 0 ? t.reduce((e, t) => e + (f[t] ?? $), 0) : void 0;
	return l ? e ? e.length === 0 && !s && !c ? /* @__PURE__ */ q("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:h-full",
		children: /* @__PURE__ */ J("div", {
			className: "dc:text-center text-dc-text-muted",
			children: [/* @__PURE__ */ q("div", {
				className: "dc:text-sm dc:font-semibold dc:mb-1",
				children: d("dataBrowser.noData")
			}), /* @__PURE__ */ q("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: d("dataBrowser.noRows")
			})]
		})
	}) : /* @__PURE__ */ J("div", {
		className: "dc:relative dc:flex-1 dc:overflow-auto",
		children: [c && /* @__PURE__ */ q("div", { className: "dc:absolute dc:inset-0 bg-dc-surface dc:opacity-40 dc:z-10 dc:pointer-events-none" }), /* @__PURE__ */ J("table", {
			ref: h,
			className: "dc:border-collapse",
			style: {
				tableLayout: "fixed",
				width: y,
				minWidth: "100%"
			},
			children: [
				/* @__PURE__ */ q("colgroup", { children: t.map((e) => /* @__PURE__ */ q("col", { style: { width: f[e] ?? $ } }, e)) }),
				/* @__PURE__ */ q("thead", {
					className: "dc:sticky dc:top-0 dc:z-20",
					style: { backgroundColor: "var(--dc-surface-secondary)" },
					children: /* @__PURE__ */ q("tr", { children: t.map((e, i) => {
						let s = n === e, c = a(e), l = pi(e, o), u = i === t.length - 1, d = mi(e, o);
						return /* @__PURE__ */ J("th", {
							onClick: () => v(e),
							className: `dc:relative dc:px-3 dc:py-2 dc:text-xs dc:font-normal dc:cursor-pointer dc:select-none dc:border-b border-dc-border dc:transition-colors${u ? "" : " dc:border-r"}${d ? " dc:text-right" : " dc:text-left"}`,
							style: { color: "var(--dc-text-muted)" },
							children: [/* @__PURE__ */ J("div", {
								className: `dc:flex dc:items-center dc:gap-1.5 dc:overflow-hidden${d ? " dc:justify-end" : ""}`,
								children: [
									/* @__PURE__ */ q("span", {
										className: "dc:font-medium dc:truncate",
										style: { color: "var(--dc-text)" },
										children: c
									}),
									/* @__PURE__ */ q("span", {
										className: "dc:text-[10px] dc:opacity-50 dc:shrink-0",
										children: l
									}),
									s && q(r === "asc" ? di : fi, { className: "dc:w-3 dc:h-3 text-dc-accent dc:shrink-0" })
								]
							}), /* @__PURE__ */ q("div", {
								onMouseDown: (t) => _(t, e),
								className: "dc:absolute dc:top-0 dc:right-0 dc:w-1.5 dc:h-full dc:cursor-col-resize dc:hover:bg-dc-accent dc:opacity-0 dc:hover:opacity-100 dc:transition-opacity",
								style: { zIndex: 30 }
							})]
						}, e);
					}) })
				}),
				/* @__PURE__ */ q("tbody", { children: e.map((e, n) => /* @__PURE__ */ q("tr", {
					className: "dc:border-b border-dc-border",
					style: { transition: "background-color 0.1s" },
					onMouseEnter: (e) => {
						e.currentTarget.style.backgroundColor = "var(--dc-surface-hover, rgba(0,0,0,0.02))";
					},
					onMouseLeave: (e) => {
						e.currentTarget.style.backgroundColor = "";
					},
					children: t.map((n, r) => {
						let i = r === t.length - 1, a = mi(n, o);
						return /* @__PURE__ */ q("td", {
							className: `dc:px-3 dc:py-1.5 dc:text-sm dc:overflow-hidden dc:text-ellipsis dc:whitespace-nowrap${i ? "" : " dc:border-r border-dc-border"}${a ? " dc:text-right dc:tabular-nums" : ""}`,
							style: { color: "var(--dc-text)" },
							children: hi(e[n])
						}, n);
					})
				}, n)) })
			]
		})]
	}) : /* @__PURE__ */ q("div", {
		className: "dc:flex dc:flex-col dc:items-center dc:justify-center dc:h-full dc:gap-3",
		children: u ?? /* @__PURE__ */ J(K, { children: [/* @__PURE__ */ q(z, { size: "md" }), /* @__PURE__ */ q("div", {
			className: "dc:text-sm text-dc-text-muted",
			children: d("dataBrowser.loadingData")
		})] })
	}) : /* @__PURE__ */ q("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:h-full",
		children: /* @__PURE__ */ J("div", {
			className: "dc:text-center text-dc-text-muted",
			children: [/* @__PURE__ */ q("div", {
				className: "dc:text-base dc:font-semibold dc:mb-1",
				children: d("dataBrowser.selectCube")
			}), /* @__PURE__ */ q("div", {
				className: "dc:text-sm text-dc-text-secondary",
				children: d("dataBrowser.selectCubeHint")
			})]
		})
	});
});
//#endregion
//#region src/client/components/DataBrowser/index.tsx
function vi({ className: e = "", maxHeight: t = "100vh", loadingComponent: n }) {
	let { selectedCube: r, visibleColumns: i, sortColumn: a, sortDirection: o, page: s, pageSize: c, filters: l, showFilterBar: u, showColumnPicker: d, rawData: f, isLoading: p, isFetching: m, rowCount: h, hasNextPage: g, hasPrevPage: _, meta: v, getFieldLabel: y, selectCube: b, setSort: x, setPage: S, setPageSize: C, setFilters: w, toggleFilterBar: T, setShowColumnPicker: E, toggleColumn: D, refetch: O } = ti(), k = U(() => v ? v.cubes.map((e) => ({
		name: e.name,
		title: e.title || e.name
	})) : [], [v]), A = V((e) => {
		let { dimensions: t } = ei(e, v);
		b(e, t);
	}, [v, b]), j = U(() => {
		function e(t) {
			return t.reduce((t, n) => "member" in n ? t + 1 : "type" in n && "filters" in n ? t + e(n.filters) : t, 0);
		}
		return e(l);
	}, [l]), M = U(() => {
		if (!v) return null;
		if (r) {
			let e = v.cubes.find((e) => e.name === r);
			return e ? { cubes: [e] } : null;
		}
		return v;
	}, [v, r]), N = V((e, t, n, r) => {
		D(e.name);
	}, [D]);
	return /* @__PURE__ */ J("div", {
		className: `dc:flex dc:border border-dc-border dc:rounded-lg dc:overflow-hidden bg-dc-surface ${e}`,
		style: { height: t },
		children: [
			/* @__PURE__ */ q(ii, {
				cubes: k,
				selectedCube: r,
				onSelectCube: A
			}),
			/* @__PURE__ */ J("div", {
				className: "dc:flex dc:flex-col dc:flex-1 dc:min-w-0",
				children: [
					r && /* @__PURE__ */ q(ui, {
						showFilterBar: u,
						filterCount: j,
						onToggleFilterBar: T,
						onToggleColumnPicker: () => E(!d),
						page: s,
						pageSize: c,
						rowCount: h,
						hasNextPage: g,
						hasPrevPage: _,
						onPageChange: S,
						onPageSizeChange: C,
						isFetching: m,
						onRefresh: () => O()
					}),
					r && u && /* @__PURE__ */ q("div", {
						className: "dc:px-3 dc:py-2 dc:border-b border-dc-border bg-dc-surface",
						children: /* @__PURE__ */ q(en, {
							filters: l,
							schema: M,
							onFiltersChange: w
						})
					}),
					/* @__PURE__ */ q(_i, {
						data: f,
						columns: i,
						sortColumn: a,
						sortDirection: o,
						onSort: x,
						getFieldLabel: y,
						meta: v,
						isLoading: p,
						isFetching: m,
						selectedCube: r,
						loadingComponent: n
					})
				]
			}),
			d && M && /* @__PURE__ */ q(Ze, {
				isOpen: d,
				onClose: () => E(!1),
				onSelect: N,
				mode: "breakdown",
				schema: M,
				selectedFields: i
			})
		]
	});
}
function yi({ className: e, defaultCube: t, defaultPageSize: n = 20, maxHeight: r, loadingComponent: i }) {
	return /* @__PURE__ */ q(Zr, {
		defaultPageSize: n,
		defaultCube: t,
		children: /* @__PURE__ */ q(vi, {
			className: e,
			maxHeight: r,
			loadingComponent: i
		})
	});
}
//#endregion
//#region src/client/components/DashboardThumbnailPlaceholder.tsx
var bi = j("segment");
function xi({ className: e = "" }) {
	return /* @__PURE__ */ q("div", {
		className: `dc:flex dc:items-center dc:justify-center bg-dc-bg-secondary ${e}`,
		children: /* @__PURE__ */ J("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ q(bi, { className: "dc:w-8 dc:h-8 dc:mx-auto dc:mb-2 text-dc-text-muted dc:opacity-50" }), /* @__PURE__ */ q("span", {
				className: "dc:text-xs text-dc-text-muted",
				children: "No preview"
			})]
		})
	});
}
//#endregion
export { Wr as AgenticNotebook, Ae as AnalysisBuilder, qe as AnalyticsDashboard, Gr as AnalyticsPage, ye as AnalyticsPortlet, F as ChartErrorBoundary, He as ConfirmModal, x as CubeClient, D as CubeProvider, f as CubeQueryError, u as DEFAULT_ICONS, Ye as DashboardEditModal, Ne as DashboardFilterBar, Fe as DashboardGrid, ze as DashboardGridSurface, Ce as DashboardModals, te as DashboardProvider, fe as DashboardStoreProvider, xi as DashboardThumbnailPlaceholder, $e as DashboardToolbar, yi as DataBrowser, xe as DrillBreadcrumb, pe as DrillMenu, tn as ExecutionPlanPanel, rn as ExplainAIPanel, Jt as LazyChart, z as LoadingIndicator, We as Modal, Bn as NotebookStoreProvider, Ee as PortletAnalysisModal, Ve as PortletContainer, o as ScrollContainerProvider, Tt as THEME_PRESETS, wt as applyTheme, Bt as buildFunnelConfigFromQueries, Lt as buildServerFunnelQuery, g as captureThumbnail, E as chartPluginRegistry, _n as compressAndEncode, b as createCubeClient, Nn as createDashboardLayout, L as createDashboardStore, Je as createDefaultConfig, De as createDefaultFlowConfig, Re as createDefaultFunnelConfig, Xe as createDefaultQueryConfig, Oe as createDefaultRetentionConfig, je as createDefaultWorkspace, jt as createExplainQueryKey, pt as createFlowQueryKey, ot as createFunnelQueryKey, Rn as createNotebookStore, wn as decodeAndDecompress, pn as detectAsymmetricDateRanges, fn as detectMeasureCollisions, T as exportPortletToXlsx, Mn as formatChartData, Ft as formatDuration, ct as generateQueryLabel, un as generateShareUrl, Cn as getAvailableBindingKeyDimensions, Wt as getAvailableChartTypes, zt as getBindingKeyField, yn as getBindingKeyLabel, S as getChartTypeIcon, mt as getCombinedFields, Vt as getCubeNameFromQuery, O as getFieldTypeIcon, j as getIcon, C as getIconData, A as getIconRegistry, v as getIconsByCategory, l as getMeasureTypeIcon, ft as getQueryIndices, ut as getQueryLabels, Ct as getTheme, St as getThemeVariable, Kt as getUnavailableChartTypes, on as getValidationSummary, Yt as highlightCodeBlocks, Ut as isChartTypeAvailable, bt as isDarkMode, m as isExportAvailable, Ge as isFlowConfig, Be as isFunnelConfig, It as isFunnelData, xn as isMinimumFunnelConfigValid, Pe as isMultiQuery, et as isMultiQueryConfig, lt as isMultiQueryData, Tn as isMultiQueryValid, Me as isQueryConfig, Se as isRetentionConfig, N as isSankeyData, P as isServerFlowQuery, he as isServerFunnelQuery, dn as isShareableSize, Qe as isSingleQuery, p as isThumbnailCaptureAvailable, tt as isValidAnalysisConfig, Te as isValidAnalysisWorkspace, Ht as isValidChartType, it as mergeQueryResults, gt as mergeResultsByKey, _t as mergeResultsConcat, we as migrateConfig, Ue as migrateLegacyPortlet, vn as parseShareUrl, Gt as preloadChart, qt as preloadCharts, k as registerIcons, y as resetIcons, Et as resetTheme, ae as selectAllActions, Jn as selectBlockActions, Vn as selectBlocks, Zt as selectBreakdowns, En as selectChartConfig, qn as selectChatActions, Kn as selectChatState, an as selectCurrentState, ce as selectDebugData, me as selectDebugDataActions, nt as selectEditModeActions, I as selectEditModeState, $t as selectFilters, Qt as selectFunnelState, Gn as selectInputValue, Un as selectIsStreaming, _e as selectLayoutActions, ie as selectLayoutState, Hn as selectMessages, nn as selectMetrics, ge as selectModalActions, ve as selectModalState, gn as selectMultiQueryState, re as selectPortletDebugData, Wn as selectSessionId, se as selectThumbnailDirty, Xt as selectUIState, d as setIcon, Ot as setTheme, xt as setThemeVariable, Rt as transformServerFunnelResult, Or as useAgentChat, ln as useAnalysisBuilder, hn as useAnalysisBuilderStore, c as useCubeApi, w as useCubeContext, s as useCubeFeatures, yt as useCubeFieldLabel, rt as useCubeLoadQuery, rt as useCubeQuery, vt as useCubeMeta, M as useCubeMetaQuery, Le as useDashboard, de as useDashboardContext, Ke as useDashboardStore, oe as useDashboardStoreApi, be as useDashboardStoreOptional, ti as useDataBrowser, ke as useDrillInteraction, At as useDryRunQueries, kt as useDryRunQuery, le as useElementVisibility, Pt as useExplainAI, Nt as useExplainQuery, ht as useFlowQuery, dt as useFunnelQuery, st as useMultiCubeLoadQuery, Mt as useMultiDryRunQueries, Y as useNotebookStore, a as useScrollContainer, ue as useScrollDetection, jn as useTheme, mn as validateBindingKeyExists, sn as validateBindingKeyForSteps, bn as validateFunnelConfig, at as validateMergeKey, On as validateMergeKeys, cn as validateMultiQueryConfig, Sn as validateStepQueries, Dn as validateTimeDimensionAlignment, h as warnIfExcelJsMissing, _ as warnIfScreenshotLibMissing, Dt as watchThemeChanges };

//# sourceMappingURL=index.js.map