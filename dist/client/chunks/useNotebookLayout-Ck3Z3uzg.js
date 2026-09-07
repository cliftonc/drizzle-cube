import { useCallback as e, useEffect as t, useRef as n, useState as r } from "react";
//#region src/client/hooks/useNotebookLayout.ts
var i = 768;
function a() {
	let [a, o] = r(() => typeof window < "u" ? window.innerWidth : 769), s = n(null), c = n(null), l = e((e) => {
		if (s.current &&= (s.current.disconnect(), null), c.current = e, e) {
			let t = e.offsetWidth;
			t > 0 && o(t), s.current = new ResizeObserver((e) => {
				let t = e[0]?.contentRect.width;
				t && t > 0 && o(t);
			}), s.current.observe(e);
		}
	}, []);
	return t(() => () => {
		s.current && s.current.disconnect();
	}, []), t(() => {
		let e = () => {
			if (c.current) {
				let e = c.current.offsetWidth;
				e > 0 && o(e);
			}
		};
		window.addEventListener("resize", e);
		let t = setTimeout(e, 100);
		return () => {
			window.removeEventListener("resize", e), clearTimeout(t);
		};
	}, []), {
		containerRef: l,
		layoutMode: a >= i ? "wide" : "narrow",
		containerWidth: a
	};
}
//#endregion
export { a as t };

//# sourceMappingURL=useNotebookLayout-Ck3Z3uzg.js.map