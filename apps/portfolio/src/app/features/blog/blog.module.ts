import { CommonModule } from '@angular/common'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { BlogRoutingModule } from './blog-routing.module'
import { BlogComponent } from './blog.component'
import { PostComponent } from './post/post.component'
import { PostGuard } from './shared/guards'
import { BlogService, PostService } from './shared/services'

@NgModule({
  declarations: [BlogComponent, PostComponent],
  imports: [CommonModule, RouterModule, BlogRoutingModule],
  providers: [BlogService, PostService, PostGuard, provideHttpClient(withInterceptorsFromDi())],
})
export class BlogModule {}
