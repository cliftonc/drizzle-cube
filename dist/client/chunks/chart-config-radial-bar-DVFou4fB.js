import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { p as t } from "./chart-config-area-DsrZCIwF.js";
//#region src/client/components/charts/RadialBarChart.config.ts
var n = /* @__PURE__ */ e({ radialBarChartConfig: () => r }), r = {
	dropZones: [{
		key: "xAxis",
		label: "chart.configText.categories",
		description: "chart.configText.dimensions_for_radial_segments",
		mandatory: !0,
		acceptTypes: ["dimension"],
		emptyText: "chart.radialBar.dropZone.xAxis.empty"
	}, {
		key: "yAxis",
		label: "chart.configText.values",
		description: "chart.configText.measures_for_radial_bar_lengths",
		mandatory: !0,
		maxItems: 1,
		acceptTypes: ["measure"],
		emptyText: "chart.radialBar.dropZone.yAxis.empty"
	}],
	displayOptions: [
		"showLegend",
		"showTooltip",
		"hideHeader"
	],
	displayOptionsConfig: [t()]
};
//#endregion
export { r as n, n as t };

//# sourceMappingURL=chart-config-radial-bar-DVFou4fB.js.map