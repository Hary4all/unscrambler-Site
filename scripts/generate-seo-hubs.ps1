$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$siteUrl = "https://wordfindlab.com"
$today = Get-Date -Format "yyyy-MM-dd"

function Encode-Html([string]$value) {
  return [System.Net.WebUtility]::HtmlEncode([string]$value)
}

function Write-Utf8NoBom([string]$path, [string]$content) {
  $dir = Split-Path -Parent $path
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  [System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))
}

function Url-To-Local([string]$url) {
  $clean = $url.TrimStart("/")
  $local = Join-Path $repoRoot ($clean -replace "/", "\")
  return $local
}

function Test-UrlExists([string]$url) {
  $local = Url-To-Local $url
  return (Test-Path $local) -or (Test-Path (Join-Path $local "index.html")) -or (Test-Path ($local + ".html"))
}

function Nav-Html {
@'
<nav class="site-nav">
  <a class="nav-logo" href="/">WordFindLab</a>
  <ul>
    <li><a href="/scrabble-word-finder/">Scrabble Finder</a></li>
    <li><a href="/wordle-solver/">Wordle Solver</a></li>
    <li><a href="/anagram-solver/">Anagram Solver</a></li>
    <li><a href="/word-lists/">Word Lists</a></li>
    <li><a href="/guides/">Guides</a></li>
    <li><a href="/blog/">Blog</a></li>
    <li><a href="/pronunciation/">Pronunciation</a></li>
  </ul>
</nav>
'@
}

function Footer-Html {
@'
<footer class="site-footer">
  <p>&copy; 2026 WordFindLab &mdash; <a href="/privacy-policy/">Privacy Policy</a> &mdash; <a href="/terms/">Terms</a></p>
</footer>
'@
}

function Head-Assets {
@'
<script data-grow-initializer="">!(function(){window.growMe||((window.growMe=function(e){window.growMe._.push(e);}),(window.growMe._=[]));var e=document.createElement("script");(e.type="text/javascript"),(e.src="https://faves.grow.me/main.js"),(e.defer=!0),e.setAttribute("data-grow-faves-site-id","U2l0ZTpmNTM4OGI3Ny04N2JmLTQxNzYtOGJkNS1kNGNmMmNmNDM2MzY=");var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t);})();</script>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-T55GC2PM');</script>
<!-- End Google Tag Manager -->
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-2BKVHJW1RE"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-2BKVHJW1RE');
</script>
<script>
  window.dataLayer = window.dataLayer || [];
  window.trackWFL = window.trackWFL || function(eventName, data = {}) {
    window.dataLayer.push({
      event: eventName,
      page_path: window.location.pathname,
      page_title: document.title || "",
      ...data
    });
  };
</script>
<script defer src="/assets/wfl-measurement.js?v=20260601"></script>

<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="p:domain_verify" content="ce85f169c38454cb352a510f074a7c62" />
<link rel="stylesheet" href="/assets/style.css?v=20260602">
<script src="/assets/noindex-query.js?v=20260518"></script>
'@
}

function Json-Ld([object]$obj) {
  $json = $obj | ConvertTo-Json -Depth 20
  return "<script type=`"application/ld+json`">`n$json`n</script>"
}

function Page-Html {
  param(
    [string]$Title,
    [string]$Description,
    [string]$Canonical,
    [string]$SchemaJson,
    [string]$BodyHtml,
    [string]$FooterScripts = ""
  )

  $t = Encode-Html $Title
  $d = Encode-Html $Description
  $c = Encode-Html $Canonical
  $schema = $SchemaJson
  $headAssets = Head-Assets

@"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
$headAssets
  <link rel="canonical" href="$c">
  <meta name="robots" content="index,follow">
  <title>$t</title>
  <meta name="description" content="$d">
  <meta property="og:type" content="website">
  <meta property="og:title" content="$t">
  <meta property="og:description" content="$d">
  <meta property="og:url" content="$c">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="$t">
  <meta name="twitter:description" content="$d">
  $schema
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T55GC2PM"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
$([string](Nav-Html))
<main class="page-wrap single-col">
$BodyHtml
</main>
$([string](Footer-Html))
$FooterScripts
</body>
</html>
"@
}

function Make-LinkListItem([string]$href, [string]$title, [string]$desc = "") {
  $safeTitle = Encode-Html $title
  $safeHref = Encode-Html $href
  $safeDesc = Encode-Html $desc
@"
      <li class="hub-item"><a href="$safeHref"><strong class="hub-word">$safeTitle</strong>$(if($safeDesc){ " <span>$safeDesc</span>" } else { "" })</a></li>
"@
}

function Build-BrowseHubBody {
  $letterChips = @()
  foreach ($letter in [char[]]([char]'a'..[char]'z')) {
    $upper = ([string]$letter).ToUpper()
    $letterChips += "<a class=`"seo-chip`" href=`"/browse/$letter/`">$upper</a>"
  }

  $lengthChips = @()
  foreach ($len in 2..15) {
    $label = "$len-letter words"
    $lengthChips += "<a class=`"seo-chip`" href=`"/browse/$len-letter-words/`">$label</a>"
  }

  $popular = @(
    Make-LinkListItem "/words-starting-with/" "Words starting with" "Letter-by-letter starter pages",
    Make-LinkListItem "/words-ending-with/" "Words ending with" "Complete A-Z ending routes",
    Make-LinkListItem "/words-containing/" "Words containing" "Find letters in the middle",
    Make-LinkListItem "/word-patterns/" "Word patterns" "Prefix, suffix, and pattern hubs",
    Make-LinkListItem "/word-lists/" "Word lists" "Curated lists for games and puzzles",
    Make-LinkListItem "/pronunciation/" "Pronunciation guides" "Hear and read difficult words",
    Make-LinkListItem "/trending-words/" "Trending words" "Words people are searching right now",
    Make-LinkListItem "/guides/" "Guides hub" "Strategy, learning, and helpers",
    Make-LinkListItem "/blog/" "Blog" "Practical word-game reading"
  ) -join "`n"

