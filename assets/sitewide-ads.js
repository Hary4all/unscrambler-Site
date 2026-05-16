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

  function createSlot(placement, extraClass) {
    const slot = document.createElement("div");
    slot.className = "ad-slot adsterra-slot" + (extraClass ? " " + extraClass : "");
    slot.setAttribute("data-adsterra-placement", placement);
    slot.style.width = "100%";
    slot.style.margin = "0 auto";
    slot.style.overflow = "hidden";
    return slot;
  }

  function ensureSupplementalAdSlots() {
    if (document.querySelector(".ad-supplemental-ads")) return;

    const block = document.createElement("div");
    block.className = "ad-wrap ad-supplemental-ads";
    block.style.width = "100%";
    block.style.maxWidth = "970px";
    block.style.margin = "32px auto";
    block.style.padding = "0 16px";
    block.style.boxSizing = "border-box";

    const wide = createSlot("wide", "ad-slot-wide");
    wide.style.maxWidth = "468px";
    wide.style.minHeight = "60px";

    const sidebar = createSlot("sidebar", "ad-slot-sidebar");
    sidebar.style.maxWidth = "160px";
    sidebar.style.minHeight = "300px";

    const mobileInline = createSlot("mobile-inline", "ad-slot-mobile-inline");
    mobileInline.style.maxWidth = "320px";
    mobileInline.style.minHeight = "50px";

    block.appendChild(wide);
    block.appendChild(sidebar);
    block.appendChild(mobileInline);
    insertBeforeFooter(block);
  }

  function injectAdsterra() {
    if (hasScript(AD_STERRA_SRC)) return;
    ensureSupplementalAdSlots();
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
