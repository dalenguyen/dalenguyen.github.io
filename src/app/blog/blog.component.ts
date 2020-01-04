import { Router } from '@angular/router'
import { BlogService } from './blog.service'
import { Component, OnInit } from '@angular/core'
import { Article } from '../shared/models/article'

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent implements OnInit {
  articles$: Promise<Article[]>

  constructor(private blogService: BlogService, private router: Router) {
    this.articles$ = this.blogService.getButterArticles()
  }

  ngOnInit() {}
  openPost(article: Article) {
    this.router.navigate(['/blog', article.slug])
  }
}
