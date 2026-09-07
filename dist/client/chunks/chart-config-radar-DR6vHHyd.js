import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { p as t } from "./chart-config-area-DsrZCIwF.js";
//#region src/client/components/charts/RadarChart.config.ts
var n = /* @__PURE__ */ e({ radarChartConfig: () => r }), r = {
	dropZones: [
		{
			key: "xAxis",
			label: "chart.configText.axes_categories",
			description: "chart.configText.dimensions_for_radar_axes",
			mandatory: !0,
			acceptTypes: ["dimension"],
			emptyText: "chart.radar.dropZone.xAxis.empty"
		},
		{
			key: "yAxis",
			label: "chart.configText.values",
			description: "chart.configText.measures_for_radar_values",
			mandatory: !0,
			acceptTypes: ["measure"],
			emptyText: "chart.radar.dropZone.yAxis.empty"
		},
		{
			key: "series",
			label: "chart.configText.series_multiple_shapes",
			description: "chart.configText.dimensions_to_create_multiple_radar_shapes",
			mandatory: !1,
			acceptTypes: ["dimension"],
			emptyText: "chart.radar.dropZone.series.empty"
		}
	],
	displayOptions: [
		"showLegend",
		"showGrid",
		"showTooltip",
		"hideHeader"
	],
	displayOptionsConfig: [t()]
};
//#endregion
export { r as n, n as t };

//# sourceMappingURL=chart-config-radar-DR6vHHyd.js.map