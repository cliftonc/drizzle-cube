//#region src/client/utils/index.ts
function e(e) {
	return {
		portlets: e,
		layouts: t(e)
	};
}
function t(e) {
	let t = e.map((e) => ({
		i: e.id,
		x: e.x,
		y: e.y,
		w: e.w,
		h: e.h,
		minW: 3,
		minH: 3
	}));
	return {
		lg: t,
		md: t.map((e) => ({
			...e,
			w: Math.min(e.w, 8)
		})),
		sm: t.map((e) => ({
			...e,
			w: Math.min(e.w, 6)
		})),
		xs: t.map((e) => ({
			...e,
			w: Math.min(e.w, 4)
		})),
		xxs: t.map((e) => ({
			...e,
			w: 2
		}))
	};
}
function n(e, t = {}) {
	let { formatNumbers: n = !0, precision: r = 2 } = t;
	return n ? e.map((e) => {
		let t = {};
		for (let [n, i] of Object.entries(e)) t[n] = typeof i == "number" ? Number(i.toFixed(r)) : i;
		return t;
	}) : e;
}
function r() {
	return `portlet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function i(e, t = 6, n = 4) {
	return e.length === 0 ? {
		x: 0,
		y: 0
	} : {
		x: 0,
		y: Math.max(...e.map((e) => e.y + e.h))
	};
}
function a(e) {
	try {
		let t = JSON.parse(e);
		return typeof t != "object" || !t ? {
			valid: !1,
			error: "Query must be a JSON object"
		} : !t.measures && !t.dimensions ? {
			valid: !1,
			error: "Query must have at least measures or dimensions"
		} : {
			valid: !0,
			query: t
		};
	} catch {
		return {
			valid: !1,
			error: "Invalid JSON format"
		};
	}
}
function o() {
	return {
		title: "Sample Chart",
		query: JSON.stringify({
			measures: ["count"],
			dimensions: ["category"]
		}, null, 2),
		chartType: "bar",
		chartConfig: {
			x: "category",
			y: ["count"]
		},
		displayConfig: {
			showLegend: !0,
			showGrid: !0,
			showTooltip: !0
		},
		w: 6,
		h: 4,
		x: 0,
		y: 0
	};
}
//#endregion
export { r as a, n as i, o as n, t as o, i as r, a as s, e as t };

//# sourceMappingURL=utils-CToHkuhU.js.map