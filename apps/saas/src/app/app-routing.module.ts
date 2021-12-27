import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { AppComponent } from './app.component'

const routes: Routes = [
  { path: '', component: AppComponent },
  { path: 'saas', loadChildren: () => import('./features/saas/saas.module').then((m) => m.SaasModule) },
  { path: 'forms', loadChildren: () => import('./features/forms/ng-forms.module').then((m) => m.NgFormsModule) },
  { path: 'onboarding', loadChildren: () => import('./features/forms/onboarding/onboarding.module').then(m => m.OnboardingModule) },
  { path: 'forms', loadChildren: () => import('./features/forms/ng-forms.module').then(m => m.NgFormsModule) },
  { path: 'saas', loadChildren: () => import('./features/saas/saas.module').then(m => m.SaasModule) },
  { path: '**', redirectTo: '' },
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      onSameUrlNavigation: 'reload',
      initialNavigation: 'enabled',
      relativeLinkResolution: 'legacy',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
