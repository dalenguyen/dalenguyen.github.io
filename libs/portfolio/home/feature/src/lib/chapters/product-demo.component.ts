import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core'

export type DemoKind = 'xoai' | 'codemagpie' | 'logichat'

/** Number of steps in each demo. The demo shows steps 1..step, then loops. */
const STEPS: Record<DemoKind, number> = { xoai: 4, codemagpie: 5, logichat: 5 }

/**
 * A short looping animation that shows what a product does: a watch that
 * answers, a PR that gets reviewed, a chat that gets answered. Each step
 * appears 1.4 s after the one before. With reduced motion, all steps show.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-product-demo',
  host: { 'aria-hidden': 'true', class: 'block' },
  template: `
    @switch (kind()) { @case ('xoai') {
    <div
      class="mx-auto flex h-72 w-60 flex-col rounded-[2.5rem] border-4 border-border bg-surface/90 p-5 shadow-glow backdrop-blur"
    >
      <p class="text-center font-mono text-xs text-fg-muted">10:09</p>
      @if (step() >= 1) {
      <div class="mt-4 flex h-10 items-center justify-center gap-1.5 animate-fade-up">
        @for (bar of bars; track $index) {
        <span
          class="w-1.5 rounded-full bg-accent motion-safe:animate-pulse"
          [style.height.%]="bar"
          [style.animation-delay.ms]="$index * 120"
        ></span>
        }
      </div>
      } @if (step() >= 2) {
      <p class="mt-4 self-end rounded-2xl rounded-br-sm bg-surface-2 px-3 py-2 text-sm text-fg animate-fade-up">
        Will it rain at 5?
      </p>
      } @if (step() >= 3) {
      <p class="mt-3 rounded-2xl rounded-bl-sm bg-accent/15 px-3 py-2 text-sm text-fg animate-fade-up">
        Light rain after 6. You're fine at 5.
      </p>
      } @if (step() >= 4) {
      <p class="mt-auto text-center text-xs text-accent animate-fade-up">🔊 Spoken out loud</p>
      }
    </div>
    } @case ('codemagpie') {
    <div
      class="mx-auto w-full max-w-sm rounded-xl border border-border bg-surface/90 p-4 font-mono text-xs shadow-glow backdrop-blur"
    >
      <p class="border-b border-border pb-2 text-fg-muted">#128 Add order export</p>
      @if (step() >= 1) {
      <p class="mt-3 text-fg animate-fade-up"><span class="text-fg-muted">dale:</span> &#64;codemagpie review this</p>
      } @if (step() >= 2) {
      <p class="mt-3 text-fg animate-fade-up">
        <span class="text-accent">codemagpie:</span> 1 bug - <code>order</code> can be null on line 42.
      </p>
      } @if (step() >= 3) {
      <div class="mt-3 overflow-hidden rounded-md border border-border animate-fade-up">
        <p class="bg-red-500/15 px-2 py-1 text-red-500">- const total = order.items.length</p>
        <p class="bg-green-500/15 px-2 py-1 text-green-600">+ const total = order?.items.length ?? 0</p>
      </div>
      } @if (step() >= 4) {
      <p class="mt-3 text-fg animate-fade-up"><span class="text-accent">codemagpie:</span> Fix pushed. Tests pass.</p>
      } @if (step() >= 5) {
      <p class="mt-3 inline-block rounded-full bg-green-500/15 px-2 py-0.5 text-green-600 animate-fade-up">
        ✓ Ready to merge
      </p>
      }
    </div>
    } @case ('logichat') {
    <div
      class="mx-auto flex w-full max-w-sm flex-col gap-3 rounded-xl border border-border bg-surface/90 p-4 text-sm shadow-glow backdrop-blur"
    >
      <p class="border-b border-border pb-2 text-xs font-medium text-fg-muted">Support chat · 2:14 AM</p>
      @if (step() >= 1) {
      <p class="self-end rounded-2xl rounded-br-sm bg-surface-2 px-3 py-2 text-fg animate-fade-up">
        Where is my order?
      </p>
      } @if (step() === 2) {
      <p class="flex gap-1 self-start rounded-2xl bg-accent/15 px-3 py-3">
        @for (d of [0, 1, 2]; track d) {
        <span
          class="h-1.5 w-1.5 rounded-full bg-accent motion-safe:animate-bounce"
          [style.animation-delay.ms]="d * 150"
        ></span>
        }
      </p>
      } @if (step() >= 3) {
      <p class="self-start rounded-2xl rounded-bl-sm bg-accent/15 px-3 py-2 text-fg animate-fade-up">
        It shipped today. It arrives Friday.
      </p>
      } @if (step() >= 4) {
      <p class="self-end rounded-2xl rounded-br-sm bg-surface-2 px-3 py-2 text-fg animate-fade-up">
        Can I change the address?
      </p>
      } @if (step() >= 5) {
      <p class="self-start rounded-2xl rounded-bl-sm bg-accent/15 px-3 py-2 text-fg animate-fade-up">
        Yes. Send me the new one and I'll update it.
      </p>
      }
    </div>
    } }
  `,
})
export class ProductDemoComponent {
  readonly kind = input.required<DemoKind>()
  protected readonly step = signal(0)
  protected readonly bars = [40, 75, 100, 60, 85, 45, 70]

  constructor() {
    const destroyRef = inject(DestroyRef)
    afterNextRender(() => {
      const last = STEPS[this.kind()]
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.step.set(last)
        return
      }
      // Hold the full demo for 3 extra ticks, then start again.
      let tick = 0
      const timer = setInterval(() => {
        tick = (tick + 1) % (last + 4)
        this.step.set(Math.min(tick, last))
      }, 1400)
      destroyRef.onDestroy(() => clearInterval(timer))
    })
  }
}
