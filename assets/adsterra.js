(function () {
  "use strict";

  const TOP_BREAKPOINT = 767;
  const ADS = {
    desktopTop: {
      key: "9290d6da1f5eaf36924877067c84b899",
      src: "https://www.highperformanceformat.com/9290d6da1f5eaf36924877067c84b899/invoke.js",
      width: 728,
      height: 90
    },
    mobileTop: {
      key: "41a12246620488db5d5241a65f9b3372",
      src: "https://www.highperformanceformat.com/41a12246620488db5d5241a65f9b3372/invoke.js",
      width: 320,
      height: 50
    },
    box: {
      key: "8e4f3bf9d26244ae79af5b834c747fba",
      src: "https://www.highperformanceformat.com/8e4f3bf9d26244ae79af5b834c747fba/invoke.js",
      width: 300,
      height: 250
    },
    native: {
      src: "https://pl29436369.profitablecpmratenetwork.com/45c605ec5d3e652b4f213084a41b650b/invoke.js",
      containerId: "container-45c605ec5d3e652b4f213084a41b650b"
    }
  };

  let booted = false;

  function isMobileWidth() {
    try {
      return window.matchMedia && window.matchMedia("(max-width: 767px)").matches;
    } catch (err) {
      return false;
    }
  }

  function hasAdContent(root) {
    return !!(root && root.querySelector("iframe, img, embed, object, ins, .adsbygoogle, [id^='google_ads_iframe'], [id^='aswift_']"));
  }

  function getWrapper(slot) {
    return slot && (slot.closest(".ad-wrap") || slot.parentElement);
  }

  function normalizeSpacing(slot, placement) {
    if (placement === "top") {
      slot.style.marginTop = "";
    } else if (placement === "mid" || placement === "lower") {
      if (!slot.style.marginTop) slot.style.marginTop = "24px";
    }
  }

  function prepareSlot(slot, minHeight) {
    const wrapper = getWrapper(slot);
    if (wrapper) {
      wrapper.hidden = false;
      wrapper.style.display = "";
    }
    slot.hidden = false;
    slot.dataset.monetizationState = "loading";
    slot.style.minHeight = minHeight + "px";
    slot.style.height = minHeight + "px";
    slot.style.maxWidth = "100%";
    slot.style.marginLeft = "auto";
    slot.style.marginRight = "auto";
    slot.style.overflow = "hidden";
    slot.innerHTML = "";
  }

  function collapseSlot(slot) {
    const wrapper = getWrapper(slot);
    if (wrapper) {
      wrapper.hidden = true;
      wrapper.style.display = "none";
    }
    slot.dataset.monetizationState = "empty";
    slot.hidden = true;
    slot.innerHTML = "";
    slot.style.minHeight = "0";
    slot.style.height = "0";
    slot.style.overflow = "hidden";
  }

  function waitForAd(slot, timeoutMs) {
    let done = false;
    let observer = null;
    let timer = null;

    const settle = (state) => {
      if (done) return;
      done = true;
      slot.dataset.monetizationState = state;
      if (observer) observer.disconnect();
      if (timer) window.clearTimeout(timer);
      if (state !== "ad") collapseSlot(slot);
    };

    observer = new MutationObserver(() => {
      if (hasAdContent(slot)) settle("ad");
    });

    observer.observe(slot, { childList: true, subtree: true });

    timer = window.setTimeout(() => {
      if (hasAdContent(slot)) {
        settle("ad");
      } else {
        settle("empty");
      }
    }, timeoutMs || 6500);

    if (hasAdContent(slot)) settle("ad");

    return () => {
      if (observer) observer.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }

  function loadScript(src, parent, attrs) {
    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    if (attrs) {
      Object.keys(attrs).forEach((key) => {
        const value = attrs[key];
        if (value !== undefined && value !== null) {
          script.setAttribute(key, String(value));
        }
      });
    }
    parent.appendChild(script);
    return script;
  }

  function mountTop(slot) {
    const mobile = isMobileWidth();
    const cfg = mobile ? ADS.mobileTop : ADS.desktopTop;
    prepareSlot(slot, cfg.height);

    window.atOptions = {
      key: cfg.key,
      format: "iframe",
      height: cfg.height,
      width: cfg.width,
      params: {}
    };

    const script = loadScript(cfg.src, slot);
    waitForAd(slot, 6500);
    return script;
  }

  function mountBox(slot) {
    const cfg = ADS.box;
    prepareSlot(slot, cfg.height);

    window.atOptions = {
      key: cfg.key,
      format: "iframe",
      height: cfg.height,
      width: cfg.width,
      params: {}
    };

    const script = loadScript(cfg.src, slot);
    waitForAd(slot, 6500);
    return script;
  }

  function mountNative(slot) {
    prepareSlot(slot, 90);

    const script = loadScript(ADS.native.src, slot, { "data-cfasync": "false" });
    const container = document.createElement("div");
    container.id = ADS.native.containerId;
    slot.appendChild(container);
    waitForAd(slot, 6500);
    return script;
  }

  function inferPlacement(slot, index) {
    if (slot.dataset.adsterraPlacement) return slot.dataset.adsterraPlacement;
    if (index === 0) return "top";
    if (index === 1) return "mid";
    if (index === 2) return "lower";
    return "ignore";
  }

  function mountSlot(slot, placement) {
    if (!slot || slot.dataset.adsterraMounted === "1") return;

    slot.dataset.adsterraMounted = "1";
    normalizeSpacing(slot, placement);

    if (placement === "top") {
      mountTop(slot);
      return;
    }

    if (placement === "mid") {
      mountBox(slot);
      return;
    }

    if (placement === "lower") {
      mountNative(slot);
      return;
    }

    if (placement === "mobile-bottom") {
      collapseSlot(slot);
      return;
    }

    collapseSlot(slot);
  }

  function boot() {
    if (booted) return;
    booted = true;

    const slots = Array.from(document.querySelectorAll(".ad-slot"));
    if (!slots.length) return;

    for (let i = 0; i < slots.length; i++) {
      mountSlot(slots[i], inferPlacement(slots[i], i));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
