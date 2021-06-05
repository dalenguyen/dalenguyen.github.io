import { Component, OnInit } from '@angular/core'
import { ChatroomService } from 'apps/chat/src/app/core/services'

@Component({
  selector: 'dalenguyen-chat-input',
  templateUrl: './chat-input.component.html',
  styleUrls: ['./chat-input.component.scss'],
})
export class ChatInputComponent implements OnInit {
  newMessageText = ''

  constructor(private chatroomService: ChatroomService) {}

  ngOnInit(): void {}

  onSubmit(message: string): void {
    this.chatroomService.createMessage(message)
    this.newMessageText = ''
  }
}
