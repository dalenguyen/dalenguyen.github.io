import { BrowserModule } from '@angular/platform-browser'
import { NgModule, Injectable, ErrorHandler, Inject, PLATFORM_ID, APP_ID } from '@angular/core'

import { HttpClientModule } from '@angular/common/http'
import { AppRoutingModule } from './app-routing.module'
import { MaterialModule } from './shared/modules/material.module'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import * as Sentry from '@sentry/browser'
import { RewriteFrames } from '@sentry/integrations'

import { AppComponent } from './app.component'
import { HomeComponent } from './home/home.component'
import { BlogComponent } from './blog/blog.component'
import { PostComponent } from './blog/post/post.component'
import { ResumeComponent } from './resume/resume.component'
import { IntroComponent } from './home/intro/intro.component'
import { ContactComponent } from './home/contact/contact.component'
import { BiographyComponent } from './home/biography/biography.component'
import { PortfolioComponent } from './home/portfolio/portfolio.component'
import { FooterComponent } from './shared/components/footer/footer.component'

import { PostGuard } from './blog/post/post.guard'
import { isPlatformBrowser } from '@angular/common'
import { NavComponent } from './shared/components/nav/nav.component'
import { environment } from '../environments/environment'

Sentry.init({
  dsn: 'https://3151dbdf068e4196907c2a61f2ec9e1b@sentry.io/1766223',
  release: `dalenguyen-me@${environment.gitHash}`,
  integrations: [new RewriteFrames()],
})

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  constructor() {}
  handleError(error) {
    const eventId = Sentry.captureException(error.originalError || error)
    console.error(error)
    // Sentry.showReportDialog({ eventId });
  }
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    IntroComponent,
    PortfolioComponent,
    BiographyComponent,
    ContactComponent,
    FooterComponent,
    NavComponent,
    ResumeComponent,
    BlogComponent,
    PostComponent,
  ],
  imports: [BrowserModule, BrowserAnimationsModule, AppRoutingModule, MaterialModule, HttpClientModule],
  providers: [{ provide: ErrorHandler, useClass: SentryErrorHandler }, PostGuard],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(@Inject(PLATFORM_ID) private platformId: Object, @Inject(APP_ID) private appId: string) {
    const platform = isPlatformBrowser(platformId) ? 'in the browser' : 'on the server'
    console.log(`Running ${platform} with appId=${appId}`)
  }
}
