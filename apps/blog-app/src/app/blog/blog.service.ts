import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'

import Butter from 'buttercms'

import { Article } from './article.model'

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  devBaseUrl = 'https://dev.to/api/articles?username=dalenguyen'
  http = inject(HttpClient)
  butterService = Butter('10de8a1782f01676902398495c4062893956ac9c')

  currentArticle: Article

  get articles() {
    return this.getDevArticles()
  }

  async getDevArticles() {
    let articles: any = []
    try {
      articles = await this.http.get(this.devBaseUrl).toPromise()
    } catch (error) {
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
        console.error(error)
        return []
      })
  }

  getButterArticle(slug: string): Promise<Article> {
    return this.butterService.post
      .retrieve(slug, { locale: 'en' })
      .then((res) => {
        return res.data.data
      })
      .catch((error) => {
        console.error(error)
        return null
      })
  }
}
