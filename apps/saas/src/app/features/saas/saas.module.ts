import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { PricingTableModule } from '@dalenguyen/saas-libs'
import { ProductsComponent } from './products/products.component'
import { SaasRoutingModule } from './saas-routing.module'
import { SaasComponent } from './saas.component'

@NgModule({
  declarations: [SaasComponent, ProductsComponent],
  imports: [CommonModule, PricingTableModule, SaasRoutingModule],
})
export class SaasModule {}
