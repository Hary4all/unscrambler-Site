const FACEBOOK_PAGE_URL = "https://www.facebook.com/profile.php?id=61589971622325";

function trackWFL(eventName, data = {}) {
  const tracker = typeof window.trackWFL === "function"
    ? window.trackWFL
    : (window.WFLMeasurement && typeof window.WFLMeasurement.track === "function"
        ? window.WFLMeasurement.track
        : null);
  const payload = {
    page_path: window.location.pathname,
    page_title: document.title || "WordFindLab",
    ...data,
  };
  if (tracker) {
    return tracker(eventName, payload);
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...payload });
  return payload;
}

function inferShareLocation(button, platform) {
  if (!button) return window.location.pathname || "/";
  const explicit = button.getAttribute("data-share-location")
    || button.closest("[data-share-location]")?.getAttribute("data-share-location");
  if (explicit) return explicit;

  const id = String(button.id || "").toLowerCase();
  if (id.includes("modal")) return "completion_modal";
  if (id.includes("board")) return "board_share_bar";
  if (id.includes("wordsearch")) return "word_search_page";
  if (id.includes("printable")) return "printable_word_search";
  if (id.includes("spelling")) return "spelling_games";
  if (id.includes("family")) return "family_games";
  if (platform === "copy_link" && id.includes("copy")) return "copy_link_button";
  return button.closest(".modal, .share-panel, .share-bar, .social-share, .board-social") ? "share_panel" : window.location.pathname || "/";
}

function shareUrl(url, text) {
  const shareTarget = encodeURIComponent(url || window.location.href);
  const quote = encodeURIComponent(text || document.title || "WordFindLab");
  return `https://www.facebook.com/sharer/sharer.php?u=${shareTarget}&quote=${quote}`;
}

async function copyLink(url, label) {
  const target = url || window.location.href;
  try {
    await navigator.clipboard.writeText(target);
    return true;
  } catch (err) {
    const ta = document.createElement("textarea");
    ta.value = target;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      return true;
    } catch (copyErr) {
      return false;
    } finally {
      document.body.removeChild(ta);
    }
  }
}

function openFacebookShare(url, text) {
  window.open(shareUrl(url, text), "_blank", "noopener,noreferrer");
}

function setButtonBusy(button, text, timeout = 1500) {
  if (!button) return;
  const original = button.textContent;
  button.disabled = true;
  button.textContent = text || "Copied!";
  window.setTimeout(() => {
    button.textContent = original;
    button.disabled = false;
  }, timeout);
}

function wireShareGroup(root = document) {
  const copyButtons = root.querySelectorAll("[data-copy-link]");
  copyButtons.forEach((button) => {
    if (button.dataset.familySocialReady === "1") return;
    button.dataset.familySocialReady = "1";
    button.addEventListener("click", async () => {
      trackWFL("share_clicked", {
        tool_name: "family_word_games",
        action_location: inferShareLocation(button, "copy_link"),
        share_platform: "copy_link",
      });
      const success = await copyLink(button.getAttribute("data-copy-link") || window.location.href);
      setButtonBusy(button, success ? "Copied!" : "Copy failed");
    });
  });

  const fbButtons = root.querySelectorAll("[data-facebook-share]");
  fbButtons.forEach((button) => {
    if (button.dataset.familySocialReady === "1") return;
    button.dataset.familySocialReady = "1";
    button.addEventListener("click", () => {
      trackWFL("share_clicked", {
        tool_name: "family_word_games",
        action_location: inferShareLocation(button, "facebook"),
        share_platform: "facebook",
      });
      openFacebookShare(
        button.getAttribute("data-facebook-share") || window.location.href,
        button.getAttribute("data-facebook-quote") || document.title
      );
    });
  });
}

const WFLSocial = {
  FACEBOOK_PAGE_URL,
  shareUrl,
  copyLink,
  openFacebookShare,
  wireShareGroup,
};

export { FACEBOOK_PAGE_URL, shareUrl, copyLink, openFacebookShare, setButtonBusy, wireShareGroup };

window.WFLSocial = WFLSocial;

document.addEventListener("DOMContentLoaded", () => wireShareGroup());
