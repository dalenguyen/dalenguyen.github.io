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

  constructor(private navService: NavService, private router: Router) {

  }

  ngOnInit() {
    console.log(this.router.url)
    // this.navService.target.subscribe(id => {
    //   // Set active nav element
    //   this.activeEl = id as string;
    // });
  }

  scroll(id: string) {
    // this.activeEl = id
    // if (this.router.url !== '/') {
    //   this.router.navigate(['']);
    //   setTimeout(() => {
    //     this.navService.target.next(id);
    //   }, 1000);
    // } else {
    //   this.navService.target.next(id);
    // }
    // TODO: figured out how to navigate on mobile
    this.activeEl = id
    if (this.router.url !== '/') {
      this.router.navigate(['']);
      setTimeout(() => {
        this.navService.scroll(id);
      }, 500);
    } else {
      this.navService.scroll(id);
    }
    this.navService.target.next(null);
  }

  navigateTo(path: string) {
    this.activeEl = 'blog'
    this.router.navigate([path]);
    this.navService.target.next(null);
  }

  isActive(id: string) {
    if (id === this.activeEl) { return 'active'; }
  }
}
