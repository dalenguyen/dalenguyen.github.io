import { Component, OnInit } from '@angular/core'
import { Plan } from '@dalenguyen/saas-libs'

@Component({
  selector: 'app-pricing-table',
  templateUrl: './pricing-table.component.html',
  styleUrls: ['./pricing-table.component.scss'],
})
export class PricingTableComponent implements OnInit {
  plans: Plan[] = [
    {
      currency: '$',
      price: 29,
      title: 'Freelance',
      period: 'mo',
      features: ['1 GB of space', 'Support at $25/hour', 'Limited cloud access'],
      cta: 'Choose plan',
      isFeature: false,
    },
    {
      currency: '$',
      price: 59,
      title: 'Business',
      period: 'mo',
      features: ['5 GB of space', 'Support at $5/hour', 'Full cloud access'],
      cta: 'Choose plan',
      isFeature: true,
    },
    {
      currency: '$',
      price: 99,
      title: 'Enterprise',
      period: 'mo',
      features: ['10 GB of space', 'Support at $25/hour', 'Limited cloud access'],
      cta: 'Choose plan',
      isFeature: false,
    },
  ]

  constructor() {}

  ngOnInit(): void {}

  onSelectedPlan($event: unknown) {
    console.log($event)
  }
}