@"
  <div class="card seo-hero">
    <p class="wotd-label">Browse hub</p>
    <h1>Browse word pages by letter, length, and pattern</h1>
    <p>Use these indexable browse pages to discover clean A-Z routes, length-based pages, pronunciation guides, and the highest-value WordFindLab hubs.</p>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Browse by letter</h2>
    <div class="seo-chip-grid">$([string]::Join("", $letterChips))</div>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Browse by length</h2>
    <div class="seo-chip-grid">$([string]::Join("", $lengthChips))</div>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Popular pathways</h2>
    <ul class="wotd-hub-list">
$popular
    </ul>
  </div>
"@
}

function Build-BrowseLetterBody([string]$letter) {
  $upper = $letter.ToUpper()
  $paths = @(
    @{ href = "/words-starting-with/$letter/"; title = "Words starting with $upper"; desc = "Starter words for this letter" },
    @{ href = "/words-ending-with/$letter/"; title = "Words ending with $upper"; desc = "Ending patterns and long-tail searches" },
    @{ href = "/words-containing/$letter/"; title = "Words containing $upper"; desc = "Find the letter in the middle" },
    @{ href = "/5-letter-words-starting-with/$letter/"; title = "5-letter words starting with $upper"; desc = "Strong Wordle-friendly routes" },
    @{ href = "/5-letter-words-ending-with/$letter/"; title = "5-letter words ending with $upper"; desc = "Short endings that matter in games" },
    @{ href = "/word-patterns/start/$letter/"; title = "Pattern pages starting with $upper"; desc = "Letter-led pattern discovery" },
    @{ href = "/word-patterns/end/$letter/"; title = "Pattern pages ending with $upper"; desc = "Suffix-led pattern discovery" }
  )

  $quickLinks = @()
  foreach ($path in $paths) {
    if (Test-UrlExists $path.href) {
      $quickLinks += Make-LinkListItem $path.href $path.title $path.desc
    }
  }

  $related = @(
    Make-LinkListItem "/browse/" "Browse hub" "Return to the main browse index",
    Make-LinkListItem "/word-lists/" "Word lists" "Curated list collections",
    Make-LinkListItem "/guides/" "Guides" "Strategy and usage tips",
    Make-LinkListItem "/blog/" "Blog" "Editorial posts and useful word-game reading",
    Make-LinkListItem "/dictionary/" "Dictionary" "Meaning, pronunciation, and examples"
  ) -join "`n"

  $why = if ($letter -in @("q","x","z","j")) {
    "These less common letters are especially useful when you want high-value long-tail searches, tricky hooks, and unusual board patterns."
  } else {
    "These letter pages help Google discover the exact routes players use when they want starter words, ending words, and pattern-led searches."
  }

@"
  <div class="card seo-hero">
    <p class="wotd-label">Letter browse</p>
    <h1>Browse words for $upper</h1>
    <p>$why</p>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Fast routes for $upper</h2>
    <ul class="wotd-hub-list">
$($quickLinks -join "`n")
    </ul>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Why this page helps searchers</h2>
    <p>Players often need one of three things: a word that starts with $upper, a word that ends with $upper, or a pattern page that narrows down options. This page gives them a clean place to start without bouncing through duplicate URLs.</p>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Related pathways</h2>
    <ul class="wotd-hub-list">
$related
    </ul>
  </div>
"@
}

function Build-BrowseLengthBody([int]$length) {
  $links = @(
    @{ href = "/$length-letter-words/"; title = "$length-letter words"; desc = "Core length hub" },
    @{ href = "/$length-letter-words-starting-with/"; title = "$length-letter words starting with"; desc = "Starter routes if available" },
    @{ href = "/$length-letter-words-ending-with/"; title = "$length-letter words ending with"; desc = "Ending routes if available" },
    @{ href = "/words-by-length/"; title = "Words by length"; desc = "Length browsing overview" },
    @{ href = "/word-lists/"; title = "Word lists"; desc = "Curated lists and play helpers" },
    @{ href = "/word-patterns/"; title = "Word patterns"; desc = "Pattern-led search pages" }
  )

  $rendered = @()
  foreach ($link in $links) {
    if (Test-UrlExists $link.href) {
      $rendered += Make-LinkListItem $link.href $link.title $link.desc
    }
  }

  $note = if ($length -le 3) {
    "Short words are powerful for fast searches, hooks, and compact puzzle answers."
  } elseif ($length -le 6) {
    "Mid-length words are where many Wordle and Scrabble searches start to get interesting."
  } else {
    "Longer words build out the deeper keyword families that help the site grow without thin duplicates."
  }

@"
  <div class="card seo-hero">
    <p class="wotd-label">Length browse</p>
    <h1>Browse $length-letter words</h1>
    <p>$note</p>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Useful routes</h2>
    <ul class="wotd-hub-list">
$($rendered -join "`n")
    </ul>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">How this page helps</h2>
    <p>Length pages keep the crawl structure tidy. They also give visitors a quick way to move from a general word search into a focused cluster without extra clicks or duplicate parameter URLs.</p>
  </div>
"@
}

