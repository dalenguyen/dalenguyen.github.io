import { Component, Input, OnInit } from '@angular/core'

@Component({
  selector: 'dalenguyen-chatroom-title-bar',
  templateUrl: './chatroom-title-bar.component.html',
  styleUrls: ['./chatroom-title-bar.component.scss'],
})
export class ChatroomTitleBarComponent implements OnInit {
  @Input() title: string = ''

  constructor() {}

  ngOnInit(): void {}
}
