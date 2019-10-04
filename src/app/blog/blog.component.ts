import { Component, OnInit } from '@angular/core';
import { BlogService } from './blog.service';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent implements OnInit {

  articles: any = [];

  constructor(private blogService: BlogService) {
    this.blogService.articles.then(articles => this.articles = articles)
  }

  ngOnInit() {
  }

}
