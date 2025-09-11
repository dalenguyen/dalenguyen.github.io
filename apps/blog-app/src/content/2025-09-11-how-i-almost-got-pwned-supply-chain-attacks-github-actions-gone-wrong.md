---
title: How I Almost Got Pwned - A Tale of Supply Chain Attacks and GitHub Actions Gone Wrong
slug: 2025-09-11-how-i-almost-got-pwned-supply-chain-attacks-github-actions-gone-wrong
description: A developer's firsthand account of discovering a sophisticated supply chain attack targeting GitHub Actions and npm dependencies. Learn how the GhostAction campaign works and essential security practices to protect your projects.
categories: ['security', 'nodejs', 'github', 'devops', 'cybersecurity']
coverImage: https://dalenguyen.me/assets/images/blog/suspicious-merge-request.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-09-11T00:00:00.000Z
author: Dale Nguyen
---

_Or: "That time someone tried to turn my innocent Node.js repo into a credential-harvesting machine"_

---

So there I was, minding my own business with my trusty old Node.js REST API project, when I noticed something weird in the `package-lock.json` file from one of a [PR](https://github.com/dalenguyen/rest-api-node-typescript/pull/22) from a random contributor - and another contributor actually approved the PR right after that. What started as a routine dependency check turned into a rabbit hole that led me straight into the middle of a supply chain attack campaign that was actively targeting developers like us.

Buckle up, because this is a story about how modern software development can go sideways fast, and why that "helpful" pull request might not be so helpful after all.

## What Even Is a Supply Chain Attack?

It’s when hackers sneak bad stuff (malware, credential stealers, you name it) into your dependencies, build scripts, or CI/CD pipelines—any link where code, secrets, and environments touch. Think: “If I can poison upstream, why bother attacking thousands of repos individually?” Welcome to modern risk!

It's insidious because these are the tools we trust implicitly. When `lodash` releases an update, we don't usually audit every line of code, right? We just `npm update` and move on with our lives.

## The Smoking Gun: The Lockfile Had Been Tampered With

It all started when I was reviewing the `package-lock.json` from the pull request. I noticed something that made my developer spidey-senses tingle - together with the [recent NPM hack news on Sep 2025](https://blog.gitguardian.com/ghostaction-campaign-3-325-secrets-stolen/):

```json
// BEFORE (Normal, secure)
"@types/body-parser": {
  "version": "1.17.0",
  "requires": {
    "@types/connect": "3.4.32",
    "@types/node": "10.12.18"
  }
}

// AFTER (Sus as hell)
"@types/body-parser": {
  "version": "1.17.0",
  "dependencies": {
    "@types/connect": "*",
    "@types/node": "*"
  }
}
```

Those little asterisks? Those are wildcards that basically tell npm "give me whatever version you feel like." It's like ordering food and telling the waiter "surprise me" – except the surprise might be malware.

This change completely bypasses version pinning, which is one of our main defenses against supply chain attacks. With wildcards, if any of those packages gets compromised later, you'll automatically pull the malicious version on your next install.

## Enter the "Helpful" Contributor

Then I found the smoking gun: a pull request from September 5, 2025, submitted by a user called `harshitcodez19`. The PR looked innocent enough – just adding some CI/CD with GitHub Actions. How thoughtful!

```yaml
name: Build on PR
# Heello this is a ymk file made up for cICD
on:
  push:
    branches:
      - main # ← Wait, my repo uses 'master'
  pull_request:
    branches:
      - main # ← This is wrong too...

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install Dependencies
        run: npm install # ← Should be 'npm ci' for security

      - name: Run Build
        run: npm run build
```

At first glance, this looks like a newbie trying to be helpful. The typos in the comment ("Heello", "ymk", "cICD") make it seem like someone who's just learning. The branch configuration is wrong, so it wouldn't even run.

But here's the thing – this is **exactly** how the GhostAction campaign operates.

## The GhostAction Campaign: When GitHub Actions Turn Evil

The timing of this PR wasn't coincidental. **September 5, 2025** was when security researchers first detected the **GhostAction campaign** – a sophisticated supply chain attack targeting GitHub repositories.

Here's how GhostAction works:

1. **Reconnaissance**: Attackers identify repositories with outdated dependencies
2. **Social Engineering**: Submit "helpful" PRs adding CI/CD workflows
3. **Intentional Sabotage**: Include obvious mistakes to avoid immediate execution
4. **Patience**: Wait for maintainers to "fix" the obvious issues
5. **Exploitation**: When the workflow runs, it harvests secrets and credentials

The genius is in the plausible deniability. The PR looks like a well-meaning but inexperienced contributor. The "mistakes" make it seem harmless. But once those workflows run with the right permissions, game over.

### The Attack Vector Breakdown

Let's dissect what would have happened if I'd merged this PR:

```yaml
# The branch misconfiguration prevents immediate execution
on:
  push:
    branches:
      - main # My repo uses 'master', so this won't trigger
```

This gives the attacker time. If I had "fixed" the obvious branch issue and merged it, the workflow would then:

```yaml
- name: Install Dependencies
  run: npm install # Pulls wildcarded dependencies
```

With those wildcards in my lockfile, `npm install` would fetch the latest versions of `@types/node` and `@types/connect`. If those packages had been compromised (which is exactly what the broader npm hack was doing), my CI environment would install malware with full access to:

- GitHub secrets
- AWS credentials
- Database connection strings
- API keys
- Deploy tokens

Basically, everything you need to completely own my infrastructure.

## The Broader Context: The Great NPM Hack of 2025

This attack was part of a much larger campaign according to [OX Security's research](https://www.ox.security/blog/npm-packages-compromised/).

The attackers were:

- Compromising legitimate package maintainer accounts
- Injecting malicious code into trusted packages
- Specifically targeting CI/CD environments
- Using GitHub Actions to exfiltrate credentials

My old lockfile, with packages from 2018-2019, was the perfect target. Outdated dependencies are like old locks – they work until someone with the right tools shows up.

## Red Flags I Should Have Caught Earlier

Looking back, there were several warning signs:

### 1. The Contributor Profile

- `harshitcodez19` had minimal contribution history
- Random username pattern typical of throwaway accounts
- No established relationship with my project

### 2. The "Mistakes" Were Too Convenient

- Wrong branch names that prevent immediate execution
- Typos that create plausible deniability
- Using `npm install` instead of the more secure `npm ci`

### 3. The Timing

- Submitted on September 5, 2025 (exact GhostAction detection date)
- My lockfile wildcards appeared around the same timeframe
- Coincided with broader npm supply chain compromises

## What Could Have Gone Wrong

If this attack had succeeded, here's what the attacker could have done:

```bash
# In my compromised CI environment:
echo $AWS_SECRET_ACCESS_KEY  # Exfiltrate cloud credentials
echo $DATABASE_URL          # Steal database access
echo $DEPLOY_TOKEN          # Compromise deployment pipeline

# Then pivot to:
# - Deploy backdoors to production
# - Access customer data
# - Crypto mining on my infrastructure
# - Lateral movement to other systems
```

The blast radius from a successful CI compromise is enormous because CI environments typically have elevated permissions to deploy, test, and integrate with other services.

## Best Practices: How to Not Get Pwned

Here's what I learned and what you should do to protect yourself:

### 1. Lockfile Hygiene

```bash
# Always use npm ci in production/CI
npm ci  # Uses exact lockfile versions

# Never use npm install in CI
npm install  # Can update versions unexpectedly
```

```json
// Keep your lockfile pinned
"dependencies": {
  "@types/node": "10.12.18",  // ✅ Exact version
  "@types/connect": "*"       // ❌ Wildcard = danger
}
```

### 2. CI/CD Security

```yaml
# Secure GitHub Actions workflow
name: Secure Build
on:
  pull_request:
    branches: [master] # Correct branch names

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4 # Latest version

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm' # Cache for performance

      # Use npm ci for reproducible builds
      - name: Install dependencies
        run: npm ci

      # Audit before building
      - name: Security audit
        run: npm audit --audit-level=critical

      - name: Build
        run: npm run build
```

### 3. Dependency Management

```bash
# Regular maintenance
npm outdated        # Check for updates
npm audit          # Security vulnerabilities
npm audit fix      # Auto-fix where possible

# Keep dependencies current
npm update         # Update within semver ranges
```

### 4. PR Review Guidelines

When reviewing PRs that touch CI/CD or dependencies:

- **Who is the contributor?** Do they have a history with your project?
- **Why are they making this change?** Unsolicited CI/CD PRs are suspicious
- **What permissions would this grant?** Review secrets and environment access
- **Are there obvious "mistakes"?** Sometimes bugs are features for attackers

### 5. Repository Protection

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
    reviewers:
      - 'your-username'
```

Enable branch protection rules:

- Require PR reviews for CI/CD changes
- Require status checks to pass
- Restrict who can modify workflows

## The Human Element

The scariest part of supply chain attacks isn't the technical sophistication – it's how they exploit our human nature. We want to be helpful to contributors. We want to trust the tools we use daily. We want to merge that PR that "fixes" an obvious mistake.

But in the age of automated attacks and compromised packages, a little paranoia goes a long way. That friendly contributor might be a bot. That helpful PR might be reconnaissance. That simple typo fix might be setting up a backdoor.

## Lessons Learned

1. **Trust but verify**: Even helpful PRs need scrutiny
2. **Keep dependencies updated**: Old packages are attractive targets
3. **Use lockfiles properly**: Pin versions and use `npm ci`
4. **Secure your CI/CD**: It's the crown jewel attackers want
5. **Stay informed**: Follow security researchers and vulnerability databases

## The Silver Lining

While getting targeted by a supply chain attack was unsettling, it was also educational. It reminded me that security isn't just about writing secure code – it's about securing the entire development pipeline.

The npm ecosystem is incredibly powerful, but that power comes with responsibility. Every `npm install` is a vote of trust in hundreds of package maintainers. Every GitHub Action workflow is a potential attack vector.

But don't let this scare you away from open source. The community is what makes JavaScript development amazing. Just be smart about it. Audit your dependencies. Review your workflows. Trust but verify.

And maybe, just maybe, be a little suspicious when `harshitcodez19` offers to help with your CI/CD pipeline.

---

_Stay safe out there, fellow developers. The supply chain attackers are getting creative, but so are we._

## References

- [OX Security: NPM Packages Compromised](https://www.ox.security/blog/npm-packages-compromised/)
- [GitHub Security Advisory Database](https://github.com/advisories)
- [npm Audit Documentation](https://docs.npmjs.com/cli/v11/commands/npm-audit)
- [Securing GitHub Actions](https://docs.github.com/en/actions/security-guides)
