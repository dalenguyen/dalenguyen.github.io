import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { captureException } from '@sentry/core';

@Injectable({
  providedIn: 'root'
})
export class BlogService {

  devBaseUrl = 'https://dev.to/api/articles?username=dalenguyen'

  get articles() { return this.getDevArticles(); }

  constructor(private http: HttpClient) { }

  async getDevArticles() {
    let articles: any = [];
    try {
      articles = await this.http.get(this.devBaseUrl).toPromise()
    } catch (error) {
      captureException(error)
      console.error(error)
    }

    return articles;
  }


}
