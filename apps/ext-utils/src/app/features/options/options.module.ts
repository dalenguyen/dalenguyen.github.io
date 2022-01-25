import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OptionsRoutingModule } from './options-routing.module';
import { OptionsComponent } from './options.component';


@NgModule({
  declarations: [
    OptionsComponent
  ],
  imports: [
    CommonModule,
    OptionsRoutingModule
  ]
})
export class OptionsModule { }