function Build-PronunciationHubBody {
  $words = @(
    @{ href = "/pronunciation/resilience/"; title = "Resilience"; desc = "A strong everyday word" },
    @{ href = "/pronunciation/eloquent/"; title = "Eloquent"; desc = "Clear speech and writing" },
    @{ href = "/pronunciation/whimsical/"; title = "Whimsical"; desc = "Playful and imaginative" },
    @{ href = "/pronunciation/meticulous/"; title = "Meticulous"; desc = "Careful with details" },
    @{ href = "/pronunciation/quixotic/"; title = "Quixotic"; desc = "Idealistic and unusual" },
    @{ href = "/pronunciation/serendipity/"; title = "Serendipity"; desc = "Happy accidental discovery" },
    @{ href = "/pronunciation/magnanimous/"; title = "Magnanimous"; desc = "Generous in spirit" },
    @{ href = "/pronunciation/tenacious/"; title = "Tenacious"; desc = "Persistent and steady" },
    @{ href = "/pronunciation/ubiquitous/"; title = "Ubiquitous"; desc = "Seen everywhere" },
    @{ href = "/pronunciation/cacophony/"; title = "Cacophony"; desc = "A harsh mix of sounds" },
    @{ href = "/pronunciation/labyrinth/"; title = "Labyrinth"; desc = "A maze-like path" },
    @{ href = "/pronunciation/ephemeral/"; title = "Ephemeral"; desc = "Short-lived and temporary" }
  )

  $items = @()
  foreach ($word in $words) {
    $items += Make-LinkListItem $word.href $word.title $word.desc
  }

@"
  <div class="card seo-hero">
    <p class="wotd-label">Pronunciation hub</p>
    <h1>Pronunciation guides that feel useful, not noisy</h1>
    <p>Open a word page to hear it spoken, read its dictionary entry, and move straight to related word-game research.</p>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Popular pronunciation guides</h2>
    <ul class="wotd-hub-list">
$($items -join "`n")
    </ul>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Why pronunciation pages matter</h2>
    <p>These pages open a useful search cluster around how to say a word, what it means, and how it appears in word games or everyday writing. That creates real value for readers and more stable long-tail traffic for WordFindLab.</p>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Related routes</h2>
    <ul class="wotd-hub-list">
$(
  @(
    Make-LinkListItem "/dictionary/" "Dictionary" "Look up meaning and examples",
    Make-LinkListItem "/word-lists/" "Word lists" "Useful word collections",
    Make-LinkListItem "/guides/" "Guides" "Strategy and learning articles",
    Make-LinkListItem "/blog/" "Blog" "Editorial reading for word players",
    Make-LinkListItem "/trending-words/" "Trending words" "Popular search terms"
  ) -join "`n"
)
    </ul>
  </div>
"@
}

function Build-TrendingBody {
  $trending = @(
    @{ href = "/pronunciation/resilience/"; title = "Resilience"; desc = "Vocabulary growth and pronunciation" },
    @{ href = "/pronunciation/eloquent/"; title = "Eloquent"; desc = "A polished, high-value word" },
    @{ href = "/pronunciation/whimsical/"; title = "Whimsical"; desc = "Fun language and creative writing" },
    @{ href = "/pronunciation/meticulous/"; title = "Meticulous"; desc = "A useful descriptive word" },
    @{ href = "/pronunciation/quixotic/"; title = "Quixotic"; desc = "A search term with character" },
    @{ href = "/pronunciation/serendipity/"; title = "Serendipity"; desc = "A favorite for rich vocabulary pages" },
    @{ href = "/pronunciation/magnanimous/"; title = "Magnanimous"; desc = "Great for pronunciation and meaning" },
    @{ href = "/pronunciation/tenacious/"; title = "Tenacious"; desc = "A strong everyday adjective" },
    @{ href = "/pronunciation/ubiquitous/"; title = "Ubiquitous"; desc = "Useful in reading and writing" },
    @{ href = "/pronunciation/cacophony/"; title = "Cacophony"; desc = "A memorable sound word" }
  )

  $items = @()
  foreach ($word in $trending) {
    $items += Make-LinkListItem $word.href $word.title $word.desc
  }

@"
  <div class="card seo-hero">
    <p class="wotd-label">Trending words</p>
    <h1>Trending word searches and vocabulary pages</h1>
    <p>Use this hub to surface the words people are actually exploring, then move them toward pronunciation, dictionary meaning, and related tools.</p>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">What people are looking up</h2>
    <ul class="wotd-hub-list">
$($items -join "`n")
    </ul>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Why this page is worth indexing</h2>
    <p>This is a clean evergreen alternative to a noisy archive page. It gives search engines a stable hub for popular language terms, while visitors get a short path to the exact word they want.</p>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Next steps</h2>
    <ul class="wotd-hub-list">
$(
  @(
    Make-LinkListItem "/pronunciation/" "Pronunciation hub" "Hear difficult words spoken",
    Make-LinkListItem "/dictionary/" "Dictionary" "Definitions and examples",
    Make-LinkListItem "/blog/" "Blog" "Word-game articles and tips",
    Make-LinkListItem "/guides/" "Guides" "Strategy and learning content",
    Make-LinkListItem "/word-of-the-day/" "Word of the Day archive" "Daily archive for repeat visits"
  ) -join "`n"
)
    </ul>
  </div>
"@
}

