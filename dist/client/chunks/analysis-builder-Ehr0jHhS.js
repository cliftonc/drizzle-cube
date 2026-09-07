import { A as e, C as t, _ as n, gt as r, l as i, u as a, y as o } from "./chart-data-table-Bn9EtETl.js";
import { T as s, j as c, o as l, s as u, v as d, x as f } from "./DashboardEditModal-CBdNSTX_.js";
import { i as p, n as m, o as h, r as g, s as _ } from "./retention-ChW9jYdy.js";
import { B as v, F as y } from "./chart-activity-grid-D6X0iOUw.js";
import { r as b, t as x } from "./useExplainAI-BAJgZbo9.js";
import { a as S, t as C } from "./charts-loader-DL6om-E1.js";
import { F as w, M as T, N as E, S as D, c as O, n as k, p as A, t as j, u as M } from "./analysis-builder-shared-n20CH0VA.js";
import { n as N } from "./charts-core-pzDVGMWV.js";
import P, { Component as F, forwardRef as I, memo as L, useCallback as R, useEffect as z, useImperativeHandle as ee, useMemo as B, useRef as V, useState as H, useSyncExternalStore as te } from "react";
import { Fragment as U, jsx as W, jsxs as G } from "react/jsx-runtime";
//#region src/client/shared/components/QueryAnalysisPanel.sections.tsx
function ne(e) {
	return e.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/\b\w/g, (e) => e.toUpperCase());
}
function re(e) {
	switch (e) {
		case "most_dimensions": return "bg-dc-info-bg text-dc-info";
		case "most_connected": return "bg-dc-accent-bg text-dc-accent";
		case "alphabetical_fallback": return "bg-dc-warning-bg text-dc-warning";
		case "single_cube": return "bg-dc-success-bg text-dc-success";
		default: return "bg-dc-muted-bg text-dc-muted";
	}
}
var ie = ({ jp: e }) => {
	let t = o("chevronRight");
	return !e.pathFound || !e.path || e.path.length === 0 ? null : /* @__PURE__ */ W("div", {
		className: "dc:space-y-1 dc:ml-2",
		children: e.path.map((e, n) => /* @__PURE__ */ G("div", {
			className: "dc:flex dc:items-center dc:gap-1 dc:text-xs dc:flex-wrap",
			children: [
				/* @__PURE__ */ W("span", {
					className: "dc:font-mono text-dc-text-secondary",
					children: e.fromCube
				}),
				/* @__PURE__ */ W(t, { className: "dc:w-3 dc:h-3 text-dc-text-muted" }),
				/* @__PURE__ */ W("span", {
					className: "dc:font-mono text-dc-text",
					children: e.toCube
				}),
				/* @__PURE__ */ G("span", {
					className: "text-dc-text-muted",
					children: [
						"(",
						e.relationship,
						", ",
						e.joinType,
						" join)"
					]
				}),
				e.joinColumns.length > 0 && /* @__PURE__ */ G("span", {
					className: "text-dc-text-muted",
					children: ["on ", e.joinColumns.map((e) => `${e.sourceColumn}=${e.targetColumn}`).join(", ")]
				})
			]
		}, n))
	});
}, ae = ({ jp: e }) => {
	let { t } = y();
	return e.selection ? /* @__PURE__ */ G("div", {
		className: "dc:mt-2 dc:ml-2 dc:text-xs text-dc-text-muted",
		children: [
			/* @__PURE__ */ W("span", {
				className: "dc:font-medium text-dc-text",
				children: t("queryAnalysis.joinPaths.selection")
			}),
			/* @__PURE__ */ W("span", { children: ` ${ne(e.selection.strategy)}` }),
			typeof e.selection.selectedRank == "number" && /* @__PURE__ */ W("span", { children: `, selected #${e.selection.selectedRank}` }),
			typeof e.selection.selectedScore == "number" && /* @__PURE__ */ W("span", { children: `, score ${e.selection.selectedScore}` })
		]
	}) : null;
}, oe = ({ jp: e, primaryCube: t }) => {
	let { t: n } = y();
	return !e.selection?.candidates || e.selection.candidates.length === 0 ? null : /* @__PURE__ */ G("details", {
		className: "dc:mt-2",
		children: [/* @__PURE__ */ W("summary", {
			className: "dc:text-xs text-dc-text-muted dc:cursor-pointer hover:text-dc-text",
			children: n("queryAnalysis.joinPaths.pathCandidates", { count: e.selection.candidates.length })
		}), /* @__PURE__ */ G("div", {
			className: "dc:mt-1 dc:ml-2 dc:space-y-1",
			children: [e.selection.preferredCubes && e.selection.preferredCubes.length > 0 && /* @__PURE__ */ G("div", {
				className: "dc:text-xs text-dc-text-muted",
				children: ["preferred cubes: ", e.selection.preferredCubes.join(", ")]
			}), e.selection.candidates.slice(0, 5).map((e) => /* @__PURE__ */ G("div", {
				className: "dc:text-xs text-dc-text-muted",
				children: [
					/* @__PURE__ */ G("span", {
						className: "dc:font-medium text-dc-text",
						children: ["#", e.rank]
					}),
					/* @__PURE__ */ W("span", { children: ` score ${e.score}` }),
					/* @__PURE__ */ W("span", { children: ` (preferred+${e.scoreBreakdown.preferredJoinBonus + e.scoreBreakdown.preferredCubeBonus}, penalty-${e.scoreBreakdown.lengthPenalty})` }),
					/* @__PURE__ */ W("span", { children: ": " }),
					/* @__PURE__ */ W("span", { children: e.path.length > 0 ? `${e.path[0].fromCube} → ${e.path.map((e) => e.toCube).join(" → ")}` : t })
				]
			}, e.rank))]
		})]
	});
}, se = ({ jp: e }) => {
	let { t } = y();
	return !e.visitedCubes || e.visitedCubes.length === 0 || e.pathFound ? null : /* @__PURE__ */ G("details", {
		className: "dc:mt-1",
		children: [/* @__PURE__ */ W("summary", {
			className: "dc:text-xs text-dc-text-muted dc:cursor-pointer hover:text-dc-text",
			children: t("queryAnalysis.joinPaths.visitedCubes", { count: e.visitedCubes.length })
		}), /* @__PURE__ */ W("div", {
			className: "dc:mt-1 dc:text-xs text-dc-text-muted dc:ml-2",
			children: e.visitedCubes.join(" → ")
		})]
	});
}, K = ({ jp: e, primaryCube: t }) => {
	let n = o("chevronRight");
	return /* @__PURE__ */ G("div", {
		className: "dc:flex dc:items-center dc:gap-2 dc:mb-2 dc:flex-wrap",
		children: [
			/* @__PURE__ */ W("span", {
				className: "dc:font-mono text-dc-text-secondary",
				children: t
			}),
			/* @__PURE__ */ W(n, { className: "dc:w-4 dc:h-4 text-dc-text-muted" }),
			/* @__PURE__ */ W("span", {
				className: "dc:font-mono dc:font-medium text-dc-text",
				children: e.targetCube
			}),
			e.pathFound ? /* @__PURE__ */ G("span", {
				className: "dc:text-xs dc:px-2 dc:py-0.5 bg-dc-success-bg text-dc-success dc:rounded-sm",
				children: [
					e.pathLength,
					" step",
					e.pathLength === 1 ? "" : "s"
				]
			}) : /* @__PURE__ */ W("span", {
				className: "dc:text-xs dc:px-2 dc:py-0.5 bg-dc-error-bg text-dc-error dc:rounded-sm",
				children: "No path"
			})
		]
	});
}, ce = ({ jp: e, primaryCube: t }) => /* @__PURE__ */ G("div", {
	className: "bg-dc-surface dc:p-3 dc:rounded-sm dc:text-sm",
	children: [
		/* @__PURE__ */ W(K, {
			jp: e,
			primaryCube: t
		}),
		/* @__PURE__ */ W(ie, { jp: e }),
		/* @__PURE__ */ W(ae, { jp: e }),
		/* @__PURE__ */ W(oe, {
			jp: e,
			primaryCube: t
		}),
		!e.pathFound && e.error && /* @__PURE__ */ W("p", {
			className: "dc:text-xs text-dc-error dc:mt-1",
			children: e.error
		}),
		/* @__PURE__ */ W(se, { jp: e })
	]
}), le = ({ analysis: e }) => {
	let { t } = y(), n = o("link");
	return e.joinPaths.length === 0 ? null : /* @__PURE__ */ G("div", {
		className: "dc:border-b border-dc-border dc:pb-3",
		children: [/* @__PURE__ */ G("h4", {
			className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-2 dc:flex dc:items-center",
			children: [/* @__PURE__ */ W(n, { className: "dc:w-4 dc:h-4 dc:mr-2" }), t("queryAnalysis.joinPaths")]
		}), /* @__PURE__ */ W("div", {
			className: "dc:space-y-2",
			children: e.joinPaths.map((t, n) => /* @__PURE__ */ W(ce, {
				jp: t,
				primaryCube: e.primaryCube.selectedCube
			}, n))
		})]
	});
}, ue = ({ analysis: e }) => {
	let { t } = y(), n = o("table"), r = o("success"), i = o("error");
	return /* @__PURE__ */ G("div", {
		className: "dc:border-b border-dc-border dc:pb-3",
		children: [/* @__PURE__ */ G("h4", {
			className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-2 dc:flex dc:items-center",
			children: [/* @__PURE__ */ W(n, { className: "dc:w-4 dc:h-4 dc:mr-2" }), t("queryAnalysis.primaryCube")]
		}), /* @__PURE__ */ G("div", {
			className: "bg-dc-surface dc:p-3 dc:rounded-sm dc:text-sm",
			children: [
				/* @__PURE__ */ G("div", {
					className: "dc:flex dc:items-center dc:gap-2 dc:mb-2 dc:flex-wrap",
					children: [/* @__PURE__ */ W("span", {
						className: "dc:font-mono dc:font-medium text-dc-primary",
						children: e.primaryCube.selectedCube
					}), /* @__PURE__ */ W("span", {
						className: `dc:text-xs dc:px-2 dc:py-0.5 dc:rounded-sm ${re(e.primaryCube.reason)}`,
						children: ne(e.primaryCube.reason)
					})]
				}),
				/* @__PURE__ */ W("p", {
					className: "text-dc-text-secondary dc:text-xs",
					children: e.primaryCube.explanation
				}),
				e.primaryCube.candidates && e.primaryCube.candidates.length > 1 && /* @__PURE__ */ G("details", {
					className: "dc:mt-2",
					children: [/* @__PURE__ */ W("summary", {
						className: "dc:text-xs text-dc-text-muted dc:cursor-pointer hover:text-dc-text",
						children: t("queryAnalysis.primaryCube.showCandidates", { count: e.primaryCube.candidates.length })
					}), /* @__PURE__ */ W("div", {
						className: "dc:mt-2 dc:space-y-1 dc:ml-2",
						children: e.primaryCube.candidates.map((n, a) => /* @__PURE__ */ G("div", {
							className: "dc:text-xs dc:flex dc:items-center dc:gap-2 dc:flex-wrap",
							children: [
								/* @__PURE__ */ W("span", {
									className: `dc:font-mono ${n.cubeName === e.primaryCube.selectedCube ? "dc:font-bold text-dc-primary" : "text-dc-text-muted"}`,
									children: n.cubeName
								}),
								/* @__PURE__ */ G("span", {
									className: "text-dc-text-muted",
									children: [
										"dims: ",
										n.dimensionCount,
										", joins: ",
										n.joinCount
									]
								}),
								n.canReachAll ? /* @__PURE__ */ G("span", {
									className: "text-dc-success dc:flex dc:items-center dc:gap-0.5",
									children: [/* @__PURE__ */ W(r, { className: "dc:w-3 dc:h-3" }), t("queryAnalysis.primaryCube.reachable")]
								}) : /* @__PURE__ */ G("span", {
									className: "text-dc-error dc:flex dc:items-center dc:gap-0.5",
									children: [/* @__PURE__ */ W(i, { className: "dc:w-3 dc:h-3" }), t("queryAnalysis.primaryCube.cannotReachAll")]
								})
							]
						}, a))
					})]
				})
			]
		})]
	});
}, de = ({ analysis: e }) => {
	let { t } = y(), n = o("table");
	return e.preAggregations.length === 0 ? null : /* @__PURE__ */ G("div", {
		className: "dc:border-b border-dc-border dc:pb-3",
		children: [/* @__PURE__ */ G("h4", {
			className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-2 dc:flex dc:items-center",
			children: [/* @__PURE__ */ W(n, { className: "dc:w-4 dc:h-4 dc:mr-2" }), t("queryAnalysis.preAggregations")]
		}), /* @__PURE__ */ W("div", {
			className: "dc:space-y-2",
			children: e.preAggregations.map((e, n) => /* @__PURE__ */ G("div", {
				className: "bg-dc-surface dc:p-3 dc:rounded-sm dc:text-sm",
				children: [
					/* @__PURE__ */ G("div", {
						className: "dc:flex dc:items-center dc:gap-2 dc:mb-1 dc:flex-wrap",
						children: [
							/* @__PURE__ */ W("span", {
								className: "dc:font-mono dc:font-medium text-dc-text",
								children: e.cubeName
							}),
							/* @__PURE__ */ W("span", {
								className: "dc:text-xs text-dc-text-muted",
								children: "as"
							}),
							/* @__PURE__ */ W("code", {
								className: "dc:text-xs bg-dc-surface-secondary dc:px-1 dc:rounded-sm dc:font-mono",
								children: e.cteAlias
							})
						]
					}),
					/* @__PURE__ */ W("p", {
						className: "dc:text-xs text-dc-text-secondary",
						children: e.reason
					}),
					/* @__PURE__ */ G("div", {
						className: "dc:mt-1 dc:text-xs text-dc-text-muted",
						children: [
							/* @__PURE__ */ W("span", {
								className: "dc:font-medium",
								children: t("queryAnalysis.preAggregations.measures")
							}),
							" ",
							e.measures.join(", ")
						]
					}),
					e.joinKeys.length > 0 && /* @__PURE__ */ G("div", {
						className: "dc:mt-1 dc:text-xs text-dc-text-muted",
						children: [
							/* @__PURE__ */ W("span", {
								className: "dc:font-medium",
								children: t("queryAnalysis.preAggregations.joinKeys")
							}),
							" ",
							e.joinKeys.map((e) => `${e.sourceColumn}=${e.targetColumn}`).join(", ")
						]
					})
				]
			}, n))
		})]
	});
}, fe = ({ analysis: e }) => {
	let { t } = y(), n = o("warning");
	return !e.warnings || e.warnings.length === 0 ? null : /* @__PURE__ */ G("div", { children: [/* @__PURE__ */ G("h4", {
		className: "dc:text-sm dc:font-semibold text-dc-warning dc:mb-2 dc:flex dc:items-center",
		children: [/* @__PURE__ */ W(n, { className: "dc:w-4 dc:h-4 dc:mr-2" }), t("queryAnalysis.warnings")]
	}), /* @__PURE__ */ W("ul", {
		className: "list-disc dc:list-inside dc:text-xs text-dc-warning dc:space-y-1",
		children: e.warnings.map((e, t) => /* @__PURE__ */ W("li", { children: e }, t))
	})] });
}, pe = ({ analysis: e }) => {
	let { t } = y(), n = o("info"), r = [
		{
			label: t("queryAnalysis.summary.type"),
			value: ne(e.querySummary.queryType)
		},
		{
			label: t("queryAnalysis.summary.cubes"),
			value: String(e.cubeCount)
		},
		{
			label: t("queryAnalysis.summary.joins"),
			value: String(e.querySummary.joinCount)
		},
		{
			label: t("queryAnalysis.summary.ctes"),
			value: String(e.querySummary.cteCount)
		},
		...e.querySummary.measureStrategy ? [{
			label: t("queryAnalysis.summary.strategy"),
			value: ne(e.querySummary.measureStrategy)
		}] : []
	];
	return /* @__PURE__ */ G("div", {
		className: "dc:border-b border-dc-border dc:pb-3",
		children: [/* @__PURE__ */ G("h4", {
			className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-2 dc:flex dc:items-center",
			children: [/* @__PURE__ */ W(n, { className: "dc:w-4 dc:h-4 dc:mr-2" }), t("queryAnalysis.summary")]
		}), /* @__PURE__ */ W("div", {
			className: "dc:grid dc:gap-2 dc:text-xs",
			style: { gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" },
			children: r.map((e) => /* @__PURE__ */ G("div", {
				className: "bg-dc-surface dc:p-2 dc:rounded-sm",
				children: [/* @__PURE__ */ G("span", {
					className: "text-dc-text-muted",
					children: [e.label, ":"]
				}), /* @__PURE__ */ W("span", {
					className: "dc:ml-1 dc:font-medium text-dc-text",
					children: e.value
				})]
			}, e.label))
		})]
	});
}, me = ({ analysis: e }) => {
	let { t } = y();
	return e.cubesInvolved.length === 0 ? null : /* @__PURE__ */ G("div", {
		className: "dc:text-xs text-dc-text-muted dc:pt-2 dc:border-t border-dc-border",
		children: [
			/* @__PURE__ */ W("span", {
				className: "dc:font-medium",
				children: t("queryAnalysis.cubesInvolved")
			}),
			" ",
			e.cubesInvolved.join(", ")
		]
	});
}, he = ({ analysis: e }) => /* @__PURE__ */ G("div", {
	className: "bg-dc-surface-secondary dc:border border-dc-border dc:rounded-lg dc:p-4 dc:space-y-4",
	children: [
		/* @__PURE__ */ W(pe, { analysis: e }),
		/* @__PURE__ */ W(ue, { analysis: e }),
		/* @__PURE__ */ W(le, { analysis: e }),
		/* @__PURE__ */ W(de, { analysis: e }),
		/* @__PURE__ */ W(fe, { analysis: e }),
		/* @__PURE__ */ W(me, { analysis: e })
	]
}), q = o("success"), ge = o("error"), _e = o("warning"), ve = o("codeBracket"), ye = o("share"), J = o("check"), Y = o("delete"), X = o("sparkles"), Z = o("arrowPath"), be = o("schemaGraph");
function xe({ summary: e, hasResults: t }) {
	let { t: n } = y(), { executionResults: r, executionStatus: i, totalRowCount: a, resultsStale: o } = e;
	return /* @__PURE__ */ G("div", {
		className: "dc:flex dc:items-center",
		children: [i === "refreshing" ? /* @__PURE__ */ W("div", {
			className: "dc:w-4 dc:h-4 dc:mr-2 dc:rounded-full dc:border-b-2 dc:animate-spin",
			style: { borderBottomColor: "var(--dc-primary)" }
		}) : t ? /* @__PURE__ */ W(q, { className: "dc:w-4 dc:h-4 text-dc-success dc:mr-2" }) : i === "error" ? /* @__PURE__ */ W(ge, { className: "dc:w-4 dc:h-4 text-dc-error dc:mr-2" }) : /* @__PURE__ */ W(_e, { className: "dc:w-4 dc:h-4 text-dc-text-muted dc:mr-2" }), /* @__PURE__ */ W("span", {
			className: "dc:text-sm text-dc-text-secondary",
			children: t ? /* @__PURE__ */ G(U, { children: [
				r.length,
				" ",
				n(r.length === 1 ? "results.header.row" : "results.header.rows"),
				a !== null && a > r.length && /* @__PURE__ */ G("span", {
					className: "text-dc-text-muted",
					children: [" of ", a.toLocaleString()]
				}),
				o && /* @__PURE__ */ G("span", {
					className: "text-dc-warning dc:ml-2",
					children: ["• ", n("results.header.stale")]
				})
			] }) : n(i === "error" ? "results.header.failed" : i === "loading" ? "results.header.executing" : "results.header.noResults")
		})]
	});
}
function Se({ onShareClick: e, shareButtonState: t, canShare: n }) {
	let { t: r } = y();
	return e ? /* @__PURE__ */ W("button", {
		onClick: e,
		className: `dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1.5 dc:text-xs dc:font-medium dc:rounded-sm dc:transition-colors ${t === "idle" && n ? "text-dc-accent dark:text-dc-accent bg-dc-accent-bg dark:bg-dc-accent-bg dc:border border-dc-accent dark:border-dc-accent hover:bg-dc-accent-bg dark:hover:bg-dc-accent-bg" : t === "idle" ? "text-dc-text-muted bg-dc-surface-secondary dc:border border-dc-border dc:cursor-not-allowed" : "text-dc-success dark:text-dc-success bg-dc-success-bg dark:bg-dc-success-bg dc:border border-dc-success dark:border-dc-success"}`,
		title: t === "idle" ? "Share this analysis" : "Link copied!",
		disabled: !n || t !== "idle",
		children: t === "idle" ? /* @__PURE__ */ G(U, { children: [/* @__PURE__ */ W(ye, { className: "dc:w-3 dc:h-3" }), /* @__PURE__ */ W("span", {
			className: "dc:hidden dc:sm:inline",
			children: r("common.actions.share")
		})] }) : t === "copied" ? /* @__PURE__ */ G(U, { children: [/* @__PURE__ */ W(J, { className: "dc:w-3 dc:h-3" }), /* @__PURE__ */ W("span", {
			className: "dc:hidden dc:sm:inline",
			children: r("results.share.copied")
		})] }) : /* @__PURE__ */ G(U, { children: [
			/* @__PURE__ */ W(J, { className: "dc:w-3 dc:h-3" }),
			/* @__PURE__ */ W("span", {
				className: "dc:hidden dc:sm:inline",
				children: r("results.share.copied")
			}),
			/* @__PURE__ */ W("span", {
				className: "dc:hidden dc:lg:inline dc:text-[10px] dc:opacity-75",
				children: r("results.share.noChart")
			})
		] })
	}) : null;
}
function Ce({ onRefreshClick: e, canRefresh: t, isRefreshing: n, showCacheBustIndicator: r, setIsHoveringRefresh: i }) {
	let { t: a } = y();
	return !e || !t ? null : /* @__PURE__ */ G("button", {
		onClick: (t) => e({ bustCache: t.shiftKey }),
		onMouseEnter: () => i(!0),
		onMouseLeave: () => i(!1),
		disabled: n,
		className: `dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1.5 dc:text-xs dc:font-medium dc:rounded-sm dc:transition-colors ${n ? "text-dc-text-muted bg-dc-surface-secondary dc:border border-dc-border dc:cursor-wait" : r ? "text-dc-warning bg-dc-warning-bg dc:border border-dc-warning dc:font-semibold" : "text-dc-accent bg-dc-accent-bg dc:border border-dc-accent hover:bg-dc-accent-bg"}`,
		title: n ? "Refreshing..." : r ? "Click to refresh and bypass cache" : "Refresh data (Shift+click to bypass cache)",
		children: [/* @__PURE__ */ W(Z, { className: `dc:w-3 dc:h-3 ${n ? "dc:animate-spin" : ""}` }), /* @__PURE__ */ W("span", {
			className: "dc:hidden dc:sm:inline",
			children: a(n ? "results.toolbar.refreshing" : "results.toolbar.refresh")
		})]
	});
}
function we({ summary: e, toolbar: t, display: n, hasResults: r }) {
	let { t: i } = y(), { displayLimit: a, onDisplayLimitChange: o, isAIOpen: c, onAIToggle: l, onColorPaletteChange: u, currentPaletteName: d, onClearClick: f, canClear: p, setIsClearConfirmOpen: m, setShowDebug: h, setShowSchema: g } = t, { activeView: _, showDebug: v, showSchema: b, enableAI: x, isFunnelMode: S, showSchemaDiagram: C } = n, { executionError: w, debugDataPerQuery: T } = e;
	return /* @__PURE__ */ G("div", {
		className: "dc:flex dc:items-center dc:gap-2",
		children: [
			r && _ === "table" && !v && o && /* @__PURE__ */ G("select", {
				value: a,
				onChange: (e) => o(Number(e.target.value)),
				className: "dc:text-xs dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary",
				children: [
					/* @__PURE__ */ G("option", {
						value: 50,
						children: ["50 ", i("results.header.rows")]
					}),
					/* @__PURE__ */ G("option", {
						value: 100,
						children: ["100 ", i("results.header.rows")]
					}),
					/* @__PURE__ */ G("option", {
						value: 250,
						children: ["250 ", i("results.header.rows")]
					}),
					/* @__PURE__ */ G("option", {
						value: 500,
						children: ["500 ", i("results.header.rows")]
					})
				]
			}),
			x && l && /* @__PURE__ */ G("button", {
				onClick: l,
				className: `dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1.5 dc:text-xs dc:font-medium dc:rounded-sm dc:transition-colors ${c ? "text-white bg-dc-accent dc:border border-dc-accent" : "text-dc-accent dark:text-dc-accent bg-dc-accent-bg dark:bg-dc-accent-bg dc:border border-dc-accent dark:border-dc-accent hover:bg-dc-accent-bg dark:hover:bg-dc-accent-bg"}`,
				title: c ? "Close AI assistant" : "Analyse with AI",
				children: [/* @__PURE__ */ W(X, { className: "dc:w-3 dc:h-3" }), /* @__PURE__ */ W("span", {
					className: "dc:hidden dc:sm:inline",
					children: i("results.ai.button")
				})]
			}),
			u && r && /* @__PURE__ */ W(s, {
				currentPalette: d || "default",
				onPaletteChange: u
			}),
			/* @__PURE__ */ W(Se, {
				onShareClick: t.onShareClick,
				shareButtonState: t.shareButtonState,
				canShare: t.canShare
			}),
			/* @__PURE__ */ W(Ce, {
				onRefreshClick: t.onRefreshClick,
				canRefresh: t.canRefresh,
				isRefreshing: t.isRefreshing,
				showCacheBustIndicator: t.showCacheBustIndicator,
				setIsHoveringRefresh: t.setIsHoveringRefresh
			}),
			f && p && /* @__PURE__ */ G("button", {
				onClick: () => m(!0),
				className: "dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1.5 dc:text-xs dc:font-medium text-dc-text-secondary hover:text-dc-text bg-dc-surface hover:bg-dc-surface-hover dc:border border-dc-border dc:rounded-sm dc:transition-colors",
				title: S ? "Clear funnel" : "Clear all query data",
				children: [/* @__PURE__ */ W(Y, { className: "dc:w-3 dc:h-3" }), /* @__PURE__ */ W("span", {
					className: "dc:hidden dc:sm:inline",
					children: i("common.actions.clear")
				})]
			}),
			C && /* @__PURE__ */ W("button", {
				onClick: () => {
					g(!b), b || h(!1);
				},
				className: `dc:p-1.5 dc:rounded-sm dc:transition-colors dc:relative ${b ? "bg-dc-primary text-white" : "text-dc-text-secondary hover:text-dc-text hover:bg-dc-surface-hover"}`,
				title: b ? "Hide schema diagram" : "Show schema diagram",
				children: /* @__PURE__ */ W(be, { className: "dc:w-4 dc:h-4" })
			}),
			/* @__PURE__ */ G("button", {
				onClick: () => {
					h(!v), v || g(!1);
				},
				className: `dc:p-1.5 dc:rounded-sm dc:transition-colors dc:relative ${v ? "bg-dc-primary text-white" : "text-dc-text-secondary hover:text-dc-text hover:bg-dc-surface-hover"}`,
				title: v ? "Hide debug info" : "Show debug info",
				children: [/* @__PURE__ */ W(ve, { className: "dc:w-4 dc:h-4" }), (w || T.some((e) => e.error)) && !v && /* @__PURE__ */ W("span", { className: "dc:absolute dc:-top-0.5 dc:-right-0.5 dc:w-2 dc:h-2 bg-dc-danger-bg0 dc:rounded-full" })]
			})
		]
	});
}
function Te({ summary: e, toolbar: t, display: n }) {
	let { t: r } = y(), { executionResults: i, totalRowCount: a } = e, o = !!i && i.length > 0;
	return /* @__PURE__ */ G("div", {
		className: "dc:px-4 dc:py-2 dc:border-b border-dc-border bg-dc-surface-secondary dc:flex-shrink-0",
		children: [/* @__PURE__ */ G("div", {
			className: "dc:flex dc:items-center dc:justify-between",
			children: [/* @__PURE__ */ W(xe, {
				summary: e,
				hasResults: o
			}), /* @__PURE__ */ W(we, {
				summary: e,
				toolbar: t,
				display: n,
				hasResults: o
			})]
		}), o && a !== null && a > 1e3 && /* @__PURE__ */ G("div", {
			className: "dc:mt-2 bg-dc-warning-bg dc:border border-dc-warning dc:rounded-lg dc:p-2 dc:flex dc:items-start",
			children: [/* @__PURE__ */ W(_e, { className: "dc:w-4 dc:h-4 text-dc-warning dc:mr-2 dc:shrink-0 dc:mt-0.5" }), /* @__PURE__ */ G("div", {
				className: "dc:text-xs text-dc-warning",
				children: [
					/* @__PURE__ */ W("span", {
						className: "dc:font-semibold",
						children: r("results.warning.largeDataset")
					}),
					" ",
					a.toLocaleString(),
					" ",
					r("results.header.rows"),
					".",
					r("results.warning.filterHint")
				]
			})]
		})]
	});
}
//#endregion
//#region src/client/components/AnalysisBuilder/utils/executionPlanMarkdown.ts
function Q(e, t) {
	t && (e.push("## Cube Query"), e.push(""), e.push("```json"), e.push(JSON.stringify(t, null, 2)), e.push("```"), e.push(""));
}
function Ee(e, t) {
	e.push("## Query Summary"), e.push(""), e.push(`- **Cubes:** ${t.cubesInvolved.join(", ")}`), e.push(`- **Query Type:** ${t.querySummary.queryType.replace(/_/g, " ")}`), e.push(`- **Joins:** ${t.querySummary.joinCount}`), e.push(`- **CTEs:** ${t.querySummary.cteCount}`), e.push("");
}
function De(e, t) {
	e.push("## Primary Cube Selection"), e.push(""), e.push(`**Selected:** ${t.primaryCube.selectedCube}`), e.push(`**Reason:** ${t.primaryCube.reason.replace(/_/g, " ")}`), e.push(`**Explanation:** ${t.primaryCube.explanation}`), e.push("");
	let n = t.primaryCube.candidates;
	if (n && n.length > 1) {
		e.push("### Candidates Considered"), e.push(""), e.push("| Cube | Dimensions | Joins | Can Reach All |"), e.push("|------|------------|-------|---------------|");
		for (let r of n) e.push(`| ${r.cubeName}${r.cubeName === t.primaryCube.selectedCube ? " ✓" : ""} | ${r.dimensionCount} | ${r.joinCount} | ${r.canReachAll ? "Yes" : "No"} |`);
		e.push("");
	}
}
function Oe(e, t, n) {
	if (e.push(`**Selection strategy:** ${n.strategy}`), typeof n.selectedRank == "number" && e.push(`**Selected rank:** #${n.selectedRank}`), typeof n.selectedScore == "number" && e.push(`**Selected score:** ${n.selectedScore}`), n.preferredCubes && n.preferredCubes.length > 0 && e.push(`**Preferred cubes:** ${n.preferredCubes.join(", ")}`), n.candidates && n.candidates.length > 0) {
		e.push("**Path scoring candidates:**");
		for (let r of n.candidates.slice(0, 5)) {
			let n = r.path.length > 0 ? `${r.path[0].fromCube} → ${r.path.map((e) => e.toCube).join(" → ")}` : t.primaryCube.selectedCube;
			e.push(`- #${r.rank} score=${r.score} (preferredJoin=${r.scoreBreakdown.preferredJoinBonus}, preferredCube=${r.scoreBreakdown.preferredCubeBonus}, lengthPenalty=${r.scoreBreakdown.lengthPenalty}) ${n}`);
		}
	}
	e.push("");
}
function ke(e, t, n) {
	e.push(`### ${t.primaryCube.selectedCube} → ${n.targetCube} (${n.pathLength} step${n.pathLength === 1 ? "" : "s"})`), e.push(""), n.selection && Oe(e, t, n.selection);
	for (let t of n.path ?? []) {
		e.push(`- **${t.fromCube}** → **${t.toCube}** (${t.relationship}, ${t.joinType.toUpperCase()} JOIN)`);
		for (let n of t.joinColumns) e.push(`  - \`${n.sourceColumn}\` = \`${n.targetColumn}\``);
	}
	e.push("");
}
function Ae(e, t, n) {
	e.push(`### ${t.primaryCube.selectedCube} → ${n.targetCube}`), e.push(""), e.push(`❌ **No path found**${n.error ? `: ${n.error}` : ""}`), n.visitedCubes && n.visitedCubes.length > 0 && e.push(`Cubes visited: ${n.visitedCubes.join(" → ")}`), e.push("");
}
function je(e, t) {
	if (t.joinPaths.length !== 0) {
		e.push("## Join Paths"), e.push("");
		for (let n of t.joinPaths) n.pathFound && n.path ? ke(e, t, n) : n.pathFound || Ae(e, t, n);
	}
}
function Me(e, t) {
	if (t.preAggregations.length !== 0) {
		e.push("## Pre-Aggregation CTEs"), e.push("");
		for (let n of t.preAggregations) {
			if (e.push(`### ${n.cubeName} (\`${n.cteAlias}\`)`), e.push(""), e.push(`**Reason:** ${n.reason}`), e.push(`**Measures:** ${n.measures.join(", ")}`), n.joinKeys.length > 0) {
				e.push("**Join Keys:**");
				for (let t of n.joinKeys) e.push(`- \`${t.sourceColumn}\` = \`${t.targetColumn}\``);
			}
			e.push("");
		}
	}
}
function Ne(e, t) {
	if (!(!t.warnings || t.warnings.length === 0)) {
		e.push("## ⚠️ Warnings"), e.push("");
		for (let n of t.warnings) e.push(`- ${n}`);
		e.push("");
	}
}
function Pe(e, t) {
	t?.sql && (e.push("## Generated SQL"), e.push(""), e.push("```sql"), e.push(t.sql), e.push("```"));
}
function Fe(e, t, n) {
	let r = [];
	return r.push("# Query Execution Plan"), r.push(""), Q(r, t), Ee(r, e), De(r, e), je(r, e), Me(r, e), Ne(r, e), Pe(r, n), r.join("\n");
}
//#endregion
//#region src/client/components/AnalysisBuilder/utils/resultsPanelDerive.ts
var Ie = {
	sql: null,
	analysis: null,
	mode: null,
	queryType: null,
	joinType: null,
	cubesUsed: [],
	modeMetadata: void 0,
	loading: !1,
	error: null
};
function Le(e, t) {
	return e[t] || Ie;
}
function Re({ isCurrentChartRenderable: e, isFlowMode: t, isFunnelMode: n, isRetentionMode: r }) {
	return e || t || n || r;
}
function ze(e) {
	return !e || typeof e != "object" || !("nodes" in e) || !("links" in e) ? !1 : Array.isArray(e.nodes) && e.nodes.length > 0 || Array.isArray(e.links) && e.links.length > 0;
}
function Be(e, t, n, r) {
	if (e === null) return !1;
	if (!Array.isArray(e)) return !0;
	if (e.length === 0) return !1;
	if (t && e.length === 1) {
		let t = e[0];
		if (t && typeof t == "object" && "nodes" in t && "links" in t) return ze(t);
	}
	return n && r ? r.rows.length > 0 : e.length > 0;
}
function Ve({ tableIndex: e, isMultiQuery: t, allQueries: n, perQueryResults: r, executionResults: i, combinedQueryForChart: a }) {
	return t && e !== void 0 && e >= 0 && r ? {
		tableData: r[e] || null,
		tableQuery: n?.[e]
	} : {
		tableData: i ?? null,
		tableQuery: t ? a : n?.[0]
	};
}
function He(e) {
	let t = e.source || e.source_id || "", n = e.target || e.target_id || "";
	return {
		sourceName: t.split("_").slice(-1)[0] || t,
		targetName: n.split("_").slice(-1)[0] || n
	};
}
function Ue(e, t, n) {
	return !e && t > 1 && !!n && n.length > 1;
}
function We(e, t, n) {
	return n(e ? "results.toolbar.chartView" : t || "results.toolbar.chartDisabled");
}
//#endregion
//#region src/client/components/AnalysisBuilder/AnalysisResultsPanel.tsx
var Ge = P.lazy(() => import("./schema-visualization-BPQIlZam.js").then((e) => e.n).then((e) => ({ default: e.SchemaVisualizationLazy }))), Ke = L(function({ executionStatus: t, executionResults: n, executionError: r, totalRowCount: i, resultsStale: a = !1, chartType: s = "line", chartConfig: u = {}, displayConfig: d = {}, colorPalette: f, currentPaletteName: p, onColorPaletteChange: m, allQueries: h, funnelExecutedQueries: g, activeView: _ = "chart", onActiveViewChange: v, displayLimit: w = 100, onDisplayLimitChange: T, chartAvailability: D, debugDataPerQuery: O = [], onShareClick: k, canShare: A = !1, shareButtonState: j = "idle", onRefreshClick: M, canRefresh: N = !1, isRefreshing: F = !1, needsRefresh: I = !1, onClearClick: L, canClear: ee = !1, enableAI: te = !1, isAIOpen: ne = !1, onAIToggle: re, queryCount: ie = 1, perQueryResults: ae, activeTableIndex: oe = 0, onActiveTableChange: se, analysisType: K, isFunnelMode: ce = !1, funnelServerQuery: le, funnelDebugData: ue, flowServerQuery: de, flowDebugData: fe, retentionServerQuery: pe, retentionDebugData: me, retentionChartData: q, retentionValidation: ge, warnings: _e, highlightedFields: ve, onSchemaFieldClick: ye }) {
	let { t: J } = y(), Y = K === "funnel" || ce, X = K === "flow", Z = K === "retention", { features: be } = e(), [xe, Se] = H(!1), [Ce, we] = H(!1), [Q, Ee] = H(0), [De, Oe] = H(!1), [ke, Ae] = H(!1), [je, Me] = H(!1), [Ne, Pe] = H("idle");
	z(() => {
		let e = (e) => {
			e.key === "Shift" && Ae(!0);
		}, t = (e) => {
			e.key === "Shift" && Ae(!1);
		};
		return window.addEventListener("keydown", e), window.addEventListener("keyup", t), () => {
			window.removeEventListener("keydown", e), window.removeEventListener("keyup", t);
		};
	}, []);
	let Ie = ke && je;
	z(() => {
		O.length > 0 && Q >= O.length && Ee(O.length - 1);
	}, [O.length, Q]);
	let ze = Le(O, Q), Ke = ze.sql, qe = ze.analysis, Je = ze.loading, Ye = ze.error, $ = g?.[Q] ?? h?.[Q] ?? null, Xe = !!(g?.length && g[Q]), Ze = R(() => {
		if (!qe) return;
		let e = Fe(qe, $, Ke);
		navigator.clipboard.writeText(e).then(() => {
			Pe("copied"), setTimeout(() => Pe("idle"), 2e3);
		});
	}, [
		qe,
		$,
		Ke
	]), { explainResult: Qe, isLoading: $e, hasRun: et, error: tt, runExplain: nt, clearExplain: rt } = b($, { skip: Y || X || Z || !$ }), { explainResult: it, isLoading: at, hasRun: ot, error: st, runExplain: ct, clearExplain: lt } = b(le, { skip: !Y || !le }), { explainResult: ut, isLoading: dt, hasRun: ft, error: pt, runExplain: mt, clearExplain: ht } = b(de, { skip: !X || !de }), { explainResult: gt, isLoading: _t, hasRun: vt, error: yt, runExplain: bt } = b(pe, { skip: !Z || !pe }), { analysis: xt, isAnalyzing: St, error: Ct, analyze: wt, clearAnalysis: Tt } = x();
	z(() => {
		rt();
	}, [Q, rt]), z(() => {
		lt();
	}, [le, lt]), z(() => {
		ht();
	}, [de, ht]);
	let Et = V(!0), Dt = D?.[s]?.available ?? !0, Ot = Re({
		isCurrentChartRenderable: Dt,
		isFlowMode: X,
		isFunnelMode: Y,
		isRetentionMode: Z
	}), kt = D?.[s]?.reason, At = We(Ot, kt, J);
	z(() => {
		if (Et.current) {
			Et.current = !1;
			return;
		}
		K === "funnel" || K === "flow" || K === "retention" || Y || !Dt && _ === "chart" && v("table");
	}, [
		Dt,
		_,
		v,
		Y,
		K
	]);
	let jt = B(() => {
		if (!h || h.length === 0) return;
		if (h.length === 1) return h[0];
		let e = h.flatMap((e) => e?.measures || []);
		return {
			...h[0],
			measures: e
		};
	}, [h]), Mt = o("success"), Nt = o("error"), Pt = o("warning"), Ft = o("table"), It = o("measure"), Lt = o("sparkles"), Rt = () => /* @__PURE__ */ W("div", {
		className: "dc:h-full dc:flex dc:items-center dc:justify-center",
		children: /* @__PURE__ */ G("div", {
			className: "dc:text-center",
			children: [
				/* @__PURE__ */ W("div", {
					className: "dc:animate-spin dc:rounded-full dc:h-12 dc:w-12 dc:border-b-2 dc:mx-auto dc:mb-4",
					style: { borderBottomColor: "var(--dc-primary)" }
				}),
				/* @__PURE__ */ W("div", {
					className: "dc:text-sm dc:font-semibold text-dc-text-secondary dc:mb-1",
					children: J("results.loading.title")
				}),
				/* @__PURE__ */ W("div", {
					className: "dc:text-xs text-dc-text-muted",
					children: J("results.loading.subtitle")
				})
			]
		})
	}), zt = () => /* @__PURE__ */ G("div", {
		className: "dc:h-full dc:flex dc:flex-col",
		children: [dn(), /* @__PURE__ */ W("div", {
			className: "dc:flex-1 dc:flex dc:items-center dc:justify-center dc:p-4",
			children: Ce ? /* @__PURE__ */ W("div", {
				className: "dc:w-full dc:h-full",
				children: /* @__PURE__ */ W(P.Suspense, {
					fallback: null,
					children: /* @__PURE__ */ W(Ge, {
						height: "100%",
						highlightedFields: ve,
						onFieldClick: ye
					})
				})
			}) : xe ? /* @__PURE__ */ W("div", {
				className: "dc:w-full dc:h-full dc:overflow-auto",
				children: nn()
			}) : /* @__PURE__ */ G("div", {
				className: "dc:text-center dc:max-w-md",
				children: [
					/* @__PURE__ */ W(Nt, { className: "dc:w-12 dc:h-12 dc:mx-auto text-dc-error dc:mb-4" }),
					/* @__PURE__ */ W("div", {
						className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-2",
						children: J("results.error.title")
					}),
					/* @__PURE__ */ W("div", {
						className: "dc:text-sm text-dc-text-secondary dc:mb-4",
						children: J("results.error.subtitle")
					}),
					r && /* @__PURE__ */ W("div", {
						className: "bg-dc-danger-bg dc:border border-dc-error dc:rounded-lg dc:p-3 dc:text-left",
						children: /* @__PURE__ */ W("div", {
							className: "dc:text-xs dc:font-mono text-dc-error dc:break-words",
							children: r
						})
					})
				]
			})
		})]
	}), Bt = !!h?.some((e) => e?.measures && e.measures.length > 0 || e?.dimensions && e.dimensions.length > 0 || e?.timeDimensions && e.timeDimensions.length > 0), Vt = B(() => Z ? pe !== null : Y ? le !== null : X ? de !== null : Bt, [
		Z,
		Y,
		X,
		pe,
		le,
		de,
		Bt
	]), Ht = () => /* @__PURE__ */ W("div", {
		className: "dc:h-full dc:flex dc:items-center dc:justify-center",
		children: /* @__PURE__ */ G("div", {
			className: "dc:text-center",
			children: [
				/* @__PURE__ */ W("div", {
					className: "dc:animate-spin dc:rounded-full dc:h-12 dc:w-12 dc:border-b-2 dc:mx-auto dc:mb-4",
					style: { borderBottomColor: "var(--dc-primary)" }
				}),
				/* @__PURE__ */ W("div", {
					className: "dc:text-sm dc:font-semibold text-dc-text-secondary dc:mb-1",
					children: J("results.waiting.title")
				}),
				/* @__PURE__ */ W("div", {
					className: "dc:text-xs text-dc-text-muted",
					children: J("results.waiting.subtitle")
				})
			]
		})
	}), Ut = () => /* @__PURE__ */ W("div", {
		className: "dc:h-full dc:flex dc:items-center dc:justify-center",
		children: /* @__PURE__ */ G("div", {
			className: "dc:text-center",
			children: [
				/* @__PURE__ */ W("svg", {
					className: "dc:w-12 dc:h-12 dc:mx-auto text-dc-warning dc:mb-4",
					fill: "none",
					viewBox: "0 0 24 24",
					stroke: "currentColor",
					children: /* @__PURE__ */ W("path", {
						strokeLinecap: "round",
						strokeLinejoin: "round",
						strokeWidth: 1.5,
						d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					})
				}),
				/* @__PURE__ */ W("div", {
					className: "dc:text-sm dc:font-semibold text-dc-text-secondary dc:mb-1",
					children: J("results.needsRefresh.title")
				}),
				/* @__PURE__ */ W("div", {
					className: "dc:text-xs text-dc-text-muted dc:mb-4",
					children: J("results.needsRefresh.subtitle")
				}),
				M && /* @__PURE__ */ G("button", {
					onClick: () => M(),
					className: "dc:inline-flex dc:items-center dc:gap-2 dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-white bg-dc-accent dc:hover:opacity-90 dc:rounded-lg dc:transition-colors dc:shadow-sm",
					children: [/* @__PURE__ */ W("svg", {
						className: "dc:w-4 dc:h-4",
						fill: "none",
						viewBox: "0 0 24 24",
						stroke: "currentColor",
						children: /* @__PURE__ */ W("path", {
							strokeLinecap: "round",
							strokeLinejoin: "round",
							strokeWidth: 2,
							d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						})
					}), J("results.needsRefresh.runButton")]
				})
			]
		})
	}), Wt = () => {
		let e = J("results.empty.query");
		return Z ? e = J("results.empty.retention") : Y ? e = J("results.empty.funnel") : X && (e = J("results.empty.flow")), /* @__PURE__ */ W("div", {
			className: "dc:h-full dc:flex dc:items-center dc:justify-center dc:pt-6",
			children: /* @__PURE__ */ G("div", {
				className: "dc:text-center dc:mb-16",
				children: [
					/* @__PURE__ */ W(It, { className: "dc:w-12 dc:h-12 dc:mx-auto text-dc-text-muted dc:mb-3" }),
					/* @__PURE__ */ W("div", {
						className: "dc:text-sm dc:font-semibold text-dc-text-secondary dc:mb-1",
						children: J("results.empty.title")
					}),
					/* @__PURE__ */ W("div", {
						className: "dc:text-xs text-dc-text-muted dc:mb-4",
						children: e
					}),
					te && re && !Z && !Y && !X && /* @__PURE__ */ G("button", {
						onClick: re,
						className: "dc:inline-flex dc:items-center dc:gap-2 dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-white bg-dc-accent hover:bg-dc-accent dc:rounded-lg dc:transition-colors dc:shadow-sm",
						children: [/* @__PURE__ */ W(Lt, { className: "dc:w-4 dc:h-4" }), J("results.ai.button")]
					})
				]
			})
		});
	}, Gt = () => /* @__PURE__ */ W("div", {
		className: "dc:h-full dc:flex dc:items-center dc:justify-center",
		children: /* @__PURE__ */ G("div", {
			className: "dc:text-center",
			children: [
				/* @__PURE__ */ W(Mt, { className: "dc:w-12 dc:h-12 dc:mx-auto text-dc-success dc:mb-3" }),
				/* @__PURE__ */ W("div", {
					className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-1",
					children: J("results.noData.title")
				}),
				/* @__PURE__ */ W("div", {
					className: "dc:text-xs text-dc-text-muted",
					children: J("results.noData.subtitle")
				})
			]
		})
	}), Kt = () => {
		if (!n || n.length === 0) return /* @__PURE__ */ W("div", {
			className: "dc:flex dc:items-center dc:justify-center dc:h-full text-dc-text-muted",
			children: /* @__PURE__ */ G("div", {
				className: "dc:text-center",
				children: [
					/* @__PURE__ */ W(It, { className: "dc:w-12 dc:h-12 dc:mx-auto dc:mb-3 dc:opacity-50" }),
					/* @__PURE__ */ W("div", {
						className: "dc:text-sm dc:font-semibold dc:mb-1",
						children: J("results.chart.noData")
					}),
					/* @__PURE__ */ W("div", {
						className: "dc:text-xs",
						children: J("results.chart.noDataHint")
					})
				]
			})
		});
		let e = s === "sankey" && d?.flowVisualization === "sunburst" ? "sunburst" : s;
		return S(e) ? /* @__PURE__ */ W(C, {
			chartType: e,
			data: Z && q ? q : n,
			chartConfig: u,
			displayConfig: d,
			colorPalette: f,
			queryObject: jt,
			height: "100%",
			fallback: /* @__PURE__ */ W("div", {
				className: "dc:flex dc:items-center dc:justify-center dc:h-full",
				children: /* @__PURE__ */ W("div", { className: "dc:animate-pulse bg-dc-surface-secondary dc:rounded-sm dc:w-full dc:h-full" })
			})
		}) : /* @__PURE__ */ W("div", {
			className: "dc:flex dc:items-center dc:justify-center dc:h-full text-dc-text-muted",
			children: /* @__PURE__ */ G("div", {
				className: "dc:text-center",
				children: [
					/* @__PURE__ */ W(Pt, { className: "dc:w-12 dc:h-12 dc:mx-auto dc:mb-3 dc:opacity-50" }),
					/* @__PURE__ */ W("div", {
						className: "dc:text-sm dc:font-semibold dc:mb-1",
						children: J("results.chart.unsupported")
					}),
					/* @__PURE__ */ W("div", {
						className: "dc:text-xs",
						children: e
					})
				]
			})
		});
	}, qt = () => r ? /* @__PURE__ */ G("div", {
		className: "bg-dc-danger-bg dark:bg-dc-danger-bg dc:border border-dc-error dark:border-dc-error dc:rounded-sm dc:p-3",
		children: [/* @__PURE__ */ W("h4", {
			className: "dc:text-sm dc:font-semibold text-dc-error dark:text-dc-error dc:mb-1",
			children: J("results.debug.executionError")
		}), /* @__PURE__ */ W("p", {
			className: "dc:text-sm text-dc-error dark:text-dc-error",
			children: r
		})]
	}) : null, Jt = () => /* @__PURE__ */ G("div", {
		className: "dc:grid dc:grid-cols-1 dc:md:grid-cols-2 dc:gap-4",
		children: [/* @__PURE__ */ W("div", { children: /* @__PURE__ */ W(c, {
			code: JSON.stringify(u, null, 2),
			language: "json",
			title: J("results.debug.chartConfig"),
			height: "16rem"
		}) }), /* @__PURE__ */ W("div", { children: /* @__PURE__ */ W(c, {
			code: JSON.stringify(d, null, 2),
			language: "json",
			title: J("results.debug.displayConfig"),
			height: "16rem"
		}) })]
	}), Yt = (e) => /* @__PURE__ */ W("div", { children: n ? /* @__PURE__ */ W(c, {
		code: JSON.stringify(n, null, 2),
		language: "json",
		title: e || `${J("results.debug.serverResponse")} (${n.length} ${J("results.header.rows")})`,
		maxHeight: "24rem"
	}) : /* @__PURE__ */ G(U, { children: [/* @__PURE__ */ W("h4", {
		className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-2",
		children: J("results.debug.serverResponse")
	}), /* @__PURE__ */ W("div", {
		className: "bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm dc:p-3 text-dc-text-muted dc:text-sm",
		children: J("results.debug.noResults")
	})] }) }), Xt = () => /* @__PURE__ */ W("div", { children: q ? /* @__PURE__ */ W(c, {
		code: JSON.stringify(q, null, 2),
		language: "json",
		title: `Server Response (${q.rows.length} rows, ${q.periods.length} periods)`,
		maxHeight: "24rem"
	}) : Yt() }), Zt = (e) => {
		let t = e.debugData?.sql, n = e.debugData?.loading || !1, r = e.debugData?.error || null;
		return /* @__PURE__ */ G("div", {
			className: "dc:p-4 dc:space-y-4 dc:overflow-auto dc:h-full",
			children: [
				/* @__PURE__ */ G("div", {
					className: "dc:flex dc:items-center dc:gap-2 dc:mb-4",
					children: [
						/* @__PURE__ */ W("span", {
							className: "dc:px-2 dc:py-1 dc:text-xs dc:font-medium bg-dc-accent text-white dc:rounded-sm",
							children: e.label
						}),
						e.badgeText && /* @__PURE__ */ W("span", {
							className: "dc:text-xs text-dc-text-muted",
							children: e.badgeText
						}),
						n && /* @__PURE__ */ W("span", {
							className: "dc:text-xs text-dc-text-muted dc:animate-pulse",
							children: J("results.debug.loadingSql")
						})
					]
				}),
				qt(),
				/* @__PURE__ */ W("div", { children: e.serverQuery ? /* @__PURE__ */ W(c, {
					code: JSON.stringify(e.serverQuery, null, 2),
					language: "json",
					title: e.serverQueryTitle,
					height: "16rem"
				}) : e.serverQueryMissing }),
				/* @__PURE__ */ W(E, {
					sql: t,
					sqlLoading: n,
					sqlError: r,
					sqlPlaceholder: e.sqlPlaceholder,
					explainResult: e.explainResult,
					explainLoading: e.explainLoading,
					explainHasRun: e.explainHasRun,
					explainError: e.explainError,
					runExplain: e.runExplain,
					aiAnalysis: xt,
					aiAnalysisLoading: St,
					aiAnalysisError: Ct,
					runAIAnalysis: wt,
					clearAIAnalysis: Tt,
					enableAI: te,
					query: e.serverQuery,
					title: "Generated SQL",
					height: "16rem"
				}),
				e.metadataTitle && e.metadataSection && /* @__PURE__ */ G("div", { children: [/* @__PURE__ */ W("h4", {
					className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-2",
					children: e.metadataTitle
				}), /* @__PURE__ */ W("div", {
					className: "bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm dc:p-3",
					children: e.metadataSection
				})] }),
				e.extraSection,
				Jt(),
				e.responseSection
			]
		});
	}, Qt = () => /* @__PURE__ */ G("div", {
		className: "dc:p-4 dc:space-y-4 dc:overflow-auto dc:h-full",
		children: [
			O.length > 1 && /* @__PURE__ */ G("div", {
				className: "dc:flex dc:items-center dc:gap-1 dc:mb-4",
				children: [/* @__PURE__ */ W("span", {
					className: "dc:text-xs dc:font-medium text-dc-text-muted dc:mr-2",
					children: J("results.debug.query")
				}), /* @__PURE__ */ W("div", {
					className: "dc:flex dc:border border-dc-border dc:rounded-md dc:overflow-hidden",
					children: O.map((e, t) => /* @__PURE__ */ G("button", {
						onClick: () => Ee(t),
						className: `dc:px-3 dc:py-1 dc:text-xs dc:font-medium dc:transition-colors dc:border-r dc:last:border-r-0 border-dc-border ${Q === t ? "bg-dc-accent text-white" : "bg-dc-bg text-dc-text-secondary hover:bg-dc-bg-secondary"}`,
						children: [
							"Q",
							t + 1,
							e.loading && /* @__PURE__ */ W("span", {
								className: "dc:ml-1 dc:opacity-70",
								children: "•"
							}),
							e.error && /* @__PURE__ */ W("span", {
								className: "dc:ml-1 text-dc-error",
								children: "!"
							})
						]
					}, t))
				})]
			}),
			r && /* @__PURE__ */ G("div", {
				className: "bg-dc-danger-bg dark:bg-dc-danger-bg dc:border border-dc-error dark:border-dc-error dc:rounded-sm dc:p-3",
				children: [/* @__PURE__ */ W("h4", {
					className: "dc:text-sm dc:font-semibold text-dc-error dark:text-dc-error dc:mb-1",
					children: J("results.debug.executionError")
				}), /* @__PURE__ */ W("p", {
					className: "dc:text-sm text-dc-error dark:text-dc-error",
					children: r
				})]
			}),
			/* @__PURE__ */ G("div", { children: [/* @__PURE__ */ G("div", {
				className: "dc:flex dc:items-center dc:justify-between dc:mb-2",
				children: [/* @__PURE__ */ W("h4", {
					className: "dc:text-sm dc:font-semibold text-dc-text",
					children: J("results.debug.queryAnalysis")
				}), qe && /* @__PURE__ */ W("button", {
					onClick: Ze,
					className: "dc:px-2 dc:py-1 dc:text-xs dc:font-medium dc:rounded-sm dc:border border-dc-border bg-dc-surface hover:bg-dc-surface-hover text-dc-text-secondary hover:text-dc-text dc:transition-colors dc:flex dc:items-center dc:gap-1",
					title: J("results.debug.copyMarkdownTitle"),
					children: Ne === "copied" ? /* @__PURE__ */ G(U, { children: [/* @__PURE__ */ W("span", {
						className: "text-dc-success",
						children: "✓"
					}), J("common.actions.copied")] }) : /* @__PURE__ */ W(U, { children: `📋 ${J("results.debug.copyAsMarkdown")}` })
				})]
			}), Je ? /* @__PURE__ */ W("div", {
				className: "bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm dc:p-3 text-dc-text-muted dc:text-sm",
				children: J("common.loading")
			}) : qe ? /* @__PURE__ */ W("div", {
				className: "bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm dc:p-3",
				children: /* @__PURE__ */ W(he, { analysis: qe })
			}) : /* @__PURE__ */ W("div", {
				className: "bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm dc:p-3 text-dc-text-muted dc:text-sm",
				children: J(Ye ? "results.debug.analysisError" : "results.debug.analysisEmpty")
			})] }),
			/* @__PURE__ */ W("div", { children: $ ? /* @__PURE__ */ G(U, { children: [/* @__PURE__ */ W(c, {
				code: JSON.stringify($, null, 2),
				language: "json",
				title: J(Xe ? "results.debug.cubeQueryExecuted" : "results.debug.cubeQuery"),
				height: "16rem"
			}), Xe && Q > 0 && /* @__PURE__ */ G("div", {
				className: "dc:mt-1 dc:text-xs text-dc-text-muted",
				children: [
					/* @__PURE__ */ W("span", {
						className: "text-dc-accent",
						children: "ℹ"
					}),
					" ",
					J("results.debug.funnelFilterHint")
				]
			})] }) : /* @__PURE__ */ G(U, { children: [/* @__PURE__ */ W("h4", {
				className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-2",
				children: J("results.debug.cubeQuery")
			}), /* @__PURE__ */ W("div", {
				className: "bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm dc:p-3 text-dc-text-muted dc:text-sm dc:h-64 dc:overflow-auto",
				children: J("results.debug.noQuery")
			})] }) }),
			/* @__PURE__ */ W(E, {
				sql: Ke,
				sqlLoading: Je,
				sqlError: Ye,
				sqlPlaceholder: J("results.debug.standard.sqlPlaceholder"),
				explainResult: Qe,
				explainLoading: $e,
				explainHasRun: et,
				explainError: tt,
				runExplain: nt,
				aiAnalysis: xt,
				aiAnalysisLoading: St,
				aiAnalysisError: Ct,
				runAIAnalysis: wt,
				clearAIAnalysis: Tt,
				enableAI: te,
				query: $,
				title: "Generated SQL",
				height: "16rem"
			}),
			/* @__PURE__ */ G("div", {
				className: "dc:grid dc:grid-cols-1 dc:md:grid-cols-2 dc:gap-4",
				children: [/* @__PURE__ */ W("div", { children: /* @__PURE__ */ W(c, {
					code: JSON.stringify(u, null, 2),
					language: "json",
					title: J("results.debug.chartConfig"),
					height: "16rem"
				}) }), /* @__PURE__ */ W("div", { children: /* @__PURE__ */ W(c, {
					code: JSON.stringify(d, null, 2),
					language: "json",
					title: J("results.debug.displayConfig"),
					height: "16rem"
				}) })]
			}),
			/* @__PURE__ */ W("div", { children: n ? /* @__PURE__ */ W(c, {
				code: JSON.stringify(n, null, 2),
				language: "json",
				title: `${J("results.debug.serverResponse")} (${n.length} ${J("results.header.rows")})`,
				maxHeight: "24rem"
			}) : /* @__PURE__ */ G(U, { children: [/* @__PURE__ */ W("h4", {
				className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-2",
				children: J("results.debug.serverResponse")
			}), /* @__PURE__ */ W("div", {
				className: "bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm dc:p-3 text-dc-text-muted dc:text-sm",
				children: J("results.debug.noResults")
			})] }) })
		]
	}), $t = () => {
		let e = ue?.modeMetadata, t = e ? /* @__PURE__ */ W("div", {
			className: "dc:flex dc:flex-wrap dc:gap-2",
			children: e.steps.map((e, t) => /* @__PURE__ */ G("div", {
				className: "dc:flex dc:items-center dc:gap-2 dc:px-3 dc:py-1.5 bg-dc-bg dc:border border-dc-border dc:rounded-sm dc:text-sm",
				children: [
					/* @__PURE__ */ W("span", {
						className: "dc:w-5 dc:h-5 dc:flex dc:items-center dc:justify-center bg-dc-accent text-white dc:text-xs dc:rounded-full",
						children: t + 1
					}),
					/* @__PURE__ */ W("span", {
						className: "text-dc-text",
						children: e.name
					}),
					e.timeToConvert && /* @__PURE__ */ G("span", {
						className: "dc:text-xs text-dc-text-muted",
						children: [
							"(",
							e.timeToConvert,
							")"
						]
					})
				]
			}, t))
		}) : null;
		return Zt({
			label: J("results.debug.funnel.label"),
			badgeText: e?.stepCount ? J("results.debug.funnel.steps", { count: e.stepCount }) : void 0,
			serverQuery: le,
			serverQueryTitle: J("results.debug.funnel.serverQuery"),
			serverQueryMissing: /* @__PURE__ */ G(U, { children: [/* @__PURE__ */ W("h4", {
				className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-2",
				children: J("results.debug.funnel.serverQuery")
			}), /* @__PURE__ */ W("div", {
				className: "bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm dc:p-3 text-dc-text-muted dc:text-sm dc:h-64 dc:overflow-auto",
				children: J("results.debug.funnel.noQuery")
			})] }),
			debugData: ue,
			sqlPlaceholder: J("results.debug.funnel.sqlPlaceholder"),
			explainResult: it,
			explainLoading: at,
			explainHasRun: ot,
			explainError: st,
			runExplain: ct,
			metadataTitle: t ? J("results.debug.funnel.stepsTitle") : void 0,
			metadataSection: t,
			responseSection: Yt()
		});
	}, en = () => {
		let e = me?.modeMetadata, t = e ? /* @__PURE__ */ G("div", {
			className: "dc:grid dc:grid-cols-2 dc:gap-4 dc:text-sm",
			children: [
				/* @__PURE__ */ G("div", { children: [
					/* @__PURE__ */ W("span", {
						className: "text-dc-text-muted",
						children: J("results.debug.retention.retentionType")
					}),
					" ",
					/* @__PURE__ */ W("span", {
						className: "text-dc-text",
						children: e.retentionType || "Classic"
					})
				] }),
				/* @__PURE__ */ G("div", { children: [
					/* @__PURE__ */ W("span", {
						className: "text-dc-text-muted",
						children: J("results.debug.retention.periods")
					}),
					" ",
					/* @__PURE__ */ W("span", {
						className: "text-dc-text",
						children: e.periods ?? J("results.debug.flow.notSet")
					})
				] }),
				/* @__PURE__ */ G("div", { children: [
					/* @__PURE__ */ W("span", {
						className: "text-dc-text-muted",
						children: J("results.debug.retention.granularity")
					}),
					" ",
					/* @__PURE__ */ W("span", {
						className: "text-dc-text",
						children: e.granularity || "Week"
					})
				] }),
				/* @__PURE__ */ G("div", { children: [
					/* @__PURE__ */ W("span", {
						className: "text-dc-text-muted",
						children: J("results.debug.retention.segments")
					}),
					" ",
					/* @__PURE__ */ W("span", {
						className: "text-dc-text",
						children: e.segmentCount || 1
					})
				] })
			]
		}) : null, n = q?.summary ? /* @__PURE__ */ G("div", { children: [/* @__PURE__ */ W("h4", {
			className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-2",
			children: J("results.debug.retention.summaryTitle")
		}), /* @__PURE__ */ W("div", {
			className: "bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm dc:p-3",
			children: /* @__PURE__ */ G("div", {
				className: "dc:grid dc:grid-cols-3 dc:gap-4 dc:text-sm",
				children: [
					/* @__PURE__ */ G("div", { children: [
						/* @__PURE__ */ W("span", {
							className: "text-dc-text-muted",
							children: J("results.debug.retention.avgPeriod1")
						}),
						" ",
						/* @__PURE__ */ G("span", {
							className: "text-dc-text dc:font-medium",
							children: [(q.summary.avgPeriod1Retention * 100).toFixed(1), "%"]
						})
					] }),
					/* @__PURE__ */ G("div", { children: [
						/* @__PURE__ */ W("span", {
							className: "text-dc-text-muted",
							children: J("results.debug.retention.maxPeriod1")
						}),
						" ",
						/* @__PURE__ */ G("span", {
							className: "text-dc-text dc:font-medium",
							children: [(q.summary.maxPeriod1Retention * 100).toFixed(1), "%"]
						})
					] }),
					/* @__PURE__ */ G("div", { children: [
						/* @__PURE__ */ W("span", {
							className: "text-dc-text-muted",
							children: J("results.debug.retention.minPeriod1")
						}),
						" ",
						/* @__PURE__ */ G("span", {
							className: "text-dc-text dc:font-medium",
							children: [(q.summary.minPeriod1Retention * 100).toFixed(1), "%"]
						})
					] })
				]
			})
		})] }) : null;
		return Zt({
			label: J("results.debug.retention.label"),
			badgeText: e ? J("results.debug.retention.badge", {
				segments: e.segmentCount || 1,
				users: e.totalUsers
			}) : void 0,
			serverQuery: pe,
			serverQueryTitle: J("results.debug.retention.serverQuery"),
			serverQueryMissing: /* @__PURE__ */ G(U, { children: [/* @__PURE__ */ W("h4", {
				className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-2",
				children: J("results.debug.retention.serverQuery")
			}), /* @__PURE__ */ G("div", {
				className: "bg-dc-warning-bg dc:border border-dc-warning dc:rounded-sm dc:p-3 dc:text-sm dc:h-64 dc:overflow-auto",
				children: [/* @__PURE__ */ W("div", {
					className: "text-dc-warning dc:font-medium dc:mb-2",
					children: J("results.debug.retention.configIncomplete")
				}), ge && ge.errors.length > 0 ? /* @__PURE__ */ W("ul", {
					className: "list-disc dc:list-inside text-dc-text-secondary dc:space-y-1",
					children: ge.errors.map((e, t) => /* @__PURE__ */ W("li", { children: e }, t))
				}) : /* @__PURE__ */ W("p", {
					className: "text-dc-text-muted",
					children: J("results.debug.retention.configHint")
				})]
			})] }),
			debugData: me,
			sqlPlaceholder: J("results.debug.retention.sqlPlaceholder"),
			explainResult: gt,
			explainLoading: _t,
			explainHasRun: vt,
			explainError: yt,
			runExplain: bt,
			metadataTitle: t ? J("results.debug.retention.configTitle") : void 0,
			metadataSection: t,
			extraSection: n,
			responseSection: Xt()
		});
	}, tn = () => {
		let e = fe?.modeMetadata, t = e ? /* @__PURE__ */ G("div", {
			className: "dc:grid dc:grid-cols-2 dc:gap-4 dc:text-sm",
			children: [
				/* @__PURE__ */ G("div", { children: [
					/* @__PURE__ */ W("span", {
						className: "text-dc-text-muted",
						children: J("results.debug.flow.startingStep")
					}),
					" ",
					/* @__PURE__ */ W("span", {
						className: "text-dc-text",
						children: e.startingStep?.name || J("results.debug.flow.notSet")
					})
				] }),
				/* @__PURE__ */ G("div", { children: [
					/* @__PURE__ */ W("span", {
						className: "text-dc-text-muted",
						children: J("results.debug.flow.eventDimension")
					}),
					" ",
					/* @__PURE__ */ W("span", {
						className: "text-dc-text",
						children: e.eventDimension || J("results.debug.flow.notSet")
					})
				] }),
				/* @__PURE__ */ G("div", { children: [
					/* @__PURE__ */ W("span", {
						className: "text-dc-text-muted",
						children: J("results.debug.flow.stepsBefore")
					}),
					" ",
					/* @__PURE__ */ W("span", {
						className: "text-dc-text",
						children: e.stepsBefore ?? J("results.debug.flow.notSet")
					})
				] }),
				/* @__PURE__ */ G("div", { children: [
					/* @__PURE__ */ W("span", {
						className: "text-dc-text-muted",
						children: J("results.debug.flow.stepsAfter")
					}),
					" ",
					/* @__PURE__ */ W("span", {
						className: "text-dc-text",
						children: e.stepsAfter ?? J("results.debug.flow.notSet")
					})
				] })
			]
		}) : null;
		return Zt({
			label: J("results.debug.flow.label"),
			badgeText: e ? `${e.stepsBefore} before, ${e.stepsAfter} after` : void 0,
			serverQuery: de,
			serverQueryTitle: J("results.debug.flow.serverQuery"),
			serverQueryMissing: /* @__PURE__ */ G(U, { children: [/* @__PURE__ */ W("h4", {
				className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-2",
				children: J("results.debug.flow.serverQuery")
			}), /* @__PURE__ */ W("div", {
				className: "bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm dc:p-3 text-dc-text-muted dc:text-sm dc:h-64 dc:overflow-auto",
				children: J("results.debug.flow.noQuery")
			})] }),
			debugData: fe,
			sqlPlaceholder: J("results.debug.flow.sqlPlaceholder"),
			explainResult: ut,
			explainLoading: dt,
			explainHasRun: ft,
			explainError: pt,
			runExplain: mt,
			metadataTitle: t ? J("results.debug.flow.configTitle") : void 0,
			metadataSection: t,
			responseSection: Yt(J("results.debug.flow.responseTitle"))
		});
	}, nn = () => Y ? $t() : Z ? en() : X ? tn() : Qt(), rn = Ue(Y, ie, ae), an = () => {
		let e = [], t = [];
		if (!n || Array.isArray(n) && n.length === 0) return /* @__PURE__ */ W("div", {
			className: "dc:flex dc:items-center dc:justify-center dc:h-full text-dc-text-muted",
			children: /* @__PURE__ */ G("div", {
				className: "dc:text-center",
				children: [
					/* @__PURE__ */ W(Ft, { className: "dc:w-12 dc:h-12 dc:mx-auto dc:mb-3 dc:opacity-50" }),
					/* @__PURE__ */ W("div", {
						className: "dc:text-sm dc:font-semibold dc:mb-1",
						children: J("results.flow.noData")
					}),
					/* @__PURE__ */ W("div", {
						className: "dc:text-xs",
						children: J("results.flow.noDataHint")
					})
				]
			})
		});
		if (Array.isArray(n) && n.length > 0) {
			let r = n[0];
			r && "nodes" in r && "links" in r ? (e = r.nodes || [], t = r.links || []) : "record_type" in r && (e = n.filter((e) => e.record_type === "node"), t = n.filter((e) => e.record_type === "link"));
		}
		return e.length === 0 && t.length === 0 ? /* @__PURE__ */ W("div", {
			className: "dc:flex dc:items-center dc:justify-center dc:h-full text-dc-text-muted",
			children: /* @__PURE__ */ G("div", {
				className: "dc:text-center",
				children: [
					/* @__PURE__ */ W(Ft, { className: "dc:w-12 dc:h-12 dc:mx-auto dc:mb-3 dc:opacity-50" }),
					/* @__PURE__ */ W("div", {
						className: "dc:text-sm dc:font-semibold dc:mb-1",
						children: J("results.flow.noData")
					}),
					/* @__PURE__ */ W("div", {
						className: "dc:text-xs",
						children: J("results.flow.noDataHint")
					})
				]
			})
		}) : /* @__PURE__ */ G("div", {
			className: "dc:h-full dc:overflow-auto dc:p-4 dc:space-y-6",
			children: [/* @__PURE__ */ G("div", { children: [/* @__PURE__ */ W("h3", {
				className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-2",
				children: J("results.flow.nodes", { count: e.length })
			}), /* @__PURE__ */ W("div", {
				className: "dc:border border-dc-border dc:rounded-sm dc:overflow-hidden",
				children: /* @__PURE__ */ G("table", {
					className: "dc:w-full dc:text-sm",
					children: [/* @__PURE__ */ W("thead", {
						className: "bg-dc-surface-secondary",
						children: /* @__PURE__ */ G("tr", { children: [
							/* @__PURE__ */ W("th", {
								className: "dc:px-3 dc:py-2 dc:text-left dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider",
								children: J("results.flow.layer")
							}),
							/* @__PURE__ */ W("th", {
								className: "dc:px-3 dc:py-2 dc:text-left dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider",
								children: J("results.flow.name")
							}),
							/* @__PURE__ */ W("th", {
								className: "dc:px-3 dc:py-2 dc:text-right dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider",
								children: J("results.flow.count")
							})
						] })
					}), /* @__PURE__ */ W("tbody", {
						className: "dc:divide-y divide-dc-border bg-dc-surface",
						children: e.sort((e, t) => e.layer - t.layer).map((e, t) => /* @__PURE__ */ G("tr", {
							className: "hover:bg-dc-surface-hover",
							children: [
								/* @__PURE__ */ W("td", {
									className: "dc:px-3 dc:py-2 dc:whitespace-nowrap",
									children: /* @__PURE__ */ W("span", {
										className: `dc:inline-flex dc:items-center dc:justify-center dc:w-6 dc:h-6 dc:rounded-sm dc:text-xs dc:font-medium ${e.layer === 0 ? "bg-dc-primary text-white" : e.layer < 0 ? "bg-dc-accent-bg text-dc-accent" : "bg-dc-success-bg text-dc-success"}`,
										children: e.layer === 0 ? "★" : e.layer
									})
								}),
								/* @__PURE__ */ W("td", {
									className: "dc:px-3 dc:py-2 text-dc-text",
									children: e.name
								}),
								/* @__PURE__ */ W("td", {
									className: "dc:px-3 dc:py-2 dc:text-right text-dc-text dc:font-mono",
									children: e.value?.toLocaleString()
								})
							]
						}, t))
					})]
				})
			})] }), /* @__PURE__ */ G("div", { children: [/* @__PURE__ */ W("h3", {
				className: "dc:text-sm dc:font-semibold text-dc-text dc:mb-2",
				children: J("results.flow.transitions", { count: t.length })
			}), /* @__PURE__ */ W("div", {
				className: "dc:border border-dc-border dc:rounded-sm dc:overflow-hidden",
				children: /* @__PURE__ */ G("table", {
					className: "dc:w-full dc:text-sm",
					children: [/* @__PURE__ */ W("thead", {
						className: "bg-dc-surface-secondary",
						children: /* @__PURE__ */ G("tr", { children: [
							/* @__PURE__ */ W("th", {
								className: "dc:px-3 dc:py-2 dc:text-left dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider",
								children: J("results.flow.from")
							}),
							/* @__PURE__ */ W("th", {
								className: "dc:px-3 dc:py-2 dc:text-center dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider",
								children: "→"
							}),
							/* @__PURE__ */ W("th", {
								className: "dc:px-3 dc:py-2 dc:text-left dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider",
								children: J("results.flow.to")
							}),
							/* @__PURE__ */ W("th", {
								className: "dc:px-3 dc:py-2 dc:text-right dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider",
								children: J("results.flow.count")
							})
						] })
					}), /* @__PURE__ */ W("tbody", {
						className: "dc:divide-y divide-dc-border bg-dc-surface",
						children: t.map((e, t) => {
							let { sourceName: n, targetName: r } = He(e);
							return /* @__PURE__ */ G("tr", {
								className: "hover:bg-dc-surface-hover",
								children: [
									/* @__PURE__ */ W("td", {
										className: "dc:px-3 dc:py-2 text-dc-text",
										children: n
									}),
									/* @__PURE__ */ W("td", {
										className: "dc:px-3 dc:py-2 dc:text-center text-dc-text-muted",
										children: "→"
									}),
									/* @__PURE__ */ W("td", {
										className: "dc:px-3 dc:py-2 text-dc-text",
										children: r
									}),
									/* @__PURE__ */ W("td", {
										className: "dc:px-3 dc:py-2 dc:text-right text-dc-text dc:font-mono",
										children: e.value?.toLocaleString()
									})
								]
							}, t);
						})
					})]
				})
			})] })]
		});
	}, on = (e) => {
		let { tableData: t, tableQuery: r } = Ve({
			tableIndex: e,
			isMultiQuery: rn,
			allQueries: h,
			perQueryResults: ae,
			executionResults: n,
			combinedQueryForChart: jt
		});
		if (!t || t.length === 0) return /* @__PURE__ */ W("div", {
			className: "dc:flex dc:items-center dc:justify-center dc:h-full text-dc-text-muted",
			children: /* @__PURE__ */ G("div", {
				className: "dc:text-center",
				children: [
					/* @__PURE__ */ W(Ft, { className: "dc:w-12 dc:h-12 dc:mx-auto dc:mb-3 dc:opacity-50" }),
					/* @__PURE__ */ W("div", {
						className: "dc:text-sm dc:font-semibold dc:mb-1",
						children: "No data to display"
					}),
					/* @__PURE__ */ W("div", {
						className: "dc:text-xs",
						children: J("results.table.noDataHint")
					})
				]
			})
		});
		let i = t.slice(0, w);
		return /* @__PURE__ */ W(C, {
			chartType: "table",
			data: i,
			colorPalette: f,
			queryObject: r,
			height: "100%",
			fallback: /* @__PURE__ */ W("div", {
				className: "dc:flex dc:items-center dc:justify-center dc:h-full",
				children: /* @__PURE__ */ W("div", { className: "dc:animate-pulse bg-dc-surface-secondary dc:rounded-sm dc:w-full dc:h-full" })
			})
		});
	}, sn = () => /* @__PURE__ */ W("div", {
		className: "dc:absolute dc:inset-0 dc:flex dc:items-center dc:justify-center bg-dc-surface bg-opacity-75 dc:z-10",
		children: /* @__PURE__ */ G("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ W("div", {
				className: "dc:animate-spin dc:rounded-full dc:h-10 dc:w-10 dc:border-b-2 dc:mx-auto dc:mb-2",
				style: { borderBottomColor: "var(--dc-primary)" }
			}), /* @__PURE__ */ W("div", {
				className: "dc:text-xs text-dc-text-secondary",
				children: J("results.refreshing")
			})]
		})
	}), cn = {
		executionResults: n,
		executionStatus: t,
		totalRowCount: i,
		resultsStale: a,
		executionError: r,
		debugDataPerQuery: O
	}, ln = {
		displayLimit: w,
		onDisplayLimitChange: T,
		isAIOpen: ne,
		onAIToggle: re,
		onColorPaletteChange: m,
		currentPaletteName: p,
		onShareClick: k,
		shareButtonState: j,
		canShare: A,
		onRefreshClick: M,
		canRefresh: N,
		isRefreshing: F,
		showCacheBustIndicator: Ie,
		setIsHoveringRefresh: Me,
		onClearClick: L,
		canClear: ee,
		setIsClearConfirmOpen: Oe,
		setShowDebug: Se,
		setShowSchema: we
	}, un = {
		activeView: _,
		showDebug: xe,
		showSchema: Ce,
		enableAI: te,
		isFunnelMode: Y,
		showSchemaDiagram: !!be.showSchemaDiagram
	}, dn = () => /* @__PURE__ */ W(Te, {
		summary: cn,
		toolbar: ln,
		display: un
	}), fn = () => !I || !M ? null : /* @__PURE__ */ G("div", {
		className: "dc:px-4 dc:py-2 bg-dc-warning-bg dc:border-b border-dc-warning dc:flex dc:items-center dc:justify-between dc:gap-3 dc:flex-shrink-0",
		children: [/* @__PURE__ */ G("div", {
			className: "dc:flex dc:items-center dc:gap-2 text-dc-warning",
			children: [/* @__PURE__ */ W("svg", {
				className: "dc:w-4 dc:h-4 dc:flex-shrink-0",
				fill: "none",
				viewBox: "0 0 24 24",
				stroke: "currentColor",
				children: /* @__PURE__ */ W("path", {
					strokeLinecap: "round",
					strokeLinejoin: "round",
					strokeWidth: 2,
					d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				})
			}), /* @__PURE__ */ W("span", {
				className: "dc:text-sm dc:font-medium",
				children: J("results.warning.configChanged")
			})]
		}), /* @__PURE__ */ W("button", {
			onClick: () => M(),
			className: "dc:px-3 dc:py-1 dc:text-xs dc:font-medium bg-dc-warning text-white dc:rounded-sm hover:bg-dc-warning/90 dc:transition-colors",
			children: J("results.warning.refreshNow")
		})]
	}), pn = () => !_e || _e.length === 0 ? null : /* @__PURE__ */ W(U, { children: _e.map((e, t) => {
		let n = o("warning"), r = e.severity === "error", i = r ? "bg-dc-danger-bg" : "bg-dc-warning-bg", a = r ? "border-dc-error" : "border-dc-warning", s = r ? "text-dc-error" : "text-dc-warning";
		return /* @__PURE__ */ G("div", {
			className: `dc:px-4 dc:py-2 ${i} dc:border-b ${a} dc:flex dc:items-start dc:gap-3 dc:flex-shrink-0`,
			children: [/* @__PURE__ */ W(n, { className: `dc:w-4 dc:h-4 dc:flex-shrink-0 dc:mt-0.5 ${s}` }), /* @__PURE__ */ G("div", {
				className: "dc:flex-1 dc:min-w-0",
				children: [/* @__PURE__ */ W("div", {
					className: `dc:text-sm dc:font-medium ${s}`,
					children: e.message
				}), e.suggestion && /* @__PURE__ */ G("div", {
					className: `dc:text-xs dc:mt-1 ${s} dc:opacity-80`,
					children: ["💡 ", e.suggestion]
				})]
			})]
		}, `${e.code}-${t}`);
	}) }), mn = () => Ce ? /* @__PURE__ */ W(P.Suspense, {
		fallback: null,
		children: /* @__PURE__ */ W(Ge, {
			height: "100%",
			highlightedFields: ve,
			onFieldClick: ye
		})
	}) : xe ? nn() : _ === "chart" ? /* @__PURE__ */ W("div", {
		className: "dc:p-4 dc:h-full",
		children: Kt()
	}) : X ? /* @__PURE__ */ W("div", {
		className: "dc:h-full",
		children: an()
	}, "table-flow") : rn ? /* @__PURE__ */ W("div", {
		className: "dc:h-full",
		children: on(oe)
	}, `table-${oe}`) : /* @__PURE__ */ W("div", {
		className: "dc:h-full",
		children: on()
	}, "table-single"), hn = () => /* @__PURE__ */ G(U, { children: [Array.from({ length: ie }).map((e, t) => /* @__PURE__ */ G("button", {
		onClick: () => {
			v("table"), se?.(t);
		},
		className: `dc:flex dc:items-center dc:gap-1.5 dc:px-3 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors ${_ === "table" && oe === t ? "bg-dc-primary text-white" : "text-dc-text-secondary hover:bg-dc-surface-hover"}`,
		title: `Table Q${t + 1}`,
		children: [
			/* @__PURE__ */ W(Ft, { className: "dc:w-4 dc:h-4" }),
			"Q",
			t + 1
		]
	}, `table-${t}`)), /* @__PURE__ */ G("button", {
		onClick: () => {
			v("table"), se?.(-1);
		},
		className: `dc:flex dc:items-center dc:gap-1.5 dc:px-3 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors ${_ === "table" && oe === -1 ? "bg-dc-primary text-white" : "text-dc-text-secondary hover:bg-dc-surface-hover"}`,
		title: "Merged table view",
		children: [/* @__PURE__ */ W(Ft, { className: "dc:w-4 dc:h-4" }), J("results.view.merged")]
	})] }), gn = () => /* @__PURE__ */ W("div", {
		className: "dc:px-4 dc:py-3 dc:border-t border-dc-border bg-dc-surface dc:flex dc:justify-center dc:flex-shrink-0",
		children: /* @__PURE__ */ G("div", {
			className: "dc:flex dc:items-center bg-dc-surface-secondary dc:border border-dc-border dc:rounded-md dc:overflow-hidden",
			children: [/* @__PURE__ */ G("button", {
				onClick: () => Ot && v("chart"),
				disabled: !Ot,
				className: `dc:flex dc:items-center dc:gap-1.5 dc:px-4 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors ${_ === "chart" ? "bg-dc-primary text-white" : Ot ? "text-dc-text-secondary hover:bg-dc-surface-hover" : "text-dc-text-disabled bg-dc-surface-tertiary dc:cursor-not-allowed"}`,
				title: At,
				children: [/* @__PURE__ */ W(It, { className: "dc:w-4 dc:h-4" }), J("results.view.chart")]
			}), rn ? hn() : /* @__PURE__ */ G("button", {
				onClick: () => v("table"),
				className: `dc:flex dc:items-center dc:gap-1.5 dc:px-4 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors ${_ === "table" ? "bg-dc-primary text-white" : "text-dc-text-secondary hover:bg-dc-surface-hover"}`,
				title: "Table view",
				children: [/* @__PURE__ */ W(Ft, { className: "dc:w-4 dc:h-4" }), J("results.view.table")]
			})]
		})
	}), _n = () => n && n.length > 0 ? /* @__PURE__ */ G("div", {
		className: "dc:h-full dc:flex dc:flex-col",
		children: [
			dn(),
			fn(),
			pn(),
			/* @__PURE__ */ W("div", {
				className: "dc:flex-1 dc:min-h-0 dc:relative dc:overflow-auto",
				children: mn()
			}),
			!xe && !Ce && gn()
		]
	}) : /* @__PURE__ */ G("div", {
		className: "dc:h-full dc:flex dc:flex-col",
		children: [dn(), /* @__PURE__ */ W("div", {
			className: "dc:flex-1 dc:min-h-0 dc:relative dc:overflow-auto",
			children: Ce ? /* @__PURE__ */ W(P.Suspense, {
				fallback: null,
				children: /* @__PURE__ */ W(Ge, {
					height: "100%",
					highlightedFields: ve,
					onFieldClick: ye
				})
			}) : xe ? nn() : Gt()
		})]
	}), vn = B(() => Be(n, X, Z, q), [
		n,
		X,
		Z,
		q
	]), yn = vn && (t !== "idle" || Vt);
	return I && !vn ? /* @__PURE__ */ W("div", {
		className: "dc:h-full dc:min-h-[400px] dc:flex dc:flex-col bg-dc-surface dc:relative",
		children: Ut()
	}) : /* @__PURE__ */ G("div", {
		className: "dc:h-full dc:min-h-[400px] dc:flex dc:flex-col bg-dc-surface dc:relative",
		children: [
			/* @__PURE__ */ G(U, { children: [
				t === "idle" && !Vt && Wt(),
				t === "idle" && Vt && !vn && Ht(),
				t === "loading" && !vn && Rt(),
				t === "error" && !vn && zt(),
				(t === "success" || yn) && _n()
			] }),
			(t === "loading" || t === "refreshing") && vn && sn(),
			L && /* @__PURE__ */ W(l, {
				isOpen: De,
				onClose: () => Oe(!1),
				onConfirm: () => {
					L(), Oe(!1);
				},
				title: Y ? "Clear Funnel" : "Clear Query",
				message: /* @__PURE__ */ W(U, { children: Y ? "Are you sure you want to clear this funnel? This action cannot be undone." : "Are you sure you want to clear this query? This action cannot be undone." }),
				confirmText: "Clear",
				confirmVariant: "warning"
			})
		]
	});
}), qe = o("chartBar"), Je = o("chartFunnel"), Ye = o("chartSankey"), $ = o("chartRetention"), Xe = [
	{
		type: "query",
		labelKey: "analysis.modes.query.label",
		descriptionKey: "analysis.modes.query.description",
		icon: qe
	},
	{
		type: "funnel",
		labelKey: "analysis.modes.funnel.label",
		descriptionKey: "analysis.modes.funnel.description",
		icon: Je
	},
	{
		type: "flow",
		labelKey: "analysis.modes.flow.label",
		descriptionKey: "analysis.modes.flow.description",
		icon: Ye
	},
	{
		type: "retention",
		labelKey: "analysis.modes.retention.label",
		descriptionKey: "analysis.modes.retention.description",
		icon: $
	}
], Ze = L(function({ value: e, onChange: t, disabled: n = !1, schema: r }) {
	let { t: i } = y(), a = B(() => Xe.map((e) => ({
		...e,
		label: i(e.labelKey),
		description: i(e.descriptionKey)
	})), [i]), o = B(() => r?.cubes?.some((e) => e.meta?.eventStream) ?? !1, [r]), s = B(() => a.filter((e) => e.type === "query" || o), [o, a]);
	return /* @__PURE__ */ W("div", {
		className: "dc:border-b border-dc-border bg-dc-surface",
		children: /* @__PURE__ */ W("div", {
			className: "dc:overflow-x-auto dc:overflow-y-hidden scrollbar-thin",
			children: /* @__PURE__ */ W("div", {
				className: "dc:flex dc:items-center dc:gap-0.5 dc:p-1.5 dc:min-w-max",
				children: s.map((r) => {
					let i = e === r.type, a = r.icon;
					return /* @__PURE__ */ G("button", {
						onClick: () => !n && t(r.type),
						disabled: n,
						title: r.description,
						className: `
                  dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1.5 dc:rounded-md dc:text-sm dc:font-medium
                  dc:transition-colors dc:duration-150 dc:flex-shrink-0 dc:whitespace-nowrap
                  ${i ? "bg-dc-primary/10 text-dc-primary dc:border border-dc-primary/30" : "text-dc-text-secondary hover:bg-dc-bg-secondary hover:text-dc-text dc:border border-transparent"}
                  ${n ? "dc:opacity-50 dc:cursor-not-allowed" : "dc:cursor-pointer"}
                `,
						children: [/* @__PURE__ */ W(a, { className: "dc:h-4 dc:w-4 dc:flex-shrink-0" }), /* @__PURE__ */ W("span", {
							className: "dc:whitespace-nowrap",
							children: r.label
						})]
					}, r.type);
				})
			})
		})
	});
}), Qe = [
	{
		value: "hour",
		label: "timeGranularity.hour"
	},
	{
		value: "day",
		label: "timeGranularity.day"
	},
	{
		value: "week",
		label: "timeGranularity.week"
	},
	{
		value: "month",
		label: "timeGranularity.month"
	},
	{
		value: "quarter",
		label: "timeGranularity.quarter"
	},
	{
		value: "year",
		label: "timeGranularity.year"
	}
];
//#endregion
//#region src/client/components/AnalysisBuilder/SortToggleButton.tsx
function $e(e) {
	switch (e) {
		case "asc": return "Sorted ascending (click for descending)";
		case "desc": return "Sorted descending (click to remove)";
		default: return "Click to sort ascending";
	}
}
var et = L(function({ sortDirection: e, sortPriority: t, onToggleSort: n }) {
	let r = o("chevronUp"), i = o("chevronDown"), a = o("chevronUpDown"), s;
	return s = e === "asc" ? r ? /* @__PURE__ */ W(r, { className: "dc:w-4 dc:h-4" }) : "↑" : e === "desc" ? i ? /* @__PURE__ */ W(i, { className: "dc:w-4 dc:h-4" }) : "↓" : a ? /* @__PURE__ */ W(a, { className: "dc:w-4 dc:h-4" }) : "⇅", /* @__PURE__ */ G("button", {
		onClick: n,
		className: `dc:p-1 dc:transition-opacity dc:flex-shrink-0 dc:flex dc:items-center dc:gap-0.5 ${e ? "dc:opacity-100 text-dc-primary" : "dc:opacity-100 dc:sm:opacity-0 dc:sm:group-hover:opacity-100 text-dc-text-muted hover:text-dc-primary"}`,
		title: $e(e),
		children: [s, e && t && /* @__PURE__ */ G("span", {
			className: "dc:text-xs dc:font-medium",
			children: [
				"(",
				t,
				")"
			]
		})]
	});
}), tt = L(function({ enableComparison: e, comparisonDisabled: t, onComparisonToggle: n }) {
	let { t: r } = y(), i = t && !e, a;
	return a = r(i ? "analysis.breakdownComparison.alreadyEnabled" : e ? "analysis.breakdownComparison.clickToDisable" : "analysis.breakdownComparison.compareWithPrevious"), /* @__PURE__ */ W("button", {
		onClick: (e) => {
			e.stopPropagation(), n();
		},
		disabled: i,
		className: `dc:text-xs dc:px-2 dc:py-1 dc:rounded-sm dc:flex-shrink-0 dc:transition-colors ${e ? "bg-dc-accent text-white" : "bg-dc-surface dc:border border-dc-border text-dc-text-muted hover:text-dc-text hover:bg-dc-surface-hover"} ${i ? "dc:opacity-50 dc:cursor-not-allowed" : ""}`,
		title: a,
		children: r("analysis.breakdownComparison.vsPrior")
	});
}), nt = L(function({ breakdown: e, fieldMeta: t, onRemove: n, onGranularityChange: r, onComparisonToggle: i, comparisonDisabled: a, sortDirection: s, sortPriority: c, onToggleSort: l, index: u, isDragging: d, onDragStart: f, onDragEnd: p }) {
	let { t: m } = y(), h = o("dimension"), g = o("timeDimension"), _ = o("close"), v = t?.shortTitle || t?.title || e.field.split(".").pop() || e.field, b = e.field.split(".")[0], x = e.isTimeDimension ? g : h, S = typeof u == "number" && f && p;
	return /* @__PURE__ */ G("div", {
		className: `dc:flex dc:items-center dc:gap-2 dc:p-2 bg-dc-surface-secondary dc:rounded-lg dc:group hover:bg-dc-surface-tertiary dc:transition-all dc:duration-150 ${S ? "dc:cursor-grab dc:active:cursor-grabbing" : ""} ${d ? "dc:opacity-30" : ""}`,
		draggable: S ? !0 : void 0,
		onDragStart: S ? (e) => f(e, u) : void 0,
		onDragEnd: S ? p : void 0,
		children: [
			/* @__PURE__ */ W("span", {
				className: `dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded-sm dc:flex-shrink-0 ${e.isTimeDimension ? "bg-dc-time-dimension text-dc-time-dimension-text" : "bg-dc-dimension text-dc-dimension-text"}`,
				children: /* @__PURE__ */ W(x, { className: "dc:w-4 dc:h-4" })
			}),
			/* @__PURE__ */ G("div", {
				className: "dc:flex-1 dc:min-w-0",
				children: [/* @__PURE__ */ W("div", {
					className: "dc:text-sm text-dc-text dc:truncate",
					title: e.field,
					children: v
				}), /* @__PURE__ */ W("div", {
					className: "dc:text-xs text-dc-text-muted dc:truncate",
					children: b
				})]
			}),
			e.isTimeDimension && r && /* @__PURE__ */ W("select", {
				value: e.granularity || "day",
				onChange: (e) => r(e.target.value),
				onClick: (e) => e.stopPropagation(),
				className: "dc:text-xs bg-dc-surface dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 text-dc-text dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary dc:flex-shrink-0",
				children: Qe.map((e) => /* @__PURE__ */ W("option", {
					value: e.value,
					children: m(e.label)
				}, e.value))
			}),
			e.isTimeDimension && i && /* @__PURE__ */ W(tt, {
				enableComparison: e.enableComparison,
				comparisonDisabled: a,
				onComparisonToggle: i
			}),
			l && /* @__PURE__ */ W(et, {
				sortDirection: s,
				sortPriority: c,
				onToggleSort: l
			}),
			/* @__PURE__ */ W("button", {
				onClick: n,
				className: "dc:p-1 text-dc-text-muted hover:text-dc-danger dc:opacity-100 dc:sm:opacity-0 dc:sm:group-hover:opacity-100 dc:transition-opacity dc:flex-shrink-0",
				title: "Remove breakdown",
				children: /* @__PURE__ */ W(_, { className: "dc:w-4 dc:h-4" })
			})
		]
	});
}), rt = o("chevronDown"), it = o("check"), at = o("search"), ot = L(function({ bindingKey: e, onChange: t, schema: n, disabled: r = !1, className: i = "" }) {
	let { t: a } = y(), [o, s] = H(!1), [c, l] = H(""), u = V(null), d = V(null), f = B(() => j(n), [n]), p = B(() => {
		let e = {};
		for (let t of f) e[t.cube] || (e[t.cube] = []), e[t.cube].push(t);
		return e;
	}, [f]), m = B(() => {
		if (!c.trim()) return p;
		let e = c.toLowerCase(), t = {};
		for (let [n, r] of Object.entries(p)) {
			let i = r.filter((t) => t.label.toLowerCase().includes(e) || t.dimension.toLowerCase().includes(e) || n.toLowerCase().includes(e));
			i.length > 0 && (t[n] = i);
		}
		return t;
	}, [p, c]), h = R((e) => {
		t({ dimension: e }), s(!1), l("");
	}, [t]), g = R((e) => {
		e.stopPropagation(), t(null);
	}, [t]);
	z(() => {
		function e(e) {
			u.current && !u.current.contains(e.target) && (s(!1), l(""));
		}
		if (o) return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [o]), z(() => {
		o && d.current && d.current.focus();
	}, [o]);
	let _ = R((t) => e ? typeof e.dimension == "string" ? e.dimension === t : e.dimension.some((e) => e.dimension === t) : !1, [e]), v = k(e), b = e?.dimension !== null && e?.dimension !== void 0;
	return /* @__PURE__ */ W("div", {
		className: i,
		children: /* @__PURE__ */ G("div", {
			ref: u,
			className: "dc:relative",
			children: [/* @__PURE__ */ G("button", {
				type: "button",
				onClick: () => !r && s(!o),
				disabled: r,
				className: `
          dc:flex dc:items-center dc:justify-between dc:w-full dc:px-2 dc:py-1 dc:text-xs
          bg-dc-surface dc:border border-dc-border dc:rounded-sm
          dc:transition-colors
          ${r ? "dc:opacity-50 dc:cursor-not-allowed" : "hover:border-dc-primary dc:cursor-pointer"}
          ${o ? "border-dc-primary dc:ring-1 ring-dc-primary" : ""}
        `,
				children: [/* @__PURE__ */ W("span", {
					className: `dc:truncate ${b ? "text-dc-text" : "text-dc-text-muted"}`,
					children: v
				}), /* @__PURE__ */ G("span", {
					className: "dc:flex dc:items-center dc:gap-1",
					children: [b && /* @__PURE__ */ W("span", {
						role: "button",
						tabIndex: 0,
						onClick: g,
						onKeyDown: (e) => e.key === "Enter" && g(e),
						className: "dc:p-0.5 dc:rounded-sm hover:bg-dc-surface-hover text-dc-text-muted hover:text-dc-text",
						title: a("funnel.bindingKey.clearTitle"),
						children: "×"
					}), rt && /* @__PURE__ */ W(rt, { className: `dc:w-4 dc:h-4 text-dc-text-muted dc:transition-transform ${o ? "dc:rotate-180" : ""}` })]
				})]
			}), o && /* @__PURE__ */ G("div", {
				className: "dc:absolute dc:z-50 dc:mt-1 dc:right-0 dc:w-[280px] bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg",
				children: [
					/* @__PURE__ */ W("div", {
						className: "dc:p-2 dc:border-b border-dc-border",
						children: /* @__PURE__ */ G("div", {
							className: "dc:relative",
							children: [at && /* @__PURE__ */ W(at, { className: "dc:absolute dc:left-2 dc:top-1/2 dc:-translate-y-1/2 dc:w-4 dc:h-4 text-dc-text-muted" }), /* @__PURE__ */ W("input", {
								ref: d,
								type: "text",
								value: c,
								onChange: (e) => l(e.target.value),
								placeholder: a("funnel.bindingKey.searchPlaceholder"),
								className: "dc:w-full dc:pl-8 dc:pr-3 dc:py-1.5 dc:text-sm bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm text-dc-text placeholder:text-dc-text-muted dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary"
							})]
						})
					}),
					/* @__PURE__ */ W("div", {
						className: "dc:max-h-64 dc:overflow-y-auto dc:p-1",
						children: Object.entries(m).length === 0 ? /* @__PURE__ */ W("div", {
							className: "dc:px-3 dc:py-4 dc:text-sm text-dc-text-muted dc:text-center",
							children: a("funnel.bindingKey.noMatching")
						}) : Object.entries(m).map(([e, t]) => /* @__PURE__ */ G("div", {
							className: "dc:mb-2 dc:last:mb-0",
							children: [/* @__PURE__ */ W("div", {
								className: "dc:px-2 dc:py-1 dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wide",
								children: e
							}), t.map((e) => /* @__PURE__ */ G("button", {
								onClick: () => h(e.dimension),
								className: `
                        dc:flex dc:items-center dc:justify-between dc:w-full dc:px-3 dc:py-1.5 dc:text-sm
                        dc:rounded-sm dc:transition-colors
                        ${_(e.dimension) ? "bg-dc-primary-bg text-dc-primary" : "text-dc-text hover:bg-dc-surface-hover"}
                      `,
								children: [/* @__PURE__ */ W("span", { children: e.label }), _(e.dimension) && it && /* @__PURE__ */ W(it, { className: "dc:w-4 dc:h-4" })]
							}, e.dimension))]
						}, e))
					}),
					/* @__PURE__ */ W("div", {
						className: "dc:px-3 dc:py-2 dc:border-t border-dc-border dc:text-xs text-dc-text-muted",
						children: a("funnel.bindingKey.helpText")
					})
				]
			})]
		})
	});
}), st = o("chevronDown"), ct = o("chevronRight"), lt = o("check"), ut = o("search"), dt = o("dimension"), ft = o("link"), pt = o("timeDimension");
function mt(e) {
	return e?.cubes ? e.cubes.filter((e) => e.meta?.eventStream).map((e) => ({
		cube: e.name,
		dimension: e.name,
		label: e.title || e.name,
		eventStream: e.meta?.eventStream
	})) : [];
}
function ht(e) {
	if (!e?.cubes) return [];
	let t = [];
	for (let n of e.cubes) for (let e of n.dimensions || []) e.type === "time" && t.push({
		cube: n.name,
		dimension: e.name,
		label: e.shortTitle || e.title || e.name.split(".").pop() || e.name
	});
	return t;
}
var gt = L(function({ value: e, label: t, placeholder: n, icon: r, options: i, onChange: a, helpText: o }) {
	let [s, c] = H(!1), [l, u] = H(""), d = V(null), f = V(null), p = B(() => {
		let e = {};
		for (let t of i) e[t.cube] || (e[t.cube] = []), e[t.cube].push(t);
		return e;
	}, [i]), m = B(() => {
		if (!l.trim()) return p;
		let e = l.toLowerCase(), t = {};
		for (let [n, r] of Object.entries(p)) {
			let i = r.filter((t) => t.label.toLowerCase().includes(e) || t.dimension.toLowerCase().includes(e) || n.toLowerCase().includes(e));
			i.length > 0 && (t[n] = i);
		}
		return t;
	}, [p, l]), h = R((e) => {
		a(e), c(!1), u("");
	}, [a]), g = R((e) => {
		e.stopPropagation(), a(null);
	}, [a]);
	z(() => {
		function e(e) {
			d.current && !d.current.contains(e.target) && (c(!1), u(""));
		}
		if (s) return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [s]), z(() => {
		s && f.current && f.current.focus();
	}, [s]);
	let _ = e !== null;
	return /* @__PURE__ */ G("div", {
		className: "dc:flex-1 dc:min-w-0",
		children: [/* @__PURE__ */ G("label", {
			className: "dc:flex dc:items-center dc:gap-1.5 dc:text-xs dc:font-medium text-dc-text-muted dc:mb-1",
			children: [r && /* @__PURE__ */ W(r, { className: "dc:w-3.5 dc:h-3.5" }), t]
		}), /* @__PURE__ */ G("div", {
			ref: d,
			className: "dc:relative",
			children: [/* @__PURE__ */ G("button", {
				type: "button",
				onClick: () => c(!s),
				className: `
            dc:flex dc:items-center dc:justify-between dc:w-full dc:px-2.5 dc:py-1.5 dc:text-sm
            bg-dc-surface dc:border border-dc-border dc:rounded-sm
            dc:transition-colors hover:border-dc-primary dc:cursor-pointer
            ${s ? "border-dc-primary dc:ring-1 ring-dc-primary" : ""}
          `,
				children: [/* @__PURE__ */ W("span", {
					className: `dc:truncate ${_ ? "text-dc-text" : "text-dc-text-muted"}`,
					children: _ ? i.find((t) => t.dimension === e)?.label || e : n
				}), /* @__PURE__ */ G("span", {
					className: "dc:flex dc:items-center dc:gap-1 dc:ml-2",
					children: [_ && /* @__PURE__ */ W("span", {
						role: "button",
						tabIndex: 0,
						onClick: g,
						onKeyDown: (e) => e.key === "Enter" && g(e),
						className: "dc:p-0.5 dc:rounded-sm hover:bg-dc-surface-hover text-dc-text-muted hover:text-dc-text",
						title: "Clear",
						children: "×"
					}), st && /* @__PURE__ */ W(st, { className: `dc:w-4 dc:h-4 text-dc-text-muted dc:transition-transform ${s ? "dc:rotate-180" : ""}` })]
				})]
			}), s && /* @__PURE__ */ G("div", {
				className: "dc:absolute dc:z-50 dc:mt-1 dc:left-0 dc:right-0 dc:min-w-[200px] bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg",
				children: [
					/* @__PURE__ */ W("div", {
						className: "dc:p-2 dc:border-b border-dc-border",
						children: /* @__PURE__ */ G("div", {
							className: "dc:relative",
							children: [ut && /* @__PURE__ */ W(ut, { className: "dc:absolute dc:left-2 dc:top-1/2 dc:-translate-y-1/2 dc:w-4 dc:h-4 text-dc-text-muted" }), /* @__PURE__ */ W("input", {
								ref: f,
								type: "text",
								value: l,
								onChange: (e) => u(e.target.value),
								placeholder: "Search...",
								className: "dc:w-full dc:pl-8 dc:pr-3 dc:py-1.5 dc:text-sm bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm text-dc-text placeholder:text-dc-text-muted dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary"
							})]
						})
					}),
					/* @__PURE__ */ W("div", {
						className: "dc:max-h-48 dc:overflow-y-auto dc:p-1",
						children: Object.entries(m).length === 0 ? /* @__PURE__ */ W("div", {
							className: "dc:px-3 dc:py-4 dc:text-sm text-dc-text-muted dc:text-center",
							children: "No matching fields found"
						}) : Object.entries(m).map(([t, n]) => /* @__PURE__ */ G("div", {
							className: "dc:mb-2 dc:last:mb-0",
							children: [/* @__PURE__ */ W("div", {
								className: "dc:px-2 dc:py-1 dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wide",
								children: t
							}), n.map((t) => /* @__PURE__ */ G("button", {
								onClick: () => h(t.dimension),
								className: `
                          dc:flex dc:items-center dc:justify-between dc:w-full dc:px-3 dc:py-1.5 dc:text-sm
                          dc:rounded-sm dc:transition-colors
                          ${e === t.dimension ? "bg-dc-primary-bg text-dc-primary" : "text-dc-text hover:bg-dc-surface-hover"}
                        `,
								children: [/* @__PURE__ */ W("span", { children: t.label }), e === t.dimension && lt && /* @__PURE__ */ W(lt, { className: "dc:w-4 dc:h-4" })]
							}, t.dimension))]
						}, t))
					}),
					/* @__PURE__ */ W("div", {
						className: "dc:px-3 dc:py-2 dc:border-t border-dc-border dc:text-xs text-dc-text-muted",
						children: o
					})
				]
			})]
		})]
	});
}), _t = L(function({ selectedCube: e, bindingKey: t, timeDimension: n, schema: r, onCubeChange: i, onBindingKeyChange: a, onTimeDimensionChange: o }) {
	let { t: s } = y(), c = B(() => mt(r), [r]), l = B(() => {
		let t = j(r);
		return e ? t.filter((t) => t.cube === e) : [];
	}, [r, e]), u = B(() => {
		let t = ht(r);
		return e ? t.filter((t) => t.cube === e) : [];
	}, [r, e]), d = !!(e && t && n), [f, p] = H(!1), m = V(!1);
	z(() => {
		d && !m.current && (m.current = !0, p(!0));
	}, [d]), z(() => {
		if (!e || !r) return;
		let i = r.cubes?.find((t) => t.name === e);
		if (i?.meta?.eventStream) {
			let e = i.meta.eventStream;
			!t && e.bindingKey && a({ dimension: e.bindingKey }), !n && e.timeDimension && o(e.timeDimension);
		}
	}, [
		e,
		r,
		t,
		n,
		a,
		o
	]);
	let h = t?.dimension ? typeof t.dimension == "string" ? t.dimension : t.dimension[0]?.dimension || null : null, g = R((e) => {
		a(e ? { dimension: e } : null);
	}, [a]), _ = c.find((t) => t.dimension === e)?.label || e;
	return /* @__PURE__ */ G("div", {
		className: "bg-dc-surface-secondary dc:border-b border-dc-border",
		children: [/* @__PURE__ */ G("button", {
			type: "button",
			onClick: () => p(!f),
			className: "dc:flex dc:items-center dc:justify-between dc:w-full dc:px-4 dc:py-2.5 hover:bg-dc-surface-hover dc:transition-colors",
			children: [/* @__PURE__ */ G("div", {
				className: "dc:flex dc:items-center dc:gap-2",
				children: [
					f ? ct && /* @__PURE__ */ W(ct, { className: "dc:w-4 dc:h-4 text-dc-text-muted" }) : st && /* @__PURE__ */ W(st, { className: "dc:w-4 dc:h-4 text-dc-text-muted" }),
					/* @__PURE__ */ W(N, {
						className: "dc:mb-0",
						children: s("funnel.config.configuration")
					}),
					d && /* @__PURE__ */ W("span", {
						className: "dc:flex dc:items-center dc:gap-1 dc:text-xs text-dc-success",
						children: lt && /* @__PURE__ */ W(lt, { className: "dc:w-3.5 dc:h-3.5" })
					})
				]
			}), f && d && /* @__PURE__ */ W("span", {
				className: "dc:text-xs text-dc-text-muted dc:truncate dc:max-w-[200px]",
				children: _
			})]
		}), !f && /* @__PURE__ */ G("div", {
			className: "dc:flex dc:flex-col dc:gap-3 dc:px-4 dc:pb-3",
			children: [
				/* @__PURE__ */ W(gt, {
					value: e,
					label: "Cube",
					placeholder: "Select event stream cube",
					icon: dt,
					options: c,
					onChange: i,
					helpText: "Select a cube configured for funnel analysis"
				}),
				/* @__PURE__ */ W(gt, {
					value: h,
					label: "Binding Key",
					placeholder: e ? "Select binding key" : "Select cube first",
					icon: ft,
					options: l,
					onChange: g,
					helpText: "Entity that connects steps (e.g., user ID, order ID)"
				}),
				/* @__PURE__ */ W(gt, {
					value: n,
					label: "Time Dimension",
					placeholder: e ? "Select time dimension" : "Select cube first",
					icon: pt,
					options: u,
					onChange: o,
					helpText: "Timestamp field for step ordering"
				})
			]
		})]
	});
}), vt = o("menu"), yt = o("close"), bt = o("chevronDown"), xt = o("check"), St = o("timeDimension"), Ct = [
	{
		value: null,
		label: "No limit"
	},
	{
		value: "PT1H",
		label: "1 hour"
	},
	{
		value: "PT6H",
		label: "6 hours"
	},
	{
		value: "PT12H",
		label: "12 hours"
	},
	{
		value: "P1D",
		label: "1 day"
	},
	{
		value: "P3D",
		label: "3 days"
	},
	{
		value: "P7D",
		label: "7 days"
	},
	{
		value: "P14D",
		label: "14 days"
	},
	{
		value: "P30D",
		label: "30 days"
	},
	{
		value: "P90D",
		label: "90 days"
	}
], wt = L(function({ step: e, stepIndex: t, isActive: n, canRemove: r, schema: i, onSelect: a, onRemove: o, onUpdate: s }) {
	let { t: c } = y(), [l, u] = H(!1), [d, p] = H(!1), [m, h] = H(e.name), g = V(null), _ = V(null);
	z(() => {
		h(e.name);
	}, [e.name]), z(() => {
		l && g.current && (g.current.focus(), g.current.select());
	}, [l]), z(() => {
		function e(e) {
			_.current && !_.current.contains(e.target) && p(!1);
		}
		if (d) return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [d]);
	let v = R((e) => {
		h(e.target.value);
	}, []), b = R((t) => {
		t.key === "Enter" ? t.currentTarget.blur() : t.key === "Escape" && (h(e.name), u(!1));
	}, [e.name]), x = R(() => {
		let n = m.trim();
		n !== e.name && s({ name: n || `Step ${t + 1}` }), u(!1);
	}, [
		m,
		e.name,
		s,
		t
	]), S = R((e) => {
		s({ timeToConvert: e || void 0 }), p(!1);
	}, [s]), C = R((e) => {
		s({ filters: e });
	}, [s]), T = e.timeToConvert ? Ct.find((t) => t.value === e.timeToConvert)?.label || e.timeToConvert : "No limit", E = B(() => {
		if (!i) return null;
		let t = { cubes: i.cubes.map((e) => ({
			...e,
			description: e.description || ""
		})) };
		return e.cube ? f(e.cube, t) : t;
	}, [i, e.cube]);
	return /* @__PURE__ */ G("div", {
		className: `
        bg-dc-surface dc:border dc:rounded-lg dc:transition-all dc:cursor-pointer
        ${n ? "border-dc-primary dc:ring-1 ring-dc-primary" : "border-dc-border hover:border-dc-text-muted"}
      `,
		onClick: a,
		children: [
			/* @__PURE__ */ G("div", {
				className: "dc:flex dc:items-center dc:gap-2 dc:px-3 dc:py-2 dc:border-b border-dc-border",
				children: [
					/* @__PURE__ */ W("div", {
						className: "dc:cursor-grab dc:active:cursor-grabbing text-dc-text-muted hover:text-dc-text",
						children: vt && /* @__PURE__ */ W(vt, { className: "dc:w-4 dc:h-4" })
					}),
					/* @__PURE__ */ W("span", {
						className: "dc:flex-shrink-0 dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded-full bg-dc-primary/10 text-dc-primary dc:text-xs dc:font-medium",
						children: t + 1
					}),
					l ? /* @__PURE__ */ W("input", {
						ref: g,
						type: "text",
						value: m,
						onChange: v,
						onKeyDown: b,
						onBlur: x,
						onClick: (e) => e.stopPropagation(),
						className: "dc:flex-1 dc:px-1.5 dc:py-0.5 dc:text-sm dc:font-medium bg-dc-surface dc:border border-dc-primary dc:rounded-sm text-dc-text dc:focus:outline-none",
						placeholder: "Step name"
					}) : /* @__PURE__ */ W("button", {
						onClick: (e) => {
							e.stopPropagation(), u(!0);
						},
						className: "dc:flex-1 dc:text-left dc:text-sm dc:font-medium text-dc-text hover:text-dc-primary dc:truncate",
						title: "Click to edit name",
						children: e.name || `Step ${t + 1}`
					}),
					r && /* @__PURE__ */ W("button", {
						onClick: (e) => {
							e.stopPropagation(), o();
						},
						className: "dc:p-1 dc:rounded-sm hover:bg-dc-danger-bg text-dc-text-muted hover:text-dc-error dc:transition-colors",
						title: "Remove step",
						children: yt && /* @__PURE__ */ W(yt, { className: "dc:w-4 dc:h-4" })
					})
				]
			}),
			n && /* @__PURE__ */ G("div", {
				className: "dc:px-3 dc:py-3 dc:space-y-4",
				onClick: (e) => e.stopPropagation(),
				children: [/* @__PURE__ */ W(w, {
					filters: e.filters,
					schema: E,
					onFiltersChange: C,
					dimensionsOnly: !0
				}), t > 0 && /* @__PURE__ */ G("div", { children: [/* @__PURE__ */ G("label", {
					className: "dc:flex dc:items-center dc:gap-1.5 dc:text-xs dc:font-medium text-dc-text-muted dc:mb-1",
					children: [St && /* @__PURE__ */ W(St, { className: "dc:w-3.5 dc:h-3.5" }), c("funnel.step.timeWindow")]
				}), /* @__PURE__ */ G("div", {
					ref: _,
					className: "dc:relative",
					children: [/* @__PURE__ */ G("button", {
						type: "button",
						onClick: () => p(!d),
						className: `
                    dc:flex dc:items-center dc:justify-between dc:w-full dc:px-2.5 dc:py-1.5 dc:text-sm
                    bg-dc-surface dc:border border-dc-border dc:rounded-sm
                    dc:transition-colors hover:border-dc-primary dc:cursor-pointer
                    ${d ? "border-dc-primary dc:ring-1 ring-dc-primary" : ""}
                  `,
						children: [/* @__PURE__ */ W("span", {
							className: e.timeToConvert ? "text-dc-text" : "text-dc-text-muted",
							children: T
						}), bt && /* @__PURE__ */ W(bt, { className: `dc:w-4 dc:h-4 text-dc-text-muted dc:transition-transform ${d ? "dc:rotate-180" : ""}` })]
					}), d && /* @__PURE__ */ G("div", {
						className: "dc:absolute dc:z-50 dc:mt-1 dc:left-0 dc:right-0 bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg dc:max-h-48 dc:overflow-y-auto",
						children: [Ct.map((t) => /* @__PURE__ */ G("button", {
							onClick: () => S(t.value),
							className: `
                          dc:flex dc:items-center dc:justify-between dc:w-full dc:px-3 dc:py-1.5 dc:text-sm
                          dc:transition-colors
                          ${e.timeToConvert === t.value || !e.timeToConvert && t.value === null ? "bg-dc-primary-bg text-dc-primary" : "text-dc-text hover:bg-dc-surface-hover"}
                        `,
							children: [/* @__PURE__ */ W("span", { children: t.label }), (e.timeToConvert === t.value || !e.timeToConvert && t.value === null) && xt && /* @__PURE__ */ W(xt, { className: "dc:w-4 dc:h-4" })]
						}, t.value || "none")), /* @__PURE__ */ W("div", {
							className: "dc:px-3 dc:py-2 dc:border-t border-dc-border dc:text-xs text-dc-text-muted",
							children: c("funnel.step.timeWindowHelp")
						})]
					})]
				})] })]
			}),
			!n && /* @__PURE__ */ G("div", {
				className: "dc:px-3 dc:py-2 dc:text-xs text-dc-text-muted",
				children: [
					e.filters.length > 0 && /* @__PURE__ */ G("span", { children: [
						e.filters.length,
						" filter",
						e.filters.length === 1 ? "" : "s"
					] }),
					e.timeToConvert && t > 0 && /* @__PURE__ */ G("span", {
						className: e.filters.length > 0 ? "dc:ml-2" : "",
						children: [
							e.filters.length > 0 ? "• " : "",
							"within ",
							T.toLowerCase()
						]
					}),
					e.filters.length === 0 && !e.timeToConvert && /* @__PURE__ */ W("span", {
						className: "dc:italic",
						children: "No filters configured"
					})
				]
			})
		]
	});
}), Tt = o("add"), Et = L(function({ steps: e, activeStepIndex: t, schema: n, onAddStep: r, onRemoveStep: i, onUpdateStep: a, onSelectStep: o, onReorderSteps: s }) {
	let { t: c } = y(), [l, u] = H(null), [d, f] = H(null), p = R((e) => {
		u(e);
	}, []), m = R((e, t) => {
		e.preventDefault(), l !== null && l !== t && f(t);
	}, [l]), h = R(() => {
		f(null);
	}, []), g = R((e, t) => {
		e.preventDefault(), l !== null && l !== t && s(l, t), u(null), f(null);
	}, [l, s]), _ = R(() => {
		u(null), f(null);
	}, []);
	return /* @__PURE__ */ G("div", {
		className: "dc:space-y-4",
		children: [
			/* @__PURE__ */ W("div", {
				className: "dc:flex dc:items-center dc:justify-between",
				children: /* @__PURE__ */ G(N, { children: [c("funnel.steps.title"), e.length > 0 && /* @__PURE__ */ G("span", {
					className: "dc:ml-1.5 dc:text-xs dc:font-normal text-dc-text-muted dc:normal-case dc:tracking-normal",
					children: [
						"(",
						e.length,
						")"
					]
				})] })
			}),
			e.length === 0 ? /* @__PURE__ */ G("div", {
				className: "dc:text-center dc:py-8",
				children: [/* @__PURE__ */ W("p", {
					className: "dc:text-sm text-dc-text-muted dc:mb-3",
					children: c("funnel.steps.emptyMessage")
				}), /* @__PURE__ */ G("button", {
					onClick: r,
					className: "dc:inline-flex dc:items-center dc:gap-1.5 dc:px-3 dc:py-1.5 dc:text-sm dc:font-medium text-dc-primary bg-dc-primary/10 dc:rounded-md hover:bg-dc-primary/20 dc:transition-colors",
					children: [/* @__PURE__ */ W(Tt, { className: "dc:w-4 dc:h-4" }), c("funnel.steps.addFirst")]
				})]
			}) : /* @__PURE__ */ W("div", {
				className: "dc:space-y-2",
				children: e.map((r, s) => /* @__PURE__ */ W("div", {
					draggable: !0,
					onDragStart: () => p(s),
					onDragOver: (e) => m(e, s),
					onDragLeave: h,
					onDrop: (e) => g(e, s),
					onDragEnd: _,
					className: `dc:transition-all ${l === s ? "dc:opacity-50" : ""} ${d === s ? "dc:border-t-2 border-dc-primary dc:pt-1" : ""}`,
					children: /* @__PURE__ */ W(wt, {
						step: r,
						stepIndex: s,
						isActive: s === t,
						canRemove: e.length > 1,
						schema: n,
						onSelect: () => o(s),
						onRemove: () => i(s),
						onUpdate: (e) => a(s, e)
					})
				}, r.id))
			}),
			e.length > 0 && /* @__PURE__ */ G("button", {
				onClick: r,
				className: "dc:flex dc:items-center dc:justify-center dc:gap-1.5 dc:w-full dc:py-2 dc:text-sm dc:font-medium text-dc-text-secondary bg-dc-surface dc:border-2 dc:border-dashed border-dc-border dc:rounded-lg hover:border-dc-primary hover:text-dc-primary hover:bg-dc-primary/5 dc:transition-colors",
				children: [/* @__PURE__ */ W(Tt, { className: "dc:w-4 dc:h-4" }), c("funnel.steps.addStep")]
			}),
			e.length === 1 && /* @__PURE__ */ W("p", {
				className: "dc:text-xs text-dc-warning dc:text-center",
				children: c("funnel.steps.validationHint")
			})
		]
	});
}), Dt = L(function({ funnelCube: e, funnelSteps: t, activeFunnelStepIndex: n, funnelTimeDimension: r, funnelBindingKey: i, schema: a, onCubeChange: o, onAddStep: s, onRemoveStep: c, onUpdateStep: l, onSelectStep: d, onReorderSteps: f, onTimeDimensionChange: p, onBindingKeyChange: m, chartType: h = "funnel", displayConfig: g, colorPalette: _, onDisplayConfigChange: v }) {
	let { t: b } = y(), [x, S] = H("steps"), C = g && v;
	return /* @__PURE__ */ G("div", {
		className: "dc:flex dc:flex-col dc:h-full",
		children: [/* @__PURE__ */ W("div", {
			className: "dc:border-b border-dc-border dc:flex-shrink-0 dc:overflow-x-auto dc:overflow-y-hidden scrollbar-thin",
			children: /* @__PURE__ */ G("div", {
				className: "dc:flex dc:min-w-max",
				children: [/* @__PURE__ */ W("button", {
					onClick: () => S("steps"),
					className: `dc:flex-1 dc:px-4 dc:py-3 dc:text-sm dc:font-medium dc:transition-colors dc:whitespace-nowrap ${x === "steps" ? "text-dc-primary dc:border-b-2 border-dc-primary" : "text-dc-text-secondary hover:text-dc-text"}`,
					children: b("funnel.tabs.steps")
				}), /* @__PURE__ */ W("button", {
					onClick: () => C && S("display"),
					disabled: !C,
					className: `dc:flex-1 dc:px-4 dc:py-3 dc:text-sm dc:font-medium dc:transition-colors dc:whitespace-nowrap ${x === "display" ? "text-dc-primary dc:border-b-2 border-dc-primary" : C ? "text-dc-text-secondary hover:text-dc-text" : "text-dc-text-muted dc:cursor-not-allowed dc:opacity-50"}`,
					title: b(C ? "funnel.tabs.displayTitle" : "funnel.tabs.displayUnavailable"),
					children: b("funnel.tabs.display")
				})]
			})
		}), x === "steps" ? /* @__PURE__ */ G("div", {
			className: "dc:flex dc:flex-col dc:flex-1 dc:min-h-0",
			children: [/* @__PURE__ */ W(_t, {
				selectedCube: e,
				bindingKey: i,
				timeDimension: r,
				schema: a,
				onCubeChange: o,
				onBindingKeyChange: m,
				onTimeDimensionChange: p
			}), /* @__PURE__ */ W("div", {
				className: "dc:flex-1 dc:min-h-0 dc:overflow-auto dc:p-4 dc:pb-24",
				children: /* @__PURE__ */ W(Et, {
					steps: t,
					activeStepIndex: n,
					schema: a,
					onAddStep: s,
					onRemoveStep: c,
					onUpdateStep: l,
					onSelectStep: d,
					onReorderSteps: f
				})
			})]
		}) : x === "display" && g && v ? /* @__PURE__ */ W("div", {
			className: "dc:flex-1 dc:min-h-0 dc:overflow-auto dc:p-4",
			children: /* @__PURE__ */ W(u, {
				chartType: h,
				displayConfig: g,
				colorPalette: _,
				onDisplayConfigChange: v
			})
		}) : null]
	});
}), Ot = o("chevronDown"), kt = o("chevronRight"), At = o("check"), jt = o("search"), Mt = o("dimension"), Nt = o("link"), Pt = o("timeDimension"), Ft = o("dimension");
function It(e) {
	return e?.cubes ? e.cubes.filter((e) => e.meta?.eventStream).map((e) => ({
		cube: e.name,
		dimension: e.name,
		label: e.title || e.name,
		eventStream: e.meta?.eventStream
	})) : [];
}
function Lt(e) {
	if (!e?.cubes) return [];
	let t = [];
	for (let n of e.cubes) for (let e of n.dimensions || []) e.type === "time" && t.push({
		cube: n.name,
		dimension: e.name,
		label: e.shortTitle || e.title || e.name.split(".").pop() || e.name
	});
	return t;
}
function Rt(e) {
	if (!e?.cubes) return [];
	let t = [];
	for (let n of e.cubes) for (let e of n.dimensions || []) e.type === "string" && t.push({
		cube: n.name,
		dimension: e.name,
		label: e.shortTitle || e.title || e.name.split(".").pop() || e.name
	});
	return t;
}
var zt = L(function({ value: e, label: t, placeholder: n, icon: r, options: i, onChange: a, helpText: o }) {
	let [s, c] = H(!1), [l, u] = H(""), d = V(null), f = V(null), p = B(() => {
		let e = {};
		for (let t of i) e[t.cube] || (e[t.cube] = []), e[t.cube].push(t);
		return e;
	}, [i]), m = B(() => {
		if (!l.trim()) return p;
		let e = l.toLowerCase(), t = {};
		for (let [n, r] of Object.entries(p)) {
			let i = r.filter((t) => t.label.toLowerCase().includes(e) || t.dimension.toLowerCase().includes(e) || n.toLowerCase().includes(e));
			i.length > 0 && (t[n] = i);
		}
		return t;
	}, [p, l]), h = R((e) => {
		a(e), c(!1), u("");
	}, [a]), g = R((e) => {
		e.stopPropagation(), a(null);
	}, [a]);
	z(() => {
		function e(e) {
			d.current && !d.current.contains(e.target) && (c(!1), u(""));
		}
		if (s) return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [s]), z(() => {
		s && f.current && f.current.focus();
	}, [s]);
	let _ = e !== null;
	return /* @__PURE__ */ G("div", {
		className: "dc:flex-1 dc:min-w-0",
		children: [/* @__PURE__ */ G("label", {
			className: "dc:flex dc:items-center dc:gap-1.5 dc:text-xs dc:font-medium text-dc-text-muted dc:mb-1",
			children: [r && /* @__PURE__ */ W(r, { className: "dc:w-3.5 dc:h-3.5" }), t]
		}), /* @__PURE__ */ G("div", {
			ref: d,
			className: "dc:relative",
			children: [/* @__PURE__ */ G("button", {
				type: "button",
				onClick: () => c(!s),
				className: `
            dc:flex dc:items-center dc:justify-between dc:w-full dc:px-2.5 dc:py-1.5 dc:text-sm
            bg-dc-surface dc:border border-dc-border dc:rounded-sm
            dc:transition-colors hover:border-dc-primary dc:cursor-pointer
            ${s ? "border-dc-primary dc:ring-1 ring-dc-primary" : ""}
          `,
				children: [/* @__PURE__ */ W("span", {
					className: `dc:truncate ${_ ? "text-dc-text" : "text-dc-text-muted"}`,
					children: _ ? i.find((t) => t.dimension === e)?.label || e : n
				}), /* @__PURE__ */ G("span", {
					className: "dc:flex dc:items-center dc:gap-1 dc:ml-2",
					children: [_ && /* @__PURE__ */ W("span", {
						role: "button",
						tabIndex: 0,
						onClick: g,
						onKeyDown: (e) => e.key === "Enter" && g(e),
						className: "dc:p-0.5 dc:rounded-sm hover:bg-dc-surface-hover text-dc-text-muted hover:text-dc-text",
						title: "Clear",
						children: "x"
					}), Ot && /* @__PURE__ */ W(Ot, { className: `dc:w-4 dc:h-4 text-dc-text-muted dc:transition-transform ${s ? "dc:rotate-180" : ""}` })]
				})]
			}), s && /* @__PURE__ */ G("div", {
				className: "dc:absolute dc:z-50 dc:mt-1 dc:left-0 dc:right-0 dc:min-w-[200px] bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg",
				children: [
					/* @__PURE__ */ W("div", {
						className: "dc:p-2 dc:border-b border-dc-border",
						children: /* @__PURE__ */ G("div", {
							className: "dc:relative",
							children: [jt && /* @__PURE__ */ W(jt, { className: "dc:absolute dc:left-2 dc:top-1/2 dc:-translate-y-1/2 dc:w-4 dc:h-4 text-dc-text-muted" }), /* @__PURE__ */ W("input", {
								ref: f,
								type: "text",
								value: l,
								onChange: (e) => u(e.target.value),
								placeholder: "Search...",
								className: "dc:w-full dc:pl-8 dc:pr-3 dc:py-1.5 dc:text-sm bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm text-dc-text placeholder:text-dc-text-muted dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary"
							})]
						})
					}),
					/* @__PURE__ */ W("div", {
						className: "dc:max-h-48 dc:overflow-y-auto dc:p-1",
						children: Object.entries(m).length === 0 ? /* @__PURE__ */ W("div", {
							className: "dc:px-3 dc:py-4 dc:text-sm text-dc-text-muted dc:text-center",
							children: "No matching fields found"
						}) : Object.entries(m).map(([t, n]) => /* @__PURE__ */ G("div", {
							className: "dc:mb-2 dc:last:mb-0",
							children: [/* @__PURE__ */ W("div", {
								className: "dc:px-2 dc:py-1 dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wide",
								children: t
							}), n.map((t) => /* @__PURE__ */ G("button", {
								onClick: () => h(t.dimension),
								className: `
                          dc:flex dc:items-center dc:justify-between dc:w-full dc:px-3 dc:py-1.5 dc:text-sm
                          dc:rounded-sm dc:transition-colors
                          ${e === t.dimension ? "bg-dc-primary-bg text-dc-primary" : "text-dc-text hover:bg-dc-surface-hover"}
                        `,
								children: [/* @__PURE__ */ W("span", { children: t.label }), e === t.dimension && At && /* @__PURE__ */ W(At, { className: "dc:w-4 dc:h-4" })]
							}, t.dimension))]
						}, t))
					}),
					/* @__PURE__ */ W("div", {
						className: "dc:px-3 dc:py-2 dc:border-t border-dc-border dc:text-xs text-dc-text-muted",
						children: o
					})
				]
			})]
		})]
	});
}), Bt = L(function({ selectedCube: e, bindingKey: t, timeDimension: n, eventDimension: r, schema: i, onCubeChange: a, onBindingKeyChange: o, onTimeDimensionChange: s, onEventDimensionChange: c }) {
	let { t: l } = y(), u = B(() => It(i), [i]), d = B(() => {
		let t = j(i);
		return e ? t.filter((t) => t.cube === e) : [];
	}, [i, e]), f = B(() => {
		let t = Lt(i);
		return e ? t.filter((t) => t.cube === e) : [];
	}, [i, e]), p = B(() => {
		let t = Rt(i);
		return e ? t.filter((t) => t.cube === e) : [];
	}, [i, e]), m = !!(e && t && n && r), [h, g] = H(!1), _ = V(!1);
	z(() => {
		m && !_.current && (_.current = !0, g(!0));
	}, [m]), z(() => {
		if (!e || !i) return;
		let r = i.cubes?.find((t) => t.name === e);
		if (r?.meta?.eventStream) {
			let e = r.meta.eventStream;
			!t && e.bindingKey && o({ dimension: e.bindingKey }), !n && e.timeDimension && s(e.timeDimension);
		}
	}, [
		e,
		i,
		t,
		n,
		o,
		s
	]);
	let v = t?.dimension ? typeof t.dimension == "string" ? t.dimension : t.dimension[0]?.dimension || null : null, b = R((e) => {
		o(e ? { dimension: e } : null);
	}, [o]), x = u.find((t) => t.dimension === e)?.label || e;
	return /* @__PURE__ */ G("div", {
		className: "bg-dc-surface-secondary dc:border-b border-dc-border",
		children: [/* @__PURE__ */ G("button", {
			type: "button",
			onClick: () => g(!h),
			className: "dc:flex dc:items-center dc:justify-between dc:w-full dc:px-4 dc:py-2.5 hover:bg-dc-surface-hover dc:transition-colors",
			children: [/* @__PURE__ */ G("div", {
				className: "dc:flex dc:items-center dc:gap-2",
				children: [
					h ? kt && /* @__PURE__ */ W(kt, { className: "dc:w-4 dc:h-4 text-dc-text-muted" }) : Ot && /* @__PURE__ */ W(Ot, { className: "dc:w-4 dc:h-4 text-dc-text-muted" }),
					/* @__PURE__ */ W(N, {
						className: "dc:mb-0",
						children: l("flow.config.configuration")
					}),
					m && /* @__PURE__ */ W("span", {
						className: "dc:flex dc:items-center dc:gap-1 dc:text-xs text-dc-success",
						children: At && /* @__PURE__ */ W(At, { className: "dc:w-3.5 dc:h-3.5" })
					})
				]
			}), h && m && /* @__PURE__ */ W("span", {
				className: "dc:text-xs text-dc-text-muted dc:truncate dc:max-w-[200px]",
				children: x
			})]
		}), !h && /* @__PURE__ */ G("div", {
			className: "dc:flex dc:flex-col dc:gap-3 dc:px-4 dc:pb-3",
			children: [
				/* @__PURE__ */ W(zt, {
					value: e,
					label: "Cube",
					placeholder: "Select event stream cube",
					icon: Mt,
					options: u,
					onChange: a,
					helpText: "Select a cube configured for flow analysis"
				}),
				/* @__PURE__ */ W(zt, {
					value: v,
					label: "Binding Key",
					placeholder: e ? "Select binding key" : "Select cube first",
					icon: Nt,
					options: d,
					onChange: b,
					helpText: "Entity that links events together (e.g., user ID)"
				}),
				/* @__PURE__ */ W(zt, {
					value: n,
					label: "Time Dimension",
					placeholder: e ? "Select time dimension" : "Select cube first",
					icon: Pt,
					options: f,
					onChange: s,
					helpText: "Timestamp field for event ordering"
				}),
				/* @__PURE__ */ W(zt, {
					value: r,
					label: "Event Dimension",
					placeholder: e ? "Select event dimension" : "Select cube first",
					icon: Ft,
					options: p,
					onChange: c,
					helpText: "Dimension that categorizes events (node labels in Sankey)"
				})
			]
		})]
	});
}), Vt = [{
	value: "sankey",
	labelKey: "flow.visualization.sankey",
	hintKey: "flow.visualization.sankeyHint"
}, {
	value: "sunburst",
	labelKey: "flow.visualization.sunburst",
	hintKey: "flow.visualization.sunburstHint"
}], Ht = L(function({ chartType: e, onChartTypeChange: t }) {
	let { t: n } = y();
	return /* @__PURE__ */ G("div", { children: [
		/* @__PURE__ */ W(N, { children: n("flow.visualization.title") }),
		/* @__PURE__ */ W("p", {
			className: "dc:text-xs text-dc-text-muted dc:mb-3",
			children: n("flow.visualization.description")
		}),
		/* @__PURE__ */ W("div", {
			className: "dc:flex dc:gap-2",
			children: Vt.map((r) => /* @__PURE__ */ W("button", {
				type: "button",
				onClick: () => t(r.value),
				className: `dc:flex-1 dc:px-3 dc:py-2 dc:rounded-md dc:border dc:text-sm dc:font-medium dc:transition-colors ${e === r.value ? "border-dc-primary bg-dc-primary/10 text-dc-primary" : "border-dc-border bg-dc-surface hover:bg-dc-surface-hover text-dc-text"}`,
				children: /* @__PURE__ */ G("div", {
					className: "dc:flex dc:flex-col dc:items-center dc:gap-1",
					children: [/* @__PURE__ */ W("span", { children: n(r.labelKey) }), /* @__PURE__ */ W("span", {
						className: "dc:text-[10px] dc:font-normal text-dc-text-muted",
						children: n(r.hintKey)
					})]
				})
			}, r.value))
		})
	] });
}), Ut = L(function({ chartType: e, stepsBefore: t, stepsAfter: n, onStepsBeforeChange: r, onStepsAfterChange: i }) {
	let { t: a } = y(), o = e === "sunburst", s = !o && t >= 4 || n >= 4;
	return /* @__PURE__ */ G("div", { children: [
		/* @__PURE__ */ W(N, { children: a("flow.depth.title") }),
		/* @__PURE__ */ W("p", {
			className: "dc:text-xs text-dc-text-muted dc:mb-3",
			children: a(o ? "flow.depth.descriptionSunburst" : "flow.depth.descriptionSankey")
		}),
		/* @__PURE__ */ G("div", {
			className: "dc:grid dc:grid-cols-2 dc:gap-4",
			children: [/* @__PURE__ */ G("div", {
				className: o ? "dc:opacity-50" : "",
				children: [/* @__PURE__ */ G("label", {
					className: "dc:block dc:text-xs dc:font-medium text-dc-text-muted dc:mb-1",
					children: [a("flow.depth.stepsBefore"), o && /* @__PURE__ */ W("span", {
						className: "dc:ml-1 text-dc-text-muted",
						children: a("flow.depth.stepsBeforeNA")
					})]
				}), /* @__PURE__ */ G("div", {
					className: "dc:flex dc:items-center dc:gap-2",
					children: [/* @__PURE__ */ W("input", {
						type: "range",
						min: 0,
						max: 5,
						value: t,
						onChange: (e) => r(parseInt(e.target.value, 10)),
						disabled: o,
						className: "dc:flex-1 dc:disabled:cursor-not-allowed"
					}), /* @__PURE__ */ W("span", {
						className: "dc:w-6 dc:text-sm dc:font-medium text-dc-text dc:text-center",
						children: o ? "-" : t
					})]
				})]
			}), /* @__PURE__ */ G("div", { children: [/* @__PURE__ */ W("label", {
				className: "dc:block dc:text-xs dc:font-medium text-dc-text-muted dc:mb-1",
				children: a("flow.depth.stepsAfter")
			}), /* @__PURE__ */ G("div", {
				className: "dc:flex dc:items-center dc:gap-2",
				children: [/* @__PURE__ */ W("input", {
					type: "range",
					min: 0,
					max: 5,
					value: n,
					onChange: (e) => i(parseInt(e.target.value, 10)),
					className: "dc:flex-1"
				}), /* @__PURE__ */ W("span", {
					className: "dc:w-6 dc:text-sm dc:font-medium text-dc-text dc:text-center",
					children: n
				})]
			})] })]
		}),
		s && /* @__PURE__ */ W("div", {
			className: "dc:mt-3 dc:px-3 dc:py-2 bg-dc-warning-bg dc:rounded-sm dc:border border-dc-warning dc:text-xs text-dc-warning",
			children: a("flow.depth.performanceWarning")
		})
	] });
}), Wt = L(function({ flowCube: e, flowBindingKey: t, flowTimeDimension: n, eventDimension: r, startingStep: i, stepsBefore: a, stepsAfter: o, joinStrategy: s = "auto", schema: c, onCubeChange: l, onBindingKeyChange: d, onTimeDimensionChange: f, onEventDimensionChange: p, onStartingStepFiltersChange: m, onStepsBeforeChange: h, onStepsAfterChange: g, onJoinStrategyChange: _, chartType: v = "sankey", onChartTypeChange: b, displayConfig: x, colorPalette: S, onDisplayConfigChange: C }) {
	let { t: T } = y(), [E, D] = H("config"), O = x && C, k = R((e) => {
		m(e);
	}, [m]);
	return /* @__PURE__ */ G("div", {
		className: "dc:flex dc:flex-col dc:h-full dc:min-h-0 dc:overflow-hidden",
		children: [/* @__PURE__ */ W("div", {
			className: "dc:border-b border-dc-border dc:flex-shrink-0 dc:overflow-x-auto dc:overflow-y-hidden scrollbar-thin",
			children: /* @__PURE__ */ G("div", {
				className: "dc:flex dc:min-w-max",
				children: [/* @__PURE__ */ W("button", {
					onClick: () => D("config"),
					className: `dc:flex-1 dc:px-4 dc:py-3 dc:text-sm dc:font-medium dc:transition-colors dc:whitespace-nowrap ${E === "config" ? "text-dc-primary dc:border-b-2 border-dc-primary" : "text-dc-text-secondary hover:text-dc-text"}`,
					children: T("flow.tabs.flow")
				}), /* @__PURE__ */ W("button", {
					onClick: () => O && D("display"),
					disabled: !O,
					className: `dc:flex-1 dc:px-4 dc:py-3 dc:text-sm dc:font-medium dc:transition-colors dc:whitespace-nowrap ${E === "display" ? "text-dc-primary dc:border-b-2 border-dc-primary" : O ? "text-dc-text-secondary hover:text-dc-text" : "text-dc-text-muted dc:cursor-not-allowed dc:opacity-50"}`,
					title: T(O ? "flow.tabs.displayTitle" : "flow.tabs.displayUnavailable"),
					children: T("flow.tabs.display")
				})]
			})
		}), E === "config" ? /* @__PURE__ */ G("div", {
			className: "dc:flex dc:flex-col dc:flex-1 dc:min-h-0",
			children: [/* @__PURE__ */ W(Bt, {
				selectedCube: e,
				bindingKey: t,
				timeDimension: n,
				eventDimension: r,
				schema: c,
				onCubeChange: l,
				onBindingKeyChange: d,
				onTimeDimensionChange: f,
				onEventDimensionChange: p
			}), /* @__PURE__ */ G("div", {
				className: "dc:flex-1 dc:min-h-0 dc:overflow-auto dc:p-4 dc:space-y-6",
				children: [
					b && /* @__PURE__ */ W(Ht, {
						chartType: v,
						onChartTypeChange: b
					}),
					/* @__PURE__ */ G("div", { children: [
						/* @__PURE__ */ W(N, { children: T("flow.startingStep.title") }),
						/* @__PURE__ */ W("p", {
							className: "dc:text-xs text-dc-text-muted dc:mb-3",
							children: T("flow.startingStep.description")
						}),
						/* @__PURE__ */ G("div", { children: [/* @__PURE__ */ W("label", {
							className: "dc:block dc:text-xs dc:font-medium text-dc-text-muted dc:mb-2",
							children: T("flow.startingStep.filterLabel")
						}), /* @__PURE__ */ W(w, {
							filters: i.filters,
							schema: c,
							onFiltersChange: k
						})] })
					] }),
					/* @__PURE__ */ W(Ut, {
						chartType: v,
						stepsBefore: a,
						stepsAfter: o,
						onStepsBeforeChange: h,
						onStepsAfterChange: g
					}),
					/* @__PURE__ */ G("div", { children: [
						/* @__PURE__ */ W(N, { children: T("flow.joinStrategy.title") }),
						/* @__PURE__ */ W("p", {
							className: "dc:text-xs text-dc-text-muted dc:mb-3",
							children: T("flow.joinStrategy.description")
						}),
						/* @__PURE__ */ G("select", {
							className: "dc:w-full dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-2 dc:text-sm bg-dc-surface text-dc-text",
							value: s,
							onChange: (e) => _?.(e.target.value),
							children: [
								/* @__PURE__ */ W("option", {
									value: "auto",
									children: T("flow.joinStrategy.auto")
								}),
								/* @__PURE__ */ W("option", {
									value: "lateral",
									children: T("flow.joinStrategy.lateral")
								}),
								/* @__PURE__ */ W("option", {
									value: "window",
									children: T("flow.joinStrategy.window")
								})
							]
						})
					] })
				]
			})]
		}) : E === "display" && x && C ? /* @__PURE__ */ W("div", {
			className: "dc:flex-1 dc:min-h-0 dc:overflow-auto dc:p-4",
			children: /* @__PURE__ */ W(u, {
				chartType: v,
				displayConfig: x,
				colorPalette: S,
				onDisplayConfigChange: C
			})
		}) : null]
	});
}), Gt = o("chevronDown"), Kt = o("chevronRight"), qt = o("check"), Jt = o("search"), Yt = o("dimension"), Xt = o("link"), Zt = o("timeDimension"), Qt = o("timeDimension");
function $t(e) {
	return e?.cubes ? e.cubes.filter((e) => e.meta?.eventStream).map((e) => ({
		cube: e.name,
		dimension: e.name,
		label: e.title || e.name,
		eventStream: e.meta?.eventStream
	})) : [];
}
function en(e) {
	if (!e?.cubes) return [];
	let t = [];
	for (let n of e.cubes) for (let e of n.dimensions || []) e.type === "time" && t.push({
		cube: n.name,
		dimension: e.name,
		label: e.shortTitle || e.title || e.name.split(".").pop() || e.name
	});
	return t;
}
function tn(e) {
	return e ? new Date(e).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric"
	}) : "";
}
var nn = L(function({ value: e, label: t, placeholder: n, icon: r, options: i, onChange: a, helpText: o }) {
	let [s, c] = H(!1), [l, u] = H(""), d = V(null), f = V(null), p = B(() => {
		let e = {};
		for (let t of i) e[t.cube] || (e[t.cube] = []), e[t.cube].push(t);
		return e;
	}, [i]), m = B(() => {
		if (!l.trim()) return p;
		let e = l.toLowerCase(), t = {};
		for (let [n, r] of Object.entries(p)) {
			let i = r.filter((t) => t.label.toLowerCase().includes(e) || t.dimension.toLowerCase().includes(e) || n.toLowerCase().includes(e));
			i.length > 0 && (t[n] = i);
		}
		return t;
	}, [p, l]), h = R((e) => {
		a(e), c(!1), u("");
	}, [a]), g = R((e) => {
		e.stopPropagation(), a(null);
	}, [a]);
	z(() => {
		function e(e) {
			d.current && !d.current.contains(e.target) && (c(!1), u(""));
		}
		if (s) return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [s]), z(() => {
		s && f.current && f.current.focus();
	}, [s]);
	let _ = e !== null;
	return /* @__PURE__ */ G("div", {
		className: "dc:flex-1 dc:min-w-0",
		children: [/* @__PURE__ */ G("label", {
			className: "dc:flex dc:items-center dc:gap-1.5 dc:text-xs dc:font-medium text-dc-text-muted dc:mb-1",
			children: [r && /* @__PURE__ */ W(r, { className: "dc:w-3.5 dc:h-3.5" }), t]
		}), /* @__PURE__ */ G("div", {
			ref: d,
			className: "dc:relative",
			children: [/* @__PURE__ */ G("button", {
				type: "button",
				onClick: () => c(!s),
				className: `
            dc:flex dc:items-center dc:justify-between dc:w-full dc:px-2.5 dc:py-1.5 dc:text-sm
            bg-dc-surface dc:border border-dc-border dc:rounded-sm
            dc:transition-colors hover:border-dc-primary dc:cursor-pointer
            ${s ? "border-dc-primary dc:ring-1 ring-dc-primary" : ""}
          `,
				children: [/* @__PURE__ */ W("span", {
					className: `dc:truncate ${_ ? "text-dc-text" : "text-dc-text-muted"}`,
					children: _ ? i.find((t) => t.dimension === e)?.label || e : n
				}), /* @__PURE__ */ G("span", {
					className: "dc:flex dc:items-center dc:gap-1 dc:ml-2",
					children: [_ && /* @__PURE__ */ W("span", {
						role: "button",
						tabIndex: 0,
						onClick: g,
						onKeyDown: (e) => e.key === "Enter" && g(e),
						className: "dc:p-0.5 dc:rounded-sm hover:bg-dc-surface-hover text-dc-text-muted hover:text-dc-text",
						title: "Clear",
						children: "×"
					}), Gt && /* @__PURE__ */ W(Gt, { className: `dc:w-4 dc:h-4 text-dc-text-muted dc:transition-transform ${s ? "dc:rotate-180" : ""}` })]
				})]
			}), s && /* @__PURE__ */ G("div", {
				className: "dc:absolute dc:z-50 dc:mt-1 dc:left-0 dc:right-0 dc:min-w-[200px] bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg",
				children: [
					/* @__PURE__ */ W("div", {
						className: "dc:p-2 dc:border-b border-dc-border",
						children: /* @__PURE__ */ G("div", {
							className: "dc:relative",
							children: [Jt && /* @__PURE__ */ W(Jt, { className: "dc:absolute dc:left-2 dc:top-1/2 dc:-translate-y-1/2 dc:w-4 dc:h-4 text-dc-text-muted" }), /* @__PURE__ */ W("input", {
								ref: f,
								type: "text",
								value: l,
								onChange: (e) => u(e.target.value),
								placeholder: "Search...",
								className: "dc:w-full dc:pl-8 dc:pr-3 dc:py-1.5 dc:text-sm bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm text-dc-text placeholder:text-dc-text-muted dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary"
							})]
						})
					}),
					/* @__PURE__ */ W("div", {
						className: "dc:max-h-48 dc:overflow-y-auto dc:p-1",
						children: Object.entries(m).length === 0 ? /* @__PURE__ */ W("div", {
							className: "dc:px-3 dc:py-4 dc:text-sm text-dc-text-muted dc:text-center",
							children: "No matching fields found"
						}) : Object.entries(m).map(([t, n]) => /* @__PURE__ */ G("div", {
							className: "dc:mb-2 dc:last:mb-0",
							children: [/* @__PURE__ */ W("div", {
								className: "dc:px-2 dc:py-1 dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wide",
								children: t
							}), n.map((t) => /* @__PURE__ */ G("button", {
								onClick: () => h(t.dimension),
								className: `
                          dc:flex dc:items-center dc:justify-between dc:w-full dc:px-3 dc:py-1.5 dc:text-sm
                          dc:rounded-sm dc:transition-colors
                          ${e === t.dimension ? "bg-dc-primary-bg text-dc-primary" : "text-dc-text hover:bg-dc-surface-hover"}
                        `,
								children: [/* @__PURE__ */ W("span", { children: t.label }), e === t.dimension && qt && /* @__PURE__ */ W(qt, { className: "dc:w-4 dc:h-4" })]
							}, t.dimension))]
						}, t))
					}),
					/* @__PURE__ */ W("div", {
						className: "dc:px-3 dc:py-2 dc:border-t border-dc-border dc:text-xs text-dc-text-muted",
						children: o
					})
				]
			})]
		})]
	});
}), rn = L(function({ dateRange: e, onDateRangeChange: t }) {
	let { t: n } = y(), r = e ?? {
		start: "",
		end: ""
	}, i = r.start ?? "", a = r.end ?? "", [o, s] = H(!1), [c, l] = H(() => i && a ? h(r) : "last_3_months"), [u, d] = H(i), [f, p] = H(a), g = V(null);
	z(() => {
		let t = e?.start ?? "", n = e?.end ?? "";
		d(t), p(n), t && n && l(h({
			start: t,
			end: n
		}));
	}, [e?.start, e?.end]);
	let v = R((e) => {
		if (l(e), e !== "custom") {
			let n = _(e);
			t(n), d(n.start), p(n.end), s(!1);
		}
	}, [t]), b = R(() => {
		u && f && (t({
			start: u,
			end: f
		}), l("custom"), s(!1));
	}, [
		u,
		f,
		t
	]);
	z(() => {
		function e(e) {
			g.current && !g.current.contains(e.target) && s(!1);
		}
		if (o) return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [o]);
	let x = B(() => {
		let t = m.find((e) => e.value === c);
		if (t && c !== "custom") return t.label;
		let n = e?.start ?? "", r = e?.end ?? "";
		return !n || !r ? "Select date range" : `${tn(n)} - ${tn(r)}`;
	}, [c, e]);
	return /* @__PURE__ */ G("div", {
		className: "dc:flex-1 dc:min-w-0",
		children: [/* @__PURE__ */ G("label", {
			className: "dc:flex dc:items-center dc:gap-1.5 dc:text-xs dc:font-medium text-dc-text-muted dc:mb-1",
			children: [Qt && /* @__PURE__ */ W(Qt, { className: "dc:w-3.5 dc:h-3.5" }), n("retention.dateRange.label")]
		}), /* @__PURE__ */ G("div", {
			ref: g,
			className: "dc:relative",
			children: [/* @__PURE__ */ G("button", {
				type: "button",
				onClick: () => s(!o),
				className: `
            dc:flex dc:items-center dc:justify-between dc:w-full dc:px-2.5 dc:py-1.5 dc:text-sm
            bg-dc-surface dc:border border-dc-border dc:rounded-sm
            hover:border-dc-primary dc:cursor-pointer dc:transition-colors
            ${o ? "border-dc-primary dc:ring-1 ring-dc-primary" : ""}
          `,
				children: [/* @__PURE__ */ W("span", {
					className: "text-dc-text dc:truncate",
					children: x
				}), Gt && /* @__PURE__ */ W(Gt, { className: `dc:w-4 dc:h-4 text-dc-text-muted dc:transition-transform dc:ml-2 ${o ? "dc:rotate-180" : ""}` })]
			}), o && /* @__PURE__ */ G("div", {
				className: "dc:absolute dc:z-50 dc:mt-1 dc:left-0 dc:right-0 dc:min-w-[280px] bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:shadow-lg dc:p-3",
				children: [/* @__PURE__ */ W("div", {
					className: "dc:grid dc:grid-cols-2 dc:gap-2 dc:mb-3",
					children: m.filter((e) => e.value !== "custom").map((e) => /* @__PURE__ */ W("button", {
						type: "button",
						onClick: () => v(e.value),
						className: `dc:px-3 dc:py-1.5 dc:text-xs dc:rounded-sm dc:transition-colors ${c === e.value ? "bg-dc-primary text-white" : "bg-dc-surface-secondary text-dc-text hover:bg-dc-surface-hover"}`,
						children: e.label
					}, e.value))
				}), /* @__PURE__ */ G("div", {
					className: "dc:border-t border-dc-border dc:pt-3",
					children: [
						/* @__PURE__ */ W("div", {
							className: "dc:text-xs dc:font-medium text-dc-text-muted dc:mb-2",
							children: n("retention.dateRange.customRange")
						}),
						/* @__PURE__ */ G("div", {
							className: "dc:flex dc:gap-2 dc:items-center dc:mb-2",
							children: [
								/* @__PURE__ */ W("input", {
									type: "date",
									value: u,
									onChange: (e) => {
										d(e.target.value), l("custom");
									},
									className: "dc:flex-1 dc:px-2 dc:py-1.5 dc:text-sm bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm text-dc-text dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary"
								}),
								/* @__PURE__ */ W("span", {
									className: "text-dc-text-muted dc:text-xs",
									children: "to"
								}),
								/* @__PURE__ */ W("input", {
									type: "date",
									value: f,
									onChange: (e) => {
										p(e.target.value), l("custom");
									},
									className: "dc:flex-1 dc:px-2 dc:py-1.5 dc:text-sm bg-dc-surface-secondary dc:border border-dc-border dc:rounded-sm text-dc-text dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary"
								})
							]
						}),
						/* @__PURE__ */ W("button", {
							type: "button",
							onClick: b,
							disabled: !u || !f,
							className: "dc:w-full dc:px-3 dc:py-1.5 dc:text-xs bg-dc-primary text-white dc:rounded-sm hover:bg-dc-primary-hover dc:disabled:opacity-50 dc:disabled:cursor-not-allowed dc:transition-colors",
							children: n("retention.dateRange.applyCustom")
						})
					]
				})]
			})]
		})]
	});
}), an = L(function({ selectedCube: e = null, bindingKey: t = null, timeDimension: n = null, dateRange: r = {
	start: "",
	end: ""
}, schema: i = null, onCubeChange: a = () => {}, onBindingKeyChange: o = () => {}, onTimeDimensionChange: s = () => {} }) {
	let { t: c } = y(), l = B(() => $t(i), [i]), u = B(() => {
		let t = j(i);
		return e ? t.filter((t) => t.cube === e) : [];
	}, [i, e]), d = B(() => {
		let t = en(i);
		return e ? t.filter((t) => t.cube === e) : [];
	}, [i, e]), f = !!(e && t?.dimension && n && r?.start && r?.end), [p, m] = H(!1), h = V(!1);
	z(() => {
		f && !h.current && (h.current = !0, m(!0));
	}, [f]);
	let g = t?.dimension ? typeof t.dimension == "string" ? t.dimension : t.dimension[0]?.dimension || null : null, _ = R((e) => {
		o(e ? { dimension: e } : null);
	}, [o]), v = l.find((t) => t.dimension === e)?.label || e, b = r?.start ? `${tn(r.start)} - ${tn(r.end)}` : "";
	return /* @__PURE__ */ G("div", {
		className: "bg-dc-surface-secondary dc:border-b border-dc-border",
		children: [/* @__PURE__ */ G("button", {
			type: "button",
			onClick: () => m(!p),
			className: "dc:flex dc:items-center dc:justify-between dc:w-full dc:px-4 dc:py-2.5 hover:bg-dc-surface-hover dc:transition-colors",
			children: [/* @__PURE__ */ G("div", {
				className: "dc:flex dc:items-center dc:gap-2",
				children: [
					p ? Kt && /* @__PURE__ */ W(Kt, { className: "dc:w-4 dc:h-4 text-dc-text-muted" }) : Gt && /* @__PURE__ */ W(Gt, { className: "dc:w-4 dc:h-4 text-dc-text-muted" }),
					/* @__PURE__ */ W(N, {
						className: "dc:mb-0",
						children: c("retention.config.configuration")
					}),
					f && /* @__PURE__ */ W("span", {
						className: "dc:flex dc:items-center dc:gap-1 dc:text-xs text-dc-success",
						children: qt && /* @__PURE__ */ W(qt, { className: "dc:w-3.5 dc:h-3.5" })
					})
				]
			}), p && f && /* @__PURE__ */ G("span", {
				className: "dc:text-xs text-dc-text-muted dc:truncate dc:max-w-[200px]",
				children: [
					v,
					" • ",
					b
				]
			})]
		}), !p && /* @__PURE__ */ G("div", {
			className: "dc:flex dc:flex-col dc:gap-3 dc:px-4 dc:pb-3",
			children: [
				/* @__PURE__ */ W(nn, {
					value: e,
					label: "Cube",
					placeholder: "Select cube",
					icon: Yt,
					options: l,
					onChange: a,
					helpText: "Select the cube containing your user events"
				}),
				/* @__PURE__ */ W(nn, {
					value: g,
					label: "Binding Key",
					placeholder: e ? "Select user identifier" : "Select cube first",
					icon: Xt,
					options: u,
					onChange: _,
					helpText: "Dimension that identifies entities across events (e.g., user ID, customer ID)"
				}),
				/* @__PURE__ */ W(nn, {
					value: n,
					label: "Timestamp",
					placeholder: e ? "Select timestamp" : "Select cube first",
					icon: Zt,
					options: d,
					onChange: s,
					helpText: "Timestamp field for cohort entry and activity"
				})
			]
		})]
	});
});
//#endregion
//#region src/client/components/AnalysisBuilder/utils/sortUtils.ts
function on(e) {
	switch (e) {
		case null: return "asc";
		case "asc": return "desc";
		case "desc": return null;
		default: return "asc";
	}
}
//#endregion
//#region src/client/components/AnalysisBuilder/BreakdownRow.tsx
var sn = L(function({ breakdown: e, fieldMeta: t, sortDirection: n, sortPriority: r, index: i, transform: a, showGapBefore: o, isAnyDragging: s, isDragging: c, comparisonDisabled: l, onRemove: u, onGranularityChange: d, onComparisonToggle: f, onOrderChange: p, onReorder: m, onItemDragOver: h, onItemDrop: g, onDragStart: _, onDragEnd: v }) {
	return /* @__PURE__ */ G("div", {
		className: "dc:relative",
		style: {
			transform: a,
			transition: s ? "transform 0.15s ease-out" : "none"
		},
		onDragOver: m ? (e) => h(e, i) : void 0,
		onDrop: m ? g : void 0,
		children: [o && /* @__PURE__ */ W("div", {
			className: "dc:absolute dc:-top-5 dc:left-0 dc:right-0 dc:flex dc:items-center dc:justify-center dc:pointer-events-none dc:z-10",
			children: /* @__PURE__ */ W("div", { className: "dc:h-0.5 dc:w-full bg-dc-primary dc:rounded-full" })
		}), /* @__PURE__ */ W(nt, {
			breakdown: e,
			fieldMeta: t,
			onRemove: () => u(e.id),
			onGranularityChange: e.isTimeDimension ? (t) => d(e.id, t) : void 0,
			onComparisonToggle: e.isTimeDimension && f ? () => f(e.id) : void 0,
			comparisonDisabled: l,
			sortDirection: n,
			sortPriority: r,
			onToggleSort: p ? () => {
				p(e.field, on(n));
			} : void 0,
			index: i,
			isDragging: c,
			onDragStart: m ? _ : void 0,
			onDragEnd: m ? v : void 0
		})]
	});
}), cn = 40;
function ln(e, t, n) {
	return t === null || n === null || e === t ? "" : t < n ? e > t && e < n ? "" : e === n - 1 ? `translateY(-${cn / 2}px)` : e >= n ? `translateY(${cn / 2}px)` : "" : e >= n && e < t ? `translateY(${cn / 2}px)` : "";
}
function un(e, t, n, r) {
	let [i, a] = H(null), [o, s] = H(null), c = V(null), l = V(null), u = V(null);
	return {
		draggedIndex: i,
		dropTargetIndex: o,
		handleDragStart: R((n, r) => {
			a(r), c.current = r, n.dataTransfer.effectAllowed = "move", n.dataTransfer.setData("text/plain", JSON.stringify({
				type: e,
				index: r,
				field: t(r)
			}));
			let i = n.currentTarget, o = i.cloneNode(!0);
			o.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: ${i.offsetWidth}px;
      opacity: 0.7;
      transform: rotate(2deg);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      pointer-events: none;
    `, document.body.appendChild(o), u.current = o;
			let s = i.getBoundingClientRect();
			n.dataTransfer.setDragImage(o, n.clientX - s.left, n.clientY - s.top);
		}, [e, t]),
		handleDragEnd: R(() => {
			a(null), s(null), c.current = null, l.current = null, u.current &&= (document.body.removeChild(u.current), null);
		}, []),
		handleItemDragOver: R((e, t) => {
			e.preventDefault(), e.stopPropagation();
			let n = c.current;
			if (n === null) return;
			let r = e.currentTarget.getBoundingClientRect(), i = e.clientY - r.top < r.height / 2 ? t : t + 1;
			i === n || i === n + 1 ? (s(null), l.current = null) : (s(i), l.current = i);
		}, []),
		handleItemDrop: R((e) => {
			e.preventDefault(), e.stopPropagation();
			let t = c.current, n = l.current;
			if (a(null), s(null), c.current = null, l.current = null, t === null || n === null || !r) return;
			let i = n > t ? n - 1 : n;
			i !== t && r(t, i);
		}, [r]),
		handleSectionDragLeave: R((e) => {
			let t = e.relatedTarget;
			(!t || !e.currentTarget.contains(t)) && s(null);
		}, []),
		handleEndZoneDragOver: R((e) => {
			e.preventDefault();
			let t = n;
			l.current !== t && c.current !== t - 1 && (s(t), l.current = t);
		}, [n]),
		getItemTransform: R((e) => ln(e, i, o), [i, o]),
		shouldShowGapIndicator: R((e) => i === null || o === null ? !1 : e === o, [i, o])
	};
}
//#endregion
//#region src/client/components/AnalysisBuilder/BreakdownSection.tsx
var dn = o("add");
function fn(e, t) {
	if (!t?.cubes) return null;
	let [n] = e.split("."), r = t.cubes.find((e) => e.name === n);
	return r && r.dimensions?.find((t) => t.name === e) || null;
}
var pn = L(function({ breakdowns: e, schema: t, onAdd: n, onRemove: r, onGranularityChange: i, onComparisonToggle: a, order: o, onOrderChange: s, onReorder: c }) {
	let { t: l } = y(), u = un("breakdown", (t) => e[t].field, e.length, c), { draggedIndex: d, dropTargetIndex: f } = u, p = B(() => o ? Object.keys(o) : [], [o]), m = B(() => e.find((e) => e.isTimeDimension && e.enableComparison)?.id || null, [e]), h = B(() => e.map((e, n) => {
		let r = o?.[e.field] || null, i = r ? p.indexOf(e.field) + 1 : void 0;
		return {
			breakdown: e,
			fieldMeta: fn(e.field, t),
			sortDirection: r,
			sortPriority: i,
			index: n
		};
	}), [
		e,
		t,
		o,
		p
	]);
	return /* @__PURE__ */ G("div", { children: [/* @__PURE__ */ G("button", {
		onClick: n,
		className: "dc:flex dc:items-center dc:justify-between dc:mb-3 dc:w-full dc:py-1 dc:px-2 dc:-ml-2 dc:rounded-lg hover:bg-dc-primary/10 dc:transition-colors dc:group",
		title: "Add breakdown",
		children: [/* @__PURE__ */ W(N, { children: l("analysis.sections.breakdown") }), /* @__PURE__ */ W(dn, { className: "dc:w-5 dc:h-5 text-dc-text-secondary group-hover:text-dc-primary dc:transition-colors" })]
	}), /* @__PURE__ */ G("div", {
		className: "dc:space-y-2",
		onDragLeave: c ? u.handleSectionDragLeave : void 0,
		onDragOver: c ? (e) => e.preventDefault() : void 0,
		onDrop: c ? u.handleItemDrop : void 0,
		children: [
			h.map(({ breakdown: e, fieldMeta: t, sortDirection: n, sortPriority: o, index: l }) => /* @__PURE__ */ W(sn, {
				breakdown: e,
				fieldMeta: t,
				sortDirection: n,
				sortPriority: o,
				index: l,
				transform: u.getItemTransform(l),
				showGapBefore: u.shouldShowGapIndicator(l),
				isAnyDragging: d !== null,
				isDragging: d === l,
				comparisonDisabled: m !== null && m !== e.id,
				onRemove: r,
				onGranularityChange: i,
				onComparisonToggle: a,
				onOrderChange: s,
				onReorder: c,
				onItemDragOver: u.handleItemDragOver,
				onItemDrop: u.handleItemDrop,
				onDragStart: u.handleDragStart,
				onDragEnd: u.handleDragEnd
			}, e.id)),
			c && d !== null && f === e.length && /* @__PURE__ */ W("div", {
				className: "dc:relative dc:h-2",
				children: /* @__PURE__ */ W("div", {
					className: "dc:absolute dc:top-0 dc:left-0 dc:right-0 dc:flex dc:items-center dc:justify-center dc:pointer-events-none dc:z-10",
					children: /* @__PURE__ */ W("div", { className: "dc:h-0.5 dc:w-full bg-dc-primary dc:rounded-full" })
				})
			}),
			c && e.length > 0 && d !== null && /* @__PURE__ */ W("div", {
				className: "dc:h-8",
				onDragOver: u.handleEndZoneDragOver,
				onDrop: u.handleItemDrop
			})
		]
	})] });
});
//#endregion
//#region src/client/components/AnalysisBuilder/RetentionModeContent.tsx
function mn(e) {
	return !e || !Array.isArray(e) ? [] : e.map((e) => ({
		id: e.field,
		field: e.field,
		isTimeDimension: !1,
		granularity: void 0,
		enableComparison: !1
	}));
}
var hn = L(function({ retentionCube: e = null, retentionBindingKey: t = null, retentionTimeDimension: n = null, retentionDateRange: r = {
	start: "",
	end: ""
}, retentionCohortFilters: i = [], retentionActivityFilters: a = [], retentionBreakdowns: o = [], retentionViewGranularity: s = "week", retentionPeriods: c = 12, retentionType: l = "classic", schema: d = null, onCubeChange: f = () => {}, onBindingKeyChange: m = () => {}, onTimeDimensionChange: h = () => {}, onDateRangeChange: _ = () => {}, onCohortFiltersChange: v = () => {}, onActivityFiltersChange: b = () => {}, onBreakdownsChange: x = () => {}, onAddBreakdown: S = () => {}, onRemoveBreakdown: C = () => {}, onGranularityChange: T = () => {}, onPeriodsChange: E = () => {}, onRetentionTypeChange: D = () => {}, onOpenFieldModal: O = () => {}, chartType: k = "retentionCombined", onChartTypeChange: A, displayConfig: j, colorPalette: M, onDisplayConfigChange: P }) {
	let { t: F } = y(), [I, L] = H("config"), z = j && P, ee = B(() => !d || !e ? d : {
		...d,
		cubes: d.cubes?.filter((t) => t.name === e) || []
	}, [d, e]), V = B(() => mn(o), [o]), te = R((e) => {
		C(e);
	}, [C]), U = R(() => {
		O && O();
	}, [O]), ne = R(() => {}, []);
	return /* @__PURE__ */ G("div", {
		className: "dc:flex dc:flex-col dc:h-full dc:min-h-0 dc:overflow-hidden",
		children: [/* @__PURE__ */ W("div", {
			className: "dc:border-b border-dc-border dc:flex-shrink-0 dc:overflow-x-auto dc:overflow-y-hidden scrollbar-thin",
			children: /* @__PURE__ */ G("div", {
				className: "dc:flex dc:min-w-max",
				children: [/* @__PURE__ */ W("button", {
					onClick: () => L("config"),
					className: `dc:flex-1 dc:px-4 dc:py-3 dc:text-sm dc:font-medium dc:transition-colors dc:whitespace-nowrap ${I === "config" ? "text-dc-primary dc:border-b-2 border-dc-primary" : "text-dc-text-secondary hover:text-dc-text"}`,
					children: F("retention.tabs.retention")
				}), /* @__PURE__ */ W("button", {
					onClick: () => z && L("display"),
					disabled: !z,
					className: `dc:flex-1 dc:px-4 dc:py-3 dc:text-sm dc:font-medium dc:transition-colors dc:whitespace-nowrap ${I === "display" ? "text-dc-primary dc:border-b-2 border-dc-primary" : z ? "text-dc-text-secondary hover:text-dc-text" : "text-dc-text-muted dc:cursor-not-allowed dc:opacity-50"}`,
					title: F(z ? "retention.tabs.displayTitle" : "retention.tabs.displayUnavailable"),
					children: F("retention.tabs.display")
				})]
			})
		}), I === "config" ? /* @__PURE__ */ G("div", {
			className: "dc:flex dc:flex-col dc:flex-1 dc:min-h-0",
			children: [/* @__PURE__ */ W(an, {
				selectedCube: e,
				bindingKey: t,
				timeDimension: n,
				dateRange: r,
				schema: d,
				onCubeChange: f,
				onBindingKeyChange: m,
				onTimeDimensionChange: h
			}), /* @__PURE__ */ G("div", {
				className: "dc:flex-1 dc:min-h-0 dc:overflow-auto dc:p-4 dc:space-y-6",
				children: [
					/* @__PURE__ */ G("div", { children: [
						/* @__PURE__ */ W(N, { children: F("retention.dateRange.title") }),
						/* @__PURE__ */ W("p", {
							className: "dc:text-xs text-dc-text-muted dc:mb-3",
							children: F("retention.dateRange.description")
						}),
						/* @__PURE__ */ W(rn, {
							dateRange: r,
							onDateRangeChange: _
						})
					] }),
					/* @__PURE__ */ G("div", { children: [
						/* @__PURE__ */ W(N, { children: F("retention.cohortFilter.title") }),
						/* @__PURE__ */ W("p", {
							className: "dc:text-xs text-dc-text-muted dc:mb-3",
							children: F("retention.cohortFilter.description")
						}),
						/* @__PURE__ */ W(w, {
							filters: i,
							schema: ee,
							onFiltersChange: v,
							dimensionsOnly: !0
						})
					] }),
					/* @__PURE__ */ G("div", { children: [
						/* @__PURE__ */ W(N, { children: F("retention.returnFilter.title") }),
						/* @__PURE__ */ W("p", {
							className: "dc:text-xs text-dc-text-muted dc:mb-3",
							children: F("retention.returnFilter.description")
						}),
						/* @__PURE__ */ W(w, {
							filters: a,
							schema: ee,
							onFiltersChange: b,
							dimensionsOnly: !0
						})
					] }),
					/* @__PURE__ */ G("div", { children: [
						/* @__PURE__ */ W(N, { children: F("retention.breakdown.title") }),
						/* @__PURE__ */ W("p", {
							className: "dc:text-xs text-dc-text-muted dc:mb-3",
							children: F("retention.breakdown.description")
						}),
						/* @__PURE__ */ W(pn, {
							breakdowns: V,
							schema: ee,
							onAdd: U,
							onRemove: te,
							onGranularityChange: ne
						})
					] }),
					/* @__PURE__ */ G("div", { children: [
						/* @__PURE__ */ W(N, { children: F("retention.settings.title") }),
						/* @__PURE__ */ W("p", {
							className: "dc:text-xs text-dc-text-muted dc:mb-3",
							children: F("retention.settings.description")
						}),
						/* @__PURE__ */ G("div", {
							className: "dc:space-y-4",
							children: [
								/* @__PURE__ */ G("div", { children: [/* @__PURE__ */ W("label", {
									className: "dc:block dc:text-xs dc:font-medium text-dc-text-muted dc:mb-1",
									children: F("retention.settings.granularityLabel")
								}), /* @__PURE__ */ W("div", {
									className: "dc:flex dc:gap-2",
									children: g.map((e) => /* @__PURE__ */ W("button", {
										type: "button",
										onClick: () => T(e.value),
										className: `dc:flex-1 dc:px-3 dc:py-2 dc:rounded-md dc:border dc:text-sm dc:font-medium dc:transition-colors ${s === e.value ? "border-dc-primary bg-dc-primary/10 text-dc-primary" : "border-dc-border bg-dc-surface hover:bg-dc-surface-hover text-dc-text"}`,
										children: e.label
									}, e.value))
								})] }),
								/* @__PURE__ */ G("div", { children: [
									/* @__PURE__ */ W("label", {
										className: "dc:block dc:text-xs dc:font-medium text-dc-text-muted dc:mb-1",
										children: F("retention.settings.periodsLabel", {
											min: 1,
											max: 52
										})
									}),
									/* @__PURE__ */ G("div", {
										className: "dc:flex dc:items-center dc:gap-4",
										children: [/* @__PURE__ */ W("input", {
											type: "range",
											min: 1,
											max: 52,
											value: c,
											onChange: (e) => E(parseInt(e.target.value, 10)),
											className: "dc:flex-1"
										}), /* @__PURE__ */ W("span", {
											className: "dc:w-8 dc:text-sm dc:font-medium text-dc-text dc:text-center",
											children: c
										})]
									}),
									c > 26 && /* @__PURE__ */ W("p", {
										className: "dc:mt-1 dc:text-xs text-dc-warning",
										children: F("retention.settings.periodsWarning")
									})
								] }),
								/* @__PURE__ */ G("div", { children: [/* @__PURE__ */ W("label", {
									className: "dc:block dc:text-xs dc:font-medium text-dc-text-muted dc:mb-1",
									children: F("retention.settings.retentionTypeLabel")
								}), /* @__PURE__ */ W("div", {
									className: "dc:flex dc:gap-2",
									children: p.map((e) => /* @__PURE__ */ W("button", {
										type: "button",
										onClick: () => D(e.value),
										className: `dc:flex-1 dc:px-3 dc:py-2 dc:rounded-md dc:border dc:text-sm dc:transition-colors ${l === e.value ? "border-dc-primary bg-dc-primary/10 text-dc-primary" : "border-dc-border bg-dc-surface hover:bg-dc-surface-hover text-dc-text"}`,
										children: /* @__PURE__ */ G("div", {
											className: "dc:flex dc:flex-col dc:items-center dc:gap-0.5",
											children: [/* @__PURE__ */ W("span", {
												className: "dc:font-medium",
												children: e.label
											}), /* @__PURE__ */ W("span", {
												className: "dc:text-[10px] dc:font-normal text-dc-text-muted",
												children: e.description
											})]
										})
									}, e.value))
								})] })
							]
						})
					] })
				]
			})]
		}) : I === "display" && j && P ? /* @__PURE__ */ W("div", {
			className: "dc:flex-1 dc:min-h-0 dc:overflow-auto dc:p-4",
			children: /* @__PURE__ */ W(u, {
				chartType: k,
				displayConfig: j,
				colorPalette: M,
				onDisplayConfigChange: P
			})
		}) : null]
	});
}), gn = L(function({ metric: e, fieldMeta: n, onRemove: r, sortDirection: i, sortPriority: a, onToggleSort: s, index: c, isDragging: l, onDragStart: u, onDragEnd: d }) {
	let f = o("close"), p = t(n?.type || "count") || o("measure"), m = n?.shortTitle || n?.title || e.field.split(".").pop() || e.field, h = e.field.split(".")[0], g = typeof c == "number" && u && d;
	return /* @__PURE__ */ G("div", {
		className: `dc:flex dc:items-center dc:gap-2 dc:p-2 bg-dc-surface-secondary dc:rounded-lg dc:group hover:bg-dc-surface-tertiary dc:transition-all dc:duration-150 ${g ? "dc:cursor-grab dc:active:cursor-grabbing" : ""} ${l ? "dc:opacity-30" : ""}`,
		draggable: g ? !0 : void 0,
		onDragStart: g ? (e) => u(e, c) : void 0,
		onDragEnd: g ? d : void 0,
		children: [
			/* @__PURE__ */ W("span", {
				className: "dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded-sm bg-dc-measure text-dc-measure-text dc:flex-shrink-0",
				children: p && /* @__PURE__ */ W(p, { className: "dc:w-4 dc:h-4" })
			}),
			/* @__PURE__ */ G("div", {
				className: "dc:flex-1 dc:min-w-0",
				children: [/* @__PURE__ */ W("div", {
					className: "dc:text-sm text-dc-text dc:truncate",
					title: e.field,
					children: m
				}), /* @__PURE__ */ W("div", {
					className: "dc:text-xs text-dc-text-muted dc:truncate",
					children: h
				})]
			}),
			s && /* @__PURE__ */ W(et, {
				sortDirection: i,
				sortPriority: a,
				onToggleSort: s
			}),
			/* @__PURE__ */ W("button", {
				onClick: r,
				className: "dc:p-1 text-dc-text-muted hover:text-dc-danger dc:opacity-100 dc:sm:opacity-0 dc:sm:group-hover:opacity-100 dc:transition-opacity dc:flex-shrink-0",
				title: "Remove metric",
				children: /* @__PURE__ */ W(f, { className: "dc:w-4 dc:h-4" })
			})
		]
	});
}), _n = L(function({ metric: e, fieldMeta: t, sortDirection: n, sortPriority: r, index: i, transform: a, showGapBefore: o, isAnyDragging: s, isDragging: c, onRemove: l, onOrderChange: u, onReorder: d, onItemDragOver: f, onItemDrop: p, onDragStart: m, onDragEnd: h }) {
	return /* @__PURE__ */ G("div", {
		className: "dc:relative",
		style: {
			transform: a,
			transition: s ? "transform 0.15s ease-out" : "none"
		},
		onDragOver: d ? (e) => f(e, i) : void 0,
		onDrop: d ? p : void 0,
		children: [o && /* @__PURE__ */ W("div", {
			className: "dc:absolute dc:-top-5 dc:left-0 dc:right-0 dc:flex dc:items-center dc:justify-center dc:pointer-events-none dc:z-10",
			children: /* @__PURE__ */ W("div", { className: "dc:h-0.5 dc:w-full bg-dc-primary dc:rounded-full" })
		}), /* @__PURE__ */ W(gn, {
			metric: e,
			fieldMeta: t,
			onRemove: () => l(e.id),
			sortDirection: n,
			sortPriority: r,
			onToggleSort: u ? () => {
				u(e.field, on(n));
			} : void 0,
			index: i,
			isDragging: c,
			onDragStart: d ? m : void 0,
			onDragEnd: d ? h : void 0
		})]
	});
}), vn = o("add");
function yn(e, t) {
	if (!t?.cubes) return null;
	let [n] = e.split("."), r = t.cubes.find((e) => e.name === n);
	return r && r.measures?.find((t) => t.name === e) || null;
}
var bn = L(function({ metrics: e, schema: t, onAdd: n, onRemove: r, order: i, onOrderChange: a, onReorder: o }) {
	let { t: s } = y(), c = un("metric", (t) => e[t].field, e.length, o), { draggedIndex: l, dropTargetIndex: u } = c, d = B(() => i ? Object.keys(i) : [], [i]), f = B(() => e.map((e, n) => {
		let r = i?.[e.field] || null, a = r ? d.indexOf(e.field) + 1 : void 0;
		return {
			metric: e,
			fieldMeta: yn(e.field, t),
			sortDirection: r,
			sortPriority: a,
			index: n
		};
	}), [
		e,
		t,
		i,
		d
	]);
	return /* @__PURE__ */ G("div", { children: [/* @__PURE__ */ G("button", {
		onClick: n,
		className: "dc:flex dc:items-center dc:justify-between dc:mb-3 dc:w-full dc:py-1 dc:px-2 dc:-ml-2 dc:rounded-lg hover:bg-dc-primary/10 dc:transition-colors dc:group",
		title: "Add metric",
		children: [/* @__PURE__ */ W(N, { children: s("analysis.sections.metrics") }), /* @__PURE__ */ W(vn, { className: "dc:w-5 dc:h-5 text-dc-text-secondary group-hover:text-dc-primary dc:transition-colors" })]
	}), /* @__PURE__ */ G("div", {
		className: "dc:space-y-2",
		onDragLeave: o ? c.handleSectionDragLeave : void 0,
		onDragOver: o ? (e) => e.preventDefault() : void 0,
		onDrop: o ? c.handleItemDrop : void 0,
		children: [
			f.map(({ metric: e, fieldMeta: t, sortDirection: n, sortPriority: i, index: s }) => /* @__PURE__ */ W(_n, {
				metric: e,
				fieldMeta: t,
				sortDirection: n,
				sortPriority: i,
				index: s,
				transform: c.getItemTransform(s),
				showGapBefore: c.shouldShowGapIndicator(s),
				isAnyDragging: l !== null,
				isDragging: l === s,
				onRemove: r,
				onOrderChange: a,
				onReorder: o,
				onItemDragOver: c.handleItemDragOver,
				onItemDrop: c.handleItemDrop,
				onDragStart: c.handleDragStart,
				onDragEnd: c.handleDragEnd
			}, e.id)),
			o && l !== null && u === e.length && /* @__PURE__ */ W("div", {
				className: "dc:relative dc:h-2",
				children: /* @__PURE__ */ W("div", {
					className: "dc:absolute dc:top-0 dc:left-0 dc:right-0 dc:flex dc:items-center dc:justify-center dc:pointer-events-none dc:z-10",
					children: /* @__PURE__ */ W("div", { className: "dc:h-0.5 dc:w-full bg-dc-primary dc:rounded-full" })
				})
			}),
			o && e.length > 0 && l !== null && /* @__PURE__ */ W("div", {
				className: "dc:h-8",
				onDragOver: c.handleEndZoneDragOver,
				onDrop: c.handleItemDrop
			})
		]
	})] });
}), xn = [
	5,
	10,
	25,
	50,
	100,
	500,
	1e3
];
function Sn({ limit: e, onLimitChange: t }) {
	let { t: n } = y(), r = e != null && !xn.includes(e), [i, a] = H(r), [o, s] = H(r ? String(e) : ""), c = V(null);
	z(() => {
		i && c.current && (c.current.focus(), c.current.select());
	}, [i]), z(() => {
		e != null && !xn.includes(e) && (s(String(e)), a(!0));
	}, [e]);
	let l = (e) => {
		a(!1), t(e);
	}, u = () => {
		if (a(!0), o) {
			let e = parseInt(o, 10);
			!isNaN(e) && e > 0 && t(e);
		}
	}, d = () => {
		let e = o.trim();
		if (e === "") t(void 0), a(!1);
		else {
			let n = parseInt(e, 10);
			!isNaN(n) && n > 0 && t(n);
		}
	};
	return /* @__PURE__ */ G("div", { children: [/* @__PURE__ */ G("div", {
		className: "dc:flex dc:items-center dc:justify-between dc:mb-3",
		children: [/* @__PURE__ */ G(N, { children: [n("query.limit.label"), e != null && /* @__PURE__ */ G("span", {
			className: "dc:ml-1.5 dc:text-xs dc:font-normal text-dc-text-muted dc:normal-case dc:tracking-normal",
			children: [
				"(",
				e.toLocaleString(),
				")"
			]
		})] }), e != null && /* @__PURE__ */ W("span", {
			role: "button",
			tabIndex: 0,
			onClick: () => l(void 0),
			onKeyDown: (e) => {
				(e.key === "Enter" || e.key === " ") && l(void 0);
			},
			className: "dc:text-xs text-dc-text-muted hover:text-dc-error dc:underline dc:cursor-pointer",
			children: n("query.limit.clear")
		})]
	}), /* @__PURE__ */ G("div", {
		className: "dc:flex dc:flex-wrap dc:gap-1",
		children: [xn.map((t) => /* @__PURE__ */ W("button", {
			onClick: () => l(t),
			className: `dc:px-2 dc:py-0.5 dc:text-xs dc:rounded-sm dc:border dc:transition-colors ${e === t && !i ? "bg-dc-primary/10 border-dc-primary text-dc-primary dc:font-medium" : "border-dc-border text-dc-text-secondary dc:hover:border-dc-primary/50 dc:hover:text-dc-primary"}`,
			children: t >= 1e3 ? `${t / 1e3}k` : t
		}, t)), i ? /* @__PURE__ */ W("input", {
			ref: c,
			type: "number",
			min: "1",
			value: o,
			onChange: (e) => s(e.target.value),
			onBlur: d,
			onKeyDown: (e) => {
				e.key === "Enter" && d(), e.key === "Escape" && (a(!1), o.trim() || t(void 0));
			},
			placeholder: "#",
			className: "dc:w-16 dc:px-2 dc:py-0.5 dc:text-xs dc:rounded-sm dc:border border-dc-primary bg-dc-surface text-dc-text dc:text-center dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary"
		}) : /* @__PURE__ */ W("button", {
			onClick: u,
			className: `dc:px-2 dc:py-0.5 dc:text-xs dc:rounded-sm dc:border dc:transition-colors ${r ? "bg-dc-primary/10 border-dc-primary text-dc-primary dc:font-medium" : "border-dc-border text-dc-text-secondary dc:hover:border-dc-primary/50 dc:hover:text-dc-primary"}`,
			children: r ? e : "..."
		})]
	})] });
}
//#endregion
//#region src/client/components/AnalysisBuilder/AnalysisAxisDropZone.tsx
var Cn = o("close"), wn = o("dimension"), Tn = o("timeDimension"), En = o("measure");
function Dn({ config: e, fields: n, onDrop: r, onRemove: i, onDragStart: a, onDragEnd: o, onDragOver: s, onReorder: c, draggedItem: l, getFieldMeta: u, yAxisAssignment: d, onYAxisAssignmentChange: f }) {
	let { t: p } = y(), { key: m, label: h, description: g, mandatory: _, maxItems: v, emptyText: b } = e, [x, S] = H(null), [C, w] = H(!1), [T, E] = H(!1), D = V(null), O = V(null), k = V(n);
	k.current = n;
	let A = V(null), j = () => {
		let e = n.length;
		return l && l.fromAxis === m && (e = Math.max(0, n.length - 1)), !v || e < v;
	}, M = () => {
		let e = n.length;
		return l && l.fromAxis === m && (e = Math.max(0, n.length - 1)), v && e >= v;
	}, N = j(), P = M();
	z(() => {
		let e = () => {
			S(null), A.current = null, w(!1), E(!1), D.current = null;
		};
		return document.addEventListener("dragend", e), () => {
			document.removeEventListener("dragend", e);
		};
	}, []), z(() => {
		l ? l.fromAxis === m ? l.fromAxis === m && l.fromIndex !== void 0 && w(!1) : (E(!1), S(null), A.current = null) : (S(null), A.current = null, w(!1), E(!1));
	}, [l, m]);
	let F = R((e, t) => {
		if (!l || l.fromAxis !== m || l.fromIndex === void 0) return;
		e.preventDefault(), e.stopPropagation();
		let n = e.currentTarget.getBoundingClientRect(), r = e.clientY - n.top < n.height / 2, i = l.fromIndex, a = r ? t : t + 1;
		a === i || a === i + 1 ? (S(null), A.current = null) : (S(a), A.current = a, E(!0));
	}, [l, m]), I = R((e) => {
		e.preventDefault();
		let t = A.current;
		if (!(l && l.fromAxis === m && l.fromIndex !== void 0 && t !== null)) {
			S(null), A.current = null, E(!1);
			return;
		}
		e.stopPropagation();
		let n = l.fromIndex, r = t > n ? t - 1 : t;
		c && r !== n && c(n, r, m), S(null), A.current = null, E(!1);
	}, [
		l,
		m,
		c
	]), L = R((e, t) => {
		let n = O.current;
		if (n && D.current === t) {
			let r = n.getBoundingClientRect();
			e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom || setTimeout(() => {
				k.current.includes(t) && i(t, m);
			}, 0);
		}
		D.current = null, S(null), A.current = null, E(!1), o?.(e);
	}, [
		m,
		i,
		o
	]), ee = R((e) => {
		if (!l || l.fromAxis !== m || l.fromIndex === void 0 || x === null) return "";
		let t = l.fromIndex;
		if (e === t) return "";
		if (t < x) {
			if (e >= x) return "translateY(20px)";
		} else if (e >= x && e < t) return "translateY(20px)";
		return "";
	}, [
		l,
		m,
		x
	]), B = R((e) => !l || l.fromAxis !== m || x === null ? !1 : e === x, [
		l,
		m,
		x
	]), te = (e) => {
		let t = e.split("."), n = t[0] || e, r = t[1] || e;
		return {
			title: r,
			shortTitle: r,
			cubeName: n,
			type: "dimension"
		};
	}, U = (e) => {
		if (e.type === "measure") {
			let n = t(e.measureType || "count") || En;
			return /* @__PURE__ */ W("span", {
				className: "dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded-sm bg-dc-measure text-dc-measure-text dc:flex-shrink-0",
				children: /* @__PURE__ */ W(n, { className: "dc:w-4 dc:h-4" })
			});
		}
		return e.type === "timeDimension" ? /* @__PURE__ */ W("span", {
			className: "dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded-sm bg-dc-time-dimension text-dc-time-dimension-text dc:flex-shrink-0",
			children: /* @__PURE__ */ W(Tn, { className: "dc:w-4 dc:h-4" })
		}) : /* @__PURE__ */ W("span", {
			className: "dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded-sm bg-dc-dimension text-dc-dimension-text dc:flex-shrink-0",
			children: /* @__PURE__ */ W(wn, { className: "dc:w-4 dc:h-4" })
		});
	};
	return /* @__PURE__ */ G("div", {
		className: "dc:mb-3",
		children: [
			/* @__PURE__ */ G("div", {
				className: "dc:mb-2",
				children: [/* @__PURE__ */ G("h4", {
					className: "dc:text-sm dc:font-medium text-dc-text dc:flex dc:items-center",
					children: [p(h), _ && /* @__PURE__ */ W("span", {
						className: "text-dc-error dc:ml-1",
						children: "*"
					})]
				}), g && /* @__PURE__ */ W("div", {
					className: "dc:text-xs text-dc-text-muted dc:mt-0.5",
					children: p(g)
				})]
			}),
			/* @__PURE__ */ W("div", {
				ref: O,
				"data-axis-container": m,
				className: `dc:min-h-[48px] dc:border-2 dc:border-dashed dc:rounded-lg dc:p-2 dc:transition-all dc:duration-200 ${C && (N || v === 1) || T ? "dc:shadow-sm dc:border-solid" : P ? "bg-dc-surface-secondary" : "bg-dc-surface-secondary hover:bg-dc-surface-hover"}`,
				style: {
					borderColor: C && (N || v === 1) || T ? "var(--dc-primary)" : "var(--dc-border)",
					backgroundColor: C && (N || v === 1) || T ? "rgba(var(--dc-primary-rgb), 0.1)" : void 0
				},
				onDragOver: (e) => {
					l && l.fromAxis === m && l.fromIndex !== void 0 || (N || v === 1 ? (w(!0), s(e)) : (e.preventDefault(), e.dataTransfer.dropEffect = "none"));
				},
				onDragLeave: (e) => {
					let t = e.currentTarget.getBoundingClientRect(), n = e.clientX < t.left || e.clientX > t.right || e.clientY < t.top || e.clientY > t.bottom, r = e.relatedTarget, i = r && !e.currentTarget.contains(r);
					(n || i || e.currentTarget === e.target) && (w(!1), E(!1));
				},
				onDrop: (e) => {
					l && l.fromAxis === m && l.fromIndex !== void 0 || (N || v === 1 ? r(e, m) : e.preventDefault(), w(!1), E(!1));
				},
				children: n.length === 0 ? /* @__PURE__ */ W("div", {
					className: "dc:text-sm text-dc-text-muted dc:text-center dc:py-2",
					children: p(P ? "chart.dropZone.maxReached" : b || "chart.dropZone.default.empty")
				}) : /* @__PURE__ */ G("div", {
					className: "dc:space-y-2",
					onDragOver: (e) => {
						l && l.fromAxis === m && e.preventDefault();
					},
					onDrop: (e) => {
						l && l.fromAxis === m && l.fromIndex !== void 0 && I(e);
					},
					children: [
						n.map((t, n) => {
							let r = u ? u(t) : te(t), o = l && l.field === t && l.fromAxis === m, s = ee(n), c = B(n);
							return /* @__PURE__ */ G("div", {
								className: "dc:relative",
								style: {
									transform: s,
									transition: l && l.fromAxis === m ? "transform 0.15s ease-out" : "none"
								},
								children: [c && /* @__PURE__ */ W("div", {
									className: "dc:absolute dc:-top-5 dc:left-0 dc:right-0 dc:flex dc:items-center dc:justify-center dc:pointer-events-none dc:z-10",
									children: /* @__PURE__ */ W("div", { className: "dc:h-0.5 dc:w-full bg-dc-primary dc:rounded-full" })
								}), /* @__PURE__ */ G("div", {
									draggable: !0,
									onDragStart: (e) => {
										D.current = t, a(e, t, m, n);
									},
									onDragEnd: (e) => L(e, t),
									onDragOver: (e) => F(e, n),
									onDrop: I,
									className: `dc:flex dc:items-center dc:gap-2 dc:p-2 bg-dc-surface dc:rounded-lg dc:group hover:bg-dc-surface-tertiary dc:transition-colors dc:cursor-move ${o ? "dc:opacity-30 dc:cursor-grabbing" : ""}`,
									children: [
										U(r),
										/* @__PURE__ */ G("div", {
											className: "dc:flex-1 dc:min-w-0",
											children: [/* @__PURE__ */ W("div", {
												className: "dc:text-sm text-dc-text dc:truncate",
												title: t,
												children: r.shortTitle || r.title || t.split(".").pop()
											}), /* @__PURE__ */ W("div", {
												className: "dc:text-xs text-dc-text-muted dc:truncate",
												children: r.cubeName
											})]
										}),
										e.enableDualAxis && f && /* @__PURE__ */ W("button", {
											type: "button",
											onClick: (e) => {
												e.stopPropagation(), f(t, (d?.[t] || "left") === "left" ? "right" : "left");
											},
											className: `dc:px-1.5 dc:py-0.5 dc:text-xs dc:font-medium dc:rounded-sm dc:transition-colors dc:flex-shrink-0 ${(d?.[t] || "left") === "left" ? "bg-dc-info-bg text-dc-info dc:hover:opacity-80" : "bg-dc-accent-bg text-dc-accent dc:hover:opacity-80"}`,
											title: `Y-Axis: ${(d?.[t] || "left") === "left" ? "Left" : "Right"} (click to toggle)`,
											children: (d?.[t] || "left") === "left" ? "L" : "R"
										}),
										/* @__PURE__ */ W("button", {
											type: "button",
											onClick: () => i(t, m),
											className: "dc:p-1 text-dc-text-muted hover:text-dc-danger dc:opacity-0 dc:group-hover:opacity-100 dc:transition-opacity dc:flex-shrink-0",
											title: `Remove from ${p(h)}`,
											children: /* @__PURE__ */ W(Cn, { className: "dc:w-4 dc:h-4" })
										})
									]
								})]
							}, `${t}-${n}`);
						}),
						l && l.fromAxis === m && x === n.length && /* @__PURE__ */ W("div", {
							className: "dc:relative dc:h-2",
							children: /* @__PURE__ */ W("div", {
								className: "dc:absolute dc:top-0 dc:left-0 dc:right-0 dc:flex dc:items-center dc:justify-center dc:pointer-events-none dc:z-10",
								children: /* @__PURE__ */ W("div", { className: "dc:h-0.5 dc:w-full bg-dc-primary dc:rounded-full" })
							})
						}),
						l && l.fromAxis === m && n.length > 1 && /* @__PURE__ */ W("div", {
							className: "dc:h-6",
							onDragOver: (e) => {
								if (l.fromIndex !== void 0) {
									e.preventDefault();
									let t = n.length;
									A.current !== t && l.fromIndex !== t - 1 && (S(t), A.current = t, E(!0));
								}
							},
							onDrop: I
						})
					]
				})
			}),
			_ && n.length === 0 && /* @__PURE__ */ W("div", {
				className: "dc:text-xs text-dc-error dc:mt-1",
				children: p("chart.dropZone.required")
			})
		]
	});
}
//#endregion
//#region src/client/components/ChartTypeSelector.tsx
function On(e) {
	return a[e]?.label || e;
}
function kn({ selectedType: e, onTypeChange: t, className: r = "", compact: o = !1, availability: s, excludeTypes: c = [] }) {
	let { t: l } = y(), [u, d] = H(!1), f = te(i.subscribe, i.getSnapshot), p = B(() => Object.keys(a).filter((e) => !c.includes(e)).sort((e, t) => On(e).localeCompare(On(t))), [c, f]), m = n(e), h = On(e);
	return /* @__PURE__ */ G("div", {
		className: `${r} dc:relative`,
		children: [/* @__PURE__ */ G("button", {
			type: "button",
			onClick: () => d(!u),
			className: "dc:w-full dc:flex dc:items-center dc:justify-between dc:px-3 dc:py-2 dc:border border-dc-border dc:rounded-md bg-dc-surface hover:bg-dc-surface-hover focus:outline-hidden dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent",
			children: [/* @__PURE__ */ G("div", {
				className: "dc:flex dc:items-center dc:space-x-2",
				children: [m && /* @__PURE__ */ W(m, { className: "dc:h-5 dc:w-5 text-dc-text-secondary" }), /* @__PURE__ */ W("span", {
					className: "dc:text-sm dc:font-medium text-dc-text",
					children: l(h)
				})]
			}), /* @__PURE__ */ W("svg", {
				className: `dc:h-4 dc:w-4 text-dc-text-muted dc:transform dc:transition-transform ${u ? "dc:rotate-180" : ""}`,
				fill: "none",
				viewBox: "0 0 24 24",
				stroke: "currentColor",
				children: /* @__PURE__ */ W("path", {
					strokeLinecap: "round",
					strokeLinejoin: "round",
					strokeWidth: 2,
					d: "M19 9l-7 7-7-7"
				})
			})]
		}), u && /* @__PURE__ */ W("div", {
			className: `dc:absolute dc:z-10 dc:mt-1 dc:w-full bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg ${o ? "" : "dc:min-w-max"}`,
			children: /* @__PURE__ */ W("div", {
				className: "dc:p-2",
				children: /* @__PURE__ */ W("div", {
					className: `dc:grid dc:gap-1.5 ${o ? "dc:grid-cols-2" : "dc:grid-cols-2 dc:sm:grid-cols-3 dc:lg:grid-cols-4"}`,
					children: p.map((r) => {
						let i = a[r], o = n(r), c = On(r), u = e === r, f = i?.description, p = i?.useCase, m = s?.[r], h = m?.available ?? !0, g = m?.reason, _ = !h && g ? l(g) : [f, p].filter(Boolean).map((e) => l(e)).join(". ");
						return /* @__PURE__ */ G("button", {
							type: "button",
							onClick: () => {
								h && (t(r), d(!1));
							},
							disabled: !h,
							className: `
                      dc:relative dc:p-1.5 dc:rounded-sm dc:border dc:transition-colors dc:duration-150
                      dc:text-left dc:group dc:min-h-[30px] dc:flex dc:items-center dc:justify-start
                      ${h ? u ? "bg-dc-surface-secondary" : "bg-dc-surface hover:bg-dc-surface-hover" : "dc:opacity-50 dc:cursor-not-allowed bg-dc-surface"}
                    `,
							style: { borderColor: u && h ? "var(--dc-primary)" : "var(--dc-border)" },
							title: _,
							children: [/* @__PURE__ */ G("div", {
								className: "dc:flex dc:items-center dc:space-x-1.5",
								children: [o && /* @__PURE__ */ W(o, { className: `dc:h-4 dc:w-4 dc:shrink-0 ${h ? u ? "text-dc-text" : "text-dc-text-secondary" : "text-dc-text-muted"}` }), /* @__PURE__ */ W("span", {
									className: `dc:text-xs dc:font-medium dc:leading-tight dc:truncate ${h ? u ? "" : "text-dc-text" : "text-dc-text-muted"}`,
									style: u && h ? { color: "var(--dc-primary)" } : void 0,
									children: l(c)
								})]
							}), u && h && /* @__PURE__ */ W("div", {
								className: "dc:absolute dc:top-0.5 dc:right-0.5",
								children: /* @__PURE__ */ W("div", {
									className: "dc:w-1.5 dc:h-1.5 dc:rounded-full",
									style: { backgroundColor: "var(--dc-primary)" }
								})
							})]
						}, r);
					})
				})
			})
		})]
	});
}
//#endregion
//#region src/client/components/AnalysisBuilder/utils/axisConfigUtils.ts
function An(e, t, n) {
	let r = e[t];
	if (Array.isArray(r)) {
		let i = r.filter((e) => e !== n);
		i.length === 0 ? delete e[t] : e[t] = i;
	} else r === n && delete e[t];
}
function jn(e, t, n, r) {
	if (r) {
		e[t] = n;
		return;
	}
	let i = e[t];
	Array.isArray(i) ? i.includes(n) || (e[t] = [...i, n]) : e[t] = [n];
}
function Mn(e, t, n, r, i) {
	let a = { ...e };
	if (n !== "available" && n !== r && An(a, n, t), jn(a, r, t, i?.maxItems === 1), r === "yAxis" && i?.enableDualAxis) {
		let e = (Array.isArray(a.yAxis) ? a.yAxis : [t]).indexOf(t);
		a.yAxisAssignment?.[t] || (a.yAxisAssignment = {
			...a.yAxisAssignment,
			[t]: e === 1 ? "right" : "left"
		});
	}
	return a;
}
function Nn(e, t, n) {
	let r = { ...e };
	if (An(r, n, t), n === "yAxis" && r.yAxisAssignment?.[t]) {
		let { [t]: e, ...n } = r.yAxisAssignment;
		r.yAxisAssignment = Object.keys(n).length > 0 ? n : void 0;
	}
	return r;
}
function Pn(e, t, n, r) {
	let i = e[r];
	if (!Array.isArray(i) || i.length <= 1 || t === n) return null;
	let a = { ...e }, o = [...i], [s] = o.splice(t, 1);
	return o.splice(n, 0, s), a[r] = o, a;
}
//#endregion
//#region src/client/components/AnalysisBuilder/AnalysisChartConfigPanel.tsx
var Fn = o("measure"), In = o("dimension"), Ln = o("timeDimension");
function Rn({ chartType: e, chartConfig: n, metrics: i, breakdowns: a, schema: o, chartAvailability: s, onChartTypeChange: c, onChartConfigChange: l }) {
	let { t: u } = y(), [d, f] = H(null), p = B(() => ({
		measures: i.map((e) => e.field),
		dimensions: a.filter((e) => !e.isTimeDimension).map((e) => e.field),
		timeDimensions: a.filter((e) => e.isTimeDimension).map((e) => e.field)
	}), [i, a]), { config: m, loaded: h } = r(e), g = m.skipQuery === !0, _ = R((e) => {
		let t = n[e];
		return Array.isArray(t) ? t : typeof t == "string" ? [t] : [];
	}, [n]);
	z(() => {
		if (!h) return;
		let e = [
			...p.dimensions,
			...p.timeDimensions,
			...p.measures
		], t = !1, r = { ...n };
		m.dropZones.forEach((n) => {
			let i = _(n.key), a = i.filter((t) => e.includes(t));
			a.length !== i.length && (t = !0, a.length === 0 ? delete r[n.key] : n.maxItems === 1 ? r[n.key] = a[0] : r[n.key] = a);
		}), t && l(r);
	}, [
		p,
		n,
		m.dropZones,
		l,
		_,
		h
	]);
	let v = (e) => p.measures.includes(e) ? "measure" : p.timeDimensions.includes(e) ? "timeDimension" : "dimension", b = (e) => {
		if (!o?.cubes) return null;
		let [t] = e.split("."), n = o.cubes.find((e) => e.name === t);
		if (!n) return null;
		let r = n.measures?.find((t) => t.name === e);
		if (r) return {
			...r,
			fieldType: "measure"
		};
		let i = n.dimensions?.find((t) => t.name === e);
		return i ? {
			...i,
			fieldType: i.type === "time" ? "timeDimension" : "dimension"
		} : null;
	}, x = (e) => {
		let t = v(e), n = e.split("."), r = n[0] || e, i = n[1] || e, o = b(e), s = a.find((t) => t.field === e);
		return o ? {
			title: o.title || i,
			shortTitle: o.shortTitle || o.title || i,
			cubeName: r,
			type: o.fieldType,
			measureType: o.fieldType === "measure" ? o.type : void 0
		} : s ? {
			title: i,
			shortTitle: i,
			cubeName: r,
			type: s.isTimeDimension ? "timeDimension" : "dimension"
		} : {
			title: i,
			shortTitle: i,
			cubeName: r,
			type: t
		};
	}, S = (e, t, n, r) => {
		e.dataTransfer.setData("text/plain", JSON.stringify({
			field: t,
			fromAxis: n,
			fromIndex: r
		})), f({
			field: t,
			fromAxis: n,
			fromIndex: r
		});
	}, C = (e) => {
		e.preventDefault();
	}, w = () => {
		f(null);
	}, T = (e, t) => {
		e.preventDefault();
		let { field: r, fromAxis: i } = JSON.parse(e.dataTransfer.getData("text/plain")), a = Mn(n, r, i, t, m.dropZones.find((e) => e.key === t));
		f(null), l(a);
	}, E = (e, t) => {
		l(Nn(n, e, t));
	}, D = (e, t, r) => {
		let i = Pn(n, e, t, r);
		i && (f(null), l(i));
	}, O = R((e, t) => {
		l({
			...n,
			yAxisAssignment: {
				...n.yAxisAssignment,
				[e]: t
			}
		});
	}, [n, l]);
	if (!h) return /* @__PURE__ */ G("div", {
		className: "dc:space-y-6",
		children: [/* @__PURE__ */ G("div", { children: [/* @__PURE__ */ W(N, {
			className: "dc:mb-2",
			children: u("chart.config.chartType")
		}), /* @__PURE__ */ W(kn, {
			selectedType: e,
			onTypeChange: c,
			availability: s,
			excludeTypes: [
				"funnel",
				"sankey",
				"sunburst",
				"retentionHeatmap",
				"retentionCombined"
			],
			compact: !0
		})] }), /* @__PURE__ */ W("div", {
			className: "dc:text-center text-dc-text-muted dc:text-sm dc:py-4",
			children: u("chart.config.loading")
		})]
	});
	let k = (() => {
		let e = /* @__PURE__ */ new Set();
		return m.dropZones.forEach((t) => {
			_(t.key).forEach((t) => e.add(t));
		}), d && d.fromAxis !== "available" && e.add(d.field), {
			dimensions: p.dimensions.filter((t) => !e.has(t)),
			timeDimensions: p.timeDimensions.filter((t) => !e.has(t)),
			measures: p.measures.filter((t) => !e.has(t))
		};
	})(), A = k.dimensions.length > 0 || k.timeDimensions.length > 0 || k.measures.length > 0;
	return /* @__PURE__ */ G("div", {
		className: "dc:space-y-6",
		children: [
			/* @__PURE__ */ G("div", { children: [/* @__PURE__ */ W(N, {
				className: "dc:mb-2",
				children: u("chart.config.chartType")
			}), /* @__PURE__ */ W(kn, {
				selectedType: e,
				onTypeChange: c,
				availability: s,
				excludeTypes: [
					"funnel",
					"sankey",
					"sunburst",
					"retentionHeatmap",
					"retentionCombined"
				],
				compact: !0
			})] }),
			!g && m.dropZones.length > 0 && /* @__PURE__ */ G("div", { children: [/* @__PURE__ */ W(N, {
				className: "dc:mb-2",
				children: u("chart.config.axisConfig")
			}), /* @__PURE__ */ W("div", {
				className: "dc:space-y-1",
				children: m.dropZones.map((e) => /* @__PURE__ */ W(Dn, {
					config: e,
					fields: _(e.key),
					onDrop: T,
					onRemove: E,
					onDragStart: S,
					onDragEnd: w,
					onDragOver: C,
					onReorder: D,
					draggedItem: d,
					getFieldMeta: x,
					yAxisAssignment: n.yAxisAssignment,
					onYAxisAssignmentChange: e.enableDualAxis ? O : void 0
				}, e.key))
			})] }),
			!g && A && /* @__PURE__ */ G("div", { children: [/* @__PURE__ */ G("div", {
				className: "dc:mb-2",
				children: [/* @__PURE__ */ W(N, { children: u("chart.config.unassigned") }), /* @__PURE__ */ W("div", {
					className: "dc:text-xs text-dc-text-muted dc:mt-0.5",
					children: u("chart.config.unassignedHint")
				})]
			}), /* @__PURE__ */ W("div", {
				className: "dc:border-2 dc:border-dashed border-dc-border dc:rounded-lg dc:p-2 bg-dc-surface-secondary",
				children: /* @__PURE__ */ G("div", {
					className: "dc:space-y-2",
					children: [
						k.measures.map((e) => {
							let n = x(e), r = d && d.field === e && d.fromAxis === "available", i = t(n.measureType || "count") || Fn;
							return /* @__PURE__ */ G("div", {
								draggable: !0,
								onDragStart: (t) => S(t, e, "available"),
								onDragEnd: w,
								className: `dc:flex dc:items-center dc:gap-2 dc:p-2 bg-dc-surface dc:rounded-lg hover:bg-dc-surface-tertiary dc:transition-colors dc:cursor-move ${r ? "dc:opacity-50 dc:cursor-grabbing" : ""}`,
								title: e,
								children: [/* @__PURE__ */ W("span", {
									className: "dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded-sm bg-dc-measure text-dc-measure-text dc:flex-shrink-0",
									children: /* @__PURE__ */ W(i, { className: "dc:w-4 dc:h-4" })
								}), /* @__PURE__ */ G("div", {
									className: "dc:flex-1 dc:min-w-0",
									children: [/* @__PURE__ */ W("div", {
										className: "dc:text-sm text-dc-text dc:truncate",
										children: n.shortTitle
									}), /* @__PURE__ */ W("div", {
										className: "dc:text-xs text-dc-text-muted dc:truncate",
										children: n.cubeName
									})]
								})]
							}, e);
						}),
						k.dimensions.map((e) => {
							let t = x(e);
							return /* @__PURE__ */ G("div", {
								draggable: !0,
								onDragStart: (t) => S(t, e, "available"),
								onDragEnd: w,
								className: `dc:flex dc:items-center dc:gap-2 dc:p-2 bg-dc-surface dc:rounded-lg hover:bg-dc-surface-tertiary dc:transition-colors dc:cursor-move ${d && d.field === e && d.fromAxis === "available" ? "dc:opacity-50 dc:cursor-grabbing" : ""}`,
								title: e,
								children: [/* @__PURE__ */ W("span", {
									className: "dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded-sm bg-dc-dimension text-dc-dimension-text dc:flex-shrink-0",
									children: /* @__PURE__ */ W(In, { className: "dc:w-4 dc:h-4" })
								}), /* @__PURE__ */ G("div", {
									className: "dc:flex-1 dc:min-w-0",
									children: [/* @__PURE__ */ W("div", {
										className: "dc:text-sm text-dc-text dc:truncate",
										children: t.shortTitle
									}), /* @__PURE__ */ W("div", {
										className: "dc:text-xs text-dc-text-muted dc:truncate",
										children: t.cubeName
									})]
								})]
							}, e);
						}),
						k.timeDimensions.map((e) => {
							let t = x(e);
							return /* @__PURE__ */ G("div", {
								draggable: !0,
								onDragStart: (t) => S(t, e, "available"),
								onDragEnd: w,
								className: `dc:flex dc:items-center dc:gap-2 dc:p-2 bg-dc-surface dc:rounded-lg hover:bg-dc-surface-tertiary dc:transition-colors dc:cursor-move ${d && d.field === e && d.fromAxis === "available" ? "dc:opacity-50 dc:cursor-grabbing" : ""}`,
								title: e,
								children: [/* @__PURE__ */ W("span", {
									className: "dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded-sm bg-dc-time-dimension text-dc-time-dimension-text dc:flex-shrink-0",
									children: /* @__PURE__ */ W(Ln, { className: "dc:w-4 dc:h-4" })
								}), /* @__PURE__ */ G("div", {
									className: "dc:flex-1 dc:min-w-0",
									children: [/* @__PURE__ */ W("div", {
										className: "dc:text-sm text-dc-text dc:truncate",
										children: t.shortTitle
									}), /* @__PURE__ */ W("div", {
										className: "dc:text-xs text-dc-text-muted dc:truncate",
										children: t.cubeName
									})]
								})]
							}, e);
						})
					]
				})
			})] }),
			!g && p.measures.length === 0 && p.dimensions.length === 0 && p.timeDimensions.length === 0 && /* @__PURE__ */ W("div", {
				className: "dc:text-center text-dc-text-muted dc:text-sm dc:py-4",
				children: /* @__PURE__ */ W("p", { children: u("chart.config.noFields") })
			})
		]
	});
}
//#endregion
//#region src/client/components/AnalysisBuilder/AnalysisQueryPanelParts.tsx
var zn = o("add"), Bn = o("close"), Vn = o("info"), Hn = o("warning"), Un = o("link");
function Wn(e) {
	return e.analysisType === "funnel" && !!e.onFunnelCubeChange && !!e.onAddFunnelStep && !!e.onRemoveFunnelStep && !!e.onUpdateFunnelStep && !!e.onSelectFunnelStep && !!e.onReorderFunnelSteps && !!e.onFunnelTimeDimensionChange && !!e.onFunnelBindingKeyChange;
}
function Gn(e) {
	return e.analysisType === "flow" && !!e.onFlowCubeChange && !!e.onFlowBindingKeyChange && !!e.onFlowTimeDimensionChange && !!e.onEventDimensionChange && !!e.onStartingStepFiltersChange && !!e.onStepsBeforeChange && !!e.onStepsAfterChange && !!e.startingStep;
}
function Kn(e) {
	return Wn(e) || Gn(e) || e.analysisType === "retention";
}
function qn(e) {
	let { schema: t, colorPalette: n, funnelCube: r = null, funnelSteps: i = [], activeFunnelStepIndex: a = 0, funnelTimeDimension: o, funnelBindingKey: s, onFunnelCubeChange: c, onAddFunnelStep: l, onRemoveFunnelStep: u, onUpdateFunnelStep: d, onSelectFunnelStep: f, onReorderFunnelSteps: p, onFunnelTimeDimensionChange: m, onFunnelBindingKeyChange: h, funnelDisplayConfig: g, onFunnelDisplayConfigChange: _ } = e;
	return /* @__PURE__ */ W(Dt, {
		funnelCube: r,
		funnelSteps: i,
		activeFunnelStepIndex: a,
		funnelTimeDimension: o ?? null,
		funnelBindingKey: s ?? null,
		schema: t,
		onCubeChange: c,
		onAddStep: l,
		onRemoveStep: u,
		onUpdateStep: d,
		onSelectStep: f,
		onReorderSteps: p,
		onTimeDimensionChange: m,
		onBindingKeyChange: h,
		chartType: "funnel",
		displayConfig: g,
		colorPalette: n,
		onDisplayConfigChange: _
	});
}
function Jn(e) {
	let { schema: t, colorPalette: n, chartType: r, onChartTypeChange: i, flowCube: a, flowBindingKey: o, flowTimeDimension: s, eventDimension: c, startingStep: l, stepsBefore: u = 3, stepsAfter: d = 3, flowJoinStrategy: f = "auto", onFlowCubeChange: p, onFlowBindingKeyChange: m, onFlowTimeDimensionChange: h, onEventDimensionChange: g, onStartingStepFiltersChange: _, onStepsBeforeChange: v, onStepsAfterChange: y, onFlowJoinStrategyChange: b, flowDisplayConfig: x, onFlowDisplayConfigChange: S } = e;
	return /* @__PURE__ */ W(Wt, {
		flowCube: a ?? null,
		flowBindingKey: o ?? null,
		flowTimeDimension: s ?? null,
		eventDimension: c ?? null,
		startingStep: l,
		stepsBefore: u,
		stepsAfter: d,
		joinStrategy: f,
		schema: t,
		onCubeChange: p,
		onBindingKeyChange: m,
		onTimeDimensionChange: h,
		onEventDimensionChange: g,
		onStartingStepFiltersChange: _,
		onStepsBeforeChange: v,
		onStepsAfterChange: y,
		onJoinStrategyChange: b,
		chartType: r,
		onChartTypeChange: i,
		displayConfig: x,
		colorPalette: n,
		onDisplayConfigChange: S
	});
}
function Yn(e) {
	let { schema: t, colorPalette: n, chartType: r, onAddBreakdown: i, retentionCube: a, retentionBindingKey: o, retentionTimeDimension: s, retentionDateRange: c, retentionCohortFilters: l = [], retentionActivityFilters: u = [], retentionBreakdowns: d = [], retentionViewGranularity: f = "week", retentionPeriods: p = 12, retentionType: m = "classic", onRetentionCubeChange: h, onRetentionBindingKeyChange: g, onRetentionTimeDimensionChange: _, onRetentionDateRangeChange: v, onRetentionCohortFiltersChange: y, onRetentionActivityFiltersChange: b, onRetentionBreakdownsChange: x, onAddRetentionBreakdown: S, onRemoveRetentionBreakdown: C, onRetentionViewGranularityChange: w, onRetentionPeriodsChange: T, onRetentionTypeChange: E, retentionDisplayConfig: D, onRetentionDisplayConfigChange: O } = e, k = () => {};
	return /* @__PURE__ */ W(hn, {
		retentionCube: a ?? null,
		retentionBindingKey: o ?? null,
		retentionTimeDimension: s ?? null,
		retentionDateRange: c ?? {
			start: "",
			end: ""
		},
		retentionCohortFilters: l,
		retentionActivityFilters: u,
		retentionBreakdowns: d,
		retentionViewGranularity: f,
		retentionPeriods: p,
		retentionType: m,
		schema: t,
		onCubeChange: h ?? k,
		onBindingKeyChange: g ?? k,
		onTimeDimensionChange: _ ?? k,
		onDateRangeChange: v ?? k,
		onCohortFiltersChange: y ?? k,
		onActivityFiltersChange: b ?? k,
		onBreakdownsChange: x ?? k,
		onAddBreakdown: S ?? k,
		onRemoveBreakdown: C ?? k,
		onGranularityChange: w ?? k,
		onPeriodsChange: T ?? k,
		onRetentionTypeChange: E ?? k,
		onOpenFieldModal: i,
		chartType: r,
		displayConfig: D,
		colorPalette: n,
		onDisplayConfigChange: O
	});
}
function Xn(e) {
	return Wn(e) ? /* @__PURE__ */ W(qn, { ...e }) : Gn(e) ? /* @__PURE__ */ W(Jn, { ...e }) : e.analysisType === "retention" ? /* @__PURE__ */ W(Yn, { ...e }) : null;
}
function Zn({ isMultiQuery: e, queryCount: t, activeQueryIndex: n, activeTab: r, onActiveTabChange: i, onAddQuery: a, getQueryTabLabel: o, handleQueryTabClick: s, handleRemoveQuery: c }) {
	let { t: l } = y();
	return e ? /* @__PURE__ */ G("div", {
		className: "dc:flex dc:min-w-max",
		children: [Array.from({ length: t }).map((e, t) => /* @__PURE__ */ G("button", {
			onClick: () => s(t),
			className: `dc:flex dc:items-center dc:gap-1 dc:px-3 dc:py-3 dc:text-sm dc:font-medium dc:transition-colors dc:flex-shrink-0 dc:whitespace-nowrap ${t === n && r === "query" ? "text-dc-primary dc:border-b-2 border-dc-primary" : "text-dc-text-secondary hover:text-dc-text"}`,
			children: [o(t), /* @__PURE__ */ W("span", {
				role: "button",
				tabIndex: 0,
				onClick: (e) => c(e, t),
				onKeyDown: (e) => e.key === "Enter" && c(e, t),
				className: "dc:p-0.5 dc:rounded-sm hover:bg-dc-danger-bg hover:text-dc-error dc:transition-colors dc:ml-0.5",
				title: l("analysis.multiQuery.removeQuery"),
				"aria-label": `Remove ${o(t)}`,
				children: /* @__PURE__ */ W(Bn, { className: "dc:w-3 dc:h-3" })
			})]
		}, `q${t}`)), /* @__PURE__ */ W("button", {
			onClick: a,
			className: "dc:flex dc:items-center dc:justify-center dc:px-2 dc:py-3 text-dc-text-secondary hover:text-dc-text dc:transition-colors dc:flex-shrink-0 dc:whitespace-nowrap",
			title: l("analysis.multiQuery.addQuery"),
			"aria-label": l("analysis.multiQuery.addQuery"),
			children: /* @__PURE__ */ W(zn, { className: "dc:w-4 dc:h-4" })
		})]
	}) : /* @__PURE__ */ G("button", {
		onClick: () => i("query"),
		className: `dc:flex-1 dc:px-4 dc:py-3 dc:text-sm dc:font-medium dc:transition-colors dc:whitespace-nowrap ${r === "query" ? "text-dc-primary dc:border-b-2 border-dc-primary" : "text-dc-text-secondary hover:text-dc-text"}`,
		children: [l("analysis.tabs.query"), a && /* @__PURE__ */ W("span", {
			role: "button",
			tabIndex: 0,
			onClick: (e) => {
				e.stopPropagation(), a();
			},
			onKeyDown: (e) => {
				e.key === "Enter" && (e.stopPropagation(), a());
			},
			className: "dc:ml-2 dc:p-0.5 dc:rounded-sm hover:bg-dc-surface-hover dc:transition-colors dc:inline-flex dc:items-center",
			title: l("analysis.multiQuery.addAnother"),
			"aria-label": l("analysis.multiQuery.addAnother"),
			children: /* @__PURE__ */ W(zn, { className: "dc:w-3 dc:h-3" })
		})]
	});
}
function Qn(e) {
	let { t } = y(), { isMultiQuery: n, activeTab: r, onActiveTabChange: i } = e, a = n ? "" : "dc:flex-1";
	return /* @__PURE__ */ W("div", {
		className: "dc:border-b border-dc-border dc:flex-shrink-0 dc:overflow-x-auto dc:overflow-y-hidden scrollbar-thin",
		children: /* @__PURE__ */ G("div", {
			className: "dc:flex dc:min-w-max",
			children: [
				/* @__PURE__ */ W(Zn, { ...e }),
				/* @__PURE__ */ W("button", {
					onClick: () => i("chart"),
					className: `dc:px-4 dc:py-3 dc:text-sm dc:font-medium dc:transition-colors dc:flex-shrink-0 dc:whitespace-nowrap ${a} ${r === "chart" ? "text-dc-primary dc:border-b-2 border-dc-primary" : "text-dc-text-secondary hover:text-dc-text"}`,
					title: t("analysis.tabs.chartTitle"),
					children: t("analysis.tabs.chart")
				}),
				/* @__PURE__ */ W("button", {
					onClick: () => i("display"),
					className: `dc:px-4 dc:py-3 dc:text-sm dc:font-medium dc:transition-colors dc:flex-shrink-0 dc:whitespace-nowrap ${a} ${r === "display" ? "text-dc-primary dc:border-b-2 border-dc-primary" : "text-dc-text-secondary hover:text-dc-text"}`,
					title: t("analysis.tabs.displayTitle"),
					children: t("analysis.tabs.display")
				})
			]
		})
	});
}
function $n({ mergeStrategy: e, onMergeStrategyChange: t, isFunnelMode: n, funnelBindingKey: r, onFunnelBindingKeyChange: i, schema: a }) {
	let { t: o } = y();
	return /* @__PURE__ */ G("div", {
		className: "dc:flex dc:items-center dc:gap-2 dc:px-4 dc:py-1.5 dc:text-sm bg-dc-surface-secondary dc:border-b border-dc-border",
		children: [
			Un && /* @__PURE__ */ W(Un, { className: "dc:w-3.5 dc:h-3.5 text-dc-text-muted dc:flex-shrink-0" }),
			/* @__PURE__ */ G("select", {
				value: e,
				onChange: (e) => t?.(e.target.value),
				className: "dc:px-2 dc:py-1 dc:text-xs bg-dc-surface dc:border border-dc-border dc:rounded-sm text-dc-text dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary",
				children: [
					/* @__PURE__ */ W("option", {
						value: "concat",
						children: o("analysis.mergeStrategy.concat")
					}),
					/* @__PURE__ */ W("option", {
						value: "merge",
						children: o("analysis.mergeStrategy.merge")
					}),
					/* @__PURE__ */ W("option", {
						value: "funnel",
						children: o("analysis.mergeStrategy.funnel")
					})
				]
			}),
			n && i && /* @__PURE__ */ W(ot, {
				bindingKey: r ?? null,
				onChange: i,
				schema: a,
				className: "dc:w-[180px] dc:flex-shrink-0"
			})
		]
	});
}
function er({ adapterValidation: e }) {
	let { t } = y();
	return /* @__PURE__ */ G("div", {
		className: "dc:px-4 dc:py-2 dc:border-b border-dc-border bg-dc-warning-bg dc:space-y-1",
		children: [e.errors.map((e, n) => /* @__PURE__ */ G("div", {
			className: "dc:flex dc:items-start dc:gap-2 dc:text-xs text-dc-error",
			children: [/* @__PURE__ */ W(Hn, { className: "dc:w-3.5 dc:h-3.5 dc:mt-0.5 dc:flex-shrink-0" }), /* @__PURE__ */ W("span", { children: t(e) })]
		}, `adapter-error-${n}`)), e.warnings.map((e, n) => /* @__PURE__ */ G("div", {
			className: "dc:flex dc:items-start dc:gap-2 dc:text-xs text-dc-warning",
			children: [/* @__PURE__ */ W(Vn, { className: "dc:w-3.5 dc:h-3.5 dc:mt-0.5 dc:flex-shrink-0" }), /* @__PURE__ */ W("span", { children: t(e) })]
		}, `adapter-warning-${n}`))]
	});
}
function tr({ multiQueryValidation: e }) {
	let { t } = y();
	return /* @__PURE__ */ G("div", {
		className: "dc:px-4 dc:py-2 dc:border-b border-dc-border bg-dc-warning-bg",
		children: [e.errors.map((e, n) => /* @__PURE__ */ G("div", {
			className: "dc:flex dc:items-start dc:gap-2 dc:text-xs text-dc-error",
			children: [/* @__PURE__ */ W(Hn, { className: "dc:w-3.5 dc:h-3.5 dc:mt-0.5 dc:flex-shrink-0" }), /* @__PURE__ */ W("span", { children: t(e.message) })]
		}, `error-${n}`)), e.warnings.map((e, n) => /* @__PURE__ */ G("div", {
			className: "dc:flex dc:items-start dc:gap-2 dc:text-xs text-dc-warning",
			children: [/* @__PURE__ */ W(Hn, { className: "dc:w-3.5 dc:h-3.5 dc:mt-0.5 dc:flex-shrink-0" }), /* @__PURE__ */ W("span", { children: t(e.message) })]
		}, `warning-${n}`))]
	});
}
function nr({ metrics: e, breakdowns: t, filters: n, schema: r, onAddMetric: i, onRemoveMetric: a, onReorderMetrics: o, onAddBreakdown: s, onRemoveBreakdown: c, onBreakdownGranularityChange: l, onBreakdownComparisonToggle: u, onReorderBreakdowns: d, onFiltersChange: f, onDropFieldToFilter: p, order: m, onOrderChange: h, limit: g, onLimitChange: _, breakdownsLocked: v = !1, onMergeStrategyChange: y, getFieldMeta: b, comparisonEnabledBreakdown: x }) {
	return /* @__PURE__ */ G("div", {
		className: "dc:space-y-6",
		children: [
			/* @__PURE__ */ W(bn, {
				metrics: e,
				schema: r,
				onAdd: i,
				onRemove: a,
				order: m,
				onOrderChange: h,
				onReorder: o
			}),
			v ? /* @__PURE__ */ W(ir, {
				breakdowns: t,
				getFieldMeta: b,
				comparisonEnabledBreakdown: x,
				onBreakdownGranularityChange: l,
				onBreakdownComparisonToggle: u,
				onMergeStrategyChange: y
			}) : /* @__PURE__ */ W(pn, {
				breakdowns: t,
				schema: r,
				onAdd: s,
				onRemove: c,
				onGranularityChange: l,
				onComparisonToggle: u,
				order: m,
				onOrderChange: h,
				onReorder: d
			}),
			/* @__PURE__ */ W(w, {
				filters: n,
				schema: r,
				onFiltersChange: f,
				onFieldDropped: p
			}),
			_ && /* @__PURE__ */ W(Sn, {
				limit: g,
				onLimitChange: _
			})
		]
	});
}
function rr(e) {
	let { activeTab: t, isMultiQuery: n, metrics: r, breakdowns: i, schema: a, chartType: o, chartConfig: s, combinedMetrics: c, combinedBreakdowns: l, chartAvailability: d, onChartTypeChange: f, onChartConfigChange: p, displayConfig: m, colorPalette: h, onDisplayConfigChange: g } = e;
	return t === "query" ? /* @__PURE__ */ W(nr, { ...e }) : t === "chart" ? /* @__PURE__ */ W(Rn, {
		chartType: o,
		chartConfig: s,
		metrics: n && c ? c : r,
		breakdowns: n && l ? l : i,
		schema: a,
		chartAvailability: d,
		onChartTypeChange: f,
		onChartConfigChange: p
	}) : t === "display" ? /* @__PURE__ */ W(u, {
		chartType: o,
		displayConfig: m,
		colorPalette: h,
		chartConfig: s,
		onDisplayConfigChange: g
	}) : null;
}
function ir({ breakdowns: e, getFieldMeta: t, comparisonEnabledBreakdown: n, onBreakdownGranularityChange: r, onBreakdownComparisonToggle: i, onMergeStrategyChange: a }) {
	let { t: o } = y();
	return /* @__PURE__ */ G("div", {
		className: "dc:mb-4",
		children: [
			/* @__PURE__ */ W("div", {
				className: "dc:flex dc:items-center dc:justify-between dc:mb-2",
				children: /* @__PURE__ */ W("h4", {
					className: "dc:text-sm dc:font-medium text-dc-text",
					children: o("analysis.sections.dimensions")
				})
			}),
			/* @__PURE__ */ G("div", {
				className: "dc:flex dc:items-start dc:gap-2 dc:px-3 dc:py-2 dc:mb-3 bg-dc-surface-secondary dc:rounded-sm dc:border border-dc-border dc:text-xs",
				children: [Vn && /* @__PURE__ */ W(Vn, { className: "dc:w-4 dc:h-4 text-dc-text-muted dc:flex-shrink-0 dc:mt-0.5" }), /* @__PURE__ */ G("span", {
					className: "text-dc-text-muted",
					children: [o("analysis.multiQuery.mergeExplanation"), a && /* @__PURE__ */ W("button", {
						onClick: () => a("concat"),
						className: "text-dc-primary dc:hover:underline dc:ml-1",
						children: o("analysis.multiQuery.switchToSeparate")
					})]
				})]
			}),
			e.length > 0 && /* @__PURE__ */ W("div", {
				className: "dc:space-y-1",
				children: e.map((e) => /* @__PURE__ */ W(nt, {
					breakdown: e,
					fieldMeta: t(e),
					onRemove: () => {},
					onGranularityChange: e.isTimeDimension ? (t) => r(e.id, t) : void 0,
					onComparisonToggle: e.isTimeDimension && i ? () => i(e.id) : void 0,
					comparisonDisabled: !!n && n.id !== e.id
				}, e.id))
			})
		]
	});
}
//#endregion
//#region src/client/components/AnalysisBuilder/AnalysisQueryPanel.tsx
var ar = L(function(e) {
	let { breakdowns: t, schema: n, activeTab: r, onActiveTabChange: i, queryCount: a = 1, activeQueryIndex: o = 0, mergeStrategy: s = "concat", onActiveQueryChange: c, onAddQuery: l, onRemoveQuery: u, onMergeStrategyChange: d, multiQueryValidation: f, adapterValidation: p, funnelBindingKey: m, onFunnelBindingKeyChange: h, analysisType: g = "query", onAnalysisTypeChange: _ } = e, { t: v } = y(), b = a > 1, x = g === "funnel", S = Kn(e), C = R((e) => {
		if (!n?.cubes) return null;
		let [t] = e.field.split("."), r = n.cubes.find((e) => e.name === t);
		return r && r.dimensions?.find((t) => t.name === e.field) || null;
	}, [n]), w = B(() => t.find((e) => e.isTimeDimension && e.enableComparison), [t]), T = R((e) => {
		c?.(e), r !== "query" && i("query");
	}, [
		c,
		r,
		i
	]), E = R((e, t) => {
		e.stopPropagation(), u?.(t);
	}, [u]);
	return /* @__PURE__ */ G("div", {
		className: "dc:h-full dc:flex dc:flex-col bg-dc-surface",
		children: [_ && /* @__PURE__ */ W(Ze, {
			value: g,
			onChange: _,
			schema: n
		}), S ? /* @__PURE__ */ W(Xn, { ...e }) : /* @__PURE__ */ G(U, { children: [
			/* @__PURE__ */ W(Qn, {
				activeTab: r,
				onActiveTabChange: i,
				isMultiQuery: b,
				queryCount: a,
				activeQueryIndex: o,
				onAddQuery: l,
				getQueryTabLabel: (e) => b ? x ? `S${e + 1}` : `Q${e + 1}` : v("analysis.tabs.query"),
				handleQueryTabClick: T,
				handleRemoveQuery: E
			}),
			b && r === "query" && /* @__PURE__ */ W($n, {
				mergeStrategy: s,
				onMergeStrategyChange: d,
				isFunnelMode: x,
				funnelBindingKey: m,
				onFunnelBindingKeyChange: h,
				schema: n
			}),
			p && (p.errors.length > 0 || p.warnings.length > 0) && r === "query" && /* @__PURE__ */ W(er, { adapterValidation: p }),
			f && !x && (f.warnings.length > 0 || f.errors.length > 0) && r === "query" && /* @__PURE__ */ W(tr, { multiQueryValidation: f }),
			/* @__PURE__ */ W("div", {
				className: "dc:flex-1 dc:overflow-auto dc:p-4",
				children: /* @__PURE__ */ W(rr, {
					...e,
					isMultiQuery: b,
					getFieldMeta: C,
					comparisonEnabledBreakdown: w
				})
			})
		] })]
	});
}), or = o("sparkles"), sr = o("error");
function cr({ userPrompt: e, onPromptChange: t, isGenerating: n, error: r, hasGeneratedQuery: i, onGenerate: a, onAccept: o, onCancel: s }) {
	let { t: c } = y(), l = R((e) => {
		e.key === "Enter" && !e.shiftKey && (e.preventDefault(), a());
	}, [a]);
	return /* @__PURE__ */ G("div", {
		className: "dc:border-b border-dc-border",
		style: { background: "linear-gradient(to right, var(--dc-ai-gradient-start), var(--dc-ai-gradient-end))" },
		children: [/* @__PURE__ */ G("div", {
			className: "dc:px-4 dc:py-2 dc:flex dc:items-center dc:justify-between dc:border-b border-dc-border bg-dc-surface-secondary",
			children: [/* @__PURE__ */ G("div", {
				className: "dc:flex dc:items-center dc:gap-2",
				children: [
					/* @__PURE__ */ W(or, { className: "dc:w-4 dc:h-4 text-dc-accent" }),
					/* @__PURE__ */ W("span", {
						className: "dc:text-sm dc:font-medium text-dc-text",
						children: c("analysis.ai.title")
					}),
					n && /* @__PURE__ */ W("span", {
						className: "dc:text-xs text-dc-accent dc:animate-pulse",
						children: c("analysis.ai.generating")
					})
				]
			}), /* @__PURE__ */ G("div", {
				className: "dc:flex dc:items-center dc:gap-2",
				children: [i && /* @__PURE__ */ W("button", {
					onClick: o,
					className: "dc:px-3 dc:py-1 dc:text-xs dc:font-medium text-white bg-dc-success dc:hover:opacity-80 dc:rounded-sm dc:transition-colors",
					children: c("analysis.ai.button.accept")
				}), /* @__PURE__ */ W("button", {
					onClick: s,
					className: "dc:px-3 dc:py-1 dc:text-xs dc:font-medium text-dc-text-secondary hover:text-dc-text bg-dc-surface hover:bg-dc-surface-hover dc:border border-dc-border dc:rounded-sm dc:transition-colors",
					children: c(i ? "analysis.ai.button.cancel" : "analysis.ai.button.close")
				})]
			})]
		}), /* @__PURE__ */ G("div", {
			className: "dc:p-4",
			children: [
				/* @__PURE__ */ G("div", {
					className: "dc:flex dc:gap-3",
					children: [/* @__PURE__ */ G("div", {
						className: "dc:flex-1",
						children: [/* @__PURE__ */ W("textarea", {
							value: e,
							onChange: (e) => t(e.target.value),
							onKeyDown: l,
							placeholder: c("analysis.ai.placeholder"),
							className: "dc:w-full dc:px-3 dc:py-2 dc:text-sm dc:border border-dc-border dc:rounded-md dc:shadow-sm dc:focus:outline-none dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent dc:resize-none bg-dc-surface text-dc-text placeholder-dc-text-muted",
							rows: 2,
							disabled: n
						}), /* @__PURE__ */ W("div", {
							className: "dc:mt-1 dc:text-xs text-dc-text-muted",
							children: c("analysis.ai.shortcutHint")
						})]
					}), /* @__PURE__ */ W("div", {
						className: "dc:flex-shrink-0",
						children: /* @__PURE__ */ W("button", {
							onClick: a,
							disabled: n || !e.trim(),
							className: `dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:rounded-md dc:transition-colors dc:flex dc:items-center dc:gap-2 ${n || !e.trim() ? "bg-dc-surface-tertiary text-dc-text-disabled dc:cursor-not-allowed" : "bg-dc-accent hover:bg-dc-accent-hover text-white"}`,
							children: n ? /* @__PURE__ */ G(U, { children: [/* @__PURE__ */ W("div", { className: "dc:w-4 dc:h-4 dc:border-2 border-white border-t-transparent dc:rounded-full dc:animate-spin" }), /* @__PURE__ */ W("span", { children: c("analysis.ai.button.generating") })] }) : /* @__PURE__ */ G(U, { children: [/* @__PURE__ */ W(or, { className: "dc:w-4 dc:h-4" }), /* @__PURE__ */ W("span", { children: c("analysis.ai.button.generate") })] })
						})
					})]
				}),
				r && /* @__PURE__ */ G("div", {
					className: "dc:mt-3 dc:flex dc:items-start dc:gap-2 dc:p-3 bg-dc-error-bg dc:border border-dc-error-border dc:rounded-md",
					children: [/* @__PURE__ */ W(sr, { className: "dc:w-4 dc:h-4 text-dc-error dc:mt-0.5 dc:flex-shrink-0" }), /* @__PURE__ */ W("div", {
						className: "dc:text-sm text-dc-error",
						children: r
					})]
				}),
				i && !r && /* @__PURE__ */ W("div", {
					className: "dc:mt-3 dc:p-3 bg-dc-success-bg dc:border border-dc-success-border dc:rounded-md",
					children: /* @__PURE__ */ W("div", {
						className: "dc:text-sm text-dc-success",
						children: c("analysis.ai.successMessage")
					})
				})
			]
		})]
	});
}
//#endregion
//#region src/client/components/AnalysisBuilder/AnalysisModeErrorBoundary.tsx
var lr = o("warning"), ur = o("refresh");
function dr({ error: e, analysisType: t, onReset: n, onSwitchToSafeMode: r }) {
	let { t: i } = y();
	return /* @__PURE__ */ G("div", {
		className: "dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full dc:h-full dc:p-6 dc:text-center bg-dc-surface",
		children: [
			/* @__PURE__ */ W("div", {
				className: "dc:h-10 dc:w-10 dc:mb-3 text-dc-warning",
				children: lr && /* @__PURE__ */ W(lr, { className: "dc:w-10 dc:h-10" })
			}),
			/* @__PURE__ */ W("h3", {
				className: "dc:text-base dc:font-semibold dc:mb-2 text-dc-text",
				children: i("errorBoundary.modeError")
			}),
			/* @__PURE__ */ W("p", {
				className: "dc:text-sm text-dc-text-secondary dc:mb-3 dc:max-w-sm",
				children: i("errorBoundary.modeErrorDescription", { mode: t })
			}),
			/* @__PURE__ */ G("details", {
				className: "dc:w-full dc:max-w-md dc:mb-4 dc:text-left",
				children: [/* @__PURE__ */ W("summary", {
					className: "dc:cursor-pointer dc:text-xs text-dc-text-muted hover:text-dc-text",
					children: i("errorBoundary.showDetails")
				}), /* @__PURE__ */ W("div", {
					className: "dc:mt-2 dc:p-2 bg-dc-surface-secondary dc:rounded-sm dc:text-xs dc:font-mono text-dc-text-secondary dc:overflow-auto dc:max-h-32",
					children: e?.message || i("errorBoundary.unknownError")
				})]
			}),
			/* @__PURE__ */ G("div", {
				className: "dc:flex dc:gap-2",
				children: [/* @__PURE__ */ G("button", {
					onClick: n,
					className: "dc:px-3 dc:py-1.5 dc:border border-dc-border dc:rounded-sm dc:text-sm text-dc-text hover:bg-dc-surface-hover dc:transition-colors dc:flex dc:items-center dc:gap-1",
					children: [ur && /* @__PURE__ */ W(ur, { className: "dc:w-4 dc:h-4" }), i("errorBoundary.tryAgain")]
				}), r && /* @__PURE__ */ W("button", {
					onClick: r,
					className: "dc:px-3 dc:py-1.5 bg-dc-primary text-white dc:rounded-sm dc:text-sm dc:hover:opacity-90 dc:transition-opacity",
					children: i("errorBoundary.switchToQuery")
				})]
			})
		]
	});
}
var fr = class extends F {
	constructor(e) {
		super(e), this.state = {
			hasError: !1,
			error: null
		};
	}
	static getDerivedStateFromError(e) {
		return {
			hasError: !0,
			error: e
		};
	}
	componentDidCatch(e, t) {
		this.setState({ error: e }), console.error(`[AnalysisModeErrorBoundary] Error in ${this.props.analysisType} mode:`, e, t);
	}
	handleReset = () => {
		this.setState({
			hasError: !1,
			error: null
		});
	};
	handleSwitchToSafeMode = () => {
		this.handleReset(), this.props.onSwitchToSafeMode?.();
	};
	render() {
		return this.state.hasError ? /* @__PURE__ */ W(dr, {
			error: this.state.error,
			analysisType: this.props.analysisType,
			onReset: this.handleReset,
			onSwitchToSafeMode: this.props.onSwitchToSafeMode ? this.handleSwitchToSafeMode : void 0
		}) : this.props.children;
	}
};
//#endregion
//#region src/client/components/AnalysisBuilder/hooks/useAnalysisBuilderImperativeHandle.ts
function pr(e, t) {
	let { getQueryConfig: n, getChartConfig: r, getAnalysisType: i, clearQuery: a, storeApi: o } = t;
	ee(e, () => ({
		getQueryConfig: n,
		getChartConfig: r,
		getAnalysisType: i,
		getFunnelState: () => {
			let e = o.getState(), t = e.charts.funnel || {
				chartType: "funnel",
				chartConfig: {},
				displayConfig: {
					showLegend: !0,
					showGrid: !0,
					showTooltip: !0
				}
			};
			return {
				funnelCube: e.funnelCube,
				funnelSteps: e.funnelSteps,
				funnelTimeDimension: e.funnelTimeDimension,
				funnelBindingKey: e.funnelBindingKey,
				funnelChartType: t.chartType,
				funnelChartConfig: t.chartConfig,
				funnelDisplayConfig: t.displayConfig,
				activeFunnelStepIndex: e.activeFunnelStepIndex
			};
		},
		getAnalysisConfig: () => o.getState().save(),
		executeQuery: () => {},
		clearQuery: a
	}), [
		n,
		r,
		i,
		a,
		o
	]);
}
//#endregion
//#region src/client/components/AnalysisBuilder/utils/shareStateUtils.ts
function mr(e) {
	if (!e || e.analysisType !== "funnel") return;
	let t = "funnel" in e.query ? e.query.funnel : null;
	if (!t) return;
	let n = e.charts?.funnel;
	return {
		funnelCube: null,
		funnelSteps: [],
		funnelTimeDimension: typeof t.timeDimension == "string" ? t.timeDimension : null,
		funnelBindingKey: t.bindingKey ? { dimension: t.bindingKey } : null,
		funnelChartType: n?.chartType || "funnel",
		funnelChartConfig: n?.chartConfig || {},
		funnelDisplayConfig: n?.displayConfig || {}
	};
}
function hr(e) {
	if (!e || e.analysisType !== "flow") return;
	let t = "flow" in e.query ? e.query.flow : null;
	if (!t) return;
	let n = e.charts?.flow;
	return {
		flowCube: null,
		flowBindingKey: t.bindingKey ? typeof t.bindingKey == "string" ? { dimension: t.bindingKey } : { dimension: t.bindingKey[0]?.dimension || "" } : null,
		flowTimeDimension: typeof t.timeDimension == "string" ? t.timeDimension : t.timeDimension?.[0]?.dimension || null,
		startingStep: t.startingStep ? {
			name: t.startingStep.name || "",
			filters: Array.isArray(t.startingStep.filter) ? t.startingStep.filter : t.startingStep.filter ? [t.startingStep.filter] : []
		} : {
			name: "",
			filters: []
		},
		stepsBefore: t.stepsBefore ?? 3,
		stepsAfter: t.stepsAfter ?? 3,
		eventDimension: t.eventDimension || null,
		flowChartType: n?.chartType || "sankey",
		flowChartConfig: n?.chartConfig || {},
		flowDisplayConfig: n?.displayConfig || {}
	};
}
function gr(e) {
	if (!e || e.analysisType !== "retention") return;
	let t = "retention" in e.query ? e.query.retention : null;
	if (!t) return;
	let n = e.charts?.retention;
	return {
		retentionCube: null,
		retentionBindingKey: t.bindingKey ? { dimension: t.bindingKey } : null,
		retentionTimeDimension: typeof t.timeDimension == "string" ? t.timeDimension : null,
		retentionDateRange: t.dateRange,
		retentionCohortFilters: Array.isArray(t.cohortFilters) ? t.cohortFilters : t.cohortFilters ? [t.cohortFilters] : [],
		retentionActivityFilters: Array.isArray(t.activityFilters) ? t.activityFilters : t.activityFilters ? [t.activityFilters] : [],
		retentionBreakdowns: t.breakdownDimensions?.map((e) => ({
			field: e,
			label: e.split(".").pop() || e
		})) || [],
		retentionViewGranularity: t.granularity || "week",
		retentionPeriods: t.periods || 12,
		retentionType: t.retentionType || "classic",
		retentionChartType: n?.chartType || "retentionCombined",
		retentionChartConfig: n?.chartConfig || {},
		retentionDisplayConfig: n?.displayConfig || {}
	};
}
//#endregion
//#region src/client/components/AnalysisBuilder/index.tsx
var _r = I(({ className: t = "", maxHeight: n, initialData: r, colorPalette: i, hideSettings: a = !1, hideShare: o = !1, onQueryChange: s, onChartConfigChange: c }, l) => {
	let { meta: u } = v(), { features: f } = e(), p = O({
		initialData: r,
		externalColorPalette: i,
		onQueryChange: s,
		onChartConfigChange: c
	}), m = T(), { aiState: h, shareButtonState: g } = p, _ = B(() => p.analysisType === "funnel" ? p.funnelSteps.length > 0 || p.funnelCube !== null || p.funnelBindingKey !== null || p.funnelTimeDimension !== null : p.queryState.metrics.length > 0 || p.queryState.breakdowns.length > 0 || p.queryState.filters.length > 0, [
		p.analysisType,
		p.funnelSteps.length,
		p.funnelCube,
		p.funnelBindingKey,
		p.funnelTimeDimension,
		p.queryState.metrics.length,
		p.queryState.breakdowns.length,
		p.queryState.filters.length
	]);
	pr(l, {
		getQueryConfig: p.getQueryConfig,
		getChartConfig: p.getChartConfig,
		getAnalysisType: p.getAnalysisType,
		clearQuery: p.actions.clearQuery,
		storeApi: m
	});
	let y = p.analysisType === "flow" ? p.flowDisplayConfig : p.analysisType === "funnel" ? p.funnelDisplayConfig : p.displayConfig, b = R((e, t, n) => {
		let r = `${e}.${t}`;
		if (n === "measure") p.actions.toggleMetric(r);
		else {
			let t = (u?.cubes?.find((t) => t.name === e))?.dimensions?.find((e) => e.name === r);
			p.actions.toggleBreakdown(r, t?.type === "time");
		}
	}, [u, p.actions]);
	return /* @__PURE__ */ G("div", {
		className: `dc:flex dc:flex-col dc:lg:flex-row bg-dc-surface dc:border-x dc:border-b border-dc-border ${n ? "dc:lg:h-[var(--dc-max-h)] dc:lg:max-h-[var(--dc-max-h)] dc:lg:overflow-hidden" : "dc:lg:h-full"} ${t}`,
		style: n ? { "--dc-max-h": n } : void 0,
		children: [
			/* @__PURE__ */ G("div", {
				className: "dc:h-[60vh] dc:lg:h-auto dc:lg:flex-1 dc:min-w-0 dc:border-b dc:lg:border-b-0 dc:lg:border-r border-dc-border dc:overflow-auto dc:flex dc:flex-col",
				children: [h.isOpen && /* @__PURE__ */ W(cr, {
					userPrompt: h.userPrompt,
					onPromptChange: p.actions.setAIPrompt,
					isGenerating: h.isGenerating,
					error: h.error,
					hasGeneratedQuery: h.hasGeneratedQuery,
					onGenerate: p.actions.generateAI,
					onAccept: p.actions.acceptAI,
					onCancel: p.actions.cancelAI
				}), /* @__PURE__ */ W("div", {
					className: "dc:flex-1 dc:overflow-auto",
					children: /* @__PURE__ */ W(Ke, {
						executionStatus: p.executionStatus,
						executionResults: p.executionResults,
						executionError: p.error?.message || null,
						totalRowCount: null,
						resultsStale: p.isLoading && p.executionResults !== null,
						chartType: p.chartType,
						chartConfig: p.chartConfig,
						displayConfig: y,
						colorPalette: p.colorPalette,
						currentPaletteName: i ? void 0 : p.localPaletteName,
						onColorPaletteChange: i ? void 0 : p.actions.setLocalPaletteName,
						allQueries: p.allQueries,
						funnelExecutedQueries: p.funnelExecutedQueries ?? void 0,
						schema: u,
						activeView: p.activeView,
						onActiveViewChange: p.actions.setActiveView,
						displayLimit: p.displayLimit,
						onDisplayLimitChange: p.actions.setDisplayLimit,
						chartAvailability: p.chartAvailability,
						debugDataPerQuery: p.debugDataPerQuery,
						onShareClick: o ? void 0 : p.actions.share,
						canShare: !o && p.isValidQuery,
						shareButtonState: g,
						onRefreshClick: p.actions.refetch,
						canRefresh: p.isValidQuery,
						isRefreshing: p.isFetching,
						needsRefresh: p.needsRefresh,
						onClearClick: p.actions.clearCurrentMode,
						canClear: _,
						enableAI: f?.enableAI !== !1,
						isAIOpen: h.isOpen,
						onAIToggle: h.isOpen ? p.actions.closeAI : p.actions.openAI,
						queryCount: p.queryStates.length,
						perQueryResults: p.perQueryResults ?? void 0,
						activeTableIndex: p.activeTableIndex,
						onActiveTableChange: p.actions.setActiveTableIndex,
						analysisType: p.analysisType,
						isFunnelMode: p.isFunnelModeEnabled,
						funnelServerQuery: p.funnelServerQuery,
						funnelDebugData: p.funnelDebugData,
						flowServerQuery: p.flowServerQuery,
						flowDebugData: p.flowDebugData,
						retentionServerQuery: p.retentionServerQuery,
						retentionDebugData: p.retentionDebugData,
						retentionChartData: p.retentionChartData,
						retentionValidation: p.retentionValidation,
						warnings: p.warnings,
						highlightedFields: [...p.queryState.metrics.map((e) => e.field), ...p.effectiveBreakdowns.map((e) => e.field)],
						onSchemaFieldClick: b
					})
				})]
			}),
			/* @__PURE__ */ W("div", {
				className: "dc:w-full dc:lg:w-96 dc:flex-shrink-0 dc:lg:h-full dc:overflow-auto dc:lg:overflow-hidden",
				children: /* @__PURE__ */ W(fr, {
					analysisType: p.analysisType,
					onSwitchToSafeMode: () => p.actions.setAnalysisType("query"),
					children: /* @__PURE__ */ W(ar, {
						metrics: p.queryState.metrics,
						breakdowns: p.effectiveBreakdowns,
						filters: p.queryState.filters,
						schema: u,
						activeTab: p.activeTab,
						onActiveTabChange: p.actions.setActiveTab,
						onAddMetric: p.actions.openMetricsModal,
						onRemoveMetric: p.actions.removeMetric,
						onReorderMetrics: p.actions.reorderMetrics,
						onAddBreakdown: p.actions.openBreakdownsModal,
						onRemoveBreakdown: p.actions.removeBreakdown,
						onBreakdownGranularityChange: p.actions.setBreakdownGranularity,
						onBreakdownComparisonToggle: p.actions.toggleBreakdownComparison,
						onReorderBreakdowns: p.actions.reorderBreakdowns,
						onFiltersChange: p.actions.setFilters,
						onDropFieldToFilter: p.actions.dropFieldToFilter,
						order: p.queryState.order,
						onOrderChange: p.actions.setOrder,
						limit: p.queryState.limit,
						onLimitChange: p.actions.setLimit,
						chartType: p.chartType,
						chartConfig: p.chartConfig,
						displayConfig: p.displayConfig,
						colorPalette: p.colorPalette,
						chartAvailability: p.chartAvailability,
						onChartTypeChange: p.actions.setChartType,
						onChartConfigChange: p.actions.setChartConfig,
						onDisplayConfigChange: p.actions.setDisplayConfig,
						validationStatus: p.queryState.validationStatus,
						validationError: p.queryState.validationError,
						queryCount: p.queryStates.length,
						activeQueryIndex: p.activeQueryIndex,
						mergeStrategy: p.mergeStrategy,
						onActiveQueryChange: p.actions.setActiveQueryIndex,
						onAddQuery: p.actions.addQuery,
						onRemoveQuery: p.actions.removeQuery,
						onMergeStrategyChange: p.actions.setMergeStrategy,
						breakdownsLocked: p.mergeStrategy === "merge" && p.activeQueryIndex > 0,
						combinedMetrics: p.combinedMetrics,
						combinedBreakdowns: p.combinedBreakdowns,
						multiQueryValidation: p.multiQueryValidation,
						adapterValidation: p.adapterValidation,
						funnelBindingKey: p.funnelBindingKey,
						onFunnelBindingKeyChange: p.actions.setFunnelBindingKey,
						analysisType: p.analysisType,
						onAnalysisTypeChange: p.actions.setAnalysisType,
						funnelCube: p.funnelCube,
						funnelSteps: p.funnelSteps,
						activeFunnelStepIndex: p.activeFunnelStepIndex,
						funnelTimeDimension: p.funnelTimeDimension,
						onFunnelCubeChange: p.actions.setFunnelCube,
						onAddFunnelStep: p.actions.addFunnelStep,
						onRemoveFunnelStep: p.actions.removeFunnelStep,
						onUpdateFunnelStep: p.actions.updateFunnelStep,
						onSelectFunnelStep: p.actions.setActiveFunnelStepIndex,
						onReorderFunnelSteps: p.actions.reorderFunnelSteps,
						onFunnelTimeDimensionChange: p.actions.setFunnelTimeDimension,
						funnelDisplayConfig: p.funnelDisplayConfig,
						onFunnelDisplayConfigChange: p.actions.setFunnelDisplayConfig,
						flowCube: p.flowCube,
						flowBindingKey: p.flowBindingKey,
						flowTimeDimension: p.flowTimeDimension,
						eventDimension: p.eventDimension,
						startingStep: p.startingStep,
						stepsBefore: p.stepsBefore,
						stepsAfter: p.stepsAfter,
						flowJoinStrategy: p.joinStrategy,
						onFlowCubeChange: p.actions.setFlowCube,
						onFlowBindingKeyChange: p.actions.setFlowBindingKey,
						onFlowTimeDimensionChange: p.actions.setFlowTimeDimension,
						onEventDimensionChange: p.actions.setEventDimension,
						onStartingStepFiltersChange: p.actions.setStartingStepFilters,
						onStepsBeforeChange: p.actions.setStepsBefore,
						onStepsAfterChange: p.actions.setStepsAfter,
						onFlowJoinStrategyChange: p.actions.setJoinStrategy,
						flowDisplayConfig: p.flowDisplayConfig,
						onFlowDisplayConfigChange: p.actions.setFlowDisplayConfig,
						retentionCube: p.retentionCube,
						retentionBindingKey: p.retentionBindingKey,
						retentionTimeDimension: p.retentionTimeDimension,
						retentionDateRange: p.retentionDateRange,
						retentionCohortFilters: p.retentionCohortFilters,
						retentionActivityFilters: p.retentionActivityFilters,
						retentionBreakdowns: p.retentionBreakdowns,
						retentionViewGranularity: p.retentionViewGranularity,
						retentionPeriods: p.retentionPeriods,
						retentionType: p.retentionType,
						onRetentionCubeChange: p.actions.setRetentionCube,
						onRetentionBindingKeyChange: p.actions.setRetentionBindingKey,
						onRetentionTimeDimensionChange: p.actions.setRetentionTimeDimension,
						onRetentionDateRangeChange: p.actions.setRetentionDateRange,
						onRetentionCohortFiltersChange: p.actions.setRetentionCohortFilters,
						onRetentionActivityFiltersChange: p.actions.setRetentionActivityFilters,
						onRetentionBreakdownsChange: p.actions.setRetentionBreakdowns,
						onAddRetentionBreakdown: p.actions.addRetentionBreakdown,
						onRemoveRetentionBreakdown: p.actions.removeRetentionBreakdown,
						onRetentionViewGranularityChange: p.actions.setRetentionViewGranularity,
						onRetentionPeriodsChange: p.actions.setRetentionPeriods,
						onRetentionTypeChange: p.actions.setRetentionType,
						retentionDisplayConfig: p.retentionDisplayConfig,
						onRetentionDisplayConfigChange: p.actions.setRetentionDisplayConfig
					})
				})
			}),
			/* @__PURE__ */ W(d, {
				isOpen: p.showFieldModal,
				onClose: p.actions.closeFieldModal,
				onSelect: p.actions.handleFieldSelected,
				mode: p.fieldModalMode,
				schema: p.analysisType === "retention" && p.retentionCube && u ? {
					...u,
					cubes: u.cubes?.filter((e) => e.name === p.retentionCube) || []
				} : u,
				selectedFields: [
					...p.queryState.metrics.map((e) => e.field),
					...p.effectiveBreakdowns.map((e) => e.field),
					...p.analysisType === "retention" ? p.retentionBreakdowns.map((e) => e.field) : []
				]
			})
		]
	});
});
_r.displayName = "AnalysisBuilderInner";
var vr = I((e, t) => {
	let { initialQuery: n, initialChartConfig: r, initialAnalysisType: i, initialFunnelState: a, initialFlowState: o, initialRetentionState: s, disableLocalStorage: c = !1, storageKey: l, ...u } = e, d = A(), f = d ? M(d) : null, p = f?.activeView, m = f?.analysisType, h = mr(f), g = hr(f), _ = gr(f), v = !!n || !!a || !!o || !!s;
	return /* @__PURE__ */ W(D, {
		initialQuery: n,
		initialChartConfig: r,
		initialAnalysisType: i || m,
		initialFunnelState: a || h,
		initialFlowState: o || g,
		initialRetentionState: s || _,
		initialActiveView: p,
		disableLocalStorage: c || !!n || !!a || !!o || !!s || !!d,
		storageKey: l,
		children: /* @__PURE__ */ W(_r, {
			ref: t,
			...u,
			hideShare: v
		})
	});
});
vr.displayName = "AnalysisBuilder";
//#endregion
export { vr as default };

//# sourceMappingURL=analysis-builder-Ehr0jHhS.js.map