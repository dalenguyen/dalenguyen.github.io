import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { captureException } from '@sentry/core'
import { Observable } from 'rxjs'
import {
  // publishReplay,
  // refCount,
  catchError,
  map,
  shareReplay,
} from 'rxjs/operators'

interface GitProject {
  name: string
  description: string
  html_url: string
  language: string
  stargazers_count: number
  forks: number
}

@Injectable()
export class PortfolioService {
  private http = inject(HttpClient)
  gitBaseUrl = 'https://api.github.com/users/dalenguyen/repos?per_page=100'
  gitProjects = [
    'rest-api-node-typescript',
    'firestore-backup-restore',
    'firebase-wordpress-plugin',
    'serverless-rest-api',
    'firebase-functions-helper',
    'stockai',
    // 'WebdriverIO-TypeScript-Boilerplate',
    // 'angular-store-locator'
  ]

  projects$: Observable<GitProject[]> = this.http.get<GitProject[]>(this.gitBaseUrl).pipe(
    map((projects) => projects.filter((project) => this.gitProjects.includes(project.name))),
    // publishReplay(1),
    // refCount(),
    shareReplay({ bufferSize: 1, refCount: true }),
    catchError((error) => captureException(error)),
  ) as Observable<GitProject[]>
}
