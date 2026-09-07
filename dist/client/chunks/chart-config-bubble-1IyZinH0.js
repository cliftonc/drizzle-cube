import { n as e } from "./rolldown-runtime-DArdT4gl.js";
//#region src/client/components/charts/BubbleChart.config.ts
var t = /* @__PURE__ */ e({ bubbleChartConfig: () => n }), n = {
	dropZones: [
		{
			key: "xAxis",
			label: "chart.runtime.axisFormat.xAxis",
			description: "chart.configText.horizontal_axis_position",
			mandatory: !0,
			maxItems: 1,
			acceptTypes: [
				"dimension",
				"timeDimension",
				"measure"
			],
			emptyText: "chart.bubble.dropZone.xAxis.empty"
		},
		{
			key: "yAxis",
			label: "chart.configText.y_axis",
			description: "chart.configText.vertical_axis_position",
			mandatory: !0,
			maxItems: 1,
			acceptTypes: ["measure"],
			emptyText: "chart.bubble.dropZone.yAxis.empty"
		},
		{
			key: "sizeField",
			label: "chart.configText.bubble_radius",
			description: "chart.configText.size_of_bubbles_based_on_this_measure",
			mandatory: !0,
			maxItems: 1,
			acceptTypes: ["measure"],
			emptyText: "chart.bubble.dropZone.sizeField.empty"
		},
		{
			key: "series",
			label: "chart.configText.bubble_labels",
			description: "chart.configText.field_to_use_for_bubble_labels_and_identification",
			mandatory: !0,
			maxItems: 1,
			acceptTypes: ["dimension"],
			emptyText: "chart.bubble.dropZone.series.empty"
		},
		{
			key: "colorField",
			label: "chart.configText.bubble_colour",
			description: "chart.configText.color_bubbles_by_this_field_optional",
			mandatory: !1,
			maxItems: 1,
			acceptTypes: ["dimension", "measure"],
			emptyText: "chart.bubble.dropZone.colorField.empty"
		}
	],
	displayOptions: [
		"showLegend",
		"showGrid",
		"showTooltip",
		"minBubbleSize",
		"maxBubbleSize",
		"bubbleOpacity",
		"hideHeader"
	],
	displayOptionsConfig: [{
		key: "xAxisFormat",
		label: "chart.option.xAxisFormat.label",
		type: "axisFormat",
		description: "chart.option.xAxisFormat.description"
	}, {
		key: "leftYAxisFormat",
		label: "chart.option.yAxisFormat.label",
		type: "axisFormat",
		description: "chart.configText.number_formatting_for_y_axis_and_values"
	}]
};
//#endregion
export { n, t };

//# sourceMappingURL=chart-config-bubble-1IyZinH0.js.map