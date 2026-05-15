(function () {
  "use strict";

  const AD_STERRA_SRC = "/assets/adsterra.js?v=20260515";
  const WORDFINDLAB_SRC = "/assets/wordfindlab.js?v=20260515";
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
    if (hasGrow() || hasScript(WORDFINDLAB_SRC) || hasScript(AD_STERRA_SRC)) return;

    window.growMe = window.growMe || function (e) {
      window.growMe._.push(e);
    };
    window.growMe._ = window.growMe._ || [];

    injectScript(GROW_SRC, {
      "data-grow-initializer": "",
      "data-grow-faves-site-id": GROW_SITE_ID
    });
  }

  function createAdSlot(placement) {
    const wrap = document.createElement("div");
    wrap.className = "ad-wrap ad-" + placement + " adsterra-sitewide-wrap";
    wrap.style.width = "100%";
    wrap.style.maxWidth = placement === "mid" ? "336px" : "100%";
    wrap.style.margin = placement === "mid" ? "24px auto" : "20px auto";
    wrap.style.padding = "0 16px";
    wrap.style.boxSizing = "border-box";
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.alignItems = "center";

    const label = document.createElement("span");
    label.className = "ad-label";
    label.textContent = "Advertisement";
    label.style.display = "inline-flex";
    label.style.alignItems = "center";
    label.style.justifyContent = "center";
    label.style.alignSelf = "flex-start";
    label.style.margin = "0 0 8px";
    label.style.padding = "4px 10px";
    label.style.borderRadius = "999px";
    label.style.background = "#eff6ff";
    label.style.color = "#2563eb";
    label.style.fontSize = "11px";
    label.style.fontWeight = "800";
    label.style.letterSpacing = ".08em";
    label.style.textTransform = "uppercase";

    const slot = document.createElement("div");
    slot.className = "ad-slot adsterra-slot ad-slot-" + placement;
    slot.setAttribute("data-adsterra-placement", placement);
    slot.style.width = "100%";
    slot.style.maxWidth = placement === "mid" ? "300px" : (placement === "top" ? "728px" : "100%");
    slot.style.minHeight = placement === "mid" ? "250px" : (placement === "top" ? "90px" : "90px");
    slot.style.margin = "0 auto";
    slot.style.overflow = "hidden";

    wrap.appendChild(label);
    wrap.appendChild(slot);
    return { wrap, slot };
  }

  function insertBeforeFooter(node) {
    const footer = document.querySelector("footer");
    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(node, footer);
    } else if (document.body) {
      document.body.appendChild(node);
    }
  }

  function insertBeforeMain(node) {
    const main = document.querySelector("main");
    if (main && main.parentNode) {
      main.parentNode.insertBefore(node, main);
    } else {
      insertBeforeFooter(node);
    }
  }

  function insertAfterFirstMainChild(node) {
    const main = document.querySelector("main");
    if (!main) return false;
    const first = main.firstElementChild;
    if (first && first.parentNode === main && first.nextElementSibling) {
      main.insertBefore(node, first.nextElementSibling);
      return true;
    }
    main.appendChild(node);
    return true;
  }

  function ensureFallbackAdSlots() {
    if (document.querySelector(".ad-slot")) return;

    const top = createAdSlot("top");
    const mid = createAdSlot("mid");
    const lower = createAdSlot("lower");

    insertBeforeMain(top.wrap);
    insertAfterFirstMainChild(mid.wrap);
    insertBeforeFooter(lower.wrap);
  }

  function injectAdsterra() {
    if (hasScript(AD_STERRA_SRC)) return;
    ensureFallbackAdSlots();
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
