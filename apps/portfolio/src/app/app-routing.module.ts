import { Routes } from '@angular/router'

export const APP_ROUTES: Routes = [
  { path: '', loadComponent: () => import('@dalenguyen/portfolio/home/feature').then((m) => m.HomeComponent) },
  { path: 'resume', loadComponent: () => import('./resume/resume.component').then((m) => m.ResumeComponent) },
  { path: 'blog', loadChildren: () => import('./features/blog/blog.module').then((m) => m.BlogModule) },
  { path: 'projects', loadChildren: () => import('./features/projects/projects.module').then((m) => m.ProjectsModule) },
  { path: '**', redirectTo: '' },
]
