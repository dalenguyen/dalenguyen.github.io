import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { PricingTableModule } from '@dalenguyen/saas-libs'
import { SaasRoutingModule } from './saas-routing.module'
import { SaasComponent } from './saas.component'

@NgModule({
  declarations: [SaasComponent],
  imports: [CommonModule, PricingTableModule, SaasRoutingModule],
})
export class SaasModule {}
