import { Component, OnInit } from '@angular/core'

@Component({
  selector: 'dalenguyen-chat-input',
  templateUrl: './chat-input.component.html',
  styleUrls: ['./chat-input.component.scss'],
})
export class ChatInputComponent implements OnInit {
  newMessageText = ''

  constructor() {}

  ngOnInit(): void {}

  onSubmit(message: string): void {
    // TODO: save text to firebase
    console.log(message)
    this.newMessageText = ''
  }
}
