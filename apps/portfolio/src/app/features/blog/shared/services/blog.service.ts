import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'

import Butter from 'buttercms'

import { captureException } from '@sentry/core'
import { Article } from '../models'
import { environment } from 'apps/portfolio/src/environments/environment'

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  devBaseUrl = 'https://dev.to/api/articles?username=dalenguyen'
  butterService

  currentArticle: Article

  get articles() {
    return this.getDevArticles()
  }

  constructor(private http: HttpClient) {
    this.butterService = Butter(environment.butterCMSToken)
  }

  async getDevArticles() {
    let articles: any = []
    try {
      articles = await this.http.get(this.devBaseUrl).toPromise()
    } catch (error) {
      captureException(error)
      console.error(error)
    }

    return articles
  }

  getButterArticles(): Promise<Article[]> {
    return this.butterService.post
      .list({
        page: 1,
        page_size: 10,
        exclude_body: true,
      })
      .then((res) => {
        console.log('Content from ButterCMS')
        return res.data.data
      })
      .catch((error) => {
        captureException(error)
        console.error(error)
        return []
      })
  }

  getButterArticle(slug): Promise<Article> {
    return this.butterService.post
      .retrieve(slug, { locale: 'en' })
      .then((res) => {
        return res.data.data
      })
      .catch((error) => {
        captureException(error)
        return null
      })
  }
}
