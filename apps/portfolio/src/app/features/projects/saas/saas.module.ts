import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { SaasRoutingModule } from './saas-routing.module'
import { SaasComponent } from './containers/saas/saas.component'
import { SaasLibsModule } from './shared/modules/saas-libs.module';
import { PricingTableComponent } from './components/pricing-table/pricing-table.component'

@NgModule({
  declarations: [SaasComponent, PricingTableComponent],
  imports: [CommonModule, SaasLibsModule, SaasRoutingModule],
})
export class SaasModule {}
