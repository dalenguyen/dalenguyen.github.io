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

  gitBaseUrl = 'https://api.github.com/users/dalenguyen/repos?per_page=100';

  constructor(private http: HttpClient) {}

  async getGitProjects() {
    const projects = await this.http.get(this.gitBaseUrl).toPromise() as GitProject[];
    const filteredProjects = [];
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
    return filteredProjects;
  }
}
