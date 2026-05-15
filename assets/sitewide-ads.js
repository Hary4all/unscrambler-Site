(function () {
  "use strict";

  const AD_STERRA_SRC = "/assets/adsterra.js?v=20260515";
  const UNSCRAMBLER_SRC = "/assets/unscrambler.js?v=20260515";
  const GROW_SRC = "https://faves.grow.me/main.js";
  const GROW_SITE_ID = "U2l0ZTpmNTM4OGI3Ny04N2JmLTQxNzYtOGJkNS1kNGNmMmNmNDM2MzY=";

  function scripts() {
    return Array.from(document.scripts || []);
  }

  function hasScript(fragment) {
    return scripts().some((script) => {
      const src = script.src || "";
      return src.indexOf(fragment) !== -1;
    });
  }

  function hasGrow() {
    return hasScript(GROW_SRC) || Boolean(window.growMe);
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

  function injectGrow() {
    if (hasGrow() || hasScript(UNSCRAMBLER_SRC) || hasScript(AD_STERRA_SRC)) return;

    window.growMe = window.growMe || function (e) {
      window.growMe._.push(e);
    };
    window.growMe._ = window.growMe._ || [];

    injectScript(GROW_SRC, {
      "data-grow-initializer": "",
      "data-grow-faves-site-id": GROW_SITE_ID
    });
  }

  function ensureAdSlot() {
    if (document.querySelector(".ad-slot")) return;

    const slot = document.createElement("div");
    slot.className = "ad-slot ad-slot-native adsterra-slot adsterra-sitewide-slot";
    slot.setAttribute("data-adsterra-placement", "lower");
    slot.style.maxWidth = "100%";
    slot.style.margin = "24px auto";
    slot.style.overflow = "hidden";
    slot.style.minHeight = "90px";

    const wrap = document.createElement("div");
    wrap.className = "adsterra-wrap adsterra-sitewide-wrap";
    wrap.style.width = "100%";
    wrap.style.maxWidth = "100%";
    wrap.style.margin = "0 auto";
    wrap.style.padding = "0 16px";
    wrap.appendChild(slot);

    const footer = document.querySelector("footer");
    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(wrap, footer);
    } else if (document.body) {
      document.body.appendChild(wrap);
    }
  }

  function injectAdsterra() {
    if (hasScript(AD_STERRA_SRC)) return;
    ensureAdSlot();
    injectScript(AD_STERRA_SRC);
  }

  function boot() {
    injectGrow();
    injectAdsterra();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
