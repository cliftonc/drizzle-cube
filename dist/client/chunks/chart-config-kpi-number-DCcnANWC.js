import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { i as t } from "./chart-config-area-DsrZCIwF.js";
//#region src/client/components/charts/KpiNumber.config.ts
var n = /* @__PURE__ */ e({ kpiNumberConfig: () => r }), r = {
	dropZones: [{
		key: "yAxis",
		label: "chart.configText.value",
		description: "chart.configText.measure_to_display_as_kpi_number",
		mandatory: !0,
		maxItems: 1,
		acceptTypes: ["measure"],
		emptyText: "chart.kpiNumber.dropZone.yAxis.empty"
	}],
	displayOptionsConfig: [
		t,
		{
			key: "target",
			label: "chart.runtime.tooltip.targetValue",
			type: "string",
			placeholder: "e.g., 100",
			description: "chart.configText.target_value_to_compare_against_first_value_used_if_multiple_provided"
		},
		{
			key: "prefix",
			label: "chart.option.prefix.label",
			type: "string",
			placeholder: "e.g., $, €, #",
			description: "chart.option.prefix.description"
		},
		{
			key: "suffix",
			label: "chart.option.suffix.label",
			type: "string",
			placeholder: "e.g., %, units, items",
			description: "chart.option.suffix.description"
		},
		{
			key: "decimals",
			label: "chart.option.decimals.label",
			type: "number",
			defaultValue: 0,
			min: 0,
			max: 10,
			step: 1,
			description: "chart.option.decimals.description"
		},
		{
			key: "valueColorIndex",
			label: "chart.configText.value_color",
			type: "paletteColor",
			defaultValue: 0,
			description: "chart.configText.color_from_the_dashboard_palette_for_the_kpi_value_text"
		},
		{
			key: "useLastCompletePeriod",
			label: "chart.option.useLastCompletePeriod.label",
			type: "boolean",
			defaultValue: !0,
			description: "chart.configText.exclude_current_incomplete_period_from_aggregation_e_g_partial_week_mont"
		},
		{
			key: "skipLastPeriod",
			label: "chart.option.skipLastPeriod.label",
			type: "boolean",
			defaultValue: !1,
			description: "chart.option.skipLastPeriod.description"
		}
	],
	displayOptions: ["hideHeader"]
};
//#endregion
export { r as n, n as t };

//# sourceMappingURL=chart-config-kpi-number-DCcnANWC.js.map