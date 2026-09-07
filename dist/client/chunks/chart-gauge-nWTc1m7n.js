import { n as e } from "./rolldown-runtime-DArdT4gl.js";
import { F as t, S as n, w as r } from "./chart-activity-grid-D6X0iOUw.js";
import { D as i, O as a, k as o } from "./chart-area-95fIdTeM.js";
import s, { useLayoutEffect as c, useMemo as l, useRef as u, useState as d } from "react";
import { jsx as f, jsxs as p } from "react/jsx-runtime";
//#region node_modules/d3-shape/src/constant.js
function m(e) {
	return function() {
		return e;
	};
}
//#endregion
//#region node_modules/d3-shape/src/math.js
var h = Math.abs, g = Math.atan2, _ = Math.cos, v = Math.max, y = Math.min, b = Math.sin, x = Math.sqrt, S = Math.PI, C = S / 2, w = 2 * S;
function T(e) {
	return e > 1 ? 0 : e < -1 ? S : Math.acos(e);
}
function E(e) {
	return e >= 1 ? C : e <= -1 ? -C : Math.asin(e);
}
//#endregion
//#region node_modules/d3-path/src/path.js
var D = Math.PI, O = 2 * D, k = 1e-6, A = O - k;
function j(e) {
	this._ += e[0];
	for (let t = 1, n = e.length; t < n; ++t) this._ += arguments[t] + e[t];
}
function M(e) {
	let t = Math.floor(e);
	if (!(t >= 0)) throw Error(`invalid digits: ${e}`);
	if (t > 15) return j;
	let n = 10 ** t;
	return function(e) {
		this._ += e[0];
		for (let t = 1, r = e.length; t < r; ++t) this._ += Math.round(arguments[t] * n) / n + e[t];
	};
}
var N = class {
	constructor(e) {
		this._x0 = this._y0 = this._x1 = this._y1 = null, this._ = "", this._append = e == null ? j : M(e);
	}
	moveTo(e, t) {
		this._append`M${this._x0 = this._x1 = +e},${this._y0 = this._y1 = +t}`;
	}
	closePath() {
		this._x1 !== null && (this._x1 = this._x0, this._y1 = this._y0, this._append`Z`);
	}
	lineTo(e, t) {
		this._append`L${this._x1 = +e},${this._y1 = +t}`;
	}
	quadraticCurveTo(e, t, n, r) {
		this._append`Q${+e},${+t},${this._x1 = +n},${this._y1 = +r}`;
	}
	bezierCurveTo(e, t, n, r, i, a) {
		this._append`C${+e},${+t},${+n},${+r},${this._x1 = +i},${this._y1 = +a}`;
	}
	arcTo(e, t, n, r, i) {
		if (e = +e, t = +t, n = +n, r = +r, i = +i, i < 0) throw Error(`negative radius: ${i}`);
		let a = this._x1, o = this._y1, s = n - e, c = r - t, l = a - e, u = o - t, d = l * l + u * u;
		if (this._x1 === null) this._append`M${this._x1 = e},${this._y1 = t}`;
		else if (d > k) {
			if (!(Math.abs(u * s - c * l) > k) || !i) this._append`L${this._x1 = e},${this._y1 = t}`;
			else {
				let f = n - a, p = r - o, m = s * s + c * c, h = f * f + p * p, g = Math.sqrt(m), _ = Math.sqrt(d), v = i * Math.tan((D - Math.acos((m + d - h) / (2 * g * _))) / 2), y = v / _, b = v / g;
				Math.abs(y - 1) > k && this._append`L${e + y * l},${t + y * u}`, this._append`A${i},${i},0,0,${+(u * f > l * p)},${this._x1 = e + b * s},${this._y1 = t + b * c}`;
			}
		}
	}
	arc(e, t, n, r, i, a) {
		if (e = +e, t = +t, n = +n, a = !!a, n < 0) throw Error(`negative radius: ${n}`);
		let o = n * Math.cos(r), s = n * Math.sin(r), c = e + o, l = t + s, u = 1 ^ a, d = a ? r - i : i - r;
		this._x1 === null ? this._append`M${c},${l}` : (Math.abs(this._x1 - c) > k || Math.abs(this._y1 - l) > k) && this._append`L${c},${l}`, n && (d < 0 && (d = d % O + O), d > A ? this._append`A${n},${n},0,1,${u},${e - o},${t - s}A${n},${n},0,1,${u},${this._x1 = c},${this._y1 = l}` : d > k && this._append`A${n},${n},0,${+(d >= D)},${u},${this._x1 = e + n * Math.cos(i)},${this._y1 = t + n * Math.sin(i)}`);
	}
	rect(e, t, n, r) {
		this._append`M${this._x0 = this._x1 = +e},${this._y0 = this._y1 = +t}h${n = +n}v${+r}h${-n}Z`;
	}
	toString() {
		return this._;
	}
};
//#endregion
//#region node_modules/d3-shape/src/path.js
function P(e) {
	let t = 3;
	return e.digits = function(n) {
		if (!arguments.length) return t;
		if (n == null) t = null;
		else {
			let e = Math.floor(n);
			if (!(e >= 0)) throw RangeError(`invalid digits: ${n}`);
			t = e;
		}
		return e;
	}, () => new N(t);
}
//#endregion
//#region node_modules/d3-shape/src/arc.js
function F(e) {
	return e.innerRadius;
}
function I(e) {
	return e.outerRadius;
}
function L(e) {
	return e.startAngle;
}
function R(e) {
	return e.endAngle;
}
function z(e) {
	return e && e.padAngle;
}
function ee(e, t, n, r, i, a, o, s) {
	var c = n - e, l = r - t, u = o - i, d = s - a, f = d * c - u * l;
	if (!(f * f < 1e-12)) return f = (u * (t - a) - d * (e - i)) / f, [e + f * c, t + f * l];
}
function te(e, t, n, r, i, a, o) {
	var s = e - n, c = t - r, l = (o ? a : -a) / x(s * s + c * c), u = l * c, d = -l * s, f = e + u, p = t + d, m = n + u, h = r + d, g = (f + m) / 2, _ = (p + h) / 2, y = m - f, b = h - p, S = y * y + b * b, C = i - a, w = f * h - m * p, T = (b < 0 ? -1 : 1) * x(v(0, C * C * S - w * w)), E = (w * b - y * T) / S, D = (-w * y - b * T) / S, O = (w * b + y * T) / S, k = (-w * y + b * T) / S, A = E - g, j = D - _, M = O - g, N = k - _;
	return A * A + j * j > M * M + N * N && (E = O, D = k), {
		cx: E,
		cy: D,
		x01: -u,
		y01: -d,
		x11: E * (i / C - 1),
		y11: D * (i / C - 1)
	};
}
function B() {
	var e = F, t = I, n = m(0), r = null, i = L, a = R, o = z, s = null, c = P(l);
	function l() {
		var l, u, d = +e.apply(this, arguments), f = +t.apply(this, arguments), p = i.apply(this, arguments) - C, m = a.apply(this, arguments) - C, v = h(m - p), D = m > p;
		if (s ||= l = c(), f < d && (u = f, f = d, d = u), !(f > 1e-12)) s.moveTo(0, 0);
		else if (v > w - 1e-12) s.moveTo(f * _(p), f * b(p)), s.arc(0, 0, f, p, m, !D), d > 1e-12 && (s.moveTo(d * _(m), d * b(m)), s.arc(0, 0, d, m, p, D));
		else {
			var O = p, k = m, A = p, j = m, M = v, N = v, P = o.apply(this, arguments) / 2, F = P > 1e-12 && (r ? +r.apply(this, arguments) : x(d * d + f * f)), I = y(h(f - d) / 2, +n.apply(this, arguments)), L = I, R = I, z, B;
			if (F > 1e-12) {
				var V = E(F / d * b(P)), H = E(F / f * b(P));
				(M -= V * 2) > 1e-12 ? (V *= D ? 1 : -1, A += V, j -= V) : (M = 0, A = j = (p + m) / 2), (N -= H * 2) > 1e-12 ? (H *= D ? 1 : -1, O += H, k -= H) : (N = 0, O = k = (p + m) / 2);
			}
			var U = f * _(O), W = f * b(O), G = d * _(j), K = d * b(j);
			if (I > 1e-12) {
				var q = f * _(k), J = f * b(k), ne = d * _(A), Y = d * b(A), X;
				if (v < S) {
					if (X = ee(U, W, ne, Y, q, J, G, K)) {
						var Z = U - X[0], Q = W - X[1], $ = q - X[0], re = J - X[1], ie = 1 / b(T((Z * $ + Q * re) / (x(Z * Z + Q * Q) * x($ * $ + re * re))) / 2), ae = x(X[0] * X[0] + X[1] * X[1]);
						L = y(I, (d - ae) / (ie - 1)), R = y(I, (f - ae) / (ie + 1));
					} else L = R = 0;
				}
			}
			N > 1e-12 ? R > 1e-12 ? (z = te(ne, Y, U, W, f, R, D), B = te(q, J, G, K, f, R, D), s.moveTo(z.cx + z.x01, z.cy + z.y01), R < I ? s.arc(z.cx, z.cy, R, g(z.y01, z.x01), g(B.y01, B.x01), !D) : (s.arc(z.cx, z.cy, R, g(z.y01, z.x01), g(z.y11, z.x11), !D), s.arc(0, 0, f, g(z.cy + z.y11, z.cx + z.x11), g(B.cy + B.y11, B.cx + B.x11), !D), s.arc(B.cx, B.cy, R, g(B.y11, B.x11), g(B.y01, B.x01), !D))) : (s.moveTo(U, W), s.arc(0, 0, f, O, k, !D)) : s.moveTo(U, W), !(d > 1e-12) || !(M > 1e-12) ? s.lineTo(G, K) : L > 1e-12 ? (z = te(G, K, q, J, d, -L, D), B = te(U, W, ne, Y, d, -L, D), s.lineTo(z.cx + z.x01, z.cy + z.y01), L < I ? s.arc(z.cx, z.cy, L, g(z.y01, z.x01), g(B.y01, B.x01), !D) : (s.arc(z.cx, z.cy, L, g(z.y01, z.x01), g(z.y11, z.x11), !D), s.arc(0, 0, d, g(z.cy + z.y11, z.cx + z.x11), g(B.cy + B.y11, B.cx + B.x11), D), s.arc(B.cx, B.cy, L, g(B.y11, B.x11), g(B.y01, B.x01), !D))) : s.arc(0, 0, d, j, A, D);
		}
		if (s.closePath(), l) return s = null, l + "" || null;
	}
	return l.centroid = function() {
		var n = (+e.apply(this, arguments) + +t.apply(this, arguments)) / 2, r = (+i.apply(this, arguments) + +a.apply(this, arguments)) / 2 - S / 2;
		return [_(r) * n, b(r) * n];
	}, l.innerRadius = function(t) {
		return arguments.length ? (e = typeof t == "function" ? t : m(+t), l) : e;
	}, l.outerRadius = function(e) {
		return arguments.length ? (t = typeof e == "function" ? e : m(+e), l) : t;
	}, l.cornerRadius = function(e) {
		return arguments.length ? (n = typeof e == "function" ? e : m(+e), l) : n;
	}, l.padRadius = function(e) {
		return arguments.length ? (r = e == null ? null : typeof e == "function" ? e : m(+e), l) : r;
	}, l.startAngle = function(e) {
		return arguments.length ? (i = typeof e == "function" ? e : m(+e), l) : i;
	}, l.endAngle = function(e) {
		return arguments.length ? (a = typeof e == "function" ? e : m(+e), l) : a;
	}, l.padAngle = function(e) {
		return arguments.length ? (o = typeof e == "function" ? e : m(+e), l) : o;
	}, l.context = function(e) {
		return arguments.length ? (s = e ?? null, l) : s;
	}, l;
}
//#endregion
//#region src/client/components/charts/gaugeChartHelpers.ts
var V = -Math.PI * .75, H = Math.PI * .75 - V, U = "var(--dc-accent)", W = .04, G = .02, K = .38, q = 1e-6, J = 1 + Math.SQRT1_2, ne = .94;
function Y(e) {
	if (e == null) return null;
	let t = typeof e == "number" ? e : parseFloat(String(e));
	return isNaN(t) ? null : t;
}
function X(e, t, n) {
	return Math.max(t, Math.min(n, e));
}
function Z(e, t) {
	return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function Q(e) {
	return V + X(e, 0, 1) * H;
}
function $(e, t) {
	return {
		x: Math.sin(e) * t,
		y: -Math.cos(e) * t
	};
}
function re(e, t) {
	let n = se(t), r = U;
	for (let t of n) e >= t.value && (r = t.color);
	return r;
}
function ie(e, t, n, r, i = 0) {
	return B().cornerRadius(i)({
		innerRadius: e,
		outerRadius: t,
		startAngle: n,
		endAngle: r
	}) ?? "";
}
function ae(e) {
	return typeof e == "object" && !!e && typeof e.value == "number" && Number.isFinite(e.value) && typeof e.color == "string" && e.color.trim() !== "";
}
function oe(e) {
	let t = null;
	if (Array.isArray(e)) t = e;
	else if (typeof e == "string" && e.trim()) try {
		let n = JSON.parse(e);
		Array.isArray(n) && (t = n);
	} catch (e) {
		return console.warn("GaugeChart: invalid threshold JSON", e), [];
	}
	return t ? t.filter(ae) : [];
}
function se(e) {
	return e.map((e) => ({
		color: e.color,
		value: X(e.value, 0, 1)
	})).sort((e, t) => e.value - t.value);
}
function ce(e) {
	let t = se(e), n = [];
	return t.length === 0 ? n.push({
		color: U,
		startFraction: 0,
		endFraction: 1
	}) : (t[0].value > q && n.push({
		color: U,
		startFraction: 0,
		endFraction: t[0].value
	}), t.forEach((e, r) => {
		n.push({
			color: e.color,
			startFraction: e.value,
			endFraction: r < t.length - 1 ? t[r + 1].value : 1
		});
	})), n.filter((e) => e.endFraction - e.startFraction > q).map((e) => ({
		...e,
		startAngle: Q(e.startFraction),
		endAngle: Q(e.endFraction)
	}));
}
function le(e, t = W) {
	let n = Math.max(t, 0) / 2;
	return e.map((t, r) => ({
		color: t.color,
		startAngle: t.startAngle + (r === 0 ? 0 : n),
		endAngle: t.endAngle + (r === e.length - 1 ? 0 : -n)
	})).filter((e) => e.endAngle - e.startAngle >= G);
}
function ue(e, t, n) {
	let r = [0];
	for (let t of e) r.push(t.startFraction, t.endFraction);
	r.push(1);
	let i = [...r].sort((e, t) => e - t).filter((e, t, n) => t === 0 || e - n[t - 1] > q), a = [];
	for (let e = i.length - 1; e >= 0; e--) {
		let t = Q(i[e]), n = a.length > 0 ? Q(a[a.length - 1]) : null;
		(n === null || n - t >= K) && a.push(i[e]);
	}
	return a.reverse().map((e) => ({
		fraction: e,
		value: t + e * (n - t),
		angle: Q(e)
	}));
}
function de(e, t, n) {
	let r = $(e, t), i = Math.cos(e), a = Math.sin(e), o = (e) => Number(e.toFixed(3));
	return [
		`M${o(r.x)},${o(r.y)}`,
		`L${o(i * n)},${o(a * n)}`,
		`L${o(-i * n)},${o(-a * n)}`,
		"Z"
	].join("");
}
function fe(e, t) {
	let n = Math.max(Z(e, 0), 1), r = Math.max(Z(t, 0), 1), i = Math.max(1, Math.min(n / 2, r / J) * ne), a = i, o = i * .8;
	return {
		cx: n / 2,
		cy: r / 2 + i * (1 - J / 2),
		radius: i,
		outerRadius: a,
		innerRadius: o,
		bandCornerRadius: (a - o) / 2,
		tickRadius: i * .7,
		needleLength: i * .56,
		needleHalfWidth: i * .055,
		hubRadius: i * .075,
		tickFontSize: i * .095,
		labelFontSize: i * .1,
		labelY: i * .28,
		valueFontSize: i * .165,
		valueY: i * .52
	};
}
function pe(e, t, n, r) {
	let i = Z(t, 0), a = Z(n, i + 1), o = a <= i ? i + 1 : a, s = X(Z(e, i), i, o), c = X((s - i) / (o - i), 0, 1);
	return {
		effectiveMax: o,
		clampedValue: s,
		fraction: c,
		fillColor: re(c, r),
		needleAngle: Q(c)
	};
}
function me(e, t) {
	return r(e, t);
}
//#endregion
//#region src/client/components/charts/GaugeChart.tsx
var he = /* @__PURE__ */ e({ default: () => ge }), ge = s.memo(function({ data: e, chartConfig: r, displayConfig: s = {}, height: m = "100%" }) {
	let { t: h } = t(), g = n(), _ = u(null), [v, y] = d({
		width: 0,
		height: 0
	});
	c(() => {
		let e = _.current;
		if (!e) return;
		let t = new ResizeObserver((e) => {
			for (let t of e) {
				let { width: e, height: n } = t.contentRect;
				e > 0 && n > 0 && y({
					width: e,
					height: n
				});
			}
		});
		t.observe(e);
		let n = e.getBoundingClientRect();
		return n.width > 0 && n.height > 0 && y({
			width: n.width,
			height: n.height
		}), () => t.disconnect();
	}, []);
	let { valueField: b, maxField: x, configError: S } = l(() => {
		let e = Array.isArray(r?.yAxis) ? r.yAxis : [], t = e[0] ?? "", n = e[1] ?? "";
		return t ? {
			valueField: t,
			maxField: n,
			configError: null
		} : {
			valueField: t,
			maxField: n,
			configError: "Gauge requires at least 1 measure in Y-Axis (current value)"
		};
	}, [r]), C = l(() => oe(s?.thresholds), [s?.thresholds]), w = l(() => ce(C), [C]), T = l(() => le(w), [w]);
	try {
		if (!e || e.length === 0) return /* @__PURE__ */ f(a, {
			height: m,
			hint: h("chart.runtime.noDataHint.gauge")
		});
		if (S) return /* @__PURE__ */ f(i, {
			height: m,
			hint: S
		});
		let t = e[0], n = Y(t[b]);
		if (n === null || !Number.isFinite(n)) return /* @__PURE__ */ f(a, {
			height: m,
			titleKey: "chart.runtime.noValidData",
			hint: h("chart.runtime.noValidDataHint.gauge")
		});
		let r = Z(s?.minValue, 0), o = x ? Y(t[x]) : null, { effectiveMax: c, fraction: l, fillColor: u, needleAngle: d } = pe(n, r, Z(s?.maxValue ?? o, 100), C), y = s?.showCenterLabel ?? !0, E = s?.showPercentage ?? !1, D = s?.leftYAxisFormat, O = v.width || 300, k = typeof m == "number" ? m : v.height || 200, A = fe(O, k), j = ue(w, r, c), M = E ? `${(l * 100).toFixed(1)}%` : me(n, D), N = g(b);
		return /* @__PURE__ */ f("div", {
			ref: _,
			className: "dc:relative dc:w-full",
			style: { height: m },
			children: /* @__PURE__ */ f("svg", {
				width: "100%",
				height: "100%",
				viewBox: `0 0 ${O} ${k}`,
				preserveAspectRatio: "xMidYMid meet",
				"data-testid": "gauge-svg",
				children: /* @__PURE__ */ p("g", {
					transform: `translate(${A.cx}, ${A.cy})`,
					children: [
						T.map((e, t) => /* @__PURE__ */ f("path", {
							d: ie(A.innerRadius, A.outerRadius, e.startAngle, e.endAngle, A.bandCornerRadius),
							fill: e.color,
							"data-testid": `gauge-band-${t}`
						}, t)),
						j.map((e, t) => {
							let n = $(e.angle, A.tickRadius);
							return /* @__PURE__ */ f("text", {
								x: n.x,
								y: n.y,
								textAnchor: "middle",
								dominantBaseline: "central",
								fontSize: A.tickFontSize,
								fill: "currentColor",
								className: "text-dc-text-muted",
								"data-testid": `gauge-tick-${t}`,
								children: me(e.value, D)
							}, t);
						}),
						/* @__PURE__ */ f("path", {
							d: de(d, A.needleLength, A.needleHalfWidth),
							fill: "currentColor",
							className: "text-dc-text-secondary",
							"data-testid": "gauge-needle",
							"data-fraction": l.toFixed(4),
							"data-color": u
						}),
						/* @__PURE__ */ f("circle", {
							r: A.hubRadius,
							fill: "currentColor",
							className: "text-dc-text-secondary",
							"data-testid": "gauge-hub"
						}),
						y && /* @__PURE__ */ p("g", {
							"data-testid": "gauge-label",
							children: [/* @__PURE__ */ f("text", {
								textAnchor: "middle",
								dominantBaseline: "central",
								y: A.labelY,
								fontSize: A.labelFontSize,
								fill: "currentColor",
								className: "text-dc-text-secondary",
								"data-testid": "gauge-field-text",
								children: N
							}), /* @__PURE__ */ f("text", {
								textAnchor: "middle",
								dominantBaseline: "central",
								y: A.valueY,
								fontSize: A.valueFontSize,
								fontWeight: "600",
								fill: "currentColor",
								className: "text-dc-text",
								"data-testid": "gauge-value-text",
								children: M
							})]
						})
					]
				})
			})
		});
	} catch (e) {
		return /* @__PURE__ */ f(o, {
			height: m,
			chartType: "Gauge Chart",
			error: e
		});
	}
});
//#endregion
export { oe as n, he as t };

//# sourceMappingURL=chart-gauge-nWTc1m7n.js.map