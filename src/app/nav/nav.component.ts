import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  scroll(id: string) {
    console.log(`scrolling to ${id}`);
    const el = document.getElementById(id);
    el.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'nearest'});
  }

}
