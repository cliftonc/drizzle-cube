import { $ as e, A as t, B as n, C as r, D as i, E as a, F as o, G as s, H as c, I as l, J as u, K as d, L as f, M as p, N as m, P as h, Q as g, R as _, S as v, T as y, U as b, V as ee, W as te, X as x, Y as ne, Z as re, et as ie, it as ae, j as oe, k as S, nt as C, q as se, rt as ce, tt as le, w as ue, x as de, z as w } from "./utils-ixb9YIRy.js";
//#region node_modules/drizzle-orm/sql/expressions/select.js
function fe(e) {
	return C`${e} asc`;
}
function pe(e) {
	return C`${e} desc`;
}
//#endregion
//#region node_modules/drizzle-orm/sql/functions/aggregate.js
function T(e) {
	return C`count(${e || C.raw("*")})`.mapWith(Number);
}
function me(e) {
	return C`count(distinct ${e})`.mapWith(Number);
}
function E(e) {
	return C`sum(${e})`.mapWith(String);
}
function D(e) {
	return C`max(${e})`.mapWith(ae(e, ce) ? e : String);
}
function he(e) {
	return C`min(${e})`.mapWith(ae(e, ce) ? e : String);
}
//#endregion
//#region src/server/adapters/window-function-builder.ts
function ge(e) {
	return e && e.length > 0 ? C`PARTITION BY ${C.join(e, C`, `)}` : C``;
}
function _e(e) {
	return e && e.length > 0 ? C`ORDER BY ${C.join(e.map((e) => e.direction === "desc" ? C`${e.field} DESC` : C`${e.field} ASC`), C`, `)}` : C``;
}
function ve(e) {
	return e === "unbounded" ? "UNBOUNDED PRECEDING" : typeof e == "number" ? `${e} PRECEDING` : "CURRENT ROW";
}
function ye(e) {
	return e === "unbounded" ? "UNBOUNDED FOLLOWING" : e === "current" ? "CURRENT ROW" : typeof e == "number" ? `${e} FOLLOWING` : "CURRENT ROW";
}
function be(e) {
	if (!e) return C``;
	let t = e.type.toUpperCase(), n = ve(e.start), r = ye(e.end);
	return C`${C.raw(t)} BETWEEN ${C.raw(n)} AND ${C.raw(r)}`;
}
function xe(e, t, n) {
	let r = [];
	e && e.length > 0 && r.push(ge(e)), t && t.length > 0 && r.push(_e(t)), n?.frame && r.push(be(n.frame));
	let i = r.length > 0 ? C.join(r, C` `) : C``;
	return C`OVER (${i})`;
}
function Se(e, t, n, r) {
	let i = r?.defaultValue === void 0 ? C`` : C`, ${r.defaultValue}`;
	return C`${C.raw(e)}(${t}, ${r?.offset ?? 1}${i}) ${n}`;
}
var Ce = {
	rank: "RANK",
	denseRank: "DENSE_RANK",
	rowNumber: "ROW_NUMBER"
}, we = {
	firstValue: "FIRST_VALUE",
	lastValue: "LAST_VALUE",
	movingAvg: "AVG",
	movingSum: "SUM"
};
function Te(e, t, n, r) {
	if (e === "lag" || e === "lead") return Se(e === "lag" ? "LAG" : "LEAD", t, n, r);
	if (e === "ntile") return C`NTILE(${r?.nTile ?? 4}) ${n}`;
	let i = Ce[e];
	if (i) return C`${C.raw(i)}() ${n}`;
	let a = we[e];
	if (a) return C`${C.raw(a)}(${t}) ${n}`;
	throw Error(`Unsupported window function: ${e}`);
}
//#endregion
//#region src/server/adapters/base-adapter.ts
var O = class {
	preprocessCalculatedTemplate(e) {
		return e;
	}
	nullToZero(e) {
		return C`COALESCE(${e}, 0)`;
	}
	caseInsensitiveLike(e, t, n) {
		return n ? C`${e} NOT ILIKE ${t}` : C`${e} ILIKE ${t}`;
	}
	regexCondition(e, t, n) {
		return n ? C`${e} !~* ${t}` : C`${e} ~* ${t}`;
	}
	buildStringCondition(e, t, n) {
		switch (t) {
			case "contains": return this.caseInsensitiveLike(e, `%${n}%`, !1);
			case "notContains": return this.caseInsensitiveLike(e, `%${n}%`, !0);
			case "startsWith": return this.caseInsensitiveLike(e, `${n}%`, !1);
			case "endsWith": return this.caseInsensitiveLike(e, `%${n}`, !1);
			case "like": return C`${e} LIKE ${n}`;
			case "notLike": return C`${e} NOT LIKE ${n}`;
			case "ilike": return this.caseInsensitiveLike(e, n, !1);
			case "regex": return this.regexCondition(e, n, !1);
			case "notRegex": return this.regexCondition(e, n, !0);
			default: throw Error(`Unsupported string operator: ${t}`);
		}
	}
	buildConditionalAggregation(e, t, n) {
		let r = e.toUpperCase();
		return e === "count" && !t ? C`${C.raw(r)}(CASE WHEN ${n} THEN 1 END)` : C`${C.raw(r)}(CASE WHEN ${n} THEN ${t} END)`;
	}
	buildAvg(e) {
		return this.nullToZero(C`AVG(${e})`);
	}
	buildCaseWhen(e, t) {
		let n = e.map((e) => C`WHEN ${e.when} THEN ${e.then}`).reduce((e, t) => C`${e} ${t}`);
		return t === void 0 ? C`CASE ${n} END` : C`CASE ${n} ELSE ${t} END`;
	}
	buildBooleanLiteral(e) {
		return e ? C`TRUE` : C`FALSE`;
	}
	convertFilterValue(e) {
		return e;
	}
	prepareDateValue(e) {
		return e;
	}
	isTimestampInteger() {
		return !1;
	}
	convertTimeDimensionResult(e) {
		return e;
	}
	buildStddev(e, t = !1) {
		let n = t ? "STDDEV_SAMP" : "STDDEV_POP";
		return this.nullToZero(C`${C.raw(n)}(${e})`);
	}
	buildVariance(e, t = !1) {
		let n = t ? "VAR_SAMP" : "VAR_POP";
		return this.nullToZero(C`${C.raw(n)}(${e})`);
	}
	buildWindowFunction(e, t, n, r, i) {
		return Te(e, t, xe(n, r, i), i);
	}
	decimalTryCastPattern() {
		return "^ *[+-]?([0-9]+(\\.[0-9]+)?|\\.[0-9]+) *$";
	}
	integerTryCastPattern() {
		return "^ *[+-]?[0-9]+ *$";
	}
	timestampTryCastPattern() {
		return "^ *[0-9]{4}-[0-9]{2}-[0-9]{2}([ T][0-9]{2}:[0-9]{2}(:[0-9]{2}(\\.[0-9]+)?)?([+-][0-9]{2}:?[0-9]{2}|Z)?)? *$";
	}
	buildPattern(e, t) {
		switch (e) {
			case "contains":
			case "notContains": return `%${t}%`;
			case "startsWith": return `${t}%`;
			case "endsWith": return `%${t}`;
			default: return t;
		}
	}
	parseISODuration(e) {
		let t = {
			years: 0,
			months: 0,
			days: 0,
			hours: 0,
			minutes: 0,
			seconds: 0
		}, n = e.match(/^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/);
		if (!n) throw Error(`Invalid ISO 8601 duration format: ${e}`);
		return t.years = parseInt(n[1] || "0", 10), t.months = parseInt(n[2] || "0", 10), t.days = parseInt(n[3] || "0", 10), t.hours = parseInt(n[4] || "0", 10), t.minutes = parseInt(n[5] || "0", 10), t.seconds = parseFloat(n[6] || "0"), t;
	}
	durationToSeconds(e) {
		let t = this.parseISODuration(e);
		return t.years * 365 * 24 * 60 * 60 + t.months * 30 * 24 * 60 * 60 + t.days * 24 * 60 * 60 + t.hours * 60 * 60 + t.minutes * 60 + t.seconds;
	}
}, Ee = class extends O {
	getEngineType() {
		return "postgres";
	}
	buildIntervalFromISO(e) {
		let t = this.parseISODuration(e), n = [];
		t.years && n.push(`${t.years} years`), t.months && n.push(`${t.months} months`), t.days && n.push(`${t.days} days`), t.hours && n.push(`${t.hours} hours`), t.minutes && n.push(`${t.minutes} minutes`), t.seconds && n.push(`${t.seconds} seconds`);
		let r = n.join(" ") || "0 seconds";
		return C`INTERVAL '${C.raw(r)}'`;
	}
	buildTimeDifferenceSeconds(e, t) {
		return C`EXTRACT(EPOCH FROM (${e} - ${t}))`;
	}
	buildDateAddInterval(e, t) {
		let n = this.buildIntervalFromISO(t);
		return C`(${e} + ${n})`;
	}
	buildConditionalAggregation(e, t, n) {
		let r = e.toUpperCase();
		return e === "count" && !t ? C`COUNT(*) FILTER (WHERE ${n})` : C`${C.raw(r)}(${t}) FILTER (WHERE ${n})`;
	}
	buildDateDiffPeriods(e, t, n) {
		switch (n) {
			case "day": return C`(${t}::date - ${e}::date)`;
			case "week": return C`FLOOR((${t}::date - ${e}::date) / 7)`;
			case "month": return C`(EXTRACT(YEAR FROM AGE(${t}::timestamp, ${e}::timestamp)) * 12 + EXTRACT(MONTH FROM AGE(${t}::timestamp, ${e}::timestamp)))::integer`;
			default: throw Error(`Unsupported date diff unit: ${n}`);
		}
	}
	buildPeriodSeriesSubquery(e) {
		return C`(SELECT generate_series(0, ${e}) as period_number) p`;
	}
	buildTimeDimension(e, t) {
		switch (e) {
			case "year": return C`DATE_TRUNC('year', ${t}::timestamp)`;
			case "quarter": return C`DATE_TRUNC('quarter', ${t}::timestamp)`;
			case "month": return C`DATE_TRUNC('month', ${t}::timestamp)`;
			case "week": return C`DATE_TRUNC('week', ${t}::timestamp)`;
			case "day": return C`DATE_TRUNC('day', ${t}::timestamp)::timestamp`;
			case "hour": return C`DATE_TRUNC('hour', ${t}::timestamp)`;
			case "minute": return C`DATE_TRUNC('minute', ${t}::timestamp)`;
			case "second": return C`DATE_TRUNC('second', ${t}::timestamp)`;
			default: return t;
		}
	}
	castToType(e, t) {
		switch (t) {
			case "timestamp": return C`${e}::timestamp`;
			case "decimal": return C`${e}::decimal`;
			case "integer": return C`${e}::integer`;
			default: throw Error(`Unsupported cast type: ${t}`);
		}
	}
	tryCastToType(e, t) {
		switch (t) {
			case "timestamp": return C`CASE WHEN ${e} ~ ${this.timestampTryCastPattern()} THEN ${e}::timestamp ELSE NULL END`;
			case "decimal": return C`CASE WHEN ${e} ~ ${this.decimalTryCastPattern()} THEN ${e}::decimal ELSE NULL END`;
			case "integer": return C`CASE WHEN ${e} ~ ${this.integerTryCastPattern()} THEN ${e}::integer ELSE NULL END`;
			default: throw Error(`Unsupported cast type: ${t}`);
		}
	}
	getCapabilities() {
		return {
			supportsPercentile: !0,
			supportsLateralJoins: !0,
			supportsPercentileSubqueries: !0,
			supportsLateralSubqueriesInCTE: !0
		};
	}
	buildPercentile(e, t) {
		let n = t / 100;
		return C`PERCENTILE_CONT(${n}) WITHIN GROUP (ORDER BY ${e})`;
	}
}, De = class extends O {
	getEngineType() {
		return "mysql";
	}
	buildIntervalFromISO(e) {
		let t = this.durationToSeconds(e);
		return C`${t}`;
	}
	buildTimeDifferenceSeconds(e, t) {
		return C`TIMESTAMPDIFF(SECOND, ${t}, ${e})`;
	}
	buildDateAddInterval(e, t) {
		let n = this.parseISODuration(t), r = e;
		return n.years && (r = C`DATE_ADD(${r}, INTERVAL ${n.years} YEAR)`), n.months && (r = C`DATE_ADD(${r}, INTERVAL ${n.months} MONTH)`), n.days && (r = C`DATE_ADD(${r}, INTERVAL ${n.days} DAY)`), n.hours && (r = C`DATE_ADD(${r}, INTERVAL ${n.hours} HOUR)`), n.minutes && (r = C`DATE_ADD(${r}, INTERVAL ${n.minutes} MINUTE)`), n.seconds && (r = C`DATE_ADD(${r}, INTERVAL ${n.seconds} SECOND)`), r;
	}
	buildDateDiffPeriods(e, t, n) {
		let r = n.toUpperCase();
		return C`TIMESTAMPDIFF(${C.raw(r)}, ${e}, ${t})`;
	}
	buildPeriodSeriesSubquery(e) {
		return C`(
      WITH RECURSIVE periods(period_number) AS (
        SELECT 0
        UNION ALL
        SELECT period_number + 1 FROM periods WHERE period_number < ${e}
      )
      SELECT period_number FROM periods
    ) p`;
	}
	buildTimeDimension(e, t) {
		let n = {
			year: "%Y-01-01 00:00:00",
			quarter: "%Y-%q-01 00:00:00",
			month: "%Y-%m-01 00:00:00",
			week: "%Y-%u-01 00:00:00",
			day: "%Y-%m-%d 00:00:00",
			hour: "%Y-%m-%d %H:00:00",
			minute: "%Y-%m-%d %H:%i:00",
			second: "%Y-%m-%d %H:%i:%s"
		};
		switch (e) {
			case "quarter": return C`DATE_ADD(MAKEDATE(YEAR(${t}), 1), INTERVAL (QUARTER(${t}) - 1) * 3 MONTH)`;
			case "week": return C`STR_TO_DATE(DATE_FORMAT(DATE_SUB(${t}, INTERVAL WEEKDAY(${t}) DAY), '%Y-%m-%d 00:00:00'), '%Y-%m-%d %H:%i:%s')`;
			default: {
				let r = n[e];
				return r ? C`STR_TO_DATE(DATE_FORMAT(${t}, ${r}), '%Y-%m-%d %H:%i:%s')` : t;
			}
		}
	}
	caseInsensitiveLike(e, t, n) {
		let r = t.toLowerCase();
		return n ? C`LOWER(${e}) NOT LIKE ${r}` : C`LOWER(${e}) LIKE ${r}`;
	}
	regexCondition(e, t, n) {
		return n ? C`${e} NOT REGEXP ${t}` : C`${e} REGEXP ${t}`;
	}
	castToType(e, t) {
		switch (t) {
			case "timestamp": return C`CAST(${e} AS DATETIME)`;
			case "decimal": return C`CAST(${e} AS DECIMAL(10,2))`;
			case "integer": return C`CAST(${e} AS SIGNED INTEGER)`;
			default: throw Error(`Unsupported cast type: ${t}`);
		}
	}
	tryCastToType(e, t) {
		switch (t) {
			case "timestamp": return C`CASE WHEN ${e} REGEXP ${this.timestampTryCastPattern()} THEN CAST(${e} AS DATETIME) ELSE NULL END`;
			case "decimal": return C`CASE WHEN ${e} REGEXP ${this.decimalTryCastPattern()} THEN CAST(${e} AS DECIMAL(10,2)) ELSE NULL END`;
			case "integer": return C`CASE WHEN ${e} REGEXP ${this.integerTryCastPattern()} THEN CAST(${e} AS SIGNED INTEGER) ELSE NULL END`;
			default: throw Error(`Unsupported cast type: ${t}`);
		}
	}
	nullToZero(e) {
		return C`IFNULL(${e}, 0)`;
	}
	getCapabilities() {
		return {
			supportsPercentile: !1,
			supportsLateralJoins: !0,
			supportsPercentileSubqueries: !1,
			supportsLateralSubqueriesInCTE: !0
		};
	}
	buildPercentile(e, t) {
		return null;
	}
}, Oe = class extends O {
	getEngineType() {
		return "sqlite";
	}
	buildIntervalFromISO(e) {
		let t = this.durationToSeconds(e);
		return C`${t}`;
	}
	buildTimeDifferenceSeconds(e, t) {
		return C`(${e} - ${t})`;
	}
	buildDateAddInterval(e, t) {
		let n = this.durationToSeconds(t);
		return C`(${e} + ${n})`;
	}
	buildDateDiffPeriods(e, t, n) {
		switch (n) {
			case "day": return C`CAST((julianday(datetime(${t}, 'unixepoch')) - julianday(datetime(${e}, 'unixepoch'))) AS INTEGER)`;
			case "week": return C`CAST((julianday(datetime(${t}, 'unixepoch')) - julianday(datetime(${e}, 'unixepoch'))) / 7 AS INTEGER)`;
			case "month": return C`((CAST(strftime('%Y', datetime(${t}, 'unixepoch')) AS INTEGER) - CAST(strftime('%Y', datetime(${e}, 'unixepoch')) AS INTEGER)) * 12 + (CAST(strftime('%m', datetime(${t}, 'unixepoch')) AS INTEGER) - CAST(strftime('%m', datetime(${e}, 'unixepoch')) AS INTEGER)))`;
			default: throw Error(`Unsupported date diff unit for SQLite: ${n}`);
		}
	}
	buildPeriodSeriesSubquery(e) {
		return C`(
      WITH RECURSIVE periods(period_number) AS (
        SELECT 0
        UNION ALL
        SELECT period_number + 1 FROM periods WHERE period_number < ${e}
      )
      SELECT period_number FROM periods
    ) p`;
	}
	buildTimeDimension(e, t) {
		switch (e) {
			case "year": return C`datetime(${t}, 'unixepoch', 'start of year')`;
			case "quarter": {
				let e = C`datetime(${t}, 'unixepoch')`;
				return C`datetime(${e}, 'start of year',
          '+' || (((CAST(strftime('%m', ${e}) AS INTEGER) - 1) / 3) * 3) || ' months')`;
			}
			case "month": return C`datetime(${t}, 'unixepoch', 'start of month')`;
			case "week": return C`date(datetime(${t}, 'unixepoch'), 'weekday 1', '-6 days')`;
			case "day": return C`datetime(${t}, 'unixepoch', 'start of day')`;
			case "hour": {
				let e = C`datetime(${t}, 'unixepoch')`;
				return C`datetime(strftime('%Y-%m-%d %H:00:00', ${e}))`;
			}
			case "minute": {
				let e = C`datetime(${t}, 'unixepoch')`;
				return C`datetime(strftime('%Y-%m-%d %H:%M:00', ${e}))`;
			}
			case "second": {
				let e = C`datetime(${t}, 'unixepoch')`;
				return C`datetime(strftime('%Y-%m-%d %H:%M:%S', ${e}))`;
			}
			default: return C`datetime(${t}, 'unixepoch')`;
		}
	}
	caseInsensitiveLike(e, t, n) {
		let r = t.toLowerCase();
		return n ? C`LOWER(${e}) NOT LIKE ${r}` : C`LOWER(${e}) LIKE ${r}`;
	}
	regexCondition(e, t, n) {
		return n ? C`${e} NOT GLOB ${t}` : C`${e} GLOB ${t}`;
	}
	castToType(e, t) {
		switch (t) {
			case "timestamp": return C`datetime(${e} / 1000, 'unixepoch')`;
			case "decimal": return C`CAST(${e} AS REAL)`;
			case "integer": return C`CAST(${e} AS INTEGER)`;
			default: throw Error(`Unsupported cast type: ${t}`);
		}
	}
	tryCastToType(e, t) {
		switch (t) {
			case "timestamp": return C`CASE WHEN TRIM(${e}) = '' OR TRIM(${e}) GLOB '*[^0-9-]*' THEN NULL ELSE datetime(${e} / 1000, 'unixepoch') END`;
			case "decimal": return C`CASE WHEN TRIM(${e}) = '' OR TRIM(${e}) GLOB '*[^0-9.+-]*' THEN NULL ELSE CAST(${e} AS REAL) END`;
			case "integer": return C`CASE WHEN TRIM(${e}) = '' OR TRIM(${e}) GLOB '*[^0-9+-]*' THEN NULL ELSE CAST(${e} AS INTEGER) END`;
			default: throw Error(`Unsupported cast type: ${t}`);
		}
	}
	nullToZero(e) {
		return C`IFNULL(${e}, 0)`;
	}
	buildCaseWhen(e, t) {
		let n = e.map((e) => e.then && typeof e.then == "object" && (e.then.queryChunks || e.then._ || e.then.sql) ? C`WHEN ${e.when} THEN ${C.raw("(")}${e.then}${C.raw(")")}` : C`WHEN ${e.when} THEN ${e.then}`).reduce((e, t) => C`${e} ${t}`);
		return t === void 0 ? C`CASE ${n} END` : t && typeof t == "object" && (t.queryChunks || t._ || t.sql) ? C`CASE ${n} ELSE ${C.raw("(")}${t}${C.raw(")")} END` : C`CASE ${n} ELSE ${t} END`;
	}
	buildBooleanLiteral(e) {
		return e ? C`1` : C`0`;
	}
	preprocessCalculatedTemplate(e) {
		return e.length > 1e3 ? e : e.replace(/(\{[^}]+\})\s*\/\s*/g, (e, t) => `${t.replace(/\{([^}]+)\}/, "CAST({$1} AS REAL)")} / `);
	}
	convertFilterValue(e) {
		return typeof e == "boolean" ? +!!e : e instanceof Date ? e.getTime() : Array.isArray(e) ? e.map((e) => this.convertFilterValue(e)) : e;
	}
	prepareDateValue(e) {
		if (!(e instanceof Date)) {
			if (typeof e == "number") return e;
			if (typeof e == "string") return new Date(e).getTime();
			throw Error(`prepareDateValue expects a Date object, got ${typeof e}`);
		}
		return e.getTime();
	}
	isTimestampInteger() {
		return !0;
	}
	getCapabilities() {
		return {
			supportsPercentile: !1,
			supportsLateralJoins: !1,
			supportsPercentileSubqueries: !1,
			supportsLateralSubqueriesInCTE: !1
		};
	}
	buildStddev(e, t = !1) {
		return null;
	}
	buildVariance(e, t = !1) {
		return null;
	}
	buildPercentile(e, t) {
		return null;
	}
}, ke = class extends De {
	getEngineType() {
		return "singlestore";
	}
}, Ae = class extends O {
	getEngineType() {
		return "duckdb";
	}
	buildIntervalFromISO(e) {
		let t = this.parseISODuration(e), n = [];
		t.years && n.push(`${t.years} years`), t.months && n.push(`${t.months} months`), t.days && n.push(`${t.days} days`), t.hours && n.push(`${t.hours} hours`), t.minutes && n.push(`${t.minutes} minutes`), t.seconds && n.push(`${t.seconds} seconds`);
		let r = n.join(" ") || "0 seconds";
		return C`INTERVAL '${C.raw(r)}'`;
	}
	buildTimeDifferenceSeconds(e, t) {
		return C`(EPOCH(${e}) - EPOCH(${t}))`;
	}
	buildDateAddInterval(e, t) {
		let n = this.buildIntervalFromISO(t);
		return C`(${e} + ${n})`;
	}
	buildConditionalAggregation(e, t, n) {
		let r = e.toUpperCase();
		return e === "count" && !t ? C`COUNT(*) FILTER (WHERE ${n})` : C`${C.raw(r)}(${t}) FILTER (WHERE ${n})`;
	}
	buildDateDiffPeriods(e, t, n) {
		return C`DATE_DIFF('${C.raw(n)}', ${e}::timestamp, ${t}::timestamp)`;
	}
	buildPeriodSeriesSubquery(e) {
		return C`(SELECT UNNEST(generate_series(0, ${e})) as period_number) p`;
	}
	buildTimeDimension(e, t) {
		switch (e) {
			case "year": return C`DATE_TRUNC('year', ${t}::timestamp)`;
			case "quarter": return C`DATE_TRUNC('quarter', ${t}::timestamp)`;
			case "month": return C`DATE_TRUNC('month', ${t}::timestamp)`;
			case "week": return C`DATE_TRUNC('week', ${t}::timestamp)`;
			case "day": return C`DATE_TRUNC('day', ${t}::timestamp)::timestamp`;
			case "hour": return C`DATE_TRUNC('hour', ${t}::timestamp)`;
			case "minute": return C`DATE_TRUNC('minute', ${t}::timestamp)`;
			case "second": return C`DATE_TRUNC('second', ${t}::timestamp)`;
			default: return t;
		}
	}
	regexCondition(e, t, n) {
		return n ? C`NOT regexp_matches(${e}, ${t})` : C`regexp_matches(${e}, ${t})`;
	}
	castToType(e, t) {
		switch (t) {
			case "timestamp": return C`${e}::timestamp`;
			case "decimal": return C`${e}::decimal`;
			case "integer": return C`${e}::integer`;
			default: throw Error(`Unsupported cast type: ${t}`);
		}
	}
	tryCastToType(e, t) {
		switch (t) {
			case "timestamp": return C`TRY_CAST(${e} AS timestamp)`;
			case "decimal": return C`TRY_CAST(${e} AS decimal)`;
			case "integer": return C`TRY_CAST(${e} AS integer)`;
			default: throw Error(`Unsupported cast type: ${t}`);
		}
	}
	getCapabilities() {
		return {
			supportsPercentile: !0,
			supportsLateralJoins: !1,
			supportsPercentileSubqueries: !1,
			supportsLateralSubqueriesInCTE: !1
		};
	}
	buildPercentile(e, t) {
		let n = t / 100;
		return C`QUANTILE_CONT(${e}, ${n})`;
	}
}, je = class extends O {
	getEngineType() {
		return "databend";
	}
	buildIntervalFromISO(e) {
		let t = this.parseISODuration(e), n = [];
		if (t.years && n.push(`${t.years} YEAR`), t.months && n.push(`${t.months} MONTH`), t.days && n.push(`${t.days} DAY`), t.hours && n.push(`${t.hours} HOUR`), t.minutes && n.push(`${t.minutes} MINUTE`), t.seconds && n.push(`${t.seconds} SECOND`), n.length === 0) return C`INTERVAL 0 SECOND`;
		if (n.length === 1) return C`INTERVAL ${C.raw(n[0])}`;
		let r = n.map((e) => `INTERVAL ${e}`);
		return C`(${C.raw(r.join(" + "))})`;
	}
	buildTimeDifferenceSeconds(e, t) {
		return C`EXTRACT(EPOCH FROM TIMESTAMP_DIFF(${e}, ${t}))`;
	}
	buildDateAddInterval(e, t) {
		let n = this.buildIntervalFromISO(t);
		return C`(${e} + ${n})`;
	}
	buildDateDiffPeriods(e, t, n) {
		return C`DATE_DIFF('${C.raw(n)}', ${e}::TIMESTAMP, ${t}::TIMESTAMP)`;
	}
	buildPeriodSeriesSubquery(e) {
		return C`(SELECT number as period_number FROM numbers(${e + 1})) p`;
	}
	buildTimeDimension(e, t) {
		switch (e) {
			case "year": return C`DATE_TRUNC(YEAR, ${t}::TIMESTAMP)`;
			case "quarter": return C`DATE_TRUNC(QUARTER, ${t}::TIMESTAMP)`;
			case "month": return C`DATE_TRUNC(MONTH, ${t}::TIMESTAMP)`;
			case "week": return C`DATE_TRUNC(WEEK, ${t}::TIMESTAMP)`;
			case "day": return C`DATE_TRUNC(DAY, ${t}::TIMESTAMP)::TIMESTAMP`;
			case "hour": return C`DATE_TRUNC(HOUR, ${t}::TIMESTAMP)`;
			case "minute": return C`DATE_TRUNC(MINUTE, ${t}::TIMESTAMP)`;
			case "second": return C`DATE_TRUNC(SECOND, ${t}::TIMESTAMP)`;
			default: return t;
		}
	}
	caseInsensitiveLike(e, t, n) {
		return n ? C`LOWER(${e}) NOT LIKE LOWER(${t})` : C`LOWER(${e}) LIKE LOWER(${t})`;
	}
	regexCondition(e, t, n) {
		return n ? C`NOT (${e} REGEXP ${t})` : C`${e} REGEXP ${t}`;
	}
	castToType(e, t) {
		switch (t) {
			case "timestamp": return C`${e}::TIMESTAMP`;
			case "decimal": return C`${e}::DECIMAL`;
			case "integer": return C`${e}::INTEGER`;
			default: throw Error(`Unsupported cast type: ${t}`);
		}
	}
	tryCastToType(e, t) {
		switch (t) {
			case "timestamp": return C`TRY_CAST(${e} AS TIMESTAMP)`;
			case "decimal": return C`TRY_CAST(${e} AS DECIMAL)`;
			case "integer": return C`TRY_CAST(${e} AS INTEGER)`;
			default: throw Error(`Unsupported cast type: ${t}`);
		}
	}
	getCapabilities() {
		return {
			supportsPercentile: !1,
			supportsLateralJoins: !1,
			supportsPercentileSubqueries: !1,
			supportsLateralSubqueriesInCTE: !1
		};
	}
	buildVariance(e, t = !1) {
		let n = t ? "COVAR_SAMP" : "COVAR_POP";
		return C`COALESCE(${C.raw(n)}(${e}, ${e}), 0)`;
	}
	buildPercentile(e, t) {
		throw Error("Percentile functions are not yet supported for Databend");
	}
}, Me = class extends O {
	getEngineType() {
		return "snowflake";
	}
	buildIntervalFromISO(e) {
		let t = this.durationToSeconds(e);
		return C`${t}`;
	}
	buildTimeDifferenceSeconds(e, t) {
		return C`DATEDIFF('SECOND', ${t}, ${e})`;
	}
	buildDateAddInterval(e, t) {
		let n = this.parseISODuration(t), r = e;
		return n.years && (r = C`DATEADD('YEAR', ${n.years}, ${r})`), n.months && (r = C`DATEADD('MONTH', ${n.months}, ${r})`), n.days && (r = C`DATEADD('DAY', ${n.days}, ${r})`), n.hours && (r = C`DATEADD('HOUR', ${n.hours}, ${r})`), n.minutes && (r = C`DATEADD('MINUTE', ${n.minutes}, ${r})`), n.seconds && (r = C`DATEADD('SECOND', ${n.seconds}, ${r})`), r;
	}
	buildDateDiffPeriods(e, t, n) {
		let r = n.toUpperCase();
		return C`DATEDIFF('${C.raw(r)}', ${e}::TIMESTAMP, ${t}::TIMESTAMP)`;
	}
	buildPeriodSeriesSubquery(e) {
		return C`(SELECT ROW_NUMBER() OVER (ORDER BY 1) - 1 AS period_number FROM TABLE(GENERATOR(ROWCOUNT => ${e + 1}))) p`;
	}
	buildTimeDimension(e, t) {
		switch (e) {
			case "year": return C`DATE_TRUNC('YEAR', ${t}::TIMESTAMP)`;
			case "quarter": return C`DATE_TRUNC('QUARTER', ${t}::TIMESTAMP)`;
			case "month": return C`DATE_TRUNC('MONTH', ${t}::TIMESTAMP)`;
			case "week": return C`DATE_TRUNC('WEEK', ${t}::TIMESTAMP)`;
			case "day": return C`DATE_TRUNC('DAY', ${t}::TIMESTAMP)::TIMESTAMP`;
			case "hour": return C`DATE_TRUNC('HOUR', ${t}::TIMESTAMP)`;
			case "minute": return C`DATE_TRUNC('MINUTE', ${t}::TIMESTAMP)`;
			case "second": return C`DATE_TRUNC('SECOND', ${t}::TIMESTAMP)`;
			default: return t;
		}
	}
	regexCondition(e, t, n) {
		return n ? C`NOT REGEXP_LIKE(${e}, ${t})` : C`REGEXP_LIKE(${e}, ${t})`;
	}
	castToType(e, t) {
		switch (t) {
			case "timestamp": return C`${e}::TIMESTAMP`;
			case "decimal": return C`${e}::DECIMAL`;
			case "integer": return C`${e}::INTEGER`;
			default: throw Error(`Unsupported cast type: ${t}`);
		}
	}
	tryCastToType(e, t) {
		switch (t) {
			case "timestamp": return C`TRY_CAST(${e} AS TIMESTAMP)`;
			case "decimal": return C`TRY_CAST(${e} AS DECIMAL)`;
			case "integer": return C`TRY_CAST(${e} AS INTEGER)`;
			default: throw Error(`Unsupported cast type: ${t}`);
		}
	}
	getCapabilities() {
		return {
			supportsPercentile: !0,
			supportsLateralJoins: !0,
			supportsPercentileSubqueries: !0,
			supportsLateralSubqueriesInCTE: !1
		};
	}
	buildPercentile(e, t) {
		let n = (t / 100).toString();
		return C`PERCENTILE_CONT(${C.raw(n)}) WITHIN GROUP (ORDER BY ${e})`;
	}
};
//#endregion
//#region src/server/database-utils.ts
function Ne(e) {
	switch (e) {
		case "postgres": return new Ee();
		case "mysql": return new De();
		case "sqlite": return new Oe();
		case "singlestore": return new ke();
		case "duckdb": return new Ae();
		case "databend": return new je();
		case "snowflake": return new Me();
		default: throw Error(`Unsupported database engine: ${e}`);
	}
}
//#endregion
//#region src/server/executors/base-executor.ts
var k = class {
	db;
	schema;
	databaseAdapter;
	constructor(e, t, n) {
		this.db = e, this.schema = t;
		let r = n || this.getEngineType();
		this.databaseAdapter = Ne(r);
	}
};
//#endregion
//#region src/server/explain/explain-tree.ts
function A(e, t, n, r) {
	for (; e.length > 0 && e[e.length - 1].indent >= r;) e.pop();
	if (e.length === 0) t.push(n);
	else {
		let t = e[e.length - 1].op;
		t.children ||= [], t.children.push(n);
	}
	e.push({
		indent: r,
		op: n
	});
}
function Pe(e) {
	let t = 0;
	for (let n of e) if (n === " " || n === "│" || n === "├" || n === "└" || n === "─") t++;
	else break;
	return t;
}
//#endregion
//#region src/server/explain/postgres-parser.ts
function Fe(e, t) {
	let n = e.match(/Planning Time:\s*([\d.]+)\s*ms/i);
	if (n) {
		t.planningTime = parseFloat(n[1]);
		return;
	}
	let r = e.match(/Execution Time:\s*([\d.]+)\s*ms/i);
	if (r) {
		t.executionTime = parseFloat(r[1]);
		return;
	}
	let i = Le(e);
	if (!i) return;
	i.type.includes("Seq Scan") && (t.hasSequentialScans = !0), i.index && t.usedIndexes.push(i.index), t.operations.length === 0 && i.estimatedCost !== void 0 && (t.totalCost = i.estimatedCost);
	let a = e.search(/\S/);
	A(t.stack, t.operations, i, a);
}
function Ie(e, t) {
	let n = {
		operations: [],
		usedIndexes: [],
		hasSequentialScans: !1,
		planningTime: void 0,
		executionTime: void 0,
		totalCost: void 0,
		stack: []
	};
	for (let t of e) Fe(t, n);
	let r = {
		database: "postgres",
		planningTime: n.planningTime,
		executionTime: n.executionTime,
		totalCost: n.totalCost,
		hasSequentialScans: n.hasSequentialScans,
		usedIndexes: [...new Set(n.usedIndexes)]
	};
	return {
		operations: n.operations,
		summary: r,
		raw: e.join("\n"),
		sql: t
	};
}
function Le(e) {
	let t = e.replace(/^[\s->]+/, "").trim();
	if (!t) return null;
	let n = t.match(/^([A-Za-z][A-Za-z0-9 ]+?)(?:\s+using\s+(\S+))?(?:\s+on\s+(\S+))?(?:\s+\w+)?(?:\s+\(cost=([\d.]+)\.\.([\d.]+)\s+rows=(\d+)(?:\s+width=\d+)?\))?(?:\s+\(actual time=([\d.]+)\.\.([\d.]+)\s+rows=(\d+)\s+loops=(\d+)\))?/i);
	if (!n) return t.match(/^Filter:\s*(.+)$/i) || t.match(/^(Hash Cond|Join Filter|Index Cond):\s*(.+)$/i), null;
	let r = n[1].trim(), i = n[2] || void 0, a = n[3] || void 0, o = n[5] ? parseFloat(n[5]) : void 0, s = n[6] ? parseInt(n[6], 10) : void 0, c = n[9] ? parseInt(n[9], 10) : void 0, l = {
		type: r,
		table: a,
		index: i,
		estimatedRows: s,
		estimatedCost: o
	};
	c !== void 0 && (l.actualRows = c);
	let u = e.match(/Filter:\s*(.+?)(?:\)|$)/i);
	return u && (l.filter = u[1].trim()), l;
}
//#endregion
//#region src/server/executors/explain-utils.ts
function j(e, t, n) {
	let r = [];
	if (n === "question") {
		let n = e.split("?");
		r.push(C.raw(n[0]));
		for (let e = 1; e < n.length; e++) r.push(C`${t[e - 1]}`), r.push(C.raw(n[e]));
	} else {
		let n = /\$(\d+)/g, i = 0, a;
		for (; (a = n.exec(e)) !== null;) {
			r.push(C.raw(e.slice(i, a.index)));
			let n = parseInt(a[1], 10) - 1;
			r.push(C`${t[n]}`), i = a.index + a[0].length;
		}
		r.push(C.raw(e.slice(i)));
	}
	return C.join(r);
}
function Re(e) {
	return e && typeof e == "object" ? e : null;
}
function ze(e) {
	if (!Array.isArray(e)) return [];
	let t = [];
	for (let n of e) {
		let e = Re(n);
		e && t.push({
			id: e.id || 1,
			select_type: e.select_type || "SIMPLE",
			table: e.table || null,
			partitions: e.partitions || null,
			type: e.type || "ALL",
			possible_keys: e.possible_keys || null,
			key: e.key || null,
			key_len: e.key_len || null,
			ref: e.ref || null,
			rows: Number(e.rows) || 0,
			filtered: Number(e.filtered) || 100,
			Extra: e.Extra || null
		});
	}
	return t;
}
function Be(e) {
	if (!Array.isArray(e)) return [];
	let t = [];
	for (let n of e) {
		let e = Re(n);
		e && t.push({
			id: Number(e.id) || 0,
			parent: Number(e.parent) || 0,
			notused: Number(e.notused) || 0,
			detail: String(e.detail || "")
		});
	}
	return t;
}
function Ve(e) {
	let t = [];
	for (let n of e) {
		let e = Re(n);
		if (!e) continue;
		let r = e["QUERY PLAN"] || e["query plan"] || e.queryplan;
		typeof r == "string" && t.push(r);
	}
	return t;
}
//#endregion
//#region src/server/executors/postgres-executor.ts
function He(e) {
	return Array.isArray(e) ? e : e && typeof e == "object" && "rows" in e && Array.isArray(e.rows) ? e.rows : [];
}
function Ue(e) {
	return /^-?\d+(\.\d+)?$/.test(e) ? e.includes(".") ? parseFloat(e) : parseInt(e, 10) : !isNaN(parseFloat(e)) && isFinite(parseFloat(e)) ? parseFloat(e) : e;
}
function We(e) {
	switch (typeof e) {
		case "number": return e;
		case "bigint": return Number(e);
		case "object": return Ge(e);
		case "string": return Ue(e);
		default: return e;
	}
}
function Ge(e) {
	if (typeof e.toString == "function") {
		let t = e.toString();
		if (/^-?\d+(\.\d+)?$/.test(t)) return t.includes(".") ? parseFloat(t) : parseInt(t, 10);
	}
	return e.constructor?.name === "Numeric" || e.constructor?.name === "Decimal" || "digits" in e || "sign" in e ? parseFloat(e.toString()) : e;
}
var Ke = class extends k {
	async execute(e, t) {
		if (e && typeof e == "object" && typeof e.execute == "function") {
			let n = await e.execute();
			return Array.isArray(n) ? n.map((e) => this.convertNumericFields(e, t)) : n;
		}
		if (!this.db.execute) throw Error("PostgreSQL database instance must have an execute method");
		let n = await this.db.execute(e), r = He(n);
		return r.length > 0 ? r.map((e) => this.convertNumericFields(e, t)) : n;
	}
	convertNumericFields(e, t) {
		if (!e || typeof e != "object") return e;
		let n = {};
		for (let [r, i] of Object.entries(e)) n[r] = t && t.includes(r) ? this.coerceToNumber(i) : i;
		return n;
	}
	coerceToNumber(e) {
		return e == null ? e : We(e);
	}
	getEngineType() {
		return "postgres";
	}
	async explainQuery(e, t, n) {
		let r = n?.analyze ? "EXPLAIN ANALYZE" : "EXPLAIN";
		if (!this.db.execute) throw Error("PostgreSQL database instance must have an execute method");
		return Ie(Ve(He(await this.db.execute(C`${C.raw(r)} ${j(e, t, "dollar")}`))), {
			sql: e,
			params: t
		});
	}
	async getTableIndexes(e) {
		if (!e || e.length === 0) return [];
		if (!this.db.execute) throw Error("PostgreSQL database instance must have an execute method");
		try {
			let t = e.map((e) => `'${e.toLowerCase()}'`).join(","), n = He(await this.db.execute(C`
        SELECT
          t.relname as table_name,
          i.relname as index_name,
          array_to_string(array_agg(a.attname ORDER BY k.n), ',') as columns,
          ix.indisunique as is_unique,
          ix.indisprimary as is_primary
        FROM pg_index ix
        JOIN pg_class t ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS k(attnum, n) ON true
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
        WHERE n.nspname = 'public'
          AND t.relname IN (${C.raw(t)})
        GROUP BY t.relname, i.relname, ix.indisunique, ix.indisprimary
        ORDER BY t.relname, i.relname
      `));
			return n.length === 0 ? [] : n.map((e) => ({
				table_name: e.table_name,
				index_name: e.index_name,
				columns: e.columns.split(","),
				is_unique: e.is_unique,
				is_primary: e.is_primary
			}));
		} catch (e) {
			return console.warn("Failed to get table indexes:", e), [];
		}
	}
};
function qe(e, t) {
	return new Ke(e, t, "postgres");
}
//#endregion
//#region src/server/explain/mysql-parser.ts
function Je(e, t) {
	let n = t?.toLowerCase() || "";
	switch (e.toLowerCase()) {
		case "all": return "Seq Scan";
		case "index": return n.includes("using index") ? "Index Only Scan" : "Index Scan";
		case "range": return "Index Range Scan";
		case "ref":
		case "eq_ref": return "Index Lookup";
		case "const":
		case "system": return "Const Lookup";
		case "null": return "No Table";
		default: return `MySQL ${e}`;
	}
}
function Ye(e, t) {
	let n = [], r = [], i = !1, a = 0;
	for (let t of e) {
		let e = Je(t.type, t.Extra);
		t.type.toLowerCase() === "all" && (i = !0), t.key && r.push(t.key);
		let o = {
			type: e,
			table: t.table || void 0,
			index: t.key || void 0,
			estimatedRows: t.rows,
			estimatedCost: t.rows
		};
		if (t.Extra) {
			let e = [];
			t.Extra.includes("Using where") && e.push("WHERE filter applied"), t.Extra.includes("Using filesort") && e.push("Filesort required"), t.Extra.includes("Using temporary") && e.push("Temporary table required"), t.Extra.includes("Using join buffer") && e.push("Join buffer used"), e.length > 0 && (o.details = e.join("; ")), o.filter = t.Extra;
		}
		n.push(o), a += t.rows;
	}
	return {
		operations: n,
		summary: {
			database: "mysql",
			planningTime: void 0,
			executionTime: void 0,
			totalCost: a,
			hasSequentialScans: i,
			usedIndexes: [...new Set(r)]
		},
		raw: ["id	select_type	table	type	possible_keys	key	rows	Extra", ...e.map((e) => `${e.id}\t${e.select_type}\t${e.table || "NULL"}\t${e.type}\t${e.possible_keys || "NULL"}\t${e.key || "NULL"}\t${e.rows}\t${e.Extra || ""}`)].join("\n"),
		sql: t
	};
}
//#endregion
//#region src/server/executors/mysql-executor.ts
var Xe = class extends k {
	async execute(e, t) {
		if (e && typeof e == "object" && typeof e.execute == "function") {
			let n = await e.execute();
			return Array.isArray(n) ? n.map((e) => this.convertNumericFields(e, t)) : n;
		}
		if (!this.db.execute) throw Error("MySQL database instance must have an execute method");
		let n = await this.db.execute(e);
		return Array.isArray(n) ? n.map((e) => this.convertNumericFields(e, t)) : n;
	}
	convertNumericFields(e, t) {
		if (!e || typeof e != "object") return e;
		let n = {};
		for (let [r, i] of Object.entries(e)) n[r] = t && t.includes(r) ? this.coerceToNumber(i) : i;
		return n;
	}
	coerceToNumber(e) {
		if (e == null || typeof e == "number") return e;
		if (typeof e == "string") {
			if (/^-?\d+(\.\d+)?$/.test(e)) return e.includes(".") ? parseFloat(e) : parseInt(e, 10);
			if (!isNaN(parseFloat(e)) && isFinite(parseFloat(e))) return parseFloat(e);
		}
		return e;
	}
	getEngineType() {
		return "mysql";
	}
	async explainQuery(e, t, n) {
		let r = n?.analyze ? "EXPLAIN ANALYZE" : "EXPLAIN";
		if (!this.db.execute) throw Error("MySQL database instance must have an execute method");
		return Ye(ze(await this.db.execute(C`${C.raw(r)} ${j(e, t, "question")}`)), {
			sql: e,
			params: t
		});
	}
	async getTableIndexes(e) {
		if (!e || e.length === 0) return [];
		if (!this.db.execute) throw Error("MySQL database instance must have an execute method");
		try {
			let t = e.map((e) => `'${e.toLowerCase()}'`).join(","), n = await this.db.execute(C`
        SELECT
          TABLE_NAME as table_name,
          INDEX_NAME as index_name,
          GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as columns,
          CASE WHEN NON_UNIQUE = 0 THEN TRUE ELSE FALSE END as is_unique,
          CASE WHEN INDEX_NAME = 'PRIMARY' THEN TRUE ELSE FALSE END as is_primary
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND LOWER(TABLE_NAME) IN (${C.raw(t)})
        GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE
        ORDER BY TABLE_NAME, INDEX_NAME
      `);
			return Array.isArray(n) ? n.map((e) => ({
				table_name: e.table_name,
				index_name: e.index_name,
				columns: e.columns.split(","),
				is_unique: !!e.is_unique,
				is_primary: !!e.is_primary
			})) : [];
		} catch (e) {
			return console.warn("Failed to get table indexes:", e), [];
		}
	}
};
function Ze(e, t) {
	return new Xe(e, t, "mysql");
}
//#endregion
//#region src/server/explain/sqlite-parser.ts
function Qe(e) {
	let t = e.toLowerCase(), n = e.match(/^SCAN\s+(\S+)/i);
	if (n) return {
		type: "Seq Scan",
		table: n[1]
	};
	let r = e.match(/^SEARCH\s+(\S+)\s+USING\s+(?:COVERING\s+)?INDEX\s+(\S+)(?:\s+\((.+)\))?/i);
	if (r) return {
		type: "Index Scan",
		table: r[1],
		index: r[2],
		filter: r[3]
	};
	let i = e.match(/^SEARCH\s+(\S+)\s+USING\s+INTEGER\s+PRIMARY\s+KEY\s+\((.+)\)/i);
	if (i) return {
		type: "Primary Key Lookup",
		table: i[1],
		filter: i[2]
	};
	let a = e.match(/^SEARCH\s+(\S+)/i);
	return a ? {
		type: "Search",
		table: a[1]
	} : t.includes("temp b-tree") ? t.includes("order by") ? { type: "Sort" } : t.includes("group by") ? { type: "Group" } : t.includes("distinct") ? { type: "Distinct" } : { type: "Temp B-Tree" } : t.includes("compound") ? { type: "Compound Query" } : t.includes("subquery") ? { type: "Subquery" } : t.includes("co-routine") ? { type: "Coroutine" } : { type: e };
}
function $e(e, t) {
	let n = [], r = [], i = !1, a = /* @__PURE__ */ new Map();
	for (let t of e) {
		let e = Qe(t.detail);
		e.type === "Seq Scan" && (i = !0), e.index && r.push(e.index);
		let o = {
			type: e.type,
			table: e.table,
			index: e.index,
			filter: e.filter,
			details: t.detail
		};
		if (a.set(t.id, o), t.parent === 0) n.push(o);
		else {
			let e = a.get(t.parent);
			e ? (e.children ||= [], e.children.push(o)) : n.push(o);
		}
	}
	return {
		operations: n,
		summary: {
			database: "sqlite",
			planningTime: void 0,
			executionTime: void 0,
			totalCost: void 0,
			hasSequentialScans: i,
			usedIndexes: [...new Set(r)]
		},
		raw: ["id	parent	detail", ...e.map((e) => `${e.id}\t${e.parent}\t${e.detail}`)].join("\n"),
		sql: t
	};
}
//#endregion
//#region src/server/executors/sqlite-executor.ts
var et = class extends k {
	async execute(e, t) {
		if (e && typeof e == "object" && typeof e.execute == "function") {
			let n = await e.execute();
			return Array.isArray(n) ? this.convertNumericFieldsInPlace(n, t) : n;
		}
		try {
			if (this.db.all) {
				let n = this.db.all(e);
				return Array.isArray(n) ? this.convertNumericFieldsInPlace(n, t) : n;
			}
			if (this.db.run) return this.db.run(e);
			throw Error("SQLite database instance must have an all() or run() method");
		} catch (e) {
			throw Error(`SQLite execution failed: ${e instanceof Error ? e.message : "Unknown error"}`, { cause: e });
		}
	}
	convertNumericFieldsInPlace(e, t) {
		if (!t || t.length === 0) return e;
		for (let n = 0; n < e.length; n++) {
			let r = e[n];
			if (!(!r || typeof r != "object")) for (let e of t) {
				let t = r[e];
				t != null && typeof t != "number" && (r[e] = this.coerceToNumber(t));
			}
		}
		return e;
	}
	coerceToNumber(e) {
		if (e == null || typeof e == "number") return e;
		if (typeof e == "string") {
			if (/^-?\d+(\.\d+)?$/.test(e)) return e.includes(".") ? parseFloat(e) : parseInt(e, 10);
			if (!isNaN(parseFloat(e)) && isFinite(parseFloat(e))) return parseFloat(e);
		}
		return e;
	}
	getEngineType() {
		return "sqlite";
	}
	async explainQuery(e, t, n) {
		let r;
		if (this.db.all) r = this.db.all(C`EXPLAIN QUERY PLAN ${j(e, t, "question")}`);
		else throw Error("SQLite database instance must have an all() method for EXPLAIN");
		return $e(Be(r), {
			sql: e,
			params: t
		});
	}
	async getTableIndexes(e) {
		if (!e || e.length === 0) return [];
		if (!this.db.all) throw Error("SQLite database instance must have an all() method");
		try {
			let t = [];
			for (let n of e) {
				let e = this.db.all(C.raw(`SELECT name, "unique", origin FROM pragma_index_list('${n.toLowerCase()}')`));
				if (Array.isArray(e)) for (let r of e) {
					let e = r.name, i = !!r.unique, a = r.origin, o = this.db.all(C.raw(`SELECT name FROM pragma_index_info('${e}') ORDER BY seqno`)), s = [];
					if (Array.isArray(o)) for (let e of o) {
						let t = e.name;
						typeof t == "string" && s.push(t);
					}
					t.push({
						table_name: n.toLowerCase(),
						index_name: e,
						columns: s,
						is_unique: i,
						is_primary: a === "pk"
					});
				}
			}
			return t;
		} catch (e) {
			return console.warn("Failed to get table indexes:", e), [];
		}
	}
};
function tt(e, t) {
	return new et(e, t, "sqlite");
}
//#endregion
//#region src/server/executors/singlestore-executor.ts
var nt = class extends Xe {
	getEngineType() {
		return "singlestore";
	}
};
function rt(e, t) {
	return new nt(e, t);
}
//#endregion
//#region src/server/explain/duckdb-parser.ts
function it(e, t) {
	if (/^[┌├└│─┐┤┘]+$/.test(e.trim()) || /EXPLANATION|QUERY PLAN/i.test(e)) return;
	let n = ot(e);
	if (!n) return;
	(n.type.includes("SEQ_SCAN") || n.type.includes("TABLE_SCAN")) && (t.hasSequentialScans = !0), n.type.includes("INDEX_SCAN") && n.index && t.usedIndexes.push(n.index), t.operations.length === 0 && n.estimatedCost !== void 0 && (t.totalCost = n.estimatedCost);
	let r = Pe(e);
	A(t.stack, t.operations, n, r);
}
function at(e, t) {
	let n = {
		operations: [],
		usedIndexes: [],
		hasSequentialScans: !1,
		totalCost: void 0,
		stack: []
	};
	for (let t of e) it(t, n);
	let r = {
		database: "duckdb",
		planningTime: void 0,
		executionTime: void 0,
		totalCost: n.totalCost,
		hasSequentialScans: n.hasSequentialScans,
		usedIndexes: [...new Set(n.usedIndexes)]
	};
	return {
		operations: n.operations,
		summary: r,
		raw: e.join("\n"),
		sql: t
	};
}
function ot(e) {
	let t = e.replace(/[┌├└│─┐┤┘]/g, "").replace(/^\s*/, "").trim();
	if (!t || t.match(/^\(cost=([\d.]+)\s+rows=(\d+)\)$/i)) return null;
	let n = t.match(/^([A-Z_]+)(?:\s+(\S+))?(?:\s+on\s+(\S+))?(?:\s+\(cost=([\d.]+)\s+rows=(\d+)\))?/i);
	if (!n) {
		let e = t.match(/^FILTER\s+(.+)$/i);
		return e ? {
			type: "FILTER",
			filter: e[1]
		} : null;
	}
	let r = n[1].toUpperCase(), i = n[2] || void 0, a = n[3] || void 0, o = n[4] ? parseFloat(n[4]) : void 0, s = n[5] ? parseInt(n[5], 10) : void 0;
	if (r === "INDEX_SCAN") {
		let e = i, t = a;
		a = e, i = t;
	}
	return {
		type: r,
		table: i,
		index: a,
		estimatedRows: s,
		estimatedCost: o
	};
}
//#endregion
//#region src/server/executors/duckdb-executor.ts
var st = class extends k {
	async execute(e, t) {
		if (e && typeof e == "object" && typeof e.execute == "function") try {
			let n = await e.execute();
			return Array.isArray(n) ? n.map((e) => this.convertNumericFields(e, t)) : n;
		} catch (t) {
			let n = this.extractSqlFromQuery(e);
			throw console.error("[DuckDB] Query execution failed:", {
				error: t instanceof Error ? t.message : String(t),
				sql: n.sql,
				params: n.params
			}), t;
		}
		if (!this.db.execute) throw Error("DuckDB database instance must have an execute method");
		try {
			let n = await this.db.execute(e);
			return Array.isArray(n) ? n.map((e) => this.convertNumericFields(e, t)) : n;
		} catch (t) {
			let n = this.extractSqlFromQuery(e);
			throw console.error("[DuckDB] Query execution failed:", {
				error: t instanceof Error ? t.message : String(t),
				sql: n.sql,
				params: n.params
			}), t;
		}
	}
	extractSqlFromQuery(e) {
		try {
			if (e && typeof e.toSQL == "function") {
				let { sql: t, params: n } = e.toSQL();
				return {
					sql: t,
					params: n
				};
			}
			if (e && typeof e.getSQL == "function") {
				let t = e.getSQL();
				if (t && typeof t.toSQL == "function") {
					let { sql: e, params: n } = t.toSQL();
					return {
						sql: e,
						params: n
					};
				}
			}
			return {
				sql: String(e),
				params: []
			};
		} catch {
			return {
				sql: "[unable to extract SQL]",
				params: []
			};
		}
	}
	convertNumericFields(e, t) {
		if (!e || typeof e != "object") return e;
		let n = {};
		for (let [r, i] of Object.entries(e)) n[r] = t && t.includes(r) ? this.coerceToNumber(i) : i;
		return n;
	}
	coerceToNumber(e) {
		if (e == null || typeof e == "number") return e;
		if (typeof e == "bigint") return Number(e);
		if (e && typeof e == "object") {
			if (typeof e.toString == "function") {
				let t = e.toString();
				if (/^-?\d+(\.\d+)?$/.test(t)) return t.includes(".") ? parseFloat(t) : parseInt(t, 10);
			}
			return e;
		}
		if (typeof e == "string") {
			if (/^-?\d+(\.\d+)?$/.test(e)) return e.includes(".") ? parseFloat(e) : parseInt(e, 10);
			if (!isNaN(parseFloat(e)) && isFinite(parseFloat(e))) return parseFloat(e);
		}
		return e;
	}
	getEngineType() {
		return "duckdb";
	}
	async explainQuery(e, t, n) {
		let r = n?.analyze ? "EXPLAIN ANALYZE" : "EXPLAIN";
		if (!this.db.execute) throw Error("DuckDB database instance must have an execute method");
		let i = await this.db.execute(C`${C.raw(r)} ${j(e, t, "dollar")}`), a = [];
		if (Array.isArray(i)) {
			for (let e of i) if (e && typeof e == "object") {
				let t = e.explain_value || e["QUERY PLAN"] || e.query_plan || e.Plan || Object.values(e)[0];
				typeof t == "string" && a.push(t);
			}
		}
		return at(a, {
			sql: e,
			params: t
		});
	}
	async getTableIndexes(e) {
		if (!e || e.length === 0) return [];
		if (!this.db.execute) throw Error("DuckDB database instance must have an execute method");
		try {
			let t = e.map((e) => `'${e.toLowerCase()}'`).join(","), n = await this.db.execute(C`
        SELECT
          table_name,
          index_name,
          LISTAGG(column_name, ',') WITHIN GROUP (ORDER BY index_oid) as columns,
          is_unique,
          is_primary
        FROM duckdb_indexes()
        WHERE LOWER(table_name) IN (${C.raw(t)})
        GROUP BY table_name, index_name, is_unique, is_primary
        ORDER BY table_name, index_name
      `);
			return Array.isArray(n) ? n.map((e) => ({
				table_name: e.table_name,
				index_name: e.index_name,
				columns: typeof e.columns == "string" ? e.columns.split(",") : [],
				is_unique: !!e.is_unique,
				is_primary: !!e.is_primary
			})) : [];
		} catch (e) {
			return console.warn("Failed to get table indexes:", e), [];
		}
	}
};
function ct(e, t) {
	return new st(e, t, "duckdb");
}
//#endregion
//#region src/server/explain/databend-parser.ts
function lt(e, t) {
	if (!e.trim()) return;
	let n = dt(e);
	if (!n) return;
	(n.type.includes("TableScan") || n.type.includes("SCAN")) && (t.hasSequentialScans = !0), n.type.includes("IndexScan") && n.index && t.usedIndexes.push(n.index), t.operations.length === 0 && n.estimatedCost !== void 0 && (t.totalCost = n.estimatedCost);
	let r = Pe(e);
	A(t.stack, t.operations, n, r);
}
function ut(e, t) {
	let n = {
		operations: [],
		usedIndexes: [],
		hasSequentialScans: !1,
		totalCost: void 0,
		stack: []
	};
	for (let t of e) lt(t, n);
	let r = {
		database: "databend",
		planningTime: void 0,
		executionTime: void 0,
		totalCost: n.totalCost,
		hasSequentialScans: n.hasSequentialScans,
		usedIndexes: [...new Set(n.usedIndexes)]
	};
	return {
		operations: n.operations,
		summary: r,
		raw: e.join("\n"),
		sql: t
	};
}
function dt(e) {
	let t = e.replace(/[┌├└│─┐┤┘]/g, "").replace(/^\s*/, "").trim();
	if (!t || /^(filters|table|estimated rows|output columns|push downs):/.test(t)) return null;
	let n = t.match(/^([A-Z][A-Za-z_]+(?:\s+[A-Z][A-Za-z_]+)*)(?:\s+(\S+))?/);
	if (!n) return null;
	let r = n[1], i = n[2] || void 0, a = t.match(/estimated rows:\s*(\d+)/i);
	return {
		type: r,
		table: i,
		estimatedRows: a ? parseInt(a[1], 10) : void 0
	};
}
//#endregion
//#region src/server/executors/databend-executor.ts
var ft = class extends k {
	async execute(e, t) {
		if (e && typeof e == "object" && typeof e.execute == "function") try {
			let n = await e.execute();
			return Array.isArray(n) ? n.map((e) => this.convertNumericFields(e, t)) : n;
		} catch (t) {
			let n = this.extractSqlFromQuery(e);
			throw console.error("[Databend] Query execution failed:", {
				error: t instanceof Error ? t.message : String(t),
				sql: n.sql,
				params: n.params
			}), t;
		}
		if (!this.db.execute) throw Error("Databend database instance must have an execute method");
		try {
			let n = await this.db.execute(e);
			return Array.isArray(n) ? n.map((e) => this.convertNumericFields(e, t)) : n;
		} catch (t) {
			let n = this.extractSqlFromQuery(e);
			throw console.error("[Databend] Query execution failed:", {
				error: t instanceof Error ? t.message : String(t),
				sql: n.sql,
				params: n.params
			}), t;
		}
	}
	extractSqlFromQuery(e) {
		try {
			if (e && typeof e.toSQL == "function") {
				let { sql: t, params: n } = e.toSQL();
				return {
					sql: t,
					params: n
				};
			}
			if (e && typeof e.getSQL == "function") {
				let t = e.getSQL();
				if (t && typeof t.toSQL == "function") {
					let { sql: e, params: n } = t.toSQL();
					return {
						sql: e,
						params: n
					};
				}
			}
			return {
				sql: String(e),
				params: []
			};
		} catch {
			return {
				sql: "[unable to extract SQL]",
				params: []
			};
		}
	}
	convertNumericFields(e, t) {
		if (!e || typeof e != "object") return e;
		let n = {};
		for (let [r, i] of Object.entries(e)) n[r] = t && t.includes(r) ? this.coerceToNumber(i) : i;
		return n;
	}
	coerceToNumber(e) {
		if (e == null || typeof e == "number") return e;
		if (typeof e == "bigint") return Number(e);
		if (e && typeof e == "object") {
			if (typeof e.toString == "function") {
				let t = e.toString();
				if (/^-?\d+(\.\d+)?$/.test(t)) return t.includes(".") ? parseFloat(t) : parseInt(t, 10);
			}
			return e;
		}
		if (typeof e == "string") {
			if (/^-?\d+(\.\d+)?$/.test(e)) return e.includes(".") ? parseFloat(e) : parseInt(e, 10);
			if (!isNaN(parseFloat(e)) && isFinite(parseFloat(e))) return parseFloat(e);
		}
		return e;
	}
	getEngineType() {
		return "databend";
	}
	async explainQuery(e, t, n) {
		let r = n?.analyze ? "EXPLAIN ANALYZE" : "EXPLAIN";
		if (!this.db.execute) throw Error("Databend database instance must have an execute method");
		let i = await this.db.execute(C`${C.raw(r)} ${j(e, t, "dollar")}`), a = [];
		if (Array.isArray(i)) {
			for (let e of i) if (e && typeof e == "object") {
				let t = e.explain || e["QUERY PLAN"] || e.query_plan || e.Plan || Object.values(e)[0];
				typeof t == "string" && a.push(t);
			}
		}
		return ut(a, {
			sql: e,
			params: t
		});
	}
	async getTableIndexes(e) {
		return !e || e.length, [];
	}
};
function pt(e, t) {
	return new ft(e, t, "databend");
}
//#endregion
//#region src/server/explain/snowflake-parser.ts
function mt(e, t) {
	if (!e.trim()) return;
	let n = _t(e);
	if (!n) return;
	(n.type.includes("TableScan") || n.type.includes("SCAN")) && (t.hasSequentialScans = !0), t.operations.length === 0 && n.estimatedCost !== void 0 && (t.totalCost = n.estimatedCost);
	let r = gt(e);
	A(t.stack, t.operations, n, r);
}
function ht(e, t) {
	let n = {
		operations: [],
		usedIndexes: [],
		hasSequentialScans: !1,
		totalCost: void 0,
		stack: []
	};
	for (let t of e) mt(t, n);
	let r = {
		database: "snowflake",
		planningTime: void 0,
		executionTime: void 0,
		totalCost: n.totalCost,
		hasSequentialScans: n.hasSequentialScans,
		usedIndexes: [...new Set(n.usedIndexes)]
	};
	return {
		operations: n.operations,
		summary: r,
		raw: e.join("\n"),
		sql: t
	};
}
function gt(e) {
	let t = 0;
	for (let n of e) if (n === " " || n === "-" || n === ">") t++;
	else break;
	return t;
}
function _t(e) {
	let t = e.replace(/^[\s\d:]*->/, "").trim();
	if (!t || /^(GlobalStats|partitions|bytes):/i.test(t) || /^\w+=\d+/.test(t)) return null;
	let n = t.match(/^([A-Z][A-Za-z_]+(?:\s+[A-Z][A-Za-z_]+)*)(?:\s+(\S+))?/);
	if (!n) return null;
	let r = n[1], i = n[2] || void 0, a = t.match(/estimated rows:\s*(\d+)/i);
	return {
		type: r,
		table: i,
		estimatedRows: a ? parseInt(a[1], 10) : void 0
	};
}
//#endregion
//#region src/server/executors/snowflake-executor.ts
var vt = class extends k {
	async execute(e, t) {
		if (e && typeof e == "object" && typeof e.execute == "function") try {
			let n = await e.execute();
			return Array.isArray(n) ? n.map((e) => this.convertNumericFields(e, t)) : n;
		} catch (t) {
			let n = this.extractSqlFromQuery(e);
			throw console.error("[Snowflake] Query execution failed:", {
				error: t instanceof Error ? t.message : String(t),
				sql: n.sql,
				params: n.params
			}), t;
		}
		if (!this.db.execute) throw Error("Snowflake database instance must have an execute method");
		try {
			let n = await this.db.execute(e);
			return Array.isArray(n) ? n.map((e) => this.convertNumericFields(e, t)) : n;
		} catch (t) {
			let n = this.extractSqlFromQuery(e);
			throw console.error("[Snowflake] Query execution failed:", {
				error: t instanceof Error ? t.message : String(t),
				sql: n.sql,
				params: n.params
			}), t;
		}
	}
	extractSqlFromQuery(e) {
		try {
			if (e && typeof e.toSQL == "function") {
				let { sql: t, params: n } = e.toSQL();
				return {
					sql: t,
					params: n
				};
			}
			if (e && typeof e.getSQL == "function") {
				let t = e.getSQL();
				if (t && typeof t.toSQL == "function") {
					let { sql: e, params: n } = t.toSQL();
					return {
						sql: e,
						params: n
					};
				}
			}
			return {
				sql: String(e),
				params: []
			};
		} catch {
			return {
				sql: "[unable to extract SQL]",
				params: []
			};
		}
	}
	convertNumericFields(e, t) {
		if (!e || typeof e != "object") return e;
		let n = {};
		for (let [r, i] of Object.entries(e)) n[r] = t && t.includes(r) ? this.coerceToNumber(i) : i;
		return n;
	}
	coerceToNumber(e) {
		if (e == null || typeof e == "number") return e;
		if (typeof e == "bigint") return Number(e);
		if (e && typeof e == "object") {
			if (typeof e.toString == "function") {
				let t = e.toString();
				if (/^-?\d+(\.\d+)?$/.test(t)) return t.includes(".") ? parseFloat(t) : parseInt(t, 10);
			}
			return e;
		}
		if (typeof e == "string") {
			if (/^-?\d+(\.\d+)?$/.test(e)) return e.includes(".") ? parseFloat(e) : parseInt(e, 10);
			if (!isNaN(parseFloat(e)) && isFinite(parseFloat(e))) return parseFloat(e);
		}
		return e;
	}
	getEngineType() {
		return "snowflake";
	}
	async explainQuery(e, t, n) {
		if (n?.analyze, !this.db.execute) throw Error("Snowflake database instance must have an execute method");
		let r = await this.db.execute(C`${C.raw("EXPLAIN")} ${j(e, t, "question")}`), i = [];
		if (Array.isArray(r)) {
			for (let e of r) if (e && typeof e == "object") {
				let t = e.content || e["QUERY PLAN"] || e.plan || Object.values(e)[0];
				typeof t == "string" && i.push(t);
			}
		}
		return ht(i, {
			sql: e,
			params: t
		});
	}
	async getTableIndexes(e) {
		return [];
	}
};
function yt(e, t) {
	return new vt(e, t, "snowflake");
}
//#endregion
//#region src/server/executors/index.ts
function bt(e, t, n) {
	if (n) switch (n) {
		case "postgres": return qe(e, t);
		case "mysql": return Ze(e, t);
		case "sqlite": return tt(e, t);
		case "singlestore": return rt(e, t);
		case "duckdb": return ct(e, t);
		case "databend": return pt(e, t);
		case "snowflake": return yt(e, t);
	}
	if (e.all && e.run) return tt(e, t);
	if (e.execute) return qe(e, t);
	throw Error("Unable to determine database engine type. Please specify engineType parameter.");
}
//#endregion
//#region src/server/filter-cache.ts
function M(e) {
	if ("and" in e) return `and:[${e.and.map(M).sort().join(",")}]`;
	if ("or" in e) return `or:[${e.or.map(M).sort().join(",")}]`;
	let t = e, n = JSON.stringify(Array.isArray(t.values) ? [...t.values].sort() : t.values), r = t.dateRange ? `:dr:${JSON.stringify(t.dateRange)}` : "";
	return `${t.member}:${t.operator}:${n}${r}`;
}
function xt(e, t) {
	return `timeDim:${e}:${JSON.stringify(t)}`;
}
var N = class {
	cache = /* @__PURE__ */ new Map();
	stats = {
		hits: 0,
		misses: 0
	};
	getOrBuild(e, t) {
		let n = this.cache.get(e);
		if (n !== void 0) return this.stats.hits++, n;
		let r = t();
		return r && this.cache.set(e, r), this.stats.misses++, r;
	}
	has(e) {
		return this.cache.has(e);
	}
	get(e) {
		let t = this.cache.get(e);
		return t !== void 0 && this.stats.hits++, t;
	}
	preload(e) {
		for (let { key: t, sql: n } of e) this.cache.has(t) || this.cache.set(t, n);
	}
	set(e, t) {
		this.cache.set(e, t);
	}
	getStats() {
		return {
			...this.stats,
			cacheSize: this.cache.size
		};
	}
	clear() {
		this.cache.clear(), this.stats = {
			hits: 0,
			misses: 0
		};
	}
};
function St(e) {
	let t = [];
	for (let n of e) "and" in n && n.and ? t.push(...St(n.and)) : "or" in n && n.or ? t.push(...St(n.or)) : "member" in n && t.push(n);
	return t;
}
//#endregion
//#region src/server/builders/date-time-helpers.ts
function Ct(e, t) {
	return e.isTimestampInteger() ? e.getEngineType() === "sqlite" ? Math.floor(t / 1e3) : t : new Date(t).toISOString();
}
function P(e, t) {
	return Ct(e, t.getTime());
}
function wt(e, t) {
	return typeof t == "number" ? /* @__PURE__ */ new Date(t * (e.getEngineType() === "sqlite" ? 1e3 : 1)) : new Date(t);
}
function Tt(e) {
	return typeof e == "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.trim());
}
function Et(e) {
	if (e instanceof Date) return isNaN(e.getTime()) ? null : e;
	if (typeof e == "number") {
		let t = e < 1e10 ? e * 1e3 : e, n = new Date(t);
		return isNaN(n.getTime()) ? null : n;
	}
	if (typeof e == "string") {
		let t = Tt(e) ? /* @__PURE__ */ new Date(e + "T00:00:00Z") : new Date(e);
		return isNaN(t.getTime()) ? null : t;
	}
	let t = new Date(e);
	return isNaN(t.getTime()) ? null : t;
}
function Dt(e, t) {
	if (!t) return null;
	let n = Et(t);
	return n ? P(e, n) : null;
}
var Ot = (e) => {
	let t = new Date(e);
	return t.setUTCHours(0, 0, 0, 0), t;
}, F = (e) => {
	let t = new Date(e);
	return t.setUTCHours(23, 59, 59, 999), t;
}, kt = {
	today: ({ now: e }) => ({
		start: Ot(e),
		end: F(e)
	}),
	yesterday: ({ now: e, utcDate: t }) => {
		let n = new Date(e);
		n.setUTCDate(t - 1), n.setUTCHours(0, 0, 0, 0);
		let r = new Date(e);
		return r.setUTCDate(t - 1), r.setUTCHours(23, 59, 59, 999), {
			start: n,
			end: r
		};
	},
	"this week": ({ now: e, utcDate: t, utcDay: n }) => {
		let r = n === 0 ? -6 : 1 - n, i = new Date(e);
		i.setUTCDate(t + r), i.setUTCHours(0, 0, 0, 0);
		let a = new Date(i);
		return a.setUTCDate(i.getUTCDate() + 6), a.setUTCHours(23, 59, 59, 999), {
			start: i,
			end: a
		};
	},
	"this month": ({ utcYear: e, utcMonth: t }) => ({
		start: new Date(Date.UTC(e, t, 1, 0, 0, 0, 0)),
		end: new Date(Date.UTC(e, t + 1, 0, 23, 59, 59, 999))
	}),
	"this quarter": ({ utcYear: e, utcMonth: t }) => {
		let n = Math.floor(t / 3);
		return {
			start: new Date(Date.UTC(e, n * 3, 1, 0, 0, 0, 0)),
			end: new Date(Date.UTC(e, n * 3 + 3, 0, 23, 59, 59, 999))
		};
	},
	"this year": ({ utcYear: e }) => ({
		start: new Date(Date.UTC(e, 0, 1, 0, 0, 0, 0)),
		end: new Date(Date.UTC(e, 11, 31, 23, 59, 59, 999))
	}),
	"last week": ({ now: e, utcDate: t, utcDay: n }) => {
		let r = n === 0 ? -13 : -6 - n, i = new Date(e);
		i.setUTCDate(t + r), i.setUTCHours(0, 0, 0, 0);
		let a = new Date(i);
		return a.setUTCDate(i.getUTCDate() + 6), a.setUTCHours(23, 59, 59, 999), {
			start: i,
			end: a
		};
	},
	"last month": ({ utcYear: e, utcMonth: t }) => ({
		start: new Date(Date.UTC(e, t - 1, 1, 0, 0, 0, 0)),
		end: new Date(Date.UTC(e, t, 0, 23, 59, 59, 999))
	}),
	"last quarter": ({ utcYear: e, utcMonth: t }) => {
		let n = Math.floor(t / 3), r = n === 0 ? 3 : n - 1, i = n === 0 ? e - 1 : e;
		return {
			start: new Date(Date.UTC(i, r * 3, 1, 0, 0, 0, 0)),
			end: new Date(Date.UTC(i, r * 3 + 3, 0, 23, 59, 59, 999))
		};
	},
	"last year": ({ utcYear: e }) => ({
		start: new Date(Date.UTC(e - 1, 0, 1, 0, 0, 0, 0)),
		end: new Date(Date.UTC(e - 1, 11, 31, 23, 59, 59, 999))
	}),
	"last 12 months": ({ now: e, utcYear: t, utcMonth: n }) => ({
		start: new Date(Date.UTC(t, n - 11, 1, 0, 0, 0, 0)),
		end: F(e)
	})
}, At = [
	{
		re: /^last\s+(\d+)\s+days?$/,
		build: (e, { now: t, utcDate: n }) => {
			let r = new Date(t);
			return r.setUTCDate(n - e + 1), r.setUTCHours(0, 0, 0, 0), {
				start: r,
				end: F(t)
			};
		}
	},
	{
		re: /^last\s+(\d+)\s+weeks?$/,
		build: (e, { now: t, utcDate: n }) => {
			let r = new Date(t);
			return r.setUTCDate(n - e * 7 + 1), r.setUTCHours(0, 0, 0, 0), {
				start: r,
				end: F(t)
			};
		}
	},
	{
		re: /^last\s+(\d+)\s+months?$/,
		build: (e, { now: t, utcYear: n, utcMonth: r }) => ({
			start: new Date(Date.UTC(n, r - e + 1, 1, 0, 0, 0, 0)),
			end: F(t)
		})
	},
	{
		re: /^last\s+(\d+)\s+years?$/,
		build: (e, { now: t, utcYear: n }) => ({
			start: new Date(Date.UTC(n - e, 0, 1, 0, 0, 0, 0)),
			end: F(t)
		})
	}
];
function jt(e) {
	let t = /* @__PURE__ */ new Date(), n = e.toLowerCase().trim(), r = {
		now: t,
		utcYear: t.getUTCFullYear(),
		utcMonth: t.getUTCMonth(),
		utcDate: t.getUTCDate(),
		utcDay: t.getUTCDay()
	}, i = kt[n];
	if (i) return i(r);
	for (let { re: e, build: t } of At) {
		let i = n.match(e);
		if (i) return t(parseInt(i[1], 10), r);
	}
	return null;
}
//#endregion
//#region src/server/builders/date-time-builder.ts
var I = class {
	databaseAdapter;
	constructor(e) {
		this.databaseAdapter = e;
	}
	buildTimeDimensionExpression(e, t, n) {
		let r = l(e, n);
		return t ? this.databaseAdapter.buildTimeDimension(t, r) : r instanceof ie ? r : C`${r}`;
	}
	buildDateRangeCondition(e, t) {
		return t ? Array.isArray(t) ? this.buildArrayDateRangeCondition(e, t) : typeof t == "string" ? this.buildStringDateRangeCondition(e, t) : null : null;
	}
	rangeBetween(e, t, n) {
		return w(s(e, t), x(e, n));
	}
	endOfDayValue(e) {
		let t = wt(this.databaseAdapter, e);
		return t.setUTCHours(23, 59, 59, 999), P(this.databaseAdapter, t);
	}
	buildArrayDateRangeCondition(e, t) {
		if (t.length < 2) return null;
		let n = this.normalizeDate(t[0]), r = this.normalizeDate(t[1]);
		return !n || !r ? null : (Tt(t[1]) && (r = this.endOfDayValue(r)), this.rangeBetween(e, n, r));
	}
	buildStringDateRangeCondition(e, t) {
		let n = this.parseRelativeDateRange(t);
		if (n) {
			let t = P(this.databaseAdapter, n.start), r = P(this.databaseAdapter, n.end);
			return this.rangeBetween(e, t, r);
		}
		let r = this.normalizeDate(t);
		if (!r) return null;
		let i = wt(this.databaseAdapter, r), a = new Date(i);
		a.setUTCHours(0, 0, 0, 0);
		let o = new Date(i);
		return o.setUTCHours(23, 59, 59, 999), this.rangeBetween(e, P(this.databaseAdapter, a), P(this.databaseAdapter, o));
	}
	parseRelativeDateRange(e) {
		return jt(e);
	}
	normalizeDate(e) {
		return Dt(this.databaseAdapter, e);
	}
}, Mt = (e) => {
	let { fieldExpr: t, filteredValues: n, value: r, field: i, databaseAdapter: a, dateTimeBuilder: o } = e;
	if (n.length > 1) {
		if (i?.type === "time") {
			let e = n.map((e) => o.normalizeDate(e) || e);
			return d(t, e);
		}
		return d(t, n);
	}
	if (n.length === 1) {
		let e = i?.type === "time" && o.normalizeDate(r) || r;
		return b(t, e);
	}
	return a.buildBooleanLiteral(!1);
}, Nt = (e) => {
	let { fieldExpr: t, filteredValues: n, value: r } = e;
	return n.length > 1 ? g(t, n) : n.length === 1 ? re(t, r) : null;
}, L = (e) => ({ fieldExpr: t, value: n, databaseAdapter: r }) => r.buildStringCondition(t, e, n), Pt = ({ fieldExpr: e, value: t }) => te(e, t), Ft = ({ fieldExpr: e, value: t }) => s(e, t), It = ({ fieldExpr: e, value: t }) => ne(e, t), Lt = ({ fieldExpr: e, value: t }) => x(e, t), Rt = ({ fieldExpr: e }) => se(e), zt = ({ fieldExpr: e }) => u(e), Bt = (e) => {
	let { fieldExpr: t, values: n, filteredValues: r, databaseAdapter: i, dateTimeBuilder: a } = e;
	if (r.length === 1 && typeof r[0] == "string") {
		let e = a.parseRelativeDateRange(r[0]);
		if (e) {
			let n = a.normalizeDate(e.start.toISOString()), r = a.normalizeDate(e.end.toISOString());
			if (n && r) return w(s(t, n), x(t, r));
		}
		return null;
	}
	if (r.length < 2) return null;
	let o = a.normalizeDate(r[0]), c = a.normalizeDate(r[1]);
	if (!o || !c) return null;
	let l = n[1];
	if (typeof l == "string" && /^\d{4}-\d{2}-\d{2}$/.test(l.trim())) {
		let e = typeof c == "number" ? /* @__PURE__ */ new Date(c * (i.getEngineType() === "sqlite" ? 1e3 : 1)) : new Date(c), t = new Date(e);
		t.setUTCHours(23, 59, 59, 999), c = i.isTimestampInteger() ? i.getEngineType() === "sqlite" ? Math.floor(t.getTime() / 1e3) : t.getTime() : t.toISOString();
	}
	return w(s(t, o), x(t, c));
}, Vt = ({ fieldExpr: e, value: t, dateTimeBuilder: n }) => {
	let r = n.normalizeDate(t);
	return r ? ne(e, r) : null;
}, Ht = ({ fieldExpr: e, value: t, dateTimeBuilder: n }) => {
	let r = n.normalizeDate(t);
	return r ? te(e, r) : null;
}, Ut = ({ fieldExpr: e, filteredValues: t }) => t.length >= 2 ? w(s(e, t[0]), x(e, t[1])) : null, Wt = ({ fieldExpr: t, filteredValues: n }) => n.length >= 2 ? e(ne(t, n[0]), te(t, n[1])) : null, Gt = ({ fieldExpr: e, filteredValues: t }) => t.length > 0 ? d(e, t) : null, Kt = ({ fieldExpr: e, filteredValues: t }) => t.length > 0 ? g(e, t) : null, qt = ({ fieldExpr: t }) => e(u(t), b(t, "")), Jt = ({ fieldExpr: e }) => w(se(e), re(e, "")), Yt = (e) => ({ fieldExpr: t, filteredValues: n, databaseAdapter: r }) => r.getEngineType() === "postgres" ? e(t, n) : null, Xt = {
	equals: Mt,
	notEquals: Nt,
	contains: L("contains"),
	notContains: L("notContains"),
	startsWith: L("startsWith"),
	endsWith: L("endsWith"),
	gt: Pt,
	gte: Ft,
	lt: It,
	lte: Lt,
	set: Rt,
	notSet: zt,
	inDateRange: Bt,
	beforeDate: Vt,
	afterDate: Ht,
	between: Ut,
	notBetween: Wt,
	in: Gt,
	notIn: Kt,
	like: L("like"),
	notLike: L("notLike"),
	ilike: L("ilike"),
	regex: L("regex"),
	notRegex: L("notRegex"),
	isEmpty: qt,
	isNotEmpty: Jt,
	arrayContains: Yt(ee),
	arrayOverlaps: Yt(c),
	arrayContained: Yt(n)
};
function Zt(e, t) {
	let n = Xt[e];
	return n ? n(t) : null;
}
//#endregion
//#region src/server/builders/analysis-utils.ts
function R(e) {
	if (e.length !== 0) return e.length === 1 ? e[0] : w(...e);
}
function z(e) {
	if ("type" in e && "filters" in e) {
		let t = e;
		if (t.type === "and" || t.type === "or") return {
			isAnd: t.type === "and",
			filters: t.filters ?? []
		};
	}
	return null;
}
function Qt(e) {
	let t = e.split(".");
	return t.length > 1 ? t[1] : t[0];
}
function $t(e) {
	return {
		noMapping: ({ cubeName: t }) => S(`${e}.noBindingKeyMapping`, { cubeName: t }),
		keyDimNotFound: ({ bindingKey: t }) => S(`${e}.bindingKeyDimNotFound`, { bindingKey: t }),
		mappingDimNotFound: ({ dimension: t }) => S(`${e}.bindingKeyMappingDimNotFound`, { dimension: t })
	};
}
function en(e, t, n, r) {
	if (!n) return e;
	let i = n.get(t);
	if (!i) throw Error(r.cubeNotFound({ cubeName: t }));
	return i;
}
function tn(e, t, n, r, i) {
	if (typeof e == "string") {
		let [a] = e.split("."), o = Qt(e), s = en(t, a, i, r).dimensions?.[o];
		if (!s) throw Error(r.keyDimNotFound({
			bindingKey: e,
			cubeName: a,
			dimName: o
		}));
		return l(s.sql, n);
	}
	let a = e.find((e) => e.cube === t.name);
	if (!a) throw Error(r.noMapping({ cubeName: t.name }));
	let o = Qt(a.dimension), s = en(t, a.cube, i, r).dimensions?.[o];
	if (!s) throw Error(r.mappingDimNotFound({
		dimension: a.dimension,
		cubeName: a.cube,
		dimName: o
	}));
	return l(s.sql, n);
}
function nn(e, t, n, r) {
	if (typeof e == "string") {
		let [, i] = e.split("."), a = t.dimensions?.[i];
		if (!a) throw Error(S(`${r}.timeDimNotFound`, { timeDimension: e }));
		return l(a.sql, n);
	}
	let i = e.find((e) => e.cube === t.name);
	if (!i) throw Error(S(`${r}.noTimeDimMapping`, { cubeName: t.name }));
	let [, a] = i.dimension.split("."), o = t.dimensions?.[a];
	if (!o) throw Error(S(`${r}.timeDimMappingNotFound`, { dimension: i.dimension }));
	return l(o.sql, n);
}
//#endregion
//#region src/server/builders/filter-builder.ts
var B = class {
	databaseAdapter;
	dateTimeBuilder;
	constructor(e, t) {
		this.databaseAdapter = e, this.dateTimeBuilder = t;
	}
	buildFilterCondition(e, t, n, r, i) {
		if (i !== void 0) {
			if (t !== "inDateRange") throw Error(`dateRange can only be used with 'inDateRange' operator, but got '${t}'. Use explicit date values in the 'values' array for other date operators.`);
			if (r && r.type !== "time") throw Error(`dateRange can only be used on time dimensions, but field '${r.name || "unknown"}' has type '${r.type}'`);
			return this.dateTimeBuilder.buildDateRangeCondition(e, i);
		}
		if (!n || n.length === 0) return t === "equals" ? this.databaseAdapter.buildBooleanLiteral(!1) : null;
		let a = n.filter((e) => !(e == null || e === "" || typeof e == "string" && e.includes("\0"))).map(this.databaseAdapter.convertFilterValue);
		if (a.length === 0 && !["set", "notSet"].includes(t)) return t === "equals" ? this.databaseAdapter.buildBooleanLiteral(!1) : null;
		let o = a[0];
		return Zt(t, {
			fieldExpr: e,
			values: n,
			filteredValues: a,
			value: o,
			field: r,
			databaseAdapter: this.databaseAdapter,
			dateTimeBuilder: this.dateTimeBuilder
		});
	}
	buildLogicalFilter(e, t, n) {
		return "and" in e && e.and ? this.combineFilters(e.and, !0, t, n) : "or" in e && e.or ? this.combineFilters(e.or, !1, t, n) : null;
	}
	combineFilters(t, n, r, i) {
		let a = t.map((e) => this.buildSingleFilter(e, r, i)).filter((e) => e !== null);
		return a.length === 0 ? null : a.length === 1 ? a[0] : n ? w(...a) : e(...a);
	}
	buildSingleFilter(e, t, n) {
		if ("and" in e || "or" in e) return this.buildLogicalFilter(e, t, n);
		let r = z(e);
		if (r) return this.combineFilters(r.filters, r.isAnd, t, n);
		let i = e, [a, s] = i.member.split("."), c = t.get(a);
		if (!c) return null;
		let l = c.dimensions?.[s];
		if (!l) return null;
		let u = o(l, n);
		return this.buildFilterCondition(u, i.operator, i.values, l, i.dateRange);
	}
}, rn = [
	"lag",
	"lead",
	"rank",
	"denseRank",
	"rowNumber",
	"ntile",
	"firstValue",
	"lastValue",
	"movingAvg",
	"movingSum"
];
function V(e) {
	return rn.includes(e);
}
function an(e) {
	return V(e.type) && e.windowConfig?.measure !== void 0;
}
function on(e, t) {
	if (!e.windowConfig?.measure) return null;
	let n = e.windowConfig.measure;
	return n.includes(".") ? n : `${t}.${n}`;
}
function sn(e) {
	switch (e) {
		case "lag":
		case "lead": return "difference";
		default: return "raw";
	}
}
function cn(e, t) {
	let n = [], r = [], i = /* @__PURE__ */ new Set();
	for (let a of e) {
		let [e, o] = a.split("."), s = t.get(e);
		if (s?.measures?.[o]) {
			let t = s.measures[o];
			if (an(t)) {
				r.push(a);
				let n = on(t, e);
				n && i.add(n);
			} else V(t.type) || n.push(a);
		}
	}
	return {
		aggregateMeasures: n,
		postAggWindowMeasures: r,
		requiredBaseMeasures: i
	};
}
function ln(e, t) {
	return cn(e, t).postAggWindowMeasures.length > 0;
}
//#endregion
//#region src/server/resolvers/calculated-measure-resolver.ts
function un(e) {
	let t = [], n = [];
	for (let [n, r] of e) r.inDegree === 0 && t.push(n);
	for (; t.length > 0;) {
		let r = t.shift();
		n.push(r);
		for (let [n, i] of e) i.dependencies.has(r) && (i.inDegree--, i.inDegree === 0 && t.push(n));
	}
	return n;
}
var H = class {
	dependencyGraph;
	cubes;
	constructor(e) {
		this.cubes = e instanceof Map ? e : /* @__PURE__ */ new Map([[e.name, e]]), this.dependencyGraph = /* @__PURE__ */ new Map();
	}
	extractDependencies(e) {
		if (e.length > 1e3) return [];
		let t = e.matchAll(/\{([^}]+)\}/g), n = [];
		for (let e of t) {
			let t = e[1].trim();
			if (t.includes(".")) {
				let [e, r] = t.split(".");
				n.push({
					measureName: t,
					cubeName: e.trim(),
					fieldName: r.trim()
				});
			} else n.push({
				measureName: t,
				cubeName: null,
				fieldName: t
			});
		}
		return n;
	}
	buildGraph(e) {
		for (let [t, n] of Object.entries(e.measures)) if (n.type === "calculated" && n.calculatedSql) {
			let r = `${e.name}.${t}`, i = this.extractDependencies(n.calculatedSql), a = /* @__PURE__ */ new Set();
			for (let t of i) {
				let n = `${t.cubeName || e.name}.${t.fieldName}`;
				a.add(n);
			}
			this.dependencyGraph.set(r, {
				id: r,
				dependencies: a,
				inDegree: 0
			});
		}
		this.calculateInDegrees();
	}
	buildGraphForMultipleCubes(e) {
		for (let t of e.values()) this.buildGraph(t);
	}
	calculateInDegrees() {
		for (let e of this.dependencyGraph.values()) e.inDegree = 0;
		for (let e of this.dependencyGraph.values()) for (let t of e.dependencies) {
			let e = this.dependencyGraph.get(t);
			e && e.inDegree++;
		}
	}
	topologicalSort(e) {
		let t = this.buildSubgraph(e), n = un(t);
		if (n.length < t.size) {
			let e = this.detectCycle();
			throw Error(`Circular dependency detected in calculated measures: ${e ? e.join(" -> ") : "unknown cycle"}`);
		}
		return n;
	}
	buildSubgraph(e) {
		let t = /* @__PURE__ */ new Map();
		for (let n of e) {
			let e = this.dependencyGraph.get(n);
			e && t.set(n, {
				id: e.id,
				dependencies: new Set(e.dependencies),
				inDegree: 0
			});
		}
		for (let e of t.values()) {
			let n = 0;
			for (let r of e.dependencies) t.has(r) && n++;
			e.inDegree = n;
		}
		return t;
	}
	detectCycle() {
		let e = /* @__PURE__ */ new Set(), t = /* @__PURE__ */ new Set(), n = [];
		for (let r of this.dependencyGraph.keys()) if (!e.has(r)) {
			let i = this.dfs(r, e, t, n);
			if (i) return i;
		}
		return null;
	}
	dfs(e, t, n, r) {
		t.add(e), n.add(e), r.push(e);
		let i = this.dependencyGraph.get(e);
		if (!i) return r.pop(), n.delete(e), null;
		for (let e of i.dependencies) if (!t.has(e)) {
			let i = this.dfs(e, t, n, r);
			if (i) return i;
		} else if (n.has(e)) {
			let t = r.indexOf(e);
			return [...r.slice(t), e];
		}
		return r.pop(), n.delete(e), null;
	}
	getAllDependencies(e) {
		let t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), r = (e) => {
			if (n.has(e)) return;
			n.add(e);
			let i = this.dependencyGraph.get(e);
			if (i) for (let e of i.dependencies) t.add(e), r(e);
		};
		return r(e), t;
	}
	validateDependencies(e) {
		for (let [t, n] of Object.entries(e.measures)) if (n.type === "calculated" && n.calculatedSql) {
			let r = this.extractDependencies(n.calculatedSql);
			for (let n of r) {
				let r = n.cubeName || e.name, i = this.cubes.get(r);
				if (!i) throw Error(`Calculated measure '${e.name}.${t}' references unknown cube '${r}'`);
				if (!i.measures[n.fieldName]) throw Error(`Calculated measure '${e.name}.${t}' references unknown measure '${n.measureName}'`);
				if (r === e.name && n.fieldName === t) throw Error(`Calculated measure '${e.name}.${t}' cannot reference itself`);
			}
		}
	}
	populateDependencies(e) {
		for (let [, t] of Object.entries(e.measures)) t.type === "calculated" && t.calculatedSql && !t.dependencies && (t.dependencies = this.extractDependencies(t.calculatedSql).map((e) => e.measureName));
	}
	static isCalculatedMeasure(e) {
		return e.type === "calculated" && !!e.calculatedSql;
	}
};
//#endregion
//#region src/server/template-substitution.ts
function dn(e, t) {
	let { cube: n, allCubes: r, resolvedMeasures: i } = t, a = fn(e), o = /* @__PURE__ */ new Map();
	for (let e of a) {
		let { originalRef: t, cubeName: a, fieldName: s } = e, c = a || n.name;
		if (!r.get(c)) throw Error(S("server.validation.template.substituteTargetCubeNotFound", {
			ref: `{${t}}`,
			cubeName: c
		}));
		let l = `${c}.${s}`, u = i.get(l);
		if (!u) throw Error(S("server.validation.template.substituteMeasureNotResolved", {
			ref: `{${t}}`,
			measureName: l
		}));
		let d = u(), f = C`${d}`;
		o.set(t, f);
	}
	let s = [], c = [], l = 0;
	for (let t of a) {
		let n = `{${t.originalRef}}`, r = e.indexOf(n, l);
		if (r >= 0) {
			s.push(e.substring(l, r));
			let i = o.get(t.originalRef);
			i && c.push(i), l = r + n.length;
		}
	}
	if (s.push(e.substring(l)), c.length === 0) return C.raw(e);
	let u = [];
	for (let e = 0; e < s.length; e++) s[e] && u.push(new le(s[e])), e < c.length && u.push(c[e]);
	return C.join(u, C.raw(""));
}
function fn(e) {
	if (e.length > 1e3) return [];
	let t = e.matchAll(/\{([^}]+)\}/g), n = [];
	for (let e of t) {
		let t = e[1].trim();
		if (t.includes(".")) {
			let [e, r] = t.split(".").map((e) => e.trim());
			n.push({
				originalRef: t,
				cubeName: e,
				fieldName: r
			});
		} else n.push({
			originalRef: t,
			cubeName: null,
			fieldName: t
		});
	}
	return n;
}
function pn(e) {
	let t = [], n = 0;
	for (let r = 0; r < e.length; r++) if (e[r] === "{") n++;
	else if (e[r] === "}" && (n--, n < 0)) {
		t.push(S("server.validation.template.unmatchedClosingBrace", { position: r }));
		break;
	}
	n > 0 && t.push(S("server.validation.template.unmatchedOpeningBrace")), /\{\s*\}/.test(e) && t.push(S("server.validation.template.emptyReference")), /\{[^}]*\{/.test(e) && t.push(S("server.validation.template.nestedBraces"));
	let r = fn(e);
	for (let e of r) {
		let n = e.cubeName ? `${e.cubeName}.${e.fieldName}` : e.fieldName;
		/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(n) || t.push(S("server.validation.template.invalidMemberReference", { ref: `{${e.originalRef}}` })), n.split(".").length > 2 && t.push(S("server.validation.template.multipleDots", { ref: `{${e.originalRef}}` }));
	}
	return {
		isValid: t.length === 0,
		errors: t
	};
}
function mn(e, t) {
	let n = fn(e), r = /* @__PURE__ */ new Set();
	for (let e of n) {
		let n = `${e.cubeName || t}.${e.fieldName}`;
		r.add(n);
	}
	return Array.from(r);
}
//#endregion
//#region src/server/builders/measure-builder.ts
var U = class e {
	databaseAdapter;
	constructor(e) {
		this.databaseAdapter = e;
	}
	buildResolvedMeasures(e, t, n, r) {
		let i = /* @__PURE__ */ new Map(), a = [], o = [], s = new Set(e), c = new H(t);
		for (let e of t.values()) c.buildGraph(e);
		for (let n of e) this.classifyRequestedMeasure(n, t, c, a, o, s);
		for (let e of s) this.classifyDependencyMeasure(e, t, a, o);
		for (let e of a) {
			let [a, o] = e.split("."), s = t.get(a), c = s.measures[o];
			if (r) {
				let t = r(e, c, s);
				i.set(e, () => t);
			} else i.set(e, () => this.buildMeasureExpression(c, n, s));
		}
		if (o.length > 0) {
			let e = c.topologicalSort(o);
			for (let r of e) {
				let [e, a] = r.split("."), o = t.get(e), s = o.measures[a];
				i.set(r, () => this.buildCalculatedMeasure(s, o, t, i, n));
			}
		}
		return i;
	}
	classifyRequestedMeasure(t, n, r, i, a, o) {
		let [s, c] = t.split("."), l = n.get(s)?.measures?.[c];
		if (l) {
			if (e.isPostAggregationWindow(l)) {
				let t = e.getWindowBaseMeasure(l, s);
				t && o.add(t);
				return;
			}
			if (!H.isCalculatedMeasure(l)) {
				i.push(t);
				return;
			}
			a.push(t), this.collectCalculatedDependencies(t, l, s, n, r, o);
		}
	}
	collectCalculatedDependencies(e, t, n, r, i, a) {
		mn(t.calculatedSql, n).forEach((e) => a.add(e));
		for (let t of i.getAllDependencies(e)) {
			let [e, n] = t.split("."), i = r.get(e)?.measures?.[n];
			i && H.isCalculatedMeasure(i) && mn(i.calculatedSql, e).forEach((e) => a.add(e));
		}
	}
	classifyDependencyMeasure(t, n, r, i) {
		let [a, o] = t.split("."), s = n.get(a)?.measures?.[o];
		s && (e.isPostAggregationWindow(s) || (H.isCalculatedMeasure(s) ? i.includes(t) || i.push(t) : r.includes(t) || r.push(t)));
	}
	buildCalculatedMeasure(e, t, n, r, i) {
		if (!e.calculatedSql) throw Error(`Calculated measure '${t.name}.${e.name}' missing calculatedSql property`);
		return dn(this.databaseAdapter.preprocessCalculatedTemplate(e.calculatedSql), {
			cube: t,
			allCubes: n,
			resolvedMeasures: r,
			queryContext: i
		});
	}
	buildCTECalculatedMeasure(e, t, n, r, i) {
		if (!e.calculatedSql) throw Error(`Calculated measure '${t.name}.${e.name || "unknown"}' missing calculatedSql property`);
		let a = /* @__PURE__ */ new Map(), o = mn(e.calculatedSql, t.name);
		for (let e of o) {
			let [t, i] = e.split("."), o = r.get(t);
			if (o && o.measures[i]) {
				let t = o.measures[i];
				if (n.measures.includes(e)) {
					let r = C`${C.identifier(n.cteAlias)}.${C.identifier(i)}`, o = this.reAggregateCteColumn(t.type, r);
					a.set(e, () => o);
				}
			}
		}
		return this.buildCalculatedMeasure(e, t, r, a, i);
	}
	reAggregateCteColumn(e, t) {
		switch (e) {
			case "avg": return this.databaseAdapter.buildAvg(t);
			case "min": return he(t);
			case "max": return D(t);
			default: return E(t);
		}
	}
	buildHavingMeasureExpression(e, t, n, r, i) {
		let a = i?.preAggregationCTEs?.find((t) => t.cube.name === e);
		return a && a.measures.includes(`${e}.${t}`) && i ? this.buildHavingCteMeasure(e, t, n, r, i, a) : this.buildMeasureExpression(n, r);
	}
	buildHavingCteMeasure(e, t, n, r, i, a) {
		if (n.type === "calculated" && n.calculatedSql) {
			let t = i.primaryCube.name === e ? i.primaryCube : i.joinCubes?.find((t) => t.cube.name === e)?.cube;
			if (!t) throw Error(`Cube ${e} not found in query plan`);
			let o = /* @__PURE__ */ new Map([[i.primaryCube.name, i.primaryCube]]);
			if (i.joinCubes) for (let e of i.joinCubes) o.set(e.cube.name, e.cube);
			return this.buildCTECalculatedMeasure(n, t, a, o, r);
		}
		let o = C`${C.identifier(a.cteAlias)}.${C.identifier(t)}`;
		return this.reAggregateCteColumn(n.type, o);
	}
	buildMeasureExpression(t, n, r) {
		if (t.type === "calculated") throw Error(`Cannot build calculated measure '${t.name}' directly. Use buildCalculatedMeasure instead.`);
		if (e.isPostAggregationWindow(t)) throw Error(`Post-aggregation window measure '${t.name}' should be built via buildPostAggregationWindowExpression, not buildMeasureExpression.`);
		if (!t.sql) throw Error(`Measure '${t.name}' of type '${t.type}' is missing required 'sql' property. Only calculated measures and post-aggregation window functions can omit 'sql'.`);
		let i = l(t.sql, n);
		if (n.ungrouped) return i;
		let a = this.applyMeasureFilters(t, i, n);
		return this.applyAggregation(t, a, n, r);
	}
	applyMeasureFilters(e, t, n) {
		if (!e.filters || e.filters.length === 0) return t;
		let r = e.filters.map((e) => {
			let t = e(n);
			return t ? C`(${t})` : void 0;
		}).filter(Boolean);
		if (r.length === 0) return t;
		let i = r.length === 1 ? r[0] : w(...r);
		return this.databaseAdapter.buildCaseWhen([{
			when: i,
			then: t
		}]);
	}
	applyAggregation(e, t, n, r) {
		switch (e.type) {
			case "count": return T(t);
			case "countDistinct": return me(t);
			case "sum": return E(t);
			case "avg": return this.databaseAdapter.buildAvg(t);
			case "min": return he(t);
			case "max": return D(t);
			case "number": return t;
			case "stddev":
			case "stddevSamp": return this.buildStatistical(e, t, () => this.databaseAdapter.buildStddev(t, e.type === "stddevSamp" || e.statisticalConfig?.useSample));
			case "variance":
			case "varianceSamp": return this.buildStatistical(e, t, () => this.databaseAdapter.buildVariance(t, e.type === "varianceSamp" || e.statisticalConfig?.useSample));
			case "percentile":
			case "median":
			case "p95":
			case "p99": return this.buildStatistical(e, t, () => this.databaseAdapter.buildPercentile(t, this.resolvePercentile(e)));
			case "lag":
			case "lead":
			case "rank":
			case "denseRank":
			case "rowNumber":
			case "ntile":
			case "firstValue":
			case "lastValue":
			case "movingAvg":
			case "movingSum": return this.buildWindowMeasure(e, t, n, r);
			default: return T(t);
		}
	}
	buildStatistical(e, t, n) {
		let r = n();
		return r === null ? (console.warn(`[drizzle-cube] ${e.type} not supported on ${this.databaseAdapter.getEngineType()}, returning NULL`), C`MAX(NULL)`) : r;
	}
	resolvePercentile(e) {
		switch (e.type) {
			case "median": return 50;
			case "p95": return 95;
			case "p99": return 99;
			default: return e.statisticalConfig?.percentile ?? 50;
		}
	}
	buildWindowMeasure(e, t, n, r) {
		let i = e.windowConfig || {}, a = this.resolveWindowPartitions(i, n, r), o = this.resolveWindowOrder(i, n, r), s = this.databaseAdapter.buildWindowFunction(e.type, [
			"rank",
			"denseRank",
			"rowNumber"
		].includes(e.type) ? null : t, a, o, {
			offset: i.offset,
			defaultValue: i.defaultValue,
			nTile: i.nTile,
			frame: i.frame
		});
		return s === null ? (console.warn(`[drizzle-cube] ${e.type} not supported on ${this.databaseAdapter.getEngineType()}, returning NULL`), C`NULL`) : s;
	}
	resolveWindowPartitions(e, t, n) {
		if (!e.partitionBy || e.partitionBy.length === 0 || !n) return;
		let r = e.partitionBy.map((e) => {
			let r = e.includes(".") ? e.split(".")[1] : e, i = n.dimensions?.[r];
			return i ? l(i.sql, t) : (console.warn(`[drizzle-cube] Window function partition dimension '${e}' not found in cube '${n.name}'`), null);
		}).filter((e) => e !== null);
		return r.length > 0 ? r : void 0;
	}
	resolveWindowOrder(e, t, n) {
		if (!e.orderBy || e.orderBy.length === 0 || !n) return;
		let r = e.orderBy.map((e) => {
			let r = e.field.includes(".") ? e.field.split(".")[1] : e.field, i = n.dimensions?.[r];
			if (i) return {
				field: l(i.sql, t),
				direction: e.direction
			};
			let a = n.measures?.[r];
			return a && a.sql ? {
				field: l(a.sql, t),
				direction: e.direction
			} : (console.warn(`[drizzle-cube] Window function order field '${e.field}' not found in cube '${n.name}'`), null);
		}).filter((e) => e !== null);
		return r.length > 0 ? r : void 0;
	}
	static WINDOW_FUNCTION_TYPES = rn;
	static isWindowFunction(e) {
		return V(e);
	}
	static categorizeMeasures(t, n) {
		let r = [], i = [];
		for (let a of t) {
			let [t, o] = a.split("."), s = n.get(t);
			if (s?.measures?.[o]) {
				let t = s.measures[o];
				e.isWindowFunction(t.type) ? r.push(a) : i.push(a);
			}
		}
		return {
			windowMeasures: r,
			aggregateMeasures: i
		};
	}
	static hasWindowFunctions(t, n) {
		let { windowMeasures: r } = e.categorizeMeasures(t, n);
		return r.length > 0;
	}
	static isPostAggregationWindow(e) {
		return an(e);
	}
	static getWindowBaseMeasure(e, t) {
		return on(e, t);
	}
	static getDefaultWindowOperation(e) {
		return sn(e);
	}
	static categorizeForPostAggregation(e, t) {
		return cn(e, t);
	}
	static hasPostAggregationWindows(e, t) {
		return ln(e, t);
	}
}, hn = class {
	dateTimeBuilder;
	constructor(e) {
		this.dateTimeBuilder = e;
	}
	isWindowFunctionType(e) {
		return [
			"lag",
			"lead",
			"rank",
			"denseRank",
			"rowNumber",
			"ntile",
			"firstValue",
			"lastValue",
			"movingAvg",
			"movingSum"
		].includes(e);
	}
	isAggregateFunctionType(e) {
		return [
			"count",
			"countDistinct",
			"sum",
			"avg",
			"min",
			"max",
			"stddev",
			"stddevSamp",
			"variance",
			"varianceSamp",
			"median",
			"p95",
			"p99",
			"percentile",
			"number"
		].includes(e);
	}
	buildGroupByFields(e, t, n, r) {
		if (t.ungrouped) return [];
		let i = [], a = e instanceof Map ? e : /* @__PURE__ */ new Map([[e.name, e]]), o = t.dimensions && t.dimensions.length > 0 || t.timeDimensions && t.timeDimensions.length > 0, s = t.measures && t.measures.length > 0, c = o && !s;
		if (!this.hasAggregateMeasures(t, a) && !c) return [];
		for (let e of t.dimensions || []) {
			let t = this.resolveDimensionGroupField(e, a, n, r);
			t && i.push(t);
		}
		for (let e of t.timeDimensions || []) {
			let t = this.resolveTimeDimensionGroupField(e, a, n, r);
			t && i.push(t);
		}
		return this.addCorrelationKeys(t, a, i), i;
	}
	addCorrelationKeys(e, t, n) {
		let r = /* @__PURE__ */ new Set();
		for (let i of e.dimensions || []) {
			let [e, a] = i.split("."), o = t.get(e)?.dimensions?.[a]?.correlatesOn;
			!o || r.has(o) || (r.add(o), n.push(o));
		}
	}
	hasAggregateMeasures(e, t) {
		for (let n of e.measures || []) {
			let [e, r] = n.split("."), i = t.get(e)?.measures?.[r];
			if (i && (this.isAggregateFunctionType(i.type) || i.type === "calculated" || this.isWindowOverAggregate(i, e, t))) return !0;
		}
		return !1;
	}
	isWindowOverAggregate(e, t, n) {
		if (!U.isPostAggregationWindow(e)) return !1;
		let r = U.getWindowBaseMeasure(e, t);
		if (!r) return !1;
		let [i, a] = r.split("."), o = n.get(i)?.measures?.[a];
		return !!o && this.isAggregateFunctionType(o.type);
	}
	resolveDimensionGroupField(e, t, n, r) {
		let [i, a] = e.split("."), o = t.get(i);
		if (!o?.dimensions?.[a]) return null;
		let s = r?.preAggregationCTEs?.find((e) => e.cube.name === i);
		if (s) {
			let e = s.joinKeys.find((e) => e.targetColumn === a);
			return e && e.sourceColumnObj ? e.sourceColumnObj : C`${C.identifier(s.cteAlias)}.${C.identifier(a)}`;
		}
		return l(o.dimensions[a].sql, n);
	}
	resolveTimeDimensionGroupField(e, t, n, r) {
		let [i, a] = e.dimension.split("."), o = t.get(i);
		if (!o?.dimensions?.[a]) return null;
		let s = r?.preAggregationCTEs?.find((e) => e.cube.name === i);
		if (s) {
			let t = s.joinKeys.find((e) => e.targetColumn === a);
			return t && t.sourceColumnObj ? this.dateTimeBuilder.buildTimeDimensionExpression(t.sourceColumnObj, e.granularity, n) : C`${C.identifier(s.cteAlias)}.${C.identifier(a)}`;
		}
		return this.dateTimeBuilder.buildTimeDimensionExpression(o.dimensions[a].sql, e.granularity, n);
	}
}, gn = class {
	dateTimeBuilder;
	filterBuilder;
	groupByBuilder;
	measureBuilder;
	constructor(e) {
		this.dateTimeBuilder = new I(e), this.filterBuilder = new B(e, this.dateTimeBuilder), this.groupByBuilder = new hn(this.dateTimeBuilder), this.measureBuilder = new U(e);
	}
	buildResolvedMeasures(e, t, n, r) {
		return this.measureBuilder.buildResolvedMeasures(e, t, n, r);
	}
	buildSelections(e, t, n) {
		let r = {}, i = e instanceof Map ? e : /* @__PURE__ */ new Map([[e.name, e]]);
		if (t.dimensions) for (let e of t.dimensions) {
			let [t, a] = e.split("."), o = i.get(t);
			if (o && o.dimensions && o.dimensions[a]) {
				let t = o.dimensions[a], i = l(t.sql, n);
				r[e] = C`${i}`.as(e);
			}
		}
		if (t.measures) {
			let e = this.buildResolvedMeasures(t.measures, i, n);
			for (let n of t.measures) {
				let t = e.get(n);
				if (t && typeof t == "function") {
					let e = t();
					r[n] = C`${e}`.as(n);
				}
			}
		}
		if (t.timeDimensions) for (let e of t.timeDimensions) {
			let [t, a] = e.dimension.split("."), o = i.get(t);
			if (o && o.dimensions && o.dimensions[a]) {
				let t = o.dimensions[a], i = this.buildTimeDimensionExpression(t.sql, e.granularity, n);
				r[e.dimension] = C`${i}`.as(e.dimension);
			}
		}
		return Object.keys(r).length === 0 && (r.count = T()), r;
	}
	buildCalculatedMeasure(e, t, n, r, i) {
		return this.measureBuilder.buildCalculatedMeasure(e, t, n, r, i);
	}
	buildCTECalculatedMeasure(e, t, n, r, i) {
		return this.measureBuilder.buildCTECalculatedMeasure(e, t, n, r, i);
	}
	buildHavingMeasureExpression(e, t, n, r, i) {
		return this.measureBuilder.buildHavingMeasureExpression(e, t, n, r, i);
	}
	buildMeasureExpression(e, t, n) {
		return this.measureBuilder.buildMeasureExpression(e, t, n);
	}
	buildTimeDimensionExpression(e, t, n) {
		return this.dateTimeBuilder.buildTimeDimensionExpression(e, t, n);
	}
	buildWhereConditions(e, t, n, r, i) {
		let a = [], o = e instanceof Map ? e : /* @__PURE__ */ new Map([[e.name, e]]), s = /* @__PURE__ */ new Set();
		if (t.filters && t.filters.length > 0) for (let e of t.filters) this.appendWhereFilter(e, o, n, r, i, s, a);
		if (t.timeDimensions) for (let e of t.timeDimensions) this.appendTimeDimensionWhere(e, o, n, r, a);
		return a;
	}
	appendWhereFilter(e, t, n, r, i, a, o) {
		if (i && "member" in e) {
			let [n] = e.member.split(".");
			if (this.cubeIsInCTE(n, r)) return;
			if (t.has(n) && i.has(n) && !a.has(n)) {
				o.push(...i.get(n)), a.add(n);
				return;
			}
			if (a.has(n)) return;
		}
		let s = this.processFilter(e, t, n, "where", r);
		s && o.push(s);
	}
	appendTimeDimensionWhere(e, t, n, r, i) {
		let [a, o] = e.dimension.split("."), s = t.get(a);
		if (!s || !s.dimensions[o] || !e.dateRange || this.cubeIsInCTE(a, r)) return;
		if (n.filterCache) {
			let t = xt(e.dimension, e.dateRange), r = n.filterCache.get(t);
			if (r) {
				i.push(r);
				return;
			}
		}
		let c = s.dimensions[o], u = l(c.sql, n), d = this.buildDateRangeCondition(u, e.dateRange);
		d && i.push(d);
	}
	cubeIsInCTE(e, t) {
		return !!t?.preAggregationCTEs?.some((t) => t.cube.name === e);
	}
	buildHavingConditions(e, t, n, r) {
		let i = [], a = e instanceof Map ? e : /* @__PURE__ */ new Map([[e.name, e]]);
		if (t.filters && t.filters.length > 0) for (let e of t.filters) {
			let t = this.processFilter(e, a, n, "having", r);
			t && i.push(t);
		}
		return i;
	}
	processFilter(t, n, r, i, a) {
		if ("and" in t || "or" in t) {
			let o = t;
			if (o.and) {
				let e = o.and.map((e) => this.processFilter(e, n, r, i, a)).filter((e) => e !== null);
				return e.length > 0 ? w(...e) : null;
			}
			if (o.or) {
				let t = o.or.map((e) => this.processFilter(e, n, r, i, a)).filter((e) => e !== null);
				return t.length > 0 ? e(...t) : null;
			}
		}
		let o = t, [s, c] = o.member.split("."), l = n.get(s);
		if (!l) return null;
		let u = l.dimensions[c], d = l.measures[c], f = u || d;
		if (!f) return null;
		if (i === "where" && u) return this.processWhereDimensionFilter(t, o, u, f, s, r, a);
		if (i === "where" && d) return null;
		if (i === "having" && d) {
			let e = this.buildHavingMeasureExpression(s, c, d, r, a);
			return this.buildFilterCondition(e, o.operator, o.values, f, o.dateRange);
		}
		return null;
	}
	processWhereDimensionFilter(e, t, n, r, i, a, o) {
		if (this.cubeIsInCTE(i, o)) return null;
		let s = n.type === "time";
		if (a.filterCache) {
			let t = M(e), n = a.filterCache.get(t);
			if (n) return n;
		}
		let c = s ? l(n.sql, a) : typeof n.sql == "function" ? n.sql(a) : n.sql;
		return this.buildFilterCondition(c, t.operator, t.values, r, t.dateRange);
	}
	buildFilterCondition(e, t, n, r, i) {
		return this.filterBuilder.buildFilterCondition(e, t, n, r, i);
	}
	buildDateRangeCondition(e, t) {
		return this.dateTimeBuilder.buildDateRangeCondition(e, t);
	}
	buildGroupByFields(e, t, n, r) {
		return this.groupByBuilder.buildGroupByFields(e, t, n, r);
	}
	buildOrderBy(e, t) {
		let n = [], r = t || [
			...e.measures || [],
			...e.dimensions || [],
			...e.timeDimensions?.map((e) => e.dimension) || []
		];
		if (e.order && Object.keys(e.order).length > 0) for (let [t, i] of Object.entries(e.order)) {
			if (!r.includes(t)) throw Error(`Cannot order by '${t}': field is not selected in the query`);
			let e = i === "desc" ? pe(C.identifier(t)) : fe(C.identifier(t));
			n.push(e);
		}
		if (e.timeDimensions && e.timeDimensions.length > 0) {
			let t = new Set(Object.keys(e.order || {})), r = [...e.timeDimensions].sort((e, t) => e.dimension.localeCompare(t.dimension));
			for (let e of r) t.has(e.dimension) || n.push(fe(C.identifier(e.dimension)));
		}
		return n;
	}
	collectNumericFields(e, t) {
		let n = [], r = e instanceof Map ? e : /* @__PURE__ */ new Map([[e.name, e]]);
		if (t.measures && n.push(...t.measures), t.dimensions) for (let e of t.dimensions) {
			let [t, i] = e.split("."), a = r.get(t);
			if (a) {
				let t = a.dimensions[i];
				t && t.type === "number" && n.push(e);
			}
		}
		return n;
	}
	applyLimitAndOffset(e, t) {
		let n = t.limit;
		t.offset !== void 0 && t.offset > 0 && n === void 0 && (n = 50);
		let r = e;
		if (n !== void 0) {
			if (n < 0) throw Error("Limit must be non-negative");
			r = r.limit(n);
		}
		if (t.offset !== void 0) {
			if (t.offset < 0) throw Error("Offset must be non-negative");
			r = r.offset(t.offset);
		}
		return r;
	}
	buildFilterConditionPublic(e, t, n, r, i) {
		return this.buildFilterCondition(e, t, n, r, i);
	}
	buildLogicalFilter(e, t, n) {
		return this.filterBuilder.buildLogicalFilter(e, t, n);
	}
}, W = class {
	cubes;
	connectivityCache = /* @__PURE__ */ new Map();
	reverseIndex;
	constructor(e) {
		this.cubes = e, this.reverseIndex = this.buildReverseIndex();
	}
	buildReverseIndex() {
		let e = /* @__PURE__ */ new Map();
		for (let [t, n] of this.cubes) if (n.joins) for (let [, r] of Object.entries(n.joins)) {
			if (r.relationship === "belongsToMany") continue;
			let n = h(r.targetCube, this.cubes);
			if (!n) continue;
			let i = n.name, a = e.get(i);
			a || (a = [], e.set(i, a)), a.push({
				definingCube: t,
				joinDef: r
			});
		}
		return e;
	}
	findPath(e, t, n = /* @__PURE__ */ new Set()) {
		if (e === t) return [];
		let r = this.getCacheKey(e, t, n), i = this.getFromCache(r);
		if (i !== void 0) return i;
		let a = [{
			cube: e,
			path: []
		}], o = /* @__PURE__ */ new Set([e, ...n]);
		for (; a.length > 0;) {
			let { cube: e, path: n } = a.shift();
			for (let { nextCube: i, step: s } of this.neighbourSteps(e, !1)) {
				if (o.has(i)) continue;
				let e = [...n, s];
				if (i === t) return this.setInCache(r, e), e;
				o.add(i), a.push({
					cube: i,
					path: e
				});
			}
		}
		return this.setInCache(r, null), null;
	}
	neighbourSteps(e, t) {
		let n = [], r = this.cubes.get(e);
		if (r?.joins) for (let [, t] of Object.entries(r.joins)) {
			let r = h(t.targetCube, this.cubes);
			if (!r) continue;
			let i = r.name;
			n.push({
				nextCube: i,
				step: {
					fromCube: e,
					toCube: i,
					joinDef: t
				}
			});
		}
		if (t) return n;
		let i = this.reverseIndex.get(e) || [];
		for (let { definingCube: t, joinDef: r } of i) n.push({
			nextCube: t,
			step: {
				fromCube: e,
				toCube: t,
				joinDef: r,
				reversed: !0
			}
		});
		return n;
	}
	findPathPreferring(e, t, n, r = /* @__PURE__ */ new Set()) {
		return this.findPathPreferringDetailed(e, t, n, r).selectedPath;
	}
	findPathPreferringDetailed(e, t, n, r = /* @__PURE__ */ new Set()) {
		let i = this.findAllPaths(e, t, /* @__PURE__ */ new Set());
		if (i.length === 0) {
			let i = this.findPath(e, t, r), a = i ? [{
				path: i,
				score: 0,
				usesPreferredJoin: !1,
				preferredCubesInPath: 0,
				usesProcessed: i.some((e) => r.has(e.toCube)),
				scoreBreakdown: {
					preferredJoinBonus: 0,
					preferredCubeBonus: 0,
					lengthPenalty: 0
				}
			}] : [];
			return {
				strategy: "fallbackShortest",
				preferredCubes: Array.from(n).sort(),
				selectedIndex: i ? 0 : -1,
				candidates: a,
				selectedPath: i
			};
		}
		let a = i.map((i) => {
			let a = 0, o = i.some((n, r) => r === 0 ? n.reversed ? n.joinDef.preferredFor?.includes(e) ?? !1 : n.joinDef.preferredFor?.includes(t) ?? !1 : !1);
			o && (a = 10);
			let s = i.filter((e) => n.has(e.toCube)).length, c = s, l = i.length - 1;
			return {
				path: i,
				score: a + c - l,
				usesPreferredJoin: o,
				preferredCubesInPath: s,
				usesProcessed: i.some((e) => r.has(e.toCube)),
				scoreBreakdown: {
					preferredJoinBonus: a,
					preferredCubeBonus: c,
					lengthPenalty: l
				}
			};
		});
		return a.sort((e, t) => t.score === e.score ? e.usesProcessed === t.usesProcessed ? e.path.length - t.path.length : e.usesProcessed ? -1 : 1 : t.score - e.score), {
			strategy: "preferred",
			preferredCubes: Array.from(n).sort(),
			selectedIndex: a.length > 0 ? 0 : -1,
			candidates: a,
			selectedPath: a[0]?.path ?? null
		};
	}
	findAllPaths(e, t, n, r = 4) {
		if (e === t) return [[]];
		let i = [], a = [{
			cube: e,
			path: [],
			visited: /* @__PURE__ */ new Set([e, ...n])
		}];
		for (; a.length > 0;) {
			let { cube: e, path: n, visited: o } = a.shift();
			if (!(n.length >= r)) for (let { nextCube: r, step: s } of this.neighbourSteps(e, !1)) {
				if (o.has(r)) continue;
				let e = [...n, s];
				if (r === t) i.push(e);
				else {
					let t = new Set(o);
					t.add(r), a.push({
						cube: r,
						path: e,
						visited: t
					});
				}
			}
		}
		return i;
	}
	canReachAll(e, t) {
		let n = t.filter((t) => t !== e);
		for (let t of n) {
			let n = this.findForwardOnlyPath(e, t, /* @__PURE__ */ new Set());
			if (!n || n.length === 0) return !1;
		}
		return !0;
	}
	findForwardOnlyPath(e, t, n) {
		if (e === t) return [];
		let r = [{
			cube: e,
			path: []
		}], i = /* @__PURE__ */ new Set([e, ...n]);
		for (; r.length > 0;) {
			let { cube: e, path: n } = r.shift();
			for (let { nextCube: a, step: o } of this.neighbourSteps(e, !0)) {
				if (i.has(a)) continue;
				let e = [...n, o];
				if (a === t) return e;
				i.add(a), r.push({
					cube: a,
					path: e
				});
			}
		}
		return null;
	}
	buildJoinCondition(e, t, n) {
		let r = [];
		for (let i of e.on) {
			let e = t ? C`${C.identifier(t)}.${C.identifier(i.source.name)}` : m(i.source), a = n ? C`${C.identifier(n)}.${C.identifier(i.target.name)}` : m(i.target), o = i.as || b;
			r.push(o(e, a));
		}
		return w(...r);
	}
	getReachableCubes(e) {
		let t = /* @__PURE__ */ new Set([e]), n = [e];
		for (; n.length > 0;) {
			let e = n.shift();
			for (let { nextCube: r } of this.neighbourSteps(e, !1)) t.has(r) || (t.add(r), n.push(r));
		}
		return t;
	}
	getCacheKey(e, t, n) {
		return `${e}:${t}:${Array.from(n).sort().join(",")}`;
	}
	getFromCache(e) {
		let t = this.connectivityCache.get(e);
		if (t) return t.path;
	}
	setInCache(e, t) {
		this.connectivityCache.set(e, { path: t });
	}
}, _n = class {
	cache = /* @__PURE__ */ new WeakMap();
	get(e) {
		let t = this.cache.get(e);
		return t || (t = new W(e), this.cache.set(e, t)), t;
	}
};
function G(e) {
	let t = /* @__PURE__ */ new Set();
	if (e.measures) for (let n of e.measures) {
		let [e] = n.split(".");
		t.add(e);
	}
	if (e.dimensions) for (let n of e.dimensions) {
		let [e] = n.split(".");
		t.add(e);
	}
	if (e.timeDimensions) for (let n of e.timeDimensions) {
		let [e] = n.dimension.split(".");
		t.add(e);
	}
	if (e.filters) for (let n of e.filters) vn(n, t);
	if (e.order) for (let n of Object.keys(e.order)) {
		let [e] = n.split(".");
		e && t.add(e);
	}
	return t;
}
function vn(e, t) {
	if ("and" in e || "or" in e) {
		let n = e.and || e.or || [];
		for (let e of n) vn(e, t);
		return;
	}
	if ("member" in e) {
		let [n] = e.member.split(".");
		n && t.add(n);
	}
}
//#endregion
//#region src/server/logical-plan/join-planner.ts
var yn = class {
	resolverCache;
	constructor(e) {
		this.resolverCache = e;
	}
	buildJoinPlan(e, t, n, r, i) {
		let a = this.resolverCache.get(e), o = [], s = /* @__PURE__ */ new Set([t.name]), c = /* @__PURE__ */ new Set();
		if (i.measures) for (let e of i.measures) {
			let [t] = e.split(".");
			c.add(t);
		}
		let l = G(i), u = /* @__PURE__ */ new Set();
		for (let n of c) n !== t.name && this.findHasManyJoinDef(t, n, e) && u.add(n);
		let d = n.filter((e) => e !== t.name);
		for (let n of d) {
			if (s.has(n)) continue;
			let r = new Set([...s].filter((e) => !u.has(e))), i = a.findPathPreferring(t.name, n, l, r);
			if (!i || i.length === 0) throw Error(S("server.errors.noJoinPath", {
				fromCube: t.name,
				toCube: n
			}));
			for (let { fromCube: t, toCube: n, joinDef: r, reversed: a } of i) {
				if (s.has(n)) continue;
				let i = e.get(n);
				if (!i) throw Error(S("server.errors.cubeNotFound", { cubeName: n }));
				o.push(this.buildJoinRef(i, n, t, r, a)), s.add(n);
			}
		}
		return o;
	}
	buildJoinRef(e, t, n, r, i) {
		let a = i ? f(r.relationship) : r.relationship;
		if (a === "belongsToMany" && r.through) {
			let i = p("belongsToMany", r.sqlJoinType);
			return {
				target: {
					name: e.name,
					cube: e
				},
				alias: `${t.toLowerCase()}_cube`,
				joinType: i,
				joinDef: r,
				relationship: "belongsToMany",
				junctionTable: {
					table: r.through.table,
					alias: `junction_${t.toLowerCase()}`,
					joinType: i,
					sourceCubeName: n
				}
			};
		}
		let o = p(a, r.sqlJoinType);
		return {
			target: {
				name: e.name,
				cube: e
			},
			alias: `${t.toLowerCase()}_cube`,
			joinType: o,
			joinDef: r,
			relationship: a
		};
	}
	findHasManyJoinDef(e, t, n) {
		if (!e.joins) return null;
		for (let [, r] of Object.entries(e.joins)) {
			let e = h(r.targetCube, n);
			if (e && e.name === t && r.relationship === "hasMany") return r;
		}
		return null;
	}
};
//#endregion
//#region src/server/logical-plan/cte-planner-helpers.ts
function bn(e, t) {
	let n = e.joinDef.through;
	return e.sourceCube?.name === t.name && !e.reversed ? n.targetKey.map((e) => ({
		sourceColumn: e.source.name,
		targetColumn: e.target.name,
		sourceColumnObj: e.source,
		targetColumnObj: e.target
	})) : n.sourceKey.map((e) => ({
		sourceColumn: e.target.name,
		targetColumn: e.source.name,
		sourceColumnObj: e.target,
		targetColumnObj: e.source
	}));
}
function xn(e, t) {
	return e.joinDef.relationship === "belongsToMany" && e.joinDef.through ? bn(e, t) : e.reversed ? e.joinDef.on.map((e) => ({
		sourceColumn: e.target.name,
		targetColumn: e.source.name,
		sourceColumnObj: e.target,
		targetColumnObj: e.source
	})) : e.joinDef.on.map((e) => ({
		sourceColumn: e.source.name,
		targetColumn: e.target.name,
		sourceColumnObj: e.source,
		targetColumnObj: e.target
	}));
}
function Sn(e) {
	return e.relationship === "belongsToMany" && e.through ? e.through.sourceKey.map((e) => ({
		sourceColumn: e.source.name,
		targetColumn: e.target.name,
		sourceColumnObj: e.source,
		targetColumnObj: e.target
	})) : e.on.map((e) => ({
		sourceColumn: e.source.name,
		targetColumn: e.target.name,
		sourceColumnObj: e.source,
		targetColumnObj: e.target
	}));
}
function Cn(e, t, n) {
	if (!e.joins) return null;
	for (let [, r] of Object.entries(e.joins)) {
		let e = h(r.targetCube, n);
		if (e && e.name === t) return r;
	}
	return null;
}
function wn(e, t, n) {
	let r = Cn(t, n, e);
	if (r) return {
		sourceCube: t,
		joinDef: r
	};
	let i = e.get(n);
	if (i) {
		let n = Cn(i, t.name, e);
		if (n) return {
			sourceCube: i,
			joinDef: n,
			reversed: !0
		};
	}
	for (let [, r] of e) {
		if (r.name === t.name || r.name === n) continue;
		let i = Cn(r, n, e);
		if (i) return {
			sourceCube: r,
			joinDef: i
		};
	}
	return null;
}
function Tn(e, t) {
	let n = /* @__PURE__ */ new Set();
	if (e.dimensions) for (let r of e.dimensions) {
		let [e] = r.split(".");
		e !== t && n.add(e);
	}
	if (e.timeDimensions) for (let r of e.timeDimensions) {
		let [e] = r.dimension.split(".");
		e !== t && n.add(e);
	}
	if (e.filters) {
		for (let t of e.filters) vn(t, n);
		n.delete(t);
	}
	return n;
}
//#endregion
//#region src/server/logical-plan/cte-planner.ts
var En = class {
	resolverCache;
	filterPropagation;
	constructor(e, t) {
		this.resolverCache = e, this.filterPropagation = t;
	}
	planPreAggregationCTEs(e, t, n, r, i) {
		let a = [];
		if (!r.measures || r.measures.length === 0) return a;
		let o = this.computeCTEReasons(t, n, r);
		if (o.size === 0) return a;
		for (let i of n) {
			let n = o.get(i.target.name);
			if (!n) continue;
			let s = this.buildCTEForJoinCube(i, n, e, t, r);
			s && a.push(s);
		}
		return a;
	}
	buildCTEForJoinCube(e, t, n, r, i) {
		let a = e.target.cube, o = e.alias, s = (i.measures ?? []).filter((e) => e.startsWith(a.name + ".")), c = this.extractMeasuresFromFilters(i, a), l = [.../* @__PURE__ */ new Set([...s, ...c])];
		if (l.length === 0) return null;
		let u = this.resolveCTEJoinKeys(n, r, a, i);
		if (!u) return null;
		let { joinKeys: d, intermediateJoins: f } = u, p = this.filterPropagation.findPropagatingFilters(i, a, n), { aggregateMeasures: m, requiredBaseMeasures: h } = cn(l, /* @__PURE__ */ new Map([[a.name, a]])), g = [.../* @__PURE__ */ new Set([...m, ...Array.from(h).filter((e) => e.startsWith(a.name + "."))])];
		if (g.length === 0) return null;
		let _ = this.expandCalculatedMeasureDependencies(a, g), v = this.findDownstreamJoinKeys(a, i, n);
		return {
			cube: a,
			alias: o,
			cteAlias: `${a.name.toLowerCase()}_agg`,
			joinKeys: d,
			measures: _,
			propagatingFilters: p.length > 0 ? p : void 0,
			downstreamJoinKeys: v.length > 0 ? v : void 0,
			intermediateJoins: f && f.length > 0 ? f : void 0,
			cteType: "aggregate",
			cteReason: t
		};
	}
	resolveCTEJoinKeys(e, t, n, r) {
		let i = this.analyzeJoinPathToPrimary(e, t, n.name, r);
		if (i?.hasIntermediateHasMany && i.intermediateJoins.length > 0) return {
			joinKeys: i.correctJoinKeys,
			intermediateJoins: i.intermediateJoins
		};
		let a = this.locateJoinInfo(e, t, n, i);
		return a ? {
			joinKeys: xn(a, t),
			intermediateJoins: void 0
		} : null;
	}
	locateJoinInfo(e, t, n, r) {
		if (r?.path && r.path.length > 0) {
			let t = r.path[r.path.length - 1], n = e.get(t.fromCube);
			if (n) return {
				sourceCube: n,
				joinDef: t.joinDef,
				reversed: t.reversed
			};
		}
		return wn(e, t, n.name);
	}
	analyzeJoinPathToPrimary(e, t, n, r) {
		let i = this.resolverCache.get(e), a = G(r), o = a.size > 0 ? i.findPathPreferring(t.name, n, a, /* @__PURE__ */ new Set()) : i.findPath(t.name, n);
		if (!o || o.length === 0) return null;
		let s = o.map((e) => ({
			fromCube: e.fromCube,
			toCube: e.toCube,
			joinDef: e.joinDef,
			reversed: e.reversed
		}));
		if (!s.slice(0, -1).some((e) => (e.reversed ? f(e.joinDef.relationship) : e.joinDef.relationship) === "hasMany")) return {
			path: s,
			hasIntermediateHasMany: !1,
			intermediateJoins: [],
			correctJoinKeys: []
		};
		let c = [];
		for (let t = 0; t < s.length - 1; t++) {
			let n = s[t], r = s[t + 1], i = e.get(n.toCube);
			if (!i) continue;
			let a = r.joinDef.on[0]?.source, o = n.joinDef.on[0]?.target;
			c.push({
				cube: i,
				joinDef: r.joinDef,
				primaryJoinColumn: o,
				cteJoinColumn: a
			});
		}
		return {
			path: s,
			hasIntermediateHasMany: !0,
			intermediateJoins: c,
			correctJoinKeys: s[0].joinDef.on.map((e) => ({
				sourceColumn: e.source.name,
				targetColumn: e.target.name,
				sourceColumnObj: e.source,
				targetColumnObj: e.target
			}))
		};
	}
	computeCTEReasons(e, t, n) {
		let r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set();
		if (n.measures) for (let e of n.measures) {
			let [t] = e.split(".");
			o.add(t);
		}
		for (let e of t) e.relationship === "hasMany" || e.relationship === "belongsToMany" ? i.add(e.target.name) : e.relationship === "belongsTo" && o.has(e.target.name) && a.add(e.target.name);
		if (i.size === 0 && a.size === 0) return r;
		for (let e of t) o.has(e.target.name) && (i.has(e.target.name) ? r.set(e.target.name, "hasMany") : (a.has(e.target.name) || i.size > 0) && r.set(e.target.name, "fanOutPrevention"));
		return r;
	}
	findDownstreamJoinKeys(e, t, n) {
		let r = [], i = Tn(t, e.name);
		if (!e.joins) return r;
		for (let [, t] of Object.entries(e.joins)) {
			let e = h(t.targetCube, n);
			if (!e) continue;
			let a = e.name;
			i.has(a) && r.push({
				targetCubeName: a,
				joinKeys: Sn(t)
			});
		}
		return r;
	}
	expandCalculatedMeasureDependencies(e, t) {
		let n = /* @__PURE__ */ new Set(), r = [...t];
		for (; r.length > 0;) {
			let t = r.pop();
			if (n.has(t)) continue;
			n.add(t);
			let [, i] = t.split(".");
			if (!e.measures || !e.measures[i]) continue;
			let a = e.measures[i];
			if (a.type === "calculated" && a.calculatedSql) {
				let t = this.extractDependenciesFromTemplate(a.calculatedSql, e.name);
				for (let e of t) n.has(e) || r.push(e);
			}
		}
		return Array.from(n);
	}
	extractDependenciesFromTemplate(e, t) {
		if (e.length > 1e3) return [];
		let n = e.matchAll(/\{([^}]+)\}/g), r = [];
		for (let e of n) {
			let n = e[1].trim();
			n.includes(".") ? r.push(n) : r.push(`${t}.${n}`);
		}
		return r;
	}
	extractMeasuresFromFilters(e, t) {
		let n = [];
		if (!e.filters) return n;
		for (let r of e.filters) this.extractMeasuresFromFilter(r, t, n);
		return n;
	}
	extractMeasuresFromFilter(e, t, n) {
		if ("and" in e || "or" in e) {
			let r = e.and || e.or || [];
			for (let e of r) this.extractMeasuresFromFilter(e, t, n);
			return;
		}
		if ("member" in e) {
			let r = e.member, [i, a] = r.split(".");
			i === t.name && t.measures && t.measures[a] && n.push(r);
		}
	}
}, Dn = class {
	findPropagatingFilters(e, t, n) {
		let r = [];
		if (!e.filters) return r;
		let i = this.collectFilterCubeNames(e);
		for (let a of i) {
			if (a === t.name) continue;
			let i = n.get(a);
			if (i?.joins) for (let [, o] of Object.entries(i.joins)) {
				let s = h(o.targetCube, n);
				if (!s || s.name !== t.name || o.relationship !== "hasMany") continue;
				let c = this.buildPropagatingFilter(e, i, a, o);
				c && r.push(c);
			}
		}
		return r;
	}
	collectFilterCubeNames(e) {
		let t = /* @__PURE__ */ new Set();
		if (e.filters && this.extractFilterCubeNamesToSet(e.filters, t), e.timeDimensions) {
			for (let n of e.timeDimensions) if (n.dateRange) {
				let [e] = n.dimension.split(".");
				e && t.add(e);
			}
		}
		return t;
	}
	buildPropagatingFilter(e, t, n, r) {
		let i = this.extractFiltersForCube(e.filters ?? [], n), a = this.extractTimeDimensionFiltersForCube(e, n), o = [...i, ...a];
		return o.length === 0 || r.on.length === 0 ? null : {
			sourceCube: t,
			filters: o,
			joinConditions: r.on.map((e) => ({
				source: e.source,
				target: e.target
			}))
		};
	}
	extractFilterCubeNamesToSet(e, t) {
		for (let n of e) {
			if ("and" in n || "or" in n) {
				let e = n.and || n.or || [];
				this.extractFilterCubeNamesToSet(e, t);
				continue;
			}
			if ("member" in n) {
				let [e] = n.member.split(".");
				e && t.add(e);
			}
		}
	}
	extractFiltersForCube(e, t) {
		let n = [];
		for (let r of e) {
			if ("and" in r) {
				let e = this.extractFiltersForCube(r.and || [], t);
				e.length > 0 && n.push({ and: e });
				continue;
			}
			if ("or" in r) {
				let e = r.or || [];
				if (this.allFiltersFromCube(e, t)) {
					let r = this.extractFiltersForCube(e, t);
					r.length > 0 && n.push({ or: r });
				}
				continue;
			}
			if ("member" in r) {
				let [e] = r.member.split(".");
				e === t && n.push(r);
			}
		}
		return n;
	}
	allFiltersFromCube(e, t) {
		for (let n of e) {
			if ("and" in n) {
				if (!this.allFiltersFromCube(n.and || [], t)) return !1;
				continue;
			}
			if ("or" in n) {
				if (!this.allFiltersFromCube(n.or || [], t)) return !1;
				continue;
			}
			if ("member" in n) {
				let [e] = n.member.split(".");
				if (e !== t) return !1;
			}
		}
		return !0;
	}
	extractTimeDimensionFiltersForCube(e, t) {
		let n = [];
		if (!e.timeDimensions) return n;
		for (let r of e.timeDimensions) {
			let [e] = r.dimension.split(".");
			e === t && r.dateRange && n.push({
				member: r.dimension,
				operator: "inDateRange",
				values: Array.isArray(r.dateRange) ? r.dateRange : [r.dateRange]
			});
		}
		return n;
	}
}, On = class {
	resolverCache;
	constructor(e) {
		this.resolverCache = e;
	}
	analyzePrimaryCubeSelection(e, t, n) {
		if (e.length === 1) return {
			selectedCube: e[0],
			reason: "single_cube",
			explanation: "Only one cube is used in this query"
		};
		let r = this.buildPrimaryCubeCandidates(e, t, n);
		return this.selectByDimensions(t, r) || this.selectByConnectivity(r) || {
			selectedCube: [...e].sort()[0],
			reason: "alphabetical_fallback",
			explanation: "Selected alphabetically as fallback (no cube could reach all others)",
			candidates: r
		};
	}
	buildPrimaryCubeCandidates(e, t, n) {
		let r = /* @__PURE__ */ new Map();
		for (let e of t.dimensions || []) {
			let t = e.split(".")[0];
			r.set(t, (r.get(t) || 0) + 1);
		}
		let i = this.resolverCache.get(n);
		return e.map((t) => {
			let a = n.get(t);
			return {
				cubeName: t,
				dimensionCount: r.get(t) || 0,
				joinCount: a?.joins ? Object.keys(a.joins).length : 0,
				canReachAll: i.canReachAll(t, e)
			};
		});
	}
	selectByDimensions(e, t) {
		if (!e.dimensions || e.dimensions.length === 0) return null;
		let n = Math.max(...t.map((e) => e.dimensionCount));
		if (n === 0) return null;
		let r = t.filter((e) => e.dimensionCount === n).sort((e, t) => e.cubeName.localeCompare(t.cubeName));
		for (let e of r) if (e.canReachAll) return {
			selectedCube: e.cubeName,
			reason: "most_dimensions",
			explanation: `Selected because it has ${e.dimensionCount} dimension${e.dimensionCount === 1 ? "" : "s"} in the query (defines the analytical grain)`,
			candidates: t
		};
		return null;
	}
	selectByConnectivity(e) {
		let t = e.filter((e) => e.canReachAll);
		if (t.length === 0) return null;
		let n = Math.max(...t.map((e) => e.joinCount)), r = t.filter((e) => e.joinCount === n).sort((e, t) => e.cubeName.localeCompare(t.cubeName))[0];
		return {
			selectedCube: r.cubeName,
			reason: "most_connected",
			explanation: `Selected because it has ${r.joinCount} join relationship${r.joinCount === 1 ? "" : "s"} and can reach all other cubes`,
			candidates: e
		};
	}
	analyzeJoinPath(e, t, n, r) {
		let i = this.resolverCache.get(e), a = r ? G(r) : /* @__PURE__ */ new Set(), o = a.size > 0 ? i.findPathPreferringDetailed(t, n, a) : null, s = o?.selectedPath ?? i.findPath(t, n), c = [t];
		if (s) for (let e of s) c.push(e.toCube);
		if (!s || s.length === 0) return {
			targetCube: n,
			pathFound: !1,
			error: `No join path found from '${t}' to '${n}'. Ensure the target cube has a relationship defined (belongsTo, hasOne, hasMany, or belongsToMany).`,
			visitedCubes: c,
			selection: this.buildJoinPathSelectionAnalysis(o)
		};
		let l = this.convertInternalPathToJoinPathSteps(s);
		return {
			targetCube: n,
			pathFound: !0,
			path: l,
			pathLength: l.length,
			visitedCubes: c,
			selection: this.buildJoinPathSelectionAnalysis(o)
		};
	}
	convertInternalPathToJoinPathSteps(e) {
		return e.map((e) => {
			let t = e.reversed ? f(e.joinDef.relationship) : e.joinDef.relationship, n = p(t, e.joinDef.sqlJoinType), r = e.joinDef.on.map((e) => ({
				sourceColumn: e.source.name,
				targetColumn: e.target.name
			})), i = {
				fromCube: e.fromCube,
				toCube: e.toCube,
				relationship: t,
				joinType: n,
				joinColumns: r
			};
			if (e.reversed && (i.reversed = !0), t === "belongsToMany" && e.joinDef.through) {
				let t = e.joinDef.through;
				i.junctionTable = {
					tableName: t.table[Symbol.for("drizzle:Name")] || "junction_table",
					sourceColumns: t.sourceKey.map((e) => e.target.name),
					targetColumns: t.targetKey.map((e) => e.source.name)
				};
			}
			return i;
		});
	}
	buildJoinPathSelectionAnalysis(e) {
		if (!e) return { strategy: "shortest" };
		let t = e.candidates.map((e, t) => this.mapPreferredCandidate(e, t + 1));
		return {
			strategy: e.strategy,
			preferredCubes: e.preferredCubes,
			selectedRank: e.selectedIndex >= 0 ? e.selectedIndex + 1 : void 0,
			selectedScore: e.selectedIndex >= 0 ? e.candidates[e.selectedIndex]?.score : void 0,
			candidates: t
		};
	}
	mapPreferredCandidate(e, t) {
		return {
			rank: t,
			score: e.score,
			usesPreferredJoin: e.usesPreferredJoin,
			preferredCubesInPath: e.preferredCubesInPath,
			usesProcessed: e.usesProcessed,
			scoreBreakdown: e.scoreBreakdown,
			path: this.convertInternalPathToJoinPathSteps(e.path)
		};
	}
	generateWarnings(e, t) {
		let n = [], r = this.checkFanOutNoDimensions(e, t);
		return r && n.push(r), n;
	}
	checkFanOutNoDimensions(e, t) {
		if (!t || t.length === 0 || !e.measures || e.measures.length === 0) return null;
		let n = /* @__PURE__ */ new Set();
		for (let t of e.measures) {
			let [e] = t.split(".");
			n.add(e);
		}
		if (n.size < 2) return null;
		let r = e.dimensions && e.dimensions.length > 0, i = e.timeDimensions?.some((e) => e.granularity);
		return r || i ? null : {
			code: "FAN_OUT_NO_DIMENSIONS",
			message: "Query combines measures from multiple cubes with hasMany relationships but has no dimensions. Results are aggregated at the join key level, which may produce unexpected totals.",
			severity: "warning",
			cubes: [...n].sort(),
			measures: e.measures,
			suggestion: "Add a dimension to see per-group breakdowns, or add a time dimension with granularity."
		};
	}
}, kn = class {
	resolverCache = new _n();
	joinPlanner = new yn(this.resolverCache);
	ctePlanner = new En(this.resolverCache, new Dn());
	reporter = new On(this.resolverCache);
	analyzeCubeUsage(e) {
		return G(e);
	}
	analyzePrimaryCube(e, t, n) {
		return this.reporter.analyzePrimaryCubeSelection(e, t, n);
	}
	analyzeJoinPathForTarget(e, t, n, r) {
		return this.reporter.analyzeJoinPath(e, t, n, r);
	}
	buildJoinPlanForPrimary(e, t, n, r, i) {
		return this.joinPlanner.buildJoinPlan(e, t, n, r, i);
	}
	buildPreAggregationCTEs(e, t, n, r, i) {
		return this.ctePlanner.planPreAggregationCTEs(e, t, n, r, i);
	}
	buildWarnings(e, t) {
		return this.reporter.generateWarnings(e, t);
	}
};
//#endregion
//#region src/server/builders/cte-builder.ts
function An(e, t) {
	if (!t.joins) return e;
	for (let n of t.joins) switch (n.type || "left") {
		case "left":
			e = e.leftJoin(n.table, n.on);
			break;
		case "inner":
			e = e.innerJoin(n.table, n.on);
			break;
		case "right":
			e = e.rightJoin(n.table, n.on);
			break;
		case "full": e = e.fullJoin(n.table, n.on);
	}
	return e;
}
var jn = class {
	queryBuilder;
	constructor(e) {
		this.queryBuilder = e;
	}
	buildPreAggregationCTE(e, t, n, r, i) {
		let a = e.cube, o = a.sql(n), s = !!(e.intermediateJoins && e.intermediateJoins.length > 0), c = this.buildCTESelections(e, a, t, n, s);
		if (Object.keys(c).length === 0) return null;
		let l = n.db.select(c).from(o.from);
		l = An(l, o), l = this.applyIntermediateJoins(l, e, n, s);
		let u = this.buildCTEWhereConditions(e, a, t, n, r, i, o);
		if (u.length > 0) {
			let e = u.length === 1 ? u[0] : w(...u);
			l = l.where(e);
		}
		let d = this.buildCTEGroupByFields(e, a, t, n, s);
		return d.length > 0 && (l = l.groupBy(...d)), n.db.$with(e.cteAlias).as(l);
	}
	buildCTESelections(e, t, n, r, i) {
		let a = {};
		return this.addJoinKeySelections(a, e, t, i), this.addDownstreamKeySelections(a, e), this.addMeasureSelections(a, e, t, r), this.addDimensionSelections(a, t, n, r), a;
	}
	addJoinKeySelections(e, t, n, r) {
		if (r && t.intermediateJoins) {
			let n = t.intermediateJoins[0].primaryJoinColumn;
			n && (e[n.name] = n);
			return;
		}
		for (let r of t.joinKeys) if (r.targetColumnObj) {
			e[r.targetColumn] = r.targetColumnObj;
			for (let [t, i] of Object.entries(n.dimensions || {})) i.sql === r.targetColumnObj && t !== r.targetColumn && (e[t] = C`${r.targetColumnObj}`.as(t));
		}
	}
	addDownstreamKeySelections(e, t) {
		if (t.downstreamJoinKeys) for (let n of t.downstreamJoinKeys) for (let t of n.joinKeys) t.sourceColumnObj && (e[t.sourceColumn] = t.sourceColumnObj);
	}
	addMeasureSelections(e, t, n, r) {
		let i = /* @__PURE__ */ new Map([[n.name, n]]), a = this.queryBuilder.buildResolvedMeasures(t.measures, i, r);
		for (let n of t.measures) {
			let [, t] = n.split("."), r = a.get(n);
			r && (e[t] = C`${r()}`.as(t));
		}
	}
	addDimensionSelections(e, t, n, r) {
		let i = t.name;
		for (let a of n.dimensions || []) {
			let [n, o] = a.split(".");
			if (n === i && t.dimensions?.[o]) {
				let n = this.queryBuilder.buildMeasureExpression({
					sql: t.dimensions[o].sql,
					type: "number"
				}, r);
				e[o] = C`${n}`.as(o);
			}
		}
		for (let a of n.timeDimensions || []) {
			let [n, o] = a.dimension.split(".");
			if (n === i && t.dimensions?.[o]) {
				let n = this.queryBuilder.buildTimeDimensionExpression(t.dimensions[o].sql, a.granularity, r);
				e[o] = C`${n}`.as(o);
			}
		}
	}
	applyIntermediateJoins(e, t, n, r) {
		if (!r || !t.intermediateJoins) return e;
		let i = [...t.intermediateJoins].reverse();
		for (let t of i) {
			let r = t.cube.sql(n), i = [b(t.cteJoinColumn, t.joinDef.on[0]?.target)];
			r.where && i.push(r.where), e = e.leftJoin(r.from, w(...i));
		}
		return e;
	}
	buildCTEWhereConditions(e, t, n, r, i, a, o) {
		let s = i ? {
			...i,
			preAggregationCTEs: i.preAggregationCTEs?.filter((e) => e.cube.name !== t.name)
		} : void 0, c = this.queryBuilder.buildWhereConditions(t, n, r, s, a), l = this.buildCTETimeFilters(e, t, n, r), u = [];
		return o.where && u.push(o.where), u.push(...c, ...l), u;
	}
	buildCTETimeFilters(e, t, n, r) {
		let i = t.name, a = [];
		for (let e of n.timeDimensions || []) {
			let [n, o] = e.dimension.split(".");
			if (n === i && t.dimensions?.[o] && e.dateRange) {
				let n = this.queryBuilder.buildMeasureExpression({
					sql: t.dimensions[o].sql,
					type: "number"
				}, r), i = this.queryBuilder.buildDateRangeCondition(n, e.dateRange);
				i && a.push(i);
			}
		}
		for (let e of n.filters || []) {
			if ("and" in e || "or" in e || !("member" in e) || !("operator" in e)) continue;
			let n = e, [o, s] = n.member.split(".");
			if (o === i && t.dimensions?.[s] && n.operator === "inDateRange") {
				let e = this.queryBuilder.buildMeasureExpression({
					sql: t.dimensions[s].sql,
					type: "number"
				}, r), i = this.queryBuilder.buildDateRangeCondition(e, n.values);
				i && a.push(i);
			}
		}
		for (let t of e.propagatingFilters || []) {
			let e = this.buildPropagatingFilterSubquery(t, r);
			e && a.push(e);
		}
		return a;
	}
	buildCTEGroupByFields(e, t, n, r, i) {
		let a = t.name, o = [], s = /* @__PURE__ */ new Set();
		this.addJoinKeyGroupBy((e) => {
			let t = e?.name || (typeof e == "string" ? e : null);
			t && !s.has(t) ? (s.add(t), o.push(e)) : t || o.push(e);
		}, e, i);
		for (let e of n.dimensions || []) {
			let [n, i] = e.split(".");
			n === a && t.dimensions?.[i] && o.push(l(t.dimensions[i].sql, r));
		}
		for (let e of n.timeDimensions || []) {
			let [n, i] = e.dimension.split(".");
			n === a && t.dimensions?.[i] && o.push(this.queryBuilder.buildTimeDimensionExpression(t.dimensions[i].sql, e.granularity, r));
		}
		return o;
	}
	addJoinKeyGroupBy(e, t, n) {
		if (n && t.intermediateJoins) {
			let n = t.intermediateJoins[0];
			n.primaryJoinColumn && e(n.primaryJoinColumn);
		} else for (let n of t.joinKeys) n.targetColumnObj && e(n.targetColumnObj);
		if (t.downstreamJoinKeys) for (let n of t.downstreamJoinKeys) for (let t of n.joinKeys) t.sourceColumnObj && e(t.sourceColumnObj);
	}
	buildCTEJoinCondition(e, t, n) {
		let r = n.preAggregationCTEs?.find((t) => t.cube.name === e.cube.name);
		if (!r) throw Error(`CTE info not found for cube ${e.cube.name}`);
		let i = [];
		if (r.intermediateJoins && r.intermediateJoins.length > 0) {
			let e = r.intermediateJoins[0], a = this.resolveCTEJoinSourceColumn(r.joinKeys[0], r, n), o = C`${C.identifier(t)}.${C.identifier(e.primaryJoinColumn.name)}`;
			i.push(b(a, o));
		} else for (let e of r.joinKeys) {
			let a = this.resolveCTEJoinSourceColumn(e, r, n), o = C`${C.identifier(t)}.${C.identifier(e.targetColumn)}`;
			i.push(b(a, o));
		}
		return i.length === 1 ? i[0] : w(...i);
	}
	resolveCTEJoinSourceColumn(e, t, n) {
		if (!e) throw Error(`Missing join key while building CTE join condition for '${t.cube.name}'`);
		let r = e.sourceColumnObj || C.identifier(e.sourceColumn);
		if (!e.sourceColumnObj || !n.preAggregationCTEs) return r;
		for (let r of n.preAggregationCTEs) if (r.cube.name !== t.cube.name) {
			for (let [t, n] of Object.entries(r.cube.dimensions || {})) if (typeof n.sql != "function" && n.sql === e.sourceColumnObj) return C`${C.identifier(r.cteAlias)}.${C.identifier(t)}`;
		}
		return r;
	}
	buildPropagatingFilterSubquery(e, t) {
		let n = e.sourceCube, r = n.sql(t), i = [];
		if (r.where && i.push(r.where), e.preBuiltFilterSQL) i.push(e.preBuiltFilterSQL);
		else {
			let r = { filters: e.filters }, a = /* @__PURE__ */ new Map([[n.name, n]]), o = this.queryBuilder.buildWhereConditions(a, r, t);
			i.push(...o);
		}
		if (i.length === 0) return null;
		let a = i.length === 1 ? i[0] : w(...i), o = e.joinConditions;
		if (o.length === 1) {
			let { source: e, target: n } = o[0], i = t.db.select({ pk: e }).from(r.from);
			return i = An(i, r), i = i.where(a), C`${n} IN ${i}`;
		}
		{
			let e = o.map((e) => b(e.source, e.target)), n = w(...e, a), i = t.db.select({ one: C`1` }).from(r.from);
			return i = An(i, r), i = i.where(n), C`EXISTS ${i}`;
		}
	}
};
//#endregion
//#region src/server/execution/annotation-builder.ts
function Mn(e, t) {
	let n = Nn(e);
	return {
		measures: Fn(t, n),
		dimensions: In(t, n),
		segments: {},
		timeDimensions: Ln(t, n)
	};
}
function Nn(e) {
	let t = [e.primaryCube].filter(Boolean);
	if (e.joinCubes && e.joinCubes.length > 0 && t.push(...e.joinCubes.map((e) => e.cube).filter(Boolean)), e.multiFactMerge?.groups?.length) for (let n of e.multiFactMerge.groups) n.queryPlan.primaryCube && t.push(n.queryPlan.primaryCube), n.queryPlan.joinCubes?.length && t.push(...n.queryPlan.joinCubes.map((e) => e.cube).filter(Boolean));
	return t;
}
function Pn(e, t, n) {
	return e.find((e) => e?.name === t)?.dimensions?.[n];
}
function Fn(e, t) {
	let n = {};
	if (!e.measures) return n;
	for (let r of e.measures) {
		let [e, i] = r.split("."), a = t.find((t) => t?.name === e)?.measures?.[i];
		a && (n[r] = {
			title: a.title || i,
			shortTitle: a.title || i,
			type: a.type
		});
	}
	return n;
}
function In(e, t) {
	let n = {};
	if (!e.dimensions) return n;
	for (let r of e.dimensions) {
		let [e, i] = r.split("."), a = Pn(t, e, i);
		a && (n[r] = {
			title: a.title || i,
			shortTitle: a.title || i,
			type: a.type
		});
	}
	return n;
}
function Ln(e, t) {
	let n = {};
	if (!e.timeDimensions) return n;
	for (let r of e.timeDimensions) {
		let [e, i] = r.dimension.split("."), a = Pn(t, e, i);
		a && (n[r.dimension] = {
			title: a.title || i,
			shortTitle: a.title || i,
			type: a.type,
			granularity: r.granularity
		});
	}
	return n;
}
//#endregion
//#region src/shared/date-utils.ts
function Rn(e) {
	let t = /* @__PURE__ */ new Date(), n = e.toLowerCase().trim(), r = t.getUTCFullYear(), i = t.getUTCMonth(), a = t.getUTCDate(), o = t.getUTCDay();
	if (n === "today") {
		let e = new Date(t);
		e.setUTCHours(0, 0, 0, 0);
		let n = new Date(t);
		return n.setUTCHours(23, 59, 59, 999), {
			start: e,
			end: n
		};
	}
	if (n === "yesterday") {
		let e = new Date(t);
		e.setUTCDate(a - 1), e.setUTCHours(0, 0, 0, 0);
		let n = new Date(t);
		return n.setUTCDate(a - 1), n.setUTCHours(23, 59, 59, 999), {
			start: e,
			end: n
		};
	}
	if (n === "this week") {
		let e = o === 0 ? -6 : 1 - o, n = new Date(t);
		n.setUTCDate(a + e), n.setUTCHours(0, 0, 0, 0);
		let r = new Date(n);
		return r.setUTCDate(n.getUTCDate() + 6), r.setUTCHours(23, 59, 59, 999), {
			start: n,
			end: r
		};
	}
	if (n === "this month") return {
		start: new Date(Date.UTC(r, i, 1, 0, 0, 0, 0)),
		end: new Date(Date.UTC(r, i + 1, 0, 23, 59, 59, 999))
	};
	if (n === "this quarter") {
		let e = Math.floor(i / 3);
		return {
			start: new Date(Date.UTC(r, e * 3, 1, 0, 0, 0, 0)),
			end: new Date(Date.UTC(r, e * 3 + 3, 0, 23, 59, 59, 999))
		};
	}
	if (n === "this year") return {
		start: new Date(Date.UTC(r, 0, 1, 0, 0, 0, 0)),
		end: new Date(Date.UTC(r, 11, 31, 23, 59, 59, 999))
	};
	let s = n.match(/^last\s+(\d+)\s+days?$/);
	if (s) {
		let e = parseInt(s[1], 10), n = new Date(t);
		n.setUTCDate(a - e + 1), n.setUTCHours(0, 0, 0, 0);
		let r = new Date(t);
		return r.setUTCHours(23, 59, 59, 999), {
			start: n,
			end: r
		};
	}
	let c = n.match(/^last\s+(\d+)\s+weeks?$/);
	if (c) {
		let e = parseInt(c[1], 10) * 7, n = new Date(t);
		n.setUTCDate(a - e + 1), n.setUTCHours(0, 0, 0, 0);
		let r = new Date(t);
		return r.setUTCHours(23, 59, 59, 999), {
			start: n,
			end: r
		};
	}
	if (n === "last week") {
		let e = o === 0 ? -13 : -6 - o, n = new Date(t);
		n.setUTCDate(a + e), n.setUTCHours(0, 0, 0, 0);
		let r = new Date(n);
		return r.setUTCDate(n.getUTCDate() + 6), r.setUTCHours(23, 59, 59, 999), {
			start: n,
			end: r
		};
	}
	if (n === "last month") return {
		start: new Date(Date.UTC(r, i - 1, 1, 0, 0, 0, 0)),
		end: new Date(Date.UTC(r, i, 0, 23, 59, 59, 999))
	};
	if (n === "last quarter") {
		let e = Math.floor(i / 3), t = e === 0 ? 3 : e - 1, n = e === 0 ? r - 1 : r;
		return {
			start: new Date(Date.UTC(n, t * 3, 1, 0, 0, 0, 0)),
			end: new Date(Date.UTC(n, t * 3 + 3, 0, 23, 59, 59, 999))
		};
	}
	if (n === "last year") return {
		start: new Date(Date.UTC(r - 1, 0, 1, 0, 0, 0, 0)),
		end: new Date(Date.UTC(r - 1, 11, 31, 23, 59, 59, 999))
	};
	if (n === "last 12 months") {
		let e = new Date(Date.UTC(r, i - 11, 1, 0, 0, 0, 0)), n = new Date(t);
		return n.setUTCHours(23, 59, 59, 999), {
			start: e,
			end: n
		};
	}
	let l = n.match(/^last\s+(\d+)\s+months?$/);
	if (l) {
		let e = parseInt(l[1], 10), n = new Date(Date.UTC(r, i - e + 1, 1, 0, 0, 0, 0)), a = new Date(t);
		return a.setUTCHours(23, 59, 59, 999), {
			start: n,
			end: a
		};
	}
	let u = n.match(/^last\s+(\d+)\s+years?$/);
	if (u) {
		let e = parseInt(u[1], 10), n = new Date(Date.UTC(r - e, 0, 1, 0, 0, 0, 0)), i = new Date(t);
		return i.setUTCHours(23, 59, 59, 999), {
			start: n,
			end: i
		};
	}
	return null;
}
//#endregion
//#region src/server/gap-filler.ts
var zn = 1e4;
function Bn(e, t, n) {
	let r = [], i = Vn(new Date(e), n), a = Vn(new Date(t), n);
	for (; i <= a && r.length < 1e4;) r.push(new Date(i)), i = Hn(i, n);
	return r;
}
function Vn(e, t) {
	let n = new Date(e);
	switch (t) {
		case "second":
			n.setUTCMilliseconds(0);
			break;
		case "minute":
			n.setUTCSeconds(0, 0);
			break;
		case "hour":
			n.setUTCMinutes(0, 0, 0);
			break;
		case "day":
			n.setUTCHours(0, 0, 0, 0);
			break;
		case "week": {
			let e = n.getUTCDay(), t = e === 0 ? 6 : e - 1;
			n.setUTCDate(n.getUTCDate() - t), n.setUTCHours(0, 0, 0, 0);
			break;
		}
		case "month":
			n.setUTCDate(1), n.setUTCHours(0, 0, 0, 0);
			break;
		case "quarter": {
			let e = Math.floor(n.getUTCMonth() / 3) * 3;
			n.setUTCMonth(e, 1), n.setUTCHours(0, 0, 0, 0);
			break;
		}
		case "year": n.setUTCMonth(0, 1), n.setUTCHours(0, 0, 0, 0);
	}
	return n;
}
function Hn(e, t) {
	let n = new Date(e);
	switch (t) {
		case "second":
			n.setUTCSeconds(n.getUTCSeconds() + 1);
			break;
		case "minute":
			n.setUTCMinutes(n.getUTCMinutes() + 1);
			break;
		case "hour":
			n.setUTCHours(n.getUTCHours() + 1);
			break;
		case "day":
			n.setUTCDate(n.getUTCDate() + 1);
			break;
		case "week":
			n.setUTCDate(n.getUTCDate() + 7);
			break;
		case "month":
			n.setUTCMonth(n.getUTCMonth() + 1);
			break;
		case "quarter":
			n.setUTCMonth(n.getUTCMonth() + 3);
			break;
		case "year": n.setUTCFullYear(n.getUTCFullYear() + 1);
	}
	return n;
}
function Un(e, t) {
	let n = null;
	if (e instanceof Date) n = e;
	else if (typeof e == "string") {
		let t = new Date(e);
		isNaN(t.getTime()) || (n = t);
	}
	return !n || isNaN(n.getTime()) ? null : Vn(n, t).toISOString();
}
function Wn(e, t) {
	return t.length === 0 ? "__all__" : t.map((t) => String(e[t] ?? "")).join("|||");
}
function Gn(e, t) {
	let { timeDimensionKey: n, granularity: r, dateRange: i, dimensions: a } = t, o = Bn(i[0], i[1], r);
	if (o.length === 0) return e;
	if (o.length >= 1e4) return console.warn(`[drizzle-cube] Skipping gap filling for "${n}": the ${r} range exceeds the ${zn}-bucket limit. Returning unfilled data.`), e;
	let s = Kn(e, n, r, a), c = [];
	for (let [e, n] of s) {
		let e = n.size > 0 ? n.values().next().value : null;
		for (let r of o) {
			let i = r.toISOString(), a = n.get(i);
			c.push(a ?? qn(i, e ?? null, t));
		}
	}
	return c;
}
function Kn(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	for (let a of e) {
		let e = Wn(a, r), o = Un(a[t], n) ?? String(a[t]), s = i.get(e);
		s || (s = /* @__PURE__ */ new Map(), i.set(e, s)), s.set(o, a);
	}
	return i.size === 0 && r.length === 0 && i.set("__all__", /* @__PURE__ */ new Map()), i;
}
function qn(e, t, n) {
	let { timeDimensionKey: r, fillValue: i, measures: a, dimensions: o } = n, s = { [r]: e };
	if (t) for (let e of o) s[e] = t[e];
	for (let e of a) s[e] = i;
	return s;
}
function K(e) {
	if (!e) return null;
	if (Array.isArray(e)) {
		if (e.length < 2) return null;
		let t = new Date(e[0]), n = new Date(e[1]);
		return isNaN(t.getTime()) || isNaN(n.getTime()) ? null : [t, n];
	}
	let t = Rn(e);
	if (t) return [t.start, t.end];
	let n = new Date(e);
	return isNaN(n.getTime()) ? null : [n, n];
}
function Jn(e, t, n) {
	if (!t.timeDimensions || t.timeDimensions.length === 0) return e;
	let r = t.timeDimensions.filter((e) => {
		let n = e.fillMissingDates !== !1, r = !!e.granularity, i = e.dateRange || q(e.dimension, t.filters);
		return n && r && i;
	});
	if (r.length === 0) return e;
	let i = t.fillMissingDatesValue === void 0 ? 0 : t.fillMissingDatesValue, a = new Set(t.timeDimensions.map((e) => e.dimension)), o = (t.dimensions || []).filter((e) => !a.has(e)), s = e;
	for (let e of r) {
		let r = K(e.dateRange) || Yn(e.dimension, t.filters);
		if (!r) continue;
		let a = {
			timeDimensionKey: e.dimension,
			granularity: e.granularity,
			dateRange: r,
			fillValue: i,
			measures: n,
			dimensions: o
		};
		s = Gn(s, a);
	}
	return s;
}
function q(e, t) {
	if (!t) return null;
	for (let n of t) {
		if ("member" in n && "operator" in n && n.member === e && n.operator === "inDateRange") return n;
		if ("and" in n && n.and) {
			let t = q(e, n.and);
			if (t) return t;
		}
		if ("or" in n && n.or) {
			let t = q(e, n.or);
			if (t) return t;
		}
	}
	return null;
}
function Yn(e, t) {
	let n = q(e, t);
	if (!n) return null;
	if (n.dateRange) {
		let e = K(n.dateRange);
		if (e) return e;
	}
	let r = n.values;
	if (!r || r.length === 0) return null;
	if (r.length === 1 && typeof r[0] == "string") {
		let e = Rn(r[0]);
		return e ? [e.start, e.end] : K(r);
	}
	return r.length >= 2 ? K(r) : null;
}
//#endregion
//#region src/server/execution/result-post-processor.ts
function Xn(e, t, n) {
	return Jn(Array.isArray(e) ? e.map((e) => {
		let r = { ...e };
		if (t.timeDimensions) {
			for (let e of t.timeDimensions) if (e.dimension in r) {
				let t = r[e.dimension];
				if (typeof t == "string" && t.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
					let e = t.replace(" ", "T"), n = !e.endsWith("Z") && !e.includes("+") ? e + "Z" : e;
					t = new Date(n);
				}
				t = n.convertTimeDimensionResult(t), r[e.dimension] = t;
			}
		}
		return r;
	}) : [e], t, t.measures || []);
}
//#endregion
//#region src/server/execution/filter-cache-preloader.ts
var Zn = class {
	queryBuilder;
	constructor(e) {
		this.queryBuilder = e;
	}
	preload(e, t, n, r) {
		if (e.filters && e.filters.length > 0) for (let i of St(e.filters)) this.preloadRegularFilter(i, t, n, r);
		if (e.timeDimensions) for (let i of e.timeDimensions) this.preloadTimeDimensionFilter(i, t, n, r);
	}
	resolveMemberDimension(e, t) {
		let [n, r] = e.split("."), i = t.get(n);
		return i ? i.dimensions?.[r] ?? null : null;
	}
	preloadRegularFilter(e, t, n, r) {
		let i = M(e);
		if (t.has(i)) return;
		let a = this.resolveMemberDimension(e.member, n);
		if (!a || [
			"arrayContains",
			"arrayOverlaps",
			"arrayContained"
		].includes(e.operator)) return;
		let s = o(a, r), c = this.queryBuilder.buildFilterConditionPublic(s, e.operator, e.values, a, e.dateRange);
		c && t.set(i, c);
	}
	preloadTimeDimensionFilter(e, t, n, r) {
		if (!e.dateRange) return;
		let i = xt(e.dimension, e.dateRange);
		if (t.has(i)) return;
		let a = this.resolveMemberDimension(e.dimension, n);
		if (!a) return;
		let o = l(a.sql, r), s = this.queryBuilder.buildDateRangeCondition(o, e.dateRange);
		s && t.set(i, s);
	}
}, Qn = class {
	builders;
	constructor(e) {
		this.builders = e;
	}
	resolveMode(e) {
		let t = [];
		if (this.builders.comparison.hasComparison(e) && t.push("comparison"), this.builders.funnel.hasFunnel(e) && t.push("funnel"), this.builders.flow.hasFlow(e) && t.push("flow"), this.builders.retention.hasRetention(e) && t.push("retention"), t.length === 0) return "regular";
		if (t.length > 1) throw Error(S("server.errors.queryContainsMultipleModes", { modes: t.join(", ") }));
		return t[0];
	}
	validateForMode(e, t, n) {
		let i = () => {
			let e = r(t, n);
			if (!e.isValid) throw new v(S("server.errors.queryValidationFailed", { errors: e.errors.join(", ") }), e.issues);
		};
		({
			regular: i,
			comparison: i,
			funnel: () => {
				let e = this.builders.funnel.validateConfig(n.funnel, t);
				if (!e.isValid) throw Error(S("server.errors.funnelValidationFailed", { errors: e.errors.join(", ") }));
			},
			flow: () => {
				let e = this.builders.flow.validateConfig(n.flow, t);
				if (!e.isValid) throw Error(S("server.errors.flowValidationFailed", { errors: e.errors.join(", ") }));
			},
			retention: () => {
				let e = this.builders.retention.validateConfig(n.retention, t);
				if (!e.isValid) throw Error(S("server.errors.retentionValidationFailed", { errors: e.errors.join(", ") }));
			}
		})[_(e)]();
	}
};
//#endregion
//#region src/server/cache-utils.ts
function $n(e, t, n = {}, r) {
	let i = n.keyPrefix ?? "drizzle-cube:", a = er(e), o = `${i}query:${ar(JSON.stringify(a))}`;
	if (n.includeSecurityContext !== !1) {
		let e = ar(n.securityContextSerializer ? n.securityContextSerializer(t) : JSON.stringify(Y(t)));
		o += `:ctx:${e}`;
	}
	return r && (o += `:cubes:${r}`), o;
}
function er(e) {
	return {
		measures: e.measures ? [...e.measures].sort() : void 0,
		dimensions: e.dimensions ? [...e.dimensions].sort() : void 0,
		filters: e.filters ? J(e.filters) : void 0,
		timeDimensions: e.timeDimensions ? ir(e.timeDimensions) : void 0,
		limit: e.limit,
		offset: e.offset,
		order: e.order ? Y(e.order) : void 0,
		fillMissingDatesValue: e.fillMissingDatesValue,
		ungrouped: e.ungrouped,
		total: e.total,
		funnel: e.funnel ? tr(e.funnel) : void 0,
		flow: e.flow ? nr(e.flow) : void 0,
		retention: e.retention ? rr(e.retention) : void 0
	};
}
function tr(e) {
	return {
		bindingKey: e.bindingKey,
		timeDimension: e.timeDimension,
		steps: e.steps.map((e) => {
			let t = {
				name: e.name,
				filter: e.filter ? Array.isArray(e.filter) ? J(e.filter) : J([e.filter])[0] : void 0,
				timeToConvert: e.timeToConvert
			};
			return "cube" in e && e.cube && (t.cube = e.cube), t;
		}),
		includeTimeMetrics: e.includeTimeMetrics,
		globalTimeWindow: e.globalTimeWindow
	};
}
function nr(e) {
	return {
		bindingKey: e.bindingKey,
		timeDimension: e.timeDimension,
		eventDimension: e.eventDimension,
		startingStep: {
			name: e.startingStep.name,
			filter: e.startingStep.filter ? Array.isArray(e.startingStep.filter) ? J(e.startingStep.filter) : J([e.startingStep.filter])[0] : void 0
		},
		stepsBefore: e.stepsBefore,
		stepsAfter: e.stepsAfter,
		entityLimit: e.entityLimit,
		outputMode: e.outputMode,
		joinStrategy: e.joinStrategy
	};
}
function rr(e) {
	return {
		timeDimension: e.timeDimension,
		bindingKey: e.bindingKey,
		dateRange: e.dateRange,
		granularity: e.granularity,
		periods: e.periods,
		retentionType: e.retentionType,
		cohortFilters: e.cohortFilters ? Array.isArray(e.cohortFilters) ? J(e.cohortFilters) : J([e.cohortFilters])[0] : void 0,
		activityFilters: e.activityFilters ? Array.isArray(e.activityFilters) ? J(e.activityFilters) : J([e.activityFilters])[0] : void 0,
		breakdownDimensions: e.breakdownDimensions
	};
}
function J(e) {
	return [...e].map((e) => {
		if ("and" in e && e.and) return { and: J(e.and) };
		if ("or" in e && e.or) return { or: J(e.or) };
		let t = e;
		return {
			...t,
			values: t.values ? [...t.values].sort() : t.values
		};
	}).sort((e, t) => JSON.stringify(e).localeCompare(JSON.stringify(t)));
}
function ir(e) {
	return [...e].map((e) => ({
		dimension: e.dimension,
		granularity: e.granularity,
		dateRange: e.dateRange,
		fillMissingDates: e.fillMissingDates,
		compareDateRange: e.compareDateRange ? [...e.compareDateRange].sort((e, t) => {
			let n = Array.isArray(e) ? e.join("-") : e, r = Array.isArray(t) ? t.join("-") : t;
			return n.localeCompare(r);
		}) : void 0
	})).sort((e, t) => e.dimension.localeCompare(t.dimension));
}
function Y(e) {
	return typeof e != "object" || !e ? e : Array.isArray(e) ? e.map(Y) : Object.keys(e).sort().reduce((t, n) => (t[n] = Y(e[n]), t), {});
}
function ar(e) {
	let t = 2166136261, n = 2246822519, r = 3266489917, i = 668265263, a = 16777619;
	for (let o = 0; o < e.length; o++) {
		let s = e.charCodeAt(o);
		t = Math.imul(t ^ s, a) >>> 0, n = Math.imul(n ^ s + o & 65535, a) >>> 0, r = Math.imul(r ^ (s ^ o & 255), a) >>> 0, i = Math.imul(i ^ s + Math.imul(o, 131) & 65535, a) >>> 0;
	}
	return t = (t ^ e.length) >>> 0, t.toString(16).padStart(8, "0") + n.toString(16).padStart(8, "0") + r.toString(16).padStart(8, "0") + i.toString(16).padStart(8, "0");
}
//#endregion
//#region src/server/execution/query-result-cache.ts
var or = class {
	cacheConfig;
	constructor(e) {
		this.cacheConfig = e;
	}
	generateKey(e, t, n) {
		if (this.cacheConfig?.enabled !== !1 && this.cacheConfig?.provider) return $n(e, t, this.cacheConfig, n);
	}
	async lookup(e, t) {
		if (!(!e || !this.cacheConfig?.provider)) {
			if (t) {
				this.cacheConfig.onCacheEvent?.({
					type: "miss",
					key: e,
					durationMs: 0
				});
				return;
			}
			try {
				let t = Date.now(), n = await this.cacheConfig.provider.get(e);
				if (n) return this.cacheConfig.onCacheEvent?.({
					type: "hit",
					key: e,
					durationMs: Date.now() - t
				}), {
					...n.value,
					cache: n.metadata ? {
						hit: !0,
						cachedAt: new Date(n.metadata.cachedAt).toISOString(),
						ttlMs: n.metadata.ttlMs,
						ttlRemainingMs: n.metadata.ttlRemainingMs
					} : {
						hit: !0,
						cachedAt: (/* @__PURE__ */ new Date()).toISOString(),
						ttlMs: 0,
						ttlRemainingMs: 0
					}
				};
				this.cacheConfig.onCacheEvent?.({
					type: "miss",
					key: e,
					durationMs: Date.now() - t
				});
			} catch (e) {
				this.cacheConfig.onError?.(e, "get");
			}
		}
	}
	async store(e, t) {
		if (!(!e || !this.cacheConfig?.provider)) try {
			let n = Date.now();
			await this.cacheConfig.provider.set(e, t, this.cacheConfig.defaultTtlMs ?? 3e5), this.cacheConfig.onCacheEvent?.({
				type: "set",
				key: e,
				durationMs: Date.now() - n
			});
		} catch (e) {
			this.cacheConfig.onError?.(e, "set");
		}
	}
}, sr = class {
	dateTimeBuilder;
	constructor(e) {
		this.dateTimeBuilder = new I(e);
	}
	hasComparison(e) {
		return ue(e);
	}
	getComparisonTimeDimension(e) {
		return e.timeDimensions?.find((e) => e.compareDateRange && e.compareDateRange.length >= 2);
	}
	normalizePeriods(e) {
		let t = [];
		for (let n = 0; n < e.length; n++) {
			let r = e[n], i, a, o;
			if (typeof r == "string") {
				let e = this.dateTimeBuilder.parseRelativeDateRange(r);
				if (e) i = e.start, a = e.end, o = r;
				else {
					let e = new Date(r);
					if (!isNaN(e.getTime())) i = new Date(e), i.setUTCHours(0, 0, 0, 0), a = new Date(e), a.setUTCHours(23, 59, 59, 999), o = r;
					else continue;
				}
			} else {
				if (i = new Date(r[0]), a = new Date(r[1]), isNaN(i.getTime()) || isNaN(a.getTime())) continue;
				/^\d{4}-\d{2}-\d{2}$/.test(r[1]) && a.setUTCHours(23, 59, 59, 999), o = `${r[0]} - ${r[1]}`;
			}
			t.push({
				start: i,
				end: a,
				label: o,
				index: n
			});
		}
		return t;
	}
	createPeriodQuery(e, t) {
		return {
			...e,
			timeDimensions: e.timeDimensions?.map((e) => e.compareDateRange ? {
				...e,
				dateRange: [t.start.toISOString(), t.end.toISOString()],
				compareDateRange: void 0
			} : e)
		};
	}
	calculatePeriodDayIndex(e, t, n) {
		let r = typeof e == "string" ? new Date(e) : e, i = t.getTime(), a = r.getTime();
		switch (n) {
			case "second": return Math.floor((a - i) / 1e3);
			case "minute": return Math.floor((a - i) / 6e4);
			case "hour": return Math.floor((a - i) / 36e5);
			case "day": return Math.floor((a - i) / 864e5);
			case "week": return Math.floor((a - i) / 6048e5);
			case "month": {
				let e = t.getUTCFullYear(), n = t.getUTCMonth(), i = r.getUTCFullYear(), a = r.getUTCMonth();
				return (i - e) * 12 + (a - n);
			}
			case "quarter": {
				let e = t.getUTCFullYear(), n = Math.floor(t.getUTCMonth() / 3), i = r.getUTCFullYear(), a = Math.floor(r.getUTCMonth() / 3);
				return (i - e) * 4 + (a - n);
			}
			case "year": return r.getUTCFullYear() - t.getUTCFullYear();
			default: return Math.floor((a - i) / 864e5);
		}
	}
	addPeriodMetadata(e, t, n, r) {
		return e.map((e) => {
			let i = e[n], a = 0;
			if (i) {
				let e = typeof i == "string" ? new Date(i) : i instanceof Date ? i : null;
				e && !isNaN(e.getTime()) && (a = this.calculatePeriodDayIndex(e, t.start, r));
			}
			return {
				...e,
				__period: t.label,
				__periodIndex: t.index,
				__periodDayIndex: a
			};
		});
	}
	mergeComparisonResults(e, t, n) {
		let r = [], i = {
			measures: {},
			dimensions: {},
			segments: {},
			timeDimensions: {}
		}, a = e.map((e) => e.period);
		for (let { result: a, period: o } of e) {
			let e = this.addPeriodMetadata(a.data, o, t.dimension, n);
			r.push(...e), i = {
				measures: {
					...i.measures,
					...a.annotation.measures
				},
				dimensions: {
					...i.dimensions,
					...a.annotation.dimensions
				},
				segments: {
					...i.segments,
					...a.annotation.segments
				},
				timeDimensions: {
					...i.timeDimensions,
					...a.annotation.timeDimensions
				}
			};
		}
		let o = {
			ranges: a.map((e) => [e.start.toISOString().split("T")[0], e.end.toISOString().split("T")[0]]),
			labels: a.map((e) => e.label),
			timeDimension: t.dimension,
			granularity: n
		};
		return {
			data: r,
			annotation: {
				...i,
				periods: o
			}
		};
	}
	sortComparisonResults(e, t) {
		return [...e].sort((e, n) => {
			let r = e.__periodIndex - n.__periodIndex;
			if (r !== 0) return r;
			let i = e[t], a = n[t];
			return typeof i == "string" && typeof a == "string" ? new Date(i).getTime() - new Date(a).getTime() : 0;
		});
	}
}, cr = class {
	databaseAdapter;
	filterBuilder;
	dateTimeBuilder;
	constructor(e) {
		this.databaseAdapter = e, this.dateTimeBuilder = new I(e), this.filterBuilder = new B(e, this.dateTimeBuilder);
	}
	hasFunnel(e) {
		return a(e);
	}
	validateConfig(e, t) {
		let n = [];
		e.steps.length < 2 && n.push(S("server.validation.funnel.minSteps")), this.validateBindingKey(e, t, n), this.validateTimeDimension(e, t, n);
		for (let r = 0; r < e.steps.length; r++) this.validateStep(e, e.steps[r], r, t, n);
		return {
			isValid: n.length === 0,
			errors: n
		};
	}
	validateBindingKey(e, t, n) {
		if (typeof e.bindingKey == "string") {
			let [r, i] = e.bindingKey.split(".");
			if (!r || !i) {
				n.push(S("server.validation.funnel.invalidBindingKeyFormat", { bindingKey: e.bindingKey }));
				return;
			}
			let a = t.get(r);
			a ? a.dimensions?.[i] || n.push(S("server.validation.funnel.bindingKeyDimNotFound", {
				dimName: i,
				cubeName: r
			})) : n.push(S("server.validation.funnel.bindingKeyCubeNotFound", { cubeName: r }));
			return;
		}
		if (Array.isArray(e.bindingKey)) for (let r of e.bindingKey) {
			let e = t.get(r.cube);
			if (!e) {
				n.push(S("server.validation.funnel.bindingKeyMappingCubeNotFound", { cubeName: r.cube }));
				continue;
			}
			let [, i] = r.dimension.split(".");
			e.dimensions?.[i] || n.push(S("server.validation.funnel.bindingKeyDimNotFound", {
				dimName: i,
				cubeName: r.cube
			}));
		}
	}
	validateTimeDimension(e, t, n) {
		if (typeof e.timeDimension != "string") return;
		let [r, i] = e.timeDimension.split(".");
		if (!r || !i) {
			n.push(S("server.validation.funnel.invalidTimeDimFormat", { timeDimension: e.timeDimension }));
			return;
		}
		let a = t.get(r);
		a ? a.dimensions?.[i] || n.push(S("server.validation.funnel.timeDimNotFound", {
			dimName: i,
			cubeName: r
		})) : n.push(S("server.validation.funnel.timeDimCubeNotFound", { cubeName: r }));
	}
	validateStep(e, t, n, r, i) {
		t.name || i.push(S("server.validation.funnel.stepMustHaveName", { step: n })), "cube" in t && t.cube && !r.get(t.cube) && i.push(S("server.validation.funnel.stepCubeNotFound", {
			step: n,
			cube: t.cube
		})), t.filter && this.validateStepFilters(e, t, n, r, i), t.timeToConvert && n > 0 && (/^P(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?)?$/.test(t.timeToConvert) || i.push(S("server.validation.funnel.stepTimeToConvertFormat", {
			step: n,
			value: t.timeToConvert
		})));
	}
	validateStepFilters(e, t, n, r, i) {
		let a;
		"cube" in t && t.cube ? a = t.cube : typeof e.bindingKey == "string" && ([a] = e.bindingKey.split("."));
		let o = a ? new W(r) : null, s = Array.isArray(t.filter) ? t.filter : [t.filter];
		for (let e of s) {
			if (!("member" in e)) continue;
			let [t, s] = e.member.split("."), c = r.get(t);
			if (!c) {
				i.push(S("server.validation.funnel.stepFilterCubeNotFound", {
					step: n,
					cubeName: t
				}));
				continue;
			}
			if (c.dimensions?.[s] || (c.measures?.[s] ? i.push(S("server.validation.funnel.stepFilterIsMeasure", {
				step: n,
				member: `${t}.${s}`
			})) : i.push(S("server.validation.funnel.stepFilterMemberNotFound", {
				step: n,
				field: s,
				cubeName: t
			}))), a && t !== a && o) {
				let e = o.findPath(a, t);
				(!e || e.length === 0) && i.push(S("server.validation.funnel.stepFilterNoJoinPath", {
					step: n,
					member: `${t}.${s}`,
					stepCube: a
				}));
			}
		}
	}
	buildFunnelQuery(e, t, n) {
		let r = this.resolveSteps(e, t, n), i = [];
		for (let e = 0; e < r.length; e++) {
			let t = e > 0 ? i[e - 1] : void 0;
			i.push(this.buildStepCTE(r[e], n, t));
		}
		let a = this.buildFunnelResultsCTE(i, r, e, n), o = this.buildAggregationCTE(a, i, r, e, n), s = [
			...i,
			a,
			o
		];
		return n.db.with(...s).select().from(o);
	}
	transformResult(e, t) {
		if (!e || e.length === 0) return [];
		let n = e[0], r = [], i = Number(n.step_0_count) || 0;
		for (let e = 0; e < t.steps.length; e++) {
			let a = t.steps[e], o = Number(n[`step_${e}_count`]) || 0, s = e > 0 && Number(n[`step_${e - 1}_count`]) || 0, c = {
				step: a.name,
				stepIndex: e,
				count: o,
				conversionRate: e === 0 ? null : s > 0 ? o / s : 0,
				cumulativeConversionRate: i > 0 ? o / i : 0
			};
			t.includeTimeMetrics && e > 0 && this.applyTimeMetrics(c, n, e), r.push(c);
		}
		return r;
	}
	applyTimeMetrics(e, t, n) {
		let r = (e) => t[e] === null ? null : Number(t[e]);
		e.avgSecondsToConvert = r(`step_${n}_avg_seconds`), e.minSecondsToConvert = r(`step_${n}_min_seconds`), e.maxSecondsToConvert = r(`step_${n}_max_seconds`), t[`step_${n}_median_seconds`] !== void 0 && (e.medianSecondsToConvert = r(`step_${n}_median_seconds`)), t[`step_${n}_p90_seconds`] !== void 0 && (e.p90SecondsToConvert = r(`step_${n}_p90_seconds`));
	}
	extractFilterCubeNames(e) {
		let t = /* @__PURE__ */ new Set();
		if (!e.filter) return t;
		let n = Array.isArray(e.filter) ? e.filter : [e.filter], r = (e) => {
			let n = z(e);
			if ("and" in e && e.and) for (let t of e.and) r(t);
			else if ("or" in e && e.or) for (let t of e.or) r(t);
			else if (n) for (let e of n.filters) r(e);
			else if ("member" in e) {
				let [n] = e.member.split(".");
				t.add(n);
			}
		};
		for (let e of n) r(e);
		return t;
	}
	resolveSteps(e, t, n) {
		let r = new W(t);
		return e.steps.map((i, a) => {
			let o = this.resolveCubeForStep(i, e, t), s = this.resolveBindingKey(e, o, n), c = this.resolveTimeDimension(e, o, n), l = this.buildStepFilters(i, o, t, n), u = this.extractFilterCubeNames(i), d = [];
			for (let e of u) if (e !== o.name) {
				let n = t.get(e);
				if (n) {
					let t = r.findPath(o.name, e);
					t && t.length > 0 && d.push({
						cube: n,
						joinPath: t
					});
				}
			}
			return {
				name: i.name,
				index: a,
				cube: o,
				bindingKeyExpr: s,
				timeExpr: c,
				filterConditions: l,
				timeToConvert: i.timeToConvert,
				joinedCubes: d
			};
		});
	}
	resolveCubeForStep(e, t, n) {
		if ("cube" in e && e.cube) {
			let t = n.get(e.cube);
			if (!t) throw Error(S("server.errors.funnel.cubeNotFoundForStep", { cube: e.cube }));
			return t;
		}
		if (typeof t.bindingKey == "string") {
			let [e] = t.bindingKey.split("."), r = n.get(e);
			if (!r) throw Error(S("server.errors.funnel.cubeNotFoundForBindingKey", { bindingKey: t.bindingKey }));
			return r;
		}
		throw Error(S("server.errors.funnel.cannotResolveCubeForStep"));
	}
	resolveBindingKey(e, t, n) {
		return tn(e.bindingKey, t, n, $t("server.errors.funnel"));
	}
	resolveTimeDimension(e, t, n) {
		return nn(e.timeDimension, t, n, "server.errors.funnel");
	}
	buildStepFilters(e, t, n, r) {
		if (!e.filter) return [];
		let i = Array.isArray(e.filter) ? e.filter : [e.filter], a = [];
		for (let e of i) {
			let i = this.buildFilterCondition(e, t, n, r);
			i && a.push(i);
		}
		return a;
	}
	buildFilterCondition(e, t, n, r) {
		let i = "and" in e || "or" in e, a = z(e);
		return i || a ? this.buildLogicalFilterCondition(e, a, t, n, r) : this.buildSimpleFilterCondition(e, t, n, r);
	}
	buildLogicalFilterCondition(e, t, n, r, i) {
		let a, o;
		if (t) a = t.isAnd, o = t.filters;
		else {
			let t = e;
			a = "and" in t && !!t.and, o = t.and || t.or || [];
		}
		let s = [];
		for (let e of o) {
			let t = this.buildFilterCondition(e, n, r, i);
			t && s.push(t);
		}
		return s.length === 0 ? null : s.length === 1 ? s[0] : a ? w(...s) : C`(${C.join(s, C` OR `)})`;
	}
	buildSimpleFilterCondition(e, t, n, r) {
		let [i, a] = e.member.split("."), s = e.dateRange !== void 0;
		if (e.operator !== "set" && e.operator !== "notSet" && !s && (!e.values || e.values.length === 0 || e.values[0] === void 0 || e.values[0] === "")) return null;
		let c = n.get(i);
		if (!c) return null;
		if (i !== t.name) {
			let e = new W(n).findPath(t.name, i);
			if (!e || e.length === 0) return null;
		}
		let l = c.dimensions?.[a];
		if (!l) return null;
		let u = o(l, r);
		return this.filterBuilder.buildFilterCondition(u, e.operator, e.values || [], l, e.dateRange);
	}
	buildStepCTE(e, t, n) {
		return e.index === 0 ? this.buildFirstStepCTE(e, t) : this.buildSubsequentStepCTE(e, t, n);
	}
	buildFirstStepCTE(e, t) {
		let n = `step_${e.index}`, r = e.cube.sql(t), i = [];
		r.where && i.push(r.where), i.push(...e.filterConditions);
		let a = t.db.select({
			binding_key: C`${e.bindingKeyExpr}`.as("binding_key"),
			step_time: C`MIN(${e.timeExpr})`.as("step_time")
		}).from(r.from);
		return a = this.addCrossJoinsToQuery(a, e, t, i), i.length > 0 && (a = a.where(R(i))), a = a.groupBy(e.bindingKeyExpr), t.db.$with(n).as(a);
	}
	buildSubsequentStepCTE(e, t, n) {
		let r = `step_${e.index}`, i = `step_${e.index - 1}`, a = e.cube.sql(t), o = [];
		a.where && o.push(a.where), o.push(...e.filterConditions);
		let s = C`${C.identifier(i)}.step_time`, c = C`${e.timeExpr} > ${s}`;
		if (e.timeToConvert) {
			let t = this.databaseAdapter.buildDateAddInterval(s, e.timeToConvert);
			c = C`${c} AND ${e.timeExpr} <= ${t}`;
		}
		o.push(c);
		let l = t.db.select({
			binding_key: C`${e.bindingKeyExpr}`.as("binding_key"),
			step_time: C`MIN(${e.timeExpr})`.as("step_time")
		}).from(a.from).innerJoin(n, C`${e.bindingKeyExpr} = ${C.identifier(i)}.binding_key`);
		return l = this.addCrossJoinsToQuery(l, e, t, o), o.length > 0 && (l = l.where(R(o))), l = l.groupBy(e.bindingKeyExpr), t.db.$with(r).as(l);
	}
	addCrossJoinsToQuery(e, t, n, r) {
		if (t.joinedCubes.length === 0) return e;
		for (let i of t.joinedCubes) for (let t of i.joinPath) {
			let a = t.joinDef, o = [];
			for (let e of a.on) e.as ? o.push(e.as(e.source, e.target)) : o.push(b(e.source, e.target));
			let s = R(o), c = i.cube.sql(n);
			e = e.leftJoin(c.from, s), c.where && r.push(c.where);
		}
		return e;
	}
	buildFunnelResultsCTE(e, t, n, r) {
		let i = {
			binding_key: C`s0.binding_key`,
			step_0_time: C`s0.step_time`
		};
		for (let e = 1; e < t.length; e++) i[`step_${e}_time`] = C`s${C.raw(String(e))}.step_time`;
		let a = C`${C.identifier("step_0")} s0`;
		for (let e = 1; e < t.length; e++) a = C`${a}
      LEFT JOIN ${C.identifier(`step_${e}`)} s${C.raw(String(e))} ON s0.binding_key = s${C.raw(String(e))}.binding_key`;
		let o = Object.entries(i).map(([e, t]) => C`${t} AS ${C.identifier(e)}`), s = C`SELECT ${C.join(o, C`, `)} FROM ${a}`;
		return r.db.$with("funnel_joined").as(s);
	}
	buildAggregationCTE(e, t, n, r, i) {
		let a = {};
		a.step_0_count = C`COUNT(*)`.as("step_0_count");
		for (let e = 1; e < n.length; e++) a[`step_${e}_count`] = C`COUNT(${C.identifier(`step_${e}_time`)})`.as(`step_${e}_count`);
		if (r.includeTimeMetrics) for (let e = 1; e < n.length; e++) {
			let t = C.identifier(`step_${e}_time`), n = C.identifier(`step_${e - 1}_time`), r = this.databaseAdapter.buildTimeDifferenceSeconds(C`${t}`, C`${n}`), i = C`${t} IS NOT NULL`;
			if (a[`step_${e}_avg_seconds`] = this.databaseAdapter.buildConditionalAggregation("avg", r, i).as(`step_${e}_avg_seconds`), a[`step_${e}_min_seconds`] = this.databaseAdapter.buildConditionalAggregation("min", r, i).as(`step_${e}_min_seconds`), a[`step_${e}_max_seconds`] = this.databaseAdapter.buildConditionalAggregation("max", r, i).as(`step_${e}_max_seconds`), this.databaseAdapter.getCapabilities().supportsPercentileSubqueries) {
				let n = this.databaseAdapter.buildPercentile(r, 50);
				n && (a[`step_${e}_median_seconds`] = C`(SELECT ${n} FROM ${C.identifier("funnel_joined")} WHERE ${t} IS NOT NULL)`.as(`step_${e}_median_seconds`));
				let i = this.databaseAdapter.buildPercentile(r, 90);
				i && (a[`step_${e}_p90_seconds`] = C`(SELECT ${i} FROM ${C.identifier("funnel_joined")} WHERE ${t} IS NOT NULL)`.as(`step_${e}_p90_seconds`));
			}
		}
		let o = i.db.select(a).from(e);
		return i.db.$with("funnel_metrics").as(o);
	}
}, lr = class {
	filterBuilder;
	dateTimeBuilder;
	databaseAdapter;
	constructor(e) {
		this.databaseAdapter = e, this.dateTimeBuilder = new I(e), this.filterBuilder = new B(e, this.dateTimeBuilder);
	}
	hasFlow(e) {
		return y(e);
	}
	validateConfig(e, t) {
		let n = [], r = [], i = this.databaseAdapter.getEngineType(), a = this.databaseAdapter.getCapabilities().supportsLateralSubqueriesInCTE;
		return i === "sqlite" ? (n.push(S("server.validation.flow.sqliteNotSupported")), {
			isValid: !1,
			errors: n,
			warnings: r
		}) : (this.validateBindingKey(e, t, n), typeof e.timeDimension == "string" && this.validateMemberDimension(e.timeDimension, t, n, {
			invalidFormat: () => S("server.validation.flow.invalidTimeDimFormat", { timeDimension: e.timeDimension }),
			cubeNotFound: (e) => S("server.validation.flow.timeDimCubeNotFound", { cubeName: e }),
			dimNotFound: (e, t) => S("server.validation.flow.timeDimNotFound", {
				dimName: e,
				cubeName: t
			})
		}), e.eventDimension ? this.validateMemberDimension(e.eventDimension, t, n, {
			invalidFormat: () => S("server.validation.flow.invalidEventDimFormat", { eventDimension: e.eventDimension }),
			cubeNotFound: (e) => S("server.validation.flow.eventDimCubeNotFound", { cubeName: e }),
			dimNotFound: (e, t) => S("server.validation.flow.eventDimNotFound", {
				dimName: e,
				cubeName: t
			})
		}) : n.push(S("server.validation.flow.eventDimRequired")), this.validateStartingStep(e, n, r), this.validateDepthBounds(e, n, r), this.validateJoinStrategy(e, a, n), {
			isValid: n.length === 0,
			errors: n,
			warnings: r
		});
	}
	validateMemberDimension(e, t, n, r) {
		let [i, a] = e.split(".");
		if (!i || !a) {
			n.push(r.invalidFormat());
			return;
		}
		let o = t.get(i);
		o ? o.dimensions?.[a] || n.push(r.dimNotFound(a, i)) : n.push(r.cubeNotFound(i));
	}
	validateBindingKey(e, t, n) {
		if (typeof e.bindingKey == "string") {
			this.validateMemberDimension(e.bindingKey, t, n, {
				invalidFormat: () => S("server.validation.flow.invalidBindingKeyFormat", { bindingKey: e.bindingKey }),
				cubeNotFound: (e) => S("server.validation.flow.bindingKeyCubeNotFound", { cubeName: e }),
				dimNotFound: (e, t) => S("server.validation.flow.bindingKeyDimNotFound", {
					dimName: e,
					cubeName: t
				})
			});
			return;
		}
		if (Array.isArray(e.bindingKey)) for (let r of e.bindingKey) {
			let e = t.get(r.cube);
			if (!e) {
				n.push(S("server.validation.flow.bindingKeyMappingCubeNotFound", { cubeName: r.cube }));
				continue;
			}
			let [, i] = r.dimension.split(".");
			e.dimensions?.[i] || n.push(S("server.validation.flow.bindingKeyDimNotFound", {
				dimName: i,
				cubeName: r.cube
			}));
		}
	}
	validateStartingStep(e, t, n) {
		if (!e.startingStep) {
			t.push(S("server.validation.flow.startingStepRequired"));
			return;
		}
		e.startingStep.filter || t.push(S("server.validation.flow.startingStepFilterRequired")), e.startingStep.name || n.push(S("server.validation.flow.startingStepNameMissing"));
	}
	validateDepthBounds(e, t, n) {
		(e.stepsBefore < 0 || e.stepsBefore > 5) && t.push(S("server.validation.flow.stepsBeforeRange", { value: e.stepsBefore })), (e.stepsAfter < 0 || e.stepsAfter > 5) && t.push(S("server.validation.flow.stepsAfterRange", { value: e.stepsAfter })), (e.stepsBefore >= 4 || e.stepsAfter >= 4) && n.push(S("server.validation.flow.highStepDepthWarning"));
	}
	validateJoinStrategy(e, t, n) {
		e.joinStrategy && ![
			"auto",
			"lateral",
			"window"
		].includes(e.joinStrategy) ? n.push(S("server.validation.flow.invalidJoinStrategy", { joinStrategy: e.joinStrategy })) : e.joinStrategy === "lateral" && !t && n.push(S("server.validation.flow.lateralNotSupported"));
	}
	buildFlowQuery(e, t, n) {
		if (this.databaseAdapter.getEngineType() === "sqlite") throw Error(S("server.validation.flow.sqliteNotSupported"));
		let r = this.databaseAdapter.getCapabilities().supportsLateralSubqueriesInCTE, i = e.joinStrategy ?? "auto", a = i === "lateral" || i === "auto" && r;
		if (i === "lateral" && !r) throw Error(S("server.validation.flow.lateralNotSupportedExec"));
		let o = {
			...e,
			stepsBefore: e.outputMode === "sunburst" ? 0 : e.stepsBefore
		}, s = this.resolveFlowConfig(o, t, n), c = [], l = this.buildStartingEntitiesCTE(o, s, n);
		c.push(l);
		let u = a ? this.buildDirectionalCTEsLateral("before", o, s, n) : this.buildDirectionalCTEsWindow("before", o, s, n);
		c.push(...u);
		let d = a ? this.buildDirectionalCTEsLateral("after", o, s, n) : this.buildDirectionalCTEsWindow("after", o, s, n);
		c.push(...d);
		let f = this.buildNodesAggregationCTE(o, n);
		c.push(f);
		let p = this.buildLinksAggregationCTE(o, n);
		c.push(p);
		let m = this.buildFinalResultCTE(n);
		return c.push(m), n.db.with(...c).select().from(m);
	}
	transformResult(e) {
		if (!e || e.length === 0) return {
			nodes: [],
			links: []
		};
		let t = [], n = [];
		for (let r of e) {
			let e = r.record_type;
			e === "node" ? t.push({
				id: String(r.id),
				name: String(r.name),
				layer: Number(r.layer),
				value: Number(r.value)
			}) : e === "link" && n.push({
				source: String(r.source_id),
				target: String(r.target_id),
				value: Number(r.value)
			});
		}
		return t.sort((e, t) => e.layer - t.layer), {
			nodes: t,
			links: n
		};
	}
	resolveFlowConfig(e, t, n) {
		let r = this.resolveCube(e, t);
		return {
			cube: r,
			cubeBase: r.sql(n),
			bindingKeyExpr: this.resolveBindingKey(e, r, n),
			timeExpr: this.resolveTimeDimension(e, r, n),
			eventExpr: this.resolveEventDimension(e, r, n),
			startingStepFilters: this.buildStartingStepFilters(e, r, n)
		};
	}
	resolveCube(e, t) {
		let n;
		if (typeof e.bindingKey == "string") [n] = e.bindingKey.split(".");
		else if (Array.isArray(e.bindingKey) && e.bindingKey.length > 0) n = e.bindingKey[0].cube;
		else throw Error(S("server.errors.flow.cannotResolveCube"));
		let r = t.get(n);
		if (!r) throw Error(S("server.errors.flow.cubeNotFound", { cubeName: n }));
		return r;
	}
	resolveBindingKey(e, t, n) {
		return tn(e.bindingKey, t, n, $t("server.errors.flow"));
	}
	resolveTimeDimension(e, t, n) {
		return nn(e.timeDimension, t, n, "server.errors.flow");
	}
	resolveEventDimension(e, t, n) {
		let [, r] = e.eventDimension.split("."), i = t.dimensions?.[r];
		if (!i) throw Error(S("server.errors.flow.eventDimNotFound", { eventDimension: e.eventDimension }));
		return l(i.sql, n);
	}
	buildStartingStepFilters(e, t, n) {
		if (!e.startingStep.filter) return [];
		let r = Array.isArray(e.startingStep.filter) ? e.startingStep.filter : [e.startingStep.filter], i = [];
		for (let e of r) {
			let r = this.buildFilterCondition(e, t, n);
			r && i.push(r);
		}
		return i;
	}
	buildFilterCondition(e, t, n) {
		if ("and" in e || "or" in e) {
			let r = e, i = r.and || r.or || [], a = this.buildSubConditions(i, t, n);
			return this.combineConditions(a, "and" in e);
		}
		let r = z(e);
		if (r) {
			let e = this.buildSubConditions(r.filters, t, n);
			return this.combineConditions(e, r.isAnd);
		}
		let i = e, [, a] = i.member.split("."), s = t.dimensions?.[a];
		if (!s) return null;
		let c = o(s, n);
		return this.filterBuilder.buildFilterCondition(c, i.operator, i.values || [], s, i.dateRange);
	}
	buildSubConditions(e, t, n) {
		let r = [];
		for (let i of e) {
			let e = this.buildFilterCondition(i, t, n);
			e && r.push(e);
		}
		return r;
	}
	combineConditions(e, t) {
		return e.length === 0 ? null : e.length === 1 ? e[0] : t ? w(...e) : C`(${C.join(e, C` OR `)})`;
	}
	buildStartingEntitiesCTE(e, t, n) {
		let { cubeBase: r, bindingKeyExpr: i, timeExpr: a, eventExpr: o, startingStepFilters: s } = t, c = [];
		r.where && c.push(r.where), c.push(...s);
		let l = n.db.select({
			binding_key: C`${i}`.as("binding_key"),
			start_time: C`MIN(${a})`.as("start_time"),
			event_type: C`${o}`.as("event_type"),
			event_path: C`${o}`.as("event_path")
		}).from(r.from);
		return c.length > 0 && (l = l.where(R(c))), l = l.groupBy(i, o), e.entityLimit && (l = l.limit(e.entityLimit)), n.db.$with("starting_entities").as(l);
	}
	buildDirectionalCTEsLateral(e, t, n, r) {
		let { cubeBase: i, bindingKeyExpr: a, timeExpr: o, eventExpr: s } = n, c = [], l = t.outputMode === "sunburst", u = e === "before", d = u ? t.stepsBefore : t.stepsAfter, f = u ? C`<` : C`>`, p = u ? C`DESC` : C`ASC`;
		for (let t = 1; t <= d; t++) {
			let n = t === 1 ? "starting_entities" : `${e}_step_${t - 1}`, d = t === 1 ? "start_time" : "step_time", m = `${e}_step_${t}`, h = [];
			i.where && h.push(i.where), h.push(C`${a} = ${C.identifier(n)}.binding_key`, C`${o} ${f} ${C.identifier(n)}.${C.identifier(d)}`);
			let g = R(h), _ = l ? u ? C`${s} || ${"→"} || ${C.identifier(n)}.event_path` : C`${C.identifier(n)}.event_path || ${"→"} || ${s}` : C`${s}`, v = r.db.select({
				binding_key: C`${a}`.as("binding_key"),
				step_time: C`${o}`.as("step_time"),
				event_type: C`${s}`.as("event_type"),
				event_path: _.as("event_path")
			}).from(i.from).where(g).orderBy(C`${o} ${p}`).limit(1), y = r.db.$with(m).as(r.db.select({
				binding_key: C`e.binding_key`.as("binding_key"),
				step_time: C`e.step_time`.as("step_time"),
				event_type: C`e.event_type`.as("event_type"),
				event_path: C`e.event_path`.as("event_path")
			}).from(C`${C.identifier(n)}`).crossJoinLateral(v.as("e")));
			c.push(y);
		}
		return c;
	}
	buildDirectionalCTEsWindow(e, t, n, r) {
		let { cubeBase: i, bindingKeyExpr: a, timeExpr: o, eventExpr: s } = n, c = [], l = t.outputMode === "sunburst", u = e === "before", d = u ? t.stepsBefore : t.stepsAfter, f = u ? C`<` : C`>`, p = u ? C`DESC` : C`ASC`;
		for (let t = 1; t <= d; t++) {
			let n = t === 1 ? "starting_entities" : `${e}_step_${t - 1}`, d = t === 1 ? "start_time" : "step_time", m = `${e}_step_${t}`, h = [];
			i.where && h.push(i.where), h.push(C`${o} ${f} ${C.identifier(n)}.${C.identifier(d)}`);
			let g = R(h), _ = l ? u ? C`${s} || ${"→"} || ${C.identifier(n)}.event_path` : C`${C.identifier(n)}.event_path || ${"→"} || ${s}` : C`${s}`, v = r.db.select({
				binding_key: C`${a}`.as("binding_key"),
				step_time: C`${o}`.as("step_time"),
				event_type: C`${s}`.as("event_type"),
				event_path: _.as("event_path"),
				rn: C`ROW_NUMBER() OVER (PARTITION BY ${a} ORDER BY ${o} ${p})`.as("rn")
			}).from(i.from).innerJoin(C`${C.identifier(n)}`, C`${a} = ${C.identifier(n)}.binding_key`).where(g), y = r.db.select({
				binding_key: C`binding_key`.as("binding_key"),
				step_time: C`step_time`.as("step_time"),
				event_type: C`event_type`.as("event_type"),
				event_path: C`event_path`.as("event_path")
			}).from(v.as("ranked")).where(C`rn = 1`);
			c.push(r.db.$with(m).as(y));
		}
		return c;
	}
	buildNodeArm(e, t, n, r) {
		let i = C.raw(`'${e}_'`), a = C.raw(String(t)), o = C.identifier(n);
		return r ? C`
          SELECT
            ${i} || event_path AS node_id,
            event_type AS name,
            ${a} AS layer,
            COUNT(*) AS value
          FROM ${o}
          GROUP BY event_path, event_type
        ` : C`
          SELECT
            ${i} || event_type AS node_id,
            event_type AS name,
            ${a} AS layer,
            COUNT(*) AS value
          FROM ${o}
          GROUP BY event_type
        `;
	}
	buildAdjacentLinkArm(e, t, n, r, i) {
		let a = C.raw(`'${e}_'`), o = C.raw(`'${t}_'`), s = C.identifier(n), c = C.identifier(r);
		return i ? C`
          SELECT
            ${a} || f.event_path AS source_id,
            ${o} || t.event_path AS target_id,
            COUNT(*) AS value
          FROM ${s} f
          INNER JOIN ${c} t ON f.binding_key = t.binding_key
          GROUP BY f.event_path, t.event_path
        ` : C`
          SELECT
            ${a} || f.event_type AS source_id,
            ${o} || t.event_type AS target_id,
            COUNT(*) AS value
          FROM ${s} f
          INNER JOIN ${c} t ON f.binding_key = t.binding_key
          GROUP BY f.event_type, t.event_type
        `;
	}
	buildNodesAggregationCTE(e, t) {
		let n = [], r = e.outputMode === "sunburst";
		for (let t = e.stepsBefore; t >= 1; t--) n.push(this.buildNodeArm(`before_${t}`, -t, `before_step_${t}`, r));
		n.push(C`
      SELECT
        ${C.raw("'start_'")} || event_type AS node_id,
        event_type AS name,
        0 AS layer,
        COUNT(*) AS value
      FROM starting_entities
      GROUP BY event_type
    `);
		for (let t = 1; t <= e.stepsAfter; t++) n.push(this.buildNodeArm(`after_${t}`, t, `after_step_${t}`, r));
		let i = C.join(n, C` UNION ALL `), a = t.db.select({
			node_id: C`node_id`.as("node_id"),
			name: C`name`.as("name"),
			layer: C`layer`.as("layer"),
			value: C`value`.as("value")
		}).from(C`(${i}) AS nodes_union`);
		return t.db.$with("nodes_agg").as(a);
	}
	buildLinksAggregationCTE(e, t) {
		let n = [], r = e.outputMode === "sunburst";
		for (let t = e.stepsBefore; t >= 2; t--) n.push(this.buildAdjacentLinkArm(`before_${t}`, `before_${t - 1}`, `before_step_${t}`, `before_step_${t - 1}`, r));
		e.stepsBefore >= 1 && (r ? n.push(C`
          SELECT
            ${C.raw("'before_1_'")} || b.event_path AS source_id,
            ${C.raw("'start_'")} || s.event_type AS target_id,
            COUNT(*) AS value
          FROM before_step_1 b
          INNER JOIN starting_entities s ON b.binding_key = s.binding_key
          GROUP BY b.event_path, s.event_type
        `) : n.push(C`
          SELECT
            ${C.raw("'before_1_'")} || b.event_type AS source_id,
            ${C.raw("'start_'")} || s.event_type AS target_id,
            COUNT(*) AS value
          FROM before_step_1 b
          INNER JOIN starting_entities s ON b.binding_key = s.binding_key
          GROUP BY b.event_type, s.event_type
        `)), e.stepsAfter >= 1 && (r ? n.push(C`
          SELECT
            ${C.raw("'start_'")} || s.event_type AS source_id,
            ${C.raw("'after_1_'")} || a.event_path AS target_id,
            COUNT(*) AS value
          FROM starting_entities s
          INNER JOIN after_step_1 a ON s.binding_key = a.binding_key
          GROUP BY s.event_type, a.event_path
        `) : n.push(C`
          SELECT
            ${C.raw("'start_'")} || s.event_type AS source_id,
            ${C.raw("'after_1_'")} || a.event_type AS target_id,
            COUNT(*) AS value
          FROM starting_entities s
          INNER JOIN after_step_1 a ON s.binding_key = a.binding_key
          GROUP BY s.event_type, a.event_type
        `));
		for (let t = 1; t < e.stepsAfter; t++) n.push(this.buildAdjacentLinkArm(`after_${t}`, `after_${t + 1}`, `after_step_${t}`, `after_step_${t + 1}`, r));
		if (n.length === 0) {
			let e = t.db.select({
				source_id: C`NULL`.as("source_id"),
				target_id: C`NULL`.as("target_id"),
				value: C`0`.as("value")
			}).from(C`(SELECT 1) AS empty`).where(C`1 = 0`);
			return t.db.$with("links_agg").as(e);
		}
		let i = C.join(n, C` UNION ALL `), a = t.db.select({
			source_id: C`source_id`.as("source_id"),
			target_id: C`target_id`.as("target_id"),
			value: C`value`.as("value")
		}).from(C`(${i}) AS links_union`);
		return t.db.$with("links_agg").as(a);
	}
	buildFinalResultCTE(e) {
		let t = C`
      SELECT
        'node' AS record_type,
        node_id AS id,
        name AS name,
        layer AS layer,
        value AS value,
        NULL AS source_id,
        NULL AS target_id
      FROM nodes_agg
      UNION ALL
      SELECT
        'link' AS record_type,
        NULL AS id,
        NULL AS name,
        NULL AS layer,
        value AS value,
        source_id AS source_id,
        target_id AS target_id
      FROM links_agg
      WHERE source_id IS NOT NULL
    `, n = e.db.select({
			record_type: C`record_type`.as("record_type"),
			id: C`id`.as("id"),
			name: C`name`.as("name"),
			layer: C`layer`.as("layer"),
			value: C`value`.as("value"),
			source_id: C`source_id`.as("source_id"),
			target_id: C`target_id`.as("target_id")
		}).from(C`(${t}) AS final_union`);
		return e.db.$with("final_result").as(n);
	}
};
//#endregion
//#region src/server/types/retention.ts
function ur(e) {
	return Array.isArray(e);
}
function dr(e) {
	return typeof e == "object" && !!e && "cube" in e;
}
function fr(e) {
	if (dr(e)) return e.cube;
	let t = e.indexOf(".");
	if (t === -1) throw Error(`Invalid time dimension format: ${e}. Expected 'CubeName.dimensionName'`);
	return e.substring(0, t);
}
function pr(e) {
	if (dr(e)) return e.dimension;
	let t = e.indexOf(".");
	if (t === -1) throw Error(`Invalid time dimension format: ${e}. Expected 'CubeName.dimensionName'`);
	return e.substring(t + 1);
}
//#endregion
//#region src/server/builders/retention-query-builder.ts
var mr = {
	noMapping: ({ cubeName: e }) => S("server.validation.retention.noBindingKeyMapping", { cubeName: e }),
	cubeNotFound: ({ cubeName: e }) => S("server.validation.retention.bindingKeyCubeNotFound", { cubeName: e }),
	keyDimNotFound: ({ bindingKey: e, cubeName: t }) => S("server.validation.retention.bindingKeyDimNotFound", {
		dimName: e,
		cubeName: t
	}),
	mappingDimNotFound: ({ dimension: e, cubeName: t }) => S("server.validation.retention.bindingKeyDimNotFound", {
		dimName: e,
		cubeName: t
	})
}, hr = class {
	databaseAdapter;
	filterBuilder;
	dateTimeBuilder;
	constructor(e) {
		this.databaseAdapter = e, this.dateTimeBuilder = new I(e), this.filterBuilder = new B(e, this.dateTimeBuilder);
	}
	hasRetention(e) {
		return i(e);
	}
	validateConfig(e, t) {
		let n = [], r = this.databaseAdapter.getEngineType();
		return (r === "sqlite" || r === "mysql" || r === "singlestore") && n.push(S("server.validation.retention.engineNotSupported", { engine: r })), this.validateTimeDimension(e, t, n), this.validateBindingKey(e, t, n), this.validateBreakdownDimensions(e, t, n), this.validatePeriodsAndEnums(e, n), this.validateDateRange(e, n), {
			isValid: n.length === 0,
			errors: n
		};
	}
	validateTimeDimension(e, t, n) {
		try {
			let r = fr(e.timeDimension), i = pr(e.timeDimension), a = t.get(r);
			a ? a.dimensions?.[i] || n.push(S("server.validation.retention.timeDimNotFound", { dimName: i })) : n.push(S("server.validation.retention.cubeNotFound", { cubeName: r }));
		} catch {
			n.push(S("server.validation.retention.invalidTimeDimFormat", { timeDimension: e.timeDimension }));
		}
	}
	validateBindingKey(e, t, n) {
		if (ur(e.bindingKey)) {
			for (let r of e.bindingKey) {
				let e = t.get(r.cube);
				if (!e) {
					n.push(S("server.validation.retention.bindingKeyMappingCubeNotFound", { cubeName: r.cube }));
					continue;
				}
				let i = Qt(r.dimension);
				e.dimensions?.[i] || n.push(S("server.validation.retention.bindingKeyDimNotFound", {
					dimName: i,
					cubeName: r.cube
				}));
			}
			return;
		}
		let [r, i] = e.bindingKey.split(".");
		if (!r || !i) {
			n.push(S("server.validation.retention.invalidBindingKeyFormat", { bindingKey: e.bindingKey }));
			return;
		}
		let a = t.get(r);
		a ? a.dimensions?.[i] || n.push(S("server.validation.retention.bindingKeyDimNotFound", {
			dimName: i,
			cubeName: r
		})) : n.push(S("server.validation.retention.bindingKeyCubeNotFound", { cubeName: r }));
	}
	validateBreakdownDimensions(e, t, n) {
		if (!(!e.breakdownDimensions || e.breakdownDimensions.length === 0)) for (let r of e.breakdownDimensions) {
			let [e, i] = r.split(".");
			if (!e || !i) {
				n.push(S("server.validation.retention.invalidBreakdownDimFormat", { dimension: r }));
				continue;
			}
			let a = t.get(e);
			a ? a.dimensions?.[i] || n.push(S("server.validation.retention.breakdownDimNotFound", {
				dimName: i,
				cubeName: e
			})) : n.push(S("server.validation.retention.breakdownDimCubeNotFound", { cubeName: e }));
		}
	}
	validatePeriodsAndEnums(e, t) {
		e.periods < 1 && t.push(S("server.validation.retention.periodsMin")), e.periods > 52 && t.push(S("server.validation.retention.periodsMax")), [
			"day",
			"week",
			"month"
		].includes(e.granularity) || t.push(S("server.validation.retention.invalidGranularity", { granularity: e.granularity })), ["classic", "rolling"].includes(e.retentionType) || t.push(S("server.validation.retention.invalidRetentionType", { retentionType: e.retentionType }));
	}
	validateDateRange(e, t) {
		if (!e.dateRange) {
			t.push(S("server.validation.retention.dateRangeRequired"));
			return;
		}
		if (e.dateRange.start ? isNaN(new Date(e.dateRange.start).getTime()) && t.push(S("server.validation.retention.dateRangeInvalidStart")) : t.push(S("server.validation.retention.dateRangeStartRequired")), e.dateRange.end ? isNaN(new Date(e.dateRange.end).getTime()) && t.push(S("server.validation.retention.dateRangeInvalidEnd")) : t.push(S("server.validation.retention.dateRangeEndRequired")), e.dateRange.start && e.dateRange.end) {
			let n = new Date(e.dateRange.start), r = new Date(e.dateRange.end);
			!isNaN(n.getTime()) && !isNaN(r.getTime()) && n > r && t.push(S("server.validation.retention.dateRangeStartBeforeEnd"));
		}
	}
	buildRetentionQuery(e, t, n) {
		let r = this.resolveConfig(e, t, n), i = r.breakdowns.length, a = this.buildCohortBaseCTE(e, r, n), o = this.buildActivityPeriodsCTE(e, r, n), s = this.buildCohortSizesCTE(e, n, i), c = this.buildRetentionCountsCTE(e, n, i), l = r.breakdowns.length > 0, u = {
			period: C`rc.period_number`.as("period"),
			cohort_size: C`cs.cohort_size`.as("cohort_size"),
			retained_users: C`rc.retained_users`.as("retained_users"),
			retention_rate: C`CAST(rc.retained_users AS NUMERIC) / NULLIF(cs.cohort_size, 0)`.as("retention_rate")
		};
		for (let e = 0; e < r.breakdowns.length; e++) u[`breakdown_${e}`] = C.raw(`rc.breakdown_${e}`).as(`breakdown_${e}`);
		let d = n.db.with(a, o, s, c).select(u).from(C`retention_counts rc`);
		if (l) {
			let e = r.breakdowns.map((e, t) => C`COALESCE(CAST(rc.breakdown_${C.raw(String(t))} AS TEXT), '') = COALESCE(CAST(cs.breakdown_${C.raw(String(t))} AS TEXT), '')`), t = e.length === 1 ? e[0] : C.join(e, C` AND `);
			d = d.innerJoin(C`cohort_sizes cs`, t);
		} else d = d.innerJoin(C`cohort_sizes cs`, C`1 = 1`);
		let f = [];
		for (let e = 0; e < r.breakdowns.length; e++) f.push(C.raw(`rc.breakdown_${e}`));
		return f.push(C`rc.period_number`), d = d.orderBy(...f), d;
	}
	transformResult(e, t) {
		let n = t.breakdownDimensions || [], r = Math.min(n.length, 100), i = r > 0;
		return e.map((e) => {
			let t = {
				period: Number(e.period),
				cohortSize: Number(e.cohort_size),
				retainedUsers: Number(e.retained_users),
				retentionRate: e.retention_rate === null ? 0 : Number(e.retention_rate)
			};
			if (i) {
				let i = {};
				for (let t = 0; t < r; t++) {
					let r = n[t], a = e[`breakdown_${t}`];
					i[r] = a === void 0 ? null : String(a);
				}
				t.breakdownValues = i;
			}
			return t;
		});
	}
	resolveConfig(e, t, n) {
		let r = fr(e.timeDimension), i = pr(e.timeDimension), a = t.get(r);
		if (!a) throw Error(S("server.validation.retention.cubeNotFound", { cubeName: r }));
		let o = a.dimensions?.[i];
		if (!o) throw Error(S("server.validation.retention.timeDimNotFound", { dimName: i }));
		let s = l(o.sql, n), c = tn(e.bindingKey, a, n, mr, t), u = this.buildFilterConditions(e.cohortFilters, a, t, n), d = this.buildFilterConditions(e.activityFilters, a, t, n), f = [];
		if (e.breakdownDimensions && e.breakdownDimensions.length > 0) for (let r of e.breakdownDimensions) {
			let [e, i] = r.split("."), a = t.get(e);
			if (a && a.dimensions?.[i]) {
				let e = l(a.dimensions[i].sql, n);
				f.push({
					dimension: r,
					expr: e
				});
			}
		}
		return {
			cube: a,
			bindingKeyExpr: c,
			timeExpr: s,
			cohortFilterConditions: u,
			activityFilterConditions: d,
			breakdowns: f
		};
	}
	buildFilterConditions(e, t, n, r) {
		if (!e) return [];
		let i = Array.isArray(e) ? e : [e], a = [];
		for (let e of i) {
			let i = this.buildSingleFilterCondition(e, t, n, r);
			i && a.push(i);
		}
		return a;
	}
	buildSingleFilterCondition(e, t, n, r) {
		if ("and" in e || "or" in e) {
			let i = e, a = [], o = "and" in i && !!i.and, s = i.and || i.or || [];
			for (let e of s) {
				let i = this.buildSingleFilterCondition(e, t, n, r);
				i && a.push(i);
			}
			return a.length === 0 ? null : a.length === 1 ? a[0] : o ? w(...a) : C`(${C.join(a, C` OR `)})`;
		}
		let i = e, [a, s] = i.member.split("."), c = n.get(a);
		if (!c) return null;
		let l = c.dimensions?.[s];
		if (!l) return null;
		let u = o(l, r);
		return this.filterBuilder.buildFilterCondition(u, i.operator, i.values || [], l, i.dateRange);
	}
	buildCohortBaseCTE(e, t, n) {
		let r = t.cube.sql(n), i = [];
		if (r.where && i.push(r.where), i.push(...t.cohortFilterConditions), e.dateRange) {
			let n = this.buildDateRangeCondition(t.timeExpr, e.dateRange);
			i.push(n);
		}
		let a = this.databaseAdapter.buildTimeDimension(e.granularity, t.timeExpr), o = {
			binding_key: C`${t.bindingKeyExpr}`.as("binding_key"),
			cohort_entry: C`MIN(${a})`.as("cohort_entry")
		};
		for (let e = 0; e < t.breakdowns.length; e++) {
			let { expr: n } = t.breakdowns[e];
			o[`breakdown_${e}`] = C`MIN(${n})`.as(`breakdown_${e}`);
		}
		let s = n.db.select(o).from(r.from);
		i.length > 0 && (s = s.where(R(i)));
		let c = [t.bindingKeyExpr];
		for (let e = 0; e < t.breakdowns.length; e++) c.push(t.breakdowns[e].expr);
		if (s = s.groupBy(...c), e.dateRange) {
			let t = this.buildDateRangeHavingCondition(a, e.dateRange);
			s = s.having(t);
		}
		return n.db.$with("cohort_base").as(s);
	}
	buildDateRangeCondition(e, t) {
		let n = this.databaseAdapter.castToType(C`${t.start}`, "timestamp"), r = this.databaseAdapter.buildDateAddInterval(this.databaseAdapter.castToType(C`${t.end}`, "timestamp"), "P1D");
		return C`${e} >= ${n} AND ${e} < ${r}`;
	}
	buildDateRangeHavingCondition(e, t) {
		let n = this.databaseAdapter.castToType(C`${t.start}`, "timestamp"), r = this.databaseAdapter.buildDateAddInterval(this.databaseAdapter.castToType(C`${t.end}`, "timestamp"), "P1D");
		return C`MIN(${e}) >= ${n} AND MIN(${e}) < ${r}`;
	}
	buildActivityPeriodsCTE(e, t, n) {
		let r = t.cube.sql(n), i = [];
		r.where && i.push(r.where), i.push(...t.activityFilterConditions), i.push(C`${t.timeExpr} >= cohort_base.cohort_entry`);
		let a = this.databaseAdapter.buildTimeDimension(e.granularity, t.timeExpr), o = this.buildPeriodNumberExpression(C`cohort_base.cohort_entry`, a, e.granularity), s = {
			binding_key: C`cohort_base.binding_key`.as("binding_key"),
			period_number: o.as("period_number")
		};
		for (let e = 0; e < t.breakdowns.length; e++) s[`breakdown_${e}`] = C.raw(`cohort_base.breakdown_${e}`).as(`breakdown_${e}`);
		let c = n.db.select(s).from(r.from).innerJoin(C`cohort_base`, C`${t.bindingKeyExpr} = cohort_base.binding_key`);
		i.length > 0 && (c = c.where(R(i)));
		let l = [C`cohort_base.binding_key`, o];
		for (let e = 0; e < t.breakdowns.length; e++) l.push(C.raw(`cohort_base.breakdown_${e}`));
		return c = c.groupBy(...l), n.db.$with("activity_periods").as(c);
	}
	buildCohortSizesCTE(e, t, n) {
		if (n > 0) {
			let e = { cohort_size: C`COUNT(*)`.as("cohort_size") }, r = [];
			for (let t = 0; t < n; t++) e[`breakdown_${t}`] = C.raw(`breakdown_${t}`).as(`breakdown_${t}`), r.push(C.raw(`breakdown_${t}`));
			let i = t.db.select(e).from(C`cohort_base`).groupBy(...r);
			return t.db.$with("cohort_sizes").as(i);
		}
		let r = t.db.select({ cohort_size: C`COUNT(*)`.as("cohort_size") }).from(C`cohort_base`);
		return t.db.$with("cohort_sizes").as(r);
	}
	buildRetentionCountsCTE(e, t, n) {
		let r;
		if (e.retentionType === "rolling") r = this.buildRollingRetentionCountsQuery(e, t, n);
		else {
			let i = {
				period_number: C`period_number`.as("period_number"),
				retained_users: C`COUNT(DISTINCT binding_key)`.as("retained_users")
			}, a = [C`period_number`];
			for (let e = 0; e < n; e++) i[`breakdown_${e}`] = C.raw(`breakdown_${e}`).as(`breakdown_${e}`), a.push(C.raw(`breakdown_${e}`));
			let o = Math.min(e.periods, 52);
			r = t.db.select(i).from(C`activity_periods`).where(C`period_number >= 0 AND period_number <= ${o}`).groupBy(...a);
		}
		return t.db.$with("retention_counts").as(r);
	}
	buildRollingRetentionCountsQuery(e, t, n) {
		let r = [];
		for (let e = 0; e < n; e++) r.push(`breakdown_${e}`);
		let i = r.length > 0 ? `, ${r.join(", ")}` : "", a = Math.min(e.periods, 52), o = C`(
      SELECT
        binding_key,
        ${C.raw(r.map((e) => `${e}`).join(", ") + (r.length > 0 ? "," : ""))}
        MAX(period_number) as max_period
      FROM activity_periods
      WHERE period_number >= 0 AND period_number <= ${a}
      GROUP BY binding_key${C.raw(i)}
    )`, s = this.databaseAdapter.buildPeriodSeriesSubquery(a), c = {
			period_number: C`p.period_number`.as("period_number"),
			retained_users: C`COUNT(DISTINCT CASE WHEN ump.max_period >= p.period_number THEN ump.binding_key END)`.as("retained_users")
		}, l = [C`p.period_number`];
		for (let e = 0; e < n; e++) c[`breakdown_${e}`] = C.raw(`ump.breakdown_${e}`).as(`breakdown_${e}`), l.push(C.raw(`ump.breakdown_${e}`));
		return t.db.select(c).from(C`${o} ump`).innerJoin(s, C`TRUE`).groupBy(...l);
	}
	buildPeriodNumberExpression(e, t, n) {
		return this.databaseAdapter.buildDateDiffPeriods(e, t, n);
	}
};
//#endregion
//#region src/server/logical-plan/schema-builder.ts
function X(e) {
	return {
		name: e.name,
		cube: e
	};
}
function Z(e, t) {
	return e.measures ? e.measures.map((e) => {
		let [n, r] = e.split("."), i = t.get(n);
		if (!i) throw Error(S("server.errors.cubeNotFoundForMeasure", {
			cubeName: n,
			measure: e
		}));
		return {
			name: e,
			cube: X(i),
			localName: r
		};
	}) : [];
}
function gr(e, t) {
	return e.dimensions ? e.dimensions.map((e) => {
		let [n, r] = e.split("."), i = t.get(n);
		if (!i) throw Error(S("server.errors.cubeNotFoundForDimension", {
			cubeName: n,
			dimension: e
		}));
		return {
			name: e,
			cube: X(i),
			localName: r
		};
	}) : [];
}
function _r(e, t) {
	return e.timeDimensions ? e.timeDimensions.map((e) => {
		let [n, r] = e.dimension.split("."), i = t.get(n);
		if (!i) throw Error(S("server.errors.cubeNotFoundForTimeDimension", {
			cubeName: n,
			timeDimension: e.dimension
		}));
		return {
			name: e.dimension,
			cube: X(i),
			localName: r,
			granularity: e.granularity,
			dateRange: e.dateRange,
			fillMissingDates: e.fillMissingDates,
			compareDateRange: e.compareDateRange
		};
	}) : [];
}
function vr(e, t) {
	return {
		measures: Z(e, t),
		dimensions: gr(e, t),
		timeDimensions: _r(e, t)
	};
}
function yr(e, t) {
	return {
		measures: e.measures.map((e) => {
			let [n, r] = e.split(".");
			return {
				name: e,
				cube: {
					name: n,
					cube: t.get(n)
				},
				localName: r
			};
		}),
		dimensions: [],
		timeDimensions: []
	};
}
//#endregion
//#region src/server/logical-plan/logical-plan-builder.ts
var br = class {
	queryPlanner;
	constructor(e) {
		this.queryPlanner = e;
	}
	plan(e, t, n) {
		return this.planWithAnalysis(e, t, n).plan;
	}
	planWithAnalysis(e, t, n) {
		let r = Array.from(this.queryPlanner.analyzeCubeUsage(t));
		if (r.length === 0) throw Error(S("server.errors.noCubesInQuery"));
		let i = this.queryPlanner.analyzePrimaryCube(r, t, e), a = i.selectedCube, o = e.get(a);
		if (!o) throw Error(S("server.errors.primaryCubeNotFound", { cubeName: a }));
		let s = r.filter((e) => e !== a).map((n) => this.queryPlanner.analyzeJoinPathForTarget(e, a, n, t)), c = r.length > 1 ? this.queryPlanner.buildJoinPlanForPrimary(e, o, r, n, t) : [], l = r.length > 1 ? this.queryPlanner.buildPreAggregationCTEs(e, o, c, t, n) ?? [] : [], u = this.queryPlanner.buildWarnings(t, l), d = this.buildSourceFromPhases(o, c, l, e, t, n), f = d.source, p = this.buildQueryNode(f, t, e, u), m = this.buildPreAggregationAnalysis(l), h = /* @__PURE__ */ new Map();
		for (let t of r) {
			let n = e.get(t);
			n && h.set(t, n);
		}
		let g = ln(t.measures ?? [], h), _ = [...s.filter((e) => !e.pathFound && e.error).map((e) => e.error), ...u.map((e) => e.message)];
		return {
			plan: p,
			analysis: {
				timestamp: (/* @__PURE__ */ new Date()).toISOString(),
				cubeCount: r.length,
				cubesInvolved: [...r].sort(),
				primaryCube: i,
				joinPaths: s,
				preAggregations: m,
				querySummary: {
					queryType: l.length > 0 ? "multi_cube_cte" : r.length > 1 ? "multi_cube_join" : "single_cube",
					measureStrategy: d.strategy,
					joinCount: c.length,
					cteCount: l.length,
					hasPreAggregation: l.length > 0,
					hasWindowFunctions: g
				},
				warnings: _.length > 0 ? _ : void 0,
				planningTrace: { steps: [
					{
						phase: "cube_usage",
						decision: `Identified ${r.length} cube${r.length === 1 ? "" : "s"} from query members`,
						details: { cubesInvolved: [...r].sort() }
					},
					{
						phase: "primary_cube_selection",
						decision: `Selected '${i.selectedCube}' as primary cube (${i.reason})`,
						details: {
							selectedCube: i.selectedCube,
							reason: i.reason,
							candidates: i.candidates?.map((e) => e.cubeName)
						}
					},
					{
						phase: "join_planning",
						decision: `Planned ${c.length} join${c.length === 1 ? "" : "s"}`,
						details: {
							joinCount: c.length,
							joinTargets: c.map((e) => e.target.name),
							pathSelection: s.map((e) => ({
								targetCube: e.targetCube,
								strategy: e.selection?.strategy,
								selectedRank: e.selection?.selectedRank,
								selectedScore: e.selection?.selectedScore
							}))
						}
					},
					{
						phase: "cte_planning",
						decision: `Planned ${l.length} pre-aggregation CTE${l.length === 1 ? "" : "s"}`,
						details: {
							cteCount: l.length,
							cubes: l.map((e) => e.cube.name)
						}
					},
					{
						phase: "measure_strategy",
						decision: `Selected '${d.strategy}' measure strategy`,
						details: {
							strategy: d.strategy,
							regularMeasures: d.classification.regular.map((e) => e.name),
							multipliedMeasures: d.classification.multiplied.map((e) => e.name),
							deduplicationSafeMeasures: d.classification.deduplicationSafe.map((e) => e.name),
							sourceType: f.type
						}
					},
					{
						phase: "warnings",
						decision: u.length > 0 ? `Generated ${u.length} planning warning${u.length === 1 ? "" : "s"}` : "No planning warnings generated",
						details: { warningCodes: u.map((e) => e.code) }
					}
				] }
			}
		};
	}
	buildSourceFromPhases(e, t, n, r, i, a) {
		let o = this.tryBuildMultiFactMergeSource(i, r, a);
		if (o) return {
			source: o,
			strategy: "multiFactMerge",
			classification: {
				regular: Z(i, r),
				multiplied: [],
				deduplicationSafe: []
			}
		};
		let s = this.buildSimpleSourceFromPhases(e, t, n, r, i), c = this.classifyMeasuresForStrategy(s.schema.measures, n), l = this.selectMeasureStrategy(c, i, r);
		return l === "keysDeduplication" ? {
			source: this.buildKeysDeduplicationSource(s, c),
			strategy: l,
			classification: c
		} : {
			source: s,
			strategy: l,
			classification: c
		};
	}
	buildSimpleSourceFromPhases(e, t, n, r, i) {
		let a = X(e), o = t, s = n.map((e) => {
			let t = X(e.cube);
			return {
				type: "ctePreAggregate",
				schema: yr(e, r),
				cube: t,
				alias: e.alias,
				cteAlias: e.cteAlias,
				joinKeys: e.joinKeys,
				measures: e.measures,
				propagatingFilters: e.propagatingFilters,
				downstreamJoinKeys: e.downstreamJoinKeys,
				intermediateJoins: e.intermediateJoins,
				cteType: e.cteType ?? "aggregate",
				cteReason: e.cteReason ?? "hasMany"
			};
		});
		return {
			type: "simpleSource",
			schema: vr(i, r),
			primaryCube: a,
			joins: o,
			ctes: s
		};
	}
	tryBuildMultiFactMergeSource(e, t, n) {
		if (!e.measures || e.measures.length < 2) return null;
		let r = /* @__PURE__ */ new Set();
		for (let t of e.measures) {
			let [e] = t.split(".");
			e && r.add(e);
		}
		if (r.size < 2) return null;
		let i = /* @__PURE__ */ new Set();
		for (let t of e.dimensions ?? []) {
			let [e] = t.split(".");
			e && i.add(e);
		}
		for (let t of e.timeDimensions ?? []) {
			let [e] = t.dimension.split(".");
			e && i.add(e);
		}
		if (i.size !== 1) return null;
		let a = Array.from(i)[0];
		if (r.has(a) || !t.get(a)) return null;
		let o = Array.from(r);
		if (!o.every((e) => this.hasDirectJoinToSharedDimension(t.get(e), a, t))) return null;
		let s = gr(e, t), c = _r(e, t), l = {
			measures: Z(e, t),
			dimensions: s,
			timeDimensions: c
		}, u = [];
		for (let r of o) {
			let i = (e.measures ?? []).filter((e) => e.startsWith(`${r}.`)), o = /* @__PURE__ */ new Set([r, a]), s = {
				measures: i,
				dimensions: e.dimensions,
				timeDimensions: e.timeDimensions,
				filters: this.projectFiltersToAllowedCubes(e.filters, o)
			}, c = this.buildGroupQueryNode(s, t, n);
			if (!c) return null;
			u.push(c);
		}
		return u.length < 2 ? null : {
			type: "multiFactMerge",
			schema: l,
			groups: u,
			sharedDimensions: s,
			mergeStrategy: "fullJoin"
		};
	}
	hasDirectJoinToSharedDimension(e, t, n) {
		if (!e?.joins) return !1;
		for (let [, r] of Object.entries(e.joins)) {
			let e = h(r.targetCube, n);
			if (!(!e || e.name !== t) && (r.relationship === "belongsTo" || r.relationship === "hasOne")) return !0;
		}
		return !1;
	}
	buildGroupQueryNode(e, t, n) {
		let r = Array.from(this.queryPlanner.analyzeCubeUsage(e));
		if (r.length === 0) return null;
		let i = this.queryPlanner.analyzePrimaryCube(r, e, t), a = t.get(i.selectedCube);
		if (!a) return null;
		let o = r.length > 1 ? this.queryPlanner.buildJoinPlanForPrimary(t, a, r, n, e) : [], s = r.length > 1 ? this.queryPlanner.buildPreAggregationCTEs(t, a, o, e, n) ?? [] : [], c = this.queryPlanner.buildWarnings(e, s), l = this.buildSourceFromPhases(a, o, s, t, e, n);
		return this.buildQueryNode(l.source, e, t, c);
	}
	projectFiltersToAllowedCubes(e, t) {
		if (!e || e.length === 0) return;
		let n = e.map((e) => this.projectFilterNodeToAllowedCubes(e, t)).filter((e) => !!e);
		return n.length > 0 ? n : void 0;
	}
	projectFilterNodeToAllowedCubes(e, t) {
		if ("member" in e) {
			let [n] = e.member.split(".");
			return n && t.has(n) ? e : null;
		}
		if ("and" in e) {
			let n = (e.and ?? []).map((e) => this.projectFilterNodeToAllowedCubes(e, t)).filter((e) => !!e);
			return n.length === 0 ? null : n.length === 1 ? n[0] : { and: n };
		}
		if ("or" in e) {
			let n = (e.or ?? []).map((e) => this.projectFilterNodeToAllowedCubes(e, t)).filter((e) => !!e);
			return n.length === 0 ? null : n.length === 1 ? n[0] : { or: n };
		}
		return null;
	}
	classifyMeasuresForStrategy(e, t) {
		let n = {
			regular: [],
			multiplied: [],
			deduplicationSafe: []
		}, r = new Set(t.filter((e) => e.cteReason === "fanOutPrevention").map((e) => e.cube.name));
		for (let t of e) {
			let e = t.cube.cube, i = e.measures?.[t.localName];
			if (!i || !r.has(e.name)) {
				n.regular.push(t);
				continue;
			}
			this.isDeduplicationSafeMeasure(i) ? n.deduplicationSafe.push(t) : n.multiplied.push(t);
		}
		return n;
	}
	selectMeasureStrategy(e, t, n) {
		return e.multiplied.length === 0 ? "simple" : e.multiplied.every((e) => this.getPrimaryKeyColumns(e.cube.cube).length > 0) && this.isKeysDeduplicationExecutionSupported(e, t, n) ? "keysDeduplication" : "ctePreAggregateFallback";
	}
	isKeysDeduplicationExecutionSupported(e, t, n) {
		let r = new Set(e.multiplied.map((e) => e.cube.name));
		if (r.size !== 1) return !1;
		let i = Array.from(r)[0], a = t.measures ?? [];
		if (a.length === 0) return !1;
		let o = n.get(i);
		if (!o) return !1;
		for (let e of a) {
			let [t, r] = e.split(".");
			if (t !== i) {
				let e = n.get(t)?.measures?.[r];
				if (!e || ![
					"sum",
					"count",
					"number",
					"min",
					"max"
				].includes(e.type)) return !1;
				continue;
			}
			let a = o.measures?.[r];
			if (!a || ![
				"sum",
				"count",
				"number",
				"min",
				"max",
				"avg"
			].includes(a.type)) return !1;
		}
		return !this.queryHasMeasureFilter(t, i, o);
	}
	queryHasMeasureFilter(e, t, n) {
		let r = (e) => {
			let [r, i] = e.split(".");
			return r === t && !!n.measures?.[i];
		}, i = (e) => {
			if (!e) return !1;
			for (let t of e) {
				if ("and" in t) {
					if (i(t.and)) return !0;
					continue;
				}
				if ("or" in t) {
					if (i(t.or)) return !0;
					continue;
				}
				if ("member" in t && r(t.member)) return !0;
			}
			return !1;
		};
		return i(e.filters);
	}
	buildKeysDeduplicationSource(e, t) {
		let n = this.deduplicateColumnRefs(t.multiplied.flatMap((e) => this.getPrimaryKeyColumns(e.cube.cube))), r = t.regular.length > 0 ? t.regular.map((e) => e.name) : void 0;
		return {
			type: "keysDeduplication",
			schema: e.schema,
			keysSource: e,
			measureSource: e,
			joinOn: n,
			regularMeasures: r
		};
	}
	isDeduplicationSafeMeasure(e) {
		return e.type === "countDistinct" || e.type === "countDistinctApprox";
	}
	getPrimaryKeyColumns(e) {
		let t = [];
		for (let [n, r] of Object.entries(e.dimensions ?? {})) !r.primaryKey || typeof r.sql == "function" || t.push({
			column: r.sql,
			alias: `${e.name}.${n}`
		});
		return t;
	}
	deduplicateColumnRefs(e) {
		let t = /* @__PURE__ */ new Map();
		for (let n of e) {
			let e = n.alias ?? String(n.column?.name ?? "");
			t.has(e) || t.set(e, n);
		}
		return Array.from(t.values());
	}
	buildQueryNode(e, t, n, r) {
		let i = vr(t, n), { measures: a, dimensions: o, timeDimensions: s } = i, c = this.buildOrderByRefs(t);
		return {
			type: "query",
			schema: i,
			source: e,
			dimensions: o,
			measures: a,
			filters: t.filters ?? [],
			timeDimensions: s,
			orderBy: c,
			limit: t.limit,
			offset: t.offset,
			ungrouped: t.ungrouped,
			warnings: r
		};
	}
	buildPreAggregationAnalysis(e) {
		return e.map((e) => ({
			cubeName: e.cube.name,
			cteAlias: e.cteAlias,
			reason: e.cteReason === "fanOutPrevention" ? `Potential fan-out from hasMany joins - pre-aggregate ${e.cube.name} to preserve correctness` : `hasMany relationship requires pre-aggregation for ${e.cube.name}`,
			reasonType: e.cteReason,
			measures: e.measures,
			joinKeys: e.joinKeys.map((e) => ({
				sourceColumn: e.sourceColumn,
				targetColumn: e.targetColumn
			})),
			cteType: e.cteType
		}));
	}
	buildOrderByRefs(e) {
		return e.order ? Object.entries(e.order).map(([e, t]) => ({
			name: e,
			direction: t
		})) : [];
	}
}, xr = class {
	name = "identity";
	optimise(e) {
		return e;
	}
};
//#endregion
//#region src/server/physical-plan/processors/cte-processor.ts
function Sr(e, t, n, r) {
	let i = Cr(e, n, r), a = [], o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
	if (e.preAggregationCTEs && e.preAggregationCTEs.length > 0) for (let c of e.preAggregationCTEs) {
		let l = r.cteBuilder.buildPreAggregationCTE(c, t, n, e, i);
		l && (a.push(l), o.set(c.cube.name, c.cteAlias), wr(c, s));
	}
	return {
		preBuiltFilterMap: i,
		ctes: a,
		cteAliasMap: o,
		downstreamCubeMap: s
	};
}
function Cr(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	if (!e.preAggregationCTEs || e.preAggregationCTEs.length === 0) return r;
	for (let i of e.preAggregationCTEs) if (!(!i.propagatingFilters || i.propagatingFilters.length === 0)) for (let e of i.propagatingFilters) {
		let i = e.sourceCube.name;
		if (!r.has(i)) {
			let a = { filters: e.filters }, o = /* @__PURE__ */ new Map([[i, e.sourceCube]]), s = n.queryBuilder.buildWhereConditions(o, a, t);
			r.set(i, s);
		}
		let a = r.get(i);
		a && a.length > 0 && (e.preBuiltFilterSQL = a.length === 1 ? a[0] : w(...a));
	}
	return r;
}
function wr(e, t) {
	if (e.downstreamJoinKeys) for (let n of e.downstreamJoinKeys) t.set(n.targetCubeName, {
		cteAlias: e.cteAlias,
		joinKeys: n.joinKeys
	});
}
//#endregion
//#region src/server/physical-plan/processors/window-processor.ts
function Tr(e, t, n, r, i, a) {
	if (n.measures) for (let o of n.measures) {
		let [s, c] = o.split("."), l = i.get(s);
		if (!l?.measures?.[c]) continue;
		let u = l.measures[c];
		if (!U.isPostAggregationWindow(u)) continue;
		let d = U.getWindowBaseMeasure(u, s);
		if (!d) continue;
		let [f, p] = d.split("."), m = i.get(f);
		if (!m?.measures?.[p]) continue;
		let h = m.measures[p], g = t.preAggregationCTEs?.find((e) => e.cube?.name === f && e.measures?.includes(d)), _;
		if (g) {
			let e = C`${C.identifier(g.cteAlias)}.${C.identifier(p)}`;
			_ = C`sum(${e})`;
		} else _ = a.queryBuilder.buildMeasureExpression(h, r, m);
		e[d] || (e[d] = C`${_}`.as(d));
		let v = Er(u, _, n, r, l, t, a);
		v && (e[o] = C`${v}`.as(o));
	}
}
function Er(e, t, n, r, i, a, o) {
	let s = e.windowConfig || {}, c = (e, t) => {
		if (!a.preAggregationCTEs) return null;
		let n = a.preAggregationCTEs.find((t) => t.cube?.name === e);
		return n && n.cteAlias ? C`${C.identifier(n.cteAlias)}.${C.identifier(t)}` : null;
	}, u;
	if (s.orderBy && s.orderBy.length > 0) u = s.orderBy.map((e) => {
		let a = e.field.includes(".") ? e.field.split(".")[1] : e.field;
		if (n.timeDimensions) for (let t of n.timeDimensions) {
			let [n, s] = t.dimension.split(".");
			if (s === a) {
				let l = c(n, a);
				if (l) return {
					field: l,
					direction: e.direction
				};
				let u = i.dimensions?.[s];
				if (u) return {
					field: o.queryBuilder.buildTimeDimensionExpression(u.sql, t.granularity, r),
					direction: e.direction
				};
			}
		}
		let u = i.dimensions?.[a];
		return u ? {
			field: l(u.sql, r),
			direction: e.direction
		} : a === (s.measure?.includes(".") ? s.measure.split(".")[1] : s.measure) || e.field === s.measure ? {
			field: t,
			direction: e.direction
		} : null;
	}).filter((e) => e !== null);
	else if (n.timeDimensions && n.timeDimensions.length > 0) {
		let e = n.timeDimensions[0], [t, a] = e.dimension.split("."), s = c(t, a);
		if (s) u = [{
			field: s,
			direction: "asc"
		}];
		else {
			let n = i.name === t ? i : void 0;
			if (n?.dimensions?.[a]) {
				let t = n.dimensions[a];
				u = [{
					field: o.queryBuilder.buildTimeDimensionExpression(t.sql, e.granularity, r),
					direction: "asc"
				}];
			}
		}
	}
	let d;
	s.partitionBy && s.partitionBy.length > 0 && (d = s.partitionBy.map((e) => {
		let t = e.includes(".") ? e.split(".")[1] : e, n = i.dimensions?.[t];
		return n ? l(n.sql, r) : null;
	}).filter((e) => e !== null));
	let f = o.databaseAdapter.buildWindowFunction(e.type, t, d, u, {
		offset: s.offset,
		defaultValue: s.defaultValue,
		nTile: s.nTile,
		frame: s.frame
	});
	if (!f) return null;
	switch (s.operation || U.getDefaultWindowOperation(e.type)) {
		case "difference": return C`${t} - ${f}`;
		case "ratio": return C`${t} / NULLIF(${f}, 0)`;
		case "percentChange": return C`((${t} - ${f}) / NULLIF(${f}, 0)) * 100`;
		default: return f;
	}
}
//#endregion
//#region src/server/physical-plan/processors/selection-processor.ts
function Dr(e, t, n, r, i) {
	let a = { ...i.queryBuilder.buildSelections(e.joinCubes.length > 0 ? r : e.primaryCube, t, n) };
	if (e.preAggregationCTEs) for (let o of e.preAggregationCTEs) Or(a, o, t, n, r, i), Ar(a, o, r);
	return Tr(a, e, t, n, r, i), a;
}
function Or(e, t, n, r, i, a) {
	let o = t.cube.name;
	for (let s of t.measures) {
		if (!e[s]) continue;
		let [, c] = s.split("."), l = i.get(o);
		if (!l?.measures?.[c]) continue;
		let u = l.measures[c], d = C`${C.identifier(t.cteAlias)}.${C.identifier(c)}`, f;
		f = u.type === "calculated" && u.calculatedSql ? a.queryBuilder.buildCTECalculatedMeasure(u, l, t, i, r) : kr(u, d, t, n, i, a), e[s] = C`${f}`.as(s);
	}
}
function kr(e, t, n, r, i, a) {
	let o = n.cteReason === "fanOutPrevention", s = jr(n, r, i), c = o || s;
	switch (e.type) {
		case "count":
		case "countDistinct":
		case "sum": return c ? D(t) : E(t);
		case "avg": return c ? D(t) : a.databaseAdapter.buildAvg(t);
		case "min": return he(t);
		case "max": return D(t);
		case "number": return D(t);
		default: return c ? D(t) : E(t);
	}
}
function Ar(e, t, n) {
	let r = t.cube.name;
	for (let i in e) {
		let [a, o] = i.split(".");
		if (a !== r) continue;
		let s = n.get(r), c = s && s.dimensions?.[o], l = i.startsWith(r + ".");
		if (!c && !l) continue;
		let u = t.joinKeys.find((e) => e.targetColumn === o);
		if (!u && s?.dimensions?.[o]) {
			let e = s.dimensions[o].sql;
			u = t.joinKeys.find((t) => t.targetColumnObj === e);
		}
		(u || l && s?.dimensions?.[o]) && (e[i] = C`${C.identifier(t.cteAlias)}.${C.identifier(o)}`.as(i));
	}
}
function jr(e, t, n) {
	return e.cteReason !== "hasMany" || e.downstreamJoinKeys && e.downstreamJoinKeys.length > 0 || e.intermediateJoins && e.intermediateJoins.length > 0 || !(t.dimensions && t.dimensions.length > 0 || t.timeDimensions && t.timeDimensions.length > 0) || t.dimensions?.some((t) => t.startsWith(`${e.cube.name}.`)) || t.timeDimensions?.some((t) => t.dimension.startsWith(`${e.cube.name}.`)) ? !1 : e.joinKeys.length > 0 && e.joinKeys.every((e) => !!e.sourceColumnObj && Mr(e.sourceColumnObj, t, n));
}
function Mr(e, t, n) {
	if (t.dimensions) for (let r of t.dimensions) {
		let [t, i] = r.split(".");
		if (n.get(t)?.dimensions?.[i]?.sql === e) return !0;
	}
	if (t.timeDimensions) for (let r of t.timeDimensions) {
		if (r.granularity) continue;
		let [t, i] = r.dimension.split(".");
		if (n.get(t)?.dimensions?.[i]?.sql === e) return !0;
	}
	return !1;
}
//#endregion
//#region src/server/physical-plan/processors/shared.ts
function Q(e, t, n, r) {
	switch (t) {
		case "inner": return e.innerJoin(n, r);
		case "right": return e.rightJoin(n, r);
		case "full": return e.fullJoin(n, r);
		default: return e.leftJoin(n, r);
	}
}
function Nr(e) {
	let t = /* @__PURE__ */ new Map();
	if (t.set(e.primaryCube.name, e.primaryCube), e.joinCubes) for (let n of e.joinCubes) t.set(n.cube.name, n.cube);
	return t;
}
//#endregion
//#region src/server/physical-plan/processors/joins-processor.ts
function Pr(e, t, n, r, i, a) {
	let o = [], s = Fr(t, n, r, i);
	s = Ir(s, n.joins);
	let c = /* @__PURE__ */ new Set(), l = Lr(e);
	if (e.joinCubes && e.joinCubes.length > 0) for (let n of e.joinCubes) {
		let r = n.cube.name;
		l.has(r) && !i.cteAliasMap.has(r) || (s = Rr(s, n, e, i, t, o), s = Vr(s, n, e, i, t, a, c));
	}
	return {
		drizzleQuery: s,
		allWhereConditions: o,
		cubesWithSecurityInJoin: c,
		absorbedIntermediateCubes: l
	};
}
function Fr(e, t, n, r) {
	return r.ctes.length > 0 ? e.db.with(...r.ctes).select(n).from(t.from) : e.db.select(n).from(t.from);
}
function Ir(e, t) {
	if (!t) return e;
	let n = e;
	for (let e of t) n = Q(n, e.type ?? "left", e.table, e.on);
	return n;
}
function Lr(e) {
	let t = /* @__PURE__ */ new Set();
	if (e.preAggregationCTEs) {
		for (let n of e.preAggregationCTEs) if (n.intermediateJoins && n.intermediateJoins.length > 0) for (let e of n.intermediateJoins) t.add(e.cube.name);
	}
	return t;
}
function Rr(e, t, n, r, i, a) {
	let o = t.junctionTable;
	if (!o) return e;
	let s = zr(o, t, n, r), c = [];
	if (o.securitySql) {
		let e = o.securitySql(i.securityContext);
		Array.isArray(e) ? c.push(...e) : c.push(e);
	}
	try {
		let t = Q(e, o.joinType ?? "left", o.table, s);
		return c.length > 0 && a.push(...c), t;
	} catch {
		return e;
	}
}
function zr(e, t, n, r) {
	let i = e.joinCondition, a = e.sourceCubeName ? r.cteAliasMap.get(e.sourceCubeName) : void 0;
	if (!a) return i;
	let o = (n.preAggregationCTEs?.find((t) => t.cube.name === e.sourceCubeName))?.downstreamJoinKeys?.find((e) => e.targetCubeName === t.cube.name);
	if (o && o.joinKeys.length > 0) {
		let e = [];
		for (let t of o.joinKeys) {
			let n = C`${C.identifier(a)}.${C.identifier(t.sourceColumn)}`, r = t.targetColumnObj;
			r && e.push(b(r, n));
		}
		e.length > 0 && (i = w(...e));
	}
	return i;
}
function Br(e, t, n, r, i, a) {
	if (t) return {
		joinTarget: C`${C.identifier(t)}`,
		joinCondition: a.cteBuilder.buildCTEJoinCondition(e, t, r),
		securityCondition: void 0,
		joinCubeBase: void 0
	};
	let o = n.downstreamCubeMap.get(e.cube.name), s = e.cube.sql(i), c;
	if (o && !e.junctionTable) {
		let e = [];
		for (let t of o.joinKeys) {
			let n = C`${C.identifier(o.cteAlias)}.${C.identifier(t.sourceColumn)}`, r = t.targetColumnObj || C.identifier(t.targetColumn);
			e.push(b(n, r));
		}
		c = e.length === 1 ? e[0] : w(...e);
	} else c = e.joinCondition;
	return {
		joinTarget: s.from,
		joinCondition: c,
		securityCondition: s.where,
		joinCubeBase: s
	};
}
function Vr(e, t, n, r, i, a, o) {
	let { joinTarget: s, joinCondition: c, securityCondition: l, joinCubeBase: u } = Br(t, r.cteAliasMap.get(t.cube.name), r, n, i, a), d = t.joinType || "left", f = d !== "inner" && l ? w(c, l) : c;
	try {
		let n;
		return d === "inner" ? n = e.innerJoin(s, c) : (n = Q(e, d, s, f), l && o.add(t.cube.name)), Ir(n, u?.joins);
	} catch {
		return e;
	}
}
//#endregion
//#region src/server/physical-plan/processors/predicates-processor.ts
function Hr(e, t, n, r, i, a, o, s) {
	let c = Ur(e, t, n, r, i, a, o, s), l = o.drizzleQuery;
	if (c.length > 0) {
		let e = c.length === 1 ? c[0] : w(...c);
		l = l.where(e);
	}
	return Wr(l, e, t, n, r, s);
}
function Ur(e, t, n, r, i, a, o, s) {
	let c = [...o.allWhereConditions];
	if (i.where && c.push(i.where), e.joinCubes && e.joinCubes.length > 0) for (let t of e.joinCubes) {
		let e = t.cube.name;
		if (a.cteAliasMap.get(e) || o.absorbedIntermediateCubes.has(e) || o.cubesWithSecurityInJoin.has(e)) continue;
		let r = t.cube.sql(n);
		r.where && c.push(r.where);
	}
	let l = s.queryBuilder.buildWhereConditions(e.joinCubes.length > 0 ? r : e.primaryCube, t, n, e, a.preBuiltFilterMap);
	return l.length > 0 && c.push(...l), c;
}
function Wr(e, t, n, r, i, a) {
	let o = t.joinCubes.length > 0 ? i : t.primaryCube, s = e, c = a.queryBuilder.buildGroupByFields(o, n, r, t);
	if (c.length > 0 && (s = s.groupBy(...c)), !n.ungrouped) {
		let e = a.queryBuilder.buildHavingConditions(o, n, r, t);
		if (e.length > 0) {
			let t = e.length === 1 ? e[0] : w(...e);
			s = s.having(t);
		}
	}
	let l = a.queryBuilder.buildOrderBy(n);
	return l.length > 0 && (s = s.orderBy(...l)), a.queryBuilder.applyLimitAndOffset(s, n);
}
//#endregion
//#region src/server/physical-plan/processors/keys-dedup-processor.ts
function Gr(e, t, n, r) {
	let i = e.keysDeduplication;
	if (!i?.multipliedCubeName || !t.measures?.length) return null;
	let a = e.joinCubes.length > 0 ? Nr(e) : /* @__PURE__ */ new Map([[e.primaryCube.name, e.primaryCube]]), o = a.get(i.multipliedCubeName);
	if (!o || !ei(t, o, i.multipliedCubeName)) return null;
	let s = i.primaryKeyDimensions.length > 0 ? i.primaryKeyDimensions : ni(o);
	if (s.length === 0) return null;
	let c = `${i.multipliedCubeName.toLowerCase()}_keys`, l = `${i.multipliedCubeName.toLowerCase()}_pk_agg`, u = i.regularMeasures ?? [], d = Kr(t, n, r, a, o, s, u);
	if (!d) return null;
	let f = qr(e, t, n, r, a, c, d.keysSelections, d.keyGroupBy), p = Xr(t, n, r, o, s, d.multipliedMeasures, l);
	return p ? $r(t, n, r, a, o, {
		keysAlias: c,
		aggAlias: l,
		keysCte: f,
		aggCte: p,
		pkDimensions: s,
		pkAliases: d.pkAliases,
		multipliedMeasures: d.multipliedMeasures,
		regularMeasureNames: u
	}) : null;
}
function Kr(e, t, n, r, i, a, o) {
	let s = {}, c = [];
	if (e.dimensions) for (let n of e.dimensions) {
		let [e, i] = n.split("."), a = r.get(e), o = a?.dimensions?.[i];
		if (!a || !o) return null;
		let u = l(o.sql, t);
		s[n] = C`${u}`.as(n), c.push(u);
	}
	if (e.timeDimensions) for (let i of e.timeDimensions) {
		let [e, a] = i.dimension.split("."), o = r.get(e), l = o?.dimensions?.[a];
		if (!o || !l) return null;
		let u = n.queryBuilder.buildTimeDimensionExpression(l.sql, i.granularity, t);
		s[i.dimension] = C`${u}`.as(i.dimension), c.push(u);
	}
	let u = [];
	for (let e of a) {
		let n = i.dimensions?.[e];
		if (!n) return null;
		let r = l(n.sql, t), a = `__pk__${e}`;
		s[a] = C`${r}`.as(a), c.push(r), u.push(a);
	}
	let d = new Set(o), f = e.measures.filter((e) => !d.has(e));
	if (o.length > 0) {
		let e = n.queryBuilder.buildResolvedMeasures(o, r, t);
		for (let t of o) {
			let n = e.get(t);
			if (!n) return null;
			let r = `__reg__${t.replace(".", "__")}`;
			s[r] = C`${n()}`.as(r);
		}
	}
	return {
		keysSelections: s,
		keyGroupBy: c,
		pkAliases: u,
		multipliedMeasures: f
	};
}
function qr(e, t, n, r, i, a, o, s) {
	let c = e.primaryCube.sql(n), l = [];
	c.where && l.push(c.where);
	let u = n.db.select(o).from(c.from);
	if (c.joins) for (let e of c.joins) u = Q(u, e.type ?? "left", e.table, e.on);
	for (let t of e.joinCubes) u = Jr(u, t, n, l);
	return l.push(...r.queryBuilder.buildWhereConditions(i, t, n)), u = Qr(u, l), s.length > 0 && (u = u.groupBy(...s)), n.db.$with(a).as(u);
}
function Jr(e, t, n, r) {
	let i = e;
	t.junctionTable && (i = Q(i, t.junctionTable.joinType ?? "left", t.junctionTable.table, t.junctionTable.joinCondition), Yr(t.junctionTable.securitySql, n, r));
	let a = t.cube.sql(n);
	if (i = Q(i, t.joinType ?? "left", a.from, t.joinCondition), a.joins) for (let e of a.joins) i = Q(i, e.type ?? "left", e.table, e.on);
	return a.where && r.push(a.where), i;
}
function Yr(e, t, n) {
	if (!e) return;
	let r = e(t.securityContext);
	Array.isArray(r) ? n.push(...r) : n.push(r);
}
function Xr(e, t, n, r, i, a, o) {
	let s = r.sql(t), c = Zr(t, n, r, i, a);
	if (!c) return null;
	let l = t.db.select(c.aggSelections).from(s.from);
	if (s.joins) for (let e of s.joins) l = Q(l, e.type ?? "left", e.table, e.on);
	let u = [];
	return s.where && u.push(s.where), u.push(...n.queryBuilder.buildWhereConditions(r, e, t)), l = Qr(l, u), c.aggGroupBy.length > 0 && (l = l.groupBy(...c.aggGroupBy)), t.db.$with(o).as(l);
}
function Zr(e, t, n, r, i) {
	let a = {}, o = [];
	for (let t of r) {
		let r = n.dimensions?.[t];
		if (!r) return null;
		let i = l(r.sql, e);
		a[t] = C`${i}`.as(t), o.push(i);
	}
	let s = /* @__PURE__ */ new Set();
	for (let e of i) {
		let [, t] = e.split(".");
		n.measures?.[t]?.type === "avg" && s.add(t);
	}
	let c = i.filter((e) => {
		let [, t] = e.split(".");
		return !s.has(t);
	});
	if (c.length > 0) {
		let r = t.queryBuilder.buildResolvedMeasures(c, /* @__PURE__ */ new Map([[n.name, n]]), e);
		for (let e of c) {
			let [, t] = e.split("."), n = r.get(e);
			if (!n || typeof n != "function") return null;
			a[t] = C`${n()}`.as(t);
		}
	}
	for (let t of i) {
		let [, r] = t.split(".");
		if (!s.has(r)) continue;
		let i = n.measures?.[r];
		if (!i?.sql) return null;
		let o = l(i.sql, e), c = `__avg_sum__${r}`, u = `__avg_count__${r}`;
		a[c] = C`sum(${o})`.as(c), a[u] = C`count(${o})`.as(u);
	}
	return {
		aggSelections: a,
		aggGroupBy: o
	};
}
function Qr(e, t) {
	return t.length === 0 ? e : e.where(t.length === 1 ? t[0] : w(...t));
}
function $r(e, t, n, r, i, a) {
	let { keysAlias: o, aggAlias: s, keysCte: c, aggCte: l, pkDimensions: u, pkAliases: d, multipliedMeasures: f, regularMeasureNames: p } = a, m = {};
	for (let t of e.dimensions ?? []) m[t] = C`${C.identifier(o)}.${C.identifier(t)}`.as(t);
	for (let t of e.timeDimensions ?? []) m[t.dimension] = C`${C.identifier(o)}.${C.identifier(t.dimension)}`.as(t.dimension);
	for (let e of f) {
		let [, t] = e.split("."), n = i.measures?.[t];
		m[e] = ri(n?.type ?? "sum", s, t, e);
	}
	for (let e of p) {
		let [t, n] = e.split("."), i = r.get(t)?.measures?.[n], a = `__reg__${e.replace(".", "__")}`;
		m[e] = ri(i?.type ?? "sum", o, a, e);
	}
	let h = t.db.with(c, l).select(m).from(C`${C.identifier(o)}`), g = d.map((e, t) => b(C`${C.identifier(o)}.${C.identifier(e)}`, C`${C.identifier(s)}.${C.identifier(u[t])}`)), _ = g.length === 1 ? g[0] : w(...g);
	h = h.leftJoin(C`${C.identifier(s)}`, _);
	let v = [...(e.dimensions ?? []).map((e) => C`${C.identifier(o)}.${C.identifier(e)}`), ...(e.timeDimensions ?? []).map((e) => C`${C.identifier(o)}.${C.identifier(e.dimension)}`)];
	v.length > 0 && (h = h.groupBy(...v));
	let y = n.queryBuilder.buildOrderBy(e, Object.keys(m));
	return y.length > 0 && (h = h.orderBy(...y)), n.queryBuilder.applyLimitAndOffset(h, e);
}
function ei(e, t, n) {
	if (!e.measures?.length) return !1;
	for (let r of e.measures) {
		let [e, i] = r.split(".");
		if (e !== n) continue;
		let a = t.measures?.[i];
		if (!a || ![
			"sum",
			"count",
			"number",
			"min",
			"max",
			"avg"
		].includes(a.type)) return !1;
	}
	return !ti(e, t, n);
}
function ti(e, t, n) {
	let r = (e) => {
		if (!e) return !1;
		for (let i of e) {
			if ("and" in i) {
				if (r(i.and)) return !0;
				continue;
			}
			if ("or" in i) {
				if (r(i.or)) return !0;
				continue;
			}
			if ("member" in i) {
				let [e, r] = i.member.split(".");
				if (e === n && t.measures?.[r]) return !0;
			}
		}
		return !1;
	};
	return r(e.filters);
}
function ni(e) {
	return Object.entries(e.dimensions ?? {}).filter(([, e]) => !!e.primaryKey).map(([e]) => e);
}
function ri(e, t, n, r) {
	switch (e) {
		case "min": {
			let e = C`${C.identifier(t)}.${C.identifier(n)}`;
			return C`min(${e})`.as(r);
		}
		case "max": {
			let e = C`${C.identifier(t)}.${C.identifier(n)}`;
			return C`max(${e})`.as(r);
		}
		case "avg": {
			let e = C`${C.identifier(t)}.${C.identifier(`__avg_sum__${n}`)}`, i = C`${C.identifier(t)}.${C.identifier(`__avg_count__${n}`)}`;
			return C`sum(${e}) / nullif(sum(${i}), 0)`.as(r);
		}
		default: {
			let e = C`${C.identifier(t)}.${C.identifier(n)}`;
			return C`coalesce(sum(${e}), 0)`.as(r);
		}
	}
}
//#endregion
//#region src/server/physical-plan/processors/multi-fact-processor.ts
function ii(e, t, n, r, i) {
	let a = e.multiFactMerge;
	if (!a || a.groups.length < 2) return null;
	let o = [...t.dimensions ?? [], ...(t.timeDimensions ?? []).map((e) => e.dimension)], s = Array.from(new Set(o)), c = s.length > 0, l = di(r), u = c && a.mergeStrategy === "fullJoin" && !l, d = a.groups.map((e) => {
		let t = i(e.queryPlan, e.query, n);
		return n.db.$with(e.alias).as(t);
	});
	return u ? ci(t, n, r, a, d, s) : si(t, n, r, a, d, s, ui(a.mergeStrategy, c, l));
}
function ai(e, t, n) {
	let r = {};
	for (let e of t) {
		let t = fi(n, e);
		r[e] = C`${t}`.as(e);
	}
	for (let t of e.groups) for (let e of t.measures) {
		let n = C`${C.identifier(t.alias)}.${C.identifier(e)}`;
		r[e] = C`coalesce(${n}, 0)`.as(e);
	}
	return r;
}
function oi(e, t, n) {
	if (t.length === 0) return C`1 = 1`;
	let r = t.map((t) => b(n.get(t), C`${C.identifier(e)}.${C.identifier(t)}`));
	return r.length === 1 ? r[0] : w(...r);
}
function si(e, t, n, r, i, a, o) {
	let s = r.groups[0].alias, c = ai(r, a, r.groups.map((e) => e.alias)), l = t.db.with(...i).select(c).from(C`${C.identifier(s)}`), u = /* @__PURE__ */ new Map();
	for (let e of a) u.set(e, C`${C.identifier(s)}.${C.identifier(e)}`);
	for (let e = 1; e < r.groups.length; e++) {
		let t = r.groups[e].alias, n = oi(t, a, u);
		if (l = Q(l, o, C`${C.identifier(t)}`, n), a.length > 0 && o === "full") for (let e of a) u.set(e, C`coalesce(${u.get(e)}, ${C`${C.identifier(t)}.${C.identifier(e)}`})`);
	}
	let d = n.queryBuilder.buildOrderBy(e, Object.keys(c));
	return d.length > 0 && (l = l.orderBy(...d)), n.queryBuilder.applyLimitAndOffset(l, e);
}
function ci(e, t, n, r, i, a) {
	let o = "mf_all_keys", s = r.groups.map((e) => C`select ${li(e.alias, a)} from ${C.identifier(e.alias)}`), c = C`${C.join(s, C` union `)}`, l = t.db.$with(o).as(c), u = {};
	for (let e of a) u[e] = C`${C.identifier(o)}.${C.identifier(e)}`.as(e);
	for (let e of r.groups) for (let t of e.measures) {
		let n = C`${C.identifier(e.alias)}.${C.identifier(t)}`;
		u[t] = C`coalesce(${n}, 0)`.as(t);
	}
	let d = t.db.with(...i, l).select(u).from(C`${C.identifier(o)}`);
	for (let e of r.groups) {
		let t = a.map((t) => b(C`${C.identifier(o)}.${C.identifier(t)}`, C`${C.identifier(e.alias)}.${C.identifier(t)}`)), n = t.length === 1 ? t[0] : w(...t);
		d = d.leftJoin(C`${C.identifier(e.alias)}`, n);
	}
	let f = n.queryBuilder.buildOrderBy(e, Object.keys(u));
	return f.length > 0 && (d = d.orderBy(...f)), n.queryBuilder.applyLimitAndOffset(d, e);
}
function li(e, t) {
	let n = t.map((t) => C`${C.identifier(e)}.${C.identifier(t)} as ${C.identifier(t)}`);
	return C.join(n, C`, `);
}
function ui(e, t, n) {
	return !t || e === "innerJoin" ? "inner" : e === "leftJoin" ? "left" : n ? "full" : "left";
}
function di(e) {
	let t = e.databaseAdapter.getEngineType();
	return t === "postgres" || t === "duckdb";
}
function fi(e, t) {
	if (e.length === 1) return C`${C.identifier(e[0])}.${C.identifier(t)}`;
	let n = e.map((e) => C`${C.identifier(e)}.${C.identifier(t)}`), r = n[0];
	for (let e = 1; e < n.length; e++) r = C`coalesce(${r}, ${n[e]})`;
	return r;
}
//#endregion
//#region src/server/physical-plan/drizzle-plan-builder.ts
var pi = class {
	queryBuilder;
	cteBuilder;
	databaseAdapter;
	constructor(e, t, n) {
		this.queryBuilder = e, this.cteBuilder = t, this.databaseAdapter = n;
	}
	derivePhysicalPlanContext(e) {
		let t = e.source;
		if (t.type === "multiFactMerge") return this.derivePhysicalPlanContextFromMultiFact(e, t);
		if (t.type === "fullKeyAggregate") return this.derivePhysicalPlanContextFromFullKeyAggregate(e, t);
		let n = this.resolvePhysicalSimpleSource(t), r = this.resolveKeysDeduplicationMeta(t);
		return {
			primaryCube: n.primaryCube.cube,
			joinCubes: n.joins.map((e) => this.materializeJoin(e)),
			preAggregationCTEs: n.ctes.map((e) => ({
				cube: e.cube.cube,
				alias: e.alias,
				cteAlias: e.cteAlias,
				joinKeys: e.joinKeys,
				measures: e.measures,
				propagatingFilters: e.propagatingFilters,
				downstreamJoinKeys: e.downstreamJoinKeys,
				intermediateJoins: e.intermediateJoins,
				cteType: e.cteType,
				cteReason: e.cteReason
			})),
			keysDeduplication: r,
			warnings: e.warnings.length > 0 ? e.warnings : void 0
		};
	}
	materializeJoin(e) {
		if (e.junctionTable) {
			let t = oe(e.joinDef);
			return {
				cube: e.target.cube,
				alias: e.alias,
				joinType: e.joinType,
				joinCondition: t.junctionJoins[1].condition,
				relationship: e.relationship,
				junctionTable: {
					table: e.junctionTable.table,
					alias: e.junctionTable.alias,
					joinType: e.junctionTable.joinType,
					joinCondition: t.junctionJoins[0].condition,
					securitySql: e.joinDef.through?.securitySql,
					sourceCubeName: e.junctionTable.sourceCubeName
				}
			};
		}
		return {
			cube: e.target.cube,
			alias: e.alias,
			joinType: e.joinType,
			joinCondition: t(e.joinDef),
			relationship: e.relationship
		};
	}
	derivePhysicalPlanContextFromMultiFact(e, t) {
		let n = t.groups.map((e, t) => {
			if (e.type !== "query") return null;
			let n = e, r = this.derivePhysicalPlanContext(n), i = this.toSemanticQuery(n);
			return {
				alias: `mf_group_${t + 1}`,
				query: i,
				queryPlan: r,
				measures: i.measures ?? []
			};
		}).filter((e) => !!e);
		if (n.length === 0) throw Error("multiFactMerge requires at least one query group");
		let r = n[0];
		return {
			primaryCube: r.queryPlan.primaryCube,
			joinCubes: r.queryPlan.joinCubes,
			preAggregationCTEs: r.queryPlan.preAggregationCTEs,
			warnings: e.warnings.length > 0 ? e.warnings : void 0,
			multiFactMerge: {
				mergeStrategy: t.mergeStrategy,
				sharedDimensions: t.sharedDimensions.map((e) => e.name),
				groups: n
			}
		};
	}
	derivePhysicalPlanContextFromFullKeyAggregate(e, t) {
		let n = t.subqueries.map((e, t) => {
			if (e.type !== "query") throw Error("fullKeyAggregate currently requires query subqueries");
			let n = e, r = this.derivePhysicalPlanContext(n), i = this.toSemanticQuery(n);
			return {
				alias: `fka_group_${t + 1}`,
				query: i,
				queryPlan: r,
				measures: i.measures ?? []
			};
		});
		if (n.length === 0) throw Error("fullKeyAggregate requires at least one subquery");
		let r = n[0];
		return {
			primaryCube: r.queryPlan.primaryCube,
			joinCubes: r.queryPlan.joinCubes,
			preAggregationCTEs: r.queryPlan.preAggregationCTEs,
			warnings: e.warnings.length > 0 ? e.warnings : void 0,
			multiFactMerge: {
				mergeStrategy: "fullJoin",
				sharedDimensions: t.dimensions.map((e) => e.name),
				groups: n
			}
		};
	}
	toSemanticQuery(e) {
		let t = e.orderBy.length > 0 ? Object.fromEntries(e.orderBy.map((e) => [e.name, e.direction])) : void 0;
		return {
			measures: e.measures.map((e) => e.name),
			dimensions: e.dimensions.map((e) => e.name),
			timeDimensions: e.timeDimensions.map((e) => ({
				dimension: e.name,
				granularity: e.granularity,
				dateRange: e.dateRange,
				fillMissingDates: e.fillMissingDates,
				compareDateRange: e.compareDateRange
			})),
			filters: e.filters,
			order: t,
			limit: e.limit,
			offset: e.offset,
			ungrouped: e.ungrouped
		};
	}
	resolvePhysicalSimpleSource(e) {
		switch (e.type) {
			case "simpleSource": return e;
			case "keysDeduplication": return this.resolvePhysicalSimpleSourceFromKeysDedup(e);
			default: throw Error(`Current SQL builder does not support logical node '${e.type}' in physical conversion`);
		}
	}
	resolvePhysicalSimpleSourceFromKeysDedup(e) {
		let t = e.measureSource;
		if (t.type === "simpleSource") return t;
		let n = e.keysSource;
		if (n.type === "simpleSource") return n;
		throw Error("keysDeduplication requires at least one simpleSource child for SQL physical conversion");
	}
	resolveKeysDeduplicationMeta(e) {
		if (e.type !== "keysDeduplication") return;
		let t = e, n = /* @__PURE__ */ new Set();
		for (let e of t.joinOn) {
			if (!e.alias) continue;
			let [t, r] = e.alias.split(".");
			t && r && n.add(t);
		}
		let r = n.size === 1 ? Array.from(n)[0] : "";
		return r ? {
			multipliedCubeName: r,
			primaryKeyDimensions: t.joinOn.map((e) => e.alias?.split(".")[1] ?? "").filter(Boolean),
			regularMeasures: t.regularMeasures
		} : void 0;
	}
	build(e, t, n) {
		let r = {
			queryBuilder: this.queryBuilder,
			cteBuilder: this.cteBuilder,
			databaseAdapter: this.databaseAdapter
		}, i = ii(e, t, n, r, (e, t, n) => this.build(e, t, n));
		if (i) return i;
		let a = Gr(e, t, n, r);
		if (a) return a;
		let o = Sr(e, t, n, r), s = e.primaryCube.sql(n), c = e.joinCubes.length > 0 ? Nr(e) : /* @__PURE__ */ new Map([[e.primaryCube.name, e.primaryCube]]);
		return Hr(e, t, n, c, s, o, Pr(e, n, s, Dr(e, t, n, c, r), o, r), r);
	}
};
//#endregion
//#region src/server/executor.ts
function $(e, t) {
	if (!(typeof process > "u" || !process.env?.DC_DEBUG)) try {
		let { sql: n, params: r } = t.toSQL();
		console.log(`\n[DC_DEBUG] ${e}`), console.log(n), r.length > 0 && console.log("params:", r), console.log();
	} catch {}
}
var mi = class {
	dbExecutor;
	queryBuilder;
	drizzlePlanBuilder;
	databaseAdapter;
	comparisonQueryBuilder;
	funnelQueryBuilder;
	flowQueryBuilder;
	retentionQueryBuilder;
	logicalPlanBuilder;
	planOptimiser;
	modeRouter;
	resultCache;
	filterCachePreloader;
	rlsSetup;
	constructor(e, t, n, r) {
		if (this.dbExecutor = e, this.databaseAdapter = e.databaseAdapter, !this.databaseAdapter) throw Error(S("server.errors.dbAdapterRequired"));
		this.queryBuilder = new gn(this.databaseAdapter);
		let i = new kn(), a = new jn(this.queryBuilder);
		this.drizzlePlanBuilder = new pi(this.queryBuilder, a, this.databaseAdapter), this.comparisonQueryBuilder = new sr(this.databaseAdapter), this.funnelQueryBuilder = new cr(this.databaseAdapter), this.flowQueryBuilder = new lr(this.databaseAdapter), this.retentionQueryBuilder = new hr(this.databaseAdapter), this.logicalPlanBuilder = new br(i), this.planOptimiser = r ?? new xr(), this.rlsSetup = n, this.modeRouter = new Qn({
			comparison: this.comparisonQueryBuilder,
			funnel: this.funnelQueryBuilder,
			flow: this.flowQueryBuilder,
			retention: this.retentionQueryBuilder
		}), this.resultCache = new or(t), this.filterCachePreloader = new Zn(this.queryBuilder);
	}
	async withRLSContext(e, t) {
		if (!this.rlsSetup) return t();
		let n = this.dbExecutor.db;
		if (!n.transaction) throw Error(S("server.errors.rlsRequiresTransactions"));
		let r = this.rlsSetup;
		return n.transaction(async (n) => {
			await r(n, e);
			let i = Object.create(this.dbExecutor);
			return i.db = n, this.dbExecutor = i, t();
		});
	}
	async execute(e, t, n, r) {
		try {
			let i = this.modeRouter.resolveMode(t);
			this.modeRouter.validateForMode(i, e, t);
			let a = this.resultCache.generateKey(t, n, r?.cubeSetKey);
			return await this.resultCache.lookup(a, r?.skipCache ?? !1) || await this.withRLSContext(n, () => this.executeQueryByModeWithCache(i, e, t, n, a));
		} catch (e) {
			if (e instanceof Error) {
				let t = e;
				for (; t.cause instanceof Error;) t = t.cause;
				let n = t.message, r = t;
				throw r.code && (n += ` [${r.code}]`), r.detail && (n += ` Detail: ${r.detail}`), r.hint && (n += ` Hint: ${r.hint}`), e.message = S("server.errors.queryExecutionFailed", { message: n }), e;
			}
			throw Error(S("server.errors.queryExecutionUnknown"), { cause: e });
		}
	}
	buildLogicalPlan(e, t, n) {
		let r = new N(), i = this.createQueryContext(n, r, t);
		return this.filterCachePreloader.preload(t, r, e, i), this.buildRegularQueryArtifacts(e, t, i).optimisedPlan;
	}
	analyzeQuery(e, t, n) {
		let r = new N(), i = this.createQueryContext(n, r, t);
		return this.filterCachePreloader.preload(t, r, e, i), this.buildRegularQueryArtifacts(e, t, i).analysis;
	}
	async executeQuery(e, t, n) {
		let r = /* @__PURE__ */ new Map();
		return r.set(e.name, e), this.execute(r, t, n);
	}
	async executeComparisonQueryWithCache(e, t, n, r) {
		let i = await this.executeComparisonQuery(e, t, n);
		return await this.resultCache.store(r, i), i;
	}
	async executeComparisonQuery(e, t, n) {
		let { timeDimension: r, periods: i, granularity: a, periodQueries: o } = this.buildComparisonExecutionPlan(t), s = o.map(async (t, r) => ({
			result: await this.executeStandardQuery(e, t, n),
			period: i[r]
		})), c = await Promise.all(s), l = this.comparisonQueryBuilder.mergeComparisonResults(c, r, a);
		return l.data = this.comparisonQueryBuilder.sortComparisonResults(l.data, r.dimension), l;
	}
	buildComparisonExecutionPlan(e) {
		let t = this.comparisonQueryBuilder.getComparisonTimeDimension(e);
		if (!t || !t.compareDateRange) throw Error(S("server.errors.noCompareDateRange"));
		let n = this.comparisonQueryBuilder.normalizePeriods(t.compareDateRange);
		if (n.length < 2) throw Error(S("server.errors.compareDateRangeInvalid"));
		let r = n.map((t) => this.comparisonQueryBuilder.createPeriodQuery(e, t));
		return {
			timeDimension: t,
			granularity: t.granularity || "day",
			periods: n,
			periodQueries: r
		};
	}
	async executeAnalysisQueryWithCache(e, t) {
		let n = await e();
		return await this.resultCache.store(t, n), n;
	}
	async executeFunnelQuery(e, t, n) {
		let r = t.funnel, i = this.createQueryContext(n), a = this.funnelQueryBuilder.buildFunnelQuery(r, e, i);
		$("funnel query", a);
		let o = await a, s = this.funnelQueryBuilder.transformResult(o, r), c = {
			measures: {},
			dimensions: {},
			segments: {},
			timeDimensions: {}
		};
		return c.funnel = {
			config: r,
			steps: r.steps.map((e, t) => ({
				name: e.name,
				index: t,
				timeToConvert: e.timeToConvert
			}))
		}, {
			data: s,
			annotation: c
		};
	}
	async executeFlowQuery(e, t, n) {
		let r = t.flow, i = this.createQueryContext(n), a = this.flowQueryBuilder.buildFlowQuery(r, e, i);
		$("flow query", a);
		let o = await a, s = this.flowQueryBuilder.transformResult(o), c = {
			measures: {},
			dimensions: {},
			segments: {},
			timeDimensions: {}
		};
		return c.flow = {
			config: r,
			startingStep: { name: r.startingStep.name },
			stepsBefore: r.stepsBefore,
			stepsAfter: r.stepsAfter
		}, {
			data: [s],
			annotation: c
		};
	}
	async executeRetentionQuery(e, t, n) {
		let r = t.retention, i = this.createQueryContext(n), a = this.retentionQueryBuilder.buildRetentionQuery(r, e, i);
		$("retention query", a);
		let o = await a, s = this.retentionQueryBuilder.transformResult(o, r), c = {
			measures: {},
			dimensions: {},
			segments: {},
			timeDimensions: {}
		};
		return c.retention = {
			config: r,
			granularity: r.granularity,
			periods: r.periods,
			retentionType: r.retentionType,
			breakdownDimensions: r.breakdownDimensions
		}, {
			data: s,
			annotation: c
		};
	}
	async executeStandardQuery(e, t, n, r) {
		let i = new N(), a = this.createQueryContext(n, i, t);
		this.filterCachePreloader.preload(t, i, e, a);
		let { optimisedPlan: o } = this.buildRegularQueryArtifacts(e, t, a), s = this.drizzlePlanBuilder.derivePhysicalPlanContext(o), c = this.drizzlePlanBuilder.toSemanticQuery(o);
		this.validateSecurityContext(s, a);
		let l = this.drizzlePlanBuilder.build(s, c, a);
		$("query", l);
		let u = this.queryBuilder.collectNumericFields(e, t), d = {
			data: Xn(await this.dbExecutor.execute(l, u), t, this.databaseAdapter),
			annotation: Mn(s, t),
			warnings: o.warnings?.length ? o.warnings : void 0,
			total: t.total ? await this.executeTotalCount(s, c, a) : void 0
		};
		return await this.resultCache.store(r, d), d;
	}
	async executeTotalCount(e, t, n) {
		let r = this.drizzlePlanBuilder.build(e, {
			...t,
			limit: void 0,
			offset: void 0,
			order: void 0
		}, n), i = n.db.select({ total: C`count(*)`.as("total") }).from(r.as("dc_total"));
		$("total", i);
		let a = await this.dbExecutor.execute(i), o = a?.[0] ? Object.values(a[0])[0] : void 0, s = Number(o);
		return Number.isFinite(s) ? s : 0;
	}
	createQueryContext(e, t, n) {
		return {
			db: this.dbExecutor.db,
			schema: this.dbExecutor.schema,
			securityContext: e,
			filterCache: t,
			ungrouped: n?.ungrouped,
			cast: (e, t) => this.databaseAdapter.castToType(e, t),
			tryCast: (e, t) => this.databaseAdapter.tryCastToType(e, t)
		};
	}
	getOptimiserEngineType() {
		return this.dbExecutor.getEngineType?.() ?? "postgres";
	}
	buildRegularQueryArtifacts(e, t, n) {
		let r = this.logicalPlanBuilder.planWithAnalysis(e, t, n), i = this.planOptimiser.optimise(r.plan, { engineType: this.getOptimiserEngineType() });
		return {
			logicalPlan: r.plan,
			analysis: r.analysis,
			optimisedPlan: i
		};
	}
	validateSecurityContext(e, t) {
		let n = typeof process < "u" ? process.env.NODE_ENV : void 0, r = typeof process < "u" ? process.env?.DRIZZLE_CUBE_WARN_SECURITY : void 0;
		if (n !== "development" && !r) return;
		let i = [e.primaryCube];
		for (let t of e.joinCubes || []) i.push(t.cube);
		for (let t of e.preAggregationCTEs || []) i.push(t.cube);
		let a = /* @__PURE__ */ new Set();
		for (let e of i) if (!a.has(e.name)) {
			a.add(e.name);
			try {
				if (e.public || this.rlsSetup) continue;
				e.sql(t).where || console.warn(`[drizzle-cube] WARNING: Cube '${e.name}' has no security filtering. If this cube contains public data, add 'public: true' to suppress this warning. Otherwise, ensure sql() returns: { from: table, where: eq(table.orgId, ctx.securityContext.orgId) }. For databases that support Row Level Security (e.g. PostgreSQL), you can configure rlsSetup to run session-level commands (SET LOCAL, SET ROLE) instead.`);
			} catch {}
		}
	}
	async generateSQL(e, t, n) {
		let r = /* @__PURE__ */ new Map();
		return r.set(e.name, e), this.generateUnifiedSQL(r, t, n);
	}
	async generateMultiCubeSQL(e, t, n) {
		return this.generateUnifiedSQL(e, t, n);
	}
	async dryRunFunnel(e, t, n) {
		return this.dryRunAnalysis(t, n, {
			has: (e) => this.funnelQueryBuilder.hasFunnel(e),
			invalidConfigKey: "server.errors.invalidFunnelConfig",
			getConfig: (e) => e.funnel,
			validate: (t) => this.funnelQueryBuilder.validateConfig(t, e),
			validationFailedKey: "server.errors.funnelValidationFailed",
			build: (t, n) => this.funnelQueryBuilder.buildFunnelQuery(t, e, n)
		});
	}
	async dryRunFlow(e, t, n) {
		return this.dryRunAnalysis(t, n, {
			has: (e) => this.flowQueryBuilder.hasFlow(e),
			invalidConfigKey: "server.errors.invalidFlowConfig",
			getConfig: (e) => e.flow,
			validate: (t) => this.flowQueryBuilder.validateConfig(t, e),
			validationFailedKey: "server.errors.flowValidationFailed",
			build: (t, n) => this.flowQueryBuilder.buildFlowQuery(t, e, n)
		});
	}
	async dryRunRetention(e, t, n) {
		return this.dryRunAnalysis(t, n, {
			has: (e) => this.retentionQueryBuilder.hasRetention(e),
			invalidConfigKey: "server.errors.invalidRetentionConfig",
			getConfig: (e) => e.retention,
			validate: (t) => this.retentionQueryBuilder.validateConfig(t, e),
			validationFailedKey: "server.errors.retentionValidationFailed",
			build: (t, n) => this.retentionQueryBuilder.buildRetentionQuery(t, e, n)
		});
	}
	async dryRunAnalysis(e, t, n) {
		if (!n.has(e)) throw Error(S(n.invalidConfigKey));
		let r = n.getConfig(e), i = n.validate(r);
		if (!i.isValid) throw Error(S(n.validationFailedKey, { errors: i.errors.join(", ") }));
		let a = this.createQueryContext(t), o = n.build(r, a).toSQL();
		return {
			sql: o.sql,
			params: o.params
		};
	}
	async explainQuery(e, t, n, r) {
		let i = await this.dryRunSQL(e, t, n);
		return this.withRLSContext(n, () => this.dbExecutor.explainQuery(i.sql, i.params || [], r));
	}
	async dryRunSQL(e, t, n) {
		let r = this.modeRouter.resolveMode(t);
		return this.modeRouter.validateForMode(r, e, t), this.generateSqlForMode(r, e, t, n);
	}
	async generateUnifiedSQL(e, t, n) {
		let r = new N(), i = this.createQueryContext(n, r, t);
		this.filterCachePreloader.preload(t, r, e, i);
		let { optimisedPlan: a } = this.buildRegularQueryArtifacts(e, t, i), o = this.drizzlePlanBuilder.derivePhysicalPlanContext(a), s = this.drizzlePlanBuilder.toSemanticQuery(a), c = this.drizzlePlanBuilder.build(o, s, i).toSQL();
		return {
			sql: c.sql,
			params: c.params
		};
	}
	async executeQueryByModeWithCache(e, t, n, r, i) {
		return {
			regular: () => this.executeStandardQuery(t, n, r, i),
			comparison: () => this.executeComparisonQueryWithCache(t, n, r, i),
			funnel: () => this.executeAnalysisQueryWithCache(() => this.executeFunnelQuery(t, n, r), i),
			flow: () => this.executeAnalysisQueryWithCache(() => this.executeFlowQuery(t, n, r), i),
			retention: () => this.executeAnalysisQueryWithCache(() => this.executeRetentionQuery(t, n, r), i)
		}[_(e)]();
	}
	async generateSqlForMode(e, t, n, r) {
		return {
			regular: () => this.generateUnifiedSQL(t, n, r),
			comparison: () => this.generateComparisonSQL(t, n, r),
			funnel: () => this.dryRunFunnel(t, n, r),
			flow: () => this.dryRunFlow(t, n, r),
			retention: () => this.dryRunRetention(t, n, r)
		}[_(e)]();
	}
	async generateComparisonSQL(e, t, n) {
		let r = this.buildComparisonExecutionPlan(t).periodQueries[0];
		return this.generateUnifiedSQL(e, r, n);
	}
}, hi = [
	"year",
	"quarter",
	"month",
	"week",
	"day",
	"hour"
];
function gi(e, t) {
	return t.includes(".") ? t : `${e}.${t}`;
}
function _i(e, t) {
	if (!t.includes(".")) return t;
	let n = `${e}.`;
	return t.startsWith(n) ? t.slice(n.length) : null;
}
function vi(e) {
	let t = Object.keys(e.measures), n = [];
	for (let r = 0; r < t.length; r++) {
		let i = t[r], a = e.measures[i];
		if (a.shown === !1) continue;
		let o;
		a.drillMembers && a.drillMembers.length > 0 && (o = a.drillMembers.map((t) => gi(e.name, t))), n.push({
			name: `${e.name}.${i}`,
			title: a.title || i,
			shortTitle: a.title || i,
			type: a.type,
			format: void 0,
			description: a.description,
			synonyms: a.synonyms,
			drillMembers: o
		});
	}
	return n;
}
function yi(e) {
	let t = Object.keys(e.dimensions), n = [];
	for (let r = 0; r < t.length; r++) {
		let i = t[r], a = e.dimensions[i];
		if (a.shown === !1) continue;
		let o = a.type === "time" ? a.granularities || hi : void 0;
		n.push({
			name: `${e.name}.${i}`,
			title: a.title || i,
			shortTitle: a.title || i,
			type: a.type,
			format: void 0,
			description: a.description,
			synonyms: a.synonyms,
			granularities: o
		});
	}
	return n;
}
function bi(e, t, n) {
	let r = [];
	if (!e.joins) return r;
	for (let [, i] of Object.entries(e.joins)) {
		let e = h(i.targetCube, t);
		e && r.push({
			targetCube: e.name,
			relationship: i.relationship,
			joinFields: i.on.map((e) => ({
				sourceField: n(e.source),
				targetField: n(e.target)
			}))
		});
	}
	return r;
}
function xi(e) {
	let t = [];
	if (!e.hierarchies) return t;
	for (let [, n] of Object.entries(e.hierarchies)) {
		let r = n.levels.filter((t) => {
			let n = _i(e.name, t);
			return n === null || e.dimensions[n]?.shown !== !1;
		}).map((t) => gi(e.name, t));
		r.length !== 0 && t.push({
			name: n.name,
			title: n.title || n.name,
			cubeName: e.name,
			levels: r
		});
	}
	return t;
}
Object.freeze({});
function Si(e) {
	if (typeof process > "u") return;
	let t = process.env?.DC_DEBUG;
	(t === "true" || t === "cubesets") && console.log(`[DC_DEBUG] ${e}`);
}
var Ci = class {
	baseCubes = /* @__PURE__ */ new Map();
	cubeSets = /* @__PURE__ */ new Map();
	metadataCache = /* @__PURE__ */ new Map();
	baseGeneration = 0;
	registrationCounter = 0;
	contextToCubeSetId;
	missingCubeSet = "base";
	onCubeSetRegistered;
	cacheConfig;
	rlsSetup;
	planOptimiser;
	db;
	schema;
	engineType;
	constructor(e) {
		e?.databaseExecutor ? (this.db = e.databaseExecutor.db, this.schema = e.databaseExecutor.schema, this.engineType = e.databaseExecutor.getEngineType()) : e?.drizzle && (this.db = e.drizzle, this.schema = e.schema, this.engineType = e.engineType), this.cacheConfig = e?.cache, this.rlsSetup = e?.rlsSetup, this.planOptimiser = e?.planOptimiser, this.contextToCubeSetId = e?.contextToCubeSetId, this.missingCubeSet = e?.missingCubeSet ?? "base", this.onCubeSetRegistered = e?.onCubeSetRegistered;
	}
	setDatabaseExecutor(e) {
		this.db = e.db, this.schema = e.schema, this.engineType = e.getEngineType();
	}
	getEngineType() {
		return this.engineType;
	}
	setDrizzle(e, t, n) {
		this.db = e, this.schema = t, this.engineType = n;
	}
	hasExecutor() {
		return !!this.db;
	}
	createDbExecutor() {
		if (!this.db) throw Error(S("server.errors.dbNotConfigured"));
		return bt(this.db, this.schema, this.engineType);
	}
	createQueryExecutor(e = !1) {
		return new mi(this.createDbExecutor(), e ? this.cacheConfig : void 0, this.rlsSetup, this.planOptimiser);
	}
	formatSqlResult(e) {
		let t = this.getEngineType() ?? "postgres";
		return {
			sql: de(e.sql, t),
			params: e.params
		};
	}
	registerCube(e) {
		this.prepareCube(e, this.baseCubes), this.baseCubes.set(e.name, e), this.baseGeneration++, this.rebuildAllMergedSets(), this.metadataCache.clear();
	}
	registerCubeSet(e, t) {
		if (e === "") throw Error(S("server.errors.cubeSetIdEmpty"));
		let n = Date.now(), r = /* @__PURE__ */ new Map();
		for (let e of t) {
			let t = new Map(this.baseCubes);
			for (let [e, n] of r) t.set(e, n);
			this.prepareCube(e, t), r.set(e.name, e);
		}
		let i = ++this.registrationCounter, a = this.mergeWithBase(r), o = Date.now() - n;
		this.cubeSets.set(e, {
			overlay: r,
			merged: a,
			generation: i,
			durationMs: o
		}), this.metadataCache.delete(e);
		let s = 0;
		for (let e of r.values()) s += Object.keys(e.dimensions ?? {}).length;
		let c = {
			setId: e,
			cubeCount: a.size,
			dimensionCount: s,
			generation: i,
			durationMs: o
		};
		Si(`registered cube set '${e}': ${r.size} cube(s), ${s} dimension(s), generation ${i}, ${o}ms`), this.onCubeSetRegistered?.(c);
	}
	unregisterCubeSet(e) {
		let t = this.cubeSets.delete(e);
		return t && this.metadataCache.delete(e), t;
	}
	hasCubeSet(e) {
		return this.cubeSets.has(e);
	}
	getCubeSetIds() {
		return Array.from(this.cubeSets.keys());
	}
	getCubeSetStats() {
		let e = 0, t = 0, n;
		for (let [r, i] of this.cubeSets) e += i.merged.size, t += i.durationMs, (!n || i.durationMs > n.durationMs) && (n = {
			setId: r,
			durationMs: i.durationMs
		});
		return {
			setCount: this.cubeSets.size,
			cubeCount: e,
			totalRegistrationMs: t,
			slowestSet: n
		};
	}
	prepareCube(e, t) {
		this.validateCalculatedMeasures(e, t), new H(t).populateDependencies(e);
	}
	mergeWithBase(e) {
		let t = new Map(this.baseCubes);
		for (let [n, r] of e) t.set(n, r);
		return t;
	}
	rebuildAllMergedSets() {
		for (let e of this.cubeSets.values()) e.merged = this.mergeWithBase(e.overlay);
	}
	resolveSetId(e) {
		if (!this.contextToCubeSetId) return "";
		let t = this.contextToCubeSetId(e);
		if (t == null || t === "") return "";
		let n = String(t);
		if (!this.cubeSets.has(n)) {
			if (this.missingCubeSet === "throw") throw Error(S("server.errors.cubeSetNotFound", { setId: n }));
			return "";
		}
		return n;
	}
	resolveCubes(e) {
		let t = this.resolveSetId(e);
		return t === "" ? this.baseCubes : this.cubeSets.get(t)?.merged ?? this.baseCubes;
	}
	cubeSetCacheKey(e) {
		let t = this.cubeSets.get(e)?.generation ?? 0;
		return `${e}:${this.baseGeneration}.${t}`;
	}
	validateCubeReferences() {
		let e = /* @__PURE__ */ new Set();
		for (let t of this.unresolvedJoinRefs(this.baseCubes)) e.add(t);
		for (let t of this.cubeSets.values()) for (let n of this.unresolvedJoinRefs(t.merged)) e.add(n);
		if (e.size > 0) {
			let t = Array.from(e, (e) => `  - ${e}`).join("\n");
			throw Error(S("server.errors.unresolvedCubeRefs", { details: t }));
		}
	}
	*unresolvedJoinRefs(e) {
		for (let [t, n] of e) if (n.joins) for (let [r, i] of Object.entries(n.joins)) {
			let { targetCube: n } = i;
			typeof n == "string" && !e.has(n) && (yield S("server.errors.cubeRefUnresolved", {
				cubeName: t,
				joinName: r,
				targetCube: n
			}));
		}
	}
	validateCalculatedMeasures(e, t) {
		let n = [];
		for (let [r, i] of Object.entries(e.measures)) if (i.type === "calculated") {
			if (!i.calculatedSql) {
				n.push(S("server.validation.calculatedMeasure.mustHaveCalculatedSql", {
					cubeName: e.name,
					fieldName: r
				}));
				continue;
			}
			let a = pn(i.calculatedSql);
			if (!a.isValid) {
				n.push(S("server.validation.calculatedMeasure.invalidSyntax", {
					cubeName: e.name,
					fieldName: r,
					errors: a.errors.join(", ")
				}));
				continue;
			}
			let o = new Map(t);
			o.set(e.name, e);
			let s = new H(o);
			try {
				s.validateDependencies(e);
			} catch (e) {
				n.push(e instanceof Error ? e.message : String(e));
			}
		}
		if (n.length === 0) {
			let r = new Map(t);
			r.set(e.name, e);
			let i = new H(r);
			i.buildGraph(e);
			let a = i.detectCycle();
			a && n.push(S("server.validation.calculatedMeasure.circularDependency", { cycle: a.join(" -> ") }));
		}
		if (n.length > 0) throw Error(S("server.errors.calculatedMeasureValidation", {
			cubeName: e.name,
			details: n.join("\n")
		}));
	}
	getCube(e, t) {
		return this.resolveCubes(t).get(e);
	}
	getAllCubes(e) {
		return Array.from(this.resolveCubes(e).values());
	}
	getAllCubesMap(e) {
		return this.resolveCubes(e);
	}
	async execute(e, t, n) {
		let r = this.createQueryExecutor(!0), i = this.resolveSetId(t);
		return r.execute(this.cubeSetId2Cubes(i), e, t, {
			...n,
			cubeSetKey: this.cubeSetCacheKey(i)
		});
	}
	async executeMultiCubeQuery(e, t, n) {
		return this.execute(e, t, n);
	}
	async executeQuery(e, t, n) {
		if (!this.resolveCubes(n).get(e)) throw Error(S("server.errors.cubeNotFound", { cubeName: e }));
		return this.execute(t, n);
	}
	getMetadata(e) {
		let t = this.resolveSetId(e), n = this.metadataCache.get(t);
		if (n) return n;
		let r = this.cubeSetId2Cubes(t), i = Array.from(r.values()).map((e) => this.generateCubeMetadata(e, r));
		return this.metadataCache.set(t, i), i;
	}
	getColumnName(e) {
		if (e && e.name || e && e.columnType && e.name) return e.name;
		if (typeof e == "string") return e;
		if (e && typeof e == "object") {
			if (e._.name) return e._.name;
			if (e.name) return e.name;
			if (e.columnName) return e.columnName;
		}
		return "unknown_column";
	}
	generateCubeMetadata(e, t) {
		let n = vi(e), r = yi(e), i = bi(e, t, (e) => this.getColumnName(e)), a = xi(e);
		return {
			name: e.name,
			title: e.title || e.name,
			description: e.description,
			exampleQuestions: e.exampleQuestions,
			measures: n,
			dimensions: r,
			segments: [],
			relationships: i.length > 0 ? i : void 0,
			hierarchies: a.length > 0 ? a : void 0,
			meta: e.meta
		};
	}
	async generateSQL(e, t, n) {
		let r = this.getCube(e, n);
		if (!r) throw Error(S("server.errors.cubeNotFound", { cubeName: e }));
		let i = await this.createQueryExecutor().generateSQL(r, t, n);
		return this.formatSqlResult(i);
	}
	async generateMultiCubeSQL(e, t) {
		let n = await this.createQueryExecutor().generateMultiCubeSQL(this.resolveCubes(t), e, t);
		return this.formatSqlResult(n);
	}
	async dryRun(e, t) {
		let n = await this.createQueryExecutor().dryRunSQL(this.resolveCubes(t), e, t);
		return this.formatSqlResult(n);
	}
	async dryRunFunnel(e, t) {
		return this.dryRun(e, t);
	}
	async dryRunFlow(e, t) {
		return this.dryRun(e, t);
	}
	async dryRunRetention(e, t) {
		return this.dryRun(e, t);
	}
	async explainQuery(e, t, n) {
		return this.createQueryExecutor().explainQuery(this.resolveCubes(t), e, t, n);
	}
	hasCube(e, t) {
		return this.resolveCubes(t).has(e);
	}
	unregisterCube(e) {
		return this.removeCube(e);
	}
	removeCube(e) {
		let t = this.baseCubes.delete(e);
		return t && (this.baseGeneration++, this.rebuildAllMergedSets(), this.invalidateMetadataCache()), t;
	}
	clearCubes() {
		this.baseCubes.clear(), this.baseGeneration++, this.rebuildAllMergedSets(), this.invalidateMetadataCache();
	}
	invalidateMetadataCache() {
		this.metadataCache.clear();
	}
	cubeSetId2Cubes(e) {
		return e === "" ? this.baseCubes : this.cubeSets.get(e)?.merged ?? this.baseCubes;
	}
	getCubeNames(e) {
		return Array.from(this.resolveCubes(e).keys());
	}
	validateQuery(e, t) {
		return r(this.resolveCubes(t), e);
	}
	analyzeQuery(e, t) {
		return this.createQueryExecutor(!0).analyzeQuery(this.resolveCubes(t), e, t);
	}
};
//#endregion
export { Ci as t };
