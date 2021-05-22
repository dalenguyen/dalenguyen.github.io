import { NgModule } from '@angular/core'
import { ServerModule } from '@angular/platform-server'

import { AppModule } from './app.module'
import { AppComponent } from './app.component'
import { BrowserModule } from '@angular/platform-browser'

@NgModule({
  imports: [
    AppModule,
    ServerModule,
    BrowserModule.withServerTransition({ appId: 'app-root' })
],
  providers: [
    // Add universal-only providers here
  ],
  bootstrap: [AppComponent]
})
export class AppServerModule {}
