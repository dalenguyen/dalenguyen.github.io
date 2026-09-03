---
title: "Running Chrome DevTools MCP in Multiple Claude Code Sessions"
slug: 2026-09-03-chrome-devtools-mcp-multiple-claude-sessions
description: Open a second Claude Code terminal in the same repo and the browser stops working. Here is a wrapper that gives every session its own Chrome profile, how to install it, and the two subtle ways the "is it already in use?" check gets written wrong.
categories: ['claude-code', 'mcp', 'chrome-devtools', 'ai-agents', 'developer-tools']
coverImage: https://dalenguyen.me/assets/images/blog/chrome-devtools-mcp-multiple-claude-sessions.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-09-03T00:00:00.000Z
author: Dale Nguyen
draft: false
---

One Claude Code session driving a browser through [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) works fine. Open a second terminal in the same repo and it stops:

```
Error: The browser is already running for
/Users/you/.cache/chrome-devtools-mcp/profiles/my-repo-85156b57.
Use --isolated to run multiple browser instances.
```

Retrying does not help. The lock is held by a live process.

This post is the wrapper I use to fix that, how to install it, and - more usefully - the two ways I got the wrapper itself wrong. Both bugs were silent, and one of them was still shipping on my machine while I wrote the first draft of this article.

## Why it breaks

Three facts collide:

1. **Chrome refuses two instances on one `--user-data-dir`.** It writes a `SingletonLock` in the profile directory and enforces it.
2. **Every Claude Code session spawns its own MCP server.** Two terminals means two `chrome-devtools-mcp` processes, each wanting a browser.
3. **By default they get the same profile path**, so the second one loses.

The knob that decides everything is the `--userDataDir` passed to the MCP server. Give each session a different one and they stop fighting.

The tempting fix is the `--isolated` flag the error message suggests. It works, and it throws away the profile on exit - so every run starts logged out of everything. What you actually want is **partitioned and persistent**: a different directory per session, stable across restarts.

## Step 1 - write the wrapper

Claude Code launches MCP servers by running a command. Point that command at a shell script instead of `npx` directly, and the script can decide the profile path per session.

Save this as `~/.claude/mcp-wrappers/chrome-devtools.sh`:

```bash
#!/usr/bin/env bash
# One Chrome per Claude Code session. stdout is the MCP
# protocol stream, so diagnostics go to stderr only.
set -euo pipefail

safe() { printf '%s' "$1" | tr -cs 'A-Za-z0-9._-' '-'; }

if [[ -n "${CDP_PROFILE:-}" ]]; then
    key=$CDP_PROFILE          # explicit per-terminal override
else
    root=$(git rev-parse --show-toplevel 2>/dev/null || true)
    root=${root:-$PWD}
    hash=$(printf '%s' "$root" | shasum | cut -c1-8)
    key="$(basename "$root")-$hash"
fi
key=$(safe "$key")

profiles="$HOME/.cache/chrome-devtools-mcp/profiles"

profile_busy() {
    pgrep -f -- "--user-?[dD]ata-?[dD]ir=$1([[:space:]]|\$)" \
        >/dev/null 2>&1
}

# First ancestor with a real tty, e.g. "ttys002".
owner_tty() {
    local p=$$ t
    for _ in 1 2 3 4 5 6 7 8; do
        [[ -z $p || $p == 1 ]] && break
        t=$(ps -o tty= -p "$p" 2>/dev/null | tr -d ' ')
        case $t in
            ''|'??') : ;;
            *) printf '%s' "$t"; return 0 ;;
        esac
        p=$(ps -o ppid= -p "$p" 2>/dev/null | tr -d ' ')
    done
    return 1
}

profile="$profiles/$key"
if profile_busy "$profile"; then
    if tty=$(owner_tty); then
        profile="$profiles/$key-$(safe "$tty")"
    else
        # No tty to key on. Unique beats shared.
        profile="$profiles/$key-pid$$"
    fi
fi

mkdir -p "$profile"
echo "chrome-devtools-mcp profile: $profile" >&2
exec npx -y chrome-devtools-mcp@latest \
    --userDataDir="$profile" "$@"
```

The shape is: **resolve an identity, then fall back only if that profile is genuinely held.** The common case - one session in a repo - always lands on the base profile and keeps its cookies. The fallback path is stable for that terminal, so a restart returns to the same warm profile rather than a fresh one.

## Step 2 - install it

```bash
chmod +x ~/.claude/mcp-wrappers/chrome-devtools.sh

claude mcp remove chrome-devtools 2>/dev/null
claude mcp add chrome-devtools --scope user \
  -- ~/.claude/mcp-wrappers/chrome-devtools.sh
```

That writes an entry like this into `~/.claude.json`:

```json
"chrome-devtools": {
  "type": "stdio",
  "command": "/Users/you/.claude/mcp-wrappers/chrome-devtools.sh",
  "args": [],
  "env": {}
}
```

**Restart every running Claude session.** An MCP server reads its arguments once, at startup. Editing the wrapper does nothing to a session that is already running - a point worth remembering when a fix appears not to work.

## Step 3 - verify it before trusting it

Stub the `exec` and print what the wrapper *would* do. Five seconds, and it catches an inverted contention check:

```bash
sed 's|^exec .*|echo "WOULD USE: $profile"|' \
  ~/.claude/mcp-wrappers/chrome-devtools.sh | bash
```

Run it in one terminal, then in a second terminal in the same repo while the first session is live. You want two different paths:

```
WOULD USE: …/profiles/my-repo-85156b57
WOULD USE: …/profiles/my-repo-85156b57-ttys010
```

If both print the base path, the in-use check is broken - see the next section, because mine was.

## Trap 1 - keying on the directory

