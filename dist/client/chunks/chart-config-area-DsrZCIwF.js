import { n as e } from "./rolldown-runtime-DArdT4gl.js";
//#region src/client/charts/chartConfigHelpers.ts
function t({ measureCount: e, dimensionCount: t }) {
	return e < 1 ? {
		available: !1,
		reason: "chart.availability.requiresMeasure"
	} : t < 1 ? {
		available: !1,
		reason: "chart.availability.requiresDimension"
	} : { available: !0 };
}
function n({ measureCount: e }) {
	return e < 1 ? {
		available: !1,
		reason: "chart.availability.requiresMeasure"
	} : { available: !0 };
}
var r = {
	key: "target",
	label: "chart.option.target.label",
	type: "string",
	placeholder: "e.g., 100 or 50,75 for spread",
	description: "chart.option.target.description"
}, i = {
	key: "connectNulls",
	label: "chart.option.connectNulls.label",
	type: "boolean",
	defaultValue: !1,
	description: "chart.option.connectNulls.description"
}, a = {
	key: "leftYAxisFormat",
	label: "chart.option.leftYAxisFormat.label",
	type: "axisFormat",
	description: "chart.option.leftYAxisFormat.description"
}, o = {
	key: "rightYAxisFormat",
	label: "chart.option.rightYAxisFormat.label",
	type: "axisFormat",
	description: "chart.option.rightYAxisFormat.description"
};
function s(e = "chart.option.valueFormat.description") {
	return {
		key: "leftYAxisFormat",
		label: "chart.option.valueFormat.label",
		type: "axisFormat",
		description: e
	};
}
function c(e) {
	return {
		key: "stackType",
		label: "chart.option.stacking.label",
		type: "select",
		defaultValue: "none",
		options: [
			{
				value: "none",
				label: "chart.option.accentBorder.none"
			},
			{
				value: "normal",
				label: "chart.option.stacking.stacked"
			},
			{
				value: "percent",
				label: "chart.option.stacking.percent"
			}
		],
		description: e
	};
}
var l = {
	key: "layout",
	label: "chart.option.kpiLayout.label",
	type: "buttonGroup",
	defaultValue: "auto",
	options: [{
		value: "auto",
		label: "chart.option.kpiLayout.auto"
	}, {
		value: "compact",
		label: "chart.option.kpiLayout.compact"
	}],
	description: "chart.option.kpiLayout.description"
}, u = {
	key: "showSummary",
	label: "chart.option.showSummary.label",
	type: "boolean",
	defaultValue: !1,
	description: "chart.option.showSummary.description"
};
function d(e = !0) {
	return {
		key: "showPoints",
		label: "chart.option.showPoints.label",
		type: "boolean",
		defaultValue: e,
		description: "chart.option.showPoints.description"
	};
}
//#endregion
//#region src/client/components/charts/AreaChart.config.ts
var f = /* @__PURE__ */ e({ areaChartConfig: () => p }), p = {
	dropZones: [
		{
			key: "xAxis",
			label: "chart.configText.x_axis_time_categories",
			description: "chart.configText.time_dimensions_or_dimensions_for_x_axis",
			mandatory: !0,
			acceptTypes: ["dimension", "timeDimension"],
			emptyText: "chart.area.dropZone.xAxis.empty"
		},
		{
			key: "yAxis",
			label: "chart.dropZone.yAxis.label",
			description: "chart.configText.measures_for_area_values",
			mandatory: !0,
			acceptTypes: ["measure"],
			emptyText: "chart.area.dropZone.yAxis.empty",
			enableDualAxis: !0
		},
		{
			key: "series",
			label: "chart.configText.series_stack_areas",
			description: "chart.configText.dimensions_to_create_stacked_areas",
			mandatory: !1,
			acceptTypes: ["dimension"],
			emptyText: "chart.area.dropZone.series.empty"
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
		u,
		d(!1),
		c("chart.configText.how_to_stack_multiple_area_series"),
		i,
		r,
		a,
		o
	]
};
//#endregion
export { a, o as c, c as d, r as f, l as i, d as l, p as n, n as o, s as p, i as r, t as s, f as t, u };

//# sourceMappingURL=chart-config-area-DsrZCIwF.js.map