import { Route } from '@angular/router'

export const remoteRoutes: Route[] = [{ path: '', loadComponent: () => import('@dalenguyen/portfolio/resume/feature') }]
