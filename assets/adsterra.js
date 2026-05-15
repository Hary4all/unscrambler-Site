(function () {
  "use strict";

  const TOP_BREAKPOINT = 767;
  const PROFITABLE = {
    top: "https://pl29454446.profitablecpmratenetwork.com/8e/92/a4/8e92a453b4a6662fbe20618f78c82e3a.js",
    lower: "https://pl29454445.profitablecpmratenetwork.com/19/93/78/199378345af9e1c5636d3fee45063ba1.js"
  };
  const HPF = {
    desktopTop: {
      key: "9290d6da1f5eaf36924877067c84b899",
      src: "https://www.highperformanceformat.com/9290d6da1f5eaf36924877067c84b899/invoke.js",
      width: 728,
      height: 90,
      wrapperClass: "AdsterraDesktopBanner"
    },
    banner468x60: {
      key: "8d14233f0707295292121a6d3f5159fd",
      src: "https://www.highperformanceformat.com/8d14233f0707295292121a6d3f5159fd/invoke.js",
      width: 468,
      height: 60,
      wrapperClass: "AdsterraDesktopBanner"
    },
    banner300x160: {
      key: "fc13f3bf6abc69107ab30ae8fd51e8a7",
      src: "https://www.highperformanceformat.com/fc13f3bf6abc69107ab30ae8fd51e8a7/invoke.js",
      width: 300,
      height: 160,
      wrapperClass: "AdsterraSidebarBanner"
    },
    skyscraper160x600: {
      key: "b22523f470988b1b897c1c4767a04ceb",
      src: "https://www.highperformanceformat.com/b22523f470988b1b897c1c4767a04ceb/invoke.js",
      width: 160,
      height: 600,
      wrapperClass: "AdsterraSkyBanner"
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

  const FALLBACKS = {
    top: {
      label: "Trending Searches",
      title: "Trending Searches",
      copy: "Jump straight to the pages readers use most.",
      links: [
        ["/5-letter-words/", "5 Letter Words"],
        ["/words-ending-with/ing/", "Words Ending in ING"],
        ["/wordle-solver/", "Wordle Helper"],
        ["/scrabble-word-finder/", "Scrabble Cheat"],
        ["/anagram-solver/", "Unscramble Letters"]
      ]
    },
    mid: {
      label: "Popular Guides",
      title: "Popular Guides",
      copy: "Practical reads to help players make better moves.",
      links: [
        ["/guides/", "Strategy Guides"],
        ["/blog/", "Word Game Blog"],
        ["/word-of-the-day/", "Word of the Day"],
        ["/dictionary/", "Dictionary"],
        ["/about/", "About WordFindLab"]
      ]
    },
    lower: {
      label: "Related Word Games",
      title: "Related Word Games",
      copy: "More places to explore WordFindLab without leaving the site.",
      links: [
        ["/about/", "About WordFindLab"],
        ["/blog/", "Blog"],
        ["/dictionary/", "Dictionary"],
        ["/contact/", "Contact"],
        ["/privacy-policy/", "Privacy Policy"]
      ]
    },
    "mobile-bottom": {
      label: "Quick Picks",
      title: "Quick Picks",
      copy: "Fast routes to the tools people tap most on mobile.",
      links: [
        ["/scrabble-word-finder/", "Scrabble"],
        ["/wordle-solver/", "Wordle"],
        ["/anagram-solver/", "Anagram"],
        ["/5-letter-words/", "5 Letter Words"]
      ]
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

  function clearSlot(slot, minHeight) {
    slot.innerHTML = "";
    slot.dataset.adsterraMounted = "1";
    slot.dataset.monetizationState = "loading";
    slot.style.minHeight = minHeight + "px";
    slot.style.height = minHeight + "px";
    slot.style.maxWidth = "100%";
    slot.style.marginLeft = "auto";
    slot.style.marginRight = "auto";
    slot.style.overflow = "hidden";
  }

  function getWrapper(slot) {
    return slot && (slot.closest(".ad-wrap") || slot.parentElement);
  }

  function setWrapperLabel(slot, text) {
    const wrapper = getWrapper(slot);
    if (!wrapper) return;
    const label = wrapper.querySelector(".ad-label");
    if (label) label.textContent = text;
  }

  function setWrapperMode(slot, mode, placement) {
    const wrapper = getWrapper(slot);
    if (!wrapper) return;
    wrapper.classList.toggle("is-fallback", mode === "fallback");
    wrapper.classList.toggle("is-ad", mode === "ad");
    const label = wrapper.querySelector(".ad-label");
    if (label) {
      label.hidden = mode === "fallback";
      if (mode !== "fallback") {
        label.hidden = false;
        label.textContent = "WordFindLab Picks";
      }
    }
  }

  function hasAdContent(root) {
    return !!(root && root.querySelector("iframe, img, embed, object, ins, .adsbygoogle, [id^='google_ads_iframe'], [id^='aswift_']"));
  }

  function createFallbackCard(placement) {
    const cfg = FALLBACKS[placement] || FALLBACKS.lower;
    const card = document.createElement("div");
    card.className = "MonetizationSlot MonetizationSlot--" + placement;

    const inner = document.createElement("div");
    inner.className = "MonetizationSlot-card";

    const eyebrow = document.createElement("div");
    eyebrow.className = "MonetizationSlot-eyebrow";
    eyebrow.textContent = cfg.label;

    const title = document.createElement("h3");
    title.className = "MonetizationSlot-title";
    title.textContent = cfg.title;

    const copy = document.createElement("p");
    copy.className = "MonetizationSlot-copy";
    copy.textContent = cfg.copy;

    const links = document.createElement("div");
    links.className = "MonetizationSlot-links";

    cfg.links.forEach(([href, text]) => {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = text;
      links.appendChild(link);
    });

    inner.appendChild(eyebrow);
    inner.appendChild(title);
    inner.appendChild(copy);
    inner.appendChild(links);
    card.appendChild(inner);
    return card;
  }

  function createDualModeShell(slot, placement, minHeight) {
    const adShell = document.createElement("div");
    adShell.className = "AdsterraShell AdsterraShell--" + placement;
    adShell.style.width = "100%";
    adShell.style.maxWidth =
      placement === "mid" ? "300px" :
      placement === "wide" ? "468px" :
      placement === "sidebar" ? "300px" :
      placement === "top" ? "728px" : "100%";
    adShell.style.minHeight = minHeight + "px";
    adShell.style.margin = "0 auto";
    adShell.style.display = "flex";
    adShell.style.justifyContent = "center";
    adShell.style.alignItems = "center";
    adShell.style.overflow = "hidden";

    const fallbackShell = document.createElement("div");
    fallbackShell.className = "MonetizationSlot-shell MonetizationSlot-shell--" + placement;
    fallbackShell.hidden = true;
    fallbackShell.style.width = "100%";
    fallbackShell.style.minHeight = minHeight + "px";
    fallbackShell.style.margin = "0 auto";
    fallbackShell.style.display = "flex";
    fallbackShell.style.justifyContent = "center";
    fallbackShell.style.alignItems = "stretch";

    const fallbackCard = createFallbackCard(placement);
    fallbackShell.appendChild(fallbackCard);

    slot.appendChild(adShell);
    slot.appendChild(fallbackShell);

    return { adShell, fallbackShell };
  }

  function activateMonetizationState(slot, placement, state, shells) {
    slot.dataset.monetizationState = state;
    setWrapperMode(slot, state === "fallback" ? "fallback" : "ad", placement);
    if (!shells) return;
    shells.adShell.hidden = state === "fallback";
    shells.fallbackShell.hidden = state !== "fallback";
  }

  function watchForAd(slot, placement, shells, timeoutMs) {
    let done = false;
    let observer = null;
    let fallbackTimer = null;
    const settle = (state) => {
      if (done) return;
      done = true;
      activateMonetizationState(slot, placement, state, shells);
      if (observer) observer.disconnect();
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
    };

    observer = new MutationObserver(() => {
      if (hasAdContent(shells.adShell)) {
        settle("ad");
      }
    });

    observer.observe(shells.adShell, { childList: true, subtree: true });

    fallbackTimer = window.setTimeout(() => {
      if (hasAdContent(shells.adShell)) {
        settle("ad");
      } else {
        settle("fallback");
      }
    }, timeoutMs || 6500);

    if (hasAdContent(shells.adShell)) {
      settle("ad");
    }

    return () => {
      observer.disconnect();
      window.clearTimeout(fallbackTimer);
    };
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
    const placement =
      cfg.wrapperClass === "AdsterraBoxAd" ? "mid" :
      cfg.wrapperClass === "AdsterraSidebarBanner" ? "sidebar" :
      cfg.wrapperClass === "AdsterraSkyBanner" ? "sidebar" :
      cfg.wrapperClass === "AdsterraMobileStickyBanner" ? "mobile-bottom" :
      cfg.wrapperClass === "AdsterraDesktopBanner" && cfg.width === 468 ? "wide" :
      "top";
    const shells = createDualModeShell(slot, placement, cfg.height);
    const shell = shells.adShell;
    shell.className = cfg.wrapperClass;

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
    watchForAd(slot, placement, shells, 6500);
    await waitForScript(script, 5000);
  }

  async function mountScriptAd(slot, src, placement, minHeight, wrapperClass) {
    clearSlot(slot, minHeight);
    const shells = createDualModeShell(slot, placement, minHeight);
    const shell = shells.adShell;
    shell.className = wrapperClass;

    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    shell.appendChild(script);
    watchForAd(slot, placement, shells, 6500);
    await waitForScript(script, 5000);
  }

  async function mountResponsiveTop(slot) {
    const mobile = isMobileWidth();
    if (mobile) {
      await mountHighPerformanceAd(slot, HPF.mobileTop);
      return;
    }
    if (window.innerWidth < 992) {
      await mountHighPerformanceAd(slot, HPF.banner468x60);
      return;
    }
    await mountScriptAd(slot, PROFITABLE.top, "top", HPF.desktopTop.height, "ProfitableBannerAd ProfitableBannerAd--top");
  }

  async function mountBox(slot) {
    await mountHighPerformanceAd(slot, HPF.box);
  }

  async function mountWideBanner(slot) {
    if (isMobileWidth()) {
      slot.hidden = true;
      slot.innerHTML = "";
      return;
    }
    await mountHighPerformanceAd(slot, HPF.banner468x60);
  }

  async function mountSidebar(slot) {
    if (isMobileWidth()) {
      slot.hidden = true;
      slot.innerHTML = "";
      return;
    }
    const cfg = window.innerWidth >= 1280 ? HPF.skyscraper160x600 : HPF.banner300x160;
    await mountHighPerformanceAd(slot, cfg);
  }

  async function mountLower(slot) {
    await mountScriptAd(slot, PROFITABLE.lower, "lower", HPF.desktopTop.height, "ProfitableBannerAd ProfitableBannerAd--lower");
  }

  async function mountNative(slot) {
    clearSlot(slot, 90);
    slot.style.height = "auto";
    slot.style.overflow = "visible";

    const shells = createDualModeShell(slot, "lower", 90);
    const shell = shells.adShell;
    shell.className = NATIVE.wrapperClass;
    shell.style.maxWidth = "100%";
    shell.style.height = "auto";
    shell.style.overflow = "visible";
    shell.style.alignItems = "center";

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
    watchForAd(slot, "lower", shells, 6500);
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

    const shells = createDualModeShell(slot, "mobile-bottom", HPF.mobileSticky.height);
    const shell = shells.adShell;
    shell.className = HPF.mobileSticky.wrapperClass;
    shell.style.maxWidth = HPF.mobileSticky.width + "px";

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
    watchForAd(slot, "mobile-bottom", shells, 6500);
    await waitForScript(script, 5000);
  }

  function inferPlacement(slot, index) {
    if (slot.classList.contains("ad-slot-wide")) return "wide";
    if (slot.classList.contains("ad-slot-mobile-bottom")) return "mobile-bottom";
    const explicit = slot.dataset.adsterraPlacement;
    if (slot.closest(".page-sidebar") && explicit === "mid") return "sidebar";
    if (explicit) return explicit;
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

    if (placement === "wide") {
      await mountWideBanner(slot);
      return;
    }

    if (placement === "mid") {
      await mountBox(slot);
      return;
    }

    if (placement === "sidebar") {
      await mountSidebar(slot);
      return;
    }

    if (placement === "lower") {
      await mountLower(slot);
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
