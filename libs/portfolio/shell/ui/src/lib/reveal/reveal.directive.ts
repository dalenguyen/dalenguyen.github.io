import { afterNextRender, DestroyRef, Directive, ElementRef, inject } from '@angular/core'

/**
 * Scroll-reveal as progressive enhancement. The server/no-JS render is fully
 * visible; in the browser this defers only below-the-fold elements, fading them
 * up as they enter the viewport. Above-the-fold content is left untouched (no
 * flicker), and `prefers-reduced-motion` disables the effect entirely.
 *
 * `afterNextRender` only runs in the browser, so no platform guard is needed.
 */
@Directive({
  selector: '[dalReveal]',
  standalone: true,
})
export class RevealDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly destroyRef = inject(DestroyRef)

  constructor() {
    afterNextRender(() => {
      const node = this.el.nativeElement
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReduced || !('IntersectionObserver' in window)) return

      // Leave content that's already on screen visible; only animate what the
      // reader will scroll to.
      if (node.getBoundingClientRect().top < window.innerHeight * 0.9) return

      node.classList.add('reveal')
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              node.classList.add('is-visible')
              observer.unobserve(node)
            }
          }
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
      )
      observer.observe(node)
      this.destroyRef.onDestroy(() => observer.disconnect())
    })
  }
}
