import { Component, HostListener } from '@angular/core'
// import { MatGridList } from '@angular/material/grid-list'

import { PortfolioService } from 'src/app/shared/services/portfolio.service'
// import { GitProject } from 'src/app/shared/models/git.project'

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss']
})
export class PortfolioComponent {
  // watcher: Subscription
  cols = 4

  @HostListener('window:resize', [])
  private onResize() {
    const screenSize = window.innerWidth
    if (screenSize > 1450) {
      this.cols = 4
    } else if (screenSize <= 1450 && screenSize > 1280) {
      this.cols = 3
    } else if (screenSize <= 1280 && screenSize > 980) {
      this.cols = 2
    } else {
      this.cols = 1
    }
  }

  // @ViewChild('grid') grid: MatGridList

  constructor(public portfolioService: PortfolioService) {
    this.onResize()
  }
}
