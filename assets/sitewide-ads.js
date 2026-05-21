(function () {
  "use strict";

  const AD_STERRA_SRC = "/assets/adsterra.js?v=20260521";

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

  function wrapSlot(slot, maxWidth) {
    const wrapper = document.createElement("div");
    wrapper.className = "ad-wrap ad-supplemental-slot";
    wrapper.style.width = "100%";
    wrapper.style.maxWidth = maxWidth;
    wrapper.style.margin = "0";
    wrapper.style.padding = "0";
    wrapper.style.boxSizing = "border-box";
    wrapper.appendChild(slot);
    return wrapper;
  }

  function insertBeforeFooter(node) {
    const footer = document.querySelector(".site-footer, footer");
    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(node, footer);
      return;
    }

    document.body.appendChild(node);
  }

  function ensureSupplementalAdSlots() {
    if (document.querySelector(".ad-supplemental-ads")) return false;

    const block = document.createElement("div");
    block.className = "ad-supplemental-ads";
    block.style.width = "100%";
    block.style.maxWidth = "970px";
    block.style.margin = "24px auto";
    block.style.padding = "0 16px";
    block.style.boxSizing = "border-box";
    block.style.display = "flex";
    block.style.flexWrap = "wrap";
    block.style.justifyContent = "center";
    block.style.alignItems = "flex-start";
    block.style.gap = "16px";

    const wide = createSlot("wide", "ad-slot-wide");
    wide.style.maxWidth = "468px";
    wide.style.minHeight = "60px";

    const sidebar = createSlot("sidebar", "ad-slot-sidebar");
    sidebar.style.maxWidth = "160px";
    sidebar.style.minHeight = "300px";

    const skyscraper = createSlot("skyscraper", "ad-slot-skyscraper");
    skyscraper.style.maxWidth = "160px";
    skyscraper.style.minHeight = "600px";

    const mobileInline = createSlot("mobile-inline", "ad-slot-mobile-inline");
    mobileInline.style.maxWidth = "320px";
    mobileInline.style.minHeight = "50px";

    block.appendChild(wrapSlot(wide, "468px"));
    block.appendChild(wrapSlot(sidebar, "160px"));
    block.appendChild(wrapSlot(skyscraper, "160px"));
    block.appendChild(wrapSlot(mobileInline, "320px"));
    insertBeforeFooter(block);
    return true;
  }

  function refreshMountedAds() {
    if (window.WordFindLabAds && typeof window.WordFindLabAds.refresh === "function") {
      window.WordFindLabAds.refresh();
      return;
    }

    try {
      document.dispatchEvent(new CustomEvent("wfl:ads-slots-added"));
    } catch (err) {
      const event = document.createEvent("Event");
      event.initEvent("wfl:ads-slots-added", true, true);
      document.dispatchEvent(event);
    }
  }

  function injectAdsterra() {
    const addedSlots = ensureSupplementalAdSlots();
    if (hasScript(AD_STERRA_SRC)) {
      if (addedSlots) refreshMountedAds();
      return;
    }
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
