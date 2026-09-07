import { f as e, m as t, p as n } from "./utils-ixb9YIRy.js";
import { d as r, f as i, n as a, o, t as s, u as c } from "./mcp-transport-Dea5vjws.js";
//#region src/adapters/mcp-tools-handlers.ts
async function l(e, t, r) {
	let i = await e.getSecurityContext(r);
	return e.wrapContent(await n(e.semanticLayer, i, t || {}));
}
async function u(t, n, r) {
	let i = n || {};
	if (!i.query) return t.wrapError("query is required");
	let a = await t.getSecurityContext(r);
	return t.wrapContent(await e(t.semanticLayer, a, i));
}
async function d(e, n, r) {
	let i = n || {};
	if (!i.query) return e.wrapError("query is required");
	let a = await e.getSecurityContext(r);
	return e.wrapContent(await t(e.semanticLayer, a, i));
}
//#endregion
//#region src/adapters/mcp-tools.ts
function f(e) {
	return {
		content: [{
			type: "text",
			text: typeof e == "string" ? e : JSON.stringify(e)
		}],
		isError: !1
	};
}
function p(e) {
	return {
		content: [{
			type: "text",
			text: e instanceof Error ? e.message : String(e)
		}],
		isError: !0
	};
}
function m(e) {
	let { semanticLayer: t, getSecurityContext: n, toolPrefix: i = "drizzle_cube_", tools: a = [
		"discover",
		"validate",
		"load",
		"chart"
	], prompts: s = c(), resources: m, app: g = !1 } = e, _ = !!g, v = typeof g == "object" ? g : void 0, y = m ?? r(), b = _ ? [...y, ...h(v)] : y, x = o({ appEnabled: _ }), S = new Map(x.map((e) => [e.name, e])), C = a.filter((e) => S.has(e)).map((e) => {
		let t = S.get(e), n = {
			name: `${i}${e}`,
			description: t.description,
			inputSchema: t.inputSchema
		}, r = t._meta;
		return r && (n._meta = r), n;
	}), w = C.map((e) => e.name), T = /* @__PURE__ */ new Set();
	for (let e of a) T.add(e), T.add(`${i}${e}`);
	function E(e) {
		return T.has(e);
	}
	let D = {
		semanticLayer: t,
		getSecurityContext: n,
		wrapContent: f,
		wrapError: p
	}, O = {
		discover: (e, t) => l(D, e, t),
		validate: (e, t) => u(D, e, t),
		load: (e, t) => d(D, e, t),
		chart: (e, t) => d(D, e, t)
	};
	async function k(e, t, n) {
		let r = e.startsWith(i) ? e.slice(i.length) : e, o = a.includes(r) ? O[r] : void 0;
		if (!o) return p(`Unknown tool: ${e}`);
		try {
			return await o(t, n);
		} catch (e) {
			return p(e);
		}
	}
	return {
		definitions: C,
		handle: k,
		handles: E,
		prompts: s,
		resources: b,
		toolNames: w
	};
}
function h(e) {
	let t = i(e);
	return t ? [{
		uri: a,
		name: "Drizzle Cube Visualization",
		description: "Interactive chart visualization for query results",
		mimeType: s,
		text: t
	}] : [];
}
//#endregion
export { m as getCubeTools };
