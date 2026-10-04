#!/usr/bin/env python3
"""Read-only checks; report the missing reference artifact explicitly."""
import http.client
import json
import re

def get(path="/", expected=200, port=13680, with_headers=False):
    c = http.client.HTTPConnection("127.0.0.1", port, timeout=15)
    c.request("GET", path, headers={"Host": "localhost"})
    r = c.getresponse()
    body = r.read()
    status = r.status
    headers = {k.lower(): v for k, v in r.getheaders()}
    c.close()
    assert status == expected, (path, status, body[:160])
    return (body, headers) if with_headers else body

home = get()
assert b"Sushi Deck" in home and b"API" in home
get("/admin")
get("/api/decks", expected=401)
assets = set(re.findall(rb'(?:src|href)="(/_next/[^"]+)"', home))
assert assets
for path in assets:
    get(path.decode().replace("&amp;", "&"))
failures = []
try:
    _, headers = get("/sushii-world", expected=307, with_headers=True)
    assert headers["location"] == "http://localhost:13380/presentations/sushii-world"
    briefing = get("/presentations/sushii-world", port=13380)
    assert b"<html" in briefing.lower() and b'id="s19"' in briefing, "The canonical World reference is not the complete 19-slide HTML presentation."
except (AssertionError, OSError) as error:
    failures.append(str(error))
print(json.dumps({"site": "deck-client", "passed": "gallery shell, admin response, anonymous API denial, homepage assets, local canonical World briefing", "status": "partial" if failures else "pass", "failures": failures, "authenticated_workflows": "not configured"}))
raise SystemExit(1 if failures else 0)
