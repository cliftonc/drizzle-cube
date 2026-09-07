//#region src/server/agent/providers/google.ts
function e(n, r = 0) {
	if (!n || typeof n != "object") return "value";
	let i = n, a = i.enum;
	if (Array.isArray(a) && a.length > 0) return a.map((e) => typeof e == "string" ? `"${e}"` : String(e)).join("|");
	let o = typeof i.type == "string" ? i.type.toLowerCase() : "value";
	if (o === "array") return r >= t ? "array" : `array of ${e(i.items, r + 1)}`;
	if (o === "object") {
		let n = i.properties;
		if (!n || r >= t) return "object";
		let a = new Set(Array.isArray(i.required) ? i.required : []);
		return `{ ${Object.entries(n).map(([t, n]) => {
			let i = a.has(t) ? " (required)" : "";
			return `${t}: ${e(n, r + 1)}${i}`;
		}).join(", ")} }`;
	}
	return o;
}
var t = 3;
function n(t) {
	let r = {}, i = [];
	for (let [a, o] of Object.entries(t)) if (a === "type" && typeof o == "string") r[a] = o.toUpperCase();
	else if (a === "properties" && typeof o == "object" && o) {
		let e = {};
		for (let [t, r] of Object.entries(o)) e[t] = typeof r == "object" && r ? n(r) : r;
		r[a] = e;
	} else a === "items" && typeof o == "object" && o ? r[a] = n(o) : (a === "anyOf" || a === "oneOf" || a === "allOf") && Array.isArray(o) ? r[a] = o.map((e) => e && typeof e == "object" ? n(e) : e) : a === "additionalProperties" ? o && typeof o == "object" && i.push(`Each value is: ${e(o)}.`) : a === "enum" && Array.isArray(o) && o.some((e) => typeof e != "string") ? i.push(`Allowed values: ${o.join(", ")}.`) : r[a] = o;
	return i.length > 0 && (r.description = [typeof r.description == "string" ? r.description : "", ...i].filter(Boolean).join(" ")), r;
}
function r(e) {
	return e === "STOP" ? "stop" : e === "MAX_TOKENS" ? "max_tokens" : e;
}
function* i(e) {
	if (e.text && !e.thought && (yield {
		type: "text_delta",
		text: e.text
	}), e.functionCall) {
		let t = `gemini-tc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, n = e.thoughtSignature ? { thoughtSignature: e.thoughtSignature } : void 0;
		yield {
			type: "tool_use_start",
			id: t,
			name: e.functionCall.name,
			...n ? { metadata: n } : {}
		}, yield {
			type: "tool_input_delta",
			json: JSON.stringify(e.functionCall.args || {})
		}, yield { type: "tool_use_end" };
	}
}
function a(e) {
	let t = e._toolResults;
	if (t && t.length > 0) return {
		role: "user",
		parts: t.map((e) => ({ functionResponse: {
			name: e.toolName || e.toolUseId,
			response: {
				content: e.content,
				isError: e.isError || !1
			}
		} }))
	};
	let n = typeof e.content == "string" ? e.content : JSON.stringify(e.content);
	return n ? {
		role: "user",
		parts: [{ text: n }]
	} : null;
}
function o(e) {
	let t = [];
	for (let n of e) if (n.type === "text" && n.text) t.push({ text: n.text });
	else if (n.type === "tool_use") {
		let e = { functionCall: {
			name: n.name,
			args: n.input || {}
		} };
		n.metadata?.thoughtSignature && (e.thoughtSignature = n.metadata.thoughtSignature), t.push(e);
	}
	return t;
}
function s(e) {
	if (e.role === "tool_result") return a(e);
	if (e.role === "user") return {
		role: "user",
		parts: [{ text: typeof e.content == "string" ? e.content : JSON.stringify(e.content) }]
	};
	if (e.role === "assistant") {
		if (typeof e.content == "string") return {
			role: "model",
			parts: [{ text: e.content }]
		};
		let t = o(e.content);
		return t.length > 0 ? {
			role: "model",
			parts: t
		} : null;
	}
	return null;
}
var c = class {
	apiKey;
	sdk;
	initialized = !1;
	constructor(e) {
		this.apiKey = e;
	}
	async ensureSDK() {
		if (!this.initialized) {
			try {
				this.sdk = await import(
					/* webpackIgnore: true */
					"./dist-ChBfLb7x.js"
);
			} catch {
				throw Error("@google/generative-ai is required for the Google provider. Install it with: npm install @google/generative-ai");
			}
			this.initialized = !0;
		}
	}
	async createStream(e) {
		await this.ensureSDK();
		let { GoogleGenerativeAI: t } = this.sdk, n = new t(this.apiKey).getGenerativeModel({
			model: e.model,
			systemInstruction: e.system,
			generationConfig: { maxOutputTokens: e.maxTokens }
		}), { messages: r } = this.formatMessages(e.messages, e.system), i = this.formatTools(e.tools);
		return (await n.generateContentStream({
			contents: r,
			tools: i.length > 0 ? [{ functionDeclarations: i }] : void 0
		})).stream;
	}
	async *parseStreamEvents(e) {
		let t = "stop", n = !1;
		for await (let a of e) {
			let e = a;
			e.usageMetadata && (yield {
				type: "message_meta",
				inputTokens: e.usageMetadata.promptTokenCount,
				outputTokens: e.usageMetadata.candidatesTokenCount,
				stopReason: ""
			});
			let o = e.candidates?.[0];
			if (!o) continue;
			o.finishReason && (t = r(o.finishReason));
			let s = o.content?.parts;
			if (s) for (let e of s) for (let t of i(e)) t.type === "tool_use_start" && (n = !0), yield t;
		}
		yield {
			type: "message_meta",
			stopReason: n ? "tool_use" : t
		};
	}
	formatTools(e) {
		return e.map((e) => ({
			name: e.name,
			description: e.description,
			parameters: n(e.parameters)
		}));
	}
	formatMessages(e, t) {
		let n = [];
		for (let t of e) {
			let e = s(t);
			e && n.push(e);
		}
		return { messages: n };
	}
	formatToolResults(e) {
		return {
			role: "tool_result",
			content: e.map((e) => `${e.toolName || e.toolUseId}: ${e.content}`).join("\n"),
			_toolResults: e
		};
	}
	shouldContinue(e) {
		return e === "tool_use";
	}
	isTruncated(e) {
		return e === "max_tokens";
	}
	formatError(e) {
		if (!e || !(e instanceof Error)) return "Something went wrong. Please try again.";
		let t = e.message || "", n = e;
		return n.status === 429 ? "Too many requests. Please wait a moment and try again." : n.status === 403 || n.status === 401 ? "Authentication failed. Please check your API key configuration." : n.status === 503 || n.status === 500 ? "The AI service is temporarily unavailable. Please try again in a moment." : t.includes("SAFETY") ? "The request was blocked by safety filters. Please rephrase your request." : t.includes("RECITATION") ? "The response was blocked due to recitation concerns. Please try a different query." : t.startsWith("{") || t.startsWith("[") ? "The AI service encountered an error. Please try again." : t;
	}
};
//#endregion
export { c as GoogleProvider };
