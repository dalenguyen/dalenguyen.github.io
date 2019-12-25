import { Router } from '@angular/router'
import { BlogService } from './blog.service'
import { Component, OnInit } from '@angular/core'
import { Observable } from 'rxjs'

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent implements OnInit {
  articles$: Observable<any>

  constructor(private blogService: BlogService, private router: Router) {
    this.articles$ = this.blogService.getButterArticles()
  }

  ngOnInit() {}

  // TODO: add model for Article
  openPost(article: any) {
    this.router.navigate(['/blog', article.slug])
  }
}
