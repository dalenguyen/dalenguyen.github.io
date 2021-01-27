import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { MapboxComponent } from './mapbox/mapbox.component'

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'mapbox'
  },
  {
    path: 'mapbox',
    component: MapboxComponent,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectsRoutingModule {}
