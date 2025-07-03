---
title: How to Start Your Own MCP Server with n8n
slug: 2025-06-29-how-to-start-your-own-mcp-server-with-n8n
description: Learn how to launch your own Model Context Protocol (MCP) server and client directly from n8n, including a secure Gmail MCP server example—all without extra installation.
categories: ['n8n', 'mcp', 'ai-agents', 'automation']
coverImage: https://dalenguyen.me/assets/images/blog/n8n-gmail-mcp-server.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-06-29T20:17:31.359Z
series: N8N Workflow Automation
author: Dale Nguyen
---

With recent versions of n8n, you can launch your own Model Context Protocol (MCP) server and client directly from the n8n interface—no extra installation, npm packages, or Docker images required. This built-in capability lets you expose n8n workflows as AI-usable tools and connect to other MCP servers, all within your workflow editor.

> For those who want to jump straight to the code, I've created a starter template repository on GitHub. It includes all the configurations and scripts mentioned in this guide.
>
> **[n8n-self-hosted-cloudflare-starter on GitHub](https://github.com/dalenguyen/n8n-self-hosted-starter)**

Below is a step-by-step guide to getting started.

## What is MCP in n8n?

MCP (Model Context Protocol) is a standard that lets AI agents and other clients discover, call, and interact with tools—like n8n workflows—over a simple HTTP or SSE (Server-Sent Events) interface. In n8n, the **MCP Server Trigger** node exposes your workflows as MCP tools, while the **MCP Client Tool** node lets you call tools exposed by other MCP servers.

## Prerequisites

- n8n version **1.88.0 or higher** (for built-in MCP nodes)
- A running n8n instance (self-hosted or cloud)

## Step 1: Add the MCP Server Trigger Node

1. **Create a New Workflow** in n8n.
2. **Add the MCP Server Trigger Node**:
   - Search for "MCP Server Trigger" in the node panel and add it to your canvas.
   - This node will expose a unique URL endpoint (e.g., `/mcp/abc123`) that MCP clients can call to access your workflow as a tool.
3. **Configure the Node**:
   - **MCP URL Path:** Use the default or customize it.
   - **Authentication:** Choose "None" for open access (not recommended for production) or configure authentication (e.g., API key or header).
   - **Connect Tool Nodes:** Attach nodes that represent the tools you want to expose (e.g., HTTP Request, Send Email, custom functions).

## Step 2: Expose Your Tools

- **Native and Custom Tools:** You can expose both built-in n8n tools (like Google Calendar, HTTP Request) and your own custom logic as MCP tools.
- **Workflow as a Tool:** Use the "Custom n8n Workflow Tool" node to expose entire workflows as callable MCP tools.

## Step 3: Activate and Share

- **Activate the Workflow:** Toggle the workflow to active.
- **Share the MCP Endpoint:** The MCP Server Trigger node displays the endpoint URL. Share this with AI agents or MCP clients that need to call your tools.

<figure>
  <img src="assets/images/blog/n8n-gmail-mcp-server-configuration.png" alt="MCP Server URL" width="100%" height="auto" />
  <figcaption>MCP Server URL</figcaption>
</figure>

## Step 4: Connect with the MCP Client Tool Node

1. **Add an MCP Client Tool Node** in another workflow or instance.
2. **Configure the Node**:
   - **SSE Endpoint:** Enter the MCP Server URL you created earlier.
   - **Authentication:** Set up bearer token or header authentication if required.
   - **Select Tools:** Choose which tools to expose to your AI agent—All, Selected, or All Except.
3. **Use with AI Agents:** Connect the MCP Client Tool node to your AI Agent node or other workflow logic. The AI agent can now discover and use your exposed tools dynamically.

<figure>
  <img src="assets/images/blog/n8n-configure-mcp-client.png" alt="Expose MCP Server to a workflow" width="100%" height="auto" />
  <figcaption>Expose MCP Server to a workflow</figcaption>
</figure>

## Step 5: Test Your MCP Server

You can test your MCP endpoint by using Postman MCP client (with appropriate authentication if enabled):

<figure>
  <img src="assets/images/blog/n8n-postman-testing.png" alt="Test n8n MCP server using Postman MCP" width="100%" height="auto" />
  <figcaption>Test n8n MCP server using Postman MCP</figcaption>
</figure>

If configured correctly, n8n will execute the connected tool node and return the result.

## Example Use Cases

- **Expose a Send Email Tool:** Trigger an email-sending workflow via MCP.
- **Integrate with Google Calendar:** Let AI agents schedule events by calling your n8n workflow.
- **Custom Data Processing:** Build custom tools (e.g., data cleaning, API aggregation) and expose them for programmatic use.

<figure>
  <img src="assets/images/blog/n8n-example-chat-with-mcp.png" alt="Example of getting unread emails via Gmail MCP server" width="100%" height="auto" />
  <figcaption>Example of getting unread emails via Gmail MCP server</figcaption>
</figure>

## Security Best Practices

- **Always use authentication** (API key, bearer token, or header) on production MCP endpoints.
- **Restrict access** to your MCP endpoints using firewall rules, Cloudflare Access, or reverse proxy.
- **Monitor usage** and logs for unusual activity.

## Summary Table

| Node               | Purpose                                      |
| ------------------ | -------------------------------------------- |
| MCP Server Trigger | Exposes n8n tools/workflows as MCP endpoints |
| MCP Client Tool    | Connects to external MCP servers as a client |

With these built-in nodes, you can turn n8n into a powerful, AI-ready automation server—no extra installation or configuration required. Just add, connect, activate, and your MCP server is live!
