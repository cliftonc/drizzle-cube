import { C as e, L as t, M as n, P as r, a as i, i as a, j as o, o as s, r as c } from "./chunks/chart-data-table-Bn9EtETl.js";
import { A as l, C as u, D as d, E as f, M as p, N as m, O as h, T as g, c as _, d as v, f as y, j as b, k as x, l as S, s as C, u as w, w as T } from "./chunks/chart-activity-grid-D6X0iOUw.js";
import { B as E, F as D, I as O, L as k, N as A, P as j, R as M, V as N, z as P } from "./chunks/chart-area-95fIdTeM.js";
import { a as F, i as I, n as L, r as R, t as z } from "./chunks/syntaxHighlighting-Cm43as8i.js";
import { _ as B, g as V, h as H, m as U } from "./chunks/chart-kpi-delta-D9xqKbwp.js";
import { a as W, i as G, n as K, o as q, r as J, s as Y, t as X } from "./chunks/utils-CToHkuhU.js";
import "react";
import { jsx as Z } from "react/jsx-runtime";
//#region src/client/utils/measureIcons.tsx
function Q(t, n = "w-4 h-4") {
	let r = e(t);
	return /* @__PURE__ */ Z(r, { className: n });
}
function $() {
	let t = [
		"count",
		"countDistinct",
		"countDistinctApprox",
		"sum",
		"avg",
		"min",
		"max",
		"runningTotal",
		"calculated",
		"number"
	], n = {};
	for (let r of t) {
		let t = e(r);
		n[r] = /* @__PURE__ */ Z(t, { className: "dc:w-4 dc:h-4" });
	}
	return n;
}
//#endregion
export { C as CHART_COLORS, _ as CHART_COLORS_GRADIENT, S as CHART_MARGINS, w as NEGATIVE_COLOR, v as POSITIVE_COLOR, y as RESPONSIVE_CHART_MARGINS, r as captureThumbnail, u as createAxisTickFormatter, X as createDashboardLayout, K as createSamplePortlet, o as exportPortletToXlsx, U as filterIncompletePeriod, J as findNextPosition, T as formatAxisValue, G as formatChartData, g as formatNumericValue, A as formatPeriodDayIndex, f as formatTimeValue, j as generatePeriodShortLabel, W as generatePortletId, q as generateResponsiveLayouts, $ as getAllMeasureIcons, d as getFieldGranularity, h as getFieldLabel, Q as getMeasureIcon, c as getMeasureType, a as getOrderedColumnsFromQuery, H as getPeriodEndDate, D as getPeriodIndices, O as getPeriodLabels, k as getPriorPeriodStrokeDashArray, V as getQueryGranularity, z as getSyntaxHighlighter, i as hasTimeDimensionForPivot, L as highlightCodeBlock, R as highlightCodeBlocks, M as isComparisonData, n as isExportAvailable, B as isLastPeriodComplete, P as isPriorPeriodSeries, I as isSyntaxHighlightingAvailable, t as isThumbnailCaptureAvailable, x as isValidNumericValue, F as loadSyntaxHighlighter, l as parseNumericValue, s as pivotTableData, b as transformChartData, p as transformChartDataWithSeries, E as transformForOverlayMode, N as transformForSeparateMode, m as transformSeriesKeysWithLabels, Y as validateCubeQuery };

//# sourceMappingURL=utils.js.map