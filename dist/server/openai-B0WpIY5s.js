//#region src/server/agent/providers/openai.ts
function* e(e, t) {
	let n = e.index ?? 0;
	if (e.id && (t.set(n, {
		id: e.id,
		name: e.function?.name || "",
		arguments: ""
	}), yield {
		type: "tool_use_start",
		id: e.id,
		name: e.function?.name || ""
	}), e.function?.name && t.has(n)) {
		let r = t.get(n);
		r.name ||= e.function.name;
	}
	if (e.function?.arguments) {
		let r = t.get(n);
		r && (r.arguments += e.function.arguments, yield {
			type: "tool_input_delta",
			json: e.function.arguments
		});
	}
}
function* t(e, t) {
	for (let [e, n] of t) {
		let r = {}, i = !1;
		try {
			n.arguments && (r = JSON.parse(n.arguments));
		} catch {
			i = !0;
		}
		yield {
			type: "tool_use_end",
			id: n.id,
			input: r,
			parseError: i
		}, t.delete(e);
	}
	yield {
		type: "message_meta",
		stopReason: e
	};
}
function* n(n, r) {
	n.usage && (yield {
		type: "message_meta",
		inputTokens: n.usage.prompt_tokens,
		outputTokens: n.usage.completion_tokens,
		stopReason: ""
	});
	let i = n.choices?.[0];
	if (!i) return;
	let a = i.delta;
	if (a) {
		if (a.content && (yield {
			type: "text_delta",
			text: a.content
		}), a.tool_calls) for (let t of a.tool_calls) yield* e(t, r);
		i.finish_reason && (yield* t(i.finish_reason, r));
	}
}
var r = class {
	client;
	apiKey;
	baseURL;
	initialized = !1;
	constructor(e, t) {
		this.apiKey = e, this.baseURL = t?.baseURL;
	}
	async ensureClient() {
		if (this.initialized) return;
		let e;
		try {
			let t = await import(
				/* webpackIgnore: true */
				"./openai-BzXOoGXE.js"
);
			e = t.default || t.OpenAI || t;
		} catch {
			throw Error("openai is required for the OpenAI provider. Install it with: npm install openai");
		}
		let t = { apiKey: this.apiKey };
		this.baseURL && (t.baseURL = this.baseURL), this.client = new e(t), this.initialized = !0;
	}
	async createStream(e) {
		await this.ensureClient();
		let { messages: t } = this.formatMessages(e.messages, e.system);
		return this.client.chat.completions.create({
			model: e.model,
			max_completion_tokens: e.maxTokens,
			tools: this.formatTools(e.tools),
			messages: t,
			stream: !0,
			stream_options: { include_usage: !0 }
		});
	}
	async *parseStreamEvents(e) {
		let t = /* @__PURE__ */ new Map();
		for await (let r of e) yield* n(r, t);
	}
	formatTools(e) {
		return e.map((e) => ({
			type: "function",
			function: {
				name: e.name,
				description: e.description,
				parameters: e.parameters
			}
		}));
	}
	formatMessages(e, t) {
		let n = [{
			role: "system",
			content: t
		}];
		for (let t of e) if (t.role === "user") n.push({
			role: "user",
			content: typeof t.content == "string" ? t.content : JSON.stringify(t.content)
		});
		else if (t.role === "assistant") {
			if (typeof t.content == "string") n.push({
				role: "assistant",
				content: t.content
			});
			else {
				let e = t.content, r = e.filter((e) => e.type === "text").map((e) => e.text).join(""), i = e.filter((e) => e.type === "tool_use").map((e) => ({
					id: e.id,
					type: "function",
					function: {
						name: e.name,
						arguments: JSON.stringify(e.input || {})
					}
				})), a = { role: "assistant" };
				r && (a.content = r), i.length > 0 && (a.tool_calls = i), n.push(a);
			}
		} else t.role === "tool" ? n.push(t) : t.role === "tool_result" && n.push({
			role: "user",
			content: typeof t.content == "string" ? t.content : JSON.stringify(t.content)
		});
		return { messages: n };
	}
	formatToolResults(e) {
		return e.map((e) => ({
			role: "tool",
			tool_call_id: e.toolUseId,
			content: e.content
		}));
	}
	shouldContinue(e) {
		return e === "tool_calls";
	}
	isTruncated(e) {
		return e === "length";
	}
	formatError(e) {
		if (!e || !(e instanceof Error)) return "Something went wrong. Please try again.";
		let t = e.message || "", n = e;
		return n.status === 429 ? "Too many requests. Please wait a moment and try again." : n.status === 401 ? "Authentication failed. Please check your API key configuration." : n.status === 503 || n.status === 502 ? "The AI service is temporarily unavailable. Please try again in a moment." : n.status === 400 ? "There was a problem with the request. Please try again." : t.startsWith("{") || t.startsWith("Error: {") ? "The AI service encountered an error. Please try again." : t;
	}
};
//#endregion
export { r as OpenAIProvider };
