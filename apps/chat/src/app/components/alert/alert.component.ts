import { Component, Input, OnInit } from '@angular/core'
import { AlertType } from '../../enums'

@Component({
  selector: 'dalenguyen-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnInit {
  @Input() type!: AlertType
  @Input() dismissOnTimeout = 5000

  constructor() {}

  ngOnInit(): void {}
}
