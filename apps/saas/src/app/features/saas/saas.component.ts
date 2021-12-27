import { Component } from '@angular/core'
import { Plan } from '@dalenguyen/saas-libs'

@Component({
  selector: 'dalenguyen-saas',
  templateUrl: './saas.component.html',
  styleUrls: ['./saas.component.css'],
})
export class SaasComponent {
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

  onSelectedPlan($event: unknown) {
    console.log($event)
  }
}
