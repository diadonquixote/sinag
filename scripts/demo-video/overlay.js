// Runs inside the page (injected by record.mjs). Draws the demo video's callouts, cards,
// cursor and veil on a fixed layer above the site. Nothing here is part of Sinag itself.
/* eslint-disable */
function installDemoOverlay() {
  if (window.__demo && document.getElementById("__demo")) return;
  const NS = "http://www.w3.org/2000/svg";
  const YELLOW = "#FCD116", NAVY = "#0A1A3F", BLUE = "#0038A8";
  const css = (el, s) => Object.assign(el.style, s);
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const root = document.createElement("div");
  root.id = "__demo";
  css(root, { position: "fixed", inset: "0", zIndex: "2147483647", pointerEvents: "none", fontFamily: "var(--font-sans), 'Plus Jakarta Sans', system-ui, sans-serif" });

  const spot = document.createElement("div");
  css(spot, { position: "absolute", borderRadius: "14px", boxShadow: "0 0 0 9999px rgba(8,18,44,0.45), 0 0 0 3px " + YELLOW + ", 0 0 28px 6px rgba(252,209,22,0.55)", opacity: "0", display: "none" });

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  css(svg, { position: "absolute", inset: "0", overflow: "visible" });
  const shade = document.createElementNS(NS, "path");
  shade.setAttribute("fill", "none"); shade.setAttribute("stroke", "rgba(8,18,44,0.55)"); shade.setAttribute("stroke-width", "9"); shade.setAttribute("stroke-linecap", "round");
  const line = document.createElementNS(NS, "path");
  line.setAttribute("fill", "none"); line.setAttribute("stroke", YELLOW); line.setAttribute("stroke-width", "5"); line.setAttribute("stroke-linecap", "round");
  const head = document.createElementNS(NS, "path");
  head.setAttribute("d", "M0,0 L-22,-12 L-16,0 L-22,12 Z");
  head.setAttribute("fill", YELLOW); head.setAttribute("stroke", "rgba(8,18,44,0.55)"); head.setAttribute("stroke-width", "2"); head.setAttribute("stroke-linejoin", "round");
  svg.append(shade, line, head);

  const cap = document.createElement("div");
  css(cap, { position: "absolute", maxWidth: "430px", background: NAVY, color: "#fff", padding: "16px 22px 17px", borderRadius: "16px", borderLeft: "6px solid " + YELLOW, boxShadow: "0 18px 40px rgba(0,0,0,0.35)", opacity: "0", display: "none" });
  const capTitle = document.createElement("div");
  css(capTitle, { fontSize: "23px", fontWeight: "800", lineHeight: "1.2", letterSpacing: "-0.01em" });
  const capSub = document.createElement("div");
  css(capSub, { fontSize: "15.5px", lineHeight: "1.45", marginTop: "6px", color: "rgba(255,255,255,0.86)" });
  cap.append(capTitle, capSub);

  const card = document.createElement("div");
  css(card, { position: "absolute", inset: "0", display: "none", alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center", background: "radial-gradient(60rem 36rem at 50% 45%, #FFF8D6 0%, #FFFFFF 62%)", opacity: "0" });
  const stripe = document.createElement("div");
  css(stripe, { position: "absolute", left: "0", right: "0", top: "0", height: "8px", background: "linear-gradient(90deg," + BLUE + "," + YELLOW + ",#CE1126)" });
  const cardMark = document.createElement("div");
  css(cardMark, { width: "132px", height: "132px", marginBottom: "18px" });
  const cardTitle = document.createElement("div");
  css(cardTitle, { fontFamily: "var(--font-display), Georgia, serif", fontWeight: "700", fontSize: "76px", lineHeight: "1.05", color: BLUE, letterSpacing: "-0.02em" });
  const cardSub = document.createElement("div");
  css(cardSub, { marginTop: "18px", fontSize: "26px", lineHeight: "1.45", color: "#334155", maxWidth: "980px", whiteSpace: "pre-line" });
  const cardFoot = document.createElement("div");
  css(cardFoot, { marginTop: "30px", fontSize: "17px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748B" });
  card.append(stripe, cardMark, cardTitle, cardSub, cardFoot);

  const veil = document.createElement("div");
  css(veil, { position: "absolute", inset: "0", background: "#fff", opacity: "0" });

  const cursor = document.createElementNS(NS, "svg");
  cursor.setAttribute("viewBox", "0 0 24 24");
  css(cursor, { position: "absolute", width: "34px", height: "34px", left: "0", top: "0", display: "none", filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.35))", transformOrigin: "4px 3px" });
  cursor.innerHTML = '<path d="M4 2.5l15 9.2-6.4 1.3 3.7 7.1-3 1.5-3.7-7.1L4 19z" fill="#fff" stroke="#0A1A3F" stroke-width="1.6" stroke-linejoin="round"/>';
  const ripple = document.createElement("div");
  css(ripple, { position: "absolute", width: "46px", height: "46px", marginLeft: "-23px", marginTop: "-23px", borderRadius: "50%", border: "3px solid " + YELLOW, opacity: "0" });

  const badge = document.createElement("div");
  badge.textContent = "Sample data for demonstration";
  css(badge, { position: "absolute", right: "18px", bottom: "16px", padding: "6px 12px", borderRadius: "999px", background: "rgba(10,26,63,0.78)", color: "#fff", fontSize: "12.5px", fontWeight: "700", letterSpacing: "0.02em" });

  root.append(spot, svg, cap, card, ripple, cursor, veil, badge);
  document.documentElement.appendChild(root);

  function hideArrow() {
    for (const el of [shade, line, head]) el.style.opacity = "0";
  }
  hideArrow();

  window.__demo = {
    callout(r, title, sub, p) {
      const W = innerWidth, H = innerHeight;
      const e = ease(clamp(p, 0, 1));
      const pad = 8;
      const R = { x: r.x - pad, y: r.y - pad, w: r.width + pad * 2, h: r.height + pad * 2 };
      css(spot, { display: "block", left: R.x + "px", top: R.y + "px", width: R.w + "px", height: R.h + "px", opacity: String(clamp(p * 1.4, 0, 1)) });
      capTitle.textContent = title;
      capSub.textContent = sub || "";
      capSub.style.display = sub ? "block" : "none";
      css(cap, { display: "block", left: "-9999px", top: "0px" });
      const cw = cap.offsetWidth, ch = cap.offsetHeight;
      const gap = 74, top = 76, m = 24;
      const below = H - (R.y + R.h), above = R.y - top, right = W - (R.x + R.w), left = R.x;
      const cxTarget = R.x + R.w / 2;
      const shift = cxTarget < W / 2 ? 140 : -140;
      let cx, cy, S, E;
      if (below >= ch + gap + m) {
        cx = clamp(cxTarget - cw / 2 + shift, m, W - cw - m); cy = R.y + R.h + gap;
        S = { x: clamp(cxTarget, cx + 30, cx + cw - 30), y: cy - 6 }; E = { x: cxTarget, y: R.y + R.h + 8 };
      } else if (above >= ch + gap + m) {
        cx = clamp(cxTarget - cw / 2 + shift, m, W - cw - m); cy = R.y - gap - ch;
        S = { x: clamp(cxTarget, cx + 30, cx + cw - 30), y: cy + ch + 6 }; E = { x: cxTarget, y: R.y - 8 };
      } else if (right >= cw + gap + m) {
        cx = R.x + R.w + gap; cy = clamp(R.y + R.h / 2 - ch / 2 + 60, top + 10, H - ch - m);
        S = { x: cx - 6, y: cy + ch / 2 }; E = { x: R.x + R.w + 8, y: clamp(R.y + R.h / 2, R.y + 10, R.y + R.h - 10) };
      } else if (left >= cw + gap + m) {
        cx = R.x - gap - cw; cy = clamp(R.y + R.h / 2 - ch / 2 + 60, top + 10, H - ch - m);
        S = { x: cx + cw + 6, y: cy + ch / 2 }; E = { x: R.x - 8, y: clamp(R.y + R.h / 2, R.y + 10, R.y + R.h - 10) };
      } else {
        // No room outside the target: put the caption over its lower corner, no arrow.
        cx = clamp(R.x + R.w - cw - 24, m, W - cw - m); cy = clamp(R.y + R.h - ch - 24, top + 10, H - ch - m);
        S = null;
      }
      css(cap, { left: cx + "px", top: cy + "px", opacity: String(clamp((p - 0.15) * 1.6, 0, 1)), transform: "translateY(" + (1 - e) * 10 + "px)" });
      if (!S) { hideArrow(); return; }
      const mx = (S.x + E.x) / 2, my = (S.y + E.y) / 2;
      const dx = E.x - S.x, dy = E.y - S.y, len = Math.hypot(dx, dy) || 1;
      const bend = Math.min(60, len * 0.28) * (shift > 0 ? 1 : -1);
      const C = { x: mx - (dy / len) * bend, y: my + (dx / len) * bend };
      const d = "M" + S.x + "," + S.y + " Q" + C.x + "," + C.y + " " + E.x + "," + E.y;
      for (const el of [shade, line]) {
        el.setAttribute("d", d);
        const L = el.getTotalLength();
        el.style.strokeDasharray = String(L);
        el.style.strokeDashoffset = String(L * (1 - e));
        el.style.opacity = "1";
      }
      const ang = (Math.atan2(E.y - C.y, E.x - C.x) * 180) / Math.PI;
      head.setAttribute("transform", "translate(" + E.x + "," + E.y + ") rotate(" + ang + ")");
      head.style.opacity = String(clamp((p - 0.75) * 4, 0, 1));
    },
    clear() {
      spot.style.display = "none";
      cap.style.display = "none";
      hideArrow();
    },
    card(title, sub, foot, p, withMark) {
      card.style.display = p > 0 ? "flex" : "none";
      card.style.opacity = String(clamp(p, 0, 1));
      cardTitle.textContent = title;
      cardSub.textContent = sub || "";
      cardFoot.textContent = foot || "";
      cardMark.innerHTML = "";
      cardMark.style.display = withMark ? "block" : "none";
      if (withMark) {
        const src = document.querySelector('header a[aria-label="Sinag home"] svg');
        if (src) {
          const m = src.cloneNode(true);
          m.setAttribute("width", "132"); m.setAttribute("height", "132");
          m.style.width = "132px"; m.style.height = "132px";
          cardMark.appendChild(m);
        }
      }
      const k = ease(clamp(p, 0, 1));
      cardTitle.style.transform = "translateY(" + (1 - k) * 16 + "px)";
      cardSub.style.transform = "translateY(" + (1 - k) * 22 + "px)";
    },
    cursor(x, y, visible, press) {
      cursor.style.display = visible ? "block" : "none";
      cursor.style.left = x - 4 + "px";
      cursor.style.top = y - 3 + "px";
      cursor.style.transform = press ? "scale(0.86)" : "scale(1)";
      ripple.style.left = x + "px";
      ripple.style.top = y + "px";
      ripple.style.opacity = press ? "1" : "0";
      ripple.style.transform = "scale(" + (press ? 1 : 0.4) + ")";
    },
    veil(p) {
      veil.style.opacity = String(clamp(p, 0, 1));
    },
    badge(on) {
      badge.style.display = on ? "block" : "none";
    },
  };
}
