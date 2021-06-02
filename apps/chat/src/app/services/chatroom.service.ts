import { Injectable } from '@angular/core'
import { AngularFirestore } from '@angular/fire/firestore'
import { BehaviorSubject, Observable, of } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import { Chatroom, Message } from '../classes'
import { LoadingService } from './loading.service'

@Injectable({
  providedIn: 'root',
})
export class ChatroomService {
  chatrooms$ = this.db.collection<Chatroom>('chatrooms').valueChanges()

  changeChatroom$: BehaviorSubject<string> = new BehaviorSubject('')
  selectedChatroom$: Observable<Chatroom | null | undefined>
  selectedChatroomMessages$!: Observable<Message[]>

  constructor(private db: AngularFirestore, private loadingService: LoadingService) {
    this.selectedChatroom$ = this.changeChatroom$.pipe(
      switchMap((chatroomId) => {
        if (chatroomId !== '') {
          this.loadingService.isLoading.next(true)
          return db.doc<Chatroom>(`chatrooms/${chatroomId}`).valueChanges()
        }
        return of(null)
      }),
    )

    this.selectedChatroomMessages$ = this.changeChatroom$.pipe(
      switchMap((chatroomId) => {
        if (chatroomId !== '') {
          this.loadingService.isLoading.next(true)
          return db.collection<Message>(`chatrooms/${chatroomId}/messages`).valueChanges()
        }
        return of([])
      }),
    )
  }
}