function Build-PronunciationPageBody([string]$word, [string]$whyText) {
  $wordTitle = ($word.Substring(0,1).ToUpper() + $word.Substring(1))
  $dictionaryHref = "/dictionary/?word=$word"
@"
  <div class="card seo-hero">
    <p class="wotd-label">Pronunciation guide</p>
    <h1>How to pronounce $wordTitle</h1>
    <p>Hear the word, read the phonetic form, and open the definition without leaving the page.</p>
    <div class="seo-chip-grid" style="margin-top:14px">
      <button class="seo-chip" type="button" id="pronunciation-play">Play pronunciation</button>
      <a class="seo-chip" href="$dictionaryHref">Open dictionary</a>
      <a class="seo-chip" href="/pronunciation/">More pronunciation guides</a>
    </div>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Quick pronunciation panel</h2>
    <div class="pronunciation-output">
      <strong class="pronunciation-word" id="pronunciation-word">$wordTitle</strong>
      <div class="pronunciation-pho" id="pronunciation-phonetic">Loading pronunciation...</div>
      <div class="pronunciation-result" id="pronunciation-status" aria-live="polite">Fetching dictionary data...</div>
      <div class="pronunciation-result" id="pronunciation-definition">Definition will appear here.</div>
      <div class="pronunciation-result" id="pronunciation-example">Example sentence will appear here.</div>
      <div class="pronunciation-result" id="pronunciation-meta">Part of speech and related words will appear here.</div>
    </div>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Why this word matters</h2>
    <p>$whyText</p>
    <div class="seo-chip-grid" style="margin-top:14px">
      <a class="seo-chip" href="/dictionary/">Dictionary</a>
      <a class="seo-chip" href="/word-lists/">Word lists</a>
      <a class="seo-chip" href="/guides/">Guides</a>
      <a class="seo-chip" href="/blog/">Blog</a>
    </div>
  </div>
"@
}

function Build-PronunciationScript([string]$word) {
  $jsWord = ($word | ConvertTo-Json -Compress)
@"
<script>
(function () {
  const WORD = $jsWord;
  const wordEl = document.getElementById("pronunciation-word");
  const phoneticEl = document.getElementById("pronunciation-phonetic");
  const statusEl = document.getElementById("pronunciation-status");
  const definitionEl = document.getElementById("pronunciation-definition");
  const exampleEl = document.getElementById("pronunciation-example");
  const metaEl = document.getElementById("pronunciation-meta");
  const playBtn = document.getElementById("pronunciation-play");

  function speak() {
    if (!("speechSynthesis" in window)) {
      if (statusEl) statusEl.textContent = "Your browser does not support speech playback.";
      return;
    }
    try {
      const utterance = new SpeechSynthesisUtterance(WORD);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      if (statusEl) statusEl.textContent = "Playing pronunciation for " + WORD + ".";
    } catch (err) {
      if (statusEl) statusEl.textContent = "Could not play pronunciation right now.";
    }
  }

  async function loadEntry() {
    try {
      const res = await fetch("/api/dictionary?word=" + encodeURIComponent(WORD));
      if (!res.ok) throw new Error("lookup failed");
      const entry = await res.json();
      if (wordEl) wordEl.textContent = entry.word || WORD;
      if (phoneticEl) phoneticEl.textContent = entry.phonetic || "Pronunciation available from the dictionary.";
      if (definitionEl) definitionEl.textContent = entry.primaryDefinition || "A useful word to explore.";
      if (exampleEl) exampleEl.textContent = entry.primaryExample ? ("Example: " + entry.primaryExample) : "Use it in a sentence once you know the meaning.";
      const part = entry.primaryPartOfSpeech ? ("Part of speech: " + entry.primaryPartOfSpeech) : "Dictionary entry";
      const related = [];
      if (Array.isArray(entry.synonyms) && entry.synonyms.length) related.push("Synonyms: " + entry.synonyms.slice(0, 4).join(", "));
      if (Array.isArray(entry.antonyms) && entry.antonyms.length) related.push("Antonyms: " + entry.antonyms.slice(0, 4).join(", "));
      if (metaEl) metaEl.textContent = related.length ? part + " | " + related.join(" | ") : part;
      if (statusEl) statusEl.textContent = "Dictionary entry loaded successfully.";
    } catch (err) {
      if (statusEl) statusEl.textContent = "Could not load live dictionary data. The pronunciation guide still works.";
      if (phoneticEl) phoneticEl.textContent = "Try the pronunciation button above.";
      if (definitionEl) definitionEl.textContent = "This page is still useful even when live data is unavailable.";
      if (exampleEl) exampleEl.textContent = "Come back later to see the live dictionary example.";
      if (metaEl) metaEl.textContent = "Dictionary fallback mode";
    }
  }

  if (playBtn) playBtn.addEventListener("click", speak);
  loadEntry();
})();
</script>
"@
}

