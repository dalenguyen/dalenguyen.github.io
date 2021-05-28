import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { LeafletComponent } from './containers/leaflet/leaflet.component'
import { MapboxComponent } from './containers/mapbox/mapbox.component'
import { ProjectsComponent } from './containers/projects/projects.component'

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: ProjectsComponent,
    redirectTo: 'saas',
  },
  {
    path: 'mapbox',
    component: MapboxComponent,
  },
  {
    path: 'leaflet',
    component: LeafletComponent,
  },
  {
    path: 'saas',
    loadChildren: () => import('./saas/saas.module').then((m) => m.SaasModule),
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectsRoutingModule {}
