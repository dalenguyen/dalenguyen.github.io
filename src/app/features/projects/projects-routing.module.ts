import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { LeafletComponent } from './containers/leaflet/leaflet.component'
import { MapboxComponent } from './containers/mapbox/mapbox.component'

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
  {
    path: 'leaflet',
    component: LeafletComponent,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectsRoutingModule {}
