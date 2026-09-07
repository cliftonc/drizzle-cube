//#region \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), s = (e, n) => {
	let r = {};
	for (var i in e) t(r, i, {
		get: e[i],
		enumerable: !0
	});
	return n || t(r, Symbol.toStringTag, { value: "Module" }), r;
}, c = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, l = (n, r, o) => (o = n == null ? {} : e(i(n)), c(r || !n || !n.__esModule || !a.call(n, "default") ? t(o, "default", {
	value: n,
	enumerable: !0
}) : o, n)), u = /* @__PURE__ */ ((e) => typeof require < "u" ? require : typeof Proxy < "u" ? new Proxy(e, { get: (e, t) => (typeof require < "u" ? require : e)[t] }) : e)(function(e) {
	if (typeof require < "u") return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + e + "\" in an environment that doesn't expose the `require` function. See https://rolldown.rs/in-depth/bundling-cjs#require-external-modules for more details.");
}), d = Symbol.for("drizzle:entityKind");
function f(e, t) {
	if (!e || typeof e != "object") return !1;
	if (e instanceof t) return !0;
	if (!Object.prototype.hasOwnProperty.call(t, d)) throw Error(`Class "${t.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`);
	let n = Object.getPrototypeOf(e).constructor;
	if (n) for (; n;) {
		if (d in n && n[d] === t[d]) return !0;
		n = Object.getPrototypeOf(n);
	}
	return !1;
}
//#endregion
//#region node_modules/drizzle-orm/column.js
var p = class {
	constructor(e, t) {
		this.table = e, this.config = t, this.name = t.name, this.keyAsName = t.keyAsName, this.notNull = t.notNull, this.default = t.default, this.defaultFn = t.defaultFn, this.onUpdateFn = t.onUpdateFn, this.hasDefault = t.hasDefault, this.primary = t.primaryKey, this.isUnique = t.isUnique, this.uniqueName = t.uniqueName, this.uniqueType = t.uniqueType, this.dataType = t.dataType, this.columnType = t.columnType, this.generated = t.generated, this.generatedIdentity = t.generatedIdentity;
	}
	static [d] = "Column";
	name;
	keyAsName;
	primary;
	notNull;
	default;
	defaultFn;
	onUpdateFn;
	hasDefault;
	isUnique;
	uniqueName;
	uniqueType;
	dataType;
	columnType;
	enumValues = void 0;
	generated = void 0;
	generatedIdentity = void 0;
	config;
	mapFromDriverValue(e) {
		return e;
	}
	mapToDriverValue(e) {
		return e;
	}
	shouldDisableInsert() {
		return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
	}
}, m = Symbol.for("drizzle:Name"), h = Symbol.for("drizzle:isPgEnum");
function ee(e) {
	return !!e && typeof e == "function" && h in e && e[h] === !0;
}
//#endregion
//#region node_modules/drizzle-orm/subquery.js
var te = class {
	static [d] = "Subquery";
	constructor(e, t, n, r = !1, i = []) {
		this._ = {
			brand: "Subquery",
			sql: e,
			selectedFields: t,
			alias: n,
			isWith: r,
			usedTables: i
		};
	}
}, ne = { startActiveSpan(e, t) {
	return t();
} }, g = Symbol.for("drizzle:ViewBaseConfig"), re = Symbol.for("drizzle:Schema"), ie = Symbol.for("drizzle:Columns"), ae = Symbol.for("drizzle:ExtraConfigColumns"), oe = Symbol.for("drizzle:OriginalName"), se = Symbol.for("drizzle:BaseName"), _ = Symbol.for("drizzle:IsAlias"), ce = Symbol.for("drizzle:ExtraConfigBuilder"), le = Symbol.for("drizzle:IsDrizzleTable"), v = class {
	static [d] = "Table";
	static Symbol = {
		Name: m,
		Schema: re,
		OriginalName: oe,
		Columns: ie,
		ExtraConfigColumns: ae,
		BaseName: se,
		IsAlias: _,
		ExtraConfigBuilder: ce
	};
	[m];
	[oe];
	[re];
	[ie];
	[ae];
	[se];
	[_] = !1;
	[le] = !0;
	[ce] = void 0;
	constructor(e, t, n) {
		this[m] = this[oe] = e, this[re] = t, this[se] = n;
	}
};
//#endregion
//#region node_modules/drizzle-orm/sql/sql.js
function ue(e) {
	return e != null && typeof e.getSQL == "function";
}
function de(e) {
	let t = {
		sql: "",
		params: []
	};
	for (let n of e) t.sql += n.sql, t.params.push(...n.params), n.typings?.length && (t.typings ||= [], t.typings.push(...n.typings));
	return t;
}
var y = class {
	static [d] = "StringChunk";
	value;
	constructor(e) {
		this.value = Array.isArray(e) ? e : [e];
	}
	getSQL() {
		return new b([this]);
	}
}, b = class e {
	constructor(e) {
		this.queryChunks = e;
		for (let t of e) if (f(t, v)) {
			let e = t[v.Symbol.Schema];
			this.usedTables.push(e === void 0 ? t[v.Symbol.Name] : e + "." + t[v.Symbol.Name]);
		}
	}
	static [d] = "SQL";
	decoder = me;
	shouldInlineParams = !1;
	usedTables = [];
	append(e) {
		return this.queryChunks.push(...e.queryChunks), this;
	}
	toQuery(e) {
		return ne.startActiveSpan("drizzle.buildSQL", (t) => {
			let n = this.buildQueryFromSourceParams(this.queryChunks, e);
			return t?.setAttributes({
				"drizzle.query.text": n.sql,
				"drizzle.query.params": JSON.stringify(n.params)
			}), n;
		});
	}
	buildQueryFromSourceParams(t, n) {
		let r = Object.assign({}, n, {
			inlineParams: n.inlineParams || this.shouldInlineParams,
			paramStartIndex: n.paramStartIndex || { value: 0 }
		}), { casing: i, escapeName: a, escapeParam: o, prepareTyping: s, inlineParams: c, paramStartIndex: l } = r;
		return de(t.map((t) => {
			if (f(t, y)) return {
				sql: t.value.join(""),
				params: []
			};
			if (f(t, fe)) return {
				sql: a(t.value),
				params: []
			};
			if (t === void 0) return {
				sql: "",
				params: []
			};
			if (Array.isArray(t)) {
				let e = [new y("(")];
				for (let [n, r] of t.entries()) e.push(r), n < t.length - 1 && e.push(new y(", "));
				return e.push(new y(")")), this.buildQueryFromSourceParams(e, r);
			}
			if (f(t, e)) return this.buildQueryFromSourceParams(t.queryChunks, {
				...r,
				inlineParams: c || t.shouldInlineParams
			});
			if (f(t, v)) {
				let e = t[v.Symbol.Schema], n = t[v.Symbol.Name];
				return {
					sql: e === void 0 || t[_] ? a(n) : a(e) + "." + a(n),
					params: []
				};
			}
			if (f(t, p)) {
				let e = i.getColumnCasing(t);
				if (n.invokeSource === "indexes") return {
					sql: a(e),
					params: []
				};
				let r = t.table[v.Symbol.Schema];
				return {
					sql: t.table[_] || r === void 0 ? a(t.table[v.Symbol.Name]) + "." + a(e) : a(r) + "." + a(t.table[v.Symbol.Name]) + "." + a(e),
					params: []
				};
			}
			if (f(t, ye)) {
				let e = t[g].schema, n = t[g].name;
				return {
					sql: e === void 0 || t[g].isAlias ? a(n) : a(e) + "." + a(n),
					params: []
				};
			}
			if (f(t, ge)) {
				if (f(t.value, _e)) return {
					sql: o(l.value++, t),
					params: [t],
					typings: ["none"]
				};
				let n = t.value === null ? null : t.encoder.mapToDriverValue(t.value);
				if (f(n, e)) return this.buildQueryFromSourceParams([n], r);
				if (c) return {
					sql: this.mapInlineParam(n, r),
					params: []
				};
				let i = ["none"];
				return s && (i = [s(t.encoder)]), {
					sql: o(l.value++, n),
					params: [n],
					typings: i
				};
			}
			return f(t, _e) ? {
				sql: o(l.value++, t),
				params: [t],
				typings: ["none"]
			} : f(t, e.Aliased) && t.fieldAlias !== void 0 ? {
				sql: a(t.fieldAlias),
				params: []
			} : f(t, te) ? t._.isWith ? {
				sql: a(t._.alias),
				params: []
			} : this.buildQueryFromSourceParams([
				new y("("),
				t._.sql,
				new y(") "),
				new fe(t._.alias)
			], r) : ee(t) ? t.schema ? {
				sql: a(t.schema) + "." + a(t.enumName),
				params: []
			} : {
				sql: a(t.enumName),
				params: []
			} : ue(t) ? t.shouldOmitSQLParens?.() ? this.buildQueryFromSourceParams([t.getSQL()], r) : this.buildQueryFromSourceParams([
				new y("("),
				t.getSQL(),
				new y(")")
			], r) : c ? {
				sql: this.mapInlineParam(t, r),
				params: []
			} : {
				sql: o(l.value++, t),
				params: [t],
				typings: ["none"]
			};
		}));
	}
	mapInlineParam(e, { escapeString: t }) {
		if (e === null) return "null";
		if (typeof e == "number" || typeof e == "boolean") return e.toString();
		if (typeof e == "string") return t(e);
		if (typeof e == "object") {
			let n = e.toString();
			return t(n === "[object Object]" ? JSON.stringify(e) : n);
		}
		throw Error("Unexpected param value: " + e);
	}
	getSQL() {
		return this;
	}
	as(t) {
		return t === void 0 ? this : new e.Aliased(this, t);
	}
	mapWith(e) {
		return this.decoder = typeof e == "function" ? { mapFromDriverValue: e } : e, this;
	}
	inlineParams() {
		return this.shouldInlineParams = !0, this;
	}
	if(e) {
		return e ? this : void 0;
	}
}, fe = class {
	constructor(e) {
		this.value = e;
	}
	static [d] = "Name";
	brand;
	getSQL() {
		return new b([this]);
	}
};
function pe(e) {
	return typeof e == "object" && !!e && "mapToDriverValue" in e && typeof e.mapToDriverValue == "function";
}
var me = { mapFromDriverValue: (e) => e }, he = { mapToDriverValue: (e) => e };
({
	...me,
	...he
});
var ge = class {
	constructor(e, t = he) {
		this.value = e, this.encoder = t;
	}
	static [d] = "Param";
	brand;
	getSQL() {
		return new b([this]);
	}
};
function x(e, ...t) {
	let n = [];
	(t.length > 0 || e.length > 0 && e[0] !== "") && n.push(new y(e[0]));
	for (let [r, i] of t.entries()) n.push(i, new y(e[r + 1]));
	return new b(n);
}
((e) => {
	function t() {
		return new b([]);
	}
	e.empty = t;
	function n(e) {
		return new b(e);
	}
	e.fromList = n;
	function r(e) {
		return new b([new y(e)]);
	}
	e.raw = r;
	function i(e, t) {
		let n = [];
		for (let [r, i] of e.entries()) r > 0 && t !== void 0 && n.push(t), n.push(i);
		return new b(n);
	}
	e.join = i;
	function a(e) {
		return new fe(e);
	}
	e.identifier = a;
	function o(e) {
		return new _e(e);
	}
	e.placeholder = o;
	function s(e, t) {
		return new ge(e, t);
	}
	e.param = s;
})(x ||= {}), ((e) => {
	class t {
		constructor(e, t) {
			this.sql = e, this.fieldAlias = t;
		}
		static [d] = "SQL.Aliased";
		isSelectionField = !1;
		getSQL() {
			return this.sql;
		}
		clone() {
			return new t(this.sql, this.fieldAlias);
		}
	}
	e.Aliased = t;
})(b ||= {});
var _e = class {
	constructor(e) {
		this.name = e;
	}
	static [d] = "Placeholder";
	getSQL() {
		return new b([this]);
	}
}, ve = Symbol.for("drizzle:IsDrizzleView"), ye = class {
	static [d] = "View";
	[g];
	[ve] = !0;
	constructor({ name: e, schema: t, selectedFields: n, query: r }) {
		this[g] = {
			name: e,
			originalName: e,
			schema: t,
			selectedFields: n,
			query: r,
			isExisting: !r,
			isAlias: !1
		};
	}
	getSQL() {
		return new b([this]);
	}
};
p.prototype.getSQL = function() {
	return new b([this]);
}, v.prototype.getSQL = function() {
	return new b([this]);
}, te.prototype.getSQL = function() {
	return new b([this]);
};
//#endregion
//#region node_modules/drizzle-orm/sql/expressions/conditions.js
function S(e, t) {
	return pe(t) && !ue(e) && !f(e, ge) && !f(e, _e) && !f(e, p) && !f(e, v) && !f(e, ye) ? new ge(e, t) : e;
}
var be = (e, t) => x`${e} = ${S(t, e)}`, xe = (e, t) => x`${e} <> ${S(t, e)}`;
function Se(...e) {
	let t = e.filter((e) => e !== void 0);
	if (t.length !== 0) return t.length === 1 ? new b(t) : new b([
		new y("("),
		x.join(t, new y(" and ")),
		new y(")")
	]);
}
function Ce(...e) {
	let t = e.filter((e) => e !== void 0);
	if (t.length !== 0) return t.length === 1 ? new b(t) : new b([
		new y("("),
		x.join(t, new y(" or ")),
		new y(")")
	]);
}
var we = (e, t) => x`${e} > ${S(t, e)}`, Te = (e, t) => x`${e} >= ${S(t, e)}`, Ee = (e, t) => x`${e} < ${S(t, e)}`, De = (e, t) => x`${e} <= ${S(t, e)}`;
function Oe(e, t) {
	return Array.isArray(t) ? t.length === 0 ? x`false` : x`${e} in ${t.map((t) => S(t, e))}` : x`${e} in ${S(t, e)}`;
}
function ke(e, t) {
	return Array.isArray(t) ? t.length === 0 ? x`true` : x`${e} not in ${t.map((t) => S(t, e))}` : x`${e} not in ${S(t, e)}`;
}
function Ae(e) {
	return x`${e} is null`;
}
function je(e) {
	return x`${e} is not null`;
}
function Me(e, t) {
	if (Array.isArray(t)) {
		if (t.length === 0) throw Error("arrayContains requires at least one value");
		let n = x`${S(t, e)}`;
		return x`${e} @> ${n}`;
	}
	return x`${e} @> ${S(t, e)}`;
}
function Ne(e, t) {
	if (Array.isArray(t)) {
		if (t.length === 0) throw Error("arrayContained requires at least one value");
		let n = x`${S(t, e)}`;
		return x`${e} <@ ${n}`;
	}
	return x`${e} <@ ${S(t, e)}`;
}
function Pe(e, t) {
	if (Array.isArray(t)) {
		if (t.length === 0) throw Error("arrayOverlaps requires at least one value");
		let n = x`${S(t, e)}`;
		return x`${e} && ${n}`;
	}
	return x`${e} && ${S(t, e)}`;
}
//#endregion
//#region src/server/cube-utils.ts
function Fe(e, t) {
	return typeof e == "string" ? t ? t.get(e) || (console.warn(`[drizzle-cube] Cannot resolve cube reference '${e}': no cube with that name is registered. Registered cubes: ${Array.from(t.keys()).join(", ") || "(none)"}. Join will be skipped.`), null) : (console.warn(`[drizzle-cube] Cannot resolve string cube reference '${e}': no cube registry provided. Join will be skipped.`), null) : typeof e == "function" ? e() : e;
}
function Ie(e) {
	switch (e) {
		case "belongsTo": return "hasMany";
		case "hasMany": return "belongsTo";
		case "hasOne": return "hasOne";
		case "belongsToMany": return "belongsToMany";
		default: return e;
	}
}
function Le(e, t) {
	if (t) return t;
	switch (e) {
		case "belongsTo": return "inner";
		case "hasOne": return "left";
		case "hasMany": return "left";
		case "belongsToMany": return "left";
		default: return "left";
	}
}
function Re(e) {
	return e && typeof e == "object" ? x`${x`${e}`}` : e;
}
function ze(e) {
	if (e === "__proto__" || e === "constructor" || e === "prototype") throw Error(`Unsafe property key: ${e}`);
	return e;
}
function Be(e, t) {
	return Re(typeof e == "function" ? e(t) : e);
}
function Ve(e, t) {
	return e.type === "time" ? Be(e.sql, t) : typeof e.sql == "function" ? e.sql(t) : e.sql;
}
function He(e) {
	let t = [];
	for (let n of e.on) {
		let e = Re(n.source), r = Re(n.target), i = n.as || be;
		t.push(i(e, r));
	}
	return Se(...t);
}
function Ue(e) {
	if (e.relationship !== "belongsToMany" || !e.through) throw Error("expandBelongsToManyJoin can only be called on belongsToMany relationships with through configuration");
	let { table: t, sourceKey: n, targetKey: r } = e.through, i = [];
	for (let e of n) {
		let t = e.as || be;
		i.push(t(e.source, e.target));
	}
	let a = [];
	for (let e of r) {
		let t = e.as || be;
		a.push(t(e.source, e.target));
	}
	let o = Le("belongsToMany", e.sqlJoinType);
	return { junctionJoins: [{
		joinType: o,
		table: t,
		condition: Se(...i)
	}, {
		joinType: o,
		table: t,
		condition: Se(...a)
	}] };
}
//#endregion
//#region src/i18n/locales/en.json
var We = {
	"analysis.modes.query.label": "Query",
	"analysis.modes.query.description": "Standard analysis (single or multi-query)",
	"analysis.modes.funnel.label": "Funnel",
	"analysis.modes.funnel.description": "Sequential conversion analysis",
	"analysis.modes.flow.label": "Flow",
	"analysis.modes.flow.description": "Bidirectional path analysis with Sankey visualisation",
	"analysis.modes.retention.label": "Retention",
	"analysis.modes.retention.description": "Cohort-based retention analysis over time periods",
	"analysis.ai.title": "AI Query Generator",
	"analysis.ai.generating": "Generating...",
	"analysis.ai.placeholder": "Describe your query in natural language... (e.g., 'Show total sales by month for the last year')",
	"analysis.ai.shortcutHint": "Press Enter to generate, Shift+Enter for new line",
	"analysis.ai.successMessage": "Query generated and loaded! Check the results below, then click Accept to keep or Cancel to revert.",
	"analysis.ai.button.accept": "Accept",
	"analysis.ai.button.cancel": "Cancel",
	"analysis.ai.button.close": "Close",
	"analysis.ai.button.generate": "Generate",
	"analysis.ai.button.generating": "Generating...",
	"analysis.sections.metrics": "Metrics",
	"analysis.sections.breakdown": "Breakdown",
	"analysis.sections.dimensions": "Dimensions",
	"analysis.sections.filters": "Filter",
	"analysis.sections.limit": "Limit",
	"analysis.tabs.query": "Query",
	"analysis.tabs.chart": "Chart",
	"analysis.tabs.chartTitle": "Chart configuration",
	"analysis.tabs.display": "Display",
	"analysis.tabs.displayTitle": "Display options",
	"analysis.multiQuery.removeQuery": "Remove query",
	"analysis.multiQuery.addQuery": "Add new query",
	"analysis.multiQuery.addAnother": "Add another query",
	"analysis.multiQuery.mergeExplanation": "In merge mode, dimensions are shared from Q1.",
	"analysis.multiQuery.switchToSeparate": "Switch to separate series",
	"analysis.mergeStrategy.concat": "Separate series",
	"analysis.mergeStrategy.merge": "Merge by dimension",
	"analysis.mergeStrategy.funnel": "Funnel",
	"analysis.placeholders.addMetrics": "Add metrics to generate SQL",
	"analysis.placeholders.hoverField": "Hover over a field to see details",
	"analysis.placeholders.noData": "No data available",
	"common.actions.accept": "Accept",
	"common.actions.cancel": "Cancel",
	"common.actions.delete": "Delete",
	"common.actions.close": "Close",
	"common.actions.edit": "Edit",
	"common.actions.save": "Save",
	"common.actions.copy": "Copy",
	"common.actions.duplicate": "Duplicate",
	"common.actions.refresh": "Refresh",
	"common.actions.confirm": "Confirm",
	"common.actions.add": "Add",
	"common.actions.clear": "Clear",
	"common.actions.select": "Select",
	"common.actions.navigate": "Navigate",
	"common.actions.share": "Share",
	"common.loading": "Loading...",
	"common.modal.processing": "Processing...",
	"common.modal.dashboardName": "Dashboard Name",
	"common.modal.deleteConfirmation": "Are you sure? This action cannot be undone.",
	"common.sorting.ascending": "Sorted ascending (click for descending)",
	"common.sorting.descending": "Sorted descending (click to remove)",
	"common.sorting.none": "Click to sort ascending",
	"fieldTypes.count": "Count",
	"fieldTypes.countDistinct": "Count Distinct",
	"fieldTypes.countDistinctApprox": "Count Distinct (Approx)",
	"fieldTypes.sum": "Sum",
	"fieldTypes.avg": "Average",
	"fieldTypes.min": "Minimum",
	"fieldTypes.max": "Maximum",
	"fieldTypes.runningTotal": "Running Total",
	"fieldTypes.number": "Number",
	"fieldTypes.string": "Text",
	"fieldTypes.boolean": "Boolean",
	"fieldTypes.time": "Time Dimension",
	"fieldTypes.geo": "Geographic",
	"fieldTypes.dimension": "Dimension",
	"fieldPanel.emptyState": "Hover over a field to see details",
	"fieldPanel.usageHint": "Press Enter or click to add this field to your query.",
	"fieldPanel.labels.type": "Type",
	"fieldPanel.labels.cube": "Cube",
	"fieldPanel.labels.category": "Category",
	"fieldCategory.measure": "Measure",
	"fieldCategory.timeDimension": "Time Dimension",
	"fieldCategory.dimension": "Dimension",
	"fieldSearch.placeholder.metrics": "Search metrics...",
	"fieldSearch.placeholder.filter": "Search fields to filter...",
	"fieldSearch.placeholder.dimensions": "Search dimensions...",
	"fieldSearch.modal.title.metrics": "Select a Metric",
	"fieldSearch.modal.title.filter": "Select a Field to Filter",
	"fieldSearch.modal.title.dimensions": "Select a Dimension",
	"fieldSearch.filter.allCubes": "All Cubes",
	"fieldSearch.categories.all": "All",
	"fieldSearch.empty.heading": "No fields found",
	"fieldSearch.empty.noMatchMetrics": "No metrics match \"{searchTerm}\"",
	"fieldSearch.empty.noMatchDimensions": "No dimensions match \"{searchTerm}\"",
	"fieldSearch.empty.noMetrics": "No metrics available",
	"fieldSearch.empty.noDimensions": "No dimensions available",
	"fieldSearch.section.recents": "Recents",
	"fieldSearch.footer.metricsAvailable": "metrics available",
	"fieldSearch.footer.fieldsAvailable": "fields available",
	"fieldSearch.footer.dimensionsAvailable": "dimensions available",
	"fieldSearch.shortcut.navigate": "Navigate",
	"fieldSearch.shortcut.keyEnter": "Enter",
	"fieldSearch.shortcut.keyShift": "Shift",
	"fieldSearch.shortcut.keyEsc": "Esc",
	"fieldSearch.shortcut.plusClick": "+Click",
	"fieldSearch.shortcut.select": "Select",
	"fieldSearch.shortcut.multiSelect": "Multi-select",
	"fieldSearch.shortcut.close": "Close",
	"filter.group.condition": "condition",
	"filter.group.conditions": "conditions",
	"filter.group.addFilter": "Add Filter",
	"filter.group.addAndGroup": "Add AND Group",
	"filter.group.addOrGroup": "Add OR Group",
	"filter.group.removeGroup": "Remove group",
	"filter.group.empty": "No conditions in this group",
	"filter.group.addFilterLink": "Add a filter",
	"filter.modal.title": "Edit Filter",
	"filter.modal.fieldLabel": "Field",
	"filter.modal.operatorLabel": "Operator",
	"filter.modal.valueLabel": "Value",
	"filter.modal.selectRange": "Select range",
	"filter.modal.noValueRequired": "No value required",
	"filter.modal.dateTo": "to",
	"filter.modal.min": "Min",
	"filter.modal.to": "to",
	"filter.modal.max": "Max",
	"filter.modal.enterNumber": "Enter number",
	"filter.modal.loading": "Loading...",
	"filter.modal.selectValue": "Select value...",
	"filter.modal.search": "Search...",
	"filter.modal.errorPrefix": "Error: ",
	"filter.modal.noValues": "No values found",
	"filter.modal.multiSelectHint": "Hold Shift to select multiple values",
	"filter.modal.enterValue": "Enter value...",
	"filter.removeButton.title": "Remove filter",
	"filter.section.clearAll": "Clear all",
	"filter.section.dropHint": "Drop to add filter",
	"filter.section.empty": "No filters applied",
	"filter.valueDisplay.empty": "(empty)",
	"filter.valueDisplay.more": "more",
	"filter.operator.equals.label": "equals",
	"filter.operator.equals.description": "Exact match",
	"filter.operator.notEquals.label": "not equals",
	"filter.operator.notEquals.description": "Does not match",
	"filter.operator.contains.label": "contains",
	"filter.operator.contains.description": "Contains text (case insensitive)",
	"filter.operator.notContains.label": "not contains",
	"filter.operator.notContains.description": "Does not contain text",
	"filter.operator.startsWith.label": "starts with",
	"filter.operator.startsWith.description": "Starts with text",
	"filter.operator.notStartsWith.label": "not starts with",
	"filter.operator.notStartsWith.description": "Does not start with text",
	"filter.operator.endsWith.label": "ends with",
	"filter.operator.endsWith.description": "Ends with text",
	"filter.operator.notEndsWith.label": "not ends with",
	"filter.operator.notEndsWith.description": "Does not end with text",
	"filter.operator.like.label": "like",
	"filter.operator.like.description": "SQL LIKE pattern matching (case sensitive)",
	"filter.operator.notLike.label": "not like",
	"filter.operator.notLike.description": "SQL NOT LIKE pattern matching (case sensitive)",
	"filter.operator.ilike.label": "ilike",
	"filter.operator.ilike.description": "SQL ILIKE pattern matching (case insensitive)",
	"filter.operator.gt.label": "greater than",
	"filter.operator.gt.description": "Greater than value",
	"filter.operator.gte.label": "greater than or equal",
	"filter.operator.gte.description": "Greater than or equal to value",
	"filter.operator.lt.label": "less than",
	"filter.operator.lt.description": "Less than value",
	"filter.operator.lte.label": "less than or equal",
	"filter.operator.lte.description": "Less than or equal to value",
	"filter.operator.between.label": "between",
	"filter.operator.between.description": "Between two values (inclusive)",
	"filter.operator.notBetween.label": "not between",
	"filter.operator.notBetween.description": "Not between two values",
	"filter.operator.in.label": "in",
	"filter.operator.in.description": "Matches any of the provided values",
	"filter.operator.notIn.label": "not in",
	"filter.operator.notIn.description": "Does not match any of the provided values",
	"filter.operator.set.label": "is set",
	"filter.operator.set.description": "Is not null/empty",
	"filter.operator.notSet.label": "is not set",
	"filter.operator.notSet.description": "Is null/empty",
	"filter.operator.isEmpty.label": "is empty",
	"filter.operator.isEmpty.description": "Is empty string or null",
	"filter.operator.isNotEmpty.label": "is not empty",
	"filter.operator.isNotEmpty.description": "Is not empty string and not null",
	"filter.operator.inDateRange.label": "in date range",
	"filter.operator.inDateRange.description": "Between two dates",
	"filter.operator.beforeDate.label": "before date",
	"filter.operator.beforeDate.description": "Before specified date",
	"filter.operator.afterDate.label": "after date",
	"filter.operator.afterDate.description": "After specified date",
	"filter.operator.regex.label": "matches regex",
	"filter.operator.regex.description": "Matches regular expression pattern",
	"filter.operator.notRegex.label": "not matches regex",
	"filter.operator.notRegex.description": "Does not match regular expression pattern",
	"filter.operator.arrayContains.label": "array contains all",
	"filter.operator.arrayContains.description": "Array field contains all specified values (PostgreSQL only)",
	"filter.operator.arrayOverlaps.label": "array contains any",
	"filter.operator.arrayOverlaps.description": "Array field contains any of the specified values (PostgreSQL only)",
	"filter.operator.arrayContained.label": "array values in",
	"filter.operator.arrayContained.description": "All array field values are within specified values (PostgreSQL only)",
	"dateRange.custom": "Custom",
	"dateRange.today": "Today",
	"dateRange.yesterday": "Yesterday",
	"dateRange.thisWeek": "This week",
	"dateRange.thisMonth": "This month",
	"dateRange.thisQuarter": "This quarter",
	"dateRange.thisYear": "This year",
	"dateRange.last7Days": "Last 7 days",
	"dateRange.last30Days": "Last 30 days",
	"dateRange.lastNDays": "Last N days",
	"dateRange.lastWeek": "Last week",
	"dateRange.lastNWeeks": "Last N weeks",
	"dateRange.lastMonth": "Last month",
	"dateRange.last12Months": "Last 12 months",
	"dateRange.lastNMonths": "Last N months",
	"dateRange.lastQuarter": "Last quarter",
	"dateRange.lastNQuarters": "Last N quarters",
	"dateRange.lastYear": "Last year",
	"dateRange.lastNYears": "Last N years",
	"timeGranularity.hour": "Hour",
	"timeGranularity.day": "Day",
	"timeGranularity.week": "Week",
	"timeGranularity.month": "Month",
	"timeGranularity.quarter": "Quarter",
	"timeGranularity.year": "Year",
	"query.limit.label": "Limit",
	"query.limit.clear": "Clear",
	"chart.bar.label": "Bar Chart",
	"chart.bar.description": "Compare values across categories",
	"chart.bar.useCase": "Best for comparing discrete categories, showing rankings, or displaying changes over time",
	"chart.line.label": "Line Chart",
	"chart.line.description": "Show trends and changes over time",
	"chart.line.useCase": "Best for continuous data, trends, time series, and showing relationships between multiple series",
	"chart.area.label": "Area Chart",
	"chart.area.description": "Emphasise magnitude of change over time",
	"chart.area.useCase": "Best for showing cumulative totals, volume changes, or stacked comparisons over time",
	"chart.pie.label": "Pie Chart",
	"chart.pie.description": "Show proportions of a whole",
	"chart.pie.useCase": "Best for showing percentage distribution or composition of a total (limit to 5-7 slices)",
	"chart.scatter.label": "Scatter Plot",
	"chart.scatter.description": "Reveal correlations between variables",
	"chart.scatter.useCase": "Best for identifying patterns, correlations, outliers, and relationships between two measures",
	"chart.bubble.label": "Bubble Chart",
	"chart.bubble.description": "Compare three dimensions of data",
	"chart.bubble.useCase": "Best for showing relationships between three variables (X, Y, and size), market analysis",
	"chart.radar.label": "Radar Chart",
	"chart.radar.description": "Compare multiple metrics across categories",
	"chart.radar.useCase": "Best for multivariate comparisons, performance metrics, strengths/weaknesses analysis",
	"chart.radialBar.label": "Radial Bar Chart",
	"chart.radialBar.description": "Circular progress and KPI visualisation",
	"chart.radialBar.useCase": "Best for showing progress toward goals, KPIs, or comparing percentages in a compact form",
	"chart.treemap.label": "TreeMap",
	"chart.treemap.description": "Visualise hierarchical data with nested rectangles",
	"chart.treemap.useCase": "Best for showing part-to-whole relationships in hierarchical data, disk usage, budget allocation",
	"chart.table.label": "Data Table",
	"chart.table.description": "Display detailed tabular data",
	"chart.table.useCase": "Best for precise values, detailed analysis, sortable/filterable data exploration",
	"chart.recordsTable.label": "Records Table",
	"chart.recordsTable.description": "List individual records with per-column formatting",
	"chart.recordsTable.useCase": "Best for browsing record-level detail — badges, progress bars and links per column",
	"chart.activityGrid.label": "Activity Grid",
	"chart.activityGrid.description": "GitHub-style activity grid showing temporal patterns across different time scales",
	"chart.activityGrid.useCase": "Best for visualising activity patterns over time. Supports hour (3hr blocks × days), day (days × weeks), week (weeks × months), month (months × quarters), and quarter (quarters × years) granularities",
	"chart.kpiNumber.label": "KPI Number",
	"chart.kpiNumber.description": "Display key performance indicators as large numbers",
	"chart.kpiNumber.useCase": "Perfect for showing important metrics like revenue, user count, or other key business metrics in a prominent, easy-to-read format",
	"chart.kpiDelta.label": "KPI Delta",
	"chart.kpiDelta.description": "Display change between latest and previous values with trend indicators",
	"chart.kpiDelta.useCase": "Perfect for showing performance changes over time, such as revenue growth, user acquisition changes, or other metrics where the trend and delta are more important than the absolute value",
	"chart.kpiText.label": "KPI Text",
	"chart.kpiText.description": "Display key performance indicators as customisable text",
	"chart.kpiText.useCase": "Perfect for showing metrics with custom formatting, combining multiple values, or displaying contextual KPI information using templates",
	"chart.markdown.label": "Markdown",
	"chart.markdown.description": "Display custom markdown content with formatting",
	"chart.markdown.useCase": "Perfect for adding documentation, notes, section headers, instructions, or formatted text to dashboards",
	"chart.funnel.label": "Funnel Chart",
	"chart.funnel.description": "Show conversion through sequential steps",
	"chart.funnel.useCase": "Best for visualising user journey funnels, sales pipelines, or multi-step processes",
	"chart.sankey.label": "Sankey Chart",
	"chart.sankey.description": "Show flow between states or steps",
	"chart.sankey.useCase": "Best for visualising user journey flows, path analysis, or state transitions",
	"chart.sunburst.label": "Sunburst Chart",
	"chart.sunburst.description": "Show hierarchical flow as radial rings",
	"chart.sunburst.useCase": "Best for visualising forward paths from a starting event in a compact radial layout",
	"chart.heatmap.label": "Heatmap",
	"chart.heatmap.description": "Visualise intensity across two dimensions",
	"chart.heatmap.useCase": "Best for showing patterns in matrix data like correlations, schedules, or category comparisons",
	"chart.retentionHeatmap.label": "Retention Matrix",
	"chart.retentionHeatmap.description": "Cohort retention matrix visualisation",
	"chart.retentionHeatmap.useCase": "Visualise user retention over time by cohort",
	"chart.retentionCombined.label": "Retention Chart",
	"chart.retentionCombined.description": "Combined retention visualisation with line chart and heatmap modes",
	"chart.retentionCombined.useCase": "Visualise user retention over time with optional breakdown segmentation",
	"chart.boxPlot.label": "Box Plot",
	"chart.boxPlot.description": "Show statistical distribution (median, IQR, whiskers) across categories",
	"chart.boxPlot.useCase": "Best for P&L spread per symbol, trade size distribution, latency distribution across platforms",
	"chart.dotStrip.label": "Dot Strip Plot",
	"chart.dotStrip.description": "Show every individual value as a dot, grouped into category bands",
	"chart.dotStrip.useCase": "Best for comparing individuals within a group — spread of output per team, salary per band, latency per endpoint",
	"chart.waterfall.label": "Waterfall Chart",
	"chart.waterfall.description": "Show cumulative effect of sequential positive and negative values",
	"chart.waterfall.useCase": "Best for P&L decomposition, cash flow analysis, budget variance, or any sequential contribution breakdown",
	"chart.candlestick.label": "Candlestick Chart",
	"chart.candlestick.description": "Financial candlestick chart showing open/close body and high/low wicks",
	"chart.candlestick.useCase": "Best for EOD quotes (bid/ask spread per date/symbol), markout distribution bands, or OHLC price data",
	"chart.measureProfile.label": "Measure Profile",
	"chart.measureProfile.description": "Plot N measures as sequential X-axis points to visualise a profile or shape across intervals",
	"chart.measureProfile.useCase": "Best for markout interval analysis (e.g. avgMinus2m → avgAtEvent → avgPlus2h), metric profiles, or any pattern across ordered measures",
	"chart.gauge.label": "Gauge Chart",
	"chart.gauge.description": "Half-circle arc gauge for a single KPI value versus a maximum target",
	"chart.gauge.useCase": "Best for high-water marks vs equity, margin utilisation, or any single value progress toward a goal",
	"chart.config.chartType": "Chart Type",
	"chart.config.loading": "Loading chart configuration...",
	"chart.config.axisConfig": "Chart Configuration",
	"chart.config.unassigned": "Unassigned Fields",
	"chart.config.unassignedHint": "Drag fields to chart axes above",
	"chart.config.noFields": "Add metrics and breakdowns in the Query tab to configure chart axes",
	"chart.dropZone.xAxis.label": "X-Axis (Categories)",
	"chart.dropZone.xAxis.description": "Dimensions and time dimensions for grouping",
	"chart.dropZone.xAxis.empty": "Drop dimensions & time dimensions here",
	"chart.dropZone.yAxis.label": "Y-Axis (Values)",
	"chart.dropZone.yAxis.description": "Measures for values or dimensions for series",
	"chart.dropZone.yAxis.empty": "Drop measures or dimensions here",
	"chart.dropZone.series.label": "Series (Split into Multiple Series)",
	"chart.dropZone.series.description": "Dimensions to create separate data series",
	"chart.dropZone.series.empty": "Drop dimensions here to split data into series",
	"chart.dropZone.maxReached": "Maximum items reached",
	"chart.dropZone.default.empty": "Drop fields here",
	"chart.bar.dropZone.xAxis.empty": "Drop dimensions & time dimensions here",
	"chart.bar.dropZone.yAxis.empty": "Drop measures here",
	"chart.bar.dropZone.series.empty": "Drop dimensions here to split data into series",
	"chart.line.dropZone.xAxis.empty": "Drop time dimensions or dimensions here",
	"chart.line.dropZone.yAxis.empty": "Drop measures here",
	"chart.line.dropZone.series.empty": "Drop dimensions here for multiple lines",
	"chart.area.dropZone.xAxis.empty": "Drop time dimensions or dimensions here",
	"chart.area.dropZone.yAxis.empty": "Drop measures here",
	"chart.area.dropZone.series.empty": "Drop dimensions here for stacked areas",
	"chart.pie.dropZone.xAxis.empty": "Drop a dimension for categories",
	"chart.pie.dropZone.yAxis.empty": "Drop a measure for values",
	"chart.scatter.dropZone.xAxis.empty": "Drop a field for X-axis",
	"chart.scatter.dropZone.yAxis.empty": "Drop a measure for Y-axis",
	"chart.scatter.dropZone.series.empty": "Drop a dimension to colour points",
	"chart.bubble.dropZone.xAxis.empty": "Drop a field for X-axis position",
	"chart.bubble.dropZone.yAxis.empty": "Drop a measure for Y-axis position",
	"chart.bubble.dropZone.sizeField.empty": "Drop a measure for bubble size",
	"chart.bubble.dropZone.series.empty": "Drop a dimension for bubble labels",
	"chart.bubble.dropZone.colorField.empty": "Drop a field for bubble colour (optional)",
	"chart.radar.dropZone.xAxis.empty": "Drop dimensions for radar axes",
	"chart.radar.dropZone.yAxis.empty": "Drop measures for values",
	"chart.radar.dropZone.series.empty": "Drop dimensions for multiple shapes",
	"chart.radialBar.dropZone.xAxis.empty": "Drop dimensions for categories",
	"chart.radialBar.dropZone.yAxis.empty": "Drop a measure for values",
	"chart.treemap.dropZone.xAxis.empty": "Drop dimensions for categories",
	"chart.treemap.dropZone.yAxis.empty": "Drop a measure for size",
	"chart.treemap.dropZone.series.empty": "Drop a dimension for colour grouping",
	"chart.table.dropZone.xAxis.empty": "Drop fields to display as columns (or leave empty for all)",
	"chart.recordsTable.dropZone.columns.label": "Columns",
	"chart.recordsTable.dropZone.columns.description": "Fields rendered as columns, in this order",
	"chart.recordsTable.dropZone.columns.empty": "Drop fields to display as columns (or leave empty for all)",
	"chart.recordsTable.dropZone.hiddenColumns.label": "Hidden fields",
	"chart.recordsTable.dropZone.hiddenColumns.description": "Fetched for row context and links, never displayed",
	"chart.recordsTable.dropZone.hiddenColumns.empty": "Drop fields to fetch without showing them",
	"chart.recordsTable.option.columnFormats.label": "Column formats",
	"chart.recordsTable.option.columnFormats.description": "Choose how each column renders its value",
	"chart.recordsTable.option.pageSize.label": "Rows per page",
	"chart.recordsTable.option.pageSize.description": "How many records to show at a time",
	"chart.recordsTable.option.pageSize.option.25": "25",
	"chart.recordsTable.option.pageSize.option.50": "50",
	"chart.recordsTable.option.pageSize.option.100": "100",
	"chart.recordsTable.option.rowLink.label": "Row link",
	"chart.recordsTable.option.rowLink.description": "Make each row a link. Use {Cube.field} tokens — hidden fields work too. Relative paths and http(s) URLs only.",
	"chart.recordsTable.rowLink.urlTemplate": "URL template",
	"chart.recordsTable.rowLink.placeholder": "/employees/{Employees.id}",
	"chart.recordsTable.rowLink.target.self": "Same tab",
	"chart.recordsTable.rowLink.target.blank": "New tab",
	"chart.recordsTable.columnFormats.noColumns": "Assign columns first — each one can then be formatted here",
	"chart.recordsTable.columnFormats.kind.text": "Text",
	"chart.recordsTable.columnFormats.kind.number": "Number",
	"chart.recordsTable.columnFormats.kind.date": "Date",
	"chart.recordsTable.columnFormats.kind.badge": "Badge",
	"chart.recordsTable.columnFormats.kind.progress": "Progress",
	"chart.recordsTable.columnFormats.numberFormat": "Number format",
	"chart.recordsTable.columnFormats.granularity": "Granularity",
	"chart.recordsTable.columnFormats.badgeColours": "Value colours",
	"chart.recordsTable.columnFormats.badgeColour": "Colour",
	"chart.recordsTable.columnFormats.badgeValue": "Value",
	"chart.recordsTable.columnFormats.badgeAdd": "Add value",
	"chart.recordsTable.columnFormats.badgeRemove": "Remove value",
	"chart.recordsTable.columnFormats.progressMin": "Minimum",
	"chart.recordsTable.columnFormats.progressMax": "Maximum",
	"chart.recordsTable.columnFormats.progressStyle": "Style",
	"chart.recordsTable.columnFormats.progressStyle.bar": "Bar",
	"chart.recordsTable.columnFormats.progressStyle.circle": "Circle",
	"chart.recordsTable.columnFormats.header": "Header",
	"chart.activityGrid.dropZone.dateField.empty": "Drop a time dimension (granularity affects grid structure)",
	"chart.activityGrid.dropZone.valueField.empty": "Drop a measure for activity intensity",
	"chart.kpiNumber.dropZone.yAxis.empty": "Drop a measure here",
	"chart.kpiDelta.dropZone.yAxis.empty": "Drop a measure here",
	"chart.kpiDelta.dropZone.xAxis.empty": "Drop a dimension for ordering",
	"chart.kpiText.dropZone.yAxis.empty": "Drop a measure here",
	"chart.funnel.dropZone.xAxis.empty": "Steps defined in funnel config",
	"chart.funnel.dropZone.yAxis.empty": "Counts calculated from funnel execution",
	"chart.sankey.dropZone.xAxis.empty": "Auto-populated from flow config",
	"chart.sankey.dropZone.yAxis.empty": "Calculated from flow execution",
	"chart.sunburst.dropZone.xAxis.empty": "Auto-populated from flow config",
	"chart.sunburst.dropZone.yAxis.empty": "Calculated from flow execution",
	"chart.heatmap.dropZone.xAxis.empty": "Drop one dimension here",
	"chart.heatmap.dropZone.yAxis.empty": "Drop one dimension here",
	"chart.heatmap.dropZone.valueField.empty": "Drop one measure here",
	"chart.boxPlot.dropZone.xAxis.empty": "Drop a dimension here",
	"chart.boxPlot.dropZone.yAxis.empty": "Drop 1, 3, or 5 measures here",
	"chart.dotStrip.dropZone.xAxis.label": "Bands (rows)",
	"chart.dotStrip.dropZone.xAxis.description": "Dimension that groups dots into rows, e.g. team, band, region",
	"chart.dotStrip.dropZone.xAxis.empty": "Drop a dimension to band by",
	"chart.dotStrip.dropZone.yAxis.label": "Value (horizontal position)",
	"chart.dotStrip.dropZone.yAxis.description": "Measure that positions each dot along the horizontal axis",
	"chart.dotStrip.dropZone.yAxis.empty": "Drop a measure here",
	"chart.dotStrip.dropZone.series.label": "Dot identity",
	"chart.dotStrip.dropZone.series.description": "Dimension that gives each dot its own row — one dot per value, named in the tooltip",
	"chart.dotStrip.dropZone.series.empty": "Drop a dimension to split into individual dots",
	"chart.waterfall.dropZone.xAxis.empty": "Drop a dimension here",
	"chart.waterfall.dropZone.yAxis.empty": "Drop a measure here",
	"chart.candlestick.dropZone.xAxis.empty": "Drop a time or dimension here",
	"chart.candlestick.dropZone.yAxis.empty": "Drop 2+ measures here",
	"chart.measureProfile.dropZone.yAxis.empty": "Drop 2+ measures here (displayed left → right)",
	"chart.measureProfile.dropZone.series.empty": "Drop a dimension here to create multiple lines",
	"chart.gauge.dropZone.yAxis.empty": "Drop 1 measure here (optional 2nd for dynamic max)",
	"chart.activityGrid.validation.timeDimensionRequired": "Time dimension is required for activity grid",
	"chart.activityGrid.validation.measureRequired": "Activity measure is required for intensity mapping",
	"chart.kpiDelta.validation.measureRequired": "A measure is required for KPI Delta charts",
	"chart.heatmap.validation.xAxisRequired": "X-axis dimension required",
	"chart.heatmap.validation.yAxisRequired": "Y-axis dimension required",
	"chart.heatmap.validation.valueRequired": "Value measure required",
	"chart.option.stacking.label": "Stacking",
	"chart.option.stacking.none": "None",
	"chart.option.stacking.stacked": "Stacked",
	"chart.option.stacking.percent": "Stacked 100%",
	"chart.option.stacking.description": "How to stack multiple series",
	"chart.option.target.label": "Target Values",
	"chart.option.target.description": "Single value or comma-separated values to spread across X-axis",
	"chart.option.connectNulls.label": "Connect Nulls",
	"chart.option.connectNulls.description": "Draw continuous line through missing data points",
	"chart.option.showAllXLabels.label": "Show All X Labels",
	"chart.option.showAllXLabels.description": "Display every label on the X-axis instead of auto-hiding overlapping labels",
	"chart.option.leftYAxisFormat.label": "Left Y-Axis Format",
	"chart.option.leftYAxisFormat.description": "Number formatting for left Y-axis",
	"chart.option.rightYAxisFormat.label": "Right Y-Axis Format",
	"chart.option.rightYAxisFormat.description": "Number formatting for right Y-axis",
	"chart.option.xAxisFormat.label": "X-Axis Format",
	"chart.option.xAxisFormat.description": "Number formatting for X-axis",
	"chart.option.yAxisFormat.label": "Y-Axis Format",
	"chart.option.yAxisFormat.description": "Number formatting for Y-axis",
	"chart.option.valueFormat.label": "Value Format",
	"chart.option.valueFormat.description": "Number formatting for values",
	"chart.option.innerRadius.label": "Inner Radius",
	"chart.option.innerRadius.description": "Hollow centre size (0% = solid pie, higher = donut style)",
	"chart.option.showLabels.label": "Show Cell Values",
	"chart.option.showLabels.description": "Display values inside each cell",
	"chart.option.cellShape.label": "Cell Shape",
	"chart.option.cellShape.rectangle": "Rectangle",
	"chart.option.cellShape.circle": "Circle",
	"chart.option.funnelStyle.label": "Funnel Style",
	"chart.option.funnelStyle.bars": "Bars",
	"chart.option.funnelStyle.funnel": "Funnel",
	"chart.option.funnelOrientation.label": "Orientation",
	"chart.option.funnelOrientation.horizontal": "Horizontal",
	"chart.option.funnelOrientation.vertical": "Vertical",
	"chart.option.hideSummaryFooter.label": "Hide Summary Footer",
	"chart.option.hideSummaryFooter.description": "Hide the summary footer showing steps count and overall conversion",
	"chart.option.showConversion.label": "Show Conversion Rate",
	"chart.option.showConversion.description": "Display step-to-step conversion percentage",
	"chart.option.showAvgTime.label": "Show Avg Time",
	"chart.option.showAvgTime.description": "Display average time to convert",
	"chart.option.showMedianTime.label": "Show Median Time",
	"chart.option.showMedianTime.description": "Display median time to convert",
	"chart.option.showP90Time.label": "Show P90 Time",
	"chart.option.showP90Time.description": "Display 90th percentile time to convert",
	"chart.option.linkOpacity.label": "Link Opacity",
	"chart.option.linkOpacity.light": "Light",
	"chart.option.linkOpacity.medium": "Medium",
	"chart.option.linkOpacity.dark": "Dark",
	"chart.option.showNodeLabels.label": "Show Node Labels",
	"chart.option.showNodeLabels.description": "Display labels on flow nodes",
	"chart.option.prefix.label": "Prefix",
	"chart.option.prefix.description": "Text to display before the number",
	"chart.option.suffix.label": "Suffix",
	"chart.option.suffix.description": "Text to display after the number",
	"chart.option.decimals.label": "Decimal Places",
	"chart.option.decimals.description": "Number of decimal places to display",
	"chart.option.showHistogram.label": "Show Variance Histogram",
	"chart.option.showHistogram.description": "Display historical variance chart below the delta",
	"chart.option.useLastCompletePeriod.label": "Use Last Complete Period",
	"chart.option.useLastCompletePeriod.description": "Exclude current incomplete period from calculation (e.g., partial week/month)",
	"chart.option.skipLastPeriod.label": "Skip Last Period",
	"chart.option.skipLastPeriod.description": "Always exclude the last period regardless of completeness",
	"chart.option.retentionDisplayMode.label": "Display Mode",
	"chart.option.retentionDisplayMode.lineChart": "Line Chart",
	"chart.option.retentionDisplayMode.heatmapTable": "Heatmap Table",
	"chart.option.retentionDisplayMode.combined": "Combined",
	"chart.option.showLegend.label": "Show Legend",
	"chart.option.showLegend.description": "Show the legend",
	"chart.option.showGrid.label": "Show Grid",
	"chart.option.showGrid.description": "Show grid lines on the chart",
	"chart.option.showTooltip.label": "Show Tooltip",
	"chart.option.showTooltip.description": "Show tooltip on hover with detailed stats",
	"chart.option.priorPeriodStyle.label": "Prior Period Line Style",
	"chart.option.priorPeriodStyle.dashed": "Dashed",
	"chart.option.priorPeriodStyle.dotted": "Dotted",
	"chart.option.priorPeriodStyle.solid": "Solid",
	"chart.option.priorPeriodStyle.description": "Line style for prior period in comparison mode",
	"chart.option.priorPeriodOpacity.label": "Prior Period Opacity",
	"chart.option.priorPeriodOpacity.description": "Opacity for prior period lines (0.1 to 1)",
	"chart.option.showTotal.label": "Show Total Bar",
	"chart.option.showTotal.description": "Append a final bar showing the running total",
	"chart.option.showConnectorLine.label": "Show Connector Line",
	"chart.option.showConnectorLine.description": "Draw a dashed step-line connecting bar tops",
	"chart.option.showDataLabels.label": "Show Data Labels",
	"chart.option.showDataLabels.description": "Display the value at each data point",
	"chart.option.showReferenceLineAtZero.label": "Show Zero Reference Line",
	"chart.option.showReferenceLineAtZero.description": "Draw a dashed line at Y = 0",
	"chart.option.showMedianMarker.label": "Show Median Marker",
	"chart.option.showMedianMarker.description": "Draw a tick at each band's median value",
	"chart.option.showBandStats.label": "Show Band Statistics",
	"chart.option.showBandStats.description": "Show the dot count and spread beside each band name",
	"chart.option.showExtremeLabels.label": "Label Extremes",
	"chart.option.showExtremeLabels.description": "Name the lowest and highest dot in each band",
	"chart.option.dotSize.label": "Dot Size",
	"chart.option.dotSize.description": "Larger dots are easier to see but spread the swarm further",
	"chart.option.dotSize.small": "Small",
	"chart.option.dotSize.medium": "Medium",
	"chart.option.dotSize.large": "Large",
	"chart.option.bandSort.label": "Band Order",
	"chart.option.bandSort.description": "How to order the bands from top to bottom",
	"chart.option.bandSort.none": "Query order",
	"chart.option.bandSort.valueDesc": "Highest median first",
	"chart.option.bandSort.valueAsc": "Lowest median first",
	"chart.option.bandSort.count": "Most dots first",
	"chart.option.lineType.label": "Line Interpolation",
	"chart.option.lineType.smooth": "Smooth (monotone)",
	"chart.option.lineType.linear": "Linear",
	"chart.option.lineType.step": "Step",
	"chart.option.lineType.description": "How data points are connected",
	"chart.option.rangeMode.label": "Chart Mode",
	"chart.option.rangeMode.ohlc": "OHLC (open, close, high, low)",
	"chart.option.rangeMode.range": "Range (high, low / bid, ask)",
	"chart.option.rangeMode.description": "OHLC: 4 measures. Range: 2 measures (high + low).",
	"chart.option.bullColor.label": "Bullish Colour",
	"chart.option.bullColor.description": "Candle colour when close ≥ open",
	"chart.option.bearColor.label": "Bearish Colour",
	"chart.option.bearColor.description": "Candle colour when close < open",
	"chart.option.showWicks.label": "Show Wicks",
	"chart.option.showWicks.description": "Draw high/low wicks above and below the body",
	"chart.option.minValue.label": "Minimum Value",
	"chart.option.minValue.description": "Lower bound of the gauge arc (default 0)",
	"chart.option.maxValue.label": "Maximum Value (static)",
	"chart.option.maxValue.description": "Upper bound of the gauge. Leave empty to use yAxis[1] or default 100",
	"chart.option.showCentreLabel.label": "Show Centre Label",
	"chart.option.showCentreLabel.description": "Display current value and field name in the centre of the gauge",
	"chart.option.showPercentage.label": "Show as Percentage",
	"chart.option.showPercentage.description": "Display value as % of max instead of raw number",
	"chart.option.fitToWidth.label": "Fit to Width",
	"chart.option.fitToWidth.description": "Automatically size blocks to fill portlet width and height while maintaining aspect ratio",
	"chart.option.fontSize.label": "Font Size",
	"chart.option.fontSize.small": "Small",
	"chart.option.fontSize.medium": "Medium",
	"chart.option.fontSize.large": "Large",
	"chart.option.alignment.label": "Text Alignment",
	"chart.option.alignment.left": "Left",
	"chart.option.alignment.center": "Center",
	"chart.option.alignment.right": "Right",
	"chart.option.hideHeader.label": "Hide Header",
	"chart.option.hideHeader.description": "Hide the portlet header bar (title and action buttons)",
	"chart.option.transparentBackground.label": "Transparent Background",
	"chart.option.transparentBackground.description": "Remove card background, border, and shadow for seamless integration as section headers",
	"chart.option.autoHeight.label": "Auto Height",
	"chart.option.autoHeight.description": "In row and mobile layouts, size to markdown content instead of fixed row height",
	"chart.option.accentBorder.label": "Accent Border",
	"chart.option.accentBorder.none": "None",
	"chart.option.accentBorder.left": "Left",
	"chart.option.accentBorder.top": "Top",
	"chart.option.accentBorder.bottom": "Bottom",
	"chart.option.accentBorder.description": "Add an accent-coloured border on one side of the content",
	"chart.configText.20_percent": "20%",
	"chart.configText.40_percent": "40%",
	"chart.configText.60_percent": "60%",
	"chart.configText.80_percent": "80%",
	"chart.configText.accent_color": "Accent Color",
	"chart.configText.activity_measure": "Activity Measure",
	"chart.configText.add_2_or_more_measures_they_become_the_x_axis_categories_in_the_order_li": "Add 2 or more measures — they become the X-axis categories in the order listed",
	"chart.configText.add_an_accent_colored_border_on_one_side_of_the_content": "Add an accent-colored border on one side of the content",
	"chart.configText.all_fields_to_display_as_columns": "All fields to display as columns",
	"chart.gauge.thresholds.description": "Each band runs from its value up to the next one. Values are on the gauge’s own scale.",
	"chart.configText.axes_categories": "Axes (Categories)",
	"chart.configText.bubble_colour": "Bubble Colour",
	"chart.configText.bubble_labels": "Bubble Labels",
	"chart.configText.bubble_radius": "Bubble Radius",
	"chart.configText.categories": "Categories",
	"chart.configText.choose_how_to_visualize_retention_data": "Choose how to visualize retention data",
	"chart.configText.color_bubbles_by_this_field_optional": "Color bubbles by this field (optional)",
	"chart.configText.color_for_negative_changes_decreases": "Color for negative changes (decreases)",
	"chart.configText.color_for_positive_changes_increases": "Color for positive changes (increases)",
	"chart.configText.color_from_the_dashboard_palette_for_headers_bullets_and_links": "Color from the dashboard palette for headers, bullets, and links",
	"chart.configText.color_from_the_dashboard_palette_for_the_kpi_value_text": "Color from the dashboard palette for the KPI value text",
	"chart.configText.color_groups": "Color Groups",
	"chart.configText.columns": "Columns",
	"chart.configText.columns_x_axis": "Columns (X-Axis)",
	"chart.configText.count_at_each_step_auto_calculated": "Count at each step (auto-calculated)",
	"chart.configText.count_of_entities_following_each_path": "Count of entities following each path",
	"chart.configText.current_value_to_display_on_the_gauge_e_g_current_equity_margin_used": "Current value to display on the gauge (e.g. current equity, margin used)",
	"chart.configText.dimension_for_column_categories": "Dimension for column categories",
	"chart.configText.dimension_for_ordering_data_typically_time": "Dimension for ordering data (typically time)",
	"chart.configText.dimension_for_pie_slices": "Dimension for pie slices",
	"chart.configText.dimension_for_row_categories": "Dimension for row categories",
	"chart.configText.dimension_labels_for_each_bar_segment_e_g_symbol_transaction_type": "Dimension labels for each bar segment (e.g. symbol, transaction type)",
	"chart.configText.dimension_optional": "Dimension (optional)",
	"chart.configText.dimension_to_color_points_by_category": "Dimension to color points by category",
	"chart.configText.dimension_to_color_rectangles_by_category": "Dimension to color rectangles by category",
	"chart.configText.dimension_to_group_boxes_by_e_g_symbol_platform": "Dimension to group boxes by (e.g. symbol, platform)",
	"chart.configText.dimension_to_split_data_into_separate_profile_lines_e_g_symbol_platform": "Dimension to split data into separate profile lines (e.g. symbol, platform)",
	"chart.configText.dimensions_for_radar_axes": "Dimensions for radar axes",
	"chart.configText.dimensions_for_radial_segments": "Dimensions for radial segments",
	"chart.configText.dimensions_for_treemap_rectangles": "Dimensions for treemap rectangles",
	"chart.configText.dimensions_to_create_multiple_radar_shapes": "Dimensions to create multiple radar shapes",
	"chart.configText.dimensions_to_create_separate_lines": "Dimensions to create separate lines",
	"chart.configText.dimensions_to_create_stacked_areas": "Dimensions to create stacked areas",
	"chart.configText.display_the_value_above_each_bar_segment": "Display the value above each bar segment",
	"chart.configText.display_value_at_each_data_point": "Display value at each data point",
	"chart.configText.drop_1_measure_for_auto_mode_3_for_avg_stddev_median_mode_or_5_for_min_q": "Drop 1 measure for auto mode, 3 for avg/stddev/median mode, or 5 for min/q1/median/q3/max mode",
	"chart.configText.drop_2_4_measures_in_order_open_close_high_low_ohlc_mode_for_range_mode_": "Drop 2–4 measures in order: open, close, high, low (OHLC mode). For range mode drop 2: high, low.",
	"chart.configText.enter_markdown_text_supports_headers_bold_text_italic_text_links_text_ur": "Enter markdown text. Supports headers (#), bold (**text**), italic (*text*), links ([text](url)), lists (- item), and horizontal rules (---).",
	"chart.configText.event_dimension_that_categorizes_flow_nodes": "Event dimension that categorizes flow nodes",
	"chart.configText.event_type": "Event Type",
	"chart.configText.exclude_current_incomplete_period_from_aggregation_e_g_partial_week_mont": "Exclude current incomplete period from aggregation (e.g., partial week/month)",
	"chart.configText.exclude_current_incomplete_period_from_delta_calculation_e_g_partial_wee": "Exclude current incomplete period from delta calculation (e.g., partial week/month)",
	"chart.configText.field_to_use_for_bubble_labels_and_identification": "Field to use for bubble labels and identification",
	"chart.configText.flow_count": "Flow Count",
	"chart.configText.hide_the_statistics_footer_below_the_chart": "Hide the statistics footer below the chart",
	"chart.configText.hollow_center_size_0_percent_solid_pie_higher_donut_style": "Hollow center size (0% = solid pie, higher = donut style)",
	"chart.configText.horizontal_alignment_of_the_markdown_content": "Horizontal alignment of the markdown content",
	"chart.configText.horizontal_axis_position": "Horizontal axis position",
	"chart.configText.how_to_stack_multiple_area_series": "How to stack multiple area series",
	"chart.configText.how_to_stack_multiple_bar_series": "How to stack multiple bar series",
	"chart.configText.markdown_content": "Markdown Content",
	"chart.configText.measure_for_rectangle_sizes": "Measure for rectangle sizes",
	"chart.configText.measure_for_slice_sizes": "Measure for slice sizes",
	"chart.configText.measure_for_y_position": "Measure for Y position",
	"chart.configText.measure_or_dimension_for_x_position": "Measure or dimension for X position",
	"chart.configText.measure_that_determines_cell_color": "Measure that determines cell color",
	"chart.configText.measure_to_display_as_kpi_number": "Measure to display as KPI number",
	"chart.configText.measure_to_display_in_the_kpi_text_template": "Measure to display in the KPI text template",
	"chart.configText.measure_to_track_changes_for": "Measure to track changes for",
	"chart.configText.measure_used_for_activity_intensity_color_coding": "Measure used for activity intensity (color coding)",
	"chart.configText.measures_for_area_values": "Measures for area values",
	"chart.configText.measures_for_bar_heights": "Measures for bar heights",
	"chart.configText.measures_for_line_values": "Measures for line values",
	"chart.configText.measures_for_radar_values": "Measures for radar values",
	"chart.configText.measures_for_radial_bar_lengths": "Measures for radial bar lengths",
	"chart.configText.measures_x_axis_order": "Measures (X-Axis Order)",
	"chart.configText.negative_change_color": "Negative Change Color",
	"chart.configText.none_pie": "None (Pie)",
	"chart.configText.number_formatting_for_cell_values_and_legend": "Number formatting for cell values and legend",
	"chart.configText.number_formatting_for_numeric_values": "Number formatting for numeric values",
	"chart.configText.number_formatting_for_size_values": "Number formatting for size values",
	"chart.configText.number_formatting_for_the_displayed_value_and_axis_labels": "Number formatting for the displayed value and axis labels",
	"chart.configText.number_formatting_for_the_price_axis": "Number formatting for the price axis",
	"chart.configText.number_formatting_for_the_value_axis": "Number formatting for the value axis",
	"chart.configText.number_formatting_for_the_y_axis": "Number formatting for the Y-axis",
	"chart.configText.number_formatting_for_x_axis_labels": "Number formatting for X-axis labels",
	"chart.configText.number_formatting_for_y_axis_and_values": "Number formatting for Y-axis and values",
	"chart.configText.number_formatting_for_y_axis_labels": "Number formatting for Y-axis labels",
	"chart.configText.number_of_decimal_places_to_display_for_numeric_values": "Number of decimal places to display for numeric values",
	"chart.configText.ohlc_measures_open_close_high_low": "OHLC Measures (open, close, high, low)",
	"chart.configText.opacity_of_flow_links": "Opacity of flow links",
	"chart.configText.overall_text_size_for_the_markdown_content": "Overall text size for the markdown content",
	"chart.configText.positive_change_color": "Positive Change Color",
	"chart.configText.rows_y_axis": "Rows (Y-Axis)",
	"chart.configText.series_color_groups": "Series (Color Groups)",
	"chart.configText.series_multiple_lines": "Series (Multiple Lines)",
	"chart.configText.series_multiple_shapes": "Series (Multiple Shapes)",
	"chart.configText.series_split_into_multiple_lines": "Series (Split into Multiple Lines)",
	"chart.configText.series_stack_areas": "Series (Stack Areas)",
	"chart.configText.show_series_legend_only_visible_with_a_series_dimension": "Show series legend (only visible with a Series dimension)",
	"chart.configText.show_the_color_intensity_legend": "Show the color intensity legend",
	"chart.configText.show_the_legend_for_breakdown_segments": "Show the legend for breakdown segments",
	"chart.configText.single_measure_whose_values_are_summed_cumulatively": "Single measure whose values are summed cumulatively",
	"chart.configText.size": "Size",
	"chart.configText.size_of_bubbles_based_on_this_measure": "Size of bubbles based on this measure",
	"chart.configText.size_of_the_center_hole_0_for_full_circle": "Size of the center hole (0 for full circle)",
	"chart.configText.step_count": "Step Count",
	"chart.configText.step_name": "Step Name",
	"chart.configText.step_names_auto_populated_from_funnel_steps": "Step names (auto-populated from funnel steps)",
	"chart.configText.target_value_to_compare_against_first_value_used_if_multiple_provided": "Target value to compare against (first value used if multiple provided)",
	"chart.configText.template_for_displaying_the_text_use_value_to_insert_the_measure_value": "Template for displaying the text. Use ${value} to insert the measure value.",
	"chart.configText.text_template": "Text Template",
	"chart.configText.threshold_bands": "Threshold Bands",
	"chart.configText.time_dimension": "Time Dimension",
	"chart.configText.time_dimension_or_category_for_each_candle_e_g_date_symbol": "Time dimension or category for each candle (e.g. date, symbol)",
	"chart.configText.time_dimensions_or_dimensions_for_x_axis": "Time dimensions or dimensions for X-axis",
	"chart.configText.time_field_that_determines_grid_structure_granularity_affects_layout": "Time field that determines grid structure (granularity affects layout)",
	"chart.configText.value": "Value",
	"chart.configText.value_color": "Value Color",
	"chart.configText.value_color_intensity": "Value (Color Intensity)",
	"chart.configText.value_measure": "Value Measure",
	"chart.configText.values": "Values",
	"chart.configText.vertical_axis_position": "Vertical axis position",
	"chart.configText.visualization_style": "Visualization style",
	"chart.configText.x_axis_groups": "X-Axis (Groups)",
	"chart.configText.x_axis_time_categories": "X-Axis (Time/Categories)",
	"chart.configText.x_axis_time_category": "X-Axis (Time / Category)",
	"chart.configText.y_axis": "Y-Axis",
	"chart.configText.y_axis_measures": "Y-Axis (Measures)",
	"chart.configText.y_axis_value": "Y-Axis (Value)",
	"display.loading": "Loading display options...",
	"display.noOptions": "No display options available for this chart type.",
	"display.heading": "Display Options",
	"results.loading.title": "Executing Query...",
	"results.loading.subtitle": "Running your query against the cube API",
	"results.error.title": "Query Execution Failed",
	"results.error.subtitle": "There was an error executing your query. Please check the query and try again.",
	"results.waiting.title": "Preparing Query...",
	"results.waiting.subtitle": "Your query will execute shortly",
	"results.needsRefresh.title": "Ready to Execute",
	"results.needsRefresh.subtitle": "Click refresh to run your query",
	"results.needsRefresh.runButton": "Run Query",
	"results.empty.query": "Add metrics or breakdowns from the panel on the right to see results",
	"results.empty.retention": "Select a cube and configure retention settings to see results",
	"results.empty.funnel": "Add funnel steps to see conversion analysis",
	"results.empty.flow": "Configure flow analysis to see user journey paths",
	"results.empty.title": "No Results Yet",
	"results.ai.button": "Analyse with AI",
	"results.noData.title": "Query Successful",
	"results.noData.subtitle": "No data returned from the query",
	"results.chart.noData": "No data to display",
	"results.chart.noDataHint": "Run a query to see chart visualisation",
	"results.chart.unsupported": "Unsupported chart type",
	"results.refreshing": "Refreshing results...",
	"results.header.rows": "rows",
	"results.header.row": "row",
	"results.header.stale": "Results may be outdated",
	"results.header.failed": "Query failed",
	"results.header.executing": "Executing...",
	"results.header.noResults": "No results",
	"results.view.chart": "Chart",
	"results.view.merged": "Merged",
	"results.warning.largeDataset": "Large dataset:",
	"results.warning.configChanged": "Query configuration changed. Results may be outdated.",
	"results.warning.refreshNow": "Refresh Now",
	"results.share.copied": "Copied!",
	"results.share.noChart": "(no chart)",
	"server.errors.dbNotConfigured": "Database executor not configured",
	"server.errors.cubeNotFound": "Cube '{cubeName}' not found",
	"server.errors.noCubesInQuery": "No cubes found in query",
	"server.errors.dbAdapterRequired": "DatabaseExecutor must have a databaseAdapter property",
	"server.errors.rlsRequiresTransactions": "rlsSetup requires a database driver that supports transactions (db.transaction)",
	"server.errors.queryExecutionFailed": "Query execution failed: {message}",
	"server.errors.queryExecutionUnknown": "Query execution failed: Unknown error",
	"server.errors.noCompareDateRange": "No compareDateRange found in query",
	"server.errors.compareDateRangeInvalid": "compareDateRange requires at least 2 periods",
	"server.errors.funnelValidationFailed": "Funnel validation failed: {errors}",
	"server.errors.flowValidationFailed": "Flow validation failed: {errors}",
	"server.errors.retentionValidationFailed": "Retention validation failed: {errors}",
	"server.errors.cubeRefUnresolved": "{cubeName}.joins.{joinName}: target cube '{targetCube}' is not registered",
	"server.errors.unresolvedCubeRefs": "Unresolved cube references:\n{details}",
	"server.errors.cubeSetIdEmpty": "Cube set id must not be empty — the empty id is reserved for the base cube set",
	"server.errors.cubeSetNotFound": "No cube set registered for '{setId}'",
	"server.errors.attributeIdRequired": "Attribute definitions must have a non-empty id",
	"server.errors.calculatedMeasureValidation": "Calculated measure validation failed for cube '{cubeName}':\n{details}",
	"server.errors.queryValidationFailed": "Query validation failed: {errors}",
	"server.errors.queryContainsMultipleModes": "Query contains multiple query modes: {modes}",
	"server.errors.primaryCubeNotFound": "Primary cube '{cubeName}' not found",
	"server.errors.noJoinPath": "No join path found from '{fromCube}' to '{toCube}'",
	"server.errors.cubeNotFoundForMeasure": "Cube '{cubeName}' not found for measure '{measure}'",
	"server.errors.cubeNotFoundForDimension": "Cube '{cubeName}' not found for dimension '{dimension}'",
	"server.errors.cubeNotFoundForTimeDimension": "Cube '{cubeName}' not found for time dimension '{timeDimension}'",
	"server.errors.invalidFunnelConfig": "Query does not contain a valid funnel configuration",
	"server.errors.invalidFlowConfig": "Query does not contain a valid flow configuration",
	"server.errors.invalidRetentionConfig": "Query does not contain a valid retention configuration",
	"server.errors.agentResponseTruncated": "The assistant ran out of response space and stopped part-way through. Ask it to continue, or raise maxTokens in the agent configuration.",
	"server.errors.llmInitFailed": "Failed to initialize LLM provider",
	"server.validation.ai.bindingKeyRequired.flow": "flow.bindingKey is required",
	"server.validation.ai.bindingKeyRequired.funnel": "funnel.bindingKey is required",
	"server.validation.ai.bindingKeyRequired.retention": "retention.bindingKey is required",
	"server.validation.ai.cubeNotFoundInFilter": "Cube '{cubeName}' not found in filter",
	"server.validation.ai.cubeNotFoundWithAvailable": "Cube '{cubeName}' not found",
	"server.validation.ai.cubeNotFoundWithSuggestion": "Cube '{cubeName}' not found",
	"server.validation.ai.dimensionNotFoundWithAvailable": "Dimension '{dimensionName}' not found on cube '{cubeName}'",
	"server.validation.ai.dimensionNotFoundWithSuggestion": "Dimension '{dimensionName}' not found on cube '{cubeName}'",
	"server.validation.ai.dimensionNotTimeType": "Dimension '{dimension}' is not a time type (it's '{type}')",
	"server.validation.ai.emptyQuery": "Query must have at least one measure or dimension",
	"server.validation.ai.eventDimensionRequired": "flow.eventDimension is required",
	"server.validation.ai.filterFieldNotFound": "Filter field '{fieldName}' not found on cube '{cubeName}'",
	"server.validation.ai.filterFieldNotFoundWithSuggestion": "Filter field '{fieldName}' not found on cube '{cubeName}'",
	"server.validation.ai.funnelRequiresSteps": "funnel requires at least 2 steps",
	"server.validation.ai.funnelStepsRequired": "funnel.steps array is required",
	"server.validation.ai.granularityNotSpecified": "retention.granularity not specified",
	"server.validation.ai.invalidDimensionFormat": "Invalid dimension format: '{dimension}'. Expected 'CubeName.dimensionName'",
	"server.validation.ai.invalidFilterMemberFormat": "Invalid filter member format: '{member}'",
	"server.validation.ai.invalidMeasureFormat": "Invalid measure format: '{measure}'. Expected 'CubeName.measureName'",
	"server.validation.ai.measureNotFoundWithAvailable": "Measure '{measureName}' not found on cube '{cubeName}'",
	"server.validation.ai.measureNotFoundWithSuggestion": "Measure '{measureName}' not found on cube '{cubeName}'",
	"server.validation.ai.performanceManyDimensions": "Query has {count} dimensions, which may produce many rows",
	"server.validation.ai.performanceManyMeasures": "Query has {count} measures, which may impact performance",
	"server.validation.ai.periodsNotSpecified": "retention.periods not specified",
	"server.validation.ai.retentionTimeDimensionRequired": "retention.timeDimension is required",
	"server.validation.ai.stepMissingName": "Step {step} is missing a name",
	"server.validation.ai.stepsBothMissing": "Neither stepsBefore nor stepsAfter specified",
	"server.validation.ai.suggestAddDimensionFilters": "Consider adding filters or reducing dimensions",
	"server.validation.ai.suggestAddStepNames": "Add descriptive names to funnel steps",
	"server.validation.ai.suggestSetSteps": "Set stepsBefore and/or stepsAfter to see event sequences",
	"server.validation.ai.suggestSpecifyGranularity": "Specify granularity: \"day\", \"week\", or \"month\"",
	"server.validation.ai.suggestSpecifyPeriods": "Specify number of periods to analyze",
	"server.validation.ai.suggestSplitQueries": "Consider splitting into multiple queries",
	"server.validation.ai.suggestUseTimeDimension": "Use a dimension with type \"time\" for timeDimensions",
	"server.validation.ai.timeDimensionRequired.flow": "flow.timeDimension is required",
	"server.validation.ai.timeDimensionRequired.funnel": "funnel.timeDimension is required",
	"server.validation.chart.barNeedsDimension": "Bar charts need an xAxis dimension for category labels. Add a dimension to the query or use \"table\" chart type instead.",
	"server.validation.chart.barXAxisRequired": "chartConfig.xAxis is required for bar charts. Put a dimension in xAxis so bars have category labels.",
	"server.validation.chart.dropZoneRequired": "chartConfig.{key} is required for {chartType} chart ({label}). Accepts: {acceptDesc}.",
	"server.validation.chart.recordGrainNeedsUngrouped": "{chartType} lists one row per record, so its query must set \"ungrouped\": true. Add it to the query, and remove count/countDistinct measures — they cannot be ungrouped. An ungrouped query also cannot span two cubes joined by hasMany, so keep it to one cube plus its to-one joins.",
	"server.validation.chart.seriesDuplicatesXAxis": "chartConfig.series must not contain the same field as xAxis (found: {duplicates}). The series field is only for splitting into grouped/stacked sub-series by a DIFFERENT dimension. Remove the duplicate from series.",
	"server.validation.flow.bindingKeyCubeNotFound": "Binding key cube not found: {cubeName}",
	"server.validation.flow.bindingKeyDimNotFound": "Binding key dimension not found: {dimName} in cube {cubeName}",
	"server.validation.flow.bindingKeyMappingCubeNotFound": "Binding key mapping cube not found: {cubeName}",
	"server.validation.flow.eventDimCubeNotFound": "Event dimension cube not found: {cubeName}",
	"server.validation.flow.eventDimNotFound": "Event dimension not found: {dimName} in cube {cubeName}",
	"server.validation.flow.eventDimRequired": "Event dimension is required for flow analysis",
	"server.validation.flow.highStepDepthWarning": "High step depth (4-5) may impact query performance on large datasets",
	"server.validation.flow.invalidBindingKeyFormat": "Invalid binding key format: {bindingKey}. Expected 'CubeName.dimensionName'",
	"server.validation.flow.invalidEventDimFormat": "Invalid event dimension format: {eventDimension}. Expected 'CubeName.dimensionName'",
	"server.validation.flow.invalidJoinStrategy": "Invalid joinStrategy: {joinStrategy}",
	"server.validation.flow.invalidTimeDimFormat": "Invalid time dimension format: {timeDimension}. Expected 'CubeName.dimensionName'",
	"server.validation.flow.lateralNotSupported": "Lateral joins are not supported on this database",
	"server.validation.flow.lateralNotSupportedExec": "Lateral joins with CTE references are not supported on this database",
	"server.validation.flow.sqliteNotSupported": "Flow queries are not supported on SQLite. Use PostgreSQL or MySQL for flow analysis.",
	"server.validation.flow.startingStepFilterRequired": "Starting step must have at least one filter",
	"server.validation.flow.startingStepNameMissing": "Starting step has no name - using default",
	"server.validation.flow.startingStepRequired": "Starting step is required for flow analysis",
	"server.validation.flow.stepsBeforeRange": "stepsBefore must be between 0 and 5, got: {value}",
	"server.validation.flow.stepsAfterRange": "stepsAfter must be between 0 and 5, got: {value}",
	"server.validation.flow.timeDimCubeNotFound": "Time dimension cube not found: {cubeName}",
	"server.validation.flow.timeDimNotFound": "Time dimension not found: {dimName} in cube {cubeName}",
	"server.validation.funnel.bindingKeyCubeNotFound": "Binding key cube not found: {cubeName}",
	"server.validation.funnel.bindingKeyDimNotFound": "Binding key dimension not found: {dimName} in cube {cubeName}",
	"server.validation.funnel.bindingKeyMappingCubeNotFound": "Binding key mapping cube not found: {cubeName}",
	"server.validation.funnel.invalidBindingKeyFormat": "Invalid binding key format: {bindingKey}. Expected 'CubeName.dimensionName'",
	"server.validation.funnel.invalidTimeDimFormat": "Invalid time dimension format: {timeDimension}. Expected 'CubeName.dimensionName'",
	"server.validation.funnel.minSteps": "Funnel must have at least 2 steps",
	"server.validation.funnel.stepCubeNotFound": "Step {step} cube not found: {cube}",
	"server.validation.funnel.stepFilterCubeNotFound": "Step {step} filter cube not found: {cubeName}",
	"server.validation.funnel.stepFilterIsMeasure": "Step {step} filter '{member}' is a measure. Funnel step filters only support dimensions, not measures.",
	"server.validation.funnel.stepFilterMemberNotFound": "Step {step} filter member not found: {field} in cube {cubeName}",
	"server.validation.funnel.stepFilterNoJoinPath": "Step {step} filter '{member}' requires a join from '{stepCube}' but no join path was found. Define a join relationship between these cubes.",
	"server.validation.funnel.stepMustHaveName": "Step {step} must have a name",
	"server.validation.funnel.stepTimeToConvertFormat": "Step {step} timeToConvert must be ISO 8601 duration format: {value}",
	"server.validation.funnel.timeDimCubeNotFound": "Time dimension cube not found: {cubeName}",
	"server.validation.funnel.timeDimNotFound": "Time dimension not found: {dimName} in cube {cubeName}",
	"server.validation.retention.bindingKeyCubeNotFound": "Binding key cube not found: {cubeName}",
	"server.validation.retention.bindingKeyDimNotFound": "Binding key dimension not found: {dimName} in cube {cubeName}",
	"server.validation.retention.bindingKeyMappingCubeNotFound": "Binding key mapping cube not found: {cubeName}",
	"server.validation.retention.breakdownDimCubeNotFound": "Breakdown dimension cube not found: {cubeName}",
	"server.validation.retention.breakdownDimNotFound": "Breakdown dimension not found: {dimName} in cube {cubeName}",
	"server.validation.retention.cubeNotFound": "Cube not found: {cubeName}",
	"server.validation.retention.dateRangeEndRequired": "Date range end is required",
	"server.validation.retention.dateRangeInvalidEnd": "Invalid date range end format",
	"server.validation.retention.dateRangeInvalidStart": "Invalid date range start format",
	"server.validation.retention.dateRangeRequired": "Date range is required",
	"server.validation.retention.dateRangeStartBeforeEnd": "Date range start must be before or equal to end",
	"server.validation.retention.dateRangeStartRequired": "Date range start is required",
	"server.validation.retention.engineNotSupported": "Retention queries are not supported on {engine}. Use PostgreSQL or DuckDB for retention analysis.",
	"server.validation.retention.invalidBindingKeyFormat": "Invalid binding key format: {bindingKey}. Expected 'CubeName.dimensionName'",
	"server.validation.retention.invalidBreakdownDimFormat": "Invalid breakdown dimension format: {dimension}. Expected 'CubeName.dimensionName'",
	"server.validation.retention.invalidGranularity": "Invalid granularity: {granularity}",
	"server.validation.retention.invalidRetentionType": "Invalid retention type: {retentionType}",
	"server.validation.retention.invalidTimeDimFormat": "Invalid time dimension format: {timeDimension}",
	"server.validation.retention.noBindingKeyMapping": "No binding key mapping found for cube: {cubeName}",
	"server.validation.retention.periodsMax": "Periods cannot exceed 52 (performance limit)",
	"server.validation.retention.periodsMin": "Periods must be at least 1",
	"server.validation.retention.timeDimNotFound": "Time dimension not found: {dimName}",
	"server.validation.calculatedMeasure.mustHaveCalculatedSql": "Calculated measure '{cubeName}.{fieldName}' must have calculatedSql property",
	"server.validation.calculatedMeasure.invalidSyntax": "Invalid calculatedSql syntax in '{cubeName}.{fieldName}': {errors}",
	"server.validation.calculatedMeasure.circularDependency": "Circular dependency detected in calculated measures: {cycle}",
	"server.validation.query.multipleQueryModes": "Query contains multiple query modes: {modes}",
	"server.validation.query.funnelBindingKeyCubeNotFound": "Funnel binding key cube not found: {cubeName}",
	"server.validation.query.flowBindingKeyCubeNotFound": "Flow binding key cube not found: {cubeName}",
	"server.validation.query.retentionCubeNotFound": "Retention cube not found: {cubeName}",
	"server.validation.query.retentionBindingKeyCubeNotFound": "Retention binding key cube not found: {cubeName}",
	"server.validation.query.retentionBreakdownCubeNotFound": "Retention breakdown cube not found: {cubeName}",
	"server.validation.query.invalidMeasureFormat": "Invalid measure format: {measure}. Expected format: 'CubeName.fieldName'",
	"server.validation.query.cubeNotFoundForMeasure": "Cube '{cubeName}' not found (referenced in measure '{measure}')",
	"server.validation.query.measureNotFound": "Measure '{fieldName}' not found on cube '{cubeName}'{hint}",
	"server.validation.query.invalidDimensionFormat": "Invalid dimension format: {dimension}. Expected format: 'CubeName.fieldName'",
	"server.validation.query.cubeNotFoundForDimension": "Cube '{cubeName}' not found (referenced in dimension '{dimension}')",
	"server.validation.query.dimensionNotFound": "Dimension '{fieldName}' not found on cube '{cubeName}'{hint}",
	"server.validation.query.invalidTimeDimensionFormat": "Invalid timeDimension format: {dimension}. Expected format: 'CubeName.fieldName'",
	"server.validation.query.cubeNotFoundForTimeDimension": "Cube '{cubeName}' not found (referenced in timeDimension '{dimension}')",
	"server.validation.query.timeDimensionNotFound": "TimeDimension '{fieldName}' not found on cube '{cubeName}' (must be a dimension with time type)",
	"server.validation.query.mustReferenceAtLeastOneCube": "Query must reference at least one cube through measures, dimensions, or filters",
	"server.validation.query.ungroupedRequiresDimension": "Ungrouped queries require at least one dimension or time dimension",
	"server.validation.query.ungroupedIncompatibleFunnel": "Ungrouped queries are incompatible with funnel analysis",
	"server.validation.query.ungroupedIncompatibleFlow": "Ungrouped queries are incompatible with flow analysis",
	"server.validation.query.ungroupedIncompatibleRetention": "Ungrouped queries are incompatible with retention analysis",
	"server.validation.query.ungroupedIncompatibleCompareDateRange": "Ungrouped queries are incompatible with compareDateRange",
	"server.validation.query.ungroupedIncompatibleFillMissingDates": "Ungrouped queries are incompatible with fillMissingDates",
	"server.validation.query.filterMustHaveMember": "Filter must have a member field",
	"server.validation.query.invalidFilterMemberFormat": "Invalid filter member format: {member}. Expected format: 'CubeName.fieldName'",
	"server.validation.query.cubeNotFoundForFilter": "Cube '{cubeName}' not found (referenced in filter '{member}')",
	"server.validation.query.filterFieldNotFound": "Filter field '{fieldName}' not found on cube '{cubeName}' (must be a dimension or measure){hint}",
	"server.errors.funnel.cubeNotFoundForStep": "Cube not found for step: {cube}",
	"server.errors.funnel.cubeNotFoundForBindingKey": "Cube not found for binding key: {bindingKey}",
	"server.errors.funnel.cannotResolveCubeForStep": "Cannot resolve cube for step - multi-cube funnel requires cube specification in each step",
	"server.errors.funnel.bindingKeyDimNotFound": "Binding key dimension not found: {bindingKey}",
	"server.errors.funnel.noBindingKeyMapping": "No binding key mapping found for cube: {cubeName}",
	"server.errors.funnel.bindingKeyMappingDimNotFound": "Binding key dimension not found: {dimension}",
	"server.errors.funnel.timeDimNotFound": "Time dimension not found: {timeDimension}",
	"server.errors.funnel.noTimeDimMapping": "No time dimension mapping found for cube: {cubeName}",
	"server.errors.funnel.timeDimMappingNotFound": "Time dimension not found: {dimension}",
	"server.errors.flow.cannotResolveCube": "Cannot resolve cube for flow query",
	"server.errors.flow.cubeNotFound": "Cube not found: {cubeName}",
	"server.errors.flow.bindingKeyDimNotFound": "Binding key dimension not found: {bindingKey}",
	"server.errors.flow.noBindingKeyMapping": "No binding key mapping found for cube: {cubeName}",
	"server.errors.flow.bindingKeyMappingDimNotFound": "Binding key dimension not found: {dimension}",
	"server.errors.flow.timeDimNotFound": "Time dimension not found: {timeDimension}",
	"server.errors.flow.noTimeDimMapping": "No time dimension mapping found for cube: {cubeName}",
	"server.errors.flow.timeDimMappingNotFound": "Time dimension not found: {dimension}",
	"server.errors.flow.eventDimNotFound": "Event dimension not found: {eventDimension}",
	"server.validation.template.emptyReference": "Empty member reference {} found in template",
	"server.validation.template.invalidMemberReference": "Invalid member reference {ref}: must start with letter or underscore, and contain only letters, numbers, underscores, and dots",
	"server.validation.template.multipleDots": "Invalid member reference {ref}: only one dot allowed (Cube.measure format)",
	"server.validation.template.nestedBraces": "Nested braces are not allowed in member references",
	"server.validation.template.substituteTargetCubeNotFound": "Cannot substitute {ref}: cube '{cubeName}' not found",
	"server.validation.template.substituteMeasureNotResolved": "Cannot substitute {ref}: measure '{measureName}' not resolved yet. Ensure measures are resolved in dependency order.",
	"server.validation.template.unmatchedClosingBrace": "Unmatched closing brace at position {position}",
	"server.validation.template.unmatchedOpeningBrace": "Unmatched opening brace in template",
	"notebook.aiAssistant": "AI Assistant",
	"notebook.saveAsDashboard": "Save as Dashboard",
	"notebook.saveAsDashboardTitle": "Save notebook as a dashboard",
	"notebook.clearTitle": "Clear notebook and chat",
	"notebook.feedbackThanks": "Thanks for your feedback!",
	"notebook.feedbackQuestion": "Was this helpful?",
	"notebook.feedbackYes": "Yes",
	"notebook.feedbackNo": "No",
	"notebook.thinking": "Thinking...",
	"notebook.emptyState.title": "Data Analysis Assistant",
	"notebook.emptyState.description": "Ask me about your data and I'll create visualizations and insights.",
	"notebook.emptyState.example1": "\"Show me employee productivity trends\"",
	"notebook.emptyState.example2": "\"What are the top departments by headcount?\"",
	"notebook.emptyState.example3": "\"Compare revenue across product categories\"",
	"notebook.saveAsDashboardPrompt": "Save the current notebook as a dashboard with a professional layout, section headers, and appropriate filters.",
	"notebook.chatInput.placeholder": "Ask about your data...",
	"notebook.chatInput.stop": "Stop",
	"notebook.chatInput.continue": "Continue",
	"notebook.chatInput.send": "Send",
	"notebook.canvas.emptyTitle": "Your notebook is empty",
	"notebook.canvas.emptyDescription": "Ask the AI assistant a question about your data. Charts and insights will appear here as the assistant analyzes your data.",
	"notebook.canvas.editVisualization": "Edit Visualization",
	"notebook.canvas.update": "Update",
	"notebook.collapsed.noBlocks": "No blocks",
	"notebook.collapsed.expandNotebook": "Expand notebook",
	"notebook.collapsed.expandChat": "Expand AI chat",
	"notebook.collapsed.aiChat": "AI Chat",
	"notebook.collapsed.markdown": "Markdown",
	"schema.loading": "Loading cube schema...",
	"schema.error": "Failed to load cube schema",
	"schema.noCubes": "No cubes found",
	"schema.noCubesHint": "Register some cubes to see the relationship diagram",
	"schema.computingLayout": "Computing layout...",
	"schema.searchPlaceholder": "Search cubes and fields...",
	"schema.autoLayout": "Auto Layout",
	"schema.missingDeps.title": "Schema Visualization requires additional packages",
	"schema.missingDeps.description": "Install the required dependencies to enable the interactive schema diagram:",
	"schema.loadingVisualization": "Loading schema visualization...",
	"schema.measures": "Measures ({count})",
	"schema.timeDimensions": "Time Dimensions ({count})",
	"schema.dimensions": "Dimensions ({count})",
	"schema.cubeInfo": "Cube info",
	"dataBrowser.selectCube": "Select a cube",
	"dataBrowser.selectCubeHint": "Choose a cube from the sidebar to browse its data",
	"dataBrowser.loadingData": "Loading data...",
	"dataBrowser.noData": "No data",
	"dataBrowser.noRows": "No rows returned for this query",
	"dataBrowser.toolbar.filters": "Filters",
	"dataBrowser.toolbar.columns": "Columns",
	"dataBrowser.toolbar.rows": "{count} rows",
	"dataBrowser.sidebar.cubes": "Cubes",
	"dataBrowser.sidebar.searchPlaceholder": "Search...",
	"dataBrowser.sidebar.noCubes": "No cubes found",
	"queryAnalysis.summary": "Query Summary",
	"queryAnalysis.summary.type": "Type",
	"queryAnalysis.summary.cubes": "Cubes",
	"queryAnalysis.summary.joins": "Joins",
	"queryAnalysis.summary.ctes": "CTEs",
	"queryAnalysis.summary.strategy": "Strategy",
	"queryAnalysis.primaryCube": "Primary Cube (FROM table)",
	"queryAnalysis.primaryCube.showCandidates": "Show candidates ({count})",
	"queryAnalysis.primaryCube.reachable": "reachable",
	"queryAnalysis.primaryCube.cannotReachAll": "cannot reach all",
	"queryAnalysis.joinPaths": "Join Paths",
	"queryAnalysis.joinPaths.steps": "{count} step",
	"queryAnalysis.joinPaths.stepsPlural": "{count} steps",
	"queryAnalysis.joinPaths.noPath": "No path",
	"queryAnalysis.joinPaths.selection": "Selection:",
	"queryAnalysis.joinPaths.pathCandidates": "Path scoring candidates ({count})",
	"queryAnalysis.joinPaths.visitedCubes": "Cubes visited during search ({count})",
	"queryAnalysis.preAggregations": "Pre-Aggregation CTEs",
	"queryAnalysis.preAggregations.measures": "Measures:",
	"queryAnalysis.preAggregations.joinKeys": "Join keys:",
	"queryAnalysis.warnings": "Warnings",
	"queryAnalysis.cubesInvolved": "Cubes involved:",
	"common.actions.copied": "Copied",
	"common.actions.copyToClipboard": "Copy to clipboard",
	"chart.availability.requiresMeasure": "Requires at least 1 measure",
	"chart.availability.requiresTwoMeasures": "Requires at least 2 measures",
	"chart.availability.requiresDimension": "Requires at least 1 dimension",
	"chart.availability.requiresTwoDimensions": "Requires at least 2 dimensions",
	"chart.availability.requiresTimeDimension": "Requires a time dimension",
	"chart.availability.scatter": "Requires 2 measures, or 1 measure plus 1 dimension",
	"chart.availability.bubble": "Requires at least 2 measures and 1 dimension",
	"chart.runtime.noData": "No data available",
	"chart.runtime.noDataHint.bar": "No data points to display in bar chart",
	"chart.runtime.noDataHint.line": "No data points to display in line chart",
	"chart.runtime.noDataHint.area": "No data points to display in area chart",
	"chart.runtime.noDataHint.pie": "No data points to display in pie chart",
	"chart.runtime.noDataHint.scatter": "No data points to display in scatter chart",
	"chart.runtime.noDataHint.radar": "No data points to display in radar chart",
	"chart.runtime.noDataHint.radialBar": "No data points to display in radial bar chart",
	"chart.runtime.noDataHint.treemap": "No data points to display in treemap chart",
	"chart.runtime.noDataHint.bubble": "No data points to display in bubble chart",
	"chart.runtime.noDataHint.boxPlot": "No data points to display in box plot chart",
	"chart.runtime.noDataHint.dotStrip": "No data points to display in dot strip plot",
	"chart.runtime.noDataHint.waterfall": "No data points to display in waterfall chart",
	"chart.runtime.noDataHint.candlestick": "No data points to display in candlestick chart",
	"chart.runtime.noDataHint.gauge": "No data points to display in gauge chart",
	"chart.runtime.noDataHint.measureProfile": "No data points to display in measure profile chart",
	"chart.runtime.noDataHint.activityGrid": "No data points to display in activity grid",
	"chart.runtime.noDataHint.heatmap": "Run a query to see heatmap visualization",
	"chart.runtime.noDataHint.table": "No data to display in table",
	"chart.runtime.noDataHint.kpi": "No data points to display",
	"chart.runtime.noDataHint.funnel": "Configure a funnel with at least 2 steps and a binding key",
	"chart.runtime.noDataHint.flow": "Configure a flow analysis with a starting step and event dimension",
	"chart.runtime.noDataHint.retention": "Configure retention analysis to see results",
	"chart.runtime.noValidData": "No valid data",
	"chart.runtime.noValidDataHint.bar": "No valid data points for bar chart after transformation",
	"chart.runtime.noValidDataHint.line": "No valid data points for line chart after transformation",
	"chart.runtime.noValidDataHint.area": "No valid data points for area chart after transformation",
	"chart.runtime.noValidDataHint.scatter": "No valid data points for scatter chart after transformation",
	"chart.runtime.noValidDataHint.radar": "No valid data points for radar chart after transformation",
	"chart.runtime.noValidDataHint.radialBar": "No valid data points for radial bar chart after transformation",
	"chart.runtime.noValidDataHint.treemap": "No valid data points for treemap chart after transformation",
	"chart.runtime.noValidDataHint.pie": "No data points to display in pie chart",
	"chart.runtime.noValidDataHint.pieFiltered": "Filtered out {count} data points (zero or invalid values)",
	"chart.runtime.noValidDataHint.boxPlot": "Could not compute box plot statistics from the provided data",
	"chart.runtime.noValidDataHint.dotStrip": "No valid numeric values for the dot strip plot",
	"chart.runtime.configErrorHint.dotStrip": "Dot strip plot needs a dimension to band by and one measure",
	"chart.runtime.dotStrip.unlabelledBand": "(no value)",
	"chart.runtime.dotStrip.count": "n={count}",
	"chart.runtime.dotStrip.countTruncated": "n={count}+",
	"chart.runtime.dotStrip.noDataRecorded": "no data recorded",
	"chart.runtime.dotStrip.spread": "spread {spread}×",
	"chart.runtime.dotStrip.truncated": "Showing the first {max} bands",
	"chart.runtime.noValidDataHint.gauge": "Gauge value is not a valid number",
	"chart.runtime.noValidDataHint.kpiText": "All values are null or invalid",
	"chart.runtime.configError": "Configuration Error",
	"chart.runtime.configErrorHint.axisInvalid": "Invalid or missing chart axis configuration",
	"chart.runtime.configErrorHint.axisFields": "Missing required X-axis or Y-axis fields",
	"chart.runtime.configErrorHint.pieAxis": "chartConfig.x/y or chartConfig.xAxis/yAxis required for pie chart",
	"chart.runtime.configErrorHint.radarNumeric": "No numeric fields found for radar chart values",
	"chart.runtime.configErrorHint.radialBarNumeric": "No numeric field found for radial bar chart values",
	"chart.runtime.configErrorHint.treemapNumeric": "No numeric field found for treemap chart size",
	"chart.runtime.configErrorHint.noMeasure": "No measure field configured",
	"chart.runtime.configErrorHint.noMeasures": "No measure fields configured",
	"chart.runtime.configErrorHint.bubbleRequired": "Bubble chart requires xAxis, yAxis, series, and sizeField dimensions",
	"chart.runtime.configErrorHint.bubbleOptional": "Optional: colorField for bubble coloring",
	"chart.runtime.configErrorHint.activityGridRequired": "Activity grid requires a time dimension and a measure",
	"chart.runtime.chartError": "{chartType} Error",
	"chart.runtime.unknownError": "Unknown rendering error",
	"chart.runtime.checkConfig": "Check the data and configuration",
	"chart.runtime.unableToRender": "Unable to render retention data",
	"chart.runtime.dataFormatIncorrect": "Data format may be incorrect",
	"chart.runtime.measuringDimensions": "Measuring chart dimensions...",
	"chart.runtime.unableToDisplay": "Unable to display chart",
	"chart.runtime.responsiveContainerError": "Failed to create responsive container",
	"chart.runtime.noDataToDisplay": "No data to display",
	"chart.runtime.table.invalidStructure": "Data structure is invalid",
	"chart.runtime.recordsTable.noColumns": "No columns available",
	"chart.runtime.recordsTable.rowRange": "{from}–{to} of {total}",
	"chart.runtime.recordsTable.pageOf": "Page {page} of {pages}",
	"chart.runtime.recordsTable.previousPage": "Previous page",
	"chart.runtime.recordsTable.nextPage": "Next page",
	"chart.runtime.heatmapNoResults": "The query returned no results for the heatmap",
	"chart.runtime.heatmapConfigRequired": "Configuration required",
	"chart.runtime.heatmapXRequired": "X-axis dimension required. ",
	"chart.runtime.heatmapYRequired": "Y-axis dimension required. ",
	"chart.runtime.heatmapValueRequired": "Value measure required.",
	"chart.runtime.heatmapTruncated": "Data truncated to {maxRows}x{maxCols} cells (original: {originalRows}x{originalCols}). Add filters to reduce dimensions.",
	"chart.runtime.activityGridGranularityTooHigh": "Granularity Too High",
	"chart.runtime.activityGridGranularityHint": "Activity grids work best with hour, day, week, month, or quarter granularity",
	"chart.runtime.activityGridGranularityAction": "Please choose a lower granularity for your time dimension",
	"chart.runtime.activityGridConfigRequired": "Configuration Required",
	"chart.runtime.retention.cohort": "Cohort",
	"chart.runtime.retention.segment": "Segment",
	"chart.runtime.retention.users": "Users",
	"chart.runtime.retention.cohortSize": "Cohort Size: {count}",
	"chart.runtime.retention.retained": "Retained: {count}",
	"chart.runtime.retention.rate": "Rate: {rate}",
	"chart.runtime.retention.retentionPercent": "Retention %",
	"chart.runtime.retention.periodLabel": "{cohort} - Period {period}",
	"chart.runtime.retention.noData": "No data",
	"chart.runtime.retention.total": "Total",
	"chart.runtime.retention.retention": "Retention",
	"chart.runtime.funnel.noData": "No funnel data",
	"chart.runtime.funnel.steps": "steps",
	"chart.runtime.funnel.overall": "Overall:",
	"chart.runtime.funnel.completed": "{completed} / {total} completed",
	"chart.runtime.flow.noData": "No flow data",
	"chart.runtime.flow.events": "events",
	"chart.runtime.flow.eventsAfter": "events (after)",
	"chart.runtime.flow.paths": "Paths:",
	"chart.runtime.flow.startingEntities": "starting entities",
	"chart.runtime.flow.entities": "entities",
	"chart.runtime.kpiDelta.insufficientData": "Insufficient Data",
	"chart.runtime.kpiDelta.requiresTwoPoints": "Delta calculation requires at least 2 data points",
	"chart.runtime.kpiDelta.currentPoints": "Current data points: {count}",
	"chart.runtime.kpiDelta.noVariance": "No variance data",
	"chart.runtime.kpiNumber.noData": "No data",
	"chart.runtime.markdown.noContent": "No content",
	"chart.runtime.markdown.addContent": "Add markdown content in the chart configuration",
	"chart.runtime.axisFormat.label": "Label",
	"chart.runtime.axisFormat.autoLabel": "Auto-generated label",
	"chart.runtime.axisFormat.unit": "Unit",
	"chart.runtime.axisFormat.custom": "Custom",
	"chart.runtime.axisFormat.prefix": "Prefix",
	"chart.runtime.axisFormat.prefixExample": "e.g., $",
	"chart.runtime.axisFormat.suffix": "Suffix",
	"chart.runtime.axisFormat.suffixExample": "e.g., units",
	"chart.runtime.axisFormat.currencyCode": "Currency code",
	"chart.runtime.axisFormat.currencyCodeHint": "Leave blank to follow the viewer's locale",
	"chart.runtime.axisFormat.abbreviation": "Abbreviation",
	"chart.runtime.axisFormat.yes": "Yes",
	"chart.runtime.axisFormat.no": "No",
	"chart.runtime.axisFormat.decimals": "Decimals",
	"chart.runtime.axisFormat.preview": "Preview",
	"chart.runtime.axisFormat.leftYAxis": "Left Y-Axis",
	"chart.runtime.axisFormat.rightYAxis": "Right Y-Axis",
	"chart.runtime.axisFormat.xAxis": "X-Axis",
	"chart.runtime.missingDep.title": "Missing Dependency",
	"chart.runtime.missingDep.description": "The {chartType} chart requires the {packageName} package.",
	"chart.runtime.missingDep.restartHint": "After installing, restart your development server.",
	"chart.runtime.unknownChartType": "Unknown chart type",
	"chart.runtime.unknownChartTypeHint": "\"{chartType}\" is not registered",
	"chart.runtime.boxPlot.truncated": "Data truncated to {max} groups (original: {total})",
	"chart.runtime.candlestick.truncated": "Showing first {max} candles (total: {total})",
	"chart.runtime.bar.hiddenPoints": "{count} data point(s) with no values hidden",
	"chart.runtime.waterfall.increase": "Increase",
	"chart.runtime.waterfall.decrease": "Decrease",
	"chart.runtime.waterfall.total": "Total",
	"chart.runtime.tooltip.noData": "No data",
	"chart.runtime.tooltip.targetValue": "Target Value",
	"results.toolbar.refreshing": "Refreshing",
	"results.toolbar.refresh": "Refresh",
	"results.toolbar.refreshTitle": "Refresh data (Shift+click to bypass cache)",
	"results.toolbar.refreshingTitle": "Refreshing...",
	"results.toolbar.cacheBustTitle": "Click to refresh and bypass cache",
	"results.toolbar.clear": "Clear",
	"results.toolbar.clearFunnel": "Clear funnel",
	"results.toolbar.clearQuery": "Clear all query data",
	"results.toolbar.aiClose": "Close AI assistant",
	"results.toolbar.aiOpen": "Analyse with AI",
	"results.toolbar.shareTitle": "Share this analysis",
	"results.toolbar.shareCopied": "Link copied!",
	"results.toolbar.schemaHide": "Hide schema diagram",
	"results.toolbar.schemaShow": "Show schema diagram",
	"results.toolbar.debugHide": "Hide debug info",
	"results.toolbar.debugShow": "Show debug info",
	"results.toolbar.chartView": "Chart view",
	"results.toolbar.chartDisabled": "Add metrics to enable chart view",
	"results.toolbar.tableView": "Table view",
	"results.toolbar.mergedTableView": "Merged table view",
	"results.view.table": "Table",
	"results.warning.filterHint": "Consider adding filters to improve performance.",
	"results.debug.query": "Query:",
	"results.debug.queryAnalysis": "Query Analysis",
	"results.debug.copyMarkdownTitle": "Copy query, analysis, and SQL as markdown",
	"results.debug.copyAsMarkdown": "Copy as Markdown",
	"results.debug.analysisError": "Analysis unavailable due to error",
	"results.debug.analysisEmpty": "Add metrics to see analysis",
	"results.debug.cubeQuery": "Cube Query",
	"results.debug.cubeQueryExecuted": "Executed Query (with funnel filters)",
	"results.debug.funnelFilterHint": "This query includes an IN filter with binding key values from the previous step",
	"results.debug.noQuery": "No query",
	"results.debug.serverResponse": "Server Response",
	"results.debug.noResults": "No results yet",
	"results.debug.chartConfig": "Chart Config",
	"results.debug.displayConfig": "Display Config",
	"results.debug.generatedSql": "Generated SQL",
	"results.debug.loadingSql": "Loading SQL...",
	"results.debug.executionError": "Execution Error",
	"results.confirm.clearFunnel": "Clear Funnel",
	"results.confirm.clearQuery": "Clear Query",
	"results.confirm.clearFunnelMessage": "Are you sure you want to clear this funnel? This action cannot be undone.",
	"results.confirm.clearQueryMessage": "Are you sure you want to clear this query? This action cannot be undone.",
	"results.table.noData": "No data to display",
	"results.table.noDataHint": "Run a query to see table data",
	"results.flow.noData": "No flow data to display",
	"results.flow.noDataHint": "Configure flow analysis to see results",
	"results.flow.nodes": "Nodes ({count})",
	"results.flow.transitions": "Transitions ({count})",
	"results.flow.layer": "Layer",
	"results.flow.name": "Name",
	"results.flow.count": "Count",
	"results.flow.from": "From",
	"results.flow.to": "To",
	"results.debug.funnel.label": "Funnel Query",
	"results.debug.funnel.steps": "{count} steps",
	"results.debug.funnel.serverQuery": "Funnel Server Query",
	"results.debug.funnel.noQuery": "No funnel query configured",
	"results.debug.funnel.sqlPlaceholder": "Configure funnel binding key to generate SQL",
	"results.debug.funnel.stepsTitle": "Funnel Steps",
	"results.debug.flow.label": "Flow Query",
	"results.debug.flow.badge": "{before} before, {after} after",
	"results.debug.flow.serverQuery": "Flow Server Query",
	"results.debug.flow.noQuery": "No flow query configured",
	"results.debug.flow.sqlPlaceholder": "Configure flow to generate SQL",
	"results.debug.flow.configTitle": "Flow Configuration",
	"results.debug.flow.startingStep": "Starting Step:",
	"results.debug.flow.eventDimension": "Event Dimension:",
	"results.debug.flow.stepsBefore": "Steps Before:",
	"results.debug.flow.stepsAfter": "Steps After:",
	"results.debug.flow.notSet": "Not set",
	"results.debug.flow.responseTitle": "Server Response (Sankey Data)",
	"results.debug.retention.label": "Retention Query",
	"results.debug.retention.badge": "{segments} segment(s), {users} users",
	"results.debug.retention.serverQuery": "Retention Server Query",
	"results.debug.retention.configIncomplete": "Configuration Incomplete",
	"results.debug.retention.configHint": "Configure the retention analysis settings to generate a query.",
	"results.debug.retention.sqlPlaceholder": "Configure retention to generate SQL",
	"results.debug.retention.configTitle": "Retention Configuration",
	"results.debug.retention.summaryTitle": "Retention Summary",
	"results.debug.retention.retentionType": "Retention Type:",
	"results.debug.retention.periods": "Periods:",
	"results.debug.retention.granularity": "Granularity:",
	"results.debug.retention.segments": "Segments:",
	"results.debug.retention.avgPeriod1": "Avg Period 1:",
	"results.debug.retention.maxPeriod1": "Max Period 1:",
	"results.debug.retention.minPeriod1": "Min Period 1:",
	"results.debug.standard.sqlPlaceholder": "Add metrics to generate SQL",
	"flow.tabs.flow": "Flow",
	"flow.tabs.display": "Display",
	"flow.tabs.displayUnavailable": "Display options not available",
	"flow.tabs.displayTitle": "Display options",
	"flow.visualization.title": "Visualization",
	"flow.visualization.description": "Choose how to visualize the flow data. This affects how data is aggregated.",
	"flow.visualization.sankey": "Sankey",
	"flow.visualization.sankeyHint": "Paths can converge",
	"flow.visualization.sunburst": "Sunburst",
	"flow.visualization.sunburstHint": "Unique paths only",
	"flow.startingStep.title": "Starting Step",
	"flow.startingStep.description": "Define the anchor event from which paths will be explored in both directions.",
	"flow.startingStep.filterLabel": "Filter Conditions",
	"flow.depth.title": "Exploration Depth",
	"flow.depth.descriptionSankey": "How many steps to explore before and after the starting step.",
	"flow.depth.descriptionSunburst": "How many steps to explore after the starting step.",
	"flow.depth.stepsBefore": "Steps Before",
	"flow.depth.stepsBeforeNA": "(N/A)",
	"flow.depth.stepsAfter": "Steps After",
	"flow.depth.performanceWarning": "High step depth (4-5) may impact query performance on large datasets.",
	"flow.joinStrategy.title": "Join Strategy",
	"flow.joinStrategy.description": "Control how before/after steps are fetched. Switch to window if lateral is slower on your DB.",
	"flow.joinStrategy.auto": "Auto (prefer lateral if available)",
	"flow.joinStrategy.lateral": "Lateral (index seeks)",
	"flow.joinStrategy.window": "Window (ROW_NUMBER)",
	"retention.tabs.retention": "Retention",
	"retention.tabs.display": "Display",
	"retention.tabs.displayUnavailable": "Display options not available",
	"retention.tabs.displayTitle": "Display options",
	"retention.dateRange.title": "Date Range",
	"retention.dateRange.description": "Select the date range for cohort entry. Users who first appear within this range will be analyzed.",
	"retention.dateRange.label": "Date Range",
	"retention.dateRange.selectRange": "Select date range",
	"retention.dateRange.customRange": "Custom Range",
	"retention.dateRange.applyCustom": "Apply Custom Range",
	"retention.cohortFilter.title": "Cohort Filter",
	"retention.cohortFilter.description": "Define who enters the cohort. Users whose first event matches these filters within the date range are included.",
	"retention.returnFilter.title": "Return Filter",
	"retention.returnFilter.description": "Define what counts as a return. Events matching these filters in subsequent periods count as retention.",
	"retention.breakdown.title": "Breakdown",
	"retention.breakdown.description": "Optionally segment retention by dimensions (e.g., country, plan type).",
	"retention.settings.title": "Settings",
	"retention.settings.description": "Configure how retention is calculated and displayed.",
	"retention.settings.granularityLabel": "Period Granularity",
	"retention.settings.periodsLabel": "Number of Periods ({min}-{max})",
	"retention.settings.periodsWarning": "High period count may impact query performance.",
	"retention.settings.retentionTypeLabel": "Retention Type",
	"debug.explainPlan": "Explain Plan",
	"debug.explainRunning": "Running...",
	"debug.explainIncludeTiming": "Include timing",
	"debug.explainRunningAnalyze": "Running EXPLAIN ANALYZE...",
	"debug.explainRunningBasic": "Running EXPLAIN...",
	"debug.explainError": "Explain Error:",
	"debug.sequentialScans": "Sequential Scans Detected",
	"debug.indexesUsed": "{count} Index Used",
	"debug.indexesUsedPlural": "{count} Indexes Used",
	"debug.executionTime": "Execution: {time}ms",
	"debug.planningTime": "Planning: {time}ms",
	"debug.cost": "Cost: {cost}",
	"debug.indexes": "Indexes:",
	"debug.executionPlanTitle": "Execution Plan ({database})",
	"debug.aiAnalyzing": "Analyzing...",
	"debug.aiAnalysis": "AI Analysis",
	"debug.aiAnalysisError": "AI Analysis Error:",
	"explainAI.title": "AI Performance Analysis",
	"explainAI.assessment.good": "Good",
	"explainAI.assessment.warning": "Warning",
	"explainAI.assessment.critical": "Critical",
	"explainAI.summary": "Summary",
	"explainAI.queryAnalysis": "Query Analysis",
	"explainAI.issuesFound": "Issues Found ({count})",
	"explainAI.recommendations": "Recommendations ({count})",
	"explainAI.noRecommendations": "No specific recommendations. The query appears to be well-optimized.",
	"explainAI.expectedImpact": "Expected impact:",
	"explainAI.addToCube": "Add to {cubeName} cube:",
	"explainAI.modelLabel": "Model:",
	"explainAI.usingUserKey": "(using your API key)",
	"explainAI.copied": "Copied!",
	"explainAI.copy": "Copy",
	"explainAI.type.index": "INDEX",
	"explainAI.type.table": "TABLE",
	"explainAI.type.cube": "CUBE",
	"explainAI.type.general": "TIP",
	"errorBoundary.modeError": "Mode Error",
	"errorBoundary.modeErrorDescription": "There was a problem with the {mode} mode. This might be due to invalid configuration data.",
	"errorBoundary.showDetails": "Show error details",
	"errorBoundary.unknownError": "Unknown error",
	"errorBoundary.tryAgain": "Try Again",
	"errorBoundary.switchToQuery": "Switch to Query Mode",
	"funnel.tabs.steps": "Steps",
	"funnel.tabs.display": "Display",
	"funnel.tabs.displayUnavailable": "Display options not available",
	"funnel.tabs.displayTitle": "Display options",
	"funnel.steps.title": "Funnel Steps",
	"funnel.steps.emptyMessage": "No steps defined. Add at least 2 steps to create a funnel.",
	"funnel.steps.addFirst": "Add First Step",
	"funnel.steps.addStep": "Add Step",
	"funnel.steps.validationHint": "Add at least one more step to create a valid funnel",
	"funnel.step.removeTitle": "Remove step",
	"funnel.step.editNameTitle": "Click to edit name",
	"funnel.step.placeholder": "Step name",
	"funnel.step.timeWindow": "Time Window",
	"funnel.step.timeWindowHelp": "Max time from previous step to qualify",
	"funnel.step.filters": "{count} filter",
	"funnel.step.filtersPlural": "{count} filters",
	"funnel.step.within": "within {time}",
	"funnel.step.noFilters": "No filters configured",
	"funnel.config.configuration": "Configuration",
	"funnel.config.cube": "Cube",
	"funnel.config.cubeHelp": "Select a cube configured for funnel analysis",
	"funnel.config.cubePlaceholder": "Select event stream cube",
	"funnel.config.bindingKey": "Binding Key",
	"funnel.config.bindingKeyHelp": "Entity that connects steps (e.g., user ID, order ID)",
	"funnel.config.bindingKeyPlaceholder": "Select binding key",
	"funnel.config.selectCubeFirst": "Select cube first",
	"funnel.config.timeDimension": "Time Dimension",
	"funnel.config.timeDimensionHelp": "Timestamp field for step ordering",
	"funnel.config.timeDimensionPlaceholder": "Select time dimension",
	"funnel.config.noMatchingFields": "No matching fields found",
	"funnel.bindingKey.searchPlaceholder": "Search dimensions...",
	"funnel.bindingKey.noMatching": "No matching dimensions found",
	"funnel.bindingKey.helpText": "Select a dimension that identifies entities across funnel steps (e.g., user ID, order ID)",
	"funnel.bindingKey.clearTitle": "Clear binding key",
	"flow.config.configuration": "Configuration",
	"flow.config.cube": "Cube",
	"flow.config.cubeHelp": "Select a cube configured for flow analysis",
	"flow.config.cubePlaceholder": "Select event stream cube",
	"flow.config.bindingKey": "Binding Key",
	"flow.config.bindingKeyHelp": "Entity that links events together (e.g., user ID)",
	"flow.config.bindingKeyPlaceholder": "Select binding key",
	"flow.config.selectCubeFirst": "Select cube first",
	"flow.config.timeDimension": "Time Dimension",
	"flow.config.timeDimensionHelp": "Timestamp field for event ordering",
	"flow.config.timeDimensionPlaceholder": "Select time dimension",
	"flow.config.eventDimension": "Event Dimension",
	"flow.config.eventDimensionHelp": "Dimension that categorizes events (node labels in Sankey)",
	"flow.config.eventDimensionPlaceholder": "Select event dimension",
	"flow.config.noMatchingFields": "No matching fields found",
	"retention.config.configuration": "Configuration",
	"retention.config.cube": "Cube",
	"retention.config.cubeHelp": "Select the cube containing your user events",
	"retention.config.cubePlaceholder": "Select cube",
	"retention.config.bindingKey": "Binding Key",
	"retention.config.bindingKeyHelp": "Dimension that identifies entities across events (e.g., user ID, customer ID)",
	"retention.config.bindingKeyPlaceholder": "Select user identifier",
	"retention.config.selectCubeFirst": "Select cube first",
	"retention.config.timestamp": "Timestamp",
	"retention.config.timestampHelp": "Timestamp field for cohort entry and activity",
	"retention.config.timestampPlaceholder": "Select timestamp",
	"retention.config.noMatchingFields": "No matching fields found",
	"retention.config.searchPlaceholder": "Search...",
	"display.showLegend": "Show Legend",
	"display.showGrid": "Show Grid",
	"display.showTooltip": "Show Tooltip",
	"display.stacked": "Stacked",
	"display.hideHeader": "Hide Header",
	"fieldSearch.aria.closeDialog": "Close dialog",
	"fieldSearch.aria.filterByCube": "Filter by cube",
	"fieldSearch.aria.cubeCategories": "Cube categories",
	"fieldSearch.aria.availableFields": "Available fields",
	"chart.dropZone.required": "This field is required",
	"common.actions.apply": "Apply",
	"common.actions.done": "Done",
	"common.actions.update": "Update",
	"common.actions.retry": "Retry",
	"common.actions.exit": "Exit",
	"common.actions.selectAll": "Select All",
	"common.saving": "Saving...",
	"common.labels.title": "Title",
	"dashboardFilter.editFilter": "Edit Filter",
	"dashboardFilter.filterLabel": "Filter Label",
	"dashboardFilter.enterFilterLabel": "Enter filter label",
	"dashboardFilter.universalTimeFilter": "Universal Time Filter",
	"dashboardFilter.universalTimeDescription": "This filter applies to all time dimensions in mapped portlets. Users can select the date range when viewing the dashboard.",
	"dashboardFilter.field": "Field",
	"dashboardFilter.showDashboardFields": "Show dashboard fields only",
	"dashboardFilter.showAllFields": "Show all fields",
	"dashboardFilter.dashboard": "Dashboard",
	"dashboardFilter.all": "All",
	"dashboardFilter.clickToSelectField": "Click to select a field",
	"dashboardFilter.operator": "Operator",
	"dashboardFilter.defaultValue": "Default Value",
	"dashboardFilter.deleteFilter": "Delete Filter",
	"dashboardFilter.noValueRequired": "No value required",
	"dashboardFilter.to": "to",
	"dashboardFilter.selectValue": "Select value...",
	"dashboardFilter.search": "Search...",
	"dashboardFilter.errorPrefix": "Error: ",
	"dashboardFilter.noValuesFound": "No values found",
	"dashboardFilter.enterValue": "Enter value...",
	"dashboardFilter.enterNumber": "Enter number",
	"dashboardFilter.min": "Min",
	"dashboardFilter.max": "Max",
	"dashboardFilter.filterLabelRequired": "Filter label is required",
	"dashboardFilter.selectFieldRequired": "Please select a field for the filter",
	"dashboardFilter.notSet": "(not set)",
	"dashboardFilter.clickToConfigure": "Click to configure",
	"dashboardFilter.customDate.startDate": "Start Date",
	"dashboardFilter.customDate.endDate": "End Date",
	"dashboardFilter.customDate.sinceDate": "Since Date",
	"dashboardFilter.customDate.fromSelectedToToday": "From selected date to today",
	"dashboardFilter.customDate.number": "Number",
	"dashboardFilter.customDate.unit": "Unit",
	"dashboardFilter.customDate.lastNPreview": "Last {number} {unit}",
	"dashboardFilter.editMode.filters": "Filters",
	"dashboardFilter.editMode.noFilters": "No filters configured. Click \"Add\" to create one.",
	"dashboardFilter.editMode.dateRange": "Date Range",
	"dashboardFilter.editMode.filter": "Filter",
	"dashboardFilter.editMode.editFilter": "Edit filter",
	"dashboardFilter.editMode.removeFilter": "Remove filter",
	"dashboardFilter.filterValue.editValue": "Edit value",
	"dashboardFilter.readOnly.filters": "Filters",
	"filter.shared.fieldsInQuery": "Fields in Query ({count})",
	"filter.shared.allAvailableFields": "All Available Fields ({count})",
	"filter.shared.noFieldsMatch": "No fields found matching \"{searchTerm}\"",
	"filter.shared.searchFields": "Search fields...",
	"filter.shared.selectField": "Select field...",
	"filter.shared.schemaNotLoaded": "Schema not loaded",
	"filter.shared.group.addFilter": "Add Filter",
	"filter.shared.group.addAndGroup": "Add AND Group",
	"filter.shared.group.addOrGroup": "Add OR Group",
	"filter.shared.group.addCondition": "Add condition",
	"filter.shared.group.noConditions": "No conditions in this group.",
	"filter.shared.group.addFilterLink": "Add a filter",
	"filter.shared.builder.filters": "Filters ({count})",
	"filter.shared.builder.clearAll": "Clear all",
	"filter.shared.builder.addFilter": "Add Filter",
	"filter.shared.dateRange.title": "Date Ranges ({count})",
	"filter.shared.dateRange.clearAll": "Clear all",
	"filter.shared.dateRange.addDateRange": "Add Date Range",
	"filter.shared.dateRange.allHaveDateRanges": "All time dimensions already have date ranges",
	"filter.shared.valueSelector.noValueRequired": "No value required",
	"filter.shared.valueSelector.to": "to",
	"filter.shared.valueSelector.min": "Min",
	"filter.shared.valueSelector.max": "Max",
	"filter.shared.valueSelector.enterNumber": "Enter number",
	"filter.shared.valueSelector.loadingValues": "Loading values...",
	"filter.shared.valueSelector.selectValue": "Select value...",
	"filter.shared.valueSelector.searchValues": "Search values...",
	"filter.shared.valueSelector.searching": "Searching...",
	"filter.shared.valueSelector.errorLoading": "Error loading values: {error}",
	"filter.shared.valueSelector.noMatchingValues": "No matching values",
	"filter.shared.valueSelector.noValuesAvailable": "No values available",
	"filter.shared.valueSelector.enterValue": "Enter {type} value",
	"dashboard.noPortlets": "No Portlets",
	"dashboard.noPortletsDescription": "Add your first portlet to start visualizing your data",
	"dashboard.addText": "Add Text",
	"dashboard.addPortlet": "Add Portlet",
	"dashboard.finishEditing": "Finish Editing",
	"dashboard.edit": "Edit",
	"dashboard.grid": "Grid",
	"dashboard.rows": "Rows",
	"dashboard.desktopRequired": "Desktop view required for editing",
	"dashboard.editModeHint": "Drag • Resize • Auto-save",
	"dashboard.filterSelectionMode": "Filter Selection Mode - Click portlets to toggle '{filterLabel}'",
	"dashboard.filterSelectionEscHint": "• Press Enter or Esc to save",
	"dashboard.filterFieldChipHint": "Click to change which field this filter applies to for this portlet",
	"dashboard.editPortlet": "Edit Portlet",
	"dashboard.addNewPortlet": "Add New Portlet",
	"dashboard.updatePortlet": "Update Portlet",
	"dashboard.deletePortlet": "Delete Portlet",
	"dashboard.deletePortletConfirm": "Are you sure you want to delete",
	"dashboard.deletePortletSuffix": "? This action cannot be undone.",
	"dashboard.thisPortlet": "this portlet",
	"dashboard.portlet.action.edit": "Edit portlet",
	"dashboard.portlet.action.duplicate": "Duplicate portlet",
	"dashboard.portlet.action.delete": "Delete portlet",
	"dashboard.portlet.action.refresh": "Refresh portlet",
	"dashboard.portlet.action.drag": "Drag portlet",
	"dashboard.portlet.action.filterConfig": "Configure dashboard filters",
	"dashboard.portlet.action.filterConfigActive": "Configure dashboard filters ({count} active)",
	"dashboard.group.rename": "Rename group",
	"dashboard.group.drag": "Drag group",
	"dashboard.group.titlePlaceholder": "Group title",
	"dashboard.group.ungroup": "Ungroup",
	"dashboard.group.delete": "Delete group",
	"dashboard.group.deleteTitle": "Delete Group",
	"dashboard.group.deleteConfirm": "Are you sure you want to delete this group and all {count} portlets inside it? This action cannot be undone.",
	"dashboard.editModal.dashboardName": "Dashboard Name",
	"dashboard.editModal.enterDashboardName": "Enter dashboard name...",
	"dashboard.editModal.descriptionOptional": "Description (optional)",
	"dashboard.editModal.enterDescription": "Enter description...",
	"portlet.configRequired": "Configuration Required",
	"portlet.copyToClipboard": "Copy chart to clipboard",
	"portlet.copied": "Copied!",
	"portlet.downloadXlsx": "Download data as XLSX",
	"portlet.exporting": "Exporting...",
	"portlet.configRequiredHint": "Please configure this chart",
	"portlet.queryError": "Query Error",
	"portlet.queryWithFilters": "Query (with filters applied)",
	"portlet.chartConfig": "Chart Config",
	"portlet.noDataAvailable": "No data available",
	"portlet.noDataDrilled": "No data points to display for the current filter",
	"portlet.invalidQuery": "Invalid query or no results",
	"portlet.unsupportedChartType": "Unsupported chart type",
	"portlet.unableToRender": "Unable to render chart",
	"portlet.droppedMembers": "Hidden — no longer in the model: {members}",
	"portlet.enterTitle": "Enter portlet title...",
	"portlet.enterPortletTitle": "Please enter a title for the portlet.",
	"portlet.configureQuery": "Please configure a query before saving.",
	"portlet.configureFlow": "Please configure the flow analysis (binding key, time dimension, event dimension, and starting step filter).",
	"portlet.configureRetention": "Please configure the retention analysis (binding key, time dimension, and date range).",
	"portlet.configureFunnel": "Please add at least two funnel steps.",
	"portlet.addMetricOrBreakdown": "Please add at least one metric or breakdown to your query.",
	"portlet.filterConfig.title": "Configure Dashboard Filters",
	"portlet.filterConfig.subtitle": "Choose which dashboard filters apply to \"{portletTitle}\"",
	"portlet.filterConfig.noFilters": "No dashboard filters available",
	"portlet.filterConfig.noFiltersHint": "Add filters at the dashboard level first",
	"portlet.filterConfig.availableFilters": "Available Filters",
	"portlet.filterConfig.selectedCount": "{selected} of {total} selected",
	"portlet.filterConfig.applied": "Applied",
	"portlet.filterConfig.noValue": "no value",
	"portlet.filterConfig.complexFilter": "Complex filter",
	"portlet.filterConfig.groupFilter": "{type} group with {count} filter",
	"portlet.filterConfig.groupFilterPlural": "{type} group with {count} filters",
	"portlet.filterConfig.applyFilters": "Apply Filters",
	"portlet.filterConfig.applyToField": "Apply to field",
	"portlet.filterConfig.applyToFieldDefault": "Default ({field})",
	"portlet.filterConfig.mappedTo": "Mapped to {field}",
	"portlet.filterConfig.mappedFieldMissing": "The mapped field \"{field}\" is no longer available in the schema",
	"textPortlet.editText": "Edit Text",
	"textPortlet.addText": "Add Text",
	"textPortlet.markdownContent": "Markdown Content",
	"textPortlet.markdownHint": "Supports headers (#), bold (**text**), italic (*text*), links ([text](url)), lists (- item), and horizontal rules (---).",
	"textPortlet.preview": "Preview",
	"debug.title": "Chart Debug Information",
	"debug.chartType": "Chart Type",
	"debug.fieldAnalysis": "Field Analysis",
	"debug.chartConfig": "Chart Config",
	"debug.displayConfig": "Display Config",
	"debug.queryObject": "Query Object",
	"debug.dataSample": "Data Sample (first 3 rows)",
	"debug.cacheStatus": "Cache Status",
	"debug.cacheHit": "Cache Hit",
	"debug.cachedAt": "Cached At:",
	"debug.ttl": "TTL:",
	"debug.ttlRemaining": "TTL Remaining:",
	"debug.freshQuery": "Fresh Query",
	"debug.notFromCache": "Result not served from cache",
	"debug.escToClose": "Press",
	"debug.escKey": "ESC",
	"debug.toClose": "to close",
	"debug.tooltip": "Debug chart configuration",
	"error.unableToRender": "Unable to render chart",
	"error.unableToRenderNamed": "Unable to render {title}",
	"error.renderDescription": "There was an error rendering this chart component. The error details are shown below.",
	"error.errorLabel": "Error:",
	"error.typeLabel": "Type:",
	"error.portletConfig": "Portlet Configuration",
	"error.cubeQuery": "Cube Query",
	"error.componentStack": "Component Stack",
	"error.tryAgain": "Try Again",
	"drill.back": "Back",
	"drill.goBackOneLevel": "Go back one level",
	"drill.returnToTop": "Return to top level",
	"drill.navigateTo": "Navigate to {label}",
	"drill.empty": "(empty)",
	"analyticsPage.title": "Analytics Page - Coming in Phase 4",
	"dataHistogram.average": "Average of {count} values",
	"dataHistogram.valuesInRange": "{count} values in this range",
	"mcp.status.connecting": "Connecting...",
	"mcp.status.loading": "Loading...",
	"mcp.status.waiting": "Waiting for query results...",
	"mcp.error.connectionLabel": "Connection error:",
	"mcp.error.errorLabel": "Error:",
	"mcp.error.noTextContent": "No text content in result",
	"mcp.error.invalidResultFormat": "Invalid result format: missing data array",
	"mcp.error.parseFailed": "Failed to parse result: {message}",
	"mcp.error.queryFailed": "Query failed: {message}",
	"mcp.footer.rows": "{count} row",
	"mcp.footer.rowsPlural": "{count} rows",
	"mcp.footer.measures": "{count} measure",
	"mcp.footer.measuresPlural": "{count} measures",
	"mcp.footer.dimensions": "{count} dimension",
	"mcp.footer.dimensionsPlural": "{count} dimensions",
	"chart.option.kpiLayout.label": "Layout",
	"chart.option.kpiLayout.description": "Compact uses a fixed type size so several KPIs line up as a metric strip; auto scales the value to fill the portlet",
	"chart.option.kpiLayout.auto": "Auto",
	"chart.option.kpiLayout.compact": "Compact",
	"chart.option.showBaseline.label": "Show baseline",
	"chart.option.showBaseline.description": "Show the previous and current values as a before and after pair",
	"chart.runtime.kpiVsTarget": "vs {target}",
	"chart.runtime.kpiExcludesLastPeriod": "Excludes last {period}",
	"chart.runtime.kpiExcludesIncompletePeriod": "Excludes current incomplete {period}",
	"chart.runtime.kpiPeriodFallback": "period",
	"chart.runtime.noDataShort": "No data",
	"chart.option.showSummary.label": "Summary header",
	"chart.option.showSummary.description": "Show each series' latest value above the chart, with its change since the start of the window on time-based charts",
	"chart.runtime.summarySincePeriodStart": "since start of period",
	"chart.proportionBar.label": "Proportion Bar",
	"chart.proportionBar.description": "Show a part-to-whole breakdown as a single stacked horizontal bar",
	"chart.proportionBar.useCase": "Perfect for work mix, budget splits or any share breakdown where comparing proportions matters more than exact values — flatter and easier to read than a pie chart",
	"chart.proportionBar.dropZone.xAxis.empty": "Drop a dimension here",
	"chart.proportionBar.dropZone.yAxis.empty": "Drop a measure here",
	"chart.proportionBar.validation.dimensionRequired": "A dimension is required for proportion bar charts",
	"chart.proportionBar.validation.measureRequired": "A measure is required for proportion bar charts",
	"chart.configText.category": "Category",
	"chart.configText.dimension_to_split_the_bar_into_segments": "Dimension to split the bar into segments",
	"chart.configText.measure_that_determines_each_segments_share": "Measure that determines each segment's share",
	"chart.option.showPercentages.label": "Show percentages",
	"chart.option.showPercentages.description": "Show each segment's share as a percentage beneath the bar",
	"chart.option.sortSegments.label": "Sort segments",
	"chart.option.sortSegments.description": "Order segments largest first rather than keeping the query order",
	"chart.option.proportionBarLabels.description": "Show the category name above each segment's share",
	"chart.option.proportionBarDecimals.description": "Number of decimal places shown on each percentage",
	"chart.runtime.noDataHint.proportionBar": "No data points to break down",
	"chart.runtime.configErrorHint.proportionBar": "Add one dimension and one measure to show a breakdown",
	"chart.runtime.noValidDataHint.proportionBar": "All values are zero, negative or invalid",
	"chart.option.proportionBarLabels.label": "Show labels",
	"chart.runtime.summarySince": "since {period}",
	"chart.option.showPoints.label": "Show data points",
	"chart.option.showPoints.description": "Draw a marker at every data point. Turn off for dense series, where the markers obscure the line",
	"chart.gauge.thresholds.from": "Band starts at",
	"chart.gauge.thresholds.colour": "Band colour",
	"chart.gauge.thresholds.add": "Add band",
	"chart.gauge.thresholds.remove": "Remove band",
	"dashboardFilter.presets.today": "Today",
	"dashboardFilter.presets.yesterday": "Yesterday",
	"dashboardFilter.presets.7d": "7D",
	"dashboardFilter.presets.30d": "30D",
	"dashboardFilter.presets.3m": "3M",
	"dashboardFilter.presets.6m": "6M",
	"dashboardFilter.presets.12m": "12M",
	"dashboardFilter.xtd.trigger": "XTD",
	"dashboardFilter.xtd.wtd": "Week to Date",
	"dashboardFilter.xtd.mtd": "Month to Date",
	"dashboardFilter.xtd.qtd": "Quarter to Date",
	"dashboardFilter.xtd.ytd": "Year to Date",
	"dashboardFilter.customTabs.fixed": "Fixed",
	"dashboardFilter.customTabs.since": "Since",
	"dashboardFilter.customTabs.last": "Last",
	"dashboardFilter.units.days": "Days",
	"dashboardFilter.units.weeks": "Weeks",
	"dashboardFilter.units.months": "Months",
	"dashboardFilter.units.quarters": "Quarters",
	"dashboardFilter.units.years": "Years",
	"analysis.breakdownComparison.vsPrior": "vs prior",
	"analysis.breakdownComparison.alreadyEnabled": "Another time dimension already has comparison enabled",
	"analysis.breakdownComparison.clickToDisable": "Click to disable comparison",
	"analysis.breakdownComparison.compareWithPrevious": "Compare with previous period"
}, Ge = We;
function Ke(e) {
	return Object.prototype.hasOwnProperty.call(We, e);
}
function C(e, t) {
	let n = Ge[e];
	return n ? t ? n.replace(/\{(\w+)\}/g, (e, n) => {
		let r = t[n];
		return r === void 0 ? `{${n}}` : String(r);
	}) : n : e;
}
//#endregion
//#region src/server/query-modes.ts
function qe(e) {
	return e.timeDimensions?.some((e) => e.compareDateRange && e.compareDateRange.length >= 2) ?? !1;
}
function Je(e) {
	return e.funnel != null && (e.funnel.steps?.length ?? 0) >= 2;
}
function Ye(e) {
	return e.flow != null && e.flow.startingStep !== void 0 && e.flow.eventDimension !== void 0;
}
function Xe(e) {
	return e.retention != null && e.retention.timeDimension != null && e.retention.bindingKey != null;
}
function Ze(e) {
	let t = [];
	return qe(e) && t.push("comparison"), Je(e) && t.push("funnel"), Ye(e) && t.push("flow"), Xe(e) && t.push("retention"), t;
}
//#endregion
//#region src/server/query-validator.ts
var Qe = class extends Error {
	issues;
	constructor(e, t) {
		super(e), this.name = "QueryValidationError", this.issues = t;
	}
}, $e = class {
	messages = [];
	issues = [];
	push(e) {
		this.messages.push(e);
	}
	pushMissingMember(e, t, n) {
		this.messages.push(n), this.issues.push({
			source: e,
			member: t,
			message: n
		});
	}
};
function et(e) {
	return Ze(e);
}
function tt(e, t) {
	let n = new $e(), r = et(t);
	if (r.length > 1) return n.push(C("server.validation.query.multipleQueryModes", { modes: r.join(", ") })), {
		isValid: !1,
		errors: n.messages,
		issues: n.issues
	};
	if (r.length === 1 && r[0] !== "comparison") return nt(r[0], t, e, n), {
		isValid: n.messages.length === 0,
		errors: n.messages,
		issues: n.issues
	};
	let i = /* @__PURE__ */ new Set();
	if (st(t, e, n, i), ct(t, e, n, i), lt(t, e, n, i), t.filters) for (let r of t.filters) ht(r, e, n, i);
	return i.size === 0 && n.push(C("server.validation.query.mustReferenceAtLeastOneCube")), t.ungrouped && ft(t, e, n, i), {
		isValid: n.messages.length === 0,
		errors: n.messages,
		issues: n.issues
	};
}
function nt(e, t, n, r) {
	e !== "comparison" && (e === "funnel" ? rt(t, n, r) : e === "flow" ? it(t, n, r) : e === "retention" && at(t, n, r));
}
function rt(e, t, n) {
	let r = e.funnel.bindingKey;
	if (typeof r == "string") {
		let [e] = r.split(".");
		e && !t.has(e) && n.push(C("server.validation.query.funnelBindingKeyCubeNotFound", { cubeName: e }));
	} else if (Array.isArray(r)) for (let e of r) t.has(e.cube) || n.push(C("server.validation.query.funnelBindingKeyCubeNotFound", { cubeName: e.cube }));
}
function it(e, t, n) {
	let r = e.flow.bindingKey;
	if (typeof r == "string") {
		let [e] = r.split(".");
		e && !t.has(e) && n.push(C("server.validation.query.flowBindingKeyCubeNotFound", { cubeName: e }));
	}
}
function at(e, t, n) {
	let r = e.retention, i = gt(r.timeDimension);
	i && !t.has(i) && n.push(C("server.validation.query.retentionCubeNotFound", { cubeName: i }));
	let a = r.bindingKey;
	if (typeof a == "string") {
		let [e] = a.split(".");
		e && !t.has(e) && n.push(C("server.validation.query.retentionBindingKeyCubeNotFound", { cubeName: e }));
	} else if (Array.isArray(a)) for (let e of a) t.has(e.cube) || n.push(C("server.validation.query.retentionBindingKeyCubeNotFound", { cubeName: e.cube }));
	if (r.breakdownDimensions && Array.isArray(r.breakdownDimensions)) for (let e of r.breakdownDimensions) {
		let [r] = e.split(".");
		r && !t.has(r) && n.push(C("server.validation.query.retentionBreakdownCubeNotFound", { cubeName: r }));
	}
}
function ot(e, t, n) {
	return e === t ? `. Did you mean one of: ${n.slice(0, 5).map((e) => `'${t}.${e}'`).join(", ")}?` : "";
}
function st(e, t, n, r) {
	if (e.measures) for (let i of e.measures) {
		let [e, a] = i.split(".");
		if (!e || !a) {
			n.push(C("server.validation.query.invalidMeasureFormat", { measure: i }));
			continue;
		}
		r.add(e);
		let o = t.get(e);
		if (!o) {
			n.pushMissingMember("measure", i, C("server.validation.query.cubeNotFoundForMeasure", {
				cubeName: e,
				measure: i
			}));
			continue;
		}
		if (!o.measures[a]) {
			let t = ot(a, e, Object.keys(o.measures));
			n.pushMissingMember("measure", i, C("server.validation.query.measureNotFound", {
				fieldName: a,
				cubeName: e,
				hint: t
			}));
		}
	}
}
function ct(e, t, n, r) {
	if (e.dimensions) for (let i of e.dimensions) {
		let [e, a] = i.split(".");
		if (!e || !a) {
			n.push(C("server.validation.query.invalidDimensionFormat", { dimension: i }));
			continue;
		}
		r.add(e);
		let o = t.get(e);
		if (!o) {
			n.pushMissingMember("dimension", i, C("server.validation.query.cubeNotFoundForDimension", {
				cubeName: e,
				dimension: i
			}));
			continue;
		}
		if (!o.dimensions[a]) {
			let t = ot(a, e, Object.keys(o.dimensions));
			n.pushMissingMember("dimension", i, C("server.validation.query.dimensionNotFound", {
				fieldName: a,
				cubeName: e,
				hint: t
			}));
		}
	}
}
function lt(e, t, n, r) {
	if (e.timeDimensions) for (let i of e.timeDimensions) {
		let [e, a] = i.dimension.split(".");
		if (!e || !a) {
			n.push(C("server.validation.query.invalidTimeDimensionFormat", { dimension: i.dimension }));
			continue;
		}
		r.add(e);
		let o = t.get(e);
		if (!o) {
			n.pushMissingMember("timeDimension", i.dimension, C("server.validation.query.cubeNotFoundForTimeDimension", {
				cubeName: e,
				dimension: i.dimension
			}));
			continue;
		}
		o.dimensions[a] || n.pushMissingMember("timeDimension", i.dimension, C("server.validation.query.timeDimensionNotFound", {
			fieldName: a,
			cubeName: e
		}));
	}
}
var ut = /* @__PURE__ */ new Set([
	"count",
	"countDistinct",
	"countDistinctApprox",
	"calculated",
	"stddev",
	"stddevSamp",
	"variance",
	"varianceSamp",
	"median",
	"p95",
	"p99",
	"percentile",
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
]), dt = [
	"sum",
	"avg",
	"min",
	"max",
	"number"
];
function ft(e, t, n, r) {
	e.dimensions && e.dimensions.length > 0 || e.timeDimensions && e.timeDimensions.length > 0 || n.push(C("server.validation.query.ungroupedRequiresDimension")), e.funnel && n.push(C("server.validation.query.ungroupedIncompatibleFunnel")), e.flow && n.push(C("server.validation.query.ungroupedIncompatibleFlow")), e.retention && n.push(C("server.validation.query.ungroupedIncompatibleRetention")), e.timeDimensions?.some((e) => e.compareDateRange && e.compareDateRange.length > 0) && n.push(C("server.validation.query.ungroupedIncompatibleCompareDateRange")), e.timeDimensions?.some((e) => e.fillMissingDates === !0) && n.push(C("server.validation.query.ungroupedIncompatibleFillMissingDates")), pt(e, t, n), mt(t, n, r);
}
function pt(e, t, n) {
	if (e.measures) for (let r of e.measures) {
		let [e, i] = r.split("."), a = t.get(e)?.measures[i];
		a && (ut.has(a.type) && n.push(`Measure '${r}' has type '${a.type}' which is incompatible with ungrouped queries. Only ${dt.join(", ")} types are allowed.`), a.filters && a.filters.length > 0 && n.push(`Measure '${r}' has filters which are incompatible with ungrouped queries (measure filters require aggregation)`));
	}
}
function mt(e, t, n) {
	for (let r of n) {
		let i = e.get(r);
		if (i?.joins) for (let [a, o] of Object.entries(i.joins)) {
			if (o.relationship !== "hasMany") continue;
			let i = Fe(o.targetCube, e);
			i && n.has(i.name) && t.push(`Ungrouped queries are incompatible with hasMany relationships (${r} → ${a} is hasMany)`);
		}
	}
}
function ht(e, t, n, r) {
	if ("and" in e || "or" in e) {
		let i = e.and || e.or || [];
		for (let e of i) ht(e, t, n, r);
		return;
	}
	if (!("member" in e)) {
		n.push(C("server.validation.query.filterMustHaveMember"));
		return;
	}
	let [i, a] = e.member.split(".");
	if (!i || !a) {
		n.push(C("server.validation.query.invalidFilterMemberFormat", { member: e.member }));
		return;
	}
	r.add(i);
	let o = t.get(i);
	if (!o) {
		n.pushMissingMember("filter", e.member, C("server.validation.query.cubeNotFoundForFilter", {
			cubeName: i,
			member: e.member
		}));
		return;
	}
	if (!o.dimensions[a] && !o.measures[a]) {
		let t = a === i ? `. Did you mean one of: ${[...Object.keys(o.dimensions), ...Object.keys(o.measures)].slice(0, 5).map((e) => `'${i}.${e}'`).join(", ")}?` : "";
		n.pushMissingMember("filter", e.member, C("server.validation.query.filterFieldNotFound", {
			fieldName: a,
			cubeName: i,
			hint: t
		}));
	}
}
function gt(e) {
	if (typeof e == "string") {
		let [t] = e.split(".");
		return t || null;
	}
	return e.cube;
}
//#endregion
//#region node_modules/sql-formatter/dist/esm/expandPhrases.js
var w = (e) => e.flatMap(_t), _t = (e) => T(yt(e)).map(vt), vt = (e) => e.replace(/ +/g, " ").trim(), yt = (e) => ({
	type: "mandatory_block",
	items: bt(e, 0)[0]
}), bt = (e, t, n) => {
	let r = [];
	for (; e[t];) {
		let [i, a] = xt(e, t);
		if (r.push(i), t = a, e[t] === "|") t++;
		else if (e[t] === "}" || e[t] === "]") {
			if (n !== e[t]) throw Error(`Unbalanced parenthesis in: ${e}`);
			return t++, [r, t];
		} else if (t === e.length) {
			if (n) throw Error(`Unbalanced parenthesis in: ${e}`);
			return [r, t];
		} else throw Error(`Unexpected "${e[t]}"`);
	}
	return [r, t];
}, xt = (e, t) => {
	let n = [];
	for (;;) {
		let [r, i] = St(e, t);
		if (r) n.push(r), t = i;
		else break;
	}
	return n.length === 1 ? [n[0], t] : [{
		type: "concatenation",
		items: n
	}, t];
}, St = (e, t) => {
	if (e[t] === "{") return Ct(e, t + 1);
	if (e[t] === "[") return wt(e, t + 1);
	{
		let n = "";
		for (; e[t] && /[A-Za-z0-9_ ]/.test(e[t]);) n += e[t], t++;
		return [n, t];
	}
}, Ct = (e, t) => {
	let [n, r] = bt(e, t, "}");
	return [{
		type: "mandatory_block",
		items: n
	}, r];
}, wt = (e, t) => {
	let [n, r] = bt(e, t, "]");
	return [{
		type: "optional_block",
		items: n
	}, r];
}, T = (e) => {
	if (typeof e == "string") return [e];
	if (e.type === "concatenation") return e.items.map(T).reduce(Tt, [""]);
	if (e.type === "mandatory_block") return e.items.flatMap(T);
	if (e.type === "optional_block") return ["", ...e.items.flatMap(T)];
	throw Error(`Unknown node type: ${e}`);
}, Tt = (e, t) => {
	let n = [];
	for (let r of e) for (let e of t) n.push(r + e);
	return n;
}, E;
(function(e) {
	e.QUOTED_IDENTIFIER = "QUOTED_IDENTIFIER", e.IDENTIFIER = "IDENTIFIER", e.STRING = "STRING", e.VARIABLE = "VARIABLE", e.RESERVED_DATA_TYPE = "RESERVED_DATA_TYPE", e.RESERVED_PARAMETERIZED_DATA_TYPE = "RESERVED_PARAMETERIZED_DATA_TYPE", e.RESERVED_KEYWORD = "RESERVED_KEYWORD", e.RESERVED_FUNCTION_NAME = "RESERVED_FUNCTION_NAME", e.RESERVED_KEYWORD_PHRASE = "RESERVED_KEYWORD_PHRASE", e.RESERVED_DATA_TYPE_PHRASE = "RESERVED_DATA_TYPE_PHRASE", e.RESERVED_SET_OPERATION = "RESERVED_SET_OPERATION", e.RESERVED_CLAUSE = "RESERVED_CLAUSE", e.RESERVED_SELECT = "RESERVED_SELECT", e.RESERVED_JOIN = "RESERVED_JOIN", e.ARRAY_IDENTIFIER = "ARRAY_IDENTIFIER", e.ARRAY_KEYWORD = "ARRAY_KEYWORD", e.CASE = "CASE", e.END = "END", e.WHEN = "WHEN", e.ELSE = "ELSE", e.THEN = "THEN", e.LIMIT = "LIMIT", e.BETWEEN = "BETWEEN", e.AND = "AND", e.OR = "OR", e.XOR = "XOR", e.OPERATOR = "OPERATOR", e.COMMA = "COMMA", e.ASTERISK = "ASTERISK", e.PROPERTY_ACCESS_OPERATOR = "PROPERTY_ACCESS_OPERATOR", e.OPEN_PAREN = "OPEN_PAREN", e.CLOSE_PAREN = "CLOSE_PAREN", e.LINE_COMMENT = "LINE_COMMENT", e.BLOCK_COMMENT = "BLOCK_COMMENT", e.DISABLE_COMMENT = "DISABLE_COMMENT", e.NUMBER = "NUMBER", e.NAMED_PARAMETER = "NAMED_PARAMETER", e.QUOTED_PARAMETER = "QUOTED_PARAMETER", e.NUMBERED_PARAMETER = "NUMBERED_PARAMETER", e.POSITIONAL_PARAMETER = "POSITIONAL_PARAMETER", e.CUSTOM_PARAMETER = "CUSTOM_PARAMETER", e.DELIMITER = "DELIMITER", e.EOF = "EOF";
})(E = E ||= {});
var Et = (e) => ({
	type: E.EOF,
	raw: "«EOF»",
	text: "«EOF»",
	start: e
}), D = Et(Infinity), O = (e) => (t) => t.type === e.type && t.text === e.text, k = {
	ARRAY: O({
		text: "ARRAY",
		type: E.RESERVED_DATA_TYPE
	}),
	BY: O({
		text: "BY",
		type: E.RESERVED_KEYWORD
	}),
	SET: O({
		text: "SET",
		type: E.RESERVED_CLAUSE
	}),
	STRUCT: O({
		text: "STRUCT",
		type: E.RESERVED_DATA_TYPE
	}),
	WINDOW: O({
		text: "WINDOW",
		type: E.RESERVED_CLAUSE
	}),
	VALUES: O({
		text: "VALUES",
		type: E.RESERVED_CLAUSE
	})
}, Dt = (e) => e === E.RESERVED_DATA_TYPE || e === E.RESERVED_KEYWORD || e === E.RESERVED_FUNCTION_NAME || e === E.RESERVED_KEYWORD_PHRASE || e === E.RESERVED_DATA_TYPE_PHRASE || e === E.RESERVED_CLAUSE || e === E.RESERVED_SELECT || e === E.RESERVED_SET_OPERATION || e === E.RESERVED_JOIN || e === E.ARRAY_KEYWORD || e === E.CASE || e === E.END || e === E.WHEN || e === E.ELSE || e === E.THEN || e === E.LIMIT || e === E.BETWEEN || e === E.AND || e === E.OR || e === E.XOR, Ot = (e) => e === E.AND || e === E.OR || e === E.XOR, kt = /* @__PURE__ */ "KEYS.NEW_KEYSET,KEYS.ADD_KEY_FROM_RAW_BYTES,AEAD.DECRYPT_BYTES,AEAD.DECRYPT_STRING,AEAD.ENCRYPT,KEYS.KEYSET_CHAIN,KEYS.KEYSET_FROM_JSON,KEYS.KEYSET_TO_JSON,KEYS.ROTATE_KEYSET,KEYS.KEYSET_LENGTH,ANY_VALUE,ARRAY_AGG,AVG,CORR,COUNT,COUNTIF,COVAR_POP,COVAR_SAMP,MAX,MIN,ST_CLUSTERDBSCAN,STDDEV_POP,STDDEV_SAMP,STRING_AGG,SUM,VAR_POP,VAR_SAMP,ANY_VALUE,ARRAY_AGG,ARRAY_CONCAT_AGG,AVG,BIT_AND,BIT_OR,BIT_XOR,COUNT,COUNTIF,LOGICAL_AND,LOGICAL_OR,MAX,MIN,STRING_AGG,SUM,APPROX_COUNT_DISTINCT,APPROX_QUANTILES,APPROX_TOP_COUNT,APPROX_TOP_SUM,ARRAY_CONCAT,ARRAY_LENGTH,ARRAY_TO_STRING,GENERATE_ARRAY,GENERATE_DATE_ARRAY,GENERATE_TIMESTAMP_ARRAY,ARRAY_REVERSE,OFFSET,SAFE_OFFSET,ORDINAL,SAFE_ORDINAL,BIT_COUNT,PARSE_BIGNUMERIC,PARSE_NUMERIC,SAFE_CAST,CURRENT_DATE,EXTRACT,DATE,DATE_ADD,DATE_SUB,DATE_DIFF,DATE_TRUNC,DATE_FROM_UNIX_DATE,FORMAT_DATE,LAST_DAY,PARSE_DATE,UNIX_DATE,CURRENT_DATETIME,DATETIME,EXTRACT,DATETIME_ADD,DATETIME_SUB,DATETIME_DIFF,DATETIME_TRUNC,FORMAT_DATETIME,LAST_DAY,PARSE_DATETIME,ERROR,EXTERNAL_QUERY,S2_CELLIDFROMPOINT,S2_COVERINGCELLIDS,ST_ANGLE,ST_AREA,ST_ASBINARY,ST_ASGEOJSON,ST_ASTEXT,ST_AZIMUTH,ST_BOUNDARY,ST_BOUNDINGBOX,ST_BUFFER,ST_BUFFERWITHTOLERANCE,ST_CENTROID,ST_CENTROID_AGG,ST_CLOSESTPOINT,ST_CLUSTERDBSCAN,ST_CONTAINS,ST_CONVEXHULL,ST_COVEREDBY,ST_COVERS,ST_DIFFERENCE,ST_DIMENSION,ST_DISJOINT,ST_DISTANCE,ST_DUMP,ST_DWITHIN,ST_ENDPOINT,ST_EQUALS,ST_EXTENT,ST_EXTERIORRING,ST_GEOGFROM,ST_GEOGFROMGEOJSON,ST_GEOGFROMTEXT,ST_GEOGFROMWKB,ST_GEOGPOINT,ST_GEOGPOINTFROMGEOHASH,ST_GEOHASH,ST_GEOMETRYTYPE,ST_INTERIORRINGS,ST_INTERSECTION,ST_INTERSECTS,ST_INTERSECTSBOX,ST_ISCOLLECTION,ST_ISEMPTY,ST_LENGTH,ST_MAKELINE,ST_MAKEPOLYGON,ST_MAKEPOLYGONORIENTED,ST_MAXDISTANCE,ST_NPOINTS,ST_NUMGEOMETRIES,ST_NUMPOINTS,ST_PERIMETER,ST_POINTN,ST_SIMPLIFY,ST_SNAPTOGRID,ST_STARTPOINT,ST_TOUCHES,ST_UNION,ST_UNION_AGG,ST_WITHIN,ST_X,ST_Y,FARM_FINGERPRINT,MD5,SHA1,SHA256,SHA512,HLL_COUNT.INIT,HLL_COUNT.MERGE,HLL_COUNT.MERGE_PARTIAL,HLL_COUNT.EXTRACT,MAKE_INTERVAL,EXTRACT,JUSTIFY_DAYS,JUSTIFY_HOURS,JUSTIFY_INTERVAL,JSON_EXTRACT,JSON_QUERY,JSON_EXTRACT_SCALAR,JSON_VALUE,JSON_EXTRACT_ARRAY,JSON_QUERY_ARRAY,JSON_EXTRACT_STRING_ARRAY,JSON_VALUE_ARRAY,TO_JSON_STRING,ABS,SIGN,IS_INF,IS_NAN,IEEE_DIVIDE,RAND,SQRT,POW,POWER,EXP,LN,LOG,LOG10,GREATEST,LEAST,DIV,SAFE_DIVIDE,SAFE_MULTIPLY,SAFE_NEGATE,SAFE_ADD,SAFE_SUBTRACT,MOD,ROUND,TRUNC,CEIL,CEILING,FLOOR,COS,COSH,ACOS,ACOSH,SIN,SINH,ASIN,ASINH,TAN,TANH,ATAN,ATANH,ATAN2,RANGE_BUCKET,FIRST_VALUE,LAST_VALUE,NTH_VALUE,LEAD,LAG,PERCENTILE_CONT,PERCENTILE_DISC,NET.IP_FROM_STRING,NET.SAFE_IP_FROM_STRING,NET.IP_TO_STRING,NET.IP_NET_MASK,NET.IP_TRUNC,NET.IPV4_FROM_INT64,NET.IPV4_TO_INT64,NET.HOST,NET.PUBLIC_SUFFIX,NET.REG_DOMAIN,RANK,DENSE_RANK,PERCENT_RANK,CUME_DIST,NTILE,ROW_NUMBER,SESSION_USER,CORR,COVAR_POP,COVAR_SAMP,STDDEV_POP,STDDEV_SAMP,STDDEV,VAR_POP,VAR_SAMP,VARIANCE,ASCII,BYTE_LENGTH,CHAR_LENGTH,CHARACTER_LENGTH,CHR,CODE_POINTS_TO_BYTES,CODE_POINTS_TO_STRING,CONCAT,CONTAINS_SUBSTR,ENDS_WITH,FORMAT,FROM_BASE32,FROM_BASE64,FROM_HEX,INITCAP,INSTR,LEFT,LENGTH,LPAD,LOWER,LTRIM,NORMALIZE,NORMALIZE_AND_CASEFOLD,OCTET_LENGTH,REGEXP_CONTAINS,REGEXP_EXTRACT,REGEXP_EXTRACT_ALL,REGEXP_INSTR,REGEXP_REPLACE,REGEXP_SUBSTR,REPLACE,REPEAT,REVERSE,RIGHT,RPAD,RTRIM,SAFE_CONVERT_BYTES_TO_STRING,SOUNDEX,SPLIT,STARTS_WITH,STRPOS,SUBSTR,SUBSTRING,TO_BASE32,TO_BASE64,TO_CODE_POINTS,TO_HEX,TRANSLATE,TRIM,UNICODE,UPPER,CURRENT_TIME,TIME,EXTRACT,TIME_ADD,TIME_SUB,TIME_DIFF,TIME_TRUNC,FORMAT_TIME,PARSE_TIME,CURRENT_TIMESTAMP,EXTRACT,STRING,TIMESTAMP,TIMESTAMP_ADD,TIMESTAMP_SUB,TIMESTAMP_DIFF,TIMESTAMP_TRUNC,FORMAT_TIMESTAMP,PARSE_TIMESTAMP,TIMESTAMP_SECONDS,TIMESTAMP_MILLIS,TIMESTAMP_MICROS,UNIX_SECONDS,UNIX_MILLIS,UNIX_MICROS,GENERATE_UUID,COALESCE,IF,IFNULL,NULLIF,AVG,BIT_AND,BIT_OR,BIT_XOR,CORR,COUNT,COVAR_POP,COVAR_SAMP,EXACT_COUNT_DISTINCT,FIRST,GROUP_CONCAT,GROUP_CONCAT_UNQUOTED,LAST,MAX,MIN,NEST,NTH,QUANTILES,STDDEV,STDDEV_POP,STDDEV_SAMP,SUM,TOP,UNIQUE,VARIANCE,VAR_POP,VAR_SAMP,BIT_COUNT,BOOLEAN,BYTES,CAST,FLOAT,HEX_STRING,INTEGER,STRING,COALESCE,GREATEST,IFNULL,IS_INF,IS_NAN,IS_EXPLICITLY_DEFINED,LEAST,NVL,CURRENT_DATE,CURRENT_TIME,CURRENT_TIMESTAMP,DATE,DATE_ADD,DATEDIFF,DAY,DAYOFWEEK,DAYOFYEAR,FORMAT_UTC_USEC,HOUR,MINUTE,MONTH,MSEC_TO_TIMESTAMP,NOW,PARSE_UTC_USEC,QUARTER,SEC_TO_TIMESTAMP,SECOND,STRFTIME_UTC_USEC,TIME,TIMESTAMP,TIMESTAMP_TO_MSEC,TIMESTAMP_TO_SEC,TIMESTAMP_TO_USEC,USEC_TO_TIMESTAMP,UTC_USEC_TO_DAY,UTC_USEC_TO_HOUR,UTC_USEC_TO_MONTH,UTC_USEC_TO_WEEK,UTC_USEC_TO_YEAR,WEEK,YEAR,FORMAT_IP,PARSE_IP,FORMAT_PACKED_IP,PARSE_PACKED_IP,JSON_EXTRACT,JSON_EXTRACT_SCALAR,ABS,ACOS,ACOSH,ASIN,ASINH,ATAN,ATANH,ATAN2,CEIL,COS,COSH,DEGREES,EXP,FLOOR,LN,LOG,LOG2,LOG10,PI,POW,RADIANS,RAND,ROUND,SIN,SINH,SQRT,TAN,TANH,REGEXP_MATCH,REGEXP_EXTRACT,REGEXP_REPLACE,CONCAT,INSTR,LEFT,LENGTH,LOWER,LPAD,LTRIM,REPLACE,RIGHT,RPAD,RTRIM,SPLIT,SUBSTR,UPPER,TABLE_DATE_RANGE,TABLE_DATE_RANGE_STRICT,TABLE_QUERY,HOST,DOMAIN,TLD,AVG,COUNT,MAX,MIN,STDDEV,SUM,CUME_DIST,DENSE_RANK,FIRST_VALUE,LAG,LAST_VALUE,LEAD,NTH_VALUE,NTILE,PERCENT_RANK,PERCENTILE_CONT,PERCENTILE_DISC,RANK,RATIO_TO_REPORT,ROW_NUMBER,CURRENT_USER,EVERY,FROM_BASE64,HASH,FARM_FINGERPRINT,IF,POSITION,SHA1,SOME,TO_BASE64,BQ.JOBS.CANCEL,BQ.REFRESH_MATERIALIZED_VIEW,OPTIONS,PIVOT,UNPIVOT".split(","), At = /* @__PURE__ */ "ALL.AND.ANY.AS.ASC.ASSERT_ROWS_MODIFIED.AT.BETWEEN.BY.CASE.CAST.COLLATE.CONTAINS.CREATE.CROSS.CUBE.CURRENT.DEFAULT.DEFINE.DESC.DISTINCT.ELSE.END.ENUM.ESCAPE.EXCEPT.EXCLUDE.EXISTS.EXTRACT.FALSE.FETCH.FOLLOWING.FOR.FROM.FULL.GROUP.GROUPING.GROUPS.HASH.HAVING.IF.IGNORE.IN.INNER.INTERSECT.INTO.IS.JOIN.LATERAL.LEFT.LIMIT.LOOKUP.MERGE.NATURAL.NEW.NO.NOT.NULL.NULLS.OF.ON.OR.ORDER.OUTER.OVER.PARTITION.PRECEDING.PROTO.RANGE.RECURSIVE.RESPECT.RIGHT.ROLLUP.ROWS.SELECT.SET.SOME.TABLE.TABLESAMPLE.THEN.TO.TREAT.TRUE.UNBOUNDED.UNION.UNNEST.USING.WHEN.WHERE.WINDOW.WITH.WITHIN.SAFE.LIKE.COPY.CLONE.IN.OUT.INOUT.RETURNS.LANGUAGE.CASCADE.RESTRICT.DETERMINISTIC".split("."), jt = [
	"ARRAY",
	"BOOL",
	"BYTES",
	"DATE",
	"DATETIME",
	"GEOGRAPHY",
	"INTERVAL",
	"INT64",
	"INT",
	"SMALLINT",
	"INTEGER",
	"BIGINT",
	"TINYINT",
	"BYTEINT",
	"NUMERIC",
	"DECIMAL",
	"BIGNUMERIC",
	"BIGDECIMAL",
	"FLOAT64",
	"STRING",
	"STRUCT",
	"TIME",
	"TIMEZONE"
], Mt = w(["SELECT [ALL | DISTINCT] [AS STRUCT | AS VALUE]"]), Nt = w([
	"WITH [RECURSIVE]",
	"FROM",
	"WHERE",
	"GROUP BY",
	"HAVING",
	"QUALIFY",
	"WINDOW",
	"PARTITION BY",
	"ORDER BY",
	"LIMIT",
	"OFFSET",
	"OMIT RECORD IF",
	"INSERT [INTO]",
	"VALUES",
	"SET",
	"MERGE [INTO]",
	"WHEN [NOT] MATCHED [BY SOURCE | BY TARGET] [THEN]",
	"UPDATE SET",
	"CLUSTER BY",
	"FOR SYSTEM_TIME AS OF",
	"WITH CONNECTION",
	"WITH PARTITION COLUMNS",
	"REMOTE WITH CONNECTION"
]), Pt = w(["CREATE [OR REPLACE] [TEMP|TEMPORARY|SNAPSHOT|EXTERNAL] TABLE [IF NOT EXISTS]"]), Ft = w(/* @__PURE__ */ "CREATE [OR REPLACE] [MATERIALIZED] VIEW [IF NOT EXISTS].UPDATE.DELETE [FROM].DROP [SNAPSHOT | EXTERNAL] TABLE [IF EXISTS].ALTER TABLE [IF EXISTS].ADD COLUMN [IF NOT EXISTS].DROP COLUMN [IF EXISTS].RENAME TO.ALTER COLUMN [IF EXISTS].SET DEFAULT COLLATE.SET OPTIONS.DROP NOT NULL.SET DATA TYPE.ALTER SCHEMA [IF EXISTS].ALTER [MATERIALIZED] VIEW [IF EXISTS].ALTER BI_CAPACITY.TRUNCATE TABLE.CREATE SCHEMA [IF NOT EXISTS].DEFAULT COLLATE.CREATE [OR REPLACE] [TEMP|TEMPORARY|TABLE] FUNCTION [IF NOT EXISTS].CREATE [OR REPLACE] PROCEDURE [IF NOT EXISTS].CREATE [OR REPLACE] ROW ACCESS POLICY [IF NOT EXISTS].GRANT TO.FILTER USING.CREATE CAPACITY.AS JSON.CREATE RESERVATION.CREATE ASSIGNMENT.CREATE SEARCH INDEX [IF NOT EXISTS].DROP SCHEMA [IF EXISTS].DROP [MATERIALIZED] VIEW [IF EXISTS].DROP [TABLE] FUNCTION [IF EXISTS].DROP PROCEDURE [IF EXISTS].DROP ROW ACCESS POLICY.DROP ALL ROW ACCESS POLICIES.DROP CAPACITY [IF EXISTS].DROP RESERVATION [IF EXISTS].DROP ASSIGNMENT [IF EXISTS].DROP SEARCH INDEX [IF EXISTS].DROP [IF EXISTS].GRANT.REVOKE.DECLARE.EXECUTE IMMEDIATE.LOOP.END LOOP.REPEAT.END REPEAT.WHILE.END WHILE.BREAK.LEAVE.CONTINUE.ITERATE.FOR.END FOR.BEGIN.BEGIN TRANSACTION.COMMIT TRANSACTION.ROLLBACK TRANSACTION.RAISE.RETURN.CALL.ASSERT.EXPORT DATA".split(".")), It = w([
	"UNION {ALL | DISTINCT}",
	"EXCEPT DISTINCT",
	"INTERSECT DISTINCT"
]), Lt = w([
	"JOIN",
	"{LEFT | RIGHT | FULL} [OUTER] JOIN",
	"{INNER | CROSS} JOIN"
]), Rt = w([
	"TABLESAMPLE SYSTEM",
	"ANY TYPE",
	"ALL COLUMNS",
	"NOT DETERMINISTIC",
	"{ROWS | RANGE} BETWEEN",
	"IS [NOT] DISTINCT FROM"
]), zt = w([]), Bt = {
	name: "bigquery",
	tokenizerOptions: {
		reservedSelect: Mt,
		reservedClauses: [
			...Nt,
			...Ft,
			...Pt
		],
		reservedSetOperations: It,
		reservedJoins: Lt,
		reservedKeywordPhrases: Rt,
		reservedDataTypePhrases: zt,
		reservedKeywords: At,
		reservedDataTypes: jt,
		reservedFunctionNames: kt,
		extraParens: ["[]"],
		stringTypes: [
			{
				quote: "\"\"\"..\"\"\"",
				prefixes: [
					"R",
					"B",
					"RB",
					"BR"
				]
			},
			{
				quote: "'''..'''",
				prefixes: [
					"R",
					"B",
					"RB",
					"BR"
				]
			},
			"\"\"-bs",
			"''-bs",
			{
				quote: "\"\"-raw",
				prefixes: [
					"R",
					"B",
					"RB",
					"BR"
				],
				requirePrefix: !0
			},
			{
				quote: "''-raw",
				prefixes: [
					"R",
					"B",
					"RB",
					"BR"
				],
				requirePrefix: !0
			}
		],
		identTypes: ["``"],
		identChars: { dashes: !0 },
		paramTypes: {
			positional: !0,
			named: ["@"],
			quoted: ["@"]
		},
		variableTypes: [{ regex: String.raw`@@\w+` }],
		lineCommentTypes: ["--", "#"],
		operators: [
			"&",
			"|",
			"^",
			"~",
			">>",
			"<<",
			"||",
			"=>"
		],
		postProcess: Vt
	},
	formatOptions: {
		onelineClauses: [...Pt, ...Ft],
		tabularOnelineClauses: Ft
	}
};
function Vt(e) {
	return Ht(Ut(e));
}
function Ht(e) {
	let t = D;
	return e.map((e) => e.text === "OFFSET" && t.text === "[" ? (t = e, Object.assign(Object.assign({}, e), { type: E.RESERVED_FUNCTION_NAME })) : (t = e, e));
}
function Ut(e) {
	let t = [];
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		if ((k.ARRAY(r) || k.STRUCT(r)) && e[n + 1]?.text === "<") {
			let i = Gt(e, n + 1), a = e.slice(n, i + 1);
			t.push({
				type: E.IDENTIFIER,
				raw: a.map(Wt("raw")).join(""),
				text: a.map(Wt("text")).join(""),
				start: r.start
			}), n = i;
		} else t.push(r);
	}
	return t;
}
var Wt = (e) => (t) => t.type === E.IDENTIFIER || t.type === E.COMMA ? t[e] + " " : t[e];
function Gt(e, t) {
	let n = 0;
	for (let r = t; r < e.length; r++) {
		let t = e[r];
		if (t.text === "<" ? n++ : t.text === ">" ? n-- : t.text === ">>" && (n -= 2), n === 0) return r;
	}
	return e.length - 1;
}
//#endregion
//#region node_modules/sql-formatter/dist/esm/languages/clickhouse/clickhouse.functions.js
var Kt = /* @__PURE__ */ "BIT_AND.BIT_OR.BIT_XOR.BLAKE3.CAST.CHARACTER_LENGTH.CHAR_LENGTH.COVAR_POP.COVAR_SAMP.CRC32.CRC32IEEE.CRC64.DATE.DATE_DIFF.DATE_FORMAT.DATE_TRUNC.DAY.DAYOFMONTH.DAYOFWEEK.DAYOFYEAR.FORMAT_BYTES.FQDN.FROM_BASE64.FROM_DAYS.FROM_UNIXTIME.HOUR.INET6_ATON.INET6_NTOA.INET_ATON.INET_NTOA.IPv4CIDRToRange.IPv4NumToString.IPv4NumToStringClassC.IPv4StringToNum.IPv4StringToNumOrDefault.IPv4StringToNumOrNull.IPv4ToIPv6.IPv6CIDRToRange.IPv6NumToString.IPv6StringToNum.IPv6StringToNumOrDefault.IPv6StringToNumOrNull.JSONAllPaths.JSONAllPathsWithTypes.JSONArrayLength.JSONDynamicPaths.JSONDynamicPathsWithTypes.JSONExtract.JSONExtractArrayRaw.JSONExtractArrayRawCaseInsensitive.JSONExtractBool.JSONExtractBoolCaseInsensitive.JSONExtractCaseInsensitive.JSONExtractFloat.JSONExtractFloatCaseInsensitive.JSONExtractInt.JSONExtractIntCaseInsensitive.JSONExtractKeys.JSONExtractKeysAndValues.JSONExtractKeysAndValuesCaseInsensitive.JSONExtractKeysAndValuesRaw.JSONExtractKeysAndValuesRawCaseInsensitive.JSONExtractKeysCaseInsensitive.JSONExtractRaw.JSONExtractRawCaseInsensitive.JSONExtractString.JSONExtractStringCaseInsensitive.JSONExtractUInt.JSONExtractUIntCaseInsensitive.JSONHas.JSONKey.JSONLength.JSONMergePatch.JSONSharedDataPaths.JSONSharedDataPathsWithTypes.JSONType.JSON_ARRAY_LENGTH.JSON_EXISTS.JSON_QUERY.JSON_VALUE.L1Distance.L1Norm.L1Normalize.L2Distance.L2Norm.L2Normalize.L2SquaredDistance.L2SquaredNorm.LAST_DAY.LinfDistance.LinfNorm.LinfNormalize.LpDistance.LpNorm.LpNormalize.MACNumToString.MACStringToNum.MACStringToOUI.MAP_FROM_ARRAYS.MD4.MD5.MILLISECOND.MINUTE.MONTH.OCTET_LENGTH.QUARTER.REGEXP_EXTRACT.REGEXP_MATCHES.REGEXP_REPLACE.RIPEMD160.SCHEMA.SECOND.SHA1.SHA224.SHA256.SHA384.SHA512.SHA512_256.STD.STDDEV_POP.STDDEV_SAMP.ST_LineFromWKB.ST_MLineFromWKB.ST_MPolyFromWKB.ST_PointFromWKB.ST_PolyFromWKB.SUBSTRING_INDEX.SVG.TIMESTAMP_DIFF.TO_BASE64.TO_DAYS.TO_UNIXTIME.ULIDStringToDateTime.URLHash.URLHierarchy.URLPathHierarchy.UTCTimestamp.UTC_timestamp.UUIDNumToString.UUIDStringToNum.UUIDToNum.UUIDv7ToDateTime.VAR_POP.VAR_SAMP.YEAR.YYYYMMDDToDate.YYYYMMDDToDate32.YYYYMMDDhhmmssToDateTime.YYYYMMDDhhmmssToDateTime64._CAST.__actionName.__bitBoolMaskAnd.__bitBoolMaskOr.__bitSwapLastTwo.__bitWrapperFunc.__getScalar.__patchPartitionID.__scalarSubqueryResult.abs.accurateCast.accurateCastOrDefault.accurateCastOrNull.acos.acosh.addDate.addDays.addHours.addInterval.addMicroseconds.addMilliseconds.addMinutes.addMonths.addNanoseconds.addQuarters.addSeconds.addTupleOfIntervals.addWeeks.addYears.addressToLine.addressToLineWithInlines.addressToSymbol.aes_decrypt_mysql.aes_encrypt_mysql.age.aggThrow.alphaTokens.analysisOfVariance.anova.any.anyHeavy.anyLast.anyLastRespectNulls.anyLast_respect_nulls.anyRespectNulls.anyValueRespectNulls.any_respect_nulls.any_value.any_value_respect_nulls.appendTrailingCharIfAbsent.approx_top_count.approx_top_k.approx_top_sum.argMax.argMin.array.arrayAUC.arrayAUCPR.arrayAll.arrayAvg.arrayCompact.arrayConcat.arrayCount.arrayCumSum.arrayCumSumNonNegative.arrayDifference.arrayDistinct.arrayDotProduct.arrayElement.arrayElementOrNull.arrayEnumerate.arrayEnumerateDense.arrayEnumerateDenseRanked.arrayEnumerateUniq.arrayEnumerateUniqRanked.arrayExists.arrayFill.arrayFilter.arrayFirst.arrayFirstIndex.arrayFirstOrNull.arrayFlatten.arrayFold.arrayIntersect.arrayJaccardIndex.arrayJoin.arrayLast.arrayLastIndex.arrayLastOrNull.arrayLevenshteinDistance.arrayLevenshteinDistanceWeighted.arrayMap.arrayMax.arrayMin.arrayNormalizedGini.arrayPRAUC.arrayPartialReverseSort.arrayPartialShuffle.arrayPartialSort.arrayPopBack.arrayPopFront.arrayProduct.arrayPushBack.arrayPushFront.arrayROCAUC.arrayRandomSample.arrayReduce.arrayReduceInRanges.arrayResize.arrayReverse.arrayReverseFill.arrayReverseSort.arrayReverseSplit.arrayRotateLeft.arrayRotateRight.arrayShiftLeft.arrayShiftRight.arrayShingles.arrayShuffle.arraySimilarity.arraySlice.arraySort.arraySplit.arrayStringConcat.arraySum.arraySymmetricDifference.arrayUnion.arrayUniq.arrayWithConstant.arrayZip.arrayZipUnaligned.array_agg.array_concat_agg.ascii.asin.asinh.assumeNotNull.atan.atan2.atanh.authenticatedUser.avg.avgWeighted.bar.base32Decode.base32Encode.base58Decode.base58Encode.base64Decode.base64Encode.base64URLDecode.base64URLEncode.basename.bech32Decode.bech32Encode.bin.bitAnd.bitCount.bitHammingDistance.bitNot.bitOr.bitPositionsToArray.bitRotateLeft.bitRotateRight.bitShiftLeft.bitShiftRight.bitSlice.bitTest.bitTestAll.bitTestAny.bitXor.bitmapAnd.bitmapAndCardinality.bitmapAndnot.bitmapAndnotCardinality.bitmapBuild.bitmapCardinality.bitmapContains.bitmapHasAll.bitmapHasAny.bitmapMax.bitmapMin.bitmapOr.bitmapOrCardinality.bitmapSubsetInRange.bitmapSubsetLimit.bitmapToArray.bitmapTransform.bitmapXor.bitmapXorCardinality.bitmaskToArray.bitmaskToList.blockNumber.blockSerializedSize.blockSize.boundingRatio.buildId.byteHammingDistance.byteSize.byteSlice.byteSwap.caseWithExpr.caseWithExpression.caseWithoutExpr.caseWithoutExpression.catboostEvaluate.categoricalInformationValue.cbrt.ceil.ceiling.changeDay.changeHour.changeMinute.changeMonth.changeSecond.changeYear.char.cityHash64.clamp.coalesce.colorOKLCHToSRGB.colorSRGBToOKLCH.compareSubstrings.concat.concatAssumeInjective.concatWithSeparator.concatWithSeparatorAssumeInjective.concat_ws.connectionId.connection_id.contingency.convertCharset.corr.corrMatrix.corrStable.cos.cosh.cosineDistance.count.countDigits.countEqual.countMatches.countMatchesCaseInsensitive.countSubstrings.countSubstringsCaseInsensitive.countSubstringsCaseInsensitiveUTF8.covarPop.covarPopMatrix.covarPopStable.covarSamp.covarSampMatrix.covarSampStable.cramersV.cramersVBiasCorrected.curdate.currentDatabase.currentProfiles.currentQueryID.currentRoles.currentSchemas.currentUser.current_database.current_date.current_query_id.current_schemas.current_timestamp.current_user.cutFragment.cutIPv6.cutQueryString.cutQueryStringAndFragment.cutToFirstSignificantSubdomain.cutToFirstSignificantSubdomainCustom.cutToFirstSignificantSubdomainCustomRFC.cutToFirstSignificantSubdomainCustomWithWWW.cutToFirstSignificantSubdomainCustomWithWWWRFC.cutToFirstSignificantSubdomainRFC.cutToFirstSignificantSubdomainWithWWW.cutToFirstSignificantSubdomainWithWWWRFC.cutURLParameter.cutWWW.damerauLevenshteinDistance.dateDiff.dateName.dateTime64ToSnowflake.dateTime64ToSnowflakeID.dateTimeToSnowflake.dateTimeToSnowflakeID.dateTimeToUUIDv7.dateTrunc.date_bin.date_diff.decodeHTMLComponent.decodeURLComponent.decodeURLFormComponent.decodeXMLComponent.decrypt.defaultProfiles.defaultRoles.defaultValueOfArgumentType.defaultValueOfTypeName.degrees.deltaSum.deltaSumTimestamp.demangle.denseRank.dense_rank.detectCharset.detectLanguage.detectLanguageMixed.detectLanguageUnknown.detectProgrammingLanguage.detectTonality.dictGet.dictGetAll.dictGetChildren.dictGetDate.dictGetDateOrDefault.dictGetDateTime.dictGetDateTimeOrDefault.dictGetDescendants.dictGetFloat32.dictGetFloat32OrDefault.dictGetFloat64.dictGetFloat64OrDefault.dictGetHierarchy.dictGetIPv4.dictGetIPv4OrDefault.dictGetIPv6.dictGetIPv6OrDefault.dictGetInt16.dictGetInt16OrDefault.dictGetInt32.dictGetInt32OrDefault.dictGetInt64.dictGetInt64OrDefault.dictGetInt8.dictGetInt8OrDefault.dictGetOrDefault.dictGetOrNull.dictGetString.dictGetStringOrDefault.dictGetUInt16.dictGetUInt16OrDefault.dictGetUInt32.dictGetUInt32OrDefault.dictGetUInt64.dictGetUInt64OrDefault.dictGetUInt8.dictGetUInt8OrDefault.dictGetUUID.dictGetUUIDOrDefault.dictHas.dictIsIn.displayName.distanceL1.distanceL2.distanceL2Squared.distanceLinf.distanceLp.distinctDynamicTypes.distinctJSONPaths.distinctJSONPathsAndTypes.divide.divideDecimal.divideOrNull.domain.domainRFC.domainWithoutWWW.domainWithoutWWWRFC.dotProduct.dumpColumnStructure.dynamicElement.dynamicType.e.editDistance.editDistanceUTF8.empty.emptyArrayDate.emptyArrayDateTime.emptyArrayFloat32.emptyArrayFloat64.emptyArrayInt16.emptyArrayInt32.emptyArrayInt64.emptyArrayInt8.emptyArrayString.emptyArrayToSingle.emptyArrayUInt16.emptyArrayUInt32.emptyArrayUInt64.emptyArrayUInt8.enabledProfiles.enabledRoles.encodeURLComponent.encodeURLFormComponent.encodeXMLComponent.encrypt.endsWith.endsWithUTF8.entropy.equals.erf.erfc.errorCodeToName.estimateCompressionRatio.evalMLMethod.exp.exp10.exp2.exponentialMovingAverage.exponentialTimeDecayedAvg.exponentialTimeDecayedCount.exponentialTimeDecayedMax.exponentialTimeDecayedSum.extract.extractAll.extractAllGroups.extractAllGroupsHorizontal.extractAllGroupsVertical.extractGroups.extractKeyValuePairs.extractKeyValuePairsWithEscaping.extractTextFromHTML.extractURLParameter.extractURLParameterNames.extractURLParameters.factorial.farmFingerprint64.farmHash64.file.filesystemAvailable.filesystemCapacity.filesystemUnreserved.finalizeAggregation.financialInternalRateOfReturn.financialInternalRateOfReturnExtended.financialNetPresentValue.financialNetPresentValueExtended.firstLine.firstSignificantSubdomain.firstSignificantSubdomainCustom.firstSignificantSubdomainCustomRFC.firstSignificantSubdomainRFC.firstValueRespectNulls.first_value.first_value_respect_nulls.flameGraph.flatten.flattenTuple.floor.formatDateTime.formatDateTimeInJodaSyntax.formatQuery.formatQueryOrNull.formatQuerySingleLine.formatQuerySingleLineOrNull.formatReadableDecimalSize.formatReadableQuantity.formatReadableSize.formatReadableTimeDelta.formatRow.formatRowNoNewline.fragment.fromDaysSinceYearZero.fromDaysSinceYearZero32.fromModifiedJulianDay.fromModifiedJulianDayOrNull.fromUTCTimestamp.fromUnixTimestamp.fromUnixTimestamp64Micro.fromUnixTimestamp64Milli.fromUnixTimestamp64Nano.fromUnixTimestamp64Second.fromUnixTimestampInJodaSyntax.from_utc_timestamp.fullHostName.fuzzBits.gccMurmurHash.gcd.generateRandomStructure.generateSerialID.generateSnowflakeID.generateULID.generateUUIDv4.generateUUIDv7.geoDistance.geoToH3.geoToS2.geohashDecode.geohashEncode.geohashesInBox.getClientHTTPHeader.getMacro.getMaxTableNameLengthForDatabase.getMergeTreeSetting.getOSKernelVersion.getServerPort.getServerSetting.getSetting.getSettingOrDefault.getSizeOfEnumType.getSubcolumn.getTypeSerializationStreams.globalIn.globalInIgnoreSet.globalNotIn.globalNotInIgnoreSet.globalNotNullIn.globalNotNullInIgnoreSet.globalNullIn.globalNullInIgnoreSet.globalVariable.greatCircleAngle.greatCircleDistance.greater.greaterOrEquals.greatest.groupArray.groupArrayInsertAt.groupArrayIntersect.groupArrayLast.groupArrayMovingAvg.groupArrayMovingSum.groupArraySample.groupArraySorted.groupBitAnd.groupBitOr.groupBitXor.groupBitmap.groupBitmapAnd.groupBitmapOr.groupBitmapXor.groupConcat.groupNumericIndexedVector.groupUniqArray.group_concat.h3CellAreaM2.h3CellAreaRads2.h3Distance.h3EdgeAngle.h3EdgeLengthKm.h3EdgeLengthM.h3ExactEdgeLengthKm.h3ExactEdgeLengthM.h3ExactEdgeLengthRads.h3GetBaseCell.h3GetDestinationIndexFromUnidirectionalEdge.h3GetFaces.h3GetIndexesFromUnidirectionalEdge.h3GetOriginIndexFromUnidirectionalEdge.h3GetPentagonIndexes.h3GetRes0Indexes.h3GetResolution.h3GetUnidirectionalEdge.h3GetUnidirectionalEdgeBoundary.h3GetUnidirectionalEdgesFromHexagon.h3HexAreaKm2.h3HexAreaM2.h3HexRing.h3IndexesAreNeighbors.h3IsPentagon.h3IsResClassIII.h3IsValid.h3Line.h3NumHexagons.h3PointDistKm.h3PointDistM.h3PointDistRads.h3ToCenterChild.h3ToChildren.h3ToGeo.h3ToGeoBoundary.h3ToParent.h3ToString.h3UnidirectionalEdgeIsValid.h3kRing.halfMD5.has.hasAll.hasAny.hasColumnInTable.hasSubsequence.hasSubsequenceCaseInsensitive.hasSubsequenceCaseInsensitiveUTF8.hasSubsequenceUTF8.hasSubstr.hasThreadFuzzer.hasToken.hasTokenCaseInsensitive.hasTokenCaseInsensitiveOrNull.hasTokenOrNull.hex.hilbertDecode.hilbertEncode.histogram.hiveHash.hop.hopEnd.hopStart.hostName.hostname.hypot.icebergBucket.icebergHash.icebergTruncate.identity.idnaDecode.idnaEncode.if.ifNotFinite.ifNull.ignore.inIgnoreSet.indexHint.indexOf.indexOfAssumeSorted.initcap.initcapUTF8.initialQueryID.initialQueryStartTime.initial_query_id.initial_query_start_time.initializeAggregation.instr.intDiv.intDivOrNull.intDivOrZero.intExp10.intExp2.intHash32.intHash64.intervalLengthSum.isConstant.isDecimalOverflow.isDynamicElementInSharedData.isFinite.isIPAddressInRange.isIPv4String.isIPv6String.isInfinite.isMergeTreePartCoveredBy.isNaN.isNotDistinctFrom.isNotNull.isNull.isNullable.isValidJSON.isValidUTF8.isZeroOrNull.jaroSimilarity.jaroWinklerSimilarity.javaHash.javaHashUTF16LE.joinGet.joinGetOrNull.jsonMergePatch.jumpConsistentHash.kafkaMurmurHash.keccak256.kolmogorovSmirnovTest.kostikConsistentHash.kql_array_sort_asc.kql_array_sort_desc.kurtPop.kurtSamp.lag.lagInFrame.largestTriangleThreeBuckets.lastValueRespectNulls.last_value.last_value_respect_nulls.lcase.lcm.lead.leadInFrame.least.left.leftPad.leftPadUTF8.leftUTF8.lemmatize.length.lengthUTF8.less.lessOrEquals.levenshteinDistance.levenshteinDistanceUTF8.lgamma.ln.locate.log.log10.log1p.log2.logTrace.lowCardinalityIndices.lowCardinalityKeys.lower.lowerUTF8.lpad.ltrim.lttb.makeDate.makeDate32.makeDateTime.makeDateTime64.mannWhitneyUTest.map.mapAdd.mapAll.mapApply.mapConcat.mapContains.mapContainsKey.mapContainsKeyLike.mapContainsValue.mapContainsValueLike.mapExists.mapExtractKeyLike.mapExtractValueLike.mapFilter.mapFromArrays.mapFromString.mapKeys.mapPartialReverseSort.mapPartialSort.mapPopulateSeries.mapReverseSort.mapSort.mapSubtract.mapUpdate.mapValues.match.materialize.max.max2.maxIntersections.maxIntersectionsPosition.maxMappedArrays.meanZTest.median.medianBFloat16.medianBFloat16Weighted.medianDD.medianDeterministic.medianExact.medianExactHigh.medianExactLow.medianExactWeighted.medianExactWeightedInterpolated.medianGK.medianInterpolatedWeighted.medianTDigest.medianTDigestWeighted.medianTiming.medianTimingWeighted.mergeTreePartInfo.metroHash64.mid.min.min2.minMappedArrays.minSampleSizeContinous.minSampleSizeContinuous.minSampleSizeConversion.minus.mismatches.mod.modOrNull.modulo.moduloLegacy.moduloOrNull.moduloOrZero.monthName.mortonDecode.mortonEncode.multiFuzzyMatchAllIndices.multiFuzzyMatchAny.multiFuzzyMatchAnyIndex.multiIf.multiMatchAllIndices.multiMatchAny.multiMatchAnyIndex.multiSearchAllPositions.multiSearchAllPositionsCaseInsensitive.multiSearchAllPositionsCaseInsensitiveUTF8.multiSearchAllPositionsUTF8.multiSearchAny.multiSearchAnyCaseInsensitive.multiSearchAnyCaseInsensitiveUTF8.multiSearchAnyUTF8.multiSearchFirstIndex.multiSearchFirstIndexCaseInsensitive.multiSearchFirstIndexCaseInsensitiveUTF8.multiSearchFirstIndexUTF8.multiSearchFirstPosition.multiSearchFirstPositionCaseInsensitive.multiSearchFirstPositionCaseInsensitiveUTF8.multiSearchFirstPositionUTF8.multiply.multiplyDecimal.murmurHash2_32.murmurHash2_64.murmurHash3_128.murmurHash3_32.murmurHash3_64.negate.neighbor.nested.netloc.ngramDistance.ngramDistanceCaseInsensitive.ngramDistanceCaseInsensitiveUTF8.ngramDistanceUTF8.ngramMinHash.ngramMinHashArg.ngramMinHashArgCaseInsensitive.ngramMinHashArgCaseInsensitiveUTF8.ngramMinHashArgUTF8.ngramMinHashCaseInsensitive.ngramMinHashCaseInsensitiveUTF8.ngramMinHashUTF8.ngramSearch.ngramSearchCaseInsensitive.ngramSearchCaseInsensitiveUTF8.ngramSearchUTF8.ngramSimHash.ngramSimHashCaseInsensitive.ngramSimHashCaseInsensitiveUTF8.ngramSimHashUTF8.ngrams.nonNegativeDerivative.normL1.normL2.normL2Squared.normLinf.normLp.normalizeL1.normalizeL2.normalizeLinf.normalizeLp.normalizeQuery.normalizeQueryKeepNames.normalizeUTF8NFC.normalizeUTF8NFD.normalizeUTF8NFKC.normalizeUTF8NFKD.normalizedQueryHash.normalizedQueryHashKeepNames.notEmpty.notEquals.notILike.notIn.notInIgnoreSet.notLike.notNullIn.notNullInIgnoreSet.nothing.nothingNull.nothingUInt64.now.now64.nowInBlock.nowInBlock64.nth_value.ntile.nullIf.nullIn.nullInIgnoreSet.numbers.numericIndexedVectorAllValueSum.numericIndexedVectorBuild.numericIndexedVectorCardinality.numericIndexedVectorGetValue.numericIndexedVectorPointwiseAdd.numericIndexedVectorPointwiseDivide.numericIndexedVectorPointwiseEqual.numericIndexedVectorPointwiseGreater.numericIndexedVectorPointwiseGreaterEqual.numericIndexedVectorPointwiseLess.numericIndexedVectorPointwiseLessEqual.numericIndexedVectorPointwiseMultiply.numericIndexedVectorPointwiseNotEqual.numericIndexedVectorPointwiseSubtract.numericIndexedVectorShortDebugString.numericIndexedVectorToMap.overlay.overlayUTF8.parseDateTime.parseDateTime32BestEffort.parseDateTime32BestEffortOrNull.parseDateTime32BestEffortOrZero.parseDateTime64.parseDateTime64BestEffort.parseDateTime64BestEffortOrNull.parseDateTime64BestEffortOrZero.parseDateTime64BestEffortUS.parseDateTime64BestEffortUSOrNull.parseDateTime64BestEffortUSOrZero.parseDateTime64InJodaSyntax.parseDateTime64InJodaSyntaxOrNull.parseDateTime64InJodaSyntaxOrZero.parseDateTime64OrNull.parseDateTime64OrZero.parseDateTimeBestEffort.parseDateTimeBestEffortOrNull.parseDateTimeBestEffortOrZero.parseDateTimeBestEffortUS.parseDateTimeBestEffortUSOrNull.parseDateTimeBestEffortUSOrZero.parseDateTimeInJodaSyntax.parseDateTimeInJodaSyntaxOrNull.parseDateTimeInJodaSyntaxOrZero.parseDateTimeOrNull.parseDateTimeOrZero.parseReadableSize.parseReadableSizeOrNull.parseReadableSizeOrZero.parseTimeDelta.partitionID.partitionId.path.pathFull.percentRank.percent_rank.pi.plus.pmod.pmodOrNull.pointInEllipses.pointInPolygon.polygonAreaCartesian.polygonAreaSpherical.polygonConvexHullCartesian.polygonPerimeterCartesian.polygonPerimeterSpherical.polygonsDistanceCartesian.polygonsDistanceSpherical.polygonsEqualsCartesian.polygonsIntersectCartesian.polygonsIntersectSpherical.polygonsIntersectionCartesian.polygonsIntersectionSpherical.polygonsSymDifferenceCartesian.polygonsSymDifferenceSpherical.polygonsUnionCartesian.polygonsUnionSpherical.polygonsWithinCartesian.polygonsWithinSpherical.port.portRFC.position.positionCaseInsensitive.positionCaseInsensitiveUTF8.positionUTF8.positiveModulo.positiveModuloOrNull.positive_modulo.positive_modulo_or_null.pow.power.printf.proportionsZTest.protocol.punycodeDecode.punycodeEncode.quantile.quantileBFloat16.quantileBFloat16Weighted.quantileDD.quantileDeterministic.quantileExact.quantileExactExclusive.quantileExactHigh.quantileExactInclusive.quantileExactLow.quantileExactWeighted.quantileExactWeightedInterpolated.quantileGK.quantileInterpolatedWeighted.quantileTDigest.quantileTDigestWeighted.quantileTiming.quantileTimingWeighted.quantiles.quantilesBFloat16.quantilesBFloat16Weighted.quantilesDD.quantilesDeterministic.quantilesExact.quantilesExactExclusive.quantilesExactHigh.quantilesExactInclusive.quantilesExactLow.quantilesExactWeighted.quantilesExactWeightedInterpolated.quantilesGK.quantilesInterpolatedWeighted.quantilesTDigest.quantilesTDigestWeighted.quantilesTiming.quantilesTimingWeighted.queryID.queryString.queryStringAndFragment.query_id.radians.rand.rand32.rand64.randBernoulli.randBinomial.randCanonical.randChiSquared.randConstant.randExponential.randFisherF.randLogNormal.randNegativeBinomial.randNormal.randPoisson.randStudentT.randUniform.randomFixedString.randomPrintableASCII.randomString.randomStringUTF8.rank.rankCorr.readWKBLineString.readWKBMultiLineString.readWKBMultiPolygon.readWKBPoint.readWKBPolygon.readWKTLineString.readWKTMultiLineString.readWKTMultiPolygon.readWKTPoint.readWKTPolygon.readWKTRing.regexpExtract.regexpQuoteMeta.regionHierarchy.regionIn.regionToArea.regionToCity.regionToContinent.regionToCountry.regionToDistrict.regionToName.regionToPopulation.regionToTopContinent.reinterpret.reinterpretAsDate.reinterpretAsDateTime.reinterpretAsFixedString.reinterpretAsFloat32.reinterpretAsFloat64.reinterpretAsInt128.reinterpretAsInt16.reinterpretAsInt256.reinterpretAsInt32.reinterpretAsInt64.reinterpretAsInt8.reinterpretAsString.reinterpretAsUInt128.reinterpretAsUInt16.reinterpretAsUInt256.reinterpretAsUInt32.reinterpretAsUInt64.reinterpretAsUInt8.reinterpretAsUUID.repeat.replace.replaceAll.replaceOne.replaceRegexpAll.replaceRegexpOne.replicate.retention.reverse.reverseUTF8.revision.right.rightPad.rightPadUTF8.rightUTF8.round.roundAge.roundBankers.roundDown.roundDuration.roundToExp2.rowNumberInAllBlocks.rowNumberInBlock.row_number.rpad.rtrim.runningAccumulate.runningConcurrency.runningDifference.runningDifferenceStartingWithFirstValue.s2CapContains.s2CapUnion.s2CellsIntersect.s2GetNeighbors.s2RectAdd.s2RectContains.s2RectIntersection.s2RectUnion.s2ToGeo.scalarProduct.searchAll.searchAny.sequenceCount.sequenceMatch.sequenceMatchEvents.sequenceNextNode.seriesDecomposeSTL.seriesOutliersDetectTukey.seriesPeriodDetectFFT.serverTimeZone.serverTimezone.serverUUID.shardCount.shardNum.showCertificate.sigmoid.sign.simpleJSONExtractBool.simpleJSONExtractFloat.simpleJSONExtractInt.simpleJSONExtractRaw.simpleJSONExtractString.simpleJSONExtractUInt.simpleJSONHas.simpleLinearRegression.sin.singleValueOrNull.sinh.sipHash128.sipHash128Keyed.sipHash128Reference.sipHash128ReferenceKeyed.sipHash64.sipHash64Keyed.skewPop.skewSamp.sleep.sleepEachRow.snowflakeIDToDateTime.snowflakeIDToDateTime64.snowflakeToDateTime.snowflakeToDateTime64.soundex.space.sparkBar.sparkbar.sparseGrams.sparseGramsHashes.sparseGramsHashesUTF8.sparseGramsUTF8.splitByAlpha.splitByChar.splitByNonAlpha.splitByRegexp.splitByString.splitByWhitespace.sqid.sqidDecode.sqidEncode.sqrt.startsWith.startsWithUTF8.stddevPop.stddevPopStable.stddevSamp.stddevSampStable.stem.stochasticLinearRegression.stochasticLogisticRegression.str_to_date.str_to_map.stringBytesEntropy.stringBytesUniq.stringJaccardIndex.stringJaccardIndexUTF8.stringToH3.structureToCapnProtoSchema.structureToProtobufSchema.studentTTest.subBitmap.subDate.substr.substring.substringIndex.substringIndexUTF8.substringUTF8.subtractDays.subtractHours.subtractInterval.subtractMicroseconds.subtractMilliseconds.subtractMinutes.subtractMonths.subtractNanoseconds.subtractQuarters.subtractSeconds.subtractTupleOfIntervals.subtractWeeks.subtractYears.sum.sumCount.sumKahan.sumMapFiltered.sumMapFilteredWithOverflow.sumMapWithOverflow.sumMappedArrays.sumWithOverflow.svg.synonyms.tan.tanh.tcpPort.tgamma.theilsU.throwIf.tid.timeDiff.timeSeriesDeltaToGrid.timeSeriesDerivToGrid.timeSeriesFromGrid.timeSeriesGroupArray.timeSeriesIdToTags.timeSeriesIdToTagsGroup.timeSeriesIdeltaToGrid.timeSeriesInstantDeltaToGrid.timeSeriesInstantRateToGrid.timeSeriesIrateToGrid.timeSeriesLastToGrid.timeSeriesLastTwoSamples.timeSeriesPredictLinearToGrid.timeSeriesRange.timeSeriesRateToGrid.timeSeriesResampleToGridWithStaleness.timeSeriesStoreTags.timeSeriesTagsGroupToTags.timeSlot.timeSlots.timeZone.timeZoneOf.timeZoneOffset.time_bucket.timestamp.timestampDiff.timestamp_diff.timezone.timezoneOf.timezoneOffset.toBFloat16.toBFloat16OrNull.toBFloat16OrZero.toBool.toColumnTypeName.toDate.toDate32.toDate32OrDefault.toDate32OrNull.toDate32OrZero.toDateOrDefault.toDateOrNull.toDateOrZero.toDateTime.toDateTime32.toDateTime64.toDateTime64OrDefault.toDateTime64OrNull.toDateTime64OrZero.toDateTimeOrDefault.toDateTimeOrNull.toDateTimeOrZero.toDayOfMonth.toDayOfWeek.toDayOfYear.toDaysSinceYearZero.toDecimal128.toDecimal128OrDefault.toDecimal128OrNull.toDecimal128OrZero.toDecimal256.toDecimal256OrDefault.toDecimal256OrNull.toDecimal256OrZero.toDecimal32.toDecimal32OrDefault.toDecimal32OrNull.toDecimal32OrZero.toDecimal64.toDecimal64OrDefault.toDecimal64OrNull.toDecimal64OrZero.toDecimalString.toFixedString.toFloat32.toFloat32OrDefault.toFloat32OrNull.toFloat32OrZero.toFloat64.toFloat64OrDefault.toFloat64OrNull.toFloat64OrZero.toHour.toIPv4.toIPv4OrDefault.toIPv4OrNull.toIPv4OrZero.toIPv6.toIPv6OrDefault.toIPv6OrNull.toIPv6OrZero.toISOWeek.toISOYear.toInt128.toInt128OrDefault.toInt128OrNull.toInt128OrZero.toInt16.toInt16OrDefault.toInt16OrNull.toInt16OrZero.toInt256.toInt256OrDefault.toInt256OrNull.toInt256OrZero.toInt32.toInt32OrDefault.toInt32OrNull.toInt32OrZero.toInt64.toInt64OrDefault.toInt64OrNull.toInt64OrZero.toInt8.toInt8OrDefault.toInt8OrNull.toInt8OrZero.toInterval.toIntervalDay.toIntervalHour.toIntervalMicrosecond.toIntervalMillisecond.toIntervalMinute.toIntervalMonth.toIntervalNanosecond.toIntervalQuarter.toIntervalSecond.toIntervalWeek.toIntervalYear.toJSONString.toLastDayOfMonth.toLastDayOfWeek.toLowCardinality.toMillisecond.toMinute.toModifiedJulianDay.toModifiedJulianDayOrNull.toMonday.toMonth.toMonthNumSinceEpoch.toNullable.toQuarter.toRelativeDayNum.toRelativeHourNum.toRelativeMinuteNum.toRelativeMonthNum.toRelativeQuarterNum.toRelativeSecondNum.toRelativeWeekNum.toRelativeYearNum.toSecond.toStartOfDay.toStartOfFifteenMinutes.toStartOfFiveMinute.toStartOfFiveMinutes.toStartOfHour.toStartOfISOYear.toStartOfInterval.toStartOfMicrosecond.toStartOfMillisecond.toStartOfMinute.toStartOfMonth.toStartOfNanosecond.toStartOfQuarter.toStartOfSecond.toStartOfTenMinutes.toStartOfWeek.toStartOfYear.toString.toStringCutToZero.toTime.toTime64.toTime64OrNull.toTime64OrZero.toTimeOrNull.toTimeOrZero.toTimeWithFixedDate.toTimeZone.toTimezone.toTypeName.toUInt128.toUInt128OrDefault.toUInt128OrNull.toUInt128OrZero.toUInt16.toUInt16OrDefault.toUInt16OrNull.toUInt16OrZero.toUInt256.toUInt256OrDefault.toUInt256OrNull.toUInt256OrZero.toUInt32.toUInt32OrDefault.toUInt32OrNull.toUInt32OrZero.toUInt64.toUInt64OrDefault.toUInt64OrNull.toUInt64OrZero.toUInt8.toUInt8OrDefault.toUInt8OrNull.toUInt8OrZero.toUTCTimestamp.toUUID.toUUIDOrDefault.toUUIDOrNull.toUUIDOrZero.toUnixTimestamp.toUnixTimestamp64Micro.toUnixTimestamp64Milli.toUnixTimestamp64Nano.toUnixTimestamp64Second.toValidUTF8.toWeek.toYYYYMM.toYYYYMMDD.toYYYYMMDDhhmmss.toYear.toYearNumSinceEpoch.toYearWeek.to_utc_timestamp.today.tokens.topK.topKWeighted.topLevelDomain.topLevelDomainRFC.transactionID.transactionLatestSnapshot.transactionOldestSnapshot.transform.translate.translateUTF8.trim.trimBoth.trimLeft.trimRight.trunc.tryBase32Decode.tryBase58Decode.tryBase64Decode.tryBase64URLDecode.tryDecrypt.tryIdnaEncode.tryPunycodeDecode.tumble.tumbleEnd.tumbleStart.tuple.tupleConcat.tupleDivide.tupleDivideByNumber.tupleElement.tupleHammingDistance.tupleIntDiv.tupleIntDivByNumber.tupleIntDivOrZero.tupleIntDivOrZeroByNumber.tupleMinus.tupleModulo.tupleModuloByNumber.tupleMultiply.tupleMultiplyByNumber.tupleNames.tupleNegate.tuplePlus.tupleToNameValuePairs.ucase.unbin.unhex.uniq.uniqCombined.uniqCombined64.uniqExact.uniqHLL12.uniqTheta.uniqThetaIntersect.uniqThetaNot.uniqThetaUnion.uniqUpTo.upper.upperUTF8.uptime.user.validateNestedArraySizes.varPop.varPopStable.varSamp.varSampStable.variantElement.variantType.vectorDifference.vectorSum.version.visibleWidth.visitParamExtractBool.visitParamExtractFloat.visitParamExtractInt.visitParamExtractRaw.visitParamExtractString.visitParamExtractUInt.visitParamHas.week.welchTTest.widthBucket.width_bucket.windowFunnel.windowID.wkb.wkt.wordShingleMinHash.wordShingleMinHashArg.wordShingleMinHashArgCaseInsensitive.wordShingleMinHashArgCaseInsensitiveUTF8.wordShingleMinHashArgUTF8.wordShingleMinHashCaseInsensitive.wordShingleMinHashCaseInsensitiveUTF8.wordShingleMinHashUTF8.wordShingleSimHash.wordShingleSimHashCaseInsensitive.wordShingleSimHashCaseInsensitiveUTF8.wordShingleSimHashUTF8.wyHash64.xor.xxHash32.xxHash64.xxh3.yandexConsistentHash.yearweek.yesterday.zookeeperSessionUptime.MergeTree.ReplacingMergeTree.SummingMergeTree.AggregatingMergeTree.CollapsingMergeTree.VersionedCollapsingMergeTree.GraphiteMergeTree.CoalescingMergeTree.Atomic.Shared.Lazy.Replicated.PostgreSQL.MySQL.SQLite.MaterializedPostgreSQL.DataLakeCatalog".split("."), qt = /* @__PURE__ */ "ACCESS.ACTION.ADD.ADMIN.AFTER.ALGORITHM.ALIAS.ALL.ALLOWED_LATENESS.ALTER.AND.ANTI.APPEND.APPLY.AS.ASC.ASCENDING.ASOF.ASSUME.AST.ASYNC.ATTACH.AUTO_INCREMENT.AZURE.BACKUP.BAGEXPANSION.BASE_BACKUP.BCRYPT_HASH.BCRYPT_PASSWORD.BEGIN.BETWEEN.BIDIRECTIONAL.BOTH.BY.CACHE.CACHES.CASCADE.CASE.CHANGE.CHANGEABLE_IN_READONLY.CHANGED.CHARACTER.CHECK.CLEANUP.CLEAR.CLUSTER.CLUSTERS.CLUSTER_HOST_IDS.CN.CODEC.COLLATE.COLLECTION.COLUMN.COLUMNS.COMMENT.COMMIT.COMPRESSION.CONST.CONSTRAINT.CREATE.CROSS.CUBE.CURRENT.D.DATA.DATABASE.DATABASES.DAYS.DD.DDL.DEDUPLICATE.DEFAULT.DEFINER.DELAY.DELETE.DELETED.DEPENDS.DESC.DESCENDING.DESCRIBE.DETACH.DETACHED.DICTIONARIES.DICTIONARY.DISK.DISTINCT.DIV.DOUBLE_SHA1_HASH.DOUBLE_SHA1_PASSWORD.DROP.ELSE.ENABLED.END.ENFORCED.ENGINE.ENGINES.EPHEMERAL.ESTIMATE.EVENT.EVENTS.EVERY.EXCEPT.EXCHANGE.EXISTS.EXPLAIN.EXPRESSION.EXTENDED.EXTERNAL.FAKE.FALSE.FETCH.FIELDS.FILESYSTEM.FILL.FILTER.FINAL.FIRST.FOLLOWING.FOR.FOREIGN.FORMAT.FREEZE.FROM.FULL.FULLTEXT.FUNCTION.FUNCTIONS.GLOBAL.GRANT.GRANTEES.GRANTS.GRANULARITY.GROUP.GROUPING.GROUPS.H.HASH.HAVING.HDFS.HH.HIERARCHICAL.HOST.HOURS.HTTP.IDENTIFIED.ILIKE.IN.INDEX.INDEXES.INDICES.INFILE.INHERIT.INJECTIVE.INNER.INSERT.INTERPOLATE.INTERSECT.INTERVAL.INTO.INVISIBLE.INVOKER.IP.IS.IS_OBJECT_ID.JOIN.JWT.KERBEROS.KEY.KEYED.KEYS.KILL.KIND.LARGE.LAST.LAYOUT.LDAP.LEADING.LEVEL.LIFETIME.LIGHTWEIGHT.LIKE.LIMIT.LIMITS.LINEAR.LIST.LIVE.LOCAL.M.MASK.MATERIALIZED.MCS.MEMORY.MERGES.METRICS.MI.MICROSECOND.MICROSECONDS.MILLISECONDS.MINUTES.MM.MODIFY.MONTHS.MOVE.MS.MUTATION.N.NAME.NAMED.NANOSECOND.NANOSECONDS.NEXT.NO.NONE.NOT.NO_PASSWORD.NS.NULL.NULLS.OBJECT.OFFSET.ON.ONLY.OPTIMIZE.OPTION.OR.ORDER.OUTER.OUTFILE.OVER.OVERRIDABLE.OVERRIDE.PART.PARTIAL.PARTITION.PARTITIONS.PART_MOVE_TO_SHARD.PASTE.PERIODIC.PERMANENTLY.PERMISSIVE.PERSISTENT.PIPELINE.PLAINTEXT_PASSWORD.PLAN.POLICY.POPULATE.PRECEDING.PRECISION.PREWHERE.PRIMARY.PRIVILEGES.PROCESSLIST.PROFILE.PROJECTION.PROTOBUF.PULL.Q.QQ.QUALIFY.QUARTERS.QUERY.QUOTA.RANDOMIZE.RANDOMIZED.RANGE.READONLY.REALM.RECOMPRESS.RECURSIVE.REFERENCES.REFRESH.REGEXP.REMOVE.RENAME.RESET.RESPECT.RESTORE.RESTRICT.RESTRICTIVE.RESUME.REVOKE.ROLE.ROLES.ROLLBACK.ROLLUP.ROW.ROWS.S.S3.SALT.SAMPLE.SAN.SCHEME.SECONDS.SECURITY.SELECT.SEMI.SEQUENTIAL.SERVER.SET.SETS.SETTING.SETTINGS.SHA256_HASH.SHA256_PASSWORD.SHARD.SHOW.SIGNED.SIMPLE.SNAPSHOT.SOURCE.SPATIAL.SQL.SQL_TSI_DAY.SQL_TSI_HOUR.SQL_TSI_MICROSECOND.SQL_TSI_MILLISECOND.SQL_TSI_MINUTE.SQL_TSI_MONTH.SQL_TSI_NANOSECOND.SQL_TSI_QUARTER.SQL_TSI_SECOND.SQL_TSI_WEEK.SQL_TSI_YEAR.SS.SSH_KEY.SSL_CERTIFICATE.STALENESS.START.STATISTICS.STDOUT.STEP.STORAGE.STRICT.STRICTLY_ASCENDING.SUBPARTITION.SUBPARTITIONS.SUSPEND.SYNC.SYNTAX.SYSTEM.TABLE.TABLES.TAGS.TEMPORARY.TEST.THAN.THEN.TIES.TIME.TO.TOP.TOTALS.TRACKING.TRAILING.TRANSACTION.TREE.TRIGGER.TRUE.TRUNCATE.TTL.TYPE.TYPEOF.UNBOUNDED.UNDROP.UNFREEZE.UNION.UNIQUE.UNSET.UNSIGNED.UNTIL.UPDATE.URL.USE.USING.UUID.VALID.VALUES.VARYING.VIEW.VISIBLE.VOLUME.WATCH.WATERMARK.WEEKS.WHEN.WHERE.WINDOW.WITH.WITH_ITEMINDEX.WK.WRITABLE.WW.YEARS.YY.YYYY.ZKPATH".split("."), Jt = /* @__PURE__ */ "AGGREGATEFUNCTION.ARRAY.BFLOAT16.BIGINT.BIGINT SIGNED.BIGINT UNSIGNED.BINARY.BINARY LARGE OBJECT.BINARY VARYING.BIT.BLOB.BYTE.BYTEA.BOOL.CHAR.CHAR LARGE OBJECT.CHAR VARYING.CHARACTER.CHARACTER LARGE OBJECT.CHARACTER VARYING.CLOB.DEC.DOUBLE.DOUBLE PRECISION.DATE.DATE32.DATETIME.DATETIME32.DATETIME64.DECIMAL.DECIMAL128.DECIMAL256.DECIMAL32.DECIMAL64.DYNAMIC.ENUM.ENUM.ENUM16.ENUM8.FIXED.FLOAT.FIXEDSTRING.FLOAT32.FLOAT64.GEOMETRY.INET4.INET6.INT.INT SIGNED.INT UNSIGNED.INT1.INT1 SIGNED.INT1 UNSIGNED.INTEGER.INTEGER SIGNED.INTEGER UNSIGNED.IPV4.IPV6.INT128.INT16.INT256.INT32.INT64.INT8.INTERVALDAY.INTERVALHOUR.INTERVALMICROSECOND.INTERVALMILLISECOND.INTERVALMINUTE.INTERVALMONTH.INTERVALNANOSECOND.INTERVALQUARTER.INTERVALSECOND.INTERVALWEEK.INTERVALYEAR.JSON.LONGBLOB.LONGTEXT.LINESTRING.LOWCARDINALITY.MEDIUMBLOB.MEDIUMINT.MEDIUMINT SIGNED.MEDIUMINT UNSIGNED.MEDIUMTEXT.MAP.MULTILINESTRING.MULTIPOLYGON.NATIONAL CHAR.NATIONAL CHAR VARYING.NATIONAL CHARACTER.NATIONAL CHARACTER LARGE OBJECT.NATIONAL CHARACTER VARYING.NCHAR.NCHAR LARGE OBJECT.NCHAR VARYING.NUMERIC.NVARCHAR.NESTED.NOTHING.NULLABLE.OBJECT.POINT.POLYGON.REAL.RING.SET.SIGNED.SINGLE.SMALLINT.SMALLINT SIGNED.SMALLINT UNSIGNED.SIMPLEAGGREGATEFUNCTION.STRING.TEXT.TIMESTAMP.TINYBLOB.TINYINT.TINYINT SIGNED.TINYINT UNSIGNED.TINYTEXT.TIME.TIME64.TUPLE.UINT128.UINT16.UINT256.UINT32.UINT64.UINT8.UNSIGNED.UUID.VARBINARY.VARCHAR.VARCHAR2.VARIANT.YEAR.BOOL.BOOLEAN".split("."), Yt = w(["SELECT [DISTINCT]", "MODIFY QUERY SELECT [DISTINCT]"]), Xt = w(/* @__PURE__ */ "SET.WITH.FROM.SAMPLE.PREWHERE.WHERE.GROUP BY.HAVING.QUALIFY.ORDER BY.LIMIT.SETTINGS.INTO OUTFILE.FORMAT.WINDOW.PARTITION BY.INSERT INTO.VALUES.DEPENDS ON.MOVE {USER | ROLE | QUOTA | SETTINGS PROFILE | ROW POLICY}.GRANT.REVOKE.CHECK GRANT.SET [DEFAULT] ROLE [NONE | ALL | ALL EXCEPT].DEDUPLICATE BY.MODIFY STATISTICS.TYPE.ALTER USER [IF EXISTS].ALTER [ROW] POLICY [IF EXISTS].DROP {USER | ROLE | QUOTA | PROFILE | SETTINGS PROFILE | ROW POLICY | POLICY} [IF EXISTS]".split(".")), Zt = w(["CREATE [OR REPLACE] [TEMPORARY] TABLE [IF NOT EXISTS]"]), Qt = w(/* @__PURE__ */ "ALL EXCEPT.ON CLUSTER.UPDATE.SYSTEM RELOAD {DICTIONARIES | DICTIONARY | FUNCTIONS | FUNCTION | ASYNCHRONOUS METRICS}.SYSTEM DROP {DNS CACHE | MARK CACHE | ICEBERG METADATA CACHE | TEXT INDEX DICTIONARY CACHE | TEXT INDEX HEADER CACHE | TEXT INDEX POSTINGS CACHE | REPLICA | DATABASE REPLICA | UNCOMPRESSED CACHE | COMPILED EXPRESSION CACHE | QUERY CONDITION CACHE | QUERY CACHE | FORMAT SCHEMA CACHE | FILESYSTEM CACHE}.SYSTEM FLUSH LOGS.SYSTEM RELOAD {CONFIG | USERS}.SYSTEM SHUTDOWN.SYSTEM KILL.SYSTEM FLUSH DISTRIBUTED.SYSTEM START DISTRIBUTED SENDS.SYSTEM {STOP | START} {LISTEN | MERGES | TTL MERGES | MOVES | FETCHES | REPLICATED SENDS | REPLICATION QUEUES | PULLING REPLICATION LOG}.SYSTEM {SYNC | RESTART | RESTORE} REPLICA.SYSTEM {SYNC | RESTORE} DATABASE REPLICA.SYSTEM RESTART REPLICAS.SYSTEM UNFREEZE.SYSTEM WAIT LOADING PARTS.SYSTEM {LOAD | UNLOAD} PRIMARY KEY.SYSTEM {STOP | START} [REPLICATED] VIEW.SYSTEM {STOP | START} VIEWS.SYSTEM {REFRESH | CANCEL | WAIT} VIEW.WITH NAME.SHOW [CREATE] {TABLE | TEMPORARY TABLE | DICTIONARY | VIEW | DATABASE}.SHOW DATABASES [[NOT] {LIKE | ILIKE}].SHOW [FULL] [TEMPORARY] TABLES [FROM | IN].SHOW [EXTENDED] [FULL] COLUMNS {FROM | IN}.ATTACH {TABLE | DICTIONARY | DATABASE} [IF NOT EXISTS].DETACH {TABLE | DICTIONARY | DATABASE} [IF EXISTS].PERMANENTLY.SYNC.DROP {DICTIONARY | DATABASE | PROFILE | VIEW | FUNCTION | NAMED COLLECTION} [IF EXISTS].DROP [TEMPORARY] TABLE [IF EXISTS] [IF EMPTY].RENAME TO.EXISTS [TEMPORARY] {TABLE | DICTIONARY | DATABASE}.KILL QUERY.OPTIMIZE TABLE.RENAME {TABLE | DICTIONARY | DATABASE}.EXCHANGE {TABLES | DICTIONARIES}.TRUNCATE TABLE [IF EXISTS].EXECUTE AS.USE.TO.UNDROP TABLE.CREATE {DATABASE | NAMED COLLECTION} [IF NOT EXISTS].CREATE [OR REPLACE] {VIEW | DICTIONARY} [IF NOT EXISTS].CREATE MATERIALIZED VIEW [IF NOT EXISTS].CREATE FUNCTION.CREATE {USER | ROLE | QUOTA | SETTINGS PROFILE} [IF NOT EXISTS | OR REPLACE].CREATE [ROW] POLICY [IF NOT EXISTS | OR REPLACE].REPLACE [TEMPORARY] TABLE [IF NOT EXISTS].ALTER {ROLE | QUOTA | SETTINGS PROFILE} [IF EXISTS].ALTER [TEMPORARY] TABLE.ALTER NAMED COLLECTION [IF EXISTS].GRANTEES.NOT IDENTIFIED.RESET AUTHENTICATION METHODS TO NEW.{IDENTIFIED | ADD IDENTIFIED} [WITH | BY].[ADD | DROP] HOST {LOCAL | NAME | REGEXP | IP | LIKE}.VALID UNTIL.DROP [ALL] {PROFILES | SETTINGS}.{ADD | MODIFY} SETTINGS.ADD PROFILES.APPLY DELETED MASK.IN PARTITION.{ADD | DROP | RENAME | CLEAR | COMMENT | MODIFY | ALTER | MATERIALIZE} COLUMN.{DETACH | DROP | ATTACH | FETCH | MOVE} {PART | PARTITION}.DROP DETACHED {PART | PARTITION}.{FORGET | REPLACE} PARTITION.CLEAR COLUMN.{FREEZE | UNFREEZE} [PARTITION].CLEAR INDEX.TO {DISK | VOLUME}.[DELETE | REWRITE PARTS] IN PARTITION.{MODIFY | RESET} SETTING.DELETE WHERE.MODIFY ORDER BY.{MODIFY | REMOVE} SAMPLE BY.{ADD | MATERIALIZE | CLEAR} INDEX [IF NOT EXISTS].DROP INDEX [IF EXISTS].GRANULARITY.AFTER.FIRST.ADD CONSTRAINT [IF NOT EXISTS].DROP CONSTRAINT [IF EXISTS].MODIFY TTL.REMOVE TTL.ADD STATISTICS [IF NOT EXISTS].{DROP | CLEAR} STATISTICS [IF EXISTS].MATERIALIZE STATISTICS [ALL | IF EXISTS].KEYED BY.NOT KEYED.FOR [RANDOMIZED] INTERVAL.AS {PERMISSIVE | RESTRICTIVE}.FOR SELECT.ADD PROJECTION [IF NOT EXISTS].{DROP | MATERIALIZE | CLEAR} PROJECTION [IF EXISTS].REFRESH {EVERY | AFTER}.RANDOMIZE FOR.APPEND.APPEND TO.DELETE FROM.EXPLAIN [AST | SYNTAX | QUERY TREE | PLAN | PIPELINE | ESTIMATE | TABLE OVERRIDE].GRANT ON CLUSTER.GRANT CURRENT GRANTS.WITH GRANT OPTION.REVOKE ON CLUSTER.ADMIN OPTION FOR.CHECK TABLE.PARTITION ID.{DESC | DESCRIBE} TABLE".split(".")), $t = w(["UNION [ALL | DISTINCT]", "PARALLEL WITH"]), en = w(["[GLOBAL] [INNER|LEFT|RIGHT|FULL|CROSS] [OUTER|SEMI|ANTI|ANY|ALL|ASOF] JOIN", "[LEFT] ARRAY JOIN"]), tn = w(["{ROWS | RANGE} BETWEEN", "ALTER MATERIALIZE STATISTICS"]), nn = {
	name: "clickhouse",
	tokenizerOptions: {
		reservedSelect: Yt,
		reservedClauses: [
			...Xt,
			...Zt,
			...Qt
		],
		reservedSetOperations: $t,
		reservedJoins: en,
		reservedKeywordPhrases: tn,
		reservedKeywords: qt,
		reservedDataTypes: Jt,
		reservedFunctionNames: Kt,
		extraParens: ["[]", "{}"],
		lineCommentTypes: ["#", "--"],
		nestedBlockComments: !1,
		underscoresInNumbers: !0,
		stringTypes: ["$$", "''-qq-bs"],
		identTypes: ["\"\"-qq-bs", "``"],
		paramTypes: { custom: [{
			regex: String.raw`\{[^:']+:[^}]+\}`,
			key: (e) => {
				let t = /\{([^:]+):/.exec(e);
				return t ? t[1].trim() : e;
			}
		}] },
		operators: [
			"%",
			"||",
			"?",
			":",
			"==",
			"<=>",
			"->"
		],
		postProcess: rn
	},
	formatOptions: {
		onelineClauses: [...Zt, ...Qt],
		tabularOnelineClauses: Qt
	}
};
function rn(e) {
	return e.map((t, n) => {
		let r = e[n + 1] || D, i = e[n - 1] || D;
		return t.type === E.RESERVED_SELECT && (r.type === E.COMMA || i.type === E.RESERVED_CLAUSE || i.type === E.COMMA) ? Object.assign(Object.assign({}, t), { type: E.RESERVED_KEYWORD }) : k.SET(t) && r.type === E.OPEN_PAREN ? Object.assign(Object.assign({}, t), { type: E.RESERVED_FUNCTION_NAME }) : t;
	});
}
//#endregion
//#region node_modules/sql-formatter/dist/esm/languages/db2/db2.functions.js
var an = /* @__PURE__ */ "ARRAY_AGG.AVG.CORRELATION.COUNT.COUNT_BIG.COVARIANCE.COVARIANCE_SAMP.CUME_DIST.GROUPING.LISTAGG.MAX.MEDIAN.MIN.PERCENTILE_CONT.PERCENTILE_DISC.PERCENT_RANK.REGR_AVGX.REGR_AVGY.REGR_COUNT.REGR_INTERCEPT.REGR_ICPT.REGR_R2.REGR_SLOPE.REGR_SXX.REGR_SXY.REGR_SYY.STDDEV.STDDEV_SAMP.SUM.VARIANCE.VARIANCE_SAMP.XMLAGG.XMLGROUP.ABS.ABSVAL.ACOS.ADD_DAYS.ADD_HOURS.ADD_MINUTES.ADD_MONTHS.ADD_SECONDS.ADD_YEARS.AGE.ARRAY_DELETE.ARRAY_FIRST.ARRAY_LAST.ARRAY_NEXT.ARRAY_PRIOR.ASCII.ASCII_STR.ASIN.ATAN.ATAN2.ATANH.BITAND.BITANDNOT.BITOR.BITXOR.BITNOT.BPCHAR.BSON_TO_JSON.BTRIM.CARDINALITY.CEILING.CEIL.CHARACTER_LENGTH.CHR.COALESCE.COLLATION_KEY.COLLATION_KEY_BIT.COMPARE_DECFLOAT.CONCAT.COS.COSH.COT.CURSOR_ROWCOUNT.DATAPARTITIONNUM.DATE_PART.DATE_TRUNC.DAY.DAYNAME.DAYOFMONTH.DAYOFWEEK.DAYOFWEEK_ISO.DAYOFYEAR.DAYS.DAYS_BETWEEN.DAYS_TO_END_OF_MONTH.DBPARTITIONNUM.DECFLOAT.DECFLOAT_FORMAT.DECODE.DECRYPT_BIN.DECRYPT_CHAR.DEGREES.DEREF.DIFFERENCE.DIGITS.DOUBLE_PRECISION.EMPTY_BLOB.EMPTY_CLOB.EMPTY_DBCLOB.EMPTY_NCLOB.ENCRYPT.EVENT_MON_STATE.EXP.EXTRACT.FIRST_DAY.FLOOR.FROM_UTC_TIMESTAMP.GENERATE_UNIQUE.GETHINT.GREATEST.HASH.HASH4.HASH8.HASHEDVALUE.HEX.HEXTORAW.HOUR.HOURS_BETWEEN.IDENTITY_VAL_LOCAL.IFNULL.INITCAP.INSERT.INSTR.INSTR2.INSTR4.INSTRB.INTNAND.INTNOR.INTNXOR.INTNNOT.ISNULL.JSON_ARRAY.JSON_OBJECT.JSON_QUERY.JSON_TO_BSON.JSON_VALUE.JULIAN_DAY.LAST_DAY.LCASE.LEAST.LEFT.LENGTH.LENGTH2.LENGTH4.LENGTHB.LN.LOCATE.LOCATE_IN_STRING.LOG10.LONG_VARCHAR.LONG_VARGRAPHIC.LOWER.LPAD.LTRIM.MAX.MAX_CARDINALITY.MICROSECOND.MIDNIGHT_SECONDS.MIN.MINUTE.MINUTES_BETWEEN.MOD.MONTH.MONTHNAME.MONTHS_BETWEEN.MULTIPLY_ALT.NEXT_DAY.NEXT_MONTH.NEXT_QUARTER.NEXT_WEEK.NEXT_YEAR.NORMALIZE_DECFLOAT.NOW.NULLIF.NVL.NVL2.OCTET_LENGTH.OVERLAY.PARAMETER.POSITION.POSSTR.POW.POWER.QUANTIZE.QUARTER.QUOTE_IDENT.QUOTE_LITERAL.RADIANS.RAISE_ERROR.RAND.RANDOM.RAWTOHEX.REC2XML.REGEXP_COUNT.REGEXP_EXTRACT.REGEXP_INSTR.REGEXP_LIKE.REGEXP_MATCH_COUNT.REGEXP_REPLACE.REGEXP_SUBSTR.REPEAT.REPLACE.RID.RID_BIT.RIGHT.ROUND.ROUND_TIMESTAMP.RPAD.RTRIM.SECLABEL.SECLABEL_BY_NAME.SECLABEL_TO_CHAR.SECOND.SECONDS_BETWEEN.SIGN.SIN.SINH.SOUNDEX.SPACE.SQRT.STRIP.STRLEFT.STRPOS.STRRIGHT.SUBSTR.SUBSTR2.SUBSTR4.SUBSTRB.SUBSTRING.TABLE_NAME.TABLE_SCHEMA.TAN.TANH.THIS_MONTH.THIS_QUARTER.THIS_WEEK.THIS_YEAR.TIMESTAMP_FORMAT.TIMESTAMP_ISO.TIMESTAMPDIFF.TIMEZONE.TO_CHAR.TO_CLOB.TO_DATE.TO_HEX.TO_MULTI_BYTE.TO_NCHAR.TO_NCLOB.TO_NUMBER.TO_SINGLE_BYTE.TO_TIMESTAMP.TO_UTC_TIMESTAMP.TOTALORDER.TRANSLATE.TRIM.TRIM_ARRAY.TRUNC_TIMESTAMP.TRUNCATE.TRUNC.TYPE_ID.TYPE_NAME.TYPE_SCHEMA.UCASE.UNICODE_STR.UPPER.VALUE.VARCHAR_BIT_FORMAT.VARCHAR_FORMAT.VARCHAR_FORMAT_BIT.VERIFY_GROUP_FOR_USER.VERIFY_ROLE_FOR_USER.VERIFY_TRUSTED_CONTEXT_ROLE_FOR_USER.WEEK.WEEK_ISO.WEEKS_BETWEEN.WIDTH_BUCKET.XMLATTRIBUTES.XMLCOMMENT.XMLCONCAT.XMLDOCUMENT.XMLELEMENT.XMLFOREST.XMLNAMESPACES.XMLPARSE.XMLPI.XMLQUERY.XMLROW.XMLSERIALIZE.XMLTEXT.XMLVALIDATE.XMLXSROBJECTID.XSLTRANSFORM.YEAR.YEARS_BETWEEN.YMD_BETWEEN.BASE_TABLE.JSON_TABLE.UNNEST.XMLTABLE.RANK.DENSE_RANK.NTILE.LAG.LEAD.ROW_NUMBER.FIRST_VALUE.LAST_VALUE.NTH_VALUE.RATIO_TO_REPORT.CAST".split("."), on = /* @__PURE__ */ "ACTIVATE.ADD.AFTER.ALIAS.ALL.ALLOCATE.ALLOW.ALTER.AND.ANY.AS.ASENSITIVE.ASSOCIATE.ASUTIME.AT.ATTRIBUTES.AUDIT.AUTHORIZATION.AUX.AUXILIARY.BEFORE.BEGIN.BETWEEN.BINARY.BUFFERPOOL.BY.CACHE.CALL.CALLED.CAPTURE.CARDINALITY.CASCADED.CASE.CAST.CHECK.CLONE.CLOSE.CLUSTER.COLLECTION.COLLID.COLUMN.COMMENT.COMMIT.CONCAT.CONDITION.CONNECT.CONNECTION.CONSTRAINT.CONTAINS.CONTINUE.COUNT.COUNT_BIG.CREATE.CROSS.CURRENT.CURRENT_DATE.CURRENT_LC_CTYPE.CURRENT_PATH.CURRENT_SCHEMA.CURRENT_SERVER.CURRENT_TIME.CURRENT_TIMESTAMP.CURRENT_TIMEZONE.CURRENT_USER.CURSOR.CYCLE.DATA.DATABASE.DATAPARTITIONNAME.DATAPARTITIONNUM.DAY.DAYS.DB2GENERAL.DB2GENRL.DB2SQL.DBINFO.DBPARTITIONNAME.DBPARTITIONNUM.DEALLOCATE.DECLARE.DEFAULT.DEFAULTS.DEFINITION.DELETE.DENSERANK.DENSE_RANK.DESCRIBE.DESCRIPTOR.DETERMINISTIC.DIAGNOSTICS.DISABLE.DISALLOW.DISCONNECT.DISTINCT.DO.DOCUMENT.DROP.DSSIZE.DYNAMIC.EACH.EDITPROC.ELSE.ELSEIF.ENABLE.ENCODING.ENCRYPTION.END.END-EXEC.ENDING.ERASE.ESCAPE.EVERY.EXCEPT.EXCEPTION.EXCLUDING.EXCLUSIVE.EXECUTE.EXISTS.EXIT.EXPLAIN.EXTENDED.EXTERNAL.EXTRACT.FENCED.FETCH.FIELDPROC.FILE.FINAL.FIRST1.FOR.FOREIGN.FREE.FROM.FULL.FUNCTION.GENERAL.GENERATED.GET.GLOBAL.GO.GOTO.GRANT.GRAPHIC.GROUP.HANDLER.HASH.HASHED_VALUE.HAVING.HINT.HOLD.HOUR.HOURS.IDENTITY.IF.IMMEDIATE.IMPORT.IN.INCLUDING.INCLUSIVE.INCREMENT.INDEX.INDICATOR.INDICATORS.INF.INFINITY.INHERIT.INNER.INOUT.INSENSITIVE.INSERT.INTEGRITY.INTERSECT.INTO.IS.ISNULL.ISOBID.ISOLATION.ITERATE.JAR.JAVA.JOIN.KEEP.KEY.LABEL.LANGUAGE.LAST3.LATERAL.LC_CTYPE.LEAVE.LEFT.LIKE.LIMIT.LINKTYPE.LOCAL.LOCALDATE.LOCALE.LOCALTIME.LOCALTIMESTAMP.LOCATOR.LOCATORS.LOCK.LOCKMAX.LOCKSIZE.LOOP.MAINTAINED.MATERIALIZED.MAXVALUE.MICROSECOND.MICROSECONDS.MINUTE.MINUTES.MINVALUE.MODE.MODIFIES.MONTH.MONTHS.NAN.NEW.NEW_TABLE.NEXTVAL.NO.NOCACHE.NOCYCLE.NODENAME.NODENUMBER.NOMAXVALUE.NOMINVALUE.NONE.NOORDER.NORMALIZED.NOT2.NOTNULL.NULL.NULLS.NUMPARTS.OBID.OF.OFF.OFFSET.OLD.OLD_TABLE.ON.OPEN.OPTIMIZATION.OPTIMIZE.OPTION.OR.ORDER.OUT.OUTER.OVER.OVERRIDING.PACKAGE.PADDED.PAGESIZE.PARAMETER.PART.PARTITION.PARTITIONED.PARTITIONING.PARTITIONS.PASSWORD.PATH.PERCENT.PIECESIZE.PLAN.POSITION.PRECISION.PREPARE.PREVVAL.PRIMARY.PRIQTY.PRIVILEGES.PROCEDURE.PROGRAM.PSID.PUBLIC.QUERY.QUERYNO.RANGE.RANK.READ.READS.RECOVERY.REFERENCES.REFERENCING.REFRESH.RELEASE.RENAME.REPEAT.RESET.RESIGNAL.RESTART.RESTRICT.RESULT.RESULT_SET_LOCATOR.RETURN.RETURNS.REVOKE.RIGHT.ROLE.ROLLBACK.ROUND_CEILING.ROUND_DOWN.ROUND_FLOOR.ROUND_HALF_DOWN.ROUND_HALF_EVEN.ROUND_HALF_UP.ROUND_UP.ROUTINE.ROW.ROWNUMBER.ROWS.ROWSET.ROW_NUMBER.RRN.RUN.SAVEPOINT.SCHEMA.SCRATCHPAD.SCROLL.SEARCH.SECOND.SECONDS.SECQTY.SECURITY.SELECT.SENSITIVE.SEQUENCE.SESSION.SESSION_USER.SET.SIGNAL.SIMPLE.SNAN.SOME.SOURCE.SPECIFIC.SQL.SQLID.STACKED.STANDARD.START.STARTING.STATEMENT.STATIC.STATMENT.STAY.STOGROUP.STORES.STYLE.SUBSTRING.SUMMARY.SYNONYM.SYSFUN.SYSIBM.SYSPROC.SYSTEM.SYSTEM_USER.TABLE.TABLESPACE.THEN.TO.TRANSACTION.TRIGGER.TRIM.TRUNCATE.TYPE.UNDO.UNION.UNIQUE.UNTIL.UPDATE.USAGE.USER.USING.VALIDPROC.VALUE.VALUES.VARIABLE.VARIANT.VCAT.VERSION.VIEW.VOLATILE.VOLUMES.WHEN.WHENEVER.WHERE.WHILE.WITH.WITHOUT.WLM.WRITE.XMLELEMENT.XMLEXISTS.XMLNAMESPACES.YEAR.YEARS".split("."), sn = /* @__PURE__ */ "ARRAY.BIGINT.BINARY.BLOB.BOOLEAN.CCSID.CHAR.CHARACTER.CLOB.DATE.DATETIME.DBCLOB.DEC.DECIMAL.DOUBLE.DOUBLE PRECISION.FLOAT.FLOAT4.FLOAT8.GRAPHIC.INT.INT2.INT4.INT8.INTEGER.INTERVAL.LONG VARCHAR.LONG VARGRAPHIC.NCHAR.NCHR.NCLOB.NVARCHAR.NUMERIC.SMALLINT.REAL.TIME.TIMESTAMP.VARBINARY.VARCHAR.VARGRAPHIC".split("."), cn = w(["SELECT [ALL | DISTINCT]"]), ln = w([
	"WITH",
	"FROM",
	"WHERE",
	"GROUP BY",
	"HAVING",
	"PARTITION BY",
	"ORDER BY [INPUT SEQUENCE]",
	"LIMIT",
	"OFFSET",
	"FETCH NEXT",
	"FOR UPDATE [OF]",
	"FOR {READ | FETCH} ONLY",
	"FOR {RR | CS | UR | RS} [USE AND KEEP {SHARE | UPDATE | EXCLUSIVE} LOCKS]",
	"WAIT FOR OUTCOME",
	"SKIP LOCKED DATA",
	"INTO",
	"INSERT INTO",
	"VALUES",
	"SET",
	"MERGE INTO",
	"WHEN [NOT] MATCHED [THEN]",
	"UPDATE SET",
	"INSERT"
]), un = w(["CREATE [GLOBAL TEMPORARY | EXTERNAL] TABLE [IF NOT EXISTS]"]), dn = w(/* @__PURE__ */ "CREATE [OR REPLACE] VIEW.UPDATE.WHERE CURRENT OF.WITH {RR | RS | CS | UR}.DELETE FROM.DROP TABLE [IF EXISTS].ALTER TABLE.ADD [COLUMN].DROP [COLUMN].RENAME COLUMN.ALTER [COLUMN].SET DATA TYPE.SET NOT NULL.DROP {DEFAULT | GENERATED | NOT NULL}.TRUNCATE [TABLE].ALLOCATE.ALTER AUDIT POLICY.ALTER BUFFERPOOL.ALTER DATABASE PARTITION GROUP.ALTER DATABASE.ALTER EVENT MONITOR.ALTER FUNCTION.ALTER HISTOGRAM TEMPLATE.ALTER INDEX.ALTER MASK.ALTER METHOD.ALTER MODULE.ALTER NICKNAME.ALTER PACKAGE.ALTER PERMISSION.ALTER PROCEDURE.ALTER SCHEMA.ALTER SECURITY LABEL COMPONENT.ALTER SECURITY POLICY.ALTER SEQUENCE.ALTER SERVER.ALTER SERVICE CLASS.ALTER STOGROUP.ALTER TABLESPACE.ALTER THRESHOLD.ALTER TRIGGER.ALTER TRUSTED CONTEXT.ALTER TYPE.ALTER USAGE LIST.ALTER USER MAPPING.ALTER VIEW.ALTER WORK ACTION SET.ALTER WORK CLASS SET.ALTER WORKLOAD.ALTER WRAPPER.ALTER XSROBJECT.ALTER STOGROUP.ALTER TABLESPACE.ALTER TRIGGER.ALTER TRUSTED CONTEXT.ALTER VIEW.ASSOCIATE [RESULT SET] {LOCATOR | LOCATORS}.AUDIT.BEGIN DECLARE SECTION.CALL.CLOSE.COMMENT ON.COMMIT [WORK].CONNECT.CREATE [OR REPLACE] [PUBLIC] ALIAS.CREATE AUDIT POLICY.CREATE BUFFERPOOL.CREATE DATABASE PARTITION GROUP.CREATE EVENT MONITOR.CREATE [OR REPLACE] FUNCTION.CREATE FUNCTION MAPPING.CREATE HISTOGRAM TEMPLATE.CREATE [UNIQUE] INDEX.CREATE INDEX EXTENSION.CREATE [OR REPLACE] MASK.CREATE [SPECIFIC] METHOD.CREATE [OR REPLACE] MODULE.CREATE [OR REPLACE] NICKNAME.CREATE [OR REPLACE] PERMISSION.CREATE [OR REPLACE] PROCEDURE.CREATE ROLE.CREATE SCHEMA.CREATE SECURITY LABEL [COMPONENT].CREATE SECURITY POLICY.CREATE [OR REPLACE] SEQUENCE.CREATE SERVICE CLASS.CREATE SERVER.CREATE STOGROUP.CREATE SYNONYM.CREATE [LARGE | REGULAR | {SYSTEM | USER} TEMPORARY] TABLESPACE.CREATE THRESHOLD.CREATE {TRANSFORM | TRANSFORMS} FOR.CREATE [OR REPLACE] TRIGGER.CREATE TRUSTED CONTEXT.CREATE [OR REPLACE] TYPE.CREATE TYPE MAPPING.CREATE USAGE LIST.CREATE USER MAPPING FOR.CREATE [OR REPLACE] VARIABLE.CREATE WORK ACTION SET.CREATE WORK CLASS SET.CREATE WORKLOAD.CREATE WRAPPER.DECLARE.DECLARE GLOBAL TEMPORARY TABLE.DESCRIBE [INPUT | OUTPUT].DISCONNECT.DROP [PUBLIC] ALIAS.DROP AUDIT POLICY.DROP BUFFERPOOL.DROP DATABASE PARTITION GROUP.DROP EVENT MONITOR.DROP [SPECIFIC] FUNCTION.DROP FUNCTION MAPPING.DROP HISTOGRAM TEMPLATE.DROP INDEX [EXTENSION].DROP MASK.DROP [SPECIFIC] METHOD.DROP MODULE.DROP NICKNAME.DROP PACKAGE.DROP PERMISSION.DROP [SPECIFIC] PROCEDURE.DROP ROLE.DROP SCHEMA.DROP SECURITY LABEL [COMPONENT].DROP SECURITY POLICY.DROP SEQUENCE.DROP SERVER.DROP SERVICE CLASS.DROP STOGROUP.DROP TABLE HIERARCHY.DROP {TABLESPACE | TABLESPACES}.DROP {TRANSFORM | TRANSFORMS}.DROP THRESHOLD.DROP TRIGGER.DROP TRUSTED CONTEXT.DROP TYPE [MAPPING].DROP USAGE LIST.DROP USER MAPPING FOR.DROP VARIABLE.DROP VIEW [HIERARCHY].DROP WORK {ACTION | CLASS} SET.DROP WORKLOAD.DROP WRAPPER.DROP XSROBJECT.END DECLARE SECTION.EXECUTE [IMMEDIATE].EXPLAIN {PLAN [SECTION] | ALL}.FETCH [FROM].FLUSH {BUFFERPOOL | BUFFERPOOLS} ALL.FLUSH EVENT MONITOR.FLUSH FEDERATED CACHE.FLUSH OPTIMIZATION PROFILE CACHE.FLUSH PACKAGE CACHE [DYNAMIC].FLUSH AUTHENTICATION CACHE [FOR ALL].FREE LOCATOR.GET DIAGNOSTICS.GOTO.GRANT.INCLUDE.ITERATE.LEAVE.LOCK TABLE.LOOP.OPEN.PIPE.PREPARE.REFRESH TABLE.RELEASE.RELEASE [TO] SAVEPOINT.RENAME [TABLE | INDEX | STOGROUP | TABLESPACE].REPEAT.RESIGNAL.RETURN.REVOKE.ROLLBACK [WORK] [TO SAVEPOINT].SAVEPOINT.SET COMPILATION ENVIRONMENT.SET CONNECTION.SET CURRENT.SET ENCRYPTION PASSWORD.SET EVENT MONITOR STATE.SET INTEGRITY.SET PASSTHRU.SET PATH.SET ROLE.SET SCHEMA.SET SERVER OPTION.SET {SESSION AUTHORIZATION | SESSION_USER}.SET USAGE LIST.SIGNAL.TRANSFER OWNERSHIP OF.WHENEVER {NOT FOUND | SQLERROR | SQLWARNING}.WHILE".split(".")), fn = w([
	"UNION [ALL]",
	"EXCEPT [ALL]",
	"INTERSECT [ALL]"
]), pn = w([
	"JOIN",
	"{LEFT | RIGHT | FULL} [OUTER] JOIN",
	"{INNER | CROSS} JOIN"
]), mn = w([
	"ON DELETE",
	"ON UPDATE",
	"SET NULL",
	"{ROWS | RANGE} BETWEEN"
]), hn = w([]), gn = {
	name: "db2",
	tokenizerOptions: {
		reservedSelect: cn,
		reservedClauses: [
			...ln,
			...un,
			...dn
		],
		reservedSetOperations: fn,
		reservedJoins: pn,
		reservedKeywordPhrases: mn,
		reservedDataTypePhrases: hn,
		reservedKeywords: on,
		reservedDataTypes: sn,
		reservedFunctionNames: an,
		extraParens: ["[]"],
		stringTypes: [{
			quote: "''-qq",
			prefixes: [
				"G",
				"N",
				"U&"
			]
		}, {
			quote: "''-raw",
			prefixes: [
				"X",
				"BX",
				"GX",
				"UX"
			],
			requirePrefix: !0
		}],
		identTypes: ["\"\"-qq"],
		identChars: {
			first: "@#$",
			rest: "@#$"
		},
		paramTypes: {
			positional: !0,
			named: [":"]
		},
		paramChars: {
			first: "@#$",
			rest: "@#$"
		},
		operators: [
			"**",
			"%",
			"|",
			"&",
			"^",
			"~",
			"¬=",
			"¬>",
			"¬<",
			"!>",
			"!<",
			"^=",
			"^>",
			"^<",
			"||",
			"->",
			"=>"
		]
	},
	formatOptions: {
		onelineClauses: [...un, ...dn],
		tabularOnelineClauses: dn
	}
}, _n = /* @__PURE__ */ "ARRAY_AGG.AVG.CORR.CORRELATION.COUNT.COUNT_BIG.COVAR_POP.COVARIANCE.COVAR.COVAR_SAMP.COVARIANCE_SAMP.EVERY.GROUPING.JSON_ARRAYAGG.JSON_OBJECTAGG.LISTAGG.MAX.MEDIAN.MIN.PERCENTILE_CONT.PERCENTILE_DISC.REGR_AVGX.REGR_AVGY.REGR_COUNT.REGR_INTERCEPT.REGR_R2.REGR_SLOPE.REGR_SXX.REGR_SXY.REGR_SYY.SOME.STDDEV_POP.STDDEV.STDDEV_SAMP.SUM.VAR_POP.VARIANCE.VAR.VAR_SAMP.VARIANCE_SAMP.XMLAGG.XMLGROUP.ABS.ABSVAL.ACOS.ADD_DAYS.ADD_HOURS.ADD_MINUTES.ADD_MONTHS.ADD_SECONDS.ADD_YEARS.ANTILOG.ARRAY_MAX_CARDINALITY.ARRAY_TRIM.ASCII.ASIN.ATAN.ATAN2.ATANH.BASE64_DECODE.BASE64_ENCODE.BIT_LENGTH.BITAND.BITANDNOT.BITNOT.BITOR.BITXOR.BSON_TO_JSON.CARDINALITY.CEIL.CEILING.CHAR_LENGTH.CHARACTER_LENGTH.CHR.COALESCE.COMPARE_DECFLOAT.CONCAT.CONTAINS.COS.COSH.COT.CURDATE.CURTIME.DATABASE.DATAPARTITIONNAME.DATAPARTITIONNUM.DAY.DAYNAME.DAYOFMONTH.DAYOFWEEK_ISO.DAYOFWEEK.DAYOFYEAR.DAYS.DBPARTITIONNAME.DBPARTITIONNUM.DECFLOAT_FORMAT.DECFLOAT_SORTKEY.DECRYPT_BINARY.DECRYPT_BIT.DECRYPT_CHAR.DECRYPT_DB.DEGREES.DIFFERENCE.DIGITS.DLCOMMENT.DLLINKTYPE.DLURLCOMPLETE.DLURLPATH.DLURLPATHONLY.DLURLSCHEME.DLURLSERVER.DLVALUE.DOUBLE_PRECISION.DOUBLE.ENCRPYT.ENCRYPT_AES.ENCRYPT_AES256.ENCRYPT_RC2.ENCRYPT_TDES.EXP.EXTRACT.FIRST_DAY.FLOOR.GENERATE_UNIQUE.GET_BLOB_FROM_FILE.GET_CLOB_FROM_FILE.GET_DBCLOB_FROM_FILE.GET_XML_FILE.GETHINT.GREATEST.HASH_MD5.HASH_ROW.HASH_SHA1.HASH_SHA256.HASH_SHA512.HASH_VALUES.HASHED_VALUE.HEX.HEXTORAW.HOUR.HTML_ENTITY_DECODE.HTML_ENTITY_ENCODE.HTTP_DELETE_BLOB.HTTP_DELETE.HTTP_GET_BLOB.HTTP_GET.HTTP_PATCH_BLOB.HTTP_PATCH.HTTP_POST_BLOB.HTTP_POST.HTTP_PUT_BLOB.HTTP_PUT.IDENTITY_VAL_LOCAL.IFNULL.INSERT.INSTR.INTERPRET.ISFALSE.ISNOTFALSE.ISNOTTRUE.ISTRUE.JSON_ARRAY.JSON_OBJECT.JSON_QUERY.JSON_TO_BSON.JSON_UPDATE.JSON_VALUE.JULIAN_DAY.LAND.LAST_DAY.LCASE.LEAST.LEFT.LENGTH.LN.LNOT.LOCATE_IN_STRING.LOCATE.LOG10.LOR.LOWER.LPAD.LTRIM.MAX_CARDINALITY.MAX.MICROSECOND.MIDNIGHT_SECONDS.MIN.MINUTE.MOD.MONTH.MONTHNAME.MONTHS_BETWEEN.MQREAD.MQREADCLOB.MQRECEIVE.MQRECEIVECLOB.MQSEND.MULTIPLY_ALT.NEXT_DAY.NORMALIZE_DECFLOAT.NOW.NULLIF.NVL.OCTET_LENGTH.OVERLAY.PI.POSITION.POSSTR.POW.POWER.QUANTIZE.QUARTER.RADIANS.RAISE_ERROR.RANDOM.RAND.REGEXP_COUNT.REGEXP_INSTR.REGEXP_REPLACE.REGEXP_SUBSTR.REPEAT.REPLACE.RID.RIGHT.ROUND_TIMESTAMP.ROUND.RPAD.RRN.RTRIM.SCORE.SECOND.SIGN.SIN.SINH.SOUNDEX.SPACE.SQRT.STRIP.STRLEFT.STRPOS.STRRIGHT.SUBSTR.SUBSTRING.TABLE_NAME.TABLE_SCHEMA.TAN.TANH.TIMESTAMP_FORMAT.TIMESTAMP_ISO.TIMESTAMPDIFF_BIG.TIMESTAMPDIFF.TO_CHAR.TO_CLOB.TO_DATE.TO_NUMBER.TO_TIMESTAMP.TOTALORDER.TRANSLATE.TRIM_ARRAY.TRIM.TRUNC_TIMESTAMP.TRUNC.TRUNCATE.UCASE.UPPER.URL_DECODE.URL_ENCODE.VALUE.VARBINARY_FORMAT.VARCHAR_BIT_FORMAT.VARCHAR_FORMAT_BINARY.VARCHAR_FORMAT.VERIFY_GROUP_FOR_USER.WEEK_ISO.WEEK.WRAP.XMLATTRIBUTES.XMLCOMMENT.XMLCONCAT.XMLDOCUMENT.XMLELEMENT.XMLFOREST.XMLNAMESPACES.XMLPARSE.XMLPI.XMLROW.XMLSERIALIZE.XMLTEXT.XMLVALIDATE.XOR.XSLTRANSFORM.YEAR.ZONED.BASE_TABLE.HTTP_DELETE_BLOB_VERBOSE.HTTP_DELETE_VERBOSE.HTTP_GET_BLOB_VERBOSE.HTTP_GET_VERBOSE.HTTP_PATCH_BLOB_VERBOSE.HTTP_PATCH_VERBOSE.HTTP_POST_BLOB_VERBOSE.HTTP_POST_VERBOSE.HTTP_PUT_BLOB_VERBOSE.HTTP_PUT_VERBOSE.JSON_TABLE.MQREADALL.MQREADALLCLOB.MQRECEIVEALL.MQRECEIVEALLCLOB.XMLTABLE.UNPACK.CUME_DIST.DENSE_RANK.FIRST_VALUE.LAG.LAST_VALUE.LEAD.NTH_VALUE.NTILE.PERCENT_RANK.RANK.RATIO_TO_REPORT.ROW_NUMBER.CAST".split("."), vn = /* @__PURE__ */ "ABSENT.ACCORDING.ACCTNG.ACTION.ACTIVATE.ADD.ALIAS.ALL.ALLOCATE.ALLOW.ALTER.AND.ANY.APPEND.APPLNAME.ARRAY.ARRAY_AGG.ARRAY_TRIM.AS.ASC.ASENSITIVE.ASSOCIATE.ATOMIC.ATTACH.ATTRIBUTES.AUTHORIZATION.AUTONOMOUS.BEFORE.BEGIN.BETWEEN.BIND.BSON.BUFFERPOOL.BY.CACHE.CALL.CALLED.CARDINALITY.CASE.CAST.CHECK.CL.CLOSE.CLUSTER.COLLECT.COLLECTION.COLUMN.COMMENT.COMMIT.COMPACT.COMPARISONS.COMPRESS.CONCAT.CONCURRENT.CONDITION.CONNECT.CONNECT_BY_ROOT.CONNECTION.CONSTANT.CONSTRAINT.CONTAINS.CONTENT.CONTINUE.COPY.COUNT.COUNT_BIG.CREATE.CREATEIN.CROSS.CUBE.CUME_DIST.CURRENT.CURRENT_DATE.CURRENT_PATH.CURRENT_SCHEMA.CURRENT_SERVER.CURRENT_TIME.CURRENT_TIMESTAMP.CURRENT_TIMEZONE.CURRENT_USER.CURSOR.CYCLE.DATABASE.DATAPARTITIONNAME.DATAPARTITIONNUM.DAY.DAYS.DB2GENERAL.DB2GENRL.DB2SQL.DBINFO.DBPARTITIONNAME.DBPARTITIONNUM.DEACTIVATE.DEALLOCATE.DECLARE.DEFAULT.DEFAULTS.DEFER.DEFINE.DEFINITION.DELETE.DELETING.DENSE_RANK.DENSERANK.DESC.DESCRIBE.DESCRIPTOR.DETACH.DETERMINISTIC.DIAGNOSTICS.DISABLE.DISALLOW.DISCONNECT.DISTINCT.DO.DOCUMENT.DROP.DYNAMIC.EACH.ELSE.ELSEIF.EMPTY.ENABLE.ENCODING.ENCRYPTION.END.END-EXEC.ENDING.ENFORCED.ERROR.ESCAPE.EVERY.EXCEPT.EXCEPTION.EXCLUDING.EXCLUSIVE.EXECUTE.EXISTS.EXIT.EXTEND.EXTERNAL.EXTRACT.FALSE.FENCED.FETCH.FIELDPROC.FILE.FINAL.FIRST_VALUE.FOR.FOREIGN.FORMAT.FREE.FREEPAGE.FROM.FULL.FUNCTION.GBPCACHE.GENERAL.GENERATED.GET.GLOBAL.GO.GOTO.GRANT.GROUP.HANDLER.HASH.HASH_ROW.HASHED_VALUE.HAVING.HINT.HOLD.HOUR.HOURS.IDENTITY.IF.IGNORE.IMMEDIATE.IMPLICITLY.IN.INCLUDE.INCLUDING.INCLUSIVE.INCREMENT.INDEX.INDEXBP.INDICATOR.INF.INFINITY.INHERIT.INLINE.INNER.INOUT.INSENSITIVE.INSERT.INSERTING.INTEGRITY.INTERPRET.INTERSECT.INTO.IS.ISNULL.ISOLATION.ITERATE.JAVA.JOIN.JSON.JSON_ARRAY.JSON_ARRAYAGG.JSON_EXISTS.JSON_OBJECT.JSON_OBJECTAGG.JSON_QUERY.JSON_TABLE.JSON_VALUE.KEEP.KEY.KEYS.LABEL.LAG.LANGUAGE.LAST_VALUE.LATERAL.LEAD.LEAVE.LEFT.LEVEL2.LIKE.LIMIT.LINKTYPE.LISTAGG.LOCAL.LOCALDATE.LOCALTIME.LOCALTIMESTAMP.LOCATION.LOCATOR.LOCK.LOCKSIZE.LOG.LOGGED.LOOP.MAINTAINED.MASK.MATCHED.MATERIALIZED.MAXVALUE.MERGE.MICROSECOND.MICROSECONDS.MINPCTUSED.MINUTE.MINUTES.MINVALUE.MIRROR.MIXED.MODE.MODIFIES.MONTH.MONTHS.NAMESPACE.NAN.NATIONAL.NCHAR.NCLOB.NESTED.NEW.NEW_TABLE.NEXTVAL.NO.NOCACHE.NOCYCLE.NODENAME.NODENUMBER.NOMAXVALUE.NOMINVALUE.NONE.NOORDER.NORMALIZED.NOT.NOTNULL.NTH_VALUE.NTILE.NULL.NULLS.NVARCHAR.OBID.OBJECT.OF.OFF.OFFSET.OLD.OLD_TABLE.OMIT.ON.ONLY.OPEN.OPTIMIZE.OPTION.OR.ORDER.ORDINALITY.ORGANIZE.OUT.OUTER.OVER.OVERLAY.OVERRIDING.PACKAGE.PADDED.PAGE.PAGESIZE.PARAMETER.PART.PARTITION.PARTITIONED.PARTITIONING.PARTITIONS.PASSING.PASSWORD.PATH.PCTFREE.PERCENT_RANK.PERCENTILE_CONT.PERCENTILE_DISC.PERIOD.PERMISSION.PIECESIZE.PIPE.PLAN.POSITION.PREPARE.PREVVAL.PRIMARY.PRIOR.PRIQTY.PRIVILEGES.PROCEDURE.PROGRAM.PROGRAMID.QUERY.RANGE.RANK.RATIO_TO_REPORT.RCDFMT.READ.READS.RECOVERY.REFERENCES.REFERENCING.REFRESH.REGEXP_LIKE.RELEASE.RENAME.REPEAT.RESET.RESIGNAL.RESTART.RESULT.RESULT_SET_LOCATOR.RETURN.RETURNING.RETURNS.REVOKE.RID.RIGHT.ROLLBACK.ROLLUP.ROUTINE.ROW.ROW_NUMBER.ROWNUMBER.ROWS.RRN.RUN.SAVEPOINT.SBCS.SCALAR.SCHEMA.SCRATCHPAD.SCROLL.SEARCH.SECOND.SECONDS.SECQTY.SECURED.SELECT.SENSITIVE.SEQUENCE.SESSION.SESSION_USER.SET.SIGNAL.SIMPLE.SKIP.SNAN.SOME.SOURCE.SPECIFIC.SQL.SQLID.SQLIND_DEFAULT.SQLIND_UNASSIGNED.STACKED.START.STARTING.STATEMENT.STATIC.STOGROUP.SUBSTRING.SUMMARY.SYNONYM.SYSTEM_TIME.SYSTEM_USER.TABLE.TABLESPACE.TABLESPACES.TAG.THEN.THREADSAFE.TO.TRANSACTION.TRANSFER.TRIGGER.TRIM.TRIM_ARRAY.TRUE.TRUNCATE.TRY_CAST.TYPE.UNDO.UNION.UNIQUE.UNIT.UNKNOWN.UNNEST.UNTIL.UPDATE.UPDATING.URI.USAGE.USE.USER.USERID.USING.VALUE.VALUES.VARIABLE.VARIANT.VCAT.VERSION.VERSIONING.VIEW.VOLATILE.WAIT.WHEN.WHENEVER.WHERE.WHILE.WITH.WITHIN.WITHOUT.WRAPPED.WRAPPER.WRITE.WRKSTNNAME.XMLAGG.XMLATTRIBUTES.XMLCAST.XMLCOMMENT.XMLCONCAT.XMLDOCUMENT.XMLELEMENT.XMLFOREST.XMLGROUP.XMLNAMESPACES.XMLPARSE.XMLPI.XMLROW.XMLSERIALIZE.XMLTABLE.XMLTEXT.XMLVALIDATE.XSLTRANSFORM.XSROBJECT.YEAR.YEARS.YES.ZONE".split("."), yn = /* @__PURE__ */ "ARRAY.BIGINT.BINARY.BIT.BLOB.BOOLEAN.CCSID.CHAR.CHARACTER.CLOB.DATA.DATALINK.DATE.DBCLOB.DECFLOAT.DECIMAL.DEC.DOUBLE.DOUBLE PRECISION.FLOAT.GRAPHIC.INT.INTEGER.LONG.NUMERIC.REAL.ROWID.SMALLINT.TIME.TIMESTAMP.VARBINARY.VARCHAR.VARGRAPHIC.XML".split("."), bn = w(["SELECT [ALL | DISTINCT]"]), xn = w([
	"WITH [RECURSIVE]",
	"INTO",
	"FROM",
	"WHERE",
	"GROUP BY",
	"HAVING",
	"PARTITION BY",
	"ORDER [SIBLINGS] BY [INPUT SEQUENCE]",
	"LIMIT",
	"OFFSET",
	"FETCH {FIRST | NEXT}",
	"FOR UPDATE [OF]",
	"FOR READ ONLY",
	"OPTIMIZE FOR",
	"INSERT INTO",
	"VALUES",
	"SET",
	"MERGE INTO",
	"WHEN [NOT] MATCHED [THEN]",
	"UPDATE SET",
	"DELETE",
	"INSERT",
	"FOR SYSTEM NAME"
]), Sn = w(["CREATE [OR REPLACE] TABLE"]), Cn = w(/* @__PURE__ */ "CREATE [OR REPLACE] [RECURSIVE] VIEW.UPDATE.WHERE CURRENT OF.WITH {NC | RR | RS | CS | UR}.DELETE FROM.DROP TABLE.ALTER TABLE.ADD [COLUMN].ALTER [COLUMN].DROP [COLUMN].SET DATA TYPE.SET {GENERATED ALWAYS | GENERATED BY DEFAULT}.SET NOT NULL.SET {NOT HIDDEN | IMPLICITLY HIDDEN}.SET FIELDPROC.DROP {DEFAULT | NOT NULL | GENERATED | IDENTITY | ROW CHANGE TIMESTAMP | FIELDPROC}.TRUNCATE [TABLE].SET [CURRENT] SCHEMA.SET CURRENT_SCHEMA.ALLOCATE CURSOR.ALLOCATE [SQL] DESCRIPTOR [LOCAL | GLOBAL] SQL.ALTER [SPECIFIC] {FUNCTION | PROCEDURE}.ALTER {MASK | PERMISSION | SEQUENCE | TRIGGER}.ASSOCIATE [RESULT SET] {LOCATOR | LOCATORS}.BEGIN DECLARE SECTION.CALL.CLOSE.COMMENT ON {ALIAS | COLUMN | CONSTRAINT | INDEX | MASK | PACKAGE | PARAMETER | PERMISSION | SEQUENCE | TABLE | TRIGGER | VARIABLE | XSROBJECT}.COMMENT ON [SPECIFIC] {FUNCTION | PROCEDURE | ROUTINE}.COMMENT ON PARAMETER SPECIFIC {FUNCTION | PROCEDURE | ROUTINE}.COMMENT ON [TABLE FUNCTION] RETURN COLUMN.COMMENT ON [TABLE FUNCTION] RETURN COLUMN SPECIFIC [PROCEDURE | ROUTINE].COMMIT [WORK] [HOLD].CONNECT [TO | RESET] USER.CREATE [OR REPLACE] {ALIAS | FUNCTION | MASK | PERMISSION | PROCEDURE | SEQUENCE | TRIGGER | VARIABLE}.CREATE [ENCODED VECTOR] INDEX.CREATE UNIQUE [WHERE NOT NULL] INDEX.CREATE SCHEMA.CREATE TYPE.DEALLOCATE [SQL] DESCRIPTOR [LOCAL | GLOBAL].DECLARE CURSOR.DECLARE GLOBAL TEMPORARY TABLE.DECLARE.DESCRIBE CURSOR.DESCRIBE INPUT.DESCRIBE [OUTPUT].DESCRIBE {PROCEDURE | ROUTINE}.DESCRIBE TABLE.DISCONNECT ALL [SQL].DISCONNECT [CURRENT].DROP {ALIAS | INDEX | MASK | PACKAGE | PERMISSION | SCHEMA | SEQUENCE | TABLE | TYPE | VARIABLE | XSROBJECT} [IF EXISTS].DROP [SPECIFIC] {FUNCTION | PROCEDURE | ROUTINE} [IF EXISTS].END DECLARE SECTION.EXECUTE [IMMEDIATE].FREE LOCATOR.GET [SQL] DESCRIPTOR [LOCAL | GLOBAL].GET [CURRENT | STACKED] DIAGNOSTICS.GRANT {ALL [PRIVILEGES] | ALTER | EXECUTE} ON {FUNCTION | PROCEDURE | ROUTINE | PACKAGE | SCHEMA | SEQUENCE | TABLE | TYPE | VARIABLE | XSROBJECT}.HOLD LOCATOR.INCLUDE.LABEL ON {ALIAS | COLUMN | CONSTRAINT | INDEX | MASK | PACKAGE | PERMISSION | SEQUENCE | TABLE | TRIGGER | VARIABLE | XSROBJECT}.LABEL ON [SPECIFIC] {FUNCTION | PROCEDURE | ROUTINE}.LOCK TABLE.OPEN.PREPARE.REFRESH TABLE.RELEASE.RELEASE [TO] SAVEPOINT.RENAME [TABLE | INDEX] TO.REVOKE {ALL [PRIVILEGES] | ALTER | EXECUTE} ON {FUNCTION | PROCEDURE | ROUTINE | PACKAGE | SCHEMA | SEQUENCE | TABLE | TYPE | VARIABLE | XSROBJECT}.ROLLBACK [WORK] [HOLD | TO SAVEPOINT].SAVEPOINT.SET CONNECTION.SET CURRENT {DEBUG MODE | DECFLOAT ROUNDING MODE | DEGREE | IMPLICIT XMLPARSE OPTION | TEMPORAL SYSTEM_TIME}.SET [SQL] DESCRIPTOR [LOCAL | GLOBAL].SET ENCRYPTION PASSWORD.SET OPTION.SET {[CURRENT [FUNCTION]] PATH | CURRENT_PATH}.SET RESULT SETS [WITH RETURN [TO CALLER | TO CLIENT]].SET SESSION AUTHORIZATION.SET SESSION_USER.SET TRANSACTION.SIGNAL SQLSTATE [VALUE].TAG.TRANSFER OWNERSHIP OF.WHENEVER {NOT FOUND | SQLERROR | SQLWARNING}".split(".")), wn = w([
	"UNION [ALL]",
	"EXCEPT [ALL]",
	"INTERSECT [ALL]"
]), Tn = w([
	"JOIN",
	"{LEFT | RIGHT | FULL} [OUTER] JOIN",
	"[LEFT | RIGHT] EXCEPTION JOIN",
	"{INNER | CROSS} JOIN"
]), En = w([
	"ON DELETE",
	"ON UPDATE",
	"SET NULL",
	"{ROWS | RANGE} BETWEEN"
]), Dn = w([]), On = {
	name: "db2i",
	tokenizerOptions: {
		reservedSelect: bn,
		reservedClauses: [
			...xn,
			...Sn,
			...Cn
		],
		reservedSetOperations: wn,
		reservedJoins: Tn,
		reservedKeywordPhrases: En,
		reservedDataTypePhrases: Dn,
		reservedKeywords: vn,
		reservedDataTypes: yn,
		reservedFunctionNames: _n,
		nestedBlockComments: !0,
		extraParens: ["[]"],
		stringTypes: [{
			quote: "''-qq",
			prefixes: ["G", "N"]
		}, {
			quote: "''-raw",
			prefixes: [
				"X",
				"BX",
				"GX",
				"UX"
			],
			requirePrefix: !0
		}],
		identTypes: ["\"\"-qq"],
		identChars: {
			first: "@#$",
			rest: "@#$"
		},
		paramTypes: {
			positional: !0,
			named: [":"]
		},
		paramChars: {
			first: "@#$",
			rest: "@#$"
		},
		operators: [
			"**",
			"¬=",
			"¬>",
			"¬<",
			"!>",
			"!<",
			"||",
			"=>"
		]
	},
	formatOptions: {
		onelineClauses: [...Sn, ...Cn],
		tabularOnelineClauses: Cn
	}
}, kn = /* @__PURE__ */ "ABS.ACOS.ADD.ADD_PARQUET_KEY.AGE.AGGREGATE.ALIAS.ALL_PROFILING_OUTPUT.ANY_VALUE.APPLY.APPROX_COUNT_DISTINCT.APPROX_QUANTILE.ARBITRARY.ARGMAX.ARGMIN.ARG_MAX.ARG_MAX_NULL.ARG_MIN.ARG_MIN_NULL.ARRAY_AGG.ARRAY_AGGR.ARRAY_AGGREGATE.ARRAY_APPEND.ARRAY_APPLY.ARRAY_CAT.ARRAY_CONCAT.ARRAY_CONTAINS.ARRAY_COSINE_SIMILARITY.ARRAY_CROSS_PRODUCT.ARRAY_DISTANCE.ARRAY_DISTINCT.ARRAY_DOT_PRODUCT.ARRAY_EXTRACT.ARRAY_FILTER.ARRAY_GRADE_UP.ARRAY_HAS.ARRAY_HAS_ALL.ARRAY_HAS_ANY.ARRAY_INDEXOF.ARRAY_INNER_PRODUCT.ARRAY_INTERSECT.ARRAY_LENGTH.ARRAY_POP_BACK.ARRAY_POP_FRONT.ARRAY_POSITION.ARRAY_PREPEND.ARRAY_PUSH_BACK.ARRAY_PUSH_FRONT.ARRAY_REDUCE.ARRAY_RESIZE.ARRAY_REVERSE.ARRAY_REVERSE_SORT.ARRAY_SELECT.ARRAY_SLICE.ARRAY_SORT.ARRAY_TO_JSON.ARRAY_TO_STRING.ARRAY_TRANSFORM.ARRAY_UNIQUE.ARRAY_VALUE.ARRAY_WHERE.ARRAY_ZIP.ARROW_SCAN.ARROW_SCAN_DUMB.ASCII.ASIN.ATAN.ATAN2.AVG.BASE64.BIN.BITSTRING.BITSTRING_AGG.BIT_AND.BIT_COUNT.BIT_LENGTH.BIT_OR.BIT_POSITION.BIT_XOR.BOOL_AND.BOOL_OR.CARDINALITY.CBRT.CEIL.CEILING.CENTURY.CHECKPOINT.CHR.COLLATIONS.COL_DESCRIPTION.COMBINE.CONCAT.CONCAT_WS.CONSTANT_OR_NULL.CONTAINS.COPY_DATABASE.CORR.COS.COT.COUNT.COUNT_IF.COUNT_STAR.COVAR_POP.COVAR_SAMP.CREATE_SORT_KEY.CURRENT_CATALOG.CURRENT_DATABASE.CURRENT_DATE.CURRENT_LOCALTIME.CURRENT_LOCALTIMESTAMP.CURRENT_QUERY.CURRENT_ROLE.CURRENT_SCHEMA.CURRENT_SCHEMAS.CURRENT_SETTING.CURRENT_USER.CURRVAL.DAMERAU_LEVENSHTEIN.DATABASE_LIST.DATABASE_SIZE.DATEDIFF.DATEPART.DATESUB.DATETRUNC.DATE_ADD.DATE_DIFF.DATE_PART.DATE_SUB.DATE_TRUNC.DAY.DAYNAME.DAYOFMONTH.DAYOFWEEK.DAYOFYEAR.DECADE.DECODE.DEGREES.DISABLE_CHECKPOINT_ON_SHUTDOWN.DISABLE_OBJECT_CACHE.DISABLE_OPTIMIZER.DISABLE_PRINT_PROGRESS_BAR.DISABLE_PROFILE.DISABLE_PROFILING.DISABLE_PROGRESS_BAR.DISABLE_VERIFICATION.DISABLE_VERIFY_EXTERNAL.DISABLE_VERIFY_FETCH_ROW.DISABLE_VERIFY_PARALLELISM.DISABLE_VERIFY_SERIALIZER.DIVIDE.DUCKDB_COLUMNS.DUCKDB_CONSTRAINTS.DUCKDB_DATABASES.DUCKDB_DEPENDENCIES.DUCKDB_EXTENSIONS.DUCKDB_FUNCTIONS.DUCKDB_INDEXES.DUCKDB_KEYWORDS.DUCKDB_MEMORY.DUCKDB_OPTIMIZERS.DUCKDB_SCHEMAS.DUCKDB_SECRETS.DUCKDB_SEQUENCES.DUCKDB_SETTINGS.DUCKDB_TABLES.DUCKDB_TEMPORARY_FILES.DUCKDB_TYPES.DUCKDB_VIEWS.EDIT.EDITDIST3.ELEMENT_AT.ENABLE_CHECKPOINT_ON_SHUTDOWN.ENABLE_OBJECT_CACHE.ENABLE_OPTIMIZER.ENABLE_PRINT_PROGRESS_BAR.ENABLE_PROFILE.ENABLE_PROFILING.ENABLE_PROGRESS_BAR.ENABLE_VERIFICATION.ENCODE.ENDS_WITH.ENTROPY.ENUM_CODE.ENUM_FIRST.ENUM_LAST.ENUM_RANGE.ENUM_RANGE_BOUNDARY.EPOCH.EPOCH_MS.EPOCH_NS.EPOCH_US.ERA.ERROR.EVEN.EXP.FACTORIAL.FAVG.FDIV.FILTER.FINALIZE.FIRST.FLATTEN.FLOOR.FMOD.FORCE_CHECKPOINT.FORMAT.FORMATREADABLEDECIMALSIZE.FORMATREADABLESIZE.FORMAT_BYTES.FORMAT_PG_TYPE.FORMAT_TYPE.FROM_BASE64.FROM_BINARY.FROM_HEX.FROM_JSON.FROM_JSON_STRICT.FSUM.FUNCTIONS.GAMMA.GCD.GENERATE_SERIES.GENERATE_SUBSCRIPTS.GEN_RANDOM_UUID.GEOMEAN.GEOMETRIC_MEAN.GETENV.GET_BIT.GET_BLOCK_SIZE.GET_CURRENT_TIME.GET_CURRENT_TIMESTAMP.GLOB.GRADE_UP.GREATEST.GREATEST_COMMON_DIVISOR.GROUP_CONCAT.HAMMING.HASH.HAS_ANY_COLUMN_PRIVILEGE.HAS_COLUMN_PRIVILEGE.HAS_DATABASE_PRIVILEGE.HAS_FOREIGN_DATA_WRAPPER_PRIVILEGE.HAS_FUNCTION_PRIVILEGE.HAS_LANGUAGE_PRIVILEGE.HAS_SCHEMA_PRIVILEGE.HAS_SEQUENCE_PRIVILEGE.HAS_SERVER_PRIVILEGE.HAS_TABLESPACE_PRIVILEGE.HAS_TABLE_PRIVILEGE.HEX.HISTOGRAM.HOUR.ICU_CALENDAR_NAMES.ICU_SORT_KEY.ILIKE_ESCAPE.IMPORT_DATABASE.INDEX_SCAN.INET_CLIENT_ADDR.INET_CLIENT_PORT.INET_SERVER_ADDR.INET_SERVER_PORT.INSTR.IN_SEARCH_PATH.ISFINITE.ISINF.ISNAN.ISODOW.ISOYEAR.JACCARD.JARO_SIMILARITY.JARO_WINKLER_SIMILARITY.JSON_ARRAY.JSON_ARRAY_LENGTH.JSON_CONTAINS.JSON_DESERIALIZE_SQL.JSON_EXECUTE_SERIALIZED_SQL.JSON_EXTRACT.JSON_EXTRACT_PATH.JSON_EXTRACT_PATH_TEXT.JSON_EXTRACT_STRING.JSON_GROUP_ARRAY.JSON_GROUP_OBJECT.JSON_GROUP_STRUCTURE.JSON_KEYS.JSON_MERGE_PATCH.JSON_OBJECT.JSON_QUOTE.JSON_SERIALIZE_PLAN.JSON_SERIALIZE_SQL.JSON_STRUCTURE.JSON_TRANSFORM.JSON_TRANSFORM_STRICT.JSON_TYPE.JSON_VALID.JULIAN.KAHAN_SUM.KURTOSIS.KURTOSIS_POP.LAST.LAST_DAY.LCASE.LCM.LEAST.LEAST_COMMON_MULTIPLE.LEFT.LEFT_GRAPHEME.LEN.LENGTH.LENGTH_GRAPHEME.LEVENSHTEIN.LGAMMA.LIKE_ESCAPE.LIST.LISTAGG.LIST_AGGR.LIST_AGGREGATE.LIST_ANY_VALUE.LIST_APPEND.LIST_APPLY.LIST_APPROX_COUNT_DISTINCT.LIST_AVG.LIST_BIT_AND.LIST_BIT_OR.LIST_BIT_XOR.LIST_BOOL_AND.LIST_BOOL_OR.LIST_CAT.LIST_CONCAT.LIST_CONTAINS.LIST_COSINE_SIMILARITY.LIST_COUNT.LIST_DISTANCE.LIST_DISTINCT.LIST_DOT_PRODUCT.LIST_ELEMENT.LIST_ENTROPY.LIST_EXTRACT.LIST_FILTER.LIST_FIRST.LIST_GRADE_UP.LIST_HAS.LIST_HAS_ALL.LIST_HAS_ANY.LIST_HISTOGRAM.LIST_INDEXOF.LIST_INNER_PRODUCT.LIST_INTERSECT.LIST_KURTOSIS.LIST_KURTOSIS_POP.LIST_LAST.LIST_MAD.LIST_MAX.LIST_MEDIAN.LIST_MIN.LIST_MODE.LIST_PACK.LIST_POSITION.LIST_PREPEND.LIST_PRODUCT.LIST_REDUCE.LIST_RESIZE.LIST_REVERSE.LIST_REVERSE_SORT.LIST_SELECT.LIST_SEM.LIST_SKEWNESS.LIST_SLICE.LIST_SORT.LIST_STDDEV_POP.LIST_STDDEV_SAMP.LIST_STRING_AGG.LIST_SUM.LIST_TRANSFORM.LIST_UNIQUE.LIST_VALUE.LIST_VAR_POP.LIST_VAR_SAMP.LIST_WHERE.LIST_ZIP.LN.LOG.LOG10.LOG2.LOWER.LPAD.LSMODE.LTRIM.MAD.MAKE_DATE.MAKE_TIME.MAKE_TIMESTAMP.MAKE_TIMESTAMPTZ.MAP.MAP_CONCAT.MAP_ENTRIES.MAP_EXTRACT.MAP_FROM_ENTRIES.MAP_KEYS.MAP_VALUES.MAX.MAX_BY.MD5.MD5_NUMBER.MD5_NUMBER_LOWER.MD5_NUMBER_UPPER.MEAN.MEDIAN.METADATA_INFO.MICROSECOND.MILLENNIUM.MILLISECOND.MIN.MINUTE.MIN_BY.MISMATCHES.MOD.MODE.MONTH.MONTHNAME.MULTIPLY.NEXTAFTER.NEXTVAL.NFC_NORMALIZE.NOT_ILIKE_ESCAPE.NOT_LIKE_ESCAPE.NOW.NULLIF.OBJ_DESCRIPTION.OCTET_LENGTH.ORD.PARQUET_FILE_METADATA.PARQUET_KV_METADATA.PARQUET_METADATA.PARQUET_SCAN.PARQUET_SCHEMA.PARSE_DIRNAME.PARSE_DIRPATH.PARSE_FILENAME.PARSE_PATH.PG_COLLATION_IS_VISIBLE.PG_CONF_LOAD_TIME.PG_CONVERSION_IS_VISIBLE.PG_FUNCTION_IS_VISIBLE.PG_GET_CONSTRAINTDEF.PG_GET_EXPR.PG_GET_VIEWDEF.PG_HAS_ROLE.PG_IS_OTHER_TEMP_SCHEMA.PG_MY_TEMP_SCHEMA.PG_OPCLASS_IS_VISIBLE.PG_OPERATOR_IS_VISIBLE.PG_OPFAMILY_IS_VISIBLE.PG_POSTMASTER_START_TIME.PG_SIZE_PRETTY.PG_TABLE_IS_VISIBLE.PG_TIMEZONE_NAMES.PG_TS_CONFIG_IS_VISIBLE.PG_TS_DICT_IS_VISIBLE.PG_TS_PARSER_IS_VISIBLE.PG_TS_TEMPLATE_IS_VISIBLE.PG_TYPEOF.PG_TYPE_IS_VISIBLE.PI.PLATFORM.POSITION.POW.POWER.PRAGMA_COLLATIONS.PRAGMA_DATABASE_SIZE.PRAGMA_METADATA_INFO.PRAGMA_PLATFORM.PRAGMA_SHOW.PRAGMA_STORAGE_INFO.PRAGMA_TABLE_INFO.PRAGMA_USER_AGENT.PRAGMA_VERSION.PREFIX.PRINTF.PRODUCT.QUANTILE.QUANTILE_CONT.QUANTILE_DISC.QUARTER.RADIANS.RANDOM.RANGE.READFILE.READ_BLOB.READ_CSV.READ_CSV_AUTO.READ_JSON.READ_JSON_AUTO.READ_JSON_OBJECTS.READ_JSON_OBJECTS_AUTO.READ_NDJSON.READ_NDJSON_AUTO.READ_NDJSON_OBJECTS.READ_PARQUET.READ_TEXT.REDUCE.REGEXP_ESCAPE.REGEXP_EXTRACT.REGEXP_EXTRACT_ALL.REGEXP_FULL_MATCH.REGEXP_MATCHES.REGEXP_REPLACE.REGEXP_SPLIT_TO_ARRAY.REGEXP_SPLIT_TO_TABLE.REGR_AVGX.REGR_AVGY.REGR_COUNT.REGR_INTERCEPT.REGR_R2.REGR_SLOPE.REGR_SXX.REGR_SXY.REGR_SYY.REPEAT.REPEAT_ROW.REPLACE.RESERVOIR_QUANTILE.REVERSE.RIGHT.RIGHT_GRAPHEME.ROUND.ROUNDBANKERS.ROUND_EVEN.ROW.ROW_TO_JSON.RPAD.RTRIM.SECOND.SEM.SEQ_SCAN.SESSION_USER.SETSEED.SET_BIT.SHA256.SHA3.SHELL_ADD_SCHEMA.SHELL_ESCAPE_CRNL.SHELL_IDQUOTE.SHELL_MODULE_SCHEMA.SHELL_PUTSNL.SHOBJ_DESCRIPTION.SHOW.SHOW_DATABASES.SHOW_TABLES.SHOW_TABLES_EXPANDED.SIGN.SIGNBIT.SIN.SKEWNESS.SNIFF_CSV.SPLIT.SPLIT_PART.SQL_AUTO_COMPLETE.SQRT.STARTS_WITH.STATS.STDDEV.STDDEV_POP.STDDEV_SAMP.STORAGE_INFO.STRFTIME.STRING_AGG.STRING_SPLIT.STRING_SPLIT_REGEX.STRING_TO_ARRAY.STRIP_ACCENTS.STRLEN.STRPOS.STRPTIME.STRUCT_EXTRACT.STRUCT_INSERT.STRUCT_PACK.STR_SPLIT.STR_SPLIT_REGEX.SUBSTR.SUBSTRING.SUBSTRING_GRAPHEME.SUBTRACT.SUFFIX.SUM.SUMKAHAN.SUMMARY.SUM_NO_OVERFLOW.TABLE_INFO.TAN.TEST_ALL_TYPES.TEST_VECTOR_TYPES.TIMEZONE.TIMEZONE_HOUR.TIMEZONE_MINUTE.TIME_BUCKET.TODAY.TO_BASE.TO_BASE64.TO_BINARY.TO_CENTURIES.TO_DAYS.TO_DECADES.TO_HEX.TO_HOURS.TO_JSON.TO_MICROSECONDS.TO_MILLENNIA.TO_MILLISECONDS.TO_MINUTES.TO_MONTHS.TO_SECONDS.TO_TIMESTAMP.TO_WEEKS.TO_YEARS.TRANSACTION_TIMESTAMP.TRANSLATE.TRIM.TRUNC.TRY_STRPTIME.TXID_CURRENT.TYPEOF.UCASE.UNBIN.UNHEX.UNICODE.UNION_EXTRACT.UNION_TAG.UNION_VALUE.UNNEST.UNPIVOT_LIST.UPPER.USER.USER_AGENT.UUID.VARIANCE.VAR_POP.VAR_SAMP.VECTOR_TYPE.VERIFY_EXTERNAL.VERIFY_FETCH_ROW.VERIFY_PARALLELISM.VERIFY_SERIALIZER.VERSION.WEEK.WEEKDAY.WEEKOFYEAR.WHICH_SECRET.WRITEFILE.XOR.YEAR.YEARWEEK.CAST.COALESCE.RANK.ROW_NUMBER".split("."), An = /* @__PURE__ */ "ALL.ANALYSE.ANALYZE.AND.ANY.AS.ASC.ATTACH.ASYMMETRIC.BOTH.CASE.CAST.CHECK.COLLATE.COLUMN.CONSTRAINT.CREATE.DEFAULT.DEFERRABLE.DESC.DESCRIBE.DETACH.DISTINCT.DO.ELSE.END.EXCEPT.FALSE.FETCH.FOR.FOREIGN.FROM.GRANT.GROUP.HAVING.IN.INITIALLY.INTERSECT.INTO.IS.LATERAL.LEADING.LIMIT.NOT.NULL.OFFSET.ON.ONLY.OR.ORDER.PIVOT.PIVOT_LONGER.PIVOT_WIDER.PLACING.PRIMARY.REFERENCES.RETURNING.SELECT.SHOW.SOME.SUMMARIZE.SYMMETRIC.TABLE.THEN.TO.TRAILING.TRUE.UNION.UNIQUE.UNPIVOT.USING.VARIADIC.WHEN.WHERE.WINDOW.WITH".split("."), jn = /* @__PURE__ */ "ARRAY.BIGINT.BINARY.BIT.BITSTRING.BLOB.BOOL.BOOLEAN.BPCHAR.BYTEA.CHAR.DATE.DATETIME.DEC.DECIMAL.DOUBLE.ENUM.FLOAT.FLOAT4.FLOAT8.GUID.HUGEINT.INET.INT.INT1.INT128.INT16.INT2.INT32.INT4.INT64.INT8.INTEGER.INTEGRAL.INTERVAL.JSON.LIST.LOGICAL.LONG.MAP.NUMERIC.NVARCHAR.OID.REAL.ROW.SHORT.SIGNED.SMALLINT.STRING.STRUCT.TEXT.TIME.TIMESTAMP_MS.TIMESTAMP_NS.TIMESTAMP_S.TIMESTAMP_US.TIMESTAMP.TIMESTAMPTZ.TIMETZ.TINYINT.UBIGINT.UHUGEINT.UINT128.UINT16.UINT32.UINT64.UINT8.UINTEGER.UNION.USMALLINT.UTINYINT.UUID.VARBINARY.VARCHAR".split("."), Mn = w(["SELECT [ALL | DISTINCT]"]), Nn = w([
	"WITH [RECURSIVE]",
	"FROM",
	"WHERE",
	"GROUP BY [ALL]",
	"HAVING",
	"WINDOW",
	"PARTITION BY",
	"ORDER BY [ALL]",
	"LIMIT",
	"OFFSET",
	"USING SAMPLE",
	"QUALIFY",
	"INSERT [OR REPLACE] INTO",
	"VALUES",
	"DEFAULT VALUES",
	"SET",
	"RETURNING"
]), Pn = w(["CREATE [OR REPLACE] [TEMPORARY | TEMP] TABLE [IF NOT EXISTS]"]), Fn = w(/* @__PURE__ */ "UPDATE.ON CONFLICT.DELETE FROM.DROP TABLE [IF EXISTS].TRUNCATE.ALTER TABLE.ADD [COLUMN] [IF NOT EXISTS].ADD PRIMARY KEY.DROP [COLUMN] [IF EXISTS].ALTER [COLUMN].RENAME [COLUMN].RENAME TO.SET [DATA] TYPE.{SET | DROP} DEFAULT.{SET | DROP} NOT NULL.CREATE [OR REPLACE] [TEMPORARY | TEMP] {MACRO | FUNCTION}.DROP MACRO [TABLE] [IF EXISTS].DROP FUNCTION [IF EXISTS].CREATE [UNIQUE] INDEX [IF NOT EXISTS].DROP INDEX [IF EXISTS].CREATE [OR REPLACE] SCHEMA [IF NOT EXISTS].DROP SCHEMA [IF EXISTS].CREATE [OR REPLACE] [PERSISTENT | TEMPORARY] SECRET [IF NOT EXISTS].DROP [PERSISTENT | TEMPORARY] SECRET [IF EXISTS].CREATE [OR REPLACE] [TEMPORARY | TEMP] SEQUENCE.DROP SEQUENCE [IF EXISTS].CREATE [OR REPLACE] [TEMPORARY | TEMP] VIEW [IF NOT EXISTS].DROP VIEW [IF EXISTS].ALTER VIEW.CREATE TYPE.DROP TYPE [IF EXISTS].ANALYZE.ATTACH [DATABASE] [IF NOT EXISTS].DETACH [DATABASE] [IF EXISTS].CALL.[FORCE] CHECKPOINT.COMMENT ON [TABLE | COLUMN | VIEW | INDEX | SEQUENCE | TYPE | MACRO | MACRO TABLE].COPY [FROM DATABASE].DESCRIBE.EXPORT DATABASE.IMPORT DATABASE.INSTALL.LOAD.PIVOT.PIVOT_WIDER.UNPIVOT.EXPLAIN [ANALYZE].SET {LOCAL | SESSION | GLOBAL}.RESET [LOCAL | SESSION | GLOBAL].{SET | RESET} VARIABLE.SUMMARIZE.BEGIN TRANSACTION.ROLLBACK.COMMIT.ABORT.USE.VACUUM [ANALYZE].PREPARE.EXECUTE.DEALLOCATE [PREPARE]".split(".")), In = w([
	"UNION [ALL | BY NAME]",
	"EXCEPT [ALL]",
	"INTERSECT [ALL]"
]), Ln = w([
	"JOIN",
	"{LEFT | RIGHT | FULL} [OUTER] JOIN",
	"{INNER | CROSS} JOIN",
	"{NATURAL | ASOF} [INNER] JOIN",
	"{NATURAL | ASOF} {LEFT | RIGHT | FULL} [OUTER] JOIN",
	"POSITIONAL JOIN",
	"ANTI JOIN",
	"SEMI JOIN"
]), Rn = w([
	"{ROWS | RANGE | GROUPS} BETWEEN",
	"SIMILAR TO",
	"IS [NOT] DISTINCT FROM"
]), zn = w(["TIMESTAMP WITH TIME ZONE"]), Bn = {
	name: "duckdb",
	tokenizerOptions: {
		reservedSelect: Mn,
		reservedClauses: [
			...Nn,
			...Pn,
			...Fn
		],
		reservedSetOperations: In,
		reservedJoins: Ln,
		reservedKeywordPhrases: Rn,
		reservedDataTypePhrases: zn,
		supportsXor: !0,
		reservedKeywords: An,
		reservedDataTypes: jn,
		reservedFunctionNames: kn,
		nestedBlockComments: !0,
		extraParens: ["[]", "{}"],
		underscoresInNumbers: !0,
		stringTypes: [
			"$$",
			"''-qq",
			{
				quote: "''-qq-bs",
				prefixes: ["E"],
				requirePrefix: !0
			},
			{
				quote: "''-raw",
				prefixes: ["B", "X"],
				requirePrefix: !0
			}
		],
		identTypes: ["\"\"-qq"],
		identChars: { rest: "$" },
		paramTypes: {
			positional: !0,
			numbered: ["$"],
			quoted: ["$"]
		},
		operators: /* @__PURE__ */ "//.%.**.^.!.&.|.~.<<.>>.::.==.->.->>.:.:=.=>.~~.!~~.~~*.!~~*.~~~.~.!~.~*.!~*.^@.||.>>=.<<=".split(".")
	},
	formatOptions: {
		alwaysDenseOperators: ["::"],
		onelineClauses: [...Pn, ...Fn],
		tabularOnelineClauses: Fn
	}
}, Vn = /* @__PURE__ */ "ABS.ACOS.ASIN.ATAN.BIN.BROUND.CBRT.CEIL.CEILING.CONV.COS.DEGREES.EXP.FACTORIAL.FLOOR.GREATEST.HEX.LEAST.LN.LOG.LOG10.LOG2.NEGATIVE.PI.PMOD.POSITIVE.POW.POWER.RADIANS.RAND.ROUND.SHIFTLEFT.SHIFTRIGHT.SHIFTRIGHTUNSIGNED.SIGN.SIN.SQRT.TAN.UNHEX.WIDTH_BUCKET.ARRAY_CONTAINS.MAP_KEYS.MAP_VALUES.SIZE.SORT_ARRAY.BINARY.CAST.ADD_MONTHS.DATE.DATE_ADD.DATE_FORMAT.DATE_SUB.DATEDIFF.DAY.DAYNAME.DAYOFMONTH.DAYOFYEAR.EXTRACT.FROM_UNIXTIME.FROM_UTC_TIMESTAMP.HOUR.LAST_DAY.MINUTE.MONTH.MONTHS_BETWEEN.NEXT_DAY.QUARTER.SECOND.TIMESTAMP.TO_DATE.TO_UTC_TIMESTAMP.TRUNC.UNIX_TIMESTAMP.WEEKOFYEAR.YEAR.ASSERT_TRUE.COALESCE.IF.ISNOTNULL.ISNULL.NULLIF.NVL.ASCII.BASE64.CHARACTER_LENGTH.CHR.CONCAT.CONCAT_WS.CONTEXT_NGRAMS.DECODE.ELT.ENCODE.FIELD.FIND_IN_SET.FORMAT_NUMBER.GET_JSON_OBJECT.IN_FILE.INITCAP.INSTR.LCASE.LENGTH.LEVENSHTEIN.LOCATE.LOWER.LPAD.LTRIM.NGRAMS.OCTET_LENGTH.PARSE_URL.PRINTF.QUOTE.REGEXP_EXTRACT.REGEXP_REPLACE.REPEAT.REVERSE.RPAD.RTRIM.SENTENCES.SOUNDEX.SPACE.SPLIT.STR_TO_MAP.SUBSTR.SUBSTRING.TRANSLATE.TRIM.UCASE.UNBASE64.UPPER.MASK.MASK_FIRST_N.MASK_HASH.MASK_LAST_N.MASK_SHOW_FIRST_N.MASK_SHOW_LAST_N.AES_DECRYPT.AES_ENCRYPT.CRC32.CURRENT_DATABASE.CURRENT_USER.HASH.JAVA_METHOD.LOGGED_IN_USER.MD5.REFLECT.SHA.SHA1.SHA2.SURROGATE_KEY.VERSION.AVG.COLLECT_LIST.COLLECT_SET.CORR.COUNT.COVAR_POP.COVAR_SAMP.HISTOGRAM_NUMERIC.MAX.MIN.NTILE.PERCENTILE.PERCENTILE_APPROX.REGR_AVGX.REGR_AVGY.REGR_COUNT.REGR_INTERCEPT.REGR_R2.REGR_SLOPE.REGR_SXX.REGR_SXY.REGR_SYY.STDDEV_POP.STDDEV_SAMP.SUM.VAR_POP.VAR_SAMP.VARIANCE.EXPLODE.INLINE.JSON_TUPLE.PARSE_URL_TUPLE.POSEXPLODE.STACK.LEAD.LAG.FIRST_VALUE.LAST_VALUE.RANK.ROW_NUMBER.DENSE_RANK.CUME_DIST.PERCENT_RANK.NTILE".split("."), Hn = /* @__PURE__ */ "ADD.ADMIN.AFTER.ANALYZE.ARCHIVE.ASC.BEFORE.BUCKET.BUCKETS.CASCADE.CHANGE.CLUSTER.CLUSTERED.CLUSTERSTATUS.COLLECTION.COLUMNS.COMMENT.COMPACT.COMPACTIONS.COMPUTE.CONCATENATE.CONTINUE.DATA.DATABASES.DATETIME.DAY.DBPROPERTIES.DEFERRED.DEFINED.DELIMITED.DEPENDENCY.DESC.DIRECTORIES.DIRECTORY.DISABLE.DISTRIBUTE.ELEM_TYPE.ENABLE.ESCAPED.EXCLUSIVE.EXPLAIN.EXPORT.FIELDS.FILE.FILEFORMAT.FIRST.FORMAT.FORMATTED.FUNCTIONS.HOLD_DDLTIME.HOUR.IDXPROPERTIES.IGNORE.INDEX.INDEXES.INPATH.INPUTDRIVER.INPUTFORMAT.ITEMS.JAR.KEYS.KEY_TYPE.LIMIT.LINES.LOAD.LOCATION.LOCK.LOCKS.LOGICAL.LONG.MAPJOIN.MATERIALIZED.METADATA.MINUS.MINUTE.MONTH.MSCK.NOSCAN.NO_DROP.OFFLINE.OPTION.OUTPUTDRIVER.OUTPUTFORMAT.OVERWRITE.OWNER.PARTITIONED.PARTITIONS.PLUS.PRETTY.PRINCIPALS.PROTECTION.PURGE.READ.READONLY.REBUILD.RECORDREADER.RECORDWRITER.RELOAD.RENAME.REPAIR.REPLACE.REPLICATION.RESTRICT.REWRITE.ROLE.ROLES.SCHEMA.SCHEMAS.SECOND.SEMI.SERDE.SERDEPROPERTIES.SERVER.SETS.SHARED.SHOW.SHOW_DATABASE.SKEWED.SORT.SORTED.SSL.STATISTICS.STORED.STREAMTABLE.STRING.TABLES.TBLPROPERTIES.TEMPORARY.TERMINATED.TINYINT.TOUCH.TRANSACTIONS.UNARCHIVE.UNDO.UNIONTYPE.UNLOCK.UNSET.UNSIGNED.URI.USE.UTC.UTCTIMESTAMP.VALUE_TYPE.VIEW.WHILE.YEAR.AUTOCOMMIT.ISOLATION.LEVEL.OFFSET.SNAPSHOT.TRANSACTION.WORK.WRITE.ABORT.KEY.LAST.NORELY.NOVALIDATE.NULLS.RELY.VALIDATE.DETAIL.DOW.EXPRESSION.OPERATOR.QUARTER.SUMMARY.VECTORIZATION.WEEK.YEARS.MONTHS.WEEKS.DAYS.HOURS.MINUTES.SECONDS.TIMESTAMPTZ.ZONE.ALL.ALTER.AND.AS.AUTHORIZATION.BETWEEN.BOTH.BY.CASE.CAST.COLUMN.CONF.CREATE.CROSS.CUBE.CURRENT.CURRENT_DATE.CURRENT_TIMESTAMP.CURSOR.DATABASE.DELETE.DESCRIBE.DISTINCT.DROP.ELSE.END.EXCHANGE.EXISTS.EXTENDED.EXTERNAL.FALSE.FETCH.FOLLOWING.FOR.FROM.FULL.FUNCTION.GRANT.GROUP.GROUPING.HAVING.IF.IMPORT.IN.INNER.INSERT.INTERSECT.INTO.IS.JOIN.LATERAL.LEFT.LESS.LIKE.LOCAL.MACRO.MORE.NONE.NOT.NULL.OF.ON.OR.ORDER.OUT.OUTER.OVER.PARTIALSCAN.PARTITION.PERCENT.PRECEDING.PRESERVE.PROCEDURE.RANGE.READS.REDUCE.REVOKE.RIGHT.ROLLUP.ROW.ROWS.SELECT.SET.TABLE.TABLESAMPLE.THEN.TO.TRANSFORM.TRIGGER.TRUE.TRUNCATE.UNBOUNDED.UNION.UNIQUEJOIN.UPDATE.USER.USING.UTC_TMESTAMP.VALUES.WHEN.WHERE.WINDOW.WITH.COMMIT.ONLY.REGEXP.RLIKE.ROLLBACK.START.CACHE.CONSTRAINT.FOREIGN.PRIMARY.REFERENCES.DAYOFWEEK.EXTRACT.FLOOR.VIEWS.TIME.SYNC.TEXTFILE.SEQUENCEFILE.ORC.CSV.TSV.PARQUET.AVRO.RCFILE.JSONFILE.INPUTFORMAT.OUTPUTFORMAT".split("."), Un = [
	"ARRAY",
	"BIGINT",
	"BINARY",
	"BOOLEAN",
	"CHAR",
	"DATE",
	"DECIMAL",
	"DOUBLE",
	"FLOAT",
	"INT",
	"INTEGER",
	"INTERVAL",
	"MAP",
	"NUMERIC",
	"PRECISION",
	"SMALLINT",
	"STRUCT",
	"TIMESTAMP",
	"VARCHAR"
], Wn = w(["SELECT [ALL | DISTINCT]"]), Gn = w([
	"WITH",
	"FROM",
	"WHERE",
	"GROUP BY",
	"HAVING",
	"WINDOW",
	"PARTITION BY",
	"ORDER BY",
	"SORT BY",
	"CLUSTER BY",
	"DISTRIBUTE BY",
	"LIMIT",
	"INSERT INTO [TABLE]",
	"VALUES",
	"SET",
	"MERGE INTO",
	"WHEN [NOT] MATCHED [THEN]",
	"UPDATE SET",
	"INSERT [VALUES]",
	"INSERT OVERWRITE [LOCAL] DIRECTORY",
	"LOAD DATA [LOCAL] INPATH",
	"[OVERWRITE] INTO TABLE"
]), Kn = w(["CREATE [TEMPORARY] [EXTERNAL] TABLE [IF NOT EXISTS]"]), qn = w([
	"CREATE [MATERIALIZED] VIEW [IF NOT EXISTS]",
	"UPDATE",
	"DELETE FROM",
	"DROP TABLE [IF EXISTS]",
	"ALTER TABLE",
	"RENAME TO",
	"TRUNCATE [TABLE]",
	"ALTER",
	"CREATE",
	"USE",
	"DESCRIBE",
	"DROP",
	"FETCH",
	"SHOW",
	"STORED AS",
	"STORED BY",
	"ROW FORMAT"
]), Jn = w(["UNION [ALL | DISTINCT]"]), Yn = w([
	"JOIN",
	"{LEFT | RIGHT | FULL} [OUTER] JOIN",
	"{INNER | CROSS} JOIN",
	"LEFT SEMI JOIN"
]), Xn = w(["{ROWS | RANGE} BETWEEN"]), Zn = w([]), Qn = {
	name: "hive",
	tokenizerOptions: {
		reservedSelect: Wn,
		reservedClauses: [
			...Gn,
			...Kn,
			...qn
		],
		reservedSetOperations: Jn,
		reservedJoins: Yn,
		reservedKeywordPhrases: Xn,
		reservedDataTypePhrases: Zn,
		reservedKeywords: Hn,
		reservedDataTypes: Un,
		reservedFunctionNames: Vn,
		extraParens: ["[]"],
		stringTypes: ["\"\"-bs", "''-bs"],
		identTypes: ["``"],
		variableTypes: [{
			quote: "{}",
			prefixes: ["$"],
			requirePrefix: !0
		}],
		operators: [
			"%",
			"~",
			"^",
			"|",
			"&",
			"<=>",
			"==",
			"!",
			"||"
		]
	},
	formatOptions: {
		onelineClauses: [...Kn, ...qn],
		tabularOnelineClauses: qn
	}
};
//#endregion
//#region node_modules/sql-formatter/dist/esm/languages/mariadb/likeMariaDb.js
function $n(e) {
	return e.map((t, n) => {
		let r = e[n + 1] || D;
		if (k.SET(t) && r.text === "(") return Object.assign(Object.assign({}, t), { type: E.RESERVED_FUNCTION_NAME });
		let i = e[n - 1] || D;
		return k.VALUES(t) && i.text === "=" ? Object.assign(Object.assign({}, t), { type: E.RESERVED_FUNCTION_NAME }) : t;
	});
}
//#endregion
//#region node_modules/sql-formatter/dist/esm/languages/mariadb/mariadb.keywords.js
var er = /* @__PURE__ */ "ACCESSIBLE.ADD.ALL.ALTER.ANALYZE.AND.AS.ASC.ASENSITIVE.BEFORE.BETWEEN.BOTH.BY.CALL.CASCADE.CASE.CHANGE.CHECK.COLLATE.COLUMN.CONDITION.CONSTRAINT.CONTINUE.CONVERT.CREATE.CROSS.CURRENT_DATE.CURRENT_ROLE.CURRENT_TIME.CURRENT_TIMESTAMP.CURRENT_USER.CURSOR.DATABASE.DATABASES.DAY_HOUR.DAY_MICROSECOND.DAY_MINUTE.DAY_SECOND.DECLARE.DEFAULT.DELAYED.DELETE.DELETE_DOMAIN_ID.DESC.DESCRIBE.DETERMINISTIC.DISTINCT.DISTINCTROW.DIV.DO_DOMAIN_IDS.DROP.DUAL.EACH.ELSE.ELSEIF.ENCLOSED.ESCAPED.EXCEPT.EXISTS.EXIT.EXPLAIN.FALSE.FETCH.FOR.FORCE.FOREIGN.FROM.FULLTEXT.GENERAL.GRANT.GROUP.HAVING.HIGH_PRIORITY.HOUR_MICROSECOND.HOUR_MINUTE.HOUR_SECOND.IF.IGNORE.IGNORE_DOMAIN_IDS.IGNORE_SERVER_IDS.IN.INDEX.INFILE.INNER.INOUT.INSENSITIVE.INSERT.INTERSECT.INTERVAL.INTO.IS.ITERATE.JOIN.KEY.KEYS.KILL.LEADING.LEAVE.LEFT.LIKE.LIMIT.LINEAR.LINES.LOAD.LOCALTIME.LOCALTIMESTAMP.LOCK.LOOP.LOW_PRIORITY.MASTER_HEARTBEAT_PERIOD.MASTER_SSL_VERIFY_SERVER_CERT.MATCH.MAXVALUE.MINUTE_MICROSECOND.MINUTE_SECOND.MOD.MODIFIES.NATURAL.NOT.NO_WRITE_TO_BINLOG.NULL.OFFSET.ON.OPTIMIZE.OPTION.OPTIONALLY.OR.ORDER.OUT.OUTER.OUTFILE.OVER.PAGE_CHECKSUM.PARSE_VCOL_EXPR.PARTITION.POSITION.PRIMARY.PROCEDURE.PURGE.RANGE.READ.READS.READ_WRITE.RECURSIVE.REF_SYSTEM_ID.REFERENCES.REGEXP.RELEASE.RENAME.REPEAT.REPLACE.REQUIRE.RESIGNAL.RESTRICT.RETURN.RETURNING.REVOKE.RIGHT.RLIKE.ROW_NUMBER.ROWS.SCHEMA.SCHEMAS.SECOND_MICROSECOND.SELECT.SENSITIVE.SEPARATOR.SET.SHOW.SIGNAL.SLOW.SPATIAL.SPECIFIC.SQL.SQLEXCEPTION.SQLSTATE.SQLWARNING.SQL_BIG_RESULT.SQL_CALC_FOUND_ROWS.SQL_SMALL_RESULT.SSL.STARTING.STATS_AUTO_RECALC.STATS_PERSISTENT.STATS_SAMPLE_PAGES.STRAIGHT_JOIN.TABLE.TERMINATED.THEN.TO.TRAILING.TRIGGER.TRUE.UNDO.UNION.UNIQUE.UNLOCK.UNSIGNED.UPDATE.USAGE.USE.USING.UTC_DATE.UTC_TIME.UTC_TIMESTAMP.VALUES.WHEN.WHERE.WHILE.WINDOW.WITH.WRITE.XOR.YEAR_MONTH.ZEROFILL".split("."), tr = /* @__PURE__ */ "BIGINT.BINARY.BIT.BLOB.CHAR BYTE.CHAR.CHARACTER.DATETIME.DEC.DECIMAL.DOUBLE PRECISION.DOUBLE.ENUM.FIXED.FLOAT.FLOAT4.FLOAT8.INT.INT1.INT2.INT3.INT4.INT8.INTEGER.LONG.LONGBLOB.LONGTEXT.MEDIUMBLOB.MEDIUMINT.MEDIUMTEXT.MIDDLEINT.NATIONAL CHAR.NATIONAL VARCHAR.NUMERIC.PRECISION.REAL.SMALLINT.TEXT.TIMESTAMP.TINYBLOB.TINYINT.TINYTEXT.VARBINARY.VARCHAR.VARCHARACTER.VARYING.YEAR".split("."), nr = /* @__PURE__ */ "ADDDATE.ADD_MONTHS.BIT_AND.BIT_OR.BIT_XOR.CAST.COUNT.CUME_DIST.CURDATE.CURTIME.DATE_ADD.DATE_SUB.DATE_FORMAT.DECODE.DENSE_RANK.EXTRACT.FIRST_VALUE.GROUP_CONCAT.JSON_ARRAYAGG.JSON_OBJECTAGG.LAG.LEAD.MAX.MEDIAN.MID.MIN.NOW.NTH_VALUE.NTILE.POSITION.PERCENT_RANK.PERCENTILE_CONT.PERCENTILE_DISC.RANK.ROW_NUMBER.SESSION_USER.STD.STDDEV.STDDEV_POP.STDDEV_SAMP.SUBDATE.SUBSTR.SUBSTRING.SUM.SYSTEM_USER.TRIM.TRIM_ORACLE.VARIANCE.VAR_POP.VAR_SAMP.ABS.ACOS.ADDTIME.AES_DECRYPT.AES_ENCRYPT.ASIN.ATAN.ATAN2.BENCHMARK.BIN.BINLOG_GTID_POS.BIT_COUNT.BIT_LENGTH.CEIL.CEILING.CHARACTER_LENGTH.CHAR_LENGTH.CHR.COERCIBILITY.COLUMN_CHECK.COLUMN_EXISTS.COLUMN_LIST.COLUMN_JSON.COMPRESS.CONCAT.CONCAT_OPERATOR_ORACLE.CONCAT_WS.CONNECTION_ID.CONV.CONVERT_TZ.COS.COT.CRC32.DATEDIFF.DAYNAME.DAYOFMONTH.DAYOFWEEK.DAYOFYEAR.DEGREES.DECODE_HISTOGRAM.DECODE_ORACLE.DES_DECRYPT.DES_ENCRYPT.ELT.ENCODE.ENCRYPT.EXP.EXPORT_SET.EXTRACTVALUE.FIELD.FIND_IN_SET.FLOOR.FORMAT.FOUND_ROWS.FROM_BASE64.FROM_DAYS.FROM_UNIXTIME.GET_LOCK.GREATEST.HEX.IFNULL.INSTR.ISNULL.IS_FREE_LOCK.IS_USED_LOCK.JSON_ARRAY.JSON_ARRAY_APPEND.JSON_ARRAY_INSERT.JSON_COMPACT.JSON_CONTAINS.JSON_CONTAINS_PATH.JSON_DEPTH.JSON_DETAILED.JSON_EXISTS.JSON_EXTRACT.JSON_INSERT.JSON_KEYS.JSON_LENGTH.JSON_LOOSE.JSON_MERGE.JSON_MERGE_PATCH.JSON_MERGE_PRESERVE.JSON_QUERY.JSON_QUOTE.JSON_OBJECT.JSON_REMOVE.JSON_REPLACE.JSON_SET.JSON_SEARCH.JSON_TYPE.JSON_UNQUOTE.JSON_VALID.JSON_VALUE.LAST_DAY.LAST_INSERT_ID.LCASE.LEAST.LENGTH.LENGTHB.LN.LOAD_FILE.LOCATE.LOG.LOG10.LOG2.LOWER.LPAD.LPAD_ORACLE.LTRIM.LTRIM_ORACLE.MAKEDATE.MAKETIME.MAKE_SET.MASTER_GTID_WAIT.MASTER_POS_WAIT.MD5.MONTHNAME.NAME_CONST.NVL.NVL2.OCT.OCTET_LENGTH.ORD.PERIOD_ADD.PERIOD_DIFF.PI.POW.POWER.QUOTE.REGEXP_INSTR.REGEXP_REPLACE.REGEXP_SUBSTR.RADIANS.RAND.RELEASE_ALL_LOCKS.RELEASE_LOCK.REPLACE_ORACLE.REVERSE.ROUND.RPAD.RPAD_ORACLE.RTRIM.RTRIM_ORACLE.SEC_TO_TIME.SHA.SHA1.SHA2.SIGN.SIN.SLEEP.SOUNDEX.SPACE.SQRT.STRCMP.STR_TO_DATE.SUBSTR_ORACLE.SUBSTRING_INDEX.SUBTIME.SYS_GUID.TAN.TIMEDIFF.TIME_FORMAT.TIME_TO_SEC.TO_BASE64.TO_CHAR.TO_DAYS.TO_SECONDS.UCASE.UNCOMPRESS.UNCOMPRESSED_LENGTH.UNHEX.UNIX_TIMESTAMP.UPDATEXML.UPPER.UUID.UUID_SHORT.VERSION.WEEKDAY.WEEKOFYEAR.WSREP_LAST_WRITTEN_GTID.WSREP_LAST_SEEN_GTID.WSREP_SYNC_WAIT_UPTO_GTID.YEARWEEK.COALESCE.NULLIF".split("."), rr = w(["SELECT [ALL | DISTINCT | DISTINCTROW]"]), ir = w([
	"WITH [RECURSIVE]",
	"FROM",
	"WHERE",
	"GROUP BY",
	"HAVING",
	"PARTITION BY",
	"ORDER BY",
	"LIMIT",
	"OFFSET",
	"FETCH {FIRST | NEXT}",
	"INSERT [LOW_PRIORITY | DELAYED | HIGH_PRIORITY] [IGNORE] [INTO]",
	"REPLACE [LOW_PRIORITY | DELAYED] [INTO]",
	"VALUES",
	"ON DUPLICATE KEY UPDATE",
	"SET",
	"RETURNING"
]), ar = w(["CREATE [OR REPLACE] [TEMPORARY] TABLE [IF NOT EXISTS]"]), or = w(/* @__PURE__ */ "CREATE [OR REPLACE] [SQL SECURITY DEFINER | SQL SECURITY INVOKER] VIEW [IF NOT EXISTS].UPDATE [LOW_PRIORITY] [IGNORE].DELETE [LOW_PRIORITY] [QUICK] [IGNORE] FROM.DROP [TEMPORARY] TABLE [IF EXISTS].ALTER [ONLINE] [IGNORE] TABLE [IF EXISTS].ADD [COLUMN] [IF NOT EXISTS].{CHANGE | MODIFY} [COLUMN] [IF EXISTS].DROP [COLUMN] [IF EXISTS].RENAME [TO].RENAME COLUMN.ALTER [COLUMN].{SET | DROP} DEFAULT.SET {VISIBLE | INVISIBLE}.TRUNCATE [TABLE].ALTER DATABASE.ALTER DATABASE COMMENT.ALTER EVENT.ALTER FUNCTION.ALTER PROCEDURE.ALTER SCHEMA.ALTER SCHEMA COMMENT.ALTER SEQUENCE.ALTER SERVER.ALTER USER.ALTER VIEW.ANALYZE.ANALYZE TABLE.BACKUP LOCK.BACKUP STAGE.BACKUP UNLOCK.BEGIN.BINLOG.CACHE INDEX.CALL.CHANGE MASTER TO.CHECK TABLE.CHECK VIEW.CHECKSUM TABLE.COMMIT.CREATE AGGREGATE FUNCTION.CREATE DATABASE.CREATE EVENT.CREATE FUNCTION.CREATE INDEX.CREATE PROCEDURE.CREATE ROLE.CREATE SEQUENCE.CREATE SERVER.CREATE SPATIAL INDEX.CREATE TRIGGER.CREATE UNIQUE INDEX.CREATE USER.DEALLOCATE PREPARE.DESCRIBE.DROP DATABASE.DROP EVENT.DROP FUNCTION.DROP INDEX.DROP PREPARE.DROP PROCEDURE.DROP ROLE.DROP SEQUENCE.DROP SERVER.DROP TRIGGER.DROP USER.DROP VIEW.EXECUTE.EXPLAIN.FLUSH.GET DIAGNOSTICS.GET DIAGNOSTICS CONDITION.GRANT.HANDLER.HELP.INSTALL PLUGIN.INSTALL SONAME.KILL.LOAD DATA INFILE.LOAD INDEX INTO CACHE.LOAD XML INFILE.LOCK TABLE.OPTIMIZE TABLE.PREPARE.PURGE BINARY LOGS.PURGE MASTER LOGS.RELEASE SAVEPOINT.RENAME TABLE.RENAME USER.REPAIR TABLE.REPAIR VIEW.RESET MASTER.RESET QUERY CACHE.RESET REPLICA.RESET SLAVE.RESIGNAL.REVOKE.ROLLBACK.SAVEPOINT.SET CHARACTER SET.SET DEFAULT ROLE.SET GLOBAL TRANSACTION.SET NAMES.SET PASSWORD.SET ROLE.SET STATEMENT.SET TRANSACTION.SHOW.SHOW ALL REPLICAS STATUS.SHOW ALL SLAVES STATUS.SHOW AUTHORS.SHOW BINARY LOGS.SHOW BINLOG EVENTS.SHOW BINLOG STATUS.SHOW CHARACTER SET.SHOW CLIENT_STATISTICS.SHOW COLLATION.SHOW COLUMNS.SHOW CONTRIBUTORS.SHOW CREATE DATABASE.SHOW CREATE EVENT.SHOW CREATE FUNCTION.SHOW CREATE PACKAGE.SHOW CREATE PACKAGE BODY.SHOW CREATE PROCEDURE.SHOW CREATE SEQUENCE.SHOW CREATE TABLE.SHOW CREATE TRIGGER.SHOW CREATE USER.SHOW CREATE VIEW.SHOW DATABASES.SHOW ENGINE.SHOW ENGINE INNODB STATUS.SHOW ENGINES.SHOW ERRORS.SHOW EVENTS.SHOW EXPLAIN.SHOW FUNCTION CODE.SHOW FUNCTION STATUS.SHOW GRANTS.SHOW INDEX.SHOW INDEXES.SHOW INDEX_STATISTICS.SHOW KEYS.SHOW LOCALES.SHOW MASTER LOGS.SHOW MASTER STATUS.SHOW OPEN TABLES.SHOW PACKAGE BODY CODE.SHOW PACKAGE BODY STATUS.SHOW PACKAGE STATUS.SHOW PLUGINS.SHOW PLUGINS SONAME.SHOW PRIVILEGES.SHOW PROCEDURE CODE.SHOW PROCEDURE STATUS.SHOW PROCESSLIST.SHOW PROFILE.SHOW PROFILES.SHOW QUERY_RESPONSE_TIME.SHOW RELAYLOG EVENTS.SHOW REPLICA.SHOW REPLICA HOSTS.SHOW REPLICA STATUS.SHOW SCHEMAS.SHOW SLAVE.SHOW SLAVE HOSTS.SHOW SLAVE STATUS.SHOW STATUS.SHOW STORAGE ENGINES.SHOW TABLE STATUS.SHOW TABLES.SHOW TRIGGERS.SHOW USER_STATISTICS.SHOW VARIABLES.SHOW WARNINGS.SHOW WSREP_MEMBERSHIP.SHOW WSREP_STATUS.SHUTDOWN.SIGNAL.START ALL REPLICAS.START ALL SLAVES.START REPLICA.START SLAVE.START TRANSACTION.STOP ALL REPLICAS.STOP ALL SLAVES.STOP REPLICA.STOP SLAVE.UNINSTALL PLUGIN.UNINSTALL SONAME.UNLOCK TABLE.USE.XA BEGIN.XA COMMIT.XA END.XA PREPARE.XA RECOVER.XA ROLLBACK.XA START".split(".")), sr = w([
	"UNION [ALL | DISTINCT]",
	"EXCEPT [ALL | DISTINCT]",
	"INTERSECT [ALL | DISTINCT]",
	"MINUS [ALL | DISTINCT]"
]), cr = w([
	"JOIN",
	"{LEFT | RIGHT} [OUTER] JOIN",
	"{INNER | CROSS} JOIN",
	"NATURAL JOIN",
	"NATURAL {LEFT | RIGHT} [OUTER] JOIN",
	"STRAIGHT_JOIN"
]), lr = w([
	"ON {UPDATE | DELETE} [SET NULL | SET DEFAULT]",
	"CHARACTER SET",
	"{ROWS | RANGE} BETWEEN",
	"IDENTIFIED BY"
]), ur = w([]), dr = {
	name: "mariadb",
	tokenizerOptions: {
		reservedSelect: rr,
		reservedClauses: [
			...ir,
			...ar,
			...or
		],
		reservedSetOperations: sr,
		reservedJoins: cr,
		reservedKeywordPhrases: lr,
		reservedDataTypePhrases: ur,
		supportsXor: !0,
		reservedKeywords: er,
		reservedDataTypes: tr,
		reservedFunctionNames: nr,
		stringTypes: [
			"\"\"-qq-bs",
			"''-qq-bs",
			{
				quote: "''-raw",
				prefixes: ["B", "X"],
				requirePrefix: !0
			}
		],
		identTypes: ["``"],
		identChars: {
			first: "$",
			rest: "$",
			allowFirstCharNumber: !0
		},
		variableTypes: [
			{ regex: "@@?[A-Za-z0-9_.$]+" },
			{
				quote: "\"\"-qq-bs",
				prefixes: ["@"],
				requirePrefix: !0
			},
			{
				quote: "''-qq-bs",
				prefixes: ["@"],
				requirePrefix: !0
			},
			{
				quote: "``",
				prefixes: ["@"],
				requirePrefix: !0
			}
		],
		paramTypes: { positional: !0 },
		lineCommentTypes: ["--", "#"],
		operators: [
			"%",
			":=",
			"&",
			"|",
			"^",
			"~",
			"<<",
			">>",
			"<=>",
			"&&",
			"||",
			"!",
			"*.*"
		],
		postProcess: $n
	},
	formatOptions: {
		onelineClauses: [...ar, ...or],
		tabularOnelineClauses: or
	}
}, fr = /* @__PURE__ */ "ACCESSIBLE.ADD.ALL.ALTER.ANALYZE.AND.AS.ASC.ASENSITIVE.BEFORE.BETWEEN.BOTH.BY.CALL.CASCADE.CASE.CHANGE.CHECK.COLLATE.COLUMN.CONDITION.CONSTRAINT.CONTINUE.CONVERT.CREATE.CROSS.CUBE.CUME_DIST.CURRENT_DATE.CURRENT_TIME.CURRENT_TIMESTAMP.CURRENT_USER.CURSOR.DATABASE.DATABASES.DAY_HOUR.DAY_MICROSECOND.DAY_MINUTE.DAY_SECOND.DECLARE.DEFAULT.DELAYED.DELETE.DENSE_RANK.DESC.DESCRIBE.DETERMINISTIC.DISTINCT.DISTINCTROW.DIV.DROP.DUAL.EACH.ELSE.ELSEIF.EMPTY.ENCLOSED.ESCAPED.EXCEPT.EXISTS.EXIT.EXPLAIN.FALSE.FETCH.FIRST_VALUE.FOR.FORCE.FOREIGN.FROM.FULLTEXT.FUNCTION.GENERATED.GET.GRANT.GROUP.GROUPING.GROUPS.HAVING.HIGH_PRIORITY.HOUR_MICROSECOND.HOUR_MINUTE.HOUR_SECOND.IF.IGNORE.IN.INDEX.INFILE.INNER.INOUT.INSENSITIVE.INSERT.IN.INTERSECT.INTERVAL.INTO.IO_AFTER_GTIDS.IO_BEFORE_GTIDS.IS.ITERATE.JOIN.JSON_TABLE.KEY.KEYS.KILL.LAG.LAST_VALUE.LATERAL.LEAD.LEADING.LEAVE.LEFT.LIKE.LIMIT.LINEAR.LINES.LOAD.LOCALTIME.LOCALTIMESTAMP.LOCK.LONG.LOOP.LOW_PRIORITY.MASTER_BIND.MASTER_SSL_VERIFY_SERVER_CERT.MATCH.MAXVALUE.MINUTE_MICROSECOND.MINUTE_SECOND.MOD.MODIFIES.NATURAL.NOT.NO_WRITE_TO_BINLOG.NTH_VALUE.NTILE.NULL.OF.ON.OPTIMIZE.OPTIMIZER_COSTS.OPTION.OPTIONALLY.OR.ORDER.OUT.OUTER.OUTFILE.OVER.PARTITION.PERCENT_RANK.PRIMARY.PROCEDURE.PURGE.RANGE.RANK.READ.READS.READ_WRITE.RECURSIVE.REFERENCES.REGEXP.RELEASE.RENAME.REPEAT.REPLACE.REQUIRE.RESIGNAL.RESTRICT.RETURN.REVOKE.RIGHT.RLIKE.ROW.ROWS.ROW_NUMBER.SCHEMA.SCHEMAS.SECOND_MICROSECOND.SELECT.SENSITIVE.SEPARATOR.SET.SHOW.SIGNAL.SPATIAL.SPECIFIC.SQL.SQLEXCEPTION.SQLSTATE.SQLWARNING.SQL_BIG_RESULT.SQL_CALC_FOUND_ROWS.SQL_SMALL_RESULT.SSL.STARTING.STORED.STRAIGHT_JOIN.SYSTEM.TABLE.TERMINATED.THEN.TO.TRAILING.TRIGGER.TRUE.UNDO.UNION.UNIQUE.UNLOCK.UNSIGNED.UPDATE.USAGE.USE.USING.UTC_DATE.UTC_TIME.UTC_TIMESTAMP.VALUES.VIRTUAL.WHEN.WHERE.WHILE.WINDOW.WITH.WRITE.XOR.YEAR_MONTH.ZEROFILL".split("."), pr = /* @__PURE__ */ "BIGINT.BINARY.BIT.BLOB.BOOL.BOOLEAN.CHAR.CHARACTER.DATE.DATETIME.DEC.DECIMAL.DOUBLE PRECISION.DOUBLE.ENUM.FIXED.FLOAT.FLOAT4.FLOAT8.INT.INT1.INT2.INT3.INT4.INT8.INTEGER.LONGBLOB.LONGTEXT.MEDIUMBLOB.MEDIUMINT.MEDIUMTEXT.MIDDLEINT.NATIONAL CHAR.NATIONAL VARCHAR.NUMERIC.PRECISION.REAL.SMALLINT.TEXT.TIME.TIMESTAMP.TINYBLOB.TINYINT.TINYTEXT.VARBINARY.VARCHAR.VARCHARACTER.VARYING.YEAR".split("."), mr = /* @__PURE__ */ "ABS.ACOS.ADDDATE.ADDTIME.AES_DECRYPT.AES_ENCRYPT.ANY_VALUE.ASCII.ASIN.ATAN.ATAN2.AVG.BENCHMARK.BIN.BIN_TO_UUID.BINARY.BIT_AND.BIT_COUNT.BIT_LENGTH.BIT_OR.BIT_XOR.CAN_ACCESS_COLUMN.CAN_ACCESS_DATABASE.CAN_ACCESS_TABLE.CAN_ACCESS_USER.CAN_ACCESS_VIEW.CAST.CEIL.CEILING.CHAR.CHAR_LENGTH.CHARACTER_LENGTH.CHARSET.COALESCE.COERCIBILITY.COLLATION.COMPRESS.CONCAT.CONCAT_WS.CONNECTION_ID.CONV.CONVERT.CONVERT_TZ.COS.COT.COUNT.CRC32.CUME_DIST.CURDATE.CURRENT_DATE.CURRENT_ROLE.CURRENT_TIME.CURRENT_TIMESTAMP.CURRENT_USER.CURTIME.DATABASE.DATE.DATE_ADD.DATE_FORMAT.DATE_SUB.DATEDIFF.DAY.DAYNAME.DAYOFMONTH.DAYOFWEEK.DAYOFYEAR.DEFAULT.DEGREES.DENSE_RANK.DIV.ELT.EXP.EXPORT_SET.EXTRACT.EXTRACTVALUE.FIELD.FIND_IN_SET.FIRST_VALUE.FLOOR.FORMAT.FORMAT_BYTES.FORMAT_PICO_TIME.FOUND_ROWS.FROM_BASE64.FROM_DAYS.FROM_UNIXTIME.GEOMCOLLECTION.GEOMETRYCOLLECTION.GET_DD_COLUMN_PRIVILEGES.GET_DD_CREATE_OPTIONS.GET_DD_INDEX_SUB_PART_LENGTH.GET_FORMAT.GET_LOCK.GREATEST.GROUP_CONCAT.GROUPING.GTID_SUBSET.GTID_SUBTRACT.HEX.HOUR.ICU_VERSION.IF.IFNULL.INET_ATON.INET_NTOA.INET6_ATON.INET6_NTOA.INSERT.INSTR.INTERNAL_AUTO_INCREMENT.INTERNAL_AVG_ROW_LENGTH.INTERNAL_CHECK_TIME.INTERNAL_CHECKSUM.INTERNAL_DATA_FREE.INTERNAL_DATA_LENGTH.INTERNAL_DD_CHAR_LENGTH.INTERNAL_GET_COMMENT_OR_ERROR.INTERNAL_GET_ENABLED_ROLE_JSON.INTERNAL_GET_HOSTNAME.INTERNAL_GET_USERNAME.INTERNAL_GET_VIEW_WARNING_OR_ERROR.INTERNAL_INDEX_COLUMN_CARDINALITY.INTERNAL_INDEX_LENGTH.INTERNAL_IS_ENABLED_ROLE.INTERNAL_IS_MANDATORY_ROLE.INTERNAL_KEYS_DISABLED.INTERNAL_MAX_DATA_LENGTH.INTERNAL_TABLE_ROWS.INTERNAL_UPDATE_TIME.INTERVAL.IS.IS_FREE_LOCK.IS_IPV4.IS_IPV4_COMPAT.IS_IPV4_MAPPED.IS_IPV6.IS NOT.IS NOT NULL.IS NULL.IS_USED_LOCK.IS_UUID.ISNULL.JSON_ARRAY.JSON_ARRAY_APPEND.JSON_ARRAY_INSERT.JSON_ARRAYAGG.JSON_CONTAINS.JSON_CONTAINS_PATH.JSON_DEPTH.JSON_EXTRACT.JSON_INSERT.JSON_KEYS.JSON_LENGTH.JSON_MERGE.JSON_MERGE_PATCH.JSON_MERGE_PRESERVE.JSON_OBJECT.JSON_OBJECTAGG.JSON_OVERLAPS.JSON_PRETTY.JSON_QUOTE.JSON_REMOVE.JSON_REPLACE.JSON_SCHEMA_VALID.JSON_SCHEMA_VALIDATION_REPORT.JSON_SEARCH.JSON_SET.JSON_STORAGE_FREE.JSON_STORAGE_SIZE.JSON_TABLE.JSON_TYPE.JSON_UNQUOTE.JSON_VALID.JSON_VALUE.LAG.LAST_DAY.LAST_INSERT_ID.LAST_VALUE.LCASE.LEAD.LEAST.LEFT.LENGTH.LIKE.LINESTRING.LN.LOAD_FILE.LOCALTIME.LOCALTIMESTAMP.LOCATE.LOG.LOG10.LOG2.LOWER.LPAD.LTRIM.MAKE_SET.MAKEDATE.MAKETIME.MASTER_POS_WAIT.MATCH.MAX.MBRCONTAINS.MBRCOVEREDBY.MBRCOVERS.MBRDISJOINT.MBREQUALS.MBRINTERSECTS.MBROVERLAPS.MBRTOUCHES.MBRWITHIN.MD5.MICROSECOND.MID.MIN.MINUTE.MOD.MONTH.MONTHNAME.MULTILINESTRING.MULTIPOINT.MULTIPOLYGON.NAME_CONST.NOW.NTH_VALUE.NTILE.NULLIF.OCT.OCTET_LENGTH.ORD.PERCENT_RANK.PERIOD_ADD.PERIOD_DIFF.PI.POINT.POLYGON.POSITION.POW.POWER.PS_CURRENT_THREAD_ID.PS_THREAD_ID.QUARTER.QUOTE.RADIANS.RAND.RANDOM_BYTES.RANK.REGEXP.REGEXP_INSTR.REGEXP_LIKE.REGEXP_REPLACE.REGEXP_SUBSTR.RELEASE_ALL_LOCKS.RELEASE_LOCK.REPEAT.REPLACE.REVERSE.RIGHT.RLIKE.ROLES_GRAPHML.ROUND.ROW_COUNT.ROW_NUMBER.RPAD.RTRIM.SCHEMA.SEC_TO_TIME.SECOND.SESSION_USER.SHA1.SHA2.SIGN.SIN.SLEEP.SOUNDEX.SOUNDS LIKE.SOURCE_POS_WAIT.SPACE.SQRT.ST_AREA.ST_ASBINARY.ST_ASGEOJSON.ST_ASTEXT.ST_BUFFER.ST_BUFFER_STRATEGY.ST_CENTROID.ST_COLLECT.ST_CONTAINS.ST_CONVEXHULL.ST_CROSSES.ST_DIFFERENCE.ST_DIMENSION.ST_DISJOINT.ST_DISTANCE.ST_DISTANCE_SPHERE.ST_ENDPOINT.ST_ENVELOPE.ST_EQUALS.ST_EXTERIORRING.ST_FRECHETDISTANCE.ST_GEOHASH.ST_GEOMCOLLFROMTEXT.ST_GEOMCOLLFROMWKB.ST_GEOMETRYN.ST_GEOMETRYTYPE.ST_GEOMFROMGEOJSON.ST_GEOMFROMTEXT.ST_GEOMFROMWKB.ST_HAUSDORFFDISTANCE.ST_INTERIORRINGN.ST_INTERSECTION.ST_INTERSECTS.ST_ISCLOSED.ST_ISEMPTY.ST_ISSIMPLE.ST_ISVALID.ST_LATFROMGEOHASH.ST_LATITUDE.ST_LENGTH.ST_LINEFROMTEXT.ST_LINEFROMWKB.ST_LINEINTERPOLATEPOINT.ST_LINEINTERPOLATEPOINTS.ST_LONGFROMGEOHASH.ST_LONGITUDE.ST_MAKEENVELOPE.ST_MLINEFROMTEXT.ST_MLINEFROMWKB.ST_MPOINTFROMTEXT.ST_MPOINTFROMWKB.ST_MPOLYFROMTEXT.ST_MPOLYFROMWKB.ST_NUMGEOMETRIES.ST_NUMINTERIORRING.ST_NUMPOINTS.ST_OVERLAPS.ST_POINTATDISTANCE.ST_POINTFROMGEOHASH.ST_POINTFROMTEXT.ST_POINTFROMWKB.ST_POINTN.ST_POLYFROMTEXT.ST_POLYFROMWKB.ST_SIMPLIFY.ST_SRID.ST_STARTPOINT.ST_SWAPXY.ST_SYMDIFFERENCE.ST_TOUCHES.ST_TRANSFORM.ST_UNION.ST_VALIDATE.ST_WITHIN.ST_X.ST_Y.STATEMENT_DIGEST.STATEMENT_DIGEST_TEXT.STD.STDDEV.STDDEV_POP.STDDEV_SAMP.STR_TO_DATE.STRCMP.SUBDATE.SUBSTR.SUBSTRING.SUBSTRING_INDEX.SUBTIME.SUM.SYSDATE.SYSTEM_USER.TAN.TIME.TIME_FORMAT.TIME_TO_SEC.TIMEDIFF.TIMESTAMP.TIMESTAMPADD.TIMESTAMPDIFF.TO_BASE64.TO_DAYS.TO_SECONDS.TRIM.TRUNCATE.UCASE.UNCOMPRESS.UNCOMPRESSED_LENGTH.UNHEX.UNIX_TIMESTAMP.UPDATEXML.UPPER.UTC_DATE.UTC_TIME.UTC_TIMESTAMP.UUID.UUID_SHORT.UUID_TO_BIN.VALIDATE_PASSWORD_STRENGTH.VALUES.VAR_POP.VAR_SAMP.VARIANCE.VERSION.WAIT_FOR_EXECUTED_GTID_SET.WAIT_UNTIL_SQL_THREAD_AFTER_GTIDS.WEEK.WEEKDAY.WEEKOFYEAR.WEIGHT_STRING.YEAR.YEARWEEK".split("."), hr = w(["SELECT [ALL | DISTINCT | DISTINCTROW]"]), gr = w([
	"WITH [RECURSIVE]",
	"FROM",
	"WHERE",
	"GROUP BY",
	"HAVING",
	"WINDOW",
	"PARTITION BY",
	"ORDER BY",
	"LIMIT",
	"OFFSET",
	"INSERT [LOW_PRIORITY | DELAYED | HIGH_PRIORITY] [IGNORE] [INTO]",
	"REPLACE [LOW_PRIORITY | DELAYED] [INTO]",
	"VALUES",
	"ON DUPLICATE KEY UPDATE",
	"SET"
]), _r = w(["CREATE [TEMPORARY] TABLE [IF NOT EXISTS]"]), vr = w(/* @__PURE__ */ "CREATE [OR REPLACE] [SQL SECURITY DEFINER | SQL SECURITY INVOKER] VIEW [IF NOT EXISTS].UPDATE [LOW_PRIORITY] [IGNORE].DELETE [LOW_PRIORITY] [QUICK] [IGNORE] FROM.DROP [TEMPORARY] TABLE [IF EXISTS].ALTER TABLE.ADD [COLUMN].{CHANGE | MODIFY} [COLUMN].DROP [COLUMN].RENAME [TO | AS].RENAME COLUMN.ALTER [COLUMN].{SET | DROP} DEFAULT.TRUNCATE [TABLE].ALTER DATABASE.ALTER EVENT.ALTER FUNCTION.ALTER INSTANCE.ALTER LOGFILE GROUP.ALTER PROCEDURE.ALTER RESOURCE GROUP.ALTER SERVER.ALTER TABLESPACE.ALTER USER.ALTER VIEW.ANALYZE TABLE.BINLOG.CACHE INDEX.CALL.CHANGE MASTER TO.CHANGE REPLICATION FILTER.CHANGE REPLICATION SOURCE TO.CHECK TABLE.CHECKSUM TABLE.CLONE.COMMIT.CREATE DATABASE.CREATE EVENT.CREATE FUNCTION.CREATE FUNCTION.CREATE INDEX.CREATE LOGFILE GROUP.CREATE PROCEDURE.CREATE RESOURCE GROUP.CREATE ROLE.CREATE SERVER.CREATE SPATIAL REFERENCE SYSTEM.CREATE TABLESPACE.CREATE TRIGGER.CREATE USER.DEALLOCATE PREPARE.DESCRIBE.DROP DATABASE.DROP EVENT.DROP FUNCTION.DROP FUNCTION.DROP INDEX.DROP LOGFILE GROUP.DROP PROCEDURE.DROP RESOURCE GROUP.DROP ROLE.DROP SERVER.DROP SPATIAL REFERENCE SYSTEM.DROP TABLESPACE.DROP TRIGGER.DROP USER.DROP VIEW.EXECUTE.EXPLAIN.FLUSH.GRANT.HANDLER.HELP.IMPORT TABLE.INSTALL COMPONENT.INSTALL PLUGIN.KILL.LOAD DATA.LOAD INDEX INTO CACHE.LOAD XML.LOCK INSTANCE FOR BACKUP.LOCK TABLES.MASTER_POS_WAIT.OPTIMIZE TABLE.PREPARE.PURGE BINARY LOGS.RELEASE SAVEPOINT.RENAME TABLE.RENAME USER.REPAIR TABLE.RESET.RESET MASTER.RESET PERSIST.RESET REPLICA.RESET SLAVE.RESTART.REVOKE.ROLLBACK.ROLLBACK TO SAVEPOINT.SAVEPOINT.SET CHARACTER SET.SET DEFAULT ROLE.SET NAMES.SET PASSWORD.SET RESOURCE GROUP.SET ROLE.SET TRANSACTION.SHOW.SHOW BINARY LOGS.SHOW BINLOG EVENTS.SHOW CHARACTER SET.SHOW COLLATION.SHOW COLUMNS.SHOW CREATE DATABASE.SHOW CREATE EVENT.SHOW CREATE FUNCTION.SHOW CREATE PROCEDURE.SHOW CREATE TABLE.SHOW CREATE TRIGGER.SHOW CREATE USER.SHOW CREATE VIEW.SHOW DATABASES.SHOW ENGINE.SHOW ENGINES.SHOW ERRORS.SHOW EVENTS.SHOW FUNCTION CODE.SHOW FUNCTION STATUS.SHOW GRANTS.SHOW INDEX.SHOW MASTER STATUS.SHOW OPEN TABLES.SHOW PLUGINS.SHOW PRIVILEGES.SHOW PROCEDURE CODE.SHOW PROCEDURE STATUS.SHOW PROCESSLIST.SHOW PROFILE.SHOW PROFILES.SHOW RELAYLOG EVENTS.SHOW REPLICA STATUS.SHOW REPLICAS.SHOW SLAVE.SHOW SLAVE HOSTS.SHOW STATUS.SHOW TABLE STATUS.SHOW TABLES.SHOW TRIGGERS.SHOW VARIABLES.SHOW WARNINGS.SHUTDOWN.SOURCE_POS_WAIT.START GROUP_REPLICATION.START REPLICA.START SLAVE.START TRANSACTION.STOP GROUP_REPLICATION.STOP REPLICA.STOP SLAVE.TABLE.UNINSTALL COMPONENT.UNINSTALL PLUGIN.UNLOCK INSTANCE.UNLOCK TABLES.USE.XA.ITERATE.LEAVE.LOOP.REPEAT.RETURN.WHILE".split(".")), yr = w(["UNION [ALL | DISTINCT]"]), br = w([
	"JOIN",
	"{LEFT | RIGHT} [OUTER] JOIN",
	"{INNER | CROSS} JOIN",
	"NATURAL [INNER] JOIN",
	"NATURAL {LEFT | RIGHT} [OUTER] JOIN",
	"STRAIGHT_JOIN"
]), xr = w([
	"ON {UPDATE | DELETE} [SET NULL]",
	"CHARACTER SET",
	"{ROWS | RANGE} BETWEEN",
	"IDENTIFIED BY"
]), Sr = w([]), Cr = {
	name: "mysql",
	tokenizerOptions: {
		reservedSelect: hr,
		reservedClauses: [
			...gr,
			..._r,
			...vr
		],
		reservedSetOperations: yr,
		reservedJoins: br,
		reservedKeywordPhrases: xr,
		reservedDataTypePhrases: Sr,
		supportsXor: !0,
		reservedKeywords: fr,
		reservedDataTypes: pr,
		reservedFunctionNames: mr,
		stringTypes: [
			"\"\"-qq-bs",
			{
				quote: "''-qq-bs",
				prefixes: ["N"]
			},
			{
				quote: "''-raw",
				prefixes: ["B", "X"],
				requirePrefix: !0
			}
		],
		identTypes: ["``"],
		identChars: {
			first: "$",
			rest: "$",
			allowFirstCharNumber: !0
		},
		variableTypes: [
			{ regex: "@@?[A-Za-z0-9_.$]+" },
			{
				quote: "\"\"-qq-bs",
				prefixes: ["@"],
				requirePrefix: !0
			},
			{
				quote: "''-qq-bs",
				prefixes: ["@"],
				requirePrefix: !0
			},
			{
				quote: "``",
				prefixes: ["@"],
				requirePrefix: !0
			}
		],
		paramTypes: { positional: !0 },
		lineCommentTypes: ["--", "#"],
		operators: [
			"%",
			":=",
			"&",
			"|",
			"^",
			"~",
			"<<",
			">>",
			"<=>",
			"->",
			"->>",
			"&&",
			"||",
			"!",
			"*.*"
		],
		postProcess: $n
	},
	formatOptions: {
		onelineClauses: [..._r, ...vr],
		tabularOnelineClauses: vr
	}
}, wr = /* @__PURE__ */ "ADD.ALL.ALTER.ANALYZE.AND.ARRAY.AS.ASC.BETWEEN.BOTH.BY.CALL.CASCADE.CASE.CHANGE.CHECK.COLLATE.COLUMN.CONSTRAINT.CONTINUE.CONVERT.CREATE.CROSS.CURRENT_DATE.CURRENT_ROLE.CURRENT_TIME.CURRENT_TIMESTAMP.CURRENT_USER.CURSOR.DATABASE.DATABASES.DAY_HOUR.DAY_MICROSECOND.DAY_MINUTE.DAY_SECOND.DEFAULT.DELAYED.DELETE.DESC.DESCRIBE.DISTINCT.DISTINCTROW.DIV.DOUBLE.DROP.DUAL.ELSE.ELSEIF.ENCLOSED.ESCAPED.EXCEPT.EXISTS.EXIT.EXPLAIN.FALSE.FETCH.FOR.FORCE.FOREIGN.FROM.FULLTEXT.GENERATED.GRANT.GROUP.GROUPS.HAVING.HIGH_PRIORITY.HOUR_MICROSECOND.HOUR_MINUTE.HOUR_SECOND.IF.IGNORE.ILIKE.IN.INDEX.INFILE.INNER.INOUT.INSERT.INTERSECT.INTERVAL.INTO.IS.ITERATE.JOIN.KEY.KEYS.KILL.LEADING.LEAVE.LEFT.LIKE.LIMIT.LINEAR.LINES.LOAD.LOCALTIME.LOCALTIMESTAMP.LOCK.LONG.LOW_PRIORITY.MATCH.MAXVALUE.MINUTE_MICROSECOND.MINUTE_SECOND.MOD.NATURAL.NOT.NO_WRITE_TO_BINLOG.NULL.OF.ON.OPTIMIZE.OPTION.OPTIONALLY.OR.ORDER.OUT.OUTER.OUTFILE.OVER.PARTITION.PRIMARY.PROCEDURE.RANGE.READ.RECURSIVE.REFERENCES.REGEXP.RELEASE.RENAME.REPEAT.REPLACE.REQUIRE.RESTRICT.REVOKE.RIGHT.RLIKE.ROW.ROWS.SECOND_MICROSECOND.SELECT.SET.SHOW.SPATIAL.SQL.SQLEXCEPTION.SQLSTATE.SQLWARNING.SQL_BIG_RESULT.SQL_CALC_FOUND_ROWS.SQL_SMALL_RESULT.SSL.STARTING.STATS_EXTENDED.STORED.STRAIGHT_JOIN.TABLE.TABLESAMPLE.TERMINATED.THEN.TO.TRAILING.TRIGGER.TRUE.TiDB_CURRENT_TSO.UNION.UNIQUE.UNLOCK.UNSIGNED.UNTIL.UPDATE.USAGE.USE.USING.UTC_DATE.UTC_TIME.UTC_TIMESTAMP.VALUES.VIRTUAL.WHEN.WHERE.WHILE.WINDOW.WITH.WRITE.XOR.YEAR_MONTH.ZEROFILL".split("."), Tr = /* @__PURE__ */ "BIGINT.BINARY.BIT.BLOB.BOOL.BOOLEAN.CHAR.CHARACTER.DATE.DATETIME.DEC.DECIMAL.DOUBLE PRECISION.DOUBLE.ENUM.FIXED.INT.INT1.INT2.INT3.INT4.INT8.INTEGER.LONGBLOB.LONGTEXT.MEDIUMBLOB.MEDIUMINT.MIDDLEINT.NATIONAL CHAR.NATIONAL VARCHAR.NUMERIC.PRECISION.SMALLINT.TEXT.TIME.TIMESTAMP.TINYBLOB.TINYINT.TINYTEXT.VARBINARY.VARCHAR.VARCHARACTER.VARYING.YEAR".split("."), Er = /* @__PURE__ */ "ABS.ACOS.ADDDATE.ADDTIME.AES_DECRYPT.AES_ENCRYPT.ANY_VALUE.ASCII.ASIN.ATAN.ATAN2.AVG.BENCHMARK.BIN.BIN_TO_UUID.BIT_AND.BIT_COUNT.BIT_LENGTH.BIT_OR.BIT_XOR.BITAND.BITNEG.BITOR.BITXOR.CASE.CAST.CEIL.CEILING.CHAR_FUNC.CHAR_LENGTH.CHARACTER_LENGTH.CHARSET.COALESCE.COERCIBILITY.COLLATION.COMPRESS.CONCAT.CONCAT_WS.CONNECTION_ID.CONV.CONVERT.CONVERT_TZ.COS.COT.COUNT.CRC32.CUME_DIST.CURDATE.CURRENT_DATE.CURRENT_RESOURCE_GROUP.CURRENT_ROLE.CURRENT_TIME.CURRENT_TIMESTAMP.CURRENT_USER.CURTIME.DATABASE.DATE.DATE_ADD.DATE_FORMAT.DATE_SUB.DATEDIFF.DAY.DAYNAME.DAYOFMONTH.DAYOFWEEK.DAYOFYEAR.DECODE.DEFAULT_FUNC.DEGREES.DENSE_RANK.DES_DECRYPT.DES_ENCRYPT.DIV.ELT.ENCODE.ENCRYPT.EQ.EXP.EXPORT_SET.EXTRACT.FIELD.FIND_IN_SET.FIRST_VALUE.FLOOR.FORMAT.FORMAT_BYTES.FORMAT_NANO_TIME.FOUND_ROWS.FROM_BASE64.FROM_DAYS.FROM_UNIXTIME.GE.GET_FORMAT.GET_LOCK.GETPARAM.GREATEST.GROUP_CONCAT.GROUPING.GT.HEX.HOUR.IF.IFNULL.ILIKE.INET6_ATON.INET6_NTOA.INET_ATON.INET_NTOA.INSERT_FUNC.INSTR.INTDIV.INTERVAL.IS_FREE_LOCK.IS_IPV4.IS_IPV4_COMPAT.IS_IPV4_MAPPED.IS_IPV6.IS_USED_LOCK.IS_UUID.ISFALSE.ISNULL.ISTRUE.JSON_ARRAY.JSON_ARRAYAGG.JSON_ARRAY_APPEND.JSON_ARRAY_INSERT.JSON_CONTAINS.JSON_CONTAINS_PATH.JSON_DEPTH.JSON_EXTRACT.JSON_INSERT.JSON_KEYS.JSON_LENGTH.JSON_MEMBEROF.JSON_MERGE.JSON_MERGE_PATCH.JSON_MERGE_PRESERVE.JSON_OBJECT.JSON_OBJECTAGG.JSON_OVERLAPS.JSON_PRETTY.JSON_QUOTE.JSON_REMOVE.JSON_REPLACE.JSON_SEARCH.JSON_SET.JSON_STORAGE_FREE.JSON_STORAGE_SIZE.JSON_TYPE.JSON_UNQUOTE.JSON_VALID.LAG.LAST_DAY.LAST_INSERT_ID.LAST_VALUE.LASTVAL.LCASE.LE.LEAD.LEAST.LEFT.LEFTSHIFT.LENGTH.LIKE.LN.LOAD_FILE.LOCALTIME.LOCALTIMESTAMP.LOCATE.LOG.LOG10.LOG2.LOWER.LPAD.LT.LTRIM.MAKE_SET.MAKEDATE.MAKETIME.MASTER_POS_WAIT.MAX.MD5.MICROSECOND.MID.MIN.MINUS.MINUTE.MOD.MONTH.MONTHNAME.MUL.NAME_CONST.NE.NEXTVAL.NOT.NOW.NTH_VALUE.NTILE.NULLEQ.OCT.OCTET_LENGTH.OLD_PASSWORD.ORD.PASSWORD_FUNC.PERCENT_RANK.PERIOD_ADD.PERIOD_DIFF.PI.PLUS.POSITION.POW.POWER.QUARTER.QUOTE.RADIANS.RAND.RANDOM_BYTES.RANK.REGEXP.REGEXP_INSTR.REGEXP_LIKE.REGEXP_REPLACE.REGEXP_SUBSTR.RELEASE_ALL_LOCKS.RELEASE_LOCK.REPEAT.REPLACE.REVERSE.RIGHT.RIGHTSHIFT.ROUND.ROW_COUNT.ROW_NUMBER.RPAD.RTRIM.SCHEMA.SEC_TO_TIME.SECOND.SESSION_USER.SETVAL.SETVAR.SHA.SHA1.SHA2.SIGN.SIN.SLEEP.SM3.SPACE.SQRT.STD.STDDEV.STDDEV_POP.STDDEV_SAMP.STR_TO_DATE.STRCMP.SUBDATE.SUBSTR.SUBSTRING.SUBSTRING_INDEX.SUBTIME.SUM.SYSDATE.SYSTEM_USER.TAN.TIDB_BOUNDED_STALENESS.TIDB_CURRENT_TSO.TIDB_DECODE_BINARY_PLAN.TIDB_DECODE_KEY.TIDB_DECODE_PLAN.TIDB_DECODE_SQL_DIGESTS.TIDB_ENCODE_SQL_DIGEST.TIDB_IS_DDL_OWNER.TIDB_PARSE_TSO.TIDB_PARSE_TSO_LOGICAL.TIDB_ROW_CHECKSUM.TIDB_SHARD.TIDB_VERSION.TIME.TIME_FORMAT.TIME_TO_SEC.TIMEDIFF.TIMESTAMP.TIMESTAMPADD.TIMESTAMPDIFF.TO_BASE64.TO_DAYS.TO_SECONDS.TRANSLATE.TRIM.TRUNCATE.UCASE.UNARYMINUS.UNCOMPRESS.UNCOMPRESSED_LENGTH.UNHEX.UNIX_TIMESTAMP.UPPER.UTC_DATE.UTC_TIME.UTC_TIMESTAMP.UUID.UUID_SHORT.UUID_TO_BIN.VALIDATE_PASSWORD_STRENGTH.VAR_POP.VAR_SAMP.VARIANCE.VERSION.VITESS_HASH.WEEK.WEEKDAY.WEEKOFYEAR.WEIGHT_STRING.YEAR.YEARWEEK".split("."), Dr = w(["SELECT [ALL | DISTINCT | DISTINCTROW]"]), Or = w([
	"WITH [RECURSIVE]",
	"FROM",
	"WHERE",
	"GROUP BY",
	"HAVING",
	"WINDOW",
	"PARTITION BY",
	"ORDER BY",
	"LIMIT",
	"OFFSET",
	"INSERT [LOW_PRIORITY | DELAYED | HIGH_PRIORITY] [IGNORE] [INTO]",
	"REPLACE [LOW_PRIORITY | DELAYED] [INTO]",
	"VALUES",
	"ON DUPLICATE KEY UPDATE",
	"SET"
]), kr = w(["CREATE [TEMPORARY] TABLE [IF NOT EXISTS]"]), Ar = w(/* @__PURE__ */ "CREATE [OR REPLACE] [SQL SECURITY DEFINER | SQL SECURITY INVOKER] VIEW [IF NOT EXISTS].UPDATE [LOW_PRIORITY] [IGNORE].DELETE [LOW_PRIORITY] [QUICK] [IGNORE] FROM.DROP [TEMPORARY] TABLE [IF EXISTS].ALTER TABLE.ADD [COLUMN].{CHANGE | MODIFY} [COLUMN].DROP [COLUMN].RENAME [TO | AS].RENAME COLUMN.ALTER [COLUMN].{SET | DROP} DEFAULT.TRUNCATE [TABLE].ALTER DATABASE.ALTER INSTANCE.ALTER RESOURCE GROUP.ALTER SEQUENCE.ALTER USER.ALTER VIEW.ANALYZE TABLE.CHECK TABLE.CHECKSUM TABLE.COMMIT.CREATE DATABASE.CREATE INDEX.CREATE RESOURCE GROUP.CREATE ROLE.CREATE SEQUENCE.CREATE USER.DEALLOCATE PREPARE.DESCRIBE.DROP DATABASE.DROP INDEX.DROP RESOURCE GROUP.DROP ROLE.DROP TABLESPACE.DROP USER.DROP VIEW.EXPLAIN.FLUSH.GRANT.IMPORT TABLE.INSTALL COMPONENT.INSTALL PLUGIN.KILL.LOAD DATA.LOCK INSTANCE FOR BACKUP.LOCK TABLES.OPTIMIZE TABLE.PREPARE.RELEASE SAVEPOINT.RENAME TABLE.RENAME USER.REPAIR TABLE.RESET.REVOKE.ROLLBACK.ROLLBACK TO SAVEPOINT.SAVEPOINT.SET CHARACTER SET.SET DEFAULT ROLE.SET NAMES.SET PASSWORD.SET RESOURCE GROUP.SET ROLE.SET TRANSACTION.SHOW.SHOW BINARY LOGS.SHOW BINLOG EVENTS.SHOW CHARACTER SET.SHOW COLLATION.SHOW COLUMNS.SHOW CREATE DATABASE.SHOW CREATE TABLE.SHOW CREATE USER.SHOW CREATE VIEW.SHOW DATABASES.SHOW ENGINE.SHOW ENGINES.SHOW ERRORS.SHOW EVENTS.SHOW GRANTS.SHOW INDEX.SHOW MASTER STATUS.SHOW OPEN TABLES.SHOW PLUGINS.SHOW PRIVILEGES.SHOW PROCESSLIST.SHOW PROFILE.SHOW PROFILES.SHOW STATUS.SHOW TABLE STATUS.SHOW TABLES.SHOW TRIGGERS.SHOW VARIABLES.SHOW WARNINGS.TABLE.UNINSTALL COMPONENT.UNINSTALL PLUGIN.UNLOCK INSTANCE.UNLOCK TABLES.USE".split(".")), jr = w(["UNION [ALL | DISTINCT]"]), Mr = w([
	"JOIN",
	"{LEFT | RIGHT} [OUTER] JOIN",
	"{INNER | CROSS} JOIN",
	"NATURAL [INNER] JOIN",
	"NATURAL {LEFT | RIGHT} [OUTER] JOIN",
	"STRAIGHT_JOIN"
]), Nr = w([
	"ON {UPDATE | DELETE} [SET NULL]",
	"CHARACTER SET",
	"{ROWS | RANGE} BETWEEN",
	"IDENTIFIED BY"
]), Pr = w([]), Fr = {
	name: "tidb",
	tokenizerOptions: {
		reservedSelect: Dr,
		reservedClauses: [
			...Or,
			...kr,
			...Ar
		],
		reservedSetOperations: jr,
		reservedJoins: Mr,
		reservedKeywordPhrases: Nr,
		reservedDataTypePhrases: Pr,
		supportsXor: !0,
		reservedKeywords: wr,
		reservedDataTypes: Tr,
		reservedFunctionNames: Er,
		stringTypes: [
			"\"\"-qq-bs",
			{
				quote: "''-qq-bs",
				prefixes: ["N"]
			},
			{
				quote: "''-raw",
				prefixes: ["B", "X"],
				requirePrefix: !0
			}
		],
		identTypes: ["``"],
		identChars: {
			first: "$",
			rest: "$",
			allowFirstCharNumber: !0
		},
		variableTypes: [
			{ regex: "@@?[A-Za-z0-9_.$]+" },
			{
				quote: "\"\"-qq-bs",
				prefixes: ["@"],
				requirePrefix: !0
			},
			{
				quote: "''-qq-bs",
				prefixes: ["@"],
				requirePrefix: !0
			},
			{
				quote: "``",
				prefixes: ["@"],
				requirePrefix: !0
			}
		],
		paramTypes: { positional: !0 },
		lineCommentTypes: ["--", "#"],
		operators: [
			"%",
			":=",
			"&",
			"|",
			"^",
			"~",
			"<<",
			">>",
			"<=>",
			"->",
			"->>",
			"&&",
			"||",
			"!",
			"*.*"
		],
		postProcess: $n
	},
	formatOptions: {
		onelineClauses: [...kr, ...Ar],
		tabularOnelineClauses: Ar
	}
}, Ir = /* @__PURE__ */ "ABORT.ABS.ACOS.ADVISOR.ARRAY_AGG.ARRAY_AGG.ARRAY_APPEND.ARRAY_AVG.ARRAY_BINARY_SEARCH.ARRAY_CONCAT.ARRAY_CONTAINS.ARRAY_COUNT.ARRAY_DISTINCT.ARRAY_EXCEPT.ARRAY_FLATTEN.ARRAY_IFNULL.ARRAY_INSERT.ARRAY_INTERSECT.ARRAY_LENGTH.ARRAY_MAX.ARRAY_MIN.ARRAY_MOVE.ARRAY_POSITION.ARRAY_PREPEND.ARRAY_PUT.ARRAY_RANGE.ARRAY_REMOVE.ARRAY_REPEAT.ARRAY_REPLACE.ARRAY_REVERSE.ARRAY_SORT.ARRAY_STAR.ARRAY_SUM.ARRAY_SYMDIFF.ARRAY_SYMDIFF1.ARRAY_SYMDIFFN.ARRAY_UNION.ASIN.ATAN.ATAN2.AVG.BASE64.BASE64_DECODE.BASE64_ENCODE.BITAND .BITCLEAR .BITNOT .BITOR .BITSET .BITSHIFT .BITTEST .BITXOR .CEIL.CLOCK_LOCAL.CLOCK_MILLIS.CLOCK_STR.CLOCK_TZ.CLOCK_UTC.COALESCE.CONCAT.CONCAT2.CONTAINS.CONTAINS_TOKEN.CONTAINS_TOKEN_LIKE.CONTAINS_TOKEN_REGEXP.COS.COUNT.COUNT.COUNTN.CUME_DIST.CURL.DATE_ADD_MILLIS.DATE_ADD_STR.DATE_DIFF_MILLIS.DATE_DIFF_STR.DATE_FORMAT_STR.DATE_PART_MILLIS.DATE_PART_STR.DATE_RANGE_MILLIS.DATE_RANGE_STR.DATE_TRUNC_MILLIS.DATE_TRUNC_STR.DECODE.DECODE_JSON.DEGREES.DENSE_RANK.DURATION_TO_STR.ENCODED_SIZE.ENCODE_JSON.EXP.FIRST_VALUE.FLOOR.GREATEST.HAS_TOKEN.IFINF.IFMISSING.IFMISSINGORNULL.IFNAN.IFNANORINF.IFNULL.INITCAP.ISARRAY.ISATOM.ISBITSET.ISBOOLEAN.ISNUMBER.ISOBJECT.ISSTRING.LAG.LAST_VALUE.LEAD.LEAST.LENGTH.LN.LOG.LOWER.LTRIM.MAX.MEAN.MEDIAN.META.MILLIS.MILLIS_TO_LOCAL.MILLIS_TO_STR.MILLIS_TO_TZ.MILLIS_TO_UTC.MILLIS_TO_ZONE_NAME.MIN.MISSINGIF.NANIF.NEGINFIF.NOW_LOCAL.NOW_MILLIS.NOW_STR.NOW_TZ.NOW_UTC.NTH_VALUE.NTILE.NULLIF.NVL.NVL2.OBJECT_ADD.OBJECT_CONCAT.OBJECT_INNER_PAIRS.OBJECT_INNER_VALUES.OBJECT_LENGTH.OBJECT_NAMES.OBJECT_PAIRS.OBJECT_PUT.OBJECT_REMOVE.OBJECT_RENAME.OBJECT_REPLACE.OBJECT_UNWRAP.OBJECT_VALUES.PAIRS.PERCENT_RANK.PI.POLY_LENGTH.POSINFIF.POSITION.POWER.RADIANS.RANDOM.RANK.RATIO_TO_REPORT.REGEXP_CONTAINS.REGEXP_LIKE.REGEXP_MATCHES.REGEXP_POSITION.REGEXP_REPLACE.REGEXP_SPLIT.REGEX_CONTAINS.REGEX_LIKE.REGEX_MATCHES.REGEX_POSITION.REGEX_REPLACE.REGEX_SPLIT.REPEAT.REPLACE.REVERSE.ROUND.ROW_NUMBER.RTRIM.SEARCH.SEARCH_META.SEARCH_SCORE.SIGN.SIN.SPLIT.SQRT.STDDEV.STDDEV_POP.STDDEV_SAMP.STR_TO_DURATION.STR_TO_MILLIS.STR_TO_TZ.STR_TO_UTC.STR_TO_ZONE_NAME.SUBSTR.SUFFIXES.SUM.TAN.TITLE.TOARRAY.TOATOM.TOBOOLEAN.TOKENS.TOKENS.TONUMBER.TOOBJECT.TOSTRING.TRIM.TRUNC.UPPER.UUID.VARIANCE.VARIANCE_POP.VARIANCE_SAMP.VAR_POP.VAR_SAMP.WEEKDAY_MILLIS.WEEKDAY_STR.CAST".split("."), Lr = /* @__PURE__ */ "ADVISE.ALL.ALTER.ANALYZE.AND.ANY.ARRAY.AS.ASC.AT.BEGIN.BETWEEN.BINARY.BOOLEAN.BREAK.BUCKET.BUILD.BY.CALL.CASE.CAST.CLUSTER.COLLATE.COLLECTION.COMMIT.COMMITTED.CONNECT.CONTINUE.CORRELATED.COVER.CREATE.CURRENT.DATABASE.DATASET.DATASTORE.DECLARE.DECREMENT.DELETE.DERIVED.DESC.DESCRIBE.DISTINCT.DO.DROP.EACH.ELEMENT.ELSE.END.EVERY.EXCEPT.EXCLUDE.EXECUTE.EXISTS.EXPLAIN.FALSE.FETCH.FILTER.FIRST.FLATTEN.FLUSH.FOLLOWING.FOR.FORCE.FROM.FTS.FUNCTION.GOLANG.GRANT.GROUP.GROUPS.GSI.HASH.HAVING.IF.IGNORE.ILIKE.IN.INCLUDE.INCREMENT.INDEX.INFER.INLINE.INNER.INSERT.INTERSECT.INTO.IS.ISOLATION.JAVASCRIPT.JOIN.KEY.KEYS.KEYSPACE.KNOWN.LANGUAGE.LAST.LEFT.LET.LETTING.LEVEL.LIKE.LIMIT.LSM.MAP.MAPPING.MATCHED.MATERIALIZED.MERGE.MINUS.MISSING.NAMESPACE.NEST.NL.NO.NOT.NTH_VALUE.NULL.NULLS.NUMBER.OBJECT.OFFSET.ON.OPTION.OPTIONS.OR.ORDER.OTHERS.OUTER.OVER.PARSE.PARTITION.PASSWORD.PATH.POOL.PRECEDING.PREPARE.PRIMARY.PRIVATE.PRIVILEGE.PROBE.PROCEDURE.PUBLIC.RANGE.RAW.REALM.REDUCE.RENAME.RESPECT.RETURN.RETURNING.REVOKE.RIGHT.ROLE.ROLLBACK.ROW.ROWS.SATISFIES.SAVEPOINT.SCHEMA.SCOPE.SELECT.SELF.SEMI.SET.SHOW.SOME.START.STATISTICS.STRING.SYSTEM.THEN.TIES.TO.TRAN.TRANSACTION.TRIGGER.TRUE.TRUNCATE.UNBOUNDED.UNDER.UNION.UNIQUE.UNKNOWN.UNNEST.UNSET.UPDATE.UPSERT.USE.USER.USING.VALIDATE.VALUE.VALUED.VALUES.VIA.VIEW.WHEN.WHERE.WHILE.WINDOW.WITH.WITHIN.WORK.XOR".split("."), Rr = [], zr = w(["SELECT [ALL | DISTINCT]"]), Br = w([
	"WITH",
	"FROM",
	"WHERE",
	"GROUP BY",
	"HAVING",
	"WINDOW",
	"PARTITION BY",
	"ORDER BY",
	"LIMIT",
	"OFFSET",
	"INSERT INTO",
	"VALUES",
	"SET",
	"MERGE INTO",
	"WHEN [NOT] MATCHED THEN",
	"UPDATE SET",
	"INSERT",
	"NEST",
	"UNNEST",
	"RETURNING"
]), Vr = w(/* @__PURE__ */ "UPDATE.DELETE FROM.SET SCHEMA.ADVISE.ALTER INDEX.BEGIN TRANSACTION.BUILD INDEX.COMMIT TRANSACTION.CREATE COLLECTION.CREATE FUNCTION.CREATE INDEX.CREATE PRIMARY INDEX.CREATE SCOPE.DROP COLLECTION.DROP FUNCTION.DROP INDEX.DROP PRIMARY INDEX.DROP SCOPE.EXECUTE.EXECUTE FUNCTION.EXPLAIN.GRANT.INFER.PREPARE.REVOKE.ROLLBACK TRANSACTION.SAVEPOINT.SET TRANSACTION.UPDATE STATISTICS.UPSERT.LET.SET CURRENT SCHEMA.SHOW.USE [PRIMARY] KEYS".split(".")), Hr = w([
	"UNION [ALL]",
	"EXCEPT [ALL]",
	"INTERSECT [ALL]"
]), Ur = w([
	"JOIN",
	"{LEFT | RIGHT} [OUTER] JOIN",
	"INNER JOIN"
]), Wr = w(["{ROWS | RANGE | GROUPS} BETWEEN"]), Gr = w([]), Kr = {
	name: "n1ql",
	tokenizerOptions: {
		reservedSelect: zr,
		reservedClauses: [...Br, ...Vr],
		reservedSetOperations: Hr,
		reservedJoins: Ur,
		reservedKeywordPhrases: Wr,
		reservedDataTypePhrases: Gr,
		supportsXor: !0,
		reservedKeywords: Lr,
		reservedDataTypes: Rr,
		reservedFunctionNames: Ir,
		stringTypes: ["\"\"-bs", "''-bs"],
		identTypes: ["``"],
		extraParens: ["[]", "{}"],
		paramTypes: {
			positional: !0,
			numbered: ["$"],
			named: ["$"]
		},
		lineCommentTypes: ["#", "--"],
		operators: [
			"%",
			"==",
			":",
			"||"
		]
	},
	formatOptions: { onelineClauses: Vr }
}, qr = /* @__PURE__ */ "ADD.AGENT.AGGREGATE.ALL.ALTER.AND.ANY.ARROW.AS.ASC.AT.ATTRIBUTE.AUTHID.AVG.BEGIN.BETWEEN.BLOCK.BODY.BOTH.BOUND.BULK.BY.BYTE.CALL.CALLING.CASCADE.CASE.CHARSET.CHARSETFORM.CHARSETID.CHECK.CLOSE.CLUSTER.CLUSTERS.COLAUTH.COLLECT.COLUMNS.COMMENT.COMMIT.COMMITTED.COMPILED.COMPRESS.CONNECT.CONSTANT.CONSTRUCTOR.CONTEXT.CONVERT.COUNT.CRASH.CREATE.CURRENT.CURSOR.CUSTOMDATUM.DANGLING.DATA.DAY.DECLARE.DEFAULT.DEFINE.DELETE.DESC.DETERMINISTIC.DISTINCT.DROP.DURATION.ELEMENT.ELSE.ELSIF.EMPTY.END.ESCAPE.EXCEPT.EXCEPTION.EXCEPTIONS.EXCLUSIVE.EXECUTE.EXISTS.EXIT.EXTERNAL.FETCH.FINAL.FIXED.FOR.FORALL.FORCE.FORM.FROM.FUNCTION.GENERAL.GOTO.GRANT.GROUP.HASH.HAVING.HEAP.HIDDEN.HOUR.IDENTIFIED.IF.IMMEDIATE.IN.INCLUDING.INDEX.INDEXES.INDICATOR.INDICES.INFINITE.INSERT.INSTANTIABLE.INTERFACE.INTERSECT.INTERVAL.INTO.INVALIDATE.IS.ISOLATION.JAVA.LANGUAGE.LARGE.LEADING.LENGTH.LEVEL.LIBRARY.LIKE.LIKE2.LIKE4.LIKEC.LIMIT.LIMITED.LOCAL.LOCK.LOOP.MAP.MAX.MAXLEN.MEMBER.MERGE.MIN.MINUS.MINUTE.MOD.MODE.MODIFY.MONTH.MULTISET.NAME.NAN.NATIONAL.NATIVE.NEW.NOCOMPRESS.NOCOPY.NOT.NOWAIT.NULL.OBJECT.OCICOLL.OCIDATE.OCIDATETIME.OCIDURATION.OCIINTERVAL.OCILOBLOCATOR.OCINUMBER.OCIRAW.OCIREF.OCIREFCURSOR.OCIROWID.OCISTRING.OCITYPE.OF.ON.ONLY.OPAQUE.OPEN.OPERATOR.OPTION.OR.ORACLE.ORADATA.ORDER.OVERLAPS.ORGANIZATION.ORLANY.ORLVARY.OTHERS.OUT.OVERRIDING.PACKAGE.PARALLEL_ENABLE.PARAMETER.PARAMETERS.PARTITION.PASCAL.PIPE.PIPELINED.PRAGMA.PRIOR.PRIVATE.PROCEDURE.PUBLIC.RAISE.RANGE.READ.RECORD.REF.REFERENCE.REM.REMAINDER.RENAME.RESOURCE.RESULT.RETURN.RETURNING.REVERSE.REVOKE.ROLLBACK.ROW.SAMPLE.SAVE.SAVEPOINT.SB1.SB2.SB4.SECOND.SEGMENT.SELECT.SELF.SEPARATE.SEQUENCE.SERIALIZABLE.SET.SHARE.SHORT.SIZE.SIZE_T.SOME.SPARSE.SQL.SQLCODE.SQLDATA.SQLNAME.SQLSTATE.STANDARD.START.STATIC.STDDEV.STORED.STRING.STRUCT.STYLE.SUBMULTISET.SUBPARTITION.SUBSTITUTABLE.SUBTYPE.SUM.SYNONYM.TABAUTH.TABLE.TDO.THE.THEN.TIME.TIMEZONE_ABBR.TIMEZONE_HOUR.TIMEZONE_MINUTE.TIMEZONE_REGION.TO.TRAILING.TRANSAC.TRANSACTIONAL.TRUSTED.TYPE.UB1.UB2.UB4.UNDER.UNION.UNIQUE.UNSIGNED.UNTRUSTED.UPDATE.USE.USING.VALIST.VALUE.VALUES.VARIABLE.VARIANCE.VARRAY.VIEW.VIEWS.VOID.WHEN.WHERE.WHILE.WITH.WORK.WRAPPED.WRITE.YEAR.ZONE".split("."), Jr = /* @__PURE__ */ "ARRAY.BFILE_BASE.BINARY.BLOB_BASE.CHAR VARYING.CHAR_BASE.CHAR.CHARACTER VARYING.CHARACTER.CLOB_BASE.DATE_BASE.DATE.DECIMAL.DOUBLE.FLOAT.INT.INTERVAL DAY.INTERVAL YEAR.LONG.NATIONAL CHAR VARYING.NATIONAL CHAR.NATIONAL CHARACTER VARYING.NATIONAL CHARACTER.NCHAR VARYING.NCHAR.NCHAR.NUMBER_BASE.NUMBER.NUMBERIC.NVARCHAR.PRECISION.RAW.TIMESTAMP.UROWID.VARCHAR.VARCHAR2".split("."), Yr = /* @__PURE__ */ "ABS.ACOS.ASIN.ATAN.ATAN2.BITAND.CEIL.COS.COSH.EXP.FLOOR.LN.LOG.MOD.NANVL.POWER.REMAINDER.ROUND.SIGN.SIN.SINH.SQRT.TAN.TANH.TRUNC.WIDTH_BUCKET.CHR.CONCAT.INITCAP.LOWER.LPAD.LTRIM.NLS_INITCAP.NLS_LOWER.NLSSORT.NLS_UPPER.REGEXP_REPLACE.REGEXP_SUBSTR.REPLACE.RPAD.RTRIM.SOUNDEX.SUBSTR.TRANSLATE.TREAT.TRIM.UPPER.NLS_CHARSET_DECL_LEN.NLS_CHARSET_ID.NLS_CHARSET_NAME.ASCII.INSTR.LENGTH.REGEXP_INSTR.ADD_MONTHS.CURRENT_DATE.CURRENT_TIMESTAMP.DBTIMEZONE.EXTRACT.FROM_TZ.LAST_DAY.LOCALTIMESTAMP.MONTHS_BETWEEN.NEW_TIME.NEXT_DAY.NUMTODSINTERVAL.NUMTOYMINTERVAL.ROUND.SESSIONTIMEZONE.SYS_EXTRACT_UTC.SYSDATE.SYSTIMESTAMP.TO_CHAR.TO_TIMESTAMP.TO_TIMESTAMP_TZ.TO_DSINTERVAL.TO_YMINTERVAL.TRUNC.TZ_OFFSET.GREATEST.LEAST.ASCIISTR.BIN_TO_NUM.CAST.CHARTOROWID.COMPOSE.CONVERT.DECOMPOSE.HEXTORAW.NUMTODSINTERVAL.NUMTOYMINTERVAL.RAWTOHEX.RAWTONHEX.ROWIDTOCHAR.ROWIDTONCHAR.SCN_TO_TIMESTAMP.TIMESTAMP_TO_SCN.TO_BINARY_DOUBLE.TO_BINARY_FLOAT.TO_CHAR.TO_CLOB.TO_DATE.TO_DSINTERVAL.TO_LOB.TO_MULTI_BYTE.TO_NCHAR.TO_NCLOB.TO_NUMBER.TO_DSINTERVAL.TO_SINGLE_BYTE.TO_TIMESTAMP.TO_TIMESTAMP_TZ.TO_YMINTERVAL.TO_YMINTERVAL.TRANSLATE.UNISTR.BFILENAME.EMPTY_BLOB,.EMPTY_CLOB.CARDINALITY.COLLECT.POWERMULTISET.POWERMULTISET_BY_CARDINALITY.SET.SYS_CONNECT_BY_PATH.CLUSTER_ID.CLUSTER_PROBABILITY.CLUSTER_SET.FEATURE_ID.FEATURE_SET.FEATURE_VALUE.PREDICTION.PREDICTION_COST.PREDICTION_DETAILS.PREDICTION_PROBABILITY.PREDICTION_SET.APPENDCHILDXML.DELETEXML.DEPTH.EXTRACT.EXISTSNODE.EXTRACTVALUE.INSERTCHILDXML.INSERTXMLBEFORE.PATH.SYS_DBURIGEN.SYS_XMLAGG.SYS_XMLGEN.UPDATEXML.XMLAGG.XMLCDATA.XMLCOLATTVAL.XMLCOMMENT.XMLCONCAT.XMLFOREST.XMLPARSE.XMLPI.XMLQUERY.XMLROOT.XMLSEQUENCE.XMLSERIALIZE.XMLTABLE.XMLTRANSFORM.DECODE.DUMP.ORA_HASH.VSIZE.COALESCE.LNNVL.NULLIF.NVL.NVL2.SYS_CONTEXT.SYS_GUID.SYS_TYPEID.UID.USER.USERENV.AVG.COLLECT.CORR.CORR_S.CORR_K.COUNT.COVAR_POP.COVAR_SAMP.CUME_DIST.DENSE_RANK.FIRST.GROUP_ID.GROUPING.GROUPING_ID.LAST.MAX.MEDIAN.MIN.PERCENTILE_CONT.PERCENTILE_DISC.PERCENT_RANK.RANK.REGR_SLOPE.REGR_INTERCEPT.REGR_COUNT.REGR_R2.REGR_AVGX.REGR_AVGY.REGR_SXX.REGR_SYY.REGR_SXY.STATS_BINOMIAL_TEST.STATS_CROSSTAB.STATS_F_TEST.STATS_KS_TEST.STATS_MODE.STATS_MW_TEST.STATS_ONE_WAY_ANOVA.STATS_T_TEST_ONE.STATS_T_TEST_PAIRED.STATS_T_TEST_INDEP.STATS_T_TEST_INDEPU.STATS_WSR_TEST.STDDEV.STDDEV_POP.STDDEV_SAMP.SUM.VAR_POP.VAR_SAMP.VARIANCE.FIRST_VALUE.LAG.LAST_VALUE.LEAD.NTILE.RATIO_TO_REPORT.ROW_NUMBER.DEREF.MAKE_REF.REF.REFTOHEX.VALUE.CV.ITERATION_NUMBER.PRESENTNNV.PRESENTV.PREVIOUS".split("."), Xr = w(["SELECT [ALL | DISTINCT | UNIQUE]"]), Zr = w([
	"WITH",
	"FROM",
	"WHERE",
	"GROUP BY",
	"HAVING",
	"PARTITION BY",
	"ORDER [SIBLINGS] BY",
	"OFFSET",
	"FETCH {FIRST | NEXT}",
	"FOR UPDATE [OF]",
	"INSERT [INTO | ALL INTO]",
	"VALUES",
	"SET",
	"MERGE [INTO]",
	"WHEN [NOT] MATCHED [THEN]",
	"UPDATE SET",
	"RETURNING"
]), Qr = w(["CREATE [GLOBAL TEMPORARY | PRIVATE TEMPORARY | SHARDED | DUPLICATED | IMMUTABLE BLOCKCHAIN | BLOCKCHAIN | IMMUTABLE] TABLE"]), $r = w([
	"CREATE [OR REPLACE] [NO FORCE | FORCE] [EDITIONING | EDITIONABLE | EDITIONABLE EDITIONING | NONEDITIONABLE] VIEW",
	"CREATE MATERIALIZED VIEW",
	"UPDATE [ONLY]",
	"DELETE FROM [ONLY]",
	"DROP TABLE",
	"ALTER TABLE",
	"ADD",
	"DROP {COLUMN | UNUSED COLUMNS | COLUMNS CONTINUE}",
	"MODIFY",
	"RENAME TO",
	"RENAME COLUMN",
	"TRUNCATE TABLE",
	"SET SCHEMA",
	"BEGIN",
	"CONNECT BY",
	"DECLARE",
	"EXCEPT",
	"EXCEPTION",
	"LOOP",
	"START WITH"
]), ei = w([
	"UNION [ALL]",
	"MINUS",
	"INTERSECT"
]), ti = w([
	"JOIN",
	"{LEFT | RIGHT | FULL} [OUTER] JOIN",
	"{INNER | CROSS} JOIN",
	"NATURAL [INNER] JOIN",
	"NATURAL {LEFT | RIGHT | FULL} [OUTER] JOIN",
	"{CROSS | OUTER} APPLY"
]), ni = w([
	"ON {UPDATE | DELETE} [SET NULL]",
	"ON COMMIT",
	"{ROWS | RANGE} BETWEEN"
]), ri = w([]), ii = {
	name: "plsql",
	tokenizerOptions: {
		reservedSelect: Xr,
		reservedClauses: [
			...Zr,
			...Qr,
			...$r
		],
		reservedSetOperations: ei,
		reservedJoins: ti,
		reservedKeywordPhrases: ni,
		reservedDataTypePhrases: ri,
		supportsXor: !0,
		reservedKeywords: qr,
		reservedDataTypes: Jr,
		reservedFunctionNames: Yr,
		stringTypes: [{
			quote: "''-qq",
			prefixes: ["N"]
		}, {
			quote: "q''",
			prefixes: ["N"]
		}],
		identTypes: ["\"\"-qq"],
		identChars: { rest: "$#" },
		variableTypes: [{ regex: "&{1,2}[A-Za-z][A-Za-z0-9_$#]*" }],
		paramTypes: {
			numbered: [":"],
			named: [":"]
		},
		operators: [
			"**",
			":=",
			"%",
			"~=",
			"^=",
			">>",
			"<<",
			"=>",
			"@",
			"||"
		],
		postProcess: ai
	},
	formatOptions: {
		alwaysDenseOperators: ["@"],
		onelineClauses: [...Qr, ...$r],
		tabularOnelineClauses: $r
	}
};
function ai(e) {
	let t = D;
	return e.map((e) => k.SET(e) && k.BY(t) ? Object.assign(Object.assign({}, e), { type: E.RESERVED_KEYWORD }) : (Dt(e.type) && (t = e), e));
}
//#endregion
//#region node_modules/sql-formatter/dist/esm/languages/postgresql/postgresql.functions.js
var oi = /* @__PURE__ */ "ABS.ACOS.ACOSD.ACOSH.ASIN.ASIND.ASINH.ATAN.ATAN2.ATAN2D.ATAND.ATANH.CBRT.CEIL.CEILING.COS.COSD.COSH.COT.COTD.DEGREES.DIV.EXP.FACTORIAL.FLOOR.GCD.LCM.LN.LOG.LOG10.MIN_SCALE.MOD.PI.POWER.RADIANS.RANDOM.ROUND.SCALE.SETSEED.SIGN.SIN.SIND.SINH.SQRT.TAN.TAND.TANH.TRIM_SCALE.TRUNC.WIDTH_BUCKET.ABS.ASCII.BIT_LENGTH.BTRIM.CHARACTER_LENGTH.CHAR_LENGTH.CHR.CONCAT.CONCAT_WS.FORMAT.INITCAP.LEFT.LENGTH.LOWER.LPAD.LTRIM.MD5.NORMALIZE.OCTET_LENGTH.OVERLAY.PARSE_IDENT.PG_CLIENT_ENCODING.POSITION.QUOTE_IDENT.QUOTE_LITERAL.QUOTE_NULLABLE.REGEXP_MATCH.REGEXP_MATCHES.REGEXP_REPLACE.REGEXP_SPLIT_TO_ARRAY.REGEXP_SPLIT_TO_TABLE.REPEAT.REPLACE.REVERSE.RIGHT.RPAD.RTRIM.SPLIT_PART.SPRINTF.STARTS_WITH.STRING_AGG.STRING_TO_ARRAY.STRING_TO_TABLE.STRPOS.SUBSTR.SUBSTRING.TO_ASCII.TO_HEX.TRANSLATE.TRIM.UNISTR.UPPER.BIT_COUNT.BIT_LENGTH.BTRIM.CONVERT.CONVERT_FROM.CONVERT_TO.DECODE.ENCODE.GET_BIT.GET_BYTE.LENGTH.LTRIM.MD5.OCTET_LENGTH.OVERLAY.POSITION.RTRIM.SET_BIT.SET_BYTE.SHA224.SHA256.SHA384.SHA512.STRING_AGG.SUBSTR.SUBSTRING.TRIM.BIT_COUNT.BIT_LENGTH.GET_BIT.LENGTH.OCTET_LENGTH.OVERLAY.POSITION.SET_BIT.SUBSTRING.REGEXP_MATCH.REGEXP_MATCHES.REGEXP_REPLACE.REGEXP_SPLIT_TO_ARRAY.REGEXP_SPLIT_TO_TABLE.TO_CHAR.TO_DATE.TO_NUMBER.TO_TIMESTAMP.CLOCK_TIMESTAMP.CURRENT_DATE.CURRENT_TIME.CURRENT_TIMESTAMP.DATE_BIN.DATE_PART.DATE_TRUNC.EXTRACT.ISFINITE.JUSTIFY_DAYS.JUSTIFY_HOURS.JUSTIFY_INTERVAL.LOCALTIME.LOCALTIMESTAMP.MAKE_DATE.MAKE_INTERVAL.MAKE_TIME.MAKE_TIMESTAMP.MAKE_TIMESTAMPTZ.NOW.PG_SLEEP.PG_SLEEP_FOR.PG_SLEEP_UNTIL.STATEMENT_TIMESTAMP.TIMEOFDAY.TO_TIMESTAMP.TRANSACTION_TIMESTAMP.ENUM_FIRST.ENUM_LAST.ENUM_RANGE.AREA.BOUND_BOX.BOX.CENTER.CIRCLE.DIAGONAL.DIAMETER.HEIGHT.ISCLOSED.ISOPEN.LENGTH.LINE.LSEG.NPOINTS.PATH.PCLOSE.POINT.POLYGON.POPEN.RADIUS.SLOPE.WIDTH.ABBREV.BROADCAST.FAMILY.HOST.HOSTMASK.INET_MERGE.INET_SAME_FAMILY.MACADDR8_SET7BIT.MASKLEN.NETMASK.NETWORK.SET_MASKLEN.TRUNC.ARRAY_TO_TSVECTOR.GET_CURRENT_TS_CONFIG.JSONB_TO_TSVECTOR.JSON_TO_TSVECTOR.LENGTH.NUMNODE.PHRASETO_TSQUERY.PLAINTO_TSQUERY.QUERYTREE.SETWEIGHT.STRIP.TO_TSQUERY.TO_TSVECTOR.TSQUERY_PHRASE.TSVECTOR_TO_ARRAY.TS_DEBUG.TS_DELETE.TS_FILTER.TS_HEADLINE.TS_LEXIZE.TS_PARSE.TS_RANK.TS_RANK_CD.TS_REWRITE.TS_STAT.TS_TOKEN_TYPE.WEBSEARCH_TO_TSQUERY.GEN_RANDOM_UUID.UUIDV4.UUIDV7.UUID_EXTRACT_TIMESTAMP.UUID_EXTRACT_VERSION.CURSOR_TO_XML.CURSOR_TO_XMLSCHEMA.DATABASE_TO_XML.DATABASE_TO_XMLSCHEMA.DATABASE_TO_XML_AND_XMLSCHEMA.NEXTVAL.QUERY_TO_XML.QUERY_TO_XMLSCHEMA.QUERY_TO_XML_AND_XMLSCHEMA.SCHEMA_TO_XML.SCHEMA_TO_XMLSCHEMA.SCHEMA_TO_XML_AND_XMLSCHEMA.STRING.TABLE_TO_XML.TABLE_TO_XMLSCHEMA.TABLE_TO_XML_AND_XMLSCHEMA.XMLAGG.XMLCOMMENT.XMLCONCAT.XMLELEMENT.XMLEXISTS.XMLFOREST.XMLPARSE.XMLPI.XMLROOT.XMLSERIALIZE.XMLTABLE.XML_IS_WELL_FORMED.XML_IS_WELL_FORMED_CONTENT.XML_IS_WELL_FORMED_DOCUMENT.XPATH.XPATH_EXISTS.ARRAY_TO_JSON.JSONB_AGG.JSONB_ARRAY_ELEMENTS.JSONB_ARRAY_ELEMENTS_TEXT.JSONB_ARRAY_LENGTH.JSONB_BUILD_ARRAY.JSONB_BUILD_OBJECT.JSONB_EACH.JSONB_EACH_TEXT.JSONB_EXTRACT_PATH.JSONB_EXTRACT_PATH_TEXT.JSONB_INSERT.JSONB_OBJECT.JSONB_OBJECT_AGG.JSONB_OBJECT_KEYS.JSONB_PATH_EXISTS.JSONB_PATH_EXISTS_TZ.JSONB_PATH_MATCH.JSONB_PATH_MATCH_TZ.JSONB_PATH_QUERY.JSONB_PATH_QUERY_ARRAY.JSONB_PATH_QUERY_ARRAY_TZ.JSONB_PATH_QUERY_FIRST.JSONB_PATH_QUERY_FIRST_TZ.JSONB_PATH_QUERY_TZ.JSONB_POPULATE_RECORD.JSONB_POPULATE_RECORDSET.JSONB_PRETTY.JSONB_SET.JSONB_SET_LAX.JSONB_STRIP_NULLS.JSONB_TO_RECORD.JSONB_TO_RECORDSET.JSONB_TYPEOF.JSON_AGG.JSON_ARRAY_ELEMENTS.JSON_ARRAY_ELEMENTS_TEXT.JSON_ARRAY_LENGTH.JSON_BUILD_ARRAY.JSON_BUILD_OBJECT.JSON_EACH.JSON_EACH_TEXT.JSON_EXTRACT_PATH.JSON_EXTRACT_PATH_TEXT.JSON_OBJECT.JSON_OBJECT_AGG.JSON_OBJECT_KEYS.JSON_POPULATE_RECORD.JSON_POPULATE_RECORDSET.JSON_STRIP_NULLS.JSON_TO_RECORD.JSON_TO_RECORDSET.JSON_TYPEOF.ROW_TO_JSON.TO_JSON.TO_JSONB.TO_TIMESTAMP.CURRVAL.LASTVAL.NEXTVAL.SETVAL.COALESCE.GREATEST.LEAST.NULLIF.ARRAY_AGG.ARRAY_APPEND.ARRAY_CAT.ARRAY_DIMS.ARRAY_FILL.ARRAY_LENGTH.ARRAY_LOWER.ARRAY_NDIMS.ARRAY_POSITION.ARRAY_POSITIONS.ARRAY_PREPEND.ARRAY_REMOVE.ARRAY_REPLACE.ARRAY_TO_STRING.ARRAY_UPPER.CARDINALITY.STRING_TO_ARRAY.TRIM_ARRAY.UNNEST.ISEMPTY.LOWER.LOWER_INC.LOWER_INF.MULTIRANGE.RANGE_MERGE.UPPER.UPPER_INC.UPPER_INF.ARRAY_AGG.AVG.BIT_AND.BIT_OR.BIT_XOR.BOOL_AND.BOOL_OR.COALESCE.CORR.COUNT.COVAR_POP.COVAR_SAMP.CUME_DIST.DENSE_RANK.EVERY.GROUPING.JSONB_AGG.JSONB_OBJECT_AGG.JSON_AGG.JSON_OBJECT_AGG.MAX.MIN.MODE.PERCENTILE_CONT.PERCENTILE_DISC.PERCENT_RANK.RANGE_AGG.RANGE_INTERSECT_AGG.RANK.REGR_AVGX.REGR_AVGY.REGR_COUNT.REGR_INTERCEPT.REGR_R2.REGR_SLOPE.REGR_SXX.REGR_SXY.REGR_SYY.STDDEV.STDDEV_POP.STDDEV_SAMP.STRING_AGG.SUM.TO_JSON.TO_JSONB.VARIANCE.VAR_POP.VAR_SAMP.XMLAGG.CUME_DIST.DENSE_RANK.FIRST_VALUE.LAG.LAST_VALUE.LEAD.NTH_VALUE.NTILE.PERCENT_RANK.RANK.ROW_NUMBER.GENERATE_SERIES.GENERATE_SUBSCRIPTS.ACLDEFAULT.ACLEXPLODE.COL_DESCRIPTION.CURRENT_CATALOG.CURRENT_DATABASE.CURRENT_QUERY.CURRENT_ROLE.CURRENT_SCHEMA.CURRENT_SCHEMAS.CURRENT_USER.FORMAT_TYPE.HAS_ANY_COLUMN_PRIVILEGE.HAS_COLUMN_PRIVILEGE.HAS_DATABASE_PRIVILEGE.HAS_FOREIGN_DATA_WRAPPER_PRIVILEGE.HAS_FUNCTION_PRIVILEGE.HAS_LANGUAGE_PRIVILEGE.HAS_SCHEMA_PRIVILEGE.HAS_SEQUENCE_PRIVILEGE.HAS_SERVER_PRIVILEGE.HAS_TABLESPACE_PRIVILEGE.HAS_TABLE_PRIVILEGE.HAS_TYPE_PRIVILEGE.INET_CLIENT_ADDR.INET_CLIENT_PORT.INET_SERVER_ADDR.INET_SERVER_PORT.MAKEACLITEM.OBJ_DESCRIPTION.PG_BACKEND_PID.PG_BLOCKING_PIDS.PG_COLLATION_IS_VISIBLE.PG_CONF_LOAD_TIME.PG_CONTROL_CHECKPOINT.PG_CONTROL_INIT.PG_CONTROL_SYSTEM.PG_CONVERSION_IS_VISIBLE.PG_CURRENT_LOGFILE.PG_CURRENT_SNAPSHOT.PG_CURRENT_XACT_ID.PG_CURRENT_XACT_ID_IF_ASSIGNED.PG_DESCRIBE_OBJECT.PG_FUNCTION_IS_VISIBLE.PG_GET_CATALOG_FOREIGN_KEYS.PG_GET_CONSTRAINTDEF.PG_GET_EXPR.PG_GET_FUNCTIONDEF.PG_GET_FUNCTION_ARGUMENTS.PG_GET_FUNCTION_IDENTITY_ARGUMENTS.PG_GET_FUNCTION_RESULT.PG_GET_INDEXDEF.PG_GET_KEYWORDS.PG_GET_OBJECT_ADDRESS.PG_GET_OWNED_SEQUENCE.PG_GET_RULEDEF.PG_GET_SERIAL_SEQUENCE.PG_GET_STATISTICSOBJDEF.PG_GET_TRIGGERDEF.PG_GET_USERBYID.PG_GET_VIEWDEF.PG_HAS_ROLE.PG_IDENTIFY_OBJECT.PG_IDENTIFY_OBJECT_AS_ADDRESS.PG_INDEXAM_HAS_PROPERTY.PG_INDEX_COLUMN_HAS_PROPERTY.PG_INDEX_HAS_PROPERTY.PG_IS_OTHER_TEMP_SCHEMA.PG_JIT_AVAILABLE.PG_LAST_COMMITTED_XACT.PG_LISTENING_CHANNELS.PG_MY_TEMP_SCHEMA.PG_NOTIFICATION_QUEUE_USAGE.PG_OPCLASS_IS_VISIBLE.PG_OPERATOR_IS_VISIBLE.PG_OPFAMILY_IS_VISIBLE.PG_OPTIONS_TO_TABLE.PG_POSTMASTER_START_TIME.PG_SAFE_SNAPSHOT_BLOCKING_PIDS.PG_SNAPSHOT_XIP.PG_SNAPSHOT_XMAX.PG_SNAPSHOT_XMIN.PG_STATISTICS_OBJ_IS_VISIBLE.PG_TABLESPACE_DATABASES.PG_TABLESPACE_LOCATION.PG_TABLE_IS_VISIBLE.PG_TRIGGER_DEPTH.PG_TS_CONFIG_IS_VISIBLE.PG_TS_DICT_IS_VISIBLE.PG_TS_PARSER_IS_VISIBLE.PG_TS_TEMPLATE_IS_VISIBLE.PG_TYPEOF.PG_TYPE_IS_VISIBLE.PG_VISIBLE_IN_SNAPSHOT.PG_XACT_COMMIT_TIMESTAMP.PG_XACT_COMMIT_TIMESTAMP_ORIGIN.PG_XACT_STATUS.PQSERVERVERSION.ROW_SECURITY_ACTIVE.SESSION_USER.SHOBJ_DESCRIPTION.TO_REGCLASS.TO_REGCOLLATION.TO_REGNAMESPACE.TO_REGOPER.TO_REGOPERATOR.TO_REGPROC.TO_REGPROCEDURE.TO_REGROLE.TO_REGTYPE.TXID_CURRENT.TXID_CURRENT_IF_ASSIGNED.TXID_CURRENT_SNAPSHOT.TXID_SNAPSHOT_XIP.TXID_SNAPSHOT_XMAX.TXID_SNAPSHOT_XMIN.TXID_STATUS.TXID_VISIBLE_IN_SNAPSHOT.USER.VERSION.BRIN_DESUMMARIZE_RANGE.BRIN_SUMMARIZE_NEW_VALUES.BRIN_SUMMARIZE_RANGE.CONVERT_FROM.CURRENT_SETTING.GIN_CLEAN_PENDING_LIST.PG_ADVISORY_LOCK.PG_ADVISORY_LOCK_SHARED.PG_ADVISORY_UNLOCK.PG_ADVISORY_UNLOCK_ALL.PG_ADVISORY_UNLOCK_SHARED.PG_ADVISORY_XACT_LOCK.PG_ADVISORY_XACT_LOCK_SHARED.PG_BACKUP_START_TIME.PG_CANCEL_BACKEND.PG_COLLATION_ACTUAL_VERSION.PG_COLUMN_COMPRESSION.PG_COLUMN_SIZE.PG_COPY_LOGICAL_REPLICATION_SLOT.PG_COPY_PHYSICAL_REPLICATION_SLOT.PG_CREATE_LOGICAL_REPLICATION_SLOT.PG_CREATE_PHYSICAL_REPLICATION_SLOT.PG_CREATE_RESTORE_POINT.PG_CURRENT_WAL_FLUSH_LSN.PG_CURRENT_WAL_INSERT_LSN.PG_CURRENT_WAL_LSN.PG_DATABASE_SIZE.PG_DROP_REPLICATION_SLOT.PG_EXPORT_SNAPSHOT.PG_FILENODE_RELATION.PG_GET_WAL_REPLAY_PAUSE_STATE.PG_IMPORT_SYSTEM_COLLATIONS.PG_INDEXES_SIZE.PG_IS_IN_BACKUP.PG_IS_IN_RECOVERY.PG_IS_WAL_REPLAY_PAUSED.PG_LAST_WAL_RECEIVE_LSN.PG_LAST_WAL_REPLAY_LSN.PG_LAST_XACT_REPLAY_TIMESTAMP.PG_LOGICAL_EMIT_MESSAGE.PG_LOGICAL_SLOT_GET_BINARY_CHANGES.PG_LOGICAL_SLOT_GET_CHANGES.PG_LOGICAL_SLOT_PEEK_BINARY_CHANGES.PG_LOGICAL_SLOT_PEEK_CHANGES.PG_LOG_BACKEND_MEMORY_CONTEXTS.PG_LS_ARCHIVE_STATUSDIR.PG_LS_DIR.PG_LS_LOGDIR.PG_LS_TMPDIR.PG_LS_WALDIR.PG_PARTITION_ANCESTORS.PG_PARTITION_ROOT.PG_PARTITION_TREE.PG_PROMOTE.PG_READ_BINARY_FILE.PG_READ_FILE.PG_RELATION_FILENODE.PG_RELATION_FILEPATH.PG_RELATION_SIZE.PG_RELOAD_CONF.PG_REPLICATION_ORIGIN_ADVANCE.PG_REPLICATION_ORIGIN_CREATE.PG_REPLICATION_ORIGIN_DROP.PG_REPLICATION_ORIGIN_OID.PG_REPLICATION_ORIGIN_PROGRESS.PG_REPLICATION_ORIGIN_SESSION_IS_SETUP.PG_REPLICATION_ORIGIN_SESSION_PROGRESS.PG_REPLICATION_ORIGIN_SESSION_RESET.PG_REPLICATION_ORIGIN_SESSION_SETUP.PG_REPLICATION_ORIGIN_XACT_RESET.PG_REPLICATION_ORIGIN_XACT_SETUP.PG_REPLICATION_SLOT_ADVANCE.PG_ROTATE_LOGFILE.PG_SIZE_BYTES.PG_SIZE_PRETTY.PG_START_BACKUP.PG_STAT_FILE.PG_STOP_BACKUP.PG_SWITCH_WAL.PG_TABLESPACE_SIZE.PG_TABLE_SIZE.PG_TERMINATE_BACKEND.PG_TOTAL_RELATION_SIZE.PG_TRY_ADVISORY_LOCK.PG_TRY_ADVISORY_LOCK_SHARED.PG_TRY_ADVISORY_XACT_LOCK.PG_TRY_ADVISORY_XACT_LOCK_SHARED.PG_WALFILE_NAME.PG_WALFILE_NAME_OFFSET.PG_WAL_LSN_DIFF.PG_WAL_REPLAY_PAUSE.PG_WAL_REPLAY_RESUME.SET_CONFIG.SUPPRESS_REDUNDANT_UPDATES_TRIGGER.TSVECTOR_UPDATE_TRIGGER.TSVECTOR_UPDATE_TRIGGER_COLUMN.PG_EVENT_TRIGGER_DDL_COMMANDS.PG_EVENT_TRIGGER_DROPPED_OBJECTS.PG_EVENT_TRIGGER_TABLE_REWRITE_OID.PG_EVENT_TRIGGER_TABLE_REWRITE_REASON.PG_GET_OBJECT_ADDRESS.PG_MCV_LIST_ITEMS.CAST".split("."), si = /* @__PURE__ */ "ALL.ANALYSE.ANALYZE.AND.ANY.AS.ASC.ASYMMETRIC.AUTHORIZATION.BETWEEN.BINARY.BOTH.CASE.CAST.CHECK.COLLATE.COLLATION.COLUMN.CONCURRENTLY.CONSTRAINT.CREATE.CROSS.CURRENT_CATALOG.CURRENT_DATE.CURRENT_ROLE.CURRENT_SCHEMA.CURRENT_TIME.CURRENT_TIMESTAMP.CURRENT_USER.DAY.DEFAULT.DEFERRABLE.DESC.DISTINCT.DO.ELSE.END.EXCEPT.EXISTS.FALSE.FETCH.FILTER.FOR.FOREIGN.FREEZE.FROM.FULL.GRANT.GROUP.HAVING.HOUR.ILIKE.IN.INITIALLY.INNER.INOUT.INTERSECT.INTO.IS.ISNULL.JOIN.LATERAL.LEADING.LEFT.LIKE.LIMIT.LOCALTIME.LOCALTIMESTAMP.MINUTE.MONTH.NATURAL.NOT.NOTNULL.NULL.NULLIF.OFFSET.ON.ONLY.OR.ORDER.OUT.OUTER.OVER.OVERLAPS.PLACING.PRIMARY.REFERENCES.RETURNING.RIGHT.ROW.SECOND.SELECT.SESSION_USER.SIMILAR.SOME.SYMMETRIC.TABLE.TABLESAMPLE.THEN.TO.TRAILING.TRUE.UNION.UNIQUE.USER.USING.VALUES.VARIADIC.VERBOSE.WHEN.WHERE.WINDOW.WITH.WITHIN.WITHOUT.YEAR".split("."), ci = /* @__PURE__ */ "ARRAY.BIGINT.BIT.BIT VARYING.BOOL.BOOLEAN.CHAR.CHARACTER.CHARACTER VARYING.DECIMAL.DEC.DOUBLE.ENUM.FLOAT.INT.INTEGER.INTERVAL.NCHAR.NUMERIC.JSON.JSONB.PRECISION.REAL.SMALLINT.TEXT.TIME.TIMESTAMP.TIMESTAMPTZ.UUID.VARCHAR.XML.ZONE".split("."), li = w(["SELECT [ALL | DISTINCT]"]), ui = w([
	"WITH [RECURSIVE]",
	"FROM",
	"WHERE",
	"GROUP BY [ALL | DISTINCT]",
	"HAVING",
	"WINDOW",
	"PARTITION BY",
	"ORDER BY",
	"LIMIT",
	"OFFSET",
	"FETCH {FIRST | NEXT}",
	"FOR {UPDATE | NO KEY UPDATE | SHARE | KEY SHARE} [OF]",
	"INSERT INTO",
	"VALUES",
	"DEFAULT VALUES",
	"SET",
	"RETURNING"
]), di = w(["CREATE [GLOBAL | LOCAL] [TEMPORARY | TEMP | UNLOGGED] TABLE [IF NOT EXISTS]"]), fi = w(/* @__PURE__ */ "CREATE [OR REPLACE] [TEMP | TEMPORARY] [RECURSIVE] VIEW.CREATE [MATERIALIZED] VIEW [IF NOT EXISTS].UPDATE [ONLY].WHERE CURRENT OF.ON CONFLICT.DELETE FROM [ONLY].DROP TABLE [IF EXISTS].ALTER TABLE [IF EXISTS] [ONLY].ALTER TABLE ALL IN TABLESPACE.RENAME [COLUMN].RENAME TO.ADD [COLUMN] [IF NOT EXISTS].DROP [COLUMN] [IF EXISTS].ALTER [COLUMN].SET DATA TYPE.{SET | DROP} DEFAULT.{SET | DROP} NOT NULL.TRUNCATE [TABLE] [ONLY].SET SCHEMA.{BEFORE | AFTER | INSTEAD OF} {INSERT | UPDATE [OF] | DELETE | TRUNCATE}.[NOT] DEFERRABLE.INITIALLY {DEFERRED | IMMEDIATE}.[NOT] DEFERRABLE INITIALLY {DEFERRED | IMMEDIATE}.ABORT.ALTER AGGREGATE.ALTER COLLATION.ALTER CONVERSION.ALTER DATABASE.ALTER DEFAULT PRIVILEGES.ALTER DOMAIN.ALTER EVENT TRIGGER.ALTER EXTENSION.ALTER FOREIGN DATA WRAPPER.ALTER FOREIGN TABLE.ALTER FUNCTION.ALTER GROUP.ALTER INDEX.ALTER LANGUAGE.ALTER LARGE OBJECT.ALTER MATERIALIZED VIEW.ALTER OPERATOR.ALTER OPERATOR CLASS.ALTER OPERATOR FAMILY.ALTER POLICY.ALTER PROCEDURE.ALTER PUBLICATION.ALTER ROLE.ALTER ROUTINE.ALTER RULE.ALTER SCHEMA.ALTER SEQUENCE.ALTER SERVER.ALTER STATISTICS.ALTER SUBSCRIPTION.ALTER SYSTEM.ALTER TABLESPACE.ALTER TEXT SEARCH CONFIGURATION.ALTER TEXT SEARCH DICTIONARY.ALTER TEXT SEARCH PARSER.ALTER TEXT SEARCH TEMPLATE.ALTER TRIGGER.ALTER TYPE.ALTER USER.ALTER USER MAPPING.ALTER VIEW.ANALYZE.BEGIN.CALL.CHECKPOINT.CLOSE.CLUSTER.COMMENT ON.COMMIT.COMMIT PREPARED.COPY.CREATE ACCESS METHOD.CREATE [OR REPLACE] AGGREGATE.CREATE CAST.CREATE COLLATION.CREATE [DEFAULT] CONVERSION.CREATE DATABASE.CREATE DOMAIN.CREATE EVENT TRIGGER.CREATE EXTENSION.CREATE FOREIGN DATA WRAPPER.CREATE FOREIGN TABLE.CREATE [OR REPLACE] FUNCTION.CREATE GROUP.CREATE [UNIQUE] INDEX.CREATE [OR REPLACE] [TRUSTED] [PROCEDURAL] LANGUAGE.CREATE OPERATOR.CREATE OPERATOR CLASS.CREATE OPERATOR FAMILY.CREATE POLICY.CREATE [OR REPLACE] PROCEDURE.CREATE PUBLICATION.CREATE ROLE.CREATE [OR REPLACE] RULE.CREATE SCHEMA [AUTHORIZATION].CREATE [TEMPORARY | TEMP | UNLOGGED] SEQUENCE.CREATE SERVER.CREATE STATISTICS.CREATE SUBSCRIPTION.CREATE TABLESPACE.CREATE TEXT SEARCH CONFIGURATION.CREATE TEXT SEARCH DICTIONARY.CREATE TEXT SEARCH PARSER.CREATE TEXT SEARCH TEMPLATE.CREATE [OR REPLACE] TRANSFORM.CREATE [OR REPLACE] [CONSTRAINT] TRIGGER.CREATE TYPE.CREATE USER.CREATE USER MAPPING.DEALLOCATE.DECLARE.DISCARD.DROP ACCESS METHOD.DROP AGGREGATE.DROP CAST.DROP COLLATION.DROP CONVERSION.DROP DATABASE.DROP DOMAIN.DROP EVENT TRIGGER.DROP EXTENSION.DROP FOREIGN DATA WRAPPER.DROP FOREIGN TABLE.DROP FUNCTION.DROP GROUP.DROP IDENTITY.DROP INDEX.DROP LANGUAGE.DROP MATERIALIZED VIEW [IF EXISTS].DROP OPERATOR.DROP OPERATOR CLASS.DROP OPERATOR FAMILY.DROP OWNED.DROP POLICY.DROP PROCEDURE.DROP PUBLICATION.DROP ROLE.DROP ROUTINE.DROP RULE.DROP SCHEMA.DROP SEQUENCE.DROP SERVER.DROP STATISTICS.DROP SUBSCRIPTION.DROP TABLESPACE.DROP TEXT SEARCH CONFIGURATION.DROP TEXT SEARCH DICTIONARY.DROP TEXT SEARCH PARSER.DROP TEXT SEARCH TEMPLATE.DROP TRANSFORM.DROP TRIGGER.DROP TYPE.DROP USER.DROP USER MAPPING.DROP VIEW.EXECUTE [FUNCTION | PROCEDURE].EXPLAIN.FETCH.GRANT.IMPORT FOREIGN SCHEMA.LISTEN.LOAD.LOCK.MOVE.NOTIFY.OVERRIDING SYSTEM VALUE.PREPARE.PREPARE TRANSACTION.REASSIGN OWNED.REFRESH MATERIALIZED VIEW.REINDEX.RELEASE SAVEPOINT.RESET [ALL|ROLE|SESSION AUTHORIZATION].REVOKE.ROLLBACK.ROLLBACK PREPARED.ROLLBACK TO SAVEPOINT.SAVEPOINT.SECURITY LABEL.SELECT INTO.SET CONSTRAINTS.SET ROLE.SET SESSION AUTHORIZATION.SET TRANSACTION.SHOW.START TRANSACTION.UNLISTEN.VACUUM".split(".")), pi = w([
	"UNION [ALL | DISTINCT]",
	"EXCEPT [ALL | DISTINCT]",
	"INTERSECT [ALL | DISTINCT]"
]), mi = w([
	"JOIN",
	"{LEFT | RIGHT | FULL} [OUTER] JOIN",
	"{INNER | CROSS} JOIN",
	"NATURAL [INNER] JOIN",
	"NATURAL {LEFT | RIGHT | FULL} [OUTER] JOIN"
]), hi = w([
	"PRIMARY KEY",
	"GENERATED {ALWAYS | BY DEFAULT} AS IDENTITY",
	"ON {UPDATE | DELETE} [NO ACTION | RESTRICT | CASCADE | SET NULL | SET DEFAULT]",
	"DO {NOTHING | UPDATE}",
	"AS MATERIALIZED",
	"FOR EACH ROW",
	"OR {INSERT | UPDATE [OF] | DELETE | TRUNCATE}",
	"{ROWS | RANGE | GROUPS} BETWEEN",
	"IS [NOT] DISTINCT FROM",
	"NULLS {FIRST | LAST}",
	"WITH ORDINALITY"
]), gi = w(["[TIMESTAMP | TIME] {WITH | WITHOUT} TIME ZONE"]), _i = {
	name: "postgresql",
	tokenizerOptions: {
		reservedSelect: li,
		reservedClauses: [
			...ui,
			...di,
			...fi
		],
		reservedSetOperations: pi,
		reservedJoins: mi,
		reservedKeywordPhrases: hi,
		reservedDataTypePhrases: gi,
		reservedKeywords: si,
		reservedDataTypes: ci,
		reservedFunctionNames: oi,
		nestedBlockComments: !0,
		extraParens: ["[]"],
		underscoresInNumbers: !0,
		stringTypes: [
			"$$",
			{
				quote: "''-qq",
				prefixes: ["U&"]
			},
			{
				quote: "''-qq-bs",
				prefixes: ["E"],
				requirePrefix: !0
			},
			{
				quote: "''-raw",
				prefixes: ["B", "X"],
				requirePrefix: !0
			}
		],
		identTypes: [{
			quote: "\"\"-qq",
			prefixes: ["U&"]
		}],
		identChars: { rest: "$" },
		paramTypes: { numbered: ["$"] },
		operators: /* @__PURE__ */ "%.^.|/.||/.@.:=.&.|.#.~.<<.>>.~>~.~<~.~>=~.~<=~.@-@.@@.##.<->.&&.&<.&>.<<|.&<|.|>>.|&>.<^.>^.?#.?-.?|.?-|.?||.@>.<@.<@>.~=.?.@?.?&.->.->>.#>.#>>.#-.=>.>>=.<<=.~~.~~*.!~~.!~~*.~.~*.!~.!~*.-|-.||.@@@.!!.^@.<%.%>.<<%.%>>.<<->.<->>.<<<->.<->>>.~>.#=.::.:.<#>.<=>.<+>.<~>.<%>.&&&.|=|".split("."),
		operatorKeyword: !0
	},
	formatOptions: {
		alwaysDenseOperators: ["::", ":"],
		onelineClauses: [...di, ...fi],
		tabularOnelineClauses: fi
	}
}, vi = /* @__PURE__ */ "ANY_VALUE.APPROXIMATE PERCENTILE_DISC.AVG.COUNT.LISTAGG.MAX.MEDIAN.MIN.PERCENTILE_CONT.STDDEV_SAMP.STDDEV_POP.SUM.VAR_SAMP.VAR_POP.array_concat.array_flatten.get_array_length.split_to_array.subarray.BIT_AND.BIT_OR.BOOL_AND.BOOL_OR.COALESCE.DECODE.GREATEST.LEAST.NVL.NVL2.NULLIF.ADD_MONTHS.AT TIME ZONE.CONVERT_TIMEZONE.CURRENT_DATE.CURRENT_TIME.CURRENT_TIMESTAMP.DATE_CMP.DATE_CMP_TIMESTAMP.DATE_CMP_TIMESTAMPTZ.DATE_PART_YEAR.DATEADD.DATEDIFF.DATE_PART.DATE_TRUNC.EXTRACT.GETDATE.INTERVAL_CMP.LAST_DAY.MONTHS_BETWEEN.NEXT_DAY.SYSDATE.TIMEOFDAY.TIMESTAMP_CMP.TIMESTAMP_CMP_DATE.TIMESTAMP_CMP_TIMESTAMPTZ.TIMESTAMPTZ_CMP.TIMESTAMPTZ_CMP_DATE.TIMESTAMPTZ_CMP_TIMESTAMP.TIMEZONE.TO_TIMESTAMP.TRUNC.AddBBox.DropBBox.GeometryType.ST_AddPoint.ST_Angle.ST_Area.ST_AsBinary.ST_AsEWKB.ST_AsEWKT.ST_AsGeoJSON.ST_AsText.ST_Azimuth.ST_Boundary.ST_Collect.ST_Contains.ST_ContainsProperly.ST_ConvexHull.ST_CoveredBy.ST_Covers.ST_Crosses.ST_Dimension.ST_Disjoint.ST_Distance.ST_DistanceSphere.ST_DWithin.ST_EndPoint.ST_Envelope.ST_Equals.ST_ExteriorRing.ST_Force2D.ST_Force3D.ST_Force3DM.ST_Force3DZ.ST_Force4D.ST_GeometryN.ST_GeometryType.ST_GeomFromEWKB.ST_GeomFromEWKT.ST_GeomFromText.ST_GeomFromWKB.ST_InteriorRingN.ST_Intersects.ST_IsPolygonCCW.ST_IsPolygonCW.ST_IsClosed.ST_IsCollection.ST_IsEmpty.ST_IsSimple.ST_IsValid.ST_Length.ST_LengthSphere.ST_Length2D.ST_LineFromMultiPoint.ST_LineInterpolatePoint.ST_M.ST_MakeEnvelope.ST_MakeLine.ST_MakePoint.ST_MakePolygon.ST_MemSize.ST_MMax.ST_MMin.ST_Multi.ST_NDims.ST_NPoints.ST_NRings.ST_NumGeometries.ST_NumInteriorRings.ST_NumPoints.ST_Perimeter.ST_Perimeter2D.ST_Point.ST_PointN.ST_Points.ST_Polygon.ST_RemovePoint.ST_Reverse.ST_SetPoint.ST_SetSRID.ST_Simplify.ST_SRID.ST_StartPoint.ST_Touches.ST_Within.ST_X.ST_XMax.ST_XMin.ST_Y.ST_YMax.ST_YMin.ST_Z.ST_ZMax.ST_ZMin.SupportsBBox.CHECKSUM.FUNC_SHA1.FNV_HASH.MD5.SHA.SHA1.SHA2.HLL.HLL_CREATE_SKETCH.HLL_CARDINALITY.HLL_COMBINE.IS_VALID_JSON.IS_VALID_JSON_ARRAY.JSON_ARRAY_LENGTH.JSON_EXTRACT_ARRAY_ELEMENT_TEXT.JSON_EXTRACT_PATH_TEXT.JSON_PARSE.JSON_SERIALIZE.ABS.ACOS.ASIN.ATAN.ATAN2.CBRT.CEILING.CEIL.COS.COT.DEGREES.DEXP.DLOG1.DLOG10.EXP.FLOOR.LN.LOG.MOD.PI.POWER.RADIANS.RANDOM.ROUND.SIN.SIGN.SQRT.TAN.TO_HEX.TRUNC.EXPLAIN_MODEL.ASCII.BPCHARCMP.BTRIM.BTTEXT_PATTERN_CMP.CHAR_LENGTH.CHARACTER_LENGTH.CHARINDEX.CHR.COLLATE.CONCAT.CRC32.DIFFERENCE.INITCAP.LEFT.RIGHT.LEN.LENGTH.LOWER.LPAD.RPAD.LTRIM.OCTETINDEX.OCTET_LENGTH.POSITION.QUOTE_IDENT.QUOTE_LITERAL.REGEXP_COUNT.REGEXP_INSTR.REGEXP_REPLACE.REGEXP_SUBSTR.REPEAT.REPLACE.REPLICATE.REVERSE.RTRIM.SOUNDEX.SPLIT_PART.STRPOS.STRTOL.SUBSTRING.TEXTLEN.TRANSLATE.TRIM.UPPER.decimal_precision.decimal_scale.is_array.is_bigint.is_boolean.is_char.is_decimal.is_float.is_integer.is_object.is_scalar.is_smallint.is_varchar.json_typeof.AVG.COUNT.CUME_DIST.DENSE_RANK.FIRST_VALUE.LAST_VALUE.LAG.LEAD.LISTAGG.MAX.MEDIAN.MIN.NTH_VALUE.NTILE.PERCENT_RANK.PERCENTILE_CONT.PERCENTILE_DISC.RANK.RATIO_TO_REPORT.ROW_NUMBER.STDDEV_SAMP.STDDEV_POP.SUM.VAR_SAMP.VAR_POP.CAST.CONVERT.TO_CHAR.TO_DATE.TO_NUMBER.TEXT_TO_INT_ALT.TEXT_TO_NUMERIC_ALT.CHANGE_QUERY_PRIORITY.CHANGE_SESSION_PRIORITY.CHANGE_USER_PRIORITY.CURRENT_SETTING.PG_CANCEL_BACKEND.PG_TERMINATE_BACKEND.REBOOT_CLUSTER.SET_CONFIG.CURRENT_AWS_ACCOUNT.CURRENT_DATABASE.CURRENT_NAMESPACE.CURRENT_SCHEMA.CURRENT_SCHEMAS.CURRENT_USER.CURRENT_USER_ID.HAS_ASSUMEROLE_PRIVILEGE.HAS_DATABASE_PRIVILEGE.HAS_SCHEMA_PRIVILEGE.HAS_TABLE_PRIVILEGE.PG_BACKEND_PID.PG_GET_COLS.PG_GET_GRANTEE_BY_IAM_ROLE.PG_GET_IAM_ROLE_BY_USER.PG_GET_LATE_BINDING_VIEW_COLS.PG_LAST_COPY_COUNT.PG_LAST_COPY_ID.PG_LAST_UNLOAD_ID.PG_LAST_QUERY_ID.PG_LAST_UNLOAD_COUNT.SESSION_USER.SLICE_NUM.USER.VERSION".split("."), yi = /* @__PURE__ */ "AES128.AES256.ALL.ALLOWOVERWRITE.ANY.AS.ASC.AUTHORIZATION.BACKUP.BETWEEN.BINARY.BOTH.CHECK.COLUMN.CONSTRAINT.CREATE.CROSS.DEFAULT.DEFERRABLE.DEFLATE.DEFRAG.DESC.DISABLE.DISTINCT.DO.ENABLE.ENCODE.ENCRYPT.ENCRYPTION.EXPLICIT.FALSE.FOR.FOREIGN.FREEZE.FROM.FULL.GLOBALDICT256.GLOBALDICT64K.GROUP.IDENTITY.IGNORE.ILIKE.IN.INITIALLY.INNER.INTO.IS.ISNULL.LANGUAGE.LEADING.LIKE.LIMIT.LOCALTIME.LOCALTIMESTAMP.LUN.LUNS.MINUS.NATURAL.NEW.NOT.NOTNULL.NULL.NULLS.OFF.OFFLINE.OFFSET.OID.OLD.ON.ONLY.OPEN.ORDER.OUTER.OVERLAPS.PARALLEL.PARTITION.PERCENT.PERMISSIONS.PLACING.PRIMARY.RECOVER.REFERENCES.REJECTLOG.RESORT.RESPECT.RESTORE.SIMILAR.SNAPSHOT.SOME.SYSTEM.TABLE.TAG.TDES.THEN.TIMESTAMP.TO.TOP.TRAILING.TRUE.UNIQUE.USING.VERBOSE.WALLET.WITHOUT.ACCEPTANYDATE.ACCEPTINVCHARS.BLANKSASNULL.DATEFORMAT.EMPTYASNULL.ENCODING.ESCAPE.EXPLICIT_IDS.FILLRECORD.IGNOREBLANKLINES.IGNOREHEADER.REMOVEQUOTES.ROUNDEC.TIMEFORMAT.TRIMBLANKS.TRUNCATECOLUMNS.COMPROWS.COMPUPDATE.MAXERROR.NOLOAD.STATUPDATE.FORMAT.CSV.DELIMITER.FIXEDWIDTH.SHAPEFILE.AVRO.JSON.PARQUET.ORC.ACCESS_KEY_ID.CREDENTIALS.ENCRYPTED.IAM_ROLE.MASTER_SYMMETRIC_KEY.SECRET_ACCESS_KEY.SESSION_TOKEN.BZIP2.GZIP.LZOP.ZSTD.MANIFEST.READRATIO.REGION.SSH.RAW.AZ64.BYTEDICT.DELTA.DELTA32K.LZO.MOSTLY8.MOSTLY16.MOSTLY32.RUNLENGTH.TEXT255.TEXT32K.CATALOG_ROLE.SECRET_ARN.EXTERNAL.AUTO.EVEN.KEY.PREDICATE.COMPRESSION".split("."), bi = [
	"ARRAY",
	"BIGINT",
	"BPCHAR",
	"CHAR",
	"CHARACTER VARYING",
	"CHARACTER",
	"DECIMAL",
	"INT",
	"INT2",
	"INT4",
	"INT8",
	"INTEGER",
	"NCHAR",
	"NUMERIC",
	"NVARCHAR",
	"SMALLINT",
	"TEXT",
	"VARBYTE",
	"VARCHAR"
], xi = w(["SELECT [ALL | DISTINCT]"]), Si = w([
	"WITH [RECURSIVE]",
	"FROM",
	"WHERE",
	"GROUP BY",
	"HAVING",
	"QUALIFY",
	"PARTITION BY",
	"ORDER BY",
	"LIMIT",
	"OFFSET",
	"INSERT INTO",
	"VALUES",
	"SET"
]), Ci = w(["CREATE [TEMPORARY | TEMP | LOCAL TEMPORARY | LOCAL TEMP] TABLE [IF NOT EXISTS]"]), wi = w(/* @__PURE__ */ "CREATE [OR REPLACE | MATERIALIZED] VIEW.UPDATE.DELETE [FROM].DROP TABLE [IF EXISTS].ALTER TABLE.ALTER TABLE APPEND.ADD [COLUMN].DROP [COLUMN].RENAME TO.RENAME COLUMN.ALTER COLUMN.TYPE.ENCODE.TRUNCATE [TABLE].ABORT.ALTER DATABASE.ALTER DATASHARE.ALTER DEFAULT PRIVILEGES.ALTER GROUP.ALTER MATERIALIZED VIEW.ALTER PROCEDURE.ALTER SCHEMA.ALTER USER.ANALYSE.ANALYZE.ANALYSE COMPRESSION.ANALYZE COMPRESSION.BEGIN.CALL.CANCEL.CLOSE.COMMIT.COPY.CREATE DATABASE.CREATE DATASHARE.CREATE EXTERNAL FUNCTION.CREATE EXTERNAL SCHEMA.CREATE EXTERNAL TABLE.CREATE FUNCTION.CREATE GROUP.CREATE LIBRARY.CREATE MODEL.CREATE PROCEDURE.CREATE SCHEMA.CREATE USER.DEALLOCATE.DECLARE.DESC DATASHARE.DROP DATABASE.DROP DATASHARE.DROP FUNCTION.DROP GROUP.DROP LIBRARY.DROP MODEL.DROP MATERIALIZED VIEW.DROP PROCEDURE.DROP SCHEMA.DROP USER.DROP VIEW.DROP.EXECUTE.EXPLAIN.FETCH.GRANT.LOCK.PREPARE.REFRESH MATERIALIZED VIEW.RESET.REVOKE.ROLLBACK.SELECT INTO.SET SESSION AUTHORIZATION.SET SESSION CHARACTERISTICS.SHOW.SHOW EXTERNAL TABLE.SHOW MODEL.SHOW DATASHARES.SHOW PROCEDURE.SHOW TABLE.SHOW VIEW.START TRANSACTION.UNLOAD.VACUUM".split(".")), Ti = w([
	"UNION [ALL]",
	"EXCEPT",
	"INTERSECT",
	"MINUS"
]), Ei = w([
	"JOIN",
	"{LEFT | RIGHT | FULL} [OUTER] JOIN",
	"{INNER | CROSS} JOIN",
	"NATURAL [INNER] JOIN",
	"NATURAL {LEFT | RIGHT | FULL} [OUTER] JOIN"
]), Di = w([
	"NULL AS",
	"DATA CATALOG",
	"HIVE METASTORE",
	"{ROWS | RANGE} BETWEEN"
]), Oi = w([]), ki = {
	name: "redshift",
	tokenizerOptions: {
		reservedSelect: xi,
		reservedClauses: [
			...Si,
			...Ci,
			...wi
		],
		reservedSetOperations: Ti,
		reservedJoins: Ei,
		reservedKeywordPhrases: Di,
		reservedDataTypePhrases: Oi,
		reservedKeywords: yi,
		reservedDataTypes: bi,
		reservedFunctionNames: vi,
		extraParens: ["[]"],
		stringTypes: ["''-qq"],
		identTypes: ["\"\"-qq"],
		identChars: { first: "#" },
		paramTypes: { numbered: ["$"] },
		operators: [
			"^",
			"%",
			"@",
			"|/",
			"||/",
			"&",
			"|",
			"~",
			"<<",
			">>",
			"||",
			"::"
		]
	},
	formatOptions: {
		alwaysDenseOperators: ["::"],
		onelineClauses: [...Ci, ...wi],
		tabularOnelineClauses: wi
	}
}, Ai = /* @__PURE__ */ "ADD.AFTER.ALL.ALTER.ANALYZE.AND.ANTI.ANY.ARCHIVE.AS.ASC.AT.AUTHORIZATION.BETWEEN.BOTH.BUCKET.BUCKETS.BY.CACHE.CASCADE.CAST.CHANGE.CHECK.CLEAR.CLUSTER.CLUSTERED.CODEGEN.COLLATE.COLLECTION.COLUMN.COLUMNS.COMMENT.COMMIT.COMPACT.COMPACTIONS.COMPUTE.CONCATENATE.CONSTRAINT.COST.CREATE.CROSS.CUBE.CURRENT.CURRENT_DATE.CURRENT_TIME.CURRENT_TIMESTAMP.CURRENT_USER.DATA.DATABASE.DATABASES.DAY.DBPROPERTIES.DEFINED.DELETE.DELIMITED.DESC.DESCRIBE.DFS.DIRECTORIES.DIRECTORY.DISTINCT.DISTRIBUTE.DIV.DROP.ESCAPE.ESCAPED.EXCEPT.EXCHANGE.EXISTS.EXPORT.EXTENDED.EXTERNAL.EXTRACT.FALSE.FETCH.FIELDS.FILTER.FILEFORMAT.FIRST.FIRST_VALUE.FOLLOWING.FOR.FOREIGN.FORMAT.FORMATTED.FULL.FUNCTION.FUNCTIONS.GLOBAL.GRANT.GROUP.GROUPING.HOUR.IF.IGNORE.IMPORT.IN.INDEX.INDEXES.INNER.INPATH.INPUTFORMAT.INTERSECT.INTO.IS.ITEMS.KEYS.LAST.LAST_VALUE.LATERAL.LAZY.LEADING.LEFT.LIKE.LINES.LIST.LOCAL.LOCATION.LOCK.LOCKS.LOGICAL.MACRO.MATCHED.MERGE.MINUTE.MONTH.MSCK.NAMESPACE.NAMESPACES.NATURAL.NO.NOT.NULL.NULLS.OF.ONLY.OPTION.OPTIONS.OR.ORDER.OUT.OUTER.OUTPUTFORMAT.OVER.OVERLAPS.OVERLAY.OVERWRITE.OWNER.PARTITION.PARTITIONED.PARTITIONS.PERCENT.PLACING.POSITION.PRECEDING.PRIMARY.PRINCIPALS.PROPERTIES.PURGE.QUERY.RANGE.RECORDREADER.RECORDWRITER.RECOVER.REDUCE.REFERENCES.RENAME.REPAIR.REPLACE.RESPECT.RESTRICT.REVOKE.RIGHT.RLIKE.ROLE.ROLES.ROLLBACK.ROLLUP.ROW.ROWS.SCHEMA.SECOND.SELECT.SEMI.SEPARATED.SERDE.SERDEPROPERTIES.SESSION_USER.SETS.SHOW.SKEWED.SOME.SORT.SORTED.START.STATISTICS.STORED.STRATIFY.SUBSTR.SUBSTRING.TABLE.TABLES.TBLPROPERTIES.TEMPORARY.TERMINATED.THEN.TO.TOUCH.TRAILING.TRANSACTION.TRANSACTIONS.TRIM.TRUE.TRUNCATE.UNARCHIVE.UNBOUNDED.UNCACHE.UNIQUE.UNKNOWN.UNLOCK.UNSET.USE.USER.USING.VIEW.WINDOW.YEAR.ANALYSE.ARRAY_ZIP.COALESCE.CONTAINS.CONVERT.DAYS.DAY_HOUR.DAY_MINUTE.DAY_SECOND.DECODE.DEFAULT.DISTINCTROW.ENCODE.EXPLODE.EXPLODE_OUTER.FIXED.GREATEST.GROUP_CONCAT.HOURS.HOUR_MINUTE.HOUR_SECOND.IFNULL.LEAST.LEVEL.MINUTE_SECOND.NULLIF.OFFSET.ON.OPTIMIZE.REGEXP.SEPARATOR.SIZE.TYPE.TYPES.UNSIGNED.VARIABLES.YEAR_MONTH".split("."), ji = /* @__PURE__ */ "ARRAY.BIGINT.BINARY.BOOLEAN.BYTE.CHAR.DATE.DEC.DECIMAL.DOUBLE.FLOAT.INT.INTEGER.INTERVAL.LONG.MAP.NUMERIC.REAL.SHORT.SMALLINT.STRING.STRUCT.TIMESTAMP_LTZ.TIMESTAMP_NTZ.TIMESTAMP.TINYINT.VARCHAR".split("."), Mi = /* @__PURE__ */ "APPROX_COUNT_DISTINCT.APPROX_PERCENTILE.AVG.BIT_AND.BIT_OR.BIT_XOR.BOOL_AND.BOOL_OR.COLLECT_LIST.COLLECT_SET.CORR.COUNT.COUNT.COUNT.COUNT_IF.COUNT_MIN_SKETCH.COVAR_POP.COVAR_SAMP.EVERY.FIRST.FIRST_VALUE.GROUPING.GROUPING_ID.KURTOSIS.LAST.LAST_VALUE.MAX.MAX_BY.MEAN.MIN.MIN_BY.PERCENTILE.PERCENTILE.PERCENTILE_APPROX.SKEWNESS.STD.STDDEV.STDDEV_POP.STDDEV_SAMP.SUM.VAR_POP.VAR_SAMP.VARIANCE.CUME_DIST.DENSE_RANK.LAG.LEAD.NTH_VALUE.NTILE.PERCENT_RANK.RANK.ROW_NUMBER.ARRAY.ARRAY_CONTAINS.ARRAY_DISTINCT.ARRAY_EXCEPT.ARRAY_INTERSECT.ARRAY_JOIN.ARRAY_MAX.ARRAY_MIN.ARRAY_POSITION.ARRAY_REMOVE.ARRAY_REPEAT.ARRAY_UNION.ARRAYS_OVERLAP.ARRAYS_ZIP.FLATTEN.SEQUENCE.SHUFFLE.SLICE.SORT_ARRAY.ELEMENT_AT.ELEMENT_AT.MAP_CONCAT.MAP_ENTRIES.MAP_FROM_ARRAYS.MAP_FROM_ENTRIES.MAP_KEYS.MAP_VALUES.STR_TO_MAP.ADD_MONTHS.CURRENT_DATE.CURRENT_DATE.CURRENT_TIMESTAMP.CURRENT_TIMESTAMP.CURRENT_TIMEZONE.DATE_ADD.DATE_FORMAT.DATE_FROM_UNIX_DATE.DATE_PART.DATE_SUB.DATE_TRUNC.DATEDIFF.DAY.DAYOFMONTH.DAYOFWEEK.DAYOFYEAR.EXTRACT.FROM_UNIXTIME.FROM_UTC_TIMESTAMP.HOUR.LAST_DAY.MAKE_DATE.MAKE_DT_INTERVAL.MAKE_INTERVAL.MAKE_TIMESTAMP.MAKE_YM_INTERVAL.MINUTE.MONTH.MONTHS_BETWEEN.NEXT_DAY.NOW.QUARTER.SECOND.SESSION_WINDOW.TIMESTAMP_MICROS.TIMESTAMP_MILLIS.TIMESTAMP_SECONDS.TO_DATE.TO_TIMESTAMP.TO_UNIX_TIMESTAMP.TO_UTC_TIMESTAMP.TRUNC.UNIX_DATE.UNIX_MICROS.UNIX_MILLIS.UNIX_SECONDS.UNIX_TIMESTAMP.WEEKDAY.WEEKOFYEAR.WINDOW.YEAR.FROM_JSON.GET_JSON_OBJECT.JSON_ARRAY_LENGTH.JSON_OBJECT_KEYS.JSON_TUPLE.SCHEMA_OF_JSON.TO_JSON.ABS.ACOS.ACOSH.AGGREGATE.ARRAY_SORT.ASCII.ASIN.ASINH.ASSERT_TRUE.ATAN.ATAN2.ATANH.BASE64.BIN.BIT_COUNT.BIT_GET.BIT_LENGTH.BROUND.BTRIM.CARDINALITY.CBRT.CEIL.CEILING.CHAR_LENGTH.CHARACTER_LENGTH.CHR.CONCAT.CONCAT_WS.CONV.COS.COSH.COT.CRC32.CURRENT_CATALOG.CURRENT_DATABASE.CURRENT_USER.DEGREES.ELT.EXP.EXPM1.FACTORIAL.FIND_IN_SET.FLOOR.FORALL.FORMAT_NUMBER.FORMAT_STRING.FROM_CSV.GETBIT.HASH.HEX.HYPOT.INITCAP.INLINE.INLINE_OUTER.INPUT_FILE_BLOCK_LENGTH.INPUT_FILE_BLOCK_START.INPUT_FILE_NAME.INSTR.ISNAN.ISNOTNULL.ISNULL.JAVA_METHOD.LCASE.LEFT.LENGTH.LEVENSHTEIN.LN.LOCATE.LOG.LOG10.LOG1P.LOG2.LOWER.LPAD.LTRIM.MAP_FILTER.MAP_ZIP_WITH.MD5.MOD.MONOTONICALLY_INCREASING_ID.NAMED_STRUCT.NANVL.NEGATIVE.NVL.NVL2.OCTET_LENGTH.OVERLAY.PARSE_URL.PI.PMOD.POSEXPLODE.POSEXPLODE_OUTER.POSITION.POSITIVE.POW.POWER.PRINTF.RADIANS.RAISE_ERROR.RAND.RANDN.RANDOM.REFLECT.REGEXP_EXTRACT.REGEXP_EXTRACT_ALL.REGEXP_LIKE.REGEXP_REPLACE.REPEAT.REPLACE.REVERSE.RIGHT.RINT.ROUND.RPAD.RTRIM.SCHEMA_OF_CSV.SENTENCES.SHA.SHA1.SHA2.SHIFTLEFT.SHIFTRIGHT.SHIFTRIGHTUNSIGNED.SIGN.SIGNUM.SIN.SINH.SOUNDEX.SPACE.SPARK_PARTITION_ID.SPLIT.SQRT.STACK.SUBSTR.SUBSTRING.SUBSTRING_INDEX.TAN.TANH.TO_CSV.TRANSFORM_KEYS.TRANSFORM_VALUES.TRANSLATE.TRIM.TRY_ADD.TRY_DIVIDE.TYPEOF.UCASE.UNBASE64.UNHEX.UPPER.UUID.VERSION.WIDTH_BUCKET.XPATH.XPATH_BOOLEAN.XPATH_DOUBLE.XPATH_FLOAT.XPATH_INT.XPATH_LONG.XPATH_NUMBER.XPATH_SHORT.XPATH_STRING.XXHASH64.ZIP_WITH.CAST.COALESCE.NULLIF".split("."), Ni = w(["SELECT [ALL | DISTINCT]"]), Pi = w([
	"WITH",
	"FROM",
	"WHERE",
	"GROUP BY",
	"HAVING",
	"WINDOW",
	"PARTITION BY",
	"ORDER BY",
	"SORT BY",
	"CLUSTER BY",
	"DISTRIBUTE BY",
	"LIMIT",
	"INSERT [INTO | OVERWRITE] [TABLE]",
	"VALUES",
	"INSERT OVERWRITE [LOCAL] DIRECTORY",
	"LOAD DATA [LOCAL] INPATH",
	"[OVERWRITE] INTO TABLE"
]), Fi = w(["CREATE [EXTERNAL] TABLE [IF NOT EXISTS]"]), Ii = w(/* @__PURE__ */ "CREATE [OR REPLACE] [GLOBAL TEMPORARY | TEMPORARY] VIEW [IF NOT EXISTS].DROP TABLE [IF EXISTS].ALTER TABLE.ADD COLUMNS.DROP {COLUMN | COLUMNS}.RENAME TO.RENAME COLUMN.ALTER COLUMN.TRUNCATE TABLE.LATERAL VIEW.ALTER DATABASE.ALTER VIEW.CREATE DATABASE.CREATE FUNCTION.DROP DATABASE.DROP FUNCTION.DROP VIEW.REPAIR TABLE.USE DATABASE.TABLESAMPLE.PIVOT.TRANSFORM.EXPLAIN.ADD FILE.ADD JAR.ANALYZE TABLE.CACHE TABLE.CLEAR CACHE.DESCRIBE DATABASE.DESCRIBE FUNCTION.DESCRIBE QUERY.DESCRIBE TABLE.LIST FILE.LIST JAR.REFRESH.REFRESH TABLE.REFRESH FUNCTION.RESET.SHOW COLUMNS.SHOW CREATE TABLE.SHOW DATABASES.SHOW FUNCTIONS.SHOW PARTITIONS.SHOW TABLE EXTENDED.SHOW TABLES.SHOW TBLPROPERTIES.SHOW VIEWS.UNCACHE TABLE".split(".")), Li = w([
	"UNION [ALL | DISTINCT]",
	"EXCEPT [ALL | DISTINCT]",
	"INTERSECT [ALL | DISTINCT]"
]), Ri = w([
	"JOIN",
	"{LEFT | RIGHT | FULL} [OUTER] JOIN",
	"{INNER | CROSS} JOIN",
	"NATURAL [INNER] JOIN",
	"NATURAL {LEFT | RIGHT | FULL} [OUTER] JOIN",
	"[LEFT] {ANTI | SEMI} JOIN",
	"NATURAL [LEFT] {ANTI | SEMI} JOIN"
]), zi = w([
	"ON DELETE",
	"ON UPDATE",
	"CURRENT ROW",
	"{ROWS | RANGE} BETWEEN"
]), Bi = w([]), Vi = {
	name: "spark",
	tokenizerOptions: {
		reservedSelect: Ni,
		reservedClauses: [
			...Pi,
			...Fi,
			...Ii
		],
		reservedSetOperations: Li,
		reservedJoins: Ri,
		reservedKeywordPhrases: zi,
		reservedDataTypePhrases: Bi,
		supportsXor: !0,
		reservedKeywords: Ai,
		reservedDataTypes: ji,
		reservedFunctionNames: Mi,
		extraParens: ["[]"],
		stringTypes: [
			"''-bs",
			"\"\"-bs",
			{
				quote: "''-raw",
				prefixes: ["R", "X"],
				requirePrefix: !0
			},
			{
				quote: "\"\"-raw",
				prefixes: ["R", "X"],
				requirePrefix: !0
			}
		],
		identTypes: ["``"],
		identChars: { allowFirstCharNumber: !0 },
		variableTypes: [{
			quote: "{}",
			prefixes: ["$"],
			requirePrefix: !0
		}],
		operators: [
			"%",
			"~",
			"^",
			"|",
			"&",
			"<=>",
			"==",
			"!",
			"||",
			"->"
		],
		postProcess: Hi
	},
	formatOptions: {
		onelineClauses: [...Fi, ...Ii],
		tabularOnelineClauses: Ii
	}
};
function Hi(e) {
	return e.map((t, n) => {
		let r = e[n - 1] || D, i = e[n + 1] || D;
		return k.WINDOW(t) && i.type === E.OPEN_PAREN ? Object.assign(Object.assign({}, t), { type: E.RESERVED_FUNCTION_NAME }) : t.text === "ITEMS" && t.type === E.RESERVED_KEYWORD && (r.text !== "COLLECTION" || i.text !== "TERMINATED") ? Object.assign(Object.assign({}, t), {
			type: E.IDENTIFIER,
			text: t.raw
		}) : t;
	});
}
//#endregion
//#region node_modules/sql-formatter/dist/esm/languages/sqlite/sqlite.functions.js
var Ui = /* @__PURE__ */ "ABS.CHANGES.CHAR.COALESCE.FORMAT.GLOB.HEX.IFNULL.IIF.INSTR.LAST_INSERT_ROWID.LENGTH.LIKE.LIKELIHOOD.LIKELY.LOAD_EXTENSION.LOWER.LTRIM.NULLIF.PRINTF.QUOTE.RANDOM.RANDOMBLOB.REPLACE.ROUND.RTRIM.SIGN.SOUNDEX.SQLITE_COMPILEOPTION_GET.SQLITE_COMPILEOPTION_USED.SQLITE_OFFSET.SQLITE_SOURCE_ID.SQLITE_VERSION.SUBSTR.SUBSTRING.TOTAL_CHANGES.TRIM.TYPEOF.UNICODE.UNLIKELY.UPPER.ZEROBLOB.AVG.COUNT.GROUP_CONCAT.MAX.MIN.SUM.TOTAL.DATE.TIME.DATETIME.JULIANDAY.UNIXEPOCH.STRFTIME.row_number.rank.dense_rank.percent_rank.cume_dist.ntile.lag.lead.first_value.last_value.nth_value.ACOS.ACOSH.ASIN.ASINH.ATAN.ATAN2.ATANH.CEIL.CEILING.COS.COSH.DEGREES.EXP.FLOOR.LN.LOG.LOG.LOG10.LOG2.MOD.PI.POW.POWER.RADIANS.SIN.SINH.SQRT.TAN.TANH.TRUNC.JSON.JSON_ARRAY.JSON_ARRAY_LENGTH.JSON_ARRAY_LENGTH.JSON_EXTRACT.JSON_INSERT.JSON_OBJECT.JSON_PATCH.JSON_REMOVE.JSON_REPLACE.JSON_SET.JSON_TYPE.JSON_TYPE.JSON_VALID.JSON_QUOTE.JSON_GROUP_ARRAY.JSON_GROUP_OBJECT.JSON_EACH.JSON_TREE.CAST".split("."), Wi = /* @__PURE__ */ "ABORT.ACTION.ADD.AFTER.ALL.ALTER.AND.ARE.ALWAYS.ANALYZE.AS.ASC.ATTACH.AUTOINCREMENT.BEFORE.BEGIN.BETWEEN.BY.CASCADE.CASE.CAST.CHECK.COLLATE.COLUMN.COMMIT.CONFLICT.CONSTRAINT.CREATE.CROSS.CURRENT.CURRENT_DATE.CURRENT_TIME.CURRENT_TIMESTAMP.DATABASE.DEFAULT.DEFERRABLE.DEFERRED.DELETE.DESC.DETACH.DISTINCT.DO.DROP.EACH.ELSE.END.ESCAPE.EXCEPT.EXCLUDE.EXCLUSIVE.EXISTS.EXPLAIN.FAIL.FILTER.FIRST.FOLLOWING.FOR.FOREIGN.FROM.FULL.GENERATED.GLOB.GROUP.HAVING.IF.IGNORE.IMMEDIATE.IN.INDEX.INDEXED.INITIALLY.INNER.INSERT.INSTEAD.INTERSECT.INTO.IS.ISNULL.JOIN.KEY.LAST.LEFT.LIKE.LIMIT.MATCH.MATERIALIZED.NATURAL.NO.NOT.NOTHING.NOTNULL.NULL.NULLS.OF.OFFSET.ON.ONLY.OPEN.OR.ORDER.OTHERS.OUTER.OVER.PARTITION.PLAN.PRAGMA.PRECEDING.PRIMARY.QUERY.RAISE.RANGE.RECURSIVE.REFERENCES.REGEXP.REINDEX.RELEASE.RENAME.REPLACE.RESTRICT.RETURNING.RIGHT.ROLLBACK.ROW.ROWS.SAVEPOINT.SELECT.SET.TABLE.TEMP.TEMPORARY.THEN.TIES.TO.TRANSACTION.TRIGGER.UNBOUNDED.UNION.UNIQUE.UPDATE.USING.VACUUM.VALUES.VIEW.VIRTUAL.WHEN.WHERE.WINDOW.WITH.WITHOUT".split("."), Gi = [
	"ANY",
	"ARRAY",
	"BLOB",
	"CHARACTER",
	"DECIMAL",
	"INT",
	"INTEGER",
	"NATIVE CHARACTER",
	"NCHAR",
	"NUMERIC",
	"NVARCHAR",
	"REAL",
	"TEXT",
	"VARCHAR",
	"VARYING CHARACTER"
], Ki = w(["SELECT [ALL | DISTINCT]"]), qi = w([
	"WITH [RECURSIVE]",
	"FROM",
	"WHERE",
	"GROUP BY",
	"HAVING",
	"WINDOW",
	"PARTITION BY",
	"ORDER BY",
	"LIMIT",
	"OFFSET",
	"INSERT [OR ABORT | OR FAIL | OR IGNORE | OR REPLACE | OR ROLLBACK] INTO",
	"REPLACE INTO",
	"VALUES",
	"SET",
	"RETURNING"
]), Ji = w(["CREATE [TEMPORARY | TEMP] TABLE [IF NOT EXISTS]"]), Yi = w([
	"CREATE [TEMPORARY | TEMP] VIEW [IF NOT EXISTS]",
	"UPDATE [OR ABORT | OR FAIL | OR IGNORE | OR REPLACE | OR ROLLBACK]",
	"ON CONFLICT",
	"DELETE FROM",
	"DROP TABLE [IF EXISTS]",
	"ALTER TABLE",
	"ADD [COLUMN]",
	"DROP [COLUMN]",
	"RENAME [COLUMN]",
	"RENAME TO",
	"SET SCHEMA"
]), Xi = w([
	"UNION [ALL]",
	"EXCEPT",
	"INTERSECT"
]), Zi = w([
	"JOIN",
	"{LEFT | RIGHT | FULL} [OUTER] JOIN",
	"{INNER | CROSS} JOIN",
	"NATURAL [INNER] JOIN",
	"NATURAL {LEFT | RIGHT | FULL} [OUTER] JOIN"
]), Qi = w([
	"ON {UPDATE | DELETE} [SET NULL | SET DEFAULT]",
	"{ROWS | RANGE | GROUPS} BETWEEN",
	"DO UPDATE"
]), $i = w([]), ea = {
	name: "sqlite",
	tokenizerOptions: {
		reservedSelect: Ki,
		reservedClauses: [
			...qi,
			...Ji,
			...Yi
		],
		reservedSetOperations: Xi,
		reservedJoins: Zi,
		reservedKeywordPhrases: Qi,
		reservedDataTypePhrases: $i,
		reservedKeywords: Wi,
		reservedDataTypes: Gi,
		reservedFunctionNames: Ui,
		stringTypes: ["''-qq", {
			quote: "''-raw",
			prefixes: ["X"],
			requirePrefix: !0
		}],
		identTypes: [
			"\"\"-qq",
			"``",
			"[]"
		],
		paramTypes: {
			positional: !0,
			numbered: ["?"],
			named: [":", "@"],
			custom: [{
				regex: String.raw`\$[a-zA-Z_][a-zA-Z0-9_]*(?:::[a-zA-Z_][a-zA-Z0-9_]*)*(?:\([^)]*\))?`,
				key: (e) => e.slice(1)
			}]
		},
		operators: [
			"%",
			"~",
			"&",
			"|",
			"<<",
			">>",
			"==",
			"->",
			"->>",
			"||"
		]
	},
	formatOptions: {
		onelineClauses: [...Ji, ...Yi],
		tabularOnelineClauses: Yi
	}
}, ta = /* @__PURE__ */ "GROUPING.RANK.DENSE_RANK.PERCENT_RANK.CUME_DIST.ROW_NUMBER.POSITION.OCCURRENCES_REGEX.POSITION_REGEX.EXTRACT.CHAR_LENGTH.CHARACTER_LENGTH.OCTET_LENGTH.CARDINALITY.ABS.MOD.LN.EXP.POWER.SQRT.FLOOR.CEIL.CEILING.WIDTH_BUCKET.SUBSTRING.SUBSTRING_REGEX.UPPER.LOWER.CONVERT.TRANSLATE.TRANSLATE_REGEX.TRIM.OVERLAY.NORMALIZE.SPECIFICTYPE.CURRENT_DATE.CURRENT_TIME.LOCALTIME.CURRENT_TIMESTAMP.LOCALTIMESTAMP.COUNT.AVG.MAX.MIN.SUM.STDDEV_POP.STDDEV_SAMP.VAR_SAMP.VAR_POP.COLLECT.FUSION.INTERSECTION.COVAR_POP.COVAR_SAMP.CORR.REGR_SLOPE.REGR_INTERCEPT.REGR_COUNT.REGR_R2.REGR_AVGX.REGR_AVGY.REGR_SXX.REGR_SYY.REGR_SXY.PERCENTILE_CONT.PERCENTILE_DISC.CAST.COALESCE.NULLIF.ROUND.SIN.COS.TAN.ASIN.ACOS.ATAN".split("."), na = /* @__PURE__ */ "ALL.ALLOCATE.ALTER.ANY.ARE.AS.ASC.ASENSITIVE.ASYMMETRIC.AT.ATOMIC.AUTHORIZATION.BEGIN.BETWEEN.BOTH.BY.CALL.CALLED.CASCADED.CAST.CHECK.CLOSE.COALESCE.COLLATE.COLUMN.COMMIT.CONDITION.CONNECT.CONSTRAINT.CORRESPONDING.CREATE.CROSS.CUBE.CURRENT.CURRENT_CATALOG.CURRENT_DEFAULT_TRANSFORM_GROUP.CURRENT_PATH.CURRENT_ROLE.CURRENT_SCHEMA.CURRENT_TRANSFORM_GROUP_FOR_TYPE.CURRENT_USER.CURSOR.CYCLE.DEALLOCATE.DAY.DECLARE.DEFAULT.DELETE.DEREF.DESC.DESCRIBE.DETERMINISTIC.DISCONNECT.DISTINCT.DROP.DYNAMIC.EACH.ELEMENT.END-EXEC.ESCAPE.EVERY.EXCEPT.EXEC.EXECUTE.EXISTS.EXTERNAL.FALSE.FETCH.FILTER.FOR.FOREIGN.FREE.FROM.FULL.FUNCTION.GET.GLOBAL.GRANT.GROUP.HAVING.HOLD.HOUR.IDENTITY.IN.INDICATOR.INNER.INOUT.INSENSITIVE.INSERT.INTERSECT.INTO.IS.LANGUAGE.LARGE.LATERAL.LEADING.LEFT.LIKE.LIKE_REGEX.LOCAL.MATCH.MEMBER.MERGE.METHOD.MINUTE.MODIFIES.MODULE.MONTH.NATURAL.NEW.NO.NONE.NOT.NULL.NULLIF.OF.OLD.ON.ONLY.OPEN.ORDER.OUT.OUTER.OVER.OVERLAPS.PARAMETER.PARTITION.PRECISION.PREPARE.PRIMARY.PROCEDURE.RANGE.READS.REAL.RECURSIVE.REF.REFERENCES.REFERENCING.RELEASE.RESULT.RETURN.RETURNS.REVOKE.RIGHT.ROLLBACK.ROLLUP.ROW.ROWS.SAVEPOINT.SCOPE.SCROLL.SEARCH.SECOND.SELECT.SENSITIVE.SESSION_USER.SET.SIMILAR.SOME.SPECIFIC.SQL.SQLEXCEPTION.SQLSTATE.SQLWARNING.START.STATIC.SUBMULTISET.SYMMETRIC.SYSTEM.SYSTEM_USER.TABLE.TABLESAMPLE.THEN.TIMEZONE_HOUR.TIMEZONE_MINUTE.TO.TRAILING.TRANSLATION.TREAT.TRIGGER.TRUE.UESCAPE.UNION.UNIQUE.UNKNOWN.UNNEST.UPDATE.USER.USING.VALUE.VALUES.WHENEVER.WINDOW.WITHIN.WITHOUT.YEAR".split("."), ra = /* @__PURE__ */ "ARRAY.BIGINT.BINARY LARGE OBJECT.BINARY VARYING.BINARY.BLOB.BOOLEAN.CHAR LARGE OBJECT.CHAR VARYING.CHAR.CHARACTER LARGE OBJECT.CHARACTER VARYING.CHARACTER.CLOB.DATE.DEC.DECIMAL.DOUBLE.FLOAT.INT.INTEGER.INTERVAL.MULTISET.NATIONAL CHAR VARYING.NATIONAL CHAR.NATIONAL CHARACTER LARGE OBJECT.NATIONAL CHARACTER VARYING.NATIONAL CHARACTER.NCHAR LARGE OBJECT.NCHAR VARYING.NCHAR.NCLOB.NUMERIC.SMALLINT.TIME.TIMESTAMP.VARBINARY.VARCHAR".split("."), ia = w(["SELECT [ALL | DISTINCT]"]), aa = w([
	"WITH [RECURSIVE]",
	"FROM",
	"WHERE",
	"GROUP BY [ALL | DISTINCT]",
	"HAVING",
	"WINDOW",
	"PARTITION BY",
	"ORDER BY",
	"LIMIT",
	"OFFSET",
	"FETCH {FIRST | NEXT}",
	"INSERT INTO",
	"VALUES",
	"SET"
]), oa = w(["CREATE [GLOBAL TEMPORARY | LOCAL TEMPORARY] TABLE"]), sa = w([
	"CREATE [RECURSIVE] VIEW",
	"UPDATE",
	"WHERE CURRENT OF",
	"DELETE FROM",
	"DROP TABLE",
	"ALTER TABLE",
	"ADD COLUMN",
	"DROP [COLUMN]",
	"RENAME COLUMN",
	"RENAME TO",
	"ALTER [COLUMN]",
	"{SET | DROP} DEFAULT",
	"ADD SCOPE",
	"DROP SCOPE {CASCADE | RESTRICT}",
	"RESTART WITH",
	"TRUNCATE TABLE",
	"SET SCHEMA"
]), ca = w([
	"UNION [ALL | DISTINCT]",
	"EXCEPT [ALL | DISTINCT]",
	"INTERSECT [ALL | DISTINCT]"
]), la = w([
	"JOIN",
	"{LEFT | RIGHT | FULL} [OUTER] JOIN",
	"{INNER | CROSS} JOIN",
	"NATURAL [INNER] JOIN",
	"NATURAL {LEFT | RIGHT | FULL} [OUTER] JOIN"
]), ua = w(["ON {UPDATE | DELETE} [SET NULL | SET DEFAULT]", "{ROWS | RANGE} BETWEEN"]), da = w([]), fa = {
	name: "sql",
	tokenizerOptions: {
		reservedSelect: ia,
		reservedClauses: [
			...aa,
			...oa,
			...sa
		],
		reservedSetOperations: ca,
		reservedJoins: la,
		reservedKeywordPhrases: ua,
		reservedDataTypePhrases: da,
		reservedKeywords: na,
		reservedDataTypes: ra,
		reservedFunctionNames: ta,
		stringTypes: [{
			quote: "''-qq-bs",
			prefixes: ["N", "U&"]
		}, {
			quote: "''-raw",
			prefixes: ["X"],
			requirePrefix: !0
		}],
		identTypes: ["\"\"-qq", "``"],
		paramTypes: { positional: !0 },
		operators: ["||"]
	},
	formatOptions: {
		onelineClauses: [...oa, ...sa],
		tabularOnelineClauses: sa
	}
}, pa = /* @__PURE__ */ "ABS.ACOS.ALL_MATCH.ANY_MATCH.APPROX_DISTINCT.APPROX_MOST_FREQUENT.APPROX_PERCENTILE.APPROX_SET.ARBITRARY.ARRAYS_OVERLAP.ARRAY_AGG.ARRAY_DISTINCT.ARRAY_EXCEPT.ARRAY_INTERSECT.ARRAY_JOIN.ARRAY_MAX.ARRAY_MIN.ARRAY_POSITION.ARRAY_REMOVE.ARRAY_SORT.ARRAY_UNION.ASIN.ATAN.ATAN2.AT_TIMEZONE.AVG.BAR.BETA_CDF.BING_TILE.BING_TILES_AROUND.BING_TILE_AT.BING_TILE_COORDINATES.BING_TILE_POLYGON.BING_TILE_QUADKEY.BING_TILE_ZOOM_LEVEL.BITWISE_AND.BITWISE_AND_AGG.BITWISE_LEFT_SHIFT.BITWISE_NOT.BITWISE_OR.BITWISE_OR_AGG.BITWISE_RIGHT_SHIFT.BITWISE_RIGHT_SHIFT_ARITHMETIC.BITWISE_XOR.BIT_COUNT.BOOL_AND.BOOL_OR.CARDINALITY.CAST.CBRT.CEIL.CEILING.CHAR2HEXINT.CHECKSUM.CHR.CLASSIFY.COALESCE.CODEPOINT.COLOR.COMBINATIONS.CONCAT.CONCAT_WS.CONTAINS.CONTAINS_SEQUENCE.CONVEX_HULL_AGG.CORR.COS.COSH.COSINE_SIMILARITY.COUNT.COUNT_IF.COVAR_POP.COVAR_SAMP.CRC32.CUME_DIST.CURRENT_CATALOG.CURRENT_DATE.CURRENT_GROUPS.CURRENT_SCHEMA.CURRENT_TIME.CURRENT_TIMESTAMP.CURRENT_TIMEZONE.CURRENT_USER.DATE.DATE_ADD.DATE_DIFF.DATE_FORMAT.DATE_PARSE.DATE_TRUNC.DAY.DAY_OF_MONTH.DAY_OF_WEEK.DAY_OF_YEAR.DEGREES.DENSE_RANK.DOW.DOY.E.ELEMENT_AT.EMPTY_APPROX_SET.EVALUATE_CLASSIFIER_PREDICTIONS.EVERY.EXP.EXTRACT.FEATURES.FILTER.FIRST_VALUE.FLATTEN.FLOOR.FORMAT.FORMAT_DATETIME.FORMAT_NUMBER.FROM_BASE.FROM_BASE32.FROM_BASE64.FROM_BASE64URL.FROM_BIG_ENDIAN_32.FROM_BIG_ENDIAN_64.FROM_ENCODED_POLYLINE.FROM_GEOJSON_GEOMETRY.FROM_HEX.FROM_IEEE754_32.FROM_IEEE754_64.FROM_ISO8601_DATE.FROM_ISO8601_TIMESTAMP.FROM_ISO8601_TIMESTAMP_NANOS.FROM_UNIXTIME.FROM_UNIXTIME_NANOS.FROM_UTF8.GEOMETRIC_MEAN.GEOMETRY_FROM_HADOOP_SHAPE.GEOMETRY_INVALID_REASON.GEOMETRY_NEAREST_POINTS.GEOMETRY_TO_BING_TILES.GEOMETRY_UNION.GEOMETRY_UNION_AGG.GREATEST.GREAT_CIRCLE_DISTANCE.HAMMING_DISTANCE.HASH_COUNTS.HISTOGRAM.HMAC_MD5.HMAC_SHA1.HMAC_SHA256.HMAC_SHA512.HOUR.HUMAN_READABLE_SECONDS.IF.INDEX.INFINITY.INTERSECTION_CARDINALITY.INVERSE_BETA_CDF.INVERSE_NORMAL_CDF.IS_FINITE.IS_INFINITE.IS_JSON_SCALAR.IS_NAN.JACCARD_INDEX.JSON_ARRAY_CONTAINS.JSON_ARRAY_GET.JSON_ARRAY_LENGTH.JSON_EXISTS.JSON_EXTRACT.JSON_EXTRACT_SCALAR.JSON_FORMAT.JSON_PARSE.JSON_QUERY.JSON_SIZE.JSON_VALUE.KURTOSIS.LAG.LAST_DAY_OF_MONTH.LAST_VALUE.LEAD.LEARN_CLASSIFIER.LEARN_LIBSVM_CLASSIFIER.LEARN_LIBSVM_REGRESSOR.LEARN_REGRESSOR.LEAST.LENGTH.LEVENSHTEIN_DISTANCE.LINE_INTERPOLATE_POINT.LINE_INTERPOLATE_POINTS.LINE_LOCATE_POINT.LISTAGG.LN.LOCALTIME.LOCALTIMESTAMP.LOG.LOG10.LOG2.LOWER.LPAD.LTRIM.LUHN_CHECK.MAKE_SET_DIGEST.MAP.MAP_AGG.MAP_CONCAT.MAP_ENTRIES.MAP_FILTER.MAP_FROM_ENTRIES.MAP_KEYS.MAP_UNION.MAP_VALUES.MAP_ZIP_WITH.MAX.MAX_BY.MD5.MERGE.MERGE_SET_DIGEST.MILLISECOND.MIN.MINUTE.MIN_BY.MOD.MONTH.MULTIMAP_AGG.MULTIMAP_FROM_ENTRIES.MURMUR3.NAN.NGRAMS.NONE_MATCH.NORMALIZE.NORMAL_CDF.NOW.NTH_VALUE.NTILE.NULLIF.NUMERIC_HISTOGRAM.OBJECTID.OBJECTID_TIMESTAMP.PARSE_DATA_SIZE.PARSE_DATETIME.PARSE_DURATION.PERCENT_RANK.PI.POSITION.POW.POWER.QDIGEST_AGG.QUARTER.RADIANS.RAND.RANDOM.RANK.REDUCE.REDUCE_AGG.REGEXP_COUNT.REGEXP_EXTRACT.REGEXP_EXTRACT_ALL.REGEXP_LIKE.REGEXP_POSITION.REGEXP_REPLACE.REGEXP_SPLIT.REGRESS.REGR_INTERCEPT.REGR_SLOPE.RENDER.REPEAT.REPLACE.REVERSE.RGB.ROUND.ROW_NUMBER.RPAD.RTRIM.SECOND.SEQUENCE.SHA1.SHA256.SHA512.SHUFFLE.SIGN.SIMPLIFY_GEOMETRY.SIN.SKEWNESS.SLICE.SOUNDEX.SPATIAL_PARTITIONING.SPATIAL_PARTITIONS.SPLIT.SPLIT_PART.SPLIT_TO_MAP.SPLIT_TO_MULTIMAP.SPOOKY_HASH_V2_32.SPOOKY_HASH_V2_64.SQRT.STARTS_WITH.STDDEV.STDDEV_POP.STDDEV_SAMP.STRPOS.ST_AREA.ST_ASBINARY.ST_ASTEXT.ST_BOUNDARY.ST_BUFFER.ST_CENTROID.ST_CONTAINS.ST_CONVEXHULL.ST_COORDDIM.ST_CROSSES.ST_DIFFERENCE.ST_DIMENSION.ST_DISJOINT.ST_DISTANCE.ST_ENDPOINT.ST_ENVELOPE.ST_ENVELOPEASPTS.ST_EQUALS.ST_EXTERIORRING.ST_GEOMETRIES.ST_GEOMETRYFROMTEXT.ST_GEOMETRYN.ST_GEOMETRYTYPE.ST_GEOMFROMBINARY.ST_INTERIORRINGN.ST_INTERIORRINGS.ST_INTERSECTION.ST_INTERSECTS.ST_ISCLOSED.ST_ISEMPTY.ST_ISRING.ST_ISSIMPLE.ST_ISVALID.ST_LENGTH.ST_LINEFROMTEXT.ST_LINESTRING.ST_MULTIPOINT.ST_NUMGEOMETRIES.ST_NUMINTERIORRING.ST_NUMPOINTS.ST_OVERLAPS.ST_POINT.ST_POINTN.ST_POINTS.ST_POLYGON.ST_RELATE.ST_STARTPOINT.ST_SYMDIFFERENCE.ST_TOUCHES.ST_UNION.ST_WITHIN.ST_X.ST_XMAX.ST_XMIN.ST_Y.ST_YMAX.ST_YMIN.SUBSTR.SUBSTRING.SUM.TAN.TANH.TDIGEST_AGG.TIMESTAMP_OBJECTID.TIMEZONE_HOUR.TIMEZONE_MINUTE.TO_BASE.TO_BASE32.TO_BASE64.TO_BASE64URL.TO_BIG_ENDIAN_32.TO_BIG_ENDIAN_64.TO_CHAR.TO_DATE.TO_ENCODED_POLYLINE.TO_GEOJSON_GEOMETRY.TO_GEOMETRY.TO_HEX.TO_IEEE754_32.TO_IEEE754_64.TO_ISO8601.TO_MILLISECONDS.TO_SPHERICAL_GEOGRAPHY.TO_TIMESTAMP.TO_UNIXTIME.TO_UTF8.TRANSFORM.TRANSFORM_KEYS.TRANSFORM_VALUES.TRANSLATE.TRIM.TRIM_ARRAY.TRUNCATE.TRY.TRY_CAST.TYPEOF.UPPER.URL_DECODE.URL_ENCODE.URL_EXTRACT_FRAGMENT.URL_EXTRACT_HOST.URL_EXTRACT_PARAMETER.URL_EXTRACT_PATH.URL_EXTRACT_PORT.URL_EXTRACT_PROTOCOL.URL_EXTRACT_QUERY.UUID.VALUES_AT_QUANTILES.VALUE_AT_QUANTILE.VARIANCE.VAR_POP.VAR_SAMP.VERSION.WEEK.WEEK_OF_YEAR.WIDTH_BUCKET.WILSON_INTERVAL_LOWER.WILSON_INTERVAL_UPPER.WITH_TIMEZONE.WORD_STEM.XXHASH64.YEAR.YEAR_OF_WEEK.YOW.ZIP.ZIP_WITH.CLASSIFIER.FIRST.LAST.MATCH_NUMBER.NEXT.PERMUTE.PREV".split("."), ma = /* @__PURE__ */ "ABSENT.ADD.ADMIN.AFTER.ALL.ALTER.ANALYZE.AND.ANY.AS.ASC.AT.AUTHORIZATION.BERNOULLI.BETWEEN.BOTH.BY.CALL.CASCADE.CASE.CATALOGS.COLUMN.COLUMNS.COMMENT.COMMIT.COMMITTED.CONDITIONAL.CONSTRAINT.COPARTITION.CREATE.CROSS.CUBE.CURRENT.CURRENT_PATH.CURRENT_ROLE.DATA.DEALLOCATE.DEFAULT.DEFINE.DEFINER.DELETE.DENY.DESC.DESCRIBE.DESCRIPTOR.DISTINCT.DISTRIBUTED.DOUBLE.DROP.ELSE.EMPTY.ENCODING.END.ERROR.ESCAPE.EXCEPT.EXCLUDING.EXECUTE.EXISTS.EXPLAIN.FALSE.FETCH.FINAL.FIRST.FOLLOWING.FOR.FROM.FULL.FUNCTIONS.GRANT.GRANTED.GRANTS.GRAPHVIZ.GROUP.GROUPING.GROUPS.HAVING.IGNORE.IN.INCLUDING.INITIAL.INNER.INPUT.INSERT.INTERSECT.INTERVAL.INTO.INVOKER.IO.IS.ISOLATION.JOIN.JSON.JSON_ARRAY.JSON_OBJECT.KEEP.KEY.KEYS.LAST.LATERAL.LEADING.LEFT.LEVEL.LIKE.LIMIT.LOCAL.LOGICAL.MATCH.MATCHED.MATCHES.MATCH_RECOGNIZE.MATERIALIZED.MEASURES.NATURAL.NEXT.NFC.NFD.NFKC.NFKD.NO.NONE.NOT.NULL.NULLS.OBJECT.OF.OFFSET.OMIT.ON.ONE.ONLY.OPTION.OR.ORDER.ORDINALITY.OUTER.OUTPUT.OVER.OVERFLOW.PARTITION.PARTITIONS.PASSING.PAST.PATH.PATTERN.PER.PERMUTE.PRECEDING.PRECISION.PREPARE.PRIVILEGES.PROPERTIES.PRUNE.QUOTES.RANGE.READ.RECURSIVE.REFRESH.RENAME.REPEATABLE.RESET.RESPECT.RESTRICT.RETURNING.REVOKE.RIGHT.ROLE.ROLES.ROLLBACK.ROLLUP.ROW.ROWS.RUNNING.SCALAR.SCHEMA.SCHEMAS.SECURITY.SEEK.SELECT.SERIALIZABLE.SESSION.SET.SETS.SHOW.SKIP.SOME.START.STATS.STRING.SUBSET.SYSTEM.TABLE.TABLES.TABLESAMPLE.TEXT.THEN.TIES.TIME.TIMESTAMP.TO.TRAILING.TRANSACTION.TRUE.TYPE.UESCAPE.UNBOUNDED.UNCOMMITTED.UNCONDITIONAL.UNION.UNIQUE.UNKNOWN.UNMATCHED.UNNEST.UPDATE.USE.USER.USING.UTF16.UTF32.UTF8.VALIDATE.VALUE.VALUES.VERBOSE.VIEW.WHEN.WHERE.WINDOW.WITH.WITHIN.WITHOUT.WORK.WRAPPER.WRITE.ZONE".split("."), ha = /* @__PURE__ */ "BIGINT.INT.INTEGER.SMALLINT.TINYINT.BOOLEAN.DATE.DECIMAL.REAL.DOUBLE.HYPERLOGLOG.QDIGEST.TDIGEST.P4HYPERLOGLOG.INTERVAL.TIMESTAMP.TIME.VARBINARY.VARCHAR.CHAR.ROW.ARRAY.MAP.JSON.JSON2016.IPADDRESS.GEOMETRY.UUID.SETDIGEST.JONIREGEXP.RE2JREGEXP.LIKEPATTERN.COLOR.CODEPOINTS.FUNCTION.JSONPATH".split("."), ga = w(["SELECT [ALL | DISTINCT]"]), _a = w([
	"WITH [RECURSIVE]",
	"FROM",
	"WHERE",
	"GROUP BY [ALL | DISTINCT]",
	"HAVING",
	"WINDOW",
	"PARTITION BY",
	"ORDER BY",
	"LIMIT",
	"OFFSET",
	"FETCH {FIRST | NEXT}",
	"INSERT INTO",
	"VALUES",
	"SET",
	"MATCH_RECOGNIZE",
	"MEASURES",
	"ONE ROW PER MATCH",
	"ALL ROWS PER MATCH",
	"AFTER MATCH",
	"PATTERN",
	"SUBSET",
	"DEFINE"
]), va = w(["CREATE TABLE [IF NOT EXISTS]"]), ya = w(/* @__PURE__ */ "CREATE [OR REPLACE] [MATERIALIZED] VIEW.UPDATE.DELETE FROM.DROP TABLE [IF EXISTS].ALTER TABLE [IF EXISTS].ADD COLUMN [IF NOT EXISTS].DROP COLUMN [IF EXISTS].RENAME COLUMN [IF EXISTS].RENAME TO.SET AUTHORIZATION [USER | ROLE].SET PROPERTIES.EXECUTE.TRUNCATE TABLE.ALTER SCHEMA.ALTER MATERIALIZED VIEW.ALTER VIEW.CREATE SCHEMA.CREATE ROLE.DROP SCHEMA.DROP MATERIALIZED VIEW.DROP VIEW.DROP ROLE.EXPLAIN.ANALYZE.EXPLAIN ANALYZE.EXPLAIN ANALYZE VERBOSE.USE.DESCRIBE INPUT.DESCRIBE OUTPUT.REFRESH MATERIALIZED VIEW.RESET SESSION.SET SESSION.SET PATH.SET TIME ZONE.SHOW GRANTS.SHOW CREATE TABLE.SHOW CREATE SCHEMA.SHOW CREATE VIEW.SHOW CREATE MATERIALIZED VIEW.SHOW TABLES.SHOW SCHEMAS.SHOW CATALOGS.SHOW COLUMNS.SHOW STATS FOR.SHOW ROLES.SHOW CURRENT ROLES.SHOW ROLE GRANTS.SHOW FUNCTIONS.SHOW SESSION".split(".")), ba = w([
	"UNION [ALL | DISTINCT] [CORRESPONDING]",
	"EXCEPT [ALL | DISTINCT] [CORRESPONDING]",
	"INTERSECT [ALL | DISTINCT] [CORRESPONDING]"
]), xa = w([
	"JOIN",
	"{LEFT | RIGHT | FULL} [OUTER] JOIN",
	"{INNER | CROSS} JOIN",
	"NATURAL [INNER] JOIN",
	"NATURAL {LEFT | RIGHT | FULL} [OUTER] JOIN"
]), Sa = w([
	"{ROWS | RANGE | GROUPS} BETWEEN",
	"IS [NOT] DISTINCT FROM",
	"[TIMESTAMP | TIME] {WITH | WITHOUT} TIME ZONE"
]), Ca = w([]), wa = {
	name: "trino",
	tokenizerOptions: {
		reservedSelect: ga,
		reservedClauses: [
			..._a,
			...va,
			...ya
		],
		reservedSetOperations: ba,
		reservedJoins: xa,
		reservedKeywordPhrases: Sa,
		reservedDataTypePhrases: Ca,
		reservedKeywords: ma,
		reservedDataTypes: ha,
		reservedFunctionNames: pa,
		extraParens: ["[]", "{}"],
		stringTypes: [{
			quote: "''-qq",
			prefixes: ["U&"]
		}, {
			quote: "''-raw",
			prefixes: ["X"],
			requirePrefix: !0
		}],
		identTypes: ["\"\"-qq"],
		paramTypes: { positional: !0 },
		operators: [
			"%",
			"->",
			"=>",
			":",
			"||",
			"|",
			"^",
			"$"
		]
	},
	formatOptions: {
		onelineClauses: [...va, ...ya],
		tabularOnelineClauses: ya
	}
}, Ta = /* @__PURE__ */ "APPROX_COUNT_DISTINCT.AVG.CHECKSUM_AGG.COUNT.COUNT_BIG.GROUPING.GROUPING_ID.MAX.MIN.STDEV.STDEVP.SUM.VAR.VARP.CUME_DIST.FIRST_VALUE.LAG.LAST_VALUE.LEAD.PERCENTILE_CONT.PERCENTILE_DISC.PERCENT_RANK.Collation - COLLATIONPROPERTY.Collation - TERTIARY_WEIGHTS.@@DBTS.@@LANGID.@@LANGUAGE.@@LOCK_TIMEOUT.@@MAX_CONNECTIONS.@@MAX_PRECISION.@@NESTLEVEL.@@OPTIONS.@@REMSERVER.@@SERVERNAME.@@SERVICENAME.@@SPID.@@TEXTSIZE.@@VERSION.CAST.CONVERT.PARSE.TRY_CAST.TRY_CONVERT.TRY_PARSE.ASYMKEY_ID.ASYMKEYPROPERTY.CERTPROPERTY.CERT_ID.CRYPT_GEN_RANDOM.DECRYPTBYASYMKEY.DECRYPTBYCERT.DECRYPTBYKEY.DECRYPTBYKEYAUTOASYMKEY.DECRYPTBYKEYAUTOCERT.DECRYPTBYPASSPHRASE.ENCRYPTBYASYMKEY.ENCRYPTBYCERT.ENCRYPTBYKEY.ENCRYPTBYPASSPHRASE.HASHBYTES.IS_OBJECTSIGNED.KEY_GUID.KEY_ID.KEY_NAME.SIGNBYASYMKEY.SIGNBYCERT.SYMKEYPROPERTY.VERIFYSIGNEDBYCERT.VERIFYSIGNEDBYASYMKEY.@@CURSOR_ROWS.@@FETCH_STATUS.CURSOR_STATUS.DATALENGTH.IDENT_CURRENT.IDENT_INCR.IDENT_SEED.IDENTITY.SQL_VARIANT_PROPERTY.@@DATEFIRST.CURRENT_TIMESTAMP.CURRENT_TIMEZONE.CURRENT_TIMEZONE_ID.DATEADD.DATEDIFF.DATEDIFF_BIG.DATEFROMPARTS.DATENAME.DATEPART.DATETIME2FROMPARTS.DATETIMEFROMPARTS.DATETIMEOFFSETFROMPARTS.DAY.EOMONTH.GETDATE.GETUTCDATE.ISDATE.MONTH.SMALLDATETIMEFROMPARTS.SWITCHOFFSET.SYSDATETIME.SYSDATETIMEOFFSET.SYSUTCDATETIME.TIMEFROMPARTS.TODATETIMEOFFSET.YEAR.JSON.ISJSON.OPENJSON.JSON_VALUE.JSON_QUERY.JSON_MODIFY.ABS.ACOS.ASIN.ATAN.ATN2.CEILING.COS.COT.DEGREES.EXP.FLOOR.LOG.LOG10.PI.POWER.RADIANS.RAND.ROUND.SIGN.SIN.SQRT.SQUARE.TAN.CHOOSE.GREATEST.IIF.LEAST.@@PROCID.APP_NAME.APPLOCK_MODE.APPLOCK_TEST.ASSEMBLYPROPERTY.COL_LENGTH.COL_NAME.COLUMNPROPERTY.DATABASEPROPERTYEX.DB_ID.DB_NAME.FILE_ID.FILE_IDEX.FILE_NAME.FILEGROUP_ID.FILEGROUP_NAME.FILEGROUPPROPERTY.FILEPROPERTY.FILEPROPERTYEX.FULLTEXTCATALOGPROPERTY.FULLTEXTSERVICEPROPERTY.INDEX_COL.INDEXKEY_PROPERTY.INDEXPROPERTY.NEXT VALUE FOR.OBJECT_DEFINITION.OBJECT_ID.OBJECT_NAME.OBJECT_SCHEMA_NAME.OBJECTPROPERTY.OBJECTPROPERTYEX.ORIGINAL_DB_NAME.PARSENAME.SCHEMA_ID.SCHEMA_NAME.SCOPE_IDENTITY.SERVERPROPERTY.STATS_DATE.TYPE_ID.TYPE_NAME.TYPEPROPERTY.DENSE_RANK.NTILE.RANK.ROW_NUMBER.PUBLISHINGSERVERNAME.CERTENCODED.CERTPRIVATEKEY.CURRENT_USER.DATABASE_PRINCIPAL_ID.HAS_DBACCESS.HAS_PERMS_BY_NAME.IS_MEMBER.IS_ROLEMEMBER.IS_SRVROLEMEMBER.LOGINPROPERTY.ORIGINAL_LOGIN.PERMISSIONS.PWDENCRYPT.PWDCOMPARE.SESSION_USER.SESSIONPROPERTY.SUSER_ID.SUSER_NAME.SUSER_SID.SUSER_SNAME.SYSTEM_USER.USER.USER_ID.USER_NAME.ASCII.CHARINDEX.CONCAT.CONCAT_WS.DIFFERENCE.FORMAT.LEFT.LEN.LOWER.LTRIM.PATINDEX.QUOTENAME.REPLACE.REPLICATE.REVERSE.RIGHT.RTRIM.SOUNDEX.SPACE.STR.STRING_AGG.STRING_ESCAPE.STUFF.SUBSTRING.TRANSLATE.TRIM.UNICODE.UPPER.$PARTITION.@@ERROR.@@IDENTITY.@@PACK_RECEIVED.@@ROWCOUNT.@@TRANCOUNT.BINARY_CHECKSUM.CHECKSUM.COMPRESS.CONNECTIONPROPERTY.CONTEXT_INFO.CURRENT_REQUEST_ID.CURRENT_TRANSACTION_ID.DECOMPRESS.ERROR_LINE.ERROR_MESSAGE.ERROR_NUMBER.ERROR_PROCEDURE.ERROR_SEVERITY.ERROR_STATE.FORMATMESSAGE.GET_FILESTREAM_TRANSACTION_CONTEXT.GETANSINULL.HOST_ID.HOST_NAME.ISNULL.ISNUMERIC.MIN_ACTIVE_ROWVERSION.NEWID.NEWSEQUENTIALID.ROWCOUNT_BIG.SESSION_CONTEXT.XACT_STATE.@@CONNECTIONS.@@CPU_BUSY.@@IDLE.@@IO_BUSY.@@PACK_SENT.@@PACKET_ERRORS.@@TIMETICKS.@@TOTAL_ERRORS.@@TOTAL_READ.@@TOTAL_WRITE.TEXTPTR.TEXTVALID.COLUMNS_UPDATED.EVENTDATA.TRIGGER_NESTLEVEL.UPDATE.COALESCE.NULLIF".split("."), Ea = /* @__PURE__ */ "ADD.ALL.ALTER.AND.ANY.AS.ASC.AUTHORIZATION.BACKUP.BEGIN.BETWEEN.BREAK.BROWSE.BULK.BY.CASCADE.CHECK.CHECKPOINT.CLOSE.CLUSTERED.COALESCE.COLLATE.COLUMN.COMMIT.COMPUTE.CONSTRAINT.CONTAINS.CONTAINSTABLE.CONTINUE.CONVERT.CREATE.CROSS.CURRENT.CURRENT_DATE.CURRENT_TIME.CURRENT_TIMESTAMP.CURRENT_USER.CURSOR.DATABASE.DBCC.DEALLOCATE.DECLARE.DEFAULT.DELETE.DENY.DESC.DISK.DISTINCT.DISTRIBUTED.DROP.DUMP.ERRLVL.ESCAPE.EXEC.EXECUTE.EXISTS.EXIT.EXTERNAL.FETCH.FILE.FILLFACTOR.FOR.FOREIGN.FREETEXT.FREETEXTTABLE.FROM.FULL.FUNCTION.GOTO.GRANT.GROUP.HAVING.HOLDLOCK.IDENTITY.IDENTITYCOL.IDENTITY_INSERT.IF.IN.INDEX.INNER.INSERT.INTERSECT.INTO.IS.JOIN.KEY.KILL.LEFT.LIKE.LINENO.LOAD.MERGE.NOCHECK.NONCLUSTERED.NOT.NULL.NULLIF.OF.OFF.OFFSETS.ON.OPEN.OPENDATASOURCE.OPENQUERY.OPENROWSET.OPENXML.OPTION.OR.ORDER.OUTER.OVER.PERCENT.PIVOT.PLAN.PRIMARY.PRINT.PROC.PROCEDURE.PUBLIC.RAISERROR.READ.READTEXT.RECONFIGURE.REFERENCES.REPLICATION.RESTORE.RESTRICT.RETURN.REVERT.REVOKE.RIGHT.ROLLBACK.ROWCOUNT.ROWGUIDCOL.RULE.SAVE.SCHEMA.SECURITYAUDIT.SELECT.SEMANTICKEYPHRASETABLE.SEMANTICSIMILARITYDETAILSTABLE.SEMANTICSIMILARITYTABLE.SESSION_USER.SET.SETUSER.SHUTDOWN.SOME.STATISTICS.SYSTEM_USER.TABLE.TABLESAMPLE.TEXTSIZE.THEN.TO.TOP.TRAN.TRANSACTION.TRIGGER.TRUNCATE.TRY_CONVERT.TSEQUAL.UNION.UNIQUE.UNPIVOT.UPDATE.UPDATETEXT.USE.USER.VALUES.VIEW.WAITFOR.WHERE.WHILE.WITH.WITHIN GROUP.WRITETEXT.$ACTION".split("."), Da = [
	"BINARY",
	"BIT",
	"CHAR",
	"CHAR",
	"CHARACTER",
	"DATE",
	"DATETIME2",
	"DATETIMEOFFSET",
	"DEC",
	"DECIMAL",
	"DOUBLE",
	"FLOAT",
	"INT",
	"INTEGER",
	"NATIONAL",
	"NCHAR",
	"NUMERIC",
	"NVARCHAR",
	"PRECISION",
	"REAL",
	"SMALLINT",
	"TIME",
	"TIMESTAMP",
	"VARBINARY",
	"VARCHAR"
], Oa = w(["SELECT [ALL | DISTINCT]"]), ka = w([
	"WITH",
	"INTO",
	"FROM",
	"WHERE",
	"GROUP BY",
	"HAVING",
	"WINDOW",
	"PARTITION BY",
	"ORDER BY",
	"OFFSET",
	"FETCH {FIRST | NEXT}",
	"FOR {BROWSE | XML | JSON}",
	"OPTION",
	"INSERT [INTO]",
	"VALUES",
	"SET",
	"MERGE [INTO]",
	"WHEN [NOT] MATCHED [BY TARGET | BY SOURCE] [THEN]",
	"UPDATE SET"
]), Aa = w(["CREATE TABLE"]), ja = w(/* @__PURE__ */ "CREATE [OR ALTER] [MATERIALIZED] VIEW.UPDATE.WHERE CURRENT OF.DELETE [FROM].DROP TABLE [IF EXISTS].ALTER TABLE.ADD.DROP COLUMN [IF EXISTS].ALTER COLUMN.TRUNCATE TABLE.CREATE [UNIQUE] [CLUSTERED] INDEX.CREATE DATABASE.ALTER DATABASE.DROP DATABASE [IF EXISTS].CREATE [OR ALTER] [PARTITION] {FUNCTION | PROCEDURE | PROC}.ALTER [PARTITION] {FUNCTION | PROCEDURE | PROC}.DROP [PARTITION] {FUNCTION | PROCEDURE | PROC} [IF EXISTS].GO.USE.ADD SENSITIVITY CLASSIFICATION.ADD SIGNATURE.AGGREGATE.ANSI_DEFAULTS.ANSI_NULLS.ANSI_NULL_DFLT_OFF.ANSI_NULL_DFLT_ON.ANSI_PADDING.ANSI_WARNINGS.APPLICATION ROLE.ARITHABORT.ARITHIGNORE.ASSEMBLY.ASYMMETRIC KEY.AUTHORIZATION.AVAILABILITY GROUP.BACKUP.BACKUP CERTIFICATE.BACKUP MASTER KEY.BACKUP SERVICE MASTER KEY.BEGIN CONVERSATION TIMER.BEGIN DIALOG CONVERSATION.BROKER PRIORITY.BULK INSERT.CERTIFICATE.CLOSE MASTER KEY.CLOSE SYMMETRIC KEY.COLUMN ENCRYPTION KEY.COLUMN MASTER KEY.COLUMNSTORE INDEX.CONCAT_NULL_YIELDS_NULL.CONTEXT_INFO.CONTRACT.CREDENTIAL.CRYPTOGRAPHIC PROVIDER.CURSOR_CLOSE_ON_COMMIT.DATABASE.DATABASE AUDIT SPECIFICATION.DATABASE ENCRYPTION KEY.DATABASE HADR.DATABASE SCOPED CONFIGURATION.DATABASE SCOPED CREDENTIAL.DATABASE SET.DATEFIRST.DATEFORMAT.DEADLOCK_PRIORITY.DENY.DENY XML.DISABLE TRIGGER.ENABLE TRIGGER.END CONVERSATION.ENDPOINT.EVENT NOTIFICATION.EVENT SESSION.EXECUTE AS.EXTERNAL DATA SOURCE.EXTERNAL FILE FORMAT.EXTERNAL LANGUAGE.EXTERNAL LIBRARY.EXTERNAL RESOURCE POOL.EXTERNAL TABLE.FIPS_FLAGGER.FMTONLY.FORCEPLAN.FULLTEXT CATALOG.FULLTEXT INDEX.FULLTEXT STOPLIST.GET CONVERSATION GROUP.GET_TRANSMISSION_STATUS.GRANT.GRANT XML.IDENTITY_INSERT.IMPLICIT_TRANSACTIONS.INDEX.LANGUAGE.LOCK_TIMEOUT.LOGIN.MASTER KEY.MESSAGE TYPE.MOVE CONVERSATION.NOCOUNT.NOEXEC.NUMERIC_ROUNDABORT.OFFSETS.OPEN MASTER KEY.OPEN SYMMETRIC KEY.PARSEONLY.PARTITION SCHEME.QUERY_GOVERNOR_COST_LIMIT.QUEUE.QUOTED_IDENTIFIER.RECEIVE.REMOTE SERVICE BINDING.REMOTE_PROC_TRANSACTIONS.RESOURCE GOVERNOR.RESOURCE POOL.RESTORE.RESTORE FILELISTONLY.RESTORE HEADERONLY.RESTORE LABELONLY.RESTORE MASTER KEY.RESTORE REWINDONLY.RESTORE SERVICE MASTER KEY.RESTORE VERIFYONLY.REVERT.REVOKE.REVOKE XML.ROLE.ROUTE.ROWCOUNT.RULE.SCHEMA.SEARCH PROPERTY LIST.SECURITY POLICY.SELECTIVE XML INDEX.SEND.SENSITIVITY CLASSIFICATION.SEQUENCE.SERVER AUDIT.SERVER AUDIT SPECIFICATION.SERVER CONFIGURATION.SERVER ROLE.SERVICE.SERVICE MASTER KEY.SETUSER.SHOWPLAN_ALL.SHOWPLAN_TEXT.SHOWPLAN_XML.SIGNATURE.SPATIAL INDEX.STATISTICS.STATISTICS IO.STATISTICS PROFILE.STATISTICS TIME.STATISTICS XML.SYMMETRIC KEY.SYNONYM.TABLE.TABLE IDENTITY.TEXTSIZE.TRANSACTION ISOLATION LEVEL.TRIGGER.TYPE.UPDATE STATISTICS.USER.WORKLOAD GROUP.XACT_ABORT.XML INDEX.XML SCHEMA COLLECTION".split(".")), Ma = w([
	"UNION [ALL]",
	"EXCEPT",
	"INTERSECT"
]), Na = w([
	"JOIN",
	"{LEFT | RIGHT | FULL} [OUTER] JOIN",
	"{INNER | CROSS} JOIN",
	"{CROSS | OUTER} APPLY"
]), Pa = w(["ON {UPDATE | DELETE} [SET NULL | SET DEFAULT]", "{ROWS | RANGE} BETWEEN"]), Fa = w([]), Ia = {
	name: "transactsql",
	tokenizerOptions: {
		reservedSelect: Oa,
		reservedClauses: [
			...ka,
			...Aa,
			...ja
		],
		reservedSetOperations: Ma,
		reservedJoins: Na,
		reservedKeywordPhrases: Pa,
		reservedDataTypePhrases: Fa,
		reservedKeywords: Ea,
		reservedDataTypes: Da,
		reservedFunctionNames: Ta,
		nestedBlockComments: !0,
		stringTypes: [{
			quote: "''-qq",
			prefixes: ["N"]
		}, "{}"],
		identTypes: ["\"\"-qq", "[]"],
		identChars: {
			first: "#@",
			rest: "#@$"
		},
		paramTypes: {
			named: ["@"],
			quoted: ["@"]
		},
		operators: [
			"%",
			"&",
			"|",
			"^",
			"~",
			"!<",
			"!>",
			"+=",
			"-=",
			"*=",
			"/=",
			"%=",
			"|=",
			"&=",
			"^=",
			"::",
			":"
		],
		propertyAccessOperators: [".."]
	},
	formatOptions: {
		alwaysDenseOperators: ["::"],
		onelineClauses: [...Aa, ...ja],
		tabularOnelineClauses: ja
	}
}, La = /* @__PURE__ */ "ADD.ALL.ALTER.ANALYZE.AND.AS.ASC.ASENSITIVE.BEFORE.BETWEEN._BINARY.BOTH.BY.CALL.CASCADE.CASE.CHANGE.CHECK.COLLATE.COLUMN.CONDITION.CONSTRAINT.CONTINUE.CONVERT.CREATE.CROSS.CURRENT_DATE.CURRENT_TIME.CURRENT_TIMESTAMP.CURRENT_USER.CURSOR.DATABASE.DATABASES.DAY_HOUR.DAY_MICROSECOND.DAY_MINUTE.DAY_SECOND.DECLARE.DEFAULT.DELAYED.DELETE.DESC.DESCRIBE.DETERMINISTIC.DISTINCT.DISTINCTROW.DIV.DROP.DUAL.EACH.ELSE.ELSEIF.ENCLOSED.ESCAPED.EXCEPT.EXISTS.EXIT.EXPLAIN.EXTRA_JOIN.FALSE.FETCH.FOR.FORCE.FORCE_COMPILED_MODE.FORCE_INTERPRETER_MODE.FOREIGN.FROM.FULL.FULLTEXT.GRANT.GROUP.HAVING.HEARTBEAT_NO_LOGGING.HIGH_PRIORITY.HOUR_MICROSECOND.HOUR_MINUTE.HOUR_SECOND.IF.IGNORE.IN.INDEX.INFILE.INNER.INOUT.INSENSITIVE.INSERT.IN._INTERNAL_DYNAMIC_TYPECAST.INTERSECT.INTERVAL.INTO.ITERATE.JOIN.KEY.KEYS.KILL.LEADING.LEAVE.LEFT.LIKE.LIMIT.LINES.LOAD.LOCALTIME.LOCALTIMESTAMP.LOCK.LOOP.LOW_PRIORITY.MATCH.MAXVALUE.MINUS.MINUTE_MICROSECOND.MINUTE_SECOND.MOD.MODIFIES.NATURAL.NO_QUERY_REWRITE.NOT.NO_WRITE_TO_BINLOG.NO_QUERY_REWRITE.NULL.ON.OPTIMIZE.OPTION.OPTIONALLY.OR.ORDER.OUT.OUTER.OUTFILE.OVER.PRIMARY.PROCEDURE.PURGE.RANGE.READ.READS.REFERENCES.REGEXP.RELEASE.RENAME.REPEAT.REPLACE.REQUIRE.RESTRICT.RETURN.REVOKE.RIGHT.RIGHT_ANTI_JOIN.RIGHT_SEMI_JOIN.RIGHT_STRAIGHT_JOIN.RLIKE.SCHEMA.SCHEMAS.SECOND_MICROSECOND.SELECT.SEMI_JOIN.SENSITIVE.SEPARATOR.SET.SHOW.SIGNAL.SPATIAL.SPECIFIC.SQL.SQL_BIG_RESULT.SQL_BUFFER_RESULT.SQL_CACHE.SQL_CALC_FOUND_ROWS.SQLEXCEPTION.SQL_NO_CACHE.SQL_NO_LOGGING.SQL_SMALL_RESULT.SQLSTATE.SQLWARNING.STRAIGHT_JOIN.TABLE.TERMINATED.THEN.TO.TRAILING.TRIGGER.TRUE.UNBOUNDED.UNDO.UNION.UNIQUE.UNLOCK.UPDATE.USAGE.USE.USING.UTC_DATE.UTC_TIME.UTC_TIMESTAMP._UTF8.VALUES.WHEN.WHERE.WHILE.WINDOW.WITH.WITHIN.WRITE.XOR.YEAR_MONTH.ZEROFILL".split("."), Ra = /* @__PURE__ */ "BIGINT.BINARY.BIT.BLOB.CHAR.CHARACTER.DATETIME.DEC.DECIMAL.DOUBLE PRECISION.DOUBLE.ENUM.FIXED.FLOAT.FLOAT4.FLOAT8.INT.INT1.INT2.INT3.INT4.INT8.INTEGER.LONG.LONGBLOB.LONGTEXT.MEDIUMBLOB.MEDIUMINT.MEDIUMTEXT.MIDDLEINT.NATIONAL CHAR.NATIONAL VARCHAR.NUMERIC.PRECISION.REAL.SMALLINT.TEXT.TIME.TIMESTAMP.TINYBLOB.TINYINT.TINYTEXT.UNSIGNED.VARBINARY.VARCHAR.VARCHARACTER.YEAR".split("."), za = /* @__PURE__ */ "ABS.ACOS.ADDDATE.ADDTIME.AES_DECRYPT.AES_ENCRYPT.ANY_VALUE.APPROX_COUNT_DISTINCT.APPROX_COUNT_DISTINCT_ACCUMULATE.APPROX_COUNT_DISTINCT_COMBINE.APPROX_COUNT_DISTINCT_ESTIMATE.APPROX_GEOGRAPHY_INTERSECTS.APPROX_PERCENTILE.ASCII.ASIN.ATAN.ATAN2.AVG.BIN.BINARY.BIT_AND.BIT_COUNT.BIT_OR.BIT_XOR.CAST.CEIL.CEILING.CHAR.CHARACTER_LENGTH.CHAR_LENGTH.CHARSET.COALESCE.COERCIBILITY.COLLATION.COLLECT.CONCAT.CONCAT_WS.CONNECTION_ID.CONV.CONVERT.CONVERT_TZ.COS.COT.COUNT.CUME_DIST.CURDATE.CURRENT_DATE.CURRENT_ROLE.CURRENT_TIME.CURRENT_TIMESTAMP.CURRENT_USER.CURTIME.DATABASE.DATE.DATE_ADD.DATEDIFF.DATE_FORMAT.DATE_SUB.DATE_TRUNC.DAY.DAYNAME.DAYOFMONTH.DAYOFWEEK.DAYOFYEAR.DECODE.DEFAULT.DEGREES.DENSE_RANK.DIV.DOT_PRODUCT.ELT.EUCLIDEAN_DISTANCE.EXP.EXTRACT.FIELD.FIRST.FIRST_VALUE.FLOOR.FORMAT.FOUND_ROWS.FROM_BASE64.FROM_DAYS.FROM_UNIXTIME.GEOGRAPHY_AREA.GEOGRAPHY_CONTAINS.GEOGRAPHY_DISTANCE.GEOGRAPHY_INTERSECTS.GEOGRAPHY_LATITUDE.GEOGRAPHY_LENGTH.GEOGRAPHY_LONGITUDE.GEOGRAPHY_POINT.GEOGRAPHY_WITHIN_DISTANCE.GEOMETRY_AREA.GEOMETRY_CONTAINS.GEOMETRY_DISTANCE.GEOMETRY_FILTER.GEOMETRY_INTERSECTS.GEOMETRY_LENGTH.GEOMETRY_POINT.GEOMETRY_WITHIN_DISTANCE.GEOMETRY_X.GEOMETRY_Y.GREATEST.GROUPING.GROUP_CONCAT.HEX.HIGHLIGHT.HOUR.ICU_VERSION.IF.IFNULL.INET_ATON.INET_NTOA.INET6_ATON.INET6_NTOA.INITCAP.INSERT.INSTR.INTERVAL.IS.IS NULL.JSON_AGG.JSON_ARRAY_CONTAINS_DOUBLE.JSON_ARRAY_CONTAINS_JSON.JSON_ARRAY_CONTAINS_STRING.JSON_ARRAY_PUSH_DOUBLE.JSON_ARRAY_PUSH_JSON.JSON_ARRAY_PUSH_STRING.JSON_DELETE_KEY.JSON_EXTRACT_DOUBLE.JSON_EXTRACT_JSON.JSON_EXTRACT_STRING.JSON_EXTRACT_BIGINT.JSON_GET_TYPE.JSON_LENGTH.JSON_SET_DOUBLE.JSON_SET_JSON.JSON_SET_STRING.JSON_SPLICE_DOUBLE.JSON_SPLICE_JSON.JSON_SPLICE_STRING.LAG.LAST_DAY.LAST_VALUE.LCASE.LEAD.LEAST.LEFT.LENGTH.LIKE.LN.LOCALTIME.LOCALTIMESTAMP.LOCATE.LOG.LOG10.LOG2.LPAD.LTRIM.MATCH.MAX.MD5.MEDIAN.MICROSECOND.MIN.MINUTE.MOD.MONTH.MONTHNAME.MONTHS_BETWEEN.NOT.NOW.NTH_VALUE.NTILE.NULLIF.OCTET_LENGTH.PERCENT_RANK.PERCENTILE_CONT.PERCENTILE_DISC.PI.PIVOT.POSITION.POW.POWER.QUARTER.QUOTE.RADIANS.RAND.RANK.REGEXP.REPEAT.REPLACE.REVERSE.RIGHT.RLIKE.ROUND.ROW_COUNT.ROW_NUMBER.RPAD.RTRIM.SCALAR.SCHEMA.SEC_TO_TIME.SHA1.SHA2.SIGMOID.SIGN.SIN.SLEEP.SPLIT.SOUNDEX.SOUNDS LIKE.SOURCE_POS_WAIT.SPACE.SQRT.STDDEV.STDDEV_POP.STDDEV_SAMP.STR_TO_DATE.SUBDATE.SUBSTR.SUBSTRING.SUBSTRING_INDEX.SUM.SYS_GUID.TAN.TIME.TIMEDIFF.TIME_BUCKET.TIME_FORMAT.TIMESTAMP.TIMESTAMPADD.TIMESTAMPDIFF.TIME_TO_SEC.TO_BASE64.TO_CHAR.TO_DAYS.TO_JSON.TO_NUMBER.TO_SECONDS.TO_TIMESTAMP.TRIM.TRUNC.TRUNCATE.UCASE.UNHEX.UNIX_TIMESTAMP.UPDATEXML.UPPER.UTC_DATE.UTC_TIME.UTC_TIMESTAMP.UUID.VALUES.VARIANCE.VAR_POP.VAR_SAMP.VECTOR_SUB.VERSION.WEEK.WEEKDAY.WEEKOFYEAR.YEAR".split("."), Ba = w(["SELECT [ALL | DISTINCT | DISTINCTROW]"]), Va = w([
	"WITH",
	"FROM",
	"WHERE",
	"GROUP BY",
	"HAVING",
	"PARTITION BY",
	"ORDER BY",
	"LIMIT",
	"OFFSET",
	"INSERT [IGNORE] [INTO]",
	"VALUES",
	"REPLACE [INTO]",
	"ON DUPLICATE KEY UPDATE",
	"SET",
	"CREATE [OR REPLACE] [TEMPORARY] PROCEDURE [IF NOT EXISTS]",
	"CREATE [OR REPLACE] [EXTERNAL] FUNCTION"
]), Ha = w(["CREATE [ROWSTORE] [REFERENCE | TEMPORARY | GLOBAL TEMPORARY] TABLE [IF NOT EXISTS]"]), Ua = w(/* @__PURE__ */ "CREATE VIEW.UPDATE.DELETE [FROM].DROP [TEMPORARY] TABLE [IF EXISTS].ALTER [ONLINE] TABLE.ADD [COLUMN].ADD [UNIQUE] {INDEX | KEY}.DROP [COLUMN].MODIFY [COLUMN].CHANGE.RENAME [TO | AS].TRUNCATE [TABLE].ADD AGGREGATOR.ADD LEAF.AGGREGATOR SET AS MASTER.ALTER DATABASE.ALTER PIPELINE.ALTER RESOURCE POOL.ALTER USER.ALTER VIEW.ANALYZE TABLE.ATTACH DATABASE.ATTACH LEAF.ATTACH LEAF ALL.BACKUP DATABASE.BINLOG.BOOTSTRAP AGGREGATOR.CACHE INDEX.CALL.CHANGE.CHANGE MASTER TO.CHANGE REPLICATION FILTER.CHANGE REPLICATION SOURCE TO.CHECK BLOB CHECKSUM.CHECK TABLE.CHECKSUM TABLE.CLEAR ORPHAN DATABASES.CLONE.COMMIT.CREATE DATABASE.CREATE GROUP.CREATE INDEX.CREATE LINK.CREATE MILESTONE.CREATE PIPELINE.CREATE RESOURCE POOL.CREATE ROLE.CREATE USER.DEALLOCATE PREPARE.DESCRIBE.DETACH DATABASE.DETACH PIPELINE.DROP DATABASE.DROP FUNCTION.DROP INDEX.DROP LINK.DROP PIPELINE.DROP PROCEDURE.DROP RESOURCE POOL.DROP ROLE.DROP USER.DROP VIEW.EXECUTE.EXPLAIN.FLUSH.FORCE.GRANT.HANDLER.HELP.KILL CONNECTION.KILLALL QUERIES.LOAD DATA.LOAD INDEX INTO CACHE.LOAD XML.LOCK INSTANCE FOR BACKUP.LOCK TABLES.MASTER_POS_WAIT.OPTIMIZE TABLE.PREPARE.PURGE BINARY LOGS.REBALANCE PARTITIONS.RELEASE SAVEPOINT.REMOVE AGGREGATOR.REMOVE LEAF.REPAIR TABLE.REPLACE.REPLICATE DATABASE.RESET.RESET MASTER.RESET PERSIST.RESET REPLICA.RESET SLAVE.RESTART.RESTORE DATABASE.RESTORE REDUNDANCY.REVOKE.ROLLBACK.ROLLBACK TO SAVEPOINT.SAVEPOINT.SET CHARACTER SET.SET DEFAULT ROLE.SET NAMES.SET PASSWORD.SET RESOURCE GROUP.SET ROLE.SET TRANSACTION.SHOW.SHOW CHARACTER SET.SHOW COLLATION.SHOW COLUMNS.SHOW CREATE DATABASE.SHOW CREATE FUNCTION.SHOW CREATE PIPELINE.SHOW CREATE PROCEDURE.SHOW CREATE TABLE.SHOW CREATE USER.SHOW CREATE VIEW.SHOW DATABASES.SHOW ENGINE.SHOW ENGINES.SHOW ERRORS.SHOW FUNCTION CODE.SHOW FUNCTION STATUS.SHOW GRANTS.SHOW INDEX.SHOW MASTER STATUS.SHOW OPEN TABLES.SHOW PLUGINS.SHOW PRIVILEGES.SHOW PROCEDURE CODE.SHOW PROCEDURE STATUS.SHOW PROCESSLIST.SHOW PROFILE.SHOW PROFILES.SHOW RELAYLOG EVENTS.SHOW REPLICA STATUS.SHOW REPLICAS.SHOW SLAVE.SHOW SLAVE HOSTS.SHOW STATUS.SHOW TABLE STATUS.SHOW TABLES.SHOW VARIABLES.SHOW WARNINGS.SHUTDOWN.SNAPSHOT DATABASE.SOURCE_POS_WAIT.START GROUP_REPLICATION.START PIPELINE.START REPLICA.START SLAVE.START TRANSACTION.STOP GROUP_REPLICATION.STOP PIPELINE.STOP REPLICA.STOP REPLICATING.STOP SLAVE.TEST PIPELINE.UNLOCK INSTANCE.UNLOCK TABLES.USE.XA.ITERATE.LEAVE.LOOP.REPEAT.RETURN.WHILE".split(".")), Wa = w([
	"UNION [ALL | DISTINCT]",
	"EXCEPT",
	"INTERSECT",
	"MINUS"
]), Ga = w([
	"JOIN",
	"{LEFT | RIGHT | FULL} [OUTER] JOIN",
	"{INNER | CROSS} JOIN",
	"NATURAL {LEFT | RIGHT} [OUTER] JOIN",
	"STRAIGHT_JOIN"
]), Ka = w([
	"ON DELETE",
	"ON UPDATE",
	"CHARACTER SET",
	"{ROWS | RANGE} BETWEEN",
	"IDENTIFIED BY"
]), qa = w([]), Ja = {
	name: "singlestoredb",
	tokenizerOptions: {
		reservedSelect: Ba,
		reservedClauses: [
			...Va,
			...Ha,
			...Ua
		],
		reservedSetOperations: Wa,
		reservedJoins: Ga,
		reservedKeywordPhrases: Ka,
		reservedDataTypePhrases: qa,
		reservedKeywords: La,
		reservedDataTypes: Ra,
		reservedFunctionNames: za,
		stringTypes: [
			"\"\"-qq-bs",
			"''-qq-bs",
			{
				quote: "''-raw",
				prefixes: ["B", "X"],
				requirePrefix: !0
			}
		],
		identTypes: ["``"],
		identChars: {
			first: "$",
			rest: "$",
			allowFirstCharNumber: !0
		},
		variableTypes: [{ regex: "@@?[A-Za-z0-9_$]+" }, {
			quote: "``",
			prefixes: ["@"],
			requirePrefix: !0
		}],
		lineCommentTypes: ["--", "#"],
		operators: [
			":=",
			"&",
			"|",
			"^",
			"~",
			"<<",
			">>",
			"<=>",
			"&&",
			"||",
			"::",
			"::$",
			"::%",
			":>",
			"!:>",
			"*.*"
		],
		postProcess: $n
	},
	formatOptions: {
		alwaysDenseOperators: [
			"::",
			"::$",
			"::%"
		],
		onelineClauses: [...Ha, ...Ua],
		tabularOnelineClauses: Ua
	}
}, Ya = /* @__PURE__ */ "ABS.ACOS.ACOSH.ADD_MONTHS.ALL_USER_NAMES.ANY_VALUE.APPROX_COUNT_DISTINCT.APPROX_PERCENTILE.APPROX_PERCENTILE_ACCUMULATE.APPROX_PERCENTILE_COMBINE.APPROX_PERCENTILE_ESTIMATE.APPROX_TOP_K.APPROX_TOP_K_ACCUMULATE.APPROX_TOP_K_COMBINE.APPROX_TOP_K_ESTIMATE.APPROXIMATE_JACCARD_INDEX.APPROXIMATE_SIMILARITY.ARRAY_AGG.ARRAY_APPEND.ARRAY_CAT.ARRAY_COMPACT.ARRAY_CONSTRUCT.ARRAY_CONSTRUCT_COMPACT.ARRAY_CONTAINS.ARRAY_INSERT.ARRAY_INTERSECTION.ARRAY_POSITION.ARRAY_PREPEND.ARRAY_SIZE.ARRAY_SLICE.ARRAY_TO_STRING.ARRAY_UNION_AGG.ARRAY_UNIQUE_AGG.ARRAYS_OVERLAP.AS_ARRAY.AS_BINARY.AS_BOOLEAN.AS_CHAR.AS_VARCHAR.AS_DATE.AS_DECIMAL.AS_NUMBER.AS_DOUBLE.AS_REAL.AS_INTEGER.AS_OBJECT.AS_TIME.AS_TIMESTAMP_LTZ.AS_TIMESTAMP_NTZ.AS_TIMESTAMP_TZ.ASCII.ASIN.ASINH.ATAN.ATAN2.ATANH.AUTO_REFRESH_REGISTRATION_HISTORY.AUTOMATIC_CLUSTERING_HISTORY.AVG.BASE64_DECODE_BINARY.BASE64_DECODE_STRING.BASE64_ENCODE.BIT_LENGTH.BITAND.BITAND_AGG.BITMAP_BIT_POSITION.BITMAP_BUCKET_NUMBER.BITMAP_CONSTRUCT_AGG.BITMAP_COUNT.BITMAP_OR_AGG.BITNOT.BITOR.BITOR_AGG.BITSHIFTLEFT.BITSHIFTRIGHT.BITXOR.BITXOR_AGG.BOOLAND.BOOLAND_AGG.BOOLNOT.BOOLOR.BOOLOR_AGG.BOOLXOR.BOOLXOR_AGG.BUILD_SCOPED_FILE_URL.BUILD_STAGE_FILE_URL.CASE.CAST.CBRT.CEIL.CHARINDEX.CHECK_JSON.CHECK_XML.CHR.CHAR.COALESCE.COLLATE.COLLATION.COMPLETE_TASK_GRAPHS.COMPRESS.CONCAT.CONCAT_WS.CONDITIONAL_CHANGE_EVENT.CONDITIONAL_TRUE_EVENT.CONTAINS.CONVERT_TIMEZONE.COPY_HISTORY.CORR.COS.COSH.COT.COUNT.COUNT_IF.COVAR_POP.COVAR_SAMP.CUME_DIST.CURRENT_ACCOUNT.CURRENT_AVAILABLE_ROLES.CURRENT_CLIENT.CURRENT_DATABASE.CURRENT_DATE.CURRENT_IP_ADDRESS.CURRENT_REGION.CURRENT_ROLE.CURRENT_SCHEMA.CURRENT_SCHEMAS.CURRENT_SECONDARY_ROLES.CURRENT_SESSION.CURRENT_STATEMENT.CURRENT_TASK_GRAPHS.CURRENT_TIME.CURRENT_TIMESTAMP.CURRENT_TRANSACTION.CURRENT_USER.CURRENT_VERSION.CURRENT_WAREHOUSE.DATA_TRANSFER_HISTORY.DATABASE_REFRESH_HISTORY.DATABASE_REFRESH_PROGRESS.DATABASE_REFRESH_PROGRESS_BY_JOB.DATABASE_STORAGE_USAGE_HISTORY.DATE_FROM_PARTS.DATE_PART.DATE_TRUNC.DATEADD.DATEDIFF.DAYNAME.DECODE.DECOMPRESS_BINARY.DECOMPRESS_STRING.DECRYPT.DECRYPT_RAW.DEGREES.DENSE_RANK.DIV0.EDITDISTANCE.ENCRYPT.ENCRYPT_RAW.ENDSWITH.EQUAL_NULL.EXP.EXPLAIN_JSON.EXTERNAL_FUNCTIONS_HISTORY.EXTERNAL_TABLE_FILES.EXTERNAL_TABLE_FILE_REGISTRATION_HISTORY.EXTRACT.EXTRACT_SEMANTIC_CATEGORIES.FACTORIAL.FILTER.FIRST_VALUE.FLATTEN.FLOOR.GENERATE_COLUMN_DESCRIPTION.GENERATOR.GET.GET_ABSOLUTE_PATH.GET_DDL.GET_IGNORE_CASE.GET_OBJECT_REFERENCES.GET_PATH.GET_PRESIGNED_URL.GET_RELATIVE_PATH.GET_STAGE_LOCATION.GETBIT.GREATEST.GREATEST_IGNORE_NULLS.GROUPING.GROUPING_ID.HASH.HASH_AGG.HAVERSINE.HEX_DECODE_BINARY.HEX_DECODE_STRING.HEX_ENCODE.HLL.HLL_ACCUMULATE.HLL_COMBINE.HLL_ESTIMATE.HLL_EXPORT.HLL_IMPORT.HOUR.MINUTE.SECOND.IDENTIFIER.IFF.IFNULL.ILIKE.ILIKE ANY.INFER_SCHEMA.INITCAP.INSERT.INVOKER_ROLE.INVOKER_SHARE.IS_ARRAY.IS_BINARY.IS_BOOLEAN.IS_CHAR.IS_VARCHAR.IS_DATE.IS_DATE_VALUE.IS_DECIMAL.IS_DOUBLE.IS_REAL.IS_GRANTED_TO_INVOKER_ROLE.IS_INTEGER.IS_NULL_VALUE.IS_OBJECT.IS_ROLE_IN_SESSION.IS_TIME.IS_TIMESTAMP_LTZ.IS_TIMESTAMP_NTZ.IS_TIMESTAMP_TZ.JAROWINKLER_SIMILARITY.JSON_EXTRACT_PATH_TEXT.KURTOSIS.LAG.LAST_DAY.LAST_QUERY_ID.LAST_TRANSACTION.LAST_VALUE.LEAD.LEAST.LEFT.LENGTH.LEN.LIKE.LIKE ALL.LIKE ANY.LISTAGG.LN.LOCALTIME.LOCALTIMESTAMP.LOG.LOGIN_HISTORY.LOGIN_HISTORY_BY_USER.LOWER.LPAD.LTRIM.MATERIALIZED_VIEW_REFRESH_HISTORY.MD5.MD5_HEX.MD5_BINARY.MD5_NUMBER — Obsoleted.MD5_NUMBER_LOWER64.MD5_NUMBER_UPPER64.MEDIAN.MIN.MAX.MINHASH.MINHASH_COMBINE.MOD.MODE.MONTHNAME.MONTHS_BETWEEN.NEXT_DAY.NORMAL.NTH_VALUE.NTILE.NULLIF.NULLIFZERO.NVL.NVL2.OBJECT_AGG.OBJECT_CONSTRUCT.OBJECT_CONSTRUCT_KEEP_NULL.OBJECT_DELETE.OBJECT_INSERT.OBJECT_KEYS.OBJECT_PICK.OCTET_LENGTH.PARSE_IP.PARSE_JSON.PARSE_URL.PARSE_XML.PERCENT_RANK.PERCENTILE_CONT.PERCENTILE_DISC.PI.PIPE_USAGE_HISTORY.POLICY_CONTEXT.POLICY_REFERENCES.POSITION.POW.POWER.PREVIOUS_DAY.QUERY_ACCELERATION_HISTORY.QUERY_HISTORY.QUERY_HISTORY_BY_SESSION.QUERY_HISTORY_BY_USER.QUERY_HISTORY_BY_WAREHOUSE.RADIANS.RANDOM.RANDSTR.RANK.RATIO_TO_REPORT.REGEXP.REGEXP_COUNT.REGEXP_INSTR.REGEXP_LIKE.REGEXP_REPLACE.REGEXP_SUBSTR.REGEXP_SUBSTR_ALL.REGR_AVGX.REGR_AVGY.REGR_COUNT.REGR_INTERCEPT.REGR_R2.REGR_SLOPE.REGR_SXX.REGR_SXY.REGR_SYY.REGR_VALX.REGR_VALY.REPEAT.REPLACE.REPLICATION_GROUP_REFRESH_HISTORY.REPLICATION_GROUP_REFRESH_PROGRESS.REPLICATION_GROUP_REFRESH_PROGRESS_BY_JOB.REPLICATION_GROUP_USAGE_HISTORY.REPLICATION_USAGE_HISTORY.REST_EVENT_HISTORY.RESULT_SCAN.REVERSE.RIGHT.RLIKE.ROUND.ROW_NUMBER.RPAD.RTRIM.RTRIMMED_LENGTH.SEARCH_OPTIMIZATION_HISTORY.SEQ1.SEQ2.SEQ4.SEQ8.SERVERLESS_TASK_HISTORY.SHA1.SHA1_HEX.SHA1_BINARY.SHA2.SHA2_HEX.SHA2_BINARY.SIGN.SIN.SINH.SKEW.SOUNDEX.SPACE.SPLIT.SPLIT_PART.SPLIT_TO_TABLE.SQRT.SQUARE.ST_AREA.ST_ASEWKB.ST_ASEWKT.ST_ASGEOJSON.ST_ASWKB.ST_ASBINARY.ST_ASWKT.ST_ASTEXT.ST_AZIMUTH.ST_CENTROID.ST_COLLECT.ST_CONTAINS.ST_COVEREDBY.ST_COVERS.ST_DIFFERENCE.ST_DIMENSION.ST_DISJOINT.ST_DISTANCE.ST_DWITHIN.ST_ENDPOINT.ST_ENVELOPE.ST_GEOGFROMGEOHASH.ST_GEOGPOINTFROMGEOHASH.ST_GEOGRAPHYFROMWKB.ST_GEOGRAPHYFROMWKT.ST_GEOHASH.ST_GEOMETRYFROMWKB.ST_GEOMETRYFROMWKT.ST_HAUSDORFFDISTANCE.ST_INTERSECTION.ST_INTERSECTS.ST_LENGTH.ST_MAKEGEOMPOINT.ST_GEOM_POINT.ST_MAKELINE.ST_MAKEPOINT.ST_POINT.ST_MAKEPOLYGON.ST_POLYGON.ST_NPOINTS.ST_NUMPOINTS.ST_PERIMETER.ST_POINTN.ST_SETSRID.ST_SIMPLIFY.ST_SRID.ST_STARTPOINT.ST_SYMDIFFERENCE.ST_UNION.ST_WITHIN.ST_X.ST_XMAX.ST_XMIN.ST_Y.ST_YMAX.ST_YMIN.STAGE_DIRECTORY_FILE_REGISTRATION_HISTORY.STAGE_STORAGE_USAGE_HISTORY.STARTSWITH.STDDEV.STDDEV_POP.STDDEV_SAMP.STRIP_NULL_VALUE.STRTOK.STRTOK_SPLIT_TO_TABLE.STRTOK_TO_ARRAY.SUBSTR.SUBSTRING.SUM.SYSDATE.SYSTEM$ABORT_SESSION.SYSTEM$ABORT_TRANSACTION.SYSTEM$AUTHORIZE_PRIVATELINK.SYSTEM$AUTHORIZE_STAGE_PRIVATELINK_ACCESS.SYSTEM$BEHAVIOR_CHANGE_BUNDLE_STATUS.SYSTEM$CANCEL_ALL_QUERIES.SYSTEM$CANCEL_QUERY.SYSTEM$CLUSTERING_DEPTH.SYSTEM$CLUSTERING_INFORMATION.SYSTEM$CLUSTERING_RATIO .SYSTEM$CURRENT_USER_TASK_NAME.SYSTEM$DATABASE_REFRESH_HISTORY .SYSTEM$DATABASE_REFRESH_PROGRESS.SYSTEM$DATABASE_REFRESH_PROGRESS_BY_JOB .SYSTEM$DISABLE_BEHAVIOR_CHANGE_BUNDLE.SYSTEM$DISABLE_DATABASE_REPLICATION.SYSTEM$ENABLE_BEHAVIOR_CHANGE_BUNDLE.SYSTEM$ESTIMATE_QUERY_ACCELERATION.SYSTEM$ESTIMATE_SEARCH_OPTIMIZATION_COSTS.SYSTEM$EXPLAIN_JSON_TO_TEXT.SYSTEM$EXPLAIN_PLAN_JSON.SYSTEM$EXTERNAL_TABLE_PIPE_STATUS.SYSTEM$GENERATE_SAML_CSR.SYSTEM$GENERATE_SCIM_ACCESS_TOKEN.SYSTEM$GET_AWS_SNS_IAM_POLICY.SYSTEM$GET_PREDECESSOR_RETURN_VALUE.SYSTEM$GET_PRIVATELINK.SYSTEM$GET_PRIVATELINK_AUTHORIZED_ENDPOINTS.SYSTEM$GET_PRIVATELINK_CONFIG.SYSTEM$GET_SNOWFLAKE_PLATFORM_INFO.SYSTEM$GET_TAG.SYSTEM$GET_TAG_ALLOWED_VALUES.SYSTEM$GET_TAG_ON_CURRENT_COLUMN.SYSTEM$GET_TAG_ON_CURRENT_TABLE.SYSTEM$GLOBAL_ACCOUNT_SET_PARAMETER.SYSTEM$LAST_CHANGE_COMMIT_TIME.SYSTEM$LINK_ACCOUNT_OBJECTS_BY_NAME.SYSTEM$MIGRATE_SAML_IDP_REGISTRATION.SYSTEM$PIPE_FORCE_RESUME.SYSTEM$PIPE_STATUS.SYSTEM$REVOKE_PRIVATELINK.SYSTEM$REVOKE_STAGE_PRIVATELINK_ACCESS.SYSTEM$SET_RETURN_VALUE.SYSTEM$SHOW_OAUTH_CLIENT_SECRETS.SYSTEM$STREAM_GET_TABLE_TIMESTAMP.SYSTEM$STREAM_HAS_DATA.SYSTEM$TASK_DEPENDENTS_ENABLE.SYSTEM$TYPEOF.SYSTEM$USER_TASK_CANCEL_ONGOING_EXECUTIONS.SYSTEM$VERIFY_EXTERNAL_OAUTH_TOKEN.SYSTEM$WAIT.SYSTEM$WHITELIST.SYSTEM$WHITELIST_PRIVATELINK.TAG_REFERENCES.TAG_REFERENCES_ALL_COLUMNS.TAG_REFERENCES_WITH_LINEAGE.TAN.TANH.TASK_DEPENDENTS.TASK_HISTORY.TIME_FROM_PARTS.TIME_SLICE.TIMEADD.TIMEDIFF.TIMESTAMP_FROM_PARTS.TIMESTAMPADD.TIMESTAMPDIFF.TO_ARRAY.TO_BINARY.TO_BOOLEAN.TO_CHAR.TO_VARCHAR.TO_DATE.DATE.TO_DECIMAL.TO_NUMBER.TO_NUMERIC.TO_DOUBLE.TO_GEOGRAPHY.TO_GEOMETRY.TO_JSON.TO_OBJECT.TO_TIME.TIME.TO_TIMESTAMP.TO_TIMESTAMP_LTZ.TO_TIMESTAMP_NTZ.TO_TIMESTAMP_TZ.TO_VARIANT.TO_XML.TRANSLATE.TRIM.TRUNCATE.TRUNC.TRUNC.TRY_BASE64_DECODE_BINARY.TRY_BASE64_DECODE_STRING.TRY_CAST.TRY_HEX_DECODE_BINARY.TRY_HEX_DECODE_STRING.TRY_PARSE_JSON.TRY_TO_BINARY.TRY_TO_BOOLEAN.TRY_TO_DATE.TRY_TO_DECIMAL.TRY_TO_NUMBER.TRY_TO_NUMERIC.TRY_TO_DOUBLE.TRY_TO_GEOGRAPHY.TRY_TO_GEOMETRY.TRY_TO_TIME.TRY_TO_TIMESTAMP.TRY_TO_TIMESTAMP_LTZ.TRY_TO_TIMESTAMP_NTZ.TRY_TO_TIMESTAMP_TZ.TYPEOF.UNICODE.UNIFORM.UPPER.UUID_STRING.VALIDATE.VALIDATE_PIPE_LOAD.VAR_POP.VAR_SAMP.VARIANCE.VARIANCE_SAMP.VARIANCE_POP.WAREHOUSE_LOAD_HISTORY.WAREHOUSE_METERING_HISTORY.WIDTH_BUCKET.XMLGET.YEAR.YEAROFWEEK.YEAROFWEEKISO.DAY.DAYOFMONTH.DAYOFWEEK.DAYOFWEEKISO.DAYOFYEAR.WEEK.WEEK.WEEKOFYEAR.WEEKISO.MONTH.QUARTER.ZEROIFNULL.ZIPF".split("."), Xa = /* @__PURE__ */ "ACCOUNT.ALL.ALTER.AND.ANY.AS.BETWEEN.BY.CASE.CAST.CHECK.COLUMN.CONNECT.CONNECTION.CONSTRAINT.CREATE.CROSS.CURRENT.CURRENT_DATE.CURRENT_TIME.CURRENT_TIMESTAMP.CURRENT_USER.DATABASE.DELETE.DISTINCT.DROP.ELSE.EXISTS.FALSE.FOLLOWING.FOR.FROM.FULL.GRANT.GROUP.GSCLUSTER.HAVING.ILIKE.IN.INCREMENT.INNER.INSERT.INTERSECT.INTO.IS.ISSUE.JOIN.LATERAL.LEFT.LIKE.LOCALTIME.LOCALTIMESTAMP.MINUS.NATURAL.NOT.NULL.OF.ON.OR.ORDER.ORGANIZATION.QUALIFY.REGEXP.REVOKE.RIGHT.RLIKE.ROW.ROWS.SAMPLE.SCHEMA.SELECT.SET.SOME.START.TABLE.TABLESAMPLE.THEN.TO.TRIGGER.TRUE.TRY_CAST.UNION.UNIQUE.UPDATE.USING.VALUES.VIEW.WHEN.WHENEVER.WHERE.WITH.COMMENT".split("."), Za = /* @__PURE__ */ "NUMBER.DECIMAL.NUMERIC.INT.INTEGER.BIGINT.SMALLINT.TINYINT.BYTEINT.FLOAT.FLOAT4.FLOAT8.DOUBLE.DOUBLE PRECISION.REAL.VARCHAR.CHAR.CHARACTER.STRING.TEXT.BINARY.VARBINARY.BOOLEAN.DATE.DATETIME.TIME.TIMESTAMP.TIMESTAMP_LTZ.TIMESTAMP_NTZ.TIMESTAMP.TIMESTAMP_TZ.VARIANT.OBJECT.ARRAY.GEOGRAPHY.GEOMETRY".split("."), Qa = w(["SELECT [ALL | DISTINCT]"]), $a = w([
	"WITH [RECURSIVE]",
	"FROM",
	"WHERE",
	"GROUP BY",
	"HAVING",
	"PARTITION BY",
	"ORDER BY",
	"QUALIFY",
	"LIMIT",
	"OFFSET",
	"FETCH [FIRST | NEXT]",
	"INSERT [OVERWRITE] [ALL INTO | INTO | ALL | FIRST]",
	"{THEN | ELSE} INTO",
	"VALUES",
	"SET",
	"CLUSTER BY",
	"[WITH] {MASKING POLICY | TAG | ROW ACCESS POLICY}",
	"COPY GRANTS",
	"USING TEMPLATE",
	"MERGE INTO",
	"WHEN MATCHED [AND]",
	"THEN {UPDATE SET | DELETE}",
	"WHEN NOT MATCHED THEN INSERT"
]), eo = w(["CREATE [OR REPLACE] [VOLATILE] TABLE [IF NOT EXISTS]", "CREATE [OR REPLACE] [LOCAL | GLOBAL] {TEMP|TEMPORARY} TABLE [IF NOT EXISTS]"]), to = w(/* @__PURE__ */ "CREATE [OR REPLACE] [SECURE] [RECURSIVE] VIEW [IF NOT EXISTS].UPDATE.DELETE FROM.DROP TABLE [IF EXISTS].ALTER TABLE [IF EXISTS].RENAME TO.SWAP WITH.[SUSPEND | RESUME] RECLUSTER.DROP CLUSTERING KEY.ADD [COLUMN].RENAME COLUMN.{ALTER | MODIFY} [COLUMN].DROP [COLUMN].{ADD | ALTER | MODIFY | DROP} [CONSTRAINT].RENAME CONSTRAINT.{ADD | DROP} SEARCH OPTIMIZATION.{SET | UNSET} TAG.{ADD | DROP} ROW ACCESS POLICY.DROP ALL ROW ACCESS POLICIES.{SET | DROP} DEFAULT.{SET | DROP} NOT NULL.SET DATA TYPE.UNSET COMMENT.{SET | UNSET} MASKING POLICY.TRUNCATE [TABLE] [IF EXISTS].ALTER ACCOUNT.ALTER API INTEGRATION.ALTER CONNECTION.ALTER DATABASE.ALTER EXTERNAL TABLE.ALTER FAILOVER GROUP.ALTER FILE FORMAT.ALTER FUNCTION.ALTER INTEGRATION.ALTER MASKING POLICY.ALTER MATERIALIZED VIEW.ALTER NETWORK POLICY.ALTER NOTIFICATION INTEGRATION.ALTER PIPE.ALTER PROCEDURE.ALTER REPLICATION GROUP.ALTER RESOURCE MONITOR.ALTER ROLE.ALTER ROW ACCESS POLICY.ALTER SCHEMA.ALTER SECURITY INTEGRATION.ALTER SEQUENCE.ALTER SESSION.ALTER SESSION POLICY.ALTER SHARE.ALTER STAGE.ALTER STORAGE INTEGRATION.ALTER STREAM.ALTER TAG.ALTER TASK.ALTER USER.ALTER VIEW.ALTER WAREHOUSE.BEGIN.CALL.COMMIT.COPY INTO.CREATE ACCOUNT.CREATE API INTEGRATION.CREATE CONNECTION.CREATE DATABASE.CREATE EXTERNAL FUNCTION.CREATE EXTERNAL TABLE.CREATE FAILOVER GROUP.CREATE FILE FORMAT.CREATE FUNCTION.CREATE INTEGRATION.CREATE MANAGED ACCOUNT.CREATE MASKING POLICY.CREATE MATERIALIZED VIEW.CREATE NETWORK POLICY.CREATE NOTIFICATION INTEGRATION.CREATE PIPE.CREATE PROCEDURE.CREATE REPLICATION GROUP.CREATE RESOURCE MONITOR.CREATE ROLE.CREATE ROW ACCESS POLICY.CREATE SCHEMA.CREATE SECURITY INTEGRATION.CREATE SEQUENCE.CREATE SESSION POLICY.CREATE SHARE.CREATE STAGE.CREATE STORAGE INTEGRATION.CREATE STREAM.CREATE TAG.CREATE TASK.CREATE USER.CREATE WAREHOUSE.DELETE.DESCRIBE DATABASE.DESCRIBE EXTERNAL TABLE.DESCRIBE FILE FORMAT.DESCRIBE FUNCTION.DESCRIBE INTEGRATION.DESCRIBE MASKING POLICY.DESCRIBE MATERIALIZED VIEW.DESCRIBE NETWORK POLICY.DESCRIBE PIPE.DESCRIBE PROCEDURE.DESCRIBE RESULT.DESCRIBE ROW ACCESS POLICY.DESCRIBE SCHEMA.DESCRIBE SEQUENCE.DESCRIBE SESSION POLICY.DESCRIBE SHARE.DESCRIBE STAGE.DESCRIBE STREAM.DESCRIBE TABLE.DESCRIBE TASK.DESCRIBE TRANSACTION.DESCRIBE USER.DESCRIBE VIEW.DESCRIBE WAREHOUSE.DROP CONNECTION.DROP DATABASE.DROP EXTERNAL TABLE.DROP FAILOVER GROUP.DROP FILE FORMAT.DROP FUNCTION.DROP INTEGRATION.DROP MANAGED ACCOUNT.DROP MASKING POLICY.DROP MATERIALIZED VIEW.DROP NETWORK POLICY.DROP PIPE.DROP PROCEDURE.DROP REPLICATION GROUP.DROP RESOURCE MONITOR.DROP ROLE.DROP ROW ACCESS POLICY.DROP SCHEMA.DROP SEQUENCE.DROP SESSION POLICY.DROP SHARE.DROP STAGE.DROP STREAM.DROP TAG.DROP TASK.DROP USER.DROP VIEW.DROP WAREHOUSE.EXECUTE IMMEDIATE.EXECUTE TASK.EXPLAIN.GET.GRANT OWNERSHIP.GRANT ROLE.INSERT.LIST.MERGE.PUT.REMOVE.REVOKE ROLE.ROLLBACK.SHOW COLUMNS.SHOW CONNECTIONS.SHOW DATABASES.SHOW DATABASES IN FAILOVER GROUP.SHOW DATABASES IN REPLICATION GROUP.SHOW DELEGATED AUTHORIZATIONS.SHOW EXTERNAL FUNCTIONS.SHOW EXTERNAL TABLES.SHOW FAILOVER GROUPS.SHOW FILE FORMATS.SHOW FUNCTIONS.SHOW GLOBAL ACCOUNTS.SHOW GRANTS.SHOW INTEGRATIONS.SHOW LOCKS.SHOW MANAGED ACCOUNTS.SHOW MASKING POLICIES.SHOW MATERIALIZED VIEWS.SHOW NETWORK POLICIES.SHOW OBJECTS.SHOW ORGANIZATION ACCOUNTS.SHOW PARAMETERS.SHOW PIPES.SHOW PRIMARY KEYS.SHOW PROCEDURES.SHOW REGIONS.SHOW REPLICATION ACCOUNTS.SHOW REPLICATION DATABASES.SHOW REPLICATION GROUPS.SHOW RESOURCE MONITORS.SHOW ROLES.SHOW ROW ACCESS POLICIES.SHOW SCHEMAS.SHOW SEQUENCES.SHOW SESSION POLICIES.SHOW SHARES.SHOW SHARES IN FAILOVER GROUP.SHOW SHARES IN REPLICATION GROUP.SHOW STAGES.SHOW STREAMS.SHOW TABLES.SHOW TAGS.SHOW TASKS.SHOW TRANSACTIONS.SHOW USER FUNCTIONS.SHOW USERS.SHOW VARIABLES.SHOW VIEWS.SHOW WAREHOUSES.TRUNCATE MATERIALIZED VIEW.UNDROP DATABASE.UNDROP SCHEMA.UNDROP TABLE.UNDROP TAG.UNSET.USE DATABASE.USE ROLE.USE SCHEMA.USE SECONDARY ROLES.USE WAREHOUSE".split(".")), no = w([
	"UNION [ALL]",
	"MINUS",
	"EXCEPT",
	"INTERSECT"
]), ro = w([
	"[INNER] JOIN",
	"[NATURAL] {LEFT | RIGHT | FULL} [OUTER] JOIN",
	"{CROSS | NATURAL} JOIN"
]), io = w(["{ROWS | RANGE} BETWEEN", "ON {UPDATE | DELETE} [SET NULL | SET DEFAULT]"]), ao = w([]), oo = {
	name: "snowflake",
	tokenizerOptions: {
		reservedSelect: Qa,
		reservedClauses: [
			...$a,
			...eo,
			...to
		],
		reservedSetOperations: no,
		reservedJoins: ro,
		reservedKeywordPhrases: io,
		reservedDataTypePhrases: ao,
		reservedKeywords: Xa,
		reservedDataTypes: Za,
		reservedFunctionNames: Ya,
		stringTypes: ["$$", "''-qq-bs"],
		identTypes: ["\"\"-qq"],
		variableTypes: [{ regex: "[$][1-9]\\d*" }, { regex: "[$][_a-zA-Z][_a-zA-Z0-9$]*" }],
		extraParens: ["[]"],
		identChars: { rest: "$" },
		lineCommentTypes: ["--", "//"],
		operators: [
			"%",
			"::",
			"||",
			"=>",
			":=",
			"->"
		],
		propertyAccessOperators: [":"]
	},
	formatOptions: {
		alwaysDenseOperators: ["::"],
		onelineClauses: [...eo, ...to],
		tabularOnelineClauses: to
	}
}, so = /* @__PURE__ */ s({
	bigquery: () => Bt,
	clickhouse: () => nn,
	db2: () => gn,
	db2i: () => On,
	duckdb: () => Bn,
	hive: () => Qn,
	mariadb: () => dr,
	mysql: () => Cr,
	n1ql: () => Kr,
	plsql: () => ii,
	postgresql: () => _i,
	redshift: () => ki,
	singlestoredb: () => Ja,
	snowflake: () => oo,
	spark: () => Vi,
	sql: () => fa,
	sqlite: () => ea,
	tidb: () => Fr,
	transactsql: () => Ia,
	trino: () => wa
}), A = (e) => e[e.length - 1], co = (e) => e.sort((e, t) => t.length - e.length || e.localeCompare(t)), lo = (e) => e.replace(/\s+/gu, " "), uo = (e) => /\n/.test(e), j = (e) => e.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), fo = /\s+/uy, M = (e) => RegExp(`(?:${e})`, "uy"), po = (e) => e.split("").map((e) => / /gu.test(e) ? "\\s+" : `[${e.toUpperCase()}${e.toLowerCase()}]`).join(""), mo = (e) => e + "(?:-" + e + ")*", ho = ({ prefixes: e, requirePrefix: t }) => `(?:${e.map(po).join("|")}${t ? "" : "|"})`, go = (e) => RegExp(`(?:${e.map(j).join("|")}).*?(?=\r\n|\r|\n|$)`, "uy"), _o = (e, t = []) => {
	let n = e === "open" ? 0 : 1;
	return M(["()", ...t].map((e) => e[n]).map(j).join("|"));
}, vo = (e) => M(`${co(e).map(j).join("|")}`), yo = ({ rest: e, dashes: t }) => e || t ? `(?![${e || ""}${t ? "-" : ""}])` : "", N = (e, t = {}) => {
	if (e.length === 0) return /^\b$/u;
	let n = yo(t), r = co(e).map(j).join("|").replace(/ /gu, "\\s+");
	return RegExp(`(?:${r})${n}\\b`, "iuy");
}, bo = (e, t) => e.length ? M(`(?:${e.map(j).join("|")})(?:${t})`) : void 0, xo = {
	"``": "(?:`[^`]*`)+",
	"[]": String.raw`(?:\[[^\]]*\])(?:\][^\]]*\])*`,
	"\"\"-qq": String.raw`(?:"[^"]*")+`,
	"\"\"-bs": String.raw`(?:"[^"\\]*(?:\\.[^"\\]*)*")`,
	"\"\"-qq-bs": String.raw`(?:"[^"\\]*(?:\\.[^"\\]*)*")+`,
	"\"\"-raw": String.raw`(?:"[^"]*")`,
	"''-qq": String.raw`(?:'[^']*')+`,
	"''-bs": String.raw`(?:'[^'\\]*(?:\\.[^'\\]*)*')`,
	"''-qq-bs": String.raw`(?:'[^'\\]*(?:\\.[^'\\]*)*')+`,
	"''-raw": String.raw`(?:'[^']*')`,
	$$: String.raw`(?<tag>\$\w*\$)[\s\S]*?\k<tag>`,
	"'''..'''": String.raw`'''[^\\]*?(?:\\.[^\\]*?)*?'''`,
	"\"\"\"..\"\"\"": String.raw`"""[^\\]*?(?:\\.[^\\]*?)*?"""`,
	"{}": String.raw`(?:\{[^\}]*\})`,
	"q''": (() => {
		let e = {
			"<": ">",
			"[": "]",
			"(": ")",
			"{": "}"
		}, t = Object.entries(e).map(([e, t]) => "{left}(?:(?!{right}').)*?{right}".replace(/{left}/g, j(e)).replace(/{right}/g, j(t))), n = j(Object.keys(e).join(""));
		return `[Qq]'(?:${String.raw`(?<tag>[^\s${n}])(?:(?!\k<tag>').)*?\k<tag>`}|${t.join("|")})'`;
	})()
}, So = (e) => typeof e == "string" ? xo[e] : "regex" in e ? e.regex : ho(e) + xo[e.quote], Co = (e) => M(e.map((e) => "regex" in e ? e.regex : So(e)).join("|")), wo = (e) => e.map(So).join("|"), To = (e) => M(wo(e)), Eo = (e = {}) => M(Do(e)), Do = ({ first: e, rest: t, dashes: n, allowFirstCharNumber: r } = {}) => {
	let i = "\\p{Alphabetic}\\p{Mark}_", a = "\\p{Decimal_Number}", o = j(e ?? ""), s = j(t ?? ""), c = r ? `[${i}${a}${o}][${i}${a}${s}]*` : `[${i}${o}][${i}${a}${s}]*`;
	return n ? mo(c) : c;
};
//#endregion
//#region node_modules/sql-formatter/dist/esm/lexer/lineColFromIndex.js
function Oo(e, t) {
	let n = e.slice(0, t).split(/\n/);
	return {
		line: n.length,
		col: n[n.length - 1].length + 1
	};
}
//#endregion
//#region node_modules/sql-formatter/dist/esm/lexer/TokenizerEngine.js
var ko = class {
	constructor(e, t) {
		this.rules = e, this.dialectName = t, this.input = "", this.index = 0;
	}
	tokenize(e) {
		this.input = e, this.index = 0;
		let t = [], n;
		for (; this.index < this.input.length;) {
			let e = this.getWhitespace();
			if (this.index < this.input.length) {
				if (n = this.getNextToken(), !n) throw this.createParseError();
				t.push(Object.assign(Object.assign({}, n), { precedingWhitespace: e }));
			}
		}
		return t;
	}
	createParseError() {
		let e = this.input.slice(this.index, this.index + 10), { line: t, col: n } = Oo(this.input, this.index);
		return /* @__PURE__ */ Error(`Parse error: Unexpected "${e}" at line ${t} column ${n}.\n${this.dialectInfo()}`);
	}
	dialectInfo() {
		return this.dialectName === "sql" ? "This likely happens because you're using the default \"sql\" dialect.\nIf possible, please select a more specific dialect (like sqlite, postgresql, etc)." : `SQL dialect used: "${this.dialectName}".`;
	}
	getWhitespace() {
		fo.lastIndex = this.index;
		let e = fo.exec(this.input);
		if (e) return this.index += e[0].length, e[0];
	}
	getNextToken() {
		for (let e of this.rules) {
			let t = this.match(e);
			if (t) return t;
		}
	}
	match(e) {
		e.regex.lastIndex = this.index;
		let t = e.regex.exec(this.input);
		if (t) {
			let n = t[0], r = {
				type: e.type,
				raw: n,
				text: e.text ? e.text(n) : n,
				start: this.index
			};
			return e.key && (r.key = e.key(n)), this.index += n.length, r;
		}
	}
}, Ao = /\/\*/uy, jo = /[\s\S]/uy, Mo = /\*\//uy, No = class {
	constructor() {
		this.lastIndex = 0;
	}
	exec(e) {
		let t = "", n, r = 0;
		if (n = this.matchSection(Ao, e)) t += n, r++;
		else return null;
		for (; r > 0;) if (n = this.matchSection(Ao, e)) t += n, r++;
		else if (n = this.matchSection(Mo, e)) t += n, r--;
		else if (n = this.matchSection(jo, e)) t += n;
		else return null;
		return [t];
	}
	matchSection(e, t) {
		e.lastIndex = this.lastIndex;
		let n = e.exec(t);
		return n && (this.lastIndex += n[0].length), n ? n[0] : null;
	}
}, Po = class {
	constructor(e, t) {
		this.cfg = e, this.dialectName = t, this.rulesBeforeParams = this.buildRulesBeforeParams(e), this.rulesAfterParams = this.buildRulesAfterParams(e);
	}
	tokenize(e, t) {
		let n = new ko([
			...this.rulesBeforeParams,
			...this.buildParamRules(this.cfg, t),
			...this.rulesAfterParams
		], this.dialectName).tokenize(e);
		return this.cfg.postProcess ? this.cfg.postProcess(n) : n;
	}
	buildRulesBeforeParams(e) {
		return this.validRules([
			{
				type: E.DISABLE_COMMENT,
				regex: /(\/\* *sql-formatter-disable *\*\/[\s\S]*?(?:\/\* *sql-formatter-enable *\*\/|$))/uy
			},
			{
				type: E.BLOCK_COMMENT,
				regex: e.nestedBlockComments ? new No() : /(\/\*[^]*?\*\/)/uy
			},
			{
				type: E.LINE_COMMENT,
				regex: go(e.lineCommentTypes ?? ["--"])
			},
			{
				type: E.QUOTED_IDENTIFIER,
				regex: To(e.identTypes)
			},
			{
				type: E.NUMBER,
				regex: e.underscoresInNumbers ? /(?:0x[0-9a-fA-F_]+|0b[01_]+|(?:-\s*)?(?:[0-9_]*\.[0-9_]+|[0-9_]+(?:\.[0-9_]*)?)(?:[eE][-+]?[0-9_]+(?:\.[0-9_]+)?)?)(?![\w\p{Alphabetic}])/uy : /(?:0x[0-9a-fA-F]+|0b[01]+|(?:-\s*)?(?:[0-9]*\.[0-9]+|[0-9]+(?:\.[0-9]*)?)(?:[eE][-+]?[0-9]+(?:\.[0-9]+)?)?)(?![\w\p{Alphabetic}])/uy
			},
			{
				type: E.RESERVED_KEYWORD_PHRASE,
				regex: N(e.reservedKeywordPhrases ?? [], e.identChars),
				text: P
			},
			{
				type: E.RESERVED_DATA_TYPE_PHRASE,
				regex: N(e.reservedDataTypePhrases ?? [], e.identChars),
				text: P
			},
			{
				type: E.CASE,
				regex: /CASE\b/iuy,
				text: P
			},
			{
				type: E.END,
				regex: /END\b/iuy,
				text: P
			},
			{
				type: E.BETWEEN,
				regex: /BETWEEN\b/iuy,
				text: P
			},
			{
				type: E.LIMIT,
				regex: e.reservedClauses.includes("LIMIT") ? /LIMIT\b/iuy : void 0,
				text: P
			},
			{
				type: E.RESERVED_CLAUSE,
				regex: N(e.reservedClauses, e.identChars),
				text: P
			},
			{
				type: E.RESERVED_SELECT,
				regex: N(e.reservedSelect, e.identChars),
				text: P
			},
			{
				type: E.RESERVED_SET_OPERATION,
				regex: N(e.reservedSetOperations, e.identChars),
				text: P
			},
			{
				type: E.WHEN,
				regex: /WHEN\b/iuy,
				text: P
			},
			{
				type: E.ELSE,
				regex: /ELSE\b/iuy,
				text: P
			},
			{
				type: E.THEN,
				regex: /THEN\b/iuy,
				text: P
			},
			{
				type: E.RESERVED_JOIN,
				regex: N(e.reservedJoins, e.identChars),
				text: P
			},
			{
				type: E.AND,
				regex: /AND\b/iuy,
				text: P
			},
			{
				type: E.OR,
				regex: /OR\b/iuy,
				text: P
			},
			{
				type: E.XOR,
				regex: e.supportsXor ? /XOR\b/iuy : void 0,
				text: P
			},
			...e.operatorKeyword ? [{
				type: E.OPERATOR,
				regex: /OPERATOR *\([^)]+\)/iuy
			}] : [],
			{
				type: E.RESERVED_FUNCTION_NAME,
				regex: N(e.reservedFunctionNames, e.identChars),
				text: P
			},
			{
				type: E.RESERVED_DATA_TYPE,
				regex: N(e.reservedDataTypes, e.identChars),
				text: P
			},
			{
				type: E.RESERVED_KEYWORD,
				regex: N(e.reservedKeywords, e.identChars),
				text: P
			}
		]);
	}
	buildRulesAfterParams(e) {
		return this.validRules([
			{
				type: E.VARIABLE,
				regex: e.variableTypes ? Co(e.variableTypes) : void 0
			},
			{
				type: E.STRING,
				regex: To(e.stringTypes)
			},
			{
				type: E.IDENTIFIER,
				regex: Eo(e.identChars)
			},
			{
				type: E.DELIMITER,
				regex: /[;]/uy
			},
			{
				type: E.COMMA,
				regex: /[,]/y
			},
			{
				type: E.OPEN_PAREN,
				regex: _o("open", e.extraParens)
			},
			{
				type: E.CLOSE_PAREN,
				regex: _o("close", e.extraParens)
			},
			{
				type: E.OPERATOR,
				regex: vo([
					"+",
					"-",
					"/",
					">",
					"<",
					"=",
					"<>",
					"<=",
					">=",
					"!=",
					...e.operators ?? []
				])
			},
			{
				type: E.ASTERISK,
				regex: /[*]/uy
			},
			{
				type: E.PROPERTY_ACCESS_OPERATOR,
				regex: vo([".", ...e.propertyAccessOperators ?? []])
			}
		]);
	}
	buildParamRules(e, t) {
		let n = {
			named: t?.named || e.paramTypes?.named || [],
			quoted: t?.quoted || e.paramTypes?.quoted || [],
			numbered: t?.numbered || e.paramTypes?.numbered || [],
			positional: typeof t?.positional == "boolean" ? t.positional : e.paramTypes?.positional,
			custom: t?.custom || e.paramTypes?.custom || []
		};
		return this.validRules([
			{
				type: E.NAMED_PARAMETER,
				regex: bo(n.named, Do(e.paramChars || e.identChars)),
				key: (e) => e.slice(1)
			},
			{
				type: E.QUOTED_PARAMETER,
				regex: bo(n.quoted, wo(e.identTypes)),
				key: (e) => (({ tokenKey: e, quoteChar: t }) => e.replace(new RegExp(j("\\" + t), "gu"), t))({
					tokenKey: e.slice(2, -1),
					quoteChar: e.slice(-1)
				})
			},
			{
				type: E.NUMBERED_PARAMETER,
				regex: bo(n.numbered, "[0-9]+"),
				key: (e) => e.slice(1)
			},
			{
				type: E.POSITIONAL_PARAMETER,
				regex: n.positional ? /[?]/y : void 0
			},
			...n.custom.map((e) => ({
				type: E.CUSTOM_PARAMETER,
				regex: M(e.regex),
				key: e.key ?? ((e) => e)
			}))
		]);
	}
	validRules(e) {
		return e.filter((e) => !!e.regex);
	}
}, P = (e) => lo(e.toUpperCase()), Fo = /* @__PURE__ */ new Map(), Io = (e) => {
	let t = Fo.get(e);
	return t || (t = Lo(e), Fo.set(e, t)), t;
}, Lo = (e) => ({
	tokenizer: new Po(e.tokenizerOptions, e.name),
	formatOptions: Ro(e)
}), Ro = ({ tokenizerOptions: e, formatOptions: t }) => ({
	alwaysDenseOperators: t.alwaysDenseOperators || [],
	onelineClauses: Object.fromEntries(t.onelineClauses.map((e) => [e, !0])),
	tabularOnelineClauses: Object.fromEntries((t.tabularOnelineClauses ?? t.onelineClauses).map((e) => [e, !0])),
	identifierDashes: !!e.identChars?.dashes
});
//#endregion
//#region node_modules/sql-formatter/dist/esm/formatter/config.js
function zo(e) {
	return e.indentStyle === "tabularLeft" || e.indentStyle === "tabularRight" ? " ".repeat(10) : e.useTabs ? "	" : " ".repeat(e.tabWidth);
}
function F(e) {
	return e.indentStyle === "tabularLeft" || e.indentStyle === "tabularRight";
}
//#endregion
//#region node_modules/sql-formatter/dist/esm/formatter/Params.js
var Bo = class {
	constructor(e) {
		this.params = e, this.index = 0;
	}
	get({ key: e, text: t }) {
		return this.params ? e ? this.params[e] : this.params[this.index++] : t;
	}
	getPositionalParameterIndex() {
		return this.index;
	}
	setPositionalParameterIndex(e) {
		this.index = e;
	}
}, Vo = /* @__PURE__ */ l((/* @__PURE__ */ o(((e, t) => {
	(function(e, n) {
		typeof t == "object" && t.exports ? t.exports = n() : e.nearley = n();
	})(e, function() {
		function e(t, n, r) {
			return this.id = ++e.highestId, this.name = t, this.symbols = n, this.postprocess = r, this;
		}
		e.highestId = 0, e.prototype.toString = function(e) {
			var t = e === void 0 ? this.symbols.map(s).join(" ") : this.symbols.slice(0, e).map(s).join(" ") + " ● " + this.symbols.slice(e).map(s).join(" ");
			return this.name + " → " + t;
		};
		function t(e, t, n, r) {
			this.rule = e, this.dot = t, this.reference = n, this.data = [], this.wantedBy = r, this.isComplete = this.dot === e.symbols.length;
		}
		t.prototype.toString = function() {
			return "{" + this.rule.toString(this.dot) + "}, from: " + (this.reference || 0);
		}, t.prototype.nextState = function(e) {
			var n = new t(this.rule, this.dot + 1, this.reference, this.wantedBy);
			return n.left = this, n.right = e, n.isComplete && (n.data = n.build(), n.right = void 0), n;
		}, t.prototype.build = function() {
			var e = [], t = this;
			do
				e.push(t.right.data), t = t.left;
			while (t.left);
			return e.reverse(), e;
		}, t.prototype.finish = function() {
			this.rule.postprocess && (this.data = this.rule.postprocess(this.data, this.reference, a.fail));
		};
		function n(e, t) {
			this.grammar = e, this.index = t, this.states = [], this.wants = {}, this.scannable = [], this.completed = {};
		}
		n.prototype.process = function(e) {
			for (var t = this.states, n = this.wants, r = this.completed, i = 0; i < t.length; i++) {
				var o = t[i];
				if (o.isComplete) {
					if (o.finish(), o.data !== a.fail) {
						for (var s = o.wantedBy, c = s.length; c--;) {
							var l = s[c];
							this.complete(l, o);
						}
						if (o.reference === this.index) {
							var u = o.rule.name;
							(this.completed[u] = this.completed[u] || []).push(o);
						}
					}
				} else {
					var u = o.rule.symbols[o.dot];
					if (typeof u != "string") {
						this.scannable.push(o);
						continue;
					}
					if (n[u]) {
						if (n[u].push(o), r.hasOwnProperty(u)) for (var d = r[u], c = 0; c < d.length; c++) {
							var f = d[c];
							this.complete(o, f);
						}
					} else n[u] = [o], this.predict(u);
				}
			}
		}, n.prototype.predict = function(e) {
			for (var n = this.grammar.byName[e] || [], r = 0; r < n.length; r++) {
				var i = n[r], a = this.wants[e], o = new t(i, 0, this.index, a);
				this.states.push(o);
			}
		}, n.prototype.complete = function(e, t) {
			var n = e.nextState(t);
			this.states.push(n);
		};
		function r(e, t) {
			this.rules = e, this.start = t || this.rules[0].name;
			var n = this.byName = {};
			this.rules.forEach(function(e) {
				n.hasOwnProperty(e.name) || (n[e.name] = []), n[e.name].push(e);
			});
		}
		r.fromCompiled = function(t, n) {
			var i = t.Lexer;
			t.ParserStart && (n = t.ParserStart, t = t.ParserRules);
			var t = t.map(function(t) {
				return new e(t.name, t.symbols, t.postprocess);
			}), a = new r(t, n);
			return a.lexer = i, a;
		};
		function i() {
			this.reset("");
		}
		i.prototype.reset = function(e, t) {
			this.buffer = e, this.index = 0, this.line = t ? t.line : 1, this.lastLineBreak = t ? -t.col : 0;
		}, i.prototype.next = function() {
			if (this.index < this.buffer.length) {
				var e = this.buffer[this.index++];
				return e === "\n" && (this.line += 1, this.lastLineBreak = this.index), { value: e };
			}
		}, i.prototype.save = function() {
			return {
				line: this.line,
				col: this.index - this.lastLineBreak
			};
		}, i.prototype.formatError = function(e, t) {
			var n = this.buffer;
			if (typeof n == "string") {
				var r = n.split("\n").slice(Math.max(0, this.line - 5), this.line), i = n.indexOf("\n", this.index);
				i === -1 && (i = n.length);
				var a = this.index - this.lastLineBreak, o = String(this.line).length;
				return t += " at line " + this.line + " col " + a + ":\n\n", t += r.map(function(e, t) {
					return s(this.line - r.length + t + 1, o) + " " + e;
				}, this).join("\n"), t += "\n" + s("", o + a) + "^\n", t;
			}
			return t + " at index " + (this.index - 1);
			function s(e, t) {
				var n = String(e);
				return Array(t - n.length + 1).join(" ") + n;
			}
		};
		function a(e, t, a) {
			if (e instanceof r) var o = e, a = t;
			else var o = r.fromCompiled(e, t);
			for (var s in this.grammar = o, this.options = {
				keepHistory: !1,
				lexer: o.lexer || new i()
			}, a || {}) this.options[s] = a[s];
			this.lexer = this.options.lexer, this.lexerState = void 0;
			var c = new n(o, 0);
			this.table = [c], c.wants[o.start] = [], c.predict(o.start), c.process(), this.current = 0;
		}
		a.fail = {}, a.prototype.feed = function(e) {
			var t = this.lexer;
			t.reset(e, this.lexerState);
			for (var r;;) {
				try {
					if (r = t.next(), !r) break;
				} catch (e) {
					var a = new n(this.grammar, this.current + 1);
					this.table.push(a);
					var o = Error(this.reportLexerError(e));
					throw o.offset = this.current, o.token = e.token, o;
				}
				var s = this.table[this.current];
				this.options.keepHistory || delete this.table[this.current - 1];
				var c = this.current + 1, a = new n(this.grammar, c);
				this.table.push(a);
				for (var l = r.text === void 0 ? r.value : r.text, u = t.constructor === i ? r.value : r, d = s.scannable, f = d.length; f--;) {
					var p = d[f], m = p.rule.symbols[p.dot];
					if (m.test ? m.test(u) : m.type ? m.type === r.type : m.literal === l) {
						var h = p.nextState({
							data: u,
							token: r,
							isToken: !0,
							reference: c - 1
						});
						a.states.push(h);
					}
				}
				if (a.process(), a.states.length === 0) {
					var o = Error(this.reportError(r));
					throw o.offset = this.current, o.token = r, o;
				}
				this.options.keepHistory && (s.lexerState = t.save()), this.current++;
			}
			return s && (this.lexerState = t.save()), this.results = this.finish(), this;
		}, a.prototype.reportLexerError = function(e) {
			var t, n, r = e.token;
			return r ? (t = "input " + JSON.stringify(r.text[0]) + " (lexer error)", n = this.lexer.formatError(r, "Syntax error")) : (t = "input (lexer error)", n = e.message), this.reportErrorCommon(n, t);
		}, a.prototype.reportError = function(e) {
			var t = (e.type ? e.type + " token: " : "") + JSON.stringify(e.value === void 0 ? e : e.value), n = this.lexer.formatError(e, "Syntax error");
			return this.reportErrorCommon(n, t);
		}, a.prototype.reportErrorCommon = function(e, t) {
			var n = [];
			n.push(e);
			var r = this.table.length - 2, i = this.table[r], a = i.states.filter(function(e) {
				var t = e.rule.symbols[e.dot];
				return t && typeof t != "string";
			});
			return a.length === 0 ? (n.push("Unexpected " + t + ". I did not expect any more input. Here is the state of my parse table:\n"), this.displayStateStack(i.states, n)) : (n.push("Unexpected " + t + ". Instead, I was expecting to see one of the following:\n"), a.map(function(e) {
				return this.buildFirstStateStack(e, []) || [e];
			}, this).forEach(function(e) {
				var t = e[0], r = t.rule.symbols[t.dot], i = this.getSymbolDisplay(r);
				n.push("A " + i + " based on:"), this.displayStateStack(e, n);
			}, this)), n.push(""), n.join("\n");
		}, a.prototype.displayStateStack = function(e, t) {
			for (var n, r = 0, i = 0; i < e.length; i++) {
				var a = e[i], o = a.rule.toString(a.dot);
				o === n ? r++ : (r > 0 && t.push("    ^ " + r + " more lines identical to this"), r = 0, t.push("    " + o)), n = o;
			}
		}, a.prototype.getSymbolDisplay = function(e) {
			return o(e);
		}, a.prototype.buildFirstStateStack = function(e, t) {
			if (t.indexOf(e) !== -1) return null;
			if (e.wantedBy.length === 0) return [e];
			var n = e.wantedBy[0], r = [e].concat(t), i = this.buildFirstStateStack(n, r);
			return i === null ? null : [e].concat(i);
		}, a.prototype.save = function() {
			var e = this.table[this.current];
			return e.lexerState = this.lexerState, e;
		}, a.prototype.restore = function(e) {
			var t = e.index;
			this.current = t, this.table[t] = e, this.table.splice(t + 1), this.lexerState = e.lexerState, this.results = this.finish();
		}, a.prototype.rewind = function(e) {
			if (!this.options.keepHistory) throw Error("set option `keepHistory` to enable rewinding");
			this.restore(this.table[e]);
		}, a.prototype.finish = function() {
			var e = [], t = this.grammar.start;
			return this.table[this.table.length - 1].states.forEach(function(n) {
				n.rule.name === t && n.dot === n.rule.symbols.length && n.reference === 0 && n.data !== a.fail && e.push(n);
			}), e.map(function(e) {
				return e.data;
			});
		};
		function o(e) {
			var t = typeof e;
			if (t === "string") return e;
			if (t === "object") {
				if (e.literal) return JSON.stringify(e.literal);
				if (e instanceof RegExp) return "character matching " + e;
				if (e.type) return e.type + " token";
				if (e.test) return "token matching " + String(e.test);
				throw Error("Unknown symbol type: " + e);
			}
		}
		function s(e) {
			var t = typeof e;
			if (t === "string") return e;
			if (t === "object") {
				if (e.literal) return JSON.stringify(e.literal);
				if (e instanceof RegExp) return e.toString();
				if (e.type) return "%" + e.type;
				if (e.test) return "<" + String(e.test) + ">";
				throw Error("Unknown symbol type: " + e);
			}
		}
		return {
			Parser: a,
			Grammar: r,
			Rule: e
		};
	});
})))(), 1);
function Ho(e) {
	return e.map(Uo).map(Wo).map(Go).map(Ko).map(qo);
}
var Uo = (e, t, n) => {
	if (Dt(e.type)) {
		let r = Jo(n, t);
		if (r && r.type === E.PROPERTY_ACCESS_OPERATOR) return Object.assign(Object.assign({}, e), {
			type: E.IDENTIFIER,
			text: e.raw
		});
		let i = I(n, t);
		if (i && i.type === E.PROPERTY_ACCESS_OPERATOR) return Object.assign(Object.assign({}, e), {
			type: E.IDENTIFIER,
			text: e.raw
		});
	}
	return e;
}, Wo = (e, t, n) => {
	if (e.type === E.RESERVED_FUNCTION_NAME) {
		let r = I(n, t);
		if (!r || !Yo(r)) return Object.assign(Object.assign({}, e), {
			type: E.IDENTIFIER,
			text: e.raw
		});
	}
	return e;
}, Go = (e, t, n) => {
	if (e.type === E.RESERVED_DATA_TYPE) {
		let r = I(n, t);
		if (r && Yo(r)) return Object.assign(Object.assign({}, e), { type: E.RESERVED_PARAMETERIZED_DATA_TYPE });
	}
	return e;
}, Ko = (e, t, n) => {
	if (e.type === E.IDENTIFIER) {
		let r = I(n, t);
		if (r && Xo(r)) return Object.assign(Object.assign({}, e), { type: E.ARRAY_IDENTIFIER });
	}
	return e;
}, qo = (e, t, n) => {
	if (e.type === E.RESERVED_DATA_TYPE) {
		let r = I(n, t);
		if (r && Xo(r)) return Object.assign(Object.assign({}, e), { type: E.ARRAY_KEYWORD });
	}
	return e;
}, Jo = (e, t) => I(e, t, -1), I = (e, t, n = 1) => {
	let r = 1;
	for (; e[t + r * n] && Zo(e[t + r * n]);) r++;
	return e[t + r * n];
}, Yo = (e) => e.type === E.OPEN_PAREN && e.text === "(", Xo = (e) => e.type === E.OPEN_PAREN && e.text === "[", Zo = (e) => e.type === E.BLOCK_COMMENT || e.type === E.LINE_COMMENT, Qo = class {
	constructor(e) {
		this.tokenize = e, this.index = 0, this.tokens = [], this.input = "";
	}
	reset(e, t) {
		this.input = e, this.index = 0, this.tokens = this.tokenize(e);
	}
	next() {
		return this.tokens[this.index++];
	}
	save() {}
	formatError(e) {
		let { line: t, col: n } = Oo(this.input, e.start);
		return `Parse error at token: ${e.text} at line ${t} column ${n}`;
	}
	has(e) {
		return e in E;
	}
}, L;
(function(e) {
	e.statement = "statement", e.clause = "clause", e.set_operation = "set_operation", e.function_call = "function_call", e.parameterized_data_type = "parameterized_data_type", e.array_subscript = "array_subscript", e.property_access = "property_access", e.parenthesis = "parenthesis", e.between_predicate = "between_predicate", e.case_expression = "case_expression", e.case_when = "case_when", e.case_else = "case_else", e.limit_clause = "limit_clause", e.all_columns_asterisk = "all_columns_asterisk", e.literal = "literal", e.identifier = "identifier", e.keyword = "keyword", e.data_type = "data_type", e.parameter = "parameter", e.operator = "operator", e.comma = "comma", e.line_comment = "line_comment", e.block_comment = "block_comment", e.disable_comment = "disable_comment";
})(L = L ||= {});
//#endregion
//#region node_modules/sql-formatter/dist/esm/parser/grammar.js
function $o(e) {
	return e[0];
}
var R = new Qo((e) => []), z = ([[e]]) => e, B = (e) => ({
	type: L.keyword,
	tokenType: e.type,
	text: e.text,
	raw: e.raw
}), es = (e) => ({
	type: L.data_type,
	text: e.text,
	raw: e.raw
}), V = (e, { leading: t, trailing: n }) => (t?.length && (e = Object.assign(Object.assign({}, e), { leadingComments: t })), n?.length && (e = Object.assign(Object.assign({}, e), { trailingComments: n })), e), ts = (e, { leading: t, trailing: n }) => {
	if (t?.length) {
		let [n, ...r] = e;
		e = [V(n, { leading: t }), ...r];
	}
	if (n?.length) {
		let t = e.slice(0, -1), r = e[e.length - 1];
		e = [...t, V(r, { trailing: n })];
	}
	return e;
}, ns = {
	Lexer: R,
	ParserRules: [
		{
			name: "main$ebnf$1",
			symbols: []
		},
		{
			name: "main$ebnf$1",
			symbols: ["main$ebnf$1", "statement"],
			postprocess: (e) => e[0].concat([e[1]])
		},
		{
			name: "main",
			symbols: ["main$ebnf$1"],
			postprocess: ([e]) => {
				let t = e[e.length - 1];
				return t && !t.hasSemicolon ? t.children.length > 0 ? e : e.slice(0, -1) : e;
			}
		},
		{
			name: "statement$subexpression$1",
			symbols: [R.has("DELIMITER") ? { type: "DELIMITER" } : DELIMITER]
		},
		{
			name: "statement$subexpression$1",
			symbols: [R.has("EOF") ? { type: "EOF" } : EOF]
		},
		{
			name: "statement",
			symbols: ["expressions_or_clauses", "statement$subexpression$1"],
			postprocess: ([e, [t]]) => ({
				type: L.statement,
				children: e,
				hasSemicolon: t.type === E.DELIMITER
			})
		},
		{
			name: "expressions_or_clauses$ebnf$1",
			symbols: []
		},
		{
			name: "expressions_or_clauses$ebnf$1",
			symbols: ["expressions_or_clauses$ebnf$1", "free_form_sql"],
			postprocess: (e) => e[0].concat([e[1]])
		},
		{
			name: "expressions_or_clauses$ebnf$2",
			symbols: []
		},
		{
			name: "expressions_or_clauses$ebnf$2",
			symbols: ["expressions_or_clauses$ebnf$2", "clause"],
			postprocess: (e) => e[0].concat([e[1]])
		},
		{
			name: "expressions_or_clauses",
			symbols: ["expressions_or_clauses$ebnf$1", "expressions_or_clauses$ebnf$2"],
			postprocess: ([e, t]) => [...e, ...t]
		},
		{
			name: "clause$subexpression$1",
			symbols: ["limit_clause"]
		},
		{
			name: "clause$subexpression$1",
			symbols: ["select_clause"]
		},
		{
			name: "clause$subexpression$1",
			symbols: ["other_clause"]
		},
		{
			name: "clause$subexpression$1",
			symbols: ["set_operation"]
		},
		{
			name: "clause",
			symbols: ["clause$subexpression$1"],
			postprocess: z
		},
		{
			name: "limit_clause$ebnf$1$subexpression$1$ebnf$1",
			symbols: ["free_form_sql"]
		},
		{
			name: "limit_clause$ebnf$1$subexpression$1$ebnf$1",
			symbols: ["limit_clause$ebnf$1$subexpression$1$ebnf$1", "free_form_sql"],
			postprocess: (e) => e[0].concat([e[1]])
		},
		{
			name: "limit_clause$ebnf$1$subexpression$1",
			symbols: [R.has("COMMA") ? { type: "COMMA" } : COMMA, "limit_clause$ebnf$1$subexpression$1$ebnf$1"]
		},
		{
			name: "limit_clause$ebnf$1",
			symbols: ["limit_clause$ebnf$1$subexpression$1"],
			postprocess: $o
		},
		{
			name: "limit_clause$ebnf$1",
			symbols: [],
			postprocess: () => null
		},
		{
			name: "limit_clause",
			symbols: [
				R.has("LIMIT") ? { type: "LIMIT" } : LIMIT,
				"_",
				"expression_chain_",
				"limit_clause$ebnf$1"
			],
			postprocess: ([e, t, n, r]) => {
				if (r) {
					let [i, a] = r;
					return {
						type: L.limit_clause,
						limitKw: V(B(e), { trailing: t }),
						offset: n,
						count: a
					};
				}
				return {
					type: L.limit_clause,
					limitKw: V(B(e), { trailing: t }),
					count: n
				};
			}
		},
		{
			name: "select_clause$subexpression$1$ebnf$1",
			symbols: []
		},
		{
			name: "select_clause$subexpression$1$ebnf$1",
			symbols: ["select_clause$subexpression$1$ebnf$1", "free_form_sql"],
			postprocess: (e) => e[0].concat([e[1]])
		},
		{
			name: "select_clause$subexpression$1",
			symbols: ["all_columns_asterisk", "select_clause$subexpression$1$ebnf$1"]
		},
		{
			name: "select_clause$subexpression$1$ebnf$2",
			symbols: []
		},
		{
			name: "select_clause$subexpression$1$ebnf$2",
			symbols: ["select_clause$subexpression$1$ebnf$2", "free_form_sql"],
			postprocess: (e) => e[0].concat([e[1]])
		},
		{
			name: "select_clause$subexpression$1",
			symbols: ["asteriskless_free_form_sql", "select_clause$subexpression$1$ebnf$2"]
		},
		{
			name: "select_clause",
			symbols: [R.has("RESERVED_SELECT") ? { type: "RESERVED_SELECT" } : RESERVED_SELECT, "select_clause$subexpression$1"],
			postprocess: ([e, [t, n]]) => ({
				type: L.clause,
				nameKw: B(e),
				children: [t, ...n]
			})
		},
		{
			name: "select_clause",
			symbols: [R.has("RESERVED_SELECT") ? { type: "RESERVED_SELECT" } : RESERVED_SELECT],
			postprocess: ([e]) => ({
				type: L.clause,
				nameKw: B(e),
				children: []
			})
		},
		{
			name: "all_columns_asterisk",
			symbols: [R.has("ASTERISK") ? { type: "ASTERISK" } : ASTERISK],
			postprocess: () => ({ type: L.all_columns_asterisk })
		},
		{
			name: "other_clause$ebnf$1",
			symbols: []
		},
		{
			name: "other_clause$ebnf$1",
			symbols: ["other_clause$ebnf$1", "free_form_sql"],
			postprocess: (e) => e[0].concat([e[1]])
		},
		{
			name: "other_clause",
			symbols: [R.has("RESERVED_CLAUSE") ? { type: "RESERVED_CLAUSE" } : RESERVED_CLAUSE, "other_clause$ebnf$1"],
			postprocess: ([e, t]) => ({
				type: L.clause,
				nameKw: B(e),
				children: t
			})
		},
		{
			name: "set_operation$ebnf$1",
			symbols: []
		},
		{
			name: "set_operation$ebnf$1",
			symbols: ["set_operation$ebnf$1", "free_form_sql"],
			postprocess: (e) => e[0].concat([e[1]])
		},
		{
			name: "set_operation",
			symbols: [R.has("RESERVED_SET_OPERATION") ? { type: "RESERVED_SET_OPERATION" } : RESERVED_SET_OPERATION, "set_operation$ebnf$1"],
			postprocess: ([e, t]) => ({
				type: L.set_operation,
				nameKw: B(e),
				children: t
			})
		},
		{
			name: "expression_chain_$ebnf$1",
			symbols: ["expression_with_comments_"]
		},
		{
			name: "expression_chain_$ebnf$1",
			symbols: ["expression_chain_$ebnf$1", "expression_with_comments_"],
			postprocess: (e) => e[0].concat([e[1]])
		},
		{
			name: "expression_chain_",
			symbols: ["expression_chain_$ebnf$1"],
			postprocess: $o
		},
		{
			name: "expression_chain$ebnf$1",
			symbols: []
		},
		{
			name: "expression_chain$ebnf$1",
			symbols: ["expression_chain$ebnf$1", "_expression_with_comments"],
			postprocess: (e) => e[0].concat([e[1]])
		},
		{
			name: "expression_chain",
			symbols: ["expression", "expression_chain$ebnf$1"],
			postprocess: ([e, t]) => [e, ...t]
		},
		{
			name: "andless_expression_chain$ebnf$1",
			symbols: []
		},
		{
			name: "andless_expression_chain$ebnf$1",
			symbols: ["andless_expression_chain$ebnf$1", "_andless_expression_with_comments"],
			postprocess: (e) => e[0].concat([e[1]])
		},
		{
			name: "andless_expression_chain",
			symbols: ["andless_expression", "andless_expression_chain$ebnf$1"],
			postprocess: ([e, t]) => [e, ...t]
		},
		{
			name: "expression_with_comments_",
			symbols: ["expression", "_"],
			postprocess: ([e, t]) => V(e, { trailing: t })
		},
		{
			name: "_expression_with_comments",
			symbols: ["_", "expression"],
			postprocess: ([e, t]) => V(t, { leading: e })
		},
		{
			name: "_andless_expression_with_comments",
			symbols: ["_", "andless_expression"],
			postprocess: ([e, t]) => V(t, { leading: e })
		},
		{
			name: "free_form_sql$subexpression$1",
			symbols: ["asteriskless_free_form_sql"]
		},
		{
			name: "free_form_sql$subexpression$1",
			symbols: ["asterisk"]
		},
		{
			name: "free_form_sql",
			symbols: ["free_form_sql$subexpression$1"],
			postprocess: z
		},
		{
			name: "asteriskless_free_form_sql$subexpression$1",
			symbols: ["asteriskless_andless_expression"]
		},
		{
			name: "asteriskless_free_form_sql$subexpression$1",
			symbols: ["logic_operator"]
		},
		{
			name: "asteriskless_free_form_sql$subexpression$1",
			symbols: ["comma"]
		},
		{
			name: "asteriskless_free_form_sql$subexpression$1",
			symbols: ["comment"]
		},
		{
			name: "asteriskless_free_form_sql$subexpression$1",
			symbols: ["other_keyword"]
		},
		{
			name: "asteriskless_free_form_sql",
			symbols: ["asteriskless_free_form_sql$subexpression$1"],
			postprocess: z
		},
		{
			name: "expression$subexpression$1",
			symbols: ["andless_expression"]
		},
		{
			name: "expression$subexpression$1",
			symbols: ["logic_operator"]
		},
		{
			name: "expression",
			symbols: ["expression$subexpression$1"],
			postprocess: z
		},
		{
			name: "andless_expression$subexpression$1",
			symbols: ["asteriskless_andless_expression"]
		},
		{
			name: "andless_expression$subexpression$1",
			symbols: ["asterisk"]
		},
		{
			name: "andless_expression",
			symbols: ["andless_expression$subexpression$1"],
			postprocess: z
		},
		{
			name: "asteriskless_andless_expression$subexpression$1",
			symbols: ["atomic_expression"]
		},
		{
			name: "asteriskless_andless_expression$subexpression$1",
			symbols: ["between_predicate"]
		},
		{
			name: "asteriskless_andless_expression$subexpression$1",
			symbols: ["case_expression"]
		},
		{
			name: "asteriskless_andless_expression",
			symbols: ["asteriskless_andless_expression$subexpression$1"],
			postprocess: z
		},
		{
			name: "atomic_expression$subexpression$1",
			symbols: ["array_subscript"]
		},
		{
			name: "atomic_expression$subexpression$1",
			symbols: ["function_call"]
		},
		{
			name: "atomic_expression$subexpression$1",
			symbols: ["property_access"]
		},
		{
			name: "atomic_expression$subexpression$1",
			symbols: ["parenthesis"]
		},
		{
			name: "atomic_expression$subexpression$1",
			symbols: ["curly_braces"]
		},
		{
			name: "atomic_expression$subexpression$1",
			symbols: ["square_brackets"]
		},
		{
			name: "atomic_expression$subexpression$1",
			symbols: ["operator"]
		},
		{
			name: "atomic_expression$subexpression$1",
			symbols: ["identifier"]
		},
		{
			name: "atomic_expression$subexpression$1",
			symbols: ["parameter"]
		},
		{
			name: "atomic_expression$subexpression$1",
			symbols: ["literal"]
		},
		{
			name: "atomic_expression$subexpression$1",
			symbols: ["data_type"]
		},
		{
			name: "atomic_expression$subexpression$1",
			symbols: ["keyword"]
		},
		{
			name: "atomic_expression",
			symbols: ["atomic_expression$subexpression$1"],
			postprocess: z
		},
		{
			name: "array_subscript",
			symbols: [
				R.has("ARRAY_IDENTIFIER") ? { type: "ARRAY_IDENTIFIER" } : ARRAY_IDENTIFIER,
				"_",
				"square_brackets"
			],
			postprocess: ([e, t, n]) => ({
				type: L.array_subscript,
				array: V({
					type: L.identifier,
					quoted: !1,
					text: e.text
				}, { trailing: t }),
				parenthesis: n
			})
		},
		{
			name: "array_subscript",
			symbols: [
				R.has("ARRAY_KEYWORD") ? { type: "ARRAY_KEYWORD" } : ARRAY_KEYWORD,
				"_",
				"square_brackets"
			],
			postprocess: ([e, t, n]) => ({
				type: L.array_subscript,
				array: V(B(e), { trailing: t }),
				parenthesis: n
			})
		},
		{
			name: "function_call",
			symbols: [
				R.has("RESERVED_FUNCTION_NAME") ? { type: "RESERVED_FUNCTION_NAME" } : RESERVED_FUNCTION_NAME,
				"_",
				"parenthesis"
			],
			postprocess: ([e, t, n]) => ({
				type: L.function_call,
				nameKw: V(B(e), { trailing: t }),
				parenthesis: n
			})
		},
		{
			name: "parenthesis",
			symbols: [
				{ literal: "(" },
				"expressions_or_clauses",
				{ literal: ")" }
			],
			postprocess: ([e, t, n]) => ({
				type: L.parenthesis,
				children: t,
				openParen: "(",
				closeParen: ")"
			})
		},
		{
			name: "curly_braces$ebnf$1",
			symbols: []
		},
		{
			name: "curly_braces$ebnf$1",
			symbols: ["curly_braces$ebnf$1", "free_form_sql"],
			postprocess: (e) => e[0].concat([e[1]])
		},
		{
			name: "curly_braces",
			symbols: [
				{ literal: "{" },
				"curly_braces$ebnf$1",
				{ literal: "}" }
			],
			postprocess: ([e, t, n]) => ({
				type: L.parenthesis,
				children: t,
				openParen: "{",
				closeParen: "}"
			})
		},
		{
			name: "square_brackets$ebnf$1",
			symbols: []
		},
		{
			name: "square_brackets$ebnf$1",
			symbols: ["square_brackets$ebnf$1", "free_form_sql"],
			postprocess: (e) => e[0].concat([e[1]])
		},
		{
			name: "square_brackets",
			symbols: [
				{ literal: "[" },
				"square_brackets$ebnf$1",
				{ literal: "]" }
			],
			postprocess: ([e, t, n]) => ({
				type: L.parenthesis,
				children: t,
				openParen: "[",
				closeParen: "]"
			})
		},
		{
			name: "property_access$subexpression$1",
			symbols: ["identifier"]
		},
		{
			name: "property_access$subexpression$1",
			symbols: ["array_subscript"]
		},
		{
			name: "property_access$subexpression$1",
			symbols: ["all_columns_asterisk"]
		},
		{
			name: "property_access$subexpression$1",
			symbols: ["parameter"]
		},
		{
			name: "property_access",
			symbols: [
				"atomic_expression",
				"_",
				R.has("PROPERTY_ACCESS_OPERATOR") ? { type: "PROPERTY_ACCESS_OPERATOR" } : PROPERTY_ACCESS_OPERATOR,
				"_",
				"property_access$subexpression$1"
			],
			postprocess: ([e, t, n, r, [i]]) => ({
				type: L.property_access,
				object: V(e, { trailing: t }),
				operator: n.text,
				property: V(i, { leading: r })
			})
		},
		{
			name: "between_predicate",
			symbols: [
				R.has("BETWEEN") ? { type: "BETWEEN" } : BETWEEN,
				"_",
				"andless_expression_chain",
				"_",
				R.has("AND") ? { type: "AND" } : AND,
				"_",
				"andless_expression"
			],
			postprocess: ([e, t, n, r, i, a, o]) => ({
				type: L.between_predicate,
				betweenKw: B(e),
				expr1: ts(n, {
					leading: t,
					trailing: r
				}),
				andKw: B(i),
				expr2: [V(o, { leading: a })]
			})
		},
		{
			name: "case_expression$ebnf$1",
			symbols: ["expression_chain_"],
			postprocess: $o
		},
		{
			name: "case_expression$ebnf$1",
			symbols: [],
			postprocess: () => null
		},
		{
			name: "case_expression$ebnf$2",
			symbols: []
		},
		{
			name: "case_expression$ebnf$2",
			symbols: ["case_expression$ebnf$2", "case_clause"],
			postprocess: (e) => e[0].concat([e[1]])
		},
		{
			name: "case_expression",
			symbols: [
				R.has("CASE") ? { type: "CASE" } : CASE,
				"_",
				"case_expression$ebnf$1",
				"case_expression$ebnf$2",
				R.has("END") ? { type: "END" } : END
			],
			postprocess: ([e, t, n, r, i]) => ({
				type: L.case_expression,
				caseKw: V(B(e), { trailing: t }),
				endKw: B(i),
				expr: n || [],
				clauses: r
			})
		},
		{
			name: "case_clause",
			symbols: [
				R.has("WHEN") ? { type: "WHEN" } : WHEN,
				"_",
				"expression_chain_",
				R.has("THEN") ? { type: "THEN" } : THEN,
				"_",
				"expression_chain_"
			],
			postprocess: ([e, t, n, r, i, a]) => ({
				type: L.case_when,
				whenKw: V(B(e), { trailing: t }),
				thenKw: V(B(r), { trailing: i }),
				condition: n,
				result: a
			})
		},
		{
			name: "case_clause",
			symbols: [
				R.has("ELSE") ? { type: "ELSE" } : ELSE,
				"_",
				"expression_chain_"
			],
			postprocess: ([e, t, n]) => ({
				type: L.case_else,
				elseKw: V(B(e), { trailing: t }),
				result: n
			})
		},
		{
			name: "comma$subexpression$1",
			symbols: [R.has("COMMA") ? { type: "COMMA" } : COMMA]
		},
		{
			name: "comma",
			symbols: ["comma$subexpression$1"],
			postprocess: ([[e]]) => ({ type: L.comma })
		},
		{
			name: "asterisk$subexpression$1",
			symbols: [R.has("ASTERISK") ? { type: "ASTERISK" } : ASTERISK]
		},
		{
			name: "asterisk",
			symbols: ["asterisk$subexpression$1"],
			postprocess: ([[e]]) => ({
				type: L.operator,
				text: e.text
			})
		},
		{
			name: "operator$subexpression$1",
			symbols: [R.has("OPERATOR") ? { type: "OPERATOR" } : OPERATOR]
		},
		{
			name: "operator",
			symbols: ["operator$subexpression$1"],
			postprocess: ([[e]]) => ({
				type: L.operator,
				text: e.text
			})
		},
		{
			name: "identifier$subexpression$1",
			symbols: [R.has("IDENTIFIER") ? { type: "IDENTIFIER" } : IDENTIFIER]
		},
		{
			name: "identifier$subexpression$1",
			symbols: [R.has("QUOTED_IDENTIFIER") ? { type: "QUOTED_IDENTIFIER" } : QUOTED_IDENTIFIER]
		},
		{
			name: "identifier$subexpression$1",
			symbols: [R.has("VARIABLE") ? { type: "VARIABLE" } : VARIABLE]
		},
		{
			name: "identifier",
			symbols: ["identifier$subexpression$1"],
			postprocess: ([[e]]) => ({
				type: L.identifier,
				quoted: e.type !== "IDENTIFIER",
				text: e.text
			})
		},
		{
			name: "parameter$subexpression$1",
			symbols: [R.has("NAMED_PARAMETER") ? { type: "NAMED_PARAMETER" } : NAMED_PARAMETER]
		},
		{
			name: "parameter$subexpression$1",
			symbols: [R.has("QUOTED_PARAMETER") ? { type: "QUOTED_PARAMETER" } : QUOTED_PARAMETER]
		},
		{
			name: "parameter$subexpression$1",
			symbols: [R.has("NUMBERED_PARAMETER") ? { type: "NUMBERED_PARAMETER" } : NUMBERED_PARAMETER]
		},
		{
			name: "parameter$subexpression$1",
			symbols: [R.has("POSITIONAL_PARAMETER") ? { type: "POSITIONAL_PARAMETER" } : POSITIONAL_PARAMETER]
		},
		{
			name: "parameter$subexpression$1",
			symbols: [R.has("CUSTOM_PARAMETER") ? { type: "CUSTOM_PARAMETER" } : CUSTOM_PARAMETER]
		},
		{
			name: "parameter",
			symbols: ["parameter$subexpression$1"],
			postprocess: ([[e]]) => ({
				type: L.parameter,
				key: e.key,
				text: e.text
			})
		},
		{
			name: "literal$subexpression$1",
			symbols: [R.has("NUMBER") ? { type: "NUMBER" } : NUMBER]
		},
		{
			name: "literal$subexpression$1",
			symbols: [R.has("STRING") ? { type: "STRING" } : STRING]
		},
		{
			name: "literal",
			symbols: ["literal$subexpression$1"],
			postprocess: ([[e]]) => ({
				type: L.literal,
				text: e.text
			})
		},
		{
			name: "keyword$subexpression$1",
			symbols: [R.has("RESERVED_KEYWORD") ? { type: "RESERVED_KEYWORD" } : RESERVED_KEYWORD]
		},
		{
			name: "keyword$subexpression$1",
			symbols: [R.has("RESERVED_KEYWORD_PHRASE") ? { type: "RESERVED_KEYWORD_PHRASE" } : RESERVED_KEYWORD_PHRASE]
		},
		{
			name: "keyword$subexpression$1",
			symbols: [R.has("RESERVED_JOIN") ? { type: "RESERVED_JOIN" } : RESERVED_JOIN]
		},
		{
			name: "keyword",
			symbols: ["keyword$subexpression$1"],
			postprocess: ([[e]]) => B(e)
		},
		{
			name: "data_type$subexpression$1",
			symbols: [R.has("RESERVED_DATA_TYPE") ? { type: "RESERVED_DATA_TYPE" } : RESERVED_DATA_TYPE]
		},
		{
			name: "data_type$subexpression$1",
			symbols: [R.has("RESERVED_DATA_TYPE_PHRASE") ? { type: "RESERVED_DATA_TYPE_PHRASE" } : RESERVED_DATA_TYPE_PHRASE]
		},
		{
			name: "data_type",
			symbols: ["data_type$subexpression$1"],
			postprocess: ([[e]]) => es(e)
		},
		{
			name: "data_type",
			symbols: [
				R.has("RESERVED_PARAMETERIZED_DATA_TYPE") ? { type: "RESERVED_PARAMETERIZED_DATA_TYPE" } : RESERVED_PARAMETERIZED_DATA_TYPE,
				"_",
				"parenthesis"
			],
			postprocess: ([e, t, n]) => ({
				type: L.parameterized_data_type,
				dataType: V(es(e), { trailing: t }),
				parenthesis: n
			})
		},
		{
			name: "logic_operator$subexpression$1",
			symbols: [R.has("AND") ? { type: "AND" } : AND]
		},
		{
			name: "logic_operator$subexpression$1",
			symbols: [R.has("OR") ? { type: "OR" } : OR]
		},
		{
			name: "logic_operator$subexpression$1",
			symbols: [R.has("XOR") ? { type: "XOR" } : XOR]
		},
		{
			name: "logic_operator",
			symbols: ["logic_operator$subexpression$1"],
			postprocess: ([[e]]) => B(e)
		},
		{
			name: "other_keyword$subexpression$1",
			symbols: [R.has("WHEN") ? { type: "WHEN" } : WHEN]
		},
		{
			name: "other_keyword$subexpression$1",
			symbols: [R.has("THEN") ? { type: "THEN" } : THEN]
		},
		{
			name: "other_keyword$subexpression$1",
			symbols: [R.has("ELSE") ? { type: "ELSE" } : ELSE]
		},
		{
			name: "other_keyword$subexpression$1",
			symbols: [R.has("END") ? { type: "END" } : END]
		},
		{
			name: "other_keyword",
			symbols: ["other_keyword$subexpression$1"],
			postprocess: ([[e]]) => B(e)
		},
		{
			name: "_$ebnf$1",
			symbols: []
		},
		{
			name: "_$ebnf$1",
			symbols: ["_$ebnf$1", "comment"],
			postprocess: (e) => e[0].concat([e[1]])
		},
		{
			name: "_",
			symbols: ["_$ebnf$1"],
			postprocess: ([e]) => e
		},
		{
			name: "comment",
			symbols: [R.has("LINE_COMMENT") ? { type: "LINE_COMMENT" } : LINE_COMMENT],
			postprocess: ([e]) => ({
				type: L.line_comment,
				text: e.text,
				precedingWhitespace: e.precedingWhitespace
			})
		},
		{
			name: "comment",
			symbols: [R.has("BLOCK_COMMENT") ? { type: "BLOCK_COMMENT" } : BLOCK_COMMENT],
			postprocess: ([e]) => ({
				type: L.block_comment,
				text: e.text,
				precedingWhitespace: e.precedingWhitespace
			})
		},
		{
			name: "comment",
			symbols: [R.has("DISABLE_COMMENT") ? { type: "DISABLE_COMMENT" } : DISABLE_COMMENT],
			postprocess: ([e]) => ({
				type: L.disable_comment,
				text: e.text,
				precedingWhitespace: e.precedingWhitespace
			})
		}
	],
	ParserStart: "main"
}, { Parser: rs, Grammar: is } = Vo.default;
function as(e) {
	let t = {}, n = new Qo((n) => [...Ho(e.tokenize(n, t)), Et(n.length)]), r = new rs(is.fromCompiled(ns), { lexer: n });
	return { parse: (e, n) => {
		t = n;
		let { results: i } = r.feed(e);
		if (i.length === 1) return i[0];
		throw i.length === 0 ? Error("Parse error: Invalid SQL") : Error(`Parse error: Ambiguous grammar\n${JSON.stringify(i, void 0, 2)}`);
	} };
}
//#endregion
//#region node_modules/sql-formatter/dist/esm/formatter/Layout.js
var H;
(function(e) {
	e[e.SPACE = 0] = "SPACE", e[e.NO_SPACE = 1] = "NO_SPACE", e[e.NO_NEWLINE = 2] = "NO_NEWLINE", e[e.NEWLINE = 3] = "NEWLINE", e[e.MANDATORY_NEWLINE = 4] = "MANDATORY_NEWLINE", e[e.INDENT = 5] = "INDENT", e[e.SINGLE_INDENT = 6] = "SINGLE_INDENT";
})(H = H ||= {});
var os = class {
	constructor(e) {
		this.indentation = e, this.items = [];
	}
	add(...e) {
		for (let t of e) switch (t) {
			case H.SPACE:
				this.items.push(H.SPACE);
				break;
			case H.NO_SPACE:
				this.trimHorizontalWhitespace();
				break;
			case H.NO_NEWLINE:
				this.trimWhitespace();
				break;
			case H.NEWLINE:
				this.trimHorizontalWhitespace(), this.addNewline(H.NEWLINE);
				break;
			case H.MANDATORY_NEWLINE:
				this.trimHorizontalWhitespace(), this.addNewline(H.MANDATORY_NEWLINE);
				break;
			case H.INDENT:
				this.addIndentation();
				break;
			case H.SINGLE_INDENT:
				this.items.push(H.SINGLE_INDENT);
				break;
			default: this.items.push(t);
		}
	}
	trimHorizontalWhitespace() {
		for (; ss(A(this.items));) this.items.pop();
	}
	trimWhitespace() {
		for (; cs(A(this.items));) this.items.pop();
	}
	addNewline(e) {
		if (this.items.length > 0) switch (A(this.items)) {
			case H.NEWLINE:
				this.items.pop(), this.items.push(e);
				break;
			case H.MANDATORY_NEWLINE: break;
			default: this.items.push(e);
		}
	}
	addIndentation() {
		for (let e = 0; e < this.indentation.getLevel(); e++) this.items.push(H.SINGLE_INDENT);
	}
	toString() {
		return this.items.map((e) => this.itemToString(e)).join("");
	}
	getLayoutItems() {
		return this.items;
	}
	isAtStartOfLine() {
		for (let e = this.items.length - 1; e >= 0; e--) {
			let t = this.items[e];
			if (t !== H.SINGLE_INDENT) return t === H.NEWLINE || t === H.MANDATORY_NEWLINE;
		}
		return !1;
	}
	itemToString(e) {
		switch (e) {
			case H.SPACE: return " ";
			case H.NEWLINE:
			case H.MANDATORY_NEWLINE: return "\n";
			case H.SINGLE_INDENT: return this.indentation.getSingleIndent();
			default: return e;
		}
	}
}, ss = (e) => e === H.SPACE || e === H.SINGLE_INDENT, cs = (e) => e === H.SPACE || e === H.SINGLE_INDENT || e === H.NEWLINE;
//#endregion
//#region node_modules/sql-formatter/dist/esm/formatter/tabularStyle.js
function ls(e, t) {
	if (t === "standard") return e;
	let n = [];
	return e.length >= 10 && e.includes(" ") && ([e, ...n] = e.split(" ")), e = t === "tabularLeft" ? e.padEnd(9, " ") : e.padStart(9, " "), e + ["", ...n].join(" ");
}
function us(e) {
	return Ot(e) || e === E.RESERVED_CLAUSE || e === E.RESERVED_SELECT || e === E.RESERVED_SET_OPERATION || e === E.RESERVED_JOIN || e === E.LIMIT;
}
//#endregion
//#region node_modules/sql-formatter/dist/esm/formatter/Indentation.js
var ds = "top-level", fs = "block-level", ps = class {
	constructor(e) {
		this.indent = e, this.indentTypes = [];
	}
	getSingleIndent() {
		return this.indent;
	}
	getLevel() {
		return this.indentTypes.length;
	}
	increaseTopLevel() {
		this.indentTypes.push(ds);
	}
	increaseBlockLevel() {
		this.indentTypes.push(fs);
	}
	decreaseTopLevel() {
		this.indentTypes.length > 0 && A(this.indentTypes) === ds && this.indentTypes.pop();
	}
	decreaseBlockLevel() {
		for (; this.indentTypes.length > 0 && this.indentTypes.pop() === ds;);
	}
}, ms = class extends os {
	constructor(e) {
		super(new ps("")), this.expressionWidth = e, this.length = 0, this.trailingSpace = !1;
	}
	add(...e) {
		if (e.forEach((e) => this.addToLength(e)), this.length > this.expressionWidth) throw new hs();
		super.add(...e);
	}
	addToLength(e) {
		if (typeof e == "string") this.length += e.length, this.trailingSpace = !1;
		else if (e === H.MANDATORY_NEWLINE || e === H.NEWLINE) throw new hs();
		else e === H.INDENT || e === H.SINGLE_INDENT || e === H.SPACE ? this.trailingSpace ||= (this.length++, !0) : (e === H.NO_NEWLINE || e === H.NO_SPACE) && this.trailingSpace && (this.trailingSpace = !1, this.length--);
	}
}, hs = class extends Error {}, gs = class e {
	constructor({ cfg: e, dialectCfg: t, params: n, layout: r, inline: i = !1 }) {
		this.inline = !1, this.nodes = [], this.index = -1, this.cfg = e, this.dialectCfg = t, this.inline = i, this.params = n, this.layout = r;
	}
	format(e) {
		for (this.nodes = e, this.index = 0; this.index < this.nodes.length; this.index++) this.formatNode(this.nodes[this.index]);
		return this.layout;
	}
	formatNode(e) {
		this.formatComments(e.leadingComments), this.formatNodeWithoutComments(e), this.formatComments(e.trailingComments);
	}
	formatNodeWithoutComments(e) {
		switch (e.type) {
			case L.function_call: return this.formatFunctionCall(e);
			case L.parameterized_data_type: return this.formatParameterizedDataType(e);
			case L.array_subscript: return this.formatArraySubscript(e);
			case L.property_access: return this.formatPropertyAccess(e);
			case L.parenthesis: return this.formatParenthesis(e);
			case L.between_predicate: return this.formatBetweenPredicate(e);
			case L.case_expression: return this.formatCaseExpression(e);
			case L.case_when: return this.formatCaseWhen(e);
			case L.case_else: return this.formatCaseElse(e);
			case L.clause: return this.formatClause(e);
			case L.set_operation: return this.formatSetOperation(e);
			case L.limit_clause: return this.formatLimitClause(e);
			case L.all_columns_asterisk: return this.formatAllColumnsAsterisk(e);
			case L.literal: return this.formatLiteral(e);
			case L.identifier: return this.formatIdentifier(e);
			case L.parameter: return this.formatParameter(e);
			case L.operator: return this.formatOperator(e);
			case L.comma: return this.formatComma(e);
			case L.line_comment: return this.formatLineComment(e);
			case L.block_comment: return this.formatBlockComment(e);
			case L.disable_comment: return this.formatBlockComment(e);
			case L.data_type: return this.formatDataType(e);
			case L.keyword: return this.formatKeywordNode(e);
		}
	}
	formatFunctionCall(e) {
		this.withComments(e.nameKw, () => {
			this.layout.add(this.showFunctionKw(e.nameKw));
		}), this.formatNode(e.parenthesis);
	}
	formatParameterizedDataType(e) {
		this.withComments(e.dataType, () => {
			this.layout.add(this.showDataType(e.dataType));
		}), this.formatNode(e.parenthesis);
	}
	formatArraySubscript(e) {
		let t;
		switch (e.array.type) {
			case L.data_type:
				t = this.showDataType(e.array);
				break;
			case L.keyword:
				t = this.showKw(e.array);
				break;
			default: t = this.showIdentifier(e.array);
		}
		this.withComments(e.array, () => {
			this.layout.add(t);
		}), this.formatNode(e.parenthesis);
	}
	formatPropertyAccess(e) {
		this.formatNode(e.object), this.layout.add(H.NO_SPACE, e.operator), this.formatNode(e.property);
	}
	formatParenthesis(e) {
		let t = this.formatInlineExpression(e.children);
		t ? (this.layout.add(e.openParen), this.layout.add(...t.getLayoutItems()), this.layout.add(H.NO_SPACE, e.closeParen, H.SPACE)) : (this.layout.add(e.openParen, H.NEWLINE), F(this.cfg) ? (this.layout.add(H.INDENT), this.layout = this.formatSubExpression(e.children)) : (this.layout.indentation.increaseBlockLevel(), this.layout.add(H.INDENT), this.layout = this.formatSubExpression(e.children), this.layout.indentation.decreaseBlockLevel()), this.layout.add(H.NEWLINE, H.INDENT, e.closeParen, H.SPACE));
	}
	formatBetweenPredicate(e) {
		this.layout.add(this.showKw(e.betweenKw), H.SPACE), this.layout = this.formatSubExpression(e.expr1), this.layout.add(H.NO_SPACE, H.SPACE, this.showNonTabularKw(e.andKw), H.SPACE), this.layout = this.formatSubExpression(e.expr2), this.layout.add(H.SPACE);
	}
	formatCaseExpression(e) {
		this.formatNode(e.caseKw), this.layout.indentation.increaseBlockLevel(), this.layout = this.formatSubExpression(e.expr), this.layout = this.formatSubExpression(e.clauses), this.layout.indentation.decreaseBlockLevel(), this.layout.add(H.NEWLINE, H.INDENT), this.formatNode(e.endKw);
	}
	formatCaseWhen(e) {
		this.layout.add(H.NEWLINE, H.INDENT), this.formatNode(e.whenKw), this.layout = this.formatSubExpression(e.condition), this.formatNode(e.thenKw), this.layout = this.formatSubExpression(e.result);
	}
	formatCaseElse(e) {
		this.layout.add(H.NEWLINE, H.INDENT), this.formatNode(e.elseKw), this.layout = this.formatSubExpression(e.result);
	}
	formatClause(e) {
		this.isOnelineClause(e) ? this.formatClauseInOnelineStyle(e) : F(this.cfg) ? this.formatClauseInTabularStyle(e) : this.formatClauseInIndentedStyle(e);
	}
	isOnelineClause(e) {
		return F(this.cfg) ? this.dialectCfg.tabularOnelineClauses[e.nameKw.text] : this.dialectCfg.onelineClauses[e.nameKw.text];
	}
	formatClauseInIndentedStyle(e) {
		this.layout.add(H.NEWLINE, H.INDENT, this.showKw(e.nameKw), H.NEWLINE), this.layout.indentation.increaseTopLevel(), this.layout.add(H.INDENT), this.layout = this.formatSubExpression(e.children), this.layout.indentation.decreaseTopLevel();
	}
	formatClauseInOnelineStyle(e) {
		this.layout.add(H.NEWLINE, H.INDENT, this.showKw(e.nameKw), H.SPACE), this.layout = this.formatSubExpression(e.children);
	}
	formatClauseInTabularStyle(e) {
		this.layout.add(H.NEWLINE, H.INDENT, this.showKw(e.nameKw), H.SPACE), this.layout.indentation.increaseTopLevel(), this.layout = this.formatSubExpression(e.children), this.layout.indentation.decreaseTopLevel();
	}
	formatSetOperation(e) {
		this.layout.add(H.NEWLINE, H.INDENT, this.showKw(e.nameKw), H.NEWLINE), this.layout.add(H.INDENT), this.layout = this.formatSubExpression(e.children);
	}
	formatLimitClause(e) {
		this.withComments(e.limitKw, () => {
			this.layout.add(H.NEWLINE, H.INDENT, this.showKw(e.limitKw));
		}), this.layout.indentation.increaseTopLevel(), F(this.cfg) ? this.layout.add(H.SPACE) : this.layout.add(H.NEWLINE, H.INDENT), e.offset ? (this.layout = this.formatSubExpression(e.offset), this.layout.add(H.NO_SPACE, ",", H.SPACE), this.layout = this.formatSubExpression(e.count)) : this.layout = this.formatSubExpression(e.count), this.layout.indentation.decreaseTopLevel();
	}
	formatAllColumnsAsterisk(e) {
		this.layout.add("*", H.SPACE);
	}
	formatLiteral(e) {
		this.layout.add(e.text, H.SPACE);
	}
	formatIdentifier(e) {
		this.layout.add(this.showIdentifier(e), H.SPACE);
	}
	formatParameter(e) {
		this.layout.add(this.params.get(e), H.SPACE);
	}
	formatOperator({ text: e }) {
		e === "-" && this.dialectCfg.identifierDashes ? this.layout.add(e, H.SPACE) : this.cfg.denseOperators || this.dialectCfg.alwaysDenseOperators.includes(e) ? this.layout.add(H.NO_SPACE, e) : e === ":" ? this.layout.add(H.NO_SPACE, e, H.SPACE) : this.layout.add(e, H.SPACE);
	}
	formatComma(e) {
		this.inline ? this.layout.add(H.NO_SPACE, ",", H.SPACE) : this.layout.add(H.NO_SPACE, ",", H.NEWLINE, H.INDENT);
	}
	withComments(e, t) {
		this.formatComments(e.leadingComments), t(), this.formatComments(e.trailingComments);
	}
	formatComments(e) {
		e && e.forEach((e) => {
			e.type === L.line_comment ? this.formatLineComment(e) : this.formatBlockComment(e);
		});
	}
	formatLineComment(e) {
		uo(e.precedingWhitespace || "") ? this.layout.add(H.NEWLINE, H.INDENT, e.text, H.MANDATORY_NEWLINE, H.INDENT) : this.layout.getLayoutItems().length > 0 ? this.layout.add(H.NO_NEWLINE, H.SPACE, e.text, H.MANDATORY_NEWLINE, H.INDENT) : this.layout.add(e.text, H.MANDATORY_NEWLINE, H.INDENT);
	}
	formatBlockComment(e) {
		e.type === L.block_comment && this.isStandaloneBlockComment(e) ? (this.splitBlockComment(e.text).forEach((e) => {
			this.layout.add(H.NEWLINE, H.INDENT, e);
		}), this.layout.add(H.NEWLINE, H.INDENT)) : this.layout.add(e.text, H.SPACE);
	}
	isStandaloneBlockComment(e) {
		return uo(e.text) || uo(e.precedingWhitespace || "") || this.layout.isAtStartOfLine();
	}
	isDocComment(e) {
		let t = e.split(/\n/);
		return /^\/\*\*?$/.test(t[0]) && t.slice(1, t.length - 1).every((e) => /^\s*\*/.test(e)) && /^\s*\*\/$/.test(A(t));
	}
	splitBlockComment(e) {
		return this.isDocComment(e) ? e.split(/\n/).map((e) => /^\s*\*/.test(e) ? " " + e.replace(/^\s*/, "") : e) : e.split(/\n/).map((e) => e.replace(/^\s*/, ""));
	}
	formatSubExpression(t) {
		return new e({
			cfg: this.cfg,
			dialectCfg: this.dialectCfg,
			params: this.params,
			layout: this.layout,
			inline: this.inline
		}).format(t);
	}
	formatInlineExpression(t) {
		let n = this.params.getPositionalParameterIndex();
		try {
			return new e({
				cfg: this.cfg,
				dialectCfg: this.dialectCfg,
				params: this.params,
				layout: new ms(this.cfg.expressionWidth),
				inline: !0
			}).format(t);
		} catch (e) {
			if (e instanceof hs) {
				this.params.setPositionalParameterIndex(n);
				return;
			}
			throw e;
		}
	}
	formatKeywordNode(e) {
		switch (e.tokenType) {
			case E.RESERVED_JOIN: return this.formatJoin(e);
			case E.AND:
			case E.OR:
			case E.XOR: return this.formatLogicalOperator(e);
			default: return this.formatKeyword(e);
		}
	}
	formatJoin(e) {
		F(this.cfg) ? (this.layout.indentation.decreaseTopLevel(), this.layout.add(H.NEWLINE, H.INDENT, this.showKw(e), H.SPACE), this.layout.indentation.increaseTopLevel()) : this.layout.add(H.NEWLINE, H.INDENT, this.showKw(e), H.SPACE);
	}
	formatKeyword(e) {
		this.layout.add(this.showKw(e), H.SPACE);
	}
	formatLogicalOperator(e) {
		this.cfg.logicalOperatorNewline === "before" ? F(this.cfg) ? (this.layout.indentation.decreaseTopLevel(), this.layout.add(H.NEWLINE, H.INDENT, this.showKw(e), H.SPACE), this.layout.indentation.increaseTopLevel()) : this.layout.add(H.NEWLINE, H.INDENT, this.showKw(e), H.SPACE) : this.layout.add(this.showKw(e), H.NEWLINE, H.INDENT);
	}
	formatDataType(e) {
		this.layout.add(this.showDataType(e), H.SPACE);
	}
	showKw(e) {
		return us(e.tokenType) ? ls(this.showNonTabularKw(e), this.cfg.indentStyle) : this.showNonTabularKw(e);
	}
	showNonTabularKw(e) {
		switch (this.cfg.keywordCase) {
			case "preserve": return lo(e.raw);
			case "upper": return e.text;
			case "lower": return e.text.toLowerCase();
		}
	}
	showFunctionKw(e) {
		return us(e.tokenType) ? ls(this.showNonTabularFunctionKw(e), this.cfg.indentStyle) : this.showNonTabularFunctionKw(e);
	}
	showNonTabularFunctionKw(e) {
		switch (this.cfg.functionCase) {
			case "preserve": return lo(e.raw);
			case "upper": return e.text;
			case "lower": return e.text.toLowerCase();
		}
	}
	showIdentifier(e) {
		if (e.quoted) return e.text;
		switch (this.cfg.identifierCase) {
			case "preserve": return e.text;
			case "upper": return e.text.toUpperCase();
			case "lower": return e.text.toLowerCase();
		}
	}
	showDataType(e) {
		switch (this.cfg.dataTypeCase) {
			case "preserve": return lo(e.raw);
			case "upper": return e.text;
			case "lower": return e.text.toLowerCase();
		}
	}
}, _s = class {
	constructor(e, t) {
		this.dialect = e, this.cfg = t, this.params = new Bo(this.cfg.params);
	}
	format(e) {
		let t = this.parse(e);
		return this.formatAst(t).trimEnd();
	}
	parse(e) {
		return as(this.dialect.tokenizer).parse(e, this.cfg.paramTypes || {});
	}
	formatAst(e) {
		return e.map((e) => this.formatStatement(e)).join("\n".repeat(this.cfg.linesBetweenQueries + 1));
	}
	formatStatement(e) {
		let t = new gs({
			cfg: this.cfg,
			dialectCfg: this.dialect.formatOptions,
			params: this.params,
			layout: new os(new ps(zo(this.cfg)))
		}).format(e.children);
		return e.hasSemicolon && (this.cfg.newlineBeforeSemicolon ? t.add(H.NEWLINE, ";") : t.add(H.NO_NEWLINE, ";")), t.toString();
	}
}, vs = class extends Error {};
function ys(e) {
	for (let t of [
		"multilineLists",
		"newlineBeforeOpenParen",
		"newlineBeforeCloseParen",
		"aliasAs",
		"commaPosition",
		"tabulateAlias"
	]) if (t in e) throw new vs(`${t} config is no more supported.`);
	if (e.expressionWidth <= 0) throw new vs(`expressionWidth config must be positive number. Received ${e.expressionWidth} instead.`);
	if (e.params && !bs(e.params) && console.warn("WARNING: All \"params\" option values should be strings."), e.paramTypes && !xs(e.paramTypes)) throw new vs("Empty regex given in custom paramTypes. That would result in matching infinite amount of parameters.");
	return e;
}
function bs(e) {
	return (e instanceof Array ? e : Object.values(e)).every((e) => typeof e == "string");
}
function xs(e) {
	return e.custom && Array.isArray(e.custom) ? e.custom.every((e) => e.regex !== "") : !0;
}
//#endregion
//#region node_modules/sql-formatter/dist/esm/sqlFormatter.js
var Ss = function(e, t) {
	var n = {};
	for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
	if (e != null && typeof Object.getOwnPropertySymbols == "function") for (var i = 0, r = Object.getOwnPropertySymbols(e); i < r.length; i++) t.indexOf(r[i]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[i]) && (n[r[i]] = e[r[i]]);
	return n;
}, Cs = {
	bigquery: "bigquery",
	clickhouse: "clickhouse",
	db2: "db2",
	db2i: "db2i",
	duckdb: "duckdb",
	hive: "hive",
	mariadb: "mariadb",
	mysql: "mysql",
	n1ql: "n1ql",
	plsql: "plsql",
	postgresql: "postgresql",
	redshift: "redshift",
	spark: "spark",
	sqlite: "sqlite",
	sql: "sql",
	tidb: "tidb",
	trino: "trino",
	transactsql: "transactsql",
	tsql: "transactsql",
	singlestoredb: "singlestoredb",
	snowflake: "snowflake"
}, ws = Object.keys(Cs), Ts = {
	tabWidth: 2,
	useTabs: !1,
	keywordCase: "preserve",
	identifierCase: "preserve",
	dataTypeCase: "preserve",
	functionCase: "preserve",
	indentStyle: "standard",
	logicalOperatorNewline: "before",
	expressionWidth: 50,
	linesBetweenQueries: 1,
	denseOperators: !1,
	newlineBeforeSemicolon: !1
}, Es = (e, t = {}) => {
	if (typeof t.language == "string" && !ws.includes(t.language)) throw new vs(`Unsupported SQL dialect: ${t.language}`);
	let n = Cs[t.language || "sql"];
	return Ds(e, Object.assign(Object.assign({}, t), { dialect: so[n] }));
}, Ds = (e, t) => {
	var { dialect: n } = t, r = Ss(t, ["dialect"]);
	if (typeof e != "string") throw Error("Invalid query argument. Expected string, instead got " + typeof e);
	let i = ys(Object.assign(Object.assign({}, Ts), r));
	return new _s(Io(n), i).format(e);
};
//#endregion
//#region src/server/sql-format.ts
function Os(e, t) {
	try {
		return Es(e, {
			language: {
				postgres: "postgresql",
				mysql: "mysql",
				sqlite: "sqlite",
				singlestore: "mysql",
				duckdb: "postgresql",
				databend: "postgresql",
				snowflake: "postgresql"
			}[t],
			tabWidth: 2,
			keywordCase: "upper",
			indentStyle: "standard"
		});
	} catch (t) {
		return console.warn("SQL formatting failed:", t), e;
	}
}
//#endregion
//#region src/server/ai/query-schema.ts
var ks = {
	measures: {
		type: "array",
		items: {
			type: "string",
			pattern: "^[A-Z][a-zA-Z0-9]*\\.[a-zA-Z][a-zA-Z0-9]*$"
		},
		description: "Aggregation measures — EXACTLY \"CubeName.measureName\" (two parts, one dot). Copy field names verbatim from discover results. WRONG: \"Sales.Sales.count\" (double-prefixed). RIGHT: \"Sales.count\"."
	},
	dimensions: {
		type: "array",
		items: {
			type: "string",
			pattern: "^[A-Z][a-zA-Z0-9]*\\.[a-zA-Z][a-zA-Z0-9]*$"
		},
		description: "Grouping dimensions — EXACTLY \"CubeName.dimensionName\" (two parts, one dot). Copy from discover results. Can include dimensions from RELATED cubes via joins. WRONG: \"Teams.Teams.name\". RIGHT: \"Teams.name\"."
	},
	filters: {
		type: "array",
		items: {
			type: "object",
			properties: {
				member: {
					type: "string",
					description: "\"CubeName.fieldName\""
				},
				operator: {
					type: "string",
					enum: /* @__PURE__ */ "equals.notEquals.contains.notContains.startsWith.notStartsWith.endsWith.notEndsWith.gt.gte.lt.lte.between.notBetween.in.notIn.like.notLike.ilike.regex.notRegex.set.notSet.isEmpty.isNotEmpty.inDateRange.beforeDate.afterDate.arrayContains.arrayOverlaps.arrayContained".split(".")
				},
				values: {
					type: "array",
					items: {},
					description: "Filter values. Omit for set/notSet/isEmpty/isNotEmpty."
				}
			},
			required: ["member", "operator"]
		},
		description: "Filter conditions. Flat array — for AND/OR logic use { \"and\": [...] } or { \"or\": [...] } wrappers."
	},
	timeDimensions: {
		type: "array",
		items: {
			type: "object",
			properties: {
				dimension: {
					type: "string",
					description: "\"CubeName.timeDimension\""
				},
				granularity: {
					type: "string",
					enum: [
						"second",
						"minute",
						"hour",
						"day",
						"week",
						"month",
						"quarter",
						"year"
					],
					description: "Time bucket size. REQUIRED for time series; omit only for date range filtering."
				},
				dateRange: { description: "Relative string (\"last 7 days\", \"this month\", \"last quarter\") or absolute tuple [\"YYYY-MM-DD\", \"YYYY-MM-DD\"]" },
				fillMissingDates: {
					type: "boolean",
					description: "Fill gaps in time series with fillMissingDatesValue (default: true). Requires granularity + dateRange."
				},
				compareDateRange: {
					type: "array",
					items: {},
					description: "Period-over-period comparison. Array of date ranges: [\"last 30 days\", [\"2024-01-01\", \"2024-01-30\"]]"
				}
			},
			required: ["dimension"]
		},
		description: "Time dimensions with optional granularity for time series. Use filters with inDateRange for aggregated totals instead."
	},
	order: {
		type: "object",
		description: "Sort order. Keys MUST be a measure or dimension already in this query, in \"CubeName.fieldName\" format. Values: \"asc\" or \"desc\". Example: {\"Sales.revenue\": \"desc\"}"
	},
	limit: {
		type: "number",
		description: "Maximum rows to return"
	},
	offset: {
		type: "number",
		description: "Number of rows to skip (for pagination)"
	},
	ungrouped: {
		type: "boolean",
		description: "When true, returns raw row-level data without GROUP BY. Requires at least one dimension. Incompatible with count/countDistinct measures and analysis modes. Cannot reference two cubes joined by a hasMany relationship in EITHER direction (e.g. Departments hasMany Employees) — an ungrouped query stays at one record grain, so keep it to a single cube plus its to-one joins. A field from a hasMany-related cube has to be pre-aggregated in a grouped query instead."
	},
	funnel: {
		type: "object",
		properties: {
			bindingKey: {
				type: "string",
				description: "Entity identifier dimension (e.g., \"Events.userId\")"
			},
			timeDimension: {
				type: "string",
				description: "Time ordering dimension (e.g., \"Events.timestamp\")"
			},
			steps: {
				type: "array",
				items: {
					type: "object",
					properties: {
						name: {
							type: "string",
							description: "Human-readable step name"
						},
						filter: { description: "Filter or array of filters for this step" },
						timeToConvert: {
							type: "string",
							description: "ISO 8601 duration — max time from previous step (e.g., \"P7D\" for 7 days, \"PT1H\" for 1 hour)"
						}
					},
					required: ["name"]
				},
				description: "Ordered funnel steps (minimum 2). Put inDateRange time filter ONLY on step 0."
			},
			includeTimeMetrics: {
				type: "boolean",
				description: "Include avg/median/p90 time-to-convert per step"
			},
			globalTimeWindow: {
				type: "string",
				description: "ISO 8601 duration — all steps must complete within this window from step 0"
			}
		},
		required: [
			"bindingKey",
			"timeDimension",
			"steps"
		],
		description: "Funnel analysis. When provided, measures/dimensions are ignored."
	},
	flow: {
		type: "object",
		properties: {
			bindingKey: {
				type: "string",
				description: "Entity identifier dimension (e.g., \"Events.userId\")"
			},
			timeDimension: {
				type: "string",
				description: "Time ordering dimension (e.g., \"Events.timestamp\")"
			},
			eventDimension: {
				type: "string",
				description: "Dimension whose values become node labels (e.g., \"Events.eventType\")"
			},
			startingStep: {
				type: "object",
				properties: {
					name: {
						type: "string",
						description: "Display name for the starting step"
					},
					filter: { description: "Filter(s) identifying the starting event" }
				},
				required: ["name"],
				description: "The anchor point — an object with { name, filter }, NOT a plain string."
			},
			stepsBefore: {
				type: "number",
				description: "Steps to explore before starting step (0-5)"
			},
			stepsAfter: {
				type: "number",
				description: "Steps to explore after starting step (0-5)"
			},
			entityLimit: {
				type: "number",
				description: "Max entities to process (performance tuning)"
			},
			outputMode: {
				type: "string",
				enum: ["sankey", "sunburst"],
				description: "Visualization mode (default: sankey)"
			}
		},
		required: [
			"bindingKey",
			"timeDimension",
			"eventDimension",
			"startingStep"
		],
		description: "Flow (path) analysis. When provided, measures/dimensions are ignored."
	},
	retention: {
		type: "object",
		properties: {
			timeDimension: {
				type: "string",
				description: "Timestamp dimension (e.g., \"Events.timestamp\")"
			},
			bindingKey: {
				type: "string",
				description: "Entity identifier (e.g., \"Events.userId\")"
			},
			dateRange: {
				type: "object",
				properties: {
					start: {
						type: "string",
						description: "YYYY-MM-DD"
					},
					end: {
						type: "string",
						description: "YYYY-MM-DD"
					}
				},
				required: ["start", "end"],
				description: "Cohort date range — MUST be an object { start, end }, NOT an array or string."
			},
			granularity: {
				type: "string",
				enum: [
					"day",
					"week",
					"month"
				],
				description: "Period size for retention buckets"
			},
			periods: {
				type: "number",
				description: "Number of retention periods to calculate"
			},
			retentionType: {
				type: "string",
				enum: ["classic", "rolling"],
				description: "classic = returned in period N exactly; rolling = returned in period N or later"
			},
			cohortFilters: { description: "Optional filters on cohort entry events" },
			activityFilters: { description: "Optional filters on return activity events" },
			breakdownDimensions: {
				type: "array",
				items: { type: "string" },
				description: "Segment retention by these dimensions (e.g., [\"Events.country\"])"
			}
		},
		required: [
			"timeDimension",
			"bindingKey",
			"dateRange",
			"granularity",
			"periods"
		],
		description: "Retention (cohort) analysis. When provided, measures/dimensions are ignored."
	}
}, As = "// === DRIZZLE CUBE QUERY LANGUAGE (TypeScript DSL) ===\n\ntype RegularQuery = {\n  measures?: string[]           // \"CubeName.measureName\" — aggregations\n  dimensions?: string[]         // \"CubeName.dimensionName\" — groupings (can cross cubes via joins)\n  filters?: (FilterCondition | LogicalFilter)[]\n  timeDimensions?: TimeDimension[]\n  order?: Record<string, 'asc' | 'desc'>  // keys MUST be in measures or dimensions\n  limit?: number\n  offset?: number\n  ungrouped?: boolean           // raw rows without GROUP BY\n  fillMissingDatesValue?: number | null\n}\n\ntype FilterCondition = {\n  member: string                // \"CubeName.fieldName\"\n  operator: FilterOperator\n  values?: any[]                // omit for set/notSet/isEmpty/isNotEmpty\n}\n\ntype LogicalFilter = { and: Filter[] } | { or: Filter[] }\n\ntype FilterOperator =\n  // String\n  | 'equals' | 'notEquals' | 'contains' | 'notContains'\n  | 'startsWith' | 'notStartsWith' | 'endsWith' | 'notEndsWith'\n  | 'like' | 'notLike' | 'ilike' | 'regex' | 'notRegex'\n  // Numeric\n  | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'notBetween'\n  // Set membership\n  | 'in' | 'notIn'\n  // Null/empty\n  | 'set' | 'notSet' | 'isEmpty' | 'isNotEmpty'\n  // Date\n  | 'inDateRange' | 'beforeDate' | 'afterDate'\n  // Array (PostgreSQL)\n  | 'arrayContains' | 'arrayOverlaps' | 'arrayContained'\n\ntype TimeDimension = {\n  dimension: string             // \"CubeName.timeDimension\"\n  granularity?: Granularity     // REQUIRED for time series; omit for date-range-only filtering\n  dateRange?: string | [string, string]  // \"last 7 days\" | [\"2024-01-01\", \"2024-03-31\"]\n  fillMissingDates?: boolean    // gap-fill (requires granularity + dateRange)\n  compareDateRange?: (string | [string, string])[]  // period-over-period\n}\n\ntype Granularity = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'\n\n// --- Analysis Modes (mutually exclusive with measures/dimensions) ---\n\ntype FunnelQuery = {\n  funnel: {\n    bindingKey: string          // \"Events.userId\"\n    timeDimension: string       // \"Events.timestamp\"\n    steps: FunnelStep[]         // min 2; put inDateRange filter ONLY on step 0\n    includeTimeMetrics?: boolean\n    globalTimeWindow?: string   // ISO 8601 duration, e.g. \"P30D\"\n  }\n}\ntype FunnelStep = {\n  name: string\n  filter?: Filter | Filter[]\n  timeToConvert?: string        // ISO 8601 duration, e.g. \"P7D\", \"PT1H\"\n}\n\ntype FlowQuery = {\n  flow: {\n    bindingKey: string          // \"Events.userId\"\n    timeDimension: string       // \"Events.timestamp\"\n    eventDimension: string      // \"Events.eventType\" — values become node labels\n    startingStep: {             // OBJECT, not a string!\n      name: string\n      filter?: Filter | Filter[]\n    }\n    stepsBefore: number         // 0-5\n    stepsAfter: number          // 0-5\n    entityLimit?: number\n    outputMode?: 'sankey' | 'sunburst'\n  }\n}\n\ntype RetentionQuery = {\n  retention: {\n    timeDimension: string       // \"Events.timestamp\"\n    bindingKey: string          // \"Events.userId\"\n    dateRange: {                // OBJECT with start/end, NOT array/string\n      start: string             // \"YYYY-MM-DD\"\n      end: string               // \"YYYY-MM-DD\"\n    }\n    granularity: 'day' | 'week' | 'month'\n    periods: number\n    retentionType: 'classic' | 'rolling'\n    cohortFilters?: Filter | Filter[]\n    activityFilters?: Filter | Filter[]\n    breakdownDimensions?: string[]\n  }\n}\n\n// --- Rules ---\n// 1. Fields are EXACTLY \"CubeName.fieldName\" (two parts, one dot). Copy verbatim from discover.\n//    WRONG: \"Teams.Teams.name\" (double-prefixed!), \"PullRequests\" (bare cube), \"Teams_count\" (underscore)\n//    RIGHT: \"Teams.name\", \"PullRequests.count\"\n// 2. Cross-cube joins: include dimensions from related cubes — the system auto-joins\n// 3. For AGGREGATED TOTALS: use filters with inDateRange (NOT timeDimensions)\n// 4. For TIME SERIES: use timeDimensions WITH granularity\n// 5. timeDimensions WITHOUT granularity = daily grouping (usually wrong)\n// 6. Order keys MUST appear in measures or dimensions of the same query\n// 7. Funnel/flow/retention are mutually exclusive with measures/dimensions\n// 8. Always discover cubes first — never guess field names", js = {
	name: "drizzle-cube-mcp-guide",
	description: "How to use drizzle-cube MCP tools to generate and run queries",
	messages: [{
		role: "user",
		content: {
			type: "text",
			text: [
				"You are an analyst agent using drizzle-cube MCP.",
				"",
				"Workflow:",
				"1) tools/call name=discover {topic|intent} - Find cubes and understand schema",
				"2) Construct your query using the schema from discover (see query language reference)",
				"3) tools/call name=validate {query} - Optional: fix schema issues",
				"4) tools/call name=load {query} - Execute and get results",
				"",
				"CROSS-CUBE JOINS:",
				"The \"joins\" property in discover results shows relationships between cubes.",
				"You can include dimensions from ANY related cube in your query — the system auto-joins.",
				"Example: If Productivity joins to Employees, query:",
				"{ \"measures\": [\"Productivity.totalPullRequests\"], \"dimensions\": [\"Employees.name\"] }",
				"",
				"Do NOT hallucinate cube/field names — always use discover first."
			].join("\n")
		}
	}]
}, Ms = {
	name: "drizzle-cube-query-language",
	description: "CRITICAL: Complete query language reference — types, operators, analysis modes, and rules",
	messages: [{
		role: "user",
		content: {
			type: "text",
			text: As
		}
	}]
}, Ns = {
	name: "drizzle-cube-date-filtering",
	description: "CRITICAL: How to correctly filter by date vs group by time period - the #1 source of query mistakes",
	messages: [{
		role: "user",
		content: {
			type: "text",
			text: [
				"# Date Filtering vs Time Grouping",
				"",
				"```",
				"User wants data over a time period?",
				"|- AGGREGATED TOTALS — no time breakdown in the output",
				"|  (\"total sales last month\", \"top 5 customers this quarter\")",
				"|  -> filters with inDateRange, NEVER timeDimensions",
				"|     Use this whenever the user does NOT want time in the result rows.",
				"|",
				"|- TIME SERIES — time breakdown in the output",
				"|  (\"daily sales last month\", \"monthly breakdown for last quarter\")",
				"|  -> timeDimensions with BOTH dateRange AND granularity",
				"|     ONE entry covers both filtering and grouping — do NOT also add an",
				"|     inDateRange filter on the same field (it duplicates the WHERE clause).",
				"```",
				"",
				"## NEVER duplicate date filtering on the same field",
				"Do NOT put both a `filters[].inDateRange` and a `timeDimensions[].dateRange` on the same field — the engine will emit the same WHERE clause twice. Pick ONE based on whether the user wants time in the output:",
				"- No time in output → `filters[].inDateRange` ONLY (no timeDimensions)",
				"- Time in output   → `timeDimensions[].dateRange + granularity` ONLY (no inDateRange filter on the same field)",
				"",
				"Only combine `filters` + `timeDimensions` when the filter is on a DIFFERENT field (e.g., \"monthly trend for EU customers\" → filter on region + timeDimension on date).",
				"",
				"## Aggregated Totals (most common)",
				"When: \"last 3 months\", \"over the past year\", \"in Q1\", \"since January\"",
				"```json",
				"{",
				"  \"measures\": [\"Sales.totalRevenue\"],",
				"  \"dimensions\": [\"Products.category\"],",
				"  \"filters\": [{ \"member\": \"Sales.date\", \"operator\": \"inDateRange\", \"values\": [\"last 3 months\"] }]",
				"}",
				"```",
				"Result: One row per category with TOTAL revenue.",
				"",
				"## Time Series",
				"When: \"by month\", \"per week\", \"daily trend\", \"over time\"",
				"```json",
				"{",
				"  \"measures\": [\"Sales.totalRevenue\"],",
				"  \"timeDimensions\": [{ \"dimension\": \"Sales.date\", \"dateRange\": \"last 3 months\", \"granularity\": \"month\" }]",
				"}",
				"```",
				"Result: One row per month.",
				"",
				"## Period-over-Period Comparison",
				"Use compareDateRange for side-by-side period analysis:",
				"```json",
				"{",
				"  \"measures\": [\"Sales.totalRevenue\"],",
				"  \"timeDimensions\": [{",
				"    \"dimension\": \"Sales.date\",",
				"    \"granularity\": \"day\",",
				"    \"compareDateRange\": [\"last 30 days\", [\"2024-01-01\", \"2024-01-30\"]]",
				"  }]",
				"}",
				"```",
				"",
				"## WRONG: timeDimensions without granularity",
				"```json",
				"// Returns ~90 rows (daily) instead of aggregates!",
				"{ \"timeDimensions\": [{ \"dimension\": \"Sales.date\", \"dateRange\": \"last 3 months\" }] }",
				"```",
				"",
				"## Date Range Values",
				"- Relative: \"last 7 days\", \"last 3 months\", \"last year\", \"this week\", \"this month\", \"this quarter\", \"next week\", \"next month\"",
				"- Absolute: [\"2024-01-01\", \"2024-03-31\"]",
				"",
				"| User Request | Approach |",
				"|---|---|",
				"| \"total for last 3 months\" | filters + inDateRange (no timeDimensions) |",
				"| \"top 5 last quarter\" | filters + inDateRange + order + limit (no timeDimensions) |",
				"| \"monthly trend\" | timeDimensions with dateRange + granularity |",
				"| \"daily breakdown last week\" | timeDimensions with dateRange + granularity |",
				"| \"compare this month to last\" | timeDimensions with compareDateRange + granularity |",
				"| \"monthly trend for EU customers\" | filters on region + timeDimensions with dateRange + granularity |"
			].join("\n")
		}
	}]
}, Ps = [
	js,
	Ms,
	Ns
];
function Fs() {
	return Ps;
}
var Is = [
	"You are an analyst agent connected to a Drizzle Cube semantic layer.",
	"",
	"## Mandatory workflow",
	"1. CALL `discover` FIRST. Always. Even if you think you know the schema.",
	"   The discover response contains TWO things you MUST read before writing any query:",
	"   - `cubes`: the available cubes, their measures, dimensions, and join relationships.",
	"   - `queryLanguageReference`: the COMPLETE query language reference (TypeScript DSL,",
	"     filter operators, analysis modes, and rules). This is the source of truth — do",
	"     NOT construct queries from memory or guess syntax.",
	"   - `dateFilteringGuide`: the decision tree for date filtering vs time grouping.",
	"     Read this whenever the user asks about a time period.",
	"2. Construct your query using ONLY field names that appear in the discover response,",
	"   in exact `CubeName.fieldName` form (two parts, one dot).",
	"3. Optionally call `validate` to auto-correct schema issues.",
	"4. Call `load` to execute the query and return data.",
	"",
	"## The #1 mistake to avoid (read `dateFilteringGuide` for the full rules)",
	"When the user asks for AGGREGATED TOTALS over a time period (\"total sales last 6 months\",",
	"\"top customers this quarter\"), you MUST filter with `inDateRange` and you MUST NOT use",
	"`timeDimensions`. Using `timeDimensions` without a granularity returns daily rows and is",
	"almost always wrong; using it WITH a granularity returns a time series, not a total.",
	"",
	"Aggregated totals → `filters: [{ member, operator: \"inDateRange\", values: [\"last 6 months\"] }]`",
	"Time series      → `timeDimensions: [{ dimension, dateRange, granularity: \"month\" }]`",
	"",
	"## Field naming",
	"Fields are EXACTLY `CubeName.fieldName`. Copy verbatim from discover.",
	"WRONG: `Sales.Sales.count` (double-prefixed), `Sales` (bare cube), `Sales_count` (underscore).",
	"RIGHT: `Sales.count`, `Customers.region`.",
	"",
	"## Cross-cube joins",
	"The `joins` property in each discover result lists related cubes. You can include",
	"dimensions from any related cube in the same query — the system auto-joins them.",
	"",
	"If you skip `discover` and guess, your query will fail or return wrong results. Always discover first."
].join("\n");
function Ls() {
	return Is;
}
//#endregion
//#region src/server/ai/schemas.ts
var Rs = {
	funnel: {
		description: "Track conversion through sequential steps. Entities (identified by bindingKey) move through ordered steps.",
		structure: { funnel: {
			bindingKey: "Cube.dimension - identifies entities moving through funnel",
			timeDimension: "Cube.dimension - time field for ordering events",
			steps: [{
				name: "string - human readable step name",
				filter: "{ member, operator, values } or array of filters. Put inDateRange ONLY on step 0.",
				timeToConvert: "optional - ISO 8601 duration e.g. \"P7D\" for 7 days, \"PT1H\" for 1 hour"
			}],
			includeTimeMetrics: "optional boolean - include avg/median/p90 time-to-convert",
			globalTimeWindow: "optional - ISO 8601 duration, all steps must complete within this window"
		} }
	},
	flow: {
		description: "Analyze paths users take before/after a specific event. Shows event sequences as Sankey/sunburst.",
		structure: { flow: {
			bindingKey: "Cube.dimension - identifies entities",
			timeDimension: "Cube.dimension - time field for ordering",
			eventDimension: "Cube.dimension - the event type field (values become node labels)",
			startingStep: {
				name: "string - display name for the starting step",
				filter: "{ member, operator, values } - filter identifying the starting event"
			},
			stepsBefore: "number (0-5) - how many steps to show before starting step",
			stepsAfter: "number (0-5) - how many steps to show after starting step",
			entityLimit: "optional number - max entities to process (performance)",
			outputMode: "optional \"sankey\" | \"sunburst\" (default: sankey)"
		} }
	},
	retention: {
		description: "Measure how many users return over time periods after initial activity.",
		structure: { retention: {
			timeDimension: "Cube.dimension - time field for cohort assignment",
			bindingKey: "Cube.dimension - identifies entities",
			dateRange: {
				start: "YYYY-MM-DD - cohort start date",
				end: "YYYY-MM-DD - cohort end date"
			},
			granularity: "day | week | month - period size",
			periods: "number - how many periods to analyze",
			retentionType: "\"classic\" (returned in period N) | \"rolling\" (returned in N or later)",
			cohortFilters: "optional - filters on cohort entry events",
			activityFilters: "optional - filters on return activity events",
			breakdownDimensions: "optional string[] - segment by these dimensions"
		} }
	}
};
//#endregion
//#region src/server/ai/discovery-helpers.ts
function zs(e, t, n) {
	let r = 0, i = t.name.split(".").pop() || t.name;
	return r = Math.max(r, n.fuzzyMatchScore(e, i)), r = Math.max(r, n.fuzzyMatchScore(e, t.title)), t.description && (r = Math.max(r, n.fuzzyMatchScore(e, t.description) * .8)), t.synonyms && (r = Math.max(r, n.matchAgainstArray(e, t.synonyms))), r;
}
function Bs(e, t, n, r, i) {
	let a = 0;
	for (let o of t) {
		let t = zs(e, o, n);
		if (t > .4) {
			a += t, i.hit = !0;
			let e = r.get(o.name) || 0;
			r.set(o.name, Math.max(e, t));
		}
	}
	return a;
}
function Vs(e, t) {
	return Array.from(e.entries()).sort((e, t) => t[1] - e[1]).slice(0, t).map(([e]) => e);
}
function Hs(e) {
	return e.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function Us(e, t) {
	let n = new Set(t), r = {};
	for (let t of e) !n.has(t.name) || !t.title || Hs(t.name.split(".").pop() || t.name) !== Hs(t.title) && (r[t.name] = t.title);
	return Object.keys(r).length > 0 ? r : void 0;
}
function Ws(e, t, n) {
	let r = t.name.split(".").pop() || t.name, i = n.fuzzyMatchScore(e, r);
	return i = Math.max(i, n.fuzzyMatchScore(e, t.title)), t.synonyms && (i = Math.max(i, n.matchAgainstArray(e, t.synonyms))), i;
}
//#endregion
//#region src/server/ai/discovery.ts
function Gs(e, t) {
	if (e.length > 500 || t.length > 500) return e.length + t.length;
	let n = [];
	for (let e = 0; e <= t.length; e++) n[e] = [e];
	for (let t = 0; t <= e.length; t++) n[0][t] = t;
	for (let r = 1; r <= t.length; r++) for (let i = 1; i <= e.length; i++) t.charAt(r - 1) === e.charAt(i - 1) ? n[r][i] = n[r - 1][i - 1] : n[r][i] = Math.min(n[r - 1][i - 1] + 1, n[r][i - 1] + 1, n[r - 1][i] + 1);
	return n[t.length][e.length];
}
function U(e, t) {
	let n = e.toLowerCase().trim(), r = t.toLowerCase().trim();
	if (n === r) return 1;
	if (r.includes(n)) return .9;
	let i = r.split(/[\s_-]+/);
	for (let e of i) {
		if (e === n) return .85;
		if (e.startsWith(n)) return .75;
	}
	let a = 1 - Gs(n, r) / Math.max(n.length, r.length);
	return a > .5 ? a * .7 : 0;
}
function Ks(e, t) {
	let n = 0;
	for (let r of t) {
		let t = U(e, r);
		t > n && (n = t);
	}
	return n;
}
function qs(e) {
	let t = /* @__PURE__ */ new Set(/* @__PURE__ */ "a.an.the.is.are.was.were.be.been.being.have.has.had.do.does.did.will.would.could.should.may.might.must.can.and.or.but.if.then.else.when.where.why.how.what.which.who.this.that.these.those.i.me.my.we.our.you.your.he.she.it.they.them.their.in.on.at.to.for.of.with.by.from.up.down.out.over.under.about.into.through.during.before.after.above.below.between.show.me.get.find.list.give.tell.display.want.need.see.know".split("."));
	return e.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter((e) => e.length > 2 && !t.has(e));
}
var Js = {
	fuzzyMatchScore: U,
	matchAgainstArray: Ks
};
function Ys(e, t, n) {
	let r = 0, i = U(e, t.name);
	i > .5 && (r += i * 2, n.includes("name") || n.push("name"));
	let a = U(e, t.title);
	if (a > .5 && (r += a * 1.5, n.includes("title") || n.push("title")), t.description) {
		let i = U(e, t.description);
		i > .3 && (r += i, n.includes("description") || n.push("description"));
	}
	if (t.exampleQuestions) for (let i of t.exampleQuestions) {
		let t = U(e, i);
		t > .3 && (r += t * 1.5, n.includes("exampleQuestions") || n.push("exampleQuestions"));
	}
	return r;
}
function Xs(e, t) {
	let n = 0, r = [], i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map();
	for (let o of t) {
		n += Ys(o, e, r);
		let t = { hit: !1 };
		n += Bs(o, e.measures, Js, i, t), t.hit && !r.includes("measures") && r.push("measures");
		let s = { hit: !1 };
		n += Bs(o, e.dimensions, Js, a, s), s.hit && !r.includes("dimensions") && r.push("dimensions");
	}
	return {
		score: Math.min(1, n / (t.length * 2)),
		matchedOn: r,
		suggestedMeasures: Vs(i, 5),
		suggestedDimensions: Vs(a, 5)
	};
}
function Zs(e) {
	let t = !!e.meta?.eventStream, n = e.dimensions.some((e) => e.type === "time"), r = e.dimensions.some((t) => t.name.toLowerCase().includes("id") || t.type === "number" || e.meta?.eventStream?.bindingKey && t.name === e.meta.eventStream.bindingKey), i = t || n && r;
	return {
		query: !0,
		funnel: i,
		flow: i,
		retention: i
	};
}
function Qs(e) {
	let t = Zs(e);
	if (!t.funnel && !t.flow && !t.retention) return;
	let n = [];
	if (e.meta?.eventStream?.bindingKey) {
		let t = e.dimensions.find((t) => t.name === e.meta?.eventStream?.bindingKey);
		n.push({
			dimension: e.meta.eventStream.bindingKey,
			description: t?.description || "Configured binding key"
		});
	}
	for (let t of e.dimensions) (t.name.split(".").pop()?.toLowerCase() || "").includes("id") && !n.some((e) => e.dimension === t.name) && n.push({
		dimension: t.name,
		description: t.description || "Potential entity identifier"
	});
	let r = [];
	if (e.meta?.eventStream?.timeDimension) {
		let t = e.dimensions.find((t) => t.name === e.meta?.eventStream?.timeDimension);
		r.push({
			dimension: e.meta.eventStream.timeDimension,
			description: t?.description || "Configured time dimension"
		});
	}
	for (let t of e.dimensions) t.type === "time" && !r.some((e) => e.dimension === t.name) && r.push({
		dimension: t.name,
		description: t.description
	});
	let i = [];
	for (let t of e.dimensions) {
		let e = t.name.split(".").pop()?.toLowerCase() || "";
		t.type === "string" && (e.includes("type") || e.includes("event") || e.includes("status") || e.includes("state") || e.includes("action")) && i.push({
			dimension: t.name,
			description: t.description || "Potential event type dimension"
		});
	}
	return {
		candidateBindingKeys: n,
		candidateTimeDimensions: r,
		candidateEventDimensions: i
	};
}
function $s(e, t) {
	let n = [];
	if (!t) return n;
	if (t.candidateBindingKeys.length > 1 && n.push("Choose bindingKey based on what entity to track through the analysis"), t.candidateEventDimensions.length > 0) {
		let e = t.candidateEventDimensions[0].dimension;
		n.push(`Query ${e} dimension to discover available values for funnel steps`);
	}
	return n.push("Use /mcp/load with a standard query to discover dimension values before building analysis queries"), n;
}
function ec(e, t = {}) {
	let { topic: n, intent: r, limit: i = 10, minScore: a = .1 } = t, o = [n, r].filter(Boolean).join(" ");
	if (!o.trim()) return e.slice(0, i).map((e) => {
		let t = Zs(e), n = Qs(e), r = $s(e, n), i = t.funnel || t.flow || t.retention, a = e.measures.slice(0, 5).map((e) => e.name), o = e.dimensions.slice(0, 5).map((e) => e.name);
		return {
			cube: e.name,
			title: e.title,
			description: e.description,
			relevanceScore: 1,
			matchedOn: [],
			suggestedMeasures: a,
			suggestedDimensions: o,
			fieldTitles: Us([...e.measures, ...e.dimensions], [...a, ...o]),
			capabilities: t,
			analysisConfig: n,
			hints: r.length > 0 ? r : void 0,
			querySchemas: i ? Rs : void 0
		};
	});
	let s = qs(o);
	if (s.length === 0) return [];
	let c = [];
	for (let t of e) {
		let { score: e, matchedOn: n, suggestedMeasures: r, suggestedDimensions: i } = Xs(t, s);
		if (e >= a) {
			let a = Zs(t), o = Qs(t), s = $s(t, o), l = a.funnel || a.flow || a.retention;
			c.push({
				cube: t.name,
				title: t.title,
				description: t.description,
				relevanceScore: e,
				matchedOn: n,
				suggestedMeasures: r,
				suggestedDimensions: i,
				fieldTitles: Us([...t.measures, ...t.dimensions], [...r, ...i]),
				capabilities: a,
				analysisConfig: o,
				hints: s.length > 0 ? s : void 0,
				querySchemas: l ? Rs : void 0
			});
		}
	}
	return c.sort((e, t) => t.relevanceScore - e.relevanceScore).slice(0, i);
}
function tc(e, t, n) {
	let r = null, i = (e, n, i) => {
		for (let a of n) {
			let n = Ws(t, a, Js);
			n > .5 && (!r || n > r.score) && (r = {
				field: a.name,
				cube: e.name,
				score: n,
				type: i
			});
		}
	};
	for (let t of e) (!n || n === "measure") && i(t, t.measures, "measure"), (!n || n === "dimension") && i(t, t.dimensions, "dimension");
	return r;
}
//#endregion
//#region src/server/query-handlers.ts
var nc = Ns.messages[0]?.content.text ?? "";
async function rc(e, t, n) {
	return {
		cubes: ec(e.getMetadata(t), {
			topic: n.topic,
			intent: n.intent,
			limit: n.limit,
			minScore: n.minScore
		}),
		queryLanguageReference: As,
		dateFilteringGuide: nc
	};
}
function W(e) {
	let t = e.split(".");
	return t.length === 3 && t[0] === t[1] ? `${t[0]}.${t[2]}` : e;
}
function ic(e) {
	let t = (e) => {
		if (Array.isArray(e)) return e.map((e) => typeof e == "string" ? W(e) : e);
	};
	if (Array.isArray(e.measures) && (e.measures = t(e.measures)), Array.isArray(e.dimensions) && (e.dimensions = t(e.dimensions)), Array.isArray(e.filters)) for (let t of e.filters) typeof t.member == "string" && (t.member = W(t.member));
	if (Array.isArray(e.timeDimensions)) for (let t of e.timeDimensions) typeof t.dimension == "string" && (t.dimension = W(t.dimension));
	return Array.isArray(e.order) && (e.order = ac(e.order)), e.order && typeof e.order == "object" && !Array.isArray(e.order) && (e.order = cc(e.order, e)), e;
}
function ac(e) {
	let t = {};
	for (let n of e) n && typeof n == "object" && Object.assign(t, n);
	return t;
}
function oc(e) {
	return /* @__PURE__ */ new Set([...Array.isArray(e.measures) ? e.measures : [], ...Array.isArray(e.dimensions) ? e.dimensions : []]);
}
function sc(e, t) {
	let n = W(e);
	if (t.has(n)) return n;
	if (!e.includes(".") && e.includes("_")) {
		let n = W(e.replace(/_/g, "."));
		if (t.has(n)) return n;
		let r = [...t].find((t) => {
			let n = t.split(".")[1];
			return n && (e.endsWith(`_${n}`) || e.endsWith(`.${n}`));
		});
		if (r) return r;
	}
	return t.size > 0 && !t.has(n) ? null : n;
}
function cc(e, t) {
	let n = oc(t), r = {};
	for (let [t, i] of Object.entries(e)) {
		let e = sc(t, n);
		e !== null && (r[e] = i);
	}
	if (Object.keys(r).length === 0 && n.size > 0) {
		let e = Array.isArray(t.measures) ? t.measures[0] : void 0;
		e && (r[e] = "desc");
	}
	return r;
}
async function lc(e, t, n) {
	let r = ic(n.query), i = e.validateQuery(r, t);
	if (!i.isValid) throw Error(`Query validation failed: ${i.errors.join(", ")}`);
	let a = await e.executeMultiCubeQuery(r, t);
	return {
		data: a.data,
		annotation: a.annotation,
		query: r,
		...a.total === void 0 ? {} : { total: a.total }
	};
}
//#endregion
//#region src/server/ai/suggestion-helpers.ts
function G(e) {
	return e.toISOString().split("T")[0];
}
function uc(e, t) {
	let n = /* @__PURE__ */ new Date(), r = G(n);
	if (/days?/.test(t)) {
		let t = new Date(n);
		return t.setDate(t.getDate() - e), {
			dateRange: [G(t), r],
			granularity: "day"
		};
	}
	if (/weeks?/.test(t)) {
		let t = new Date(n);
		return t.setDate(t.getDate() - e * 7), {
			dateRange: [G(t), r],
			granularity: e <= 4 ? "day" : "week"
		};
	}
	if (/months?/.test(t)) {
		let t = new Date(n);
		return t.setMonth(t.getMonth() - e), {
			dateRange: [G(t), r],
			granularity: e <= 3 ? "day" : "month"
		};
	}
	return null;
}
function dc(e) {
	let t = parseInt(e.slice(1), 10), n = (/* @__PURE__ */ new Date()).getFullYear(), r = (t - 1) * 3, i = new Date(n, r, 1), a = new Date(n, r + 3, 0);
	return {
		dateRange: [G(i), G(a)],
		granularity: "month"
	};
}
function fc(e, t, n, r) {
	let i = 0;
	for (let a of e.measures) {
		let e = [
			(a.name.split(".").pop() || a.name).toLowerCase(),
			a.title.toLowerCase(),
			...(a.synonyms || []).map((e) => e.toLowerCase())
		];
		for (let o of e) if (t.includes(o)) {
			n.push(a.name), r.push(`Matched measure '${a.name}' via keyword '${o}'`), i += .15;
			break;
		}
	}
	return i;
}
function pc(e, t, n, r) {
	let i = e.measures.filter((e) => e.type === t.type);
	if (i.length > 0) {
		n.push(i[0].name), r.push(`Suggested ${i[0].name} based on ${t.type} intent`);
		return;
	}
	if (t.type === "count") {
		let t = e.measures.find((e) => e.type === "count" || e.type === "countDistinct");
		t && (n.push(t.name), r.push(`Suggested ${t.name} for counting`));
	}
}
function mc(e, t, n, r, i) {
	let a = 0;
	for (let n of t) {
		let t = tc(e, n, "dimension");
		t && (r.push(t.field), i.push(`Matched dimension '${t.field}' from grouping keyword '${n}'`), a += .1);
	}
	for (let t of e) for (let e of t.dimensions) {
		let t = [
			(e.name.split(".").pop() || e.name).toLowerCase(),
			e.title.toLowerCase(),
			...(e.synonyms || []).map((e) => e.toLowerCase())
		];
		for (let o of t) if (n.includes(o) && !r.includes(e.name) && (n.includes(`by ${o}`) || n.includes(`per ${o}`))) {
			r.push(e.name), i.push(`Matched dimension '${e.name}' as grouping`), a += .1;
			break;
		}
	}
	return a;
}
//#endregion
//#region src/server/ai/suggestion.ts
function hc() {
	let e = /* @__PURE__ */ new Date(), t = e.toISOString().split("T")[0], n = (e) => e.toISOString().split("T")[0], r = (e) => new Date(e.getFullYear(), e.getMonth(), 1), i = (e) => new Date(e.getFullYear(), 0, 1), a = (e) => {
		let t = Math.floor(e.getMonth() / 3);
		return new Date(e.getFullYear(), t * 3, 1);
	}, o = (e) => {
		let t = e.getDay(), n = e.getDate() - t + (t === 0 ? -6 : 1);
		return new Date(e.getFullYear(), e.getMonth(), n);
	};
	return [
		{
			pattern: /\btoday\b/i,
			getDateRange: () => [t, t],
			granularity: "day"
		},
		{
			pattern: /\byesterday\b/i,
			getDateRange: () => {
				let t = new Date(e);
				t.setDate(t.getDate() - 1);
				let r = n(t);
				return [r, r];
			},
			granularity: "day"
		},
		{
			pattern: /\bthis week\b/i,
			getDateRange: () => [n(o(e)), t],
			granularity: "day"
		},
		{
			pattern: /\blast week\b/i,
			getDateRange: () => {
				let t = new Date(o(e));
				t.setDate(t.getDate() - 7);
				let r = new Date(t);
				return r.setDate(r.getDate() + 6), [n(t), n(r)];
			},
			granularity: "day"
		},
		{
			pattern: /\bthis month\b/i,
			getDateRange: () => [n(r(e)), t],
			granularity: "day"
		},
		{
			pattern: /\blast month\b/i,
			getDateRange: () => {
				let t = new Date(e.getFullYear(), e.getMonth() - 1, 1), r = new Date(e.getFullYear(), e.getMonth(), 0);
				return [n(t), n(r)];
			},
			granularity: "day"
		},
		{
			pattern: /\bthis quarter\b/i,
			getDateRange: () => [n(a(e)), t],
			granularity: "month"
		},
		{
			pattern: /\blast quarter\b/i,
			getDateRange: () => {
				let t = new Date(a(e));
				t.setMonth(t.getMonth() - 3);
				let r = new Date(a(e));
				return r.setDate(r.getDate() - 1), [n(t), n(r)];
			},
			granularity: "month"
		},
		{
			pattern: /\bthis year\b/i,
			getDateRange: () => [n(i(e)), t],
			granularity: "month"
		},
		{
			pattern: /\blast year\b/i,
			getDateRange: () => {
				let t = new Date(e.getFullYear() - 1, 0, 1), r = new Date(e.getFullYear() - 1, 11, 31);
				return [n(t), n(r)];
			},
			granularity: "month"
		},
		{
			pattern: /\blast (\d+) days?\b/i,
			getDateRange: () => {
				let r = new Date(e);
				return r.setDate(r.getDate() - 7), [n(r), t];
			},
			granularity: "day"
		},
		{
			pattern: /\blast (\d+) weeks?\b/i,
			getDateRange: () => {
				let r = new Date(e);
				return r.setDate(r.getDate() - 28), [n(r), t];
			},
			granularity: "week"
		},
		{
			pattern: /\blast (\d+) months?\b/i,
			getDateRange: () => {
				let r = new Date(e);
				return r.setMonth(r.getMonth() - 3), [n(r), t];
			},
			granularity: "month"
		},
		{
			pattern: /\bq([1-4])\b/i,
			getDateRange: () => [n(new Date(e.getFullYear(), 0, 1)), n(new Date(e.getFullYear(), 2, 31))],
			granularity: "month"
		}
	];
}
var gc = {
	funnel: /\b(funnel|conversion|drop.?off|steps?|journey|pipeline|stages?)\b/i,
	flow: /\b(flows?|paths?|sequence|before|after|next|previous|user.?journey)\b/i,
	retention: /\b(retention|cohort|return|churn|comeback|retained|day.?\d+)\b/i
};
function _c(e) {
	let t = e.toLowerCase();
	return gc.funnel.test(t) ? "funnel" : gc.flow.test(t) ? "flow" : gc.retention.test(t) ? "retention" : "query";
}
function vc(e, t) {
	let n = t || "the relevant cube";
	switch (e) {
		case "funnel": return [
			`Use /mcp/discover to get ${n} funnel configuration and schema`,
			"Query the event dimension to discover available event types for funnel steps",
			"Build funnel query with discovered values using the schema from discover"
		];
		case "flow": return [
			`Use /mcp/discover to get ${n} flow configuration and schema`,
			"Query the event dimension to discover available event types",
			"Build flow query specifying the starting event and steps before/after"
		];
		case "retention": return [`Use /mcp/discover to get ${n} retention configuration and schema`, "Build retention query specifying granularity (day/week/month) and number of periods"];
	}
}
function yc(e) {
	let t = hc(), n = e.toLowerCase();
	for (let e of t) {
		let t = n.match(e.pattern);
		if (t) {
			if (t[1] && /^\d+$/.test(t[1])) {
				let e = uc(parseInt(t[1], 10), n);
				if (e) return e;
			}
			return /^q[1-4]$/i.test(t[0]) ? dc(t[0]) : {
				dateRange: e.getDateRange(),
				granularity: e.granularity
			};
		}
	}
	return null;
}
function bc(e) {
	let t = e.toLowerCase();
	for (let { pattern: e, type: n } of [
		{
			pattern: /\b(total|sum|combined)\b/i,
			type: "sum"
		},
		{
			pattern: /\b(count|number of|how many)\b/i,
			type: "count"
		},
		{
			pattern: /\b(average|avg|mean)\b/i,
			type: "avg"
		},
		{
			pattern: /\b(maximum|max|highest|top)\b/i,
			type: "max"
		},
		{
			pattern: /\b(minimum|min|lowest|bottom)\b/i,
			type: "min"
		}
	]) if (e.test(t)) return {
		type: n,
		confidence: .8
	};
	return null;
}
function xc(e) {
	let t = e.toLowerCase(), n = [], r = /\bby\s+(\w+(?:\s+\w+)?)/gi, i;
	for (; (i = r.exec(t)) !== null;) n.push(i[1].trim());
	let a = /\bper\s+(\w+)/gi;
	for (; (i = a.exec(t)) !== null;) n.push(i[1].trim());
	let o = /\bfor each\s+(\w+)/gi;
	for (; (i = o.exec(t)) !== null;) n.push(i[1].trim());
	return n;
}
function Sc(e, t, n, r, i) {
	if (n) {
		let t = e.find((e) => e.name === n);
		return t ? (r.push(`Using specified cube: ${n}`), [t]) : (i.push(`Specified cube '${n}' not found`), []);
	}
	let a = ec(e, {
		intent: t,
		limit: 3
	}).map((t) => e.find((e) => e.name === t.cube)).filter((e) => e !== void 0);
	return a.length > 0 && r.push(`Identified relevant cubes: ${a.map((e) => e.name).join(", ")}`), a;
}
function Cc(e, t) {
	return e === "query" ? {
		query: {},
		confidence: 0,
		reasoning: ["Could not identify relevant cubes for this query"],
		warnings: t,
		analysisMode: e,
		nextSteps: void 0
	} : {
		query: {},
		confidence: .7,
		reasoning: [`Detected ${e} intent from natural language`],
		warnings: t,
		analysisMode: e,
		nextSteps: vc(e, void 0)
	};
}
function wc(e, t, n) {
	let r = [], i = [], a = {}, o = _c(t), s = Sc(e, t, n, r, i);
	if (s.length === 0) return Cc(o, i);
	let c = s[0], l = .5, u = bc(t);
	u && (r.push(`Detected ${u.type} aggregation intent`), l += .1);
	let d = [], f = t.toLowerCase();
	l += fc(c, f, d, r), d.length === 0 && u && pc(c, u, d, r), d.length === 0 && c.measures.length > 0 && (d.push(c.measures[0].name), r.push(`Using default measure: ${c.measures[0].name}`), i.push("Could not determine specific measure from query, using default")), a.measures = d;
	let p = xc(t), m = [];
	l += mc(s, p, f, m, r), m.length > 0 && (a.dimensions = m);
	let h = yc(t);
	if (h) {
		let e = c.dimensions.find((e) => e.type === "time");
		if (e) {
			let t = {
				dimension: e.name,
				dateRange: h.dateRange
			};
			h.granularity && (t.granularity = h.granularity), a.timeDimensions = [t], r.push(`Applied time filter: ${h.dateRange[0]} to ${h.dateRange[1]}`), l += .15;
		} else i.push("Time expression found but no time dimension in cube");
	}
	if (l = Math.min(1, l), o !== "query") {
		let e = s.length > 0 ? s[0].name : void 0;
		return {
			query: {},
			confidence: .7,
			reasoning: [`Detected ${o} intent from natural language`, ...e ? [`Found relevant cube: ${e}`] : []],
			warnings: i.length > 0 ? i : void 0,
			analysisMode: o,
			nextSteps: vc(o, e)
		};
	}
	return {
		query: a,
		confidence: l,
		reasoning: r,
		warnings: i.length > 0 ? i : void 0,
		analysisMode: "query"
	};
}
//#endregion
//#region src/server/ai/validation-helpers.ts
function K(e, t, n, r) {
	e ? typeof e == "string" && n(e, r) : r.push({
		type: "syntax_error",
		message: C(t)
	});
}
function Tc(e, t) {
	return e.map((e) => t.get(e) || e);
}
function Ec(e, t) {
	if (t.size === 0) return;
	let n = JSON.parse(JSON.stringify(e));
	return n.measures &&= Tc(n.measures, t), n.dimensions &&= Tc(n.dimensions, t), n.timeDimensions &&= n.timeDimensions.map((e) => ({
		...e,
		dimension: t.get(e.dimension) || e.dimension
	})), n;
}
function Dc(e, t) {
	e.measures && e.measures.length > 10 && t.push({
		type: "performance",
		message: C("server.validation.ai.performanceManyMeasures", { count: e.measures.length }),
		suggestion: C("server.validation.ai.suggestSplitQueries")
	}), e.dimensions && e.dimensions.length > 5 && t.push({
		type: "performance",
		message: C("server.validation.ai.performanceManyDimensions", { count: e.dimensions.length }),
		suggestion: C("server.validation.ai.suggestAddDimensionFilters")
	});
}
function Oc(e, t, n) {
	let [r] = e.split("."), i = t.find((e) => e.name === r);
	if (!i) return;
	let a = i.dimensions.find((t) => t.name === e);
	a && a.type !== "time" && n.push({
		type: "best_practice",
		message: C("server.validation.ai.dimensionNotTimeType", {
			dimension: e,
			type: a.type
		}),
		field: e,
		suggestion: C("server.validation.ai.suggestUseTimeDimension")
	});
}
function kc(e, t, n, r, i) {
	let a = e.member, o = a.split(".");
	if (o.length !== 2) {
		n.push({
			type: "invalid_filter",
			message: C("server.validation.ai.invalidFilterMemberFormat", { member: a }),
			field: a
		});
		return;
	}
	let [s, c] = o, l = t.find((e) => e.name === s);
	if (!l) {
		let e = i(s, t.map((e) => e.name));
		e && r.set(a, `${e.field}.${c}`), n.push({
			type: "cube_not_found",
			message: C("server.validation.ai.cubeNotFoundInFilter", { cubeName: s }),
			field: a,
			suggestion: e ? `Did you mean '${e.field}'?` : void 0,
			correctedValue: e ? `${e.field}.${c}` : void 0
		});
		return;
	}
	let u = l.dimensions.some((e) => e.name === a), d = l.measures.some((e) => e.name === a);
	if (u || d) return;
	let f = i(c, [...l.dimensions.map((e) => e.name.split(".").pop()), ...l.measures.map((e) => e.name.split(".").pop())]);
	if (f) {
		let e = `${s}.${f.field}`;
		r.set(a, e), n.push({
			type: "invalid_filter",
			message: C("server.validation.ai.filterFieldNotFoundWithSuggestion", {
				fieldName: c,
				cubeName: s
			}),
			field: a,
			suggestion: `Did you mean '${f.field}'?`,
			correctedValue: e
		});
	} else n.push({
		type: "invalid_filter",
		message: C("server.validation.ai.filterFieldNotFound", {
			fieldName: c,
			cubeName: s
		}),
		field: a
	});
}
//#endregion
//#region src/server/ai/validation.ts
function q(e, t) {
	let n = null;
	for (let r of t) {
		let t = Gs(e.toLowerCase(), r.toLowerCase());
		t <= 3 && (!n || t < n.distance) && (n = {
			field: r,
			distance: t
		});
	}
	return n;
}
function Ac(e, t, n, r) {
	let i = e.split(".");
	if (i.length !== 2) {
		n.push({
			type: "syntax_error",
			message: C("server.validation.ai.invalidMeasureFormat", { measure: e }),
			field: e
		});
		return;
	}
	let [a, o] = i, s = t.find((e) => e.name === a);
	if (!s) {
		let i = t.map((e) => e.name), s = q(a, i);
		s ? (n.push({
			type: "cube_not_found",
			message: C("server.validation.ai.cubeNotFoundWithSuggestion", { cubeName: a }),
			field: e,
			suggestion: `Did you mean '${s.field}'?`,
			correctedValue: `${s.field}.${o}`
		}), r.set(e, `${s.field}.${o}`)) : n.push({
			type: "cube_not_found",
			message: C("server.validation.ai.cubeNotFoundWithAvailable", { cubeName: a }),
			field: e,
			suggestion: `Available cubes: ${i.join(", ")}`
		});
		return;
	}
	if (!s.measures.some((t) => t.name === e)) {
		let i = tc(t, o, "measure");
		if (i && i.cube === a) n.push({
			type: "measure_not_found",
			message: C("server.validation.ai.measureNotFoundWithSuggestion", {
				measureName: o,
				cubeName: a
			}),
			field: e,
			suggestion: `Did you mean '${i.field}'?`,
			correctedValue: i.field
		}), r.set(e, i.field);
		else {
			let t = s.measures.map((e) => e.name.split(".").pop()), i = q(o, t);
			if (i) {
				let t = `${a}.${i.field}`;
				n.push({
					type: "measure_not_found",
					message: C("server.validation.ai.measureNotFoundWithSuggestion", {
						measureName: o,
						cubeName: a
					}),
					field: e,
					suggestion: `Did you mean '${i.field}'?`,
					correctedValue: t
				}), r.set(e, t);
			} else n.push({
				type: "measure_not_found",
				message: C("server.validation.ai.measureNotFoundWithAvailable", {
					measureName: o,
					cubeName: a
				}),
				field: e,
				suggestion: `Available measures: ${t.slice(0, 5).join(", ")}${t.length > 5 ? "..." : ""}`
			});
		}
	}
}
function J(e, t, n, r) {
	let i = e.split(".");
	if (i.length !== 2) {
		n.push({
			type: "syntax_error",
			message: C("server.validation.ai.invalidDimensionFormat", { dimension: e }),
			field: e
		});
		return;
	}
	let [a, o] = i, s = t.find((e) => e.name === a);
	if (!s) {
		let i = t.map((e) => e.name), s = q(a, i);
		s ? (n.push({
			type: "cube_not_found",
			message: C("server.validation.ai.cubeNotFoundWithSuggestion", { cubeName: a }),
			field: e,
			suggestion: `Did you mean '${s.field}'?`,
			correctedValue: `${s.field}.${o}`
		}), r.set(e, `${s.field}.${o}`)) : n.push({
			type: "cube_not_found",
			message: C("server.validation.ai.cubeNotFoundWithAvailable", { cubeName: a }),
			field: e,
			suggestion: `Available cubes: ${i.join(", ")}`
		});
		return;
	}
	if (!s.dimensions.some((t) => t.name === e)) {
		let i = tc(t, o, "dimension");
		if (i && i.cube === a) n.push({
			type: "dimension_not_found",
			message: C("server.validation.ai.dimensionNotFoundWithSuggestion", {
				dimensionName: o,
				cubeName: a
			}),
			field: e,
			suggestion: `Did you mean '${i.field}'?`,
			correctedValue: i.field
		}), r.set(e, i.field);
		else {
			let t = s.dimensions.map((e) => e.name.split(".").pop()), i = q(o, t);
			if (i) {
				let t = `${a}.${i.field}`;
				n.push({
					type: "dimension_not_found",
					message: C("server.validation.ai.dimensionNotFoundWithSuggestion", {
						dimensionName: o,
						cubeName: a
					}),
					field: e,
					suggestion: `Did you mean '${i.field}'?`,
					correctedValue: t
				}), r.set(e, t);
			} else n.push({
				type: "dimension_not_found",
				message: C("server.validation.ai.dimensionNotFoundWithAvailable", {
					dimensionName: o,
					cubeName: a
				}),
				field: e,
				suggestion: `Available dimensions: ${t.slice(0, 5).join(", ")}${t.length > 5 ? "..." : ""}`
			});
		}
	}
}
function jc(e, t, n, r) {
	for (let i of e) {
		if ("and" in i && Array.isArray(i.and)) {
			jc(i.and, t, n, r);
			continue;
		}
		if ("or" in i && Array.isArray(i.or)) {
			jc(i.or, t, n, r);
			continue;
		}
		"member" in i && kc(i, t, n, r, q);
	}
}
function Mc(e, t, n, r, i) {
	let a = e.funnel;
	if (!a) return;
	let o = (e, n) => J(e, t, n, i);
	if (K(a.bindingKey, "server.validation.ai.bindingKeyRequired.funnel", o, n), K(a.timeDimension, "server.validation.ai.timeDimensionRequired.funnel", o, n), !a.steps || !Array.isArray(a.steps)) n.push({
		type: "syntax_error",
		message: C("server.validation.ai.funnelStepsRequired")
	});
	else if (a.steps.length < 2) n.push({
		type: "syntax_error",
		message: C("server.validation.ai.funnelRequiresSteps")
	});
	else for (let e = 0; e < a.steps.length; e++) {
		let o = a.steps[e];
		o.name || r.push({
			type: "best_practice",
			message: C("server.validation.ai.stepMissingName", { step: e + 1 }),
			suggestion: C("server.validation.ai.suggestAddStepNames")
		}), o.filter && "member" in o.filter && jc([o.filter], t, n, i);
	}
}
function Nc(e, t, n, r, i) {
	let a = e.flow;
	if (!a) return;
	let o = (e, n) => J(e, t, n, i);
	K(a.bindingKey, "server.validation.ai.bindingKeyRequired.flow", o, n), K(a.timeDimension, "server.validation.ai.timeDimensionRequired.flow", o, n), K(a.eventDimension, "server.validation.ai.eventDimensionRequired", o, n), a.stepsBefore === void 0 && a.stepsAfter === void 0 && r.push({
		type: "best_practice",
		message: C("server.validation.ai.stepsBothMissing"),
		suggestion: C("server.validation.ai.suggestSetSteps")
	});
}
function Pc(e, t, n, r, i) {
	let a = e.retention;
	if (!a) return;
	let o = (e, n) => J(e, t, n, i);
	K(a.bindingKey, "server.validation.ai.bindingKeyRequired.retention", o, n), K(a.timeDimension, "server.validation.ai.retentionTimeDimensionRequired", o, n), a.granularity || r.push({
		type: "best_practice",
		message: C("server.validation.ai.granularityNotSpecified"),
		suggestion: C("server.validation.ai.suggestSpecifyGranularity")
	}), a.periods || r.push({
		type: "best_practice",
		message: C("server.validation.ai.periodsNotSpecified"),
		suggestion: C("server.validation.ai.suggestSpecifyPeriods")
	});
}
function Fc(e, t, n, r, i) {
	return e.funnel ? (Mc(e, t, n, r, i), !0) : e.flow ? (Nc(e, t, n, r, i), !0) : e.retention ? (Pc(e, t, n, r, i), !0) : !1;
}
function Ic(e, t, n, r, i) {
	if (e.measures) for (let r of e.measures) Ac(r, t, n, i);
	if (e.dimensions) for (let r of e.dimensions) J(r, t, n, i);
	if (e.timeDimensions) for (let a of e.timeDimensions) J(a.dimension, t, n, i), Oc(a.dimension, t, r);
	e.filters && jc(e.filters, t, n, i), !e.measures?.length && !e.dimensions?.length && n.push({
		type: "syntax_error",
		message: C("server.validation.ai.emptyQuery")
	}), Dc(e, r);
}
function Lc(e, t) {
	let n = [], r = [], i = /* @__PURE__ */ new Map();
	if (Fc(e, t, n, r, i)) return {
		isValid: n.length === 0,
		errors: n,
		warnings: r,
		correctedQuery: void 0
	};
	Ic(e, t, n, r, i);
	let a = Ec(e, i);
	return {
		isValid: n.length === 0,
		errors: n,
		warnings: r,
		correctedQuery: a
	};
}
//#endregion
//#region src/adapters/utils.ts
function Rc(e) {
	let t = 0;
	return t += (e.measures?.length || 0) * 1, t += (e.dimensions?.length || 0) * 1, t += (e.filters?.length || 0) * 2, t += (e.timeDimensions?.length || 0) * 3, t <= 5 ? "low" : t <= 15 ? "medium" : "high";
}
function zc(e, t) {
	if ("and" in e || "or" in e) {
		let n = e.and || e.or || [];
		for (let e of n) zc(e, t);
		return;
	}
	if ("member" in e) {
		let [n] = e.member.split(".");
		n && t.add(n);
	}
}
function Bc() {
	return crypto.randomUUID();
}
function Vc(e) {
	let t = e.dimensions || [], n = e.timeDimensions || [], r = e.measures || [];
	return {
		sortedDimensions: t,
		sortedTimeDimensions: n,
		timeDimensions: n,
		measures: r,
		leafMeasureAdditive: !0,
		leafMeasures: r,
		measureToLeafMeasures: {},
		hasNoTimeDimensionsWithoutGranularity: !0,
		allFiltersWithinSelectedDimensions: !0,
		isAdditive: !0,
		granularityHierarchies: {},
		hasMultipliedMeasures: !1,
		hasCumulativeMeasures: !1,
		windowGranularity: null,
		filterDimensionsSingleValueEqual: {},
		ownedDimensions: t,
		ownedTimeDimensionsWithRollupGranularity: [],
		ownedTimeDimensionsAsIs: [],
		allBackAliasMembers: {},
		hasMultiStage: !1,
		ungrouped: e.ungrouped || !1
	};
}
function Hc(e) {
	return e.getEngineType() ?? "postgres";
}
function Uc(e) {
	let t = Ze(e);
	if (t.length === 0) return "regular";
	if (t.length > 1) throw Error(`Query contains multiple query modes: ${t.join(", ")}`);
	return t[0];
}
function Wc(e, t, n) {
	try {
		return n.analyzeQuery(e, t);
	} catch (e) {
		console.warn("Query analysis failed:", String(e).replace(/\n|\r/g, ""));
		return;
	}
}
function Y(e, t, n, r) {
	let i = n.validateQuery(e, t);
	if (!i.isValid) throw Error(`${r} validation failed: ${i.errors.join(", ")}`);
}
async function X(e, t, n) {
	return {
		sqlResult: await n.dryRun(e, t),
		analysis: Wc(e, t, n)
	};
}
function Z(e, t) {
	let [n] = e.split(".");
	n && t.add(n);
}
function Q(e, t) {
	if (e) for (let n of e) n.cube && t.add(n.cube);
}
function Gc(e) {
	let t = /* @__PURE__ */ new Set();
	return e.measures?.forEach((e) => Z(e, t)), e.dimensions?.forEach((e) => Z(e, t)), e.timeDimensions?.forEach((e) => Z(e.dimension, t)), e.filters?.forEach((e) => {
		zc(e, t);
	}), Array.from(t);
}
function Kc(e) {
	let t = /* @__PURE__ */ new Set(), n = e.funnel;
	typeof n.bindingKey == "string" ? Z(n.bindingKey, t) : Q(n.bindingKey, t), typeof n.timeDimension == "string" ? Z(n.timeDimension, t) : Q(n.timeDimension, t);
	for (let e of n.steps) "cube" in e && e.cube && t.add(e.cube);
	return Array.from(t);
}
function qc(e) {
	let t = /* @__PURE__ */ new Set(), n = e.flow;
	return typeof n.bindingKey == "string" ? Z(n.bindingKey, t) : Q(n.bindingKey, t), typeof n.timeDimension == "string" ? Z(n.timeDimension, t) : Q(n.timeDimension, t), Z(n.eventDimension, t), Array.from(t);
}
function Jc(e) {
	let t = /* @__PURE__ */ new Set(), n = e.retention;
	typeof n.timeDimension == "string" ? Z(n.timeDimension, t) : n.timeDimension?.cube && t.add(n.timeDimension.cube), typeof n.bindingKey == "string" ? Z(n.bindingKey, t) : Q(n.bindingKey, t);
	for (let e of n.breakdownDimensions || []) Z(e, t);
	return Array.from(t);
}
function $(e) {
	let t = e.normalizedQueries || [], n = e.transformedQueries || t;
	return {
		mode: e.mode,
		queryType: e.queryType,
		normalizedQueries: t,
		queryOrder: e.cubesUsed,
		transformedQueries: n,
		pivotQuery: {
			query: e.query,
			cubes: e.cubesUsed
		},
		sql: {
			sql: [e.sqlResult.sql],
			params: e.sqlResult.params || []
		},
		complexity: e.complexity,
		valid: !0,
		cubesUsed: e.cubesUsed,
		joinType: e.joinType,
		query: e.query,
		analysis: e.analysis,
		planningTrace: e.analysis?.planningTrace,
		modeMetadata: e.modeMetadata
	};
}
async function Yc(e, t, n) {
	return {
		regular: () => Xc(e, t, n),
		comparison: () => Zc(e, t, n),
		funnel: () => rl(e, t, n),
		flow: () => il(e, t, n),
		retention: () => al(e, t, n)
	}[Uc(e)]();
}
async function Xc(e, t, n) {
	Y(e, t, n, "Query");
	let r = Gc(e), i = r.length > 1, { sqlResult: a, analysis: o } = await X(e, t, n), s = r.map((t) => ({
		cube: t,
		query: {
			measures: e.measures?.filter((e) => e.startsWith(t + ".")) || [],
			dimensions: e.dimensions?.filter((e) => e.startsWith(t + ".")) || [],
			filters: e.filters || [],
			timeDimensions: e.timeDimensions || [],
			order: e.order || {},
			limit: e.limit,
			offset: e.offset
		}
	}));
	return $({
		mode: "regular",
		queryType: "regularQuery",
		joinType: i ? "multi_cube_join" : "single_cube",
		complexity: Rc(e),
		query: e,
		cubesUsed: r,
		sqlResult: a,
		analysis: o,
		normalizedQueries: s
	});
}
async function Zc(e, t, n) {
	Y(e, t, n, "Comparison query");
	let r = Gc(e), i = r.length > 1, { sqlResult: a, analysis: o } = await X(e, t, n), s = e.timeDimensions?.find((e) => e.compareDateRange && e.compareDateRange.length >= 2), c = s ? {
		timeDimension: s.dimension,
		granularity: s.granularity || "day",
		periodCount: s.compareDateRange?.length ?? 0,
		compareDateRange: s.compareDateRange,
		sqlPreviewPeriodIndex: 0,
		note: "Dry-run SQL preview shows the first comparison period; execution runs all periods and merges results."
	} : void 0;
	return $({
		mode: "comparison",
		queryType: "comparisonQuery",
		joinType: i ? "multi_cube_join" : "single_cube",
		complexity: Rc(e),
		query: e,
		cubesUsed: r,
		sqlResult: a,
		analysis: o,
		modeMetadata: c
	});
}
function Qc(e, t, n) {
	let r = Hc(n), i = Bc();
	return {
		queryType: "regularQuery",
		results: [{
			query: e,
			lastRefreshTime: (/* @__PURE__ */ new Date()).toISOString(),
			usedPreAggregations: {},
			transformedQuery: Vc(e),
			requestId: i,
			annotation: t.annotation,
			dataSource: "default",
			dbType: r,
			extDbType: r,
			external: !1,
			slowQuery: !1,
			data: t.data,
			...t.cache && { cache: t.cache },
			...t.warnings?.length && { warnings: t.warnings },
			...t.total !== void 0 && { total: t.total }
		}],
		pivotQuery: {
			...e,
			queryType: "regularQuery"
		},
		slowQuery: !1
	};
}
function $c(e, t) {
	return {
		sql: t.sql,
		params: t.params || [],
		query: e
	};
}
function el(e) {
	return {
		cubes: e,
		queryGuidance: {
			dateHandling: {
				critical: "Date filtering and time grouping are DIFFERENT operations",
				forAggregatedTotals: {
					description: "For totals over a date range (no time breakdown), use filters with inDateRange operator - NOT timeDimensions",
					example: { filters: [{
						member: "Cube.date",
						operator: "inDateRange",
						values: ["last 3 months"]
					}] },
					useCase: "User asks for \"total sales last month\", \"top 5 last quarter\", \"sum over past year\""
				},
				forTimeSeries: {
					description: "For time series grouped by period (trend analysis), use timeDimensions WITH granularity",
					example: { timeDimensions: [{
						dimension: "Cube.date",
						granularity: "month",
						dateRange: "last 3 months"
					}] },
					useCase: "User asks for \"monthly breakdown\", \"daily trend\", \"per week\""
				},
				warning: "Using timeDimensions WITHOUT granularity groups by day, returning many rows instead of aggregates. This is the #1 query mistake."
			},
			crossCubeQueries: {
				description: "Include dimensions from related cubes - the system auto-joins based on relationships",
				example: "To get employee names with productivity: measures=[\"Productivity.total\"], dimensions=[\"Employees.name\"]",
				howToFind: "Check the \"joins\" property in each cube metadata to see relationships"
			},
			topNPattern: {
				description: "For \"top N\" queries, use filters (not timeDimensions) + order + limit",
				example: {
					measures: ["Cube.total"],
					dimensions: ["RelatedCube.name"],
					filters: [{
						member: "Cube.date",
						operator: "inDateRange",
						values: ["last 3 months"]
					}],
					order: { "Cube.total": "desc" },
					limit: 5
				}
			},
			filterSyntax: {
				description: "Filters must be flat arrays of { member, operator, values }",
				operators: [
					"equals",
					"notEquals",
					"contains",
					"notContains",
					"gt",
					"gte",
					"lt",
					"lte",
					"inDateRange",
					"beforeDate",
					"afterDate",
					"set",
					"notSet"
				],
				dateRangeValues: {
					relative: [
						"last 7 days",
						"last 3 months",
						"last year",
						"this week",
						"this month",
						"this quarter"
					],
					absolute: ["2024-01-01", "2024-03-31"]
				}
			}
		}
	};
}
function tl(e, t = 500, n) {
	return {
		error: e instanceof Error ? e.message : e,
		status: t,
		...n?.length && { issues: n }
	};
}
async function nl(e, t, n, r) {
	return { results: (await Promise.allSettled(e.map(async (e) => Qc(e, await n.executeMultiCubeQuery(e, t, { skipCache: r?.skipCache }), n)))).map((t, n) => {
		if (t.status === "fulfilled") return {
			success: !0,
			...t.value
		};
		{
			let r = t.reason;
			return {
				success: !1,
				error: r instanceof Error ? r.message : String(r),
				issues: r instanceof Qe ? r.issues : void 0,
				query: e[n]
			};
		}
	}) };
}
async function rl(e, t, n) {
	Y(e, t, n, "Funnel query");
	let r = Kc(e), { sqlResult: i, analysis: a } = await X(e, t, n), o = e.funnel;
	return $({
		mode: "funnel",
		queryType: "funnelQuery",
		joinType: "funnel_cte",
		complexity: "high",
		query: e,
		cubesUsed: r,
		sqlResult: i,
		analysis: a,
		modeMetadata: {
			stepCount: o.steps.length,
			steps: o.steps.map((e, t) => ({
				index: t,
				name: e.name,
				timeToConvert: e.timeToConvert,
				cube: "cube" in e ? e.cube : void 0
			})),
			bindingKey: o.bindingKey,
			timeDimension: o.timeDimension,
			includeTimeMetrics: o.includeTimeMetrics,
			globalTimeWindow: o.globalTimeWindow
		}
	});
}
async function il(e, t, n) {
	Y(e, t, n, "Flow query");
	let r = qc(e), { sqlResult: i, analysis: a } = await X(e, t, n), o = e.flow;
	return $({
		mode: "flow",
		queryType: "flowQuery",
		joinType: "flow_cte",
		complexity: "high",
		query: e,
		cubesUsed: r,
		sqlResult: i,
		analysis: a,
		modeMetadata: {
			stepsBefore: o.stepsBefore,
			stepsAfter: o.stepsAfter,
			bindingKey: o.bindingKey,
			timeDimension: o.timeDimension,
			eventDimension: o.eventDimension,
			startingStep: o.startingStep
		}
	});
}
async function al(e, t, n) {
	Y(e, t, n, "Retention query");
	let r = Jc(e), { sqlResult: i, analysis: a } = await X(e, t, n), o = e.retention;
	return $({
		mode: "retention",
		queryType: "retentionQuery",
		joinType: "retention_cte",
		complexity: "high",
		query: e,
		cubesUsed: r,
		sqlResult: i,
		analysis: a,
		modeMetadata: {
			timeDimension: o.timeDimension,
			bindingKey: o.bindingKey,
			granularity: o.granularity,
			periods: o.periods,
			retentionType: o.retentionType,
			breakdownDimensions: o.breakdownDimensions,
			segmentCount: o.breakdownDimensions?.length || 1
		}
	});
}
async function ol(e, t, n) {
	return wc(e.getMetadata(t), n.naturalLanguage, n.cube);
}
async function sl(e, t, n) {
	let r = e.getMetadata(t), i = await Lc(n.query, r);
	if (i.isValid) try {
		let r = ic(i.correctedQuery ?? n.query), a = await e.dryRun(r, t);
		return {
			...i,
			sql: a
		};
	} catch {
		return i;
	}
	return i;
}
//#endregion
export { Ce as $, He as A, Ne as B, tt as C, Xe as D, Je as E, Ve as F, Te as G, Pe as H, Be as I, Ae as J, Oe as K, Ie as L, Le as M, Re as N, Ke as O, Fe as P, ke as Q, ze as R, Qe as S, Ye as T, be as U, Me as V, we as W, De as X, Ee as Y, xe as Z, Ms as _, el as a, o as at, ks as b, Hc as c, l as ct, ol as d, b as et, sl as f, Ns as g, ic as h, tl as i, f as it, Ue as j, C as k, nl as l, lc as m, Rc as n, x as nt, $c as o, s as ot, rc as p, je as q, Qc as r, p as rt, Bc as s, u as st, Vc as t, y as tt, Yc as u, Fs as v, qe as w, Os as x, Ls as y, Se as z };
