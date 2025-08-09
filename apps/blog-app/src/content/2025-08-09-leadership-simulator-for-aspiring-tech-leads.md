---
title: I Built a Leadership Simulator for Aspiring Tech Leads (And Why The Soft Skills Matter Most)
slug: 2025-08-09-leadership-simulator-for-aspiring-tech-leads
description: A leadership simulator that puts you in realistic Tech Lead scenarios before you actually have to face them. Practice soft skills and learn to navigate workplace politics.
categories: ['leadership', 'tech-lead', 'career', 'soft-skills', 'simulator', 'angular']
coverImage: https://dalenguyen.me/assets/images/blog/techleadpilot-simulator.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-08-09T15:17:31.359Z
author: Dale Nguyen
---

Let's be honest - I'm good at code, but the thought of managing people terrifies me.

I've been a senior developer for a while now, and everyone keeps asking when I'm going to "take the next step" to Tech Lead or Staff Engineer. The problem? While I'm confident about system design and code reviews, I have no idea how to handle stakeholder politics or motivate struggling team members.

So instead of continuing to put off the inevitable, I built something to help me (and hopefully others) practice.

## What is it?

TechLeadPilot is a leadership simulator that puts you in realistic Tech Lead scenarios before you actually have to face them. Think "choose your own adventure" but for workplace situations that'll actually happen to you.

You might face scenarios like:

🔥 Your PM wants to ship without proper testing to hit a deadline  
🤝 Two senior engineers can't agree on system architecture  
📊 You need to explain why refactoring is worth 2 sprints to your director  
😤 A team member keeps missing deadlines but won't admit they're struggling

## How it works

1. Pick a scenario from the library
2. Read the situation and make your choice or write your response
3. Get AI feedback on your leadership approach
4. Learn what you did well and where you can improve

## Why I built this

The idea of going from "senior engineer who codes in peace" to "tech lead who spends most of their time in meetings" is honestly pretty scary.

I know I'll need to:

- Navigate office politics (ugh)
- Influence people who don't report to me
- Communicate complex technical stuff to non-technical people
- Actually motivate and mentor team members
- Make decisions when I don't have all the information

These seem like learnable skills, but I'd rather practice them in a simulator than figure them out by potentially screwing up with real people.

## The tech stack

Since this is dev.to:

- **Frontend**: Angular with Analog.js for SSR
- **Backend**: Node.js API routes
- **Database**: Firestore for user data and simulation results
- **AI**: Google Vertex AI for generating personalized feedback
- **Hosting**: Firebase (because it just works)

## What's next?

I'm working on:

- More scenario types (performance reviews sound terrifying)
- Roleplay mode where the AI plays different characters
- Progress tracking so I can see if I'm actually getting better at this

Try it out: [https://techleadpilot.com/simulations](https://techleadpilot.com/simulations)

Fellow aspiring Tech Leads - what scenarios scare you the most? Always looking for new ideas to add!
