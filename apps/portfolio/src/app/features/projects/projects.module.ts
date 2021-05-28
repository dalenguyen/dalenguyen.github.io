import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectsRoutingModule } from './projects-routing.module';
import { MapService } from './services/map.service';
import { MapboxComponent } from './containers/mapbox/mapbox.component';
import { LeafletComponent } from './containers/leaflet/leaflet.component';
import { CountryDetailComponent } from './components/country-detail/country-detail.component';
import { ProjectsComponent } from './containers/projects/projects.component';


@NgModule({
  declarations: [MapboxComponent, LeafletComponent, CountryDetailComponent, ProjectsComponent],
  imports: [
    CommonModule,
    ProjectsRoutingModule,
  ],
  providers: [MapService]
})
export class ProjectsModule { }
