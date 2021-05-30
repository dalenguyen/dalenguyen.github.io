import { Component, OnInit } from '@angular/core'
import { Message } from '../../../../classes/message'
@Component({
  selector: 'dalenguyen-chatroom-window',
  templateUrl: './chatroom-window.component.html',
  styleUrls: ['./chatroom-window.component.scss'],
})
export class ChatroomWindowComponent implements OnInit {
  // TODO: replace with firebase data
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

  constructor() {}

  ngOnInit(): void {}
}
