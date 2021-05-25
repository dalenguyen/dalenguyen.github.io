import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'

import { AppComponent } from './app.component'
import { RouterModule } from '@angular/router'

import { SaasLibsModule } from '@dalenguyen/saas-libs'

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, SaasLibsModule, RouterModule.forRoot([], { initialNavigation: 'enabled' })],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
