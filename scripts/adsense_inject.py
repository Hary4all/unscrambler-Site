#!/usr/bin/env python3
"""Insert the AdSense head snippet on every HTML page missing it.
Purely additive, idempotent."""
import os, io, sys

TAG = ('<script async src="https://pagead2.googlesyndication.com/pagead/js/'
       'adsbygoogle.js?client=ca-pub-7302891841207454" '
       'crossorigin="anonymous"></script>')
SKIP = {'google170471404bdb456f.html', 'index-improved.html',
        '404-improved.html', 'SUBPAGE-TEMPLATE.html'}
limit = int(sys.argv[1]) if len(sys.argv) > 1 else 0
changed = scanned = 0
for dp, dn, fn in os.walk('.'):
    dn[:] = [d for d in dn if d not in ('.git', 'ad_screenshots')]
    for f in fn:
        if not f.endswith('.html') or f in SKIP:
            continue
        p = os.path.join(dp, f)
        scanned += 1
        if limit and changed >= limit:
            continue
        h = io.open(p, encoding='utf-8', errors='surrogateescape',
                    newline='').read()
        if 'ca-pub-7302891841207454' in h or '</head>' not in h:
            continue
        h = h.replace('</head>', TAG + '\n</head>', 1)
        io.open(p, 'w', encoding='utf-8', errors='surrogateescape',
                newline='').write(h)
        changed += 1
print(f'scanned={scanned} changed={changed}')
