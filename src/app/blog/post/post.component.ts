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
    const slug = window.location.pathname.split('/')[2]
    this.article = this.blogService.currentArticle

    // Set meta tags
    this.title.setTitle(`${this.article.seo_title} | Dale Nguyen`)
    this.meta.addTags([
      { name: 'og:title', content: this.article.seo_title },
      { name: 'og:description', content: this.article.summary },
      { name: 'og:url', content: this.article.url },
      { name: 'og:image', content: this.article.featured_image },
      {
        name: 'keywords',
        content: this.article.categories.reduce(
          (acc, curr) => curr.name + ',' + acc,
          ''
        )
      }
    ])
  }
}
