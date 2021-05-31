import { Component, OnDestroy, OnInit } from '@angular/core'
import { FormBuilder, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { Subscription } from 'rxjs'
import { Alert } from '../../classes'
import { AlertType } from '../../enums'
import { AlertService, AuthService, LoadingService } from '../../services'

@Component({
  selector: 'dalenguyen-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent implements OnInit, OnDestroy {
  signupForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  })

  protected subscriptions: Subscription[] = []

  constructor(
    private fb: FormBuilder,
    private alertService: AlertService,
    private router: Router,
    private auth: AuthService,
    private loadingService: LoadingService,
  ) {}

  ngOnInit(): void {}

  submit() {
    // TODO: call the auth service
    if (this.signupForm.valid) {
      this.loadingService.isLoading.next(true)
      const { firstName, lastName, email, password } = this.signupForm.value
      console.table({ firstName, lastName, email, password })
      this.subscriptions.push(
        this.auth.signUp(firstName, lastName, email, password).subscribe((success) => {
          if (success) {
            this.router.navigateByUrl('/chat')
          } else {
            const failedSignedUpAlert = new Alert('There was a problem signing up, try again', AlertType.Danger)
            this.alertService.alerts.next(failedSignedUpAlert)
          }
          this.loadingService.isLoading.next(false)
        }),
      )
    } else {
      const failedSignedUpAlert = new Alert('Please enter a valid name, email & password, try again', AlertType.Danger)
      this.alertService.alerts.next(failedSignedUpAlert)
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
  }
}
