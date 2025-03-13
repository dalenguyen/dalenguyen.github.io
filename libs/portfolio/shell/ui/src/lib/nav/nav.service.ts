import { afterNextRender, inject, Injectable } from '@angular/core'
import { WINDOW } from '@dalenguyen/angular'
import { Subject } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class NavService {
  public readonly target = new Subject()
  private readonly window = inject(WINDOW)

  constructor() {
    afterNextRender(() => {
      // for navigating from Let's meet in the intro part
      this.target.subscribe((id) => {
        if (id != null) {
          this.scroll(id as string)
        }
      })
    })
  }

  public scroll(id: string) {
    const el = this.window?.document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }
}
