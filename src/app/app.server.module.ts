import { NgModule } from '@angular/core'
import { ServerModule } from '@angular/platform-server'
import { ModuleMapLoaderModule } from '@nguniversal/module-map-ngfactory-loader'

import { AppModule } from './app.module'
import { AppComponent } from './app.component'
import { BrowserModule } from '@angular/platform-browser'

@NgModule({
  imports: [
    AppModule,
    ServerModule,
    ModuleMapLoaderModule,
    BrowserModule.withServerTransition({ appId: 'app-root' })
  ],
  providers: [
    // Add universal-only providers here
  ],
  bootstrap: [AppComponent]
})
export class AppServerModule {}
