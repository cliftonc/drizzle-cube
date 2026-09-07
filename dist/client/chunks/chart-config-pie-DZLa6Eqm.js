import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { p as t } from "./chart-config-area-DsrZCIwF.js";
//#region src/client/components/charts/PieChart.config.ts
var n = /* @__PURE__ */ e({ pieChartConfig: () => r }), r = {
	clickableElements: { slice: !0 },
	dropZones: [{
		key: "xAxis",
		label: "chart.configText.categories",
		description: "chart.configText.dimension_for_pie_slices",
		mandatory: !0,
		maxItems: 1,
		acceptTypes: ["dimension"],
		emptyText: "chart.pie.dropZone.xAxis.empty"
	}, {
		key: "yAxis",
		label: "chart.configText.values",
		description: "chart.configText.measure_for_slice_sizes",
		mandatory: !0,
		maxItems: 1,
		acceptTypes: ["measure"],
		emptyText: "chart.pie.dropZone.yAxis.empty"
	}],
	displayOptions: [
		"showLegend",
		"showTooltip",
		"hideHeader"
	],
	displayOptionsConfig: [{
		key: "innerRadius",
		label: "chart.option.innerRadius.label",
		type: "select",
		description: "chart.configText.hollow_center_size_0_percent_solid_pie_higher_donut_style",
		defaultValue: "0%",
		options: [
			{
				value: "0%",
				label: "chart.configText.none_pie"
			},
			{
				value: "20%",
				label: "chart.configText.20_percent"
			},
			{
				value: "40%",
				label: "chart.configText.40_percent"
			},
			{
				value: "60%",
				label: "chart.configText.60_percent"
			},
			{
				value: "80%",
				label: "chart.configText.80_percent"
			}
		]
	}, t()]
};
//#endregion
export { r as n, n as t };

//# sourceMappingURL=chart-config-pie-DZLa6Eqm.js.map