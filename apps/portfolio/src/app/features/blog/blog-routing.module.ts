import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { BlogComponent } from './blog.component'
import { PostComponent } from './post/post.component'
import { PostGuard } from './shared/guards'

const routes: Routes = [
  {
    path: '',
    component: BlogComponent,
  },
  {
    path: ':slug',
    canActivate: [PostGuard],
    component: PostComponent,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BlogRoutingModule {}
