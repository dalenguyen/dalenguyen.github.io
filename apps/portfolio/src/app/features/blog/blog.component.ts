import { Router } from '@angular/router'
import { Component } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { Article } from './shared/models'
import { BlogService } from './shared/services'

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss'],
})
export class BlogComponent {
  articles$: Promise<Article[]>

  constructor(private blogService: BlogService, private router: Router, private title: Title) {
    this.title.setTitle(`Blog | Dale Nguyen`)
    this.articles$ = this.blogService.getButterArticles()
  }

  openPost(article: Article) {
    this.router.navigate(['/blog', article.slug])
  }
}
