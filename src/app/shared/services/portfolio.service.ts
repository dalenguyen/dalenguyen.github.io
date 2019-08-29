import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs/internal/observable/of';
import { GitProject } from '../models/git.project';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  get projects() {return this.getGitProjects(); }

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

  gitBaseUrl = 'https://api.github.com/repos/dalenguyen/';

  constructor(private http: HttpClient) {}

  async getGitProjects() {
    const projects = [];
    for (const element of this.gitProjects) {
      const project = await this.http.get(this.gitBaseUrl + element).toPromise() as any;
      const mappedProject: GitProject = {
        title: project.name,
        description: project.description,
        url: project.html_url,
        language: project.language,
        star: project.stargazers_count,
        fork: project.forks
      };
      projects.push(mappedProject);
    }

    return projects;
  }
}
