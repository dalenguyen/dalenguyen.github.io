import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injectable, ErrorHandler } from '@angular/core';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MaterialModule } from './shared/modules/material.module';
import { NavComponent } from './nav/nav.component';
import { HomeComponent } from './home/home.component';
import { IntroComponent } from './home/intro/intro.component';
import { PortfolioComponent } from './home/portfolio/portfolio.component';
import { BiographyComponent } from './home/biography/biography.component';
import { ContactComponent } from './home/contact/contact.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { HttpClientModule } from '@angular/common/http';
import { ResumeComponent } from './resume/resume.component';

import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: 'https://3151dbdf068e4196907c2a61f2ec9e1b@sentry.io/1766223'
});

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  constructor() {}
  handleError(error) {
    const eventId = Sentry.captureException(error.originalError || error);
    Sentry.showReportDialog({ eventId });
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
    ResumeComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MaterialModule,
    HttpClientModule
  ],
  providers: [{ provide: ErrorHandler, useClass: SentryErrorHandler }],
  bootstrap: [AppComponent]
})

export class AppModule { }
