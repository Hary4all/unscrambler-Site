#!/usr/bin/env python3
"""Inject practice.js before </body> and bump premium.css version.
Additive, idempotent."""
import os, io, sys
TAG = '<script defer src="/assets/practice.js?v=20260711"></script>'
SKIP = {'google170471404bdb456f.html','index-improved.html','404-improved.html','SUBPAGE-TEMPLATE.html'}
limit = int(sys.argv[1]) if len(sys.argv) > 1 else 0
changed = 0
for dp, dn, fn in os.walk('.'):
    dn[:] = [d for d in dn if d not in ('.git','ad_screenshots')]
    for f in fn:
        if not f.endswith('.html') or f in SKIP: continue
        p = os.path.join(dp, f)
        if limit and changed >= limit: continue
        h = io.open(p, encoding='utf-8', errors='surrogateescape', newline='').read()
        h2 = h
        if 'practice.js' not in h2 and '</body>' in h2:
            h2 = h2.replace('</body>', TAG + '\n</body>', 1)
        h2 = h2.replace('premium.css?v=20260710', 'premium.css?v=20260711')
        if h2 != h:
            io.open(p, 'w', encoding='utf-8', errors='surrogateescape', newline='').write(h2)
            changed += 1
print('changed=%d' % changed)
