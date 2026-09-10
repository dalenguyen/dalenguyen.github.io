---
title: "Running Chrome DevTools MCP in Multiple Claude Code Sessions"
slug: 2026-09-10-chrome-devtools-mcp-multiple-claude-sessions
description: Open a second Claude Code terminal in the same repo and the browser stops working. Here is a wrapper that gives every session its own Chrome profile, the two subtle ways the "is it already in use?" check gets written wrong, and why isolation leaves every agent logged out - plus the one-shared-browser wrapper that fixes that.
categories: ['claude-code', 'mcp', 'chrome-devtools', 'ai-agents', 'developer-tools']
coverImage: https://dalenguyen.me/assets/images/blog/chrome-devtools-mcp-multiple-claude-sessions.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-09-10T12:00:00.000Z
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

It ends somewhere I did not expect when I started: a week of running the isolation wrapper under a pipeline of subagents showed that partitioning the browser is the wrong default for agents that need a login. The fix is the opposite move - one Chrome, many clients - and the wrapper that does it is at the end.

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
    fi
    # The tty profile can be held too, and owner_tty may have
    # found nothing. Degrade to unique, never to shared.
    if profile_busy "$profile"; then
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

## Where this still loses

I measured this rather than assuming it. Three MCP servers launched at once in one repo, each asked to open a page, counting how many ended up with a working browser:

| sessions | terminals | start | working browsers |
|---|---|---|---|
| 3 | same tty | staggered 3s | 3 of 3 |
| 3 | distinct ttys | same instant | 3 of 3 |
| 3 | same tty | same instant | **1 of 3** |

The first two rows are the cases you actually hit: separate tabs, or the same tab used twice. Both work.

The last row is a genuine limit. `profile_busy` is a check-then-act, so servers that start in the *same millisecond* all check before any of them has registered, and all three take the base profile. Nothing in a wrapper of this shape closes that window without an atomic reservation. In practice a human opening a second tab is orders of magnitude slower than the race, so this stays theoretical - but it is the honest boundary of the technique, and worth knowing before you build a script that launches ten sessions in a loop. If you do that, set `CDP_PROFILE` explicitly per session and skip the detection entirely.

The re-check matters more than it looks. An earlier version of my wrapper picked the tty profile and used it without asking whether *that* one was busy, which quietly re-created the original bug one level down: two sessions in one terminal tab both landed on `-ttys010`. Any fallback chain needs a last resort that is unique rather than merely different.

## Trap 3 - fanning out multiplies the browser

If you hand a browser task to three subagents, you have not parallelised the work - you have cold-started three Chromes, none of them logged in.

<div data-chart="fanout">Chart: wall clock and logins required when N Claude subagents share one warm browser versus each launching their own. Enable JavaScript to view.</div>

I assumed at first that subagents inside one Claude session share that session's MCP server. They do not. Each subagent runs in its own pane with its own tty, spawns its own `chrome-devtools-mcp`, and - under the wrapper above - lands on its own `-<tty>` profile. Measured twice, a week apart, with three `general-purpose` subagents each time: three MCP processes, three Chromes, three fresh profiles, three login pages. That is exactly what the isolation wrapper is designed to do, and it is exactly wrong for this workload.

Two smaller things worth knowing when several agents do share one browser. Current `chrome-devtools-mcp` routes page-scoped tools by a `pageId` (`--pageIdRouting`, on by default), and that id is stable for the life of the tab - so agents do not close each other's tabs by accident the way a positional index would let them. They can still *see* each other's tabs in `list_pages`, so the rule for a fan-out is: act only on tabs you opened yourself.

## The cost of isolation - every agent is logged out

Here is the run that changed my mind. Three stacked merge requests, each implemented by one subagent and verified by another, six agents in a row. Every verifier reached the browser step and stopped at `/auth/login`. Logging in for one of them did nothing for the next - and the human doing the logging in was, understandably, unimpressed the third time.

Two facts, both obvious in hindsight:

1. **The login lives in the profile directory.** Cookies and `localStorage` are stored under `--user-data-dir`. A different profile per agent means a different, empty storage per agent. Isolation working as designed.
2. **Storage is per origin, and the port is part of the origin.** `localhost:4200` and `localhost:4202` do not share a token even inside one profile. If your worktrees serve on different ports, one login per port.

The workaround I used in the meantime was ugly but instructive: from a logged-in tab on `:4200`, `window.open` a tab on `:4202` and `postMessage` the auth keys across, so the token moved between origins without ever passing through the agent's transcript. It works. It is also a sign the architecture is fighting you.

