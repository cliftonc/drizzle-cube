import { n as e } from "./rolldown-runtime-DArdT4gl.js";
//#region src/client/components/charts/WaterfallChart.config.ts
var t = /* @__PURE__ */ e({ waterfallChartConfig: () => n }), n = {
	clickableElements: { bar: !0 },
	displayOptions: ["showTooltip", "hideHeader"],
	dropZones: [{
		key: "xAxis",
		label: "chart.dropZone.xAxis.label",
		description: "chart.configText.dimension_labels_for_each_bar_segment_e_g_symbol_transaction_type",
		mandatory: !0,
		maxItems: 1,
		acceptTypes: ["dimension", "timeDimension"],
		emptyText: "chart.waterfall.dropZone.xAxis.empty"
	}, {
		key: "yAxis",
		label: "chart.configText.y_axis_value",
		description: "chart.configText.single_measure_whose_values_are_summed_cumulatively",
		mandatory: !0,
		maxItems: 1,
		acceptTypes: ["measure"],
		emptyText: "chart.waterfall.dropZone.yAxis.empty"
	}],
	displayOptionsConfig: [
		{
			key: "showTotal",
			label: "chart.option.showTotal.label",
			type: "boolean",
			defaultValue: !0,
			description: "chart.option.showTotal.description"
		},
		{
			key: "showConnectorLine",
			label: "chart.option.showConnectorLine.label",
			type: "boolean",
			defaultValue: !0,
			description: "chart.option.showConnectorLine.description"
		},
		{
			key: "showDataLabels",
			label: "chart.option.showDataLabels.label",
			type: "boolean",
			defaultValue: !1,
			description: "chart.configText.display_the_value_above_each_bar_segment"
		},
		{
			key: "leftYAxisFormat",
			label: "chart.option.yAxisFormat.label",
			type: "axisFormat",
			description: "chart.configText.number_formatting_for_the_y_axis"
		}
	]
};
//#endregion
export { n, t };

//# sourceMappingURL=chart-config-waterfall-DlQb_PLh.js.map