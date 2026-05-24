---
title: "Building a Personal Assistant in Zo Computer and Adding Hermes as a Second Assistant"
slug: 2026-05-24-zo-hermes-personal-assistant-setup
description: How to set up Zo Computer as your primary personal assistant and Hermes as a second autonomous agent, creating a practical division of labor for life admin, creative work, and parallel tasks.
categories: ['ai', 'productivity', 'personal-assistant', 'automation', 'agents']
coverImage: https://dalenguyen.me/assets/images/blog/zo-hermes-personal-assistant-setup.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2026-05-24T00:00:00.000Z
author: Dale Nguyen
---

Zo Computer works well as a personal operating system for life admin, creative work, learning, and day-to-day coordination. If you set it up intentionally, it can feel less like a chat app and more like a real assistant that lives with your files, routines, and preferences.

The good news is that getting started costs nothing. Zo has a free tier that is a perfect place to test a personal assistant setup before committing to anything. On the Hermes side, [NVIDIA offers free API credits](https://build.nvidia.com/settings/api-keys) through their developer platform, so you can run Hermes against a capable model without paying for API usage upfront. That means you can build out the full two-assistant setup described in this post for free.

A strong pattern is to use Zo as your main personal assistant and Hermes as a second assistant that handles a different lane of work. Zo stays close to your files, your rules, your automations, and your personal workflows. Hermes becomes the extra pair of hands: a separate agent for focused tasks, parallel research, and longer-running jobs.

## Why a personal assistant in Zo is useful

Zo is especially good for personal use because it can sit near the center of your life instead of scattered across separate apps. That means you can keep the things an assistant needs in one place:

- notes and documents
- recurring routines
- calendar-aware tasks
- saved preferences and rules
- files you want the assistant to work from
- automations that run without you micromanaging them

The real advantage is continuity. A personal assistant becomes much more useful when it can remember your style, keep track of ongoing projects, and work from the same environment every day.

## What "personal assistant" should mean in Zo

A good assistant in Zo should do more than answer questions. It should help you actually move things forward.

That usually means:

- drafting messages, notes, and documents
- organizing ideas into something usable
- turning vague thoughts into a plan
- reminding you about routines and deadlines
- summarizing information from files or the web
- handling repeatable life admin tasks
- keeping track of preferences so you do not repeat yourself

If you treat Zo like a small command center, it stops being a generic chatbot and starts becoming a trusted helper.

## The cleanest setup: one main assistant, one second assistant

The best setup is usually not "one AI that does everything." It is:

- Zo as your primary assistant
- Hermes as your second assistant

That split is useful because the assistants can have different jobs.

### Zo as the primary assistant

Use Zo for:

- personal life management
- writing and editing
- working directly from your files
- scheduling and recurring routines
- decisions that need your preferences
- things you want tightly integrated with your Zo workspace

### Hermes as the second assistant

Use Hermes for:

- parallel research
- long-running work
- independent task handling
- a separate memory stream
- a different working style
- conversations or jobs you want isolated from your main assistant

This is the important idea: the second assistant should not be a clone of the first. It should be a specialist.

## How Hermes fits in

Hermes is designed as an autonomous agent with a built-in learning loop. According to its documentation, it can keep improving through use, remember across sessions, and work through messaging platforms like Telegram. It is meant to live somewhere persistent, such as a local machine, a VPS, or another hosted environment.

That makes Hermes a good second assistant when you want another agent running in parallel with Zo instead of replacing Zo.

<figure>
  <img src="assets/images/blog/zo-hermes-telegram-demo.png" alt="Zo Computer bot on Telegram helping find a flight from YYZ to Da Nang" width="100%" height="auto" />
  <figcaption>Zo Computer running as a Telegram bot — asking it to find a flight with one transit stop.</figcaption>
</figure>

## Basic Hermes installation path

The easiest way to get started is to simply ask Zo to do it for you. Open a Zo chat and type something like:

> "Install Hermes on my machine"

Zo will handle the setup steps, walk you through any configuration it needs, and get Hermes running without you having to touch the terminal. This is the fastest path if you are already inside Zo.

If you prefer to install manually, the official Hermes docs show a straightforward install flow for Linux, macOS, and WSL2:

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

For native Windows, the docs also provide a PowerShell installer. After installation, Hermes can be configured to run in the environment you want and connected to messaging tools like Telegram.

The practical setup pattern is:

1. install Hermes
2. choose where it will run
3. connect its messaging or command interface
4. give it a clear role
5. keep Zo as the main personal assistant

## How to divide work between Zo and Hermes

If you want the setup to feel sane, give each assistant a clear job.

### Zo handles the personal layer

Zo should own:

- your personal notes
- your tasks and routines
- files you keep locally
- preferences and recurring habits
- writing that needs your voice
- decisions that depend on your context

### Hermes handles the parallel layer

Hermes should own:

- research you want to run in the background
- tasks that can be broken into substeps
- experiments
- alternate drafts or viewpoints
- work that benefits from isolation

This division prevents the assistants from stepping on each other.

## A simple working model

Here is a practical way to think about it:

- Zo is the assistant that knows you.
- Hermes is the assistant that helps you scale.

Zo keeps your life organized. Hermes helps you get more done.

That combination is especially useful when you are juggling creative work, learning, and admin at the same time. One assistant can stay close to your personal system while the other handles the overflow.

## Tips for making the setup actually useful

### 1. Give each assistant a role

Do not let both assistants do the same job. That creates noise. Be explicit:

- Zo = personal coordinator
- Hermes = second operator

### 2. Keep preferences in one place

The more you repeat yourself, the less useful the system feels. Store your standards, defaults, and routines where the assistant can reuse them.

### 3. Use the assistant for real workflows

Do not use it only for chat. Make it draft, organize, summarize, and schedule. Real utility comes from repeatable workflows.

### 4. Keep the assistant close to your files

Your files are the memory of the system. The assistant gets more useful when it can work from documents, notes, and living records instead of starting from scratch each time.

### 5. Treat the second assistant like an aide, not a boss

Hermes should support your system, not replace your judgment. The best assistant setup is still human-led.

## Example use case

A good two-assistant workflow might look like this:

- Zo manages your personal planning, drafts, and routines.
- Hermes runs a background research task, collects notes, and returns a concise summary.
- You review both outputs and decide what to do next.

That is the sweet spot: one assistant keeps your life coherent, and the other adds throughput.

## Bottom line

If you want a personal assistant inside Zo Computer, start by making Zo the center of your daily system: files, rules, routines, drafts, and reminders. Then add Hermes as a second assistant for parallel work, deeper automation, and independent tasks.

The result is not just "two AIs." It is a better division of labor:

- Zo for your personal operating system
- Hermes for your extra capacity

That is the setup that actually feels like having help.

---

*If you want to try Zo Computer, you can sign up using my [invite link](https://zo-computer.cello.so/WSr8vEbM6k1) (affiliate link).*
