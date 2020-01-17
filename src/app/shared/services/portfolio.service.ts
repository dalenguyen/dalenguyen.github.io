import { Injectable } from '@angular/core'
import { captureException } from '@sentry/core'
import { HttpClient } from '@angular/common/http'
import { GitProject } from '../models/git.project'
import { Observable, of } from 'rxjs'
import { map, publishReplay, refCount, catchError } from 'rxjs/operators'

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
    this.projects$ = this.getGitProjects()
  }

  getGitProjects(): Observable<GitProject[]> {
    if (!this.projects$) {
      this.projects$ = this.http.get<GitProject[]>(this.gitBaseUrl).pipe(
        map(projects =>
          projects.filter(project => this.gitProjects.includes(project.name))
        ),
        publishReplay(1),
        refCount(),
        catchError(error => captureException(error))
      ) as Observable<GitProject[]>
    }
    return this.projects$
  }

  clearCache() {
    this.projects$ = of([])
  }
}
