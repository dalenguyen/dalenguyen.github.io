import { Component, OnInit } from '@angular/core'
import { Alert } from './classes'
import { AlertService } from './services'

@Component({
  selector: 'dalenguyen-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  alerts: Alert[] = []

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    this.alertService.alerts.subscribe((alert) => {
      this.alerts.push(alert)
    })
  }
}
