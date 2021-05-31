import { Component, OnDestroy, OnInit } from '@angular/core'
import { FormBuilder, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { Subscription } from 'rxjs'
import { Alert } from '../../classes'
import { AlertType } from '../../enums'
import { AlertService, AuthService, LoadingService } from '../../services'

@Component({
  selector: 'dalenguyen-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  })

  private returnUrl: string
  protected subscriptions: Subscription[] = []

  constructor(
    private fb: FormBuilder,
    private alertService: AlertService,
    private loadingService: LoadingService,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
  ) {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/chat'
  }

  ngOnInit(): void {}

  submit() {
    if (this.loginForm.valid) {
      this.loadingService.isLoading.next(true)
      const { email, password } = this.loginForm.value
      console.table({ email, password })
      this.subscriptions.push(
        this.auth.login(email, password).subscribe((success) => {
          if (success) {
            this.router.navigateByUrl(this.returnUrl)
          }
          this.loadingService.isLoading.next(false)
        }),
      )
    } else {
      const failedLoginAlert = new Alert('Your email or password were invalid, try again', AlertType.Danger)
      this.alertService.alerts.next(failedLoginAlert)
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
  }
}
