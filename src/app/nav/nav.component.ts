import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit {

  @Output() scrolled = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  scroll(id: string) {
    console.log(`scrolling to ${id}`);
    const el = document.getElementById(id);
    el.scrollIntoView({behavior: 'smooth'});

    setTimeout(() => {
      this.scrolled.emit(null);
    }, 500);
  }

}
