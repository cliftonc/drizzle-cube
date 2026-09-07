import { d as e, f as t, i as n, m as r, p as i } from "../utils-ixb9YIRy.js";
import { t as a } from "../compiler-DEsJzXiW.js";
import { C as o, _ as s, h as c, l, s as u, x as d } from "../mcp-transport-Dea5vjws.js";
import { c as f, o as p, r as m, s as h, t as g } from "../core-B3kUdRDt.js";
import { NextResponse as _ } from "next/server";
//#region src/adapters/nextjs/mcp-handler.ts
function v(e, t) {
	let n = new TextEncoder(), r = s(), i = new ReadableStream({ start(e) {
		e.enqueue(n.encode(d({
			jsonrpc: "2.0",
			method: "mcp/ready",
			params: { protocol: "streamable-http" }
		}, r, 15e3)));
	} }), a = new Headers({
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		Connection: "keep-alive"
	});
	return t(e, a), new _(i, {
		status: 200,
		headers: a
	});
}
//#endregion
//#region src/adapters/nextjs/index.ts
function y(e) {
	if (e.semanticLayer) return e.semanticLayer;
	let { cubes: t, drizzle: n, schema: r, engineType: i, cache: o, rlsSetup: s } = e;
	if (!t || t.length === 0) throw Error("At least one cube must be provided in the cubes array");
	let c = new a({
		drizzle: n,
		schema: r,
		engineType: i,
		cache: o,
		rlsSetup: s
	});
	return t.forEach((e) => {
		c.registerCube(e);
	}), c;
}
function b(e) {
	return {
		extractSecurityContext: async (t, n) => {
			let r = await e.extractSecurityContext(t, n), i = h((e) => t.headers.get(e));
			return f(r, i);
		},
		cors: e.cors ? {
			...e.cors,
			allowedHeaders: p(e.cors.allowedHeaders)
		} : void 0
	};
}
function x(e, t) {
	let n = e.headers.get("origin"), r = {};
	return t.origin && (typeof t.origin == "string" ? r["Access-Control-Allow-Origin"] = t.origin : Array.isArray(t.origin) ? n && t.origin.includes(n) && (r["Access-Control-Allow-Origin"] = n) : typeof t.origin == "function" && n && t.origin(n) && (r["Access-Control-Allow-Origin"] = n)), t.methods && (r["Access-Control-Allow-Methods"] = t.methods.join(", ")), t.allowedHeaders && (r["Access-Control-Allow-Headers"] = t.allowedHeaders.join(", ")), t.credentials && (r["Access-Control-Allow-Credentials"] = "true"), r;
}
function S(e) {
	let t = y(e), n = g({
		semanticLayer: t,
		onError: (e) => {
			process.env.NODE_ENV !== "test" && console.error("Next.js handler error:", e);
		},
		mcp: e.mcp
	}), r = e.cors ? {
		...e.cors,
		allowedHeaders: p(e.cors.allowedHeaders)
	} : void 0;
	return {
		httpHandler: n,
		corsHeaders: (e) => r ? x(e, r) : {},
		baseContext: (t, n) => () => e.extractSecurityContext(t, n)
	};
}
function C(e, t) {
	let n = {};
	return {
		getHeader: (t) => e.headers.get(t) ?? void 0,
		getBody: async () => {
			try {
				return await e.json();
			} catch {
				return null;
			}
		},
		getQueryParam: (t) => e.nextUrl.searchParams.get(t) ?? void 0,
		send: (e, r) => _.json(r, {
			status: e,
			headers: {
				...t,
				...n
			}
		}),
		setHeader: (e, t) => {
			n[e] = t;
		},
		sendEmpty: (e) => new _(null, {
			status: e,
			headers: {
				...t,
				...n
			}
		}),
		sendSse: (e, r) => new _(r, {
			status: e,
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
				...t,
				...n
			}
		})
	};
}
function w(e) {
	return async function(t) {
		let n = x(t, {
			...e,
			allowedHeaders: p(e.allowedHeaders)
		});
		return new Response(null, {
			status: 200,
			headers: n
		});
	};
}
function T(e) {
	let { httpHandler: t, corsHeaders: r, baseContext: i } = S(e);
	return async function(e, a) {
		let o = C(e, r(e));
		return e.method === "POST" ? t.handleLoadPost(o, i(e, a)) : e.method === "GET" ? t.handleLoadGet(o, i(e, a)) : _.json(n("Method not allowed", 405), { status: 405 });
	};
}
function E(e) {
	let { httpHandler: t, corsHeaders: n, baseContext: r } = S(e);
	return async function(e, i) {
		return t.handleMetaGet(C(e, n(e)), r(e, i));
	};
}
function D(e) {
	let { httpHandler: t, corsHeaders: r, baseContext: i } = S(e);
	return async function(e, a) {
		let o = C(e, r(e));
		return e.method === "POST" ? t.handleSqlPost(o, i(e, a)) : e.method === "GET" ? t.handleSqlGet(o, i(e, a)) : _.json(n("Method not allowed", 405), { status: 405 });
	};
}
function O(e) {
	let { httpHandler: t, corsHeaders: n, baseContext: r } = S(e);
	return async function(e, i) {
		let a = C(e, n(e));
		return e.method === "POST" ? t.handleDryRunPost(a, r(e, i)) : e.method === "GET" ? t.handleDryRunGet(a, r(e, i)) : _.json({
			error: "Method not allowed",
			valid: !1
		}, { status: 405 });
	};
}
function k(e) {
	let { httpHandler: t, corsHeaders: r, baseContext: i } = S(e);
	return async function(e, a) {
		return e.method === "POST" ? t.handleBatchPost(C(e, r(e)), i(e, a)) : _.json(n("Method not allowed - use POST", 405), { status: 405 });
	};
}
function A(e) {
	let { httpHandler: t, corsHeaders: n, baseContext: r } = S(e);
	return async function(e, i) {
		return e.method === "POST" ? t.handleExplainPost(C(e, n(e)), r(e, i)) : _.json({ error: "Method not allowed" }, { status: 405 });
	};
}
function j(e) {
	let { extractSecurityContext: t, cors: r } = b(e), a = y(e);
	return async function(e, o) {
		try {
			if (e.method !== "POST") return _.json(n("Method not allowed - use POST", 405), { status: 405 });
			let s = await e.json(), c = await t(e, o), l = await i(a, c, s);
			return _.json(l, { headers: r ? x(e, r) : {} });
		} catch (e) {
			return process.env.NODE_ENV !== "test" && console.error("Next.js discover handler error:", e), _.json(n(e instanceof Error ? e.message : "Discovery failed", 500), { status: 500 });
		}
	};
}
function M(t) {
	let { extractSecurityContext: r, cors: i } = b(t), a = y(t);
	return async function(t, o) {
		try {
			if (t.method !== "POST") return _.json(n("Method not allowed - use POST", 405), { status: 405 });
			let s = await t.json();
			if (!s.naturalLanguage) return _.json(n("naturalLanguage field is required", 400), { status: 400 });
			let c = await r(t, o), l = await e(a, c, s);
			return _.json(l, { headers: i ? x(t, i) : {} });
		} catch (e) {
			return process.env.NODE_ENV !== "test" && console.error("Next.js suggest handler error:", e), _.json(n(e instanceof Error ? e.message : "Query suggestion failed", 500), { status: 500 });
		}
	};
}
function N(e) {
	let { extractSecurityContext: r, cors: i } = b(e), a = y(e);
	return async function(e, o) {
		try {
			if (e.method !== "POST") return _.json(n("Method not allowed - use POST", 405), { status: 405 });
			let s = await e.json();
			if (!s.query) return _.json(n("query field is required", 400), { status: 400 });
			let c = await r(e, o), l = await t(a, c, s);
			return _.json(l, { headers: i ? x(e, i) : {} });
		} catch (e) {
			return process.env.NODE_ENV !== "test" && console.error("Next.js validate handler error:", e), _.json(n(e instanceof Error ? e.message : "Query validation failed", 500), { status: 500 });
		}
	};
}
function P(e) {
	let { extractSecurityContext: t, cors: i } = b(e), a = y(e);
	return async function(e, o) {
		try {
			if (e.method !== "POST") return _.json(n("Method not allowed - use POST", 405), { status: 405 });
			let s = await e.json();
			if (!s.query) return _.json(n("query field is required", 400), { status: 400 });
			let c = await t(e, o), l = await r(a, c, s);
			return _.json(l, { headers: i ? x(e, i) : {} });
		} catch (e) {
			return process.env.NODE_ENV !== "test" && console.error("Next.js MCP load handler error:", e), _.json(n(e instanceof Error ? e.message : "Query execution failed", 500), { status: 500 });
		}
	};
}
function F(e) {
	let { httpHandler: t, corsHeaders: r, baseContext: i } = S(e), { mcp: a = { enabled: !0 } } = e, s = (e, t) => {
		Object.entries(r(e)).forEach(([e, n]) => t.set(e, n));
	};
	return async function(e, d) {
		if (a.resourceMetadataUrl && !l(e.headers.get("authorization"))) return _.json({ error: "Bearer token required" }, {
			status: 401,
			headers: { "WWW-Authenticate": u(a.resourceMetadataUrl) }
		});
		if (e.method === "DELETE" || e.method === "GET") {
			let t = o(e.headers.get("origin"), c(a));
			if (!t.valid) return _.json({ error: t.reason }, { status: 403 });
		}
		return e.method === "DELETE" ? _.json({ error: "Session termination not supported" }, { status: 405 }) : e.method === "GET" ? v(e, s) : e.method === "POST" ? t.handleMcpPost(C(e, r(e)), i(e, d)) : _.json(n("Method not allowed - use POST", 405), { status: 405 });
	};
}
function I(e) {
	let { cors: t } = b(e), { agent: n } = e;
	if (!n) throw Error("agent config is required for createAgentChatHandler");
	let r = y(e);
	return async function(i, a) {
		try {
			if (i.method !== "POST") return _.json({ error: "Method not allowed - use POST" }, { status: 405 });
			let { handleAgentChat: o } = await import("../handler-tTUTV4P5.js"), { message: s, sessionId: c, history: l } = await i.json();
			if (!s || typeof s != "string") return _.json({ error: "message is required and must be a string" }, { status: 400 });
			let u = (n.apiKey || "").trim();
			if (n.allowClientApiKey) {
				let e = i.headers.get("x-agent-api-key");
				e && (u = e.trim());
			}
			if (!u) return _.json({ error: "No API key configured. Set agent.apiKey in server config or send X-Agent-Api-Key header." }, { status: 401 });
			let d = n.allowClientApiKey && i.headers.get("x-agent-provider") || void 0, f = n.allowClientApiKey && i.headers.get("x-agent-model") || void 0, p = n.allowClientApiKey && i.headers.get("x-agent-provider-endpoint") || void 0, h = m(await e.extractSecurityContext(i, a), (e) => i.headers.get(e) ?? void 0), g = n.buildSystemContext?.(h), v = new TextEncoder(), y = new ReadableStream({ async start(e) {
				try {
					let t = o({
						message: s,
						sessionId: c,
						history: l,
						semanticLayer: r,
						securityContext: h,
						agentConfig: n,
						apiKey: u,
						systemContext: g,
						providerOverride: d,
						modelOverride: f,
						baseURLOverride: p
					});
					for await (let n of t) {
						let t = `data: ${JSON.stringify(n)}\n\n`;
						e.enqueue(v.encode(t));
					}
				} catch (t) {
					let n = {
						type: "error",
						data: { message: t instanceof Error ? t.message : "Stream failed" }
					};
					e.enqueue(v.encode(`data: ${JSON.stringify(n)}\n\n`));
				} finally {
					e.close();
				}
			} }), b = new Headers({
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive"
			});
			if (t) {
				let e = x(i, t);
				Object.entries(e).forEach(([e, t]) => b.set(e, t));
			}
			return new Response(y, {
				status: 200,
				headers: b
			});
		} catch (e) {
			return process.env.NODE_ENV !== "test" && console.error("Next.js agent chat handler error:", e), _.json({ error: e instanceof Error ? e.message : "Agent chat failed" }, { status: 500 });
		}
	};
}
function L(e) {
	let { mcp: t = { enabled: !0 } } = e, n = y(e), r = {
		...e,
		semanticLayer: n
	}, i = {
		load: T(r),
		meta: E(r),
		sql: D(r),
		dryRun: O(r),
		batch: k(r),
		explain: A(r)
	};
	return t.enabled !== !1 && (i.mcpRpc = F(r)), e.agent && (i.agentChat = I(r)), i;
}
//#endregion
export { I as createAgentChatHandler, k as createBatchHandler, L as createCubeHandlers, j as createDiscoverHandler, O as createDryRunHandler, A as createExplainHandler, T as createLoadHandler, P as createMcpLoadHandler, F as createMcpRpcHandler, E as createMetaHandler, w as createOptionsHandler, D as createSqlHandler, M as createSuggestHandler, N as createValidateHandler };
