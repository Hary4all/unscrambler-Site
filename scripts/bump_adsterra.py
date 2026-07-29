#!/usr/bin/env python3
"""Bump adsterra.js cache version on every page so the enabled
ad placements load for returning visitors. Idempotent."""
import os, io, re, sys
NEW = "adsterra.js?v=20260726"
limit = int(sys.argv[1]) if len(sys.argv) > 1 else 0
pat = re.compile(r'adsterra\.js\?v=\d+')
changed = 0
for dp, dn, fn in os.walk('.'):
    dn[:] = [d for d in dn if d not in ('.git', 'ad_screenshots')]
    for f in fn:
        if not f.endswith('.html'):
            continue
        p = os.path.join(dp, f)
        if limit and changed >= limit:
            continue
        h = io.open(p, encoding='utf-8', errors='surrogateescape', newline='').read()
        h2 = pat.sub(NEW, h)
        if h2 != h:
            io.open(p, 'w', encoding='utf-8', errors='surrogateescape', newline='').write(h2)
            changed += 1
print("changed=%d" % changed)
