import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { i as t } from "./chart-config-area-DsrZCIwF.js";
//#region src/client/components/charts/KpiDelta.config.ts
var n = /* @__PURE__ */ e({ kpiDeltaConfig: () => r }), r = {
	dropZones: [{
		key: "yAxis",
		label: "chart.configText.value",
		description: "chart.configText.measure_to_track_changes_for",
		mandatory: !0,
		maxItems: 1,
		acceptTypes: ["measure"],
		emptyText: "chart.kpiDelta.dropZone.yAxis.empty"
	}, {
		key: "xAxis",
		label: "chart.configText.dimension_optional",
		description: "chart.configText.dimension_for_ordering_data_typically_time",
		mandatory: !1,
		maxItems: 1,
		acceptTypes: ["dimension", "timeDimension"],
		emptyText: "chart.kpiDelta.dropZone.xAxis.empty"
	}],
	displayOptionsConfig: [
		t,
		{
			key: "showBaseline",
			label: "chart.option.showBaseline.label",
			type: "boolean",
			defaultValue: !1,
			description: "chart.option.showBaseline.description"
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
			defaultValue: 1,
			min: 0,
			max: 10,
			step: 1,
			description: "chart.option.decimals.description"
		},
		{
			key: "positiveColorIndex",
			label: "chart.configText.positive_change_color",
			type: "paletteColor",
			defaultValue: 2,
			description: "chart.configText.color_for_positive_changes_increases"
		},
		{
			key: "negativeColorIndex",
			label: "chart.configText.negative_change_color",
			type: "paletteColor",
			defaultValue: 3,
			description: "chart.configText.color_for_negative_changes_decreases"
		},
		{
			key: "showHistogram",
			label: "chart.option.showHistogram.label",
			type: "boolean",
			defaultValue: !0,
			description: "chart.option.showHistogram.description"
		},
		{
			key: "useLastCompletePeriod",
			label: "chart.option.useLastCompletePeriod.label",
			type: "boolean",
			defaultValue: !0,
			description: "chart.configText.exclude_current_incomplete_period_from_delta_calculation_e_g_partial_wee"
		},
		{
			key: "skipLastPeriod",
			label: "chart.option.skipLastPeriod.label",
			type: "boolean",
			defaultValue: !1,
			description: "chart.option.skipLastPeriod.description"
		}
	],
	displayOptions: ["hideHeader"],
	validate: (e) => !e.yAxis || Array.isArray(e.yAxis) && e.yAxis.length === 0 ? {
		isValid: !1,
		message: "chart.kpiDelta.validation.measureRequired"
	} : { isValid: !0 }
};
//#endregion
export { r as n, n as t };

//# sourceMappingURL=chart-config-kpi-delta-Cl7k6jTj.js.map