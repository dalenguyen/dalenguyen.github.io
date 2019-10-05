import { Component, OnInit } from '@angular/core';
import { PostService } from './post.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss']
})
export class PostComponent implements OnInit {

  article = null

  constructor(private postService: PostService, private route: ActivatedRoute) {
    if (this.article === null) {
      const articleId = this.route.snapshot.params.id
      console.log('Get article from id', articleId)
      this.postService.getDevArticle(articleId).then(article => this.article = article)
    }
  }

  ngOnInit() {
  }

}
