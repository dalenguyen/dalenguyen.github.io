---
title: "One Browser, Many Agents: Isolating Exclusive Resources Across Concurrent AI Sessions"
slug: 2026-09-02-one-browser-many-agents
description: Running two or three AI coding sessions at once breaks anything that refuses a second holder - a browser profile, a port, a lockfile. Here is why per-directory isolation is not enough, why the "is it in use?" check is usually wrong, and what to do instead.
categories: ['ai-agents', 'concurrency', 'developer-tools', 'debugging', 'devops']
coverImage: https://dalenguyen.me/assets/images/blog/one-browser-many-agents.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-09-02T00:00:00.000Z
author: Dale Nguyen
draft: false
---

One AI coding session driving a browser works fine. Open a second terminal tab in the same repo and it stops working: the second session cannot start the browser, because the first one holds a lock on the profile directory.

The obvious fix is to give every session its own copy. That much is easy. The failures are all in the details - and I got two of them wrong before I checked them.

## What counts as an exclusive resource

A **single-instance resource** is anything that refuses a second concurrent holder. A browser is the canonical example: it will not open twice against one user-data directory, and it leaves a lock file to enforce that. But the shape is everywhere.

| Resource | How it refuses | What the second session sees |
|---|---|---|
| Browser user-data dir | lock file in the profile | "browser is already running for ..." |
| Dev-server port | bind fails | `EADDRINUSE` |
| Package/build lockfile | advisory lock | a hang, or "waiting for another process" |
| Device / emulator / serial port | kernel-level exclusive open | permission or busy error |
| Shared login session | last-writer-wins | silence, which is worse than an error |

One session is fine. The problem appears the moment a human runs two or three side by side, which is now the normal way these tools get used.

## Mistake 1: the isolation key is derived from the wrong thing

Deriving the key from the working directory is appealing. It is stable across restarts, so the resource keeps its cached state. It is also wrong, because the thing that can be concurrent is the *session*, not the directory. Two sessions in one directory hash to one key and collide.

Pick a key below and slide the number of sessions up. All of them are started in the same checkout, which is exactly what happens when you open a second tab:

<div data-chart="isolation-key">Interactive widget: pick an isolation key (directory, directory + branch, or session) and see which of N concurrent sessions collide on the same key. Enable JavaScript to view.</div>

Directory, repo, and branch are all too coarse the moment two sessions share one. The rule is short:

> The key must be at least as fine-grained as the unit that can actually run concurrently.

Ask "what can there be two of at the same time?" If the answer is "sessions", the key must contain something session-scoped.

## Mistake 2: the in-use check matches too loosely

Once you add a fallback suffix, the derived names become prefixes of one another. A naive process-table grep for the base name matches the suffixed one:

```
running:  --data-dir=/p/profile-B    ← B's fallback
query:    --data-dir=/p/profile      ← A asks "is base free?"
                     └────────┘  substring match → BUSY (wrong)
```

That single missing boundary is enough to strand the profile that holds all your cached state. Step through both versions - the timelines are identical until step 4:

<div data-chart="stampede">Interactive widget: step through three agent sessions contending for one browser profile, comparing an unanchored substring in-use check against an anchored one. Enable JavaScript to view.</div>

The important part is that nothing errors. Every session gets a browser, every command exits zero. It is just slower, and logged out, forever. A too-loose contention check fails by pushing everyone onto fresh copies, which raises no error at all - so you have to assert the negative case explicitly.

## Mistake 3: treating fan-out as free parallelism

If each worker independently acquires an expensive exclusive resource, N workers means N cold starts and N un-warmed states. Spawn three subagents to "check three pages in parallel" and you have cold-started three browsers, none of them logged in - which is both slower than doing it serially and functionally broken, because all three hit a login wall.

<div data-chart="fanout">Chart: wall clock and logins required when N workers share one warm resource versus each acquiring their own. Enable JavaScript to view.</div>

Fan-out is resource multiplication, not free speed. Keep the work that needs the authenticated, warmed resource in one place.

## The pattern that works

Resolve the key from most-specific to least, then fall back only if the resource is genuinely held. The anchored pattern in `in_use` is the whole point:

