import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { c as t, y as n } from "./chart-data-table-Bn9EtETl.js";
import { F as r } from "./chart-activity-grid-D6X0iOUw.js";
import { Suspense as i, createContext as a, lazy as o, useCallback as s, useContext as c, useEffect as l, useMemo as u, useRef as d, useState as f } from "react";
import { Fragment as p, jsx as m, jsxs as h } from "react/jsx-runtime";
//#region src/client/components/SchemaVisualization/xyflowContext.tsx
var g = a(null), _ = g.Provider;
function v() {
	let e = c(g);
	if (!e) throw Error("useXyflow must be used within XyflowProvider");
	return e;
}
//#endregion
//#region src/client/components/SchemaVisualization/SchemaVisualizationLazy.tsx
var y = /* @__PURE__ */ e({ SchemaVisualizationLazy: () => w }), b = !1;
function x(e) {
	let { t } = r();
	return /* @__PURE__ */ m("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:h-full dc:p-8",
		children: /* @__PURE__ */ h("div", {
			className: "dc:text-center dc:max-w-md",
			children: [
				/* @__PURE__ */ m("div", {
					className: "dc:text-4xl dc:mb-4",
					children: "🔍"
				}),
				/* @__PURE__ */ m("h3", {
					className: "dc:text-lg dc:font-semibold text-dc-text dc:mb-2",
					children: t("schema.missingDeps.title")
				}),
				/* @__PURE__ */ m("p", {
					className: "dc:text-sm text-dc-text-secondary dc:mb-4",
					children: t("schema.missingDeps.description")
				}),
				/* @__PURE__ */ m("code", {
					className: "dc:block dc:px-4 dc:py-2 dc:rounded-sm bg-dc-surface-secondary dc:text-sm dc:font-mono text-dc-text dc:border border-dc-border",
					children: "npm install @xyflow/react elkjs"
				})
			]
		})
	});
}
function S() {
	let { t: e } = r();
	return /* @__PURE__ */ m("div", {
		className: "dc:flex dc:items-center dc:justify-center dc:h-full",
		children: /* @__PURE__ */ h("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ m("div", { className: "dc:animate-spin dc:rounded-full dc:h-8 dc:w-8 dc:border-b-2 border-dc-accent dc:mx-auto dc:mb-2" }), /* @__PURE__ */ m("p", {
				className: "dc:text-sm text-dc-text-muted",
				children: e("schema.loadingVisualization")
			})]
		})
	});
}
var C = o(async () => ({ default: (await Promise.resolve().then(() => B)).SchemaVisualization }));
function w(e) {
	let [t, n] = f(null), [r, a] = f(b);
	return l(() => {
		if (b) return;
		let e = !1;
		return import("@xyflow/react").then((t) => {
			e || n(t);
		}).catch(() => {
			b = !0, e || a(!0);
		}), () => {
			e = !0;
		};
	}, []), r ? /* @__PURE__ */ m(x, { ...e }) : t ? /* @__PURE__ */ m(_, {
		value: t,
		children: /* @__PURE__ */ m(i, {
			fallback: /* @__PURE__ */ m(S, {}),
			children: /* @__PURE__ */ m(C, { ...e })
		})
	}) : /* @__PURE__ */ m(S, {});
}
//#endregion
//#region src/client/components/SchemaVisualization/CubeNode.tsx
function T({ data: e }) {
	let { t } = r(), { Handle: i, Position: a } = v(), { cube: o, onFieldClick: s, onCubeClick: c, isHighlighted: l, highlightedFields: u, searchTerm: d, selectedField: f } = e, p = (e, t, n) => {
		s && s(o.name, t, n, {
			x: e.clientX,
			y: e.clientY
		});
	}, g = n("info"), _ = (e) => {
		e.stopPropagation(), c && c(o.name, {
			x: e.clientX,
			y: e.clientY
		});
	}, y = (e) => f ? f.cubeName === o.name && f.fieldName === e : !1, b = f?.cubeName === o.name && f?.fieldName === null, x = (e) => u.includes(e), S = (e) => {
		if (!d?.trim()) return !0;
		let t = d.toLowerCase();
		return e.name.toLowerCase().includes(t) || e.title && e.title.toLowerCase().includes(t);
	}, C = !d?.trim() || o.measures.some((e) => S(e)) || o.dimensions.some((e) => S(e)), w = (e, t, n) => {
		let r = e.name.split(".")[1] || e.name, i = y(r), a = "dc:px-4 dc:py-2 dc:text-xs dc:cursor-pointer dc:transition-all dc:border-b border-dc-border last:dc:border-b-0 nodrag nopan";
		return i ? `${a} bg-dc-accent-bg text-dc-accent dc:font-semibold dc:ring-1 dc:ring-inset ring-dc-accent` : !C && d?.trim() ? t ? `${a} bg-dc-accent-bg text-dc-accent dc:font-semibold` : `${a} dc:hover:bg-dc-surface-hover text-dc-text-secondary` : d?.trim() && !S(e) ? `${a} dc:opacity-40 dc:hover:opacity-60 text-dc-text-muted` : d?.trim() && S(e) && !t ? `${a} dc:font-bold dc:hover:bg-dc-accent-bg` : t ? `${a} bg-dc-accent-bg text-dc-accent dc:font-semibold` : `${a} dc:hover:bg-dc-surface-hover text-dc-text-secondary`;
	}, T = o.dimensions.filter((e) => e.type === "time"), E = o.dimensions.filter((e) => e.type !== "time");
	return /* @__PURE__ */ h("div", {
		className: `
        dc:border-2 dc:rounded-lg dc:shadow-lg dc:min-w-[280px] dc:overflow-hidden dc:transition-all
        ${!C && d?.trim() ? "dc:opacity-30 dc:grayscale" : ""}
        ${l ? "border-dc-accent dc:ring-2 ring-dc-accent" : "border-dc-border"}
      `,
		style: { backgroundColor: "var(--dc-surface)" },
		children: [
			/* @__PURE__ */ m("div", {
				className: `dc:px-4 dc:py-3 dc:transition-colors ${l ? "bg-dc-accent-bg" : "bg-dc-surface-secondary"}`,
				children: /* @__PURE__ */ h("div", {
					className: "dc:flex dc:items-center dc:justify-between",
					children: [
						/* @__PURE__ */ h("div", { children: [/* @__PURE__ */ m("h3", {
							className: "dc:font-semibold text-dc-text dc:text-sm",
							children: o.title || o.name
						}), o.description && /* @__PURE__ */ m("p", {
							className: "dc:text-xs text-dc-text-muted dc:mt-1 dc:line-clamp-2",
							children: o.description
						})] }),
						c && /* @__PURE__ */ m("button", {
							className: `dc:ml-2 dc:p-1 dc:rounded-sm dc:transition-colors nodrag nopan ${b ? "bg-dc-accent-bg text-dc-accent" : "text-dc-text-muted dc:hover:text-dc-text dc:hover:bg-dc-surface-hover"}`,
							onClick: _,
							title: t("schema.cubeInfo"),
							children: /* @__PURE__ */ m(g, { className: "dc:w-5 dc:h-5" })
						}),
						!c && /* @__PURE__ */ h("div", {
							className: "dc:text-xs text-dc-text-muted dc:ml-2",
							children: [/* @__PURE__ */ h("div", { children: [o.measures.length, "M"] }), /* @__PURE__ */ h("div", { children: [o.dimensions.length, "D"] })]
						})
					]
				})
			}),
			o.measures.length > 0 && /* @__PURE__ */ h("div", {
				className: "dc:border-t border-dc-border",
				children: [/* @__PURE__ */ m("div", {
					className: "dc:px-4 dc:py-1.5 dc:border-b border-dc-border",
					style: { backgroundColor: "color-mix(in srgb, var(--dc-warning) 10%, var(--dc-surface))" },
					children: /* @__PURE__ */ h("h4", {
						className: "dc:text-xs dc:font-medium text-dc-text-secondary dc:flex dc:items-center",
						children: [/* @__PURE__ */ m("span", { className: "dc:w-2 dc:h-2 bg-dc-warning dc:rounded-full dc:mr-2" }), t("schema.measures", { count: o.measures.length })]
					})
				}), /* @__PURE__ */ m("div", {
					className: "dc:max-h-64 dc:overflow-y-auto nowheel",
					children: o.measures.map((e) => {
						let t = e.name.split(".")[1] || e.name, n = x(e.name);
						return /* @__PURE__ */ m("div", {
							className: w(e, n, "measure"),
							onClick: (e) => p(e, t, "measure"),
							title: e.title,
							children: /* @__PURE__ */ h("div", {
								className: "dc:flex dc:items-center dc:justify-between",
								children: [/* @__PURE__ */ m("span", {
									className: "dc:font-mono dc:truncate",
									children: e.shortTitle || e.title || t
								}), /* @__PURE__ */ m("span", {
									className: "text-dc-text-muted dc:ml-2 dc:text-[10px] dc:uppercase",
									children: e.type
								})]
							})
						}, e.name);
					})
				})]
			}),
			T.length > 0 && /* @__PURE__ */ h("div", {
				className: "dc:border-t border-dc-border",
				children: [/* @__PURE__ */ m("div", {
					className: "dc:px-4 dc:py-1.5 dc:border-b border-dc-border",
					style: { backgroundColor: "color-mix(in srgb, var(--dc-accent) 10%, var(--dc-surface))" },
					children: /* @__PURE__ */ h("h4", {
						className: "dc:text-xs dc:font-medium text-dc-text-secondary dc:flex dc:items-center",
						children: [/* @__PURE__ */ m("span", { className: "dc:w-2 dc:h-2 bg-dc-accent dc:rounded-full dc:mr-2" }), t("schema.timeDimensions", { count: T.length })]
					})
				}), /* @__PURE__ */ m("div", {
					className: "dc:max-h-64 dc:overflow-y-auto nowheel",
					children: T.map((e) => {
						let t = e.name.split(".")[1] || e.name, n = x(e.name);
						return /* @__PURE__ */ m("div", {
							className: w(e, n, "dimension"),
							onClick: (e) => p(e, t, "dimension"),
							title: e.title,
							children: /* @__PURE__ */ h("div", {
								className: "dc:flex dc:items-center dc:justify-between",
								children: [/* @__PURE__ */ m("span", {
									className: "dc:font-mono dc:truncate",
									children: e.shortTitle || e.title || t
								}), /* @__PURE__ */ m("span", {
									className: "text-dc-text-muted dc:ml-2 dc:text-[10px] dc:uppercase",
									children: e.type
								})]
							})
						}, e.name);
					})
				})]
			}),
			E.length > 0 && /* @__PURE__ */ h("div", {
				className: "dc:border-t border-dc-border",
				children: [/* @__PURE__ */ m("div", {
					className: "dc:px-4 dc:py-1.5 dc:border-b border-dc-border",
					style: { backgroundColor: "color-mix(in srgb, var(--dc-success) 10%, var(--dc-surface))" },
					children: /* @__PURE__ */ h("h4", {
						className: "dc:text-xs dc:font-medium text-dc-text-secondary dc:flex dc:items-center",
						children: [/* @__PURE__ */ m("span", { className: "dc:w-2 dc:h-2 bg-dc-success dc:rounded-full dc:mr-2" }), t("schema.dimensions", { count: E.length })]
					})
				}), /* @__PURE__ */ m("div", {
					className: "dc:max-h-64 dc:overflow-y-auto nowheel",
					children: E.map((e) => {
						let t = e.name.split(".")[1] || e.name, n = x(e.name);
						return /* @__PURE__ */ m("div", {
							className: w(e, n, "dimension"),
							onClick: (e) => p(e, t, "dimension"),
							title: e.title,
							children: /* @__PURE__ */ h("div", {
								className: "dc:flex dc:items-center dc:justify-between",
								children: [/* @__PURE__ */ m("span", {
									className: "dc:font-mono dc:truncate",
									children: e.shortTitle || e.title || t
								}), /* @__PURE__ */ m("span", {
									className: "text-dc-text-muted dc:ml-2 dc:text-[10px] dc:uppercase",
									children: e.type
								})]
							})
						}, e.name);
					})
				})]
			}),
			/* @__PURE__ */ m(i, {
				type: "source",
				position: a.Right,
				id: "right",
				className: "dc:opacity-0",
				isConnectable: !1
			}),
			/* @__PURE__ */ m(i, {
				type: "target",
				position: a.Left,
				id: "left",
				className: "dc:opacity-0",
				isConnectable: !1
			}),
			/* @__PURE__ */ m(i, {
				type: "source",
				position: a.Bottom,
				id: "bottom",
				className: "dc:opacity-0",
				isConnectable: !1
			}),
			/* @__PURE__ */ m(i, {
				type: "target",
				position: a.Top,
				id: "top",
				className: "dc:opacity-0",
				isConnectable: !1
			})
		]
	});
}
//#endregion
//#region src/client/components/SchemaVisualization/RelationshipEdge.tsx
function E({ sourceX: e, sourceY: t, targetX: n, targetY: r, sourcePosition: i, targetPosition: a, style: o = {}, data: s, markerEnd: c }) {
	let { getBezierPath: l, BaseEdge: u, EdgeLabelRenderer: d } = v(), [f, g, _] = l({
		sourceX: e,
		sourceY: t,
		sourcePosition: i,
		targetX: n,
		targetY: r,
		targetPosition: a
	});
	if (!s) return null;
	let { relationship: y, joinFields: b } = s, x = (e) => {
		switch (e) {
			case "belongsTo": return "∈";
			case "hasOne": return "1:1";
			case "hasMany": return "1:M";
			case "belongsToMany": return "M:M";
			default: return "?";
		}
	}, S = ((e) => {
		switch (e) {
			case "belongsTo": return "#10b981";
			case "hasOne": return "#3b82f6";
			case "hasMany": return "#f59e0b";
			case "belongsToMany": return "#8b5cf6";
			default: return "#6b7280";
		}
	})(y.relationship), C = x(y.relationship);
	return /* @__PURE__ */ h(p, { children: [/* @__PURE__ */ m(u, {
		path: f,
		markerEnd: c,
		style: {
			...o,
			stroke: S
		}
	}), /* @__PURE__ */ m(d, { children: /* @__PURE__ */ m("div", {
		style: {
			position: "absolute",
			transform: `translate(-50%, -50%) translate(${g}px,${_}px)`,
			fontSize: 10,
			pointerEvents: "all"
		},
		className: "nodrag nopan",
		children: /* @__PURE__ */ m("div", {
			className: "dc:border-2 dc:rounded-md dc:px-2 dc:py-1 dc:shadow-xs",
			style: {
				backgroundColor: "var(--dc-surface)",
				borderColor: S
			},
			children: /* @__PURE__ */ h("div", {
				className: "dc:text-center",
				children: [/* @__PURE__ */ m("div", {
					className: "dc:font-bold dc:text-xs dc:mb-1",
					style: { color: S },
					children: C
				}), /* @__PURE__ */ m("div", {
					className: "dc:text-[9px] text-dc-text-muted dc:leading-tight",
					children: b.map((e, t) => /* @__PURE__ */ h("div", {
						className: "dc:font-mono",
						children: [
							e.sourceField,
							" → ",
							e.targetField
						]
					}, t))
				})]
			})
		})
	}) })] });
}
//#endregion
//#region src/client/components/SchemaVisualization/FieldDetailPanel.tsx
function D({ label: e, children: t }) {
	return /* @__PURE__ */ h("div", {
		className: "dc:flex dc:items-start dc:gap-2 dc:text-xs",
		children: [/* @__PURE__ */ m("span", {
			className: "text-dc-text-muted dc:w-20 dc:flex-shrink-0 dc:font-medium",
			children: e
		}), /* @__PURE__ */ m("span", {
			className: "text-dc-text dc:flex-1 dc:min-w-0",
			children: t
		})]
	});
}
function O({ type: e, color: t }) {
	return /* @__PURE__ */ m("span", {
		className: "dc:inline-flex dc:items-center dc:px-1.5 dc:py-0.5 dc:rounded-sm dc:text-[10px] dc:font-medium dc:uppercase",
		style: {
			backgroundColor: `color-mix(in srgb, ${t} 15%, var(--dc-surface))`,
			color: t
		},
		children: e
	});
}
function k({ measure: e, cube: t }) {
	return /* @__PURE__ */ h("div", {
		className: "dc:flex dc:flex-col dc:gap-2",
		children: [
			/* @__PURE__ */ m(D, {
				label: "Cube",
				children: t.title || t.name
			}),
			/* @__PURE__ */ m(D, {
				label: "Type",
				children: /* @__PURE__ */ m(O, {
					type: e.type,
					color: {
						count: "#f59e0b",
						countDistinct: "#f59e0b",
						countDistinctApprox: "#f59e0b",
						sum: "#10b981",
						avg: "#3b82f6",
						min: "#8b5cf6",
						max: "#ec4899",
						runningTotal: "#06b6d4",
						number: "#6b7280"
					}[e.type] || "#6b7280"
				})
			}),
			e.title && e.title !== e.shortTitle && /* @__PURE__ */ m(D, {
				label: "Title",
				children: e.title
			}),
			e.drillMembers && e.drillMembers.length > 0 && /* @__PURE__ */ m(D, {
				label: "Drill into",
				children: /* @__PURE__ */ m("div", {
					className: "dc:flex dc:flex-wrap dc:gap-1",
					children: e.drillMembers.map((e) => /* @__PURE__ */ m("span", {
						className: "dc:font-mono dc:text-[10px] dc:px-1 dc:py-0.5 dc:rounded-sm bg-dc-surface-secondary border-dc-border dc:border",
						children: e.split(".")[1] || e
					}, e))
				})
			})
		]
	});
}
function A({ dimension: e, cube: t }) {
	let n = e.type === "time" ? "#3b82f6" : "#10b981", r = t.hierarchies?.filter((n) => n.levels.some((n) => n === e.name || n === `${t.name}.${e.name.split(".")[1]}`)) || [];
	return /* @__PURE__ */ h("div", {
		className: "dc:flex dc:flex-col dc:gap-2",
		children: [
			/* @__PURE__ */ m(D, {
				label: "Cube",
				children: t.title || t.name
			}),
			/* @__PURE__ */ m(D, {
				label: "Type",
				children: /* @__PURE__ */ m(O, {
					type: e.type,
					color: n
				})
			}),
			e.title && e.title !== e.shortTitle && /* @__PURE__ */ m(D, {
				label: "Title",
				children: e.title
			}),
			e.type === "time" && e.granularities && e.granularities.length > 0 && /* @__PURE__ */ m(D, {
				label: "Granularity",
				children: /* @__PURE__ */ m("div", {
					className: "dc:flex dc:flex-wrap dc:gap-1",
					children: e.granularities.map((e) => /* @__PURE__ */ m("span", {
						className: "dc:font-mono dc:text-[10px] dc:px-1 dc:py-0.5 dc:rounded-sm bg-dc-surface-secondary border-dc-border dc:border",
						children: e
					}, e))
				})
			}),
			r.length > 0 && /* @__PURE__ */ m(D, {
				label: "Hierarchy",
				children: r.map((e) => /* @__PURE__ */ h("div", {
					className: "dc:text-[10px]",
					children: [/* @__PURE__ */ m("span", {
						className: "dc:font-medium",
						children: e.title
					}), /* @__PURE__ */ h("span", {
						className: "text-dc-text-muted dc:ml-1",
						children: [
							"(",
							e.levels.map((e) => e.split(".")[1] || e).join(" > "),
							")"
						]
					})]
				}, e.name))
			})
		]
	});
}
function j({ cube: e }) {
	let t = {
		belongsTo: "#10b981",
		hasOne: "#3b82f6",
		hasMany: "#f59e0b",
		belongsToMany: "#8b5cf6"
	};
	return /* @__PURE__ */ h("div", {
		className: "dc:flex dc:flex-col dc:gap-2",
		children: [
			e.description && /* @__PURE__ */ m(D, {
				label: "Description",
				children: e.description
			}),
			/* @__PURE__ */ h(D, {
				label: "Measures",
				children: [/* @__PURE__ */ m("span", {
					className: "dc:font-mono",
					children: e.measures.length
				}), e.measures.length > 0 && /* @__PURE__ */ h("span", {
					className: "text-dc-text-muted dc:ml-1",
					children: [
						"(",
						[...new Set(e.measures.map((e) => e.type))].join(", "),
						")"
					]
				})]
			}),
			/* @__PURE__ */ h(D, {
				label: "Dimensions",
				children: [/* @__PURE__ */ m("span", {
					className: "dc:font-mono",
					children: e.dimensions.length
				}), e.dimensions.some((e) => e.type === "time") && /* @__PURE__ */ h("span", {
					className: "text-dc-text-muted dc:ml-1",
					children: [
						"(",
						e.dimensions.filter((e) => e.type === "time").length,
						" time)"
					]
				})]
			}),
			e.relationships && e.relationships.length > 0 && /* @__PURE__ */ m(D, {
				label: "Joins",
				children: /* @__PURE__ */ m("div", {
					className: "dc:flex dc:flex-col dc:gap-1",
					children: e.relationships.map((e, n) => /* @__PURE__ */ h("div", {
						className: "dc:flex dc:items-center dc:gap-1.5 dc:text-[10px]",
						children: [/* @__PURE__ */ m(O, {
							type: e.relationship,
							color: t[e.relationship] || "#6b7280"
						}), /* @__PURE__ */ m("span", {
							className: "dc:font-mono",
							children: e.targetCube
						})]
					}, n))
				})
			}),
			e.hierarchies && e.hierarchies.length > 0 && /* @__PURE__ */ m(D, {
				label: "Hierarchies",
				children: /* @__PURE__ */ m("div", {
					className: "dc:flex dc:flex-col dc:gap-1",
					children: e.hierarchies.map((e) => /* @__PURE__ */ h("div", {
						className: "dc:text-[10px]",
						children: [/* @__PURE__ */ m("span", {
							className: "dc:font-medium",
							children: e.title
						}), /* @__PURE__ */ h("span", {
							className: "text-dc-text-muted dc:ml-1",
							children: [
								"(",
								e.levels.map((e) => e.split(".")[1] || e).join(" > "),
								")"
							]
						})]
					}, e.name))
				})
			}),
			e.meta?.eventStream && /* @__PURE__ */ m(D, {
				label: "Event Stream",
				children: /* @__PURE__ */ h("div", {
					className: "dc:text-[10px]",
					children: [
						/* @__PURE__ */ m("span", {
							className: "text-dc-text-muted",
							children: "binding: "
						}),
						/* @__PURE__ */ m("span", {
							className: "dc:font-mono",
							children: e.meta.eventStream.bindingKey.split(".")[1] || e.meta.eventStream.bindingKey
						}),
						/* @__PURE__ */ m("span", {
							className: "text-dc-text-muted dc:ml-2",
							children: "time: "
						}),
						/* @__PURE__ */ m("span", {
							className: "dc:font-mono",
							children: e.meta.eventStream.timeDimension.split(".")[1] || e.meta.eventStream.timeDimension
						})
					]
				})
			})
		]
	});
}
function ee({ selection: e, meta: t, onClose: r }) {
	let i = n("close"), a = t.cubes.find((t) => t.name === e.cubeName);
	if (!a) return null;
	let o, s, c, l;
	if (e.fieldType === "cube" || !e.fieldName) o = a.title || a.name, s = "var(--dc-accent)", c = "color-mix(in srgb, var(--dc-accent) 10%, var(--dc-surface))", l = /* @__PURE__ */ m(j, { cube: a });
	else if (e.fieldType === "measure") {
		let t = a.measures.find((t) => (t.name.split(".")[1] || t.name) === e.fieldName || t.name === e.fieldName);
		if (!t) return null;
		o = t.shortTitle || t.title || e.fieldName, s = "var(--dc-warning)", c = "color-mix(in srgb, var(--dc-warning) 10%, var(--dc-surface))", l = /* @__PURE__ */ m(k, {
			measure: t,
			cube: a
		});
	} else {
		let t = a.dimensions.find((t) => (t.name.split(".")[1] || t.name) === e.fieldName || t.name === e.fieldName);
		if (!t) return null;
		o = t.shortTitle || t.title || e.fieldName, s = t.type === "time" ? "var(--dc-accent)" : "var(--dc-success)", c = t.type === "time" ? "color-mix(in srgb, var(--dc-accent) 10%, var(--dc-surface))" : "color-mix(in srgb, var(--dc-success) 10%, var(--dc-surface))", l = /* @__PURE__ */ m(A, {
			dimension: t,
			cube: a
		});
	}
	return /* @__PURE__ */ h("div", {
		className: "dc:border-2 dc:rounded-lg dc:shadow-lg dc:min-w-[260px] dc:max-w-[320px] dc:overflow-hidden dc:transition-all border-dc-border",
		style: { backgroundColor: "var(--dc-surface)" },
		children: [/* @__PURE__ */ h("div", {
			className: "dc:px-4 dc:py-2.5 dc:border-b border-dc-border dc:flex dc:items-center dc:justify-between",
			style: { backgroundColor: c },
			children: [/* @__PURE__ */ h("div", {
				className: "dc:flex dc:items-center dc:gap-2 dc:min-w-0",
				children: [/* @__PURE__ */ m("span", {
					className: "dc:w-2 dc:h-2 dc:rounded-full dc:flex-shrink-0",
					style: { backgroundColor: s }
				}), /* @__PURE__ */ m("h4", {
					className: "dc:text-sm dc:font-semibold text-dc-text dc:truncate",
					children: o
				})]
			}), /* @__PURE__ */ m("button", {
				onClick: r,
				className: "dc:ml-2 dc:flex-shrink-0 text-dc-text-muted dc:hover:text-dc-text dc:transition-colors",
				children: /* @__PURE__ */ m(i, { className: "dc:w-3.5 dc:h-3.5" })
			})]
		}), /* @__PURE__ */ m("div", {
			className: "dc:px-4 dc:py-3",
			children: l
		})]
	});
}
//#endregion
//#region src/client/components/SchemaVisualization/useERDLayout.ts
var te = {
	direction: "LR",
	nodeWidth: 340,
	nodeSep: 150,
	rankSep: 350
};
function M(e) {
	switch (e) {
		case "TB": return "top";
		case "LR": return "left";
		default: return "top";
	}
}
function N(e) {
	switch (e) {
		case "TB": return "bottom";
		case "LR": return "right";
		default: return "bottom";
	}
}
function P(e) {
	let t = e.data?.cube;
	if (!t) return 300;
	let n = t.description ? 80 : 56, r = t.measures?.length ?? 0, i = t.dimensions?.filter((e) => e.type === "time").length ?? 0, a = t.dimensions?.filter((e) => e.type !== "time").length ?? 0;
	return r > 0 && (n += 36 + Math.min(r * 34, 256)), i > 0 && (n += 36 + Math.min(i * 34, 256)), a > 0 && (n += 36 + Math.min(a * 34, 256)), n + 30;
}
var F = null, I = null;
function L() {
	return I || (I = import("elkjs/lib/elk.bundled.js").then((e) => (F = new (e.default || e)(), F)).catch(() => null), I);
}
async function R(e, t, n) {
	if (await L(), !F) return {
		nodes: z(e, n),
		edges: t
	};
	let r = n.direction === "LR" ? "EAST" : "SOUTH", i = n.direction === "LR" ? "WEST" : "NORTH", a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
	t.forEach((e) => {
		a.has(e.source) || a.set(e.source, []), a.get(e.source).push(e.id), o.has(e.target) || o.set(e.target, []), o.get(e.target).push(e.id);
	});
	let s = e.map((e) => {
		let t = n.nodeWidth, s = P(e), c = a.get(e.id) || [], l = o.get(e.id) || [], u = [...c.map((t) => ({
			id: `${e.id}__src__${t}`,
			layoutOptions: { "elk.port.side": r }
		})), ...l.map((t) => ({
			id: `${e.id}__tgt__${t}`,
			layoutOptions: { "elk.port.side": i }
		}))];
		return {
			id: e.id,
			width: t,
			height: s,
			layoutOptions: { "elk.portConstraints": "FIXED_SIDE" },
			ports: u
		};
	}), c = t.map((e) => ({
		id: e.id,
		sources: [`${e.source}__src__${e.id}`],
		targets: [`${e.target}__tgt__${e.id}`]
	})), l = await F.layout({
		id: "root",
		layoutOptions: {
			"elk.algorithm": "layered",
			"elk.direction": n.direction === "LR" ? "RIGHT" : "DOWN",
			"elk.edgeRouting": "SPLINES",
			"elk.layered.edgeRouting.splines.mode": "CONSERVATIVE",
			"elk.spacing.nodeNode": String(n.nodeSep),
			"elk.layered.spacing.nodeNodeBetweenLayers": String(n.rankSep),
			"elk.spacing.edgeNode": "60",
			"elk.layered.spacing.edgeNodeBetweenLayers": "60",
			"elk.spacing.edgeEdge": "25",
			"elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
			"elk.layered.crossingMinimization.strategy": "LAYER_SWEEP"
		},
		children: s,
		edges: c
	}), u = /* @__PURE__ */ new Map();
	if (l.children) for (let e of l.children) u.set(e.id, {
		x: e.x,
		y: e.y
	});
	return {
		nodes: e.map((e) => ({
			...e,
			position: u.get(e.id) || e.position,
			targetPosition: M(n.direction),
			sourcePosition: N(n.direction)
		})),
		edges: t
	};
}
function z(e, t) {
	let n = 0, r = 0;
	return e.map((e) => {
		let i = P(e);
		r + i > 1200 && r > 0 && (n++, r = 0);
		let a = {
			x: n * (t.nodeWidth + t.nodeSep),
			y: r
		};
		return r += i + 40, {
			...e,
			position: a,
			sourcePosition: N(t.direction),
			targetPosition: M(t.direction)
		};
	});
}
function ne(e, t, n = {}) {
	let r = u(() => ({
		...te,
		...n
	}), [
		n.direction,
		n.nodeWidth,
		n.nodeSep,
		n.rankSep
	]), i = u(() => e.length === 0 ? "" : e.map((e) => e.id).sort().join(",") + "|" + t.map((e) => e.id).sort().join(","), [e, t]), a = d(e), o = d(t), s = d(r);
	a.current = e, o.current = t, s.current = r;
	let [c, p] = f("waiting"), [m, h] = f(null), [g, _] = f(""), v = d(0);
	return l(() => {
		if (!i) {
			p("ready"), h(null), _("");
			return;
		}
		let e = ++v.current;
		p("computing"), R(a.current, o.current, s.current).then((t) => {
			e === v.current && (h(t), _(i), p("ready"));
		}).catch(() => {
			e === v.current && (h({
				nodes: z(a.current, s.current),
				edges: o.current
			}), _(i), p("ready"));
		});
	}, [i]), c === "ready" && m && g === i ? {
		nodes: m.nodes,
		edges: m.edges,
		phase: "ready"
	} : {
		nodes: [],
		edges: [],
		phase: c
	};
}
//#endregion
//#region src/client/components/SchemaVisualization/index.tsx
var B = /* @__PURE__ */ e({
	SchemaVisualization: () => V,
	default: () => V
}), re = { cubeNode: T }, ie = { relationshipEdge: E };
function ae({ token: e }) {
	let { useNodesInitialized: t, useReactFlow: n } = v(), r = t(), { fitView: i } = n(), a = d(0);
	return l(() => {
		e !== 0 && e !== a.current && r && (a.current = e, i({ padding: .1 }));
	}, [
		e,
		r,
		i
	]), null;
}
var oe = [];
function se(e) {
	switch (e) {
		case "belongsTo": return "#10b981";
		case "hasOne": return "#3b82f6";
		case "hasMany": return "#f59e0b";
		case "belongsToMany": return "#8b5cf6";
		default: return "#6b7280";
	}
}
function V({ className: e = "", onFieldClick: i, highlightedCubes: a, highlightedFields: o, searchTerm: c, height: p = "100%" }) {
	let { t: g } = r(), { ReactFlow: _, Controls: y, MiniMap: b, Background: x, applyNodeChanges: S } = v(), { meta: C, metaLoading: w, metaError: T } = t(), E = a || oe, D = o || oe, [O, k] = f(null), [A, j] = f(c || ""), [te, M] = f(0), [N, P] = f(null), [F, I] = f(null), L = d(null), R = !i, [z, B] = f({}), [V, ce] = f(!1), le = n("search"), ue = n("close"), H = c === void 0 ? A : c;
	l(() => {
		try {
			let e = localStorage.getItem("drizzle-cube-erd-node-positions");
			e && B(JSON.parse(e));
		} catch {}
		ce(!0);
	}, []);
	let { structuralNodes: U, structuralEdges: W } = u(() => {
		if (!C) return {
			structuralNodes: [],
			structuralEdges: []
		};
		let e = C.cubes.map((e, t) => ({
			id: e.name,
			type: "cubeNode",
			position: {
				x: t % 3 * 400,
				y: Math.floor(t / 3) * 300
			},
			data: { cube: e }
		})), t = [];
		return C.cubes.forEach((e) => {
			e.relationships && e.relationships.forEach((n, r) => {
				n.relationship !== "belongsTo" && t.push({
					id: `${e.name}-${n.targetCube}-${r}`,
					source: e.name,
					target: n.targetCube,
					type: "relationshipEdge",
					data: {
						relationship: n,
						joinFields: n.joinFields || []
					},
					animated: !1,
					style: {
						stroke: se(n.relationship),
						strokeWidth: 2
					}
				});
			});
		}), {
			structuralNodes: e,
			structuralEdges: t
		};
	}, [C]), G = te > 0 || V && Object.keys(z).length === 0, { nodes: K, edges: q, phase: de } = ne(G ? U : [], G ? W : [], {
		direction: "LR",
		nodeWidth: 340,
		nodeSep: 150,
		rankSep: 350
	}), J = s((e, t) => {
		let n = L.current?.getBoundingClientRect();
		if (!n) return {
			x: e,
			y: t
		};
		let r = e - n.left + 12, i = t - n.top + 12;
		return r + 300 > n.width && (r = e - n.left - 300 - 12), i + 200 > n.height && (i = n.height - 200 - 8), r < 0 && (r = 8), i < 0 && (i = 8), {
			x: r,
			y: i
		};
	}, []), fe = s((e, t, n, r) => {
		P((i) => i && i.cubeName === e && i.fieldName === t ? (I(null), null) : (r && I(J(r.x, r.y)), {
			cubeName: e,
			fieldName: t,
			fieldType: n
		}));
	}, [J]), pe = s((e, t) => {
		P((n) => n && n.cubeName === e && n.fieldName === null ? (I(null), null) : (t && I(J(t.x, t.y)), {
			cubeName: e,
			fieldName: null,
			fieldType: "cube"
		}));
	}, [J]), me = R ? fe : i, he = R ? pe : void 0, Y = s((e) => ({
		cube: e,
		onFieldClick: me,
		onCubeClick: he,
		isHighlighted: E.includes(e.name),
		highlightedFields: D,
		searchTerm: H,
		selectedField: R ? N : null
	}), [
		me,
		he,
		E,
		D,
		H,
		R,
		N
	]), X = !G || de === "ready", Z = u(() => !C || !X || !V ? [] : G && K.length > 0 ? K.map((e) => ({
		...e,
		data: Y(e.data?.cube || C.cubes.find((t) => t.name === e.id))
	})) : U.map((e) => ({
		...e,
		position: z[e.id] || e.position,
		data: Y(e.data?.cube)
	})), [
		C,
		X,
		V,
		G,
		K,
		U,
		z,
		Y
	]), ge = u(() => !C || !X ? [] : G && q.length > 0 ? q : W, [
		C,
		X,
		G,
		q,
		W
	]), [_e, Q] = f([]), [ve, ye] = f([]), $ = d(""), [be, xe] = f(0);
	l(() => {
		if (Z.length === 0) return;
		let e = Z.map((e) => `${e.id}:${Math.round(e.position.x)},${Math.round(e.position.y)}`).join("|");
		if (e === $.current) return;
		let t = $.current === "";
		$.current = e, Q(Z), ye(ge), t && xe((e) => e + 1);
	}, [Z, ge]);
	let Se = d("");
	l(() => {
		let e = N ? `${N.cubeName}.${N.fieldName}` : "", t = `${E.join(",")}|${D.join(",")}|${H}|${String(i)}|${e}`;
		t !== Se.current && (Se.current = t, !(_e.length === 0 || !C) && Q((e) => e.map((e) => {
			let t = C.cubes.find((t) => t.name === e.id);
			return t ? {
				...e,
				data: Y(t)
			} : e;
		})));
	}, [
		E,
		D,
		H,
		i,
		N,
		_e.length,
		C,
		Y
	]);
	let Ce = s((e) => {
		Q((t) => S(e, t)), e.filter((e) => e.type === "position" && "dragging" in e && e.dragging === !1).length > 0 && Q((e) => {
			let t = {};
			e.forEach((e) => {
				e.position && (t[e.id] = e.position);
			});
			try {
				localStorage.setItem("drizzle-cube-erd-node-positions", JSON.stringify(t));
			} catch {}
			return B(t), e;
		});
	}, []), we = s((e) => {}, []), Te = s((e) => {
		e.preventDefault(), e.stopPropagation(), k({
			x: e.clientX,
			y: e.clientY
		});
	}, []), Ee = s(() => {
		O && k(null), N && (P(null), I(null));
	}, [O, N]), De = s(() => {
		B({}), $.current = "";
		try {
			localStorage.removeItem("drizzle-cube-erd-node-positions");
		} catch {}
		M((e) => e + 1), k(null);
	}, []);
	return w ? /* @__PURE__ */ m("div", {
		className: `dc:flex dc:items-center dc:justify-center dc:h-96 ${e}`,
		children: /* @__PURE__ */ h("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ m("div", { className: "dc:animate-spin dc:rounded-full dc:h-8 dc:w-8 dc:border-b-2 border-dc-accent dc:mx-auto dc:mb-2" }), /* @__PURE__ */ m("p", {
				className: "text-dc-text-muted",
				children: g("schema.loading")
			})]
		})
	}) : T ? /* @__PURE__ */ m("div", {
		className: `dc:flex dc:items-center dc:justify-center dc:h-96 ${e}`,
		children: /* @__PURE__ */ h("div", {
			className: "dc:text-center text-dc-error",
			children: [/* @__PURE__ */ m("p", {
				className: "dc:font-medium",
				children: g("schema.error")
			}), /* @__PURE__ */ m("p", {
				className: "dc:text-sm dc:mt-1",
				children: T
			})]
		})
	}) : !C || C.cubes.length === 0 ? /* @__PURE__ */ m("div", {
		className: `dc:flex dc:items-center dc:justify-center dc:h-96 ${e}`,
		children: /* @__PURE__ */ h("div", {
			className: "dc:text-center text-dc-text-muted",
			children: [/* @__PURE__ */ m("p", {
				className: "dc:font-medium",
				children: g("schema.noCubes")
			}), /* @__PURE__ */ m("p", {
				className: "dc:text-sm dc:mt-1",
				children: g("schema.noCubesHint")
			})]
		})
	}) : X ? /* @__PURE__ */ h("div", {
		className: `dc:flex dc:flex-col ${e}`,
		style: {
			height: p,
			minHeight: 400
		},
		children: [
			c === void 0 && /* @__PURE__ */ h("div", {
				className: "dc:px-3 dc:py-2 dc:border-b border-dc-border bg-dc-surface dc:flex dc:items-center dc:gap-2 dc:flex-shrink-0",
				children: [
					/* @__PURE__ */ m(le, { className: "dc:w-4 dc:h-4 text-dc-text-muted" }),
					/* @__PURE__ */ m("input", {
						type: "text",
						value: A,
						onChange: (e) => j(e.target.value),
						placeholder: g("schema.searchPlaceholder"),
						className: "dc:flex-1 dc:text-sm dc:bg-transparent dc:outline-none text-dc-text dc:placeholder:text-dc-text-muted"
					}),
					A && /* @__PURE__ */ m("button", {
						onClick: () => j(""),
						className: "text-dc-text-muted dc:hover:text-dc-text",
						children: /* @__PURE__ */ m(ue, { className: "dc:w-3 dc:h-3" })
					})
				]
			}),
			/* @__PURE__ */ h("div", {
				ref: L,
				className: "dc:relative dc:flex-1 dc:min-h-0",
				children: [/* @__PURE__ */ m("div", {
					style: {
						position: "absolute",
						inset: 0
					},
					children: /* @__PURE__ */ h(_, {
						nodes: _e,
						edges: ve,
						onNodesChange: Ce,
						onEdgesChange: we,
						nodeTypes: re,
						edgeTypes: ie,
						connectionMode: "loose",
						minZoom: .1,
						maxZoom: 2,
						proOptions: { hideAttribution: !0 },
						onPaneContextMenu: Te,
						onPaneClick: Ee,
						children: [
							/* @__PURE__ */ m(y, {}),
							/* @__PURE__ */ m(b, {
								nodeColor: (e) => E.includes(e.id) ? "#8b5cf6" : "#e5e7eb",
								maskColor: "rgb(240, 242, 246, 0.7)"
							}),
							/* @__PURE__ */ m(x, {
								variant: "dots",
								gap: 12,
								size: 1
							}),
							/* @__PURE__ */ m(ae, { token: be })
						]
					})
				}), R && N && F && C && /* @__PURE__ */ m("div", {
					className: "dc:absolute dc:z-20",
					style: {
						left: F.x,
						top: F.y
					},
					children: /* @__PURE__ */ m(ee, {
						selection: N,
						meta: C,
						onClose: () => {
							P(null), I(null);
						}
					})
				})]
			}),
			O && /* @__PURE__ */ m("div", {
				className: "dc:fixed dc:z-50 bg-dc-surface dc:rounded-md dc:shadow-lg dc:border border-dc-border dc:py-1 dc:min-w-[120px]",
				style: {
					left: O.x,
					top: O.y
				},
				children: /* @__PURE__ */ m("button", {
					onClick: De,
					className: "dc:w-full dc:px-3 dc:py-2 dc:text-sm text-dc-text-secondary dc:hover:bg-dc-surface-hover dc:text-left",
					children: g("schema.autoLayout")
				})
			})
		]
	}) : /* @__PURE__ */ m("div", {
		className: `dc:flex dc:items-center dc:justify-center dc:h-96 ${e}`,
		children: /* @__PURE__ */ h("div", {
			className: "dc:text-center",
			children: [/* @__PURE__ */ m("div", { className: "dc:animate-spin dc:rounded-full dc:h-8 dc:w-8 dc:border-b-2 border-dc-accent dc:mx-auto dc:mb-2" }), /* @__PURE__ */ m("p", {
				className: "text-dc-text-muted",
				children: g("schema.computingLayout")
			})]
		})
	});
}
//#endregion
export { y as n, w as t };

//# sourceMappingURL=schema-visualization-BPQIlZam.js.map