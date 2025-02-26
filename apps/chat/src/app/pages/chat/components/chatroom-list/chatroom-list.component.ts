import { Component, OnInit } from '@angular/core'
import { ChatroomService } from 'apps/chat/src/app/core/services'

@Component({
    selector: 'dalenguyen-chatroom-list',
    templateUrl: './chatroom-list.component.html',
    styleUrls: ['./chatroom-list.component.scss'],
    standalone: false
})
export class ChatroomListComponent implements OnInit {
  constructor(public chatroomService: ChatroomService) {}

  ngOnInit(): void {}
}
