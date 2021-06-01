import { Component, OnInit } from '@angular/core'
import { ChatroomService } from 'apps/chat/src/app/services'

@Component({
  selector: 'dalenguyen-chatroom-list',
  templateUrl: './chatroom-list.component.html',
  styleUrls: ['./chatroom-list.component.scss'],
})
export class ChatroomListComponent implements OnInit {
  constructor(public chatroomService: ChatroomService) {}

  ngOnInit(): void {}
}
