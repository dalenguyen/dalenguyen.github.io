import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { AngularFireAuthModule } from '@angular/fire/auth'
import { AngularFireModule } from '@angular/fire'
import { AngularFireStorageModule } from '@angular/fire/storage'
import { AngularFirestoreModule } from '@angular/fire/firestore'
import { environment } from 'apps/chat/src/environments/environment'
import { AlertService, AuthService, ChatroomService, LoadingService } from './services'

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
    AngularFireModule.initializeApp(environment.firebase),
  ],
  providers: [AuthService, LoadingService, ChatroomService, AlertService],
})
export class CoreModule {}
