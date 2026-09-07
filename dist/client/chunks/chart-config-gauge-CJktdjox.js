import { n as e } from "./rolldown-runtime-DArdT4gl.js";
//#region src/client/components/charts/GaugeChart.config.ts
var t = /* @__PURE__ */ e({ gaugeChartConfig: () => n }), n = {
	clickableElements: {},
	displayOptions: ["hideHeader"],
	dropZones: [{
		key: "yAxis",
		label: "chart.configText.value_measure",
		description: "chart.configText.current_value_to_display_on_the_gauge_e_g_current_equity_margin_used",
		mandatory: !0,
		maxItems: 2,
		acceptTypes: ["measure"],
		emptyText: "chart.gauge.dropZone.yAxis.empty"
	}],
	displayOptionsConfig: [
		{
			key: "minValue",
			label: "chart.option.minValue.label",
			type: "number",
			defaultValue: 0,
			description: "chart.option.minValue.description"
		},
		{
			key: "maxValue",
			label: "chart.option.maxValue.label",
			type: "number",
			description: "chart.option.maxValue.description"
		},
		{
			key: "thresholds",
			label: "chart.configText.threshold_bands",
			type: "thresholdBands",
			description: "chart.gauge.thresholds.description"
		},
		{
			key: "showCenterLabel",
			label: "chart.option.showCentreLabel.label",
			type: "boolean",
			defaultValue: !0,
			description: "chart.option.showCentreLabel.description"
		},
		{
			key: "showPercentage",
			label: "chart.option.showPercentage.label",
			type: "boolean",
			defaultValue: !1,
			description: "chart.option.showPercentage.description"
		},
		{
			key: "leftYAxisFormat",
			label: "chart.option.valueFormat.label",
			type: "axisFormat",
			description: "chart.configText.number_formatting_for_the_displayed_value_and_axis_labels"
		}
	]
};
//#endregion
export { n, t };

//# sourceMappingURL=chart-config-gauge-CJktdjox.js.map