/* KAANTEC – Navigation, Scroll-Szenen, Vorher/Nachher-Regler. Keine externen Bibliotheken. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) doc.classList.add("rm");

  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var nums = function (s) { return String(s).split(",").map(parseFloat); };

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

    /* ---------- Cookie-Einstellungen im Footer ---------- */
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

    /* ---------- Header: solid nach dem Hero-Beginn ---------- */
    var header = document.querySelector("header");
    var scenes = Array.prototype.slice.call(document.querySelectorAll("[data-scene]"));
    var heroes = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));

    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      if (header) header.classList.toggle("solid", window.scrollY > 40);

      if (!reduce) {
        scenes.forEach(function (scene) {
          var r = scene.getBoundingClientRect();
          if (r.bottom < -vh || r.top > vh * 2) return;
          var span = r.height - vh;
          var p = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
          scene.style.setProperty("--p", p.toFixed(4));

          scene.querySelectorAll("[data-in]").forEach(function (el) {
            var v = nums(el.getAttribute("data-in"));       /* a,b : Einblenden, bleibt sichtbar */
            el.style.opacity = clamp((p - v[0]) / Math.max(v[1] - v[0], 0.001), 0, 1).toFixed(3);
          });
          scene.querySelectorAll("[data-fade]").forEach(function (el) {
            var v = nums(el.getAttribute("data-fade"));     /* a,b,c,d : ein, halten, aus */
            var o = p < v[1] ? (p - v[0]) / Math.max(v[1] - v[0], 0.001)
                             : (v[3] - p) / Math.max(v[3] - v[2], 0.001);
            if (p >= v[1] && p <= v[2]) o = 1;
            o = clamp(o, 0, 1);
            el.style.opacity = o.toFixed(3);
            el.style.transform = "translate3d(0," + ((1 - o) * 28).toFixed(1) + "px,0)";
            el.style.visibility = o < 0.01 ? "hidden" : "visible";
          });
          scene.querySelectorAll("[data-zoom]").forEach(function (el) {
            var v = nums(el.getAttribute("data-zoom"));     /* start,ende,scale0,scale1 */
            var t = clamp((p - v[0]) / Math.max(v[1] - v[0], 0.001), 0, 1);
            var s = lerp(v[2], v[3], t);
            var ox = el.getAttribute("data-origin") || "50% 50%";
            el.style.transformOrigin = ox;
            el.style.transform = "scale(" + s.toFixed(4) + ")";
          });
          var wipe = scene.querySelector("[data-wipe]");
          if (wipe) {
            var w = nums(wipe.getAttribute("data-wipe"));   /* start,ende */
            var t2 = clamp((p - w[0]) / Math.max(w[1] - w[0], 0.001), 0, 1);
            scene.style.setProperty("--w", (t2 * 100).toFixed(2) + "%");
          }
          var hint = scene.querySelector(".scroll-hint");
          if (hint) hint.style.opacity = p > 0.04 ? 0 : 1;
        });

        heroes.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) return;
          el.style.setProperty("--p", clamp(-r.top / r.height, 0, 1).toFixed(4));
        });
      }
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  });
})();
