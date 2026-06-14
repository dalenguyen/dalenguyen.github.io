import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'

const VIRTUAL_ID = 'virtual:reading-time-manifest'
const RESOLVED_ID = '\0' + VIRTUAL_ID
const WORDS_PER_MINUTE = 200

// Resolve a post's slug the same way the prerenderer does: frontmatter `slug`
// if present, otherwise the filename without extension.
function slugFor(file: string, raw: string): string {
  const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
  const slug = frontmatter
    .match(/^slug:\s*(.+)$/m)?.[1]
    ?.trim()
    .replace(/^['"]|['"]$/g, '')
  return slug || file.replace(/\.md$/, '')
}

// A deliberately rough estimate: strip frontmatter and fenced code, drop HTML
// tags and markdown punctuation, then count words at 200 wpm (min 1).
function readingMinutes(raw: string): number {
  const body = raw
    .replace(/^---\r?\n[\s\S]*?\r?\n---/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~[\]()!]/g, ' ')
  const words = body.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

function scan(contentDir: string): Record<string, number> {
  let files: string[]
  try {
    files = readdirSync(contentDir).filter((f) => f.endsWith('.md'))
  } catch {
    return {}
  }
  const map: Record<string, number> = {}
  for (const file of files) {
    const raw = readFileSync(join(contentDir, file), 'utf-8')
    map[slugFor(file, raw)] = readingMinutes(raw)
  }
  return map
}

/**
 * Exposes `virtual:reading-time-manifest` — a `{ [slug]: minutes }` map built at
 * build time from the markdown sources. Keeps post bodies out of the blog-list
 * bundle (the list only needs the number, not the content).
 */
export function readingTimeManifestPlugin(contentDir: string): Plugin {
  return {
    name: 'reading-time-manifest',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id) {
      if (id !== RESOLVED_ID) return
      return `export const readingTimes = ${JSON.stringify(scan(contentDir))};`
    },
  }
}
