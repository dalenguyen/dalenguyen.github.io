import { Injectable } from '@angular/core';
import { captureException } from '@sentry/core';
import { HttpClient } from '@angular/common/http';
import { GitProject } from '../models/git.project';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  get projects() { return this.getGitProjects(); }

  // eTag = '';

  gitProjects = [
    'rest-api-node-typescript',
    'firestore-backup-restore',
    'firebase-wordpress-plugin',
    'serverless-rest-api',
    'firebase-functions-helper',
    'stockai',
    // 'WebdriverIO-TypeScript-Boilerplate',
    // 'angular-store-locator'
  ];

  gitBaseUrl = 'https://api.github.com/users/dalenguyen/repos?per_page=100';

  constructor(private http: HttpClient) { }

  async getGitProjects() {
    // @TODO save eTag to cache or storage for reduce the rate limit
    // console.log('cached', this.eTag);
    // const resp = await this.http.get(this.gitBaseUrl, {observe: 'response'}).toPromise();
    // this.eTag = resp.headers.get('Etag').split('\"')[1];
    // console.log(resp.status);
    // const httpOptions = {
    //   headers: new HttpHeaders({
    //     'If-None-Match': this.eTag,
    //   })
    // };
    // console.log(httpOptions);
    const filteredProjects = [];
    try {
      const projects = await this.http.get(this.gitBaseUrl).toPromise() as GitProject[];
      for (const project of projects) {
        if (this.gitProjects.includes(project.name)) {
          const mappedProject: GitProject = {
            name: project.name,
            description: project.description,
            html_url: project.html_url,
            language: project.language,
            stargazers_count: project.stargazers_count,
            forks: project.forks
          };
          filteredProjects.push(mappedProject);
        }
      }
    } catch (error) {
      captureException(error)
      console.error(error);
    }

    return filteredProjects;
  }
}
