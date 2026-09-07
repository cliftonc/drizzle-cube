import { t as e } from "../compiler-DEsJzXiW.js";
import { C as t, _ as n, h as r, l as i, s as a, x as o } from "../mcp-transport-Dea5vjws.js";
import { o as s, r as c, t as l } from "../core-B3kUdRDt.js";
import { Hono as u } from "hono";
//#region node_modules/hono/dist/middleware/cors/index.js
var d = (e) => {
	let t = {
		origin: "*",
		allowMethods: [
			"GET",
			"HEAD",
			"PUT",
			"POST",
			"DELETE",
			"PATCH",
			"QUERY"
		],
		allowHeaders: [],
		exposeHeaders: [],
		...e
	}, n = t.exposeHeaders?.length ? t.exposeHeaders.join(",") : void 0, r = t.allowHeaders?.length ? t.allowHeaders.join(",") : void 0, i = ((e) => typeof e == "string" ? e === "*" ? () => e : (t) => e === t ? t : null : typeof e == "function" ? e : (t) => e.includes(t) ? t : null)(t.origin), a = ((e) => {
		if (typeof e == "function") return async (t, n) => (await e(t, n)).join(",");
		if (Array.isArray(e)) {
			let t = e.join(",");
			return () => t;
		}
		return () => "";
	})(t.allowMethods);
	return async function(e, o) {
		function s(t, n) {
			e.res.headers.set(t, n);
		}
		let c = await i(e.req.header("origin") || "", e);
		if (c && s("Access-Control-Allow-Origin", c), t.credentials && s("Access-Control-Allow-Credentials", "true"), n && s("Access-Control-Expose-Headers", n), e.req.method === "OPTIONS") {
			t.origin !== "*" && e.res.headers.append("Vary", "Origin"), t.maxAge != null && s("Access-Control-Max-Age", t.maxAge.toString());
			let n = await a(e.req.header("origin") || "", e);
			n && s("Access-Control-Allow-Methods", n);
			let i = r;
			if (!i) {
				let t = e.req.header("Access-Control-Request-Headers");
				t && (i = t.split(",").map((e) => e.trim()).join(","));
			}
			return i && (s("Access-Control-Allow-Headers", i), e.res.headers.append("Vary", "Access-Control-Request-Headers")), e.res.headers.delete("Content-Length"), e.res.headers.delete("Content-Type"), new Response(null, {
				headers: e.res.headers,
				status: 204,
				statusText: "No Content"
			});
		}
		await o(), t.origin !== "*" && e.header("Vary", "Origin", { append: !0 });
	};
};
//#endregion
//#region src/adapters/hono/agent-handler.ts
function f(e, t) {
	let n = (t.apiKey || "").trim();
	if (t.allowClientApiKey) {
		let t = e.req.header("x-agent-api-key");
		t && (n = t.trim());
	}
	return n;
}
function p(e, t) {
	return t.allowClientApiKey ? {
		providerOverride: e.req.header("x-agent-provider"),
		modelOverride: e.req.header("x-agent-model"),
		baseURLOverride: e.req.header("x-agent-provider-endpoint")
	} : {};
}
function m(e) {
	let t = new TextEncoder(), n = new ReadableStream({ async start(n) {
		try {
			for await (let r of e) n.enqueue(t.encode(`data: ${JSON.stringify(r)}\n\n`));
		} catch (e) {
			let r = {
				type: "error",
				data: { message: e instanceof Error ? e.message : "Stream failed" }
			};
			n.enqueue(t.encode(`data: ${JSON.stringify(r)}\n\n`));
		} finally {
			n.close();
		}
	} });
	return new Response(n, {
		status: 200,
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive"
		}
	});
}
async function h(e, t, n, r) {
	try {
		let { handleAgentChat: i } = await import("../handler-tTUTV4P5.js"), { message: a, sessionId: o, history: s } = await e.req.json();
		if (!a || typeof a != "string") return e.json({ error: "message is required and must be a string" }, 400);
		let c = f(e, t);
		if (!c) return e.json({ error: "No API key configured. Set agent.apiKey in server config or send X-Agent-Api-Key header." }, 401);
		let { providerOverride: l, modelOverride: u, baseURLOverride: d } = p(e, t), h = await r(e), g = t.buildSystemContext?.(h);
		return m(i({
			message: a,
			sessionId: o,
			history: s,
			semanticLayer: n,
			securityContext: h,
			agentConfig: t,
			apiKey: c,
			systemContext: g,
			providerOverride: l,
			modelOverride: u,
			baseURLOverride: d
		}));
	} catch (t) {
		return console.error("Agent chat error:", t), e.json({ error: t instanceof Error ? t.message : "Agent chat failed" }, 500);
	}
}
//#endregion
//#region src/adapters/hono/index.ts
function g(e) {
	return {
		getHeader: (t) => e.req.header(t),
		getBody: async () => {
			try {
				return await e.req.json();
			} catch {
				return null;
			}
		},
		getQueryParam: (t) => e.req.query(t),
		send: (t, n) => e.json(n, t),
		setHeader: (t, n) => {
			e.header(t, n);
		},
		sendEmpty: (t) => e.body(null, t),
		sendSse: (t, n) => (e.header("Content-Type", "text/event-stream"), e.header("Cache-Control", "no-cache"), e.header("Connection", "keep-alive"), e.body(n, t))
	};
}
function _(f) {
	let { cubes: p, drizzle: m, schema: _, extractSecurityContext: v, engineType: y, cors: b, basePath: x = "/cubejs-api/v1", cache: S, mcp: C = { enabled: !0 }, agent: w } = f;
	if (!f.semanticLayer && (!p || p.length === 0)) throw Error("Either semanticLayer or a non-empty cubes array must be provided");
	let T = new u();
	if (b) {
		let e = {
			...b,
			allowHeaders: s(b.allowHeaders)
		};
		T.use("/*", d(e));
	}
	let E = f.semanticLayer ?? new e({
		drizzle: m,
		schema: _,
		engineType: y,
		cache: S,
		rlsSetup: f.rlsSetup
	});
	!f.semanticLayer && p && p.forEach((e) => {
		E.registerCube(e);
	});
	let D = l({
		semanticLayer: E,
		onError: (e) => console.error("Query execution error:", e),
		mcp: C
	}), O = (e) => () => v(e);
	if (T.post(`${x}/load`, (e) => D.handleLoadPost(g(e), O(e))), T.get(`${x}/load`, (e) => D.handleLoadGet(g(e), O(e))), T.post(`${x}/batch`, (e) => D.handleBatchPost(g(e), O(e))), T.get(`${x}/meta`, (e) => D.handleMetaGet(g(e), O(e))), T.post(`${x}/sql`, (e) => D.handleSqlPost(g(e), O(e))), T.get(`${x}/sql`, (e) => D.handleSqlGet(g(e), O(e))), T.post(`${x}/dry-run`, (e) => D.handleDryRunPost(g(e), O(e))), T.get(`${x}/dry-run`, (e) => D.handleDryRunGet(g(e), O(e))), T.post(`${x}/explain`, (e) => D.handleExplainPost(g(e), O(e))), w && T.post(`${x}/agent/chat`, (e) => h(e, w, E, (e) => Promise.resolve(v(e)).then((t) => c(t, (t) => e.req.header(t))))), C.enabled !== !1) {
		let e = C.basePath ?? "/mcp";
		T.post(`${e}`, (e) => D.handleMcpPost(g(e), O(e))), T.delete(`${e}`, (e) => {
			let n = t(e.req.header("origin"), r(C));
			return n.valid ? C.resourceMetadataUrl && !i(e.req.header("authorization")) ? (e.header("WWW-Authenticate", a(C.resourceMetadataUrl)), e.json({ error: "Bearer token required" }, 401)) : e.json({ error: "Session termination not supported" }, 405) : e.json({ error: n.reason }, 403);
		}), T.get(`${e}`, (e) => {
			let s = t(e.req.header("origin"), r(C));
			if (!s.valid) return e.json({ error: s.reason }, 403);
			if (C.resourceMetadataUrl && !i(e.req.header("authorization"))) return e.header("WWW-Authenticate", a(C.resourceMetadataUrl)), e.json({ error: "Bearer token required" }, 401);
			let c = new TextEncoder(), l = n(), u, d = new ReadableStream({
				start(e) {
					e.enqueue(c.encode(o({
						jsonrpc: "2.0",
						method: "mcp/ready",
						params: { protocol: "streamable-http" }
					}, l, 15e3))), u = setInterval(() => {
						e.enqueue(c.encode(": keep-alive\n\n"));
					}, 15e3);
				},
				cancel() {
					clearInterval(u);
				}
			});
			return new Response(d, {
				status: 200,
				headers: {
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache",
					Connection: "keep-alive"
				}
			});
		});
	}
	return T;
}
function v(e, t) {
	let n = _(t);
	return e.route("/", n), e;
}
function y(e) {
	return v(new u(), e);
}
//#endregion
export { y as createCubeApp, _ as createCubeRoutes, v as mountCubeRoutes };
