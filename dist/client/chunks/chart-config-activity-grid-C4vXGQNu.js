import { n as e } from "./rolldown-runtime-DArdT4gl.js";
//#region src/client/components/charts/ActivityGridChart.config.ts
var t = /* @__PURE__ */ e({ activityGridChartConfig: () => n }), n = {
	dropZones: [{
		key: "dateField",
		label: "chart.configText.time_dimension",
		description: "chart.configText.time_field_that_determines_grid_structure_granularity_affects_layout",
		mandatory: !0,
		maxItems: 1,
		acceptTypes: ["timeDimension"],
		emptyText: "chart.activityGrid.dropZone.dateField.empty"
	}, {
		key: "valueField",
		label: "chart.configText.activity_measure",
		description: "chart.configText.measure_used_for_activity_intensity_color_coding",
		mandatory: !0,
		maxItems: 1,
		acceptTypes: ["measure"],
		emptyText: "chart.activityGrid.dropZone.valueField.empty"
	}],
	displayOptions: [
		"showLabels",
		"showTooltip",
		"hideHeader"
	],
	displayOptionsConfig: [{
		key: "fitToWidth",
		label: "chart.option.fitToWidth.label",
		type: "boolean",
		defaultValue: !1,
		description: "chart.option.fitToWidth.description"
	}],
	validate: (e) => {
		let { dateField: t, valueField: n } = e;
		return !t || Array.isArray(t) && t.length === 0 ? {
			isValid: !1,
			message: "chart.activityGrid.validation.timeDimensionRequired"
		} : !n || Array.isArray(n) && n.length === 0 ? {
			isValid: !1,
			message: "chart.activityGrid.validation.measureRequired"
		} : { isValid: !0 };
	},
	clickableElements: { cell: !0 }
};
//#endregion
export { n, t };

//# sourceMappingURL=chart-config-activity-grid-C4vXGQNu.js.map