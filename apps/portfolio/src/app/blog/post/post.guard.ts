import { Injectable } from '@angular/core'
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router'
import { BlogService } from '../blog.service'

@Injectable()
export class PostGuard implements CanActivate {
  constructor(private blogService: BlogService) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    const slug = state.url.split('/')[2]
    if (
      this.blogService.currentArticle &&
      this.blogService.currentArticle.slug === slug
    ) {
      console.log(`Get article from cache...`)
      return Promise.resolve(true)
    } else {
      console.log(`Get article from api...`)
      return this.blogService.getButterArticle(slug).then(article => {
        if (article) {
          this.blogService.currentArticle = article
          return true
        } else {
          return false
        }
      })
    }
  }
}
