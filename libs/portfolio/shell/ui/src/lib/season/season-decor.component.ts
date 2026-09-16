import { NgComponentOutlet } from '@angular/common'
import { ChangeDetectionStrategy, Component, effect, inject, signal, Type } from '@angular/core'
import { SeasonService } from './season.service'

/** What a season's `index.ts` default-exports. */
export interface SeasonTheme {
  /** Ambient effect layer. Lazy — loaded only while that season is running. */
  effects?: Type<unknown>
}

// Auto-discover every season's theme entry. Adding a season means adding a
// folder under themes/ — there is no registry to edit here. Same idiom as
// apps/blog-app/src/app/blog/charts/mount-charts.ts.
const themes = import.meta.glob<{ default: SeasonTheme }>('./themes/*/index.ts')

/**
 * Mounts the active season's decorative layer, or nothing at all.
 *
 * Nothing renders on the server, and nothing renders on the client's first
 * (hydration) pass either — `SeasonService.season` stays null until
 * `afterNextRender`, so SSR output and hydration agree and no mismatch is
 * possible. The decorations appear a beat after the page is interactive, which
 * is the right trade: they are ornament, not content.
 *
 * Only this ~40-line shell is in the main bundle. Each season's artwork and
 * animation live behind the glob above, so out of season nothing is fetched.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-season-decor',
  standalone: true,
  imports: [NgComponentOutlet],
  template: `
    @if (effects(); as cmp) {
      <ng-container *ngComponentOutlet="cmp" />
    }
  `,
})
export class SeasonDecorComponent {
  private readonly seasons = inject(SeasonService)

  protected readonly effects = signal<Type<unknown> | null>(null)

  constructor() {
    effect(() => {
      const id = this.seasons.season()
      if (id) void this.load(id)
    })
  }

  private async load(id: string): Promise<void> {
    const loader = themes[`./themes/${id}/index.ts`]
    if (!loader) return // a season with tokens but no decorations is fine
    this.effects.set((await loader()).default?.effects ?? null)
  }
}
