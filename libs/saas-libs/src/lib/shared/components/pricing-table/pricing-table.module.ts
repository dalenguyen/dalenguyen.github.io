import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { PricingTableComponent } from './pricing-table.component'

@NgModule({
  declarations: [PricingTableComponent],
  imports: [CommonModule],
  exports: [PricingTableComponent],
})
export class PricingTableModule {}
