import { F as e, P as t, w as n } from "./chart-activity-grid-D6X0iOUw.js";
import { useMemo as r } from "react";
import { jsx as i, jsxs as a } from "react/jsx-runtime";
//#region src/client/components/AnalysisBuilder/SectionHeading.tsx
function o({ children: e, className: t = "" }) {
	return /* @__PURE__ */ i("h3", {
		className: `dc:text-sm dc:font-semibold text-dc-primary dc:uppercase dc:tracking-wide ${t}`,
		children: e
	});
}
//#endregion
//#region src/client/components/charts/AxisFormatControls.tsx
function s() {
	let e = typeof navigator < "u" ? navigator.language : "en-US";
	return new Intl.NumberFormat(e, {
		style: "currency",
		currency: t(e),
		currencyDisplay: "narrowSymbol"
	}).format(0).replace(/[\d.,\s]/g, "").trim() || "$";
}
function c({ value: c, onChange: l, axisLabel: u, previewValue: d = 125e4 }) {
	let { t: f } = e(), p = r(() => c || {}, [c]), m = r(() => s(), []), h = r(() => n(d, p), [d, p]), g = (e) => {
		l({
			...p,
			...e
		});
	}, _ = [
		{
			value: "currency",
			label: m
		},
		{
			value: "percent",
			label: "%"
		},
		{
			value: "number",
			label: "#"
		},
		{
			value: "custom",
			label: f("chart.runtime.axisFormat.custom")
		}
	];
	return /* @__PURE__ */ a("div", {
		className: "dc:space-y-3 dc:pb-4",
		children: [
			/* @__PURE__ */ i(o, { children: u }),
			/* @__PURE__ */ a("div", {
				className: "dc:space-y-1",
				children: [/* @__PURE__ */ i("label", {
					className: "dc:text-xs text-dc-text-secondary",
					children: f("chart.runtime.axisFormat.label")
				}), /* @__PURE__ */ i("input", {
					type: "text",
					value: p.label || "",
					onChange: (e) => g({ label: e.target.value || void 0 }),
					placeholder: f("chart.runtime.axisFormat.autoLabel"),
					className: "dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
				})]
			}),
			/* @__PURE__ */ a("div", {
				className: "dc:space-y-1",
				children: [/* @__PURE__ */ i("label", {
					className: "dc:text-xs text-dc-text-secondary",
					children: f("chart.runtime.axisFormat.unit")
				}), /* @__PURE__ */ i("div", {
					className: "dc:flex dc:border border-dc-border dc:rounded-sm dc:overflow-hidden",
					children: _.map((e) => /* @__PURE__ */ i("button", {
						type: "button",
						onClick: () => g({ unit: e.value }),
						className: `dc:flex-1 dc:px-2 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors ${p.unit === e.value ? "bg-dc-primary text-white" : "bg-dc-surface text-dc-text hover:bg-dc-border"}`,
						children: e.label
					}, e.value))
				})]
			}),
			p.unit === "currency" && /* @__PURE__ */ a("div", {
				className: "dc:space-y-1",
				children: [
					/* @__PURE__ */ i("label", {
						className: "dc:text-xs text-dc-text-secondary",
						children: f("chart.runtime.axisFormat.currencyCode")
					}),
					/* @__PURE__ */ i("input", {
						type: "text",
						value: p.currencyCode || "",
						onChange: (e) => g({ currencyCode: e.target.value.trim().toUpperCase() || void 0 }),
						placeholder: t(typeof navigator < "u" ? navigator.language : "en-US"),
						maxLength: 3,
						className: "dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
					}),
					/* @__PURE__ */ i("p", {
						className: "dc:text-xs text-dc-text-muted",
						children: f("chart.runtime.axisFormat.currencyCodeHint")
					})
				]
			}),
			p.unit === "custom" && /* @__PURE__ */ a("div", {
				className: "dc:flex dc:gap-2",
				children: [/* @__PURE__ */ a("div", {
					className: "dc:flex-1 dc:space-y-1",
					children: [/* @__PURE__ */ i("label", {
						className: "dc:text-xs text-dc-text-secondary",
						children: f("chart.runtime.axisFormat.prefix")
					}), /* @__PURE__ */ i("input", {
						type: "text",
						value: p.customPrefix || "",
						onChange: (e) => g({ customPrefix: e.target.value || void 0 }),
						placeholder: f("chart.runtime.axisFormat.prefixExample"),
						className: "dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
					})]
				}), /* @__PURE__ */ a("div", {
					className: "dc:flex-1 dc:space-y-1",
					children: [/* @__PURE__ */ i("label", {
						className: "dc:text-xs text-dc-text-secondary",
						children: f("chart.runtime.axisFormat.suffix")
					}), /* @__PURE__ */ i("input", {
						type: "text",
						value: p.customSuffix || "",
						onChange: (e) => g({ customSuffix: e.target.value || void 0 }),
						placeholder: f("chart.runtime.axisFormat.suffixExample"),
						className: "dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
					})]
				})]
			}),
			/* @__PURE__ */ a("div", {
				className: "dc:space-y-1",
				children: [/* @__PURE__ */ i("label", {
					className: "dc:text-xs text-dc-text-secondary",
					children: f("chart.runtime.axisFormat.abbreviation")
				}), /* @__PURE__ */ a("div", {
					className: "dc:flex dc:border border-dc-border dc:rounded-sm dc:overflow-hidden",
					children: [/* @__PURE__ */ i("button", {
						type: "button",
						onClick: () => g({ abbreviate: !0 }),
						className: `dc:flex-1 dc:px-3 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors ${p.abbreviate === !1 ? "bg-dc-surface text-dc-text hover:bg-dc-border" : "bg-dc-primary text-white"}`,
						children: f("chart.runtime.axisFormat.yes")
					}), /* @__PURE__ */ i("button", {
						type: "button",
						onClick: () => g({ abbreviate: !1 }),
						className: `dc:flex-1 dc:px-3 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors ${p.abbreviate === !1 ? "bg-dc-primary text-white" : "bg-dc-surface text-dc-text hover:bg-dc-border"}`,
						children: f("chart.runtime.axisFormat.no")
					})]
				})]
			}),
			/* @__PURE__ */ a("div", {
				className: "dc:space-y-1",
				children: [/* @__PURE__ */ i("label", {
					className: "dc:text-xs text-dc-text-secondary",
					children: f("chart.runtime.axisFormat.decimals")
				}), /* @__PURE__ */ a("div", {
					className: "dc:flex dc:gap-2",
					children: [/* @__PURE__ */ i("button", {
						type: "button",
						onClick: () => {
							let e = p.decimals ?? 2;
							e > 0 && g({ decimals: e - 1 });
						},
						disabled: (p.decimals ?? 2) <= 0,
						className: "dc:flex-1 dc:px-3 dc:py-2 dc:text-sm dc:border border-dc-border dc:rounded-sm bg-dc-surface text-dc-text hover:bg-dc-border dc:disabled:opacity-40 dc:disabled:cursor-not-allowed dc:transition-colors",
						children: "← .0"
					}), /* @__PURE__ */ i("button", {
						type: "button",
						onClick: () => {
							let e = p.decimals ?? 2;
							e < 4 && g({ decimals: e + 1 });
						},
						disabled: (p.decimals ?? 2) >= 4,
						className: "dc:flex-1 dc:px-3 dc:py-2 dc:text-sm dc:border border-dc-border dc:rounded-sm bg-dc-surface text-dc-text hover:bg-dc-border dc:disabled:opacity-40 dc:disabled:cursor-not-allowed dc:transition-colors",
						children: ".00 →"
					})]
				})]
			}),
			/* @__PURE__ */ a("div", {
				className: "dc:space-y-1",
				children: [/* @__PURE__ */ i("label", {
					className: "dc:text-xs text-dc-text-secondary",
					children: f("chart.runtime.axisFormat.preview")
				}), /* @__PURE__ */ i("div", {
					className: "dc:text-sm dc:font-mono text-dc-text",
					children: h
				})]
			})
		]
	});
}
//#endregion
export { o as n, c as t };

//# sourceMappingURL=charts-core-pzDVGMWV.js.map