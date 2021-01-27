import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapboxComponent } from './mapbox/mapbox.component';
import { ProjectsRoutingModule } from './projects-routing.module'


@NgModule({
  declarations: [MapboxComponent],
  imports: [
    CommonModule,
    ProjectsRoutingModule,
  ]
})
export class ProjectsModule { }
