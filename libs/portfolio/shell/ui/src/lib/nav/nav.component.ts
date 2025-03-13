import { CommonModule, Location } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { Router } from '@angular/router'
import { NavService } from './nav.service'
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-nav',
  imports: [CommonModule, MatIconModule],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent implements OnInit {
  private readonly navService = inject(NavService)
  private readonly router = inject(Router)
  private readonly location = inject(Location)

  activeEl = 'intro'

  ngOnInit() {
    // Set active nav by path
    const currentPath = this.location.path().split('/')[1]
    console.log('currentPath', currentPath)
    if (currentPath) {
      this.activeEl = currentPath
    }

    console.log('activeEl', this.activeEl)
  }

  scroll(id: string) {
    // TODO: figured out how to navigate on mobile
    this.activeEl = id
    console.log('scroll - activeEl', this.activeEl)
    if (this.router.url !== '/') {
      this.router.navigate([''])
      setTimeout(() => {
        this.navService.scroll(id)
        this.navService.target.next(null)
      }, 1000)
    } else {
      this.navService.scroll(id)
      this.navService.target.next(null)
    }
  }

  navigateTo(path: string) {
    this.activeEl = 'blog'
    this.router.navigate([path])
    this.navService.target.next(null)
  }

  isActive(id: string) {
    console.log('isActive', id, this.activeEl)
    if (id === this.activeEl) {
      return 'active'
    }
    return ''
  }
}
