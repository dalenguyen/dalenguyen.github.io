import { Component, Input, OnInit } from '@angular/core'
import { Message } from 'apps/chat/src/app/classes/message'

@Component({
  selector: 'dalenguyen-chat-message',
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.scss'],
})
export class ChatMessageComponent implements OnInit {
  @Input() message!: Message

  constructor() {}

  ngOnInit(): void {}
}
