import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { a as t, c as n, d as r, f as i } from "./chart-config-area-DsrZCIwF.js";
//#region src/client/components/charts/BarChart.config.ts
var a = /* @__PURE__ */ e({ barChartConfig: () => o }), o = {
	clickableElements: { bar: !0 },
	dropZones: [
		{
			key: "xAxis",
			label: "chart.dropZone.xAxis.label",
			description: "chart.dropZone.xAxis.description",
			mandatory: !1,
			acceptTypes: ["dimension", "timeDimension"],
			emptyText: "chart.bar.dropZone.xAxis.empty"
		},
		{
			key: "yAxis",
			label: "chart.dropZone.yAxis.label",
			description: "chart.configText.measures_for_bar_heights",
			mandatory: !0,
			acceptTypes: ["measure"],
			emptyText: "chart.bar.dropZone.yAxis.empty",
			enableDualAxis: !0
		},
		{
			key: "series",
			label: "chart.dropZone.series.label",
			description: "chart.dropZone.series.description",
			mandatory: !1,
			acceptTypes: ["dimension"],
			emptyText: "chart.bar.dropZone.series.empty"
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
		r("chart.configText.how_to_stack_multiple_bar_series"),
		i,
		t,
		n
	]
};
//#endregion
export { o as n, a as t };

//# sourceMappingURL=chart-config-bar-BixSs43E.js.map