function Build-BrowseHubPage {
  $letters = @()
  foreach ($letter in [char[]]([char]'a'..[char]'z')) {
    $upper = ([string]$letter).ToUpper()
    $letters += "<a class=`"seo-chip`" href=`"/browse/$letter/`">$upper</a>"
  }

  $lengths = @()
  foreach ($len in 2..15) {
    $lengths += "<a class=`"seo-chip`" href=`"/browse/$len-letter-words/`">$len-letter words</a>"
  }

  $popularItems = @(
    (Make-LinkListItem "/words-starting-with/" "Words starting with" "Alphabet starter pages")
    (Make-LinkListItem "/words-ending-with/" "Words ending with" "Ending-letter pages")
    (Make-LinkListItem "/words-containing/" "Words containing" "Letter-in-the-middle pages")
    (Make-LinkListItem "/word-patterns/" "Word patterns" "Prefix, suffix, and pattern clusters")
    (Make-LinkListItem "/word-lists/" "Word lists" "Curated lists for games")
    (Make-LinkListItem "/pronunciation/" "Pronunciation guides" "Hear difficult words spoken")
    (Make-LinkListItem "/trending-words/" "Trending words" "Words people are looking up right now")
    (Make-LinkListItem "/guides/" "Guides" "Strategy and learning articles")
    (Make-LinkListItem "/blog/" "Blog" "Editorial reading")
  )

  $body = @"
  <div class="card seo-hero">
    <p class="wotd-label">Browse hub</p>
    <h1>Browse word pages by letter, length, and pattern</h1>
    <p>These clean browse pages help Google and readers move through the site without running into thin duplicate or parameter-based URLs.</p>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Browse by letter</h2>
    <div class="seo-chip-grid">$([string]::Join("", $letters))</div>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Browse by length</h2>
    <div class="seo-chip-grid">$([string]::Join("", $lengths))</div>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Popular pathways</h2>
    <ul class="wotd-hub-list">
$([string]::Join("`n", $popularItems))
    </ul>
  </div>
"@

  $schema = Json-Ld @{
    "@context" = "https://schema.org"
    "@type" = "CollectionPage"
    "name" = "WordFindLab Browse Hub"
    "url" = "$siteUrl/browse/"
    "description" = "Browse word pages by letter, length, and pattern on WordFindLab."
    "mainEntity" = @{
      "@type" = "ItemList"
      "itemListElement" = @(
        @{ "@type"="ListItem"; "position"=1; "url"="$siteUrl/browse/"; "name"="Browse Hub" },
        @{ "@type"="ListItem"; "position"=2; "url"="$siteUrl/pronunciation/"; "name"="Pronunciation Hub" },
        @{ "@type"="ListItem"; "position"=3; "url"="$siteUrl/trending-words/"; "name"="Trending Words" }
      )
    }
  }

  return Page-Html "WordFindLab Browse Hub | Browse by Letter and Length" "Browse word pages by letter, length, and pattern. Jump into clean A-Z pages, length hubs, pronunciation guides, and trending words." "$siteUrl/browse/" $schema $body
}

function Build-BrowseLetterPage([string]$letter) {
  $upper = $letter.ToUpper()
  $links = @(
    @{ href = "/words-starting-with/$letter/"; title = "Words starting with $upper"; desc = "Starter words" },
    @{ href = "/words-ending-with/$letter/"; title = "Words ending with $upper"; desc = "Ending words" },
    @{ href = "/words-containing/$letter/"; title = "Words containing $upper"; desc = "Middle-letter searches" },
    @{ href = "/5-letter-words-starting-with/$letter/"; title = "5-letter words starting with $upper"; desc = "Wordle-friendly routes" },
    @{ href = "/5-letter-words-ending-with/$letter/"; title = "5-letter words ending with $upper"; desc = "Ending patterns" },
    @{ href = "/word-patterns/start/$letter/"; title = "Pattern pages starting with $upper"; desc = "Prefix patterns" },
    @{ href = "/word-patterns/end/$letter/"; title = "Pattern pages ending with $upper"; desc = "Suffix patterns" }
  )

  $items = @()
  foreach ($link in $links) {
    if (Test-UrlExists $link.href) {
      $items += Make-LinkListItem $link.href $link.title $link.desc
    }
  }

  $schema = Json-Ld @{
    "@context" = "https://schema.org"
    "@type" = "CollectionPage"
    "name" = "Browse $upper words"
    "url" = "$siteUrl/browse/$letter/"
    "description" = "Browse words for the letter $upper on WordFindLab."
    "mainEntity" = @{
      "@type" = "ItemList"
      "itemListElement" = @(
        @{ "@type"="ListItem"; "position"=1; "url"="$siteUrl/words-starting-with/$letter/"; "name"="Words starting with $upper" },
        @{ "@type"="ListItem"; "position"=2; "url"="$siteUrl/words-ending-with/$letter/"; "name"="Words ending with $upper" },
        @{ "@type"="ListItem"; "position"=3; "url"="$siteUrl/words-containing/$letter/"; "name"="Words containing $upper" }
      )
    }
  }

  $body = @"
  <div class="card seo-hero">
    <p class="wotd-label">Letter browse</p>
    <h1>Browse words for $upper</h1>
    <p>Use this page to move from a single letter into the exact route you need: starter words, ending words, pattern pages, and useful game searches.</p>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Fast routes for $upper</h2>
    <ul class="wotd-hub-list">
$($items -join "`n")
    </ul>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Why this page helps</h2>
    <p>Letter pages are simple, but they help search engines and readers understand the structure of the site. They also create useful internal links that point to the best existing families for each letter.</p>
  </div>
"@

  return Page-Html "Browse $upper words | WordFindLab" "Browse words for the letter $upper. Open starter pages, ending pages, and letter-specific patterns on WordFindLab." "$siteUrl/browse/$letter/" $schema $body
}

