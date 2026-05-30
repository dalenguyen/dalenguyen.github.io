import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'

const VIRTUAL_ID = 'virtual:learn-manifest'
const RESOLVED_ID = '\0' + VIRTUAL_ID

const NAV_HTML = `<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<style>
#learn-app-nav{position:sticky;top:0;z-index:9999;background:#1e293b;box-shadow:0 1px 3px rgba(0,0,0,.4);display:flex;align-items:center;padding:0 24px;height:64px;gap:4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
#learn-app-nav .nav-logo{flex-shrink:0;margin-right:12px;display:flex;align-items:center;}
#learn-app-nav .nav-logo img{width:32px;height:32px;border-radius:50%;}
#learn-app-nav a{display:flex;align-items:center;gap:4px;padding:8px 12px;border-radius:6px;color:#cbd5e1;text-decoration:none;font-size:14px;font-weight:500;transition:background .15s,color .15s;}
#learn-app-nav a:hover{background:#334155;color:#fff;}
#learn-app-nav .material-icons{font-size:18px;}
@media(max-width:640px){#learn-app-nav a .nav-label{display:none;}}
</style>
<nav id="learn-app-nav">
  <a href="/" class="nav-logo"><img src="/assets/images/dale-nguyen-avatar.webp" alt="Dale Nguyen"></a>
  <a href="/blog"><span class="material-icons">edit</span><span class="nav-label">Thoughts</span></a>
  <a href="/learn"><span class="material-icons">menu_book</span><span class="nav-label">Learning</span></a>
  <a href="/#portfolio"><span class="material-icons">grid_view</span><span class="nav-label">Digital Portfolio</span></a>
  <a href="/bucket-list"><span class="material-icons">checklist</span><span class="nav-label">Bucket List</span></a>
  <a href="/#about"><span class="material-icons">person</span><span class="nav-label">Biography</span></a>
  <a href="/#contact"><span class="material-icons">email</span><span class="nav-label">Contact</span></a>
</nav>`

function injectNav(html: string): string {
  // Remove any previously injected nav to avoid duplicates
  const cleaned = html.replace(/<link[^>]+Material\+Icons[^>]*>\s*<style>\s*#learn-app-nav[\s\S]*?<\/nav>/m, '')
  return cleaned.replace('<body>', `<body>\n${NAV_HTML}`)
}

function scanLearnDir(dir: string) {
  let files: string[]
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.html'))
  } catch {
    return []
  }
  return files.map((file) => {
    const html = readFileSync(join(dir, file), 'utf-8')
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? file
    const description =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() ?? ''
    return { title, description, url: `/learn/${file}` }
  })
}

export function learnManifestPlugin(learnDir: string): Plugin {
  let config: ResolvedConfig

  return {
    name: 'learn-manifest',

    configResolved(resolved) {
      config = resolved
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },

    load(id) {
      if (id !== RESOLVED_ID) return
      return `export const learnPages = ${JSON.stringify(scanLearnDir(learnDir))};`
    },

    // Dev: intercept /learn/*.html requests and inject nav
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/learn\/([^?#]+\.html)$/)
        if (!match) return next()
        const filePath = join(learnDir, match[1])
        if (!existsSync(filePath)) return next()
        const html = readFileSync(filePath, 'utf-8')
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(injectNav(html))
      })
    },

    // Build: transform the copied HTML files in the output directory
    closeBundle() {
      if (config?.command !== 'build') return
      const outLearnDir = join(config.root, config.build.outDir, 'learn')
      if (!existsSync(outLearnDir)) return
      for (const file of readdirSync(outLearnDir).filter((f) => f.endsWith('.html'))) {
        const filePath = join(outLearnDir, file)
        writeFileSync(filePath, injectNav(readFileSync(filePath, 'utf-8')))
      }
    },
  }
}
