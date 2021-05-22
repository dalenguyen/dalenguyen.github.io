import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { NavService } from '../../services/nav.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent implements OnInit {
  activeEl = 'intro';

  constructor(private navService: NavService, private router: Router) {}

  ngOnInit() {
    // Set active nav by path
    const currentPath = window.location.pathname.split('/')[1];
    if (currentPath !== '') {
      this.activeEl = currentPath;
    }
  }

  scroll(id: string) {
    // TODO: figured out how to navigate on mobile
    this.activeEl = id;
    if (this.router.url !== '/') {
      this.router.navigate(['']);
      setTimeout(() => {
        this.navService.scroll(id);
        this.navService.target.next(null);
      }, 1000);
    } else {
      this.navService.scroll(id);
      this.navService.target.next(null);
    }
  }

  navigateTo(path: string) {
    this.activeEl = 'blog';
    this.router.navigate([path]);
    this.navService.target.next(null);
  }

  isActive(id: string) {
    if (id === this.activeEl) {
      return 'active';
    }
    return '';
  }
}
