import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { AppComponent } from './app.component'
import { Guard } from './shared/guard'

const routes: Routes = [
  // { path: '', component: AppComponent },
  // nx g m --name=options --module=app-routing --route=options --routing
  { path: 'options', loadChildren: () => import('./features/options/options.module').then((m) => m.OptionsModule) },
  { path: '**', component: AppComponent, canActivate: [Guard] },
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
