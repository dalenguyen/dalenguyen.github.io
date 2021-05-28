import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { PricingTableModule } from './shared/components/'

const MODULES = [PricingTableModule]
@NgModule({
  imports: [CommonModule],
  declarations: [],
  exports: [...MODULES],
})
export class SaasLibsModule {}
