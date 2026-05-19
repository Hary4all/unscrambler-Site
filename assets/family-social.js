const FACEBOOK_PAGE_URL = "https://www.facebook.com/profile.php?id=61589971622325";

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
      const success = await copyLink(button.getAttribute("data-copy-link") || window.location.href);
      setButtonBusy(button, success ? "Copied!" : "Copy failed");
    });
  });

  const fbButtons = root.querySelectorAll("[data-facebook-share]");
  fbButtons.forEach((button) => {
    if (button.dataset.familySocialReady === "1") return;
    button.dataset.familySocialReady = "1";
    button.addEventListener("click", () => {
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
