import { i as e, st as t } from "../utils-ixb9YIRy.js";
import { t as n } from "../compiler-DEsJzXiW.js";
import { C as r, _ as i, h as a, l as o, s, x as c } from "../mcp-transport-Dea5vjws.js";
import { o as l, r as u, t as d } from "../core-B3kUdRDt.js";
//#region src/adapters/fastify/index.ts
function f(e, t) {
	let n = e.headers[t.toLowerCase()];
	return Array.isArray(n) ? n[0] : n;
}
function p(e, t) {
	return {
		getHeader: (t) => f(e, t),
		getBody: async () => e.body,
		getQueryParam: (t) => e.query?.[t],
		send: (e, n) => t.status(e).send(n),
		setHeader: (e, n) => {
			t.header(e, n);
		},
		sendEmpty: (e) => t.status(e).send(),
		sendSse: (e, n) => (t.header("Content-Type", "text/event-stream"), t.header("Cache-Control", "no-cache"), t.header("Connection", "keep-alive"), t.status(e).send(n))
	};
}
var m = function(t, m, h) {
	let { cubes: g, drizzle: _, schema: v, extractSecurityContext: y, engineType: b, cors: x, basePath: S = "/cubejs-api/v1", bodyLimit: C = 10485760, cache: w, mcp: T = { enabled: !0 }, agent: E } = m;
	if (!m.semanticLayer && (!g || g.length === 0)) return h(/* @__PURE__ */ Error("At least one cube must be provided in the cubes array, or pass a pre-configured semanticLayer"));
	if (x) {
		let e = {
			...x,
			allowedHeaders: l(x.allowedHeaders)
		};
		t.register(import("@fastify/cors"), e);
	}
	t.addHook("onRequest", async (e, t) => {
		e.method === "POST" && (e.body = void 0);
	});
	let D = m.semanticLayer ?? new n({
		drizzle: _,
		schema: v,
		engineType: b,
		cache: w,
		rlsSetup: m.rlsSetup
	});
	!m.semanticLayer && g && g.forEach((e) => {
		D.registerCube(e);
	});
	let O = d({
		semanticLayer: D,
		onError: (e) => t.log.error(e, "Query execution error"),
		mcp: T
	}), k = (e) => () => y(e), A = {
		bodyLimit: C,
		schema: { body: {
			type: "object",
			additionalProperties: !0
		} }
	}, j = { schema: { querystring: {
		type: "object",
		properties: { query: { type: "string" } },
		required: ["query"]
	} } };
	if (t.post(`${S}/load`, A, (e, t) => O.handleLoadPost(p(e, t), k(e))), t.get(`${S}/load`, j, (e, t) => O.handleLoadGet(p(e, t), k(e))), t.post(`${S}/batch`, {
		bodyLimit: C,
		schema: { body: {
			type: "object",
			required: ["queries"],
			properties: { queries: {
				type: "array",
				items: { type: "object" }
			} }
		} }
	}, (e, t) => O.handleBatchPost(p(e, t), k(e))), t.get(`${S}/meta`, (e, t) => O.handleMetaGet(p(e, t), k(e))), t.post(`${S}/sql`, A, (e, t) => O.handleSqlPost(p(e, t), k(e))), t.get(`${S}/sql`, j, (e, t) => O.handleSqlGet(p(e, t), k(e))), t.post(`${S}/dry-run`, A, (e, t) => O.handleDryRunPost(p(e, t), k(e))), t.get(`${S}/dry-run`, j, (e, t) => O.handleDryRunGet(p(e, t), k(e))), t.post(`${S}/explain`, A, (e, t) => O.handleExplainPost(p(e, t), k(e))), E && t.post(`${S}/agent/chat`, {
		bodyLimit: C,
		schema: { body: {
			type: "object",
			additionalProperties: !0
		} }
	}, async (e, t) => {
		try {
			let { handleAgentChat: n } = await import("../handler-tTUTV4P5.js"), { message: r, sessionId: i, history: a } = e.body;
			if (!r || typeof r != "string") return t.status(400).send({ error: "message is required and must be a string" });
			let o = (E.apiKey || "").trim();
			if (E.allowClientApiKey) {
				let t = f(e, "x-agent-api-key");
				t && (o = t.trim());
			}
			if (!o) return t.status(401).send({ error: "No API key configured. Set agent.apiKey in server config or send X-Agent-Api-Key header." });
			let s = E.allowClientApiKey ? f(e, "x-agent-provider") : void 0, c = E.allowClientApiKey ? f(e, "x-agent-model") : void 0, l = E.allowClientApiKey ? f(e, "x-agent-provider-endpoint") : void 0, d = u(await y(e), (t) => f(e, t)), p = E.buildSystemContext?.(d);
			t.raw.writeHead(200, {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive"
			});
			try {
				let e = n({
					message: r,
					sessionId: i,
					history: a,
					semanticLayer: D,
					securityContext: d,
					agentConfig: E,
					apiKey: o,
					systemContext: p,
					providerOverride: s,
					modelOverride: c,
					baseURLOverride: l
				});
				for await (let n of e) t.raw.write(`data: ${JSON.stringify(n)}\n\n`);
			} catch (e) {
				let n = {
					type: "error",
					data: { message: e instanceof Error ? e.message : "Stream failed" }
				};
				t.raw.write(`data: ${JSON.stringify(n)}\n\n`);
			} finally {
				t.raw.end();
			}
		} catch (n) {
			if (e.log.error(n, "Agent chat error"), !t.raw.headersSent) return t.status(500).send({ error: n instanceof Error ? n.message : "Agent chat failed" });
		}
	}), T.enabled !== !1) {
		let e = T.basePath ?? "/mcp";
		t.post(`${e}`, {
			bodyLimit: C,
			schema: { body: {
				type: "object",
				additionalProperties: !0
			} }
		}, (e, t) => O.handleMcpPost(p(e, t), k(e))), t.get(`${e}`, async (e, t) => {
			let n = r(e.headers.origin, a(T));
			if (!n.valid) return t.status(403).send({ error: n.reason });
			if (T.resourceMetadataUrl && !o(e.headers.authorization)) return t.header("WWW-Authenticate", s(T.resourceMetadataUrl)), t.status(401).send({ error: "Bearer token required" });
			let l = i();
			t.raw.writeHead(200, {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive"
			}), t.raw.write(c({
				jsonrpc: "2.0",
				method: "mcp/ready",
				params: { protocol: "streamable-http" }
			}, l, 15e3));
			let u = setInterval(() => {
				t.raw.write(": keep-alive\n\n");
			}, 15e3);
			e.raw.on("close", () => {
				clearInterval(u);
			});
		}), t.delete(`${e}`, async (e, t) => {
			let n = r(e.headers.origin, a(T));
			return n.valid ? T.resourceMetadataUrl && !o(e.headers.authorization) ? (t.header("WWW-Authenticate", s(T.resourceMetadataUrl)), t.status(401).send({ error: "Bearer token required" })) : t.status(405).send({ error: "Session termination not supported" }) : t.status(403).send({ error: n.reason });
		});
	}
	t.setErrorHandler(async (t, n, r) => {
		n.log.error(t, "Fastify cube adapter error"), r.statusCode < 400 && r.status(500);
		let i = t instanceof Error ? t : String(t);
		return e(i, r.statusCode);
	}), h();
};
async function h(e, t) {
	await e.register(m, t);
}
function g(e) {
	let n = t("fastify")({ logger: !0 });
	return n.register(m, e), n;
}
//#endregion
export { g as createCubeApp, m as cubePlugin, h as registerCubeRoutes };
