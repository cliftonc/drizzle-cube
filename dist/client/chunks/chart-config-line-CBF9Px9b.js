import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { a as t, c as n, f as r, l as i, r as a, u as o } from "./chart-config-area-DsrZCIwF.js";
//#region src/client/components/charts/LineChart.config.ts
var s = /* @__PURE__ */ e({ lineChartConfig: () => c }), c = {
	clickableElements: { point: !0 },
	dropZones: [
		{
			key: "xAxis",
			label: "chart.configText.x_axis_time_categories",
			description: "chart.configText.time_dimensions_or_dimensions_for_x_axis",
			mandatory: !0,
			acceptTypes: ["dimension", "timeDimension"],
			emptyText: "chart.line.dropZone.xAxis.empty"
		},
		{
			key: "yAxis",
			label: "chart.dropZone.yAxis.label",
			description: "chart.configText.measures_for_line_values",
			mandatory: !0,
			acceptTypes: ["measure"],
			emptyText: "chart.line.dropZone.yAxis.empty",
			enableDualAxis: !0
		},
		{
			key: "series",
			label: "chart.configText.series_multiple_lines",
			description: "chart.configText.dimensions_to_create_separate_lines",
			mandatory: !1,
			acceptTypes: ["dimension"],
			emptyText: "chart.line.dropZone.series.empty"
		}
	],
	displayOptions: [
		"showLegend",
		"showGrid",
		"showTooltip",
		"showAllXLabels",
		"hideHeader"
	],
	displayOptionsConfig: [
		o,
		i(),
		a,
		r,
		{
			key: "priorPeriodStyle",
			label: "chart.option.priorPeriodStyle.label",
			type: "select",
			defaultValue: "dashed",
			options: [
				{
					value: "dashed",
					label: "chart.option.priorPeriodStyle.dashed"
				},
				{
					value: "dotted",
					label: "chart.option.priorPeriodStyle.dotted"
				},
				{
					value: "solid",
					label: "chart.option.priorPeriodStyle.solid"
				}
			],
			description: "chart.option.priorPeriodStyle.description"
		},
		{
			key: "priorPeriodOpacity",
			label: "chart.option.priorPeriodOpacity.label",
			type: "number",
			defaultValue: .5,
			min: .1,
			max: 1,
			step: .1,
			description: "chart.option.priorPeriodOpacity.description"
		},
		t,
		n
	]
};
//#endregion
export { c as n, s as t };

//# sourceMappingURL=chart-config-line-CBF9Px9b.js.map