(function () {
  "use strict";

  if (window.__wflMeasurementReady) return;
  window.__wflMeasurementReady = true;

  const AD_SELECTOR = [
    "[data-adsterra-placement]",
    ".ad-slot",
    ".ad-wrap",
    ".ad-supplemental-ads",
    ".adsterra-shell",
    ".crossword-ad-wrap",
    ".ad-top",
    ".ad-mid-content",
    ".ad-lower",
    ".ad-side",
    ".ad-footer",
  ].join(", ");

  const seenAds = new WeakSet();
  let adObserver = null;
  let adMutationObserver = null;

  function ensureDataLayer() {
    window.dataLayer = window.dataLayer || [];
    return window.dataLayer;
  }

  function currentPageData() {
    return {
      page_path: window.location.pathname,
      page_title: document.title || "",
    };
  }

  function inferToolName() {
    const path = window.location.pathname.replace(/\/$/, "");
    if (!path || path === "") return "word_finder";
    if (path.includes("crossword-game")) return "crossword_game";
    if (path.includes("word-search-for-kids")) return "word_search_for_kids";
    if (path.includes("printable-word-search")) return "printable_word_search";
    if (path.includes("spelling-games-for-kids")) return "spelling_games_for_kids";
    if (path.includes("family-word-games")) return "family_word_games";
    if (path.includes("dictionary")) return "dictionary";
    if (path.includes("blog")) return "blog";
    if (path.includes("guides")) return "guides";
    if (path.includes("browse")) return "browse_words";
    if (path.includes("pronunciation")) return "pronunciation";
    if (path.includes("trending-words")) return "trending_words";
    return "wordfindlab";
  }

  function inferActionLocation(source) {
    if (source) return source;
    const path = window.location.pathname.replace(/\/$/, "");
    if (!path || path === "") return "homepage";
    if (path.includes("crossword-game")) return "crossword_page";
    if (path.includes("word-search-for-kids")) return "word_search_page";
    if (path.includes("printable-word-search")) return "printable_page";
    if (path.includes("spelling-games-for-kids")) return "spelling_page";
    if (path.includes("family-word-games")) return "family_page";
    if (path.includes("dictionary")) return "dictionary_page";
    if (path.includes("blog")) return "blog_page";
    if (path.includes("guides")) return "guides_page";
    return "page";
  }

  function track(eventName, data) {
    const payload = {
      event: eventName,
      ...currentPageData(),
      tool_name: inferToolName(),
      action_location: inferActionLocation(),
      ...(data || {}),
    };
    ensureDataLayer().push(payload);
    return payload;
  }

  function ensureTrackFunction() {
    if (typeof window.trackWFL !== "function") {
      window.trackWFL = track;
    }
    window.WFLMeasurement = window.WFLMeasurement || {};
    window.WFLMeasurement.track = track;
    window.WFLMeasurement.inferToolName = inferToolName;
    window.WFLMeasurement.inferActionLocation = inferActionLocation;
  }

  function getClarityId() {
    if (window.WFL_CLARITY_ID) return String(window.WFL_CLARITY_ID).trim();
    const meta = document.querySelector(
      'meta[name="ms-clarity-id"], meta[name="microsoft-clarity-id"], meta[name="clarity-id"]'
    );
    return meta ? String(meta.getAttribute("content") || "").trim() : "";
  }

  function loadClarity() {
    const clarityId = getClarityId();
    if (!clarityId) return false;
    if (document.querySelector(`script[data-wfl-clarity="${clarityId}"]`)) return true;

    window.clarity = window.clarity || function () {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${encodeURIComponent(clarityId)}`;
    script.setAttribute("data-wfl-clarity", clarityId);
    document.head.appendChild(script);
    return true;
  }

  function adLocation(el) {
    if (!el) return inferActionLocation("ad_area");
    if (el.closest(".crossword-ad-wrap")) return "crossword_page";
    if (el.closest(".blog-page, .blog-shell, .blog-content")) return "blog_page";
    if (el.closest(".site-footer, footer")) return "page_bottom";
    if (el.closest(".hero-shell, .hero, .hero-section")) return "page_top";
    if (el.closest(".wotd-featured, .wotd-shell, .word-of-the-day")) return "word_of_the_day";
    if (el.closest(".ad-supplemental-ads")) return "page_bottom";
    return inferActionLocation("ad_area");
  }

  function trackAdArea(el) {
    if (!el || seenAds.has(el)) return;
    seenAds.add(el);
    track("ad_area_viewed", {
      tool_name: inferToolName(),
      action_location: adLocation(el),
      ad_placement: el.getAttribute("data-adsterra-placement") || el.dataset.adPlacement || "",
      ad_format: el.className || "",
    });
  }

  function observeAds() {
    const nodes = Array.from(document.querySelectorAll(AD_SELECTOR));
    if (!nodes.length) return;

    if (adObserver) adObserver.disconnect();
    if (adMutationObserver) adMutationObserver.disconnect();

    if ("IntersectionObserver" in window) {
      adObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            trackAdArea(entry.target);
          }
        });
      }, { threshold: [0.35] });

      nodes.forEach((node) => adObserver.observe(node));
    } else {
      nodes.forEach(trackAdArea);
    }

    if ("MutationObserver" in window) {
      adMutationObserver = new MutationObserver(() => {
        document.querySelectorAll(AD_SELECTOR).forEach((node) => {
          if (!seenAds.has(node) && adObserver) {
            adObserver.observe(node);
          }
        });
      });

      adMutationObserver.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  function boot() {
    ensureTrackFunction();
    loadClarity();
    observeAds();
  }

  ensureTrackFunction();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
