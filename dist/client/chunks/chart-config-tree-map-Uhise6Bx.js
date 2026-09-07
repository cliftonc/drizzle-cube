import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { p as t } from "./chart-config-area-DsrZCIwF.js";
//#region src/client/components/charts/TreeMapChart.config.ts
var n = /* @__PURE__ */ e({ treemapChartConfig: () => r }), r = {
	dropZones: [
		{
			key: "xAxis",
			label: "chart.configText.categories",
			description: "chart.configText.dimensions_for_treemap_rectangles",
			mandatory: !0,
			acceptTypes: ["dimension"],
			emptyText: "chart.treemap.dropZone.xAxis.empty"
		},
		{
			key: "yAxis",
			label: "chart.configText.size",
			description: "chart.configText.measure_for_rectangle_sizes",
			mandatory: !0,
			maxItems: 1,
			acceptTypes: ["measure"],
			emptyText: "chart.treemap.dropZone.yAxis.empty"
		},
		{
			key: "series",
			label: "chart.configText.color_groups",
			description: "chart.configText.dimension_to_color_rectangles_by_category",
			mandatory: !1,
			maxItems: 1,
			acceptTypes: ["dimension"],
			emptyText: "chart.treemap.dropZone.series.empty"
		}
	],
	displayOptions: [
		"showLegend",
		"showTooltip",
		"hideHeader"
	],
	displayOptionsConfig: [t("chart.configText.number_formatting_for_size_values")],
	clickableElements: { cell: !0 }
};
//#endregion
export { r as n, n as t };

//# sourceMappingURL=chart-config-tree-map-Uhise6Bx.js.map