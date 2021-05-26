# Angular SAAS Libs (>= Angular v12)

Components for building your Angular SaaS application.

Demo: https://angular-saas.stackblitz.io

## Installing

```
npm i @dalenguyen/saas-libs
```

## Import Saas Libs Module

```
import { SaasLibsModule } from '@dalenguyen/saas-libs'

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, SaasLibsModule],
  bootstrap: [AppComponent],
})
export class AppModule {}

```

## Pricing Table Component

```javascript
// app.component.html
<dalenguyen-pricing-table [plans]="plans" (selectedPlan)="onSelectedPlan($event)"></dalenguyen-pricing-table>

// app.component.ts
import { Plan } from '@dalenguyen/saas-libs'

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
```

## Notes

- This is an ongoing project. If you have any requests to create any SAAS components, feel free to create a ticket.
