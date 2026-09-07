import { a as e, i as t, l as n, o as r, r as i, u as a } from "./utils-ixb9YIRy.js";
import { C as o, S as s, _ as c, a as l, b as u, c as d, g as f, h as p, i as m, l as h, m as g, p as _, r as v, s as y, v as b, w as x, x as S, y as C } from "./mcp-transport-Dea5vjws.js";
//#region src/adapters/locale.ts
var w = "x-dc-locale";
function T(e) {
	if (!e) return;
	let t = (Array.isArray(e) ? e[0] : e).split(",")[0]?.trim();
	if (t && /^[A-Za-z0-9-]{2,35}$/.test(t)) return t;
}
function E(e) {
	return T(e(w));
}
function D(e, t) {
	let n = e && typeof e == "object" ? e : {}, r = typeof n.locale == "string" ? n.locale : void 0, i = t ?? r ?? "en-GB";
	return r === i ? n : {
		...n,
		locale: i
	};
}
function O(e) {
	let t = Array.isArray(e) ? [...e] : (e ?? "").split(",").map((e) => e.trim()).filter(Boolean);
	return t.some((e) => e.toLowerCase() === "x-dc-locale") || t.push("X-DC-Locale"), t;
}
//#endregion
//#region src/adapters/core/http-port.ts
var k = "private, no-store";
function A(e) {
	return {
		getHeader: (t) => e.getHeader(t),
		getBody: () => e.getBody(),
		getQueryParam: (t) => e.getQueryParam(t),
		setHeader: (t, n) => e.setHeader(t, n),
		send: (t, n) => (e.setHeader("Cache-Control", k), e.send(t, n))
	};
}
//#endregion
//#region src/adapters/core/security-context.ts
function j(e, t) {
	return D(e, E(t));
}
async function M(e, t) {
	return j(await e(), t);
}
function N(e) {
	return String(e).replace(/\n|\r/g, "");
}
//#endregion
//#region src/adapters/core/rest-handlers.ts
function P(i) {
	async function o(e, n, a) {
		let o = i.validateQuery(e, n);
		if (!o.isValid) return a.send(400, t(`Query validation failed: ${o.errors.join(", ")}`, 400));
		let s = e.measures?.[0] || e.dimensions?.[0];
		if (!s) return a.send(400, t("No measures or dimensions specified", 400));
		let c = s.split(".")[0], l = await i.generateSQL(c, e, n);
		return a.send(200, r(e, l));
	}
	async function s(n, r) {
		try {
			let t = await M(r, (e) => n.getHeader(e));
			return n.send(200, e(i.getMetadata(t)));
		} catch (e) {
			return console.error("Metadata error:", e), n.send(500, t(e instanceof Error ? e.message : "Failed to fetch metadata", 500));
		}
	}
	async function c(e, n) {
		try {
			let t = await e.getBody();
			return await o(t?.query || t, await M(n, (t) => e.getHeader(t)), e);
		} catch (n) {
			return console.error("SQL generation error:", N(n)), e.send(500, t(n instanceof Error ? n.message : "SQL generation failed", 500));
		}
	}
	async function l(e, n) {
		try {
			let r = e.getQueryParam("query");
			if (!r) return e.send(400, t("Query parameter is required", 400));
			let i;
			try {
				i = JSON.parse(r);
			} catch {
				return e.send(400, t("Invalid JSON in query parameter", 400));
			}
			let a = await M(n, (t) => e.getHeader(t));
			return await o(i, a, e);
		} catch (n) {
			return console.error("SQL generation error:", N(n)), e.send(500, t(n instanceof Error ? n.message : "SQL generation failed", 500));
		}
	}
	async function u(e, t) {
		try {
			let n = await e.getBody(), r = n?.query || n, o = await M(t, (t) => e.getHeader(t)), s = await a(r, o, i);
			return e.send(200, s);
		} catch (t) {
			return console.error("Dry-run error:", t), e.send(400, {
				error: t instanceof Error ? t.message : "Dry-run validation failed",
				valid: !1
			});
		}
	}
	async function d(e, t) {
		try {
			let n = e.getQueryParam("query");
			if (!n) return e.send(400, {
				error: "Query parameter is required",
				valid: !1
			});
			let r = JSON.parse(n), o = await M(t, (t) => e.getHeader(t)), s = await a(r, o, i);
			return e.send(200, s);
		} catch (t) {
			return console.error("Dry-run error:", t), e.send(400, {
				error: t instanceof Error ? t.message : "Dry-run validation failed",
				valid: !1
			});
		}
	}
	async function f(e, r) {
		try {
			let a = (await e.getBody())?.queries;
			if (!a || !Array.isArray(a)) return e.send(400, t("Request body must contain a \"queries\" array", 400));
			if (a.length === 0) return e.send(400, t("Queries array cannot be empty", 400));
			let o = await M(r, (t) => e.getHeader(t)), s = e.getHeader("x-cache-control") === "no-cache", c = await n(a, o, i, { skipCache: s });
			return e.send(200, c);
		} catch (n) {
			return console.error("Batch execution error:", n), e.send(500, t(n instanceof Error ? n.message : "Batch execution failed", 500));
		}
	}
	async function p(e, t) {
		try {
			let n = await e.getBody(), r = n?.query || n, a = n?.options || {}, o = await M(t, (t) => e.getHeader(t)), s = i.validateQuery(r, o);
			if (!s.isValid) return e.send(400, { error: `Query validation failed: ${s.errors.join(", ")}` });
			let c = await i.explainQuery(r, o, a);
			return e.send(200, c);
		} catch (t) {
			return console.error("Explain error:", t), e.send(500, { error: t instanceof Error ? t.message : "Explain query failed" });
		}
	}
	return {
		handleMetaGet: s,
		handleSqlGet: l,
		handleSqlPost: c,
		handleDryRunGet: d,
		handleDryRunPost: u,
		handleBatchPost: f,
		handleExplainPost: p
	};
}
//#endregion
//#region src/adapters/core/mcp-handler.ts
function F(e, t) {
	let n = e?.code ?? -32603, r = e?.data, i = e.message || "MCP request failed";
	return m(t ?? null, n, i, r);
}
function I(e, t) {
	let n = !!t.app, r = typeof t.app == "object" ? t.app : void 0, i = {
		resources: u(t.resources),
		prompts: C(t.prompts),
		instructions: b(t.instructions)
	};
	async function a(a, u) {
		if (t.resourceMetadataUrl && !h(a.getHeader("authorization"))) return a.setHeader("WWW-Authenticate", y(t.resourceMetadataUrl)), a.send(401, { error: "Bearer token required" });
		let b = o(a.getHeader("origin"), p(t));
		if (!b.valid) return a.send(403, m(null, -32600, b.reason));
		let C = a.getHeader("accept");
		if (!s(C)) return a.send(400, m(null, -32600, "Accept header must include both application/json and text/event-stream"));
		let w = g({ "mcp-protocol-version": a.getHeader("mcp-protocol-version") });
		if (!w.ok) return a.send(426, {
			error: "Unsupported MCP protocol version",
			supported: w.supported
		});
		let T = f(await a.getBody());
		if (!T) return a.send(400, m(null, -32600, "Invalid JSON-RPC 2.0 request"));
		let E = x(C), D = T.method === "initialize", { resources: O, prompts: k, instructions: A } = i;
		try {
			let i = await d(T.method, T.params, {
				semanticLayer: e,
				extractSecurityContext: () => M(u, (e) => a.getHeader(e)),
				rawRequest: void 0,
				rawResponse: void 0,
				negotiatedProtocol: w.negotiated,
				resources: O,
				prompts: k,
				instructions: A,
				appEnabled: n,
				appConfig: r,
				serverName: t.serverName
			});
			if (_(T)) return a.sendEmpty(202);
			let o = D && i && typeof i == "object" && "sessionId" in i ? i.sessionId : void 0;
			o && a.setHeader(v, o);
			let s = l(T.id ?? null, i);
			if (E) {
				let e = c();
				return a.sendSse(200, `id: ${e}\n\n` + S(s, e));
			}
			return a.send(200, s);
		} catch (e) {
			if (_(T)) return console.error("MCP notification processing error:", N(e)), a.sendEmpty(202);
			console.error("MCP RPC error:", N(e));
			let t = F(e, T.id);
			if (E) {
				let e = c();
				return a.sendSse(200, `id: ${e}\n\n` + S(t, e));
			}
			return a.send(200, t);
		}
	}
	return { handleMcpPost: a };
}
//#endregion
//#region src/adapters/core/cube-http-handler.ts
function L(e) {
	let { semanticLayer: n, onError: r, mcp: a = {} } = e, o = P(n), { handleMcpPost: s } = I(n, a);
	function c(e, n) {
		return r(e), n.send(500, t(e instanceof Error ? e.message : "Query execution failed", 500));
	}
	async function l(e, r, a) {
		let o = await M(a, (e) => r.getHeader(e)), s = n.validateQuery(e, o);
		if (!s.isValid) return r.send(400, t(`Query validation failed: ${s.errors.join(", ")}`, 400, s.issues));
		let c = r.getHeader("x-cache-control") === "no-cache", l = await n.executeMultiCubeQuery(e, o, { skipCache: c });
		return r.send(200, i(e, l, n));
	}
	async function u(e, t) {
		try {
			let n = await e.getBody();
			return await l(n?.query || n, e, t);
		} catch (t) {
			return c(t, e);
		}
	}
	async function d(e, n) {
		try {
			let r = e.getQueryParam("query");
			if (!r) return e.send(400, t("Query parameter is required", 400));
			let i;
			try {
				i = JSON.parse(r);
			} catch {
				return e.send(400, t("Invalid JSON in query parameter", 400));
			}
			return await l(i, e, n);
		} catch (t) {
			return c(t, e);
		}
	}
	return {
		handleLoadGet: (e, t) => d(A(e), t),
		handleLoadPost: (e, t) => u(A(e), t),
		handleMetaGet: (e, t) => o.handleMetaGet(A(e), t),
		handleSqlGet: (e, t) => o.handleSqlGet(A(e), t),
		handleSqlPost: (e, t) => o.handleSqlPost(A(e), t),
		handleDryRunGet: (e, t) => o.handleDryRunGet(A(e), t),
		handleDryRunPost: (e, t) => o.handleDryRunPost(A(e), t),
		handleBatchPost: (e, t) => o.handleBatchPost(A(e), t),
		handleExplainPost: (e, t) => o.handleExplainPost(A(e), t),
		handleMcpPost: s
	};
}
//#endregion
export { A as a, D as c, k as i, M as n, O as o, j as r, E as s, L as t };