function Build-BrowseLengthPage([int]$length) {
  $links = @(
    @{ href = "/$length-letter-words/"; title = "$length-letter words"; desc = "Core length hub" },
    @{ href = "/$length-letter-words-starting-with/"; title = "$length-letter words starting with"; desc = "Starter routes if available" },
    @{ href = "/$length-letter-words-ending-with/"; title = "$length-letter words ending with"; desc = "Ending routes if available" },
    @{ href = "/words-by-length/"; title = "Words by length"; desc = "Length browse overview" },
    @{ href = "/word-patterns/"; title = "Word patterns"; desc = "Pattern-led discovery" },
    @{ href = "/word-lists/"; title = "Word lists"; desc = "Curated word collections" }
  )

  $items = @()
  foreach ($link in $links) {
    if (Test-UrlExists $link.href) {
      $items += Make-LinkListItem $link.href $link.title $link.desc
    }
  }

  $schema = Json-Ld @{
    "@context" = "https://schema.org"
    "@type" = "CollectionPage"
    "name" = "Browse $length-letter words"
    "url" = "$siteUrl/browse/$length-letter-words/"
    "description" = "Browse $length-letter words on WordFindLab."
    "mainEntity" = @{
      "@type" = "ItemList"
      "itemListElement" = @(
        @{ "@type"="ListItem"; "position"=1; "url"="$siteUrl/$length-letter-words/"; "name"="$length-letter words" },
        @{ "@type"="ListItem"; "position"=2; "url"="$siteUrl/word-lists/"; "name"="Word lists" },
        @{ "@type"="ListItem"; "position"=3; "url"="$siteUrl/word-patterns/"; "name"="Word patterns" }
      )
    }
  }

  $note = if ($length -le 3) {
    "Short words are powerful for hooks, board control, and compact word-game answers."
  } elseif ($length -le 6) {
    "Mid-length words are a sweet spot for Wordle, Scrabble, and many helper searches."
  } else {
    "Longer words help expand the site with cleaner keyword coverage and more useful internal structure."
  }

  $body = @"
  <div class="card seo-hero">
    <p class="wotd-label">Length browse</p>
    <h1>Browse $length-letter words</h1>
    <p>$note</p>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Useful routes</h2>
    <ul class="wotd-hub-list">
$($items -join "`n")
    </ul>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">How this page helps</h2>
    <p>Length pages give Google a clear browse path and help visitors jump from a broad search to a focused word family without unnecessary duplicate or parameter URLs.</p>
  </div>
"@

  return Page-Html "Browse $length-letter words | WordFindLab" "Browse $length-letter words and move into related length and pattern pages on WordFindLab." "$siteUrl/browse/$length-letter-words/" $schema $body
}

