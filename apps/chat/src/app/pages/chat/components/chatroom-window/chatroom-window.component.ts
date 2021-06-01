import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Chatroom } from 'apps/chat/src/app/classes'
import { ChatroomService, LoadingService } from 'apps/chat/src/app/services'
import { Subscription } from 'rxjs'
import { Message } from '../../../../classes/message'
@Component({
  selector: 'dalenguyen-chatroom-window',
  templateUrl: './chatroom-window.component.html',
  styleUrls: ['./chatroom-window.component.scss'],
})
export class ChatroomWindowComponent implements OnInit, OnDestroy {
  // TODO: replace with firebase data
  chatroom!: Chatroom

  dummyData: Message[] = [
    {
      message: 'asdf',
      createdAt: new Date().toDateString(),
      sender: {
        firstName: 'steve',
        lastName: 'smith',
        photoUrl: 'https://via.placeholder.com/150x150',
      },
    },
  ]

  protected subscriptions: Subscription[] = []
  constructor(
    private route: ActivatedRoute,
    private chatroomService: ChatroomService,
    private loadingService: LoadingService,
  ) {
    this.subscriptions.push(
      this.chatroomService.selectedChatroom$.subscribe((chatroom) => {
        this.chatroom = chatroom as Chatroom
        this.loadingService.isLoading.next(false)
      }),
    )

    this.subscriptions.push(
      this.route.params.subscribe((params) => {
        const chatroomId = params['chatroomId']
        this.chatroomService.changeChatroom$.next(chatroomId)
      }),
    )
  }

  ngOnInit(): void {}

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
  }
}
