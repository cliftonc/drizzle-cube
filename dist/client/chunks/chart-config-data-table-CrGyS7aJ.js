import { n as e } from "./rolldown-runtime-DArdT4gl.js";
//#region src/client/components/charts/DataTable.config.ts
var t = /* @__PURE__ */ e({ dataTableConfig: () => n }), n = {
	dropZones: [{
		key: "xAxis",
		label: "chart.configText.columns",
		description: "chart.configText.all_fields_to_display_as_columns",
		mandatory: !1,
		acceptTypes: [
			"dimension",
			"timeDimension",
			"measure"
		],
		emptyText: "chart.table.dropZone.xAxis.empty"
	}],
	displayOptions: ["hideHeader"],
	displayOptionsConfig: [{
		key: "leftYAxisFormat",
		label: "chart.option.valueFormat.label",
		type: "axisFormat",
		description: "chart.configText.number_formatting_for_numeric_values"
	}]
};
//#endregion
export { n, t };

//# sourceMappingURL=chart-config-data-table-CrGyS7aJ.js.map