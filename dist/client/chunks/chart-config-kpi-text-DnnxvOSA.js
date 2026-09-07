import { n as e } from "./rolldown-runtime-DArdT4gl.js";
//#region src/client/components/charts/KpiText.config.ts
var t = /* @__PURE__ */ e({ kpiTextConfig: () => n }), n = {
	dropZones: [{
		key: "yAxis",
		label: "chart.configText.value",
		description: "chart.configText.measure_to_display_in_the_kpi_text_template",
		mandatory: !0,
		maxItems: 1,
		acceptTypes: ["measure"],
		emptyText: "chart.kpiText.dropZone.yAxis.empty"
	}],
	displayOptionsConfig: [
		{
			key: "template",
			label: "chart.configText.text_template",
			type: "string",
			placeholder: "e.g., Total Revenue: ${value}",
			description: "chart.configText.template_for_displaying_the_text_use_value_to_insert_the_measure_value"
		},
		{
			key: "decimals",
			label: "chart.option.decimals.label",
			type: "number",
			defaultValue: 0,
			min: 0,
			max: 10,
			step: 1,
			description: "chart.configText.number_of_decimal_places_to_display_for_numeric_values"
		},
		{
			key: "valueColorIndex",
			label: "chart.configText.value_color",
			type: "paletteColor",
			defaultValue: 0,
			description: "chart.configText.color_from_the_dashboard_palette_for_the_kpi_value_text"
		}
	],
	displayOptions: ["hideHeader"]
};
//#endregion
export { n, t };

//# sourceMappingURL=chart-config-kpi-text-DnnxvOSA.js.map