//#region node_modules/@google/generative-ai/dist/index.mjs
var e;
(function(e) {
	e.STRING = "string", e.NUMBER = "number", e.INTEGER = "integer", e.BOOLEAN = "boolean", e.ARRAY = "array", e.OBJECT = "object";
})(e ||= {});
var t;
(function(e) {
	e.LANGUAGE_UNSPECIFIED = "language_unspecified", e.PYTHON = "python";
})(t ||= {});
var n;
(function(e) {
	e.OUTCOME_UNSPECIFIED = "outcome_unspecified", e.OUTCOME_OK = "outcome_ok", e.OUTCOME_FAILED = "outcome_failed", e.OUTCOME_DEADLINE_EXCEEDED = "outcome_deadline_exceeded";
})(n ||= {});
var r = [
	"user",
	"model",
	"function",
	"system"
], i;
(function(e) {
	e.HARM_CATEGORY_UNSPECIFIED = "HARM_CATEGORY_UNSPECIFIED", e.HARM_CATEGORY_HATE_SPEECH = "HARM_CATEGORY_HATE_SPEECH", e.HARM_CATEGORY_SEXUALLY_EXPLICIT = "HARM_CATEGORY_SEXUALLY_EXPLICIT", e.HARM_CATEGORY_HARASSMENT = "HARM_CATEGORY_HARASSMENT", e.HARM_CATEGORY_DANGEROUS_CONTENT = "HARM_CATEGORY_DANGEROUS_CONTENT", e.HARM_CATEGORY_CIVIC_INTEGRITY = "HARM_CATEGORY_CIVIC_INTEGRITY";
})(i ||= {});
var a;
(function(e) {
	e.HARM_BLOCK_THRESHOLD_UNSPECIFIED = "HARM_BLOCK_THRESHOLD_UNSPECIFIED", e.BLOCK_LOW_AND_ABOVE = "BLOCK_LOW_AND_ABOVE", e.BLOCK_MEDIUM_AND_ABOVE = "BLOCK_MEDIUM_AND_ABOVE", e.BLOCK_ONLY_HIGH = "BLOCK_ONLY_HIGH", e.BLOCK_NONE = "BLOCK_NONE";
})(a ||= {});
var o;
(function(e) {
	e.HARM_PROBABILITY_UNSPECIFIED = "HARM_PROBABILITY_UNSPECIFIED", e.NEGLIGIBLE = "NEGLIGIBLE", e.LOW = "LOW", e.MEDIUM = "MEDIUM", e.HIGH = "HIGH";
})(o ||= {});
var s;
(function(e) {
	e.BLOCKED_REASON_UNSPECIFIED = "BLOCKED_REASON_UNSPECIFIED", e.SAFETY = "SAFETY", e.OTHER = "OTHER";
})(s ||= {});
var c;
(function(e) {
	e.FINISH_REASON_UNSPECIFIED = "FINISH_REASON_UNSPECIFIED", e.STOP = "STOP", e.MAX_TOKENS = "MAX_TOKENS", e.SAFETY = "SAFETY", e.RECITATION = "RECITATION", e.LANGUAGE = "LANGUAGE", e.BLOCKLIST = "BLOCKLIST", e.PROHIBITED_CONTENT = "PROHIBITED_CONTENT", e.SPII = "SPII", e.MALFORMED_FUNCTION_CALL = "MALFORMED_FUNCTION_CALL", e.OTHER = "OTHER";
})(c ||= {});
var l;
(function(e) {
	e.TASK_TYPE_UNSPECIFIED = "TASK_TYPE_UNSPECIFIED", e.RETRIEVAL_QUERY = "RETRIEVAL_QUERY", e.RETRIEVAL_DOCUMENT = "RETRIEVAL_DOCUMENT", e.SEMANTIC_SIMILARITY = "SEMANTIC_SIMILARITY", e.CLASSIFICATION = "CLASSIFICATION", e.CLUSTERING = "CLUSTERING";
})(l ||= {});
var u;
(function(e) {
	e.MODE_UNSPECIFIED = "MODE_UNSPECIFIED", e.AUTO = "AUTO", e.ANY = "ANY", e.NONE = "NONE";
})(u ||= {});
var d;
(function(e) {
	e.MODE_UNSPECIFIED = "MODE_UNSPECIFIED", e.MODE_DYNAMIC = "MODE_DYNAMIC";
})(d ||= {});
var f = class extends Error {
	constructor(e) {
		super(`[GoogleGenerativeAI Error]: ${e}`);
	}
}, p = class extends f {
	constructor(e, t) {
		super(e), this.response = t;
	}
}, m = class extends f {
	constructor(e, t, n, r) {
		super(e), this.status = t, this.statusText = n, this.errorDetails = r;
	}
}, h = class extends f {}, g = class extends f {}, ee = "https://generativelanguage.googleapis.com", _ = "v1beta", v = "0.24.1", te = "genai-js", y;
(function(e) {
	e.GENERATE_CONTENT = "generateContent", e.STREAM_GENERATE_CONTENT = "streamGenerateContent", e.COUNT_TOKENS = "countTokens", e.EMBED_CONTENT = "embedContent", e.BATCH_EMBED_CONTENTS = "batchEmbedContents";
})(y ||= {});
var b = class {
	constructor(e, t, n, r, i) {
		this.model = e, this.task = t, this.apiKey = n, this.stream = r, this.requestOptions = i;
	}
	toString() {
		let e = this.requestOptions?.apiVersion || _, t = `${this.requestOptions?.baseUrl || ee}/${e}/${this.model}:${this.task}`;
		return this.stream && (t += "?alt=sse"), t;
	}
};
function x(e) {
	let t = [];
	return e?.apiClient && t.push(e.apiClient), t.push(`${te}/${v}`), t.join(" ");
}
async function S(e) {
	let t = new Headers();
	t.append("Content-Type", "application/json"), t.append("x-goog-api-client", x(e.requestOptions)), t.append("x-goog-api-key", e.apiKey);
	let n = e.requestOptions?.customHeaders;
	if (n) {
		if (!(n instanceof Headers)) try {
			n = new Headers(n);
		} catch (e) {
			throw new h(`unable to convert customHeaders value ${JSON.stringify(n)} to Headers: ${e.message}`);
		}
		for (let [e, r] of n.entries()) {
			if (e === "x-goog-api-key") throw new h(`Cannot set reserved header name ${e}`);
			if (e === "x-goog-api-client") throw new h(`Header name ${e} can only be set using the apiClient field`);
			t.append(e, r);
		}
	}
	return t;
}
async function ne(e, t, n, r, i, a) {
	let o = new b(e, t, n, r, a);
	return {
		url: o.toString(),
		fetchOptions: Object.assign(Object.assign({}, D(a)), {
			method: "POST",
			headers: await S(o),
			body: i
		})
	};
}
async function C(e, t, n, r, i, a = {}, o = fetch) {
	let { url: s, fetchOptions: c } = await ne(e, t, n, r, i, a);
	return w(s, c, o);
}
async function w(e, t, n = fetch) {
	let r;
	try {
		r = await n(e, t);
	} catch (t) {
		T(t, e);
	}
	return r.ok || await E(r, e), r;
}
function T(e, t) {
	let n = e;
	throw n.name === "AbortError" ? (n = new g(`Request aborted when fetching ${t.toString()}: ${e.message}`), n.stack = e.stack) : e instanceof m || e instanceof h || (n = new f(`Error fetching from ${t.toString()}: ${e.message}`), n.stack = e.stack), n;
}
async function E(e, t) {
	let n = "", r;
	try {
		let t = await e.json();
		n = t.error.message, t.error.details && (n += ` ${JSON.stringify(t.error.details)}`, r = t.error.details);
	} catch {}
	throw new m(`Error fetching from ${t.toString()}: [${e.status} ${e.statusText}] ${n}`, e.status, e.statusText, r);
}
function D(e) {
	let t = {};
	if (e?.signal !== void 0 || e?.timeout >= 0) {
		let n = new AbortController();
		e?.timeout >= 0 && setTimeout(() => n.abort(), e.timeout), e?.signal && e.signal.addEventListener("abort", () => {
			n.abort();
		}), t.signal = n.signal;
	}
	return t;
}
function O(e) {
	return e.text = () => {
		if (e.candidates && e.candidates.length > 0) {
			if (e.candidates.length > 1 && console.warn(`This response had ${e.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`), j(e.candidates[0])) throw new p(`${M(e)}`, e);
			return k(e);
		}
		if (e.promptFeedback) throw new p(`Text not available. ${M(e)}`, e);
		return "";
	}, e.functionCall = () => {
		if (e.candidates && e.candidates.length > 0) {
			if (e.candidates.length > 1 && console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`), j(e.candidates[0])) throw new p(`${M(e)}`, e);
			return console.warn("response.functionCall() is deprecated. Use response.functionCalls() instead."), A(e)[0];
		}
		if (e.promptFeedback) throw new p(`Function call not available. ${M(e)}`, e);
	}, e.functionCalls = () => {
		if (e.candidates && e.candidates.length > 0) {
			if (e.candidates.length > 1 && console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`), j(e.candidates[0])) throw new p(`${M(e)}`, e);
			return A(e);
		}
		if (e.promptFeedback) throw new p(`Function call not available. ${M(e)}`, e);
	}, e;
}
function k(e) {
	let t = [];
	if (e.candidates?.[0].content?.parts) for (let n of e.candidates?.[0].content?.parts) n.text && t.push(n.text), n.executableCode && t.push("\n```" + n.executableCode.language + "\n" + n.executableCode.code + "\n```\n"), n.codeExecutionResult && t.push("\n```\n" + n.codeExecutionResult.output + "\n```\n");
	return t.length > 0 ? t.join("") : "";
}
function A(e) {
	let t = [];
	if (e.candidates?.[0].content?.parts) for (let n of e.candidates?.[0].content?.parts) n.functionCall && t.push(n.functionCall);
	if (t.length > 0) return t;
}
var re = [
	c.RECITATION,
	c.SAFETY,
	c.LANGUAGE
];
function j(e) {
	return !!e.finishReason && re.includes(e.finishReason);
}
function M(e) {
	let t = "";
	if ((!e.candidates || e.candidates.length === 0) && e.promptFeedback) t += "Response was blocked", e.promptFeedback?.blockReason && (t += ` due to ${e.promptFeedback.blockReason}`), e.promptFeedback?.blockReasonMessage && (t += `: ${e.promptFeedback.blockReasonMessage}`);
	else if (e.candidates?.[0]) {
		let n = e.candidates[0];
		j(n) && (t += `Candidate was blocked due to ${n.finishReason}`, n.finishMessage && (t += `: ${n.finishMessage}`));
	}
	return t;
}
function N(e) {
	return this instanceof N ? (this.v = e, this) : new N(e);
}
function P(e, t, n) {
	if (!Symbol.asyncIterator) throw TypeError("Symbol.asyncIterator is not defined.");
	var r = n.apply(e, t || []), i, a = [];
	return i = {}, o("next"), o("throw"), o("return"), i[Symbol.asyncIterator] = function() {
		return this;
	}, i;
	function o(e) {
		r[e] && (i[e] = function(t) {
			return new Promise(function(n, r) {
				a.push([
					e,
					t,
					n,
					r
				]) > 1 || s(e, t);
			});
		});
	}
	function s(e, t) {
		try {
			c(r[e](t));
		} catch (e) {
			d(a[0][3], e);
		}
	}
	function c(e) {
		e.value instanceof N ? Promise.resolve(e.value.v).then(l, u) : d(a[0][2], e);
	}
	function l(e) {
		s("next", e);
	}
	function u(e) {
		s("throw", e);
	}
	function d(e, t) {
		e(t), a.shift(), a.length && s(a[0][0], a[0][1]);
	}
}
var F = /^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;
function I(e) {
	let [t, n] = z(e.body.pipeThrough(new TextDecoderStream("utf8", { fatal: !0 }))).tee();
	return {
		stream: R(t),
		response: L(n)
	};
}
async function L(e) {
	let t = [], n = e.getReader();
	for (;;) {
		let { done: e, value: r } = await n.read();
		if (e) return O(B(t));
		t.push(r);
	}
}
function R(e) {
	return P(this, arguments, function* () {
		let t = e.getReader();
		for (;;) {
			let { value: e, done: n } = yield N(t.read());
			if (n) break;
			yield yield N(O(e));
		}
	});
}
function z(e) {
	let t = e.getReader();
	return new ReadableStream({ start(e) {
		let n = "";
		return r();
		function r() {
			return t.read().then(({ value: t, done: i }) => {
				if (i) {
					if (n.trim()) {
						e.error(new f("Failed to parse stream"));
						return;
					}
					e.close();
					return;
				}
				n += t;
				let a = n.match(F), o;
				for (; a;) {
					try {
						o = JSON.parse(a[1]);
					} catch {
						e.error(new f(`Error parsing JSON response: "${a[1]}"`));
						return;
					}
					e.enqueue(o), n = n.substring(a[0].length), a = n.match(F);
				}
				return r();
			}).catch((e) => {
				let t = e;
				throw t.stack = e.stack, t = t.name === "AbortError" ? new g("Request aborted when reading from the stream") : new f("Error reading from the stream"), t;
			});
		}
	} });
}
function B(e) {
	let t = { promptFeedback: e[e.length - 1]?.promptFeedback };
	for (let n of e) {
		if (n.candidates) {
			let e = 0;
			for (let r of n.candidates) if (t.candidates ||= [], t.candidates[e] || (t.candidates[e] = { index: e }), t.candidates[e].citationMetadata = r.citationMetadata, t.candidates[e].groundingMetadata = r.groundingMetadata, t.candidates[e].finishReason = r.finishReason, t.candidates[e].finishMessage = r.finishMessage, t.candidates[e].safetyRatings = r.safetyRatings, r.content && r.content.parts) {
				t.candidates[e].content || (t.candidates[e].content = {
					role: r.content.role || "user",
					parts: []
				});
				let n = {};
				for (let i of r.content.parts) i.text && (n.text = i.text), i.functionCall && (n.functionCall = i.functionCall), i.executableCode && (n.executableCode = i.executableCode), i.codeExecutionResult && (n.codeExecutionResult = i.codeExecutionResult), Object.keys(n).length === 0 && (n.text = ""), t.candidates[e].content.parts.push(n);
			}
			e++;
		}
		n.usageMetadata && (t.usageMetadata = n.usageMetadata);
	}
	return t;
}
async function V(e, t, n, r) {
	return I(await C(t, y.STREAM_GENERATE_CONTENT, e, !0, JSON.stringify(n), r));
}
async function H(e, t, n, r) {
	return { response: O(await (await C(t, y.GENERATE_CONTENT, e, !1, JSON.stringify(n), r)).json()) };
}
function U(e) {
	if (e != null) {
		if (typeof e == "string") return {
			role: "system",
			parts: [{ text: e }]
		};
		if (e.text) return {
			role: "system",
			parts: [e]
		};
		if (e.parts) return e.role ? e : {
			role: "system",
			parts: e.parts
		};
	}
}
function W(e) {
	let t = [];
	if (typeof e == "string") t = [{ text: e }];
	else for (let n of e) typeof n == "string" ? t.push({ text: n }) : t.push(n);
	return G(t);
}
function G(e) {
	let t = {
		role: "user",
		parts: []
	}, n = {
		role: "function",
		parts: []
	}, r = !1, i = !1;
	for (let a of e) "functionResponse" in a ? (n.parts.push(a), i = !0) : (t.parts.push(a), r = !0);
	if (r && i) throw new f("Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.");
	if (!r && !i) throw new f("No content is provided for sending chat message.");
	return r ? t : n;
}
function K(e, t) {
	let n = {
		model: t?.model,
		generationConfig: t?.generationConfig,
		safetySettings: t?.safetySettings,
		tools: t?.tools,
		toolConfig: t?.toolConfig,
		systemInstruction: t?.systemInstruction,
		cachedContent: t?.cachedContent?.name,
		contents: []
	}, r = e.generateContentRequest != null;
	if (e.contents) {
		if (r) throw new h("CountTokensRequest must have one of contents or generateContentRequest, not both.");
		n.contents = e.contents;
	} else if (r) n = Object.assign(Object.assign({}, n), e.generateContentRequest);
	else {
		let t = W(e);
		n.contents = [t];
	}
	return { generateContentRequest: n };
}
function q(e) {
	let t;
	return t = e.contents ? e : { contents: [W(e)] }, e.systemInstruction && (t.systemInstruction = U(e.systemInstruction)), t;
}
function J(e) {
	return typeof e == "string" || Array.isArray(e) ? { content: W(e) } : e;
}
var Y = [
	"text",
	"inlineData",
	"functionCall",
	"functionResponse",
	"executableCode",
	"codeExecutionResult"
], ie = {
	user: ["text", "inlineData"],
	function: ["functionResponse"],
	model: [
		"text",
		"functionCall",
		"executableCode",
		"codeExecutionResult"
	],
	system: ["text"]
};
function ae(e) {
	let t = !1;
	for (let n of e) {
		let { role: e, parts: i } = n;
		if (!t && e !== "user") throw new f(`First content should be with role 'user', got ${e}`);
		if (!r.includes(e)) throw new f(`Each item should include role field. Got ${e} but valid roles are: ${JSON.stringify(r)}`);
		if (!Array.isArray(i)) throw new f("Content should have 'parts' property with an array of Parts");
		if (i.length === 0) throw new f("Each Content should have at least one part");
		let a = {
			text: 0,
			inlineData: 0,
			functionCall: 0,
			functionResponse: 0,
			fileData: 0,
			executableCode: 0,
			codeExecutionResult: 0
		};
		for (let e of i) for (let t of Y) t in e && (a[t] += 1);
		let o = ie[e];
		for (let t of Y) if (!o.includes(t) && a[t] > 0) throw new f(`Content with role '${e}' can't contain '${t}' part`);
		t = !0;
	}
}
function X(e) {
	if (e.candidates === void 0 || e.candidates.length === 0) return !1;
	let t = e.candidates[0]?.content;
	if (t === void 0 || t.parts === void 0 || t.parts.length === 0) return !1;
	for (let e of t.parts) if (e === void 0 || Object.keys(e).length === 0 || e.text !== void 0 && e.text === "") return !1;
	return !0;
}
var Z = "SILENT_ERROR", Q = class {
	constructor(e, t, n, r = {}) {
		this.model = t, this.params = n, this._requestOptions = r, this._history = [], this._sendPromise = Promise.resolve(), this._apiKey = e, n?.history && (ae(n.history), this._history = n.history);
	}
	async getHistory() {
		return await this._sendPromise, this._history;
	}
	async sendMessage(e, t = {}) {
		await this._sendPromise;
		let n = W(e), r = {
			safetySettings: this.params?.safetySettings,
			generationConfig: this.params?.generationConfig,
			tools: this.params?.tools,
			toolConfig: this.params?.toolConfig,
			systemInstruction: this.params?.systemInstruction,
			cachedContent: this.params?.cachedContent,
			contents: [...this._history, n]
		}, i = Object.assign(Object.assign({}, this._requestOptions), t), a;
		return this._sendPromise = this._sendPromise.then(() => H(this._apiKey, this.model, r, i)).then((e) => {
			if (X(e.response)) {
				this._history.push(n);
				let t = Object.assign({
					parts: [],
					role: "model"
				}, e.response.candidates?.[0].content);
				this._history.push(t);
			} else {
				let t = M(e.response);
				t && console.warn(`sendMessage() was unsuccessful. ${t}. Inspect response object for details.`);
			}
			a = e;
		}).catch((e) => {
			throw this._sendPromise = Promise.resolve(), e;
		}), await this._sendPromise, a;
	}
	async sendMessageStream(e, t = {}) {
		await this._sendPromise;
		let n = W(e), r = {
			safetySettings: this.params?.safetySettings,
			generationConfig: this.params?.generationConfig,
			tools: this.params?.tools,
			toolConfig: this.params?.toolConfig,
			systemInstruction: this.params?.systemInstruction,
			cachedContent: this.params?.cachedContent,
			contents: [...this._history, n]
		}, i = Object.assign(Object.assign({}, this._requestOptions), t), a = V(this._apiKey, this.model, r, i);
		return this._sendPromise = this._sendPromise.then(() => a).catch((e) => {
			throw Error(Z);
		}).then((e) => e.response).then((e) => {
			if (X(e)) {
				this._history.push(n);
				let t = Object.assign({}, e.candidates[0].content);
				t.role ||= "model", this._history.push(t);
			} else {
				let t = M(e);
				t && console.warn(`sendMessageStream() was unsuccessful. ${t}. Inspect response object for details.`);
			}
		}).catch((e) => {
			e.message !== Z && console.error(e);
		}), a;
	}
};
async function oe(e, t, n, r) {
	return (await C(t, y.COUNT_TOKENS, e, !1, JSON.stringify(n), r)).json();
}
async function se(e, t, n, r) {
	return (await C(t, y.EMBED_CONTENT, e, !1, JSON.stringify(n), r)).json();
}
async function ce(e, t, n, r) {
	let i = n.requests.map((e) => Object.assign(Object.assign({}, e), { model: t }));
	return (await C(t, y.BATCH_EMBED_CONTENTS, e, !1, JSON.stringify({ requests: i }), r)).json();
}
var $ = class {
	constructor(e, t, n = {}) {
		this.apiKey = e, this._requestOptions = n, this.model = t.model.includes("/") ? t.model : `models/${t.model}`, this.generationConfig = t.generationConfig || {}, this.safetySettings = t.safetySettings || [], this.tools = t.tools, this.toolConfig = t.toolConfig, this.systemInstruction = U(t.systemInstruction), this.cachedContent = t.cachedContent;
	}
	async generateContent(e, t = {}) {
		let n = q(e), r = Object.assign(Object.assign({}, this._requestOptions), t);
		return H(this.apiKey, this.model, Object.assign({
			generationConfig: this.generationConfig,
			safetySettings: this.safetySettings,
			tools: this.tools,
			toolConfig: this.toolConfig,
			systemInstruction: this.systemInstruction,
			cachedContent: this.cachedContent?.name
		}, n), r);
	}
	async generateContentStream(e, t = {}) {
		let n = q(e), r = Object.assign(Object.assign({}, this._requestOptions), t);
		return V(this.apiKey, this.model, Object.assign({
			generationConfig: this.generationConfig,
			safetySettings: this.safetySettings,
			tools: this.tools,
			toolConfig: this.toolConfig,
			systemInstruction: this.systemInstruction,
			cachedContent: this.cachedContent?.name
		}, n), r);
	}
	startChat(e) {
		return new Q(this.apiKey, this.model, Object.assign({
			generationConfig: this.generationConfig,
			safetySettings: this.safetySettings,
			tools: this.tools,
			toolConfig: this.toolConfig,
			systemInstruction: this.systemInstruction,
			cachedContent: this.cachedContent?.name
		}, e), this._requestOptions);
	}
	async countTokens(e, t = {}) {
		let n = K(e, {
			model: this.model,
			generationConfig: this.generationConfig,
			safetySettings: this.safetySettings,
			tools: this.tools,
			toolConfig: this.toolConfig,
			systemInstruction: this.systemInstruction,
			cachedContent: this.cachedContent
		}), r = Object.assign(Object.assign({}, this._requestOptions), t);
		return oe(this.apiKey, this.model, n, r);
	}
	async embedContent(e, t = {}) {
		let n = J(e), r = Object.assign(Object.assign({}, this._requestOptions), t);
		return se(this.apiKey, this.model, n, r);
	}
	async batchEmbedContents(e, t = {}) {
		let n = Object.assign(Object.assign({}, this._requestOptions), t);
		return ce(this.apiKey, this.model, e, n);
	}
}, le = class {
	constructor(e) {
		this.apiKey = e;
	}
	getGenerativeModel(e, t) {
		if (!e.model) throw new f("Must provide a model name. Example: genai.getGenerativeModel({ model: 'my-model-name' })");
		return new $(this.apiKey, e, t);
	}
	getGenerativeModelFromCachedContent(e, t, n) {
		if (!e.name) throw new h("Cached content must contain a `name` field.");
		if (!e.model) throw new h("Cached content must contain a `model` field.");
		for (let n of ["model", "systemInstruction"]) if (t?.[n] && e[n] && t?.[n] !== e[n]) {
			if (n === "model" && (t.model.startsWith("models/") ? t.model.replace("models/", "") : t.model) === (e.model.startsWith("models/") ? e.model.replace("models/", "") : e.model)) continue;
			throw new h(`Different value for "${n}" specified in modelParams (${t[n]}) and cachedContent (${e[n]})`);
		}
		let r = Object.assign(Object.assign({}, t), {
			model: e.model,
			tools: e.tools,
			toolConfig: e.toolConfig,
			systemInstruction: e.systemInstruction,
			cachedContent: e
		});
		return new $(this.apiKey, r, n);
	}
};
//#endregion
export { s as BlockReason, Q as ChatSession, d as DynamicRetrievalMode, t as ExecutableCodeLanguage, c as FinishReason, u as FunctionCallingMode, $ as GenerativeModel, le as GoogleGenerativeAI, g as GoogleGenerativeAIAbortError, f as GoogleGenerativeAIError, m as GoogleGenerativeAIFetchError, h as GoogleGenerativeAIRequestInputError, p as GoogleGenerativeAIResponseError, a as HarmBlockThreshold, i as HarmCategory, o as HarmProbability, n as Outcome, r as POSSIBLE_ROLES, e as SchemaType, l as TaskType };
