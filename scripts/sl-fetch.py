#!/usr/bin/env python3
"""Surfline fetch helper: reads a URL from stdin, fetches it with Chrome TLS
impersonation (curl_cffi), writes the body to stdout. Exit 0 on HTTP 200.
Used by cache-surfline.ts because Surfline's bot protection blocks Node/curl
TLS fingerprints but passes real-Chrome ones."""
import sys

try:
    from curl_cffi import requests as cr
except ImportError:
    sys.stderr.write("curl_cffi missing: python3 -m pip install curl-cffi --break-system-packages\n")
    sys.exit(9)

url = sys.stdin.read().strip()
if not url.startswith("https://"):
    sys.stderr.write("bad url\n")
    sys.exit(8)
try:
    r = cr.get(url, impersonate="chrome", timeout=25)
except Exception as e:
    sys.stderr.write(f"fetch error: {e}\n")
    sys.exit(7)
sys.stdout.write(r.text)
sys.exit(0 if r.status_code == 200 else 1)
