import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

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

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    HomeComponent,
    IntroComponent,
    PortfolioComponent,
    BiographyComponent,
    ContactComponent,
    FooterComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MaterialModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
