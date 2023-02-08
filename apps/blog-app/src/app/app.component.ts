import { Component } from '@angular/core'
import { RouterLink, RouterOutlet } from '@angular/router'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <!-- <a routerLink="/">Home</a> | <a routerLink="/blog">Blog</a> | <a routerLink="/about">About</a> |
    <a routerLink="/contact">Contact</a>

    <br /> -->

    <router-outlet></router-outlet>
  `,
})
export class AppComponent {}
