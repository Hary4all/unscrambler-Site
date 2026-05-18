(function () {
  "use strict";

  if (!window.location || !window.location.search || window.location.search.length < 2) return;

  function ensureNoindex() {
    var meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    meta.content = "noindex,follow";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureNoindex, { once: true });
  } else {
    ensureNoindex();
  }
})();
