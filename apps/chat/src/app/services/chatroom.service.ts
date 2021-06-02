import { Injectable } from '@angular/core'
import { AngularFireAuth } from '@angular/fire/auth'
import { AngularFirestore } from '@angular/fire/firestore'
import { BehaviorSubject, Observable, of } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'
import { Chatroom, Message } from '../classes'
import { AuthService } from './auth.service'

@Injectable({
  providedIn: 'root',
})
export class ChatroomService {
  chatrooms$ = this.db.collection<Chatroom>('chatrooms').valueChanges()

  changeChatroom$: BehaviorSubject<string> = new BehaviorSubject('')
  selectedChatroom$: Observable<Chatroom | null | undefined>
  selectedChatroomMessages$!: Observable<Message[]>

  constructor(private db: AngularFirestore, private afAuth: AngularFireAuth, private authService: AuthService) {
    this.selectedChatroom$ = this.changeChatroom$.pipe(
      switchMap((chatroomId) => {
        if (chatroomId !== '') {
          return db.doc<Chatroom>(`chatrooms/${chatroomId}`).valueChanges()
        }
        return of(null)
      }),
    )

    this.selectedChatroomMessages$ = this.changeChatroom$.pipe(
      switchMap((chatroomId) => {
        if (chatroomId !== '') {
          return db
            .collection<Message>(`chatrooms/${chatroomId}/messages`, (ref) => {
              return ref.orderBy('createdAt', 'desc').limit(100)
            })
            .valueChanges()
        }
        return of([])
      }),
      map((messages) => messages.reverse()),
    )
  }

  createMessage(message: string): void {
    const chatroomId = this.changeChatroom$.value
    const data = {
      message,
      createdAt: new Date().toISOString(),
      sender: this.authService.currentUserSnapshot,
    }
    this.db.collection(`chatrooms/${chatroomId}/messages`).add(data)
  }
}
