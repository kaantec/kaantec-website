<script>
document.addEventListener("DOMContentLoaded", function () {
  var link = document.getElementById("cookie-settings-link");

  if (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      if (window.__openCookieBanner) {
        window.__openCookieBanner();
      }
    });
  }
});
</script>
/* KAANTEC Cookie-Consent + Google Analytics 4
   GA4 wird erst nach ausdrücklicher Zustimmung geladen.
   Die Entscheidung wird lokal unter "kaantec_cookie_consent" gespeichert.
*/

(function () {
  "use strict";

  var GA_ID = "G-VTR9MHK59G";
  var STORAGE_KEY = "kaantec_cookie_consent";

  function loadGA() {
    if (window.__gaLoaded) return;

    window.__gaLoaded = true;
    window.dataLayer = window.dataLayer || [];

    function gtag() {
      window.dataLayer.push(arguments);
    }

    window.gtag = gtag;

    gtag("js", new Date());
    gtag("config", GA_ID);

    var script = document.createElement("script");
    script.async = true;
    script.src =
      "https://www.googletagmanager.com/gtag/js?id=" +
      encodeURIComponent(GA_ID);

    document.head.appendChild(script);
  }

  function getConsent() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {}

    hideBanner();

    if (value === "accepted") {
      loadGA();
    }
  }

  function hideBanner() {
    var existing = document.getElementById("kaantec-cookie-banner");

    if (existing) {
      existing.remove();
    }
  }

  function showBanner() {
    hideBanner();

    var wrap = document.createElement("div");
    wrap.id = "kaantec-cookie-banner";

    wrap.style.cssText =
      "position:fixed;" +
      "left:0;" +
      "right:0;" +
      "bottom:0;" +
      "z-index:9999;" +
      "background:#193861;" +
      "color:#fff;" +
      "padding:18px 6%;" +
      "display:flex;" +
      "flex-wrap:wrap;" +
      "gap:16px;" +
      "align-items:center;" +
      "justify-content:space-between;" +
      "box-shadow:0 -6px 20px rgba(0,0,0,.15);" +
      "font-family:Arial,Helvetica,sans-serif;";

    var text = document.createElement("p");

    text.style.cssText =
      "margin:0;" +
      "flex:1 1 320px;" +
      "font-size:14px;" +
      "line-height:1.5;";

    text.innerHTML =
      "Wir verwenden Google Analytics, um die Nutzung unserer Website " +
      "statistisch auszuwerten. Google Analytics wird erst aktiviert, " +
      "wenn Sie ausdrücklich zustimmen. Weitere Informationen finden Sie " +
      'in unserer <a href="index.html#datenschutz" ' +
      'style="color:#f39200;">Datenschutzerklärung</a>.';

    var btnWrap = document.createElement("div");

    btnWrap.style.cssText =
      "display:flex;" +
      "gap:10px;" +
      "flex:0 0 auto;";

    var declineBtn = document.createElement("button");

    declineBtn.type = "button";
    declineBtn.textContent = "Ablehnen";

    declineBtn.style.cssText =
      "background:transparent;" +
      "color:#fff;" +
      "border:1px solid #fff;" +
      "padding:10px 18px;" +
      "border-radius:6px;" +
      "font-weight:700;" +
      "cursor:pointer;" +
      "font-size:14px;";

    declineBtn.onclick = function () {
      setConsent("declined");
    };

    var acceptBtn = document.createElement("button");

    acceptBtn.type = "button";
    acceptBtn.textContent = "Akzeptieren";

    acceptBtn.style.cssText =
      "background:#f39200;" +
      "color:#fff;" +
      "border:none;" +
      "padding:10px 18px;" +
      "border-radius:6px;" +
      "font-weight:700;" +
      "cursor:pointer;" +
      "font-size:14px;";

    acceptBtn.onclick = function () {
      setConsent("accepted");
    };

    btnWrap.appendChild(declineBtn);
    btnWrap.appendChild(acceptBtn);

    wrap.appendChild(text);
    wrap.appendChild(btnWrap);

    document.body.appendChild(wrap);
  }

  /*
   * Öffentliche Funktion für den Footer-Link
   * "Cookie-Einstellungen"
   */
  window.__openCookieBanner = function () {
    showBanner();
  };

  document.addEventListener("DOMContentLoaded", function () {
    var consent = getConsent();

    if (consent === "accepted") {
      loadGA();
    } else if (consent !== "declined") {
      showBanner();
    }
  });
})();
