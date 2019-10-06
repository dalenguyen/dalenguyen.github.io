import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { captureException } from '@sentry/core';

@Injectable({
  providedIn: 'root'
})
export class PostService {

  devBaseUrl = 'https://dev.to/api/articles/'

  constructor(private http: HttpClient) { }

  async getDevArticle(articleId: string) {
    let article = null;
    try {
      article = await this.http.get(`${this.devBaseUrl}/${articleId}`).toPromise()
      console.log('article', article)
    } catch (error) {
      captureException(error)
      console.error(error)
    }
    return article;
  }
}
