(function () {
  "use strict";

  const TOP_BREAKPOINT = 767;
  const HPF = {
    desktopTop: {
      key: "9290d6da1f5eaf36924877067c84b899",
      src: "https://www.highperformanceformat.com/9290d6da1f5eaf36924877067c84b899/invoke.js",
      width: 728,
      height: 90,
      wrapperClass: "AdsterraDesktopBanner"
    },
    mobileTop: {
      key: "41a12246620488db5d5241a65f9b3372",
      src: "https://www.highperformanceformat.com/41a12246620488db5d5241a65f9b3372/invoke.js",
      width: 320,
      height: 50,
      wrapperClass: "AdsterraMobileBanner"
    },
    box: {
      key: "8e4f3bf9d26244ae79af5b834c747fba",
      src: "https://www.highperformanceformat.com/8e4f3bf9d26244ae79af5b834c747fba/invoke.js",
      width: 300,
      height: 250,
      wrapperClass: "AdsterraBoxAd"
    },
    mobileSticky: {
      key: "41a12246620488db5d5241a65f9b3372",
      src: "https://www.highperformanceformat.com/41a12246620488db5d5241a65f9b3372/invoke.js",
      width: 320,
      height: 50,
      wrapperClass: "AdsterraMobileStickyBanner"
    }
  };

  const NATIVE = {
    src: "https://pl29436369.profitablecpmratenetwork.com/45c605ec5d3e652b4f213084a41b650b/invoke.js",
    containerId: "container-45c605ec5d3e652b4f213084a41b650b",
    wrapperClass: "AdsterraNativeBanner"
  };

  let booted = false;

  function isMobileWidth() {
    try {
      return window.matchMedia && window.matchMedia("(max-width: 767px)").matches;
    } catch (err) {
      return false;
    }
  }

  function clearSlot(slot, minHeight) {
    slot.innerHTML = "";
    slot.dataset.adsterraMounted = "1";
    slot.style.minHeight = minHeight + "px";
    slot.style.height = minHeight + "px";
    slot.style.maxWidth = "100%";
    slot.style.marginLeft = "auto";
    slot.style.marginRight = "auto";
    slot.style.overflow = "hidden";
  }

  function waitForScript(script, timeoutMs) {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      script.addEventListener("load", finish, { once: true });
      script.addEventListener("error", finish, { once: true });
      window.setTimeout(finish, timeoutMs || 3500);
    });
  }

  async function mountHighPerformanceAd(slot, cfg) {
    clearSlot(slot, cfg.height);

    const shell = document.createElement("div");
    shell.className = cfg.wrapperClass;
    shell.style.width = "100%";
    shell.style.maxWidth = cfg.width + "px";
    shell.style.minHeight = cfg.height + "px";
    shell.style.margin = "0 auto";
    shell.style.display = "flex";
    shell.style.justifyContent = "center";
    shell.style.alignItems = "center";
    shell.style.overflow = "hidden";

    slot.appendChild(shell);

    window.atOptions = {
      key: cfg.key,
      format: "iframe",
      height: cfg.height,
      width: cfg.width,
      params: {}
    };

    const script = document.createElement("script");
    script.async = true;
    script.src = cfg.src;
    shell.appendChild(script);
    await waitForScript(script, 5000);
  }

  async function mountResponsiveTop(slot) {
    const mobile = isMobileWidth();
    await mountHighPerformanceAd(slot, mobile ? HPF.mobileTop : HPF.desktopTop);
  }

  async function mountBox(slot) {
    await mountHighPerformanceAd(slot, HPF.box);
  }

  async function mountNative(slot) {
    clearSlot(slot, 90);
    slot.style.height = "auto";
    slot.style.overflow = "visible";

    const shell = document.createElement("div");
    shell.className = NATIVE.wrapperClass;
    shell.style.width = "100%";
    shell.style.maxWidth = "100%";
    shell.style.minHeight = "90px";
    shell.style.height = "auto";
    shell.style.margin = "0 auto";
    shell.style.display = "flex";
    shell.style.justifyContent = "center";
    shell.style.alignItems = "center";
    shell.style.overflow = "visible";

    const container = document.createElement("div");
    container.id = NATIVE.containerId;
    container.style.width = "100%";
    container.style.minHeight = "90px";
    container.style.height = "auto";
    container.style.display = "flex";
    container.style.justifyContent = "center";
    container.style.alignItems = "center";

    shell.appendChild(container);
    slot.appendChild(shell);

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = NATIVE.src;
    shell.appendChild(script);
    await waitForScript(script, 5000);
  }

  async function mountMobileSticky(slot) {
    if (!isMobileWidth()) {
      slot.hidden = true;
      slot.innerHTML = "";
      return;
    }

    clearSlot(slot, HPF.mobileSticky.height);
    slot.style.height = "auto";
    slot.style.overflow = "visible";
    slot.style.position = "sticky";
    slot.style.bottom = "8px";
    slot.style.zIndex = "120";

    const shell = document.createElement("div");
    shell.className = HPF.mobileSticky.wrapperClass;
    shell.style.width = "100%";
    shell.style.maxWidth = HPF.mobileSticky.width + "px";
    shell.style.minHeight = HPF.mobileSticky.height + "px";
    shell.style.margin = "0 auto";
    shell.style.display = "flex";
    shell.style.justifyContent = "center";
    shell.style.alignItems = "center";
    shell.style.overflow = "hidden";

    slot.appendChild(shell);

    window.atOptions = {
      key: HPF.mobileSticky.key,
      format: "iframe",
      height: HPF.mobileSticky.height,
      width: HPF.mobileSticky.width,
      params: {}
    };

    const script = document.createElement("script");
    script.async = true;
    script.src = HPF.mobileSticky.src;
    shell.appendChild(script);
    await waitForScript(script, 5000);
  }

  function inferPlacement(slot, index) {
    if (slot.dataset.adsterraPlacement) return slot.dataset.adsterraPlacement;
    if (index === 0) return "top";
    if (index === 1) return "mid";
    if (index === 2) return "lower";
    return "ignore";
  }

  function normalizeSpacing(slot, placement) {
    if (placement === "top") {
      slot.style.marginTop = "";
    } else if (placement === "mid" || placement === "lower") {
      if (!slot.style.marginTop) slot.style.marginTop = "24px";
    }
  }

  async function mountSlot(slot, placement) {
    if (!slot || slot.dataset.adsterraMounted === "1") return;

    slot.dataset.adsterraMounted = "1";
    normalizeSpacing(slot, placement);

    if (placement === "top") {
      await mountResponsiveTop(slot);
      return;
    }

    if (placement === "mid") {
      await mountBox(slot);
      return;
    }

    if (placement === "lower") {
      await mountNative(slot);
      return;
    }

    if (placement === "mobile-bottom") {
      await mountMobileSticky(slot);
      return;
    }

    slot.hidden = true;
    slot.innerHTML = "";
  }

  async function boot() {
    if (booted) return;
    booted = true;

    const slots = Array.from(document.querySelectorAll(".ad-slot"));
    if (!slots.length) return;

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const placement = inferPlacement(slot, i);
      await mountSlot(slot, placement);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
