import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapboxComponent } from './mapbox/mapbox.component';
import { ProjectsRoutingModule } from './projects-routing.module';
import { LeafletComponent } from './leaflet/leaflet.component'


@NgModule({
  declarations: [MapboxComponent, LeafletComponent],
  imports: [
    CommonModule,
    ProjectsRoutingModule,
  ]
})
export class ProjectsModule { }