function Build-PronunciationHubPage {
  $wordItems = @(
    @{ href = "/pronunciation/resilience/"; title = "Resilience"; desc = "A strong everyday word" },
    @{ href = "/pronunciation/eloquent/"; title = "Eloquent"; desc = "Clear speech and writing" },
    @{ href = "/pronunciation/whimsical/"; title = "Whimsical"; desc = "Playful and imaginative" },
    @{ href = "/pronunciation/meticulous/"; title = "Meticulous"; desc = "Careful with details" },
    @{ href = "/pronunciation/quixotic/"; title = "Quixotic"; desc = "Idealistic and unusual" },
    @{ href = "/pronunciation/serendipity/"; title = "Serendipity"; desc = "Happy accidental discovery" },
    @{ href = "/pronunciation/magnanimous/"; title = "Magnanimous"; desc = "Generous in spirit" },
    @{ href = "/pronunciation/tenacious/"; title = "Tenacious"; desc = "Persistent and steady" },
    @{ href = "/pronunciation/ubiquitous/"; title = "Ubiquitous"; desc = "Seen everywhere" },
    @{ href = "/pronunciation/cacophony/"; title = "Cacophony"; desc = "A harsh mix of sounds" },
    @{ href = "/pronunciation/labyrinth/"; title = "Labyrinth"; desc = "A maze-like path" },
    @{ href = "/pronunciation/ephemeral/"; title = "Ephemeral"; desc = "Short-lived and temporary" }
  )

  $items = @()
  foreach ($word in $wordItems) {
    $items += Make-LinkListItem $word.href $word.title $word.desc
  }

  $relatedItems = @(
    (Make-LinkListItem "/dictionary/" "Dictionary" "Definitions and examples")
    (Make-LinkListItem "/word-lists/" "Word lists" "Useful word collections")
    (Make-LinkListItem "/guides/" "Guides" "Strategy and learning content")
    (Make-LinkListItem "/blog/" "Blog" "Editorial reading for word players")
    (Make-LinkListItem "/trending-words/" "Trending words" "Popular search terms")
  )

  $schema = Json-Ld @{
    "@context" = "https://schema.org"
    "@type" = "CollectionPage"
    "name" = "WordFindLab Pronunciation Guides"
    "url" = "$siteUrl/pronunciation/"
    "description" = "Pronunciation guides for difficult and useful words on WordFindLab."
    "mainEntity" = @{
      "@type" = "ItemList"
      "itemListElement" = @(
        @{ "@type"="ListItem"; "position"=1; "url"="$siteUrl/pronunciation/resilience/"; "name"="Resilience" },
        @{ "@type"="ListItem"; "position"=2; "url"="$siteUrl/pronunciation/eloquent/"; "name"="Eloquent" },
        @{ "@type"="ListItem"; "position"=3; "url"="$siteUrl/pronunciation/whimsical/"; "name"="Whimsical" }
      )
    }
  }

  $body = @"
  <div class="card seo-hero">
    <p class="wotd-label">Pronunciation hub</p>
    <h1>Pronunciation guides that feel useful, not noisy</h1>
    <p>Open a word page to hear it spoken, read the phonetic form, and move straight to the dictionary entry for examples and meaning.</p>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Popular pronunciation guides</h2>
    <ul class="wotd-hub-list">
$($items -join "`n")
    </ul>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Why pronunciation pages matter</h2>
    <p>These pages open a stable search cluster around how to say a word, what it means, and how it behaves in reading, writing, and word games. That gives visitors a clear next step and gives the site better long-tail coverage.</p>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Related routes</h2>
    <ul class="wotd-hub-list">
$([string]::Join("`n", $relatedItems))
    </ul>
  </div>
"@

  return Page-Html "Pronunciation Guides | WordFindLab" "Hear and read difficult words with WordFindLab pronunciation guides, dictionary links, and helpful vocabulary pages." "$siteUrl/pronunciation/" $schema $body
}

function Build-TrendingPage {
  $words = @(
    @{ href = "/pronunciation/resilience/"; title = "Resilience"; desc = "Vocabulary growth and pronunciation" },
    @{ href = "/pronunciation/eloquent/"; title = "Eloquent"; desc = "A polished, high-value word" },
    @{ href = "/pronunciation/whimsical/"; title = "Whimsical"; desc = "Fun language and creative writing" },
    @{ href = "/pronunciation/meticulous/"; title = "Meticulous"; desc = "A useful descriptive word" },
    @{ href = "/pronunciation/quixotic/"; title = "Quixotic"; desc = "A search term with character" },
    @{ href = "/pronunciation/serendipity/"; title = "Serendipity"; desc = "A favorite for rich vocabulary pages" },
    @{ href = "/pronunciation/magnanimous/"; title = "Magnanimous"; desc = "Great for pronunciation and meaning" },
    @{ href = "/pronunciation/tenacious/"; title = "Tenacious"; desc = "A strong everyday adjective" },
    @{ href = "/pronunciation/ubiquitous/"; title = "Ubiquitous"; desc = "Useful in reading and writing" },
    @{ href = "/pronunciation/cacophony/"; title = "Cacophony"; desc = "A memorable sound word" }
  )

  $items = @()
  foreach ($word in $words) {
    $items += Make-LinkListItem $word.href $word.title $word.desc
  }

  $nextSteps = @(
    (Make-LinkListItem "/pronunciation/" "Pronunciation hub" "Hear difficult words spoken")
    (Make-LinkListItem "/dictionary/" "Dictionary" "Definitions and examples")
    (Make-LinkListItem "/blog/" "Blog" "Word-game articles and tips")
    (Make-LinkListItem "/guides/" "Guides" "Strategy and learning content")
    (Make-LinkListItem "/word-of-the-day/" "Word of the Day archive" "Daily archive for repeat visits")
  )

  $schema = Json-Ld @{
    "@context" = "https://schema.org"
    "@type" = "CollectionPage"
    "name" = "Trending Words and Search Terms"
    "url" = "$siteUrl/trending-words/"
    "description" = "Trending words, pronunciation pages, and popular vocabulary searches on WordFindLab."
    "mainEntity" = @{
      "@type" = "ItemList"
      "itemListElement" = @(
        @{ "@type"="ListItem"; "position"=1; "url"="$siteUrl/pronunciation/resilience/"; "name"="Resilience" },
        @{ "@type"="ListItem"; "position"=2; "url"="$siteUrl/pronunciation/eloquent/"; "name"="Eloquent" },
        @{ "@type"="ListItem"; "position"=3; "url"="$siteUrl/pronunciation/whimsical/"; "name"="Whimsical" }
      )
    }
  }

  $body = @"
  <div class="card seo-hero">
    <p class="wotd-label">Trending words</p>
    <h1>Trending word searches and vocabulary pages</h1>
    <p>Use this hub to surface the words people are actually exploring, then move them toward pronunciation, dictionary meaning, and related tools.</p>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">What people are looking up</h2>
    <ul class="wotd-hub-list">
$($items -join "`n")
    </ul>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Why this page is worth indexing</h2>
    <p>This is a clean evergreen alternative to a noisy archive page. It gives search engines a stable hub for popular language terms, while visitors get a short path to the exact word they want.</p>
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px">Next steps</h2>
    <ul class="wotd-hub-list">
$([string]::Join("`n", $nextSteps))
    </ul>
  </div>
"@

  return Page-Html "Trending Words | WordFindLab" "Trending words and search terms on WordFindLab. Explore pronunciation guides, dictionary lookups, and helpful vocabulary pages." "$siteUrl/trending-words/" $schema $body
}

