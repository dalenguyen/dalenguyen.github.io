import { PostService } from './post.service';
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PostComponent implements OnInit {

  article = null
  articleBody = null

  constructor(private postService: PostService, private route: ActivatedRoute) {
    if (this.article === null) {
      const articleId = this.route.snapshot.queryParams.id
      // console.log('Get article from id', articleId)
      this.postService.getDevArticle(articleId).then(article => {
        this.article = article
        this.articleBody = this.cleanArticleContent(this.article.body_html)
        // console.log(this.articleBody);
      })
    }
  }

  ngOnInit() {
  }

  private cleanArticleContent(html: string): string {
    return html.replace('https://dev.to/dalenguyen', 'https://dalenguyen.me/blog')
  }

}
