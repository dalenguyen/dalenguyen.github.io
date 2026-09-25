---
title: 'WebMCP in the Chrome Your Agent Actually Drives'
slug: 2026-09-25-webmcp-agent-driven-chrome
description: You turned on the WebMCP flag, installed the inspector extension, and the agent still reports "not supported". The flag went on the wrong browser - and two more false signals are waiting behind that one. Here is where the flag belongs, how to prove it landed, and what page-registered tools actually buy you over DOM scripting.
categories: ['webmcp', 'chrome-devtools', 'mcp', 'ai-agents', 'browser-automation']
coverImage: https://dalenguyen.me/assets/images/blog/webmcp-agent-driven-chrome.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-09-25T12:00:00.000Z
author: Dale Nguyen
draft: false
---

WebMCP lets a web page publish its own actions as typed tools. Instead of the agent hunting for a button and dispatching an `input` event, the page says "I have `add_chart_series`, it takes a string" and the agent calls it.

That is the promise. The first hour is usually spent on something duller: the flag is on, the extension is installed, and the agent still says the API does not exist.

It almost always has the same cause. You configured the browser you were looking at. The agent drives a different one.

## Two browsers, one flag

[Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) either launches its own Chrome or attaches to a debug Chrome over `--browserUrl`. Either way it is a separate profile from your everyday browser. Extensions you install and toggles you flip in `chrome://flags` stay in your profile and never reach the agent's.

So the flag has to go on the launch the agent actually uses - and because Chrome reads feature flags only at launch, a debug Chrome that was already running keeps its old flags until you force it to restart.

Pick a setup below and see where the flag lands:

<div data-chart="browser-target">Interactive: choose how the agent gets its browser and where you put the WebMCP flag, and see whether the running process ends up with it. Enable JavaScript to view.</div>

The two commands the widget is describing:

```bash
# If Chrome DevTools MCP launches the browser
npx chrome-devtools-mcp@latest --chromeArg=--enable-features=WebMCP

# If it attaches to a debug Chrome you start yourself
chrome --remote-debugging-port=9222 \
       --user-data-dir="$HOME/.cache/agent-chrome" \
       --enable-features=WebMCP
```

And the check that settles the argument - read the running process, not the config file:

```bash
ps -axo command | grep -- "--remote-debugging-port" | grep -v -- "--type=" \
  | grep -o -- "--enable-features=[^ ]*"
```

No output means the flag is not on the browser that is running right now. Two notes on restarting it: a Chrome started with `--no-startup-window` can survive SIGTERM, a scripted Quit and the DevTools `Browser.close` command, so check the PID is really gone before you believe you restarted it. And if other agent sessions are attached to that browser, they lose their tabs when it goes - say so before you do it.

## Three ways the page lies to you

Once the flag is on the right process, the page becomes the source of truth. It has three distinct ways of looking broken, and they need three different fixes.

The API moved. Older guides probe `navigator.modelContext`; current builds put it on `document.modelContext`. A check against the old name reports "not supported" on a browser that supports it perfectly well. So probe by feature, on both objects, and list the methods rather than trusting a name:

```js
() => {
  const mc = document.modelContext ?? navigator.modelContext;
  return {
    where: document.modelContext ? 'document' : navigator.modelContext ? 'navigator' : 'none',
    methods: mc ? Object.getOwnPropertyNames(Object.getPrototypeOf(mc)) : null,
  };
}
```

Then there is the quietest failure of all: the API is there, `getTools()` returns `[]`, and nothing is wrong. The flag is plumbing. An empty list means the page has not registered anything yet.

Toggle the three inputs and watch which output you get:

<div data-chart="probe">Interactive: toggle the flag, the Chrome build and whether the page registers tools, and see the three different "broken" outputs. Enable JavaScript to view.</div>

Registering a tool is the app's job, and it looks roughly like this. Check the exact shape against your Chrome build - the API is experimental:

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

Put those behind a dev or test build flag if they should not ship to production.

One thing that does *not* help: an inspector extension. It gives a human a panel to list and run the tools a page registers. It does not connect Chrome to the agent, and it is a dev tool with no production hardening - keep it out of profiles that visit sites you do not trust.

## What it buys you

The examples here come from a chart-builder UI where the agent adds data series, opens per-row filter panels and checks error states.

Adding a series by DOM scripting means: open the picker, fill the search input, dispatch an `input` event, wait, find the option by visible text, click it, find the confirm button, click it, wait again. It breaks when the copy changes, when the markup changes, or when the timing changes. With a tool it is one call that returns structured state.

The error case is sharper. The "+ Add" button hides while an error is showing, so the script fails with "element not found" and you go and work out why. The tool call reaches the app's own logic, which either accepts the request or tells you "remove the excluded row first" - a message at the level of the action you were trying to take.

<div data-chart="cost">Chart: illustrative steps and token cost per task, DOM scripting versus WebMCP tool calls. Enable JavaScript to view.</div>

The token line matters more than it looks. An accessibility snapshot of a full app page runs to hundreds of lines, and DOM scripting needs a fresh one after every reload because element IDs go stale. A tool call returns a short JSON result.

## Where it stops

WebMCP drives the app's action layer, not its pixels. A tool call can succeed while the button it replaced is misaligned, the wrong colour, or opening its panel three hundred pixels from the trigger.

So the division of labour is: use tool calls to reach a state fast and identically every time, then use screenshots, computed styles and layout checks to prove the UI is right. Tool results are not visual evidence.

## Checklist

- I know whether the MCP launches Chrome or attaches to one.
- The flag is on that launch - `--chromeArg`, or the debug Chrome's own arguments.
- `ps` shows `--enable-features=WebMCP` on the running browser process.
- I restarted the agent session if I changed the MCP server's arguments.
- The probe finds the API on `document` or `navigator`, and lists its methods.
- `getTools()` returns the tools I expect. If it returns `[]`, the app has to register them.
- Visual claims still rest on screenshots and computed styles, not on tool results.

One more thing to expect: restarting a long-lived Chrome can install a pending update, so the version - and the API shape - can change under you between one session and the next. WebMCP is experimental. Probe, do not assume.
