(function () {
  "use strict";

  const AD_STERRA_SRC = "/assets/adsterra.js?v=20260522";
  const WFL_MEASUREMENT_SRC = "/assets/wfl-measurement.js?v=20260601";
  const WFL_GTM_ID = "GTM-T55GC2PM";

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
    block.style.maxWidth = "468px";
    block.style.margin = "24px auto";
    block.style.padding = "0 16px";
    block.style.boxSizing = "border-box";
    block.style.display = "flex";
    block.style.flexWrap = "nowrap";
    block.style.justifyContent = "center";
    block.style.alignItems = "center";
    block.style.gap = "0";

    const wide = createSlot("wide", "ad-slot-wide");
    wide.style.maxWidth = "468px";
    wide.style.minHeight = "60px";

    block.appendChild(wrapSlot(wide, "468px"));
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

  function bootstrapMeasurement() {
    if (typeof window.trackWFL !== "function") {
      window.dataLayer = window.dataLayer || [];
      window.trackWFL = function (eventName, data = {}) {
        window.dataLayer.push({
          event: eventName,
          page_path: window.location.pathname,
          page_title: document.title || "",
          ...data,
        });
      };
    }

    window.WFLMeasurement = window.WFLMeasurement || {};
    window.WFLMeasurement.track = window.trackWFL;
  }

  function injectGtmFallback() {
    if (hasScript(`googletagmanager.com/gtm.js?id=${WFL_GTM_ID}`)) return;

    window.dataLayer = window.dataLayer || [];
    if (!window.__wflGtmBootstrapped) {
      window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      window.__wflGtmBootstrapped = true;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${WFL_GTM_ID}`;
    document.head.appendChild(script);

    if (!document.querySelector(`noscript[data-wfl-gtm="${WFL_GTM_ID}"]`)) {
      const noscript = document.createElement("noscript");
      noscript.setAttribute("data-wfl-gtm", WFL_GTM_ID);
      noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${WFL_GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
      if (document.body) {
        document.body.insertBefore(noscript, document.body.firstChild);
      } else {
        document.addEventListener("DOMContentLoaded", function insertNoscriptOnce() {
          if (document.body && !document.querySelector(`noscript[data-wfl-gtm="${WFL_GTM_ID}"]`)) {
            document.body.insertBefore(noscript, document.body.firstChild);
          }
        }, { once: true });
      }
    }
  }

  function injectMeasurement() {
    if (hasScript(WFL_MEASUREMENT_SRC)) return;
    injectScript(WFL_MEASUREMENT_SRC);
  }

  function boot() {
    bootstrapMeasurement();
    injectGtmFallback();
    injectMeasurement();
    injectAdsterra();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
