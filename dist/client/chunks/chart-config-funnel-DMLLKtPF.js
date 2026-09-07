import { n as e } from "./rolldown-runtime-DArdT4gl.js";
//#region src/client/components/charts/FunnelChart.config.ts
var t = /* @__PURE__ */ e({ funnelChartConfig: () => n }), n = {
	dropZones: [{
		key: "xAxis",
		label: "chart.configText.step_name",
		description: "chart.configText.step_names_auto_populated_from_funnel_steps",
		mandatory: !1,
		maxItems: 1,
		acceptTypes: ["dimension"],
		emptyText: "chart.funnel.dropZone.xAxis.empty"
	}, {
		key: "yAxis",
		label: "chart.configText.step_count",
		description: "chart.configText.count_at_each_step_auto_calculated",
		mandatory: !1,
		maxItems: 1,
		acceptTypes: ["measure"],
		emptyText: "chart.funnel.dropZone.yAxis.empty"
	}],
	displayOptions: ["hideHeader"],
	displayOptionsConfig: [
		{
			key: "funnelStyle",
			label: "chart.option.funnelStyle.label",
			type: "buttonGroup",
			defaultValue: "bars",
			options: [{
				value: "bars",
				label: "chart.option.funnelStyle.bars"
			}, {
				value: "funnel",
				label: "chart.option.funnelStyle.funnel"
			}],
			description: "chart.configText.visualization_style"
		},
		{
			key: "funnelOrientation",
			label: "chart.option.funnelOrientation.label",
			type: "buttonGroup",
			defaultValue: "horizontal",
			options: [{
				value: "horizontal",
				label: "chart.option.funnelOrientation.horizontal"
			}, {
				value: "vertical",
				label: "chart.option.funnelOrientation.vertical"
			}]
		},
		{
			key: "hideSummaryFooter",
			label: "chart.option.hideSummaryFooter.label",
			type: "boolean",
			defaultValue: !1,
			description: "chart.option.hideSummaryFooter.description"
		},
		{
			key: "showFunnelConversion",
			label: "chart.option.showConversion.label",
			type: "boolean",
			defaultValue: !0,
			description: "chart.option.showConversion.description"
		},
		{
			key: "showFunnelAvgTime",
			label: "chart.option.showAvgTime.label",
			type: "boolean",
			defaultValue: !1,
			description: "chart.option.showAvgTime.description"
		},
		{
			key: "showFunnelMedianTime",
			label: "chart.option.showMedianTime.label",
			type: "boolean",
			defaultValue: !1,
			description: "chart.option.showMedianTime.description"
		},
		{
			key: "showFunnelP90Time",
			label: "chart.option.showP90Time.label",
			type: "boolean",
			defaultValue: !1,
			description: "chart.option.showP90Time.description"
		}
	]
};
//#endregion
export { n, t };

//# sourceMappingURL=chart-config-funnel-DMLLKtPF.js.map