import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'

import { Observable } from 'rxjs'
import { captureException } from '@sentry/core'
import { map, publishReplay, refCount, catchError } from 'rxjs/operators'

import { GitProject } from '../models/git.project'

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  projects$: Observable<GitProject[]>

  gitProjects = [
    'rest-api-node-typescript',
    'firestore-backup-restore',
    'firebase-wordpress-plugin',
    'serverless-rest-api',
    'firebase-functions-helper',
    'stockai'
    // 'WebdriverIO-TypeScript-Boilerplate',
    // 'angular-store-locator'
  ]

  gitBaseUrl = 'https://api.github.com/users/dalenguyen/repos?per_page=100'

  constructor(private http: HttpClient) {
    this.getGitProjects()
  }

  getGitProjects(): void {
    this.projects$ = this.http.get<GitProject[]>(this.gitBaseUrl).pipe(
      map(projects =>
        projects.filter(project => this.gitProjects.includes(project.name))
      ),
      publishReplay(1),
      refCount(),
      catchError(error => captureException(error))
    ) as Observable<GitProject[]>
  }
}
