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
    console.log('NavService - constructor')
    afterNextRender(() => {
      console.log('NavService - afterRender')
      // for navigating from Let's meet in the intro part
      this.target.subscribe((id) => {
        console.log('id', id)
        if (id != null) {
          this.scroll(id as string)
        }
      })
    })
  }

  public scroll(id: string) {
    console.log('NavService - scroll', id)
    const el = this.window?.document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }
}
