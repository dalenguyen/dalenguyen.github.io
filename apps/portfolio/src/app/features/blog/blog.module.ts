import { CommonModule } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { MaterialModule } from '@dalenguyen/material'
import { BlogRoutingModule } from './blog-routing.module'
import { BlogComponent } from './blog.component'
import { PostComponent } from './post/post.component'
import { PostGuard } from './shared/guards'
import { BlogService, PostService } from './shared/services'

@NgModule({
  declarations: [BlogComponent, PostComponent],
  imports: [CommonModule, RouterModule, HttpClientModule, BlogRoutingModule, MaterialModule],
  providers: [BlogService, PostService, PostGuard],
})
export class BlogModule {}
