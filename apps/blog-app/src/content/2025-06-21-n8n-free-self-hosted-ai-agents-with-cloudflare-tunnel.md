---
title: Free Self-Host AI Agent Workflows with n8n and Cloudflare Tunnel
slug: 2025-06-21-n8n-free-self-hosted-ai-agents-with-cloudflare-tunnel
description: Learn how to self-host n8n AI agent workflows for free using Docker and Cloudflare Tunnel. This guide shows you how to deploy powerful workflow automation locally with secure remote access, giving you full control and privacy while keeping costs minimal.
categories: ['n8n', 'ai-agents', 'self-hosting', 'cloudflare', 'docker']
coverImage: https://dalenguyen.me/assets/images/blog/n8n-workflow-hosting.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-06-21T15:17:31.359Z
series: N8N Workflow Automation
author: Dale Nguyen
---

Self-hosting your AI agent workflows can give you full control, privacy, and cost savings compared to cloud SaaS solutions. In this guide, I'll walk you through a free and secure way to self-host **n8n** — a powerful workflow automation tool — using **Docker** and **Cloudflare Tunnel**. This setup enables you to expose your local n8n instance securely to the internet without complex firewall or port forwarding configurations.

> For those who want to jump straight to the code, I've created a starter template repository on GitHub. It includes all the configurations and scripts mentioned in this guide.
>
> **[n8n-self-hosted-cloudflare-starter on GitHub](https://github.com/dalenguyen/n8n-self-hosted-cloudflare-starter)**

---

## Why Self-Host n8n with Cloudflare Tunnel?

- **Cost-effective:** No monthly hosting fees beyond your own hardware and electricity.
- **Secure:** Cloudflare Tunnel creates encrypted tunnels, hiding your server behind Cloudflare's network.
- **Accessible:** Access your workflows remotely from anywhere with a custom domain.
- **Flexible:** Run on any always-on device like a Raspberry Pi, old laptop, or home server.

---

## Prerequisites

- An always-on device (e.g., Raspberry Pi, old PC)
- Docker and Docker Compose installed
- A free Cloudflare account
- A domain name managed by Cloudflare (can be purchased cheaply)
- Basic familiarity with command line and Docker

---

## Step 1: Set Up n8n with Docker

To avoid storing sensitive credentials directly in your `docker-compose.yml`, we'll use an environment file (`.env`). This is a security best practice that prevents secrets from being accidentally exposed in version control.

1.  **Create a directory** for your n8n setup.
2.  **Create an `.env` file** to store your credentials. Make sure this file is never committed to Git.

    ```dotenv
    # .env
    N8N_BASIC_AUTH_USER=admin
    N8N_BASIC_AUTH_PASSWORD=your_super_secret_password
    ```

    > **Important:** Add `.env` to your `.gitignore` file.

3.  **Create the `docker-compose.yml`** to reference these variables:

    ```yaml
    version: '3'

    services:
      n8n:
        image: n8nio/n8n
        restart: always
        ports:
          - 5678:5678
        environment:
          - N8N_BASIC_AUTH_ACTIVE=true
          - N8N_BASIC_AUTH_USER=${N8N_BASIC_AUTH_USER}
          - N8N_BASIC_AUTH_PASSWORD=${N8N_BASIC_AUTH_PASSWORD}
          - N8N_HOST=your-subdomain.your-domain.com
          - N8N_PORT=5678
          - N8N_PROTOCOL=https
          - WEBHOOK_URL=https://your-subdomain.your-domain.com
        volumes:
          - ./n8n_data:/home/node/.n8n
    ```

Run the container:

```bash
docker-compose up -d
```

This starts n8n locally on port 5678 with basic authentication enabled.

<figure>
  <img src="assets/images/blog/n8n-first-login-screen.png" alt="n8n first login screen" width="100%" height="auto" />
  <figcaption>n8n first login screen</figcaption>
</figure>

---

## Step 2: Install and Configure Cloudflare Tunnel

Cloudflare Tunnel (via `cloudflared`) securely exposes your local n8n server to the internet.

1. **Install cloudflared** on your device:

```bash
# For macOS
brew install cloudflared

# For Windows
winget install --id Cloudflare.cloudflared

# For Linux (Debian/Ubuntu)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

2. **Authenticate with Cloudflare:**

```bash
cloudflared login
```

This opens a browser to authorize your Cloudflare account.

3. **Create a tunnel:**

```bash
cloudflared tunnel create n8n-tunnel
```

4. **Configure DNS to point your subdomain to the tunnel:**

```bash
cloudflared tunnel route dns n8n-tunnel n8n.your-domain.com
```

5. **Run the tunnel to forward traffic to your local n8n:**

```bash
cloudflared tunnel run n8n-tunnel --url http://localhost:5678
```

You can also run this as a systemd service for persistence.

After that, you can access your n8n workflow everywhere using your subdomain.

<figure>
  <img src="assets/images/blog/n8n-cloudflared-logged-in.png" alt="n8n cloudflared logged in" width="100%" height="auto" />
  <figcaption>n8n cloudflared logged in</figcaption>
</figure>

---

## Step 3: Secure and Manage Access

- Use Cloudflare Zero Trust Access policies to restrict who can access your n8n UI.
- Keep basic auth enabled in n8n to add an extra security layer.
- Optionally, separate webhook URLs and UI access with different hostnames and policies for better security.

---

## Step 4: Backup Your Workflows

Create a simple backup script to archive your n8n data:

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d")
tar -czf n8n_backup_$TIMESTAMP.tar.gz ./n8n_data
# Keep only last 7 backups
ls -tp | grep -v '/$' | tail -n +8 | xargs -I {} rm -- {}
```

Schedule this with cron for regular backups.

### How to Schedule with Cron

To automate your backups, you can schedule the script to run periodically using `cron`.

1.  **Open your crontab file** for editing:
    ```bash
    crontab -e
    ```
2.  **Add a new line** to schedule the backup script. For example, to run it every day at 2:00 AM:

    ```cron
    0 2 * * * /path/to/your/backup_script.sh
    ```

    - `0 2 * * *` means the script will run at minute 0, hour 2, every day, every month, and every day of the week.
    - Make sure to replace `/path/to/your/backup_script.sh` with the absolute path to your backup script.

3.  **Save and close the file**. The cron daemon will automatically pick up the new schedule.

### How to Restore from a Backup

To restore your n8n data from a backup archive, follow these steps:

1.  **Stop the running n8n container:**
    ```bash
    docker-compose down
    ```
2.  **Rename the current data directory** (this is safer than deleting it):
    ```bash
    mv ./n8n_data ./n8n_data_old
    ```
3.  **Extract your backup archive** (replace with your backup filename):
    ```bash
    tar -xzf n8n_backup_YYYYMMDD.tar.gz
    ```
    This recreates the `./n8n_data` directory from your backup.
4.  **Restart the n8n service:**
    ```bash
    docker-compose up -d
    ```

---

## Optional: Extend with AI Agent Workflows

You can integrate AI capabilities into your self-hosted n8n by using the **[Self-hosted AI Starter Kit](https://github.com/n8n-io/self-hosted-ai-starter-kit)** curated by n8n, which bundles n8n with local AI tools like Ollama and vector stores like Qdrant. This enables you to build AI agents for tasks like scheduling, document summarization, and smarter chatbots — all running locally for privacy and cost control.

---

## Summary

By combining n8n, Docker, and Cloudflare Tunnel, you can:

- Run a powerful workflow automation platform on your own hardware
- Securely expose it to the internet without opening ports
- Use your own domain with Cloudflare DNS
- Keep costs near zero aside from your device and internet
- Easily back up and maintain your workflows
- Get started quickly with the **[companion GitHub repository](https://github.com/dalenguyen/n8n-self-hosted-cloudflare-starter)**.

This approach is ideal for hobbyists, small businesses, and privacy-conscious users wanting full control over their AI agent workflows.
