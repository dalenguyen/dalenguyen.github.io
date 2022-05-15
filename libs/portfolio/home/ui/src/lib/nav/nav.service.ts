import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class NavService {
  target = new Subject()

  constructor() {
    // for navigating from Let's meet in the intro part
    this.target.subscribe((id) => {
      if (id != null) {
        this.scroll(id as string)
      }
    })
  }

  public scroll(id: string) {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }
}
