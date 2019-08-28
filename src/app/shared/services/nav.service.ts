import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavService {

  target = new Subject();

  constructor() {
    this.target.subscribe( id => {
      this.scroll(id as string);
    });
  }

  private scroll(id: string) {
    const el = document.getElementById(id);
    el.scrollIntoView({behavior: 'smooth'});
  }
}
