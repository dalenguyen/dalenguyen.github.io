import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { PricingTableComponent } from './shared/components'

const COMPONENTS = [PricingTableComponent]
@NgModule({
  imports: [CommonModule],
  declarations: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class SaasLibsModule {}
