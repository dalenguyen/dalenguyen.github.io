import { BrowserModule } from '@angular/platform-browser'
import { NgModule, Injectable, ErrorHandler } from '@angular/core'

import { HttpClientModule } from '@angular/common/http'
import { AppRoutingModule } from './app-routing.module'
import { MaterialModule } from './shared/modules/material.module'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import * as Sentry from '@sentry/browser'
import { RewriteFrames } from '@sentry/integrations'

import { environment } from 'src/environments/environment'

import { AppComponent } from './app.component'
import { NavComponent } from './nav/nav.component'
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

Sentry.init({
  dsn: 'https://3151dbdf068e4196907c2a61f2ec9e1b@sentry.io/1766223',
  release: `dalenguyen-me@${environment.gitHash}`,
  integrations: [new RewriteFrames()]
})

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  constructor() {}
  handleError(error) {
    // const eventId = Sentry.captureException(error.originalError || error)
    console.error(error)
    // Sentry.showReportDialog({ eventId });
  }
}

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    HomeComponent,
    IntroComponent,
    PortfolioComponent,
    BiographyComponent,
    ContactComponent,
    FooterComponent,
    ResumeComponent,
    BlogComponent,
    PostComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MaterialModule,
    HttpClientModule
  ],
  providers: [
    { provide: ErrorHandler, useClass: SentryErrorHandler },
    PostGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
