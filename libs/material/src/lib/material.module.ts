import { NgModule } from '@angular/core'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatSidenavModule } from '@angular/material/sidenav'

const MATERIAL_MODULES = [MatButtonModule, MatIconModule, MatSidenavModule, MatGridListModule, MatCardModule]

@NgModule({
  imports: [MATERIAL_MODULES],
  exports: [MATERIAL_MODULES],
})
export class MaterialModule {}
