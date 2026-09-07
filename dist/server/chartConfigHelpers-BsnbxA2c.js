//#region src/client/charts/chartConfigHelpers.ts
function e({ measureCount: e, dimensionCount: t }) {
	return e < 1 ? {
		available: !1,
		reason: "chart.availability.requiresMeasure"
	} : t < 1 ? {
		available: !1,
		reason: "chart.availability.requiresDimension"
	} : { available: !0 };
}
function t({ measureCount: e }) {
	return e < 1 ? {
		available: !1,
		reason: "chart.availability.requiresMeasure"
	} : { available: !0 };
}
var n = {
	key: "target",
	label: "chart.option.target.label",
	type: "string",
	placeholder: "e.g., 100 or 50,75 for spread",
	description: "chart.option.target.description"
}, r = {
	key: "connectNulls",
	label: "chart.option.connectNulls.label",
	type: "boolean",
	defaultValue: !1,
	description: "chart.option.connectNulls.description"
}, i = {
	key: "leftYAxisFormat",
	label: "chart.option.leftYAxisFormat.label",
	type: "axisFormat",
	description: "chart.option.leftYAxisFormat.description"
}, a = {
	key: "rightYAxisFormat",
	label: "chart.option.rightYAxisFormat.label",
	type: "axisFormat",
	description: "chart.option.rightYAxisFormat.description"
};
function o(e = "chart.option.valueFormat.description") {
	return {
		key: "leftYAxisFormat",
		label: "chart.option.valueFormat.label",
		type: "axisFormat",
		description: e
	};
}
function s(e) {
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
var c = {
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
}, l = {
	key: "showSummary",
	label: "chart.option.showSummary.label",
	type: "boolean",
	defaultValue: !1,
	description: "chart.option.showSummary.description"
};
function u(e = !0) {
	return {
		key: "showPoints",
		label: "chart.option.showPoints.label",
		type: "boolean",
		defaultValue: e,
		description: "chart.option.showPoints.description"
	};
}
//#endregion
export { e as a, l as c, o as d, t as i, s as l, c as n, a as o, i as r, u as s, r as t, n as u };
