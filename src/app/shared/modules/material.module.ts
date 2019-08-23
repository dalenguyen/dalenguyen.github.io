import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatSidenavModule} from '@angular/material/sidenav';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
  ],
  exports: [
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
  ]
})
export class MaterialModule { }
