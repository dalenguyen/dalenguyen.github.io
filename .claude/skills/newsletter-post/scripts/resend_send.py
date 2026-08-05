#!/usr/bin/env python3
"""Send a blog-post announcement through Resend.

Modes:
  audience                       Print the audience name + active/unsubscribed counts (read-only).
  test      --to EMAIL --html F  Send ONE transactional email (POST /emails) as a preview.
  broadcast --html F             Create + send a Broadcast to the whole audience.
  status    --broadcast ID       Print a broadcast's status + sent_at.

The HTML file may contain the placeholder `%%UNSUB%%` for the unsubscribe href;
this script fills it per mode:
  - test      -> {SITE}/unsubscribe?email=<recipient>   (the site's own unsubscribe flow)
  - broadcast -> {{{RESEND_UNSUBSCRIBE_URL}}}            (Resend-managed, one per recipient)

Config resolves from env first, then falls back to the dalenguyen.me defaults:
  RESEND_API_KEY       (if unset, fetched from Secret Manager via gcloud — see get_key)
  RESEND_FROM          default: "Dale Nguyen <hello@news.dalenguyen.me>"
  RESEND_AUDIENCE_ID   default: "1736935e-03b2-41a8-bfa8-e551ede7854b"
  SITE_URL             default: "https://dalenguyen.me"

Gotcha baked in: api.resend.com is behind Cloudflare, which 403s (error 1010)
the default urllib/library User-Agent. Every request sends a browser UA.
"""
import argparse
import json
import os
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

API = "https://api.resend.com"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
DEFAULT_FROM = "Dale Nguyen <hello@news.dalenguyen.me>"
DEFAULT_AUDIENCE = "1736935e-03b2-41a8-bfa8-e551ede7854b"
DEFAULT_SITE = "https://dalenguyen.me"
SECRET_NAME = "RESEND_API_KEY"
GCP_PROJECT = "dalenguyen-prod"
GCP_ACCOUNT = "dale@dalenguyen.me"


def get_key() -> str:
    key = os.environ.get("RESEND_API_KEY", "").strip()
    if key:
        return key
    # Fall back to Secret Manager (the key lives there; never print it).
    try:
        out = subprocess.run(
            ["gcloud", "secrets", "versions", "access", "latest",
             f"--secret={SECRET_NAME}", f"--project={GCP_PROJECT}", f"--account={GCP_ACCOUNT}"],
            capture_output=True, text=True, timeout=60,
        )
        if out.returncode == 0 and out.stdout.strip():
            return out.stdout.strip()
        sys.exit(f"ERROR: could not read {SECRET_NAME} from Secret Manager: {out.stderr.strip()[:200]}")
    except Exception as e:  # noqa: BLE001
        sys.exit(f"ERROR: RESEND_API_KEY not in env and gcloud fetch failed: {e}")


def _req(method: str, path: str, key: str, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    headers = {"Authorization": f"Bearer {key}", "User-Agent": UA}
    if data is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(f"{API}{path}", data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:400]
        sys.exit(f"ERROR: {method} {path} -> HTTP {e.code}: {body}")


def cmd_audience(args, key):
    aud = args.audience
    _, meta = _req("GET", f"/audiences/{aud}", key)
    _, contacts = _req("GET", f"/audiences/{aud}/contacts", key)
    data = contacts.get("data") or []
    unsub = sum(1 for c in data if c.get("unsubscribed"))
    print(f"audience: {meta.get('name')} ({aud})")
    print(f"contacts: {len(data)} | unsubscribed: {unsub} | active: {len(data) - unsub}")


def _fill(html_path: str, unsub_href: str) -> str:
    html = open(html_path, encoding="utf-8").read()
    if "%%UNSUB%%" not in html:
        print("WARN: %%UNSUB%% placeholder not found in HTML — no unsubscribe link will be set.",
              file=sys.stderr)
    return html.replace("%%UNSUB%%", unsub_href)


def cmd_test(args, key):
    to = args.to
    unsub = f"{args.site}/unsubscribe?email={urllib.parse.quote(to)}"
    html = _fill(args.html, unsub)
    st, body = _req("POST", "/emails", key, {
        "from": args.sender, "to": [to], "subject": args.subject,
        "html": html,
        "headers": {"List-Unsubscribe": f"<{unsub}>",
                    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"},
    })
    print(f"TEST sent status={st} id={body.get('id')} to={to} from={args.sender}")


def cmd_broadcast(args, key):
    html = _fill(args.html, "{{{RESEND_UNSUBSCRIBE_URL}}}")
    st, created = _req("POST", "/broadcasts", key, {
        "audience_id": args.audience, "from": args.sender,
        "subject": args.subject, "name": args.name, "html": html,
    })
    bid = created.get("id")
    if not bid:
        sys.exit(f"ERROR: broadcast create returned no id: {created}")
    print(f"broadcast created status={st} id={bid}")
    if args.draft:
        print("draft only (--draft) — NOT sent. Send later with the dashboard or a /send call.")
        return
    st2, sent = _req("POST", f"/broadcasts/{bid}/send", key, {})
    print(f"broadcast SEND status={st2} id={bid}")


def cmd_status(args, key):
    _, b = _req("GET", f"/broadcasts/{args.broadcast}", key)
    for k in ("id", "name", "status", "sent_at", "subject"):
        if k in b:
            print(f"  {k}: {b[k]}")


def main():
    p = argparse.ArgumentParser(description="Resend blog-post announcement sender")
    p.add_argument("--sender", default=os.environ.get("RESEND_FROM", DEFAULT_FROM))
    p.add_argument("--audience", default=os.environ.get("RESEND_AUDIENCE_ID", DEFAULT_AUDIENCE))
    p.add_argument("--site", default=os.environ.get("SITE_URL", DEFAULT_SITE))
    sub = p.add_subparsers(dest="mode", required=True)

    sub.add_parser("audience")

    t = sub.add_parser("test")
    t.add_argument("--to", required=True)
    t.add_argument("--html", required=True)
    t.add_argument("--subject", required=True)

    b = sub.add_parser("broadcast")
    b.add_argument("--html", required=True)
    b.add_argument("--subject", required=True)
    b.add_argument("--name", required=True, help="internal label shown in the Resend dashboard")
    b.add_argument("--draft", action="store_true", help="create the broadcast but do NOT send it")

    s = sub.add_parser("status")
    s.add_argument("--broadcast", required=True)

    args = p.parse_args()
    key = get_key()
    {"audience": cmd_audience, "test": cmd_test, "broadcast": cmd_broadcast, "status": cmd_status}[args.mode](args, key)


if __name__ == "__main__":
    main()
