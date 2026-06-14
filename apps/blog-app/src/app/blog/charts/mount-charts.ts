import { ApplicationRef, ComponentRef, createComponent, EnvironmentInjector, Type } from '@angular/core'

export interface ChartEntry {
  component: Type<unknown>
  inputs?: Record<string, unknown>
}

/** A post's chart manifest: maps each `data-chart="…"` key to a component. */
export type ChartManifest = Record<string, ChartEntry>

// Auto-discover every post's co-located chart manifest. Each post that uses
// interactive charts ships a `charts.ts` next to its markdown:
//   src/content/<slug>.md  +  src/content/<slug>/charts.ts
// whose default export is a ChartManifest. No central registry to edit.
const manifests = import.meta.glob<{ default: ChartManifest }>('/src/content/*/charts.ts')

/**
 * Mounts a post's interactive Angular components into its `<div data-chart="…">`
 * placeholders. Loads only the manifest for `slug`, so each post pays for only
 * its own charts. Browser-only; called after the markdown has rendered.
 */
export async function mountInteractiveCharts(
  root: ParentNode,
  envInjector: EnvironmentInjector,
  appRef: ApplicationRef,
  slug: string,
): Promise<ComponentRef<unknown>[]> {
  const loader = manifests[`/src/content/${slug}/charts.ts`]
  if (!loader) return []

  const registry = (await loader()).default ?? {}
  const refs: ComponentRef<unknown>[] = []

  root.querySelectorAll<HTMLElement>('[data-chart]').forEach((host) => {
    if (host.dataset['mounted']) return
    const entry = registry[host.dataset['chart'] ?? '']
    if (!entry) return

    host.innerHTML = '' // drop the no-JS fallback caption
    const ref = createComponent(entry.component, { hostElement: host, environmentInjector: envInjector })
    if (entry.inputs) {
      for (const [key, value] of Object.entries(entry.inputs)) ref.setInput(key, value)
    }
    appRef.attachView(ref.hostView)
    ref.changeDetectorRef.detectChanges()
    host.dataset['mounted'] = 'true'
    refs.push(ref)
  })

  return refs
}
