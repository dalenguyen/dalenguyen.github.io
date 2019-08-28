import { Component, OnInit } from '@angular/core';
import { NavService } from '../shared/services/nav.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit {

  activeEl = 'intro';

  constructor(private navService: NavService) { }

  ngOnInit() {
    this.navService.target.subscribe(id => {
      // Set active nav element
      this.activeEl = id as string;
    });
  }

  scroll(id: string) {
    this.navService.target.next(id);
  }

  isActive(id: string) {
    if (id === this.activeEl) { return 'active'; }
  }
}
