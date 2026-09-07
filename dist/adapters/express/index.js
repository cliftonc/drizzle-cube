import { i as e } from "../utils-ixb9YIRy.js";
import { t } from "../compiler-DEsJzXiW.js";
import { C as n, _ as r, h as i, l as a, s as o, x as s } from "../mcp-transport-Dea5vjws.js";
import { o as c, r as l, t as u } from "../core-B3kUdRDt.js";
import d, { Router as f } from "express";
import p from "cors";
//#region src/adapters/express/index.ts
function m(e, t) {
	return {
		getHeader: (t) => e.get(t),
		getBody: async () => e.body,
		getQueryParam: (t) => e.query[t],
		send: (e, n) => t.status(e).json(n),
		setHeader: (e, n) => {
			t.setHeader(e, n);
		},
		sendEmpty: (e) => t.status(e).end(),
		sendSse: (e, n) => (t.status(e), t.setHeader("Content-Type", "text/event-stream"), t.setHeader("Cache-Control", "no-cache"), t.setHeader("Connection", "keep-alive"), t.write(n), t.end())
	};
}
function h(h) {
	let { cubes: g, drizzle: _, schema: v, extractSecurityContext: y, engineType: b, cors: x, basePath: S = "/cubejs-api/v1", jsonLimit: C = "10mb", cache: w, mcp: T = { enabled: !0 }, agent: E } = h;
	if (!h.semanticLayer && (!g || g.length === 0)) throw Error("At least one cube must be provided in the cubes array, or pass a pre-configured semanticLayer");
	let D = f();
	if (x) {
		let e = {
			...x,
			allowedHeaders: c(x.allowedHeaders)
		};
		D.use(p(e));
	}
	D.use(d.json({ limit: C })), D.use(d.urlencoded({
		extended: !0,
		limit: C
	}));
	let O = h.semanticLayer ?? new t({
		drizzle: _,
		schema: v,
		engineType: b,
		cache: w,
		rlsSetup: h.rlsSetup
	});
	!h.semanticLayer && g && g.forEach((e) => {
		O.registerCube(e);
	});
	let k = u({
		semanticLayer: O,
		onError: (e) => console.error("Query execution error:", e),
		mcp: T
	}), A = (e, t) => () => y(e, t);
	if (D.post(`${S}/load`, async (e, t) => {
		await k.handleLoadPost(m(e, t), A(e, t));
	}), D.get(`${S}/load`, async (e, t) => {
		await k.handleLoadGet(m(e, t), A(e, t));
	}), D.post(`${S}/batch`, async (e, t) => {
		await k.handleBatchPost(m(e, t), A(e, t));
	}), D.get(`${S}/meta`, async (e, t) => {
		await k.handleMetaGet(m(e, t), A(e, t));
	}), D.post(`${S}/sql`, async (e, t) => {
		await k.handleSqlPost(m(e, t), A(e, t));
	}), D.get(`${S}/sql`, async (e, t) => {
		await k.handleSqlGet(m(e, t), A(e, t));
	}), D.post(`${S}/dry-run`, async (e, t) => {
		await k.handleDryRunPost(m(e, t), A(e, t));
	}), D.get(`${S}/dry-run`, async (e, t) => {
		await k.handleDryRunGet(m(e, t), A(e, t));
	}), D.post(`${S}/explain`, async (e, t) => {
		await k.handleExplainPost(m(e, t), A(e, t));
	}), E && D.post(`${S}/agent/chat`, async (e, t) => {
		try {
			let { handleAgentChat: n } = await import("../handler-tTUTV4P5.js"), { message: r, sessionId: i, history: a } = e.body;
			if (!r || typeof r != "string") return t.status(400).json({ error: "message is required and must be a string" });
			let o = (E.apiKey || "").trim();
			if (E.allowClientApiKey) {
				let t = e.headers["x-agent-api-key"];
				t && (o = t.trim());
			}
			if (!o) return t.status(401).json({ error: "No API key configured. Set agent.apiKey in server config or send X-Agent-Api-Key header." });
			let s = E.allowClientApiKey ? e.headers["x-agent-provider"] : void 0, c = E.allowClientApiKey ? e.headers["x-agent-model"] : void 0, u = E.allowClientApiKey ? e.headers["x-agent-provider-endpoint"] : void 0, d = l(await y(e, t), (t) => e.get(t)), f = E.buildSystemContext?.(d);
			t.writeHead(200, {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive"
			});
			try {
				let e = n({
					message: r,
					sessionId: i,
					history: a,
					semanticLayer: O,
					securityContext: d,
					agentConfig: E,
					apiKey: o,
					systemContext: f,
					providerOverride: s,
					modelOverride: c,
					baseURLOverride: u
				});
				for await (let n of e) t.write(`data: ${JSON.stringify(n)}\n\n`);
			} catch (e) {
				let n = {
					type: "error",
					data: { message: e instanceof Error ? e.message : "Stream failed" }
				};
				t.write(`data: ${JSON.stringify(n)}\n\n`);
			} finally {
				t.end();
			}
		} catch (e) {
			console.error("Agent chat error:", e), t.headersSent || t.status(500).json({ error: e instanceof Error ? e.message : "Agent chat failed" });
		}
	}), T.enabled !== !1) {
		let e = T.basePath ?? "/mcp";
		D.post(`${e}`, async (e, t) => {
			await k.handleMcpPost(m(e, t), A(e, t));
		}), D.get(`${e}`, async (e, t) => {
			let c = n(e.headers.origin, i(T));
			if (!c.valid) return t.status(403).json({ error: c.reason });
			if (T.resourceMetadataUrl && !a(e.headers.authorization)) return t.setHeader("WWW-Authenticate", o(T.resourceMetadataUrl)), t.status(401).json({ error: "Bearer token required" });
			let l = r();
			t.status(200), t.setHeader("Content-Type", "text/event-stream"), t.setHeader("Cache-Control", "no-cache"), t.setHeader("Connection", "keep-alive"), t.write(s({
				jsonrpc: "2.0",
				method: "mcp/ready",
				params: { protocol: "streamable-http" }
			}, l, 15e3));
			let u = setInterval(() => {
				t.write(": keep-alive\n\n");
			}, 15e3);
			e.on("close", () => {
				clearInterval(u);
			});
		}), D.delete(`${e}`, (e, t) => {
			let r = n(e.headers.origin, i(T));
			return r.valid ? T.resourceMetadataUrl && !a(e.headers.authorization) ? (t.setHeader("WWW-Authenticate", o(T.resourceMetadataUrl)), t.status(401).json({ error: "Bearer token required" })) : t.status(405).json({ error: "Session termination not supported" }) : t.status(403).json({ error: r.reason });
		});
	}
	return D.use((t, n, r, i) => {
		console.error("Express adapter error:", t), r.headersSent || r.status(500).json(e(t, 500));
	}), D;
}
function g(e, t) {
	let n = h(t);
	return e.use("/", n), e;
}
function _(e) {
	return g(d(), e);
}
//#endregion
export { _ as createCubeApp, h as createCubeRouter, g as mountCubeRoutes };
