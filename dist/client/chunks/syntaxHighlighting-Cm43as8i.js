//#region src/client/utils/syntaxHighlighting.ts
var e = null, t = null;
async function n() {
	if (!e) return t || (t = (async () => {
		try {
			let t = await import("./core-BWRP9s8x.js"), n = await import("./javascript-D6aJaG8F.js"), r = await import("./sql-CmVzGP4w.js"), i = await import("./json-BrJhaXJI.js");
			t.default.registerLanguage("javascript", n.default), t.default.registerLanguage("sql", r.default), t.default.registerLanguage("json", i.default), e = t.default;
		} catch (e) {
			console.error("Failed to load syntax highlighter:", e), t = null;
		}
	})(), t);
}
async function r() {
	await n(), e && document.querySelectorAll("pre code").forEach((t) => {
		t.classList.contains("hljs") || e.highlightElement(t);
	});
}
async function i(t) {
	await n(), e && (t.classList.contains("hljs") || e.highlightElement(t));
}
function a() {
	return e !== null;
}
function o() {
	return e;
}
//#endregion
export { n as a, a as i, i as n, r, o as t };

//# sourceMappingURL=syntaxHighlighting-Cm43as8i.js.map