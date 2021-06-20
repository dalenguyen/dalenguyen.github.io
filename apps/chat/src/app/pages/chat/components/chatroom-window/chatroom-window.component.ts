import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { AngularFirestore } from '@angular/fire/firestore'
import { ActivatedRoute } from '@angular/router'
import { Chatroom } from 'apps/chat/src/app/classes'
import { ChatroomService } from 'apps/chat/src/app/core/services'
import { Subscription } from 'rxjs'

@Component({
  selector: 'dalenguyen-chatroom-window',
  templateUrl: './chatroom-window.component.html',
  styleUrls: ['./chatroom-window.component.scss'],
})
export class ChatroomWindowComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef

  chatroom!: Chatroom
  messages$ = this.chatroomService.selectedChatroomMessages$

  protected subscriptions: Subscription[] = []

  constructor(private route: ActivatedRoute, private chatroomService: ChatroomService, private db: AngularFirestore) {
    this.subscriptions.push(
      this.chatroomService.selectedChatroom$.subscribe((chatroom) => {
        this.chatroom = chatroom as Chatroom
      }),
    )

    this.subscriptions.push(
      this.route.params.subscribe((params) => {
        const chatroomId = params['chatroomId']
        this.chatroomService.changeChatroom$.next(chatroomId)
      }),
    )
  }

  ngOnInit(): void {
    this.scrollToBottom()
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom()
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight
    } catch (error) {
      // console.log(error)
    }
  }
}
