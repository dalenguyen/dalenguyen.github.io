---
title: 'Setting Up WebMCP for Claude Code and Chrome DevTools MCP'
slug: 2026-09-25-webmcp-agent-driven-chrome
description: WebMCP lets your app publish its own actions as typed tools, so Claude Code calls add_chart_series instead of hunting for a button. Here is the exact config for chrome-devtools-mcp, how to register tools, what you gain over DOM scripting - and the five things you give up.
categories: ['webmcp', 'chrome-devtools', 'mcp', 'claude-code', 'ai-agents']
coverImage: https://dalenguyen.me/assets/images/blog/webmcp-agent-driven-chrome.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-09-25T12:00:00.000Z
author: Dale Nguyen
draft: false
---

When Claude Code drives your app through [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp), it works the way a human would: read a page snapshot, find the button, click it, wait, read another snapshot. That is a lot of tokens to spend on "add a data series", and it breaks whenever the copy or the markup changes.

WebMCP inverts it. The page registers its own actions as typed tools - name, description, JSON input schema, handler - and the agent calls them directly. `add_chart_series({ seriesName: 'Page views' })` instead of eight scripted DOM steps.

This is the setup, end to end, plus an honest account of what it costs. WebMCP is experimental, so check the API shape against your own Chrome build as you go.

## 1. Give Claude Code a Chrome with the flag

WebMCP is behind `--enable-features=WebMCP`, and that flag has to be on the Chrome the MCP server drives - which is never your everyday browser. `chrome-devtools-mcp` runs its own profile, so a toggle in `chrome://flags` and an extension you installed do not reach it.

There are two shapes, and each takes a different config. Build yours:

<div data-chart="config-builder">Interactive: pick how Claude Code gets its Chrome and where the MCP server is registered, and copy the exact config. Enable JavaScript to view.</div>

Two rules make this less fiddly than it looks. Chrome reads feature flags **only at launch**, and Claude Code reads MCP server arguments **only when the session starts**. Editing either file changes nothing until the relevant process restarts.

Let the MCP launch Chrome if you can - it restarts the browser for you, so one `/exit` and a new session is the whole loop. Attaching to your own debug Chrome is worth it when you need a logged-in profile that survives across sessions, but then you own the restart, and a Chrome started with `--no-startup-window` can survive SIGTERM, a scripted Quit, and the DevTools `Browser.close` command. Check the PID is really gone. If other sessions are attached to that browser, they lose their tabs when it goes - tell them first.

## 2. Confirm it landed

Two checks, cheap, in order. First the process:

```bash
ps -axo command | grep -- "--remote-debugging-port" | grep -v -- "--type=" \
  | grep -o -- "--enable-features=[^ ]*"
```

No output means the running browser does not have the flag, whatever the config says.

Then the page. Ask Claude Code to run this through `evaluate_script` - probe by feature on both objects rather than trusting a name, because current builds expose `document.modelContext` while older guides tell you to check `navigator.modelContext`:

```js
() => {
  const mc = document.modelContext ?? navigator.modelContext;
  return {
    where: document.modelContext ? 'document' : navigator.modelContext ? 'navigator' : 'none',
    methods: mc ? Object.getOwnPropertyNames(Object.getPrototypeOf(mc)) : null,
  };
}
```

Three inputs produce three different-looking failures, and only one of them is actually the flag. Toggle them:

<div data-chart="probe">Interactive: toggle the flag, the Chrome build and whether the page registers tools, and see which output each combination gives. Enable JavaScript to view.</div>

The one that catches people is the middle state: everything is configured, and `getTools()` returns `[]`. Nothing is broken. The flag is plumbing - it does nothing until your app registers something.

## 3. Register tools in your app

This is the actual work, and it is yours to write. A tool is a name, a description the model reads, a JSON schema, and a handler that calls your own logic:

