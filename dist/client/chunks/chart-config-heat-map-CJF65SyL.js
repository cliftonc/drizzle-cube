import { n as e } from "./rolldown-runtime-DArdT4gl.js";
//#region src/client/components/charts/HeatMapChart.config.ts
var t = /* @__PURE__ */ e({ heatmapChartConfig: () => n }), n = {
	dropZones: [
		{
			key: "xAxis",
			label: "chart.configText.columns_x_axis",
			description: "chart.configText.dimension_for_column_categories",
			mandatory: !0,
			maxItems: 1,
			acceptTypes: ["dimension"],
			emptyText: "chart.heatmap.dropZone.xAxis.empty"
		},
		{
			key: "yAxis",
			label: "chart.configText.rows_y_axis",
			description: "chart.configText.dimension_for_row_categories",
			mandatory: !0,
			maxItems: 1,
			acceptTypes: ["dimension"],
			emptyText: "chart.heatmap.dropZone.yAxis.empty"
		},
		{
			key: "valueField",
			label: "chart.configText.value_color_intensity",
			description: "chart.configText.measure_that_determines_cell_color",
			mandatory: !0,
			maxItems: 1,
			acceptTypes: ["measure"],
			emptyText: "chart.heatmap.dropZone.valueField.empty"
		}
	],
	displayOptions: ["showLegend", "showTooltip"],
	displayOptionsConfig: [
		{
			key: "showLabels",
			label: "chart.option.showLabels.label",
			type: "boolean",
			defaultValue: !1,
			description: "chart.option.showLabels.description"
		},
		{
			key: "cellShape",
			label: "chart.option.cellShape.label",
			type: "select",
			defaultValue: "rect",
			options: [{
				value: "rect",
				label: "chart.option.cellShape.rectangle"
			}, {
				value: "circle",
				label: "chart.option.cellShape.circle"
			}]
		},
		{
			key: "xAxisFormat",
			label: "chart.option.xAxisFormat.label",
			type: "axisFormat",
			description: "chart.configText.number_formatting_for_x_axis_labels"
		},
		{
			key: "yAxisFormat",
			label: "chart.option.yAxisFormat.label",
			type: "axisFormat",
			description: "chart.configText.number_formatting_for_y_axis_labels"
		},
		{
			key: "valueFormat",
			label: "chart.option.valueFormat.label",
			type: "axisFormat",
			description: "chart.configText.number_formatting_for_cell_values_and_legend"
		}
	],
	validate: (e) => e.xAxis?.length ? e.yAxis?.length ? e.valueField?.length ? { isValid: !0 } : {
		isValid: !1,
		message: "chart.heatmap.validation.valueRequired"
	} : {
		isValid: !1,
		message: "chart.heatmap.validation.yAxisRequired"
	} : {
		isValid: !1,
		message: "chart.heatmap.validation.xAxisRequired"
	}
};
//#endregion
export { n, t };

//# sourceMappingURL=chart-config-heat-map-CJF65SyL.js.map