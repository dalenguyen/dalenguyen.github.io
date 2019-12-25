import { Observable } from 'rxjs'
import { BlogService } from '../blog.service'
import { Component, OnInit, ViewEncapsulation } from '@angular/core'

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PostComponent implements OnInit {
  article$: Observable<any>

  constructor(private blogService: BlogService) {
    const slug = window.location.pathname.split('/')[2]
    this.article$ = this.blogService.getButterArticle(slug)
  }

  ngOnInit() {}

  // private cleanArticleContent(html: string): string {
  //   return html.replace(
  //     /https:\/\/dev.to\/dalenguyen/g,
  //     'https://dalenguyen.me/blog'
  //   )
  // }
}