```js
document.modelContext.registerTool({
  name: 'add_chart_series',
  description: 'Add a data series to the chart builder by its catalog name.',
  inputSchema: {
    type: 'object',
    properties: { seriesName: { type: 'string' } },
    required: ['seriesName'],
  },
  async execute({ seriesName }) {
    const added = chartBuilder.addSeries(seriesName) // the app's own logic, not DOM clicks
    return { ok: true, rows: chartBuilder.rows().length, added: added.id }
  },
})
```

Three things to get right. Register behind a dev or test build flag if these should not ship to production. Call your app's own logic, not a synthetic click - the point is to skip the DOM, and going through it gives up most of the benefit. And return structured state, not `true`: the returned object is what the agent reasons about next, so spend a field on the row count or the new ID.

Then tell Claude Code the tools exist. It reaches them through `evaluate_script` like anything else in the page:

```js
async () => await document.modelContext.executeTool('add_chart_series', { seriesName: 'Page views' })
```

An inspector extension, by the way, is not part of this. It gives a human a panel to run the tools a page registers; it does not connect Chrome to the agent and adds nothing to the setup above.

## What you gain

The numbers below come from a chart-builder UI where the agent adds series, opens per-row filter panels and checks error states.

Adding a series by DOM scripting is: open the picker, fill the search input, dispatch an `input` event, wait, find the option by visible text, click it, find the confirm button, click it, wait again. Every one of those steps is a place the run can break. With a tool it is one call that returns structured state.

<div data-chart="cost">Chart: illustrative steps and token cost per task, DOM scripting versus WebMCP tool calls. Enable JavaScript to view.</div>

The token line is the one that changes how you work. An accessibility snapshot of a real app page runs to hundreds of lines, and DOM scripting needs a fresh one after nearly every step because element IDs go stale. A tool call returns a short JSON object. That difference is what lets a single session set up fifteen states instead of three.

Error handling gets better in a way the chart cannot show. The "+ Add" button hides while an error is displayed, so the scripted version fails with "element not found" and the agent goes off to work out why. The tool reaches your validation and comes back with "remove the excluded row first" - a message at the level of the thing it was trying to do.

## What you give up

Five real costs, in the order they will bite you.

**It only works on apps you control.** Every tool is code you ship. There is no WebMCP for someone else's site, so for third-party flows you are back to DOM scripting regardless.

**The tools are a second interface to maintain.** Rename a concept in the UI and the tool that wraps it drifts. They need to be kept honest like any other public surface, and nothing fails loudly when they are not.

**It is experimental.** The API already moved from `navigator` to `document`. Restarting a long-lived Chrome can pull in a pending update, so the version - and the API shape - can change under you between one session and the next. Probe, do not assume.

**It drives the action layer, not the pixels.** A tool call can succeed while the button it replaced is misaligned, the wrong colour, or opening its panel three hundred pixels from its trigger. Tool results are not visual evidence. Use tool calls to reach a state fast and identically, then screenshots and computed styles to prove the UI is right.

**Registered tools are callable by anything in the page.** They run privileged app logic with no auth boundary in front of them. Keep them out of production builds unless you have thought about that specifically, and keep inspector extensions out of profiles that visit sites you do not trust.

## When it is worth it

The setup pays off when the same handful of states get rebuilt over and over - a UI under active development where an agent sets up screenshots, checks error paths, or walks a funnel every session. Write the five tools that cover those states and the cost disappears inside a week.

It does not pay off for a one-off task, for an app you do not ship code to, or for a flow you will touch once. DOM scripting is worse per run and free to start.

## Checklist

- The flag is on the launch Claude Code actually uses - `--chromeArg`, or your debug Chrome's own arguments.
- `ps` shows `--enable-features=WebMCP` on the running browser process.
- The Claude Code session was restarted after the MCP arguments changed.
- The probe finds the API on `document` or `navigator`, and lists its methods.
- `getTools()` returns your tools. If it returns `[]`, the app has not registered them yet.
- Tools call app logic, return structured state, and are gated out of production.
- Visual claims still rest on screenshots and computed styles, not on tool results.
