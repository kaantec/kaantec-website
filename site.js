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
    if (!/[?&]nogl/.test(location.search) && glTunnel(canvas, scrub, reduce)) return;
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

  /* ---------- WebGL-Kanalfahrt: live berechneter Lüftungskanal, scrollgesteuert ---------- */
  function glTunnel(canvas, scrub, reduce) {
    var gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) return false;
    var VS = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
    var FS = [
      "precision highp float;",
      "uniform vec2 R;uniform float T,S;uniform vec2 M;",
      "float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}",
      "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);",
      " return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
      "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+7.1;a*=.5;}return v;}",
      "void main(){",
      " vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;",
      " float z0=S*70.;",
      " float clean=smoothstep(.30,.92,S);",
      " vec2 bend=vec2(sin(z0*.13)*.16+M.x*.07,cos(z0*.09)*.09+M.y*.05);",
      " vec2 p=uv-bend*.8;",
      " float r=length(p);float a=atan(p.y,p.x);",
      " float z=.42/(r+.001);",
      " float v=z+z0;float u=a/6.28318;",
      /* Platten und Rippen */
      " float su=fract(u*12.);",
      " float seam=smoothstep(0.,.035,su)*smoothstep(1.,.965,su);",
      " float rp=fract(v*.8);",
      " float rib=smoothstep(0.,.04,rp)*smoothstep(.2,.08,rp);",
      " float ribShade=.55+.6*smoothstep(.0,.5,rp)*smoothstep(1.,.5,rp);",
      " float brush=fbm(vec2(u*160.,v*2.2));",
      " float grime=fbm(vec2(u*14.+3.,v*.55))*.9+fbm(vec2(u*50.,v*1.6))*.45;",
      " grime=smoothstep(.35,1.1,grime)*(1.-clean*.92);",
      /* Material */
      " vec3 metal=mix(vec3(.46,.52,.58),vec3(.72,.80,.88),clean);",
      " metal*=.78+.34*brush;",
      " vec3 dirt=vec3(.17,.13,.09);",
      " vec3 col=mix(metal,dirt,grime*.85);",
      " col*=ribShade*(.55+.45*seam);",
      " col+=rib*vec3(.30,.34,.38)*(.6+clean);",
      /* Lampen */
      " float lp=fract(v/5.);float lamp=exp(-pow((lp-.5)*8.,2.));",
      " float flick=mix(.55+.45*step(.15,h(vec2(floor(v/5.),floor(T*6.)))),1.,clean);",
      " vec3 lc=mix(vec3(1.,.82,.58),vec3(.86,.94,1.),clean);",
      " float acc=exp(-pow((fract(v/26.)-.5)*30.,2.));",
      " float lit=.50+1.2*lamp*flick;",
      " col*=lit;",
      " col+=lc*lamp*flick*.38;",
      " col+=vec3(.95,.55,.12)*acc*.55*(.35+.65*clean);",
      /* Glanz */
      " float spec=pow(max(0.,cos(a-1.3+M.x*.4)),10.)*(.15+.85*clean)*(.4+lamp);",
      " col+=vec3(.8,.9,1.)*spec*.35*(1.-grime);",
      /* Tiefe, Licht am Ende */
      " float fog=smoothstep(.0,.09,r);",
      " vec3 end=mix(vec3(.01,.015,.02),vec3(.55,.72,.92),smoothstep(.55,1.,S));",
      " col=mix(end,col,fog);",
      " col+=end*exp(-r*12.)*.9;",
      /* Staub */
      " float dust=0.;",
      " for(int i=0;i<3;i++){float k=float(i);vec2 q=uv*(5.+k*4.)+vec2(T*.015*(k+1.),-T*.05*(k+1.)-S*(6.+k*5.));",
      "  vec2 id=floor(q);vec2 f=fract(q)-.5;float r0=h(id+k*17.);",
      "  dust+=smoothstep(.09,.0,length(f+(vec2(h(id+3.),h(id+7.))-.5)*.5))*step(.72,r0)*(.25+.2*k);}",
      " col+=vec3(.8,.88,1.)*dust*.55;",
      /* Finish */
      " col*=1.-.5*smoothstep(.45,1.2,length(uv));",
      " col=col/(1.+col*.35);col=pow(col,vec3(.92));",
      " col+=(h(gl_FragCoord.xy+T)-.5)*.03;",
      " gl_FragColor=vec4(col,1.);",
      "}"
    ].join("\n");
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return false;
    var pr = gl.createProgram();
    gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return false;
    gl.useProgram(pr);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uR = gl.getUniformLocation(pr, "R"), uT = gl.getUniformLocation(pr, "T"),
        uS = gl.getUniformLocation(pr, "S"), uM = gl.getUniformLocation(pr, "M");

    var W = 0, H = 0, scale = 1;
    function resize() {
      var small = window.innerWidth < 700;
      scale = Math.min(window.devicePixelRatio || 1, small ? 1.1 : 1.4);
      W = Math.round(window.innerWidth * scale); H = Math.round(window.innerHeight * scale);
      canvas.width = W; canvas.height = H;
      gl.viewport(0, 0, W, H);
    }
    resize();
    window.addEventListener("resize", resize);

    var mx = 0, my = 0, tx = 0, ty = 0;
    window.addEventListener("pointermove", function (e) {
      tx = (e.clientX / window.innerWidth - .5) * 2;
      ty = -(e.clientY / window.innerHeight - .5) * 2;
    }, { passive: true });

    var cur = 0, t0 = performance.now();
    function progress() {
      var r = scrub.getBoundingClientRect();
      var span = r.height - window.innerHeight;
      return span > 0 ? clamp(-r.top / span, 0, 1) : 0;
    }
    doc.classList.add("gl");
    var meter = document.createElement("div");
    meter.className = "gl-meter"; meter.setAttribute("aria-hidden", "true");
    meter.innerHTML = '<span>Verschmutzt</span><i><b></b></i><span>Sauber</span>';
    document.body.appendChild(meter);
    var bar = meter.querySelector("b");
    var layer = document.createElement("div");
    layer.className = "gl-words"; layer.setAttribute("aria-hidden", "true");
    var WORDS = [["SCHMUTZ", 0, 0.5], ["SAUBER", 0.5, 1.01]];
    var CALL = [["Ablagerungen", 0.04, 0.3, "28%", "36%"], ["Fett & Staub", 0.3, 0.5, "66%", "30%"], ["Gereinigt", 0.72, 0.98, "64%", "64%"]];
    var wEls = WORDS.map(function (w) { var e = document.createElement("div"); e.className = "gw"; e.textContent = w[0]; layer.appendChild(e); return e; });
    var cEls = CALL.map(function (c) { var e = document.createElement("div"); e.className = "gc"; e.style.left = c[3]; e.style.top = c[4]; e.innerHTML = "<i></i><span>" + c[0] + "</span>"; layer.appendChild(e); return e; });
    var CARDS = [
      ["ventilator-fettablagerung-vorher", -1, -.25, -14, .06, .38],
      ["lueftungskanal-verstaubt-vorher", 1, .3, 12, .16, .48],
      ["grosskueche-fettfilter-baffle-vorher", -1, .35, -10, .26, .5],
      ["ventilatorrad-gereinigt-nachher", 1, -.3, 12, .56, .84],
      ["lueftungskanal-gereinigt-detail", .25, -.55, -13, .64, .92],
      ["grosskueche-fettfilter-baffle-nachher", 1, .4, 10, .72, .99]
    ];
    var kEls = CARDS.map(function (c) {
      var e = document.createElement("div"); e.className = "gk";
      var im = document.createElement("img"); im.src = "images/webp/" + c[0] + ".webp"; im.alt = ""; im.decoding = "async"; im.loading = "lazy";
      e.appendChild(im); layer.appendChild(e); return e;
    });
    canvas.parentNode.insertBefore(layer, canvas.nextSibling);
    document.querySelectorAll(".contact-card,.panel").forEach(function (el) {
      if (reduce) return;
      el.addEventListener("pointermove", function (e) {
        var b = el.getBoundingClientRect();
        el.style.setProperty("--gx", ((e.clientX - b.left) / b.width * 100).toFixed(1) + "%");
        el.style.setProperty("--gy", ((e.clientY - b.top) / b.height * 100).toFixed(1) + "%");
      });
    });
    canvas.classList.add("on");
    function frame(now) {
      requestAnimationFrame(frame);
      var r = scrub.getBoundingClientRect();
      if (r.bottom < -window.innerHeight * 0.2) return;
      var target = reduce ? 0.3 : progress();
      cur += (target - cur) * (reduce ? 1 : 0.09);
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      gl.uniform2f(uR, W, H);
      gl.uniform1f(uT, reduce ? 0 : (now - t0) / 1000);
      gl.uniform1f(uS, cur);
      gl.uniform2f(uM, reduce ? 0 : mx, reduce ? 0 : my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      bar.style.transform = "scaleY(" + cur.toFixed(3) + ")";
      WORDS.forEach(function (w, i) {
        var k = clamp((cur - w[1]) / (w[2] - w[1]), 0, 1), inside = cur >= w[1] && cur < w[2];
        var a = inside ? Math.sin(k * Math.PI) : 0;
        wEls[i].style.opacity = (a * 0.9).toFixed(3);
        wEls[i].style.transform = "translate(-50%,-50%) scale(" + (0.7 + k * 1.1).toFixed(3) + ")";
      });
      var vw = window.innerWidth, vh = window.innerHeight;
      CARDS.forEach(function (c, i) {
        var k = clamp((cur - c[4]) / (c[5] - c[4]), 0, 1), on = cur >= c[4] && cur <= c[5];
        var e = kEls[i];
        e.style.opacity = on ? (Math.min(1, Math.sin(k * Math.PI) * 2.2) * 0.92).toFixed(3) : 0;
        var sc = 0.25 + k * 1.15, ease = k * k;
        e.style.transform = "translate(-50%,-50%) translate(" + (c[1] * (0.08 + ease * 0.52) * vw).toFixed(1) + "px," + (c[2] * ease * vh * 0.7).toFixed(1) + "px) scale(" + sc.toFixed(3) + ") rotateY(" + (c[3] * (1 - k) * 2).toFixed(1) + "deg) rotateZ(" + (c[3] * 0.4).toFixed(1) + "deg)";
      });
      CALL.forEach(function (c, i) {
        var k = clamp((cur - c[1]) / (c[2] - c[1]), 0, 1);
        cEls[i].style.opacity = (cur >= c[1] && cur <= c[2] ? Math.min(1, Math.sin(k * Math.PI) * 2.2) : 0).toFixed(3);
      });
      meter.classList.toggle("off", r.bottom < window.innerHeight * 0.6);
    }
    requestAnimationFrame(frame);
    return true;
  }
})();
