import { Routes } from '@angular/router'
import { ResumeComponent } from './resume/resume.component'

export const APP_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent) },
  { path: 'resume', component: ResumeComponent },
  { path: 'blog', loadChildren: () => import('./features/blog/blog.module').then((m) => m.BlogModule) },
  { path: 'projects', loadChildren: () => import('./features/projects/projects.module').then((m) => m.ProjectsModule) },
  { path: '**', redirectTo: '' },
]
