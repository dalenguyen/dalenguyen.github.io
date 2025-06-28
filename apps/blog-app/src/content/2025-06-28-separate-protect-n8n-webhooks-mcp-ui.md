---
title: Separate and Protect n8n Webhooks and MCP Endpoints from the Login UI
slug: 2025-06-28-separate-protect-n8n-webhooks-mcp-ui
description: Learn how to securely self-host n8n by separating webhook endpoints and management UI, using Cloudflare Tunnel, subdomains, and access controls for maximum security and flexibility.
categories: ['n8n', 'self-hosting', 'cloudflare', 'security']
coverImage: https://dalenguyen.me/assets/images/blog/n8n-page-blocked.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-06-28T15:17:31.359Z
series: N8N Workflow Automation
author: Dale Nguyen
---

Self-hosting n8n offers flexibility and privacy, but exposing both the UI and webhooks to the public internet can create security risks. The best practice is to **separate your webhook endpoints and management/control panel (MCP) from the n8n login UI**, and apply different security measures to each. Here's a practical guide on how to do this using Cloudflare Tunnel, subdomains, and access controls.

> For those who want to jump straight to the code, I've created a starter template repository on GitHub. It includes all the configurations and scripts mentioned in this guide.
>
> **[n8n-self-hosted-cloudflare-starter on GitHub](https://github.com/dalenguyen/n8n-self-hosted-cloudflare-starter)**

## Why Separate Webhooks from the n8n UI?

- **Security:** The n8n UI (editor/login) should be tightly secured and only accessible to trusted users.
- **Functionality:** Webhooks often need to be accessible publicly for integrations but should not expose your management interface.
- **Flexibility:** You can apply different security policies to each endpoint.

## Architecture Overview

| Subdomain             | Purpose                 | Exposure         | Protection                              |
| --------------------- | ----------------------- | ---------------- | --------------------------------------- |
| `n8n.example.com`     | n8n UI (Editor/Login)   | Private          | Cloudflare Access, VPN, or IP allowlist |
| `webhook.example.com` | Webhook / MCP endpoints | Public (limited) | Token/IP checks, Cloudflare rules       |

## Step 1: Use Separate Subdomains

Configure your DNS and Cloudflare Tunnel to use **distinct subdomains** for the UI and webhooks. For example:

- `n8n.example.com` → n8n UI
- `webhook.example.com` → n8n webhooks

This separation allows you to route and protect each endpoint differently.

## Step 2: Route Traffic Internally with a Reverse Proxy

> **Note:** Using a reverse proxy to separate traffic is optional. Both the UI and webhook subdomains can point to the same n8n instance. You can rely on Cloudflare to provide additional security for the webhook subdomain now or in the future, even if both subdomains route to the same backend.

Use a reverse proxy (like Traefik or Caddy) to internally route requests:

- All `/webhook/*` traffic goes to the n8n webhook handler.
- All other traffic (UI, login, MCP) goes to the n8n UI.

**Example with Traefik:**

```yaml
# docker-compose.yml (snippet)
services:
  traefik:
    # ...traefik config...
  n8n:
    # ...n8n config...
    environment:
      - WEBHOOK_URL=https://webhook.example.com/
      - N8N_HOST=n8n.example.com
```

## Step 3: Secure the n8n UI with Cloudflare Access

- Set up a Cloudflare Access policy for `n8n.example.com`.
- Require login with your identity provider (Google, GitHub, etc.), IP allowlist, or other Zero Trust rules.
- This ensures only authorized users can access the n8n editor and login page.

<figure>
  <img src="assets/images/blog/n8n-zero-trust-login.png" alt="Zero Trust protection for login page" width="100%" height="auto" />
  <figcaption>Zero Trust protection for login page</figcaption>
</figure>

## Step 4: Protect Webhook Endpoints

Webhooks often need to be public, but you can still apply protection:

- **Bearer Token:** Require a secret token in the `Authorization` header.
- **IP Whitelisting:** Restrict allowed source IPs in Cloudflare Firewall Rules.
- **Cloudflare WAF:** Set up custom rules to block suspicious or abusive traffic.
- **Obscure URLs:** n8n generates long, random webhook URLs, but don't rely solely on obscurity.

## Example: Cloudflare Tunnel and Access Policy

**Cloudflare Tunnel:**

- Create two tunnels or two hostname routes:
  - `n8n.example.com` → n8n UI (private)
  - `webhook.example.com` → n8n webhooks (public, but with WAF)

**Cloudflare Access Policy for UI:**

- Go to Cloudflare Zero Trust > Access > Applications
- Add your UI subdomain
- Set a policy: allow only specific emails, groups, or IPs

**Cloudflare Firewall Rule for Webhooks:**

- Go to Security > WAF > Firewall Rules
- Add a rule: Allow only specific IPs or require a custom header/token

## Summary Table

| Endpoint | Subdomain           | Exposure         | Protection                           |
| -------- | ------------------- | ---------------- | ------------------------------------ |
| n8n UI   | n8n.example.com     | Private          | Cloudflare Access, VPN, IP allowlist |
| Webhooks | webhook.example.com | Public (limited) | Bearer token, IP rules, WAF          |

## Final Thoughts

By **separating your n8n UI and webhook endpoints onto different subdomains** and applying tailored security controls, you dramatically reduce the risk of unauthorized access to your automation platform. Use Cloudflare Tunnel and Access for the UI, and firewall/token protections for webhooks. For advanced setups, a reverse proxy like Traefik or Caddy can help route and isolate traffic internally.

> For a detailed, step-by-step configuration, see guides like [dalenguyen's n8n Cloudflare starter](https://github.com/dalenguyen/n8n-self-hosted-cloudflare-starter/blob/main/CLOUDFLARE_SETUP.md) and community write-ups on Cloudflare Zero Trust.

Secure automating!
