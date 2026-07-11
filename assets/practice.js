/* ============================================================
   WordFindLab — Practice Widget
   Turns any word-list page into a quick unscramble game using
   the words already on that page. Self-gating: renders nothing
   unless the page contains enough suitable words. No deps.
   ============================================================ */
(function () {
  "use strict";

  var ROUNDS = 5;
  var MIN_POOL = 8;

  function collectWords() {
    var seen = {};
    var pool = [];
    var nodes = document.querySelectorAll(".word-link, .wcard .word, .word-grid a");
    for (var i = 0; i < nodes.length; i++) {
      var w = (nodes[i].textContent || "").trim().toUpperCase();
      if (/^[A-Z]{4,8}$/.test(w) && !seen[w]) {
        seen[w] = 1;
        pool.push(w);
      }
    }
    return pool;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function scramble(word) {
    var letters = word.split("");
    var out = word;
    var guard = 0;
    while (out === word && guard < 20) {
      out = shuffle(letters.slice()).join("");
      guard++;
    }
    return out;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function buildWidget(pool) {
    var host = el("section", "pr-practice");
    host.setAttribute("aria-label", "Practice unscrambling words from this list");

    var kicker = el("p", "pr-practice-kicker", "Quick practice");
    var title = el("div", "pr-practice-title", "Can you unscramble words from this list?");
    var sub = el("p", "pr-practice-sub",
      "Five words, picked from this page. Type the unscrambled word and check your answer.");

    var tiles = el("div", "pr-practice-tiles");
    tiles.setAttribute("aria-live", "polite");

    var form = el("form", "pr-practice-row");
    var input = el("input", "pr-practice-input");
    input.type = "text";
    input.autocomplete = "off";
    input.autocapitalize = "characters";
    input.spellcheck = false;
    input.setAttribute("aria-label", "Your unscrambled answer");
    input.placeholder = "Type the word...";
    var check = el("button", "pr-practice-btn", "Check");
    check.type = "submit";
    var skip = el("button", "pr-practice-btn pr-practice-btn--ghost", "Skip");
    skip.type = "button";
    form.appendChild(input);
    form.appendChild(check);
    form.appendChild(skip);

    var feedback = el("p", "pr-practice-feedback");
    feedback.setAttribute("aria-live", "polite");
    var progress = el("p", "pr-practice-progress");

    host.appendChild(kicker);
    host.appendChild(title);
    host.appendChild(sub);
    host.appendChild(tiles);
    host.appendChild(form);
    host.appendChild(feedback);
    host.appendChild(progress);

    var words, round, score, current, done;

    function setTiles(str) {
      tiles.innerHTML = "";
      for (var i = 0; i < str.length; i++) {
        tiles.appendChild(el("span", "pr-practice-tile", str[i]));
      }
    }

    function showRound() {
      current = words[round];
      setTiles(scramble(current));
      input.value = "";
      feedback.textContent = "";
      feedback.className = "pr-practice-feedback";
      progress.textContent = "Word " + (round + 1) + " of " + ROUNDS +
        "  |  Score: " + score;
      input.focus({ preventScroll: true });
    }

    function finish() {
      done = true;
      tiles.innerHTML = "";
      form.style.display = "none";
      var msg = score === ROUNDS ? "Perfect! " + score + "/" + ROUNDS + " - you know this list."
        : score >= 3 ? "Nice! " + score + "/" + ROUNDS + " unscrambled."
        : "You got " + score + "/" + ROUNDS + ". The full list above is your cheat sheet.";
      feedback.textContent = msg;
      feedback.className = "pr-practice-feedback pr-practice-feedback--ok";
      progress.textContent = "";
      var again = el("button", "pr-practice-btn", "Play again");
      again.type = "button";
      again.addEventListener("click", function () {
        host.removeChild(again);
        form.style.display = "";
        start();
      });
      host.appendChild(again);
    }

    function next() {
      round++;
      if (round >= ROUNDS) finish();
      else showRound();
    }

    function start() {
      words = shuffle(pool.slice()).slice(0, ROUNDS);
      round = 0; score = 0; done = false;
      showRound();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (done) return;
      var guess = (input.value || "").trim().toUpperCase();
      if (!guess) return;
      if (guess === current) {
        score++;
        feedback.textContent = "Correct! " + current;
        feedback.className = "pr-practice-feedback pr-practice-feedback--ok";
        setTimeout(next, 650);
      } else {
        feedback.textContent = "Not quite - try again or skip.";
        feedback.className = "pr-practice-feedback pr-practice-feedback--err";
        input.select();
      }
    });

    skip.addEventListener("click", function () {
      if (done) return;
      feedback.textContent = "It was " + current + ".";
      feedback.className = "pr-practice-feedback";
      setTimeout(next, 900);
    });

    start();
    return host;
  }

  function placeWidget(widget) {
    var anchor = document.querySelector(".page-main .related-tools") ||
                 document.querySelector(".page-main .programmatic-faq") ||
                 document.querySelector(".related-tools");
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(widget, anchor);
      return true;
    }
    var main = document.querySelector(".page-main, main");
    if (main) { main.appendChild(widget); return true; }
    return false;
  }

  var attempts = 0;
  function tryInit() {
    attempts++;
    if (document.querySelector(".pr-practice")) return;
    var pool = collectWords();
    if (pool.length >= MIN_POOL) {
      placeWidget(buildWidget(pool));
    } else if (attempts < 4) {
      // word lists may render asynchronously; retry a few times
      setTimeout(tryInit, attempts * 1500);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryInit, { once: true });
  } else {
    tryInit();
  }
})();
