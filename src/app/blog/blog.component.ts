import { Router } from '@angular/router';
import { BlogService } from './blog.service';
import { Component, OnInit } from '@angular/core';
import { PostService } from './post/post.service';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent implements OnInit {

  articles: any = [];

  constructor(private blogService: BlogService, private router: Router) {
    this.blogService.articles.then(articles => this.articles = articles)
  }

  ngOnInit() {
  }

  // TODO: add model for Article
  openPost(article: any) {
    this.router.navigate(['/blog', article.slug], { queryParams: { id: article.id }})
  }

}
