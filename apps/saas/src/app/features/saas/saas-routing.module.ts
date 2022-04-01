import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { ProductsComponent } from './products/products.component'
import { SaasComponent } from './saas.component'

const routes: Routes = [
  { path: '', component: SaasComponent },
  { path: 'products', component: ProductsComponent },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SaasRoutingModule {}