## Step 4 - one browser, many agents

The premise of Steps 1-3 was "each MCP server needs its own Chrome". It does not. Chrome's DevTools protocol accepts many clients on one browser, and `chrome-devtools-mcp` has a flag for exactly this:

```
--browserUrl  Connect to a running, debuggable Chrome instance
              (e.g. http://127.0.0.1:9222)
```

So run **one** Chrome with `--remote-debugging-port`, log in once, and have every session and every subagent attach to it instead of launching its own. The profile is stable, the login persists, and a fan-out costs zero extra browsers.

The wrapper becomes attach-or-launch, with the isolation logic kept as a fallback:

```bash
#!/usr/bin/env bash
# One shared Chrome for every Claude Code session and subagent.
# stdout is the MCP protocol stream - diagnostics go to stderr.
set -euo pipefail

CDP_PORT=${CDP_PORT:-9222}
profiles="$HOME/.cache/chrome-devtools-mcp/profiles"
shared_profile="$profiles/shared"
chrome_bin=${CDP_CHROME_BIN:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}

shared_ready() {
    curl -sf --max-time 1 "http://127.0.0.1:$CDP_PORT/json/version" \
        >/dev/null 2>&1
}

# Launch the shared Chrome if nothing is listening. A mkdir lock
# stops parallel subagents racing to start two; losers wait.
start_shared() {
    local lock="$profiles/.shared-launch.lock"
    mkdir -p "$profiles"
    if mkdir "$lock" 2>/dev/null; then
        trap 'rmdir "$lock" 2>/dev/null || true' RETURN
        if [[ -x $chrome_bin ]] && ! pgrep -f -- \
            "--user-data-dir=$shared_profile([[:space:]]|\$)" >/dev/null; then
            mkdir -p "$shared_profile"
            nohup "$chrome_bin" \
                --remote-debugging-port="$CDP_PORT" \
                --user-data-dir="$shared_profile" \
                --no-first-run --no-default-browser-check \
                about:blank >/dev/null 2>&1 &
            disown
        fi
    fi
    for _ in $(seq 1 40); do shared_ready && return 0; sleep 0.25; done
    return 1
}

if [[ -z "${CDP_NO_SHARED:-}" ]]; then
    if shared_ready || start_shared; then
        echo "attaching to shared Chrome at :$CDP_PORT" >&2
        exec npx -y chrome-devtools-mcp@latest \
            --browserUrl="http://127.0.0.1:$CDP_PORT" "$@"
    fi
    echo "shared Chrome unavailable, using a private profile" >&2
fi

# ---- fallback: the per-session wrapper from Step 1 goes here ----
```

Things that bit, or nearly did:

- **Chrome refuses `--remote-debugging-port` on its default profile** (since 136). Give the shared instance its own `--user-data-dir`, as above, and it is fine.
- **The lock is `mkdir`, not a busy-check.** Two subagents starting in the same millisecond both find the port closed; only one may launch. `mkdir` is atomic, which is the reservation the Step 1 wrapper never had - so this also closes the "same instant" race from the table above.
- **The MCP server does not own the browser any more.** Attaching means the shared Chrome survives the session that started it. That is the point, but it also means nobody closes it for you.
- **Everyone sees every tab.** Rely on `pageId` routing and the "act only on your own tabs" rule.
- **One login per origin still applies.** Log in once per port you serve on. It persists after that.
- **Restart the sessions.** MCP arguments are read at process start; a running session keeps its private Chrome until it is restarted.

The isolation wrapper is not wasted work. It is the fallback when there is no shared browser to attach to, and `CDP_NO_SHARED=1` brings it back on purpose - for a session that must not share cookies with the others.

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
- [ ] Does the fallback re-check the profile it falls back TO, not just the base?
- [ ] Did I restart every running session after editing the wrapper?
- [ ] Does my parallel plan launch one browser, or one per subagent?
- [ ] Do the agents that need a login attach to one shared Chrome (`--browserUrl`), or does each get a fresh, logged-out profile?
- [ ] Have I logged the shared browser in once per origin - every port I serve on counts as its own?
- [ ] Is the shared-browser launch guarded by an atomic reservation (`mkdir` lock), not a check-then-act?

## In one line

> Agents that must not share a browser get their own persistent profile, keyed on something terminal-scoped, with an in-use check that matches either flag spelling anchored on a delimiter or end-of-string. Agents that must share a login get the opposite: one Chrome with remote debugging on, and every MCP server attached to it.