```bash
# 1. explicit override, 2. stable scope, 3. cwd
key="${RESOURCE_KEY:-$(scope_id || basename "$PWD")}"
base="$STATE_ROOT/$key"

# Anchored: trailing delimiter stops "$base" matching "$base-c3d4"
in_use() { pgrep -f -- "--data-dir=$1[[:space:]]" >/dev/null 2>&1; }

path="$base"
if in_use "$base"; then
    path="$base-$(session_id)"    # per-session, stable on restart
fi
mkdir -p "$path"
exec the-tool --data-dir="$path" "$@"
```

Two properties are worth protecting:

1. The common case - one session - always lands on the base path and keeps its warm state.
2. The fallback path is *stable* for that session, so a restart returns to the same warm copy.

That second point is why "partitioned and persistent" beats the throwaway/isolated mode many tools offer. Disposable isolation solves contention by discarding state, which trades a hard failure for a recurring tax: re-login, re-warm, re-download, every single run.

### Deriving session identity from the process ancestry

The obvious identity source is often unavailable in the execution context. A detached or piped process has no controlling terminal, so an accessor that works in your shell returns nothing there. Walk up to the nearest ancestor that has one:

```bash
session_id() {
    local p=$$ v
    for _ in $(seq 8); do
        [[ -z $p || $p == 1 ]] && break
        v=$(identity_of "$p")           # e.g. controlling terminal, container id
        [[ -n $v && $v != "unknown" ]] && { printf '%s' "$v"; return 0; }
        p=$(parent_of "$p")
    done
    return 1                            # caller falls back to a pid/uuid
}
```

Always keep a last-resort branch. An identity you cannot resolve must degrade to "unique but unshared", never to "collides with everyone".

### Verify the resolver before trusting it

Stub the exec and print what it would do. Five seconds, and it catches an inverted contention test:

```bash
sed 's|^exec .*|echo "WOULD USE: $path"|' wrapper.sh | sh
```

Then prove the boundary case directly with a synthetic holder, because this is the part most likely to be silently wrong:

```bash
# fake a holder on the SUFFIXED name, then ask about the BASE name
launch_fake --data-dir="$STATE_ROOT/test-sfx" &
in_use "$STATE_ROOT/test" && echo "BUG: base reported busy"
```

### Map holders to owners before reclaiming

A held resource may belong to a live session doing real work, or to an orphan whose parent died. Print the resource, the holder, and the owning session together before killing anything:

```
profile-a1b2       holder=41201  owner=40977 (alive)   → leave it
profile-a1b2-c3d4  holder=52310  owner=none (orphan)  → reclaim
```

An orphan reparented to init is safe to reclaim. A resource owned by a live session is not yours.

## False signals to watch for

These all cost me time, and none of them look like what they are:

- **"It works now" after a config edit.** Config is read once, at process start. Editing a wrapper, an arg list, or an env var does nothing to the process already running. A stale process producing the old behaviour looks identical to a bad fix.
- **An empty state looks like a broken tool.** A fresh partition legitimately has no cache, no cookies, no login. That is isolation working - but it gets reported as "the tool is broken".
- **Synthetic events hide timing bugs.** Driving a tool programmatically can take a different code path than a real interaction and mask the failure entirely. If a bug reproduces by hand but not in your harness, suspect the harness.
- **The first blame is usually the change you just made.** A failure that appears right after your change is not necessarily caused by it. Reverting to the prior revision and reproducing there takes minutes, and it is the difference between fixing a bug and mis-attributing one.

Concurrency bugs are environmental, so prove them in the environment. Every assumption here that I checked empirically was cheap to check. Two of the ones I did not check were wrong.

## Checklist

- [ ] What can there be two of at once? Is my isolation key at least that fine-grained?
- [ ] Does the key stay stable across a restart, so state survives?
- [ ] Is the "in use" pattern anchored, so hierarchical names cannot match each other?
- [ ] Have I asserted the false-positive case with a synthetic holder?
- [ ] Does the identity source actually resolve inside the real execution context?
- [ ] Is there a last-resort unique branch when identity is unresolvable?
- [ ] Does the config change need a restart, and have I verified the new value is live?
- [ ] Before reclaiming a held resource, have I traced it to its owning process?
- [ ] Does my parallel plan acquire the expensive resource once, or once per worker?
- [ ] Have I documented that a fresh partition needs a one-time warm-up or login?

## In one line

> Isolate on the unit that can actually be concurrent, keep the key stable so state survives, and anchor the "already in use?" check - or every session will quietly stampede onto a fresh, empty, un-authenticated copy.
