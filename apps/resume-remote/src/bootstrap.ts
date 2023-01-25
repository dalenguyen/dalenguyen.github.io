import { bootstrapApplication } from '@angular/platform-browser'
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router'
import ResumeComponent from '@dalenguyen/portfolio/resume/feature'
import { appRoutes } from './app/app.routes'

bootstrapApplication(ResumeComponent, {
  providers: [provideRouter(appRoutes, withEnabledBlockingInitialNavigation())],
})
