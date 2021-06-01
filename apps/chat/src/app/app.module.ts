import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'

import { AppComponent } from './app.component'
import { LoginComponent } from './pages/login/login.component'
import { AppRoutingModule } from './app-routing.module'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { SignupComponent } from './pages/signup/signup.component'
import { ChatComponent } from './pages/chat/chat.component'
import { NavbarComponent } from './components/navbar/navbar.component'
import { ChatInputComponent } from './pages/chat/components/chat-input/chat-input.component'
import { ChatroomListComponent } from './pages/chat/components/chatroom-list/chatroom-list.component'
import { ChatroomTitleBarComponent } from './pages/chat/components/chatroom-title-bar/chatroom-title-bar.component'
import { ChatroomWindowComponent } from './pages/chat/components/chatroom-window/chatroom-window.component'
import { ChatMessageComponent } from './pages/chat/components/chat-message/chat-message.component'
import { AlertService, ChatroomService } from './services'
import { AlertComponent } from './components/alert/alert.component'
import { AuthGuard } from './guards/auth.guard'
import { environment } from '../environments/environment'
import { AngularFireModule } from '@angular/fire'
import { AngularFirestoreModule } from '@angular/fire/firestore'
import { AngularFireStorageModule } from '@angular/fire/storage'

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    ChatComponent,
    NavbarComponent,
    ChatInputComponent,
    ChatroomListComponent,
    ChatroomTitleBarComponent,
    ChatroomWindowComponent,
    ChatMessageComponent,
    AlertComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    // AngularFirestoreModule,
    // AngularFireStorageModule,
    // AngularFireAuthModule
  ],
  providers: [AlertService, AuthGuard, ChatroomService],
  bootstrap: [AppComponent],
})
export class AppModule {}
