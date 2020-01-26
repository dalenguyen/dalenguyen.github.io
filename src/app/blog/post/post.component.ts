import { Title, Meta } from '@angular/platform-browser'
import { Component, OnInit, ViewEncapsulation } from '@angular/core'

import { BlogService } from '../blog.service'
import { Article } from 'src/app/shared/models/article'

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PostComponent implements OnInit {
  article: Article

  constructor(
    private blogService: BlogService,
    private title: Title,
    private meta: Meta
  ) {}

  ngOnInit() {
    // const slug = window.location.pathname.split('/')[2]
    this.article = this.blogService.currentArticle

    // Set meta tags
    this.title.setTitle(`${this.article.seo_title} | Dale Nguyen`)
    this.meta.updateTag({ name: 'og:title', content: this.article.seo_title })
    this.meta.updateTag({
      name: 'og:description',
      content: this.article.summary
    })
    this.meta.updateTag({ name: 'og:url', content: this.article.url })
    this.meta.updateTag({
      name: 'og:image',
      content: this.article.featured_image
    })
    this.meta.updateTag({ name: 'type', content: 'article' })
    this.meta.updateTag({
      name: 'keywords',
      content: this.article.categories.reduce(
        (acc, curr) => curr.name + ',' + acc,
        ''
      )
    })
  }
}
