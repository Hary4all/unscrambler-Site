/* ============================================================
   WordFindLab — Premium UX Enhancements
   Lightweight, dependency-free, loaded with `defer`.
   Adds: scroll reveal, number counters, back-to-top,
   skip link, copy-button feedback. Purely progressive —
   nothing here is required for core functionality.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Skip-to-content link (a11y) ---------- */
  function addSkipLink() {
    if (document.querySelector(".skip-to-content")) return;
    var main = document.querySelector("main, .page-main, .page-wrap");
    if (!main) return;
    if (!main.id) main.id = "main-content";
    var a = document.createElement("a");
    a.className = "skip-to-content";
    a.href = "#" + main.id;
    a.textContent = "Skip to main content";
    document.body.insertBefore(a, document.body.firstChild);
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    var selectors = [
      ".page-main > section", ".page-main > div",
      ".seo-section > *", ".faq-item", ".feature-card",
      ".family-card", ".trust-card", ".game-cta-card",
      ".footer-mega-inner > *"
    ];
    var els = document.querySelectorAll(selectors.join(","));
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("pr-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    els.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      // Never hide above-the-fold content — reveal only below viewport.
      if (rect.top > window.innerHeight * 0.92) {
        el.classList.add("pr-reveal");
        io.observe(el);
      }
    });
  }

  /* ---------- Number counters ---------- */
  function animateCounter(el) {
    var text = el.getAttribute("data-counter") || el.textContent || "";
    var match = text.replace(/,/g, "").match(/([\d.]+)/);
    if (!match) return;
    var target = parseFloat(match[1]);
    if (!isFinite(target) || target <= 0) return;
    var prefix = text.slice(0, text.indexOf(match[1]) === -1 ? 0 : text.replace(/,/g, "").indexOf(match[1]));
    var suffix = text.replace(/,/g, "").split(match[1])[1] || "";
    var decimals = (match[1].split(".")[1] || "").length;
    var duration = 900;
    var start = null;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = prefix +
        val.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }) + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = text;
    }
    requestAnimationFrame(frame);
  }

  function initCounters() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    var els = document.querySelectorAll("[data-counter], .stat-pill .num, .stat-num");
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Back to top ---------- */
  function initTopButton() {
    if (document.querySelector(".pr-top-btn")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pr-top-btn";
    btn.setAttribute("aria-label", "Back to top");
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>';
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
    document.body.appendChild(btn);
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        btn.classList.toggle("pr-show", window.scrollY > 700);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Boot ---------- */
  function boot() {
    try { addSkipLink(); } catch (e) {}
    try { initReveal(); } catch (e) {}
    try { initCounters(); } catch (e) {}
    try { initTopButton(); } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
