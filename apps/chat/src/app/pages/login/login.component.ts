import { Component, OnInit } from '@angular/core'
import { FormBuilder, Validators } from '@angular/forms'
import { Alert } from '../../classes'
import { AlertType } from '../../enums'
import { AlertService } from '../../services'

@Component({
  selector: 'dalenguyen-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  })

  constructor(private fb: FormBuilder, private alertService: AlertService) {}

  ngOnInit(): void {}

  submit() {
    // TODO: call the auth service
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value
      console.table({ email, password })
    } else {
      const failedLoginAlert = new Alert('Your email or password were invalid, try again', AlertType.Danger)
      this.alertService.alerts.next(failedLoginAlert)
    }
  }
}
