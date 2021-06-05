import { NgModule } from '@angular/core'
import { Params, RouterModule, Routes } from '@angular/router'
import { AuthGuard } from './guards/auth.guard'
import { ChatComponent } from './pages/chat/chat.component'
import { EditProfileComponent } from './pages/edit-profile/edit-profile.component'
import { LoginComponent } from './pages/login/login.component'
import { ProfileComponent } from './pages/profile/profile.component'
import { SignupComponent } from './pages/signup/signup.component'
import {
  AngularFireAuthGuard,
  hasCustomClaim,
  redirectUnauthorizedTo,
  redirectLoggedInTo,
  canActivate,
} from '@angular/fire/auth-guard'
import { map } from 'rxjs/operators'
import firebase from 'firebase/app'

const redirectLoggedInToChat = () => redirectLoggedInTo(['chat'])
const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login'])
const onlyAllowSelf = (next: Params) => map((user: any) => !!user && next.params.userId === user.uid)

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/login' },
  {
    path: 'login',
    component: LoginComponent,
    ...canActivate(redirectLoggedInToChat),
  },
  {
    path: 'signup',
    component: SignupComponent,
    ...canActivate(redirectLoggedInToChat),
  },
  {
    path: 'chat',
    ...canActivate(redirectUnauthorizedToLogin),
    children: [
      {
        path: '',
        component: ChatComponent,
      },
      {
        path: ':chatroomId',
        component: ChatComponent,
      },
    ],
  },
  {
    path: 'profile/:userId',
    component: ProfileComponent,
    ...canActivate(redirectUnauthorizedToLogin),
  },
  {
    path: 'profile/:userId/edit',
    component: EditProfileComponent,
    ...canActivate(onlyAllowSelf),
  },
  {
    path: '**',
    redirectTo: '/login',
  },
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
