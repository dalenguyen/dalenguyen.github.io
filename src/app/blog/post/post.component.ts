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
  article$: Promise<any>

  constructor(
    private blogService: BlogService,
    private title: Title,
    private meta: Meta
  ) {}

  ngOnInit() {
    const slug = window.location.pathname.split('/')[2]
    this.article$ = this.blogService.getButterArticle(slug)

    this.blogService.getButterArticle(slug).then((article: Article) => {
      this.title.setTitle(`${article.seo_title} | Dale Nguyen`)
      this.meta.addTags([
        { name: 'og:title', content: article.seo_title },
        { name: 'og:description', content: article.summary },
        { name: 'og:url', content: article.url },
        { name: 'og:image', content: article.featured_image },
        {
          name: 'keywords',
          content: article.categories.reduce(
            (acc, curr) => curr.name + ',' + acc,
            ''
          )
        }
      ])
    })
  }
}
