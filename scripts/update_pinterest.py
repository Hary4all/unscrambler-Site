#!/usr/bin/env python3
"""Replace the Pinterest domain-verify code sitewide. Idempotent."""
import os, io, sys
OLD = "196635fd4c2245d1e8708d913a4bd4ac"
NEW = "6e75993339ef3ea10024d7c2b4ad28fa"
limit = int(sys.argv[1]) if len(sys.argv) > 1 else 0
changed = 0
ROOT = sys.argv[2] if len(sys.argv) > 2 else '.'
for dp, dn, fn in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in ('.git', 'ad_screenshots')]
    for f in fn:
        if not f.endswith('.html') or f.startswith('pinterest-'):
            continue
        p = os.path.join(dp, f)
        if limit and changed >= limit:
            continue
        h = io.open(p, encoding='utf-8', errors='surrogateescape', newline='').read()
        if OLD not in h:
            continue
        io.open(p, 'w', encoding='utf-8', errors='surrogateescape',
                newline='').write(h.replace(OLD, NEW))
        changed += 1
print("changed=%d" % changed)
