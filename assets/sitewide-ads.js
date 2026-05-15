(function () {
  "use strict";

  const AD_STERRA_SRC = "/assets/adsterra.js?v=20260515";
  const WORDFINDLAB_SRC = "/assets/wordfindlab.js?v=20260515";
  const FALLBACKS = {
    top: {
      label: "Trending Searches",
      title: "Trending Searches",
      copy: "Jump straight to the tools readers use most.",
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
      copy: "Helpful reads that match common visitor intent.",
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
      copy: "More useful pages from the WordFindLab library.",
      links: [
        ["/about/", "About WordFindLab"],
        ["/blog/", "Blog"],
        ["/dictionary/", "Dictionary"],
        ["/contact/", "Contact"],
        ["/privacy-policy/", "Privacy Policy"]
      ]
    }
  };

  function scripts() {
    return Array.from(document.scripts || []);
  }

  function hasScript(fragment) {
    return scripts().some((script) => {
      const src = script.src || "";
      return src.indexOf(fragment) !== -1;
    });
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

  function renderFallbackSlot(slot, placement) {
    if (!slot || slot.dataset.monetizationState === "ad" || slot.dataset.monetizationState === "fallback") return;
    slot.dataset.monetizationState = "fallback";
    slot.classList.add("is-fallback");
    slot.innerHTML = "";
    slot.style.minHeight = placement === "mid" ? "250px" : "90px";
    slot.style.height = "auto";
    slot.style.overflow = "visible";

    const label = slot.parentElement && slot.parentElement.querySelector(".ad-label");
    if (label) {
      label.hidden = true;
      label.textContent = "WordFindLab Picks";
    }

    slot.appendChild(createFallbackCard(placement));
  }

  function createMonetizationSlot(placement) {
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
    label.textContent = "WordFindLab Picks";
    label.hidden = true;
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

  function ensureFallbackMonetizationSlots() {
    if (document.querySelector(".ad-slot")) return;

    const top = createMonetizationSlot("top");
    const mid = createMonetizationSlot("mid");
    const lower = createMonetizationSlot("lower");

    insertBeforeMain(top.wrap);
    insertAfterFirstMainChild(mid.wrap);
    insertBeforeFooter(lower.wrap);
  }

  function renderMissingFallbacks() {
    Array.from(document.querySelectorAll(".ad-slot")).forEach((slot, index) => {
      const placement = slot.dataset.adsterraPlacement || (index === 0 ? "top" : index === 1 ? "mid" : "lower");
      renderFallbackSlot(slot, placement);
    });
  }

  function injectAdsterra() {
    if (hasScript(AD_STERRA_SRC)) return;
    ensureFallbackMonetizationSlots();
    injectScript(AD_STERRA_SRC);
  }

  function boot() {
    injectAdsterra();
    window.setTimeout(renderMissingFallbacks, 7000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
