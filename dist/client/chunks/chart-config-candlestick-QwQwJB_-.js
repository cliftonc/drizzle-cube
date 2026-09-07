import { n as e } from "./rolldown-runtime-DArdT4gl.js";
//#region src/client/components/charts/CandlestickChart.config.ts
var t = /* @__PURE__ */ e({ candlestickChartConfig: () => n }), n = {
	clickableElements: { bar: !0 },
	displayOptions: ["hideHeader"],
	dropZones: [{
		key: "xAxis",
		label: "chart.configText.x_axis_time_category",
		description: "chart.configText.time_dimension_or_category_for_each_candle_e_g_date_symbol",
		mandatory: !0,
		maxItems: 1,
		acceptTypes: ["timeDimension", "dimension"],
		emptyText: "chart.candlestick.dropZone.xAxis.empty"
	}, {
		key: "yAxis",
		label: "chart.configText.ohlc_measures_open_close_high_low",
		description: "chart.configText.drop_2_4_measures_in_order_open_close_high_low_ohlc_mode_for_range_mode_",
		mandatory: !0,
		acceptTypes: ["measure"],
		emptyText: "chart.candlestick.dropZone.yAxis.empty"
	}],
	displayOptionsConfig: [
		{
			key: "rangeMode",
			label: "chart.option.rangeMode.label",
			type: "select",
			defaultValue: "ohlc",
			options: [{
				value: "ohlc",
				label: "chart.option.rangeMode.ohlc"
			}, {
				value: "range",
				label: "chart.option.rangeMode.range"
			}],
			description: "chart.option.rangeMode.description"
		},
		{
			key: "bullColor",
			label: "chart.option.bullColor.label",
			type: "color",
			defaultValue: "#22c55e",
			description: "chart.option.bullColor.description"
		},
		{
			key: "bearColor",
			label: "chart.option.bearColor.label",
			type: "color",
			defaultValue: "#ef4444",
			description: "chart.option.bearColor.description"
		},
		{
			key: "showWicks",
			label: "chart.option.showWicks.label",
			type: "boolean",
			defaultValue: !0,
			description: "chart.option.showWicks.description"
		},
		{
			key: "leftYAxisFormat",
			label: "chart.option.yAxisFormat.label",
			type: "axisFormat",
			description: "chart.configText.number_formatting_for_the_price_axis"
		}
	]
};
//#endregion
export { n, t };

//# sourceMappingURL=chart-config-candlestick-QwQwJB_-.js.map