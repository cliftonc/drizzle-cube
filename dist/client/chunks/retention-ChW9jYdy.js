//#region src/client/types/retention.ts
var e = [
	{
		value: "last_30_days",
		label: "Last 30 days"
	},
	{
		value: "last_3_months",
		label: "Last 3 months"
	},
	{
		value: "last_6_months",
		label: "Last 6 months"
	},
	{
		value: "last_12_months",
		label: "Last 12 months"
	},
	{
		value: "this_year",
		label: "This year"
	},
	{
		value: "last_year",
		label: "Last year"
	},
	{
		value: "custom",
		label: "Custom range"
	}
], t = "last_3_months";
function n(e) {
	let t = /* @__PURE__ */ new Date(), i = new Date(t.getFullYear(), t.getMonth(), t.getDate());
	switch (e) {
		case "last_30_days": {
			let e = new Date(i);
			return e.setDate(e.getDate() - 30), {
				start: r(e),
				end: r(i)
			};
		}
		case "last_3_months": {
			let e = new Date(i.getFullYear(), i.getMonth() - 3, 1), t = new Date(i.getFullYear(), i.getMonth(), 0);
			return {
				start: r(e),
				end: r(t)
			};
		}
		case "last_6_months": {
			let e = new Date(i.getFullYear(), i.getMonth() - 6, 1), t = new Date(i.getFullYear(), i.getMonth(), 0);
			return {
				start: r(e),
				end: r(t)
			};
		}
		case "last_12_months": {
			let e = new Date(i.getFullYear(), i.getMonth() - 12, 1), t = new Date(i.getFullYear(), i.getMonth(), 0);
			return {
				start: r(e),
				end: r(t)
			};
		}
		case "this_year": return {
			start: r(new Date(i.getFullYear(), 0, 1)),
			end: r(i)
		};
		case "last_year": {
			let e = new Date(i.getFullYear() - 1, 0, 1), t = new Date(i.getFullYear() - 1, 11, 31);
			return {
				start: r(e),
				end: r(t)
			};
		}
		default: return n("last_3_months");
	}
}
function r(e) {
	return `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`;
}
function i(t) {
	for (let r of e) {
		if (r.value === "custom") continue;
		let e = n(r.value);
		if (e.start === t.start && e.end === t.end) return r.value;
	}
	return "custom";
}
function a(e) {
	if (!e || typeof e != "object") return !1;
	let t = e;
	return Array.isArray(t.rows) && Array.isArray(t.periods);
}
function o(e) {
	return typeof e == "object" && !!e && "retention" in e && typeof e.retention == "object";
}
var s = {
	retentionCube: null,
	retentionBindingKey: null,
	retentionTimeDimension: null,
	retentionDateRange: n(t),
	retentionCohortFilters: [],
	retentionActivityFilters: [],
	retentionBreakdowns: [],
	retentionViewGranularity: "week",
	retentionPeriods: 12,
	retentionType: "classic"
}, c = [
	{
		value: "day",
		label: "Daily"
	},
	{
		value: "week",
		label: "Weekly"
	},
	{
		value: "month",
		label: "Monthly"
	}
], l = [{
	value: "classic",
	label: "Classic",
	description: "User was active in exactly period N"
}, {
	value: "rolling",
	label: "Rolling",
	description: "User was active in period N or later"
}];
//#endregion
export { s as a, a as c, l as i, o as l, e as n, i as o, c as r, n as s, t };

//# sourceMappingURL=retention-ChW9jYdy.js.map