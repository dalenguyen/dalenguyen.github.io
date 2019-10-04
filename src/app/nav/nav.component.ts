import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { NavService } from '../shared/services/nav.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit {

  activeEl = 'intro';

  constructor(private navService: NavService, private router: Router) { }

  ngOnInit() {
    this.navService.target.subscribe(id => {
      // Set active nav element
      this.activeEl = id as string;
    });
  }

  scroll(id: string) {
    console.log(this.router.url)
    if (this.router.url !== '/') {
      this.router.navigate(['']);
      setTimeout(() => {
        this.navService.target.next(id);
      }, 1000);
    } else {
      this.navService.target.next(id);
    }
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  isActive(id: string) {
    if (id === this.activeEl) { return 'active'; }
  }
}
