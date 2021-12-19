import { Component } from '@angular/core'
import { PortfolioService } from '../../shared/services/portfolio.service'

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss'],
})
export class PortfolioComponent {
  constructor(public portfolioService: PortfolioService) {}
}
