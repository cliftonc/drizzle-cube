import { n as e } from "./rolldown-runtime-DArdT4gl.js";
//#region src/client/components/charts/SunburstChart.config.ts
var t = /* @__PURE__ */ e({ sunburstChartConfig: () => n }), n = {
	dropZones: [{
		key: "xAxis",
		label: "chart.configText.event_type",
		description: "chart.configText.event_dimension_that_categorizes_flow_nodes",
		mandatory: !1,
		maxItems: 1,
		acceptTypes: ["dimension"],
		emptyText: "chart.sunburst.dropZone.xAxis.empty"
	}, {
		key: "yAxis",
		label: "chart.configText.flow_count",
		description: "chart.configText.count_of_entities_following_each_path",
		mandatory: !1,
		maxItems: 1,
		acceptTypes: ["measure"],
		emptyText: "chart.sunburst.dropZone.yAxis.empty"
	}],
	displayOptions: ["hideHeader"],
	displayOptionsConfig: [{
		key: "innerRadius",
		label: "chart.option.innerRadius.label",
		type: "number",
		defaultValue: 40,
		min: 0,
		max: 100,
		step: 10,
		description: "chart.configText.size_of_the_center_hole_0_for_full_circle"
	}, {
		key: "hideSummaryFooter",
		label: "chart.option.hideSummaryFooter.label",
		type: "boolean",
		defaultValue: !0,
		description: "chart.configText.hide_the_statistics_footer_below_the_chart"
	}]
};
//#endregion
export { n, t };

//# sourceMappingURL=chart-config-sunburst-B4NUYHMH.js.map