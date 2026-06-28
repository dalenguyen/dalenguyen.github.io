# Runtime image for the prebuilt AnalogJS SSR server (Nitro `node-server`).
# `NITRO_PRESET=node-server nx build blog-app` (the `build-server` target)
# produces a self-contained server under dist/apps/blog-app/analog
# (server/ with bundled node_modules + prerendered public/). The `build-docker`
# target stages that into apps/blog-app/.cloudrun/analog, so this image just
# copies the output and runs node — no install step needed.
#
# Routes listed in `prerender.routes` (vite.config.ts) are served as static HTML
# from public/; every other route is server-rendered on demand; AnalogJS API
# routes (src/server/**) are served under /api (e.g. /api/v1/hello).
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
# Cloud Run injects PORT=8080; the node-server preset binds it on 0.0.0.0.
# --chown so the unprivileged `node` user owns the output (e.g. if Nitro ever
# needs to write a runtime cache under analog/).
COPY --chown=node:node .cloudrun/analog ./analog
# Drop root: the server only reads its bundled output, so the unprivileged
# `node` user (present in the official image) is enough.
USER node
CMD ["node", "analog/server/index.mjs"]
