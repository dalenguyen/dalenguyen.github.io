import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { PricingTableModule } from '@dalenguyen/saas-libs'

@NgModule({
  declarations: [],
  imports: [CommonModule, PricingTableModule],
  exports: [PricingTableModule],
})
export class SaasModule {}
