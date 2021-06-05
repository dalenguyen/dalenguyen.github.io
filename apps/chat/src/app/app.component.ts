import { Component, OnDestroy, OnInit } from '@angular/core'
import { Subscription } from 'rxjs'
import { Alert } from './classes'
import { AlertService, LoadingService } from './core/services'

@Component({
  selector: 'dalenguyen-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  alerts: Alert[] = []
  loading$ = this.loadingService.isLoading

  protected subscriptions: Subscription[] = []

  constructor(private alertService: AlertService, private loadingService: LoadingService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.alertService.alerts.subscribe((alert) => {
        this.alerts.push(alert)
      }),
    )
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
  }
}