function Update-Sitemap([string[]]$urls) {
  $sitemapPath = Join-Path $repoRoot "sitemap.xml"
  $content = [System.IO.File]::ReadAllText($sitemapPath)
  $entries = New-Object System.Collections.Generic.List[string]
  foreach ($url in $urls) {
    if ($content -notmatch [regex]::Escape("<loc>$url</loc>")) {
      $entries.Add(@"
  <url>
    <loc>$url</loc>
    <lastmod>$today</lastmod>
  </url>
"@) | Out-Null
    }
  }
  if ($entries.Count -gt 0) {
    $insert = [string]::Join("", $entries)
    $content = $content -replace '</urlset>\s*$', ($insert + "</urlset>")
    [System.IO.File]::WriteAllText($sitemapPath, $content, [System.Text.UTF8Encoding]::new($false))
  }
}

$generatedUrls = New-Object System.Collections.Generic.List[string]

# Browse hub
Write-Utf8NoBom (Join-Path $repoRoot "browse\index.html") (Build-BrowseHubPage)
$generatedUrls.Add("$siteUrl/browse/") | Out-Null

# Browse by letter
foreach ($letter in [char[]]([char]'a'..[char]'z')) {
  $letterStr = [string]$letter
  $page = Build-BrowseLetterPage $letterStr
  Write-Utf8NoBom (Join-Path $repoRoot ("browse\$letterStr\index.html")) $page
  $generatedUrls.Add("$siteUrl/browse/$letterStr/") | Out-Null
}

# Browse by length
foreach ($length in 2..15) {
  $page = Build-BrowseLengthPage $length
  Write-Utf8NoBom (Join-Path $repoRoot ("browse\$length-letter-words\index.html")) $page
  $generatedUrls.Add("$siteUrl/browse/$length-letter-words/") | Out-Null
}

# Pronunciation hub and pages
Write-Utf8NoBom (Join-Path $repoRoot "pronunciation\index.html") (Build-PronunciationHubPage)
$generatedUrls.Add("$siteUrl/pronunciation/") | Out-Null

$pronunciationWords = @(
  @{ word = "resilience"; why = "A strong word for bounce-back energy, emotional strength, and thoughtful writing." },
  @{ word = "eloquent"; why = "A polished word that shows up in speeches, essays, and vocabulary growth." },
  @{ word = "whimsical"; why = "A playful word that is fun to say and useful in creative writing." },
  @{ word = "meticulous"; why = "A detail-focused word that is valuable in school writing and puzzles." },
  @{ word = "quixotic"; why = "A memorable vocabulary word with unusual spelling and a clear pronunciation challenge." },
  @{ word = "serendipity"; why = "A favorite long word that often appears in learning, reading, and word-game posts." },
  @{ word = "magnanimous"; why = "A strong vocabulary word that rewards careful pronunciation and definition study." },
  @{ word = "tenacious"; why = "A steady, useful adjective that helps with both learning and gameplay vocabulary." },
  @{ word = "ubiquitous"; why = "A word that looks difficult but becomes easy once you hear it spoken." },
  @{ word = "cacophony"; why = "A high-interest sound word with a memorable spelling pattern." },
  @{ word = "labyrinth"; why = "A maze-like word that works well for pronunciation and meaning exploration." },
  @{ word = "ephemeral"; why = "A shorter but elegant vocabulary word that readers often want to hear aloud." }
)

foreach ($item in $pronunciationWords) {
  $pageHtml = Page-Html `
    "How to pronounce $($item.word.Substring(0,1).ToUpper() + $item.word.Substring(1)) | WordFindLab" `
    "How to pronounce $($item.word), hear it aloud, and open the dictionary definition on WordFindLab." `
    "$siteUrl/pronunciation/$($item.word)/" `
    (Json-Ld @{
      "@context" = "https://schema.org"
      "@type" = "DefinedTerm"
      "name" = $item.word
      "description" = $item.why
      "url" = "$siteUrl/pronunciation/$($item.word)/"
      "inDefinedTermSet" = @{
        "@type" = "DefinedTermSet"
        "name" = "WordFindLab Pronunciation Guides"
        "url" = "$siteUrl/pronunciation/"
      }
    }) `
    (Build-PronunciationPageBody $item.word $item.why) `
    (Build-PronunciationScript $item.word)

  Write-Utf8NoBom (Join-Path $repoRoot ("pronunciation\$($item.word)\index.html")) $pageHtml
  $generatedUrls.Add("$siteUrl/pronunciation/$($item.word)/") | Out-Null
}

# Trending hub
Write-Utf8NoBom (Join-Path $repoRoot "trending-words\index.html") (Build-TrendingPage)
$generatedUrls.Add("$siteUrl/trending-words/") | Out-Null

Update-Sitemap $generatedUrls.ToArray()

Write-Host "Generated $($generatedUrls.Count) SEO hub URLs."
