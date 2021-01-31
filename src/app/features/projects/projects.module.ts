import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapboxComponent } from './mapbox/mapbox.component';
import { ProjectsRoutingModule } from './projects-routing.module';
import { LeafletComponent } from './leaflet/leaflet.component'
import { MapService } from './services/map.service';


@NgModule({
  declarations: [MapboxComponent, LeafletComponent],
  imports: [
    CommonModule,
    ProjectsRoutingModule,
  ],
  providers: [MapService]
})
export class ProjectsModule { }
