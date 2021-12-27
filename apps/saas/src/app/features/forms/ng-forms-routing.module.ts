import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { NgFormsComponent } from './ng-forms.component'

const routes: Routes = [
  { path: '', component: NgFormsComponent },
  {
    path: 'onboarding',
    loadChildren: () => import('./onboarding/onboarding.module').then((m) => m.OnboardingModule),
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NgFormsRoutingModule {}
