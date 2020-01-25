import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { HomeComponent } from './home/home.component'
import { ResumeComponent } from './resume/resume.component'
import { BlogComponent } from './blog/blog.component'
import { PostComponent } from './blog/post/post.component'
import { PostGuard } from './blog/post/post.guard'

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'resume', component: ResumeComponent },
  { path: 'blog', component: BlogComponent },
  { path: 'blog/:slug', canActivate: [PostGuard], component: PostComponent },
  { path: '**', redirectTo: '' }
]

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload', initialNavigation: 'enabled' })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