Deriving the key from the git root is appealing. It is stable across restarts, so the profile keeps its state. It is also not enough, because the thing that can be concurrent is the *terminal*, not the directory.

Pick a key below and slide the number of terminals up. All of them are started in the same checkout, which is exactly what happens when you open a second tab:

<div data-chart="isolation-key">Interactive widget: pick what the Chrome profile key is derived from (git root, git root + branch, or terminal tty) and see which of N concurrent Claude sessions collide on the same profile. Enable JavaScript to view.</div>

Git root and branch are both too coarse the moment two sessions share one. The rule:

> The key must be at least as fine-grained as the unit that can actually run concurrently.

Ask "what can there be two of at once?" If the answer is "terminals", the key needs something terminal-scoped. The tty works well because it survives `claude --continue` in that tab, so the fallback profile stays warm too.

One catch, and it is the reason `owner_tty` walks the process tree: **Claude runs its shells detached, so neither `$$` nor stdin has a controlling terminal.** `tty` returns "not a tty" and `ps -o tty= -p $$` returns `??`. You have to walk up to the first ancestor that has one. Test the accessor inside the real execution context, not in your own shell where it obviously works.

## Trap 2 - the in-use check matches the wrong thing

This is the one that cost me real time, and it has two independent failure modes.

**The spelling.** Chrome carries `--user-data-dir=…`. The MCP server carries `--userDataDir=…`. They are different processes, and for a while only one of them exists: `chrome-devtools-mcp` starts when the session starts and holds the profile, but **Chrome does not launch until the first browser tool call.** A check that only knows Chrome's spelling reports FREE for that entire window.

**The anchor.** Once you add a fallback suffix, names become prefixes of one another, so the pattern needs a boundary - or `…/my-repo` matches a running `…/my-repo-ttys003` and every session thinks it is locked out. But the boundary has to be a delimiter **or end-of-string**, because `--userDataDir=…` is usually the *last* argument on the command line, with nothing after it to match.

```
held by:  npm exec chrome-devtools-mcp --userDataDir=…/my-repo
                                       ▲ camelCase, last arg
query:    pgrep -f -- "--user-data-dir=…/my-repo[[:space:]]"
                        ▲ dashes, and needs a space after
          → no match → "FREE"  (wrong: the profile IS held)
```

Both problems, one line:

```bash
profile_busy() {
    pgrep -f -- "--user-?[dD]ata-?[dD]ir=$1([[:space:]]|\$)" \
        >/dev/null 2>&1
}
```

Step through what the narrow version actually does to a second terminal:

<div data-chart="stampede">Interactive widget: step through two Claude Code terminals starting in one repo, comparing an in-use check that only knows Chrome's flag spelling against one that also matches the MCP server's. Enable JavaScript to view.</div>

Note where it fails. Nothing is wrong at step 2, when the bad decision is made. The error surfaces two steps later, in a different terminal, as a Chrome lock message that says nothing about spelling.

### Prove it with a synthetic holder

Do not eyeball this. Fake a holder and assert **both** directions:

```bash
R=/tmp/cdp-test
python3 -c "import time;time.sleep(25)" --userDataDir=$R/proj-sfx &

# 1. base must NOT match a suffixed sibling
profile_busy "$R/proj"     && echo "BUG: base reported busy"

# 2. a live holder must NOT read as free, even with the flag last
profile_busy "$R/proj-sfx" || echo "BUG: live holder reported free"
```

A delimiter-only anchor passes the first test and silently fails the second. That is exactly how the bug survived my own review: I asserted the false positive and never asserted the miss.

## Trap 3 - fanning out multiplies the browser

If you hand a browser task to three subagents, you have not parallelised the work - you have cold-started three Chromes, none of them logged in.

<div data-chart="fanout">Chart: wall clock and logins required when N Claude subagents share one warm browser versus each launching their own. Enable JavaScript to view.</div>

Keep work that needs the authenticated, warmed browser in one session. Fan out the parts that do not touch it.

There is a sharper version of this. Subagents in one Claude session share that session's MCP server, so they share one browser. If you have each open its own tab and then close it by index, they will close each other's tabs - `pageId` is a positional index into a shared list, not a stable handle. I did this while testing this very post and closed a tab belonging to the human.

## Traps that look like something else

- **"It works now" after editing the wrapper.** Config is read once, at process start. A stale MCP server producing the old behaviour looks identical to a bad fix. Restart the session and confirm the new profile path in stderr.
- **An empty profile looks like a broken tool.** A fresh partition legitimately has no cookies and no login. That is isolation working. Log in once; it persists from then on.
- **Silence is not success.** A too-loose or too-narrow in-use check raises no error where it fails. It fails somewhere else, later, in another terminal.
- **The first blame is usually the change you just made.** Reverting to the prior revision and reproducing there takes minutes, and it is the difference between fixing a bug and mis-attributing one.

## Checklist

- [ ] Is the profile key at least as fine-grained as the thing that can be concurrent - the terminal, not the directory?
- [ ] Does the key stay stable across a restart, so the profile keeps its login?
- [ ] Does the in-use check match **both** `--user-data-dir` and `--userDataDir`?
- [ ] Is it anchored on a delimiter **or** end-of-string?
- [ ] Have I asserted both failure directions with a synthetic holder - the false positive and the miss?
- [ ] Does the tty lookup actually resolve inside Claude's detached shell, not just in my own terminal?
- [ ] Is there a last-resort unique branch when no identity resolves?
- [ ] Did I restart every running session after editing the wrapper?
- [ ] Does my parallel plan launch one browser, or one per subagent?

## In one line

> Give every terminal its own persistent Chrome profile, key it on something terminal-scoped, and make the "already in use?" check match either flag spelling anchored on a delimiter or end-of-string - otherwise your second session either takes a profile it should not, or refuses one it should have taken.
