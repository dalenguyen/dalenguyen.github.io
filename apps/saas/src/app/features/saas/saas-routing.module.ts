import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SaasComponent } from './saas.component';

const routes: Routes = [{ path: '', component: SaasComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SaasRoutingModule { }
