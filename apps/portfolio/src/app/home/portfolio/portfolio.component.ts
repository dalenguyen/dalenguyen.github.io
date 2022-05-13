import { CommonModule } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { PortfolioService } from '../../shared/services/portfolio.service'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-portfolio',
  imports: [HttpClientModule, CommonModule],
  standalone: true,
  providers: [PortfolioService],
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss'],
})
export class PortfolioComponent {
  constructor(public portfolioService: PortfolioService) {}
}
