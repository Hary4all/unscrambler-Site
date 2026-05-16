(function () {
  "use strict";

  const AD_STERRA_SRC = "/assets/adsterra.js?v=20260518";

  function scripts() {
    return Array.from(document.scripts || []);
  }

  function hasScript(fragment) {
    const wanted = normalizeScriptSrc(fragment);
    return scripts().some((script) => {
      const src = script.src || "";
      return src.indexOf(fragment) !== -1 || normalizeScriptSrc(src) === wanted;
    });
  }

  function normalizeScriptSrc(src) {
    try {
      const url = new URL(src, window.location.href);
      return url.origin + url.pathname;
    } catch (err) {
      return String(src || "").split("?")[0];
    }
  }

  function injectScript(src, attrs) {
    if (hasScript(src)) return;

    const script = document.createElement("script");
    script.src = src;
    script.defer = true;

    if (attrs) {
      Object.keys(attrs).forEach((key) => {
        const value = attrs[key];
        if (value !== undefined && value !== null) {
          script.setAttribute(key, String(value));
        }
      });
    }

    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.body.appendChild(script);
    }
  }

  function injectAdsterra() {
    if (hasScript(AD_STERRA_SRC)) return;
    injectScript(AD_STERRA_SRC);
  }

  function boot() {
    injectAdsterra();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
