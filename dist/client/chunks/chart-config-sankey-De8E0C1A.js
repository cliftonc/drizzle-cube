import { n as e } from "./rolldown-runtime-DArdT4gl.js";
//#region src/client/components/charts/SankeyChart.config.ts
var t = /* @__PURE__ */ e({ sankeyChartConfig: () => n }), n = {
	dropZones: [{
		key: "xAxis",
		label: "chart.configText.event_type",
		description: "chart.configText.event_dimension_that_categorizes_flow_nodes",
		mandatory: !1,
		maxItems: 1,
		acceptTypes: ["dimension"],
		emptyText: "chart.sankey.dropZone.xAxis.empty"
	}, {
		key: "yAxis",
		label: "chart.configText.flow_count",
		description: "chart.configText.count_of_entities_following_each_path",
		mandatory: !1,
		maxItems: 1,
		acceptTypes: ["measure"],
		emptyText: "chart.sankey.dropZone.yAxis.empty"
	}],
	displayOptions: ["hideHeader"],
	displayOptionsConfig: [
		{
			key: "linkOpacity",
			label: "chart.option.linkOpacity.label",
			type: "buttonGroup",
			defaultValue: "0.5",
			options: [
				{
					value: "0.3",
					label: "chart.option.linkOpacity.light"
				},
				{
					value: "0.5",
					label: "chart.option.fontSize.medium"
				},
				{
					value: "0.7",
					label: "chart.option.linkOpacity.dark"
				}
			],
			description: "chart.configText.opacity_of_flow_links"
		},
		{
			key: "showNodeLabels",
			label: "chart.option.showNodeLabels.label",
			type: "boolean",
			defaultValue: !0,
			description: "chart.option.showNodeLabels.description"
		},
		{
			key: "hideSummaryFooter",
			label: "chart.option.hideSummaryFooter.label",
			type: "boolean",
			defaultValue: !0,
			description: "chart.configText.hide_the_statistics_footer_below_the_chart"
		}
	]
};
//#endregion
export { n, t };

//# sourceMappingURL=chart-config-sankey-De8E0C1A.js.map