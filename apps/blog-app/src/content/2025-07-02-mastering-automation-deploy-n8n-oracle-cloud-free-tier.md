---
title: Mastering Automation - A Step-by-Step Guide to Deploying n8n on Oracle Cloud Free Tier
slug: 2025-07-02-mastering-automation-deploy-n8n-oracle-cloud-free-tier
description: A comprehensive, step-by-step guide to deploying n8n on Oracle Cloud's Always Free Tier, including troubleshooting, SSL, Docker, and best practices for secure, cost-effective automation.
categories: ['n8n', 'self-hosting', 'oracle-cloud', 'docker', 'automation']
coverImage: https://dalenguyen.me/assets/images/blog/n8n-oci-overview.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-07-02T15:17:31.359Z
series: N8N Workflow Automation
author: Dale Nguyen
---

> For those who want to jump straight to the code, I've created a starter template repository on GitHub. It includes all the configurations and scripts mentioned in this guide.
>
> **[n8n-self-hosted-cloudflare-starter on GitHub](https://github.com/dalenguyen/n8n-self-hosted-cloudflare-starter)**

In a previous article, we explored running n8n locally and exposing it to the internet using a Cloudflare Tunnel. This approach is great for quick setups, testing, or personal use, as it allows you to keep your workflows private and avoid complex network configurations. However, it comes with a major limitation: your server or laptop must remain powered on and connected to the internet at all times for your automations to work. This can be inconvenient, less reliable for production use, and may not be suitable for 24/7 automation needs.

**Cloudflare Tunnel (Localhost) Approach:**

- **Pros:**
  - Simple to set up
  - No need to manage cloud infrastructure
  - Good for development and testing
- **Cons:**
  - Requires your local machine to be always on
  - Not ideal for production or critical workflows
  - Limited scalability and reliability

In this guide, we take automation to the next level by installing and configuring n8n directly on Oracle Cloud's Always Free Tier. This approach provides a dedicated, always-on environment for your workflows, making it much more suitable for production or mission-critical automations.

**Oracle Cloud Deployment:**

- **Pros:**
  - Always-on, reliable hosting
  - No need to keep your laptop/server running
  - Scalable and more secure
  - Free tier offers generous resources
- **Cons:**
  - Slightly more complex setup
  - Requires managing cloud resources and security
  - **Data on the free tier may be wiped out at any time (not guaranteed for production use)**

By the end of this article, you'll have a robust, cloud-hosted n8n instance that's accessible from anywhere, without the need to keep your personal device online.

## Why Oracle Cloud (Free Tier +)?

Oracle Cloud Infrastructure (OCI) offers an incredibly generous "Always Free" tier, making it an attractive option for self-hosting applications like n8n. While other cloud providers often limit their free tiers to 12 months or offer minimal resources, OCI provides:

- **Perpetual Free Resources:** Unlike many competitors, Oracle's "Always Free" tier resources do not expire after a trial period.
- **Generous Compute Resources:** You can typically get a VM.Standard.A1.Flex (ARM-based) instance with up to 4 OCPUs and 24 GB of RAM, or 2 AMD-based VMs with 1 OCPU and 1 GB RAM each. These are ample resources for running n8n and its database.
- **Ample Storage:** Up to 200 GB of Block Volume storage.
- **Free Networking:** Includes a public IP address, and significant outbound data transfer.
- **Complete Control:** You get full root access to your Linux VM, allowing for custom installations like Docker, Nginx, and databases, giving you maximum flexibility over your n8n environment.

This combination of free, powerful, and persistent resources makes OCI an ideal choice for running your n8n automation workflows without incurring monthly costs.

## Step-by-Step Installation

This guide assumes you have an Oracle Cloud Free Tier account created, a domain name registered (e.g., `n8n.yourdomain.com`), and basic familiarity with the Linux command line. We'll use an **Ubuntu** instance and **Docker Compose** for a robust and easily manageable n8n setup.

### 1. Create Your Oracle Cloud Instance

1.  **Log in to your OCI Console.**
2.  Navigate to **Compute > Instances**.
3.  Click **"Create Instance"**.
4.  **Configuration:**
    - **Name:** Give your instance a descriptive name (e.g., `n8n-instance`).
    - **Availability Domain & Fault Domain:** Choose a suitable AD and FD for your region (e.g., `AD-1`, `FD-2` in `ca-toronto-1`).
    - **Image and Shape:**
      - **Image:** Click "Change Image" and select `Canonical Ubuntu` (latest version, e.g., 22.04 LTS).
      - **Shape:** Click "Change Shape". Choose `Ampere` architecture, and select `VM.Standard.A1.Flex`. Allocate OCPUs and RAM within your Always Free limits (e.g., 2 OCPUs, 12 GB RAM for a good balance).
    - **Networking:**
      - **Virtual Cloud Network:** Choose your existing VCN or create a new one.
      - **Subnet:** Choose an existing subnet or create a new one.
      - **Public IP:** Ensure "Assign a public IP address" is checked. Note down this IP (e.g., `40.233.98.119`).
    - **SSH Keys:** Paste your existing public SSH key or generate a new one. Download the corresponding private key (`.key` file) to your local machine and keep it secure (e.g., `~/.ssh/my_oracle_key.key`).
    - **Boot Volume:** The default 50GB is usually sufficient for n8n.
5.  Click **"Create"**. Wait for the instance to provision and become "Running".

### Map Your Domain to Your Oracle Cloud Instance

Before you can access your n8n instance using a custom domain (like `n8n.yourdomain.com`), you need to point your domain to your Oracle Cloud instance's public IP address. This is done by creating an **A record** in your domain's DNS settings.

**Steps:**

1. **Find your instance's public IP:**

   - In the Oracle Cloud Console, go to your instance details and note the "Public IP Address" (e.g., `40.233.98.119`).

2. **Log in to your domain registrar or DNS provider:**

   - This could be Namecheap, GoDaddy, Cloudflare, Google Domains, etc.

3. **Add an A record:**

   - **Type:** A
   - **Name/Host:** `n8n` (or the subdomain you want to use)
   - **Value:** Your Oracle Cloud instance's public IP (e.g., `40.233.98.119`)
   - **TTL:** Default or 5-10 minutes

   For example, to use `n8n.yourdomain.com`, set the **Name/Host** to `n8n` and the **Value** to your instance's public IP.

4. **Wait for DNS propagation:**
   - Changes usually take a few minutes, but can take up to 24 hours. You can check if your domain points to the correct IP using tools like [Dig from Google Toolbox](https://toolbox.googleapps.com/apps/dig/).

Once this is set up, visiting `http://n8n.yourdomain.com` in your browser should reach your Oracle Cloud instance (after Nginx is configured in the next steps).

### 2. Configure OCI Network Security (Firewall Rules)

Even with `iptables` and UFW on the instance, OCI's network security groups (NSGs) or security lists act as a critical outer firewall.

1.  **Go to your OCI Console:** Navigate to **Networking > Virtual Cloud Networks**.
2.  **Select your VCN** that contains your instance.
3.  Click on **Security Lists** (or **Network Security Groups** if you're using them).
4.  **Select the Security List/NSG** associated with your instance's subnet/VNIC.
5.  **Add Ingress Rules:**
    - Click "Add Ingress Rules".
    - **Rule 1 (SSH):**
      - **Source Type:** CIDR
      - **Source CIDR:** `0.0.0.0/0` (or your specific IP for more security)
      - **IP Protocol:** TCP
      - **Destination Port Range:** `22`
    - **Rule 2 (HTTP):**
      - **Source Type:** CIDR
      - **Source CIDR:** `0.0.0.0/0`
      - **IP Protocol:** TCP
      - **Destination Port Range:** `80`
    - **Rule 3 (HTTPS):**
      - **Source Type:** CIDR
      - **Source CIDR:** `0.0.0.0/0`
      - **IP Protocol:** TCP
      - **Destination Port Range:** `443`

<figure>
  <img src="assets/images/blog/n8n-oci-ingress-rules.png" alt="n8n oci ingress rules" width="100%" height="auto" />
  <figcaption>n8n oci ingress rules</figcaption>
</figure>

### 3. Initial Server Setup & SSH Access

1.  **SSH into your instance:**
    The default username for Ubuntu instances on OCI is `ubuntu`.

    ```bash
    chmod 400 /path/to/your/my_oracle_key.key # Set correct permissions for private key
    ssh -i /path/to/your/my_oracle_key.key ubuntu@<your_instance_public_ip>
    ```

    (Replace with your actual private key path and public IP).

2.  **Update System Packages:**

    ```bash
    sudo apt update -y
    sudo apt upgrade -y
    ```

3.  **Reset `iptables` Policies (Crucial for OCI Connectivity):**
    This step has resolved "No route to host" errors for many Oracle Cloud users, as it clears any hidden low-level firewall rules.

    ```bash
    sudo iptables -P INPUT ACCEPT
    sudo iptables -P OUTPUT ACCEPT
    sudo iptables -P FORWARD ACCEPT
    sudo iptables -F
    sudo apt install iptables-persistent -y
    sudo netfilter-persistent save
    ```

    During `iptables-persistent` installation, confirm saving IPv4 and IPv6 rules.

4.  **Configure Ubuntu Firewall (UFW):**

    ```bash
    sudo ufw allow 22/tcp # Allow SSH
    sudo ufw allow 80/tcp # Allow HTTP
    sudo ufw allow 443/tcp # Allow HTTPS
    sudo ufw enable
    sudo ufw status verbose # Verify rules are active
    ```

5.  **Reboot the Instance (Recommended):**
    To ensure all network changes are applied cleanly.

    ```bash
    sudo reboot
    ```

    Wait a few minutes, then SSH back in.

### 4. Install Docker and Docker Compose

Docker is the recommended way to run n8n in production.

1.  **Connect via SSH after reboot.**
2.  **Install Docker & Docker Compose Plugin:**
    ```bash
    sudo apt install ca-certificates curl gnupg lsb-release -y
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update -y
    sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
    sudo systemctl start docker
    sudo systemctl enable docker
    ```
3.  **Add your user (`ubuntu`) to the docker group:**
    ```bash
    sudo usermod -aG docker ubuntu
    newgrp docker # Apply group changes immediately for current session
    ```

### 5. Install Nginx & Prepare for Certbot

1.  **Install Nginx:**

    ```bash
    sudo apt install nginx -y
    sudo systemctl start nginx
    sudo systemctl enable nginx
    ```

2.  **Create Nginx Web Root and Test Page:**

    ```bash
    sudo mkdir -p /var/www/html
    echo "Hello from Nginx! Testing HTTP Connectivity." | sudo tee /var/www/html/index.html
    sudo chown -R www-data:www-data /var/www/html
    sudo chmod -R 755 /var/www/html
    ```

3.  **Configure Nginx for your Domain (HTTP only for now):**
    Create a new Nginx configuration file for your domain.

    ```bash
    sudo nano /etc/nginx/conf.d/n8n.conf
    ```

    Paste this content (replace `n8n.yourdomain.com` with your domain):

    ```nginx
    server {
        listen 80;
        listen [::]:80;
        server_name n8n.yourdomain.com; # Your exact domain

        location /.well-known/acme-challenge/ {
            root /var/www/html; # Used by Certbot for verification
            allow all;
        }

        location / {
            root /var/www/html; # Temporarily serve static HTML
            index index.html index.htm;
            try_files $uri $uri/ =404;
        }
    }
    ```

    _Save and exit (`Ctrl+X`, `Y`, `Enter`)._

4.  **Test Nginx Configuration and Reload:**

    ```bash
    sudo nginx -t
    sudo systemctl reload nginx
    ```

5.  **Verify HTTP Access (from your local browser):**
    Visit `http://n8n.yourdomain.com`. You should now see "Hello from Nginx! Testing HTTP Connectivity." This confirms Nginx is properly serving.

### 6. Obtain SSL Certificate with Certbot (Let's Encrypt)

1.  **Install Certbot and Nginx Plugin:**

    ```bash
    sudo apt install certbot python3-certbot-nginx -y
    ```

2.  **Run Certbot:**

    ```bash
    sudo certbot --nginx -d n8n.yourdomain.com
    ```

    - Follow the prompts: Enter email, agree to terms, choose to redirect HTTP to HTTPS (`2`).
    - Certbot will automatically modify your Nginx config to include SSL and redirect HTTP traffic.

3.  **Test Nginx Configuration and Reload (again):**

    ```bash
    sudo nginx -t
    sudo systemctl reload nginx
    ```

4.  **Test Automatic Renewal:**

    ```bash
    sudo certbot renew --dry-run
    ```

    This should complete successfully.

5.  **Verify HTTPS in Browser:**
    Go to `https://n8n.yourdomain.com`. You should see a secure padlock.

### 7. Install n8n with Docker Compose & Database

Now, we'll set up n8n with a PostgreSQL database using Docker Compose.

1.  **Create a directory for n8n:**

    ```bash
    mkdir ~/n8n
    cd ~/n8n
    ```

2.  **Create `docker-compose.yml`:**

    ```bash
    nano docker-compose.yml
    ```

    Paste the following content. **Remember to change placeholders:**

    - `your_strong_database_password`
    - `n8n.yourdomain.com`
    - `America/Toronto` (to your timezone)
    - Generate a unique `N8N_ENCRYPTION_KEY` (run `head /dev/urandom | tr -dc A-Za-z0-9_ | head -c 32 ; echo ''` and paste the output).

    <!-- end list -->

    ```yaml
    version: '3.8'

    services:
      postgres:
        image: postgres:15
        restart: always
        environment:
          POSTGRES_DB: n8n
          POSTGRES_USER: n8nuser
          POSTGRES_PASSWORD: your_strong_database_password # CHANGE THIS!
        volumes:
          - ./pg_data:/var/lib/postgresql/data
        networks:
          - n8n_backend
        healthcheck: # Ensures n8n waits for DB to be ready
          test: ['CMD-SHELL', 'pg_isready -U n8nuser -d n8n']
          interval: 5s
          timeout: 5s
          retries: 5

      n8n:
        image: n8nio/n8n
        restart: always
        environment:
          DB_TYPE: postgresdb
          DB_POSTGRESDB_HOST: postgres
          DB_POSTGRESDB_PORT: 5432
          DB_POSTGRESDB_DATABASE: n8n
          DB_POSTGRESDB_USER: n8nuser
          DB_POSTGRESDB_PASSWORD: your_strong_database_password # MUST MATCH ABOVE!
          N8N_HOST: n8n.yourdomain.com # CHANGE THIS to your actual domain
          WEBHOOK_URL: https://n8n.yourdomain.com/ # CHANGE THIS to your actual domain
          N8N_PROTOCOL: https
          GENERIC_TIMEZONE: America/Toronto # Adjust to your timezone
          N8N_ENCRYPTION_KEY: your_generated_32_char_key # PASTE THE GENERATED KEY HERE
        ports:
          - '127.0.0.1:5678:5678' # Only expose to localhost for Nginx proxy
        volumes:
          - ./n8n_data:/home/node/.n8n
        networks:
          - n8n_backend
        depends_on:
          postgres:
            condition: service_healthy # Wait for DB to be healthy

    networks:
      n8n_backend:
        driver: bridge
    ```

    _Save and exit._

3.  **Set Permissions for n8n Data Volume:**
    This ensures the `node` user inside the container can write to the `n8n_data` volume.

    ```bash
    sudo chown -R 1000:1000 n8n_data # 1000:1000 is often the UID/GID of 'node' user in n8n image
    ```

    If `n8n_data` doesn't exist yet, Docker will create it with root permissions. You might need to run this command _after_ the first `docker compose up -d` if it fails, or simply create the directory first: `mkdir n8n_data && sudo chown -R 1000:1000 n8n_data`.

4.  **Start n8n and the Database:**

    ```bash
    docker compose up -d
    ```

5.  **Verify Docker Containers:**

    ```bash
    docker ps
    ```

    Both `n8n` and `postgres` (or `mysql`) containers should show `Up` status. If `n8n` is still `Restarting`, check `docker logs n8n-n8n-1` for specific errors (e.g., database connection issues, incorrect `N8N_ENCRYPTION_KEY`).

### 8. Configure Nginx Reverse Proxy for n8n

Finally, tell Nginx to forward traffic from your domain to the running n8n container.

1.  **Edit your Nginx configuration file again:**

    ```bash
    sudo nano /etc/nginx/conf.d/n8n.conf
    ```

2.  **Locate the `server` block that has `listen 443 ssl;` and `server_name n8n.yourdomain.com;`.**

3.  **Inside this block, replace or add the `location / {}` block to proxy to n8n:**

    ```nginx
    # ... (other parts of the server block for listen 443 ssl) ...
        location / {
            proxy_pass http://localhost:5678; # n8n Docker container is accessible on localhost:5678
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_buffering off; # Important for long-running workflows
        }
    # ... (rest of the server block for listen 443 ssl) ...
    ```

    _Make sure the `location /.well-known/acme-challenge/` block is still present in your `listen 80;` server block (Certbot usually handles this correctly)._
    _Save and exit._

4.  **Test Nginx Configuration and Reload:**

    ```bash
    sudo nginx -t
    sudo systemctl reload nginx
    ```

5.  **Final Verification:**
    Open your web browser and navigate to `https://n8n.yourdomain.com`. You should now see the n8n setup screen. Create your first user account, and you're ready to start automating!

## Troubleshooting Common Issues

- **`ERR_CONNECTION_REFUSED` / `No route to host` (solved in this guide!):**

  - **Reason:** Often a low-level firewall or routing issue on Oracle Cloud instances.
  - **Fix:** The `sudo iptables -P INPUT ACCEPT; sudo iptables -P OUTPUT ACCEPT; sudo iptables -P FORWARD ACCEPT; sudo iptables -F` followed by `iptables-persistent` installation and a reboot usually resolves this. Also ensure OCI Security Lists/NSGs and UFW allow ports 80/443.

- **`EACCES: permission denied, open '/home/node/.n8n/config'` (n8n container restarting):**

  - **Reason:** The n8n container doesn't have write permissions to the mounted `n8n_data` volume.
  - **Fix:** `sudo chown -R 1000:1000 ~/n8n/n8n_data` (adjust path if different).

- **`Error getting validation data` (Certbot failed):**

  - **Reason:** Nginx is not correctly serving the `.well-known/acme-challenge/` path on port 80.
  - **Fix:** Ensure Nginx is running, its port 80 block has `server_name` matching your domain, and the `location /.well-known/acme-challenge/ { root /var/www/html; allow all; }` block is correctly configured and pointing to a writable directory (`/var/www/html` should be owned by `www-data`). Ensure no `listen 443 ssl;` block is active before Certbot runs.

- **N8N `Restarting (1)` (not permissions/database):**

  - **Reason:** Check `docker logs n8n-n8n-1`. This could be database credential mismatch, database not fully initialized, or invalid `N8N_ENCRYPTION_KEY`.
  - **Fix:** Double-check all environment variables in `docker-compose.yml`, especially database passwords and the 32-character encryption key. Add a `healthcheck` for the database service and `depends_on: { postgres: { condition: service_healthy } }` for n8n.

## Backup and Restore Strategy

**Regular backups are crucial for self-hosted n8n!**

1.  **Stop n8n and database containers:**
    ```bash
    cd ~/n8n
    docker compose stop
    ```
2.  **Create a timestamped archive of your data volumes:**
    ```bash
    tar -czvf n8n_backup_$(date +%Y%m%d%H%M%S).tar.gz n8n_data pg_data
    ```
    (Replace `pg_data` with `mysql_data` if you used MySQL).
3.  **Securely transfer the backup:**
    Download this `.tar.gz` file to your local machine or upload it to object storage (e.g., OCI Object Storage, S3, Google Cloud Storage) for off-site redundancy.
    ```bash
    # Example to download to your local machine from SSH
    # From your LOCAL machine:
    # scp -i /path/to/your/my_oracle_key.key ubuntu@<your_instance_public_ip>:~/n8n/n8n_backup_*.tar.gz .
    ```
4.  **Restart containers:**
    ```bash
    docker compose up -d
    ```

**To Restore:**

1.  **Stop containers:** `docker compose stop`
2.  **Remove existing data (BE CAREFUL!):** `rm -rf n8n_data pg_data`
3.  **Transfer your backup archive** to `~/n8n/` on the server.
4.  **Extract the backup:** `tar -xzvf n8n_backup_YOUR_TIMESTAMP.tar.gz`
5.  **Set correct permissions:** `sudo chown -R 1000:1000 n8n_data pg_data`
6.  **Start containers:** `docker compose up -d`

## Further Enhancements & Considerations

- **Security:** Always use strong, unique passwords for your database and any n8n basic auth. Keep your SSH private key secure.
- **Monitoring:** Implement basic monitoring for your instance's CPU, RAM, and disk usage to ensure n8n runs smoothly.
- **Updates:** Periodically update your n8n Docker image by running `docker compose pull n8n` followed by `docker compose up -d` (always backup first!).
- **Custom Domains:** If you have multiple domains, you can configure Nginx to handle more, or use a wildcard certificate if you have one.
- **Node Versions:** For specific n8n versions, use `n8nio/n8n:1.X.X` in your `docker-compose.yml`. `:latest` gets the newest.
- **Scalability:** For very heavy workloads, consider a more powerful OCI instance, or exploring n8n's queue mode and separate workers.

By following this comprehensive guide, you've successfully deployed a powerful n8n automation server on Oracle Cloud's Free Tier, complete with domain mapping, SSL, and robust Docker management! Enjoy building your workflows.
