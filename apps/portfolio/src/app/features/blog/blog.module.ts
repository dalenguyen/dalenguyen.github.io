import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'

import { BlogRoutingModule } from './blog-routing.module'
import { BlogComponent } from './blog.component'
import { PostComponent } from './post/post.component'
import { BlogService, PostService } from './shared/services'
import { PostGuard } from './shared/guards'
import { MaterialModule } from '../../shared/modules/material.module'

@NgModule({
  declarations: [BlogComponent, PostComponent],
  imports: [CommonModule, RouterModule, BlogRoutingModule, MaterialModule],
  providers: [BlogService, PostService, PostGuard],
})
export class BlogModule {}
