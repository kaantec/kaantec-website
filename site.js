/* KAANTEC – Navigation, Kanalfahrt-Hintergrund (Canvas), Reveal, Vorher/Nachher-Regler.
   Keine externen Bibliotheken, keine externen Anfragen. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) doc.classList.add("rm");

  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    /* ---------- Menü ---------- */
    var nav = document.getElementById("navLinks");
    var button = document.querySelector(".menu-button");
    if (button && nav) {
      button.addEventListener("click", function () {
        var open = nav.classList.toggle("active");
        button.setAttribute("aria-expanded", String(open));
        button.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
      });
      nav.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          nav.classList.remove("active");
          button.setAttribute("aria-expanded", "false");
        });
      });
    }

    /* ---------- Cookie-Einstellungen ---------- */
    var cookieLink = document.getElementById("cookie-settings-link");
    if (cookieLink) {
      cookieLink.addEventListener("click", function (e) {
        e.preventDefault();
        if (window.__openCookieBanner) window.__openCookieBanner();
      });
    }

    /* ---------- Vorher/Nachher-Regler ---------- */
    document.querySelectorAll(".ba-box").forEach(function (box) {
      var input = box.querySelector(".ba-range");
      if (!input) return;
      var set = function () { box.style.setProperty("--pos", input.value + "%"); };
      input.addEventListener("input", set);
      set();
    });

    /* ---------- Reveal ---------- */
    var rv = document.querySelectorAll(".rv");
    if ("IntersectionObserver" in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { threshold: 0.15 });
      rv.forEach(function (el) { io.observe(el); });
    } else {
      rv.forEach(function (el) { el.classList.add("in"); });
    }

    /* ---------- Header + Parallax der Leistungsseiten ---------- */
    var header = document.querySelector("header");
    var parallax = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    function onScroll() {
      if (header) header.classList.toggle("solid", window.scrollY > 40);
      if (reduce) return;
      var vh = window.innerHeight;
      parallax.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        el.style.setProperty("--p", clamp(-r.top / r.height, 0, 1).toFixed(4));
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* ---------- Kanalfahrt (nur Startseite) ---------- */
    var canvas = document.getElementById("bg");
    var scrub = document.getElementById("scrub");
    if (!canvas || !scrub || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");

    /* Bildfolge: Datei, Mittelpunkt des Kanals (Anteil an Breite/Höhe) */
    var SEQ = [
      { src: "images/scrub/s0.webp", cx: 0.52, cy: 0.40 },
      { src: "images/scrub/s1.webp", cx: 0.478, cy: 0.522 },
      { src: "images/scrub/s2.webp", cx: 0.423, cy: 0.526 },
      { src: "images/scrub/s3.webp", cx: 0.345, cy: 0.573 },
      { src: "images/scrub/s4.webp", cx: 0.5, cy: 0.563 },
      { src: "images/scrub/s5.webp", cx: 0.459, cy: 0.495 },
      { src: "images/scrub/s6.webp", cx: 0.445, cy: 0.423 }
    ];
    var N = SEQ.length, loaded = 0;
    SEQ.forEach(function (it) {
      var im = new Image();
      im.decoding = "async";
      im.onload = function () { it.img = im; loaded++; if (loaded >= 2) canvas.classList.add("on"); };
      im.src = it.src;
    });

    var W = 0, H = 0, dpr = 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    /* Schwebende Lichtpartikel */
    var P = [];
    for (var i = 0; i < 70; i++) {
      P.push({ x: Math.random(), y: Math.random(), r: 0.8 + Math.random() * 3.6, a: 0.05 + Math.random() * 0.22, s: 0.004 + Math.random() * 0.012, z: 0.3 + Math.random() * 1.2, ph: Math.random() * 6.28 });
    }

    var target = 0, cur = 0, t0 = performance.now();
    function progress() {
      var r = scrub.getBoundingClientRect();
      var span = r.height - window.innerHeight;
      return span > 0 ? clamp(-r.top / span, 0, 1) : 0;
    }
    function ease(u) { return u * u * (3 - 2 * u); }

    function drawLayer(it, u) {
      var im = it.img; if (!im) return;
      var alpha, s;
      if (u < 0) {                       /* kommt aus der Tiefe */
        alpha = smooth((u + 1) / 0.8);
        s = lerp(0.86, 1, ease(u + 1));
      } else {                           /* fliegt am Betrachter vorbei */
        alpha = 1 - smooth((u - 0.3) / 0.7);
        s = 1 + 1.7 * Math.pow(u, 1.4);
      }
      if (alpha <= 0.003) return;
      var base = Math.max(W / im.width, H / im.height) * 1.2;
      var sc = base * s, w = im.width * sc, h = im.height * sc;
      var dx = W * 0.5 - it.cx * w, dy = H * 0.5 - it.cy * h;
      if (w >= W) dx = clamp(dx, W - w, 0);
      if (h >= H) dy = clamp(dy, H - h, 0);
      ctx.globalAlpha = alpha;
      ctx.drawImage(im, dx, dy, w, h);
    }

    function frame(now) {
      requestAnimationFrame(frame);
      var r = scrub.getBoundingClientRect();
      if (r.bottom < -window.innerHeight * 1.2) return;      /* Hintergrund ist verdeckt */
      target = reduce ? 0.28 : progress();
      cur += (target - cur) * (reduce ? 1 : 0.12);
      var t = cur * (N - 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#05080c";
      ctx.fillRect(0, 0, W, H);
      for (var i = 0; i < N; i++) {
        var u = t - i;
        if (u <= -1 || u >= 1) continue;
        drawLayer(SEQ[i], u);
      }
      /* Licht-Glimmen in der Kanalmitte */
      var g = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.55);
      g.addColorStop(0, "rgba(190,215,240,.10)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      /* Partikel */
      var sec = (now - t0) / 1000;
      ctx.globalCompositeOperation = "lighter";
      for (var k = 0; k < P.length; k++) {
        var p = P[k];
        var y = ((p.y - sec * p.s * p.z - cur * 0.35 * p.z) % 1 + 1) % 1;
        var x = p.x + Math.sin(sec * 0.4 + p.ph) * 0.012;
        var rad = p.r * (0.6 + p.z * 0.6);
        var gg = ctx.createRadialGradient(x * W, y * H, 0, x * W, y * H, rad * 2.2);
        gg.addColorStop(0, "rgba(230,240,255," + p.a + ")");
        gg.addColorStop(1, "rgba(230,240,255,0)");
        ctx.fillStyle = gg;
        ctx.fillRect(x * W - rad * 2.2, y * H - rad * 2.2, rad * 4.4, rad * 4.4);
      }
      ctx.globalCompositeOperation = "source-over";
    }
    requestAnimationFrame(frame);
  });
})();
